// Day 11 (Hearth Row) — chapter 18, ကျွန်မရေးတဲ့ စာတို (Short Pieces I Wrote). Script: day11-spec.md.
//
// Lesson (p84–88): seven short pieces, one mind kept cool and clear. Picking up fire to throw it burns you
// first: pass it by, or point it out with goodwill. Not choosing a thing does not make it bad. Time is fast:
// start now. A mistake is told quietly with goodwill; pride in piling on is not to be made normal. When
// goodwill is laughed at, change your own thought first, then explain again. Keep the standard you set.
// One likeable thing does not make all someone does right: weigh it, and see what is, as it is.
// Main quest: Nay Chi stops asking and helps someone herself (her talk's last stone is hers: Step back).
//
// Beats (flags `d11.*`, all resumable):
//   home (outdoors)  morning post → bean bed (optional) ............................ d11.morning, d11.bloom
//   Hearth Row       arrival → Nay Chi at the Note Wall → seven headings ........... d11.arrived, d11.ncMet, d11.wall.N
//   1 bakery (room)  Daw Khin May calls her in; hold the hot pin; oven; walk past note 1 outside ... d11.p1
//   2 noodlehouse    pick a counter, answer the other owner; the pin pair overheard ......... d11.p2
//   3 eveningclass   Maung Pan, ten calendar leaves, "where could it get sun today?"; he plants it by the kite bench ... d11.p3
//   5 boxshop        the true thought; then the fold on the class steps (outdoors) ......... d11.p5
//   6 hearthtea      practice sheet + songbook (pencil → gold); held Step back; she sings alone .. d11.p6
//   7 kite bench     sort: seen / check first ........................................... d11.p7
//   lamp-lighting    any four of 1,2,3,5,6,7 ............................................... d11.lamp
//   4 hearthtea      Nay Chi's talk (last stone hers); outdoors: no ribbon, the quiet word in the lamp shop
//                    while Maya keeps 4 m away; the sign fixed; she unpins Ko Doe's note .... d11.p4
//   close            all seven: the Wall cools .......................................... d11.ch18Done
//   home             Ma Wint War's evening line, the board (optional), the night page ... d11.board, d11.done → day 12
// No markers anywhere: people and notes say where things are.
// Burmese lines (day11-lines.js, talks/day11.js) are drafts for Maya to proofread.
//
// Test hooks: window.__day11 = { skipTo(beat, { reload, lean }), flags(), row, state(), beats }
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { hold } from './acts/hold.js';
import { sort } from './acts/sort.js';
import { trace } from './acts/trace2.js';
import { nightPage, showLetter, showSlip, liftOff } from './post.js';
import { companionById } from './companions.js';
import { castById } from './cast.js';
import { createPerson } from './people.js';
import { TALK_D11_NAYCHI, D11_NC_AFTER } from './talks/day11.js';
import { L } from './day11-lines.js';
import { buildRow, buildHome, PL } from './day11-row.js';
import { DOORS } from './doors.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const MAYA = { my: 'မာရာ', en: 'Maya' };
// the close, low room camera (never the whole-room dollhouse view): talks take their own two-shot
const ROOM_CLOSE = { tilt: 32, width: 4.6, widthLandscape: 9, minHeight: 0, height: 0.95, bounds: null, stiffness: 5 };
// two teens on the class steps (piece 5): walk-ons, dressed unlike the pin pair (open question 17)
const TEEN_LOOKS = {
  teenA: { age: 'teen', build: 'slim', skin: 3, hair: 'short', top: 'shirt', topColor: 'white', bottom: 'longyi', bottomColor: 'leaf', check: true },
  teenB: { age: 'teen', skin: 1, hair: 'spiky', hairColor: 'brown', top: 'tee', topColor: 'coral', bottom: 'trousers', bottomColor: 'charcoal' },
};
const PIECES = ['p1', 'p2', 'p3', 'p5', 'p6', 'p7'];
const NOTE_ORDER = ['burn', 'notbad', 'today', 'quiet', 'notme', 'standard', 'weigh'];
const HEAT = [0.75, 0.6, 0.45, 1, 0.4, 0.55, 0.1];

export { SLEPT11 } from './day11-lines.js'; // tonight's hosts' lines (later days read dayN.js SLEPTn)

