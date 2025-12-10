const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken } = require('../middleware/auth');
const { validateDateRange } = require('../middleware/validation');

/**
 * @description: Obtiene los logs de auditoría con paginación
 * @route GET /dashboard
 */
router.get('/dashboard', authenticateToken, auditController.getAuditLogs);

/**
 * @description: Obtiene los logs de auditoría basados en el rango especificado
 * @route GET /daily
 */
router.get('/daily', authenticateToken, validateDateRange, auditController.getAuditLogsDaily);

/**
 * @description: Obtiene los logs de auditoría personalizados
 * @route GET /custom
 */
router.get('/custom', authenticateToken, auditController.getAuditLogCustom);

/**
 * @description Exportar rutas
 * @module auditRoutes
 */
module.exports = router;