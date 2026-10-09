import type { MetadataRoute } from 'next'
import { BASE_PATH } from '@/lib/base-path'

// La web es de una sola página; los PDF legales también se publican para que Google los encuentre.
const SITIO = `https://www.guajiranet.com${BASE_PATH}`
const PDF_LEGALES = [
  'LEY-1978-DEL-25-DE-JULIO-DE-2019.pdf',
  'LEY_679_DE_2001_Colombia.pdf',
  'Resolucion-5111-2017.pdf',
  'ley_1341_de_2009.pdf',
  'resolucion-5050-2016.pdf',
]

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITIO, changeFrequency: 'weekly', priority: 1 },
    ...PDF_LEGALES.map((archivo) => ({ url: `${SITIO}/legal/${archivo}`, changeFrequency: 'yearly' as const, priority: 0.3 })),
  ]
}
