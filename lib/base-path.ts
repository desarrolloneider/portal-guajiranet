// Prefijo cuando la app vive bajo una subcarpeta (ej. "/guajiranet" en vez de
// la raíz del dominio). Se configura con la variable de entorno BASE_PATH al
// compilar (ver next.config.mjs, que la expone al navegador como
// NEXT_PUBLIC_BASE_PATH). En local, sin esa variable, queda vacío y todo
// funciona igual que antes, en la raíz.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

// Antepone el BASE_PATH a una ruta absoluta propia del sitio (imágenes, PDFs,
// llamadas a /api/...). Úsalo en cualquier src/href/fetch escrito a mano que
// empiece con "/" — los componentes <Link> e <Image> de Next ya lo manejan
// solos, esto es solo para las etiquetas <img>/<a> y fetch() crudos.
export function url(ruta: string): string {
  if (!ruta.startsWith('/')) return ruta
  return BASE_PATH + ruta
}
