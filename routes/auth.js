const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Registro (solo para ciudadanos)
router.post('/register', async(req, res) => {
  const { username, fullName, email, password, phone, address, genero } = req.body;

  try {
    const exist = await User.findOne({ $or: [{ email }, { username }] });
    if (exist)
      return res.status(400).json({ message: 'Usuario o correo ya existen' });

    // Validar criterios de la contraseña
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos una letra mayúscula' });
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos un carácter especial' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      fullName,
      email,
      password: hashed,
      phone,
      address,
      genero,
      rol: 'ciudadano' // Forzar rol de ciudadano en registro público
    });
    await user.save();
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error });
  }
});

// Login
router.post('/login', async(req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'Usuario no encontrado' });

    // Verificar si el usuario está activo (solo si el campo existe)
    if (user.activo !== undefined && user.activo === false)
      return res.status(400).json({ message: 'Cuenta desactivada. Contacta al administrador.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Contraseña incorrecta' });

    // Respuesta exitosa con todos los datos necesarios
    res.json({
      message: 'Login exitoso',
      success: true,
      user: {
        id: user._id,
        _id: user._id,  // Agregar _id también para compatibilidad
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        genero: user.genero,
        rol: user.rol,
        activo: user.activo !== undefined ? user.activo : true
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

// Cambio de clave
// PUT /api/auth/change-password
router.put('/change-password', async(req, res) => {
  const { email, newPassword } = req.body;

  // Buscar el usuario en la base de datos
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  // Encriptar la nueva contraseña
  const salt = await bcrypt.genSalt(10); // Genera un salt de 10 rondas
  const hashedPassword = await bcrypt.hash(newPassword, salt); // Encripta la contraseña

  // Guardar la nueva contraseña encriptada
  user.password = hashedPassword;

  // Actualizar el usuario en la base de datos
  await user.save();

  res.json({ message: 'Contraseña actualizada correctamente' });
});

// Endpoint para verificar email (forgot password)
router.post('/forgot-password', async(req, res) => {
  const { email } = req.body;

  try {
    // Verificar que el email existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado con ese email' });
    }

    // Verificar que el usuario esté activo
    if (user.activo !== undefined && user.activo === false) {
      return res.status(400).json({ message: 'Cuenta desactivada. Contacta al administrador.' });
    }

    res.json({ 
      message: 'Email verificado correctamente',
      success: true 
    });
  } catch (error) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Endpoint para resetear contraseña
router.post('/reset-password', async(req, res) => {
  const { email, newPassword } = req.body;

  try {
    // Buscar el usuario por email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar que el usuario esté activo
    if (user.activo !== undefined && user.activo === false) {
      return res.status(400).json({ message: 'Cuenta desactivada. Contacta al administrador.' });
    }

    // Validar criterios de la nueva contraseña
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos una letra mayúscula' });
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos un carácter especial' });
    }

    // Encriptar la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar la contraseña en la base de datos
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
