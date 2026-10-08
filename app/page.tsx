'use client'

import { useState } from 'react'
import { ArrowRight, Building2, ChevronDown, ClipboardCheck, Clock, Mail, MapPin, MessageCircle, MousePointer2, Phone, RadioTower, Wrench } from 'lucide-react'
import { Autogestion, EVENTO_AUTOGESTION } from '@/components/autogestion'
import { Clientes } from '@/components/clientes'
import { Cobertura } from '@/components/cobertura'
import { FibraBanner } from '@/components/fibra-banner'
import { Metricas } from '@/components/metricas'
import { BannerCrc, InternetSano, SeguridadRed } from '@/components/info-legal'
import { Modal } from '@/components/modal'
import { NavegacionPrincipal } from '@/components/navegacion-principal'
import { NoticiasSlider } from '@/components/noticias-slider'
import { PlanesSelector } from '@/components/planes-selector'
import { Revelador } from '@/components/revelador'
import { Tutorial } from '@/components/tutorial'
import { AccionesFlotantes, BarraProgreso } from '@/components/utilidades'
import { LISTA_MUNICIPIOS_CON_COBERTURA } from '@/lib/cobertura'

const pasos = [
  { icono: MousePointer2, titulo: 'Consulta tu cobertura', texto: 'Busca tu municipio en el mapa y confirma en segundos si ya llegamos a tu zona.' },
  { icono: ClipboardCheck, titulo: 'Elige tu plan', texto: 'Te ayudamos a escoger la velocidad según cuántos son en casa y qué hacen en línea.' },
  { icono: Wrench, titulo: 'Instalamos en 48 horas', texto: 'Un técnico de la zona llega, instala la fibra y deja tu WiFi funcionando y probado.' },
]

const ventajas = [
  { icono: RadioTower, titulo: 'Cobertura rural', texto: 'Rancherías, corregimientos y veredas: llegamos con fibra o radioenlace.' },
  { icono: Building2, titulo: 'Enlaces dedicados para negocios', texto: 'Ancho de banda garantizado para tu datáfono, tu facturación y tus cámaras.' },
  { icono: Wrench, titulo: 'Soporte el mismo día', texto: 'Nuestros técnicos viven en la zona y llegan a tu casa el mismo día.' },
  { icono: MessageCircle, titulo: 'Atención por WhatsApp', texto: 'Resolvemos tus dudas por el canal que ya usas.' },
]

const IconoFacebook = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8.5V7c0-.8.2-1.2 1.4-1.2H17V3h-2.6C11.2 3 10 4.6 10 7v1.5H8V12h2v9h4v-9h2.6l.4-3.5z" /></svg>
)
const IconoInstagram = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" /></svg>
)

const PAGO = 'https://ds.dsnube.co/documento/?empresa=UqBGh1ev+4w5YMySqWUUuWnbyM4NML2QEEUqsYUO93o='
const WHATSAPP = 'https://wa.me/573009139909'

const institucionales = [
  ['Dignidad Infantil', 'https://teprotejocolombia.org/'],
  ['En TIC Confío', 'https://www.mintic.gov.co/portal/inicio/Atencion-y-Servicio-a-la-Ciudadania/Preguntas-frecuentes/15261:En-TIC-Confio'],
  ['Fiscalía General', 'https://www.fiscalia.gov.co/colombia/'],
  ['Policía Nacional', 'https://www.policia.gov.co/'],
  ['Bienestar Familiar', 'https://www.icbf.gov.co/'],
]

const resoluciones = [
  ['Ley 679 de 2001', '/legal/LEY_679_DE_2001_Colombia.pdf'],
  ['Ley 1341 de 2009', '/legal/ley_1341_de_2009.pdf'],
  ['Ley 1978 de 2019', '/legal/LEY-1978-DEL-25-DE-JULIO-DE-2019.pdf'],
  ['Resolución 5050 de 2016', '/legal/resolucion-5050-2016.pdf'],
  ['Resolución 5111 de 2017', '/legal/Resolucion-5111-2017.pdf'],
]

