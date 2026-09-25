'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
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
  { icono: Home, titulo: 'Hogares', pie: 'Fibra hasta la casa' },
  { icono: Building2, titulo: 'Negocios', pie: 'Enlaces dedicados' },
  { icono: Smartphone, titulo: 'Móvil', pie: 'Siempre conectado' },
]

const acotar = (v: number) => Math.max(0, Math.min(v, 1))

/**
 * Fondo de hilos de fibra que se dibujan al bajar por la sección, y la fila de acometidas:
 * una luz recorre el riel y enciende cada nodo (hogares, negocios, móvil) cuando pasa por él.
 * En escritorio el riel es horizontal; en celular pasa a ser vertical.
 */
export function FibraBanner() {
  const fondoRef = useRef<HTMLDivElement>(null)
  const nodosRef = useRef<HTMLDivElement>(null)
  const rielRef = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  // p: avance de los hilos (toda la sección). r: avance de la luz por el riel.
  const [p, setP] = useState(0)
  const [r, setR] = useState(0)
  // Punto del riel (0 a 1) donde queda cada nodo; se mide del DOM.
  const [umbrales, setUmbrales] = useState([0.04, 0.37, 0.71])

  useEffect(() => {
    const riel = rielRef.current
    const nodos = nodosRef.current
    if (!riel || !nodos) return

    const medirUmbrales = () => {
      const rr = riel.getBoundingClientRect()
      if (!rr.width || !rr.height) return
      const vertical = rr.height > rr.width
      const puntos = Array.from(nodos.querySelectorAll<HTMLElement>('.fibra-nodo-punto'))
      if (puntos.length !== NODOS.length) return
      setUmbrales(
        puntos.map((pt) => {
          const b = pt.getBoundingClientRect()
          const u = vertical ? (b.top + b.height / 2 - rr.top) / rr.height : (b.left + b.width / 2 - rr.left) / rr.width
          return acotar(u)
        }),
      )
    }
    medirUmbrales()
    const ro = new ResizeObserver(medirUmbrales)
    ro.observe(nodos)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setP(1)
      setR(1)
      return () => ro.disconnect()
    }

    const medir = () => {
      const vh = window.innerHeight || 800
      const fondo = fondoRef.current
      if (fondo) {
        const b = fondo.getBoundingClientRect()
        const avance = (vh - b.top) / (vh * 0.7 + b.height * 0.35)
        setP((prev) => Math.max(prev, acotar(avance)))
      }
      // La luz arranca cuando la fila asoma por abajo y llega al final cuando está a media pantalla.
      const b = nodos.getBoundingClientRect()
      setR((prev) => Math.max(prev, acotar((vh - b.top) / (vh * 0.55))))
    }

    const onScroll = () => {
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(medir)
    }

    medir()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame.current)
    }
  }, [])

  const dibujado = p > 0.92
  const enCamino = r > 0.01 && r < 0.99

  return (
    <>
      <div className="fibra-fondo" ref={fondoRef} aria-hidden="true">
        <svg className="fibra-svg" viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid slice">
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
      </div>

      <div className="container fibra-nodos" ref={nodosRef} style={{ '--r': r } as CSSProperties}>
        <div className="fibra-riel" ref={rielRef} aria-hidden="true">
          <span className="fibra-riel-luz" />
          <span className={`fibra-riel-cabeza${enCamino ? ' on' : ''}`} />
        </div>
        <ul className="fibra-tarjetas">
          {NODOS.map(({ icono: Icono, titulo, pie }, i) => (
            <li className={`fibra-nodo${r >= umbrales[i] - 0.005 ? ' on' : ''}`} key={titulo}>
              <span className="fibra-nodo-punto" aria-hidden="true" />
              <span className="fibra-nodo-icono" aria-hidden="true">
                <Icono size={22} />
              </span>
              <strong>{titulo}</strong>
              <small>{pie}</small>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
