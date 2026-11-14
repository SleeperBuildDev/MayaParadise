// Day 12 (the Diary Garden in the rain) — chapters 19 ဒုက္ခ (Suffering) and 20 သည်းခံခြင်း (Patience).
// Script: day12-spec.md (INDEX 9 flags and 13.2 layouts win).
//
// Lessons. Ch 19 (p89–93): trouble comes uninvited, and to everyone; it hurts most where we cling ("mine");
// what is ours to steer is how we take it and the next hour; live by what is, as it is, then work so good
// things grow. Ch 20 (p94–98): catch the first rattle; one pass or fail is not for life; compassion for those
// who don't know yet, gladness for those who worked for it; patience with good sense: a wrong that would
// cheat the next buyer goes as checked facts through the proper door. Main quest: rain; the town handles it
// with Maya beside it, not in front.
//
// Beats (flags `d12.*`, all resumable):
//   home (room `about`)   the knock, the post, Nay Chi's note, the Folded Note lifts off, the soaked trunk ... d12.morning, d12.soaked
//   home (outdoors)       the flat bean bed: the pods ............................................. d12.bed
//   the clasp             the wet crowd: "what first?" (Maya beside, not in front) ................ d12.arrived, d12.crowd
//   ch 19 lane            U Hpo Htaw on his bench; he goes into his garden house by himself ........ d12.htMet, d12.htIn
//                         six looks (four on the lane, two inside) ................................ d12.look.*, d12.looked
//   ch 19 `hpohtawshed`   sort mine / not mine; his talk (two stones his); his diary line .......... d12.sorted, d12.htTalk, d12.diaryLine
//   ch 19 far bed         he walks out first; three rows (trace `row`); the gate scene ............. d12.replant, d12.gate, d12.ch19Done
//   ch 20 `dryinghall`    Daw Ohn's stall; the lid (simmer); four looks (two outdoors); her talk ... d12.ohnMet, d12.lid, d12.mlooked, d12.ohnTalk
//   ch 20 the scale       she weighs with the True weight herself ................................. d12.weighed
//   ch 20 `committeeroom` facts in, heat out; she hands it in herself ............................. d12.report, d12.handed, d12.ch20Done
//   optional              the kiln desk (if dark), the smoking kiln (rumour kilnout), the board at home ... d12.desk, d12.board
//   night                 the pods replanted; the night page (stamps 19, 20) ......................... d12.done → day 13
// No markers anywhere: people say where things are; the things are in the scene.
// Burmese lines (day12-lines.js, talks/day12.js) are drafts for Maya to proofread.
//
// Reads from Day 11: `d11.ncLean` (Nay Chi says one short line of her own first), rumour `rain` (inked today),
// `d11.windowOpen` / save.home.window (the window that blew open). Writes for Day 13: SLEPT12, d12.morning, d12.done.
//
// Test hooks: window.__day12 = { skipTo(beat), flags(), state(), beats, set, run: { ... }, night() }
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { sort } from './acts/sort.js';
import { simmer } from './acts/simmer.js';
import { ownwords } from './acts/ownwords.js';
import { trace } from './acts/trace2.js';
import { nightPage, showLetter, showSlip, liftOff } from './post.js';
import { companionById } from './companions.js';
import { castById } from './cast.js';
import { createPerson } from './people.js';
import { TALK_D12_HPOHTAW, TALK_D12_DAWOHN } from './talks/day12.js';
import { L } from './day12-lines.js';
import { SLEPT11 } from './day11-lines.js';
import { buildSet } from './day12-set.js';
import { DOORS } from './doors.js';
import { VoxelBuilder } from '../game/voxel.js';

export { SLEPT12 } from './day12-lines.js'; // tonight's hosts' lines (Day 13's morning reads them)

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const race = (p, ms) => Promise.race([p, wait(ms)]);
const MAYA = { my: 'မာရာ', en: 'Maya' };
const LANE_LOOKS = ['sheets', 'gourd', 'sticks', 'beans'];
const SHED_LOOKS = ['diary', 'tin'];
const LOOKS19 = [...LANE_LOOKS, ...SHED_LOOKS];
const MLOOKS = ['kids', 'shards', 'queue', 'hand'];
const CROWD = ['gourdaunty', 'buyerA', 'buyerB', 'buyerC'];
const MY_NUM = '၀၁၂၃၄၅၆၇၈၉';
// inside, a little nearer and lower than the shared room camera's default (story.doors.roomCam takes overrides)
const ROOM_CLOSE = { width: 2.4, tilt: 19 };

