const Joi = require('joi');

/**
 * @description Validación de entrada de vehículo
 * @module vehicleEntrySchema
 */
const vehicleEntrySchema = Joi.object({
  plateNumber: Joi.string()
    .pattern(/^[A-Z0-9]{3,10}$/)
    .required()
    .messages({
      'string.pattern.base': 'La placa debe contener solo letras mayúsculas y números',
      'any.required': 'La placa es requerida'
    }),
  vehicleType: Joi.string()
    .valid('CAR', 'MOTORCYCLE', 'TRUCK')
    .required()
    .messages({
      'any.only': 'El tipo de vehículo debe ser CAR, MOTORCYCLE o TRUCK',
      'any.required': 'El tipo de vehículo es requerido'
    })
});

/**
 * @description Validación de salida de vehículo
 * @module vehicleExitSchema
 */
const vehicleExitSchema = Joi.object({
  plateNumber: Joi.string()
    .pattern(/^[A-Z0-9]{3,10}$/)
    .required()
    .messages({
      'string.pattern.base': 'La placa debe contener solo letras mayúsculas y números',
      'any.required': 'La placa es requerida'
    })
});

/**
 * @description Validación de rango de fechas
 * @module dateRangeSchema
 */
const dateRangeSchema = Joi.object({
  range: Joi.string()
    .valid('today', 'last_week', 'last_month')
    .optional()
    .default('today'),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional()
});

/**
 * @description Validación de entrada de vehículo
 * @module validate
 * @param {Object} schema - Esquema de validación
 */
const validate = (schema) => {
  return (req, res, next) => {
    console.log('📨 Body recibido:', req.body); // ← Agregar esta línea
    console.log('📋 Headers:', req.headers); // ← Y esta línea

    const { error } = schema.validate(req.body);
    if (error) {
      console.log('❌ Error de validación:', error.details); // ← Y esta
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

/**
 * @description Exportar validaciones
 * @module exportValidations
 */
module.exports = {
  validateVehicleEntry: validate(vehicleEntrySchema),
  validateVehicleExit: validate(vehicleExitSchema),
  validateDateRange: (req, res, next) => {
    const { error } = dateRangeSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  }
};