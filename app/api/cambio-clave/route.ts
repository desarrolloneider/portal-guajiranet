import { randomInt } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { firmar, firmarTarea, firmaTareaValida, idEquipo, igualSeguro, llamarIsp } from '@/lib/servidor/isp-api'
import { consultarCliente } from '@/lib/servidor/dsnube'
import { escapar, remitente, transporte } from '@/lib/servidor/correo'

// Corre en el servidor de Node (no en el navegador ni en el borde): aquí viven las credenciales.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Equipo = { sn: string; wifi_ssid?: string | null; state?: string | null }
type RespuestaError = { error: string; mensaje: string }

const RE_CEDULA = /^\d{5,12}$/
const RE_CODIGO = /^\d{6}$/
const RE_CLAVE = /^[A-Za-z0-9]{8,32}$/
const RE_RED = /^[A-Za-z0-9 _-]{8,32}$/

const VIGENCIA_CODIGO_MS = 10 * 60_000
const MAX_INTENTOS_CODIGO = 5
const ESPERA_REENVIO_MS = 60_000
const VIGENCIA_SESION_MS = 15 * 60_000

/* ---------- Límite de intentos (en memoria del servidor) ---------- */

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

/* ---------- Códigos de verificación por correo (en memoria del servidor) ---------- */

type CodigoPendiente = { mac: string; vence: number; fallos: number; enviado: number }
const codigos = new Map<string, CodigoPendiente>()

function limpiarCodigos() {
  const ahora = Date.now()
  for (const [k, v] of codigos) if (v.vence < ahora) codigos.delete(k)
}

/** Token de sesión que prueba que la cédula ya validó su código. */
function crearSesion(cedula: string) {
  const vence = Date.now() + VIGENCIA_SESION_MS
  return `${vence}.${firmar(`sesion:${cedula}:${vence}`)}`
}
function sesionValida(cedula: string, sesion: unknown) {
  if (typeof sesion !== 'string') return false
  const [marca, mac] = sesion.split('.')
  const vence = Number(marca)
  if (!Number.isSafeInteger(vence) || !mac || vence < Date.now()) return false
  return igualSeguro(mac, firmar(`sesion:${cedula}:${vence}`))
}

/** Muestra el principio y el final del correo: ma*****07@hotmail.com */
function ocultarCorreo(correo: string) {
  const [usuario, dominio] = correo.split('@')
  // En usuarios cortos se muestra menos, para que siempre quede algo oculto.
  const visibles = usuario.length >= 8 ? 2 : 1
  if (usuario.length <= 2) return `${usuario[0]}***@${dominio}`
  // Siempre 5 asteriscos, para no revelar el largo del correo.
  return `${usuario.slice(0, visibles)}*****${usuario.slice(-visibles)}@${dominio}`
}

function ipDe(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'desconocida'
}

const fallo = (status: number, error: string, mensaje: string) => NextResponse.json<RespuestaError>({ error, mensaje }, { status })

const soloDigitos = (v: unknown) => String(v ?? '').replace(/\D/g, '')

