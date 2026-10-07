import { NextResponse, type NextRequest } from 'next/server'
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import nodemailer from 'nodemailer'

// Corre en el servidor de Node: aquí viven las credenciales del correo.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TIPOS: Record<string, string> = { peticion: 'Petición', queja: 'Queja', reclamo: 'Reclamo', sugerencia: 'Sugerencia' }
const MAX_ARCHIVO = 5 * 1024 * 1024
const TIPOS_ARCHIVO = /^(image\/(png|jpe?g|webp|gif|heic|heif)|application\/pdf)$/

const DESTINO = process.env.PQR_CORREO_DESTINO || 'pqr@guajiranet.com'
const CARPETA_DATOS = process.env.PQR_CARPETA_DATOS || join(process.cwd(), 'datos-pqrs')

/* ---------- Número de radicado ---------- */

// Si la SIC le asignó a GuajiraNet un Identificador de Operador (4 dígitos), el número sale como CUN:
// IO (4) + año (2) + consecutivo (10). Si no, sale como PQRS-AAAAMMDD-consecutivo.
const IO = (process.env.PQR_CUN_OPERADOR ?? '').replace(/\D/g, '')

// Las solicitudes se atienden una por una para que dos personas nunca reciban el mismo consecutivo.
let cola: Promise<unknown> = Promise.resolve()
function enOrden<T>(tarea: () => Promise<T>): Promise<T> {
  const siguiente = cola.then(tarea, tarea)
  cola = siguiente.catch(() => undefined)
  return siguiente
}

const ARCHIVO_CONSECUTIVO = () => join(CARPETA_DATOS, 'consecutivo.json')

/** Devuelve el siguiente consecutivo del año sin guardarlo todavía. */
async function siguienteConsecutivo(anio: number) {
  await mkdir(CARPETA_DATOS, { recursive: true })
  try {
    const leido = JSON.parse(await readFile(ARCHIVO_CONSECUTIVO(), 'utf8'))
    if (leido.anio === anio && Number.isInteger(leido.ultimo)) return leido.ultimo + 1
  } catch {
    /* primer radicado o archivo nuevo */
  }
  return 1
}

/** Guarda el consecutivo solo cuando la solicitud ya llegó al buzón, para no dejar números perdidos. */
async function guardarConsecutivo(anio: number, ultimo: number) {
  await writeFile(ARCHIVO_CONSECUTIVO(), JSON.stringify({ anio, ultimo }))
}

function armarRadicado(consecutivo: number, fecha: Date) {
  if (IO.length === 4) return `${IO}${String(fecha.getFullYear()).slice(-2)}${String(consecutivo).padStart(10, '0')}`
  const dia = `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}`
  return `PQRS-${dia}-${String(consecutivo).padStart(6, '0')}`
}

/* ---------- Límite de envíos por IP ---------- */

const intentos = new Map<string, number[]>()
function permitido(ip: string) {
  const ahora = Date.now()
  const lista = (intentos.get(ip) ?? []).filter((t) => ahora - t < 60 * 60_000)
  if (lista.length >= 5) return false
  lista.push(ahora)
  intentos.set(ip, lista)
  return true
}

/* ---------- Correo ---------- */

