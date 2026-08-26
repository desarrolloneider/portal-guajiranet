'use client'

import { useEffect, useRef, useState } from 'react'
import { Building2, Home, Smartphone } from 'lucide-react'

const HILOS = [
  'M-40,70 C 280,20 500,150 780,95 S 1050,45 1250,80',
  'M-40,150 C 260,95 430,245 700,200 S 1000,145 1250,175',
  'M-40,230 C 240,210 460,330 720,285 S 1020,250 1250,265',
  'M-40,310 C 220,330 480,385 740,355 S 1040,345 1250,350',
  'M-40,390 C 265,425 440,330 700,425 S 1010,455 1250,435',
  'M-40,470 C 245,495 470,445 730,490 S 1030,520 1250,500',
]

const NODOS = [
  { icono: Home, titulo: 'Hogares', pie: 'Fibra hasta la casa', en: 0.45 },
  { icono: Building2, titulo: 'Negocios', pie: 'Enlaces dedicados', en: 0.62 },
  { icono: Smartphone, titulo: 'Móvil', pie: 'Siempre conectado', en: 0.79 },
]

export function FibraBanner() {
  const ref = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  const [p, setP] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setP(1)
      return
    }

    const medir = () => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight || 800
      const avance = (vh - r.top) / (vh * 0.7 + r.height * 0.35)
      setP((prev) => Math.max(prev, Math.max(0, Math.min(avance, 1))))
    }

    const onScroll = () => {
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(medir)
    }

    medir()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame.current)
    }
  }, [])

  const dibujado = p > 0.92

  return (
    <div className="fibra" ref={ref}>
      <svg className="fibra-svg" viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="hiloGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4fa3e8" stopOpacity="0" />
            <stop offset="18%" stopColor="#4fa3e8" stopOpacity=".85" />
            <stop offset="70%" stopColor="#8ccbff" stopOpacity=".9" />
            <stop offset="100%" stopColor="#fad21b" stopOpacity=".75" />
          </linearGradient>
          <filter id="hiloGlow" x="-10%" y="-40%" width="120%" height="180%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#hiloGlow)">
          {HILOS.map((d, i) => (
            <path
              key={d}
              id={`hilo-${i}`}
              d={d}
              className="hilo"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - Math.max(0, Math.min((p - i * 0.045) / 0.7, 1))}
            />
          ))}
        </g>

        {dibujado && (
          <g className="destellos">
            {HILOS.map((_, i) => (
              <circle key={i} className="destello" r="3.5">
                <animateMotion dur={`${4.5 + i * 0.8}s`} repeatCount="indefinite" begin={`${i * 0.7}s`}>
                  <mpath href={`#hilo-${i}`} />
                </animateMotion>
              </circle>
            ))}
          </g>
        )}
      </svg>

      <div className="container fibra-nodos">
        <div className="fibra-riel">
          <span className="fibra-riel-luz" style={{ transform: `scaleX(${p})` }} />
        </div>
        <div className="fibra-tarjetas">
          {NODOS.map(({ icono: Icono, titulo, pie, en }) => (
            <div className={`fibra-nodo ${p >= en ? 'on' : ''}`} key={titulo}>
              <span className="fibra-nodo-punto" />
              <span className="fibra-nodo-icono">
                <Icono size={20} />
              </span>
              <strong>{titulo}</strong>
              <small>{pie}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
