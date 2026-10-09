'use client'

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Minus, Plus, RotateCcw } from 'lucide-react'
import { COL_HEIGHT, COL_WIDTH, DEPARTAMENTOS, PAIS, proyectar } from '@/lib/colombia-map'
import { ENLACES_NAC, NODOS, SUBMARINOS, type Nodo } from '@/lib/red-nacional'
import { ZONAS_COBERTURA } from '@/lib/cobertura-zonas'
import { CODIGOS_CON_COBERTURA } from '@/lib/cobertura'

/* ------------------------------------------------------------------ */
/* Lienzo y datos fijos                                                */
/* ------------------------------------------------------------------ */

type Punto = [number, number]
type Vista = { k: number; tx: number; ty: number }
type Caja = [number, number, number, number]
type Metrica = { W: number; H: number; s: number; ox: number; oy: number }
type Pos = 'der' | 'izq' | 'arr' | 'aba' | 'dar' | 'dab' | 'iar' | 'iab'
type Etiqueta = { id: string; pos: Pos }
type MunicipioGeo = { codigo: string; nombre: string; d: string; centro: Punto }
type DeptoGeo = { codigo: string; nombre: string; caja: Caja; contorno: string; municipios: MunicipioGeo[] }

/** Pedido externo para mover el mapa (por ejemplo, desde el buscador de cobertura). */
export type DestinoMapa =
  | { tipo: 'depto'; codigo: string; clave: number }
  | { tipo: 'nodo'; id: string; clave: number }
  | { tipo: 'zonas'; ids: number[]; clave: number }
  | { tipo: 'punto'; lat: number; lng: number; estado: 'con' | 'probable' | 'sin'; clave: number }

type Pin = { x: number; y: number; estado: 'con' | 'probable' | 'sin' }

// Se amplía el lienzo a los lados para que las etiquetas de la costa no queden cortadas.
const MARGEN_X = 108
const MARGEN_Y = 14
const VB = { x: -MARGEN_X, y: -MARGEN_Y, w: COL_WIDTH + MARGEN_X * 2, h: COL_HEIGHT + MARGEN_Y * 2 }
const VIEWBOX = `${VB.x} ${VB.y} ${VB.w} ${VB.h}`
const CENTRO_VB: Punto = [VB.x + VB.w / 2, VB.y + VB.h / 2]
const IDENTIDAD: Vista = { k: 1, tx: 0, ty: 0 }
const K_MAX = 32
/** Desde este acercamiento se reconoce el departamento del centro y se dibujan sus municipios. */
const K_DETALLE = 1.9
/** Por debajo de este acercamiento se vuelve a la vista de todo el país. */
const K_NACIONAL = 1.3
/** Las etiquetas se dibujan con 10.5 unidades; en pantalla se ven a este tamaño en píxeles. */
const UNIDAD_ETIQUETA = 10.5

const NODO = new Map(NODOS.map((n) => [n.id, n]))
const PUNTOS = new Map<string, Punto>(NODOS.map((n) => [n.id, proyectar(n.lon, n.lat)]))
const DEPTO = new Map(DEPARTAMENTOS.map((d) => [d.codigo, d]))
const CON_SERVICIO = new Set(NODOS.map((n) => n.depto))
/** Departamento donde están las zonas de cobertura para hogares. */
const DEPTO_COBERTURA = '44'
/** En La Guajira cuentan las zonas de cobertura; en el resto del país, las ciudades de la red. */
const MPIOS_CON_SERVICIO = new Set([...NODOS.filter((n) => n.depto !== DEPTO_COBERTURA).map((n) => n.municipio), ...CODIGOS_CON_COBERTURA])
const DEPTOS_CON_SERVICIO = DEPARTAMENTOS.filter((d) => CON_SERVICIO.has(d.codigo))
const NODOS_DE = (codigo: string) =>
  NODOS.filter((n) => n.depto === codigo && (codigo !== DEPTO_COBERTURA || CODIGOS_CON_COBERTURA.has(n.municipio)))
const MPIOS_DE = (codigo: string) => (codigo === DEPTO_COBERTURA ? CODIGOS_CON_COBERTURA.size : new Set(NODOS_DE(codigo).map((n) => n.municipio)).size)
const RESUMEN_DEPTO = (codigo: string) => {
  const n = MPIOS_DE(codigo)
  if (codigo === DEPTO_COBERTURA) return `${n} ${n === 1 ? 'municipio' : 'municipios'} con cobertura`
  return `${n} ${n === 1 ? 'ciudad' : 'ciudades'} de nuestra red`
}

/* ---------- Zonas de cobertura (mapa de calor) ---------- */

const ZONAS_GEO = ZONAS_COBERTURA.map((z) => {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  const d = z.poligonos
    .flatMap((pol) =>
      pol.map((anillo) => {
        const pts = anillo.map(([lng, lat]) => {
          const [x, y] = proyectar(lng, lat)
          x0 = Math.min(x0, x)
          y0 = Math.min(y0, y)
          x1 = Math.max(x1, x)
          y1 = Math.max(y1, y)
          return `${x.toFixed(2)},${y.toFixed(2)}`
        })
        return `M${pts.join('L')}Z`
      }),
    )
    .join('')
  const [cx, cy] = proyectar(z.centro[1], z.centro[0])
  return { id: z.id, nombre: z.nombre, municipio: z.municipio, nivel: z.nivel, d, cx, cy, caja: [x0, y0, x1 - x0, y1 - y0] as Caja }
})
const ZONA_GEO = new Map(ZONAS_GEO.map((z) => [z.id, z]))
/** Radio del resplandor de cada zona en la vista de todo el país; se achica al acercar. */
const RADIO_CALOR = (nivel: number) => 4 + nivel * 2.2

