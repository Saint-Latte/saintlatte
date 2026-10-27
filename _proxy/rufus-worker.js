/**
 * Cloudflare Worker — Reporte Rufus/Toast (Saint Latte)
 *
 * Este worker es el ÚNICO lugar donde vive la API key de Polotab.
 * Nunca la pongas en este archivo ni en ningún archivo del repo: se configura
 * como "Secret" en el dashboard de Cloudflare, después de desplegar.
 *
 * DESPLIEGUE (una sola vez):
 * 1. https://dash.cloudflare.com → Workers & Pages → "Create" → "Create Worker"
 * 2. Ponle un nombre, ej. "rufus-report" → Deploy (con el código de ejemplo)
 * 3. "Edit code" → borra todo → pega este archivo completo → Deploy
 * 4. Settings → Variables and Secrets → Add:
 *      POLOTAB_API_KEY        (Secret) = tu api key de Polotab
 *      POLOTAB_RESTAURANT_ID  (Secret) = fc96e2d0-1b34-4cfb-8507-68ce7e751951
 *      REPORT_PASSWORD        (Secret) = una clave que tú inventes (no la API key)
 *    Save and deploy.
 * 5. Copia la URL pública del worker (ej. rufus-report.aldo-leon-h.workers.dev)
 *    y pégala como WORKER_URL en reporte-rufus.html.
 *
 * Uso: GET /?date=YYYY-MM-DD   con header  X-Report-Key: <REPORT_PASSWORD>
 * Devuelve las órdenes completadas de ese día (zona horaria fija -06:00),
 * ya hidratadas con sus items y pagos. El filtro Rufus/Toast y el ajuste de
 * 35% viven en el navegador (reporte-rufus.html) — aquí solo se protege la key.
 */

const BASE_URL = 'https://api.polotab.com'

// Restringe qué sitios pueden llamar a este worker desde el navegador.
const ALLOWED_ORIGINS = new Set([
  'https://www.saintlatte.com',
  'https://saintlatte.com',
])

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : 'https://www.saintlatte.com'
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Report-Key',
    'Access-Control-Max-Age': '86400',
  }
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  })
}

async function getToken(env) {
  const res = await fetch(`${BASE_URL}/auth/v1/restaurants/token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.POLOTAB_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ restaurantId: env.POLOTAB_RESTAURANT_ID }),
  })
  if (!res.ok) throw new Error(`Auth Polotab falló (HTTP ${res.status})`)
  const data = await res.json()
  const token = data.token ?? data.restaurantToken
  if (!token) throw new Error('Polotab no devolvió token')
  return token
}

async function polotabGet(path, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Polotab ${path} → HTTP ${res.status}`)
  return res.json()
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? ''
    const cors = corsHeaders(origin)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    if (request.method !== 'GET') {
      return json({ error: 'Método no permitido' }, 405, cors)
    }

    if (!env.REPORT_PASSWORD || request.headers.get('X-Report-Key') !== env.REPORT_PASSWORD) {
      return json({ error: 'No autorizado' }, 401, cors)
    }

    const url = new URL(request.url)
    const date = url.searchParams.get('date')
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json({ error: 'Falta ?date=YYYY-MM-DD' }, 400, cors)
    }

    try {
      const token = await getToken(env)

      const from = `${date}T00:00:00.000-06:00`
      const to = `${date}T23:59:59.999-06:00`
      const q = new URLSearchParams({ from, to, status: 'completed', limit: '500' })
      const list = await polotabGet(`/orders/v1/orders?${q}`, token)

      // Un subrequest por orden para hidratar items + pagos. El plan gratis de
      // Workers permite 50 subrequests por invocación, por eso el front-end
      // consulta día por día en vez de pedir rangos largos de una sola vez.
      const settled = await Promise.allSettled(
        (list ?? []).map((o) => polotabGet(`/orders/v1/orders/${o.id}`, token))
      )

      const orders = []
      let fallidas = 0
      for (const r of settled) {
        if (r.status === 'fulfilled') orders.push(r.value)
        else fallidas++
      }

      // El endpoint de Polotab no siempre respeta from/to de forma estricta
      // (a veces devuelve órdenes de otras fechas). Filtramos aquí por el
      // día exacto solicitado, comparando la fecha local (-06:00) tal cual
      // la manda Polotab en createdAt, para que nunca se cuele otro día.
      const delDia = orders.filter((o) => typeof o.createdAt === 'string' && o.createdAt.slice(0, 10) === date)

      return json({ date, orders: delDia, fallidas }, 200, cors)
    } catch (err) {
      return json({ error: err.message ?? 'Error interno' }, 500, cors)
    }
  },
}
