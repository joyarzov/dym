import { Router } from 'express';
import db from '../config/database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { vehiculo_id } = req.query;
    if (!vehiculo_id) return res.status(400).json({ error: 'vehiculo_id requerido' });
    const [rows] = await db.query(
      'SELECT * FROM mano_obra WHERE vehiculo_id = ? ORDER BY created_at',
      [vehiculo_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { vehiculo_id, descripcion, valor } = req.body;
    if (!vehiculo_id || !descripcion) {
      return res.status(400).json({ error: 'Vehículo y descripción son obligatorios' });
    }
    const monto = Math.round(Number(valor) || 0);
    const [result] = await db.query(
      'INSERT INTO mano_obra (vehiculo_id, descripcion, valor) VALUES (?,?,?)',
      [vehiculo_id, descripcion, monto]
    );
    res.status(201).json({ id: result.insertId, message: 'Mano de obra agregada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM mano_obra WHERE id = ?', [req.params.id]);
    res.json({ message: 'Ítem eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
