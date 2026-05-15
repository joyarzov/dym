import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import type { Cliente } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const initial = {
  cliente_id: '', patente: '', marca: '', modelo: '', anio: '', color: '',
  fecha_ingreso: new Date().toISOString().split('T')[0], fecha_estimada_entrega: '',
  estado: 'recibido', tiene_seguro: false, aseguradora: '', numero_poliza: '',
  numero_siniestro: '', nombre_ajustador: '', telefono_ajustador: '',
  presupuesto_estimado: '', diagnostico: '', observaciones: '',
};

export default function VehiculoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<Record<string, unknown>>(initial);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/clientes').then((r) => setClientes(r.data));
    if (id) api.get(`/vehiculos/${id}`).then((r) => {
      const d = r.data;
      setForm({
        ...d,
        tiene_seguro: Boolean(d.tiene_seguro),
        fecha_ingreso: d.fecha_ingreso?.split('T')[0] || '',
        fecha_estimada_entrega: d.fecha_estimada_entrega?.split('T')[0] || '',
      });
    });
  }, [id]);

  function set(field: string, value: unknown) { setForm((p) => ({ ...p, [field]: value })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) await api.put(`/vehiculos/${id}`, form);
      else {
        const res = await api.post('/vehiculos', form);
        navigate(`/vehiculos/${res.data.id}`);
        toast.success('Vehículo ingresado');
        return;
      }
      toast.success('Vehículo actualizado');
      navigate(`/vehiculos/${id}`);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader><CardTitle>{isEdit ? 'Editar Vehículo' : 'Nuevo Ingreso'}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Datos del Vehículo</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select value={String(form.cliente_id)} onValueChange={(v) => { if (v) set('cliente_id', v); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar...">
                        {form.cliente_id ? (() => { const c = clientes.find((c) => String(c.id) === String(form.cliente_id)); return c ? `${c.nombre} (${c.rut})` : 'Seleccionar...'; })() : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.nombre} ({c.rut})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Patente *</Label><Input value={String(form.patente)} onChange={(e) => set('patente', e.target.value.toUpperCase())} required /></div>
                <div className="space-y-2"><Label>Marca *</Label><Input value={String(form.marca)} onChange={(e) => set('marca', e.target.value)} required /></div>
                <div className="space-y-2"><Label>Modelo *</Label><Input value={String(form.modelo)} onChange={(e) => set('modelo', e.target.value)} required /></div>
                <div className="space-y-2"><Label>Año</Label><Input type="number" value={String(form.anio)} onChange={(e) => set('anio', e.target.value)} /></div>
                <div className="space-y-2"><Label>Color</Label><Input value={String(form.color)} onChange={(e) => set('color', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Fecha Ingreso *</Label><Input type="date" value={String(form.fecha_ingreso)} onChange={(e) => set('fecha_ingreso', e.target.value)} required /></div>
                <div className="space-y-2"><Label>Fecha Estimada Entrega</Label><Input type="date" value={String(form.fecha_estimada_entrega)} onChange={(e) => set('fecha_estimada_entrega', e.target.value)} /></div>
                <div className="space-y-2"><Label>Presupuesto</Label><Input type="number" value={String(form.presupuesto_estimado)} onChange={(e) => set('presupuesto_estimado', e.target.value)} /></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="seguro" checked={Boolean(form.tiene_seguro)} onChange={(e) => set('tiene_seguro', e.target.checked)} className="rounded" />
                <Label htmlFor="seguro">Tiene Seguro</Label>
              </div>
              {Boolean(form.tiene_seguro) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Aseguradora</Label><Input value={String(form.aseguradora || '')} onChange={(e) => set('aseguradora', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Nº Póliza</Label><Input value={String(form.numero_poliza || '')} onChange={(e) => set('numero_poliza', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Nº Siniestro</Label><Input value={String(form.numero_siniestro || '')} onChange={(e) => set('numero_siniestro', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Ajustador</Label><Input value={String(form.nombre_ajustador || '')} onChange={(e) => set('nombre_ajustador', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Tel. Ajustador</Label><Input value={String(form.telefono_ajustador || '')} onChange={(e) => set('telefono_ajustador', e.target.value)} /></div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Diagnóstico</Label><Textarea value={String(form.diagnostico || '')} onChange={(e) => set('diagnostico', e.target.value)} rows={3} /></div>
              <div className="space-y-2"><Label>Observaciones</Label><Textarea value={String(form.observaciones || '')} onChange={(e) => set('observaciones', e.target.value)} rows={3} /></div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
              <Button type="button" variant="outline" onClick={() => navigate('/vehiculos')}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
