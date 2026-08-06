"""
Genera la imagen de vista previa (og:image) para redes y mensajería.

Se dibuja acá y no a mano en un editor para que pueda regenerarse cuando cambie
el estado del producto — el pie lleva cuántos couriers rastrean y cuántas
agencias hay sincronizadas, y esos números salen de `src/data/api.ts`.

Sale PNG y no SVG a propósito: WhatsApp, Slack y X no renderizan SVG en las
vistas previas. Es el formato o no hay preview.
"""
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
W, H = 1200, 630

INK, INK_SOFT, LINE = (8, 9, 11), (14, 16, 20), (28, 31, 38)
BRAND, ZINC_100, ZINC_400, ZINC_600 = (163, 230, 53), (244, 244, 245), (161, 161, 170), (82, 82, 91)

FUENTE = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FUENTE_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"
MONO = "/System/Library/Fonts/Monaco.ttf"


def datos():
    """Los números salen del dato real, no se escriben acá."""
    src = (RAIZ / "src/data/api.ts").read_text(encoding="utf-8")
    publicados = re.findall(r"published: (true|false)", src)
    rastrean = len(
        [m for m in re.finditer(r"tracking: \{\s*\n?\s*status: 'ok'|status: 'ok', note: 'Operativo", src)]
    )
    agencias = re.search(r"agenciesSynced: (\d+)", src)
    return {
        "carriers": publicados.count("true"),
        "rastrean": max(rastrean, len(re.findall(r"status: 'ok', note: 'Operativo", src))),
        "agencias": int(agencias.group(1)) if agencias else 0,
    }


img = Image.new("RGB", (W, H), INK)
d = ImageDraw.Draw(img)

# La grilla del sitio, tenue, desvaneciéndose hacia abajo.
paso = 56
for x in range(0, W, paso):
    d.line([(x, 0), (x, H)], fill=LINE, width=1)
for y in range(0, H, paso):
    op = max(0, 1 - y / (H * 1.15))
    c = tuple(int(INK[i] + (LINE[i] - INK[i]) * op) for i in range(3))
    d.line([(0, y), (W, y)], fill=c, width=1)

M = 76  # margen

# ── El isotipo, en su cuadrado lima ──
lado = 64
d.rounded_rectangle([M, M, M + lado, M + lado], radius=15, fill=BRAND)
e = 2.7  # 24→64: el trazo escala igual que el símbolo
u = lado / 24


def isotipo(draw, ox, oy, lado, grosor, color):
    """El mismo trazado que `Logo.astro`, muestreando las curvas de verdad.

    La primera versión aproximaba las bézier con polilíneas de cuatro puntos y
    salía un tenedor, no una convergencia. Pillow no dibuja curvas, así que hay
    que muestrearlas: el `path` del SVG es
    `M3 5c5 0 5 7 9 7 · M3 12h9 · M3 19c5 0 5-7 9-7 · M12 12h9`."""
    u = lado / 24

    def pt(x, y):
        return (ox + x * u, oy + y * u)

    def bezier(p0, p1, p2, p3, n=40):
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

    g = max(2, int(grosor * u))
    # Las dos entradas curvas: arriba y abajo, espejadas.
    for y0 in (5, 19):
        c = 7 if y0 == 5 else -7
        draw.line(
            bezier(pt(3, y0), pt(8, y0), pt(8, y0 + c), pt(12, y0 + c)),
            fill=color, width=g, joint="curve",
        )
    # La entrada recta y la salida única.
    draw.line([pt(3, 12), pt(21, 12)], fill=color, width=g)
    # Las puntas redondeadas del SVG: Pillow no tiene `stroke-linecap`.
    for x, y in [(3, 5), (3, 12), (3, 19), (21, 12)]:
        cx, cy = pt(x, y)
        draw.ellipse([cx - g / 2, cy - g / 2, cx + g / 2, cy + g / 2], fill=color)


isotipo(d, M, M, lado, e, INK)

f_marca = ImageFont.truetype(FUENTE, 30)
d.text((M + lado + 22, M + 16), "API Tracking", font=f_marca, fill=ZINC_100)
ancho = d.textlength("API Tracking ", font=f_marca)
d.text((M + lado + 22 + ancho, M + 16), "Perú", font=f_marca, fill=ZINC_600)

# ── El titular ──
# El cuerpo se calcula, no se elige: se baja hasta que la línea más larga entra
# en la caja. Ajustarlo a ojo obliga a rehacerlo cada vez que cambia el titular.
TITULAR = ["Rastreo y agencias de couriers", "peruanos, detrás de un solo contrato."]
cuerpo = 64
while cuerpo > 30:
    f_h1 = ImageFont.truetype(FUENTE, cuerpo)
    if max(d.textlength(l, font=f_h1) for l in TITULAR) <= W - 2 * M:
        break
    cuerpo -= 2
for i, linea in enumerate(TITULAR):
    d.text((M, 232 + i * int(cuerpo * 1.22)), linea, font=f_h1, fill=ZINC_100)

# ── Los couriers, en monoespaciada ──
f_mono = ImageFont.truetype(MONO, 25)
x = M
for i, n in enumerate(["olva", "shalom", "marvisur", "urbano", "cruzdelsur"]):
    if i:
        d.text((x, 404), "·", font=f_mono, fill=(50, 53, 60))
        x += d.textlength("·  ", font=f_mono)
    d.text((x, 404), n, font=f_mono, fill=ZINC_400)
    x += d.textlength(n + "  ", font=f_mono)

# ── El pie: los números reales ──
n = datos()
d.line([(M, 492), (W - M, 492)], fill=LINE, width=1)
f_num = ImageFont.truetype(FUENTE, 40)
f_pie = ImageFont.truetype(FUENTE_REG, 21)
x = M
for valor, etiqueta in [
    (str(n["rastrean"]), "couriers rastrean"),
    (str(n["agencias"]), "agencias sincronizadas"),
    ("11", "estados canónicos"),
]:
    d.text((x, 528), valor, font=f_num, fill=BRAND)
    w = d.textlength(valor, font=f_num)
    d.text((x + w + 12, 540), etiqueta, font=f_pie, fill=ZINC_600)
    x += w + 12 + d.textlength(etiqueta, font=f_pie) + 52

img.save(RAIZ / "public/og.png", "PNG", optimize=True)
print(f"public/og.png · {W}×{H} · {(RAIZ / 'public/og.png').stat().st_size // 1024} KB")

# ── El icono para iOS: fondo lima, símbolo tinta, sin transparencia ──
t = 180
ic = Image.new("RGB", (t, t), BRAND)
isotipo(ImageDraw.Draw(ic), 0, 0, t, e, INK)
ic.save(RAIZ / "public/apple-touch-icon.png", "PNG", optimize=True)
print(f"public/apple-touch-icon.png · {t}×{t}")
