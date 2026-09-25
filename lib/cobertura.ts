import { MUNICIPIOS } from '@/lib/guajira-map'
import { DEPARTAMENTOS } from '@/lib/colombia-map'
import { NODOS } from '@/lib/red-nacional'

/** Evento con el que la consulta rápida del inicio le pide a la sección de cobertura mostrar un municipio. */
export const EVENTO_COBERTURA = 'guajiranet:cobertura'

export const MUNICIPIOS_ACTIVOS = MUNICIPIOS.filter((m) => m.active)

export const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const nombreDepto = (codigo: string) => DEPARTAMENTOS.find((d) => d.codigo === codigo)?.nombre ?? ''

export type Hallazgo =
  | { tipo: 'local'; nombre: string; codigo: string; nodo?: string }
  | { tipo: 'nacional'; nombre: string; depto: string; nodo: string }

/**
 * Busca cobertura para lo que escribió la persona: primero los municipios activos de La Guajira,
 * luego las ciudades de la red nacional. Devuelve undefined si la consulta está vacía y null si no hay datos.
 */
export function buscarCobertura(consulta: string): Hallazgo | null | undefined {
  const texto = normalizar(consulta)
  if (!texto) return undefined
  const coincide = (nombre: string) => {
    const n = normalizar(nombre)
    return texto.includes(n) || n.includes(texto)
  }
  const local = MUNICIPIOS_ACTIVOS.find((m) => coincide(m.name))
  if (local) {
    return { tipo: 'local', nombre: local.name, codigo: local.code, nodo: NODOS.find((n) => n.municipio === local.code)?.id }
  }
  const ciudad = NODOS.find((n) => coincide(n.nombre))
  if (ciudad) return { tipo: 'nacional', nombre: ciudad.nombre, depto: nombreDepto(ciudad.depto), nodo: ciudad.id }
  return null
}

/** Municipios y ciudades que se sugieren al escribir. */
export const SUGERENCIAS_COBERTURA = Array.from(
  new Set([...MUNICIPIOS_ACTIVOS.map((m) => m.name), ...NODOS.map((n) => n.nombre)]),
).sort((a, b) => a.localeCompare(b, 'es'))

export const whatsappCobertura = (municipio: string) =>
  `https://wa.me/573009139909?text=${encodeURIComponent(`Hola, quiero información sobre la cobertura de GuajiraNet en ${municipio}.`)}`
