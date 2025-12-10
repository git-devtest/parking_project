const ticketService = require('../services/ticketService');
const auditService = require('../services/auditService');
const logger = require('../utils/logger');

/**
 * @description Reimprime un ticket
 * @module reprintTicket
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
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

/**
 * @description Obtiene el último ticket por placa
 * @module getLastTicket
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
exports.getLastTicket = async (req, res) => {
  try {
    const { plateNumber } = req.params;
    const result = await ticketService.getLastTicketByPlate(plateNumber);

    // Auditoría para reimpresión por placa
    await auditService.createLog({
      usuario: req.user.username,
      accion: 'REPRINT_TICKET',
      tabla_afectada: 'ParkingSession',
      registro_id: 0,
      sql_ejecutado: `REIMPRESIÓN DE TICKET POR PLACA\nPlaca: ${plateNumber}\nSesión: ${result.data.sessionId}`,
      sql_rollback: 'CANNOT ROLLBACK TICKET REPRINT',
      ip_cliente: 'SERVER',
      fecha_evento: new Date()
    });

    logger.info(`Reimpresión de ticket exitosa para placa ${plateNumber}`);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};