import { Router } from 'express';
import db from '../config/database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT c.*, COUNT(v.id) as total_vehiculos FROM clientes c LEFT JOIN vehiculos v ON v.cliente_id = c.id';
    const params = [];
    if (search) {
      query += ' WHERE c.nombre LIKE ? OR c.rut LIKE ? OR c.telefono LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' GROUP BY c.id ORDER BY c.nombre';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Cliente no encontrado' });
    const [vehiculos] = await db.query('SELECT * FROM vehiculos WHERE cliente_id = ? ORDER BY fecha_ingreso DESC', [req.params.id]);
    res.json({ ...rows[0], vehiculos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { rut, nombre, telefono, email, direccion } = req.body;
    const [result] = await db.query('INSERT INTO clientes (rut, nombre, telefono, email, direccion) VALUES (?, ?, ?, ?, ?)', [rut, nombre, telefono, email, direccion]);
    res.status(201).json({ id: result.insertId, message: 'Cliente creado' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'RUT ya registrado' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { rut, nombre, telefono, email, direccion } = req.body;
    await db.query('UPDATE clientes SET rut=?, nombre=?, telefono=?, email=?, direccion=? WHERE id=?', [rut, nombre, telefono, email, direccion, req.params.id]);
    res.json({ message: 'Cliente actualizado' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'RUT ya registrado' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [vehiculos] = await db.query('SELECT COUNT(*) as total FROM vehiculos WHERE cliente_id = ?', [req.params.id]);
    if (vehiculos[0].total > 0) return res.status(400).json({ error: 'Cliente tiene vehiculos asociados' });
    await db.query('DELETE FROM clientes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Cliente eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
