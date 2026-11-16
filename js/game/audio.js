// Generated sound: Web Audio API only, every sound synthesized in code (nothing to download).
// Gentle and cute, never harsh: soft attacks, rounded (low-passed) tones, pentatonic sparkles,
// a light compressor on the master bus. Safe everywhere: if Web Audio is missing or blocked,
// every method is a quiet no-op and nothing throws.
//
//   const audio = createAudio();
//   button.addEventListener('pointerdown', () => audio.unlock());   // inside a user gesture
//   audio.play('honk');
//   audio.engine(0.6);   // continuous soft hum, 0 = silent (call every frame if you like)
//   audio.muted = true;  // remembered in localStorage 'mw-muted'
export const SOUNDS = ['honk', 'bell', 'page', 'step', 'pop', 'door', 'click', 'type', 'whoosh', 'chime', 'sparkle', 'kiss', 'cheer', 'flutter', 'chirp', 'ring', 'thud', 'chalk',
  'stepStone', 'stepDirt', 'stepGrass', 'stepWood', 'stepTile', 'stepPaper', 'stepRug', 'stepWet', 'doorOpen', 'doorClose', 'shopBell', 'screenDoor',
  'tapSoft', 'back', 'menuOpen', 'menuClose', 'toggleOn', 'toggleOff', 'pickup', 'drop', 'buy', 'hint', 'saved', 'achievement', 'sealGood', 'sealMiss', 'noteWrite', 'countTick'];

const STORE_KEY = 'mw-muted';
const MASTER = 0.8;
const MAX_VOICES = 18;
// minimum spacing between two plays of the same sound (s), so per-letter ticks never pile up
const SPACING = { ring: 0.4, chalk: 0.05, thud: 0.1, chirp: 0.25, flutter: 0.3, type: 0.03, step: 0.08, stepStone: 0.08, stepDirt: 0.08, stepGrass: 0.08, stepWood: 0.08, stepTile: 0.08, stepPaper: 0.08, stepRug: 0.08, stepWet: 0.08, shopBell: 0.5, doorOpen: 0.3, doorClose: 0.3, noteWrite: 0.3, achievement: 0.5, click: 0.04, pop: 0.03, sparkle: 0.06, default: 0.035 };
// Per-sound loudness trim (measured with renderOffline): events sit around 0.1 peak, UI ticks well below.
const LEVEL = { stepStone: 1.75, stepDirt: 1.75, stepGrass: 1.75, stepWood: 1.6, stepTile: 1.6, stepPaper: 1.75, stepRug: 1.75, stepWet: 1.6, doorOpen: 1.3, doorClose: 1.4, shopBell: 1.1, screenDoor: 1.3, honk: 0.7, bell: 0.8, chime: 0.72, cheer: 0.87, page: 2.2, door: 1.4, whoosh: 1.2, kiss: 1.1, pop: 1.2, sparkle: 1.35, step: 1.75, click: 1.3, type: 1.45, flutter: 1.5, chirp: 0.75, ring: 0.8, thud: 1.5, chalk: 1.6 };
// C major pentatonic, octaves 5-7
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0, 2093.0, 2349.32, 2637.02, 3135.96, 3520.0];

// ---------------------------------------------------------------------------------
// Building blocks. Every helper takes a BaseAudioContext so sounds also render offline.
// ---------------------------------------------------------------------------------
/** Oscillator voice: attack a, hold h, exponential release d; optional glide and low-pass. */
function tone(ac, out, { type = 'sine', f, f1 = 0, t, a = 0.006, h = 0, d = 0.2, g = 0.1, lp = 0, q = 0.7, detune = 0 }) {
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + a + h + d);
  if (detune) o.detune.setValueAtTime(detune, t);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(g, t + a);
  if (h > 0) amp.gain.setValueAtTime(g, t + a + h);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + a + h + d);
  if (lp) {
    const flt = ac.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(lp, t);
    flt.Q.value = q;
    o.connect(flt);
    flt.connect(amp);
  } else {
    o.connect(amp);
  }
  amp.connect(out);
  o.start(t);
  o.stop(t + a + h + d + 0.03);
  return t + a + h + d;
}

/** Filtered noise burst with an optional filter sweep. */
function hiss(ac, out, nb, { t, a = 0.004, h = 0, d = 0.05, g = 0.05, type = 'bandpass', f = 2000, f1 = 0, q = 1 }) {
  const src = ac.createBufferSource();
  src.buffer = nb;
  const flt = ac.createBiquadFilter();
  flt.type = type;
  flt.frequency.setValueAtTime(f, t);
  if (f1) flt.frequency.exponentialRampToValueAtTime(f1, t + a + h + d);
  flt.Q.value = q;
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(g, t + a);
  if (h > 0) amp.gain.setValueAtTime(g, t + a + h);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + a + h + d);
  src.connect(flt);
  flt.connect(amp);
  amp.connect(out);
  const len = a + h + d + 0.04;
  const offset = Math.random() * Math.max(0, nb.duration - len - 0.01);
  src.start(t, offset, len);
  return t + len;
}