const faqs = [
  ['¿Dónde tienen cobertura?', `Hoy tenemos cobertura para hogares en zonas de ${LISTA_MUNICIPIOS_CON_COBERTURA}, en La Guajira. Escribe tu barrio o dirección en el mapa de cobertura para confirmar que llegamos a tu casa.`],
  ['¿Cuánto tarda la instalación?', 'Coordinamos tu instalación en un máximo de 48 horas hábiles después de validar la cobertura.'],
  ['¿Puedo pagar mi factura en línea?', 'Sí. Usa el botón Pagar factura para realizar tu pago de forma rápida y segura.'],
  ['¿El router está incluido en el plan?', 'Sí. Todos nuestros planes incluyen el router WiFi y la instalación, sin cobros escondidos.'],
]

const noticias = [
  {
    id: 'expansion',
    categoria: 'Comunidad',
    tono: 'verde',
    fecha: '12 agosto 2026',
    fechaISO: '2026-08-12',
    titulo: 'Seguimos expandiendo nuestra red por toda Colombia',
    resumen: 'La Guajira es nuestro punto de partida y Colombia, el horizonte: conectamos nuevas comunidades con una red estable y cercana.',
    imagen: '/noticias/expansion-red.webp',
    enfoque: '65% 50%',
    detalle: 'Estamos llevando nuestra experiencia de conectividad local a nuevas regiones del país. Cada nueva zona comienza con escucha, planeación y una instalación pensada para las necesidades reales de la comunidad.',
    consejos: ['Consulta tu municipio en el mapa de cobertura.', 'Déjanos tus datos si tu zona aparece como próxima.', 'Comparte la información con vecinos que también necesiten conectarse.'],
  },
  {
    id: 'wifi',
    categoria: 'Servicio',
    tono: 'azul',
    fecha: '06 agosto 2026',
    fechaISO: '2026-08-06',
    titulo: 'Consejos para disfrutar mejor tu WiFi en casa',
    resumen: 'Pequeños cambios de ubicación y hábitos pueden ayudarte a aprovechar mejor la conexión.',
    imagen: '/noticias/wifi-en-casa.webp',
    // Encuadre arriba a la derecha y 12% más grande para que el router no quede debajo del contador "02 / 03".
    enfoque: '80% 0%',
    zoom: 1.12,
    enfoqueMini: '65% 50%',
    detalle: 'Una red WiFi estable empieza con una buena ubicación del router y continúa con hábitos sencillos de uso. Prueba estos consejos antes de solicitar soporte.',
    consejos: ['Ubica el router en un lugar alto, abierto y central.', 'Evita esconderlo dentro de muebles o cerca de electrodomésticos.', 'Conecta por cable los equipos que necesitan máxima estabilidad.', 'Reinicia el router solo cuando sea necesario y revisa primero las luces indicadoras.'],
  },
  {
    id: 'atencion',
    categoria: 'GuajiraNet',
    tono: 'amarillo',
    fecha: '28 julio 2026',
    fechaISO: '2026-07-28',
    titulo: 'Atención local, tecnología para todos',
    resumen: 'Estamos cerca para ayudarte con instalación, soporte, facturación y orientación.',
    imagen: '/noticias/atencion-local.webp',
    enfoque: '50% 8%',
    detalle: 'Nuestra atención combina herramientas digitales con acompañamiento humano. Queremos que cada solicitud tenga una respuesta clara y un canal sencillo para continuar.',
    consejos: ['Escríbenos por WhatsApp para una orientación rápida.', 'Ten a la mano tu número de contrato si necesitas soporte.', 'Consulta el portal de pagos para realizar tu trámite en línea.'],
  },
]

