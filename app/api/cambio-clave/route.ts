import { NextResponse, type NextRequest } from 'next/server'
import { firmarTarea, idEquipo, llamarIsp } from '@/lib/servidor/isp-api'

// Corre en el servidor de Node (no en el navegador ni en el borde): aquí vive la API key de isp-api.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Equipo = { sn: string; wifi_ssid?: string | null; state?: string | null }
type RespuestaError = { error: string; mensaje: string }

const RE_CEDULA = /^\d{5,12}$/
const RE_CLAVE = /^[A-Za-z0-9]{8,32}$/
const RE_RED = /^[A-Za-z0-9 _-]{8,32}$/

const VERIFICAR_CELULAR = (process.env.CAMBIO_CLAVE_VERIFICAR_CELULAR ?? 'si').toLowerCase() !== 'no'

/* ---------- Límite de intentos por IP (en memoria del servidor) ---------- */

const intentos = new Map<string, number[]>()
function permitido(clave: string, max: number, ventanaMs: number) {
  const ahora = Date.now()
  const lista = (intentos.get(clave) ?? []).filter((t) => ahora - t < ventanaMs)
  if (lista.length >= max) {
    intentos.set(clave, lista)
    return false
  }
  lista.push(ahora)
  intentos.set(clave, lista)
  if (intentos.size > 5000) for (const [k, v] of intentos) if (!v.some((t) => ahora - t < ventanaMs)) intentos.delete(k)
  return true
}

function ipDe(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'desconocida'
}

const fallo = (status: number, error: string, mensaje: string) => NextResponse.json<RespuestaError>({ error, mensaje }, { status })

const soloDigitos = (v: unknown) => String(v ?? '').replace(/\D/g, '')
const ultimos10 = (v: unknown) => soloDigitos(v).slice(-10)

/**
 * Comprueba que la cédula exista y, si está activado, que el celular coincida con el registrado.
 * Devuelve los equipos de esa cédula o una respuesta de error lista para enviar.
 */
async function verificarTitular(cedula: string, celular: string): Promise<Equipo[] | NextResponse> {
  if (VERIFICAR_CELULAR) {
    const usuario = await llamarIsp('GET', `/public/user/${encodeURIComponent(cedula)}`)
    if (usuario.status === 404) return fallo(404, 'NO_ENCONTRADO', 'No encontramos un servicio con esa cédula.')
    if (usuario.status !== 200 || !usuario.datos) throw new Error(`isp-api respondió ${usuario.status} al consultar el usuario`)
    const registrados = [usuario.datos.movil, usuario.datos.telefono].map(ultimos10).filter((n) => n.length >= 7)
    if (!registrados.length || !registrados.includes(ultimos10(celular))) {
      return fallo(403, 'DATOS_NO_COINCIDEN', 'Los datos no coinciden con los registrados. Escríbenos por WhatsApp y te ayudamos a cambiar la clave.')
    }
  }

  const equipos = await llamarIsp('GET', `/public/user/${encodeURIComponent(cedula)}/devices`)
  if (equipos.status === 404) return fallo(404, 'NO_ENCONTRADO', 'No encontramos un equipo asociado a esa cédula.')
  if (equipos.status !== 200 || !equipos.datos) throw new Error(`isp-api respondió ${equipos.status} al consultar los equipos`)
  const lista = (Array.isArray(equipos.datos.devices) ? equipos.datos.devices : []) as Equipo[]
  const validos = lista.filter((e) => e.sn && !e.sn.startsWith('NoEncontrado-'))
  if (!validos.length) return fallo(404, 'SIN_EQUIPO', 'No pudimos identificar tu equipo. Escríbenos por WhatsApp y lo revisamos.')
  return validos
}

/** Traduce las respuestas de isp-api a mensajes para el cliente. */
function respuestaCambio(status: number, datos: Record<string, unknown> | null) {
  const codigo = String(datos?.error_code ?? '')
  const tarea = datos?.taskId
  if (status === 200 && tarea) return NextResponse.json({ estado: 'en_cola', tarea, firma: firmarTarea(String(tarea)) })
  if (status === 409 && codigo === 'DEVICE_OFFLINE' && tarea) {
    return NextResponse.json({ estado: 'equipo_apagado', tarea, firma: firmarTarea(String(tarea)) })
  }
  if (status === 409) return fallo(409, 'EN_CURSO', 'Ya hay un cambio en curso para tu equipo. Espera unos minutos y vuelve a intentarlo.')
  if (status === 429) return fallo(429, 'LIMITE', 'Hiciste varios cambios en poco tiempo. Intenta de nuevo en una hora.')
  if (status === 503) return fallo(503, 'MANTENIMIENTO', 'El sistema está en mantenimiento. Intenta más tarde.')
  if (status === 400) return fallo(400, 'INVALIDO', 'La clave o el nombre de la red no son válidos.')
  if (status === 401 || status === 404) return fallo(404, 'NO_ENCONTRADO', 'No encontramos tu servicio. Escríbenos por WhatsApp.')
  throw new Error(`isp-api respondió ${status} (${codigo || 'sin código'}) al pedir el cambio`)
}

