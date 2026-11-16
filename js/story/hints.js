// The small "what next" line under the top place label (owner, 2026-11-15: "it's hard to start a mission,
// show a very small hint ... but still struggle to complete the mission without finding it").
//
// A hint says WHAT to do next (the goal). It used to say never WHERE (no markers); the owner overrode that on
// 2026-11-16 ("its hard to locate to play the game, show a small mark on the map to show player where to go and if
// that place arrive on screen, show where to click"; the owner chose the DAY'S NEXT STORY PLACE): the line's step
// now has a small gold mark on the corner map (world/minimap.js: a pin inside its window, or a pin with a tiny
// arrow on its rim when the place is further), a gold pin with the name on the notebook map (world/map.js, drawn
// over the unseen ground), and, once the person / door / thing is on screen, a gold tap ring and a small bouncing
// arrow over the border below. Where the step happens comes from data (hints-where.js: who / go / at / target);
// an entry with `mark: false` (the page's surprise) keeps the old border-only behaviour.
// The day tables live in js/story/hints/dayN.js (one per page, loaded lazily; a missing file = no hints):
//
//   export default [
//     { id: 'd4.post', done: (s) => !!s.flag('d4.post.read'), my: '...', en: '...' },
//     { id: 'd4.books', when: (s) => s.has('gift:books'), done: (s) => !!s.flag('d4.give.books'), my, en },
//   ];
//
// s is the story object (s.flag(k), s.has(item), s.save ...). The line shows the FIRST entry whose `when`
// is absent or true and whose `done` is false; a condition that throws counts as false (`when`) / not done
// (`done`). Every entry done = no line.
//
// Optional on an entry:
//   who: 'castId'          the person the step is about (story.people id / cast id / room walk-on id)
//   target: (s) => obj     a thing instead (an Object3D, something with .root, or a {x, y, z} point);
//                          a string is read as story.day[key]. label: { my, en } names it on the border.
//   go / at / mark         where the step happens, for the marks (hints-where.js has the forms)
// The person border (owner, 2026-11-15: "at least make a hint or border around that person when that person
// is on the screen"): while the line's entry has who / target and that one is IN VIEW (in front of the camera,
// on screen, visible, near enough, not behind a building) a soft breathing border with the name sits round
// them. Off screen / not found = no border (the corner map's pin points the way; owner 2026-11-16).
//
// story.js calls installHints(game, story) once.
// Debug: window.__hints = { current(), list(), refresh(), target(), pin(entry|null), where(), mark }.
// mark = { on, x, z, kind } (read by the corner map each tick); mapPin() -> { x, z, name, kind } | null (the notebook map).
// Pure DOM (no draw calls), pointer-events: none (never blocks a tap).
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { castById } from './cast.js';
import { createWhere } from './hints-where.js';

const TICK = 500; // ms between checks
const LAST_HINT_DAY = 15; // the last hints/dayN.js
// overlays that cover the play: the map, the bag, letters, stamps, acts, the fade, the post's lift and slips,
// the page turn, the lazy-town wait screen, the turn-based talk
const OVERLAYS = '#story-map, #story-panel, .story-stamp, .story-letter, .act-wrap, #story-fade.on, .rc-lift, .rc-slip, #story-pageturn, #story-townwait, #rc-talk, #story-choices';
const BUSY_CLASSES = /\b(cinema|talking|choosing|acting|ti-flying|ti-naming)\b/;
// the tap pointer's arrow (pointing down at them; gold with a maroon outline, drawn here)
const HAND_SVG = '<svg viewBox="0 0 20 24" width="16" height="19" aria-hidden="true"><path d="M7 2.2h6v8.6h4.4L10 21.6 2.6 10.8H7z" fill="#C9A24A" stroke="#6E1F2A" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 4.5v7" stroke="#FFF3C8" stroke-width="1.3" stroke-linecap="round" opacity=".7"/></svg>';

