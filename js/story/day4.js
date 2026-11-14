// Day 4 (the Envelope Market) — chapters 6 အလှူဒါန (Giving) and 7 မေတ္တာနှင့် အချစ် (Goodwill and Love).
// Script: writermaya-plan/game/days/day4-spec.md; rooms and layouts: INDEX 13.2 (they win); flags: INDEX 9.
//
// Lessons. Ch 6 (p46-47): where to give is the giver's own choice; judging another's gift is envy passing for
// wisdom and costs the judge her ease; before filling another's pot, fill your own means, know-how and
// goodwill, then give with a clean intention (no watchers, no thanks needed). Ch 7 (p48-50): goodwill does not
// burn; the love that burns clings and leans on someone else's doing; stand on your own post and wish
// everyone well alike. Main thread (ch 12): a Painted Map in Maya's name that nobody walked; Nay Chi waits
// half an hour at its false shortcut.
//
// Beats, in play order (most of the middle is any order):
//   1. morning post at home (Writing Room door): notebook line, Maung Nge's note, Toe Toe's question, the
//      Seedling and the Firefly lift off; Ma Wint War says where the Market is (no map pin, ever)
//   2. arrival past the crease; Ko Yaung's stall: the Painted Map (paint strokes on the notebook map)
//   3. Nay Chi stuck at the painted shortcut (Stamp Lane gap); the crates check it (proof:shortcut)
//   4. ch 6 givers: U Lu Aye's books (inside `marketpost`, crate into the car: cargo), Ma Yu Yu's bowls
//      (inside `sundries`), Daw Kyar's rice (cart by the crease)
//   5. deliveries where the givers chose (books: by car to the Quarter, carried into `classroom`, shelf;
//      bowls: the dogs' corner stone; rice: `riceshop` sack corner) or forks at Ko Phyo's "better" places
//      (evening-class porch / the post-office queue / the tea-shop kitchen curtain): -1 calm each
//   6. Daw Tin Tin (inside `teashop`); Ko Phyo's talk on his stool; the three pails at the pump outside
//      (Maya keeps the beat; he works the handle); `match` at the hearth; the first cup (`steady` pour);
//      later the pot of tea, for nothing
//   7. ch 7: Grandmother Pwa Pwa (thanaka), Ma Thiri at her stall; the flag-bound kite (`steady`, falls
//      whatever you do); she waits inside; four looks along the line (three outside, the cord inside);
//      Thiri's talk on the waiting bench; `ownwords` at her post; the kite on her own post (`steady`);
//      four wishes at the writing table; planes to Phoo Phoo (launched), U Lu Aye and Daw Pyone; she leaves
//      the counter (planeletter; look-alike Hold On Tight leaves for good)
//   8. desks `mgate` and `counter` (write only what is seen); home: the "ask Maya" board (14 notes)
//   9. night page at the Writing Room door once ch 6 and ch 7 are done: stamps ✓6 ✓7, save.day = 5
//
// No guidance: nothing glows, points or pins. People say where; doors are seen.
// Test hooks: window.__day4 (see the bottom of create()).
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { steady } from './acts/steady.js';
import { match } from './acts/match.js';
import { ownwords } from './acts/ownwords.js';
import { morningPost, nightPage, showSlip } from './post.js';
import { createPerson } from './people.js';
import { castById } from './cast.js';
import { L, SLEPT3, SLEPT3_OTHER, PROOFS } from './day4-lines.js';
import { TALK_D4_KOPHYO, TALK_D4_THIRI } from './talks/day4.js';
import { MK, buildMarket, buildQuarterBits, buildAskBoard } from './day4-market.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const HP = Math.PI / 2;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Unnamed walk-ons in the rooms (people.js specs; no lines). */
const WALK = {
  drinker1: { age: 'adult', build: 'mid', skin: 4, hair: 'side', top: 'shirt', topColor: 'sky', bottom: 'longyi', bottomColor: 'maroon', check: true },
  drinker2: { age: 'elder', build: 'slim', skin: 2, hair: 'bald', hairColor: 'white', top: 'eingyi', topColor: 'white', bottom: 'longyi', bottomColor: 'brown' },
  porter: { age: 'adult', build: 'wide', skin: 4, hair: 'short', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'olive', extras: ['towel'], extraColor: 'rose' },
  queue1: { age: 'adult', build: 'slim', skin: 1, hair: 'bun', top: 'blouse', topColor: 'teal', bottom: 'htamein', bottomColor: 'plum', extras: ['thanaka'] },
  queue2: { age: 'elder', build: 'mid', skin: 3, hair: 'short', hairColor: 'grey', top: 'shirt', topColor: 'cream', bottom: 'longyi', bottomColor: 'navy', check: true },
  queue3: { age: 'teen', build: 'slim', skin: 2, hair: 'spiky', top: 'tee', topColor: 'coral', bottom: 'longyi', bottomColor: 'charcoal' },
  schoolboy: { age: 'child', skin: 3, hair: 'short', top: 'school', bottom: 'schoolLongyi', extras: ['satchel'], extraColor: 'brown' },
  trishaw: { age: 'adult', build: 'wide', skin: 4, hair: 'cap', top: 'tee', topColor: 'olive', bottom: 'longyi', bottomColor: 'brown', extraColor: 'teal' },
  eater: { age: 'adult', build: 'mid', skin: 3, hair: 'side', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'maroon', extras: ['towel'], extraColor: 'tan' },
  oldwoman: { age: 'elder', build: 'slim', skin: 2, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'cream', bottom: 'htamein', bottomColor: 'brown', extras: ['thanaka'] },
  customer: { age: 'adult', build: 'mid', skin: 1, hair: 'long', top: 'blouse', topColor: 'mustard', bottom: 'htamein', bottomColor: 'teal' },
  evTeacher: { age: 'adult', build: 'slim', skin: 2, hair: 'side', top: 'shirt', topColor: 'white', bottom: 'longyi', bottomColor: 'navy', extras: ['glasses'] },
};
/** Walk-ons per room: [look, spot]. */
const ROOM_WALKONS = {
  teashop: [['drinker1', 'drinkerB1'], ['drinker2', 'drinkerB2']],
  marketpost: [['queue1', 'queue1'], ['queue2', 'queue2'], ['queue3', 'queue3']],
  riceshop: [['schoolboy', 'schoolboy'], ['trishaw', 'trishaw'], ['eater', 'porter'], ['oldwoman', 'oldwoman']],
  sundries: [['customer', 'customer']],
};
/** The close, low follow camera indoors (never the far whole-room view). */
const ROOM_CAM = { tilt: 30, width: 5.2, widthLandscape: 10, height: 0.9, minHeight: 0, stiffness: 5, bounds: null };
/** Outdoor townspeople this page places (dispose() takes them away). */
const OUT_IDS = ['wintwar', 'kyar', 'yaung', 'pyone', 'khwarnyo', 'kolwin', 'naychi', 'pwapwa', 'thiri', 'kophyo'];

function seat(person, seatY = 0.3) {
  const b = person?.bones;
  if (!b) return;
  b.hips.position.y = seatY + 0.03;
  b.legL.rotation.x = -1.3;
  b.legR.rotation.x = -1.3;
}

export { SLEPT4 } from './day4-lines.js'; // tonight's hosts' lines (later days read dayN.js SLEPTn)

