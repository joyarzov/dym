import nodemailer from 'nodemailer';
import db from '../config/database.js';

const PRESETS = {
  gmail: { host: 'smtp.gmail.com', port: 465, secure: true },
  outlook: { host: 'smtp-mail.outlook.com', port: 587, secure: false },
};

export const EMAIL_KEYS = [
  'email_provider',
  'email_user',
  'email_pass',
  'email_from_name',
  'email_host',
  'email_port',
  'email_secure',
];

export async function getEmailConfig() {
  const [rows] = await db.query(
    `SELECT clave, valor FROM configuracion WHERE clave IN (${EMAIL_KEYS.map(() => '?').join(',')})`,
    EMAIL_KEYS
  );
  const cfg = {};
  rows.forEach((r) => { cfg[r.clave] = r.valor; });
  return cfg;
}

function resolveTransport(cfg) {
  const provider = cfg.email_provider || 'gmail';
  const preset = PRESETS[provider];
  const conn = preset || {
    host: cfg.email_host,
    port: Number(cfg.email_port) || 587,
    secure: cfg.email_secure === '1' || cfg.email_secure === 'true',
  };
  if (!conn.host || !cfg.email_user || !cfg.email_pass) {
    throw new Error('La casilla de correo no está configurada');
  }
  const opts = {
    host: conn.host,
    port: conn.port,
    secure: conn.secure,
    auth: { user: cfg.email_user, pass: cfg.email_pass },
  };
  // SMTP propio (cPanel/Exim, etc.): la conexión sigue cifrada (TLS/STARTTLS)
  // pero no exigimos que el nombre del certificado coincida, porque en hosting
  // compartido el cert suele ser del servidor y no del dominio del cliente.
  if (!preset) {
    if (conn.port === 587) opts.requireTLS = true;
    opts.tls = { rejectUnauthorized: false };
  }
  return nodemailer.createTransport(opts);
}

export async function sendMail({ to, subject, text, attachments }) {
  const cfg = await getEmailConfig();
  const transporter = resolveTransport(cfg);
  const fromName = cfg.email_from_name || 'DyM Taller';
  return transporter.sendMail({
    from: `"${fromName}" <${cfg.email_user}>`,
    to,
    subject,
    text,
    attachments,
  });
}

export async function verifyMail() {
  const cfg = await getEmailConfig();
  const transporter = resolveTransport(cfg);
  await transporter.verify();
  return true;
}
