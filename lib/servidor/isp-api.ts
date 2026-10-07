// SOLO SERVIDOR. Este archivo lo usan las rutas de app/api; nunca se importa desde un componente,
// así la API key de isp-api no llega al navegador.

import { request } from 'node:https'
import { readFileSync } from 'node:fs'
import { createHmac, randomUUID } from 'node:crypto'

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
  return createHmac('sha256', config().key).update(`equipo:${sn}`).digest('hex').slice(0, 20)
}

/** Firma un número de tarea para que el navegador solo pueda consultar las tareas que creó. */
export function firmarTarea(taskId: string | number) {
  return createHmac('sha256', config().key).update(`tarea:${taskId}`).digest('hex').slice(0, 24)
}
