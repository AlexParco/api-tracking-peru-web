import type { APIRoute } from 'astro'
import { ENDPOINTS, ERRORS, PUBLISHED_CARRIERS, type Endpoint } from '../data/api.ts'
import { CONTACTO } from '../data/legal.ts'

/* El spec OpenAPI, generado en build desde `ENDPOINTS`.
 *
 * ── Por qué existe ──
 *
 * `/openapi.json` devolvía 404. A diferencia de `llms.txt` —que se descartó por no
 * tener ningún consumidor confirmado— un spec OpenAPI sí se consume hoy: lo leen
 * los generadores de cliente, los agentes de código cuando alguien les pide
 * integrar el API, y los directorios de APIs donde figurar es una de las pocas
 * formas de que la marca quede corroborada fuera del propio dominio.
 *
 * ── Por qué se genera y no se escribe ──
 *
 * Sale de la MISMA constante que pinta /docs. Un spec escrito a mano es una
 * segunda copia de la documentación, y la segunda copia siempre es la que
 * envejece: el día que se agregue un endpoint, éste lo tiene sin que nadie se
 * acuerde, igual que la sidebar y el buscador.
 *
 * ── Qué se afirma, y con cuánta confianza ──
 *
 * Los esquemas se DERIVAN de los ejemplos, que `api.ts` garantiza recortados pero
 * nunca inventados: «ningún campo de aquí deja de existir en la respuesta real, y
 * ninguno cambia de tipo». Por eso los objetos van con `additionalProperties: true`
 * y SIN lista de `required`: los campos que aparecen son ciertos, pero la lista no
 * es exhaustiva y no sabemos cuáles son obligatorios. Declarar un `required` que
 * no lo es rompe la validación del cliente por una promesa que nadie hizo.
 *
 * Los parámetros de query son sólo los verificados contra el API real, no los que
 * uno supondría que existen.
 */

/** Deriva un esquema del ejemplo. No inventa: describe lo que el ejemplo muestra. */
function schemaFrom(v: unknown): Record<string, unknown> {
  if (v === null) return {}
  if (Array.isArray(v)) return { type: 'array', items: v.length ? schemaFrom(v[0]) : {} }
  if (typeof v === 'object') {
    const properties: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      properties[k] = schemaFrom(val)
    }
    // Sin `required`: el ejemplo está recortado, así que su ausencia no prueba nada.
    return { type: 'object', properties, additionalProperties: true }
  }
  if (typeof v === 'number') return { type: Number.isInteger(v) ? 'integer' : 'number' }
  if (typeof v === 'boolean') return { type: 'boolean' }
  return { type: 'string' }
}

/** El ejemplo, si parsea. Si no, se omite en vez de servir algo a medias. */
function parse(code: string | undefined): unknown {
  if (!code) return undefined
  try {
    return JSON.parse(code)
  } catch {
    return undefined
  }
}

/* Parámetros de query VERIFICADOS contra el API en vivo, endpoint por endpoint.
   `/v1/coverage` los publica el propio servicio en su 400: «hace falta `ubigeo`,
   o `department` (+`province`/`district`), o `near=lat,lng`». */
const QUERY: Record<string, { name: string; desc: string; required?: boolean }[]> = {
  tracking: [
    { name: 'number', desc: 'Número de guía.', required: true },
    { name: 'carrier', desc: 'Id del courier. Obligatorio si su formato no es distinguible.' },
    { name: 'code', desc: 'Código de orden. Sólo los carriers con requires_code lo exigen.' },
    { name: 'include', desc: 'Con `raw`, adjunta la respuesta cruda del courier.' },
  ],
  agencies: [
    { name: 'carrier', desc: 'Filtra por courier.' },
    { name: 'page', desc: 'Página, desde 1.' },
    { name: 'per_page', desc: 'Resultados por página. El máximo es 500.' },
  ],
  coverage: [
    { name: 'ubigeo', desc: 'Ubigeo INEI. Alternativa a `department` o `near`.' },
    { name: 'department', desc: 'Departamento. Se puede afinar con `province` y `district`.' },
    { name: 'province', desc: 'Provincia, junto con `department`.' },
    { name: 'district', desc: 'Distrito, junto con `department` y `province`.' },
    { name: 'near', desc: 'Coordenadas `lat,lng`. Alternativa a `ubigeo` o `department`.' },
  ],
}

