// SOLO SERVIDOR. Correo con el código de verificación para cambiar la clave WiFi, con la imagen de GuajiraNet.
import { escapar } from '@/lib/servidor/correo'

// El logo se carga desde la web publicada: en Vercel los archivos de /public no están disponibles para leerse en el servidor.
const SITIO = (process.env.SITIO_URL || 'https://www.guajiranet.com').replace(/\/+$/, '')
const WHATSAPP = '573009139909'

const C = {
  grafito: '#2b2e34',
  amarillo: '#fad21b',
  verde: '#09ac27',
  azul: '#0868c6',
  fondo: '#f2f3f7',
  texto: '#4d5462',
  suave: '#8a90a0',
}

export function correoCodigo(codigo: string) {
  const asunto = `🔐 ${codigo} es tu código de GuajiraNet para cambiar la clave WiFi`
  const digitos = codigo
    .split('')
    .map(
      (d) =>
        `<td style="padding:0 4px"><div style="background:#ffffff;border:2px solid ${C.amarillo};border-radius:12px;color:${C.grafito};font-family:Arial,Helvetica,sans-serif;font-size:30px;font-weight:800;height:56px;line-height:56px;text-align:center;width:44px">${escapar(d)}</div></td>`,
    )
    .join('')

  const html = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapar(asunto)}</title></head>
<body style="background:${C.fondo};margin:0;padding:0">
  <div style="display:none;max-height:0;overflow:hidden">Usa este código para confirmar que eres el titular. Vence en 10 minutos.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo};padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;max-width:520px;overflow:hidden">
        <tr><td style="background:#ffffff;border-bottom:4px solid ${C.amarillo};padding:22px 28px;text-align:center">
          <img src="${SITIO}/logo-guajiranet.png" alt="GuajiraNet Telecomunicaciones" width="180" style="display:inline-block;height:auto;max-width:180px">
        </td></tr>
        <tr><td style="background:${C.grafito};padding:26px 28px;text-align:center">
          <div style="font-size:34px;line-height:1">🔐</div>
          <h1 style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:22px;margin:12px 0 6px">Tu código de verificación</h1>
          <p style="color:${C.amarillo};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;margin:0">Cambio de clave de tu WiFi</p>
        </td></tr>
        <tr><td style="font-family:Arial,Helvetica,sans-serif;padding:28px 28px 8px;text-align:center">
          <p style="color:${C.texto};font-size:15px;line-height:1.55;margin:0 0 22px">Escribe este código en la página para confirmar que eres el titular del servicio:</p>
          <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>${digitos}</tr></table>
          <p style="background:#fff8d6;border-radius:10px;color:${C.grafito};display:inline-block;font-size:13px;font-weight:700;margin:22px 0 0;padding:9px 14px">⏱️ Vence en 10 minutos</p>
        </td></tr>
        <tr><td style="font-family:Arial,Helvetica,sans-serif;padding:20px 28px 26px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo};border-radius:12px">
            <tr><td style="color:${C.texto};font-size:13px;line-height:1.55;padding:14px 16px">
              <strong style="color:${C.grafito}">¿No fuiste tú?</strong> Ignora este correo: sin el código nadie puede cambiar tu clave.
              Nunca te pediremos este código por teléfono ni por WhatsApp.
            </td></tr>
          </table>
          <p style="margin:22px 0 0;text-align:center">
            <a href="https://wa.me/${WHATSAPP}" style="background:${C.verde};border-radius:30px;color:#ffffff;display:inline-block;font-size:14px;font-weight:700;padding:12px 22px;text-decoration:none">¿Necesitas ayuda? Escríbenos por WhatsApp</a>
          </p>
        </td></tr>
        <tr><td style="background:${C.grafito};color:#c4c8d2;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;padding:18px 28px;text-align:center">
          <strong style="color:#ffffff">GUAJIRANET ISP S.A.S.</strong> · Conectando sueños<br>
          <a href="${SITIO}" style="color:${C.amarillo};text-decoration:none">www.guajiranet.com</a> · +57 300 913 9909
        </td></tr>
      </table>
      <p style="color:${C.suave};font-family:Arial,Helvetica,sans-serif;font-size:11px;margin:14px 0 0">Recibiste este correo porque alguien pidió cambiar la clave WiFi con tu cédula en guajiranet.com.</p>
    </td></tr>
  </table>
</body>
</html>`

  const texto = `GuajiraNet - Cambio de clave WiFi

Tu código de verificación es: ${codigo}
Vence en 10 minutos.

¿No fuiste tú? Ignora este correo: sin el código nadie puede cambiar tu clave. Nunca te pediremos este código por teléfono ni por WhatsApp.

¿Necesitas ayuda? WhatsApp +57 300 913 9909

GUAJIRANET ISP S.A.S. · ${SITIO}`

  return { subject: asunto, html, text: texto }
}