export default function Page() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [noticiaAbierta, setNoticiaAbierta] = useState<string | null>(null)
  const [infoLegal, setInfoLegal] = useState<null | 'seguridad' | 'internet-sano'>(null)
  const abrirInfo = (cual: 'seguridad' | 'internet-sano') => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setInfoLegal(cual)
  }
  const abrirPqrs = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    window.dispatchEvent(new CustomEvent(EVENTO_AUTOGESTION, { detail: 'pqrs' }))
  }
  const noticiaActiva = noticias.find((noticia) => noticia.id === noticiaAbierta)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <BarraProgreso />
      <Revelador />

      <div className="topbar">
        <div className="container flex items-center justify-between">
          <span>Internet que conecta a La Guajira</span>
          <span className="hidden sm:inline">Lunes a sábado · 7:00 a. m. a 12:00 m. y 2:00 a 6:00 p. m.</span>
        </div>
      </div>

      <NavegacionPrincipal pagoHref={PAGO} />

      <Metricas />

      <PlanesSelector />

      <Autogestion />

      <section id="beneficios" className="beneficios">
        <div className="container beneficios-grid">
          <div className="beneficios-copy" data-revelar="izq">
            <div className="eyebrow">Por qué GuajiraNet</div>
            <h2>Llegamos donde otros <span>no cablean</span></h2>
            <p>Somos de La Guajira: técnicos que viven en tu zona, soporte el mismo día y atención por WhatsApp para hogares y negocios.</p>
            <a className="button button-yellow" href="#cobertura">Consultar mi zona <ArrowRight size={17} /></a>
          </div>
          <ul className="ventajas">
            {ventajas.map(({ icono: Icono, titulo, texto }, i) => (
              <li className="ventaja" key={titulo} data-revelar data-delay={i * 110}>
                <span className="ventaja-icono" aria-hidden="true"><Icono size={22} /></span>
                <strong>{titulo}</strong>
                <p>{texto}</p>
              </li>
            ))}
          </ul>
        </div>
        <FibraBanner />
      </section>

      <section id="pasos" className="section pasos">
        <div className="container">
          <div className="section-heading">
            <div data-revelar="izq"><h2>Así te instalamos</h2></div>
            <p data-revelar="der">Consultas tu zona, eliges el plan y en 48 horas un técnico te deja el WiFi funcionando.</p>
          </div>
          <ol className="pasos-grid">
            {pasos.map(({ icono: Icono, titulo, texto }, i) => (
              <li className="paso" key={titulo} data-revelar data-delay={i * 140}>
                <span className="paso-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="paso-icono"><Icono size={22} /></span>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Cobertura />

      <Clientes />

      <section id="faq" className="section faq">
        <div className="container faq-grid">
          <div data-revelar="izq">
            <h2>Preguntas frecuentes</h2>
            <p>¿No encuentras lo que buscas?</p>
            <a href="#contacto" className="text-link">Habla con nuestro equipo <ArrowRight size={16} /></a>
          </div>
          <div className="faq-list" data-revelar="der">
            {faqs.map(([question, answer], index) => (
              <div className={`faq-item ${openFaq === index ? 'abierto' : ''}`} key={question}>
                <button onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}>
                  <span>{question}</span>
                  <ChevronDown size={20} />
                </button>
                <div className="faq-panel"><div><p>{answer}</p></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <NoticiasSlider noticias={noticias} onAbrir={setNoticiaAbierta} detenido={noticiaAbierta !== null} />

      <section id="legal" className="legal-strip">
        <div className="container">
          <div data-revelar="izq"><h2>Marco legal</h2></div>
          <div className="legal-links" data-revelar="der">
            <a href="#legal">Términos y condiciones <ArrowRight size={15} /></a>
            <a href="/legal/politica-tratamiento-datos.pdf" target="_blank" rel="noreferrer">Política de privacidad <ArrowRight size={15} /></a>
            <a href="#autogestion" onClick={abrirPqrs}>PQR y reclamos <ArrowRight size={15} /></a>
            <a href="#legal" onClick={abrirInfo('seguridad')}>Seguridad de la red <ArrowRight size={15} /></a>
            <a href="#legal" onClick={abrirInfo('internet-sano')}>Internet sano · Ley 679 de 2001 <ArrowRight size={15} /></a>
          </div>
        </div>
      </section>

      <section id="contacto" className="contact-details">
        <div className="container contact-details-grid">
          <div data-revelar="izq">
            <h2>¿Hablamos?</h2>
            <p>Instalación, soporte o facturación: escríbenos por WhatsApp o llámanos. Te atendemos de lunes a sábado.</p>
          </div>
          <div className="contact-options" data-revelar="der">
            <a href={WHATSAPP} target="_blank" rel="noreferrer"><MessageCircle size={20} /><span><small>WhatsApp</small><strong>Escríbenos ahora</strong></span></a>
            <a href="tel:+573009139909"><Phone size={20} /><span><small>Llámanos</small><strong>+57 300 913 9909</strong></span></a>
            <a id="correo" href="mailto:info@guajiranet.com"><Mail size={20} /><span><small>Escríbenos</small><strong>info@guajiranet.com</strong></span></a>
          </div>
        </div>
      </section>

      <footer id="pagar">
        <BannerCrc />
        <div className="container footer-top">
          <div className="footer-col footer-marca">
            <a href="#inicio" className="brand"><img src="/logo-guajiranet-claro.png" alt="GuajiraNet Telecomunicaciones" width={1280} height={720} /></a>
            <p>Por más de 8 años GuajiraNet ISP S.A.S. ha llevado conexión segura y de calidad a hogares, comercios y empresas de La Guajira, incluidas las zonas rurales.</p>
            <div className="footer-redes">
              <a href="https://www.facebook.com/profile.php?id=100084242560939" target="_blank" rel="noreferrer" aria-label="Facebook"><IconoFacebook /></a>
              <a href="https://www.instagram.com/guajiranet.telecomunicaciones/" target="_blank" rel="noreferrer" aria-label="Instagram"><IconoInstagram /></a>
              <a href={WHATSAPP} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={17} /></a>
              <a href="mailto:info@guajiranet.com" aria-label="Correo"><Mail size={17} /></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Contactos</h4>
            <ul>
              <li className="footer-dato"><MapPin size={15} /> Albania, Cra 4 #4-96, Barrio El Centro, La Guajira</li>
              <li><a className="footer-dato" href="mailto:info@guajiranet.com"><Mail size={15} /> info@guajiranet.com</a></li>
              <li><a className="footer-dato" href="tel:+573009139909"><Phone size={15} /> +57 300 913 9909</a></li>
              <li className="footer-dato"><Clock size={15} /> Lunes a sábado<br />7:00 a. m. a 12:00 m.<br />2:00 a 6:00 p. m.</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Links institucionales</h4>
            <ul>
              {institucionales.map(([texto, href]) => (
                <li key={texto}><a href={href} target="_blank" rel="noreferrer">{texto}</a></li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>Resoluciones</h4>
            <ul>
              {resoluciones.map(([texto, href]) => (
                <li key={texto}><a href={href} target="_blank" rel="noreferrer">{texto}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="container footer-bottom">
          <small>© 2026 GUAJIRANET ISP S.A.S. Todos los derechos reservados.</small>
          <div className="footer-legal">
            <a href="#legal">Términos y condiciones</a>
            <a href="/legal/politica-tratamiento-datos.pdf" target="_blank" rel="noreferrer">Política de privacidad</a>
            <a href="#autogestion" onClick={abrirPqrs}>PQRS</a>
            <a href="#legal" onClick={abrirInfo('seguridad')}>Tu seguridad</a>
            <a href="#legal" onClick={abrirInfo('internet-sano')}>Internet sano</a>
          </div>
        </div>
      </footer>

      <Modal abierto={Boolean(noticiaActiva)} onCerrar={() => setNoticiaAbierta(null)} titulo={noticiaActiva?.titulo ?? ''} subtitulo={noticiaActiva ? `${noticiaActiva.categoria} · ${noticiaActiva.fecha}` : undefined} ancho={760}>
        {noticiaActiva && (
          <div className="noticia-detalle">
            <img src={noticiaActiva.imagen} alt="" />
            <p>{noticiaActiva.detalle}</p>
            <h4>Consejos para tenerlo en cuenta</h4>
            <ul>{noticiaActiva.consejos.map((consejo) => <li key={consejo}>{consejo}</li>)}</ul>
            <a className="button button-primary" href={noticiaActiva.id === 'wifi' ? '#faq' : '#contacto'} onClick={() => setNoticiaAbierta(null)}>Continuar en GuajiraNet <ArrowRight size={16} /></a>
          </div>
        )}
      </Modal>

      <Modal abierto={infoLegal === 'seguridad'} onCerrar={() => setInfoLegal(null)} titulo="Seguridad de la red" subtitulo="Procedimientos para garantizar la seguridad y la integridad del servicio" ancho={760}>
        <SeguridadRed />
      </Modal>

      <Modal abierto={infoLegal === 'internet-sano'} onCerrar={() => setInfoLegal(null)} titulo="Internet sano" subtitulo="Ley 679 de 2001 y Decreto 1524 de 2002" ancho={760}>
        <InternetSano />
      </Modal>

      <AccionesFlotantes />
      <Tutorial />
    </main>
  )
}
