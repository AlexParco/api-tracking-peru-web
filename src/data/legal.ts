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
  // ⚠ PENDIENTE — mientras esté en null la página no se indexa ni se enlaza.
  nombre: null,
  // Todavía no hay empresa constituida: se quedan en null y la página lo dice.
  ruc: null,
  domicilio: null,
}

/** Con un responsable identificable alcanza para publicar. */
export const COMPLETA = typeof RESPONSABLE.nombre === 'string' && RESPONSABLE.nombre.length > 0

/** Correo de contacto y de ejercicio de derechos. Éste sí está publicado hoy. */
export const CONTACTO = 'hola@tracking-peru.com'

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
    plazo: null,
    detalle:
      'El correo y el nombre con los que se creó la cuenta, mientras la cuenta exista. Al darla de baja se eliminan junto con sus keys.',
  },
  {
    concepto: 'Envíos creados y su rastreo',
    plazo: null,
    detalle:
      'Los datos que el cliente envía para generar una guía y los eventos que devuelve el courier. Se conservan mientras el envío siga en curso y un tiempo después para poder responder reclamos.',
  },
  {
    concepto: 'Registros técnicos',
    plazo: null,
    detalle:
      'Fecha, hora, IP y endpoint de cada llamada, para medir cuota, detectar abuso y diagnosticar fallas.',
  },
]
