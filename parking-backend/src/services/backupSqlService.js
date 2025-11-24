const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class BackupSqlService {
    
    static async createSqlBackup() {
        return new Promise((resolve, reject) => {
            const fileName = `backup-sql-${getLocalTimestamp()}.sql`;
            const backupDir = path.join(__dirname, '../../src/backups/sql');
            const filePath = path.join(backupDir, fileName);
            
            // Crear directorio si no existe
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            logger.info(`🔄 Iniciando backup SQL: ${fileName}`);
            const mysqldumpPath = `"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe"`;
            const command = `${mysqldumpPath} -h ${process.env.DB_HOST || 'localhost'} -u ${process.env.DB_USER} -p"${process.env.DB_PASSWORD}" ${process.env.DB_NAME} > "${filePath}"`;
            console.log(`🔧 Comando: ${command}`);
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    logger.error(`❌ Error mysqldump: ${error.message}`);
                    reject(error);
                    return;
                }
                
                // Verificar que el archivo se creó
                if (fs.existsSync(filePath)) {
                    const stats = fs.statSync(filePath);
                    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                    
                    logger.info(`✅ Backup SQL completado: ${fileName} (${sizeMB} MB)`);
                    resolve({ 
                        success: true, 
                        file: fileName,
                        path: filePath,
                        size: stats.size,
                        sizeMB: sizeMB
                    });
                } else {
                    reject(new Error('Archivo de backup no se creó'));
                }
            });
        });
    }
}

function getLocalTimestamp() {
    const now = new Date();
    const date = now.toLocaleDateString('es-ES').replace(/\//g, '-');
    const time = now.toLocaleTimeString('es-ES').replace(/:/g, '-');
    
    return `${date}_${time}`;
}

module.exports = BackupSqlService;