'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

type Props = {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  subtitulo?: string
  ancho?: number
  children: React.ReactNode
}

export function Modal({ abierto, onCerrar, titulo, subtitulo, ancho = 620, children }: Props) {
  const caja = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
      if (e.key !== 'Tab' || !caja.current) return
      const focos = caja.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focos.length) return
      const primero = focos[0]
      const ultimo = focos[focos.length - 1]
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primero.focus()
      }
    }
    document.addEventListener('keydown', onTecla)
    caja.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus()
    return () => {
      document.body.style.overflow = previo
      document.removeEventListener('keydown', onTecla)
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div className="modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" style={{ maxWidth: ancho }} role="dialog" aria-modal="true" aria-label={titulo} ref={caja}>
        <header className="modal-cabecera">
          <div>
            <h3>{titulo}</h3>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>
        <div className="modal-cuerpo">{children}</div>
      </div>
    </div>
  )
}
