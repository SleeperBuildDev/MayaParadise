// Sound bank for the soundscape: every instrument and every ambience loop is synthesized here in
// plain JS into small mono AudioBuffers (nothing downloaded, nothing sampled from a recording).
// Built lazily, once per AudioContext (live or Offline), so a phone only pays for what it hears.
// A note at play time is ONE AudioBufferSourceNode + ONE GainNode (pitch = playbackRate).
//
//   const bank = getBank(ctx);
//   bank.note('harp', 67)  -> { buffer, rate }      (rate = playbackRate for that MIDI note)
//   bank.loop('babble')    -> AudioBuffer (seamless loop)
//
// Instruments: harp (saung-like plucked harp, Karplus-Strong), pat (tuned drum, pat-waing-like),
// pattala (bamboo xylophone), wood (bamboo clapper), si (small hand cymbals, open), siShort (damped),
// tick, kick, shaker, bell, ep (soft electric piano), flute (breathy, palwe-like), pad (warm loop),
// bass, musicbox, guitar (bright pluck), marimba.
// Loops: white, pink, brown (noise), babble (distant crowd), kids (distant children), murmur (a few
// low voices in a room), crickets, cicada, fire (crackle + roar), trickle (small water), loom.

const NOTE_SR = 32000; // instrument notes at 32 kHz (playback resamples): ~27% less memory than 44.1k
const LOOP_SR = 22050; // ambience loops are dark (low-passed beds): 22 kHz is plenty
let SR = NOTE_SR; // the rate the fill functions below render at (switched while a loop is built)

export function rng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const mtof = (n) => 440 * Math.pow(2, (n - 69) / 12);
const TAU = Math.PI * 2;

// ---- tiny JS DSP helpers (used only while building buffers) ----
/** RBJ biquad, stateful; set(type, f, q) may be called again to sweep it. */
function biquad() {
  let b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return {
    set(type, f, q = 0.7) {
      const w = (TAU * Math.min(f, SR * 0.45)) / SR, c = Math.cos(w), al = Math.sin(w) / (2 * q);
      let B0, B1, B2;
      if (type === 'lp') { B0 = (1 - c) / 2; B1 = 1 - c; B2 = (1 - c) / 2; }
      else if (type === 'hp') { B0 = (1 + c) / 2; B1 = -(1 + c); B2 = (1 + c) / 2; }
      else { B0 = al; B1 = 0; B2 = -al; } // band-pass (0 dB peak)
      const A0 = 1 + al;
      b0 = B0 / A0; b1 = B1 / A0; b2 = B2 / A0; a1 = (-2 * c) / A0; a2 = (1 - al) / A0;
      return this;
    },
    run(x) {
      const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      return y;
    },
  };
}
function normalize(d, peak = 0.85) {
  let m = 0;
  for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i]));
  if (m > 0) for (let i = 0; i < d.length; i++) d[i] *= peak / m;
}
function fadeEnds(d, inS = 0.002, outS = 0.05) {
  const a = Math.floor(inS * SR), b = Math.floor(outS * SR), n = d.length;
  for (let i = 0; i < a && i < n; i++) d[i] *= i / a;
  for (let i = 0; i < b && i < n; i++) d[n - 1 - i] *= i / b;
}
/** Make a seamless loop: the buffer was rendered `x` seconds longer; its tail is cross-faded into its head. */
function loopify(d, len, x) {
  const X = Math.floor(x * SR), out = new Float32Array(len);
  for (let i = 0; i < len; i++) out[i] = d[i];
  for (let i = 0; i < X; i++) {
    const k = i / X;
    out[i] = d[i] * Math.sqrt(k) + d[len + i] * Math.sqrt(1 - k);
  }
  return out;
}

