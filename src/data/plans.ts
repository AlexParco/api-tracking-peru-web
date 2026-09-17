

/**
 * Los planes de acceso. Escalera del 2026-09-15.
 *
 * Aparte de `api.ts` a propósito: eso espeja el estado del backend, esto es una
 * decisión comercial. Se mueven por motivos distintos y en momentos distintos.
 *
 * ── Esta tabla ESPEJA al backend, y esa es la regla ──
 *
 * Los cuatro niveles, los precios y los cupos salen de `store.Plan` en
 * `api-tracking-peru` (`internal/store/apikeys_repo.go`, commits 8242758 y
 * 488c855). No se eligen acá:
 *
 *   nivel      S/ mes   S/ año   rpm   vigilados   consultas/mes   crea envíos
 *   Gratuito        0        0    30           3           1.000   no
 *   Básico         39      390    60          30          10.000   sí
 *   Plus           89      890   120         120          50.000   sí
 *   Premium       249    2.490   300         500        sin tope   sí
 *
 * Que la web invente un número es exactamente cómo un cliente termina leyendo
 * «Pro S/ 99» acá y recibiendo un `plus_mensual` de S/ 89 en el correo. Si el
 * backend mueve un cupo, esta tabla se mueve detrás, no al revés.
 *
 * ── El medidor son los ENVÍOS VIGILADOS a la vez ──
 *
 * Es el `DefaultMaxSubs` del plan, y es lo que alinea nuestro costo con el valor
 * del cliente: cada suscripción hace pollear, y en algunos carriers cada consulta
 * nos sale cara. Por eso el salto de capacidad es ×4 por
 * escalón contra un precio que sube ×2,3: el costo por envío BAJA con el
 * volumen (S/0,17 → S/0,10 → S/0,066), que premia subir de nivel en vez de
 * castigarlo.
 *
 * El RPM NO es el gancho: es un guardarraíl anti-ráfaga. Sube con el nivel por
 * margen, pero nadie compra por eso, y la página lo dice así.
 *
 * ── Las consultas de rastreo ya NO son «sin tope» en los pagos ──
 *
 * Lo eran en la escalera vieja y era falso desde el 2026-09-14: hoy Básico tiene
 * 10.000 al mes y Plus 50.000 (`MonthlyOnDemandCap`). Son topes altos a
 * propósito —10.000 son ~330 por día, no es fricción para nadie que use el
 * servicio normal— y existen como freno contra el que satura nuestra capacidad. Sólo
 * Premium y los negociados van sin tope.
 *
 * ── Crear envíos empieza en Básico ──
 *
 * `Plan.PuedeCrearEnvios()` deja al Gratuito fuera a propósito: crear un envío
 * genera una guía real con un courier, es un acto comercial y no una prueba del
 * API. El Gratuito sigue siendo para evaluar el rastreo.
 *
 * ── No hay quinto nivel ──
 *
 * Había una banda «Enterprise desde S/ 349» anclada al Pro viejo de S/ 99. Se
 * quitó el 2026-09-15: la tabla publica exactamente los cuatro planes que el
 * backend sabe emitir, y quien necesita más escribe por el mismo correo que
 * todos. Publicar un piso que no está respaldado por ningún plan del backend es
 * la misma clase de mentira que los precios viejos.
 *
 * ── Se contrata por CORREO ──
 *
 * No hay checkout y no está previsto por ahora: el cobro automático por
 * MercadoPago quedó en pausa hasta poder validar la firma de sus webhooks. Con
 * cero clientes pagos, cobrar a mano sale más barato que automatizar. `planLink`
 * manda los pagos a un `mailto:` y el botón dice «Contratar por correo», que es
 * literalmente lo que pasa al tocarlo.
 *
 * ── Ninguno va marcado como recomendado ──
 *
 * Hubo un `featured` que destacaba un plan con insignia y botón relleno. Se
 * quitó entero, no se puso en `false`: un campo que nadie usa es una invitación
 * a volver a encenderlo sin recordar por qué se apagó. Recomendar un plan sin
 * saber el volumen de quien lee es un empujón, no un consejo.
 *
 * ── El Gratuito es permanente, y no es caridad ──
 *
 * Reemplaza al trial de 4 días. Un trial que vence empuja al usuario afuera justo
 * cuando empezó a mandar tráfico — y ese tráfico es lo que alimenta al observador
 * de estados sin mapear, o sea que los usuarios gratis son la fábrica de datos
 * que completa los vocabularios. Está limitado donde CUESTA (pocos envíos
 * vigilados y tope mensual de consultas), no donde luce.
 */

