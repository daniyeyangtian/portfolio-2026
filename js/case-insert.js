// Case studies: change the exported frame after the page's own layout scripts have run.
//
// makeCaseRoom(from, to) – everything that starts at or below frame-y `to` can be moved down
//   (or up) together; layers lying wholly between `from` and `to` are removed (pass to = from
//   to remove nothing). Returns { move(dy) }: dy is this room's offset and can change later
//   (once the web fonts have loaded and text has its real height). Rooms add up, so a layer
//   below two of them sits at its own place + both offsets.
// addCaseSection(sec) – put a new section layer on the frame; it moves with the rooms above it.
// insertCaseSection({...}) – a text section (heading + lead line + paragraph, or columns of
//   them) inserted at frame-y `top`.
// Keep the section anchors in projects.html in step with what moves.
(() => {
  const frame = document.getElementById("frame");
  const z = () => frame.getBoundingClientRect().width / 1220;
  const yOf = el => (el.getBoundingClientRect().top - frame.getBoundingClientRect().top) / z();
  const bottomOf = el => (el.getBoundingClientRect().bottom - frame.getBoundingClientRect().top) / z();

  // every moved layer: where it was before any room moved it, and each room's share
  const tracked = new Map();
  const apply = (el, t) => {
    const dy = [...t.parts.values()].reduce((a, b) => a + b, 0);
    if (t.kind === "translate") el.style.translate = `${t.x} ${t.base + dy}px`;
    else el.style[t.kind] = t.base + dy + "px";
  };
  const track = (el, kind, base, x) => {
    if (!tracked.has(el)) tracked.set(el, { kind, base, x, parts: new Map() });
    return el;
  };
  const rooms = [];
  let frameBase = null;
  const frameStyle = document.createElement("style");

  window.makeCaseRoom = (from, to = from) => {
    if (!frame) return { move() {} };
    if (frameBase === null) { frameBase = parseFloat(getComputedStyle(frame).height); document.head.appendChild(frameStyle); }
    const els = [];
    // Inside a window: layers starting at or below `to` move; layers wholly between `from` and
    // `to` are removed; a group that straddles either line is opened up and its children sorted the
    // same way; anything else that straddles (a background, a long line) stays.
    const sort = el => {
      if (el.classList.contains("case-insert")) return;
      if (getComputedStyle(el).display === "contents") { [...el.children].forEach(sort); return; }
      const r = el.getBoundingClientRect();
      // a zero-size holder (a group of absolutely placed layers): sort what it holds
      if (!r.width && !r.height) { [...el.children].forEach(sort); return; }
      const y0 = yOf(el), y1 = bottomOf(el);
      if (y0 >= to - 0.5) {
        const [x, y] = getComputedStyle(el).translate.split(" ");
        els.push(track(el, "translate", parseFloat(y) || 0, x === "none" ? "0px" : x));
        return;
      }
      if (to > from && y0 >= from - 0.5 && y1 <= to + 0.5) { el.remove(); return; }
      if (y1 > from && el.children.length) [...el.children].forEach(sort);
    };
    [...frame.children].forEach(w => {
      if (w.classList.contains("case-insert")) {
        if (parseFloat(w.style.top) >= to) els.push(track(w, "top", parseFloat(w.style.top)));
        return;
      }
      const cs = getComputedStyle(w), wTop = parseFloat(cs.top) || 0, wH = parseFloat(cs.height) || 0;
      if (wTop >= to) { els.push(track(w, "top", wTop)); return; }   // a window wholly below
      if (wTop + wH <= from) return;                                // wholly above
      // a window holds a copy of the page (its root layer inside); a page without windows is its root
      const root = w.dataset.nodeId ? w : (w.querySelector("[data-node-id]") || w.firstElementChild);
      [...root.children].forEach(sort);
      els.push(track(w, "height", wH));
    });
    const room = { to, dy: 0, els };
    rooms.push(room);
    return {
      move(dy) {
        room.dy = dy;
        room.els.forEach(el => { const t = tracked.get(el); t.parts.set(room, dy); apply(el, t); });
        const total = rooms.reduce((a, r) => a + r.dy, 0);
        frameStyle.textContent = `#frame.case-frame { height: ${frameBase + total}px; }`;
      },
    };
  };

  window.addCaseSection = sec => {
    frame.appendChild(sec);
    const top = parseFloat(sec.style.top);
    rooms.filter(r => top >= r.to).forEach(r => {
      track(sec, "top", top);
      r.els.push(sec);
      const t = tracked.get(sec); t.parts.set(r, r.dy); apply(sec, t);
    });
  };

  window.insertCaseSection = ({ top, from, gap, heading, lead, body, headX, textX, textW, textTop = 0, bodyColor, leadColor = "#141414", columns }) => {
    if (!frame) return;
    // the new section, as its own layer on the frame. Its text is one block, or `columns`:
    // several blocks side by side, each [{ x, w, lead, body }]
    const blocks = columns || [{ x: textX, w: textW, lead, body }];
    const sec = document.createElement("section");
    sec.className = "case-insert";
    sec.setAttribute("aria-labelledby", "case-insert-h");
    sec.style.cssText = `position:absolute;left:0;top:${top}px;width:1220px;z-index:2;font-family:Geist,sans-serif`;
    sec.innerHTML = `
      <h2 id="case-insert-h" style="position:absolute;left:${headX}px;top:0;margin:0;font:500 28px/normal Geist,sans-serif;color:#000">${heading}</h2>` +
      blocks.map(c => `
      <div class="case-insert-text" style="position:absolute;left:${c.x}px;top:${textTop}px;width:${c.w}px">
        <p style="margin:0;font:400 20px/1.4 Geist,sans-serif;color:${leadColor}">${c.lead}</p>
        <p style="margin:16px 0 0;font:400 16px/1.5 Geist,sans-serif;color:${bodyColor}">${c.body}</p>
      </div>`).join("");
    const room = makeCaseRoom(from);   // measure before the section is there
    addCaseSection(sec);
    const layout = () => {
      // side by side: the lead lines take the same height, so the paragraphs under them line up
      const leads = [...sec.querySelectorAll(".case-insert-text > p:first-child")];
      leads.forEach(p => { p.style.minHeight = ""; });
      if (leads.length > 1) {
        const h = Math.max(...leads.map(p => p.offsetHeight));
        leads.forEach(p => { p.style.minHeight = h + "px"; });
      }
      const textH = Math.max(textTop + Math.max(...[...sec.querySelectorAll(".case-insert-text")].map(d => d.offsetHeight)), 37);
      room.move(Math.max(0, Math.round(top + textH + gap - from)));
    };
    layout();
    // again once the text has its real height (fonts) and all styles are in (load)
    document.fonts?.ready.then(layout);
    addEventListener("load", layout);
  };
})();
