const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

/**
 * @description Obtener usuario por nombre de usuario
 * @param {string} username - Nombre de usuario
 * @returns {Promise<{success: boolean, data: Array}>} - Usuario
 */
const getUserByUsername = async (username) => {
  const [rows] = await pool.query(
    'SELECT id, username, password, email, role FROM users WHERE username = ?', 
    [username]
  );
  return rows[0];
}

/**
 * @description Crear usuario
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña
 * @param {string} email - Email
 * @param {string} role - Rol
 * @returns {Promise<{success: boolean, data: Array}>} - Usuario
 */
const createUser = async (username, password, email, role = 'USER') => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = require('crypto').randomUUID();
    await pool.query(
    'INSERT INTO users (id, username, password, email, role) VALUES (?, ?, ?, ?, ?)',
    [userId, username, hashedPassword, email, role]
  );
  logger.info(`Usuario creado: ${username} con rol: ${role}`);
  console.log('✅ Usuario creado exitosamente');
  console.log(`👤 Usuario: ${username}`);
  console.log(`🔑 Password: ${password}`);
  return { id: userId, username, email, role };
}

/**
 * @description Exportar servicios
 * @module userService
 */
module.exports = { getUserByUsername, createUser };