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

    const [[{ total: entregadosMes }]] = await db.query(
      "SELECT COUNT(*) as total FROM vehiculos WHERE estado = 'entregado' AND MONTH(fecha_entrega_real) = MONTH(CURRENT_DATE()) AND YEAR(fecha_entrega_real) = YEAR(CURRENT_DATE())"
    );
    const [[{ total: ticketPromedio }]] = await db.query(
      'SELECT COALESCE(ROUND(AVG(NULLIF(presupuesto_estimado,0))),0) as total FROM vehiculos'
    );
    const [[{ total: piezasPendientes }]] = await db.query(
      "SELECT COUNT(*) as total FROM piezas WHERE estado != 'completada'"
    );
    const [[{ total: cotizacionesMes }]] = await db.query(
      "SELECT COUNT(*) as total FROM cotizaciones_enviadas WHERE estado='enviado' AND MONTH(created_at)=MONTH(CURRENT_DATE()) AND YEAR(created_at)=YEAR(CURRENT_DATE())"
    );

    const [ingresosPorMes] = await db.query(`
      SELECT DATE_FORMAT(fecha_pago, '%Y-%m') as mes, COALESCE(SUM(monto),0) as total
      FROM pagos
      WHERE fecha_pago >= DATE_SUB(DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'), INTERVAL 5 MONTH)
      GROUP BY mes ORDER BY mes
    `);

    const [ingresosVehiculosPorMes] = await db.query(`
      SELECT DATE_FORMAT(fecha_ingreso, '%Y-%m') as mes, COUNT(*) as total
      FROM vehiculos
      WHERE fecha_ingreso >= DATE_SUB(DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'), INTERVAL 5 MONTH)
      GROUP BY mes ORDER BY mes
    `);

    const [topClientes] = await db.query(`
      SELECT c.nombre, COUNT(v.id) as total
      FROM clientes c JOIN vehiculos v ON v.cliente_id = c.id
      GROUP BY c.id ORDER BY total DESC LIMIT 5
    `);

    res.json({
      totalVehiculos, enTaller, listos, totalClientes, ingresosMes, pendienteCobro,
      recientes, porEstado,
      entregadosMes, ticketPromedio, piezasPendientes, cotizacionesMes,
      ingresosPorMes, ingresosVehiculosPorMes, topClientes,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
