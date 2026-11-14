// Day 7 (Exercise-Book Quarter, then the Fold) — chapter 4 ပြောင်းလဲခြင်း (Change) in full, and chapter 11
// သင်ခန်းစာတိုများ (Short Lessons) Act 2: slates 6-10. Part 1 is stamped tonight; the bridge opens.
//
// Lessons (day7-spec 5, 6, 15; INDEX 14):
//   ch 4 (p31-38) four changes: learn by meaning, not "see this, insert that" (the worth is in you, not the
//     tool); search until you see your aim, then don't be lazy; last year is gone (no boasting), next year is
//     not yet (stay humble), work on tonight, never hold yourself apart; each leads only on their own stage and
//     "nobody is the lead" is a relief; live each step aware (the brimming bowl, the clock that never waits).
//   ch 11 (p61-64) the only one you can steer is yourself: (6) afraid is allowed, turning back is not, fear met
//     with kindness; (7) goodwill in whatever you do; (8) don't cheer a wrong on; (9) give expecting nothing,
//     what seems lasting changes; (10) steer no one, the key is in your own hand. Nay Chi does each with her
//     own hands; Maya's hand stays off her board. At the end she asks "what do I do tomorrow?" and Maya
//     answers (Act 1's mistake, shown and not judged: Day 8 reads d7.ncPromise).
// Invented: Ye Yint (16) wrote the farewell play and cast himself as "Maya", the rescuer, in every scene.
//
// Where (no markers, no arrows, no glowing doors: people say where, and the places can be seen):
//   morning post at the Writing Room door (home) -> the school classroom (room `classroom`: rehearsal, the
//   prank and slate 8, W, the back row, the backdrop, sort + match, Ye Yint's talk) -> the stage (slate 7's
//   knot) -> the honesty snack shop (room `snackshop`: slate 9) -> the changed street -> the bench carry from
//   the school steps to the stage -> dusk: the brimming bowl and the play -> south through the Envelope Market
//   (Daw Tin Tin's `teashop` when its door exists) -> the Fold: desk, slate 6 on the rope footbridge, slate 10
//   and the ordering in the bridge hut (room `bridgehut`, local stand-in: day7-fold.js), the keys, the boom,
//   "what do I do tomorrow?" over tea in the hut -> home: the night page (stamps 4 and 11, Part 1 seal).
//
// Test hooks: window.__day7 = { F, beats, skipTo(beat), state(), go(place), sync() } (see the bottom).
// Burmese lines are drafts for Maya to proofread (all in day7-lines.js).
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { trace } from './acts/trace2.js';
import { sort } from './acts/sort.js';
import { match } from './acts/match.js';
import { steady } from './acts/steady.js';
import { stageClock, frontCurtain, backdrop, propBasket, costumeQuill, seatCard, programmePoster, schoolBench, benchStack, brimBowl } from './props3.js';
import { beanPlanter, potterWheel, chalkSlate } from './props2.js';
import { nightPage, morningPost, showLetter, showSlip } from './post.js';
import { TALK_D7_YEYINT } from './talks/day7.js';
import { L, NC_ORDER } from './day7-lines.js';
import { buildFold, FOLD, HUT_ROOM } from './day7-fold.js';
import { LOOKS, extra, fakePerson, removeFake, sayAs, moveAlong, keepOuts, lookLabels, pairShot, mergeStatic } from './day7-kit.js';
import { SPOTS as MR_SPOTS } from './world/regions/market.js';
import { useLive } from './world/regions/junction.js';
import { DOORS, registerDoors } from './doors.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PI = Math.PI;

// ---- places in the Exercise-Book Quarter (world metres, +Z south; regions/quarter.js)
const Q = {
  schoolDoor: { x: -11.5, z: 88.6 },
  stack: { x: -15.1, z: 88.85 },
  yyStack: { x: -13.5, z: 89.55, h: -PI / 2 },
  stepsSpots: [{ x: -9.6, z: 89.7, h: PI }, { x: -8.6, z: 89.9, h: PI }, { x: -7.6, z: 89.7, h: PI }],
  stage: { x: -13, z: 137.8 },
  square: { x: -13, z: 143.4 },
  clock: { x: -19.4, z: 141.15 },
  curtain: { x: -13, z: 140.55 },
  mnCurtain: { x: -7.3, z: 141.7, h: PI },
  ncStage: { x: -6.3, z: 142.5, h: -PI / 2 - 0.4 },
  benches: [{ x: -13, z: 141.45 }, { x: -16.2, z: 142.9 }, { x: -9.8, z: 142.9 }, { x: -6.0, z: 143.5 }],
  seatFront: { x: -13, z: 141.95, h: PI },
  seatBack: { x: -6.0, z: 144.05, h: PI },
  sq: { // where everyone waits on the square once the benches are down
    hninwai: { x: -11.2, z: 144.35, h: PI }, yeyint: { x: -14.6, z: 144.3, h: PI }, toetoe: { x: -16.9, z: 144.35, h: PI + 0.3 },
    micho: { x: -18.4, z: 143.9, h: PI + 0.4 }, sunwe: { x: -9.0, z: 144.4, h: PI - 0.3 }, dawohn: { x: -16.2, z: 143.4, h: PI },
  },
  beans: { x: -4, z: 93.0 },
  chartLine: { x: -11.25, z: 92.72 },
  noticeBoard: { x: -12.5, z: 92.6 },
  wheel: { x: 43.0, z: 115.7 },
  potterYard: { x: 48.2, z: 120.4, h: 0 },
  snackDoor: { x: 15, z: 59.3 },
  ncShopOut: { x: 15.4, z: 61.4, h: 0 },
};
// the old way to school (6.2): where Nay Chi stops, what Maya looks at
const STOPS = [
  { id: 'beans', nc: { x: -1.8, z: 91.3, h: -PI / 2 - 0.5 }, look: { x: -4, y: 0.8, z: 93.0 }, path: [{ x: 15, z: 62 }, { x: 4, z: 62 }, { x: 4, z: 90.2 }, { x: -1.8, z: 90.4 }, { x: -1.8, z: 91.3 }] },
  { id: 'chart', nc: { x: -10.4, z: 91.1, h: -PI / 2 - 0.4 }, look: { x: -12.0, y: 1.45, z: 92.6 }, path: [{ x: -1.8, z: 90.4 }, { x: -10.4, z: 90.4 }, { x: -10.4, z: 91.1 }] },
  { id: 'wheel', nc: { x: 45.2, z: 117.3, h: -PI / 2 - 0.6 }, look: { x: 43.0, y: 1.0, z: 115.7 }, path: [{ x: -10.4, z: 90.2 }, { x: 4, z: 90.2 }, { x: 4, z: 118 }, { x: 45.2, z: 118 }, { x: 45.2, z: 117.3 }] },
];
const CARRY_ROUTE = [{ x: -27, z: 90 }, { x: -27, z: 146 }];
const MARKET = { kophyo: { x: 11.6, z: 285.5, h: -PI / 2 }, thiri: MR_SPOTS?.thiri || { x: 15.4, z: 295.95, h: 0 } }; // (Thiri at her own table, not in the post-room door)
const DAY_PEOPLE = ['wintwar', 'hninwai', 'yeyint', 'toetoe', 'micho', 'sunwe', 'maungnge', 'dawohn', 'naychi', 'kophyo', 'thiri'];

// the order beats play in (skipTo sets every flag before the named beat)
const BEATS = [
  ['morning', ['morning', 'progSeen', 'heard.prize']],
  ['arrived', ['arrived']],
  ['meaning', ['prankSeen', 'meaning', 'slate8', 'prank', 'ncMet', 'hw1']],
  ['heading', ['look.backdrop', 'look.roads', 'look.ending', 'look.list', 'heading']],
  ['painted', ['painted']],
  ['sorted', ['sorted']],
  ['owners', ['owners']],
  ['yyTalk', ['yyTalk', 'still']],
  ['knot', ['slate7', 'knot']],
  ['gave', ['gave', 'oldWay']],
  ['changed', ['see.beans', 'see.chart', 'see.wheel', 'changed', 'slate9']],
  ['benches', ['carryStarted', 'benches']],
  ['bowl', ['bowl']],
  ['played', ['seat', 'played', 'ch4Done']],
  ['fold', ['fold']],
  ['slate6', ['slate6', 'rumour.rope']],
  ['order', ['toHut', 'order', 'slate10']],
  ['keys', ['hung', 'keys', 'bridge', 'teaTime']],
  ['ch11Done', ['ch11Done']],
  ['night', []],
];

export { SLEPT7 } from './day8-lines.js'; // tonight's hosts' lines (Day 8 imports them from here when present)

