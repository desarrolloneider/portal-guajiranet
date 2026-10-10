'use client'

import { useEffect, useState } from 'react'
import { ArrowUp, CreditCard } from 'lucide-react'

function IconoWhatsApp() {
  return (
    <svg className="whatsapp-icon" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 5.25c-5.93 0-10.75 4.63-10.75 10.34 0 1.83.62 3.53 1.7 5.02L5.45 25.5l5.1-1.42a11.13 11.13 0 0 0 5.45 1.42c5.93 0 10.75-4.63 10.75-10.34S21.93 5.25 16 5.25Z" />
      <path d="M12.2 11.4c.2-.22.42-.23.62-.04l1.42 1.33c.2.18.2.44.05.67l-.67.9c-.1.14-.11.3-.02.45.38.68 1.25 1.83 2.22 2.4.15.09.31.08.44-.03l.82-.7c.21-.18.48-.17.66.02l1.34 1.43c.18.2.17.42-.04.6l-.58.5c-.42.37-1.01.51-1.54.35-1.2-.36-2.7-1.48-3.9-2.83-1.03-1.17-1.8-2.46-1.97-3.4-.1-.54.07-1.08.47-1.47l.68-.18Z" />
    </svg>
  )
}

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

/** Botón flotante de "Pagar factura", abajo a la izquierda, encima de "Revisar tutorial". */
export function PagoFlotante({ href }: { href: string }) {
  return (
    <a className="pago-flotante" href={href} target="_blank" rel="noreferrer" aria-label="Pagar factura (abre el portal de pagos)">
      <CreditCard size={18} aria-hidden="true" />
      <span>Pagar factura</span>
    </a>
  )
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
        href="https://wa.me/573009139909"
        target="_blank"
        rel="noreferrer"
        aria-label="Escribir por WhatsApp"
      >
        <IconoWhatsApp />
        <span>Escríbenos</span>
      </a>
    </div>
  )
}
