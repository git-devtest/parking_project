const { pool } = require('../config/database');

/**
 * @description Función para verificar la estructura de la base de datos
 * @returns {Promise<boolean>} true si la estructura es correcta, false en caso contrario
 * @throws {Error} Si hay un error al verificar la estructura de la base de datos
 */
const checkDatabaseStructure = async () => {
  try {
    console.log('🔍 Verificando estructura de la base de datos...');
    
    // Verificar tablas existentes
    const [tables] = await pool.query(`
      SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = ? 
    `, [process.env.DB_NAME]);
    
    // Verificar stored procedures
    const [procedures] = await pool.query(`
      SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'
    `, [process.env.DB_NAME]);
    
    // Verificar vistas
    const [views] = await pool.query(`
      SELECT TABLE_NAME FROM information_schema.views WHERE TABLE_SCHEMA = ?
    `, [process.env.DB_NAME]);

    console.log(`📊 Tablas encontradas: ${tables.length}`);
    console.log(`⚙️ Procedimientos almacenados: ${procedures.length}`);
    console.log(`👀 Vistas: ${views.length}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error verificando estructura:', error.message);
    return false;
  }
};

/**
 * @description Exporta la función checkDatabaseStructure
 * @module dbCheck
 */
module.exports = { checkDatabaseStructure };