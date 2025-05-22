const express = require('express');
const router = express.Router();
const alertaController = require('../controllers/alertaController');

router.post('/crear', alertaController.crearAlerta);
router.get('/usuario/:id', alertaController.obtenerAlertasPorUsuario);

module.exports = router;
