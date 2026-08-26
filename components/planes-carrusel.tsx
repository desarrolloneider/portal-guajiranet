'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Globe, MessageCircle, MonitorPlay, PhoneCall, Smartphone } from 'lucide-react'

type Plan = {
  megas: number
  precio: string
  streaming: 'FLEX' | 'PLUS'
  canales: number
  lineas: number
  datos: string
  destacado?: boolean
}

// Planes vigentes segun el material comercial de la empresa.
const PLANES: Plan[] = [
  { megas: 150, precio: '58.000', streaming: 'FLEX', canales: 45, lineas: 1, datos: '3GB' },
  { megas: 300, precio: '68.000', streaming: 'FLEX', canales: 45, lineas: 1, datos: '3GB' },
  { megas: 400, precio: '80.000', streaming: 'FLEX', canales: 45, lineas: 1, datos: '3GB', destacado: true },
  { megas: 500, precio: '95.000', streaming: 'FLEX', canales: 45, lineas: 1, datos: '5GB' },
  { megas: 600, precio: '110.000', streaming: 'PLUS', canales: 80, lineas: 1, datos: '5GB' },
  { megas: 700, precio: '150.000', streaming: 'PLUS', canales: 80, lineas: 2, datos: '5GB C/U' },
]

export function PlanesCarrusel() {
  const [ini, setIni] = useState(true)
  const [fin, setFin] = useState(false)
  const pista = useRef<HTMLDivElement>(null)

  const medir = () => {
    const el = pista.current
    if (!el) return
    setIni(el.scrollLeft <= 4)
    setFin(el.scrollLeft >= el.scrollWidth - el.clientWidth - 4)
  }

  useEffect(() => {
    const el = pista.current
    if (!el) return
    medir()
    el.addEventListener('scroll', medir, { passive: true })
    window.addEventListener('resize', medir)
    return () => {
      el.removeEventListener('scroll', medir)
      window.removeEventListener('resize', medir)
    }
  }, [])

  const mover = (dir: 1 | -1) => {
    const el = pista.current
    if (!el) return
    const tarjeta = el.querySelector<HTMLElement>('.pcard')
    const paso = tarjeta ? tarjeta.offsetWidth + 22 : el.clientWidth * 0.8
    el.scrollBy({ left: paso * dir, behavior: 'smooth' })
  }

  return (
    <section id="planes" className="section plans-section">
      <div className="container">
        <div className="section-heading">
          <div data-revelar="izq">
            <div className="eyebrow">Internet fibra óptica</div>
            <h2>Elige el plan ideal para tu hogar.</h2>
          </div>
          <p data-revelar="der">
            Todos incluyen línea móvil, minutos ilimitados
            <br />y app de streaming con canales en vivo.
          </p>
        </div>

        <div className="planes-pista-wrap">
          <button type="button" className="pflecha pflecha-izq" onClick={() => mover(-1)} disabled={ini} aria-label="Planes anteriores">
            <ChevronLeft size={22} />
          </button>
          <button type="button" className="pflecha pflecha-der" onClick={() => mover(1)} disabled={fin} aria-label="Planes siguientes">
            <ChevronRight size={22} />
          </button>

          <div className="planes-pista" ref={pista}>
            {PLANES.map((p, i) => (
              <article className={`pcard nivel-${i}${p.destacado ? ' destacado' : ''}`} key={p.megas}>
                {p.destacado && <span className="pcard-cinta">Más elegido</span>}

                <header className="pcard-cabecera">
                  <strong>{p.megas}</strong>
                  <span>MEGAS</span>
                </header>

                <div className="pcard-precio">
                  <i>$</i>
                  <strong>{p.precio}</strong>
                  <span>/mes</span>
                </div>

                <div className="pcard-streaming">
                  <span className="pcard-tv"><MonitorPlay size={19} /></span>
                  <span className="pcard-rotulo">App streaming</span>
                  <span className="chip chip-oscuro">{p.streaming}</span>
                  <span className="chip chip-azul">+{p.canales} canales</span>
                </div>

                <ul className="pcard-beneficios">
                  <li><span className="pico pico-amarillo"><Smartphone size={17} /></span>{p.lineas === 1 ? '1 línea móvil' : `${p.lineas} líneas móviles`}</li>
                  <li><span className="pico pico-azul"><PhoneCall size={17} /></span>Minutos ilimitados</li>
                  <li><span className="pico pico-verde"><MessageCircle size={17} /></span>WhatsApp ilimitado</li>
                  <li><span className="pico pico-cielo"><Globe size={17} /></span>{p.datos}</li>
                </ul>

                <a className="pcard-cta" href="#contacto">Lo quiero <ArrowRight size={17} /></a>
              </article>
            ))}
          </div>
        </div>

        <p className="plans-note" data-revelar>
          Costo de instalación según validación técnica. Consulta cobertura en el mapa antes de contratar.
        </p>
      </div>
    </section>
  )
}
