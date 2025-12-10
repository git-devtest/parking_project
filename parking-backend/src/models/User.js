const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * @description Modelo de usuario
 * @module User
 */
class User {
  
  /**
   * @description Crear usuario
   * @param {Object} data - Datos del usuario
   * @param {string} data.id - ID del usuario
   * @param {string} data.username - Nombre de usuario
   * @param {string} data.password - Contraseña
   * @param {string} data.email - Correo electrónico
   * @param {string} data.role - Rol del usuario
   */
  static async create({ id, username, password, email, role = 'OPERATOR' }) {
    
    await pool.query(
      `INSERT INTO users (id, username, password, email, role)
       VALUES (?, ?, ?, ?, ?)`,
      [id, username, password, email, role]
    );

    // Retornar el usuario recién creado
    return this.findById(id);
  }

  /**
   * @description Buscar por username (para login)
   * @param {string} username - Nombre de usuario
   */
  static async findByUsername(username) {
    const [rows] = await pool.query(
      `SELECT id, username, password, email, role, isActive, createdAt
       FROM users
       WHERE username = ? AND isActive = TRUE`,
      [username]
    );
    return rows[0];
  }

  /**
   * @description Buscar por ID
   * @param {string} id - ID del usuario
   */
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

  /**
   * @description Listar usuarios (con paginación opcional)
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Desplazamiento
   */
  static async getAll(limit = 20, offset = 0) {
    const [rows] = await pool.query(
      `SELECT id, username, email, role, isActive, createdAt
       FROM users
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows;
  }

  /**
   * @description Total usuarios para paginación
   */
  static async count() {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total FROM users WHERE isActive = TRUE`
    );
    return rows[0].total;
  }

  /**
   * @description Actualizar usuario
   * @param {string} id - ID del usuario
   * @param {Object} data - Datos del usuario
   */
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

  /**
   * @description Soft delete (inactivar)
   * @param {string} id - ID del usuario
   */
  static async delete(id) {
    await pool.query(
      `UPDATE users SET isActive = FALSE WHERE id = ?`,
      [id]
    );
    return true;
  } 

  /**
   * @description Cambiar contraseña
   * @param {string} id - ID del usuario
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   */
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

/**
 * @description Exportar modelo
 * @module User
 */
module.exports = User;
