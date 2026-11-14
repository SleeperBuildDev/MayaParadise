// Day 8 (Newsprint Junction, the Fold) — chapters 12 မယုံနဲ့ (Don't Believe) and 13 ကြောက်ဖို့ကောင်းတဲ့
// မသိခြင်း (The Frightening Not-Knowing). Main-quest beat: the midpoint. day8-spec.md; INDEX 13.2 / 9 win.
//
// Lessons (INDEX 14): ch 12 (p67-68) trust nothing just because it was heard, is an old saying, happened
// before, you thought it up, it fits your view, it is printed, or someone you revere said it ("Maya says");
// accept advice once you yourself understand it is good, blameless, praised by the wise and good for all.
// ch 13 (p69-73) one deed can be a 6 to you and a 9 to the other; fill your knowledge first, the right way of
// asking is knowledge too; knowing without goodwill does no good, goodwill without knowing comes out rude:
// hold them together. The midpoint: Nay Chi waited all day for Maya's word; Maya hands the question back,
// pins "not yet, go and look yourself", and Step back unlocks (global flag `stepBack`).
//
// Beats (any order inside each chapter; nothing ever points the way: every "where" is said or seen):
//   home      morning post at the Writing Room (Ma Wint War, notebook line, Ye Yint's letter, Toe Toe's
//             question, Nay Chi's note, the Little Stage and Little Key lift off)       d8.morning
//   market    (optional) Khwar Nyo: "I kept ONE pot"                    proof:mayasays  d8.khwar
//   west      Nay Chi under the bridge-board, waiting since dawn: hand the question back  d8.ncMet/ncHanded
//   bridge    first step on the east foot: the bridge is open on a printing day  proof:printday  d8.arrived
//   square    the "Maya says" slips at the notice board (L)                              d8.slipsRead
//             the seven reasons: Ko San (board), Ko Min (ladder) outside; Daw Sein, U Kan, Daw Hla in the
//             tea shop (room junctiontea); Moe Moe in the school (schoolroom); Ma Thida in her letter room
//             (letterroom)                                                               d8.met.<id>
//   tea shop  S sort at the door table (neither basket is enough)                        d8.sorted
//   well      L four looks (rings, oldmark, queue, pots)                 proof:well      d8.wellSeen
//   letters   T Ma Thida's talk, the first Step back (Moe Moe in the doorway)            d8.thidaTalk, stepBack
//   board     W Maya's own line (ownwords), pinned over the slips                        d8.pinned
//   press     Ko Wunna on the doorstep (d8.wunnaMet) -> inside: looks cases/labels/title, turnblock
//             (proof:sheet), his way of asking (d8.asked), U Tint's talk (d8.tintTalk), lockup (d8.locked,
//             d8.sheet), the glass (d8.ch13Done); the side door's back yard checks the Painted Map lane
//   close     the blank sheets; the seven walk to the well and ink their own; fivecard     d8.ch12Done
//   desks     `well` (and Day 7's `foldWest` if dark): pick the line you can see       d8.desk.*
//   home      (optional, evening) the "ask Maya" board: no answers tonight             d8.boardLine
//   night     at the Writing Room door: night page, stamps 12 and 13, save.day = 9     d8.done
//
// Test hooks: window.__day8 = { F, flags(), beats, skipTo(beat), goto(place), enter(room), run(name), W }.
// Every Burmese line is a draft for Maya (day8-lines.js, talks/day8.js).
import * as THREE from '../game/three.js';
import { sort } from './acts/sort.js';
import { turnblock } from './acts/turnblock.js';
import { lockup } from './acts/lockup.js';
import { ownwords } from './acts/ownwords.js';
import { nightPage, showLetter, showSlip, liftOff } from './post.js';
import { companionById } from './companions.js';
import { castById } from './cast.js';
import { registerDoors, DOORS } from './doors.js';
import { createPerson } from './people.js';
import { bridgeBoard, goldInkWell, inkJar, slipBoard, bridgeBox, teaCart, stepLadder, printShed } from './props4.js';
import { teaShop, schoolBench, carvingBench } from './props3.js';
import { eveningClass } from './props5.js';
import { ASK_BOARD } from './world/regions/home.js';
import { houseFront, WALKON_LOOKS } from './day8-props.js';
import { L, SLEPT7, SLEPT8 } from './day8-lines.js';
import { TALK_D8_THIDA, TALK_D8_TINT } from './talks/day8.js';
import { mergeStatic } from './merge-static.js';

export { SLEPT8 };

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const SEVEN = ['sein', 'kan', 'komin', 'moemoe', 'dawhla', 'kosan', 'thida'];
const WELL_LOOKS = ['rings', 'oldmark', 'queue', 'pots'];
const PRESS_LOOKS = ['cases', 'labels', 'title'];

// Places (world metres). The Junction district has roads and two desks but no buildings yet, so the day
// stands its own at these spots (SHARED NEEDS: regions/junction.js should own the fronts and DOORS).
// Camera rule: fronts on the north side of each street facing +Z; nothing tall just south of a road.
export const W = {
  // Envelope Market, Counter Lane north side (z 300)
  khwar: { x: 33.0, z: 297.7, h: 0.25 }, khwarBench: { x: 33.0, z: 296.4 },
  // the west bridgehead square (jSqW 64,300 -> foldW 79,300)
  board: { x: 75.4, z: 296.0 }, nc: { x: 74.3, z: 298.1, h: Math.PI / 2 },
  bridgeW: { x: 80.5, z: 300 }, bridgeE: { x: 118.0, z: 300 },
  // the bridge-foot street (foldE 119,300 -> jSqE 148,300), north side
  letter: { x: 124.0, z: 295.8 }, letterDoor: { x: 123.4, z: 297.65 }, box: { x: 125.9, z: 298.2 },
  kominHouse: { x: 133.4, z: 296.0 }, ladder: { x: 134.7, z: 298.15 }, komin: { x: 133.8, z: 298.6, h: 2.6 },
  // the notice-board square (north side west -> east: Ko Min's corner, tea shop, notice board, school)
  tea: { x: 141.0, z: 295.7 }, teaDoor: { x: 140.1, z: 297.6 }, cart: { x: 143.4, z: 298.05 },
  slips: { x: 151.6, z: 297.6 }, kosan: { x: 150.1, z: 298.9, h: 2.75 },
  school: { x: 159.6, z: 295.1 }, schoolDoor: { x: 159.6, z: 298.0 },
  well: { x: 149.6, z: 305.0 },
  queue: [[146.5, 305.1], [145.5, 305.5], [144.5, 305.9]],
  bench: { x: 141.6, z: 309.2 },
  ncSquare: { x: 154.1, z: 299.0, h: -2.5 },
  // the street running east from the square: the Gold Ink Press, first on its north side
  shed: { x: 172.0, z: 295.2 }, shedDoor: { x: 172.0, z: 297.8 }, kw: { x: 170.6, z: 298.7, h: 0.35 },
  kwBoard: { x: 155.6, z: 299.3, h: -2.2 },
  // home: the "ask Maya" board on the Post Office wall (main door 16.3, 3.0)
  askBoard: { x: ASK_BOARD.x, z: ASK_BOARD.z }, // the shared board (home.js ASK_BOARD; its look: story.board)
  postOffice: { x: 15.4, z: 4.5 },
};

const PROOF = {
  mayasays: { my: 'မင်တစ်အိုး သိမ်းထားဖို့ ခွာညိုတစ်ယောက်တည်းကို ပြောခဲ့တာ။ တံဆိပ်ထုမယ့်နေ့ တစ်နေ့အတွက်ပဲ။ ရပ်ကွက်တစ်ခုလုံးကို မဟုတ်ဘူး။', en: 'I told one carver, Khwar Nyo, to keep one pot of ink, for one stamp day. Not the whole Junction.' },
  well: { my: 'ဒီနေ့ ရွှေမင်တွင်း ကိုယ်တိုင် သွားကြည့်တယ်။ တတိယအကွင်းအထိ ပြည့်နေတယ်။ မနက်ဖြန် ထပ်ကြည့်ရမယ်။', en: 'I looked in the gold-ink well myself today: full to the third ring. Look again tomorrow.' },
  post: { my: 'စာတိုက်ပုံးက မနက် 6:00 မှာ ထုတ်တယ်။ ပုံးပေါ်က ပြားမှာ ရေးထားတယ်။', en: 'The bridge-box is cleared at 6:00 a.m. It says so on the box.' },
  printday: { my: 'ပုံနှိပ်နေ့တွေမှာလည်း တံတား ဖွင့်ထားတယ်။ ကိုယ်တိုင် ဖြတ်လာခဲ့တယ်။', en: 'The bridge is open on printing days. I crossed it myself.' },
  printer: { my: 'ဦးတင့်က လူငယ်ကို မုန်းတာ မဟုတ်ဘူး။ စာစီသင်ခွင့်ကို သူကိုယ်တိုင် ကမ်းခဲ့တာ။', en: "U Tint doesn't hate young people. He offered the type-setting chance himself." },
  sheet: { my: 'နေ့စဉ်စာရွက်မှာလည်း အမှား ပါတတ်တယ်။ ဒီနေ့ စာတိုက်ပုံး အချိန်ကို မှားပြီး ရိုက်မိတယ်။', en: 'The day sheet can be wrong too. Today it printed the box time wrong.' },
};
// the plate on the box, read aloud (new; the plate itself is the prop's canvas)
const BOX_LINE = [{ my: '(ပုံးပေါ်က ပြားမှာ "စာထုတ်ချိန် မနက် 6:00" တဲ့။ ကိုးနာရီ မဟုတ်ဘူး။)', en: '(The plate on the box says "Collection 6:00 a.m." Not nine.)' }];
const BOX_AGAIN = [{ my: '(မနက် 6:00။ ပြားပေါ်မှာ ရေးထားတာ။)', en: '(6:00 a.m. It says so on the plate.)' }];
// the room camera: close and low, following her (never the far whole-room view)
const ROOM_CLOSE = { tilt: 36, width: 4.8, minHeight: 0, height: 0.85, stiffness: 4 };

