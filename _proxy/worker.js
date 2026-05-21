/**
 * Cloudflare Worker — Polotab CORS Proxy
 * Despliega esto en https://workers.cloudflare.com (cuenta gratis)
 *
 * PASOS:
 * 1. Ve a https://workers.cloudflare.com → crear cuenta gratis
 * 2. "Create a Worker" → pega este código → Deploy
 * 3. Copia la URL del worker (ej: polotab-proxy.TU-USUARIO.workers.dev)
 * 4. Pégala en el campo "Proxy URL" del Comandero al hacer login
 *
 * Límite gratuito: 100,000 peticiones/día — más que suficiente.
 */

const TARGET = 'https://api.polotab.com'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age':       '86400',
}

export default {
  async fetch(request) {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS })
    }

    const url    = new URL(request.url)
    const target = TARGET + url.pathname + url.search

    let body = undefined
    if (!['GET', 'HEAD'].includes(request.method)) {
      body = await request.arrayBuffer()
    }

    const proxied = await fetch(target, {
      method:  request.method,
      headers: request.headers,
      body,
    })

    const response = new Response(proxied.body, {
      status:     proxied.status,
      statusText: proxied.statusText,
      headers:    proxied.headers,
    })

    Object.entries(CORS).forEach(([k, v]) => response.headers.set(k, v))
    return response
  }
}
