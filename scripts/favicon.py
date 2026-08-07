"""Genera `public/favicon.ico` a partir del isotipo.

── Por qué existe este script ──

El `favicon.ico` del repo era el que trae el andamiaje de Astro: el logotipo de
Astro, un PNG de 32×32 con la extensión cambiada a `.ico`, arrastrado desde el
primer commit. En la pestaña de Chrome del sitio desplegado se veía ese icono y
no el nuestro.

Y no alcanzaba con borrarlo: mientras exista un `<link rel="icon">` apuntando a
un `.ico`, hay que servir uno de verdad. Google también prefiere un archivo real
para el icono del resultado de búsqueda.

── Por qué un ICO y no sólo el SVG ──

El SVG cubre a los navegadores modernos y es el que se ve casi siempre. El ICO
es el respaldo: Safari en algunas versiones, el modo de escritorio de Windows y
los rastreadores que sólo buscan `/favicon.ico` por convención, sin leer el HTML.

Lleva tres tamaños en el mismo archivo —16, 32 y 48— porque el sistema elige el
que necesita en vez de reescalar uno solo y ensuciarlo.

── El trazo es más grueso a propósito ──

A 16 px las tres entradas del isotipo se funden con el grosor normal (2) y el
símbolo se vuelve una mancha. Se dibuja con 2.6, igual que la versión del SVG
para tamaños chicos. Es la misma decisión que ya está documentada en
`Logo.astro`: un isotipo bien hecho tiene una versión para tamaños chicos, no se
escala y ya.

Uso:  python3 scripts/favicon.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "public" / "favicon.ico"

LIMA = (163, 230, 53, 255)  # --color-brand
TINTA = (8, 9, 11, 255)  # --color-ink
TAMANOS = [16, 32, 48]

# Se dibuja cada tamaño 8× más grande y se reduce con LANCZOS: Pillow no
# antialiasa las líneas, así que el suavizado sale del downsample.
ESCALA = 8


def isotipo(draw, lado, grosor):
    """El mismo trazado que `Logo.astro`, muestreando las curvas de verdad.

    Pillow no dibuja curvas, así que las bézier del `path` del SVG
    —`M3 5c5 0 5 7 9 7 · M3 12h9 · M3 19c5 0 5-7 9-7 · M12 12h9`— se muestrean
    punto a punto. Aproximarlas con una polilínea de cuatro puntos da un tenedor
    en vez de una convergencia; ya pasó al hacer la og:image.
    """
    u = lado / 24

    def pt(x, y):
        return (x * u, y * u)

    def bezier(p0, p1, p2, p3, n=60):
        out = []
        for i in range(n + 1):
            t = i / n
            m = 1 - t
            out.append(
                (
                    m**3 * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t**3 * p3[0],
                    m**3 * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t**3 * p3[1],
                )
            )
        return out

    g = max(2, round(grosor * u))

    # Las dos entradas curvas, arriba y abajo, espejadas.
    for y0 in (5, 19):
        c = 7 if y0 == 5 else -7
        draw.line(
            bezier(pt(3, y0), pt(8, y0), pt(8, y0 + c), pt(12, y0 + c)),
            fill=TINTA,
            width=g,
            joint="curve",
        )
    # La entrada recta y la salida única.
    draw.line([pt(3, 12), pt(9, 12)], fill=TINTA, width=g)
    draw.line([pt(12, 12), pt(21, 12)], fill=TINTA, width=g)

    # Las puntas redondeadas (`stroke-linecap="round"` en el SVG). Sin esto los
    # extremos quedan cortados en escuadra y a 16 px se nota como suciedad.
    r = g / 2
    for x, y in (pt(3, 5), pt(3, 12), pt(3, 19), pt(21, 12)):
        draw.ellipse([x - r, y - r, x + r, y + r], fill=TINTA)


def capa(lado):
    """Un cuadrado lima con esquinas redondeadas y el isotipo encima."""
    L = lado * ESCALA
    im = Image.new("RGBA", (L, L), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # El radio sale de la misma proporción del SVG: rx=5 sobre un lienzo de 24.
    d.rounded_rectangle([0, 0, L - 1, L - 1], radius=int(L * 5 / 24), fill=LIMA)
    isotipo(d, L, 2.6)
    return im.resize((lado, lado), Image.LANCZOS)


def main():
    # De mayor a menor: Pillow sólo puede meter en el .ico tamaños que quepan
    # dentro de la imagen base. Guardando desde la de 16 salía un archivo con
    # UN icono —lo dijo `file`— aunque `sizes` pidiera tres.
    capas = [capa(t) for t in sorted(TAMANOS, reverse=True)]

    # `append_images` conserva los tres dibujos que hicimos, cada uno rasterizado
    # a su tamaño. Sin esto Pillow reduciría el de 48 para fabricar los otros dos
    # y perderíamos el ajuste que hace que a 16 px el símbolo siga leyéndose.
    capas[0].save(
        SALIDA,
        format="ICO",
        sizes=[(t, t) for t in sorted(TAMANOS, reverse=True)],
        append_images=capas[1:],
    )
    print(f"✓ {SALIDA.relative_to(RAIZ)} — {SALIDA.stat().st_size} bytes, tamaños {TAMANOS}")


if __name__ == "__main__":
    main()
