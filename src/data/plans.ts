

/**
 * Los planes de acceso. Estructura del 2026-08-05.
 *
 * Aparte de `api.ts` a propósito: eso espeja el estado del backend, esto es una
 * decisión comercial. Se mueven por motivos distintos y en momentos distintos.
 *
 * ── El modelo: tamaño × período ──
 *
 * Cuatro NIVELES —Free, Básico, Pro y a medida—, y los pagos se cobran por mes o
 * por año. El nivel es el TAMAÑO; el período es sólo la forma de pagarlo, con
 * descuento por comprometerse. Antes estaban mezclados («Mensual» era un plan) y
 * eso hacía imposible decir «el Pro anual».
 *
 * ── El medidor es el webhook, no la consulta ──
 *
 * Lo que separa un nivel de otro es cuántos envíos puedes tener vigilados a la
 * vez. Es la única métrica que alinea lo que le cuesta al servicio con lo que le
 * sirve al cliente: cada suscripción hace que un poller consulte sola, y en
 * algunos carriers cada consulta cuesta de verdad.
 *
 * El RPM NO es el gancho: es un guardarraíl anti-ráfaga. Sube un poco en Pro por
 * margen, pero nadie compra por eso, y la página lo dice así.
 *
 * ── Ninguno va marcado como recomendado ──
 *
 * Hubo un `featured` que destacaba al Pro con insignia, borde teñido y botón
 * relleno. Se quitó entero, no se puso en `false`: un campo que nadie usa es
 * una invitación a volver a encenderlo sin recordar por qué se apagó.
 *
 * El motivo: recomendar un plan sin saber el volumen de quien lee es un
 * empujón, no un consejo. Lo que separa un nivel de otro es cuántos envíos
 * tiene vigilados a la vez, y eso lo sabe el cliente. Las cuatro tarjetas se
 * ven igual y la comparación queda a la vista.
 *
 * ── Free es permanente, y no es caridad ──
 *
 * Reemplaza al trial de 4 días. Un trial que vence empuja al usuario afuera justo
 * cuando empezó a mandar tráfico — y ese tráfico es lo que alimenta al observador
 * de estados sin mapear, o sea que los usuarios gratis son la fábrica de datos
 * que completa los vocabularios. Free está limitado donde CUESTA (pocos webhooks
 * y tope mensual de consultas), no donde luce.
 */

export interface Plan {
  id: string
  name: string
  /** S/ por mes. `0` = gratis, `null` = a convenir. */
  monthly: number | null
  /** S/ por año. `0` = gratis, `null` = a convenir. */
  annual: number | null
  /** Guardarraíl de requests por minuto. `null` = negociado. */
  rpm: number | null
  /** Envíos suscritos a webhooks a la vez. Es el medidor. `null` = negociado. */
  webhooks: number | null
  /** Para cuando el número solo se queda corto («200+»). */
  webhooksLabel?: string
  /** Consultas de rastreo por mes. */
  queries: string
  support: string
  summary: string
  /** El gratuito: no vence y no se cobra. */
  free?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    annual: 0,
    rpm: 30,
    webhooks: 3,
    queries: 'hasta 1.000 al mes',
    support: 'documentación y comunidad',
    summary: 'Para integrar, probar en serio y quedarte. No vence.',
    free: true,
  },
  {
    id: 'basico',
    name: 'Básico',
    monthly: 25,
    annual: 250,
    rpm: 60,
    webhooks: 50,
    queries: 'sin tope',
    support: 'por correo',
    summary: 'Cuando el rastreo ya es parte de tu operación.',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 79,
    annual: 790,
    rpm: 120,
    webhooks: 200,
    queries: 'sin tope',
    support: 'prioritario',
    summary: 'Volumen alto y respuesta rápida cuando algo se rompe.',
  },
  {
    id: 'custom',
    name: 'A medida',
    monthly: null,
    annual: null,
    rpm: null,
    webhooks: null,
    webhooksLabel: '200+',
    queries: 'sin tope, con SLA',
    support: 'dedicado, con SLA',
    summary: 'Volumen alto, requisitos propios o facturación distinta.',
  },
]

/**
 * La beta, mientras el producto no está terminado.
 *
 * Es del PRODUCTO ENTERO, no por carrier. Esto estuvo mal escrito una vez —decía
 * que Olva y Shalom no se cobraban— y es un error de encuadre por dos motivos:
 * un carrier que responde 501 ya genera cero uso facturable solo (no se puede
 * suscribir y la consulta falla), así que la excepción era redundante; y
 * facturar por carrier choca de frente con «todos los planes tienen todos los
 * carriers», que es la propuesta de valor.
 *
 * La regla real es carrier-agnóstica y mejor: lo que NO funciona no gasta cuota.
 */
