const mysql = require('mysql2/promise');
const logger = require('../utils/logger');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // máximo número de conexiones inactivas
  idleTimeout: 60000, // tiempo de inactividad en ms
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

// Manejar eventos del pool para mejor debugging
pool.on('acquire', (connection) => {
  logger.info('🔗 Conexión adquirida:', connection.threadId);
});

pool.on('release', (connection) => {
  logger.info('🔄 Conexión liberada:', connection.threadId);
});

// Test connection()
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info('✅ Conectado a la base de datos MySQL');

    // Verificar versión de MySQL
    const [rows] = await connection.query('SELECT VERSION() as version');
    logger.info(`📋 Versión de MySQL: ${rows[0].version}`);

    connection.release();
  } catch (error) {
    logger.error('❌ Error conectando a la base de datos:', error.message);
    process.exit(1);
  }
};

// Función para cerrar el pool gracefulmente
const closePool = async () => {
  try {
    await pool.end();
    logger.info('🔒 Pool de conexiones cerrado');
  } catch (error) {
    logger.error('❌ Error cerrando el pool:', error.message);
  }
};

module.exports = { pool, testConnection, closePool };