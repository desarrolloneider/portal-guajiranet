// Trazado ILUSTRATIVO de la red troncal entre los municipios con cobertura.
// Los puntos coinciden con las coordenadas de cada municipio en lib/guajira-map.ts.
// No representa el tendido físico real: ajústalo cuando tengas el trazado de planta externa.

export type Enlace = {
  id: string
  d: string
  /** Segundos que tarda un pulso en recorrer el enlace. */
  dur: number
  /** Retardo inicial del pulso, para que no salgan todos a la vez. */
  delay: number
  tipo: 'troncal' | 'ramal' | 'externo'
}

export const ENLACES: Enlace[] = [
  // Troncal principal: Riohacha -> Albania -> Maicao -> Uribia
  { id: 'e1', d: 'M188,296 Q236,308 289,304', dur: 3.2, delay: 0, tipo: 'troncal' },
  { id: 'e2', d: 'M289,304 Q318,292 342,269', dur: 2.6, delay: 0.5, tipo: 'troncal' },
  { id: 'e3', d: 'M342,269 Q408,222 468,151', dur: 4.4, delay: 1.1, tipo: 'troncal' },
  // Ramal costero: Riohacha -> Manaure -> Uribia
  { id: 'e4', d: 'M188,296 Q222,248 279,224', dur: 3.4, delay: 0.8, tipo: 'ramal' },
  { id: 'e5', d: 'M279,224 Q378,196 468,151', dur: 4.2, delay: 1.9, tipo: 'ramal' },
  // Enlace de salida hacia el interior del país
  { id: 'e6', d: 'M188,296 Q120,330 40,392', dur: 3.8, delay: 0.3, tipo: 'externo' },
]