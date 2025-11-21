const User = require('../models/User');
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const auditService = require('../services/auditService'); // ajusta si tu service tiene otro nombre
const logger = require('../utils/logger'); // tu winston
const crypto = require('crypto');

class UserController {

  // LISTAR (no audit obligatorio para GET, pero logueamos acceso)
  async getAllUsers(req, res) {
    try {
      const users = await User.getAll();
      logger.info(`GET /api/users by ${req.user?.username || 'anonymous'}`);
      return res.json({ success: true, data: users });
    } catch (error) {
      logger.error(`Error getAllUsers: ${error.message}`, { error });
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  // OBTENER POR ID (logueo de acceso)
  async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

      // Solo ADMIN o el propio usuario pueden ver
      if (req.user.role !== 'ADMIN' && req.user.id !== req.params.id) {
        logger.warn(`Unauthorized attempt to access user ${req.params.id} by ${req.user.username}`);
        return res.status(403).json({ success: false, message: 'No autorizado' });
      }

      logger.info(`GET /api/users/${req.params.id} by ${req.user.username}`);
      return res.json({ success: true, data: user });
    } catch (error) {
      logger.error(`Error getUserById: ${error.message}`, { error });
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  // CREAR (INSERT) -> registra audit_log y winston
  async createUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { username, password, email, role } = req.body;
      const id = crypto.randomUUID();

      const hashed = await bcrypt.hash(password, 10);

      // Crear usuario (modelo debe insertar hashed password)
      await User.create({ id, username, password: hashed, email, role: role || 'OPERATOR' });

      // Construir SQL descriptivo y rollback (NO incluimos la contraseña)
      const sqlExecuted = `INSERT INTO Users (id, username, email, role) VALUES ('${id}','${username}','${email}','${role || 'OPERATOR'}');`;
      const sqlRollback = `UPDATE Users SET isActive = FALSE WHERE id='${id}';`;


      // Registrar auditoría
      await auditService.getAuditLogs ? /* si tu service tiene otro nombre */ null : null;

      const rawIp = req.ip || req.connection.remoteAddress || "unknown";
      const ip = (rawIp === "::1" || rawIp === "127.0.0.1" ? "localhost" : rawIp);

      // Llamada genérica (ajusta al método real)
      await auditService.createLog({
        usuario: req.user.username,
        accion: 'INSERT',
        tabla_afectada: 'Users',
        registro_id: id,
        sql_ejecutado: sqlExecuted,
        sql_rollback: sqlRollback,
        ip_cliente: ip,
        fecha_evento: new Date()
      });

      logger.info(`User created ${id} by ${req.user.username}`);

      return res.status(201).json({
        success: true,
        message: 'Usuario creado correctamente',
        data: { id, username, email, role: role || 'OPERATOR' }
      });

    } catch (error) {
      logger.error(`Error createUser: ${error.message}`, { error });
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  // ACTUALIZAR (UPDATE) — versión final, estable y full auditoría
async updateUser(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body;

    // 1. Verificar existencia del usuario
    const exists = await User.findById(id);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    console.log("=== DEBUG UPDATE USER ===");
    console.log("Prev user:", exists);
    console.log("Payload:", payload);

    // Objetos base
    const fields = [];
    const values = [];

    // =============================
    // 2. Procesar campos normales
    // =============================

    // username
    if (
      typeof payload.username === "string" &&
      payload.username.trim() !== "" &&
      payload.username.trim() !== exists.username
    ) {
      fields.push("username = ?");
      values.push(payload.username.trim());
    }

    // email
    if (
      typeof payload.email === "string" &&
      payload.email.trim() !== "" &&
      payload.email.trim() !== exists.email
    ) {
      fields.push("email = ?");
      values.push(payload.email.trim());
    }

    // role
    if (
      typeof payload.role === "string" &&
      payload.role.trim() !== "" &&
      payload.role.trim() !== exists.role
    ) {
      fields.push("role = ?");
      values.push(payload.role.trim());
    }

    // isActive (nuevo)
    if (
      payload.isActive !== undefined &&
      String(payload.isActive) !== String(exists.isActive)
    ) {
      fields.push("isActive = ?");
      values.push(Number(payload.isActive));
    }

    // =============================
    // 3. Procesar password
    // =============================
    let passwordWasUpdated = false;

    if (
      typeof payload.password === "string" &&
      payload.password.trim() !== ""
    ) {
      // Encriptar password
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash(payload.password, 10);

      fields.push("password = ?");
      values.push(hashedPassword);
      passwordWasUpdated = true;
    }

    // =============================
    // 4. Validar si NO hay cambios
    // =============================
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No hay cambios para actualizar"
      });
    }

