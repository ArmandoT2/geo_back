const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const Contacto = require('../models/Contacto');
const createTransporter = require('../config/mailer');
const nodemailer = require('nodemailer');

exports.crearAlerta = async(req, res) => {
  try {
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

    const nuevaAlerta = new Alert({
      direccion,
      usuarioCreador,
      fechaHora,
      detalle,
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

    res.status(201).json({
      alerta: nuevaAlerta,
      notificacion: nuevaNotificacion,
      mensaje: 'Alerta creada y correos enviados a contactos'
    });
  } catch (error) {
    console.error(
      '❌ Error al crear la alerta y enviar correos:',
      error.message
    );
    res.status(500).json({
      mensaje: 'Error al crear la alerta',
      error: error.message
    });
  }
};

exports.obtenerAlertasPorUsuario = async(req, res) => {
  try {
    const usuarioId = req.params.id;
    // Filtrar solo alertas visibles para el usuario ciudadano
    const alertas = await Alert.find({
      usuarioCreador: usuarioId,
      visible: true
    }).sort({
      createdAt: -1
    });
    res.status(200).json(alertas);
  } catch (error) {
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
    const { status, policiaId, origen, destino, evidenciaUrl } = req.body;

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

    if (status === 'atendida' && evidenciaUrl) {
      updateFields.$push = { evidencia: evidenciaUrl };
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
