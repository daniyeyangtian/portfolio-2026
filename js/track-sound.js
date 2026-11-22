// Home, PROJECTS tape and the Featured projects players below it: pointing at a card plays a short sound, a soft two-note
// electric-piano chime, low and rounded, pitched per track (Verdure lowest, Fabric highest), with a little
// tape wobble. Made on the fly with Web Audio, no audio files. Browsers only allow sound
// after a click or key press on the page, which pressing the PROJECTS key already is.
(() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  // each set counts from its first card, so Verdure, Clicket and Fabric keep their own chime
  const sets = ['[data-tape="works"] .track', ".featured .player"].map(q => [...document.querySelectorAll(q)]);
  if (!AC || !sets.some(s => s.length)) return;
  const CHIMES = [[60, 67], [64, 71], [67, 74]];   // C4–G4, E4–B4, G4–D5: an octave lower, softer
  const VOLUME = 0.11;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  let ctx = null, last = 0;

  const note = (m, t, gain) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    g.connect(ctx.destination);
    [[1, 1], [2, 0.06]].forEach(([mul, amp]) => {   // sine body + a faint octave
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
  sets.forEach(cards => cards.forEach((card, i) => card.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") chime(i); })));
})();