/** Une varias cajas y les da un tamaño mínimo para que el acercamiento no sea exagerado. */
function unirCajas(cajas: Caja[], minimo = 9): Caja {
  const x0 = Math.min(...cajas.map((c) => c[0]))
  const y0 = Math.min(...cajas.map((c) => c[1]))
  const x1 = Math.max(...cajas.map((c) => c[0] + c[2]))
  const y1 = Math.max(...cajas.map((c) => c[1] + c[3]))
  const w = Math.max(minimo, x1 - x0)
  const h = Math.max(minimo, y1 - y0)
  return [(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w, h]
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Curva suave entre dos nodos: se desplaza el punto medio perpendicular al tramo. */
function curva(a: Punto, b: Punto, comba = 0.09) {
  const [x1, y1] = a
  const [x2, y2] = b
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  return `M${x1.toFixed(1)},${y1.toFixed(1)} Q${(mx - dy * comba).toFixed(1)},${(my + dx * comba).toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`
}

const SEGMENTOS = ENLACES_NAC.map(([da, db], i) => {
  const a = PUNTOS.get(da)!
  const b = PUNTOS.get(db)!
  const largo = Math.hypot(b[0] - a[0], b[1] - a[1])
  return { id: `${da}-${db}`, d: curva(a, b), largo, dur: Math.max(1.8, largo / 42), delay: (i * 0.37) % 4 }
})

const AMARRES = SUBMARINOS.map((s, i) => {
  const a = proyectar(s.mar[0], s.mar[1])
  const b = PUNTOS.get(s.destino)!
  return { id: s.id, mar: a, d: curva(a, b, 0.16), dur: 3 + i * 0.6, delay: i * 0.9, pais: s.pais, color: s.color, lado: s.lado }
})

/* ---------- Polígonos para saber en qué departamento está un punto ---------- */

function anillos(d: string): Punto[][] {
  return d
    .split('M')
    .filter(Boolean)
    .map((trozo) => {
      const n = (trozo.match(/-?(?:\d*\.\d+|\d+)/g) ?? []).map(Number)
      const pts: Punto[] = [[n[0], n[1]]]
      for (let i = 2; i + 1 < n.length; i += 2) {
        const [px, py] = pts[pts.length - 1]
        pts.push([px + n[i], py + n[i + 1]])
      }
      return pts
    })
}

let poligonos: { codigo: string; anillos: Punto[][] }[] | null = null
function deptoEn([x, y]: Punto) {
  poligonos ??= DEPARTAMENTOS.map((d) => ({ codigo: d.codigo, anillos: anillos(d.d) }))
  for (const p of poligonos) {
    let dentro = false
    for (const r of p.anillos) {
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const [xi, yi] = r[i]
        const [xj, yj] = r[j]
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro
      }
    }
    if (dentro) return p.codigo
  }
  return null
}

/* ---------- Municipios: un archivo por departamento, se pide al entrar ---------- */

const cache = new Map<string, Promise<DeptoGeo>>()
function cargarDepto(codigo: string) {
  let p = cache.get(codigo)
  if (!p) {
    p = fetch(`/mapa/departamentos/${codigo}.json`).then((r) => {
      if (!r.ok) throw new Error(`No se pudo cargar el departamento ${codigo}`)
      return r.json() as Promise<DeptoGeo>
    })
    p.catch(() => cache.delete(codigo))
    cache.set(codigo, p)
  }
  return p
}

/* ---------- Zoom suave (van Wijk y Nuij, 2003): aleja un poco al viajar lejos ---------- */

const RHO = Math.SQRT2
function zoomSuave(a: [number, number, number], b: [number, number, number]) {
  const [ux0, uy0, w0] = a
  const [ux1, uy1, w1] = b
  const dx = ux1 - ux0
  const dy = uy1 - uy0
  const d2 = dx * dx + dy * dy
  if (d2 < 1e-9) {
    const S = Math.log(w1 / w0) / RHO
    return { S: Math.abs(S), en: (t: number): [number, number, number] => [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(RHO * t * S)] }
  }
  const d1 = Math.sqrt(d2)
  const b0 = (w1 * w1 - w0 * w0 + RHO ** 4 * d2) / (2 * w0 * RHO ** 2 * d1)
  const b1 = (w1 * w1 - w0 * w0 - RHO ** 4 * d2) / (2 * w1 * RHO ** 2 * d1)
  const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0)
  const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1)
  const S = (r1 - r0) / RHO
  return {
    S,
    en: (t: number): [number, number, number] => {
      const s = t * S
      const c0 = Math.cosh(r0)
      const u = (w0 / (RHO ** 2 * d1)) * (c0 * Math.tanh(RHO * s + r0) - Math.sinh(r0))
      return [ux0 + u * dx, uy0 + u * dy, (w0 * c0) / Math.cosh(RHO * s + r0)]
    },
  }
}

/** Mantiene el recorte visible dentro del lienzo (en k = 1 el mapa queda fijo). */
function limitar(v: Vista): Vista {
  const k = clamp(v.k, 1, K_MAX)
  const mediaW = VB.w / 2 / k
  const mediaH = VB.h / 2 / k
  const wx = clamp((CENTRO_VB[0] - v.tx) / k, VB.x + mediaW, VB.x + VB.w - mediaW)
  const wy = clamp((CENTRO_VB[1] - v.ty) / k, VB.y + mediaH, VB.y + VB.h - mediaH)
  return { k, tx: CENTRO_VB[0] - wx * k, ty: CENTRO_VB[1] - wy * k }
}

const centroDe = (v: Vista): [number, number, number] => [(CENTRO_VB[0] - v.tx) / v.k, (CENTRO_VB[1] - v.ty) / v.k, VB.w / v.k]
const vistaDe = ([cx, cy, w]: [number, number, number]): Vista => {
  const k = VB.w / w
  return { k, tx: CENTRO_VB[0] - cx * k, ty: CENTRO_VB[1] - cy * k }
}

/** Etiquetas antes de medir: troncales hacia su lado preferido. */
const ETIQUETAS_INICIALES: Etiqueta[] = NODOS.filter((n) => n.rango === 'troncal').map((n) => ({ id: n.id, pos: n.lado === 'izq' ? 'izq' : 'der' }))

const TEXTO: Record<Pos, { x: number; y: number; anchor: 'start' | 'end' | 'middle' }> = {
  der: { x: 17, y: 3.6, anchor: 'start' },
  izq: { x: -17, y: 3.6, anchor: 'end' },
  arr: { x: 0, y: -12, anchor: 'middle' },
  aba: { x: 0, y: 19, anchor: 'middle' },
  dar: { x: 11, y: -8, anchor: 'start' },
  dab: { x: 11, y: 15, anchor: 'start' },
  iar: { x: -11, y: -8, anchor: 'end' },
  iab: { x: -11, y: 15, anchor: 'end' },
}
const ORDEN_DER: Pos[] = ['der', 'izq', 'dar', 'dab', 'iar', 'iab', 'arr', 'aba']
const ORDEN_IZQ: Pos[] = ['izq', 'der', 'iar', 'iab', 'dar', 'dab', 'arr', 'aba']

