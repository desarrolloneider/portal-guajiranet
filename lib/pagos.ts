// Portales de pago de la factura. Los usan las tarjetas del inicio y el selector del botón flotante.
// Los logos traen su propio fondo; el CSS los recorta (ver .pago-logo en escena.css).

export type PortalPago = {
  clave: 'wompi' | 'pay' | 'breb'
  href: string
  logo: string
  marca: string
  titulo: string
  texto: string
  detalle: string
}

export const PORTALES_PAGO: PortalPago[] = [
  {
    clave: 'pay',
    href: 'https://pagos.onepay.la/guajiranet',
    logo: '/pagos/onepay.png',
    marca: 'OnePay',
    titulo: 'GuajiraNet Pay',
    texto: 'Portal de pago',
    detalle: 'PSE, tarjeta y más',
  },
  {
    clave: 'breb',
    href: 'https://pagos.onepay.la/guajiranet?pos=true',
    logo: '/pagos/bre-b.png',
    marca: 'Bre-B',
    // Guion que no se parte (U+2011), para que «Bre-B» nunca quede en dos líneas.
    titulo: 'Paga con Bre‑B',
    texto: 'Portal modo POS',
    detalle: 'Pago inmediato',
  },
  {
    clave: 'wompi',
    href: 'https://ds.dsnube.co/documento/?empresa=UqBGh1ev+4w5YMySqWUUuWnbyM4NML2QEEUqsYUO93o=',
    logo: '/pagos/wompi.png',
    marca: 'Wompi',
    titulo: 'Paga con Wompi',
    texto: 'Portal de facturas',
    detalle: 'Consulta y paga con tu cédula',
  },
]
