// Maya's reactions ("barks"): short, non-blocking remarks when something happens - standing still,
// driving for ages, spinning until she is dizzy, braking hard, passing a place, finishing a room,
// switching language or sound, late at night... She says them in a small bubble above her head
// (ui.bark) with a matching emote, face, particles and sound; the game never stops for them.
//
// The words live in strings.js (BARKS, BARK_PLACES). This file only decides when, and how she acts.
// main.js calls barks.update(dt) once per frame. Everything else is read from the game's own
// state, or from document events (mw:lang, mw:order, visibilitychange, resize).
//
// Testing: ?barks=0 turns the automatic reactions off. In the console:
//   __mwGame.barks.fire('dizzy')            say one now (ignores cooldowns and gates)
//   __mwGame.barks.fire('passBy', 'library') with a place
//   __mwGame.barks.list                     every trigger id
//   __mwGame.barks.log                      what she said this visit [{ t, id, text }]
import { PLACES } from './config.js';
import { BARKS, BARK_PLACES } from './strings.js';
import { tr } from './ui.js';

const params = new URLSearchParams(location.search);
const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } return null; };
const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// How Maya acts for each trigger.
//   emote   body animation (only upper-body ones, so they also work seated in the car)
//   face    expression: after the emote, or first when emoteAt is set (the emote starts then)
//   hold    seconds the face stays
//   fx      [kind, count, delay s, spread, up] particle bursts at her head (fx.js kinds)
//   sound   audio.play name (muted sound is respected by audio.js)
//   cd      seconds before the same trigger may fire again; max = times per visit
//   urgent  a direct answer to something the visitor just did: skips the shared gap between barks
//   event   a reply to something that just happened: needs only EVENT_GAP after the last bark
//   sheet   may show (small) while the price sheet is open; never otherwise
const SPEC = {
  idle: { emote: 'lookAround', face: 'think', fx: [['question', 1, 0.3]], sound: 'pop', cd: 40, max: 3 },
  idleRoom: { emote: 'lookAround', face: 'smile', fx: [['question', 1, 0.3]], sound: 'pop', cd: 40, max: 3 },
  bored: { emote: 'think', face: 'think', fx: [['note', 3, 0.5, 0.4, 0.5], ['note', 2, 1.5, 0.4, 0.5]], sound: 'pop', cd: 60, max: 2 },
  sleepy: { face: 'sleepy', hold: 4.6, fx: [['zzz', 3, 0.2], ['zzz', 3, 2.2]], cd: 120, max: 2 },
  firstDrive: { emote: 'cheer', face: 'star', fx: [['sparkle', 8, 0.3]], sound: 'sparkle', cd: 0, max: 1 },
  driveLong: { emote: 'point', face: 'happy', fx: [['sparkle', 6, 0.4]], sound: 'chime', cd: 90, max: 2 },
  driveVeryLong: { emote: 'think', face: 'sleepy', fx: [['question', 1, 0.3]], sound: 'pop', cd: 0, max: 1 },
  dizzy: { face: 'dizzy', hold: 2.8, emoteAt: 2.3, emote: 'laugh', urgent: true, carBump: 0.6, sound: 'whoosh', cd: 25, max: 3,
    fx: [['star', 5, 0, 0.5, 0.6], ['star', 4, 0.55, 0.5, 0.6], ['star', 4, 1.1, 0.5, 0.6], ['question', 1, 1.6]] },
  speedy: { emote: 'cheer', face: 'star', fx: [['exclaim', 1, 0.1], ['sparkle', 6, 0.5]], sound: 'whoosh', cd: 60, max: 2 },
  hardBrake: { face: 'surprised', hold: 1.6, emoteAt: 1.2, emote: 'lookAround', fx: [['exclaim', 1, 0]], sound: 'pop', urgent: true, carBump: 0.8, cd: 40, max: 2 },
  bump: { face: 'surprised', hold: 1.4, emoteAt: 1.0, emote: 'laugh', fx: [['star', 4, 0, 0.35, 0.4], ['dust', 6, 0, 0.5, 0.2]], sound: 'pop', urgent: true, carBump: 1, cd: 30, max: 3 },
  uturns: { emote: 'think', face: 'think', fx: [['question', 1, 0.3]], sound: 'pop', cd: 90, max: 1 },
  passBy: { event: true, emote: 'point', face: 'surprised', fx: [['exclaim', 1, 0]], sound: 'pop', cd: 40, max: 3 },
  placeAgain: { event: true, emote: 'wave', face: 'heart', fx: [['heart', 4, 0.3]], sound: 'sparkle', cd: 60, max: 3 },
  leftEmpty: { event: true, emote: 'lookAround', face: 'shy', fx: [['question', 1, 0.3]], sound: 'pop', cd: 60, max: 2 },
  roomComplete: { emote: 'cheer', face: 'star', fx: [['confetti', 16, 0.2], ['sparkle', 8, 0.5]], sound: 'cheer', urgent: true, cd: 5, max: 6 },
  allPlaces: { event: true, emote: 'dance', face: 'heart', fx: [['confetti', 18, 0.2], ['heart', 5, 0.8]], sound: 'cheer', cd: 0, max: 1 },
  roomLong: { emote: 'cheer', face: 'happy', fx: [['heart', 3, 0.4]], sound: 'pop', cd: 0, max: 1 },
  wall: { face: 'surprised', hold: 1.3, emoteAt: 0.9, emote: 'laugh', fx: [['star', 3, 0, 0.3, 0.4]], sound: 'pop', urgent: true, cd: 40, max: 2 },
  sheetPrice: { emote: 'phone', face: 'wink', sheet: true, subtle: true, cd: 120, max: 2 },
  sheetLong: { emote: 'nod', face: 'smile', sheet: true, subtle: true, cd: 120, max: 2 },
  lang: { emote: 'wave', face: 'happy', fx: [['sparkle', 6, 0.2]], sound: 'sparkle', urgent: true, cd: 3, max: 8 },
  soundOff: { emote: 'nod', face: 'shy', urgent: true, cd: 3, max: 4 },
  soundOn: { emote: 'cheer', face: 'happy', fx: [['note', 4, 0.2, 0.45, 0.6]], sound: 'chime', urgent: true, cd: 3, max: 4 },
  tapSpam: { face: 'shy', hold: 1.6, emoteAt: 0.9, emote: 'laugh', fx: [['heart', 3, 0.1]], sound: 'kiss', urgent: true, cd: 6, max: 6 },
  honkSpam: { emote: 'laugh', face: 'wink', fx: [['note', 3, 0.2]], sound: 'honk', honk: true, urgent: true, cd: 6, max: 4 },
  lateNight: { face: 'sleepy', hold: 2.4, emoteAt: 2.0, emote: 'nod', fx: [['zzz', 3, 0.3]], sound: 'chime', cd: 0, max: 1 },
  morning: { emote: 'wave', face: 'happy', fx: [['sparkle', 6, 0.3]], sound: 'chime', cd: 0, max: 1 },
  lunch: { emote: 'thumbsUp', face: 'happy', fx: [['heart', 3, 0.4]], sound: 'pop', cd: 0, max: 1 },
  evening: { emote: 'wave', face: 'smile', fx: [['sparkle', 5, 0.3]], sound: 'chime', cd: 0, max: 1 },
  returning: { event: true, emote: 'wave', face: 'heart', fx: [['heart', 5, 0.4]], sound: 'sparkle', cd: 0, max: 1 },
  longSession: { emote: 'bow', face: 'heart', fx: [['heart', 4, 0.6]], sound: 'sparkle', cd: 0, max: 1 },
  breakTime: { emote: 'nod', face: 'smile', fx: [['bulb', 1, 0.3]], sound: 'chime', cd: 0, max: 1 },
  tabBack: { event: true, emote: 'wave', face: 'happy', fx: [['sparkle', 6, 0.3]], sound: 'chime', cd: 60, max: 3 },
  landscape: { event: true, emote: 'thumbsUp', face: 'star', fx: [['sparkle', 6, 0.3]], sound: 'sparkle', cd: 0, max: 1 },
};

