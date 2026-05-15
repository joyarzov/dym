import { Router } from 'express';
import db from '../config/database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM proveedores';
    const params = [];
    if (search) {
      query += ' WHERE razon_social LIKE ? OR rut LIKE ? OR rubro LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY razon_social';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM proveedores WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { rut, razon_social, nombre_contacto, telefono, email, direccion, rubro, notas } = req.body;
    const [result] = await db.query(
      'INSERT INTO proveedores (rut, razon_social, nombre_contacto, telefono, email, direccion, rubro, notas) VALUES (?,?,?,?,?,?,?,?)',
      [rut, razon_social, nombre_contacto, telefono, email, direccion, rubro, notas]
    );
    res.status(201).json({ id: result.insertId, message: 'Proveedor creado' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'RUT ya registrado' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { rut, razon_social, nombre_contacto, telefono, email, direccion, rubro, activo, notas } = req.body;
    await db.query(
      'UPDATE proveedores SET rut=?, razon_social=?, nombre_contacto=?, telefono=?, email=?, direccion=?, rubro=?, activo=?, notas=? WHERE id=?',
      [rut, razon_social, nombre_contacto, telefono, email, direccion, rubro, activo, notas, req.params.id]
    );
    res.json({ message: 'Proveedor actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('UPDATE proveedores SET activo = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Proveedor desactivado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
