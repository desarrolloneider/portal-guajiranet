'use client'

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'

export function HeroEscena() {
  const reduce = useReducedMotion()
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
  const giroRouter = useTransform(scrollSuave, [0, 620], [0, 900])

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
        className="router-orbita"
        style={{
          x: reduce ? 0 : desplazamientoX,
          y: reduce ? 0 : desplazamientoY,
        }}
      >
        <div className="router-ancla">
          <div className="router-halo" />
          <span className="router-onda onda-1" />
          <span className="router-onda onda-2" />
          <span className="router-onda onda-3" />

          <div className="router-flota">
            <motion.div className="router-giro" style={{ rotateY: reduce ? 0 : giroRouter }}>
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
            </motion.div>
          </div>

          <div className="router-sombra" />
        </div>
      </motion.div>
    </div>
  )
}
