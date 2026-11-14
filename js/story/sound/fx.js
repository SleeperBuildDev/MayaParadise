// One-shot ambience events for the soundscape (birds, bells, gulls, vendor calls, the press ...).
// Each is a few short-lived Web Audio nodes, scheduled at time t; all original, all made in code.
//
//   FX[name](E, t, v) -> seconds it lasts
//   E = { ctx, bank, dest, verb }  dest: where the dry sound goes (a panner per event is added here),
//                                  verb: the shared reverb input (far things get more of it)
import { mtof } from './bank.js';

const R = Math.random;
const pick = (a) => a[Math.floor(R() * a.length)];

/** A per-event exit: optional low-pass ("far away"), a pan and a reverb send. Returns the input node. */
function exit(E, t, dur, { pan = (R() - 0.5) * 1.4, far = 0, wet = 0.25 } = {}) {
  const { ctx } = E;
  const g = ctx.createGain();
  let head = g;
  if (far > 0) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 5200 - far * 4200;
    lp.connect(g); head = lp;
  }
  if (ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    g.connect(p); p.connect(E.dest);
  } else g.connect(E.dest);
  if (E.verb && wet > 0) {
    const s = ctx.createGain(); s.gain.value = wet + far * 0.35; g.connect(s); s.connect(E.verb);
  }
  return head;
}
function env(param, t, a, peak, d, hold = 0) {
  param.setValueAtTime(0.0001, t);
  param.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
  if (hold) param.setValueAtTime(Math.max(0.0002, peak), t + a + hold);
  param.exponentialRampToValueAtTime(0.0001, t + a + hold + d);
}
function osc(E, out, t, { type = 'sine', f, a = 0.005, d = 0.2, hold = 0, v = 0.1, glide = null, vib = 0 }) {
  const { ctx } = E;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (glide) for (const [ff, dt] of glide) o.frequency.exponentialRampToValueAtTime(ff, t + dt);
  if (vib) {
    const l = ctx.createOscillator(), lg = ctx.createGain();
    l.frequency.value = vib[0]; lg.gain.value = vib[1];
    l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + a + hold + d + 0.05);
  }
  env(g.gain, t, a, v, d, hold);
  o.connect(g); g.connect(out);
  o.start(t); o.stop(t + a + hold + d + 0.05);
}
/** A bank note (instrument sample) into `out`. */
export function sample(E, out, inst, midi, t, v, { dur = 0, rel = 0.15 } = {}) {
  const nb = E.bank.note(inst, midi);
  if (!nb) return;
  const { ctx } = E;
  const s = ctx.createBufferSource(), g = ctx.createGain();
  s.buffer = nb.buffer; s.playbackRate.value = nb.rate; s.loop = nb.loop;
  if (nb.loop) {
    const len = dur || 2;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + Math.min(1.2, len * 0.4));
    g.gain.setValueAtTime(v, t + Math.max(len * 0.6, len - 1));
    g.gain.linearRampToValueAtTime(0, t + len + rel);
    s.start(t); s.stop(t + len + rel + 0.05);
  } else {
    g.gain.value = v;
    s.start(t);
    if (dur) { g.gain.setValueAtTime(v, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + rel); s.stop(t + dur + rel + 0.02); }
    else s.stop(t + nb.buffer.duration / nb.rate + 0.02);
  }
  s.connect(g); g.connect(out);
}
/** Noise through a filter with an envelope (uses the bank's white loop). */
function noise(E, out, t, { type = 'bandpass', f = 2000, f1 = 0, q = 1, a = 0.01, d = 0.2, hold = 0, v = 0.1, swell = false }) {
  const { ctx } = E;
  const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = E.bank.loop('white'); s.loop = true;
  fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
  if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + a + hold + d);
  if (swell) {
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.setValueAtTime(v, t + a + hold); g.gain.linearRampToValueAtTime(0, t + a + hold + d);
  } else env(g.gain, t, a, v, d, hold);
  s.connect(fl); fl.connect(g); g.connect(out);
  s.start(t, R() * 1.5); s.stop(t + a + hold + d + 0.05);
}

