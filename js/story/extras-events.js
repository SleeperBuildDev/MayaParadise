// Random town gatherings (owner: "random events of npc, like something gathering the npc"): now and then the
// townsfolk near Maya gather round something for a minute (a chinlone circle, a mango basket spilt on the pavement,
// a kitten stuck on a crate stack, a kite contest, the football on a tea shop's TV, a new baby, a bicycle puncture
// mended on the kerb, a snack cart's queue, a lantern story circle at night, a haggle at a stall, a kids' race, the
// newspaper read aloud, a puppet show) and then go back to their day. Each one carries a small life lesson from the
// book's chapters, in short speech bubbles (Burmese first, English twin: events/lines.js). Never a pointer, never a
// direction, never on a road, never during a talk / an act / a scene / an intro / a room / the map / a page turn.
//
// story.js installs it once (after the chatter): installEvents(game, story, openWorld).
//
//   story.npcEvent = { active, id, x, z, quiet }        the shared state other modules read (chatter, Ko Hein Htet,
//                                                       the sound) while one runs
//   window.__ev = window.__events = story.npcEvent.debug:
//     list()            every event and why it could not start here and now ('' = it could)
//     trigger(id, o)    start one now (o: { x, z } a centre; o.anyTime: ignore day / period / weather / cool-downs)
//     force(id, o)      the same as trigger
//     state()           what runs now (phase, participants, props, draw calls)
//     why()             the gate now, and the last plan's failure reasons
//     end()             wrap the running one up (disperse)
//     stats()           CPU per frame (ms), events played, borrowed vs spawned
//
// HOW (all spread over frames: nothing heavy in any one frame)
//   scheduler   once a second: Hein Htet's gates plus no cargo / carrying / overlay, not Day 1, 25 s after any of
//               those, 60 s after a town arrival. The first after 150 s of eligible time outdoors, then a gap of
//               240-480 s, then a 35 % roll a check. Each event once a story day, 4 a story day at most, 40 min of
//               play between two of the same, never the same twice running.
//   budget      (owner: "alive and complete": a gathering that starts plays to its end) an event may start when the
//               frame's draw calls / triangles just before it (the median of the last 3 s) plus its own expected cost
//               (its prop rig + the guests it may bring, measured off a real person) fit the tier's ALLOW. Once on,
//               draw calls never cut it short: only a real, sustained slowdown does (PERF: the median frame time
//               over 4 s well above the median of the 5 s before it started, for 3 s on end).
//   talks       a talk with anyone (a participant, or someone else) holds the event still: its script, its props, its
//               guests and its wrap-up clock, so nothing folds away while Maya talks.
//   site        a centre 9-18 m from Maya in her own district (mostly in view), the event's layout round it (stages
//               face east or west: the camera sees faces, not backs); every spot off every road and path edge
//               (>= 1.8 m), not solid, a clear straight line to the centre, >= 3.6 m from doors and outside a 2 x 4 m
//               box in front of each, >= 2.6 m from job spots, 6 m from desks, 10 m from the hint target, 8 m from
//               story cast, 4 m from Maya and the car.
//   people      roaming townsfolk first (story.roam.borrow: roam's own walk, collision and dodging; zero new draw
//               calls), then guests (createPersonSteps, a step a frame) who walk in from off screen: at most 2
//               (1 on the low tier). A carrier of a big prop (the cart, the TV trolley, the bicycle, the basket, the
//               booth, the baby) is always a guest walking in with it: nothing pops up in view.
//   props       events/props.js: one instanced box mesh + outline (2 calls) for every prop of the event; fixed
//               props arrive carried or are placed off screen; their footprint is in the walk space while they stand.
//   choreography the event's script (events/catalog.js), a generator: gather, beats, a climax, disperse.
//   joining     Maya taps a participant: she walks up and hears their line (the dialogue box), then answers in her
//               own bubble with an emote and a little burst; tapping the prop does the event's own action. Nothing
//               goes in the bag (GAME-PLAN 10); the flag ev.<id>.joined unlocks a few later chatter lines.
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { createPersonSteps } from './people.js';
import { castById } from './cast.js';
import { PEOPLE as REGION_PEOPLE, REGION_FILES, DESKS, ITEMS, regionAt, bookDist } from './world/region.js';
import { DOORS } from './doors.js';
import { folkName, folkSlot, releaseFolkSlot, hashName } from './folknames.js';
import { EVENTS } from './events/catalog.js';
import { LINES, MENTIONS } from './events/lines.js';
import { createPropRig } from './events/props.js';
import { createEventSfx } from './events/sfx.js';

const T = { first: 150, gap: [240, 480], retry: [30, 70], roll: 0.35, perDay: 4, cool: 40 * 60, afterGate: 25, afterArrive: 60 };
// the most a frame may draw with a gathering in it, per quality tier (boot.js pickTier: low = weak phones, 30 fps, no
// sun shadow; mid = most phones; high = flagships and computers). The towns alone draw ~56-68 calls and 105-150k
// triangles; one event adds its rig (2-4 calls) and up to two guests.
const ALLOW = { low: { calls: 76, tris: 160000 }, mid: { calls: 86, tris: 180000 }, high: { calls: 96, tris: 200000 } };
// frame time: base = s of frames before the start that set the bar; win = s of frames judged while it runs; hold = s
// the slowdown must last; slow = the window's median above base * ratio AND base + plus ms AND the tier's frame * 1.1;
// warm = s of the event's own clock not judged (its people are being made); slowStart: no start while the median of
// the last win s is above slowStart x the tier's frame (the game is already struggling)
const PERF = { base: 5, win: 4, hold: 3, ratio: 1.3, plus: 5, warm: 3, slowStart: 2 };
const SITE = { near: 6, far: 16, perFrame: 4, tries: 90 }; // (a portrait phone sees ~8-10 m up the street: in view means near)
const KEEP = { road: 1.8, propRoad: 2.4, door: 3.6, spot: 2.6, desk: 6, hint: 10, cast: 8, maya: 4, car: 4, person: 0.9, pt: 1.4 };
const RECRUIT_R = 18, FAR = 45, GUESTS = 2, BODY = 0.3;
// the hard limits (every event always ends): run = the event's own time at most (ev.cap overrides), then the wrap-up
// (everyone back to their day): soft = s after which the script and its extras are cut and whoever is left walks off,
// hard = s after which the event is over for good (state, props, music, flags); a guest still in view then walks on
// out of sight by themselves and is only taken away off screen. retry = s between two searches for a way out of sight.
// talkMax = s of talks an event may stand still through on top of its run (the wall clock's limit).
const CAP = { run: 105, joinMore: 30, soft: 10, hard: 18, retry: 2.5, strayFar: 40, talkMax: 150 };
const BUSY = /\b(cinema|talking|choosing|acting|ti-flying|ti-naming|reading)\b/;
const BUSY_TALK = /\b(acting|ti-flying|ti-naming|reading)\b/; // (in a talk: its letterbox, dialogue and choices are the talk itself)
const DOM_BLOCK = '.act-wrap, .story-stamp, .story-letter, .rc-slip, .rc-lift, #story-panel, #story-choices, .story-got, #story-map, #story-fade.on';
const CLOTHS = ['white', 'cream', 'maroon', 'rose', 'mustard', 'sky', 'navy', 'teal', 'olive', 'tan', 'plum', 'coral', 'leaf'];
// the gesture names the catalog uses (anim library clips, js/story/anim) -> people.js's own emote when it is absent
const FALLBACK = { cheer: 'cheer', cheerReact: 'cheer', applaud: 'nod', clap: 'nod', point: 'point', pointAt: 'point', shrug: 'shrug', nod: 'nod', wave: 'wave', waveHi: 'wave', waveBye: 'wave', slump: 'slump', sad: 'slump', fists: 'fists', thinkChin: 'think', think: 'think', surprised: 'fists', startle: 'fists', sorry: 'bow', thanks: 'nod', greet: 'nod', beckon: 'wave', laugh: 'nod', giggle: 'nod', shake: 'shrug', proud: 'cheer', explain: null, gatherLook: null, lookUp: null, listen: null, pickUp: null, handOver: 'point', showItem: null };
// the gathering song each event plays while Maya stands near it (the quiet ones keep the town's own music)
const SONG_KIND = { chinlone: 'chinlone', mango: 'haggle', kite: 'kiteday', football: 'party', snack: 'teachat', lantern: 'lanterns', haggle: 'haggle', race: 'kidsplay', paper: 'storytime', puppet: 'kidsplay' };
const REACT = { cheerReact: 'cheer', cheer: 'cheer', applaud: 'applaud', startle: 'startle', lookUp: 'lookUp', gather: 'gather', gatherLook: 'gather', pointAt: 'pointAt', shelter: 'shelter' };
const FACE_OF = { cheer: 'happy', cheerReact: 'happy', applaud: 'happy', clap: 'happy', slump: 'sad', sad: 'sad', surprised: 'surprised', startle: 'surprised', thinkChin: 'think', think: 'think', shrug: 'think', laugh: 'happy', giggle: 'shy', sorry: 'worried', proud: 'happy' };

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const seeded = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

