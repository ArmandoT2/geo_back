const express = require('express');
const router = express.Router();
const notificacionesCtrl = require('../controllers/notificacionesController');

// 🧪 Endpoint de prueba para verificar conectividad
router.get('/test', (req, res) => {
  res.json({
    message: 'Ruta de notificaciones funcionando',
    timestamp: new Date().toISOString()
  });
});

// � Endpoint de debug para ver todas las notificaciones sin filtros
router.get('/debug', async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const notificaciones = await Notification.find()
      .populate('alerta')
      .sort({ createdAt: -1 });
    
    res.json({
      total: notificaciones.length,
      notificaciones: notificaciones
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// �📨 Obtener todas las no leídas por el usuario autenticado
router.get('/', notificacionesCtrl.obtenerTodas);

// ✅ Marcar una notificación como leída
router.patch('/marcar-leida/:id', notificacionesCtrl.marcarComoLeida);

module.exports = router;
