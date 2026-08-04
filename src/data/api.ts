/**
 * Fuente única de verdad de la landing.
 *
 * REGLA: todo lo de este archivo tiene que ser cierto contra el API real. Los
 * números salen de una corrida verificada, no de una estimación, y el estado por
 * carrier espeja el campo `verified` que el propio API publica en
 * GET /v1/carriers. Si la landing y la API dicen cosas distintas, el que miente
 * es siempre este archivo — y el primer `curl` de un cliente lo desmiente.
 *
 * Última verificación contra el API: 2026-08-03.
 */

/** Espeja `verified.level` del API. */
export type Nivel = 'live' | 'code_derived' | 'contract_only' | 'none'

export const NIVELES: Record<Nivel, { label: string; detalle: string }> = {
  live: {
    label: 'Verificado en vivo',
    detalle: 'Respuestas reales capturadas contra el upstream, con hit y miss.',
  },
  code_derived: {
    label: 'Derivado de código',
    detalle: 'Extraído de una integración que corre en producción, sin captura de tráfico.',
  },
  contract_only: {
    label: 'Sólo contrato',
    detalle: 'El contrato está verificado, pero nunca obtuvimos una respuesta con datos.',
  },
  none: { label: 'Sin adaptador', detalle: 'No hay integración escrita.' },
}

export type Estado = 'ok' | 'pendiente' | 'no'

export interface Carrier {
  id: string
  nombre: string
  nivel: Nivel
  /** Detección automática del identificador: espeja `detection` del API. */
  deteccion: 'strong' | 'weak' | 'none'
  rastreo: { estado: Estado; nota: string }
  agencias: { estado: Estado; total: number | null; nota: string }
}

export const CARRIERS: Carrier[] = [
  {
    id: 'marvisur',
    nombre: 'Expreso Marvisur',
    nivel: 'live',
    deteccion: 'strong',
    rastreo: { estado: 'ok', nota: 'Operativo. Timeline completo con fecha y hora por evento.' },
    agencias: { estado: 'ok', total: 190, nota: 'Con geolocalización y horarios.' },
  },
  {
    id: 'olva',
    nombre: 'Olva Courier',
    nivel: 'contract_only',
    deteccion: 'weak',
    rastreo: {
      estado: 'pendiente',
      nota: 'Requiere credenciales emitidas por Olva. El contrato ya está implementado.',
    },
    agencias: {
      estado: 'ok',
      total: 417,
      nota: 'El catálogo más completo: ubigeo INEI en el 100 % y horarios por día.',
    },
  },
  {
    id: 'urbano',
    nombre: 'Urbano Express',
    nivel: 'live',
    deteccion: 'strong',
    rastreo: { estado: 'pendiente', nota: 'Transporte verificado; falta cerrar el mapeo de estados.' },
    agencias: { estado: 'ok', total: 211, nota: 'Con geolocalización, horarios y servicios por punto.' },
  },
  {
    id: 'cruzdelsur',
    nombre: 'Cruz del Sur Cargo',
    nivel: 'live',
    deteccion: 'none',
    rastreo: { estado: 'pendiente', nota: 'Endpoints confirmados; falta el formato de la respuesta con datos.' },
    agencias: { estado: 'ok', total: 163, nota: 'Requiere credencial para sincronizar.' },
  },
  {
    id: 'shalom',
    nombre: 'Shalom',
    nivel: 'code_derived',
    deteccion: 'none',
    rastreo: { estado: 'pendiente', nota: 'En migración desde una integración que ya corre en producción.' },
    agencias: { estado: 'ok', total: 544, nota: 'El catálogo más grande. Requiere credencial.' },
  },
  {
    id: 'dinsides',
    nombre: 'Dinsides Courier',
    nivel: 'none',
    deteccion: 'none',
    rastreo: { estado: 'pendiente', nota: 'Relevado. Sin adaptador escrito.' },
    agencias: { estado: 'no', total: null, nota: 'No publica catálogo de agencias.' },
  },
  {
    id: 'salmec',
    nombre: 'Salmec Courier',
    nivel: 'none',
    deteccion: 'none',
    rastreo: { estado: 'no', nota: 'Su plataforma bloquea todo acceso automatizado.' },
    agencias: { estado: 'no', total: null, nota: 'No publica catálogo de agencias.' },
  },
]

