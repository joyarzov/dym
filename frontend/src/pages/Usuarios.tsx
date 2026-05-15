import { useEffect, useState, Fragment, type FormEvent } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Usuario, Rol } from '@/lib/types';
import { ROL_LABEL } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { UserPlus, X } from 'lucide-react';

const EMPTY = { username: '', password: '', nombre_completo: '', email: '', rol: 'admin' as Rol };

export default function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [pwUser, setPwUser] = useState<number | null>(null);
  const [pwValue, setPwValue] = useState('');

  function load() {
    api.get<Usuario[]>('/usuarios').then((r) => setUsuarios(r.data));
  }
  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/usuarios', form);
      toast.success('Usuario creado');
      setForm(EMPTY);
      setOpen(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'No se pudo crear el usuario';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: FormEvent, u: Usuario) {
    e.preventDefault();
    if (pwValue.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    try {
      await api.patch(`/usuarios/${u.id}`, { password: pwValue });
      toast.success(`Contraseña de ${u.username} actualizada`);
      setPwUser(null);
      setPwValue('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'No se pudo cambiar la contraseña';
      toast.error(msg);
    }
  }

  async function toggleActivo(u: Usuario) {
    try {
      await api.patch(`/usuarios/${u.id}`, { activo: u.activo ? 0 : 1 });
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'No se pudo actualizar';
      toast.error(msg);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra el acceso al sistema. Solo el superusuario puede crear cuentas.
          </p>
        </div>
        <Button onClick={() => setOpen((v) => !v)}>
          {open ? <X className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
          {open ? 'Cancelar' : 'Nuevo usuario'}
        </Button>
      </div>

      {open && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input id="nombre" value={form.nombre_completo} onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input id="username" autoComplete="off" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rol">Rol</Label>
                <select
                  id="rol"
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}
                  className="h-9 w-full rounded-lg border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="admin">Administrador</option>
                  <option value="superusuario">Superusuario</option>
                </select>
              </div>
              <div className="flex items-end md:col-span-2">
                <Button type="submit" disabled={saving} className="w-full md:w-auto">
                  {saving ? 'Creando…' : 'Crear usuario'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {usuarios === null ? (
            <div className="space-y-2 p-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : usuarios.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No hay usuarios registrados</p>
          ) : (
            <div className="overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((u) => (
                  <Fragment key={u.id}>
                  <TableRow>
                    <TableCell className="font-medium">{u.nombre_completo}</TableCell>
                    <TableCell className="text-muted-foreground">{u.username}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email || '—'}</TableCell>
                    <TableCell>
                      <Badge className={u.rol === 'superusuario' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}>
                        {ROL_LABEL[u.rol]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.activo ? (
                        <span className="text-sm text-success">Activo</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Inactivo</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPwUser(pwUser === u.id ? null : u.id);
                          setPwValue('');
                        }}
                      >
                        Contraseña
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={u.id === user?.id}
                        onClick={() => toggleActivo(u)}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {pwUser === u.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/40">
                        <form onSubmit={(e) => changePassword(e, u)} className="flex flex-wrap items-end gap-3 py-1">
                          <div className="min-w-56 flex-1 space-y-1">
                            <Label htmlFor={`pw-${u.id}`}>Nueva contraseña para {u.nombre_completo}</Label>
                            <Input
                              id={`pw-${u.id}`}
                              type="text"
                              autoComplete="new-password"
                              value={pwValue}
                              onChange={(e) => setPwValue(e.target.value)}
                              placeholder="Mínimo 6 caracteres"
                            />
                          </div>
                          <Button type="submit">Guardar contraseña</Button>
                          <Button type="button" variant="ghost" onClick={() => setPwUser(null)}>Cancelar</Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
