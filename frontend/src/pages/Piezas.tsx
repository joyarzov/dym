import { useEffect, useState, type FormEvent } from 'react';
import api from '@/lib/api';
import type { Pieza, Vehiculo, Proveedor } from '@/lib/types';
import { formatMoney } from '@/lib/types';
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

const empty = { vehiculo_id: '', proveedor_id: '', nombre_pieza: '', tipo_trabajo: 'reparacion', descripcion: '', cantidad: '1', costo_unitario: '0', fecha_inicio: '' };

export default function Piezas() {
  const [piezas, setPiezas] = useState<Pieza[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [form, setForm] = useState<Record<string, string>>(empty);
  const [open, setOpen] = useState(false);

  function load() { api.get('/piezas').then((r) => setPiezas(r.data)); }

  useEffect(() => {
    load();
    api.get('/vehiculos').then((r) => setVehiculos(r.data));
    api.get('/proveedores').then((r) => setProveedores(r.data));
  }, []);

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await api.post('/piezas', form);
    toast.success('Pieza creada');
    setForm(empty);
    setOpen(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar pieza?')) return;
    await api.delete(`/piezas/${id}`);
    toast.success('Pieza eliminada');
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Piezas</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button><Plus className="h-4 w-4 mr-2" />Nueva Pieza</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva Pieza</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Vehículo</Label>
                <Select value={form.vehiculo_id} onValueChange={(v) => { if (v) set('vehiculo_id', v); }}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>{vehiculos.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.patente} - {v.marca} {v.modelo}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Nombre Pieza</Label><Input value={form.nombre_pieza} onChange={(e) => set('nombre_pieza', e.target.value)} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Tipo Trabajo</Label>
                  <Select value={form.tipo_trabajo} onValueChange={(v) => { if (v) set('tipo_trabajo', v); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reparacion">Reparación</SelectItem>
                      <SelectItem value="reemplazo">Reemplazo</SelectItem>
                      <SelectItem value="pintura">Pintura</SelectItem>
                      <SelectItem value="desabolladura">Desabolladura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Proveedor</Label>
                  <Select value={form.proveedor_id} onValueChange={(v) => { if (v) set('proveedor_id', v); }}>
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>{proveedores.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.razon_social}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Cantidad</Label><Input type="number" value={form.cantidad} onChange={(e) => set('cantidad', e.target.value)} /></div>
                <div className="space-y-2"><Label>Costo Unitario</Label><Input type="number" value={form.costo_unitario} onChange={(e) => set('costo_unitario', e.target.value)} /></div>
              </div>
              <Button type="submit" className="w-full">Guardar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="p-6">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Pieza</TableHead><TableHead>Vehículo</TableHead><TableHead>Tipo</TableHead>
            <TableHead>Cant.</TableHead><TableHead>Costo Total</TableHead><TableHead>Proveedor</TableHead>
            <TableHead>Estado</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {piezas.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nombre_pieza}</TableCell>
                <TableCell>{p.vehiculo_id}</TableCell>
                <TableCell>{p.tipo_trabajo}</TableCell>
                <TableCell>{p.cantidad}</TableCell>
                <TableCell>{formatMoney(p.costo_total)}</TableCell>
                <TableCell>{p.proveedor_nombre || '-'}</TableCell>
                <TableCell><Badge variant="outline">{p.estado}</Badge></TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
            {!piezas.length && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Sin piezas</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
