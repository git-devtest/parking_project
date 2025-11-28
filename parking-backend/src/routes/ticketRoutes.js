// src/routes/tickets.route.js o dentro de parkingSessions.route.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const ticketController = require("../controllers/ticketController");
const ticketService = require("../services/ticketService");

router.post('/parking-sessions/:id/generate-ticket', authenticateToken, ticketService.generateExitTicket);

router.post('/reprint/:sessionId', authenticateToken, ticketController.reprintTicket);

router.get('/last/:plateNumber', authenticateToken, ticketController.getLastTicket);

module.exports = router;