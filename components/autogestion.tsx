'use client'

import { type ChangeEvent, useEffect, useState } from 'react'
import { ArrowRight, Check, Clock, CreditCard, FileText, Gauge, KeyRound, Loader2, MessageCircle, TriangleAlert } from 'lucide-react'
import { Modal } from '@/components/modal'
import { TestVelocidad } from '@/components/test-velocidad'
import { MUNICIPIOS_CON_COBERTURA } from '@/lib/cobertura'
import { PORTALES_PAGO } from '@/lib/pagos'
import { url } from '@/lib/base-path'

const PAGO = 'https://ds.dsnube.co/documento/?empresa=UqBGh1ev+4w5YMySqWUUuWnbyM4NML2QEEUqsYUO93o='
// Portal de OnePay (Guajiranet Pay), el mismo de las tarjetas del inicio.
const PAGO_ONEPAY = PORTALES_PAGO.find((p) => p.clave === 'pay')!.href
const WHATSAPP = '573009139909'
const CORREO = 'info@guajiranet.com'

type Vista = null | 'velocidad' | 'pqrs' | 'clave'

const TIPOS_PQRS = [
  ['peticion', 'Petición', 'Solicitas información sobre tu servicio.'],
  ['queja', 'Queja', 'Manifiestas inconformidad con la atención recibida.'],
  ['reclamo', 'Reclamo', 'Pides revisar un cobro o una falla del servicio.'],
  ['sugerencia', 'Sugerencia', 'Propones algo para que mejoremos.'],
] as const

const MUNICIPIOS = [...MUNICIPIOS_CON_COBERTURA.map((m) => m.name).sort((a, b) => a.localeCompare(b, 'es')), 'Otro']

