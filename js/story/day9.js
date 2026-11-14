// Day 9 (Hearth Row opens) — chapter 14, ကိုယ့်ကြောင့် (Because of Me), in full, and chapter 15,
// သူငယ်ချင်းကောင်း (A Good Friend), Day 1 of 2 (its N and stamp come on Day 10). day9-spec.md, INDEX 9/13/14.
//
// Lessons (INDEX 14): ch 14 (p74-75) let no one be made unhappy because of you; "rough mouth, good heart" is a
// cover; the one who burns first is the teacher, then the heat strikes the pupil; if he learns while you burn,
// can he not learn without it? Putting your own fault right is your own duty, no leaning on a good.
// ch 15 (p76-78) a good friend helps with the trouble no eye can see: hears a stifled heart out first, in private,
// then shows the way out of his own mistake; like finds like; in a squabble take no side, each mends their own
// tone. Main quest: Maya answers questions with questions; the people she helped begin to help others.
//
// The day, in order (any order after the cart):
//   home      morning post (notebook line, Ko Wunna's letter, Toe Toe's question, the Caterpillar and the Beetle)
//             · the "ask Maya" board on the Post Office wall (8.1, any time)
//   the Row   arrival line · the cart tips at the scorch ring, the whole row helps, three loaves carried back (6.1)
//   bakery    (room) ch 14: 5.1 at the oven · 5.2 watch one tray (four taps) · 5.3 her talk · 5.4 sort · kmSays ·
//             5.5 holdback · 5.6 the two trays on rack B · the eraser
//   noodle    (room) 6.2 Ei Mon noticed his eyes
//   yard      (outdoors, behind the bakery) 6.3 he eats alone: three looks
//   noodle    (room) 6.4 Maya asks back and gives the pot of tea, not the words
//   yard      6.5 Ei Mon's talk with him (`by: 'eimon'`, advice face down)
//   cart      6.6 their squabble at the bakery front · twine, umbrella, the teapot back refilled
//   class     (room) 8.2 Nay Chi asks to be told; Maya asks back
//   desks     hearthWest, hearthClass (pick the true line first) · rumours · the torn crease (twine) · the clasp
//   home      night page at the Writing Room door: stamp ✓14, page 15 in pencil, save.day = 10
// No markers anywhere: people say where things are; the player taps what is really there.
//
// Test hooks: window.__day9 = { F, flags(), state(), skipTo(beat), done(beat), go(place), tapWatch(), run: {...} }
// Burmese lines (day9-lines.js, talks/day9.js) are drafts for Maya to proofread.
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { createPerson } from './people.js';
import { morningPost, nightPage, showSlip, showLetter } from './post.js';
import { sort } from './acts/sort.js';
import { holdback } from './acts/holdback.js';
import { trace } from './acts/trace.js';
import { TALK_D9_KHINMAY, TALK_D9_ARKAR, TALK_D9_SQUABBLE } from './talks/day9.js';
import { L, SLEPT9 } from './day9-lines.js';
import { buildStreet, P } from './day9-street.js';

export { SLEPT9 };

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const HEARTH = [119, 138, 269, 258]; // regions/hearth.js REGION.rect
const inHearth = (x, z) => x >= HEARTH[0] && x <= HEARTH[2] && z >= HEARTH[1] && z <= HEARTH[3];
// indoors: the close, low follow camera (never the far whole-room view)
const ROOM_CAM = { tilt: 30, width: 5.4, widthLandscape: 11, height: 0.9, minHeight: 0, bounds: null, stiffness: 5 };
// the lamp-mender is a walk-on (not in cast.js: SHARED NEEDS); drawn with people.js and talked to as a person
const LAMP_LOOK = { age: 'elder', build: 'slim', skin: 3, hair: 'short', hairColor: 'white', top: 'shirt', topColor: 'grey', bottom: 'longyi', bottomColor: 'brown', check: true, extras: ['glasses'] };
const MANAGED = ['wintwar', 'naychi', 'sawyu', 'lampman', 'eimon', 'maungarkar', 'micho', 'toetoe'];

