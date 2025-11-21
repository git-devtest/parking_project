// =============================================
// CONFIGURACIÓN DE ZONA HORARIA
// =============================================
process.env.TZ = 'America/Bogota'; // Ajusta según tu país
console.log('🕐 Servidor configurado con zona horaria:', process.env.TZ);
console.log('📍 Hora actual del servidor:', new Date().toString());
// =============================================

require('dotenv').config();
const app = require('./src/app');
const { testConnection, closePool } = require('./src/config/database');
const { checkDatabaseStructure } = require('./src/utils/dbCheck');
const logger = require('./src/utils/logger');

// Import script to initialize admin user
const initAdminUser = require('./src/scripts/initAdmin');

const PORT = process.env.PORT || 3000;

// Test database connection and start server
const startServer = async () => {

  try {
    await testConnection();

    // Inicializar usuario admin
    await initAdminUser();
    
    // Verificar estructura de la base de datos (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      await checkDatabaseStructure();
    }
    
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      logger.info(`📊 Ambiente: ${process.env.NODE_ENV}`);
      logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
      logger.info('🕐 Servidor configurado con zona horaria:', process.env.TZ);
    });

    // Manejar errores del servidor
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

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`📞 Recibido ${signal}, cerrando servidor gracefully...`);
  
  try {
    // Dar tiempo para que las conexiones actuales terminen
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

// Manejadores de señales
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Manejar unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Manejar uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

startServer();