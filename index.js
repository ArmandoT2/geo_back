const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Debug: Verificar que se carga el MONGO_URI
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('PORT:', process.env.PORT);

const usuariosRoutes = require('./routes/usuarios');
const alertaRoutes = require('./routes/alertas');
const contactosRoutes = require('./routes/contactosRoutes');
const notificationRoutes = require('./routes/notificaciones')
const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/auth', require('./routes/auth'));
app.use('/usuarios', usuariosRoutes);
app.use('/api/alertas', alertaRoutes);
app.use('/api/contactos', contactosRoutes);
app.use('/api/notification', notificationRoutes);

// Validar que MONGO_URI existe
if (!process.env.MONGO_URI) {
  console.error('❌ ERROR: MONGO_URI no está definido en el archivo .env');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado exitosamente'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));


const PORT = process.env.PORT || 3000;

// Ruta de test para verificar conectividad
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Servidor funcionando correctamente', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));