import { Router } from 'express';
import db from '../config/database.js';
import { generarCotizacionPDF } from '../lib/pdf.js';
import { sendMail } from '../lib/mailer.js';

const router = Router();

async function buildCotizacion(vehiculoId) {
  const [vehRows] = await db.query(
    `SELECT v.*, c.nombre AS cliente_nombre, c.rut AS cliente_rut,
            c.telefono AS cliente_telefono, c.email AS cliente_email, c.direccion AS cliente_direccion
     FROM vehiculos v JOIN clientes c ON c.id = v.cliente_id
     WHERE v.id = ?`,
    [vehiculoId]
  );
  if (!vehRows.length) return null;

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
  const subtotalManoObra = manoObra.reduce((s, m) => s + Number(m.valor || 0), 0);
  const neto = subtotalPiezas + subtotalManoObra;
  const iva = Math.round(neto * 0.19);
  const total = neto + iva;

  return {
    empresa: config.empresa_nombre || 'DyM - Desabolladura y Pintura',
    fecha: new Date().toISOString().slice(0, 10),
    vehiculo: vehRows[0],
    piezas,
    manoObra,
    totales: { subtotalPiezas, subtotalManoObra, neto, iva, total },
  };
}

// Listado de cotizaciones enviadas (definir ANTES de /:vehiculoId)
router.get('/enviadas', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM cotizaciones_enviadas ORDER BY created_at DESC LIMIT 200'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:vehiculoId', async (req, res) => {
  try {
    const cot = await buildCotizacion(req.params.vehiculoId);
    if (!cot) return res.status(404).json({ error: 'Vehículo no encontrado' });
    res.json(cot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:vehiculoId/pdf', async (req, res) => {
  try {
    const cot = await buildCotizacion(req.params.vehiculoId);
    if (!cot) return res.status(404).json({ error: 'Vehículo no encontrado' });
    const pdf = await generarCotizacionPDF(cot);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="cotizacion-${cot.vehiculo.patente || cot.vehiculo.id}.pdf"`
    );
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:vehiculoId/enviar', async (req, res) => {
  const { destinatario, asunto, cuerpo } = req.body || {};
  let cot;
  try {
    if (!destinatario) return res.status(400).json({ error: 'Indica el correo del destinatario' });
    cot = await buildCotizacion(req.params.vehiculoId);
    if (!cot) return res.status(404).json({ error: 'Vehículo no encontrado' });

    const pdf = await generarCotizacionPDF(cot);
    const v = cot.vehiculo;
    const subject = asunto || `Cotización ${v.marca} ${v.modelo} (${v.patente}) — ${cot.empresa}`;
    const body = cuerpo || 'Adjuntamos la cotización solicitada. Quedamos atentos a cualquier consulta.';

    await sendMail({
      to: destinatario,
      subject,
      text: body,
      attachments: [{
        filename: `cotizacion-${v.patente || v.id}.pdf`,
        content: pdf,
        contentType: 'application/pdf',
      }],
    });

    await db.query(
      `INSERT INTO cotizaciones_enviadas
        (vehiculo_id, patente, cliente_nombre, destinatario, asunto, cuerpo, total, enviado_por, estado)
       VALUES (?,?,?,?,?,?,?,?, 'enviado')`,
      [v.id, v.patente, v.cliente_nombre, destinatario, subject, body, cot.totales.total, req.user?.nombre || req.user?.username || '']
    );
    res.json({ message: `Cotización enviada a ${destinatario}` });
  } catch (err) {
    try {
      if (cot) {
        const v = cot.vehiculo;
        await db.query(
          `INSERT INTO cotizaciones_enviadas
            (vehiculo_id, patente, cliente_nombre, destinatario, asunto, cuerpo, total, enviado_por, estado, error_detalle)
           VALUES (?,?,?,?,?,?,?,?, 'error', ?)`,
          [v.id, v.patente, v.cliente_nombre, destinatario || '', asunto || '', cuerpo || '', cot.totales.total, req.user?.nombre || '', String(err.message).slice(0, 500)]
        );
      }
    } catch { /* el log es best-effort */ }
    res.status(400).json({ error: 'No se pudo enviar: ' + err.message });
  }
});

export default router;
