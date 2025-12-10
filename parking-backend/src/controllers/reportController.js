const reportService = require('../services/reportService');

/**
 * @description Controlador para generar reportes
 * @module ReportController
 */
class ReportController {

  /**
   * @description Obtiene el reporte diario
   * @module getDailyReport
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  async getDailyReport(req, res, next) {
    try {
      const { range = 'today' } = req.query;
      
      const result = await reportService.getDailyReport(range);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @description Obtiene los datos del dashboard
   * @module getDashboardData
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  async getDashboardData(req, res, next) {
    try {
      const result = await reportService.getDashboardData();
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @description Obtiene el reporte personalizado
   * @module getCustomReport
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  async getCustomReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate y endDate son requeridos'
        });
      }
      
      const result = await reportService.getCustomReport(startDate, endDate);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

/**
 * @description Exportar controladores
 * @module exportControllers
 */
module.exports = new ReportController();