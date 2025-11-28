// src/controllers/ticketController.js
const ticketService = require('../services/ticketService');

exports.reprintTicket = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await ticketService.regenerateTicket(sessionId);

    res.json(result);

  } catch (error) {
    console.error('Error reprinting ticket:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al regenerar el ticket'
    });
  }
};

exports.getLastTicket = async (req, res) => {
  try {
    const { plateNumber } = req.params;
    const result = await ticketService.getLastTicketByPlate(plateNumber);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};