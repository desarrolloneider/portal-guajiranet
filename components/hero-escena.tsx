'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { MonitorPlay, Smartphone, Wifi } from 'lucide-react'
import { PLANES } from '@/lib/planes'

const MAX_MEGAS = Math.max(...PLANES.map((p) => p.megas))
const MAX_CANALES = Math.max(...PLANES.map((p) => p.canales))

// Los tres servicios de un mismo plan, orbitando el globo que proyecta la mano.
const SERVICIOS = [
  { id: 'internet', Icono: Wifi, titulo: 'Internet', detalle: `Hasta ${MAX_MEGAS} Megas` },
  { id: 'movil', Icono: Smartphone, titulo: 'Línea móvil', detalle: 'Minutos ilimitados' },
  { id: 'streaming', Icono: MonitorPlay, titulo: 'App streaming', detalle: `Hasta ${MAX_CANALES} canales` },
]

// Paralelos del globo: radio y aplanado según la distancia al ecuador.
const PARALELOS = [-34, -18, 0, 18, 34].map((d) => {
  const rx = Math.sqrt(52 * 52 - d * d)
  return { cy: 60 + d, rx: +rx.toFixed(1), ry: +(rx * 0.26).toFixed(1) }
})
// Meridianos: se abren y cierran por turnos para simular el giro.
const MERIDIANOS = [0, 1, 2, 3, 4, 5]

export function HeroEscena() {
  const reduceMovimiento = useReducedMotion()
  // En celular la escena va debajo del texto: si se moviera con el scroll, llegaría corrida.
  const [movil, setMovil] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 800px)')
    const cambiar = () => setMovil(mq.matches)
    cambiar()
    mq.addEventListener('change', cambiar)
    return () => mq.removeEventListener('change', cambiar)
  }, [])
  const reduce = reduceMovimiento || movil
  const { scrollY } = useScroll()
  const scrollSuave = useSpring(scrollY, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  const desplazamientoX = useTransform(scrollSuave, [0, 620], [0, 34])
  const desplazamientoY = useTransform(scrollSuave, [0, 620], [0, 190])
  const giroMano = useTransform(scrollSuave, [0, 620], [0, 9])
  const escalaMano = useTransform(scrollSuave, [0, 620], [1, 0.95])
  const opacidadMano = useTransform(scrollSuave, [0, 620], [1, 0.75])

  return (
    <div className="hero-escena">
      <motion.img
        className="hero-mano"
        src="/guajiranet-hand.png"
        alt="Mano formada por hilos de fibra óptica"
        width={880}
        height={1016}
        style={{
          x: reduce ? 0 : desplazamientoX,
          y: reduce ? 0 : desplazamientoY,
          rotate: reduce ? 0 : giroMano,
          scale: reduce ? 1 : escalaMano,
          opacity: reduce ? 1 : opacidadMano,
        }}
      />

      <motion.div
        className="holo-orbita"
        style={{
          x: reduce ? 0 : desplazamientoX,
          y: reduce ? 0 : desplazamientoY,
        }}
      >
        <div className="holo-ancla">
          <span className="holo-cono" aria-hidden="true" />
          <span className="holo-halo" aria-hidden="true" />
          <span className="holo-anillo" aria-hidden="true" />
          <span className="holo-ticks" aria-hidden="true" />

          {/* Arcos por los que giran los servicios */}
          <svg className="holo-arcos" viewBox="0 0 700 600" aria-hidden="true">
            <ellipse className="holo-arco holo-arco-guia" cx="350" cy="300" rx="200" ry="120" />
            <ellipse className="holo-arco holo-arco-a" cx="350" cy="300" rx="212" ry="96" transform="rotate(26 350 300)" />
            <ellipse className="holo-arco holo-arco-b" cx="350" cy="300" rx="198" ry="128" transform="rotate(-32 350 300)" />
          </svg>

          <div className="holo-nucleo" aria-hidden="true">
            <svg className="holo-globo" viewBox="0 0 120 120">
              <defs>
                <radialGradient id="globoFondo" cx="36%" cy="30%" r="78%">
                  <stop offset="0%" stopColor="#d8f0ff" stopOpacity=".95" />
                  <stop offset="42%" stopColor="#3d95e2" stopOpacity=".85" />
                  <stop offset="100%" stopColor="#042f63" stopOpacity=".95" />
                </radialGradient>
              </defs>
              <circle className="holo-globo-cuerpo" cx="60" cy="60" r="52" fill="url(#globoFondo)" />
              <g className="holo-globo-malla">
                {PARALELOS.map((p) => (
                  <ellipse key={p.cy} cx="60" cy={p.cy} rx={p.rx} ry={p.ry} />
                ))}
                {MERIDIANOS.map((i) => (
                  <ellipse key={i} className="holo-meridiano" cx="60" cy="60" rx="52" ry="52" style={{ '--i': i } as CSSProperties} />
                ))}
                <circle cx="60" cy="60" r="52" className="holo-globo-borde" />
              </g>
            </svg>
          </div>

          <ul className="holo-modulos">
            {SERVICIOS.map(({ id, Icono, titulo, detalle }, i) => (
              <li key={id} className="holo-orbe" style={{ '--i': i } as CSSProperties}>
                <span className="holo-modulo">
                  <span className="holo-modulo-ico">
                    <Icono size={17} />
                  </span>
                  <span className="holo-modulo-txt">
                    <strong>{titulo}</strong>
                    <small>{detalle}</small>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  )
}
