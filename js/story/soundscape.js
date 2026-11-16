// The soundscape: town ambience + town song, area songs, room music, mission cues, all made in code
// (Web Audio; js/story/sound/*). One call a frame decides what should be heard; layers cross-fade.
//
//   import { createSoundscape } from './soundscape.js';
//   const sound = createSoundscape(audio);            // audio = createAudio() (js/game/audio.js)
//   sound.update(dt, {
//     district: 'market',          // region id (or x, z: looked up from the district rects)
//     zone: 'teasquare',           // or null; omit and pass x, z to look it up (sound/places.js ZONES)
//     room: story.inRoom,          // room id while indoors, else null
//     mode: 'talk'|'act'|'scene'|null,
//     cue: 'finale',               // optional mission cue: talk focus nightpage finale d12rain d14back d15letter
//     tension: 0.6,                // talk only: 0 = calm (the tense layer fades out), 1 = most tense
//     speaking: true,              // ducks music and ambience while a line is on screen
//     hour: 17.5, rain: false,
//   });
//   sound.sting('lesson' | 'stamp' | 'page' | 'arrive', districtForArrive);
//   sound.volume = 0.5;  sound.stats();  sound.dispose();
//
//   more state (Nov 2026): driving: true (she drives; music turns to a 'drive:*' song), gather: { kind, level }
//   (a gathering she stands in: 'event:<kind>' song + 'ev:<kind>' ambience at level 0..1), day (save day: varies
//   which song of a place plays first). sound.emit(name, { pan, far, v }): one positional one-shot (budgeted).
//
// Priorities: mission cue > room > gathering > driving > rain (outdoors) > crowd > area > town.
// Songs of a place: a place key ('town:market') has variants ('town:market#2'...): PLAYLIST (songs-more.js) or the
// default recipe picks one by time of day and visit (a new visit hears a different one; the same song never plays
// again within three picks; back from a talk or a room within 90 s: the same song as before), and after 150 s in
// one place it rotates to the next, only at the end of a form, with a 4 s cross-fade. Rooms pick theirs by a hash
// of the room id (each house keeps its own tune). R.music = the place key, R.song = the variant playing.
// Events budget (every ambience layer and emit together): at most 5 one-shots sounding, 18 a minute (tiny ones
// like drips and the clock are free), a cooldown per name (animals 6-20 s, a child's voice 25 s), and while a line
// is on screen only 40% of them play. Birds: a 'birds:<period>' layer outdoors (places.js DISTRICT_BIRDS).
// Music: one song at a time, 2.5 s cross-fades; a change of time of day re-plays the same song in its new colour. Ambience: town bed (day/night) + area bed on top;
// indoors the town is heard through the walls (low-passed, 30%). Rain adds a bed outside or on the roof.
// It plays into audio.output, so the game's sound button mutes it. While muted / suspended nothing runs.
// CPU: ~2-5 short notes a second per song (each 1 buffer source + 1 gain), 2-6 looping beds (3-5 nodes each),
// one convolver shared by everything, 0.4 s scheduled ahead; idle layers are stopped and disconnected.
import { getBank } from './sound/bank.js';
import { FX } from './sound/fx.js';
import { SONGS, startSong, playSting } from './sound/songs.js';
import { PLAYLIST } from './sound/songs-more.js';
import { AMBIENCE, ZONES, ROOM_TYPE, ROOM_AMB, ROOM_SONG, MODE_CUE, DISTRICT_ALIAS, DISTRICT_BIRDS, TIN_ROOF, zoneAt, districtAt } from './sound/places.js';

export { SONGS, AMBIENCE, ZONES, ROOM_TYPE };

const AHEAD = 0.4; // seconds scheduled ahead
const FADE = 2.5; // cross-fade (s)
const TONE = { morning: 7000, noon: 10000, evening: 5200, night: 3400 }; // music brightness by time of day
const ROTATE = 150; // s in one place before its next song (at a form end)
const EV_PER_MIN = 18, EV_ALIVE = 5; // the events budget
/** Tiny one-shots outside the per-minute budget (they still keep their cooldown). */
const FREE = new Set(['drip', 'clockTick', 'splash', 'rainWindow', 'gutterDrip', 'creak']);
/** Seconds between two of the same one-shot (default 3; 'every' bed events such as the clock set their own: 0). */
const COOLDOWN = {
  clockTick: 0, drip: 0.3, splash: 0.6, rainWindow: 0.5, creak: 1.5,
  giggle: 25, yay: 25, dog: 6, dogFar: 10, rooster: 20, hen: 6, duck: 6, cat: 12, gecko: 6, crowFar: 10, koel: 8, dove: 6,
  owlet: 6, frog: 4, horn: 20, schoolBell: 20, kettle: 8, teaPour: 6, cartBell: 15, trishawPass: 12, wellBucket: 15,
};

