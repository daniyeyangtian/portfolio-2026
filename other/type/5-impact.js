// Food Isla (other/5.html): the opening network diagram, shrunk to the left half of the page,
// with the project's impact beside it. Runs before type/sections.js, which then closes the space
// the smaller diagram leaves. Positions are Figma frame units (the 1220-wide Figma layer).
(() => {
  const frame = document.getElementById("frame"), root = frame.querySelector(":scope > div[data-node-id]");
  const z = () => frame.getBoundingClientRect().width / 1220;
  const rel = el => { const b = el.getBoundingClientRect(), r = root.getBoundingClientRect(); return { x: (b.left - r.left) / z(), y: (b.top - r.top) / z() }; };
  // the diagram: every visible layer that starts between y 1000 and 2200 (rings, nodes, legend)
  const parts = [...root.children].filter(c => {
    if (getComputedStyle(c).display === "none") return false;
    const y = rel(c).y; return y >= 1000 && y < 2200;
  });
  if (!parts.length) return;
  // a layer the size of the Figma layer, so the parts keep their own positions inside it;
  // scaled to half round the diagram's top-left corner (90, 1013) and moved to the margin (50)
  const g = document.createElement("div");
  g.dataset.owGroup = "";
  g.setAttribute("aria-hidden", "true");
  g.style.cssText = "position:absolute;inset:0;transform-origin:90px 1013px;transform:translate(-40px,0) scale(.5);pointer-events:none";
  parts.forEach(p => g.appendChild(p));
  root.appendChild(g);

  const s = document.createElement("section");
  s.className = "fi-impact";
  s.setAttribute("aria-labelledby", "fi-impact-h");
  s.innerHTML = `
    <h2 id="fi-impact-h">Impact</h2>
    <dl class="fi-stats">
      <div><dt>events</dt><dd>12</dd></div>
      <div><dt>participations</dt><dd>950+</dd></div>
      <div><dt>months</dt><dd>14</dd></div>
    </dl>
    <h3>Brought cultures to the same table</h3>
    <p>Chinese and international students cooked xuecai, baklava, focaccia and Yunnan dipping sauce side by side, instead of watching each other's culture on display.</p>
    <h3>Took students into Ningbo</h3>
    <p>A third of the events left campus: fieldwork in Qiuga, a 500-visitor farmers' market with Shensong, a pop-up in Daimeng Hutong and a farm stay in Shanghai.</p>
    <h3>Put shared space to use</h3>
    <p>A self-designed food cart served 300+ staff and students outdoors during Sustainability Week.</p>
    <h3>Made food a medium, not a prop</h3>
    <p>Every event was built around making and tasting, so belonging came from doing things together.</p>`;
  root.appendChild(s);
})();
