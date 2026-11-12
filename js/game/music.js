// Background music: four original songs, one for each time of day, made in code (Web Audio; no
// files to download). The song follows the player's clock (daytime.js) and cross-fades when the
// period changes. It plays through the game's sound bus, so the sound button mutes it too.
//
//   const music = createMusic(audio);   // audio = createAudio() from audio.js
//   music.setPeriod('night');           // 'morning' | 'noon' | 'evening' | 'night'
//   music.update(duck)                  // every frame; duck = true while Maya is talking (softer)
//   music.dispose()
//
// Songs: Golden dawn (morning), Bright pages (noon), Sunset ride (evening), Cozy night jazz (night).
// Each loops 16 bars of a seeded melody (the same tune every time) over its chord progression.

const VOLUME = 0.36; // music level under the sound effects
const DUCK = 0.5; // level while Maya talks
const AHEAD = 0.35; // seconds scheduled ahead (covers slow frames)

export const SONGS = {
  morning: {
    name: 'Golden dawn', bpm: 84, swing: 0, seed: 11,
    chords: [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 69]],
    scale: [62, 64, 66, 69, 71, 74, 76, 78, 81],
    rhythm: [[0, 6, 8, 12], [0, 4, 10], [2, 8, 12, 14], [0, 8]],
    lead: 'bell', leadVol: 0.1, arp: true, pad: 0.05, bass: 0.14, drums: 0, birds: true, verb: 0.35,
  },
  noon: {
    name: 'Bright pages', bpm: 104, swing: 0, seed: 23,
    chords: [[55, 59, 62], [60, 64, 67], [52, 55, 59], [50, 54, 57]],
    scale: [67, 69, 71, 74, 76, 79, 81, 83],
    rhythm: [[0, 3, 6, 8, 10, 12], [0, 2, 6, 10, 14], [0, 4, 6, 8, 12], [2, 6, 8, 11, 14]],
    lead: 'marimba', leadVol: 0.1, skank: true, pad: 0.025, bass: 0.2, drums: 1, verb: 0.2,
  },
  evening: {
    name: 'Sunset ride', bpm: 86, swing: 0.18, seed: 37,
    chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 58]],
    scale: [65, 67, 69, 72, 74, 77, 79, 81],
    rhythm: [[0, 6, 10], [2, 8, 12], [0, 4, 8, 14], [6, 10]],
    lead: 'ep', leadVol: 0.08, epChords: true, pad: 0.03, bass: 0.2, drums: 2, verb: 0.3,
  },
  night: {
    name: 'Cozy night jazz', bpm: 62, seed: 73, jazz: true,
    chords: [[51, 55, 58, 62], [51, 55, 57, 60], [50, 53, 57, 60], [50, 53, 55, 58]],
    roots: [36, 41, 46, 39],
    scale: [63, 65, 67, 70, 72, 74, 75, 77, 79, 82],
    rhythm: [[0, 6], [4, 10], [0, 8, 12], [6], [2, 8], [0, 6, 10]],
    lead: 'vibes', leadVol: 0.075, bass: 0.24, verb: 0.4,
  },
};

