// Ko Hein Htet (ကိုဟိန်းထက်): the young man in the red suit who is always running, wired into story mode.
// story.js calls installHeinHtet(game, story, openWorld) once (a dynamic import, like the other extras).
//
// One person, a running gag: he turns up wherever Maya is, in every town, and is gone again (taken out of the scene)
// between appearances. His look and animations: heinhtet/look.js. Every word he says: heinhtet/lines.js.
//
//   APPEARANCES  while Maya is outdoors and nothing story-ish is on, every 70-150 s of such time:
//     dash   (about half) he bolts across the screen from edge to edge, now and then a tiny shout ("Sorry!");
//            also while she drives (across a side street or along the pavement, never into the car's way)
//     meet   (about a third, on foot, when a townsperson stands near) he skids to a stop by them and plays one of
//            the town's meets (speech bubbles over both heads), then sprints off; each meet once before repeats
//     pass   (the rest) he runs past with a bark (the town's own or a general one), or skids, does a bit, runs on;
//            about 1 in 5 appearances includes a sung line (♪, a little sway; no audio, no real melody)
//   WALK-UP  rare: at most once per story day, never before Day 2, after 4+ min of walking outdoors that day: he
//            runs up to her, skids, a walkup plays in the dialogue box, a bye bubble, he sprints off
//   CAR DASH a 3-15 min gap of actual driving time between them, never Day 1: he dashes across the road some metres
//            ahead; the car brakes and holds still 2-4 s (the stick is ignored), his line, her reply, driving resumes
//   CAR BLOCK rarer: at most once per 2 story days, never Day 1, on a straight road at speed: he leaps into the road
//            ahead, the car brakes to a stop well before him, a carBlock plays in the dialogue box, he hops aside
//   MENTIONS lines.js `mentions` go into the town chatter (chatter.addLines): townsfolk talk about him; he never
//            says those himself
//
// Never: during a talk, a scene, a town intro, a page turn, a room, carrying / cargo, an act, when the day owns
// 'heinhtet' (story.day.owns('heinhtet')), or while the frame draws more than CALL_CAP calls. If one starts while he
// is out, he finishes the bubble showing and runs off. He never points the way, never says where anything is.
// He is not in story.people: the chatter never picks him as a speaker, Maya's taps never reach him.
//
// Cost: one people.js person (4 draw calls, ~1.6k triangles, props merged), only while on stage; created once and
// kept out of the scene in between.
//
// Tests: window.__hh = story.heinhtet = { state, spawnNear(kind), meet(), walkup(id), carBlock(id), carDash(id),
//   stats(), debug: { spawnNow(kind), walkupNow(id), carBlockNow(id), carDashNow(id), force, ... } }
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { pointAt, tangentAt } from '../game/world/roads.js';
import { createHeinHtet } from './heinhtet/look.js';
import LINES from './heinhtet/lines.js';
import { PEOPLE as REGION_PEOPLE, REGION_FILES, regionAt, bookDist } from './world/region.js';
import { DOORS } from './doors.js';
import { reserveNames } from './folknames.js';

const NAME = { my: 'ကိုဟိန်းထက်', en: 'Ko Hein Htet' };
// DRAFT(my): the tiny shouts of a screen dash (owner: "at most a tiny shout bubble like Sorry! / Late!")
const SHOUTS = [
  { my: 'ဆောရီး!', en: 'Sorry!' },
  { my: 'နောက်ကျပြီ!', en: 'Late!' },
  { my: 'ဖယ်ပါ ဖယ်ပါ!', en: 'Coming through!' },
  { my: 'အရေးကြီးတယ်!', en: 'Urgent!' },
  { my: 'မှီသေးတယ်! မှီသေးတယ်!', en: 'Still time! Still time!' },
  { my: 'ဟိုင်း! ဘိုင်!', en: 'Hi! Bye!' },
];
const TOWNS = ['home', 'exercise', 'envelope', 'market', 'wharf', 'junction', 'hearth', 'garden', 'blank'];
const ANIMS_STOP = ['checkWatch', 'catchBreath', 'stretch', 'pocketSearch', 'spin', 'tieShoe', 'fanSelf', 'juggle', 'trip', 'facepalm', 'shrug'];

// ---- tuning (seconds, metres)
const GAP = [45, 100]; // between appearances (eligible outdoor time only)
const FIRST = [18, 40];
const TOWN_NEW = [10, 22]; // a town she has just come into: he turns up there soon (after her arrival thought)
const MEET_WAIT = 25; // a meet with nobody near: keep looking this long (she walks on), then a pass instead
const SHARE = { dash: 0.44, meet: 0.36 }; // the rest: pass
const SING = { pass: 0.5, meet: 0.12, dash: 0.14 };
const WALKUP = { after: 200, every: 15, chance: 0.16, fromDay: 2 };
const DASH_GAP = [120, 420]; // car dash: actual driving time
const BLOCK = { fromDay: 2, everyDays: 2, check: 5, chance: 0.05, minDrive: 120, speed: 4.6 };
// his own 4 calls on top of the frame stay under the cap the town chatter keeps (72), never past the triangle budget
const CALL_CAP = 68, CALL_LEAVE = 80, TRI_CAP = 152000;
const SPEED = { jog: 3.2, run: 4.4, dash: [4.8, 6], sprint: 6 };
const KEEP = { door: 1.4, spot: 1.25, cast: 1.4, folk: 0.75, maya: 1.1, car: 2.4 };

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('my', { granularity: 'grapheme' }) : null;
const glen = (s) => (segmenter ? Array.from(segmenter.segment(String(s))).length : Array.from(String(s)).length);
const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);

