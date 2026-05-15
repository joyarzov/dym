import { Router } from 'express';
import db from '../config/database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { vehiculo_id } = req.query;
    let query = 'SELECT p.*, pr.razon_social as proveedor_nombre, v.patente, v.marca, v.modelo FROM piezas p LEFT JOIN proveedores pr ON pr.id = p.proveedor_id LEFT JOIN vehiculos v ON v.id = p.vehiculo_id';
    const params = [];
    if (vehiculo_id) {
      query += ' WHERE p.vehiculo_id = ?';
      params.push(vehiculo_id);
    }
    query += ' ORDER BY p.created_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { vehiculo_id, proveedor_id, nombre_pieza, tipo_trabajo, descripcion, cantidad, costo_unitario, fecha_inicio } = req.body;
    const costoTotal = (Number(cantidad) || 1) * (Number(costo_unitario) || 0);
    const [result] = await db.query(
      'INSERT INTO piezas (vehiculo_id, proveedor_id, nombre_pieza, tipo_trabajo, descripcion, cantidad, costo_unitario, costo_total, fecha_inicio) VALUES (?,?,?,?,?,?,?,?,?)',
      [vehiculo_id, proveedor_id || null, nombre_pieza, tipo_trabajo, descripcion, cantidad || 1, costo_unitario || 0, costoTotal, fecha_inicio]
    );
    res.status(201).json({ id: result.insertId, message: 'Pieza creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { proveedor_id, nombre_pieza, tipo_trabajo, descripcion, cantidad, costo_unitario, estado, fecha_inicio, fecha_fin } = req.body;
    const costoTotal = (Number(cantidad) || 1) * (Number(costo_unitario) || 0);
    await db.query(
      'UPDATE piezas SET proveedor_id=?, nombre_pieza=?, tipo_trabajo=?, descripcion=?, cantidad=?, costo_unitario=?, costo_total=?, estado=?, fecha_inicio=?, fecha_fin=? WHERE id=?',
      [proveedor_id || null, nombre_pieza, tipo_trabajo, descripcion, cantidad, costo_unitario, costoTotal, estado, fecha_inicio, fecha_fin, req.params.id]
    );
    res.json({ message: 'Pieza actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM piezas WHERE id = ?', [req.params.id]);
    res.json({ message: 'Pieza eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