// ---- instruments: fill(d, n, f, r) for one base note; `bases` = MIDI notes rendered ----
function ks(d, n, f, { damp = 0.996, bright = 0.5, pick = 0.3, seed = 1 }) {
  const N = Math.max(2, Math.round(SR / f - 0.5)), line = new Float32Array(N), r = rng(seed);
  let lp = 0;
  for (let i = 0; i < N; i++) { lp += (r() * 2 - 1 - lp) * bright; line[i] = lp; }
  const P = Math.floor(N * pick); // pluck position: comb the excitation (softer, rounder like fingers on silk)
  const ex = line.slice();
  for (let i = 0; i < N; i++) line[i] = ex[i] - 0.8 * ex[(i + P) % N];
  let idx = 0;
  for (let i = 0; i < n; i++) {
    const cur = line[idx], nxt = line[(idx + 1) % N];
    line[idx] = damp * 0.5 * (cur + nxt);
    d[i] = cur;
    idx = (idx + 1) % N;
  }
}
const addSine = (d, n, f, amp, dec, t0 = 0) => {
  const s0 = Math.floor(t0 * SR);
  for (let i = s0; i < n; i++) { const t = (i - s0) / SR; d[i] += amp * Math.sin(TAU * f * t) * Math.exp(-t / dec); }
};

