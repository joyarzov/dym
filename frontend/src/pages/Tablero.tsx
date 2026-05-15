import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { EnTallerVehiculo, EstadoVehiculo } from '@/lib/types';
import { ESTADOS } from '@/lib/types';
import { LogoMark } from '@/components/Logo';

const COLUMNAS: EstadoVehiculo[] = [
  'recibido', 'presupuesto', 'aprobado', 'desabolladura',
  'pintura', 'control_calidad', 'listo',
];

export default function Tablero() {
  const [items, setItems] = useState<EnTallerVehiculo[]>([]);
  const [hora, setHora] = useState(new Date());

  useEffect(() => {
    function load() {
      api.get<EnTallerVehiculo[]>('/vehiculos/en-taller').then((r) => setItems(r.data)).catch(() => {});
    }
    load();
    const t = setInterval(load, 15000);
    const c = setInterval(() => setHora(new Date()), 1000);
    return () => { clearInterval(t); clearInterval(c); };
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 text-zinc-50">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-8 py-4">
        <div className="flex items-center gap-3">
          <LogoMark className="h-10 w-10" />
          <div>
            <p className="text-xl font-semibold tracking-tight">DyM Taller</p>
            <p className="text-sm text-zinc-400">Estado de vehículos en proceso</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums">
            {hora.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-sm text-zinc-400">
            {items.length} vehículo(s) en taller
          </p>
        </div>
      </header>

      <div className="flex flex-1 gap-4 overflow-x-auto p-6">
        {COLUMNAS.map((estado) => {
          const vs = items.filter((v) => v.estado === estado);
          return (
            <div key={estado} className="flex w-72 shrink-0 flex-col">
              <div className={`mb-3 flex items-center justify-between rounded-lg px-4 py-2 text-white ${ESTADOS[estado].color}`}>
                <span className="font-semibold">{ESTADOS[estado].label}</span>
                <span className="rounded-full bg-black/25 px-2 text-sm tabular-nums">{vs.length}</span>
              </div>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
                {vs.map((v) => (
                  <div key={v.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <p className="text-2xl font-extrabold tracking-wide">{v.patente}</p>
                    <p className="text-sm text-zinc-300">{v.marca} {v.modelo}</p>
                    <p className="mt-1 truncate text-sm text-zinc-400">{v.cliente_nombre}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                      <span>{v.dias_en_taller} día(s)</span>
                      {v.color && <span className="truncate">{v.color}</span>}
                    </div>
                  </div>
                ))}
                {vs.length === 0 && (
                  <div className="rounded-xl border border-dashed border-zinc-800 py-8 text-center text-sm text-zinc-600">
                    —
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
