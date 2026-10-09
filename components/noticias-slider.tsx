'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'
import { ArrowLeft, ArrowRight, CalendarDays, Pause, Play } from 'lucide-react'
import { url } from '@/lib/base-path'

export type NoticiaSlide = {
  id: string
  categoria: string
  /** Color de la etiqueta: 'verde', 'azul' o 'amarillo'. */
  tono: string
  fecha: string
  fechaISO: string
  titulo: string
  resumen: string
  imagen: string
  /** object-position de la foto, para que el encuadre no corte a las personas. */
  enfoque?: string
  /** Agranda el recuadro de la foto grande (1.12 = 12% más) para mover el encuadre más allá del borde. Solo en pantallas anchas. */
  zoom?: number
  /** object-position de la miniatura, si debe ser distinto al de la foto grande. */
  enfoqueMini?: string
}

/** Tiempo que se queda cada noticia antes de pasar a la siguiente. */
const DURACION_MS = 7000
/** Duración de la cortina que descubre la foto nueva. */
const T_CAMBIO = 1.15
const CURVA: [number, number, number, number] = [0.76, 0, 0.24, 1]
const SUAVE: [number, number, number, number] = [0.22, 1, 0.36, 1]

/* ---------- Foto: la nueva entra con una cortina; la anterior se corre y se apaga debajo ---------- */

const vSlide: Variants = {
  entra: { zIndex: 2, x: '0%' },
  centro: { zIndex: 2, x: '0%' },
  sale: (dir: number) => ({ zIndex: 1, x: dir > 0 ? '-9%' : '9%', transition: { duration: T_CAMBIO, ease: CURVA } }),
}

const vRecorte: Variants = {
  entra: (dir: number) => ({ clipPath: dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)', filter: 'brightness(1)' }),
  centro: { clipPath: 'inset(0% 0% 0% 0%)', filter: 'brightness(1)', transition: { duration: T_CAMBIO, ease: CURVA } },
  sale: { filter: 'brightness(0.45)', transition: { duration: T_CAMBIO, ease: CURVA } },
}

const vFoto: Variants = {
  entra: { scale: 1.26 },
  // Acercamiento rápido al principio y luego muy lento mientras la noticia está en pantalla.
  centro: { scale: 1, transition: { duration: DURACION_MS / 1000 + T_CAMBIO, ease: [0.16, 1, 0.3, 1] } },
  sale: { scale: 1.02, transition: { duration: T_CAMBIO, ease: CURVA } },
}

const vCortina: Variants = {
  entra: (dir: number) => ({ left: dir > 0 ? '100%' : '0%', opacity: 1 }),
  centro: (dir: number) => ({
    left: dir > 0 ? '0%' : '100%',
    opacity: 0,
    transition: { left: { duration: T_CAMBIO, ease: CURVA }, opacity: { duration: 0.4, delay: T_CAMBIO - 0.15 } },
  }),
  sale: { opacity: 0, transition: { duration: 0.1 } },
}

/* ---------- Texto: sale rápido y entra por partes; el titular, palabra por palabra ---------- */

const vTexto: Variants = {
  oculto: {},
  visible: { transition: { delayChildren: 0.18, staggerChildren: 0.09 } },
  fuera: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
}

const vLinea: Variants = {
  oculto: { opacity: 0, y: 26, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.75, ease: SUAVE } },
  fuera: { opacity: 0, y: -14, filter: 'blur(6px)', transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } },
}

const vTitular: Variants = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.045 } },
  fuera: { opacity: 0, y: -14, filter: 'blur(6px)', transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } },
}

const vPalabra: Variants = {
  oculto: { y: '112%', rotate: 5 },
  visible: { y: '0%', rotate: 0, transition: { duration: 0.85, ease: SUAVE } },
  fuera: {},
}

/* ---------- Contador: el número sube o baja según la dirección ---------- */

