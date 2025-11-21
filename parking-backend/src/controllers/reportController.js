const reportService = require('../services/reportService');

class ReportController {
  async getDailyReport(req, res, next) {
    try {
      const { range = 'today' } = req.query;
      
      const result = await reportService.getDailyReport(range);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDashboardData(req, res, next) {
    try {
      const result = await reportService.getDashboardData();
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

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

module.exports = new ReportController();