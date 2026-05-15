import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import type { Vehiculo } from '@/lib/types';
import { ESTADOS, formatMoney, formatDate } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, ArrowLeft, ImageIcon, FileText, RotateCcw, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function VehiculoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [v, setV] = useState<Vehiculo | null>(null);

  function load() {
    api.get(`/vehiculos/${id}`).then((r) => setV(r.data));
  }

  useEffect(() => { load(); }, [id]);

  const [pendEstado, setPendEstado] = useState<string | null>(null);

  async function confirmarCambioEstado() {
    if (!pendEstado) return;
    try {
      await api.patch(`/vehiculos/${id}/estado`, { estado: pendEstado });
      toast.success('Estado actualizado');
      load();
    } catch {
      toast.error('No se pudo cambiar el estado');
    } finally {
      setPendEstado(null);
    }
  }

  const pagoVacio = {
    monto: '', metodo_pago: 'transferencia', tipo: 'abono',
    referencia: '', fecha_pago: new Date().toISOString().split('T')[0],
  };
  const [pagoOpen, setPagoOpen] = useState(false);
  const [pagoForm, setPagoForm] = useState(pagoVacio);
  const [pagoConfirm, setPagoConfirm] = useState(false);

  const saldo = (Number(v?.presupuesto_estimado) || 0) - (Number(v?.totalPagado) || 0);

  function setPF(k: string, val: string) { setPagoForm((p) => ({ ...p, [k]: val })); }

  async function doRegistrarPago() {
    try {
      await api.post('/pagos', { ...pagoForm, vehiculo_id: id });
      toast.success('Pago registrado');
      setPagoForm(pagoVacio);
      setPagoOpen(false);
      setPagoConfirm(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'No se pudo registrar el pago';
      toast.error(msg);
    }
  }

  function submitPago(e: FormEvent) {
    e.preventDefault();
    if (!pagoForm.monto || Number(pagoForm.monto) <= 0) { toast.error('Indica el monto'); return; }
    if (Number(pagoForm.monto) > saldo) { setPagoConfirm(true); return; }
    doRegistrarPago();
  }

  async function reingresar() {
    if (!confirm('¿Crear una nueva orden de trabajo (reingreso) para esta patente? Las visitas anteriores quedan en el historial.')) return;
    try {
      const { data } = await api.post(`/vehiculos/${id}/reingreso`);
      toast.success('Reingreso creado');
      navigate(`/vehiculos/${data.id}/editar`);
    } catch {
      toast.error('No se pudo crear el reingreso');
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Link to="/vehiculos"><Button variant="ghost" size="icon" aria-label="Volver"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold sm:text-2xl">{v.patente} · {v.marca} {v.modelo}</h1>
              <Badge variant="outline" className="font-mono">OT N° {String(v.id).padStart(5, '0')}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{v.cliente_nombre} · Ingreso {formatDate(v.fecha_ingreso)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            items={Object.fromEntries(Object.entries(ESTADOS).map(([k, s]) => [k, s.label]))}
            value={v.estado}
            onValueChange={(val) => { if (val && val !== v.estado) setPendEstado(val as string); }}
          >
            <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(ESTADOS).map(([k, s]) => <SelectItem key={k} value={k}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={reingresar}><RotateCcw className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Reingresar</span></Button>
          <Link to={`/vehiculos/${id}/cotizacion`}><Button variant="outline"><FileText className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Cotización</span></Button></Link>
          <Link to={`/vehiculos/${id}/editar`}><Button variant="outline"><Pencil className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Editar</span></Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Estado</p><Badge className={`mt-1 ${ESTADOS[v.estado].color}`}>{ESTADOS[v.estado].label}</Badge></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Presupuesto (cotización c/IVA)</p><p className="text-xl font-bold">{formatMoney(v.presupuesto_estimado)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Saldo Pendiente</p><p className={`text-xl font-bold ${saldo > 0 ? 'text-red-400' : 'text-green-400'}`}>{formatMoney(saldo)}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="piezas">Piezas y servicios ({(v.piezas?.length || 0) + (v.manoObra?.length || 0)})</TabsTrigger>
          <TabsTrigger value="pagos">Pagos ({v.pagos?.length || 0})</TabsTrigger>
          <TabsTrigger value="fotos">Fotos ({v.fotos?.length || 0})</TabsTrigger>
          <TabsTrigger value="historial">Historial ({v.historial?.length || 0})</TabsTrigger>
          <TabsTrigger value="trazabilidad">Trazabilidad</TabsTrigger>
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
          <Card><CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">Detalle de la cotización de esta orden de trabajo.</p>
              <Link to={`/vehiculos/${id}/cotizacion`}>
                <Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" />Ver / editar cotización</Button>
              </Link>
            </div>
            {(() => {
              const piezas = v.piezas || [];
              const servicios = v.manoObra || [];
              const subPiezas = piezas.reduce((s, p) => s + Number(p.costo_total || 0), 0);
              const subServ = servicios.reduce((s, m) => s + Number(m.valor || 0), 0);
              const neto = subPiezas + subServ;
              const iva = Math.round(neto * 0.19);
              const total = neto + iva;
              if (!piezas.length && !servicios.length) {
                return <p className="py-6 text-center text-muted-foreground">Sin ítems en la cotización</p>;
              }
              return (
                <div className="overflow-x-auto">
                  <Table className="min-w-[640px]">
                    <TableHeader><TableRow>
                      <TableHead>Ítem</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Cant.</TableHead>
                      <TableHead className="text-right">Valor unit.</TableHead><TableHead className="text-right">Total</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {piezas.map((p) => (
                        <TableRow key={`p-${p.id}`}>
                          <TableCell className="font-medium">{p.nombre_pieza}</TableCell>
                          <TableCell><Badge variant="outline">{p.tipo_trabajo}</Badge></TableCell>
                          <TableCell className="text-right tabular-nums">{p.cantidad}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatMoney(p.costo_unitario)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatMoney(p.costo_total)}</TableCell>
                        </TableRow>
                      ))}
                      {servicios.map((m) => (
                        <TableRow key={`m-${m.id}`}>
                          <TableCell className="font-medium">{m.descripcion}</TableCell>
                          <TableCell><Badge variant="outline">Servicio / mano de obra</Badge></TableCell>
                          <TableCell className="text-right tabular-nums">1</TableCell>
                          <TableCell className="text-right tabular-nums">{formatMoney(m.valor)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatMoney(m.valor)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 flex justify-end">
                    <div className="w-full max-w-xs space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal piezas</span><span className="tabular-nums">{formatMoney(subPiezas)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal servicios</span><span className="tabular-nums">{formatMoney(subServ)}</span></div>
                      <div className="flex justify-between border-t border-border pt-1.5"><span className="text-muted-foreground">Neto</span><span className="tabular-nums">{formatMoney(neto)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">IVA (19%)</span><span className="tabular-nums">{formatMoney(iva)}</span></div>
                      <div className="flex justify-between border-t border-border pt-1.5 text-base font-semibold"><span>Total (= presupuesto)</span><span className="tabular-nums">{formatMoney(total)}</span></div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="pagos">
          <Card><CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Saldo: </span>
                <span className={`font-semibold tabular-nums ${saldo > 0 ? 'text-destructive' : 'text-success'}`}>{formatMoney(saldo)}</span>
              </div>
              <Button size="sm" onClick={() => { setPagoForm(pagoVacio); setPagoOpen(true); }}>
                <DollarSign className="mr-2 h-4 w-4" />Registrar pago
              </Button>
            </div>
            <div className="overflow-x-auto">
            <Table className="min-w-[560px]">
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
            </div>
            <p className="text-right mt-4 font-bold">Total pagado: {formatMoney(v.totalPagado || 0)}</p>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="fotos">
          <div className="space-y-4">
            {([
              { tipo: 'ingreso', label: 'Fotos de ingreso' },
              { tipo: 'proceso', label: 'Fotos de proceso' },
              { tipo: 'entrega', label: 'Fotos de entrega' },
            ] as const).map(({ tipo, label }) => {
              const fotos = v.fotos?.filter((f) => f.tipo === tipo) || [];
              return (
                <Card key={tipo}><CardContent className="p-4 sm:p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold">{label} <span className="text-muted-foreground">({fotos.length})</span></h3>
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted">
                        <ImageIcon className="h-4 w-4" />Subir
                      </span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => subirFotos(e.target.files, tipo)} />
                    </label>
                  </div>
                  {fotos.length ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                      {fotos.map((f) => (
                        <div key={f.id} className="group relative overflow-hidden rounded-lg border border-border bg-muted">
                          <a href={f.ruta_foto} target="_blank" rel="noopener noreferrer" title="Ver foto completa">
                            <img
                              src={f.ruta_foto}
                              alt={f.descripcion || label}
                              loading="lazy"
                              className="h-48 w-full object-contain"
                            />
                          </a>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => eliminarFoto(f.id)}
                            className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            Eliminar
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-6 text-center text-sm text-muted-foreground">Sin {label.toLowerCase()}</p>
                  )}
                </CardContent></Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="historial">
          <Card><CardContent className="p-4 sm:p-6">
            <p className="mb-4 text-sm text-muted-foreground">
              Órdenes de trabajo registradas para la patente <span className="font-medium text-foreground">{v.patente}</span>.
            </p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>OT</TableHead><TableHead>Ingreso</TableHead><TableHead>Entrega</TableHead>
                  <TableHead>Estado</TableHead><TableHead>Presupuesto</TableHead><TableHead>Pagado</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {v.historial?.map((o) => (
                    <TableRow key={o.id} className={o.id === v.id ? 'bg-primary/5' : ''}>
                      <TableCell className="font-mono">
                        {String(o.id).padStart(5, '0')}{o.id === v.id && <span className="ml-2 text-xs text-primary">(actual)</span>}
                      </TableCell>
                      <TableCell>{formatDate(o.fecha_ingreso)}</TableCell>
                      <TableCell>{formatDate(o.fecha_entrega_real)}</TableCell>
                      <TableCell><Badge className={ESTADOS[o.estado].color}>{ESTADOS[o.estado].label}</Badge></TableCell>
                      <TableCell className="tabular-nums">{formatMoney(o.presupuesto_estimado)}</TableCell>
                      <TableCell className="tabular-nums">{formatMoney(o.pagado)}</TableCell>
                      <TableCell>
                        {o.id !== v.id && (
                          <Link to={`/vehiculos/${o.id}`}>
                            <Button variant="ghost" size="sm">Ver</Button>
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!v.historial?.length && (
                    <TableRow><TableCell colSpan={7} className="py-4 text-center text-muted-foreground">Sin historial</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="trazabilidad">
          <Card><CardContent className="p-4 sm:p-6">
            {!v.trazabilidad?.length ? (
              <p className="py-6 text-center text-muted-foreground">
                Aún no hay cambios de estado registrados para esta OT.
              </p>
            ) : (
              <ol className="relative space-y-6 border-l border-border pl-6">
                {v.trazabilidad.map((t, i) => (
                  <li key={i} className="relative">
                    <span className={`absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-background ${ESTADOS[t.estado].color}`} />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={ESTADOS[t.estado].color}>{ESTADOS[t.estado].label}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(String(t.created_at).replace(' ', 'T')).toLocaleString('es-CL')}
                      </span>
                    </div>
                    {t.usuario && <p className="mt-1 text-xs text-muted-foreground">por {t.usuario}</p>}
                  </li>
                ))}
              </ol>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(pendEstado)} onOpenChange={(o) => { if (!o) setPendEstado(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar cambio de estado</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            ¿Está seguro que desea cambiar el estado de <span className="font-semibold">{v.patente}</span> a{' '}
            <span className="font-semibold">«{pendEstado ? ESTADOS[pendEstado as keyof typeof ESTADOS].label : ''}»</span>?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setPendEstado(null)}>No</Button>
            <Button onClick={confirmarCambioEstado}>Sí, cambiar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pagoOpen} onOpenChange={setPagoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Registrar pago · OT {String(v.id).padStart(5, '0')}</DialogTitle></DialogHeader>
          <form onSubmit={submitPago} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {v.patente} · {v.cliente_nombre} · saldo{' '}
              <span className={saldo > 0 ? 'font-medium text-destructive' : 'font-medium text-success'}>{formatMoney(saldo)}</span>
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Monto</Label><Input type="number" value={pagoForm.monto} onChange={(e) => setPF('monto', e.target.value)} required /></div>
              <div className="space-y-2"><Label>Fecha</Label><Input type="date" value={pagoForm.fecha_pago} onChange={(e) => setPF('fecha_pago', e.target.value)} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Método</Label>
                <Select items={{ transferencia: 'Transferencia', tarjeta_debito: 'Tarjeta Débito', tarjeta_credito: 'Tarjeta Crédito' }} value={pagoForm.metodo_pago} onValueChange={(x) => { if (x) setPF('metodo_pago', String(x)); }}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="tarjeta_debito">Tarjeta Débito</SelectItem>
                    <SelectItem value="tarjeta_credito">Tarjeta Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Tipo</Label>
                <Select items={{ anticipo: 'Anticipo', abono: 'Abono', pago_final: 'Pago Final' }} value={pagoForm.tipo} onValueChange={(x) => { if (x) setPF('tipo', String(x)); }}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anticipo">Anticipo</SelectItem>
                    <SelectItem value="abono">Abono</SelectItem>
                    <SelectItem value="pago_final">Pago Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Referencia</Label><Input value={pagoForm.referencia} onChange={(e) => setPF('referencia', e.target.value)} placeholder="N° transferencia, etc." /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setPagoOpen(false)}>Cancelar</Button>
              <Button type="submit">Registrar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={pagoConfirm} onOpenChange={setPagoConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>El pago supera el saldo</DialogTitle></DialogHeader>
          <p className="text-sm">
            El monto <span className="font-semibold">{formatMoney(Number(pagoForm.monto))}</span> es mayor que el
            saldo de esta OT (<span className="font-semibold">{formatMoney(saldo)}</span>). ¿Registrar de todas formas?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setPagoConfirm(false)}>No</Button>
            <Button onClick={doRegistrarPago}>Sí, registrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
