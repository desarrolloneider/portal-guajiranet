'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ArrowUpRight, ChevronUp, HelpCircle, X } from 'lucide-react'
import { PORTALES_PAGO } from '@/lib/pagos'
import { EVENTO_TUTORIAL } from '@/components/tutorial'

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

/**
 * Botones flotantes de la página.
 * - Izquierda: WhatsApp y "Revisar tutorial" (en computador uno al lado del otro; en celular el tutorial va encima).
 * - Derecha: "Volver arriba" (aparece al bajar) y "Pagar factura", que abre un selector con los portales de pago.
 */
export function AccionesFlotantes(_props: { pagoHref?: string }) {
  const [arriba, setArriba] = useState(false)
  // Selector de portales de pago (OnePay y Bre-B) que abre el botón flotante.
  const [pagosAbierto, setPagosAbierto] = useState(false)
  const selectorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pagosAbierto) return
    const fuera = (e: PointerEvent) => {
      if (!selectorRef.current?.contains(e.target as Node)) setPagosAbierto(false)
    }
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPagosAbierto(false)
    }
    document.addEventListener('pointerdown', fuera)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', fuera)
      document.removeEventListener('keydown', escape)
    }
  }, [pagosAbierto])

  useEffect(() => {
    const onScroll = () => setArriba(window.scrollY > 700)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <div className="flotantes-izq">
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
        <button
          type="button"
          className="tutorial-ayuda"
          onClick={() => window.dispatchEvent(new Event(EVENTO_TUTORIAL))}
          title="Ver la guía de la página"
          aria-label="Revisar tutorial"
        >
          <HelpCircle size={18} aria-hidden="true" /> <span>Revisar tutorial</span>
        </button>
      </div>

      <div className="acciones-flotantes">
        <button
          type="button"
          className={`flotante subir ${arriba ? 'on' : ''}`}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Volver arriba"
        >
          <ArrowUp size={20} />
        </button>
        <div className="pago-selector" ref={selectorRef}>
          {pagosAbierto && (
            <div className="pago-selector-menu" id="pago-selector-menu" role="menu" aria-label="Elige cómo pagar">
              <p className="pago-selector-titulo">¿Cómo quieres pagar?</p>
              {PORTALES_PAGO.map(({ clave, href, logo, marca, titulo, detalle }) => (
                <a
                  key={clave}
                  className={`pago-opcion pago-opcion-${clave}`}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  role="menuitem"
                  onClick={() => setPagosAbierto(false)}
                >
                  <span className={`pago-logo pago-logo-${clave}`} role="img" aria-label={`Logo de ${marca}`} style={{ backgroundImage: `url(${logo})` }} />
                  <span className="pago-opcion-texto">
                    <strong>{titulo}</strong>
                    <small>{detalle}</small>
                  </span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
          <button
            type="button"
            className={`pago-flotante ${pagosAbierto ? 'abierto' : ''}`}
            onClick={() => setPagosAbierto((a) => !a)}
            aria-expanded={pagosAbierto}
            aria-controls="pago-selector-menu"
            aria-haspopup="menu"
          >
            <span className="pago-logo pago-logo-pay pago-flotante-logo" aria-hidden="true" style={{ backgroundImage: 'url(/logo-guajiranet.png)' }} />
            <span className="pago-flotante-texto">
              <strong>{pagosAbierto ? 'Cerrar' : 'Pagar factura'}</strong>
              <small>{pagosAbierto ? 'Ocultar opciones' : 'Elige cómo pagar'}</small>
            </span>
            <span className="pago-flotante-flecha" aria-hidden="true">
              {pagosAbierto ? <X size={16} /> : <ChevronUp size={18} />}
            </span>
          </button>
        </div>
      </div>
    </>
  )
}