export function installHints(game, story) {
  if (story.hints) return story.hints;
  injectStyle();
  const host = document.getElementById('game') || document.body;
  const el = document.createElement('div');
  el.id = 'story-hint';
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = '<span></span>';
  const span = el.firstChild;
  host.appendChild(el);

  let table = null; // the loaded day's entries (null = none / not loaded)
  let tableDay = 0; // which day `table` belongs to
  let loading = 0; // the day being loaded
  let shown = null; // the entry on the line
  let shownLang = '';
  let visible = false;
  let fresh = false; // the text changed while hidden: fade + pulse when it shows
  // where the line's step happens (hints-where.js), for the marks: refreshed every tick (a person walks)
  const where = createWhere(game, story);
  const mark = { on: false, x: 0, z: 0, kind: '' };

  async function load(day) {
    loading = day;
    let list = null;
    // (hints/day1..15.js are the story's pages; after the last page there is no file: no request, no 404 in the console)
    if (day > LAST_HINT_DAY) { table = null; tableDay = day; loading = 0; return; }
    try {
      const mod = await import(`./hints/day${day}.js`);
      list = Array.isArray(mod?.default) ? mod.default : null;
    } catch (e) {
      const msg = String(e?.message || e);
      // a page without a hint file simply has no hints; a broken file is worth seeing
      if (!/Failed to fetch|Importing a module script failed|error loading dynamically imported module|404|Cannot find module/i.test(msg)) console.error(`hints day ${day}`, e);
    }
    if (loading !== day) return; // the page turned again meanwhile
    table = list;
    tableDay = day;
    loading = 0;
    tick();
  }

  const test = (fn, fallback) => {
    if (typeof fn !== 'function') return fallback;
    try { return !!fn(story); } catch { return null; }
  };
  /** The entry the player should see now (or null). */
  let pinned = null; // debug: __hints.pin(entry) forces an entry
  function pick() {
    if (pinned) return pinned;
    if (!table) return null;
    for (const h of table) {
      if (!h) continue;
      if (test(h.when, true) !== true) continue; // gated off (or the gate threw)
      if (test(h.done, false) === true) continue; // finished (a throwing / missing done = not done)
      return h;
    }
    return null;
  }

  function busy() {
    const ui = game.ui || {};
    return !document.body.classList.contains('playing') || !!story.talking || !!game.busy || !!ui.dialogOpen || !!ui.sheetOpen
      || !!game.rig?.cinematic || !!story.townIntro || BUSY_CLASSES.test(host.className) || !!document.querySelector(OVERLAYS);
  }

  function place() {
    // directly under the top label; below the round top buttons too, so the line can use ~70% of the width
    const where = document.getElementById('where');
    if (!where) return;
    const hr = host.getBoundingClientRect();
    let top = where.getBoundingClientRect().bottom - 3;
    for (const id of ['btn-home', 'btn-lang', 'btn-sound']) {
      const b = document.getElementById(id);
      const r = b && b.offsetParent ? b.getBoundingClientRect() : null;
      if (r && r.height) top = Math.max(top, r.bottom + 2);
    }
    el.style.top = `${Math.round(top - hr.top)}px`;
  }

  function tick() {
    const day = story.save?.day | 0;
    if (day && day !== tableDay && day !== loading) { table = null; load(day); }
    const h = pinned || (day === tableDay ? pick() : null);
    const lang = document.documentElement.getAttribute('data-lang') || 'my';
    if (h !== shown || lang !== shownLang) {
      const changed = h !== shown;
      shown = h;
      shownLang = lang;
      if (h) {
        span.textContent = tr({ my: h.my, en: h.en });
        el.lang = lang === 'en' ? 'en' : 'my';
        if (changed) fresh = true;
      }
    }
    const show = !!shown && !busy();
    if (show) place();
    // the marks: only while the line itself shows (rooms, talks, acts, overlays, cut-scenes, the intro hide it)
    const w = show ? where.resolve(shown) : null;
    mark.on = !!(w && w.ok);
    if (mark.on) { mark.x = w.x; mark.z = w.z; mark.kind = w.kind; }
    if (show && fresh) {
      fresh = false;
      // a gentle fade with one small pulse (restart the animation)
      el.classList.remove('fresh');
      void el.offsetWidth;
      el.classList.add('fresh');
    }
    if (show !== visible) { visible = show; el.classList.toggle('on', show); }
  }

  // ---------------------------------------------------------------- the person border
  // A soft border with the name round the step's person while they are in view. Resolved a few times a
  // second (cached), projected every frame, DOM only; nothing at all while they are out of view.
  const ring = document.createElement('div');
  ring.id = 'story-hint-who';
  // (+ the tap pointer, owner 2026-11-16: a gold ring where to tap and a small bouncing arrow above the name; icons only)
  ring.innerHTML = '<div class="b"><i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i></div><u class="tap"></u><em class="hand">' + HAND_SVG + '</em><span></span>';
  const ringName = ring.lastChild;
  const ringHand = ring.querySelector('.hand');
  host.appendChild(ring);
  const RESOLVE_MS = 400, SIGHT_MS = 250;
  const MAX_DIST = 60; // metres from the camera outdoors (the driving camera sits ~35 m back; rooms: no cap)
  const vFoot = new THREE.Vector3(), vTop = new THREE.Vector3(), vCam = new THREE.Vector3();
  const nearBuf = [];
  let tgt = { key: null, obj: null, person: null, point: null, name: null, at: -1e9, sightAt: -1e9, blocked: false };
  let ringOn = false, ringNameKey = '', ringTap = false;
  // the mark's own place on screen (a door, a thing, or the person when the border's lookup did not find them)
  const altPoint = { x: 0, y: 1, z: 0 };
  const alt = { key: null, h: null, room: null, kind: '', obj: null, person: null, point: null, name: null, at: 0, sightAt: -1e9, blocked: false };
  let last = { x: 0, y: 0, w: 0, h: 0 };
  let nameW = 0, nameShift = 0;
  let report = { who: null, found: false, onScreen: false, rect: null };
  const nameText = (n) => (!n ? '' : typeof n === 'string' ? n : tr(n));

  function resolve(h, now) {
    const key = h ? (h.who ? `who:${h.who}` : h.target ? `target:${h.id}` : null) : null;
    if (key !== tgt.key) tgt = { key, obj: null, person: null, point: null, name: null, at: -1e9, sightAt: -1e9, blocked: false };
    if (!key) return tgt;
    // a found person stays cached until they leave the scene; a miss is looked for again a few times a second
    if (tgt.obj && tgt.obj.parent && now - tgt.at < RESOLVE_MS * 5) return tgt;
    if (now - tgt.at < RESOLVE_MS) return tgt;
    tgt.at = now;
    tgt.obj = tgt.person = tgt.point = null;
    try {
      if (h.who) {
        const id = h.who;
        const c = castById(id);
        const e = story.people?.get(id) || (c && c.id !== id ? story.people?.get(c.id) : null);
        if (e?.p?.root) { tgt.obj = e.p.root; tgt.person = e.p; tgt.name = e.cast?.name || e.name || c?.name; }
        else {
          const w = story.doors?.walkOn?.(id); // a room walk-on drawn by doors.js
          if (w?.p?.root) { tgt.obj = w.p.root; tgt.person = w.p; tgt.name = c?.name || w.name; }
        }
        if (!tgt.name) tgt.name = c?.name || null;
      }
      if (!tgt.obj && h.target) { // a thing (or the thing to fall back on when the person is not about)
        const t = typeof h.target === 'function' ? h.target(story) : story.day?.[h.target];
        if (t?.root?.isObject3D) { tgt.obj = t.root; tgt.person = typeof t.headTop === 'function' ? t : null; }
        else if (t?.isObject3D) tgt.obj = t;
        else if (t && Number.isFinite(t.x) && Number.isFinite(t.z)) tgt.point = { x: t.x, y: t.y || 0, z: t.z };
        tgt.name = h.label || null;
      }
    } catch { tgt.obj = tgt.person = tgt.point = null; }
    return tgt;
  }

  /** On the scene being drawn, with every parent visible. */
  function shown3d(o) {
    for (let n = o; n; n = n.parent) {
      if (!n.visible) return false;
      if (n === game.scene) return true;
    }
    return false;
  }

  // Outdoors: is a building between the camera and them? The open world's tall boxes (the cutaway's own
  // buildings, with their real heights) in 3D: hidden only when the lines of sight to their chest AND their head
  // are both cut. (A flat 2D test hid nearly everyone: the high camera looks over the stalls and roofs in front.)
  // A box that holds either end (a doorway, a market hall they stand in) is not counted.
  function slab(ax, ay, az, bx, by, bz, o) {
    let t0 = 0, t1 = 1;
    for (const [p, d, lo, hi] of [[ax, bx - ax, o.minX, o.maxX], [ay, by - ay, o.minY ?? 0, o.maxY], [az, bz - az, o.minZ, o.maxZ]]) {
      if (Math.abs(d) < 1e-6) { if (p < lo || p > hi) return -1; continue; }
      let u0 = (lo - p) / d, u1 = (hi - p) / d;
      if (u0 > u1) { const s = u0; u0 = u1; u1 = s; }
      if (u0 > t0) t0 = u0;
      if (u1 < t1) t1 = u1;
      if (t0 > t1) return -1;
    }
    return t0;
  }
  function behindWall(ax, ay, az, bx, bz, chestY, headY) {
    if (game.mode !== 'world') return false;
    const tall = story.openWorld?.tall;
    if (Array.isArray(tall)) {
      const R = Math.hypot(bx - ax, bz - az) + 14;
      const m = game.maya?.root?.position; // a building between the camera and Maya is faded out by the cutaway
      for (const o of tall) {
        if (Math.abs(o.x - bx) > R || Math.abs(o.z - bz) > R) continue;
        const inA = ax > o.minX && ax < o.maxX && az > o.minZ && az < o.maxZ;
        const inB = bx > o.minX && bx < o.maxX && bz > o.minZ && bz < o.maxZ;
        if (inA || inB) continue;
        const tc = slab(ax, ay, az, bx, chestY, bz, o);
        if (tc < 0 || tc > 0.97) continue;
        const th = slab(ax, ay, az, bx, headY, bz, o);
        if (th < 0 || th > 0.97) continue;
        if (m) { const tm = slab(ax, ay, az, m.x, 1.0, m.z, o); if (tm >= 0 && tm < 0.97) continue; }
        return true;
      }
      return false;
    }
    return behindWall2d(ax, az, bx, bz);
  }
  // (fallback without the tall list: 2D, big keep-out boxes only; a stall or a bench never hides anyone)
  function behindWall2d(ax, az, bx, bz) {
    const space = story.openWorld?.space;
    if (!space) return false;
    const mx = (ax + bx) / 2, mz = (az + bz) / 2, r = Math.hypot(bx - ax, bz - az) / 2 + 0.5;
    const dx = bx - ax, dz = bz - az;
    for (const o of space.near(mx, mz, r, nearBuf)) {
      if (o.type === 'circle' || o.person) continue;
      if (o.maxX - o.minX < 2.4 || o.maxZ - o.minZ < 2.4) continue;
      const inA = ax > o.minX - 0.3 && ax < o.maxX + 0.3 && az > o.minZ - 0.3 && az < o.maxZ + 0.3;
      const inB = bx > o.minX - 0.3 && bx < o.maxX + 0.3 && bz > o.minZ - 0.3 && bz < o.maxZ + 0.3;
      if (inA || inB) continue;
      // slab test: the segment a -> b against the box
      let t0 = 0, t1 = 1;
      for (const [p, d, lo, hi] of [[ax, dx, o.minX, o.maxX], [az, dz, o.minZ, o.maxZ]]) {
        if (Math.abs(d) < 1e-6) { if (p < lo || p > hi) { t0 = 2; break; } continue; }
        let u0 = (lo - p) / d, u1 = (hi - p) / d;
        if (u0 > u1) { const s = u0; u0 = u1; u1 = s; }
        t0 = Math.max(t0, u0); t1 = Math.min(t1, u1);
        if (t0 > t1) break;
      }
      if (t0 <= t1) return true;
    }
    return false;
  }

  /** Screen rect of the target in host pixels, or null when it is not in view. */
  function project(t, now) {
    const cam = game.camera;
    if (!cam) return null;
    if (t.obj) {
      if (!shown3d(t.obj)) return null;
      vFoot.setFromMatrixPosition(t.obj.matrixWorld);
      if (t.person) t.person.headTop(vTop);
      else vTop.copy(vFoot).y += 1.2;
    } else if (t.point) {
      vFoot.set(t.point.x, Math.max(0, t.point.y - 0.45), t.point.z); // a thing: framed round its point (a desk top, a shelf)
      vTop.set(t.point.x, t.point.y + 0.75, t.point.z);
    } else return null;
    vCam.setFromMatrixPosition(cam.matrixWorld);
    const dist = vCam.distanceTo(vFoot);
    if (game.mode === 'world' && dist > MAX_DIST) return null;
    if (now - t.sightAt > SIGHT_MS) { t.sightAt = now; try { t.blocked = behindWall(vCam.x, vCam.y, vCam.z, vFoot.x, vFoot.z, vFoot.y + Math.min(1, (vTop.y - vFoot.y) * 0.6), vTop.y - 0.05); } catch { t.blocked = false; } }
    if (t.blocked) return null;
    // in front of the camera (view space z < 0) for both ends
    vFoot.applyMatrix4(cam.matrixWorldInverse);
    vTop.applyMatrix4(cam.matrixWorldInverse);
    if (vFoot.z > -0.2 || vTop.z > -0.2) return null;
    vFoot.applyMatrix4(cam.projectionMatrix);
    vTop.applyMatrix4(cam.projectionMatrix);
    const cv = game.renderer?.domElement;
    const cr = cv ? cv.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
    const hr = host.getBoundingClientRect();
    const sx = (n) => cr.left - hr.left + (n + 1) / 2 * cr.width;
    const sy = (n) => cr.top - hr.top + (1 - n) / 2 * cr.height;
    const fx = sx(vFoot.x), fy = sy(vFoot.y), ty = sy(vTop.y), tx = sx(vTop.x);
    const hgt = Math.abs(fy - ty);
    if (hgt < 16) return null; // too far to read: leave it to the eyes
    const pad = Math.max(7, hgt * 0.12);
    const w = Math.max(32, hgt * 0.62) + pad * 2;
    const cx = (fx + tx) / 2;
    const rect = { x: cx - w / 2, y: Math.min(ty, fy) - pad, w, h: hgt + pad * 2 };
    // on screen: the middle of them inside the picture, and most of the box too
    const W = cr.width, H = cr.height, ox = cr.left - hr.left, oy = cr.top - hr.top;
    if (cx < ox || cx > ox + W || (fy + ty) / 2 < oy || (fy + ty) / 2 > oy + H) return null;
    const vis = (Math.min(rect.x + rect.w, ox + W) - Math.max(rect.x, ox)) * (Math.min(rect.y + rect.h, oy + H) - Math.max(rect.y, oy));
    if (vis < rect.w * rect.h * 0.6) return null;
    return rect;
  }

  let raf = 0;
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const h = shown;
    const want = !!(h && (h.who || h.target));
    let rect = null, t = null;
    if (want) t = resolve(h, ts);
    else if (tgt.key) resolve(null, ts);
    // the mark's place instead: a `go` place, or what go / at / the room casts found when the border's own lookup did not
    // (a door, a thing; never a whole town or stretch of ground)
    const w = where.out;
    const useAlt = !!(h && h.mark !== false && mark.on && w.ok && w.kind !== 'area' && (h.go != null || !(t && (t.obj || t.point))));
    if (useAlt) {
      if (alt.h !== h || alt.room !== w.room || alt.kind !== w.kind) { // (a new place: no string built per frame)
        alt.h = h; alt.room = w.room; alt.kind = w.kind;
        alt.key = `alt:${h.id}|${w.room || w.kind}`; alt.sightAt = -1e9; alt.blocked = false;
      }
      alt.obj = w.obj; alt.person = w.person;
      if (!w.obj) { altPoint.x = w.x; altPoint.y = w.y; altPoint.z = w.z; alt.point = altPoint; } else alt.point = null;
      alt.name = w.name;
      t = alt;
    }
    if (t && (t.obj || t.point) && !busy()) { try { rect = project(t, ts); } catch { rect = null; } }
    // the tap pointer: on the step's own person / thing / door (not a person the step is only about, when it happens elsewhere)
    const tap = !!(rect && h && h.mark !== false && (useAlt || h.go == null));
    if (tap !== ringTap) { ringTap = tap; ring.classList.toggle('tap', tap); }
    report = { who: h?.who || (h?.target ? h.id : null), found: !!(t && (t.obj || t.point)), onScreen: !!rect, tap, alt: useAlt, rect: rect && { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.w), h: Math.round(rect.h) } };
    if (rect) {
      if (Math.abs(rect.x - last.x) > 0.4 || Math.abs(rect.y - last.y) > 0.4) { ring.style.transform = `translate3d(${rect.x.toFixed(1)}px, ${rect.y.toFixed(1)}px, 0)`; last.x = rect.x; last.y = rect.y; }
      if (Math.abs(rect.w - last.w) > 0.4 || Math.abs(rect.h - last.h) > 0.4) { ring.style.width = `${rect.w.toFixed(1)}px`; ring.style.height = `${rect.h.toFixed(1)}px`; last.w = rect.w; last.h = rect.h; }
      const nk = `${t.key}|${document.documentElement.getAttribute('data-lang') || 'my'}`;
      if (nk !== ringNameKey) {
        ringNameKey = nk;
        const n = nameText(t.name);
        ringName.textContent = n;
        ringName.style.display = n ? '' : 'none';
        ring.lang = /^en$/.test(document.documentElement.getAttribute('data-lang') || '') ? 'en' : 'my';
        nameW = n ? ringName.offsetWidth : 0;
        ring.classList.toggle('noname', !n);
        if (!n && nameShift) { nameShift = 0; ringName.style.marginLeft = ringHand.style.marginLeft = '0px'; }
      }
      // the name stays readable at the screen's edges (the border itself may run off a little); the arrow rides on it
      if (nameW) {
        const want = rect.x + rect.w / 2 - nameW / 2;
        const shift = Math.round(Math.min(Math.max(want, 4), host.clientWidth - nameW - 4) - want);
        if (shift !== nameShift) { nameShift = shift; ringName.style.marginLeft = `${shift}px`; ringHand.style.marginLeft = `${shift}px`; }
      }
    }
    if (!!rect !== ringOn) { ringOn = !!rect; ring.classList.toggle('on', ringOn); }
  }
  raf = requestAnimationFrame(frame);

  const timer = setInterval(tick, TICK);
  const onLang = () => tick();
  document.addEventListener('mw:lang', onLang);
  tick();

  const api = {
    el,
    current: () => (shown ? { id: shown.id, my: shown.my, en: shown.en, who: shown.who || null, visible } : null),
    list: () => (table || []).map((h) => ({ id: h?.id, when: test(h?.when, true), done: test(h?.done, false), my: h?.my, en: h?.en })),
    refresh: () => { tableDay = 0; loading = 0; table = null; shown = null; tick(); },
    /** The border's state: { who, found, onScreen, tap, alt, rect } (rect in #game pixels). */
    target: () => report,
    /** The corner map's mark (live object, refreshed every tick): { on, x, z, kind }. */
    mark,
    /** Where the line's step happens now (debug): hints-where.js's answer for the shown entry. */
    where: () => { const o = where.resolve(pinned || shown); return o.ok ? { x: +o.x.toFixed(2), z: +o.z.toFixed(2), kind: o.kind, room: o.room, name: nameText(o.name) || null, live: !!o.obj } : null; },
    /** The notebook map's pin (the map hides the line, so this asks directly): { x, z, name, kind } or null. */
    mapPin: () => { const o = where.resolve(shown); return o.ok ? { x: o.x, z: o.z, name: o.name, kind: o.kind } : null; },
    /** Debug: force an entry ({ id, my, en, who?, target? }) on the line; null goes back to the table. */
    pin: (entry) => { pinned = entry || null; tick(); return api.current(); },
    dispose() { clearInterval(timer); cancelAnimationFrame(raf); document.removeEventListener('mw:lang', onLang); el.remove(); ring.remove(); story.hints = null; },
  };
  story.hints = api;
  window.__hints = api;
  return api;
}

