'use client'

import { url } from '@/lib/base-path'

type Cliente = {
  nombre: string
  /** Ruta dentro de /public. Si no existe el archivo, se muestra el nombre como texto. */
  logo?: string
}

const CLIENTES: Cliente[] = [
  { nombre: 'Cerrejón', logo: '/clientes/cerrejon.webp' },
  { nombre: 'Veolia', logo: '/clientes/veolia.webp' },
  { nombre: 'Sodexo', logo: '/clientes/sodexo.webp' },
  { nombre: 'SuperGIROS', logo: '/clientes/supergiros.webp' },
  { nombre: 'Internexa', logo: '/clientes/internexa.webp' },
  { nombre: 'Liebherr', logo: '/clientes/liebherr.webp' },
  { nombre: 'SGS', logo: '/clientes/sgs.webp' },
  { nombre: 'Cummins Norte de Colombia', logo: '/clientes/cummins.webp' },
  { nombre: 'Comfaguajira', logo: '/clientes/comfaguajira.webp' },
  { nombre: 'Gases de La Guajira', logo: '/clientes/gases-de-la-guajira.webp' },
  { nombre: 'Liberty Networks', logo: '/clientes/liberty-networks.webp' },
  { nombre: 'IMS', logo: '/clientes/ims.webp' },
  { nombre: 'Relianz Mining Solutions', logo: '/clientes/relianz.webp' },
  { nombre: 'CHM Minería', logo: '/clientes/chm-mineria.webp' },
  { nombre: 'MASA Mecánicos Asociados', logo: '/clientes/masa.webp' },
  { nombre: 'Hospital San Rafael de San Juan del Cesar', logo: '/clientes/hospital-san-rafael.webp' },
  { nombre: 'Hospital San Agustín', logo: '/clientes/hospital-san-agustin.webp' },
  { nombre: 'Dusakawi EPSI', logo: '/clientes/dusakawi.webp' },
  { nombre: 'Infotep', logo: '/clientes/infotep.webp' },
  { nombre: 'INP', logo: '/clientes/inp.webp' },
  { nombre: 'Colombiatel Telecomunicaciones', logo: '/clientes/colombiatel.webp' },
  { nombre: 'Airbytel', logo: '/clientes/airbytel.webp' },
  { nombre: 'Super Link', logo: '/clientes/super-link.webp' },
  { nombre: 'Maotech Telecomunicaciones', logo: '/clientes/maotech.webp' },
  { nombre: 'Multipagas', logo: '/clientes/multipagas.webp' },
  { nombre: 'Quinberlab', logo: '/clientes/quinberlab.webp' },
  { nombre: 'Luna Hermanos', logo: '/clientes/luna-hermanos.webp' },
  { nombre: 'Hotel Waya Guajira', logo: '/clientes/hotel-waya.webp' },
  { nombre: 'Unidrogas', logo: '/clientes/unidrogas.webp' },
  { nombre: 'SIC', logo: '/clientes/sic.webp' },
  // Pendiente: el archivo se llamaba "UNIVERSIDAD DEL CESAR" pero el logo es el de la Universidad del Norte.
  // Cuando se confirme cuál es, poner aquí el logo correcto (en public/clientes/) y quitar el comentario.
  // { nombre: 'Universidad ...', logo: '/clientes/universidad.webp' },
]

function Marca({ c }: { c: Cliente }) {
  return (
    <li className="cliente">
      {c.logo ? (
        <img src={url(c.logo)} alt={c.nombre} loading="lazy" />
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
    <section className="clientes" aria-label="Empresas que confían en Guajiranet">
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
