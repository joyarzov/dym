import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import type { DashboardData } from '@/lib/types';
import { ESTADOS, formatMoney, formatDate } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Car, Flag, Coins, AlertTriangle, Plus, Eye } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get('/dashboard').then((r) => setData(r.data));
  }, []);

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 animate-pulse rounded-xl bg-muted lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Vehículos en taller', value: data.enTaller, icon: Car, color: 'text-info' },
    { label: 'Listos para entrega', value: data.listos, icon: Flag, color: 'text-success' },
    { label: 'Ingresos del mes', value: formatMoney(data.ingresosMes), icon: Coins, color: 'text-primary' },
    { label: 'Pendiente de cobro', value: formatMoney(data.pendienteCobro), icon: AlertTriangle, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link to="/vehiculos/nuevo">
          <Button><Plus className="h-4 w-4 mr-2" />Nuevo Ingreso</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="transition-colors hover:ring-foreground/20">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-2xl font-semibold tabular-nums tracking-tight">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Vehículos en Taller</h2>
                <Link to="/vehiculos"><Button variant="outline" size="sm">Ver todos</Button></Link>
              </div>
              {data.recientes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay vehículos en el taller</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patente</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vehículo</TableHead>
                      <TableHead>Ingreso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recientes.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-bold">{v.patente}</TableCell>
                        <TableCell>{v.cliente_nombre}</TableCell>
                        <TableCell>{v.marca} {v.modelo}</TableCell>
                        <TableCell>{formatDate(v.fecha_ingreso)}</TableCell>
                        <TableCell>
                          <Badge className={ESTADOS[v.estado].color}>{ESTADOS[v.estado].label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Link to={`/vehiculos/${v.id}`}>
                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Distribución por Estado</h2>
              {data.porEstado.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Sin datos</p>
              ) : (
                <div className="space-y-3">
                  {data.porEstado.map((e) => (
                    <div key={e.estado} className="flex items-center justify-between">
                      <Badge className={ESTADOS[e.estado].color}>{ESTADOS[e.estado].label}</Badge>
                      <span className="font-bold">{e.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-2">
              <h2 className="text-lg font-semibold mb-4">Accesos Rápidos</h2>
              <Link to="/vehiculos/nuevo" className="block">
                <Button variant="outline" className="w-full justify-start"><Plus className="h-4 w-4 mr-2" />Ingresar Vehículo</Button>
              </Link>
              <Link to="/pagos" className="block">
                <Button variant="outline" className="w-full justify-start"><Coins className="h-4 w-4 mr-2" />Registrar Pago</Button>
              </Link>
              <Link to="/reportes" className="block">
                <Button variant="outline" className="w-full justify-start"><Flag className="h-4 w-4 mr-2" />Ver Reportes</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