export async function create(story) {
  const { game, dialog: D, save } = story;
  const F = (k, v) => story.flag(`d8.${k}`, v);
  const ow = story.openWorld || null;
  const scene = game.world.scene;
  const v3 = new THREE.Vector3();
  const aboutDoor = game.world.places.find((p) => p.id === 'about')?.door || { x: 0, z: 7 };
  const ab = { x: aboutDoor.x, z: aboutDoor.z };

  // ---- test hooks: everything before a beat done (window.__day8.skipTo, or ?story&d8=<beat> on load)
  const BEATS = [
    ['morning', () => { F('morning', true); for (const id of ['stage', 'key']) story.companions.add(id); for (const r of ['post', 'printday', 'mayasays', 'well']) hear(r); }],
    ['khwar', () => { F('khwar', true); giveProof('mayasays', { quiet: true }); }],
    ['naychi', () => { F('ncMet', true); F('ncHanded', true); }],
    ['arrive', () => { F('arrived', true); giveProof('printday', { quiet: true }); }],
    ['slips', () => F('slipsRead', true)],
    ['seven', () => { for (const id of SEVEN) F(`met.${id}`, true); F('met7said', true); }],
    ['sort', () => F('sorted', true)],
    ['well', () => { for (const id of WELL_LOOKS) F(`look.${id}`, true); F('wellSeen', true); giveProof('well', { quiet: true }); }],
    ['thida', () => { F('thidaTalk', true); story.flag('stepBack', true); }],
    ['pin', () => F('pinned', true)],
    ['wunna', () => F('wunnaMet', true)],
    ['looks', () => { for (const id of PRESS_LOOKS) F(`look.${id}`, true); }],
    ['turn', () => { F('turned', true); giveProof('sheet', { quiet: true }); giveProof('printer', { quiet: true }); }],
    ['ask', () => F('asked', true)],
    ['tint', () => F('tintTalk', true)],
    ['lockup', () => { F('locked', true); if (F('pinned')) F('sheet', true); story.give('glass', 1, { quiet: true }); F('ch13Done', true); }],
    ['close', () => { F('ch12Done', true); story.give('fivecard', 1, { quiet: true }); }],
    ['night', () => {}],
  ];
  const askSkip = new URLSearchParams(location.search).get('d8');
  if (askSkip && !story.d8Skipped) {
    story.d8Skipped = true;
    const k = BEATS.findIndex((b) => b[0] === askSkip);
    for (let i = 0; i < k; i++) BEATS[i][1]();
    story.persist();
  }

  // ---- the day's scripted look: morning light all day, evening once both chapters are done
  game.day?.set?.(F('ch12Done') && F('ch13Done') ? 17.5 : 9);
  game.applyDayLook?.();

  // ---- the Fold's bridge is open (Day 7 raised the boom)
  try { ow?.setFlagGate?.('bridgeOpen', true); } catch (e) { console.warn('bridge gate', e); }
  if (!save.flags.bridgeOpen) story.flag('bridgeOpen', true);

  // =============================================================================================
  // props, keep-out shapes, doors
  // =============================================================================================
  const props = [];
  const obs = [];
  function addProp(h, x, z, ry = 0) {
    if (!h?.root) return h;
    h.root.position.set(x, 0, z);
    h.root.rotation.y = ry;
    scene.add(h.root);
    props.push(h);
    return h;
  }
  function addOb(o) {
    obs.push(o);
    if (ow?.space?.add) ow.space.add([o]); else story.foot.obstacles.push(o);
  }
  const boxOb = (cx, cz, w, d) => addOb({ type: 'box', minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 });
  const circOb = (x, z, r) => addOb({ type: 'circle', x, z, r });

  // the west bridgehead: Nay Chi's board, ten empty hooks (she took her slates down at dawn to carry them)
  addProp(bridgeBoard({ slates: [null, null, null, null, null, null, null, null, null, null], keys: 0 }), W.board.x, W.board.z, 0);
  boxOb(W.board.x, W.board.z - 0.05, 2.8, 0.45);
  // the Market: Khwar Nyo's carving bench
  const carving = addProp(carvingBench({ cold: false, block: 'cloth' }), W.khwarBench.x, W.khwarBench.z, 0);
  boxOb(W.khwarBench.x, W.khwarBench.z, 1.4, 0.8);
  // the east foot: Ma Thida's blue door and the red bridge-box beside it
  addProp(houseFront({ w: 4.4, d: 3.6, h: 3.0, wall: '#F1ECE1', trim: '#3F6684', door: { x: -0.6, w: 0.85, color: '#5F8DB0' }, sign: 'envelope' }), W.letter.x, W.letter.z);
  boxOb(W.letter.x, W.letter.z, 4.6, 3.8);
  addProp(bridgeBox(), W.box.x, W.box.z, 0);
  circOb(W.box.x, W.box.z, 0.3);
  // Ko Min's corner house with the half-repainted sign and his step ladder
  addProp(houseFront({ w: 3.6, d: 3.2, h: 3.2, wall: '#E9DCC0', wallD: '#CDBB98', trim: '#7A5434', roof: '#7E3828', door: { x: 0.7, w: 0.8, color: '#7A5434' }, sign: 'shop', win: 0.9 }), W.kominHouse.x, W.kominHouse.z);
  boxOb(W.kominHouse.x, W.kominHouse.z, 3.8, 3.4);
  addProp(stepLadder({ jar: true }), W.ladder.x, W.ladder.z, 0.15);
  boxOb(W.ladder.x, W.ladder.z - 0.05, 0.62, 0.8);
  // Daw Sein's tea shop and her cart, four jars on its rail (too heavy to push now)
  const tea = addProp(teaShop({ awning: 'plain' }), W.tea.x, W.tea.z);
  boxOb(W.tea.x, W.tea.z, 5.4, 4.0);
  const cart = addProp(teaCart({ jars: F('ch12Done') ? 0 : 4 }), W.cart.x, W.cart.z, 0);
  boxOb(W.cart.x, W.cart.z, 1.7, 1.0);
  // the notice board of "Maya says" slips
  const board = addProp(slipBoard({}), W.slips.x, W.slips.z, 0);
  boxOb(W.slips.x, W.slips.z - 0.06, 3.5, 0.4);
  if (F('pinned')) board.pin(F('sheet') ? L.blankSheet : L.pinSheet);
  // the school (north-east corner)
  addProp(eveningClass({ open: 1, lit: 0.5, title: { my: 'လမ်းဆုံ ကျောင်း', en: 'Junction School' }, chalk: ['ဒီနေ့ — ပေါင်းခြင်း', 'မင် ယူလာပါ'] }), W.school.x, W.school.z);
  boxOb(W.school.x, W.school.z, 7.2, 5.1);
  // the Gold Ink Press, the chalk slate on its easel left of the door
  const shed = addProp(printShed({ doors: 1, slate: true }), W.shed.x, W.shed.z);
  boxOb(W.shed.x, W.shed.z, 6.7, 5.2);
  // the gold-ink well in the middle of the square; a bench on the south side
  const well = addProp(goldInkWell({ level: 0.6, pots: 4 }), W.well.x, W.well.z);
  circOb(W.well.x, W.well.z, 1.08);
  addProp(schoolBench(), W.bench.x, W.bench.z, 0);
  boxOb(W.bench.x, W.bench.z, 1.6, 0.5);
  // home: the "ask Maya" board on the Post Office wall (31 notes; it stopped growing)
  // the "ask Maya" board (the shared one): 31 notes, it stopped growing; tonight Maya pins one line of her own
  const askBoard = { setText: () => story.board.set(askState()) };
  function askState() {
    return { notes: 31, replies: 4, notice: F('boardLine') ? [{ my: 'မယုံနဲ့ဦး။', en: "Don't believe it yet." }, { my: 'ကိုယ်တိုင်', en: 'Go and' }, { my: 'သွားကြည့်ပါ။', en: 'see for yourself.' }, { my: '— မာရာ', en: '— Maya' }] : null }; // DRAFT(my)
  }
  story.board.set(askState());

  // the queue at the well: unnamed people with jars (looks only)
  const walkons = [];
  if (!F('ch12Done')) {
    W.queue.forEach(([x, z], i) => {
      const p = createPerson(WALKON_LOOKS[i % WALKON_LOOKS.length]);
      p.root.position.set(x, 0, z);
      p.root.rotation.y = Math.PI / 2;
      p.root.userData.isPerson = true;
      scene.add(p.root);
      const jar = inkJar({ full: true });
      jar.root.position.set(x + 0.32, 0, z + 0.18);
      scene.add(jar.root);
      walkons.push({ p, jar });
      circOb(x, z, 0.3);
    });
  }
  // (the queue's jars never move while they stand: one mesh per material, 3 draw calls instead of 9)
  let jarMerge = walkons.length ? mergeStatic(walkons.map((w) => w.jar.root), scene, { name: 'd8-jars' }) : null;
  function removeWalkons() {
    jarMerge?.undo(); jarMerge = null;
    for (const w of walkons) { w.p.root.removeFromParent(); w.p.dispose(); w.jar.root.removeFromParent(); w.jar.dispose?.(); }
    walkons.length = 0;
  }

  // doors into the four Junction rooms (doors.js registry; only where nobody registered them yet)
  const myDoors = [];
  for (const d of [
    { room: 'letterroom', x: W.letterDoor.x, z: W.letterDoor.z, facing: 0, r: 0.8 },
    { room: 'junctiontea', x: W.teaDoor.x, z: W.teaDoor.z, facing: 0, r: 0.8 },
    { room: 'schoolroom', x: W.schoolDoor.x, z: W.schoolDoor.z, facing: 0, r: 0.9 },
    { room: 'press', x: W.shedDoor.x, z: W.shedDoor.z, facing: 0, r: 1.0 },
  ]) if (!DOORS[d.room]) { registerDoors([{ ...d, region: 'junction' }]); myDoors.push(d.room); }

  // the Painted Map's bright lane from behind the press to the well (rumour `paint`)
  if (story.has('paintedmap') && !story.paint.get('d8-lane') && story.flag('rumour.paint') !== 'checked') {
    story.paint.add({ id: 'd8-lane', rumour: 'paint', pts: [[168.2, 293.0], [163.5, 298.6], [156.5, 302.6], [150.6, 304.3]], at: { x: 167.6, z: 295.0 } });
  }
  const onRub0 = story.paint.onRub;
  story.paint.onRub = (s) => {
    call({ f: onRub0 }, 'f', s);
    if (s?.id === 'd8-lane') { F('rumour.paint', true); story.bark('maya', L.knee[0], 4200); }
  };

  // =============================================================================================
  // people
  // =============================================================================================
  const mine = new Set();
  const spawn = (id, at) => { const e = story.spawn(id, at); if (e) mine.add(id); return e; };
  const job = (id, spot, mood, r = 1.2, o = {}) => story.setJob(id, { area: { x: spot.x, z: spot.z, r }, spot: { x: spot.x, z: spot.z, h: spot.h ?? 0 }, mood, workChance: 0.7, workFor: [6, 12], ...o });

  if (!F('morning')) spawn('wintwar', { x: ab.x + 2.6, z: ab.z + 1.2, heading: -Math.PI / 2 });
  else { spawn('wintwar', { x: W.postOffice.x, z: W.postOffice.z, heading: 0 }); job('wintwar', { ...W.postOffice, h: 0 }, 'read', 1.6); }
  spawn('khwarnyo', { x: W.khwar.x, z: W.khwar.z, heading: W.khwar.h });
  job('khwarnyo', W.khwar, 'work', 0.8);
  if (!F('ncHanded')) { const e = spawn('naychi', { x: W.nc.x, z: W.nc.z, heading: W.nc.h }); if (e) { e.baseMood = 'down'; e.p.setMood('down'); } }
  else if (!F('ch12Done')) spawn('naychi', { x: W.ncSquare.x, z: W.ncSquare.z, heading: W.ncSquare.h });
  else spawn('naychi', { x: W.well.x + 2.4, z: W.well.z + 1.6, heading: -0.9 });
  spawn('kosan', { x: W.kosan.x, z: W.kosan.z, heading: W.kosan.h });
  spawn('komin', { x: W.komin.x, z: W.komin.z, heading: W.komin.h });
  job('komin', W.komin, 'work', 0.6, { workChance: 0.85 });
  if (!F('wunnaMet')) { spawn('kowunna', { x: W.kw.x, z: W.kw.z, heading: W.kw.h }); job('kowunna', W.kw, 'sweep', 0.9, { workChance: 0.9 }); }
  else if (F('ch13Done')) spawn('kowunna', { x: W.kwBoard.x, z: W.kwBoard.z, heading: W.kwBoard.h });
  if (F('ch12Done')) placeAfterClose(true);

  /** After the close: U Kan and Daw Hla on the bench, Ma Thida by the well (Daw Sein and Moe Moe are indoors). */
  function placeAfterClose(fresh) {
    const spots = { kan: { x: W.bench.x - 0.5, z: W.bench.z + 0.55, h: 0.2 }, dawhla: { x: W.bench.x + 0.5, z: W.bench.z + 0.55, h: -0.2 }, thida: { x: W.well.x - 1.5, z: W.well.z + 1.3, h: 0.7 } };
    for (const [id, s] of Object.entries(spots)) {
      if (fresh) spawn(id, { x: s.x, z: s.z, heading: s.h });
      else moveTo(id, s);
    }
  }

  // =============================================================================================
  // helpers
  // =============================================================================================
  const met = (id) => !!F(`met.${id}`);
  const allMet = () => SEVEN.every(met);
  const looked = (ids) => ids.every((id) => F(`look.${id}`));
  function hear(id) { if (story.flag(`rumour.${id}`) !== 'checked') story.flag(`rumour.${id}`, 'pencil'); }
  function checked(id) { story.flag(`rumour.${id}`, 'checked'); F(`rumour.${id}`, true); }
  function giveProof(id, o = {}) {
    if (story.has(`proof:${id}`)) { checked(id); return false; }
    save.proofs[id] = PROOF[id];
    story.give(`proof:${id}`, 1, o);
    checked(id);
    return true;
  }
  function mayaXZ() {
    if (story.foot?.active && !story.inRoom) return { x: story.foot.pos.x, z: story.foot.pos.y };
    const p = game.car.root.position;
    return { x: p.x, z: p.z };
  }
  function walkMaya(x, z, ms = 7000) {
    return new Promise((r) => { let done = false; const fin = () => { if (!done) { done = true; r(); } }; story.foot.walkTo(x, z, fin); setTimeout(fin, ms); });
  }
  function faceMaya(x, z) {
    const p = story.foot.pos;
    story.foot.walker.heading = Math.atan2(x - p.x, z - p.y);
    game.maya.root.rotation.set(0, story.foot.walker.heading, 0);
  }
  /** Walk someone to a room spot name or { x, z, h } (snaps there if the walk takes too long). */
  async function moveTo(id, at, speed = 1.3) {
    const e = story.people.get(id);
    if (!e) return;
    const s = typeof at === 'string' ? story.room?.spots?.[at] : at;
    if (!s) return;
    await Promise.race([story.walkPerson(id, s.x, s.z, speed), wait(12000)]);
    const h = s.h ?? s.heading;
    if (e.walking) {
      e.walking = null;
      e.p.root.position.set(s.x, 0, s.z);
      e.ob.x = s.x; e.ob.z = s.z;
    }
    e.home = { x: s.x, z: s.z, h: h ?? e.home.h };
    if (h != null) e.p.root.rotation.y = h;
  }
  /** A script that is not a talk with someone (a tap, a station, an act): one at a time. */
  async function scripted(fn) {
    if (story.talking || game.busy) return;
    story.talking = true;
    try { await fn(); } catch (err) { console.error('day 8', err); } finally {
      story.talking = false;
      game.ui.cinema(false);
      game.rig.release();
    }
  }
  function pinBoard() { board.pin(F('sheet') ? L.blankSheet : F('pinned') ? L.pinSheet : null); }
  async function pullPress(room) {
    for (let i = 0; i <= 8; i++) { call(room, 'pull', i / 8); await wait(35); }
    call(game.audio, 'play', 'thud');
    for (let i = 8; i >= 0; i--) { call(room, 'pull', i / 8); await wait(45); }
  }
  async function checkSeven() {
    if (!allMet() || F('met7said')) return;
    F('met7said', true);
    await D.say('maya', L.r7Maya, { face: 'think' });
    if (story.inRoom !== 'junctiontea') await D.say('maya', L.sitThink, { face: 'think' });
  }
  async function reason(id, face = 'worried') {
    await D.say(id, L.r7[id], { face });
    if (L.where[id]) await D.say(id, L.where[id], { face: 'smile' });
    F(`met.${id}`, true);
    await checkSeven();
  }

  // =============================================================================================
  // 4. the morning at home
  // =============================================================================================
  let morningBusy = false;
  async function morning() {
    if (F('morning') || morningBusy) return;
    morningBusy = true;
    game.day?.set?.(9); game.applyDayLook?.();
    const wasTalking = story.talking;
    story.talking = true;
    try {
      const ww = story.people.get('wintwar');
      const mp = game.maya.root.position;
      if (ww && story.foot.active && Math.hypot(ww.p.root.position.x - mp.x, ww.p.root.position.z - mp.z) > 1.6) {
        ww.paused = true;
        await Promise.race([story.walkPerson('wintwar', mp.x + 1.15, mp.z + 0.05, 1.5), wait(9000)]);
        ww.paused = false;
        if (ww.walking) ww.walking = null;
        ww.p.root.rotation.y = Math.atan2(mp.x - ww.p.root.position.x, mp.z - ww.p.root.position.z);
      }
      game.ui.cinema(true);
      await D.say('wintwar', L.ww1, { face: 'smile' });
      // the notebook line from the house it slept in last night (Day 7's own table, when day7.js exports it)
      const d7 = await import('./day7.js').catch(() => null);
      const table = d7?.SLEPT7 || SLEPT7;
      const slept = save.notebook.sleptAt.filter((s) => s.day === 7).pop();
      if (slept && table[slept.who]) await showSlip(game, table[slept.who], { kind: 'notebook' });
      await showLetter(game, L.yyNote, { from: 'yeyint' });
      await showSlip(game, L.ttQ, { kind: 'question' });
      await showLetter(game, story.flag('d3.ncRoad') === 'square' ? L.ncNoteSquare : L.ncNote, { from: 'naychi' });
      await D.say('maya', L.ncMaya, { face: 'worried' });
      // yesterday's companions lift off the dried page
      await D.say('maya', L.lift, { face: 'surprised' });
      const due = ['stage', 'key', ...story.companions.due(8).map((c) => c.id)].filter((id, i, a) => a.indexOf(id) === i);
      for (const id of due) {
        const c = companionById(id);
        if (!c || story.companions.has(id)) continue;
        await liftOff(game, c, {});
        story.companions.add(id);
      }
      await D.say('maya', L.liftMaya, { face: 'smile' });
      await D.say('wintwar', L.ww2, { face: 'think' });
      for (const r of ['post', 'printday', 'mayasays', 'well']) hear(r);
      F('morning', true);
      // she goes back to the Post Office (her sorting room door); the day is the player's
      if (ww) { story.walkPerson('wintwar', W.postOffice.x, W.postOffice.z, 1.3).then(() => job('wintwar', { ...W.postOffice, h: 0 }, 'read', 1.6)); }
    } finally {
      game.ui.cinema(false);
      story.talking = wasTalking;
      morningBusy = false;
    }
  }

  // =============================================================================================
  // 5. Nay Chi at the bridge-board
  // =============================================================================================
  async function naychiTalk() {
    const nc = story.people.get('naychi');
    await D.say('naychi', L.nc1, { face: 'worried' });
    if (story.flag('d6.readToHer')) await D.say('naychi', L.ncRead, { face: 'sad' });
    F('ncMet', true);
    for (;;) {
      const i = await D.choose(L.ncChoices);
      if (i === 0) { await D.say('naychi', L.ncGo, { face: 'happy' }); await D.say('maya', L.ncGoMaya, { face: 'think' }); continue; }
      if (i === 1) { await D.say('naychi', L.ncSpeak, { face: 'smile' }); await D.say('maya', L.ncSpeakMaya, { face: 'think' }); continue; }
      break;
    }
    await D.say('naychi', L.ncHand, { face: 'sad', emote: 'slump' });
    await D.say('maya', L.ncHandMaya, { face: 'sad' });
    F('ncHanded', true);
    // she does not decide today (her own step is Day 11's); she crosses to read the board, key in hand
    if (nc) {
      nc.baseMood = null; nc.p.setMood(null); nc.job = null;
      (async () => {
        for (const p of [W.bridgeW, W.bridgeE, W.ncSquare]) await Promise.race([story.walkPerson('naychi', p.x, p.z, 1.2), wait(40000)]);
        const e = story.people.get('naychi');
        if (e && !story.inRoom) { e.walking = null; e.p.root.rotation.y = W.ncSquare.h; e.home = { x: e.ob.x, z: e.ob.z, h: W.ncSquare.h }; }
      })();
    }
  }

  // =============================================================================================
  // 7.1 the board; 7.6 Maya's own line
  // =============================================================================================
  async function readSlips() {
    game.ui.cinema(true);
    for (const s of L.slips) {
      await showSlip(game, s.slip, { kind: 'notebook', title: L.slipTitle });
      await D.say('maya', [s.seen], { face: 'think' });
    }
    if (!story.has('proof:mayasays')) { await D.say('maya', L.ownPage, { face: 'think' }); giveProof('mayasays'); }
    await D.say('maya', L.slipsMaya, { face: 'sad' });
    F('slipsRead', true);
  }
  async function pinLine() {
    const r = await ownwords({ title: L.ownTitle, hint: L.ownHint, prompt: L.ownPrompt, fragments: L.ownFragments, need: 3 });
    if (!r?.ok) return;
    F('pinned', true);
    pinBoard();
    call(game.audio, 'play', 'page');
    game.ui.cinema(true);
    await D.say('maya', L.pinnedMaya, { face: 'think' });
    // the reply letter's back page changes by itself, in her hand
    await showSlip(game, L.replyCross, { kind: 'notebook', title: L.replyCrossTitle });
    await showSlip(game, L.replyNew, { kind: 'notebook', title: L.replyTitle });
    if (F('locked') && !F('sheet')) await printNow();
  }
  /** After the lock-up: Ko Wunna runs the blank sheet off at once (the frame was ready). */
  async function printNow() {
    const kw = story.people.get('kowunna');
    if (!kw || story.inRoom) return; // else it prints the next time Maya visits the press
    await D.say('kowunna', L.kwPrintNow, { face: 'happy' });
    kw.job = null;
    await Promise.race([story.walkPerson('kowunna', W.shedDoor.x, W.shedDoor.z + 0.7, 1.9), wait(14000)]);
    await wait(900);
    call(game.audio, 'play', 'thud');
    await Promise.race([story.walkPerson('kowunna', W.kwBoard.x, W.kwBoard.z, 1.9), wait(14000)]);
    const e = story.people.get('kowunna');
    if (e) { e.walking = null; e.p.root.rotation.y = W.kwBoard.h; e.home = { x: e.ob.x, z: e.ob.z, h: W.kwBoard.h }; }
    F('sheet', true);
    pinBoard();
    await D.say('kowunna', L.kwSheets, { face: 'happy' });
  }
  async function boardTap() {
    if (!F('slipsRead')) return readSlips();
    if (F('thidaTalk') && !F('pinned')) return pinLine();
    if (!met('kosan') && story.people.get('kosan')) { game.ui.cinema(true); return reason('kosan', 'think'); } // Ko San reads the handbill aloud
    await D.say('maya', L.boardAgain, { face: 'think' });
  }

  // =============================================================================================
  // 7.3 sort (Daw Sein's tea shop, the door table)
  // =============================================================================================
  async function sortScene() {
    if (F('sorted') || !allMet()) return;
    const sp = story.room?.spots?.maya;
    if (sp) { await walkMaya(sp.x, sp.z); faceMaya(sp.x - 0.4, sp.z - 1.2); }
    if (story.people.get('sein')) story.bark('sein', L.seinCup[0], 2600);
    await wait(500);
    const r = await sort({
      title: L.sortTitle, hint: L.sortHint, baskets: L.baskets,
      slips: L.sortSlips.map((s) => ({ ...s, line: L.r7[s.who][0] })),
      stampAll: L.stampAll, wrong: 'repeat',
    });
    if (!r?.ok) return;
    game.ui.cinema(true);
    await D.say('maya', L.sortDone, { face: 'think' });
    await D.say('maya', L.fiveRise, { face: 'surprised' });
    await D.say('maya', L.sortOwnBook, { face: 'smile' });
    F('sorted', true);
  }

  // =============================================================================================
  // 7.4 the well: four looks
  // =============================================================================================
  async function lookWell(id) {
    game.ui.cinema(true);
    if (!F(`look.${id}`)) {
      await D.say('maya', [L.look[id].pencil], { face: 'think' });
      call(game.audio, 'play', 'sparkle');
      await D.say('maya', [L.look[id].gold], { face: 'smile' });
      F(`look.${id}`, true);
    } else await D.say('maya', [L.look[id].gold], { face: 'smile', auto: true });
    if (looked(WELL_LOOKS) && !F('wellSeen')) {
      await D.say('maya', L.wellAll, { face: 'happy' });
      giveProof('well');
      F('wellSeen', true); // (Moe Moe now goes with her empty pot to Ma Thida's doorway: roomCast)
    }
  }

  // =============================================================================================
  // 7.5 Ma Thida's talk (letterroom)
  // =============================================================================================
  async function thidaTalk() {
    if (!met('thida')) return reason('thida', 'smile');
    if (F('ch12Done')) return D.say('thida', [L.looked.thida], { face: 'smile' });
    if (F('thidaTalk')) return D.say('thida', L.thidaNotYet, { face: 'think' });
    if (!(F('sorted') && F('wellSeen'))) return D.say('thida', L.thida, { face: 'smile' });
    if (story.talk.waiting(TALK_D8_THIDA.id)) return D.say('thida', L.thidaNotYet, { face: 'think' });
    story.use('mug');
    const r = await story.talk.run(TALK_D8_THIDA);
    if (!r?.won) {
      await D.say('thida', L.thidaNotYet, { face: 'think' });
      if (r?.reason === 'lean') await D.say('maya', L.thidaLean, { face: 'sad' });
      return;
    }
    // without a word: she fills Moe Moe's pot in the doorway, then lifts eleven jars into the basket
    const room = story.room;
    const mm = story.people.get('moemoe');
    const ms = room?.spots?.moemoe;
    if (mm && ms) {
      await moveTo('thida', { x: ms.x + 0.1, z: ms.z - 0.8, h: 0 });
      call(story.people.get('thida')?.p, 'emote', 'bow');
      call(game.audio, 'play', 'sparkle');
      await wait(700);
      call(mm.p, 'emote', 'cheer');
      await wait(900);
      await moveTo('moemoe', 'door', 1.8);
      if (story.inRoom === 'letterroom') story.remove('moemoe');
    }
    await moveTo('thida', 'thidaShelf');
    call(room, 'setJars', 1);
    await moveTo('thida', 'thidaBasket');
    call(room, 'setBasket', 11);
    await moveTo('thida', 'thida');
    F('thidaTalk', true);
    story.flag('stepBack', true); // global: every later talk may have a stone that is theirs
    await showSlip(game, L.stepLine, { kind: 'notebook', title: L.stepTitle });
  }

  // =============================================================================================
  // 6. ch 13: Ko Wunna, the press, U Tint
  // =============================================================================================
  async function wunnaHook() {
    if (F('ncMet')) await D.say('kowunna', L.wunna, { face: 'worried' });
    await D.say('kowunna', L.kw1, { face: 'worried', emote: 'shrug' });
    await D.say('kowunna', L.kwWait, { face: 'smile' });
    F('wunnaMet', true);
    // he goes back in through the double doors (and is inside when Maya walks in)
    const e = story.people.get('kowunna');
    if (e) {
      e.job = null;
      story.walkPerson('kowunna', W.shedDoor.x, W.shedDoor.z + 0.5, 1.4).then(() => { if (!story.inRoom && !F('ch13Done')) story.remove('kowunna'); });
    }
  }
  async function pressLook(id) {
    game.ui.cinema(true);
    if (F(`look.${id}`)) return D.say('maya', [L.look[id].gold], { face: 'smile', auto: true });
    await D.say('maya', [L.look[id].pencil], { face: 'think' });
    if (id === 'title') await D.say('maya', [L.titlePress], { face: 'surprised' });
    call(game.audio, 'play', 'sparkle');
    await D.say('maya', [L.look[id].gold], { face: id === 'title' ? 'sad' : 'smile' });
    F(`look.${id}`, true);
    if (id === 'title' && story.people.get('kowunna')) await D.say('kowunna', L.kwTitle, { face: 'worried' });
  }
  async function turnScene() {
    const r = await turnblock({ title: L.turnTitle, hint: L.turnHint, glyph: '6', sides: L.turnSides });
    if (!r?.ok) return;
    game.ui.cinema(true);
    await D.say('maya', L.turnDone, { face: 'think' });
    F('turned', true);
    giveProof('sheet');
    moveTo('utint', 'utintStone'); // he sets the block down on the stone and stays behind it
  }
  async function draftsScene() {
    await D.say('kowunna', L.kwAskQ, { face: 'think' });
    for (;;) {
      const i = await D.choose(L.kwDrafts);
      if (i === 0) { await D.say('kowunna', L.kwAll, { face: 'think' }); continue; }
      if (i === 1) { await D.say('kowunna', L.kwNone, { face: 'worried' }); continue; }
      break;
    }
    await D.say('kowunna', L.kwRight, { face: 'smile' });
    await D.say('maya', L.askedMaya, { face: 'smile' });
    F('asked', true);
    await D.say('kowunna', L.kwTalkToHim, { face: 'smile' });
    moveTo('kowunna', 'kowunnaBench');
  }
  async function tintTalk() {
    if (story.inRoom !== 'press') return D.say('utint', L.tintAfter, { face: 'smile' });
    if (F('ch13Done')) {
      if (F('pinned') && !F('sheet')) return printBlankAtPress();
      return D.say('utint', L.tintAfter, { face: 'smile' });
    }
    if (F('locked')) return glassClose();
    if (F('tintTalk')) return lockupScene();
    if (!F('turned') || !F('asked')) return D.say('utint', L.tint, { face: 'hot' });
    if (story.talk.waiting(TALK_D8_TINT.id)) return D.say('utint', L.tintNotYet, { face: 'think' });
    story.use('mug');
    const r = await story.talk.run(TALK_D8_TINT);
    if (!r?.won) { await D.say('utint', L.tintNotYet, { face: 'think' }); return; }
    F('tintTalk', true);
    await lockupScene();
  }
  async function lockupScene() {
    const room = story.room;
    await Promise.all([moveTo('kowunna', 'kowunnaStone'), moveTo('utint', 'utintStone')]);
    const r = await lockup({
      title: L.lockTitle, hint: L.lockHint, caller: 'utint', setter: 'kowunna',
      lines: [
        ['ပြင်ဆင်ချက်', '·', 'တံတားထိပ်', 'စာတိုက်ပုံး'],
        ['မနက်', '6:00', 'မှာ', 'ထုတ်သည်။'],
        F('pinned') ? ['ကိုယ်တိုင်', 'သွားကြည့်ခဲ့တယ်', '—', '______'] : null, // the blank sheet under Maya's line
      ],
      turnable: ['6:00'],
      quoin: { band: [0.42, 0.58] },
      wrong: L.lockWrong,
    });
    if (!r?.ok) return;
    F('locked', true);
    if (F('pinned')) F('sheet', true);
    game.ui.cinema(true);
    await D.say('maya', L.pullBar, { face: 'happy' });
    await pullPress(room);
    if (!F('pinned')) await D.say('utint', L.tintBring, { face: 'think' });
    await glassClose();
  }
  async function glassClose() {
    await D.say('utint', L.tintEnd, { face: 'smile' });
    story.give('glass');
    if (story.people.get('kowunna')) await D.say('kowunna', L.kwEnd, { face: 'happy' });
    await D.say('maya', L.mayaEnd13, { face: 'think' });
    F('ch13Done', true);
    pinBoard();
    if (story.people.get('kowunna')) {
      await D.say('kowunna', L.kwRun, { face: 'happy' });
      moveTo('kowunna', 'door', 2.0).then(() => { if (story.inRoom === 'press') story.remove('kowunna'); });
    }
  }
  async function printBlankAtPress() {
    game.ui.cinema(true);
    await D.say('utint', L.tintPrintBlank, { face: 'smile' });
    await pullPress(story.room);
    F('sheet', true);
    pinBoard();
  }
  async function backYard() {
    game.ui.cinema(true);
    const s = story.paint.get('d8-lane');
    if (s && s.state === 'paint') {
      await D.say('maya', L.backYard, { face: 'think' });
      story.paint.rub('d8-lane');
      F('rumour.paint', true);
      await D.say('maya', L.knee, { face: 'smile' });
    } else await D.say('maya', L.backYardNoMap, { face: 'smile' });
  }

  // =============================================================================================
  // 7.7 the close: blank sheets, the seven look and ink their own
  // =============================================================================================
  let closing = false;
  async function closeScene() {
    if (closing || F('ch12Done')) return;
    closing = true;
    story.talking = true;
    game.ui.cinema(true);
    const wl = W.well;
    try {
      // the five from indoors come out of their own doors
      for (const [id, d] of [['sein', W.teaDoor], ['kan', W.teaDoor], ['dawhla', W.teaDoor], ['moemoe', W.schoolDoor], ['thida', W.letterDoor]]) {
        if (!story.people.get(id)) spawn(id, { x: d.x + (SEVEN.indexOf(id) % 3 - 1) * 0.5, z: d.z + 1.0, heading: 0 });
      }
      for (const id of SEVEN) { const e = story.people.get(id); if (e) e.job = null; }
      if (story.people.get('kowunna')) await D.say('kowunna', L.kwSheets, { face: 'happy' });
      game.rig.shot(new THREE.Vector3(wl.x, 5.6, wl.z + 10.5), new THREE.Vector3(wl.x, 0.8, wl.z + 0.6), 1.4);
      // round the curb, the south half (faces to the camera); U Kan walks with them; Maya follows last
      const marks = SEVEN.map((id, i) => {
        const a = Math.PI * (0.08 + (0.84 * i) / (SEVEN.length - 1));
        const x = wl.x + Math.cos(a) * 1.75, z = wl.z + Math.sin(a) * 1.75;
        return { x, z, h: Math.atan2(wl.x - x, wl.z - z) };
      });
      await Promise.all(SEVEN.map((id, i) => moveTo(id, marks[i], 1.4)));
      await walkMaya(wl.x + 0.3, wl.z + 3.5, 9000);
      faceMaya(wl.x, wl.z);
      for (const id of SEVEN) {
        if (!story.people.get(id)) continue;
        call(story.people.get(id).p, 'emote', 'nod');
        await D.say(id, [L.looked[id]], { face: 'smile' });
        save.pencil[id] = 'ink'; // the notebook inks their real name (pencil label -> gold)
      }
      story.persist();
      // the jars go back into the well; the children fill their pots; the queue goes home
      call(game.audio, 'play', 'sparkle');
      removeWalkons();
      cart.setJars?.(0);
      if (F('ncMet') && story.people.get('naychi')) {
        await moveTo('naychi', { x: wl.x + 2.4, z: wl.z + 1.6, h: -0.9 });
        await D.say('naychi', L.ncWell, { face: 'think' });
      }
      await D.say('thida', L.thidaEnd, { face: 'smile' });
      story.give('fivecard');
      await D.say('maya', L.mayaEnd12, { face: 'think' });
      F('ch12Done', true);
    } catch (err) { console.error('day 8 close', err); } finally {
      story.talking = false;
      game.ui.cinema(false);
      game.rig.release();
      closing = false;
    }
    // afterwards: Daw Sein back to her shop, Moe Moe back to school; U Kan and Daw Hla to the bench
    for (const [id, d] of [['sein', W.teaDoor], ['moemoe', W.schoolDoor]]) {
      story.walkPerson(id, d.x, d.z + 0.6, 1.3).then(() => { if (!story.inRoom) story.remove(id); });
    }
    placeAfterClose(false);
  }

  // =============================================================================================
  // 8.1 desks: pick the line you can see, then the ribbon rises
  // =============================================================================================
  const light0 = ow?.lightDesk;
  if (ow && light0) {
    ow.lightDesk = async (d) => {
      const lines = d?.id === 'well' ? L.deskWell : d?.id === 'foldWest' ? L.deskFold : null;
      if (!lines) return light0.call(ow, d);
      if (story.talking || game.busy) return;
      story.talking = true;
      game.ui.cinema(true);
      const order = d.id === 'well' ? [2, 0, 1] : [1, 0, 2]; // the true line (index 0) never first
      try {
        await D.say('maya', [L.deskQ], { face: 'think' });
        for (;;) {
          const i = order[await D.choose(order.map((k) => lines[k]))];
          if (i === 0) break;
          await D.say('maya', L.deskWrong, { face: 'think' });
        }
      } finally { story.talking = false; game.ui.cinema(false); }
      await light0.call(ow, d);
      if (save.flags[`desk:${d.id}`]) {
        F(`desk.${d.id}`, true);
        if (d.id === 'foldWest') { checked('printday'); await scripted(() => D.say('maya', L.deskDone, { face: 'happy' })); }
      }
    };
  }

  // =============================================================================================
  // outdoor tap targets (no markers: the things themselves are what is tapped)
  // =============================================================================================
  const slateAt = () => {
    const s = shed?.slate?.root;
    if (s?.getWorldPosition) { s.getWorldPosition(v3); return { x: v3.x, y: Math.max(0.6, v3.y), z: v3.z }; }
    return { x: W.shed.x - 2.1, y: 0.8, z: W.shedDoor.z + 0.3 };
  };
  const TAPS = [
    { id: 'box', at: () => ({ x: W.box.x, y: 0.9, z: W.box.z }), stand: { x: W.box.x + 0.1, z: W.box.z + 1.0 },
      fn: async () => { game.ui.cinema(true); if (story.has('proof:post')) return D.say('maya', BOX_AGAIN, { face: 'smile' }); await D.say('maya', BOX_LINE, { face: 'surprised' }); giveProof('post'); } },
    { id: 'board', at: () => ({ x: W.slips.x, y: 1.6, z: W.slips.z }), stand: { x: W.slips.x - 0.2, z: W.slips.z + 1.25 }, fn: boardTap },
    { id: 'slate', at: slateAt, stand: () => { const s = slateAt(); return { x: s.x + 0.2, z: W.shedDoor.z + 1.0 }; },
      fn: async () => { game.ui.cinema(true); await D.say('maya', L.slate, { face: 'think' }); giveProof('printer'); } },
    { id: 'rings', at: () => ({ x: W.well.x, y: 0.55, z: W.well.z }), stand: { x: W.well.x, z: W.well.z + 1.55 }, fn: () => lookWell('rings') },
    { id: 'oldmark', at: () => ({ x: W.well.x - 0.85, y: 0.35, z: W.well.z + 0.2 }), stand: { x: W.well.x - 1.4, z: W.well.z + 1.1 }, fn: () => lookWell('oldmark') },
    { id: 'pots', at: () => ({ x: W.well.x + 0.8, y: 0.6, z: W.well.z + 0.5 }), stand: { x: W.well.x + 1.35, z: W.well.z + 1.2 }, fn: () => lookWell('pots') },
    { id: 'queue', when: () => walkons.length > 0, at: () => ({ x: W.queue[1][0], y: 1.0, z: W.queue[1][1] }), stand: { x: W.queue[1][0] + 0.2, z: W.queue[1][1] + 1.1 }, fn: () => lookWell('queue') },
    { id: 'askBoard', at: () => story.board.target, stand: story.board.stand,
      fn: async () => {
        game.ui.cinema(true);
        if (!F('pinned') || F('boardLine')) return D.say('maya', F('boardLine') ? L.homeBoard : L.homeBoardBefore, { face: 'think' });
        await D.say('maya', L.homeBoard, { face: 'think' });
        F('boardLine', true);
        call(askBoard, 'setText');
        call(game.audio, 'play', 'page');
      } },
  ];
  const tv = new THREE.Vector3();
  const proj = (x, y, z) => game.rig.project(tv.set(x, y, z), game.viewW, game.viewH);
  const tapHook = (sx, sy) => {
    if (story.inRoom || !story.foot?.active || game.busy || story.talking || game.mode !== 'world') return false;
    const m = mayaXZ();
    let best = null, bd = 42;
    for (const t of TAPS) {
      if (t.when && !t.when()) continue;
      const a = t.at();
      if (Math.hypot(a.x - m.x, a.z - m.z) > 30) continue;
      for (const y of [a.y, Math.max(0.2, a.y - 0.4)]) {
        const q = proj(a.x, y, a.z);
        if (q) { const d = Math.hypot(q.x - sx, q.y - sy); if (d < bd) { bd = d; best = t; } }
      }
    }
    if (!best) return false;
    for (const e of story.people.values()) for (const h of [0.4, e.p.height * 0.75]) {
      const q = proj(e.p.root.position.x, h, e.p.root.position.z);
      if (q && Math.hypot(q.x - sx, q.y - sy) < bd) return false; // a person is nearer the tap: talk to them
    }
    const st = typeof best.stand === 'function' ? best.stand() : best.stand;
    const a = best.at();
    const go = () => scripted(async () => { faceMaya(a.x, a.z); await best.fn(); });
    if (Math.hypot(m.x - st.x, m.z - st.z) < 1.0) go();
    else story.foot.walkTo(st.x, st.z, (ok) => { if (ok !== false) go(); });
    return true;
  };
  story.tapHooks = story.tapHooks || [];
  story.tapHooks.push(tapHook);

  // =============================================================================================
  // what people say (talkTo calls these; story.inRoom tells indoors from out)
  // =============================================================================================
  const talk = {
    wintwar: async () => {
      if (!F('morning')) return morning();
      await D.say('wintwar', F('ch12Done') && F('ch13Done') ? L.wwEvening : L.wwLater, { face: 'smile' });
    },
    khwarnyo: async () => {
      if (F('khwar')) return D.say('khwarnyo', L.knLater, { face: 'smile' });
      await D.say('khwarnyo', L.kn, { face: 'worried' });
      giveProof('mayasays');
      F('khwar', true);
    },
    naychi: async () => {
      if (!F('ncHanded')) return naychiTalk();
      if (F('ch12Done') && F('ncMet')) return D.say('naychi', L.ncWell, { face: 'think' });
      return D.say('naychi', F('ch13Done') ? L.ncAfter : L.ncLater, { face: 'think' });
    },
    kosan: async () => {
      if (!met('kosan')) return reason('kosan', 'think');
      if (F('ch12Done')) return D.say('kosan', [L.looked.kosan], { face: 'smile' });
      await D.say('kosan', story.flag('rumour.post') === 'checked' ? L.kosanAfter : L.kosan, { face: 'smile' });
      hear('post');
    },
    komin: async () => {
      if (!met('komin')) return reason('komin', 'think');
      await D.say('komin', F('ch12Done') ? [L.looked.komin] : L.komin, { face: 'smile' });
    },
    sein: async () => {
      if (!met('sein')) return reason('sein', 'worried');
      await D.say('sein', F('ch12Done') ? L.seinAfter : L.sein, { face: 'smile' });
    },
    kan: async () => {
      if (!met('kan')) return reason('kan', 'think');
      await D.say('kan', F('ch12Done') ? L.kanAfter : L.kan, { face: 'think' });
    },
    dawhla: async () => {
      if (!met('dawhla')) return reason('dawhla', 'worried');
      await D.say('dawhla', F('ch12Done') ? [L.looked.dawhla] : L.dawhla, { face: 'worried' });
    },
    moemoe: async () => {
      if (!met('moemoe')) return reason('moemoe', 'hot');
      await D.say('moemoe', F('ch12Done') ? L.moemoeAfter : L.moemoe, { face: F('ch12Done') ? 'happy' : 'sad' });
    },
    thida: () => thidaTalk(),
    kowunna: async () => {
      if (!story.inRoom) {
        if (!F('wunnaMet')) return wunnaHook();
        return D.say('kowunna', F('sheet') ? L.kwSheets : L.kwOutside, { face: 'happy' });
      }
      if (F('ch13Done')) return D.say('kowunna', L.kwEnd, { face: 'happy' });
      if (!looked(PRESS_LOOKS) || !F('turned')) return D.say('kowunna', L.kwLooking, { face: 'smile' });
      if (!F('asked')) return draftsScene();
      return D.say('kowunna', L.kwBench, { face: 'smile' });
    },
    utint: () => tintTalk(),
  };

  // =============================================================================================
  // rooms: who is where, how they look today, and the story taps inside (stations, no markers)
  // =============================================================================================
  function roomCast(id) {
    if (id === 'letterroom') {
      if (F('ch12Done')) return [];
      const c = [{ id: 'thida', spot: 'thida' }];
      if (F('wellSeen') && !F('thidaTalk')) c.push({ id: 'moemoe', spot: 'moemoe' });
      return c;
    }
    if (id === 'junctiontea') return F('ch12Done') ? [{ id: 'sein', spot: 'sein' }] : [{ id: 'sein', spot: 'sein' }, { id: 'kan', spot: 'kan' }, { id: 'dawhla', spot: 'dawhla' }];
    if (id === 'schoolroom') {
      // from the well looks until Ma Thida's talk she waits in Ma Thida's doorway with her empty pot
      if (F('wellSeen') && !F('thidaTalk')) return [];
      return [{ id: 'moemoe', spot: F('ch12Done') ? 'moemoeTurned' : 'moemoe' }];
    }
    if (id === 'press') {
      if (F('ch13Done')) return [{ id: 'utint', spot: 'utint' }];
      const c = [{ id: 'utint', spot: F('turned') ? 'utintStone' : 'utint' }];
      if (F('wunnaMet')) c.push({ id: 'kowunna', spot: F('asked') ? 'kowunnaBench' : F('turned') ? 'kowunnaStone' : 'kowunnaCases' });
      return c;
    }
    return null;
  }
  function roomOpts(id) {
    if (id === 'letterroom') return { jars: F('thidaTalk') ? 1 : 12, basket: F('thidaTalk') && !F('ch12Done') ? 11 : 0 };
    if (id === 'junctiontea') return { hoard: F('ch12Done') ? 0 : 9 };
    if (id === 'schoolroom') return { pots: !!F('ch12Done') };
    if (id === 'press') return { jumbled: false };
    return {};
  }
  const approach = (pid) => { const e = story.people.get(pid); if (e) story.approach(e); return !!e; };
  const say = (lines, face = 'think') => () => scripted(async () => { game.ui.cinema(true); await D.say('maya', lines, { face }); });
  const STATIONS = {
    letterroom: {
      thida: () => approach('thida') || say([L.r7.thida[0]])(),
      jars: () => say(F('thidaTalk') ? L.jarsOne : L.jars)(),
      letterLine: say(L.letterLine),
      basket: say(L.basket),
      dryingRack: say(L.letterLine),
    },
    junctiontea: {
      sein: () => approach('sein'),
      kan: () => approach('kan') || say(L.hoardAfter)(),
      dawhla: () => approach('dawhla') || say(L.hoardAfter)(),
      hoard: () => say(F('ch12Done') ? L.hoardAfter : L.hoard)(),
      handbill: () => say(F('locked') ? L.teaCorrection : L.teaHandbill)(),
      sortTable: () => (allMet() && !F('sorted') ? scripted(sortScene) : say(L.sortTable)()),
    },
    schoolroom: {
      moemoe: () => approach('moemoe'),
      board: () => scripted(async () => {
        game.ui.cinema(true);
        if (F('ch12Done')) return D.say('maya', L.schoolBoardAfter, { face: 'smile' });
        await D.say('maya', L.schoolBoard, { face: 'think' });
        await showSlip(game, L.moemoeSum, { kind: 'question', title: { my: 'ကျောက်သင်ပုန်းပေါ်က', en: 'On the blackboard' } });
      }),
      teacherDesk: () => say(L.teacherDesk)(),
      inkPots: () => say(F('ch12Done') ? L.inkPotsAfter : L.inkPots)(),
    },
    press: {
      cases: () => scripted(() => pressLook('cases')),
      labels: () => scripted(() => pressLook('labels')),
      scrapCrate: () => scripted(() => pressLook('title')),
      stone: () => scripted(async () => {
        if (!F('turned') && F('wunnaMet')) return turnScene();
        game.ui.cinema(true);
        await D.say('maya', F('turned') ? L.stoneAfter : L.stoneWait, { face: 'think' });
      }),
      pressBar: () => scripted(async () => { game.ui.cinema(true); await D.say('maya', L.pressIdle, { face: 'smile' }); }),
      locker: say(L.locker, 'sad'),
      sideDoor: () => scripted(backYard),
      dryingLine: say(L.dryingLine),
    },
  };

  let autoSortArmed = false;
  function closeCam(room) {
    if (story.doors?.roomCam) { story.doors.roomCam(); return; } // doors.js's shared close, low room camera
    const hw = (room?.width ?? 7) / 2, hd = (room?.depth ?? 8) / 2;
    game.rig.setFollow({ ...ROOM_CLOSE, widthLandscape: Math.min(9.5, (room?.width ?? 7) + 1.8),
      bounds: { minX: -Math.max(0, hw - 2.2), maxX: Math.max(0, hw - 2.2), minZ: -hd + 1.4, maxZ: hd - 0.8 } });
  }

  // =============================================================================================
  // the night page (the Writing Room door, after both chapters)
  // =============================================================================================
  let nightBusy = false;
  async function night() {
    if (nightBusy) return;
    nightBusy = true;
    const met8 = ['naychi', 'thida', 'kowunna', 'utint', ...SEVEN.filter(met), F('khwar') ? 'khwarnyo' : null].filter((id, i, a) => id && a.indexOf(id) === i && castById(id));
    const ex = (a, b) => ({ my: `${a.my}\n\n${b.my}`, en: `${a.en}\n\n${b.en}` });
    try {
      await nightPage(story, {
        day: 8,
        truth: { q: L.nightQ, choices: L.nightChoices, right: 1, wrong: L.nightWrong },
        sleep: { q: L.sleepQ, who: met8 },
        stamps: [12, 13],
        stampText: L.stampText,
        extra: ex(L.stampText13, L.stepPage),
        tomorrow: L.tomorrow,
      });
      F('done', true);
    } finally { nightBusy = false; }
  }

  // =============================================================================================
  // test hooks
  // =============================================================================================
  const GOTO = {
    home: [ab.x + 0.8, ab.z + 1.6], market: [W.khwar.x + 1.2, W.khwar.z + 1.4], west: [W.nc.x - 1.2, W.nc.z + 1.2],
    bridge: [W.bridgeE.x + 2.5, 300.5], square: [W.slips.x - 1.0, W.slips.z + 2.0], well: [W.well.x, W.well.z + 2.4],
    press: [W.shedDoor.x - 0.6, W.shedDoor.z + 1.6], letter: [W.letterDoor.x, W.letterDoor.z + 1.4], tea: [W.teaDoor.x, W.teaDoor.z + 1.4],
    school: [W.schoolDoor.x, W.schoolDoor.z + 1.6], post: [story.board.stand.x, story.board.stand.z + 0.4],
  };
  const RUN = { morning, readSlips: () => scripted(readSlips), pin: () => scripted(pinLine), sort: () => scripted(sortScene), turn: () => scripted(turnScene),
    lockup: () => scripted(lockupScene), close: closeScene, night, thida: () => approach('thida'), tint: () => approach('utint'), wunna: () => approach('kowunna') };
  const hooks = {
    W, F, L,
    flags: () => Object.fromEntries(Object.entries(save.flags).filter(([k]) => k.startsWith('d8.'))),
    beats: BEATS.map((b) => b[0]),
    /** Everything before `beat` done (flags, items), then the page turns in place onto the new state. */
    async skipTo(beat, { reload = true } = {}) {
      const k = BEATS.findIndex((b) => b[0] === beat);
      if (k < 0) return false;
      for (let i = 0; i < k; i++) BEATS[i][1]();
      story.persist();
      game.ui.hideDialog?.();
      story.talking = false;
      for (const el of document.querySelectorAll('.story-letter, .rc-slip, .rc-lift')) el.remove();
      if (reload) await story.turnPage();
      return true;
    },
    async goto(place) {
      const p = GOTO[place];
      if (!p || !ow) return false;
      if (story.inRoom) await story.exit({ instant: true });
      if (!story.foot.active) await story.foot.toFoot();
      ow.jump(p[0], p[1], Math.PI);
      return true;
    },
    enter: (room) => story.enter(room),
    run: (name) => RUN[name]?.(),
  };
  window.__day8 = hooks;

  // =============================================================================================
  // the day module
  // =============================================================================================
  let lastRoom = null;
  let ncCalled = false;
  let evening = false;
  let cullT = 0;
  return {
    talk,
    roomCast: (id) => roomCast(id),
    roomOpts: (id) => roomOpts(id),
    station(id, ctx) {
      const fn = STATIONS[ctx?.room || story.inRoom]?.[id];
      if (!fn) return false;
      fn(ctx);
      return true;
    },
    enterRoom(id, room) {
      closeCam(room);
      if (id === 'junctiontea') { call(room, 'setCorrection', !!F('locked')); autoSortArmed = true; }
      if (id === 'schoolroom') call(room, 'setAfter', !!F('ch12Done'));
      if (id === 'press') {
        if (F('wunnaMet') && !F('look.cases') && story.people.get('kowunna')) story.bark('kowunna', L.kwInside[0], 3200);
        if (F('locked') && F('pinned') && !F('sheet')) setTimeout(() => scripted(printBlankAtPress), 900);
      }
    },
    leaveRoom() { autoSortArmed = false; },
    dispose() {
      if (story.tapHooks) { const k = story.tapHooks.indexOf(tapHook); if (k >= 0) story.tapHooks.splice(k, 1); }
      if (ow && light0) ow.lightDesk = light0;
      story.paint.onRub = onRub0 || null;
      removeWalkons();
      for (const h of props) { h.root.removeFromParent(); try { h.dispose?.(); } catch (e) { console.warn('day 8 prop', e); } }
      props.length = 0;
      ow?.space?.remove?.(obs); // (then disarmed too: a harmless fallback)
      for (const o of obs) {
        if (o.type === 'circle') { o.r = 0; o.x = o.z = -1e6; } else { o.minX = o.maxX = o.minZ = o.maxZ = -1e6; }
        const k = story.foot.obstacles.indexOf(o);
        if (k >= 0 && !ow) story.foot.obstacles.splice(k, 1);
      }
      for (const id of mine) story.remove(id);
      for (const id of myDoors) delete DOORS[id];
      game.day?.set?.(null);
      if (window.__day8 === hooks) delete window.__day8;
    },
    async start() {
      if (!F('morning')) {
        if (!story.foot.active) await story.foot.toFoot();
        story.refreshHud?.();
        // a page resumed out on the land: the morning finds her at her Writing Room door
        const mp = game.maya.root.position;
        if (ow && Math.hypot(mp.x - ab.x, mp.z - ab.z) > 25) ow.jump(ab.x + 0.6, ab.z + 1.4, 0);
        await morning();
      }
    },
    update(dt, t) {
      // far props are hidden (the town is big; the Junction and the Market are 30-170 m from home)
      if ((cullT -= dt) <= 0) {
        cullT = 1;
        const m = story.inRoom ? null : mayaXZ();
        for (const h of props) if (m) h.root.visible = Math.hypot(h.root.position.x - m.x, h.root.position.z - m.z) < 95;
        for (const w of walkons) if (m) w.p.root.visible = w.jar.root.visible = Math.hypot(w.p.root.position.x - m.x, w.p.root.position.z - m.z) < 95;
        if (m && jarMerge && walkons[0]) for (const mm of jarMerge.meshes) mm.visible = walkons[0].jar.root.visible; // (the merged jars go with them)
      }
      for (const h of props) if (h.root.visible) call(h, 'update', dt, t);
      for (const w of walkons) w.p.update(dt, { speed: 0 });
      // room transitions (the street's people are back once she is outside)
      const inRoom = story.inRoom;
      if (lastRoom && !inRoom && lastRoom === 'press' && F('ch13Done') && !story.people.get('kowunna')) {
        const e = spawn('kowunna', { x: W.shedDoor.x - 0.3, z: W.shedDoor.z + 0.9, heading: 0 });
        if (e) story.walkPerson('kowunna', W.kwBoard.x, W.kwBoard.z, 1.8).then(() => { const k = story.people.get('kowunna'); if (k && !story.inRoom) { k.p.root.rotation.y = W.kwBoard.h; k.home.h = W.kwBoard.h; } });
      }
      lastRoom = inRoom;
      if (game.busy || story.talking) return;
      // the tea shop's door table, once all seven have been heard
      if (inRoom === 'junctiontea' && autoSortArmed && allMet() && !F('sorted')) { autoSortArmed = false; scripted(sortScene); return; }
      if (inRoom) return;
      const m = mayaXZ();
      // Nay Chi calls out as soon as Maya comes within a few metres
      if (!F('ncMet') && !ncCalled) {
        const nc = story.people.get('naychi');
        if (nc && Math.hypot(nc.p.root.position.x - m.x, nc.p.root.position.z - m.z) < 7) { ncCalled = true; story.bark('naychi', L.ncCall, 2400); }
      }
      // first step on the east foot's newsprint: the bridge is open on a printing day
      if (F('morning') && !F('arrived') && m.x > 119.3 && m.x < 129 && Math.abs(m.z - 300) < 5) {
        F('arrived', true);
        giveProof('printday', { quiet: true });
        story.bark('maya', L.arrival, 4200);
      }
      // the close: the blank sheets are up; everyone walks to the well
      if (F('thidaTalk') && F('pinned') && F('sheet') && !F('ch12Done') && story.foot.active && Math.hypot(m.x - W.well.x, m.z - W.well.z) < 14) { closeScene(); return; }
      // evening once both chapters are written into the day
      if (!evening && F('ch12Done') && F('ch13Done')) { evening = true; game.day?.set?.(17.5); game.applyDayLook?.(); }
      // the night page: back at the Writing Room door (on foot or by car)
      if (F('ch12Done') && F('ch13Done') && !F('done')) {
        const near = story.foot.active ? Math.hypot(m.x - ab.x, m.z - ab.z) < 1.8 : Math.hypot(m.x - ab.x, m.z - (ab.z + 3)) < 2.2;
        if (near) night();
      }
    },
  };
}
