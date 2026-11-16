// Story-mode sound: the soundscape (soundscape.js + sound/*) wired into the game. story.js calls
// installSound(game, story, openWorld) once. It replaces the site's time-of-day music (js/game/music.js) in
// story mode only (the normal site keeps its songs), so two songs never play at once.
//
// Each tick (~10 a second, from story.ticks) it reads the game state and hands it to soundscape.update:
//   district   the region Maya (or the car) stands in (sound/places.js districtAt); between regions, and inside
//              rooms, the last one she was in
//   zone       a listening zone (tea square, jetties...) outdoors
//   room       story.inRoom (or the site's own room in game.room): story rooms map by id (places.js ROOM_TYPE);
//              the everyday houses ('g:<district>:<n>', rooms/generic.js) map by their kind / trade
//   mode       'talk' (story.talk.active: the turn-based talk), 'act' (#game.acting), 'scene' (any other
//              scripted moment: story.talking, the letterbox, a cut-scene camera) or null
//   tension    talk only: the steam in their cup (0..5 wisps -> 0..1)
//   speaking   a dialogue line is on screen: music and ambience duck
//   period     game.day.period (the same clock the sky uses), rain: save.weather
//   cue        story.sound.cue(name) from a day script (nightpage, finale, d15letter...), else Day 12's rain song
//              outdoors while it rains (not over a talk or an act); the Back Cover room plays its own song
// Stings: 'lesson' when a talk is won (story.talk.run) or an act lands (its good seal shows), 'stamp' when the
// night page's stamp shows, 'page' when a page turns, 'arrive' when a town intro / banner starts (story.ui's
// townintro sets story.townIntro; without it, a committed change of district).
// The sound button mutes everything (it all plays into audio.output; the soundscape tears down while muted).
// ?sound=0 (or ?music=0) leaves story mode silent of music and ambience. ?snddebug=1 shows a small overlay.
//
//   story.sound.cue(name|null)   mission cue (soundscape CUES); null = back to the place's music
//   story.sound.sting(name, arg) a sting now
//   story.sound.state()          what is heard now: { music, layers, mode, cue, district, zone, room, ... }
//   story.sound.log              state changes [{ t, music, amb, mode, cue, district, zone, room }] (tests)
//   story.sound.cpu()            { updateMs (avg main-thread ms per update), notesPerSec, eventsPerSec, beds, layers }
//
// For whoever builds the NPC gatherings / events (Nov 2026):
//   story.sound.gather(id, { kind, x, z, r })  a gathering at (x, z), radius r (m). While Maya stands inside r (on
//        foot, outdoors) its song plays ('event:<kind>' in songs-more.js) with its ambience ('ev:<kind>' in
//        places.js: claps, the ball, cups...; louder near the centre); she leaves it at r * 1.4. kinds with a song:
//        festival lanterns chinlone kidsplay countten rainwait teachat haggle kiteday party storytime.
//   story.sound.ungather(id)                   the gathering is over (the place's own music returns)
//   story.sound.cue('event:chinlone')          or name the gathering song directly as a cue (null: back)
//   story.sound.cue('reflect' | 'sorry' | 'wonder' | 'together' | 'triumph')  the new story cues
//   story.sound.emit(name, { x, z, v })        one positional one-shot at a world point (sound/fx.js FX names:
//        ballKick, clapBurst, giggle, yay, coinTink, cupSaucer, hen, cat ...): panned and muffled by distance,
//        silent past 22 m, refused when the events budget is full (never more than 5 sounding, 18 a minute).
//   story.sound.doorSound(roomId, entering)    the door sound for a room ('shopBell' | 'doorOpen' | 'doorClose' | 'screenDoor')
// Footsteps follow the ground: game.stepSound ('stepStone', 'stepWood', 'stepWet' in the rain...) is set here and
// main.js plays it for each of Maya's steps. While she drives (moving) the music turns to a 'drive:*' song.
import { createSoundscape } from './soundscape.js';
import { ROOM_TYPE, AMBIENCE, SURFACE_OF, ZONE_SURFACE, ROOM_FLOOR, districtAt, zoneAt } from './sound/places.js';
import { getBank, INSTRUMENTS, LOOP_NAMES, UNUSED_LOOPS, baseOf } from './sound/bank.js';

