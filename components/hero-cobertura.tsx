'use client'

import { useRef, useState, type MouseEvent } from 'react'
import { ArrowRight, Check, Loader2, MapPin, MessageCircle, Search, TriangleAlert } from 'lucide-react'
import { buscarCobertura, EVENTO_COBERTURA, normalizar, SUGERENCIAS_COBERTURA, whatsappCobertura, type Hallazgo } from '@/lib/cobertura'
import { buscarDireccion, formatearDistancia, verificarPunto, type EstadoCobertura } from '@/lib/cobertura-geo'

// Atajos para probar sin escribir: la sede (Albania) y los municipios con más cobertura.
const RAPIDOS = ['Albania', 'San Juan del Cesar', 'Fonseca', 'Hatonuevo']

const irA = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
  e.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** Una dirección ubicada en el mapa y revisada contra las zonas de cobertura. */
type Punto = { tipo: 'punto'; estado: EstadoCobertura; etiqueta: string; zona: string; municipio: string; distanciaM: number; aproximada: boolean }

/** Consulta de cobertura en el inicio: municipio o corregimiento al instante; dirección o barrio, ubicándola en el mapa. */
export function HeroCobertura() {
  const [texto, setTexto] = useState('')
  // undefined: todavía no ha consultado; null: sin cobertura conocida.
  const [resultado, setResultado] = useState<Hallazgo | Punto | null | undefined>(undefined)
  const [consultado, setConsultado] = useState('')
  const [buscando, setBuscando] = useState(false)
  // Escribió una dirección que no se pudo ubicar y se respondió por el municipio.
  const [sinUbicar, setSinUbicar] = useState(false)
  const pedido = useRef<AbortController | null>(null)
  const hayCobertura =
    resultado?.tipo === 'municipio' || resultado?.tipo === 'zona' || (resultado?.tipo === 'punto' && resultado.estado !== 'sin')

  const consultar = async (valor: string) => {
    const limpio = valor.trim()
    const hallazgo = buscarCobertura(limpio)
    if (hallazgo === undefined) return
    pedido.current?.abort()
    setConsultado(limpio)
    setSinUbicar(false)

    // Solo el nombre de un municipio o corregimiento: se responde de una vez.
    if (hallazgo && normalizar(limpio).length <= normalizar(hallazgo.nombre).length + 3) {
      setBuscando(false)
      setResultado(hallazgo)
      return
    }

    // Una dirección o un barrio: se ubica y se revisa si cae dentro de una zona, igual que en el mapa.
    const control = new AbortController()
    pedido.current = control
    setBuscando(true)
    setResultado(undefined)
    try {
      const ubicacion = await buscarDireccion(limpio, control.signal)
      if (control.signal.aborted) return
      if (!ubicacion) {
        setSinUbicar(!!hallazgo)
        setResultado(hallazgo)
        return
      }
      const r = verificarPunto(ubicacion.lat, ubicacion.lng)
      setResultado({
        tipo: 'punto',
        estado: r.estado,
        etiqueta: ubicacion.etiqueta,
        zona: r.zona?.nombre ?? '',
        municipio: r.zona?.municipio ?? '',
        distanciaM: r.distanciaM,
        aproximada: ubicacion.aproximada,
      })
    } catch {
      // Si el buscador de direcciones falla, se responde con el municipio que se reconozca en el texto.
      if (!control.signal.aborted) {
        setSinUbicar(!!hallazgo)
        setResultado(hallazgo)
      }
    } finally {
      if (!control.signal.aborted) setBuscando(false)
    }
  }

  const verEnMapa = () => {
    // Se lleva al mapa exactamente lo que escribió, para no pedirle de nuevo la dirección.
    window.dispatchEvent(new CustomEvent(EVENTO_COBERTURA, { detail: consultado }))
    document.getElementById('cobertura')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="hero-cobertura">
      <p className="hc-titulo" id="hc-titulo">
        <MapPin size={16} aria-hidden="true" /> ¿Llegamos a tu casa? Consúltalo aquí
      </p>

      <form
        className="hc-form"
        role="search"
        aria-labelledby="hc-titulo"
        onSubmit={(e) => {
          e.preventDefault()
          consultar(texto)
        }}
      >
        <label className="hc-campo">
          <Search size={18} aria-hidden="true" />
          <input
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              if (resultado !== undefined) setResultado(undefined)
            }}
            placeholder="Dirección, barrio o municipio"
            aria-label="Dirección, barrio o municipio"
            list="hc-sugerencias"
            autoComplete="off"
            enterKeyHint="search"
          />
        </label>
        <button className="button button-primary" type="submit" disabled={buscando}>
          {buscando ? (
            <>
              Buscando <Loader2 size={16} className="hc-girando" aria-hidden="true" />
            </>
          ) : (
            <>
              Consultar <ArrowRight size={16} />
            </>
          )}
        </button>
        <datalist id="hc-sugerencias">
          {SUGERENCIAS_COBERTURA.map((nombre) => (
            <option key={nombre} value={nombre} />
          ))}
        </datalist>
      </form>

      {buscando ? (
        <div className="hc-rapidos" role="status">
          <span>Ubicando «{consultado}» en el mapa…</span>
        </div>
      ) : resultado === undefined ? (
        <div className="hc-rapidos">
          <span>Prueba con</span>
          {RAPIDOS.map((nombre) => (
            <button
              key={nombre}
              type="button"
              onClick={() => {
                setTexto(nombre)
                consultar(nombre)
              }}
            >
              {nombre}
            </button>
          ))}
        </div>
      ) : (
        <div className={`hc-resultado ${hayCobertura ? 'ok' : 'aviso'}`} role="status">
          <span className="hc-resultado-ico" aria-hidden="true">
            {hayCobertura ? <Check size={16} strokeWidth={3} /> : <TriangleAlert size={16} />}
          </span>
          <div>
            {resultado?.tipo === 'municipio' && sinUbicar && (
              <p>
                No pudimos ubicar <strong>«{consultado}»</strong> exactamente, pero sí tenemos cobertura en <strong>{resultado.nombre}</strong>.
                Escríbenos por WhatsApp con tu dirección y un asesor te confirma.
              </p>
            )}
            {resultado?.tipo === 'municipio' && !sinUbicar && (
              <p>
                <strong>{resultado.nombre}</strong> tiene cobertura. Escribe tu barrio o dirección aquí arriba para confirmar que llegamos a tu casa.
              </p>
            )}
            {resultado?.tipo === 'zona' && (
              <p>
                <strong>{resultado.nombre}</strong> ({resultado.municipio}) está dentro de nuestra cobertura. Podemos agendar tu instalación.
              </p>
            )}
            {resultado?.tipo === 'sin-cobertura' && (
              <p>
                Por ahora no tenemos cobertura en <strong>{resultado.nombre}</strong>. Escríbenos y te avisamos cuando lleguemos.
              </p>
            )}
            {resultado?.tipo === 'punto' && resultado.estado === 'con' && (
              <p>
                <strong>¡Sí llegamos!</strong> {resultado.etiqueta} queda dentro de nuestra zona {resultado.zona} ({resultado.municipio}).
                {resultado.aproximada && ' La ubicación es aproximada: confirmamos la dirección exacta antes de instalar.'}
              </p>
            )}
            {resultado?.tipo === 'punto' && resultado.estado === 'probable' && (
              <p>
                <strong>Es probable que lleguemos.</strong> {resultado.etiqueta} queda a {formatearDistancia(resultado.distanciaM)} de nuestra
                zona {resultado.zona} ({resultado.municipio}). Un técnico lo confirma antes de instalar.
              </p>
            )}
            {resultado?.tipo === 'punto' && resultado.estado === 'sin' && (
              <p>
                Por ahora no llegamos a <strong>{resultado.etiqueta}</strong>
                {resultado.zona
                  ? `. La zona más cercana es ${resultado.zona} (${resultado.municipio}), a ${formatearDistancia(resultado.distanciaM)}.`
                  : '.'}
              </p>
            )}
            {resultado === null && (
              <p>
                No encontramos <strong>«{consultado}»</strong>. Prueba con el barrio y el municipio (por ejemplo «Barrio El Centro, Fonseca») o
                búscala en el mapa.
              </p>
            )}
            <div className="hc-acciones">
              {hayCobertura && (
                <a href="#planes" onClick={irA('planes')}>
                  Ver planes <ArrowRight size={14} />
                </a>
              )}
              {resultado?.tipo !== 'sin-cobertura' && (
                <button type="button" onClick={verEnMapa}>
                  <MapPin size={14} aria-hidden="true" /> {resultado === null ? 'Buscar en el mapa' : 'Ver en el mapa'}
                </button>
              )}
              <a href={whatsappCobertura(resultado && resultado.tipo !== 'punto' && !sinUbicar ? resultado.nombre : consultado)} target="_blank" rel="noreferrer">
                <MessageCircle size={14} aria-hidden="true" /> {hayCobertura ? 'Agendar por WhatsApp' : 'Escríbenos por WhatsApp'}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
