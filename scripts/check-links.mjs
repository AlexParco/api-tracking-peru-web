/*
 * Verifica que ningún enlace interno del sitio compilado apunte a la nada.
 *
 * ── Por qué existe ──
 *
 * `astro check` revisa tipos, no destinos: un `href="/#covertura"` compila
 * perfecto y falla en silencio para el visitante. Y este sitio es especialmente
 * sensible a eso porque casi toda la navegación es por ancla dentro de la
 * portada (`#cobertura`, `#empezar`, `/docs#errores`), no por rutas. Un ancla
 * mal escrita no rompe nada visible al construir: simplemente no scrollea.
 *
 * Ya pasó una vez, y de la peor forma: durante el pase de código a inglés se
 * tradujo un id de HTML que era un string literal (`agencias` → `agencies`), y
 * el `getElementById` quedó devolviendo null. No lo atrapó el compilador; lo
 * atrapó una auditoría manual contra el HTML compilado. Esto es esa auditoría,
 * automatizada y corriendo antes de cada deploy.
 *
 * ── Qué revisa, y qué no ──
 *
 * Sólo enlaces internos: rutas del sitio y anclas. Los externos no se tocan a
 * propósito — depender de la red de terceros para desplegar convierte un deploy
 * en una lotería, y un dominio caído ajeno no es motivo para no publicar.
 *
 * Corre sobre `dist/`, no sobre el código fuente: lo que importa es lo que
 * recibe el navegador, incluidas las páginas generadas por `getStaticPaths`.
 */

import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const DIST = new URL('../dist/', import.meta.url).pathname

/** Todos los .html de dist/, recursivo. */
async function htmlFiles(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await htmlFiles(full)))
    else if (entry.name.endsWith('.html')) out.push(full)
  }
  return out
}

/*
 * La ruta pública de un archivo. `astro.config.mjs` usa
 * `format: 'directory'` + `trailingSlash: 'never'`, así que
 * `dist/docs/index.html` se sirve como `/docs`, sin barra final.
 */
const routeOf = (file) => {
  const rel = relative(DIST, file).replaceAll('\\', '/')
  if (rel === 'index.html') return '/'
  return '/' + rel.replace(/\/index\.html$/, '').replace(/\.html$/, '')
}

const files = await htmlFiles(DIST)
if (files.length === 0) {
  console.error('No hay HTML en dist/. ¿Se corrió `npm run build` antes?')
  process.exit(1)
}

/* Primero se indexa todo, y recién después se valida. Al revés no se puede:
   una página enlaza a otra que quizá todavía no se leyó. */
const pages = new Map() // ruta → Set de ids
const links = [] // { desde, href }

for (const file of files) {
  const crudo = await readFile(file, 'utf-8')
  const route = routeOf(file)

  /* Se quitan `<script>` y `<style>` antes de mirar nada.
     Dentro de los scripts inline hay plantillas que ARMAN marcado en el
     navegador (los resultados del buscador de /docs, las tarjetas de agencias),
     y ahí un `href="#${'${'}...}"` es código sin evaluar, no un enlace roto —
     este verificador lo reportó en su primera corrida.

     Se quitan para AMBAS pasadas, hrefs e ids, y eso es lo que lo hace
     correcto: esos enlaces dinámicos apuntan a ids que también son dinámicos.
     Descartar sólo una de las dos mitades convertiría el falso positivo en un
     falso negativo. */
  const html = crudo
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')

  const ids = new Set()
  for (const m of html.matchAll(/\sid=["']([^"']+)["']/g)) ids.add(m[1])
  /* `name` en un `<a>` también es un destino válido de ancla, y algunos
     generadores de índices lo usan en vez de `id`. */
  for (const m of html.matchAll(/<a[^>]+\sname=["']([^"']+)["']/g)) ids.add(m[1])
  pages.set(route, ids)

  for (const m of html.matchAll(/\shref=["']([^"']+)["']/g)) {
    links.push({ desde: route, href: m[1] })
  }
}

const errores = []

for (const { desde, href } of links) {
  // Externos, correos, teléfonos y data URIs: fuera de alcance a propósito.
  if (/^(https?:|mailto:|tel:|data:|\/\/)/i.test(href)) continue

  const [rutaCruda, ancla] = href.split('#')
  // `href="#algo"` es un ancla en la misma página.
  const ruta = rutaCruda === '' ? desde : rutaCruda.replace(/\/$/, '') || '/'

  // Relativos: el sitio no los usa, y si aparece uno es más probable que sea
  // un error que una decisión. Se avisa en vez de resolverlo en silencio.
  if (!ruta.startsWith('/')) {
    errores.push(`${desde} → "${href}" (enlace relativo; usa una ruta absoluta)`)
    continue
  }

  const ids = pages.get(ruta)
  if (ids === undefined) {
    /* Puede ser un archivo estático servido desde public/ (og.png,
       favicon.svg…). Sólo se reclama si parece una ruta de página. */
    if (!/\.[a-z0-9]{2,5}$/i.test(ruta)) {
      errores.push(`${desde} → "${href}" (esa página no existe en dist/)`)
    }
    continue
  }

  // `#` a secas y `#top` los resuelve el navegador solo: van al inicio.
  if (ancla && ancla !== 'top' && !ids.has(ancla)) {
    errores.push(`${desde} → "${href}" (no hay ningún id="${ancla}" en ${ruta})`)
  }
}

if (errores.length > 0) {
  console.error(`\n${errores.length} enlace(s) interno(s) roto(s):\n`)
  for (const e of errores) console.error(`  · ${e}`)
  console.error('')
  process.exit(1)
}

console.log(`✓ ${links.length} enlaces revisados en ${files.length} páginas, ninguno roto.`)
