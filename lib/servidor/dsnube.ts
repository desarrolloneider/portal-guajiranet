// SOLO SERVIDOR. Consulta datos del cliente en DS Nube; el usuario y la clave nunca llegan al navegador.

if (typeof window !== 'undefined') throw new Error('dsnube solo se puede usar en el servidor')

export type ClienteDsNube = { email: string | null }

function config() {
  const url = process.env.DSNUBE_URL || 'https://ds.dsnube.co/apiv2/v1'
  const usuario = process.env.DSNUBE_USUARIO
  const clave = process.env.DSNUBE_CLAVE
  if (!usuario || !clave) throw new Error('Faltan DSNUBE_USUARIO o DSNUBE_CLAVE en el .env.local del servidor')
  return { url: url.replace(/\/+$/, ''), auth: Buffer.from(`${usuario}:${clave}`).toString('base64') }
}

/** Busca al cliente por cédula. Devuelve null si DS Nube no lo encuentra. */
export async function consultarCliente(cedula: string): Promise<ClienteDsNube | null> {
  const { url, auth } = config()
  const r = await fetch(`${url}/clientewispro/${encodeURIComponent(cedula)}`, {
    headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  })
  if (r.status === 404) return null
  if (!r.ok) throw new Error(`DS Nube respondió ${r.status} al consultar el cliente`)
  const datos = (await r.json().catch(() => null)) as Record<string, unknown> | null
  if (!datos || datos.success !== true) return null
  const email = String(datos.email ?? '').trim()
  return { email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null }
}
