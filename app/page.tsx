'use client'

import { useState } from 'react'
import { ArrowRight, ChevronDown, ClipboardCheck, Clock, CreditCard, FileText, Gauge, Headphones, KeyRound, Mail, MapPin, MessageCircle, MousePointer2, Newspaper, Phone, ShieldCheck, Wifi, Wrench } from 'lucide-react'
import { Autogestion } from '@/components/autogestion'
import { Clientes } from '@/components/clientes'
import { Cobertura } from '@/components/cobertura'
import { FibraBanner } from '@/components/fibra-banner'
import { Intro } from '@/components/intro'
import { Metricas } from '@/components/metricas'
import { Modal } from '@/components/modal'
import { NavegacionPrincipal } from '@/components/navegacion-principal'
import { PlanesCarrusel } from '@/components/planes-carrusel'
import { Revelador } from '@/components/revelador'
import { SliderMensajes } from '@/components/slider-mensajes'
import { AccionesFlotantes, BarraProgreso } from '@/components/utilidades'

const pasos = [
  { icono: MousePointer2, titulo: 'Consulta tu cobertura', texto: 'Busca tu municipio en el mapa y confirma en segundos si ya llegamos a tu zona.' },
  { icono: ClipboardCheck, titulo: 'Elige tu plan', texto: 'Te ayudamos a escoger la velocidad según cuántos son en casa y qué hacen en línea.' },
  { icono: Wrench, titulo: 'Instalamos en 48 horas', texto: 'Un técnico de la zona llega, instala la fibra y deja tu WiFi funcionando y probado.' },
]

const IconoFacebook = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8.5V7c0-.8.2-1.2 1.4-1.2H17V3h-2.6C11.2 3 10 4.6 10 7v1.5H8V12h2v9h4v-9h2.6l.4-3.5z" /></svg>
)
const IconoInstagram = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" /></svg>
)

const PAGO = 'https://ds.dsnube.co/documento/?empresa=UqBGh1ev+4w5YMySqWUUuWnbyM4NML2QEEUqsYUO93o='
const WHATSAPP = 'https://wa.me/573009139909'

const autogestion = [
  { icono: CreditCard, titulo: 'Pagar factura', texto: 'Paga en línea de forma rápida y segura, sin salir de casa.', accion: 'Ir a pagar', href: PAGO },
  { icono: Gauge, titulo: 'Test de velocidad', texto: 'Mide en segundos la velocidad real de tu conexión.', accion: 'Medir ahora', href: 'https://www.guajiranet.com/test-de-velocidad-de-internet/' },
  { icono: FileText, titulo: 'Presentar un PQRS', texto: 'Radica tu petición, queja, reclamo o sugerencia.', accion: 'Radicar', href: 'https://www.guajiranet.com/presentar-un-pqrs/' },
  { icono: KeyRound, titulo: 'Cambio de clave', texto: 'Actualiza la contraseña de tu red WiFi cuando quieras.', accion: 'Cambiar clave', href: 'https://www.guajiranet.com/cambio-de-clave/' },
]

const institucionales = [
  ['Dignidad Infantil', 'https://teprotejocolombia.org/'],
  ['En TIC Confío', 'https://www.mintic.gov.co/portal/inicio/Atencion-y-Servicio-a-la-Ciudadania/Preguntas-frecuentes/15261:En-TIC-Confio'],
  ['Fiscalía General', 'https://www.fiscalia.gov.co/colombia/'],
  ['Policía Nacional', 'https://www.policia.gov.co/'],
  ['Bienestar Familiar', 'https://www.icbf.gov.co/'],
]

const resoluciones = [
  ['Ley 679 de 2001', 'https://guajiranet.com/wp-content/uploads/2024/08/LEY_679_DE_2001_Colombia.pdf'],
  ['Ley 1341 de 2009', 'https://guajiranet.com/wp-content/uploads/2024/08/ley_1341_de_2009.pdf'],
  ['Ley 1978 de 2019', 'https://guajiranet.com/wp-content/uploads/2024/08/LEY-1978-DEL-25-DE-JULIO-DE-2019.pdf'],
  ['Resolución 5050 de 2016', 'https://guajiranet.com/wp-content/uploads/2024/08/resolucion-5050-2016.pdf'],
  ['Resolución 5111 de 2017', 'https://guajiranet.com/wp-content/uploads/2024/08/Resolucion-5111-2017.pdf'],
]

const faqs = [
  ['¿En qué municipios tienen cobertura?', 'Estamos ampliando nuestra red en Riohacha, Maicao, Uribia, Manaure y municipios cercanos. Consulta tu dirección para confirmar disponibilidad.'],
  ['¿Cuánto tarda la instalación?', 'Coordinamos tu instalación en un máximo de 48 horas hábiles después de validar la cobertura.'],
  ['¿Puedo pagar mi factura en línea?', 'Sí. Usa el botón Pagar factura para realizar tu pago de forma rápida y segura.'],
  ['¿El router está incluido en el plan?', 'Sí. Todos nuestros planes incluyen el router WiFi y la instalación, sin cobros escondidos.'],
]

