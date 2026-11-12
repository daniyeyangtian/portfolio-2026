// Food Isla (other/5.html): an epigraph to open the page (M.F.K. Fisher, and our own line on
// islands), then the network diagram, shrunk to the left half, with the project's impact beside it. Runs before type/sections.js, which then closes the space
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
  const DOWN = 470;   // room for the epigraph (and the margin round it) above the diagram and Impact

  const q = document.createElement("figure");
  q.className = "fi-epigraph";
  q.innerHTML = `
    <blockquote><p>There is a communion of more than our bodies when bread is broken and wine drunk.</p></blockquote>
    <figcaption>M.F.K. Fisher, <cite>The Gastronomical Me</cite> (1943)</figcaption>
    <p class="fi-island">Every culture is an island of its own. Food is how we reach each other’s shores.</p>`;
  root.appendChild(q);
  // a layer the size of the Figma layer, so the parts keep their own positions inside it;
  // scaled to half round the diagram's top-left corner (90, 1013) and moved to x 76, in line
  // with the section titles below (About Food Isla, My Role)
  const g = document.createElement("div");
  g.dataset.owGroup = "";
  g.setAttribute("aria-hidden", "true");
  g.style.cssText = `position:absolute;inset:0;transform-origin:90px 1013px;transform:translate(-14px,${DOWN}px) scale(.5);pointer-events:none`;
  parts.forEach(p => g.appendChild(p));
  root.appendChild(g);

  const s = document.createElement("section");
  s.className = "fi-impact";
  s.style.top = 1013 + DOWN + "px";
  s.setAttribute("aria-labelledby", "fi-impact-h");
  s.innerHTML = `
    <h2 id="fi-impact-h">Impact</h2>
    <dl class="fi-stats">
      <div><dt>events</dt><dd>12</dd></div>
      <div><dt>participations</dt><dd>950+</dd></div>
      <div><dt>months</dt><dd>14</dd></div>
    </dl>
    <h3>Connected the campus with Ningbo</h3>
    <p>Partnered with Ningbo Commerce and Trade Group and the Qiuga community on a series of workshops, and delivered design proposals for renovating their community spaces. A third of all events took students off campus, from a 500-visitor farmers' market with Shensong to a pop-up in Daimeng Hutong.</p>
    <h3>Food as a common language</h3>
    <p>Chinese and international students cooked xuecai, baklava, focaccia and Yunnan dipping sauce together, and traded the stories behind each dish, instead of watching each other's culture on display.</p>
    <h3>Put shared space to use</h3>
    <p>A self-designed food cart served 300+ staff and students outdoors during Sustainability Week.</p>
    <h3>Made food a medium, not a prop</h3>
    <p>Every event was built around making and tasting, so belonging came from doing things together.</p>`;
  root.appendChild(s);
})();
