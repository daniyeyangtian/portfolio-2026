# Blurs the faces in the Verdure prototype collage (assets/verdure/d886d.png): python3 tools/blur-faces.py in.png out.png
import sys
from PIL import Image, ImageDraw, ImageFilter
src, out = sys.argv[1], sys.argv[2]
FACES = [  # centre x, y, radius x, y (px of the 2379 x 1225 collage)
  (645, 268, 44, 56), (735, 262, 22, 28), (793, 250, 20, 26), (822, 245, 22, 28), (710, 255, 10, 13),
  (1160, 112, 28, 32), (1265, 345, 24, 30), (1255, 675, 22, 26),
]
im = Image.open(src).convert("RGBA")
blur = im.filter(ImageFilter.GaussianBlur(9))
m = Image.new("L", im.size, 0); d = ImageDraw.Draw(m)
for x, y, rx, ry in FACES:
    d.ellipse((x - rx * 1.25, y - ry * 1.25, x + rx * 1.25, y + ry * 1.25), fill=255)
m = m.filter(ImageFilter.GaussianBlur(6))
im.paste(blur, (0, 0), m)
im.save(out, optimize=True)
im.convert("RGB").crop((560, 40, 1360, 760)).save("check.jpg", quality=90)
