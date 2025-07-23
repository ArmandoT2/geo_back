const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    alerta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alert",
      required: true,
    },
    mensaje: { type: String, required: true },
    leidaPor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // usuarios que ya leyeron esta notificación
      },
    ],
    tipo: {
      type: String,
      enum: ["alerta_creada", "alerta_actualizada", "alerta_atendida"],
      default: "alerta_creada",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
