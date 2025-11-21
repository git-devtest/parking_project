const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');

// Ruta para obtener información sobre la base de datos
router.get('/database', aboutController.getDatabaseInfo);

module.exports = router;