// Phlaro (other/4.html): the text is larger than in Figma (type/4.css), so a section can now run
// into the next one. Each section below a boundary (Figma frame y) moves down just enough to keep
// GAP px under the lowest thing above it; the page grows by the same amount.
(() => {
  const BOUNDS = [1100, 1312, 1750, 1925, 2128, 2500], GAP = 48;
  const frame = document.getElementById("frame"), root = frame.firstElementChild;
  const ft = () => frame.getBoundingClientRect().top, z = () => frame.getBoundingClientRect().width / 1220;
  const top = el => (el.getBoundingClientRect().top - ft()) / z();
  const bottom = el => {
    let b = el.getBoundingClientRect();
    if (el.textContent.trim()) { const r = document.createRange(); r.selectNodeContents(el); const t = r.getBoundingClientRect(); if (t.height) b = t; }
    return (b.bottom - ft()) / z();
  };
  // the layers, each with the section it starts in (by its Figma position, before anything moves)
  const leaves = [];
  const walk = el => [...el.children].forEach(c => { const r = c.getBoundingClientRect(); r.width || r.height ? leaves.push(c) : walk(c); });
  walk(root);
  const section = new Map(leaves.map(el => [el, BOUNDS.filter(b => top(el) >= b - 0.5).length]));
  const style = document.createElement("style"); document.head.appendChild(style);
  const baseH = parseFloat(getComputedStyle(frame).height);
  const shifts = BOUNDS.map(() => 0);
  const apply = () => {
    leaves.forEach(el => { const k = section.get(el), dy = shifts.slice(0, k).reduce((a, b) => a + b, 0); el.style.translate = dy ? `0 ${dy}px` : ""; });
    style.textContent = `#frame.case-frame { height: ${baseH + shifts.reduce((a, b) => a + b, 0)}px; }`;
  };
  const layout = () => {
    shifts.fill(0); apply();
    BOUNDS.forEach((b, k) => {
      const above = Math.max(...leaves.filter(el => section.get(el) <= k).map(bottom));
      const first = Math.min(...leaves.filter(el => section.get(el) === k + 1).map(top));
      shifts[k] = Math.max(0, Math.ceil(above + GAP - first)); apply();
    });
    if (parent !== window) parent.postMessage({ otherWorkHeight: baseH + shifts.reduce((a, b) => a + b, 0) }, location.origin);
  };
  layout();
  document.fonts?.ready.then(layout);
  addEventListener("load", layout);
})();
