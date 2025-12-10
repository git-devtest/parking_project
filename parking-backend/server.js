require('dotenv').config();
const app = require('./src/app');
const { testConnection, closePool } = require('./src/config/database');
const { checkDatabaseStructure } = require('./src/utils/dbCheck');
const logger = require('./src/utils/logger');

// =============================================
// CONFIGURACIÓN DE ZONA HORARIA
// =============================================
process.env.TZ = 'America/Bogota'; // Ajusta según tu país
console.log('🕐 Servidor configurado con zona horaria:', process.env.TZ);
console.log('📍 Hora actual del servidor:', new Date().toString());
// =============================================

/**
 * @description Importa el script para inicializar el usuario admin
 * @module initAdmin
 */
const initAdminUser = require('./src/scripts/initAdmin');

/**
 * @description Puerto del servidor
 * @module PORT
 */
const PORT = process.env.PORT || 3000;

/**
 * @description Test database connection and start server
 * @module startServer
 */
const startServer = async () => {

  try {
    await testConnection();

    /**
     * @description Inicializa el usuario admin
     * @module initAdminUser
     */
    await initAdminUser();
    
    /**
     * @description Verificar estructura de la base de datos (solo en desarrollo)
     * @module checkDatabaseStructure
     */
    if (process.env.NODE_ENV === 'development') {
      await checkDatabaseStructure();
    }
    
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      logger.info(`📊 Ambiente: ${process.env.NODE_ENV}`);
      logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
      logger.info('🕐 Servidor configurado con zona horaria:', process.env.TZ);
    });

    /**
     * @description Manejar errores del servidor
     * @module errorServer
     */
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Puerto ${PORT} ya está en uso`);
      } else {
        logger.error('❌ Error del servidor:', error);
      }
      process.exit(1);
    });

    return server;
  } catch (error) {
    logger.error('Error iniciando el servidor:', error);
    process.exit(1);
  }
};

/**
 * @description Graceful shutdown
 * @module shutdown
 */
const shutdown = async (signal) => {
  logger.info(`📞 Recibido ${signal}, cerrando servidor gracefully...`);
  
  try {
    /**
     * @description Dar tiempo para que las conexiones actuales terminen
     * @module timeout
     */
    setTimeout(() => {
      logger.warn('⏰ Timeout de shutdown forzado');
      process.exit(1);
    }, 10000);

    await closePool();
    logger.info('✅ Servidor cerrado exitosamente');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error durante el shutdown:', error);
    process.exit(1);
  }
};

/**
 * @description Manejadores de señales
 * @module signalHandlers
 */
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

/**
 * @description Manejar unhandled rejections
 * @module unhandledRejections
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

/**
 * @description Manejar uncaught exceptions
 * @module uncaughtExceptions
 */
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

/**
 * @description Iniciar el servidor
 * @module startServer
 */
startServer();