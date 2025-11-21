const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { validateDateRange } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Reporte diario con filtros
router.get('/daily', authenticateToken, validateDateRange, reportController.getDailyReport);

// Datos del dashboard
router.get('/dashboard', authenticateToken, reportController.getDashboardData);

// Reporte personalizado por fechas
router.get('/custom', authenticateToken, reportController.getCustomReport);

module.exports = router;