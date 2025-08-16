const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Debug: Verificar que se carga el MONGO_URI
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('PORT:', process.env.PORT);

const usuariosRoutes = require('./routes/usuarios');
const alertaRoutes = require('./routes/alertas');
const contactosRoutes = require('./routes/contactosRoutes');
const notificationRoutes = require('./routes/notificaciones');
const app = express();

// Rate limiting para rutas de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos por IP cada 15 minutos
  message: {
    message: 'Demasiados intentos de autenticación. Intenta nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Aplicar solo a rutas de autenticación sensibles
  skip: (req) => !req.path.includes('/login') && !req.path.includes('/forgot-password') && !req.path.includes('/reset-password')
});

// Rate limiting general para todas las rutas
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // Máximo 100 requests por IP cada minuto
  message: {
    message: 'Demasiadas solicitudes. Intenta nuevamente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(cors());
app.use(express.json());
app.use(generalLimiter); // Aplicar rate limiting general

app.use('/api/auth', authLimiter, require('./routes/auth')); // Aplicar rate limiting específico para auth
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