function injectStyle() {
  if (document.getElementById('story-hint-style')) return;
  const s = document.createElement('style');
  s.id = 'story-hint-style';
  s.textContent = `
  #story-hint { position: absolute; left: 50%; top: 52px; z-index: 28 !important; transform: translateX(-50%); max-width: 70%; pointer-events: none;
    opacity: 0; visibility: hidden; transition: opacity .6s ease, visibility 0s linear .6s; }
  #story-hint.on { opacity: 1; visibility: visible; transition: opacity .6s ease, visibility 0s; }
  #story-hint span { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; padding: 1px 10px 2px; border-radius: 999px;
    background: rgba(246, 240, 226, .72); border: 1px solid rgba(164, 122, 44, .28); box-shadow: 0 1px 4px rgba(42, 33, 24, .10);
    color: #6E1F2A; font: 600 11.5px/1.75 "Noto Sans Myanmar", system-ui, sans-serif; text-shadow: 0 1px 0 rgba(255, 255, 255, .8); }
  #story-hint[lang="en"] span { font-size: 12px; line-height: 1.5; font-style: italic; }
  #story-hint.on.fresh span { animation: rchint 1s ease both; }
  @keyframes rchint { 0% { opacity: 0; transform: translateY(-3px); } 55% { opacity: 1; transform: scale(1.04); } 100% { opacity: 1; transform: none; } }
  #story-hint-who { position: absolute; left: 0; top: 0; width: 40px; height: 80px; z-index: 27 !important; pointer-events: none;
    opacity: 0; visibility: hidden; transition: opacity .5s ease, visibility 0s linear .5s; will-change: transform; }
  #story-hint-who.on { opacity: 1; visibility: visible; transition: opacity .5s ease, visibility 0s; }
  #story-hint-who .b { position: absolute; inset: 0; border-radius: 12px; border: 1px solid rgba(246, 240, 226, .38);
    filter: drop-shadow(0 0 2px rgba(164, 122, 44, .85)) drop-shadow(0 1px 1px rgba(42, 33, 24, .3));
    animation: rchwho 2.6s ease-in-out infinite alternate; }
  #story-hint-who i { position: absolute; width: 11px; height: 11px; border: 0 solid rgba(250, 244, 230, .96); }
  #story-hint-who .tl { left: -1px; top: -1px; border-width: 2px 0 0 2px; border-top-left-radius: 9px; }
  #story-hint-who .tr { right: -1px; top: -1px; border-width: 2px 2px 0 0; border-top-right-radius: 9px; }
  #story-hint-who .bl { left: -1px; bottom: -1px; border-width: 0 0 2px 2px; border-bottom-left-radius: 9px; }
  #story-hint-who .br { right: -1px; bottom: -1px; border-width: 0 2px 2px 0; border-bottom-right-radius: 9px; }
  #story-hint-who span { position: absolute; left: 50%; top: -4px; transform: translate(-50%, -100%); white-space: nowrap; max-width: 46vw;
    overflow: hidden; text-overflow: ellipsis; padding: 0 8px 1px; border-radius: 999px; background: rgba(246, 240, 226, .82);
    border: 1px solid rgba(164, 122, 44, .35); box-shadow: 0 1px 3px rgba(42, 33, 24, .14);
    color: #6E1F2A; font: 600 10.5px/1.7 "Noto Sans Myanmar", system-ui, sans-serif; text-shadow: 0 1px 0 rgba(255, 255, 255, .8); }
  #story-hint-who[lang="en"] span { font-size: 11px; line-height: 1.45; }
  @keyframes rchwho { from { opacity: .5; } to { opacity: 1; } }
  #story-hint-who .tap, #story-hint-who .hand { display: none; position: absolute; left: 50%; pointer-events: none; }
  #story-hint-who .tap { top: 50%; width: min(44px, 92%); aspect-ratio: 1; border-radius: 50%; border: 2px solid rgba(201, 162, 74, .95);
    box-shadow: 0 0 0 1px rgba(110, 31, 42, .5), inset 0 0 0 1px rgba(110, 31, 42, .35); opacity: .8; transform: translate(-50%, -50%) scale(.9); }
  #story-hint-who .hand { top: -26px; transform: translate(-50%, -100%); filter: drop-shadow(0 1px 1px rgba(42, 33, 24, .35)); }
  #story-hint-who.noname .hand { top: -4px; }
  #story-hint-who .hand svg { display: block; animation: rchhand .9s ease-in-out infinite alternate; }
  #story-hint-who.tap .tap { display: block; animation: rchtap 1.4s ease-in-out infinite alternate; }
  #story-hint-who.tap .hand { display: block; }
  @keyframes rchtap { from { opacity: .95; transform: translate(-50%, -50%) scale(.78); } to { opacity: .45; transform: translate(-50%, -50%) scale(1.02); } }
  @keyframes rchhand { from { transform: translateY(-4px); } to { transform: translateY(1px); } }
  `;
  document.head.appendChild(s);
}
