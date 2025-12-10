const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { loginValidation, registerValidation } = require('../middleware/authValidation');

/**
 * @description Login
 * @route POST /login
 */
router.post('/login', loginValidation, authController.login);

/**
 * @description Obtener perfil (protegido)
 * @route GET /me
 */
router.get('/me', authenticateToken, authController.getProfile);

/**
 * @description Registrar usuario (solo admin)
 * @route POST /register
 */
router.post('/register', authenticateToken, requireRole(['ADMIN']), registerValidation, authController.register);

/**
 * @description Obtener usuarios (solo admin)
 * @route GET /users
 */
router.get('/users', authenticateToken, requireRole(['ADMIN']), authController.getUsers);

/**
 * @description Exportar rutas
 * @module authRoutes
 */
module.exports = router;