function FormPqrs() {
  const [tipo, setTipo] = useState<string>('peticion')
  const [datos, setDatos] = useState({ nombre: '', documento: '', telefono: '', correo: '', municipio: MUNICIPIOS[0], contrato: '', detalle: '' })
  const [archivo, setArchivo] = useState<File | null>(null)
  const [archivoError, setArchivoError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState<{ radicado: string; constanciaEnviada: boolean } | null>(null)
  const [autoriza, setAutoriza] = useState(false)

  const set = (k: string, v: string) => setDatos((d) => ({ ...d, [k]: v }))
  const seleccionarArchivo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (file && file.size > 5 * 1024 * 1024) {
      e.target.value = ''
      setArchivo(null)
      setArchivoError('El archivo no puede superar los 5 MB.')
      return
    }
    setArchivo(file)
    setArchivoError('')
  }
  const etiqueta = TIPOS_PQRS.find((t) => t[0] === tipo)![1]

  const radicar = async () => {
    setEnviando(true)
    setError('')
    try {
      const cuerpo = new FormData()
      cuerpo.append('tipo', tipo)
      Object.entries(datos).forEach(([k, v]) => cuerpo.append(k, v))
      if (archivo) cuerpo.append('archivo', archivo)
      cuerpo.append('autorizacion', autoriza ? 'si' : 'no')
      const r = await fetch(url('/api/pqrs'), { method: 'POST', body: cuerpo })
      const respuesta = await r.json().catch(() => null)
      if (!r.ok || !respuesta?.radicado) throw new Error(respuesta?.mensaje ?? 'No pudimos registrar tu solicitud. Intenta de nuevo o escríbenos por WhatsApp.')
      setEnviado(respuesta)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos registrar tu solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className="ok-panel">
        <span className="ok-icono"><Check size={26} /></span>
        <h4>Radicamos tu {etiqueta.toLowerCase()}</h4>
        <p>Guarda este número para hacerle seguimiento:</p>
        <strong className="ok-radicado">{enviado.radicado}</strong>
        <p className="ok-plazo">
          Por la Resolución CRC 5050 tenemos hasta 15 días hábiles para responderte.{' '}
          {enviado.constanciaEnviada
            ? `Te enviamos una constancia a ${datos.correo}.`
            : 'No pudimos enviarte la constancia por correo, así que anota el número.'}{' '}
          Te contactaremos al correo y teléfono que registraste.
        </p>
        <div className="ok-acciones">
          <a className="boton-suave" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola, radiqué una ${etiqueta.toLowerCase()} en la página. Radicado ${enviado.radicado}.`)}`} target="_blank" rel="noreferrer">
            ¿Dudas? Escríbenos <MessageCircle size={17} />
          </a>
        </div>
      </div>
    )
  }

  return (
    <form
      className="form"
      method="post"
      onSubmit={(e) => {
        e.preventDefault()
        radicar()
      }}
    >
      <fieldset className="form-tipos">
        <legend>¿Qué necesitas radicar?</legend>
        {TIPOS_PQRS.map(([id, nombre, ayuda]) => (
          <label key={id} className={tipo === id ? 'on' : ''}>
            <input type="radio" name="tipo" value={id} checked={tipo === id} onChange={() => setTipo(id)} />
            <strong>{nombre}</strong>
            <small>{ayuda}</small>
          </label>
        ))}
      </fieldset>

      <div className="form-grid">
        <label>Nombre completo *<input required value={datos.nombre} onChange={(e) => set('nombre', e.target.value)} /></label>
        <label>Documento *<input required inputMode="numeric" value={datos.documento} onChange={(e) => set('documento', e.target.value)} /></label>
        <label>Teléfono <i>(opcional)</i><input inputMode="tel" value={datos.telefono} onChange={(e) => set('telefono', e.target.value)} /></label>
        <label>Correo *<input required type="email" value={datos.correo} onChange={(e) => set('correo', e.target.value)} /></label>
        <label>Municipio
          <select value={datos.municipio} onChange={(e) => set('municipio', e.target.value)}>
            {MUNICIPIOS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label>N.º de contrato <i>(opcional)</i><input value={datos.contrato} onChange={(e) => set('contrato', e.target.value)} /></label>
      </div>

      <label className="form-ancho">
        Cuéntanos qué pasó
        <textarea required rows={5} minLength={20} value={datos.detalle} onChange={(e) => set('detalle', e.target.value)} placeholder="Describe la situación con fecha, hora y lo que observaste." />
      </label>

      <label className="form-ancho form-archivo">
        Adjunta imagen del problema <i>(opcional)</i>
        <input type="file" accept="image/*,.pdf" onChange={seleccionarArchivo} />
        <small className="form-archivo-ayuda">Puedes adjuntar una imagen o PDF de máximo 5 MB.</small>
        {archivoError && <em className="form-error">{archivoError}</em>}
      </label>

      <label className="form-autoriza">
        <input type="checkbox" required checked={autoriza} onChange={(e) => setAutoriza(e.target.checked)} />
        <span>
          Autorizo a GUAJIRANET ISP S.A.S. a tratar mis datos personales para atender esta solicitud, según su{' '}
          <a href={url('/legal/politica-tratamiento-datos.pdf')} target="_blank" rel="noreferrer">Política de Tratamiento de Datos Personales</a>.
        </span>
      </label>

      {error && <em className="form-error">{error}</em>}
      <button type="submit" className="pcard-cta" disabled={enviando || !autoriza}>{enviando ? 'Radicando…' : 'Radicar'} <ArrowRight size={17} /></button>
    </form>
  )
}

function fuerza(c: string) {
  let p = 0
  if (c.length >= 8) p++
  if (c.length >= 12) p++
  if (/[A-Z]/.test(c) && /[a-z]/.test(c)) p++
  if (/\d/.test(c)) p++
  if (/[^A-Za-z0-9]/.test(c)) p++
  return Math.min(p, 4)
}

const NIVELES = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente']

type EquipoWeb = { id: string; red: string }
type ResultadoClave = { estado: 'en_cola' | 'equipo_apagado'; tarea: number; firma: string }

async function pedirCambioClave(cuerpo: Record<string, unknown>) {
  const r = await fetch(url('/api/cambio-clave'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  })
  const datos = await r.json().catch(() => null)
  if (!r.ok) throw new Error(datos?.mensaje ?? 'No pudimos completar la solicitud. Escríbenos por WhatsApp.')
  return datos
}

// Estados de una tarea según la API del ACS (sección 1.3): en_cola → en_proceso → enviado → confirmado | fallido.
const ESTADOS_TAREA: Record<string, string> = {
  en_cola: 'Tu solicitud está en turno para enviarse a tu router…',
  en_proceso: 'Enviando el cambio a tu router…',
  enviado: 'Tu router recibió el cambio. Estamos confirmando que quedó aplicado…',
}
const ESTADOS_FINALES = ['confirmado', 'fallido']
// La tarea suele resolverse en menos de 30 s, con hasta 5 reintentos: se consulta cada 3 s durante unos 2 minutos.
const MAX_CONSULTAS = 40

