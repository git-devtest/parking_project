-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 17-11-2025 a las 19:58:55
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `parking_system`
--
CREATE DATABASE IF NOT EXISTS `parking_system` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `parking_system`;

DELIMITER $$
--
-- Procedimientos
--
DROP PROCEDURE IF EXISTS `RegisterVehicleEntry`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `RegisterVehicleEntry` (IN `p_plateNumber` VARCHAR(20), IN `p_vehicleType` VARCHAR(20), IN `p_user` VARCHAR(100))   BEGIN
    DECLARE v_vehicle_id VARCHAR(50);
    DECLARE v_session_id VARCHAR(50);
    DECLARE v_capacity INT;
    DECLARE v_current INT;
    DECLARE v_currently_parked INT;

    -- Verificar capacidad
    SELECT maxCapacity, currentCount INTO v_capacity, v_current
    FROM ParkingCapacity WHERE vehicleType = p_vehicleType;

    -- Verificar si el vehículo ya está estacionado
    SELECT COUNT(*) INTO v_currently_parked
    FROM Vehicle 
    WHERE plateNumber = p_plateNumber AND status = 'PARKED';

    IF v_current >= v_capacity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No hay espacios disponibles para este tipo de vehículo';
    ELSEIF v_currently_parked > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Este vehículo ya se encuentra estacionado';
    ELSE
        -- Insertar vehículo
        SET v_vehicle_id = UUID();
        INSERT INTO Vehicle (id, plateNumber, vehicleType, status, entryTime)
        VALUES (v_vehicle_id, p_plateNumber, p_vehicleType, 'PARKED', NOW());

        -- Insertar sesión
        SET v_session_id = UUID();
        INSERT INTO ParkingSession (id, vehicleId, plateNumber, vehicleType, entryTime, status)
        VALUES (v_session_id, v_vehicle_id, p_plateNumber, p_vehicleType, NOW(), 'ACTIVE');

        -- Actualizar capacidad
        UPDATE ParkingCapacity 
        SET currentCount = currentCount + 1 
        WHERE vehicleType = p_vehicleType;

        -- ✅ Registro en auditoría
        INSERT INTO audit_log (
            usuario, accion, tabla_afectada, registro_id, 
            sql_ejecutado, sql_rollback, ip_cliente
        )
        VALUES (
            p_user,
            'INSERT',
            'Vehicle/ParkingSession',
            v_vehicle_id,  -- ID del vehículo creado
            CONCAT(
                'INSERT INTO Vehicle (id, plateNumber, vehicleType, status, entryTime) VALUES ("', 
                v_vehicle_id, '","', p_plateNumber, '","', p_vehicleType, '","PARKED","', NOW(), '"); '
            ),
            CONCAT(
                'DELETE FROM Vehicle WHERE id="', v_vehicle_id, '"; ',
                'DELETE FROM ParkingSession WHERE vehicleId="', v_vehicle_id, '"; ',
                'UPDATE ParkingCapacity SET currentCount = currentCount - 1 WHERE vehicleType="', p_vehicleType, '";'
            ),
            SUBSTRING_INDEX(USER(), '@', -1)
        );

        SELECT v_vehicle_id AS vehicleId, p_plateNumber AS plateNumber, 'Entrada registrada exitosamente' AS message;
    END IF;
END$$

DROP PROCEDURE IF EXISTS `RegisterVehicleExit`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `RegisterVehicleExit` (IN `p_plateNumber` VARCHAR(20), IN `p_user` VARCHAR(100))   BEGIN
    DECLARE v_vehicle_id VARCHAR(50);
    DECLARE v_vehicle_type VARCHAR(20);
    DECLARE v_entry_time DATETIME;
    DECLARE v_duration_min INT;
    DECLARE v_amount DECIMAL(10,2);
    DECLARE v_hourly_rate DECIMAL(10,2);
    DECLARE v_daily_rate DECIMAL(10,2);

    -- Obtener datos del vehículo
    SELECT id, vehicleType, entryTime INTO v_vehicle_id, v_vehicle_type, v_entry_time
    FROM Vehicle 
    WHERE plateNumber = p_plateNumber AND status = 'PARKED';

    IF v_vehicle_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vehículo no encontrado o ya salió';
    ELSE
        -- Calcular duración
        SET v_duration_min = TIMESTAMPDIFF(MINUTE, v_entry_time, NOW());

        -- Obtener tarifas
        SELECT hourlyRate, dailyRate INTO v_hourly_rate, v_daily_rate
        FROM ParkingRate WHERE vehicleType = v_vehicle_type;

        -- Calcular monto
        IF v_duration_min <= 60 THEN
            SET v_amount = v_hourly_rate;
        ELSEIF v_duration_min <= 1440 THEN
            SET v_amount = CEIL(v_duration_min / 60.0) * v_hourly_rate;
        ELSE
            SET v_amount = CEIL(v_duration_min / 1440.0) * v_daily_rate;
        END IF;

        -- Actualizar vehículo
        UPDATE Vehicle 
        SET exitTime = NOW(), 
            status = 'EXITED', 
            totalAmount = v_amount,
            updatedAt = NOW()
        WHERE id = v_vehicle_id;

        -- Actualizar sesión
        UPDATE ParkingSession 
        SET exitTime = NOW(),
            duration = v_duration_min,
            amount = v_amount,
            status = 'COMPLETED',
            updatedAt = NOW()
        WHERE vehicleId = v_vehicle_id AND status = 'ACTIVE';

        -- Actualizar capacidad
        UPDATE ParkingCapacity 
        SET currentCount = currentCount - 1 
        WHERE vehicleType = v_vehicle_type;

        -- ✅ Registro en auditoría
        INSERT INTO audit_log (
            usuario, accion, tabla_afectada, registro_id,
            sql_ejecutado, sql_rollback, ip_cliente
        )
        VALUES (
            p_user,
            'UPDATE',
            'Vehicle/ParkingSession',
            v_vehicle_id,
            CONCAT(
                'UPDATE Vehicle SET exitTime="', NOW(), '", status="EXITED", totalAmount=', v_amount, 
                ' WHERE id="', v_vehicle_id, '"; ',
                'UPDATE ParkingSession SET exitTime="', NOW(), '", duration=', v_duration_min,
                ', amount=', v_amount, ', status="COMPLETED" WHERE vehicleId="', v_vehicle_id, '"; ',
                'UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType="', v_vehicle_type, '";'),
            CONCAT(
                'UPDATE Vehicle SET exitTime=NULL, status="PARKED", totalAmount=NULL WHERE id="', v_vehicle_id, '"; ',
                'UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status="ACTIVE" WHERE vehicleId="', v_vehicle_id, '"; ',
                'UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType="', v_vehicle_type, '";'
            ),
            SUBSTRING_INDEX(USER(), '@', -1)
        );

        SELECT 
            v_vehicle_id AS vehicleId,
            p_plateNumber AS plateNumber,
            v_duration_min AS durationMinutes,
            v_amount AS totalAmount,
            'Salida registrada exitosamente' AS message;
    END IF;
END$$

--
-- Funciones
--
DROP FUNCTION IF EXISTS `GetDateRange`$$
CREATE DEFINER=`root`@`localhost` FUNCTION `GetDateRange` (`range_type` VARCHAR(20)) RETURNS DATE DETERMINISTIC BEGIN
    RETURN CASE 
        WHEN range_type = 'today' THEN CURDATE()
        WHEN range_type = 'last_week' THEN DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        WHEN range_type = 'last_month' THEN DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
        ELSE CURDATE()
    END;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
