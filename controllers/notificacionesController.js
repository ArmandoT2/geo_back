const Notification = require("../models/Notification");

exports.obtenerTodas = async (req, res) => {
  try {
    const notificaciones = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(10);
    console.log("data notificaciones", notificaciones);
    res.status(200).json({ notificaciones });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener notificaciones",
      error: error.message,
    });
  }
};

exports.marcarComoLeida = async (req, res) => {
  try {
    const notificacionId = req.params.id;
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ mensaje: "userId es requerido en el cuerpo" });
    }

    const notificacion = await Notification.findById(notificacionId); // ✅ debe ir antes

    if (!notificacion) {
      return res.status(404).json({ mensaje: "Notificación no encontrada" });
    }

    if (!notificacion.leidaPor.includes(userId)) {
      notificacion.leidaPor.push(userId);
      await notificacion.save();
      console.log(
        `✅ Usuario ${userId} marcó como leída la notificación ${notificacionId}`
      );
    } else {
      console.log(
        `ℹ️ Usuario ${userId} ya había leído la notificación ${notificacionId}`
      );
    }

    res.status(200).json({ mensaje: "Notificación marcada como leída" });
  } catch (error) {
    console.error("❌ Error al marcar como leída:", error.message);
    res.status(500).json({ mensaje: "Error interno", error: error.message });
  }
};
