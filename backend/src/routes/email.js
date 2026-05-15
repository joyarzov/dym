import { Router } from 'express';
import db from '../config/database.js';
import { getEmailConfig, sendMail, EMAIL_KEYS } from '../lib/mailer.js';

const router = Router();

// Configuración actual (con la contraseña enmascarada)
router.get('/config', async (req, res) => {
  try {
    const cfg = await getEmailConfig();
    res.json({
      email_provider: cfg.email_provider || 'gmail',
      email_user: cfg.email_user || '',
      email_from_name: cfg.email_from_name || '',
      email_host: cfg.email_host || '',
      email_port: cfg.email_port || '',
      email_secure: cfg.email_secure || '0',
      email_pass_set: Boolean(cfg.email_pass),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/config', async (req, res) => {
  try {
    const body = req.body || {};
    for (const clave of EMAIL_KEYS) {
      if (body[clave] === undefined) continue;
      // No sobrescribir la contraseña si llega vacía (se mantiene la guardada)
      if (clave === 'email_pass' && body[clave] === '') continue;
      await db.query(
        'INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?',
        [clave, String(body[clave]), String(body[clave])]
      );
    }
    res.json({ message: 'Configuración de correo guardada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Envía un correo de prueba a la dirección indicada (o a la propia casilla)
router.post('/test', async (req, res) => {
  try {
    const cfg = await getEmailConfig();
    const to = (req.body && req.body.to) || cfg.email_user;
    if (!to) return res.status(400).json({ error: 'Indica un destinatario de prueba' });
    await sendMail({
      to,
      subject: 'Prueba de envío — DyM Taller',
      text: 'Este es un correo de prueba. Si lo recibes, la casilla está configurada correctamente.',
    });
    res.json({ message: `Correo de prueba enviado a ${to}` });
  } catch (err) {
    res.status(400).json({ error: 'No se pudo enviar: ' + err.message });
  }
});

export default router;
