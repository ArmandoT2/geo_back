const express = require('express');
const router = express.Router();
const contactosController = require('../controllers/contactosController');

router.get('/usuario/:id', contactosController.obtenerContactosPorUsuario);
router.post('/crear', contactosController.crearContacto);
router.put('/:id', contactosController.actualizarContacto);
router.delete('/:id', contactosController.eliminarContacto);
router.patch('/:id/notificaciones', contactosController.toggleNotificaciones);

module.exports = router;
