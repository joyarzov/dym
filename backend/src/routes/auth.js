import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

const router = Router();

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || '';
}

async function registrarAcceso({ usuario_id = null, username = '', nombre = '', ip = '', ua = '', exito = 1, motivo = '' }) {
  try {
    await db.query(
      'INSERT INTO accesos (usuario_id, username, nombre, ip, user_agent, exito, motivo) VALUES (?,?,?,?,?,?,?)',
      [usuario_id, String(username).slice(0, 50), String(nombre).slice(0, 150), String(ip).slice(0, 64), String(ua).slice(0, 300), exito, String(motivo).slice(0, 100)]
    );
  } catch { /* el log de accesos nunca debe romper el login */ }
}

router.post('/login', async (req, res) => {
  const ip = clientIp(req);
  const ua = req.headers['user-agent'] || '';
  try {
    const { username, password } = req.body;
    const [rows] = await db.query('SELECT * FROM usuarios WHERE username = ? AND activo = 1', [username]);
    if (!rows.length) {
      await registrarAcceso({ username, ip, ua, exito: 0, motivo: 'Usuario no encontrado o inactivo' });
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await registrarAcceso({ usuario_id: user.id, username: user.username, nombre: user.nombre_completo, ip, ua, exito: 0, motivo: 'Contraseña incorrecta' });
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    await db.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', [user.id]);
    await registrarAcceso({ usuario_id: user.id, username: user.username, nombre: user.nombre_completo, ip, ua, exito: 1, motivo: 'Inicio de sesión' });

    const token = jwt.sign(
      { id: user.id, username: user.username, nombre: user.nombre_completo, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, nombre: user.nombre_completo, rol: user.rol } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    const [rows] = await db.query('SELECT password FROM usuarios WHERE id = ?', [userId]);
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hashed, userId]);
    res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
