'use client'

import { useEffect, useRef, useState } from 'react'

const SALIDA_MS = 420
const VIDEO_INTRO = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663332557638/TxUsIPUnceRrOFdt.mp4'

export function Intro() {
  const [montado, setMontado] = useState(true)
  const [saliendo, setSaliendo] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const cierreRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let visto = false
    try {
      visto = sessionStorage.getItem('gn-intro') === '1'
    } catch {
      visto = false
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (visto || reduce) {
      setMontado(false)
      return
    }

    const overflowAnterior = document.body.style.overflow
    setMontado(true)
    document.body.style.overflow = 'hidden'

    return () => {
      if (cierreRef.current) clearTimeout(cierreRef.current)
      document.body.style.overflow = overflowAnterior
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!montado) return
    videoRef.current?.play().catch(() => {
      // El navegador puede bloquear el autoplay; el botón de saltar sigue disponible.
    })
  }, [montado])

  const cerrar = () => {
    if (saliendo) return
    setSaliendo(true)
    cierreRef.current = setTimeout(() => {
      setMontado(false)
      document.body.style.overflow = ''
      try {
        sessionStorage.setItem('gn-intro', '1')
      } catch {
        /* En modo privado la introducción puede volver a aparecer. */
      }
    }, SALIDA_MS)
  }

  if (!montado) return null

  return (
    <div className={`intro intro-video-intro ${saliendo ? 'saliendo' : ''}`} role="dialog" aria-label="Introducción de GuajiraNet">
      <video
        ref={videoRef}
        className="intro-video"
        autoPlay
        muted
        playsInline
        preload="auto"
        onLoadedData={() => videoRef.current?.play().catch(() => undefined)}
        onEnded={cerrar}
        aria-label="Video de introducción de GuajiraNet"
      >
        <source src={VIDEO_INTRO} type="video/mp4" />
        Tu navegador no puede reproducir el video de introducción.
      </video>
      <div className="intro-video-vignette" aria-hidden="true" />
      <div className="intro-video-marca">
        <img src="/logo-guajiranet-claro.png" alt="GuajiraNet Telecomunicaciones" width={1280} height={720} />
        <span>Conectando sueños.</span>
      </div>
      <button type="button" className="intro-skip intro-video-skip" onClick={cerrar}>
        Saltar intro
      </button>
    </div>
  )
}

