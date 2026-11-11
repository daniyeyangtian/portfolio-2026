# Transparent PNGs over 400 KB → WebP (q86, alpha kept); pages repointed. Run from portfolio-2026.
import os, glob
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
n = 0
for i in range(1, 6):
    f = f"other/{i}.html"; s = open(f, encoding="utf-8").read()
    for p in glob.glob(f"assets/other-work/{i}/*.png"):
        if os.path.getsize(p) < 400_000: continue
        q = p[:-4] + ".webp"
        Image.open(p).save(q, "WEBP", quality=86, method=6)
        os.remove(p); s = s.replace("../" + p, "../" + q); n += 1
    open(f, "w", encoding="utf-8").write(s)
print("to webp:", n)
