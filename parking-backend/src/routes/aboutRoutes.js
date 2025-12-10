const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');

/**
 * @description: Obtiene la información de la base de datos
 * @route GET /database
 */
router.get('/database', aboutController.getDatabaseInfo);

/**
 * @description Exportar ruta about
 * @module aboutRoutes
 */
module.exports = router;