/*
 * Las otras dos decisiones de la beta NO son campos de este objeto, y eso es
 * deliberado.
 *
 * - La beta termina cuando los cinco carriers rastreen en vivo. Es un hito
 *   medible en vez de «cuando esté completo», pero es una discusión nuestra:
 *   al cliente no le cambia nada y lo obliga a seguir nuestra hoja de ruta.
 * - Lo que no funciona no gasta cuota. Eso es comportamiento del API y vive en
 *   `/docs`, junto al resto del contrato.
 *
 * Estuvieron como propiedades de `BETA` y se filtraron igual: se quitaron de la
 * sección de precios pero quedaron en el cierre de la portada, y así salieron a
 * producción. Un comentario que dice «esto no se publica» no impide publicarlo;
 * no exportar el valor, sí.
 */
export const BETA = {
  /** Quien entra ahora conserva el precio de hoy aunque suba después. */
  priceLock: true,
  /**
   * En beta se muestra SÓLO el plan gratis; los pagos aparecen al salir. Es una
   * decisión de presentación: todavía no hay checkout (el cobro se coordina por
   * correo), así que mostrar precios que no se pueden pagar suma fricción sin
   * cerrar una venta. Un booleano lo revierte cuando el cobro esté listo.
   */
  onlyFree: true,
}

/**
 * Lo que trae cualquier key. Lo que cambia entre niveles es el cupo, no esto.
 *
 * Va DESPUÉS de `BETA` porque la primera viñeta depende de la bandera: con
 * `onlyFree` puesto no hay «plan caro» que nombrar —el único plan es el gratis—
 * y mencionarlo obliga a hablar de algo que todavía no se puede comprar. Al
 * salir de la beta vuelve la redacción que compara, que ahí sí es el argumento.
 */
export const INCLUDED_IN_ALL: string[] = [
  BETA.onlyFree
    ? 'Todos los carriers — ninguno queda fuera de tu key'
    : 'Todos los carriers — ninguno queda reservado para el plan caro',
  'Todos los endpoints: rastreo, agencias y cobertura por ubigeo',
  'Webhooks firmados con HMAC, con reintentos y deduplicación',
  'Cada carrier con su nivel de evidencia publicado',
  'Los carriers que se vayan completando, sin costo extra',
]

/**
 * El ahorro de pagar por año, calculado y no escrito. Un «2 meses gratis» a mano
 * sobrevive al cambio de precio que lo vuelve falso.
 */
export const annualSaving = (p: Plan) => {
  if (!p.monthly || !p.annual) return null
  const twelveMonths = p.monthly * 12
  const saved = twelveMonths - p.annual
  return {
    soles: saved,
    months: Math.round((saved / p.monthly) * 10) / 10,
    percent: Math.round((saved / twelveMonths) * 100),
  }
}

/*
 * Tres invariantes. Las tres se rompen igual: editando una fila y olvidando otra.
 *
 * 1. Pagar por año tiene que salir menos que doce meses sueltos.
 * 2. Un nivel más caro no puede tener menos cupo que uno más barato — ni el
 *    gratuito puede igualar al primero pago, o nadie tendría motivo para pagarlo.
 * 3. Tiene que haber exactamente un plan gratuito.
 */
for (const p of PLANS) {
  const saving = annualSaving(p)
  if (saving && saving.soles <= 0) {
    throw new Error(
      `Plan ${p.name}: S/ ${p.annual} al año no ahorra contra doce meses de S/ ${p.monthly}.`,
    )
  }
}

{
  const escalables = PLANS.filter((p) => p.monthly !== null).sort(
    (a, b) => (a.monthly ?? 0) - (b.monthly ?? 0),
  )
  for (let i = 1; i < escalables.length; i++) {
    const cheaper = escalables[i - 1]
    const pricier = escalables[i]
    for (const field of ['rpm', 'webhooks'] as const) {
      if ((pricier[field] ?? 0) <= (cheaper[field] ?? 0)) {
        throw new Error(
          `El plan ${pricier.name} cuesta más que ${cheaper.name} pero no le gana en ${field} ` +
            `(${pricier[field]} contra ${cheaper[field]}).`,
        )
      }
    }
  }

  const gratis = PLANS.filter((p) => p.free)
  if (gratis.length !== 1) {
    throw new Error(`Tiene que haber exactamente un plan gratuito; hay ${gratis.length}.`)
  }
}

export const FREE = PLANS.find((p) => p.free)!

/**
 * Adónde manda el botón de cada plan.
 *
 * El gratuito va al formulario —son dos campos, no debería costar abrir un
 * cliente de correo—. Los pagos siguen en `mailto:` porque el link de pago
 * todavía no existe: falta elegir procesador y desplegar. Cuando exista, esto
 * devuelve la URL del checkout y no cambia nada más de la página.
 *
 * Es deliberado que NO haya un botón que diga «Pagar» y abra un correo. Prometer
 * un checkout y entregar un mail es peor que ofrecer el mail de entrada.
 */
export const planLink = (p: Plan) =>
  p.free
    ? '#empezar'
    : `mailto:hola@tracking-peru.com?subject=${encodeURIComponent(`Acceso al API — plan ${p.name}`)}`

export const freeLink = '#empezar'
