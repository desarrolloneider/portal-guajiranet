'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Check, MessageCircle, Wifi } from 'lucide-react'
import { type Municipio } from '@/lib/guajira-map'
import { MapaNacional, type DestinoMapa } from '@/components/mapa-nacional'
import { NODOS } from '@/lib/red-nacional'
import { buscarCobertura, EVENTO_COBERTURA, MUNICIPIOS_ACTIVOS, whatsappCobertura, type Hallazgo } from '@/lib/cobertura'

type Resultado = { name: string; active: true; nacional: boolean; depto?: string } | null | 'sin-datos'

const ACTIVOS = MUNICIPIOS_ACTIVOS
const DEPTOS_CON_RED = new Set(NODOS.map((n) => n.depto)).size
const nodoDelMunicipio = (codigo: string) => NODOS.find((n) => n.municipio === codigo)
const ORDEN_ALFABETICO = [...ACTIVOS].sort((a, b) => a.name.localeCompare(b.name, 'es'))

export function Cobertura() {
  const [consulta, setConsulta] = useState('')
  const [foco, setFoco] = useState<string | null>(null)
  const [elegido, setElegido] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado>(null)
  const [destino, setDestino] = useState<DestinoMapa | null>(null)

  const mostrarEnMapa = (id?: string) => {
    if (id) setDestino({ tipo: 'nodo', id, clave: Date.now() })
  }

  const resaltado = foco ?? elegido

  const seleccionar = (m: Municipio) => {
    setElegido(m.code)
    setConsulta(m.name)
    setResultado({ name: m.name, active: true, nacional: false })
    mostrarEnMapa(nodoDelMunicipio(m.code)?.id)
  }

  const aplicarHallazgo = (hallazgo: Hallazgo | null) => {
    if (!hallazgo) {
      setResultado('sin-datos')
      setElegido(null)
      return
    }
    if (hallazgo.tipo === 'local') {
      setResultado({ name: hallazgo.nombre, active: true, nacional: false })
      setElegido(hallazgo.codigo)
    } else {
      setResultado({ name: hallazgo.nombre, active: true, nacional: true, depto: hallazgo.depto })
      setElegido(null)
    }
    mostrarEnMapa(hallazgo.nodo)
  }

  const consultarCobertura = (texto = consulta) => {
    const hallazgo = buscarCobertura(texto)
    if (hallazgo !== undefined) aplicarHallazgo(hallazgo)
  }

  // La consulta rápida del inicio pide mostrar aquí un municipio (botón «Ver en el mapa»).
  useEffect(() => {
    const alPedir = (e: Event) => {
      const texto = (e as CustomEvent<string>).detail
      if (typeof texto !== 'string' || !texto.trim()) return
      setConsulta(texto)
      const hallazgo = buscarCobertura(texto)
      if (hallazgo !== undefined) aplicarHallazgo(hallazgo)
    }
    window.addEventListener(EVENTO_COBERTURA, alPedir)
    return () => window.removeEventListener(EVENTO_COBERTURA, alPedir)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section id="cobertura" className="section coverage">
      <div className="container coverage-grid">
        <div>
          <h2>¿Llegamos a<br />tu dirección?</h2>
          <p>Escribe tu municipio o búscalo en el mapa. Si ya llegamos, te agendamos la instalación.</p>

          <form
            className="coverage-form"
            onSubmit={(e) => {
              e.preventDefault()
              consultarCobertura()
            }}
          >
            <input
              aria-label="Municipio o dirección"
              placeholder="Municipio con cobertura"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
            />
            <button className="button button-primary" type="submit">
              Consultar <ArrowRight size={16} />
            </button>
          </form>

          {resultado === 'sin-datos' && (
            <div className="coverage-result warn">No encontramos una zona con cobertura activa. Revisa la escritura o escríbenos por WhatsApp.</div>
          )}
          {resultado && resultado !== 'sin-datos' && (
            <div className="coverage-result ok">
              <Check size={16} />
              <span>
                <strong>{resultado.name}</strong>{' '}
                {resultado.nacional ? `está en nuestra red${resultado.depto ? ` de ${resultado.depto}` : ''}${resultado.depto?.endsWith('.') ? '' : '.'} Escríbenos y validamos la instalación en tu dirección.` : 'tiene cobertura activa en La Guajira. Podemos agendar tu instalación.'}
                <a className="coverage-whatsapp" href={whatsappCobertura(resultado.name)} target="_blank" rel="noreferrer">
                  <MessageCircle size={14} /> Escríbenos al WhatsApp <b>300 913 9909</b>
                </a>
              </span>
            </div>
          )}

          <span className="form-note">Consulta gratis y sin compromiso.</span>

          <div className="muni-chips" role="list" aria-label="Municipios con cobertura activa en La Guajira">
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
            <span className="map-source">Trazado de referencia</span>
          </div>
        </div>
      </div>
    </section>
  )
}