const INST = {
  harp: { sec: 2.6, bases: [48, 60, 72], fill(d, n, f) {
    ks(d, n, f, { damp: 0.9965, bright: 0.45, pick: 0.27, seed: Math.round(f) });
    // the silk-string harp's soft "body": a quiet second string a hair sharp
    const e = new Float32Array(n); ks(e, n, f * 1.0025, { damp: 0.995, bright: 0.35, pick: 0.4, seed: 7 + Math.round(f) });
    for (let i = 0; i < n; i++) d[i] = d[i] + 0.35 * e[i];
  } },
  guitar: { sec: 2.4, bases: [48, 60], fill(d, n, f) { ks(d, n, f, { damp: 0.998, bright: 0.75, pick: 0.18, seed: 3 + Math.round(f) }); } },
  pat: { sec: 0.9, bases: [48, 60], fill(d, n, f, r) {
    let ph = 0, ph2 = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR, ff = f * (1 + 0.32 * Math.exp(-t / 0.014));
      ph += (TAU * ff) / SR; ph2 += (TAU * ff * 1.59) / SR;
      d[i] = Math.sin(ph) * Math.exp(-t / 0.42) + 0.28 * Math.sin(ph2) * Math.exp(-t / 0.12) + (r() * 2 - 1) * 0.25 * Math.exp(-t / 0.012);
    }
  } },
  pattala: { sec: 0.9, bases: [60, 72], fill(d, n, f, r) {
    addSine(d, n, f, 1, 0.24); addSine(d, n, f * 2.95, 0.22, 0.05); addSine(d, n, f * 6.1, 0.08, 0.018);
    for (let i = 0; i < 90; i++) d[i] += (r() * 2 - 1) * 0.3 * (1 - i / 90);
  } },
  marimba: { sec: 1.1, bases: [60, 72], fill(d, n, f) { addSine(d, n, f, 1, 0.34); addSine(d, n, f * 3.93, 0.25, 0.05); addSine(d, n, f * 9.2, 0.06, 0.015); } },
  wood: { sec: 0.18, bases: [72], fill(d, n, f, r) {
    const bp = biquad().set('bp', 1250, 3);
    for (let i = 0; i < n; i++) { const t = i / SR; d[i] = bp.run((r() * 2 - 1) * Math.exp(-t / 0.006)) * 2.5 + Math.sin(TAU * 960 * t) * 0.5 * Math.exp(-t / 0.035) + Math.sin(TAU * 2310 * t) * 0.25 * Math.exp(-t / 0.018); }
  } },
  tick: { sec: 0.12, bases: [84], fill(d, n) { addSine(d, n, 1900, 1, 0.025); addSine(d, n, 3820, 0.3, 0.012); } },
  kick: { sec: 0.4, bases: [36], fill(d, n) {
    let ph = 0;
    for (let i = 0; i < n; i++) { const t = i / SR; ph += (TAU * (45 + 75 * Math.exp(-t / 0.04))) / SR; d[i] = Math.sin(ph) * Math.exp(-t / 0.2); }
  } },
  shaker: { sec: 0.1, bases: [84], fill(d, n, f, r) {
    const hp = biquad().set('hp', 5000, 0.8);
    for (let i = 0; i < n; i++) { const t = i / SR; d[i] = hp.run(r() * 2 - 1) * Math.min(1, t / 0.012) * Math.exp(-t / 0.03); }
  } },
  si: { sec: 1.6, bases: [96], fill(d, n, f, r) {
    for (const [m, a, dec] of [[2950, 1, 1.3], [2962, 0.8, 1.2], [4130, 0.6, 0.9], [5310, 0.4, 0.6], [6870, 0.25, 0.4], [8420, 0.15, 0.25]]) addSine(d, n, m, a, dec);
    for (let i = 0; i < 60; i++) d[i] += (r() * 2 - 1) * 0.6 * (1 - i / 60);
  } },
  siShort: { sec: 0.2, bases: [96], fill(d, n, f, r) {
    for (const [m, a] of [[2950, 1], [4130, 0.6], [5310, 0.4]]) addSine(d, n, m, a, 0.045);
    for (let i = 0; i < 60; i++) d[i] += (r() * 2 - 1) * 0.5 * (1 - i / 60);
  } },
  bell: { sec: 2.8, bases: [72, 84], fill(d, n, f) {
    for (const [m, a, dec] of [[1, 1, 2.2], [1.004, 0.6, 2.0], [2.0, 0.35, 1.2], [2.76, 0.4, 0.9], [5.4, 0.18, 0.4], [8.93, 0.08, 0.2]]) addSine(d, n, f * m, a, dec);
  } },
  musicbox: { sec: 1.8, bases: [84], fill(d, n, f) { addSine(d, n, f, 1, 1.0); addSine(d, n, f * 3, 0.22, 0.25); addSine(d, n, f * 5.4, 0.12, 0.08); } },
  ep: { sec: 2.6, bases: [48, 60, 72], fill(d, n, f) {
    addSine(d, n, f, 1, 1.5); addSine(d, n, f * 2, 0.22, 0.6); addSine(d, n, f * 7.02, 0.12, 0.05); addSine(d, n, f * 3, 0.05, 0.3);
    for (let i = 0; i < n; i++) d[i] = Math.tanh(d[i] * 1.3); // a touch of warmth
  } },
  bass: { sec: 1.8, bases: [36], fill(d, n, f) {
    // round, but with enough 2nd/3rd harmonic that a phone speaker still shows the bass line
    addSine(d, n, f, 1, 1.0); addSine(d, n, f * 2, 0.55, 0.45); addSine(d, n, f * 3, 0.25, 0.18); addSine(d, n, f * 4, 0.08, 0.08);
    for (let i = 0; i < 64; i++) d[i] *= i / 64;
  } },
  flute: { sec: 3.0, bases: [72, 84], fill(d, n, f, r) {
    const bp = biquad().set('bp', f * 2, 2.5);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR, vib = 1 + 0.006 * Math.sin(TAU * 5.3 * t) * Math.min(1, Math.max(0, (t - 0.25) / 0.4));
      ph += (TAU * f * vib) / SR;
      const env = Math.min(1, t / 0.09) * (0.85 + 0.15 * Math.exp(-t / 0.2)) * Math.exp(-t / 5);
      d[i] = env * (Math.sin(ph) + 0.3 * Math.sin(2 * ph) + 0.1 * Math.sin(3 * ph) + bp.run(r() * 2 - 1) * 0.35);
    }
  } },
  // A warm pad that loops seamlessly: every partial has a whole number of cycles in the 4 s buffer
  // (frequencies on a 0.25 Hz grid), so it can be held for any length at any pitch.
  pad: { sec: 4, bases: [48, 60], loop: true, fill(d, n, f) {
    const f0 = Math.round(f * 4) / 4;
    for (const det of [-0.5, 0, 0.5]) for (let k = 1; k <= 9; k++) {
      const ff = k * f0 + det * k, a = 1 / Math.pow(k, 1.6) / 3;
      const ph0 = (k * 1.7 + det * 3) % TAU;
      for (let i = 0; i < n; i++) d[i] += a * Math.sin(ph0 + (TAU * ff * i) / SR);
    }
  } },
};

