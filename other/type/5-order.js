// Food Isla (other/5.html): the page's blocks, stacked in this order (they were in Figma's order):
//   opening (epigraph, network diagram, Impact) · About · My Role · Design Challenge (with a short
//   account of what we observed, and the campus map) · Activities · What I learned.
// Observation Findings and Key Insights are folded into the short account under the Design
// Challenge. Each block keeps its own inner layout; the block as a whole moves (CSS translate).
// Runs after type/5-impact.js; replaces type/sections.js on this page and reports the page height
// to work.html. Positions are Figma frame units (the 1220-wide Figma layer).
(() => {
  const frame = document.getElementById("frame"), root = frame.querySelector(":scope > div[data-node-id]");
  const z = () => frame.getBoundingClientRect().width / 1220;
  const rr = () => root.getBoundingClientRect();
  const yOf = el => (el.getBoundingClientRect().top - rr().top) / z();
  const box = el => {
    // a group (scaled diagram) counts by its contents; text by its glyphs
    const items = el.dataset.owGroup !== undefined ? [...el.children] : [el];
    let t = Infinity, b = -Infinity;
    items.forEach(i => {
      let r = i.getBoundingClientRect();
      if (i.children.length === 0 && i.textContent.trim()) { const g = document.createRange(); g.selectNodeContents(i); const q = g.getBoundingClientRect(); if (q.height) r = q; }
      if (!r.width && !r.height) return;
      t = Math.min(t, r.top); b = Math.max(b, r.bottom);
    });
    return { top: (t - rr().top) / z(), bottom: (b - rr().top) / z() };
  };

  // fold Observation Findings and Key Insights into a short account under the Design Challenge
  ["61:12001", "61:12002", "61:12003", "61:12004"].forEach(id => {
    const el = root.querySelector(`[data-node-id="${id}"]`); if (el) el.style.display = "none";
  });
  const ctx = document.createElement("p");
  ctx.className = "fi-context";
  ctx.textContent = "Chinese and international students share a campus but little else: their ties are thin, daily life rarely leaves the campus edge, and cultural exchange tends to put difference on display rather than build shared experience. Food, the one thing everyone does every day, was hardly used to bring people together.";
  root.appendChild(ctx);

  const learned = document.createElement("section");
  learned.className = "fi-learned";
  learned.setAttribute("aria-labelledby", "fi-learned-h");
  learned.innerHTML = `
    <h2 id="fi-learned-h">What I learned</h2>
    <div class="fi-learned-grid">
      <div><h3>Doing beats displaying</h3><p>People connected faster cooking a dish together than watching one presented at a culture fair.</p></div>
      <div><h3>Everyday food lowers the barrier</h3><p>A shared meal brought in people who would never sign up for a “cultural exchange” event.</p></div>
      <div><h3>Local partners make it real</h3><p>Working with the Qiuga community, Shensong and Ningbo Commerce and Trade Group turned a campus club into a bridge to the city.</p></div>
    </div>`;
  root.appendChild(learned);

  // which block each layer belongs to, by its place in Figma (before anything moves)
  const BY_Y = [[0, 2380, "impact"], [2380, 2850, "about"], [2850, 3220, "role"], [3220, 4500, "activities"],
                [4500, 7270, "map"], [7270, 1e9, "challenge"]];
  const blocks = { impact: [], about: [], role: [], challenge: [], map: [], activities: [], learned: [learned] };
  [...root.children].forEach(c => {
    if (c === learned || getComputedStyle(c).display === "none") return;
    if (c === ctx) { blocks.challenge.push(c); return; }
    if (c.dataset.block) { blocks[c.dataset.block].push(c); return; }
    const r = c.getBoundingClientRect(); if (!r.width && !r.height) return;
    const y = yOf(c); const hit = BY_Y.find(([a, b]) => y >= a && y < b); if (hit) blocks[hit[2]].push(c);
  });
  // the account sits under the Design Challenge question
  const hmw = root.querySelector('[data-node-id="61:12006"]');

  const ORDER = ["impact", "about", "role", "challenge", "map", "activities", "learned"];
  const GAP = { about: 140, role: 110, challenge: 140, map: 90, activities: 140, learned: 140 };
  const style = document.createElement("style"); document.head.appendChild(style);
  const all = Object.values(blocks).flat();
  const layout = () => {
    all.forEach(el => { el.style.translate = ""; });
    // the account: in a right-hand column, level with the question on the left
    const hb = box(hmw);
    ctx.style.top = hb.top + "px";
    let cursor = null;
    ORDER.forEach(name => {
      const els = blocks[name]; if (!els.length) return;
      const bs = els.map(box), top = Math.min(...bs.map(b => b.top)), bottom = Math.max(...bs.map(b => b.bottom));
      if (cursor === null) { cursor = bottom; return; }   // the opening stays where it is
      const dy = cursor + GAP[name] - top;
      els.forEach(el => { el.style.translate = `0 ${dy}px`; });
      cursor = bottom + dy;
    });
    // the page ends 120px under the last block (frame units, from the frame's top)
    const off = (rr().top - frame.getBoundingClientRect().top) / z();
    const h = Math.ceil(off + cursor + 120);
    style.textContent = `#frame.case-frame { height: ${h}px; }`;
    if (parent !== window) parent.postMessage({ otherWorkHeight: h }, location.origin);
  };
  layout();
  document.fonts?.ready.then(layout);
  addEventListener("load", layout);
})();
