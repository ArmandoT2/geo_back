const express = require('express');
const router = express.Router();
const alertaController = require('../controllers/alertaController');

router.get('/', alertaController.obtenerTodas);
router.post('/crear', alertaController.crearAlerta);
router.get('/usuario/:id', alertaController.obtenerAlertasPorUsuario);
router.put('/:id/status', alertaController.actualizarEstadoAlerta);
router.put('/:id/cancelar', alertaController.cancelarAlerta);
router.get('/pendientes', alertaController.obtenerAlertasPendientes);

module.exports = router;
