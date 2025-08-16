const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

router.get('/', usuariosController.listarUsuarios);
router.get('/:id', usuariosController.obtenerUsuario);
router.post('/', usuariosController.crearUsuario);
// Rutas específicas ANTES de las rutas genéricas
router.put('/:id/cambiar-password', usuariosController.cambiarContrasena);
router.put('/:id/cambiar-password-admin', usuariosController.cambiarContrasenaAdmin);
router.delete('/:id/eliminar-cuenta', usuariosController.eliminarCuentaUsuario);
// Rutas genéricas AL FINAL
router.put('/:id', usuariosController.actualizarUsuario);
router.delete('/:id', usuariosController.eliminarUsuario);

module.exports = router;
