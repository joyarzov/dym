import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import type { EnTallerVehiculo } from '@/lib/types';
import { ESTADOS, formatDate } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Monitor } from 'lucide-react';

const PIPELINE = [
  'recibido', 'presupuesto', 'aprobado', 'desabolladura',
  'pintura', 'control_calidad', 'listo',
] as const;

export default function EnTaller() {
  const [items, setItems] = useState<EnTallerVehiculo[] | null>(null);

  function load() {
    api.get<EnTallerVehiculo[]>('/vehiculos/en-taller').then((r) => setItems(r.data));
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">En taller</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items?.length ?? 0} vehículo(s) en proceso · se actualiza solo
          </p>
        </div>
        <Link to="/tablero" target="_blank">
          <Button variant="outline"><Monitor className="mr-2 h-4 w-4" />Modo monitor</Button>
        </Link>
      </div>

      {items === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No hay vehículos en taller</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((v) => {
            const idx = PIPELINE.indexOf(v.estado as typeof PIPELINE[number]);
            const atrasado = v.fecha_estimada_entrega
              ? new Date(String(v.fecha_estimada_entrega).slice(0, 10)) < new Date(new Date().toDateString())
              : false;
            return (
              <Link key={v.id} to={`/vehiculos/${v.id}`}>
                <Card className="h-full transition-colors hover:ring-foreground/25">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-lg font-bold">{v.patente}</p>
                        <p className="text-sm text-muted-foreground">{v.marca} {v.modelo}</p>
                      </div>
                      <Badge className={ESTADOS[v.estado].color}>{ESTADOS[v.estado].label}</Badge>
                    </div>
                    <p className="text-sm">{v.cliente_nombre}</p>

                    <div className="flex gap-1">
                      {PIPELINE.map((p, i) => (
                        <div
                          key={p}
                          className={`h-1.5 flex-1 rounded-full ${i <= idx ? 'bg-primary' : 'bg-accent'}`}
                          title={ESTADOS[p].label}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{v.dias_en_taller} día(s) en taller</span>
                      <span className={atrasado ? 'font-medium text-destructive' : ''}>
                        Entrega: {formatDate(v.fecha_estimada_entrega)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
