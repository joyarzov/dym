import { useEffect, useState, type FormEvent } from 'react';
import api from '@/lib/api';
import type { Pago, PagoOpcion } from '@/lib/types';
import { formatMoney, formatDate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const empty = { vehiculo_id: '', monto: '', metodo_pago: 'transferencia', tipo: 'abono', referencia: '', notas: '', fecha_pago: new Date().toISOString().split('T')[0] };

export default function Pagos() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [opciones, setOpciones] = useState<PagoOpcion[]>([]);
  const [form, setForm] = useState<Record<string, string>>(empty);
  const [open, setOpen] = useState(false);
  const [confirmExceso, setConfirmExceso] = useState(false);

  function load() { api.get('/pagos').then((r) => setPagos(r.data)); }
  function loadOpciones() { api.get('/pagos/opciones').then((r) => setOpciones(r.data)); }

  useEffect(() => {
    load();
    loadOpciones();
  }, []);

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  const vehiculoItems = Object.fromEntries(
    opciones.map((o) => [
      String(o.id),
      `OT ${String(o.id).padStart(5, '0')} · ${o.patente} · ${o.cliente_nombre} · saldo ${formatMoney(o.saldo)}`,
    ])
  );
  const metodoItems = { transferencia: 'Transferencia', tarjeta_debito: 'Tarjeta Débito', tarjeta_credito: 'Tarjeta Crédito' };
  const tipoItems = { anticipo: 'Anticipo', abono: 'Abono', pago_final: 'Pago Final' };

  const opcionSel = opciones.find((o) => String(o.id) === String(form.vehiculo_id));

  async function doSubmit() {
    try {
      await api.post('/pagos', form);
      toast.success('Pago registrado');
      setForm(empty);
      setOpen(false);
      setConfirmExceso(false);
      load();
      loadOpciones();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'No se pudo registrar el pago';
      toast.error(msg);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.vehiculo_id) {
      toast.error('Selecciona una orden de trabajo');
      return;
    }
    if (opcionSel && Number(form.monto) > opcionSel.saldo) {
      setConfirmExceso(true);
      return;
    }
    doSubmit();
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar pago?')) return;
    await api.delete(`/pagos/${id}`);
    toast.success('Pago eliminado');
    load();
    loadOpciones();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Pagos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button><Plus className="h-4 w-4 mr-2" />Nuevo Pago</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Pago</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Orden de trabajo</Label>
                <Select items={vehiculoItems} value={form.vehiculo_id} onValueChange={(v) => { if (v) set('vehiculo_id', String(v)); }}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar OT…" /></SelectTrigger>
                  <SelectContent>{opciones.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      OT {String(o.id).padStart(5, '0')} · {o.patente} · {o.cliente_nombre} · {formatDate(o.fecha_ingreso)} · saldo {formatMoney(o.saldo)}
                    </SelectItem>
                  ))}</SelectContent>
                </Select>
                {opcionSel && (
                  <p className="text-xs text-muted-foreground">
                    Presupuesto {formatMoney(opcionSel.presupuesto)} · pagado {formatMoney(opcionSel.pagado)} ·{' '}
                    <span className={opcionSel.saldo > 0 ? 'text-destructive' : 'text-success'}>saldo {formatMoney(opcionSel.saldo)}</span>
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Monto</Label><Input type="number" value={form.monto} onChange={(e) => set('monto', e.target.value)} required /></div>
                <div className="space-y-2"><Label>Fecha</Label><Input type="date" value={form.fecha_pago} onChange={(e) => set('fecha_pago', e.target.value)} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Método</Label>
                  <Select items={metodoItems} value={form.metodo_pago} onValueChange={(v) => { if (v) set('metodo_pago', String(v)); }}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="tarjeta_debito">Tarjeta Débito</SelectItem>
                      <SelectItem value="tarjeta_credito">Tarjeta Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Tipo</Label>
                  <Select items={tipoItems} value={form.tipo} onValueChange={(v) => { if (v) set('tipo', String(v)); }}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anticipo">Anticipo</SelectItem>
                      <SelectItem value="abono">Abono</SelectItem>
                      <SelectItem value="pago_final">Pago Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Referencia</Label><Input value={form.referencia} onChange={(e) => set('referencia', e.target.value)} placeholder="Nº transferencia, etc." /></div>
              <Button type="submit" className="w-full">Registrar Pago</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="p-4 sm:p-6">
        <div className="overflow-x-auto">
        <Table className="min-w-[720px]">
          <TableHeader><TableRow>
            <TableHead>Fecha</TableHead><TableHead>Patente</TableHead><TableHead>Cliente</TableHead>
            <TableHead>Tipo</TableHead><TableHead>Método</TableHead><TableHead>Monto</TableHead>
            <TableHead>Referencia</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {pagos.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{formatDate(p.fecha_pago)}</TableCell>
                <TableCell className="font-bold">{p.patente}</TableCell>
                <TableCell>{p.cliente_nombre}</TableCell>
                <TableCell><Badge variant="outline">{p.tipo}</Badge></TableCell>
                <TableCell>{p.metodo_pago.replace('_', ' ')}</TableCell>
                <TableCell className="font-bold">{formatMoney(p.monto)}</TableCell>
                <TableCell>{p.referencia || '-'}</TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
            {!pagos.length && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Sin pagos</TableCell></TableRow>}
          </TableBody>
        </Table>
        </div>
      </CardContent></Card>

      <Dialog open={confirmExceso} onOpenChange={setConfirmExceso}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>El pago supera el saldo</DialogTitle></DialogHeader>
          <p className="text-sm">
            El monto <span className="font-semibold">{formatMoney(Number(form.monto))}</span> es mayor que el
            saldo pendiente de esta OT (<span className="font-semibold">{formatMoney(opcionSel?.saldo ?? 0)}</span>).
            ¿Registrar el pago de todas formas?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setConfirmExceso(false)}>No</Button>
            <Button onClick={doSubmit}>Sí, registrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
