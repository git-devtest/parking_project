const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { loginValidation, registerValidation } = require('../middleware/authValidation');

// Login
router.post('/login', loginValidation, authController.login);

// Obtener perfil (protegido)
router.get('/me', authenticateToken, authController.getProfile);

// Registrar usuario (solo admin)
router.post('/register', authenticateToken, requireRole(['ADMIN']), registerValidation, authController.register);

// Obtener usuarios (solo admin)
router.get('/users', authenticateToken, requireRole(['ADMIN']), authController.getUsers);

module.exports = router;