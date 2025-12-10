require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

/**
 * @description Función para crear el usuario admin
 * @returns {Promise<void>} void
 * @throws {Error} Si hay un error al crear el usuario admin
 */
const initAdminUser = async () => {
  try {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Verificar si ya existe
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?',[username]);

    if (existing.length > 0) {
      console.log('✅ Usuario admin ya existe');
      return;
    }

    // Crear admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = require('crypto').randomUUID();
    
    /**
     * @description Inserta un nuevo usuario en la base de datos
     * @param {string} userId - ID del usuario
     * @param {string} username - Nombre de usuario
     * @param {string} password - Contraseña del usuario
     * @param {string} email - Email del usuario
     * @param {string} role - Rol del usuario
     * @returns {Promise<void>} void
     * @throws {Error} Si hay un error al insertar el usuario
     */
    await pool.query(
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

/**
 * @description Ejecuta la función initAdminUser si es el módulo principal
 * @returns {Promise<void>} void
 * @throws {Error} Si hay un error al ejecutar la función initAdminUser
 */
if (require.main === module) {
  initAdminUser().then(() => process.exit(0));
}

/**
 * @description Exporta la función initAdminUser
 * @module initAdmin
 */
module.exports = initAdminUser;