// Headings for the case-study pages exported from Figma. Their titles are absolutely placed <p>s,
// so instead of changing tags (and their layout) they get the heading role and level:
//   h1 – the project's name (the element `h1` finds),
//   h2 – every section title: 26–40px text in the frame (not the app screens, not a figure like "4.8%",
//        not anything marked data-no-heading),
//   h3 – the subheads the page names (`h3`: a selector).
// Nothing changes on screen. Real <h1>–<h3>s already on the page are left as they are.
(() => {
  window.markHeadings = ({ h1, h3 } = {}) => {
    const frame = document.getElementById("frame");
    if (!frame) return;
    const shown = e => { for (let a = e; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (s.display === "none" || s.visibility === "hidden") return false; } return true; };
    const mark = (e, level) => { if (!e || /^H[1-6]$/.test(e.tagName)) return; e.setAttribute("role", "heading"); e.setAttribute("aria-level", level); };
    const sub = new Set(h3 ? [...frame.querySelectorAll(h3)] : []);
    frame.querySelectorAll("p").forEach(p => {
      if (sub.has(p) || p.closest('[data-name*=" · "], .keep-true, .iter-slide, [role="dialog"], [data-no-heading]')) return;
      const fs = parseFloat(getComputedStyle(p).fontSize), text = p.textContent.trim();
      if (fs < 26 || fs > 40 || !/[a-z]{3}/i.test(text) || !p.getBoundingClientRect().width || !shown(p)) return;
      mark(p, 2);
    });
    sub.forEach(e => { if (shown(e)) mark(e, 3); });
    if (h1) mark(typeof h1 === "string" ? frame.querySelector(h1) : h1, 1);
  };
})();
