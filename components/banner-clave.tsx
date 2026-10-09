'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Check, IdCard, KeyRound, Mail, Sparkles, Wifi, type LucideIcon } from 'lucide-react'
import { EVENTO_AUTOGESTION } from '@/components/autogestion'
import { url } from '@/lib/base-path'

type Paso = { icono: LucideIcon; titulo: string; texto: string; muestra: string }

// Los mismos pasos del formulario de cambio de clave (components/autogestion.tsx).
const PASOS: Paso[] = [
  { icono: IdCard, titulo: 'Escribe tu cédula', texto: 'La del titular del servicio.', muestra: '1 234 567 890' },
  { icono: Mail, titulo: 'Revisa tu correo', texto: 'Te enviamos un código de 6 dígitos.', muestra: '4 8 2 9 1 7' },
  { icono: KeyRound, titulo: 'Crea tu nueva clave', texto: 'Mínimo 8 letras o números.', muestra: '••••••••' },
  { icono: Wifi, titulo: '¡Listo!', texto: 'Conecta tus equipos con la clave nueva.', muestra: 'Conectado' },
]

const CICLO_MS = 2600

/** Banner del inicio: anuncia el cambio de clave WiFi en línea y muestra los pasos en una animación. */
export function BannerClave() {
  const [activo, setActivo] = useState(0)
  const [pausa, setPausa] = useState(false)

  useEffect(() => {
    if (pausa || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => setActivo((i) => (i + 1) % PASOS.length), CICLO_MS)
    return () => window.clearInterval(t)
  }, [pausa])

  const abrirCambio = () => {
    window.dispatchEvent(new CustomEvent(EVENTO_AUTOGESTION, { detail: 'clave' }))
  }

  return (
    <section className="banner-clave" aria-labelledby="banner-clave-titulo">
      <div className="container banner-clave-caja">
        <div className="bc-texto">
          <div className="bc-marca">
            <img src={url('/logo-guajiranet.png')} alt="Guajiranet" width={1280} height={720} loading="lazy" />
            <span className="bc-nuevo">
              <Sparkles size={14} aria-hidden="true" /> Nuevo
            </span>
          </div>
          <h2 id="banner-clave-titulo">
            Cambia la clave de tu WiFi <em>tú mismo</em>, en minutos
          </h2>
          <p>Sin llamar, sin esperar un técnico. Hazlo desde aquí, a cualquier hora, en 4 pasos.</p>
          <button type="button" className="bc-cta" onClick={abrirCambio}>
            Cambiar mi clave ahora <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>

        <ol className="bc-pasos" onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)}>
          {PASOS.map(({ icono: Icono, titulo, texto, muestra }, i) => {
            const estado = i === activo ? 'activo' : i < activo ? 'hecho' : ''
            return (
              <li key={titulo} className={estado}>
                <button type="button" onClick={() => setActivo(i)} aria-current={i === activo ? 'step' : undefined}>
                  <span className="bc-num" aria-hidden="true">
                    {i < activo ? <Check size={14} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="bc-ico" aria-hidden="true">
                    <Icono size={22} />
                  </span>
                  <strong>{titulo}</strong>
                  <small>{texto}</small>
                  <span className={`bc-muestra ${i === 3 ? 'ok' : ''}`} aria-hidden="true">
                    {muestra}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
