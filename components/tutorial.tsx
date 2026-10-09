'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, HelpCircle, X } from 'lucide-react'

const CLAVE_VISTO = 'gn-tutorial-veces'
/** Veces al día que la guía se abre sola. El botón de ayuda la abre siempre. */
const MAX_POR_DIA = 2
const MARGEN = 8

type Paso = {
  /** Selectores CSS posibles; se usa el primero que esté visible. Sin selector, el paso va centrado. */
  objetivo?: string[]
  titulo: string
  texto: string
}

const PASOS: Paso[] = [
  {
    titulo: '¡Bienvenido a Guajiranet!',
    texto: 'Te mostramos en menos de un minuto cómo usar la página. Puedes saltar la guía cuando quieras.',
  },
  {
    objetivo: ['.hero-cobertura'],
    titulo: '¿Llegamos a tu casa?',
    texto: 'Escribe tu dirección o municipio y te decimos al instante si tenemos cobertura de fibra óptica.',
  },
  {
    objetivo: ['#planes'],
    titulo: 'Escoge tu plan',
    texto: 'Compara velocidades y precios. Con el botón de cada plan nos escribes para instalarlo.',
  },
  {
    objetivo: ['.nav-acciones .nav-pago'],
    titulo: 'Paga tu factura',
    texto: 'Desde aquí entras al portal de pagos con tu cédula, sin hacer filas.',
  },
  {
    objetivo: ['#autogestion'],
    titulo: 'Resuelve en minutos',
    texto: 'Mide tu velocidad, radica una petición, queja o reclamo (PQRS) o cambia la clave de tu WiFi tú mismo.',
  },
  {
    objetivo: ['.nav-principal', '.nav-toggle'],
    titulo: 'Muévete por la página',
    texto: 'Desde el menú llegas a cualquier sección: cobertura, preguntas frecuentes, noticias, contacto y más.',
  },
  {
    objetivo: ['.flotante.whatsapp'],
    titulo: '¿Necesitas ayuda?',
    texto: 'Escríbenos por WhatsApp y un asesor te atiende. Si quieres volver a ver esta guía, toca el botón de ayuda.',
  },
]

type Caja = { top: number; left: number; width: number; height: number }

// Se mide el tamaño de diseño (offset*), no el de pantalla: las animaciones de aparición encogen
// las secciones que aún no se han visto y getBoundingClientRect las daría por ocultas.
function visible(el: Element) {
  const h = el as HTMLElement
  return h.offsetWidth > 0 && h.offsetHeight > 0 && getComputedStyle(el).visibility !== 'hidden'
}

function buscarObjetivo(paso: Paso) {
  for (const selector of paso.objetivo ?? []) {
    const el = document.querySelector(selector)
    if (el && visible(el)) return el
  }
  return null
}

/** Posición de scroll que deja el elemento visible bajo la barra superior fija: centrado si cabe, si no desde su inicio. */
function destinoScroll(el: Element) {
  const r = el.getBoundingClientRect()
  const barra = document.querySelector('header')?.getBoundingClientRect().height ?? 0
  const libre = window.innerHeight - barra
  const arriba = r.top + window.scrollY - barra - 12
  return Math.max(0, r.height < libre * 0.6 ? arriba - (libre - r.height) / 2 + 12 : arriba)
}

/** Cuántas veces se mostró sola hoy. Al cambiar de día el contador vuelve a cero. */
function vecesHoy() {
  const hoy = new Date().toLocaleDateString('en-CA')
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_VISTO) ?? 'null') as { fecha?: string; veces?: number } | null
    return { hoy, veces: guardado?.fecha === hoy ? Number(guardado.veces) || 0 : 0 }
  } catch {
    return { hoy, veces: 0 }
  }
}

function sumarVez() {
  const { hoy, veces } = vecesHoy()
  try {
    localStorage.setItem(CLAVE_VISTO, JSON.stringify({ fecha: hoy, veces: veces + 1 }))
  } catch {
    /* En modo privado no se puede contar: la guía sale en cada visita. */
  }
}