const mtof = (n) => 440 * Math.pow(2, (n - 69) / 12);
function rng(seed) {
  let s = seed;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 16 bars: an 8-bar tune, then its first half again and a lightly varied second half. */
function melody(S) {
  const r = rng(S.seed), bars = [];
  let idx = S.jazz ? 4 : 3;
  for (let b = 0; b < 8; b++) {
    const pat = S.rhythm[Math.floor(r() * S.rhythm.length)], notes = [];
    for (const p of pat) {
      idx = Math.max(0, Math.min(S.scale.length - 1, idx + Math.round((r() - 0.5) * (S.jazz ? 3 : 3.2))));
      notes.push([p, S.scale[idx]]);
    }
    bars.push(notes);
  }
  const r2 = rng(S.seed + 7);
  const up = (x) => S.scale[Math.min(S.scale.length - 1, S.scale.indexOf(x) + 1)];
  return [...bars, ...bars.slice(0, 4), ...bars.slice(4).map((n) => n.map(([p, x]) => [p, r2() < 0.4 ? up(x) : x]))];
}

export function createMusic(audio, { volume = VOLUME } = {}) {
  let ac = null, out = null, verbIn = null, noise = null;
  let period = null, song = null, fading = [];
  let disposed = false, level = 1;

  function setup() {
    if (ac) return true;
    const ctx = audio?.context, bus = audio?.output;
    if (!ctx || !bus) return false;
    ac = ctx;
    out = ac.createGain();
    out.gain.value = volume;
    out.connect(bus);
    // a soft room: decaying stereo noise as the impulse response
    const len = Math.floor(ac.sampleRate * 2.6), ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    const conv = ac.createConvolver();
    conv.buffer = ir;
    verbIn = ac.createGain();
    verbIn.connect(conv);
    conv.connect(out);
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    return true;
  }

  // ---- instruments (each note: a few short-lived nodes into the song's own gain) ----
  function send(node, dest, wet) {
    node.connect(dest);
    if (wet > 0) {
      const s = ac.createGain();
      s.gain.value = wet;
      node.connect(s);
      s.connect(verbIn);
    }
  }
  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function tone(D, type, f, t, a, peak, dec, wet) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f;
    o.connect(g); env(g, t, a, peak, dec); send(g, D, wet);
    o.start(t); o.stop(t + a + dec + 0.05);
  }
  function noiseHit(D, t, { type = 'highpass', freq = 7000, q = 0.7, v, a = 0.002, dec, wet = 0.1, swell = false }) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
    s.connect(f); f.connect(g);
    if (swell) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(v, t + dec * 0.6);
      g.gain.linearRampToValueAtTime(0.0001, t + dec);
    } else env(g, t, a, v, dec);
    send(g, D, wet);
    s.start(t, Math.random() * 0.5); s.stop(t + dec + 0.06);
  }
  const I = {
    pluck(D, f, t, v, w) { tone(D, 'triangle', f, t, 0.004, v, 0.7, w); tone(D, 'sine', f * 2, t, 0.004, v * 0.3, 0.3, w); },
    bell(D, f, t, v, w) {
      const c = ac.createOscillator(), m = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain();
      c.frequency.value = f; m.frequency.value = f * 3.5;
      mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(1, t + 1.2);
      m.connect(mg); mg.connect(c.frequency); c.connect(g); env(g, t, 0.003, v, 1.6); send(g, D, w);
      c.start(t); m.start(t); c.stop(t + 1.8); m.stop(t + 1.8);
    },
    marimba(D, f, t, v, w) {
      tone(D, 'sine', f, t, 0.002, v, 0.32, w); tone(D, 'sine', f * 4, t, 0.001, v * 0.18, 0.05, w); tone(D, 'triangle', f * 2, t, 0.002, v * 0.12, 0.12, w);
    },
    ep(D, f, t, v, w, d = 0.9) {
      const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      o.frequency.value = f; o2.frequency.value = f * 2; g2.gain.value = 0.18;
      o2.connect(g2); g2.connect(g); o.connect(g);
      lfo.frequency.value = 4.6; lg.gain.value = v * 0.25; lfo.connect(lg);
      env(g, t, 0.006, v, d); lg.connect(g.gain); send(g, D, w);
      for (const x of [o, o2, lfo]) { x.start(t); x.stop(t + d + 0.1); }
    },
    rhodes(D, f, t, v, w, d) {
      const o = ac.createOscillator(), o2 = ac.createOscillator(), fl = ac.createBiquadFilter(), g = ac.createGain(), g2 = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      o.frequency.value = f; o2.frequency.value = f * 7.02;
      g2.gain.setValueAtTime(0.06, t); g2.gain.exponentialRampToValueAtTime(0.0005, t + 0.12);
      o2.connect(g2); g2.connect(g); o.connect(g);
      fl.type = 'lowpass'; fl.frequency.value = 1800; g.connect(fl);
      lfo.frequency.value = 3.2; lg.gain.value = v * 0.18; lfo.connect(lg); lg.connect(g.gain);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02);
      g.gain.exponentialRampToValueAtTime(v * 0.4, t + 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      send(fl, D, w);
      for (const x of [o, o2, lfo]) { x.start(t); x.stop(t + d + 0.1); }
    },
    vibes(D, f, t, v, w) {
      const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain(), trem = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      o.frequency.value = f; o2.frequency.value = f * 4;
      g2.gain.setValueAtTime(0.15, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o2.connect(g2); g2.connect(g); o.connect(g); g.connect(trem);
      trem.gain.value = 0.8; lfo.frequency.value = 4.2; lg.gain.value = 0.2; lfo.connect(lg); lg.connect(trem.gain);
      env(g, t, 0.004, v, 2.2); send(trem, D, w);
      for (const x of [o, o2, lfo]) { x.start(t); x.stop(t + 2.3); }
    },
    pad(D, ch, t, d, v, w) {
      for (const n of ch) for (const dt of [-7, 7]) {
        const o = ac.createOscillator(), fl = ac.createBiquadFilter(), g = ac.createGain();
        o.type = 'sawtooth'; o.frequency.value = mtof(n); o.detune.value = dt;
        fl.type = 'lowpass'; fl.frequency.value = 900; o.connect(fl); fl.connect(g);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v / ch.length, t + d * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + d * 1.05);
        send(g, D, w); o.start(t); o.stop(t + d * 1.1);
      }
    },
    bass(D, f, t, v, d) {
      const o = ac.createOscillator(), fl = ac.createBiquadFilter(), g = ac.createGain();
      o.type = 'triangle'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 420;
      o.connect(fl); fl.connect(g); env(g, t, 0.01, v, d); send(g, D, 0.05); o.start(t); o.stop(t + d + 0.1);
    },
    upright(D, f, t, v, d) {
      const o = ac.createOscillator(), o2 = ac.createOscillator(), fl = ac.createBiquadFilter(), g = ac.createGain();
      o.frequency.value = f; o2.type = 'triangle'; o2.frequency.value = f;
      fl.type = 'lowpass'; fl.frequency.setValueAtTime(700, t); fl.frequency.exponentialRampToValueAtTime(200, t + 0.2);
      o.connect(g); o2.connect(fl); fl.connect(g); env(g, t, 0.012, v, d); send(g, D, 0.08);
      for (const x of [o, o2]) { x.start(t); x.stop(t + d + 0.1); }
    },
    kick(D, t, v) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
      o.connect(g); env(g, t, 0.002, v, 0.22); send(g, D, 0); o.start(t); o.stop(t + 0.3);
    },
    // a soft wooden tick (a mallet on a wood block): pure tone, no noise, so nothing hisses
    tick(D, t, v) {
      const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(1250, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.05);
      o2.frequency.value = 2480;
      const g2 = ac.createGain(); g2.gain.value = 0.25;
      o.connect(g); o2.connect(g2); g2.connect(g); env(g, t, 0.002, v, 0.07); send(g, D, 0.2);
      for (const x of [o, o2]) { x.start(t); x.stop(t + 0.12); }
    },
    bird(D, t, v) {
      const o = ac.createOscillator(), g = ac.createGain(), b = 2600 + Math.random() * 900;
      for (let k = 0; k < 3; k++) { o.frequency.setValueAtTime(b, t + k * 0.09); o.frequency.exponentialRampToValueAtTime(b * 1.45, t + k * 0.09 + 0.06); }
      o.connect(g); env(g, t, 0.01, v, 0.3); send(g, D, 0.4); o.start(t); o.stop(t + 0.4);
    },
  };

  /** One playing song: its own gain (for fades), melody and step clock. */
  function startSong(key) {
    const S = SONGS[key];
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(1, ac.currentTime + 2.5);
    gain.connect(out);
    return { key, S, gain, mel: melody(S), six: 60 / S.bpm / 4, step: 0, next: ac.currentTime + 0.15, r: rng(S.seed + 3) };
  }
  function stopSong(st, fade = 2.5) {
    const t = ac.currentTime;
    st.gain.gain.cancelScheduledValues(t);
    st.gain.gain.setValueAtTime(Math.max(0.0001, st.gain.gain.value), t);
    st.gain.gain.exponentialRampToValueAtTime(0.0001, t + fade);
    st.endAt = t + fade + 2.5; // let the reverb tails ring out, then disconnect
    fading.push(st);
  }

  function schedule(st, until) {
    const { S, gain: D, six, mel, r } = st;
    while (st.next < until) {
      const bar = Math.floor(st.step / 16) % 16, s = st.step % 16, ch = S.chords[bar % 4], w = S.verb;
      const t = st.next + (S.jazz ? (s % 4 === 2 ? six * 0.62 : 0) : (s % 2 ? (S.swing || 0) * six * 2 : 0));
      if (S.jazz) {
        if (s === 0) I.upright(D, mtof(S.roots[bar % 4]), t, S.bass, six * 7);
        if (s === 8) {
          const root = S.roots[bar % 4], nr = S.roots[(bar + 1) % 4];
          I.upright(D, mtof(r() < 0.5 ? root + 7 : nr + (nr > root ? -1 : 1)), t, S.bass * 0.85, six * 7);
        }
        if (s === 0) for (const n of ch) I.rhodes(D, mtof(n), t + r() * 0.02, 0.05, w, six * 15);
        if (s === 10 && r() < 0.45) for (const n of ch) I.rhodes(D, mtof(n + 12), t, 0.018, w, six * 5);
        // the beat, without brushes or record crackle (owner: no constant brushing sound at night):
        // a soft low kick on 1 and a quiet wooden tick on 2 and 4
        if (s === 0) I.kick(D, t, 0.07);
        if (s === 4 || s === 12) I.tick(D, t, 0.03);
      } else {
        if (s === 0 && S.pad) I.pad(D, ch, t, six * 16, S.pad, w + 0.2);
        if (s === 0) I.bass(D, mtof(ch[0] - 12), t, S.bass, six * (S.drums === 2 ? 3.6 : 7));
        if (S.drums === 2 && s === 8) I.bass(D, mtof(ch[2] - 12), t, S.bass * 0.8, six * 3.5);
        if (S.drums === 1 && s === 8) I.bass(D, mtof(ch[0]), t, S.bass * 0.7, six * 2);
        if (S.arp && s % 2 === 0) I.pluck(D, mtof(ch[(s / 2) % ch.length] + 12), t, 0.05, w);
        if (S.skank && (s === 4 || s === 12)) for (const n of ch) I.pluck(D, mtof(n + 12), t, 0.025, w * 0.5);
        if (S.epChords && (s === 0 || s === 10)) for (const n of ch) I.ep(D, mtof(n + 12), t, 0.04, w, six * 7);
        if (S.drums === 1) {
          if (s === 0 || s === 8) I.kick(D, t, 0.35);
          if (s % 2 === 0) noiseHit(D, t, { v: s % 4 ? 0.05 : 0.025, dec: 0.05, freq: 7000 });
        }
        if (S.drums === 2) {
          if (s === 0 || s === 10) I.kick(D, t, 0.3);
          if (s === 4 || s === 12) noiseHit(D, t, { v: 0.06, dec: 0.18, freq: 2500 });
          if (s % 2 === 0) noiseHit(D, t, { v: 0.025, dec: 0.04, freq: 8000 });
        }
        if (S.birds && s === 6 && r() < 0.22) I.bird(D, t, 0.025);
      }
      const rest = S.jazz && bar % 2 === 1 && s > 8;
      if (!rest) for (const [p, n] of mel[bar]) if (p === s) I[S.lead](D, mtof(n), t, S.leadVol, w);
      st.step++;
      st.next += six;
    }
  }

  const music = {
    get period() { return period; },
    get playing() { return song?.key || null; },
    /** Choose the song for a time of day; cross-fades if another is playing. */
    setPeriod(p) {
      if (!SONGS[p]) return;
      period = p;
    },
    /** Call every frame. duck: true while Maya talks. */
    update(duck = false) {
      if (disposed || !period) return;
      if (!audio || audio.muted || audio.state !== 'running') {
        // silent: stop scheduling; restart cleanly (from a fresh bar) when sound comes back
        if (song && ac) { stopSong(song, 0.4); song = null; }
        return;
      }
      if (!setup()) return;
      if (!song || song.key !== period) {
        if (song) stopSong(song);
        song = startSong(period);
      }
      // a long pause (tab in the background): skip ahead instead of playing a burst of notes
      if (song.next < ac.currentTime - 0.5) {
        const lost = Math.ceil((ac.currentTime - song.next) / song.six);
        song.step += lost; song.next += lost * song.six;
      }
      schedule(song, ac.currentTime + AHEAD);
      const target = duck ? DUCK : 1;
      if (Math.abs(target - level) > 0.01) {
        level = target;
        out.gain.setTargetAtTime(volume * level, ac.currentTime, 0.4);
      }
      if (fading.length) {
        const t = ac.currentTime;
        fading = fading.filter((st) => { if (t < st.endAt) return true; st.gain.disconnect(); return false; });
      }
    },
    dispose() {
      disposed = true;
      if (!ac) return;
      if (song) stopSong(song, 0.3);
      setTimeout(() => { try { out.disconnect(); } catch { /* ignore */ } }, 800);
    },
  };
  return music;
}
