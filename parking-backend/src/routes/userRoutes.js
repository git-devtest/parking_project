const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { registerValidation } = require('../middleware/authValidation');

/**
 * @description Listar usuarios (solo ADMIN)
 * @route GET /users
 */
router.get('/', authenticateToken, requireRole(['ADMIN']), userController.getAllUsers);

/**
 * @description Crear usuario (solo ADMIN)
 * @route POST /users
 */
router.post('/', authenticateToken, requireRole(['ADMIN']), registerValidation, userController.createUser);

/**
 * @description Cambiar contraseña (solo el mismo usuario)
 * @route PUT /change-password
 */
router.put('/change-password', authenticateToken, userController.changePassword);

/**
 * @description Obtener usuario por ID (ADMIN y el mismo usuario)
 * @route GET /:id
 */
router.get('/:id', authenticateToken, userController.getUserById);

/**
 * @description Editar usuario (ADMIN o el mismo usuario)
 * @route PUT /:id
 */
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'OPERATOR']), userController.updateUser);

/**
 * @description Inactivar usuario (solo ADMIN)
 * @route DELETE /:id
 */
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), userController.deleteUser);

/**
 * @description Exportar rutas
 * @module userRoutes
 */
module.exports = router;
