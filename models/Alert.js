const mongoose = require('mongoose');

const alertaSchema = new mongoose.Schema(
  {
    direccion: { type: String, required: true },
    usuarioCreador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fechaHora: { type: Date, required: true },
    detalle: { type: String, required: true },
    status: {
      type: String,
      enum: ['pendiente', 'en camino', 'atendida', 'cancelada'],
      default: 'pendiente'
    },
    visible: {
      type: Boolean,
      default: true,
      required: true
    }, // Campo para controlar visibilidad de alertas
    atendidoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // usuario que atiende (policía)
    evidencia: [{ type: String }],
    rutaAtencion: {
      origen: {
        lat: Number,
        lng: Number
      },
      destino: {
        lat: Number,
        lng: Number
      }
    },
    ubicacion: { lat: Number, lng: Number },
    // Campos para dirección detallada
    calle: { type: String },
    barrio: { type: String },
    ciudad: { type: String },
    estado: { type: String },
    pais: { type: String },
    codigoPostal: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertaSchema);
