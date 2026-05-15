import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import type { Cotizacion as Cot } from '@/lib/types';
import { formatMoney, formatDate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Printer, Plus, Trash2 } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import { toast } from 'sonner';

const emptyPieza = { nombre_pieza: '', cantidad: '1', costo_unitario: '0' };
const emptyMo = { descripcion: '', valor: '0' };

export default function Cotizacion() {
  const { id } = useParams();
  const [cot, setCot] = useState<Cot | null>(null);
  const [pieza, setPieza] = useState(emptyPieza);
  const [mo, setMo] = useState(emptyMo);

  function load() {
    api.get<Cot>(`/cotizaciones/${id}`).then((r) => setCot(r.data));
  }
  useEffect(load, [id]);

  async function addPieza(e: FormEvent) {
    e.preventDefault();
    if (!pieza.nombre_pieza.trim()) return toast.error('Indica el nombre de la pieza');
    try {
      await api.post('/piezas', { ...pieza, vehiculo_id: id, tipo_trabajo: 'reemplazo' });
      setPieza(emptyPieza);
      load();
    } catch {
      toast.error('No se pudo agregar la pieza');
    }
  }

  async function delPieza(piezaId: number) {
    await api.delete(`/piezas/${piezaId}`);
    load();
  }

  async function addMo(e: FormEvent) {
    e.preventDefault();
    if (!mo.descripcion.trim()) return toast.error('Indica la descripción del trabajo');
    try {
      await api.post('/mano-obra', { ...mo, vehiculo_id: id });
      setMo(emptyMo);
      load();
    } catch {
      toast.error('No se pudo agregar la mano de obra');
    }
  }

  async function delMo(moId: number) {
    await api.delete(`/mano-obra/${moId}`);
    load();
  }

  if (!cot) {
    return <div className="py-10 text-center text-muted-foreground">Cargando…</div>;
  }

  const v = cot.vehiculo;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link to={`/vehiculos/${id}`}>
            <Button variant="ghost" size="icon" aria-label="Volver">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Cotización</h1>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir / PDF
        </Button>
      </div>

      {/* Formularios de carga (no se imprimen) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 print:hidden">
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 font-medium">Agregar pieza / repuesto</h2>
            <form onSubmit={addPieza} className="flex flex-wrap items-end gap-3">
              <div className="min-w-40 flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Descripción</label>
                <Input value={pieza.nombre_pieza} onChange={(e) => setPieza({ ...pieza, nombre_pieza: e.target.value })} />
              </div>
              <div className="w-20 space-y-1">
                <label className="text-xs text-muted-foreground">Cant.</label>
                <Input type="number" min="1" value={pieza.cantidad} onChange={(e) => setPieza({ ...pieza, cantidad: e.target.value })} />
              </div>
              <div className="w-32 space-y-1">
                <label className="text-xs text-muted-foreground">Valor unit.</label>
                <Input type="number" min="0" value={pieza.costo_unitario} onChange={(e) => setPieza({ ...pieza, costo_unitario: e.target.value })} />
              </div>
              <Button type="submit"><Plus className="mr-1 h-4 w-4" />Agregar</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 font-medium">Agregar mano de obra</h2>
            <form onSubmit={addMo} className="flex flex-wrap items-end gap-3">
              <div className="min-w-40 flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Trabajo</label>
                <Input value={mo.descripcion} onChange={(e) => setMo({ ...mo, descripcion: e.target.value })} placeholder="Ej: Desabolladura y pintura puerta delantera" />
              </div>
              <div className="w-40 space-y-1">
                <label className="text-xs text-muted-foreground">Valor (CLP)</label>
                <Input type="number" min="0" value={mo.valor} onChange={(e) => setMo({ ...mo, valor: e.target.value })} />
              </div>
              <Button type="submit"><Plus className="mr-1 h-4 w-4" />Agregar</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Documento imprimible */}
      <Card className="print-document">
        <CardContent className="space-y-6 p-8">
          <div className="flex items-start justify-between border-b border-border pb-6">
            <div className="flex items-center gap-3">
              <LogoMark className="h-12 w-12" />
              <div>
                <p className="font-heading text-lg font-semibold">{cot.empresa}</p>
                <p className="text-sm text-muted-foreground">Desabolladura y pintura automotriz</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="font-heading text-xl font-semibold">Cotización</p>
              <p className="text-muted-foreground">Fecha: {formatDate(cot.fecha)}</p>
              <p className="text-muted-foreground">N° {String(v.id).padStart(5, '0')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-2">
            <div>
              <p className="mb-1 font-medium">Cliente</p>
              <p>{v.cliente_nombre}</p>
              <p className="text-muted-foreground">RUT: {v.cliente_rut || '—'}</p>
              <p className="text-muted-foreground">Tel: {v.cliente_telefono || '—'}</p>
              {v.cliente_email && <p className="text-muted-foreground">{v.cliente_email}</p>}
            </div>
            <div>
              <p className="mb-1 font-medium">Vehículo</p>
              <p>{v.marca} {v.modelo} {v.anio ? `(${v.anio})` : ''}</p>
              <p className="text-muted-foreground">Patente: {v.patente}</p>
              <p className="text-muted-foreground">Color: {v.color || '—'}</p>
            </div>
          </div>

          <div>
            <p className="mb-2 font-medium">Repuestos y materiales</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Detalle</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Valor unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-10 print:hidden" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cot.piezas.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-4 text-center text-muted-foreground">Sin repuestos</TableCell></TableRow>
                ) : cot.piezas.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.nombre_pieza}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.cantidad}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(p.costo_unitario)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(p.costo_total)}</TableCell>
                    <TableCell className="print:hidden">
                      <Button variant="ghost" size="icon" onClick={() => delPieza(p.id)} aria-label="Eliminar">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div>
            <p className="mb-2 font-medium">Mano de obra</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trabajo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-10 print:hidden" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cot.manoObra.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="py-4 text-center text-muted-foreground">Sin mano de obra</TableCell></TableRow>
                ) : cot.manoObra.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.descripcion}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(m.valor)}</TableCell>
                    <TableCell className="print:hidden">
                      <Button variant="ghost" size="icon" onClick={() => delMo(m.id)} aria-label="Eliminar">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal repuestos</span>
                <span className="tabular-nums">{formatMoney(cot.totales.subtotalPiezas)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal mano de obra</span>
                <span className="tabular-nums">{formatMoney(cot.totales.subtotalManoObra)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Neto</span>
                <span className="tabular-nums">{formatMoney(cot.totales.neto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA (19%)</span>
                <span className="tabular-nums">{formatMoney(cot.totales.iva)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(cot.totales.total)}</span>
              </div>
            </div>
          </div>

          <p className="border-t border-border pt-4 text-xs text-muted-foreground">
            Valores expresados en pesos chilenos. Cotización válida por 15 días. Los trabajos
            comienzan una vez aprobado el presupuesto por el cliente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
