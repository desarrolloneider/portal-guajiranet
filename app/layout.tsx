  import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Figtree } from 'next/font/google'
import './globals.css'

const titulos = Bricolage_Grotesque({ subsets: ['latin'], variable: '--fuente-titulos', display: 'swap' })
const texto = Figtree({ subsets: ['latin'], variable: '--fuente-texto', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.guajiranet.com'),
  title: {
    default: 'GuajiraNet ISP S.A.S | Internet que sí llega contigo',
    template: '%s | GuajiraNet ISP S.A.S',
  },
  description: 'Internet por fibra óptica rápido, estable y cercano para hogares, comercios y empresas en La Guajira.',
  applicationName: 'GuajiraNet',
  keywords: ['internet', 'fibra óptica', 'La Guajira', 'Albania', 'ISP', 'GuajiraNet', 'Riohacha', 'Maicao'],
  authors: [{ name: 'GuajiraNet ISP S.A.S' }],
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'GuajiraNet ISP S.A.S',
    title: 'GuajiraNet ISP S.A.S | Internet que sí llega contigo',
    description: 'Internet por fibra óptica rápido, estable y cercano para hogares, comercios y empresas en La Guajira.',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-light-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#052a57',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${titulos.variable} ${texto.variable} bg-background`}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
