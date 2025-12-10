const { pool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * @description Servicio de auditoría
 */
class AuditService {

    /**
     * @description Obtener los logs de auditoría con paginación
     * @param {number} page - Número de página
     * @param {number} limit - Cantidad de registros por página
     * @returns {Promise<{success: boolean, data: Array, pagination: {total: number, limit: number, page: number, pages: number}}>} - Logs de auditoría
     */
    async getAuditLogs(page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            const [rows] = await pool.query(
                `SELECT id, usuario, accion, tabla_afectada, registro_id, 
                        sql_ejecutado, sql_rollback, ip_cliente, fecha_evento
                FROM audit_log
                ORDER BY fecha_evento DESC
                LIMIT ? OFFSET ?`,
                [limit, offset]
            );

            const [[{ total }]] = await pool.query(
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

    /**
     * @description Obtener los logs de auditoría basados en el rango diario especificado
     * @param {string} range - Rango diario (today, yesterday, week, month, year)
     * @returns {Promise<Array>} - Logs de auditoría
     */
    async getAuditLogsDaily(range = 'today') {
        try {
            const [rows] = await pool.query(
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

    /**
     * @description Obtener los logs de auditoría basados en un rango de fechas personalizado
     * @param {string} startDate - Fecha de inicio
     * @param {string} endDate - Fecha de fin
     * @returns {Promise<Array>} - Logs de auditoría
     */
    async getAuditLogCustom(startDate, endDate) {
        try {
            const [rows] = await pool.query(
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

    /**
     * @description Crear un nuevo log de auditoría
     * @param {Object} log - Objeto con los datos del log
     * @param {string} log.usuario - Usuario que realizó la acción
     * @param {string} log.accion - Acción realizada
     * @param {string} log.tabla_afectada - Tabla afectada
     * @param {number} log.registro_id - ID del registro
     * @param {string} log.sql_ejecutado - Sentencia SQL ejecutada
     * @param {string} log.sql_rollback - Sentencia SQL de rollback
     * @param {string} log.ip_cliente - IP del cliente
     * @param {string} log.fecha_evento - Fecha del evento
     * @returns {Promise<void>}
     */
    async createLog({ usuario, accion, tabla_afectada, registro_id, sql_ejecutado, sql_rollback, ip_cliente, fecha_evento }) {
        try {
            // Evitar que un salto de línea rompa el formato del log SQL
            const cleanSQL = sql_ejecutado?.toString().trim() || '';
            const cleanRollback = sql_rollback?.toString().trim() || null;

            await pool.query(
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

/**
 * @description Exportar servicios
 * @module auditService
 */
module.exports = new AuditService();