'use client'

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'
import { ArrowRight, Check, Gift, Globe, Info, MapPin, MessageCircle, MonitorPlay, MousePointerClick, PhoneCall, Smartphone, type LucideIcon } from 'lucide-react'
import { NOTAS_PLANES, VELOCIDADES, ZONAS_PLANES, type Plan } from '@/lib/planes'

// Tono de cada fibra: de ámbar claro a grafito a medida que sube la velocidad (un tono por velocidad).
const TONOS = ['#f0d6b5', '#e3b374', '#5f6779', '#515767', '#434855', '#30333d', '#1f2127']
const tono = (megas: number) => TONOS[Math.min(VELOCIDADES.indexOf(megas), TONOS.length - 1)]

const inicioDe = (planes: Plan[]) => Math.max(0, planes.findIndex((p) => p.destacado))
const WHATSAPP = 'https://wa.me/573009139909'

type Item = { clave: string; icono: LucideIcon; texto: string; extra?: string; mejora: boolean }

const textoDatos = (p: Plan) => (/c\/u/i.test(p.datos) ? `${p.datos.replace(/\s*c\/u/i, '')} de datos por línea` : `${p.datos} de datos`)

/** Lo que incluye el plan; `mejora` marca lo que sube respecto al plan anterior. */
function incluye(p: Plan, previo?: Plan): Item[] {
  return [
    {
      clave: `tv-${p.streaming}-${p.canales}`,
      icono: MonitorPlay,
      texto: `App de streaming ${p.streaming}`,
      extra: `+${p.canales} canales en vivo`,
      mejora: !!previo && (previo.streaming !== p.streaming || previo.canales !== p.canales),
    },
    {
      clave: `lineas-${p.lineas}`,
      icono: Smartphone,
      texto: p.lineas === 1 ? '1 línea móvil' : `${p.lineas} líneas móviles`,
      mejora: !!previo && previo.lineas !== p.lineas,
    },
    { clave: 'minutos', icono: PhoneCall, texto: 'Minutos ilimitados', mejora: false },
    { clave: 'whatsapp', icono: MessageCircle, texto: 'WhatsApp ilimitado', mejora: false },
    { clave: `datos-${p.datos}`, icono: Globe, texto: textoDatos(p), mejora: !!previo && previo.datos !== p.datos },
  ]
}

const SUAVE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const vRodar: Variants = {
  entra: (d: number) => ({ y: d > 0 ? '70%' : '-70%', opacity: 0, filter: 'blur(6px)' }),
  centro: { y: '0%', opacity: 1, filter: 'blur(0px)', transition: { duration: 0.45, ease: SUAVE } },
  sale: (d: number) => ({ y: d > 0 ? '-70%' : '70%', opacity: 0, filter: 'blur(6px)', transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }),
}
const vQuieto: Variants = { entra: { opacity: 0 }, centro: { opacity: 1 }, sale: { opacity: 0 } }

function Rodante({ valor, dir, variantes }: { valor: string; dir: number; variantes: Variants }) {
  return (
    <span className="pd-rodante">
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.strong key={valor} custom={dir} variants={variantes} initial="entra" animate="centro" exit="sale">
          {valor}
        </motion.strong>
      </AnimatePresence>
    </span>
  )
}

