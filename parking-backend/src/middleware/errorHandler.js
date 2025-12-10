const logger = require('../utils/logger');

/**
 * @description Manejador de errores
 * @module errorHandler
 * @param {Object} err - Objeto de error
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función siguiente
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // MySQL error
  if (err.code && err.code.startsWith('ER_')) {
    return res.status(400).json({
      success: false,
      message: 'Error en la base de datos',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
  }

  // Validation error
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: err.details.map(detail => detail.message)
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * @description Manejador de rutas no encontradas
 * @module notFound
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.path}`
  });
};

/**
 * @description Exportar middleware
 * @module exportMiddleware
 */
module.exports = { errorHandler, notFound };