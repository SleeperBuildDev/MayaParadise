// The first-time game intro (owner request, approved storyboard): the first time the story game starts on this
// device for a player with no game yet (a fresh Day 1, before Ma Wint War's letter), Maya introduces the book:
// she waves at her Writing Room, the camera lifts over the Home Book, glides down the ribbon road to the
// Exercise-Book Quarter, then visits every town ahead (one landmark each, its name card, one line from Maya about
// its lesson), a Bookmark Desk, and comes back to her. ~80 s, letterboxed, a Skip button always on screen; tap (or
// Enter / Space) moves the dialogue on. Day 1's own opening then runs exactly as before.
//
//   story.js:  if (introWanted(save, params)) await import('./intro.js').then((m) => m.playIntro(game, story))
//   playIntro(game, story, { force }) -> Promise   resolves once everything is handed back (also on skip / error)
//   window.__intro = { state(), skip() }             tests: { shot, t, skipped, protectedChunks, holds, waits }
//
// Remembered in localStorage 'rc-intro-seen' (set at the end or on skip). A reload mid-intro starts it again; the
// third start in one browser session marks it seen and skips it (so a crash can never loop). ?intro=1 plays it
// again, ?intro=0 never; automated browsers (navigator.webdriver: the test harness) skip it unless ?intro=1.
//
// How the far towns are shown without pop-in (nothing in world/ is edited; all of it is put back afterwards):
//   - the open world streams round ow.focus(): while the intro runs, focus() is the point the camera looks at, so
//     the streamer, the haze, the sun's shadow box and the home book's detail steps all follow the camera (the
//     map's explored-ground marking, ow.seen.mark, is held off: the player has not been there)
//   - the lazy town loader is asked for every town within 70 m of a shot (in shot order, one ahead) and the shot
//     waits for them; then the chunks round the shot are built ahead with streamer.ensureAsync (a slice per frame)
//     while the previous shot plays. Those chunks are held (their `useful` flag is off while held, so the
//     streamer's distance pass neither drops nor re-queues them) until the shot after has started; then they are
//     let go two at a time (no burst of disposals in one frame)
//   - a shot never starts before its chunks are built: the camera holds on the current shot (still drifting) until
//     they are (or skips that town after HOLD_MAX s of waiting, rather than show empty paper)
//   - between towns a page turns over the view (the cut happens under it)
// Nothing else starts while it runs: game.busy (the car, the stick, doors, taps), story.introActive (Ko Hein Htet,
// the roaming townsfolk, the chatter), the letterbox and #game.rc-intro / .ti-flying (hints, barks, the corner map,
// the mode switch); the town fly-overs (story.ui.intro) are held. The day's opening waits for this promise. Music:
// the place's own song keeps playing under a scene (Opening page, the Home Book's tender theme).
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { INTRO, INTRO_UI } from './intro-lines.js';
import { ALL_REGIONS, TOWN_OF, LAZY } from './world/region.js';
import { MARKS, TOWNS } from './world/townintro.js';

const SEEN_KEY = 'rc-intro-seen';
const TRY_KEY = 'rc-intro-tries';
const SLICE = 7; // ms of chunk building per frame (streamer.ensureAsync)
const LOAD_R = 50, AHEAD = 20; // world/stream.js: a chunk within LOAD_R of (x, z - AHEAD) is built for focus (x, z)
const NEED_R = 70; // m: towns whose land is this close to a shot must be here before it
const HOLD_MAX = 24; // s a shot may wait for its town before that town is left out
const CHUNK_GAP = 0.3; // s between two let-go chunks
const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };
const ssGet = (k) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const ssSet = (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } };
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const D2R = Math.PI / 180;

/** Should the intro play now? (story.js asks before importing this file) */
export function introWanted(save, params = new URLSearchParams(location.search)) {
  if (params.get('intro') === '1') return true;
  if (params.get('intro') === '0' || params.has('nointro')) return false;
  if (navigator.webdriver) return false;
  if (lsGet(SEEN_KEY)) return false;
  return !!save && save.day === 1 && !save.flags?.['d1.letter'];
}

