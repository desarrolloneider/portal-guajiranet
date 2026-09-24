'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, ChevronDown, CreditCard, MapPin, Menu, X } from 'lucide-react'
import { HeroEscena } from '@/components/hero-escena'

const SECCIONES = [
  { id: 'inicio', etiqueta: 'Inicio' },
  { id: 'planes', etiqueta: 'Planes' },
  { id: 'cobertura', etiqueta: 'Cobertura' },
  { id: 'beneficios', etiqueta: 'Beneficios' },
  { id: 'autogestion', etiqueta: 'Resuelve en minutos' },
  { id: 'pago-factura', etiqueta: 'Pagar factura' },
  { id: 'faq', etiqueta: 'Preguntas frecuentes' },
  { id: 'noticias', etiqueta: 'Noticias' },
  { id: 'contactos', etiqueta: 'Contactos' },
  { id: 'legal', etiqueta: 'Marco legal' },
]

const ESCRITORIO = SECCIONES.slice(1, 6)
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
    return () => document.body.classList.remove('menu-navegacion-abierto')
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
        <a href="#inicio" className="brand" aria-label="GuajiraNet inicio" onClick={irA('inicio')}>
          <img src="/logo-guajiranet.png" alt="GuajiraNet Telecomunicaciones" width={1280} height={720} />
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
          <div className={`nav-dropdown ${SECCIONES.slice(6).some((seccion) => activa === seccion.id) ? 'activo' : ''}`}>
            <button type="button" aria-expanded={SECCIONES.slice(6).some((seccion) => activa === seccion.id)}>
              Más <ChevronDown size={14} />
            </button>
            <div className="nav-dropdown-menu">
              {SECCIONES.slice(6).map((seccion) => (
                <a key={seccion.id} href={`#${seccion.id}`} onClick={irA(seccion.id)}>{seccion.etiqueta}</a>
              ))}
            </div>
          </div>
        </nav>

        <div className="nav-acciones">
          <a className="button button-pay nav-pago" href={pagoHref} target="_blank" rel="noreferrer"><CreditCard size={17} /> Pagar factura</a>
          <a className="button button-primary nav-instalar" href="#contacto" onClick={irA('contacto')}>Quiero instalar</a>
        </div>

        <button className="nav-toggle" onClick={() => setMenuOpen((abierto) => !abierto)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {menuOpen && (
        <nav className="mobile-menu nav-menu-movil" aria-label="Navegación móvil">
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
          </div>
        </nav>
      )}
      </header>
      <section id="inicio" className="hero-new">
        <div className="container hero-grid-new">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> Conectando sueños</div>
            <h1>Internet que sí<br /><em>llega contigo.</em></h1>
            <p>Conecta tu hogar o negocio con internet rápido, estable y pensado para la vida en La Guajira.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#planes" onClick={irA('planes')}>Ver planes <ArrowRight size={17} /></a>
              <a className="text-link" href="#cobertura" onClick={irA('cobertura')}><MapPin size={17} /> Consultar cobertura</a>
            </div>
            <div className="hero-proof">
              <div className="avatars" aria-hidden="true"><span>GN</span><span>24</span><span>+</span></div>
              <p><strong>Conexión cercana</strong><br />Soporte humano en tu zona.</p>
            </div>
          </div>
          <div className="hero-visual-new">
            <div className="hero-orbit-label"><span className="eyebrow-dot" /> Fibra diseñada para tu día a día</div>
            <HeroEscena />
          </div>
        </div>
        <a className="hero-cue" href="#planes" onClick={irA('planes')}><span /> Explora tu conexión</a>
      </section>
    </>
  )
}