const STEP = 0.1; // seconds between soundscape updates (it schedules 0.4 s ahead)
const POLL = 0.2; // seconds between DOM checks (stings, steam)
/** Everyday houses (rooms/generic.js kinds) -> room type. */
const GENERIC_KIND = { home: 'home', shop: 'post', workshop: 'workshop', tea: 'teashop', baker: 'bakery', fisher: 'fisherhut', gardener: 'greenhouse', student: 'study', elder: 'elderhome', blank: 'library' };
/** Room types whose door has a shop bell; houses with a bamboo screen door. */
const SHOP_DOOR = ['teashop', 'bakery', 'post', 'noodle'], SCREEN_DOOR = ['fisherhut', 'elderhome'];
const GENERIC_TRADE = { weaver: 'loom' };
/** The site's own rooms (js/game/interiors) when a story scene walks into one. */
const SITE_ROOMS = { scripts: 'home', contact: 'post' };
const DISTRICT_DWELL = 2.5; // s in a new district before the fallback arrival sting
const EMIT_R = 22; // m: story.sound.emit is silent beyond this
const STEP_NAME = { Stone: 'stepStone', Dirt: 'stepDirt', Grass: 'stepGrass', Wood: 'stepWood', Tile: 'stepTile', Paper: 'stepPaper', Rug: 'stepRug' };

