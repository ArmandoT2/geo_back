const Alert = require("../models/Alert");

exports.crearAlerta = async (req, res) => {
  console.log("Datos recibidos para crear alerta:", req.body);
  try {
    const {
      direccion,
      usuarioCreador,
      fechaHora,
      detalle,
      rutaAtencion,
      ubicacion,
      calle,
      barrio,
      ciudad,
      estado,
      pais,
      codigoPostal,
    } = req.body;

    const nuevaAlerta = new Alert({
      direccion,
      usuarioCreador,
      fechaHora,
      detalle,
      rutaAtencion,
      status: "pendiente", // Estado por defecto
      ubicacion,
      calle,
      barrio,
      ciudad,
      estado,
      pais,
      codigoPostal,
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

exports.obtenerAlertasPendientes = async (req, res) => {
  try {
    // Aquí puedes ajustar si deseas traer "pendiente" y "asignado" para que el policía pueda ir viendo varias
    const alertas = await Alert.find({
      status: { $in: ["pendiente", "asignado", "en camino"] },
    }).sort({ createdAt: -1 });
    res.status(200).json(alertas);
  } catch (error) {
    console.error("❌ Error al obtener alertas pendientes:", error.message);
    res.status(500).json({
      mensaje: "Error al obtener alertas pendientes",
      error: error.message,
    });
  }
};

exports.actualizarEstadoAlerta = async (req, res) => {
  try {
    const alertaId = req.params.id;
    const { status, policiaId, origen, destino } = req.body;

    const estadosValidos = [
      "pendiente",
      "asignado",
      "en camino",
      "atendida",
      "cancelada",
    ];
    if (!estadosValidos.includes(status)) {
      return res.status(400).json({ mensaje: "Estado inválido" });
    }

    const updateFields = { status };

    if (policiaId) {
      updateFields.atendidoPor = policiaId;
    }

    if (origen && destino) {
      updateFields.rutaAtencion = {
        origen,
        destino,
      };
    }

    const alertaActualizada = await Alert.findByIdAndUpdate(
      alertaId,
      updateFields,
      { new: true }
    );

    if (!alertaActualizada) {
      return res.status(404).json({ mensaje: "Alerta no encontrada" });
    }

    res.status(200).json(alertaActualizada);
  } catch (error) {
    console.error("❌ Error al actualizar estado de alerta:", error.message);
    res
      .status(500)
      .json({ mensaje: "Error al actualizar alerta", error: error.message });
  }
};