export async function create(story) {
  const { game, dialog: D, save } = story;
  const F = (k, v) => story.flag(`d4.${k}`, v);
  const n = (k) => +(F(k) || 0);
  const say = (id, lines, o) => D.say(id, lines, o);
  const v3 = new THREE.Vector3();
  const ab = game.world.places.find((p) => p.id === 'about')?.door || { x: 0, z: 6 };

  // ---- the set
  const market = buildMarket(story);
  const porch = buildQuarterBits(story);
  const board = buildAskBoard(story, 14);
  const evTeacher = createPerson(WALK.evTeacher);
  evTeacher.root.position.set(MK.evTeacher.x, 0, MK.evTeacher.z);
  evTeacher.root.rotation.y = MK.evTeacher.h;
  evTeacher.root.userData.isPerson = true;
  game.world.scene.add(evTeacher.root);
  if (F('give.bowls')) market.setBowls(true);
  if (F('kite2')) { market.kite.tie('post'); market.kite.height(0.7, true); } else if (F('kite1')) market.kite.height(0.04, true);

  // ---- small helpers
  const me = () => (story.foot.active ? { x: story.foot.pos.x, z: story.foot.pos.y } : { x: game.car.root.position.x, z: game.car.root.position.z });
  const near = (p, r) => { const m = me(); return Math.hypot(m.x - p.x, m.z - p.z) < r; };
  let busyScript = false;
  /** A scripted moment outside a talk (taps, arrivals): the talking guard and the letterbox. */
  async function run(fn) {
    if (story.talking || game.busy || busyScript) return false;
    busyScript = true;
    story.talking = true;
    game.ui.cinema(true);
    try { await fn(); } catch (e) { console.error('day4', e); } finally {
      busyScript = false;
      story.talking = false;
      game.ui.cinema(false);
      game.rig.release();
    }
    return true;
  }
  /** A walk-on speaks: the dialogue box shows their role as the name (they are not in the cast). */
  async function sayAs(name, lines, o = {}) {
    const p = D.say('walkon', lines, o);
    const el = document.querySelector('#dialog .dialog-name');
    if (el) el.textContent = tr(name);
    await p;
  }
  const pencil = (id) => { if (!story.flag(`rumour.${id}`)) story.flag(`rumour.${id}`, 'pencil'); };
  /** A rumour checked with her own eyes: the proof slip goes into the bag. */
  function check(id) {
    if (F(`rumour.${id}`)) return false;
    F(`rumour.${id}`, true);
    story.flag(`rumour.${id}`, 'checked');
    if (PROOFS[id]) { save.proofs[id] = PROOFS[id]; story.give(`proof:${id}`); }
    const s = story.paint.get?.(id);
    if (s && s.state === 'paint') story.paint.rub(id);
    story.persist();
    return true;
  }
  const oldOnRub = story.paint.onRub;
  story.paint.onRub = (s) => { if (s?.rumour) check(s.rumour); call({ f: oldOnRub }, 'f', s); };
  const card = (id) => F(`card.${id}`, true);
  function fork(g) {
    if (F(`fork.${g}`)) return;
    F(`fork.${g}`, true);
    F('forked', n('forked') + 1);
  }
  const inPerson = (id) => story.people.get(id);

  // ---- the people outdoors, as the day has gone (rooms hold their own; nobody is in two places)
  function want(id) {
    switch (id) {
      case 'wintwar': return { x: ab.x + 2.6, z: ab.z + 1.2, heading: -HP };
      case 'kyar': return { ...MK.kyar, heading: MK.kyar.h };
      case 'yaung': return { ...MK.yaung, heading: 0 };
      case 'pyone': return { ...MK.pyone, heading: 0 };
      case 'khwarnyo': return { ...MK.khwarnyo, heading: 0 };
      case 'kolwin': return { ...MK.kolwin, heading: MK.kolwin.h };
      case 'naychi':
        if (F('board')) return null; // gone home to pin a note
        return F('ncTold') ? { ...MK.streetCorner, heading: 0, key: 'corner' } : { ...MK.naychi, heading: 0, key: 'gap' };
      case 'pwapwa': return (F('kite1') && !F('thTalk')) || F('ch7Done') ? null : { ...MK.pwapwa, heading: 0 };
      case 'thiri':
        if (F('ch7Done') || (F('kite1') && !F('thTalk'))) return null;
        if (F('kite2') && !F('wished')) return { x: MK.post.x - 0.5, z: MK.post.z + 0.75, heading: 0.3, key: 'post' };
        return F('thTalk') ? { x: MK.post.x - 0.5, z: MK.post.z + 0.75, heading: 0.3, key: 'post' } : { ...MK.thiri, heading: 0 };
      case 'kophyo': return F('kpTalk') && n('pails') < 3 ? { x: MK.pump.x + 0.75, z: MK.pump.z + 0.15, heading: -HP } : null;
      default: return null;
    }
  }
  const placedKey = new Map();
  function syncOutdoor() {
    if (story.inRoom) return;
    for (const id of OUT_IDS) {
      const w = want(id);
      const e = inPerson(id);
      const key = w ? w.key || 'home' : null;
      if (!w) { if (e) story.remove(id); placedKey.delete(id); continue; }
      if (e && placedKey.get(id) === key) continue;
      if (e) story.remove(id);
      story.spawn(id, w);
      placedKey.set(id, key);
    }
    const ww = inPerson('wintwar');
    if (ww && !ww.job) story.setJob('wintwar', { area: { x: ab.x + 3.5, z: ab.z + 2.2, r: 3.0 }, spot: { x: ab.x + 2.6, z: ab.z + 1.2, h: -0.4 }, mood: 'read', workChance: 0.5, workFor: [5, 9] });
  }
  syncOutdoor();

  // ---- the books' journey: cargo in the car, carried on foot from the school gate, set on the shelf
  let crateHeld = null; // the prop in her hands
  let cargoProp = null;
  function carryCrate() {
    if (crateHeld) return;
    const c = market.newCrate();
    crateHeld = c;
    story.carry(c.root, { speed: 0.75 });
    F('carrying', true);
  }
  function dropCrate() {
    if (!crateHeld) return;
    story.carry(null, { remove: true });
    try { crateHeld.dispose(); } catch { /* gone */ }
    crateHeld = null;
  }
  if (F('carrying') && !F('give.books') && !story.inRoom) setTimeout(() => { if (!crateHeld && !story.inRoom && story.foot.active) carryCrate(); }, 600);
  const oldBlocked = story.blockedTravel;
  story.blockedTravel = () => (save.cargo?.id === 'gift:books' ? L.cargoNo : oldBlocked ? oldBlocked() : null);

  // ---- the desks: write only what is seen (wraps the world's desk scene for this page's two desks)
  const ow = story.openWorld;
  const lightDesk0 = ow?.lightDesk;
  const DESK_LINES = { mgate: L.deskMgate, counter: L.deskCounter };
  if (ow && lightDesk0) {
    ow.lightDesk = async (d) => {
      const lines = DESK_LINES[d.id];
      if (!lines || save.flags[`desk:${d.id}`] || story.talking || game.busy) return lightDesk0.call(ow, d);
      story.talking = true;
      game.ui.cinema(true);
      try {
        await say('maya', [L.deskMgateQ], { face: 'think' });
        for (;;) {
          const i = await D.choose(lines);
          if (i === 0) break;
          await say('maya', L.deskWrong, { face: 'think' });
        }
      } finally { story.talking = false; game.ui.cinema(false); }
      await lightDesk0.call(ow, d);
      F(`desk.${d.id}`, true);
      for (const r of ['shortcut', 'counter', 'freefood', 'kite', 'firstcup']) pencil(r);
      if (d.id === 'counter') check('counter');
      await run(() => say('maya', L.deskDone, { face: 'happy' }));
    };
  }

  // ---- taps on things in the street (no markers: the player taps what she sees)
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  function groundAt(x, y) {
    ndc.set((x / game.viewW) * 2 - 1, -(y / game.viewH) * 2 + 1);
    ray.setFromCamera(ndc, game.camera);
    return ray.ray.intersectPlane(plane, new THREE.Vector3());
  }
  function personNearTap(x, y) {
    for (const e of story.people.values()) {
      const q = game.rig.project(v3.set(e.p.root.position.x, e.p.height * 0.7, e.p.root.position.z), game.viewW, game.viewH);
      if (q && Math.hypot(q.x - x, q.y - y) < 40) return true;
    }
    return false;
  }
  const flag14X = MK.flag14?.x ?? MK.postOffice.x - 2.8; // the reply flag that is down (regions/market.js)
  const SPOTS = [
    { id: 'crates', x: MK.crates.x, z: MK.crates.z - 0.2, r: 1.5, when: () => !F('rumour.shortcut'), go: () => cratesCheck() },
    { id: 'stone', x: MK.stone.x, z: MK.stone.z, r: 1.3, when: () => story.has('gift:bowls'), go: () => deliverBowls() },
    { id: 'porch', x: MK.porch.x, z: MK.porch.z, r: 1.8, when: () => !!crateHeld, go: () => forkBooks() },
    { id: 'string', x: flag14X, z: MK.postOffice.z + MK.postOffice.d / 2 + 0.6, r: 1.1, when: () => F('kite1') && !F('look.string'), go: () => lookAt('string') },
    { id: 'planes', x: MK.table.x, z: MK.table.z, r: 0.75, when: () => F('kite1') && !F('look.planes'), go: () => lookAt('planes') },
    { id: 'post', x: MK.post.x, z: MK.post.z, r: 0.7, when: () => F('kite1') && !F('look.post'), go: () => lookAt('post') },
    { id: 'board', x: board.at.x, z: board.at.z, r: 1.3, when: () => true, go: () => readBoard() },
  ];
  const pumpState = { on: false, strokes: 0, last: 0, wait: false };
  let lastPour = null;
  const tapHook = (x, y) => {
    if (story.inRoom || !story.foot.active || game.mode !== 'world') return false;
    const p = groundAt(x, y);
    if (!p) return false;
    // keeping the beat at the pump: a tap on the pump itself is trying to do his work for him
    if (pumpState.on) {
      if (Math.hypot(p.x - MK.pump.x, p.z - MK.pump.z) < 0.85) { story.bark('kophyo', L.kpNo[0], 2800); return true; }
      if (!personNearTap(x, y)) { beat(); return true; }
    }
    if (personNearTap(x, y)) return false;
    for (const s of SPOTS) {
      if (Math.hypot(p.x - s.x, p.z - s.z) > s.r || !s.when()) continue;
      const m = me();
      const go = () => run(s.go);
      if (Math.hypot(m.x - s.x, m.z - s.z) < 1.8) go();
      else story.foot.walkTo(s.x, s.z + 0.9, (ok) => { if (ok !== false) go(); });
      return true;
    }
    return false;
  };
  story.tapHooks = story.tapHooks || [];
  story.tapHooks.push(tapHook);

  // =============================================================================================
  // Main thread: the Painted Map, Nay Chi, the crates
  // =============================================================================================
  async function paintedMap() {
    await say('yaung', L.ky1, { face: 'happy' });
    await say('maya', L.mayaAsk, { face: 'think' });
    await say('yaung', L.ky2, { face: 'smile' });
    await say('maya', L.mayaMap2, { face: 'think' });
    story.give('paintedmap');
    F('map', true);
    story.paint.add({ id: 'shortcut', rumour: 'shortcut', pts: [[MK.gap.x, 272], [MK.gap.x, 281], [22.6, 296], [MK.pump.x, MK.teaShop.z + MK.teaShop.d / 2 + 0.6]], at: { x: MK.gap.x, z: MK.gap.z } });
    story.paint.add({ id: 'bridge', rumour: 'bridge', pts: [[7, 300], [7, 345], [8, 378], [40, 404], [62, 424], [96, 476]], at: { x: 96, z: 476 } });
    for (const r of ['shortcut', 'bridge', 'counter']) pencil(r);
  }
  async function cratesCheck() {
    await say('maya', L.crates, { face: 'think' });
    check('shortcut');
  }
  async function ncTalk() {
    await say('naychi', L.nc1, { face: 'worried' });
    const i = await D.choose(L.ncChoices);
    await say('naychi', L.nc2, { face: 'happy' });
    await say('maya', L.ncMaya, { face: 'think' });
    F('ncMet', true); F('ncTold', true); F('ncWay', i);
    // she walks off the way she was told, and stops at the tea-shop street corner
    const e = inPerson('naychi');
    if (e) {
      e.paused = true;
      story.walkPerson('naychi', MK.streetCorner.x, MK.streetCorner.z, 1.2).then(() => { const q = inPerson('naychi'); if (q) { q.home.h = 0; q.paused = false; } placedKey.set('naychi', 'corner'); });
    }
  }

  // =============================================================================================
  // Chapter 6: the givers, the deliveries, the forks, Ko Phyo
  // =============================================================================================
  async function luayeCrate() {
    await say('luaye', L.la1, { face: 'smile' });
    story.give('gift:books');
    F('got.books', true);
    story.room?.set?.('crate', false);
    cargoProp = market.newCrate();
    story.cargo.load('gift:books', cargoProp.root);
    await say('maya', L.laCrate, { face: 'smile' });
  }
  async function takeBowls() {
    story.give('gift:bowls');
    F('got.bowls', true);
    story.room?.set?.('bowls', false);
  }
  async function afterDelivery() {
    if (F('delivered') || !(F('give.books') && F('give.bowls') && F('give.rice'))) return;
    await say('maya', L.delivered, { face: 'happy' });
    card('theirs');
    F('delivered', true);
  }
  async function deliverBowls() {
    story.take('gift:bowls');
    market.setBowls(true);
    F('give.bowls', true);
    const drinking = market.dogDrinks();
    await wait(900);
    await say('maya', L.bowlsMaya, { face: 'happy' });
    await drinking;
    card('glad');
    await afterDelivery();
  }
  async function deliverRice() {
    story.take('gift:rice');
    story.room?.set?.('sack3', true);
    F('give.rice', true);
    await say('yi', L.yiRice, { face: 'smile' });
    check('freefood');
    card('nobody');
    await afterDelivery();
  }
  async function deliverBooks() {
    F('crateIn', false); F('carrying', false);
    story.take('gift:books');
    F('give.books', true);
    await say('hninwai', L.hwBooks, { face: 'happy' });
    await say('toetoe', L.ttBooks, { face: 'surprised', emote: 'cheer' });
    await afterDelivery();
  }
  async function forkBooks() {
    await sayAs(L.evTeacher, L.forkBooks);
    await say('maya', L.forkMaya, { face: 'worried' });
    fork('books');
  }
  async function forkBowls() {
    await say('luaye', L.forkBowls, { face: 'surprised' });
    await say('maya', L.forkMaya, { face: 'worried' });
    fork('bowls');
  }
  async function forkRice() {
    await say('tintin', L.forkRice, { face: 'surprised' });
    await say('maya', L.forkMaya, { face: 'worried' });
    fork('rice');
  }

  /** Ko Phyo's sneer for a gift Maya is carrying (or the general complaint). */
  function sneerFor() {
    if (story.has('gift:books') && !F('give.books')) return L.kpBooks;
    if (story.has('gift:bowls')) return L.kpBowls;
    if (story.has('gift:rice')) return L.kpRice;
    return L.kpIdle;
  }

  async function kpTalk(e) {
    await say('kophyo', L.kpOpen, { face: 'sad' });
    // Maya sits on the stool opposite and sets her mug down between them
    const sp = story.room?.spots?.mayaTalk;
    if (sp) { game.walker.teleport(sp.x, sp.z, sp.h); game.maya.root.position.set(sp.x, 0, sp.z); }
    const r = await story.talk.run({ ...TALK_D4_KOPHYO, calm: 4 - Math.min(2, n('forked')) });
    if (!r.won) { await say('kophyo', L.kpNotYet, { face: 'sad' }); return; }
    F('kpTalk', true);
    await say('tintin', L.dttDeal, { face: 'smile' });
    await say('kophyo', L.kpBeat, { face: 'think' });
    await say('kophyo', L.kpGoPump, { face: 'smile' });
    F('beatSaid', true);
    // he goes out to the pump; she follows when she likes
    const d = story.room?.door;
    seated.delete('kophyo');
    if (d && inPerson('kophyo')) await Promise.race([story.walkPerson('kophyo', d.x, d.z - 0.3, 1.4), wait(6000)]);
    story.remove('kophyo');
    void e;
  }
  async function brewScene() {
    await say('kophyo', L.brewWhy, { face: 'think' });
    await say('tintin', L.brewDtt, { face: 'smile' });
    for (;;) {
      const r = await match({ title: L.matchTitle, hint: L.matchHint, pairs: L.matchPairs });
      if (r.ok) break;
      if (r.cancelled) return;
    }
    F('brew', true);
    await say('kophyo', L.kpBrew, { face: 'happy' });
  }
  async function pourScene() {
    const room = story.room;
    const spots = room?.spots || {};
    // a porter comes in out of the heat and sits at the door table; the watchers are about
    const porter = addWalkon('porter', 'porterD');
    if (spots.yaungA) { story.spawn('yaung', 'yaungA'); seated.set('yaung', spots.yaungA.seat || 0.27); }
    if (spots.doorway) story.spawn('pyone', 'doorway');
    await say('maya', L.porterIn, { face: 'smile' });
    seated.delete('kophyo');
    if (spots.kophyoPour) await Promise.race([story.walkPerson('kophyo', spots.kophyoPour.x, spots.kophyoPour.z, 1.2), wait(5000)]);
    const kp = inPerson('kophyo');
    if (kp && spots.kophyoPour) { kp.home.h = spots.kophyoPour.h; kp.p.root.rotation.y = spots.kophyoPour.h; }
    story.steam('kophyo', 1);
    for (;;) {
      const r = await steady({ title: L.pourTitle, hint: L.pourHint, mode: 'pour', seconds: 8, watchers: 3, rounds: 1, again: L.pourAgain, who: 'kophyo' });
      lastPour = r; // (test hook: __day4.lastPour())
      if (r.ok) break;
      if (r.cancelled) { story.steam('kophyo', null); cleanupPour(porter); return; }
    }
    story.steam('kophyo', 0);
    await say('maya', L.porterDrinks, { face: 'smile' });
    call(porter?.p, 'emote', 'nod');
    await wait(600);
    cleanupPour(porter);
    await say('kophyo', L.kpPoured, { face: 'think' });
    await say('maya', L.mayaPoured, { face: 'happy' });
    story.steam('kophyo', null);
    F('poured', true);
    F('ch6Done', true);
  }
  function cleanupPour(porter) {
    if (porter) removeWalkon(porter);
    if (story.inRoom === 'teashop') { story.remove('yaung'); story.remove('pyone'); seated.delete('yaung'); }
  }
  async function teapotScene() {
    await say('kophyo', L.kpTeapot, { face: 'smile' });
    story.give('teapot');
    F('teapot', true);
    story.room?.set?.('teapot', true);
    save.pencil.kophyo = 'ink';
    story.persist();
  }

  // ---- the pump: Ko Phyo works the handle, Maya keeps the beat (tap in rhythm; a rushed tap splashes)
  function beat() {
    if (pumpState.wait) return;
    const now = performance.now() / 1000;
    const dt = now - pumpState.last;
    pumpState.last = now;
    if (pumpState.strokes > 0 && dt < 0.35) {
      pumpState.strokes = 0;
      market.pumpFlow(0.2);
      call(game.audio, 'play', 'thud');
      story.bark('kophyo', L.splash, 1600);
      setTimeout(() => market.pumpFlow(0), 400);
      return;
    }
    pumpState.strokes = pumpState.strokes > 0 && dt <= 0.9 ? pumpState.strokes + 1 : 1;
    market.pumpHandle(1);
    setTimeout(() => market.pumpHandle(-1), 180);
    call(inPerson('kophyo')?.p, 'emote', 'nod');
    call(game.audio, 'play', 'click');
    story.bark('maya', L.beats[pumpState.strokes - 1], 700);
    if (pumpState.strokes >= 4) {
      pumpState.strokes = 0;
      market.pumpFlow(1);
      setTimeout(() => market.pumpFlow(0), 900);
      pailCarried();
    }
  }
  async function pailCarried() {
    pumpState.wait = true;
    const pails = n('pails') + 1;
    F('pails', pails);
    story.bark('kophyo', L.pailFull, 1600);
    const e = inPerson('kophyo');
    const door = story.doors?.DOORS?.teashop;
    if (e && door) {
      e.paused = true;
      await Promise.race([story.walkPerson('kophyo', door.x, door.z + 0.4, 1.3), wait(7000)]);
      await wait(500);
      if (pails < 3) await Promise.race([story.walkPerson('kophyo', MK.pump.x + 0.75, MK.pump.z + 0.15, 1.3), wait(7000)]);
      const q = inPerson('kophyo');
      if (q) { q.paused = false; q.home.h = -HP; }
    }
    pumpState.wait = false;
    if (pails >= 3) {
      pumpState.on = false;
      await run(() => say('kophyo', L.kpGot, { face: 'happy' }));
      story.remove('kophyo');
      placedKey.delete('kophyo');
    }
  }

  // =============================================================================================
  // Chapter 7: Ma Thiri
  // =============================================================================================
  async function kite1() {
    for (;;) {
      const r = await steady({ title: L.kite1Title, hint: L.kite1Hint, mode: 'kite', anchor: 'flag', seconds: 12, flagDrops: [6], who: 'thiri' });
      if (!r.cancelled) break;
      return false; // closed: she still holds it out; the hold waits
    }
    market.kite.height(0.04);
    await say('maya', L.kite1Maya, { face: 'worried' });
    await say('thiri', L.kite1Th, { face: 'sad', mood: 'down' });
    await say('thiri', L.thInside, { face: 'sad' });
    F('kite1', true);
    // she ties the line off and goes in to sit on the bench facing hole ၁၄ (her grandmother follows later)
    const e = inPerson('thiri');
    const door = story.doors?.DOORS?.marketpost;
    if (e && door) { e.paused = true; await Promise.race([story.walkPerson('thiri', door.x, door.z + 0.3, 1.2), wait(6000)]); }
    syncOutdoor();
    return true;
  }
  /** A look along the line: the pencil label (heard), then the gold (seen). */
  function lookCard(look) {
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.className = 'd4-look';
      el.innerHTML = '<div class="card"><small class="h"></small><p class="pencil"></p><small class="s"></small><p class="gold"></p></div>';
      el.querySelector('.h').textContent = tr(L.lookHeard);
      el.querySelector('.pencil').textContent = `«${tr(look.pencil)}»`;
      el.querySelector('.s').textContent = tr(L.lookSeen);
      el.querySelector('.gold').textContent = tr(look.gold);
      call(game.audio, 'play', 'page');
      document.getElementById('game').appendChild(el);
      setTimeout(() => { el.classList.add('on'); call(game.audio, 'play', 'sparkle'); }, 900);
      const fin = (ev) => { ev.stopPropagation(); if (!el.classList.contains('on')) { el.classList.add('on'); return; } el.remove(); resolve(); };
      el.addEventListener('click', fin);
    });
  }
  async function lookAt(id) {
    await lookCard(L.looks[id]);
    F(`look.${id}`, true);
    if (id === 'string') card('notwind');
    if (id === 'planes') card('ownhands');
    if (id === 'post') card('ownpost');
    if (['string', 'flag', 'planes', 'post'].every((k) => F(`look.${k}`)) && !F('thLooked')) {
      F('thLooked', true);
      await say('maya', L.looked, { face: 'think' });
    }
  }
  async function thiriTalk() {
    const room = story.room;
    const sp = room?.spots?.thiri;
    if (sp) { game.walker.teleport(sp.x + 1.1, sp.z + 0.05, -HP); game.maya.root.position.set(sp.x + 1.1, 0, sp.z + 0.05); }
    seated.delete('thiri');
    const r = await story.talk.run(TALK_D4_THIRI);
    if (inPerson('thiri') && room?.spots?.thiri) seated.set('thiri', room.spots.thiri.seat || 0.42);
    if (!r.won) { await say('thiri', L.thNotYet, { face: 'sad' }); return; }
    F('thTalk', true);
    // she gets up without looking back at hole ၁၄ and walks out of the door to her post; Maya follows
    seated.delete('thiri');
    const d = room?.door;
    if (d) await Promise.race([story.walkPerson('thiri', d.x, d.z - 0.2, 1.3), wait(6000)]);
    story.remove('thiri');
    await story.exit();
    syncOutdoor();
    await postScene();
  }
  /** Outside at her stall: three true things drive the post in; then the kite on her own post. */
  async function postScene() {
    if (!F('three')) {
      for (;;) {
        const r = await ownwords({ title: L.owTitle, hint: L.owHint, prompt: L.owPrompt, fragments: L.owFrags, need: 3 });
        if (r.ok) break;
        if (r.cancelled) return;
      }
      F('three', true);
      await say('thiri', L.three, { face: 'happy' });
    }
    if (!F('kite2')) {
      market.kite.tie('post');
      market.kite.height(0.6);
      for (;;) {
        const r = await steady({ title: L.kite2Title, hint: L.kite2Hint, mode: 'kite', anchor: 'post', seconds: 12, flagDrops: [6], gusts: [3, 9], again: L.kite2Again, who: 'thiri' });
        if (r.ok) break;
        if (r.cancelled) return;
      }
      market.kite.height(0.72);
      await say('thiri', L.kite2Th, { face: 'happy' });
      F('kite2', true);
    }
    await say('thiri', L.thWrite, { face: 'smile' });
    if (story.inRoom) return;
    const ok = await story.enter('marketpost');
    if (ok) await wishScene();
  }
  /** Inside at the public writing table: the four wishes, the same on three planes. */
  async function wishScene() {
    if (F('wished')) return;
    const sp = story.room?.spots?.writeTable;
    if (sp) { await new Promise((r) => { story.foot.walkTo(sp.x - 1.0, sp.z + 0.4, () => r()); setTimeout(r, 4000); }); }
    await say('thiri', L.wishes, { face: 'smile' });
    await say('thiri', L.thWho, { face: 'think' });
    F('wished', true);
    await say('thiri', L.thCarry, { face: 'smile' });
    const d = story.room?.door;
    if (d && inPerson('thiri')) await Promise.race([story.walkPerson('thiri', d.x, d.z - 0.2, 1.3), wait(6000)]);
    story.remove('thiri');
    pending.push(launchPlane); // she launches Phoo Phoo's plane from the step once Maya is out too
  }
  let planeBusy = false;
  async function launchPlane() {
    if (F('plane.phoophoo') || planeBusy) return;
    planeBusy = true;
    const from = { x: MK.postOffice.x, z: MK.postOffice.z + MK.postOffice.d / 2 + 0.7 };
    const p = market.launchPlane(from, { x: MK.postOffice.x - 2, z: 250 });
    await wait(1600);
    await say('maya', L.planeOff, { face: 'smile' });
    await p;
    F('plane.phoophoo', true);
    planeBusy = false;
  }
  async function closeScene() {
    await say('thiri', L.thEnd, { face: 'happy' });
    story.give('planeletter');
    await say('maya', L.mayaEnd7, { face: 'think' });
    if (inPerson('pwapwa')) await say('pwapwa', L.pwAfter, { face: 'happy' });
    story.lookalikeGone('holdtight');
    F('ch7Done', true);
    save.pencil.thiri = 'ink';
    story.persist();
    // she takes her grandmother's arm and walks home for lunch; the flag over ၁၄ stays down
    const west = { x: 3.0, z: 301.5 };
    const walks = ['thiri', 'pwapwa'].filter((id) => inPerson(id)).map((id, i) => Promise.race([story.walkPerson(id, west.x - i * 0.7, west.z, 1.0), wait(9000)]));
    await Promise.all(walks);
    syncOutdoor();
  }

  // =============================================================================================
  // The "ask Maya" board at home
  // =============================================================================================
  async function readBoard() {
    if (F('board')) return say('maya', L.boardDone, { face: 'smile' });
    if (!(F('ch6Done') || F('ch7Done'))) return say('maya', L.boardMaya4, { face: 'think' });
    await say('maya', L.boardMaya4, { face: 'think' });
    await say('maya', [L.boardPick], { face: 'think' });
    const i = await D.choose(L.board4.map((b) => ({ my: `${b.from.my}: ${b.my}`, en: `${b.from.en}: ${b.en}` })));
    const note = L.board4[i];
    await say('maya', [{ my: note.my, en: note.en }], { face: 'think' });
    const j = await D.choose(note.replies);
    call(game.audio, 'play', 'type');
    F('board', true);
    F('boardReply', `${i}:${j}`);
    story.board.set({ replies: 3 });
    syncOutdoor();
  }

  // =============================================================================================
  // What people say (story.talkTo calls these; story.talking is already on)
  // =============================================================================================
  const talk = {
    wintwar: async () => {
      if (!F('morning')) return morning();
      if ((F('ch6Done') || F('ch7Done')) && !F('wwEve')) { F('wwEve', true); return say('wintwar', L.wwEvening, { face: 'smile' }); }
      return say('wintwar', F('wwEve') ? L.wwBoardAfter : L.wwLater, { face: 'smile' });
    },
    kyar: async () => {
      if (!F('got.rice')) { await say('kyar', L.dk1, { face: 'smile' }); story.give('gift:rice'); F('got.rice', true); return; }
      return say('kyar', F('give.rice') ? L.dkAfter : [L.dk1[1]], { face: 'smile' });
    },
    yaung: async () => {
      if (!F('map')) return paintedMap();
      if (F('rumour.shortcut')) return say('yaung', L.kyAfter, { face: 'think' });
      const i = n('kyI') % L.ky.length; F('kyI', i + 1);
      return say('yaung', [L.ky[i]], { face: 'happy' });
    },
    pyone: async () => {
      if (F('wished') && !F('plane.pyone')) { await say('pyone', L.pyPlane, { face: 'hot' }); F('plane.pyone', true); return; }
      if (F('plane.pyone')) return say('maya', L.pyAfter, { face: 'smile' });
      const i = n('pyI') % L.py.length; F('pyI', i + 1);
      if (i === 1) pencil('freefood');
      if (i === 2) pencil('kite');
      return say('pyone', [L.py[i]], { face: 'hot' });
    },
    khwarnyo: () => say('khwarnyo', L.kn, { face: 'think' }),
    kolwin: () => say('kolwin', L.kl, { face: 'smile' }),
    naychi: async () => {
      if (!F('ncTold')) return ncTalk();
      return say('naychi', L.ncAfter, { face: 'smile' });
    },
    pwapwa: async () => {
      if (!F('pwMet')) { await say('pwapwa', L.pw1.slice(0, 1), { face: 'smile' }); story.give('thanaka', 3); await say('pwapwa', L.pw1.slice(1), { face: 'smile' }); F('pwMet', true); pencil('kite'); return; }
      return say('pwapwa', L.pwAgain, { face: 'smile' });
    },
    thiri: async () => {
      if (story.inRoom === 'marketpost') {
        if (F('wished') || F('thTalk')) return say('thiri', L.thWaitPlanes, { face: 'smile' });
        if (!F('thLooked')) return say('thiri', L.thWaiting, { face: 'sad' });
        if (story.talk.waiting(TALK_D4_THIRI.id)) return say('thiri', L.thNotYet, { face: 'sad' });
        return thiriTalk();
      }
      if (F('plane.phoophoo') && F('plane.luaye') && F('plane.pyone')) return closeScene();
      if (F('wished')) return say('thiri', L.thWaitPlanes, { face: 'smile' });
      if (F('thTalk')) return postScene();
      if (!F('thMet')) {
        await say('thiri', L.th1, { face: 'worried' });
        F('thMet', true);
        if (check('kite')) await say('maya', L.kiteSeen, { face: 'smile' });
      }
      if (!F('kite1')) return kite1();
      return undefined;
    },
    kophyo: async (e) => {
      if (!story.inRoom) { // at the pump
        if (n('pails') < 3) return say('kophyo', L.kpBeat, { face: 'think' });
        return undefined;
      }
      if (F('teapot')) return say('kophyo', L.kpAfter, { face: 'happy' });
      if (F('poured')) return F('teapotReady') ? teapotScene() : say('kophyo', L.kpBusy, { face: 'smile' });
      if (F('brew')) return pourScene();
      if (F('kpTalk')) return n('pails') >= 3 ? brewScene() : say('kophyo', L.kpGoPump, { face: 'smile' });
      if (F('delivered')) {
        if (story.talk.waiting(TALK_D4_KOPHYO.id)) return say('kophyo', L.kpNotYet, { face: 'sad' });
        return kpTalk(e);
      }
      return say('kophyo', sneerFor(), { face: 'hot' });
    },
    tintin: async () => {
      if (!F('dttMet')) {
        await say('tintin', L.dtt1, { face: 'smile' });
        F('dttMet', true);
        card('fillfirst');
        check('firstcup');
        return;
      }
      if (F('kpTalk') && n('pails') >= 3 && !F('brew')) return brewScene();
      if (F('brew')) return say('tintin', L.dttAfter, { face: 'happy' });
      return say('tintin', [L.dtt1[2]], { face: 'smile' });
    },
    luaye: async () => {
      if (!F('got.books')) return luayeCrate();
      if (F('wished') && !F('plane.luaye')) { await say('luaye', L.laPlane, { face: 'surprised' }); F('plane.luaye', true); story.room?.set?.('plane', true); return; }
      if (F('ch7Done') || F('plane.luaye')) return say('luaye', L.laAfter, { face: 'smile' });
      if (F('thLooked') && !F('card.wishwell')) { await say('luaye', L.laWish, { face: 'think' }); card('wishwell'); return; }
      if (!F('la2')) { await say('luaye', L.la2, { face: 'think' }); F('la2', true); pencil('kite'); return; }
      await say('luaye', L.laHours, { face: 'smile' });
      check('counter');
    },
    yuyu: async () => {
      if (!F('yuMet')) { await say('yuyu', L.yu1, { face: 'smile' }); F('yuMet', true); return say('yuyu', L.yuTake, { face: 'smile' }); }
      if (!F('got.bowls')) return say('yuyu', L.yuTake, { face: 'smile' });
      return say('yuyu', F('give.bowls') ? L.yuAfter : L.yuBefore, { face: 'smile' });
    },
    yi: async () => {
      if (story.has('gift:rice') && !F('give.rice')) return deliverRice();
      await say('yi', L.yiAmb, { face: 'smile' });
      check('freefood');
    },
    hninwai: async () => {
      if (F('crateIn') && !F('give.books')) return deliverBooks();
      return say('hninwai', L.hwAmb, { face: 'smile' });
    },
    toetoe: async () => {
      if (F('crateIn') && !F('give.books')) return deliverBooks();
      return say('toetoe', F('give.books') ? L.ttBooks : L.ttAmb, { face: 'happy' });
    },
  };

  // ---- the morning post (Writing Room door)
  async function morning() {
    const host = save.notebook.sleptAt.filter((s) => s.day === 3).pop() || save.notebook.sleptAt[save.notebook.sleptAt.length - 1];
    const slept = { ...SLEPT3 };
    if (host && !slept[host.who]) slept[host.who] = SLEPT3_OTHER;
    const wasTalking = story.talking;
    await morningPost(story, {
      day: 4,
      ww: L.ww1,
      slept,
      after: L.ww2,
      letters: [{ text: L.mnNote, sign: castById('sunwe')?.name }],
      question: L.ttQ,
      companions: ['seedling', 'firefly'],
      liftCaption: { seedling: L.seedling, firefly: L.ch9comp },
      lift: { firefly: L.compMaya },
      where: [...L.ww3, ...L.wwFirstcup],
    });
    pencil('firstcup');
    story.talking = true;
    game.ui.cinema(true);
    try { await say('maya', L.mayaMap, { face: 'think' }); } finally { story.talking = wasTalking; game.ui.cinema(false); }
    F('morning', true);
    game.ui.tip?.(tr(L.controlsTip), 5000);
  }

  // =============================================================================================
  // Rooms (doors.js hooks)
  // =============================================================================================
  const seated = new Map(); // id -> seat height (people on stools and benches, posed every frame)
  const walkons = []; // { p, seat }
  const extraStations = [];
  let pending = []; // outdoor moments queued from inside (run when she is out again)
  let needSync = false;
  let needCarry = false;
  function addWalkon(look, spot) {
    const s = story.room?.spots?.[spot];
    if (!s || !story.room?.scene) return null;
    const p = createPerson(WALK[look]);
    p.root.position.set(s.x, 0, s.z);
    p.root.rotation.y = s.h ?? 0;
    p.root.userData.isPerson = true;
    story.room.scene.add(p.root);
    const w = { p, seat: s.seat || 0 };
    walkons.push(w);
    return w;
  }
  function removeWalkon(w) {
    const k = walkons.indexOf(w);
    if (k >= 0) walkons.splice(k, 1);
    w.p.root.removeFromParent();
    w.p.dispose();
  }
  function addStation(room, id, x, z, look) {
    if (!room?.stations) return;
    const marker = new THREE.Group();
    marker.visible = false;
    marker.userData.update = () => {};
    const s = { id, x, z, r: 0.9, look, labelY: 1.6, emote: 'point', face: 'smile', marker, noMarker: true, labelAnchor: new THREE.Vector3(look.x, 1.6, look.z) };
    room.stations.push(s);
    extraStations.push([room, s]);
  }
  const roomSpots = new Map(); // id -> spot (what roomCast placed)
  function roomCast(id) {
    const list = [];
    const add = (who, spot) => { list.push({ id: who, spot }); roomSpots.set(who, spot); };
    roomSpots.clear();
    if (id === 'teashop') {
      add('tintin', 'tintin');
      if (!(F('kpTalk') && n('pails') < 3)) add('kophyo', 'kophyo');
    } else if (id === 'marketpost') {
      add('luaye', 'luaye');
      if (F('kite1') && !F('thTalk')) { add('thiri', 'thiri'); add('pwapwa', 'pwapwa'); }
      if (F('kite2') && !F('wished')) add('thiri', 'writeTable');
    } else if (id === 'riceshop') add('yi', 'dawyi');
    else if (id === 'sundries') add('yuyu', 'yuyu');
    else return undefined; // the classroom and others: the room's own cast
    return list;
  }
  async function enterRoom(id, room) {
    F(`in.${id}`, true);
    if (story.doors?.roomCam) story.doors.roomCam(); else game.rig.setFollow(ROOM_CAM); // doors.js's shared close, low room camera
    game.rig.snap?.();
    // seated people
    seated.clear();
    for (const [who, spot] of roomSpots) { const s = room.spots?.[spot]; if (s?.seat && inPerson(who)) seated.set(who, s.seat); }
    for (const [look, spot] of ROOM_WALKONS[id] || []) addWalkon(look, spot);
    // the set dressing follows the day
    if (id === 'teashop') {
      room.set?.('pails', n('pails') >= 3);
      room.set?.('teapot', !!F('teapot'));
      addStation(room, 'd4-kitchen', 2.3, -2.9, { x: 2.9, z: -3.9 });
    } else if (id === 'marketpost') {
      room.set?.('crate', !F('got.books'));
      room.set?.('plane', !!F('plane.luaye'));
      addStation(room, 'd4-queue', -0.2, -0.5, { x: 0.6, z: -1.4 });
    } else if (id === 'riceshop') room.set?.('sack3', !!F('give.rice'));
    else if (id === 'sundries') room.set?.('bowls', !F('got.bowls'));
    else if (id === 'classroom' && crateHeld) { dropCrate(); F('crateIn', true); }
    // Daw Tin Tin hands over the leaves and the pot once the three pails are in
    if (id === 'teashop' && n('pails') >= 3 && !F('dttGave')) {
      F('dttGave', true);
      await run(() => say('tintin', L.dttGives, { face: 'happy' }));
    }
  }
  function leaveRoom(id) {
    for (const w of walkons.slice()) removeWalkon(w);
    for (const [room, s] of extraStations) { const k = room.stations.indexOf(s); if (k >= 0) room.stations.splice(k, 1); }
    extraStations.length = 0;
    seated.clear();
    if (id === 'classroom' && F('crateIn') && !F('give.books')) { F('crateIn', false); needCarry = true; }
    if (id === 'teashop' && F('poured')) F('teapotReady', true);
    needSync = true;
  }
  /** Story taps on room things (doors.js goStation -> day.station). Truthy = handled here. */
  function station(sid) {
    const go = (fn) => { run(fn); return true; };
    switch (sid) {
      case 'menu': return go(async () => { await say('maya', L.menuSeen, { face: 'smile' }); check('firstcup'); });
      case 'hearth': if (F('kpTalk') && n('pails') >= 3 && !F('brew')) return go(brewScene); return false;
      case 'd4-kitchen': if (story.has('gift:rice')) return go(forkRice); return false;
      case 'd4-queue': if (story.has('gift:bowls')) return go(forkBowls); return false;
      case 'hours': check('counter'); return false; // the board's own line shows; seeing it is the check
      case 'flag': if (F('kite1') && !F('look.flag')) return go(() => lookAt('flag')); return false;
      case 'crate': if (!F('got.books')) return go(luayeCrate); return false;
      case 'sackCorner': if (story.has('gift:rice') && !F('give.rice')) return go(deliverRice); return false;
      case 'bowls': if (!F('yuMet')) return go(talk.yuyu); if (!F('got.bowls')) return go(takeBowls); return false;
      case 'cl-shelf': if (F('crateIn') && !F('give.books')) return go(deliverBooks); return false;
      default: return false;
    }
  }

  // =============================================================================================
  // Every frame
  // =============================================================================================
  let ncBarkT = 0, nightBusy = false, t0 = 0;
  async function night() {
    if (nightBusy) return;
    nightBusy = true;
    const met = ['kophyo', 'thiri', 'luaye', 'tintin', 'yuyu', 'kyar', 'yi', 'pwapwa', 'yaung', 'naychi', 'pyone'];
    const metFlag = { kophyo: 'kpTalk', thiri: 'thMet', luaye: 'got.books', tintin: 'dttMet', yuyu: 'yuMet', kyar: 'got.rice', yi: 'give.rice', pwapwa: 'pwMet', yaung: 'map', naychi: 'ncMet', pyone: 'plane.pyone' };
    try {
      await nightPage(story, {
        day: 4,
        truth: { q: L.nightQ, choices: L.nightChoices, right: 1, wrong: L.nightWrong },
        before: async () => { await showSlip(game, L.replyLine, { kind: 'notebook', title: L.replyTitle }); F('replyLine', true); },
        sleep: { q: L.sleepQ, who: met.filter((id) => F(metFlag[id])) },
        stamps: [6, 7],
        stampText: L.stampText6,
        extra: L.stampText7,
        tomorrow: L.tomorrow,
      });
    } finally { nightBusy = false; }
  }

  // far things are not drawn (the phone budget outdoors): today's townspeople, the dogs, the porch and its teacher
  let cullT = 0;
  function cull() {
    const m = me();
    const R = story.foot.active ? 34 : 48;
    const far = (x, z, r = R) => Math.hypot(m.x - x, m.z - z) > r;
    for (const id of OUT_IDS) { const e = inPerson(id); if (e) e.p.root.visible = e === story.talkWith || !far(e.p.root.position.x, e.p.root.position.z); }
    for (const d of market.parts.dogs || []) d.root.visible = !far(d.root.position.x, d.root.position.z);
    const pv = !far(MK.porch.x, MK.porch.z, R + 10);
    porch.group.visible = pv;
    evTeacher.root.visible = pv;
  }
  function update(dt, t) {
    t0 = t;
    market.update(dt, t);
    evTeacher.update(dt, { speed: 0 });
    if (!story.inRoom && (cullT -= dt) <= 0) { cullT = 0.5; cull(); }
    if (story.inRoom) {
      for (const [id, y] of seated) { const e = inPerson(id); if (e && !e.walking) seat(e.p, y); }
      for (const w of walkons) { w.p.update(dt, { speed: 0 }); if (w.seat) seat(w.p, w.seat); }
      return;
    }
    if (needSync && !game.busy) {
      needSync = false;
      syncOutdoor();
      if (needCarry && story.foot.active) { needCarry = false; carryCrate(); }
    }
    // (a reload between the wishes and stepping out loses the queue: Phoo Phoo's plane still has to fly)
    if (F('wished') && !F('plane.phoophoo') && !planeBusy && !pending.includes(launchPlane)) pending.push(launchPlane);
    if (pending.length && !story.talking && !game.busy && story.foot.active) { const fn = pending.shift(); run(fn); return; }
    if (story.talking || game.busy || nightBusy) return;
    const m = me();
    const foot = story.foot.active;
    // desks lit today (the world keeps desk:<id>)
    for (const id of ['mgate', 'counter']) if (save.flags[`desk:${id}`] && !F(`desk.${id}`)) F(`desk.${id}`, true);
    // arriving on the letter
    if (!F('arrived') && m.z > 258.8 && m.z < 378 && m.x > -40 && m.x < 40) {
      F('arrived', true);
      run(async () => { await say('maya', L.arrive, { face: 'surprised' }); });
      return;
    }
    if (!foot) return;
    // voices that carry (they hint, never point)
    if (F('arrived') && !F('map') && !F('kyCalled') && near(MK.yaung, 16)) { F('kyCalled', true); story.bark('yaung', L.kyCall, 3600); }
    if (!F('ncMet') && near(MK.naychi, 7) && t > ncBarkT) { ncBarkT = t + 25; story.bark('naychi', L.ncCall, 2200); }
    if (!F('yuMet') && !F('yuCalled') && near({ x: MK.sundries.x, z: MK.sundries.z + MK.sundries.d / 2 }, 3.2)) { F('yuCalled', true); story.bark('yuyu', L.yuCall, 2600); }
    // Ko Phyo calls out of the tea-shop door at each gift carried across the square
    const sq = MK.square;
    if (m.x > sq.minX && m.x < sq.maxX && m.z > sq.minZ && m.z < sq.maxZ) {
      for (const g of ['books', 'bowls', 'rice']) {
        if ((story.has(`gift:${g}`) || (g === 'books' && crateHeld)) && !F(`give.${g}`) && !F(`sneer.${g}`)) { F(`sneer.${g}`, true); story.bark('kophyo', L[`kp${g[0].toUpperCase()}${g.slice(1)}`][0], 4200); break; }
      }
    }
    // the kite, seen with her own eyes
    if (!F('rumour.kite') && !F('kite1') && Math.abs(m.x - flag14X) < 9 && m.z > 289 && m.z < 306) { check('kite'); story.bark('maya', L.kiteSeen[0], 3200); }
    // walking into the painted gap: it ends in crates
    if (!F('rumour.shortcut') && Math.hypot(m.x - MK.crates.x, m.z - (MK.crates.z - 1.1)) < 1.0) { run(cratesCheck); return; }
    // the books come out of the car at the Quarter school: she carries them in herself
    if (save.cargo?.id === 'gift:books' && !crateHeld && !F('give.books')) {
      const school = story.doors?.DOORS?.classroom || { x: -11.5, z: 88.6 };
      const cp = game.car.root.position;
      const atSchool = near(school, 16) || near(MK.porch, 10);
      if (atSchool && Math.hypot(cp.x - m.x, cp.z - m.z) < 30) {
        const p = story.cargo.unload();
        if (p) p.removeFromParent();
        try { cargoProp?.dispose(); } catch { /* gone */ }
        cargoProp = null;
        carryCrate();
        story.bark('maya', L.carryOut[0], 3000);
      }
    }
    // the pump: on while he waits there and she is close
    const kp = inPerson('kophyo');
    if (kp && F('kpTalk') && n('pails') < 3) {
      const close = near(MK.pump, 4.5);
      if (close && !pumpState.on && !F('beatShown')) {
        F('beatShown', true);
        run(() => say('kophyo', L.kpBeat, { face: 'think' }));
      }
      pumpState.on = close;
    } else pumpState.on = false;
    // Ma Wint War's evening line at home
    if ((F('ch6Done') || F('ch7Done')) && !F('wwEve') && inPerson('wintwar') && near(inPerson('wintwar').p.root.position, 3.0)) {
      story.talkTo(inPerson('wintwar'));
      return;
    }
    // the night page: back at the Writing Room door once both chapters are done
    if (F('ch6Done') && F('ch7Done') && !save.flags['d4.done']) {
      const nearDoor = foot ? Math.hypot(m.x - ab.x, m.z - ab.z) < 1.8 : Math.hypot(game.car.root.position.x - ab.x, game.car.root.position.z - (ab.z + 3)) < 2.2;
      if (nearDoor) night();
    }
  }

  // =============================================================================================
  // Test hooks: window.__day4
  // =============================================================================================
  const BEATS = ['morning', 'arrived', 'map', 'ncTold', 'gifts', 'delivered', 'kpTalk', 'pails', 'brew', 'ch6', 'thMet', 'kite1', 'looked', 'thTalk', 'three', 'kite2', 'wished', 'planes', 'ch7', 'board'];
  const SKIP = {
    morning: () => { F('morning', true); story.companions.add('seedling'); story.companions.add('firefly'); },
    arrived: () => F('arrived', true),
    map: () => { if (!F('map')) { story.give('paintedmap', 1, { quiet: true }); F('map', true); story.paint.add({ id: 'shortcut', rumour: 'shortcut', pts: [[MK.gap.x, 272], [MK.gap.x, 281], [22.6, 296], [MK.pump.x, MK.teaShop.z + MK.teaShop.d / 2 + 0.6]], at: { x: MK.gap.x, z: MK.gap.z } }); } },
    ncTold: () => { F('ncMet', true); F('ncTold', true); F('ncWay', 0); },
    gifts: () => { for (const g of ['books', 'bowls', 'rice']) if (!F(`got.${g}`)) { F(`got.${g}`, true); story.give(`gift:${g}`, 1, { quiet: true }); } F('yuMet', true); },
    delivered: () => { for (const g of ['books', 'bowls', 'rice']) { story.take(`gift:${g}`, 1, { quiet: true }); F(`give.${g}`, true); } story.cargo.unload(); market.setBowls(true); for (const c of ['theirs', 'glad', 'nobody']) card(c); F('delivered', true); },
    kpTalk: () => { F('kpTalk', true); F('dttMet', true); card('fillfirst'); F('beatSaid', true); },
    pails: () => { F('pails', 3); F('dttGave', true); },
    brew: () => F('brew', true),
    ch6: () => { F('poured', true); F('ch6Done', true); if (!F('teapot')) { story.give('teapot', 1, { quiet: true }); F('teapot', true); } },
    thMet: () => { F('thMet', true); if (!F('pwMet')) story.give('thanaka', 3, { quiet: true }); F('pwMet', true); },
    kite1: () => { F('kite1', true); market.kite.height(0.04, true); },
    looked: () => { for (const k of ['string', 'flag', 'planes', 'post']) F(`look.${k}`, true); for (const c of ['notwind', 'ownhands', 'ownpost', 'wishwell']) card(c); F('thLooked', true); },
    thTalk: () => F('thTalk', true),
    three: () => F('three', true),
    kite2: () => { F('kite2', true); market.kite.tie('post'); market.kite.height(0.72, true); },
    wished: () => { F('wished', true); F('plane.phoophoo', true); },
    planes: () => { F('plane.luaye', true); F('plane.pyone', true); },
    ch7: () => { F('ch7Done', true); if (!story.has('planeletter')) story.give('planeletter', 1, { quiet: true }); story.lookalikeGone('holdtight'); },
    board: () => { F('wwEve', true); F('board', true); F('boardReply', '0:0'); },
  };
  const PLACES = {
    home: { x: ab.x + 0.6, z: ab.z + 2.2 }, crease: { x: 7, z: 262 }, stamp: { x: 18, z: 272.2 }, gap: { x: 21.5, z: 273.2 },
    counter: { x: 21.2, z: 299.2 }, square: { x: 24, z: 315.6 }, pump: { x: 23.1, z: 318.8 }, rice: { x: 29, z: 332.2 },
    dogs: { x: 29.9, z: 283 }, school: { x: -11.5, z: 91 }, porch: { x: 8.4, z: 67 },
  };
  window.__day4 = {
    BEATS, PLACES, market,
    lastPour: () => lastPour,
    flags: () => Object.fromEntries(Object.entries(save.flags).filter(([k]) => k.startsWith('d4.') || k.startsWith('rumour.') || k.startsWith('talk.d4'))),
    /** Marks every beat up to and including `beat` as done, then re-places the street. */
    skipTo(beat) {
      const k = BEATS.indexOf(beat);
      if (k < 0) return BEATS;
      for (let i = 0; i <= k; i++) SKIP[BEATS[i]]();
      story.persist();
      syncOutdoor();
      return this.flags();
    },
    /** Puts Maya (on foot) at a named place. */
    async go(place) {
      const p = PLACES[place] || place;
      if (story.inRoom) await story.exit({ instant: true });
      if (!story.foot.active) await story.foot.toFoot();
      story.openWorld?.jump(p.x, p.z, Math.PI);
      return me();
    },
    enter: (id) => story.enter(id),
    talk: (id) => { const e = inPerson(id); return e ? story.talkTo(e) : null; },
    station: (id) => station(id),
    spot: (id) => { const s = SPOTS.find((q) => q.id === id); return s && s.when() ? run(s.go) : false; },
    beat,
    pump: () => ({ ...pumpState }),
    state: () => ({ inRoom: story.inRoom, carrying: !!crateHeld, cargo: save.cargo, people: [...story.people.keys()], seated: [...seated.keys()], t: t0 }),
  };

  injectStyle();

  return {
    talk,
    roomCast,
    enterRoom,
    leaveRoom,
    station,
    /** The page turns in place: this page's set, people, hooks and wrappers go away. */
    dispose() {
      dropCrate();
      if (save.cargo?.id === 'gift:books') { const p = story.cargo.unload(); p?.removeFromParent(); }
      try { cargoProp?.dispose(); } catch { /* gone */ }
      for (const w of walkons.slice()) removeWalkon(w);
      market.dispose();
      porch.dispose();
      board.dispose();
      evTeacher.root.removeFromParent();
      evTeacher.dispose();
      for (const id of OUT_IDS) story.remove(id);
      for (const id of ['tintin', 'luaye', 'yi', 'yuyu']) story.remove(id);
      const k = story.tapHooks.indexOf(tapHook);
      if (k >= 0) story.tapHooks.splice(k, 1);
      if (ow && lightDesk0) ow.lightDesk = lightDesk0;
      story.blockedTravel = oldBlocked;
      story.paint.onRub = oldOnRub;
      story.steam('kophyo', null);
      document.getElementById('d4-style')?.remove();
      if (window.__day4) window.__day4 = null;
    },
    /** The region (regions/market.js PEOPLE) leaves today's townspeople to this page. */
    owns: (id) => OUT_IDS.includes(id),
    async start() {
      if (!F('morning')) {
        // (Day 3's page is written inside the sorting room: the morning post is outdoors, at her door)
        if (story.inRoom) await story.exit({ instant: true });
        if (!story.foot.active) await story.foot.toFoot();
        story.refreshHud?.();
        syncOutdoor();
        // Ma Wint War walks over (morningPost brings her the last steps)
        await morning();
      }
    },
    update,
  };
}

