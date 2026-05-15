import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import usuariosRoutes from './routes/usuarios.js';
import clientesRoutes from './routes/clientes.js';
import proveedoresRoutes from './routes/proveedores.js';
import vehiculosRoutes from './routes/vehiculos.js';
import piezasRoutes from './routes/piezas.js';
import pagosRoutes from './routes/pagos.js';
import reportesRoutes from './routes/reportes.js';
import configuracionRoutes from './routes/configuracion.js';
import dashboardRoutes from './routes/dashboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);

app.use('/api/usuarios', authMiddleware, usuariosRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/clientes', authMiddleware, clientesRoutes);
app.use('/api/proveedores', authMiddleware, proveedoresRoutes);
app.use('/api/vehiculos', authMiddleware, vehiculosRoutes);
app.use('/api/piezas', authMiddleware, piezasRoutes);
app.use('/api/pagos', authMiddleware, pagosRoutes);
app.use('/api/reportes', authMiddleware, reportesRoutes);
app.use('/api/configuracion', authMiddleware, configuracionRoutes);

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => console.log(`DyM API running on port ${PORT}`));