// ---------------------------------------------------------------------------------------------
// the shots (world metres; looks at real landmarks of each district: regions/*.js)
// ---------------------------------------------------------------------------------------------
/** look: [x, z]; orbit: a0 / a1 azimuth (degrees, 0 = from the south, + = from the east), R and H (m) from / to. */
const TOWN_SHOTS = [
  // (the Quarter is reached by the road glide: its orbit starts where the glide ends)
  { id: 'exercise', look: [-11.5, 82], orbit: { a0: 18, a1: -22, R0: 33, R1: 31, H0: 30, H1: 27 } }, // the primary school on the second street (a big one: seen from farther)
  { id: 'envelope', glide: [[4, 166], [4, 180], [8.5, 200], [11, 215], [9, 232], [7.5, 246]], off: [-11, 22, 21], prep: [[5, 186], [9, 236]] }, // the folded road itself
  { id: 'market', look: [-13.4, 293], orbit: { a0: -30, a1: 8, R0: 28, R1: 25, H0: 26, H1: 22 } }, // the stamp hall on the counter street
  { id: 'junction', look: [154, 300], orbit: { a0: 32, a1: -8, R0: 28, R1: 25, H0: 27, H1: 23 } }, // the newsprint square and the press
  { id: 'wharf', look: [80, 446], orbit: { a0: -28, a1: 10, R0: 28, R1: 25, H0: 26, H1: 22 } }, // the quay's jetties and boats over the cloud-stream
  { id: 'hearth', look: [141, 193], orbit: { a0: 24, a1: -14, R0: 28, R1: 25, H0: 26, H1: 22 } }, // the bakery and its oven chimneys
  { id: 'garden', look: [240, 93], orbit: { a0: -26, a1: 14, R0: 27, R1: 24, H0: 26, H1: 22 } }, // the dated seed beds by the kiln square
  { id: 'blank', look: [127, -8], orbit: { a0: 30, a1: -8, R0: 30, R1: 27, H0: 29, H1: 25 } }, // the white leaf and its one roof, the travellers' lodge
];
// the road glide from the book's tail over the ribbon bridge and down the Quarter's avenue to the school
const ROAD = [[5.4, 13], [5.4, 19], [5.4, 24], [4.75, 30.5], [4.05, 36], [4, 41.2], [4, 58], [3.2, 68], [-2, 76], [-11.5, 82]];
const ROAD_OFF = [9, 27, 28]; // (ends where the Quarter's orbit starts)
const HOME_DESK = { x: -3.7, z: 11.3 }; // regions/home.js DESKS 'home' (raised and lit from the start)

/** Will playIntro() really play now (wanted, and not the third start in this session)? story.js asks under the
 * turning page of the Game | Website switch: the intro starts at the Writing Room as ever, and opts.endAt (called
 * under the intro's last page) puts her back where the website left her (keepplace.js). */
export function introWillPlay(save, params = new URLSearchParams(location.search), force = params.get('intro') === '1') {
  return introWanted(save, params) && (force || (+ssGet(TRY_KEY) || 0) + 1 <= 2);
}

export async function playIntro(game, story, opts = {}) {
  const ow = story.openWorld;
  const tries = (+ssGet(TRY_KEY) || 0) + 1;
  ssSet(TRY_KEY, String(tries));
  if (!ow?.streamer || game.mode !== 'world' || (tries > 2 && !opts.force)) { lsSet(SEEN_KEY, '1'); return; }
  const dir = createDirector(game, story, ow, opts);
  try { await dir.run(); } catch (err) { console.error('intro', err); } finally {
    try { await dir.end(); } catch (err) { console.error('intro end', err); }
    lsSet(SEEN_KEY, '1');
    ssSet(TRY_KEY, '0');
  }
}

