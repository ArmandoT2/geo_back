const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const Contacto = require('../models/Contacto');
const createTransporter = require('../config/mailer');
const nodemailer = require('nodemailer');

// Función helper para validar el detalle de la alerta
function validarDetalle(detalle) {
  if (!detalle || typeof detalle !== 'string') {
    return 'El detalle de la alerta es requerido';
  }

  const detalleTrimed = detalle.trim();
  
  // Validar longitud de caracteres
  if (detalleTrimed.length < 5) {
    return 'El detalle debe tener al menos 5 caracteres';
  }
  
  if (detalleTrimed.length > 300) {
    return 'El detalle no puede exceder 300 caracteres';
  }
  
  // Validar número de palabras
  const palabras = detalleTrimed.split(/\s+/).filter(palabra => palabra.length > 0);
  
  if (palabras.length < 3) {
    return 'El detalle debe contener al menos 3 palabras';
  }
  
  if (palabras.length > 100) {
    return 'El detalle no puede contener más de 100 palabras';
  }

  return null; // No hay errores
}

exports.crearAlerta = async(req, res) => {
  try {
    console.log('🚨 ========================================');
    console.log('🚨 INICIANDO CREACIÓN DE ALERTA');
    console.log('🚨 ========================================');
    console.log('📥 req.body completo:', JSON.stringify(req.body, null, 2));
    
    const transporter = await createTransporter();

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
      codigoPostal
    } = req.body;

    console.log('📋 Datos extraídos:');
    console.log('  - Direccion:', direccion);
    console.log('  - Usuario creador:', usuarioCreador);
    console.log('  - Detalle:', detalle);
    console.log('  - Ubicación:', ubicacion);
    console.log('  - FechaHora:', fechaHora);

    // Validaciones básicas
    if (!direccion) {
      console.log('❌ Error: Dirección no proporcionada');
      return res.status(400).json({
        mensaje: 'La dirección es requerida'
      });
    }

    if (!usuarioCreador) {
      console.log('❌ Error: Usuario creador no proporcionado');
      return res.status(400).json({
        mensaje: 'El usuario creador es requerido'
      });
    }

    if (!ubicacion || !ubicacion.lat || !ubicacion.lng) {
      console.log('❌ Error: Ubicación no válida');
      return res.status(400).json({
        mensaje: 'La ubicación (latitud y longitud) es requerida'
      });
    }

    // Validar el detalle usando la función helper
    const errorDetalle = validarDetalle(detalle);
    if (errorDetalle) {
      console.log('❌ Error en validación de detalle:', errorDetalle);
      return res.status(400).json({
        mensaje: errorDetalle
      });
    }

    console.log('✅ Detalle validado correctamente');
    console.log('💾 Creando objeto alerta...');

    const nuevaAlerta = new Alert({
      direccion,
      usuarioCreador,
      fechaHora,
      detalle: detalle.trim(), // Usar el detalle trimmed
      rutaAtencion,
      status: 'pendiente',
      visible: true, // Por defecto visible
      ubicacion,
      calle,
      barrio,
      ciudad,
      estado,
      pais,
      codigoPostal
    });

    console.log('💾 Guardando alerta en BD...');
    await nuevaAlerta.save();
    console.log('✅ Alerta guardada con ID:', nuevaAlerta._id);

    const nuevaNotificacion = new Notification({
      alerta: nuevaAlerta._id,
      mensaje: `Se ha generado una nueva alerta en ${direccion}`,
      tipo: 'alerta_creada'
    });

    await nuevaNotificacion.save();
    console.log('✅ Notificación creada con ID:', nuevaNotificacion._id);
    console.log('📋 Datos de notificación:', nuevaNotificacion);

    const contactos = await Contacto.find({
      usuario_id: usuarioCreador,
      notificaciones_activas: true,
      email: { $exists: true, $ne: '' }
    });

    const envios = contactos.map(async(contacto) => {
      console.log(
        `📤 Enviando correo a: ${contacto.nombre} ${contacto.apellido} <${contacto.email}>`
      );

      const mailOptions = {
        from: '"Alerta SOS" <no-reply@alerta.com>',
        to: contacto.email,
        subject: '🚨 Alerta de emergencia de tu contacto',
        html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #d32f2f;">🚨 Alerta de emergencia</h2>
        <p><strong>${contacto.nombre} ${
  contacto.apellido
}</strong>, tu contacto ha generado una alerta de emergencia.</p>
        <p><strong>Detalle:</strong> ${detalle}</p>
        <p><strong>Dirección:</strong> ${direccion}</p>
        <p><strong>Fecha y hora:</strong> ${new Date(
    fechaHora
  ).toLocaleString()}</p>
        <p style="color: #555;">Este mensaje es enviado automáticamente por el sistema de alertas.</p>
      </div>
    `
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📬 Correo enviado. ID:', info.messageId);
        console.log('📎 Ver correo:', nodemailer.getTestMessageUrl?.(info));
      } catch (err) {
        console.error('❌ Error enviando a', contacto.email, '-', err.message);
      }
    });

    await Promise.all(envios);

    console.log('🎉 ========================================');
    console.log('🎉 ALERTA CREADA EXITOSAMENTE');
    console.log('🎉 ID:', nuevaAlerta._id);
    console.log('🎉 ========================================');

    res.status(201).json({
      alerta: nuevaAlerta,
      notificacion: nuevaNotificacion,
      mensaje: 'Alerta creada y correos enviados a contactos'
    });
  } catch (error) {
    console.error('❌ ========================================');
    console.error('❌ ERROR AL CREAR LA ALERTA');
    console.error('❌ ========================================');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ ========================================');
    
    res.status(500).json({
      mensaje: 'Error al crear la alerta',
      error: error.message
    });
  }
};

exports.obtenerAlertasPorUsuario = async(req, res) => {
  try {
    const usuarioId = req.params.id;
    
    // Obtener las alertas del usuario
    const alertas = await Alert.find({
      usuarioCreador: usuarioId
    }).sort({
      createdAt: -1
    });
    
    res.status(200).json(alertas);
  } catch (error) {
    console.error('Error en obtenerAlertasPorUsuario:', error);
    res
      .status(500)
      .json({ mensaje: 'Error al obtener alertas', error: error.message });
  }
};

exports.obtenerAlertasPendientes = async(req, res) => {
  try {
    console.log('🔍 Obteniendo alertas pendientes para policía...');
    // Solo traer alertas que NO estén atendidas ni canceladas
    const alertas = await Alert.find({
      status: { $in: ['pendiente', 'asignado', 'en camino'] },
      visible: true // Además que sean visibles
    }).sort({ createdAt: -1 });
    
    console.log(`📋 Alertas pendientes encontradas: ${alertas.length}`);
    res.status(200).json(alertas);
  } catch (error) {
    console.error('❌ Error al obtener alertas pendientes:', error.message);
    res.status(500).json({
      mensaje: 'Error al obtener alertas pendientes',
      error: error.message
    });
  }
};

exports.actualizarEstadoAlerta = async(req, res) => {
  console.log('📩 req.body:', req.body);
  try {
    const alertaId = req.params.id;
    const { status, policiaId, origen, destino, evidenciaUrl, detallesAtencion } = req.body;

    const estadosValidos = [
      'pendiente',
      'asignado',
      'en camino',
      'atendida',
      'cancelada'
    ];
    if (!estadosValidos.includes(status)) {
      return res.status(400).json({ mensaje: 'Estado inválido' });
    }

    const updateFields = { status };

    if (policiaId) {
      updateFields.atendidoPor = policiaId;
    }

    if (origen && destino) {
      updateFields.rutaAtencion = { origen, destino };
    }

    if (status === 'atendida') {
      // Validar que se proporcionen detalles de atención
      if (!detallesAtencion || detallesAtencion.trim().length < 10) {
        return res.status(400).json({ 
          mensaje: 'Los detalles de atención son obligatorios y deben tener al menos 10 caracteres' 
        });
      }

      // Guardar detalles de atención
      updateFields.detallesAtencion = detallesAtencion.trim();

      // Agregar evidencia si está presente
      if (evidenciaUrl) {
        updateFields.$push = { evidencia: evidenciaUrl };
      }
    }

    const alertaActualizada = await Alert.findByIdAndUpdate(
      alertaId,
      updateFields,
      { new: true }
    );

    console.log('✅ Alerta actualizada:', alertaActualizada);

    if (!alertaActualizada) {
      return res.status(404).json({ mensaje: 'Alerta no encontrada' });
    }

    // Si la alerta fue atendida, crear notificación de finalización
    if (status === 'atendida') {
      const nuevaNotificacion = new Notification({
        alerta: alertaActualizada._id,
        mensaje: `Alerta atendida exitosamente en ${alertaActualizada.direccion}`,
        tipo: 'alerta_atendida'
      });
      
      await nuevaNotificacion.save();
      console.log('✅ Notificación de alerta atendida creada:', nuevaNotificacion._id);
    }

    res.status(200).json(alertaActualizada);
  } catch (error) {
    console.error('❌ Error al actualizar estado de alerta:', error.message);
    res.status(500).json({
      mensaje: 'Error al actualizar alerta',
      error: error.message
    });
  }
};

exports.obtenerTodas = async(req, res) => {
  try {
    const alertas = await Alert.find()
      .populate('usuarioCreador', 'fullName genero email telefono')
      .populate('atendidoPor', 'fullName genero email')
      .sort({ createdAt: -1 });
    res.status(200).json({ alertas });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener alertas',
      error: error.message
    });
  }
};

exports.cancelarAlerta = async(req, res) => {
  try {
    const alertaId = req.params.id;
    
    console.log('🚫 Cancelando alerta:', alertaId);
    
    const alertaActualizada = await Alert.findByIdAndUpdate(
      alertaId,
      { 
        status: 'cancelada',
        visible: false // Ocultar la alerta cancelada
      },
      { new: true }
    );

    if (!alertaActualizada) {
      return res.status(404).json({ mensaje: 'Alerta no encontrada' });
    }

    console.log('✅ Alerta cancelada exitosamente:', alertaActualizada._id);

    // Crear notificación de cancelación para los servicios de emergencia
    const nuevaNotificacion = new Notification({
      alerta: alertaActualizada._id,
      mensaje: `Alerta cancelada por el usuario en ${alertaActualizada.direccion}`,
      tipo: 'alerta_cancelada'
    });
    
    await nuevaNotificacion.save();
    console.log('✅ Notificación de alerta cancelada creada:', nuevaNotificacion._id);

    res.status(200).json({
      mensaje: 'Alerta cancelada exitosamente',
      alerta: alertaActualizada
    });
  } catch (error) {
    console.error('❌ Error al cancelar alerta:', error.message);
    res.status(500).json({
      mensaje: 'Error al cancelar alerta',
      error: error.message
    });
  }
};

// Obtener alertas atendidas por un policía específico
exports.obtenerAlertasAtendidasPorPolicia = async(req, res) => {
  try {
    const policiaId = req.params.policiaId;
    
    console.log('🔍 ===========================================');
    console.log('🔍 BUSCANDO ALERTAS ATENDIDAS POR POLICÍA');
    console.log('🔍 ID del policía recibido:', policiaId);
    console.log('🔍 Tipo del ID:', typeof policiaId);
    console.log('🔍 ===========================================');

    // Primero, verificar si hay alertas atendidas en general
    const totalAtendidas = await Alert.countDocuments({ status: 'atendida' });
    console.log('📊 Total de alertas atendidas en BD:', totalAtendidas);

    // Verificar si hay alertas con este policía (sin filtrar por status)
    const alertasPorPolicia = await Alert.countDocuments({ atendidoPor: policiaId });
    console.log('👮 Total de alertas asignadas a este policía:', alertasPorPolicia);

    // Buscar las alertas específicas
    const alertas = await Alert.find({
      atendidoPor: policiaId,
      status: 'atendida'
    })
    .populate('usuarioCreador', 'fullName email')
    .sort({ fechaHora: -1 }); // Más recientes primero

    console.log('✅ Alertas atendidas encontradas para este policía:', alertas.length);
    
    if (alertas.length > 0) {
      console.log('📋 DETALLES DE LAS ALERTAS:');
      alertas.forEach((alerta, index) => {
        console.log(`   ${index + 1}. ID: ${alerta._id}`);
        console.log(`      Detalle: ${alerta.detalle}`);
        console.log(`      Status: ${alerta.status}`);
        console.log(`      AtendidoPor: ${alerta.atendidoPor}`);
      });
    } else {
      console.log('⚠️ NO SE ENCONTRARON ALERTAS ATENDIDAS PARA ESTE POLICÍA');
      
      // Debug adicional: buscar alertas de este policía con cualquier status
      const todasAlertasPolicia = await Alert.find({ atendidoPor: policiaId });
      console.log('🔍 Debug - Todas las alertas de este policía (cualquier status):', todasAlertasPolicia.length);
      if (todasAlertasPolicia.length > 0) {
        todasAlertasPolicia.forEach((alerta, index) => {
          console.log(`   ${index + 1}. Status: ${alerta.status}, Detalle: ${alerta.detalle}`);
        });
      }
    }

    // Mapear para incluir el nombre del usuario creador
    const alertasConNombre = alertas.map(alerta => ({
      ...alerta.toObject(),
      nombreUsuario: alerta.usuarioCreador?.fullName || 'Usuario desconocido'
    }));

    res.status(200).json(alertasConNombre);
  } catch (error) {
    console.error('❌ Error al obtener alertas atendidas por policía:', error.message);
    res.status(500).json({
      mensaje: 'Error al obtener alertas atendidas',
      error: error.message
    });
  }
};
