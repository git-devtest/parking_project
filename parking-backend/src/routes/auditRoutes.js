const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken } = require('../middleware/auth');
const { validateDateRange } = require('../middleware/validation');

// Ruta para obtener los logs de auditoría con paginación
router.get('/dashboard', authenticateToken, auditController.getAuditLogs);

// Ruta para obtener los logs de auditoría basados en el rango especificado
router.get('/daily', authenticateToken, validateDateRange, auditController.getAuditLogsDaily);

// Ruta para obtener los logs de auditoría basados en un rango de fechas personalizado
router.get('/custom', authenticateToken, auditController.getAuditLogCustom);

module.exports = router;