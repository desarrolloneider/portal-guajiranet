/** @type {import('next').NextConfig} */

// Direcciones de la web vieja (WordPress) que la gente tiene guardadas, en Google o en facturas.
// Cada una manda a su equivalente en la web nueva. "?abrir=" abre directo la ventana correspondiente.
const REDIRECCIONES_WEB_VIEJA = [
  ['/presentar-un-pqrs', '/?abrir=pqrs#autogestion'],
  ['/cambio-de-clave', '/?abrir=clave#autogestion'],
  ['/test-de-velocidad-de-internet', '/?abrir=velocidad#autogestion'],
  // PDF de leyes y resoluciones: en la web nueva viven en /legal con el mismo nombre.
  ['/wp-content/uploads/:anio/:mes/:archivo(LEY-1978-DEL-25-DE-JULIO-DE-2019\\.pdf|LEY_679_DE_2001_Colombia\\.pdf|Resolucion-5111-2017\\.pdf|ley_1341_de_2009\\.pdf|resolucion-5050-2016\\.pdf)', '/legal/:archivo'],
]

// Orígenes externos que la página realmente usa. Si se agrega uno nuevo (video, iframe, API), va aquí.
const desarrollo = process.env.NODE_ENV !== 'production'
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${desarrollo ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' https://photon.komoot.io${desarrollo ? ' ws:' : ''}`,
  "media-src 'self' https://files.manuscdn.com",
  "frame-src https://fast.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(desarrollo ? [] : ['upgrade-insecure-requests']),
].join('; ')

const CABECERAS_SEGURIDAD = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  // Las direcciones de la web nunca se mandan completas a otros sitios (solo el dominio).
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=()' },
]

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:ruta*', headers: CABECERAS_SEGURIDAD },
      // Las respuestas de la API llevan datos personales: nunca se guardan en caché.
      { source: '/api/:ruta*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return REDIRECCIONES_WEB_VIEJA.map(([source, destination]) => ({ source, destination, permanent: true }))
  },
}

export default nextConfig
