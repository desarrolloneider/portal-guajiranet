import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { PORTALES_PAGO } from '@/lib/pagos'

/** Accesos de pago en el inicio: lo primero que ve quien entra a pagar su factura. */
export function HeroPagos() {
  return (
    <div className="hero-pagos" aria-labelledby="hero-pagos-titulo">
      <p className="hero-pagos-titulo" id="hero-pagos-titulo">
        <span className="hero-pagos-punto" aria-hidden="true" /> Paga tu factura en línea
      </p>
      <div className="hero-pagos-lista">
        {PORTALES_PAGO.map(({ clave, href, logo, marca, titulo, texto, detalle }, i) => (
          <a
            key={clave}
            className={`hero-pago hero-pago-${clave}`}
            href={href}
            target="_blank"
            rel="noreferrer"
            style={{ animationDelay: `${0.25 + i * 0.15}s` }}
            aria-label={`${titulo}: ${texto}. Se abre en una pestaña nueva.`}
          >
            <span className={`pago-logo pago-logo-${clave}`} role="img" aria-label={`Logo de ${marca}`} style={{ backgroundImage: `url(${logo})` }} />
            <span className="hero-pago-texto">
              <strong>{titulo}</strong>
              <small>{detalle}</small>
            </span>
            <ArrowUpRight className="hero-pago-flecha" size={18} aria-hidden="true" />
          </a>
        ))}
      </div>
      <p className="hero-pagos-nota">
        <ShieldCheck size={14} aria-hidden="true" /> Pagos seguros: elige el portal que prefieras
      </p>
    </div>
  )
}
