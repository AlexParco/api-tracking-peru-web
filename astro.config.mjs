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
  },

  // Precarga al pasar el cursor. Son dos páginas y una docs pesada: el salto a
  // /docs se siente instantáneo sin costar nada a quien no va para allá.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },

  vite: { plugins: [tailwindcss()] },
})