function FormClave() {
  const [paso, setPaso] = useState<'datos' | 'codigo' | 'clave' | 'listo'>('datos')
  const [datos, setDatos] = useState({ cedula: '', codigo: '', clave: '', repetir: '', red: '' })
  const [correo, setCorreo] = useState('')
  const [sesion, setSesion] = useState('')
  // Cuenta regresiva del código: momento en que vence y segundos que faltan.
  const [venceEn, setVenceEn] = useState(0)
  const [restante, setRestante] = useState(0)

  useEffect(() => {
    if (!venceEn) return
    const tic = () => setRestante(Math.max(0, Math.ceil((venceEn - Date.now()) / 1000)))
    tic()
    const t = window.setInterval(tic, 1000)
    return () => window.clearInterval(t)
  }, [venceEn])

  const vencido = venceEn > 0 && restante === 0
  const reloj = `${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')}`
  const [equipos, setEquipos] = useState<EquipoWeb[]>([])
  const [equipo, setEquipo] = useState('')
  const [cargando, setCargando] = useState(false)
  const [autoriza, setAutoriza] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState<ResultadoClave | null>(null)
  const [estadoTarea, setEstadoTarea] = useState('')
  const set = (k: string, v: string) => setDatos((d) => ({ ...d, [k]: v }))

  const nivel = fuerza(datos.clave)
  const coincide = datos.clave.length > 0 && datos.clave === datos.repetir
  const valido = /^[A-Za-z0-9]{8,32}$/.test(datos.clave) && coincide && (equipos.length < 2 || !!equipo)

  // Después de encolar, se consulta el estado de la tarea unas cuantas veces.
  useEffect(() => {
    if (!resultado) return
    let vueltas = 0
    let vivo = true
    const revisar = async () => {
      try {
        const r = await pedirCambioClave({ accion: 'estado', tarea: resultado.tarea, firma: resultado.firma })
        if (!vivo) return
        setEstadoTarea(String(r.estado ?? ''))
        if (ESTADOS_FINALES.includes(String(r.estado))) return
      } catch {
        if (!vivo) return
      }
      if (++vueltas < MAX_CONSULTAS) temporizador = window.setTimeout(revisar, 3000)
      else setEstadoTarea('demorado')
    }
    let temporizador = window.setTimeout(revisar, 2000)
    return () => {
      vivo = false
      window.clearTimeout(temporizador)
    }
  }, [resultado])

  const enviarCodigo = async () => {
    setCargando(true)
    setError('')
    try {
      const r = await pedirCambioClave({ accion: 'enviar-codigo', cedula: datos.cedula, autorizacion: autoriza })
      setCorreo(String(r.correo ?? ''))
      setVenceEn(Date.now() + (Number(r.segundos) || 600) * 1000)
      set('codigo', '')
      setPaso('codigo')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos enviar el código.')
    } finally {
      setCargando(false)
    }
  }

  const verificarCodigo = async () => {
    setCargando(true)
    setError('')
    try {
      const r = await pedirCambioClave({ accion: 'verificar-codigo', cedula: datos.cedula, codigo: datos.codigo })
      const lista = (r.equipos ?? []) as EquipoWeb[]
      setSesion(String(r.sesion ?? ''))
      setEquipos(lista)
      setEquipo(lista.length === 1 ? lista[0].id : '')
      setPaso('clave')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos verificar el código.')
    } finally {
      setCargando(false)
    }
  }

  const cambiar = async () => {
    setCargando(true)
    setError('')
    try {
      const r = (await pedirCambioClave({
        accion: 'cambiar',
        cedula: datos.cedula,
        sesion,
        equipo,
        clave: datos.clave,
        red: datos.red,
      })) as ResultadoClave
      setResultado(r)
      setPaso('listo')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cambiar la clave.')
    } finally {
      setCargando(false)
    }
  }

  if (paso === 'listo' && resultado) {
    const aplicado = estadoTarea === 'confirmado'
    const fallido = estadoTarea === 'fallido'
    const apagado = resultado.estado === 'equipo_apagado' && !aplicado && !fallido
    const red = datos.red || equipos.find((e) => e.id === equipo)?.red || equipos[0]?.red
    const enRed = red ? ` a la red «${red}»` : ''
    const estado = aplicado ? 'exito' : fallido ? 'error' : apagado || estadoTarea === 'demorado' ? 'espera' : 'proceso'

    return (
      <div className={`ok-panel clave-${estado}`} role="status" aria-live="polite">
        <span className="ok-icono">
          {estado === 'exito' && <Check size={26} />}
          {estado === 'error' && <TriangleAlert size={26} />}
          {estado === 'espera' && <Clock size={26} />}
          {estado === 'proceso' && <Loader2 size={26} className="clave-girando" />}
        </span>

        {estado === 'exito' && (
          <>
            <h4>¡Listo! Tu clave fue cambiada</h4>
            <p className="ok-plazo">
              Tu router ya tiene la clave nueva. Verifícalo conectándote{enRed} con tu <strong>contraseña nueva</strong>.
              Todos tus dispositivos se desconectaron: vuelve a conectarlos con esa misma clave.
            </p>
          </>
        )}
        {estado === 'error' && (
          <>
            <h4>No pudimos cambiar tu clave</h4>
            <p className="ok-plazo">
              Tu router no confirmó el cambio, así que tu clave anterior sigue funcionando. Escríbenos por WhatsApp con el número de
              seguimiento y lo revisamos.
            </p>
          </>
        )}
        {estado === 'espera' && (
          <>
            <h4>{apagado ? 'Tu router está apagado o sin conexión' : 'Tu cambio sigue en proceso'}</h4>
            <p className="ok-plazo">
              {apagado
                ? 'Guardamos tu cambio: se aplicará solo cuando el router vuelva a conectarse.'
                : 'Está tardando más de lo normal, pero el sistema lo sigue intentando.'}{' '}
              Cuando se aplique, tus dispositivos se desconectarán y deberás conectarlos con la contraseña nueva.
            </p>
          </>
        )}
        {estado === 'proceso' && (
          <>
            <h4>Aplicando tu clave nueva…</h4>
            <p className="ok-plazo">{ESTADOS_TAREA[estadoTarea] ?? 'Enviando el cambio a tu router…'} No cierres esta ventana, suele tardar menos de un minuto.</p>
          </>
        )}

        <p>Número de seguimiento:</p>
        <strong className="ok-radicado">{resultado.tarea}</strong>
        <div className="ok-acciones">
          <a className="boton-suave" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola, hice un cambio de clave WiFi desde la página. Seguimiento ${resultado.tarea}.`)}`} target="_blank" rel="noreferrer">
            {estado === 'exito' ? '¿Problemas para conectarte?' : 'Escríbenos'} <MessageCircle size={17} />
          </a>
        </div>
      </div>
    )
  }

  if (paso === 'datos') {
    return (
      <form className="form" method="post" onSubmit={(e) => { e.preventDefault(); enviarCodigo() }}>
        <p className="form-ayuda-clave">Primero confirmamos que eres el titular: te enviaremos un código al correo que registraste con nosotros.</p>
        <div className="form-grid">
          <label>Cédula del titular *<input required inputMode="numeric" autoComplete="off" value={datos.cedula} onChange={(e) => set('cedula', e.target.value)} placeholder="Sin puntos ni espacios" /></label>
        </div>
        <label className="form-autoriza">
          <input type="checkbox" required checked={autoriza} onChange={(e) => setAutoriza(e.target.checked)} />
          <span>
            Autorizo a GUAJIRANET ISP S.A.S. a usar mi cédula y mi correo registrado para verificar que soy el titular del servicio, según su{' '}
            <a href={url('/legal/politica-tratamiento-datos.pdf')} target="_blank" rel="noreferrer">Política de Tratamiento de Datos Personales</a>.
          </span>
        </label>
        {error && <em className="form-error">{error}</em>}
        <button type="submit" className="pcard-cta" disabled={cargando || !autoriza}>{cargando ? 'Enviando código…' : 'Enviar código'} <ArrowRight size={17} /></button>
      </form>
    )
  }

  if (paso === 'codigo') {
    return (
      <form className="form" method="post" onSubmit={(e) => { e.preventDefault(); verificarCodigo() }}>
        <p className="form-ayuda-clave">Te enviamos un código de 6 dígitos a <strong>{correo}</strong>. Si no lo ves, revisa la carpeta de spam.</p>
        <div className={`codigo-reloj ${vencido ? 'vencido' : restante <= 60 ? 'poco' : ''}`} role="timer" aria-live="off">
          {vencido ? (
            <span>El código venció. Pide uno nuevo.</span>
          ) : (
            <>
              <span>El código vence en</span> <strong>{reloj}</strong>
            </>
          )}
          <i className="codigo-reloj-barra" style={{ width: `${Math.min(100, (restante / 600) * 100)}%` }} aria-hidden="true" />
        </div>
        <div className="form-grid">
          <label>Código *<input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}" value={datos.codigo} onChange={(e) => set('codigo', e.target.value.replace(/\D/g, ''))} placeholder="000000" /></label>
        </div>
        {error && <em className="form-error">{error}</em>}
        <button type="submit" className="pcard-cta" disabled={cargando || vencido || datos.codigo.length !== 6}>{cargando ? 'Verificando…' : 'Verificar código'} <ArrowRight size={17} /></button>
        <p className="form-nota">
          ¿No te llegó? <button type="button" className="boton-enlace" disabled={cargando} onClick={enviarCodigo}>Enviar otro código</button>
          {' '}· <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola, quiero cambiar la clave de mi WiFi y no me llega el código al correo.')}`} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
        </p>
      </form>
    )
  }

  return (
    <form className="form" method="post" onSubmit={(e) => { e.preventDefault(); if (valido) cambiar() }}>
      {equipos.length > 1 && (
        <fieldset className="form-tipos">
          <legend>¿Qué red quieres cambiar?</legend>
          {equipos.map((eq) => (
            <label key={eq.id} className={equipo === eq.id ? 'on' : ''}>
              <input type="radio" name="equipo" value={eq.id} checked={equipo === eq.id} onChange={() => setEquipo(eq.id)} />
              <strong>{eq.red}</strong>
            </label>
          ))}
        </fieldset>
      )}
      {equipos.length === 1 && <p className="form-ayuda-clave">Vas a cambiar la clave de la red <strong>{equipos[0].red}</strong>.</p>}

      <div className="form-grid">
        <label>Clave nueva *<input required type="password" autoComplete="new-password" minLength={8} maxLength={32} pattern="[A-Za-z0-9]{8,32}" title="Entre 8 y 32 letras o números" value={datos.clave} onChange={(e) => set('clave', e.target.value)} /></label>
        <label>Repetir clave *<input required type="password" autoComplete="new-password" value={datos.repetir} onChange={(e) => set('repetir', e.target.value)} /></label>
        <label>Nuevo nombre WiFi <i>(opcional)</i><input maxLength={32} value={datos.red} onChange={(e) => set('red', e.target.value)} placeholder="Déjalo vacío para no cambiarlo" /></label>
      </div>

      <p className="form-ayuda-clave">La clave debe tener entre 8 y 32 letras o números, sin espacios ni símbolos.</p>

      {datos.clave && (
        <div className="fuerza">
          <div className="fuerza-barras">
            {[0, 1, 2, 3].map((i) => <span key={i} className={i < nivel ? `on n${nivel}` : ''} />)}
          </div>
          <small>{NIVELES[nivel]}</small>
        </div>
      )}

      {datos.repetir && !coincide && <em className="form-error">Las contraseñas no coinciden.</em>}
      {error && <em className="form-error">{error}</em>}

      <button type="submit" className="pcard-cta" disabled={!valido || cargando}>{cargando ? 'Enviando…' : 'Cambiar clave'} <ArrowRight size={17} /></button>
      <p className="form-nota">
        Al cambiar la clave se desconectarán todos los dispositivos: tendrás que volver a conectarlos con la nueva contraseña.
      </p>
    </form>
  )
}

