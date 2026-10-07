import { ZONAS_COBERTURA, type ZonaPublica } from '@/lib/cobertura-zonas'

// Misma regla que el mapa de cobertura del ERP (coberturaGeo.ts): dentro de una zona hay cobertura;
// a menos de esta distancia por fuera, es probable y lo confirma un técnico.
export const DISTANCIA_PROBABLE_M = 100

export type EstadoCobertura = 'con' | 'probable' | 'sin'

export type ResultadoPunto = {
  estado: EstadoCobertura
  /** Zona donde cae el punto o la más cercana. */
  zona: ZonaPublica | null
  /** 0 si está dentro. */
  distanciaM: number
}

type Anillo = [number, number][]

function puntoEnAnillo(x: number, y: number, anillo: Anillo) {
  let dentro = false
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const [xi, yi] = anillo[i]
    const [xj, yj] = anillo[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro
  }
  return dentro
}

function puntoEnPoligono(x: number, y: number, pol: Anillo[]) {
  if (!pol.length || !puntoEnAnillo(x, y, pol[0])) return false
  for (let k = 1; k < pol.length; k++) if (puntoEnAnillo(x, y, pol[k])) return false
  return true
}

function distanciaAlBordeM(lat: number, lng: number, zona: ZonaPublica) {
  const kx = 111320 * Math.cos((lat * Math.PI) / 180)
  const ky = 110574
  let min = Infinity
  for (const pol of zona.poligonos) {
    for (const anillo of pol) {
      for (let i = 0; i < anillo.length - 1; i++) {
        const ax = (anillo[i][0] - lng) * kx
        const ay = (anillo[i][1] - lat) * ky
        const bx = (anillo[i + 1][0] - lng) * kx
        const by = (anillo[i + 1][1] - lat) * ky
        const dx = bx - ax
        const dy = by - ay
        const l2 = dx * dx + dy * dy
        const t = l2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / l2)) : 0
        const d = Math.hypot(ax + t * dx, ay + t * dy)
        if (d < min) min = d
      }
    }
  }
  return min
}

export function verificarPunto(lat: number, lng: number, zonas: ZonaPublica[] = ZONAS_COBERTURA): ResultadoPunto {
  for (const z of zonas) {
    if (z.poligonos.some((pol) => puntoEnPoligono(lng, lat, pol))) return { estado: 'con', zona: z, distanciaM: 0 }
  }
  let cercana: { zona: ZonaPublica; d: number } | null = null
  for (const z of zonas) {
    const d = distanciaAlBordeM(lat, lng, z)
    if (!cercana || d < cercana.d) cercana = { zona: z, d }
  }
  if (!cercana) return { estado: 'sin', zona: null, distanciaM: Infinity }
  return { estado: cercana.d <= DISTANCIA_PROBABLE_M ? 'probable' : 'sin', zona: cercana.zona, distanciaM: cercana.d }
}

export function formatearDistancia(m: number) {
  if (!Number.isFinite(m)) return '—'
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} km`
}

/** Caja que encierra todas las zonas, con un margen, en [lngMin, latMin, lngMax, latMax]. */
export const CAJA_ZONAS = (() => {
  let minLat = Infinity
  let minLng = Infinity
  let maxLat = -Infinity
  let maxLng = -Infinity
  for (const z of ZONAS_COBERTURA) {
    minLat = Math.min(minLat, z.bbox[0][0])
    minLng = Math.min(minLng, z.bbox[0][1])
    maxLat = Math.max(maxLat, z.bbox[1][0])
    maxLng = Math.max(maxLng, z.bbox[1][1])
  }
  const m = 0.25
  return [minLng - m, minLat - m, maxLng + m, maxLat + m] as const
})()

export type Ubicacion = { lat: number; lng: number; etiqueta: string; aproximada: boolean }

/**
 * Busca una dirección o un barrio con Photon (OpenStreetMap), acotado a la zona donde tenemos red.
 * Devuelve null si no encuentra nada. Lanza un error si el servicio no responde.
 */
export async function buscarDireccion(texto: string, senal?: AbortSignal): Promise<Ubicacion | null> {
  const consulta = texto.replace(/[#"]/g, ' ').replace(/\s+/g, ' ').trim()
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(consulta)}&limit=5&bbox=${CAJA_ZONAS.join(',')}`
  const r = await fetch(url, { signal: senal })
  if (!r.ok) throw new Error('El buscador de direcciones no respondió')
  const datos = (await r.json()) as {
    features?: { geometry: { coordinates: [number, number] }; properties: Record<string, string | undefined> }[]
  }
  const f = datos.features?.find((x) => x.properties.country === 'Colombia' || x.properties.countrycode === 'CO') ?? datos.features?.[0]
  if (!f) return null
  const p = f.properties
  const partes = [p.name, p.street && p.housenumber ? `${p.street} ${p.housenumber}` : p.street, p.district, p.city ?? p.county]
  const etiqueta = Array.from(new Set(partes.filter(Boolean))).join(', ')
  return {
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    etiqueta: etiqueta || consulta,
    aproximada: p.type !== 'house',
  }
}
