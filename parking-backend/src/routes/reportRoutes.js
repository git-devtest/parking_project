const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { validateDateRange } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

/**
 * @description Reporte diario con filtros
 * @route GET /daily
 */
router.get('/daily', authenticateToken, validateDateRange, reportController.getDailyReport);

/**
 * @description Datos del dashboard
 * @route GET /dashboard
 */
router.get('/dashboard', authenticateToken, reportController.getDashboardData);

/**
 * @description Reporte personalizado por fechas
 * @route GET /custom
 */
router.get('/custom', authenticateToken, reportController.getCustomReport);

/**
 * @description Exportar rutas
 * @module reportRoutes
 */
module.exports = router;