export function installHeinHtet(game, story, ow) {
  if (story.heinhtet) return story.heinhtet;
  injectStyle();
  const save = story.save;
  const gameEl = document.getElementById('game') || document.body;
  const scene = game.world.scene;
  const v = new THREE.Vector3(), w = new THREE.Vector3(), T = { x: 0, z: 0 }, T2 = { x: 0, z: 0 };
  const W = () => game.viewW || window.innerWidth, H = () => game.viewH || window.innerHeight;
  const AMBIENT_IDS = new Set(REGION_PEOPLE.map((p) => p.id));
  try { reserveNames([NAME]); } catch { /* names module missing */ }

  // ---- the save (story progress, mirrored to the cloud later): what he has said / done
  const hs = () => {
    const h = (save.hh ||= {});
    h.meets ||= {}; h.walk ||= {}; h.block ||= {}; h.dash ||= {};
    if (typeof h.dashIn !== 'number' || !Number.isFinite(h.dashIn)) h.dashIn = rand(DASH_GAP[0], DASH_GAP[1]);
    return h;
  };
  hs();
  const persistSoon = (() => { let t = 0; return () => { clearTimeout(t); t = setTimeout(() => story.persist?.(), 400); }; })();

  // ---- per-viewer convenience: which barks were said lately (least recently used first)
  const STORE = 'rc-hh-v1';
  let used = {};
  try { used = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch { used = {}; }
  let useSeq = Object.values(used).reduce((a, b) => Math.max(a, +b || 0), 0);
  const markUsed = (k) => { used[k] = ++useSeq; try { localStorage.setItem(STORE, JSON.stringify(used)); } catch { /* private mode */ } };
  function pickLRU(items) {
    if (!items.length) return null;
    const fresh = items.filter((it) => !used[it.key]);
    if (fresh.length) return pick(fresh);
    const s = items.slice().sort((a, b) => used[a.key] - used[b.key]);
    return pick(s.slice(0, Math.max(1, Math.ceil(s.length / 4))));
  }

  // ---- when: { days, from, to, flag, notFlag, weather: 'rain'|'dry', time: 'day'|'evening'|'night' }
  const raining = () => save.weather === 'rain' || save.weather === 'drizzle';
  function period() { const p = game.day?.period || 'noon'; return p === 'morning' || p === 'noon' ? 'day' : p; }
  function whenOK(wh) {
    if (!wh) return true;
    const day = save.day || 1;
    if (wh.from != null && day < wh.from) return false;
    if (wh.to != null && day > wh.to) return false;
    if (Array.isArray(wh.days) && !wh.days.includes(day)) return false;
    for (const f of [].concat(wh.flag || [])) { const neg = f[0] === '!'; if (!!save.flags?.[neg ? f.slice(1) : f] === neg) return false; }
    for (const f of [].concat(wh.notFlag || [])) if (save.flags?.[f]) return false;
    if (wh.weather === 'rain' && !raining()) return false;
    if (wh.weather === 'dry' && raining()) return false;
    if (wh.time && wh.time !== period()) return false;
    return true;
  }

  // ---- where things are
  const mayaXZ = () => game.maya.root.getWorldPosition(w).clone();
  const districtAt = (x, z) => (bookDist(x, z) <= 0 ? 'home' : regionAt(x, z)?.id || null);
  const driving = () => !story.footActive && game.mode === 'world' && !story.inRoom;
  const drive = () => game.world.drive;
  const carSpeed = () => Math.abs(drive()?.state?.speed || 0);
  const callsNow = () => game.renderer?.info?.render?.calls || 0;
  const trisNow = () => game.renderer?.info?.render?.triangles || 0;
  const dayOwns = (id) => { try { return typeof story.day?.owns === 'function' && !!story.day.owns(id); } catch { return false; } };
  const keepSpots = [];
  for (const m of REGION_FILES) {
    const add = (o) => { if (o && Number.isFinite(o.x) && Number.isFinite(o.z)) keepSpots.push(o); };
    for (const s of Object.values(m.SPOTS || {})) (Array.isArray(s) ? s : [s]).forEach(add);
    for (const d of [].concat(m.DESKS || [])) add(d);
  }
  for (const p of REGION_PEOPLE) if (p.job?.spot) keepSpots.push(p.job.spot);
  const folkish = (e) => !!e.folk || AMBIENT_IDS.has(e.id) || !!e.cast?.ambient;

  // camera basis on the ground: right (screen x) and up (screen y, away from the lens)
  const cam = { rx: 1, rz: 0, fx: 0, fz: -1 };
  function camBasis() {
    game.camera.updateMatrixWorld();
    const e = game.camera.matrixWorld.elements;
    let l = Math.hypot(e[0], e[2]) || 1; cam.rx = e[0] / l; cam.rz = e[2] / l;
    l = Math.hypot(e[8], e[10]) || 1; cam.fx = -e[8] / l; cam.fz = -e[10] / l;
    return cam;
  }
  const proj = (x, y, z) => (game.rig?.project ? game.rig.project(v.set(x, y, z), W(), H()) : null);
  function offScreen(x, z, m = 40) {
    for (const y of [0.05, 1.5]) { const q = proj(x, y, z); if (q && q.x > -m && q.x < W() + m && q.y > -m && q.y < H() + m) return false; }
    return true;
  }
  function inView(x, z, box = [0.06, 0.08, 0.94, 0.86]) {
    const q = proj(x, 1.0, z);
    return !!q && q.x > W() * box[0] && q.x < W() * box[2] && q.y > H() * box[1] && q.y < H() * box[3];
  }
  // the doors and story spots round here (refreshed as he plans; hundreds of doors in the whole land)
  const local = { at: null, x: 0, z: 0, doors: [], spots: [] };
  function refreshLocal(x, z) {
    local.at = clock; local.x = x; local.z = z;
    local.doors = Object.values(DOORS).filter((d) => d && Number.isFinite(d.x) && Math.hypot(x - d.x, z - d.z) < 75);
    local.spots = keepSpots.filter((d) => Math.hypot(x - d.x, z - d.z) < 75);
  }
  // nothing between the lens and him (a house roof hid him once): rays at his head, chest and shins.
  // What the see-through hole (cutaway.js) cuts away does not hide him: its state is read off ow.cut as
  // index.js sets it every frame, and a ray hit on a fragment that shader discards is ignored.
  const ray = new THREE.Raycaster();
  const isMine = (o) => { for (let q = o; q; q = q.parent) if (q.userData?.isPerson || q === game.maya.root || q === game.car?.root) return true; return false; };
  const cutS = { a: new THREE.Vector3(), b: new THREE.Vector4(), n: 0, bl: [] };
  const cutMats = new Set();
  const cutObj = ow?.cut;
  if (cutObj && typeof cutObj.set === 'function') {
    for (const k of ['solid', 'outline', 'outline14', 'trees']) if (cutObj[k]) cutMats.add(cutObj[k]);
    if (!cutObj.__hhWrapped) {
      cutObj.__hhWrapped = true;
      const set0 = cutObj.set, bl0 = cutObj.blocker;
      cutObj.set = function (cm, target, lens, near = 0) {
        cutObj.__hh = cutObj.__hh || cutS;
        cutObj.__hh.a.copy(cm); cutObj.__hh.b.set(target.x, target.y, target.z, lens); cutObj.__hh.n = near;
        return set0.call(this, cm, target, lens, near);
      };
      if (typeof bl0 === 'function') {
        cutObj.blocker = function (k, x, z, fade, keepBelow = 0.45) {
          (cutObj.__hh = cutObj.__hh || cutS).bl[k] = { x, z, fade, keep: keepBelow };
          return bl0.call(this, k, x, z, fade, keepBelow);
        };
      }
    }
  }
  const CS = () => cutObj?.__hh || cutS;
  const m4 = new THREE.Matrix4(), va = new THREE.Vector3(), rd = new THREE.Vector3();
  function cutAway(h) {
    const o = h.object, mat = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!cutMats.has(mat)) return false;
    const s = CS();
    let ax = 0, az = 0, anch = false;
    if (o.isInstancedMesh && h.instanceId != null) {
      o.getMatrixAt(h.instanceId, m4); va.setFromMatrixPosition(m4).applyMatrix4(o.matrixWorld); ax = va.x; az = va.z; anch = true;
    } else {
      const at = o.geometry?.attributes?.cutAnchor;
      if (at && h.face && at.getZ(h.face.a) > 0.5) { ax = at.getX(h.face.a); az = at.getY(h.face.a); anch = true; }
    }
    if (anch) {
      if (s.n > 0) {
        const cdx = s.b.x - s.a.x, cdz = s.b.z - s.a.z;
        const ti = ((ax - s.a.x) * cdx + (az - s.a.z) * cdz) / Math.max(cdx * cdx + cdz * cdz, 1e-3);
        if (ti < s.n - 0.05) return true;
      }
      const outline = mat === cutObj?.outline || mat === cutObj?.outline14;
      for (const b of s.bl) if (b && b.fade > 0.5 && Math.abs(ax - b.x) + Math.abs(az - b.z) < 0.02 && h.point.y > (outline ? -1 : b.keep)) return true;
    }
    if (s.b.w > 0 && h.point.y > 0.12 && h.point.distanceTo(s.a) < 4) return true;
    return false;
  }
  function seen(x, z) {
    const c = game.camera.position;
    for (const y of [1.25, 0.75, 0.3]) {
      v.set(x, y, z);
      const d = v.distanceTo(c);
      ray.set(c, rd.copy(v).sub(c).normalize());
      ray.far = d - 0.4; ray.camera = game.camera;
      const hits = ray.intersectObjects(scene.children, true);
      if (hits.some((h) => h.object.visible && !h.object.userData?.isOutline && !h.object.isSprite && !h.object.isPoints && !isMine(h.object) && !cutAway(h))) return false;
    }
    return true;
  }
  // big enough on screen to read (the Home Book's high lens made him a speck once): at least about as tall
  // as Maya herself looks, and never under a floor in pixels
  function bigEnough(x, z) {
    const a = proj(x, 0, z), b = proj(x, 1.3, z);
    if (!a || !b) return false;
    const px = Math.hypot(a.x - b.x, a.y - b.y);
    const mp = mayaXZ(), ma = proj(mp.x, 0, mp.z), mb = proj(mp.x, 1.3, mp.z);
    const mpx = ma && mb ? Math.hypot(ma.x - mb.x, ma.y - mb.y) : 0;
    return px >= Math.max(W() * (driving() ? 0.06 : 0.08), mpx * 0.8);
  }
  /** may he stand / run here? o: { allow: entry, mayaR, noCar, avoidCarPath } */
  const whyNot = {}; // (tests) what stopped his paths
  const no = (k) => { whyNot[k] = (whyNot[k] || 0) + 1; return false; };
  function clearAt(x, z, o = {}) {
    if (ow?.space?.collides?.(x, z, 0.3)) return no('space');
    if (local.at == null || clock - local.at > 1 || Math.hypot(x - local.x, z - local.z) > 30) refreshLocal(x, z);
    // (running past a door or a spot is fine; standing on one is not)
    const kd = o.run ? 0.75 : KEEP.door, ks = o.run ? 0.7 : KEEP.spot;
    for (const d of local.doors) if (Math.hypot(x - d.x, z - d.z) < kd) return no('door');
    for (const s of local.spots) if (Math.hypot(x - s.x, z - s.z) < ks) return no('spot');
    for (const e of story.people.values()) {
      if (e === o.allow) continue;
      const p = e.p?.root?.position;
      if (p && e.p.root.parent && Math.hypot(x - p.x, z - p.z) < (folkish(e) ? KEEP.folk : KEEP.cast)) return no('person');
    }
    const mp = game.maya.root.getWorldPosition(w);
    if (!o.noMaya && Math.hypot(x - mp.x, z - mp.z) < (o.mayaR ?? KEEP.maya)) return no('maya');
    const car = game.car?.root;
    if (!o.noCar && car?.parent && car.visible !== false && Math.hypot(x - car.position.x, z - car.position.z) < (o.carR ?? (driving() ? KEEP.car : 1.7))) return no('car');
    if (o.avoidCarPath && driving()) { // never into the car's way (its next ~25 m)
      const h = drive().state.heading, cx = car.position.x, cz = car.position.z, fx = Math.sin(h), fz = Math.cos(h);
      const along = (x - cx) * fx + (z - cz) * fz, side = Math.abs((x - cx) * fz - (z - cz) * fx);
      if (along > -3 && along < 26 && side < 2.6) return no('carPath');
    }
    return true;
  }
  /** from (x, z) along (dx, dz) until he is off screen (+ a little), side-stepping round props on the way (up to
   * 2.5 m off the line): the points (the last one off screen), or null if the way is shut */
  const LATS = [0, 0.35, -0.35, 0.7, -0.7, 1.05, -1.05];
  function extendOff(x, z, dx, dz, o = {}) {
    const step = 0.35, max = o.max ?? 42, nx = -dz, nz = dx;
    const ro = { ...o, run: true };
    let lat = 0, off = -1;
    const pts = [];
    for (let t = step; t <= max; t += step) {
      if (off >= 0) {
        if (t >= off + 1.4) { pts.push({ x: x + dx * t + nx * lat, z: z + dz * t + nz * lat }); return pts; }
        continue;
      }
      let ok = false;
      for (const dl of LATS) {
        const l2 = lat + dl;
        if (Math.abs(l2) > 2.5) continue;
        const qx = x + dx * t + nx * l2, qz = z + dz * t + nz * l2;
        if (!clearAt(qx, qz, ro)) continue;
        lat = l2; ok = true;
        pts.push({ x: qx, z: qz });
        if (offScreen(qx, qz)) off = t;
        break;
      }
      if (!ok) return null;
    }
    return null;
  }
  /** along the roads from a point on an edge (lat: metres off the centre line), until off screen */
  function roadOff(edge, s0, dir, lat0, o = {}) {
    const step = 0.4, ro = { ...o, run: true }, latMax = o.latMax ?? 2.2;
    let e = edge, s = s0, d = dir, lat = lat0, off = -1, run = 0;
    const pts = [], P3 = new THREE.Vector3(), Tn = { x: 0, z: 0 };
    for (let guard = 0; guard < (o.guard ?? 140); guard++) {
      s += d * step; run += step;
      if (s < 0 || s > e.length) {
        const nd = s < 0 ? e.a : e.b;
        tangentAt(e, s < 0 ? 0 : e.length, Tn);
        const hx = Tn.x * d, hz = Tn.z * d;
        let best = null, bs = -2, bd = 1;
        for (const e2 of nd.edges || []) {
          if (e2 === e || (ow.net.isOpen && !ow.net.isOpen(e2)) || e2.gate) continue;
          const dd = e2.a === nd ? 1 : -1;
          tangentAt(e2, dd === 1 ? 0 : e2.length, T2);
          const sc = T2.x * dd * hx + T2.z * dd * hz;
          if (sc > bs) { bs = sc; best = e2; bd = dd; }
        }
        if (!best || bs < 0.2) return null;
        // (lat is measured off the edge's own direction: the same side of the street on an edge that runs the other way flips sign)
        if (bd !== d) lat = -lat;
        e = best; d = bd; s = d === 1 ? step : e.length - step;
      }
      pointAt(e, s, P3); tangentAt(e, s, Tn);
      const nx = -Tn.z, nz = Tn.x;
      if (off >= 0) { if (run >= off + 1.4) { pts.push({ x: P3.x + nx * lat, z: P3.z + nz * lat }); return pts; } continue; }
      let ok = false;
      for (const dl of LATS) {
        const l2 = lat + dl;
        if (Math.abs(l2) > latMax) continue;
        const qx = P3.x + nx * l2, qz = P3.z + nz * l2;
        if (!clearAt(qx, qz, ro)) continue;
        lat = l2; ok = true; pts.push({ x: qx, z: qz });
        if (offScreen(qx, qz)) off = run;
        break;
      }
      if (!ok) return null;
    }
    return null;
  }
  /** along d1 (a side street, or just off the road) until off screen, or until blocked (>= minL), then along d2 */
  function bentOff(x, z, d1, d2, o = {}) {
    const step = 0.3, max = o.max1 ?? 24, minL = o.minL ?? 1.9;
    let last = 0;
    for (let t = step; t <= max; t += step) {
      const qx = x + d1.x * t, qz = z + d1.z * t;
      if (!clearAt(qx, qz, { ...o, run: true })) break;
      last = t;
      if (offScreen(qx, qz)) return [{ x: x + d1.x * (t + 1.4), z: z + d1.z * (t + 1.4) }];
    }
    if (last < minL) return null;
    const L = Math.min(last, o.cornerMax ?? 3.4);
    const k = { x: x + d1.x * L, z: z + d1.z * L };
    const end = extendOff(k.x, k.z, d2.x, d2.z, o);
    return end ? [k, ...end] : null;
  }

  // ---- the person (made once, kept out of the scene between appearances)
  let hh = null;
  function ensureActor() {
    if (hh) return hh;
    hh = createHeinHtet();
    hh.root.userData.isPerson = true;
    hh.root.userData.heinhtet = true;
    return hh;
  }
  setTimeout(() => { try { ensureActor(); } catch (e) { console.error('heinhtet look', e); } }, 5000);

  // ---- speech bubbles (his own pool: chatter's look, positioned from 3D while showing)
  const pool = [];
  for (let i = 0; i < 2; i++) {
    const el = document.createElement('div');
    el.className = 'hh-chat';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<p></p>';
    gameEl.appendChild(el);
    pool.push({ el, text: el.firstChild, on: false, p: null, line: null, until: 0, w: 0, h: 0, x: -1, y: -1, tx: -1, fade: 0, maya: false });
  }
  function setText(el, s) {
    el.textContent = '';
    for (const part of String(s).split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part) || glen(part) > 14) { el.appendChild(document.createTextNode(part)); continue; }
      const sp = document.createElement('span'); sp.className = 'nw'; sp.textContent = part; el.appendChild(sp);
    }
  }
  const msFor = (line) => Math.min(5200, Math.max(2200, 1800 + glen(tr(line)) * 62));
  let clock = 0;
  function bubble(p, line, ms, cls = '') {
    const b = pool.find((x) => !x.on && !x.fade) || pool.find((x) => !x.on) || pool[0];
    b.on = true; b.fade = 0; b.p = p; b.line = line; b.until = clock + (ms || msFor(line)) / 1000;
    b.el.className = 'hh-chat' + (cls ? ' ' + cls : '');
    setText(b.text, tr(line));
    b.el.style.visibility = 'hidden';
    b.el.classList.add('show');
    b.w = b.el.offsetWidth; b.h = b.el.offsetHeight; b.x = b.y = b.tx = -1;
    call(p, 'talk', Math.min(4, (b.until - clock) * 0.6));
    placeBubble(b);
    return b;
  }
  function unbubble(b, quick) {
    if (!b?.on) return;
    b.on = false; b.el.classList.remove('show'); b.fade = quick ? 0 : 0.25;
    if (quick) b.el.style.visibility = 'hidden';
    try { call(b.p, 'talk', 0); } catch { /* ignore */ }
  }
  function placeBubble(b) {
    const p = b.p;
    if (!p?.root?.parent) { b.el.style.visibility = 'hidden'; return; }
    p.root.getWorldPosition(v); v.y += (p.height || 1.3) + 0.34;
    const q = game.rig?.project ? game.rig.project(v, W(), H()) : null;
    if (!q || q.x < -30 || q.x > W() + 30 || q.y < 20 || q.y > H() + 20) { b.el.style.visibility = 'hidden'; return; }
    b.el.style.visibility = 'visible';
    const half = b.w / 2;
    const x = Math.round(Math.min(Math.max(q.x, 10 + half), W() - 10 - half));
    const y = Math.round(Math.max(q.y - b.h - 8, 58));
    const tx = Math.round(Math.min(Math.max(q.x - x + half, 14), b.w - 14));
    if (x !== b.x || y !== b.y) { b.x = x; b.y = y; b.el.style.transform = `translate3d(${x - half}px, ${y}px, 0)`; }
    if (tx !== b.tx) { b.tx = tx; b.el.style.setProperty('--tx', `${tx}px`); }
  }
  function tickBubbles(dt) {
    for (const b of pool) {
      if (b.on) { if (clock >= b.until) unbubble(b); else placeBubble(b); }
      else if (b.fade > 0) { b.fade -= dt; if (b.fade <= 0) { b.fade = 0; b.el.style.visibility = 'hidden'; } }
    }
  }
  document.addEventListener('mw:lang', () => {
    for (const b of pool) if (b.on && b.line) { setText(b.text, tr(b.line)); b.w = b.el.offsetWidth; b.h = b.el.offsetHeight; b.x = -1; placeBubble(b); }
  });
  /** Maya's own reply bubble (the game's bark, with her face) */
  function mayaSays(line) {
    const face = line.face || 'smile';
    call(game.maya, 'setFace', face, 2.6);
    game.ui?.bark?.(tr(line), { face: call(game.maya, 'faceCanvas', face) });
  }
  // the town chatter keeps quiet while he talks (one voice at a time), and he waits for it
  let chatterHeld = false;
  function holdChatter(on) {
    const c = story.chatter;
    if (!c) return;
    if (on && !chatterHeld) { c.pause(true); chatterHeld = true; }
    else if (!on && chatterHeld) { chatterHeld = false; c.pause(false); }
  }
  const chatterBusy = () => !!story.chatter?.busy || !!game.ui?.barkOpen;
  // her own thought bubble (the arrival thought of a town) is up, or a town has only just begun: he holds back
  const chatterArriving = () => !!game.ui?.barkOpen || townQuiet > 0;
  /** before he speaks: wait (up to a few seconds) until nobody else's bubble is up */
  async function quietWait(t, max = 3) {
    for (let k = 0; k < max * 10 && alive(t) && !leaving && chatterBusy(); k++) await sleep(0.1);
  }

  // ---- gates
  let domBlock = false, domT = 0;
  function blockedWhy() {
    if (!game.maya?.root) return 'nomaya';
    if (document.hidden) return 'hidden';
    if (game.mode !== 'world') return 'mode';
    if (story.inRoom) return 'room';
    if (story.talking) return 'talking';
    if (game.busy) return 'busy';
    if (game.ui?.dialogOpen) return 'dialog';
    if (game.ui?.sheetOpen) return 'sheet';
    if (game.rig?.cinematic) return 'cinematic';
    if (story.townIntro || story.introActive || story.cutscene) return 'intro';
    const cl = gameEl.classList;
    if (cl.contains('cinema') || cl.contains('talking') || cl.contains('choosing') || cl.contains('acting')) return 'scene';
    if (domBlock) return 'overlay';
    if (story.carrying) return 'carrying';
    try { if (story.blockedTravel?.()) return 'travel'; } catch { /* a day's guard */ }
    if (save.cargo) return 'cargo';
    if (ow?.overviewOn) return 'overview';
    if (dayOwns('heinhtet')) return 'day';
    return '';
  }
  const hardStop = () => !game.maya?.root || game.mode !== 'world' || !!story.inRoom || !!ow?.overviewOn;
  const overBudget = () => callsNow() > CALL_CAP || trisNow() > TRI_CAP;

  // ---- moving him along a path
  const mv = { pts: null, cum: null, len: 0, s: 0, v: 0, vMax: 0, stop: false, skid: false, skidded: false, done: null };
  function follow(pts, vMax, { stop = false, skid = stop } = {}) {
    return new Promise((res) => {
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
      Object.assign(mv, { pts, cum, len: cum[cum.length - 1], s: 0, vMax, stop, skid, skidded: false, done: res });
      if (mv.len < 1e-3) { mv.pts = null; res(); }
    });
  }
  function pointOn(s, out) {
    const { pts, cum } = mv;
    let i = 1;
    while (i < pts.length - 1 && cum[i] < s) i++;
    const a = pts[i - 1], b = pts[i], seg = cum[i] - cum[i - 1] || 1, f = Math.min(1, Math.max(0, (s - cum[i - 1]) / seg));
    out.x = a.x + (b.x - a.x) * f; out.z = a.z + (b.z - a.z) * f; out.hx = b.x - a.x; out.hz = b.z - a.z;
    return out;
  }
  const P = { x: 0, z: 0, hx: 0, hz: 1 };
  function turnTo(h, dt, rate = 14) {
    let d = h - hh.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
    hh.root.rotation.y += d * (1 - Math.exp(-dt * rate));
  }
  let faceAt = null; // { x, z } to face while standing
  let singT = 0;
  function tickMove(dt) {
    let speed = 0;
    if (mv.pts) {
      const rem = mv.len - mv.s;
      let vT = leaving ? Math.max(mv.vMax, SPEED.sprint) : mv.vMax;
      const stop = mv.stop && !leaving;
      if (stop) vT = Math.min(vT, Math.sqrt(2 * 7 * Math.max(0, rem - 0.02)) + 0.05);
      mv.v = mv.v < vT ? Math.min(vT, mv.v + 10 * dt) : vT;
      if (stop && mv.skid && !mv.skidded && rem < 1.15 && mv.v > 1.6) { mv.skidded = true; hh.play('skid'); }
      mv.s = Math.min(mv.len, mv.s + mv.v * dt);
      pointOn(mv.s, P);
      hh.root.position.set(P.x, 0, P.z);
      if (Math.hypot(P.hx, P.hz) > 1e-4) turnTo(Math.atan2(P.hx, P.hz), dt, 16);
      speed = mv.v;
      if (mv.s >= mv.len - 1e-4) { const d = mv.done; mv.pts = null; mv.done = null; if (stop) mv.v = 0; d?.(); speed = mv.v; }
    } else if (faceAt) {
      const p = hh.root.position;
      turnTo(Math.atan2(faceAt.x - p.x, faceAt.z - p.z), dt, 10);
    }
    // singing: a little bounce and sway
    if (singT > 0) {
      singT -= dt;
      const k = Math.min(1, singT * 2);
      hh.root.rotation.z = Math.sin(clock * 7) * 0.07 * k;
      hh.root.position.y = Math.abs(Math.sin(clock * 7)) * 0.035 * k;
    } else if (hh.root.rotation.z) { hh.root.rotation.z = 0; hh.root.position.y = 0; }
    hh.update(dt, { speed });
  }
  // a game-time sleep (follows the frame clock)
  const sleeps = [];
  const sleep = (sec) => new Promise((res) => sleeps.push({ t: sec, res }));
  function tickSleeps(dt) {
    for (let i = sleeps.length - 1; i >= 0; i--) { sleeps[i].t -= dt; if (sleeps[i].t <= 0) { const s = sleeps.splice(i, 1)[0]; s.res(); } }
  }

  // ---- one appearance at a time
  let tok = 0; // bumped on every new appearance and on an abort: an old script sees it and stops
  let cur = null; // { kind, town, t0, calls0 }
  let leaving = false;
  let carHold = false;
  const alive = (t) => t === tok && !!cur;
  const stats = { appear: {}, kinds: {}, meets: [], walkups: [], carDashes: [], carBlocks: [], callsBefore: [], callsWith: [], trisWith: [], peakCalls: 0, aborts: 0, leaves: 0, sing: 0, misses: {}, last: null };
  const miss = (k) => { stats.misses[k] = (stats.misses[k] || 0) + 1; stats.lastMiss = k; return null; };

  function onStage(at, kind, town) {
    ensureActor();
    tok++;
    leaving = false; faceAt = null; singT = 0;
    hh.stopAnim?.();
    hh.root.position.set(at.x, 0, at.z);
    hh.root.rotation.set(0, 0, 0);
    if (!hh.root.parent) scene.add(hh.root);
    hh.root.visible = true;
    const calls0 = callsNow();
    cur = { kind, town, t0: clock, calls0 };
    stats.appear[town || 'none'] = (stats.appear[town || 'none'] || 0) + 1;
    stats.kinds[kind] = (stats.kinds[kind] || 0) + 1;
    stats.callsBefore.push(calls0); if (stats.callsBefore.length > 30) stats.callsBefore.shift();
    stats.last = { kind, town, day: save.day, at: { x: +at.x.toFixed(1), z: +at.z.toFixed(1) } };
    return tok;
  }
  /** off the stage: out of the scene, every pending wait released, the car let go */
  function offStage(why) {
    if (why === 'abort') stats.aborts++;
    tok++;
    for (const b of pool) unbubble(b, why === 'abort');
    holdChatter(false);
    releaseCar();
    if (hh?.root?.parent) hh.root.removeFromParent();
    if (hh) { hh.stopAnim?.(); hh.root.rotation.z = 0; hh.root.position.y = 0; }
    const d = mv.done; mv.pts = null; mv.done = null; mv.v = 0; d?.();
    for (const s of sleeps.splice(0)) s.res();
    if (cur?.folk) restoreFolk(cur.folk);
    cur = null; leaving = false; faceAt = null; singT = 0;
    nextIn = rand(GAP[0], GAP[1]);
  }
  /** run the rest of the way off screen (already heading out: keep going), then leave */
  async function exitAlong(t, pts) {
    if (!alive(t)) return;
    faceAt = null;
    if (pts?.length > 1) await follow(pts, Math.max(SPEED.run, mv.vMax || 0));
    if (!alive(t)) return;
    // still in sight (she moved, the camera turned): keep going the same way a little longer
    const p = hh.root.position;
    let n = 0;
    while (alive(t) && !offScreen(p.x, p.z, 10) && n++ < 3) {
      const h = hh.root.rotation.y;
      await follow([{ x: p.x, z: p.z }, { x: p.x + Math.sin(h) * 8, z: p.z + Math.cos(h) * 8 }], SPEED.sprint);
    }
    if (alive(t)) offStage('done');
  }

  // ---- lines
  function soloLine(town) {
    const items = [];
    LINES.solo.forEach((l, i) => whenOK(l.when) && items.push({ key: 'solo:' + i, l }));
    const ts = LINES.towns?.[town]?.solo || [];
    const local = [];
    ts.forEach((l, i) => whenOK(l.when) && local.push({ key: `t:${town}:${i}`, l }));
    const it = pickLRU(local.length && (Math.random() < 0.55 || !items.length) ? local : items);
    if (it) markUsed(it.key);
    return it?.l || null;
  }
  function singLine() {
    const items = [];
    (LINES.sing || []).forEach((l, i) => whenOK(l.when) && items.push({ key: 'sing:' + i, l }));
    const it = pickLRU(items);
    if (it) markUsed(it.key);
    return it?.l || null;
  }
  function byeLine() {
    const items = [];
    (LINES.maya?.bye || []).forEach((l, i) => whenOK(l.when) && items.push({ key: 'bye:' + i, l }));
    const it = pickLRU(items);
    if (it) markUsed(it.key);
    return it?.l || null;
  }
  /** the next unused entry of a list kept in the save (all used: start the round again) */
  function nextOnce(list, bucket, filter = () => true) {
    const ok = list.filter((x) => whenOK(x.when) && filter(x));
    if (!ok.length) return null;
    let fresh = ok.filter((x) => !bucket[x.id]);
    if (!fresh.length) { for (const x of ok) delete bucket[x.id]; fresh = ok; }
    return pick(fresh);
  }

  // ---- planning a run across the view
  /** a line across her view, through a point on (or beside) a road, or across open ground; when the street
   * is too tight to cross (a lane between walls), up or down the screen past her. Spread over frames (a few
   * ms a frame), so a long search never makes a long frame. */
  const nextFrame = () => sleep(0);
  async function planCross(kind, o = {}) {
    camBasis();
    const mp = mayaXZ();
    const car = driving();
    const opt = { avoidCarPath: car, ...o };
    const near = kind === 'dash' ? Math.random() < 0.45 : Math.random() < 0.3;
    const depths = car ? [9, 13, 6, 17, 4] : near ? [-1.6, 2.2, 3.5, 6, 9] : [6, 9, 12, 4, 2.5, 15];
    const cands = [];
    for (const k of depths) {
      const jx = rand(-1.2, 1.2);
      const qx = mp.x + cam.fx * k + cam.rx * jx, qz = mp.z + cam.fz * k + cam.rz * jx;
      const r = ow?.net?.nearest?.(qx, qz);
      if (r && r.dist < 7) {
        const pt = pointAt(r.edge, r.s, new THREE.Vector3());
        tangentAt(r.edge, r.s, T);
        for (const off of car ? [2.0, -2.0] : [0, 1.5, -1.5]) cands.push({ x: pt.x - T.z * off, z: pt.z + T.x * off, dx: T.x, dz: T.z, road: true, edge: r.edge, s: r.s, lat: off });
      }
      for (const a0 of [rand(-0.4, 0.4), rand(0.5, 0.85) * (Math.random() < 0.5 ? 1 : -1)]) {
        const dx = cam.rx * Math.cos(a0) - cam.fx * Math.sin(a0), dz = cam.rz * Math.cos(a0) - cam.fz * Math.sin(a0);
        const l = Math.hypot(dx, dz) || 1;
        cands.push({ x: qx, z: qz, dx: dx / l, dz: dz / l, road: false });
      }
    }
    if (!car) {
      // up / down the screen past her, a step or two to her side
      for (const side of [1.5, -1.5, 2.5, -2.5]) {
        const k = rand(0.5, 3);
        cands.push({ x: mp.x + cam.rx * side + cam.fx * k, z: mp.z + cam.rz * side + cam.fz * k, dx: cam.fx, dz: cam.fz, road: false, along: true });
      }
    }
    // across the screen first (a dash reads best sideways), roads before open ground
    const across = (c) => Math.abs(c.dx * cam.rx + c.dz * cam.rz);
    cands.sort((a, b) => (b.road - a.road) * 0.4 + (across(b) - across(a)));
    const dg = (stats.plan = { cands: cands.length, view: 0, clear: 0, seen: 0, big: 0, a: 0, b: 0, frames: 0 });
    let t0 = performance.now();
    const tStart = clock;
    for (const c of cands) {
      if (performance.now() - t0 > (o.budgetMs ?? 7)) { // (no long frame: the rest next frame)
        if (++dg.frames > 24 || clock - tStart > 1.2) { dg.timeout = true; break; }
        await nextFrame();
        camBasis();
        t0 = performance.now();
      }
      if (!inView(c.x, c.z, [0.06, 0.26, 0.94, 0.8])) continue;
      dg.view++;
      if (!clearAt(c.x, c.z, opt)) continue;
      dg.clear++;
      if (!bigEnough(c.x, c.z)) continue;
      dg.big++;
      if (!seen(c.x, c.z)) continue;
      dg.seen++;
      const s = Math.random() < 0.5 ? 1 : -1;
      const a = c.road ? roadOff(c.edge, c.s, -s, c.lat, opt) : extendOff(c.x, c.z, -c.dx * s, -c.dz * s, opt);
      if (!a) continue;
      dg.a++;
      const b = c.road ? roadOff(c.edge, c.s, s, c.lat, opt) : extendOff(c.x, c.z, c.dx * s, c.dz * s, opt);
      if (!b) continue;
      dg.b++;
      const mid = { x: c.x, z: c.z };
      const inPts = [...a.slice().reverse(), mid], outPts = [mid, ...b];
      return { a: inPts[0], mid, b: outPts[outPts.length - 1], inPts, outPts, road: c.road };
    }
    return null;
  }
  /** a stop beside someone (left or right of them on screen, so both faces show) and the ways in and out */
  function planBeside(target, o = {}) {
    camBasis();
    const tp = target.root ? target.root.position : target;
    const sides = Math.random() < 0.5 ? [1, -1] : [-1, 1];
    const gap = o.gap ?? 1.05;
    for (const sd of sides) {
      for (const tilt of [0, 0.35, -0.35]) {
        const dx = cam.rx * Math.cos(tilt) - cam.fx * Math.sin(tilt), dz = cam.rz * Math.cos(tilt) - cam.fz * Math.sin(tilt);
        const sx = tp.x + dx * gap * sd, sz = tp.z + dz * gap * sd;
        if (!clearAt(sx, sz, o) || !inView(sx, sz, [0.12, 0.26, 0.88, 0.84]) || !bigEnough(sx, sz) || !seen(sx, sz)) continue;
        // in: from further out on the same side (or from above / below on screen)
        const ins = [[dx * sd, dz * sd], [dx * sd * 0.7 + cam.fx * 0.7, dz * sd * 0.7 + cam.fz * 0.7], [dx * sd * 0.7 - cam.fx * 0.7, dz * sd * 0.7 - cam.fz * 0.7], [cam.fx, cam.fz]];
        for (const [ix, iz] of ins) {
          const il = Math.hypot(ix, iz) || 1;
          const a = extendOff(sx, sz, ix / il, iz / il, o);
          if (!a) continue;
          const stand = { x: sx, z: sz };
          // out: past the other person (in front or behind them), or back the way he came
          const outs = [[-dx * sd * 0.55 + cam.fx * 0.85, -dz * sd * 0.55 + cam.fz * 0.85], [-dx * sd * 0.55 - cam.fx * 0.85, -dz * sd * 0.55 - cam.fz * 0.85], [cam.fx, cam.fz], [-cam.fx, -cam.fz], [ix, iz]];
          for (const [ox, oz] of outs) {
            const ol = Math.hypot(ox, oz) || 1;
            const b = extendOff(sx, sz, ox / ol, oz / ol, o);
            if (b) return { a: a[a.length - 1], stand, b: b[b.length - 1], inPts: [...a.slice().reverse(), stand], outPts: [stand, ...b] };
          }
        }
      }
    }
    return null;
  }

  // ---- APPEARANCES
  async function dash(o = {}) {
    const mp = mayaXZ(), town = districtAt(mp.x, mp.z);
    const pl = await planCross('dash');
    if (!pl) return miss('dash');
    if (!o.force && (blockedWhy() || chatterArriving())) return miss('dash:gate');
    const t = onStage(pl.a, 'dash', town);
    // edge to edge in 2-4 s: the speed from how much of the way is in sight
    const all = [...pl.inPts, ...pl.outPts.slice(1)];
    let seenLen = 0;
    for (let i = 1; i < all.length; i++) if (inView(all[i].x, all[i].z, [0, 0, 1, 1])) seenLen += Math.hypot(all[i].x - all[i - 1].x, all[i].z - all[i - 1].z);
    const sp = Math.min(6.5, Math.max(SPEED.dash[0] - 1, seenLen / rand(2, 3.2)));
    stats.dashSeen = { len: +seenLen.toFixed(1), speed: +sp.toFixed(1), secs: +(seenLen / sp).toFixed(1) };
    hh.run(sp);
    const go = follow([...pl.inPts, ...pl.outPts.slice(1)], sp);
    // now and then a shout or a sung line on the way past (never with the chatter talking)
    const r = Math.random();
    const it = o.quiet ? null : r < SING.dash ? singLine() : r < SING.dash + 0.35 ? pick(SHOUTS) : null;
    if (it) {
      for (let i = 0; i < 20 && alive(t) && mv.pts && !inView(hh.root.position.x, hh.root.position.z, [0.08, 0.1, 0.92, 0.9]); i++) await sleep(0.1);
      if (alive(t) && mv.pts && !leaving && !chatterBusy() && inView(hh.root.position.x, hh.root.position.z, [0.05, 0.08, 0.95, 0.92])) {
        const isSing = r < SING.dash;
        bubble(hh, it, isSing ? 2400 : 1500, isSing ? 'hh sing' : 'hh');
        if (isSing) { stats.sing++; singT = 2.2; }
      }
    }
    await go;
    await exitAlong(t, null);
    return true;
  }
  async function pass(o = {}) {
    const mp = mayaXZ(), town = districtAt(mp.x, mp.z);
    const pl = await planCross('pass');
    if (!pl) return miss('pass');
    if (!o.force && (blockedWhy() || chatterArriving())) return miss('pass:gate');
    const t = onStage(pl.a, 'pass', town);
    const sing = o.sing ?? Math.random() < SING.pass;
    const stop = o.stop ?? (sing ? Math.random() < 0.5 : Math.random() < 0.55);
    const line = sing ? singLine() : soloLine(town);
    hh.run(SPEED.run);
    if (stop) {
      await follow(pl.inPts, SPEED.run, { stop: true });
      if (!alive(t)) return true;
      if (!leaving) {
        faceAt = { x: mp.x, z: mp.z };
        await sleep(0.45);
        await quietWait(t, 4);
        const anim = line?.anim && !sing ? line.anim : pick(ANIMS_STOP);
        // (he stopped to say it: after a few seconds' wait the town chatter is paused for him, never her own thought)
        if (line && !game.ui?.barkOpen && alive(t) && !leaving) {
          holdChatter(true);
          bubble(hh, line, null, sing ? 'hh sing' : 'hh');
          if (sing) { stats.sing++; singT = msFor(line) / 1000; }
        }
        if (alive(t) && !leaving) { if (!sing) await hh.play(anim); else await sleep(Math.min(3.2, msFor(line || {}) / 1000)); }
        if (alive(t) && !leaving) await sleep(0.5);
        holdChatter(false);
      }
      if (!alive(t)) return true;
      hh.run(SPEED.run);
      await exitAlong(t, pl.outPts);
    } else {
      const go = follow([...pl.inPts, ...pl.outPts.slice(1)], SPEED.run);
      await sleep(0.4);
      if (line && alive(t) && !chatterBusy()) {
        bubble(hh, line, null, sing ? 'hh sing' : 'hh');
        if (sing) { stats.sing++; singT = msFor(line) / 1000; }
      }
      await go;
      await exitAlong(t, null);
    }
    return true;
  }

  // ---- MEETS: a townsperson of a fitting age / sex / job, one of the town's meets
  function lookOf(e) { return e.cast?.look || e.look || {}; }
  function isWoman(look, e) { return /htamein|skirt/i.test(look.bottom || '') || /aunty|woman|mother|grandmother|girl/i.test(e.cast?.role?.en || ''); }
  function fitScore(spec, e) {
    const look = lookOf(e), age = look.age || 'adult';
    let s = 0;
    if (spec.age) { if (spec.age !== age && !(spec.age === 'adult' && age === 'teen')) return -1; s += 3; }
    if (spec.woman != null) { if (!!spec.woman !== isWoman(look, e)) return -1; s += 2; }
    if (spec.job) { const role = (e.cast?.role?.en || '').toLowerCase(); if (String(spec.job).split(/\s+/).some((j) => j.length > 3 && role.includes(j.toLowerCase()))) s += 2; }
    return s;
  }
  function meetCandidates(town) {
    const mp = mayaXZ();
    const out = [];
    for (const e of story.people.values()) {
      if (!folkish(e) || !e.p?.root?.parent || e.p.root.visible === false) continue;
      if (e === story.talkWith || e.ctl || e.walking || e.hidden || e.paused || e.indoor) continue;
      const p = e.p.root.position;
      const d = Math.hypot(p.x - mp.x, p.z - mp.z);
      if (d > 18 || d < 1.5 || !inView(p.x, p.z, [0.08, 0.22, 0.92, 0.84]) || !seen(p.x, p.z)) continue;
      out.push({ e, d });
    }
    out.sort((a, b) => a.d - b.d);
    const meets = (LINES.towns?.[town]?.meets || []).filter((m) => whenOK(m.when));
    const bucket = hs().meets;
    let fresh = meets.filter((m) => !bucket[m.id]);
    if (!fresh.length && meets.length) { for (const m of meets) delete bucket[m.id]; fresh = meets; }
    const pairs = [];
    for (const { e, d } of out) for (const m of fresh) { const s = fitScore(m.folk || {}, e); if (s >= 0) pairs.push({ e, m, s: s - d * 0.15 + Math.random() }); }
    return pairs.sort((a, b) => b.s - a.s);
  }
  function restoreFolk(f) {
    if (!f) return;
    const { e, paused, h } = f;
    e.paused = paused;
    if (e.home && h != null) e.home.h = h;
    e.hhBusy = false;
  }
  async function meet(o = {}) {
    const mp = mayaXZ(), town = o.town || districtAt(mp.x, mp.z);
    // (the town chatter may be mid-line: he pauses it and waits for the line to end; only her own thought stops him)
    if (!town || chatterArriving()) return miss('meet:busy');
    let cands = meetCandidates(town);
    if (o.id) cands = cands.filter((c) => c.m.id === o.id);
    let pl = null, c = null;
    for (const cc of cands.slice(0, 6)) { pl = planBeside(cc.e.p, { allow: cc.e }); if (pl) { c = cc; break; } }
    if (!c) return miss(cands.length ? 'meet:path' : 'meet:nobody');
    if (!o.force && (blockedWhy() || chatterArriving())) return miss('meet:gate');
    const { e, m } = c;
    const t = onStage(pl.a, 'meet', town);
    cur.folk = { e, paused: e.paused, h: e.home?.h };
    e.paused = true; e.hhBusy = true;
    hs().meets[m.id] = save.day || 1; persistSoon();
    stats.meets.push(`${town}:${m.id}`);
    hh.run(SPEED.run);
    await follow(pl.inPts, SPEED.run, { stop: true });
    if (!alive(t)) return true;
    if (!leaving && e.p.root.parent) {
      const fp = e.p.root.position, hp = hh.root.position;
      faceAt = { x: fp.x, z: fp.z };
      if (e.home) e.home.h = Math.atan2(hp.x - fp.x, hp.z - fp.z);
      e.p.root.rotation.y = Math.atan2(hp.x - fp.x, hp.z - fp.z);
      if (m.folkFace) call(e.p, 'setFace', m.folkFace, 30);
      holdChatter(true);
      await sleep(0.3);
      await quietWait(t, 4);
      const opener = hh.play(m.hhAnim || 'wave');
      await Promise.race([opener, sleep(1.4)]);
      let first = true;
      for (const l of m.lines) {
        if (!alive(t) || leaving || !e.p.root.parent) break;
        const sp = l.who === 'folk' ? e.p : hh;
        const ms = msFor(l);
        bubble(sp, l, ms, l.who === 'folk' ? 'pb' : 'hh');
        if (l.who !== 'folk' && l.anim && !(first && l.anim === m.hhAnim)) hh.play(l.anim);
        if (l.who === 'folk') call(e.p, 'emote', pick(['nod', 'think', 'point', 'wave']));
        first = false;
        await sleep(ms / 1000 + 0.3);
      }
      holdChatter(false);
      if (alive(t) && !leaving && Math.random() < SING.meet) {
        const s = singLine();
        if (s) { bubble(hh, s, 2400, 'hh sing'); singT = 2.4; stats.sing++; }
      }
    }
    if (!alive(t)) return true;
    restoreFolk(cur.folk); cur.folk = null;
    call(e.p, 'setFace', 'smile', 2);
    hh.run(SPEED.sprint);
    await exitAlong(t, pl.outPts);
    return true;
  }

  // ---- WALK-UP (the dialogue box)
  async function walkup(o = {}) {
    if (!story.footActive || story.talking) return miss('walkup:state');
    const h = hs();
    const wu = o.id ? (LINES.maya.walkup || []).find((x) => x.id === o.id) : nextOnce(LINES.maya.walkup || [], h.walk);
    if (!wu) return miss('walkup:none');
    const mp = mayaXZ(), town = districtAt(mp.x, mp.z);
    story.foot?.walker?.stop?.();
    const pl = planBeside(mp, { gap: 1.15, noMaya: false, mayaR: 1.0 });
    if (!pl) return miss('walkup:path');
    const t = onStage(pl.a, 'walkup', town);
    h.walk[wu.id] = save.day || 1; h.walkDay = save.day || 1; persistSoon();
    stats.walkups.push(wu.id);
    story.talking = true; // she stands still; nothing else starts
    holdChatter(true);
    let talked = false;
    try {
      hh.run(SPEED.sprint);
      await follow(pl.inPts, SPEED.sprint, { stop: true });
      if (!alive(t)) return true;
      await sleep(0.55);
      if (!alive(t)) return true;
      // face each other, a two-shot as in any talk
      const hp = hh.root.position, m = game.maya.root.position;
      const walker = story.foot.walker;
      walker.heading = Math.atan2(hp.x - m.x, hp.z - m.z);
      game.maya.root.rotation.set(0, walker.heading, 0);
      hh.root.rotation.y = Math.atan2(m.x - hp.x, m.z - hp.z);
      faceAt = null;
      game.ui.cinema(true);
      try {
        const camAz = story.twoShot ? story.twoShot(m, hp) : null;
        if (camAz != null) {
          const cheat = (hd) => { let d = camAz - hd; d = Math.atan2(Math.sin(d), Math.cos(d)); return hd + d * 0.45; };
          walker.heading = cheat(walker.heading);
          game.maya.root.rotation.set(0, walker.heading, 0);
          hh.root.rotation.y = cheat(hh.root.rotation.y);
        }
        await sayLines(wu.lines, t);
        talked = true;
      } finally {
        game.ui.cinema(false);
        game.rig?.release?.();
      }
    } finally {
      story.talking = false;
      holdChatter(false);
    }
    if (!alive(t)) return true;
    await byeAndGo(t, pl.outPts);
    return talked;
  }
  /** the dialogue box, line by line: his name and portrait, or Maya's */
  async function sayLines(lines, t) {
    for (const l of lines) {
      if (!alive(t)) return;
      if (l.who === 'maya') await story.dialog.say('maya', l, { face: l.face || 'smile' });
      else {
        if (l.anim) hh.play(l.anim);
        await story.dialog.say('heinhtet', l, { name: NAME, actor: hh });
      }
    }
  }
  async function byeAndGo(t, exit) {
    const b = byeLine();
    if (b) {
      bubble(hh, b, Math.min(3000, msFor(b)), 'hh');
      if (b.anim) await Promise.race([hh.play(b.anim), sleep(1.6)]);
      else await sleep(0.9);
    }
    if (!alive(t)) return;
    hh.run(SPEED.sprint);
    await exitAlong(t, exit);
  }

  // ---- THE CAR: hold it still while he is in the road (the stick is ignored; the car rolls to a stop)
  const dr = drive();
  if (dr && !dr.__hhWrapped) {
    dr.__hhWrapped = true;
    const setStick0 = dr.setStick.bind(dr);
    dr.setStick = (x, y) => (carHold ? setStick0(0, 0) : setStick0(x, y));
    const update0 = dr.update.bind(dr);
    dr.update = (dt) => {
      if (carHold) setStick0(0, 0);
      const r = update0(dt);
      // never touch him: a hard stop if the car somehow comes within reach while he is in the road
      if (carHold && hh?.root?.parent && dr.state.speed > 0.2) {
        const p = dr.state.position, q = hh.root.position;
        if (Math.hypot(p.x - q.x, p.z - q.z) < 3.4) { dr.placeAt(p.x, p.z, dr.state.heading); stats.hardStops = (stats.hardStops || 0) + 1; }
      }
      return r;
    };
  }
  function holdCar() { carHold = true; try { drive().stop(); } catch { /* ok */ } }
  function releaseCar() { carHold = false; }

  /** a crossing point on her road some metres ahead (where the car will have stopped well short), and his way across */
  /** from (edge, s) along the road by `dist` (dir +1 / -1 along the edge), through junctions on the straightest
   * way on; null if the road bends (or turns at a junction) on the way */
  function aheadOnRoad(edge, s, dir, dist) {
    let e = edge, ss = s, d = dir, left = dist;
    tangentAt(e, ss, T);
    const h0x = T.x * d, h0z = T.z * d;
    const Tn = { x: 0, z: 0 };
    for (let g = 0; g < 10; g++) {
      const room = d === 1 ? e.length - ss : ss;
      if (left <= room - 0.4) {
        for (const f of [0.5, 1]) { tangentAt(e, ss + d * left * f, T2); if (T2.x * d * h0x + T2.z * d * h0z < 0.94) return null; }
        return { edge: e, s: ss + d * left, dir: d };
      }
      left -= Math.max(0, room);
      const nd = d === 1 ? e.b : e.a;
      let best = null, bs = -2, bd = 1;
      for (const e2 of nd.edges || []) {
        if (e2 === e || (ow.net.isOpen && !ow.net.isOpen(e2)) || e2.gate) continue;
        const dd = e2.a === nd ? 1 : -1;
        tangentAt(e2, dd === 1 ? 0 : e2.length, Tn);
        const sc = Tn.x * dd * h0x + Tn.z * dd * h0z;
        if (sc > bs) { bs = sc; best = e2; bd = dd; }
      }
      if (!best || bs < 0.94) return null;
      e = best; d = bd; ss = d === 1 ? 0 : e.length;
    }
    return null;
  }
  /** a crossing point on her road some metres ahead (where the car will have stopped well short), and his way
   * across: from a side street (and off down another), or along the pavement towards the car, across, and back
   * along the other pavement past the stopped car (so the car never drives on past him) */
  function planCarCross(kind, opt = {}) {
    const d = drive();
    if (!d || d.isAuto || !driving()) return miss(kind + ':state');
    const st = d.state, sp = Math.abs(st.speed);
    if (!opt.force && sp < (kind === 'block' ? BLOCK.speed : 3)) return miss(kind + ':slow');
    const cp = st.position, hd = st.heading, fx = Math.sin(hd), fz = Math.cos(hd);
    const r = ow?.net?.nearest?.(cp.x, cp.z);
    if (!r || r.dist > 1.2) return miss(kind + ':road');
    tangentAt(r.edge, r.s, T);
    const sign = Math.sign(T.x * fx + T.z * fz) || 1;
    const stopD = (sp * sp) / (2 * 9) + 0.8;
    const dc = stopD + (kind === 'block' ? 3.6 : 3.4);
    // a stop pad just ahead would let the car roll on to it: not here
    for (const pad of d.pads || []) if (Math.hypot(pad.x - cp.x, pad.z - cp.z) < dc + stopD + 9) {
      if ((pad.x - cp.x) * fx + (pad.z - cp.z) * fz > -2) return miss(kind + ':pad');
    }
    const at = aheadOnRoad(r.edge, r.s, sign, dc);
    if (!at) return miss(kind + ':bend');
    const C = pointAt(at.edge, at.s, new THREE.Vector3());
    if (!inView(C.x, C.z, [0.05, 0.14, 0.95, kind === 'block' ? 0.8 : 0.86])) return miss(kind + ':view');
    camBasis();
    tangentAt(at.edge, at.s, T2);
    const ax = T2.x * at.dir, az = T2.z * at.dir; // ahead, along the road
    const nx = -az, nz = ax;
    const o = { noCar: true, noMaya: true };
    const t0 = performance.now();
    const done = (inPts, outPts) => ({ inPts: [...inPts, { x: C.x, z: C.z }], outPts: [{ x: C.x, z: C.z }, ...outPts], C: { x: C.x, z: C.z }, car: { x: cp.x, z: cp.z } });
    const sides = Math.random() < 0.5 ? [1, -1] : [-1, 1];
    // his ways in (to C) and out (from C), each made once when first asked for:
    //   side street (bentOff), along the pavement from ahead of the car, back along the pavement past the stopped car
    //   (so it never drives on past him), and last, on along the pavement ahead
    let PAVE = 2.7;
    const pave = (side, w = PAVE) => ({ x: C.x + nx * side * w, z: C.z + nz * side * w });
    const lineClear = (p, q, oo) => { for (let k = 1; k < 6; k++) if (!clearAt(p.x + (q.x - p.x) * k / 6, p.z + (q.z - p.z) * k / 6, { ...oo, run: true })) return false; return true; };
    const oOut = { noMaya: true, latMax: 3.6, carR: 1.9, guard: 220 }; // (the way back keeps clear of the stopped car's body)
    const memo = new Map();
    const way = (key, make) => { if (!memo.has(key)) memo.set(key, make() || null); return memo.get(key); };
    // (the kerb: about 2.7 m off the middle; a lamp post or a stall there: a little nearer or further)
    const paveOK = (side, oo) => way('p' + side + (oo === oOut ? 'o' : 'i'), () => {
      for (const wd of [2.7, 2.2, 3.2, 1.8]) { const p = pave(side, wd); if (clearAt(p.x, p.z, { ...oo, run: true }) && lineClear(p, C, o)) { p.w = wd; return p; } }
      return null;
    });
    // (roadOff's lat is off the edge's own direction: the side of travel times at.dir)
    const ins = (side) => [
      () => way('si' + side, () => { const r = bentOff(C.x, C.z, { x: nx * side, z: nz * side }, { x: ax, z: az }, o); return r && r.slice().reverse(); }),
      () => way('pi' + side, () => { const p = paveOK(side, o); if (!p) return null; const r = roadOff(at.edge, at.s, at.dir, side * p.w * at.dir, { ...o, latMax: 3.6 }); return r && [...r.slice().reverse(), p]; }),
    ];
    const outs = (side) => [
      () => way('so' + side, () => bentOff(C.x, C.z, { x: nx * side, z: nz * side }, { x: ax, z: az }, o)),
      () => way('pb' + side, () => { const p = paveOK(side, oOut); if (!p) return null; const r = roadOff(at.edge, at.s, -at.dir, side * p.w * at.dir, oOut); return r && [p, ...r]; }),
      () => way('pb' + -side, () => { const p = paveOK(-side, oOut); if (!p) return null; const r = roadOff(at.edge, at.s, -at.dir, -side * p.w * at.dir, oOut); return r && [p, ...r]; }),
      () => way('pa' + side, () => { const p = paveOK(side, o); if (!p) return null; const r = roadOff(at.edge, at.s, at.dir, side * p.w * at.dir, { ...o, latMax: 3.6 }); return r && [p, ...r]; }),
    ];
    const dg = (stats.planCar = { tried: 0 });
    for (const sIn of sides) {
      for (const mkIn of ins(sIn)) {
        if (performance.now() - t0 > 30) return miss(kind + ':time');
        const inPts = mkIn();
        if (!inPts) continue;
        for (const mkOut of outs(-sIn)) {
          if (performance.now() - t0 > 30) return miss(kind + ':time');
          dg.tried++;
          const outPts = mkOut();
          if (outPts) return done(inPts, outPts);
        }
      }
    }
    dg.ways = [...memo].map(([k, w]) => k + (w ? '+' : '-')).join(' ');
    return miss(kind + ':sides');
  }
  /** wait until he is off the road (and a moment more), then let the car go */
  async function releaseWhenClear(t, C, minHold) {
    const t0 = clock;
    for (let i = 0; i < 80; i++) {
      if (!alive(t)) break;
      const p = hh.root.position;
      if (Math.hypot(p.x - C.x, p.z - C.z) > 2.3 && clock - t0 >= minHold) break;
      await sleep(0.1);
    }
    releaseCar();
  }
  async function carDash(o = {}) {
    const h = hs();
    const cd = o.id ? (LINES.maya.carDash || []).find((x) => x.id === o.id) : nextOnce(LINES.maya.carDash || [], h.dash);
    if (!cd) return miss('carDash:none');
    const pl = planCarCross('dash', o);
    if (!pl) return null;
    const town = districtAt(pl.C.x, pl.C.z);
    const t = onStage(pl.inPts[0], 'carDash', town);
    holdCar();
    h.dash[cd.id] = save.day || 1; h.dashIn = rand(DASH_GAP[0], DASH_GAP[1]); h.lastCar = h.driveT || 0; persistSoon();
    stats.carDashes.push(cd.id);
    const lenIn = pl.inPts.reduce((s, p, i) => (i ? s + Math.hypot(p.x - pl.inPts[i - 1].x, p.z - pl.inPts[i - 1].z) : 0), 0);
    const vIn = Math.min(7.5, Math.max(4.6, lenIn / 1.5));
    hh.run(vIn);
    try {
      await follow(pl.inPts, vIn, { stop: true });
      if (!alive(t)) return true;
      const car = game.car.root.position;
      faceAt = { x: car.x, z: car.z };
      holdChatter(true);
      call(game.ui, 'hideBark'); // (her own driving remark, if one is up: his line, then her reply)
      bubble(hh, cd.hh, 2300, 'hh');
      if (cd.hh.anim) await Promise.race([hh.play(cd.hh.anim), sleep(1.5)]); else await sleep(1.1);
      if (!alive(t)) return true;
      hh.run(SPEED.sprint);
      const out = exitAlong(t, pl.outPts);
      await sleep(0.45);
      mayaSays(cd.maya);
      await releaseWhenClear(t, pl.C, 1.5);
      holdChatter(false);
      await out;
    } finally { releaseCar(); holdChatter(false); }
    return true;
  }
  async function carBlock(o = {}) {
    const h = hs();
    const cb = o.id ? (LINES.maya.carBlock || []).find((x) => x.id === o.id) : nextOnce(LINES.maya.carBlock || [], h.block);
    if (!cb) return miss('carBlock:none');
    const pl = planCarCross('block', o);
    if (!pl) return null;
    const town = districtAt(pl.C.x, pl.C.z);
    const t = onStage(pl.inPts[0], 'carBlock', town);
    holdCar();
    h.block[cb.id] = save.day || 1; h.blockDay = save.day || 1; h.lastCar = h.driveT || 0; persistSoon();
    stats.carBlocks.push(cb.id);
    const lenIn = pl.inPts.reduce((s, p, i) => (i ? s + Math.hypot(p.x - pl.inPts[i - 1].x, p.z - pl.inPts[i - 1].z) : 0), 0);
    const vIn = Math.min(7.5, Math.max(5, lenIn / 1.4));
    hh.run(vIn);
    try {
      await follow(pl.inPts, vIn, { stop: true });
      if (!alive(t)) return true;
      const car = game.car.root.position;
      faceAt = { x: car.x, z: car.z };
      // wait for the car to stand still
      for (let i = 0; i < 30 && carSpeed() > 0.05; i++) await sleep(0.1);
      if (!alive(t)) return true;
      story.talking = true;
      holdChatter(true);
      game.ui.cinema(true);
      try { await sayLines(cb.lines, t); } finally { game.ui.cinema(false); story.talking = false; holdChatter(false); }
      if (!alive(t)) return true;
      const b = byeLine();
      if (b) bubble(hh, b, Math.min(2800, msFor(b)), 'hh');
      await Promise.race([hh.play('dodge'), sleep(0.9)]);
      if (!alive(t)) return true;
      hh.run(SPEED.sprint);
      const out = exitAlong(t, pl.outPts);
      await releaseWhenClear(t, pl.C, 0.3);
      await out;
    } finally { releaseCar(); if (story.talking && cur?.kind === 'carBlock') story.talking = false; }
    return true;
  }

  // ---- the scheduler (story.ticks: every frame, after the day's own update)
  let nextIn = rand(FIRST[0], FIRST[1]);
  let retryT = 0, walkT = WALKUP.every, blockT = BLOCK.check, overT = 0, lastMp = null, jumpT = 0;
  let force = false;
  let auto = true; // (tests) false: no natural appearances, only the ones a test calls
  let pending = false; // an appearance is being planned (spread over frames) or played
  let townQuiet = 0, lastTown = null, meetWant = 0;
  function chooseKind() {
    if (driving()) return 'dash';
    const r = Math.random();
    return r < SHARE.dash ? 'dash' : r < SHARE.dash + SHARE.meet ? 'meet' : 'pass';
  }
  async function appear(kind, o = {}) {
    if (cur || pending) return false;
    pending = true;
    try {
      let ok = null;
      if (kind === 'meet') { ok = await meet(o); if (!ok && !cur && !o.only) ok = await pass(o); }
      else if (kind === 'pass') ok = await pass(o);
      else if (kind === 'walkup') ok = await walkup(o);
      else if (kind === 'carDash') ok = await carDash(o);
      else if (kind === 'carBlock') ok = await carBlock(o);
      else { ok = await dash(o); if (!ok && !cur && !driving() && !o.only) ok = await pass(o); }
      return !!ok;
    } catch (e) {
      console.error('heinhtet', e);
      offStage('abort');
      return false;
    } finally {
      pending = false;
    }
  }
  function eligible() {
    if (blockedWhy()) return false;
    const mp = mayaXZ();
    return !!districtAt(mp.x, mp.z);
  }
  const busy = () => !!cur || pending;

  function tick(dt) {
    if (!dt || !game.maya?.root) return;
    dt = Math.min(dt, 0.1);
    clock += dt;
    tickSleeps(dt);
    domT -= dt;
    if (domT <= 0) { domT = 0.3; domBlock = !!document.querySelector('.act-wrap, .story-stamp, .story-letter, #story-panel, #story-choices, .story-got, #story-map, #story-fade.on'); }
    const mp = mayaXZ();
    // a jump (a desk's page turn, a test) or a door: he is simply gone
    const jumped = lastMp && Math.hypot(mp.x - lastMp.x, mp.z - lastMp.z) > 12;
    lastMp = { x: mp.x, z: mp.z };
    if (jumped) jumpT = 2;
    jumpT = Math.max(0, jumpT - dt);
    if (cur) {
      const p = hh.root.position;
      const far = Math.hypot(p.x - mp.x, p.z - mp.z) > 50;
      if (hardStop() || jumped || far) offStage('abort');
      else {
        // something story-ish began (not his own talk): he finishes the line showing and runs off
        const own = cur.kind === 'walkup' || cur.kind === 'carBlock';
        const why = own ? (hardStop() ? 'hard' : '') : blockedWhy();
        if (why && !leaving) { leaving = true; stats.leaves++; holdChatter(false); if (cur.kind !== 'carDash') releaseCar(); }
        const calls = callsNow();
        stats.peakCalls = Math.max(stats.peakCalls, calls);
        if (hh.root.parent && !offScreen(p.x, p.z, 0)) {
          stats.callsWith.push(calls); if (stats.callsWith.length > 60) stats.callsWith.shift();
          stats.trisWith.push(trisNow()); if (stats.trisWith.length > 60) stats.trisWith.shift();
        }
        overT = calls > CALL_LEAVE ? overT + dt : 0;
        if (overT > 1 && !leaving && !own) { leaving = true; stats.leaves++; }
        if (hh.root.parent) tickMove(dt);
      }
    }
    tickBubbles(dt);
    // a town she has just come into: he turns up there soon (he is in every town), after her arrival thought
    townQuiet = Math.max(0, townQuiet - dt);
    const town = !story.inRoom && game.mode === 'world' ? districtAt(mp.x, mp.z) : null;
    if (town && town !== lastTown) {
      if (lastTown !== null || clock > 3) { townQuiet = 6; nextIn = Math.min(nextIn, rand(TOWN_NEW[0], TOWN_NEW[1])); meetWant = 0; }
      lastTown = town;
    }
    if (cur || pending || !auto) return;
    // ---- timers (only time that could have had him counts)
    if (story.inRoom || game.mode !== 'world') return;
    const h = hs();
    // driving time: car dashes / blocks
    if (driving() && carSpeed() > 1.5) {
      h.driveT = (h.driveT || 0) + dt;
      if ((save.day || 1) >= 2) h.dashIn -= dt;
      blockT -= dt;
    }
    if (blockedWhy() || jumpT > 0) return;
    if (driving()) {
      if ((save.day || 1) >= 2 && (h.dashIn <= 0 || force) && carSpeed() > 3) {
        if (retryT <= 0) { retryT = 1.5; appear('carDash'); return; }
      }
      if (blockT <= 0) {
        blockT = BLOCK.check;
        const day = save.day || 1;
        const okDay = day >= BLOCK.fromDay && (h.blockDay == null || day - h.blockDay >= BLOCK.everyDays);
        if (okDay && (h.driveT || 0) - (h.lastCar || -1e9) >= BLOCK.minDrive && carSpeed() > BLOCK.speed && Math.random() < BLOCK.chance) { appear('carBlock'); return; }
      }
    } else if (story.footActive) {
      // walking outdoors today: a walk-up, now and then
      if (h.footDay !== save.day) { h.footDay = save.day; h.footT = 0; }
      if (eligible()) h.footT = (h.footT || 0) + dt;
      walkT -= dt;
      if (walkT <= 0) {
        walkT = WALKUP.every;
        persistSoon();
        if ((save.day || 1) >= WALKUP.fromDay && h.walkDay !== save.day && h.footT >= WALKUP.after && Math.random() < WALKUP.chance && eligible() && !overBudget()) { appear('walkup'); return; }
      }
    }
    retryT -= dt;
    if (!eligible()) return;
    nextIn -= dt;
    if ((nextIn > 0 && !force) || retryT > 0) return;
    // (never over her arrival thought: a moment later; a townsperson mid-line is fine: he waits for it before he speaks, or keeps quiet on a dash)
    if (chatterArriving()) { retryT = 1; stats.misses.quiet = (stats.misses.quiet || 0) + 1; return; }
    if (overBudget()) { retryT = 3; stats.misses.budget = (stats.misses.budget || 0) + 1; return; }
    retryT = 3;
    // a meet with nobody fitting near: keep looking a while as she walks on, then a pass instead
    const wantMeet = meetWant > 0 && clock < meetWant && !driving();
    if (meetWant > 0 && !wantMeet) { meetWant = 0; appear('pass'); return; }
    const kind = wantMeet ? 'meet' : chooseKind();
    appear(kind, { only: kind === 'meet' }).then((ok) => {
      if (ok) { meetWant = 0; return; }
      if (kind === 'meet' && !driving()) { if (!meetWant) meetWant = clock + MEET_WAIT; retryT = 2.5; }
      else if (!cur) retryT = 3;
    });
  }
  story.ticks = story.ticks || [];
  story.ticks.push((dt) => { try { tick(dt); } catch (e) { console.error('heinhtet tick', e); offStage('abort'); } });

  // ---- MENTIONS: the townsfolk talk about him (town chatter lines and pairs)
  let mentionsIn = false;
  function mentionTable() {
    const out = {};
    const flat = (l) => {
      const { when, who, ...rest } = l;
      const wh = when || {};
      if (wh.time || wh.weather === 'dry') return null; // (the chatter has no time-of-day or dry-weather tag)
      const o = { ...rest };
      for (const k of ['from', 'to', 'days', 'flag', 'notFlag']) if (wh[k] != null) o[k] = wh[k];
      if (wh.weather) o.weather = wh.weather;
      if (who != null) o.by = who;
      return o;
    };
    for (const [d, m] of Object.entries(LINES.mentions || {})) {
      if (!TOWNS.includes(d)) continue;
      const town = (m.lines || []).map((l, i) => { const f = flat(l); if (f) f.id = `hh-m:${d}:${i}`; return f; }).filter(Boolean);
      const pairs = (m.pairs || []).filter((p) => !p.when || !(p.when.time || p.when.weather === 'dry'))
        .map((p) => ({ id: p.id, who: p.who || ['*', '*'], lines: p.lines.map(flat).filter(Boolean), ...(p.when ? { when: p.when } : {}) }));
      out[d] = { town, pairs };
    }
    return out;
  }
  function addMentions() {
    const c = story.chatter;
    if (!c || mentionsIn || c.__hhMentions) return !!c;
    mentionsIn = true; c.__hhMentions = true;
    c.ready.then(() => c.addLines(mentionTable())).catch((e) => console.error('heinhtet mentions', e));
    return true;
  }
  if (!addMentions()) { let n = 0; const iv = setInterval(() => { if (addMentions() || ++n > 120) clearInterval(iv); }, 500); }

  // ---- for tests
  function testCall(kind, o = {}) {
    if (cur || pending) { stats.lastMiss = 'busy'; return Promise.resolve(false); }
    const why = o.force ? '' : blockedWhy();
    if (why) { stats.lastMiss = 'gate:' + why; return Promise.resolve(false); }
    if (!o.force && overBudget()) { stats.lastMiss = 'budget'; return Promise.resolve(false); }
    stats.lastMiss = null;
    return appear(kind, o);
  }
  const api = {
    get state() { return { on: !!cur, kind: cur?.kind || null, town: cur?.town || null, leaving, carHold, nextIn: +nextIn.toFixed(1), blocked: blockedWhy(), save: save.hh, pos: hh?.root?.parent ? { x: +hh.root.position.x.toFixed(2), z: +hh.root.position.z.toFixed(2) } : null, anim: hh?.anim || null }; },
    get actor() { return hh; },
    // (tests) each resolves true when he played it, false when he did not (stats().lastMiss says why); the
    // story's gates hold for these too (a town intro, a talk...) unless o.force
    spawnNear: (kind, o = {}) => testCall(kind || chooseKind(), o),
    meet: (id, o = {}) => testCall('meet', { id, only: true, ...o }),
    walkup: (id, o = {}) => testCall('walkup', { id, ...o }),
    carBlock: (id, o = {}) => testCall('carBlock', { id, ...o }),
    carDash: (id, o = {}) => testCall('carDash', { id, ...o }),
    stats() {
      const avg = (a) => (a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : null);
      return { ...stats, avgCallsBefore: avg(stats.callsBefore), avgCallsWith: avg(stats.callsWith), maxCallsWith: stats.callsWith.length ? Math.max(...stats.callsWith) : null, maxTrisWith: stats.trisWith.length ? Math.max(...stats.trisWith) : null, lastFrameCalls: callsNow(), lastFrameTris: trisNow(), meetsUsed: Object.keys(save.hh?.meets || {}), mentions: mentionsIn };
    },
    leave() { if (cur) leaving = true; },
    gone() { offStage('abort'); },
    debug: {
      spawnNow: (kind = 'pass', o = {}) => testCall(kind, { only: true, ...o }),
      walkupNow: (id, o) => api.walkup(id, o),
      carBlockNow: (id, o) => api.carBlock(id, o),
      carDashNow: (id, o) => api.carDash(id, o),
      get auto() { return auto; },
      set auto(on) { auto = !!on; },
      get force() { return force; },
      set force(on) { force = !!on; },
      plan: (kind = 'pass') => planCross(kind),  // (a Promise: the search is spread over frames)
      planCar: (kind = 'dash') => planCarCross(kind),
      whyNot: () => ({ ...whyNot }),
      meets: () => { const mp = mayaXZ(); const t = districtAt(mp.x, mp.z); return meetCandidates(t).map((c) => `${c.m.id}<-${c.e.id}`); },
      town: () => { const mp = mayaXZ(); return districtAt(mp.x, mp.z); },
      blocked: () => blockedWhy(),
      mentionTable,
      busy,
    },
  };
  story.heinhtet = api;
  window.__hh = api;
  return api;
}

