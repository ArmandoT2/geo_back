const Alert = require("../models/Alert");

exports.crearAlerta = async (req, res) => {
  console.log("Datos recibidos para crear alerta:", req.body);
  try {
    const { direccion, usuarioCreador, fechaHora, detalle, rutaAtencion } =
      req.body;

    const nuevaAlerta = new Alert({
      direccion,
      usuarioCreador,
      fechaHora,
      detalle,
      rutaAtencion,
      status: "pendiente", // Estado por defecto
    });

    await nuevaAlerta.save();
    console.log("✅ Alerta creada con éxito - Código 201");
    res.status(201).json(nuevaAlerta);
  } catch (error) {
    console.error("❌ Error al crear la alerta - Código 500:", error.message);
    res
      .status(500)
      .json({ mensaje: "Error al crear la alerta", error: error.message });
  }
};

exports.obtenerAlertasPorUsuario = async (req, res) => {
  try {
    const usuarioId = req.params.id;
    const alertas = await Alert.find({ usuarioCreador: usuarioId }).sort({
      createdAt: -1,
    });
    res.status(200).json(alertas);
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al obtener alertas", error: error.message });
  }
};
