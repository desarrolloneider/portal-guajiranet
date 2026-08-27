// Nodos y enlaces de la red troncal nacional.
//
// IMPORTANTE: las coordenadas son las de cada ciudad, no las del tendido real de fibra.
// El trazado entre nodos es una linea recta ilustrativa. Verifica y corrige este archivo
// con el mapa de planta externa antes de publicar.

export type Nodo = {
  id: string
  nombre: string
  lon: number
  lat: number
  /** 'troncal' se dibuja grande y con etiqueta; 'secundario' es solo un punto pequeno. */
  rango: 'troncal' | 'secundario'
  /** Lado hacia el que se escribe la etiqueta. */
  lado?: 'izq' | 'der'
}

export const NODOS: Nodo[] = [
  { id: 'riohacha', nombre: 'Riohacha', lon: -72.907, lat: 11.544, rango: 'troncal', lado: 'der' },
  { id: 'manaure', nombre: 'Manaure', lon: -72.5725, lat: 11.6067, rango: 'troncal', lado: 'izq' },
  { id: 'uribia', nombre: 'Uribia', lon: -71.7493, lat: 11.9949, rango: 'troncal', lado: 'der' },
  { id: 'maicao', nombre: 'Maicao', lon: -72.293, lat: 11.384, rango: 'troncal', lado: 'der' },
  { id: 'albania', nombre: 'Albania', lon: -72.5297, lat: 11.2291, rango: 'troncal', lado: 'izq' },
  { id: 'dibulla', nombre: 'Dibulla', lon: -73.4342, lat: 11.0911, rango: 'secundario' },
  { id: 'sanjuandelcesar', nombre: 'San Juan del Cesar', lon: -73.0891, lat: 10.8164, rango: 'secundario' },
  { id: 'barrancas', nombre: 'Barrancas', lon: -72.6909, lat: 10.9876, rango: 'secundario' },
  { id: 'fonseca', nombre: 'Fonseca', lon: -72.8018, lat: 10.8239, rango: 'secundario' },
  { id: 'villanueva', nombre: 'Villanueva', lon: -72.9775, lat: 10.5806, rango: 'secundario' },
  { id: 'urumita', nombre: 'Urumita', lon: -72.991, lat: 10.4951, rango: 'secundario' },
  { id: 'elmolino', nombre: 'El Molino', lon: -72.8882, lat: 10.6381, rango: 'secundario' },
  { id: 'distraccion', nombre: 'Distracción', lon: -72.9394, lat: 10.9213, rango: 'secundario' },
  { id: 'hatonuevo', nombre: 'Hatonuevo', lon: -72.7324, lat: 11.0989, rango: 'secundario' },
  { id: 'lajaguadelpilar', nombre: 'La Jagua del Pilar', lon: -73.0702, lat: 10.4535, rango: 'secundario' },
  { id: 'santamarta', nombre: 'Santa Marta', lon: -74.199, lat: 11.241, rango: 'troncal', lado: 'izq' },
  { id: 'barranquilla', nombre: 'Barranquilla', lon: -74.796, lat: 10.968, rango: 'troncal', lado: 'izq' },
  { id: 'cartagena', nombre: 'Cartagena', lon: -75.514, lat: 10.391, rango: 'troncal', lado: 'izq' },
  { id: 'valledupar', nombre: 'Valledupar', lon: -73.253, lat: 10.46, rango: 'troncal', lado: 'der' },
  { id: 'tolu', nombre: 'Tolú', lon: -75.583, lat: 9.523, rango: 'troncal', lado: 'izq' },
  { id: 'sincelejo', nombre: 'Sincelejo', lon: -75.395, lat: 9.304, rango: 'troncal', lado: 'der' },
  { id: 'monteria', nombre: 'Montería', lon: -75.881, lat: 8.748, rango: 'troncal', lado: 'izq' },
  { id: 'ocana', nombre: 'Ocaña', lon: -73.356, lat: 8.237, rango: 'troncal', lado: 'der' },
  { id: 'cucuta', nombre: 'Cúcuta', lon: -72.505, lat: 7.894, rango: 'troncal', lado: 'der' },
  { id: 'bucaramanga', nombre: 'Bucaramanga', lon: -73.12, lat: 7.119, rango: 'troncal', lado: 'der' },
  { id: 'arauca', nombre: 'Arauca', lon: -70.759, lat: 7.084, rango: 'troncal', lado: 'der' },
  { id: 'medellin', nombre: 'Medellín', lon: -75.563, lat: 6.251, rango: 'troncal', lado: 'izq' },
  { id: 'sancarlos', nombre: 'San Carlos', lon: -74.993, lat: 6.188, rango: 'troncal', lado: 'der' },
  { id: 'tunja', nombre: 'Tunja', lon: -73.362, lat: 5.535, rango: 'troncal', lado: 'der' },
  { id: 'manizales', nombre: 'Manizales', lon: -75.517, lat: 5.07, rango: 'secundario' },
  { id: 'pereira', nombre: 'Pereira', lon: -75.691, lat: 4.813, rango: 'secundario' },
  { id: 'bogota', nombre: 'Bogotá', lon: -74.072, lat: 4.711, rango: 'troncal', lado: 'der' },
  { id: 'armenia', nombre: 'Armenia', lon: -75.681, lat: 4.533, rango: 'secundario' },
  { id: 'ibague', nombre: 'Ibagué', lon: -75.232, lat: 4.439, rango: 'troncal', lado: 'izq' },
  { id: 'villavicencio', nombre: 'Villavicencio', lon: -73.633, lat: 4.142, rango: 'troncal', lado: 'der' },
  { id: 'buenaventura', nombre: 'Buenaventura', lon: -77.031, lat: 3.884, rango: 'troncal', lado: 'izq' },
  { id: 'esmeralda', nombre: 'Esmeralda', lon: -75.9, lat: 3.9, rango: 'troncal', lado: 'der' },
  { id: 'cali', nombre: 'Cali', lon: -76.522, lat: 3.42, rango: 'troncal', lado: 'izq' },
  { id: 'neiva', nombre: 'Neiva', lon: -75.281, lat: 2.927, rango: 'troncal', lado: 'der' },
  { id: 'popayan', nombre: 'Popayán', lon: -76.612, lat: 2.444, rango: 'troncal', lado: 'izq' },
  { id: 'pasto', nombre: 'Pasto', lon: -77.281, lat: 1.209, rango: 'troncal', lado: 'der' },
  { id: 'ipiales', nombre: 'Ipiales', lon: -77.644, lat: 0.826, rango: 'troncal', lado: 'izq' },
]