export const FX = {
  // ---- birds and creatures ----
  sparrow(E, t, v = 1) {
    const out = exit(E, t, 1, { far: R() * 0.4, wet: 0.2 });
    const n = 2 + Math.floor(R() * 4), b = 3200 + R() * 1200;
    for (let k = 0; k < n; k++) osc(E, out, t + k * (0.09 + R() * 0.05), { f: b * (0.9 + R() * 0.2), glide: [[b * 1.35, 0.04], [b * 0.9, 0.07]], a: 0.005, d: 0.06, v: 0.05 * v });
    return n * 0.14;
  },
  warble(E, t, v = 1) { // a songbird: a short original motif, repeated once or twice
    const out = exit(E, t, 2, { far: R() * 0.5, wet: 0.3 });
    const base = 2200 + R() * 1400, motif = Array.from({ length: 4 + Math.floor(R() * 4) }, () => [base * (0.8 + R() * 0.6), 0.05 + R() * 0.07]);
    let tt = t;
    for (let rep = 0; rep < 1 + Math.floor(R() * 2); rep++) {
      for (const [f, len] of motif) { osc(E, out, tt, { f, glide: [[f * (0.85 + R() * 0.35), len]], a: 0.008, d: len, v: 0.04 * v }); tt += len + 0.02; }
      tt += 0.25;
    }
    return tt - t;
  },
  gull(E, t, v = 1) {
    const out = exit(E, t, 2, { far: 0.3 + R() * 0.5, wet: 0.4 });
    const n = 2 + Math.floor(R() * 3);
    for (let k = 0; k < n; k++) {
      const f = 1350 + R() * 300, tt = t + k * (0.32 + R() * 0.1);
      osc(E, out, tt, { type: 'triangle', f, glide: [[f * 1.25, 0.05], [f * 0.72, 0.28]], a: 0.02, d: 0.26, v: 0.05 * v, vib: [28, 40] });
    }
    return n * 0.4;
  },
  dog(E, t, v = 1) {
    const out = exit(E, t, 1, { far: 0.5 + R() * 0.4, wet: 0.4 });
    const n = 1 + Math.floor(R() * 3), f = 260 + R() * 120;
    const { ctx } = E;
    for (let k = 0; k < n; k++) {
      const tt = t + k * (0.28 + R() * 0.12);
      const o = ctx.createOscillator(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 1.3, tt); o.frequency.exponentialRampToValueAtTime(f * 0.75, tt + 0.13);
      bp.type = 'bandpass'; bp.frequency.value = 750; bp.Q.value = 2;
      env(g.gain, tt, 0.01, 0.07 * v, 0.12);
      o.connect(bp); bp.connect(g); g.connect(out); o.start(tt); o.stop(tt + 0.2);
    }
    return n * 0.4;
  },
  frog(E, t, v = 1) {
    const out = exit(E, t, 1, { far: 0.2 + R() * 0.4, wet: 0.2 });
    const f = 95 + R() * 50;
    for (let k = 0; k < 3; k++) osc(E, out, t + k * 0.07, { type: 'square', f, glide: [[f * 0.85, 0.05]], a: 0.004, d: 0.05, v: 0.03 * v });
    return 0.3;
  },
  owlet(E, t, v = 1) { // a small night bird: two soft hoots
    const out = exit(E, t, 1, { far: 0.6, wet: 0.5 });
    const f = 520 + R() * 80;
    osc(E, out, t, { f, glide: [[f * 0.94, 0.3]], a: 0.06, d: 0.3, v: 0.05 * v });
    osc(E, out, t + 0.55, { f: f * 0.97, glide: [[f * 0.9, 0.4]], a: 0.08, d: 0.4, v: 0.04 * v });
    return 1;
  },
  // ---- bells, wheels, metal ----
  bikeBell(E, t, v = 1) {
    const out = exit(E, t, 1, { far: R() * 0.5, wet: 0.2 });
    const n = 2 + Math.floor(R() * 2), m = 93 + Math.floor(R() * 3);
    for (let k = 0; k < n; k++) sample(E, out, 'bell', m, t + k * 0.11, 0.05 * v, { dur: 0.09, rel: 0.25 });
    return 0.6;
  },
  schoolBell(E, t, v = 1) { // a hand bell rung far off
    const out = exit(E, t, 2, { far: 0.75, wet: 0.5 });
    for (let k = 0; k < 10; k++) sample(E, out, 'bell', k % 2 ? 83 : 84, t + k * 0.19, 0.06 * v * (k < 2 ? 0.7 : 1), { dur: 0.17, rel: 0.4 });
    return 2.6;
  },
  clink(E, t, v = 1) { // scale weights, cups, a spoon on a glass
    const out = exit(E, t, 0.4, { far: R() * 0.4, wet: 0.15 });
    const n = 1 + Math.floor(R() * 2);
    for (let k = 0; k < n; k++) { const m = 98 + Math.floor(R() * 6); sample(E, out, 'bell', m, t + k * (0.08 + R() * 0.1), 0.03 * v, { dur: 0.05, rel: 0.12 }); }
    return 0.4;
  },
  chimes(E, t, v = 1) { // a little wind chime (pentatonic, random)
    const out = exit(E, t, 3, { far: 0.1, wet: 0.45 });
    const P = [84, 86, 88, 91, 93, 96];
    const n = 3 + Math.floor(R() * 4);
    for (let k = 0; k < n; k++) sample(E, out, 'bell', pick(P), t + k * (0.12 + R() * 0.25), 0.025 * v);
    return 2.5;
  },
  horn(E, t, v = 1) { // a boat horn far down the river
    const out = exit(E, t, 4, { far: 0.7, wet: 0.7, pan: (R() - 0.5) * 0.6 });
    for (const f of [98, 146.8]) osc(E, out, t, { type: 'sawtooth', f, glide: [[f * 0.985, 2.4]], a: 0.35, hold: 1.4, d: 0.9, v: 0.035 * v });
    return 3;
  },
  // ---- people ----
  vendorCall(E, t, v = 1) { // a seller's call as a soft vowel texture (no words), sung on a few pentatonic steps
    const { ctx } = E;
    const out = exit(E, t, 3, { far: 0.35 + R() * 0.45, wet: 0.45 });
    const base = R() < 0.5 ? 57 : 50, steps = [0, 2, 4, 7, 9], n = 2 + Math.floor(R() * 2);
    const o = ctx.createOscillator(), f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(), g = ctx.createGain(), m = ctx.createGain();
    o.type = 'sawtooth'; f1.type = f2.type = 'bandpass'; f1.Q.value = 6; f2.Q.value = 8;
    o.connect(f1); o.connect(f2); f1.connect(m); f2.connect(m); m.gain.value = 1; m.connect(g); g.connect(out);
    let tt = t;
    g.gain.setValueAtTime(0, t);
    for (let k = 0; k < n; k++) {
      const len = k === n - 1 ? 0.7 + R() * 0.4 : 0.22 + R() * 0.2, note = base + pick(steps) + (k === n - 1 ? 0 : 2);
      const vw = pick([[800, 1200], [560, 950], [700, 1700]]);
      o.frequency.setTargetAtTime(mtof(note), tt, 0.03);
      f1.frequency.setTargetAtTime(vw[0], tt, 0.03); f2.frequency.setTargetAtTime(vw[1], tt, 0.03);
      g.gain.setTargetAtTime(0.09 * v, tt, 0.03);
      if (k === n - 1) o.frequency.setTargetAtTime(mtof(note - 2), tt + len * 0.6, 0.12);
      tt += len;
      g.gain.setTargetAtTime(k === n - 1 ? 0 : 0.03 * v, tt - 0.05, 0.04);
    }
    o.start(t); o.stop(tt + 0.4);
    return tt - t;
  },
  steps(E, t, v = 1, { surface = 'stone' } = {}) { // someone walks past
    const { ctx } = E;
    const n = 6 + Math.floor(R() * 6), gap = 0.45 + R() * 0.12, from = R() < 0.5 ? -0.8 : 0.8;
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const g = ctx.createGain(); g.gain.value = 1;
    if (p) { p.pan.setValueAtTime(from, t); p.pan.linearRampToValueAtTime(-from, t + n * gap); g.connect(p); p.connect(E.dest); } else g.connect(E.dest);
    for (let k = 0; k < n; k++) {
      const tt = t + k * gap, loud = Math.sin((Math.PI * (k + 0.5)) / n);
      if (surface === 'wood') sample(E, g, 'wood', 52 + (k % 2) * 2, tt, 0.07 * v * loud);
      else noise(E, g, tt, { f: 900 + (k % 2) * 200, q: 1.4, a: 0.003, d: 0.06, v: 0.06 * v * loud });
    }
    return n * gap;
  },
  // ---- paper and work ----
  rustle(E, t, v = 1) { // a newspaper opened / folded
    const out = exit(E, t, 1.2, { far: R() * 0.3, wet: 0.1 });
    const n = 4 + Math.floor(R() * 6);
    for (let k = 0; k < n; k++) noise(E, out, t + k * (0.04 + R() * 0.08), { f: 2500 + R() * 2500, q: 0.9, a: 0.004, d: 0.04 + R() * 0.08, v: 0.05 * v });
    return 0.9;
  },
  page(E, t, v = 1) { // one page turned
    const out = exit(E, t, 1, { far: 0, wet: 0.1, pan: (R() - 0.5) * 0.5 });
    noise(E, out, t, { f: 900, f1: 4200, q: 0.8, a: 0.12, d: 0.25, v: 0.06 * v, swell: true });
    noise(E, out, t + 0.33, { type: 'lowpass', f: 900, q: 0.7, a: 0.004, d: 0.07, v: 0.05 * v });
    return 0.6;
  },
  pencil(E, t, v = 1) { // pencil scratches: a few strokes
    const out = exit(E, t, 2, { far: 0, wet: 0.08, pan: (R() - 0.5) * 0.4 });
    const n = 3 + Math.floor(R() * 5);
    let tt = t;
    for (let k = 0; k < n; k++) { const len = 0.08 + R() * 0.22; noise(E, out, tt, { f: 3800 + R() * 1500, q: 2.2, a: 0.02, d: len, v: 0.035 * v, swell: true }); tt += len + 0.03 + R() * 0.1; }
    return tt - t;
  },
  chalk(E, t, v = 1) {
    const out = exit(E, t, 1.5, { far: 0, wet: 0.15 });
    let tt = t;
    for (let k = 0; k < 3 + Math.floor(R() * 3); k++) { const len = 0.1 + R() * 0.2; noise(E, out, tt, { f: 2300 + R() * 600, q: 4, a: 0.02, d: len, v: 0.04 * v, swell: true }); tt += len + 0.06; }
    return tt - t;
  },
  press(E, t, v = 1) { // the printing press running a short batch: thunk-clack, thunk-clack
    const out = exit(E, t, 8, { far: 0.35, wet: 0.25, pan: (R() - 0.5) * 0.8 });
    const n = 6 + Math.floor(R() * 6), gap = 0.62;
    for (let k = 0; k < n; k++) {
      const tt = t + k * gap;
      sample(E, out, 'kick', 40, tt, 0.09 * v);
      sample(E, out, 'wood', 64, tt + 0.03, 0.12 * v);
      sample(E, out, 'wood', 76, tt + gap * 0.5, 0.08 * v);
      noise(E, out, tt + gap * 0.55, { f: 3500, q: 1, a: 0.02, d: 0.12, v: 0.025 * v, swell: true });
    }
    return n * gap;
  },
  cart(E, t, v = 1) { // a wooden cart going by: wheel knocks and a creak
    const out = exit(E, t, 5, { far: 0.5, wet: 0.3 });
    for (let k = 0; k < 8; k++) sample(E, out, 'wood', 45 + (k % 3), t + k * 0.42, 0.06 * v * Math.sin((Math.PI * (k + 0.5)) / 8));
    FX.creak(E, t + 1.1, v * 0.7);
    return 3.6;
  },
  creak(E, t, v = 1) { // rope or old wood under load
    const { ctx } = E;
    const out = exit(E, t, 1.2, { far: 0.2, wet: 0.2 });
    const o = ctx.createOscillator(), bp = ctx.createBiquadFilter(), g = ctx.createGain(), len = 0.5 + R() * 0.7;
    const f = 38 + R() * 30;
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * (1.3 + R() * 0.5), t + len);
    bp.type = 'bandpass'; bp.frequency.value = 700 + R() * 600; bp.Q.value = 5;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09 * v, t + len * 0.3); g.gain.linearRampToValueAtTime(0, t + len);
    o.connect(bp); bp.connect(g); g.connect(out); o.start(t); o.stop(t + len + 0.05);
    return len;
  },
  splash(E, t, v = 1) { // a slap of water on a post
    const out = exit(E, t, 1, { far: 0.2, wet: 0.2 });
    noise(E, out, t, { type: 'lowpass', f: 1400, f1: 400, q: 0.8, a: 0.01, d: 0.35, v: 0.07 * v });
    noise(E, out, t + 0.05, { f: 3000, q: 1, a: 0.004, d: 0.12, v: 0.025 * v });
    return 0.5;
  },
  leaves(E, t, v = 1) { // a breath of wind through leaves
    const out = exit(E, t, 3, { far: 0.1, wet: 0.15 });
    noise(E, out, t, { type: 'highpass', f: 2600, q: 0.6, a: 1.0, hold: 0.4, d: 1.4, v: 0.03 * v, swell: true });
    return 2.8;
  },
  gust(E, t, v = 1) {
    const out = exit(E, t, 4, { far: 0, wet: 0.1, pan: (R() - 0.5) * 1.6 });
    noise(E, out, t, { f: 500, f1: 1100, q: 1.2, a: 1.4, hold: 0.5, d: 1.8, v: 0.05 * v, swell: true });
    return 3.7;
  },
  flap(E, t, v = 1) { // a kite or an awning snapping in the wind
    const out = exit(E, t, 1, { far: 0.3, wet: 0.2 });
    for (let k = 0; k < 3 + Math.floor(R() * 3); k++) noise(E, out, t + k * 0.09, { type: 'lowpass', f: 1200, q: 1, a: 0.005, d: 0.06, v: 0.05 * v });
    return 0.6;
  },
  kettle(E, t, v = 1) { // the kettle comes to a soft whistle
    const out = exit(E, t, 5, { far: 0.15, wet: 0.2, pan: (R() - 0.5) * 0.6 });
    osc(E, out, t, { f: 1750, glide: [[2150, 3.5]], a: 2.2, hold: 0.8, d: 1.2, v: 0.018 * v, vib: [6, 12] });
    noise(E, out, t, { f: 2100, q: 3, a: 2, hold: 1, d: 1.2, v: 0.02 * v, swell: true });
    return 4.5;
  },
  sizzle(E, t, v = 1) { // noodles into a hot pan
    const out = exit(E, t, 4, { far: 0.1, wet: 0.1 });
    noise(E, out, t, { type: 'highpass', f: 3200, q: 0.7, a: 0.06, hold: 1.2 + R(), d: 1.4, v: 0.05 * v, swell: true });
    return 3.5;
  },
  stamp(E, t, v = 1) { // a rubber stamp on a counter, sometimes twice
    const out = exit(E, t, 0.8, { far: 0.2, wet: 0.2 });
    for (let k = 0; k < 1 + Math.floor(R() * 2); k++) { sample(E, out, 'kick', 45, t + k * 0.35, 0.08 * v); sample(E, out, 'wood', 55, t + k * 0.35, 0.09 * v); } // (a knock, not a boom)
    return 0.8;
  },
  tray(E, t, v = 1) { // a baking tray set down
    const out = exit(E, t, 1, { far: 0.2, wet: 0.2 });
    sample(E, out, 'bell', 74 + Math.floor(R() * 4), t, 0.02 * v, { dur: 0.25, rel: 0.3 });
    sample(E, out, 'wood', 50, t, 0.07 * v);
    return 0.6;
  },
  clockTick(E, t, v = 1) { // used by rooms as a steady bed event
    sample(E, E.dest, 'tick', 96, t, 0.012 * v);
    return 1;
  },
  drip(E, t, v = 1) {
    const out = exit(E, t, 0.4, { far: 0.1, wet: 0.3 });
    const f = 900 + R() * 900;
    osc(E, out, t, { f, glide: [[f * 1.8, 0.04]], a: 0.002, d: 0.06, v: 0.03 * v });
    return 0.2;
  },
};