export async function create(story) {
  const { game, dialog: D, save } = story;
  const F = (k, v) => story.flag(`d9.${k}`, v);
  const people = story.people;
  const v3 = new THREE.Vector3();
  const ab = game.world.places.find((p) => p.id === 'about').door;

  // ---- the street, the doors, the board
  const S = buildStreet(game, story, { notes: L.noteWallNotes });
  // (the Row's doors, bakery / noodlehouse / eveningclass, are the region's: regions/hearth.js DOORS)
  // a page needs its items with it (INDEX 4): the pot of tea is a keepsake from Day 4
  if (!story.has('teapot') && !F('teaGiven')) story.give('teapot', 1, { quiet: true });

  // ---- small helpers ------------------------------------------------------------------------
  let scening = false; // a scripted scene owns the street people
  let dirty = true; // the street people need re-placing (done when outdoors and free)
  let built = null; // the room as built while inside one of today's rooms
  const tweens = [];
  const tween = (dur, fn) => new Promise((res) => tweens.push({ t: 0, dur, fn, res }));

  function lampSpawn(at) {
    let e = people.get('lampman');
    if (e) return e;
    const p = createPerson(LAMP_LOOK);
    p.root.position.set(at.x, 0, at.z);
    p.root.rotation.y = at.heading ?? 0;
    p.root.userData.isPerson = true;
    (story.inRoom ? built?.scene || game.scene : game.world.scene).add(p.root);
    e = { id: 'lampman', cast: { id: 'lampman', name: L.lmName, look: LAMP_LOOK }, p, home: { x: at.x, z: at.z, h: at.heading ?? 0 }, ob: { type: 'circle', x: at.x, z: at.z, r: p.radius, person: 'lampman' }, onTalk: null, walking: null };
    people.set('lampman', e);
    return e;
  }
  function spawn(id, at) {
    if (id === 'lampman') return lampSpawn(at);
    return story.spawn(id, at);
  }
  function drop(id) {
    const e = people.get(id);
    if (!e) return;
    if (id === 'lampman') { e.p.root.removeFromParent(); e.p.dispose(); people.delete(id); return; }
    story.remove(id);
  }
  /** Put someone at (x, z) facing h (spawn if needed); indoors `at` may be a room spot name. */
  function place(id, at) {
    if (typeof at === 'string') at = built?.spots?.[at] ? { ...built.spots[at], heading: built.spots[at].h } : null;
    if (!at) return null;
    const h = at.heading ?? at.h ?? 0;
    let e = people.get(id);
    if (!e) return spawn(id, { x: at.x, z: at.z, heading: h });
    e.walking = null;
    e.p.root.position.set(at.x, 0, at.z);
    e.p.root.rotation.y = h;
    e.ob.x = at.x; e.ob.z = at.z;
    e.home = { x: at.x, z: at.z, h };
    return e;
  }
  const walk = (id, x, z, sp = 1.4, h = null) => Promise.race([story.walkPerson(id, x, z, sp), wait(14000)]).then(() => {
    const e = people.get(id);
    if (e && h != null) { e.p.root.rotation.y = h; e.home.h = h; }
  });
  // a walk that always ends there: the walk grid can find no way round a kerb prop now and then, and a person left
  // "walking" for ever holds up the street (syncStreet skips them, the yard and cart talks wait for them)
  const walkSure = (id, x, z, sp = 1.4, h = null) => walk(id, x, z, sp, h).then(() => {
    const e = people.get(id);
    if (e && (e.walking || Math.hypot(e.p.root.position.x - x, e.p.root.position.z - z) > 0.9)) place(id, { x, z, heading: h ?? e.p.root.rotation.y });
  });
  const walkMaya = (x, z) => new Promise((r) => { let done = false; const fin = () => { if (!done) { done = true; r(); } }; story.foot.walkTo(x, z, fin); setTimeout(fin, 7000); });
  const mayaXZ = () => (story.foot.active ? { x: story.foot.pos.x, z: story.foot.pos.y } : { x: game.car.root.position.x, z: game.car.root.position.z });
  const near = (p, r) => { const m = mayaXZ(); return Math.hypot(m.x - p.x, m.z - p.z) < r; };

  /** Someone speaks (the lamp-mender is a walk-on: his name is drawn here). */
  async function say(id, lines, o = {}) {
    if (!Array.isArray(lines)) lines = [lines];
    if (id !== 'lampman') return D.say(id, lines, o);
    const e = people.get('lampman');
    const nameEl = document.querySelector('#dialog .dialog-name');
    if (nameEl) nameEl.textContent = tr(L.lmName);
    call(e?.p, 'talk', 3);
    await game.ui.say(lines, { face: e?.p.portrait(o.face || 'smile'), auto: o.auto ?? false, onTick: () => call(game.audio, 'play', 'type') });
    call(e?.p, 'talk', 0);
    if (nameEl) nameEl.textContent = tr({ my: 'မာရာ', en: 'Maya' });
  }
  /** Run a scripted bit with the street and the taps held (safe to nest inside story.talkTo). */
  async function hold(fn) {
    if (story.talking) return fn();
    story.talking = true;
    game.ui.cinema(true);
    try { return await fn(); } finally {
      story.talking = false;
      game.ui.cinema(false);
      game.rig.release();
    }
  }
  function pencil(id) {
    if (!F(`rumour.${id}`)) F(`rumour.${id}`, 'pencil');
    if (!story.flag(`rumour.${id}`)) story.flag(`rumour.${id}`, 'pencil');
  }
  function proof(id) {
    if (F(`rumour.${id}`) === 'checked') return false;
    save.proofs[id] = L.proofs[id];
    F(`rumour.${id}`, 'checked');
    story.flag(`rumour.${id}`, 'checked');
    story.give(`proof:${id}`);
    return true;
  }
  const spoke = (id) => F(`spoke.${id}`, true);

  // ---- looks: a tapped thing gets a pencil label (what was heard), then it inks gold (what is seen) ----
  injectStyle();
  const labels = new Set();
  function showLook(pos, look, ms = 3600) {
    return new Promise((res) => {
      const el = document.createElement('div');
      el.className = 'd9-look';
      el.innerHTML = '<small></small><b></b>';
      el.querySelector('small').textContent = tr({ my: 'ကြားတာ', en: 'heard' });
      el.querySelector('b').textContent = tr(look.pencil);
      document.getElementById('game').appendChild(el);
      labels.add(el);
      const at = pos.clone();
      let raf = 0;
      const follow = () => {
        const q = game.rig.project(v3.copy(at), game.viewW, game.viewH);
        if (q) { el.style.left = `${Math.max(90, Math.min(game.viewW - 90, q.x))}px`; el.style.top = `${Math.max(70, q.y)}px`; }
        raf = requestAnimationFrame(follow);
      };
      follow();
      call(game.audio, 'play', 'chalk');
      setTimeout(() => {
        el.classList.add('gold');
        el.querySelector('small').textContent = tr({ my: 'မြင်တာ', en: 'seen' });
        el.querySelector('b').textContent = tr(look.gold);
        call(game.audio, 'play', 'sparkle');
      }, 1300);
      setTimeout(() => { el.classList.add('out'); }, ms);
      setTimeout(() => { cancelAnimationFrame(raf); el.remove(); labels.delete(el); res(); }, ms + 350);
    });
  }
  let cueEl = null;
  function cue(line) {
    if (!cueEl) { cueEl = document.createElement('div'); cueEl.className = 'd9-cue'; document.getElementById('game').appendChild(cueEl); }
    cueEl.textContent = line ? tr(line) : '';
    cueEl.style.display = line ? '' : 'none';
  }

  // ---- taps (a layer over story.onTap: the watch, loaves, the yard's looks, things seen in the street) ----
  let watch = null; // { targets: [{ id, pos() }], resolve }
  const hit = (x, y, pos, r = 52) => { const q = game.rig.project(v3.copy(pos), game.viewW, game.viewH); return q && Math.hypot(q.x - x, q.y - y) < r; };
  const personPos = (id, hgt = 0.9) => { const e = people.get(id); return e ? new THREE.Vector3(e.p.root.position.x, hgt, e.p.root.position.z) : null; };
  // a tap anywhere on the person, feet to the top of the head (a close camera makes two small circles easy to miss)
  const personHit = (x, y, id) => {
    const e = people.get(id); if (!e) return false;
    const a = game.rig.project(v3.copy(personPos(id, 0.15)), game.viewW, game.viewH); if (!a) return false;
    const fa = { x: a.x, y: a.y };
    const b = game.rig.project(v3.copy(personPos(id, (e.p.height || 1.5) + 0.1)), game.viewW, game.viewH); if (!b) return false;
    const dx = b.x - fa.x, dy = b.y - fa.y, L2 = dx * dx + dy * dy || 1;
    const k = Math.max(0, Math.min(1, ((x - fa.x) * dx + (y - fa.y) * dy) / L2));
    return Math.hypot(x - (fa.x + dx * k), y - (fa.y + dy * k)) < Math.max(44, Math.sqrt(L2) * 0.3);
  };
  function stationPos(id, y = 1.0) { const s = built?.stations?.find((q) => q.id === id); return s ? new THREE.Vector3(s.look?.x ?? s.x, y, s.look?.z ?? s.z) : null; }

  let carryingLoaf = -1;
  const yardLooks = { tiffin: () => S.tiffin.root.position.clone().setY(0.35), west: () => new THREE.Vector3(P.yardWall.x, 0.6, P.yardWall.z), hum: () => personPos('maungarkar', 1.2) };

  function myTap(x, y) {
    if (game.ui.dialogOpen || game.busy) return false;
    if (watch) {
      for (const t of watch.targets) {
        const p = t.pos();
        const ok = t.person ? personHit(x, y, t.person) : p && hit(x, y, p, 60);
        if (ok) { const w = watch; watch = null; w.resolve(t.id); return true; }
      }
      return true; // while watching, a tap elsewhere does nothing (Maya stays away from the oven door)
    }
    if (story.talking || story.inRoom || !story.foot.active) return false;
    const m = mayaXZ();
    // the three loaves (C), then the cart
    if (F('tipped') && !F('cart')) {
      for (let i = 0; i < 3; i++) {
        const lf = S.loaves[i];
        if (!lf.root.visible || F(`loaf.${i + 1}`) || carryingLoaf === i) continue;
        if (!hit(x, y, lf.root.position.clone().setY(0.15), 48)) continue;
        if (carryingLoaf >= 0) { story.bark('maya', L.handsFull, 2200); return true; }
        const p = P.loaves[i];
        const pick = () => {
          if (Math.hypot(story.foot.pos.x - p.x, story.foot.pos.y - p.z) > 2.4 || carryingLoaf >= 0) return; // (a sack or a person can stop her a step short)
          carryingLoaf = i;
          story.carry(lf.root, { lift: 0.75 });
          story.bark('maya', L.loafCarry, 1800);
        };
        if (Math.hypot(story.foot.pos.x - p.x, story.foot.pos.y - p.z) < 1.4) pick(); else story.foot.walkTo(p.x + 0.6, p.z + 0.2, pick);
        return true;
      }
      const cp = S.cart.root.position;
      if (carryingLoaf >= 0 && hit(x, y, cp.clone().setY(0.6), 70)) {
        const close = Math.hypot(story.foot.pos.x - cp.x, story.foot.pos.y - cp.z) < 1.8;
        (close ? (fn) => fn() : (fn) => story.foot.walkTo(cp.x - 1.1, cp.z + 0.4, fn))(() => {
          if (carryingLoaf < 0 || Math.hypot(story.foot.pos.x - cp.x, story.foot.pos.y - cp.z) > 2.6) return;
          const i = carryingLoaf;
          carryingLoaf = -1;
          story.carry(null, { remove: true });
          F(`loaf.${i + 1}`, true);
          const n = [1, 2, 3].filter((k) => F(`loaf.${k}`)).length;
          S.cart.setTrays([n >= 1 ? 6 : 2, n >= 2 ? 6 : 1, n >= 3 ? 5 : 1, 2]);
          if (n >= 3) cartDone();
        });
        return true;
      }
    }
    // the back yard (6.3): three looks, Maya stands, never sits with him
    if (F('emMet') && !F('alone') && people.get('maungarkar') && near(P.yard, 9)) {
      for (const id of ['tiffin', 'west', 'hum']) {
        if (F(`look.${id}`)) continue;
        const ok = id === 'hum' ? personHit(x, y, 'maungarkar') : hit(x, y, yardLooks[id](), id === 'west' ? 70 : 50);
        if (!ok) continue;
        story.foot.walkTo(P.yard.x - 0.4, P.yard.z + 2.3, () => yardLook(id));
        return true;
      }
    }
    // things that can be checked with her own eyes
    if (inHearth(m.x, m.z) && F('rumour.nightbake') !== 'checked' && Math.hypot(m.x - P.chimneys.x, m.z - P.chimneys.z) < 34 && hit(x, y, new THREE.Vector3(P.chimneys.x, P.chimneys.y, P.chimneys.z), 80)) {
      hold(async () => { await say('maya', L.chimneys, { face: 'surprised' }); proof('nightbake'); });
      return true;
    }
    if (Math.hypot(m.x - P.crease.x, m.z - P.crease.z) < 8 && hit(x, y, new THREE.Vector3(P.crease.x, 0.2, P.crease.z), 80)) {
      story.foot.walkTo(P.crease.x - 1.2, P.crease.z + 1.6, () => hold(creaseScene));
      return true;
    }
    if (Math.hypot(m.x - P.clasp.x, m.z - P.clasp.z) < 10 && hit(x, y, new THREE.Vector3(P.clasp.x, 1.4, P.clasp.z), 90)) {
      hold(async () => { await say('maya', L.claspSeen, { face: 'think' }); proof('gardenshut'); });
      return true;
    }
    const ba = S.boardAt;
    if (Math.hypot(m.x - ba.x, m.z - ba.z) < 9 && hit(x, y, new THREE.Vector3(ba.look.x, ba.look.y, ba.look.z), 70)) {
      story.foot.walkTo(ba.x, ba.z, () => hold(boardScene));
      return true;
    }
    return false;
  }
  const prevTap = story.onTap;
  const tapLayer = (x, y) => myTap(x, y) || prevTap(x, y);
  story.onTap = tapLayer;

  // ---- who stands where, by how far the day has gone ----------------------------------------
  function wanted() {
    const w = {};
    w.wintwar = { x: ab.x + 2.6, z: ab.z + 1.2, heading: -Math.PI / 2 };
    if (F('ch14Done') && F('friendDone') && !F('ncMet')) w.naychi = { x: ab.x - 1.5, z: ab.z + 1.3, heading: 0.6 };
    else if (F('ncMet')) w.naychi = { x: P.laneMouth.x + 0.4, z: P.laneMouth.z + 0.9, heading: Math.PI / 2 };
    w.sawyu = { x: P.noodle.door.x + 4.6, z: P.noodle.door.z - 0.9, heading: -Math.PI / 2 };
    w.lampman = { x: P.lampBench.front.x, z: P.lampBench.front.z, heading: Math.PI };
    if (!F('cart')) w.eimon = { x: P.noodle.door.x + 1.3, z: P.noodle.door.z - 0.9, heading: Math.PI }; // (east of the door: the kerb pot stands west of it)
    else if (F('emOut') && !F('arkarTalk')) w.eimon = { x: P.yard.x + 0.5, z: P.yard.z - 0.95, heading: -0.48 }; // just behind him, facing him: the lane's camera sees all three
    else if (F('arkarTalk') && !F('friendDone')) w.eimon = { x: P.cartHome.x - 1.3, z: P.cartHome.z + 0.9, heading: 1.4 };
    if (!F('cart')) w.maungarkar = { x: P.cartIdle.x + 1.25, z: P.cartIdle.z + 0.2, heading: -Math.PI / 2 };
    else if (F('emMet') && !F('arkarTalk')) w.maungarkar = { x: P.yard.x, z: P.yard.z, heading: -Math.PI / 2, mood: F('arkarTalk') ? null : 'down' };
    else if (F('arkarTalk') && !F('friendDone')) w.maungarkar = { x: P.cartHome.x + 1.2, z: P.cartHome.z + 0.7, heading: -1.6 };
    if (F('cart')) {
      w.micho = { x: P.bakery.x + 7.6, z: P.bakery.door.z + 1.25, heading: -0.4 };
      w.toetoe = { x: P.bakery.x + 8.8, z: P.bakery.door.z + 1.9, heading: -0.9 };
    }
    return w;
  }
  function syncStreet() {
    dirty = false;
    const w = wanted();
    for (const id of MANAGED) {
      const at = w[id];
      const e = people.get(id);
      if (e?.walking) continue; // (someone on their way somewhere finishes the walk first)
      if (!at) { if (e) drop(id); continue; }
      const pe = place(id, at);
      if (pe && at.mood !== undefined) { pe.baseMood = at.mood; call(pe.p, 'setMood', at.mood); }
    }
    // the cart: tipped where it fell until the loaves are back, then at the bakery front
    if (F('cart')) { S.setCart(P.cartHome, 0); S.cart.setTied(F('squabble')); }
    else if (F('tipped')) S.setCart(P.cartIdle, 1);
    else S.setCart(P.cartIdle, 0);
    for (let i = 0; i < 3; i++) S.loaves[i].root.visible = F('tipped') && !F(`loaf.${i + 1}`) && carryingLoaf !== i;
    S.board.setMarks(F('board'));
  }

  // ---- 4. morning --------------------------------------------------------------------------
  async function morning() {
    await morningPost(story, {
      day: 9,
      ww: L.ww1,
      slept: L.slept8,
      after: L.ww2,
      letters: [{ from: 'kowunna', text: L.kwNote }],
      question: L.ttQ,
      companions: ['caterpillar', 'beetle'],
      liftCaption: { caterpillar: L.cat, beetle: L.beetle },
      lift: { beetle: L.mayaPets },
      where: [...L.ww3, ...L.wwBoard],
    });
    pencil('keepto');
    for (const [id, lab] of Object.entries(L.labels)) if (!save.pencil[id]) save.pencil[id] = 'pencil';
    save.labels = { ...(save.labels || {}), ...L.labels };
    story.persist();
  }

  // ---- 8.1 the board -----------------------------------------------------------------------
  async function boardScene() {
    if (F('board')) return say('maya', L.boardAgain, { face: 'smile' });
    await showLetter(game, L.note9, { sign: L.note9From });
    for (;;) {
      const i = await D.choose(L.replies9);
      if (i === 2) break;
      await say('maya', L.replyWrong[i], { face: 'think' });
    }
    F('board', true);
    S.board.setMarks(true);
    call(game.audio, 'play', 'chalk');
    await say('maya', L.boardDone, { face: 'smile' });
  }

  // ---- 6.1 the cart ------------------------------------------------------------------------
  async function cartScene() {
    if (scening || F('tipped')) return;
    scening = true;
    await hold(async () => {
      syncStreet();
      const ak = place('maungarkar', { x: P.cartIdle.x + 1.25, z: P.cartIdle.z + 0.2, heading: -Math.PI / 2 });
      // (along the Row from the east: a camera south of the ring would stand inside the noodle house)
      game.rig.shot(new THREE.Vector3(P.ring.x + 6.6, 3.0, P.ring.z + 2.2), new THREE.Vector3(P.ring.x + 0.5, 0.6, P.ring.z - 0.2), 0.9);
      await wait(700);
      call(game.audio, 'play', 'thud');
      await tween(0.55, (k) => S.cart.setTipped(k * k));
      S.cart.setTrays([2, 1, 1, 2]);
      for (const lf of S.loaves) lf.root.visible = true;
      call(game.fx, 'burst', 'puff', v3.set(P.ring.x, 0.3, P.ring.z), { count: 10, spread: 0.6, up: 0.4 });
      F('tipped', true);
      call(ak?.p, 'emote', 'shrug');
      await say('maungarkar', L.ml1, { face: 'happy' });
      // the row comes out at once (Daw Khin May is at her ovens: nothing here is caused by her shouting)
      place('sawyu', { x: P.ring.x - 1.6, z: P.ring.z + 1.6, heading: 0.6 });
      place('micho', { x: P.ring.x + 2.4, z: P.ring.z + 1.5, heading: -0.9 });
      place('toetoe', { x: P.ring.x + 1.2, z: P.ring.z + 2.3, heading: -2.6 });
      place('lampman', { x: P.ring.x - 2.6, z: P.ring.z - 0.4, heading: 1.3 });
      game.rig.shot(new THREE.Vector3(P.ring.x + 7.4, 3.3, P.ring.z + 2.0), new THREE.Vector3(P.ring.x - 0.4, 0.6, P.ring.z + 0.6), 0.8);
      for (const l of L.rowHelp) {
        spoke(l.who);
        call(people.get(l.who)?.p, 'emote', l.who === 'toetoe' ? 'think' : 'point');
        await say(l.who, [l], { face: l.who === 'toetoe' ? 'think' : 'smile' });
      }
      game.rig.release();
    });
    scening = false;
  }

  async function cartDone() {
    if (F('cart')) return;
    scening = true;
    await hold(async () => {
      await say('maungarkar', L.ml2, { face: 'happy' });
      await say('maya', L.mayaRow, { face: 'think' });
      proof('keepto');
      F('cart', true);
      // he stacks it the same way (heavy on top) and wheels it to the bakery door; the row goes back to work
      S.cart.setTipped(0);
      S.cart.setTrays([6, 6, 5, 6]);
      const from = S.cart.root.position.clone();
      const ak = people.get('maungarkar');
      Promise.all([
        walk('maungarkar', P.cartHome.x + 0.9, P.cartHome.z + 0.4, 1.1),
        tween(2.2, (k) => S.setCart({ x: from.x + (P.cartHome.x - from.x) * k, z: from.z + (P.cartHome.z - from.z) * k }, 0)),
      ]).then(() => walk('maungarkar', P.bakery.door.x + 0.4, P.bakery.door.z + 0.5, 1.3)).then(() => { if (!story.inRoom) drop('maungarkar'); });
      void ak;
      walk('sawyu', P.noodle.door.x + 4.6, P.noodle.door.z - 0.9, 1.2, -Math.PI / 2);
      walk('lampman', P.lampBench.front.x, P.lampBench.front.z, 1.0, Math.PI);
      walk('micho', P.bakery.x + 7.6, P.bakery.door.z + 1.25, 1.0, -0.4);
      walk('toetoe', P.bakery.x + 8.8, P.bakery.door.z + 1.9, 1.1, -0.9);
      await wait(2600);
      story.bark('khinmay', L.kmShout, 3200); // through the half-open door
      call(game.audio, 'play', 'ring');
      await wait(1600);
      // Ei Mon alone does not laugh; she watches him go, then goes in through the curtain door
      const em = people.get('eimon');
      if (em) {
        em.p.lookAt(v3.set(P.bakery.door.x, 1, P.bakery.door.z));
        await wait(1200);
        await walk('eimon', P.noodle.door.x, P.noodle.door.z - 0.5, 1.0);
        if (!story.inRoom) drop('eimon');
      }
    });
    scening = false;
    dirty = true;
  }

  // ---- 5. chapter 14 (inside the bakery) -----------------------------------------------------
  let afterK = 0;
  async function runCh14() {
    return hold(async () => {
      spoke('khinmay');
      if (!F('cart')) return say('khinmay', L.kmNoCart, { face: 'hot' });
      if (F('ch14Done')) return say('khinmay', (afterK++ % 2) ? L.kmAfter2 : L.kmAfter, { face: 'smile' });
      if (!F('kmWatch') && !(await kmOpen())) return;
      if (!F('watched')) await watchTray();
      if (!F('kmTalk') && !(await kmTalk())) return;
      if (!F('said') && !(await kmSort())) return;
      if (!F('heldBack') && !(await kmHold())) return;
      if (!F('trays')) return say('khinmay', L.kmTrays, { face: 'smile' });
      if (!F('ch14Done')) await kmClose();
    });
  }

  async function kmOpen() {
    await say('khinmay', F('kmMet') ? L.kmAgain : L.km1, { face: F('kmMet') ? 'smile' : 'hot' });
    F('kmMet', true);
    for (;;) {
      const i = await D.choose(L.kmChoices);
      if (i === 0) { F('kmWrongSaid', true); await say('khinmay', L.kmWrong, { face: 'hot', emote: 'fists' }); await say('maya', L.kmWrongMaya, { face: 'think' }); continue; }
      if (i === 1) { await say('maya', L.kmAgree, { face: 'think' }); continue; }
      break;
    }
    await say('khinmay', L.kmWatch, { face: 'smile' });
    F('kmWatch', true);
    return true;
  }

  /** 5.2: one tray, four beats; each waits for a tap on the thing really there. */
  async function watchTray() {
    const R = built;
    const sp = R?.spots?.mayaWatch;
    if (sp) await walkMaya(sp.x, sp.z);
    game.maya.root.rotation.set(0, Math.atan2(-0.9 - (sp?.x ?? -2), -2.2 - (sp?.z ?? 1.1)), 0);
    game.rig.shot(new THREE.Vector3(-1.4, 1.75, 2.9), new THREE.Vector3(0.4, 0.95, -2.0), 0.9);
    place('khinmay', 'kmOven');
    place('maungarkar', 'arkarOven');
    game.ui.tip?.(tr(L.watchHow), 4200);
    const km = () => people.get('khinmay'), ak = () => people.get('maungarkar');
    const beats = [
      { id: 'khinHeat', target: { id: 'khinHeat', person: 'khinmay', pos: () => personPos('khinmay', 1.2) },
        go: async () => { call(R?.props, 'ringBell'); call(game.audio, 'play', 'ring'); cue(L.watchCue.khinHeat); story.steam('khinmay', 3); story.steam('maungarkar', 0); call(km()?.p, 'setFace', 'hot', 99); } },
      { id: 'arkarHeat', target: { id: 'arkarHeat', person: 'maungarkar', pos: () => personPos('maungarkar', 1.2) },
        go: async () => { cue(null); call(km()?.p, 'emote', 'fists'); story.bark('khinmay', L.watchCue.arkarHeat, 2600); await wait(800); story.steam('maungarkar', 3); call(ak()?.p, 'setFace', 'worried', 99); call(ak()?.p, 'emote', 'slump'); } },
      { id: 'door', target: { id: 'door', pos: () => stationPos('ovenRight', 1.0) || new THREE.Vector3(1.9, 1, -2.6) },
        go: async () => { cue(L.watchCue.door); await walk('khinmay', 1.05, -2.15, 1.8, Math.PI / 2); call(km()?.p, 'emote', 'point'); call(km()?.p, 'setFace', 'worried', 99); } },
      { id: 'loaves', target: { id: 'loaves', pos: () => stationPos('rackA', 1.2) || new THREE.Vector3(3.05, 1.2, -1.2) },
        go: async () => { cue(L.watchCue.loaves); await walk('maungarkar', 2.45, -1.25, 1.4, Math.PI / 2); call(ak()?.p, 'emote', 'nod'); } },
    ];
    // a phone held upright cannot hold both ovens in one frame: the camera turns to whatever is happening now
    // (the person, the oven door, the rack), close and low, so the thing to tap is on screen; wide in landscape
    const focus = {
      khinHeat: () => personPos('khinmay', 0), arkarHeat: () => personPos('maungarkar', 0),
      door: () => { const o = stationPos('ovenRight', 0) || new THREE.Vector3(1.9, 0, -2.6); const k = personPos('khinmay', 0); return k ? o.clone().lerp(k, 0.5) : o; },
      loaves: () => stationPos('rackA', 0) || new THREE.Vector3(3.05, 0, -1.2),
    };
    const frame = (id) => {
      if (game.viewW >= game.viewH) return;
      const f = focus[id]?.();
      if (!f) return;
      game.rig.shot(new THREE.Vector3(f.x - 0.6, 2.0, f.z + 4.5), new THREE.Vector3(f.x, 1.0, f.z), 0.7);
    };
    for (const b of beats) {
      if (F(`look.${b.id}`)) continue;
      await b.go();
      frame(b.id);
      const extra = b.id === 'door' ? [{ id: 'door', pos: () => stationPos('ovenLeft', 1.0) }] : [];
      await new Promise((resolve) => { watch = { targets: [b.target, ...extra], resolve }; });
      cue(null);
      await showLook(b.target.pos() || v3.set(0, 1, -2).clone(), L.looks[b.id], 3600);
      F(`look.${b.id}`, true);
    }
    story.steam('khinmay', 1);
    story.steam('maungarkar', 1);
    call(km()?.p, 'setFace', 'smile', 2);
    call(ak()?.p, 'setFace', 'smile', 2);
    await say('maya', L.watched, { face: 'think' });
    F('watched', true);
    game.rig.release();
  }

  async function kmTalk() {
    if (story.talk.waiting(TALK_D9_KHINMAY.id)) { await say('khinmay', L.kmNotYet, { face: 'smile' }); return false; }
    place('khinmay', { x: -2.45, z: -0.5, heading: Math.PI / 2 });
    place('maungarkar', 'arkarRack');
    const sp = built?.spots?.mayaTalk;
    if (sp) await walkMaya(sp.x + 0.25, sp.z + 0.1);
    await say('maya', L.kmSits, { face: 'smile' });
    story.steam('khinmay', null);
    story.steam('maungarkar', null);
    const data = F('kmWrongSaid') ? { ...TALK_D9_KHINMAY, steam: TALK_D9_KHINMAY.steam + 1 } : TALK_D9_KHINMAY;
    const r = await story.talk.run(data);
    if (!r.won) { await say('khinmay', L.kmNotYet, { face: 'think' }); return false; }
    F('kmTalk', true);
    return true;
  }

  async function kmSort() {
    await say('khinmay', L.kmTry, { face: 'think' });
    const r = await sort({
      title: L.sortTitle, hint: L.sortHint, who: 'khinmay',
      baskets: L.sortBaskets, slips: L.sortSlips,
      wrong: L.sortWrong, react: { leans: L.sortWrongNames },
    });
    if (!r?.ok) return false;
    F('sorted', true);
    await say('maya', L.kmFaceDown, { face: 'smile' });
    await walk('maungarkar', -1.5, -0.9, 1.3, -Math.PI / 2);
    await say('khinmay', L.kmSays, { face: 'sad' });
    await say('maungarkar', L.arkarHears, { face: 'happy' });
    F('said', true);
    return true;
  }

  async function kmHold() {
    place('khinmay', 'kmTable');
    place('maungarkar', 'arkarOven');
    const sp = built?.spots?.mayaHoldback;
    if (sp) await walkMaya(sp.x, sp.z);
    story.steam('khinmay', 1);
    const r = await holdback({
      title: L.hbTitle, hint: L.hbHint, who: 'khinmay', with: ['maungarkar'],
      beats: L.hbBeats, early: L.hbEarly, end: L.hbEnd, place: 'bakery',
    });
    if (!r?.ok) { story.steam('khinmay', null); return false; }
    F('heldBack', true);
    story.steam('khinmay', 1); // her cup cools to one wisp by itself
    setTimeout(() => story.steam('khinmay', null), 6000);
    await say('khinmay', L.kmTrays, { face: 'smile' });
    return true;
  }

  let trayTaps = 0;
  async function trayTap() {
    const pos = stationPos('rackB', 1.15) || new THREE.Vector3(3.05, 1.15, 0.3);
    await showLook(pos.clone().add(new THREE.Vector3(0, trayTaps ? -0.25 : 0.2, 0)), L.trayLooks[Math.min(trayTaps, 1)], 3000);
    trayTaps++;
    if (trayTaps < 2) return;
    await say('maya', L.trays, { face: 'surprised' });
    F('trays', true);
    await kmClose();
  }

  async function kmClose() {
    place('khinmay', 'kmOven');
    await say('khinmay', L.kmEnd, { face: 'happy' });
    story.give('eraser');
    call(built?.props, 'show', 'eraser', false); // the string on the order book hangs empty
    F('ch14Done', true);
    await say('khinmay', L.kmAfter, { face: 'smile' });
  }

  // ---- 6.2-6.4 Ei Mon (inside the noodle house) and the back yard -----------------------------
  async function eimonIn() {
    return hold(async () => {
      spoke('eimon');
      if (!F('emMet')) { await say('eimon', L.em1, { face: 'think' }); F('emMet', true); dirty = true; return; }
      if (!F('alone')) return say('eimon', L.emWait, { face: 'think' });
      if (!F('teaGiven')) return teaScene();
      if (F('friendDone')) return say('eimon', L.emAfter, { face: 'smile' });
      return say('eimon', L.emNotYet, { face: 'smile' });
    });
  }
  async function teaScene() {
    place('eimon', 'eimonD9');
    await say('eimon', L.em2, { face: 'worried' });
    for (;;) {
      const i = await D.choose(L.emChoices);
      if (i === 0) { await say('maya', L.emMaya0, { face: 'think' }); continue; }
      if (i === 1) { await say('eimon', L.emCheer, { face: 'sad' }); continue; }
      break;
    }
    await say('eimon', L.emAsk, { face: 'think' });
    await say('maya', L.mayaTea, { face: 'smile' });
    story.take('teapot', 1, { label: L.teaGiven });
    await say('eimon', L.emTea, { face: 'happy' });
    F('teaGiven', true);
    // she fills two cups and goes out through the curtain door, across to the bakery's side lane
    const door = built?.door || { x: 0, z: 3.6 };
    await walk('eimon', door.x ?? 0, (door.z ?? 3.6) - 0.6, 1.4);
    story.remove('eimon');
  }
  let yardBusy = false;
  async function yardLook(id) {
    if (F(`look.${id}`) || yardBusy) return;
    yardBusy = true;
    try { await hold(async () => {
      await showLook(yardLooks[id](), L.looks[id], 3800);
      F(`look.${id}`, true);
      if (['tiffin', 'west', 'hum'].every((k) => F(`look.${k}`))) {
        await say('maya', L.aloneMaya, { face: 'think' });
        F('alone', true);
      }
    }); } finally { yardBusy = false; }
  }
  async function arkarTalk() {
    if (story.inRoom) return; // (the yard talk is outdoors only)
    return hold(async () => {
      if (story.talk.waiting(TALK_D9_ARKAR.id)) return say('eimon', L.emNotYet, { face: 'smile' });
      await say('maya', L.emSettle, { face: 'smile' });
      const r = await story.talk.run(TALK_D9_ARKAR);
      if (!r.won) return say('eimon', L.emNotYet, { face: 'smile' });
      F('arkarTalk', true);
      const ak = people.get('maungarkar');
      if (ak) { ak.baseMood = null; call(ak.p, 'setMood', null); }
      // they go round to the cart at the bakery front together
      scening = true;
      await Promise.all([
        walkSure('maungarkar', P.cartHome.x + 1.2, P.cartHome.z + 0.7, 1.3, -1.6),
        walkSure('eimon', P.cartHome.x - 1.3, P.cartHome.z + 0.9, 1.3, 1.4),
      ]);
      scening = false;
    });
  }
  async function squabble() {
    if (story.inRoom) return;
    return hold(async () => {
      if (story.talk.waiting(TALK_D9_SQUABBLE.id)) return say('eimon', L.emNotYet, { face: 'think' });
      await say('maya', L.sqLoad, { face: 'think' });
      const r = await story.talk.run(TALK_D9_SQUABBLE);
      if (!r.won) return;
      F('squabble', true);
      S.cart.setTied(true);
      await say('maya', L.sqDone, { face: 'smile' });
      await say('eimon', L.emTwine, { face: 'smile' });
      story.give('twine');
      F('twine', true);
      pencil('crease');
      await say('maungarkar', L.mlUmbrella, { face: 'happy' });
      story.give('umbrella');
      F('umbrella', true);
      await say('maya', L.teapotBack, { face: 'happy' });
      if (!story.has('teapot')) story.give('teapot', 1);
      await say('maya', L.mayaFriend, { face: 'think' });
      F('friendDone', true);
      // the two of them go and eat together at the noodle house's front table
      scening = true;
      await Promise.all([
        walk('eimon', P.noodle.door.x - 0.3, P.noodle.door.z - 0.6, 1.2),
        walk('maungarkar', P.noodle.door.x + 0.3, P.noodle.door.z - 0.6, 1.2),
      ]);
      drop('eimon'); drop('maungarkar');
      scening = false;
      dirty = true;
    });
  }

  // ---- 8.2 Nay Chi -------------------------------------------------------------------------
  async function ncScene() {
    return hold(async () => {
      spoke('naychi');
      if (F('ncMet')) return say('naychi', L.ncAfter, { face: 'think' });
      await say('naychi', L.nc1, { face: 'worried' });
      for (;;) {
        const i = await D.choose(L.ncChoices);
        if (i === 2) break;
        await say('maya', L.ncTold, { face: 'think' });
      }
      await say('naychi', L.ncAsked, { face: 'think' });
      await say('maya', L.mayaAsked, { face: 'think' });
      F('ncMet', true);
      F('ncAsked', true);
      if (story.inRoom) {
        const door = built?.door || { x: 0, z: 3.6 };
        await walk('naychi', door.x ?? 0, (door.z ?? 3.6) - 0.6, 1.4);
        story.remove('naychi');
      }
      dirty = true;
    });
  }

  // ---- 8.4 desks: pick the one true line before the ribbon rises -----------------------------
  const ow = story.openWorld;
  const lightDesk0 = ow?.lightDesk;
  const DESK_Q = { hearthWest: { lines: L.deskWest, flag: 'desk.west', proof: 'nightbake' }, hearthClass: { lines: L.deskClass, flag: 'desk.class', proof: 'childclass' } };
  if (ow && lightDesk0) {
    ow.lightDesk = async (d) => {
      const q = DESK_Q[d?.id];
      if (!q || story.talking || game.busy) return lightDesk0.call(ow, d);
      let ok = false;
      await hold(async () => {
        await say('maya', [L.deskQ], { face: 'think' });
        for (;;) {
          const i = await D.choose(q.lines);
          if (i === 0) { ok = true; break; }
          await say('maya', L.deskWrong, { face: 'think' });
        }
      });
      if (!ok) return;
      await lightDesk0.call(ow, d);
      F(q.flag, true);
      proof(q.proof);
    };
  }

  // ---- 8.5 the torn crease, the clasp ---------------------------------------------------------
  async function creaseScene() {
    if (F('rumour.crease') !== 'checked') { await say('maya', L.creaseSeen, { face: 'think' }); proof('crease'); }
    if (!story.has('twine') || F('crease')) return;
    for (;;) {
      const r = await trace({ title: L.creaseTitle, hint: L.creaseHint, path: 'stitch', wobble: 4, tolerance: 18, round: 1, rounds: 1 });
      if (r.ok) break;
      await say('maya', L.creaseAgain, { face: 'think', auto: true });
    }
    call(story.openWorld, 'setFlagGate', 'creaseMended', true);
    F('crease', true);
    await say('maya', L.creaseDone, { face: 'happy' });
  }

  // ---- 9. the night page --------------------------------------------------------------------
  let nightBusy = false;
  async function night() {
    if (nightBusy) return;
    nightBusy = true;
    F('arkarN', true); // Day 10: Maung Arkar's letter (ch 15 N)
    const who = ['khinmay', 'maungarkar', 'eimon'];
    if (F('ncMet')) who.push('naychi');
    for (const id of ['sawyu', 'micho', 'toetoe']) if (F(`spoke.${id}`)) who.push(id);
    try {
      await nightPage(story, {
        day: 9,
        truth: { q: L.nightQ, choices: L.nightChoices, right: 1, wrong: L.nightWrong },
        sleep: { q: L.sleepQ, who },
        stamps: [14],
        pencil: [15],
        stampText: L.stampText,
        extra: L.page15,
        tomorrow: L.tomorrow,
        turn: false,
      });
      // the reply letter's back page (8.6), in pencil
      await showSlip(game, L.replyLine, { kind: 'notebook', title: L.replyTitle });
      save.reply = save.reply || {};
      save.reply.lines = [...(save.reply.lines || []).filter((l) => l?.day !== 9), { day: 9, my: L.replyLine.my, en: L.replyLine.en }];
      story.persist();
    } finally { nightBusy = false; }
    await story.turnPage();
  }

  // ---- what people say, by how far the day has gone ------------------------------------------
  let naK = 0, lmK = 0;
  const talk = {
    wintwar: async () => {
      if (!F('morning')) return morning();
      if (!F('arrived')) return say('wintwar', F('board') ? L.wwLater : [...L.wwLater, ...L.wwBoard], { face: 'smile' });
      return say('wintwar', L.wwAfter, { face: 'happy' });
    },
    sawyu: async () => {
      spoke('sawyu');
      if (F('cart') && !F('emMet')) return say('sawyu', L.naIn, { face: 'smile' });
      const i = naK++ % L.na.length;
      await say('sawyu', [L.na[i]], { face: 'smile' });
      if (i === 2) pencil('childclass');
    },
    lampman: async () => {
      spoke('lampman');
      if (F('cart') && !F('ncMet') && !F('lmNC')) { F('lmNC', true); return say('lampman', L.lmNayChi, { face: 'think' }); }
      const i = lmK++ % L.lm.length;
      await say('lampman', [L.lm[i]], { face: 'smile' });
      pencil(['nightbake', 'gardenshut', 'crease', null][i] || 'x');
    },
    khinmay: () => runCh14(),
    maungarkar: async () => {
      spoke('maungarkar');
      if (story.inRoom) {
        if (F('friendDone')) return say('maungarkar', L.arkarAfter, { face: 'happy' });
        if (!F('ch14Done')) return say('maungarkar', L.arkarBefore[1], { face: 'happy' });
        return say('maungarkar', L.arkarBefore[0], { face: 'think' });
      }
      if (!F('cart')) return say('maungarkar', L.arkarBefore[1], { face: 'happy' });
      if (F('emMet') && !F('alone')) return yardLook('hum');
      if (F('teaGiven') && F('emOut') && !F('arkarTalk')) return arkarTalk();
      if (F('arkarTalk') && !F('friendDone')) return squabble();
      if (F('friendDone')) return say('maungarkar', L.arkarAfter, { face: 'happy' });
      return say('maungarkar', L.arkarBefore[0], { face: 'think' });
    },
    eimon: async () => {
      if (story.inRoom) return eimonIn();
      spoke('eimon');
      if (!F('cart')) return say('eimon', L.emBefore, { face: 'smile' });
      if (F('teaGiven') && !F('arkarTalk')) return arkarTalk();
      if (F('arkarTalk') && !F('friendDone')) return squabble();
      return say('eimon', L.emAfter, { face: 'smile' });
    },
    naychi: () => ncScene(),
    micho: async () => { spoke('micho'); return say('micho', L.micho, { face: 'smile' }); },
    toetoe: async () => { spoke('toetoe'); return say('toetoe', F('ch14Done') ? L.toetoeAfter : L.toetoe, { face: F('ch14Done') ? 'happy' : 'think' }); },
  };

  // ---- rooms ---------------------------------------------------------------------------------
  function roomCast(id) {
    if (id === 'bakery') return F('cart') && !F('friendDone') ? [{ id: 'khinmay', spot: 'kmOven' }, { id: 'maungarkar', spot: 'arkarOven' }] : [{ id: 'khinmay', spot: 'kmOven' }];
    if (id === 'noodlehouse') {
      if (!F('cart')) return [];
      if (!F('emMet')) return [{ id: 'eimon', spot: 'eimonWipe' }];
      if (!F('teaGiven')) return [{ id: 'eimon', spot: 'eimonD9' }];
      if (!F('friendDone')) return [];
      return [{ id: 'eimon', spot: 'eimonEat' }, { id: 'maungarkar', spot: 'arkarEat' }];
    }
    if (id === 'eveningclass') return F('cart') && !F('ncMet') ? [{ id: 'naychi', spot: 'naychiDesk' }] : [];
    return undefined; // other rooms: their own default people
  }
  function roomOpts(id) {
    if (id === 'noodlehouse' && F('friendDone')) return { dressing: 'd9end' };
    return {};
  }
  function enterRoom(id, room) {
    built = room;
    if (!['bakery', 'noodlehouse', 'eveningclass'].includes(id)) return;
    if (story.doors?.roomCam) story.doors.roomCam(); else game.rig.setFollow(ROOM_CAM); // doors.js's shared close, low room camera
    F(`in.${id}`, true);
    if (id === 'bakery') {
      if (F('ch14Done')) call(room?.props, 'show', 'eraser', false);
      if (F('cart') && !F('ch14Done') && (!F('kmWatch') || !F('watched'))) setTimeout(() => { if (story.inRoom === 'bakery' && !story.talking) runCh14(); }, 900);
    }
    if (id === 'eveningclass' && F('cart') && !F('ncMet')) setTimeout(() => { if (story.inRoom === 'eveningclass' && !story.talking) ncScene(); }, 900);
  }
  function leaveRoom() {
    for (const id of ['khinmay', 'maungarkar']) story.steam(id, null);
    watch = null;
    cue(null);
    built = null;
    dirty = true;
  }
  /** Story taps on room stations (no markers: the things themselves). */
  function station(id) {
    const room = story.inRoom;
    const line = (lines, face = 'smile') => { hold(() => say('maya', lines, { face })); return true; };
    if (room === 'bakery') {
      if (id === 'ovenLeft' || id === 'ovenRight') { hold(async () => { await say('maya', L.ovenLit, { face: 'surprised' }); proof('nightbake'); }); return true; }
      if (id === 'rackB' && F('heldBack') && !F('trays')) { hold(trayTap); return true; }
      if (id === 'orderBook') return line(F('ch14Done') ? L.bakery.orderBookAfter : L.bakery.orderBook);
      if (L.bakery[id]) return line(L.bakery[id]);
      if (id === 'rackB') return line(L.bakery.rackA);
      return false;
    }
    if (room === 'noodlehouse') {
      if (id === 'trayShelf') return line(L.shelfLoad, 'think');
      return false;
    }
    if (room === 'eveningclass') {
      if (id === 'blackboard') return line(L.board9);
      if (id === 'grownBench') { hold(async () => { await say('maya', L.benchSeen, { face: 'think' }); proof('childclass'); }); return true; }
      if (id === 'sill') return line(L.classSill);
      if (id === 'calendar') return line(L.classCal);
      return false;
    }
    return false;
  }

  // ---- test hooks ----------------------------------------------------------------------------
  const BEATS = [
    ['morning', ['morning']],
    ['board', ['board']],
    ['arrived', ['arrived']],
    ['cart', ['tipped', 'loaf.1', 'loaf.2', 'loaf.3', 'cart']],
    ['kmWatch', ['kmMet', 'kmWatch']],
    ['watched', ['look.khinHeat', 'look.arkarHeat', 'look.door', 'look.loaves', 'watched']],
    ['kmTalk', ['kmTalk']],
    ['said', ['sorted', 'said']],
    ['heldBack', ['heldBack']],
    ['trays', ['trays']],
    ['ch14', ['ch14Done'], () => { if (!story.has('eraser')) story.give('eraser', 1, { quiet: true }); }],
    ['emMet', ['emMet']],
    ['alone', ['look.tiffin', 'look.west', 'look.hum', 'alone']],
    ['tea', ['teaGiven', 'emOut'], () => story.take('teapot', 1, { quiet: true })],
    ['arkarTalk', ['arkarTalk']],
    ['friend', ['squabble', 'twine', 'umbrella', 'friendDone'], () => { for (const i of ['twine', 'umbrella', 'teapot']) if (!story.has(i)) story.give(i, 1, { quiet: true }); }],
    ['nc', ['ncMet', 'ncAsked']],
  ];
  const PLACES = {
    home: { x: ab.x + 1, z: ab.z + 2.2, h: 0 }, board: { x: S.boardAt.x, z: S.boardAt.z + 1, h: Math.PI },
    row: { x: 148, z: 214, h: Math.PI }, bakery: { x: P.bakery.door.x, z: P.bakery.door.z + 1.6, h: Math.PI },
    yard: { x: P.yard.x - 0.6, z: P.yard.z + 2.6, h: Math.PI }, noodle: { x: P.noodle.door.x, z: P.noodle.door.z - 1.6, h: 0 },
    klass: { x: P.klass.door.x, z: P.klass.door.z - 1.8, h: 0 }, crease: { x: P.crease.x, z: P.crease.z + 3, h: Math.PI }, clasp: { x: P.clasp.x - 1, z: P.clasp.z + 4, h: Math.PI },
  };
  const hooks = {
    F, L, S, P,
    flags: () => Object.fromEntries(Object.entries(save.flags).filter(([k]) => k.startsWith('d9.'))),
    state: () => ({ inRoom: story.inRoom, talking: story.talking, scening, watch: !!watch, carryingLoaf, trayTaps, people: [...people.keys()] }),
    /** Set every beat before `beat` as done (the named beat is next). */
    skipTo(beat) { const k = BEATS.findIndex((b) => b[0] === beat); const n = k < 0 ? BEATS.length : k; for (let i = 0; i < n; i++) { for (const f of BEATS[i][1]) F(f, true); BEATS[i][2]?.(); } dirty = true; return hooks.flags(); },
    /** Set every beat through `beat` as done. */
    done(beat) { const k = BEATS.findIndex((b) => b[0] === beat); return hooks.skipTo(BEATS[k + 1]?.[0] || '__end'); },
    /** Jump Maya (on foot, outdoors) to a named place: home, board, row, bakery, yard, noodle, klass, crease, clasp. */
    async go(name) { const p = PLACES[name]; if (!p || story.inRoom) return false; if (!story.foot.active) await story.foot.toFoot(); story.openWorld?.jump(p.x, p.z, p.h); story.foot.walker.teleport(p.x, p.z, p.h); game.maya.root.position.set(p.x, 0, p.z); dirty = true; return true; },
    /** During the 5.2 watch: tap the right thing for the current beat. */
    tapWatch() { if (!watch) return false; const w = watch; watch = null; w.resolve(w.targets[0].id); return true; },
    run: { morning, boardScene, cartScene, cartDone, runCh14, watchTray, kmTalk, kmSort, kmHold, trayTap, kmClose, eimonIn, teaScene, yardLook, arkarTalk, squabble, ncScene, creaseScene, night, sync: () => syncStreet() },
  };
  window.__day9 = hooks;

  // ---- the day -------------------------------------------------------------------------------
  return {
    talk,
    roomCast,
    roomOpts,
    enterRoom,
    leaveRoom,
    station,
    /** The page turns in place: the Row's buildings, doors and people go, and the tap layer comes off. */
    dispose() {
      if (story.onTap === tapLayer) story.onTap = prevTap;
      if (ow && lightDesk0) ow.lightDesk = lightDesk0;
      if (carryingLoaf >= 0) { story.carry(null, { remove: true }); carryingLoaf = -1; }
      for (const id of [...MANAGED, 'khinmay']) { story.steam(id, null); drop(id); }
      S.dispose();
      for (const el of labels) el.remove();
      cueEl?.remove();
      if (window.__day9 === hooks) delete window.__day9;
    },
    async start() {
      syncStreet();
      if (!F('morning') && !story.inRoom) {
        if (!story.foot.active) await story.foot.toFoot();
        story.refreshHud?.();
        await story.talkTo(people.get('wintwar'));
      }
    },
    update(dt, t) {
      S.update(dt, t);
      for (let i = tweens.length - 1; i >= 0; i--) {
        const tw = tweens[i];
        tw.t += dt;
        const k = Math.min(1, tw.t / tw.dur);
        tw.fn(k);
        if (k >= 1) { tweens.splice(i, 1); tw.res(); }
      }
      if (story.inRoom) return;
      if (dirty && !scening && !story.talking) syncStreet();
      // desks lit some other way (an old save, a test): the day's own flags follow the world's
      if (save.flags['desk:hearthWest'] && !F('desk.west')) F('desk.west', true);
      if (save.flags['desk:hearthClass'] && !F('desk.class')) F('desk.class', true);
      if (story.talking || game.busy || scening || !F('morning')) return;
      const m = mayaXZ();
      // first step on the parchment (on foot or in the car)
      if (!F('arrived') && inHearth(m.x, m.z)) {
        F('arrived', true);
        hold(() => say('maya', L.arrive, { face: 'surprised' }));
        return;
      }
      // a few steps on: a crash in the street
      if (F('arrived') && !F('tipped') && Math.hypot(m.x - P.ring.x, m.z - P.ring.z) < 17) { cartScene(); return; }
      // after the tea: Ei Mon crosses to the side lane and into the back yard (the player can follow)
      if (F('teaGiven') && !F('emOut')) {
        F('emOut', true);
        // she comes out a step west of the door (toward the lane), not onto Maya, who has just come out of it
        place('eimon', { x: P.noodle.door.x - 1.2, z: P.noodle.door.z - 0.6, heading: -Math.PI / 2 });
        scening = true;
        walkSure('eimon', P.laneMouth.x + 0.3, P.laneMouth.z + 0.2, 1.3)
          .then(() => walkSure('eimon', P.yard.x + 0.5, P.yard.z - 0.95, 1.2, -0.48))
          .then(() => { scening = false; });
        return;
      }
      // the talk in the yard opens when Maya comes to the mouth of the lane behind Ei Mon
      if (F('emOut') && !F('arkarTalk') && people.get('eimon') && !people.get('eimon').walking && story.foot.active
        && Math.hypot(m.x - P.yard.x, m.z - P.yard.z) < 4.2 && !story.talk.waiting(TALK_D9_ARKAR.id)) { arkarTalk(); return; }
      // the squabble at the cart
      if (F('arkarTalk') && !F('squabble') && story.foot.active && Math.hypot(m.x - P.cartHome.x, m.z - P.cartHome.z) < 3.4
        && people.get('eimon') && !people.get('eimon').walking && !story.talk.waiting(TALK_D9_SQUABBLE.id)) { squabble(); return; }
      // night page: back at the Writing Room door (Nay Chi first, if she is still waiting there)
      if (F('ch14Done') && F('friendDone') && !F('done')) {
        const d = ab;
        const close = story.foot.active ? Math.hypot(m.x - d.x, m.z - d.z) < 1.9 : Math.hypot(m.x - d.x, m.z - (d.z + 3)) < 2.4;
        if (close) {
          if (!F('ncMet') && people.get('naychi')) { story.talkTo(people.get('naychi')); return; }
          night();
        }
      }
    },
  };
}

