const mysql = require('mysql2/promise');
const logger = require('../utils/logger');
require('dotenv').config();

/**
 * @description Configuración de la base de datos
 * @type {Object} dbConfig
 * @property {string} host - Host de la base de datos
 * @property {string} user - Usuario de la base de datos
 * @property {string} password - Contraseña de la base de datos
 * @property {string} database - Nombre de la base de datos
 * @property {number} port - Puerto de la base de datos
 * @property {boolean} waitForConnections - Esperar conexiones
 * @property {number} connectionLimit - Límite de conexiones
 * @property {number} maxIdle - Máximo número de conexiones inactivas
 * @property {number} idleTimeout - Tiempo de inactividad en ms
 * @property {number} queueLimit - Límite de la fila
 */
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

/**
 * @description Pool de conexiones a la base de datos
 * @type {Pool} pool de conexiones
 */
const pool = mysql.createPool(dbConfig);

/**
 * @description Manejar eventos del pool para mejor debugging
 * @param {PoolConnection} connection - Conexión adquirida
 */
pool.on('acquire', (connection) => {
  logger.info('🔗 Conexión adquirida:', connection.threadId);
});

/**
 * @description Manejar eventos del pool para mejor debugging
 * @param {PoolConnection} connection - Conexión liberada
 */
pool.on('release', (connection) => {
  logger.info('🔄 Conexión liberada:', connection.threadId);
});

/**
 * @description Test connection() Prueba la conexión a la base de datos
 * @returns {Promise<void>}
 * @throws {Error} Si hay un error al conectarse a la base de datos
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info('✅ Conectado a la base de datos MySQL');

    /** Verificar versión de MySQL */
    const [rows] = await connection.query('SELECT VERSION() as version');
    logger.info(`📋 Versión de MySQL: ${rows[0].version}`);

    /** Liberar la conexión */
    connection.release();
  } catch (error) {
    logger.error('❌ Error conectando a la base de datos:', error.message);
    process.exit(1);
  }
};

/**
 * @description Función para cerrar el pool gracefulmente
 * @returns {Promise<void>}
 * @throws {Error} Si hay un error al cerrar el pool
 */
const closePool = async () => {
  try {
    await pool.end();
    logger.info('🔒 Pool de conexiones cerrado');
  } catch (error) {
    logger.error('❌ Error cerrando el pool:', error.message);
  }
};

/**
 * @description Exportar la pool de conexiones y las funciones
 * @returns {Object} pool de conexiones y las funciones
 */
module.exports = { pool, testConnection, closePool };