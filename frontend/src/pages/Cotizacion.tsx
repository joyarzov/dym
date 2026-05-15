import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import type { Cotizacion as Cot } from '@/lib/types';
import { formatMoney, formatDate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Printer, Plus, Trash2, Mail, Download, Settings } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import EmailConfigDialog from '@/components/EmailConfigDialog';
import { toast } from 'sonner';

const emptyPieza = { nombre_pieza: '', cantidad: '1', costo_unitario: '0', tipo_trabajo: 'reemplazo' };
const emptyMo = { descripcion: '', valor: '0' };

const TIPO_LABEL: Record<string, string> = {
  reparacion: 'Reparación',
  reemplazo: 'Reemplazo',
  pintura: 'Pintura',
  desabolladura: 'Desabolladura',
};

export default function Cotizacion() {
  const { id } = useParams();
  const [cot, setCot] = useState<Cot | null>(null);
  const [pieza, setPieza] = useState(emptyPieza);
  const [mo, setMo] = useState(emptyMo);
  const [sendOpen, setSendOpen] = useState(false);
  const [cfgOpen, setCfgOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [mail, setMail] = useState({ destinatario: '', asunto: '', cuerpo: '' });

  function load() {
    api.get<Cot>(`/cotizaciones/${id}`).then((r) => setCot(r.data));
  }
  useEffect(load, [id]);

  async function addPieza(e: FormEvent) {
    e.preventDefault();
    if (!pieza.nombre_pieza.trim()) return toast.error('Indica el nombre de la pieza');
    try {
      await api.post('/piezas', { ...pieza, vehiculo_id: id });
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

  function openSend() {
    const v = cot?.vehiculo;
    setMail({
      destinatario: v?.cliente_email || '',
      asunto: v ? `Cotización ${v.marca} ${v.modelo} (${v.patente})` : 'Cotización',
      cuerpo:
        `Estimado/a ${v?.cliente_nombre || ''}:\n\n` +
        'Adjuntamos la cotización solicitada en formato PDF. ' +
        'Quedamos atentos a cualquier consulta.\n\nSaludos cordiales.',
    });
    setSendOpen(true);
  }

  async function sendEmail(e: FormEvent) {
    e.preventDefault();
    if (!mail.destinatario.trim()) return toast.error('Indica el correo del destinatario');
    setSending(true);
    try {
      const { data } = await api.post(`/cotizaciones/${id}/enviar`, mail);
      toast.success(data.message || 'Cotización enviada');
      setSendOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'No se pudo enviar la cotización';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

  async function downloadPDF() {
    try {
      const res = await api.get(`/cotizaciones/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      toast.error('No se pudo generar el PDF');
    }
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
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="icon" aria-label="Configurar casilla" onClick={() => setCfgOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={downloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button onClick={openSend}>
            <Mail className="mr-2 h-4 w-4" />
            Enviar por correo
          </Button>
        </div>
      </div>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar cotización por correo</DialogTitle>
          </DialogHeader>
          <form onSubmit={sendEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dest">Destinatario</Label>
              <Input
                id="dest"
                type="email"
                value={mail.destinatario}
                onChange={(e) => setMail({ ...mail, destinatario: e.target.value })}
                placeholder="cliente@correo.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asunto">Asunto</Label>
              <Input
                id="asunto"
                value={mail.asunto}
                onChange={(e) => setMail({ ...mail, asunto: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cuerpo">Mensaje</Label>
              <Textarea
                id="cuerpo"
                rows={6}
                value={mail.cuerpo}
                onChange={(e) => setMail({ ...mail, cuerpo: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Se adjuntará la cotización en PDF automáticamente.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setSendOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={sending}>
                {sending ? 'Enviando…' : 'Enviar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <EmailConfigDialog open={cfgOpen} onOpenChange={setCfgOpen} />

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
              <div className="w-40 space-y-1">
                <label className="text-xs text-muted-foreground">Tipo de trabajo</label>
                <select
                  value={pieza.tipo_trabajo}
                  onChange={(e) => setPieza({ ...pieza, tipo_trabajo: e.target.value })}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="reemplazo">Reemplazo</option>
                  <option value="pintura">Pintura</option>
                  <option value="desabolladura">Desabolladura</option>
                  <option value="reparacion">Reparación</option>
                </select>
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
            <p className="mb-2 font-medium">Detalle</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Detalle</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Valor unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-10 print:hidden" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cot.piezas.length === 0 && cot.manoObra.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-4 text-center text-muted-foreground">Sin ítems en la cotización</TableCell></TableRow>
                )}
                {cot.piezas.map((p) => (
                  <TableRow key={`p-${p.id}`}>
                    <TableCell>{p.nombre_pieza}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{TIPO_LABEL[p.tipo_trabajo] || p.tipo_trabajo}</Badge>
                    </TableCell>
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
                {cot.manoObra.map((m) => (
                  <TableRow key={`m-${m.id}`}>
                    <TableCell>{m.descripcion}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Mano de obra</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">1</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(m.valor)}</TableCell>
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
