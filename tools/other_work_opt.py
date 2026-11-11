# Lighter copies of the Other Work images: max 2440 px on the long side; opaque PNGs become JPEG (q82)
# and the pages are pointed at the .jpg. Run from portfolio-2026.
import os, re, glob
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
MAX = 2440
renamed = {}
for i in range(1, 6):
    for p in glob.glob(f"assets/other-work/{i}/*.png"):
        if os.path.getsize(p) < 250_000: continue
        im = Image.open(p); im.load()
        if max(im.size) > MAX:
            r = MAX / max(im.size); im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
        rgba = im.convert("RGBA")
        opaque = rgba.getchannel("A").getextrema()[0] == 255
        if opaque:
            q = p[:-4] + ".jpg"
            rgba.convert("RGB").save(q, quality=82, optimize=True, progressive=True)
            os.remove(p); renamed[p] = q
        else:
            im.save(p, optimize=True)
for i in range(1, 6):
    f = f"other/{i}.html"; s = open(f, encoding="utf-8").read()
    for a, b in renamed.items():
        if f"/{i}/" in a: s = s.replace("../" + a, "../" + b)
    open(f, "w", encoding="utf-8").write(s)
print("to jpg:", len(renamed))
