const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');

/**
 * @description Ruta para obtener información sobre la base de datos
 * @route GET /database
 */
router.get('/database', aboutController.getDatabaseInfo);

/**
 * @description Exportar rutas
 * @module aboutRoutes
 */
module.exports = router;