const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');
const { authenticateToken, requireRole } = require("../middleware/auth");

/**
 * @description Dashboard completo
 * @route GET /dashboard
 */
router.get('/dashboard', authenticateToken, requireRole(["ADMIN"]), insightsController.getDashboard);

/**
 * @description Endpoints específicos
 * @route GET /occupancy/current
 */
router.get('/occupancy/current', authenticateToken, requireRole(["ADMIN"]), insightsController.getCurrentOccupancy);

/**
 * @description Endpoints específicos
 * @route GET /vehicles/currently-parked
 */
router.get('/vehicles/currently-parked', authenticateToken, requireRole(["ADMIN"]), insightsController.getCurrentlyParked);

/**
 * @description Exportar rutas
 * @module insightsRoutes
 */
module.exports = router;