export interface Plan {
  id: string
  name: string
  /** S/ por mes. `0` = gratis, `null` = a convenir. */
  monthly: number | null
  /** S/ por año. `0` = gratis, `null` = a convenir. */
  annual: number | null
  /**
   * Piso de precio cuando el plan se negocia («desde S/ 349»).
   *
   * Hoy no lo usa ninguno —la tabla son los cuatro planes del backend, todos con
   * precio—. Se conserva el campo para el día que vuelva un nivel negociado.
   */
  monthlyFrom?: number
  /** Guardarraíl de requests por minuto. `null` = negociado. */
  rpm: number | null
  /** Envíos suscritos a webhooks a la vez. Es el medidor. `null` = negociado. */
  webhooks: number | null
  /** Para cuando el número solo se queda corto («200+»). */
  webhooksLabel?: string
  /**
   * Órdenes que se pueden CREAR por mes. `null` = negociado.
   *
   * Vive apagado detrás de `ORDERS.enabled` — ver el comentario de esa bandera.
   */
  orders: number | null
  /** Para cuando el número solo se queda corto, o cuando no aplica. */
  ordersLabel?: string
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
    name: 'Gratuito',
    monthly: 0,
    annual: 0,
    rpm: 30,
    webhooks: 3,
    orders: 0,
    ordersLabel: 'no incluido',
    queries: 'hasta 1.000 al mes',
    support: 'documentación y comunidad',
    summary: 'Para integrar el rastreo, probarlo en serio y quedarte. No vence.',
    free: true,
  },
  {
    id: 'basico',
    name: 'Básico',
    monthly: 39,
    annual: 390,
    rpm: 60,
    webhooks: 30,
    orders: 120,
    queries: 'hasta 10.000 al mes',
    support: 'por correo',
    summary: 'La primera operación con envíos todas las semanas.',
  },
  {
    id: 'plus',
    name: 'Plus',
    monthly: 89,
    annual: 890,
    rpm: 120,
    webhooks: 120,
    orders: 500,
    queries: 'hasta 50.000 al mes',
    support: 'prioritario',
    summary: 'Volumen sostenido y respuesta rápida cuando algo se rompe.',
  },
  {
    id: 'premium',
    name: 'Premium',
    monthly: 249,
    annual: 2490,
    rpm: 300,
    webhooks: 500,
    orders: 2000,
    queries: 'sin tope',
    support: 'prioritario',
    summary: 'Picos fuertes, la mayor capacidad publicada y consultas sin tope.',
  },
]


/**
 * CREAR ÓRDENES — el segundo eje del medidor.
 *
 * Los cupos de `orders` NO se eligieron aparte de los de webhook: un envío en
 * tránsito ocupa un webhook activo alrededor de una semana, así que un plan que
 * sostiene N envíos vigilados a la vez sostiene del orden de N × 4 al mes. Si
 * los dos ejes se eligieran por separado, uno mordería antes que el otro y el
 * segundo sería decorativo.
 *
 * La bandera existe para poder publicar el eje sólo cuando el endpoint lo
 * respalde: anunciar un cupo de órdenes antes de que exista sería vender algo
 * que el producto no hace, justo en el sitio cuyo diferencial es publicar
 * cuánta evidencia respalda cada cosa.
 */
export const ORDERS = {
  enabled: true,
}

/** Lo que trae cualquier key. Lo que cambia entre niveles es el cupo, no esto. */
export const INCLUDED_IN_ALL: string[] = [
  'Todos los carriers — ninguno queda reservado para el plan caro',
  'Todos los endpoints: rastreo, agencias y cobertura por ubigeo',
  'Webhooks firmados con HMAC, con reintentos y deduplicación',
  'Cada carrier con su nivel de evidencia publicado',
  'Los carriers que se vayan completando, sin costo extra',
]

/**
 * El cardinal en letra, para la prosa.
 *
 * «Los 6 llegan a los mismos endpoints» se lee como una ficha técnica; en una
 * frase el número va en palabra. Pero escribirlo a mano es cómo la página
 * terminó diciendo «los cuatro» con seis planes en pantalla, así que se deriva
 * del largo del array y cae al dígito si algún día hay más de los previstos.
 */
export const cuantos = (n: number) =>
  ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'][n] ??
  String(n)

/**
 * Millares con punto, siempre.
 *
 * `toLocaleString` no sirve acá y probarlo costó dos vueltas: `es-PE` agrupa con
 * COMA («1,000») y `es-ES` no agrupa los números de cuatro cifras («1000»),
 * porque la ortografía española dice que a partir de cinco. Las dos son
 * correctas y las dos discrepan del texto que el sitio ya tiene escrito a mano
 * —«hasta 1.000 al mes»—, y una tabla donde el número calculado y el escrito no
 * se ven iguales es peor que una que ignora la regla ortográfica.
 */
export const miles = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')

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
 * El gratuito va al formulario —son dos campos y la key sale sola—. Los pagos
 * abren un `mailto:` con el plan en el asunto, porque así se contratan: no hay
 * checkout y no está previsto mientras el cobro automático siga en pausa.
 *
 * Es deliberado que NO haya un botón que diga «Pagar» y abra un correo. El botón
 * dice lo que hace; prometer un checkout y entregar un mail es peor que ofrecer
 * el mail de entrada.
 */
export const planLink = (p: Plan) =>
  p.free
    ? '#get-started'
    : `mailto:hola@tracking-peru.com?subject=${encodeURIComponent(`Contratar el plan ${p.name}`)}`

export const freeLink = '#get-started'