/* ------------------------------------------------------------------ */
/* Capas que no cambian con el zoom (se memorizan para no redibujarlas) */
/* ------------------------------------------------------------------ */

const Tierra = memo(function Tierra({ depto }: { depto: string | null }) {
  return (
    <g className="nac-tierra">
      {DEPARTAMENTOS.map((d) => {
        const activo = CON_SERVICIO.has(d.codigo)
        return (
          <path
            key={d.codigo}
            d={d.d}
            data-depto={activo ? d.codigo : undefined}
            className={`nac-depto${activo ? ' activo' : ''}${depto === d.codigo ? ' sel' : ''}`}
          />
        )
      })}
    </g>
  )
})

const Municipios = memo(function Municipios({ geo }: { geo: DeptoGeo }) {
  return (
    <g className="nac-municipios" key={geo.codigo}>
      {geo.municipios.map((m, i) => (
        <path key={`${m.codigo}-${i}`} d={m.d} data-mpio={m.codigo} className={MPIOS_CON_SERVICIO.has(m.codigo) ? 'con' : undefined} />
      ))}
      <path d={geo.contorno} className="nac-contorno" />
    </g>
  )
})

const Calor = memo(function Calor() {
  return (
    <g className="nac-calor">
      {ZONAS_GEO.map((z) => (
        <circle key={`h-${z.id}`} className="nac-calor-halo" cx={z.cx} cy={z.cy} r={RADIO_CALOR(z.nivel)} data-r={RADIO_CALOR(z.nivel)} fill={`url(#nacCalor${z.nivel})`} />
      ))}
      {ZONAS_GEO.map((z) => (
        <path key={z.id} d={z.d} data-zona={z.id} className={`nac-zona n${z.nivel}`} fillRule="evenodd" />
      ))}
    </g>
  )
})

const Red = memo(function Red({ activo }: { activo: string | null }) {
  const conectado = (s: { id: string }) => !!activo && (s.id.startsWith(`${activo}-`) || s.id.endsWith(`-${activo}`))
  return (
    <g className="nac-red" filter="url(#nacRed)">
      {AMARRES.map((s) => (
        <path key={s.id} id={`sub-${s.id}`} d={s.d} className="nac-submarino" style={{ stroke: s.color }} />
      ))}
      {AMARRES.map((s) => (
        <circle key={`${s.id}-p`} className="nac-pulso nac-pulso-sub" r="3.6" data-r="3.6" style={{ fill: s.color }}>
          <animateMotion dur={`${s.dur}s`} begin={`${s.delay}s`} repeatCount="indefinite">
            <mpath href={`#sub-${s.id}`} />
          </animateMotion>
        </circle>
      ))}
      {AMARRES.map((s) => (
        <circle key={`${s.id}-m`} cx={s.mar[0]} cy={s.mar[1]} r="4.5" data-r="4.5" className="nac-pulso nac-mar" style={{ fill: s.color }} />
      ))}
      {SEGMENTOS.map((s) => (
        <path key={`${s.id}-c`} d={s.d} className="nac-casco" />
      ))}
      {SEGMENTOS.map((s) => (
        <path key={s.id} id={`nac-${s.id}`} d={s.d} className={`nac-enlace${conectado(s) ? ' hl' : ''}`} />
      ))}
      {SEGMENTOS.map((s) => (
        <path
          key={`${s.id}-f`}
          d={s.d}
          className="nac-flujo"
          strokeDasharray={`${Math.max(14, s.largo * 0.16).toFixed(4)} ${s.largo.toFixed(4)}`}
          style={{ animationDuration: `${s.dur.toFixed(4)}s`, animationDelay: `${s.delay.toFixed(4)}s` }}
        />
      ))}
      {SEGMENTOS.map((s) => (
        <circle key={`${s.id}-p`} className="nac-pulso" r="2.8" data-r="2.8">
          <animateMotion dur={`${s.dur}s`} begin={`${s.delay}s`} repeatCount="indefinite">
            <mpath href={`#nac-${s.id}`} />
          </animateMotion>
        </circle>
      ))}
    </g>
  )
})

/* ------------------------------------------------------------------ */
/* Mapa                                                                */
/* ------------------------------------------------------------------ */

