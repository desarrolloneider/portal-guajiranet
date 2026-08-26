'use client'

import { useEffect, useState } from 'react'
import { ArrowUp, MessageCircle } from 'lucide-react'

export function BarraProgreso() {
  const [p, setP] = useState(0)

  useEffect(() => {
    let raf = 0
    const medir = () => {
      const alto = document.documentElement.scrollHeight - window.innerHeight
      setP(alto > 0 ? window.scrollY / alto : 0)
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(medir)
    }
    medir()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return <div className="barra-progreso" style={{ transform: `scaleX(${p})` }} />
}

export function AccionesFlotantes() {
  const [arriba, setArriba] = useState(false)

  useEffect(() => {
    const onScroll = () => setArriba(window.scrollY > 700)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="acciones-flotantes">
      <button
        type="button"
        className={`flotante subir ${arriba ? 'on' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Volver arriba"
      >
        <ArrowUp size={20} />
      </button>
      <a
        className="flotante whatsapp"
        href="https://wa.me/573001234567"
        target="_blank"
        rel="noreferrer"
        aria-label="Escribir por WhatsApp"
      >
        <MessageCircle size={22} />
        <span>Escríbenos</span>
      </a>
    </div>
  )
}
