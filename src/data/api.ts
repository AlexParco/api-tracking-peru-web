/**
 * Fuente única de verdad de la landing.
 *
 * REGLA: todo lo de este archivo tiene que ser cierto contra el API real. Los
 * números salen de una corrida verificada, no de una estimación, y el estado por
 * carrier espeja el campo `verified` que el propio API publica en
 * GET /v1/carriers. Si la landing y la API dicen cosas distintas, el que miente
 * es siempre este archivo — y el primer `curl` de un cliente lo desmiente.
 *
 * Última verificación contra el API: 2026-08-04 (segunda del día).
 */

/** Espeja `verified.level` del API. */
export type Level = 'live' | 'code_derived' | 'contract_only' | 'none'

export const LEVELS: Record<Level, { label: string; detail: string }> = {
  live: {
    label: 'Verificado en vivo',
    detail: 'Respuestas reales capturadas contra el upstream, con hit y miss.',
  },
  code_derived: {
    label: 'Derivado de código',
    detail: 'Extraído de una integración que corre en producción, sin captura de tráfico.',
  },
  contract_only: {
    label: 'Solo contrato',
    detail: 'El contrato está verificado, pero nunca obtuvimos una respuesta con datos.',
  },
  none: { label: 'Sin adaptador', detail: 'No hay integración escrita.' },
}

export type Status = 'ok' | 'pendiente' | 'no'

export interface Carrier {
  id: string
  name: string
  level: Level
  /** Detección automática del identificador: espeja `detection` del API. */
  detection: 'strong' | 'weak' | 'none'
  tracking: { status: Status; note: string }
  /**
   * Si HOY se puede dar de alta una suscripción de webhook para este carrier.
   *
   * NO se drift de `rastreo.status`, aunque hasta agosto de 2026 coincidieran:
   * el alta consulta el rastreo REAL, y un carrier puede rastrear sin estar
   * suscribible. Shalom es el caso — rastrea, pero necesita el sidecar de
   * reCAPTCHA arriba. Derivar uno del otro hacía que completar un rastreo
   * anunciara solo una suscripción que rebota.
   */
  subscribable: boolean
  /**
   * Si el carrier se muestra en la web.
   *
   * `false` no es «no existe»: es «todavía no tenemos nada que contar». Dinsides
   * y Salmec están relevados y sin adaptador, así que ocuparían dos filas de la
   * tabla de cobertura para decir «no disponible» dos veces — y eso no informa,
   * llena.
   *
   * Se OCULTAN, no se borran: el relevamiento hecho queda registrado, y volver a
   * publicarlos el día que haya algo es cambiar un booleano. Todo lo que la web
   * cuenta —cuántos couriers hay, cuántos rastrean— sale de `PUBLISHED_CARRIERS`,
   * nunca de `CARRIERS`, o la página diría siete y mostraría cinco.
   */
  published: boolean
  agencies: { status: Status; total: number | null; note: string }
}

