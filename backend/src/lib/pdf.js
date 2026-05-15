import PDFDocument from 'pdfkit';

const TIPO_LABEL = {
  reparacion: 'Reparación',
  reemplazo: 'Reemplazo',
  pintura: 'Pintura',
  desabolladura: 'Desabolladura',
};

function clp(n) {
  return '$ ' + new Intl.NumberFormat('es-CL').format(Math.round(Number(n) || 0));
}

function fechaCL(s) {
  if (!s) return '-';
  const d = new Date(String(s).slice(0, 10) + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-CL');
}

// Genera el PDF de la cotización y lo devuelve como Buffer
export function generarCotizacionPDF(cot) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 48 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const v = cot.vehiculo;
      const amber = '#E8830A';
      const gray = '#6b7280';
      const left = 48;
      const right = 547;

      // Encabezado
      doc.fillColor(amber).fontSize(20).font('Helvetica-Bold').text(cot.empresa, left, 48);
      doc.fillColor(gray).fontSize(10).font('Helvetica').text('Desabolladura y pintura automotriz', left, 74);

      doc.fillColor('#111111').fontSize(18).font('Helvetica-Bold').text('COTIZACIÓN', 0, 50, { align: 'right' });
      doc.fillColor(gray).fontSize(10).font('Helvetica')
        .text(`N° ${String(v.id).padStart(5, '0')}`, 0, 74, { align: 'right' })
        .text(`Fecha: ${fechaCL(cot.fecha)}`, 0, 88, { align: 'right' });

      doc.moveTo(left, 112).lineTo(right, 112).strokeColor('#d1d5db').stroke();

      // Cliente / Vehículo
      let y = 128;
      doc.fillColor('#111111').fontSize(11).font('Helvetica-Bold').text('Cliente', left, y);
      doc.fillColor('#111111').fontSize(11).font('Helvetica-Bold').text('Vehículo', 320, y);
      y += 16;
      doc.font('Helvetica').fontSize(10).fillColor('#333333');
      doc.text(v.cliente_nombre || '-', left, y);
      doc.text(`${v.marca || ''} ${v.modelo || ''} ${v.anio ? '(' + v.anio + ')' : ''}`.trim(), 320, y);
      y += 14;
      doc.fillColor(gray);
      doc.text(`RUT: ${v.cliente_rut || '-'}`, left, y);
      doc.text(`Patente: ${v.patente || '-'}`, 320, y);
      y += 14;
      doc.text(`Tel: ${v.cliente_telefono || '-'}`, left, y);
      doc.text(`Color: ${v.color || '-'}`, 320, y);
      y += 14;
      if (v.cliente_email) { doc.text(v.cliente_email, left, y); y += 14; }

      // Tabla detalle
      y += 14;
      const cols = { detalle: left, tipo: 250, cant: 350, unit: 400, total: 480 };
      doc.fillColor('#111111').font('Helvetica-Bold').fontSize(10);
      doc.text('Detalle', cols.detalle, y);
      doc.text('Tipo', cols.tipo, y);
      doc.text('Cant.', cols.cant, y, { width: 40, align: 'right' });
      doc.text('V. unit.', cols.unit, y, { width: 60, align: 'right' });
      doc.text('Total', cols.total, y, { width: 67, align: 'right' });
      y += 16;
      doc.moveTo(left, y).lineTo(right, y).strokeColor('#d1d5db').stroke();
      y += 8;

      doc.font('Helvetica').fontSize(9.5).fillColor('#333333');
      const rows = [
        ...cot.piezas.map((p) => ({
          detalle: p.nombre_pieza,
          tipo: TIPO_LABEL[p.tipo_trabajo] || p.tipo_trabajo || '-',
          cant: String(p.cantidad),
          unit: clp(p.costo_unitario),
          total: clp(p.costo_total),
        })),
        ...cot.manoObra.map((m) => ({
          detalle: m.descripcion,
          tipo: 'Mano de obra',
          cant: '1',
          unit: clp(m.valor),
          total: clp(m.valor),
        })),
      ];

      if (rows.length === 0) {
        doc.fillColor(gray).text('Sin ítems en la cotización', left, y);
        y += 18;
      } else {
        for (const r of rows) {
          if (y > 720) { doc.addPage(); y = 60; }
          const h = doc.heightOfString(r.detalle, { width: 195 });
          doc.fillColor('#333333');
          doc.text(r.detalle, cols.detalle, y, { width: 195 });
          doc.text(r.tipo, cols.tipo, y, { width: 95 });
          doc.text(r.cant, cols.cant, y, { width: 40, align: 'right' });
          doc.text(r.unit, cols.unit, y, { width: 60, align: 'right' });
          doc.text(r.total, cols.total, y, { width: 67, align: 'right' });
          y += Math.max(h, 12) + 8;
          doc.moveTo(left, y - 4).lineTo(right, y - 4).strokeColor('#eeeeee').stroke();
        }
      }

      // Totales
      y += 10;
      const t = cot.totales;
      const tx = 360;
      const tvx = 480;
      const linea = (label, val, bold) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10)
          .fillColor(bold ? '#111111' : gray);
        doc.text(label, tx, y, { width: 110 });
        doc.fillColor('#111111').text(val, tvx, y, { width: 67, align: 'right' });
        y += bold ? 22 : 16;
      };
      linea('Subtotal repuestos', clp(t.subtotalPiezas));
      linea('Subtotal mano de obra', clp(t.subtotalManoObra));
      linea('Neto', clp(t.neto));
      linea('IVA (19%)', clp(t.iva));
      doc.moveTo(tx, y).lineTo(right, y).strokeColor('#d1d5db').stroke();
      y += 8;
      linea('TOTAL', clp(t.total), true);

      // Pie
      doc.font('Helvetica').fontSize(8.5).fillColor(gray)
        .text(
          'Valores expresados en pesos chilenos. Cotización válida por 15 días. Los trabajos comienzan una vez aprobado el presupuesto por el cliente.',
          left, 780, { width: right - left, align: 'center' }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