/** Números medidos en una corrida real del servicio, no estimados. */
export const METRICAS = {
  carriersRelevados: CARRIERS.length,
  agenciasSincronizadas: 818,
  agenciasTotalesConCredenciales: 1525,
  carriersConCatalogo: CARRIERS.filter((c) => c.agencias.estado === 'ok').length,
}

export interface Endpoint {
  metodo: 'GET' | 'POST' | 'DELETE'
  ruta: string
  resumen: string
  destacado?: boolean
}

export const ENDPOINTS: Endpoint[] = [
  { metodo: 'GET', ruta: '/v1/carriers', resumen: 'Qué carriers hay, qué puede cada uno y cuánta evidencia lo respalda.' },
  { metodo: 'GET', ruta: '/v1/tracking', resumen: 'Rastreo unificado por número de guía.' },
  { metodo: 'GET', ruta: '/v1/tracking/{carrier}/{number}', resumen: 'La misma consulta con el carrier en la ruta.' },
  { metodo: 'POST', ruta: '/v1/tracking/batch', resumen: 'Hasta 50 envíos por request, con error por ítem.' },
  { metodo: 'GET', ruta: '/v1/agencies', resumen: 'Catálogo de agencias con filtros y paginación.' },
  {
    metodo: 'GET',
    ruta: '/v1/coverage',
    resumen: 'Qué carriers tienen agencia en un distrito. Distingue "no cubre" de "no sabemos".',
    destacado: true,
  },
  { metodo: 'GET', ruta: '/v1/agencies/{carrier}/{id}', resumen: 'Detalle de una agencia.' },
  { metodo: 'POST', ruta: '/v1/webhooks', resumen: 'Registra tu endpoint. Devuelve el signing secret una sola vez.' },
  { metodo: 'POST', ruta: '/v1/tracking/subscriptions', resumen: 'Suscribe un envío: te avisamos cuando cambie de estado.' },
]

/** Respuesta real del servicio, recortada. No es un ejemplo inventado. */
export const EJEMPLO_TRACKING = `{
  "carrier": "marvisur",
  "tracking_number": "V001-0000001",
  "status": "delivered",
  "status_raw": "ENTREGADO",
  "delivered": true,
  "terminal": true,
  "events": [
    {
      "seq": 0,
      "status": "registered",
      "status_raw": "RECEPCION",
      "description": "SU ENVÍO FUÉ RECEPCIONADO EN NUESTRA SEDE",
      "occurred_at": "2023-07-01T07:54:06-05:00",
      "time_precision": "second",
      "location": { "name": "GARCI CARBAJAL", "structured": false }
    }
  ],
  "detail": "full",
  "fetched_at": "2026-08-03T22:10:31Z"
}`

export const EJEMPLO_COVERAGE = `{
  "ubigeo": "150101",
  "level": "district",
  "carriers": [
    { "carrier": "olva", "count": 5, "kinds": { "agent": 5 } }
  ],
  "not_covered": [],
  "unknown": [
    {
      "carrier": "marvisur",
      "reason": "el catálogo de este carrier no resuelve a nivel
                 district; la consulta pide ese nivel"
    }
  ]
}`

// ── Webhooks ────────────────────────────────────────────────────────────────
//
// Todo lo de acá abajo está verificado contra docs/API.md y contra el código del
// API, no contra la intención. Los defaults de entrega (10 s de timeout, 3
// intentos) salen de `webhooks.DefaultDeliveryTimeout` y
// `DefaultDeliveryAttempts`.

