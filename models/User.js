const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone:    { type: String },
  address:  { type: String },
  genero:   { type: String, enum: ['masculino', 'femenino'], required: true },
  rol:      { type: String, default: 'ciudadano' } // Por defecto ciudadano
});

module.exports = mongoose.model('User', userSchema);
