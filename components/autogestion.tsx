'use client'

import { type ChangeEvent, useState } from 'react'
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

function FormClave() {
  const [datos, setDatos] = useState({ nombre: '', apellido: '', documento: '', telefono: '', correo: '', claveActual: '', red: '', nuevaRed: '', clave: '', repetir: '', detalle: '' })
  const [enviado, setEnviado] = useState<string | null>(null)
  const set = (k: string, v: string) => setDatos((d) => ({ ...d, [k]: v }))

  const nivel = fuerza(datos.clave)
  const coincide = datos.clave.length > 0 && datos.clave === datos.repetir
  const valido = datos.clave.length >= 8 && coincide

  if (enviado) {
    return (
      <div className="ok-panel">
        <span className="ok-icono"><Check size={26} /></span>
        <h4>Solicitud de cambio registrada</h4>
        <p>Número de seguimiento:</p>
        <strong className="ok-radicado">{enviado}</strong>
        <p className="ok-plazo">
          Un técnico aplicará el cambio en tu router y te confirmará. Por seguridad nunca enviamos contraseñas por
          WhatsApp ni por correo: te llamamos al número registrado para verificar tu identidad.
        </p>
        <div className="ok-acciones">
          <a className="pcard-cta" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola, solicité un cambio de clave WiFi. Radicado ${enviado}. Documento ${datos.documento}.`)}`} target="_blank" rel="noreferrer">
            Avisar por WhatsApp <MessageCircle size={17} />
          </a>
        </div>
      </div>
    )
  }

  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); setEnviado(radicado('CLV')) }}>
      <div className="form-grid">
        <label>Tu nombre *<input required value={datos.nombre} onChange={(e) => set('nombre', e.target.value)} /></label>
        <label>Tu apellido *<input required value={datos.apellido} onChange={(e) => set('apellido', e.target.value)} /></label>
        <label>Cédula *<input required inputMode="numeric" value={datos.documento} onChange={(e) => set('documento', e.target.value)} /></label>
        <label>Celular *<input required inputMode="tel" value={datos.telefono} onChange={(e) => set('telefono', e.target.value)} /></label>
        <label>Tu correo *<input required type="email" value={datos.correo} onChange={(e) => set('correo', e.target.value)} /></label>
        <label>Clave actual *<input required type="password" value={datos.claveActual} onChange={(e) => set('claveActual', e.target.value)} /></label>
        <label>Nombre WiFi <i>(opcional)</i><input value={datos.red} onChange={(e) => set('red', e.target.value)} placeholder="Ej: GUAJIRANET-4821" /></label>
        <label>Nuevo nombre WiFi <i>(opcional)</i><input value={datos.nuevaRed} onChange={(e) => set('nuevaRed', e.target.value)} /></label>
        <label>Clave nueva *<input required type="password" minLength={8} pattern="[A-Za-z0-9]{8,}" title="Usa al menos 8 caracteres alfanuméricos" value={datos.clave} onChange={(e) => set('clave', e.target.value)} /></label>
        <label>Repetir clave *<input required type="password" value={datos.repetir} onChange={(e) => set('repetir', e.target.value)} /></label>
      </div>

      <p className="form-ayuda-clave">Las claves deben tener 8 caracteres alfanuméricos.</p>

      {datos.clave && (
        <div className="fuerza">
          <div className="fuerza-barras">
            {[0, 1, 2, 3].map((i) => <span key={i} className={i < nivel ? `on n${nivel}` : ''} />)}
          </div>
          <small>{NIVELES[nivel]}</small>
        </div>
      )}

      {datos.repetir && !coincide && <em className="form-error">Las contraseñas no coinciden.</em>}

      <label className="form-ancho">
        Observaciones <i>(opcional)</i>
        <textarea rows={4} value={datos.detalle} onChange={(e) => set('detalle', e.target.value)} placeholder="Escribe alguna observación adicional." />
      </label>

      <button type="submit" className="pcard-cta" disabled={!valido}>Enviar clave <ArrowRight size={17} /></button>
      <p className="form-nota">
        Al cambiar la clave se desconectarán todos los dispositivos: tendrás que volver a conectarlos con la nueva
        contraseña.
      </p>
    </form>
  )
}

export function Autogestion() {
  const [vista, setVista] = useState<Vista>(null)

  const tarjetas = [
    { icono: CreditCard, titulo: 'Pagar factura', texto: 'Paga en línea de forma rápida y segura, sin salir de casa.', accion: 'Ir a pagar', href: PAGO },
    { icono: Gauge, titulo: 'Test de velocidad', texto: 'Mide en segundos la velocidad real de tu conexión.', accion: 'Medir ahora', vista: 'velocidad' as const },
    { icono: FileText, titulo: 'Presentar un PQRS', texto: 'Radica tu petición, queja, reclamo o sugerencia.', accion: 'Radicar', vista: 'pqrs' as const },
    { icono: KeyRound, titulo: 'Cambio de clave', texto: 'Actualiza la contraseña de tu red WiFi cuando quieras.', accion: 'Cambiar clave', vista: 'clave' as const },
  ]

  return (
    <section id="autogestion" className="section autogestion">
      <div className="container">
        <div className="section-heading">
          <div data-revelar="izq">
            <div className="eyebrow">Hazlo tú mismo, cuando quieras</div>
            <h2>Tu servicio,<br />en tus manos.</h2>
          </div>
          <p data-revelar="der">Las gestiones más comunes, resueltas<br />en menos de un minuto y sin llamar.</p>
        </div>

        <div className="auto-grid">
          {tarjetas.map(({ icono: Icono, titulo, texto, accion, href, vista: v }, i) =>
            href ? (
              <a className="auto-card" href={href} target="_blank" rel="noreferrer" key={titulo} data-revelar data-delay={i * 100}>
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

      <Modal abierto={vista === 'clave'} onCerrar={() => setVista(null)} titulo="Cambio de clave WiFi" subtitulo="Solicita una contraseña nueva para tu red" ancho={900}>
        <FormClave />
      </Modal>
    </section>
  )
}
