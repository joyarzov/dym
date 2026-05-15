import db from '../config/database.js';

const UMBRAL_ANTICIPO = 1300000;

// Recalcula el presupuesto del vehículo a partir de la cotización
// (piezas + mano de obra + IVA 19%) y ajusta el anticipo en consecuencia.
export async function recalcPresupuesto(vehiculoId) {
  if (!vehiculoId) return;
  const [[{ piezas }]] = await db.query(
    'SELECT COALESCE(SUM(costo_total),0) AS piezas FROM piezas WHERE vehiculo_id = ?',
    [vehiculoId]
  );
  const [[{ mo }]] = await db.query(
    'SELECT COALESCE(SUM(valor),0) AS mo FROM mano_obra WHERE vehiculo_id = ?',
    [vehiculoId]
  );
  const neto = Number(piezas) + Number(mo);
  const total = Math.round(neto * 1.19);
  const requiere = total >= UMBRAL_ANTICIPO ? 1 : 0;
  const montoAnticipo = requiere ? Math.round(total * 0.5) : 0;

  await db.query(
    `UPDATE vehiculos
       SET presupuesto_estimado = ?, requiere_anticipo = ?, monto_anticipo = ?
     WHERE id = ?`,
    [total, requiere, montoAnticipo, vehiculoId]
  );
  return total;
}
