const mysql = require('mysql2/promise');
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
  acquireTimeout: 60000, // tiempo máximo para adquirir conexión
  timeout: 60000, // tiempo máximo de inactividad de la conexión
  reconnect: true,
  // Opciones SSL si es necesario
  ssl: false,
  // Habilitar keep-alive
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

const pool = mysql.createPool(dbConfig);

// Manejar eventos del pool para mejor debugging
pool.on('acquire', (connection) => {
  console.log('🔗 Conexión adquirida:', connection.threadId);
});

pool.on('release', (connection) => {
  console.log('🔄 Conexión liberada:', connection.threadId);
});

pool.on('enqueue', () => {
  console.log('⏳ Solicitud en cola esperando conexión disponible');
});

// Test connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado a la base de datos MySQL');

    // Verificar versión de MySQL
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log(`📋 Versión de MySQL: ${rows[0].version}`);

    connection.release();
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    process.exit(1);
  }
};

// Función para cerrar el pool gracefulmente
const closePool = async () => {
  try {
    await pool.end();
    console.log('🔒 Pool de conexiones cerrado');
  } catch (error) {
    console.error('❌ Error cerrando el pool:', error.message);
  }
};

module.exports = { pool, testConnection, closePool };