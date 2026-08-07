// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

// Sitio 100 % estático: no hay backend acá. La landing sólo documenta y enlaza
// al API, que vive en otro repo (../api-tracking-peru) y en otro host.
export default defineConfig({
  site: 'https://tracking-peru.com',

  // Sin barra final. Con `always` (o con `ignore`, que deja pasar las dos), la
  // misma página responde en `/docs` y en `/docs/`: dos URLs con el mismo
  // contenido, que es contenido duplicado para un buscador. El canonical lo
  // salvaría, pero es mejor que no exista la ambigüedad.
  trailingSlash: 'never',

  build: {
    // `/docs/index.html` en vez de `/docs.html`: sirve igual en cualquier host
    // estático sin reglas de reescritura.
    format: 'directory',
    // El CSS va inline si es más chico que esto. En umbral 0 (por defecto)
    // siempre es un request aparte que bloquea el pintado.
    inlineStylesheets: 'auto',
    // El directorio de assets se llama `_astro` por defecto, y ese nombre viaja
    // en la URL de cada hoja de estilo y cada script de todas las páginas. Con
    // qué herramienta se construyó el sitio no es información del sitio.
    assets: 'estaticos',
  },

  // SIN precarga, y por dos motivos que apuntan igual.
  //
  // `prefetch` es la única cosa del sitio que produce un bundle de JavaScript:
  // 2.485 bytes que se descargan en las ocho páginas y que además son el último
  // lugar donde aparecía el nombre del framework (`astro:page-load`,
  // `astroPrefetch`). Y dos comentarios del código —en `Reticle.astro` y en
  // `Base.astro`— afirmaban que la landing no sirve ni un bundle: con esto
  // vuelven a ser ciertos en vez de tener que corregirlos.
  //
  // Lo que se pierde es que el salto a /docs se sienta instantáneo al pasar el
  // cursor. Con ocho páginas estáticas, CSS en línea y hosting propio, eso son
  // unas décimas; si algún día pesa, se vuelve a encender con una línea.

  vite: { plugins: [tailwindcss()] },
})
