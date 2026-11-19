# Clicket case study (projects/clicket.html): apply the "fewer labels" pass from Figma
# (page "clicket ui", sections "Perk · Fewer labels · Row 1–3") to the app screens the page
# shows as live layers: the phone strip and the UI iteration "after" phones.
#
# Inside every layer named like a screen ("09 Home", "15 Locker unlocked", ...), small eyebrow
# labels that repeat what the heading already says are removed, and metric / status labels are
# replaced by the same icons as in Figma (drawn in the label's colour). Nothing outside those
# layers is touched. Safe to run twice: removed labels are gone, swapped ones are already icons.
#
#   python3 tools/clicket-fewer-labels.py
import re, pathlib

PAGE = pathlib.Path(__file__).resolve().parent.parent / "projects" / "clicket.html"

P = 'stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"'
ICONS = {
    "battery": f'<path d="M16.75 7.25H5.25a2.5 2.5 0 0 0-2.5 2.5v4.5a2.5 2.5 0 0 0 2.5 2.5h11.5a2.5 2.5 0 0 0 2.5-2.5v-4.5a2.5 2.5 0 0 0-2.5-2.5Z" {P}/><path d="M21.25 10.75v2.5M6.25 10.25v3.5M9.25 10.25v3.5" {P}/>',
    "storage": f'<path d="M8 3.25h8.25a2 2 0 0 1 2 2v13.5a2 2 0 0 1-2 2h-8.5a2 2 0 0 1-2-2V7.5L8 3.25Z" {P}/><path d="M10 6.75v2.5M13 6.75v2.5M16 6.75v2.5" {P}/>',
    "coin": f'<circle cx="12" cy="12" r="8.25" {P}/><circle cx="12" cy="12" r="4.25" {P}/>',
    "clock": f'<circle cx="12" cy="12" r="8.25" {P}/><path d="M12 7.75V12l2.75 1.75" {P}/>',
    "walk": f'<ellipse cx="8.5" cy="8.25" rx="2.5" ry="3.75" {P}/><path d="M7.25 15.25h2.5" {P}/><ellipse cx="15.5" cy="11.75" rx="2.5" ry="3.75" {P}/><path d="M14.25 18.75h2.5" {P}/>',
    "timer": f'<circle cx="12" cy="13.5" r="7.25" {P}/><path d="M12 10v3.5M10 3.25h4M17.75 6.75 19 5.5" {P}/>',
    "camera": f'<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.4-2h4.6l1.4 2h1.8A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-8Z" {P}/><circle cx="12" cy="12.5" r="3.5" {P}/>',
    "pin": f'<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" {P}/><circle cx="12" cy="10" r="2.5" {P}/>',
    "bluetooth": f'<path d="M7 7l10 10-5 4V3l5 4L7 17" {P}/>',
    "lock": f'<rect x="5.25" y="10.75" width="13.5" height="9.5" rx="2.25" {P}/><path d="M8.25 10.75v-3a3.75 3.75 0 0 1 7.5 0v3" {P}/>',
}
REMOVE = ["Welcome to", "New here", "Tuesday · Oct 14", "My device", "My footprint", "New device nearby",
          "Tutorial", "Paired", "Your turn", "Rental station", "Pick-up", "Pair your Clicket", "Still searching",
          "Destination arrived", "Guidance photo", "Ready", "Shooting mode", "Medals"]
STEP = re.compile(r"Step \d · .+")
# uppercase metric labels -> icon, and how big the icon is next to the label's font size
SWAP = {"Battery": "battery", "Shots": "camera", "Storage": "storage", "Shots left today": "camera",
        "My shutters": "camera", "Credits": "coin", "My credits": "coin", "Rent hours": "clock", "Walk": "walk",
        "Walked": "walk", "Time": "clock", "Break ends in": "timer", "Shots today": "camera", "Spots done": "pin"}

def svg(name, px):
    return (f'<svg width="{px:.2f}" height="{px:.2f}" viewBox="0 0 24 24" fill="none" aria-hidden="true" '
            f'style="display:block">{ICONS[name]}</svg>')

def screens(s):
    """(start, end) of every element whose data-name looks like an app screen ("09 Home")."""
    out = []
    for m in re.finditer(r'<div [^>]*data-name="(?:0[1-9]|1\d|2[0-6]) [^"]*"[^>]*>', s):
        depth, i = 1, m.end()
        for t in re.finditer(r"<(/?)div\b[^>]*>", s[i:]):
            depth += -1 if t.group(1) else 1
            if depth == 0:
                out.append((m.start(), i + t.end())); break
    # keep outermost ranges only
    out.sort()
    keep = []
    for a, b in out:
        if keep and a < keep[-1][1]: continue
        keep.append((a, b))
    return keep

P_TAG = re.compile(r'<p (class="[^"]*")([^>]*)>([^<]*)</p>')

def lh0(rest):
    """the p's other attributes, with line-height:0 added to its style (an icon sits in it)"""
    if 'style="' in rest:
        return rest.replace('style="', 'style="line-height:0;', 1)
    return rest + ' style="line-height:0"'

def fix(block):
    def one(m):
        cls, rest, text = m.group(1), m.group(2), m.group(3).strip()
        upper = "uppercase" in cls
        size = re.search(r"text-\[(\d+(?:\.\d+)?)px\]", cls)
        fs = float(size.group(1)) if size else 6.0
        if upper and (text in REMOVE or STEP.fullmatch(text)):
            return ""
        if upper and text in SWAP:
            return f'<p {cls}{lh0(rest)}>{svg(SWAP[text], fs * 1.64)}</p>'
        if text == "Locked":
            return f'<p {cls}{lh0(rest)}>{svg("lock", fs * 1.33)}</p>'
        if text == "Battery 60%":
            return f'<p {cls}{rest}><span style="display:inline-flex;align-items:center;gap:.3em">{svg("battery", fs * 1.15)}60%</span></p>'
        if text == "Bluetooth on":
            return f'<p {cls}{lh0(rest)}>{svg("bluetooth", fs * 1.15)}</p>'
        return m.group(0)
    return P_TAG.sub(one, block)

s = PAGE.read_text()
before = len(s)
parts, last = [], 0
for a, b in screens(s):
    parts += [s[last:a], fix(s[a:b])]; last = b
parts.append(s[last:])
new = "".join(parts)
PAGE.write_text(new)
print(f"screens: {len(screens(s))}, bytes {before} -> {len(new)}")
