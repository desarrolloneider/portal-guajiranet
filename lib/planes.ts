export type Plan = {
  megas: number
  precio: string
  streaming: 'FLEX' | 'PLUS'
  canales: number
  lineas: number
  datos: string
  destacado?: boolean
}

export type ZonaPlanes = {
  /** Nombre que se muestra en el botón de la zona. */
  nombre: string
  /** Texto extra debajo del título (por ejemplo, qué sectores cubre). */
  cubre?: string
  planes: Plan[]
}

// Planes vigentes según el código de planes de la web de la empresa (octubre 2026).
const PLANES_GENERALES: Plan[] = [
  { megas: 150, precio: '58.000', streaming: 'FLEX', canales: 45, lineas: 1, datos: '3GB' },
  { megas: 300, precio: '68.000', streaming: 'FLEX', canales: 45, lineas: 1, datos: '3GB' },
  { megas: 400, precio: '80.000', streaming: 'FLEX', canales: 45, lineas: 1, datos: '3GB', destacado: true },
  { megas: 500, precio: '95.000', streaming: 'FLEX', canales: 45, lineas: 1, datos: '5GB' },
  { megas: 600, precio: '110.000', streaming: 'PLUS', canales: 80, lineas: 1, datos: '5GB' },
  { megas: 700, precio: '150.000', streaming: 'PLUS', canales: 80, lineas: 2, datos: '5GB C/U' },
]

const PLANES_MUSHAISA: Plan[] = [
  { megas: 600, precio: '110.000', streaming: 'FLEX', canales: 45, lineas: 1, datos: '5GB' },
  { megas: 700, precio: '150.000', streaming: 'PLUS', canales: 80, lineas: 1, datos: '5GB' },
  // En el código de la empresa este plan dice 1 línea pero "5GB C/U". Por confirmar si son 2 líneas.
  { megas: 900, precio: '220.000', streaming: 'PLUS', canales: 80, lineas: 1, datos: '5GB C/U' },
]

/** Zonas en el orden en que aparecen los botones. La primera es la que se ve al abrir la página. */
export const ZONAS_PLANES: ZonaPlanes[] = [
  { nombre: 'Albania', cubre: 'Cubre Cuestecitas, Villarreina, San Francisco y Ciudad Albania', planes: PLANES_GENERALES },
  { nombre: 'Hatonuevo', planes: PLANES_GENERALES },
  { nombre: 'Fonseca', planes: PLANES_GENERALES },
  { nombre: 'San Juan', planes: PLANES_GENERALES },
  { nombre: 'Mushaisa', planes: PLANES_MUSHAISA },
]

/** Notas que se muestran debajo de los planes. */
export const NOTAS_PLANES = [
  'El WhatsApp ilimitado aplica solo para mensajes de chat.',
  'La app de streaming depende del plan: Flex incluye +45 canales y Plus incluye +80 canales.',
  'Llamadas, videollamadas y el envío o descarga de imágenes, videos y archivos consumen datos del plan.',
  'Servicios de uso residencial, sujetos a condiciones técnicas, cobertura y disponibilidad.',
]

/** Todas las velocidades distintas que se ofrecen, de menor a mayor (sirve para el color de cada fibra). */
export const VELOCIDADES = [...new Set(ZONAS_PLANES.flatMap((z) => z.planes.map((p) => p.megas)))].sort((a, b) => a - b)

/** Velocidad máxima de los planes generales, la que se anuncia en la portada ("Hasta 700 Megas"). */
export const MAX_MEGAS_PORTADA = Math.max(...PLANES_GENERALES.map((p) => p.megas))

const valor = (p: Plan) => Number(p.precio.replace(/\D/g, ''))

/** Precio del plan más económico de todas las zonas, tal como se muestra ("58.000"). */
export const PRECIO_DESDE = ZONAS_PLANES.flatMap((z) => z.planes).reduce((min, p) => (valor(p) < valor(min) ? p : min)).precio

/** Máximo de canales en vivo de cualquier plan ("Hasta 80 canales" en la portada). */
export const MAX_CANALES = Math.max(...ZONAS_PLANES.flatMap((z) => z.planes.map((p) => p.canales)))
