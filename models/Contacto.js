const mongoose = require('mongoose');

const contactoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    telefono: { type: String, required: true },
    email: { type: String },
    relacion: { type: String, required: true },
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notificaciones_activas: { type: Boolean, default: true },
    fecha_creacion: { type: Date, default: Date.now },
    fecha_actualizacion: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contacto', contactoSchema);