export function periodOf(hour = 12) {
  const h = ((hour % 24) + 24) % 24;
  if (h < 5 || h >= 19.5) return 'night';
  if (h < 10) return 'morning';
  if (h < 16) return 'noon';
  return 'evening';
}

/** What should be heard for a game state: { music, period, amb: { key: { level, muffle } }, tension, cue }. */
export function resolve(s = {}) {
  const district = DISTRICT_ALIAS[s.district] || s.district || (s.x != null ? districtAt(s.x, s.z) : null);
  const zone = s.zone !== undefined ? s.zone : s.x != null ? zoneAt(s.x, s.z) : null;
  const Z = zone && ZONES[zone] ? zone : null;
  const room = s.room || null, rtype = room ? ROOM_TYPE[room] || 'home' : null;
  const period = s.period || periodOf(s.hour ?? 12), night = period === 'night';
  const cue = s.cue || MODE_CUE[s.mode] || null;
  const evCue = cue && cue.startsWith('event:'); // a gathering song named as a cue (an events script)
  const gather = !rtype && s.gather ? s.gather : null;
  const eve = period === 'evening';
  // s.crowd: many townsfolk around Maya outdoors -> the livelier street song (owner: music, not crowd noise)
  const music = cue ? (cue.includes(':') ? cue : 'cue:' + cue) : rtype ? ROOM_SONG[rtype] || 'room:' + rtype
    : gather && SONGS['event:' + gather.kind] ? 'event:' + gather.kind
      : s.driving ? 'drive:' + (s.rain ? 'rain' : night ? 'night' : eve ? 'eve' : district === 'envelope' ? 'road' : 'town')
        : s.rain ? 'rain:' + (night ? 'night' : eve ? 'eve' : 'day')
          : s.crowd ? 'area:crowd' : Z ? 'area:' + Z : district ? 'town:' + district : null;
  const amb = {};
  const town = district ? `${district}:${night ? 'night' : 'day'}` : null;
  if (rtype) {
    amb[ROOM_AMB[room] || ROOM_AMB[rtype] || 'room:' + rtype] = { level: 1 };
    if (town) amb[town] = { level: 0.3, muffle: true };
    if (s.rain) amb[TIN_ROOF.includes(rtype) ? 'rain:tin' : 'rain:in'] = { level: 1 };
  } else {
    if (town) amb[town] = { level: (Z ? 0.6 : 1) * (s.rain ? 0.45 : 1) }; // rain: birds and crowds go quiet
    if (Z) amb['area:' + Z] = { level: night && !['jetties', 'bridge', 'lodgeporch'].includes(Z) ? 0.4 : 1 };
    if (s.rain) amb['rain:out'] = { level: 1 };
    else if (district && DISTRICT_BIRDS[district]) amb['birds:' + period] = { level: DISTRICT_BIRDS[district] * (Z ? 0.7 : 1) * (s.driving ? 0.5 : 1) };
    const ev = gather ? 'ev:' + gather.kind : evCue ? 'ev:' + cue.slice(6) : null;
    if (ev && AMBIENCE[ev]) amb[ev] = { level: Math.max(0.05, Math.min(1, gather ? gather.level ?? 1 : 1)) };
  }
  if (cue === 'finale') for (const k in amb) amb[k].level *= 0.5;
  else if (cue && !evCue) for (const k in amb) amb[k].level *= cue === 'talk' ? 0.3 : cue === 'focus' ? 0.5 : 0.7; // the place steps back while she talks / works
  const tension = cue === 'talk' ? Math.max(0, Math.min(1, s.tension ?? (s.calm ? 0 : 0.6))) : 0;
  return { music: SONGS[music] ? music : null, song: null, period, amb, tension, cue, district, zone: Z, room, gather: gather ? gather.kind : null };
}

