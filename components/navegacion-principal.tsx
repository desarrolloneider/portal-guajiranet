'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, ChevronDown, CreditCard, Mail, MapPin, Menu, X } from 'lucide-react'
import { HeroCobertura } from '@/components/hero-cobertura'
import { HeroEscena } from '@/components/hero-escena'
import { PRECIO_DESDE } from '@/lib/planes'
import { url } from '@/lib/base-path'

const SECCIONES = [
  { id: 'inicio', etiqueta: 'Inicio' },
  { id: 'planes', etiqueta: 'Planes' },
  { id: 'cobertura', etiqueta: 'Cobertura' },
  { id: 'beneficios', etiqueta: 'Beneficios' },
  { id: 'autogestion', etiqueta: 'Resuelve en minutos' },
  { id: 'faq', etiqueta: 'Preguntas frecuentes' },
  { id: 'noticias', etiqueta: 'Noticias' },
  { id: 'contacto', etiqueta: 'Contacto' },
  { id: 'legal', etiqueta: 'Marco legal' },
]

const ESCRITORIO = SECCIONES.slice(1, 5)
const MOVIL = SECCIONES.slice(0, 10)

type Props = {
  pagoHref: string
}

export function NavegacionPrincipal({ pagoHref }: Props) {
  const [activa, setActiva] = useState('inicio')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const actualizarActiva = () => {
      const puntoLectura = window.scrollY + 150
      let visible = 'inicio'
      for (const seccion of SECCIONES) {
        const elemento = document.getElementById(seccion.id)
        if (elemento && elemento.offsetTop <= puntoLectura) visible = seccion.id
      }
      setActiva(visible)
    }

    actualizarActiva()
    window.addEventListener('scroll', actualizarActiva, { passive: true })
    window.addEventListener('resize', actualizarActiva)
    return () => {
      window.removeEventListener('scroll', actualizarActiva)
      window.removeEventListener('resize', actualizarActiva)
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('menu-navegacion-abierto', menuOpen)
    if (!menuOpen) return () => document.body.classList.remove('menu-navegacion-abierto')

    const cerrarConEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    const cerrarEnEscritorio = () => { if (window.innerWidth > 1080) setMenuOpen(false) }
    window.addEventListener('keydown', cerrarConEscape)
    window.addEventListener('resize', cerrarEnEscritorio)
    return () => {
      document.body.classList.remove('menu-navegacion-abierto')
      window.removeEventListener('keydown', cerrarConEscape)
      window.removeEventListener('resize', cerrarEnEscritorio)
    }
  }, [menuOpen])

  const irA = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiva(id)
    setMenuOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur nav-header">
      <div className="container nav-header-inner">
        <a href="#inicio" className="brand" aria-label="Guajiranet inicio" onClick={irA('inicio')}>
          <img src={url('/logo-guajiranet.png')} alt="Guajiranet Telecomunicaciones" width={1280} height={720} />
        </a>

        <nav className="nav-principal" aria-label="Navegación principal">
          {ESCRITORIO.map((seccion) => (
            <a
              key={seccion.id}
              href={`#${seccion.id}`}
              className={`nav-link ${activa === seccion.id ? 'activo' : ''}`}
              aria-current={activa === seccion.id ? 'location' : undefined}
              onClick={irA(seccion.id)}
            >
              {seccion.etiqueta}
            </a>
          ))}
          <div className={`nav-dropdown ${SECCIONES.slice(5).some((seccion) => activa === seccion.id) ? 'activo' : ''}`}>
            <button type="button" aria-expanded={SECCIONES.slice(5).some((seccion) => activa === seccion.id)}>
              Más <ChevronDown size={14} />
            </button>
            <div className="nav-dropdown-menu">
              {SECCIONES.slice(5).map((seccion) => (
                <a key={seccion.id} href={`#${seccion.id}`} onClick={irA(seccion.id)}>{seccion.etiqueta}</a>
              ))}
            </div>
          </div>
        </nav>

        <div className="nav-acciones">
          <a className="button button-pay nav-pago" href={pagoHref} target="_blank" rel="noreferrer"><CreditCard size={17} /> Pagar factura</a>
          <a className="button button-primary nav-instalar" href="#contacto" onClick={irA('contacto')}>Quiero instalar</a>
        </div>

        <button type="button" className="nav-toggle" aria-controls="menu-movil" onClick={() => setMenuOpen((abierto) => !abierto)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {menuOpen && (
        <nav id="menu-movil" className="nav-menu-movil" aria-label="Navegación móvil">
          <div className="nav-menu-list">
            {MOVIL.map((seccion) => (
              <a
                key={seccion.id}
                href={`#${seccion.id}`}
                className={activa === seccion.id ? 'activo' : ''}
                aria-current={activa === seccion.id ? 'location' : undefined}
                onClick={irA(seccion.id)}
              >
                <span>{seccion.etiqueta}</span><ArrowRight size={15} />
              </a>
            ))}
          </div>
          <div className="nav-menu-acciones">
            <a className="button button-pay" href={pagoHref} target="_blank" rel="noreferrer"><CreditCard size={17} /> Pagar factura</a>
            <a className="button button-primary" href="#contacto" onClick={irA('contacto')}>Quiero instalar</a>
            <a className="nav-menu-webmail" href="https://guajiranet.com:2096/" target="_blank" rel="noreferrer"><Mail size={16} /> Webmail corporativo</a>
          </div>
        </nav>
      )}
      </header>
      <section id="inicio" className="hero-new">
        <div className="container hero-grid-new">
          <div className="hero-copy">
            <p className="hero-slogan">Conectando sueños</p>
            <div className="eyebrow"><span className="eyebrow-dot" /> Internet por fibra óptica</div>
            <h1>Internet que sí<br /><em>llega contigo.</em></h1>
            <p>Conecta tu hogar o negocio con internet rápido, estable y pensado para la vida en La Guajira.</p>
            <HeroCobertura />
            <div className="hero-actions">
              <a className="button hero-boton-planes" href="#planes" onClick={irA('planes')}>Ver planes <ArrowRight size={17} /></a>
              <span className="hero-desde">Desde <strong>${PRECIO_DESDE}</strong>/mes · instalación incluida</span>
            </div>
            <div className="hero-proof">
              <span className="hero-proof-icono" aria-hidden="true"><MapPin size={18} /></span>
              <p><strong>Más de 8 años</strong><br />conectando hogares y negocios de La Guajira.</p>
            </div>
          </div>
          <div className="hero-visual-new">
            <HeroEscena />
          </div>
        </div>
        <a className="hero-cue" href="#planes" onClick={irA('planes')}><span /> Explora tu conexión</a>
      </section>
    </>
  )
}
