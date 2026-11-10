// Home: while the PROJECTS tape is in, a quiet instrumental loop plays — an original lo-fi
// piece made on the fly with Web Audio (no audio files): electric-piano chords, a round bass,
// a soft brushed beat and a little tape wobble and hiss. It fades in when you press PROJECTS
// (the key press is what lets the browser play sound) and fades out when you press another
// key, leave the page or switch tabs.
(() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  const BPM = 76, BEAT = 60 / BPM, BAR = BEAT * 4, VOLUME = 0.16;
  // Fmaj9 – Em7 – Dm9 – Cmaj7 (MIDI notes), one bar each, with the bass root under it
  const CHORDS = [
    { notes: [53, 57, 60, 64, 67], bass: 41 },
    { notes: [52, 55, 59, 62, 64], bass: 40 },
    { notes: [50, 53, 57, 60, 64], bass: 38 },
    { notes: [48, 52, 55, 59, 62], bass: 36 },
  ];
  // a short melody over the four bars: [bar, beat, midi, beats long]
  const MELODY = [
    [0, 0.5, 76, 1], [0, 2, 74, 0.5], [0, 2.5, 72, 1.5],
    [1, 1, 71, 0.5], [1, 1.5, 72, 0.5], [1, 2, 74, 2],
    [2, 0.5, 72, 1], [2, 2, 69, 0.5], [2, 2.5, 72, 1.5],
    [3, 1, 71, 1], [3, 2.5, 67, 1.5],
  ];
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  let ctx = null, master = null, wobble = null, hiss = null, timer = 0, nextBar = 0, bar = 0, playing = false;

  const setup = () => {
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    const tone = ctx.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 2400;   // warm, a bit dull, like tape
    master.connect(tone).connect(ctx.destination);
    // tape wobble: a slow LFO on every note's detune
    wobble = ctx.createGain(); wobble.gain.value = 9;   // cents
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.6; lfo.connect(wobble); lfo.start();
    // hiss: quiet filtered noise, looping
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    hiss = ctx.createBufferSource(); hiss.buffer = buf; hiss.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 5000;
    const hg = ctx.createGain(); hg.gain.value = 0.025;
    hiss.connect(hp).connect(hg).connect(master); hiss.start();
  };

  // electric piano: sine + a quiet octave partial, fast attack, slow decay
  const keys = (m, t, len, gain) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(gain * 0.35, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.6);
    g.connect(master);
    [[1, 1], [2, 0.18]].forEach(([mul, amp]) => {
      const o = ctx.createOscillator(), a = ctx.createGain();
      o.type = "sine"; o.frequency.value = hz(m) * mul; a.gain.value = amp;
      wobble.connect(o.detune);
      o.connect(a).connect(g); o.start(t); o.stop(t + len + 0.7);
    });
  };
  const bass = (m, t, len) => {
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = "triangle"; o.frequency.value = hz(m); f.type = "lowpass"; f.frequency.value = 500;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.32, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(f).connect(g).connect(master); o.start(t); o.stop(t + len + 0.05);
  };
  const kick = t => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g).connect(master); o.start(t); o.stop(t + 0.22);
  };
  const brush = (t, gain, len) => {
    const n = Math.floor(ctx.sampleRate * len), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "bandpass"; f.frequency.value = 6000; f.Q.value = 0.7; g.gain.value = gain;
    s.buffer = buf; s.connect(f).connect(g).connect(master); s.start(t);
  };

  const scheduleBar = (i, t) => {
    const c = CHORDS[i % 4];
    // chord: lightly strummed on 1, softly repeated on the "and" of 3
    c.notes.forEach((m, k) => keys(m, t + k * 0.012, BEAT * 2.2, 0.075));
    c.notes.slice(1, 4).forEach((m, k) => keys(m, t + BEAT * 2.5 + k * 0.01, BEAT * 1.2, 0.045));
    bass(c.bass, t, BEAT * 1.8); bass(c.bass + 7, t + BEAT * 2.5, BEAT * 1.2);
    // a slightly lazy (swung) beat
    kick(t); kick(t + BEAT * 2.55);
    brush(t + BEAT, 0.12, 0.12); brush(t + BEAT * 3, 0.12, 0.12);
    for (let h = 0; h < 8; h++) brush(t + h * BEAT / 2 + (h % 2 ? BEAT * 0.08 : 0), h % 2 ? 0.03 : 0.045, 0.04);
    // melody every other time round, so the loop breathes
    if (Math.floor(i / 4) % 2) MELODY.filter(([b]) => b === i % 4).forEach(([, beat, m, l]) => keys(m, t + beat * BEAT, l * BEAT, 0.06));
  };

  const tick = () => {
    while (nextBar < ctx.currentTime + 0.3) { scheduleBar(bar++, nextBar); nextBar += BAR; }
  };

  const play = () => {
    if (playing) return;
    try {
      if (!ctx) setup();
      ctx.resume();
      playing = true;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(VOLUME, t + 1.2);
      bar = 0; nextBar = t + 0.15;
      clearInterval(timer); tick(); timer = setInterval(tick, 50);
    } catch {}
  };
  const stop = () => {
    if (!playing) return;
    playing = false;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0, t + 0.6);
    setTimeout(() => { if (!playing) { clearInterval(timer); ctx.suspend(); } }, 700);
  };

  addEventListener("tape", e => (e.detail === "works" ? play() : stop()));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else if (document.body.dataset.tape === "works") play();
  });
  addEventListener("pagehide", stop);
})();