export async function create(story) {
  const { game, dialog: D, save } = story;
  const F = (k, v) => story.flag(`d12.${k}`, v);
  let alive = true;
  const v3 = new THREE.Vector3();

  // ---------------------------------------------------------------------------------------------
  // the set (Day 10's Garden in the rain, the kiln square, the home bed and board) and the weather
  // ---------------------------------------------------------------------------------------------
  const set = buildSet(story);
  const { P, h } = set;
  const bothDone = () => !!(F('ch19Done') && F('ch20Done'));
  function look() {
    // scripted look of the hour (whatever the real clock says): grey rain, morning light; evening once both are done
    game.day?.set?.(bothDone() ? 17.6 : F('morning') ? 10.5 : 8.2);
    if (!F('done')) story.weather(bothDone() ? 'drizzle' : F('ch20Done') ? 'drizzle' : 'rain');
    game.applyDayLook();
  }
  look();
  // the rooms' doors: his garden house opens when he goes in; the committee room when Daw Ohn opens it
  function syncDoors() {
    call(story.doors, 'setDoor', 'hpohtawshed', !!F('htIn'));
    call(story.doors, 'setDoor', 'committeeroom', !!F('weighed'));
    if (DOORS.hpohtawshed && !F('htIn')) DOORS.hpohtawshed.off = true;
    if (DOORS.committeeroom && !F('weighed')) DOORS.committeeroom.off = true;
    if (DOORS.hpohtawshed && F('htIn')) DOORS.hpohtawshed.off = false;
    if (DOORS.committeeroom && F('weighed')) DOORS.committeeroom.off = false;
    h.htHouse.setOpen(!!F('htIn'));
  }
  syncDoors();
  function syncProps() {
    if (F('replant')) { h.farBed.setState?.('sown'); h.dateStick.root.visible = true; }
    if (F('handed')) {
      h.scale.setWeights?.('true'); h.scale.setTilt?.(0);
      h.notice.setText?.([L.noticeTitle, 'ချိန်သီးဟောင်း · သိမ်းပြီ', 'ချိန်သီးအသစ် · ချိတ်ပြီး', 'ပြန်ချိန် · ကော်မတီအခန်း']);
    }
    if (F('replanted')) h.homeBed.setState?.('sown');
    if (F('board') !== undefined) h.board.setText?.([{ my: 'မာရာ့ကို မေးကြည့်', en: 'Ask Maya' }, { my: 'စာအသစ် ၉ စောင်', en: '9 new notes' }, { my: '"ကိုယ့်ဘာသာ ဖြေရှင်းပြီးပြီ" ၂', en: '"Sorted it myself" 2' }]);
  }
  syncProps();

  // ---------------------------------------------------------------------------------------------
  // people (cast ids) placed by the flags; walk-ons (no cast entry) drawn here
  // ---------------------------------------------------------------------------------------------
  const mine = new Set();
  const spawn = (id, at) => { const e = story.spawn(id, { x: at.x, z: at.z, heading: at.h ?? at.heading ?? 0 }); if (e) mine.add(id); return e; };
  const ohnAway = () => !!(F('ohnTalk') && !F('handed')); // out at the scale, then in the committee room
  function placePeople() {
    if (story.inRoom) return;
    // Ma Wint War: after the morning, at the Post Office (the evening board)
    if (F('morning') && !story.people.get('wintwar')) {
      spawn('wintwar', P.ww);
      story.setJob('wintwar', { area: { x: P.ww.x - 0.4, z: P.ww.z + 0.6, r: 1.6 }, spot: { x: P.ww.x, z: P.ww.z, h: P.ww.h }, mood: 'read', workChance: 0.5, workFor: [5, 9] });
    }
    // U Hpo Htaw: on his bench until he goes in; at the far bed once he has walked out
    const ht = story.people.get('hpohtaw');
    if (!F('htIn')) { if (!ht) { const e = spawn('hpohtaw', P.htSit); e?.p.setMood('down'); } }
    else if (F('htOut')) { if (!ht) { const e = spawn('hpohtaw', P.htPlant); e?.p.setMood('work'); } }
    else if (ht && !ht.walking) story.remove('hpohtaw');
    // after the gate scene: Nay Chi at the seedbed
    if (F('gate') && !story.people.get('naychi')) { const e = spawn('naychi', P.arrivals.naychi); e?.p.setMood('work'); }
    // Ko Phyo weighing bales under the paper store's roof
    if (!story.people.get('kophyo') && !gateRunning) {
      spawn('kophyo', P.kophyo);
      story.setJob('kophyo', { area: { x: P.kophyo.x, z: P.kophyo.z + 0.3, r: 1.0 }, spot: { x: P.kophyo.x, z: P.kophyo.z, h: P.kophyo.h }, mood: 'work', workChance: 0.7, workFor: [6, 12] });
    }
    // the trader at his scale (except while he is called into the committee room)
    if (!story.people.get('kyinyein')) spawn('kyinyein', P.trader);
    // Daw Ohn out at the scale (after her talk, before the committee)
    if (ohnAtScale && !F('weighed') && !story.people.get('dawohn')) spawn('dawohn', P.ohnScale);
    if (F('weighed') && story.people.get('dawohn') && !ohnWalking) story.remove('dawohn');
  }

  const extras = new Map(); // key -> { p, look, name, x, z, h, lines(), path?, speed? }
  let LOOKS = null, NAMES = null;
  import('./rooms/garden.js').then((m) => { LOOKS = m.WALKON_LOOKS || {}; NAMES = m.WALKON_NAMES || {}; if (alive) placeExtras(); }).catch(() => { LOOKS = {}; NAMES = {}; });
  function addExtra(key, look, name, at, lines) {
    if (extras.has(key) || !look) return extras.get(key);
    const p = createPerson(look);
    p.root.position.set(at.x, 0, at.z);
    p.root.rotation.y = at.h ?? 0;
    p.root.userData.isPerson = true;
    game.world.scene.add(p.root);
    const x = { p, look, name, x: at.x, z: at.z, h: at.h ?? 0, lines, path: null, speed: 1.3 };
    extras.set(key, x);
    return x;
  }
  function dropExtra(key) { const x = extras.get(key); if (!x) return; x.p.root.parent?.remove(x.p.root); x.p.dispose(); extras.delete(key); }
  function placeExtras() {
    if (!LOOKS) return;
    // the wet crowd under the clasp (first arrival only)
    if (!F('crowdDone')) CROWD.forEach((k, i) => addExtra(`crowd${i}`, LOOKS[k], k === 'gourdaunty' ? L.gaName : NAMES[k], P.crowd[i], () => (F('crowdDone') ? L.crowdBeside.slice(1) : L.crowd)));
    else for (let i = 0; i < CROWD.length; i++) if (!extras.get(`crowd${i}`)?.path) dropExtra(`crowd${i}`);
    // the gourd aunty at her flattened trellis (after the crowd beat)
    if (F('crowdDone') && !extras.has('aunty') && !gateRunning) {
      const a = addExtra('aunty', LOOKS.gourdaunty, L.gaName, F('gate') ? { x: P.gourd.x + 0.9, z: P.gourd.z + 0.55, h: -0.5 } : P.aunty, () => (F('ch19Done') ? L.gaAfter : rot('ga', L.ga)));
      if (a) a.mood = 'work';
    }
    // the girl in the scale queue with her thin rice bag
    if (!extras.has('girl')) addExtra('girl', LOOKS.weighgirl, L.girlName, P.girl, () => (F('handed') ? L.girlAfter : L.girlBefore));
  }
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
  /** A line from a walk-on, or a townsperson, by id (the gate scene's `who`). */
  async function sayWho(who, lines) {
    if (castById(who)) return say(who, lines, { face: 'smile' });
    return sayAs(NAMES?.[who] || (who === 'gourdaunty' ? L.gaName : MAYA), LOOKS?.[who], lines);
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
  async function stage(fn) {
    if (story.talking || game.busy || !alive) return false;
    story.talking = true;
    game.ui.cinema(true);
    try { await fn(); } catch (e) { console.error('day12', e); } finally { game.ui.cinema(false); game.rig.release(); story.talking = false; }
    return true;
  }
  /** Lines with someone inside a staged scene, framed by the shared two-shot (story.talkTo's camera: both of them
   * in view, from whichever side nothing stands in between; the cut-away keeps them clear). */
  async function twoShotWith(id, fn) {
    const e = story.people.get(id);
    if (!e || !story.foot?.active || !alive) return fn();
    const was = story.talking, prevOn = e.onTalk;
    story.talking = false;
    e.onTalk = async () => { await fn(); };
    try { await story.talkTo(e); } finally { e.onTalk = prevOn; story.talking = was; if (was) game.ui.cinema(true); }
  }
  /** Walk someone a few steps; if the walk cannot start (seated on a stool, inside its footprint), they are simply there. */
  async function stepTo(id, x, z, speed = 0.9, ms = 3500) {
    await race(story.walkPerson(id, x, z, speed), ms);
    const e = story.people.get(id);
    if (!e) return;
    const p = e.p.root.position;
    if (Math.hypot(p.x - x, p.z - z) > 0.3) { e.walking = null; p.set(x, p.y, z); if (e.ob) { e.ob.x = x; e.ob.z = z; } }
    if (e.home) { e.home.x = x; e.home.z = z; }
  }
  const mayaXZ = () => { const p = game.maya.root.position; return { x: p.x, z: p.z }; };
  // the close room camera from the first frame inside (doors.js applies its default in enterRoomScene; the day's
  // enterRoom only runs once the iris has opened): restored on dispose
  const enterRoomScene0 = game.enterRoomScene;
  const enterRoomScene12 = function (room) { enterRoomScene0.call(this, room); try { if (alive) story.doors?.roomCam?.(ROOM_CLOSE); } catch { /* no room */ } };
  game.enterRoomScene = enterRoomScene12;
  const near = (x, z, r) => { const m = mayaXZ(); return Math.hypot(m.x - x, m.z - z) < r; };
  const outdoors = () => !story.inRoom && game.mode === 'world';
  function walkMaya(x, z, ms = 7000) {
    return new Promise((res) => { let done = false; const fin = () => { if (!done) { done = true; res(); } }; story.foot.walkTo(x, z, fin); setTimeout(fin, ms); });
  }
  function faceMaya(x, z) {
    const m = game.maya.root.position;
    const hd = Math.atan2(x - m.x, z - m.z);
    if (story.foot.walker) story.foot.walker.heading = hd;
    game.maya.root.rotation.set(0, hd, 0);
  }
  const rotIdx = new Map();
  function rot(key, groups) { const i = rotIdx.get(key) || 0; rotIdx.set(key, i + 1); return groups[i % groups.length]; }
  function proof(id) {
    save.proofs = save.proofs || {};
    save.proofs[id] = L.proof[id];
    if (!story.has(`proof:${id}`)) story.give(`proof:${id}`);
    F(`rumour.${id}`, true);
    story.flag(`rumour.${id}`, 'checked');
  }
  function pencil(id) { if (!story.flag(`rumour.${id}`)) story.flag(`rumour.${id}`, 'pencil'); }
  const front = (d, k = 0.9) => ({ x: d.x + Math.sin(d.facing || 0) * k, z: d.z + Math.cos(d.facing || 0) * k, heading: d.facing || 0 });

  // ---------------------------------------------------------------------------------------------
  // the umbrella in Maya's hand (outdoors, in the rain): it keeps her dry and nothing else
  // ---------------------------------------------------------------------------------------------
  const umb = h.umbrella.root;
  function holdUmbrella() {
    const want = !!F('morning') && outdoors() && story.foot.active && !!save.weather && story.has('umbrella');
    if (want && umb.parent !== game.maya.root) {
      game.maya.root.add(umb);
      const top = new THREE.Vector3();
      try { game.maya.getHeadTop(top); game.maya.root.worldToLocal(top); } catch { top.set(0, 1.3, 0); }
      const s = 1.25 / (game.maya.root.scale.x || 1);
      umb.scale.setScalar(s);
      umb.position.set(0.24, Math.max(0.2, top.y + 0.14 - 0.8 * s), 0.05);
      umb.rotation.set(0, 0, -0.12);
    }
    umb.visible = want;
  }

  // ---------------------------------------------------------------------------------------------
  // outdoor taps on things (no markers: the things themselves are in the scene)
  // ---------------------------------------------------------------------------------------------
  const taps = [];
  const addTap = (t) => taps.push(t);
  const stick0 = () => h.sticks[0].root.position;
  addTap({ id: 'bed', at: () => ({ x: P.homeBed.x, y: 0.3, z: P.homeBed.z }), stand: () => ({ x: P.homeBed.x + 0.2, z: P.homeBed.z + 1.0 }), when: () => !!F('morning'), fn: () => stage(bed) });
  addTap({ id: 'board', at: () => ({ x: P.homeBoard.x, y: P.homeBoard.y ?? 1.3, z: P.homeBoard.z }), stand: () => P.homeBoard.stand || ({ x: P.homeBoard.x, z: P.homeBoard.z + 1.1 }), fn: () => stage(boardTap) });
  addTap({ id: 'sheets', at: () => ({ x: P.sheets[0].x, y: 0.1, z: P.sheets[0].z }), stand: () => ({ x: P.sheets[0].x + 0.4, z: P.sheets[0].z + 1.0 }), fn: () => stage(() => look19('sheets')) });
  addTap({ id: 'sheets2', at: () => ({ x: P.sheets[1].x, y: 0.1, z: P.sheets[1].z }), stand: () => ({ x: P.sheets[1].x + 0.4, z: P.sheets[1].z + 1.0 }), fn: () => stage(() => look19('sheets')) });
  addTap({ id: 'gourd', at: () => ({ x: P.gourd.x, y: 0.5, z: P.gourd.z }), stand: () => ({ x: P.gourd.x, z: P.fenceZ + 0.9 }), fn: () => stage(() => look19('gourd')) });
  addTap({ id: 'sticks', at: () => ({ x: stick0().x, y: 0.45, z: stick0().z }), stand: () => ({ x: stick0().x + 0.6, z: P.fenceZ + 0.9 }), fn: () => stage(() => look19('sticks')) });
  addTap({ id: 'sticksR', at: () => ({ x: h.sticks[1].root.position.x, y: 0.45, z: h.sticks[1].root.position.z }), stand: () => ({ x: h.sticks[1].root.position.x, z: P.fenceZ + 0.9 }), fn: () => stage(() => look19('sticks')) });
  addTap({ id: 'beans', at: () => ({ x: P.beans.x, y: 0.25, z: P.beans.z }), stand: () => ({ x: P.beans.x, z: P.beans.z + 1.0 }), fn: () => stage(() => look19('beans')) });
  addTap({ id: 'kiln', at: () => ({ x: P.kiln.x, y: 4.2, z: P.kiln.z }), stand: () => ({ x: P.kiln.x, z: Math.max(P.kiln.z + 4.0, P.squareFront + 1.3) }), fn: () => stage(kilnTap) });
  addTap({ id: 'scale', at: () => ({ x: P.scale.x, y: 1.2, z: P.scale.z }), stand: () => ({ x: P.scale.x - 0.6, z: P.scale.z + 1.2 }), fn: () => stage(() => say('maya', F('handed') ? L.scaleAfter : L.scaleLook, { face: 'think' })) });
  addTap({ id: 'stall', at: () => ({ x: P.stalls[P.ohnStall].x, y: 1.0, z: P.stalls[P.ohnStall].z }), stand: () => ({ x: P.stalls[P.ohnStall].x, z: P.stalls[P.ohnStall].z + 1.1 }), fn: () => stage(() => say('maya', L.stallSlate, { face: 'think' })) });
  addTap({ id: 'hallSlate', at: () => ({ x: P.hallSlate.x, y: 1.25, z: P.hallSlate.z }), stand: () => ({ x: P.hallSlate.x, z: P.hallSlate.z + 1.0 }), fn: () => stage(() => say('maya', L.hallSlate, { face: 'think' })) });
  addTap({ id: 'noticeOut', at: () => ({ x: P.board.x, y: 1.2, z: P.board.z }), stand: () => ({ x: P.board.x, z: P.board.z + 1.0 }), fn: () => stage(async () => { if (F('handed')) await showSlip(game, L.notice, { title: L.noticeTitle }); else await say('maya', L.boardOut, { face: 'think' }); }) });
  addTap({ id: 'farBed', at: () => ({ x: P.farBed.x, y: 0.3, z: P.farBed.z }), stand: () => P.mayaFar, when: () => !!F('htOut') && !F('replant'), fn: () => stage(() => say('maya', L.farBedWait, { face: 'think' })) });
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
    // a townsperson standing in front of a thing wins the tap (story.js taps people)
    for (const e of story.people.values()) for (const hgt of [0.4, e.p.height * 0.75]) {
      const q = game.rig.project(tapV.set(e.p.root.position.x, hgt, e.p.root.position.z), game.viewW, game.viewH);
      if (q && Math.hypot(q.x - sx, q.y - sy) < bd) return false;
    }
    if (best.extra) {
      const x = best.x, px = x.p.root.position;
      story.foot.walkTo(px.x + (mayaXZ().x < px.x ? -1.0 : 1.0), px.z + 0.15, (ok) => { if (ok !== false) extraTalk(best.extra, x); });
      return true;
    }
    const st = best.stand();
    story.foot.walkTo(st.x, st.z, (ok) => { if (ok === false) return; const a = best.at(); faceMaya(a.x, a.z); best.fn(); });
    return true;
  };
  story.tapHooks = story.tapHooks || [];
  story.tapHooks.push(tapHook);
  function extraTalk(key, x) {
    stage(async () => {
      const px = x.p.root.position;
      faceMaya(px.x, px.z);
      x.p.lookAt(v3.set(game.maya.root.position.x, 1, game.maya.root.position.z));
      if (key.startsWith('crowd') && !F('crowdDone')) return crowdScene();
      if (key === 'girl' && F('ohnMet') && !F('mlook.queue')) return mlook('queue');
      const lines = x.lines();
      if (key === 'aunty' && lines === L.ga[1]) pencil('again');
      await sayAs(x.name, x.look, lines);
    });
  }

  // ---------------------------------------------------------------------------------------------
  // the Writing Room after the night's rain: soaked loose sheets on the floor by the trunk, wet footprints from the
  // door; Ma Wint War dripping onto the boards (a puddle grows under her). Added to the room's scene while inside.
  // ---------------------------------------------------------------------------------------------
  let wetG = null;
  function wetRoom(on) {
    if (!on) { if (wetG) { wetG.removeFromParent(); wetG.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); }); wetG = null; } return; }
    if (wetG || F('done') || story.inRoom !== 'about' || !game.scene) return;
    wetG = new THREE.Group();
    wetG.name = 'd12WetRoom';
    const v = new VoxelBuilder();
    // the sheets that blew off the desk and out of the open trunk: flat, curled at a corner, the ink run blue-grey
    const sheets = [[-2.45, -2.05, 0.4], [-1.95, -1.7, -0.5], [-1.55, -2.3, 1.1], [-2.3, -1.35, -1.2], [-1.15, -1.75, 0.2], [-2.75, -1.6, 0.9], [-0.85, -2.25, -0.8]];
    sheets.forEach(([x, z, r], i) => {
      const c = Math.cos(r), sn = Math.sin(r);
      const at = (lx, lz) => [x + lx * c + lz * sn, z - lx * sn + lz * c];
      v.box(x, 0.008 + i * 0.002, z, 0.3, 0.008, 0.21, i % 2 ? '#D3CBB6' : '#C7BFA9', r);
      for (let k = 0; k < 3; k++) { const [bx, bz] = at(-0.08 + k * 0.07, -0.04 + (k % 2) * 0.06); v.box(bx, 0.014 + i * 0.002, bz, 0.09, 0.004, 0.035, '#8C90A8', r + 0.3 * k); }
      const [cx, cz] = at(0.13, 0.08); v.box(cx, 0.03 + i * 0.002, cz, 0.07, 0.03, 0.07, i % 2 ? '#DCD5C2' : '#D0C8B2', r); // the curled corner
    });
    // a soggy envelope and a pencil that rolled into the water under the window
    v.box(-2.05, 0.012, -2.75, 0.24, 0.012, 0.15, '#BBA98A', 0.3);
    v.box(-1.75, 0.02, -2.6, 0.16, 0.016, 0.016, '#C9A24A', 1.1);
    const paper = v.mesh({ outline: false });
    wetG.add(paper);
    // wet patches: footprints in from the door to where she stands, a dark tongue of water from the window
    const wet = new THREE.MeshBasicMaterial({ color: '#2E2116', transparent: true, opacity: 0.3, depthWrite: false });
    const geos = [];
    for (let i = 0; i < 6; i++) {
      const g = new THREE.CircleGeometry(0.075, 10); g.scale(1, 1.6, 1); g.rotateX(-Math.PI / 2);
      g.translate(0.48 + (i % 2 ? 0.12 : -0.02), 0.004, 3.75 - i * 0.24);
      geos.push(g);
    }
    for (const [x, z, rx, rz] of [[-2.1, -2.35, 0.55, 0.35], [-1.6, -1.95, 0.35, 0.25], [-2.55, -1.85, 0.3, 0.22]]) {
      const g = new THREE.CircleGeometry(1, 16); g.scale(rx, rz, 1); g.rotateX(-Math.PI / 2); g.translate(x, 0.003, z); geos.push(g);
    }
    const merged = THREE.mergeGeometries ? THREE.mergeGeometries(geos, false) : null;
    for (const g of geos) if (g !== merged) g.dispose();
    if (merged) { const m = new THREE.Mesh(merged, wet); m.raycast = () => {}; m.renderOrder = 1; wetG.add(m); }
    wetG.traverse((o) => { o.raycast = () => {}; });
    game.scene.add(wetG);
  }
  let drips = null; // { e, g, drops: [{ m, x, z, y, s }], pool, t }
  function dripsOn(e) {
    if (drips) { drips.g.removeFromParent(); drips.g.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); }); drips = null; }
    if (!e?.p?.root) return;
    const g = new THREE.Group();
    g.name = 'd12Drips';
    const mat = new THREE.MeshBasicMaterial({ color: '#C6DCE6', transparent: true, opacity: 0.85 });
    const geo = new THREE.BoxGeometry(0.025, 0.06, 0.025);
    const drops = [];
    for (let i = 0; i < 9; i++) {
      const a = i * 2.39, r = 0.18 + (i % 3) * 0.05;
      const m = new THREE.Mesh(geo, i ? mat : mat);
      const d = { m, x: Math.sin(a) * r, z: Math.cos(a) * r, y: 0.2 + ((i * 0.37) % 0.7), s: 1.8 + (i % 4) * 0.35 };
      m.position.set(d.x, d.y, d.z);
      g.add(m); drops.push(d);
    }
    const pool = new THREE.Mesh(new THREE.CircleGeometry(0.42, 18).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#8EA2B2', transparent: true, opacity: 0.45, depthWrite: false }));
    pool.position.y = 0.006; pool.scale.setScalar(0.35); pool.raycast = () => {};
    g.add(pool);
    g.traverse((o) => { o.raycast = () => {}; });
    e.p.root.add(g);
    drips = { e, g, drops, pool, t: 0 };
  }
  function dripsUpdate(dt) {
    if (!drips) return;
    if (!drips.g.parent?.parent) { dripsOn(null); return; }
    drips.t += dt;
    for (const d of drips.drops) {
      d.y -= d.s * dt;
      if (d.y < 0.02) d.y = 0.75 + Math.random() * 0.2; // off her longyi's hem and sleeves, again
      d.m.position.y = d.y;
    }
    drips.pool.scale.setScalar(Math.min(1, 0.35 + drips.t * 0.03));
  }

  // ---------------------------------------------------------------------------------------------
  // 4 · morning inside the Writing Room
  // ---------------------------------------------------------------------------------------------
  let morningBusy = false;
  async function morning() {
    if (morningBusy || F('morning')) return;
    morningBusy = true;
    try {
      // the night's loss is already done: loose paper in the trunk and bag is soaked (shown at the trunk)
      if (F('soakedN') === undefined) F('soakedN', story.soak());
      await say('maya', L.knock, { face: 'surprised', auto: true });
      // she steps in off the mat, dripping (a puddle grows under her); Maya beside her, both in the two-shot
      const ww0 = story.people.get('wintwar');
      dripsOn(ww0);
      if (ww0 && story.inRoom === 'about') {
        race(story.walkPerson('wintwar', 0.6, 2.45, 0.8), 2600);
        await walkMaya(-0.55, 2.4, 2600);
        faceMaya(0.6, 2.45);
      }
      await twoShotWith('wintwar', morningTalk);
      F('morning', true);
      look();
      // she goes back out into the rain (to the Post Office)
      const ww = story.people.get('wintwar');
      if (ww && story.inRoom === 'about') {
        const dz = story.room?.door?.z ?? 3.4;
        race(story.walkPerson('wintwar', 0, dz - 0.2, 1.4), 6000).then(() => { dripsOn(null); if (story.inRoom === 'about') story.remove('wintwar'); });
      } else dripsOn(null);
    } finally { morningBusy = false; }
  }
  async function morningTalk() {
    {
      await say('maya', L.mayaIn, { face: 'worried' });
      await say('wintwar', L.ww1, { face: 'smile' });
      const slept = (save.notebook?.sleptAt || []).filter((s) => s.day === 11).pop();
      await showSlip(game, (slept && SLEPT11?.[slept.who]) || L.sleptOther, { kind: 'notebook' });
      await showLetter(game, L.ncNote, { from: 'naychi' });
      await say('maya', L.ncNoteMaya, { face: 'think' });
      // the ch 18 companion, the Folded Note, lifts off the dried page
      const c = companionById('note');
      if (c && !story.companions.has('note')) { await liftOff(game, c); story.companions.add('note'); }
      await say('maya', L.comp, { face: 'happy' });
      await say('wintwar', L.ww2, { face: 'think' });
      pencil('onlyme'); F('rumour.onlyme', F('rumour.onlyme') || 'heard');
      // Day 11's rumour `rain` (heard, pencil): today it is seen
      const rain = story.flag('rumour.rain');
      if (rain && rain !== 'checked') { await say('maya', L.rainSeen, { face: 'think' }); story.flag('rumour.rain', 'checked'); F('rumour.rain', true); }
      await say('wintwar', L.wwLater, { face: 'smile' });
      await say('wintwar', L.wwBye, { face: 'smile' });
    }
  }
  async function trunk() {
    if (F('soaked')) { await say('maya', L.deskAgain, { face: 'think' }); return; }
    if (F('soakedN') === undefined) F('soakedN', story.soak());
    const n = F('soakedN') || 0;
    if (n > 0) {
      await say('maya', L.desk, { face: 'sad' });
      if ((save.pot || []).length) await say('maya', [L.deskPot], { face: 'think' });
      if ((save.paint || []).some((s) => s.state === 'washed')) await say('maya', [L.deskMap], { face: 'sad' });
      await say('maya', [L.deskGold], { face: 'think' });
    } else await say('maya', L.deskNone, { face: 'smile' });
    F('soaked', true);
  }
  async function bed() {
    if (F('bed')) { await say('maya', F('replanted') ? [L.replant[1]] : L.bedAgain, { face: 'think' }); return; }
    await say('maya', L.bed, { face: 'sad' });
    if (!story.has('pods')) story.give('pods');
    F('bed', true);
  }

  // ---------------------------------------------------------------------------------------------
  // 8.1 · the wet crowd at the clasp
  // ---------------------------------------------------------------------------------------------
  async function crowdScene() {
    if (F('crowdDone')) return;
    const c0 = extras.get('crowd0');
    if (c0) await sayAs(L.crowdName, c0.look, L.crowd);
    else await say('maya', L.crowd, { face: 'surprised' });
    const i = await D.choose(L.crowdChoices);
    F('crowd', i);
    if (i === 0) { await sayAs(L.crowdName, extras.get('crowd1')?.look, L.crowdTell); await say('maya', L.crowdTellMaya, { face: 'worried' }); }
    else if (i === 1) { await sayAs(L.crowdName, extras.get('crowd2')?.look, L.crowdCold); await say('maya', L.crowdColdMaya, { face: 'think' }); }
    else { call(game.maya, 'emote', 'bow'); await say('maya', [L.crowdBeside[0]], { face: 'think' }); await say('maya', [L.crowdBeside[1]], { face: 'smile' }); }
    crowdDisperse(i);
  }
  function crowdDisperse(i) {
    if (F('crowdDone')) return;
    F('crowdDone', true);
    pencil('onlyme');
    // they go off by themselves: to the seedbeds (down the lane), the store, home
    const ways = i === 0
      ? [[{ x: 258, z: 101 }, { x: 246, z: 100 }], [{ x: 258, z: 101 }, { x: 250, z: 100 }], [{ x: 258, z: 101 }, { x: 244, z: 100.2 }], [{ x: 258, z: 101 }, { x: 252, z: 100 }]]
      : [[{ x: 258, z: 101 }, { x: P.aunty.x, z: 99.2 }], [{ x: 258, z: 101 }, { x: 206, z: 99.6 }], [{ x: 258, z: 101 }, { x: 249, z: 100.4 }], [{ x: 260, z: 140 }]];
    for (let k = 0; k < CROWD.length; k++) {
      const x = extras.get(`crowd${k}`);
      if (!x) continue;
      x.path = ways[k].slice(); x.speed = 1.6 + k * 0.1;
      x.onArrive = () => { dropExtra(`crowd${k}`); if (k === 0) placeExtras(); };
    }
    placeExtras();
  }

  // ---------------------------------------------------------------------------------------------
  // ch 19 · U Hpo Htaw
  // ---------------------------------------------------------------------------------------------
  let htGoAt = 0, htGoing = false;
  async function htHook() {
    // over the low fence from the lane, from the west (Maya's umbrella off to the side): him on his bench, the pickets below his face
    if (outdoors()) game.rig.shot(new THREE.Vector3(P.htSit.x - 2.6, 2.8, P.htSit.z + 4.6), new THREE.Vector3(P.htSit.x + 0.3, 0.75, P.htSit.z + 0.8), 0.7);
    await say('hpohtaw', L.ht1, { face: 'sad', mood: 'down' });
    await say('maya', L.htMaya, { face: 'think' });
    F('htMet', true);
    htGoAt = performance.now() + 20000;
  }
  /** He gets up by himself and goes into his garden house, leaving the door open and the lamp lit. */
  async function htGoIn() {
    if (htGoing || F('htIn')) return;
    htGoing = true;
    try {
      const e = story.people.get('hpohtaw');
      if (e) {
        e.p.setMood(null);
        story.bark('hpohtaw', L.htIn[0], 3400);
        await race(story.walkPerson('hpohtaw', P.gate.x, P.htDoor.z + 0.8, 1.0), 9000);
        h.htHouse.setOpen(true);
        call(game.audio, 'play', 'door');
        await race(story.walkPerson('hpohtaw', P.htDoor.x, P.htDoor.z + 0.1, 1.0), 4000);
      }
      if (!alive) return;
      story.remove('hpohtaw');
      F('htIn', true);
      syncDoors();
    } finally { htGoing = false; }
  }
  const lookCount = () => LOOKS19.filter((k) => F(`look.${k}`)).length;
  async function look19(id) {
    const ln = L.looks[id];
    if (F(`look.${id}`)) { await say('maya', [ln.gold], { face: 'think' }); return; }
    await say('maya', [ln.pencil], { face: 'think', auto: true });
    await say('maya', [L.lookAgain], { face: 'think', auto: true });
    call(game.audio, 'play', 'chalk');
    await say('maya', [ln.gold], { face: id === 'beans' ? 'sad' : 'surprised' });
    F(`look.${id}`, true);
    if (id === 'gourd') proof('onlyme');
    if (id === 'diary') proof('again');
    if (F('htMet') && !F('htIn') && !htGoing) htGoAt = Math.min(htGoAt || Infinity, performance.now() + 1500);
    if (lookCount() === LOOKS19.length && !F('looked')) {
      await say('maya', L.lookedAll, { face: 'think' });
      if (story.people.get('hpohtaw')) await say('hpohtaw', L.lookedHt, { face: 'think' });
      F('looked', true);
    }
  }
  async function sortScene() {
    if (F('sorted')) return;
    await say('hpohtaw', L.sortIntro, { face: 'think' });
    const r = await sort({
      title: L.sort19.title, hint: L.sort19.hint, who: 'hpohtaw',
      baskets: L.sort19.baskets, cards: L.sort19.cards,
      react: { wrongMine: { ...L.sort19.wrongMine, who: 'hpohtaw' }, wrongNot: { ...L.sort19.wrongNot, who: 'hpohtaw' } },
      wrong: L.sort19.wrongMine,
    });
    if (r?.cancelled) return;
    await say('hpohtaw', L.sortDone, { face: 'think' });
    F('sorted', true);
  }
  async function htTalkScene() {
    const room = story.room;
    // the talk stands in front of the potting table (seated behind it, the table and the lamp hid him from the
    // two-shot): he gets up and comes round to the front; Maya beside him
    const st = room?.spots?.hpohtawStand;
    if (st && story.people.get('hpohtaw')) {
      await stepTo('hpohtaw', st.x, st.z);
      await walkMaya(st.x + 1.15, st.z + 0.05, 4000);
      faceMaya(st.x, st.z);
    } else {
      const sp = room?.spots?.maya;
      if (sp) { await walkMaya(sp.x, sp.z, 4000); faceMaya(0.2, -2.3); }
    }
    room?.setMug?.(true);
    await say('maya', L.mug, { face: 'smile', auto: true });
    const r = await story.talk.run(TALK_D12_HPOHTAW);
    if (r?.won) { F('htTalk', true); return true; }
    await say('hpohtaw', L.htNotYet, { face: 'think' });
    return false;
  }
  async function diaryScene() {
    await say('hpohtaw', L.owIntro, { face: 'think' });
    const frags = L.ow19.fragments.map(({ my, en, good }) => ({ my, en, good: !!good }));
    const r = await ownwords({ title: L.ow19.title, hint: L.ow19.hint, prompt: L.ow19.prompt, fragments: frags, need: 3 });
    if (r?.cancelled) return false;
    // the parroted tiles hopped back: he says why, each once
    const said = new Set();
    for (const i of r?.picks || []) {
      const b = L.ow19.fragments[i]?.bad;
      if (b === undefined || said.has(b)) continue;
      said.add(b);
      await say('hpohtaw', [L.ow19.badLines[b]], { face: 'think' });
    }
    await say('maya', L.owMaya, { face: 'think' });
    F('diaryLine', true);
    return true;
  }
  /** He takes the trowel off its nail and the tin off the table and walks out first. */
  async function htWalksOut() {
    const room = story.room;
    await say('maya', L.htGoes, { face: 'think', auto: true });
    const tw = room?.spots?.hpohtawTrowel, dr = room?.spots?.hpohtawDoor || room?.spots?.door;
    if (tw) await race(story.walkPerson('hpohtaw', tw.x, tw.z, 1.1), 4000);
    room?.setTrowel?.(false);
    call(game.audio, 'play', 'click');
    if (dr) await race(story.walkPerson('hpohtaw', dr.x, dr.z, 1.1), 4000);
    story.remove('hpohtaw');
    F('htOut', true);
  }
  async function shedFlow() {
    // what happens when Maya talks to him inside (or the looks are all done when she comes in)
    if (!F('looked')) {
      await say('hpohtaw', L.htInside, { face: 'sad' });
      await say('maya', L.sortWait, { face: 'think' });
      return;
    }
    if (!F('sorted')) { await sortScene(); if (!F('sorted')) return; }
    if (!F('htTalk')) { if (!(await htTalkScene())) return; }
    if (!F('diaryLine')) { if (!(await diaryScene())) return; }
    if (!F('htOut')) await htWalksOut();
  }
  // he walks from his door to the far bed and kneels there (outdoors)
  let htToBed = false;
  async function htOutside() {
    if (htToBed || !F('htOut') || F('replant')) return;
    htToBed = true;
    try {
      let e = story.people.get('hpohtaw');
      if (!e) e = spawn('hpohtaw', { x: P.htDoor.x, z: P.htDoor.z + 0.4, h: 0 });
      await race(story.walkPerson('hpohtaw', P.htPlant.x - 1.2, P.htPlant.z + 0.6, 1.0), 6000);
      await race(story.walkPerson('hpohtaw', P.htPlant.x, P.htPlant.z, 1.0), 4000);
      e = story.people.get('hpohtaw');
      if (e) { e.p.root.rotation.y = P.htPlant.h; e.home.h = P.htPlant.h; e.p.setMood('work'); }
      htAtBed = true;
    } finally { htToBed = false; }
  }
  let htAtBed = !!F('htOut');
  async function replantScene() {
    if (F('replant')) return;
    for (let round = 1; round <= 3; round++) {
      for (let k = 0; k < 4; k++) {
        // one bed of three furrows per round: the act's dots count the furrows; the round is in the title (two
        // counters side by side read as one count)
        const title = { my: `${L.trace.title.my} · ${MY_NUM[round]} / ၃`, en: `${L.trace.title.en} · ${round} / 3` };
        const r = await trace({ title, hint: L.trace.hint, path: 'row', wobble: [12, 9, 6][round - 1], tolerance: [24, 20, 16][round - 1], round, rounds: 1 });
        if (r?.cancelled) return;
        if (r?.ok) break;
        await say('hpohtaw', L.crooked, { face: 'think', auto: true });
      }
      call(game.fx, 'burst', 'dust', v3.set(P.farBed.x - 0.6 + round * 0.4, 0.3, P.farBed.z), { count: 6 });
    }
    h.farBed.setState?.('sown');
    h.dateStick.root.visible = true;
    F('replant', true);
    await gateScene();
  }
  let gateRunning = false;
  /** People come through the open gate by themselves; he neither waves them in nor sends them out. */
  async function gateScene() {
    if (F('gate')) return;
    gateRunning = true;
    try {
      const A = P.arrivals;
      // Nay Chi with a hand hoe (from the lane)
      const nc = spawn('naychi', { x: P.laneOut.x - 2.5, z: P.laneOut.z, h: 0 });
      await race(story.walkPerson('naychi', P.gate.x, P.gate.z + 0.4, 1.4), 6000);
      await race(story.walkPerson('naychi', A.naychi.x, A.naychi.z, 1.3), 6000);
      if (nc) nc.p.root.rotation.y = A.naychi.h;
      if (story.flag('d11.ncLean')) await say('naychi', L.ncLeanOwn, { face: 'think' });
      await sayWho(L.gate[0].who, [L.gate[0]]);
      await sayWho(L.gate[1].who, [L.gate[1]]);
      nc?.p.setMood('work');
      // the gourd aunty, from her own flattened trellis
      let a = extras.get('aunty');
      if (!a && LOOKS) a = addExtra('aunty', LOOKS.gourdaunty, L.gaName, P.aunty, () => L.gaAfter);
      if (a) { a.path = [{ x: P.aunty.x + 1.2, z: 99.2 }, { x: P.gate.x, z: P.gate.z + 0.6 }, { x: A.gourdaunty.x, z: A.gourdaunty.z }]; a.speed = 1.2; a.onArrive = () => { a.p.root.rotation.y = A.gourdaunty.h; }; }
      await wait(4200);
      await sayWho(L.gate[2].who, [L.gate[2]]);
      // Ko Phyo with a sack of dry straw (up the lane from the store)
      story.remove('kophyo');
      spawn('kophyo', { x: P.laneOut.x - 4, z: P.laneOut.z + 0.3, h: Math.PI / 2 });
      await race(story.walkPerson('kophyo', P.gate.x - 0.4, P.gate.z + 0.5, 1.5), 6000);
      await race(story.walkPerson('kophyo', A.kophyo.x, A.kophyo.z, 1.3), 4000);
      await sayWho(L.gate[3].who, [L.gate[3]]);
      await say('naychi', L.naychiMaya, { face: 'happy' });
      await say('maya', L.mayaNaychi, { face: 'smile' });
      const e = story.people.get('hpohtaw');
      e?.p.setMood(null);
      await say('hpohtaw', L.htEnd, { face: 'think' });
      await say('maya', L.htDate, { face: 'smile', auto: true });
      F('gate', true);
      F('ch19Done', true);
      e?.p.setMood('work');
      // Ko Phyo goes back to his bales; the aunty to her trellis (offstage)
      story.walkPerson('kophyo', P.laneOut.x - 6, P.laneOut.z + 0.2, 1.5).then(() => { if (!alive) return; story.remove('kophyo'); gateRunning = false; placePeople(); });
      if (a) { a.path = [{ x: P.gate.x, z: P.gate.z + 0.6 }, { x: P.gourd.x + 0.9, z: P.gourd.z + 1.2 }]; a.onArrive = () => { a.p.root.rotation.y = -0.5; }; }
      if (bothDone()) { look(); await say('maya', L.goHome, { face: 'smile' }); }
    } finally { if (F('gate')) setTimeout(() => { gateRunning = false; }, 9000); else gateRunning = false; }
  }

  // ---------------------------------------------------------------------------------------------
  // ch 20 · Daw Ohn
  // ---------------------------------------------------------------------------------------------
  async function hallHook() {
    if (F('ohnMet')) return;
    const room = story.room;
    const sp = room?.spots?.mayaStall;
    if (sp) { await walkMaya(sp.x, sp.z, 4000); faceMaya(-2.6, -0.2); }
    await say('dawohn', L.oh1, { face: 'hot' });
    await say('micho', L.mcHere, { face: 'worried' });
    F('ohnMet', true);
    await lidScene();
  }
  async function lidScene() {
    if (F('lid')) return;
    const room = story.room;
    await say('maya', L.kidsCome, { face: 'surprised', auto: true });
    await sayAs(L.kidsName, LOOKS?.kidA, L.kidsTease);
    const sp = room?.spots?.mayaStove;
    if (sp) { await walkMaya(sp.x, sp.z, 3000); faceMaya(-3.25, 0.1); }
    const r = await simmer({ title: L.simmer.title, hint: L.simmer.hint, rounds: 3, gusts: ['tap', 'laugh', 'word'], window: [900, 700, 500], early: L.simmer.early, late: L.simmer.late, who: 'dawohn' });
    if (r?.cancelled) return;
    room?.setBoil?.(0.15);
    await say('dawohn', L.lidDone, { face: 'think' });
    F('lid', true);
  }
  const mlookCount = () => MLOOKS.filter((k) => F(`mlook.${k}`)).length;
  async function mlook(id) {
    const ln = L.mlooks[id];
    if (F(`mlook.${id}`)) { await say('maya', [ln.gold], { face: 'think' }); return; }
    await say('maya', [ln.pencil], { face: 'think', auto: true });
    await say('maya', [L.lookAgain], { face: 'think', auto: true });
    call(game.audio, 'play', 'chalk');
    await say('maya', [ln.gold], { face: 'surprised' });
    F(`mlook.${id}`, true);
    if (mlookCount() === MLOOKS.length && !F('mlooked')) {
      await say('maya', L.mlookedAll, { face: 'think' });
      F('mlooked', true);
    }
  }
  async function ohnTalkScene() {
    const room = story.room;
    // in the aisle by her mat (on her stool by the stove the broom, the crates and the stove stood between the
    // camera and her): she gets up; Maya beside her
    const at = { x: -1.25, z: 0.55 };
    if (room?.spots?.dawohn && story.people.get('dawohn')) {
      await stepTo('dawohn', at.x, at.z);
      await walkMaya(at.x + 1.15, at.z + 0.05, 4000);
      faceMaya(at.x, at.z);
    } else {
      const sp = room?.spots?.maya;
      if (sp) { await walkMaya(sp.x, sp.z, 4000); faceMaya(-2.6, -0.2); }
    }
    const r = await story.talk.run(TALK_D12_DAWOHN);
    if (!r?.won) { await say('dawohn', L.ohNotYet, { face: 'think' }); return false; }
    F('ohnTalk', true);
    // she goes over to the two children herself and shows them, quietly, why a lid jumps
    const k1 = room?.spots?.kid1;
    if (k1) await race(story.walkPerson('dawohn', k1.x - 0.7, k1.z - 0.3, 1.1), 5000);
    await say('dawohn', L.ohKids, { face: 'smile' });
    await sayAs(L.kidsName, LOOKS?.kidB, L.kidsAfter);
    await say('maya', L.ohKidsMaya, { face: 'smile' });
    return true;
  }
  /** "You have a true weight, I heard." Maya lends it and stands back; she walks out to the scale herself. */
  async function lendWeight() {
    await say('dawohn', L.ohWeight, { face: 'think' });
    for (;;) {
      const i = await D.choose(L.wChoices);
      if (i === 1) break;
      await say('dawohn', L.wFront, { face: 'smile' });
    }
    call(story, 'use', 'trueweight');
    F('lent', true);
    await say('maya', L.ohGoScale, { face: 'think', auto: true });
    const dr = story.room?.spots?.door;
    if (dr) await race(story.walkPerson('dawohn', dr.x, dr.z - 0.2, 1.2), 5000);
    story.remove('dawohn');
  }
  let ohnWalking = false;
  async function toScale() {
    // outdoors: she crosses the wet square to the scale under the trader's awning; Maya a step behind
    if (ohnWalking || F('weighed')) return;
    ohnWalking = true;
    try {
      let e = story.people.get('dawohn');
      if (!e) { const d = DOORS.dryinghall ? front(DOORS.dryinghall, 0.9) : { x: P.hallDoor.x, z: P.hallDoor.z + 0.9 }; e = spawn('dawohn', { x: d.x - 0.6, z: d.z, h: Math.PI }); }
      await race(story.walkPerson('dawohn', P.ohnScale.x + 3, 96.6, 1.25), 14000);
      await race(story.walkPerson('dawohn', P.ohnScale.x, P.ohnScale.z, 1.1), 5000);
      e = story.people.get('dawohn');
      if (e) { e.p.root.rotation.y = P.ohnScale.h; e.home.h = P.ohnScale.h; }
      ohnAtScale = true;
    } finally { ohnWalking = false; }
  }
  let ohnAtScale = !!(F('lent') && !F('weighed'));
  async function weighScene() {
    if (F('weighed')) return;
    await walkMaya(P.mayaScale.x, P.mayaScale.z, 5000);
    faceMaya(P.scale.x, P.scale.z);
    // the beam in view (from the square's south-west, clear of Maya's umbrella): the weights, the pans, Daw Ohn beside it, Maya a step back
    game.rig.shot(new THREE.Vector3(P.scale.x - 1.2, 2.9, P.scale.z + 5.6), new THREE.Vector3(P.scale.x + 0.55, 1.0, P.scale.z + 0.45), 0.8);
    await say('maya', L.weighHang, { face: 'think', auto: true });
    for (let i = 0; i <= 10; i++) { h.scale.setTilt?.(-0.15 + (0.7 * i) / 10); await wait(60); }
    call(game.audio, 'play', 'thud');
    await say('maya', L.weightBox, { face: 'surprised' });
    await say('dawohn', L.ohQuiet, { face: 'think' });
    proof('weights');
    ohnWalking = true; // (she stays by the scale for the lines below, then walks; placePeople must not tidy her away)
    F('weighed', true);
    await say('maya', L.weightBack, { face: 'think' });
    // she walks on past the kiln shed to the committee room's door, opens it herself and goes in
    await say('maya', L.ohToCommittee, { face: 'think', auto: true });
    syncDoors();
    ohnWalking = true;
    const dd = P.committeeDoor;
    race(story.walkPerson('dawohn', dd.x - 0.3, dd.z + 0.8, 1.25), 16000)
      .then(() => race(story.walkPerson('dawohn', dd.x, dd.z + 0.05, 1.0), 3000))
      .then(() => { call(game.audio, 'play', 'door'); if (!story.inRoom) story.remove('dawohn'); ohnWalking = false; });
  }
  async function reportScene() {
    if (F('report')) return;
    await say('maya', L.benchIntro, { face: 'think', auto: true });
    await say('dawohn', L.ohWrite, { face: 'think' });
    const r = await sort({
      title: L.sort20.title, hint: L.sort20.hint, who: 'dawohn',
      baskets: L.sort20.baskets, cards: L.sort20.cards,
      react: { wrongIn: { ...L.sort20.wrongIn, who: 'dawohn' }, wrongOut: { ...L.sort20.wrongOut, who: 'dawohn' } },
      wrong: L.sort20.wrongIn,
    });
    if (r?.cancelled) return;
    await say('maya', L.reportDone, { face: 'smile', auto: true });
    F('report', true);
    await handIn();
  }
  async function handIn() {
    if (F('handed')) return;
    const room = story.room;
    for (;;) {
      const i = await D.choose(L.cChoices);
      if (i === 1) break;
      await say('dawohn', L.cFront, { face: 'smile' });
    }
    // she carries it across to Daw Mya Mya's table herself; Maya beside her
    const oh = room?.spots?.ohnHand, ms = room?.spots?.maya;
    if (oh) race(story.walkPerson('dawohn', oh.x, oh.z, 1.0), 4000);
    if (ms) await walkMaya(ms.x, ms.z, 4500);
    faceMaya(0, -2.1);
    await twoShotWith('myamya', async () => {
      await say('myamya', L.mm1, { face: 'think' });
      await say('myamya', L.mmCall, { face: 'think' });
    });
    // the trader brings his box of weights in (not in front of the market)
    const dr = room?.spots?.door;
    story.remove('kyinyein');
    if (dr) {
      spawn('kyinyein', { x: dr.x, z: dr.z - 0.2, h: Math.PI });
      const kp = room?.spots?.kyinyein;
      if (kp) await race(story.walkPerson('kyinyein', kp.x, kp.z, 1.0), 5000);
    }
    room?.setBox?.(true);
    await say('maya', L.mmWeigh, { face: 'think', auto: true });
    call(game.audio, 'play', 'thud');
    F('handed', true);
    await showSlip(game, L.notice, { title: L.noticeTitle });
    syncProps();
    // he quietly takes a new set from the cupboard and goes out to hang them himself
    const cb = room?.spots?.kyinyeinCupboard;
    if (cb) await race(story.walkPerson('kyinyein', cb.x, cb.z, 1.0), 4000);
    await say('kyinyein', L.kyNew, { face: 'sad' });
    room?.setBox?.(false);
    if (dr) race(story.walkPerson('kyinyein', dr.x, dr.z - 0.1, 1.1), 5000).then(() => { if (story.inRoom === 'committeeroom') story.remove('kyinyein'); });
    await say('maya', L.girlGets, { face: 'smile', auto: true });
    await say('maya', L.mayaDistinct, { face: 'think' });
    // Daw Ohn goes back to her stall; the heat stays outside, unspoken
    if (dr) race(story.walkPerson('dawohn', dr.x + 0.3, dr.z - 0.1, 1.1), 5000).then(() => { if (story.inRoom === 'committeeroom') story.remove('dawohn'); });
    await say('maya', L.ohBack, { face: 'smile', auto: true });
  }
  async function ohnEnd() {
    if (F('ch20Done')) return;
    await say('dawohn', L.ohEnd, { face: 'smile' });
    await say('micho', L.mcEnd, { face: 'happy' });
    F('ch20Done', true);
    look();
    await say('maya', L.drizzle, { face: 'smile', auto: true });
    if (bothDone()) await say('maya', L.goHome, { face: 'smile' });
  }
  async function kilnTap() {
    if (F('rumour.kilnout')) { await say('maya', L.kilnAgain, { face: 'think' }); return; }
    await say('maya', L.kiln, { face: 'surprised' });
    pencil('kilnout');
    proof('kilnout');
  }

  // ---------------------------------------------------------------------------------------------
  // 8.2 · the Bookmark Desk `kiln` (only if it is still dark), today's lines first
  // ---------------------------------------------------------------------------------------------
  const ow = story.openWorld;
  const lightDesk0 = ow?.lightDesk;
  if (ow && lightDesk0 && !story.flag('desk:kiln') && !save.flags['d10.desk.kiln']) {
    ow.lightDesk = async (d) => {
      if (d?.id !== 'kiln' || story.flag('desk:kiln')) return lightDesk0.call(ow, d);
      if (story.talking || game.busy) return;
      const ok = await stage(async () => {
        await say('maya', [L.deskKilnQ], { face: 'think' });
        for (;;) { const i = await D.choose(L.deskKiln); if (i === 0) break; await say('maya', L.deskWrong, { face: 'think' }); }
      });
      if (!ok) return;
      await lightDesk0.call(ow, d);
      await stage(async () => { await say('maya', L.deskDone, { face: 'happy', auto: true }); });
      F('desk', true);
      story.flag('desk:kiln', true);
      if (!F('rumour.kilnout')) proof('kilnout');
      pencil('weights');
    };
  }

  // ---------------------------------------------------------------------------------------------
  // 8.3 · the soaked board at home (evening), Ma Wint War by the Post Office
  // ---------------------------------------------------------------------------------------------
  async function boardTap() {
    if (F('board') !== undefined) { await say('maya', L.boardAgain, { face: 'smile' }); return; }
    if (!bothDone()) { await say('maya', L.boardBefore, { face: 'think' }); return; }
    await boardScene();
  }
  async function boardScene() {
    if (F('board') !== undefined) return;
    // the soaked board itself, close (its run ink, the few dry re-pinned notes), Ma Wint War beside it
    const bt = story.board?.target || { x: P.homeBoard.x, y: 1.3, z: P.homeBoard.z };
    game.rig.shot(new THREE.Vector3(bt.x - 0.25, bt.y + 0.85, bt.z + 3.9), new THREE.Vector3(bt.x + 0.35, bt.y - 0.2, bt.z + 0.2), 0.8); // (straight from the south: the Post Office wall is east of it)
    if (story.people.get('wintwar')) await say('wintwar', L.wwBoard, { face: 'think' });
    let i = await D.choose(L.boardChoices);
    if (i !== 1) {
      await say('maya', i === 0 ? L.boardFront : L.boardCold, { face: 'think' });
      i = await D.choose(L.boardChoices);
    }
    if (i === 1) await say('maya', L.boardLeave, { face: 'smile' });
    F('board', i);
    story.flag('board.count', 9);
    syncProps();
  }

  // ---------------------------------------------------------------------------------------------
  // 9 · the night page (at the Writing Room, once both chapters are done)
  // ---------------------------------------------------------------------------------------------
  async function replantHome() {
    if (F('replanted')) return;
    if (!F('bed')) { await say('maya', L.bed, { face: 'sad' }); if (!story.has('pods')) story.give('pods', 1, { quiet: true }); F('bed', true); }
    if (outdoors() && story.foot.active) { await walkMaya(P.homeBed.x + 0.2, P.homeBed.z + 0.95, 6000); faceMaya(P.homeBed.x, P.homeBed.z); call(game.maya, 'emote', 'bow'); }
    await say('maya', L.replant, { face: 'think' });
    story.take?.('pods');
    save.home = save.home || {};
    save.home.bed = { ...(save.home.bed || {}), seeds: 'toetoe', planted: 12, bloom: null };
    save.home.window = 'shut';
    h.homeBed.setState?.('sown');
    F('replanted', true);
    story.persist();
  }
  let nightBusy = false, nightInBusy = false;
  /** At the Writing Room door (on foot or by car): the replant at the flat bed, then inside to the desk. */
  async function night() {
    if (nightBusy || nightInBusy || F('done') || !bothDone()) return;
    nightBusy = true;
    try {
      story.weather(null); // the rain has stopped; the puddles stay
      if (outdoors()) {
        if (!F('replanted')) { const ok = await stage(replantHome); if (!ok) return; }
        if (await story.enter('about', { at: 'mayaDesk' })) return; // enterRoom('about') runs the page
      }
      await nightIn();
    } finally { nightBusy = false; }
  }
  /** The night page at the writing desk: the true sentence, where the notebook sleeps, stamps 19 and 20. */
  async function nightIn() {
    if (nightInBusy || F('done') || !bothDone()) return;
    nightInBusy = true;
    try {
      if (save.weather) story.weather(null);
      const can = ['hpohtaw', 'dawohn', 'micho', 'naychi', 'kophyo', 'palae', 'myamya', 'kyinyein'];
      let who = can.filter((id) => met.has(id));
      if (!who.length) who = ['hpohtaw', 'dawohn'];
      story.flag('reply.d12', L.reply); // 8.4: the reply letter's back page, pencil, after the stamp
      await nightPage(story, {
        day: 12,
        truth: { q: L.nightQ, choices: L.nightChoices, right: 1, wrong: L.nightWrong },
        before: async () => { if (!F('replanted')) await replantHome(); },
        sleep: { q: L.sleepQ, who },
        stamps: [19, 20],
        stampText: L.stampText,
        tomorrow: L.tomorrow,
      });
    } finally { nightInBusy = false; }
  }

  // ---------------------------------------------------------------------------------------------
  // who says what (a tap on someone)
  // ---------------------------------------------------------------------------------------------
  const talk = {
    wintwar: async () => {
      if (!F('morning')) return morning();
      if (bothDone() && F('board') === undefined) return boardScene();
      return say('wintwar', F('board') !== undefined ? L.wwBoard.slice(1) : L.wwLater, { face: 'smile' });
    },
    hpohtaw: async () => {
      if (story.inRoom === 'hpohtawshed') return shedFlow();
      if (!F('htMet')) return htHook();
      if (F('ch19Done')) return say('hpohtaw', L.htAfter, { face: 'think' });
      if (F('htOut')) return say('maya', L.farBedWait, { face: 'think' });
      return say('hpohtaw', L.htWait, { face: 'sad' });
    },
    naychi: async () => say('naychi', F('ncAfterSaid') ? L.ncAfter : (F('ncAfterSaid', true), L.naychiMaya), { face: 'happy' }),
    kophyo: async () => {
      if (!F('ohnMet') && !F('kpHint')) { F('kpHint', true); return say('kophyo', L.kpHint, { face: 'smile' }); }
      const lines = rot('kp', L.kp);
      if (lines === L.kp[1]) pencil('weights');
      if (lines === L.kp[2]) pencil('kilnout');
      return say('kophyo', lines, { face: 'smile' });
    },
    kyinyein: async () => {
      if (F('ohnMet') && !F('mlook.hand') && outdoors()) return mlook('hand');
      return say('kyinyein', F('handed') ? L.kyAfter : L.ky, { face: F('handed') ? 'sad' : 'smile' });
    },
    dawohn: async () => {
      if (story.inRoom === 'dryinghall') {
        if (!F('ohnMet')) return hallHook();
        if (!F('lid')) return lidScene();
        if (F('handed')) return F('ch20Done') ? say('dawohn', [L.ohEnd[0]], { face: 'smile' }) : ohnEnd();
        if (!F('ohnTalk')) {
          if (story.talk.waiting(TALK_D12_DAWOHN.id)) return say('dawohn', L.ohNotYet, { face: 'think' });
          if (!(await ohnTalkScene())) return;
        }
        if (!F('lent')) await lendWeight();
        return;
      }
      if (story.inRoom === 'committeeroom') { if (!F('report')) return reportScene(); if (!F('handed')) return handIn(); return say('dawohn', [L.ohEnd[1]], { face: 'smile' }); }
      if (F('ohnTalk') && !F('weighed')) return weighScene();
      return say('dawohn', L.ohLater, { face: 'smile' });
    },
    micho: async () => say('micho', F('ch20Done') ? L.mcEnd : L.mcHere, { face: F('ch20Done') ? 'happy' : 'worried' }),
    palae: async () => {
      if (F('ch20Done')) return say('palae', L.plAfter, { face: 'smile' });
      return say('palae', rot('pl', L.pl), { face: 'smile' });
    },
    myamya: async () => say('myamya', L.myamya, { face: 'think' }),
  };

  // ---------------------------------------------------------------------------------------------
  // rooms (INDEX 13.2; the room files own the furniture and the spots)
  // ---------------------------------------------------------------------------------------------
  function roomCast(id) {
    const c = (who, spot) => ({ id: who, spot });
    switch (id) {
      case 'about': return F('morning') ? [] : [c('wintwar', 'wintwarMat')];
      case 'hpohtawshed': return F('htIn') && !F('htOut') ? [c('hpohtaw', 'hpohtaw')] : [];
      case 'dryinghall': {
        // (one buyer at Ma Pa Lae's table: three in a queue clumped on screen and stood in the aisle where the talk is staged)
        const list = [c('micho', 'micho'), c('palae', 'palae'), c('buyerA', 'queue1')];
        if (!ohnAway()) list.unshift(c('dawohn', 'dawohn'));
        if (!F('ohnTalk')) list.push(c('kidA', 'kid1'), c('kidB', 'kid2'));
        else list.push(c('kidA', 'kid1'), c('kidB', 'mayaKids'));
        return list;
      }
      case 'committeeroom': return F('weighed') && !F('handed') ? [c('myamya', 'myamya'), c('dawohn', 'dawohn')] : F('handed') ? [c('myamya', 'myamya'), c('weighgirl', 'girl')] : [c('myamya', 'myamya')];
      case 'paperstore': return [];
      case 'kilntea': return [c('teauncle', 'teauncle'), c('carter1', 'carter1'), c('carter2', 'carter2')];
      case 'gourdhouse': return [];
      default: return undefined;
    }
  }
  function roomOpts(id) {
    if (id === 'hpohtawshed') return { trowel: !F('htOut'), mug: !!F('htTalk') };
    if (id === 'dryinghall') return { boil: F('lid') ? 0.15 : 0.35 };
    return {};
  }
  async function enterRoom(id, room) {
    if (story.doors?.roomCam) story.doors.roomCam(ROOM_CLOSE); // the close, low follow camera inside (never the whole-room view)
    if (id === 'about') wetRoom(true);
    if (id === 'about') {
      if (!F('morning')) { await wait(500); if (!F('morning')) await stage(morning); return; }
      if (bothDone() && !F('done')) { await wait(400); return nightIn(); }
      return;
    }
    if (id === 'hpohtawshed') {
      room?.setTrowel?.(!F('htOut'));
      if (!F('htDoor')) { await wait(400); await stage(async () => { await say('hpohtaw', L.htDoor, { face: 'think' }); F('htDoor', true); }); }
      if (F('looked') && !F('htOut')) { await wait(300); const e = story.people.get('hpohtaw'); if (e) story.talkTo(e); }
      return;
    }
    if (id === 'dryinghall') {
      if (!F('ohnMet')) { await wait(500); const e = story.people.get('dawohn'); if (e) story.talkTo(e); return; }
      if (F('handed') && !F('ch20Done')) { await wait(500); const e = story.people.get('dawohn'); if (e) story.talkTo(e); }
      return;
    }
    if (id === 'committeeroom') {
      if (F('weighed') && !F('handed')) { await wait(500); const e = story.people.get('dawohn'); if (e) story.talkTo(e); }
    }
  }
  function leaveRoom(id) {
    if (id === 'about') wetRoom(false);
    if (id === 'about' && F('morning') && !F('umbrellaOut')) {
      F('umbrellaOut', true);
      setTimeout(() => { if (alive && outdoors()) stage(() => say('maya', L.umbrellaOut, { face: 'smile', auto: true })); }, 1600);
    }
  }
  function station(id) {
    const run = (fn) => { stage(fn); return true; };
    const person = (pid) => { const e = story.people.get(pid); if (e) { story.approach(e); return true; } return false; };
    const where = story.inRoom;
    if (where === 'about') {
      if (id === 'trunk') return run(trunk);
      if (id === 'window') return run(() => say('maya', L.windowLook, { face: 'sad' }));
      return false;
    }
    if (where === 'hpohtawshed') {
      switch (id) {
        case 'diary': case 'shelf': return run(() => look19('diary'));
        case 'tin': return run(() => look19('tin'));
        case 'basin': return run(() => say('maya', L.basin, { face: 'think' }));
        case 'hook': return run(() => say('maya', L.hook, { face: 'think' }));
        case 'trowel': return run(() => say('maya', L.trowelLook, { face: 'think' }));
        case 'hpohtaw': return person('hpohtaw');
        default: return false;
      }
    }
    if (where === 'dryinghall') {
      switch (id) {
        case 'stall': return person('dawohn') || run(() => say('maya', L.ohBack, { face: 'think' }));
        case 'pot': if (F('ohnMet') && !F('lid')) return run(lidScene); return run(() => say('maya', L.potLook, { face: 'think' }));
        case 'kids': if (!F('ohnMet')) return run(() => sayAs(L.kidsName, LOOKS?.kidA, F('ohnTalk') ? L.kidsAfter : L.kidsBefore)); if (!F('mlook.kids')) return run(() => mlook('kids')); return run(() => sayAs(L.kidsName, LOOKS?.kidA, F('ohnTalk') ? L.kidsAfter : L.kidsBefore));
        case 'shards': return run(() => (F('ohnMet') ? mlook('shards') : say('palae', L.pl[1], { face: 'smile' })));
        case 'racks': return run(() => say('maya', L.racks, { face: 'think' }));
        case 'palae': return person('palae');
        default: return false;
      }
    }
    if (where === 'committeeroom') {
      switch (id) {
        case 'myamya': return person('myamya');
        case 'bench': if (F('weighed') && !F('report')) return run(reportScene); return run(() => say('maya', L.benchIntro, { face: 'think' }));
        case 'cupboard': return run(() => say('maya', L.cupboard, { face: 'think' }));
        case 'notices': return run(() => say('maya', L.notices, { face: 'think' }));
        case 'ledger': return run(() => say('maya', L.ledger, { face: 'think' }));
        default: return false;
      }
    }
    return false;
  }

  // ---------------------------------------------------------------------------------------------
  // every frame
  // ---------------------------------------------------------------------------------------------
  let checkT = 0;
  function update(dt, t) {
    if (!alive) return;
    set.update(dt, t, story.openWorld?.focus?.() || game.maya.root.position);
    holdUmbrella();
    dripsUpdate(dt);
    for (const [key, x] of extras) {
      const q = x.p.root.position;
      if (x.path && x.path.length) {
        const wp = x.path[0], dx = wp.x - q.x, dz = wp.z - q.z, d = Math.hypot(dx, dz);
        if (d < 0.1) { x.path.shift(); if (!x.path.length) { x.path = null; const f = x.onArrive; x.onArrive = null; f?.(); } x.p.update(dt, { speed: 0 }); continue; }
        const sp = x.speed || 1.3;
        q.x += (dx / d) * Math.min(d, sp * dt); q.z += (dz / d) * Math.min(d, sp * dt);
        let r = Math.atan2(dx, dz) - x.p.root.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r));
        x.p.root.rotation.y += r * (1 - Math.exp(-dt * 10));
        x.p.lookAt(null);
        x.p.update(dt, { speed: sp });
        continue;
      }
      const m = game.maya.root.position;
      x.p.lookAt(Math.hypot(m.x - q.x, m.z - q.z) < 3.5 && outdoors() ? v3.set(m.x, 1.0, m.z) : null);
      x.p.setMood?.(x.mood && Math.hypot(m.x - q.x, m.z - q.z) > 2.6 ? x.mood : null);
      x.p.update(dt, { speed: 0 });
      // soft to bump into
      if (story.foot.active && outdoors()) {
        const wp = story.foot.walker.pos, ddx = wp.x - q.x, ddz = wp.y - q.z, d = Math.hypot(ddx, ddz), min = (x.p.radius || 0.3) + 0.28;
        if (d < min && d > 1e-4) { const k = (min - d) * Math.min(1, dt * 12); wp.x += (ddx / d) * k; wp.y += (ddz / d) * k; }
      }
      void key;
    }
    if ((checkT -= dt) > 0) return;
    checkT = 0.2;
    if (!outdoors()) return;
    placePeople();
    // scripted walks that run on their own
    if (F('htMet') && !F('htIn') && htGoAt && performance.now() > htGoAt && !story.talking) htGoIn();
    if (F('htOut') && !F('replant') && !htAtBed && !htToBed) htOutside();
    if (F('lent') && !F('weighed') && !ohnAtScale && !ohnWalking) toScale();
    if (story.talking || game.busy || game.ui.dialogOpen) return;
    const m = mayaXZ();
    const onFoot = story.foot.active;
    // arriving in the Garden (the clasp): the wet crowd
    if (F('morning') && !F('arrived') && m.x > 240 && m.x < 269 && m.z > 104 && m.z < 137.4) {
      F('arrived', true);
      stage(async () => { await say('maya', L.arrive, { face: 'think', auto: true }); await crowdScene(); });
      return;
    }
    if (F('morning') && !F('arrived') && m.x > 119 && m.x < 269 && m.z > 18 && m.z < 137.4) { F('arrived', true); crowdDisperse(-1); return; } // in by the torn crease: the crowd has gone by now
    if (!onFoot) {
      if (bothDone() && !F('done') && Math.hypot(game.car.root.position.x - P.aboutDoor.x, game.car.root.position.z - (P.aboutDoor.z + 3)) < 2.2) night();
      return;
    }
    // the crowd disperses by itself after a while, whatever Maya does
    if (F('arrived') && !F('crowdDone') && !near(P.clasp.x, P.clasp.z, 9)) { crowdDisperse(1); return; }
    // U Hpo Htaw on his bench, the first time Maya comes close
    const ht = story.people.get('hpohtaw');
    if (!F('htMet') && ht && Math.hypot(m.x - ht.p.root.position.x, m.z - ht.p.root.position.z) < 3.4) { story.talkTo(ht); return; }
    // he is at the far bed and Maya is in his plot: the three rows
    if (F('htOut') && htAtBed && !F('replant') && m.x > P.plotHP.x0 - 1 && m.x < P.plotHP.x1 + 1 && m.z > P.backZ && m.z < P.fenceZ + 2.2) { stage(replantScene); return; }
    // Daw Ohn at the scale: the weighing when Maya is close
    if (F('lent') && !F('weighed') && ohnAtScale && near(P.ohnScale.x, P.ohnScale.z, 4)) { stage(weighScene); return; }
    // home in the evening: Ma Wint War by the board
    const ww = story.people.get('wintwar');
    if (bothDone() && F('board') === undefined && ww && Math.hypot(m.x - ww.p.root.position.x, m.z - ww.p.root.position.z) < 3.0) { story.talkTo(ww); return; }
    // the night page at the Writing Room door
    if (bothDone() && !F('done') && near(P.aboutDoor.x, P.aboutDoor.z + 0.6, 2.2)) night();
  }

  // ---------------------------------------------------------------------------------------------
  // test hooks: window.__day12.skipTo(beat) sets the flags of every beat before it
  // ---------------------------------------------------------------------------------------------
  const BEATS = ['morning', 'bed', 'arrived', 'htMet', 'looked', 'sorted', 'htTalk', 'diaryLine', 'replant', 'ch19Done', 'ohnMet', 'lid', 'mlooked', 'ohnTalk', 'weighed', 'report', 'handed', 'ch20Done', 'board', 'night'];
  const BEAT_FLAGS = {
    morning: ['morning', 'soaked', 'umbrellaOut'], bed: ['bed'], arrived: ['arrived', 'crowdDone'], htMet: ['htMet', 'htIn', 'htDoor'],
    looked: [...LOOKS19.map((k) => `look.${k}`), 'looked'], sorted: ['sorted'], htTalk: ['htTalk'], diaryLine: ['diaryLine', 'htOut'],
    replant: ['replant'], ch19Done: ['gate', 'ch19Done'], ohnMet: ['ohnMet', 'kpHint'], lid: ['lid'], mlooked: [...MLOOKS.map((k) => `mlook.${k}`), 'mlooked'],
    ohnTalk: ['ohnTalk', 'lent'], weighed: ['weighed'], report: ['report'], handed: ['handed'], ch20Done: ['ch20Done'], board: [],
  };
  const SIDE = {
    morning: () => {
      if (F('soakedN') === undefined) F('soakedN', story.soak());
      if (!story.companions.has('note')) story.companions.add('note');
      pencil('onlyme');
      if (story.flag('rumour.rain') && story.flag('rumour.rain') !== 'checked') story.flag('rumour.rain', 'checked');
    },
    bed: () => { if (!story.has('pods')) story.give('pods', 1, { quiet: true }); },
    arrived: () => F('crowd', 2),
    looked: () => { proof('onlyme'); proof('again'); },
    weighed: () => proof('weights'),
    board: () => F('board', 1),
  };
  const hooks = {
    beats: BEATS,
    set,
    flags: () => Object.fromEntries(Object.entries(save.flags).filter(([k]) => k.startsWith('d12.'))),
    state: () => ({ inRoom: story.inRoom, met: [...met], looks: lookCount(), mlooks: mlookCount(), weather: save.weather, htAtBed, ohnAtScale, extras: [...extras.keys()], people: [...story.people.keys()] }),
    /** Set every flag before `beat` (so the next step plays `beat`), then reload to rebuild the page. */
    skipTo(beat, { reload = true } = {}) {
      const k = BEATS.indexOf(beat);
      if (k < 0) return BEATS;
      for (const b of BEATS.slice(0, k)) { for (const f of BEAT_FLAGS[b] || []) F(f, true); SIDE[b]?.(); }
      story.persist();
      if (reload) location.reload();
      return hooks.flags();
    },
    night,
    nightIn,
    run: { morning: () => stage(morning), trunk: () => stage(trunk), bed: () => stage(bed), crowd: () => stage(crowdScene), htGoIn, shed: () => stage(shedFlow), replant: () => stage(replantScene), gate: () => stage(gateScene), hall: () => stage(hallHook), ohnTalk: () => stage(ohnTalkScene), lend: () => stage(lendWeight), weigh: () => stage(weighScene), report: () => stage(reportScene), end: () => stage(ohnEnd), board: () => stage(boardScene), look: (id) => stage(() => (MLOOKS.includes(id) ? mlook(id) : look19(id))), kiln: () => stage(kilnTap) },
    talks: { ht: TALK_D12_HPOHTAW, ohn: TALK_D12_DAWOHN },
  };
  window.__day12 = hooks;

  return {
    talk,
    roomCast,
    roomOpts,
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
      for (const k of [...extras.keys()]) dropExtra(k);
      for (const id of [...mine, 'wintwar']) { const e = story.people.get(id); if (e) e.ctl = null; story.remove(id); }
      umb.removeFromParent();
      wetRoom(false); dripsOn(null);
      if (game.enterRoomScene === enterRoomScene12) game.enterRoomScene = enterRoomScene0;
      set.dispose();
      if (window.__day12 === hooks) delete window.__day12;
    },
    async start() {
      look();
      placePeople();
      placeExtras();
      if (F('morning')) return;
      // the day opens INSIDE the Writing Room: rain on the roof, the back window banging, a knock
      for (let i = 0; i < 60 && (game.busy || game.mode !== 'world') && !story.inRoom && alive; i++) await wait(500);
      if (!alive) return;
      if (story.inRoom === 'about') { if (story.doors?.roomCam) story.doors.roomCam(ROOM_CLOSE); wetRoom(true); if (!story.people.get('wintwar')) story.spawn('wintwar', 'wintwarMat'); return stage(morning); }
      if (story.inRoom) await story.exit({ instant: true });
      if (!story.foot.active) await story.foot.toFoot().catch(() => {});
      for (let i = 0; i < 20 && alive; i++) {
        if (await story.enter('about', { at: 'mayaMat' })) return; // enterRoom runs the morning
        await wait(500);
        if (story.inRoom) return;
      }
      // could not get in: Ma Wint War brings the post outdoors
      if (!story.people.get('wintwar')) spawn('wintwar', { x: P.aboutDoor.x + 1.2, z: P.aboutDoor.z + 1.0, h: 0 });
    },
  };
}
