const { pool } = require('../config/database');
const logger = require('../utils/logger');

class AuditService {

    // Obtener los logs de auditoría con paginación
    async getAuditLogs(page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            const [rows] = await pool.execute(
                `SELECT id, usuario, accion, tabla_afectada, registro_id, 
                        sql_ejecutado, sql_rollback, ip_cliente, fecha_evento
                FROM audit_log
                ORDER BY fecha_evento DESC
                LIMIT ? OFFSET ?`,
                [limit, offset]
            );

            const [[{ total }]] = await pool.execute(
                `SELECT COUNT(*) AS total FROM audit_log`
            );

            return {
                success: true,
                data: rows,
                pagination: {
                    total,
                    limit,
                    page,
                    pages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            console.error("Error fetching audit logs:", error);
            throw error;
        }
    }

    // Obtener los logs de auditoría basados en el rango diario especificado
    async getAuditLogsDaily(range = 'today') {
        // Obtener los logs de auditoría basados en el rango especificado
        try {
            const [rows] = await pool.execute(
                `SELECT 
                id, 
                usuario, 
                accion, 
                tabla_afectada, 
                registro_id, 
                sql_ejecutado, 
                sql_rollback, 
                ip_cliente, 
                fecha_evento 
                FROM audit_log 
                WHERE fecha_evento >= (SELECT GetDateRange(?))
                ORDER BY fecha_evento DESC`,
                [range]
            );
            return rows;
        } catch (error) {
            console.error('Error fetching daily audit logs:', error);
            logger.error(`Error obteniendo logs de auditoría diarios: ${error.message}`);
            throw error;
        }
    }

    // Obtener los logs de auditoría basados en un rango de fechas personalizado
    async getAuditLogCustom(startDate, endDate) {
        // Obtener los logs de auditoría basados en un rango de fechas personalizado
        try {
            const [rows] = await pool.execute(
                `SELECT
                id, 
                usuario, 
                accion,
                tabla_afectada, 
                registro_id, 
                sql_ejecutado,
                sql_rollback,
                ip_cliente, 
                fecha_evento 
                FROM audit_log
                WHERE fecha_evento BETWEEN ? AND ?
                ORDER BY fecha_evento DESC`,
                [startDate, endDate]
            );
            return rows;
        } catch (error) {
            console.error('Error fetching custom audit logs:', error);
            logger.error(`Error obteniendo logs de auditoría personalizados: ${error.message}`);
            throw error;
        }
    }

    // Crear un nuevo log de auditoría
    async createLog({ usuario, accion, tabla_afectada, registro_id, sql_ejecutado, sql_rollback, ip_cliente, fecha_evento }) {
        try {
            console.log("AUDIT SERVICE → pool es:", typeof pool);

            // Evitar que un salto de línea rompa el formato del log SQL
            const cleanSQL = sql_ejecutado?.toString().trim() || '';
            const cleanRollback = sql_rollback?.toString().trim() || null;

            await pool.execute(
                `INSERT INTO audit_log 
                (usuario, accion, tabla_afectada, registro_id, sql_ejecutado, sql_rollback, ip_cliente, fecha_evento)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [usuario, accion, tabla_afectada, registro_id, cleanSQL, cleanRollback, ip_cliente, fecha_evento]
            );
        } catch (error) {
            console.error('Error creating audit log:', error);
            logger.error(`Error creando log de auditoría: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new AuditService();