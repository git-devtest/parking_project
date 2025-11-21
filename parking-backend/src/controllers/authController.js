const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const logger = require('../utils/logger');

class AuthController {
  async login(req, res) {
    try {
      // Validar errores de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: errors.array()
        });
      }

      const { username, password } = req.body;

      // Buscar usuario
      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Generar token
      const token = jwt.sign(
        { 
          userId: user.id,
          username: user.username,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      logger.info(`Login exitoso: ${username}`);

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        }
      });

    } catch (error) {
      logger.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  async getProfile(req, res) {
    try {
      res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (error) {
      logger.error('Error obteniendo perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: errors.array()
        });
      }

      const { username, password, email, role = 'OPERATOR' } = req.body;

      // Verificar si usuario ya existe
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El usuario ya existe'
        });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Crear usuario
      const userId = require('crypto').randomUUID();
      await User.create({
        id: userId,
        username,
        password: hashedPassword,
        email,
        role
      });

      logger.info(`Usuario registrado: ${username}`);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente'
      });

    } catch (error) {
      logger.error('Error registrando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }

  async getUsers(req, res) {
    try {
      const users = await User.getAll();
      
      res.json({
        success: true,
        data: {
          users
        }
      });
    } catch (error) {
      logger.error('Error obteniendo usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  }
}

module.exports = new AuthController();