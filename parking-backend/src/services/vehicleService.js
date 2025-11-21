const { pool } = require('../config/database');
const logger = require('../utils/logger');

class VehicleService {
  async registerEntry(plateNumber, vehicleType, user) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Registrar entrada usando el stored procedure
      const [result] = await connection.execute(
        'CALL RegisterVehicleEntry(?, ?, ?)',
        [plateNumber, vehicleType, user]
      );

      await connection.commit();

      logger.info(`Entrada registrada: ${plateNumber} - ${vehicleType} - Usuario registra entrada: ${user}`);
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
      const [result] = await connection.execute(
        'CALL RegisterVehicleExit(?, ?)',
        [plateNumber, user]
      );

      await connection.commit();

      logger.info(`Salida registrada: ${plateNumber}, Usuario registra salida: ${user}`);
      return {
        success: true,
        message: 'Salida registrada exitosamente',
        data: result[0][0]
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
      const [rows] = await pool.execute(`
        SELECT * FROM CurrentParkedVehicles 
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
      const [rows] = await pool.execute('SELECT * FROM ParkingSpacesAvailable');

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
      const offset = (page - 1) * limit;

      const [rows] = await pool.execute(`
        SELECT * FROM VehicleHistory 
        ORDER BY entryTime DESC 
        LIMIT ? OFFSET ?
      `, [limit, offset]);

      const [[{ total }]] = await pool.execute(
        'SELECT COUNT(*) as total FROM VehicleHistory'
      );

       // DEBUG: Ver qué valores se están calculando
      console.log('DEBUG Pagination:', {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit),
        offset: offset,
        rowsReturned: rows.length
      });

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