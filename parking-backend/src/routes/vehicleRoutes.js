const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { validateVehicleEntry, validateVehicleExit } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Registrar entrada de vehículo
router.post('/entry', authenticateToken, validateVehicleEntry, vehicleController.registerEntry);

// Registrar salida de vehículo
router.post('/exit', authenticateToken, validateVehicleExit, vehicleController.registerExit);

// Obtener vehículos estacionados
router.get('/parked', authenticateToken, vehicleController.getParkedVehicles);

// Obtener capacidad del estacionamiento
router.get('/capacity', authenticateToken, vehicleController.getParkingCapacity);

// Obtener historial de vehículos
router.get('/history', authenticateToken, vehicleController.getVehicleHistory);

module.exports = router;