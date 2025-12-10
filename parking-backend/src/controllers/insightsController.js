// controllers/insightsController.js
const { pool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * @description Controlador para obtener información de insights
 * @module InsightsController
 */
class InsightsController {
  
  /**
   * @description Obtiene el dashboard completo
   * @module getDashboard
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  async getDashboard(req, res) {
    try {
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      const { startDate, endDate } = req.query;
      
      // Validación de fechas
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      const [results] = await connection.query(
        'CALL GetInsightsDashboard(?, ?)',
        [start, end]
      );

      // Los resultados vienen en arrays separados
      const dashboard = {
        executiveSummary: results[0][0],
        revenueByVehicleType: results[1],
        dailyRevenueTrend: results[2],
        peakHours: results[3],
        currentOccupancy: results[4],
        frequentCustomers: results[5],
        weeklyPattern: results[6],
        rotationRate: results[7],
        periodComparison: results[8],
        dateRange: { startDate: start, endDate: end }
      };

      logger.info(`Dashboard generado por: ${req.user.username}`);

      res.json({
        success: true,
        message: 'Dashboard obtenido exitosamente',
        datasets: dashboard
      });
      connection.release();
    } catch (error) {
      console.error('Error getting dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener dashboard',
        error: error.message
      });
    }
  }

  /**
   * @description Obtiene la ocupación en tiempo real
   * @module getCurrentOccupancy
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  async getCurrentOccupancy(req, res) {
    try {
      const connection = await pool.getConnection();
      const query = `
        SELECT 
          pc.vehicleType,
          vt.description as tipo_descripcion,
          pc.maxCapacity,
          pc.currentCount,
          (pc.maxCapacity - pc.currentCount) as availableSpaces,
          ROUND((pc.currentCount * 100.0 / pc.maxCapacity), 2) as occupancyPercentage
        FROM parkingcapacity pc
        JOIN vehicletype vt ON pc.vehicleType = vt.type_name
      `;
      
      const [results] = await connection.query(query);
      logger.info(`Ocupación en tiempo real generado por: ${req.user.username}`);
      res.json({
        success: true,
        message: 'Ocupación en tiempo real obtenida exitosamente',
        datasets: results
      });
      connection.release();
    } catch (error) {
      console.error('Error getting occupancy:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener ocupación',
        error: error.message
      });
    }
  }

  /**
   * @description Obtiene los vehículos actualmente estacionados
   * @module getCurrentlyParked
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  async getCurrentlyParked(req, res) {
    try {
      const connection = await pool.getConnection();
      const query = `
        SELECT 
          plateNumber,
          vehicleType,
          entryTime,
          minutes_parked,
          vehicle_type_description,
          ROUND(minutes_parked / 60.0, 2) as hours_parked
        FROM currentparkedvehicles
        ORDER BY entryTime DESC
      `;
      
      const [results] = await connection.query(query);
      logger.info(`Vehículos actualmente estacionados generado por: ${req.user.username}`);
      res.json({
        success: true,
        message: 'Vehículos actualmente estacionados obtenidos exitosamente',
        datasets: results
      });
      connection.release();
    } catch (error) {
      console.error('Error getting parked vehicles:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener vehículos estacionados',
        error: error.message
      });
    }
  }
}

/**
 * @description Exportar controladores
 * @module exportControllers
 */
module.exports = new InsightsController();