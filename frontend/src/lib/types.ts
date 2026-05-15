export type Rol = 'admin' | 'superusuario';

export interface User {
  id: number;
  username: string;
  nombre: string;
  rol: Rol;
}

export interface Usuario {
  id: number;
  username: string;
  nombre_completo: string;
  email: string | null;
  rol: Rol;
  activo: number;
  ultimo_acceso: string | null;
  created_at: string;
}

export const ROL_LABEL: Record<Rol, string> = {
  admin: 'Administrador',
  superusuario: 'Superusuario',
};

export interface Cliente {
  id: number;
  rut: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  total_vehiculos?: number;
  created_at: string;
}

export interface Proveedor {
  id: number;
  rut: string;
  razon_social: string;
  nombre_contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  rubro: string;
  activo: number;
  notas: string;
}

export interface Vehiculo {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  cliente_rut?: string;
  cliente_telefono?: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  fecha_ingreso: string;
  fecha_estimada_entrega: string;
  fecha_entrega_real: string;
  estado: EstadoVehiculo;
  tiene_seguro: number;
  aseguradora: string;
  numero_poliza: string;
  numero_siniestro: string;
  nombre_ajustador: string;
  telefono_ajustador: string;
  presupuesto_estimado: number;
  requiere_anticipo: number;
  porcentaje_anticipo: number;
  monto_anticipo: number;
  anticipo_pagado: number;
  diagnostico: string;
  observaciones: string;
  fotos?: Foto[];
  piezas?: Pieza[];
  pagos?: Pago[];
  totalPagado?: number;
}

export type EstadoVehiculo =
  | 'recibido' | 'presupuesto' | 'aprobado' | 'desabolladura'
  | 'pintura' | 'control_calidad' | 'listo' | 'entregado';

export interface Foto {
  id: number;
  vehiculo_id: number;
  ruta_foto: string;
  descripcion: string;
  tipo: 'ingreso' | 'proceso' | 'entrega';
  created_at: string;
}

export interface Pieza {
  id: number;
  vehiculo_id: number;
  proveedor_id: number;
  proveedor_nombre?: string;
  patente?: string;
  marca?: string;
  modelo?: string;
  nombre_pieza: string;
  tipo_trabajo: 'reparacion' | 'reemplazo' | 'pintura' | 'desabolladura';
  descripcion: string;
  cantidad: number;
  costo_unitario: number;
  costo_total: number;
  estado: 'pendiente' | 'en_proceso' | 'completada';
  fecha_inicio: string;
  fecha_fin: string;
}

export interface Pago {
  id: number;
  vehiculo_id: number;
  patente?: string;
  cliente_nombre?: string;
  monto: number;
  metodo_pago: 'transferencia' | 'tarjeta_debito' | 'tarjeta_credito';
  tipo: 'anticipo' | 'abono' | 'pago_final';
  referencia: string;
  notas: string;
  fecha_pago: string;
}

export interface ManoObra {
  id: number;
  vehiculo_id: number;
  descripcion: string;
  valor: number;
}

export interface Cotizacion {
  empresa: string;
  fecha: string;
  vehiculo: Vehiculo & {
    cliente_email?: string;
    cliente_direccion?: string;
  };
  piezas: Pieza[];
  manoObra: ManoObra[];
  totales: {
    subtotalPiezas: number;
    subtotalManoObra: number;
    neto: number;
    iva: number;
    total: number;
  };
}

export interface DashboardData {
  totalVehiculos: number;
  enTaller: number;
  listos: number;
  totalClientes: number;
  ingresosMes: number;
  pendienteCobro: number;
  recientes: Vehiculo[];
  porEstado: { estado: EstadoVehiculo; total: number }[];
}

export const ESTADOS: Record<EstadoVehiculo, { label: string; color: string }> = {
  recibido: { label: 'Recibido', color: 'bg-gray-500' },
  presupuesto: { label: 'Presupuesto', color: 'bg-cyan-500' },
  aprobado: { label: 'Aprobado', color: 'bg-green-500' },
  desabolladura: { label: 'Desabolladura', color: 'bg-orange-500' },
  pintura: { label: 'Pintura', color: 'bg-violet-500' },
  control_calidad: { label: 'Control Calidad', color: 'bg-teal-500' },
  listo: { label: 'Listo', color: 'bg-blue-500' },
  entregado: { label: 'Entregado', color: 'bg-gray-700' },
};

export function formatMoney(amount: number | string | null | undefined): string {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  // Acepta 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss' o ISO; usa solo la parte de fecha.
  const ymd = String(date).slice(0, 10);
  const d = new Date(ymd + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-CL');
}
