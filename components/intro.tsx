'use client'

import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'

const LINEAS = [
  { texto: 'Buscando el nodo más cercano', ok: 'Albania · La Guajira' },
  { texto: 'Estableciendo enlace de fibra', ok: 'Enlace estable' },
  { texto: 'Midiendo tu conexión', ok: '300 Mbps · 8 ms' },
]

const PASO_MS = 620
const FINAL_MS = PASO_MS * LINEAS.length + 620
const SALIDA_MS = 620

export function Intro() {
  const [montado, setMontado] = useState(false)
  const [paso, setPaso] = useState(0)
  const [saliendo, setSaliendo] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    let visto = false
    try {
      visto = sessionStorage.getItem('gn-intro') === '1'
    } catch {
      visto = false
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (visto || reduce) return

    setMontado(true)
    document.body.style.overflow = 'hidden'

    LINEAS.forEach((_, i) => {
      timers.current.push(setTimeout(() => setPaso(i + 1), PASO_MS * (i + 1)))
    })
    timers.current.push(setTimeout(() => cerrar(), FINAL_MS))

    return () => {
      timers.current.forEach(clearTimeout)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cerrar = () => {
    timers.current.forEach(clearTimeout)
    setSaliendo(true)
    setTimeout(() => {
      setMontado(false)
      document.body.style.overflow = ''
      try {
        sessionStorage.setItem('gn-intro', '1')
      } catch {
        /* modo privado: simplemente se vuelve a mostrar */
      }
    }, SALIDA_MS)
  }

  if (!montado) return null

  const avance = Math.min(paso / LINEAS.length, 1)

  return (
    <div className={`intro ${saliendo ? 'saliendo' : ''}`} role="status" aria-live="polite">
      <svg className="intro-red" viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="introHalo">
            <stop offset="0%" stopColor="#4fa3e8" stopOpacity=".35" />
            <stop offset="100%" stopColor="#4fa3e8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="450" cy="300" r="260" fill="url(#introHalo)" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = (i / 8) * Math.PI * 2
          return (
            <line
              key={i}
              className="intro-hilo"
              x1={450 + Math.cos(a) * 520}
              y1={300 + Math.sin(a) * 520}
              x2={450 + Math.cos(a) * 70}
              y2={300 + Math.sin(a) * 70}
              style={{ animationDelay: `${i * 0.11}s` }}
            />
          )
        })}
        <circle className="intro-anillo" cx="450" cy="300" r="105" />
        <circle className="intro-anillo intro-anillo-2" cx="450" cy="300" r="105" />
      </svg>

      <div className="intro-centro">
        <div className="intro-marca">
          <img src="/logo-guajiranet-claro.png" alt="GuajiraNet Telecomunicaciones" width={1280} height={720} />
        </div>

        <ul className="intro-log">
          {LINEAS.map((l, i) => (
            <li key={l.texto} className={paso > i ? 'listo' : paso === i ? 'activo' : ''}>
              <span className="intro-punto">{paso > i ? <Check size={12} /> : <i />}</span>
              <span className="intro-texto">{paso > i ? l.ok : l.texto}</span>
            </li>
          ))}
        </ul>

        <div className="intro-barra">
          <span style={{ transform: `scaleX(${avance})` }} />
        </div>

        <button type="button" className="intro-skip" onClick={cerrar}>
          Saltar
        </button>
      </div>
    </div>
  )
}
