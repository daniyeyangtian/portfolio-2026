# Traced assets/about/dragon.png into assets/about/dragon.svg: python3 tools/trace-dragon.py in.png out.svg
# Trace the dragon cut-out into a smooth vector outline (no potrace here): upscale its mask,
# soften, threshold, follow the pixel boundaries into loops, then simplify and round the corners.
import sys
from PIL import Image, ImageFilter
SRC, OUT = sys.argv[1], sys.argv[2]
UP = 4
im = Image.open(SRC).convert("RGBA"); W, H = im.size

def mask_from(fn):
    m = Image.new("L", (W, H)); mp = m.load(); p = im.load()
    for y in range(H):
        for x in range(W):
            mp[x, y] = fn(p[x, y])
    m = m.resize((W * UP, H * UP), Image.BICUBIC).filter(ImageFilter.GaussianBlur(UP * .6))
    return m.point(lambda v: 255 if v >= 128 else 0)

def loops(m):
    w, h = m.size; p = m.load()
    ins = lambda x, y: 0 <= x < w and 0 <= y < h and p[x, y] > 0
    nxt = {}
    for y in range(h + 1):
        for x in range(w + 1):
            pass
    # directed boundary edges, inside kept on the left
    for y in range(h):
        for x in range(w):
            if not ins(x, y): continue
            if not ins(x, y - 1): nxt[(x + 1, y)] = (x, y)          # top edge, right->left
            if not ins(x, y + 1): nxt[(x, y + 1)] = (x + 1, y + 1)  # bottom, left->right
            if not ins(x - 1, y): nxt[(x, y)] = (x, y + 1)          # left, down
            if not ins(x + 1, y): nxt[(x + 1, y + 1)] = (x + 1, y)  # right, up
    out = []
    while nxt:
        s, _ = next(iter(nxt.items())); pts = [s]; c = s
        while True:
            n = nxt.pop(c, None)
            if n is None or n == s: break
            pts.append(n); c = n
        if len(pts) > 12: out.append(pts)
    return out

def rdp(pts, eps):
    if len(pts) < 3: return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1; L = (dx * dx + dy * dy) ** .5 or 1e-9
    i, d = max(((i, abs(dy * (x - x1) - dx * (y - y1)) / L) for i, (x, y) in enumerate(pts[1:-1], 1)), key=lambda t: t[1], default=(0, 0))
    if d > eps: return rdp(pts[:i + 1], eps)[:-1] + rdp(pts[i:], eps)
    return [pts[0], pts[-1]]

def smooth(pts, n=2):
    for _ in range(n):
        q = []
        for i in range(len(pts)):
            (x0, y0), (x1, y1) = pts[i], pts[(i + 1) % len(pts)]
            q += [(.75 * x0 + .25 * x1, .75 * y0 + .25 * y1), (.25 * x0 + .75 * x1, .25 * y0 + .75 * y1)]
        pts = q
    return pts

def path(m, eps=1.4):
    d = []
    for lp in loops(m):
        k = len(lp) // 2
        s = rdp(lp[:k + 1], eps)[:-1] + rdp(lp[k:] + [lp[0]], eps)[:-1]
        if len(s) < 4: continue
        s = smooth(s)
        d.append("M" + " L".join(f"{x / UP:.2f} {y / UP:.2f}" for x, y in s) + "Z")
    return " ".join(d)

body = path(mask_from(lambda c: c[3]))
# the dark veins on the wings: noticeably darker than the paint around them
p = im.load(); lum = [sum(p[x, y][:3]) / 3 for y in range(H) for x in range(W) if p[x, y][3] > 200]
mean = sum(lum) / len(lum)
veins = path(mask_from(lambda c: 255 if c[3] > 200 and sum(c[:3]) / 3 < mean * .72 else 0), eps=1.0)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <filter id="paint" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.55 .32" result="g"/>
      <feComposite in="g" in2="SourceGraphic" operator="in" result="grain"/>
      <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="grain"/></feMerge>
    </filter>
  </defs>
  <g filter="url(#paint)">
    <path d="{body}" fill="#d8432f" fill-rule="evenodd"/>
    <path d="{veins}" fill="#9c2a1c" fill-rule="evenodd" opacity=".75"/>
  </g>
</svg>
'''
open(OUT, "w").write(svg)
print(len(body), len(veins))
