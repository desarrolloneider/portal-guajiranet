# Correcciones del portal GuajiraNet (octubre 2026)

Este zip es el proyecto completo con todas las correcciones aplicadas. La portada (primera sección) no se tocó.

## 1. Qué cambió

1. **Menú superior**: el logo es más grande (se lee "TELECOMUNICACIONES") y los textos Planes, Cobertura, Beneficios, Resuelve en minutos y Más pasaron de 12 a 15 px.
2. **Colores**: la paleta Grafito y Ámbar reemplaza el azul en todas las secciones menos la portada (planes, mapa, noticias, beneficios, pasos, autogestión, marco legal, contacto, pie de página, ventanas y formularios).
3. **Mapa**:
   - El país quedó en un ámbar claro. Las fibras siguen blancas, con un borde gris fino para que se vean sobre el fondo claro.
   - Los cables submarinos tienen color y país propio: Panamá (Cartagena), Estados Unidos (Barranquilla) y Curazao (Riohacha). La leyenda los muestra.
   - Mapa de calor con las 22 zonas reales de cobertura del ERP. La intensidad del color depende de los clientes de cada zona, pero el número de clientes no se publica.
   - Los municipios de La Guajira sin cobertura se ven en gris.
4. **Consulta de cobertura**:
   - Se puede buscar por municipio, corregimiento, barrio o dirección, o con el botón "usar mi ubicación".
   - Usa la misma regla del ERP: dentro de la zona hay cobertura; a menos de 100 m es probable; más lejos no hay.
   - Solo dice que hay cobertura donde el archivo de zonas lo confirma. También se corrigieron el buscador de la portada, la cifra "Municipios con cobertura" y la pregunta frecuente.
5. **Cambio de clave WiFi real**: el formulario ahora cambia la clave a través de isp-api. La API key queda solo en el servidor (ver sección 3).
6. **Requisitos legales que ya se pudieron poner**:
   - Banner del Régimen de Protección de Usuarios de la CRC arriba del pie de página.
   - Ventana "Internet sano · Ley 679 de 2001".
   - Ventana "Seguridad de la red", con el texto que estaba en la web vieja.
7. Los enlaces de abajo del pie de página (Términos, Política de privacidad, PQRS, Tu seguridad) ya se ven.

## 2. Archivos

Nuevos:

- `app/api/cambio-clave/route.ts`: ruta de servidor que habla con isp-api.
- `lib/servidor/isp-api.ts`: cliente de isp-api (solo servidor).
- `lib/cobertura-zonas.ts`: zonas de cobertura (archivo generado).
- `lib/cobertura-geo.ts`: regla de cobertura y búsqueda de direcciones.
- `components/info-legal.tsx`: banner de la CRC, Internet sano y Seguridad de la red.
- `scripts/actualizar-cobertura.mjs`: actualiza las zonas desde el ERP.
- `env.ejemplo.txt`: variables que necesita el servidor.

Modificados: `app/escena.css`, `app/globals.css`, `app/page.tsx`, `components/autogestion.tsx`, `components/cobertura.tsx`, `components/fibra-banner.tsx`, `components/hero-cobertura.tsx` (solo la lógica y los textos del resultado; el diseño no cambió), `components/mapa-nacional.tsx`, `components/metricas.tsx`, `components/planes-selector.tsx`, `lib/cobertura.ts`, `lib/red-nacional.ts`.

## 3. Pasos para probar en tu PC (Git Bash)

1. Descomprime el zip y abre Git Bash dentro de la carpeta `portal-guajiranet-main`.
2. Instala dependencias: `pnpm install`
3. Copia el archivo de variables: `cp env.ejemplo.txt .env.local`
4. Abre `.env.local` con tu editor y llena los valores (explicados en la sección 4). Sin estos valores la página funciona igual; solo el cambio de clave responde "no pudimos comunicarnos con el sistema".
5. Arranca en modo desarrollo: `pnpm dev`
6. Abre http://localhost:3000 en el navegador.

## 4. Configurar el cambio de clave (servidor)

La API key **no** va en el navegador. Va en el archivo `.env.local` del servidor donde corre la web. Next.js solo manda al navegador las variables que empiezan por `NEXT_PUBLIC_`, y estas no lo llevan. El `.gitignore` ya excluye los `.env*`, así que tampoco se suben al repositorio.

