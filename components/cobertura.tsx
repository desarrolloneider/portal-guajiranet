'use client'

import { useState } from 'react'
import { ArrowRight, Check, MessageCircle, Wifi } from 'lucide-react'
import { MUNICIPIOS, type Municipio } from '@/lib/guajira-map'
import { MapaNacional } from '@/components/mapa-nacional'
import { NODOS } from '@/lib/red-nacional'

type Resultado = { name: string; active: true; nacional: boolean } | null | 'sin-datos'

const ACTIVOS = MUNICIPIOS.filter((m) => m.active)
const ORDEN_ALFABETICO = [...ACTIVOS].sort((a, b) => a.name.localeCompare(b.name, 'es'))

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

const whatsappHref = (municipio: string) =>
  `https://wa.me/573009139909?text=${encodeURIComponent(`Hola, quiero información sobre la cobertura de GuajiraNet en ${municipio}.`)}`

export function Cobertura() {
  const [consulta, setConsulta] = useState('')
  const [foco, setFoco] = useState<string | null>(null)
  const [elegido, setElegido] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado>(null)

  const resaltado = foco ?? elegido

  const seleccionar = (m: Municipio) => {
    setElegido(m.code)
    setConsulta(m.name)
    setResultado({ name: m.name, active: true, nacional: false })
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
      return
    }
    if (ciudadNacional) {
      setResultado({ name: ciudadNacional.nombre, active: true, nacional: true })
      setElegido(null)
      return
    }
    setResultado('sin-datos')
    setElegido(null)
  }

  return (
    <section id="cobertura" className="section coverage">
      <div className="container coverage-grid">
        <div>
          <div className="eyebrow">Estamos cerca</div>
          <h2>¿Llegamos a<br />tu dirección?</h2>
          <p>Escribe tu municipio o tócalo en el mapa y te confirmamos si puedes instalar GuajiraNet hoy.</p>

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
                {resultado.nacional ? 'tiene cobertura nacional activa en nuestra red. Podemos ayudarte a validar la instalación.' : 'tiene cobertura activa en La Guajira. Podemos agendar tu instalación.'}
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

        <div className="map-panel map-panel-nivel-1 map-vista-nacional">
          <div className="map-topline">
            <span><Wifi size={14} /> Red nacional conectada</span>
            <strong>{NODOS.length} ciudades y nodos con cobertura</strong>
          </div>
          <div className="map-live-strip">
            <span><i className="live-dot" /> Red operativa</span>
            <strong>{NODOS.length} ciudades conectadas</strong>
            <small>Actualizado hoy</small>
          </div>

          <MapaNacional />

          <div className="map-footer">
            <span><i className="legend-linea" /> Fibra terrestre</span>
            <span><i className="legend-linea legend-linea-sub" /> Fibra submarina</span>
            <span className="map-source">Trazado ilustrativo · verificar con planta externa</span>
          </div>
        </div>
      </div>
    </section>
  )
}