function createDirector(game, story, ow, opts = {}) {
  const streamer = ow.streamer;
  const cam = game.camera;
  const rig = game.rig;
  const gameEl = document.getElementById('game');
  const fog = game.world.scene.fog;
  injectStyle();

  // ---- clock: advances with the game's own frames, so it stops while the app is in the background
  let T = 0, active = true, skipped = false, ended = false;
  const waiters = [];
  const sleep = (s) => new Promise((res) => { if (skipped) res(); else waiters.push({ at: T + s, res }); });
  const frames = (n) => new Promise((res) => { let k = 0; const f = () => (++k >= n ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const st = { shot: 'start', holds: [], waits: [], skippedTowns: [] };

  // ---- the stage: letterbox, nothing else may start, the town fly-overs held
  const cutOn0 = ow.cutOn;
  game.ui.hideCard?.();
  game.ui.hideBark?.();
  game.ui.cinema(true);
  gameEl.classList.add('rc-intro', 'ti-flying');
  story.introActive = true;

  // ---- focus: the open world follows the camera's look point (see the header)
  const F = new THREE.Vector3(game.car.root.position.x, 0, game.car.root.position.z);
  let followCam = false; // false: the open world's own focus (Maya); true: F
  const focus0 = ow.focus;
  const myFocus = function () { return active && followCam ? F : focus0.call(ow); };
  ow.focus = myFocus;
  const seen = ow.seen;
  const mark0 = seen?.mark;
  if (seen && mark0) seen.mark = function (...a) { return active && followCam ? undefined : mark0.apply(this, a); };
  // the haze, after the open world has set its own for the frame (eased: never a jump in the haze)
  let fogTo = null; // { near, far } or null (the world's own)
  let fogN = fog?.near ?? 60, fogF = fog?.far ?? 200;
  const update0 = ow.update;
  const myUpdate = function (dt, t) {
    const out = update0.call(this, dt, t);
    if (active && fog) {
      const k = 1 - Math.exp(-Math.min(dt, 0.1) * 2.2);
      fogN += ((fogTo ? fogTo.near : fog.near) - fogN) * k;
      fogF += ((fogTo ? fogTo.far : fog.far) - fogF) * k;
      fog.near = fogN; fog.far = fogF;
    }
    return out;
  };
  ow.update = myUpdate;
  // the town fly-overs (extras-ui.js / townintro.js) wait: wrapped as soon as they exist
  let tiHeld = null;
  function holdTownIntro() {
    const ti = story.ui?.intro;
    if (!ti || tiHeld?.ti === ti) return;
    const u0 = ti.update;
    const mine = (dt) => (active ? undefined : u0(dt));
    ti.update = mine;
    tiHeld = { ti, u0, mine };
  }

  // ---- held chunks (see the header)
  const held = new Map(); // chunk -> { orig, tags: Set }
  const letGo = [];
  let letGoT = 0;
  const rectDist = (ch, x, z) => Math.hypot(Math.max(ch.x0 - x, 0, x - ch.x1), Math.max(ch.z0 - z, 0, z - ch.z1));
  const usefulOf = (ch) => (held.has(ch) ? held.get(ch).orig || ch.items.length > 0 : ch.useful);
  function around(x, z) {
    const out = [];
    for (const ch of streamer.chunks.values()) if (usefulOf(ch) && rectDist(ch, x, z - AHEAD) < LOAD_R) out.push(ch);
    return out;
  }
  function hold(ch, tag) {
    let h = held.get(ch);
    if (!h) { h = { orig: ch.useful, tags: new Set() }; held.set(ch, h); }
    h.tags.add(tag);
    ch.useful = false;
    const i = letGo.indexOf(ch);
    if (i >= 0) letGo.splice(i, 1);
  }
  function release(tag) {
    for (const [ch, h] of held) if (h.tags.delete(tag) && !h.tags.size && !letGo.includes(ch)) letGo.push(ch);
  }
  function releaseAll() { for (const [ch, h] of held) { h.tags.clear(); if (!letGo.includes(ch)) letGo.push(ch); } }
  let building = Promise.resolve();
  /** Build (and hold) every chunk round each point, a slice per frame. */
  function prebuild(points, tag) {
    const job = building.then(async () => {
      for (const [x, z] of points) {
        if (skipped) return;
        await ow.settleTown?.();
        const set = around(x, z);
        for (const ch of set) ch.useful = true; // (seen by ensureAsync's own filter, read right now...)
        const p = streamer.ensureAsync(x, z, SLICE);
        for (const ch of set) hold(ch, tag); // (...and held from this same moment on)
        await p;
      }
    });
    building = job.catch(() => {});
    return job;
  }

  // ---- the lazy towns each shot needs
  const rectGap = ([a, b, c, d], x, z) => Math.hypot(Math.max(a - x, 0, x - c), Math.max(b - z, 0, z - d));
  function townsNear(points) {
    const out = new Set();
    for (const r of ALL_REGIONS) {
      const t = TOWN_OF[r.id];
      if (!t || r.book) continue;
      if (points.some(([x, z]) => rectGap(r.rect, x, z) < NEED_R)) out.add(t);
    }
    return [...out];
  }
  async function loader() {
    if (!LAZY) return null;
    for (let i = 0; i < 50 && !window.__townLoader; i++) await sleep(0.1);
    return window.__townLoader || null;
  }
  async function townsReady(names) {
    const tl = await loader();
    if (!tl || !names.length) return true;
    let ok = false;
    await Promise.race([Promise.all(names.map((n) => tl.ready(n))).then(() => { ok = true; }), sleep(HOLD_MAX)]);
    return ok;
  }

  // ---- the camera: one pose function at a time, evaluated on the intro's own clock
  let pose = null, poseT0 = 0;
  const pinFn = (P, L) => { if (pose) pose(T - poseT0, P, L); };
  function setPose(fn, { cut = false } = {}) {
    pose = fn;
    poseT0 = T;
    call(rig, 'pin', pinFn, cut ? 1000 : 9);
    if (cut) frames(2).then(() => { if (pose === fn && active) call(rig, 'pin', pinFn, 9); });
  }
  const orbitPose = (look, o, dur) => {
    const L = new THREE.Vector3(look[0], 0.6, look[1]);
    return (u, P, Lk) => {
      const k = u / dur;
      const e = smooth(k) + (k > 1 ? (k - 1) * 0.12 : 0); // (held past its time: a slow drift on, never a freeze)
      const a = (o.a0 + (o.a1 - o.a0) * e) * D2R, R = o.R0 + (o.R1 - o.R0) * Math.min(1, e), H = o.H0 + (o.H1 - o.H0) * Math.min(1, e);
      Lk.copy(L);
      P.set(L.x + Math.sin(a) * R, L.y + H, L.z + Math.cos(a) * R);
      if (followCam) F.set(L.x, 0, L.z);
    };
  };
  function polyline(pts) {
    const seg = [];
    let len = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); len += l; }
    return {
      len,
      at(s, out) {
        s = Math.max(0, Math.min(len, s));
        for (let i = 0; i < seg.length; i++) {
          if (s <= seg[i] || i === seg.length - 1) { const k = seg[i] ? s / seg[i] : 0; return out.set(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, 0, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k); }
          s -= seg[i];
        }
        return out;
      },
    };
  }
  const glidePose = (pts, off, dur, y = 0.5) => {
    const pl = polyline(pts);
    const q = new THREE.Vector3();
    return (u, P, Lk) => {
      pl.at(pl.len * smooth(u / dur), q);
      Lk.set(q.x, y, q.z);
      P.set(q.x + off[0], y + off[1], q.z + off[2]);
      if (followCam) F.set(q.x, 0, q.z);
    };
  };
  const bp = new THREE.Vector3(), bl = new THREE.Vector3();
  const blendPose = (a, b, dur) => (u, P, Lk) => {
    const k = smooth(u / dur);
    a(u, bp, bl);
    b(u, P, Lk);
    P.lerpVectors(bp, P, k);
    Lk.lerpVectors(bl, Lk, k);
  };
  const still = (pos, look) => (u, P, Lk) => { P.copy(pos); Lk.copy(look); };

  // ---- the page that turns between towns
  let cover = null;
  async function coverIn() {
    if (cover) return;
    cover = document.createElement('div');
    cover.className = 'rc-intro-cover';
    cover.innerHTML = '<div class="leaf"></div>';
    gameEl.appendChild(cover);
    call(game.audio, 'play', 'page');
    const a = cover.firstChild.animate?.([{ transform: 'translateX(100%) rotateY(-70deg)', opacity: 0.6 }, { transform: 'translateX(0) rotateY(0deg)', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.4,.1,.3,1)', fill: 'forwards' });
    await (a?.finished?.catch(() => {}) || sleep(0.38));
  }
  async function coverOut() {
    const c = cover;
    if (!c) return;
    cover = null;
    const a = c.firstChild.animate?.([{ transform: 'rotateY(0deg)', opacity: 1 }, { transform: 'rotateY(-95deg)', opacity: 0.2 }], { duration: 440, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'forwards' });
    await (a?.finished?.catch(() => {}) || Promise.resolve());
    c.remove();
  }

  // ---- the name card (the town fly-over's chapter header, style B: world/townintro.js), and the skip button
  let card = null;
  function showCard(id) {
    hideCard();
    const r = ALL_REGIONS.find((q) => q.id === id);
    if (!r) return;
    const el = document.createElement('div');
    el.className = 'rc-intro-card';
    el.innerHTML = `<div class="sheet"><span class="stamp"><svg viewBox="0 0 40 28" aria-hidden="true">${MARKS[TOWNS[id]?.mark] || ''}</svg></span>`
      + `<p class="my">${esc(r.name.my)}</p><span class="rule"><i></i><em></em><i></i></span><p class="en">${esc(r.name.en)}</p></div>`;
    gameEl.appendChild(el);
    requestAnimationFrame(() => el.classList.add('on'));
    card = el;
    call(game.audio, 'play', 'page');
  }
  function hideCard() {
    const el = card;
    card = null;
    if (!el) return;
    el.classList.remove('on');
    el.classList.add('out');
    setTimeout(() => el.remove(), 450);
  }
  const skipBtn = document.createElement('button');
  skipBtn.type = 'button';
  skipBtn.className = 'rc-intro-skip';
  skipBtn.textContent = tr(INTRO_UI.skip);
  skipBtn.setAttribute('aria-label', `${INTRO_UI.skip.my} / Skip the intro`);
  skipBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
  skipBtn.addEventListener('click', (e) => { e.stopPropagation(); skip(); });
  gameEl.appendChild(skipBtn);
  const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); skip(); } };
  addEventListener('keydown', onKey);
  const onLang = () => { skipBtn.textContent = tr(INTRO_UI.skip); };
  document.addEventListener('mw:lang', onLang);
  let skipRes;
  const skipP = new Promise((r) => { skipRes = r; });
  function skip() {
    if (skipped || ended) return;
    skipped = true;
    st.shot = 'skipped';
    for (const w of waiters.splice(0)) w.res();
    skipRes();
    // (ui.say: a line still typing would wait for a tap that never comes once its box is hidden; a new token
    // ends it where it stands)
    game.ui.sayToken = (game.ui.sayToken || 0) + 1;
    game.ui.hideDialog?.();
  }

  // ---- Maya's lines: the story's dialogue box with her face; each moves on by itself (or with a tap)
  let line = null; // { text, need, shownAt }
  const segs = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('my', { granularity: 'grapheme' }) : null;
  const count = (s) => (segs ? Array.from(segs.segment(s)).length : s.length);
  async function say(l, o = {}) {
    if (skipped) return;
    const text = tr(l);
    line = { text, need: 0.7 + count(text) * 0.022, typedAt: -1 };
    try { await Promise.race([story.dialog.say('maya', [l], { face: o.face || 'smile', emote: o.emote, auto: false }), skipP]); } finally { line = null; }
  }

  // ---- per frame (story.ticks: before the open world's own update)
  const dlg = game.ui.els?.dialog, dlgText = game.ui.els?.dialogText;
  function tick(dt) {
    if (active) {
      T += Math.min(dt, 0.1);
      for (let i = waiters.length - 1; i >= 0; i--) if (T >= waiters[i].at) { const w = waiters[i]; waiters.splice(i, 1); w.res(); }
      if (line && dlg && !dlg.hidden && dlgText?.textContent === line.text) {
        if (line.typedAt < 0) line.typedAt = T;
        else if (T - line.typedAt >= line.need) { line.typedAt = 1e9; dlg.click(); }
      }
      holdTownIntro();
      ow.cutOn = followCam ? false : cutOn0; // (no see-through hole round the landmark the camera looks at)
    }
    // held chunks stay held (a town arriving may have flagged one useful again); let go ones leave two at a time
    for (const [ch, h] of held) if (h.tags.size) ch.useful = false;
    letGoT -= dt;
    if (letGo.length && letGoT <= 0) {
      letGoT = CHUNK_GAP;
      for (let n = 0; n < 2 && letGo.length; n++) {
        const ch = letGo.shift();
        const h = held.get(ch);
        if (!h || h.tags.size) continue;
        ch.useful = h.orig || ch.items.length > 0;
        held.delete(ch);
      }
    }
    if (!active && !held.size && !letGo.length) {
      const i = story.ticks.indexOf(tick);
      if (i >= 0) story.ticks.splice(i, 1);
    }
  }
  (story.ticks = story.ticks || []).push(tick);

  // ---------------------------------------------------------------------------------------------
  // the film
  // ---------------------------------------------------------------------------------------------
  let hopP = Promise.resolve();
  const plan = TOWN_SHOTS.map((s) => {
    const pts = s.glide ? s.prep : [s.look];
    return { ...s, pts: s.id === 'exercise' ? [[5, 32], [4, 72], s.look] : pts, ready: null, ok: true };
  });
  // each shot's towns, then its chunks, one shot ahead (the first one right away)
  function prepare(i) {
    const s = plan[i];
    if (!s || s.ready) return s?.ready;
    const t0 = T;
    s.ready = (async () => {
      const lookPts = s.glide ? s.glide : s.id === 'exercise' ? ROAD : [s.look];
      if (!(await townsReady(townsNear(lookPts)))) { s.ok = false; st.skippedTowns.push(s.id); return false; }
      await prebuild(s.pts, s.id);
      st.waits.push({ id: s.id, s: +(T - t0).toFixed(1) });
      return true;
    })();
    return s.ready;
  }
  /** The camera holds on the shot it is in until shot i is built (or HOLD_MAX s). */
  async function waitFor(i) {
    const s = plan[i];
    const t0 = T;
    const ok = await Promise.race([prepare(i), sleep(HOLD_MAX).then(() => false)]);
    if (T - t0 > 0.05) st.holds.push({ id: s.id, s: +(T - t0).toFixed(1) });
    return ok && s.ok && !skipped;
  }

  async function run() {
    window.__intro = { state: () => ({ ...st, t: +T.toFixed(1), skipped, held: held.size, letGo: letGo.length }), skip };
    const maya = game.maya;
    // 1 · the Home Book: she hops out at her Writing Room, turns to us and waves
    st.shot = 'hello';
    prepare(0); // (the road and the Quarter, while she talks)
    const c = game.car.root.position;
    const carView = clearCam(c, { dist: 6.5, h: 2.8, y: 0.7, car: false });
    setPose(still(carView.pos, carView.look));
    let m;
    if (!story.foot.active) {
      game.busy = false; // (foot.toFoot waits for nothing else; it sets busy itself while she hops out)
      hopP = story.foot.toFoot().catch((e) => console.warn('intro hop', e));
      await hopP;
    }
    game.busy = true;
    m = maya.root.position.clone();
    const shot1 = clearCam(m, { toward: [HOME_DESK.x, HOME_DESK.z] }); // (her bookmark desk behind her)
    const look1 = shot1.look.clone(), in1 = shot1.pos.clone().sub(look1).setY(0).normalize().multiplyScalar(0.7);
    setPose(blendPose(still(carView.pos, carView.look), (u, P, L) => { const k = smooth(u / 7); P.set(shot1.pos.x - in1.x * k, shot1.pos.y - 0.1 * k, shot1.pos.z - in1.z * k); L.copy(look1); }, 1.2));
    faceCamera(shot1.pos);
    await sleep(0.5);
    call(maya, 'setFace', 'happy', 4);
    call(maya, 'emote', 'wave');
    await say(INTRO.hello, { face: 'happy' });
    await sleep(0.4);
    if (skipped) return;

    // 2 · the camera lifts over the whole book
    st.shot = 'book';
    const p1 = new THREE.Vector3(), l1 = new THREE.Vector3();
    pinFn(p1, l1);
    const up = { pos: new THREE.Vector3(1, 66, 66), look: new THREE.Vector3(1, 0, -3) };
    const liftFrom = { pos: p1.clone(), look: l1.clone() };
    fogTo = { near: 120, far: 380 };
    followCam = true;
    F.set(1, 0, 18); // (the streamer readies the book's south edge and the bridge)
    call(game.audio, 'play', 'whoosh');
    setPose((u, P, L) => {
      const k = smooth(u / 4.2);
      P.lerpVectors(liftFrom.pos, up.pos, k);
      L.lerpVectors(liftFrom.look, up.look, k);
      if (u > 4.2) { const d = (u - 4.2) * 0.35; P.z -= d; P.y -= d * 0.4; } // (then a slow drift)
    });
    await sleep(1.4);
    await say(INTRO.journey, { face: 'smile' });
    await sleep(Math.max(0, 5.2 - (T - poseT0)));
    if (skipped) return;

    // 3 · down the ribbon road to the Exercise-Book Quarter (the camera holds over the book until it is built)
    const roadOk = await waitFor(0);
    if (skipped) return;
    if (roadOk) {
    st.shot = 'road';
    const roadDur = 9;
    const glide = glidePose(ROAD, ROAD_OFF, roadDur);
    const pFrom = new THREE.Vector3(), lFrom = new THREE.Vector3();
    pinFn(pFrom, lFrom);
    const from = still(pFrom.clone(), lFrom.clone());
    fogTo = null;
    setPose((u, P, L) => {
      // (from the high book view down onto the road over the first 3 s, then the glide itself)
      if (u < 3) { blendPose(from, glide, 3)(u, P, L); return; }
      glide(u, P, L);
    });
    prepare(1);
    await sleep(1.0);
    await say(INTRO.road, { face: 'happy' });
    await sleep(Math.max(0, roadDur + 0.2 - (T - poseT0)));
    if (skipped) return;
    }

    // 4 · the towns, one landmark each (the Quarter flows on from the road; the rest come under a turning page)
    for (let i = 0; i < plan.length && !skipped; i++) {
      const s = plan[i];
      if (i === 0 && !roadOk) continue; // (the road never came: the Quarter is left out with it)
      if (i > 0) {
        const ok = await waitFor(i);
        if (skipped) return;
        if (!ok) continue; // (it never came: that town is left out rather than shown half-built)
        await coverIn();
        if (skipped) return;
        fogTo = fogFor(s);
        if (s.glide) setPose(glidePose(s.glide, s.off, 8.5), { cut: true });
        else setPose(orbitPose(s.look, s.orbit, 7.5), { cut: true });
        await frames(4); // (the streamer and the culling see the new view before the page lifts)
        release(plan[i - 1].id);
        coverOut();
      } else {
        // (the Quarter: an orbit round the school, starting where the glide left the camera)
        fogTo = fogFor(s);
        const o = { ...s.orbit };
        setPose(orbitPose(s.look, o, 7.5));
      }
      st.shot = s.id;
      prepare(i + 1); // (the next town is built while this one plays)
      if (i === plan.length - 1) prepareHome();
      await sleep(0.3);
      showCard(s.id);
      await sleep(0.3);
      await say(INTRO.towns[s.id], { face: s.id === 'hearth' || s.id === 'garden' ? 'happy' : 'smile' });
      await sleep(Math.max(0, 5.0 - (T - poseT0)));
      hideCard();
    }
    if (skipped) return;

    // 5 · a Bookmark Desk on the Home Book (its ribbon already up), then down to Maya
    await Promise.race([homeReady, sleep(HOLD_MAX)]);
    if (skipped) return;
    await coverIn();
    if (skipped) return;
    st.shot = 'desk';
    fogTo = null;
    F.set(HOME_DESK.x, 0, HOME_DESK.z);
    const dk = new THREE.Vector3(HOME_DESK.x, 1.1, HOME_DESK.z);
    const dHigh = new THREE.Vector3(dk.x + 5.5, 11, dk.z + 12), dLow = new THREE.Vector3(dk.x + 3.2, 3.3, dk.z + 6.4);
    setPose((u, P, L) => { const k = smooth(u / 7); P.lerpVectors(dHigh, dLow, k); L.set(dk.x, 1.1 + 0.4 * (1 - k), dk.z); }, { cut: true });
    await frames(4);
    for (const s of plan) release(s.id);
    coverOut();
    await sleep(0.6);
    for (const l of INTRO.desk) { await say(l, { face: 'smile' }); if (skipped) return; }

    // 6 · back to Maya
    st.shot = 'ready';
    followCam = false;
    const mm = maya.root.position.clone();
    const end = clearCam(mm, { toward: [HOME_DESK.x, HOME_DESK.z] });
    const pD = new THREE.Vector3(), lD = new THREE.Vector3();
    pinFn(pD, lD);
    const pD0 = pD.clone(), lD0 = lD.clone();
    // (over an arc: the straight way down passes through the plaza's tall ink pot)
    setPose((u, P, L) => { const k = smooth(u / 2.6); P.lerpVectors(pD0, end.pos, k); P.y += Math.sin(Math.PI * k) * 8; L.lerpVectors(lD0, end.look, k); });
    faceCamera(end.pos);
    await sleep(2.2);
    call(maya, 'emote', 'cheer');
    call(maya, 'setFace', 'happy', 3);
    await say(INTRO.ready, { face: 'happy' });
    await sleep(0.4);
  }

  // the Home Book again at the end (built while the last town plays)
  let homeReady = Promise.resolve();
  function prepareHome() { homeReady = prebuild([[HOME_DESK.x, HOME_DESK.z], [game.maya.root.position.x, game.maya.root.position.z]], 'home').catch(() => {}); }

  function fogFor() {
    // (out on the land: the haze pushed back so the town reads from up high; a wide screen sees farther to the
    // sides, so its haze comes a little nearer)
    return cam.aspect > 1.2 ? { near: 46, far: 128 } : { near: 54, far: 150 };
  }
  /** A camera spot round (m) with nothing between the lens and her (a house, the fountain, the car, a lamp, a tree):
   * no raycasts through the whole world (one was 450 ms on a phone): the open world's own shapes are asked instead,
   * its tall boxes in 3D (a house, a hall: with their real heights) and its keep-out shapes along the ground near
   * her (the fountain, benches, lamps, trunks; the high lens looks over the ones near itself). `toward` [x, z]:
   * a spot to see behind her (her bookmark desk), tried first. -> { pos, look } */
  const nearBuf = [];
  function slab(ax, ay, az, bx, by, bz, o) {
    let t0 = 0, t1 = 1;
    for (const [p, d, lo, hi] of [[ax, bx - ax, o.minX, o.maxX], [ay, by - ay, o.minY ?? 0, o.maxY], [az, bz - az, o.minZ, o.maxZ]]) {
      if (Math.abs(d) < 1e-6) { if (p < lo || p > hi) return -1; continue; }
      let u0 = (lo - p) / d, u1 = (hi - p) / d;
      if (u0 > u1) { const q = u0; u0 = u1; u1 = q; }
      if (u0 > t0) t0 = u0;
      if (u1 < t1) t1 = u1;
      if (t0 > t1) return -1;
    }
    return t0;
  }
  function blocked(m, P, carToo) {
    const R = Math.hypot(P.x - m.x, P.z - m.z) + 12;
    for (const o of ow.tall || []) {
      if (Math.abs(o.x - m.x) > R || Math.abs(o.z - m.z) > R) continue;
      if (P.x > o.minX && P.x < o.maxX && P.z > o.minZ && P.z < o.maxZ && P.y < o.maxY + 0.5) return true; // (the lens inside a house)
      if (m.x > o.minX && m.x < o.maxX && m.z > o.minZ && m.z < o.maxZ) continue; // (a box she stands in: a doorway)
      for (const y of [1.0, 0.45]) { const t = slab(m.x, y, m.z, P.x, P.y, P.z, o); if (t >= 0 && t < 0.98) return true; }
    }
    const sp = ow.space;
    const c = game.car.root.position;
    for (let f = 0.1; f <= 0.75; f += 0.06) {
      const x = m.x + (P.x - m.x) * f, z = m.z + (P.z - m.z) * f;
      if (carToo && Math.hypot(x - c.x, z - c.z) < 1.5) return true;
      if (!sp) continue;
      for (const o of sp.near(x, z, 0.3, nearBuf)) {
        if (o.type === 'circle') { if (Math.hypot(x - o.x, z - o.z) < o.r + 0.25) return true; }
        else if (Math.hypot(x - Math.max(o.minX, Math.min(x, o.maxX)), z - Math.max(o.minZ, Math.min(z, o.maxZ))) < 0.25) return true;
      }
    }
    return false;
  }
  function clearCam(m, { dist = 5.5, h = 2.4, y = 0.6, toward = null, car = true } = {}) {
    const look = new THREE.Vector3(m.x, y, m.z);
    // (azimuths, degrees from the south; with `toward`, round the one that puts that spot behind her)
    const a0 = toward ? Math.atan2(m.x - toward[0], m.z - toward[1]) / D2R : 0;
    const order = toward ? [0, -18, 18, -36, 36, -55, 55, -80, 80, -110, 110, 145, -145, 180] : [-60, 60, -95, 95, -40, 40, -125, 125, -20, 20, 180, 0];
    const pos = new THREE.Vector3();
    for (const [d, hh] of [[dist, h], [dist * 1.3, h * 1.3], [dist * 0.8, h * 1.1]]) {
      for (const a of order) {
        const az = (a0 + a) * D2R;
        pos.set(m.x + Math.sin(az) * d, hh, m.z + Math.cos(az) * d);
        if (!blocked(m, pos, car)) return { pos: pos.clone(), look };
      }
    }
    return { pos: new THREE.Vector3(m.x + Math.sin(a0 * D2R) * dist, h + 2, m.z + Math.cos(a0 * D2R) * dist), look };
  }
  function faceCamera(at) {
    const f = story.foot;
    const p = game.maya.root.position;
    const h = Math.atan2(at.x - p.x, at.z - p.z);
    if (f?.active) { f.walker.stop?.(); f.walker.heading = h; }
    game.maya.root.rotation.set(0, h, 0);
  }

  async function end() {
    if (ended) return;
    ended = true;
    for (const w of waiters.splice(0)) w.res();
    await hopP; // (a skip while she was still hopping out of the car)
    game.ui.hideDialog?.();
    hideCard();
    await coverIn();
    // hand everything back
    active = false;
    followCam = false;
    fogTo = null;
    if (ow.focus === myFocus) ow.focus = focus0;
    if (seen && mark0 && seen.mark !== mark0) seen.mark = mark0;
    if (ow.update === myUpdate) ow.update = update0; // (else it stays, calling straight through: something wrapped it after us)
    if (tiHeld && tiHeld.ti.update === tiHeld.mine) tiHeld.ti.update = tiHeld.u0;
    ow.cutOn = cutOn0;
    pose = null;
    call(rig, 'release');
    if (opts.endAt) { try { opts.endAt(); } catch (err) { console.error('intro endAt', err); } } // (under the page: back where she came in)
    const p = game.maya.root.getWorldPosition(new THREE.Vector3());
    if (story.foot?.active) { rig.setTarget(p); faceCamera(new THREE.Vector3(p.x, 0, p.z + 6)); } else rig.setTarget(game.car.root.position);
    call(rig, 'snap');
    // the land round her again (held chunks of the far towns go two at a time; the ones here are rebuilt under the page)
    await building; // (a build still running keeps its chunks held until it is done)
    releaseAll();
    try { await streamer.ensureAsync(p.x, p.z, SLICE); } catch { /* fine */ }
    skipBtn.remove();
    removeEventListener('keydown', onKey);
    document.removeEventListener('mw:lang', onLang);
    gameEl.classList.remove('rc-intro', 'ti-flying');
    story.introActive = false;
    game.busy = false; // (the day's opening starts from a free stage)
    game.ui.cinema(false);
    await frames(3);
    await coverOut();
    st.shot = skipped ? 'skipped' : 'done';
  }

  return { run, end, skip };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function injectStyle() {
  if (document.getElementById('rc-intro-style')) return;
  const s = document.createElement('style');
  s.id = 'rc-intro-style';
  s.textContent = `
  #game.rc-intro #story-minimap, #game.rc-intro #story-hint, #game.rc-intro #bark, #game.rc-intro .rc-chat, #game.rc-intro .hh-chat { opacity: 0 !important; pointer-events: none !important; }
  .rc-intro-skip { position: absolute; right: calc(12px + env(safe-area-inset-right)); top: calc(8.5vh + 10px + env(safe-area-inset-top)); z-index: 48 !important;
    min-height: 40px; padding: 6px 16px; border-radius: 999px; border: 2px solid #A47A2C; background: rgba(255,253,248,.94); color: #6E1F2A;
    font: 700 13.5px/1.6 "Noto Sans Myanmar", system-ui, sans-serif; box-shadow: 0 3px 0 rgba(164,122,44,.45); cursor: pointer; }
  .rc-intro-skip:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(164,122,44,.45); }
  .rc-intro-cover { position: absolute; inset: 0; z-index: 60 !important; perspective: 1400px; overflow: hidden; pointer-events: none; }
  .rc-intro-cover .leaf { position: absolute; inset: 0; transform-origin: 0 50%;
    background: linear-gradient(90deg, #EFE6D0 0%, #F7F1E1 12%, #FBF7EC 70%, #EDE3CB 100%); box-shadow: inset 0 0 60px rgba(120,90,40,.18); }
  .rc-intro-cover .leaf::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(180deg, transparent 0 27px, rgba(70,110,170,.13) 27px 28px); }
  .rc-intro-cover .leaf::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(0,0,0,.08), transparent 18%); }
  /* the town's name: the fly-over's chapter header (townintro.js card B), under the top letterbox bar */
  .rc-intro-card { position: absolute; left: 0; right: 0; top: calc(8.5vh + 68px + env(safe-area-inset-top)); z-index: 46 !important; display: flex; justify-content: center; pointer-events: none; }
  .rc-intro-card .sheet { position: relative; width: min(84vw, 340px); padding: 18px 18px 12px; text-align: center; background: #FBF6EA;
    border-top: 3px solid #C9A24A; border-bottom: 3px solid #C9A24A; box-shadow: 0 10px 26px rgba(42,33,24,.28); opacity: 0; transform: translateY(-10px);
    transition: opacity .5s ease, transform .5s ease; }
  .rc-intro-card.on .sheet { opacity: 1; transform: none; }
  .rc-intro-card.out .sheet { opacity: 0; transform: translateY(-10px); transition-duration: .4s; }
  .rc-intro-card .my { margin: 0; font: 700 25px/1.75 "Noto Sans Myanmar", system-ui, sans-serif; color: #6E1F2A; }
  .rc-intro-card .en { margin: 0; font: 700 13px/1.4 "Cormorant Garamond", Georgia, serif; letter-spacing: .22em; text-transform: uppercase; color: #7A5A1E; }
  .rc-intro-card .rule { display: flex; align-items: center; justify-content: center; gap: 6px; margin: 0 0 4px; }
  .rc-intro-card .rule i { display: block; height: 2px; width: 34%; background: linear-gradient(90deg, transparent, #C9A24A 30%, #C9A24A); }
  .rc-intro-card .rule i:last-child { background: linear-gradient(90deg, #C9A24A, #C9A24A 70%, transparent); }
  .rc-intro-card .rule em { width: 7px; height: 7px; background: #C9A24A; transform: rotate(45deg); }
  .rc-intro-card .stamp { position: absolute; right: 10px; top: -16px; width: 48px; height: 48px; border-radius: 50%; border: 3px double #6E1F2A;
    background: rgba(255,253,248,.92); display: flex; align-items: center; justify-content: center; transform: rotate(-14deg); opacity: .92; }
  .rc-intro-card .stamp svg { width: 28px; height: 20px; fill: none; stroke: #6E1F2A; stroke-width: 2.6; stroke-linejoin: round; }
  `;
  document.head.appendChild(s);
}
