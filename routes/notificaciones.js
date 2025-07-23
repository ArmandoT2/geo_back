const express = require("express");
const router = express.Router();
const notificacionesCtrl = require("../controllers/notificacionesController");

// 📨 Obtener todas las no leídas por el usuario autenticado
router.get("/", notificacionesCtrl.obtenerTodas);

// ✅ Marcar una notificación como leída
router.patch("/marcar-leida/:id", notificacionesCtrl.marcarComoLeida);

module.exports = router;