export async function POST(req: NextRequest) {
  let cuerpo: Record<string, unknown>
  try {
    cuerpo = await req.json()
  } catch {
    return fallo(400, 'INVALIDO', 'Solicitud inválida.')
  }
  const ip = ipDe(req)
  const accion = String(cuerpo.accion ?? '')

  try {
    if (accion === 'estado') {
      const tarea = String(cuerpo.tarea ?? '')
      if (!/^\d+$/.test(tarea) || cuerpo.firma !== firmarTarea(tarea)) return fallo(403, 'INVALIDO', 'Solicitud inválida.')
      if (!permitido(`estado:${ip}`, 120, 15 * 60_000)) return fallo(429, 'LIMITE', 'Demasiadas consultas.')
      const r = await llamarIsp('GET', `/public/tasks/${tarea}`)
      if (r.status !== 200 || !r.datos) return NextResponse.json({ estado: 'desconocido' })
      return NextResponse.json({ estado: String(r.datos.status ?? 'desconocido') })
    }

    const cedula = soloDigitos(cuerpo.cedula)
    const celular = soloDigitos(cuerpo.celular)
    if (!RE_CEDULA.test(cedula)) return fallo(400, 'INVALIDO', 'Escribe tu cédula sin puntos ni espacios.')
    if (VERIFICAR_CELULAR && celular.length < 7) return fallo(400, 'INVALIDO', 'Escribe el celular que registraste con nosotros.')

    if (accion === 'verificar') {
      if (!permitido(`verificar:${ip}`, 10, 15 * 60_000)) {
        return fallo(429, 'LIMITE', 'Hiciste muchos intentos. Espera 15 minutos o escríbenos por WhatsApp.')
      }
      const equipos = await verificarTitular(cedula, celular)
      if (equipos instanceof NextResponse) return equipos
      return NextResponse.json({
        equipos: equipos.map((e, i) => ({ id: idEquipo(e.sn), red: e.wifi_ssid || `Equipo ${i + 1}` })),
      })
    }

    if (accion === 'cambiar') {
      const clave = String(cuerpo.clave ?? '')
      const red = String(cuerpo.red ?? '').trim()
      if (!RE_CLAVE.test(clave)) return fallo(400, 'INVALIDO', 'La clave debe tener entre 8 y 32 letras o números, sin espacios ni símbolos.')
      if (red && !RE_RED.test(red)) return fallo(400, 'INVALIDO', 'El nombre de la red debe tener entre 8 y 32 caracteres: letras, números, espacios, guion o guion bajo.')
      if (!permitido(`cambiar:${ip}`, 5, 60 * 60_000)) return fallo(429, 'LIMITE', 'Hiciste varios cambios en poco tiempo. Intenta de nuevo en una hora.')

      // Se vuelve a verificar al titular: el serial siempre sale de los equipos de esa cédula, nunca del navegador.
      const equipos = await verificarTitular(cedula, celular)
      if (equipos instanceof NextResponse) return equipos
      const equipo = equipos.find((e) => idEquipo(e.sn) === cuerpo.equipo) ?? (equipos.length === 1 ? equipos[0] : null)
      if (!equipo) return fallo(400, 'INVALIDO', 'Escoge cuál de tus redes quieres cambiar.')

      const r = red
        ? await llamarIsp('PUT', '/public/configure-wifi', { cedula, sn: equipo.sn, newSSID: red, newWifiPassword: clave })
        : await llamarIsp('POST', '/public/change-wifi-password', { cedula, sn: equipo.sn, newWifiPassword: clave })
      return respuestaCambio(r.status, r.datos)
    }

    return fallo(400, 'INVALIDO', 'Solicitud inválida.')
  } catch (e) {
    console.error('[cambio-clave]', e instanceof Error ? e.message : e)
    return fallo(502, 'SIN_CONEXION', 'No pudimos comunicarnos con el sistema en este momento. Intenta más tarde o escríbenos por WhatsApp.')
  }
}