export function installEvents(game, story, ow) {
  if (story.npcEvent?.debug) return story.npcEvent;
  const save = story.save;
  const space = ow?.space;
  if (!space) return null;
  const low = game.tier === 'low';
  const gameEl = document.getElementById('game') || document.body;
  const scene = game.world.scene;
  const W = () => game.viewW || window.innerWidth, H = () => game.viewH || window.innerHeight;
  const AMBIENT = new Set(REGION_PEOPLE.map((p) => p.id));
  const v = new THREE.Vector3(), w = new THREE.Vector3(), camRight = new THREE.Vector3(), camPos = new THREE.Vector3(), ndc = new THREE.Vector3();
  const rig = createPropRig(scene, { low });
  const sfx = createEventSfx(game);
  const dayOwns = (id) => { try { return typeof story.day?.owns === 'function' && !!story.day.owns(id); } catch { return false; } };
  const callsNow = () => game.renderer?.info?.render?.calls || 0;
  const trisNow = () => game.renderer?.info?.render?.triangles || 0;
  const A = () => (story.anim && story.anim.enabled !== false ? story.anim : null);
  // ---- the frame's load: draw calls / triangles (a sample every 0.1 s outdoors while no event runs: the last 3 s) and
  // frame times (every frame: the last ~10 s), in preallocated rings; medians only on demand (a few times a second)
  const CR = { calls: new Float32Array(30), tris: new Float32Array(30), n: 0, i: 0, t: 0 };
  const FR = { d: new Float32Array(600), n: 0, i: 0, last: 0 };
  const scratch = new Float32Array(600);
  const sortedMid = (k) => { if (!k) return 0; const a = scratch.subarray(0, k); a.sort(); return a[k >> 1]; };
  function ringMed(buf, n) { for (let k = 0; k < n; k++) scratch[k] = buf[k]; return sortedMid(n); }
  /** the median frame time (ms) of the last sec seconds */
  function frameMed(sec) {
    const L = FR.d.length;
    let sum = 0, k = 0;
    for (let j = 0; j < FR.n && sum < sec * 1000; j++) { const x = FR.d[(FR.i - 1 - j + L) % L]; scratch[k++] = x; sum += x; }
    return sortedMid(k);
  }
  const allow = () => ALLOW[game.tier] || ALLOW.mid;
  const frameMs = () => 1000 / (low ? 30 : 60); // (config.js TIERS: the low tier draws at 30 fps)
  // one person's own draw calls (+ their sun-shadow casts on mid / high) and triangles, measured off a real one
  const PC = { calls: 4, tris: 3000, measured: false, tried: false }; // (until measured: a guest is ~4 calls, ~3k triangles)
  function measurePerson(p) {
    if (PC.measured || !p?.root) return;
    let n = 0, sh = 0, tr = 0;
    p.root.traverse((o) => {
      if (!o.isMesh || !o.visible) return;
      n++; if (o.castShadow) sh++;
      const g = o.geometry;
      if (g) tr += ((g.index ? g.index.count : g.attributes?.position?.count || 0) / 3) * (o.isInstancedMesh ? o.count : 1);
    });
    if (!n) return;
    PC.calls = n + (game.worldShadow ? sh : 0); PC.tris = Math.round(tr); PC.measured = true;
  }
  /** what an event adds to the frame: its prop rig (catalog `calls`, `tris`), the guests it may bring, a little for
   *  the borrowed townsfolk who walk into view */
  function costOf(ev) {
    if (!PC.measured && !PC.tried) { PC.tried = true; for (const e of story.people.values()) if (e?.p?.root?.parent) { measurePerson(e.p); break; } } // (else the first guest made)
    let g = 0;
    for (const sl of ev.slots) if (sl.guest !== 'no') g++;
    g = Math.min(g, low ? 1 : GUESTS);
    return { calls: (ev.calls ?? 2) + g * PC.calls + 2, tris: (ev.tris ?? 3000) + g * PC.tris, guests: g };
  }
  /** the frame just before: the medians of the last 3 s (the current frame until there are enough samples) */
  function baseNow() {
    const few = CR.n < 5;
    return { calls: few ? callsNow() : ringMed(CR.calls, CR.n), tris: few ? trisNow() : ringMed(CR.tris, CR.n), ms: frameMed(PERF.base) };
  }
  function budgetWhy(ev, b = baseNow()) {
    const al = allow(), k = costOf(ev);
    return b.calls + k.calls > al.calls || b.tris + k.tris > al.tris ? 'budget' : '';
  }
  let fT0 = 0;
  const seg = { pre: 0, script: 0, frame: 0, rig: 0 };
  let planAt = '';
  const overMs = () => performance.now() - fT0 > 1.2; // (planning work a frame: never a hitch)
  const stats = { ms: 0, msMax: 0, planMsMax: 0, played: {}, borrowed: 0, spawned: 0, fails: {}, last: null, frames: 0 };

  // ---- where she is
  const M = { x: 0, z: 0, d: null };
  const mayaPos = () => game.maya.root.getWorldPosition(v);
  const districtAt = (x, z) => (bookDist(x, z) <= 0 ? 'home' : regionAt(x, z)?.id || null);
  const raining = () => save.weather === 'rain' || save.weather === 'drizzle';
  const period = () => game.day?.period || 'noon';

  // ---- the ground: roads, solids, lines (the road net is searched edge by edge: kept on a half-metre grid)
  const roadMemo = new Map();
  function roadDist(x, z) {
    const k = Math.round(x * 2) * 100003 + Math.round(z * 2);
    let d = roadMemo.get(k);
    if (d === undefined) { if (roadMemo.size > 20000) roadMemo.clear(); d = ow.net?.nearest?.(x, z)?.dist ?? 99; roadMemo.set(k, d); }
    return d;
  }
  const solid = (x, z, r = BODY) => space.collides(x, z, r);
  function lineOk(x0, z0, x1, z1, r = BODY, road = KEEP.road - 0.3) {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(L / 0.35));
    for (let i = 1; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, z = z0 + ((z1 - z0) * i) / n;
      if (solid(x, z, r) || (i % 2 === 0 && roadDist(x, z) < road)) return false;
    }
    return true;
  }

  // ---- the screen
  const proj = (x, y, z) => (game.rig?.project ? game.rig.project(w.set(x, y, z), W(), H()) : null);
  function onFrame(x, z, pad = 0) {
    const q = proj(x, 1.0, z);
    return !!q && q.x > -pad && q.x < W() + pad && q.y > -pad && q.y < H() + pad;
  }
  function offFrame(x, z) {
    const out = (q) => !q || q.x < -28 || q.x > W() + 28 || q.y < -28 || q.y > H() + 28;
    return out(proj(x, 0.05, z)) && out(proj(x, 2.0, z));
  }
  /** the middle of a gathering well inside the frame (between the top HUD and the bottom buttons) */
  function inViewC(x, z) {
    const q = proj(x, 0.6, z);
    return !!q && q.x > W() * 0.12 && q.x < W() * 0.88 && q.y > H() * 0.18 && q.y < H() * 0.78;
  }
  function groundAt(sx, sy) {
    const cam = game.camera;
    if (!cam) return null;
    cam.getWorldPosition(camPos);
    ndc.set((sx / W()) * 2 - 1, 1 - (sy / H()) * 2, 0.5).unproject(cam);
    const dy = ndc.y - camPos.y;
    if (dy > -1e-3) return null;
    const k = -camPos.y / dy;
    return { x: camPos.x + (ndc.x - camPos.x) * k, z: camPos.z + (ndc.z - camPos.z) * k };
  }
  /** a free straight walk to (x, z) from just outside the frame: along the camera's right (side: -1 / 1 first; 0 the
   *  nearer edge), off the roads, r wide. The start, or null. */
  function walkInFrom(x, z, side = 0, r = BODY, max = 15) {
    const cam = game.camera;
    if (!cam) return null;
    camRight.setFromMatrixColumn(cam.matrixWorld, 0); camRight.y = 0;
    if (camRight.lengthSq() < 1e-6) return null;
    camRight.normalize();
    const q = proj(x, 1, z);
    const first = side || (q && q.x < W() / 2 ? -1 : 1);
    for (const s of [first, -first]) {
      const dx = camRight.x * s, dz = camRight.z * s;
      let ok = true;
      for (let L = 0.4; L <= max && ok; L += 0.4) {
        const sx = x + dx * L, sz = z + dz * L;
        if (solid(sx, sz, r) || roadDist(sx, sz) < KEEP.road - 0.3) { ok = false; break; }
        if (L >= 1 && ((L * 2.5) | 0) % 3 === 0 && offFrame(sx, sz)) return { x: sx, z: sz }; // (the frame looked at every 1.2 m)
      }
    }
    return null;
  }

  /** a way out of the frame from (x, z) in any of four directions (the sides first, then up the street, then
   *  toward the camera): the end point, or null */
  const camFwd = new THREE.Vector3();
  function walkOut(x, z, r = BODY, max = 24) {
    const cam = game.camera;
    if (!cam) return null;
    camRight.setFromMatrixColumn(cam.matrixWorld, 0); camRight.y = 0; camRight.normalize();
    camFwd.set(-camRight.z, 0, camRight.x); // (up the street, away from the camera)
    const q = proj(x, 1, z), sx0 = q && q.x < W() / 2 ? -1 : 1;
    const dirs = [[camRight.x * sx0, camRight.z * sx0], [-camRight.x * sx0, -camRight.z * sx0], [camFwd.x, camFwd.z], [-camFwd.x, -camFwd.z]];
    for (const [dx, dz] of dirs) {
      for (let L = 0.4; L <= max; L += 0.4) {
        const px = x + dx * L, pz = z + dz * L;
        if (solid(px, pz, r) || roadDist(px, pz) < KEEP.road - 0.3) break;
        if (L >= 1 && ((L * 2.5) | 0) % 3 === 0 && offFrame(px, pz)) return { x: px, z: pz };
      }
    }
    return null;
  }

  // ---- keep-outs (read once per site search, cut down to the area round her)
  let keep = null;
  function readKeep() {
    const mp = mayaPos(), mx = mp.x, mz = mp.z, R = SITE.far + 12;
    const near = (o) => o && Number.isFinite(o.x) && Math.abs(o.x - mx) < R && Math.abs(o.z - mz) < R;
    const doors = Object.values(DOORS).flatMap((d) => (d?.enter ? [d, d.enter] : [d])).filter(near).map((d) => ({ x: d.x, z: d.z, f: d.facing || 0 })); // (a raised house: its steps' foot too)
    for (const pl of game.world?.places || []) if (pl.door && near(pl.door)) doors.push({ x: pl.door.x, z: pl.door.z, f: 0 });
    let spots = story.chatterExtras?.keepSpots;
    if (!spots) {
      spots = [];
      for (const m of REGION_FILES) for (const s of Object.values(m.SPOTS || {})) (Array.isArray(s) ? s : [s]).forEach((o) => o && spots.push(o));
      for (const p of REGION_PEOPLE) { spots.push(p); if (p.job?.spot) spots.push(p.job.spot); }
    }
    const cast = [], still = [];
    for (const e of story.people.values()) {
      const p = e?.p?.root?.position;
      if (!p || !near(p)) continue;
      if (castById(e.id) && !AMBIENT.has(e.id) && !e.cast?.ambient && !e.folk && !e.evGuest) cast.push({ x: p.x, z: p.z });
      if (!e.roam || e.rm?.kind === 'idle') still.push({ x: p.x, z: p.z });
    }
    // the hint's person, or the thing its border is round (its feet on the ground)
    let hint = null;
    try {
      const h = story.hints?.current?.();
      if (h?.who) { const e = story.people.get(h.who); if (e?.p?.root) hint = { x: e.p.root.position.x, z: e.p.root.position.z }; }
      if (!hint) { const rp = story.hints?.target?.(); if (rp?.onScreen && rp.rect) hint = groundAt(rp.rect.x + rp.rect.w / 2, rp.rect.y + rp.rect.h * 0.92); }
    } catch { hint = null; }
    const cp = game.car?.root?.position;
    keep = {
      d: districtAt(mx, mz), mx, mz, cx: cp ? cp.x : 1e9, cz: cp ? cp.z : 1e9, doors,
      spots: spots.filter(near), desks: DESKS.filter(near), cast, still, hint,
    };
    return keep;
  }
  function spotWhy(x, z, K, o = {}) {
    if (districtAt(x, z) !== K.d) return 'district';
    if (solid(x, z, o.r ?? 0.42)) return 'solid';
    if (roadDist(x, z) < (o.road ?? KEEP.road)) return 'road';
    if (Math.hypot(x - K.mx, z - K.mz) < KEEP.maya || Math.hypot(x - K.cx, z - K.cz) < KEEP.car) return 'maya';
    for (const d of K.doors) {
      const rx = x - d.x, rz = z - d.z;
      if (Math.hypot(rx, rz) < KEEP.door) return 'door';
      const along = rx * Math.sin(d.f) + rz * Math.cos(d.f), lat = rx * Math.cos(d.f) - rz * Math.sin(d.f);
      if (along > -0.5 && along < 4 && Math.abs(lat) < 1) return 'doorway';
    }
    if (!o.ownSpot) for (const s of K.spots) if (Math.hypot(x - s.x, z - s.z) < KEEP.spot) return 'spot';
    for (const s of K.desks) if (Math.hypot(x - s.x, z - s.z) < KEEP.desk) return 'desk';
    if (K.hint && Math.hypot(x - K.hint.x, z - K.hint.z) < KEEP.hint) return 'hint';
    for (const s of K.cast) if (Math.hypot(x - s.x, z - s.z) < KEEP.cast) return 'cast';
    for (const s of K.still) if (Math.hypot(x - s.x, z - s.z) < KEEP.person) return 'person';
    return '';
  }
  /** every spot, the prop, the extra points and lines of a layout: '' = fine, else the first reason. A generator: it
   *  stops for the next frame whenever this frame's planning time is used up (r.why holds the answer). */
  function* layoutWhyG(lay, K, r) {
    r.why = '';
    const pts = Object.values(lay.spots);
    for (let i = 0; i < pts.length; i++) {
      const s = pts[i];
      const why = spotWhy(s.x, s.z, K, s.o);
      if (why) { r.why = why; return; }
      for (let j = 0; j < i; j++) if (Math.hypot(pts[j].x - s.x, pts[j].z - s.z) < 0.7) { r.why = 'crowd'; return; }
    }
    if (lay.prop) {
      const p = lay.prop;
      if (solid(p.x, p.z, p.r + 0.3)) { r.why = 'propSolid'; return; }
      if (roadDist(p.x, p.z) < KEEP.propRoad + p.r) { r.why = 'propRoad'; return; }
      if (Math.hypot(p.x - K.mx, p.z - K.mz) < KEEP.maya + p.r) { r.why = 'maya'; return; }
    }
    for (const p of Object.values(lay.pts || {})) {
      if (districtAt(p.x, p.z) !== K.d || solid(p.x, p.z, p.r ?? BODY) || roadDist(p.x, p.z) < (p.road ?? KEEP.pt)) { r.why = 'pt'; return; }
      if (Math.hypot(p.x - K.mx, p.z - K.mz) < 1.5) { r.why = 'maya'; return; }
    }
    if (overMs()) yield;
    for (const s of pts) { if (!s.o?.noLine && !lineOk(s.x, s.z, lay.cx, lay.cz, 0.26)) { r.why = 'line'; return; } if (overMs()) yield; }
    for (const l of lay.lines || []) { if (!lineOk(l[0], l[1], l[2], l[3], l[4] ?? BODY)) { r.why = 'line'; return; } if (overMs()) yield; }
  }
  function layoutWhy(lay, K) {
    const pts = Object.values(lay.spots);
    for (let i = 0; i < pts.length; i++) {
      const s = pts[i];
      const why = spotWhy(s.x, s.z, K, s.o);
      if (why) return why;
      for (let j = 0; j < i; j++) if (Math.hypot(pts[j].x - s.x, pts[j].z - s.z) < 0.7) return 'crowd';
    }
    if (lay.prop) {
      const p = lay.prop;
      if (solid(p.x, p.z, p.r + 0.3)) return 'propSolid';
      if (roadDist(p.x, p.z) < KEEP.propRoad + p.r) return 'propRoad';
      if (Math.hypot(p.x - K.mx, p.z - K.mz) < KEEP.maya + p.r) return 'maya';
    }
    for (const p of Object.values(lay.pts || {})) {
      if (districtAt(p.x, p.z) !== K.d || solid(p.x, p.z, p.r ?? BODY) || roadDist(p.x, p.z) < (p.road ?? KEEP.pt)) return 'pt';
      if (Math.hypot(p.x - K.mx, p.z - K.mz) < 1.5) return 'maya';
    }
    for (const s of pts) if (!s.o?.noLine && !lineOk(s.x, s.z, lay.cx, lay.cz, 0.26)) return 'line';
    for (const l of lay.lines || []) if (!lineOk(l[0], l[1], l[2], l[3], l[4] ?? BODY)) return 'line';
    return '';
  }

  // ---- the shared state other modules read
  const npc = story.npcEvent = { active: false, id: null, x: 0, z: 0, quiet: false, debug: null };

  // ---- gates
  let domBlock = false, domT = 0;
  /** talk: Maya is in a talk (a running event only holds still for it: its dialogue box, letterbox and close-up are
   *  not reasons to end it; a scene, an act, an overlay, a room still are) */
  function blockedWhy(talk = false) {
    if (!game.maya?.root) return 'nomaya';
    if (document.hidden) return 'hidden';
    if (game.mode !== 'world') return 'mode';
    if (story.inRoom) return 'room';
    if (!talk) {
      if (story.talking) return 'talking';
      if (game.busy) return 'busy';
      if (game.ui?.dialogOpen) return 'dialog';
    }
    if (game.ui?.sheetOpen) return 'sheet';
    if (!talk && game.rig?.cinematic) return 'cinematic';
    if (story.townIntro || story.introActive || story.cutscene || story.starting) return 'intro';
    if ((talk ? BUSY_TALK : BUSY).test(gameEl.className)) return 'scene';
    if (domBlock) return 'overlay';
    if (story.carrying) return 'carrying';
    try { if (story.blockedTravel?.()) return 'travel'; } catch { /* a day's guard */ }
    if (save.cargo) return 'cargo';
    if (ow?.overviewOn) return 'overview';
    if (dayOwns('npcEvents') || dayOwns('ambientFolk')) return 'day';
    return '';
  }
  /** more, only to start one: Hein Htet on stage, the chatter mid-line, her speed, the frame's budget (no event of this
   *  town fits on top of the frame as it is), the frame time (the game already struggling) */
  function startWhy() {
    if ((save.day || 1) <= 1) return 'day1';
    if (story.heinhtet?.state?.on) return 'heinhtet';
    if (story.chatter?.busy) return 'chatter';
    if (!story.foot?.active && Math.abs(game.world?.drive?.state?.speed || 0) > 2) return 'driving';
    if (frameMed(PERF.win) > frameMs() * PERF.slowStart) return 'slow';
    const b = baseNow(), d = districtAt(M.x, M.z);
    if (!EVENTS.some((ev) => ev.towns.includes(d) && !budgetWhy(ev, b))) return 'budget';
    return '';
  }

  // ---- per save: which events played on this story day, and when (play seconds, the chatter's clock)
  function dayLog() {
    const d = save.day || 1;
    if (!save.ev || save.ev.day !== d) save.ev = { day: d, ids: [], last: save.ev?.last || null };
    return save.ev;
  }
  const recall = () => story.chatter?.recall || null;
  function coolLeft(id) { const R = recall(); if (!R) return 0; const a = R.ago('ev:' + id); return Number.isFinite(a) ? Math.max(0, T.cool - a) : 0; }

  /** why event `ev` cannot start here and now ('' = it can) */
  function eligibleWhy(ev, o = {}) {
    const d = districtAt(M.x, M.z);
    if (!ev.towns.includes(d)) return 'town';
    if (o.anyTime) return '';
    if ((save.day || 1) < (ev.fromDay || 2)) return 'fromDay';
    if (ev.periods && !ev.periods.includes(period())) return 'period';
    if (ev.dry && raining()) return 'rain';
    const L = dayLog();
    if (L.ids.includes(ev.id)) return 'today';
    if (L.ids.length >= T.perDay) return 'perDay';
    if (L.last === ev.id) return 'last';
    if (coolLeft(ev.id) > 0) return 'cool';
    return '';
  }

  // ---- guests: a passer-by of this town made a step a frame (people.js createPersonSteps)
  function lookFor(R, district, age, woman) {
    const pk = (a) => a[Math.floor(R() * a.length)];
    const look = { age, build: pk(['slim', 'mid', 'mid', 'wide']), skin: Math.floor(R() * 9), seed: Math.floor(R() * 1e5), extras: [] };
    if (woman) {
      look.hair = age === 'elder' ? 'bun' : pk(['bun', 'long', 'braid', 'bob', 'pony']);
      look.hairColor = age === 'elder' ? pk(['grey', 'white', 'salt']) : pk(['black', 'black', 'dark', 'brown']);
      look.top = age === 'child' ? pk(['tee', 'blouse']) : pk(['blouse', 'blouse', 'eingyi', 'tee']);
      look.bottom = age === 'child' && R() < 0.4 ? 'shorts' : 'htamein';
      if (age !== 'child' && R() < 0.5) look.extras.push('thanaka');
    } else {
      look.hair = age === 'elder' ? pk(['receding', 'short', 'bald']) : pk(['short', 'side', 'crew', 'parted', 'spiky']);
      look.hairColor = age === 'elder' ? pk(['grey', 'white', 'salt']) : pk(['black', 'dark', 'black']);
      look.top = age === 'child' ? 'tee' : pk(['shirt', 'tee', 'eingyi', 'vest', 'shirt']);
      look.bottom = age === 'child' ? pk(['shorts', 'longyi']) : 'longyi';
      if (look.bottom === 'longyi') look.check = R() < 0.45;
    }
    if (age === 'teen' && R() < 0.4) { look.top = 'school'; look.bottom = woman ? 'schoolSkirt' : 'schoolLongyi'; }
    if (age === 'elder' && R() < 0.5) look.extras.push('glasses');
    if (district === 'blank') { look.topColor = 'white'; look.bottomColor = pk(['grey', 'charcoal', 'cream']); }
    else { look.topColor = pk(CLOTHS); look.bottomColor = pk(['maroon', 'navy', 'teal', 'brown', 'plum', 'olive', 'charcoal', 'rose', 'mustard']); }
    return look;
  }
  let guestSeq = 0;
  function* spawnGuest(c, sl, spot, from) {
    const d = c.d, slot = folkSlot(d);
    let made = false;
    try {
      const R = seeded(hashName(`${d}#ev#${slot}#${sl.id}`));
      const ages = sl.age || ['adult'];
      const age = ages[Math.floor(R() * ages.length)];
      const woman = sl.woman != null ? sl.woman : R() < 0.5;
      const look = lookFor(R, d, age, woman);
      const name = folkName({ district: d, age, woman, slot });
      planAt = 'person';
      const p = yield* createPersonSteps(look);
      planAt = 'guest';
      measurePerson(p);
      if (!c.alive || !offFrame(from.x, from.z)) { p.dispose?.(); return null; } // (the start came into view meanwhile: nobody pops up)
      const id = `ev:${c.id}:${guestSeq++}`;
      p.root.position.set(from.x, 0, from.z);
      p.root.rotation.y = Math.atan2(spot.x - from.x, spot.z - from.z);
      p.root.userData.isPerson = true;
      scene.add(p.root);
      const e = {
        id, name, p, cast: { id, name, role: { en: sl.role || 'passer-by', my: '' }, look, ambient: true }, look,
        home: { x: spot.x, z: spot.z, h: spot.h }, ob: { type: 'circle', x: from.x, z: from.z, r: p.radius || 0.3, person: id },
        onTalk: null, walking: null, noRoam: true, evGuest: true, town: d, slot,
        g: { tx: null, tz: null, sp: rand(1.1, 1.3), h: spot.h, mood: null, moodOn: null, look: null, from: { x: from.x, z: from.z }, leaving: false, offT: 0, trail: [{ x: from.x, z: from.z }, { x: spot.x, z: spot.z }], route: null },
      };
      e.ctl = (dt) => guestStep(e, dt);
      story.people.set(id, e);
      made = true;
      stats.spawned++;
      return e;
    } finally { if (!made) releaseFolkSlot(d, slot); }
  }
  const lookV = new THREE.Vector3();
  function guestStep(e, dt) {
    const g = e.g, r = e.p.root, pos = r.position;
    const hold = story.talking && story.talkWith !== e; // (a talk nearby: everyone stands still)
    if (g.tx != null && !hold) {
      const dx = g.tx - pos.x, dz = g.tz - pos.z, d = Math.hypot(dx, dz);
      const sp = d < 0.5 ? Math.max(0.4, (g.sp * d) / 0.5) : g.sp;
      if (d <= sp * dt + 0.02) {
        pos.x = g.tx; pos.z = g.tz; g.tx = null;
        if (g.route?.length) { const q = g.route.shift(); g.tx = q.x; g.tz = q.z; } // (the way back: next leg)
        e.p.update(dt, { speed: 0 });
      }
      else {
        pos.x += (dx / d) * sp * dt; pos.z += (dz / d) * sp * dt;
        const want = Math.atan2(dx, dz);
        r.rotation.y += wrap(want - r.rotation.y) * (1 - Math.exp(-dt * 9));
        if (g.moodOn !== g.walkMood) { e.p.setMood(g.walkMood || null); g.moodOn = g.walkMood || null; }
        e.p.update(dt, { speed: sp });
      }
      e.ob.x = pos.x; e.ob.z = pos.z;
      if (g.look) e.p.lookAt(lookV.set(g.look.x, 1, g.look.z)); else e.p.lookAt(null);
      return;
    }
    if (story.talkWith !== e) r.rotation.y += wrap(g.h - r.rotation.y) * (1 - Math.exp(-dt * 5));
    if (g.moodOn !== g.mood) { e.p.setMood(g.mood || null); g.moodOn = g.mood; }
    if (g.look) e.p.lookAt(lookV.set(g.look.x, 1, g.look.z)); else e.p.lookAt(null);
    e.p.update(dt, { speed: 0 });
  }
  /** a guest taken out of the town (only ever off screen, or with nothing of the town in view): true when gone */
  function dropGuest(e) {
    if (!e || story.people.get(e.id) !== e) return true;
    if (story.talkWith === e) return false; // (never mid-talk: a later pass)
    story.people.delete(e.id);
    releaseFolkSlot(e.town, e.slot);
    e.p.root.removeFromParent();
    e.p.dispose?.();
    strays.delete(e);
    return true;
  }

  // ---- a way out of sight for a guest who cannot simply walk out of the frame: the nearest reachable point off the
  // frame, found by a grid search round them (0.6 m cells, 24 m at most, each step clear of walls and never further
  // into a road), spread over frames (the frame's planning time), then pulled into a few straight legs
  const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  function* hideWayG(x0, z0, r, out) {
    const S = 0.6, N = 40, W2 = 2 * N + 1;
    const key = (i, j) => (i + N) * W2 + (j + N);
    const par = new Map([[key(0, 0), -1]]), bad = new Set();
    const qi = [0], qj = [0];
    let goal = -1, n = 0;
    for (let h = 0; h < qi.length; h++) {
      const i = qi[h], j = qj[h], x = x0 + i * S, z = z0 + j * S;
      if (h > 0 && offFrame(x, z)) { goal = key(i, j); break; }
      const rdh = roadDist(x, z);
      for (const [di, dj] of NB) {
        const ni = i + di, nj = j + dj;
        if (Math.abs(ni) > N || Math.abs(nj) > N) continue;
        const k = key(ni, nj);
        if (par.has(k) || bad.has(k)) continue;
        const nx = x0 + ni * S, nz = z0 + nj * S, rr = Math.abs(ni) + Math.abs(nj) <= 3 ? 0.06 : r; // (standing pressed against something: the first steps out of it test a slim body)
        if (solid(nx, nz, rr)) { bad.add(k); continue; }
        if (solid((x + nx) / 2, (z + nz) / 2, rr)) continue;
        const rd = roadDist(nx, nz);
        if (rd < KEEP.road - 0.3 && rd < rdh + 0.05) continue; // (off a road, or at least away from it)
        par.set(k, key(i, j)); qi.push(ni); qj.push(nj);
      }
      if ((++n & 7) === 0 && overMs()) yield;
    }
    if (goal < 0) { out.route = null; return; }
    const cells = [];
    for (let k = goal; k >= 0; k = par.get(k)) cells.push({ x: x0 + (Math.floor(k / W2) - N) * S, z: z0 + ((k % W2) - N) * S });
    cells.reverse(); // (from where they stand to the hidden point)
    const route = [];
    for (let a = 0; a < cells.length - 1;) {
      let b = cells.length - 1;
      while (b > a + 1 && !lineOk(cells[a].x, cells[a].z, cells[b].x, cells[b].z, r, 1.2)) b--;
      route.push(cells[b]); a = b;
      if (overMs()) yield;
    }
    out.route = route;
  }
  /** a leaving guest, once a frame (in a wrap-up, or after it): gone the moment they are out of the frame; standing in
   *  view with nowhere left to walk, a way out of sight is searched (again every few seconds while there is none:
   *  Maya walking on changes the frame). True when gone. */
  function guestOut(e, dt) {
    const g = e.g, pos = e.p.root.position;
    if (story.people.get(e.id) !== e) return true;
    if (story.talkWith === e) return false;
    if (offFrame(pos.x, pos.z) || Math.hypot(pos.x - M.x, pos.z - M.z) > CAP.strayFar) return dropGuest(e);
    if (!g.leaving || g.tx != null) return false;
    if (g.esc) {
      const r = g.esc.gen.next();
      if (!r.done) return false;
      const route = g.esc.out.route;
      g.esc = null;
      if (route?.length) { const f = route.shift(); g.route = route; g.tx = f.x; g.tz = f.z; stats.hid = (stats.hid || 0) + 1; }
      else g.escT = CAP.retry;
      return false;
    }
    if ((g.escT = (g.escT || 0) - dt) <= 0) { const out = {}; g.esc = { out, gen: hideWayG(pos.x, pos.z, g.wide ? 0.5 : BODY, out) }; }
    return false;
  }
  // guests still in view when their event was over: they walk on out of sight by themselves
  const strays = new Set();
  function straysFrame(dt) {
    const away = story.inRoom || game.mode !== 'world' || ow?.overviewOn;
    for (const e of strays) {
      if (story.people.get(e.id) !== e) { strays.delete(e); continue; }
      if (away ? dropGuest(e) : guestOut(e, dt)) strays.delete(e);
    }
  }

  // ---- the running event
  let cur = null, job = null, jobWhy = '', lastFails = {};
  const tmp = new THREE.Vector3();

  // participants: { e, slot, tag, kind: 'roam' | 'guest', spot, mood }
  const alive = (p) => !!p && !p.gone && !!p.e?.p?.root?.parent && story.people.get(p.e.id) === p.e && (p.kind === 'guest' || !!p.e.rm?.ev);
  function pGo(p, x, z, sp = 0) {
    if (!alive(p)) return false;
    if (p.kind === 'roam') return !!story.roam?.evGo?.(p.e, x, z, sp);
    const pos = p.e.p.root.position;
    if (Math.hypot(x - pos.x, z - pos.z) > 0.05 && !lineOk(pos.x, pos.z, x, z, 0.24)) return false;
    const g = p.e.g, last = g.trail[g.trail.length - 1];
    if (!last || Math.hypot(last.x - pos.x, last.z - pos.z) > 0.3) g.trail.push({ x: pos.x, z: pos.z });
    g.trail.push({ x, z });
    if (g.trail.length > 40) g.trail.splice(1, 2);
    g.route = null; g.tx = x; g.tz = z; if (sp) g.sp = sp;
    return true;
  }
  function pAt(p) {
    if (!alive(p)) return true;
    if (p.kind === 'roam') return p.e.rm.state === 'event';
    return p.e.g.tx == null;
  }
  const evOf = (p) => (p.kind === 'roam' ? p.e.rm.ev : p.e.g);
  function pFace(p, h) { if (alive(p)) evOf(p).h = h; }
  function pFaceTo(p, x, z) { if (!alive(p)) return; const r = p.e.p.root.position; evOf(p).h = Math.atan2(x - r.x, z - r.z); }
  function pLook(p, x, z) { if (!alive(p)) return; const o = evOf(p); if (x == null) { o.look = null; return; } o.look = p.lookAt || (p.lookAt = { x: 0, z: 0 }); o.look.x = x; o.look.z = z; }
  function pMood(p, m) { if (alive(p)) { evOf(p).mood = m || null; p.mood = m || null; } }

  function makeCtx(ev, lay) {
    const c = {
      ev, id: ev.id, cx: lay.cx, cz: lay.cz, s: lay.s, h: lay.s > 0 ? Math.PI / 2 : -Math.PI / 2, d: lay.d, lay,
      spots: lay.spots, pts: lay.pts || {}, low, ps: [], alive: true, phase: 'plan', t: 0, tasks: [], says: [], obs: [], parts: [], tapParts: [],
      quiet: !!ev.quiet, joining: false, joined: false, wrapping: false, guests: 0, day: save.day, startT: performance.now(),
      st: 0, // (the script's own clock: it stands still while Maya talks with anyone, so no wait runs out in a talk)
      wt: 0, // (the wrap-up's clock: it stands still in a talk too, so nothing folds away or is taken off while she talks)
      slowT: 0, base: null, est: null, load: { n: 0, sum: 0, peak: 0, msMax: 0 },
      L: LINES[ev.id] || {}, mem: {},
      // -- people
      p: (slot) => c.ps.find((p) => p.slot === slot && alive(p)) || null,
      tag: (t) => c.ps.filter((p) => alive(p) && (p.tag === t || p.slot === t)),
      all: () => c.ps.filter(alive),
      ok: alive,
      walk: (p, x, z, sp) => pGo(p, x, z, sp),
      home: (p, sp) => (p?.spot ? pGo(p, p.spot.x, p.spot.z, sp) : false),
      at: (p) => pAt(p),
      arrived: (list) => () => list.every((p) => pAt(p)),
      face: (p, h) => pFace(p, h),
      faceTo: (p, x, z) => pFaceTo(p, x, z),
      look: (p, x, z) => pLook(p, x, z),
      lookAll: (x, z, list = c.all()) => { for (const p of list) pLook(p, x, z); },
      faceAll: (x, z, list = c.all()) => { for (const p of list) pFaceTo(p, x, z); },
      mood: (p, m) => pMood(p, m),
      moodAll: (list, m) => { for (const p of list) pMood(p, m); },
      expr: (p, face, hold = 2) => { if (alive(p)) p.e.p.setFace?.(face, hold); },
      pos: (p) => (alive(p) ? p.e.p.root.position : null),
      /** a gesture: the anim library's clip when it is there, else people.js's nearest emote */
      act: (p, name, o = {}) => {
        if (!alive(p)) return;
        const an = A();
        if (an?.play) { try { an.play(p.e, name, o); return; } catch { /* the library refused: the old emote */ } }
        const em = FALLBACK[name];
        if (em) p.e.p.emote?.(em);
        const f = FACE_OF[name];
        if (f) p.e.p.setFace?.(f, 1.6);
      },
      /** several people react together (staggered, never in sync) */
      react: (list, kind, o = {}) => {
        list = list.filter(alive);
        const an = A(), rk = REACT[kind];
        if (!rk) { for (const p of list) c.act(p, kind, o); return; }
        if (an?.react) { try { an.react(list.map((p) => p.e), rk, o); return; } catch { /* fall back */ } }
        for (const p of list) { const em = FALLBACK[kind]; if (em) p.e.p.emote?.(em); const f = FACE_OF[kind]; if (f) p.e.p.setFace?.(f, 1.6); }
      },
      stopAct: (p) => { const an = A(); if (an?.stop && alive(p)) try { an.stop(p.e); } catch { /* none */ } },
      // -- words: speech bubbles through the chatter's one exchange slot. say([p, key], [p2, key2], ...) -> wait fn
      say: (...pairs) => {
        const st = { done: false, started: false, t0: c.st, sp: [], lines: [] };
        for (const [p, k] of pairs) {
          const line = typeof k === 'string' ? c.L[k] : k;
          if (!line) continue;
          if (p === 'maya') { st.lines.push({ who: 'maya', my: line.my, en: line.en }); continue; }
          if (!alive(p) || !p.arrived) continue; // (never a line from someone who has not got there yet)
          let i = st.sp.findIndex((s) => s.id === p.e.id);
          if (i < 0) { i = st.sp.length; st.sp.push({ id: p.e.id, p: p.e.p }); }
          st.lines.push({ who: i, my: line.my, en: line.en });
        }
        if (!st.sp.length || !st.lines.length) { st.done = true; return () => true; }
        c.says.push(st);
        trySay(c, st);
        return () => st.done;
      },
      /** a speaker that is not a person (a puppet): { root: Object3D, height } */
      sayAs: (fake, k) => {
        const line = typeof k === 'string' ? c.L[k] : k;
        const st = { done: false, started: false, t0: c.st, sp: [{ id: 'ev:' + c.id + ':' + (fake.name || 'thing'), p: fake }], lines: [{ who: 0, my: line.my, en: line.en }] };
        c.says.push(st); trySay(c, st);
        return () => st.done;
      },
      // -- things
      part: (kind) => { const pt = rig.add(kind); if (pt) c.parts.push(pt); return pt; },
      carry: (pt, p, ox, oy, oz, ry = 0) => { if (pt && alive(p)) { const k = p.e.p.height ? p.e.p.height / 1.15 : 1; pt.carry(p.e.p, ox, oy * k, oz, ry); pt.holder = p; } },
      /** a prop's footprint in the walk space (pt: the prop it belongs to). Someone standing on it (the carrier who
       *  just set it down, Maya): it goes in once they have stepped off */
      block: (x, z, r, pt = null) => { const o = { type: 'circle', x, z, r, pt, pend: false }; c.obs.push(o); if (clearOf(c, o)) space.add([o]); else o.pend = true; return o; },
      unblock: (o) => { const i = c.obs.indexOf(o); if (i >= 0) { c.obs.splice(i, 1); if (!o.pend) space.remove([o]); o.pend = false; } },
      burst: (kind, x, y, z, o = {}) => { try { game.fx?.burst?.(kind, tmp.set(x, y, z), o); } catch { /* no fx */ } },
      sfx: (name, x = c.cx, z = c.cz, vol = 1) => {
        const d = Math.hypot(x - M.x, z - M.z), k = Math.max(0, 1 - d / 28);
        if (k <= 0.02) return;
        const cam = game.camera;
        let pan = 0;
        if (cam) { camRight.setFromMatrixColumn(cam.matrixWorld, 0); pan = Math.max(-1, Math.min(1, ((x - M.x) * camRight.x + (z - M.z) * camRight.z) / 10)); }
        sfx.play(name, vol * k, pan);
      },
      // -- flow
      run: (gen) => { const t = { gen, wait: 0, until: null, done: false }; c.tasks.push(t); return t; },
      done: (...ts) => () => ts.every((t) => !t || t.done),
      upto: (fn, max) => { const t0 = c.st; return () => fn() || c.st - t0 > max; },
      /** a late helper: the nearest free townsperson (or a guest from off screen) walks to (x, z) */
      call: function* (slotId, x, z, h, o = {}) {
        const sl = { ...(ev.slots.find((s) => s.id === slotId) || { id: slotId }), ...o };
        const spot = { x, z, h: h ?? 0 };
        const a = yield* assignOne(c, sl, spot, findCands(c.cx, c.cz, c), true);
        if (!a) return null;
        return yield* commitOne(c, a);
      },
      leave: (p, back = false) => leave(c, p, back),
      /** a free point r m from (x, z), toward (fx, fz) first (r 0: the point itself, if it is free) */
      near: (x, z, fx, fz, r = 0.5) => {
        const a0 = Math.atan2(fx - x, fz - z);
        for (let k = 0; k < (r > 0 ? 8 : 1); k++) {
          const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI / 4), px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r;
          if (!solid(px, pz, 0.26) && roadDist(px, pz) >= KEEP.pt && districtAt(px, pz) === c.d) return { x: px, z: pz };
        }
        return null;
      },
      onFrame: (x, z) => onFrame(x, z, 30),
      mayaAct: (name) => { try { game.maya?.emote?.(name); } catch { /* none */ } },
      get period() { return period(); },
      get maya() { return M; },
      rig,
    };
    return c;
  }
  function trySay(c, st) {
    if (st.started || st.done) return;
    const ch = story.chatter;
    if (!ch) { st.done = true; return; }
    // (a speaker gone or walked off: their lines are left out)
    if (ch.play(st.sp, st.lines, () => { st.done = true; }, 'small')) st.started = true;
    else if (c.st - st.t0 > 4) st.done = true; // (the slot never came free: the beat goes on without it)
  }
  /** nobody (a participant, Maya) stands on footprint o */
  function clearOf(c, o) {
    const R = o.r + 0.22;
    if (Math.hypot(M.x - o.x, M.z - o.z) < R) return false;
    for (const p of c.ps) { if (!alive(p)) continue; const q = p.e.p.root.position; if (Math.hypot(q.x - o.x, q.z - o.z) < R) return false; }
    return true;
  }

  // ---- recruiting
  function fits(e, sl) {
    const look = e.cast?.look || e.look || {};
    const age = look.age || 'adult';
    if (sl.age && !sl.age.includes(age)) return false;
    if (sl.woman != null) { const wmn = look.bottom === 'htamein' || look.bottom === 'schoolSkirt' || ['bun', 'long', 'braid', 'pony'].includes(look.hair); if (wmn !== sl.woman) return false; }
    if (sl.job && !(e.job && (!sl.jobRe || sl.jobRe.test(String(e.cast?.role?.en || ''))))) return false;
    return true;
  }
  function findCands(cx, cz, c) {
    const out = [];
    let hintWho = null;
    try { hintWho = story.hints?.current?.()?.who || null; } catch { /* none */ }
    for (const e of story.people.values()) {
      if (!e?.roam || !e.rm || (e.rm.kind !== 'region' && e.rm.kind !== 'folk') || e.evt || e.rm.ev || e.rm.partner || e.paused || e === story.talkWith || e.hidden) continue;
      if (e.id === hintWho || dayOwns(e.id)) continue;
      if (castById(e.id) && !AMBIENT.has(e.id) && !e.cast?.ambient && !e.folk) continue; // (a day's story cast: never)
      const p = e.p.root.position, d = Math.hypot(p.x - cx, p.z - cz);
      if (d > RECRUIT_R) continue;
      if (c && c.ps.some((q) => q.e === e)) continue;
      out.push(e);
    }
    return out;
  }
  /** who fills slot sl at spot: { sl, spot, src: { kind: 'roam', e } | { kind: 'guest', from } } or null */
  function* assignOne(c, sl, spot, cands, late = false) {
    if (sl.guest !== 'must') {
      const who = spot.o?.who, inPlace = spot.o?.inPlace ?? sl.inPlace; // (a layout may name the one person for a spot: a stall's own keeper)
      const fit = cands.filter((e) => fits(e, sl) && (!who || e.id === who)).sort((a, b) => a.p.root.position.distanceToSquared(tmp.set(spot.x, 0, spot.z)) - b.p.root.position.distanceToSquared(tmp.set(spot.x, 0, spot.z)));
      for (let i = 0; i < Math.min(6, fit.length); i++) {
        if (story.roam?.canBorrow?.(fit[i], spot.x, spot.z, { ...sl, inPlace })) { cands.splice(cands.indexOf(fit[i]), 1); return { sl, spot, src: { kind: 'roam', e: fit[i] } }; }
        if (overMs()) yield;
      }
    }
    if (sl.guest !== 'must') { const k = 'cands:' + sl.id; lastFails[k] = (lastFails[k] || '') + cands.filter((e) => fits(e, sl)).length + '/' + cands.length + ' '; }
    if (sl.guest === 'no' || c.guests >= (low ? 1 : GUESTS)) return null;
    const r = sl.wide ? 0.55 : BODY;
    let from = walkInFrom(spot.x, spot.z, sl.side ? -(c.s || 1) : 0, r), legs = null; // (a carrier walks in toward the stage: what they push leads)
    if (!from) {
      // no straight way in from the side: the nearest way out of sight from the spot (the same search a guest uses to
      // leave: clear of walls, never further into a road), walked the other way round
      planAt = 'way-in';
      const out = {};
      yield* hideWayG(spot.x, spot.z, r, out);
      if (out.route?.length) { legs = out.route.slice(0, -1).reverse(); from = out.route[out.route.length - 1]; }
    }
    if (!from) return null;
    c.guests++;
    void late;
    return { sl, spot, src: { kind: 'guest', from, legs } };
  }
  function* commitOne(c, a) {
    const { sl, spot, src } = a;
    let p = null;
    if (src.kind === 'roam') {
      planAt = 'borrow';
      const ev = story.roam?.borrow?.(src.e, { x: spot.x, z: spot.z, h: spot.h, mood: null, inPlace: !!(spot.o?.inPlace ?? sl.inPlace), evt: { id: c.id, slot: sl.id } });
      if (!ev) return null;
      p = { e: src.e, slot: sl.id, tag: sl.tag || sl.id, kind: 'roam', spot, mood: null };
      stats.borrowed++;
    } else {
      const e = yield* spawnGuest(c, sl, spot, src.from);
      if (!e) { c.guests--; return null; }
      e.evt = { id: c.id, slot: sl.id };
      e.g.tx = spot.x; e.g.tz = spot.z; e.g.wide = !!sl.wide;
      if (src.legs?.length) { // (the way in round the corner: leg by leg, then the spot; the same way back out)
        const g = e.g, f = src.legs[0];
        g.route = [...src.legs.slice(1), { x: spot.x, z: spot.z }]; g.tx = f.x; g.tz = f.z;
        g.trail = [{ x: src.from.x, z: src.from.z }, ...src.legs.map((q) => ({ x: q.x, z: q.z })), { x: spot.x, z: spot.z }];
        e.p.root.rotation.y = Math.atan2(f.x - src.from.x, f.z - src.from.z);
      }
      p = { e, slot: sl.id, tag: sl.tag || sl.id, kind: 'guest', spot, mood: null };
    }
    c.ps.push(p);
    return p;
  }

  // ---- planning (a generator, a few checks a frame)
  function* findSite(ev, o) {
    planAt = 'keep';
    const K = readKeep();
    yield;
    planAt = 'site';
    if (ev.site) { const lay = yield* ev.site(siteKit(ev, K), K, (l) => { const why = layoutWhy(l, K); if (why) lastFails[why] = (lastFails[why] || 0) + 1; return why; }); return lay; }
    const tries = [];
    // anchors first (a tea shop for the football), then the townsfolk's own pavement points round her (roam.js
    // found them: off the roads, clear of doors and spots; open ground where people stand), then mostly points in
    // view, some anywhere round her
    for (const a of ev.anchors?.(siteKit(ev, K)) || []) tries.push(a);
    if (!o.at) {
      const own = [];
      for (const e of story.people.values()) {
        const rm = e.rm;
        if (!rm || !e.roam || rm.kind === 'idle') continue;
        for (const q of rm.pts || []) own.push({ x: q.x + rand(-0.6, 0.6), z: q.z + rand(-0.6, 0.6) });
        if (rm.hx != null) own.push({ x: rm.hx, z: rm.hz });
      }
      // (in view first: a gathering she can see happen)
      const ok = own.filter((q) => { const d = Math.hypot(q.x - K.mx, q.z - K.mz); return d >= SITE.near - 1 && d <= SITE.far + 2; });
      for (const q of ok) q.v = (ev.offscreen ? 0 : inViewC(q.x, q.z) ? -1 : 0) + Math.random() * 0.5;
      for (const q of ok.sort((a, b) => a.v - b.v).slice(0, 30)) tries.push(q);
    }
    yield;
    let n = 0;
    for (let i = 0; i < SITE.tries; i++) {
      let cx, cz;
      if (i < tries.length) ({ x: cx, z: cz } = tries[i]);
      else if (o.at) { const a = Math.random() * Math.PI * 2, r = i < 6 ? Math.random() * 1.5 : rand(0, 5); cx = o.at.x + Math.sin(a) * r; cz = o.at.z + Math.cos(a) * r; }
      else if (!ev.offscreen && Math.random() < 0.75) { const g = groundAt(rand(0.12, 0.88) * W(), rand(0.2, 0.72) * H()); if (!g) continue; cx = g.x; cz = g.z; }
      else { const a = Math.random() * Math.PI * 2, r = rand(SITE.near, SITE.far); cx = K.mx + Math.sin(a) * r; cz = K.mz + Math.cos(a) * r; }
      const dm = Math.hypot(cx - K.mx, cz - K.mz);
      if (!o.at && (dm < SITE.near - (i < tries.length ? 1 : 0) || dm > SITE.far + (i < tries.length ? 2 : 0))) continue;
      if (districtAt(cx, cz) !== K.d) continue;
      const s = Math.random() < 0.5 ? 1 : -1;
      for (const ss of [s, -s]) {
        const lay = ev.layout(siteKit(ev, K), cx, cz, ss);
        if (!lay) continue;
        lay.cx ??= cx; lay.cz ??= cz; lay.s = ss; lay.d = K.d;
        const rr = {};
        yield* layoutWhyG(lay, K, rr);
        const why = rr.why || (ev.siteOk ? ev.siteOk(siteKit(ev, K), lay) : '');
        if (!why) return lay;
        lastFails[why] = (lastFails[why] || 0) + 1;
        if (overMs()) yield;
      }
      if (++n % SITE.perFrame === 0 || overMs()) yield;
    }
    return null;
  }
  /** what a layout function may use */
  function siteKit(ev, K) {
    return {
      K, solid, roadDist, lineOk, districtAt, onFrame, offFrame, low, period: period(), items: ITEMS,
      face: (x, z, tx, tz) => Math.atan2(tx - x, tz - z),
      ring: (cx, cz, n, r, a0 = 0) => { const out = []; for (let i = 0; i < n; i++) { const a = a0 + (i / n) * Math.PI * 2, x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r; out.push({ x, z, h: Math.atan2(cx - x, cz - z) }); } return out; },
      /** watchers on an arc on the north side of a stage at (cx, cz) facing s: angles from the stage's axis toward the north */
      arc: (cx, cz, s, n, r, a0 = 0.05, a1 = 1.0) => { const out = []; for (let i = 0; i < n; i++) { const t = n > 1 ? a0 + ((a1 - a0) * i) / (n - 1) : (a0 + a1) / 2, x = cx + s * r * Math.cos(t), z = cz - r * Math.sin(t); out.push({ x, z, h: Math.atan2(cx - x, cz - z) }); } return out; },
      people: () => story.people,
      ev,
    };
  }
  function* planJob(ev, o = {}) {
    const t0 = performance.now();
    lastFails = {};
    const lay = yield* findSite(ev, o);
    if (!lay) return fail(ev, 'site');
    const c = makeCtx(ev, lay);
    c.noBudget = !!o.noBudget;
    // who: everyone assigned first (only checks), then borrowed / spawned
    planAt = 'cands';
    const cands = findCands(c.cx, c.cz, c);
    planAt = 'assign';
    const plan = [];
    for (const sl of ev.slots) {
      if (sl.late) continue;
      const spot = c.spots[sl.id];
      if (!spot) continue;
      const a = yield* assignOne(c, sl, spot, cands);
      if (!a) { if (sl.need) return fail(ev, 'slot:' + sl.id); continue; }
      plan.push(a);
    }
    if (plan.length < (ev.min || 2)) return fail(ev, 'few');
    if (blockedWhy()) return fail(ev, 'gate');
    // go: the event is on from here (the people walk to it as they are found). The frame as it was just before: the
    // bar a slowdown is judged against
    c.base = baseNow(); c.est = costOf(ev);
    cur = c;
    Object.assign(npc, { active: true, id: ev.id, x: c.cx, z: c.cz, quiet: !!ev.quiet });
    try { if (SONG_KIND[ev.id] && !ev.quiet) story.sound?.gather?.('npcev', { kind: SONG_KIND[ev.id], x: c.cx, z: c.cz, r: 9 }); } catch { /* no sound */ } // its own gathering song + ambience (sound/songs-more.js)
    c.phase = 'gather';
    for (const a of plan) {
      if (c.wrapping || !c.alive) return;
      const p = yield* commitOne(c, a);
      if (!p && a.sl.need) { wrapUp(c, 'commit:' + a.sl.id); return; }
      yield;
    }
    if (c.wrapping || !c.alive) return; // (it ended while its people were made: no props for an event that is over)
    planAt = 'setup';
    try { ev.setup?.(c); } catch (e) { console.error('event setup', ev.id, e); }
    c.run(ev.script(c)).main = true;
    c.phase = 'run';
    stats.planMsMax = Math.max(stats.planMsMax, performance.now() - t0);
    const L = dayLog();
    L.ids.push(ev.id); L.last = ev.id;
    try { recall()?.mark('ev:' + ev.id); } catch { /* no chatter */ }
    story.persist?.();
    stats.played[ev.id] = (stats.played[ev.id] || 0) + 1;
    stats.last = { id: ev.id, x: +c.cx.toFixed(1), z: +c.cz.toFixed(1), people: c.ps.length, guests: c.guests };
  }
  function fail(ev, why) {
    jobWhy = why;
    stats.fails[ev.id + ':' + why] = (stats.fails[ev.id + ':' + why] || 0) + 1;
    nextAt = elig + rand(T.retry[0], T.retry[1]);
    return null;
  }

  // ---- the end: everyone back to their day (staggered), guests walk off, props leave with their carriers
  function leave(c, p, back = false) {
    if (!p || p.gone) return;
    p.left = true;
    if (p.kind === 'roam') { if (p.e.rm?.ev) story.roam?.release?.(p.e); p.e.evt = null; p.gone = true; return; }
    // a guest: off to a point out of the frame (the way they came if nothing better), then gone
    const e = p.e, g = e.g, pos = e.p.root.position;
    g.mood = null; g.look = null; g.leaving = true; g.sp = Math.max(g.sp, 1.2); g.esc = null; g.escT = 0;
    // out of the frame by the nearer side if that is clear; else back along their own legs (each one checked) to
    // where they came in (a carrier always: that way was checked wide)
    const to = back ? null : walkInFrom(pos.x, pos.z, 0, BODY, 16);
    if (to) { g.route = null; g.tx = to.x; g.tz = to.z; return; }
    const way = [];
    for (let i = g.trail.length - 1; i >= 0; i--) { const q = g.trail[i]; if (Math.hypot(q.x - pos.x, q.z - pos.z) > 0.2 || i === 0) way.push(q); }
    const first = way.shift();
    g.route = way; g.tx = first.x; g.tz = first.z;
  }
  function* disperse(c) {
    c.phase = 'disperse';
    const list = c.ps.filter((p) => !p.left).sort(() => Math.random() - 0.5);
    for (const p of list) { leave(c, p); yield rand(0.3, 0.9); }
  }
  function wrapUp(c, why = 'wrap') {
    if (!c || c.wrapping) return;
    c.wrapping = true; c.wrapWhy = why; c.wrapT0 = c.t; c.wt = 0;
    try { story.sound?.ungather?.('npcev'); } catch { /* no sound */ } // the show is over: the place's own music returns
    if (why !== 'end') { c.tasks.length = 0; try { c.ev.onWrap?.(c); } catch (e) { console.error('event wrap', c.id, e); } }
    c.run(disperse(c));
  }
  /** everything gone: guests out of the frame, props off screen (or with their carriers), the obstacles out. Late in a
   *  wrap-up (CAP.soft) the script's own last moves and lingering extras no longer hold it. */
  function finished(c, late = false) {
    if (!late && c.tasks.some((t) => !t.done)) return false;
    for (const p of c.ps) if (p.kind === 'guest' && !p.gone) return false;
    for (const pt of c.parts) if (pt.vis && pt.s > 0.01) return false;
    if (!late) { try { if (c.ev.lingering?.(c)) return false; } catch { /* done */ } }
    return true;
  }
  /** the event is over: its state, music, obstacles and flags at once. soft (a wrap-up that ran its course): a guest
   *  still in view walks on out of sight by themselves (strays) and props in view shrink away first; otherwise (a
   *  room, a page turn, the overview: none of it in view) everything goes now. */
  let rigClearAt = 0;
  function endNow(c, soft = false) {
    let strayN = 0;
    for (const p of c.ps) {
      if (p.kind === 'roam' && !p.gone) { if (p.e.rm?.ev) story.roam?.release?.(p.e); p.e.evt = null; }
      if (p.kind === 'guest' && !p.gone) {
        const e = p.e, pos = e.p.root.position;
        if (story.people.get(e.id) === e && ((soft && !offFrame(pos.x, pos.z)) || !dropGuest(e))) {
          const g = e.g;
          if (!g.leaving) { g.mood = null; g.look = null; g.leaving = true; g.sp = Math.max(g.sp, 1.2); }
          e.evt = { id: c.id, leaving: true }; // (still kept out of small talk on their way)
          strays.add(e); strayN++;
        }
      }
      p.gone = true;
    }
    for (const o of c.obs.slice()) c.unblock(o);
    let fold = false;
    if (soft) for (const pt of c.parts) if (pt.vis && pt.s > 0.01 && onFrame(pt.pos.x, pt.pos.z, 30)) { pt.drive = null; if (!pt.gr || pt.gr.s1 > 0) pt.grow(0, 0.3); fold = true; }
    if (fold) rigClearAt = clock + 0.45; else { rig.clear(); rigClearAt = 0; }
    c.alive = false;
    try { story.sound?.ungather?.('npcev'); } catch { /* no sound */ }
    if (cur === c) { cur = null; Object.assign(npc, { active: false, id: null, quiet: false }); }
    try { story.flag(`ev.${c.id}.seen`, true); } catch { /* no save */ }
    const ld = c.load;
    stats.ended = {
      id: c.id, why: c.wrapWhy || null, t: +c.t.toFixed(1), st: +c.st.toFixed(1), wrap: c.wrapT0 != null ? +(c.t - c.wrapT0).toFixed(1) : null, soft, strays: strayN, joined: c.joined,
      // the frame: calls just before (base), its expected cost (est), the mean / peak while it ran; frame ms before / the worst 4 s median
      calls: c.base ? { base: c.base.calls, est: c.est?.calls ?? null, mean: ld.n ? +(ld.sum / ld.n).toFixed(1) : null, peak: ld.peak } : null,
      ms: c.base ? { base: +c.base.ms.toFixed(1), worst: +ld.msMax.toFixed(1) } : null,
    };
    (stats.ends ||= []).push(stats.ended); if (stats.ends.length > 30) stats.ends.shift();
    nextAt = elig + rand(T.gap[0], T.gap[1]);
  }

  // ---- once a frame while one runs
  let lingerT = 0;
  function runFrame(c, dt) {
    c.t += dt;
    // hard stop: a room, a page turn, the overview: everything goes at once (nothing of it is in view)
    if (story.inRoom || game.mode !== 'world' || save.day !== c.day || ow?.overviewOn) { endNow(c); return; }
    // the join talk: the event holds still while Maya talks with one of them
    if (c.joining) joinWatch(c, dt);
    // any talk (one of them, or someone else she tapped): the event holds still, script, props, guests and wrap-up
    const paused = !!story.talking;
    if (!paused) { c.st += dt; if (c.wrapping) c.wt += dt; }
    c.gateT = (c.gateT || 0) - dt;
    if (c.gateT <= 0) {
      c.gateT = 0.25;
      // footprints waiting for their carrier (or Maya) to step off
      for (const o of c.obs) if (o.pend && clearOf(c, o)) { o.pend = false; space.add([o]); }
      // the frame while it runs (stats), and a real slowdown: the frames of the last PERF.win s against the ones before
      // it began, for PERF.hold s on end (a brief spike of calls or a hitch never ends it)
      if (c.phase === 'run' && !paused && c.st > PERF.warm) {
        const n = callsNow(), ld = c.load;
        ld.n++; ld.sum += n; if (n > ld.peak) ld.peak = n;
        const m = frameMed(PERF.win), b = c.base?.ms || 0;
        if (m > ld.msMax) ld.msMax = m;
        const slow = b > 0 && m > b * PERF.ratio && m > b + PERF.plus && m > frameMs() * 1.1;
        c.slowT = slow && !c.noBudget && !c.wrapping ? c.slowT + 0.25 : 0;
      }
      if (!c.wrapping) {
        const why = c.joining ? '' : blockedWhy(paused);
        const d = Math.hypot(c.cx - M.x, c.cz - M.z);
        const cap = c.ev.cap || CAP.run;
        if (why) wrapUp(c, why);
        else if (d > FAR) wrapUp(c, 'far');
        else if (c.slowT >= PERF.hold) wrapUp(c, 'slow');
        // (every event ends: its own clock (a talk stands it still) + a little more for a join's walk; the wall clock at most)
        else if (c.st > cap + (c.joining ? CAP.joinMore : 0) || c.t > cap + CAP.talkMax) wrapUp(c, 'cap');
      }
    }
    // lost people (a stream took them, a day claimed them): out of the cast list
    for (const p of c.ps) if (!p.gone && p.kind === 'roam' && !alive(p)) { p.gone = true; if (p.e) p.e.evt = null; }
    for (const p of c.ps) if (!p.arrived && !p.gone && alive(p) && pAt(p)) p.arrived = true; // (got to their place once: their lines may play)
    for (const p of c.ps) {
      if (p.kind !== 'guest' || p.gone) continue;
      const e = p.e;
      if (story.people.get(e.id) !== e) { p.gone = true; continue; }
      // in a wrap-up a guest out of the frame is gone at once (also mid-walk); one left standing in view finds a way
      // out of sight (not in a talk: the close-up's frame is not the street's)
      if (c.wrapping && !paused && guestOut(e, dt)) p.gone = true;
    }
    const tA = performance.now();
    // words waiting for the chatter's slot
    for (let i = c.says.length; i--;) { const st = c.says[i]; if (!st.started && !st.done) trySay(c, st); if (st.done || st.started) c.says.splice(i, 1); }
    // the choreography
    if (!paused) for (let i = 0; i < c.tasks.length; i++) {
      const t = c.tasks[i];
      if (t.done) continue;
      if (t.wait > 0) { t.wait -= dt; continue; }
      if (t.until && !t.until()) { t.untilT += dt; if (t.untilT < 25) continue; }
      t.until = null;
      let r;
      try { r = t.gen.next(); } catch (e) { console.error('event script', c.id, e); t.done = true; if (t.main && !c.wrapping) wrapUp(c, 'error'); continue; }
      if (r.done) { t.done = true; if (t.main && !c.wrapping) wrapUp(c, 'end'); continue; }
      const y = r.value;
      if (typeof y === 'number') t.wait = y;
      else if (typeof y === 'function') { t.until = y; t.untilT = 0; }
    }
    for (let i = c.tasks.length; i--;) if (c.tasks[i].done) c.tasks.splice(i, 1);
    const tB = performance.now();
    if (!paused && !c.swept) { try { c.ev.frame?.(c, dt); } catch (e) { console.error('event frame', c.id, e); c.ev.frame = null; } }
    const tC = performance.now();
    rig.update(paused ? 0 : dt);
    const tD = performance.now();
    seg.pre = tA - fT0; seg.script = tB - tA; seg.frame = tC - tB; seg.rig = tD - tC;
    // the end: once the last of it has gone, or at the latest CAP.hard s into the wrap-up (its own clock: not in a talk,
    // whose close-up would count the props round it as out of the frame)
    if (c.wrapping && !paused) {
      lingerT += dt;
      if (lingerT > 0.25) {
        lingerT = 0;
        const wt = c.wt, late = wt > CAP.soft;
        // late: the script's last moves are cut, and everyone not yet on their way leaves now
        if (late && !c.swept) {
          c.swept = true;
          for (const t of c.tasks) t.done = true;
          for (const p of c.ps) if (!p.left && !p.gone) leave(c, p);
          try { rig.stringsOn(0); } catch { /* none */ }
        }
        // props still standing: away once out of the frame; in view they fold away (shrink), the loose ones first,
        // then the ones a townsperson holds; a guest walks off with what they carry until late
        for (const pt of c.parts) {
          if (!pt.vis || pt.s <= 0.01) continue;
          const holder = pt.held ? pt.holder : null;
          const far = Math.hypot(pt.pos.x - M.x, pt.pos.z - M.z) > 40;
          if (!onFrame(pt.pos.x, pt.pos.z, 30) || far) { pt.show(false); continue; }
          if (holder && holder.kind === 'guest' && !holder.gone && !late) continue; // (walks off with it)
          if (pt.gr && pt.gr.s1 <= 0) continue; // (folding already)
          if (late || wt > (holder ? 8 : 5)) { pt.drive = null; pt.grow(0, 0.35); }
        }
        for (const o of c.obs.slice()) { if (!c.parts.some((pt) => (pt.ob === o || o.pt === pt) && pt.vis && pt.s > 0.01)) c.unblock(o); }
        if (finished(c, late)) endNow(c, true);
        else if (wt > CAP.hard) endNow(c, true);
      }
    } else if (c.wrapping && paused && c.t - c.wrapT0 > CAP.hard + CAP.talkMax) {
      endNow(c, true); // (a talk that never closes: the wrap-up's own clock stands still in it, so the wall clock ends it)
    }
  }

  // ---- Maya joins: a tap on one of them (the dialogue box), or on the thing (the event's own action)
  function onTapHook(x, y) {
    const c = cur;
    if (!c || c.wrapping || c.phase !== 'run' || story.talking || c.joining) return false;
    let best = null, bd = 44, part = null, pd = 40;
    for (const p of c.ps) {
      if (!alive(p)) continue;
      const r = p.e.p.root.position;
      for (const hy of [0.45, (p.e.p.height || 1.1) * 0.75]) { const q = proj(r.x, hy, r.z); if (q) { const d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = p; } } }
    }
    for (const pt of c.tapParts) {
      if (!pt.vis) continue;
      const q = proj(pt.pos.x, pt.pos.y, pt.pos.z);
      if (q) { const d = Math.hypot(q.x - x, q.y - y); if (d < pd) { pd = d; part = pt; } }
    }
    if (part && (!best || pd < bd)) {
      try { c.ev.propTap?.(c, part); } catch (e) { console.error('event prop tap', c.id, e); }
      if (!c.joined) markJoined(c);
      return true;
    }
    if (best) { join(c, best); return true; }
    return false;
  }
  function join(c, p) {
    const e = p.e, line = c.L.tap;
    if (!line || !story.approach) return;
    c.joining = true; c.joinT = 0; c.joinSeen = false; c.joinP = p;
    const old = e.onTalk;
    e.onTalk = async () => { await story.dialog.say(e.id, [line], { face: 'happy' }); };
    c.joinRestore = () => { if (e.onTalk !== old) e.onTalk = old; };
    try { story.approach(e); } catch (err) { console.error('event join', err); c.joinRestore(); c.joining = false; }
  }
  function joinWatch(c, dt) {
    c.joinT += dt;
    if (story.talking) { c.joinSeen = true; return; }
    if (!c.joinSeen && c.joinT < 14) return;
    c.joinRestore?.(); c.joinRestore = null;
    c.joining = false;
    if (!c.joinSeen) return;
    mayaSays(c.L.maya, c.ev.joinFace || 'happy');
    game.maya?.emote?.(c.ev.joinEmote || 'nod');
    const mp = game.maya.root.position;
    c.burst(c.ev.joinFx || 'sparkle', mp.x, 1.5, mp.z, { count: 8, spread: 0.35, up: 0.6 });
    sfx.play('chimes', 0.6, 0);
    try { c.ev.onJoin?.(c, c.joinP); } catch (e) { console.error('event join', c.id, e); }
    markJoined(c);
  }
  function markJoined(c) { c.joined = true; try { story.flag(`ev.${c.id}.joined`, true); } catch { /* no save */ } }
  function mayaSays(line, face = 'happy') {
    if (!line) return;
    try { game.maya?.setFace?.(face, 2.6); game.ui?.bark?.(tr(line), { face: game.maya?.faceCanvas?.(face) }); } catch { /* no ui */ }
  }
  story.tapHooks = story.tapHooks || [];
  story.tapHooks.push(onTapHook);

  // ---- later chatter about what she saw (flag ev.<id>.seen); the chatter may be installed after this module
  let mentionsIn = false;
  function addMentions() {
    const ch = story.chatter;
    if (mentionsIn || !ch?.ready) return;
    mentionsIn = true;
    ch.ready.then(() => {
      const table = {};
      for (const ev of EVENTS) for (const l of MENTIONS[ev.id] || []) for (const d of ev.towns) {
        const t = (table[d] ||= { town: [] });
        t.town.push({ my: l.my, en: l.en, flag: `ev.${ev.id}.seen` });
      }
      ch.addLines(table);
    }).catch((e) => console.error('event mentions', e));
  }

  // ---- the scheduler
  let clock = 0, acc = 0, elig = 0, nextAt = T.first, lastBlock = -1e9, lastArrive = -1e9;
  let arriveHooked = false;
  const hookArrive = () => { if (arriveHooked || !story.events?.on) return; arriveHooked = true; story.events.on('town:arrive', () => { lastArrive = clock; }); }; // (story.events comes with the chatter)
  hookArrive();
  function chooseEvent(o = {}) {
    const b = baseNow();
    const ok = EVENTS.filter((ev) => !eligibleWhy(ev, o) && !budgetWhy(ev, b)); // (only those that fit the frame now)
    if (!ok.length) return null;
    let sum = 0;
    for (const ev of ok) sum += ev.weight || 1;
    let r = Math.random() * sum;
    for (const ev of ok) { r -= ev.weight || 1; if (r <= 0) return ev; }
    return ok[ok.length - 1];
  }
  function startPlan(ev, o = {}) {
    if (cur || job) return false;
    if (rigClearAt) { rig.clear(); rigClearAt = 0; } // (the last one's props still folding away: gone now)
    job = planJob(ev, o);
    return true;
  }
  function schedule() {
    if (cur || job) return;
    const why = blockedWhy();
    if (why) { lastBlock = clock; return; }
    if (clock - lastBlock < T.afterGate || clock - lastArrive < T.afterArrive) return;
    elig += 1;
    if (elig < nextAt || Math.random() > T.roll) return;
    if (startWhy()) return;
    const ev = chooseEvent();
    if (!ev) { nextAt = elig + rand(T.retry[0], T.retry[1]); return; }
    startPlan(ev);
  }

  // the tab hidden: the game (and the event) stands still; back after a long while, the gathering is over (wraps up)
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = performance.now(); return; }
    if (hiddenAt && cur && !cur.wrapping && performance.now() - hiddenAt > 30000) wrapUp(cur, 'hidden');
    hiddenAt = 0;
  });

  story.ticks = story.ticks || [];
  story.ticks.push((dt) => {
    if (!dt || !game.maya?.root) return;
    const t0 = (fT0 = performance.now()), busy0 = !!(job || cur);
    seg.pre = seg.script = seg.frame = seg.rig = 0;
    try {
      clock += dt;
      const mp = mayaPos(); M.x = mp.x; M.z = mp.z;
      // the frame's load: every frame's time (a hidden tab's gap or a stall over 250 ms is not a frame), and the calls
      // and triangles outdoors while nothing of an event is in the scene
      if (FR.last && !document.hidden) { const d = t0 - FR.last; if (d > 0 && d < 250) { FR.d[FR.i] = d; FR.i = (FR.i + 1) % FR.d.length; if (FR.n < FR.d.length) FR.n++; } }
      FR.last = t0;
      if ((CR.t -= dt) <= 0) {
        CR.t = 0.1;
        if (!cur && !rigClearAt && !strays.size && game.mode === 'world' && !story.inRoom) { CR.calls[CR.i] = callsNow(); CR.tris[CR.i] = trisNow(); CR.i = (CR.i + 1) % CR.calls.length; if (CR.n < CR.calls.length) CR.n++; }
      }
      domT -= dt;
      if (domT <= 0) { domT = 0.3; domBlock = !!document.querySelector(DOM_BLOCK); }
      if (job) {
        const j = job;
        let r;
        try { r = j.next(); } catch (e) { console.error('event plan', e); r = { done: true }; if (cur && cur.phase === 'gather') wrapUp(cur, 'error'); }
        if (r.done) job = null;
      }
      const tJ = performance.now();
      seg.job = tJ - t0;
      if (cur) runFrame(cur, dt);
      else if (rigClearAt) { rig.update(dt); if (clock >= rigClearAt) { rig.clear(); rigClearAt = 0; } } // (the last props folding away)
      if (strays.size && !story.talking) straysFrame(dt); // (in a talk they stand still: guestStep)
      seg.pre = Math.max(0, seg.pre - seg.job);
      acc += dt;
      if (acc >= 1) { acc = 0; if (!mentionsIn) addMentions(); if (!arriveHooked) hookArrive(); schedule(); }
    } finally {
      const ms = performance.now() - t0;
      stats.ms = stats.ms * 0.95 + ms * 0.05; stats.frames++;
      if (!busy0) stats.idleMax = Math.max(stats.idleMax || 0, ms);
      else if (ms > stats.msMax) { stats.msMax = ms; stats.spike = { ms: +ms.toFixed(1), job: !!job, phase: cur?.phase || null, id: cur?.id || null, t: cur ? +cur.t.toFixed(1) : null, at: planAt, job: +(seg.job || 0).toFixed(1), pre: +seg.pre.toFixed(1), script: +seg.script.toFixed(1), frame: +seg.frame.toFixed(1), rig: +seg.rig.toFixed(1) }; }
    }
  });

  // ---- debug and tests
  const debug = {
    list: () => EVENTS.map((ev) => ({ id: ev.id, why: eligibleWhy(ev) })),
    trigger(id, o = {}) {
      const ev = EVENTS.find((x) => x.id === id);
      if (!ev) return 'unknown';
      if (cur || job) return 'busy';
      const why = blockedWhy();
      if (why && !o.force) return 'gate:' + why;
      const e = eligibleWhy(ev, { anyTime: o.anyTime !== false });
      if (e) return e;
      startPlan(ev, { at: o.x != null ? { x: o.x, z: o.z } : null, noBudget: !!o.noBudget });
      return 'planning';
    },
    force(id, o = {}) { return debug.trigger(id, o); },
    state() {
      const c = cur;
      if (!c) return { active: false, planning: !!job, lastWhy: jobWhy, nextIn: +(nextAt - elig).toFixed(0), elig: Math.round(elig), strays: strays.size, folding: !!rigClearAt };
      return {
        active: true, id: c.id, phase: c.phase, t: +c.t.toFixed(1), st: +c.st.toFixed(1), wrapping: c.wrapping, wt: c.wrapping ? +c.wt.toFixed(1) : null, why: c.wrapWhy || null, x: +c.cx.toFixed(1), z: +c.cz.toFixed(1), s: c.s, strays: strays.size,
        people: c.ps.map((p) => { const q = p.e.p.root.position, g = p.kind === 'guest' ? p.e.g : null; return { id: p.e.id, slot: p.slot, kind: p.kind, gone: !!p.gone, at: alive(p) ? pAt(p) : null, arr: !!p.arrived, d: g && g.tx != null ? +Math.hypot(g.tx - q.x, g.tz - q.z).toFixed(1) : undefined, off: alive(p) ? offFrame(q.x, q.z) : undefined }; }),
        props: rig.stats(), calls: callsNow(), tris: trisNow(), base: c.base && { calls: c.base.calls, tris: c.base.tris, ms: +c.base.ms.toFixed(1) }, est: c.est, ms: +frameMed(PERF.win).toFixed(1), slowT: c.slowT, pend: c.obs.filter((o) => o.pend).length, obs: c.obs.length, joined: c.joined, tasks: c.tasks.filter((t) => !t.done).length, inView: inViewC(c.cx, c.cz),
        maya: [+M.x.toFixed(1), +M.z.toFixed(1)], parts: c.parts.filter((pt) => pt.vis && pt.s > 0.01).map((pt) => pt.kind + (pt.held ? '@' + (pt.holder?.e?.id || '?') : '')),
      };
    },
    why: () => ({ gate: blockedWhy(), start: startWhy(), last: jobWhy, fails: { ...lastFails } }),
    /** (tests) the frame's load now: base medians, the tier's allowance, each event's expected cost and whether it fits */
    load: () => { const b = baseNow(); return { tier: game.tier, allow: allow(), base: { calls: b.calls, tris: b.tris, ms: +b.ms.toFixed(1) }, ms4: +frameMed(PERF.win).toFixed(1), person: { ...PC }, fit: EVENTS.map((ev) => ev.id + ':' + costOf(ev).calls + (budgetWhy(ev, b) ? 'x' : '')).join(' ') }; },
    end() { if (cur) wrapUp(cur, 'debug'); return !!cur; },
    stop() { if (cur) endNow(cur); job = null; return true; },
    stats: () => ({ ...stats, ms: +stats.ms.toFixed(3), msMax: +stats.msMax.toFixed(2), planMsMax: +stats.planMsMax.toFixed(2), elig: Math.round(elig), nextAt: Math.round(nextAt) }),
    tap: (x, y) => onTapHook(x, y),
    /** (tests) a free point south of the running one with a clear line to it: where to stand to watch */
    viewSpot() {
      const c = cur;
      if (!c) return null;
      for (const dz of [6.5, 5.5, 8, 9.5, 4.5, 11]) for (const dx of [0, 1.5, -1.5, 3, -3, 4.5, -4.5]) {
        const x = c.cx + dx, z = c.cz + dz;
        if (solid(x, z, 0.45) || !lineOk(x, z, c.cx, c.cz, 0.15, 0)) continue;
        if (Object.values(c.spots).some((q) => Math.hypot(q.x - x, q.z - z) < 2)) continue;
        return { x: +x.toFixed(2), z: +z.toFixed(2) };
      }
      return null;
    },
    join(slot) { const c = cur; const p = c && (c.p(slot) || c.all()[0]); if (!p) return false; join(c, p); return true; },
    /** (tests: a real tap there) where a participant is on screen (their chest), CSS pixels, or null; slot omitted: the
     *  one nearest the middle of the screen that is on it */
    screenOf(slot) {
      const c = cur;
      if (!c) return null;
      const list = (slot ? [c.p(slot)] : c.all()).filter((p) => p && alive(p));
      let best = null, bd = 1e9;
      for (const p of list) {
        const r = p.e.p.root.position, q = proj(r.x, (p.e.p.height || 1.1) * 0.75, r.z);
        if (!q || q.x < 20 || q.x > W() - 20 || q.y < H() * 0.15 || q.y > H() * 0.8) continue;
        if (q.x > W() - 140 && q.y < 230) continue; // (test hook only: the minimap stamp sits there and a tap on it opens the map)
        const d = Math.hypot(q.x - W() / 2, q.y - H() / 2);
        if (d < bd) { bd = d; best = [Math.round(q.x), Math.round(q.y)]; }
      }
      return best;
    },
    /** (tests) where the event's tappable prop is on screen, or null */
    partScreen() {
      const c = cur;
      for (const pt of c?.tapParts || []) { if (!pt.vis) continue; const q = proj(pt.pos.x, pt.pos.y, pt.pos.z); if (q && q.x > 10 && q.x < W() - 10 && q.y > H() * 0.12 && q.y < H() * 0.85) return [Math.round(q.x), Math.round(q.y)]; }
      return null;
    },
    get strays() { return strays.size; },
    /** (tests) the way out of sight from (x, z) (Maya's spot when omitted), the whole search at once */
    hideWay(x, z) {
      if (x == null) { const mp = mayaPos(); x = mp.x + 0.8; z = mp.z; }
      const out = {}, t0 = performance.now(), g = hideWayG(x, z, BODY, out);
      fT0 = -1e9; // (no frame budget in a test call)
      while (!g.next().done);
      return { ms: +(performance.now() - t0).toFixed(1), legs: out.route ? out.route.map((q) => [+q.x.toFixed(1), +q.z.toFixed(1)]) : null, from: [+x.toFixed(1), +z.toFixed(1)] };
    },
    resetDay() { save.ev = null; story.persist?.(); return true; },
    soon(s = 1) { nextAt = elig + s; return nextAt; },
    get cur() { return cur; },
    rig,
  };
  npc.debug = debug;
  window.__ev = window.__events = debug;
  return npc;
}
