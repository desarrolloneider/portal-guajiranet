'use client'

import { useState, type MouseEvent } from 'react'
import { ArrowRight, Check, MapPin, MessageCircle, Search, TriangleAlert } from 'lucide-react'
import { buscarCobertura, EVENTO_COBERTURA, SUGERENCIAS_COBERTURA, whatsappCobertura, type Hallazgo } from '@/lib/cobertura'

// Atajos para probar sin escribir: la sede (Albania) y los municipios con más cobertura.
const RAPIDOS = ['Albania', 'San Juan del Cesar', 'Fonseca', 'Hatonuevo']

const irA = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
  e.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** Consulta de cobertura en el inicio: responde al instante si llegamos al municipio. */
export function HeroCobertura() {
  const [texto, setTexto] = useState('')
  // undefined: todavía no ha consultado; null: sin cobertura conocida.
  const [resultado, setResultado] = useState<Hallazgo | null | undefined>(undefined)
  const [consultado, setConsultado] = useState('')
  const hayCobertura = resultado?.tipo === 'municipio' || resultado?.tipo === 'zona'

  const consultar = (valor: string) => {
    const hallazgo = buscarCobertura(valor)
    if (hallazgo === undefined) return
    setConsultado(valor.trim())
    setResultado(hallazgo)
  }

  const verEnMapa = () => {
    window.dispatchEvent(new CustomEvent(EVENTO_COBERTURA, { detail: resultado && resultado.tipo !== 'sin-cobertura' ? resultado.nombre : consultado }))
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
            placeholder="Municipio, corregimiento o barrio"
            aria-label="Municipio, corregimiento o barrio"
            list="hc-sugerencias"
            autoComplete="off"
            enterKeyHint="search"
          />
        </label>
        <button className="button button-primary" type="submit">
          Consultar <ArrowRight size={16} />
        </button>
        <datalist id="hc-sugerencias">
          {SUGERENCIAS_COBERTURA.map((nombre) => (
            <option key={nombre} value={nombre} />
          ))}
        </datalist>
      </form>

      {resultado === undefined ? (
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
            {resultado?.tipo === 'municipio' && (
              <p>
                <strong>{resultado.nombre}</strong> tiene cobertura. Revisa tu barrio en el mapa para confirmar que llegamos a tu casa.
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
            {resultado === null && (
              <p>
                No reconocemos <strong>«{consultado}»</strong> como municipio o corregimiento. Si es un barrio o una dirección, búscala en el
                mapa.
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
              <a href={whatsappCobertura(resultado?.nombre ?? consultado)} target="_blank" rel="noreferrer">
                <MessageCircle size={14} aria-hidden="true" /> {hayCobertura ? 'Agendar por WhatsApp' : 'Escríbenos por WhatsApp'}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
