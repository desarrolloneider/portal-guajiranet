'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'

/** Texto tomado de la página «Tu Seguridad» de la web actual de GuajiraNet. */
const SEGURIDAD = [
  {
    titulo: 'Control de acceso',
    texto:
      'En nuestro Centro de Operaciones de Red tenemos un sistema de control de acceso que protege los recursos de la red contra el uso no autorizado: solo el personal autorizado tiene acceso a los equipos.',
  },
  {
    titulo: 'Autenticación',
    texto:
      'Usamos autenticación de varios factores: contraseña en la conexión de última milla, listas de control de acceso e identificación por dirección MAC, para que tu conexión hacia internet sea segura.',
  },
  {
    titulo: 'No repudio',
    texto:
      'Cada equipo guarda y envía los registros de las actividades de gestión a un servidor syslog en nuestro centro de datos, para tener la prueba de que un evento o acción ocurrió.',
  },
  {
    titulo: 'Confidencialidad de los datos',
    texto:
      'La comunicación con nuestros clientes va cifrada con algoritmos tipo AES y control por MAC. Además, todo el personal acepta una política de confidencialidad para el manejo de la información.',
  },
  {
    titulo: 'Seguridad de la comunicación',
    texto:
      'La información solo circula entre los puntos autorizados, sin desvíos ni interceptaciones, gracias a firewalls, túneles y VLAN.',
  },
  {
    titulo: 'Integridad de los datos',
    texto: 'Usamos el protocolo TCP/IP, orientado a conexión, que controla el estado de la transmisión y la recepción de la información.',
  },
  {
    titulo: 'Disponibilidad',
    texto:
      'El centro de operaciones y los nodos tienen sistemas de alimentación ininterrumpida y plantas eléctricas portátiles para fallas de energía, y una bodega de equipos de respaldo. También aplicamos los parches necesarios contra ataques como la denegación de servicio.',
  },
  {
    titulo: 'Privacidad',
    texto: 'Habilitamos el aislamiento de puntos de acceso para que los dispositivos conectados al mismo punto no se comuniquen entre sí.',
  },
]

export function SeguridadRed() {
  return (
    <div className="info-legal">
      <p>
        GUAJIRANET ISP S.A.S. garantiza la seguridad de la red y la integridad del servicio para evitar la interceptación, interrupción e
        interferencia, con medidas basadas en las recomendaciones de la serie X.800 de la UIT.
      </p>
      <ol>
        {SEGURIDAD.map(({ titulo, texto }) => (
          <li key={titulo}>
            <strong>{titulo}</strong>
            <span>{texto}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

const DENUNCIA = [
  { nombre: 'Te Protejo', detalle: 'Denuncia en línea de contenido de abuso sexual infantil', href: 'https://teprotejocolombia.org/' },
  { nombre: 'Fiscalía General de la Nación', detalle: 'Denuncias penales', href: 'https://www.fiscalia.gov.co/colombia/' },
  { nombre: 'Policía Nacional', detalle: 'Línea 123', href: 'https://www.policia.gov.co/' },
  { nombre: 'ICBF', detalle: 'Línea 141, gratuita', href: 'https://www.icbf.gov.co/' },
]

export function InternetSano() {
  return (
    <div className="info-legal">
      <p>
        La Ley 679 de 2001 y su Decreto reglamentario 1524 de 2002 establecen medidas para prevenir y combatir la explotación, la
        pornografía y el turismo sexual con menores de edad a través de internet. GuajiraNet cumple estas normas y te invita a conocerlas.
      </p>

      <h4>Lo que está prohibido</h4>
      <p>Los proveedores, administradores y usuarios de redes no pueden:</p>
      <ul>
        <li>Alojar imágenes, textos, documentos o videos que impliquen, directa o indirectamente, actividades sexuales con menores de edad.</li>
        <li>Alojar material pornográfico cuando haya indicios de que las personas que aparecen son menores de edad.</li>
        <li>Alojar vínculos a sitios que contengan o distribuyan material pornográfico con menores de edad.</li>
      </ul>

      <h4>Nuestros deberes y los tuyos</h4>
      <ul>
        <li>Denunciar ante las autoridades cualquier acto criminal contra menores de edad que se conozca, incluida la difusión de material pornográfico con menores.</li>
        <li>Combatir con los medios técnicos al alcance la difusión de ese material.</li>
        <li>No usar las redes para divulgar material ilegal con menores de edad.</li>
        <li>Contar con mecanismos técnicos de bloqueo para que los usuarios puedan protegerse a sí mismos y a sus hijos de ese material.</li>
      </ul>

      <p>
        Quien incumpla estas normas se expone a multas de hasta 100 salarios mínimos legales mensuales vigentes y a la suspensión o
        cancelación de la página, además de las sanciones penales que correspondan.
      </p>

      <h4>¿Dónde denunciar?</h4>
      <div className="info-legal-enlaces">
        {DENUNCIA.map(({ nombre, detalle, href }) => (
          <a key={nombre} href={href} target="_blank" rel="noreferrer">
            <span>
              <strong>{nombre}</strong>
              <small>{detalle}</small>
            </span>
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        ))}
      </div>
    </div>
  )
}

/** Banner del Régimen de Protección de Usuarios que la CRC exige en la parte superior del pie de página. */
export function BannerCrc() {
  const imagen = useRef<HTMLImageElement>(null)
  const [fallo, setFallo] = useState(false)

  // Si la imagen falló antes de que React cargara, onError no alcanza a dispararse: se revisa al montar.
  useEffect(() => {
    const img = imagen.current
    if (img && img.complete && img.naturalWidth === 0) setFallo(true)
  }, [])

  return (
    <div className="container banner-crc">
      <a href="https://www.crcom.gov.co/pagina/regimen-proteccion-usuario" target="_blank" rel="noreferrer" className={fallo ? 'sin-imagen' : undefined}>
        <img
          ref={imagen}
          src="https://www.crcom.gov.co/pp/bannerO.gif"
          alt="Conoce el Régimen de Protección de los Derechos de los Usuarios de Servicios de Comunicaciones de la CRC"
          onError={() => setFallo(true)}
        />
        <span className="banner-crc-texto">Conoce el Régimen de Protección de los Derechos de los Usuarios · CRC</span>
      </a>
    </div>
  )
}
