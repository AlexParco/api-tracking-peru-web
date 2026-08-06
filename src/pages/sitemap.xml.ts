import type { APIRoute } from 'astro'
import { PUBLISHED_CARRIERS } from '../data/api.ts'

/* El sitemap, escrito a mano en vez de con `@astrojs/sitemap`.
 *
 * Son siete URLs derivadas de una constante: la integración traería quince
 * dependencias para generar lo mismo. Si algún día hay contenido dinámico o
 * cientos de páginas, conviene cambiarlo — hoy no.
 *
 * Las rutas salen de `PUBLISHED_CARRIERS`, la misma fuente que genera las
 * páginas, así que no puede listar una que no exista ni omitir una que sí. */
export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL('https://tracking-peru.com')).origin
  const urls = ['/', '/docs', ...PUBLISHED_CARRIERS.map((c) => `/couriers/${c.id}`)]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${base}${u}</loc>
    <changefreq>weekly</changefreq>
    <priority>${u === '/' ? '1.0' : u === '/docs' ? '0.8' : '0.7'}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } })
}