export async function create(story) {
  const { game, dialog: D, save } = story;
  const F = (k, v) => story.flag(`d7.${k}`, v);
  const door = (id) => game.world.places.find((p) => p.id === id)?.door || { x: 0, z: 7 };
  const scene = game.world.scene;
  const v3 = new THREE.Vector3();
  const objs = []; // { root, dispose } this page made outdoors
  const keep = keepOuts(story);
  const scripted = new Set(); // people a script is moving (sync leaves them alone)
  const met = new Set(save.flags['d7.metList'] || []);
  const meet = (id) => { if (!met.has(id)) { met.add(id); save.flags['d7.metList'] = [...met]; story.persist(); } };
  const rot = {}; // line rotation per person
  const next = (id, list) => { const i = (rot[id] = ((rot[id] ?? -1) + 1)) % list.length; return [list[i], i]; };
  let disposed = false;

  const own = (o) => { objs.push(o); return o; };
  const put = (o, x, z, ry = 0, y = 0) => { o.root.position.set(x, y, z); o.root.rotation.y = ry; scene.add(o.root); return own(o); };
  const giveProof = (id, line) => {
    save.proofs = save.proofs || {};
    save.proofs[id] = line;
    if (!story.has(`proof:${id}`)) story.give(`proof:${id}`);
    story.persist();
  };

  // =============================================================================================
  // props (outdoors). The day dresses the stage, the street sights from Days 2-3 and the Fold itself.
  // =============================================================================================
  // the stage: the clock on its own post at the left, the programme under it, the front curtain, slate 7
  // up on the curtain beam, the bench stack on the school steps; later the benches, backdrop, basket, bowl
  const clock = put(stageClock({ post: true, height: 2.3 }), Q.clock.x, Q.clock.z, 0);
  const poster = put(programmePoster({ lang: document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'my', margin: true }), Q.clock.x + 0.02, Q.clock.z + 0.12, 0, 1.3);
  poster.root.scale.setScalar(0.62);
  const curtain = put(frontCurtain(10.4, { h: 3 }), Q.curtain.x, Q.curtain.z, 0, 1.0);
  const slate7 = put(chalkSlate({ w: 0.42, h: 0.3, text: '' }), -11.2, 140.72, 0, 3.75);
  const stack = { cur: null, n: -1 };
  const setStack = (n) => {
    if (stack.n === n) return;
    if (stack.cur) { stack.cur.dispose(); objs.splice(objs.indexOf(stack.cur), 1); stack.cur = null; }
    stack.n = n;
    if (n > 0) stack.cur = put(n === 1 ? schoolBench() : benchStack(n), Q.stack.x, Q.stack.z, 0);
  };
  const stageBenches = Q.benches.map((b) => { const o = put(schoolBench(), b.x, b.z, 0); o.root.visible = false; return o; });
  const card = put(seatCard(tr(L.seatCard)), Q.benches[0].x, Q.benches[0].z - 0.02, 0, 0.45);
  const stageDrop = put(backdrop({ w: 9, h: 2.9, painted: 1 }), Q.stage.x, 135.35, 0, 1.0);
  const stageBasket = put(propBasket({ items: ['ribbon', 'sheet', 'badge', 'timetable', 'wicks', 'rope'] }), -17.4, 139.4, 0.3, 1.0);
  const costume = put(costumeQuill(), -7.75, 140.82, 0, 1.55);
  const bowl = put(brimBowl(1), -10.4, 138.9, 0, 1.0);
  const stageBeans = put(beanPlanter('growing'), -9.6, 138.4, 0, 1.0);
  // the changed street (Days 2-3 sights, set again for today): Toe Toe's box in the sun, his line by the
  // notice board, Mi Cho's wheel with «မရသေးဘူး» in the potter's yard
  const streetBeans = put(beanPlanter('growing'), Q.beans.x, Q.beans.z, 0);
  const lineSign = (() => {
    const cv = document.createElement('canvas'); cv.width = 220; cv.height = 150;
    const g = cv.getContext('2d');
    const draw = () => {
      g.fillStyle = '#FBF8EE'; g.fillRect(0, 0, 220, 150); g.strokeStyle = '#C9B48A'; g.lineWidth = 4; g.strokeRect(2, 2, 216, 146);
      g.fillStyle = '#2F4F3A'; g.font = '600 26px "Noto Sans Myanmar", sans-serif'; g.textAlign = 'center';
      g.fillText('မရသေးဘူး၊', 110, 58); g.fillText('ကြိုးစားမယ်။', 110, 98); g.font = '500 18px "Noto Sans Myanmar", sans-serif'; g.fillText('— တိုးတိုး', 120, 134); // DRAFT(my)
    };
    draw();
    document.fonts?.ready?.then(() => { draw(); tex.needsUpdate = true; });
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.3), new THREE.MeshBasicMaterial({ map: tex }));
    const root = new THREE.Group(); root.add(m);
    return { root, dispose() { tex.dispose(); m.geometry.dispose(); m.material.dispose(); root.removeFromParent(); } };
  })();
  put(lineSign, Q.chartLine.x, Q.chartLine.z, 0, 1.35);
  const wheel = put(potterWheel({ clay: 0, chalk: 'မရသေးဘူး' }), Q.wheel.x, Q.wheel.z, 0.5); // DRAFT(my)
  // the still pieces merged by material (the phone budget: the stage cluster cost ~38 draw calls piece by
  // piece). The clock (it ticks), the curtain (it opens), the seat card and the bench stack stay their own.
  const merges = [];
  const merge = (roots, name) => { try { const m = mergeStatic(scene, roots, name); own(m); merges.push(m); return m; } catch (err) { console.warn('day7 merge', name, err); return null; } };
  const stageSet = merge([...stageBenches.map((b) => b.root), stageDrop.root, stageBasket.root, bowl.root, stageBeans.root], 'd7StageSet');
  merge([costume.root], 'd7Costume');
  // the three street sights only draw when Maya is near them (from the stage the beans box, 50 m up the
  // avenue, still cost 4 draw calls)
  const farProps = [[merge([streetBeans.root], 'd7StreetBeans')?.root, Q.beans], [merge([wheel.root], 'd7Wheel')?.root, Q.wheel], [lineSign.root, Q.chartLine]];
  let farT = 0;
  // the phone budget: from the stage the camera looks 50 m up the avenue to the school, where the carry
  // line (people, the prop basket, a bench) cost ~30 draw calls as specks in the haze. Past FAR metres
  // from Maya the day's own things and the people stop drawing (only those this page hid come back).
  const FAR = 42;
  const farHid = new Set();
  function farCull(mw) {
    for (const [o, q] of farProps) if (o) o.visible = Math.hypot(mw.x - q.x, mw.z - q.z) < 34;
    const roots = [];
    for (const p of carryProps) if (p?.root) roots.push([p.root, true]);
    for (const x of carryExtras) if (x?.p?.root) roots.push([x.p.root, true]);
    if (stack.cur?.root) roots.push([stack.cur.root, true]);
    for (const [id, e] of story.people) {
      if (!e?.p?.root) continue;
      // (whoever she talks to or carries with always draws)
      if (e === story.talkWith || (story.carrying && id === 'yeyint')) { if (farHid.delete(e.p.root)) e.p.root.visible = true; continue; }
      roots.push([e.p.root, false]);
    }
    for (const [r] of roots) {
      const far = Math.hypot(r.position.x - mw.x, r.position.z - mw.z) > FAR;
      if (far && r.visible) { r.visible = false; farHid.add(r); }
      else if (!far && farHid.has(r)) { r.visible = true; farHid.delete(r); }
    }
    for (const r of farHid) if (!r.parent) farHid.delete(r);
  }
  function farRestore() { for (const r of farHid) r.visible = true; farHid.clear(); }
  keep.add([
    { type: 'box', minX: Q.clock.x - 0.18, maxX: Q.clock.x + 0.18, minZ: Q.clock.z - 0.25, maxZ: Q.clock.z + 0.15 },
    { type: 'box', minX: Q.stack.x - 0.85, maxX: Q.stack.x + 0.85, minZ: Q.stack.z - 0.3, maxZ: Q.stack.z + 0.3 },
    { type: 'circle', x: Q.beans.x, z: Q.beans.z, r: 0.5 },
    { type: 'circle', x: Q.wheel.x, z: Q.wheel.z, r: 0.55 },
  ]);
  const benchObs = Q.benches.map((b) => ({ type: 'box', minX: b.x - 0.82, maxX: b.x + 0.82, minZ: b.z - 0.22, maxZ: b.z + 0.22 }));
  let benchObsOn = false;

  // the Fold: board, rope footbridge, pier, lanterns (day7-fold.js). The junction region stands the hut and
  // the water pot (its door is registered before any day runs); the day's live board, rope and pier take
  // the place of the region's static copies while this page is open (useLive; keep-outs stay the region's).
  const regionHut = !!DOORS.bridgehut;
  const fold = buildFold(scene, { keys: 2, hut: !regionHut, jar: !regionHut });
  objs.push({ root: null, dispose: () => fold.dispose() });
  const LIVE_TWINS = ['bridgeBoard', 'ropeFootbridge', 'middlePier'];
  try { useLive(story.openWorld, LIVE_TWINS, true); } catch (err) { console.warn('day7 useLive', err); }
  keep.add(fold.obstacles);
  let farBlockOn = false;
  // the bridge hut: the room and its door (local until rooms/ and the junction region carry them)
  let ownHutDoor = false;
  try {
    story.doors?.registerRooms({ bridgehut: HUT_ROOM });
    if (!DOORS.bridgehut) { registerDoors([{ room: 'bridgehut', x: FOLD.hutDoor.x, z: FOLD.hutDoor.z, facing: 0, region: 'junction', r: 0.8 }]); ownHutDoor = true; }
  } catch (err) { console.error('day7 hut', err); }
  // two bridge hands (walk-ons the player can talk to)
  const bhA = fakePerson(story, 'd7handA', LOOKS.handA, L.bhName, FOLD.handA);
  const bhB = fakePerson(story, 'd7handB', LOOKS.handB, L.bhName, FOLD.handB);

  // the stage clock: one turn of the minute hand per 3 real minutes; scripted at dusk (၆ at the play)
  let clockH = 9.0, clockRun = true;
  const setClock = (h) => { clockH = h; const hh = Math.floor(h), mm = Math.round((h - hh) * 60); call(clock, 'setTime', hh % 12 || 12, mm); };

  // ---- dressing that follows the day's flags
  function syncProps() {
    const benches = !!F('benches');
    setStack(benches ? 0 : !F('carryStarted') ? 4 : story.carrying ? 0 : 1);
    for (const b of stageBenches) b.root.visible = benches;
    card.root.visible = benches && F('seat') == null;
    stageDrop.root.visible = benches;
    stageBasket.root.visible = benches;
    bowl.root.visible = benches;
    stageBeans.root.visible = benches;
    if (stageSet) stageSet.root.visible = benches;
    costume.root.visible = true;
    call(curtain, 'setKnot', F('knot') ? 'bow' : 'hard');
    call(curtain, 'setOpen', F('played') ? 1 : 0);
    slate7.root.visible = !F('knot');
    if (benches && !benchObsOn) { keep.add(benchObs); benchObsOn = true; }
    // the Fold
    const b = fold.board;
    if (F('hung')) NC_ORDER.forEach((k, i) => b.setSlate(i, { text: L.slates[k].my, faint: true }));
    else {
      for (let i = 0; i < 9; i++) b.setSlate(i, null);
      b.setSlate(9, F('toHut') ? null : { text: L.slates[10].my, faint: true });
    }
    b.setKeys(F('keys') ? 0 : 2);
    b.setLit(!!F('bridge'));
    fold.slate6.root.visible = !F('slate6');
    fold.lantern.root.visible = !!F('bridge');
    fold.hut.setLit(F('bridge') ? 1 : 0);
    if (F('bridge') && !farBlockOn) { keep.add([{ type: 'box', ...FOLD.farBlock }]); farBlockOn = true; }
  }

  // =============================================================================================
  // people: who stands where, by how far the day has gone (nobody is inside and outside at once)
  // =============================================================================================
  const ab = door('about');
  function ncState() {
    if (!F('slate8')) return 'classroom';
    if (!F('knot')) return 'stage';
    if (!F('gave')) return 'snack';
    if (!F('changed')) return 'street';
    return 'fold';
  }
  function plan() {
    const P = {};
    P.wintwar = { x: ab.x + 2.6, z: ab.z + 1.2, h: -PI / 2 };
    if (F('benches')) {
      Object.assign(P, Q.sq);
      P.maungnge = Q.mnCurtain;
    } else {
      P.dawohn = Q.potterYard;
      if (F('meaning')) P.maungnge = Q.mnCurtain;
      if (F('owners')) { P.toetoe = Q.stepsSpots[0]; P.micho = Q.stepsSpots[1]; P.sunwe = Q.stepsSpots[2]; }
      if (F('yyTalk')) { P.yeyint = Q.yyStack; P.hninwai = { x: -10.6, z: 90.0, h: PI }; }
      if (F('carryStarted')) { Object.assign(P, { toetoe: Q.sq.toetoe, micho: Q.sq.micho, sunwe: Q.sq.sunwe }); P.maungnge = Q.mnCurtain; }
    }
    switch (ncState()) {
      case 'stage': P.naychi = Q.ncStage; break;
      case 'street': P.naychi = F('oldWay') ? STOPS[Math.min(2, seenCount())].nc : Q.ncShopOut; break;
      case 'fold': P.naychi = { x: FOLD.boardStand.x, z: FOLD.boardStand.z, h: FOLD.boardStand.h }; break;
      default: break;
    }
    if (!DOORS.teashop) P.kophyo = MARKET.kophyo;
    P.thiri = MARKET.thiri;
    return P;
  }
  const seenCount = () => STOPS.filter((s) => F(`see.${s.id}`)).length;
  function placeAt(e, w) {
    e.walking = null;
    e.p.root.position.set(w.x, w.y || 0, w.z);
    e.p.root.rotation.y = w.h || 0;
    e.home = { x: w.x, z: w.z, h: w.h || 0 };
    e.ob.x = w.x; e.ob.z = w.z;
  }
  function sync() {
    if (disposed || story.inRoom || story.talking || game.busy) return;
    const P = plan();
    for (const id of DAY_PEOPLE) {
      if (scripted.has(id)) continue;
      const want = P[id];
      let e = story.people.get(id);
      if (!want) { if (e && !e.fake && !e.ctl && !e.walking) story.remove(id); continue; }
      if (!e) { e = story.spawn(id, { x: want.x, z: want.z, heading: want.h }); if (!e) continue; e.job = null; }
      if (e.ctl || e.walking) continue;
      e.job = null; // (the region's daily round gives way to today's script)
      if (Math.hypot(e.home.x - want.x, e.home.z - want.z) > 0.8 || Math.hypot(e.p.root.position.x - want.x, e.p.root.position.z - want.z) > 3) placeAt(e, want);
    }
  }

  // =============================================================================================
  // running scenes: beat(id, fn) = a two-shot with that person (story.talkTo), runScene(fn) = no person
  // =============================================================================================
  let beatBusy = false;
  async function beat(id, fn) {
    if (story.talking || game.busy || beatBusy || disposed) return false;
    const e = story.people.get(id);
    if (!e) return runScene(fn);
    beatBusy = true;
    e.onTalk = async () => { try { await fn(e); } catch (err) { console.error('day7 beat', id, err); } };
    try { await story.talkTo(e); } finally { e.onTalk = null; beatBusy = false; }
    return true;
  }
  async function runScene(fn) {
    if (story.talking || game.busy || beatBusy || disposed) return false;
    beatBusy = true;
    story.talking = true;
    game.ui.cinema(true);
    try { await fn(); } catch (err) { console.error('day7 scene', err); } finally {
      story.talking = false;
      beatBusy = false;
      game.ui.cinema(false);
      game.rig.release();
    }
    return true;
  }
  const after = (fn, ms = 60) => setTimeout(() => { if (!disposed) fn(); }, ms);
  // a close, low two-shot of Maya and `id` (day7-kit pairShot): outdoors from the side where no lamp post,
  // stall or parked jeep stands in front of them; in a room from the cut-away side, low (never the high
  // whole-room angle). Called at the start of a scene and again after an act hands the camera back.
  function frameWith(id, o = {}) {
    try {
      const e = story.people.get(id);
      if (!e) return;
      const m = game.maya.root.position, q = e.p.root.position;
      if (Math.hypot(m.x - q.x, m.z - q.z) > 7) return; // (too far apart: keep the story's own shot)
      // in a room: from the front corner on the room's middle side, three-quarter on, so the pair overlap a
      // little in depth and the camera comes in close (the floor fills the bottom, not the paper past the lip)
      if (story.inRoom) pairShot(game, m, q, { az: o.az ?? ((m.x + q.x) / 2 < 0 ? 0.72 : -0.72), h: o.h ?? 1.7, look: 0.72, test: false, dur: o.dur ?? 0.6 });
      else pairShot(game, m, q, { h: o.h ?? 1.95, dur: o.dur ?? 0.7 });
    } catch (err) { console.warn('day7 frame', id, err); }
  }
  // the bridge hut: Maya steps up to Nay Chi at the table's end (in front of it, a little over a metre off)
  // and the camera comes in low from the front-left, both faces three-quarter on. (From the doorway the
  // pair lined up with the lens and Maya's hair block hid Nay Chi.)
  function hutPair() {
    try {
      const e = story.people.get('naychi');
      if (!e || !story.inRoom) return;
      const q = e.p.root.position;
      const x = q.x + 1.12, z = Math.max(q.z + 0.68, 0.1); // (the table's front edge: z -0.15)
      const az = -0.3, cheat = (h) => { const d = Math.atan2(Math.sin(az - h), Math.cos(az - h)); return h + d * 0.4; };
      const h = cheat(Math.atan2(q.x - x, q.z - z));
      game.walker?.teleport?.(x, z, h);
      game.maya.root.position.set(x, 0, z); game.maya.root.rotation.set(0, h, 0);
      e.p.root.rotation.y = cheat(Math.atan2(x - q.x, z - q.z));
      pairShot(game, game.maya.root.position, q, { az, h: 1.6, look: 0.75, test: false, dur: 0.5 });
    } catch (err) { console.warn('day7 hut pair', err); }
  }

  // =============================================================================================
  // the morning (4)
  // =============================================================================================
  async function morning() {
    if (!F('morning')) {
      await morningPost(story, {
        day: 7, ww: L.ww1, slept: L.slept6, after: L.ww2,
        letters: [{ from: 'kothiha', text: L.thNote }], question: L.ttQ,
        companions: story.companions.has('earth') ? [] : ['earth'], liftCaption: { earth: L.earthCap }, lift: { earth: L.earthMaya },
      });
      F('morning', true);
    }
    if (!F('progSeen')) {
      const was = story.talking;
      story.talking = true;
      game.ui.cinema(true);
      try {
        await D.say('wintwar', L.ww3, { face: 'smile' });
        await showLetter(game, L.programme, { sign: L.programmeSign });
        await D.say('maya', L.mayaProg, { face: 'surprised' });
        await D.say('wintwar', L.ww4, { face: 'smile' });
        F('progSeen', true);
        F('heard.prize', true); // the pencilled margin: a rumour heard, not seen
      } finally { game.ui.cinema(false); story.talking = was; }
    }
  }

  // =============================================================================================
  // chapter 4 in the classroom (5.1-5.7)
  // =============================================================================================
  let roomExtras = [];
  async function rehearsal(e) {
    const kids = roomExtras.filter((x) => x.kid);
    await D.say('yeyint', L.yy1, { face: 'happy', emote: 'cheer' });
    await D.say('toetoe', L.ttStage, { face: 'sad' });
    await sayAs(story, 'chorus', L.kidsName, L.kids, { face: 'happy' });
    await D.say('naychi', L.nc8, { face: 'think' });
    await sayAs(story, 'chorus', L.kidsName, L.kidsAfter);
    F('prankSeen', true);
    for (const k of kids) k.walk([{ x: 0.2, z: 1.2 }, { x: 0, z: 3.4 }], 1.6).then(() => { k.dispose(); roomExtras = roomExtras.filter((x) => x !== k); });
    meet('yeyint'); meet('naychi'); meet('toetoe');
    await meaningScene(e);
  }
  async function meaningScene() {
    await D.say('yeyint', [L.yyStuck[0]], { face: 'worried' });
    await D.say('hninwai', L.hwNoBook, { face: 'smile' });
    await D.say('yeyint', [L.yyStuck[1]], { face: 'sad' });
    await D.say('hninwai', L.hwLine, { face: 'smile' });
    await D.say('maya', [L.wQ], { face: 'think' });
    for (;;) {
      const i = await D.choose(L.wChoices);
      if (i === 2) break;
      await D.say('yeyint', L.wWrong[i], { face: 'think' });
    }
    await D.say('yeyint', L.wOk, { face: 'surprised' });
    F('meaning', true);
    meet('hninwai');
    // slate 8: Nay Chi lifts the prompt-book out of the prop basket; slate 8 lies under it
    await D.say('naychi', L.nc8b, { face: 'think' });
    await D.say('maya', L.maya8, { face: 'smile' });
    F('slate8', true); F('prank', true); F('ncMet', true);
    await D.say('naychi', L.ncToStage, { face: 'smile' });
    await D.say('maungnge', L.mnGo, { face: 'happy' });
    // the two of them go out to the stage (they leave through the door; outside they are at the stage)
    after(() => leaveRoomOnFoot(['naychi', 'maungnge']), 120);
  }
  function leaveRoomOnFoot(ids) {
    const R = story.room;
    if (!R) return;
    const dz = (R.door?.z ?? 3.5) - 0.1;
    for (const id of ids) {
      const e = story.people.get(id);
      if (!e) continue;
      story.walkPerson(id, (R.door?.x ?? 0) + (Math.random() - 0.5) * 0.4, dz, 1.5).then(() => { if (story.inRoom && story.people.get(id) === e) story.remove(id); });
    }
  }

  // the back row (5.4): sit, look around (four pencil labels that ink gold), then say where it's heading
  async function backRow() {
    if (!F('meaning')) return;
    if (F('heading')) { await D.say('maya', L.headOk, { face: 'smile' }); return; }
    await D.say('maya', L.sitBack, { face: 'think' });
    const R = story.room;
    const w = game.walker;
    w?.teleport?.(-0.75, 3.12, PI);
    game.maya.root.rotation.set(0, PI, 0);
    // over her shoulder: the whole front of the room (close and low; never the far dev view)
    game.rig.shot(new THREE.Vector3(-0.55, 1.55, 4.05), new THREE.Vector3(0.3, 1.25, -3.2), 0.8);
    await wait(700);
    const items = ['backdrop', 'roads', 'ending', 'list'].map((id) => ({
      id, pencil: L.looks[id].pencil, gold: L.looks[id].gold, done: !!F(`look.${id}`),
      ...({ backdrop: { x: 0.25, y: 1.1, z: -3.85 }, roads: { x: -1.4, y: 2.05, z: -3.85 }, ending: { x: 3.25, y: 0.95, z: -0.9 }, list: { x: 3.85, y: 1.9, z: -2.75 } })[id],
    }));
    const labels = lookLabels(game, items, { onTap: (id) => F(`look.${id}`, true) });
    // (the dialogue box would cover the labels: the looks are wordless taps)
    game.ui.cinema(false);
    await labels.done;
    labels.dispose();
    game.ui.cinema(true);
    await D.say('maya', [L.headQ], { face: 'think' });
    for (;;) {
      const i = await D.choose(L.headChoices);
      if (i === 2) break;
      await D.say('maya', [L.headWrong], { face: 'think' });
    }
    F('heading', true);
    await D.say('maya', L.headOk, { face: 'smile' });
    void R;
  }

  async function paintScene() {
    await D.say('yeyint', L.yyLater, { face: 'think' });
    await D.say('maya', L.mayaPaint, { face: 'smile' });
    await D.say('yeyint', L.yyPaint, { face: 'think' });
    let wobble = 16;
    for (let round = 1; round <= 2; round++) {
      for (;;) {
        const r = await trace({ title: L.paintTitle, hint: L.paintHint, path: 'road', wobble, tolerance: [24, 18][round - 1], round, rounds: 2 });
        if (r.cancelled) return;
        wobble = Math.max(4, wobble * 0.72); // every attempt is practice: the hand steadies
        if (r.ok) break;
        await D.say('yeyint', [L.paintAgain], { auto: true });
      }
    }
    call(story.room?.parts?.backdrop, 'setPainted', 1);
    call(game.audio, 'play', 'chime');
    F('painted', true);
    await D.say('yeyint', L.yyPainted, { face: 'happy' });
  }

  async function sortScene() {
    await D.say('hninwai', L.hwSort, { face: 'smile' });
    const r = await sort({ title: L.sortTitle, hint: L.sortHint, who: 'yeyint', baskets: L.sortBaskets, items: L.sortItems, wrong: L.sortWrong });
    if (!r.ok) return;
    F('sorted', true);
    await D.say('yeyint', L.yySorted, { face: 'think' });
    // a breath: the dialogue closes, she turns to the cast list on the blackboard, then the match
    game.ui.cinema(false);
    await wait(1100);
    game.ui.cinema(true);
    await matchScene();
  }
  async function matchScene() {
    await D.say('hninwai', L.hwMatch, { face: 'smile' });
    const r = await match({ title: L.matchTitle, hint: L.matchHint, pairs: L.matchPairs });
    if (!r.ok) return;
    F('owners', true);
    // each owner stands up and goes to their scene's chalk cross; the "Maya" sash stays on its hook
    const marks = { toetoe: -1.8, micho: -0.6, sunwe: 0.6 };
    await Promise.all(Object.entries(marks).map(([id, x]) => (story.people.get(id) ? Promise.race([story.walkPerson(id, x, -2.4, 1.2), wait(5000)]) : null)));
    const yy = story.people.get('yeyint');
    if (yy) placeAt(yy, { x: 0.4, z: -2.42, h: 0 });
    await D.say('maya', L.owned, { face: 'smile' });
    // the others drift out to the steps; the room goes quiet
    after(() => leaveRoomOnFoot(['toetoe', 'micho', 'sunwe']), 50);
    await wait(900);
  }
  async function yyTalkScene() {
    const r = await story.talk.run(TALK_D7_YEYINT);
    if (!r.won) { await D.say('yeyint', L.yyNotYet, { face: 'think' }); return; }
    F('yyTalk', true);
    // he hangs the sash back on its hook, then at the leavers' list pencils «ရှာနေဆဲ» by his own name
    await Promise.race([story.walkPerson('yeyint', 3.0, -2.2, 1.2), wait(5000)]);
    await D.say('maya', L.stillWrite, { face: 'smile' });
    addStillLine(story.room);
    F('still', true);
    await D.say('hninwai', L.hwAfterTalk, { face: 'smile' });
    after(() => leaveRoomOnFoot(['yeyint', 'hninwai']), 80);
  }
  let stillMesh = null;
  function addStillLine(R) {
    if (!R?.scene || stillMesh) return;
    const cv = document.createElement('canvas'); cv.width = 300; cv.height = 80;
    const g = cv.getContext('2d');
    const draw = () => { g.clearRect(0, 0, 300, 80); g.fillStyle = '#4A4A6A'; g.font = '600 46px "Noto Sans Myanmar", sans-serif'; g.textAlign = 'left'; g.fillText(L.stillText.my, 8, 56); };
    draw();
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    document.fonts?.ready?.then(() => { draw(); tex.needsUpdate = true; });
    stillMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.08), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    stillMesh.position.set(3.9, 1.57, -2.58);
    stillMesh.rotation.y = -PI / 2;
    R.scene.add(stillMesh);
  }
  function dropStillLine() {
    if (!stillMesh) return;
    const m = stillMesh;
    stillMesh = null;
    // (the room may already have disposed its own scene, taking the material's map with it)
    try { m.removeFromParent(); m.material?.map?.dispose?.(); m.material?.dispose?.(); m.geometry?.dispose?.(); } catch (err) { console.warn('day7 still line', err); }
  }

  // =============================================================================================
  // chapter 11 at the stage and in the snack shop (6.1, 6.2), the changed street
  // =============================================================================================
  async function knotScene() {
    meet('maungnge');
    await D.say('maungnge', L.mnKnot, { face: 'worried', emote: 'fists' });
    await D.say('maya', L.mayaKnotQ, { face: 'think' });
    await D.say('naychi', L.nc7, { face: 'think' });
    call(curtain, 'setKnot', 'bow');
    call(game.audio, 'play', 'thud');
    await D.say('maungnge', L.mn7, { face: 'happy', emote: 'cheer' });
    for (let k = 0; k <= 10; k++) { call(curtain, 'setOpen', Math.sin((k / 10) * PI) * 0.6); await wait(70); }
    call(curtain, 'setOpen', 0);
    await D.say('naychi', L.nc7b, { face: 'smile' });
    F('slate7', true); F('knot', true);
    slate7.root.visible = false;
    await D.say('naychi', L.ncTo9, { face: 'smile' });
    after(() => ncWalk([{ x: -6.3, z: 145.6 }, { x: 4, z: 146 }, { x: 4, z: 62 }, { x: 15, z: 62 }, { x: 15, z: 59.9 }], () => { const e = story.people.get('naychi'); if (e && !story.inRoom) story.remove('naychi'); }), 50);
  }
  function ncWalk(pts, then, speed = 1.6) {
    const e = story.people.get('naychi');
    if (!e || story.inRoom) { then?.(); return Promise.resolve(); }
    scripted.add('naychi');
    return moveAlong(e, pts, speed).then(() => { scripted.delete('naychi'); then?.(); });
  }

  let shopWatch = 0, shopCalled = false, shopNcGone = false;
  async function slate9Scene() {
    meet('naychi');
    await D.say('naychi', L.nc9, { face: 'smile' });
    F('shelved', true);
    // she shelves them and walks out without looking back; a small child comes in behind
    shopNcGone = true;
    after(() => {
      leaveRoomOnFoot(['naychi']);
      const R = story.room;
      if (R?.scene) {
        const c = extra(LOOKS.child, { x: 0, z: (R.door?.z ?? 2.6) + 0.1, h: PI }, R.scene);
        c.kid = true;
        roomExtras.push(c);
        c.walk([{ x: 0.6, z: 1.2 }, { x: 2.2, z: 0.2 }], 0.9);
      }
    }, 300);
  }

  let streetLabels = null, streetShot = false;
  // Maya turns to what Nay Chi has just named: the camera eases round behind her shoulder so the thing
  // itself is in the frame (a look, not a pointer: no mark on it until she reads it).
  function lookToward(t) {
    const m = game.maya.root.position;
    // Maya and the thing side by side, from whichever side nothing stands in front of them, a little raised
    try { pairShot(game, m, t, { h: 3.0, look: 0.7, dur: 1.1 }); } catch (err) { console.warn('day7 look', err); return; }
    streetShot = { x: m.x, z: m.z };
  }
  function dropStreetLabels() {
    streetLabels?.dispose(); streetLabels = null;
    if (streetShot) { streetShot = false; if (!story.talking) game.rig.release(); }
  }
  function showStop(i) {
    if (streetLabels) return;
    const s = STOPS[i];
    const it = { id: s.id, ...s.look, pencil: L.changed[s.id].pencil, gold: L.changed[s.id].gold, done: false };
    lookToward(s.look);
    streetLabels = lookLabels(game, [it], {
      onTap: () => {
        F(`see.${s.id}`, true);
        after(() => { dropStreetLabels(); nextStop(); }, 1500);
      },
    });
    streetLabels.stop = i;
  }
  function nextStop() {
    const n = seenCount();
    if (n >= 3) { after(() => beat('naychi', changedEnd), 200); return; }
    ncWalk(STOPS[n].path, null, 1.5);
  }
  async function oldWayScene() {
    await D.say('naychi', L.ncOldWay, { face: 'smile' });
    F('oldWay', true);
    after(() => ncWalk(STOPS[seenCount()].path, null, 1.5), 50);
  }
  async function changedEnd() {
    await D.say('naychi', L.ncChanged, { face: 'surprised' });
    F('slate9', true); F('changed', true);
    await D.say('naychi', L.ncFold, { face: 'smile' });
    // she walks south down the avenue (seen); out of sight she is already at the board
    after(() => ncWalk([{ x: 45.2, z: 118 }, { x: 4, z: 118 }, { x: 4, z: 150 }], () => {
      const e = story.people.get('naychi');
      if (e) placeAt(e, { x: FOLD.boardStand.x, z: FOLD.boardStand.z, h: FOLD.boardStand.h });
    }, 1.7), 50);
  }

  // =============================================================================================
  // C: benches with everyone (5.8)
  // =============================================================================================
  const carriers = []; // { a, b, prop, lift } a/b: { e } (cast entry) or { x } (walk-on)
  function startCarryLine() {
    F('carryStarted', true);
    syncProps();
    const pos = (o) => (o.e ? o.e.p.root.position : o.x.p.root.position);
    const goPerson = (id, start, end) => {
      let e = story.people.get(id);
      if (!e) e = story.spawn(id, { x: start.x, z: start.z, heading: -PI / 2 });
      if (!e) return null;
      placeAt(e, { ...start, h: -PI / 2 });
      scripted.add(id);
      moveAlong(e, [...CARRY_ROUTE, end], 1.05).then(() => { scripted.delete(id); e.p.root.rotation.y = end.h ?? PI; e.home.h = end.h ?? PI; });
      return { e };
    };
    const goExtra = (look, start, end) => {
      const x = extra(look, { ...start, h: -PI / 2 }, scene);
      x.walk([...CARRY_ROUTE, end], 1.05).then(() => { x.p.root.rotation.y = PI; });
      carryExtras.push(x);
      return { x };
    };
    const at = (k) => ({ x: -12.6 - k * 1.85, z: 90.1 });
    const sun = goPerson('sunwe', at(5), Q.sq.sunwe);
    const mng = goPerson('maungnge', at(4), { x: Q.mnCurtain.x - 1.2, z: 145.0, h: PI });
    const c1 = goExtra(LOOKS.chorus1, at(3), { x: -19.6, z: 144.9 });
    const c2 = goExtra(LOOKS.chorus2, at(2), { x: -20.8, z: 144.6 });
    const tt = goPerson('toetoe', at(1), Q.sq.toetoe);
    const mc = goPerson('micho', at(0), Q.sq.micho);
    const benchProp = own(schoolBench());
    scene.add(benchProp.root);
    const roll = (() => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.4, 10), new THREE.MeshToonMaterial({ color: '#EFE4C8' }));
      m.rotation.z = PI / 2;
      const root = new THREE.Group(); root.add(m);
      return own({ root, dispose() { m.geometry.dispose(); m.material.dispose(); root.removeFromParent(); } });
    })();
    scene.add(roll.root);
    const basket = own(propBasket({ items: ['ribbon', 'sheet', 'badge', 'timetable', 'wicks', 'rope'] }));
    scene.add(basket.root);
    if (sun && mng) carriers.push({ a: sun, b: mng, prop: benchProp.root, lift: 0.5, pos });
    if (c1 && c2) carriers.push({ a: c1, b: c2, prop: roll.root, lift: 1.25, pos });
    if (tt && mc) carriers.push({ a: tt, b: mc, prop: basket.root, lift: 0.42, pos });
    carryProps.push(benchProp, roll, basket);
  }
  const carryExtras = [];
  const carryProps = [];
  function clearCarryLine() {
    carriers.length = 0;
    for (const p of carryProps) { p.dispose(); const k = objs.indexOf(p); if (k >= 0) objs.splice(k, 1); }
    carryProps.length = 0;
  }
  let carryBench = null;
  let toldNext = false;
  async function carryPrompt() {
    meet('yeyint');
    await D.say('yeyint', L.yyEnd1, { face: 'smile' });
    carryBench = schoolBench();
    own(carryBench);
    setStack(0);
    story.carry(carryBench.root, { with: 'yeyint', axis: 'x' });
  }
  async function setDown() {
    story.carry(null, { remove: true });
    if (carryBench) { carryBench.dispose(); const k = objs.indexOf(carryBench); if (k >= 0) objs.splice(k, 1); carryBench = null; }
    clearCarryLine();
    for (const x of carryExtras) x.walk([{ x: -24, z: 146.2 }, { x: -40, z: 146.2 }], 1.2).then(() => x.dispose());
    F('benches', true);
    syncProps();
    setClock(17.75);
    clockRun = false;
    for (const id of ['toetoe', 'micho', 'sunwe', 'maungnge']) scripted.delete(id);
    sync();
    await runScene(async () => {
      frameWith('sunwe');
      await D.say('maya', L.benchesDown, { face: 'happy' });
      await D.say('sunwe', L.snSeat, { face: 'smile' });
    });
  }

  // =============================================================================================
  // dusk: the brimming bowl (5.9) and the play (5.10)
  // =============================================================================================
  async function duskScene() {
    game.day?.set?.(17.75); game.applyDayLook();
    setClock(17.75);
    frameWith('hninwai');
    await D.say('hninwai', L.hwDusk, { face: 'smile' });
    await D.say('micho', L.mcBowl, { face: 'happy' });
    for (;;) {
      const r = await steady({ title: L.bowlTitle, hint: L.bowlHint, kind: 'bowl', length: 6, sway: 0.15, spillAt: 0.7, clock: true, who: 'yeyint' });
      if (r.cancelled) { game.day?.set?.(null); game.applyDayLook(); return; }
      if (r.ok) break;
      await D.say('yeyint', [L.bowlSpill], { auto: true });
    }
    frameWith('hninwai', { dur: 0.01 });
    await D.say('yeyint', L.bowlOk, { face: 'happy' });
    await D.say('toetoe', L.ttBowl, { face: 'smile' });
    F('bowl', true);
    await playScene();
  }
  async function playScene() {
    await D.say('maya', [L.seatQ], { face: 'think' });
    const i = await D.choose(L.seatChoices);
    F('seat', i);
    const s = i ? Q.seatBack : Q.seatFront;
    card.root.visible = false;
    story.foot.walker.teleport(s.x, s.z, s.h);
    game.maya.root.position.set(s.x, 0, s.z); game.maya.root.rotation.set(0, s.h, 0);
    await D.say('maya', i ? L.seat1 : L.seat0, { face: 'smile' });
    game.day?.set?.(18.0); game.applyDayLook();
    setClock(18.0);
    await D.say('hninwai', L.hwSix, { face: 'smile' });
    // the play, once (a short cut-scene, never replayable)
    game.rig.shot(new THREE.Vector3(-13, 4.6, 151.5), new THREE.Vector3(-13, 2.0, 138.6), 1.4);
    for (let k = 0; k <= 12; k++) { call(curtain, 'setOpen', k / 12); await wait(60); }
    await D.say('maya', L.play1, { face: 'smile' });
    const onStage = (id, x, h = 0) => { const e = story.people.get(id); if (!e) return; e.p.root.position.set(x, 1.0, 138.6); e.p.root.rotation.y = h; };
    const offStage = (id) => { const e = story.people.get(id); if (!e) return; placeAt(e, plan()[id] || { x: e.home.x, z: e.home.z, h: e.home.h }); };
    onStage('toetoe', -10.6, 0.3); onStage('yeyint', -14.5, PI / 2);
    await D.say('maya', L.play2, { face: 'happy' });
    offStage('toetoe'); offStage('yeyint');
    onStage('micho', -13, 0);
    const playWheel = put(potterWheel({ clay: 0.3, chalk: 'မရသေးဘူး' }), -13.9, 138.5, 0.3, 1.0); // DRAFT(my)
    await D.say('maya', L.play3, { face: 'happy' });
    offStage('micho'); playWheel.dispose(); objs.splice(objs.indexOf(playWheel), 1);
    onStage('sunwe', -13.6, 0.3); onStage('maungnge', -12.4, -0.3);
    await D.say('maya', L.play4, { face: 'happy' });
    offStage('sunwe'); offStage('maungnge');
    const nc = story.people.get('naychi');
    const ncWas = nc ? { x: nc.home.x, z: nc.home.z, h: nc.home.h } : null;
    if (!nc) story.spawn('naychi', { x: -13, z: 138.6, heading: 0 });
    onStage('naychi', -13, 0);
    await D.say('maya', L.play5, { face: 'happy' });
    if (ncWas) placeAt(story.people.get('naychi'), ncWas); else story.remove('naychi');
    onStage('yeyint', -13, 0);
    await D.say('yeyint', [L.wOk[0]], { face: 'smile' });
    call(game.audio, 'play', 'cheer');
    const yy = story.people.get('yeyint');
    if (yy) game.fx?.burst?.('confetti', yy.p.headTop(v3), { count: 22, spread: 0.8, up: 0.9 });
    setClock(19.0);
    await D.say('maya', L.play7, { face: 'happy' });
    offStage('yeyint');
    F('played', true);
    game.rig.release();
    // after: the costume comes back
    await D.say('yeyint', L.yyEnd, { face: 'happy' });
    await D.say('maya', L.mayaEnd, { face: 'happy' });
    await D.say('hninwai', L.hwEnd, { face: 'smile' });
    await D.say('maya', L.costumeBack, { face: 'smile' });
    F('ch4Done', true);
    clockRun = true;
    game.day?.set?.(null); game.applyDayLook(); // normal light returns
    if (F('ch11Done')) await D.say('maya', L.mayaWrite, { face: 'smile' });
  }

  // =============================================================================================
  // the Fold (6.3-6.7)
  // =============================================================================================
  async function slate6Scene() {
    meet('naychi');
    frameWith('naychi');
    await D.say('naychi', L.nc6, { face: 'worried' });
    await D.say('maya', L.mayaFear, { face: 'smile' });
    await D.say('naychi', L.nc6b, { face: 'worried' });
    const r = await steady({ title: L.plankTitle, hint: L.plankHint, kind: 'plank', length: 10, sway: 0.5, spillAt: 1, back: L.plankBack, backLine: L.plankBackLine, meet: { at: 0.85, who: 'child' }, who: 'naychi' });
    if (r.cancelled) return;
    frameWith('naychi', { dur: 0.01 });
    await sayAs(story, 'd7pierChild', L.pierChild, L.childStuck, {});
    await D.say('naychi', L.ncChild, { face: 'smile' });
    for (;;) {
      const r2 = await steady({ title: L.plankBackTitle, hint: L.plankBackHint, kind: 'plank', length: 5, sway: 0.3, spillAt: 1, who: 'naychi' });
      if (r2.cancelled || r2.ok) break;
    }
    frameWith('naychi', { dur: 0.01 });
    fold.slate6.root.visible = false;
    F('slate6', true);
    giveProof('rope', L.proofRope);
    F('rumour.rope', true);
    // the child they walked back with runs off home along the square
    const c = extra(LOOKS.pierChild, { x: FOLD.board.x + 1.2, z: FOLD.board.z + 1.6, h: -PI / 2 }, scene);
    carryExtras.push(c);
    c.walk([{ x: 64, z: 299.2 }, { x: 40, z: 300 }], 1.4).then(() => c.dispose());
    await D.say('naychi', L.nc6c, { face: 'smile' });
    await hutScene();
  }
  async function hutScene() {
    if (story.people.get('d7handB')) await sayAs(story, 'd7handB', L.bhName, L.bhHut, { face: 'smile' });
    await D.say('naychi', L.ncHut, { face: 'smile' });
    F('toHut', true);
    syncProps();
    after(() => goInHut(), 120);
  }
  async function goInHut() {
    if (story.inRoom || game.busy || story.talking) { after(goInHut, 500); return; }
    await story.enter('bridgehut', { fast: true });
  }
  async function orderScene() {
    const R = story.room;
    call(R?.parts?.slates, 'show', true);
    hutPair();
    await D.say('naychi', L.ncOrderQ, { face: 'think' });
    for (;;) {
      const i = await D.choose(L.ncOrderChoices);
      if (i === 2) break;
      if (i === 0) { await D.say('naychi', L.ncByNumber, { face: 'think' }); await D.say('maya', L.ncByNumberMaya, { face: 'think' }); }
      else { await D.say('naychi', L.ncMaya, { face: 'worried' }); await D.say('maya', L.ncMayaMaya, { face: 'think' }); }
    }
    await D.say('naychi', L.ncOwn, { face: 'smile' });
    F('order', true); F('slate10', true);
    call(R?.parts?.slates, 'show', false);
    after(() => story.exit(), 200); // she carries the stack out to the board
  }
  async function hangScene() {
    const b = fold.board;
    frameWith('naychi');
    for (let i = 0; i < NC_ORDER.length; i++) {
      b.setSlate(i, { text: L.slates[NC_ORDER[i]].my, faint: true });
      call(game.audio, 'play', 'chalk');
      await wait(260);
    }
    await D.say('maya', L.ncHang, { face: 'smile' });
    F('hung', true);
    await D.say('maya', L.mayaOrder, { face: 'smile' });
    // two keys, two tags: each writes her own name (Maya's by the gold quill)
    await D.say('naychi', L.ncKeys, { face: 'smile' });
    call(b.keys?.[0], 'setTag', L.tagNay);
    call(b.keys?.[1], 'setTag', L.tagMaya);
    await wait(500);
    b.setKeys(0);
    story.give('ownkey');
    await D.say('maya', L.mayaKey, { face: 'think' });
    F('keys', true);
    // the bridge opens: the board's lamp, the boom up, the deck's lanterns, a cheer
    b.setLit(true);
    await sayAs(story, 'd7handA', L.bhName, L.bhBoom, { face: 'happy' });
    try { (game.world.setFlagGate || story.openWorld?.setFlagGate)?.('bridgeOpen', true); } catch (err) { console.error('day7 gate', err); }
    F('bridge', true);
    syncProps();
    call(game.audio, 'play', 'cheer');
    call(bhA.p, 'emote', 'cheer'); call(bhB.p, 'emote', 'cheer');
    game.rig.shot(new THREE.Vector3(70, 6.5, 312), new THREE.Vector3(96, 1.0, 299), 1.6);
    await wait(2200);
    game.rig.release();
    frameWith('naychi', { dur: 0.5 });
    await sayAs(story, 'd7handA', L.bhName, L.bhTea, { face: 'happy' });
    F('teaTime', true);
    after(() => goInHut(), 150);
  }
  async function teaScene() {
    const R = story.room;
    call(R?.parts?.cups, 'show', true);
    call(R?.parts?.key, 'show', true);
    call(R?.parts, 'setGlow', 1);
    hutPair();
    await D.say('maya', L.hutTea, { face: 'smile' });
    await D.say('naychi', L.ncTomorrow, { face: 'worried' });
    const i = await D.choose(L.ncTomorrowChoices); // all three tell (Act 1); Day 8 shows what leaning costs
    F('ncPromise', i);
    await D.say('naychi', L.ncThanks, { face: 'happy' });
    F('ch11Done', true);
    await D.say('naychi', L.ncUnderBoard, { face: 'smile' });
    if (F('ch4Done')) await D.say('maya', L.mayaWrite, { face: 'smile' });
    after(() => leaveRoomOnFoot(['naychi']), 100);
  }

  // the Fold's Bookmark Desk (8.1): one true line of what can be seen, before the ribbon rises
  const ow = story.openWorld;
  const lightDesk0 = ow?.lightDesk;
  if (ow && lightDesk0) {
    ow.lightDesk = async (d) => {
      if (d?.id === 'foldWest' && !save.flags['desk:foldWest']) {
        const ok = await runScene(async () => {
          await D.say('maya', [L.deskFoldQ], { face: 'think' });
          const choices = [L.deskFold[0], L.deskFold[1], F('bridge') ? L.deskFoldAfter : L.deskFold[2]];
          for (;;) { const i = await D.choose(choices); if (i === 2) break; await D.say('maya', [L.deskWrong], { face: 'think' }); }
        });
        if (!ok) return;
        await lightDesk0.call(ow, d);
        F('desk', true);
        F('heard.rope', true); F('heard.well', true); // the two rumours sit in pencil now
        if (!F('rumour.rope')) { giveProof('rope', L.proofRope); F('rumour.rope', true); } // the rope bridge hangs whole: seen
        return;
      }
      await lightDesk0.call(ow, d);
      if (d?.id === 'stage' && !F('rumour.clock')) {
        await runScene(async () => { await D.say('maya', L.deskStage, { face: 'smile' }); });
        giveProof('clock', L.proofClock); F('rumour.clock', true);
      }
    };
  }

  // the stage clock: a tap on its face (rumour `clock`)
  const clockHook = (x, y) => {
    if (!story.foot.active || story.inRoom) return false;
    const p = story.foot.pos;
    if (Math.hypot(p.x - Q.clock.x, p.y - Q.clock.z) > 11) return false;
    const q = game.rig.project(v3.set(Q.clock.x, 2.3, Q.clock.z + 0.16), game.viewW, game.viewH);
    if (!q || Math.hypot(q.x - x, q.y - y) > 52) return false;
    runScene(async () => {
      if (F('rumour.clock')) { await D.say('maya', [L.clockGold], { face: 'smile' }); return; }
      await D.say('maya', [{ my: `(“${L.clockPencil.my}” တဲ့…)`, en: `("${L.clockPencil.en}", they said…)` }], { face: 'think' });
      await D.say('maya', [L.clockGold], { face: 'surprised' });
      giveProof('clock', L.proofClock);
      F('rumour.clock', true);
    });
    return true;
  };
  story.tapHooks = story.tapHooks || [];
  story.tapHooks.push(clockHook);

  // =============================================================================================
  // what people say, by how far the day has gone
  // =============================================================================================
  const talk = {
    wintwar: async () => {
      if (!F('progSeen')) return morning();
      if (F('ch4Done') && F('ch11Done')) return D.say('wintwar', L.wwDone, { face: 'smile' });
      await D.say('wintwar', F('benches') ? L.wwEvening : L.wwLater, { face: 'smile' });
    },
    hninwai: async () => {
      meet('hninwai');
      if (story.inRoom === 'classroom') {
        if (!F('meaning')) return meaningScene();
        if (!F('hw1')) { F('hw1', true); return D.say('hninwai', L.hw1, { face: 'smile' }); }
        if (F('heard.prize') && !F('rumour.prize')) {
          await D.say('maya', L.askPrize, { face: 'think' });
          await D.say('hninwai', L.hwPrize, { face: 'smile' });
          giveProof('noprize', L.proofNoprize);
          F('rumour.prize', true);
          return;
        }
        if (F('painted') && !F('sorted')) return sortScene();
        if (F('sorted') && !F('owners')) return matchScene();
        if (!F('heading')) return D.say('hninwai', [L.hw1[2]], { face: 'smile' });
        if (!F('painted')) return D.say('hninwai', L.hwWait, { face: 'smile' });
        return D.say('hninwai', L.hwA, { face: 'smile' });
      }
      if (F('heard.prize') && !F('rumour.prize')) {
        await D.say('maya', L.askPrize, { face: 'think' });
        await D.say('hninwai', L.hwPrize, { face: 'smile' });
        giveProof('noprize', L.proofNoprize); F('rumour.prize', true);
        return;
      }
      if (F('ch4Done')) return D.say('hninwai', L.hwEnd, { face: 'smile' });
      return D.say('hninwai', L.hwA, { face: 'smile' });
    },
    yeyint: async () => {
      meet('yeyint');
      if (story.inRoom === 'classroom') {
        if (!F('meaning')) return meaningScene();
        if (F('owners') && !F('yyTalk')) {
          if (story.talk.waiting(TALK_D7_YEYINT.id)) return D.say('yeyint', L.yyNotYet, { face: 'think' });
          return yyTalkScene();
        }
        if (F('heading') && !F('painted')) return paintScene();
        const [line] = next('yeyint', [L.yyLater[0], ...L.yyBench]);
        return D.say('yeyint', [line], { face: 'think' });
      }
      if (F('carryStarted') && !F('benches') && !story.carrying) return carryPrompt();
      if (F('ch4Done')) return D.say('yeyint', [L.yyEnd[1]], { face: 'happy' });
      return D.say('yeyint', L.yyAfter, { face: 'happy' });
    },
    naychi: async () => {
      meet('naychi');
      const st = ncState();
      if (story.inRoom === 'snackshop' && F('knot') && !F('shelved')) return slate9Scene();
      if (story.inRoom === 'bridgehut') {
        if (F('toHut') && !F('order')) return orderScene();
        if (F('teaTime') && !F('ch11Done')) return teaScene();
        return D.say('naychi', L.ncAfter, { face: 'smile' });
      }
      if (st === 'stage') return knotScene();
      if (st === 'street' && !F('oldWay')) return oldWayScene();
      if (st === 'street') return D.say('naychi', L.ncChangedWait, { face: 'smile' });
      if (st === 'fold') {
        if (!F('slate6')) return slate6Scene();
        if (!F('order')) return hutScene();
        if (!F('hung')) return hangScene();
        if (!F('ch11Done')) { after(() => goInHut(), 100); return D.say('naychi', L.bhTea, { face: 'smile' }); }
        return D.say('naychi', L.ncAfter, { face: 'smile' });
      }
      return D.say('naychi', [L.slates[8]], { face: 'smile' });
    },
    maungnge: async () => {
      meet('maungnge');
      if (ncState() === 'stage' && story.people.get('naychi')) return knotScene();
      if (F('knot')) return D.say('maungnge', L.mnAfter, { face: 'happy' });
      const [line, i] = next('maungnge', L.mnA);
      if (i === 0) F('heard.prize', true);
      return D.say('maungnge', [line], { face: 'happy' });
    },
    toetoe: async () => {
      meet('toetoe');
      if (F('bowl')) return D.say('toetoe', L.ttBowl, { face: 'smile' });
      const [line] = next('toetoe', L.ttA);
      return D.say('toetoe', [line], { face: 'smile' });
    },
    sunwe: async () => {
      meet('sunwe');
      const [line, i] = next('sunwe', L.snA);
      if (i === 0) F('heard.clock', true);
      return D.say('sunwe', [line], { face: 'smile' });
    },
    micho: async () => { meet('micho'); const [line] = next('micho', L.mcA); return D.say('micho', [line], { face: 'happy' }); },
    dawohn: async () => { meet('dawohn'); return D.say('dawohn', L.ohA, { face: 'smile' }); },
    kophyo: async () => {
      const [line, i] = next('kophyo', L.kpA);
      if (i === 1) F('heard.rope', true);
      return D.say('kophyo', [line], { face: 'smile' });
    },
    tintin: async () => {
      await D.say('tintin', L.ttnA, { face: 'smile' });
      if (!F('teaCup')) { F('teaCup', true); if ((save.bag.tea || 0) < 3) story.give('tea'); }
    },
    thiri: async () => D.say('thiri', L.thA, { face: 'smile' }),
    d7handA: async () => {
      if (F('bridge')) return sayAs(story, 'd7handA', L.bhName, L.bhAfter, { face: 'smile' });
      const [line, i] = next('bh', L.bh);
      if (i === 1) F('heard.rope', true);
      if (i === 2) F('heard.well', true);
      return sayAs(story, 'd7handA', L.bhName, [line], { face: 'smile' });
    },
    d7handB: async () => {
      if (F('bridge')) return sayAs(story, 'd7handB', L.bhName, L.bhAfter, { face: 'smile' });
      const [line, i] = next('bh', L.bh);
      if (i === 1) F('heard.rope', true);
      if (i === 2) F('heard.well', true);
      return sayAs(story, 'd7handB', L.bhName, [line], { face: 'smile' });
    },
  };

  // =============================================================================================
  // rooms: who is inside, dressing, what starts on the way in, stations
  // =============================================================================================
  function roomCast(id) {
    if (id === 'classroom') {
      if (F('yyTalk')) return [];
      const list = [];
      list.push({ id: 'yeyint', spot: F('owners') ? { x: 0.4, z: -2.42, h: 0 } : 'yeyint' });
      list.push({ id: 'hninwai', spot: 'hninwai' });
      if (!F('owners')) for (const k of ['toetoe', 'micho', 'sunwe']) list.push({ id: k, spot: k });
      if (!F('meaning')) list.push({ id: 'maungnge', spot: 'maungnge' });
      if (!F('slate8')) list.push({ id: 'naychi', spot: 'naychi' });
      return list;
    }
    if (id === 'snackshop') return F('knot') && !F('shelved') ? [{ id: 'naychi', spot: 'naychi' }] : [];
    if (id === 'teashop') return [{ id: 'kophyo', spot: 'kophyo' }, { id: 'tintin', spot: 'tintin' }];
    if (id === 'bridgehut') {
      const list = [];
      if ((F('toHut') && !F('order')) || (F('teaTime') && !F('ch11Done'))) list.push({ id: 'naychi', spot: 'naychi' });
      return list;
    }
    return null; // other rooms: their own default cast
  }
  function roomOpts(id) {
    if (id === 'classroom') return { painted: F('painted') ? 1 : 0 };
    if (id === 'bridgehut') return { glow: F('bridge') ? 1 : 0 };
    return {};
  }
  function enterRoom(id, R) {
    roomExtras = [];
    if (id === 'classroom') {
      // the back-row desk, a plain tap target (no marker)
      if (R?.stations && !R.stations.some((s) => s.id === 'd7-backrow')) R.stations.push({ id: 'd7-backrow', x: -0.75, z: 2.95, r: 0.7, look: { x: -1.6, z: 2.5 }, name: { my: 'နောက်ဆုံးတန်း', en: 'the back row' } });
      if (F('still')) addStillLine(R);
      if (!F('prankSeen') && R?.scene) {
        // the two chorus kids at the platform's right end (walk-ons)
        for (const [k, at] of [['chorus1', { x: 3.0, z: -2.55, h: -0.3 }], ['chorus2', { x: 2.3, z: -2.2, h: -0.5 }]]) { const x = extra(LOOKS[k], at, R.scene); x.kid = true; roomExtras.push(x); }
      }
      if (!F('arrived')) { F('arrived', true); after(() => beat('yeyint', rehearsal), 500); }
      return;
    }
    if (id === 'snackshop') {
      shopWatch = 0; shopCalled = false; shopNcGone = F('shelved');
      if (F('knot') && !F('shelved')) after(() => beat('naychi', slate9Scene), 600);
      return;
    }
    if (id === 'bridgehut') {
      if (R?.scene) {
        const hA = extra(LOOKS.handA, R.spots?.handA || { x: 2.2, z: -1.2 }, R.scene);
        roomExtras.push(hA);
      }
      if (F('toHut') && !F('order')) after(() => beat('naychi', orderScene), 600);
      else if (F('teaTime') && !F('ch11Done')) after(() => beat('naychi', teaScene), 600);
      return;
    }
  }
  function leaveRoom(id) {
    for (const x of roomExtras) x.dispose();
    roomExtras = [];
    if (id === 'classroom') dropStillLine();
    if (id === 'snackshop' && F('shelved') && !F('gave')) F('gave', true); // she gave, and Maya stepped out
    syncDue = 0;
  }
  function station(id) {
    if (id === 'd7-backrow') { if (!F('meaning')) return false; runScene(backRow); return true; }
    if (id === 'cl-backdrop' && F('heading') && !F('painted')) { beat('yeyint', paintScene); return true; }
    if (id === 'cl-basket' && F('painted') && !F('sorted')) { beat('hninwai', sortScene); return true; }
    if (id === 'cl-leavers' && F('still')) { runScene(() => D.say('maya', [{ my: '(ရဲယဉ့် — ရှာနေဆဲ)', en: '(Ye Yint — still looking)' }], { face: 'smile' })); return true; }
    if (id === 'sn-takeone' && F('shelved')) { runScene(() => D.say('maya', L.childShop, { face: 'smile' })); return true; }
    return false;
  }

  // =============================================================================================
  // every frame
  // =============================================================================================
  let syncDue = 0, reciteT = 0, carryNoT = 0;
  const near = (p, q, r) => Math.hypot(p.x - q.x, p.y - q.z) < r;
  function update(dt) {
    if (disposed) return;
    const mw = game.maya.root.position;
    if (!story.inRoom && Math.abs(mw.x - 88) < 75 && Math.abs(mw.z - 300) < 60) fold.update(dt); // the rope sways (only near the Fold)
    if (!story.inRoom && (farT -= dt) <= 0) { farT = 0.5; farCull(mw); }
    for (let i = carryExtras.length - 1; i >= 0; i--) { const x = carryExtras[i]; if (x.gone) carryExtras.splice(i, 1); else x.update(dt); }
    for (const x of roomExtras) if (!x.gone) x.update(dt, story.inRoom ? new THREE.Vector3(game.walker?.pos.x ?? 0, 1, game.walker?.pos.y ?? 0) : null);
    for (const c of carriers) {
      const a = c.pos(c.a), b = c.pos(c.b);
      c.prop.position.set((a.x + b.x) / 2, c.lift, (a.z + b.z) / 2);
      c.prop.rotation.y = Math.atan2(a.x - b.x, a.z - b.z) + PI / 2;
    }
    if (clockRun) { clockH = Math.min(F('benches') ? 23 : 17.5, clockH + dt / 180); setClock(clockH); }
    // in the snack shop, after she has left: standing there watching the shelf
    if (story.inRoom === 'snackshop' && shopNcGone && !shopCalled && !story.talking) {
      const moving = game.walker?.moving || game.input?.stick?.()?.lengthSq?.() > 0.04;
      shopWatch = moving ? 0 : shopWatch + dt;
      if (shopWatch > 5) { shopCalled = true; story.bark('naychi', L.ncDontLook[0], 4200); }
    }
    if ((syncDue -= dt) <= 0) { syncDue = 0.7; sync(); }
    // ---- outdoors, on foot: what starts by itself when Maya comes to it
    if (story.inRoom || story.talking || game.busy || beatBusy || !story.foot.active) { carGuard(); return; }
    const p = story.foot.pos;
    if (!F('arrived') && F('progSeen') && near(p, Q.schoolDoor, 13)) {
      if ((reciteT -= dt) <= 0) { reciteT = 11; game.ui.bark?.(tr(L.recite), { face: game.maya.faceCanvas('surprised'), ms: 4200 }); }
    }
    if (F('yyTalk') && !F('carryStarted')) startCarryLine();
    if (F('carryStarted') && !F('benches') && !story.carrying) {
      const yy = story.people.get('yeyint');
      if (yy && !yy.ctl && Math.hypot(p.x - yy.p.root.position.x, p.y - yy.p.root.position.z) < 1.9) { beat('yeyint', carryPrompt); return; }
    }
    if (story.carrying && !F('benches')) {
      if (!toldNext && p.x < -22 && p.y < 100) { toldNext = true; story.bark('yeyint', L.yyNext, 3800); }
      if (near(p, Q.square, 4.2)) { setDown(); return; }
    }
    if (F('benches') && !F('bowl') && near(p, Q.square, 6.5)) { beat('hninwai', duskScene); return; }
    if (F('gave') && !F('oldWay') && near(p, Q.ncShopOut, 4)) { beat('naychi', oldWayScene); return; }
    if (F('oldWay') && !F('changed') && !scripted.has('naychi')) {
      const n = seenCount();
      if (n < 3) {
        const s = STOPS[n];
        const nc = story.people.get('naychi');
        const there = nc && Math.hypot(nc.p.root.position.x - s.nc.x, nc.p.root.position.z - s.nc.z) < 1.2;
        if (streetShot && Math.hypot(p.x - streetShot.x, p.y - streetShot.z) > 2.5) { streetShot = false; game.rig.release(); } // she walks on: the camera follows again
        if (there && near(p, s.nc, 7)) showStop(n);
        else if (streetLabels && !near(p, s.nc, 14)) dropStreetLabels();
      }
    }
    if (!F('fold') && near(p, FOLD.square, FOLD.square.r)) { F('fold', true); runScene(() => D.say('maya', L.foldArrive, { face: 'surprised' })); return; }
    if (F('changed') && !F('slate6') && near(p, FOLD.boardStand, 3.0) && story.people.get('naychi') && !scripted.has('naychi')) { beat('naychi', slate6Scene); return; }
    if (F('order') && !F('hung') && near(p, FOLD.boardStand, 6)) { beat('naychi', hangScene); return; }
    // the night page: back at the Writing Room door, both chapters done
    if (F('ch4Done') && F('ch11Done') && !F('done') && near(p, ab, 1.8)) night();
  }
  function carGuard() {
    if (!F('bridge') || story.foot.active || story.inRoom) return;
    const cp = game.car?.root?.position;
    if (cp && cp.x > 110 && Math.abs(cp.z - 300) < 5) {
      call(game.world.drive, 'stop');
      call(game.world.drive, 'placeAt', 106, 300, -PI / 2);
      call(game, 'syncCar', 0);
      story.bark('maya', L.bhTomorrow, 3600);
    }
  }

  // =============================================================================================
  // the night page (9)
  // =============================================================================================
  let nightBusy = false;
  async function night() {
    if (nightBusy) return;
    nightBusy = true;
    try {
      const who = ['yeyint', 'naychi', 'hninwai', ...['toetoe', 'micho', 'maungnge', 'sunwe', 'dawohn'].filter((id) => met.has(id))];
      await nightPage(story, {
        day: 7,
        truth: { q: L.nightQ, choices: L.nightChoices, right: 1, wrong: L.nightWrong },
        before: async () => {
          await showSlip(game, L.reply, { kind: 'notebook', title: L.replyTitle });
          save.flags['reply.d7'] = L.reply;
          F('reply', true);
          if (!save.flags.bridgeOpen) { try { (game.world.setFlagGate || ow?.setFlagGate)?.('bridgeOpen', true); } catch { /* the flag alone opens it next load */ save.flags.bridgeOpen = true; } }
        },
        sleep: { q: L.sleepQ, who },
        stamps: [4, 11],
        stampText: { my: `${L.stamp4.my}\n\n${L.stamp11.my}`, en: `${L.stamp4.en}\n\n${L.stamp11.en}` },
        extra: L.part1,
        tomorrow: L.tomorrow,
      });
    } finally { nightBusy = false; }
  }

  // =============================================================================================
  // test hooks (window.__day7)
  // =============================================================================================
  function skipTo(name) {
    const at = BEATS.findIndex(([b]) => b === name);
    if (at < 0) return false;
    for (let i = 0; i < at; i++) for (const f of BEATS[i][1]) F(f, true);
    if (at > BEATS.findIndex(([b]) => b === 'played')) F('seat', 0);
    if (at > BEATS.findIndex(([b]) => b === 'ch11Done')) F('ncPromise', 0);
    if (F('slate6')) giveProof('rope', L.proofRope);
    if (F('keys') && !story.has('ownkey')) story.give('ownkey', 1, { quiet: true });
    if (F('bridge')) { try { (game.world.setFlagGate || ow?.setFlagGate)?.('bridgeOpen', true); } catch { /* ok */ } }
    if (F('benches')) { setClock(19); clearCarryLine(); }
    syncProps();
    syncDue = 0;
    return true;
  }
  const PLACES = {
    home: { x: ab.x, z: ab.z + 1.4 }, school: { x: Q.schoolDoor.x, z: 90.4 }, stage: { x: Q.square.x, z: 145.2 },
    snack: { x: 15, z: 61.2 }, street: { x: 0, z: 90.2 }, market: { x: 7, z: 290 }, fold: { x: 66, z: 300.5 }, board: { x: 73.6, z: 297.2 },
  };
  window.__day7 = {
    F, beats: BEATS.map(([b]) => b), skipTo,
    state: () => Object.fromEntries(Object.entries(save.flags).filter(([k]) => k.startsWith('d7.'))),
    go(place) { const q = PLACES[place]; if (!q) return false; if (!story.foot.active) return story.foot.toFoot().then(() => ow?.jump(q.x, q.z, 0)); ow?.jump(q.x, q.z, 0); return true; },
    sync() { syncProps(); sync(); },
    scenes: { morning, backRow, paintScene, sortScene, matchScene, yyTalkScene, knotScene, slate9Scene, duskScene, slate6Scene, orderScene, hangScene, teaScene, night },
    beat, runScene,
  };

  syncProps();
  setClock(clockH);

  return {
    talk,
    roomCast,
    roomOpts,
    enterRoom,
    leaveRoom,
    station,
    /** The page turns in place: this page's props, keep-out shapes and people go away. */
    dispose() {
      disposed = true;
      // (each step on its own: one failing never leaves the rest of the page behind in tomorrow)
      const step = (what, fn) => { try { fn(); } catch (err) { console.warn('day7 dispose', what, err); } };
      step('labels', () => { streetLabels?.dispose(); streetLabels = null; });
      for (const x of [...carryExtras, ...roomExtras]) step('extra', () => x.dispose());
      for (const o of objs) { try { o.dispose(); } catch { try { o.root?.removeFromParent(); } catch { /* gone */ } } }
      objs.length = 0;
      step('still line', dropStillLine);
      step('far cull', farRestore);
      step('keep-outs', () => keep.clear());
      step('clock tap', () => { const k = story.tapHooks.indexOf(clockHook); if (k >= 0) story.tapHooks.splice(k, 1); });
      step('desk', () => { if (ow && lightDesk0) ow.lightDesk = lightDesk0; });
      step('hut door', () => { if (ownHutDoor) delete DOORS.bridgehut; });
      step('live twins', () => useLive(story.openWorld, LIVE_TWINS, false));
      step('hands', () => { removeFake(story, 'd7handA'); removeFake(story, 'd7handB'); });
      for (const id of DAY_PEOPLE) step('person ' + id, () => { const e = story.people.get(id); if (e && !e.fake) story.remove(id); });
      if (window.__day7) window.__day7 = null;
    },
    async start() {
      if (F('done')) return;
      if (!F('progSeen')) {
        // the day opens at the Writing Room door; the postwoman comes over
        if (!story.foot.active) await story.foot.toFoot();
        story.refreshHud?.();
        const mp = game.maya.root.position;
        if (Math.hypot(mp.x - ab.x, mp.z - ab.z) > 12 && ow) ow.jump(ab.x, ab.z + 1.4, 0);
        syncDue = 0; sync();
        const ww = story.people.get('wintwar');
        if (ww) {
          ww.paused = true;
          await Promise.race([story.walkPerson('wintwar', game.maya.root.position.x + 1.15, game.maya.root.position.z + 0.05, 1.5), wait(8000)]);
          setTimeout(() => { ww.paused = false; }, 4000);
        }
        await morning();
      }
    },
    update,
  };
}