export function MapaNacional({ destino }: { destino?: DestinoMapa | null }) {
  const raizRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const mundoRef = useRef<SVGGElement>(null)
  const barraRef = useRef<HTMLDivElement>(null)
  const herramientasRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const avisoRef = useRef<HTMLDivElement>(null)

  const vista = useRef<Vista>(IDENTIDAD)
  const metrica = useRef<Metrica | null>(null)
  const raf = useRef(0)
  const animando = useRef(false)
  const reducir = useRef(false)
  const activo = useRef(false)
  const arrastro = useRef(false)
  const gestos = useRef(new Map<number, { x: number; y: number }>())
  const arrastre = useRef<{ id: number; x0: number; y0: number; v0: Vista; movio: boolean } | null>(null)
  const pinza = useRef<{ d0: number; v0: Vista; mundo: Punto } | null>(null)
  const temporizador = useRef(0)

  const [depto, setDepto] = useState<string | null>(null)
  const [geo, setGeo] = useState<DeptoGeo | null>(null)
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [asentado, setAsentado] = useState(0)
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>(ETIQUETAS_INICIALES)
  const [pin, setPin] = useState<Pin | null>(null)

  const deptoRef = useRef(depto)
  const selRef = useRef(seleccionado)
  const geoRef = useRef(geo)
  deptoRef.current = depto
  selRef.current = seleccionado
  geoRef.current = geo

  const municipiosPorCodigo = useMemo(() => new Map((geo?.municipios ?? []).map((m) => [m.codigo, m])), [geo])

  /* ---------- Medidas y conversión de coordenadas ---------- */

  const medir = useCallback((): Metrica | null => {
    if (metrica.current) return metrica.current
    const r = svgRef.current?.getBoundingClientRect()
    if (!r || !r.width) return null
    const s = Math.min(r.width / VB.w, r.height / VB.h)
    metrica.current = { W: r.width, H: r.height, s, ox: (r.width - VB.w * s) / 2, oy: (r.height - VB.h * s) / 2 }
    return metrica.current
  }, [])

  const tamanoEtiqueta = (m: Metrica) => (m.W < 420 ? 9 : 9.5)

  /** Mundo (coordenadas del mapa) a píxeles dentro del SVG. */
  const aPantalla = (p: Punto, v: Vista, m: Metrica): Punto => [
    (p[0] * v.k + v.tx - VB.x) * m.s + m.ox,
    (p[1] * v.k + v.ty - VB.y) * m.s + m.oy,
  ]
  /** Píxeles dentro del SVG a coordenadas del viewBox. */
  const aViewBox = (x: number, y: number, m: Metrica): Punto => [VB.x + (x - m.ox) / m.s, VB.y + (y - m.oy) / m.s]

  /** Zona del SVG que no tapan la barra superior ni el panel inferior. */
  const zonaLibre = useCallback((m: Metrica) => {
    const svg = svgRef.current!.getBoundingClientRect()
    const barra = barraRef.current?.getBoundingClientRect()
    const info = infoRef.current?.getBoundingClientRect()
    const arriba = barra ? barra.bottom - svg.top + 10 : 16
    const abajo = info ? svg.bottom - info.top + 10 : 16
    return { x0: 14, y0: Math.max(16, arriba), x1: m.W - 14, y1: m.H - Math.max(16, abajo) }
  }, [])

  const encuadrar = useCallback(
    (caja: Caja): Vista => {
      const m = medir()
      if (!m) return IDENTIDAD
      const z = zonaLibre(m)
      const [bx, by, bw, bh] = caja
      const k = clamp(Math.min((z.x1 - z.x0) / (bw * m.s), (z.y1 - z.y0) / (bh * m.s)), 1, K_MAX)
      const [vx, vy] = aViewBox((z.x0 + z.x1) / 2, (z.y0 + z.y1) / 2, m)
      return limitar({ k, tx: vx - (bx + bw / 2) * k, ty: vy - (by + bh / 2) * k })
    },
    [medir, zonaLibre],
  )

  /* ---------- Aplicar una vista sin pasar por React (se llama en cada cuadro) ---------- */

  const aplicar = useCallback(
    (v: Vista) => {
      vista.current = v
      const svg = svgRef.current
      const mundo = mundoRef.current
      if (!svg || !mundo) return
      const m = medir()
      mundo.setAttribute('transform', `translate(${v.tx.toFixed(3)} ${v.ty.toFixed(3)}) scale(${v.k.toFixed(5)})`)
      const q = m ? tamanoEtiqueta(m) / (UNIDAD_ETIQUETA * v.k * m.s) : 1 / v.k
      svg.querySelectorAll<SVGGElement>('.nac-escala').forEach((g) => g.setAttribute('transform', `scale(${q.toFixed(5)})`))
      svg.querySelectorAll<SVGCircleElement>('.nac-pulso').forEach((c) => c.setAttribute('r', (Number(c.dataset.r) / v.k).toFixed(4)))
      svg.querySelectorAll<SVGCircleElement>('.nac-calor-halo').forEach((c) => c.setAttribute('r', (Number(c.dataset.r) / Math.pow(v.k, 0.75)).toFixed(4)))
      const halo = clamp(1 - (v.k - 1) / 0.7, 0, 1)
      svg.style.setProperty('--halo', halo.toFixed(3))
      const raiz = raizRef.current
      raiz?.classList.toggle('nac-acercado', v.k > 1.02)
      raiz?.classList.toggle('nac-sin-halo', halo === 0)
    },
    [medir],
  )

  /* ---------- Tooltip (se maneja directo en el DOM para no redibujar el mapa) ---------- */

  const mostrarTip = useCallback((titulo: string, detalle: string, x: number, y: number) => {
    const el = tipRef.current
    const raiz = raizRef.current
    if (!el || !raiz) return
    el.children[0].textContent = titulo
    el.children[1].textContent = detalle
    const ancho = raiz.clientWidth
    el.style.left = `${clamp(x, 70, ancho - 70)}px`
    el.style.top = `${y}px`
    el.classList.add('on')
  }, [])

  const ocultarTip = useCallback(() => tipRef.current?.classList.remove('on'), [])

  /** Posición de un nodo relativa a la caja del mapa (para ubicar el tooltip). */
  const posicionNodo = useCallback(
    (id: string): Punto | null => {
      const m = medir()
      const svg = svgRef.current?.getBoundingClientRect()
      const raiz = raizRef.current?.getBoundingClientRect()
      const p = PUNTOS.get(id)
      if (!m || !svg || !raiz || !p) return null
      const [x, y] = aPantalla(p, vista.current, m)
      return [x + svg.left - raiz.left, y + svg.top - raiz.top]
    },
    [medir],
  )

  const tipNodo = useCallback(
    (id: string) => {
      const n = NODO.get(id)
      const pos = posicionNodo(id)
      if (!n || !pos) return
      mostrarTip(n.nombre, DEPTO.get(n.depto)?.nombre ?? '', pos[0], pos[1] - 10)
    },
    [mostrarTip, posicionNodo],
  )

  const restaurarTip = useCallback(() => {
    if (selRef.current && !animando.current) tipNodo(selRef.current)
    else ocultarTip()
  }, [ocultarTip, tipNodo])

  /* ---------- Etiquetas sin encimarse (se recalculan cuando la vista se detiene) ---------- */

  const calcularEtiquetas = useCallback(() => {
    const m = medir()
    const svg = svgRef.current
    if (!m || !svg) return
    const v = vista.current
    const t = tamanoEtiqueta(m)
    const u = t / UNIDAD_ETIQUETA
    const lienzo = document.createElement('canvas').getContext('2d')
    if (!lienzo) return
    lienzo.font = `800 ${t}px ${getComputedStyle(svg).fontFamily}`
    const d = deptoRef.current
    const sel = selRef.current

    const libre = zonaLibre(m)
    const obstaculos: Caja[] = []
    const visibles = NODOS.map((n) => ({ n, p: aPantalla(PUNTOS.get(n.id)!, v, m) })).filter(
      ({ p }) => p[0] > -10 && p[0] < m.W + 10 && p[1] > -10 && p[1] < m.H + 10,
    )
    const puntoDe = new Map<string, Caja>()
    for (const { n, p } of visibles) {
      const r = (n.rango === 'troncal' ? 8 : 3.5) * u
      const c: Caja = [p[0] - r, p[1] - r, p[0] + r, p[1] + r]
      puntoDe.set(n.id, c)
      obstaculos.push(c)
    }
    // Primero la ciudad elegida, luego las del departamento abierto, luego las troncales (La Guajira adelante).
    const prioridad = (n: Nodo) =>
      (n.id === sel ? 100 : 0) + (d && n.depto === d ? 50 : 0) + (n.rango === 'troncal' ? 20 : 0) + (!d && n.depto === '44' ? 5 : 0)
    const candidatos = visibles
      .filter(({ n }) => n.id === sel || n.rango === 'troncal' || (d && n.depto === d) || v.k >= 3)
      .sort((a, b) => prioridad(b.n) - prioridad(a.n))

    const choca = (a: Caja, b: Caja) => a[0] < b[2] + 2 && a[2] + 2 > b[0] && a[1] < b[3] + 1 && a[3] + 1 > b[1]
    const resultado: Etiqueta[] = []
    const colocadas: Caja[] = []
    for (const { n, p } of candidatos) {
      const ancho = lienzo.measureText(n.nombre.toUpperCase()).width + n.nombre.length * t * 0.06
      const alto = t
      const orden = n.lado === 'izq' ? ORDEN_IZQ : ORDEN_DER
      let elegida: Pos | null = null
      for (const pos of orden) {
        const tx = TEXTO[pos]
        const base = p[1] + tx.y * u
        const x0 = tx.anchor === 'start' ? p[0] + tx.x * u : tx.anchor === 'end' ? p[0] + tx.x * u - ancho : p[0] - ancho / 2
        const c: Caja = [x0, base - alto * 0.78, x0 + ancho, base + alto * 0.22]
        if (c[0] < 2 || c[2] > m.W - 2 || c[1] < libre.y0 - 8 || c[3] > libre.y1 + 8) continue
        const propio = puntoDe.get(n.id)
        if (colocadas.some((o) => choca(c, o)) || obstaculos.some((o) => o !== propio && choca(c, o))) continue
        elegida = pos
        colocadas.push(c)
        break
      }
      if (!elegida && n.id === sel) elegida = orden[0]
      if (elegida) resultado.push({ id: n.id, pos: elegida })
    }
    setEtiquetas(resultado)
  }, [medir, zonaLibre])

  /* ---------- Departamento activo ---------- */

  const activarDepto = useCallback((codigo: string | null) => {
    if (codigo === deptoRef.current) return
    deptoRef.current = codigo
    setDepto(codigo)
    setGeo(null)
    if (!codigo) return
    cargarDepto(codigo)
      .then((g) => {
        if (deptoRef.current === codigo) setGeo(g)
      })
      .catch(() => undefined)
  }, [])

  /** Se llama cuando la vista se detiene. Si el movimiento fue manual, reconoce el departamento del centro. */
  const asentar = useCallback(
    (manual: boolean) => {
      const v = vista.current
      if (manual) {
        if (v.k < K_NACIONAL) {
          activarDepto(null)
          selRef.current = null
          setSeleccionado(null)
        } else if (v.k >= K_DETALLE) {
          const m = medir()
          if (m) {
            const z = zonaLibre(m)
            const [vx, vy] = aViewBox((z.x0 + z.x1) / 2, (z.y0 + z.y1) / 2, m)
            const codigo = deptoEn([(vx - v.tx) / v.k, (vy - v.ty) / v.k])
            if (codigo && CON_SERVICIO.has(codigo)) activarDepto(codigo)
          }
        }
      }
      setAsentado((n) => n + 1)
    },
    [activarDepto, medir, zonaLibre],
  )

  const detener = useCallback(() => {
    cancelAnimationFrame(raf.current)
    if (animando.current) {
      animando.current = false
      raizRef.current?.classList.remove('nac-moviendo')
    }
  }, [])

  const animar = useCallback(
    (hasta: Vista, opciones: { manual?: boolean; duracion?: number } = {}) => {
      detener()
      const desde = vista.current
      const fin = limitar(hasta)
      if (reducir.current || !medir()) {
        aplicar(fin)
        asentar(!!opciones.manual)
        return
      }
      const trayecto = zoomSuave(centroDe(desde), centroDe(fin))
      const dur = opciones.duracion ?? clamp(Math.abs(trayecto.S) * 820, 420, 1300)
      const t0 = performance.now()
      animando.current = true
      raizRef.current?.classList.add('nac-moviendo')
      ocultarTip()
      const paso = (ahora: number) => {
        const t = Math.min(1, (ahora - t0) / dur)
        if (t < 1) {
          aplicar(vistaDe(trayecto.en(suave(t))))
          raf.current = requestAnimationFrame(paso)
        } else {
          aplicar(fin)
          animando.current = false
          raizRef.current?.classList.remove('nac-moviendo')
          asentar(!!opciones.manual)
        }
      }
      raf.current = requestAnimationFrame(paso)
    },
    [aplicar, asentar, detener, medir, ocultarTip],
  )

  const irADepto = useCallback(
    (codigo: string, nodo: string | null = null) => {
      const d = DEPTO.get(codigo)
      if (!d) return
      activarDepto(codigo)
      selRef.current = nodo
      setSeleccionado(nodo)
      // Se espera un cuadro para que el panel inferior ya muestre el departamento y se pueda medir.
      requestAnimationFrame(() => animar(encuadrar(d.caja)))
    },
    [activarDepto, animar, encuadrar],
  )

  /** Acerca el mapa a una o varias zonas de cobertura. */
  const irAZonas = useCallback(
    (ids: number[]) => {
      const cajas = ids.map((id) => ZONA_GEO.get(id)?.caja).filter((c): c is Caja => !!c)
      if (!cajas.length) return
      activarDepto(DEPTO_COBERTURA)
      selRef.current = null
      setSeleccionado(null)
      requestAnimationFrame(() => animar(encuadrar(unirCajas(cajas))))
    },
    [activarDepto, animar, encuadrar],
  )

  /** Marca un punto buscado (dirección, barrio o ubicación de la persona) y acerca el mapa. */
  const irAPunto = useCallback(
    (lat: number, lng: number, estado: Pin['estado']) => {
      const [x, y] = proyectar(lng, lat)
      const codigo = deptoEn([x, y])
      activarDepto(codigo && CON_SERVICIO.has(codigo) ? codigo : DEPTO_COBERTURA)
      selRef.current = null
      setSeleccionado(null)
      setPin({ x, y, estado })
      requestAnimationFrame(() => animar(encuadrar(unirCajas([[x, y, 0, 0]], 7))))
    },
    [activarDepto, animar, encuadrar],
  )

  const volver = useCallback(() => {
    activarDepto(null)
    selRef.current = null
    setSeleccionado(null)
    setPin(null)
    ocultarTip()
    requestAnimationFrame(() => animar(IDENTIDAD))
  }, [activarDepto, animar, ocultarTip])

  const zoomBoton = useCallback(
    (factor: number) => {
      const m = medir()
      if (!m) return
      const z = zonaLibre(m)
      const v = vista.current
      const [vx, vy] = aViewBox((z.x0 + z.x1) / 2, (z.y0 + z.y1) / 2, m)
      const wx = (vx - v.tx) / v.k
      const wy = (vy - v.ty) / v.k
      const k = clamp(v.k * factor, 1, K_MAX)
      animar({ k, tx: vx - wx * k, ty: vy - wy * k }, { manual: true, duracion: 360 })
    },
    [animar, medir, zonaLibre],
  )

  const elegirNodo = useCallback(
    (id: string) => {
      const n = NODO.get(id)
      if (!n) return
      if (n.depto !== deptoRef.current) {
        irADepto(n.depto, id)
        return
      }
      selRef.current = id
      setSeleccionado(id)
      tipNodo(id)
    },
    [irADepto, tipNodo],
  )

  /* ---------- Efectos ---------- */

  useEffect(() => {
    reducir.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Cada render puede crear etiquetas nuevas: se les aplica la escala actual.
  useLayoutEffect(() => {
    aplicar(vista.current)
  })

  // Medidas: al cambiar el tamaño se recalcula y, si hay un departamento, se vuelve a encuadrar.
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      metrica.current = null
      if (animando.current) return
      const d = deptoRef.current ? DEPTO.get(deptoRef.current) : null
      aplicar(d && !arrastre.current ? encuadrar(d.caja) : limitar(vista.current))
      setAsentado((n) => n + 1)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [aplicar, encuadrar])

  useEffect(() => {
    calcularEtiquetas()
    restaurarTip()
  }, [asentado, depto, seleccionado, geo, calcularEtiquetas, restaurarTip])

  // Pedidos desde fuera (buscador, chips de municipios).
  useEffect(() => {
    if (!destino) return
    if (destino.tipo === 'punto') return irAPunto(destino.lat, destino.lng, destino.estado)
    setPin(null)
    if (destino.tipo === 'zonas') irAZonas(destino.ids)
    else if (destino.tipo === 'depto') irADepto(destino.codigo)
    else {
      const n = NODO.get(destino.id)
      if (n) irADepto(n.depto, n.id)
    }
    // Solo reacciona a pedidos nuevos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destino?.clave])

  // Rueda: acerca con Ctrl/⌘ o cuando ya se está usando el mapa, para no secuestrar el scroll de la página.
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey || activo.current)) {
        const aviso = avisoRef.current
        if (aviso) {
          aviso.classList.add('on')
          window.clearTimeout(Number(aviso.dataset.t))
          aviso.dataset.t = String(window.setTimeout(() => aviso.classList.remove('on'), 1400))
        }
        return
      }
      e.preventDefault()
      const m = medir()
      const svg = svgRef.current?.getBoundingClientRect()
      if (!m || !svg) return
      detener()
      ocultarTip()
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      const factor = Math.exp(-delta * (e.ctrlKey ? 0.01 : 0.0022))
      const v = vista.current
      const [vx, vy] = aViewBox(e.clientX - svg.left, e.clientY - svg.top, m)
      const wx = (vx - v.tx) / v.k
      const wy = (vy - v.ty) / v.k
      const k = clamp(v.k * factor, 1, K_MAX)
      aplicar(limitar({ k, tx: vx - wx * k, ty: vy - wy * k }))
      window.clearTimeout(temporizador.current)
      temporizador.current = window.setTimeout(() => asentar(true), 180)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [aplicar, asentar, detener, medir, ocultarTip])

  useEffect(() => () => {
    cancelAnimationFrame(raf.current)
    window.clearTimeout(temporizador.current)
  }, [])

  /* ---------- Gestos: arrastrar y pellizcar ---------- */

  const alPresionar = (e: React.PointerEvent<HTMLDivElement>) => {
    activo.current = true
    if (e.pointerType === 'mouse' && e.button !== 0) return
    gestos.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (gestos.current.size === 1) {
      arrastre.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, v0: vista.current, movio: false }
    } else if (gestos.current.size === 2) {
      const [a, b] = [...gestos.current.values()]
      const m = medir()
      const svg = svgRef.current?.getBoundingClientRect()
      if (!m || !svg) return
      const v = vista.current
      const [vx, vy] = aViewBox((a.x + b.x) / 2 - svg.left, (a.y + b.y) / 2 - svg.top, m)
      pinza.current = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, v0: v, mundo: [(vx - v.tx) / v.k, (vy - v.ty) / v.k] }
      arrastre.current = null
      detener()
      ocultarTip()
    }
  }

  const alMover = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!gestos.current.has(e.pointerId)) return
    gestos.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const m = medir()
    const svg = svgRef.current?.getBoundingClientRect()
    if (!m || !svg) return
    if (pinza.current && gestos.current.size >= 2) {
      const [a, b] = [...gestos.current.values()]
      const { d0, v0, mundo } = pinza.current
      const k = clamp((v0.k * Math.hypot(a.x - b.x, a.y - b.y)) / d0, 1, K_MAX)
      const [vx, vy] = aViewBox((a.x + b.x) / 2 - svg.left, (a.y + b.y) / 2 - svg.top, m)
      aplicar(limitar({ k, tx: vx - mundo[0] * k, ty: vy - mundo[1] * k }))
      return
    }
    const g = arrastre.current
    if (!g || g.id !== e.pointerId) return
    const dx = e.clientX - g.x0
    const dy = e.clientY - g.y0
    if (!g.movio) {
      if (Math.hypot(dx, dy) < 5 || vista.current.k <= 1.01) return
      g.movio = true
      e.currentTarget.setPointerCapture(e.pointerId)
      raizRef.current?.classList.add('nac-arrastrando')
      detener()
      ocultarTip()
    }
    aplicar(limitar({ k: g.v0.k, tx: g.v0.tx + dx / m.s, ty: g.v0.ty + dy / m.s }))
  }

  const alSoltar = (e: React.PointerEvent<HTMLDivElement>) => {
    gestos.current.delete(e.pointerId)
    if (pinza.current) {
      if (gestos.current.size < 2) {
        pinza.current = null
        asentar(true)
      }
      return
    }
    const g = arrastre.current
    if (g && g.id === e.pointerId) {
      if (g.movio) {
        // El clic que llega justo después de arrastrar no debe abrir nada.
        arrastro.current = true
        window.setTimeout(() => {
          arrastro.current = false
        }, 0)
        raizRef.current?.classList.remove('nac-arrastrando')
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
        asentar(true)
      }
      arrastre.current = null
    }
  }

  /* ---------- Clics y hover con delegación ---------- */

  const alClic = (e: React.MouseEvent<SVGSVGElement>) => {
    const el = e.target as Element
    const nodo = el.closest('[data-nodo]')?.getAttribute('data-nodo')
    if (nodo) return elegirNodo(nodo)
    const zona = el.closest('[data-zona]')?.getAttribute('data-zona')
    if (zona) return irAZonas([Number(zona)])
    const mpio = el.closest('[data-mpio]')?.getAttribute('data-mpio')
    if (mpio && MPIOS_CON_SERVICIO.has(mpio)) {
      const n = NODOS.find((x) => x.municipio === mpio)
      if (n) return elegirNodo(n.id)
    }
    const d = el.closest('[data-depto]')?.getAttribute('data-depto')
    if (d && d !== deptoRef.current) irADepto(d)
  }

  const alPasar = (e: React.PointerEvent<SVGSVGElement>) => {
    if (animando.current || arrastre.current?.movio || pinza.current || e.pointerType === 'touch') return
    const el = e.target as Element
    const raiz = raizRef.current?.getBoundingClientRect()
    if (!raiz) return
    const x = e.clientX - raiz.left
    const y = e.clientY - raiz.top
    const nodo = el.closest('[data-nodo]')?.getAttribute('data-nodo')
    if (nodo) return tipNodo(nodo)
    const zona = ZONA_GEO.get(Number(el.closest('[data-zona]')?.getAttribute('data-zona')))
    if (zona) return mostrarTip(zona.nombre, `Zona con cobertura · ${zona.municipio}`, x, y - 14)
    const mpio = el.closest('[data-mpio]')?.getAttribute('data-mpio')
    if (mpio) {
      const m = municipiosPorCodigo.get(mpio)
      const detalle = !MPIOS_CON_SERVICIO.has(mpio)
        ? 'Escríbenos para consultar'
        : mpio.startsWith(DEPTO_COBERTURA)
          ? 'Con cobertura Guajiranet'
          : 'Ciudad de nuestra red'
      if (m) return mostrarTip(m.nombre, detalle, x, y - 14)
    }
    const d = el.closest('[data-depto]')?.getAttribute('data-depto')
    if (d && d !== deptoRef.current) {
      return mostrarTip(DEPTO.get(d)?.nombre ?? '', `${RESUMEN_DEPTO(d)} · toca para ver`, x, y - 14)
    }
    restaurarTip()
  }

  const alTeclaNodo = (e: React.KeyboardEvent<SVGGElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      elegirNodo(id)
    }
  }

  const alTecla = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName === 'SELECT') return
    if (e.key === '+' || e.key === '=') zoomBoton(1.6)
    else if (e.key === '-' || e.key === '_') zoomBoton(1 / 1.6)
    else if (e.key === 'Escape' || e.key === '0') volver()
  }

  /* ---------- Render ---------- */

  const infoDepto = depto ? DEPTO.get(depto) : null
  const nodosDepto = depto ? NODOS_DE(depto) : []

  return (
    <div
      ref={raizRef}
      className={`nac${depto ? ' nac-con-depto' : ''}`}
      onKeyDown={alTecla}
      onPointerLeave={() => {
        activo.current = false
      }}
      role="region"
      aria-label="Mapa de la red de Guajiranet por departamentos"
    >
      <div className="nac-barra" ref={barraRef}>
        {depto && (
          <button type="button" className="nac-volver" onClick={volver}>
            <ArrowLeft size={15} aria-hidden="true" /> <span>Colombia</span>
          </button>
        )}
        <label className="nac-selector">
          <span className="sr-only">Ver un departamento</span>
          <select value={depto ?? ''} onChange={(e) => (e.target.value ? irADepto(e.target.value) : volver())}>
            <option value="">Toda Colombia</option>
            {DEPTOS_CON_SERVICIO.map((d) => (
              <option key={d.codigo} value={d.codigo}>
                {d.nombre}
              </option>
            ))}
          </select>
        </label>
        <div className="nac-herramientas" ref={herramientasRef} aria-label="Acercar o alejar el mapa">
          <button type="button" onClick={() => zoomBoton(1 / 1.6)} aria-label="Alejar">
            <Minus size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => zoomBoton(1.6)} aria-label="Acercar">
            <Plus size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={volver} aria-label="Ver toda Colombia">
            <RotateCcw size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="nac-viewport"
        onPointerDown={alPresionar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        onClickCapture={(e) => {
          if (arrastro.current) {
            e.stopPropagation()
            e.preventDefault()
            arrastro.current = false
          }
        }}
      >
        <svg
          ref={svgRef}
          viewBox={VIEWBOX}
          role="img"
          aria-label="Mapa de Colombia con la red de fibra de Guajiranet"
          onClick={alClic}
          onPointerOver={alPasar}
          onPointerMove={alPasar}
          onPointerLeave={restaurarTip}
        >
          <defs>
            <linearGradient id="nacPais" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="248" y2="830">
              <stop offset="0%" stopColor="#fbe8c8" />
              <stop offset="45%" stopColor="#f5d39f" />
              <stop offset="100%" stopColor="#edbd78" />
            </linearGradient>
            <linearGradient id="nacPaisClaro" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="248" y2="830">
              <stop offset="0%" stopColor="#fff4e2" />
              <stop offset="45%" stopColor="#fbe5c0" />
              <stop offset="100%" stopColor="#f5d29b" />
            </linearGradient>
            <linearGradient id="nacPaisMedio" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="248" y2="830">
              <stop offset="0%" stopColor="#d8cfc1" />
              <stop offset="45%" stopColor="#cdc3b3" />
              <stop offset="100%" stopColor="#c1b6a4" />
            </linearGradient>
            <linearGradient id="nacPaisOscuro" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="248" y2="830">
              <stop offset="0%" stopColor="#3f4450" />
              <stop offset="45%" stopColor="#383c47" />
              <stop offset="100%" stopColor="#2f333c" />
            </linearGradient>
            {[
              [1, '#f4a340'],
              [2, '#ec7f2c'],
              [3, '#e05a26'],
              [4, '#c93a1f'],
              [5, '#a8201a'],
            ].map(([n, color]) => (
              <radialGradient key={n} id={`nacCalor${n}`}>
                <stop offset="0%" stopColor={color as string} stopOpacity="0.85" />
                <stop offset="45%" stopColor={color as string} stopOpacity="0.4" />
                <stop offset="100%" stopColor={color as string} stopOpacity="0" />
              </radialGradient>
            ))}
            <filter id="nacHalo" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="9" />
            </filter>
            <filter id="nacRed" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g ref={mundoRef}>
            <g className="nac-halo" filter="url(#nacHalo)">
              <path d={PAIS} />
            </g>
            {/* Base del país: tapa cualquier rendija entre departamentos al acercar. */}
            <path d={PAIS} className="nac-base" />
            <Tierra depto={depto} />
            {geo && geo.codigo === depto && <Municipios geo={geo} />}
            <path d={PAIS} className="nac-pais" />
            <Calor />
            <Red activo={seleccionado} />

            <g className="nac-nodos">
              {NODOS.map((n) => {
                const [x, y] = PUNTOS.get(n.id)!
                const troncal = n.rango === 'troncal'
                const clases = `nac-nodo ${n.rango}${seleccionado === n.id ? ' sel' : ''}${depto && n.depto !== depto ? ' fuera' : ''}`
                return (
                  <g
                    key={n.id}
                    transform={`translate(${x} ${y})`}
                    className={clases}
                    data-nodo={n.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`${n.nombre}, ${DEPTO.get(n.depto)?.nombre ?? ''}. Ver el mapa del departamento`}
                    onKeyDown={(e) => alTeclaNodo(e, n.id)}
                    onFocus={() => tipNodo(n.id)}
                    onBlur={restaurarTip}
                  >
                    <g className="nac-escala">
                      <circle className="nac-aro" r={troncal ? 9 : 7} />
                      <circle className="nac-punto" r={troncal ? 4.2 : 3} />
                      <circle className="nac-toque" r="14" />
                    </g>
                  </g>
                )
              })}
            </g>

            <g className="nac-etiquetas" aria-hidden="true">
              {etiquetas.map(({ id, pos }) => {
                const n = NODO.get(id)!
                const [x, y] = PUNTOS.get(id)!
                const tx = TEXTO[pos]
                return (
                  <g key={id} transform={`translate(${x} ${y})`} className={id === seleccionado ? 'sel' : undefined}>
                    <g className="nac-escala">
                      {pos === 'der' && <line x1={6} y1={0} x2={13} y2={0} className="nac-guia" />}
                      {pos === 'izq' && <line x1={-6} y1={0} x2={-13} y2={0} className="nac-guia" />}
                      <text x={tx.x} y={tx.y} textAnchor={tx.anchor} className={`nac-label ${n.rango}`}>
                        {n.nombre}
                      </text>
                    </g>
                  </g>
                )
              })}
            </g>

            <g className="nac-paises" aria-hidden="true">
              {AMARRES.map((s) => (
                <g key={s.id} transform={`translate(${s.mar[0]} ${s.mar[1]})`}>
                  <g className="nac-escala">
                    <text x={s.lado === 'izq' ? -11 : 11} y={3.6} textAnchor={s.lado === 'izq' ? 'end' : 'start'} className="nac-pais-cable" style={{ fill: s.color }}>
                      {s.pais}
                    </text>
                  </g>
                </g>
              ))}
            </g>

            {pin && (
              <g transform={`translate(${pin.x} ${pin.y})`} className={`nac-pin ${pin.estado}`} aria-hidden="true">
                <g className="nac-escala">
                  <circle className="nac-pin-onda" r="13" />
                  <circle className="nac-pin-punto" r="7.5" />
                </g>
              </g>
            )}
          </g>

          <g className="nac-leyenda" transform={`translate(${COL_WIDTH - 96} 108)`} aria-hidden="true">
            <text x="0" y="0" className="nac-leyenda-texto">CABLES</text>
            <text x="0" y="15" className="nac-leyenda-texto">SUBMARINOS</text>
            {AMARRES.map((s, i) => (
              <g key={s.id} transform={`translate(0 ${32 + i * 17})`}>
                <line x1="0" y1="-3.5" x2="16" y2="-3.5" className="nac-leyenda-linea" style={{ stroke: s.color }} />
                <text x="22" y="0" className="nac-leyenda-texto nac-leyenda-pais">{s.pais}</text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div className="nac-info" ref={infoRef} aria-live="polite">
        {infoDepto ? (
          <>
            <div className="nac-info-texto">
              <strong>{infoDepto.nombre}</strong>
              <span>
                {RESUMEN_DEPTO(infoDepto.codigo)}
              </span>
            </div>
            <div className="nac-chips">
              {nodosDepto.map((n) => (
                <button key={n.id} type="button" className={n.id === seleccionado ? 'on' : undefined} onClick={() => elegirNodo(n.id)}>
                  {n.nombre}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="nac-info-texto">
            <strong>Toca un departamento o una ciudad</strong>
            <span>En La Guajira, las manchas de color son las zonas donde ya tenemos cobertura.</span>
          </div>
        )}
      </div>

      <div className="nac-tip" ref={tipRef} aria-hidden="true">
        <strong />
        <small />
      </div>
      <div className="nac-aviso" ref={avisoRef}>
        Mantén Ctrl (o ⌘) y usa la rueda para acercar
      </div>
    </div>
  )
}

export type { Nodo }