// ---- ambience loops: fill(d, n, r) renders n samples (the bank adds 1 s to cross-fade the loop) ----
/** One synthetic far-off voice: a buzzy pulse through two moving formants, in syllables and phrases. */
function voice(d, n, r, { lo, hi, gain, rate = 5, talk = 0.7, laugh = 0 }) {
  const V = [[800, 1250], [520, 1850], [330, 2250], [560, 950], [380, 820], [650, 1500]];
  const f1 = biquad(), f2 = biquad();
  let ph = 0, i = Math.floor(r() * SR * 0.8);
  while (i < n) {
    const speak = r() < talk;
    const plen = Math.floor(SR * (speak ? 0.8 + r() * 2.2 : 0.4 + r() * 1.6));
    if (!speak) { i += plen; continue; }
    let pitch = lo + r() * (hi - lo);
    const end = Math.min(n, i + plen);
    while (i < end) {
      const slen = Math.floor(SR / (rate * (0.7 + r() * 0.6)));
      const v = V[Math.floor(r() * V.length)], glide = (r() - 0.5) * 0.25;
      const isLaugh = laugh && r() < laugh;
      f1.set('bp', v[0], 5); f2.set('bp', v[1], 6);
      for (let k = 0; k < slen && i < end; k++, i++) {
        const u = k / slen, p = pitch * (1 + glide * u) * (isLaugh ? 1.3 : 1);
        ph += p / SR; if (ph > 1) ph -= 1;
        const src = (ph * 2 - 1) - (ph < 0.08 ? 0.5 : 0);
        const env = Math.sin(Math.PI * u) ** (isLaugh ? 3 : 1.2);
        d[i] += gain * env * (f1.run(src) + 0.6 * f2.run(src));
      }
      pitch *= 0.97 + r() * 0.05;
    }
  }
}
const LOOPS = {
  white: { sec: 2, fill(d, n, r) { for (let i = 0; i < n; i++) d[i] = r() * 2 - 1; } },
  pink: { sec: 4, fill(d, n, r) {
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < n; i++) { const w = r() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0527; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; }
  } },
  brown: { sec: 4, fill(d, n, r) { // (no rumble below ~40 Hz: phones can't play it and it only eats headroom)
    let b = 0; const hp = biquad().set('hp', 45, 0.7);
    for (let i = 0; i < n; i++) { b = (b + 0.02 * (r() * 2 - 1)) * 0.996; d[i] = hp.run(b * 3); }
  } },
  babble: { sec: 8, fill(d, n, r) {
    for (let v = 0; v < 8; v++) voice(d, n, r, { lo: v % 2 ? 105 : 170, hi: v % 2 ? 150 : 250, gain: 0.5 + r() * 0.5, rate: 4.5 + r() * 2 });
    const lp = biquad().set('lp', 2200, 0.6); for (let i = 0; i < n; i++) d[i] = lp.run(d[i]);
  } },
  kids: { sec: 7, fill(d, n, r) {
    for (let v = 0; v < 6; v++) voice(d, n, r, { lo: 250, hi: 420, gain: 0.5 + r() * 0.5, rate: 6 + r() * 2, talk: 0.55, laugh: 0.15 });
    const lp = biquad().set('lp', 3000, 0.6); for (let i = 0; i < n; i++) d[i] = lp.run(d[i]);
  } },
  murmur: { sec: 9, fill(d, n, r) {
    for (let v = 0; v < 3; v++) voice(d, n, r, { lo: v ? 100 : 175, hi: v ? 135 : 215, gain: 1, rate: 4, talk: 0.6 });
    const lp = biquad().set('lp', 1400, 0.6); for (let i = 0; i < n; i++) d[i] = lp.run(d[i]);
  } },
  crickets: { sec: 4, fill(d, n, r) {
    for (const [f, rate, grp, off] of [[4300, 32, 1.1, 0.1], [4720, 38, 1.55, 0.6], [3980, 29, 0.85, 0.35]]) {
      const amp = 0.4 + r() * 0.4;
      for (let i = 0; i < n; i++) {
        const t = i / SR, g = (t * grp + off) % 1;      // chirp groups
        if (g > 0.3) continue;
        const p = (t * rate) % 1;                        // pulses inside a chirp
        d[i] += amp * Math.sin(TAU * f * t) * (p < 0.5 ? Math.sin(Math.PI * p * 2) : 0) * Math.sin((Math.PI * g) / 0.3);
      }
    }
  } },
  cicada: { sec: 4, fill(d, n, r) {
    const bp = biquad().set('bp', 5200, 3);
    for (let i = 0; i < n; i++) { const t = i / SR; d[i] = bp.run(r() * 2 - 1) * (0.55 + 0.45 * Math.sin(TAU * 47 * t)) * (0.7 + 0.3 * Math.sin(TAU * 0.5 * t)) * 3; }
  } },
  fire: { sec: 6, fill(d, n, r) {
    // the roar: kept small and above 90 Hz (it boomed on headphones and a phone cannot play it); the crackle reads as fire
    const lp = biquad().set('lp', 240, 0.7), hp = biquad().set('hp', 90, 0.7); let b = 0;
    for (let i = 0; i < n; i++) { b = (b + 0.03 * (r() * 2 - 1)) * 0.995; d[i] = hp.run(lp.run(b)) * 1.3; }
    const bp = biquad().set('bp', 2600, 1.2);
    for (let i = 0; i < n; i++) {
      if (r() < 9 / SR) { const len = 40 + Math.floor(r() * 200), a = 0.3 + r() * 0.9; for (let k = 0; k < len && i + k < n; k++) d[i + k] += a * (r() * 2 - 1) * (1 - k / len) ** 2; }
      d[i] = d[i] * 0.6 + bp.run(d[i]) * 0.5;
    }
  } },
  trickle: { sec: 4, fill(d, n, r) {
    for (let i = 0; i < n; i++) {
      if (r() < 22 / SR) {
        const f = 500 + r() * 900, len = Math.floor(SR * (0.02 + r() * 0.04)), a = 0.2 + r() * 0.5;
        let ph = 0;
        for (let k = 0; k < len && i + k < n; k++) { const u = k / len; ph += (TAU * f * (1 + 1.6 * u)) / SR; d[i + k] += a * Math.sin(ph) * Math.sin(Math.PI * u); }
      }
    }
    const hp = biquad().set('hp', 200, 0.7), w = biquad().set('bp', 1800, 0.5);
    for (let i = 0; i < n; i++) d[i] = hp.run(d[i]) + w.run(r() * 2 - 1) * 0.04;
  } },
  // the loom: shuttle swish, then the beater's wooden knock, about every 1.4 s
  loom: { sec: 5.6, fill(d, n, r) {
    const bp = biquad().set('bp', 3000, 1);
    for (let c = 0; c < 4; c++) {
      const t0 = Math.floor((c * 1.4 + 0.1) * SR);
      for (let k = 0; k < SR * 0.35; k++) { const u = k / (SR * 0.35); d[t0 + k] += bp.run(r() * 2 - 1) * 0.6 * Math.sin(Math.PI * u); }
      const t1 = t0 + Math.floor(0.62 * SR);
      for (let k = 0; k < SR * 0.12; k++) { const t = k / SR; d[t1 + k] += Math.sin(TAU * 180 * t) * Math.exp(-t / 0.03) + Math.sin(TAU * 620 * t) * 0.4 * Math.exp(-t / 0.015); }
    }
  } },
};

