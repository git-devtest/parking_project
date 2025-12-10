const express = require("express");
const router = express.Router();
const backupController = require("../controllers/backupController");
const { authenticateToken, requireRole } = require("../middleware/auth");

/**
 * @description Listar backups
 * @route GET /backups
 */
router.get("/", authenticateToken, requireRole(["ADMIN"]), backupController.listBackups);

/**
 * @description Crear backup
 * @route POST /backups/create
 */
router.post("/create", authenticateToken, requireRole(["ADMIN"]), backupController.createBackup);

/**
 * @description Descargar backup
 * @route GET /backups/download/:file
 */
router.get("/download/:file", authenticateToken, requireRole(["ADMIN"]), backupController.downloadBackup);

/**
 * @description Crear backup SQL
 * @route POST /backups/create-sql
 */
router.post('/create-sql', authenticateToken, requireRole(['ADMIN']), backupController.createSqlBackup)

/**
 * @description Ver backup JSON
 * @route GET /backups/view-json/:file
 */
router.get("/view-json/:file", authenticateToken, requireRole(["ADMIN"]), backupController.viewJsonBackup);

/**
 * @description Exportar rutas
 * @module backupRoutes
 */
module.exports = router;
