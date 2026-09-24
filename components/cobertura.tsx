'use client'

import { useState } from 'react'
import { ArrowRight, Check, MessageCircle, Wifi } from 'lucide-react'
import { MUNICIPIOS, type Municipio } from '@/lib/guajira-map'
import { MapaNacional, type DestinoMapa } from '@/components/mapa-nacional'
import { DEPARTAMENTOS } from '@/lib/colombia-map'
import { NODOS } from '@/lib/red-nacional'

type Resultado = { name: string; active: true; nacional: boolean; depto?: string } | null | 'sin-datos'

const ACTIVOS = MUNICIPIOS.filter((m) => m.active)
const DEPTOS_CON_RED = new Set(NODOS.map((n) => n.depto)).size
const nombreDepto = (codigo: string) => DEPARTAMENTOS.find((d) => d.codigo === codigo)?.nombre ?? ''
const nodoDelMunicipio = (codigo: string) => NODOS.find((n) => n.municipio === codigo)
const ORDEN_ALFABETICO = [...ACTIVOS].sort((a, b) => a.name.localeCompare(b.name, 'es'))

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

const whatsappHref = (municipio: string) =>
  `https://wa.me/573009139909?text=${encodeURIComponent(`Hola, quiero información sobre la cobertura de GuajiraNet en ${municipio}.`)}`

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

  const consultarCobertura = () => {
    const texto = normalizar(consulta)
    if (!texto) return
    const encontrado = ACTIVOS.find((m) => {
      const nombre = normalizar(m.name)
      return texto.includes(nombre) || nombre.includes(texto)
    })
    const ciudadNacional = NODOS.find((n) => {
      const nombre = normalizar(n.nombre)
      return texto.includes(nombre) || nombre.includes(texto)
    })
    if (encontrado) {
      setResultado({ name: encontrado.name, active: true, nacional: false })
      setElegido(encontrado.code)
      mostrarEnMapa(nodoDelMunicipio(encontrado.code)?.id)
      return
    }
    if (ciudadNacional) {
      setResultado({ name: ciudadNacional.nombre, active: true, nacional: true, depto: nombreDepto(ciudadNacional.depto) })
      setElegido(null)
      mostrarEnMapa(ciudadNacional.id)
      return
    }
    setResultado('sin-datos')
    setElegido(null)
  }

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
                {resultado.nacional ? `está en nuestra red${resultado.depto ? ` de ${resultado.depto}` : ''}. Escríbenos y validamos la instalación en tu dirección.` : 'tiene cobertura activa en La Guajira. Podemos agendar tu instalación.'}
                <a className="coverage-whatsapp" href={whatsappHref(resultado.name)} target="_blank" rel="noreferrer">
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
