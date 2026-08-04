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

export interface Endpoint {
  /** Ancla estable del panel. No se deriva de la ruta: cambiar una ruta no debe romper un link. */
  id: string
  metodo: 'GET' | 'POST' | 'DELETE'
  ruta: string
  resumen: string
  destacado?: boolean
  /** Cuerpo que manda el cliente. Sólo en los POST. */
  peticion?: { titulo: string; codigo: string }
  /** Lo que contesta el servicio, recortado pero con la forma real. */
  respuesta: { titulo: string; codigo: string }
  /** Una línea que explica la decisión de diseño del endpoint, si tiene una. */
  nota?: string
}

/**
 * Los ejemplos salen de `docs/API.md` del repo del API y de sus tests, no de la
 * imaginación. Están RECORTADOS —se sacan campos para que entren en pantalla—
 * pero nunca INVENTADOS: ningún campo de acá deja de existir en la respuesta
 * real, y ninguno cambia de tipo. Un cliente que copie esto y haga el curl tiene
 * que reconocer lo que recibe.
 */
export const ENDPOINTS: Endpoint[] = [
  {
    id: 'carriers',
    metodo: 'GET',
    ruta: '/v1/carriers',
    resumen: 'Qué carriers hay, qué puede cada uno y cuánta evidencia lo respalda.',
    nota: 'Es el endpoint de descubrimiento: tu código puede leer el estado en vez de confiar en esta página.',
    respuesta: {
      titulo: '200 OK · application/json',
      codigo: `{
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
    metodo: 'GET',
    ruta: '/v1/tracking',
    resumen: 'Rastreo unificado por número de guía.',
    nota: 'El literal del courier viaja siempre en status_raw: normalizar no debería significar perder el dato original.',
    respuesta: { titulo: '200 OK · application/json', codigo: EJEMPLO_TRACKING },
  },
  {
    id: 'tracking-ruta',
    metodo: 'GET',
    ruta: '/v1/tracking/{carrier}/{number}',
    resumen: 'La misma consulta con el carrier en la ruta.',
    nota: 'Idéntica respuesta. Existe porque un carrier explícito en la ruta se cachea y se loguea mejor que un query param.',
    respuesta: { titulo: '200 OK · /v1/tracking/marvisur/V001-0000001', codigo: EJEMPLO_TRACKING },
  },
  {
    id: 'batch',
    metodo: 'POST',
    ruta: '/v1/tracking/batch',
    resumen: 'Hasta 50 envíos por request, con error por ítem.',
    nota: 'Responde 200 aunque haya ítems fallidos: el error va por ítem. Acá no hay detección automática.',
    peticion: {
      titulo: 'request',
      codigo: `{
  "items": [
    { "custom_id": "a", "carrier": "marvisur", "number": "V001-0000001" },
    { "custom_id": "b", "carrier": "marvisur", "number": "V999-9999999" }
  ]
}`,
    },
    respuesta: {
      titulo: '200 OK · application/json',
      codigo: `{
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
    metodo: 'GET',
    ruta: '/v1/agencies',
    resumen: 'Catálogo de agencias con filtros y paginación.',
    nota: 'ubigeo_source es lo que hace auditable el join: "carrier" lo dio el courier, "matched" lo resolvimos por texto y puede fallar.',
    respuesta: {
      titulo: '200 OK · ?carrier=olva&ubigeo=150122',
      codigo: `{
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
    metodo: 'GET',
    ruta: '/v1/coverage',
    resumen: 'Qué carriers tienen agencia en un distrito. Distingue "no cubre" de "no sabemos".',
    destacado: true,
    nota: 'Sólo un courier que publica distrito puede recibir un "no cubre". El que da su ubicación como texto libre cae en "unknown", con el motivo escrito.',
    respuesta: { titulo: '200 OK · ?ubigeo=150101', codigo: EJEMPLO_COVERAGE },
  },
  {
    id: 'agencia-detalle',
    metodo: 'GET',
    ruta: '/v1/agencies/{carrier}/{id}',
    resumen: 'Detalle de una agencia.',
    nota: 'Devuelve la Agency pelada, sin envoltorio. La PK natural es el par (carrier, id).',
    respuesta: {
      titulo: '200 OK · /v1/agencies/olva/579',
      codigo: `{
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
    metodo: 'POST',
    ruta: '/v1/webhooks',
    resumen: 'Registra tu endpoint. Devuelve el signing secret una sola vez.',
    nota: 'Se guarda deshabilitado y recibe un ping firmado: sólo se habilita si devolvés el challenge como cuerpo.',
    peticion: {
      titulo: 'request',
      codigo: `{ "url": "https://tuservicio.com/hooks/tracking" }`,
    },
    respuesta: {
      titulo: '201 Created · application/json',
      codigo: `{
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
    metodo: 'POST',
    ruta: '/v1/tracking/subscriptions',
    resumen: 'Suscribe un envío: te avisamos cuando cambie de estado.',
    nota: 'carrier es OBLIGATORIO: no hay detección automática. Un rastreo mal detectado se ve en la respuesta; una suscripción mal detectada no la mira nadie durante semanas.',
    peticion: {
      titulo: 'request',
      codigo: `{
  "carrier": "marvisur",
  "number": "V001-0000001",
  "code": "opcional-2do-factor"
}`,
    },
    respuesta: {
      titulo: '201 Created · application/json',
      codigo: `{
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
