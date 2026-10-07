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

const nextConfig = {
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
