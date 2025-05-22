const mongoose = require('mongoose');

const alertaSchema = new mongoose.Schema({
  direccion: { type: String, required: true },
  usuarioCreador: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fechaHora: { type: Date, required: true },
  detalle: { type: String, required: true },
  status: {
    type: String,
    enum: ['pendiente', 'en camino', 'atendida', 'cancelada'],
    default: 'pendiente'
  },
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
  }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertaSchema);
