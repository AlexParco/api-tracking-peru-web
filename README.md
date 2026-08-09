# api-tracking-peru-web

🌐 **En vivo: [tracking-peru.com](https://tracking-peru.com)** — API de rastreo y
catálogo de agencias de couriers peruanos (Olva, Shalom, Marvisur, Urbano, Cruz
del Sur) detrás de un solo contrato REST.

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

- **El dominio ya está decidido: `tracking-peru.com`**, con el API en
  `api.tracking-peru.com`. El producto se llama **API Tracking Perú**. Los dos
  quedaron aplicados el 2026-08-04 (antes todo apuntaba a `rastreo.dev`, que era
  una recomendación). El dominio se compró el 2026-08-05 y el API ya responde en
  `api.tracking-peru.com`, así que `/docs` dejó de declararlo como un hueco.

  Si alguna vez cambia, son estos lugares:

  ```
  astro.config.mjs                    site
  src/layouts/Base.astro              el fallback de canonical
  src/components/Hero.astro           el host del ejemplo
  src/pages/docs.astro                el curl de autenticación y «Lo que falta acá»
  src/components/CallToAction.astro   el mailto y el texto del mail
  src/data/plans.ts                   el mailto de cada plan
  ```

  Ojo con el **nombre**: en el logotipo está partido por un `<span>`
  (`API Tracking <span>Perú</span>`, en `Nav.astro` y en `DocsNav.astro`), así
  que ningún grep de la cadena completa lo encuentra. Buscar `Tracking` a secas.

- **El código va en inglés; el texto de la página, en español.** Se unificó el
  2026-08-04: nombres de archivo, variables, clases CSS y atributos `data-*`
  están en inglés; los comentarios y todo lo que ve el visitante, en español.
  Al refactorizar con búsqueda y reemplazo, **comparar el texto renderizado
  antes y después** — la primera pasada convirtió «sin tarjeta guardada» en
  «sin card guardada» y «la marca de agua no avanza» en «no advance», y eso no
  lo detecta ni el compilador ni el build.
- **El buscador de agencias usa data mock, y no es pereza.** `/v1/agencies`
  exige `X-API-Key` (`internal/httpapi/router.go` aplica `mw.APIKey` a todo
  `/v1`), y una key en el navegador es una key publicada. Para que consulte en
  vivo hace falta primero una lectura anónima del lado del API. El único
  endpoint público es `POST /free`, que sí se usa de verdad.
- **Sin analítica.** No hay nada que mida qué secciones se leen ni de dónde
  llegan las altas del plan gratis.
- **Faltan `id_format` y un ejemplo real por courier.** Las páginas de courier
  remiten a `GET /v1/carriers` en vez de escribir el formato de guía, porque
  inventarlo sería peor que omitirlo: alguien lo copia, le rebota y culpa al
  API. Con los valores reales se puede mostrar el ejemplo en la página.

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
