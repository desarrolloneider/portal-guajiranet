'use client'

type Cliente = {
  nombre: string
  /** Ruta dentro de /public. Si no existe el archivo, se muestra el nombre como texto. */
  logo?: string
}

// Para usar los logos reales: guarda el PNG en public/clientes/ y agrega la ruta en "logo".
const CLIENTES: Cliente[] = [
  { nombre: 'Sevicol' },
  { nombre: 'IMS' },
  { nombre: 'JC Soluciones de Infraestructura' },
  { nombre: 'Veolia' },
  { nombre: 'Super GIROS' },
  { nombre: 'Cliente 6' },
  { nombre: 'Cliente 7' },
  { nombre: 'Cliente 8' },
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
