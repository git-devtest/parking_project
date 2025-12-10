// src/services/ticketService.js
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * @description Servicio de tickets
 */
class TicketService {
  
  /**
   * Genera un ticket de salida con UUID
   * @param {string} plateNumber - Placa del vehículo
   * @returns {Object} Ticket completo con UUID
   */
  async generateExitTicket(plateNumber) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
      // Obtener datos completos para el ticket
      const [ticketInfo] = await connection.query(`
        SELECT 
          v.id as vehicleId,
          v.plateNumber,
          v.vehicleType,
          vt.type_name as vehicleTypeName,
          vt.description as vehicleTypeDescription,
          ps.id as sessionId,
          ps.entryTime,
          ps.exitTime,
          ps.duration,
          ps.amount,
          ps.status
        FROM Vehicle v
        INNER JOIN VehicleType vt ON v.vehicleType = vt.type_name
        LEFT JOIN ParkingSession ps ON v.id = ps.vehicleId 
        WHERE v.plateNumber = ?
          AND v.status = 'EXITED'
        ORDER BY ps.exitTime DESC
        LIMIT 1
      `, [plateNumber]);

      await connection.commit();

      if (ticketInfo.length === 0) {
        throw new Error('No se encontró información para generar el ticket');
      }

      const session = ticketInfo[0];

      // Validar que tenga exitTime
      if (!session.exitTime) {
        throw new Error('El vehículo no tiene hora de salida registrada');
      }

      // Generar ticket con UUID
      const ticket = {
        ticketId: uuidv4(),
        sessionId: session.sessionId || session.vehicleId,
        plateNumber: session.plateNumber,
        vehicleType: session.vehicleTypeName || session.vehicleType,
        vehicleTypeDescription: session.vehicleTypeDescription,
        entryTime: session.entryTime,
        exitTime: session.exitTime,
        duration: parseInt(session.duration) || 0,
        amount: parseFloat(session.amount) || 0,
        generatedAt: new Date(),
        status: session.status
      };

      logger.info(`Ticket generado: ${ticket.ticketId} para placa ${plateNumber}`);
      
      return {
        success: true,
        data: ticket
      };

    } catch (error) {
      await connection.rollback();
      logger.error(`Error generando ticket: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Regenera un ticket existente (para reimpresión)
   * @param {string} sessionId - ID de la sesión
   * @returns {Object} Ticket regenerado
   */
  async regenerateTicket(sessionId) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
      const [ticketInfo] = await connection.query(`
        SELECT 
          v.id as vehicleId,
          v.plateNumber,
          v.vehicleType,
          vt.type_name as vehicleTypeName,
          vt.description as vehicleTypeDescription,
          ps.id as sessionId,
          ps.entryTime,
          ps.exitTime,
          ps.duration,
          ps.amount,
          ps.status
        FROM ParkingSession ps
        INNER JOIN Vehicle v ON ps.vehicleId = v.id
        INNER JOIN VehicleType vt ON v.vehicleType = vt.type_name
        WHERE ps.id = ?
      `, [sessionId]);

      await connection.commit();

      if (ticketInfo.length === 0) {
        throw new Error('Sesión no encontrada');
      }

      const session = ticketInfo[0];

      const ticket = {
        ticketId: uuidv4(), // Nuevo UUID para la reimpresión
        sessionId: session.sessionId,
        plateNumber: session.plateNumber,
        vehicleType: session.vehicleTypeName || session.vehicleType,
        vehicleTypeDescription: session.vehicleTypeDescription,
        entryTime: session.entryTime,
        exitTime: session.exitTime,
        duration: parseInt(session.duration) || 0,
        amount: parseFloat(session.amount) || 0,
        generatedAt: new Date(),
        status: session.status,
        isReprint: true // Marca de reimpresión
      };

      logger.info(`Ticket regenerado: ${ticket.ticketId} para sesión ${sessionId}`);

      return {
        success: true,
        data: ticket
      };

    } catch (error) {
      await connection.rollback();
      logger.error(`Error regenerando ticket: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * @description Obtener el último ticket por placa
   * @param {string} plateNumber - Placa del vehículo
   * @returns {Promise<{success: boolean, data: Array}>} - Último ticket
   */
  async getLastTicketByPlate(plateNumber) {
    const connection = await pool.getConnection();
    try {
      const [ticketInfo] = await connection.query(`
        SELECT 
          v.id as vehicleId,
          v.plateNumber,
          v.vehicleType,
          vt.type_name as vehicleTypeName,
          vt.description as vehicleTypeDescription,
          ps.id as sessionId,
          ps.entryTime,
          ps.exitTime,
          ps.duration,
          ps.amount,
          ps.status
        FROM ParkingSession ps
        INNER JOIN Vehicle v ON ps.vehicleId = v.id
        INNER JOIN VehicleType vt ON v.vehicleType = vt.type_name
        WHERE v.plateNumber = ? AND ps.status = 'COMPLETED'
        ORDER BY ps.exitTime DESC
        LIMIT 1
      `, [plateNumber]);

      if (ticketInfo.length === 0) {
        throw new Error('No se encontró ticket para esta placa');
      }

      const session = ticketInfo[0];
      const ticket = {
        ticketId: uuidv4(),
        sessionId: session.sessionId,
        plateNumber: session.plateNumber,
        vehicleType: session.vehicleTypeName,
        vehicleTypeDescription: session.vehicleTypeDescription,
        entryTime: session.entryTime,
        exitTime: session.exitTime,
        duration: parseInt(session.duration) || 0,
        amount: parseFloat(session.amount) || 0,
        generatedAt: new Date(),
        status: session.status,
        isReprint: true
      };

      return { success: true, data: ticket };
    } finally {
      connection.release();
    }
  }
}

/**
 * @description Exportar servicios
 * @module ticketService
 */
module.exports = new TicketService();   