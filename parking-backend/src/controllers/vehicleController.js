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
      
      const result = await vehicleService.registerExit(plateNumber, req.user.username);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
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