'use client'

import { type ChangeEvent, useEffect, useState } from 'react'
import { ArrowRight, Check, CreditCard, FileText, Gauge, KeyRound, MessageCircle } from 'lucide-react'
import { Modal } from '@/components/modal'
import { TestVelocidad } from '@/components/test-velocidad'

const PAGO = 'https://ds.dsnube.co/documento/?empresa=UqBGh1ev+4w5YMySqWUUuWnbyM4NML2QEEUqsYUO93o='
const WHATSAPP = '573009139909'
const CORREO = 'info@guajiranet.com'

type Vista = null | 'velocidad' | 'pqrs' | 'clave'

const TIPOS_PQRS = [
  ['peticion', 'Petición', 'Solicitas información sobre tu servicio.'],
  ['queja', 'Queja', 'Manifiestas inconformidad con la atención recibida.'],
  ['reclamo', 'Reclamo', 'Pides revisar un cobro o una falla del servicio.'],
  ['sugerencia', 'Sugerencia', 'Propones algo para que mejoremos.'],
] as const

const MUNICIPIOS = ['Albania', 'Fonseca', 'Riohacha', 'Maicao', 'Uribia', 'Manaure', 'Otro']

function radicado(prefijo: string) {
  const d = new Date()
  const fecha = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `${prefijo}-${fecha}-${String(Math.floor(Math.random() * 9000) + 1000)}`
}