function noiseBuffer(ac) {
  const len = Math.floor(ac.sampleRate * 1.0);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  let seed = 12345;
  for (let i = 0; i < len; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    d[i] = (seed / 0x7fffffff) * 2 - 1;
  }
  return buf;
}

const vary = (k) => 1 + (Math.random() - 0.5) * 2 * k;

// ---------------------------------------------------------------------------------
// The sounds. synth(ac, out, t, nb) schedules at time t and returns the end time.
// ---------------------------------------------------------------------------------
const SYNTH = {
  // Two-tone toy-horn "toot-toot": soft square chords, low-passed, with a tiny droop.
  honk(ac, out, t) {
    const toot = (t0, f, len) => {
      tone(ac, out, { type: 'square', f, f1: f * 0.965, t: t0, a: 0.012, h: len, d: 0.06, g: 0.06, lp: 1350, q: 0.9 });
      tone(ac, out, { type: 'square', f: f * 1.26, f1: f * 1.26 * 0.965, t: t0, a: 0.012, h: len, d: 0.06, g: 0.045, lp: 1350, q: 0.9 });
      tone(ac, out, { type: 'sine', f: f / 2, t: t0, a: 0.01, h: len, d: 0.05, g: 0.05 });
    };
    toot(t, 440, 0.07);
    toot(t + 0.17, 494, 0.12);
    return t + 0.45;
  },
  // Typewriter bell "ding": bright inharmonic partials with a soft strike.
  bell(ac, out, t, nb) {
    const f = 1568;
    const parts = [
      [1, 0.11, 1.3],
      [2.0, 0.03, 0.7],
      [2.76, 0.035, 0.55],
      [5.4, 0.012, 0.25],
    ];
    for (const [m, g, d] of parts) tone(ac, out, { f: f * m, t, a: 0.003, d, g });
    hiss(ac, out, nb, { t, d: 0.012, g: 0.025, type: 'highpass', f: 3500, q: 0.7 });
    return t + 1.35;
  },
  // Page flip: a swish of paper (band-passed noise sweeping up) and a soft flap.
  page(ac, out, t, nb) {
    hiss(ac, out, nb, { t, a: 0.07, d: 0.13, g: 0.07, f: 900, f1: 3400, q: 0.9 });
    hiss(ac, out, nb, { t: t + 0.17, a: 0.004, d: 0.05, g: 0.04, type: 'lowpass', f: 1200, q: 0.5 });
    return t + 0.26;
  },
  // Soft footstep: muffled noise and a little low thump.
  step(ac, out, t, nb) {
    const k = vary(0.08);
    hiss(ac, out, nb, { t, a: 0.004, d: 0.05, g: 0.06, type: 'lowpass', f: 520 * k, q: 0.6 });
    tone(ac, out, { f: 105 * k, f1: 62 * k, t, a: 0.004, d: 0.06, g: 0.06 });
    return t + 0.08;
  },
  // Bubble pop: quick upward blip.
  pop(ac, out, t, nb) {
    const k = vary(0.05);
    tone(ac, out, { f: 360 * k, f1: 1150 * k, t, a: 0.004, d: 0.07, g: 0.12 });
    hiss(ac, out, nb, { t, d: 0.01, g: 0.015, type: 'highpass', f: 2500 });
    return t + 0.09;
  },
  // Door: a wooden "thock" and a tiny shop-bell jingle.
  door(ac, out, t, nb) {
    tone(ac, out, { f: 150, f1: 78, t, a: 0.004, d: 0.14, g: 0.13 });
    hiss(ac, out, nb, { t, d: 0.05, g: 0.04, f: 750, q: 1.2 });
    tone(ac, out, { f: 2637, t: t + 0.07, a: 0.003, d: 0.35, g: 0.03 });
    tone(ac, out, { f: 3136, t: t + 0.13, a: 0.003, d: 0.4, g: 0.026 });
    return t + 0.6;
  },
  // UI click: tiny soft tick.
  click(ac, out, t, nb) {
    tone(ac, out, { f: 1700 * vary(0.03), t, a: 0.002, d: 0.022, g: 0.05 });
    hiss(ac, out, nb, { t, d: 0.008, g: 0.012, type: 'highpass', f: 4200 });
    return t + 0.04;
  },
  // Typewriter tick for dialogue text: short, soft, slightly different every letter.
  type(ac, out, t, nb) {
    const k = vary(0.12);
    hiss(ac, out, nb, { t, a: 0.002, d: 0.018, g: 0.04, f: 3100 * k, q: 2.2 });
    tone(ac, out, { f: 170 * k, f1: 95 * k, t, a: 0.002, d: 0.025, g: 0.03 });
    return t + 0.04;
  },
  // Whoosh: airy swell sweeping up and back down.
  whoosh(ac, out, t, nb) {
    const src = ac.createBufferSource();
    src.buffer = nb;
    const flt = ac.createBiquadFilter();
    flt.type = 'bandpass';
    flt.Q.value = 1.1;
    flt.frequency.setValueAtTime(380, t);
    flt.frequency.exponentialRampToValueAtTime(1900, t + 0.2);
    flt.frequency.exponentialRampToValueAtTime(520, t + 0.48);
    const amp = ac.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.11, t + 0.16);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);
    src.connect(flt);
    flt.connect(amp);
    amp.connect(out);
    src.start(t, 0, 0.52);
    return t + 0.52;
  },
  // Chime: a quick rising pentatonic phrase of bell tones.
  chime(ac, out, t) {
    const start = 3 + ((Math.random() * 3) | 0);
    for (let i = 0; i < 4; i++) {
      const f = PENTA[start + i + (i > 2 ? 1 : 0)];
      const t0 = t + i * 0.075;
      tone(ac, out, { f, t: t0, a: 0.004, d: 0.7, g: 0.06 });
      tone(ac, out, { type: 'triangle', f: f * 2, t: t0, a: 0.004, d: 0.3, g: 0.014 });
    }
    return t + 1.0;
  },
  // Sparkle: tiny high pings scattered on the pentatonic scale, with a hint of shimmer.
  sparkle(ac, out, t, nb) {
    let t0 = t;
    for (let i = 0; i < 6; i++) {
      const f = PENTA[8 + ((Math.random() * 7) | 0)];
      tone(ac, out, { f, t: t0, a: 0.002, d: 0.16, g: 0.028 });
      t0 += 0.032 + Math.random() * 0.025;
    }
    hiss(ac, out, nb, { t, a: 0.03, d: 0.22, g: 0.008, type: 'highpass', f: 6500 });
    return t0 + 0.2;
  },
  // Kiss: a little smack and a rising "mwah" blip, then a tiny ping.
  kiss(ac, out, t, nb) {
    hiss(ac, out, nb, { t, d: 0.012, g: 0.035, f: 2200, q: 1.5 });
    tone(ac, out, { f: 620, f1: 1320, t: t + 0.01, a: 0.012, d: 0.12, g: 0.09 });
    tone(ac, out, { f: 1760, t: t + 0.13, a: 0.003, d: 0.22, g: 0.025 });
    return t + 0.4;
  },
  // Flutter: a flock taking off - a quick run of soft wing claps that thins out, over a breathy swoosh.
  flutter(ac, out, t, nb) {
    let t0 = t;
    for (let i = 0; i < 11; i++) {
      const k = vary(0.12);
      hiss(ac, out, nb, { t: t0, a: 0.003, d: 0.03 + i * 0.002, g: 0.085 * (1 - i / 14), type: 'lowpass', f: 1300 * k, q: 0.8 });
      hiss(ac, out, nb, { t: t0, a: 0.002, d: 0.014, g: 0.02, f: 2600 * k, q: 1.4 });
      t0 += (0.038 + i * 0.006) * vary(0.2);
    }
    hiss(ac, out, nb, { t, a: 0.05, d: 0.45, g: 0.03, f: 700, f1: 1800, q: 0.9 });
    return t0 + 0.08;
  },
  // Chirp: two or three quick little bird tweets, a different tune every time.
  chirp(ac, out, t) {
    const n = 2 + ((Math.random() * 2) | 0);
    let t0 = t;
    for (let i = 0; i < n; i++) {
      const f = (2900 + Math.random() * 900) * (i === n - 1 ? 1.12 : 1);
      const up = Math.random() < 0.6;
      tone(ac, out, { f, f1: up ? f * 1.35 : f * 0.78, t: t0, a: 0.004, d: 0.055, g: 0.05 });
      tone(ac, out, { type: 'triangle', f: f / 2, f1: up ? f * 0.66 : f * 0.4, t: t0, a: 0.004, d: 0.045, g: 0.012 });
      t0 += 0.07 + Math.random() * 0.05;
    }
    return t0 + 0.06;
  },
  // Cheer: rising arpeggio (C E G C E) with a bright last note.
  cheer(ac, out, t) {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((f, i) => {
      const t0 = t + i * 0.068;
      const last = i === notes.length - 1;
      tone(ac, out, { type: 'triangle', f, t: t0, a: 0.005, d: last ? 0.65 : 0.3, g: last ? 0.075 : 0.06 });
      tone(ac, out, { f: f * 2, t: t0, a: 0.004, d: last ? 0.4 : 0.15, g: 0.014 });
    });
    return t + 1.0;
  },
  // Class hand-bell (story): a brass bell shaken three times, warm partials, a soft clapper knock each strike.
  ring(ac, out, t, nb) {
    const f = 1046.5;
    for (let i = 0; i < 3; i++) {
      const t0 = t + i * 0.16, k = vary(0.01);
      for (const [m, g, d] of [[1, 0.07, 0.55], [2.4, 0.025, 0.3], [3.9, 0.012, 0.18]]) tone(ac, out, { f: f * m * k, t: t0, a: 0.003, d, g, lp: 5200 });
      hiss(ac, out, nb, { t: t0, d: 0.01, g: 0.02, type: 'highpass', f: 3000, q: 0.7 });
    }
    return t + 0.32 + 0.6;
  },
  // Soft thud: something set down on wood or a sack dropped (low sine knock under muffled noise).
  thud(ac, out, t, nb) {
    const k = vary(0.06);
    tone(ac, out, { f: 120 * k, f1: 48 * k, t, a: 0.004, d: 0.16, g: 0.13 });
    hiss(ac, out, nb, { t, a: 0.003, d: 0.08, g: 0.06, type: 'lowpass', f: 380 * k, q: 0.5 });
    return t + 0.2;
  },
  // Chalk on a slate: a short dry scratch with a tiny squeak on top.
  chalk(ac, out, t, nb) {
    const k = vary(0.12);
    hiss(ac, out, nb, { t, a: 0.01, h: 0.05 * k, d: 0.05, g: 0.035, f: 2600 * k, f1: 3600 * k, q: 2.2 });
    tone(ac, out, { type: 'triangle', f: 2900 * k, f1: 3200 * k, t: t + 0.02, a: 0.01, d: 0.05, g: 0.004, lp: 4000 });
    return t + 0.14;
  },  // ---- footsteps by ground (story mode sets game.stepSound; main.js plays it each step) ----
  stepStone(ac, out, t, nb) {
    const k = vary(0.08);
    hiss(ac, out, nb, { t, a: 0.003, d: 0.035, g: 0.055, type: 'lowpass', f: 1100 * k, q: 0.6 });
    tone(ac, out, { f: 120 * k, f1: 70 * k, t, a: 0.003, d: 0.045, g: 0.055 });
    hiss(ac, out, nb, { t, d: 0.01, g: 0.008, type: 'highpass', f: 3000 });
    return t + 0.08;
  },
  stepDirt(ac, out, t, nb) {
    const k = vary(0.08);
    hiss(ac, out, nb, { t, a: 0.008, d: 0.07, g: 0.06, type: 'lowpass', f: 700 * k, q: 0.6 });
    tone(ac, out, { f: 95 * k, f1: 60 * k, t, a: 0.005, d: 0.05, g: 0.045 });
    hiss(ac, out, nb, { t: t + 0.01, d: 0.02, g: 0.006, type: 'highpass', f: 3000 });
    return t + 0.09;
  },
  stepGrass(ac, out, t, nb) {
    const k = vary(0.1);
    hiss(ac, out, nb, { t, a: 0.012, d: 0.09, g: 0.035, f: 2200 * k, q: 0.5 });
    tone(ac, out, { f: 90 * k, f1: 60 * k, t, a: 0.005, d: 0.05, g: 0.04 });
    return t + 0.11;
  },
  stepWood(ac, out, t, nb) {
    const k = vary(0.06);
    tone(ac, out, { type: 'triangle', f: 190 * k, f1: 125 * k, t, a: 0.002, d: 0.05, g: 0.045, lp: 900 });
    tone(ac, out, { f: 130 * k, f1: 85 * k, t, a: 0.003, d: 0.06, g: 0.05 });
    hiss(ac, out, nb, { t, d: 0.02, g: 0.02, f: 1200 * k, q: 1.2 });
    return t + 0.08;
  },
  stepTile(ac, out, t, nb) {
    const k = vary(0.06);
    hiss(ac, out, nb, { t, a: 0.002, d: 0.025, g: 0.045, f: 1600 * k, q: 1.5 });
    tone(ac, out, { f: 1900 * k, t, a: 0.002, d: 0.02, g: 0.01 });
    tone(ac, out, { f: 110 * k, f1: 70 * k, t, a: 0.003, d: 0.04, g: 0.04 });
    return t + 0.06;
  },
  stepPaper(ac, out, t, nb) {
    const k = vary(0.1);
    hiss(ac, out, nb, { t, a: 0.006, d: 0.04, g: 0.03, f: 3000 * k, q: 0.8 });
    tone(ac, out, { f: 100 * k, f1: 65 * k, t, a: 0.004, d: 0.05, g: 0.04 });
    return t + 0.07;
  },
  stepRug(ac, out, t, nb) {
    const k = vary(0.08);
    tone(ac, out, { f: 90 * k, f1: 60 * k, t, a: 0.005, d: 0.06, g: 0.05 });
    hiss(ac, out, nb, { t, a: 0.006, d: 0.05, g: 0.035, type: 'lowpass', f: 400 * k, q: 0.6 });
    return t + 0.08;
  },
  stepWet(ac, out, t, nb) { // outdoors in the rain: a soft splash on top
    const k = vary(0.08);
    hiss(ac, out, nb, { t, a: 0.006, d: 0.06, g: 0.05, type: 'lowpass', f: 800 * k, q: 0.6 });
    tone(ac, out, { f: 95 * k, f1: 60 * k, t, a: 0.005, d: 0.05, g: 0.04 });
    hiss(ac, out, nb, { t: t + 0.01, a: 0.01, d: 0.045, g: 0.025, f: 1800 * k, q: 1.2 });
    if (Math.random() < 0.5) tone(ac, out, { f: 1300 * k, f1: 2100 * k, t: t + 0.05, a: 0.002, d: 0.04, g: 0.01 });
    return t + 0.1;
  },
  // ---- doors ----
  // A house door: the latch, then a short soft hinge creak.
  doorOpen(ac, out, t, nb) {
    tone(ac, out, { f: 2100, t, a: 0.002, d: 0.015, g: 0.03 });
    const o = ac.createOscillator(), bp = ac.createBiquadFilter(), g = ac.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t + 0.05); o.frequency.linearRampToValueAtTime(95, t + 0.4);
    bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 5;
    g.gain.setValueAtTime(0, t + 0.05); g.gain.linearRampToValueAtTime(0.04, t + 0.15); g.gain.linearRampToValueAtTime(0, t + 0.4);
    o.connect(bp); bp.connect(g); g.connect(out); o.start(t + 0.05); o.stop(t + 0.45);
    return t + 0.45;
  },
  // A house door shut: a wooden thock and the latch.
  doorClose(ac, out, t, nb) {
    tone(ac, out, { f: 150, f1: 78, t, a: 0.004, d: 0.14, g: 0.12 });
    hiss(ac, out, nb, { t, d: 0.05, g: 0.035, f: 750, q: 1.2 });
    tone(ac, out, { f: 2000, t: t + 0.11, a: 0.002, d: 0.015, g: 0.025 });
    return t + 0.3;
  },
  // A shop's brass door bell swinging (tea shops, bakeries, the post, noodle houses).
  shopBell(ac, out, t, nb) {
    tone(ac, out, { f: 150, f1: 85, t, a: 0.004, d: 0.1, g: 0.08 });
    for (let i = 0; i < 4; i++) {
      const t0 = t + 0.05 + i * 0.12, k = vary(0.01), g = 0.03 * (1 - i * 0.2);
      tone(ac, out, { f: 2950 * k, t: t0, a: 0.002, d: 0.35, g });
      tone(ac, out, { f: 3900 * k, t: t0, a: 0.002, d: 0.2, g: g * 0.4 });
    }
    return t + 0.9;
  },
  // A bamboo screen door: a light double clack.
  screenDoor(ac, out, t, nb) {
    for (const [dt, g] of [[0, 0.06], [0.09, 0.04]]) {
      tone(ac, out, { type: 'triangle', f: 620, f1: 500, t: t + dt, a: 0.002, d: 0.03, g });
      hiss(ac, out, nb, { t: t + dt, d: 0.03, g: 0.025, f: 2000, q: 1.2 });
    }
    return t + 0.2;
  },
  // ---- quiet UI sounds (none harsh, never a buzzer) ----
  tapSoft(ac, out, t, nb) { tone(ac, out, { f: 900 * vary(0.03), t, a: 0.002, d: 0.02, g: 0.06 }); hiss(ac, out, nb, { t, d: 0.01, g: 0.01, type: 'lowpass', f: 1500 }); return t + 0.04; },
  back(ac, out, t) { tone(ac, out, { f: 1500, f1: 1100, t, a: 0.002, d: 0.05, g: 0.045 }); return t + 0.07; },
  menuOpen(ac, out, t, nb) { hiss(ac, out, nb, { t, a: 0.06, d: 0.1, g: 0.04, f: 1200, f1: 2600, q: 0.9 }); return t + 0.18; },
  menuClose(ac, out, t, nb) { hiss(ac, out, nb, { t, a: 0.05, d: 0.1, g: 0.035, f: 2600, f1: 1200, q: 0.9 }); return t + 0.17; },
  toggleOn(ac, out, t) { tone(ac, out, { f: 1400, t, a: 0.002, d: 0.025, g: 0.04 }); tone(ac, out, { f: 1870, t: t + 0.06, a: 0.002, d: 0.03, g: 0.04 }); return t + 0.11; },
  toggleOff(ac, out, t) { tone(ac, out, { f: 1870, t, a: 0.002, d: 0.025, g: 0.035 }); tone(ac, out, { f: 1400, t: t + 0.06, a: 0.002, d: 0.03, g: 0.035 }); return t + 0.11; },
  pickup(ac, out, t) { tone(ac, out, { type: 'triangle', f: 1046.5, t, a: 0.003, d: 0.08, g: 0.05 }); tone(ac, out, { type: 'triangle', f: 1318.5, t: t + 0.06, a: 0.003, d: 0.12, g: 0.05 }); return t + 0.2; },
  drop(ac, out, t, nb) { tone(ac, out, { f: 300, f1: 180, t, a: 0.003, d: 0.07, g: 0.07 }); hiss(ac, out, nb, { t, d: 0.04, g: 0.03, type: 'lowpass', f: 600 }); return t + 0.1; },
  buy(ac, out, t) { tone(ac, out, { f: 3951, t, a: 0.002, d: 0.15, g: 0.025 }); tone(ac, out, { f: 4699, t: t + 0.07, a: 0.002, d: 0.18, g: 0.022 }); return t + 0.3; },
  hint(ac, out, t) { tone(ac, out, { f: 1568, t, a: 0.003, d: 0.4, g: 0.04 }); tone(ac, out, { f: 1975.5, t: t + 0.12, a: 0.003, d: 0.5, g: 0.035 }); return t + 0.65; },
  saved(ac, out, t, nb) { tone(ac, out, { f: 2349.3, t: t + 0.1, a: 0.002, d: 0.5, g: 0.03 }); hiss(ac, out, nb, { t, a: 0.05, d: 0.1, g: 0.035, f: 900, f1: 3000, q: 0.9 }); return t + 0.65; },
  achievement(ac, out, t, nb) {
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => { tone(ac, out, { f, t: t + i * 0.08, a: 0.002, d: 0.4, g: 0.045 }); tone(ac, out, { f: f * 5.4, t: t + i * 0.08, a: 0.001, d: 0.06, g: 0.006 }); });
    hiss(ac, out, nb, { t: t + 0.24, a: 0.01, d: 0.35, g: 0.008, type: 'highpass', f: 6000 });
    return t + 0.8;
  },
  sealGood(ac, out, t) { [784, 988, 1175].forEach((f, i) => tone(ac, out, { type: 'triangle', f, t: t + i * 0.07, a: 0.003, d: 0.5, g: 0.05 })); return t + 0.7; },
  sealMiss(ac, out, t) { tone(ac, out, { type: 'triangle', f: 659.3, t, a: 0.004, d: 0.18, g: 0.04 }); tone(ac, out, { type: 'triangle', f: 523.3, t: t + 0.16, a: 0.004, d: 0.3, g: 0.04 }); return t + 0.5; },
  noteWrite(ac, out, t, nb) {
    let t0 = t;
    for (let i = 0; i < 3 + ((Math.random() * 3) | 0); i++) { const len = 0.06 + Math.random() * 0.12; hiss(ac, out, nb, { t: t0, a: 0.015, d: len, g: 0.025, f: 3800 * vary(0.15), q: 2.2 }); t0 += len + 0.05; }
    return t0;
  },
  countTick(ac, out, t) { tone(ac, out, { f: 1200, t, a: 0.002, d: 0.02, g: 0.03 }); return t + 0.04; },
};

