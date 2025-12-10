const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { validateVehicleEntry, validateVehicleExit } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

/**
 * @description Registrar entrada de vehículo
 * @route POST /entry
 */
router.post('/entry', authenticateToken, validateVehicleEntry, vehicleController.registerEntry);

/**
 * @description Registrar salida de vehículo
 * @route POST /exit
 */
router.post('/exit', authenticateToken, validateVehicleExit, vehicleController.registerExit);

/**
 * @description Obtener vehículos estacionados
 * @route GET /parked
 */
router.get('/parked', authenticateToken, vehicleController.getParkedVehicles);

/**
 * @description Obtener capacidad del estacionamiento
 * @route GET /capacity
 */
router.get('/capacity', authenticateToken, vehicleController.getParkingCapacity);

/**
 * @description Obtener historial de vehículos
 * @route GET /history
 */
router.get('/history', authenticateToken, vehicleController.getVehicleHistory);

/**
 * @description Exportar rutas
 * @module vehicleRoutes
 */
module.exports = router;