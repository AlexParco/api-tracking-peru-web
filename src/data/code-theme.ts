/* El tema de los bloques de código.
 *
 * Es un tema de Shiki escrito a mano en vez de uno de los ~60 que vienen de
 * fábrica, y el motivo es el mismo que gobierna el resto de la paleta: en esta
 * página el color DICE algo. El verde-lima es «funciona / verificado», el ámbar
 * es «implementado, sin evidencia todavía» y el zinc es cromo. Un tema prestado
 * —GitHub Dark, Vitesse, el que sea— mete azules, violetas y rojos que no
 * significan nada acá y que compiten con la tabla de cobertura, que es donde el
 * color sí es información.
 *
 * Así que el mapeo es el de la marca, no el de un editor:
 *   · el VALOR de un string va en verde de marca — es el dato que devolvemos;
 *   · los números y los literales (`true`, `false`, `null`) van en ámbar, el
 *     mismo tono del estado parcial: son los campos booleanos del contrato
 *     (`delivered`, `terminal`, `enabled`) y conviene que salten;
 *   · las CLAVES quedan en zinc claro, porque son la estructura, no el dato;
 *   · toda la puntuación —llaves, corchetes, comas, dos puntos, y las comillas
 *     de las claves— se apaga a zinc-700. Un JSON está hecho en un 40 % de
 *     signos; en el mismo tono que el contenido, se lee como ruido.
 *
 * Los scopes están escritos con el sufijo de lenguaje (`.json`, `.shell`) a
 * propósito: `punctuation.definition.string` a secas tocaría los dos y no se
 * podría apagar las comillas de una clave JSON sin apagar también las de una
 * URL en el curl. Shiki resuelve por especificidad, así que el scope largo
 * gana.
 *
 * Todo esto corre en tiempo de BUILD. Shiki ya viene dentro de Astro y el
 * componente `<Code />` emite HTML con los colores en línea: no se descarga
 * ninguna librería de resaltado ni se ejecuta un solo byte de JavaScript en el
 * navegador para pintar un bloque de código. Es la misma razón por la que la
 * página no tiene bundle.
 */

/* Los valores están duplicados de `global.css` porque un `@theme` de Tailwind
   vive en CSS y esto se evalúa en Node al construir: no hay forma de leer una
   custom property desde acá. Si cambia la paleta, cambian los dos. */
const BRAND = '#a3e635' /* --color-brand */
const BRAND_DIM = '#65a30d' /* --color-brand-dim */
const PARTIAL = '#fbbf24' /* --color-partial */
const INK_SOFT = '#0e1014' /* --color-ink-soft */

const ZINC_100 = '#f4f4f5'
const ZINC_300 = '#d4d4d8'
const ZINC_400 = '#a1a1aa'
const ZINC_600 = '#52525b'
const ZINC_700 = '#3f3f46'

/** El tipo exacto de Shiki es más ancho que esto; lo que usa `<Code />` es esto. */
export interface CodeTheme {
  name: string
  type: 'dark'
  colors: Record<string, string>
  settings: { scope?: string | string[]; settings: { foreground?: string; fontStyle?: string } }[]
}