export function Tutorial() {
  const [activo, setActivo] = useState(false)
  const [indice, setIndice] = useState(0)
  const [caja, setCaja] = useState<Caja | null>(null)
  const [tarjeta, setTarjeta] = useState<{ top: number; left: number } | null>(null)
  const tarjetaRef = useRef<HTMLDivElement>(null)

  // Solo los pasos cuyo elemento existe en esta pantalla (por ejemplo, en el celular no hay menú de escritorio).
  const [pasos, setPasos] = useState<Paso[]>(PASOS)

  const abrir = useCallback(() => {
    // Se descarta un paso solo si su elemento no existe en esta página. Si existe pero aún no se ve
    // (secciones que cargan después), se busca de nuevo al llegar a ese paso.
    setPasos(PASOS.filter((p) => !p.objetivo || p.objetivo.some((s) => document.querySelector(s))))
    setIndice(0)
    setActivo(true)
  }, [])

  const cerrar = useCallback(() => {
    setActivo(false)
    setCaja(null)
  }, [])

  // Se abre sola en las primeras visitas de cada día, hasta MAX_POR_DIA veces.
  useEffect(() => {
    // Quien llega con un enlace directo (?abrir=pqrs, #contacto…) viene a algo puntual: no se le interrumpe.
    if (vecesHoy().veces >= MAX_POR_DIA || location.search.includes('abrir=') || location.hash) return
    const t = window.setTimeout(() => {
      sumarVez()
      abrir()
    }, 1200)
    return () => window.clearTimeout(t)
  }, [abrir])

  const paso = pasos[indice]

  // Ubica el resaltado y la tarjeta junto al elemento del paso.
  const medir = useCallback(() => {
    if (!paso) return
    const el = buscarObjetivo(paso)
    const ancho = window.innerWidth
    const alto = window.innerHeight
    const t = tarjetaRef.current
    const tw = t?.offsetWidth ?? 340
    const th = t?.offsetHeight ?? 200

    if (!el) {
      setCaja(null)
      setTarjeta({ top: Math.max(16, (alto - th) / 2), left: Math.max(16, (ancho - tw) / 2) })
      return
    }

    const r = el.getBoundingClientRect()
    // Lo que queda debajo de la barra superior no se resalta encima de ella.
    const tope = el.closest('header') || getComputedStyle(el).position === 'fixed' ? MARGEN : (document.querySelector('header')?.getBoundingClientRect().bottom ?? 0) + 4
    const arriba = Math.max(tope, r.top - MARGEN)
    const abajo = Math.min(alto - MARGEN, r.bottom + MARGEN)
    const c = {
      top: arriba,
      left: Math.max(MARGEN, r.left - MARGEN),
      width: Math.min(ancho - MARGEN * 2, r.width + MARGEN * 2),
      height: Math.max(0, abajo - arriba),
    }
    setCaja(c)

    // La tarjeta va debajo si cabe, si no arriba, y si tampoco (secciones altas), abajo de la pantalla.
    let top = c.top + c.height + 12
    if (top + th > alto - 12) top = c.top - th - 12
    if (top < 12) top = alto - th - 16
    if (c.height > alto * 0.6) top = alto - th - 16
    const left = Math.min(Math.max(16, c.left + c.width / 2 - tw / 2), ancho - tw - 16)
    setTarjeta({ top, left })
  }, [paso])

  // Al cambiar de paso, se lleva el elemento a la vista y se mide cuando termina el desplazamiento.
  useEffect(() => {
    if (!activo || !paso) return
    const el = buscarObjetivo(paso)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (el) {
      const r = el.getBoundingClientRect()
      const fueraDeVista = r.top < 80 || r.bottom > window.innerHeight - 40
      // Los elementos fijos (barra superior, botón de WhatsApp) no necesitan desplazamiento.
      if (fueraDeVista && getComputedStyle(el).position !== 'fixed' && !el.closest('header')) {
        window.scrollTo({ top: destinoScroll(el), behavior: reduce ? 'auto' : 'smooth' })
      }
    }
    // Se sigue midiendo cuadro a cuadro mientras dura el desplazamiento suave, para que el resaltado no se quede atrás.
    const fin = performance.now() + 1200
    let cuadro = 0
    const seguir = () => {
      medir()
      if (performance.now() < fin) {
        cuadro = requestAnimationFrame(seguir)
        return
      }
      // Si el desplazamiento suave no alcanzó a llegar, se salta directo.
      const r = el?.getBoundingClientRect()
      if (el && r && (r.bottom < 0 || r.top > window.innerHeight)) {
        window.scrollTo({ top: destinoScroll(el), behavior: 'instant' })
        medir()
      }
    }
    seguir()
    // Respaldo por si el navegador frena las animaciones (pestaña en segundo plano, ahorro de batería).
    const respaldo = window.setTimeout(() => {
      const r = el?.getBoundingClientRect()
      if (el && r && (r.bottom < 0 || r.top > window.innerHeight)) window.scrollTo({ top: destinoScroll(el), behavior: 'instant' })
      medir()
    }, 1300)
    return () => {
      cancelAnimationFrame(cuadro)
      window.clearTimeout(respaldo)
    }
  }, [activo, paso, medir])

  useLayoutEffect(() => {
    if (activo) medir()
  }, [activo, medir])

  useEffect(() => {
    if (!activo) return
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar()
      if (e.key === 'ArrowRight') setIndice((i) => Math.min(i + 1, pasos.length - 1))
      if (e.key === 'ArrowLeft') setIndice((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', teclas)
    window.addEventListener('resize', medir)
    window.addEventListener('scroll', medir, { passive: true })
    tarjetaRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', teclas)
      window.removeEventListener('resize', medir)
      window.removeEventListener('scroll', medir)
    }
  }, [activo, cerrar, medir, pasos.length])

  const ultimo = indice === pasos.length - 1

  return (
    <>
      <button type="button" className="tutorial-ayuda" onClick={abrir} title="Ver la guía de la página">
        <HelpCircle size={18} aria-hidden="true" /> Revisar tutorial
      </button>

      {activo && paso && (
        <div className="tutorial" role="dialog" aria-modal="true" aria-labelledby="tutorial-titulo" aria-describedby="tutorial-texto">
          {/* Clic en el fondo oscuro: no cierra, para que nadie la pierda por accidente. */}
          <div className="tutorial-fondo" />
          {caja ? (
            <div className="tutorial-foco" style={{ top: caja.top, left: caja.left, width: caja.width, height: caja.height }} />
          ) : (
            <div className="tutorial-oscuro" />
          )}

          <div
            ref={tarjetaRef}
            className="tutorial-tarjeta"
            tabIndex={-1}
            style={tarjeta ? { top: tarjeta.top, left: tarjeta.left } : { visibility: 'hidden' }}
          >
            <button type="button" className="tutorial-cerrar" onClick={cerrar} aria-label="Cerrar la guía"><X size={18} /></button>
            <span className="tutorial-contador">Paso {indice + 1} de {pasos.length}</span>
            <h3 id="tutorial-titulo">{paso.titulo}</h3>
            <p id="tutorial-texto">{paso.texto}</p>
            <div className="tutorial-puntos" aria-hidden="true">
              {pasos.map((_, i) => <span key={i} className={i === indice ? 'on' : ''} />)}
            </div>
            <div className="tutorial-acciones">
              {indice === 0 ? (
                <button type="button" className="tutorial-saltar" onClick={cerrar}>Saltar guía</button>
              ) : (
                <button type="button" className="tutorial-atras" onClick={() => setIndice(indice - 1)}><ArrowLeft size={16} /> Atrás</button>
              )}
              <button type="button" className="tutorial-siguiente" onClick={() => (ultimo ? cerrar() : setIndice(indice + 1))}>
                {indice === 0 ? 'Empezar' : ultimo ? '¡Listo!' : 'Siguiente'} {!ultimo && <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