/** Equipos válidos de la cédula, o una respuesta de error lista para enviar. */
async function equiposDe(cedula: string): Promise<Equipo[] | NextResponse> {
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
  if (status === 409 && tarea) return NextResponse.json({ estado: 'equipo_apagado', tarea, firma: firmarTarea(String(tarea)) })
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
      if (!/^\d+$/.test(tarea) || !firmaTareaValida(tarea, cuerpo.firma)) return fallo(403, 'INVALIDO', 'Solicitud inválida.')
      if (!permitido(`estado:${ip}`, 120, 15 * 60_000)) return fallo(429, 'LIMITE', 'Demasiadas consultas.')
      const r = await llamarIsp('GET', `/public/tasks/${tarea}`)
      if (r.status !== 200 || !r.datos) return NextResponse.json({ estado: 'desconocido' })
      return NextResponse.json({ estado: String(r.datos.status ?? 'desconocido') })
    }

    const cedula = soloDigitos(cuerpo.cedula)
    if (!RE_CEDULA.test(cedula)) return fallo(400, 'INVALIDO', 'Escribe tu cédula sin puntos ni espacios.')

    // 1. Enviar un código al correo registrado en DS Nube.
    if (accion === 'enviar-codigo') {
      if (cuerpo.autorizacion !== true) return fallo(400, 'INVALIDO', 'Debes autorizar el uso de tus datos para continuar.')
      if (!permitido(`codigo-ip:${ip}`, 10, 60 * 60_000) || !permitido(`codigo-cedula:${cedula}`, 3, 60 * 60_000)) {
        return fallo(429, 'LIMITE', 'Pediste varios códigos en poco tiempo. Espera una hora o escríbenos por WhatsApp.')
      }
      limpiarCodigos()
      const previo = codigos.get(cedula)
      if (previo && Date.now() - previo.enviado < ESPERA_REENVIO_MS) {
        return fallo(429, 'ESPERA', 'Ya te enviamos un código. Espera un minuto antes de pedir otro.')
      }

      const cliente = await consultarCliente(cedula)
      if (!cliente?.email) {
        return fallo(404, 'SIN_CORREO', 'No tenemos un correo registrado para esa cédula. Escríbenos por WhatsApp y te ayudamos a cambiar la clave.')
      }

      const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0')
      await transporte().sendMail({
        from: remitente(),
        to: cliente.email,
        subject: `${codigo} es tu código para cambiar la clave WiFi`,
        text: `Tu código de verificación es ${codigo}. Vence en 10 minutos.\n\nSi no pediste cambiar la clave de tu WiFi, ignora este correo.\n\nGUAJIRANET ISP SAS`,
        html: `<p>Tu código de verificación es:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${escapar(codigo)}</p><p>Vence en 10 minutos.</p><p>Si no pediste cambiar la clave de tu WiFi, ignora este correo.</p><p>GUAJIRANET ISP SAS</p>`,
      })
      codigos.set(cedula, { mac: firmar(`codigo:${cedula}:${codigo}`), vence: Date.now() + VIGENCIA_CODIGO_MS, fallos: 0, enviado: Date.now() })
      return NextResponse.json({ correo: ocultarCorreo(cliente.email) })
    }

    // 2. Validar el código y devolver los equipos con una sesión firmada.
    if (accion === 'verificar-codigo') {
      const codigo = soloDigitos(cuerpo.codigo)
      if (!RE_CODIGO.test(codigo)) return fallo(400, 'INVALIDO', 'Escribe el código de 6 dígitos que te enviamos.')
      if (!permitido(`verificar:${ip}`, 20, 15 * 60_000)) return fallo(429, 'LIMITE', 'Hiciste muchos intentos. Espera 15 minutos.')
      const pendiente = codigos.get(cedula)
      if (!pendiente || pendiente.vence < Date.now()) {
        codigos.delete(cedula)
        return fallo(400, 'CODIGO_VENCIDO', 'El código venció. Pide uno nuevo.')
      }
      if (!igualSeguro(pendiente.mac, firmar(`codigo:${cedula}:${codigo}`))) {
        if (++pendiente.fallos >= MAX_INTENTOS_CODIGO) {
          codigos.delete(cedula)
          return fallo(400, 'CODIGO_VENCIDO', 'Superaste los intentos permitidos. Pide un código nuevo.')
        }
        return fallo(400, 'CODIGO_INCORRECTO', 'El código no es correcto. Revísalo e inténtalo de nuevo.')
      }
      codigos.delete(cedula)

      const equipos = await equiposDe(cedula)
      if (equipos instanceof NextResponse) return equipos
      return NextResponse.json({
        sesion: crearSesion(cedula),
        equipos: equipos.map((e, i) => ({ id: idEquipo(e.sn), red: e.wifi_ssid || `Equipo ${i + 1}` })),
      })
    }

    // 3. Cambiar la clave, solo con una sesión válida.
    if (accion === 'cambiar') {
      if (!sesionValida(cedula, cuerpo.sesion)) return fallo(403, 'SESION_VENCIDA', 'Tu verificación venció. Vuelve a empezar para recibir un código nuevo.')
      const clave = String(cuerpo.clave ?? '')
      const red = String(cuerpo.red ?? '').trim()
      if (!RE_CLAVE.test(clave)) return fallo(400, 'INVALIDO', 'La clave debe tener entre 8 y 32 letras o números, sin espacios ni símbolos.')
      if (red && !RE_RED.test(red)) return fallo(400, 'INVALIDO', 'El nombre de la red debe tener entre 8 y 32 caracteres: letras, números, espacios, guion o guion bajo.')
      if (!permitido(`cambiar:${ip}`, 5, 60 * 60_000)) return fallo(429, 'LIMITE', 'Hiciste varios cambios en poco tiempo. Intenta de nuevo en una hora.')

      // El serial siempre sale de los equipos de esa cédula, nunca del navegador.
      const equipos = await equiposDe(cedula)
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
