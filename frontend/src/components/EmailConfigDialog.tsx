import { useEffect, useState, type FormEvent } from 'react';
import api from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Cfg {
  email_provider: string;
  email_user: string;
  email_from_name: string;
  email_host: string;
  email_port: string;
  email_secure: string;
  email_pass_set?: boolean;
}

const EMPTY: Cfg = {
  email_provider: 'gmail',
  email_user: '',
  email_from_name: '',
  email_host: '',
  email_port: '',
  email_secure: '0',
};

export default function EmailConfigDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [cfg, setCfg] = useState<Cfg>(EMPTY);
  const [pass, setPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (open) {
      api.get<Cfg>('/email/config').then((r) => {
        setCfg({ ...EMPTY, ...r.data });
        setPass('');
      });
    }
  }, [open]);

  function set<K extends keyof Cfg>(k: K, v: Cfg[K]) {
    setCfg((p) => ({ ...p, [k]: v }));
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/email/config', { ...cfg, email_pass: pass });
      toast.success('Casilla guardada');
      setPass('');
    } catch {
      toast.error('No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  }

  async function probar() {
    setTesting(true);
    try {
      await api.post('/email/config', { ...cfg, email_pass: pass });
      const { data } = await api.post('/email/test', { to: cfg.email_user });
      toast.success(data.message || 'Correo de prueba enviado');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Falló la prueba de envío';
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  }

  const isCustom = cfg.email_provider !== 'gmail' && cfg.email_provider !== 'outlook';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Casilla de envío</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Proveedor</Label>
            <select
              id="provider"
              value={cfg.email_provider}
              onChange={(e) => set('email_provider', e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="gmail">Gmail</option>
              <option value="outlook">Outlook</option>
              <option value="custom">Otro (SMTP)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="euser">Correo</Label>
            <Input
              id="euser"
              type="email"
              autoComplete="off"
              value={cfg.email_user}
              onChange={(e) => set('email_user', e.target.value)}
              placeholder="taller@gmail.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="epass">Contraseña de aplicación</Label>
            <Input
              id="epass"
              type="password"
              autoComplete="new-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder={cfg.email_pass_set ? '•••••••• (guardada)' : 'Contraseña de aplicación'}
            />
            <p className="text-xs text-muted-foreground">
              Usa una contraseña de aplicación (Gmail/Outlook no aceptan la contraseña normal).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="efrom">Nombre del remitente</Label>
            <Input
              id="efrom"
              value={cfg.email_from_name}
              onChange={(e) => set('email_from_name', e.target.value)}
              placeholder="DyM Taller"
            />
          </div>

          {isCustom && (
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="ehost">Host SMTP</Label>
                <Input id="ehost" value={cfg.email_host} onChange={(e) => set('email_host', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eport">Puerto</Label>
                <Input id="eport" type="number" value={cfg.email_port} onChange={(e) => set('email_port', e.target.value)} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button type="button" variant="outline" onClick={probar} disabled={testing}>
              {testing ? 'Probando…' : 'Probar envío'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