function injectStyle() {
  if (document.getElementById('d9-style')) return;
  const s = document.createElement('style');
  s.id = 'd9-style';
  s.textContent = `
  .d9-look { position: absolute; z-index: 43; transform: translate(-50%, -100%); max-width: min(76vw, 300px); pointer-events: none;
    background: #FFFDF8; border: 1.5px dashed #8A847C; border-radius: 10px; padding: 6px 12px; color: #77726B; text-align: center;
    font: 14px/1.6 "Noto Sans Myanmar", system-ui, sans-serif; box-shadow: 0 4px 12px rgba(42,33,24,.18); transition: color .4s, border-color .4s, opacity .3s; }
  .d9-look small { display: block; font-size: 11px; opacity: .8; }
  .d9-look.gold { color: #6E4A10; border: 2px solid #C9A24A; background: #FFF8E4; }
  .d9-look.out { opacity: 0; }
  .d9-cue { position: absolute; left: 50%; top: calc(max(64px, 8.5vh + 12px) + env(safe-area-inset-top)); /* below the cinema letterbox */ transform: translateX(-50%); z-index: 42; max-width: min(88vw, 420px);
    background: rgba(255,253,248,.94); border-radius: 12px; padding: 6px 14px; color: #4A3A2A; font: italic 14px/1.6 "Noto Sans Myanmar", system-ui, sans-serif;
    box-shadow: 0 3px 10px rgba(42,33,24,.18); pointer-events: none; text-align: center; }
  `;
  document.head.appendChild(s);
}
