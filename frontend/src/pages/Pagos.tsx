import { useEffect, useState, type FormEvent } from 'react';
import api from '@/lib/api';
import type { Pago, Vehiculo } from '@/lib/types';
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
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [form, setForm] = useState<Record<string, string>>(empty);
  const [open, setOpen] = useState(false);

  function load() { api.get('/pagos').then((r) => setPagos(r.data)); }

  useEffect(() => {
    load();
    api.get('/vehiculos').then((r) => setVehiculos(r.data));
  }, []);

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  const vehiculoItems = Object.fromEntries(
    vehiculos.map((v) => [String(v.id), `${v.patente} — ${v.cliente_nombre}`])
  );
  const metodoItems = { transferencia: 'Transferencia', tarjeta_debito: 'Tarjeta Débito', tarjeta_credito: 'Tarjeta Crédito' };
  const tipoItems = { anticipo: 'Anticipo', abono: 'Abono', pago_final: 'Pago Final' };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.vehiculo_id) {
      toast.error('Selecciona un vehículo');
      return;
    }
    try {
      await api.post('/pagos', form);
      toast.success('Pago registrado');
      setForm(empty);
      setOpen(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'No se pudo registrar el pago';
      toast.error(msg);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar pago?')) return;
    await api.delete(`/pagos/${id}`);
    toast.success('Pago eliminado');
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pagos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button><Plus className="h-4 w-4 mr-2" />Nuevo Pago</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Pago</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Vehículo</Label>
                <Select items={vehiculoItems} value={form.vehiculo_id} onValueChange={(v) => { if (v) set('vehiculo_id', String(v)); }}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                  <SelectContent>{vehiculos.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.patente} — {v.cliente_nombre}</SelectItem>)}</SelectContent>
                </Select>
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
      <Card><CardContent className="p-6">
        <Table>
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
      </CardContent></Card>
    </div>
  );
}
