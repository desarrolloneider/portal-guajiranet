'use client'

type Cliente = {
  nombre: string
  /** Ruta dentro de /public. Si no existe el archivo, se muestra el nombre como texto. */
  logo?: string
}

const CLIENTES: Cliente[] = [
  { nombre: 'Veolia', logo: '/clientes/Veolia_logo.svg.webp' },
  { nombre: 'SuperGIROS', logo: '/clientes/supergiros.webp' },
  { nombre: 'Sodexo', logo: '/clientes/Sodexo_logo.svg.webp' },
  { nombre: 'Sevicol', logo: '/clientes/IMAGOTIPO+SEVICOL-01-403c6e59.png' },
  { nombre: 'Colvatel', logo: '/clientes/Recurso-1logo_colvatel_nuevo.webp' },
  { nombre: 'IMS', logo: '/clientes/ims.png' },
  { nombre: 'JC Soluciones de Infraestructura', logo: '/clientes/jc-soluciones.png' },
]

function Marca({ c }: { c: Cliente }) {
  return (
    <li className="cliente">
      {c.logo ? (
        <img src={c.logo} alt={c.nombre} loading="lazy" />
      ) : (
        <span className="cliente-texto">{c.nombre}</span>
      )}
    </li>
  )
}

export function Clientes() {
  // La lista se repite para que el desplazamiento sea continuo y sin salto.
  const cinta = [...CLIENTES, ...CLIENTES]

  return (
    <section className="clientes" aria-label="Empresas que confían en GuajiraNet">
      <div className="container">
        <p className="clientes-titulo" data-revelar>
          Empresas y entidades que ya confían en nosotros
        </p>
      </div>

      <div className="clientes-cinta">
        <ul className="clientes-pista" style={{ ['--n' as string]: CLIENTES.length }}>
          {cinta.map((c, i) => (
            <Marca c={c} key={`${c.nombre}-${i}`} />
          ))}
        </ul>
      </div>
    </section>
  )
}
