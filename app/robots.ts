import type { MetadataRoute } from 'next'
import { BASE_PATH, url } from '@/lib/base-path'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: url('/'), disallow: url('/api/') },
    sitemap: `https://www.guajiranet.com${BASE_PATH}/sitemap.xml`,
  }
}
