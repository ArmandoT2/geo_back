const Contacto = require("../models/Contacto");

exports.obtenerContactosPorUsuario = async (req, res) => {
  try {
    const contactos = await Contacto.find({ usuario_id: req.params.id });
    res.status(200).json({ contactos });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener contactos", error: error.message });
  }
};

exports.crearContacto = async (req, res) => {
  try {
    const contacto = new Contacto(req.body);
    const nuevoContacto = await contacto.save();
    res.status(200).json({ contacto: nuevoContacto });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear contacto", error: error.message });
  }
};

exports.actualizarContacto = async (req, res) => {
  try {
    const contactoActualizado = await Contacto.findByIdAndUpdate(
      req.params.id,
      { ...req.body, fecha_actualizacion: new Date() },
      { new: true }
    );
    res.status(200).json({ contacto: contactoActualizado });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar contacto", error: error.message });
  }
};

exports.eliminarContacto = async (req, res) => {
  try {
    await Contacto.findByIdAndDelete(req.params.id);
    res.status(200).json({ mensaje: "Contacto eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar contacto", error: error.message });
  }
};

exports.toggleNotificaciones = async (req, res) => {
  try {
    const contacto = await Contacto.findById(req.params.id);
    if (!contacto) return res.status(404).json({ mensaje: "Contacto no encontrado" });

    contacto.notificaciones_activas = req.body.estado;
    contacto.fecha_actualizacion = new Date();
    await contacto.save();

    res.status(200).json({ mensaje: "Estado de notificaciones actualizado" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar notificaciones", error: error.message });
  }
};
