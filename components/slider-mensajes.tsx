'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Phone, Play } from 'lucide-react'

const TEL = '+57 300 913 9909'
const AUTO_MS = 6500

const SLIDES = [
  {
    id: 'rural',
    eyebrow: 'Cobertura rural',
    titulo: ['Donde el mapa', 'se pone difícil,', 'nosotros llegamos.'],
    texto: 'Rancherías, corregimientos y veredas que ningún operador grande quiso cablear. Ahí llevamos fibra y radio enlace.',
    cta: 'Consultar mi zona',
    href: '#cobertura',
    imagen: '/cobertura-rural.webp',
  },
  {
    id: 'negocio',
    eyebrow: 'Comercios y empresas',
    titulo: ['Tu negocio', 'no puede quedarse', 'sin señal.'],
    texto: 'Enlaces dedicados con ancho de banda garantizado para tu datáfono, tu facturación y tus cámaras. Sin competir con el vecino.',
    cta: 'Ver planes comerciales',
    href: '#planes',
    imagen: '/comercios-empresas.jpg',
  },
  {
    id: 'soporte',
    eyebrow: 'Soporte de verdad',
    titulo: ['Te atiende alguien', 'que conoce', 'tu calle.'],
    texto: 'Nada de call centers a mil kilómetros. Nuestros técnicos viven acá y llegan a tu casa el mismo día.',
    cta: 'Hablar con soporte',
    href: '#contactos',
    imagen: '/soporte-local.jpg',
  },
] as const

function ArteRural() {
  return (
    <g>
      <path className="arte-suelo" d="M40 300 C 140 268 210 312 300 288 S 460 262 540 292 L540 400 L40 400 Z" />
      {[
        [110, 292],
        [200, 300],
        [300, 286],
        [400, 282],
        [488, 292],
      ].map(([x, y], i) => (
        <g key={i} style={{ animationDelay: `${i * 0.25}s` }} className="arte-casa">
          <path d={`M${x - 17} ${y} l17 -15 l17 15 z`} className="arte-techo" />
          <rect x={x - 13} y={y} width="26" height="21" rx="3" className="arte-muro" />
        </g>
      ))}
      <g className="arte-torre">
        <path d="M290 250 L282 292 M290 250 L298 292 M285 272 L295 272" className="arte-poste" />
        <circle cx="290" cy="244" r="6" className="arte-nodo" />
        {[38, 66, 94].map((r, i) => (
          <path key={r} d={`M${290 - r * 0.72} ${244 - r * 0.72} A ${r} ${r} 0 0 1 ${290 + r * 0.72} ${244 - r * 0.72}`} className="arte-onda" style={{ animationDelay: `${i * 0.5}s` }} />
        ))}
      </g>
    </g>
  )
}

function ArteNegocio() {
  return (
    <g>
      <rect x="150" y="150" width="280" height="180" rx="14" className="arte-panel" />
      <path d="M150 190 H430" className="arte-linea" />
      <circle cx="170" cy="170" r="4.5" className="arte-punto-1" />
      <circle cx="186" cy="170" r="4.5" className="arte-punto-2" />
      <circle cx="202" cy="170" r="4.5" className="arte-punto-3" />
      {[
        [180, 300, 46],
        [225, 300, 78],
        [270, 300, 62],
        [315, 300, 100],
        [360, 300, 84],
      ].map(([x, y, h], i) => (
        <rect key={x} x={x} y={y - h} width="26" height={h} rx="5" className="arte-barra" style={{ animationDelay: `${i * 0.14}s`, transformOrigin: `${x + 13}px ${y}px` }} />
      ))}
      <path d="M193 268 L238 240 L283 252 L328 214 L373 230" className="arte-tendencia" />
      <circle cx="373" cy="230" r="6" className="arte-nodo" />
    </g>
  )
}

