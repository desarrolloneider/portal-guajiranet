'use client'

import { useMemo, useRef, useState } from 'react'
import { COLOMBIA, COL_HEIGHT, COL_WIDTH, DEPARTAMENTOS, proyectar } from '@/lib/colombia-map'
import { ENLACES_NAC, NODOS, SUBMARINOS, type Nodo } from '@/lib/red-nacional'

// Se amplia el lienzo a los lados para que las etiquetas de los nodos no queden cortadas.
const MARGEN_X = 108
const MARGEN_Y = 14
const VB_W = COL_WIDTH + MARGEN_X * 2
const VB_H = COL_HEIGHT + MARGEN_Y * 2
const VIEWBOX = `${-MARGEN_X} ${-MARGEN_Y} ${VB_W} ${VB_H}`

const PUNTOS = new Map(NODOS.map((n) => [n.id, { ...n, p: proyectar(n.lon, n.lat) }]))

type Segmento = { id: string; d: string; largo: number; dur: number; delay: number }
type NivelZoom = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
type Pan = { x: number; y: number }

/** Curva suave entre dos nodos: se desplaza el punto medio perpendicular al tramo. */
function curva(a: [number, number], b: [number, number], comba = 0.09) {
  const [x1, y1] = a
  const [x2, y2] = b
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  return `M${x1.toFixed(1)},${y1.toFixed(1)} Q${(mx - dy * comba).toFixed(1)},${(my + dx * comba).toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`
}

const dist = (a: [number, number], b: [number, number]) => Math.hypot(b[0] - a[0], b[1] - a[1])

const SEGMENTOS: Segmento[] = ENLACES_NAC.map(([da, db], i) => {
  const a = PUNTOS.get(da)!.p
  const b = PUNTOS.get(db)!.p
  const largo = dist(a, b)
  return {
    id: `${da}-${db}`,
    d: curva(a, b),
    largo,
    dur: Math.max(1.8, largo / 42),
    delay: (i * 0.37) % 4,
  }
})

const AMARRES = SUBMARINOS.map((s, i) => {
  const a = proyectar(s.mar[0], s.mar[1])
  const b = PUNTOS.get(s.destino)!.p
  return { id: s.id, mar: a, d: curva(a, b, 0.16), dur: 3 + i * 0.6, delay: i * 0.9 }
})

