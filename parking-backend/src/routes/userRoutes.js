const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { registerValidation } = require('../middleware/authValidation');

// Listar usuarios (solo ADMIN)
router.get('/', authenticateToken, requireRole(['ADMIN']), userController.getAllUsers);

// Crear usuario (solo ADMIN)
router.post('/', authenticateToken, requireRole(['ADMIN']), registerValidation, userController.createUser);

// Cambiar contraseña (solo el mismo usuario)
router.put('/change-password', authenticateToken, userController.changePassword);

// Obtener usuario por ID (ADMIN y el mismo usuario)
router.get('/:id', authenticateToken, userController.getUserById);

// Editar usuario (ADMIN o el mismo usuario)
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'OPERATOR']), userController.updateUser);

// Inactivar usuario (solo ADMIN)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), userController.deleteUser);

module.exports = router;