/** Pares de nodos unidos por fibra terrestre. */
export const ENLACES_NAC: [string, string][] = [
  ['riohacha', 'manaure'],
  ['manaure', 'uribia'],
  ['riohacha', 'maicao'],
  ['maicao', 'albania'],
  ['riohacha', 'dibulla'],
  ['riohacha', 'distraccion'],
  ['distraccion', 'barrancas'],
  ['barrancas', 'hatonuevo'],
  ['hatonuevo', 'albania'],
  ['distraccion', 'sanjuandelcesar'],
  ['sanjuandelcesar', 'fonseca'],
  ['sanjuandelcesar', 'villanueva'],
  ['villanueva', 'urumita'],
  ['villanueva', 'elmolino'],
  ['urumita', 'lajaguadelpilar'],
  ['riohacha', 'santamarta'],
  ['santamarta', 'barranquilla'],
  ['barranquilla', 'cartagena'],
  ['santamarta', 'valledupar'],
  ['valledupar', 'ocana'],
  ['ocana', 'cucuta'],
  ['cucuta', 'arauca'],
  ['cucuta', 'bucaramanga'],
  ['bucaramanga', 'sancarlos'],
  ['cartagena', 'sincelejo'],
  ['sincelejo', 'tolu'],
  ['sincelejo', 'monteria'],
  ['monteria', 'medellin'],
  ['medellin', 'sancarlos'],
  ['sancarlos', 'bogota'],
  ['bogota', 'tunja'],
  ['bogota', 'villavicencio'],
  ['bogota', 'ibague'],
  ['ibague', 'neiva'],
  ['ibague', 'esmeralda'],
  ['esmeralda', 'cali'],
  ['cali', 'buenaventura'],
  ['cali', 'popayan'],
  ['popayan', 'pasto'],
  ['pasto', 'ipiales'],
]

/** Amarres de cable submarino: punto en el mar -> ciudad de aterrizaje. */
export const SUBMARINOS: { id: string; mar: [number, number]; destino: string }[] = [
  { id: 's1', mar: [-77.9, 10.9], destino: 'cartagena' },
  { id: 's2', mar: [-75.6, 12.4], destino: 'barranquilla' },
  { id: 's3', mar: [-71.3, 12.5], destino: 'riohacha' },
]
