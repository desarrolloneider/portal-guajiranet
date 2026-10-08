// SOLO SERVIDOR. Este archivo lo usan las rutas de app/api; nunca se importa desde un componente,
// así la API key de isp-api no llega al navegador.

import { request } from 'node:https'
import { readFileSync } from 'node:fs'
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

if (typeof window !== 'undefined') throw new Error('isp-api solo se puede usar en el servidor')

type Respuesta = { status: number; datos: Record<string, unknown> | null }

function config() {
  const url = process.env.ISP_API_URL
  const key = process.env.ISP_API_KEY
  if (!url || !key) throw new Error('Faltan ISP_API_URL o ISP_API_KEY en el .env.local del servidor')
  // Si isp-api usa un certificado propio (autofirmado), se confía solo en ese certificado.
  // Nunca se desactiva la verificación TLS.
  const ca = process.env.ISP_API_CA_PATH ? readFileSync(process.env.ISP_API_CA_PATH) : undefined
  return { url: url.replace(/\/+$/, ''), key, ca }
}

/** Llama a isp-api con la API key. Devuelve el código HTTP y el JSON de respuesta. */
export function llamarIsp(metodo: 'GET' | 'POST' | 'PUT', ruta: string, cuerpo?: unknown): Promise<Respuesta> {
  const { url, key, ca } = config()
  const destino = new URL(`${url}/api/v1${ruta}`)
  const json = cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
  return new Promise((resolver, rechazar) => {
    const req = request(
      destino,
      {
        method: metodo,
        ca,
        timeout: 30_000,
        headers: {
          'x-api-key': key,
          Accept: 'application/json',
          ...(json ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) } : {}),
          ...(metodo !== 'GET' ? { 'Idempotency-Key': randomUUID() } : {}),
        },
      },
      (res) => {
        let texto = ''
        res.setEncoding('utf8')
        res.on('data', (trozo) => (texto += trozo))
        res.on('end', () => {
          let datos: Record<string, unknown> | null = null
          try {
            datos = texto ? JSON.parse(texto) : null
          } catch {
            datos = null
          }
          resolver({ status: res.statusCode ?? 0, datos })
        })
      },
    )
    req.on('timeout', () => req.destroy(new Error('isp-api no respondió a tiempo')))
    req.on('error', rechazar)
    if (json) req.write(json)
    req.end()
  })
}

/** Identificador opaco de un equipo: el navegador nunca ve el serial real. */
export function idEquipo(sn: string) {
  return createHmac('sha256', secretoFirmas()).update(`equipo:${sn}`).digest('hex').slice(0, 20)
}

// Las firmas usan un secreto propio, no la API key, para no mezclar usos de la misma llave.
function secretoFirmas() {
  const secreto = process.env.CAMBIO_CLAVE_SECRETO
  if (!secreto || secreto.length < 32) throw new Error('Falta CAMBIO_CLAVE_SECRETO (mínimo 32 caracteres) en el .env.local del servidor')
  return secreto
}

/** HMAC corto con el secreto de firmas, para tokens propios de la web. */
export function firmar(texto: string) {
  return createHmac('sha256', secretoFirmas()).update(texto).digest('hex').slice(0, 32)
}

/** Compara dos cadenas en tiempo constante. */
export function igualSeguro(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

const VIGENCIA_FIRMA_MS = 24 * 60 * 60_000

/** Firma un número de tarea para que el navegador solo pueda consultar las tareas que creó. Vence en 24 horas. */
export function firmarTarea(taskId: string | number, emitida = Date.now()) {
  const mac = createHmac('sha256', secretoFirmas()).update(`tarea:${taskId}:${emitida}`).digest('hex').slice(0, 24)
  return `${emitida}.${mac}`
}

/** Comprueba la firma de una tarea en tiempo constante y que no haya vencido. */
export function firmaTareaValida(taskId: string, firma: unknown) {
  if (typeof firma !== 'string') return false
  const [marca, mac] = firma.split('.')
  const emitida = Number(marca)
  if (!Number.isSafeInteger(emitida) || !mac || Date.now() - emitida > VIGENCIA_FIRMA_MS || emitida > Date.now() + 60_000) return false
  const esperada = Buffer.from(firmarTarea(taskId, emitida))
  const recibida = Buffer.from(firma)
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida)
}
