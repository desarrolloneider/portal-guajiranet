import { MUNICIPIOS } from '@/lib/guajira-map'
import { DEPARTAMENTOS } from '@/lib/colombia-map'
import { NODOS } from '@/lib/red-nacional'
import { ZONAS_COBERTURA } from '@/lib/cobertura-zonas'

/** Evento con el que la consulta rápida del inicio le pide a la sección de cobertura mostrar una búsqueda. */
export const EVENTO_COBERTURA = 'guajiranet:cobertura'

export const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

const MUNICIPIOS_EN_ZONAS = new Set(ZONAS_COBERTURA.map((z) => normalizar(z.municipio)))

/** Municipios de La Guajira con al menos una zona de cobertura (sale del archivo de zonas del ERP). */
export const MUNICIPIOS_CON_COBERTURA = MUNICIPIOS.filter((m) => MUNICIPIOS_EN_ZONAS.has(normalizar(m.name)))

/** Códigos DANE de esos municipios. */
export const CODIGOS_CON_COBERTURA = new Set(MUNICIPIOS_CON_COBERTURA.map((m) => m.code))

export const zonasDelMunicipio = (nombre: string) => ZONAS_COBERTURA.filter((z) => normalizar(z.municipio) === normalizar(nombre))

/** Texto con la lista de municipios: "A, B y C". */
export const LISTA_MUNICIPIOS_CON_COBERTURA = (() => {
  const nombres = [...MUNICIPIOS_CON_COBERTURA].map((m) => m.name).sort((a, b) => a.localeCompare(b, 'es'))
  return nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}` : (nombres[0] ?? '')
})()

const escaparRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const nombreDepto = (codigo: string) => DEPARTAMENTOS.find((d) => d.codigo === codigo)?.nombre ?? ''

export type Hallazgo =
  /** Un corregimiento o sector que es una zona de cobertura. */
  | { tipo: 'zona'; nombre: string; municipio: string; zonaId: number }
  /** Un municipio que tiene una o más zonas de cobertura. */
  | { tipo: 'municipio'; nombre: string; codigo: string; zonas: string[] }
  /** Un municipio o ciudad conocida donde todavía no hay zonas de cobertura. */
  | { tipo: 'sin-cobertura'; nombre: string; depto: string }

/**
 * Busca por nombre lo que escribió la persona: municipios con cobertura, zonas (corregimientos),
 * municipios de La Guajira sin cobertura y ciudades de la red nacional.
 * Devuelve undefined si la consulta está vacía y null si el nombre no se reconoce
 * (en ese caso la sección de cobertura la busca como dirección o barrio).
 */
export function buscarCobertura(consulta: string): Hallazgo | null | undefined {
  const texto = normalizar(consulta)
  if (!texto) return undefined

  const zonas = ZONAS_COBERTURA.filter((z) => normalizar(z.nombre) !== normalizar(z.municipio))
  const aHallazgo = {
    zona: (z: (typeof zonas)[number]): Hallazgo => ({ tipo: 'zona', nombre: z.nombre, municipio: z.municipio, zonaId: z.id }),
    municipio: (m: (typeof MUNICIPIOS)[number]): Hallazgo => ({
      tipo: 'municipio',
      nombre: m.name,
      codigo: m.code,
      zonas: zonasDelMunicipio(m.name).map((z) => z.nombre),
    }),
    guajira: (m: (typeof MUNICIPIOS)[number]): Hallazgo => ({ tipo: 'sin-cobertura', nombre: m.name, depto: 'La Guajira' }),
    ciudad: (n: (typeof NODOS)[number]): Hallazgo => ({ tipo: 'sin-cobertura', nombre: n.nombre, depto: nombreDepto(n.depto) }),
  }

  // Se prueba de lo más preciso a lo menos preciso: nombre exacto, luego el nombre dentro de un texto
  // más largo («barrio El Centro, Fonseca») y por último el comienzo de un nombre («San Ju»).
  const reglas: ((nombre: string) => boolean)[] = [
    (n) => texto === n,
    (n) => new RegExp(`(^|[^a-z0-9])${escaparRegex(n)}($|[^a-z0-9])`).test(texto),
    (n) => texto.length >= 3 && n.startsWith(texto),
  ]
  for (const regla of reglas) {
    const zona = zonas.find((z) => regla(normalizar(z.nombre)))
    if (zona) return aHallazgo.zona(zona)
    const municipio = MUNICIPIOS_CON_COBERTURA.find((m) => regla(normalizar(m.name)))
    if (municipio) return aHallazgo.municipio(municipio)
    const guajira = MUNICIPIOS.find((m) => regla(normalizar(m.name)))
    if (guajira) return aHallazgo.guajira(guajira)
    const ciudad = NODOS.find((n) => regla(normalizar(n.nombre)))
    if (ciudad) return aHallazgo.ciudad(ciudad)
  }

  return null
}

/** Municipios y zonas que se sugieren al escribir. */
export const SUGERENCIAS_COBERTURA = Array.from(
  new Set([...MUNICIPIOS_CON_COBERTURA.map((m) => m.name), ...ZONAS_COBERTURA.map((z) => z.nombre)]),
).sort((a, b) => a.localeCompare(b, 'es'))

export const whatsappCobertura = (lugar: string) =>
  `https://wa.me/573009139909?text=${encodeURIComponent(`Hola, quiero información sobre la cobertura de GuajiraNet en ${lugar}.`)}`
