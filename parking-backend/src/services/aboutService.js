const { pool } = require('../config/database');
const logger = require('../utils/logger');
// Función para obtener información sobre la base de datos
const getDatabaseInfo = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT DATABASE() AS dbName, VERSION() AS dbVersion');
    connection.release();
    logger.info('Nombre de Base de datos:', rows[0].dbName);
    logger.info('Version de Base de datos:', rows[0].dbVersion);
    return {
      name: rows[0].dbName,
      version: rows[0].dbVersion
    };
  } catch (error) {
    logger.error('Error obteniendo información de la base de datos:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }    
};

module.exports = { getDatabaseInfo };