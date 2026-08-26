'use client'

import { useEffect, useRef, useState } from 'react'

export function HeroEscena() {
  const [p, setP] = useState(0)
  const frame = useRef(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const onScroll = () => {
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        setP(Math.min(window.scrollY / 620, 1))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame.current)
    }
  }, [])

  const caida = p * 190

  return (
    <div className="hero-escena">
      <img
        className="hero-mano"
        src="/guajiranet-hand.png"
        alt="Mano formada por hilos de fibra óptica"
        style={{
          transform: `translate3d(${p * 34}px, ${caida}px, 0) rotate(${p * 9}deg) scale(${1 - p * 0.05})`,
          opacity: 1 - p * 0.25,
        }}
      />

      <div className="router-orbita" style={{ transform: `translate3d(${p * 34}px, ${caida}px, 0)` }}>
        <div className="router-ancla">
          <div className="router-halo" />
          <span className="router-onda onda-1" />
          <span className="router-onda onda-2" />
          <span className="router-onda onda-3" />

          <div className="router-flota">
            <div className="router-giro" style={{ transform: `rotateY(${p * 900}deg)` }}>
              <div className="router-vaiven">
                <div className="router-cuerpo">
                  <div className="cara cara-frente">
                    <span className="router-marca">guajiranet</span>
                    <span className="leds">
                      <i /><i /><i /><i />
                    </span>
                  </div>
                  <div className="cara cara-atras">
                    <span className="puertos"><i /><i /><i /><i /></span>
                  </div>
                  <div className="cara cara-der" />
                  <div className="cara cara-izq" />
                  <div className="cara cara-arriba" />
                  <div className="cara cara-abajo" />

                  <span className="antena antena-a"><i /><i /></span>
                  <span className="antena antena-b"><i /><i /></span>
                </div>
              </div>
            </div>
          </div>

          <div className="router-sombra" />
        </div>
      </div>
    </div>
  )
}
