# Verdure case study (projects/verdure.html): apply the "fewer labels" pass from Figma (page
# "verdure ui", frames "… · fewer labels") to the app screens the page shows as live layers
# (the phone strip at the top).
#
# Inside every layer named like a Verdure screen ("Home · D · Light", "Care · 1 · …", …):
#   - the tab bar's words (Today, Garden, Explore, You) go; the icons say it
#   - the "Height" title on the height card goes; the screen is titled Height already
#   - stat labels become icons in the label's colour: Light → sun, Room → thermometer,
#     Humidity / Soil moisture → droplet, Harvest / Cut → scissors, Expect → bowl,
#     Regrows → regrow arrows, Next to harvest → calendar
# Nothing outside those layers is touched. Safe to run twice.
#
#   python3 tools/verdure-fewer-labels.py
import re, pathlib

PAGE = pathlib.Path(__file__).resolve().parent.parent / "projects" / "verdure.html"

P = 'stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"'
ICONS = {
    "sun": f'<circle cx="12" cy="12" r="4" {P}/><path d="M12 2.75v2M12 19.25v2M2.75 12h2M19.25 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4" {P}/>',
    "thermo": f'<path d="M14 14.6V5a2 2 0 0 0-4 0v9.6a4 4 0 1 0 4 0Z" {P}/>',
    "drop": f'<path d="M12 3.5S6 9.9 6 14a6 6 0 0 0 12 0c0-4.1-6-10.5-6-10.5Z" {P}/>',
    "scissors": f'<circle cx="6.5" cy="7" r="2.5" {P}/><circle cx="6.5" cy="17" r="2.5" {P}/><path d="M8.6 8.4 19.5 16.5M8.6 15.6 19.5 7.5" {P}/>',
    "bowl": f'<path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0Z" {P}/><path d="M9 20.5h6" {P}/>',
    "regrow": f'<path d="M19.25 12a7.25 7.25 0 0 1-12.6 4.9M4.75 12a7.25 7.25 0 0 1 12.6-4.9" {P}/><path d="M17.5 3.75v3.5H14M6.5 20.25v-3.5H10" {P}/>',
    "calendar": f'<rect x="4" y="5.5" width="16" height="14.5" rx="2.5" {P}/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" {P}/>',
}
SWAP = {"Light": "sun", "Room": "thermo", "Humidity": "drop", "Soil moisture": "drop", "Harvest": "scissors",
        "Cut": "scissors", "Expect": "bowl", "Regrows": "regrow", "Next to harvest": "calendar"}
QUIET = "#6e7172"

def svg(name, px):
    return (f'<svg width="{px:.2f}" height="{px:.2f}" viewBox="0 0 24 24" fill="none" aria-hidden="true" '
            f'style="display:block">{ICONS[name]}</svg>')

def screens(s):
    out = []
    for m in re.finditer(r'<div [^>]*data-name="(?:Home|Plant|Care|Harvest|You|Setup|Onboarding) · [^"]*"[^>]*>', s):
        depth, i = 1, m.end()
        for t in re.finditer(r"<(/?)div\b[^>]*>", s[i:]):
            depth += -1 if t.group(1) else 1
            if depth == 0:
                out.append((m.start(), i + t.end())); break
    out.sort()
    keep = []
    for a, b in out:
        if keep and a < keep[-1][1]: continue
        keep.append((a, b))
    return keep

P_TAG = re.compile(r'<p (class="[^"]*")([^>]*)>([^<]*)</p>')

def lh0(rest):
    if 'style="' in rest:
        return rest.replace('style="', 'style="line-height:0;', 1)
    return rest + ' style="line-height:0"'

def fix(block):
    def one(m):
        cls, rest, text = m.group(1), m.group(2), m.group(3).strip()
        size = re.search(r"text-\[(\d+(?:\.\d+)?)px\]", cls)
        fs = float(size.group(1)) if size else 7.0
        quiet = QUIET in cls
        absolute = re.search(r"(^|\s|\")absolute(\s|\")", cls) is not None
        if text in ("Today", "Garden", "Explore", "You") and not absolute and fs < 8:
            return ""                                           # tab bar word
        if text == "Height" and quiet:
            return ""                                           # the height card's title
        if text in SWAP and quiet:
            return f'<p {cls}{lh0(rest)}>{svg(SWAP[text], fs * 1.3)}</p>'
        return m.group(0)
    return P_TAG.sub(one, block)

s = PAGE.read_text()
parts, last = [], 0
found = screens(s)
for a, b in found:
    parts += [s[last:a], fix(s[a:b])]; last = b
parts.append(s[last:])
PAGE.write_text("".join(parts))
print(f"screens: {len(found)}")