CREATE TABLE `audit_log` (
  `id` bigint(20) NOT NULL,
  `usuario` varchar(100) NOT NULL,
  `accion` varchar(50) NOT NULL,
  `tabla_afectada` varchar(100) NOT NULL,
  `registro_id` bigint(20) DEFAULT NULL,
  `sql_ejecutado` text NOT NULL,
  `sql_rollback` text DEFAULT NULL,
  `ip_cliente` varchar(50) DEFAULT NULL,
  `fecha_evento` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `audit_log`
--

INSERT INTO `audit_log` (`id`, `usuario`, `accion`, `tabla_afectada`, `registro_id`, `sql_ejecutado`, `sql_rollback`, `ip_cliente`, `fecha_evento`) VALUES
(1, 'admin', 'UPDATE', 'Vehicle/ParkingSession', 29, 'UPDATE Vehicle SET exitTime=\"2025-11-14 21:47:21\", status=\"EXITED\", totalAmount=80.00 WHERE id=\"29ba4b02-c1ad-11f0-9387-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=\"2025-11-14 21:47:21\", duration=230, amount=80.00, status=\"COMPLETED\" WHERE vehicleId=\"29ba4b02-c1ad-11f0-9387-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType=\"CAR\";', 'UPDATE Vehicle SET exitTime=NULL, status=\"PARKED\", totalAmount=NULL WHERE id=\"29ba4b02-c1ad-11f0-9387-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status=\"ACTIVE\" WHERE vehicleId=\"29ba4b02-c1ad-11f0-9387-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType=\"CAR\";', 'localhost', '2025-11-15 02:47:21'),
(2, 'admin', 'UPDATE', 'Vehicle/ParkingSession', 29, 'UPDATE Vehicle SET exitTime=\"2025-11-14 21:48:01\", status=\"EXITED\", totalAmount=40.00 WHERE id=\"29c00346-c1ad-11f0-9387-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=\"2025-11-14 21:48:01\", duration=231, amount=40.00, status=\"COMPLETED\" WHERE vehicleId=\"29c00346-c1ad-11f0-9387-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType=\"MOTORCYCLE\";', 'UPDATE Vehicle SET exitTime=NULL, status=\"PARKED\", totalAmount=NULL WHERE id=\"29c00346-c1ad-11f0-9387-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status=\"ACTIVE\" WHERE vehicleId=\"29c00346-c1ad-11f0-9387-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType=\"MOTORCYCLE\";', 'localhost', '2025-11-15 02:48:01'),
(3, 'admin', 'UPDATE', 'Vehicle/ParkingSession', 29, 'UPDATE Vehicle SET exitTime=\"2025-11-14 21:48:04\", status=\"EXITED\", totalAmount=160.00 WHERE id=\"29c005ae-c1ad-11f0-9387-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=\"2025-11-14 21:48:04\", duration=231, amount=160.00, status=\"COMPLETED\" WHERE vehicleId=\"29c005ae-c1ad-11f0-9387-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType=\"TRUCK\";', 'UPDATE Vehicle SET exitTime=NULL, status=\"PARKED\", totalAmount=NULL WHERE id=\"29c005ae-c1ad-11f0-9387-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status=\"ACTIVE\" WHERE vehicleId=\"29c005ae-c1ad-11f0-9387-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType=\"TRUCK\";', 'localhost', '2025-11-15 02:48:04'),
(4, 'admin', 'INSERT', 'Vehicle/ParkingSession', 0, 'INSERT INTO Vehicle (id, plateNumber, vehicleType, status, entryTime) VALUES (\"f95bb5ef-c1cd-11f0-ad5e-7427eaf2ac34\",\"ABC123\",\"CAR\",\"PARKED\",\"2025-11-14 21:51:24\"); ', 'DELETE FROM Vehicle WHERE id=\"f95bb5ef-c1cd-11f0-ad5e-7427eaf2ac34\"; DELETE FROM ParkingSession WHERE vehicleId=\"f95bb5ef-c1cd-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount = currentCount - 1 WHERE vehicleType=\"CAR\";', 'localhost', '2025-11-15 02:51:24'),
(5, 'admin', 'INSERT', 'Vehicle/ParkingSession', 50, 'INSERT INTO Vehicle (id, plateNumber, vehicleType, status, entryTime) VALUES (\"50f7efa4-c1ce-11f0-ad5e-7427eaf2ac34\",\"OVF546\",\"MOTORCYCLE\",\"PARKED\",\"2025-11-14 21:53:51\"); ', 'DELETE FROM Vehicle WHERE id=\"50f7efa4-c1ce-11f0-ad5e-7427eaf2ac34\"; DELETE FROM ParkingSession WHERE vehicleId=\"50f7efa4-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount = currentCount - 1 WHERE vehicleType=\"MOTORCYCLE\";', 'localhost', '2025-11-15 02:53:51'),
(6, 'admin', 'INSERT', 'Vehicle/ParkingSession', 55, 'INSERT INTO Vehicle (id, plateNumber, vehicleType, status, entryTime) VALUES (\"55c9cb9a-c1ce-11f0-ad5e-7427eaf2ac34\",\"FTY18F\",\"TRUCK\",\"PARKED\",\"2025-11-14 21:53:59\"); ', 'DELETE FROM Vehicle WHERE id=\"55c9cb9a-c1ce-11f0-ad5e-7427eaf2ac34\"; DELETE FROM ParkingSession WHERE vehicleId=\"55c9cb9a-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount = currentCount - 1 WHERE vehicleType=\"TRUCK\";', 'localhost', '2025-11-15 02:53:59'),
(7, 'admin', 'INSERT', 'Vehicle/ParkingSession', 0, 'INSERT INTO Vehicle (id, plateNumber, vehicleType, status, entryTime) VALUES (\"dc858ccf-c1ce-11f0-ad5e-7427eaf2ac34\",\"TEST789\",\"CAR\",\"PARKED\",\"2025-11-14 21:57:45\"); ', 'DELETE FROM Vehicle WHERE id=\"dc858ccf-c1ce-11f0-ad5e-7427eaf2ac34\"; DELETE FROM ParkingSession WHERE vehicleId=\"dc858ccf-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount = currentCount - 1 WHERE vehicleType=\"CAR\";', 'localhost', '2025-11-15 02:57:45'),
(8, 'admin', 'INSERT', 'Vehicle/ParkingSession', 0, 'INSERT INTO Vehicle (id, plateNumber, vehicleType, status, entryTime) VALUES (\"df09d285-c1ce-11f0-ad5e-7427eaf2ac34\",\"TEST999\",\"CAR\",\"PARKED\",\"2025-11-14 21:57:49\"); ', 'DELETE FROM Vehicle WHERE id=\"df09d285-c1ce-11f0-ad5e-7427eaf2ac34\"; DELETE FROM ParkingSession WHERE vehicleId=\"df09d285-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount = currentCount - 1 WHERE vehicleType=\"CAR\";', 'localhost', '2025-11-15 02:57:49'),
(9, 'admin', 'INSERT', 'Vehicle/ParkingSession', 0, 'INSERT INTO Vehicle (id, plateNumber, vehicleType, status, entryTime) VALUES (\"e5e1c1a1-c1ce-11f0-ad5e-7427eaf2ac34\",\"JHK150\",\"TRUCK\",\"PARKED\",\"2025-11-14 21:58:01\"); ', 'DELETE FROM Vehicle WHERE id=\"e5e1c1a1-c1ce-11f0-ad5e-7427eaf2ac34\"; DELETE FROM ParkingSession WHERE vehicleId=\"e5e1c1a1-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount = currentCount - 1 WHERE vehicleType=\"TRUCK\";', 'localhost', '2025-11-15 02:58:01'),
(10, 'admin', 'UPDATE', 'Vehicle/ParkingSession', 50, 'UPDATE Vehicle SET exitTime=\"2025-11-14 21:59:47\", status=\"EXITED\", totalAmount=10.00 WHERE id=\"50f7efa4-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=\"2025-11-14 21:59:47\", duration=5, amount=10.00, status=\"COMPLETED\" WHERE vehicleId=\"50f7efa4-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType=\"MOTORCYCLE\";', 'UPDATE Vehicle SET exitTime=NULL, status=\"PARKED\", totalAmount=NULL WHERE id=\"50f7efa4-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status=\"ACTIVE\" WHERE vehicleId=\"50f7efa4-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType=\"MOTORCYCLE\";', 'localhost', '2025-11-15 02:59:47'),
(11, 'admin', 'UPDATE', 'Vehicle/ParkingSession', 55, 'UPDATE Vehicle SET exitTime=\"2025-11-14 21:59:50\", status=\"EXITED\", totalAmount=40.00 WHERE id=\"55c9cb9a-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=\"2025-11-14 21:59:50\", duration=5, amount=40.00, status=\"COMPLETED\" WHERE vehicleId=\"55c9cb9a-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType=\"TRUCK\";', 'UPDATE Vehicle SET exitTime=NULL, status=\"PARKED\", totalAmount=NULL WHERE id=\"55c9cb9a-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status=\"ACTIVE\" WHERE vehicleId=\"55c9cb9a-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType=\"TRUCK\";', 'localhost', '2025-11-15 02:59:50'),
(12, 'admin', 'UPDATE', 'Vehicle/ParkingSession', 0, 'UPDATE Vehicle SET exitTime=\"2025-11-14 21:59:51\", status=\"EXITED\", totalAmount=20.00 WHERE id=\"f95bb5ef-c1cd-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=\"2025-11-14 21:59:51\", duration=8, amount=20.00, status=\"COMPLETED\" WHERE vehicleId=\"f95bb5ef-c1cd-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType=\"CAR\";', 'UPDATE Vehicle SET exitTime=NULL, status=\"PARKED\", totalAmount=NULL WHERE id=\"f95bb5ef-c1cd-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status=\"ACTIVE\" WHERE vehicleId=\"f95bb5ef-c1cd-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType=\"CAR\";', 'localhost', '2025-11-15 02:59:51'),
(13, 'admin', 'UPDATE', 'Vehicle/ParkingSession', 0, 'UPDATE Vehicle SET exitTime=\"2025-11-14 22:00:06\", status=\"EXITED\", totalAmount=40.00 WHERE id=\"e5e1c1a1-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=\"2025-11-14 22:00:06\", duration=2, amount=40.00, status=\"COMPLETED\" WHERE vehicleId=\"e5e1c1a1-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType=\"TRUCK\";', 'UPDATE Vehicle SET exitTime=NULL, status=\"PARKED\", totalAmount=NULL WHERE id=\"e5e1c1a1-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status=\"ACTIVE\" WHERE vehicleId=\"e5e1c1a1-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType=\"TRUCK\";', 'localhost', '2025-11-15 03:00:06'),
(14, 'admin', 'UPDATE', 'Vehicle/ParkingSession', 0, 'UPDATE Vehicle SET exitTime=\"2025-11-14 22:00:08\", status=\"EXITED\", totalAmount=20.00 WHERE id=\"df09d285-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=\"2025-11-14 22:00:08\", duration=2, amount=20.00, status=\"COMPLETED\" WHERE vehicleId=\"df09d285-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType=\"CAR\";', 'UPDATE Vehicle SET exitTime=NULL, status=\"PARKED\", totalAmount=NULL WHERE id=\"df09d285-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status=\"ACTIVE\" WHERE vehicleId=\"df09d285-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType=\"CAR\";', 'localhost', '2025-11-15 03:00:08'),
(15, 'admin', 'UPDATE', 'Vehicle/ParkingSession', 0, 'UPDATE Vehicle SET exitTime=\"2025-11-14 22:00:09\", status=\"EXITED\", totalAmount=20.00 WHERE id=\"dc858ccf-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=\"2025-11-14 22:00:09\", duration=2, amount=20.00, status=\"COMPLETED\" WHERE vehicleId=\"dc858ccf-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType=\"CAR\";', 'UPDATE Vehicle SET exitTime=NULL, status=\"PARKED\", totalAmount=NULL WHERE id=\"dc858ccf-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status=\"ACTIVE\" WHERE vehicleId=\"dc858ccf-c1ce-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType=\"CAR\";', 'localhost', '2025-11-15 03:00:09'),
(16, 'admin', 'INSERT', 'Vehicle/ParkingSession', 50, 'INSERT INTO Vehicle (id, plateNumber, vehicleType, status, entryTime) VALUES (\"50b5c2a8-c1cf-11f0-ad5e-7427eaf2ac34\",\"ABC123\",\"MOTORCYCLE\",\"PARKED\",\"2025-11-14 22:01:00\"); ', 'DELETE FROM Vehicle WHERE id=\"50b5c2a8-c1cf-11f0-ad5e-7427eaf2ac34\"; DELETE FROM ParkingSession WHERE vehicleId=\"50b5c2a8-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount = currentCount - 1 WHERE vehicleType=\"MOTORCYCLE\";', 'localhost', '2025-11-15 03:01:00'),
(17, 'admin', 'INSERT', 'Vehicle/ParkingSession', 8534, 'INSERT INTO Vehicle (id, plateNumber, vehicleType, status, entryTime) VALUES (\"8534d956-c1cf-11f0-ad5e-7427eaf2ac34\",\"OVF546\",\"TRUCK\",\"PARKED\",\"2025-11-14 22:02:28\"); ', 'DELETE FROM Vehicle WHERE id=\"8534d956-c1cf-11f0-ad5e-7427eaf2ac34\"; DELETE FROM ParkingSession WHERE vehicleId=\"8534d956-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount = currentCount - 1 WHERE vehicleType=\"TRUCK\";', 'localhost', '2025-11-15 03:02:28'),
(18, 'admin', 'INSERT', 'Vehicle/ParkingSession', 87, 'INSERT INTO Vehicle (id, plateNumber, vehicleType, status, entryTime) VALUES (\"87ca02d1-c1cf-11f0-ad5e-7427eaf2ac34\",\"JHK150\",\"TRUCK\",\"PARKED\",\"2025-11-14 22:02:32\"); ', 'DELETE FROM Vehicle WHERE id=\"87ca02d1-c1cf-11f0-ad5e-7427eaf2ac34\"; DELETE FROM ParkingSession WHERE vehicleId=\"87ca02d1-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount = currentCount - 1 WHERE vehicleType=\"TRUCK\";', 'localhost', '2025-11-15 03:02:32'),
(19, 'admin', 'INSERT', 'Vehicle/ParkingSession', 8, 'INSERT INTO Vehicle (id, plateNumber, vehicleType, status, entryTime) VALUES (\"8a3c6119-c1cf-11f0-ad5e-7427eaf2ac34\",\"FTY18F\",\"MOTORCYCLE\",\"PARKED\",\"2025-11-14 22:02:37\"); ', 'DELETE FROM Vehicle WHERE id=\"8a3c6119-c1cf-11f0-ad5e-7427eaf2ac34\"; DELETE FROM ParkingSession WHERE vehicleId=\"8a3c6119-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount = currentCount - 1 WHERE vehicleType=\"MOTORCYCLE\";', 'localhost', '2025-11-15 03:02:37'),
(20, 'admin', 'INSERT', 'Vehicle/ParkingSession', 0, 'INSERT INTO Vehicle (id, plateNumber, vehicleType, status, entryTime) VALUES (\"a1c4f5e7-c1cf-11f0-ad5e-7427eaf2ac34\",\"TEST789\",\"TRUCK\",\"PARKED\",\"2025-11-14 22:03:16\"); ', 'DELETE FROM Vehicle WHERE id=\"a1c4f5e7-c1cf-11f0-ad5e-7427eaf2ac34\"; DELETE FROM ParkingSession WHERE vehicleId=\"a1c4f5e7-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount = currentCount - 1 WHERE vehicleType=\"TRUCK\";', 'localhost', '2025-11-15 03:03:16'),
(21, 'admin', 'INSERT', 'Vehicle/ParkingSession', 0, 'INSERT INTO Vehicle (id, plateNumber, vehicleType, status, entryTime) VALUES (\"a48f9b1a-c1cf-11f0-ad5e-7427eaf2ac34\",\"TEST999\",\"MOTORCYCLE\",\"PARKED\",\"2025-11-14 22:03:21\"); ', 'DELETE FROM Vehicle WHERE id=\"a48f9b1a-c1cf-11f0-ad5e-7427eaf2ac34\"; DELETE FROM ParkingSession WHERE vehicleId=\"a48f9b1a-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount = currentCount - 1 WHERE vehicleType=\"MOTORCYCLE\";', 'localhost', '2025-11-15 03:03:21'),
(22, 'admin', 'UPDATE', 'Vehicle/ParkingSession', 0, 'UPDATE Vehicle SET exitTime=\"2025-11-14 23:08:15\", status=\"EXITED\", totalAmount=20.00 WHERE id=\"a48f9b1a-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=\"2025-11-14 23:08:15\", duration=64, amount=20.00, status=\"COMPLETED\" WHERE vehicleId=\"a48f9b1a-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType=\"MOTORCYCLE\";', 'UPDATE Vehicle SET exitTime=NULL, status=\"PARKED\", totalAmount=NULL WHERE id=\"a48f9b1a-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status=\"ACTIVE\" WHERE vehicleId=\"a48f9b1a-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType=\"MOTORCYCLE\";', 'localhost', '2025-11-15 04:08:15'),
(23, 'admin', 'UPDATE', 'Vehicle/ParkingSession', 0, 'UPDATE Vehicle SET exitTime=\"2025-11-14 23:08:16\", status=\"EXITED\", totalAmount=80.00 WHERE id=\"a1c4f5e7-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=\"2025-11-14 23:08:16\", duration=65, amount=80.00, status=\"COMPLETED\" WHERE vehicleId=\"a1c4f5e7-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType=\"TRUCK\";', 'UPDATE Vehicle SET exitTime=NULL, status=\"PARKED\", totalAmount=NULL WHERE id=\"a1c4f5e7-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status=\"ACTIVE\" WHERE vehicleId=\"a1c4f5e7-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType=\"TRUCK\";', 'localhost', '2025-11-15 04:08:16'),
(24, 'admin', 'UPDATE', 'Vehicle/ParkingSession', 8, 'UPDATE Vehicle SET exitTime=\"2025-11-14 23:08:17\", status=\"EXITED\", totalAmount=20.00 WHERE id=\"8a3c6119-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=\"2025-11-14 23:08:17\", duration=65, amount=20.00, status=\"COMPLETED\" WHERE vehicleId=\"8a3c6119-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType=\"MOTORCYCLE\";', 'UPDATE Vehicle SET exitTime=NULL, status=\"PARKED\", totalAmount=NULL WHERE id=\"8a3c6119-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status=\"ACTIVE\" WHERE vehicleId=\"8a3c6119-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType=\"MOTORCYCLE\";', 'localhost', '2025-11-15 04:08:17'),
(25, 'admin', 'UPDATE', 'Vehicle/ParkingSession', 87, 'UPDATE Vehicle SET exitTime=\"2025-11-14 23:08:18\", status=\"EXITED\", totalAmount=80.00 WHERE id=\"87ca02d1-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=\"2025-11-14 23:08:18\", duration=65, amount=80.00, status=\"COMPLETED\" WHERE vehicleId=\"87ca02d1-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType=\"TRUCK\";', 'UPDATE Vehicle SET exitTime=NULL, status=\"PARKED\", totalAmount=NULL WHERE id=\"87ca02d1-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status=\"ACTIVE\" WHERE vehicleId=\"87ca02d1-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType=\"TRUCK\";', 'localhost', '2025-11-15 04:08:18'),
(26, 'admin', 'UPDATE', 'Vehicle/ParkingSession', 8534, 'UPDATE Vehicle SET exitTime=\"2025-11-14 23:08:19\", status=\"EXITED\", totalAmount=80.00 WHERE id=\"8534d956-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=\"2025-11-14 23:08:19\", duration=65, amount=80.00, status=\"COMPLETED\" WHERE vehicleId=\"8534d956-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType=\"TRUCK\";', 'UPDATE Vehicle SET exitTime=NULL, status=\"PARKED\", totalAmount=NULL WHERE id=\"8534d956-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status=\"ACTIVE\" WHERE vehicleId=\"8534d956-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType=\"TRUCK\";', 'localhost', '2025-11-15 04:08:19'),
(27, 'admin', 'UPDATE', 'Vehicle/ParkingSession', 50, 'UPDATE Vehicle SET exitTime=\"2025-11-14 23:08:20\", status=\"EXITED\", totalAmount=20.00 WHERE id=\"50b5c2a8-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=\"2025-11-14 23:08:20\", duration=67, amount=20.00, status=\"COMPLETED\" WHERE vehicleId=\"50b5c2a8-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType=\"MOTORCYCLE\";', 'UPDATE Vehicle SET exitTime=NULL, status=\"PARKED\", totalAmount=NULL WHERE id=\"50b5c2a8-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status=\"ACTIVE\" WHERE vehicleId=\"50b5c2a8-c1cf-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType=\"MOTORCYCLE\";', 'localhost', '2025-11-15 04:08:20'),
(28, 'admin', 'INSERT', 'Vehicle/ParkingSession', 0, 'INSERT INTO Vehicle (id, plateNumber, vehicleType, status, entryTime) VALUES (\"e3616189-c1d8-11f0-ad5e-7427eaf2ac34\",\"JHK150\",\"TRUCK\",\"PARKED\",\"2025-11-14 23:09:32\"); ', 'DELETE FROM Vehicle WHERE id=\"e3616189-c1d8-11f0-ad5e-7427eaf2ac34\"; DELETE FROM ParkingSession WHERE vehicleId=\"e3616189-c1d8-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount = currentCount - 1 WHERE vehicleType=\"TRUCK\";', 'localhost', '2025-11-15 04:09:32'),
(29, 'admin', 'INSERT', 'Vehicle/ParkingSession', 0, 'INSERT INTO Vehicle (id, plateNumber, vehicleType, status, entryTime) VALUES (\"f09ae94c-c1d9-11f0-ad5e-7427eaf2ac34\",\"FTY18F\",\"MOTORCYCLE\",\"PARKED\",\"2025-11-14 23:17:03\"); ', 'DELETE FROM Vehicle WHERE id=\"f09ae94c-c1d9-11f0-ad5e-7427eaf2ac34\"; DELETE FROM ParkingSession WHERE vehicleId=\"f09ae94c-c1d9-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount = currentCount - 1 WHERE vehicleType=\"MOTORCYCLE\";', 'localhost', '2025-11-15 04:17:03'),
(30, 'admin', 'UPDATE', 'Vehicle/ParkingSession', 0, 'UPDATE Vehicle SET exitTime=\"2025-11-14 23:40:12\", status=\"EXITED\", totalAmount=10.00 WHERE id=\"f09ae94c-c1d9-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=\"2025-11-14 23:40:12\", duration=23, amount=10.00, status=\"COMPLETED\" WHERE vehicleId=\"f09ae94c-c1d9-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType=\"MOTORCYCLE\";', 'UPDATE Vehicle SET exitTime=NULL, status=\"PARKED\", totalAmount=NULL WHERE id=\"f09ae94c-c1d9-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status=\"ACTIVE\" WHERE vehicleId=\"f09ae94c-c1d9-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType=\"MOTORCYCLE\";', 'localhost', '2025-11-15 04:40:12'),
(31, 'admin', 'UPDATE', 'Vehicle/ParkingSession', 0, 'UPDATE Vehicle SET exitTime=\"2025-11-14 23:40:13\", status=\"EXITED\", totalAmount=40.00 WHERE id=\"e3616189-c1d8-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=\"2025-11-14 23:40:13\", duration=30, amount=40.00, status=\"COMPLETED\" WHERE vehicleId=\"e3616189-c1d8-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType=\"TRUCK\";', 'UPDATE Vehicle SET exitTime=NULL, status=\"PARKED\", totalAmount=NULL WHERE id=\"e3616189-c1d8-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status=\"ACTIVE\" WHERE vehicleId=\"e3616189-c1d8-11f0-ad5e-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType=\"TRUCK\";', 'localhost', '2025-11-15 04:40:13'),
(32, 'admin', 'INSERT', 'Users', 916, 'INSERT INTO Users (id, username, email, role) VALUES (\'916fd3c4-60f8-4dd9-98f3-5a53bf036c8e\',\'john_test\',\'john@example.com\',\'OPERATOR\');', 'UPDATE Users SET isActive = FALSE WHERE id=\'916fd3c4-60f8-4dd9-98f3-5a53bf036c8e\';', 'localhost', '2025-11-15 22:51:18'),
(35, 'admin', 'DELETE', 'Users', 916, 'UPDATE Users SET isActive = FALSE WHERE id=\'916fd3c4-60f8-4dd9-98f3-5a53bf036c8e\';', 'UPDATE Users SET isActive = TRUE WHERE id=\'916fd3c4-60f8-4dd9-98f3-5a53bf036c8e\';', 'localhost', '2025-11-15 23:33:25'),
(36, 'admin', 'INSERT', 'Users', 9223372036854775807, 'INSERT INTO Users (id, username, email, role) VALUES (\'30e68280-e1b4-4f17-bc19-e9a12402c6de\',\'jeimyrl\',\'jeimy@example.com\',\'OPERATOR\');', 'UPDATE Users SET isActive = FALSE WHERE id=\'30e68280-e1b4-4f17-bc19-e9a12402c6de\';', 'localhost', '2025-11-15 23:34:24'),
(37, 'admin', 'UPDATE', 'Users', 9223372036854775807, 'UPDATE Users SET email=\'jeimy.rl@example.com\', password=\'[ENCRYPTED]\' WHERE id=\'30e68280-e1b4-4f17-bc19-e9a12402c6de\';', 'UPDATE Users SET\n        username=\'jeimyrl\',\n        email=\'jeimy@example.com\',\n        role=\'OPERATOR\'\n      WHERE id=\'30e68280-e1b4-4f17-bc19-e9a12402c6de\';', 'localhost', '2025-11-16 00:47:05'),
(38, 'admin', 'DELETE', 'Users', 9223372036854775807, 'UPDATE Users SET isActive = FALSE WHERE id=\'30e68280-e1b4-4f17-bc19-e9a12402c6de\';', 'UPDATE Users SET isActive = TRUE WHERE id=\'30e68280-e1b4-4f17-bc19-e9a12402c6de\';', '::ffff:192.168.0.100', '2025-11-17 00:01:51'),
(39, 'admin', 'UPDATE', 'Users', 9223372036854775807, 'UPDATE Users SET username = \'jeimy.rl\' WHERE id=\'30e68280-e1b4-4f17-bc19-e9a12402c6de\';', 'UPDATE Users SET\n        username=\'jeimyrl\',\n        email=\'jeimy.rl@example.com\',\n        role=\'OPERATOR\'\n      WHERE id=\'30e68280-e1b4-4f17-bc19-e9a12402c6de\';', '::ffff:192.168.0.100', '2025-11-17 01:49:03'),
(40, 'admin', 'UPDATE', 'Users', 916, 'UPDATE Users SET username=\'johntest\' WHERE id=\'916fd3c4-60f8-4dd9-98f3-5a53bf036c8e\';', 'UPDATE Users SET\n        username=\'john_test\',\n        email=\'john@example.com\',\n        role=\'OPERATOR\'\n      WHERE id=\'916fd3c4-60f8-4dd9-98f3-5a53bf036c8e\';', '::ffff:192.168.0.100', '2025-11-17 01:49:34'),
(41, 'admin', 'INSERT', 'Users', 0, 'INSERT INTO Users (id, username, email, role) VALUES (\'aab8cc09-4fc5-4720-b0be-9fc3671afbba\',\'Operador\',\'operador@parqueadero.com\',\'OPERATOR\');', 'UPDATE Users SET isActive = FALSE WHERE id=\'aab8cc09-4fc5-4720-b0be-9fc3671afbba\';', '::ffff:192.168.0.100', '2025-11-17 02:08:03'),
(42, 'jeimy.rl', 'INSERT', 'Vehicle/ParkingSession', 0, 'INSERT INTO Vehicle (id, plateNumber, vehicleType, status, entryTime) VALUES (\"ae82c7d8-c366-11f0-9c02-7427eaf2ac34\",\"FTY18F\",\"MOTORCYCLE\",\"PARKED\",\"2025-11-16 22:37:03\"); ', 'DELETE FROM Vehicle WHERE id=\"ae82c7d8-c366-11f0-9c02-7427eaf2ac34\"; DELETE FROM ParkingSession WHERE vehicleId=\"ae82c7d8-c366-11f0-9c02-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount = currentCount - 1 WHERE vehicleType=\"MOTORCYCLE\";', 'localhost', '2025-11-17 03:37:03'),
(43, 'jeimy.rl', 'UPDATE', 'Vehicle/ParkingSession', 0, 'UPDATE Vehicle SET exitTime=\"2025-11-16 22:50:04\", status=\"EXITED\", totalAmount=10.00 WHERE id=\"ae82c7d8-c366-11f0-9c02-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=\"2025-11-16 22:50:04\", duration=13, amount=10.00, status=\"COMPLETED\" WHERE vehicleId=\"ae82c7d8-c366-11f0-9c02-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount-1 WHERE vehicleType=\"MOTORCYCLE\";', 'UPDATE Vehicle SET exitTime=NULL, status=\"PARKED\", totalAmount=NULL WHERE id=\"ae82c7d8-c366-11f0-9c02-7427eaf2ac34\"; UPDATE ParkingSession SET exitTime=NULL, duration=NULL, amount=NULL, status=\"ACTIVE\" WHERE vehicleId=\"ae82c7d8-c366-11f0-9c02-7427eaf2ac34\"; UPDATE ParkingCapacity SET currentCount=currentCount+1 WHERE vehicleType=\"MOTORCYCLE\";', 'localhost', '2025-11-17 03:50:04');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `currentparkedvehicles`
-- (Véase abajo para la vista actual)
--
DROP VIEW IF EXISTS `currentparkedvehicles`;
CREATE TABLE `currentparkedvehicles` (
`plateNumber` varchar(20)
,`vehicleType` varchar(20)
,`entryTime` datetime
,`minutes_parked` bigint(21)
,`vehicle_type_description` varchar(100)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `dailyincomereport`
-- (Véase abajo para la vista actual)
--
DROP VIEW IF EXISTS `dailyincomereport`;
CREATE TABLE `dailyincomereport` (
`report_date` date
,`vehicleType` varchar(20)
,`vehicle_type_description` varchar(100)
,`vehicles_served` bigint(21)
,`total_income` decimal(32,2)
,`avg_duration_minutes` decimal(14,4)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `parkingcapacity`
--

DROP TABLE IF EXISTS `parkingcapacity`;
CREATE TABLE `parkingcapacity` (
  `id` varchar(50) NOT NULL,
  `vehicleType` varchar(20) NOT NULL,
  `maxCapacity` int(11) NOT NULL,
  `currentCount` int(11) DEFAULT 0,
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `parkingcapacity`
--

INSERT INTO `parkingcapacity` (`id`, `vehicleType`, `maxCapacity`, `currentCount`, `updatedAt`) VALUES
('290604b0-c1ad-11f0-9387-7427eaf2ac34', 'CAR', 50, 0, '2025-11-14 22:00:09'),
('2906d461-c1ad-11f0-9387-7427eaf2ac34', 'MOTORCYCLE', 30, 0, '2025-11-16 22:50:04'),
('2906d599-c1ad-11f0-9387-7427eaf2ac34', 'TRUCK', 10, 0, '2025-11-14 23:40:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `parkingrate`
--

DROP TABLE IF EXISTS `parkingrate`;
CREATE TABLE `parkingrate` (
  `id` varchar(50) NOT NULL,
  `vehicleType` varchar(20) NOT NULL,
  `hourlyRate` decimal(10,2) NOT NULL,
  `dailyRate` decimal(10,2) NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `parkingrate`
--

INSERT INTO `parkingrate` (`id`, `vehicleType`, `hourlyRate`, `dailyRate`, `createdAt`, `updatedAt`) VALUES
('28e5b44d-c1ad-11f0-9387-7427eaf2ac34', 'CAR', 20.00, 200.00, '2025-11-14 17:56:30', '2025-11-14 17:56:30'),
('28e5c514-c1ad-11f0-9387-7427eaf2ac34', 'MOTORCYCLE', 10.00, 100.00, '2025-11-14 17:56:30', '2025-11-14 17:56:30'),
('28e5c8af-c1ad-11f0-9387-7427eaf2ac34', 'TRUCK', 40.00, 400.00, '2025-11-14 17:56:30', '2025-11-14 17:56:30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `parkingsession`
--

DROP TABLE IF EXISTS `parkingsession`;
CREATE TABLE `parkingsession` (
  `id` varchar(50) NOT NULL,
  `vehicleId` varchar(50) NOT NULL,
  `plateNumber` varchar(20) NOT NULL,
  `vehicleType` varchar(20) NOT NULL,
  `entryTime` datetime NOT NULL,
  `exitTime` datetime DEFAULT NULL,
  `duration` int(11) DEFAULT NULL COMMENT 'Duración en minutos',
  `amount` decimal(10,2) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'ACTIVE',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `parkingsession`
--

INSERT INTO `parkingsession` (`id`, `vehicleId`, `plateNumber`, `vehicleType`, `entryTime`, `exitTime`, `duration`, `amount`, `status`, `createdAt`, `updatedAt`) VALUES
('50b6e25e-c1cf-11f0-ad5e-7427eaf2ac34', '50b5c2a8-c1cf-11f0-ad5e-7427eaf2ac34', 'ABC123', 'MOTORCYCLE', '2025-11-14 22:01:00', '2025-11-14 23:08:20', 67, 20.00, 'COMPLETED', '2025-11-14 22:01:00', '2025-11-14 23:08:20'),
('50f99d45-c1ce-11f0-ad5e-7427eaf2ac34', '50f7efa4-c1ce-11f0-ad5e-7427eaf2ac34', 'OVF546', 'MOTORCYCLE', '2025-11-14 21:53:51', '2025-11-14 21:59:47', 5, 10.00, 'COMPLETED', '2025-11-14 21:53:51', '2025-11-14 21:59:47'),
('55cb707f-c1ce-11f0-ad5e-7427eaf2ac34', '55c9cb9a-c1ce-11f0-ad5e-7427eaf2ac34', 'FTY18F', 'TRUCK', '2025-11-14 21:53:59', '2025-11-14 21:59:50', 5, 40.00, 'COMPLETED', '2025-11-14 21:53:59', '2025-11-14 21:59:50'),
('8534e036-c1cf-11f0-ad5e-7427eaf2ac34', '8534d956-c1cf-11f0-ad5e-7427eaf2ac34', 'OVF546', 'TRUCK', '2025-11-14 22:02:28', '2025-11-14 23:08:19', 65, 80.00, 'COMPLETED', '2025-11-14 22:02:28', '2025-11-14 23:08:19'),
('87ca07fa-c1cf-11f0-ad5e-7427eaf2ac34', '87ca02d1-c1cf-11f0-ad5e-7427eaf2ac34', 'JHK150', 'TRUCK', '2025-11-14 22:02:32', '2025-11-14 23:08:18', 65, 80.00, 'COMPLETED', '2025-11-14 22:02:32', '2025-11-14 23:08:18'),
('8a3dadce-c1cf-11f0-ad5e-7427eaf2ac34', '8a3c6119-c1cf-11f0-ad5e-7427eaf2ac34', 'FTY18F', 'MOTORCYCLE', '2025-11-14 22:02:37', '2025-11-14 23:08:17', 65, 20.00, 'COMPLETED', '2025-11-14 22:02:37', '2025-11-14 23:08:17'),
('a1c677a2-c1cf-11f0-ad5e-7427eaf2ac34', 'a1c4f5e7-c1cf-11f0-ad5e-7427eaf2ac34', 'TEST789', 'TRUCK', '2025-11-14 22:03:16', '2025-11-14 23:08:16', 65, 80.00, 'COMPLETED', '2025-11-14 22:03:16', '2025-11-14 23:08:16'),
('a48faca2-c1cf-11f0-ad5e-7427eaf2ac34', 'a48f9b1a-c1cf-11f0-ad5e-7427eaf2ac34', 'TEST999', 'MOTORCYCLE', '2025-11-14 22:03:21', '2025-11-14 23:08:15', 64, 20.00, 'COMPLETED', '2025-11-14 22:03:21', '2025-11-14 23:08:15'),
('ae861d3b-c366-11f0-9c02-7427eaf2ac34', 'ae82c7d8-c366-11f0-9c02-7427eaf2ac34', 'FTY18F', 'MOTORCYCLE', '2025-11-16 22:37:03', '2025-11-16 22:50:04', 13, 10.00, 'COMPLETED', '2025-11-16 22:37:03', '2025-11-16 22:50:04'),
('dc859465-c1ce-11f0-ad5e-7427eaf2ac34', 'dc858ccf-c1ce-11f0-ad5e-7427eaf2ac34', 'TEST789', 'CAR', '2025-11-14 21:57:45', '2025-11-14 22:00:09', 2, 20.00, 'COMPLETED', '2025-11-14 21:57:45', '2025-11-14 22:00:09'),
('df09d831-c1ce-11f0-ad5e-7427eaf2ac34', 'df09d285-c1ce-11f0-ad5e-7427eaf2ac34', 'TEST999', 'CAR', '2025-11-14 21:57:49', '2025-11-14 22:00:08', 2, 20.00, 'COMPLETED', '2025-11-14 21:57:49', '2025-11-14 22:00:08'),
('e362c8ee-c1d8-11f0-ad5e-7427eaf2ac34', 'e3616189-c1d8-11f0-ad5e-7427eaf2ac34', 'JHK150', 'TRUCK', '2025-11-14 23:09:32', '2025-11-14 23:40:13', 30, 40.00, 'COMPLETED', '2025-11-14 23:09:32', '2025-11-14 23:40:13'),
('e5e1c950-c1ce-11f0-ad5e-7427eaf2ac34', 'e5e1c1a1-c1ce-11f0-ad5e-7427eaf2ac34', 'JHK150', 'TRUCK', '2025-11-14 21:58:01', '2025-11-14 22:00:06', 2, 40.00, 'COMPLETED', '2025-11-14 21:58:01', '2025-11-14 22:00:06'),
('f09cc0e4-c1d9-11f0-ad5e-7427eaf2ac34', 'f09ae94c-c1d9-11f0-ad5e-7427eaf2ac34', 'FTY18F', 'MOTORCYCLE', '2025-11-14 23:17:03', '2025-11-14 23:40:12', 23, 10.00, 'COMPLETED', '2025-11-14 23:17:03', '2025-11-14 23:40:12'),
('f95d78b5-c1cd-11f0-ad5e-7427eaf2ac34', 'f95bb5ef-c1cd-11f0-ad5e-7427eaf2ac34', 'ABC123', 'CAR', '2025-11-14 21:51:24', '2025-11-14 21:59:51', 8, 20.00, 'COMPLETED', '2025-11-14 21:51:24', '2025-11-14 21:59:51');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `parkingspacesavailable`
-- (Véase abajo para la vista actual)
--
DROP VIEW IF EXISTS `parkingspacesavailable`;
CREATE TABLE `parkingspacesavailable` (
`vehicleType` varchar(20)
,`vehicle_type_description` varchar(100)
,`maxCapacity` int(11)
,`currentCount` int(11)
,`availableSpaces` bigint(12)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessionstatus`
--

DROP TABLE IF EXISTS `sessionstatus`;
CREATE TABLE `sessionstatus` (
  `status_name` varchar(20) NOT NULL,
  `description` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `sessionstatus`
--

INSERT INTO `sessionstatus` (`status_name`, `description`) VALUES
('ACTIVE', 'Activa'),
('CANCELLED', 'Cancelada'),
('COMPLETED', 'Completada');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` enum('ADMIN','OPERATOR') DEFAULT 'OPERATOR',
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `email`, `role`, `isActive`, `createdAt`, `updatedAt`) VALUES
('30e68280-e1b4-4f17-bc19-e9a12402c6de', 'jeimy.rl', '$2b$10$tvwAfmdGpebrIis/1Lzqi.DMD8Ze/TXu/UNz82Q.17JLsfJVv3x76', 'jeimy.rl@example.com', 'OPERATOR', 1, '2025-11-15 18:34:24', '2025-11-16 21:55:51'),
('8433a5ea-c0f0-490d-8a2a-9993399ae0b0', 'admin', '$2b$10$IGND7ASOP.hspM4LOTqEpe0Alkbntpfnp0nRH32hrXkU7/ZrzYpG6', 'admin@parqueadero.com', 'ADMIN', 1, '2025-11-14 21:19:33', '2025-11-14 21:19:33'),
('916fd3c4-60f8-4dd9-98f3-5a53bf036c8e', 'johntest', '$2b$10$bi8cZ38C9qdmjbs3RPLZ8uaBsoWuUOUpNVaU0/zTmIvYcOYI8uicm', 'john@example.com', 'OPERATOR', 1, '2025-11-15 17:51:18', '2025-11-16 21:55:43'),
('aab8cc09-4fc5-4720-b0be-9fc3671afbba', 'Operador', '$2b$10$7iDGMKNEC9PO/nZP3jokW.UfBRXOgRVoohT2YzLUHBDvt6QVWejzW', 'operador@parqueadero.com', 'OPERATOR', 1, '2025-11-16 21:08:03', '2025-11-16 21:08:03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vehicle`
--

DROP TABLE IF EXISTS `vehicle`;
CREATE TABLE `vehicle` (
  `id` varchar(50) NOT NULL,
  `plateNumber` varchar(20) NOT NULL,
  `vehicleType` varchar(20) NOT NULL,
  `entryTime` datetime DEFAULT current_timestamp(),
  `exitTime` datetime DEFAULT NULL,
  `status` varchar(20) DEFAULT 'PARKED',
  `totalAmount` decimal(10,2) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `vehicle`
--

INSERT INTO `vehicle` (`id`, `plateNumber`, `vehicleType`, `entryTime`, `exitTime`, `status`, `totalAmount`, `createdAt`, `updatedAt`) VALUES
('29ba4b02-c1ad-11f0-9387-7427eaf2ac34', 'ABC123', 'CAR', '2025-11-14 17:56:32', '2025-11-14 21:47:21', 'EXITED', 80.00, '2025-11-14 17:56:32', '2025-11-14 21:47:21'),
('29c00346-c1ad-11f0-9387-7427eaf2ac34', 'XYZ789', 'MOTORCYCLE', '2025-11-14 17:56:32', '2025-11-14 21:48:01', 'EXITED', 40.00, '2025-11-14 17:56:32', '2025-11-14 21:48:01'),
('29c005ae-c1ad-11f0-9387-7427eaf2ac34', 'DEF456', 'TRUCK', '2025-11-14 17:56:32', '2025-11-14 21:48:04', 'EXITED', 160.00, '2025-11-14 17:56:32', '2025-11-14 21:48:04'),
('50b5c2a8-c1cf-11f0-ad5e-7427eaf2ac34', 'ABC123', 'MOTORCYCLE', '2025-11-14 22:01:00', '2025-11-14 23:08:20', 'EXITED', 20.00, '2025-11-14 22:01:00', '2025-11-14 23:08:20'),
('50f7efa4-c1ce-11f0-ad5e-7427eaf2ac34', 'OVF546', 'MOTORCYCLE', '2025-11-14 21:53:51', '2025-11-14 21:59:47', 'EXITED', 10.00, '2025-11-14 21:53:51', '2025-11-14 21:59:47'),
('55c9cb9a-c1ce-11f0-ad5e-7427eaf2ac34', 'FTY18F', 'TRUCK', '2025-11-14 21:53:59', '2025-11-14 21:59:50', 'EXITED', 40.00, '2025-11-14 21:53:59', '2025-11-14 21:59:50'),
('8534d956-c1cf-11f0-ad5e-7427eaf2ac34', 'OVF546', 'TRUCK', '2025-11-14 22:02:28', '2025-11-14 23:08:19', 'EXITED', 80.00, '2025-11-14 22:02:28', '2025-11-14 23:08:19'),
('87ca02d1-c1cf-11f0-ad5e-7427eaf2ac34', 'JHK150', 'TRUCK', '2025-11-14 22:02:32', '2025-11-14 23:08:18', 'EXITED', 80.00, '2025-11-14 22:02:32', '2025-11-14 23:08:18'),
('8a3c6119-c1cf-11f0-ad5e-7427eaf2ac34', 'FTY18F', 'MOTORCYCLE', '2025-11-14 22:02:37', '2025-11-14 23:08:17', 'EXITED', 20.00, '2025-11-14 22:02:37', '2025-11-14 23:08:17'),
('a1c4f5e7-c1cf-11f0-ad5e-7427eaf2ac34', 'TEST789', 'TRUCK', '2025-11-14 22:03:16', '2025-11-14 23:08:16', 'EXITED', 80.00, '2025-11-14 22:03:16', '2025-11-14 23:08:16'),
('a48f9b1a-c1cf-11f0-ad5e-7427eaf2ac34', 'TEST999', 'MOTORCYCLE', '2025-11-14 22:03:21', '2025-11-14 23:08:15', 'EXITED', 20.00, '2025-11-14 22:03:21', '2025-11-14 23:08:15'),
('ae82c7d8-c366-11f0-9c02-7427eaf2ac34', 'FTY18F', 'MOTORCYCLE', '2025-11-16 22:37:03', '2025-11-16 22:50:04', 'EXITED', 10.00, '2025-11-16 22:37:03', '2025-11-16 22:50:04'),
('dc858ccf-c1ce-11f0-ad5e-7427eaf2ac34', 'TEST789', 'CAR', '2025-11-14 21:57:45', '2025-11-14 22:00:09', 'EXITED', 20.00, '2025-11-14 21:57:45', '2025-11-14 22:00:09'),
('df09d285-c1ce-11f0-ad5e-7427eaf2ac34', 'TEST999', 'CAR', '2025-11-14 21:57:49', '2025-11-14 22:00:08', 'EXITED', 20.00, '2025-11-14 21:57:49', '2025-11-14 22:00:08'),
('e3616189-c1d8-11f0-ad5e-7427eaf2ac34', 'JHK150', 'TRUCK', '2025-11-14 23:09:32', '2025-11-14 23:40:13', 'EXITED', 40.00, '2025-11-14 23:09:32', '2025-11-14 23:40:13'),
('e5e1c1a1-c1ce-11f0-ad5e-7427eaf2ac34', 'JHK150', 'TRUCK', '2025-11-14 21:58:01', '2025-11-14 22:00:06', 'EXITED', 40.00, '2025-11-14 21:58:01', '2025-11-14 22:00:06'),
('f09ae94c-c1d9-11f0-ad5e-7427eaf2ac34', 'FTY18F', 'MOTORCYCLE', '2025-11-14 23:17:03', '2025-11-14 23:40:12', 'EXITED', 10.00, '2025-11-14 23:17:03', '2025-11-14 23:40:12'),
('f95bb5ef-c1cd-11f0-ad5e-7427eaf2ac34', 'ABC123', 'CAR', '2025-11-14 21:51:24', '2025-11-14 21:59:51', 'EXITED', 20.00, '2025-11-14 21:51:24', '2025-11-14 21:59:51');

--
-- Disparadores `vehicle`
--
DROP TRIGGER IF EXISTS `after_vehicle_update`;
DELIMITER $$
CREATE TRIGGER `after_vehicle_update` AFTER UPDATE ON `vehicle` FOR EACH ROW BEGIN
    IF NEW.status = 'EXITED' AND OLD.status = 'PARKED' THEN
        UPDATE ParkingSession 
        SET exitTime = NEW.exitTime,
            duration = TIMESTAMPDIFF(MINUTE, entryTime, NEW.exitTime),
            amount = NEW.totalAmount,
            status = 'COMPLETED',
            updatedAt = NOW()
        WHERE vehicleId = NEW.id AND status = 'ACTIVE';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vehiclehistory`
-- (Véase abajo para la vista actual)
--
DROP VIEW IF EXISTS `vehiclehistory`;
CREATE TABLE `vehiclehistory` (
`plateNumber` varchar(20)
,`vehicleType` varchar(20)
,`vehicle_type_description` varchar(100)
,`entryTime` datetime
,`exitTime` datetime
,`duration` int(11)
,`amount` decimal(10,2)
,`status` varchar(20)
,`status_description` varchar(100)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vehiclestatus`
--

DROP TABLE IF EXISTS `vehiclestatus`;
CREATE TABLE `vehiclestatus` (
  `status_name` varchar(20) NOT NULL,
  `description` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `vehiclestatus`
--

INSERT INTO `vehiclestatus` (`status_name`, `description`) VALUES
('EXITED', 'Salido'),
('PARKED', 'Estacionado');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vehicletype`
--

DROP TABLE IF EXISTS `vehicletype`;
CREATE TABLE `vehicletype` (
  `type_name` varchar(20) NOT NULL,
  `description` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `vehicletype`
--

INSERT INTO `vehicletype` (`type_name`, `description`) VALUES
('CAR', 'Automóvil'),
('MOTORCYCLE', 'Motocicleta'),
('TRUCK', 'Camión');

-- --------------------------------------------------------

--
-- Estructura para la vista `currentparkedvehicles`
--
DROP TABLE IF EXISTS `currentparkedvehicles`;

DROP VIEW IF EXISTS `currentparkedvehicles`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `currentparkedvehicles`  AS SELECT `v`.`plateNumber` AS `plateNumber`, `v`.`vehicleType` AS `vehicleType`, `v`.`entryTime` AS `entryTime`, timestampdiff(MINUTE,`v`.`entryTime`,current_timestamp()) AS `minutes_parked`, `vt`.`description` AS `vehicle_type_description` FROM (`vehicle` `v` join `vehicletype` `vt` on(`v`.`vehicleType` = `vt`.`type_name`)) WHERE `v`.`status` = 'PARKED' ;

-- --------------------------------------------------------

--
-- Estructura para la vista `dailyincomereport`
--
DROP TABLE IF EXISTS `dailyincomereport`;

DROP VIEW IF EXISTS `dailyincomereport`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `dailyincomereport`  AS SELECT cast(`ps`.`exitTime` as date) AS `report_date`, `ps`.`vehicleType` AS `vehicleType`, `vt`.`description` AS `vehicle_type_description`, count(0) AS `vehicles_served`, coalesce(sum(`ps`.`amount`),0) AS `total_income`, avg(`ps`.`duration`) AS `avg_duration_minutes` FROM (`parkingsession` `ps` join `vehicletype` `vt` on(`ps`.`vehicleType` = `vt`.`type_name`)) WHERE `ps`.`status` = 'COMPLETED' AND `ps`.`exitTime` is not null GROUP BY cast(`ps`.`exitTime` as date), `ps`.`vehicleType`, `vt`.`description` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `parkingspacesavailable`
--
DROP TABLE IF EXISTS `parkingspacesavailable`;

DROP VIEW IF EXISTS `parkingspacesavailable`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `parkingspacesavailable`  AS SELECT `pc`.`vehicleType` AS `vehicleType`, `vt`.`description` AS `vehicle_type_description`, `pc`.`maxCapacity` AS `maxCapacity`, `pc`.`currentCount` AS `currentCount`, `pc`.`maxCapacity`- `pc`.`currentCount` AS `availableSpaces` FROM (`parkingcapacity` `pc` join `vehicletype` `vt` on(`pc`.`vehicleType` = `vt`.`type_name`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `vehiclehistory`
--
DROP TABLE IF EXISTS `vehiclehistory`;

DROP VIEW IF EXISTS `vehiclehistory`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vehiclehistory`  AS SELECT `ps`.`plateNumber` AS `plateNumber`, `ps`.`vehicleType` AS `vehicleType`, `vt`.`description` AS `vehicle_type_description`, `ps`.`entryTime` AS `entryTime`, `ps`.`exitTime` AS `exitTime`, `ps`.`duration` AS `duration`, `ps`.`amount` AS `amount`, `ps`.`status` AS `status`, `ss`.`description` AS `status_description` FROM ((`parkingsession` `ps` join `vehicletype` `vt` on(`ps`.`vehicleType` = `vt`.`type_name`)) join `sessionstatus` `ss` on(`ps`.`status` = `ss`.`status_name`)) ORDER BY `ps`.`entryTime` DESC ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `parkingcapacity`
--
ALTER TABLE `parkingcapacity`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `vehicleType` (`vehicleType`);

--
-- Indices de la tabla `parkingrate`
--
ALTER TABLE `parkingrate`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `vehicleType` (`vehicleType`);

--
-- Indices de la tabla `parkingsession`
--
ALTER TABLE `parkingsession`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_session_entry_time` (`entryTime`),
  ADD KEY `idx_session_exit_time` (`exitTime`),
  ADD KEY `idx_session_status` (`status`),
  ADD KEY `idx_session_vehicle_type` (`vehicleType`),
  ADD KEY `idx_session_plate` (`plateNumber`),
  ADD KEY `idx_session_vehicle_id` (`vehicleId`);

--
-- Indices de la tabla `sessionstatus`
--
ALTER TABLE `sessionstatus`
  ADD PRIMARY KEY (`status_name`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indices de la tabla `vehicle`
--
ALTER TABLE `vehicle`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_vehicle_status` (`status`),
  ADD KEY `idx_vehicle_entry_time` (`entryTime`),
  ADD KEY `idx_vehicle_type` (`vehicleType`),
  ADD KEY `idx_vehicle_plate` (`plateNumber`);

--
-- Indices de la tabla `vehiclestatus`
--
ALTER TABLE `vehiclestatus`
  ADD PRIMARY KEY (`status_name`);

--
-- Indices de la tabla `vehicletype`
--
ALTER TABLE `vehicletype`
  ADD PRIMARY KEY (`type_name`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `parkingcapacity`
--
ALTER TABLE `parkingcapacity`
  ADD CONSTRAINT `parkingcapacity_ibfk_1` FOREIGN KEY (`vehicleType`) REFERENCES `vehicletype` (`type_name`);

--
-- Filtros para la tabla `parkingrate`
--
ALTER TABLE `parkingrate`
  ADD CONSTRAINT `parkingrate_ibfk_1` FOREIGN KEY (`vehicleType`) REFERENCES `vehicletype` (`type_name`);

--
-- Filtros para la tabla `parkingsession`
--
ALTER TABLE `parkingsession`
  ADD CONSTRAINT `parkingsession_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicle` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `parkingsession_ibfk_2` FOREIGN KEY (`vehicleType`) REFERENCES `vehicletype` (`type_name`),
  ADD CONSTRAINT `parkingsession_ibfk_3` FOREIGN KEY (`status`) REFERENCES `sessionstatus` (`status_name`);

--
-- Filtros para la tabla `vehicle`
--
ALTER TABLE `vehicle`
  ADD CONSTRAINT `vehicle_ibfk_1` FOREIGN KEY (`vehicleType`) REFERENCES `vehicletype` (`type_name`),
  ADD CONSTRAINT `vehicle_ibfk_2` FOREIGN KEY (`status`) REFERENCES `vehiclestatus` (`status_name`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
