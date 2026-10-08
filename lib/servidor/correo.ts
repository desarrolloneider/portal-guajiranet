// SOLO SERVIDOR. Transporte de correo compartido por las PQRS y el código de verificación.
import nodemailer from 'nodemailer'

export function transporte() {
  const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS } = process.env
  if (!MAIL_HOST || !MAIL_USER || !MAIL_PASS) throw new Error('Faltan MAIL_HOST, MAIL_USER o MAIL_PASS en el .env del servidor')
  const puerto = Number(MAIL_PORT || 465)
  const seguro = process.env.MAIL_SECURE
  return nodemailer.createTransport({
    host: MAIL_HOST,
    port: puerto,
    // Acepta "true", "si" o "1". Si no se indica, se usa SSL solo en el puerto 465.
    secure: seguro ? /^(true|si|sí|1)$/i.test(seguro.trim()) : puerto === 465,
    auth: { user: MAIL_USER, pass: MAIL_PASS },
  })
}

export const remitente = () => process.env.MAIL_FROM || `GUAJIRANET ISP SAS <${process.env.MAIL_USER}>`

export const escapar = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