function ArteSoporte() {
  return (
    <g>
      <circle cx="290" cy="228" r="96" className="arte-aro" />
      <circle cx="290" cy="228" r="70" className="arte-aro arte-aro-2" />
      <g className="arte-tec">
        <circle cx="290" cy="196" r="30" className="arte-muro" />
        <path d="M244 300 a46 46 0 0 1 92 0 z" className="arte-muro" />
        <path d="M262 186 a28 28 0 0 1 56 0" className="arte-casco" />
        <path d="M258 186 v18 M322 186 v18" className="arte-casco" />
        <path d="M322 204 q0 16 -18 18" className="arte-casco" />
        <circle cx="303" cy="224" r="5" className="arte-nodo" />
      </g>
      {[
        [176, 150],
        [404, 150],
        [176, 306],
        [404, 306],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="7" className="arte-orbe" style={{ animationDelay: `${i * 0.4}s` }} />
      ))}
    </g>
  )
}

const ARTES = { rural: ArteRural, negocio: ArteNegocio, soporte: ArteSoporte }

export function SliderMensajes() {
  const [i, setI] = useState(0)
  const [pausado, setPausado] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const ir = useCallback((n: number) => setI((n + SLIDES.length) % SLIDES.length), [])

  useEffect(() => {
    if (pausado) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    timer.current = setInterval(() => setI((v) => (v + 1) % SLIDES.length), AUTO_MS)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [pausado])

  const slide = SLIDES[i]

  return (
    <section
      className="slider"
      aria-roledescription="carrusel"
      aria-label="Mensajes de GuajiraNet"
    >
      <span className="slider-blob slider-blob-a" />
      <span className="slider-blob slider-blob-b" />

      <div className="container slider-grid">
        <div className="slider-copy" key={slide.id}>
          <div className="eyebrow">{slide.eyebrow}</div>
          <h2>
            {slide.titulo.map((linea, n) => (
              <span className="slider-linea" style={{ animationDelay: `${0.06 + n * 0.09}s` }} key={linea}>
                {linea}
              </span>
            ))}
          </h2>
          <p>{slide.texto}</p>
          <div className="slider-acciones">
            <a className="button button-primary" href={slide.href}>
              {slide.cta} <ArrowRight size={17} />
            </a>
            <a className="slider-tel" href="tel:+573009139909">
              <span>
                <Phone size={17} />
              </span>
              {TEL}
            </a>
          </div>
        </div>

        <div className="slider-arte">
          <svg viewBox="0 0 580 420" role="img" aria-label={slide.titulo.join(' ')} key={slide.id}>
            <defs>
              <clipPath id="sliderRecorte">
                <path d="M300 20 H520 a40 40 0 0 1 40 40 V300 a100 100 0 0 1 -100 100 H160 a140 140 0 0 1 -140 -140 V160 A140 140 0 0 1 160 20 Z" />
              </clipPath>
            </defs>
            <g clipPath="url(#sliderRecorte)">
              <image className="slider-foto" href={slide.imagen} x="0" y="0" width="580" height="420" preserveAspectRatio="xMidYMid slice" />
            </g>
          </svg>
        </div>
      </div>

      <div className="container slider-controles">
        <div className="slider-puntos">
          {SLIDES.map((s, n) => (
            <button
              key={s.id}
              type="button"
              className={n === i ? 'on' : ''}
              onClick={() => ir(n)}
              aria-label={`Ir al mensaje ${n + 1}`}
              aria-current={n === i}
            >
              <i key={`${i}-${pausado}`} style={{ animationDuration: `${AUTO_MS}ms`, animationPlayState: n === i && !pausado ? 'running' : 'paused' }} />
            </button>
          ))}
        </div>
        <div className="slider-flechas">
          <button type="button" onClick={() => setPausado((p) => !p)} aria-label={pausado ? 'Reanudar' : 'Pausar'}>
            {pausado ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button type="button" onClick={() => ir(i - 1)} aria-label="Mensaje anterior">
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={() => ir(i + 1)} aria-label="Mensaje siguiente">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  )
}
