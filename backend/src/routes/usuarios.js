import { Router } from 'express';
import bcrypt from 'bcrypt';
import db from '../config/database.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

const ROLES = ['admin', 'superusuario'];

// Solo el superusuario puede administrar usuarios
router.use(requireRole('superusuario'));

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, nombre_completo, email, rol, activo, ultimo_acceso, created_at FROM usuarios ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registro de accesos (logins) — solo superusuario
router.get('/accesos', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const [rows] = await db.query(
      `SELECT id, usuario_id, username, nombre, ip, user_agent, exito, motivo, created_at
       FROM accesos ORDER BY created_at DESC, id DESC LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { username, password, nombre_completo, email, rol } = req.body;

    if (!username || !password || !nombre_completo) {
      return res.status(400).json({ error: 'Usuario, contraseña y nombre son obligatorios' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    const rolFinal = ROLES.includes(rol) ? rol : 'admin';

    const [exists] = await db.query('SELECT id FROM usuarios WHERE username = ?', [username]);
    if (exists.length) {
      return res.status(409).json({ error: 'El nombre de usuario ya existe' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO usuarios (username, password, nombre_completo, email, rol) VALUES (?, ?, ?, ?, ?)',
      [username, hashed, nombre_completo, email || null, rolFinal]
    );
    res.status(201).json({ id: result.insertId, message: 'Usuario creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_completo, email, rol, activo, password } = req.body;

    const [rows] = await db.query('SELECT id FROM usuarios WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (Number(id) === req.user.id && activo === 0) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
    }

    const fields = [];
    const values = [];
    if (nombre_completo !== undefined) { fields.push('nombre_completo = ?'); values.push(nombre_completo); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email || null); }
    if (rol !== undefined && ROLES.includes(rol)) { fields.push('rol = ?'); values.push(rol); }
    if (activo !== undefined) { fields.push('activo = ?'); values.push(activo ? 1 : 0); }
    if (password) {
      if (String(password).length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }
      fields.push('password = ?');
      values.push(await bcrypt.hash(password, 12));
    }
    if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });

    values.push(id);
    await db.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