export const CARRIERS: Carrier[] = [
  {
    id: 'marvisur',
    name: 'Expreso Marvisur',
    level: 'live',
    detection: 'strong',
    tracking: { status: 'ok', note: 'Operativo. Timeline completo con fecha y hora por evento.' },
    subscribable: true,
    published: true,
    agencies: { status: 'ok', total: 190, note: 'Con geolocalización y horarios.' },
  },
  {
    id: 'olva',
    name: 'Olva Courier',
    level: 'contract_only',
    detection: 'weak',
    tracking: {
      status: 'ok',
      note: 'Operativo, verificado en vivo con una guía real. El timeline pasa un desafío anti-bot (Cloudflare) con un navegador real. Algunos estados intermedios todavía se están mapeando.',
    },
    subscribable: true,
    published: true,
    agencies: {
      status: 'ok',
      total: 417,
      note: 'El catálogo más completo: ubigeo INEI en el 100 % y horarios por día.',
    },
  },
  {
    id: 'urbano',
    name: 'Urbano Express',
    level: 'live',
    detection: 'strong',
    tracking: {
      status: 'ok',
      note: 'Operativo, verificado en vivo. Su vocabulario de estados todavía no está completo: lo vimos con un solo envío.',
    },
    subscribable: true,
    published: true,
    agencies: { status: 'ok', total: 211, note: 'Con geolocalización, horarios y servicios por punto.' },
  },
  {
    id: 'cruzdelsur',
    name: 'Cruz del Sur Cargo',
    level: 'live',
    detection: 'none',
    tracking: {
      status: 'ok',
      note: 'Operativo, verificado contra respuestas reales. Su vocabulario de estados todavía no está completo.',
    },
    subscribable: true,
    published: true,
    agencies: { status: 'ok', total: 163, note: 'Requiere credencial para sincronizar.' },
  },
  {
    id: 'shalom',
    name: 'Shalom',
    level: 'code_derived',
    detection: 'none',
    tracking: {
      // status ('ok') y level ('code_derived') son campos DISTINTOS: el primero
      // dice "rastrea en vivo" (verificado 2026-08-05), el segundo, cuánta
      // evidencia respalda el mapeo del vocabulario (lo publica el API, se espeja).
      status: 'ok',
      note: 'Operativo, verificado en vivo. Traducir la guía a su identificador interno pasa un desafío anti-bot (reCAPTCHA) con un navegador real.',
    },
    subscribable: true,
    published: true,
    agencies: { status: 'ok', total: 544, note: 'El catálogo más grande. Requiere credencial.' },
  },
  {
    id: 'dinsides',
    name: 'Dinsides Courier',
    level: 'none',
    detection: 'none',
    // Ámbar significa «implementado y esperando algo concreto» —lo dice la propia
    // sección—, y esto no está implementado. Estaba en ámbar y se contradecía
    // con su leyenda y con su nivel `none`.
    tracking: { status: 'no', note: 'Relevado. Sin adaptador escrito.' },
    subscribable: false,
    published: false,
    agencies: { status: 'no', total: null, note: 'No publica catálogo de agencias.' },
  },
  {
    id: 'salmec',
    name: 'Salmec Courier',
    level: 'none',
    detection: 'none',
    tracking: { status: 'no', note: 'Su plataforma bloquea todo acceso automatizado.' },
    subscribable: false,
    published: false,
    agencies: { status: 'no', total: null, note: 'No publica catálogo de agencias.' },
  },
]

/*
 * No se puede suscribir lo que no se rastrea.
 *
 * El alta de una suscripción consulta el rastreo REAL antes de aceptarla, así
 * que un carrier marcado suscribible sin rastreo operativo describe algo que el
 * API rechaza. Al revés sí pasa —Shalom rastrea y no es suscribible— y por eso
 * son dos campos y no uno.
 */
for (const c of CARRIERS) {
  if (c.subscribable && c.tracking.status !== 'ok') {
    throw new Error(
      `${c.id}: marcado suscribible con rastreo "${c.tracking.status}". El alta lo rechazaría.`,
    )
  }
}

/**
 * Los que la web muestra. TODO lo visible se deriva de aquí y no de `CARRIERS`.
 */
export const PUBLISHED_CARRIERS = CARRIERS.filter((c) => c.published)


/**
 * El catálogo de errores, copiado de `docs/API.md` del backend (2026-08-05).
 *
 * Todo error tiene la misma forma: `code` estable, `message` en castellano y
 * `request_id`. Algunos suman campos —`carrier_ambiguous` trae `candidates`,
 * `carrier_cooldown` trae `Retry-After`—.
 *
 * Se ordena por HTTP porque así se lee cuando estás depurando: primero ves el
 * status en el log y después buscas el código.
 */
