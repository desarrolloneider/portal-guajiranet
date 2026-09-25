export type Plan = {
  megas: number
  precio: string
  streaming: 'FLEX' | 'PLUS'
  canales: number
  lineas: number
  datos: string
  destacado?: boolean
}

// Planes vigentes según el material comercial de la empresa.
export const PLANES: Plan[] = [
  { megas: 150, precio: '58.000', streaming: 'FLEX', canales: 45, lineas: 1, datos: '3GB' },
  { megas: 300, precio: '68.000', streaming: 'FLEX', canales: 45, lineas: 1, datos: '3GB' },
  { megas: 400, precio: '80.000', streaming: 'FLEX', canales: 45, lineas: 1, datos: '3GB', destacado: true },
  { megas: 500, precio: '95.000', streaming: 'FLEX', canales: 45, lineas: 1, datos: '5GB' },
  { megas: 600, precio: '110.000', streaming: 'PLUS', canales: 80, lineas: 1, datos: '5GB' },
  { megas: 700, precio: '150.000', streaming: 'PLUS', canales: 80, lineas: 2, datos: '5GB C/U' },
]

const valor = (p: Plan) => Number(p.precio.replace(/\D/g, ''))

/** Precio del plan más económico, tal como se muestra ("58.000"). */
export const PRECIO_DESDE = PLANES.reduce((min, p) => (valor(p) < valor(min) ? p : min)).precio
