// Nodos y enlaces de la red troncal nacional.
//
// IMPORTANTE: las coordenadas son las de cada ciudad, no las del tendido real de fibra.
// El trazado entre nodos es una linea recta ilustrativa. Verifica y corrige este archivo
// con el mapa de planta externa antes de publicar.

export type Nodo = {
  id: string
  nombre: string
  /** Código DANE del departamento (dos dígitos). */
  depto: string
  /** Código DANE del municipio donde está el nodo. */
  municipio: string
  lon: number
  lat: number
  /** 'troncal' se dibuja grande y con etiqueta; 'secundario' es solo un punto pequeno. */
  rango: 'troncal' | 'secundario'
  /** Lado hacia el que se escribe la etiqueta. */
  lado?: 'izq' | 'der'
}

export const NODOS: Nodo[] = [
  { id: 'riohacha', nombre: 'Riohacha', depto: '44', municipio: '44001', lon: -72.907, lat: 11.544, rango: 'troncal', lado: 'der' },
  { id: 'manaure', nombre: 'Manaure', depto: '44', municipio: '44560', lon: -72.5725, lat: 11.6067, rango: 'troncal', lado: 'izq' },
  { id: 'uribia', nombre: 'Uribia', depto: '44', municipio: '44847', lon: -71.7493, lat: 11.9949, rango: 'troncal', lado: 'der' },
  { id: 'maicao', nombre: 'Maicao', depto: '44', municipio: '44430', lon: -72.293, lat: 11.384, rango: 'troncal', lado: 'der' },
  { id: 'albania', nombre: 'Albania', depto: '44', municipio: '44035', lon: -72.5297, lat: 11.2291, rango: 'troncal', lado: 'izq' },
  { id: 'dibulla', nombre: 'Dibulla', depto: '44', municipio: '44090', lon: -73.4342, lat: 11.0911, rango: 'secundario' },
  { id: 'sanjuandelcesar', nombre: 'San Juan del Cesar', depto: '44', municipio: '44650', lon: -73.0891, lat: 10.8164, rango: 'secundario' },
  { id: 'barrancas', nombre: 'Barrancas', depto: '44', municipio: '44078', lon: -72.6909, lat: 10.9876, rango: 'secundario' },
  { id: 'fonseca', nombre: 'Fonseca', depto: '44', municipio: '44279', lon: -72.8018, lat: 10.8239, rango: 'secundario' },
  { id: 'villanueva', nombre: 'Villanueva', depto: '44', municipio: '44874', lon: -72.9775, lat: 10.5806, rango: 'secundario' },
  { id: 'urumita', nombre: 'Urumita', depto: '44', municipio: '44855', lon: -72.991, lat: 10.4951, rango: 'secundario' },
  { id: 'elmolino', nombre: 'El Molino', depto: '44', municipio: '44110', lon: -72.8882, lat: 10.6381, rango: 'secundario' },
  { id: 'distraccion', nombre: 'Distracción', depto: '44', municipio: '44098', lon: -72.9394, lat: 10.9213, rango: 'secundario' },
  { id: 'hatonuevo', nombre: 'Hatonuevo', depto: '44', municipio: '44378', lon: -72.7324, lat: 11.0989, rango: 'secundario' },
  { id: 'lajaguadelpilar', nombre: 'La Jagua del Pilar', depto: '44', municipio: '44420', lon: -73.0702, lat: 10.4535, rango: 'secundario' },
  { id: 'santamarta', nombre: 'Santa Marta', depto: '47', municipio: '47001', lon: -74.199, lat: 11.241, rango: 'troncal', lado: 'izq' },
  { id: 'barranquilla', nombre: 'Barranquilla', depto: '08', municipio: '08001', lon: -74.796, lat: 10.968, rango: 'troncal', lado: 'izq' },
  { id: 'cartagena', nombre: 'Cartagena', depto: '13', municipio: '13001', lon: -75.514, lat: 10.391, rango: 'troncal', lado: 'izq' },
  { id: 'valledupar', nombre: 'Valledupar', depto: '20', municipio: '20001', lon: -73.253, lat: 10.46, rango: 'troncal', lado: 'der' },
  { id: 'tolu', nombre: 'Tolú', depto: '70', municipio: '70820', lon: -75.583, lat: 9.523, rango: 'troncal', lado: 'izq' },
  { id: 'sincelejo', nombre: 'Sincelejo', depto: '70', municipio: '70001', lon: -75.395, lat: 9.304, rango: 'troncal', lado: 'der' },
  { id: 'monteria', nombre: 'Montería', depto: '23', municipio: '23001', lon: -75.881, lat: 8.748, rango: 'troncal', lado: 'izq' },
  { id: 'ocana', nombre: 'Ocaña', depto: '54', municipio: '54498', lon: -73.356, lat: 8.237, rango: 'troncal', lado: 'der' },
  { id: 'cucuta', nombre: 'Cúcuta', depto: '54', municipio: '54001', lon: -72.505, lat: 7.894, rango: 'troncal', lado: 'der' },
  { id: 'bucaramanga', nombre: 'Bucaramanga', depto: '68', municipio: '68001', lon: -73.12, lat: 7.119, rango: 'troncal', lado: 'der' },
  { id: 'arauca', nombre: 'Arauca', depto: '81', municipio: '81001', lon: -70.759, lat: 7.084, rango: 'troncal', lado: 'der' },
  { id: 'medellin', nombre: 'Medellín', depto: '05', municipio: '05001', lon: -75.563, lat: 6.251, rango: 'troncal', lado: 'izq' },
  { id: 'sancarlos', nombre: 'San Carlos', depto: '05', municipio: '05649', lon: -74.993, lat: 6.188, rango: 'troncal', lado: 'der' },
  { id: 'tunja', nombre: 'Tunja', depto: '15', municipio: '15001', lon: -73.362, lat: 5.535, rango: 'troncal', lado: 'der' },
  { id: 'manizales', nombre: 'Manizales', depto: '17', municipio: '17001', lon: -75.517, lat: 5.07, rango: 'secundario' },
  { id: 'pereira', nombre: 'Pereira', depto: '66', municipio: '66001', lon: -75.691, lat: 4.813, rango: 'secundario' },
  { id: 'bogota', nombre: 'Bogotá', depto: '11', municipio: '11001', lon: -74.072, lat: 4.711, rango: 'troncal', lado: 'der' },
  { id: 'armenia', nombre: 'Armenia', depto: '63', municipio: '63001', lon: -75.681, lat: 4.533, rango: 'secundario' },
  { id: 'ibague', nombre: 'Ibagué', depto: '73', municipio: '73001', lon: -75.232, lat: 4.439, rango: 'troncal', lado: 'izq' },
  { id: 'villavicencio', nombre: 'Villavicencio', depto: '50', municipio: '50001', lon: -73.633, lat: 4.142, rango: 'troncal', lado: 'der' },
  { id: 'buenaventura', nombre: 'Buenaventura', depto: '76', municipio: '76109', lon: -77.031, lat: 3.884, rango: 'troncal', lado: 'izq' },
  { id: 'esmeralda', nombre: 'Esmeralda', depto: '76', municipio: '76111', lon: -75.9, lat: 3.9, rango: 'troncal', lado: 'der' },
  { id: 'cali', nombre: 'Cali', depto: '76', municipio: '76001', lon: -76.522, lat: 3.42, rango: 'troncal', lado: 'izq' },
  { id: 'neiva', nombre: 'Neiva', depto: '41', municipio: '41001', lon: -75.281, lat: 2.927, rango: 'troncal', lado: 'der' },
  { id: 'popayan', nombre: 'Popayán', depto: '19', municipio: '19001', lon: -76.612, lat: 2.444, rango: 'troncal', lado: 'izq' },
  { id: 'pasto', nombre: 'Pasto', depto: '52', municipio: '52001', lon: -77.281, lat: 1.209, rango: 'troncal', lado: 'der' },
  { id: 'ipiales', nombre: 'Ipiales', depto: '52', municipio: '52356', lon: -77.644, lat: 0.826, rango: 'troncal', lado: 'izq' },
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
