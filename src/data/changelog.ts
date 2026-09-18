/**
 * El registro de cambios del API.
 *
 * ── De dónde salen las entradas ──
 *
 * Del historial real del repo del backend (`../api-tracking-peru`), no de la
 * memoria de nadie: cada línea corresponde a un commit fechado. Pero un changelog
 * NO es un log de commits — se queda con lo que le cambia algo a quien integra y
 * lo dice en su idioma. Por eso no están los 76 commits: no están el workflow de
 * CI, ni los arreglos de deploy, ni el debug de SSH, que son ciertos y no le
 * mueven nada a un cliente.
 *
 * ── Por qué se mantiene a mano ──
 *
 * El backend es otro repo, y su historial no existe dentro de la imagen de este
 * sitio: el `.dockerignore` excluye `.git` y de todos modos sería el `.git`
 * equivocado. Así que esto se escribe, no se genera.
 *
 * Es la excepción, y es deliberada: un changelog es un artefacto curado por
 * definición. Lo que NO puede pasar es que invente. Cada entrada tiene que
 * corresponder a un cambio que ocurrió de verdad, con su fecha real.
 *
 * ── Al agregar una entrada ──
 *
 * Fecha del cambio, no del día que se escribe. Y en primera persona del producto:
 * «ahora los webhooks avisan cuando la suscripción se cierra sola», no
 * «se agregó el evento tracking.failed».
 */

export type TipoCambio = 'nuevo' | 'cambio' | 'arreglo' | 'seguridad'

export interface Cambio {
  tipo: TipoCambio
  /** Qué cambió, para quien integra. Una línea. */
  que: string
  /** El detalle que hace falta para saber si te afecta. Opcional. */
  detalle?: string
}

export interface Entrada {
  /** ISO, la fecha real del cambio. */
  fecha: string
  cambios: Cambio[]
}

export const TIPOS: Record<TipoCambio, { label: string; clase: string }> = {
  nuevo: { label: 'Nuevo', clase: 'text-[var(--color-live)]' },
  cambio: { label: 'Cambio', clase: 'text-[var(--color-partial)]' },
  arreglo: { label: 'Arreglo', clase: 'text-zinc-400' },
  seguridad: { label: 'Seguridad', clase: 'text-[var(--color-method-delete)]' },
}