export async function create(story) {
  const { game, dialog: D, save } = story;
  const F = (k, v) => story.flag(`d11.${k}`, v);
  const placeDoor = (id) => game.world.places.find((p) => p.id === id)?.door || { x: 0, z: 7 };
  const ab = placeDoor('about');
  const v3 = new THREE.Vector3();
  let alive = true;

  // ---------------------------------------------------------------------------------------------
  // the set: Hearth Row (built here: the district has no buildings yet) and the home dressings
  // ---------------------------------------------------------------------------------------------
  const row = buildRow(story);
  const home = buildHome(story, { boardCount: F('p4') ? 29 : 30, ncNote: !F('p4') });
  function dressWall() {
    const done = !!F('ch18Done');
    const notes = [];
    for (let i = 0; i < 7; i++) {
      const n = i + 1;
      const gone = (n === 4 && F('p4')) || (done && [2, 3, 5].includes(n));
      notes.push(gone ? null : { ...L.wall[n], heat: done ? 0.15 : HEAT[i], ...(n === 4 ? { pins: 30, hook: true } : {}), ...(n === 7 ? { hearts: true } : {}) });
    }
    row.wall.setNotes(notes);
    for (let i = 0; i < 7; i++) if (!notes[i]) row.wall.removeNote(i);
    row.wall.setCurl(0.8); // every corner curls up: the rain sign (Toe Toe's question, the desk line, the sort)
  }
  dressWall();
  if (F('p3')) row.sapling.root.visible = true;
  if (F('signFixed')) row.sign.setText({ my: 'သံပြား မီးအိမ်', en: 'Tin lamps' });
  if (F('lamp')) row.lamps.setLit(1);
  // the scripted look of the hour (whatever the real clock says)
  game.day?.set?.(F('lamp') ? 18.4 : F('morning') ? 11 : 8.5);
  game.applyDayLook();

  // ---------------------------------------------------------------------------------------------
  // people
  // ---------------------------------------------------------------------------------------------
  const W = PL.wall;
  const SPOT = {
    ww: { x: ab.x + 2.6, z: ab.z + 1.2, heading: -Math.PI / 2 },
    ncStool: { x: W.x - 3.2, z: W.z + 1.05, heading: 0.35 },
    ncWall: { x: W.x - 0.9, z: W.z + 1.25, heading: 0.2 },
    kodoe: { x: W.x + 0.75, z: W.z + 1.45, heading: -0.4 },
    uchit: { x: PL.kite.x - 0.85, z: PL.kite.z + 0.85, heading: 0.5 },
    panBench: { x: PL.patch.x - 0.7, z: PL.patch.z + 0.55, heading: 0.6 },
    teaFront: { x: PL.tea.x - 0.9, z: PL.tea.z + 2.6 },
    kmDoor: { x: PL.bakery.door.x + 0.7, z: PL.bakery.door.z + 0.9, heading: 0.3 },
    steps: { x: PL.steps.x + 1.25, z: PL.steps.z - 0.15, heading: Math.PI - 0.5 },
  };
  const front = (d, k = 0.9) => ({ x: d.x + Math.sin(d.facing) * k, z: d.z + Math.cos(d.facing) * k });
  story.spawn('wintwar', SPOT.ww);
  story.setJob('wintwar', { area: { x: SPOT.ww.x + 0.9, z: SPOT.ww.z + 1.0, r: 2.6 }, spot: { x: SPOT.ww.x, z: SPOT.ww.z, h: -0.4 }, mood: 'read', workChance: 0.5, workFor: [5, 9] });
  story.spawn('kodoe', SPOT.kodoe);
  story.setJob('kodoe', { area: { x: W.x + 0.6, z: W.z + 2.1, r: 1.6 }, spot: { x: SPOT.kodoe.x, z: SPOT.kodoe.z, h: -0.4 }, mood: 'read', workChance: 0.7, workFor: [6, 12], lookAt: { x: W.x, z: W.z } });
  story.spawn('uchit', SPOT.uchit);
  story.setJob('uchit', { area: { x: PL.kite.x - 1.0, z: PL.kite.z + 1.6, r: 1.4 }, spot: { x: SPOT.uchit.x, z: SPOT.uchit.z, h: 0.5 }, mood: 'work', workChance: 0.8, workFor: [8, 16], lookAt: { x: PL.kite.x, z: PL.kite.z } });
  // Nay Chi: at her stool until she goes to think (then in the tea shop); back at her stool after piece 4
  if (!F('ncMet') || F('p4')) { story.spawn('naychi', SPOT.ncStool); story.people.get('naychi').p.setMood(F('p4') ? null : null); }
  if (F('p3')) placePanOutside();

  // outdoor walk-ons (no names: tap shows a line, never a marker): the two teens on the class steps,
  // and at lamp-lighting the pin pair behind Ko Doe
  const extras = new Map(); // key -> { p, look, name, x, z, h, lines() }
  let LOOKS = null;
  import('./rooms/hearth.js').then((m) => { LOOKS = m.LOOKS; if (alive) placeExtras(); }).catch(() => { LOOKS = {}; });
  function addExtra(key, look, name, at, lines) {
    if (extras.has(key) || !look) return;
    const p = createPerson(look);
    p.root.position.set(at.x, 0, at.z);
    p.root.rotation.y = at.h ?? 0;
    p.root.userData.isPerson = true;
    game.world.scene.add(p.root);
    extras.set(key, { p, look, name, x: at.x, z: at.z, h: at.h ?? 0, lines });
  }
  function dropExtra(key) { const x = extras.get(key); if (!x) return; x.p.root.parent?.remove(x.p.root); x.p.dispose(); extras.delete(key); }
  function placeExtras() {
    if (!LOOKS) return;
    if (!F('p5') || true) {
      addExtra('teenA', TEEN_LOOKS.teenA, L.teenNameA, { x: PL.steps.x - 1.05, z: PL.steps.z - 0.35, h: Math.PI - 0.7 }, () => (F('p5') ? L.teensAfter : L.teensBefore));
      addExtra('teenB', TEEN_LOOKS.teenB, L.teenNameB, { x: PL.steps.x + 2.2, z: PL.steps.z - 0.3, h: Math.PI + 0.7 }, () => (F('p5') ? L.teenB : L.teensBefore));
    }
    if (F('lamp') && !F('p4')) {
      addExtra('pinA', LOOKS.pinA, L.pinNameA, { x: W.x + 1.6, z: W.z + 2.2, h: -0.5 }, () => L.pinA);
      addExtra('pinB', LOOKS.pinB, L.pinNameB, { x: W.x + 2.3, z: W.z + 1.9, h: -0.7 }, () => L.pinB);
    } else { dropExtra('pinA'); dropExtra('pinB'); }
  }

  // ---------------------------------------------------------------------------------------------
  // small tools
  // ---------------------------------------------------------------------------------------------
  const met = new Set(F('met') || []);
  async function say(id, lines, opts = {}) {
    if (!Array.isArray(lines)) lines = [lines];
    if (id !== 'maya' && castById(id) && !met.has(id)) { met.add(id); F('met', [...met]); }
    await D.say(id, lines, opts);
  }
  /** A walk-on speaks: their portrait and a plain description for a name (they have no cast entry). */
  const portraits = new Map();
  async function sayAs(name, look, lines) {
    if (!Array.isArray(lines)) lines = [lines];
    let face = look ? portraits.get(look) : null;
    if (look && !face) { const p = createPerson(look); face = p.portrait('talk'); p.dispose(); portraits.set(look, face); }
    const nameEl = document.querySelector('#dialog .dialog-name');
    if (nameEl) nameEl.textContent = tr(name);
    await game.ui.say(lines, { face, auto: false, onTick: () => call(game.audio, 'play', 'type') });
    if (nameEl) nameEl.textContent = tr(MAYA);
  }
  /** Run a little scene that did not come from a tap on a person (talkTo already guards those). */
  async function stage(fn) {
    if (story.talking || game.busy || !alive) return false;
    story.talking = true;
    game.ui.cinema(true);
    try { await fn(); } catch (e) { console.error('day11', e); } finally { game.ui.cinema(false); game.rig.release(); story.talking = false; }
    return true;
  }
  const mayaXZ = () => { const p = game.maya.root.position; return { x: p.x, z: p.z }; };
  const near = (x, z, r) => { const m = mayaXZ(); return Math.hypot(m.x - x, m.z - z) < r; };
  const outdoors = () => !story.inRoom && game.mode === 'world';
  function walkMaya(x, z, ms = 7000) {
    return new Promise((res) => { let done = false; const fin = () => { if (!done) { done = true; res(); } }; story.foot.walkTo(x, z, fin); setTimeout(fin, ms); });
  }
  function faceMaya(x, z) {
    const m = game.maya.root.position;
    const h = Math.atan2(x - m.x, z - m.z);
    if (story.foot.walker) story.foot.walker.heading = h;
    game.maya.root.rotation.set(0, h, 0);
  }
  const rotIdx = new Map();
  /** One line per tap, rotating through a list of line groups. */
  function rot(key, groups) { const i = rotIdx.get(key) || 0; rotIdx.set(key, i + 1); return groups[i % groups.length]; }
  /** A short piece is written: a page added to the notes (the stack is given with the first). */
  async function addNote(id) {
    const pages = (F('notes.pages') || []).slice();
    if (pages.includes(id)) return;
    pages.push(id);
    F('notes.pages', pages);
    story.flag('notes.pages', pages); // (the item's own page list, INDEX 4: `notes.pages`)
    if (!story.has('notes')) story.give('notes'); else call(game.audio, 'play', 'page');
    await showSlip(game, L.notes[id], { title: L.noteTitle(NOTE_ORDER.indexOf(id) + 1) });
  }
  function proof(id, line) {
    save.proofs[id] = line;
    story.give(`proof:${id}`);
    F(`rumour.${id}`, true);
    story.flag(`rumour.${id}`, 'checked');
  }
  const pieceCount = () => PIECES.filter((k) => F(k)).length;

  // ---------------------------------------------------------------------------------------------
  // outdoor taps on things (no markers: the things are in the scene): the seven notes, the lamp-shop
  // sign, the bean bed, the board, the walk-ons
  // ---------------------------------------------------------------------------------------------
  const taps = [];
  const addTap = (t) => taps.push(t);
  for (let i = 0; i < 7; i++) {
    addTap({ id: `note${i + 1}`, at: () => row.wallSlot(i), stand: () => ({ x: row.wallSlot(i).x, z: W.z + 1.15 }), when: () => !noteGone(i + 1), fn: () => readNote(i + 1) });
  }
  addTap({ id: 'sign', at: () => ({ x: row.signAt.x, y: 2.6, z: row.signAt.z }), stand: () => ({ x: row.signAt.x + 1.6, z: row.signAt.z }), fn: () => stage(async () => { await say('maya', F('signFixed') ? [{ my: '(«မီးအိမ်»။ စာလုံး မှန်သွားပြီ။)', en: '(«မီးအိမ်». The letter is right now.)' }] : L.nyeinMaya, { face: 'think' }); F('signSeen', true); }) });
  addTap({ id: 'bed', at: () => ({ x: home.bedAt.x, y: 0.6, z: home.bedAt.z }), stand: () => ({ x: home.bedAt.x + 0.2, z: home.bedAt.z + 1.0 }), fn: () => stage(bloom) });
  addTap({ id: 'board', at: () => story.board.target, stand: () => story.board.stand, fn: () => stage(board) });
  addTap({ id: 'sapling', at: () => ({ x: PL.patch.x, y: 0.3, z: PL.patch.z }), stand: () => ({ x: PL.patch.x, z: PL.patch.z + 1.0 }), when: () => !!F('p3'), fn: () => stage(() => say('maya', [{ my: '(မန်ကျည်းပင်လေး။ ဒီနေ့ မြေထဲ ရောက်သွားပြီ။)', en: '(The little tamarind. In the ground today.)' }], { face: 'smile' })) });
  const noteGone = (n) => (n === 4 && F('p4')) || (F('ch18Done') && [2, 3, 5].includes(n));
  const tapV = new THREE.Vector3();
  const tapHook = (sx, sy) => {
    if (!alive || story.inRoom || !story.foot.active || story.talking || game.busy || game.mode !== 'world') return false;
    let best = null, bd = 44;
    for (const t of taps) {
      if (t.when && !t.when()) continue;
      const a = t.at();
      const q = game.rig.project(tapV.set(a.x, a.y, a.z), game.viewW, game.viewH);
      if (!q) continue;
      const d = Math.hypot(q.x - sx, q.y - sy);
      if (d < bd) { bd = d; best = t; }
    }
    for (const [key, x] of extras) {
      for (const hgt of [0.5, 1.1]) {
        const q = game.rig.project(tapV.set(x.p.root.position.x, hgt, x.p.root.position.z), game.viewW, game.viewH);
        if (!q) continue;
        const d = Math.hypot(q.x - sx, q.y - sy);
        if (d < bd) { bd = d; best = { extra: key, x }; }
      }
    }
    if (!best) return false;
    // a townsperson standing in front of a note wins the tap (story.js taps people)
    for (const e of story.people.values()) for (const hgt of [0.4, e.p.height * 0.75]) {
      const q = game.rig.project(tapV.set(e.p.root.position.x, hgt, e.p.root.position.z), game.viewW, game.viewH);
      if (q && Math.hypot(q.x - sx, q.y - sy) < bd) return false;
    }
    if (best.extra) {
      const x = best.x, px = x.p.root.position;
      story.foot.walkTo(px.x + (mayaXZ().x < px.x ? -1.0 : 1.0), px.z + 0.15, (ok) => { if (ok !== false) stage(async () => { faceMaya(px.x, px.z); x.p.lookAt(v3.set(game.maya.root.position.x, 1, game.maya.root.position.z)); await sayAs(x.name, x.look, x.lines()); }); });
      return true;
    }
    const st = best.stand();
    story.foot.walkTo(st.x, st.z, (ok) => { if (ok === false) return; const a = best.at(); faceMaya(a.x, a.z); best.fn(); });
    return true;
  };
  story.tapHooks = story.tapHooks || [];
  story.tapHooks.push(tapHook);

  async function readNote(n) {
    await stage(async () => {
      await showSlip(game, L.wall[n], { title: L.wallTitle(n) });
      const first = !Object.keys(save.flags).some((k) => /^d11\.wall\.\d$/.test(k));
      F(`wall.${n}`, true);
      if (first) await say('maya', L.wallMaya, { face: 'think' });
    });
    if (n === 1 && !F('p1.call')) kmCall();
  }

  // ---------------------------------------------------------------------------------------------
  // home: the morning post, the bean bed, the evening, the board
  // ---------------------------------------------------------------------------------------------
  async function morning() {
    game.day?.set?.(8.5); game.applyDayLook();
    await say('wintwar', L.ww1, { face: 'smile' });
    const slept = (save.notebook?.sleptAt || []).filter((s) => s.day === 10).pop();
    if (slept) await showSlip(game, L.slept[slept.who] || L.sleptOther, { kind: 'notebook' });
    await say('wintwar', L.ww2, { face: 'happy' });
    await showLetter(game, L.kpNote, { from: 'kophyo' });
    await say('maya', L.join, { face: 'happy' });
    // three companions lift off Day 10's page (the Bench was stamped on Day 10; Tendril and Cat arrive in pencil)
    for (const id of ['bench', 'tendril', 'cat']) {
      const c = companionById(id);
      if (!c || story.companions.has(id)) continue;
      await liftOff(game, c);
      story.companions.add(id);
    }
    await say('maya', L.lift, { face: 'surprised' });
    await say('maya', L.liftMaya, { face: 'happy' });
    await showSlip(game, L.tt, { kind: 'question' });
    await say('wintwar', L.ww3, { face: 'smile' });
    await showLetter(game, L.ncNote, { from: 'naychi' });
    await say('maya', L.ncMaya, { face: 'think' });
    await say('wintwar', L.ww4, { face: 'smile' });
    if (!story.flag('rumour.rain')) story.flag('rumour.rain', 'pencil'); // heard, not seen: pencil on the map
    F('rumour.rain', F('rumour.rain') || 'heard');
    F('morning', true);
    game.day?.set?.(11); game.applyDayLook();
  }
  async function bloom() {
    await say('maya', L.bloom, { face: 'happy' });
    await say('maya', L.bulbs, { face: 'think' });
    F('bloom', true);
  }
  async function board() {
    if (!F('p4')) { await say('maya', L.boardBefore, { face: 'think' }); return; }
    await showSlip(game, L.ncSlip, { title: L.boardTitle });
    await say('maya', L.boardMaya, { face: 'smile' });
    F('board', true);
    story.flag('board.count', 29);
  }

  // ---------------------------------------------------------------------------------------------
  // the Note Wall: Nay Chi's hook, Ko Doe
  // ---------------------------------------------------------------------------------------------
  async function ncHook() {
    await say('naychi', L.nc1, { face: 'happy' });
    await say('maya', L.ncMaya1, { face: 'think' });
    await say('naychi', L.nc2, { face: 'worried' });
    await say('naychi', L.ncWait, { face: 'think' });
    F('ncMet', true);
    story.talking = false;
    // she goes somewhere quiet to think (the tea shop at the Row's east end)
    const e = story.people.get('naychi');
    if (e) { e.job = null; story.walkPerson('naychi', SPOT.teaFront.x, SPOT.teaFront.z, 1.3).then(() => { if (alive && !story.inRoom && !F('p4') && !p4.active) story.remove('naychi'); }); }
  }

  // ---------------------------------------------------------------------------------------------
  // piece 1 · the bakery
  // ---------------------------------------------------------------------------------------------
  let kmCalling = false;
  async function kmCall() {
    if (F('p1.call') || kmCalling || story.inRoom) return;
    kmCalling = true;
    try {
      const e = story.spawn('khinmay', SPOT.kmDoor);
      await stage(async () => {
        faceMaya(SPOT.kmDoor.x, SPOT.kmDoor.z);
        e?.p.emote('wave');
        await say('khinmay', L.kmCall, { face: 'smile' });
      });
      F('p1.call', true);
      if (e) await Promise.race([story.walkPerson('khinmay', PL.bakery.door.x, PL.bakery.door.z - 0.2, 1.4), wait(5000)]);
      if (!story.inRoom) story.remove('khinmay');
    } finally { kmCalling = false; }
  }
  async function piece1(room) {
    if (F('p1.in')) return;
    const sp = room?.spots?.hold;
    if (sp) { await walkMaya(sp.x, sp.z, 5000); faceMaya(-0.9, -1.4); }
    await say('khinmay', L.km1, { face: 'hot' });
    const r = await hold({ title: L.holdTitle, hint: L.holdHint, mode: 'pin', thing: 'pin', burnAt: 1.2, maxHold: 4, calm: 4, dropped: L.holdDropped, tooLong: L.holdTooLong });
    F('p1.held', +(r?.held || 0).toFixed(1));
    await say('maya', L.p1Maya, { face: 'worried' });
    await say('khinmay', [L.km2[0]], { face: 'sad' });
    // she feeds the reply into the left oven (a puff of flame), then goes back to her dough
    await Promise.race([story.walkPerson('khinmay', -1.6, -2.6, 1.4), wait(4000)]);
    const km = story.people.get('khinmay');
    if (km) km.p.root.rotation.y = Math.PI;
    call(game.audio, 'play', 'thud');
    call(game.fx, 'burst', 'puff', v3.set(-1.9, 1.0, -3.0), { count: 10, spread: 0.3, up: 0.9 });
    call(game.fx, 'burst', 'sparkle', v3.set(-1.9, 1.0, -3.0), { count: 6 });
    await wait(500);
    await say('khinmay', [L.km2[1], L.km2[2]], { face: 'think' });
    const kk = room?.spots?.kmKnead;
    if (kk) story.walkPerson('khinmay', kk.x, kk.z, 1.2);
    F('p1.in', true);
  }
  async function p1Pass() {
    await say('maya', L.p1Pass, { face: 'smile' });
    F('p1', true);
    await addNote('burn');
  }
  async function loafPress() {
    if (F('rumour.loaf')) { await say('maya', L.loafAgain, { face: 'smile' }); return; }
    call(game.maya, 'emote', 'point');
    await say('maya', L.loafPress, { face: 'surprised' });
    proof('loaf', L.proofLoaf);
  }

  // ---------------------------------------------------------------------------------------------
  // piece 2 · the noodle house
  // ---------------------------------------------------------------------------------------------
  async function p2Intro() {
    if (F('p2.intro') || F('p2')) return;
    await wait(500);
    await say('maungarkar', L.my1, { face: 'happy' });
    await say('maya', L.pu1, { face: 'think' });
    await say('sawyu', L.sy1, { face: 'smile' });
    await say('maya', L.stoolHint, { face: 'think' });
    F('p2.intro', true);
  }
  async function eat(stall, room) {
    const sp = room?.spots?.[stall === 'soup' ? 'stoolRed' : 'stoolBlue'];
    if (sp) { await walkMaya(sp.x, sp.z, 5000); faceMaya(stall === 'soup' ? -2.3 : 2.3, 1.4); }
    call(game.audio, 'play', 'click');
    await say('maya', L.bite[stall], { face: 'happy' });
    if (F('p2')) return;
    F('p2.stall', stall);
    const other = stall === 'soup' ? 'upu' : 'sawyu';
    await say(other, stall === 'soup' ? L.otherDry : L.otherSoup, { face: 'sad' });
    for (;;) {
      const i = await D.choose(L.p2Choices);
      if (i === 0) { await say('maya', L.p2Bad, { face: 'think' }); continue; }
      if (i === 1) { await say(other, other === 'upu' ? L.p2SamePu : L.p2SameSy, { face: 'hot' }); continue; }
      break;
    }
    await say(other, L.p2OkOwner, { face: 'smile' });
    if (story.people.get('maungarkar')) await say('maungarkar', L.p2OkArkar, { face: 'shy' });
    F('p2', true);
    await addNote('notbad');
  }
  let pinHeard = false;
  async function pinPair() {
    if (!LOOKS) return;
    if (!F('p4')) {
      await sayAs(L.pinNameA, LOOKS.pinA, L.pinA);
      await sayAs(L.pinNameB, LOOKS.pinB, L.pinB);
      await sayAs(L.pinNameA, LOOKS.pinA, L.pinA2);
      await say('maya', L.pinMaya, { face: 'think' });
      F('pinHeard', true);
    } else {
      await sayAs(L.pinNameA, LOOKS.pinA, L.pinAfter);
      F('pinAfter', true);
    }
  }

  // ---------------------------------------------------------------------------------------------
  // piece 3 · Maung Pan's "someday" tree
  // ---------------------------------------------------------------------------------------------
  async function panTalk() {
    if (F('p3')) return say('maungpan', F('p7') ? L.ml4 : rot('pan', L.amb.panRain), { face: 'happy' });
    if (F('p3.out')) return say('maungpan', L.p3Ok1, { face: 'happy' });
    if (!F('p3.met')) { await say('maungpan', L.ml1, { face: 'smile' }); F('p3.met', true); return; }
    if ((F('p3.flicks') || 0) < 10) return say('maungpan', [L.ml1[1]], { face: 'smile' });
    return panChoice();
  }
  async function panChoice() {
    for (;;) {
      const i = await D.choose(L.p3Choices);
      if (i === 0) { await say('maungpan', L.p3Told, { face: 'worried' }); story.people.get('maungpan')?.p.emote('slump'); continue; }
      if (i === 1) { row.lamps && call(game.audio, 'play', 'page'); await say('maya', L.p3Later, { face: 'think' }); continue; }
      break;
    }
    await say('maungpan', L.p3Ok0, { face: 'happy' });
    F('p3.out', true);
    story.talking = false;
    // he takes the tin off the sill himself and walks out of the class door
    const room = story.room;
    const d = room?.door || { x: 0, z: 3.6 };
    story.walkPerson('maungpan', d.x, d.z - 0.2, 1.5).then(() => { if (story.inRoom === 'eveningclass') story.remove('maungpan'); });
  }
  async function flipCalendar() {
    const room = story.room;
    if (!F('p3.met')) { await say('maya', L.calendarBefore, { face: 'think' }); return; }
    let n = F('p3.flicks') || 0;
    if (n >= 10) { if (!F('p3.out')) { await say('maungpan', L.ml2, { face: 'surprised' }); await panChoice(); } return; }
    n++;
    F('p3.flicks', n);
    call(room?.props, 'flipCalendar');
    call(game.audio, 'play', 'page');
    D.bark('maya', L.leaf(n), 900);
    if (n === 10) {
      await wait(600);
      call(game.audio, 'play', 'page');
      await say('maya', [L.sweep], { face: 'surprised', auto: true });
      await say('maungpan', L.ml2, { face: 'surprised' });
      await panChoice();
    }
  }
  function placePanOutside() {
    if (story.people.get('maungpan')) return;
    story.spawn('maungpan', { x: SPOT.panBench.x, z: SPOT.panBench.z, heading: SPOT.panBench.heading });
    story.setJob('maungpan', { area: { x: PL.kite.x, z: PL.kite.z + 1.8, r: 2.0 }, spot: { x: SPOT.panBench.x, z: SPOT.panBench.z, h: 0.6 }, mood: 'play', workChance: 0.6, lookAt: { x: PL.kite.x, z: PL.kite.z - 2 } });
  }
  let panWalking = false;
  async function panPlants() {
    // outdoors: from the class door up the Row to the patch by the kite bench; he digs and plants it
    if (panWalking) return;
    panWalking = true;
    try {
      const d = front(DOORS.eveningclass || PL.klass.door, 0.9);
      if (!story.people.get('maungpan')) story.spawn('maungpan', { x: d.x, z: d.z, heading: Math.PI });
      await story.walkPerson('maungpan', 214, 198.6, 1.5);
      await story.walkPerson('maungpan', PL.patch.x - 0.4, PL.patch.z + 0.5, 1.5);
      if (!alive) return;
      const e = story.people.get('maungpan');
      if (e) { e.p.root.rotation.y = 0.6; e.p.emote('bow'); }
      if (F('p7') && near(PL.patch.x, PL.patch.z, 12)) await stage(() => say('uchit', L.spoon, { face: 'smile' }));
      await wait(1400);
      row.sapling.root.visible = true;
      row.sapling.plant();
      call(game.fx, 'burst', 'dust', v3.set(PL.patch.x, 0.1, PL.patch.z), { count: 8 });
      if (near(PL.patch.x, PL.patch.z, 12)) await stage(() => say('maungpan', L.p3Ok1, { face: 'happy' }));
      else story.bark('maungpan', L.p3Ok1[0], 3000);
      F('p3', true);
      placePanOutside();
      await stage(() => addNote('today'));
    } finally { panWalking = false; }
  }

  // ---------------------------------------------------------------------------------------------
  // piece 5 · U San Shar's boxes
  // ---------------------------------------------------------------------------------------------
  async function ssTalk() {
    if (F('p5')) return say('sanshar', L.ssEnd, { face: 'smile' });
    if (F('p5.out')) return say('sanshar', L.ssFollow, { face: 'smile' });
    await say('sanshar', L.ss1, { face: 'sad', mood: 'down' });
    await say('maya', L.ssAsk, { face: 'think' });
    for (;;) {
      const i = await D.choose(L.ssThoughts);
      if (i === 2) break;
      await say('sanshar', [L.ssThoughts[i]], { face: 'sad' });
      await say('maya', L.ssWrong, { face: 'think' });
    }
    story.people.get('sanshar')?.p.setMood(null);
    await say('sanshar', L.ssTrue, { face: 'think' });
    await say('sanshar', L.ssFollow, { face: 'smile' });
    F('p5.out', true);
    story.talking = false;
    const d = story.room?.door || { x: 0, z: 2.6 };
    story.walkPerson('sanshar', d.x, d.z - 0.2, 1.2).then(() => { if (story.inRoom === 'boxshop') story.remove('sanshar'); });
  }
  let ssWalking = false, ssAtSteps = false;
  async function ssToSteps() {
    if (ssWalking || ssAtSteps) return;
    ssWalking = true;
    try {
      const d = front(DOORS.boxshop || PL.box.door, 0.9);
      if (!story.people.get('sanshar')) story.spawn('sanshar', { x: d.x, z: d.z, heading: -Math.PI / 2 });
      await story.walkPerson('sanshar', PL.laneMouth.x, 222, 1.1);
      await story.walkPerson('sanshar', PL.laneMouth.x, PL.laneMouth.z - 0.6, 1.1);
      await story.walkPerson('sanshar', SPOT.steps.x, SPOT.steps.z, 1.1);
      const e = story.people.get('sanshar');
      if (e) e.p.root.rotation.y = SPOT.steps.heading;
      ssAtSteps = true;
    } finally { ssWalking = false; }
  }
  async function fold() {
    let r = await trace({ title: L.traceTitle, hint: L.traceHint, path: 'fold', wobble: 6, tolerance: 20, round: 1, rounds: 1 });
    if (!r?.cancelled && (!r?.ok || (r.score ?? 1) < 0.5)) {
      await say('sanshar', L.ssSlow, { face: 'smile' });
      r = await trace({ title: L.traceTitle, hint: L.traceHint, path: 'fold', wobble: 4, tolerance: 24, round: 1, rounds: 1 });
    }
    F('p5.fold', +(r?.score ?? 0).toFixed(2));
    await say('sanshar', L.ssExplain, { face: 'smile' });
    if (LOOKS) { await sayAs(L.teenNameA, TEEN_LOOKS.teenA, L.teenA); await sayAs(L.teenNameB, TEEN_LOOKS.teenB, L.teenB); }
    await say('sanshar', L.ssEnd, { face: 'happy' });
    F('p5', true);
    await addNote('notme');
    // he goes back to his bench down the lane
    ssAtSteps = false;
    const d = front(DOORS.boxshop || PL.box.door, 0.6);
    story.walkPerson('sanshar', PL.laneMouth.x, 222, 1.1).then(() => story.walkPerson('sanshar', d.x, d.z, 1.1)).then(() => { if (!story.inRoom) story.remove('sanshar'); });
  }

  // ---------------------------------------------------------------------------------------------
  // piece 6 · the tea-shop song
  // ---------------------------------------------------------------------------------------------
  async function cherryTalk() {
    if (F('p6')) { if (F('lamp') && !F('song')) return song(); return say('cherry', F('song') ? L.ch4 : rot('cherry', L.amb.cherryAfter), { face: 'smile' }); }
    if (!F('p6.met')) {
      await say('cherry', L.ch1, { face: 'think' });
      await say('nyinyi', L.nn1, { face: 'happy' });
      F('p6.met', true);
      return;
    }
    if (F('p6.look.sheet') && F('p6.look.book')) return p6Decision();
    return say('cherry', rot('cherryLook', L.amb.cherryLook), { face: 'smile' });
  }
  const looked = new Set();
  async function look(kind) {
    if (F(`p6.look.${kind}`)) { await say('maya', [L.look[kind].gold], { face: 'think' }); return; }
    if (!looked.has(kind)) { looked.add(kind); await say('maya', [L.look[kind].pencil], { face: 'think' }); await say('maya', L.lookAgain, { face: 'think', auto: true }); }
    call(game.audio, 'play', 'chalk');
    await say('maya', [L.look[kind].gold], { face: 'surprised' });
    F(`p6.look.${kind}`, true);
    if (F('p6.met') && F('p6.look.sheet') && F('p6.look.book') && !F('p6')) await p6Decision();
  }
  async function p6Decision() {
    await say('cherry', L.ch2, { face: 'worried' });
    for (;;) {
      const i = await D.choose(L.p6Choices);
      if (i === 0) { await say('cherry', L.p6Lower, { face: 'sad' }); continue; }
      if (i === 1) { await say('cherry', L.p6Find, { face: 'think' }); continue; }
      break;
    }
    await say('cherry', L.p6Own, { face: 'think' });
    await say('nyinyi', L.nn2, { face: 'shy' });
    await say('cherry', L.ch3, { face: 'smile' });
    await wait(700);
    await say('maya', L.ch3Pause, { face: 'think' });
    F('p6', true);
    await addNote('standard');
    if (F('lamp') && story.inRoom === 'hearthtea') await song();
  }
  async function song() {
    if (F('song') || !F('p6')) return;
    call(game.audio, 'play', 'chime');
    call(game.fx, 'burst', 'note', v3.set(-1.35, 1.9, -3.3), { count: 8 });
    await say('maya', L.song, { face: 'smile' });
    await say('cherry', L.ch4, { face: 'happy' });
    if (story.people.get('khinmay')) await say('maya', L.khinmayHum, { face: 'smile' });
    F('song', true);
  }

  // ---------------------------------------------------------------------------------------------
  // piece 7 · Uncle Chit's sayings
  // ---------------------------------------------------------------------------------------------
  async function uchitTalk() {
    if (F('p7')) return say('uchit', rot('uchit', L.amb.uchitAfter), { face: 'smile' });
    await say('uchit', L.uc1, { face: 'smile' });
    const pan = F('p3') && story.people.get('maungpan');
    if (pan) await say('maungpan', L.ml3, { face: 'happy' });
    else await say('uchit', L.ucList, { face: 'smile' });
    await sort({
      title: L.sortTitle, hint: L.sortHint, who: 'uchit',
      baskets: L.sortBaskets, cards: L.sortCards,
      react: { wrongSeen: L.wrongSeen, wrongCheck: pan ? L.wrongCheck : L.wrongCheckChit },
    });
    if (pan) await say('maungpan', L.ml4, { face: 'think' });
    await say('uchit', L.uc2, { face: 'think' });
    F('rumour.rain', 'seen'); // the teller saw a sign (still pencil: nobody sees tomorrow)
    if (story.flag('rumour.rain') !== 'checked') story.flag('rumour.rain', 'seen');
    if (story.has('fivecard')) {
      await say('maya', [L.cardAsk], { face: 'think' });
      if ((await D.choose(L.cardChoices)) === 0) { story.use('fivecard'); await say('maya', L.cardRain, { face: 'think' }); F('rumour.rain.card', true); }
    }
    F('p7', true);
    await addNote('weigh');
  }

  // ---------------------------------------------------------------------------------------------
  // lamp-lighting and piece 4 (Nay Chi's talk, the ribbon, the quiet word)
  // ---------------------------------------------------------------------------------------------
  async function lampLighting() {
    F('lamp', true);
    game.day?.set?.(18.4);
    game.applyDayLook();
    row.lamps.setLit(1);
    placeExtras();
    if (story.people.get('naychi') && !F('p4') && !p4.active) story.remove('naychi');
    call(game.audio, 'play', 'chime');
    if (!story.inRoom) await stage(() => say('maya', L.lamp, { face: 'smile', auto: true }));
  }
  async function teaScene() {
    // in the tea shop at lamp-lighting: the song first if it is ready, Ko Doe's call through the window,
    // then the quiet talk at the corner table
    if (F('ncTalk') || story.inRoom !== 'hearthtea' || !story.people.get('naychi')) return;
    if (story.talk.waiting(TALK_D11_NAYCHI.id)) return say('naychi', D11_NC_AFTER.notYet, { face: 'think' });
    if (F('p6') && !F('song')) await song();
    call(game.audio, 'play', 'bell');
    await say('kodoe', L.ktWindow, { face: 'happy' });
    await say('naychi', L.ncLamp, { face: 'worried' });
    const sp = story.room?.spots?.talk;
    if (sp) { await walkMaya(sp.x, sp.z, 5000); faceMaya(2.98, -1.9); }
    const r = await story.talk.run(TALK_D11_NAYCHI);
    if (r?.won) {
      F('ncTalk', true);
      story.flag('talk.d3-naychi.smudge', false); // the Day 3 pencil smudge on her signpost is rubbed out
      story.flag('naychi.state', 'stands');
      p4.start('tea');
      return;
    }
    if (r?.reason === 'lean') {
      F('ncLean', true);
      await say('maya', D11_NC_AFTER.leanMaya, { face: 'worried' });
    }
    await say('naychi', D11_NC_AFTER.notYet, { face: 'think' });
  }

  // piece 4, outdoors: a small director (it runs while the player walks about; Maya keeps her distance)
  const p4 = {
    active: false, stage: null, path: [], paused: false, said: false, timer: 0, figures: [],
    start(st) { this.active = true; this.stage = st; F('p4.stage', st); },
  };
  const LANE = PL.laneMouth.x;
  const P4_TO_WALL = () => [{ x: SPOT.teaFront.x, z: 198.4 }, { x: 212, z: 198.4 }, { x: SPOT.ncWall.x, z: SPOT.ncWall.z }];
  const P4_TO_SHOP = () => { const d = front(DOORS.lampshop || PL.lamp.door, 0.8); return [{ x: W.x - 2.6, z: 197.6 }, { x: LANE, z: 199.4 }, { x: LANE, z: d.z }, d]; };
  const P4_BACK = () => [{ x: LANE, z: 205 }, { x: LANE, z: 199.4 }, { x: SPOT.ncWall.x, z: SPOT.ncWall.z }];
  function ncMover(e, onArrive) {
    e.job = null; e.walking = null;
    const tgt = new THREE.Vector3();
    e.ctl = (dt) => {
      const pos = e.p.root.position;
      const m = game.maya.root.position;
      const dM = Math.hypot(m.x - pos.x, m.z - pos.z);
      const dDoor = DOORS.lampshop || PL.lamp.door;
      const nearDoor = p4.stage === 'lane' && Math.hypot(m.x - dDoor.x, m.z - dDoor.z) < 4;
      // "let me do this one myself": she stops and turns to Maya until Maya is 6 m away again
      if (p4.stage === 'lane' && !story.inRoom && (dM < 4 || nearDoor) && !p4.paused) {
        p4.paused = true;
        if (!p4.said || p4.saidAt < performance.now() - 6000) { p4.said = true; p4.saidAt = performance.now(); story.bark('naychi', L.ncSelf, 3200); }
        F('p4.close', (F('p4.close') || 0) + 1);
      }
      if (p4.paused && dM > 6 && !nearDoor) p4.paused = false;
      if (p4.paused) {
        const face = Math.atan2(m.x - pos.x, m.z - pos.z);
        let r = face - e.p.root.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r));
        e.p.root.rotation.y += r * (1 - Math.exp(-dt * 6));
        e.p.update(dt, { speed: 0 });
        return;
      }
      const wp = p4.path[0];
      if (!wp) { e.ctl = null; e.home = { x: pos.x, z: pos.z, h: e.p.root.rotation.y }; onArrive?.(); return; }
      tgt.set(wp.x, 0, wp.z);
      const dx = wp.x - pos.x, dz = wp.z - pos.z, d = Math.hypot(dx, dz);
      const sp = 1.25;
      if (d < 0.08) { p4.path.shift(); e.p.update(dt, { speed: 0 }); return; }
      pos.x += (dx / d) * Math.min(d, sp * dt); pos.z += (dz / d) * Math.min(d, sp * dt);
      const face = Math.atan2(dx, dz);
      let r = face - e.p.root.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r));
      e.p.root.rotation.y += r * (1 - Math.exp(-dt * 10));
      e.ob.x = pos.x; e.ob.z = pos.z;
      e.p.lookAt(null);
      e.p.update(dt, { speed: sp });
    };
  }
  function ensureNc(at) {
    let e = story.people.get('naychi');
    if (!e) e = story.spawn('naychi', { x: at.x, z: at.z, heading: 0 });
    return e;
  }
  function windowFigures(on) {
    for (const f of p4.figures) { f.root.parent?.remove(f.root); f.dispose(); }
    p4.figures.length = 0;
    if (!on) return;
    const [a, b] = row.windowAt;
    const nc = createPerson(castById('naychi').look), ny = createPerson(castById('nyein').look);
    nc.root.position.set(a.x, 0, a.z); ny.root.position.set(b.x, 0, b.z);
    nc.root.rotation.y = Math.atan2(b.x - a.x, b.z - a.z) + 0.5;
    ny.root.rotation.y = Math.atan2(a.x - b.x, a.z - b.z) - 0.5;
    game.world.scene.add(nc.root, ny.root);
    p4.figures.push(nc, ny);
  }
  function p4Update(dt) {
    if (!p4.active || story.inRoom || game.mode !== 'world') return;
    const st = p4.stage;
    if (st === 'tea') {
      // she has left the tea shop with the rosette: down the Row to the Wall
      const e = ensureNc(SPOT.teaFront);
      p4.path = P4_TO_WALL();
      p4.start('toWall');
      ncMover(e, () => p4.start('wall'));
    } else if (st === 'toWall' || st === 'toShop' || st === 'back') {
      const e = story.people.get('naychi');
      if (!e) { p4.start(st === 'toWall' ? 'tea' : st === 'toShop' ? 'wall2' : 'paint2'); return; }
      if (!e.ctl) { // resumed from a save mid-walk
        p4.path = st === 'toWall' ? P4_TO_WALL() : st === 'toShop' ? P4_TO_SHOP() : P4_BACK();
        ncMover(e, () => p4.start(st === 'toWall' ? 'wall' : st === 'toShop' ? 'shop' : 'atWall'));
      }
    } else if (st === 'wall') {
      // at the Wall, before Ko Doe and the pin pair: the rosette goes into her drawer, the hook stays empty
      if (story.talking || game.busy) return;
      p4.stage = 'wallTalk';
      const close = near(SPOT.ncWall.x, SPOT.ncWall.z, 12);
      const go = async () => {
        if (close) {
          await say('naychi', L.ncRibbon, { face: 'think' });
          await say('kodoe', L.ktHuff, { face: 'hot', emote: 'fists' });
          await say('naychi', L.ncToKt, { face: 'smile' });
        } else story.bark('naychi', L.ncRibbon[0], 2600);
      };
      (close ? stage(go) : go()).then(() => { p4.start('wall2'); });
    } else if (st === 'wall2') {
      const e = ensureNc(SPOT.ncWall);
      p4.path = P4_TO_SHOP();
      p4.start('toShop');
      p4.paused = false;
      ncMover(e, () => p4.start('shop'));
      p4.stage = 'lane'; F('p4.stage', 'toShop');
      e.__toShop = true;
    } else if (st === 'lane') {
      // (the mover above runs; ncMover sets 'shop' on arrival)
    } else if (st === 'shop') {
      // she goes in; the door is shut to Maya while she is inside; the scene is seen through the lit window
      story.remove('naychi');
      if (DOORS.lampshop) DOORS.lampshop.r = 0;
      windowFigures(true);
      p4.timer = 0;
      p4.start('inside');
    } else if (st === 'inside') {
      const d = DOORS.lampshop || PL.lamp.door;
      const tooNear = near(d.x, d.z, 4);
      if (tooNear) {
        if (!p4.said || p4.saidAt < performance.now() - 6000) { p4.said = true; p4.saidAt = performance.now(); story.bark('naychi', L.ncSelf, 3200); }
        return; // the quiet word waits until Maya is away from the door
      }
      if (DOORS.lampshop) DOORS.lampshop.r = 0;
      p4.timer += dt;
      const [nc, ny] = p4.figures;
      if (p4.timer > 2.5 && !p4.leaned) { p4.leaned = true; nc?.emote('nod'); nc?.talk(2.5); }
      if (p4.timer > 5.5 && !p4.laughed) { p4.laughed = true; ny?.setFace('surprised', 1.2); ny?.emote('shrug'); setTimeout(() => ny?.setFace('happy', 3), 1200); }
      if (p4.timer > 8) p4.start('paint');
    } else if (st === 'paint') {
      // Daw Nyein comes out with a brush and a step stool and repaints one letter, in the lane
      p4.stage = 'painting';
      (async () => {
        const d = DOORS.lampshop || PL.lamp.door;
        const out = front(d, 0.9);
        windowFigures(false);
        const ny = story.spawn('nyein', { x: out.x, z: out.z, heading: d.facing });
        await Promise.race([story.walkPerson('nyein', row.signAt.x + 0.9, row.signAt.z, 1.1), wait(5000)]);
        if (ny) { ny.p.root.rotation.y = -Math.PI / 2; ny.p.emote('point'); }
        call(game.audio, 'play', 'chalk');
        await wait(2200);
        row.sign.setText({ my: 'သံပြား မီးအိမ်', en: 'Tin lamps' });
        call(game.fx, 'burst', 'sparkle', v3.set(row.signAt.x, 2.7, row.signAt.z), { count: 10 });
        F('signFixed', true);
        F('distance', true);
        if (ny) ny.p.emote('cheer');
        await wait(900);
        if (near(row.signAt.x, row.signAt.z, 30) && !story.talking) await stage(() => say('maya', L.notMine, { face: 'smile' }));
        else story.bark('maya', L.notMine[0], 3000);
        await Promise.race([story.walkPerson('nyein', out.x, out.z, 1.1), wait(5000)]);
        if (!story.inRoom) story.remove('nyein');
        const e = ensureNc(out);
        e.p.root.rotation.y = Math.PI;
        p4.path = P4_BACK();
        p4.start('back');
        ncMover(e, () => p4.start('atWall'));
      })().catch((err) => console.error('day11 p4 paint', err));
    } else if (st === 'paint2') {
      p4.start('paint');
    } else if (st === 'atWall') {
      // she unpins Ko Doe's note herself, then the quiet end (when Maya is close enough to hear it)
      if (!p4.unpinned) { p4.unpinned = true; row.wall.removeNote(3); call(game.audio, 'play', 'page'); }
      if (story.talking || game.busy || !near(SPOT.ncWall.x, SPOT.ncWall.z, 7)) return;
      p4.stage = 'ending';
      stage(async () => {
        await say('naychi', L.ncBack, { face: 'happy' });
        await say('maya', L.mayaNc, { face: 'happy' });
        await say('kodoe', L.ktAfter, { face: 'sad' });
        proof('wall', L.proofWall);
        F('slate.2', true); F('slate.8', true);
        await say('maya', L.slates, { face: 'smile' });
        F('p4', true);
        F('p4.stage', 'done');
        await addNote('quiet');
      }).then(() => {
        p4.active = false;
        if (DOORS.lampshop) DOORS.lampshop.r = 0.75;
        home.setBoard(29, true);
        placeExtras();
        const e = story.people.get('naychi');
        if (e) { e.ctl = null; story.setJob('naychi', { area: { x: W.x - 2.2, z: W.z + 1.8, r: 1.6 }, spot: { x: SPOT.ncStool.x, z: SPOT.ncStool.z, h: 0.35 }, mood: 'read', workChance: 0.8, workFor: [6, 12] }); }
      });
    }
  }
  // resume piece 4 from the save
  if (F('ncTalk') && !F('p4')) {
    const st = F('p4.stage');
    p4.active = true;
    p4.stage = st === 'toWall' || !st ? 'tea' : st === 'toShop' || st === 'lane' || st === 'wall2' ? 'wall2' : st === 'inside' || st === 'shop' ? 'shop' : st === 'back' || st === 'atWall' ? 'atWallResume' : st;
    if (p4.stage === 'atWallResume') { ensureNc(SPOT.ncWall); p4.stage = F('signFixed') ? 'atWall' : 'paint'; }
    if (st === 'wall' || st === 'wallTalk') p4.stage = 'wall2';
  }

  // ---------------------------------------------------------------------------------------------
  // the close: all seven pieces
  // ---------------------------------------------------------------------------------------------
  async function closeDay() {
    F('ch18Done', true);
    dressWall();
    await say('maya', L.closeMaya, { face: 'smile' });
    await say('maya', L.goHome, { face: 'smile' });
  }

  // ---------------------------------------------------------------------------------------------
  // the Bookmark Desk `hearthClass`: only if Day 9 left it dark, with today's lines first (8.2)
  // ---------------------------------------------------------------------------------------------
  const ow = story.openWorld;
  const lightDesk0 = ow?.lightDesk;
  if (ow && lightDesk0 && !story.flag('desk:hearthClass')) {
    ow.lightDesk = async (d) => {
      if (d?.id !== 'hearthClass' || story.flag('desk:hearthClass')) return lightDesk0.call(ow, d);
      if (story.talking || game.busy) return;
      const ok = await stage(async () => {
        await say('maya', [L.deskQ], { face: 'think' });
        for (;;) { const i = await D.choose(L.desk); if (i === 0) break; await say('maya', L.deskWrong, { face: 'think' }); }
      });
      if (!ok) return;
      await lightDesk0.call(ow, d);
      await stage(async () => { await say('maya', L.deskDone, { face: 'happy', auto: true }); });
      F('desk', true);
      for (const r of ['loaf', 'wall']) if (!story.flag(`rumour.${r}`)) story.flag(`rumour.${r}`, 'pencil');
    };
  }

  // ---------------------------------------------------------------------------------------------
  // the night page (at the Writing Room door, once all seven pieces are done)
  // ---------------------------------------------------------------------------------------------
  let nightBusy = false;
  async function night() {
    if (nightBusy) return;
    nightBusy = true;
    const can = ['naychi', 'khinmay', 'maungarkar', 'maungpan', 'uchit', 'cherry', 'sanshar', 'nyein', 'upu', 'sawyu', 'kodoe', 'eimon'];
    let who = can.filter((id) => met.has(id));
    if (!who.length) who = ['naychi'];
    // 7.4: the reply letter's back page gains one pencil line (after the stamp, automatically)
    story.flag('reply.d11', L.reply);
    try {
      await nightPage(story, {
        day: 11,
        truth: { q: L.nightQ, choices: L.nightChoices, right: 1, wrong: L.nightWrong },
        before: async () => {
          if (story.flag('rumour.rain')) { await say('maya', L.windowOpen, { face: 'smile' }); save.home.window = 'open'; F('windowOpen', true); }
        },
        sleep: { q: L.sleepQ, who },
        stamps: [18],
        stampText: L.stampText,
        tomorrow: L.tomorrow,
      });
    } finally { nightBusy = false; }
  }

  // ---------------------------------------------------------------------------------------------
  // who says what (a tap on someone)
  // ---------------------------------------------------------------------------------------------
  const talk = {
    wintwar: async () => {
      if (!F('morning')) return morning();
      if (F('p4') && !F('wwEve')) { F('wwEve', true); return say('wintwar', L.wwEvening, { face: 'smile' }); }
      return say('wintwar', L.wwLater, { face: 'smile' });
    },
    naychi: async () => {
      if (!F('ncMet')) return ncHook();
      if (F('p4')) return say('naychi', F('ch18Done') ? L.closeNc : [L.ncBack[1]], { face: 'happy' });
      if (story.inRoom === 'hearthtea') {
        if (F('lamp') && !F('ncTalk')) return teaScene();
        return say('naychi', L.ncWait, { face: 'think' });
      }
      if (p4.active) return say('naychi', [L.ncSelf], { face: 'think' });
      return say('naychi', L.ncWait, { face: 'think' });
    },
    kodoe: async () => {
      if (F('p4')) return say('kodoe', rot('kodoe', [L.ktAfter, L.ktAfter2]), { face: 'think' });
      if (F('lamp')) return say('kodoe', L.ktLamp, { face: 'happy' });
      return say('kodoe', L.kt1, { face: 'happy' });
    },
    khinmay: async () => {
      if (story.inRoom === 'bakery' && F('p1.call') && !F('p1.in')) return piece1(story.room);
      if (story.inRoom === 'hearthtea') return say('khinmay', F('song') ? L.khinmayHum : rot('kmTea', L.amb.khinmayAfter), { face: 'smile' });
      return say('khinmay', rot('km', F('p1.in') ? L.amb.khinmayAfter : L.amb.khinmayBefore), { face: F('p1.in') ? 'smile' : 'hot' });
    },
    maungarkar: async () => say('maungarkar', rot('arkar', F('p2') ? L.amb.arkarAfter : L.amb.arkarBefore), { face: 'smile' }),
    eimon: async () => say('eimon', rot('eimon', F('p3') ? L.amb.eimonAfter : L.amb.eimonBefore), { face: 'think' }),
    sawyu: async () => say('sawyu', F('p2') ? L.p2OkOwner : L.sy1, { face: 'smile' }),
    upu: async () => (F('p2') ? say('upu', L.amb.upuAfter[0], { face: 'smile' }) : say('maya', L.amb.upuBefore[0], { face: 'think' })),
    maungpan: async () => panTalk(),
    uchit: async () => uchitTalk(),
    cherry: async () => cherryTalk(),
    nyinyi: async () => say('nyinyi', F('p6') ? L.amb.nyinyiAfter[0] : L.nn1, { face: F('p6') ? 'shy' : 'happy' }),
    sanshar: async () => {
      if (ssAtSteps && !F('p5')) return fold();
      return ssTalk();
    },
    nyein: async () => {
      if (F('p4')) return say('nyein', rot('nyein', [L.nyeinAfter, L.nyeinAfter2]), { face: 'happy' });
      await say('nyein', L.nyein1, { face: 'happy' });
    },
  };

  // ---------------------------------------------------------------------------------------------
  // rooms (INDEX 13.2 layouts; the room files own the furniture and the spots)
  // ---------------------------------------------------------------------------------------------
  function roomCast(id, room) {
    const c = (who, spot) => ({ id: who, spot });
    switch (id) {
      case 'bakery': return [c('khinmay', 'kmKnead'), ...(F('p2') ? [c('maungarkar', 'arkarRack')] : [])];
      case 'noodlehouse': return [c('sawyu', 'sawyu'), c('upu', 'upu'), c('eimon', 'emLoop2'), ...(F('p2') ? [] : [c('maungarkar', 'arkarRed')]),
        ...(F('lamp') && !F('p4') ? [] : [c('pinA', 'pinA'), c('pinB', 'pinB')]), c('diner', 'qRed1'), c('customer', 'qRed2'), c('walkon', 'qBlue1'), c('diner2', 'qBlue2')];
      case 'eveningclass': return F('p3.out') ? [] : [c('maungpan', 'pan')];
      case 'boxshop': return F('p5.out') && !F('p5') ? [] : [c('sanshar', 'sanshar')];
      case 'lampshop': return p4.active && ['inside', 'paint', 'painting', 'shop'].includes(p4.stage) ? [] : [c('nyein', 'nyein')];
      case 'hearthtea': {
        const list = [c('hearthuncle', 'uncle'), c('nyinyi', 'nyinyi')];
        list.push(c('cherry', 'cherry'));
        if (F('lamp')) {
          list.push(c('khinmay', 'khinmayCounter'));
          if (!F('ncTalk')) list.push(c('naychi', 'naychiLamp'));
        } else {
          list.push(c('diner', 'reg1'), c('diner2', 'reg2'));
          if (F('ncMet') && !F('p4')) list.push(c('naychi', 'naychiLamp'));
        }
        return list;
      }
      default: return undefined;
    }
  }
  const STUB = { userData: { update() {} } };
  function addStation(room, id, x, z, look, r = 0.6) {
    const list = room?.stations;
    if (!list || list.some((s) => s.id === id)) return;
    list.push({ id, x, z, r, look, marker: STUB, emote: null, face: 'smile', labelAnchor: new THREE.Vector3(look.x, 1.0, look.z) });
  }
  let pinCheck = false;
  async function enterRoom(id, room) {
    // the close, low follow camera inside (never the whole-room view)
    if (story.doors?.roomCam) story.doors.roomCam(); else game.rig.setFollow(ROOM_CLOSE); // doors.js's shared close, low room camera
    if (id === 'noodlehouse') {
      const s = room.spots || {};
      if (s.stoolRed) addStation(room, 'd11stoolRed', s.stoolRed.x, s.stoolRed.z + 0.1, { x: -2.3, z: 1.4 });
      if (s.stoolBlue) addStation(room, 'd11stoolBlue', s.stoolBlue.x, s.stoolBlue.z + 0.1, { x: 2.3, z: 1.4 });
      pinCheck = true;
      if (!F('p2') && !F('p2.intro')) await stage(p2Intro);
    } else if (id === 'bakery') {
      // Maya came in before passing note 1 (so Daw Khin May never called from her door): her hands are in the
      // dough all the same, and she asks for the pin now (note 1 is still walked past outside afterwards)
      if (!F('p1.call') && F('ncMet') && !F('p1.in')) F('p1.call', true);
      if (F('p1.call') && !F('p1.in')) { await wait(400); await stage(() => piece1(room)); }
    } else if (id === 'hearthtea') {
      if (F('lamp') && F('p6') && !F('song')) await stage(song);
      if (F('lamp') && !F('ncTalk') && !story.talk.waiting(TALK_D11_NAYCHI.id)) { await wait(300); await stage(teaScene); }
    }
  }
  function leaveRoom(id) {
    pinCheck = false;
    // Maung Pan / U San Shar walked out of their rooms: outdoors they carry on (update)
    void id;
  }
  function station(id) {
    const room = story.room;
    const run = (fn) => { stage(fn); return true; };
    switch (id) {
      case 'breadShelf': return run(loafPress);
      case 'workTable': return F('p1.call') && !F('p1.in') ? run(() => piece1(room)) : run(() => say('maya', [{ my: '(မုန့်ညက်တွေ… ဂျုံမှုန့်တွေ ဖွေးနေတာပဲ။)', en: '(Dough everywhere… all white with flour.)' }], { face: 'smile' }));
      case 'd11stoolRed': return run(() => eat('soup', room));
      case 'd11stoolBlue': return run(() => eat('dry', room));
      case 'calendar': if (story.inRoom === 'eveningclass') return run(flipCalendar); return false;
      case 'sill': return run(() => say('maya', F('p3.out') ? [{ my: '(ပြတင်းခုံ လွတ်သွားပြီ။ ဘူးလေး မရှိတော့ဘူး။)', en: '(The sill is bare. The tin has gone.)' }] : [{ my: '(ဘူးထဲမှာ မန်ကျည်းပင်လေး။ အောက်ခြေအပေါက်ကနေ အမြစ်တွေ ထွက်နေပြီ။)', en: '(A tamarind seedling in a tin. Roots poking out of the drain hole.)' }], { face: 'think' }));
      case 'practiceSheet': return run(() => look('sheet'));
      case 'songbook': return run(() => look('book'));
      case 'kettle': return run(() => sayAs(L.uncleName, LOOKS?.hearthuncle, F('p6') ? L.uncleAfter : L.uncleBefore));
      case 'cornerTable': return F('lamp') && !F('ncTalk') ? run(teaScene) : false;
      case 'counter': if (story.inRoom === 'lampshop' && story.people.get('nyein')) { story.approach(story.people.get('nyein')); return true; } return false;
      default: return false;
    }
  }

  // ---------------------------------------------------------------------------------------------
  // every frame
  // ---------------------------------------------------------------------------------------------
  let checkT = 0;
  function update(dt, t) {
    if (!alive) return;
    row.update(dt, t);
    for (const x of extras.values()) {
      const m = game.maya.root.position, q = x.p.root.position;
      x.p.lookAt(Math.hypot(m.x - q.x, m.z - q.z) < 3.5 && outdoors() ? v3.set(m.x, 1.0, m.z) : null);
      x.p.update(dt, { speed: 0 });
      // soft to bump into
      if (story.foot.active && outdoors()) {
        const wp = story.foot.walker.pos, dx = wp.x - q.x, dz = wp.y - q.z, d = Math.hypot(dx, dz), min = (x.p.radius || 0.3) + 0.28;
        if (d < min && d > 1e-4) { const k = (min - d) * Math.min(1, dt * 12); wp.x += (dx / d) * k; wp.y += (dz / d) * k; }
      }
    }
    for (const f of p4.figures) f.update(dt, { speed: 0 });
    p4Update(dt);
    if ((checkT -= dt) > 0) return;
    checkT = 0.2;
    if (story.talking || game.busy || game.ui.dialogOpen) return;
    const m = mayaXZ();
    // inside: the pin pair is overheard when Maya passes their table
    if (story.inRoom === 'noodlehouse' && pinCheck && game.walker) {
      const wp = game.walker.pos;
      if (Math.hypot(wp.x - 2.2, wp.y + 0.6) < 1.7 && ((!F('p4') && !F('pinHeard')) || (F('p4') && !F('pinAfter')))) { pinCheck = false; stage(pinPair).then(() => { pinCheck = true; }); }
      return;
    }
    if (!outdoors()) return;
    // lamp-lighting: any four of the six pieces
    if (!F('lamp') && pieceCount() >= 4) { lampLighting(); return; }
    // all seven
    if (!F('ch18Done') && PIECES.every((k) => F(k)) && F('p4')) { stage(closeDay); return; }
    const onFoot = story.foot.active;
    // arriving on Hearth Row
    if (F('morning') && !F('arrived') && m.x > 120 && m.x < 262 && m.z > 186 && m.z < 236) {
      F('arrived', true);
      const byCar = !onFoot;
      stage(async () => {
        if (byCar) { game.ui.bark?.(`${tr(L.vanBoyName)}: ${tr(L.vanBoy)}`, { ms: 4200 }); await wait(1600); }
        await say('maya', L.arrive, { face: 'think' });
      });
      return;
    }
    if (!onFoot) {
      // night page by car, as Day 1 allows
      if (F('ch18Done') && !F('done') && nightArmed() && Math.hypot(game.car.root.position.x - ab.x, game.car.root.position.z - (ab.z + 3)) < 2.2) night();
      return;
    }
    // Nay Chi at the Wall, the first time Maya comes close
    const nc = story.people.get('naychi');
    if (!F('ncMet') && nc && Math.hypot(m.x - nc.p.root.position.x, m.z - nc.p.root.position.z) < 3.6) { story.talkTo(nc); return; }
    // piece 1: Daw Khin May calls from her door when Maya comes near note 1; then, out again, Maya walks past it
    const n1 = row.wallSlot(0);
    if (!F('p1.call') && Math.hypot(m.x - n1.x, m.z - n1.z) < 3) { kmCall(); return; }
    if (F('p1.in') && !F('p1') && Math.hypot(m.x - n1.x, m.z - (n1.z + 1.1)) < 2.0) { stage(p1Pass); return; }
    // piece 3: Maung Pan carries the tin out and plants it
    if (F('p3.out') && !F('p3') && !panWalking) { panPlants(); return; }
    // piece 5: U San Shar walks up the lane to the class steps; the fold when Maya is there
    if (F('p5.out') && !F('p5')) {
      if (!ssAtSteps && !ssWalking) { ssToSteps(); return; }
      if (ssAtSteps && near(SPOT.steps.x, SPOT.steps.z, 3.6)) { const e = story.people.get('sanshar'); if (e) story.talkTo(e); return; }
    }
    // lamp-lighting: Ko Doe says where Nay Chi went
    if (F('lamp') && !F('ncTalk') && !F('p4.ktLamp') && near(W.x, W.z + 1, 6)) { F('p4.ktLamp', true); const e = story.people.get('kodoe'); if (e) story.talkTo(e); return; }
    // home in the evening: Ma Wint War's line about the board
    if (F('p4') && !F('wwEve')) { const e = story.people.get('wintwar'); if (e && Math.hypot(m.x - e.p.root.position.x, m.z - e.p.root.position.z) < 3.2) { story.talkTo(e); return; } }
    // the night page at the Writing Room door
    if (F('ch18Done') && !F('done') && nightArmed() && Math.hypot(m.x - ab.x, m.z - ab.z) < 1.8) night();
  }
  // the night page waits until she has moved since the page loaded (a reload, or a skipTo, parks the car at
  // the Writing Room: the night must not fire before the player can act)
  let armPos = null, armed = false;
  function nightArmed() {
    if (armed) return true;
    const c = story.foot.active ? { x: story.foot.pos.x, z: story.foot.pos.y } : { x: game.car.root.position.x, z: game.car.root.position.z };
    if (!armPos) { armPos = c; return false; }
    armed = Math.hypot(c.x - armPos.x, c.z - armPos.z) > 1.0;
    return armed;
  }

  // ---------------------------------------------------------------------------------------------
  // test hooks: window.__day11.skipTo(beat) sets the flags of every beat before it
  // ---------------------------------------------------------------------------------------------
  const BEATS = ['morning', 'arrived', 'ncMet', 'p1', 'p2', 'p3', 'p5', 'p6', 'p7', 'lamp', 'ncTalk', 'p4', 'ch18Done', 'night'];
  const BEAT_FLAGS = {
    morning: ['morning'], arrived: ['arrived'], ncMet: ['ncMet'],
    p1: ['p1.call', 'p1.in', 'p1'], p2: ['p2.intro', 'p2'], p3: ['p3.met', 'p3.out', 'p3'], p5: ['p5.out', 'p5'], p6: ['p6.met', 'p6.look.sheet', 'p6.look.book', 'p6', 'song'], p7: ['p7'],
    lamp: ['lamp'], ncTalk: ['ncTalk'], p4: ['signFixed', 'distance', 'p4'], ch18Done: ['ch18Done'],
  };
  const hooks = {
    beats: BEATS,
    row, home,
    flags: () => Object.fromEntries(Object.entries(save.flags).filter(([k]) => k.startsWith('d11.'))),
    state: () => ({ inRoom: story.inRoom, p4: { active: p4.active, stage: p4.stage }, pieces: pieceCount(), met: [...met] }),
    /** Set every flag before `beat` (so the next tap plays `beat`), then reload to rebuild the page. */
    skipTo(beat, { reload = true, lean = true } = {}) {
      const k = BEATS.indexOf(beat);
      if (k < 0) return BEATS;
      for (const b of BEATS.slice(0, k)) for (const f of BEAT_FLAGS[b] || []) F(f, true);
      // her talk, as play reaches it: a lean on her last stone (Maya answered for her once) sets d11.ncLean
      // before she decides herself; Day 12 reads it ({ lean: false } skips past a talk won without a lean)
      if (k > BEATS.indexOf('ncTalk') && lean) F('ncLean', true);
      if (k > BEATS.indexOf('p1')) for (const id of NOTE_ORDER.slice(0, Math.min(7, k - 2))) { const p = F('notes.pages') || []; if (!p.includes(id)) F('notes.pages', [...p, id]); }
      if (k > BEATS.indexOf('p1')) { story.flag('notes.pages', F('notes.pages')); if (!story.has('notes')) story.give('notes', 1, { quiet: true }); } // (as addNote does in play)
      if (k > BEATS.indexOf('ncTalk')) F('p4.stage', 'done');
      story.persist();
      if (reload) location.reload();
      return hooks.flags();
    },
    talk: TALK_D11_NAYCHI,
  };
  window.__day11 = hooks;

  return {
    talk,
    roomCast,
    roomOpts: (id) => (id === 'hearthtea' && F('lamp') && !F('ncTalk') ? { dressing: 'd11lamp' } : {}),
    enterRoom,
    leaveRoom,
    station,
    update,
    /** The page turns in place: this page's set, people, taps and hooks go away. */
    dispose() {
      alive = false;
      const i = (story.tapHooks || []).indexOf(tapHook);
      if (i >= 0) story.tapHooks.splice(i, 1);
      if (ow && lightDesk0) ow.lightDesk = lightDesk0;
      windowFigures(false);
      for (const k of [...extras.keys()]) dropExtra(k);
      for (const id of ['wintwar', 'naychi', 'kodoe', 'uchit', 'maungpan', 'khinmay', 'sanshar', 'nyein']) { const e = story.people.get(id); if (e) e.ctl = null; story.remove(id); }
      row.dispose();
      home.dispose();
      if (window.__day11 === hooks) delete window.__day11;
    },
    async start() {
      if (F('morning')) return;
      // the day opens at home, outdoors by the Writing Room; Ma Wint War comes over
      if (story.inRoom) await story.exit({ instant: true });
      const m = game.maya.root.position;
      if (Math.hypot(m.x - ab.x, m.z - ab.z) > 30 && story.openWorld?.jump) {
        try { story.openWorld.jump(ab.x + 0.8, ab.z + 2.2, 0); } catch (e) { console.error('day11 jump', e); }
      }
      // (toFoot is ignored while the game is busy at load: try again for a few seconds)
      for (let i = 0; i < 25 && !story.foot.active && alive; i++) { await story.foot.toFoot(); if (!story.foot.active) await wait(300); }
      story.refreshHud?.();
      const mp = game.maya.root.position;
      const ww = story.people.get('wintwar');
      ww.paused = true;
      await Promise.race([story.walkPerson('wintwar', mp.x + 1.15, mp.z + 0.05, 1.5), wait(9000)]);
      setTimeout(() => { ww.paused = false; }, 4000);
      await story.talkTo(ww);
    },
  };
}
