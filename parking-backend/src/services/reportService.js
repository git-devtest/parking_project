const { pool } = require('../config/database');
const logger = require('../utils/logger');

class ReportService {
  async getDailyReport(range = 'today') {
    // Obtener el reporte diario basado en el rango especificado desde la vista DailyIncomeReport
    try {
      const [rows] = await pool.query(
        `SELECT * FROM dailyincomereport 
         WHERE report_date >= (SELECT GetDateRange(?))
         ORDER BY report_date DESC, vehicleType`,
        [range]
      );

      const total = rows.reduce((sum, row) => sum + parseFloat(row.total_income), 0);
      const totalVehicles = rows.reduce((sum, row) => sum + row.vehicles_served, 0);

      return {
        success: true,
        data: rows,
        summary: {
          totalIncome: total,
          totalVehicles,
          averageDuration: rows.length > 0 ? 
            rows.reduce((sum, row) => sum + row.avg_duration_minutes, 0) / rows.length : 0
        }
      };
    } catch (error) {
      logger.error(`Error generando reporte diario: ${error.message}`);
      throw error;
    }
  }

  async getDashboardData() {
    try {
      // Vehículos estacionados actualmente
      const [parkedVehicles] = await pool.query(`
        SELECT vehicleType, COUNT(*) as count 
        FROM vehicle 
        WHERE status = 'PARKED' 
        GROUP BY vehicleType
      `);

      // Ingresos del día
      const [todayIncome] = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) as income 
        FROM parkingsession 
        WHERE DATE(exitTime) = CURDATE() 
        AND status = 'COMPLETED'
      `);

      // Vehículos atendidos hoy
      const [todayVehicles] = await pool.query(`
        SELECT COUNT(*) as count 
        FROM parkingsession 
        WHERE DATE(exitTime) = CURDATE()
        AND status = 'COMPLETED'
      `);

      // Capacidad
      const [capacity] = await pool.query('SELECT * FROM parkingspacesavailable');

      return {
        success: true,
        data: {
          parkedVehicles,
          todayIncome: todayIncome[0].income,
          todayVehicles: todayVehicles[0].count,
          capacity
        }
      };
    } catch (error) {
      logger.error(`Error obteniendo datos del dashboard: ${error.message}`);
      throw error;
    }
  }

  async getCustomReport(startDate, endDate) {
    try {
      const [rows] = await pool.query(`
        SELECT 
          DATE(ps.exitTime) as report_date,
          ps.vehicleType,
          vt.description as vehicle_type_description,
          COUNT(*) as vehicles_served,
          COALESCE(SUM(ps.amount), 0) as total_income,
          AVG(ps.duration) as avg_duration_minutes
        FROM parkingsession ps
        JOIN vehicletype vt ON ps.vehicleType = vt.type_name
        WHERE ps.status = 'COMPLETED' 
          AND DATE(ps.exitTime) BETWEEN ? AND ?
        GROUP BY DATE(ps.exitTime), ps.vehicleType, vt.description
        ORDER BY report_date DESC, vehicleType
      `, [startDate, endDate]);

      return {
        success: true,
        data: rows,
        period: { startDate, endDate }
      };
    } catch (error) {
      logger.error(`Error generando reporte personalizado: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ReportService();