'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Crosshair, LoaderCircle, MessageCircle, TriangleAlert, Wifi } from 'lucide-react'
import { type Municipio } from '@/lib/guajira-map'
import { MapaNacional, type DestinoMapa } from '@/components/mapa-nacional'
import { NODOS } from '@/lib/red-nacional'
import {
  buscarCobertura,
  EVENTO_COBERTURA,
  MUNICIPIOS_CON_COBERTURA,
  normalizar,
  whatsappCobertura,
  zonasDelMunicipio,
  type Hallazgo,
} from '@/lib/cobertura'
import { buscarDireccion, formatearDistancia, verificarPunto, type EstadoCobertura } from '@/lib/cobertura-geo'

type Resultado =
  /** `buscado`: la dirección que escribió la persona y no se pudo ubicar; se respondió por el municipio. */
  | { tipo: 'municipio'; nombre: string; zonas: string[]; buscado?: string }
  | { tipo: 'zona'; nombre: string; municipio: string }
  | { tipo: 'sin-cobertura'; nombre: string; depto: string }
  | { tipo: 'punto'; estado: EstadoCobertura; etiqueta: string; zona: string; municipio: string; distanciaM: number; aproximada: boolean }
  | { tipo: 'no-encontrado'; texto: string }
  | { tipo: 'error'; mensaje: string }

const DEPTOS_CON_RED = new Set(NODOS.map((n) => n.depto)).size
const ORDEN_ALFABETICO = [...MUNICIPIOS_CON_COBERTURA].sort((a, b) => a.name.localeCompare(b.name, 'es'))
const idsDelMunicipio = (nombre: string) => zonasDelMunicipio(nombre).map((z) => z.id)

