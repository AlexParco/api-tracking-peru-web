/**
 * Quién responde por los datos, y cuánto se conserva cada cosa.
 *
 * ── Por qué están acá y no escritos en la página ──
 *
 * Son lo único de la política de privacidad que no se puede deducir del código.
 * Todo lo demás —qué datos entran por el API, qué terceros carga la web, qué se
 * limpia antes de servirse— sale de `api.ts`, de los formularios y del `<head>`,
 * y por eso se escribe una sola vez.
 *
 * ── Persona natural, no empresa ──
 *
 * La Ley 29733 define al titular del banco de datos como «persona natural o
 * jurídica»: no hace falta una empresa constituida para tener una política
 * válida, hace falta alguien identificable a quien reclamarle. Hoy detrás de este
 * servicio hay una persona, y la página lo dice así en vez de imitar el tono de
 * una empresa que no existe — que además es lo que un área de compras detecta a
 * la primera.
 *
 * `ruc` y `domicilio` son opcionales a propósito. Si algún día hay empresa
 * constituida se completan y la página los publica sola, sin tocar nada más.
 *
 * ── Qué pasa mientras `nombre` esté en null ──
 *
 * La página se sirve en modo BORRADOR: `noindex`, fuera del sitemap y sin enlace
 * en el pie. Una política que no identifica a nadie no sirve para lo que se
 * escribió —que un área de compras la acepte— y encima queda indexada como la
 * versión oficial de algo a lo que nadie le puede reclamar.
 */

export interface Responsable {
  /**
   * Quién responde: el nombre de la persona natural que opera el servicio, o la
   * razón social si algún día hay empresa. Es el único campo obligatorio — sin él
   * no hay a quién dirigirse, que es justo lo que la política tiene que resolver.
   */
  nombre: string | null
  /** Sólo si hay empresa constituida. En null, la página no finge que la hay. */
  ruc: string | null
  /** Domicilio para notificaciones. Opcional mientras el canal sea el correo. */
  domicilio: string | null
}

export const RESPONSABLE: Responsable = {
  // Persona natural que opera el servicio. Es el único campo que la política
  // necesita para publicarse.
  nombre: 'Alexander Parco Flores',
  // Todavía no hay empresa constituida: se quedan en null y la página lo dice.
  ruc: null,
  domicilio: null,
}

/** Con un responsable identificable alcanza para publicar. */
export const COMPLETA = typeof RESPONSABLE.nombre === 'string' && RESPONSABLE.nombre.length > 0

/** Correo de contacto y de ejercicio de derechos. Éste sí está publicado hoy. */
export const CONTACTO = 'hola@tracking-peru.com'

/**
 * Desde cuándo rige la versión publicada de los documentos legales.
 *
 * A mano, y a propósito: acá la fecha del build sería una mentira útil. Un
 * documento legal cambia cuando alguien decide cambiarlo, no cuando se recompila
 * el sitio, y quien lo revisa necesita saber qué versión aceptó. Se toca sólo al
 * modificar el texto de /privacy o /terms.
 */
export const VIGENCIA = '2026-09-17'

/**
 * Cuánto se conserva cada cosa.
 *
 * La ley no fija un plazo único: pide que sea el necesario para la finalidad y
 * que esté declarado. Los valores de acá son los que la política publica, así que
 * tienen que coincidir con lo que el backend hace de verdad — si mañana se cambia
 * el borrado, se cambia acá.
 *
 * `null` = todavía no hay un borrado automático que respalde un plazo. La página
 * lo dice con todas las letras en vez de inventar uno: publicar «12 meses» sin que
 * nadie borre a los 12 meses es declarar en falso, y una declaración falsa es peor
 * que una ausencia — la primera se puede sancionar.
 */
export interface Retencion {
  concepto: string
  plazo: string | null
  detalle: string
}

export const RETENCION: Retencion[] = [
  {
    concepto: 'Cuenta y API key',
    plazo: 'mientras la cuenta exista',
    detalle:
      'El correo y el nombre con los que se creó la cuenta. Revocar una key corta su acceso de inmediato, pero el registro de la key y la fecha en que se revocó se conservan: es el dato que se mira si hay que reconstruir un incidente. No hay borrado automático de cuentas; se hace a pedido, escribiendo al correo de contacto.',
  },
  {
    concepto: 'Envíos creados y su rastreo',
    plazo: null,
    detalle:
      'Los datos que envías para generar una guía y los eventos que devuelve el courier. Se conservan mientras el envío siga en curso y un tiempo después para poder responder reclamos. Todavía no hay un borrado automático que fije un plazo, y por eso no declaramos uno.',
  },
  {
    concepto: 'Uso del API',
    plazo: 'mientras la cuenta exista',
    detalle:
      'Un contador por día, key y endpoint, con la clase de respuesta. Es un agregado para medir cuota: no guarda el detalle de cada llamada ni el contenido de lo que consultaste.',
  },
  {
    concepto: 'Errores recientes',
    plazo: 'sólo los últimos, los más viejos se borran solos',
    detalle:
      'Para que puedas diagnosticar desde tu panel: identificador de la petición, fecha, método, endpoint, código de estado y mensaje de error. La tabla está acotada y va descartando los más antiguos a medida que entran nuevos.',
  },
  {
    concepto: 'Direcciones IP',
    plazo: 'no se almacenan',
    detalle:
      'La IP se usa en memoria y por unos segundos para detectar ráfagas de intentos de autenticación fallidos, y se descarta sola. No queda registrada en ninguna tabla ni asociada a tu cuenta.',
  },
]
