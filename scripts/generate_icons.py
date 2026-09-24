"""Genera los iconos PWA (any + maskable) para public/icons/.

Dibuja un icono simple: fondo azul (brand) con un check dentro de un
documento/clipboard blanco, representando "cumplimiento de funciones".
No requiere assets externos, solo Pillow.
"""

from PIL import Image, ImageDraw
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

BRAND = (37, 99, 235, 255)  # #2563eb
WHITE = (255, 255, 255, 255)


def draw_symbol(draw, cx, cy, scale):
    """Dibuja un clipboard con check centrado en (cx, cy), tamaño ~scale."""
    w = scale * 0.62
    h = scale * 0.78
    left, top = cx - w / 2, cy - h / 2
    right, bottom = cx + w / 2, cy + h / 2
    radius = scale * 0.07

    # Cuerpo del "documento"
    draw.rounded_rectangle([left, top, right, bottom], radius=radius, fill=WHITE)

    # Clip superior
    clip_w = scale * 0.28
    clip_h = scale * 0.12
    clip_left = cx - clip_w / 2
    clip_top = top - clip_h * 0.5
    draw.rounded_rectangle(
        [clip_left, clip_top, clip_left + clip_w, clip_top + clip_h],
        radius=clip_h * 0.3,
        fill=BRAND,
    )

    # Líneas de "texto"
    line_color = (191, 219, 254, 255)  # brand-200
    line_x1 = left + w * 0.18
    line_x2 = right - w * 0.18
    for i, frac in enumerate([0.28, 0.42]):
        y = top + h * frac
        draw.line([(line_x1, y), (line_x2, y)], fill=line_color, width=max(2, int(scale * 0.035)))

    # Check dentro de un círculo verde
    check_r = scale * 0.22
    check_cx = cx
    check_cy = top + h * 0.68
    draw.ellipse(
        [check_cx - check_r, check_cy - check_r, check_cx + check_r, check_cy + check_r],
        fill=(34, 197, 94, 255),
    )
    lw = max(3, int(scale * 0.045))
    p1 = (check_cx - check_r * 0.5, check_cy + check_r * 0.05)
    p2 = (check_cx - check_r * 0.1, check_cy + check_r * 0.45)
    p3 = (check_cx + check_r * 0.55, check_cy - check_r * 0.35)
    draw.line([p1, p2], fill=WHITE, width=lw)
    draw.line([p2, p3], fill=WHITE, width=lw)


def make_icon(size, maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if maskable:
        # Fondo a sangre completa (sin bordes redondeados): el sistema
        # operativo recorta la forma final. Símbolo más pequeño para
        # quedar dentro de la "safe zone" (~80% central).
        draw.rectangle([0, 0, size, size], fill=BRAND)
        draw_symbol(draw, size / 2, size / 2, size * 0.5)
    else:
        radius = size * 0.22
        draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=BRAND)
        draw_symbol(draw, size / 2, size / 2, size * 0.66)

    return img


sizes = [192, 512]
for s in sizes:
    make_icon(s, maskable=False).save(os.path.join(OUT_DIR, f"icon-{s}.png"))
    make_icon(s, maskable=True).save(os.path.join(OUT_DIR, f"icon-maskable-{s}.png"))

# Favicon simple (32x32) y apple-touch-icon (180x180)
make_icon(32, maskable=False).save(os.path.join(OUT_DIR, "favicon-32.png"))
make_icon(180, maskable=False).save(os.path.join(OUT_DIR, "apple-touch-icon.png"))

print("Iconos generados en", OUT_DIR)
