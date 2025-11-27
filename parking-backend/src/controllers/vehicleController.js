const vehicleService = require('../services/vehicleService');
const logger = require('../utils/logger');

class VehicleController {
  async registerEntry(req, res, next) {
    try {
      const { plateNumber, vehicleType } = req.body;
      
      const result = await vehicleService.registerEntry(plateNumber, vehicleType, req.user.username);
      
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

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
      console.error('Error en vehicleController:', error);
      res.status(500).json({
      success: false,
      message: error.message || 'Error al procesar la salida del vehículo'
    });
  }
  }

  async getParkedVehicles(req, res, next) {
    try {
      const result = await vehicleService.getParkedVehicles();
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getParkingCapacity(req, res, next) {
    try {
      const result = await vehicleService.getParkingCapacity();
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getVehicleHistory(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      
      const result = await vehicleService.getVehicleHistory(page, limit);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VehicleController();