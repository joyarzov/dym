import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import type { Proveedor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [search, setSearch] = useState('');

  function load(q = '') {
    api.get('/proveedores', { params: { search: q || undefined } }).then((r) => setProveedores(r.data));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    if (!confirm('¿Desactivar este proveedor?')) return;
    await api.delete(`/proveedores/${id}`);
    toast.success('Proveedor desactivado');
    load(search);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Proveedores</h1>
        <Link to="/proveedores/nuevo"><Button><Plus className="h-4 w-4 mr-2" />Nuevo Proveedor</Button></Link>
      </div>
      <Card><CardContent className="p-4 sm:p-6">
        <div className="flex gap-2 mb-4">
          <Input placeholder="Buscar por razón social, RUT o rubro..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load(search)} />
          <Button variant="outline" onClick={() => load(search)}><Search className="h-4 w-4" /></Button>
        </div>
        <div className="overflow-x-auto">
        <Table className="min-w-[720px]">
          <TableHeader><TableRow>
            <TableHead>RUT</TableHead><TableHead>Razón Social</TableHead><TableHead>Contacto</TableHead>
            <TableHead>Teléfono</TableHead><TableHead>Rubro</TableHead><TableHead>Estado</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {proveedores.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono">{p.rut}</TableCell>
                <TableCell className="font-medium">{p.razon_social}</TableCell>
                <TableCell>{p.nombre_contacto}</TableCell>
                <TableCell>{p.telefono}</TableCell>
                <TableCell>{p.rubro}</TableCell>
                <TableCell><Badge variant={p.activo ? 'default' : 'secondary'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge></TableCell>
                <TableCell className="text-right space-x-1">
                  <Link to={`/proveedores/${p.id}/editar`}><Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button></Link>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {!proveedores.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin proveedores</TableCell></TableRow>}
          </TableBody>
        </Table>
        </div>
      </CardContent></Card>
    </div>
  );
}
