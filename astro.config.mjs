// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

// Sitio 100 % estático: no hay backend acá. La landing sólo documenta y enlaza
// al API, que vive en otro repo (../tracking-peru) y en otro host.
export default defineConfig({
  site: 'https://rastreo.dev',
  vite: { plugins: [tailwindcss()] },
})
