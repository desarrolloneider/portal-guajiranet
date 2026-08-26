'use client'

import { ExternalLink } from 'lucide-react'

const FAST_URL = 'https://fast.com/'

export function TestVelocidad() {
  return (
    <div className="tv">
      <div className="tv-oficial tv-oficial-unico">
        <div className="tv-oficial-cabecera">
          <strong>Test oficial de velocidad</strong>
          <a href={FAST_URL} target="_blank" rel="noreferrer">
            Abrir Fast.com <ExternalLink size={14} />
          </a>
        </div>
        <iframe src={FAST_URL} title="Test oficial de velocidad Fast.com" loading="lazy" />
        <small>Este es el mismo servicio de medición utilizado por la página de referencia.</small>
      </div>
    </div>
  )
}
