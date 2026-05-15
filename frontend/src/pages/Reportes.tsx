import { useState } from 'react';
import api from '@/lib/api';
import type { Pago, Vehiculo } from '@/lib/types';
import { formatMoney, formatDate, ESTADOS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

export default function Reportes() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [resumen, setResumen] = useState<{ ingresos: { mes: string; total: number }[]; vehiculosMes: { mes: string; total: number }[] } | null>(null);

  async function buscarIngresos() {
    const { data } = await api.get('/reportes/ingresos', { params: { desde, hasta } });
    setPagos(data.pagos);
    setTotalIngresos(data.total);
  }

  async function buscarVehiculos() {
    const { data } = await api.get('/reportes/vehiculos', { params: { desde, hasta } });
    setVehiculos(data);
  }

  async function cargarResumen() {
    const { data } = await api.get('/reportes/resumen-mensual');
    setResumen(data);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reportes</h1>
      <div className="flex gap-4 items-end">
        <div className="space-y-2"><Label>Desde</Label><Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
        <div className="space-y-2"><Label>Hasta</Label><Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
      </div>

      <Tabs defaultValue="ingresos" onValueChange={(v) => { if (v === 'resumen') cargarResumen(); }}>
        <TabsList>
          <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
          <TabsTrigger value="vehiculos">Vehículos</TabsTrigger>
          <TabsTrigger value="resumen">Resumen Mensual</TabsTrigger>
        </TabsList>

        <TabsContent value="ingresos">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle>Reporte de Ingresos</CardTitle>
              <Button onClick={buscarIngresos}><Search className="h-4 w-4 mr-2" />Buscar</Button>
            </CardHeader>
            <CardContent>
              {pagos.length > 0 && <p className="text-right mb-4 text-lg font-bold">Total: {formatMoney(totalIngresos)}</p>}
              <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader><TableRow>
                  <TableHead>Fecha</TableHead><TableHead>Patente</TableHead><TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead><TableHead>Método</TableHead><TableHead>Monto</TableHead>
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
                    </TableRow>
                  ))}
                  {!pagos.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin resultados</TableCell></TableRow>}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehiculos">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle>Reporte de Vehículos</CardTitle>
              <Button onClick={buscarVehiculos}><Search className="h-4 w-4 mr-2" />Buscar</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader><TableRow>
                  <TableHead>Patente</TableHead><TableHead>Cliente</TableHead><TableHead>Vehículo</TableHead>
                  <TableHead>Ingreso</TableHead><TableHead>Presupuesto</TableHead><TableHead>Estado</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {vehiculos.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-bold">{v.patente}</TableCell>
                      <TableCell>{v.cliente_nombre}</TableCell>
                      <TableCell>{v.marca} {v.modelo}</TableCell>
                      <TableCell>{formatDate(v.fecha_ingreso)}</TableCell>
                      <TableCell>{formatMoney(v.presupuesto_estimado)}</TableCell>
                      <TableCell><Badge className={ESTADOS[v.estado].color}>{ESTADOS[v.estado].label}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {!vehiculos.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin resultados</TableCell></TableRow>}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resumen">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Ingresos por Mes</CardTitle></CardHeader>
              <CardContent>
                {resumen?.ingresos.map((r) => (
                  <div key={r.mes} className="flex justify-between py-2 border-b border-border">
                    <span>{r.mes}</span><span className="font-bold">{formatMoney(r.total)}</span>
                  </div>
                ))}
                {!resumen?.ingresos.length && <p className="text-muted-foreground text-center py-4">Sin datos</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Vehículos por Mes</CardTitle></CardHeader>
              <CardContent>
                {resumen?.vehiculosMes.map((r) => (
                  <div key={r.mes} className="flex justify-between py-2 border-b border-border">
                    <span>{r.mes}</span><span className="font-bold">{r.total}</span>
                  </div>
                ))}
                {!resumen?.vehiculosMes.length && <p className="text-muted-foreground text-center py-4">Sin datos</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
