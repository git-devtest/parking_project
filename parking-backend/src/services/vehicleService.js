const { pool } = require('../config/database');
const logger = require('../utils/logger');
const ticketService = require('./ticketService');

class VehicleService {
  async registerEntry(plateNumber, vehicleType, user) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Registrar entrada usando el stored procedure
      const [result] = await connection.query(
        'CALL RegisterVehicleEntry(?, ?, ?)',
        [plateNumber, vehicleType, user]
      );

      await connection.commit();

      logger.info(`Entrada registrada: ${plateNumber} - ${vehicleType}\nUsuario registra entrada: ${user}`);
      return {
        success: true,
        message: 'Entrada registrada exitosamente',
        data: result[0][0]
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error registrando entrada: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  async registerExit(plateNumber, user) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Registrar salida usando el stored procedure
      const [result] = await connection.query(
        'CALL RegisterVehicleExit(?, ?)',
        [plateNumber, user]
      );

      const exitData = result[0][0];

      if (!exitData || !exitData.vehicleId) {
        throw new Error(exitData?.message || 'Error al registrar salida');
      }

      await connection.commit();

      logger.info(`Salida registrada: ${plateNumber},\nUsuario registra salida: ${user}`);

      // Generar ticket (fuera de la transacción)
      const ticketResult = await ticketService.generateExitTicket(plateNumber);

      // Retornar ambos resultados
      return {
        success: true,
        message: exitData.message || 'Salida registrada exitosamente',
        data: {
          exit: exitData,
          ticket: ticketResult.data
        }
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error registrando salida: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  async getParkedVehicles() {
    // Obtener vehículos actualmente estacionados desde la vista
    try {
      const [rows] = await pool.query(`
        SELECT * FROM currentparkedvehicles 
        ORDER BY entryTime DESC
      `);

      return {
        success: true,
        data: rows,
        count: rows.length
      };
    } catch (error) {
      logger.error(`Error obteniendo vehículos estacionados: ${error.message}`);
      throw error;
    }
  }

  async getParkingCapacity() {
    // Obtener capacidad de estacionamiento desde la vista
    try {
      const [rows] = await pool.query('SELECT * FROM parkingspacesavailable');

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      logger.error(`Error obteniendo capacidad: ${error.message}`);
      throw error;
    }
  }

  async getVehicleHistory(page = 1, limit = 20) {
    // Obtener historial de vehículos con paginación desde la vista
    try {

      // Normalizar y validar entrada (vienen como strings desde req.query)
      page  = Number(page)  || 1;
      limit = Number(limit) || 20;

      if (limit <= 0) limit = 20;
      if (page <= 0) page = 1;

      const offset = (page - 1) * limit;

      const [rows] = await pool.query(`
        SELECT * FROM vehiclehistory 
        ORDER BY entryTime DESC 
        LIMIT ? OFFSET ?
      `, [limit, offset]);

      const [[{ total }]] = await pool.query(
        'SELECT COUNT(*) as total FROM vehiclehistory'
      );

      return {
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`Error obteniendo historial: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new VehicleService();