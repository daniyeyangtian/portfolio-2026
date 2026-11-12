// Other Work pages whose text was set larger than in Figma (other/type/<n>.css): a section can
// now run into the next one. Each section below a boundary (Figma frame y, data-bounds on this
// script tag; "y:gap" sets that boundary's own gap) moves down just enough to keep data-gap px
// under the lowest thing above it; the
// page grows by the same amount and tells work.html its new height.
(() => {
  const me = document.currentScript;
  const GAP = Number(me.dataset.gap || 48);
  const spec = me.dataset.bounds.split(",").map(t => t.split(":").map(Number));
  const BOUNDS = spec.map(([y]) => y), GAPS = spec.map(([, g]) => g ?? GAP);
  const frame = document.getElementById("frame"), root = frame.firstElementChild;
  const ft = () => frame.getBoundingClientRect().top, z = () => frame.getBoundingClientRect().width / 1220;
  const top = el => (el.getBoundingClientRect().top - ft()) / z();
  const bottom = el => {
    let b = el.getBoundingClientRect();
    if (el.textContent.trim()) { const r = document.createRange(); r.selectNodeContents(el); const t = r.getBoundingClientRect(); if (t.height) b = t; }
    return (b.bottom - ft()) / z();
  };
  // the layers, each with the section it starts in (by its position before anything moves)
  const leaves = [];
  const walk = el => [...el.children].forEach(c => {
    if (getComputedStyle(c).display === "none") return;
    const r = c.getBoundingClientRect(); r.width || r.height ? leaves.push(c) : walk(c);
  });
  walk(root);
  const section = new Map(leaves.map(el => [el, BOUNDS.filter(b => top(el) >= b - 0.5).length]));
  const style = document.createElement("style"); document.head.appendChild(style);
  const baseH = parseFloat(getComputedStyle(frame).height);
  const shifts = BOUNDS.map(() => 0);
  const total = () => shifts.reduce((a, b) => a + b, 0);
  const apply = () => {
    leaves.forEach(el => { const dy = shifts.slice(0, section.get(el)).reduce((a, b) => a + b, 0); el.style.translate = dy ? `0 ${dy}px` : ""; });
    style.textContent = `#frame.case-frame { height: ${baseH + total()}px; }`;
  };
  const layout = () => {
    shifts.fill(0); apply();
    BOUNDS.forEach((b, k) => {
      const above = Math.max(...leaves.filter(el => section.get(el) <= k).map(bottom));
      const first = Math.min(...leaves.filter(el => section.get(el) === k + 1).map(top));
      shifts[k] = Math.max(0, Math.ceil(above + GAPS[k] - first)); apply();
    });
    if (parent !== window) parent.postMessage({ otherWorkHeight: baseH + total() }, location.origin);
  };
  layout();
  document.fonts?.ready.then(layout);
  addEventListener("load", layout);
})();