/** Per-play gain node applying the sound's loudness trim. */
function trim(ac, out, name) {
  const g = ac.createGain();
  g.gain.value = LEVEL[name] ?? 1;
  g.connect(out);
  return g;
}

function makeBus(ac) {
  const gain = ac.createGain();
  gain.gain.value = MASTER;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 12;
  comp.ratio.value = 4;
  comp.attack.value = 0.003;
  comp.release.value = 0.15;
  gain.connect(comp);
  comp.connect(ac.destination);
  return { gain, comp };
}

function readMuted() {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(STORE_KEY) === '1';
  } catch {
    return false;
  }
}
function writeMuted(v) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORE_KEY, v ? '1' : '0');
  } catch {
    /* private mode: ignore */
  }
}

/**
 * Creates the sound system. Nothing is created until unlock() runs inside a user gesture.
 * opts: { autoSuspend = true (suspend while the tab is hidden), allowSuspended = false (tests:
 *         schedule sounds even while the context waits for a gesture) }
 */
export function createAudio(opts = {}) {
  const AC = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null;
  let ctx = null;
  let bus = null;
  let nb = null;
  let eng = null;
  let engineLevel = 0;
  let muted = readMuted();
  let wantRunning = false;
  let disposed = false;
  const lastPlay = Object.create(null);
  const voiceEnds = new Float64Array(MAX_VOICES);

  function ensureContext() {
    if (ctx || disposed || !AC) return ctx;
    try {
      // Reuse a context the page created inside the Play tap (iOS only unlocks it there).
      if (opts.ctx && opts.ctx.state !== 'closed') ctx = opts.ctx;
      else {
        try {
          ctx = new AC({ latencyHint: 'interactive' });
        } catch {
          ctx = new AC(); // older WebKit takes no options
        }
      }
      bus = makeBus(ctx);
      bus.gain.gain.value = muted ? 0 : MASTER;
      nb = noiseBuffer(ctx);
    } catch {
      ctx = null;
      bus = null;
    }
    return ctx;
  }

  function startEngine() {
    try {
      const o1 = ctx.createOscillator();
      o1.type = 'triangle';
      o1.frequency.value = 52;
      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = 104;
      const g2 = ctx.createGain();
      g2.gain.value = 0.35;
      const flt = ctx.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.value = 280;
      flt.Q.value = 0.9;
      const am = ctx.createGain(); // "putt-putt" tremolo
      am.gain.value = 0.72;
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 7;
      const lfoAmt = ctx.createGain();
      lfoAmt.gain.value = 0.28;
      const out = ctx.createGain();
      out.gain.value = 0;
      o1.connect(flt);
      o2.connect(g2);
      g2.connect(flt);
      flt.connect(am);
      am.connect(out);
      out.connect(bus.gain);
      lfo.connect(lfoAmt);
      lfoAmt.connect(am.gain);
      o1.start();
      o2.start();
      lfo.start();
      return { o1, o2, flt, lfo, out, applied: -1 };
    } catch {
      return null;
    }
  }

  function applyEngine() {
    if (!ctx || !bus) return;
    if (!eng && engineLevel > 0) eng = startEngine();
    if (!eng) return;
    if (Math.abs(engineLevel - eng.applied) < 0.01) return;
    eng.applied = engineLevel;
    const t = ctx.currentTime;
    const L = engineLevel;
    eng.out.gain.setTargetAtTime(L * 0.055, t, 0.12);
    eng.o1.frequency.setTargetAtTime(52 + 44 * L, t, 0.15);
    eng.o2.frequency.setTargetAtTime(104 + 88 * L, t, 0.15);
    eng.flt.frequency.setTargetAtTime(280 + 620 * L, t, 0.15);
    eng.lfo.frequency.setTargetAtTime(7 + 9 * L, t, 0.2);
  }

  const onVisibility = () => {
    if (!ctx) return;
    try {
      if (document.hidden) ctx.suspend().catch(() => {});
      else if (wantRunning) ctx.resume().catch(() => {});
    } catch {
      /* ignore */
    }
  };
  const autoSuspend = opts.autoSuspend !== false && typeof document !== 'undefined';
  const allowSuspended = !!opts.allowSuspended; // tests only: schedule even before a gesture
  if (autoSuspend) document.addEventListener('visibilitychange', onVisibility);

  const audio = {
    /** Sound names play() understands. */
    names: SOUNDS,
    /** True when the Web Audio API exists in this browser. */
    supported: !!AC,
    /** 'none' | 'suspended' | 'running' | 'closed' */
    get state() {
      return ctx ? ctx.state : 'none';
    },

    /** The AudioContext once unlocked (null before); background music shares it. */
    get context() {
      return ctx;
    },
    /** The master input (muted with the sound button); background music connects here. */
    get output() {
      return bus ? bus.gain : null;
    },

    get muted() {
      return muted;
    },
    set muted(v) {
      muted = !!v;
      writeMuted(muted);
      if (ctx && bus) {
        try {
          bus.gain.gain.setTargetAtTime(muted ? 0 : MASTER, ctx.currentTime, 0.03);
        } catch {
          /* ignore */
        }
      }
    },

    /** Call inside a user gesture (tap / key). Resolves true once the context runs. */
    unlock() {
      try {
        if (!ensureContext()) return Promise.resolve(false);
        wantRunning = true;
        // iOS: playing a silent buffer inside the gesture unlocks output.
        const src = ctx.createBufferSource();
        src.buffer = ctx.createBuffer(1, 1, 22050);
        src.connect(ctx.destination);
        src.start(0);
        applyEngine();
        if (ctx.state === 'running') return Promise.resolve(true);
        return ctx.resume().then(() => ctx && ctx.state === 'running', () => false);
      } catch {
        return Promise.resolve(false);
      }
    },

    /** Play a named sound now. Returns true if it was scheduled. */
    play(name) {
      const synth = SYNTH[name];
      if (!synth || muted || disposed || !ctx || !bus) return false;
      if (ctx.state !== 'running' && !allowSuspended) return false; // never queue stale sounds
      try {
        const now = ctx.currentTime;
        const gap = SPACING[name] ?? SPACING.default;
        if (lastPlay[name] !== undefined && now - lastPlay[name] < gap) return false;
        let free = -1;
        for (let i = 0; i < MAX_VOICES; i++) {
          if (voiceEnds[i] <= now) {
            free = i;
            break;
          }
        }
        if (free < 0) return false; // too busy: drop rather than get loud
        lastPlay[name] = now;
        voiceEnds[free] = synth(ctx, trim(ctx, bus.gain, name), now + 0.005, nb);
        return true;
      } catch {
        return false;
      }
    },

    /** Continuous soft engine hum; level 0..1 (0 = silent). Cheap to call every frame. */
    engine(level) {
      const L = Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : 0;
      engineLevel = L;
      if (!ctx || disposed) return;
      try {
        applyEngine();
      } catch {
        /* ignore */
      }
    },

    /** Pause / resume output (the game may call these; hidden tabs are handled automatically). */
    suspend() {
      try {
        if (ctx) ctx.suspend().catch(() => {});
      } catch {
        /* ignore */
      }
    },
    resume() {
      try {
        if (ctx && wantRunning) ctx.resume().catch(() => {});
      } catch {
        /* ignore */
      }
    },

    /**
     * Dev/test helper: renders one sound offline and measures it, without touching the speakers.
     * Resolves { name, seconds, peak, rms } or null when OfflineAudioContext is missing.
     */
    async renderOffline(name, seconds = 1.6) {
      try {
        const OAC = typeof window !== 'undefined' ? window.OfflineAudioContext || window.webkitOfflineAudioContext : null;
        if (!OAC) return null;
        const rate = 44100;
        const oac = new OAC(1, Math.ceil(rate * seconds), rate);
        const b = makeBus(oac);
        const noise = noiseBuffer(oac);
        if (name === 'engine') {
          const o = oac.createOscillator();
          o.type = 'triangle';
          o.frequency.value = 52 + 44 * 0.6;
          const flt = oac.createBiquadFilter();
          flt.type = 'lowpass';
          flt.frequency.value = 280 + 620 * 0.6;
          const g = oac.createGain();
          g.gain.value = 0.6 * 0.055;
          o.connect(flt);
          flt.connect(g);
          g.connect(b.gain);
          o.start(0);
        } else if (SYNTH[name]) {
          SYNTH[name](oac, trim(oac, b.gain, name), 0.01, noise);
        } else {
          return null;
        }
        const buf = await oac.startRendering();
        const d = buf.getChannelData(0);
        let peak = 0;
        let sum = 0;
        let last = 0;
        for (let i = 0; i < d.length; i++) {
          const v = Math.abs(d[i]);
          if (v > peak) peak = v;
          sum += d[i] * d[i];
          if (v > 0.002) last = i;
        }
        return { name, seconds: last / rate, peak, rms: Math.sqrt(sum / d.length) };
      } catch {
        return null;
      }
    },

    dispose() {
      disposed = true;
      if (autoSuspend) document.removeEventListener('visibilitychange', onVisibility);
      try {
        if (eng) {
          eng.o1.stop();
          eng.o2.stop();
          eng.lfo.stop();
        }
      } catch {
        /* ignore */
      }
      eng = null;
      try {
        if (ctx) ctx.close().catch(() => {});
      } catch {
        /* ignore */
      }
      ctx = null;
      bus = null;
    },
  };
  return audio;
}