const vNumero: Variants = {
  entra: (dir: number) => ({ y: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  centro: { y: '0%', opacity: 1, transition: { duration: 0.6, ease: SUAVE } },
  sale: (dir: number) => ({ y: dir > 0 ? '-100%' : '100%', opacity: 0, transition: { duration: 0.4, ease: CURVA } }),
}

/* ---------- Versión sin movimiento (prefers-reduced-motion) ---------- */

const vQuieto: Variants = {
  entra: { opacity: 0 },
  centro: { opacity: 1, transition: { duration: 0.25 } },
  sale: { opacity: 0, transition: { duration: 0.25 } },
  oculto: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  fuera: { opacity: 0, transition: { duration: 0.15 } },
}
const vNada: Variants = {}

export function NoticiasSlider({
  noticias,
  onAbrir,
  detenido = false,
}: {
  noticias: NoticiaSlide[]
  onAbrir: (id: string) => void
  /** Detiene el paso automático mientras, por ejemplo, la noticia está abierta en el modal. */
  detenido?: boolean
}) {
  const reducir = useReducedMotion() ?? false
  const [indice, setIndice] = useState(0)
  const [dir, setDir] = useState(1)
  const [pausaManual, setPausaManual] = useState(false)
  const [encima, setEncima] = useState(false)
  const [enVista, setEnVista] = useState(false)
  const raizRef = useRef<HTMLElement>(null)
  const toque = useRef<{ x: number; y: number; id: number } | null>(null)

  const total = noticias.length
  const actual = noticias[indice]
  const autoplay = !reducir && !detenido && !pausaManual && !encima && enVista && total > 1

  const ir = useCallback(
    (destino: number, direccion?: number) => {
      const siguiente = (destino + total) % total
      if (siguiente === indice) return
      setDir(direccion ?? (siguiente > indice ? 1 : -1))
      setIndice(siguiente)
    },
    [indice, total],
  )
  const siguiente = useCallback(() => ir(indice + 1, 1), [indice, ir])
  const anterior = useCallback(() => ir(indice - 1, -1), [indice, ir])

  // Solo avanza sola mientras la sección está a la vista.
  useEffect(() => {
    const el = raizRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setEnVista(e.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Las fotos se piden de antemano para que la cortina nunca descubra una imagen a medio cargar.
  useEffect(() => {
    noticias.forEach((n) => {
      const img = new Image()
      img.src = url(n.imagen)
    })
  }, [noticias])

  const alTeclado = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      siguiente()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      anterior()
    }
  }

  // Deslizar con el dedo en celulares.
  const alTocar = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return
    toque.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
  }
  const alSoltar = (e: React.PointerEvent) => {
    const t = toque.current
    toque.current = null
    if (!t || t.id !== e.pointerId) return
    const dx = e.clientX - t.x
    const dy = e.clientY - t.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) (dx < 0 ? siguiente : anterior)()
  }

  const vS = reducir ? vQuieto : vSlide
  const vR = reducir ? vNada : vRecorte
  const vF = reducir ? vNada : vFoto
  const vT = reducir ? vQuieto : vTexto
  const vL = reducir ? vNada : vLinea
  const vTi = reducir ? vNada : vTitular
  const vP = reducir ? vNada : vPalabra
  const otras = Array.from({ length: Math.min(2, total - 1) }, (_, i) => (indice + 1 + i) % total)

  return (
    <section
      id="noticias"
      ref={raizRef}
      className="ns"
      aria-roledescription="carrusel"
      aria-label="Noticias de Guajiranet"
      onKeyDown={alTeclado}
    >
      <div
        className="ns-escenario"
        onPointerEnter={(e) => e.pointerType === 'mouse' && setEncima(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setEncima(false)}
        onFocusCapture={() => setEncima(true)}
        onBlurCapture={() => setEncima(false)}
        onPointerDown={alTocar}
        onPointerUp={alSoltar}
        onPointerCancel={() => (toque.current = null)}
      >
        <div className="ns-medios" aria-hidden="true">
          <AnimatePresence initial={false} custom={dir}>
            <motion.div key={actual.id} className="ns-slide" custom={dir} variants={vS} initial="entra" animate="centro" exit="sale">
              <motion.div className="ns-recorte" custom={dir} variants={vR}>
                <motion.img
                  className="ns-foto"
                  src={url(actual.imagen)}
                  alt=""
                  draggable={false}
                  style={{ objectPosition: actual.enfoque, ...(actual.zoom ? { '--zoom': `${actual.zoom * 100}%` } : {}) } as CSSProperties}
                  data-zoom={actual.zoom ? '' : undefined}
                  variants={vF}
                />
              </motion.div>
              {!reducir && <motion.span className="ns-cortina" custom={dir} variants={vCortina} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="container ns-contenido">
          <header className="ns-cabecera">
            <div>
              <div className="eyebrow">Actualidad</div>
              <h2>Noticias de Guajiranet</h2>
            </div>
            <div className="ns-nav">
              <span className="ns-contador" aria-hidden="true">
                <span className="ns-contador-num">
                  <AnimatePresence initial={false} mode="popLayout" custom={dir}>
                    <motion.b key={indice} custom={dir} variants={reducir ? vQuieto : vNumero} initial="entra" animate="centro" exit="sale">
                      {String(indice + 1).padStart(2, '0')}
                    </motion.b>
                  </AnimatePresence>
                </span>
                <span className="ns-contador-total">/ {String(total).padStart(2, '0')}</span>
              </span>
              <button type="button" className="ns-flecha" onClick={anterior} aria-label="Noticia anterior">
                <ArrowLeft size={19} aria-hidden="true" />
              </button>
              <button type="button" className="ns-flecha" onClick={siguiente} aria-label="Noticia siguiente">
                <ArrowRight size={19} aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="ns-cuerpo" aria-live={autoplay ? 'off' : 'polite'}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.article
                key={actual.id}
                className="ns-texto"
                role="group"
                aria-roledescription="diapositiva"
                aria-label={`${indice + 1} de ${total}`}
                variants={vT}
                initial="oculto"
                animate="visible"
                exit="fuera"
              >
                <motion.div className="ns-meta" variants={vL}>
                  <span className={`ns-chip ns-chip--${actual.tono}`}>{actual.categoria}</span>
                  <time className="ns-fecha" dateTime={actual.fechaISO}>
                    <CalendarDays size={14} aria-hidden="true" /> {actual.fecha}
                  </time>
                </motion.div>
                <motion.h3 className="ns-titulo" variants={vTi} aria-label={actual.titulo}>
                  {actual.titulo.split(' ').map((palabra, i, todas) => (
                    <span className="ns-palabra" key={`${palabra}-${i}`} aria-hidden="true">
                      <motion.span variants={vP}>
                        {palabra}
                        {i < todas.length - 1 ? ' ' : ''}
                      </motion.span>
                    </span>
                  ))}
                </motion.h3>
                <motion.p variants={vL}>{actual.resumen}</motion.p>
                <motion.div variants={vL}>
                  <button type="button" className="ns-cta" onClick={() => onAbrir(actual.id)}>
                    Leer noticia <ArrowRight size={17} aria-hidden="true" />
                  </button>
                </motion.div>
              </motion.article>
            </AnimatePresence>
          </div>

          <div className="ns-pie">
            <div className="ns-progreso" role="tablist" aria-label="Elegir noticia">
              {noticias.map((n, i) => (
                <button
                  key={n.id}
                  type="button"
                  role="tab"
                  aria-selected={i === indice}
                  aria-label={`${i + 1}. ${n.titulo}`}
                  className={i === indice ? 'on' : undefined}
                  onClick={() => ir(i)}
                >
                  <span className="ns-barra">
                    <i
                      key={i === indice ? `activa-${indice}` : `quieta-${i}`}
                      className={i === indice ? (reducir ? 'lleno' : 'corre') : i < indice ? 'lleno' : undefined}
                      style={i === indice ? { animationDuration: `${DURACION_MS}ms`, animationPlayState: autoplay ? 'running' : 'paused' } : undefined}
                      onAnimationEnd={i === indice ? siguiente : undefined}
                    />
                  </span>
                  <span className="ns-etiqueta">
                    <b>{String(i + 1).padStart(2, '0')}</b> {n.categoria}
                  </span>
                </button>
              ))}
              {!reducir && total > 1 && (
                <button
                  type="button"
                  className="ns-pausa"
                  onClick={() => setPausaManual((p) => !p)}
                  aria-label={pausaManual ? 'Reanudar el paso automático' : 'Pausar el paso automático'}
                >
                  {pausaManual ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
                </button>
              )}
            </div>

            <div className="ns-siguientes">
              {otras.map((i) => {
                const n = noticias[i]
                return (
                  <button key={n.id} type="button" className="ns-mini" onClick={() => ir(i, 1)}>
                    <img src={url(n.imagen)} alt="" style={{ objectPosition: n.enfoqueMini ?? n.enfoque }} />
                    <span>
                      <small>{n.categoria}</small>
                      <strong>{n.titulo}</strong>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