function transporte() {
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

const escapar = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const fallo = (status: number, mensaje: string) => NextResponse.json({ mensaje }, { status })

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'desconocida'
  if (!permitido(ip)) return fallo(429, 'Ya enviaste varias solicitudes en la última hora. Si es urgente, escríbenos por WhatsApp.')

  let datos: FormData
  try {
    datos = await req.formData()
  } catch {
    return fallo(400, 'Solicitud inválida.')
  }
  const campo = (k: string, max = 200) => String(datos.get(k) ?? '').trim().slice(0, max)

  const tipo = campo('tipo')
  const nombre = campo('nombre')
  const documento = campo('documento', 20).replace(/\D/g, '')
  const telefono = campo('telefono', 20)
  const correo = campo('correo')
  const municipio = campo('municipio', 60)
  const contrato = campo('contrato', 40)
  const detalle = campo('detalle', 5000)
  const archivo = datos.get('archivo')

  if (!TIPOS[tipo]) return fallo(400, 'Escoge el tipo de solicitud.')
  if (nombre.length < 3) return fallo(400, 'Escribe tu nombre completo.')
  if (documento.length < 5) return fallo(400, 'Escribe tu número de documento.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return fallo(400, 'Escribe un correo válido.')
  if (detalle.length < 20) return fallo(400, 'Cuéntanos con más detalle qué pasó (mínimo 20 caracteres).')

  let adjunto: { filename: string; content: Buffer; contentType: string } | null = null
  if (archivo instanceof File && archivo.size > 0) {
    if (archivo.size > MAX_ARCHIVO) return fallo(400, 'El archivo no puede superar los 5 MB.')
    if (!TIPOS_ARCHIVO.test(archivo.type)) return fallo(400, 'Solo puedes adjuntar imágenes o PDF.')
    adjunto = { filename: archivo.name.replace(/[^\w.\- ]/g, '_').slice(0, 100), content: Buffer.from(await archivo.arrayBuffer()), contentType: archivo.type }
  }

  try {
    const respuesta = await enOrden(async () => {
      const fecha = new Date()
      const consecutivo = await siguienteConsecutivo(fecha.getFullYear())
      const radicado = armarRadicado(consecutivo, fecha)
      const etiqueta = TIPOS[tipo]
      const fechaTexto = fecha.toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'long', timeStyle: 'short' })

      const filas: [string, string][] = [
        ['Radicado', radicado],
        ['Tipo', etiqueta],
        ['Fecha', fechaTexto],
        ['Nombre', nombre],
        ['Documento', documento],
        ['Teléfono', telefono || 'No indicado'],
        ['Correo', correo],
        ['Municipio', municipio || 'No indicado'],
        ['N.º de contrato', contrato || 'No indicado'],
        ['Adjunto', adjunto ? adjunto.filename : 'Sin adjunto'],
      ]
      const tabla = filas
        .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#626873">${k}</td><td style="padding:6px 0"><strong>${escapar(v)}</strong></td></tr>`)
        .join('')

      const correoServidor = transporte()
      const remitente = process.env.MAIL_FROM || `GUAJIRANET ISP SAS <${process.env.MAIL_USER}>`

      // 1. La solicitud llega al buzón de PQRS. Si esto falla, no se le confirma nada al cliente.
      await correoServidor.sendMail({
        from: remitente,
        to: DESTINO,
        replyTo: correo,
        subject: `${etiqueta} ${radicado} — ${nombre}`,
        text: `${filas.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nDetalle:\n${detalle}`,
        html: `<h2 style="margin:0 0 12px">${etiqueta} ${escapar(radicado)}</h2><table>${tabla}</table><h3>Detalle</h3><p style="white-space:pre-wrap">${escapar(detalle)}</p>`,
        attachments: adjunto ? [adjunto] : [],
      })

      // 2. El número queda usado y se guarda un registro en el servidor, como respaldo del envío.
      await guardarConsecutivo(fecha.getFullYear(), consecutivo)
      await appendFile(
        join(CARPETA_DATOS, 'pqrs.jsonl'),
        JSON.stringify({ radicado, fecha: fecha.toISOString(), tipo, nombre, documento, telefono, correo, municipio, contrato, detalle, adjunto: adjunto?.filename ?? null }) + '\n',
      )

      // 3. Constancia para el cliente. Si falla, la solicitud igual quedó radicada.
      let constanciaEnviada = true
      try {
        await correoServidor.sendMail({
          from: remitente,
          to: correo,
          replyTo: DESTINO,
          subject: `Recibimos tu ${etiqueta.toLowerCase()} — radicado ${radicado}`,
          text:
            `Hola ${nombre}:\n\nRecibimos tu ${etiqueta.toLowerCase()} el ${fechaTexto}.\nTu número de radicado es ${radicado}. Guárdalo para hacerle seguimiento.\n\n` +
            `Tenemos hasta 15 días hábiles para responderte. Te contactaremos a este correo${telefono ? ' o al teléfono que registraste' : ''}.\n\nGUAJIRANET ISP SAS`,
          html:
            `<p>Hola ${escapar(nombre)}:</p><p>Recibimos tu ${etiqueta.toLowerCase()} el ${escapar(fechaTexto)}.</p>` +
            `<p>Tu número de radicado es <strong style="font-size:18px">${escapar(radicado)}</strong>. Guárdalo para hacerle seguimiento.</p>` +
            `<p>Tenemos hasta 15 días hábiles para responderte. Te contactaremos a este correo${telefono ? ' o al teléfono que registraste' : ''}.</p><p>GUAJIRANET ISP SAS</p>`,
        })
      } catch (e) {
        constanciaEnviada = false
        console.error('[pqrs] no se pudo enviar la constancia al cliente:', e instanceof Error ? e.message : e)
      }

      return { radicado, constanciaEnviada }
    })
    return NextResponse.json(respuesta)
  } catch (e) {
    console.error('[pqrs]', e instanceof Error ? e.message : e)
    return fallo(502, 'No pudimos registrar tu solicitud en este momento. Intenta de nuevo en unos minutos o escríbenos por WhatsApp.')
  }
}