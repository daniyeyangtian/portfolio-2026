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
      room,
      move(dy) {
        room.dy = dy;
        room.els.forEach(el => { const t = tracked.get(el); t.parts.set(room, dy); apply(el, t); });
        const total = rooms.reduce((a, r) => a + r.dy, 0);
        frameStyle.textContent = `#frame.case-frame { height: ${frameBase + total}px; }`;
      },
    };
  };

  // own: the room made for this section, which must not push the section itself down
  window.addCaseSection = (sec, own) => {
    frame.appendChild(sec);
    const top = parseFloat(sec.style.top);
    rooms.filter(r => r !== own?.room && top >= r.to).forEach(r => {
      track(sec, "top", top);
      r.els.push(sec);
      const t = tracked.get(sec); t.parts.set(r, r.dy); apply(sec, t);
    });
  };

  // addCaseSectionAt(sec, y, own, like) – the same, for a section that takes the place of a layer
  // already on the page (`like`) and shows at frame-y `y` as the page is now: it joins exactly the
  // rooms that move that layer (so it follows them as they open and close, e.g. the Research Path
  // figures), and its base top is `y` less their moves
  window.addCaseSectionAt = (sec, y, own, like) => {
    const moves = el => { const t = tracked.get(el); return t && t.kind !== "height"; };
    const mine = rooms.filter(r => r !== own?.room && r.els.some(e => (e === like || e.contains(like)) && moves(e)));
    const base = y - mine.reduce((a, r) => a + r.dy, 0);
    sec.style.top = base + "px";
    frame.appendChild(sec);
    track(sec, "top", base);
    const t = tracked.get(sec);
    mine.forEach(r => { r.els.push(sec); t.parts.set(r, r.dy); });
    apply(sec, t);
  };


  window.insertCaseSection = ({ top, from, gap, heading, lead, body, headX, textX, textW, textTop = 0, bodyColor, leadColor = "#141414", columns }) => {
    if (!frame) return;
    // the new section, as its own layer on the frame. Its text is one block, or `columns`:
    // several blocks side by side, each [{ x, w, lead, body }]
    const blocks = columns || [{ x: textX, w: textW, lead, body }];
    const sec = document.createElement("section");
    sec.className = "case-insert";
    sec.setAttribute("aria-labelledby", "case-insert-h");
    sec.style.cssText = `position:absolute;left:0;top:${top}px;width:1220px;z-index:2;font-family:'Instrument Sans',sans-serif`;
    sec.innerHTML = `
      <h2 id="case-insert-h" style="position:absolute;left:${headX}px;top:0;margin:0;font:500 28px/normal 'Instrument Sans',sans-serif;color:#000">${heading}</h2>` +
      blocks.map(c => `
      <div class="case-insert-text" style="position:absolute;left:${c.x}px;top:${textTop}px;width:${c.w}px">
        <p style="margin:0;font:400 20px/1.4 'Instrument Sans',sans-serif;color:${leadColor}">${c.lead}</p>
        <p style="margin:16px 0 0;font:400 16px/1.5 'Instrument Sans',sans-serif;color:${bodyColor}">${c.body}</p>
      </div>`).join("");
    const room = makeCaseRoom(from);   // measure before the section is there
    addCaseSection(sec, room);
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

  // caseRhythm({ titleGap, sectionGap }) – one vertical rhythm for the page: each section title
  //   (28px text starting on the left margin, x 114) sits `titleGap` above the first thing in its
  //   section, and `sectionGap` below the last thing of the section before. Works down the page one
  //   gap at a time, measuring after every move; resolves to the moves it made.
  window.caseRhythm = async ({ titleGap = 48, sectionGap = 160, L = 114 } = {}) => {
    if (!frame) return [];
    const shown = e => { for (let a = e; a && a !== frame; a = a.parentElement) { const st = getComputedStyle(a); if (st.display === "none" || st.visibility === "hidden" || st.opacity === "0") return false; } return true; };
    const xOf = el => (el.getBoundingClientRect().left - frame.getBoundingClientRect().left) / z();
    const titles = () => [...frame.querySelectorAll("p, h2")].filter(t => {
      const fs = parseFloat(getComputedStyle(t).fontSize), r = t.getBoundingClientRect();
      return fs >= 26 && fs < 40 && r.width && Math.abs(xOf(t) - L) < 3 && shown(t) && !t.closest('[data-name*=" · "]');
    }).sort((a, b) => yOf(a) - yOf(b));
    // what a section holds: text, pictures, and anything with a fill (cards, panels)
    const things = () => [...frame.querySelectorAll("p, h3, li, img, svg, video, canvas, button, div, span")].filter(e => {
      if (e.tagName === "svg" && e.parentElement.closest("svg, p")) return false;
      const r = e.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.height / z() > 2000) return false;   // not the page-long layers
      if (e.tagName === "DIV" || e.tagName === "SPAN" || e.tagName === "BUTTON") {
        const st = getComputedStyle(e);
        if (st.backgroundColor === "rgba(0, 0, 0, 0)" && st.backgroundImage === "none") return false;
      }
      return shown(e);
    });
    // blocks that follow a layer through a MutationObserver catch up before the next measurement
    const settle = async () => { await Promise.resolve(); await Promise.resolve(); };   // observers deliver as microtasks
    const moves = [];
    let ts = titles();
    const holdsTitle = e => ts.some(t => e.contains(t));
    for (let i = 0; i < ts.length; i++) {
      const t = ts[i];
      // 1) title → content
      const tb = bottomOf(t);
      const next = ts[i + 1] ? yOf(ts[i + 1]) : Infinity;
      let inside = things().filter(e => e !== t && !t.contains(e) && !holdsTitle(e) && yOf(e) >= tb - 2 && yOf(e) < next - 2);
      if (inside.length) {
        const first = Math.min(...inside.map(yOf));
        const d = Math.round(tb + titleGap - first);
        if (Math.abs(d) >= 2) { makeCaseRoom(first - 0.5).move(d); moves.push([t.textContent.trim().slice(0, 24), "title", d]); await settle(); }
      }
      // 2) end of this section → next title
      ts = titles();
      if (!ts[i + 1]) break;
      const nTop = yOf(ts[i + 1]);
      // (a picture that runs on past the next title belongs to that section, even if it starts a little above it)
      // a picture may start a little above its title. One that does (like the System Diagram, 60 px above
      // its title) is this section's even when it runs on past the next title, which then moves under it
      const own = e => yOf(e) < yOf(ts[i]);
      inside = things().filter(e => e !== ts[i] && !holdsTitle(e) && yOf(e) >= yOf(ts[i]) - 80 && yOf(e) < nTop - 2 && (bottomOf(e) <= nTop + 40 || own(e)));
      const last = Math.max(bottomOf(ts[i]), ...inside.map(bottomOf));
      const d2 = Math.round(last + sectionGap - nTop);
      // a picture that starts above the next title but runs on into its section moves with that title
      const lead = things().filter(e => !holdsTitle(e) && yOf(e) >= yOf(ts[i]) - 80 && !own(e) && yOf(e) < nTop && bottomOf(e) > nTop + 40).map(yOf);
      const cut = Math.min(nTop, ...lead);
      if (Math.abs(d2) >= 2) { makeCaseRoom(cut - 0.5).move(d2); moves.push([ts[i + 1].textContent.trim().slice(0, 24), "section", d2]); await settle(); }
      ts = titles();
    }
    return moves;
  };
})();