export function installSound(game, story, ow) {
  if (story.sound) return story.sound;
  const params = new URLSearchParams(location.search);
  // the site's time-of-day music: off in story mode (main.js calls game.music?.update / setPeriod)
  try { game.music?.dispose?.(); } catch { /* already gone */ }
  game.music = null;
  if (params.get('sound') === '0' || params.get('music') === '0') { story.sound = { cue() {}, sting() {}, state: () => null, log: [], cpu: () => null }; return story.sound; }

  for (const [id, type] of Object.entries(SITE_ROOMS)) if (!ROOM_TYPE[id]) ROOM_TYPE[id] = type;
  const scape = createSoundscape(game.audio);
  let bankReady = false; const WARM_MAX = 15; // (s) see tick
  const save = story.save;
  const gameEl = document.getElementById('game') || document.body;
  const stamps = document.getElementsByClassName('story-stamp');
  const steamOn = gameEl.getElementsByClassName('tk-mug');
  let acc = 0, poll = 0, cue = null, district = null, lastRoom = null, tension = 0;
  let introOn = false, stampOn = false, pageOn = false, actWrap = null, lastLesson = -1e9;
  let candDist = null, candT = 0, settled = null;
  let clock = 0, upMs = 0, upN = 0, upMax = 0, n0 = null;
  const log = [];
  let lastKey = '';

  function roomOf() {
    const id = story.inRoom || (game.mode === 'room' ? game.room?.id || null : null);
    if (!id) return null;
    if (!ROOM_TYPE[id] && String(id).startsWith('g:') && story.room?.kind) { // (built rooms carry kind / trade)
      const r = story.room;
      ROOM_TYPE[id] = (r.trade && GENERIC_TRADE[r.trade]) || GENERIC_KIND[r.kind] || 'home';
    }
    return id;
  }
  function modeOf() {
    const cl = gameEl.classList;
    if (story.talk?.active || cl.contains('rc-talk')) return 'talk';
    if (cl.contains('acting')) return 'act';
    if (story.talking || game.rig?.cinematic || cl.contains('cinema') || story.townIntro) return 'scene';
    return null;
  }
  function sting(name, arg) {
    if (!bankReady) { log.push({ t: +clock.toFixed(1), sting: name, arg: arg || undefined, played: false, warming: true }); return null; }
    const d = scape.sting(name, arg);
    log.push({ t: +clock.toFixed(1), sting: name, arg: arg || undefined, played: !!d });
    return d;
  }

  // a talk that lands: the lesson sting (the talk's own end card follows)
  const talk = story.talk;
  if (talk && typeof talk.run === 'function' && !talk.run.__sound) {
    const run0 = talk.run;
    talk.run = async (...a) => {
      const r = await run0(...a);
      if (r?.won) { lastLesson = clock; sting('lesson'); }
      return r;
    };
    talk.run.__sound = true;
  }

  function checkDom(now) {
    // an act's good seal ('.ak-seal.good' from acts/kit.js, '.act-score.good' from acts/trace.js): once per act
    if (gameEl.classList.contains('acting')) {
      const wrap = gameEl.querySelector('.act-wrap');
      if (wrap && wrap !== actWrap && wrap.querySelector('.ak-seal.good, .act-score.good')) {
        actWrap = wrap;
        if (now - lastLesson > 6) { lastLesson = now; sting('lesson'); }
      }
    }
    const st = stamps.length > 0;
    if (st && !stampOn) sting('stamp');
    stampOn = st;
    const pg = !!document.getElementById('story-pageturn');
    if (pg && !pageOn) sting('page');
    pageOn = pg;
    // the steam in their cup -> how tense the talk music is
    if (steamOn.length) tension = Math.min(1, steamOn[0].querySelectorAll('.w.on').length / 4);
  }

  function arrival(now, outdoors, d) {
    if (story.ui?.intro) { // extras-ui.js's town intro: sting as the fly-over / banner starts
      const on = !!story.townIntro;
      if (on && !introOn) sting('arrive', story.ui.intro.current || d);
      introOn = on;
      return;
    }
    if (!outdoors || !d) return;
    if (settled == null) { settled = d; return; }
    if (d === settled) { candDist = null; return; }
    if (d !== candDist) { candDist = d; candT = now; return; }
    if (now - candT >= DISTRICT_DWELL) { settled = d; candDist = null; sting('arrive', d); }
  }

  // ---- crowded street: on foot outdoors with many townsfolk close by, the music turns to 'area:crowd'
  // (owner: the old crowd-voice beds sounded scary; they are gone, the music carries the bustle instead).
  // Hysteresis so it does not flip while people walk in and out: on at CROWD_ON people held 3 s, off at
  // CROWD_OFF or fewer held 6 s (or at once when she drives off / goes inside).
  const CROWD_R = 14, CROWD_ON = 5, CROWD_OFF = 2;
  let crowdOn = false, crowdT = 0, crowdN = 0, crowdLast = -1;
  function crowdStep(now, onFoot) {
    if (!onFoot) { crowdOn = false; crowdT = 0; return; }
    if (now - crowdLast < 0.5) return; // count twice a second
    crowdLast = now;
    const mp = game.maya.root.position;
    let n = 0;
    for (const e of story.people?.values?.() || []) {
      const r = e?.p?.root;
      if (!r?.parent || !r.visible || e.hidden || e.indoor) continue;
      const dx = r.position.x - mp.x, dz = r.position.z - mp.z;
      if (dx * dx + dz * dz < CROWD_R * CROWD_R) n++;
    }
    if (story.npcEvent?.active && story.npcEvent.quiet) n = 0; // (a quiet town gathering: a kitten, a baby, a story: no crowd song)
    crowdN = n;
    const want = crowdOn ? n > CROWD_OFF : n >= CROWD_ON;
    if (want === crowdOn) { crowdT = 0; return; }
    crowdT += 0.5;
    if (crowdT >= (crowdOn ? 6 : 3)) { crowdOn = want; crowdT = 0; }
  }

  // ---- driving: the car moving (> 2 m/s held 2 s) turns the music to a drive song; stopped 4 s: back
  let driving = false, driveT = 0, wasRain = !!save.weather;
  function driveStep(dt, inCar) {
    const v = inCar ? Math.abs(game.world?.drive?.state?.speed || 0) : 0;
    const want = driving ? v > 0.5 : v > 2;
    if (want === driving) { driveT = 0; return; }
    driveT += dt;
    if (!inCar || driveT >= (driving ? 4 : 2)) { driving = want; driveT = 0; }
  }
  // ---- gatherings (story.sound.gather): the one Maya stands in, with hysteresis (in at r, out at r * 1.4)
  const gathers = new Map(), gatherOut = { kind: '', level: 1 };
  let inGather = null;
  function gatherStep(onFoot) {
    if (!onFoot || !gathers.size) { inGather = null; return null; }
    const mp = game.maya.root.position;
    let best = null, bd = 1e9;
    for (const [id, G] of gathers) {
      const d = Math.hypot(G.x - mp.x, G.z - mp.z);
      if (d < (id === inGather ? G.r * 1.4 : G.r) && d / G.r < bd) { best = id; bd = d / G.r; }
    }
    inGather = best;
    if (best == null) return null;
    gatherOut.kind = gathers.get(best).kind; gatherOut.level = Math.max(0.4, 1 - 0.45 * bd);
    return gatherOut;
  }

  function tick(dt) {
    clock += dt;
    acc += dt;
    poll += dt;
    if (poll >= POLL) { poll = 0; try { checkDom(clock); } catch { /* DOM changing */ } }
    if (acc < STEP) return;
    // (the first seconds: silent until the warm-up worker has rendered the bank, so nothing is synthesized on this
    // thread mid-game; WARM_MAX caps the wait, after which a missing piece is rendered on the spot as before)
    if ((held.length || (worker && !warmFlag)) && game.audio?.context) { putPiece(null); warmFlag = !!worker; }
    if (!bankReady) { if (clock < WARM_MAX) { acc = 0; return; } bankReady = true; }
    const t0 = performance.now();
    const room = roomOf();
    lastRoom = room;
    let zone = null;
    if (!room && game.mode === 'world') {
      const p = story.foot?.active || game.worldWalk ? game.maya.root.position : game.car.root.position;
      district = districtAt(p.x, p.z) || district;
      zone = zoneAt(p.x, p.z);
    }
    const mode = modeOf();
    const rain = !!save.weather;
    let c = cue;
    if (!c && save.day === 12 && rain && !room && (mode === null || mode === 'scene')) c = 'd12rain';
    const onFoot = !!(story.foot?.active || game.worldWalk);
    crowdStep(clock, !room && game.mode === 'world' && onFoot);
    driveStep(acc, !room && game.mode === 'world' && !onFoot && mode !== 'scene');
    const g = gatherStep(!room && game.mode === 'world' && onFoot);
    // footsteps follow the ground (main.js plays game.stepSound for each step); wet outdoors in the rain
    const surf = room ? ROOM_FLOOR[ROOM_TYPE[room]] || 'Rug' : (zone && ZONE_SURFACE[zone]) || SURFACE_OF[district] || 'Stone';
    game.stepSound = !room && rain && surf !== 'Paper' ? 'stepWet' : STEP_NAME[surf] || 'step';
    if (rain && !wasRain) sting('rain');
    wasRain = rain;
    const s = {
      district, zone, room, mode, cue: c, tension: mode === 'talk' ? tension : 0,
      speaking: !!game.ui?.dialogOpen, period: game.day?.period, hour: game.day?.hour, rain, crowd: crowdOn,
      driving, gather: g, day: save.day | 0,
    };
    arrival(clock, !room && game.mode === 'world', district);
    scape.update(acc, s);
    acc = 0;
    const took = performance.now() - t0;
    upMs += took; upN++; if (took > upMax) upMax = took;
    const R = scape.state;
    if (R) {
      const key = [R.song, Object.keys(R.amb).sort().join('+'), mode, R.cue, s.speaking ? 'duck' : ''].join('|');
      if (key !== lastKey) {
        lastKey = key;
        log.push({ t: +clock.toFixed(1), music: R.music, song: R.song, amb: Object.keys(R.amb), mode, cue: R.cue, district: R.district, zone: R.zone, room: R.room, period: R.period, speaking: s.speaking, rain });
        if (log.length > 400) log.splice(0, 100);
      }
    }
    if (dbg) drawDebug(s, R);
  }
  (story.ticks = story.ticks || []).push(tick);
  // the saved rain resumes through the soundscape (api.js's own hiss steps aside once story.sound exists)
  if (save.weather) setTimeout(() => { try { story.weather(save.weather); } catch { /* no weather api */ } }, 0);

  // ---- warm the sound bank ahead of time. The bank synthesizes on first use, on the main thread: the crowd
  // loops and the pad cost 40-110 ms each on a desktop (measured, node), several times that on a phone, which
  // would land as a hitch the moment she walks into the market or a song starts. So it is all built ahead, one
  // piece per idle slot (quickly while the loading screen still shows): the loops of the town she is in first,
  // then the other loops, then every instrument. ~0.9 s of work in all on a desktop, ~11 MB of buffers.
  const HEAVY_LOOPS = ['fire', 'trickle', 'cicada', 'crickets', 'loom', 'brown', 'pink'];
  // then every instrument over its whole range (one instrument per slot; the pad, ~95 ms, in two halves)
  const NOTE_ITEMS = [['pad', 30, 64], ['pad', 66, 100], ...INSTRUMENTS.filter((i) => i !== 'pad').map((i) => [i, 30, 100])];
  let warmQ = null, warmed = 0, worker = null, workerGot = 0, warmFlag = false;
  const idle = (fn, ms) => (document.body.classList.contains('playing') && typeof requestIdleCallback === 'function'
    ? setTimeout(() => requestIdleCallback(fn, { timeout: 1500 }), ms) : setTimeout(fn, ms));
  function warmOrder() {
    const here = new Set();
    for (const k of [`${district}:day`, `${district}:night`]) for (const b of AMBIENCE[k]?.beds || []) here.add(b.loop);
    return [...HEAVY_LOOPS.filter((l) => here.has(l)).map((l) => ['loop', l]), ...HEAVY_LOOPS.filter((l) => !here.has(l)).map((l) => ['loop', l]), ...NOTE_ITEMS.map((n) => ['note', ...n])];
  }
  // (fallback, no worker: one piece per idle slot on this thread, the big loops one at a time)
  function warmStep() {
    const a = game.audio;
    if (story.sound?.scape !== scape) return; // disposed
    if (!a?.context || a.state !== 'running' || a.muted || gameEl.classList.contains('acting')) return idle(warmStep, 1500);
    if (!warmQ) warmQ = warmOrder();
    const it = warmQ.shift();
    if (!it) return;
    const t0 = performance.now();
    try { const bank = getBank(a.context); if (it[0] === 'loop') bank.loop(it[1]); else for (let m = it[2]; m <= it[3]; m += 2) bank.note(it[1], m); } catch { /* bank changed */ }
    warmed += performance.now() - t0;
    idle(warmStep, document.body.classList.contains('playing') ? 450 : 20);
  }
  // The warm-up runs in a worker (sound/bank-worker.js): the synthesis (~1 s on a desktop, several on a phone)
  // never touches the main thread; each finished piece is copied into the live bank (bank.put, < 1 ms).
  const held = []; // pieces the worker sent before the AudioContext existed (copied in once it does)
  function putPiece(m) {
    const ctx = game.audio?.context;
    if (!ctx) { held.push(m); return; }
    const t0 = performance.now();
    try { const bank = getBank(ctx); bank.warming = !!worker; while (held.length) { const h = held.shift(); bank.put(h.kind, h.a, h.b, h.d); } if (m) bank.put(m.kind, m.a, m.b, m.d); workerGot++; } catch { /* context changed */ }
    warmed += performance.now() - t0;
  }
  function warmWorker() {
    if (story.sound && story.sound.scape !== scape) return;
    const pieces = [];
    for (const it of warmOrder()) {
      if (it[0] === 'loop') { pieces.push(['loop', it[1]]); continue; }
      const seen = new Set();
      for (let m = it[2]; m <= it[3]; m++) { const b = baseOf(it[1], m); if (b != null && !seen.has(b)) { seen.add(b); pieces.push(['note', it[1], b]); } }
    }
    for (const l of LOOP_NAMES) if (!UNUSED_LOOPS.includes(l) && !pieces.some((p) => p[0] === 'loop' && p[1] === l)) pieces.push(['loop', l]);
    try {
      worker = new Worker(new URL('./sound/bank-worker.js', import.meta.url), { type: 'module' });
    } catch { worker = null; bankReady = true; return idle(warmStep, 600); }
    pieces.sort((a, b) => (b[1] === 'white') - (a[1] === 'white')); // the one-shots' noise first (tiny)
    warmQ = pieces;
    worker.onmessage = (ev) => {
      const m = ev.data || {};
      if (m.done) { worker.terminate(); worker = null; warmQ = []; bankReady = true; const c = game.audio?.context; if (c) getBank(c).warming = false; return; }
      if (warmQ?.length) warmQ.shift();
      if (!m.d || (story.sound && story.sound.scape !== scape)) return;
      putPiece(m);
    };
    worker.onerror = () => { try { worker?.terminate(); } catch { /* gone */ } worker = null; warmQ = null; bankReady = true; const c = game.audio?.context; if (c) getBank(c).warming = false; idle(warmStep, 600); };
    worker.postMessage({ pieces });
  }
  if (typeof Worker === 'function') setTimeout(warmWorker, 0); else { bankReady = true; idle(warmStep, 600); }

  // ---- debug overlay (?snddebug=1): what is heard now, for tests
  const dbg = params.get('snddebug') === '1' ? document.createElement('pre') : null;
  if (dbg) {
    dbg.id = 'snd-debug';
    dbg.style.cssText = 'position:absolute;left:8px;top:120px;z-index:60;margin:0;padding:6px 8px;max-width:70vw;font:10.5px/1.35 ui-monospace,Consolas,monospace;'
      + 'background:rgba(42,33,24,.78);color:#F6F0E2;border-radius:8px;pointer-events:none;white-space:pre-wrap';
    gameEl.appendChild(dbg);
  }
  let dbgT = 0;
  function drawDebug(s, R) {
    if (clock - dbgT < 0.5) return;
    dbgT = clock;
    const st = scape.stats();
    dbg.textContent = `sound ${game.audio?.muted ? 'MUTED' : game.audio?.state}\nmusic ${R?.music || '-'} (${R?.period || '-'})\n`
      + `mode ${s.mode || '-'}  cue ${R?.cue || '-'}  ${s.speaking ? 'duck' : ''}\n${s.district || '-'} / ${s.zone || '-'} / ${s.room ? s.room + ' (' + (ROOM_TYPE[s.room] || 'home') + ')' : 'outdoors'}\n`
      + `amb ${R ? Object.entries(R.amb).map(([k, v]) => k + ' ' + v.level.toFixed(2) + (v.muffle ? '~' : '')).join(', ') : '-'}\n`
      + (st ? `beds ${st.beds}  notes ${st.notes}  events ${st.events}` : '');
  }

  story.sound = {
    scape,
    log,
    /** A mission cue from a day script (null: back to the place's own music). */
    cue(name = null) { cue = name || null; log.push({ t: +clock.toFixed(1), cueSet: cue }); },
    get cueName() { return cue; },
    sting,
    gather(id, o = {}) { if (id != null && o.kind) gathers.set(id, { kind: o.kind, x: +o.x || 0, z: +o.z || 0, r: Math.max(2, +o.r || 10) }); },
    ungather(id) { gathers.delete(id); if (inGather === id) inGather = null; },
    get gathers() { return [...gathers.keys()]; },
    emit(name, { x = 0, z = 0, v = 1 } = {}) {
      const cam = game.camera, mp = game.maya?.root?.position;
      if (!cam || !mp) return 0;
      const dx = x - mp.x, dz = z - mp.z, d = Math.sqrt(dx * dx + dz * dz);
      if (d > EMIT_R) return 0;
      const e = cam.matrixWorld.elements; // the camera's right axis (x, z)
      const rl = Math.hypot(e[0], e[2]) || 1;
      return scape.emit(name, { pan: ((dx * e[0] + dz * e[2]) / rl) / 10, far: d / EMIT_R, v: v * (1 - 0.6 * d / EMIT_R) });
    },
    doorSound(id, entering = true) {
      const type = ROOM_TYPE[id] || (String(id || '').startsWith('g:') ? null : 'home');
      if (type && SHOP_DOOR.includes(type)) return 'shopBell';
      if (type && SCREEN_DOOR.includes(type)) return 'screenDoor';
      return entering ? 'doorOpen' : 'doorClose';
    },
    state() { const R = scape.state; return R ? { crowd: crowdOn, crowdN, driving, gather: inGather, song: R.song, music: R.music, layers: scape.stats()?.layers, amb: R.amb, mode: modeOf(), cue: R.cue, district: R.district, zone: R.zone, room: R.room, period: R.period } : null; },
    /** Main-thread cost and the audio work rate since the last call. */
    cpu() {
      const st = scape.stats();
      const now = performance.now();
      const out = { updateMs: upN ? +(upMs / upN).toFixed(3) : 0, maxMs: +upMax.toFixed(2), updates: upN, warmMs: Math.round(warmed), warmLeft: warmQ ? warmQ.length : -1, warmWorker: worker ? 'running' : workerGot ? `done ${workerGot}` : 'off' };
      if (st) {
        if (n0) { const sec = (now - n0.t) / 1000; out.notesPerSec = +((st.notes - n0.notes) / sec).toFixed(2); out.eventsPerSec = +((st.events - n0.events) / sec).toFixed(2); out.sec = +sec.toFixed(1); }
        Object.assign(out, { beds: st.beds, layers: st.layers, music: st.music, fading: st.fading, bankKB: st.bankKB });
        n0 = { t: now, notes: st.notes, events: st.events };
      }
      upMs = 0; upN = 0; upMax = 0;
      return out;
    },
    dispose() { try { worker?.terminate(); } catch { /* gone */ } worker = null; const i = story.ticks.indexOf(tick); if (i >= 0) story.ticks.splice(i, 1); scape.dispose(); dbg?.remove(); story.sound = null; },
  };
  return story.sound;
}
