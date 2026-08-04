# api-tracking-peru-web

Landing pública del API de rastreo y agencias de couriers peruanos. Sitio
estático en Astro; no tiene backend ni consume nada en tiempo de build.

El API vive en otro repo: [`tracking-peru`](../tracking-peru), que todavía no
está publicado. Este repo es **sólo la web**: acá no hay ni una credencial ni una
llamada al API, y no debería haberlas nunca — todo lo que se muestra es estático
y sale de `src/data/api.ts`.

## Comandos

```bash
pnpm install
pnpm dev      # servidor de desarrollo
pnpm build    # genera dist/
pnpm preview  # sirve dist/ para revisar el build
pnpm check    # astro check (tipos y templates)
```

## Stack

Astro 7 · Tailwind 4 (plugin de Vite, sin archivo de config) · TypeScript.
Fuentes por `@fontsource-variable`: Space Grotesk y JetBrains Mono, las mismas
que la otra landing del workspace.

**TypeScript está pineado a 6.x a propósito.** `astro check` usa una API
programática que el compilador nativo de TS 7 todavía no expone; con 7.x el
comando falla al arrancar. Cuando Astro lo soporte, se puede subir.

**`pnpm-workspace.yaml` existe sólo para `allowBuilds`.** pnpm 11 bloquea los
scripts de post-install por default —son ejecución arbitraria de código al
instalar— y aborta hasta que alguien decide explícitamente. esbuild los necesita
para bajar su binario, y sin eso `pnpm build` falla.

## Cómo mantenerla honesta

`src/data/api.ts` es la fuente única de verdad de la página: el estado por
carrier, los conteos de agencias y los ejemplos de respuesta.

**Regla: todo lo de ese archivo tiene que ser cierto contra el API real.** Los
números salen de una corrida verificada y el estado por carrier espeja el campo
`verified` que el propio API publica en `GET /v1/carriers`. Si la landing y la
API dicen cosas distintas, el que miente es el archivo — y el primer `curl` de
un cliente lo desmiente.

Esto importa más que de costumbre acá: hoy el **rastreo funciona en un solo
carrier** y los otros devuelven un `501` documentado. La tabla de cobertura dice
exactamente eso, con el motivo de cada uno. Prometer siete couriers sería vender
algo que el producto no hace, justo en un producto cuyo diferencial es publicar
cuánta evidencia respalda cada integración.

Cuando cambie el estado real del API, se actualiza `src/data/api.ts` y se rehace
el build. Ningún dato de estado vive dentro de un componente.

## Pendiente

- **El dominio no está decidido.** Todo apunta a `rastreo.dev`, pero es una
  recomendación, no una compra. Son **siete referencias en seis archivos** —el
  README decía cuatro y estaba mal—, así que si se elige otro hay que tocar:

  ```
  astro.config.mjs           site
  src/layouts/Base.astro     el fallback de canonical
  src/pages/index.astro      el <title>
  src/components/Nav.astro   el logotipo (parte "rastreo" + ".dev")
  src/components/Hero.astro  el host del ejemplo (api.rastreo.dev)
  src/components/Cierre.astro  el mailto, el texto del mail y el ©
  ```

  Ojo con el del nav: está partido por un `<span>` (`rastreo<span>.dev</span>`),
  así que **ningún grep de `rastreo.dev` lo encuentra**. Buscar la cadena
  completa devuelve seis de las siete y da la sensación de estar completo.
- **Falta `og:image`, y encima `twitter:card` es `summary_large_image`.** Las
  metas `og:` están puestas pero sin imagen, así que al compartir el link no hay
  preview — y declarar una card grande sin imagen es peor que no declararla: X
  degrada a una card sin nada en vez de al resumen de texto. Si no va a haber
  imagen pronto, conviene bajar la card a `summary`.
- Sin analítica ni formulario: el CTA es un `mailto:`. Alcanza para validar
  demanda antes de montar nada.

## La sección de webhooks

Ya no está «en construcción»: el API los expone y la sección documenta el flujo
de tres pasos, los cuatro tipos de evento, el payload, la firma HMAC y la
política de reintentos. Todo salió de `docs/API.md` del otro repo y de su código
—los defaults de entrega son `webhooks.DefaultDeliveryTimeout` y
`DefaultDeliveryAttempts`—, no de la intención.

**La advertencia de alcance se deriva, no se escribe.** Hoy sólo se puede
suscribir un envío del único courier con rastreo operativo, y el párrafo que lo
dice sale de filtrar `CARRIERS` por `rastreo.estado === 'ok'`. Cuando se complete
otro, se actualiza `src/data/api.ts` y el párrafo se corrige solo. Es a propósito:
la frase que más rápido envejece es justamente la que menos conviene tener
duplicada a mano.