    // =============================
    // 5. Construir SQL EXECUTED
    //     → NO mostramos password real
    // =============================
    const sqlExecutedParts = [];

    if (payload.username && payload.username !== exists.username) {
      sqlExecutedParts.push(`username='${payload.username}'`);
    }

    if (payload.email && payload.email !== exists.email) {
      sqlExecutedParts.push(`email='${payload.email}'`);
    }

    if (payload.role && payload.role !== exists.role) {
      sqlExecutedParts.push(`role='${payload.role}'`);
    }

    if (passwordWasUpdated) {
      sqlExecutedParts.push(`password='[ENCRYPTED]'`);
    }

    const sqlExecuted = `UPDATE Users SET ${sqlExecutedParts.join(", ")} WHERE id='${id}';`;

    // =============================
    // 6. Construir SQL ROLLBACK (estado previo)
    // =============================
    const sqlRollback = `
      UPDATE Users SET
        username='${exists.username}',
        email='${exists.email}',
        role='${exists.role}'
      WHERE id='${id}';
    `.trim();

    // =============================
    // 7. Ejecutar UPDATE real
    // =============================
    const updateSql = `UPDATE Users SET ${fields.join(", ")} WHERE id = ?`;
    values.push(id);

    const [result] = await pool.execute(updateSql, values);

    // =============================
    // 8. IP normalizada
    // =============================
    const rawIp = req.ip || req.connection.remoteAddress || "unknown";
    const ip = (rawIp === "::1" || rawIp === "127.0.0.1") ? "localhost" : rawIp;

    // =============================
    // 9. Auditoría
    // =============================
    await auditService.createLog({
      usuario: req.user.username,
      accion: "UPDATE",
      tabla_afectada: "Users",
      registro_id: id,
      sql_ejecutado: sqlExecuted,
      sql_rollback: sqlRollback,
      ip_cliente: ip,
      fecha_evento: new Date()
    });

    // =============================
    // 10. Winston
    // =============================
    logger.info(`User ${id} updated by ${req.user.username}`);

    return res.json({
      success: true,
      message: "Usuario actualizado correctamente",
      affectedRows: result.affectedRows
    });

  } catch (error) {
    logger.error(`Error updateUser: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
}


  // DELETE (soft delete) -> audit + logger
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const exists = await User.findById(id);
      if (!exists) return res.status(404).json({ success: false, message: 'User not found' });

      // sql ejecutado y rollback
      const sqlExecuted = `UPDATE Users SET isActive = FALSE WHERE id='${id}';`;
      const sqlRollback = `UPDATE Users SET isActive = TRUE WHERE id='${id}';`;

      await User.delete(id); // soft delete

      const rawIp = req.ip || req.connection.remoteAddress || "unknown";
      const ip = (rawIp === "::1" || rawIp === "127.0.0.1" ? "localhost" : rawIp);

      await auditService.createLog({
        usuario: req.user.username,
        accion: 'DELETE',
        tabla_afectada: 'Users',
        registro_id: id,
        sql_ejecutado: sqlExecuted,
        sql_rollback: sqlRollback,
        ip_cliente: ip,
        fecha_evento: new Date()
      });

      logger.info(`User soft-deleted ${id} by ${req.user.username}`);

      return res.json({ success: true, message: 'Usuario inactivado correctamente' });

    } catch (error) {
      logger.error(`Error deleteUser: ${error.message}`, { error });
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }
}

module.exports = new UserController();
