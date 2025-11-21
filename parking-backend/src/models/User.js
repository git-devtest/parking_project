const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  
  // Crear usuario
  static async create({ id, username, password, email, role = 'OPERATOR' }) {
    
    await pool.execute(
      `INSERT INTO Users (id, username, password, email, role)
       VALUES (?, ?, ?, ?, ?)`,
      [id, username, password, email, role]
    );

    // Retornar el usuario recién creado
    return this.findById(id);
  }

  // Buscar por username (para login)
  static async findByUsername(username) {
    const [rows] = await pool.execute(
      `SELECT id, username, password, email, role, isActive, createdAt
       FROM Users
       WHERE username = ? AND isActive = TRUE`,
      [username]
    );
    return rows[0];
  }

  // Buscar por ID
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, username, email, role, isActive, createdAt
       FROM Users
       WHERE id = ?`,
      [id]
    );
    return rows[0];
  }

  // Listar usuarios (con paginación opcional)
  static async getAll(limit = 20, offset = 0) {
    const [rows] = await pool.execute(
      `SELECT id, username, email, role, isActive, createdAt
       FROM Users
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows;
  }

  // Total usuarios para paginación
  static async count() {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM Users WHERE isActive = TRUE`
    );
    return rows[0].total;
  }

  // Actualizar usuario
  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.username) { fields.push("username = ?"); values.push(data.username); }
    if (data.email) { fields.push("email = ?"); values.push(data.email); }
    if (data.role) { fields.push("role = ?"); values.push(data.role); }

    // Si viene password → encriptar
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      fields.push("password = ?");
      values.push(hashedPassword);
    }

    if (fields.length === 0) return null;

    values.push(id);

    await pool.execute(
      `UPDATE Users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  // Soft delete (inactivar)
  static async delete(id) {
    await pool.execute(
      `UPDATE Users SET isActive = FALSE WHERE id = ?`,
      [id]
    );
    return true;
  } 
}

module.exports = User;
