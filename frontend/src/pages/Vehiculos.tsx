import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import type { Vehiculo } from '@/lib/types';
import { ESTADOS, formatDate, formatMoney } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye } from 'lucide-react';

export default function Vehiculos() {
  const navigate = useNavigate();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');

  function load(q = '', e = '') {
    api.get('/vehiculos', { params: { search: q || undefined, estado: e || undefined } }).then((r) => setVehiculos(r.data));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Vehículos</h1>
        <Link to="/vehiculos/nuevo"><Button><Plus className="h-4 w-4 mr-2" />Nuevo Ingreso</Button></Link>
      </div>
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            <Input placeholder="Buscar por patente, cliente o marca..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load(search, estado)} className="min-w-40 flex-1" />
            <Select
              items={{ todos: 'Todos', ...Object.fromEntries(Object.entries(ESTADOS).map(([k, s]) => [k, s.label])) }}
              value={estado || 'todos'}
              onValueChange={(v) => { const val = (v === 'todos' || !v) ? '' : String(v); setEstado(val); load(search, val); }}
            >
              <SelectTrigger className="w-40 sm:w-48">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {Object.entries(ESTADOS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => load(search, estado)}><Search className="h-4 w-4" /></Button>
          </div>
          <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Patente</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Ingreso</TableHead>
                <TableHead>Presupuesto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehiculos.map((v) => (
                <TableRow
                  key={v.id}
                  onClick={() => navigate(`/vehiculos/${v.id}`)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-bold">{v.patente}</TableCell>
                  <TableCell>{v.cliente_nombre}</TableCell>
                  <TableCell>{v.marca} {v.modelo} {v.anio}</TableCell>
                  <TableCell>{formatDate(v.fecha_ingreso)}</TableCell>
                  <TableCell>{formatMoney(v.presupuesto_estimado)}</TableCell>
                  <TableCell><Badge className={ESTADOS[v.estado].color}>{ESTADOS[v.estado].label}</Badge></TableCell>
                  <TableCell>
                    <Link to={`/vehiculos/${v.id}`}><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></Link>
                  </TableCell>
                </TableRow>
              ))}
              {vehiculos.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No se encontraron vehículos</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
