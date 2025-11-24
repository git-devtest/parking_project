const auditService = require('../services/auditService');
const logger = require('../utils/logger');

class AuditController {
    // Controlador para obtener los logs de auditoría basados en el rango especificado
    async getAuditLogsDaily(req, res) {
        try {
            const { range = 'today' } = req.query;

            const logs = await auditService.getAuditLogsDaily(range);
            res.status(200).json(logs);
            logger.info(logs);
        } catch (error) {
            logger.error(`Error en el controlador getAuditLogsDaily: ${error.message}`);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    // Controlador para obtener los logs de auditoría con paginación
    async getAuditLogs(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await auditService.getAuditLogs(page, limit);

            res.status(200).json(result);

        } catch (error) {
            logger.error(`Error en el controlador getAuditLogs: ${error.message}`);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }


    // Controlador para obtener los logs de auditoría basados en un rango de fechas personalizado
    async getAuditLogCustom(req, res) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'startDate y endDate son requeridos'
                });
            }

            const logs = await auditService.getAuditLogCustom(startDate, endDate);

            res.status(200).json( logs );
        } catch (error) {
            logger.error(`Error en el controlador getAuditLogCustom: ${error.message}`);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
}

module.exports = new AuditController();