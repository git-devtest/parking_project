const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const logger = require('../utils/logger');
const auditService = require('../services/auditService');
const BackupSqlService = require('../services/backupSqlService')

const BACKUP_DIR = path.join(__dirname, "../backups/json");

// Asegurar que el directorio exista al iniciar
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

class BackupController {

    // ==================================================
    // 1. CREAR BACKUP EN JSON
    // ==================================================
    async createBackup(req, res) {
        let connection;

        try {
            const start = Date.now();
            const fileName = `backup-json-${getLocalTimestamp()}.json`;
            const filePath = path.join(BACKUP_DIR, fileName);

            // Obtener conexión dedicada para backup
            connection = await pool.getConnection();

            // ===== leer tablas =====
            const tables = [
                "users",
                "vehicle",
                "parkingsession",
                "audit_log"
            ];

            const backupData = {
                metadata: {
                    timestamp: getLocalTimestamp(),
                    createdBy: req.user.username,
                    version: "1.0.0",
                    database: process.env.DB_NAME,
                    tables: {
                        users: "Usuarios del sistema",
                        vehicle: "Vehículos registrados",
                        parkingsession: "Sesiones de estacionamiento",
                        audit_log: "Registros de auditoría"
                    }
                },
                data: {}
            };

            // Exportar tablas con manejo individual de errores
            for (const table of tables) {
                try {
                    logger.info(`Exportando tabla: ${table}`);
                    const [rows] = await connection.query(`SELECT * FROM ${table}`);
                    backupData.data[table] = rows;
                    logger.info(`Tabla ${table} exportada: ${rows.length} registros`);
                } catch (tableError) {
                    logger.error(`❌ Error exportando tabla ${table}: ${tableError.message}`);
                    backupData.data[table] = { error: `Error exportando tabla: ${tableError.message}` };
                }
            }

            const end = Date.now();
            const seconds = ((end - start) / 1000).toFixed(2);

            // guardar archivo .json
            fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

            logger.info(`Backup JSON creado por ${req.user?.username}: ${fileName} en ${seconds}s`);
            console.log(`Backup JSON creado por ${req.user?.username}: ${fileName} en ${seconds}s`);

            // Auditoría
            await auditService.createLog({
                usuario: req.user.username,
                accion: "BACKUP_CREATE",
                tabla_afectada: "SYSTEM",
                registro_id: fileName,
                sql_ejecutado: `GENERATED JSON BACKUP: ${fileName}`,
                sql_rollback: 'CANNOT ROLLBACK FILE CREATION',
                ip_cliente: req.ip,
                fecha_evento: new Date()
            });

            res.json({
                success: true,
                message: "Backup JSON generado correctamente",
                file: fileName,
                durationSeconds: `${seconds}s`,
                tables: Object.keys(backupData.data).length
            });

        } catch (error) {
            logger.error(`Error al generar backup JSON: ${error.message}`);
            res.status(500).json({ 
                success: false, 
                message: "Error en el servidor",
            });
        } finally {
            // LIBERAR CONEXIÓN SIEMPRE
            if (connection) connection.release();
        }
    }

    // ==================================================
    // 2. LISTAR BACKUPS
    // ==================================================
    async listBackups(req, res) {
        try {
            const backupDirs = [
                path.join(__dirname, "../backups/json"),    // JSON
                path.join(__dirname, "../backups/sql")      // SQL
            ];

            let allFiles = [];

            for (const backupDir of backupDirs) {
                if (!fs.existsSync(backupDir)) {
                    fs.mkdirSync(backupDir, { recursive: true });
                    continue;
                }

                const files = fs.readdirSync(backupDir)
                    .filter(file => file.endsWith('.json') || file.endsWith('.sql'))
                    .map(file => {
                        const filePath = path.join(backupDir, file);
                        const stats = fs.statSync(filePath);
                        return {
                            filename: file,
                            path: `/backups/${file}`,
                            size: stats.size,
                            sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
                            createdAt: stats.mtime,
                            readableDate: stats.mtime.toLocaleString('es-ES'),
                            type: file.endsWith('.sql') ? 'sql' : 'json',
                            directory: path.basename(backupDir) // Para debug
                        };
                    });

                allFiles = allFiles.concat(files);
            }

            // Ordenar todos los archivos por fecha
            allFiles.sort((a, b) => b.createdAt - a.createdAt);

            logger.info(`Listado de backups por ${req.user.username}`);

            res.json({ 
                success: true, 
                data: allFiles,
                count: allFiles.length
            });

        } catch (error) {
            console.error('Error en listBackups:', error);
            res.status(500).json({ 
                success: false, 
                message: "Error cargando backups" 
            });
        }
    }

