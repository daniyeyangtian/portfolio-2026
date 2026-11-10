// Case studies: change the exported frame after the page's own layout scripts have run.
//
// makeCaseRoom(from, to) – everything that starts at or below frame-y `to` can be moved down
//   (or up) together; layers lying wholly between `from` and `to` are hidden (pass to = from to
//   hide nothing). Returns { move(dy) } — dy is the total offset, and can change later (an
//   expanding panel), so the page below follows smoothly.
// insertCaseSection({...}) – a text section (heading + lead line + paragraph, or columns of
//   them) inserted at frame-y `top`; returns how far the page below moved.
// Keep the section anchors in projects.html in step with what moves.
(() => {
  const frame = document.getElementById("frame");
  const z = () => frame.getBoundingClientRect().width / 1220;
  const yOf = el => (el.getBoundingClientRect().top - frame.getBoundingClientRect().top) / z();
  const bottomOf = el => (el.getBoundingClientRect().bottom - frame.getBoundingClientRect().top) / z();
  let rooms = 0;

  window.makeCaseRoom = (from, to = from) => {
    if (!frame) return { move() {} };
    const moved = [], wins = [], grown = [];
    // Inside a window: layers starting at or below `to` move; layers wholly between `from` and
    // `to` hide; a group that straddles either line is opened up and its children sorted the
    // same way; anything else that straddles (a background, a long line) stays.
    const sort = el => {
      if (el.classList.contains("case-insert")) return;
      if (getComputedStyle(el).display === "contents") { [...el.children].forEach(sort); return; }
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height && !el.children.length) return;
      const y0 = yOf(el), y1 = bottomOf(el);
      if (y0 >= to - 0.5) {
        const [x, y] = getComputedStyle(el).translate.split(" ");
        moved.push({ el, x: x === "none" ? "0px" : x, y: parseFloat(y) || 0 });
        return;
      }
      if (to > from && y0 >= from - 0.5 && y1 <= to + 0.5) { el.style.setProperty("visibility", "hidden", "important"); return; }
      if (y1 > from && el.children.length) [...el.children].forEach(sort);
    };
    [...frame.children].forEach(w => {
      if (w.classList.contains("case-insert")) {
        if (parseFloat(w.style.top) >= to) wins.push({ w, top: parseFloat(w.style.top) });
        return;
      }
      const cs = getComputedStyle(w), wTop = parseFloat(cs.top) || 0, wH = parseFloat(cs.height) || 0;
      if (wTop >= to) { wins.push({ w, top: wTop }); return; }   // a window wholly below
      if (wTop + wH <= from) return;                             // wholly above
      // a window holds a copy of the page (its root layer inside); a page without windows is its root
      const root = w.dataset.nodeId ? w : (w.querySelector("[data-node-id]") || w.firstElementChild);
      [...root.children].forEach(sort);
      grown.push({ w, h: wH });
    });
    const baseH = parseFloat(getComputedStyle(frame).height);
    const style = document.createElement("style");
    style.id = "case-room-" + rooms++;
    document.head.appendChild(style);
    return {
      move(dy) {
        moved.forEach(m => { m.el.style.translate = `${m.x} ${m.y + dy}px`; });
        wins.forEach(m => { m.w.style.top = m.top + dy + "px"; });
        grown.forEach(m => { m.w.style.height = m.h + dy + "px"; });
        style.textContent = `#frame.case-frame { height: ${baseH + dy}px; }`;
      },
      layers: () => [...moved.map(m => m.el), ...wins.map(m => m.w), ...grown.map(m => m.w)],
    };
  };

  window.insertCaseSection = ({ top, from, gap, heading, lead, body, headX, textX, textW, textTop = 0, bodyColor, leadColor = "#141414", columns }) => {
    if (!frame) return 0;
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
    frame.appendChild(sec);
    // side by side: the lead lines take the same height, so the paragraphs under them line up
    const leads = [...sec.querySelectorAll(".case-insert-text > p:first-child")];
    if (leads.length > 1) {
      const h = Math.max(...leads.map(p => p.offsetHeight));
      leads.forEach(p => { p.style.minHeight = h + "px"; });
    }
    const textH = Math.max(textTop + Math.max(...[...sec.querySelectorAll(".case-insert-text")].map(d => d.offsetHeight)), 37);
    const shift = Math.max(0, Math.round(top + textH + gap - from));
    room.move(shift);
    return shift;
  };
})();