function injectStyle() {
  if (document.getElementById('hh-style')) return;
  const s = document.createElement('style');
  s.id = 'hh-style';
  s.textContent = `
  .hh-chat { position: absolute; left: 0; top: 0; z-index: 4; max-width: min(232px, calc(100% - 40px)); pointer-events: none; opacity: 0; visibility: hidden;
    transition: opacity .2s ease; will-change: transform; }
  .hh-chat.show { opacity: 1; z-index: 5; }
  .hh-chat p .nw { white-space: nowrap; }
  .hh-chat p { position: relative; margin: 0; padding: 3px 11px 4px; border-radius: 14px; background: rgba(255, 252, 244, .95); color: #2A2118;
    border: 1.5px solid rgba(164, 122, 44, .45); box-shadow: 0 3px 10px rgba(59, 42, 26, .16);
    font: 600 13.5px/1.75 "Noto Sans Myanmar", system-ui, sans-serif; word-break: keep-all; overflow-wrap: anywhere; text-align: center; }
  html[data-lang="en"] .hh-chat p { line-height: 1.35; padding: 5px 11px; }
  .hh-chat p::after { content: ""; position: absolute; left: var(--tx, 50%); bottom: -6px; width: 10px; height: 10px; margin-left: -5px;
    background: rgba(255, 252, 244, .95); border-right: 1.5px solid rgba(164, 122, 44, .45); border-bottom: 1.5px solid rgba(164, 122, 44, .45); transform: rotate(45deg); }
  .hh-chat.hh p, .hh-chat.hh p::after { border-color: rgba(200, 48, 46, .55); }
  .hh-chat.pb p, .hh-chat.pb p::after { background: rgba(250, 244, 232, .96); }
  .hh-chat.show p { animation: hhPop .26s cubic-bezier(.3, 1.4, .5, 1); }
  .hh-chat.sing p { font-style: italic; color: #6E1F2A; animation: hhPop .26s cubic-bezier(.3, 1.4, .5, 1), hhSway 1.1s ease-in-out .26s infinite; }
  #game.cinema .hh-chat, #game.talking .hh-chat, #game.choosing .hh-chat, #game.acting .hh-chat { opacity: 0 !important; }
  @keyframes hhPop { from { transform: scale(.6) translateY(6px); opacity: 0; } }
  @keyframes hhSway { 0%, 100% { transform: rotate(-2.5deg) translateY(0); } 50% { transform: rotate(2.5deg) translateY(-2px); } }
  `;
  document.head.appendChild(s);
}
