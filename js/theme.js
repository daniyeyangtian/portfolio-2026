// Light / dark theme for the whole site.
// - The choice lives in localStorage ("theme": "light" | "dark"); with none saved, the site is light.
// - Load this file in <head>, before the page paints, so the page never flashes the other theme.
// - Pages with the site nav get a switch (a small key, top right). The case studies (loaded in an
//   iframe by projects.html) have no switch: they follow the parent through the "storage" event,
//   which fires in every other page of the site, iframes included.
(() => {
  const KEY = "theme";
  const root = document.documentElement;
  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const apply = t => { root.dataset.theme = t === "dark" ? "dark" : "light"; };
  apply(read());
  addEventListener("storage", e => { if (e.key === KEY) apply(e.newValue); });

  window.setTheme = t => {
    try { localStorage.setItem(KEY, t); } catch (e) { /* private mode: this page only */ }
    apply(t);
    // the storage event does not reach this page's own iframes in every browser: tell them directly
    document.querySelectorAll("iframe").forEach(f => {
      try { f.contentDocument && (f.contentDocument.documentElement.dataset.theme = root.dataset.theme); } catch (e) { /* other origin */ }
    });
    document.dispatchEvent(new CustomEvent("themechange", { detail: root.dataset.theme }));
  };

  const SUN = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/></svg>';
  const MOON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8Z"/></svg>';

  const mount = () => {
    const nav = document.querySelector(".site-nav");
    if (!nav || nav.querySelector(".theme-key")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "theme-key";
    const paint = () => {
      const dark = root.dataset.theme === "dark";
      b.setAttribute("aria-pressed", dark);
      b.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      b.innerHTML = `<span class="tk-well"><span class="tk-cap">${dark ? SUN : MOON}</span></span>`;
    };
    paint();
    b.addEventListener("click", () => { setTheme(root.dataset.theme === "dark" ? "light" : "dark"); });
    document.addEventListener("themechange", paint);
    addEventListener("storage", e => { if (e.key === KEY) paint(); });
    nav.appendChild(b);
  };
  // case-study frames (css/case-dark.css): app screens built as layers keep their real colours in
  // the dark theme. A screen is a layer named like one in Figma ("09 Home", "Home · D · Light", …);
  // only the outermost is marked.
  const SCREEN = /^(?:(?:0[1-9]|1\d|2[0-6]) |(?:Hero phone|Home|Plant|Care|Harvest|You|Setup|Onboarding) · )/;
  const MAT = /design-concepts|system-diagram|profile-map|service-blueprint|newbie-journey/;   // css/case-dark.css mats these
  const keep = e => { if (!e.parentElement.closest(".keep-true")) e.classList.add("keep-true"); };
  // Line art on a transparent ground (icons, sketches: dark, grey strokes) turns light with the page
  // instead of being turned back, or it would vanish on the dark ground. A picture counts as line
  // art when much of it is transparent and what is drawn is dark and nearly colourless; a cut-out
  // render or photo is lighter or more colourful and keeps its real colours.
  const lineArt = img => {
    if (MAT.test(img.getAttribute("src") || "") || /\.svg(\?|$)/.test(img.getAttribute("src") || "")) return;
    try {
      const N = 16, c = document.createElement("canvas"); c.width = c.height = N;
      const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0, N, N);
      const d = g.getImageData(0, 0, N, N).data;
      let clear = 0, n = 0, lum = 0, sat = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 24) { clear++; continue; }
        const r = d[i], gg = d[i + 1], b = d[i + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
        n++; lum += (r + gg + b) / 3; sat += mx - mn;
      }
      if (clear > N * N * .3 && n && lum / n < 140 && sat / n < 40) img.classList.add("drawn");
    } catch (e) { /* a picture from another origin: leave it */ }
  };
  const markScreens = () => {
    const frame = document.getElementById("frame");
    if (!frame) return;
    frame.querySelectorAll("[data-name]").forEach(e => { if (SCREEN.test(e.dataset.name)) keep(e); });
    frame.querySelectorAll(".iter-slide").forEach(keep);   // iteration slides: text laid over a picture
    frame.querySelectorAll("img").forEach(img => {
      if (img.complete && img.naturalWidth) lineArt(img);
      else img.addEventListener("load", () => lineArt(img), { once: true });
    });
  };
  const ready = () => { mount(); markScreens(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready); else ready();
})();