function FormPqrs() {
  const [tipo, setTipo] = useState<string>('peticion')
  const [datos, setDatos] = useState({ nombre: '', documento: '', telefono: '', correo: '', municipio: 'Albania', contrato: '', detalle: '' })
  const [archivo, setArchivo] = useState<File | null>(null)
  const [archivoError, setArchivoError] = useState('')
  const [enviado, setEnviado] = useState<string | null>(null)

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

  const mensaje = () =>
    `*${etiqueta} — GuajiraNet*\n` +
    `Radicado: ${enviado}\n` +
    `Nombre: ${datos.nombre}\nDocumento: ${datos.documento}\n` +
    `Teléfono: ${datos.telefono}\nCorreo: ${datos.correo}\n` +
    `Municipio: ${datos.municipio}\nContrato: ${datos.contrato || 'no indicado'}\nAdjunto: ${archivo?.name || 'no adjunto'}\n\n${datos.detalle}`

  if (enviado) {
    return (
      <div className="ok-panel">
        <span className="ok-icono"><Check size={26} /></span>
        <h4>Tu {etiqueta.toLowerCase()} quedó registrada</h4>
        <p>Guarda este número para hacerle seguimiento:</p>
        <strong className="ok-radicado">{enviado}</strong>
        <p className="ok-plazo">
          Por la Resolución CRC 5050 tenemos hasta 15 días hábiles para responderte. Te contactaremos al correo y
          teléfono que registraste.
        </p>
        <div className="ok-acciones">
          <a className="pcard-cta" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje())}`} target="_blank" rel="noreferrer">
            Enviar por WhatsApp <MessageCircle size={17} />
          </a>
          <a className="boton-suave" href={`mailto:${CORREO}?subject=${encodeURIComponent(`${etiqueta} ${enviado}`)}&body=${encodeURIComponent(mensaje())}`}>
            Enviar por correo
          </a>
        </div>
      </div>
    )
  }

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        setEnviado(radicado('PQRS'))
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

      <button type="submit" className="pcard-cta">Radicar <ArrowRight size={17} /></button>
      <p className="form-nota">Al radicar aceptas el tratamiento de tus datos conforme a la Ley 1581 de 2012.</p>
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
  const r = await fetch('/api/cambio-clave', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  })
  const datos = await r.json().catch(() => null)
  if (!r.ok) throw new Error(datos?.mensaje ?? 'No pudimos completar la solicitud. Escríbenos por WhatsApp.')
  return datos
}

const ESTADOS_TAREA: Record<string, string> = {
  en_cola: 'En cola: tu solicitud está esperando turno.',
  en_proceso: 'Aplicando el cambio en tu router…',
  fallido: 'No se pudo aplicar el cambio. Escríbenos por WhatsApp y lo revisamos.',
}

function FormClave() {
  const [paso, setPaso] = useState<'datos' | 'clave' | 'listo'>('datos')
  const [datos, setDatos] = useState({ cedula: '', celular: '', clave: '', repetir: '', red: '' })
  const [equipos, setEquipos] = useState<EquipoWeb[]>([])
  const [equipo, setEquipo] = useState('')
  const [cargando, setCargando] = useState(false)
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
        if (/complet|exit|ok|done|aplic|fallido/i.test(String(r.estado))) return
      } catch {
        if (!vivo) return
      }
      if (++vueltas < 15) temporizador = window.setTimeout(revisar, 4000)
    }
    let temporizador = window.setTimeout(revisar, 2500)
    return () => {
      vivo = false
      window.clearTimeout(temporizador)
    }
  }, [resultado])

  const verificar = async () => {
    setCargando(true)
    setError('')
    try {
      const r = await pedirCambioClave({ accion: 'verificar', cedula: datos.cedula, celular: datos.celular })
      const lista = (r.equipos ?? []) as EquipoWeb[]
      setEquipos(lista)
      setEquipo(lista.length === 1 ? lista[0].id : '')
      setPaso('clave')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos verificar tus datos.')
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
        celular: datos.celular,
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
    const aplicado = /complet|exit|ok|done|aplic/i.test(estadoTarea)
    return (
      <div className="ok-panel">
        <span className="ok-icono"><Check size={26} /></span>
        <h4>{aplicado ? 'Clave cambiada' : 'Recibimos tu cambio de clave'}</h4>
        <p>Número de seguimiento:</p>
        <strong className="ok-radicado">{resultado.tarea}</strong>
        <p className="ok-plazo">
          {resultado.estado === 'equipo_apagado'
            ? 'Tu router está apagado o sin conexión. El cambio se aplicará automáticamente cuando vuelva a conectarse.'
            : aplicado
              ? 'Ya puedes conectar tus dispositivos con la nueva clave.'
              : (ESTADOS_TAREA[estadoTarea] ?? 'El cambio se aplica en tu router en unos minutos.')}{' '}
          Al aplicarse, todos tus dispositivos se desconectan y debes volver a conectarlos con la clave nueva
          {datos.red ? ` en la red «${datos.red}»` : ''}.
        </p>
        <div className="ok-acciones">
          <a className="boton-suave" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola, hice un cambio de clave WiFi desde la página. Seguimiento ${resultado.tarea}.`)}`} target="_blank" rel="noreferrer">
            ¿Problemas? Escríbenos <MessageCircle size={17} />
          </a>
        </div>
      </div>
    )
  }

  if (paso === 'datos') {
    return (
      <form className="form" onSubmit={(e) => { e.preventDefault(); verificar() }}>
        <p className="form-ayuda-clave">Primero confirmamos que eres el titular del servicio.</p>
        <div className="form-grid">
          <label>Cédula del titular *<input required inputMode="numeric" autoComplete="off" value={datos.cedula} onChange={(e) => set('cedula', e.target.value)} placeholder="Sin puntos ni espacios" /></label>
          <label>Celular registrado *<input required inputMode="tel" autoComplete="tel" value={datos.celular} onChange={(e) => set('celular', e.target.value)} placeholder="El que nos diste al contratar" /></label>
        </div>
        {error && <em className="form-error">{error}</em>}
        <button type="submit" className="pcard-cta" disabled={cargando}>{cargando ? 'Verificando…' : 'Continuar'} <ArrowRight size={17} /></button>
        <p className="form-nota">Usamos estos datos solo para verificar tu identidad, conforme a la Ley 1581 de 2012.</p>
      </form>
    )
  }

  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); if (valido) cambiar() }}>
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

export function Autogestion() {
  const [vista, setVista] = useState<Vista>(null)

  const tarjetas = [
    { icono: CreditCard, titulo: 'Pagar factura', texto: 'Paga en línea de forma rápida y segura, sin salir de casa.', accion: 'Ir a pagar', href: PAGO, whatsapp: false },
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
