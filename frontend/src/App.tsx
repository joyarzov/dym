import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Clientes from '@/pages/Clientes';
import ClienteForm from '@/pages/ClienteForm';
import Vehiculos from '@/pages/Vehiculos';
import VehiculoForm from '@/pages/VehiculoForm';
import VehiculoDetalle from '@/pages/VehiculoDetalle';
import Piezas from '@/pages/Piezas';
import Pagos from '@/pages/Pagos';
import Proveedores from '@/pages/Proveedores';
import ProveedorForm from '@/pages/ProveedorForm';
import Reportes from '@/pages/Reportes';
import Configuracion from '@/pages/Configuracion';
import Usuarios from '@/pages/Usuarios';
import Cotizacion from '@/pages/Cotizacion';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function SuperuserRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user?.rol === 'superusuario' ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="clientes/nuevo" element={<ClienteForm />} />
        <Route path="clientes/:id/editar" element={<ClienteForm />} />
        <Route path="vehiculos" element={<Vehiculos />} />
        <Route path="vehiculos/nuevo" element={<VehiculoForm />} />
        <Route path="vehiculos/:id" element={<VehiculoDetalle />} />
        <Route path="vehiculos/:id/cotizacion" element={<Cotizacion />} />
        <Route path="vehiculos/:id/editar" element={<VehiculoForm />} />
        <Route path="piezas" element={<Piezas />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="proveedores" element={<Proveedores />} />
        <Route path="proveedores/nuevo" element={<ProveedorForm />} />
        <Route path="proveedores/:id/editar" element={<ProveedorForm />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="usuarios" element={<SuperuserRoute><Usuarios /></SuperuserRoute>} />
      </Route>
    </Routes>
  );
}
