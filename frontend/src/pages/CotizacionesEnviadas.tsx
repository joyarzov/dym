import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import type { CotizacionEnviada } from '@/lib/types';
import { formatMoney } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye } from 'lucide-react';

function fechaHora(s: string) {
  const d = new Date(String(s).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString('es-CL');
}

export default function CotizacionesEnviadas() {
  const [items, setItems] = useState<CotizacionEnviada[] | null>(null);

  useEffect(() => {
    api.get<CotizacionEnviada[]>('/cotizaciones/enviadas').then((r) => setItems(r.data));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cotizaciones enviadas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registro de cotizaciones enviadas por correo a los clientes.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {items === null ? (
            <div className="space-y-2 p-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">Aún no se han enviado cotizaciones</p>
          ) : (
            <div className="overflow-x-auto">
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Patente</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Destinatario</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Enviado por</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Vehículo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{fechaHora(c.created_at)}</TableCell>
                    <TableCell className="font-medium">{c.patente || '—'}</TableCell>
                    <TableCell>{c.cliente_nombre || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{c.destinatario}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(c.total)}</TableCell>
                    <TableCell className="text-muted-foreground">{c.enviado_por || '—'}</TableCell>
                    <TableCell>
                      {c.estado === 'enviado' ? (
                        <Badge className="bg-success text-white">Enviado</Badge>
                      ) : (
                        <Badge className="bg-destructive text-white" title={c.error_detalle || ''}>Error</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/vehiculos/${c.vehiculo_id}/cotizacion`}>
                        <Button variant="ghost" size="icon" aria-label="Ver cotización">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
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