const noticias = [
  {
    id: 'expansion',
    categoria: 'Comunidad',
    fecha: '12 agosto 2026',
    titulo: 'Seguimos expandiendo nuestra red por toda Colombia',
    resumen: 'La Guajira es nuestro punto de partida y Colombia, el horizonte: conectamos nuevas comunidades con una red estable y cercana.',
    imagen: '/noticias/expansion-red.webp',
    detalle: 'Estamos llevando nuestra experiencia de conectividad local a nuevas regiones del país. Cada nueva zona comienza con escucha, planeación y una instalación pensada para las necesidades reales de la comunidad.',
    consejos: ['Consulta tu municipio en el mapa de cobertura.', 'Déjanos tus datos si tu zona aparece como próxima.', 'Comparte la información con vecinos que también necesiten conectarse.'],
  },
  {
    id: 'wifi',
    categoria: 'Servicio',
    fecha: '06 agosto 2026',
    titulo: 'Consejos para disfrutar mejor tu WiFi en casa',
    resumen: 'Pequeños cambios de ubicación y hábitos pueden ayudarte a aprovechar mejor la conexión.',
    imagen: '/noticias/wifi-en-casa.jpg',
    detalle: 'Una red WiFi estable empieza con una buena ubicación del router y continúa con hábitos sencillos de uso. Prueba estos consejos antes de solicitar soporte.',
    consejos: ['Ubica el router en un lugar alto, abierto y central.', 'Evita esconderlo dentro de muebles o cerca de electrodomésticos.', 'Conecta por cable los equipos que necesitan máxima estabilidad.', 'Reinicia el router solo cuando sea necesario y revisa primero las luces indicadoras.'],
  },
  {
    id: 'atencion',
    categoria: 'GuajiraNet',
    fecha: '28 julio 2026',
    titulo: 'Atención local, tecnología para todos',
    resumen: 'Estamos cerca para ayudarte con instalación, soporte, facturación y orientación.',
    imagen: '/noticias/atencion-local.png',
    detalle: 'Nuestra atención combina herramientas digitales con acompañamiento humano. Queremos que cada solicitud tenga una respuesta clara y un canal sencillo para continuar.',
    consejos: ['Escríbenos por WhatsApp para una orientación rápida.', 'Ten a la mano tu número de contrato si necesitas soporte.', 'Consulta el portal de pagos para realizar tu trámite en línea.'],
  },
]

