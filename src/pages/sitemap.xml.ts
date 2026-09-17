import type { APIRoute } from 'astro'
import { PUBLISHED_CARRIERS, CATALOGS } from '../data/api.ts'
import { COMPLETA, VIGENCIA } from '../data/legal.ts'

/* El sitemap, escrito a mano en vez de con `@astrojs/sitemap`.
 *
 * Son ocho URLs derivadas de una constante: la integración traería quince
 * dependencias para generar lo mismo. Si algún día hay contenido dinámico o
 * cientos de páginas, conviene cambiarlo — hoy no.
 *
 * Las rutas salen de `PUBLISHED_CARRIERS`, la misma fuente que genera las
 * páginas, así que no puede listar una que no exista ni omitir una que sí.
 *
 * ── Por qué no hay `changefreq` ni `priority` ──
 *
 * Los tenía, y no servían para nada: Google dijo explícitamente que ignora los
 * dos. `priority` además sólo es relativo dentro del propio sitio, así que
 * declarar que la portada vale 1.0 y una página de courier 0.7 no le dice nada a
 * nadie. Ocupaban dos líneas por URL para no informar.
 *
 * ── Por qué `lastmod` no está en todas ──
 *
 * `lastmod` sí lo usa, pero sólo mientras sea confiable: si las ocho URLs
 * cambian de fecha en cada deploy, Google aprende a ignorarlo y se pierde la
 * señal para siempre. Así que va únicamente donde hay una fecha REAL que
 * respalde el cambio, y esa fecha existe para las páginas que se arman con el
 * catálogo: `meta.sources[].synced_at` dice cuándo se sincronizó el de cada
 * carrier, y es exactamente lo que cambia su contenido.
 *
 * `/docs` se queda sin `lastmod` a propósito. Su contenido sale de `api.ts`, que
 * se edita a mano, y la fecha de ese cambio vive en el historial de git — que no
 * está dentro de la imagen, porque el `.dockerignore` excluye `.git`. La otra
 * opción sería la fecha del build, que es la misma para todo y en cada deploy:
 * justamente la que enseña a Google a desconfiar. Mejor no declarar nada que
 * declarar algo que no es cierto.
 */
export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL('https://tracking-peru.com')).origin

  const sincronizados = PUBLISHED_CARRIERS.map((c) => CATALOGS[c.id]?.syncedAt).filter(
    (d): d is string => !!d,
  )
  /* La portada y el índice muestran los cinco catálogos a la vez —el contador de
     agencias, la matriz de cobertura, la tabla comparativa—, así que su fecha es
     la del último que se sincronizó. */
  const ultimo = sincronizados.length ? sincronizados.sort().at(-1) : undefined

  const urls: { path: string; lastmod?: string }[] = [
    { path: '/', lastmod: ultimo },
    { path: '/docs' },
    /* Los dos documentos legales entran sólo cuando hay un responsable
       identificable. Mientras falte se sirven como borrador con `noindex`, y
       listarlos acá sería pedirle a Google que indexe justo lo que le estamos
       prohibiendo. Su `lastmod` es la fecha de vigencia: un documento legal
       cambia cuando alguien lo cambia, no cuando se recompila el sitio. */
    ...(COMPLETA ? [{ path: '/privacy', lastmod: VIGENCIA }, { path: '/terms', lastmod: VIGENCIA }] : []),
    { path: '/couriers', lastmod: ultimo },
    ...PUBLISHED_CARRIERS.map((c) => ({
      path: `/couriers/${c.id}`,
      lastmod: CATALOGS[c.id]?.syncedAt ?? undefined,
    })),
  ]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${base}${u.path}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`,
  )
  .join('\n')}
</urlset>
`
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } })
}