    // ==================================================
    // 3. DESCARGAR BACKUP
    // ==================================================
    async downloadBackup(req, res) {
        try {
            const fileName = req.params.file;

            // VALIDACIÓN ACTUALIZADA para el nuevo formato
            if (!fileName || 
                !(/^backup-json-\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{2}\.json$/.test(fileName) || 
                /^backup-sql-\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{2}\.sql$/.test(fileName))) {
                return res.status(400).json({
                    success: false,
                    message: "Nombre de archivo inválido"
                });
            }

            // DETERMINAR CARPETA SEGÚN TIPO
            let filePath;
            if (fileName.startsWith('backup-json-')) {
                filePath = path.join(__dirname, "../backups/json", fileName);
            } else if (fileName.startsWith('backup-sql-')) {
                filePath = path.join(__dirname, "../backups/sql", fileName);
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Tipo de archivo no soportado"
                });
            }

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: "El backup no existe"
                });
            }

            // Auditoría
            await auditService.createLog({
                usuario: req.user.username,
                accion: "BACKUP_DOWNLOAD",
                tabla_afectada: "SYSTEM",
                registro_id: 0,
                sql_ejecutado: `DOWNLOAD JSON BACKUP: ${fileName}`,
                sql_rollback: 'CANNOT ROLLBACK DOWNLOAD OPERATION',
                ip_cliente: req.ip,
                fecha_evento: new Date()
            });

            logger.info(`Backup JSON descargado por ${req.user.username}: ${fileName}`);

            res.download(filePath);

        } catch (error) {
            logger.error(`Error en descarga de backup JSON: ${error.message}`);
            res.status(500).json({ 
                success: false, 
                message: "Error en el servidor" 
            });
        }
    }

    // ==================================================
    // 4. CREAR BACKUP EN SQL
    // ==================================================
    async createSqlBackup(req, res) {
        try {
            const result = await BackupSqlService.createSqlBackup();
            
            // Auditoría
            await auditService.createLog({
                usuario: req.user.username,
                accion: "BACKUP_CREATE",
                tabla_afectada: "SYSTEM",
                registro_id: result.file,
                sql_ejecutado: `SQL BACKUP: ${result.file}`,
                sql_rollback: `CANNOT ROLLBACK FILE CREATION`,
                ip_cliente: req.ip,
                fecha_evento: new Date()
            });

            logger.info(`Backup SQL creado por ${req.user.username}: ${result.file}`);
            
            res.json({
                success: true,
                message: "Backup SQL generado correctamente",
                file: result.file,
                size: result.sizeMB
            });

        } catch (error) {
            logger.error(`Error backup SQL: ${error.message}`);
            res.status(500).json({ 
                success: false, 
                message: "Error generando backup SQL" 
            });
        }
    }

    // ==================================================
    // 5. VER CONTENIDO JSON
    // ==================================================
    async viewJsonBackup(req, res) {
        try {
            const fileName = req.params.file;
            
            // Validar que sea un archivo JSON
            if (!fileName || !fileName.endsWith('.json') || !fileName.startsWith('backup-json-')) {
                return res.status(400).json({
                    success: false,
                    message: "Solo se pueden visualizar archivos JSON de backup"
                });
            }

            const filePath = path.join(__dirname, "../backups/json", fileName);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: "El backup no existe"
                });
            }

            // Leer y parsear el archivo JSON
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(fileContent);

            // CONTAR REGISTROS DIRECTAMENTE (sin usar this)
            const countTotalRecords = (data) => {
                let total = 0;
                for (const table in data) {
                    if (Array.isArray(data[table])) {
                        total += data[table].length;
                    }
                }
                return total;
            };

            // Auditoría de visualización
            await auditService.createLog({
                usuario: req.user.username,
                accion: "BACKUP_VIEW",
                tabla_afectada: "SYSTEM",
                registro_id: 0,
                sql_ejecutado: `VIEW JSON BACKUP: ${fileName}`,
                sql_rollback: 'CANNOT ROLLBACK VIEW JSON FILE',
                ip_cliente: req.ip,
                fecha_evento: new Date()
            });

            logger.info(`Backup JSON visualizado por ${req.user.username}: ${fileName}`);

            res.json({
                success: true,
                filename: fileName,
                data: jsonData,
                metadata: {
                    tables: Object.keys(jsonData.data || {}).length,
                    totalRecords: countTotalRecords(jsonData.data || {})
                }
            });

        } catch (error) {
            if (error instanceof SyntaxError) {
                logger.error(`Error parseando JSON: ${fileName}`);
                return res.status(400).json({
                    success: false,
                    message: "El archivo JSON está corrupto o tiene formato inválido"
                });
            }
            
            logger.error(`Error en viewJsonBackup: ${error.message}`);
            res.status(500).json({ 
                success: false, 
                message: "Error leyendo el backup" 
            });
        }
    }

}


function getLocalTimestamp() {
    const now = new Date();
    const date = now.toLocaleDateString('es-ES').replace(/\//g, '-');
    const time = now.toLocaleTimeString('es-ES').replace(/:/g, '-');
    
    return `${date}_${time}`;
}

module.exports = new BackupController();