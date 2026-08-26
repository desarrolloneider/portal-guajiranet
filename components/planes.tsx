'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronLeft, ChevronRight, Router, Wrench, Zap } from 'lucide-react'

export type Plan = {
  nombre: string
  mb: number
  precio: number
  detalle: string
  destacado?: boolean
}

const HOGAR: Plan[] = [
  { nombre: 'Hogar 1', mb: 20, precio: 58000, detalle: 'Para navegar, chatear y redes sociales' },
  { nombre: 'Hogar 2', mb: 30, precio: 68000, detalle: 'Redes y video sin que se trabe' },
  { nombre: 'Hogar 3', mb: 40, precio: 80000, detalle: 'Clases y reuniones desde casa' },
  { nombre: 'Hogar 4', mb: 50, precio: 95000, detalle: 'El equilibrio ideal para la familia', destacado: true },
  { nombre: 'Hogar 5', mb: 60, precio: 110000, detalle: 'Varios dispositivos al mismo tiempo' },
  { nombre: 'Hogar 6', mb: 80, precio: 130000, detalle: 'Streaming en HD en varias pantallas' },
  { nombre: 'Hogar 7', mb: 100, precio: 150000, detalle: 'Casa llena, todos conectados' },
  { nombre: 'Hogar 8', mb: 150, precio: 180000, detalle: 'Máxima velocidad para el hogar' },
]

const COMERCIAL: Plan[] = [
  { nombre: 'Comercial 1', mb: 30, precio: 80000, detalle: 'Punto de venta y datáfono estables' },
  { nombre: 'Comercial 2', mb: 40, precio: 95000, detalle: 'Local pequeño con WiFi para clientes', destacado: true },
  { nombre: 'Comercial 3', mb: 50, precio: 120000, detalle: 'Varias cajas y cámaras en línea' },
  { nombre: 'Comercial 4', mb: 80, precio: 150000, detalle: 'Oficinas con trabajo en la nube' },
  { nombre: 'Comercial 5', mb: 100, precio: 180000, detalle: 'Empresas con alto tráfico diario' },
]

const GRUPOS = [
  { id: 'hogar', etiqueta: 'Hogar', planes: HOGAR },
  { id: 'comercial', etiqueta: 'Comercial y empresarial', planes: COMERCIAL },
] as const

const pesos = (n: number) => '$ ' + n.toLocaleString('es-CO')

export function Planes({ whatsapp }: { whatsapp: string }) {
  const [grupo, setGrupo] = useState<(typeof GRUPOS)[number]['id']>('hogar')
  const [inicio, setInicio] = useState(true)
  const [fin, setFin] = useState(false)
  const pista = useRef<HTMLDivElement>(null)

  const planes = GRUPOS.find((g) => g.id === grupo)!.planes

  const medir = () => {
    const el = pista.current
    if (!el) return
    setInicio(el.scrollLeft <= 4)
    setFin(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
  }

  useEffect(() => {
    const el = pista.current
    if (!el) return
    el.scrollTo({ left: 0 })
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [grupo])

  const mover = (dir: 1 | -1) => {
    const el = pista.current
    if (!el) return
    const tarjeta = el.querySelector<HTMLElement>('.plan-card')
    const paso = tarjeta ? tarjeta.offsetWidth + 18 : el.clientWidth * 0.8
    el.scrollBy({ left: paso * dir, behavior: 'smooth' })
  }

  return (
    <section id="planes" className="section plans-section">
      <div className="container">
        <div className="section-heading">
          <div data-revelar="izq">
            <div className="eyebrow">Planes para cada ritmo</div>
            <h2>Elige tu forma de estar conectado.</h2>
          </div>
          <p data-revelar="der">
            Sin letra pequeña. Sin complicaciones.
            <br />
            Solo internet que funciona.
          </p>
        </div>

        <div className="planes-barra" data-revelar>
          <div className="planes-tabs" role="tablist" aria-label="Tipo de plan">
            {GRUPOS.map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={grupo === g.id}
                className={grupo === g.id ? 'on' : ''}
                onClick={() => setGrupo(g.id)}
              >
                {g.etiqueta}
                <span>{g.planes.length}</span>
              </button>
            ))}
          </div>
          <div className="planes-flechas">
            <button type="button" onClick={() => mover(-1)} disabled={inicio} aria-label="Planes anteriores">
              <ChevronLeft size={20} />
            </button>
            <button type="button" onClick={() => mover(1)} disabled={fin} aria-label="Planes siguientes">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="planes-visor">
          <div className="plans-grid planes-pista" ref={pista} onScroll={medir} role="tabpanel">
            {planes.map((plan) => (
              <article className={`plan-card ${plan.destacado ? 'featured' : ''}`} key={plan.nombre}>
                {plan.destacado && <div className="popular">Más elegido</div>}
                <h3>{plan.nombre}</h3>
                <p>{plan.detalle}</p>
                <div className="speed">
                  <Zap size={20} /> {plan.mb} MB
                </div>
                <div className="price">
                  <strong>{pesos(plan.precio)}</strong>
                  <span>/mes</span>
                </div>
                <ul>
                  <li>
                    <Check size={16} /> Acceso a internet {plan.mb} MB
                  </li>
                  <li>
                    <Router size={16} /> Router WiFi incluido
                  </li>
                  <li>
                    <Wrench size={16} /> Instalación según validación
                  </li>
                </ul>
                <a
                  href={`${whatsapp}?text=${encodeURIComponent(`Hola, quiero información del plan ${plan.nombre} de ${plan.mb} MB.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`button ${plan.destacado ? 'button-primary' : 'button-outline'}`}
                >
                  Lo quiero <ArrowRight size={16} />
                </a>
              </article>
            ))}
          </div>
          <span className={`planes-vela izq ${inicio ? 'oculta' : ''}`} />
          <span className={`planes-vela der ${fin ? 'oculta' : ''}`} />
        </div>

        <p className="plans-note">
          Planes disponibles en Albania y Fonseca. Todos incluyen router WiFi. El costo de instalación se define según validación técnica.
        </p>
      </div>
    </section>
  )
}