export default function Page() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [noticiaAbierta, setNoticiaAbierta] = useState<string | null>(null)
  const noticiaActiva = noticias.find((noticia) => noticia.id === noticiaAbierta)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Intro />
      <BarraProgreso />
      <Revelador />

      <div className="topbar">
        <div className="container flex items-center justify-between">
          <span>Internet que conecta a La Guajira</span>
          <span className="hidden sm:inline">Lunes a sábado · 7:00 a.m. — 12:00 m. y 2:00 — 6:00 p.m.</span>
        </div>
      </div>

      <NavegacionPrincipal pagoHref={PAGO} />

      <Metricas />

      <PlanesCarrusel />

      <section id="beneficios" className="benefits">
        <div className="container benefits-grid">
          <div data-revelar="izq">
            <div className="eyebrow eyebrow-light">La diferencia GuajiraNet</div>
            <h2>Más que internet.<br /><span>Una conexión de verdad.</span></h2>
            <p>Somos de aquí. Por eso entendemos lo que necesitas y estamos cerca cuando nos necesitas.</p>
            <a className="button button-yellow" href="#contacto">Conoce nuestros servicios <ArrowRight size={17} /></a>
          </div>
          <div className="benefit-list">
            <div data-revelar="der"><ShieldCheck /><span><strong>Conexión estable</strong><small>Para tus clases, reuniones y entretenimiento sin interrupciones.</small></span></div>
            <div data-revelar="der" data-delay="120"><Headphones /><span><strong>Soporte humano</strong><small>Hablas con personas reales que conocen tu zona.</small></span></div>
            <div data-revelar="der" data-delay="240"><MessageCircle /><span><strong>Atención por WhatsApp</strong><small>Resolvemos tus dudas por el canal que ya utilizas.</small></span></div>
          </div>
        </div>
        <FibraBanner />
      </section>

      <section id="pasos" className="section pasos">
        <div className="container">
          <div className="section-heading">
            <div data-revelar="izq"><div className="eyebrow">Instalar es fácil</div><h2>De la consulta al WiFi<br />en tres pasos.</h2></div>
            <p data-revelar="der">Sin filas, sin papeleo interminable.<br />Nosotros nos encargamos.</p>
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

      <SliderMensajes />

      <Clientes />

      <section id="pago-factura" className="pago-factura">
        <div className="container pago-factura-inner">
          <div className="pago-factura-copy" data-revelar="izq">
            <div className="eyebrow eyebrow-light">Paga fácil y seguro</div>
            <h2>Tu factura,<br /><span>a un clic.</span></h2>
            <p>Consulta y paga tu factura GuajiraNet en línea desde el portal de pagos. Es rápido, práctico y está disponible cuando lo necesites.</p>
            <a className="button button-pay pago-factura-cta" href={PAGO} target="_blank" rel="noreferrer"><CreditCard size={19} /> Pagar factura <ArrowRight size={17} /></a>
          </div>
          <div className="pago-factura-card" data-revelar="der">
            <span className="pago-factura-icon"><CreditCard size={25} /></span>
            <strong>Portal de pagos</strong>
            <span>Realiza tu pago de forma segura y continúa disfrutando tu conexión.</span>
            <a href={PAGO} target="_blank" rel="noreferrer">Ingresar al portal <ArrowRight size={15} /></a>
          </div>
        </div>
      </section>

      <Autogestion />

      <section id="faq" className="section faq">
        <div className="container faq-grid">
          <div data-revelar="izq">
            <div className="eyebrow">Resolvemos tus dudas</div>
            <h2>Preguntas<br />frecuentes.</h2>
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

      <section id="noticias" className="section news">
        <div className="container">
          <div className="section-heading">
            <div data-revelar="izq"><div className="eyebrow">Actualidad GuajiraNet</div><h2>Noticias que te mantienen conectado.</h2></div>
          </div>
          <div className="news-grid">
            {noticias.map((noticia, index) => (
              <article className={index === 0 ? 'news-feature' : `news-card ${index === 2 ? 'yellow-card' : ''}`} data-revelar data-delay={index ? `${index * 120}` : undefined} key={noticia.id}>
                <div className={`news-image ${index === 2 ? 'news-image-branded' : ''}`}>
                  {index === 2 && <img className="news-logo-watermark" src="/logo-guajiranet.png" alt="" aria-hidden="true" />}
                  <img className="news-card-photo" src={noticia.imagen} alt="" loading="lazy" />
                </div>
                <div className="news-body">
                  <span>{noticia.categoria} · {noticia.fecha}</span>
                  <h3>{noticia.titulo}</h3>
                  <p>{noticia.resumen}</p>
                  <button className="news-more" type="button" onClick={() => setNoticiaAbierta(noticia.id)}>{index === 0 ? 'Leer noticia' : 'Conocer más'} <ArrowRight size={16} /></button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="legal" className="legal-strip">
        <div className="container">
          <div data-revelar="izq"><div className="eyebrow">Transparencia y confianza</div><h2>Marco legal</h2></div>
          <div className="legal-links" data-revelar="der">
            <a href="#legal">Términos y condiciones <ArrowRight size={15} /></a>
            <a href="#legal">Política de privacidad <ArrowRight size={15} /></a>
            <a href="#legal">PQR y reclamos <ArrowRight size={15} /></a>
          </div>
        </div>
      </section>

      <section id="contacto" className="contact">
        <div className="container contact-inner">
          <div data-revelar="izq"><div className="eyebrow eyebrow-light">¿Listo para conectarte?</div><h2>Hablemos de tu<br />próxima conexión.</h2></div>
          <a className="button button-yellow" href={WHATSAPP} target="_blank" rel="noreferrer" data-revelar="der">Escribir por WhatsApp <ArrowRight size={17} /></a>
        </div>
      </section>

      <section id="contactos" className="contact-details">
        <div className="container contact-details-grid">
          <div data-revelar="izq">
            <div className="eyebrow">Estamos para ayudarte</div>
            <h2>Conversemos.</h2>
            <p>Encuentra atención cercana para instalación, soporte y facturación.</p>
          </div>
          <div className="contact-options" data-revelar="der">
            <a href="tel:+573009139909"><Phone size={20} /><span><small>Llámanos</small><strong>+57 300 913 9909</strong></span></a>
            <a id="correo" href="mailto:info@guajiranet.com"><Mail size={20} /><span><small>Escríbenos</small><strong>info@guajiranet.com</strong></span></a>
          </div>
        </div>
      </section>

      <footer id="pagar">
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
              <li className="footer-dato"><MapPin size={15} /> Albania, Cra 4 #4-96, Barrio El Centro — La Guajira</li>
              <li><a className="footer-dato" href="mailto:info@guajiranet.com"><Mail size={15} /> info@guajiranet.com</a></li>
              <li><a className="footer-dato" href="tel:+573009139909"><Phone size={15} /> +57 300 913 9909</a></li>
              <li className="footer-dato"><Clock size={15} /> Lunes a sábado<br />7:00 a.m. — 12:00 m.<br />2:00 — 6:00 p.m.</li>
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
            <a href="#legal">Política de privacidad</a>
            <a href="https://www.guajiranet.com/presentar-un-pqrs/" target="_blank" rel="noreferrer">PQRS</a>
            <a href="https://www.guajiranet.com/tu-seguridad/" target="_blank" rel="noreferrer">Tu seguridad</a>
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
            <a className="button button-primary" href={noticiaActiva.id === 'wifi' ? '#faq' : '#contactos'} onClick={() => setNoticiaAbierta(null)}>Continuar en GuajiraNet <ArrowRight size={16} /></a>
          </div>
        )}
      </Modal>

      <AccionesFlotantes />
    </main>
  )
}
