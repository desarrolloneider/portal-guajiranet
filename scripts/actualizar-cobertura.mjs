// Genera lib/cobertura-zonas.ts (lo que usa la web pública) a partir del archivo de zonas del ERP.
//
// Uso, desde la carpeta del proyecto:
//   node scripts/actualizar-cobertura.mjs ruta/al/coberturaZonas.ts
//
// La web no publica cuántos clientes hay en cada zona: ese número se convierte en un nivel
// del 1 al 5 que solo se usa para la intensidad del color en el mapa de calor.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const origen = process.argv[2]
if (!origen) {
  console.error('Falta la ruta del archivo de zonas del ERP.\nEjemplo: node scripts/actualizar-cobertura.mjs ../erp/frontend/components/coberturaZonas.ts')
  process.exit(1)
}

const texto = readFileSync(origen, 'utf8')
const inicio = texto.indexOf('{"type":"FeatureCollection"')
if (inicio < 0) {
  console.error('No se encontró el FeatureCollection dentro del archivo.')
  process.exit(1)
}
let profundidad = 0
let fin = -1
let enCadena = false
for (let i = inicio; i < texto.length; i++) {
  const c = texto[i]
  if (enCadena) {
    if (c === '\\') i++
    else if (c === '"') enCadena = false
    continue
  }
  if (c === '"') enCadena = true
  else if (c === '{') profundidad++
  else if (c === '}' && --profundidad === 0) {
    fin = i + 1
    break
  }
}
const datos = JSON.parse(texto.slice(inicio, fin))

const nivel = (clientes) => (clientes >= 1000 ? 5 : clientes >= 300 ? 4 : clientes >= 100 ? 3 : clientes >= 20 ? 2 : 1)
const redondear = (v) => (Array.isArray(v) ? v.map(redondear) : typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v)

const zonas = datos.features
  .filter((f) => f?.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'))
  .map((f, i) => {
    const p = f.properties ?? {}
    const poligonos = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates]
    return {
      id: typeof p.id === 'number' ? p.id : i + 1,
      nombre: String(p.nombre ?? `Zona ${i + 1}`),
      municipio: String(p.municipio ?? ''),
      nivel: nivel(Number(p.clientes ?? 0)),
      centro: redondear(p.centro),
      bbox: redondear(p.bbox),
      poligonos: redondear(poligonos),
    }
  })

const fecha = new Date().toISOString().slice(0, 10)
const salida = `/* eslint-disable */
// ARCHIVO GENERADO: no editar a mano.
// Se genera con: node scripts/actualizar-cobertura.mjs <coberturaZonas.ts del ERP>
// Fecha: ${fecha} · ${zonas.length} zonas

export type ZonaPublica = {
  id: number
  nombre: string
  municipio: string
  /** 1 a 5: intensidad del color en el mapa de calor. */
  nivel: number
  /** [lat, lng] */
  centro: [number, number]
  /** [[latMin, lngMin], [latMax, lngMax]] */
  bbox: [[number, number], [number, number]]
  /** Polígonos en [lng, lat]: [exterior, ...huecos] */
  poligonos: [number, number][][][]
}

export const ZONAS_COBERTURA: ZonaPublica[] = ${JSON.stringify(zonas)}
`

const destino = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'cobertura-zonas.ts')
writeFileSync(destino, salida)
console.log(`Listo: ${zonas.length} zonas escritas en lib/cobertura-zonas.ts`)
for (const z of zonas) console.log(`  - ${z.nombre} (${z.municipio})`)