/** De la más reciente a la más vieja. */
export const CHANGELOG: Entrada[] = [
  {
    fecha: '2026-09-15',
    cambios: [
      {
        tipo: 'cambio',
        que: 'Más envíos vigilados a la vez en todos los planes',
        detalle:
          'El tope de suscripciones simultáneas de webhook sube a 3 en Gratuito, 30 en Básico, 120 en Plus y 500 en Premium.',
      },
    ],
  },
  {
    fecha: '2026-09-14',
    cambios: [
      {
        tipo: 'cambio',
        que: 'Nueva escalera de planes: Gratuito, Básico, Plus y Premium',
        detalle: 'Reemplaza la anterior, con cupos y precios nuevos.',
      },
      {
        tipo: 'nuevo',
        que: 'Panel de cliente, con acceso por enlace de un solo uso',
        detalle:
          'Se entra con un enlace al correo de la cuenta —sin contraseña— y desde ahí se ve el cupo, los errores recientes y se puede rotar la key.',
      },
      {
        tipo: 'nuevo',
        que: 'Nuevo evento de webhook: tracking.failed',
        detalle:
          'Llega cuando una suscripción se cierra sola. Si tu receptor tiene un switch por tipo de evento, conviene agregarle la rama.',
      },
    ],
  },
  {
    fecha: '2026-09-07',
    cambios: [
      {
        tipo: 'cambio',
        que: 'Olva: PRE VALIJA ahora mapea a at_origin',
        detalle: 'Antes llegaba como unknown con su literal en status_raw.',
      },
    ],
  },
  {
    fecha: '2026-09-05',
    cambios: [
      {
        tipo: 'cambio',
        que: 'Olva: PRE DESPACHO mapea a at_origin y RECEPCION DESPACHO a at_destination',
      },
      {
        tipo: 'arreglo',
        que: 'Shalom: el estado de una agencia se lee de los literales reales del courier',
        detalle: 'Antes se infería, y la inferencia no cubría todos los casos.',
      },
    ],
  },
  {
    fecha: '2026-09-03',
    cambios: [
      {
        tipo: 'cambio',
        que: 'Olva: CONFIRMACION EN TIENDA ahora mapea a available_for_pickup',
      },
    ],
  },
  {
    fecha: '2026-09-02',
    cambios: [
      {
        tipo: 'cambio',
        que: 'GET /v1/carriers deja de exponer el método interno en sus notas',
      },
    ],
  },
  {
    fecha: '2026-09-01',
    cambios: [
      {
        tipo: 'arreglo',
        que: 'Olva: un timeline sin fechas sale en orden canónico, del evento más viejo al más nuevo',
      },
    ],
  },
  {
    fecha: '2026-08-31',
    cambios: [
      {
        tipo: 'cambio',
        que: 'Olva: CONFIRMACION RECOJO OFICINA ahora mapea a registered',
      },
    ],
  },
  {
    fecha: '2026-08-17',
    cambios: [
      {
        tipo: 'seguridad',
        que: 'El alta gratuita pasa por un CAPTCHA de Cloudflare Turnstile',
        detalle: 'No cambia nada para quien ya tiene una key.',
      },
    ],
  },
  {
    fecha: '2026-08-07',
    cambios: [
      {
        tipo: 'cambio',
        que: 'Shalom sube a nivel de evidencia live',
        detalle:
          'Su mapeo pasa a estar respaldado por respuestas reales capturadas contra el courier, con acierto y con fallo, en vez de sólo por el contrato.',
      },
      {
        tipo: 'arreglo',
        que: 'Apagar un carrier ya no cancela sus suscripciones de webhook',
        detalle: 'Cuando vuelve a encenderse, las suscripciones siguen donde estaban.',
      },
    ],
  },
  {
    fecha: '2026-08-06',
    cambios: [
      {
        tipo: 'nuevo',
        que: 'Cabeceras X-Quota-* con el cupo mensual en cada respuesta',
        detalle: 'Límite, restante y cuándo se reinicia, sin tener que consultarlo aparte.',
      },
      {
        tipo: 'nuevo',
        que: 'El catálogo de agencias se puede leer sin API key',
        detalle: 'Lectura pública con cupo por IP. Útil para un selector de punto de recojo.',
      },
    ],
  },
  {
    fecha: '2026-08-05',
    cambios: [
      {
        tipo: 'cambio',
        que: 'El plan Gratuito permanente reemplaza al Trial de 4 días',
        detalle: 'No vence y no pide tarjeta.',
      },
      {
        tipo: 'cambio',
        que: 'Sólo las consultas exitosas cuentan contra el tope mensual',
        detalle: 'Una respuesta que no es 2xx ya no te gasta cuota.',
      },
      {
        tipo: 'nuevo',
        que: 'Rastreo operativo de Olva y de Shalom',
      },
      {
        tipo: 'seguridad',
        que: 'Se eliminan los datos personales de terceros de las líneas de observación',
        detalle: 'Los nombres del personal de reparto que algunos couriers incluyen ya no se guardan.',
      },
    ],
  },
  {
    fecha: '2026-08-04',
    cambios: [
      {
        tipo: 'nuevo',
        que: 'Primera versión del API: rastreo y catálogo de agencias unificados',
      },
      {
        tipo: 'nuevo',
        que: 'Límites por plan: ritmo por minuto y tope de suscripciones de webhook',
      },
      {
        tipo: 'nuevo',
        que: 'La key se entrega por correo al darse de alta',
      },
    ],
  },
]

/** La fecha del cambio más reciente. Es la única «última actualización» honesta. */
export const ULTIMO_CAMBIO = CHANGELOG[0].fecha
