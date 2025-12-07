const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  
  // Crear usuario
  static async create({ id, username, password, email, role = 'OPERATOR' }) {
    
    await pool.query(
      `INSERT INTO users (id, username, password, email, role)
       VALUES (?, ?, ?, ?, ?)`,
      [id, username, password, email, role]
    );

    // Retornar el usuario recién creado
    return this.findById(id);
  }

  // Buscar por username (para login)
  static async findByUsername(username) {
    const [rows] = await pool.query(
      `SELECT id, username, password, email, role, isActive, createdAt
       FROM users
       WHERE username = ? AND isActive = TRUE`,
      [username]
    );
    return rows[0];
  }

  // Buscar por ID
  static async findById(id) {
    if (!id) {
      throw new Error("User ID is required");
    }

    const [rows] = await pool.query(
      `SELECT id, username, password, email, role, isActive, createdAt
       FROM users
       WHERE id = ?`,
      [id]
    );
    return rows[0];
  }

  // Listar usuarios (con paginación opcional)
  static async getAll(limit = 20, offset = 0) {
    const [rows] = await pool.query(
      `SELECT id, username, email, role, isActive, createdAt
       FROM users
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows;
  }

  // Total usuarios para paginación
  static async count() {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total FROM users WHERE isActive = TRUE`
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

    await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  // Soft delete (inactivar)
  static async delete(id) {
    await pool.query(
      `UPDATE users SET isActive = FALSE WHERE id = ?`,
      [id]
    );
    return true;
  } 

  // Cambiar contraseña
  static async changePassword(id, currentPassword, newPassword) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error("User not found");
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid password");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE users SET password = ? WHERE id = ?`,
      [hashedPassword, id]
    );
    return true;
  }

}

module.exports = User;
