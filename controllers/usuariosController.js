const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.listarUsuarios = async(req, res) => {
  try {
    const usuarios = await User.find({}, '-password'); // omitimos la contraseña
    res.json(usuarios);
  } catch {
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
};

exports.obtenerUsuario = async(req, res) => {
  try {
    const userId = req.params.id;
    const usuario = await User.findById(userId, '-password'); // omitir contraseña por seguridad

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (err) {
    res.status(500).json({
      mensaje: 'Error al obtener usuario',
      error: err.message
    });
  }
};

exports.crearUsuario = async(req, res) => {
  try {
    const { username, fullName, email, password, phone, address, genero, rol } =
      req.body;

    // Validaciones básicas
    if (!username || !fullName || !email || !password) {
      return res.status(400).json({ 
        message: 'Todos los campos requeridos deben ser completados' 
      });
    }

    // Verificar si ya existe un usuario con el mismo username o email
    const exist = await User.findOne({
      $or: [
        { username: username.trim() }, 
        { email: email.trim() }
      ]
    });

    if (exist) {
      return res.status(400).json({ 
        message: 'Los datos proporcionados no pueden ser utilizados' 
      });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = new User({
      username: username.trim(),
      fullName: fullName.trim(),
      email: email.trim(),
      password: hashedPassword,
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      genero,
      rol: rol || 'ciudadano' // Por defecto "ciudadano" - solo admin puede crear otros roles
    });

    await nuevoUsuario.save();

    // No devolver la contraseña ni información sensible
    const { password: _, ...usuarioSinPassword } = nuevoUsuario.toObject();
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: usuarioSinPassword
    });
  } catch (err) {
    console.error('Error al crear usuario:', err);
    res.status(500).json({
      mensaje: 'Error interno del servidor'
    });
  }
};

exports.actualizarUsuario = async(req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = { ...req.body };

    // Si se incluye una nueva contraseña, encriptarla
    if (datosActualizados.password) {
      datosActualizados.password = await bcrypt.hash(datosActualizados.password, 10);
    }

    const usuario = await User.findByIdAndUpdate(id, datosActualizados, {
      new: true
    }).select('-password'); // No devolver la contraseña en la respuesta

    if (!usuario)
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({
      mensaje: 'Error al actualizar usuario',
      error: err.message
    });
  }
};

exports.eliminarUsuario = async(req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await User.findByIdAndDelete(id);
    if (!eliminado)
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario eliminado' });
  } catch {
    res.status(500).json({ mensaje: 'Error al eliminar usuario' });
  }
};

// Función para cambiar contraseña
exports.cambiarContrasena = async(req, res) => {
  try {
    const { id } = req.params;
    const { email, currentPassword, newPassword } = req.body;

    // Validar que se proporcionen todos los campos
    if (!email || !currentPassword || !newPassword || 
        email.trim() === '' || currentPassword.trim() === '' || newPassword.trim() === '') {
      return res.status(400).json({
        mensaje: 'Email, contraseña actual y nueva contraseña son requeridos'
      });
    }

    // Validar criterios de la nueva contraseña
    if (newPassword.length < 8) {
      return res.status(400).json({
        mensaje: 'La nueva contraseña debe tener al menos 8 caracteres'
      });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        mensaje: 'La nueva contraseña debe tener al menos una letra mayúscula'
      });
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return res.status(400).json({
        mensaje: 'La nueva contraseña debe tener al menos un carácter especial'
      });
    }

    // Buscar el usuario por ID y email para mayor seguridad
    const usuario = await User.findOne({ _id: id, email: email.trim() });
    if (!usuario) {
      // Simular el tiempo de verificación de contraseña para evitar timing attacks
      await bcrypt.compare('dummy', '$2a$10$invalidhashtopreventtimingattack');
      return res.status(400).json({ mensaje: 'Credenciales inválidas' });
    }

    // Verificar la contraseña actual
    const passwordValid = await bcrypt.compare(currentPassword, usuario.password);
    if (!passwordValid) {
      return res.status(400).json({ mensaje: 'Credenciales inválidas' });
    }

    // Validar que la nueva contraseña sea diferente
    const samePassword = await bcrypt.compare(newPassword, usuario.password);
    if (samePassword) {
      return res.status(400).json({
        mensaje: 'La nueva contraseña debe ser diferente a la actual'
      });
    }

    // Encriptar la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña
    await User.findByIdAndUpdate(id, { password: hashedNewPassword });

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(500).json({
      mensaje: 'Error al cambiar contraseña',
      error: err.message
    });
  }
};

// Función para cambiar contraseña por administrador
exports.cambiarContrasenaAdmin = async(req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validar que se proporcione la nueva contraseña
    if (!newPassword || newPassword.trim() === '') {
      return res.status(400).json({
        mensaje: 'La nueva contraseña es requerida'
      });
    }

    // Validar criterios de la nueva contraseña
    if (newPassword.length < 8) {
      return res.status(400).json({
        mensaje: 'La nueva contraseña debe tener al menos 8 caracteres'
      });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        mensaje: 'La nueva contraseña debe tener al menos una letra mayúscula'
      });
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return res.status(400).json({
        mensaje: 'La nueva contraseña debe tener al menos un carácter especial'
      });
    }

    // Buscar el usuario por ID
    const usuario = await User.findById(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Encriptar la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña
    await User.findByIdAndUpdate(id, { password: hashedNewPassword });

    res.json({ 
      mensaje: `Contraseña actualizada correctamente para ${usuario.fullName}` 
    });
  } catch (err) {
    res.status(500).json({
      mensaje: 'Error al cambiar contraseña',
      error: err.message
    });
  }
};

exports.eliminarCuentaUsuario = async(req, res) => {
  try {
    const { id } = req.params;
    const { password, preserveAlerts } = req.body;

    // Verificar que el usuario existe
    const usuario = await User.findById(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Verificar la contraseña
    const passwordValid = await bcrypt.compare(password, usuario.password);
    if (!passwordValid) {
      return res.status(400).json({ mensaje: 'Contraseña incorrecta' });
    }

    // Si se requiere preservar alertas, marcarlas como ocultas para el usuario
    if (preserveAlerts) {
      const Alert = require('../models/Alert');
      await Alert.updateMany(
        { usuarioCreador: id },
        { visible: false }
      );
    }

    // Eliminar el usuario
    await User.findByIdAndDelete(id);

    res.json({
      mensaje: 'Cuenta eliminada correctamente',
      tipo: 'eliminacion',
      alertasPreservadas: preserveAlerts || false
    });
  } catch (err) {
    res.status(500).json({
      mensaje: 'Error al eliminar cuenta',
      error: err.message
    });
  }
};