// ---- pure renders (no AudioContext): the bank below and the warm-up worker (bank-worker.js) share them
/** The base note a MIDI note is played from (one rendered buffer per base; playbackRate covers the rest). */
export function baseOf(inst, midi) {
  const I = INST[inst];
  if (!I) return null;
  let best = I.bases[0];
  for (const b of I.bases) if (Math.abs(midi - b) < Math.abs(midi - best)) best = b;
  return best;
}
/** One instrument base note as samples at NOTE_SR. */
export function renderNote(inst, best) {
  const I = INST[inst];
  SR = NOTE_SR;
  const n = Math.floor(I.sec * SR), d = new Float32Array(n), r = rng(best * 31 + inst.length);
  I.fill(d, n, mtof(best), r);
  normalize(d, 0.8);
  if (!I.loop) fadeEnds(d, 0.0005, 0.08);
  return d;
}
/** One ambience loop as samples at LOOP_SR (seamless). */
export function renderLoop(name) {
  const L = LOOPS[name];
  if (!L) return null;
  const r = rng(name.length * 977 + 13);
  SR = LOOP_SR;
  let d;
  try {
    const sec = L.sec, loopX = name === 'white' || name === 'pink' || name === 'brown' ? 0 : 1;
    const n = Math.floor(sec * SR), extra = Math.floor(loopX * SR);
    d = new Float32Array(n + extra);
    L.fill(d, n + extra, r);
    if (loopX) d = loopify(d, n, loopX);
  } finally { SR = NOTE_SR; }
  normalize(d, 0.8);
  return d;
}
/** Every piece the bank can hold: [['loop', name] | ['note', inst, base]] (the warm-up's list). */
export function allPieces() {
  return [...Object.keys(LOOPS).map((l) => ['loop', l]), ...Object.entries(INST).flatMap(([i, I]) => I.bases.map((b) => ['note', i, b]))];
}
export { NOTE_SR, LOOP_SR };