function injectStyle() {
  if (document.getElementById('d4-style')) return;
  const s = document.createElement('style');
  s.id = 'd4-style';
  s.textContent = `
  .d4-look { position: absolute; inset: 0; z-index: 46; display: flex; align-items: center; justify-content: center; background: rgba(42,33,24,.28); }
  .d4-look .card { width: min(84vw, 340px); background: #FFFDF8; border-radius: 6px; padding: 18px 18px 14px; transform: rotate(-.8deg);
    font: 15.5px/1.85 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; box-shadow: 0 10px 26px rgba(42,33,24,.32);
    background-image: repeating-linear-gradient(transparent 0 28px, #E4DCC8 28px 29px); }
  .d4-look small { display: block; font-weight: 700; font-size: 12px; }
  .d4-look .h { color: #8A847C; } .d4-look .s { color: #A47A2C; opacity: 0; transition: opacity .5s; }
  .d4-look .pencil { margin: 2px 0 10px; color: #77726B; font-style: italic; transition: color .5s; }
  .d4-look.on .pencil { color: #A9A39A; text-decoration: line-through; }
  .d4-look .gold { margin: 2px 0 0; color: #8C6A28; font-weight: 600; opacity: 0; transform: translateY(6px); transition: opacity .6s, transform .6s; }
  .d4-look.on .gold, .d4-look.on .s { opacity: 1; transform: none; }
  `;
  document.head.appendChild(s);
}
