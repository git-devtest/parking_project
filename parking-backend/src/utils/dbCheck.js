const { pool } = require('../config/database');

const checkDatabaseStructure = async () => {
  try {
    console.log('🔍 Verificando estructura de la base de datos...');
    
    // Verificar tablas existentes
    const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE TABLE_SCHEMA = ?
    `, [process.env.DB_NAME]);
    
    console.log(`📊 Tablas encontradas: ${tables.length}`);
    //tables.forEach(table => console.log(`   - ${table.TABLE_NAME}`));
    
    // Verificar stored procedures
    const [procedures] = await pool.query(`
      SELECT ROUTINE_NAME 
      FROM information_schema.ROUTINES 
      WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'
    `, [process.env.DB_NAME]);
    
    console.log(`⚙️  Procedimientos almacenados: ${procedures.length}`);
    //procedures.forEach(proc => console.log(`   - ${proc.ROUTINE_NAME}`));
    
    // Verificar vistas
    const [views] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.views 
      WHERE TABLE_SCHEMA = ?
    `, [process.env.DB_NAME]);
    
    console.log(`👀 Vistas: ${views.length}`);
    //views.forEach(view => console.log(`   - ${view.TABLE_NAME}`));
    
    return true;
  } catch (error) {
    console.error('❌ Error verificando estructura:', error.message);
    return false;
  }
};

module.exports = { checkDatabaseStructure };