import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from '../config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'vehiculos');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(uploadDir, String(req.params.id || 'temp'));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { search, estado } = req.query;
    let query = 'SELECT v.*, c.nombre as cliente_nombre FROM vehiculos v JOIN clientes c ON c.id = v.cliente_id';
    const conditions = [];
    const params = [];
    if (search) {
      conditions.push('(v.patente LIKE ? OR c.nombre LIKE ? OR v.marca LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (estado) {
      conditions.push('v.estado = ?');
      params.push(estado);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY v.fecha_ingreso DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Busca la OT más reciente por patente exacta (para proponer reingreso)
router.get('/buscar/patente', async (req, res) => {
  try {
    const patente = String(req.query.patente || '').trim();
    if (!patente) return res.json(null);
    const [rows] = await db.query(
      `SELECT v.id, v.patente, v.marca, v.modelo, v.estado, v.fecha_ingreso, c.nombre AS cliente_nombre
       FROM vehiculos v JOIN clientes c ON c.id = v.cliente_id
       WHERE UPPER(v.patente) = UPPER(?)
       ORDER BY v.fecha_ingreso DESC, v.id DESC LIMIT 1`,
      [patente]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vehículos actualmente en taller (no entregados) con días en taller
router.get('/en-taller', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT v.id, v.patente, v.marca, v.modelo, v.color, v.estado,
              v.fecha_ingreso, v.fecha_estimada_entrega,
              c.nombre AS cliente_nombre,
              DATEDIFF(CURRENT_DATE(), v.fecha_ingreso) AS dias_en_taller
       FROM vehiculos v JOIN clientes c ON c.id = v.cliente_id
       WHERE v.estado != 'entregado'
       ORDER BY v.fecha_ingreso ASC, v.id ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT v.*, c.nombre as cliente_nombre, c.rut as cliente_rut, c.telefono as cliente_telefono FROM vehiculos v JOIN clientes c ON c.id = v.cliente_id WHERE v.id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Vehiculo no encontrado' });

    const [fotos] = await db.query('SELECT * FROM vehiculo_fotos WHERE vehiculo_id = ? ORDER BY created_at', [req.params.id]);
    const [piezas] = await db.query('SELECT p.*, pr.razon_social as proveedor_nombre FROM piezas p LEFT JOIN proveedores pr ON pr.id = p.proveedor_id WHERE p.vehiculo_id = ?', [req.params.id]);
    const [pagos] = await db.query('SELECT * FROM pagos WHERE vehiculo_id = ? ORDER BY fecha_pago DESC', [req.params.id]);
    const [manoObra] = await db.query('SELECT * FROM mano_obra WHERE vehiculo_id = ? ORDER BY created_at', [req.params.id]);

    const totalPagado = pagos.reduce((sum, p) => sum + Number(p.monto), 0);

    // Historial: todas las OT (ingresos) de la misma patente
    const [historial] = await db.query(
      `SELECT v.id, v.fecha_ingreso, v.fecha_entrega_real, v.estado, v.presupuesto_estimado,
              COALESCE((SELECT SUM(monto) FROM pagos WHERE vehiculo_id = v.id), 0) AS pagado
       FROM vehiculos v
       WHERE v.patente = ?
       ORDER BY v.fecha_ingreso DESC, v.id DESC`,
      [rows[0].patente]
    );

    const [trazabilidad] = await db.query(
      'SELECT estado, usuario, created_at FROM estado_historial WHERE vehiculo_id = ? ORDER BY created_at ASC, id ASC',
      [req.params.id]
    );

    res.json({ ...rows[0], fotos, piezas, manoObra, pagos, totalPagado, historial, trazabilidad });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reingreso: crea una nueva OT clonando los datos del vehículo (activo)
router.post('/:id/reingreso', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vehiculos WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Vehiculo no encontrado' });
    const v = rows[0];
    const hoy = new Date().toISOString().slice(0, 10);

    const [result] = await db.query(
      `INSERT INTO vehiculos (cliente_id, patente, marca, modelo, anio, color, fecha_ingreso, estado)
       VALUES (?,?,?,?,?,?,?, 'recibido')`,
      [v.cliente_id, v.patente, v.marca, v.modelo, v.anio, v.color, hoy]
    );
    await db.query(
      'INSERT INTO estado_historial (vehiculo_id, estado, usuario) VALUES (?, ?, ?)',
      [result.insertId, 'recibido', req.user?.nombre || req.user?.username || '']
    );
    res.status(201).json({ id: result.insertId, message: 'Reingreso creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      cliente_id, patente, marca, modelo, anio, color, fecha_ingreso, fecha_estimada_entrega,
      estado, tiene_seguro, aseguradora, numero_poliza, numero_siniestro, nombre_ajustador,
      telefono_ajustador, presupuesto_estimado, diagnostico, observaciones
    } = req.body;

    const presupuesto = Number(presupuesto_estimado) || 0;
    const montoAnticipo = presupuesto >= 1300000 ? Math.round(presupuesto * 0.5) : 0;
    const nn = (x) => (x === '' || x === undefined ? null : x);

    const [result] = await db.query(
      `INSERT INTO vehiculos (cliente_id, patente, marca, modelo, anio, color, fecha_ingreso, fecha_estimada_entrega,
        estado, tiene_seguro, aseguradora, numero_poliza, numero_siniestro, nombre_ajustador, telefono_ajustador,
        presupuesto_estimado, requiere_anticipo, monto_anticipo, diagnostico, observaciones)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [cliente_id, patente, marca, modelo, nn(anio), color, fecha_ingreso, nn(fecha_estimada_entrega),
        estado || 'recibido', tiene_seguro ? 1 : 0, aseguradora, numero_poliza, numero_siniestro,
        nombre_ajustador, telefono_ajustador, presupuesto, presupuesto >= 1300000 ? 1 : 0, montoAnticipo,
        diagnostico, observaciones]
    );

    await db.query(
      'INSERT INTO estado_historial (vehiculo_id, estado, usuario) VALUES (?, ?, ?)',
      [result.insertId, estado || 'recibido', req.user?.nombre || req.user?.username || '']
    );

    res.status(201).json({ id: result.insertId, message: 'Vehiculo ingresado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const {
      cliente_id, patente, marca, modelo, anio, color, fecha_ingreso, fecha_estimada_entrega,
      fecha_entrega_real, estado, tiene_seguro, aseguradora, numero_poliza, numero_siniestro,
      nombre_ajustador, telefono_ajustador, presupuesto_estimado, anticipo_pagado, diagnostico, observaciones
    } = req.body;

    const presupuesto = Number(presupuesto_estimado) || 0;
    const montoAnticipo = presupuesto >= 1300000 ? Math.round(presupuesto * 0.5) : 0;
    const nn = (x) => (x === '' || x === undefined ? null : x);

    await db.query(
      `UPDATE vehiculos SET cliente_id=?, patente=?, marca=?, modelo=?, anio=?, color=?, fecha_ingreso=?,
        fecha_estimada_entrega=?, fecha_entrega_real=?, estado=?, tiene_seguro=?, aseguradora=?, numero_poliza=?,
        numero_siniestro=?, nombre_ajustador=?, telefono_ajustador=?, presupuesto_estimado=?,
        requiere_anticipo=?, monto_anticipo=?, anticipo_pagado=?, diagnostico=?, observaciones=? WHERE id=?`,
      [cliente_id, patente, marca, modelo, nn(anio), color, fecha_ingreso, nn(fecha_estimada_entrega),
        nn(fecha_entrega_real), estado, tiene_seguro ? 1 : 0, aseguradora, numero_poliza, numero_siniestro,
        nombre_ajustador, telefono_ajustador, presupuesto, presupuesto >= 1300000 ? 1 : 0, montoAnticipo,
        anticipo_pagado ? 1 : 0, diagnostico, observaciones, req.params.id]
    );

    res.json({ message: 'Vehiculo actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const update = estado === 'entregado'
      ? 'UPDATE vehiculos SET estado = ?, fecha_entrega_real = CURRENT_DATE() WHERE id = ?'
      : 'UPDATE vehiculos SET estado = ? WHERE id = ?';
    await db.query(update, [estado, req.params.id]);
    await db.query(
      'INSERT INTO estado_historial (vehiculo_id, estado, usuario) VALUES (?,?,?)',
      [req.params.id, estado, req.user?.nombre || req.user?.username || '']
    );
    res.json({ message: 'Estado actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/fotos', upload.array('fotos', 10), async (req, res) => {
  try {
    const { tipo } = req.body;
    const values = req.files.map(f => [
      req.params.id,
      `/uploads/vehiculos/${req.params.id}/${f.filename}`,
      f.originalname,
      tipo || 'ingreso',
    ]);
    if (values.length) {
      await db.query('INSERT INTO vehiculo_fotos (vehiculo_id, ruta_foto, descripcion, tipo) VALUES ?', [values]);
    }
    res.json({ message: `${values.length} fotos subidas` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/fotos/:fotoId', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT ruta_foto FROM vehiculo_fotos WHERE id = ?', [req.params.fotoId]);
    if (rows.length) {
      const filePath = path.join(__dirname, '..', '..', rows[0].ruta_foto);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await db.query('DELETE FROM vehiculo_fotos WHERE id = ?', [req.params.fotoId]);
    res.json({ message: 'Foto eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
