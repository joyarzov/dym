import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ProveedorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ rut: '', razon_social: '', nombre_contacto: '', telefono: '', email: '', direccion: '', rubro: '', notas: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) api.get(`/proveedores/${id}`).then((r) => setForm(r.data));
  }, [id]);

  function set(field: string, value: string) { setForm((p) => ({ ...p, [field]: value })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) await api.put(`/proveedores/${id}`, form);
      else await api.post('/proveedores', form);
      toast.success(isEdit ? 'Proveedor actualizado' : 'Proveedor creado');
      navigate('/proveedores');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader><CardTitle>{isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>RUT</Label><Input value={form.rut} onChange={(e) => set('rut', e.target.value)} /></div>
              <div className="space-y-2"><Label>Razón Social *</Label><Input value={form.razon_social} onChange={(e) => set('razon_social', e.target.value)} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Contacto</Label><Input value={form.nombre_contacto} onChange={(e) => set('nombre_contacto', e.target.value)} /></div>
              <div className="space-y-2"><Label>Teléfono</Label><Input value={form.telefono} onChange={(e) => set('telefono', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
              <div className="space-y-2"><Label>Rubro</Label><Input value={form.rubro} onChange={(e) => set('rubro', e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Dirección</Label><Textarea value={form.direccion} onChange={(e) => set('direccion', e.target.value)} /></div>
            <div className="space-y-2"><Label>Notas</Label><Textarea value={form.notas} onChange={(e) => set('notas', e.target.value)} /></div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
              <Button type="button" variant="outline" onClick={() => navigate('/proveedores')}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
