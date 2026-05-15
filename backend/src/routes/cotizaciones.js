import { Router } from 'express';
import db from '../config/database.js';

const router = Router();

// Cotización consolidada de un vehículo: piezas + mano de obra + totales
router.get('/:vehiculoId', async (req, res) => {
  try {
    const { vehiculoId } = req.params;

    const [vehRows] = await db.query(
      `SELECT v.*, c.nombre AS cliente_nombre, c.rut AS cliente_rut,
              c.telefono AS cliente_telefono, c.email AS cliente_email, c.direccion AS cliente_direccion
       FROM vehiculos v JOIN clientes c ON c.id = v.cliente_id
       WHERE v.id = ?`,
      [vehiculoId]
    );
    if (!vehRows.length) return res.status(404).json({ error: 'Vehículo no encontrado' });

    const [piezas] = await db.query(
      `SELECT p.*, pr.razon_social AS proveedor_nombre
       FROM piezas p LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
       WHERE p.vehiculo_id = ? ORDER BY p.created_at`,
      [vehiculoId]
    );
    const [manoObra] = await db.query(
      'SELECT * FROM mano_obra WHERE vehiculo_id = ? ORDER BY created_at',
      [vehiculoId]
    );

    const [cfgRows] = await db.query(
      "SELECT clave, valor FROM configuracion WHERE clave IN ('empresa_nombre')"
    );
    const config = {};
    cfgRows.forEach((r) => { config[r.clave] = r.valor; });

    const subtotalPiezas = piezas.reduce((s, p) => s + Number(p.costo_total || 0), 0);
    const subtotalManoObra = manoObra.reduce((s, m) => s + Number(m.total || 0), 0);
    const neto = subtotalPiezas + subtotalManoObra;
    const iva = Math.round(neto * 0.19);
    const total = neto + iva;

    res.json({
      empresa: config.empresa_nombre || 'DyM - Desabolladura y Pintura',
      fecha: new Date().toISOString().slice(0, 10),
      vehiculo: vehRows[0],
      piezas,
      manoObra,
      totales: { subtotalPiezas, subtotalManoObra, neto, iva, total },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
