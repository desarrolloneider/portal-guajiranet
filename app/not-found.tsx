import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página no encontrada',
  robots: { index: false },
}

const WHATSAPP = 'https://wa.me/573009139909'

const boton: React.CSSProperties = {
  borderRadius: 30,
  fontSize: 15,
  fontWeight: 700,
  padding: '14px 24px',
  textDecoration: 'none',
}

export default function NoEncontrada() {
  return (
    <main
      style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      <a href="/" aria-label="Ir al inicio de Guajiranet">
        <img src="/logo-guajiranet.png" alt="Guajiranet Telecomunicaciones" width={260} height={124} style={{ aspectRatio: '2.1', height: 'auto', maxWidth: '60vw', objectFit: 'fill' }} />
      </a>
      <p style={{ color: 'var(--marca-azul)', fontSize: 14, fontWeight: 800, letterSpacing: '.14em', margin: '10px 0 0' }}>ERROR 404</p>
      <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', lineHeight: 1.1, margin: 0 }}>Esta página no existe o cambió de lugar</h1>
      <p style={{ color: '#626873', fontSize: 17, lineHeight: 1.5, margin: 0, maxWidth: 520 }}>
        Renovamos nuestra web. Desde el inicio puedes ver los planes, pagar tu factura, radicar un PQRS o cambiar la clave del WiFi.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 8 }}>
        <a href="/" style={{ ...boton, background: 'var(--marca-amarillo)', color: 'var(--marca-grafito)' }}>
          Ir al inicio
        </a>
        <a href="/#planes" style={{ ...boton, background: '#e7eaf1', color: 'var(--marca-grafito)' }}>
          Ver planes
        </a>
        <a href={WHATSAPP} target="_blank" rel="noreferrer" style={{ ...boton, background: 'var(--marca-verde)', color: '#fff' }}>
          Escríbenos por WhatsApp
        </a>
      </div>
    </main>
  )
}