const cache = new WeakMap();
/** The bank for one AudioContext (live or Offline). */
export function getBank(ctx) {
  let B = cache.get(ctx);
  if (B) return B;
  const notes = {}, loops = {};
  const toBuffer = (d, sr) => {
    const b = ctx.createBuffer(1, d.length, sr);
    b.copyToChannel ? b.copyToChannel(d, 0) : b.getChannelData(0).set(d);
    return b;
  };
  B = {
    sr: NOTE_SR,
    note(inst, midi) {
      const I = INST[inst];
      if (!I) return null;
      const best = baseOf(inst, midi);
      const key = inst + best;
      if (!notes[key]) notes[key] = toBuffer(renderNote(inst, best), NOTE_SR); // (cold: rendered here, on this thread)
      return { buffer: notes[key], rate: Math.pow(2, (midi - best) / 12), loop: !!I.loop };
    },
    loop(name) {
      if (!loops[name]) {
        if (!LOOPS[name]) return null;
        loops[name] = toBuffer(renderLoop(name), LOOP_SR);
      }
      return loops[name];
    },
    /** already rendered? */
    has(kind, a, b) { return kind === 'loop' ? !!loops[a] : !!notes[a + b]; },
    /** samples rendered elsewhere (the warm-up worker) into the cache; copying them in is cheap */
    put(kind, a, b, d) {
      if (kind === 'loop') { if (!loops[a] && LOOPS[a]) loops[a] = toBuffer(d, LOOP_SR); }
      else if (!notes[a + b] && INST[a]) notes[a + b] = toBuffer(d, NOTE_SR);
    },
    /** Rough memory held (bytes), for the dev page. */
    bytes() {
      let s = 0;
      for (const b of [...Object.values(notes), ...Object.values(loops)]) s += b.length * 4;
      return s;
    },
  };
  cache.set(ctx, B);
  return B;
}

export const INSTRUMENTS = Object.keys(INST);
export const LOOP_NAMES = Object.keys(LOOPS);
