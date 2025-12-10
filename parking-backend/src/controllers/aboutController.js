const aboutService = require('../services/aboutService');

/**
 * @description Controlador para obtener información sobre la base de datos
 * @module getDatabaseInfo
 */
const getDatabaseInfo = async (req, res) => {
  try {
    const dbInfo = await aboutService.getDatabaseInfo();
    res.status(200).json(dbInfo);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo información de la base de datos' });
  }
};

/**
 * @description Exportar controladores
 * @module exportControllers
 */
module.exports = { getDatabaseInfo };