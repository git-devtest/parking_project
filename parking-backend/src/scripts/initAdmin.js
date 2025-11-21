require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const initAdminUser = async () => {
  try {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Verificar si ya existe
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      console.log('✅ Usuario admin ya existe');
      return;
    }

    // Crear admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = require('crypto').randomUUID();
    
    await pool.execute(
      'INSERT INTO users (id, username, password, email, role) VALUES (?, ?, ?, ?, ?)',
      [userId, username, hashedPassword, 'admin@parqueadero.com', 'ADMIN']
    );

    console.log('✅ Usuario admin creado exitosamente');
    console.log(`👤 Usuario: ${username}`);
    console.log(`🔑 Password: ${password}`);
    
  } catch (error) {
    console.error('❌ Error creando usuario admin:', error);
  }
};

// Ejecutar si es el módulo principal
if (require.main === module) {
  initAdminUser().then(() => process.exit(0));
}

module.exports = initAdminUser;