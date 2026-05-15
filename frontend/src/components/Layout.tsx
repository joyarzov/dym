import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard, Users, Car, Wrench, DollarSign, Truck,
  BarChart3, Settings, LogOut, Menu, X, ShieldCheck, Send, LayoutGrid,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Logo, LogoMark } from '@/components/Logo';

const baseNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vehiculos', label: 'Vehículos', icon: Car },
  { to: '/en-taller', label: 'En taller', icon: LayoutGrid },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/piezas', label: 'Piezas', icon: Wrench },
  { to: '/pagos', label: 'Pagos', icon: DollarSign },
  { to: '/proveedores', label: 'Proveedores', icon: Truck },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/cotizaciones-enviadas', label: 'Cotizaciones', icon: Send },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const nav =
    user?.rol === 'superusuario'
      ? [...baseNav, { to: '/usuarios', label: 'Usuarios', icon: ShieldCheck }]
      : baseNav;

  return (
    <div className="flex h-screen bg-background">
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-4 py-5 border-b border-sidebar-border">
          <Logo />
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map((item) => {
            const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 active:translate-y-px ${active ? 'bg-primary/12 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
                )}
                <item.icon className={`h-4 w-4 transition-colors ${active ? 'text-primary' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-primary">
              {(user?.nombre ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-medium">{user?.nombre}</p>
              <p className="truncate text-xs text-muted-foreground capitalize">{user?.rol}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center gap-2 px-4 lg:hidden bg-sidebar/80 backdrop-blur-sm">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Abrir menú">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <LogoMark className="h-7 w-7" />
          <span className="font-heading font-semibold tracking-tight">
            DyM <span className="text-primary">Taller</span>
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