const GAP_MIN = 25, GAP_RAND = 12; // seconds between ordinary barks (25-37 s)
const URGENT_GAP = 3; // even direct answers wait this long after the last bark
const EVENT_GAP = 8; // replies to a moment (passing a place, leaving a room...)
const IDLE_AT = [20, 45, 90]; // standing still: seconds for each step
const DRIVE_AT = [60, 180]; // continuous driving
const SPIN_LIMIT = Math.PI * 3; // 540 degrees ...
const SPIN_BUCKET = 0.5, SPIN_N = 8; // ... within 4 s
const PRICE_SHEET = /^#(tpl-(short|creator|business)|scr-|cc-|templates-all|scripts-all|content-all)/;

export function createBarks(game) {
  const ui = game.ui;
  const gameEl = document.getElementById('game');
  const enabled = params.get('barks') !== '0';
  const ids = Object.keys(SPEC);
  const count = Object.create(null), lastAt = Object.create(null), lastLine = Object.create(null);
  for (const id of ids) { count[id] = 0; lastAt[id] = -1e9; lastLine[id] = -1; }
  const log = [];

  let T = 0; // seconds of play (the frame loop pauses while the tab is hidden)
  let nextFree = 12; // nothing ordinary in the first seconds (the intro is busy anyway)
  let lastBark = -1e9;
  let current = null; // spec of the bark on screen

  // pending barks: fire when the game is free, drop when they expire
  const QN = 8;
  const qId = new Array(QN).fill(null), qAt = new Float32Array(QN), qExp = new Float32Array(QN), qPlace = new Array(QN).fill(null);
  function queue(id, delay, life, place = null) {
    for (let i = 0; i < QN; i++) {
      if (qId[i] === id) return; // already waiting
    }
    for (let i = 0; i < QN; i++) {
      if (qId[i] === null) { qId[i] = id; qAt[i] = T + delay; qExp[i] = T + delay + life; qPlace[i] = place; return; }
    }
  }

  // memory from earlier visits
  const visitedAtStart = new Set(game.visitedPlaces || []);
  const allDoneAtStart = !!store('mw-all-done');
  const lastVisit = Number(store('mw-last-visit')) || 0;
  const now0 = Date.now();
  store('mw-last-visit', String(now0));
  if (lastVisit && now0 - lastVisit > 3 * 86400e3) queue('returning', 16, 120);
  const hour = new Date(now0).getHours();
  const timeBark = hour >= 23 || hour < 4 ? 'lateNight' : hour >= 5 && hour < 9 ? 'morning' : hour >= 12 && hour < 14 ? 'lunch' : hour >= 18 && hour < 20 ? 'evening' : null;
  if (timeBark) queue(timeBark, 24, 240);

  // ---------------------------------------------------------------- gates
  const isCinema = () => gameEl.classList.contains('cinema') || !!ui.els.fader.className;
  function blocked(spec) {
    if (document.hidden || game.busy || game.worldWalk || ui.dialogOpen || isCinema()) return true;
    if (ui.sheetOpen) return !spec.sheet;
    if (spec.sheet) return true;
    if (!spec.urgent && (game.reacting || game.rig?.cinematic)) return true;
    if (game.mode === 'room' && (!game.room || !game.walker)) return true;
    return false;
  }

  // ---------------------------------------------------------------- places
  const currentPlace = () => (game.mode === 'room' ? game.room?.id : game.arrivedAt) || null;
  function suggestPlace() {
    const here = currentPlace();
    const fresh = PLACES.filter((p) => p.id !== here && !game.visitedPlaces.has(p.id));
    const pool = fresh.length ? fresh : PLACES.filter((p) => p.id !== here);
    return pool[Math.floor(Math.random() * pool.length)].id;
  }

  // ---------------------------------------------------------------- saying it
  let headV = null;
  function headTop() {
    if (!headV) headV = game.tmp.clone();
    return game.maya.getHeadTop(headV);
  }
  function burst(kind, n, spread, up) {
    if (!game.fx || !game.maya) return;
    const p = headTop();
    if (kind === 'dust') p.y = Math.max(0.05, p.y - 1.1);
    game.fx.burst(kind, p, { count: n, spread: spread ?? 0.4, up: up ?? 0.5 });
  }

  function say(id, place) {
    const spec = SPEC[id];
    const lines = BARKS[id];
    if (!spec || !lines || !lines.length) return null;
    let k = Math.floor(Math.random() * lines.length);
    if (lines.length > 1 && k === lastLine[id]) k = (k + 1 + Math.floor(Math.random() * (lines.length - 1))) % lines.length;
    lastLine[id] = k;
    let text = tr(lines[k]);
    if (text.includes('{place}')) text = text.replace('{place}', tr(BARK_PLACES[place && BARK_PLACES[place] ? place : suggestPlace()]));

    const m = game.maya;
    const mode = game.mode;
    const fc = spec.face ? call(m, 'faceCanvas', spec.face) : null;
    ui.bark(text, { face: fc, subtle: spec.subtle });
    const hp = headTop();
    hp.y += 0.15;
    ui.placeBark(game.rig.project(hp, game.viewW, game.viewH));
    current = spec;
    count[id]++;
    lastAt[id] = T;
    lastBark = T;
    if (!spec.urgent) nextFree = T + GAP_MIN + Math.random() * GAP_RAND;
    else nextFree = Math.max(nextFree, T + 12);
    log.push({ t: Math.round(T), id, text });

    // the performance: sound, particles, face and emote, a wobble of the car
    const still = () => game.mode === mode && !game.busy && !game.worldWalk;
    if (spec.sound) call(game.audio, 'play', spec.sound);
    if (spec.honk && mode === 'world') call(game.car, 'honk');
    if (spec.carBump && mode === 'world' && !game.worldWalk) call(game.car, 'bump', spec.carBump);
    call(m, 'talk', Math.min(2.4, 0.8 + text.length * 0.03));
    for (const [kind, n, delay, spread, up] of spec.fx || []) {
      if (!delay) burst(kind, n, spread, up);
      else setTimeout(() => { if (still()) burst(kind, n, spread, up); }, delay * 1000);
    }
    if (spec.emoteAt != null) {
      if (spec.face) call(m, 'setFace', spec.face, spec.hold || spec.emoteAt + 0.3);
      if (spec.emote) setTimeout(() => { if (still()) call(m, 'emote', spec.emote); }, spec.emoteAt * 1000);
    } else if (spec.emote) {
      const done = call(m, 'emote', spec.emote);
      if (spec.face && done?.then) done.then(() => { if (still()) call(m, 'setFace', spec.face, spec.hold || 1.6); });
    } else if (spec.face) {
      call(m, 'setFace', spec.face, spec.hold || 2.4);
    }
    return text;
  }

  /** Try to bark now under all the rules. */
  function tryFire(id, place = null) {
    const spec = SPEC[id];
    if (!spec || !enabled) return false;
    if (count[id] >= spec.max) return false;
    if (T - lastAt[id] < spec.cd) return false;
    if (blocked(spec)) return false;
    if (spec.urgent) { if (T - lastBark < URGENT_GAP) return false; }
    else if (spec.event) { if (T - lastBark < EVENT_GAP || ui.barkOpen) return false; }
    else if (T < nextFree || ui.barkOpen) return false;
    return !!say(id, place);
  }

  // ---------------------------------------------------------------- events from the page
  let lastOrder = -1e9, hiddenAt = 0, landscapeAsked = false;
  const onLang = () => queue('lang', 0.2, 3);
  const onOrder = () => { lastOrder = performance.now(); };
  const onVis = () => {
    if (document.hidden) { hiddenAt = performance.now(); return; }
    const away = hiddenAt ? performance.now() - hiddenAt : 0;
    if (away > 45000 && performance.now() - lastOrder > 10 * 60 * 1000) queue('tabBack', 1.2, 10);
  };
  const onResize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    if (!landscapeAsked && T > 5 && w > h && Math.min(w, h) < 520) { landscapeAsked = true; queue('landscape', 1.5, 10); }
  };
  document.addEventListener('mw:lang', onLang);
  document.addEventListener('mw:order', onOrder);
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('resize', onResize);

  // tapping Maya again and again: the first taps keep the game's own little dialogue,
  // from the third tap within 10 s she answers with a quick bubble instead
  const taps = new Float32Array(4).fill(-1e9);
  let tapI = 0;
  const origTap = game.tapMaya;
  game.tapMaya = function tapMaya(...a) {
    taps[tapI] = T;
    tapI = (tapI + 1) % taps.length;
    let recent = 0;
    for (let i = 0; i < taps.length; i++) if (T - taps[i] < 10) recent++;
    if (enabled && recent >= 3) {
      const inCar = game.mode === 'world' && !game.worldWalk;
      if (tryFire(inCar ? 'honkSpam' : 'tapSpam')) return undefined;
    }
    return origTap.apply(this, a);
  };

  // ---------------------------------------------------------------- per-frame state (no allocation)
  let prevMode = game.mode, prevRoom = game.room?.id || null, prevBusy = true, prevArrived = game.arrivedAt;
  let prevSheet = false, sheetT = 0, sheetLongTried = false;
  let prevMuted = !!game.audio?.muted;
  let idleBase = performance.now(), idleStep = 0;
  let driveT = 0, stopT = 0, driveStep = 0, fastT = 0, manualT = 0;
  let prevSpeed = 0, prevH = NaN, wallT = 0;
  let px = 0, pz = 0, havePos = false;
  const spin = new Float32Array(SPIN_N);
  let spinI = 0, spinT = 0;
  const hRing = new Float32Array(5);
  let hRingI = 0, hRingT = 0, hRingN = 0, lastUturn = -1e9;
  const uturns = new Float32Array(3).fill(-1e9);
  let uI = 0;
  const near = new Uint8Array(PLACES.length), nearMin = new Float32Array(PLACES.length), passed = new Uint8Array(PLACES.length);
  const enterCount = Object.create(null);
  const sessionPlaces = new Set();
  const completed = new Set();
  let roomEnterT = 0, stayStations = 0, prevActive = null, roomLongTried = false;
  let sessionStep = 0, drove = !!store('mw-bark-drove');

  function resetSpin() { spin.fill(0); hRingN = 0; prevH = NaN; }

  function onEnterRoom(id) {
    enterCount[id] = (enterCount[id] || 0) + 1;
    stayStations = 0;
    prevActive = null;
    roomEnterT = T;
    roomLongTried = false;
    sessionPlaces.add(id);
    if (enterCount[id] >= 2 || visitedAtStart.has(id)) queue('placeAgain', 0.6, 15, id);
    if (sessionPlaces.size === PLACES.length && allDoneAtStart) queue('allPlaces', 1, 60);
  }

  function update(dt) {
    T += dt;
    if (!game.maya || !game.world) return;
    const sheet = ui.sheetOpen;

    // a bark on screen gives way to dialogue, cinematics and the sheet (and sheet ones leave with it)
    if (ui.barkOpen && current && (ui.dialogOpen || game.busy || isCinema() || sheet !== !!current.sheet)) ui.hideBark();
    if (!enabled) return;

    // ----- mode and room changes
    const mode = game.mode;
    const roomId = mode === 'room' ? game.room?.id || null : null;
    if (roomId !== prevRoom) {
      if (prevRoom && !roomId && stayStations === 0 && T - roomEnterT > 4) queue('leftEmpty', 0.8, 25);
      if (roomId) onEnterRoom(roomId);
      prevRoom = roomId;
      resetSpin();
      havePos = false;
    }
    if (mode !== prevMode) { prevMode = mode; resetSpin(); havePos = false; }
    const busy = game.busy || !!game.worldWalk;

    // ----- arriving at a stop by driving there yourself (the card shows), not after leaving a room
    const arr = game.arrivedAt;
    if (arr !== prevArrived) {
      if (arr && mode === 'world' && !busy && !prevBusy && ui.cardOpen && (visitedAtStart.has(arr) || sessionPlaces.has(arr))) queue('placeAgain', 1.6, 8, arr);
      prevArrived = arr;
    }
    prevBusy = busy;

    // ----- sound switch
    const muted = !!game.audio?.muted;
    if (muted !== prevMuted) { prevMuted = muted; if (T > 1) queue(muted ? 'soundOff' : 'soundOn', 0.15, 3); }

    // ----- price sheet
    if (sheet && !prevSheet) {
      sheetT = 0;
      sheetLongTried = false;
      if (PRICE_SHEET.test(location.hash)) queue('sheetPrice', 2.5, 8);
    }
    prevSheet = sheet;
    if (sheet) {
      sheetT += dt;
      if (sheetT > 45 && !sheetLongTried) sheetLongTried = tryFire('sheetLong');
    }

    // ----- standing still (any input, movement, dialogue or sheet resets it)
    const nowMs = performance.now();
    if (game.lastInput > idleBase) idleBase = game.lastInput;
    let speed = 0;
    if (mode === 'world') {
      speed = game.worldWalk ? 1 : Math.abs(game.world.drive.state.speed);
    } else if (game.walker) {
      const p = game.maya.root.position;
      if (havePos && dt > 0) speed = Math.hypot(p.x - px, p.z - pz) / dt;
      px = p.x; pz = p.z; havePos = true;
    }
    if (speed > 0.3 || busy || sheet || ui.dialogOpen) idleBase = nowMs;
    const idle = (nowMs - idleBase) / 1000;
    if (idle < 1) idleStep = 0;
    else if (idleStep < IDLE_AT.length && idle >= IDLE_AT[idleStep]) {
      const id = idleStep === 0 ? (mode === 'room' ? 'idleRoom' : 'idle') : idleStep === 1 ? 'bored' : 'sleepy';
      if (tryFire(id) || count[id] >= SPEC[id].max) idleStep++;
    }

    // ----- spinning (dizzy): heading change summed over the last 4 s
    let h = NaN;
    if (!busy && !sheet) {
      if (mode === 'world' && !game.world.drive.isAuto) h = game.world.drive.state.heading;
      else if (mode === 'room' && game.walker) h = game.walker.heading;
    }
    spinT += dt;
    if (spinT >= SPIN_BUCKET) { spinT -= SPIN_BUCKET; spinI = (spinI + 1) % SPIN_N; spin[spinI] = 0; }
    if (h === h) {
      if (prevH === prevH) {
        const d = Math.abs(wrap(h - prevH));
        if (d < 1.5) spin[spinI] += d; // bigger single-frame jumps are teleports
      }
      prevH = h;
    } else prevH = NaN;
    let total = 0;
    for (let i = 0; i < SPIN_N; i++) total += spin[i];
    if (total > SPIN_LIMIT && tryFire('dizzy')) spin.fill(0);

    // ----- driving
    if (mode === 'world' && !busy) {
      const drive = game.world.drive;
      const st = drive.state;
      const manual = !drive.isAuto;
      const v = Math.abs(st.speed);
      const stick = game.input?.stick();
      const pushing = !!stick && stick.lengthSq() > 0.09;

      // continuous driving (autopilot included); a real stop of 6 s starts over
      if (v > 0.5) { driveT += dt; stopT = 0; } else if ((stopT += dt) > 6) { driveT = 0; driveStep = 0; }
      if (driveStep < DRIVE_AT.length && driveT >= DRIVE_AT[driveStep]) {
        const id = driveStep === 0 ? 'driveLong' : 'driveVeryLong';
        if (tryFire(id) || count[id] >= SPEC[id].max) driveStep++;
      }
      // first time driving yourself
      if (!drove && manual && pushing && v > 1) {
        manualT += dt;
        if (manualT > 3 && tryFire('firstDrive')) { drove = true; store('mw-bark-drove', '1'); }
      }
      // fast for a while
      if (manual && v > 6) fastT += dt; else fastT = Math.max(0, fastT - dt * 2);
      if (fastT > 8 && tryFire('speedy')) fastT = -20;
      // hard braking / the road ends under the wheels
      if (manual && dt > 0 && prevSpeed > 2.5) {
        const decel = (prevSpeed - v) / dt;
        if (v < 0.05 && pushing && decel > 40) tryFire('bump');
        else if (prevSpeed > 4 && decel > 16) tryFire('hardBrake');
      }
      // turning round again and again (heading 1 s ago vs now)
      if (manual) {
        hRingT += dt;
        if (hRingT >= 0.25) {
          hRingT = 0;
          hRing[hRingI] = st.heading;
          hRingI = (hRingI + 1) % hRing.length;
          if (hRingN < hRing.length) hRingN++;
          else if (Math.abs(wrap(st.heading - hRing[hRingI])) > 2.4 && T - lastUturn > 1.2) {
            lastUturn = T;
            uturns[uI] = T;
            uI = (uI + 1) % uturns.length;
            let n = 0;
            for (let i = 0; i < uturns.length; i++) if (T - uturns[i] < 20) n++;
            if (n >= uturns.length && tryFire('uturns')) uturns.fill(-1e9);
          }
        }
      } else hRingN = 0;
      // driving past a place without stopping (once per place, not while the autopilot drives)
      const places = game.world.places;
      for (let i = 0; i < places.length && i < near.length; i++) {
        const pad = places[i].pad;
        const d = Math.hypot(pad.x - st.position.x, pad.z - st.position.z);
        if (!near[i]) {
          if (manual && d < 2.6 && v > 3) { near[i] = 1; nearMin[i] = v; }
        } else if (d > 5.5) {
          near[i] = 0;
          const id = places[i].id;
          if (manual && nearMin[i] > 1.5 && !passed[i] && !sessionPlaces.has(id) && id !== 'about') {
            passed[i] = 1;
            queue('passBy', 0.2, 4, id);
          }
        } else if (v < nearMin[i]) nearMin[i] = v;
      }
      prevSpeed = v;
    } else {
      prevSpeed = 0;
      fastT = 0;
    }

    // ----- rooms: stations, a long stay, walking into a wall
    if (mode === 'room' && game.room) {
      const act = game.activeStation;
      if (act !== prevActive) {
        if (act) {
          stayStations++;
          if (!completed.has(roomId) && game.room.stations.every((s) => game.visitedStations.has(s.id))) {
            completed.add(roomId);
            queue('roomComplete', 0.6, 120);
          }
        }
        prevActive = act;
      }
      if (!roomLongTried && T - roomEnterT > 180 && !busy) roomLongTried = tryFire('roomLong');
      const stick = !busy && !sheet ? game.input?.stick() : null;
      if (stick && stick.lengthSq() > 0.36 && speed < 0.15) wallT += dt; else wallT = 0;
      if (wallT > 1.3) { tryFire('wall'); wallT = -4; }
    }

    // ----- a long visit
    if (sessionStep === 0 && T > 600) { if (tryFire('longSession')) sessionStep = 1; }
    else if (sessionStep === 1 && T > 1500) { if (tryFire('breakTime')) sessionStep = 2; }

    // ----- waiting barks
    for (let i = 0; i < QN; i++) {
      const id = qId[i];
      if (id === null || T < qAt[i]) continue;
      if (T > qExp[i] || count[id] >= SPEC[id].max || tryFire(id, qPlace[i])) { qId[i] = null; qPlace[i] = null; }
    }
  }

  return {
    update,
    enabled,
    list: ids,
    log,
    /** Debug: say a bark now, skipping cooldowns and gates. place: a place id for {place}. */
    fire(id, place = null) {
      if (!SPEC[id]) return `unknown bark "${id}" - try one of: ${ids.join(', ')}`;
      return say(id, place);
    },
    dispose() {
      document.removeEventListener('mw:lang', onLang);
      document.removeEventListener('mw:order', onOrder);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
      game.tapMaya = origTap;
      ui.hideBark();
    },
  };
}
