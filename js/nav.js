// Top nav: an underline that sits under the current page, follows hover,
// and slides to the target before navigating to another page.
(() => {
  const list = document.querySelector(".site-nav ul");
  if (!list) return;
  const links = [...list.querySelectorAll("a")];
  const current = links.find(a => a.getAttribute("aria-current") === "page") || links[0];
  const bar = document.createElement("span");
  bar.className = "nav-indicator no-anim";
  list.appendChild(bar);

  const HOVER_DWELL = 140;   // ms
  let hoverT = 0, spinTo = null;   // spinTo is set once the dial exists
  const moveTo = a => {
    bar.style.width = a.offsetWidth + "px";
    bar.style.transform = `translateX(${a.offsetLeft}px)`;
  };

  // Place under the current page without animating, then enable transitions.
  const place = () => {
    bar.classList.add("no-anim");
    moveTo(current);
    bar.offsetWidth; // flush so the next change animates
    bar.classList.remove("no-anim");
  };
  document.fonts.ready.then(place);
  place();
  addEventListener("resize", place);
  addEventListener("pageshow", place); // back/forward cache

  links.forEach(a => {
    // hover: follow only once the pointer rests on a link (passing over one on the way to
    // the dial's − / + shouldn't drag the underline along)
    a.addEventListener("mouseenter", () => { clearTimeout(hoverT); hoverT = setTimeout(() => moveTo(a), HOVER_DWELL); });
    a.addEventListener("mouseleave", () => clearTimeout(hoverT));
    a.addEventListener("focus", () => moveTo(a));
    a.addEventListener("click", e => {
      if (a.getAttribute("aria-disabled") === "true" || a === current) { e.preventDefault(); return; }
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      moveTo(a);
      spinTo?.(a);   // the dial turns to the new page
      const go = () => { location.href = a.href; };
      matchMedia("(prefers-reduced-motion: reduce)").matches ? go() : setTimeout(go, 420);
    });
  });
  list.addEventListener("mouseleave", () => { clearTimeout(hoverT); moveTo(current); });
  list.addEventListener("focusout", e => { if (!list.contains(e.relatedTarget)) moveTo(current); });

  // ---------- exposure dial above the nav ----------
  // One bead per page; − / + step to the previous / next available page. Going to
  // another page turns the dial (the beads and knurling roll by that many steps).
  // The dial is centred on the page.
  const nav = list.closest(".site-nav");
  const dial = document.createElement("div");
  dial.className = "nav-dial";
  dial.innerHTML = `
    <button type="button" class="dial-step" data-step="-1" aria-label="Previous page">&minus;</button>
    <span class="dial-well"><span class="dial-slot"><span class="dial-track" aria-hidden="true"></span></span></span>
    <button type="button" class="dial-step" data-step="1" aria-label="Next page">+</button>`;
  nav.prepend(dial);
  const track = dial.querySelector(".dial-track");
  const W = 150, PAD = 26, n = links.length;
  const xOf = i => PAD + (W - 2 * PAD) * (n > 1 ? i / (n - 1) : .5);
  const STEP = n > 1 ? (W - 2 * PAD) / (n - 1) : W;
  // The beads sit on a row that rolls when the bar is dragged. It carries extra beads
  // past both ends (hidden in the dark of the slot), so after rolling a whole number of
  // steps it looks exactly like it did at rest and can jump back to 0 unseen.
  const row = document.createElement("span");
  row.className = "dial-row";
  track.appendChild(row);
  for (let j = -6; j < n + 6; j++) {
    const b = document.createElement("span");
    b.className = "dial-bead";
    b.style.setProperty("--x", PAD + j * STEP + "px");
    row.appendChild(b);
  }
  // Lay the link row out under the dial. With an even number of links the row splits in
  // two around the dial: the first half ends at the dial's left edge (the −), the second
  // starts at its right edge (the +). With an odd number, the middle link sits under the dial.
  const SPLIT_GAP = 40;   // px between each half and the dial's edge
  const centre = () => {
    list.style.transform = "";
    const d = dial.getBoundingClientRect(), mid = d.left + d.width / 2;
    if (n % 2) {
      const m = links[(n - 1) / 2].getBoundingClientRect();
      list.style.transform = `translateX(${mid - (m.left + m.width / 2)}px)`;
      return;
    }
    const right = links[n / 2].parentElement;
    right.style.marginLeft = "";
    const a = links[n / 2 - 1].getBoundingClientRect(), b = links[n / 2].getBoundingClientRect();
    const want = d.width + 2 * SPLIT_GAP, have = b.left - a.right;
    // only when there is room for it; on narrow screens the row stays as it is, centred
    const split = want > have && list.parentElement.clientWidth >= list.scrollWidth + (want - have) + 32;
    if (split) right.style.marginLeft = want - have + "px";
    nav.classList.toggle("is-split", split);   // one row: it sits a little lower (site.css)
    const a2 = links[n / 2 - 1].getBoundingClientRect(), b2 = links[n / 2].getBoundingClientRect();
    // split around the dial, the links also rise to the dial's height, level with it
    const d2 = dial.getBoundingClientRect();
    const dy = split ? (d2.top + d2.height / 2) - (a2.top + a2.height / 2) : 0;
    list.style.transform = `translate(${mid - (a2.right + b2.left) / 2}px, ${dy}px)`;
    place();   // the links after the split moved: put the underline back under the current one
  };
  document.fonts.ready.then(centre);
  centre();
  addEventListener("resize", centre);

  const enabled = a => a.getAttribute("aria-disabled") !== "true";
  // nowhere to go: the dial nudges against its stop and springs back
  const bump = dir => {
    track.style.setProperty("--bump", dir * 4 + "px");
    track.classList.remove("bump"); track.offsetWidth; track.classList.add("bump");
  };
  dial.querySelectorAll(".dial-step").forEach(btn => btn.addEventListener("click", () => {
    const dir = Number(btn.dataset.step);
    let i = links.indexOf(current) + dir;
    while (links[i] && !enabled(links[i])) i += dir;
    links[i] ? links[i].click() : bump(dir);
  }));
  // Click the bar → nearest page. Press and drag → the whole bar rolls with the
  // pointer (beads and knurling together) and the nav underline follows;
  // on release it clicks into the nearest step and goes to that page. Rolling onto a
  // "coming soon" page, or past either end, springs back.
  const nearestTo = x => links.reduce((best, a, i) => Math.abs(xOf(i) - x) < Math.abs(xOf(links.indexOf(best)) - x) ? a : best, links[0]);
  const setShift = (px, animate) => {
    dial.classList.toggle("is-rolling", !animate);
    row.style.transform = `translateX(${px}px)`;
    track.style.setProperty("--roll", roll + px + "px");
  };
  const goTo = target => {
    if (enabled(target) && target !== current) { target.click(); return; }   // the click turns the dial
    setShift(0, true); moveTo(current);
    bump(target === current ? 1 : Math.sign(xOf(links.indexOf(target)) - xOf(links.indexOf(current))));
  };
  let drag = null, roll = 0;
  // "Click" when the bar passes a step: a quick jolt of the dial, a short buzz on
  // phones that support it, and a very quiet tick sound.
  let audio = null;
  const tick = () => {
    dial.classList.remove("tick"); dial.offsetWidth; dial.classList.add("tick");
    navigator.vibrate?.(8);
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      const t = audio.currentTime, len = Math.floor(audio.sampleRate * 0.012);
      const buf = audio.createBuffer(1, len, audio.sampleRate), d = buf.getChannelData(0);
      for (let j = 0; j < len; j++) d[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / len, 4);
      const src = audio.createBufferSource(), hp = audio.createBiquadFilter(), g = audio.createGain();
      hp.type = "highpass"; hp.frequency.value = 2500; g.gain.value = 0.12;
      src.buffer = buf; src.connect(hp).connect(g).connect(audio.destination); src.start(t);
    } catch {}
  };
  const scale = () => track.offsetWidth / track.getBoundingClientRect().width || 1; // undo any zoom
  track.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    e.preventDefault();
    track.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, startX: e.clientX, moved: false, shift: 0, near: current };
  });
  track.addEventListener("pointermove", e => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.abs(e.clientX - drag.startX) < 3) return;
    if (!drag.moved) { drag.moved = true; dial.classList.add("is-dragging"); }
    const i = links.indexOf(current);
    const lo = xOf(0) - xOf(i), hi = xOf(n - 1) - xOf(i);
    let dx = (e.clientX - drag.startX) * scale();
    // past either end the bar resists, like a dial hitting its stop
    if (dx < lo) dx = lo + (dx - lo) * 0.25;
    if (dx > hi) dx = hi + (dx - hi) * 0.25;
    // Detents: the bar sticks a little around each step and hurries between them.
    if (dx > lo && dx < hi) {
      const st = dx / STEP, k = Math.round(st), f = st - k;          // f in −0.5…0.5
      dx = (k + Math.sign(f) * 0.5 * Math.pow(Math.abs(2 * f), 1.7)) * STEP;
    }
    drag.shift = dx;
    setShift(dx, false);
    const near = nearestTo(xOf(i) + dx);
    if (drag.near && near !== drag.near) tick();
    drag.near = near;
    moveTo(near);
  });
  const end = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    dial.classList.remove("is-dragging");
    if (e.type === "pointercancel") { setShift(0, true); moveTo(current); return; }
    const x = d.moved ? xOf(links.indexOf(current)) + d.shift : (e.clientX - track.getBoundingClientRect().left) * scale();
    goTo(nearestTo(x));
  };
  track.addEventListener("pointerup", end);
  track.addEventListener("pointercancel", end);
  // Turn the dial by as many steps as the target page is from this one.
  spinTo = a => setShift(xOf(links.indexOf(a)) - xOf(links.indexOf(current)), true);
  // back/forward cache: the page comes back with the dial still turned; reset it unseen
  addEventListener("pageshow", e => { if (e.persisted) { roll = 0; setShift(0, false); row.offsetWidth; dial.classList.remove("is-rolling"); } });
})();