export const CODE_THEME: CodeTheme = {
  name: 'tracking-peru',
  type: 'dark',

  colors: {
    /* El mismo fondo que la caja del componente. Shiki lo escribe como estilo en
       línea del `<pre>`; si acá dijera otra cosa se vería un rectángulo de otro
       tono adentro del borde. */
    'editor.background': INK_SOFT,
    'editor.foreground': ZINC_300,
  },

  settings: [
    /* El caso por defecto: lo que ninguna regla alcance. */
    { settings: { foreground: ZINC_300 } },

    /* ── Puntuación ──
       Primero, y a propósito: las reglas de abajo son más específicas y la
       pisan donde corresponde (las comillas de un VALOR string no se apagan
       tanto como las de una clave, ver más abajo). */
    {
      scope: [
        'punctuation.definition.dictionary.begin.json',
        'punctuation.definition.dictionary.end.json',
        'punctuation.definition.array.begin.json',
        'punctuation.definition.array.end.json',
        'punctuation.separator.dictionary.key-value.json',
        'punctuation.separator.dictionary.pair.json',
        'punctuation.separator.array.json',
        /* Las comillas de una CLAVE. Van más apagadas que la clave misma para
           que la vista agarre la palabra y no el signo. */
        'punctuation.support.type.property-name.begin.json',
        'punctuation.support.type.property-name.end.json',
      ],
      settings: { foreground: ZINC_700 },
    },

    /* ── JSON ── */
    /* La clave: estructura del contrato. Zinc claro, no color. */
    { scope: 'support.type.property-name.json', settings: { foreground: ZINC_300 } },
    /* El valor: el dato. Verde de marca. */
    { scope: 'string.quoted.double.json', settings: { foreground: BRAND } },
    /* Sus comillas, en el verde apagado: siguen leyéndose como parte del string
       —no como puntuación neutra— pero no le roban peso al contenido. */
    {
      scope: ['punctuation.definition.string.begin.json', 'punctuation.definition.string.end.json'],
      settings: { foreground: BRAND_DIM },
    },
    /* `true` / `false` / `null` y los números. Ámbar: en este API los booleanos
       del contrato (`delivered`, `terminal`, `enabled`) son lo que se lee
       primero de una respuesta. */
    {
      scope: ['constant.language.json', 'constant.numeric.json'],
      settings: { foreground: PARTIAL },
    },

    /* ── Shell ──
       El comando en blanco y sus argumentos en zinc: la jerarquía de un
       terminal. Si hubiera un `$` de prompt caería acá también, y por eso los
       snippets del sitio no lo llevan — un prompt pegado rompe el comando al
       copiarlo. */
    { scope: 'entity.name.command.shell', settings: { foreground: ZINC_100 } },
    {
      scope: ['string.unquoted.argument.shell', 'meta.argument.shell'],
      settings: { foreground: ZINC_400 },
    },
    /* Las banderas (`-H`, `-X`). Verde apagado: son de la forma del comando, no
       del dato, así que no compiten con la URL. */
    {
      scope: ['constant.other.option', 'constant.other.option.dash.shell'],
      settings: { foreground: BRAND_DIM },
    },
    /* Lo entrecomillado —la URL, el header— es el dato del comando. */
    { scope: 'string.quoted.double.shell', settings: { foreground: BRAND } },
    {
      scope: [
        'punctuation.definition.string.begin.shell',
        'punctuation.definition.string.end.shell',
      ],
      settings: { foreground: BRAND_DIM },
    },
    /* `$API_KEY`: es un hueco que el lector tiene que rellenar, así que va en el
       mismo ámbar que dice «esto todavía no está resuelto». */
    {
      scope: ['variable.other.normal.shell', 'punctuation.definition.variable.shell'],
      settings: { foreground: PARTIAL },
    },
    /* La barra de continuación de línea es andamiaje. */
    {
      scope: 'constant.character.escape.line-continuation.shell',
      settings: { foreground: ZINC_600 },
    },

    /* ── HTTP crudo ──
       Es el ejemplo del webhook: línea de petición, cabeceras y, después de la
       línea en blanco, el cuerpo. La gramática `http` embebe la de JSON en el
       cuerpo, así que las reglas de arriba ya lo pintan solas y acá sólo falta
       el sobre. */
    /* El verbo. Es lo que hay que implementar del otro lado. */
    { scope: 'keyword.control.http', settings: { foreground: BRAND } },
    /* La ruta (el scope se llama `const.language.http`, sin la `a`: así viene en
       la gramática, no es un error de acá). */
    { scope: 'const.language.http', settings: { foreground: ZINC_100 } },
    /* `HTTP/1.1` y los dos puntos: protocolo, no contenido. */
    {
      scope: ['keyword.other.http', 'constant.numeric.http', 'http.version'],
      settings: { foreground: ZINC_600 },
    },
    /* Nombre de cabecera en zinc medio y su valor un punto más claro: el valor
       es el dato (la firma, el id del evento) y es lo que se va a leer. */
    { scope: 'entity.name.tag.http', settings: { foreground: ZINC_400 } },
    { scope: 'string.other.http', settings: { foreground: ZINC_300 } },

    /* ── Comentarios, en cualquier lenguaje ── */
    { scope: 'comment', settings: { foreground: ZINC_600, fontStyle: 'italic' } },
  ],
}