export function MapaNacional() {
  const [foco, setFoco] = useState<string | null>(null)
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [nivel, setNivel] = useState<NivelZoom>(1)
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 })
  const [arrastrando, setArrastrando] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const ultimoZoom = useRef(0)
  const gesto = useRef<{ pointerId: number; x: number; y: number; pan: Pan } | null>(null)
  const activo = useMemo(() => {
    const id = seleccionado ?? foco
    return id ? PUNTOS.get(id) : null
  }, [foco, seleccionado])
  const troncales = NODOS.filter((n) => n.rango === 'troncal')
  const nodoEnFoco = seleccionado ?? foco
  const etiquetas = nivel === 1
    ? troncales
    : nivel >= 4
      ? NODOS.filter((n) => n.rango === 'troncal' || n.id === nodoEnFoco)
      : NODOS
  const escalas: Record<NivelZoom, number> = { 1: 1, 2: 1.25, 3: 1.55, 4: 2, 5: 2.6, 6: 3.2, 7: 4, 8: 4.8 }
  const escala = escalas[nivel]

  const limitarPan = (siguiente: Pan, zoom = escala): Pan => {
    const rect = viewportRef.current?.getBoundingClientRect()
    const ancho = rect?.width ?? 640
    const alto = rect?.height ?? (ancho * VB_H) / VB_W
    const maxPanX = Math.max(0, ancho * zoom - ancho)
    const maxPanY = Math.max(0, alto * zoom - alto)
    return {
      x: Math.max(-maxPanX, Math.min(0, siguiente.x)),
      y: Math.max(-maxPanY, Math.min(0, siguiente.y)),
    }
  }

  const cambiarNivel = (direccion: 1 | -1, punto?: { x: number; y: number }) => {
    const siguiente = Math.min(8, Math.max(1, nivel + direccion)) as NivelZoom
    if (siguiente === nivel) return
    const escalaSiguiente = escalas[siguiente]
    const rect = viewportRef.current?.getBoundingClientRect()
    const foco = punto ?? { x: (rect?.width ?? 640) / 2, y: (rect?.height ?? 640) / 2 }
    const proporcion = escalaSiguiente / escala
    setPan((actual) => limitarPan({
      x: foco.x - (foco.x - actual.x) * proporcion,
      y: foco.y - (foco.y - actual.y) * proporcion,
    }, escalaSiguiente))
    setNivel(siguiente)
  }

  const manejarRueda = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const ahora = Date.now()
    if (ahora - ultimoZoom.current < 180 || Math.abs(e.deltaY) < 4) return
    ultimoZoom.current = ahora
    const rect = viewportRef.current?.getBoundingClientRect()
    const punto = rect ? { x: e.clientX - rect.left, y: e.clientY - rect.top } : undefined
    cambiarNivel(e.deltaY < 0 ? 1 : -1, punto)
  }

  const manejarInicioArrastre = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    gesto.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, pan }
    setArrastrando(true)
  }

  const manejarArrastre = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!gesto.current || gesto.current.pointerId !== e.pointerId) return
    const dx = (e.clientX - gesto.current.x) / escala
    const dy = (e.clientY - gesto.current.y) / escala
    setPan(limitarPan({ x: gesto.current.pan.x + dx, y: gesto.current.pan.y + dy }))
  }

  const terminarArrastre = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gesto.current?.pointerId !== e.pointerId) return
    gesto.current = null
    setArrastrando(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const conectado = (id: string) => (s: Segmento) => s.id.startsWith(`${id}-`) || s.id.endsWith(`-${id}`)

  return (
    <div
      className={`nac nac-zoom-${nivel}`}
      onWheelCapture={manejarRueda}
      onKeyDown={(e) => {
        if (e.key === '+' || e.key === '=') cambiarNivel(1)
        if (e.key === '-' || e.key === '_') cambiarNivel(-1)
      }}
      tabIndex={0}
      role="application"
      aria-label="Mapa nacional con zoom interactivo de ciudades conectadas"
    >
      <div className="nac-zoom-toolbar" aria-label="Controles de zoom del mapa nacional">
        <button type="button" onClick={() => cambiarNivel(-1)} disabled={nivel === 1} aria-label="Alejar mapa">−</button>
        <span>Nivel {nivel}/8</span>
        <button type="button" onClick={() => cambiarNivel(1)} disabled={nivel === 8} aria-label="Acercar mapa">+</button>
        <button type="button" onClick={() => { setNivel(1); setPan({ x: 0, y: 0 }); setSeleccionado(null) }} aria-label="Restablecer mapa">↺</button>
      </div>
      <div className="nac-zoom-copy" aria-live="polite">
        <strong>{nivel === 1 ? 'Vista nacional' : nivel <= 3 ? 'Ciudades conectadas' : 'Detalle de la red'}</strong>
        <span>{nivel === 1 ? 'Acerca la vista para ver todos los nodos' : 'Arrastra el mapa para explorar la red y toca una ciudad'}</span>
      </div>
      <div
        ref={viewportRef}
        className={`nac-viewport ${arrastrando ? 'is-dragging' : ''}`}
        onPointerDown={manejarInicioArrastre}
        onPointerMove={manejarArrastre}
        onPointerUp={terminarArrastre}
        onPointerCancel={terminarArrastre}
      >
      <svg viewBox={VIEWBOX} role="img" aria-label="Red troncal nacional de fibra óptica con los nodos conectados" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${escala})`, transformOrigin: '0 0' }}>
        <defs>
          <linearGradient id="nacPais" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#3fd0ff" />
            <stop offset="45%" stopColor="#1291f0" />
            <stop offset="100%" stopColor="#0b5fc4" />
          </linearGradient>
          <filter id="nacGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="9" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="nacRed" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g filter="url(#nacGlow)">
          <path d={COLOMBIA} className="nac-pais" fill="url(#nacPais)" />
        </g>
        <g className="nac-deps">
          {DEPARTAMENTOS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        <g filter="url(#nacRed)">
          {AMARRES.map((s) => (
            <path key={s.id} id={`sub-${s.id}`} d={s.d} className="nac-submarino" />
          ))}
          {AMARRES.map((s) => (
            <circle key={`${s.id}-p`} className="nac-pulso nac-pulso-sub" r="3.6">
              <animateMotion dur={`${s.dur}s`} begin={`${s.delay}s`} repeatCount="indefinite">
                <mpath href={`#sub-${s.id}`} />
              </animateMotion>
            </circle>
          ))}
          {AMARRES.map((s) => (
            <circle key={`${s.id}-m`} cx={s.mar[0]} cy={s.mar[1]} r="4.5" className="nac-mar" />
          ))}

          {SEGMENTOS.map((s) => (
            <path
              key={s.id}
              id={`nac-${s.id}`}
              d={s.d}
              className={`nac-enlace ${activo && conectado(activo.id)(s) ? 'hl' : ''}`}
            />
          ))}
          {SEGMENTOS.map((s) => (
            <path
              key={`${s.id}-f`}
              d={s.d}
              className="nac-flujo"
              strokeDasharray={`${Math.max(14, s.largo * 0.16).toFixed(4)} ${s.largo.toFixed(4)}`}
              style={{
                animationDuration: `${s.dur.toFixed(4)}s`,
                animationDelay: `${s.delay.toFixed(4)}s`,
              }}
            />
          ))}
          {SEGMENTOS.map((s) => (
            <circle key={`${s.id}-p`} className="nac-pulso" r="2.8">
              <animateMotion dur={`${s.dur}s`} begin={`${s.delay}s`} repeatCount="indefinite">
                <mpath href={`#nac-${s.id}`} />
              </animateMotion>
            </circle>
          ))}
        </g>

        <g className="nac-nodos">
          {NODOS.map((n) => {
            const [x, y] = PUNTOS.get(n.id)!.p
            const esTroncal = n.rango === 'troncal'
            return (
              <g
                key={n.id}
                transform={`translate(${x} ${y})`}
                className={`nac-nodo ${n.rango} ${foco === n.id ? 'hl' : ''}`}
                onMouseEnter={() => setFoco(n.id)}
                onMouseLeave={() => setFoco(null)}
                onFocus={() => setFoco(n.id)}
                onBlur={() => setFoco(null)}
                onClick={() => setSeleccionado(n.id)}
                tabIndex={0}
                role="button"
                aria-label={`${n.nombre}, ciudad conectada a la red nacional`}
              >
                {esTroncal && <circle className="nac-aro" r="9" />}
                <circle className="nac-punto" r={esTroncal ? 4.2 : 2.6} />
                {esTroncal && <circle className="nac-toque" r="14" />}
              </g>
            )
          })}
        </g>

        <g className="nac-etiquetas">
          {etiquetas.map((n) => {
            const [x, y] = PUNTOS.get(n.id)!.p
            const der = n.lado !== 'izq'
            const dx = der ? 15 : -15
            return (
              <g key={n.id} transform={`translate(${x} ${y})`} className={foco === n.id ? 'hl' : ''}>
                <g transform={`scale(${1 / escala})`}>
                  <line x1={der ? 6 : -6} y1={0} x2={dx} y2={0} className="nac-guia" />
                  <text x={dx + (der ? 4 : -4)} y={3.6} textAnchor={der ? 'start' : 'end'} className={`nac-label ${n.rango}`}>
                    {n.nombre}
                  </text>
                </g>
              </g>
            )
          })}
        </g>

        <g className="nac-leyenda" transform={`translate(${COL_WIDTH - 96} 108)`}>
          <line x1="0" y1="0" x2="34" y2="0" className="nac-leyenda-linea" />
          <text x="0" y="18" className="nac-leyenda-texto">FIBRA ÓPTICA</text>
          <text x="0" y="33" className="nac-leyenda-texto">SUBMARINA</text>
        </g>
      </svg>
      </div>

      {activo && (
        <div
          className="nac-tip"
          style={{ left: `${((activo.p[0] + MARGEN_X) / VB_W) * 100}%`, top: `${((activo.p[1] + MARGEN_Y) / VB_H) * 100}%` }}
        >
          <strong>{activo.nombre}</strong>
          <small>
            {activo.lat.toFixed(3)}° N · {Math.abs(activo.lon).toFixed(3)}° O
          </small>
        </div>
      )}
    </div>
  )
}

export type { Nodo }