function operation(e: Endpoint) {
  const req = parse(e.request?.code)
  const res = parse(e.response.code)

  /* Los `{x}` de la ruta son parámetros obligatorios: OpenAPI no admite una ruta
     con un placeholder que no esté declarado. */
  const pathParams = [...e.path.matchAll(/\{([a-z_]+)\}/g)].map((m) => ({
    name: m[1],
    in: 'path',
    required: true,
    schema: { type: 'string' },
    description: m[1] === 'carrier' ? `Id del courier.` : `Identificador en la ruta.`,
  }))

  const queryParams = (QUERY[e.id] ?? []).map((q) => ({
    name: q.name,
    in: 'query',
    required: q.required ?? false,
    schema: { type: 'string' },
    description: q.desc,
  }))

  return {
    operationId: e.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
    summary: e.summary,
    ...(e.note ? { description: e.note } : {}),
    ...(pathParams.length || queryParams.length
      ? { parameters: [...pathParams, ...queryParams] }
      : {}),
    ...(req !== undefined
      ? {
          requestBody: {
            required: true,
            content: { 'application/json': { schema: schemaFrom(req), example: req } },
          },
        }
      : {}),
    responses: {
      '200': {
        description: e.response.title,
        ...(res !== undefined
          ? { content: { 'application/json': { schema: schemaFrom(res), example: res } } }
          : {}),
      },
      '4XX': {
        description: 'Error. El cuerpo sigue siempre la misma forma.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  }
}

export const GET: APIRoute = () => {
  const paths: Record<string, Record<string, unknown>> = {}
  for (const e of ENDPOINTS) {
    paths[e.path] ??= {}
    paths[e.path][e.method.toLowerCase()] = operation(e)
  }

  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'API Tracking Perú',
      // La versión sigue al prefijo de las rutas, que es lo único que de verdad
      // versiona este API. Un semver inventado acá sería un número que no cambia
      // con nada.
      version: '1',
      summary: `Rastreo, creación de guías y catálogo de agencias de ${PUBLISHED_CARRIERS.length} couriers peruanos detrás de un solo contrato REST.`,
      description: [
        `Un contrato para ${PUBLISHED_CARRIERS.map((c) => c.name).join(', ')}.`,
        '',
        'Los estados llegan normalizados a un vocabulario canónico de once valores, con el literal original del courier adjunto en `status_raw`. Lo que no reconocemos llega como `unknown` con su literal, nunca aproximado al más parecido.',
        '',
        'Qué publica cada courier y con cuánta evidencia está verificado su mapeo lo dice `GET /v1/carriers`.',
        '',
        'Este documento se genera en cada despliegue desde la misma fuente que la referencia publicada en https://tracking-peru.com/docs. Los esquemas se derivan de ejemplos reales recortados: los campos que aparecen existen y su tipo es el que dice, pero la lista no es exhaustiva y por eso no se declara `required`.',
      ].join('\n'),
      contact: { email: CONTACTO, url: 'https://tracking-peru.com/docs' },
      termsOfService: 'https://tracking-peru.com/terms',
    },
    servers: [{ url: 'https://api.tracking-peru.com', description: 'Producción' }],
    security: [{ ApiKeyAuth: [] }],
    /* Sin `tags`: no hay operaciones etiquetadas, así que una lista de tags sería
       decorado. Y sin `info.license` —el linter lo pide— porque este API no es
       open-source: lo que rige su uso son los términos, y ésos ya van declarados
       arriba en `termsOfService`. Inventar una licencia para callar un warning es
       peor que el warning. */
    paths,
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description:
            'La key va del lado del servidor. Se obtiene gratis en https://tracking-peru.com/#get-started y se puede rotar desde el panel.',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          description: 'Todos los errores del API tienen esta forma.',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Código estable. No cambia aunque cambie el mensaje.',
                  enum: [...new Set(ERRORS.map((e) => e.code))],
                },
                message: { type: 'string' },
                request_id: {
                  type: 'string',
                  description: 'Identificador de la petición, para reportar un problema.',
                },
              },
              additionalProperties: true,
            },
          },
          additionalProperties: true,
        },
      },
    },
  }

  return new Response(JSON.stringify(spec, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