export const ERRORS: { code: string; http: number; when: string }[] = [
  { code: 'bad_request', http: 400, when: 'Parámetros inválidos.' },
  { code: 'invalid_tracking_number', http: 400, when: 'El formato del número no corresponde a ese carrier.' },
  { code: 'carrier_unknown', http: 400, when: 'Ningún carrier reconoce el identificador.' },
  { code: 'carrier_ambiguous', http: 400, when: 'Varios lo reconocen. Trae `candidates` para que elijas.' },
  { code: 'unauthorized', http: 401, when: 'Falta la X-API-Key o no es válida.' },
  { code: 'key_expired', http: 401, when: 'La key venció. Se renueva y la misma key vuelve.' },
  { code: 'carrier_auth_failed', http: 401, when: 'El courier rechazó las credenciales del usuario final.' },
  { code: 'forbidden', http: 403, when: 'La key no puede hacer esa operación.' },
  { code: 'not_found', http: 404, when: 'No existe el envío, la agencia o el carrier.' },
  { code: 'conflict', http: 409, when: 'El recurso ya existe o está en un estado incompatible.' },
  { code: 'webhook_not_configured', http: 409, when: 'Suscribiste un envío sin tener el webhook habilitado.' },
  { code: 'payload_too_large', http: 413, when: 'El cuerpo excede el máximo.' },
  { code: 'unsupported_media_type', http: 415, when: 'Falta Content-Type: application/json.' },
  { code: 'carrier_rejected', http: 422, when: 'El sistema del courier rechazó el pedido.' },
  { code: 'rate_limited', http: 429, when: 'Pasaste tu límite por minuto.' },
  { code: 'quota_exceeded', http: 429, when: 'Pasaste el tope mensual de consultas. Solo lo tiene el plan Free.' },
  { code: 'carrier_rate_limited', http: 429, when: 'El cupo es del courier, no tuyo.' },
  { code: 'internal', http: 500, when: 'Falla nuestra.' },
  { code: 'carrier_not_supported', http: 501, when: 'Ese carrier todavía no soporta la operación. Viene con el motivo.' },
  { code: 'carrier_unavailable', http: 502, when: 'El sistema del courier falló.' },
  { code: 'carrier_disabled', http: 503, when: 'El carrier está apagado en esta instancia.' },
  { code: 'carrier_cooldown', http: 503, when: 'Cortamos el tráfico a ese courier tras fallas seguidas. Trae Retry-After.' },
  { code: 'carrier_timeout', http: 504, when: 'El courier no respondió a tiempo.' },
]

/** Lo que el catálogo no dice y hay que saber. Sale de `docs/API.md §Errores`. */
export const ERROR_NOTES: string[] = [
  'Un 501 carrier_not_supported no es un incidente: es el estado documentado de ese adaptador, y viene con el motivo escrito.',
  'En 5 de los 7 couriers, el «no encontrado» llega con un 200 desde su lado. Lo normalizamos a 404 not_found para que no tengas que adivinar cuál de ellos miente.',
  'En un lote (POST /v1/tracking/batch) la respuesta es 200 aunque haya ítems fallidos: el error va por ítem, no en el HTTP.',
]

/** Números medidos en una corrida real del servicio, no estimados. */
export const METRICS = {
  carriersSurveyed: PUBLISHED_CARRIERS.length,
  agenciesSynced: 1546,
  agenciesWithCredentials: 1525,
  carriersWithCatalog: PUBLISHED_CARRIERS.filter((c) => c.agencies.status === 'ok').length,
}

