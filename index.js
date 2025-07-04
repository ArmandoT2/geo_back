const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const usuariosRoutes = require('./routes/usuarios');
const alertaRoutes = require('./routes/alertas');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error(err));

app.use('/api/auth', require('./routes/auth'));
app.use('/usuarios', usuariosRoutes);
app.use('/api/alertas', alertaRoutes);

// Ruta de test para verificar conectividad
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Servidor funcionando correctamente', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));