const irCache = new WeakMap();
function reverbIR(ctx) {
  let ir = irCache.get(ctx);
  if (ir) return ir;
  const len = Math.floor(ctx.sampleRate * 1.9);
  ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) { lp += ((Math.random() * 2 - 1) - lp) * 0.55; d[i] = lp * Math.pow(1 - i / len, 3) * 0.6; }
  }
  irCache.set(ctx, ir);
  return ir;
}

/** The engine on any AudioContext (live or Offline). dest: the node it plays into. */
export function createScape(ctx, dest, { volume = 0.38, solo = null, fallback = false } = {}) {
  const bank = getBank(ctx);
  const master = ctx.createGain(); master.gain.value = volume; master.connect(dest);
  const musicBus = ctx.createGain(), tone = ctx.createBiquadFilter(), musicDuck = ctx.createGain();
  tone.type = 'lowpass'; tone.frequency.value = TONE.noon; tone.Q.value = 0.5;
  musicBus.connect(tone); tone.connect(musicDuck); musicDuck.connect(master);
  const ambBus = ctx.createGain(), ambDuck = ctx.createGain();
  ambBus.connect(ambDuck); ambDuck.connect(master);
  const stingBus = ctx.createGain(); stingBus.gain.value = 0.6; stingBus.connect(master); // ~6 dB over the music, not 10
  const verbIn = ctx.createGain(), conv = ctx.createConvolver();
  conv.buffer = reverbIR(ctx); verbIn.gain.value = 0.9; verbIn.connect(conv); conv.connect(master);
  const E = { ctx, bank, verb: verbIn, dest: ambBus, fallback }; // fallback: live game (a song plays a part's `alt` until its instrument is warmed)
  if (solo) { // previews only: hear one bus (its reverb included) to measure the balance
    const keep = { music: musicDuck, amb: ambDuck, sting: stingBus }[solo];
    for (const b of [musicDuck, ambDuck, stingBus]) if (b !== keep) { b.disconnect(); b.connect(ctx.createGain()); }
    if (solo !== 'music') { verbIn.disconnect(); } // reverb is shared: measure dry for non-music stems
  }

  let song = null, fading = [], disposed = false, last = null, curDuck = -1, curTone = -1, curTense = -1;
  const layers = new Map();
  const counts = { notes: 0, events: 0 };

  // ---- ambience layers ----
  function makeLayer(key, now) {
    const def = AMBIENCE[key];
    if (!def) return null;
    const g = ctx.createGain(), muff = ctx.createBiquadFilter(), input = ctx.createGain();
    g.gain.value = 0.0001; input.gain.value = def.level ?? 1; // def.level: balance against the music (measured)
    muff.type = 'lowpass'; muff.frequency.value = 18000;
    input.connect(g); g.connect(muff); muff.connect(ambBus);
    const stoppers = [], nodes = [g, muff, input];
    for (const b of def.beds || []) {
      const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), bg = ctx.createGain();
      src.buffer = bank.loop(b.loop); src.loop = true;
      [f.type, f.frequency.value, f.Q.value] = b.f || ['lowpass', 18000, 0.7];
      bg.gain.value = b.v;
      src.connect(f); f.connect(bg); bg.connect(input);
      src.start(now, Math.random() * src.buffer.duration);
      stoppers.push(src); nodes.push(src, f, bg);
      if (b.lfo) {
        const o = ctx.createOscillator(), og = ctx.createGain();
        o.frequency.value = b.lfo[0] * (0.8 + Math.random() * 0.4); og.gain.value = b.v * b.lfo[1] * 0.5;
        o.connect(og); og.connect(bg.gain); o.start(now); stoppers.push(o); nodes.push(o, og);
      }
      if (b.sweep) {
        const o = ctx.createOscillator(), og = ctx.createGain();
        o.frequency.value = b.sweep[0]; og.gain.value = b.sweep[1];
        o.connect(og); og.connect(f.frequency); o.start(now); stoppers.push(o); nodes.push(o, og);
      }
    }
    const gap = (rate) => Math.max(0.35, (-Math.log(1 - Math.random()) * 60) / rate);
    const ev = (def.events || []).map(([name, rate, v, opts]) => ({ name, v, opts, rate, next: now + 0.4 + Math.random() * Math.min(9, 60 / rate) }));
    for (const [name, period, v] of def.every || []) ev.push({ name, v, period, next: now + Math.random() * period });
    return { key, def, g, muff, input, stoppers, nodes, ev, target: 0, muffle: false, gap };
  }
  function setLayer(L, level, muffle, now, fade) {
    if (Math.abs(L.target - level) > 0.001) {
      L.target = level;
      L.g.gain.cancelScheduledValues(now);
      L.g.gain.setTargetAtTime(Math.max(0.0001, level), now, fade / 3);
      if (level <= 0.001) L.dieAt = now + fade * 1.6;
      else L.dieAt = 0;
    }
    if (L.muffle !== muffle) {
      L.muffle = muffle;
      L.muff.frequency.setTargetAtTime(muffle ? 650 : 18000, now, fade / 4);
    }
  }
  function killLayer(L) {
    for (const s of L.stoppers) try { s.stop(); } catch { /* ignore */ }
    for (const n of L.nodes) try { n.disconnect(); } catch { /* ignore */ }
    layers.delete(L.key);
  }
  // ---- the events budget (all layers and emit() share it; no allocation) ----
  const evTimes = new Float64Array(EV_PER_MIN), alive = new Float64Array(EV_ALIVE), lastAt = Object.create(null);
  let evI = 0, speaking = false;
  evTimes.fill(-1e9);
  /** May a one-shot `name` start at t? (books it if so; `dur` is filled in by fire()) */
  function allow(name, t) {
    const cd = COOLDOWN[name] ?? 3;
    if (t - (lastAt[name] ?? -1e9) < cd) return -1;
    if (FREE.has(name)) { lastAt[name] = t; return EV_ALIVE; }
    if (speaking && Math.random() < 0.6) return -1;
    if (t - evTimes[evI] < 60) return -1; // the oldest of the last EV_PER_MIN is under a minute old
    let slot = -1;
    for (let i = 0; i < EV_ALIVE; i++) if (alive[i] <= t) { slot = i; break; }
    if (slot < 0) return -1;
    lastAt[name] = t;
    evTimes[evI] = t; evI = (evI + 1) % EV_PER_MIN;
    return slot;
  }
  function fire(name, t, v, opts, dest) {
    const slot = allow(name, t);
    if (slot < 0) return 0;
    E.dest = dest;
    const d = FX[name](E, t, v, opts) || 1;
    if (slot < EV_ALIVE) alive[slot] = t + d;
    counts.events++;
    return d;
  }
  function pumpLayer(L, now, until) {
    for (const e of L.ev) {
      if (e.next < now - 1) e.next = now + (e.period || L.gap(e.rate)) * Math.random(); // after a long pause: no burst
      while (e.next < until) {
        if (L.target > 0.02 && FX[e.name]) fire(e.name, e.next, e.v, e.opts, L.input);
        e.next += e.period || L.gap(e.rate);
      }
    }
  }

  // ---- which song of a place plays (see the top of the file) ----
  const recent = ['', '']; // the last two songs started
  const visits = Object.create(null), memo = Object.create(null); // per place: visits; { song, t } last heard
  let placeKey = null, place = null, list = null, idx = 0, placeT0 = 0, rotateFade = 0;
  function variantsOf(key, period) {
    const P = PLAYLIST[key];
    if (P) return (P[period] || P.noon).filter((k) => SONGS[k]);
    const B = key + '#2', C3 = key + '#3';
    if (!SONGS[B]) return [key];
    if (!SONGS[C3]) return [key, B];
    return period === 'morning' ? [key, B] : period === 'noon' ? [B, key] : period === 'evening' ? [B, C3] : [C3, key];
  }
  function fresh(L, i) { for (let k = 0; k < L.length; k++) { const j = (i + k) % L.length; if (L[j] !== recent[0] && L[j] !== recent[1]) return j; } return i; }
  function hashStr(str) { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return h < 0 ? -h : h; }
  function chooseSong(R, s, now) {
    rotateFade = 0;
    if (s.song && SONGS[s.song]) return s.song; // (previews / tests: one exact song)
    if (!R.music) { placeKey = place = null; return null; }
    const key = R.music + '@' + R.period;
    if (key !== placeKey) {
      const was = place, cur = list ? list[idx] : null;
      placeKey = key; place = R.music; list = variantsOf(place, R.period); placeT0 = now;
      const m = memo[place];
      if (R.room && place.startsWith('room:')) idx = hashStr(String(R.room)) % list.length; // each house keeps its tune
      else if (was === place && list.includes(cur)) idx = list.indexOf(cur); // only the time of day changed
      else if (m && now - m.t < 90 && list.includes(m.song)) idx = list.indexOf(m.song); // back from a talk / a room
      else { visits[place] = (visits[place] || 0) + 1; idx = fresh(list, ((s.day | 0) * 7 + visits[place]) % list.length); }
    } else if (song && list.length > 1 && !place.startsWith('room:') && song.loops > (song.seen || 0)) {
      song.seen = song.loops; // a form just ended
      if (now - placeT0 >= ROTATE) { idx = fresh(list, (idx + 1) % list.length); placeT0 = now; rotateFade = 4; }
    }
    const v = list[idx];
    const m = memo[place];
    if (m) { m.song = v; m.t = now; } else memo[place] = { song: v, t: now };
    return v;
  }

  const scape = {
    get volume() { return master.gain.value; },
    set volume(v) { master.gain.setTargetAtTime(Math.max(0, v), ctx.currentTime, 0.1); },
    get state() { return last; },
    /** Call every frame (or every few frames: it schedules 0.4 s ahead). opts.fade overrides the cross-fade. */
    update(dt, s = {}, { fade = FADE } = {}) {
      if (disposed) return;
      const now = ctx.currentTime, R = resolve(s);
      last = R;
      speaking = !!s.speaking;
      // music
      const v = chooseSong(R, s, now);
      R.song = v;
      const id = v ? v + '@' + R.period : null;
      if ((song?.id || null) !== id) {
        const f = rotateFade || fade;
        if (song) { song.stop(f); fading.push(song); }
        song = id ? startSong(E, v, musicBus, { period: R.period, fade: f }) : null;
        if (song) { song.id = id; if (v !== recent[0]) { recent[1] = recent[0]; recent[0] = v; } }
        curTense = -1; // the new song starts calm: set its tension below
      }
      if (song) {
        const n0 = song.notes;
        if (song.next < now - 0.5) { const lost = Math.ceil((now - song.next) / song.six); song.step += lost; song.next += lost * song.six; }
        song.schedule(now + AHEAD);
        counts.notes += song.notes - n0;
        if (Math.abs(curTense - R.tension) > 0.01) {
          curTense = R.tension;
          song.groups.tense.gain.setTargetAtTime(R.tension, now, 0.9);
          song.groups.calm.gain.setTargetAtTime(1 - 0.6 * R.tension, now, 0.9);
        }
      }
      for (const st of fading) st.schedule(now + AHEAD);
      fading = fading.filter((st) => { if (now < st.endAt) return true; st.dispose(); return false; });
      const toneHz = TONE[R.period] * (s.rain ? 0.7 : 1) * (R.room ? 0.85 : 1);
      if (Math.abs(curTone - toneHz) > 1) { curTone = toneHz; tone.frequency.setTargetAtTime(toneHz, now, 1.2); }
      // ducking under dialogue (stings schedule their own dip)
      const duck = s.speaking ? 0.5 : 1;
      if (Math.abs(curDuck - duck) > 0.01) {
        curDuck = duck;
        musicDuck.gain.setTargetAtTime(duck, now, 0.25);
        ambDuck.gain.setTargetAtTime(s.speaking ? 0.75 : 1, now, 0.3);
      }
      // ambience
      for (const [key, { level, muffle }] of Object.entries(R.amb)) {
        let L = layers.get(key);
        if (!L) { L = makeLayer(key, now); if (!L) continue; layers.set(key, L); }
        setLayer(L, level, !!muffle, now, fade);
      }
      for (const L of [...layers.values()]) {
        if (!R.amb[L.key]) setLayer(L, 0, L.muffle, now, fade);
        if (L.dieAt && now > L.dieAt) { killLayer(L); continue; }
        pumpLayer(L, now, now + AHEAD);
      }
    },
    /** A short phrase over everything; the music dips under it. at: context time (default now). */
    sting(name, arg, at = null) {
      if (disposed) return 0;
      const t = at ?? ctx.currentTime + 0.05;
      const d = playSting(E, stingBus, name, t, arg);
      if (d) {
        musicDuck.gain.setTargetAtTime(0.55, t, 0.15);
        musicDuck.gain.setTargetAtTime(curDuck > 0 ? curDuck : 1, t + d * 0.8, 0.6);
      }
      return d;
    },
    /** One positional one-shot (FX name) now: pan -1..1, far 0..1 (low-passed, more reverb), v volume. Budgeted:
     *  returns 0 when refused (cooldown, too many sounding, over the per-minute budget). */
    emit(name, { pan = 0, far = 0, v = 1 } = {}) {
      if (disposed || !FX[name]) return 0;
      const t = ctx.currentTime + 0.05;
      if (t - (lastAt[name] ?? -1e9) < (COOLDOWN[name] ?? 3)) return 0;
      const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null, lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 16000 - Math.max(0, Math.min(1, far)) * 12500;
      if (p) { p.pan.value = Math.max(-1, Math.min(1, pan)); lp.connect(p); p.connect(ambDuck); } else lp.connect(ambDuck);
      return fire(name, t, v, undefined, lp);
    },
    stats() {
      let beds = 0;
      for (const L of layers.values()) beds += (L.def.beds || []).length;
      return { music: song?.key || null, place, fading: fading.length, layers: [...layers.keys()], beds, notes: counts.notes, events: counts.events, bankKB: Math.round(bank.bytes() / 1024) };
    },
    dispose(fadeOut = 0.4) {
      if (disposed) return;
      disposed = true;
      const now = ctx.currentTime;
      master.gain.setTargetAtTime(0.0001, now, fadeOut / 3);
      const end = () => {
        for (const L of [...layers.values()]) killLayer(L);
        for (const st of [song, ...fading]) st?.dispose();
        try { master.disconnect(); } catch { /* ignore */ }
      };
      if (typeof setTimeout !== 'undefined' && ctx instanceof (globalThis.AudioContext || Object)) setTimeout(end, fadeOut * 1000 + 300);
      else end();
    },
  };
  return scape;
}

