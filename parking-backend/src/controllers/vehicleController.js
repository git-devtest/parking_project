const vehicleService = require('../services/vehicleService');

/**
 * @description Controlador para vehículos
 * @module VehicleController
 */
class VehicleController {

  /**
   * @description Registra la entrada de un vehículo
   * @module registerEntry
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  async registerEntry(req, res, next) {
    try {
      const { plateNumber, vehicleType } = req.body;
      
      const result = await vehicleService.registerEntry(plateNumber, vehicleType, req.user.username);
      
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @description Registra la salida de un vehículo
   * @module registerExit
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  async registerExit(req, res, next) {
    try {
      const { plateNumber } = req.body;
      const user = req.user?.username;

      if (!plateNumber) {
        return res.status(400).json({
          success: false,
          message: 'La placa del vehículo es requerida'
        });
      }
      
      const result = await vehicleService.registerExit(plateNumber, user);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error completo:', JSON.stringify(error, null, 2));
      console.error('Error en vehicleController:', error);
      res.status(500).json({
      success: false,
      message: error.message || 'Error al procesar la salida del vehículo'
    });
  }
  }

  /**
   * @description Obtiene los vehículos estacionados
   * @module getParkedVehicles
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  async getParkedVehicles(req, res, next) {
    try {
      const result = await vehicleService.getParkedVehicles();
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @description Obtiene la capacidad del parqueadero
   * @module getParkingCapacity
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  async getParkingCapacity(req, res, next) {
    try {
      const result = await vehicleService.getParkingCapacity();
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @description Obtiene el historial de vehículos
   * @module getVehicleHistory
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  async getVehicleHistory(req, res, next) {
    try {
      const { page = 1, limit = 20, searchPlate = '' } = req.query;
      
      const result = await vehicleService.getVehicleHistory(page, limit, searchPlate);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

/**
 * @description Exportar controladores
 * @module exportControllers
 */
module.exports = new VehicleController();