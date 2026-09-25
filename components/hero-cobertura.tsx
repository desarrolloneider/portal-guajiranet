'use client'

import { useState, type MouseEvent } from 'react'
import { ArrowRight, Check, MapPin, MessageCircle, Search, TriangleAlert } from 'lucide-react'
import { buscarCobertura, EVENTO_COBERTURA, SUGERENCIAS_COBERTURA, whatsappCobertura, type Hallazgo } from '@/lib/cobertura'

// Atajos para probar sin escribir: la sede (Albania) y los municipios más grandes.
const RAPIDOS = ['Albania', 'Riohacha', 'Maicao', 'Uribia']

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

  const consultar = (valor: string) => {
    const hallazgo = buscarCobertura(valor)
    if (hallazgo === undefined) return
    setConsultado(valor.trim())
    setResultado(hallazgo)
  }

  const verEnMapa = () => {
    window.dispatchEvent(new CustomEvent(EVENTO_COBERTURA, { detail: resultado?.nombre ?? consultado }))
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
            placeholder="Escribe tu municipio"
            aria-label="Municipio"
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
        <div className={`hc-resultado ${resultado ? 'ok' : 'aviso'}`} role="status">
          <span className="hc-resultado-ico" aria-hidden="true">
            {resultado ? <Check size={16} strokeWidth={3} /> : <TriangleAlert size={16} />}
          </span>
          <div>
            {resultado?.tipo === 'local' && (
              <p>
                <strong>{resultado.nombre}</strong> tiene cobertura activa. Podemos agendar tu instalación.
              </p>
            )}
            {resultado?.tipo === 'nacional' && (
              <p>
                <strong>{resultado.nombre}</strong> está en nuestra red{resultado.depto ? ` de ${resultado.depto}` : ''}
                {resultado.depto.endsWith('.') ? '' : '.'} Escríbenos y
                validamos la instalación en tu dirección.
              </p>
            )}
            {resultado === null && (
              <p>
                No encontramos cobertura activa en <strong>«{consultado}»</strong>. Revisa la escritura o escríbenos por WhatsApp.
              </p>
            )}
            <div className="hc-acciones">
              {resultado?.tipo === 'local' && (
                <a href="#planes" onClick={irA('planes')}>
                  Ver planes <ArrowRight size={14} />
                </a>
              )}
              {resultado && (
                <button type="button" onClick={verEnMapa}>
                  <MapPin size={14} aria-hidden="true" /> Ver en el mapa
                </button>
              )}
              <a href={whatsappCobertura(resultado?.nombre ?? consultado)} target="_blank" rel="noreferrer">
                <MessageCircle size={14} aria-hidden="true" /> {resultado?.tipo === 'local' ? 'Agendar por WhatsApp' : 'Escríbenos por WhatsApp'}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