1. **Crear una API key solo para la web** (recomendado, para poder revocarla sin afectar el bot). Desde Git Bash, cambiando `URL_DE_ISP_API` y `TU_ADMIN_MASTER` por los valores reales:

   ```
   curl -X POST "URL_DE_ISP_API/api/v1/admin/api-keys" -H "Content-Type: application/json" -H "x-api-key: UNA_API_KEY_ACTIVA" -H "x-admin-key: TU_ADMIN_MASTER" -d '{"nombre":"Portal web","permisos":{"methods":["GET","POST","PUT"]}}'
   ```

   La respuesta trae la key nueva en `apiKey`. Va el header `x-api-key` porque isp-api pide una key válida en todas sus rutas, incluidas las de administración.

2. **Llenar `.env.local`:**
   - `ISP_API_URL`: dirección de isp-api, sin `/api/v1` al final.
   - `ISP_API_KEY`: la key del paso 1.
   - `ISP_API_CA_PATH`: solo si el certificado de isp-api es autofirmado. Copia `ssl/server.crt` de isp-api al servidor de la web y pon aquí su ruta. La verificación de seguridad nunca se desactiva.
   - `CAMBIO_CLAVE_VERIFICAR_CELULAR`: `si` (por defecto) exige que el celular coincida con el registrado. `no` lo desactiva.
3. Reinicia la web para que tome las variables.

Qué hace la ruta, en simple:

1. Verifica la cédula y el celular.
2. Busca los equipos de esa cédula.
3. Pide el cambio a isp-api.
4. Muestra el resultado.

El serial del equipo nunca viene del navegador: siempre sale de los equipos de la cédula. Además limita los intentos por IP: 10 verificaciones cada 15 minutos y 5 cambios por hora. En los registros de isp-api, la IP que aparece es la del servidor de la web.

## 5. Fotos de Noticias

Pon las tres fotos nuevas en `public/noticias/` con estos nombres exactos: `expansion-red.jpg`, `wifi-en-casa.jpg` y `atencion-local.jpg`. Hasta que estén, esas noticias se ven sin foto. Las `.png` viejas siguen en la carpeta como respaldo.

## 6. Actualizar las zonas de cobertura

Cuando el ERP tenga zonas nuevas:

1. Abre Git Bash en la carpeta del proyecto.
2. Corre (cambiando la ruta por la del archivo del ERP): `node scripts/actualizar-cobertura.mjs ruta/al/coberturaZonas.ts`
3. El script reescribe `lib/cobertura-zonas.ts` y muestra las zonas que encontró. El mapa, el buscador, la cifra de municipios y la pregunta frecuente se actualizan solos.

El script solo usa Node; no necesita Python.

## 7. Pendientes (no se tocaron)

1. **Clientes y entidades**: la cinta de logos queda igual hasta que confirmen cuáles son reales.
2. **Requisitos legales en pausa**:
   - velocidad de subida y de bajada de cada plan,
   - controles parentales,
   - indicadores de calidad,
   - prácticas de gestión de tráfico,
   - contrato,
   - política de tratamiento de datos (los enlaces "Términos y condiciones" y "Política de privacidad" siguen sin destino).
3. **PQR**: el formulario sigue generando un número propio y no guarda la solicitud. La norma exige CUN.
4. **Pagar factura**: el enlace de DSNube lleva un `+` en el código de empresa. Hay que confirmar en las pruebas que abre bien.
5. **Enlaces a la web vieja (WordPress)**: la página de PQRS y los PDF de leyes y resoluciones se romperán cuando la web nueva reemplace a WordPress.
6. **Planes**: la web vieja muestra los mismos precios con 20 a 150 MB y la nueva con 150 a 700 megas. Hay que confirmar cuál es la oferta vigente.
7. **isp-api (fuera de la web)**: `change-wifi-password`, `change-wifi-ssid`, `configure-wifi` y `reboot-device` no comprueban que el serial pertenezca a la cédula. Además, `GET /devices` y `GET /test/cedula/:ced` exponen datos de clientes con solo la API key.