/**
 * The game's soundscape on the shared sound system (js/game/audio.js). It builds itself once sound is
 * running and unmuted, and tears itself down (fading) when muted or the tab is hidden.
 */
export function createSoundscape(audio, opts = {}) {
  let core = null, vol = opts.volume ?? 0.38;
  return {
    update(dt, s) {
      if (!audio || audio.muted || audio.state !== 'running') {
        if (core) { core.dispose(0.4); core = null; }
        return;
      }
      if (!core) {
        const ctx = audio.context, out = audio.output;
        if (!ctx || !out) return;
        core = createScape(ctx, out, { volume: vol, fallback: true });
        core.update(dt, s, { fade: 1.5 });
        return;
      }
      core.update(dt, s);
    },
    sting(name, arg) { return core ? core.sting(name, arg) : 0; },
    emit(name, o) { return core ? core.emit(name, o) : 0; },
    get volume() { return vol; },
    set volume(v) { vol = v; if (core) core.volume = v; },
    get state() { return core?.state || null; },
    stats() { return core ? core.stats() : null; },
    dispose() { core?.dispose(0.3); core = null; },
  };
}

/**
 * Offline render for previews and tests (no speakers). spec: { seconds, state, timeline: [[t, state]...],
 * stings: [[t, name, arg]...], sampleRate, volume }. Resolves the AudioBuffer (stereo). The game's master
 * bus (gain 0.8 + soft compressor, as js/game/audio.js) is copied so levels match the game.
 */
export async function renderScape(spec) {
  const OAC = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  const sr = spec.sampleRate || 44100, sec = spec.seconds || 20;
  const oac = new OAC(2, Math.ceil(sr * sec), sr);
  const bus = oac.createGain(), comp = oac.createDynamicsCompressor();
  bus.gain.value = 0.8;
  comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.15;
  bus.connect(comp); comp.connect(oac.destination);
  const sc = createScape(oac, bus, { volume: spec.volume ?? 0.38, solo: spec.solo || null });
  const tl = spec.timeline || [[0, spec.state || {}]];
  const stateAt = (t) => { let s = tl[0][1]; for (const [tt, st] of tl) if (tt <= t + 1e-6) s = st; return s; };
  sc.update(0, stateAt(0), { fade: 0.6 });
  for (const [t, name, arg] of spec.stings || []) sc.sting(name, arg, t);
  const step = 0.2;
  for (let k = 1; k * step < sec - 0.05; k++) {
    const tt = Math.round(k * step * 1000) / 1000;
    oac.suspend(tt).then(() => { sc.update(step, stateAt(tt), { fade: spec.fade || FADE }); oac.resume(); });
  }
  const buf = await oac.startRendering();
  buf.stats = sc.stats();
  return buf;
}
