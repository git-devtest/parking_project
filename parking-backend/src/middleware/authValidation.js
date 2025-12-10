const { body } = require('express-validator');

/**
 * @description Validación de inicio de sesión
 * @module loginValidation
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función siguiente
 */
const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('El usuario es requerido')
    .isLength({ min: 3, max: 50 })
    .withMessage('El usuario debe tener entre 3 y 50 caracteres'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

/**
 * @description Validación de registro
 * @module registerValidation
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función siguiente
 */
const registerValidation = [
  body('username')
    .notEmpty()
    .withMessage('El usuario es requerido')
    .isLength({ min: 3, max: 50 })
    .withMessage('El usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El usuario solo puede contener letras, números y guiones bajos'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('El email debe ser válido'),
  
  body('role')
    .optional()
    .isIn(['ADMIN', 'OPERATOR'])
    .withMessage('El rol debe ser ADMIN u OPERATOR')
];

/**
 * @description Exportar validaciones
 * @module exportValidations
 */
module.exports = { loginValidation, registerValidation };