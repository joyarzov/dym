import { Router } from 'express';
import db from '../config/database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM configuracion ORDER BY clave');
    const config = {};
    rows.forEach(r => { config[r.clave] = r.valor; });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    for (const [clave, valor] of entries) {
      await db.query(
        'INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?',
        [clave, valor, valor]
      );
    }
    res.json({ message: 'Configuracion actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
