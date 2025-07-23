const User = require("../models/User")
const bcrypt = require("bcryptjs");

exports.listarUsuarios = async (req, res) => {
  try {
    const usuarios = await User.find({}, "-password"); // omitimos la contraseña
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ mensaje: "Error al obtener usuarios" });
  }
};

exports.obtenerUsuario = async (req, res) => {
  try {
    const userId = req.params.id;
    const usuario = await User.findById(userId, "-password"); // omitir contraseña por seguridad
    
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ 
      mensaje: "Error al obtener usuario", 
      error: err.message 
    });
  }
};

exports.crearUsuario = async (req, res) => {
  try {
    const { username, fullName, email, password, phone, address, genero, rol } =
      req.body;

    // Verificar si ya existe un usuario con el mismo username o email
    const exist = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (exist) {
      return res.status(400).json({ message: "Usuario o correo ya existen" });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = new User({
      username,
      fullName,
      email,
      password: hashedPassword,
      phone,
      address,
      genero,
      rol: rol || "ciudadano", // Por defecto "ciudadano" - solo admin puede crear otros roles
    });

    await nuevoUsuario.save();

    res.status(201).json(nuevoUsuario);
  } catch (err) {
    res.status(500).json({
      mensaje: "Error al crear usuario",
      error: err.message,
    });
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;
    const usuario = await User.findByIdAndUpdate(id, datosActualizados, {
      new: true,
    });
    if (!usuario)
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ mensaje: "Error al actualizar usuario" });
  }
};

exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await User.findByIdAndDelete(id);
    if (!eliminado)
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    res.json({ mensaje: "Usuario eliminado" });
  } catch (err) {
    res.status(500).json({ mensaje: "Error al eliminar usuario" });
  }
};

exports.eliminarCuentaUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, preserveAlerts } = req.body;

    // Verificar que el usuario existe
    const usuario = await User.findById(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    // Verificar la contraseña
    const passwordValid = await bcrypt.compare(password, usuario.password);
    if (!passwordValid) {
      return res.status(400).json({ mensaje: "Contraseña incorrecta" });
    }

    // Si se requiere preservar alertas, marcarlas como ocultas para el usuario
    if (preserveAlerts) {
      const Alert = require("../models/Alert");
      await Alert.updateMany(
        { usuarioCreador: id },
        { visible: false }
      );
    }

    // Eliminar el usuario
    await User.findByIdAndDelete(id);

    res.json({ 
      mensaje: "Cuenta eliminada correctamente",
      tipo: "eliminacion",
      alertasPreservadas: preserveAlerts || false
    });
  } catch (err) {
    res.status(500).json({
      mensaje: "Error al eliminar cuenta",
      error: err.message,
    });
  }
};

exports.cambiarContrasena = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Verificar que el usuario existe
    const usuario = await User.findById(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    // Verificar la contraseña actual
    const passwordValid = await bcrypt.compare(currentPassword, usuario.password);
    if (!passwordValid) {
      return res.status(400).json({ mensaje: "Contraseña actual incorrecta" });
    }

    // Encriptar la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña
    await User.findByIdAndUpdate(id, { password: hashedNewPassword });

    res.json({ mensaje: "Contraseña actualizada correctamente" });
  } catch (err) {
    res.status(500).json({
      mensaje: "Error al cambiar contraseña",
      error: err.message,
    });
  }
};
