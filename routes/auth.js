const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Registro (solo para ciudadanos)
router.post("/register", async (req, res) => {
  const { username, fullName, email, password, phone, address, genero } = req.body;

  try {
    const exist = await User.findOne({ $or: [{ email }, { username }] });
    if (exist)
      return res.status(400).json({ message: "Usuario o correo ya existen" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      fullName,
      email,
      password: hashed,
      phone,
      address,
      genero,
      rol: "ciudadano", // Forzar rol de ciudadano en registro público
    });
    await user.save();
    res.status(201).json({ message: "Usuario creado exitosamente" });
  } catch (error) {
    res.status(500).json({ error });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Contraseña incorrecta" });

    res.json({ message: "Login exitoso", user });
  } catch (error) {
    res.status(500).json({ error });
  }
});

// Cambio de clave
// PUT /api/auth/change-password
router.put("/change-password", async (req, res) => {
  const { email, newPassword } = req.body;

  // Buscar el usuario en la base de datos
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  // Encriptar la nueva contraseña
  const salt = await bcrypt.genSalt(10); // Genera un salt de 10 rondas
  const hashedPassword = await bcrypt.hash(newPassword, salt); // Encripta la contraseña

  // Guardar la nueva contraseña encriptada
  user.password = hashedPassword;

  // Actualizar el usuario en la base de datos
  await user.save();

  res.json({ message: "Contraseña actualizada correctamente" });
});

module.exports = router;