/** Los cuatro tipos de evento que emite el poller. */
export const EVENTOS: { nombre: string; cuando: string }[] = [
  { nombre: 'tracking.updated', cuando: 'El envío cambió de estado y sigue en curso.' },
  {
    nombre: 'tracking.delivered',
    cuando:
      'Se entregó. Es el único terminal con tipo propio: una devolución también es terminal, pero no es una entrega.',
  },
  {
    nombre: 'tracking.expired',
    cuando:
      'Venció el TTL de la suscripción sin que el envío terminara. Se avisa en vez de callarse: «no pasó nada» y «dejamos de mirar» no son lo mismo.',
  },
  { nombre: 'webhook.ping', cuando: 'Verificación de propiedad al registrar el endpoint.' },
]

/**
 * Las decisiones del subsistema que un integrador necesita saber ANTES de
 * escribir el receptor. No son features: son cosas que cambian su código.
 */
export const WEBHOOKS_DECISIONES: { titulo: string; detalle: string }[] = [
  {
    titulo: 'Se avisa por cambio de estado, no por escaneo',
    detalle:
      'Tres ciudades y tres eventos in_transit son un solo webhook. El payload trae el timeline completo igual, así que no perdés nada y no recibís un feed.',
  },
  {
    titulo: 'Verify-before-enable',
    detalle:
      'Tu endpoint se guarda deshabilitado y recibe un webhook.ping firmado. Sólo se habilita si respondés 2xx devolviendo el challenge como cuerpo — a propósito: eso prueba que del otro lado hay un receptor y no un reflector.',
  },
  {
    titulo: 'El code y la PII no viajan',
    detalle:
      'El segundo factor es credencial y ya lo tenés. Remitente, destinatario y contenido del bulto son datos de terceros y se quedan afuera del POST a tu servidor.',
  },
  {
    titulo: 'Reintentos con id de evento estable',
    detalle:
      'Hasta 3 intentos por entrega (10 s de timeout, backoff de 500 ms). Si fallan, la marca de agua no avanza y el próximo poll reintenta el mismo cambio con el mismo id. Deduplicá por X-Webhook-Event-Id.',
  },
  {
    titulo: 'Cadencia atada al TTL del cache',
    detalle:
      'El poller nunca consulta más rápido que el cache: pedir 1 minuto cuando el TTL es de 10 daría diez lecturas idénticas. Se corrige solo y queda en el log.',
  },
  {
    titulo: 'Sólo HTTPS, y se revalida en cada entrega',
    detalle:
      'La URL se valida contra SSRF al registrar y la IP real se vuelve a chequear al conectar, contra DNS rebinding. No se siguen redirects.',
  },
]

/** Cabeceras y cuerpo de una entrega real, recortado. */
export const EJEMPLO_WEBHOOK = `POST /hooks/tracking HTTP/1.1
User-Agent: tracking-peru-webhooks/1
X-Webhook-Event: tracking.updated
X-Webhook-Event-Id: evt_4821_tracking.updated_v1-1010100000000
X-Webhook-Attempt: 1
X-Webhook-Signature: t=1785578400,v1=6f1a…

{
  "id": "evt_4821_tracking.updated_v1-1010100000000",
  "event": "tracking.updated",
  "occurred_at": "2026-08-04T14:02:11Z",
  "data": {
    "subscription_id": 4821,
    "carrier": "marvisur",
    "tracking_number": "V001-0000001",
    "status": "at_destination",
    "previous_status": "in_transit",
    "delivered": false,
    "terminal": false,
    "change": { "appeared": ["at_destination"] },
    "shipment": { "…": "el Shipment completo, con su timeline" }
  }
}`

/** La firma, tal cual la documenta el API. */
export const FIRMA_WEBHOOK = `X-Webhook-Signature: t=<unix>,v1=<hex>

v1 = HMAC-SHA256("<t>" + "." + <cuerpo crudo>, signing_secret)`

export const ESTADOS_CANONICOS = [
  'registered',
  'at_origin',
  'in_transit',
  'delayed',
  'at_destination',
  'out_for_delivery',
  'available_for_pickup',
  'returning',
  'delivered',
  'returned',
  'exception',
]
