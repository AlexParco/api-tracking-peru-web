import { ENDPOINTS } from './api.ts'

/**
 * La estructura de /docs, en un solo lugar.
 *
 * La sidebar y el buscador leen de aquí. No son dos listas: es una, porque una
 * sidebar que ofrece un endpoint que el buscador no encuentra —o al revés— es
 * un bug que nadie reporta y todos sufren.
 *
 * Y los endpoints NO se escriben aquí: se derivan de `ENDPOINTS` en `api.ts`.
 * Agregar un endpoint al API lo pone en la portada, en la sidebar y en el
 * buscador de una sola vez.
 */
export interface DocsEntry {
  group: string
  /** Ancla dentro de /docs. */
  id: string
  title: string
  /** Lo que se muestra bajo el título en el buscador, y lo que se busca. */
  detail: string
  method?: 'GET' | 'POST' | 'DELETE'
}

const EMPEZAR: DocsEntry[] = [
  {
    group: 'Empezar',
    id: 'empezar',
    title: 'Introducción',
    detail: 'Qué es el API, qué cubre y cómo está armada esta referencia.',
  },
  {
    group: 'Empezar',
    id: 'autenticacion',
    title: 'Autenticación',
    detail: 'La cabecera X-API-Key, y por qué la key va del lado del servidor.',
  },
  {
    group: 'Empezar',
    id: 'primer-llamado',
    title: 'Tu primer llamado',
    detail: 'GET /v1/carriers es el endpoint de descubrimiento: empieza por ahí.',
  },
  {
    group: 'Empezar',
    id: 'convenciones',
    title: 'Convenciones',
    detail:
      'Inglés snake_case, zona horaria explícita, status_raw siempre adjunto, unknown como valor posible y qué PII viaja.',
  },
]

const CONCEPTOS: DocsEntry[] = [
  {
    group: 'Conceptos',
    id: 'estados',
    title: 'Estados canónicos',
    detail: 'Los once valores de status, en el orden en que un envío los atraviesa.',
  },
  {
    group: 'Conceptos',
    id: 'desvios',
    title: 'Los que se salen del camino',
    detail: 'delayed, returning, returned y exception: cuándo aparece cada uno.',
  },
  {
    group: 'Conceptos',
    id: 'carriers',
    title: 'Carriers y verificación',
    detail:
      'Los couriers integrados, su nivel de evidencia en verified.level y qué publica cada uno.',
  },
]

const WEBHOOKS: DocsEntry[] = [
  {
    group: 'Webhooks',
    id: 'webhooks-como',
    title: 'Cómo funciona',
    detail: 'Te avisamos por cambio de estado en vez de que preguntes.',
  },
  {
    group: 'Webhooks',
    id: 'webhooks-eventos',
    title: 'Tipos de evento',
    detail: 'tracking.updated, tracking.delivered, tracking.expired y webhook.ping.',
  },
  {
    group: 'Webhooks',
    id: 'webhooks-firma',
    title: 'Verificar la firma',
    detail: 'HMAC-SHA256 sobre el cuerpo crudo, con la cabecera X-Webhook-Signature.',
  },
  {
    group: 'Webhooks',
    id: 'webhooks-entrega',
    title: 'Una entrega',
    detail: 'Cabeceras y cuerpo de un POST real a tu endpoint.',
  },
  {
    group: 'Webhooks',
    id: 'webhooks-reglas',
    title: 'Antes de escribir el receptor',
    detail:
      'Verify-before-enable, reintentos, deduplicación por event id, solo HTTPS y guarda anti-SSRF.',
  },
]

const REFERENCIA: DocsEntry[] = [
  {
    group: 'Referencia',
    id: 'errores',
    title: 'Errores',
    detail: 'key_expired, quota_exceeded, not_found y qué respuestas gastan cuota y cuáles no.',
  },
  {
    group: 'Referencia',
    id: 'limites',
    title: 'Lo que falta aquí',
    detail:
      'El catálogo de errores, los límites de uso, los query params completos y la URL de producción.',
  },
]

/** Los endpoints salen del API, no de una lista paralela que se desincroniza. */
const ENDPOINTS_NAV: DocsEntry[] = ENDPOINTS.map((e) => ({
  group: 'Endpoints',
  id: `ep-${e.id}`,
  title: e.path,
  detail: e.summary,
  method: e.method,
}))

export const DOCS_NAV: DocsEntry[] = [
  ...EMPEZAR,
  ...ENDPOINTS_NAV,
  ...CONCEPTOS,
  ...WEBHOOKS,
  ...REFERENCIA,
]

/** Los grupos en orden de aparición, para que la sidebar no tenga que ordenarlos. */
export const DOCS_GROUPS: { group: string; entries: DocsEntry[] }[] = DOCS_NAV.reduce(
  (acc, e) => {
    const ultimo = acc[acc.length - 1]
    if (ultimo && ultimo.group === e.group) ultimo.entries.push(e)
    else acc.push({ group: e.group, entries: [e] })
    return acc
  },
  [] as { group: string; entries: DocsEntry[] }[],
)

/*
 * Toda entrada tiene que corresponder a un ancla que exista en la página. Un
 * enlace de sidebar a un `id` que nadie renderiza no falla: hace scroll a
 * ninguna parte y parece que la página está rota. Como el HTML se arma en el
 * mismo build, se puede chequear — y se chequea en `docs.astro`, que es quien
 * conoce los ids que efectivamente escribió.
 */
export const EXPECTED_IDS = new Set(DOCS_NAV.map((e) => e.id))
