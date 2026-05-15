import { Router } from 'express';
import db from '../config/database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { vehiculo_id } = req.query;
    let query = `SELECT p.*, v.patente, c.nombre as cliente_nombre
      FROM pagos p JOIN vehiculos v ON v.id = p.vehiculo_id JOIN clientes c ON c.id = v.cliente_id`;
    const params = [];
    if (vehiculo_id) {
      query += ' WHERE p.vehiculo_id = ?';
      params.push(vehiculo_id);
    }
    query += ' ORDER BY p.fecha_pago DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, v.patente, v.marca, v.modelo, v.presupuesto_estimado, c.nombre as cliente_nombre, c.rut as cliente_rut
       FROM pagos p JOIN vehiculos v ON v.id = p.vehiculo_id JOIN clientes c ON c.id = v.cliente_id WHERE p.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { vehiculo_id, monto, metodo_pago, tipo, referencia, notas, fecha_pago } = req.body;
    const [result] = await db.query(
      'INSERT INTO pagos (vehiculo_id, monto, metodo_pago, tipo, referencia, notas, fecha_pago) VALUES (?,?,?,?,?,?,?)',
      [vehiculo_id, monto, metodo_pago, tipo, referencia, notas, fecha_pago]
    );
    if (tipo === 'anticipo') {
      await db.query('UPDATE vehiculos SET anticipo_pagado = 1 WHERE id = ?', [vehiculo_id]);
    }
    res.status(201).json({ id: result.insertId, message: 'Pago registrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM pagos WHERE id = ?', [req.params.id]);
    res.json({ message: 'Pago eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
