const mysqldump = require('mysqldump');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * @description Servicio de respaldo SQL
 */
class BackupSqlService {
    
    /**
     * @description Crear un respaldo SQL usando mysqldump library
     * @returns {Promise<{success: boolean, file: string, path: string, size: number, sizeMB: string}>}
     */
    static async createSqlBackup() {
        const fileName = `backup-sql-${getLocalTimestamp()}.sql`;
        const backupDir = path.join(__dirname, '../backups/sql');
        const filePath = path.join(backupDir, fileName);
        
        // Crear directorio si no existe
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        logger.info(`📄 Iniciando backup SQL: ${fileName}`);
        
        try {
            // Usar mysqldump library (funciona en cualquier OS)
            await mysqldump({
                connection: {
                    host: process.env.DB_HOST,
                    user: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    database: process.env.DB_NAME,
                    port: process.env.DB_PORT || 3306
                },
                dumpToFile: filePath,
                compressFile: false,
            });
            
            // Verificar que el archivo se creó
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                
                logger.info(`✅ Backup SQL completado: ${fileName} (${sizeMB} MB)`);
                return { 
                    success: true, 
                    file: fileName,
                    path: filePath,
                    size: stats.size,
                    sizeMB: sizeMB
                };
            } else {
                throw new Error('Archivo de backup no se creó');
            }
            
        } catch (error) {
            logger.error(`❌ Error mysqldump: ${error.message}`);
            throw error;
        }
    }
}

/**
 * @description Exportar servicios
 * @module backupSqlService
 */
module.exports = BackupSqlService;