const lista = (nombres: string[]) => (nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}` : nombres[0])

/** Clase de color del aviso según el resultado. */
function claseResultado(r: Resultado) {
  if (r.tipo === 'municipio' || r.tipo === 'zona') return 'ok'
  if (r.tipo === 'punto') return r.estado === 'con' ? 'ok' : r.estado === 'probable' ? 'warn' : 'no'
  if (r.tipo === 'sin-cobertura') return 'no'
  return 'warn'
}

function lugarDe(r: Resultado) {
  if (r.tipo === 'punto') return r.etiqueta
  if (r.tipo === 'no-encontrado') return r.texto
  if (r.tipo === 'error') return 'mi dirección'
  if (r.tipo === 'municipio' && r.buscado) return r.buscado
  return r.nombre
}

function Mensaje({ r }: { r: Resultado }) {
  switch (r.tipo) {
    case 'municipio':
      // Ya escribió su dirección: no se le pide otra vez, se le dice qué pasó y cómo confirmar.
      if (r.buscado) {
        return (
          <>
            No pudimos ubicar <strong>«{r.buscado}»</strong> exactamente en el mapa, pero sí tenemos cobertura en <strong>{r.nombre}</strong>
            {r.zonas.length > 1 ? ` (${lista(r.zonas)})` : ''}. Escríbenos por WhatsApp con tu dirección y un asesor te confirma, o usa tu
            ubicación.
          </>
        )
      }
      return r.zonas.length === 1 && normalizar(r.zonas[0]) === normalizar(r.nombre) ? (
        <>
          Tenemos cobertura en <strong>{r.nombre}</strong>. Escribe tu barrio o dirección para confirmar que llegamos a tu casa.
        </>
      ) : (
        <>
          En <strong>{r.nombre}</strong> tenemos cobertura en {lista(r.zonas)}. Escribe tu barrio o dirección para confirmar que
          llegamos a tu casa.
        </>
      )
    case 'zona':
      return (
        <>
          <strong>{r.nombre}</strong> ({r.municipio}) está dentro de nuestra cobertura. Podemos agendar tu instalación.
        </>
      )
    case 'sin-cobertura':
      return (
        <>
          Por ahora no tenemos cobertura en <strong>{r.nombre}</strong>
          {r.depto && r.depto !== r.nombre ? ` (${r.depto})` : ''}. Estamos creciendo: escríbenos y te avisamos cuando lleguemos.
        </>
      )
    case 'punto':
      if (r.estado === 'con') {
        return (
          <>
            <strong>¡Sí llegamos!</strong> {r.etiqueta} queda dentro de nuestra zona {r.zona} ({r.municipio}).
            {r.aproximada && ' La ubicación es aproximada: confirmamos la dirección exacta antes de instalar.'}
          </>
        )
      }
      if (r.estado === 'probable') {
        return (
          <>
            <strong>Es probable que lleguemos.</strong> {r.etiqueta} queda a {formatearDistancia(r.distanciaM)} de nuestra zona {r.zona} (
            {r.municipio}). Un técnico lo confirma antes de instalar.
          </>
        )
      }
      return (
        <>
          Por ahora no llegamos a <strong>{r.etiqueta}</strong>. La zona más cercana es {r.zona} ({r.municipio}), a{' '}
          {formatearDistancia(r.distanciaM)}.
        </>
      )
    case 'no-encontrado':
      return (
        <>
          No encontramos <strong>«{r.texto}»</strong>. Prueba con el barrio y el municipio (por ejemplo «Barrio El Centro, Fonseca») o
          usa tu ubicación.
        </>
      )
    case 'error':
      return <>{r.mensaje}</>
  }
}

export function Cobertura() {
  const [consulta, setConsulta] = useState('')
  const [foco, setFoco] = useState<string | null>(null)
  const [elegido, setElegido] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [cargando, setCargando] = useState<null | 'direccion' | 'ubicacion'>(null)
  const [destino, setDestino] = useState<DestinoMapa | null>(null)
  const pedido = useRef<AbortController | null>(null)

  const resaltado = foco ?? elegido

  const mostrarZonas = (ids: number[]) => {
    if (ids.length) setDestino({ tipo: 'zonas', ids, clave: Date.now() })
  }

  const mostrarPunto = (lat: number, lng: number, etiqueta: string, aproximada: boolean) => {
    const r = verificarPunto(lat, lng)
    setResultado({
      tipo: 'punto',
      estado: r.estado,
      etiqueta,
      zona: r.zona?.nombre ?? '',
      municipio: r.zona?.municipio ?? '',
      distanciaM: r.distanciaM,
      aproximada,
    })
    setDestino({ tipo: 'punto', lat, lng, estado: r.estado, clave: Date.now() })
  }

  const aplicarHallazgo = (h: Hallazgo, buscado?: string) => {
    if (h.tipo === 'municipio') {
      setElegido(h.codigo)
      setResultado({ tipo: 'municipio', nombre: h.nombre, zonas: h.zonas, buscado })
      mostrarZonas(idsDelMunicipio(h.nombre))
    } else if (h.tipo === 'zona') {
      setElegido(null)
      setResultado({ tipo: 'zona', nombre: h.nombre, municipio: h.municipio })
      mostrarZonas([h.zonaId])
    } else {
      setElegido(null)
      setResultado({ tipo: 'sin-cobertura', nombre: h.nombre, depto: h.depto })
      const nodo = NODOS.find((n) => normalizar(n.nombre) === normalizar(h.nombre))
      if (nodo) setDestino({ tipo: 'nodo', id: nodo.id, clave: Date.now() })
    }
  }

  const consultarCobertura = async (texto = consulta) => {
    const limpio = texto.trim()
    const hallazgo = buscarCobertura(limpio)
    if (hallazgo === undefined) return
    pedido.current?.abort()

    // Solo el nombre de un municipio o corregimiento: se responde de una vez.
    if (hallazgo && normalizar(limpio).length <= normalizar(hallazgo.nombre).length + 3) return aplicarHallazgo(hallazgo)

    // Una dirección o un barrio: se ubica en el mapa y se revisa contra las zonas.
    const control = new AbortController()
    pedido.current = control
    setCargando('direccion')
    setElegido(null)
    try {
      const ubicacion = await buscarDireccion(limpio, control.signal)
      if (control.signal.aborted) return
      if (ubicacion) mostrarPunto(ubicacion.lat, ubicacion.lng, ubicacion.etiqueta, ubicacion.aproximada)
      else if (hallazgo) aplicarHallazgo(hallazgo, limpio)
      else setResultado({ tipo: 'no-encontrado', texto: limpio })
    } catch {
      if (control.signal.aborted) return
      if (hallazgo) aplicarHallazgo(hallazgo, limpio)
      else setResultado({ tipo: 'error', mensaje: 'No pudimos buscar la dirección en este momento. Usa tu ubicación o escríbenos por WhatsApp.' })
    } finally {
      if (pedido.current === control) setCargando(null)
    }
  }

  const usarUbicacion = () => {
    if (!('geolocation' in navigator)) {
      setResultado({ tipo: 'error', mensaje: 'Tu navegador no permite compartir la ubicación. Escribe tu barrio o dirección.' })
      return
    }
    pedido.current?.abort()
    setCargando('ubicacion')
    setElegido(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCargando(null)
        mostrarPunto(pos.coords.latitude, pos.coords.longitude, 'Tu ubicación', pos.coords.accuracy > 150)
      },
      () => {
        setCargando(null)
        setResultado({ tipo: 'error', mensaje: 'No pudimos leer tu ubicación. Revisa el permiso del navegador o escribe tu barrio o dirección.' })
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  }

  const seleccionar = (m: Municipio) => {
    pedido.current?.abort()
    setCargando(null)
    setConsulta(m.name)
    setElegido(m.code)
    setResultado({ tipo: 'municipio', nombre: m.name, zonas: zonasDelMunicipio(m.name).map((z) => z.nombre) })
    mostrarZonas(idsDelMunicipio(m.name))
  }

  // La consulta rápida del inicio pide mostrar aquí lo que escribió la persona (botón «Ver en el mapa»).
  useEffect(() => {
    const alPedir = (e: Event) => {
      const texto = (e as CustomEvent<string>).detail
      if (typeof texto !== 'string' || !texto.trim()) return
      setConsulta(texto)
      consultarCobertura(texto)
    }
    window.addEventListener(EVENTO_COBERTURA, alPedir)
    return () => {
      window.removeEventListener(EVENTO_COBERTURA, alPedir)
      pedido.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const exito = resultado && claseResultado(resultado) === 'ok'

  return (
    <section id="cobertura" className="section coverage">
      <div className="container coverage-grid">
        <div>
          <h2>¿Llegamos a<br />tu dirección?</h2>
          <p>Escribe tu barrio, tu dirección o tu municipio. Si ya llegamos, te agendamos la instalación.</p>

          <form
            className="coverage-form"
            onSubmit={(e) => {
              e.preventDefault()
              consultarCobertura()
            }}
          >
            <input
              aria-label="Barrio, dirección o municipio"
              placeholder="Barrio, dirección o municipio"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
            />
            <button className="button button-primary" type="submit" disabled={cargando !== null}>
              {cargando === 'direccion' ? (
                <>
                  Buscando <LoaderCircle size={16} className="girando" />
                </>
              ) : (
                <>
                  Consultar <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <button type="button" className="coverage-ubicacion" onClick={usarUbicacion} disabled={cargando !== null}>
            {cargando === 'ubicacion' ? <LoaderCircle size={15} className="girando" /> : <Crosshair size={15} />}
            {cargando === 'ubicacion' ? 'Leyendo tu ubicación…' : 'Estoy en mi casa: usar mi ubicación'}
          </button>

          {resultado && (
            <div className={`coverage-result ${claseResultado(resultado)}`} role="status">
              {exito ? <Check size={16} /> : <TriangleAlert size={16} />}
              <span>
                <Mensaje r={resultado} />
                <a className="coverage-whatsapp" href={whatsappCobertura(lugarDe(resultado))} target="_blank" rel="noreferrer">
                  <MessageCircle size={14} /> {exito ? 'Agendar por WhatsApp' : 'Escríbenos al WhatsApp'} <b>300 913 9909</b>
                </a>
              </span>
            </div>
          )}

          <span className="form-note">Consulta gratis y sin compromiso.</span>

          <div className="muni-chips" role="list" aria-label="Municipios con cobertura en La Guajira">
            {ORDEN_ALFABETICO.map((m) => (
              <button
                key={m.code}
                type="button"
                role="listitem"
                className={`muni-chip on ${resaltado === m.code ? 'hl' : ''}`}
                onMouseEnter={() => setFoco(m.code)}
                onMouseLeave={() => setFoco(null)}
                onFocus={() => setFoco(m.code)}
                onBlur={() => setFoco(null)}
                onClick={() => seleccionar(m)}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="map-panel map-vista-nacional">
          <div className="map-topline">
            <span><Wifi size={14} /> Nuestra red</span>
            <strong>{NODOS.length} ciudades en {DEPTOS_CON_RED} departamentos</strong>
          </div>

          <MapaNacional destino={destino} />

          <div className="map-footer">
            <span><i className="legend-linea" /> Fibra terrestre</span>
            <span><i className="legend-linea legend-linea-sub" /> Fibra submarina</span>
            <span><i className="legend-calor" /> Zona con cobertura</span>
            <span className="map-source">Trazado de referencia</span>
          </div>
        </div>
      </div>
    </section>
  )
}
