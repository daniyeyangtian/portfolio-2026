// Home, PROJECTS tape: pointing at a track card plays a short sound, a soft two-note
// electric-piano chime, pitched per track (Verdure lowest, Fabric highest), with a little
// tape wobble. Made on the fly with Web Audio, no audio files. Browsers only allow sound
// after a click or key press on the page, which pressing the PROJECTS key already is.
(() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  const cards = [...document.querySelectorAll('[data-tape="works"] .track')];
  if (!AC || !cards.length) return;
  const CHIMES = [[72, 79], [76, 83], [79, 86]];   // C5–G5, E5–B5, G5–D6
  const VOLUME = 0.09;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  let ctx = null, last = 0;

  const note = (m, t, gain) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    g.connect(ctx.destination);
    [[1, 1], [2, 0.15], [3.01, 0.05]].forEach(([mul, amp]) => {   // sine body + faint bell partials
      const o = ctx.createOscillator(), a = ctx.createGain();
      o.frequency.setValueAtTime(hz(m) * mul, t);
      o.detune.setValueAtTime(-6, t); o.detune.linearRampToValueAtTime(4, t + 0.5);   // tape wobble
      a.gain.value = amp;
      o.connect(a).connect(g); o.start(t); o.stop(t + 0.75);
    });
  };
  const chime = i => {
    const now = performance.now();
    if (now - last < 90) return;   // sweeping across the cards shouldn't rattle
    last = now;
    try {
      ctx ??= new AC();
      if (ctx.state === "suspended") ctx.resume();
      const t = ctx.currentTime + 0.01, [a, b] = CHIMES[i % CHIMES.length];
      note(a, t, VOLUME); note(b, t + 0.07, VOLUME * 0.7);
    } catch {}
  };
  cards.forEach((card, i) => card.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") chime(i); }));
})();
