import { Router } from 'express';
import db from '../config/database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [[{ total: totalVehiculos }]] = await db.query('SELECT COUNT(*) as total FROM vehiculos');
    const [[{ total: enTaller }]] = await db.query("SELECT COUNT(*) as total FROM vehiculos WHERE estado != 'entregado'");
    const [[{ total: listos }]] = await db.query("SELECT COUNT(*) as total FROM vehiculos WHERE estado = 'listo'");
    const [[{ total: totalClientes }]] = await db.query('SELECT COUNT(*) as total FROM clientes');

    const [[{ total: ingresosMes }]] = await db.query(
      'SELECT COALESCE(SUM(monto),0) as total FROM pagos WHERE MONTH(fecha_pago) = MONTH(CURRENT_DATE()) AND YEAR(fecha_pago) = YEAR(CURRENT_DATE())'
    );

    const [[{ total: pendienteCobro }]] = await db.query(`
      SELECT COALESCE(SUM(v.presupuesto_estimado - COALESCE(p.pagado, 0)), 0) as total
      FROM vehiculos v
      LEFT JOIN (SELECT vehiculo_id, SUM(monto) as pagado FROM pagos GROUP BY vehiculo_id) p ON p.vehiculo_id = v.id
      WHERE v.estado != 'entregado'
    `);

    const [recientes] = await db.query(`
      SELECT v.*, c.nombre as cliente_nombre
      FROM vehiculos v JOIN clientes c ON c.id = v.cliente_id
      WHERE v.estado != 'entregado'
      ORDER BY v.fecha_ingreso DESC LIMIT 10
    `);

    const [porEstado] = await db.query(
      "SELECT estado, COUNT(*) as total FROM vehiculos WHERE estado != 'entregado' GROUP BY estado"
    );

    res.json({ totalVehiculos, enTaller, listos, totalClientes, ingresosMes, pendienteCobro, recientes, porEstado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