/** Respuesta real del servicio, recortada. No es un ejemplo inventado. */
export const TRACKING_EXAMPLE = `{
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

export const COVERAGE_EXAMPLE = `{
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

export interface Endpoint {
  /** Ancla estable del panel. No se drift de la path: cambiar una ruta no debe romper un link. */
  id: string
  method: 'GET' | 'POST' | 'DELETE'
  path: string
  summary: string
  /** Cuerpo que manda el cliente. Solo en los POST. */
  request?: { title: string; code: string }
  /** Lo que contesta el servicio, recortado pero con la forma real. */
  response: { title: string; code: string }
  /** Una línea que explica la decisión de diseño del endpoint, si tiene una. */
  note?: string
}

/**
 * Los ejemplos salen de `docs/API.md` del repo del API y de sus tests, no de la
 * imaginación. Están RECORTADOS —se sacan campos para que entren en pantalla—
 * pero nunca INVENTADOS: ningún campo de aquí deja de existir en la respuesta
 * real, y ninguno cambia de tipo. Un cliente que copie esto y haga el curl tiene
 * que reconocer lo que recibe.
 */
export const ENDPOINTS: Endpoint[] = [
  {
    id: 'carriers',
    method: 'GET',
    path: '/v1/carriers',
    summary: 'Qué carriers hay, qué puede cada uno y cuánta evidencia lo respalda.',
    note: 'Es el endpoint de descubrimiento: tu código puede leer el estado en vez de confiar en esta página.',
    response: {
      title: '200 OK · application/json',
      code: `{
  "carriers": [
    {
      "id": "marvisur",
      "name": "Expreso Marvisur",
      "enabled": true,
      "verified": {
        "level": "live",
        "last_probe": "2026-08-03T22:10:23Z",
        "notes": "hit y miss reproducidos byte a byte contra el upstream"
      },
      "id_format": "V###-####### (serie V + 3 dígitos, distinto de V000)",
      "examples": ["V999-9999999"],
      "detection": "strong",
      "requires_code": false,
      "requires_end_user_auth": false,
      "anonymous_timeline": true,
      "provides": {
        "parties": true, "event_location": true,
        "packages": true, "payment_status": true
      }
    }
  ]
}`,
    },
  },
  {
    id: 'tracking',
    method: 'GET',
    path: '/v1/tracking',
    summary: 'Rastreo unificado por número de guía.',
    note: 'El literal del courier viaja siempre en status_raw: normalizar no debería significar perder el dato original.',
    response: { title: '200 OK · application/json', code: TRACKING_EXAMPLE },
  },
  {
    id: 'tracking-ruta',
    method: 'GET',
    path: '/v1/tracking/{carrier}/{number}',
    summary: 'La misma consulta con el carrier en la ruta.',
    note: 'Idéntica respuesta. Existe porque un carrier explícito en la ruta se cachea y se loguea mejor que un query param.',
    response: { title: '200 OK · /v1/tracking/marvisur/V001-0000001', code: TRACKING_EXAMPLE },
  },
  {
    id: 'batch',
    method: 'POST',
    path: '/v1/tracking/batch',
    summary: 'Hasta 50 envíos por request, con error por ítem.',
    note: 'Responde 200 aunque haya ítems fallidos: el error va por ítem. Aquí no hay detección automática.',
    request: {
      title: 'request',
      code: `{
  "items": [
    { "custom_id": "a", "carrier": "marvisur", "number": "V001-0000001" },
    { "custom_id": "b", "carrier": "marvisur", "number": "V999-9999999" }
  ]
}`,
    },
    response: {
      title: '200 OK · application/json',
      code: `{
  "results": [
    { "custom_id": "a", "carrier": "marvisur",
      "number": "V001-0000001",
      "ok": true, "shipment": { "…": "el Shipment completo" } },
    { "custom_id": "b", "carrier": "marvisur",
      "number": "V999-9999999",
      "ok": false,
      "error": {
        "code": "not_found",
        "message": "no se encontró el envío"
      } }
  ],
  "summary": { "total": 2, "ok": 1, "failed": 1 }
}`,
    },
  },
  {
    id: 'agencies',
    method: 'GET',
    path: '/v1/agencies',
    summary: 'Catálogo de agencias con filtros y paginación.',
    note: 'ubigeo_source es lo que hace auditable el join: "carrier" lo dio el courier, "matched" lo resolvimos por texto y puede fallar.',
    response: {
      title: '200 OK · ?carrier=olva&ubigeo=150122',
      code: `{
  "agencies": [
    {
      "carrier": "olva",
      "id": "948",
      "name": "AGENTE OLVA MIRAFLORES - BENAVIDES C18",
      "location": {
        "address": "AV ALFREDO BENAVIDES NRO 1851",
        "department": "LIMA", "province": "LIMA",
        "district": "MIRAFLORES",
        "ubigeo": "150122", "structured": true
      },
      "ubigeo_level": "district",
      "ubigeo_source": "carrier",
      "geo": { "lat": -12.1265813, "lng": -77.0132440 },
      "hours": {
        "weekly": [
          { "weekday": 1,
            "spans": [ { "open": "08:00", "close": "20:00" } ] }
        ],
        "structured": true,
        "time_zone": "America/Lima"
      },
      "kind": "agent",
      "services": { "dropoff": true, "pickup": true },
      "synced_at": "2026-08-03T22:10:19Z"
    }
  ],
  "pagination": {
    "page": 1, "per_page": 20, "total": 417, "total_pages": 21
  },
  "meta": { "sources": [ "…frescura por carrier" ] }
}`,
    },
  },
  {
    id: 'coverage',
    method: 'GET',
    path: '/v1/coverage',
    summary: 'Qué carriers tienen agencia en un distrito. Distingue "no cubre" de "no sabemos".',
    note: 'Solo un courier que publica distrito puede recibir un "no cubre". El que da su ubicación como texto libre cae en "unknown", con el motivo escrito.',
    response: { title: '200 OK · ?ubigeo=150101', code: COVERAGE_EXAMPLE },
  },
  {
    id: 'agencia-detalle',
    method: 'GET',
    path: '/v1/agencies/{carrier}/{id}',
    summary: 'Detalle de una agencia.',
    note: 'Devuelve la Agency pelada, sin envoltorio. La PK natural es el par (carrier, id).',
    response: {
      title: '200 OK · /v1/agencies/olva/579',
      code: `{
  "carrier": "olva",
  "id": "579",
  "name": "TIENDA CHACHAPOYAS",
  "location": {
    "address": "JR. AMAZONAS 1120",
    "department": "AMAZONAS", "province": "CHACHAPOYAS",
    "district": "CHACHAPOYAS",
    "ubigeo": "010101", "structured": true
  },
  "ubigeo_level": "district",
  "ubigeo_source": "carrier",
  "kind": "office",
  "services": { "dropoff": true, "pickup": true },
  "synced_at": "2026-08-03T22:10:19Z"
}`,
    },
  },
  {
    id: 'webhooks',
    method: 'POST',
    path: '/v1/webhooks',
    summary: 'Registra tu endpoint. Devuelve el signing secret una sola vez.',
    note: 'Se guarda deshabilitado y recibe un ping firmado: solo se habilita si devuelves el challenge como cuerpo.',
    request: {
      title: 'request',
      code: `{ "url": "https://tuservicio.com/hooks/tracking" }`,
    },
    response: {
      title: '201 Created · application/json',
      code: `{
  "webhook": {
    "id": 11,
    "url": "https://tuservicio.com/hooks/tracking",
    "enabled": true,
    "created_at": "2026-08-04T10:00:00Z"
  },
  "signing_secret": "9f2b…64 hex…c1",
  "verified": true,
  "usage": { "active_subscriptions": 0, "max_subscriptions": 50 }
}`,
    },
  },
  {
    id: 'subscriptions',
    method: 'POST',
    path: '/v1/tracking/subscriptions',
    summary: 'Suscribe un envío: te avisamos cuando cambie de estado.',
    note: 'carrier es OBLIGATORIO: no hay detección automática. Un rastreo mal detectado se ve en la respuesta; una suscripción mal detectada no la mira nadie durante semanas.',
    request: {
      title: 'request',
      code: `{
  "carrier": "marvisur",
  "number": "V001-0000001",
  "code": "opcional-2do-factor"
}`,
    },
    response: {
      title: '201 Created · application/json',
      code: `{
  "subscription": {
    "id": 4821,
    "carrier": "marvisur",
    "tracking_number": "V001-0000001",
    "status": "active",
    "next_poll_at": "2026-08-04T10:16:00Z",
    "created_at": "2026-08-04T10:00:00Z",
    "expires_at": "2026-08-25T10:00:00Z"
  },
  "outcome": "created",
  "usage": { "active_subscriptions": 8, "max_subscriptions": 50 }
}`,
    },
  },
]



// ── Webhooks ────────────────────────────────────────────────────────────────
//
// Todo lo de aquí abajo está verificado contra docs/API.md y contra el código del
// API, no contra la intención. Los defaults de entrega (10 s de timeout, 3
// intentos) salen de `webhooks.DefaultDeliveryTimeout` y
// `DefaultDeliveryAttempts`.

/** Los cuatro tipos de evento que emite el poller. */
export const EVENTS: { name: string; when: string }[] = [
  { name: 'tracking.updated', when: 'El envío cambió de estado y sigue en curso.' },
  {
    name: 'tracking.delivered',
    when:
      'Se entregó. Es el único terminal con tipo propio: una devolución también es terminal, pero no es una entrega.',
  },
  {
    name: 'tracking.expired',
    when:
      'Venció el TTL de la suscripción sin que el envío terminara. Se avisa en vez de callarse: «no pasó nada» y «dejamos de mirar» no son lo mismo.',
  },
  { name: 'webhook.ping', when: 'Verificación de propiedad al registrar el endpoint.' },
]

/**
 * Las decisiones del subsistema que un integrador necesita saber ANTES de
 * escribir el receptor. No son features: son cosas que cambian su código.
 */
export const WEBHOOK_DECISIONS: { title: string; detail: string }[] = [
  {
    title: 'Se avisa por cambio de estado, no por escaneo',
    detail:
      'Tres ciudades y tres eventos in_transit son un solo webhook. El payload trae el timeline completo igual, así que no pierdes nada y no recibes un feed.',
  },
  {
    title: 'Verify-before-enable',
    detail:
      'Tu endpoint se guarda deshabilitado y recibe un webhook.ping firmado. Solo se habilita si respondes 2xx devolviendo el challenge como cuerpo — a propósito: eso prueba que del otro lado hay un receptor y no un reflector.',
  },
  {
    title: 'El código de rastreo y la PII no viajan',
    detail:
      'El segundo factor es credencial y ya lo tienes. Remitente, destinatario y contenido del bulto son datos de terceros y se quedan afuera del POST a tu servidor.',
  },
  {
    title: 'Reintentos con id de evento estable',
    detail:
      'Hasta 3 intentos por entrega (10 s de timeout, backoff de 500 ms). Si fallan, la marca de agua no avanza y el próximo poll reintenta el mismo cambio con el mismo id. Deduplica por X-Webhook-Event-Id.',
  },
  {
    title: 'Cadencia atada al TTL del cache',
    detail:
      'El poller nunca consulta más rápido que el cache: pedir 1 minuto cuando el TTL es de 10 daría diez lecturas idénticas. Se corrige solo y queda en el log.',
  },
  {
    title: 'Solo HTTPS, y se revalida en cada entrega',
    detail:
      'La URL se valida contra SSRF al registrar y la IP real se vuelve a chequear al conectar, contra DNS rebinding. No se siguen redirects.',
  },
]

/** Cabeceras y cuerpo de una entrega real, recortado. */
export const WEBHOOK_EXAMPLE = `POST /hooks/tracking HTTP/1.1
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
export const WEBHOOK_SIGNATURE = `X-Webhook-Signature: t=<unix>,v1=<hex>

v1 = HMAC-SHA256("<t>" + "." + <cuerpo crudo>, signing_secret)`

export interface Step {
  /** Casi siempre uno. Dos cuando el journey se bifurca de verdad. */
  states: string[]
  title: string
  /**
   * El literal que devolvió el courier, y de cuál.
   *
   * Va SÓLO donde hay una respuesta real capturada. Hoy eso es exactamente un
   * hito: el de Marvisur. Que Cruz del Sur y Shalom también rastreen no alcanza
   * — hace falta el literal capturado, y esos todavía no están aquí.
   *
   * Inventar los que faltan para que el journey se vea completo sería mentir
   * justo en la sección que existe para mostrar que no mentimos. Cuando llegue
   * un `200` con hitos reales, se agregan aquí y el párrafo de abajo se ajusta
   * solo: cuenta los literales presentes, no un número escrito a mano.
   */
  literal?: { carrier: string; raw: string }
}

/**
 * El journey canónico. Esto NO es un envío: es el modelo —qué estados hay, en
 * qué orden, dónde se abre— que es justamente lo que el API promete y lo único
 * que vale igual para todos los couriers.
 */
export const JOURNEY: Step[] = [
  {
    states: ['registered'],
    title: 'El courier lo recibió y lo dio de alta.',
    literal: { carrier: 'marvisur', raw: 'RECEPCION' },
  },
  { states: ['at_origin'], title: 'En la agencia de origen, sin salir todavía.' },
  { states: ['in_transit'], title: 'Viajando entre sedes.' },
  { states: ['at_destination'], title: 'Llegó a la ciudad de destino.' },
  {
    states: ['out_for_delivery', 'available_for_pickup'],
    title: 'Sale a repartir, o queda esperando en agencia.',
  },
  { states: ['delivered'], title: 'Entregado. No hay estado después de este.' },
]

/**
 * El matiz del quinto hito, que no entra en una columna del journey pero es
 * una de las razones por las que el vocabulario tiene once estados y no diez.
 */
export const FORK_NOTE =
  'En Perú el retiro en agencia es la norma, no la excepción. Por eso hay un estado propio para «esperando en agencia»: decir «en reparto» cuando nadie está repartiendo es falso.'

/** Los cinco que se salen del camino. No son un paso: son una salida. */
export const DETOURS: { status: string; note: string }[] = [
  { status: 'delayed', note: 'Sigue en curso, solo que tarde.' },
  { status: 'returning', note: 'Vuelve al origen. No es terminal: todavía puede entregarse.' },
  { status: 'returned', note: 'Volvió y quedó ahí.' },
  { status: 'exception', note: 'Algo que el courier reporta y no encaja en ningún otro estado.' },
]

export const CANONICAL_STATUSES = [
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

/*
 * La red que sostiene la sección `#journey`.
 *
 * Esa sección se titula «Un envío, once estados» y reparte los 11 entre el
 * journey feliz y los desvíos. Si alguien agrega un estado canónico y se
 * olvida de ubicarlo, la página sigue compilando y sigue diciendo «once» — pero
 * con diez a la vista. Nadie lo nota mirando: hay que contarlos.
 *
 * Así que se cuentan aquí, en build. Una landing que se vende publicando lo que
 * sabe no puede permitirse un conteo desactualizado en un título, y un build
 * rojo es infinitamente más barato que descubrirlo en producción.
 */
{
  const ubicados = [...JOURNEY.flatMap((h) => h.states), ...DETOURS.map((d) => d.status)]
  const faltan = CANONICAL_STATUSES.filter((e) => !ubicados.includes(e))
  const sobran = ubicados.filter((e) => !CANONICAL_STATUSES.includes(e))

  if (faltan.length || sobran.length) {
    throw new Error(
      'JOURNEY + DETOURS tienen que cubrir exactamente CANONICAL_STATUSES.' +
        (faltan.length ? ` Sin ubicar: ${faltan.join(', ')}.` : '') +
        (sobran.length ? ` No son canónicos: ${sobran.join(', ')}.` : ''),
    )
  }
}

/*
 * Los números que están escritos CON LETRA en los títulos.
 *
 * «Un envío, once estados», «un vocabulario, no cinco», «el mismo para los
 * cinco». Ninguno se puede interpolar sin
 * que la frase quede coja, así que en vez de derivarlos se verifica que sigan
 * siendo ciertos. Un título que dice «once» sobre una lista de doce no lo
 * detecta nadie leyendo: hay que contar.
 */
{
  const escritos: [string, number, number][] = [
    ['«once estados»', CANONICAL_STATUSES.length, 11],
    ['«no cinco» / «los cinco» (couriers publicados)', PUBLISHED_CARRIERS.length, 5],
  ]
  for (const [donde, real, enElTexto] of escritos) {
    if (real !== enElTexto) {
      throw new Error(
        `El texto dice ${enElTexto} en ${donde}, pero hoy son ${real}. Corregir la frase.`,
      )
    }
  }
}
