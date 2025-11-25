// routes/insightsRoutes.js
const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');
const { authenticateToken, requireRole } = require("../middleware/auth");

// Dashboard completo
router.get('/dashboard', authenticateToken, requireRole(["ADMIN"]), insightsController.getDashboard);

// Endpoints específicos
router.get('/occupancy/current', authenticateToken, requireRole(["ADMIN"]), insightsController.getCurrentOccupancy);
router.get('/vehicles/currently-parked', authenticateToken, requireRole(["ADMIN"]), insightsController.getCurrentlyParked);

module.exports = router;