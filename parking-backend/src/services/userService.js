const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const logger = require('../config/logger');

const getUserByUsername = async (username) => {
  const [rows] = await pool.query(
    'SELECT id, username, password, email, role FROM users WHERE username = ?', 
    [username]
  );
  return rows[0];
}

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

module.exports = {
  getUserByUsername,
  createUser
};