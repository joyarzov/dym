import { useEffect, useState, type FormEvent } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import EmailConfigDialog from '@/components/EmailConfigDialog';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function Configuracion() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  useEffect(() => {
    api.get('/configuracion').then((r) => setConfig(r.data));
  }, []);

  function set(key: string, value: string) { setConfig((p) => ({ ...p, [key]: value })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/configuracion', config);
      toast.success('Configuración guardada');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Configuración</h1>
      <Card>
        <CardHeader><CardTitle>Casilla de correo</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Configura la cuenta (Gmail u Outlook) desde la que se envían las cotizaciones.
          </p>
          <Button type="button" variant="outline" onClick={() => setEmailOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Configurar
          </Button>
        </CardContent>
      </Card>

      <EmailConfigDialog open={emailOpen} onOpenChange={setEmailOpen} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Empresa</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre Empresa</Label>
              <Input value={config.empresa_nombre || ''} onChange={(e) => set('empresa_nombre', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Anticipo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto mínimo para anticipo (CLP)</Label>
                <Input type="number" value={config.monto_requiere_anticipo || ''} onChange={(e) => set('monto_requiere_anticipo', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Porcentaje de anticipo (%)</Label>
                <Input type="number" value={config.porcentaje_anticipo || ''} onChange={(e) => set('porcentaje_anticipo', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Semáforo de Entregas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Días restantes para cada color del semáforo</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span>Verde (días mín.)</Label>
                <Input type="number" value={config.semaforo_verde_min || ''} onChange={(e) => set('semaforo_verde_min', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span>Amarillo (días mín.)</Label>
                <Input type="number" value={config.semaforo_amarillo_min || ''} onChange={(e) => set('semaforo_amarillo_min', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span>Naranja (días mín.)</Label>
                <Input type="number" value={config.semaforo_naranja_min || ''} onChange={(e) => set('semaforo_naranja_min', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span>Rojo</Label>
                <Input value="Automático" disabled />
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-2">
              <input type="checkbox" id="semaforo" checked={config.semaforo_activo === '1'} onChange={(e) => set('semaforo_activo', e.target.checked ? '1' : '0')} className="rounded" />
              <Label htmlFor="semaforo">Semáforo activo</Label>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full">{loading ? 'Guardando...' : 'Guardar Configuración'}</Button>
      </form>
    </div>
  );
}
