'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Check, MapPin, MessageCircle, Wifi } from 'lucide-react'
import { MAP_HEIGHT, MAP_WIDTH, MUNICIPIOS, type Municipio } from '@/lib/guajira-map'

const ACTIVOS = MUNICIPIOS.filter((m) => m.active)
const ORDEN_ALFABETICO = [...MUNICIPIOS].sort((a, b) => a.name.localeCompare(b.name, 'es'))

const whatsappHref = (municipio: string) =>
  `https://wa.me/573009139909?text=${encodeURIComponent(`Hola, quiero información sobre la cobertura de GuajiraNet en ${municipio}.`)}`

export function Cobertura() {
  const [consulta, setConsulta] = useState('')
  const [foco, setFoco] = useState<string | null>(null)
  const [elegido, setElegido] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Municipio | null | 'sin-datos'>(null)

  const resaltado = foco ?? elegido
  const activo = useMemo(() => MUNICIPIOS.find((m) => m.code === resaltado) ?? null, [resaltado])

  const seleccionar = (m: Municipio) => {
    setElegido(m.code)
    setConsulta(m.name)
    setResultado(m)
  }

  const consultarCobertura = () => {
    const texto = consulta.trim().toLowerCase()
    if (!texto) return
    const encontrado = MUNICIPIOS.find((m) => texto.includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(texto))
    setResultado(encontrado ?? 'sin-datos')
    setElegido(encontrado?.code ?? null)
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
              placeholder="Municipio o dirección"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
            />
            <button className="button button-primary" type="submit">
              Consultar <ArrowRight size={16} />
            </button>
          </form>

          {resultado === 'sin-datos' && (
            <div className="coverage-result warn">No encontramos ese municipio en La Guajira. Revisa la escritura o escríbenos por WhatsApp.</div>
          )}
          {resultado && resultado !== 'sin-datos' && (
            <div className={`coverage-result ${resultado.active ? 'ok' : 'soon'}`}>
              {resultado.active ? <Check size={16} /> : <MapPin size={16} />}
              <span>
                <strong>{resultado.name}</strong>
                {resultado.active ? (
                  ' tiene cobertura activa. Podemos agendar tu instalación.'
                ) : (
                  <>
                    {' está en nuestro plan de expansión. Déjanos tus datos y te avisaremos cuando el servicio esté disponible.'}
                    <a className="coverage-whatsapp" href={whatsappHref(resultado.name)} target="_blank" rel="noreferrer">
                      <MessageCircle size={14} /> Escríbenos al WhatsApp <b>300 913 9909</b>
                    </a>
                  </>
                )}
              </span>
            </div>
          )}

          <span className="form-note">Consulta gratis y sin compromiso.</span>

          <div className="muni-chips" role="list" aria-label="Municipios de La Guajira">
            {ORDEN_ALFABETICO.map((m) => (
              <button
                key={m.code}
                type="button"
                role="listitem"
                className={`muni-chip ${m.active ? 'on' : 'off'} ${resaltado === m.code ? 'hl' : ''}`}
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

        <div className="map-panel">
          <div className="map-topline">
            <span><Wifi size={14} /> Red GuajiraNet</span>
            <strong>{ACTIVOS.length} de {MUNICIPIOS.length} municipios conectados</strong>
          </div>

          <div className="map-canvas">
            <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="img" aria-label="Mapa de cobertura de GuajiraNet por municipio en el departamento de La Guajira">
              <defs>
                <linearGradient id="muniOn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4fa3e8" />
                  <stop offset="100%" stopColor="#0868c6" />
                </linearGradient>
                <linearGradient id="muniOff" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d4a8f" />
                  <stop offset="100%" stopColor="#0a3768" />
                </linearGradient>
                <filter id="muniGlow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="7" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              <g className="capa-municipios">
                {MUNICIPIOS.map((m) => (
                  <path
                    key={m.code}
                    d={m.d}
                    className={`muni ${m.active ? 'on' : 'off'} ${resaltado === m.code ? 'hl' : ''}`}
                    fill={m.active ? 'url(#muniOn)' : 'url(#muniOff)'}
                    onMouseEnter={() => setFoco(m.code)}
                    onMouseLeave={() => setFoco(null)}
                    onClick={() => seleccionar(m)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${m.name}, ${m.active ? 'con cobertura' : 'próximamente'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        seleccionar(m)
                      }
                    }}
                  />
                ))}
              </g>

              <g className="capa-nodos">
                {ACTIVOS.map((m) => (
                  <g key={m.code} transform={`translate(${m.x} ${m.y})`}>
                    <circle className="nodo-pulso" r="6" />
                    <circle className="nodo" r="4.5" filter="url(#muniGlow)" />
                  </g>
                ))}
              </g>

              <g className="capa-etiquetas">
                {MUNICIPIOS.map((m) => (
                  <text
                    key={m.code}
                    x={m.x}
                    y={m.y + (m.active ? -12 : 4)}
                    textAnchor="middle"
                    className={`muni-label ${m.active ? 'on' : 'off'} ${resaltado === m.code ? 'hl' : ''}`}
                  >
                    {m.name}
                  </text>
                ))}
              </g>
            </svg>

            {activo && (
              <div
                className="map-tip"
                style={{ left: `${(activo.x / MAP_WIDTH) * 100}%`, top: `${(activo.y / MAP_HEIGHT) * 100}%` }}
              >
                <strong>{activo.name}</strong>
                <small>{activo.active ? 'Cobertura activa' : 'Próximamente'} · {activo.area.toLocaleString('es-CO')} km²</small>
              </div>
            )}
          </div>

          <div className="map-footer">
            <span><i className="legend-dot active" /> Cobertura disponible</span>
            <span><i className="legend-dot planned" /> Próximamente</span>
            <span className="map-source">Límites: DANE — MGN</span>
          </div>
        </div>
      </div>
    </section>
  )
}
