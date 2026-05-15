import { Router } from 'express';
import db from '../config/database.js';

const router = Router();

router.get('/ingresos', async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    let query = `SELECT p.*, v.patente, c.nombre as cliente_nombre
      FROM pagos p JOIN vehiculos v ON v.id = p.vehiculo_id JOIN clientes c ON c.id = v.cliente_id`;
    const params = [];
    const conditions = [];
    if (desde) { conditions.push('p.fecha_pago >= ?'); params.push(desde); }
    if (hasta) { conditions.push('p.fecha_pago <= ?'); params.push(hasta); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY p.fecha_pago DESC';
    const [rows] = await db.query(query, params);
    const total = rows.reduce((s, r) => s + Number(r.monto), 0);
    res.json({ pagos: rows, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vehiculos', async (req, res) => {
  try {
    const { desde, hasta, estado } = req.query;
    let query = 'SELECT v.*, c.nombre as cliente_nombre FROM vehiculos v JOIN clientes c ON c.id = v.cliente_id';
    const conditions = [];
    const params = [];
    if (desde) { conditions.push('v.fecha_ingreso >= ?'); params.push(desde); }
    if (hasta) { conditions.push('v.fecha_ingreso <= ?'); params.push(hasta); }
    if (estado) { conditions.push('v.estado = ?'); params.push(estado); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY v.fecha_ingreso DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/resumen-mensual', async (req, res) => {
  try {
    const [ingresos] = await db.query(`
      SELECT DATE_FORMAT(fecha_pago, '%Y-%m') as mes, SUM(monto) as total
      FROM pagos GROUP BY mes ORDER BY mes DESC LIMIT 12
    `);
    const [vehiculosMes] = await db.query(`
      SELECT DATE_FORMAT(fecha_ingreso, '%Y-%m') as mes, COUNT(*) as total
      FROM vehiculos GROUP BY mes ORDER BY mes DESC LIMIT 12
    `);
    res.json({ ingresos, vehiculosMes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
