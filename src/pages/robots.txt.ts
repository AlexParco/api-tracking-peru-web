import type { APIRoute } from 'astro'

/* Sin `robots.txt` un buscador igual indexa, pero no sabe dónde está el sitemap
   y lo descubre sólo si le mandás el enlace a mano. Son cuatro líneas. */
export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL('https://tracking-peru.com')).origin
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
