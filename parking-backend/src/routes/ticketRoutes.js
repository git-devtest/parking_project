const express = require('express');
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const ticketController = require("../controllers/ticketController");
const ticketService = require("../services/ticketService");

/**
 * @description Generar ticket
 * @route POST /parking-sessions/:id/generate-ticket
 */
router.post('/parking-sessions/:id/generate-ticket', authenticateToken, ticketService.generateExitTicket);

/**
 * @description Reimprimir ticket
 * @route POST /reprint/:sessionId
 */
router.post('/reprint/:sessionId', authenticateToken, ticketController.reprintTicket);

/**
 * @description Obtener último ticket
 * @route GET /last/:plateNumber
 */
router.get('/last/:plateNumber', authenticateToken, ticketController.getLastTicket);

/**
 * @description Exportar rutas
 * @module ticketRoutes
 */
module.exports = router;