export function PlanesSelector() {
  const reducir = useReducedMotion() ?? false
  const [zona, setZona] = useState(0)
  const { planes: PLANES, cubre, nombre: nombreZona } = ZONAS_PLANES[zona]
  const MAX = Math.max(...PLANES.map((p) => p.megas))
  const [sel, setSel] = useState(() => inicioDe(ZONAS_PLANES[0].planes))
  const [dir, setDir] = useState(1)
  const [visto, setVisto] = useState(false)
  const escaleraRef = useRef<HTMLDivElement>(null)
  const botones = useRef<(HTMLButtonElement | null)[]>([])

  // Las fibras crecen cuando la escalera entra en pantalla.
  useEffect(() => {
    const el = escaleraRef.current
    if (!el) return
    if (reducir) {
      setVisto(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisto(true)
          io.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reducir])

  const elegirZona = (i: number) => {
    if (i === zona) return
    setZona(i)
    setDir(1)
    setSel(inicioDe(ZONAS_PLANES[i].planes))
  }

  const elegir = (i: number, enfocar = false) => {
    const n = (i + PLANES.length) % PLANES.length
    if (n === sel) return
    setDir(n > sel ? 1 : -1)
    setSel(n)
    if (enfocar) botones.current[n]?.focus()
  }

  const alTeclado = (e: KeyboardEvent<HTMLDivElement>) => {
    const teclas: Record<string, number> = { ArrowRight: sel + 1, ArrowDown: sel + 1, ArrowLeft: sel - 1, ArrowUp: sel - 1, Home: 0, End: PLANES.length - 1 }
    if (!(e.key in teclas)) return
    e.preventDefault()
    elegir(teclas[e.key], true)
  }

  const plan = PLANES[sel]
  const items = incluye(plan, PLANES[sel - 1])
  const variantes = reducir ? vQuieto : vRodar
  const mensaje = encodeURIComponent(`Hola, tengo una pregunta sobre el plan de ${plan.megas} Megas en ${nombreZona}`)
  // Al pedir el plan, el asesor recibe todo el detalle para no tener que preguntarlo.
  const pedido = encodeURIComponent(
    [
      '¡Hola! Quiero contratar este plan:',
      '',
      `📶 Internet de ${plan.megas} Megas por fibra óptica`,
      `💰 $${plan.precio} al mes`,
      `📍 Zona: ${nombreZona}`,
      '',
      'Incluye:',
      ...items.map((it) => `• ${it.texto}${it.extra ? ` (${it.extra})` : ''}`),
      '',
      '¿Me ayudan con la instalación?',
    ].join('\n'),
  )

  return (
    <section id="planes" className="section plans-section planes">
      <div className="container">
        <div className="section-heading planes-cabecera">
          <div data-revelar="izq">
            <div className="eyebrow">Planes hogar</div>
            <h2>Elige el plan para tu hogar</h2>
          </div>
          <p data-revelar="der">
            Todos incluyen línea móvil, minutos ilimitados
            <br />y app de streaming con canales en vivo.
          </p>
        </div>

        <div className="planes-zonas" data-revelar>
          <span className="planes-zonas-titulo" id="planes-zonas-titulo">
            <MapPin size={15} aria-hidden="true" /> Elige tu zona
          </span>
          <div className="planes-zonas-botones" role="group" aria-labelledby="planes-zonas-titulo">
            {ZONAS_PLANES.map((z, i) => (
              <button key={z.nombre} type="button" className={`planes-zona${i === zona ? ' on' : ''}`} aria-pressed={i === zona} onClick={() => elegirZona(i)}>
                {z.nombre}
              </button>
            ))}
          </div>
          {cubre && <p className="planes-zonas-cubre">{cubre}</p>}
        </div>

        <div className="planes-panel">
          <div className={`planes-escalera${visto ? ' visto' : ''}`} ref={escaleraRef}>
            <p className="planes-ayuda">
              <MousePointerClick size={15} aria-hidden="true" /> Elige una velocidad · precios por mes
            </p>
            <div
              className="planes-peldanos"
              role="radiogroup"
              aria-label={`Velocidad del plan en ${nombreZona}`}
              onKeyDown={alTeclado}
              style={{ '--n': PLANES.length } as CSSProperties}
            >
              {PLANES.map((p, i) => (
                <button
                  key={`${nombreZona}-${p.megas}`}
                  ref={(el) => {
                    botones.current[i] = el
                  }}
                  type="button"
                  role="radio"
                  aria-checked={i === sel}
                  aria-label={`${p.megas} Megas, $${p.precio} al mes${p.destacado ? ', el más elegido' : ''}`}
                  tabIndex={i === sel ? 0 : -1}
                  className={`peldano${i === sel ? ' on' : ''}${p.destacado ? ' destacado' : ''}`}
                  style={{ '--alto': p.megas / MAX, '--i': i, '--c': tono(p.megas) } as CSSProperties}
                  onClick={() => elegir(i)}
                >
                  {p.destacado && <span className="peldano-cinta">Más elegido</span>}
                  <span className="peldano-megas">
                    <strong>{p.megas}</strong>
                    <small>Megas</small>
                  </span>
                  <span className="peldano-fibra" aria-hidden="true">
                    <span className="peldano-hilo">
                      <i />
                    </span>
                    <span className="peldano-nodo" />
                  </span>
                  <span className="peldano-precio">${p.precio}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="planes-detalle">
            <p className="sr-only" aria-live="polite">
              Plan de {plan.megas} Megas en {nombreZona} por ${plan.precio} al mes
            </p>
            <div className="pd-cabecera">
              <span className="pd-rotulo">Tu plan</span>
              {plan.destacado && <span className="pd-cinta">Más elegido</span>}
            </div>

            <div className="pd-velocidad">
              <Rodante valor={String(plan.megas)} dir={dir} variantes={variantes} />
              <span>Megas de internet</span>
            </div>

            <div className="pd-precio">
              <i>$</i>
              <Rodante valor={plan.precio} dir={dir} variantes={variantes} />
              <small>/mes</small>
            </div>

            <p className="pd-incluido">
              <Check size={16} strokeWidth={3} aria-hidden="true" /> Instalación gratis
            </p>

            <p className="pd-gratis-titulo">
              <Gift size={17} aria-hidden="true" /> <span>Todo esto te lo regalamos con tu plan</span>
            </p>

            <ul className="pd-lista">
              {items.map(({ clave, icono: Icono, texto, extra, mejora }, i) => (
                <li key={clave} className={mejora ? 'mejora' : undefined} style={{ '--i': i } as CSSProperties}>
                  <span className="pd-ico" aria-hidden="true">
                    <Icono size={18} />
                  </span>
                  <span className="pd-texto">
                    {texto}
                    {extra && <small>{extra}</small>}
                  </span>
                  <span className="pd-sellos">
                    <b className="pd-gratis">Gratis</b>
                    {mejora && <em>Mejora</em>}
                  </span>
                </li>
              ))}
            </ul>

            <div className="pd-acciones">
              <a className="pcard-cta pd-cta" href={`${WHATSAPP}?text=${pedido}`} target="_blank" rel="noreferrer">
                Quiero este plan <ArrowRight size={17} />
              </a>
              <a className="pd-whatsapp" href={`${WHATSAPP}?text=${mensaje}`} target="_blank" rel="noreferrer">
                <MessageCircle size={16} aria-hidden="true" /> Pregunta por WhatsApp
              </a>
            </div>

            <a className="pd-cobertura" href="#cobertura">
              <MapPin size={15} aria-hidden="true" /> Consulta la cobertura en el mapa antes de contratar
            </a>
          </div>
        </div>

        <div className="planes-notas">
          <h3>
            <Info size={17} aria-hidden="true" /> Ten en cuenta
          </h3>
          <ul>
            {NOTAS_PLANES.map((n) => (
              <li key={n}>
                <Check size={15} strokeWidth={3} aria-hidden="true" /> {n}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
