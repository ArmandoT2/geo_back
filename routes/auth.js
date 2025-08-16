const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Registro (solo para ciudadanos)
router.post('/register', async(req, res) => {
  const { username, fullName, email, password, phone, address, genero } = req.body;

  try {
    // Validaciones básicas
    if (!username || !fullName || !email || !password ||
        username.trim() === '' || fullName.trim() === '' || email.trim() === '') {
      return res.status(400).json({ message: 'Todos los campos requeridos deben ser completados' });
    }

    const exist = await User.findOne({ 
      $or: [
        { email: email.trim() }, 
        { username: username.trim() }
      ] 
    });
    
    if (exist) {
      return res.status(400).json({ message: 'Los datos proporcionados no pueden ser utilizados' });
    }

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
      username: username.trim(),
      fullName: fullName.trim(),
      email: email.trim(),
      password: hashed,
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      genero,
      rol: 'ciudadano' // Forzar rol de ciudadano en registro público
    });
    await user.save();
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Login
router.post('/login', async(req, res) => {
  const { email, password } = req.body;
  
  // Validación básica de entrada
  if (!email || !password || email.trim() === '' || password.trim() === '') {
    return res.status(400).json({ message: 'Credenciales inválidas' });
  }

  try {
    const user = await User.findOne({ email: email.trim() });
    
    // Si no existe el usuario, simular el tiempo de verificación de contraseña
    // para evitar ataques de timing
    if (!user) {
      // Simular bcrypt.compare para mantener tiempo constante
      await bcrypt.compare(password, '$2a$10$invalidhashtopreventtimingattack');
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Verificar si el usuario está activo (solo si el campo existe)
    if (user.activo !== undefined && user.activo === false) {
      // Simular bcrypt.compare para mantener tiempo constante
      await bcrypt.compare(password, '$2a$10$invalidhashtopreventtimingattack');
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

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
    res.status(500).json({ message: 'Error interno del servidor' });
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

  // Validación básica de entrada
  if (!email || email.trim() === '') {
    return res.status(400).json({ message: 'Email es requerido' });
  }

  try {
    // Verificar que el email existe
    const user = await User.findOne({ email: email.trim() });
    
    // Por seguridad, siempre respondemos que el proceso fue exitoso
    // independientemente de si el email existe o no
    if (!user) {
      // Simulamos un pequeño delay para evitar ataques de timing
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.json({ 
        message: 'Si el email existe en nuestro sistema, recibirás instrucciones',
        success: true 
      });
    }

    // Verificar que el usuario esté activo
    if (user.activo !== undefined && user.activo === false) {
      // Simulamos un pequeño delay para evitar ataques de timing
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.json({ 
        message: 'Si el email existe en nuestro sistema, recibirás instrucciones',
        success: true 
      });
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

  // Validación básica de entrada
  if (!email || !newPassword || email.trim() === '' || newPassword.trim() === '') {
    return res.status(400).json({ message: 'Email y nueva contraseña son requeridos' });
  }

  try {
    // Validar criterios de la nueva contraseña primero
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos una letra mayúscula' });
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos un carácter especial' });
    }

    // Buscar el usuario por email
    const user = await User.findOne({ email: email.trim() });
    if (!user) {
      // Por seguridad, simulamos el proceso completo
      await bcrypt.genSalt(10);
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.status(400).json({ message: 'No se pudo procesar la solicitud' });
    }

    // Verificar que el usuario esté activo
    if (user.activo !== undefined && user.activo === false) {
      // Por seguridad, simulamos el proceso completo
      await bcrypt.genSalt(10);
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.status(400).json({ message: 'No se pudo procesar la solicitud' });
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
