import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'dym_taller',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  // Devuelve DATE/DATETIME como string 'YYYY-MM-DD ...' en vez de objeto Date,
  // evitando fechas inválidas al serializar a JSON.
  dateStrings: true,
});

export default pool;