/** Evento para abrir una ventana de autogestión desde otra parte de la página (por ejemplo, el enlace de PQRS del pie). */
export const EVENTO_AUTOGESTION = 'guajiranet:autogestion'

export function Autogestion() {
  const [vista, setVista] = useState<Vista>(null)

  useEffect(() => {
    const alPedir = (e: Event) => {
      const cual = (e as CustomEvent<Vista>).detail
      if (cual === 'pqrs' || cual === 'clave' || cual === 'velocidad') setVista(cual)
    }
    window.addEventListener(EVENTO_AUTOGESTION, alPedir)
    return () => window.removeEventListener(EVENTO_AUTOGESTION, alPedir)
  }, [])

  // Las direcciones de la web vieja llegan con ?abrir=pqrs, ?abrir=clave o ?abrir=velocidad (ver next.config.mjs).
  useEffect(() => {
    const url = new URL(window.location.href)
    const cual = url.searchParams.get('abrir')
    if (cual !== 'pqrs' && cual !== 'clave' && cual !== 'velocidad') return
    setVista(cual)
    url.searchParams.delete('abrir')
    window.history.replaceState(null, '', url.pathname + url.search + url.hash)
  }, [])

  const tarjetas = [
    { icono: CreditCard, titulo: 'Pagar factura', texto: 'Paga en línea con Guajiranet Pay: PSE, tarjeta y más, sin salir de casa.', accion: 'Ir a pagar', href: PAGO_ONEPAY, whatsapp: false },
    // Pago con Wompi desactivado por ahora. Para activarlo de nuevo, descomenta esta línea (y comenta la de OnePay de arriba).
    // { icono: CreditCard, titulo: 'Pagar factura', texto: 'Paga en línea de forma rápida y segura, sin salir de casa.', accion: 'Ir a pagar', href: PAGO, whatsapp: false },
    { icono: Gauge, titulo: 'Test de velocidad', texto: 'Mide en segundos la velocidad real de tu conexión.', accion: 'Medir ahora', vista: 'velocidad' as const, whatsapp: false },
    { icono: FileText, titulo: 'Presentar un PQRS', texto: 'Radica tu petición, queja, reclamo o sugerencia.', accion: 'Radicar', vista: 'pqrs' as const, whatsapp: false },
    { icono: KeyRound, titulo: 'Cambio de clave', texto: 'Actualiza la contraseña de tu red WiFi cuando quieras.', accion: 'Cambiar clave', vista: 'clave' as const, whatsapp: false },
    { icono: MessageCircle, titulo: 'Hablar por WhatsApp', texto: 'Escríbenos para recibir orientación rápida y cercana.', accion: 'Escríbenos', href: `https://wa.me/${WHATSAPP}`, whatsapp: true },
  ]

  return (
    <section id="autogestion" className="section autogestion">
      <div className="container">
        <div className="section-heading">
          <div data-revelar="izq">
            <h2>Resuelve en minutos</h2>
          </div>
          <p data-revelar="der">Paga tu factura, mide tu velocidad, radica un PQRS o cambia la clave del WiFi sin llamar.</p>
        </div>

        <div className="auto-grid">
          {tarjetas.map(({ icono: Icono, titulo, texto, accion, href, vista: v, whatsapp }, i) =>
            href ? (
              <a className={`auto-card${whatsapp ? ' auto-card-whatsapp' : ''}`} href={href} target="_blank" rel="noreferrer" key={titulo} data-revelar data-delay={i * 100}>
                <span className="auto-icono"><Icono size={21} /></span>
                <strong>{titulo}</strong>
                <small>{texto}</small>
                <em>{accion} <ArrowRight size={14} /></em>
              </a>
            ) : (
              <button type="button" className="auto-card" key={titulo} data-revelar data-delay={i * 100} onClick={() => setVista(v!)}>
                <span className="auto-icono"><Icono size={21} /></span>
                <strong>{titulo}</strong>
                <small>{texto}</small>
                <em>{accion} <ArrowRight size={14} /></em>
              </button>
            ),
          )}
        </div>
      </div>

      <Modal abierto={vista === 'velocidad'} onCerrar={() => setVista(null)} titulo="Test de velocidad" subtitulo="Mide tu conexión con el test oficial de Fast.com" ancho={760}>
        <TestVelocidad />
      </Modal>

      <Modal abierto={vista === 'pqrs'} onCerrar={() => setVista(null)} titulo="Presentar un PQRS" subtitulo="Petición, queja, reclamo o sugerencia" ancho={940}>
        <FormPqrs />
      </Modal>

      <Modal abierto={vista === 'clave'} onCerrar={() => setVista(null)} titulo="Cambio de clave WiFi" subtitulo="Cambia la contraseña de tu red desde aquí" ancho={760}>
        <FormClave />
      </Modal>
    </section>
  )
}
