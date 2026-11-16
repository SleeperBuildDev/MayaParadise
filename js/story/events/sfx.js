// One-shot sounds for the town gatherings (js/story/extras-events.js). All original, made in code (Web Audio), a few
// short-lived nodes each, played into the game's master bus (game.audio.output: the sound button mutes them).
// Never a known tune: the mallet motif picks random steps of a pentatonic scale; no voices, no words.
//
//   const sfx = createEventSfx(game)
//   sfx.play(name, vol01, pan)   name: clap rattan meow whistle tvMurmur pump mallet thud clink rustle bell flap gust
//                                chimes sizzle steps cheer (cheer / pop / sparkle / chime go through game.audio.play)
const R = Math.random;

export function createEventSfx(game) {
  let noise = null;
  const ctxOf = () => game.audio?.context || null;
  function noiseBuf(ctx) {
    if (noise && noise.sampleRate === ctx.sampleRate) return noise;
    const n = Math.floor(ctx.sampleRate * 1.2), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = R() * 2 - 1;
    return (noise = b);
  }
  function out(ctx, pan, v) {
    const g = ctx.createGain();
    g.gain.value = v;
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); p.connect(game.audio.output); }
    else g.connect(game.audio.output);
    return g;
  }
  function env(param, t, a, peak, d) {
    param.setValueAtTime(0.0001, t);
    param.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    param.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function tone(ctx, dest, t, { type = 'sine', f, f2 = 0, a = 0.005, d = 0.2, v = 0.2, glideT = 0 }) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + (glideT || a + d));
    env(g.gain, t, a, v, d);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + a + d + 0.05);
  }
  function hiss(ctx, dest, t, { type = 'bandpass', f = 1500, q = 1, a = 0.003, d = 0.08, v = 0.3, f2 = 0 }) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf(ctx); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    env(g.gain, t, a, v, d);
    s.connect(fl); fl.connect(g); g.connect(dest);
    const off = R() * 0.8;
    s.start(t, off, a + d + 0.05);
  }
  const PENTA = [0, 2, 4, 7, 9];
  const S = {
    clap(ctx, d, t) { const n = 5 + Math.floor(R() * 5); for (let k = 0; k < n; k++) for (let j = 0; j < 3; j++) hiss(ctx, d, t + k * (0.16 + R() * 0.12) + j * 0.045 + R() * 0.03, { f: 1100 + R() * 900, q: 1.4, d: 0.05, v: 0.25 }); },
    rattan(ctx, d, t) { tone(ctx, d, t, { type: 'triangle', f: 520 + R() * 120, f2: 300, d: 0.07, v: 0.35 }); hiss(ctx, d, t, { f: 2400, q: 3, d: 0.03, v: 0.18 }); },
    meow(ctx, d, t) { tone(ctx, d, t, { type: 'sawtooth', f: 720, f2: 980, a: 0.05, d: 0.32, v: 0.05, glideT: 0.18 }); tone(ctx, d, t + 0.02, { type: 'sine', f: 1450, f2: 1100, a: 0.05, d: 0.3, v: 0.07 }); },
    whistle(ctx, d, t) { tone(ctx, d, t, { f: 2100, f2: 2600, a: 0.02, d: 0.28, v: 0.12 }); tone(ctx, d, t + 0.36, { f: 2500, f2: 2050, a: 0.02, d: 0.42, v: 0.12 }); },
    tvMurmur(ctx, d, t) { // a vowel-like blur under a crowd's hush, no words
      for (let k = 0; k < 4; k++) hiss(ctx, d, t + k * 0.22, { f: 500 + R() * 600, q: 6, a: 0.06, d: 0.18, v: 0.12 });
      hiss(ctx, d, t, { type: 'lowpass', f: 900, q: 0.5, a: 0.2, d: 0.9, v: 0.08 });
    },
    pump(ctx, d, t) { for (let k = 0; k < 3; k++) hiss(ctx, d, t + k * 0.38, { f: 3000, f2: 1600, q: 1.2, a: 0.04, d: 0.18, v: 0.16 }); },
    mallet(ctx, d, t) { // 3-5 random steps of a pentatonic scale (never a known tune)
      const n = 3 + Math.floor(R() * 3), root = 67 + Math.floor(R() * 3);
      for (let k = 0; k < n; k++) { const m = root + PENTA[Math.floor(R() * 5)] + (R() < 0.3 ? 12 : 0); const f = 440 * Math.pow(2, (m - 69) / 12); tone(ctx, d, t + k * 0.17, { type: 'triangle', f, d: 0.35, v: 0.16 }); tone(ctx, d, t + k * 0.17, { f: f * 4, d: 0.08, v: 0.03 }); }
    },
    thud(ctx, d, t) { tone(ctx, d, t, { f: 140, f2: 70, d: 0.12, v: 0.3 }); hiss(ctx, d, t, { type: 'lowpass', f: 600, d: 0.06, v: 0.15 }); },
    clink(ctx, d, t) { for (let k = 0; k < 2; k++) tone(ctx, d, t + k * 0.11, { type: 'triangle', f: 2600 + R() * 900, d: 0.18, v: 0.06 }); },
    rustle(ctx, d, t) { for (let k = 0; k < 5; k++) hiss(ctx, d, t + k * 0.05 + R() * 0.03, { f: 3500 + R() * 2000, q: 0.8, d: 0.06, v: 0.12 }); },
    bell(ctx, d, t) { for (let k = 0; k < 2; k++) { tone(ctx, d, t + k * 0.14, { type: 'triangle', f: 2900, d: 0.35, v: 0.09 }); tone(ctx, d, t + k * 0.14, { f: 4350, d: 0.2, v: 0.04 }); } },
    flap(ctx, d, t) { for (let k = 0; k < 3; k++) hiss(ctx, d, t + k * 0.07, { f: 900, q: 0.7, d: 0.05, v: 0.14 }); },
    gust(ctx, d, t) { hiss(ctx, d, t, { type: 'lowpass', f: 400, f2: 1200, q: 0.4, a: 0.4, d: 1.0, v: 0.1 }); },
    chimes(ctx, d, t) { for (let k = 0; k < 4; k++) { const m = 79 + PENTA[Math.floor(R() * 5)]; tone(ctx, d, t + k * (0.14 + R() * 0.2), { type: 'sine', f: 440 * Math.pow(2, (m - 69) / 12), d: 0.6, v: 0.05 }); } },
    sizzle(ctx, d, t) { hiss(ctx, d, t, { type: 'highpass', f: 3000, q: 0.5, a: 0.05, d: 0.9, v: 0.09 }); for (let k = 0; k < 6; k++) hiss(ctx, d, t + R() * 0.8, { f: 5000, q: 4, d: 0.02, v: 0.08 }); },
    steps(ctx, d, t) { for (let k = 0; k < 6; k++) hiss(ctx, d, t + k * 0.16, { type: 'lowpass', f: 700, d: 0.04, v: 0.16 }); },
  };
  const UI = new Set(['cheer', 'pop', 'sparkle', 'chime']);
  let last = new Map();
  return {
    names: Object.keys(S),
    play(name, vol = 1, pan = 0) {
      if (vol <= 0.02) return;
      if (UI.has(name)) { try { game.audio?.play?.(name); } catch { /* no sound */ } return; }
      const f = S[name], ctx = ctxOf();
      if (!f || !ctx || ctx.state !== 'running' || !game.audio?.output || game.audio.muted) return;
      const now = ctx.currentTime;
      if (now - (last.get(name) || -9) < 0.08) return; // (the same sound twice in a frame or two: once)
      last.set(name, now);
      try { f(ctx, out(ctx, pan, Math.min(1, vol)), now + 0.02); } catch (e) { /* a browser without some node */ }
    },
  };
}
