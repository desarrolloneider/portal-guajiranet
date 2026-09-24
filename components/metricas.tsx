'use client'

import { useEffect, useRef, useState } from 'react'
import { NODOS } from '@/lib/red-nacional'

/** Municipios con al menos un punto de la red (los mismos que muestra el mapa). */
const MUNICIPIOS_CON_RED = new Set(NODOS.map((n) => n.municipio)).size

const DATOS = [
  { valor: 2500, prefijo: '+', sufijo: '', titulo: 'Hogares conectados' },
  { valor: MUNICIPIOS_CON_RED, prefijo: '', sufijo: '', titulo: 'Municipios con cobertura' },
  { valor: 48, prefijo: '', sufijo: 'h', titulo: 'Para instalar en tu casa' },
  { valor: 99, prefijo: '', sufijo: '%', titulo: 'Disponibilidad de la red' },
]

function useContador(objetivo: number, arrancar: boolean) {
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!arrancar) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(objetivo)
      return
    }
    const dur = 1400
    const inicio = performance.now()
    let raf = 0
    const paso = (t: number) => {
      const k = Math.min((t - inicio) / dur, 1)
      setN(Math.round(objetivo * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [objetivo, arrancar])

  return n
}

function Metrica({ valor, prefijo, sufijo, titulo, arrancar }: (typeof DATOS)[number] & { arrancar: boolean }) {
  const n = useContador(valor, arrancar)
  return (
    <div className="metrica">
      <strong>
        {prefijo}
        {n.toLocaleString('es-CO')}
        {sufijo}
      </strong>
      <span>{titulo}</span>
    </div>
  )
}

export function Metricas() {
  const ref = useRef<HTMLDivElement>(null)
  const [visto, setVisto] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setVisto(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section className="metricas" ref={ref}>
      <div className="container metricas-grid">
        {DATOS.map((d) => (
          <Metrica key={d.titulo} {...d} arrancar={visto} />
        ))}
      </div>
    </section>
  )
}
