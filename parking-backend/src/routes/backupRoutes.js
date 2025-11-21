const express = require("express");
const router = express.Router();
const backupController = require("../controllers/backupController");
const { authenticateToken, requireRole } = require("../middleware/auth");

// Solo ADMIN puede hacer backups
router.get("/", authenticateToken, requireRole(["ADMIN"]), backupController.listBackups);

router.post("/create", authenticateToken, requireRole(["ADMIN"]), backupController.createBackup);

router.get("/download/:file", authenticateToken, requireRole(["ADMIN"]), backupController.downloadBackup);

router.post('/create-sql', authenticateToken, requireRole(['ADMIN']), backupController.createSqlBackup)

router.get("/view-json/:file", authenticateToken, requireRole(["ADMIN"]), backupController.viewJsonBackup);


module.exports = router;
