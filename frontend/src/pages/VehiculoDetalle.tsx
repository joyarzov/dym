import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import type { Vehiculo } from '@/lib/types';
import { ESTADOS, formatMoney, formatDate } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, ArrowLeft, ImageIcon, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function VehiculoDetalle() {
  const { id } = useParams();
  const [v, setV] = useState<Vehiculo | null>(null);

  function load() {
    api.get(`/vehiculos/${id}`).then((r) => setV(r.data));
  }

  useEffect(() => { load(); }, [id]);

  async function cambiarEstado(estado: string | null) {
    if (!estado) return;
    await api.patch(`/vehiculos/${id}/estado`, { estado });
    toast.success('Estado actualizado');
    load();
  }

  async function subirFotos(files: FileList | null, tipo: string) {
    if (!files?.length) return;
    const fd = new FormData();
    fd.append('tipo', tipo);
    Array.from(files).forEach((f) => fd.append('fotos', f));
    await api.post(`/vehiculos/${id}/fotos`, fd);
    toast.success('Fotos subidas');
    load();
  }

  async function eliminarFoto(fotoId: number) {
    await api.delete(`/vehiculos/${id}/fotos/${fotoId}`);
    toast.success('Foto eliminada');
    load();
  }

  if (!v) return <div className="text-center py-10 text-muted-foreground">Cargando...</div>;

  const saldo = v.presupuesto_estimado - (v.totalPagado || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/vehiculos"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold">{v.patente} - {v.marca} {v.modelo}</h1>
            <p className="text-muted-foreground">{v.cliente_nombre} | Ingreso: {formatDate(v.fecha_ingreso)}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Select
            items={Object.fromEntries(Object.entries(ESTADOS).map(([k, s]) => [k, s.label]))}
            value={v.estado}
            onValueChange={(val) => cambiarEstado(val as string)}
          >
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(ESTADOS).map(([k, s]) => <SelectItem key={k} value={k}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
          <Link to={`/vehiculos/${id}/cotizacion`}><Button variant="outline"><FileText className="h-4 w-4 mr-2" />Cotización</Button></Link>
          <Link to={`/vehiculos/${id}/editar`}><Button variant="outline"><Pencil className="h-4 w-4 mr-2" />Editar</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Estado</p><Badge className={`mt-1 ${ESTADOS[v.estado].color}`}>{ESTADOS[v.estado].label}</Badge></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Presupuesto</p><p className="text-xl font-bold">{formatMoney(v.presupuesto_estimado)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Saldo Pendiente</p><p className={`text-xl font-bold ${saldo > 0 ? 'text-red-400' : 'text-green-400'}`}>{formatMoney(saldo)}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="piezas">Piezas ({v.piezas?.length || 0})</TabsTrigger>
          <TabsTrigger value="pagos">Pagos ({v.pagos?.length || 0})</TabsTrigger>
          <TabsTrigger value="fotos">Fotos ({v.fotos?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardContent className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">Año:</span> {v.anio || '-'}</div>
              <div><span className="text-muted-foreground">Color:</span> {v.color || '-'}</div>
              <div><span className="text-muted-foreground">Entrega estimada:</span> {formatDate(v.fecha_estimada_entrega)}</div>
              <div><span className="text-muted-foreground">Cliente:</span> {v.cliente_nombre}</div>
              <div><span className="text-muted-foreground">RUT:</span> {v.cliente_rut}</div>
              <div><span className="text-muted-foreground">Teléfono:</span> {v.cliente_telefono}</div>
              {v.tiene_seguro ? (
                <>
                  <Separator className="col-span-full" />
                  <div><span className="text-muted-foreground">Aseguradora:</span> {v.aseguradora}</div>
                  <div><span className="text-muted-foreground">Póliza:</span> {v.numero_poliza}</div>
                  <div><span className="text-muted-foreground">Siniestro:</span> {v.numero_siniestro}</div>
                </>
              ) : null}
              {v.diagnostico && <div className="col-span-full"><span className="text-muted-foreground">Diagnóstico:</span><p className="mt-1">{v.diagnostico}</p></div>}
              {v.observaciones && <div className="col-span-full"><span className="text-muted-foreground">Observaciones:</span><p className="mt-1">{v.observaciones}</p></div>}
              {v.requiere_anticipo ? (
                <div className="col-span-full">
                  <Badge variant={v.anticipo_pagado ? 'default' : 'destructive'}>
                    Anticipo {formatMoney(v.monto_anticipo)} — {v.anticipo_pagado ? 'Pagado' : 'Pendiente'}
                  </Badge>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="piezas">
          <Card><CardContent className="p-6">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Pieza</TableHead><TableHead>Tipo</TableHead><TableHead>Cant.</TableHead>
                <TableHead>Costo</TableHead><TableHead>Proveedor</TableHead><TableHead>Estado</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {v.piezas?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nombre_pieza}</TableCell>
                    <TableCell>{p.tipo_trabajo}</TableCell>
                    <TableCell>{p.cantidad}</TableCell>
                    <TableCell>{formatMoney(p.costo_total)}</TableCell>
                    <TableCell>{p.proveedor_nombre || '-'}</TableCell>
                    <TableCell><Badge variant="outline">{p.estado}</Badge></TableCell>
                  </TableRow>
                ))}
                {!v.piezas?.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-4">Sin piezas registradas</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="pagos">
          <Card><CardContent className="p-6">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Fecha</TableHead><TableHead>Tipo</TableHead><TableHead>Método</TableHead>
                <TableHead>Monto</TableHead><TableHead>Referencia</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {v.pagos?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.fecha_pago)}</TableCell>
                    <TableCell><Badge variant="outline">{p.tipo}</Badge></TableCell>
                    <TableCell>{p.metodo_pago.replace('_', ' ')}</TableCell>
                    <TableCell className="font-bold">{formatMoney(p.monto)}</TableCell>
                    <TableCell>{p.referencia || '-'}</TableCell>
                  </TableRow>
                ))}
                {!v.pagos?.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">Sin pagos registrados</TableCell></TableRow>}
              </TableBody>
            </Table>
            <p className="text-right mt-4 font-bold">Total pagado: {formatMoney(v.totalPagado || 0)}</p>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="fotos">
          <Card><CardContent className="p-6">
            <div className="flex gap-4 mb-4">
              {(['ingreso', 'proceso', 'entrega'] as const).map((tipo) => (
                <label key={tipo} className="cursor-pointer">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
                    <ImageIcon className="h-4 w-4" />Subir {tipo}
                  </span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => subirFotos(e.target.files, tipo)} />
                </label>
              ))}
            </div>
            {v.fotos?.length ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {v.fotos.map((f) => (
                  <div key={f.id} className="relative group">
                    <img src={f.ruta_foto} alt={f.descripcion} className="rounded-lg w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button variant="destructive" size="sm" onClick={() => eliminarFoto(f.id)}>Eliminar</Button>
                    </div>
                    <Badge className="absolute bottom-2 left-2" variant="outline">{f.tipo}</Badge>
                  </div>
                ))}
              </div>
            ) : <p className="text-center text-muted-foreground py-4">Sin fotos</p>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
