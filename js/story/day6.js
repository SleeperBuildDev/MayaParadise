// Day 6 (Ledger Wharf and the west bank) — chapter 8, ဥပေက္ခာ (Equanimity), and chapter 11 Act 1 (slates 1-5).
// The playable script is day6-spec.md (draft 3); INDEX 13.2 room layouts and INDEX 9 flags win over it.
//
// Lesson (p51-54): hatred brings no good; don't start it, don't return it, don't resent a wrongdoer who does
// well (each gets what their own doing brings). Making someone "not exist" is not equanimity: it leaves you two
// ways of treating people. Hold goodwill evenly, wished in order (yourself, someone dear, someone dearer, last
// the one who dislikes you), and stay like the ground, which answers neither jewels nor mud.
// Chapter 11 Act 1 (p61-64): ten short lessons; Nay Chi's own hands do slates 1-5 and they stay pencil.
//
// The day, in order (each "where" is said by a person or can be seen; nothing ever marks a place):
//   1. Morning post at the Writing Room door (Ko Thiha's letter; the Upstream Fish and the Two-Tailed Ribbon
//      lift off). Ma Wint War: Nay Chi waits inside the Post Office; 31 notes on its wall.
//   2. Post Office sorting room (`sortingroom`, the green side door): Nay Chi's ask, the ten slates chalked
//      (main quest). She hangs them on the bridge board at the end of the Market road (`ncHung`, 90 s).
//   3. The noon wind (outdoors only, at the Wharf or the tea-shop street): five slates come down over the
//      Market and the Wharf, four fly out of sight, one stays. Nay Chi follows Maya from now until evening.
//   4. Ch 8, any order: Daw Sanda inside the weigh-house (`weighhouse`: her four-wishes habit; the scale) →
//      wave Ko Thiha in at Little Jetty → the run (`pole`, seven stops; at Cane Jetty Maya can step into
//      `caneshed`: four looks) → W what she saw → T his talk in `sandahouse` → C four wishes, two carried
//      (Maung Nge at his cart, then Daw Sanda) → H `steady` at Cane Jetty → the same "keeping well!"; a nod.
//   5. Ch 11 slates, by Nay Chi's own hands: 1 the cup (`teashop`), 3 a habit she picks (`teashop`),
//      5 who is looking (`marketpost`), 2 the porters' chatter (`weighhouse`), 4 her mistake at the cart.
//   6. Evening: Nay Chi asks Maya to read the slates to her each morning (Act 1's yes). Home: the board.
//   7. Night page at the Writing Room door (or inside it): stamp ✓ ၈, page 11 pencil, save.day = 7.
//
// Test hooks: window.__day6 = { skipTo(beat), state(), gust(), F, L, set }  (see the bottom of create()).
// Burmese lines are drafts for Maya (day6-lines.js).
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { steady } from './acts/steady.js';
import { pole } from './acts/pole.js';
import { bi } from './acts/kit.js';
import { chalkSlate } from './props2.js';
import { slateGust } from './props4.js';
import { morningPost, nightPage, showSlip } from './post.js';
import { TALK_D6_THIHA } from './talks/day6.js';
import { L, NAMES, SLEPT5, SLATES, PROOF } from './day6-lines.js';
import { buildSet, propTaps, walkOn, LOOKS, P } from './day6-set.js';

const PI = Math.PI;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
// the close, low follow camera for story rooms (never the far whole-room view): FOOT_VIEW's framing
const ROOM_CAM = { tilt: 32, width: 6.4, widthLandscape: 12, height: 0.85, minHeight: 0, stiffness: 5, bounds: null };
const MET = ['kothiha', 'dawsanda', 'maungnge', 'naychi', 'kophyo', 'khwarnyo', 'kolwin', 'ubolay'];

import { L as L7_ } from './day7-lines.js';
export const SLEPT6 = L7_.slept6; // tonight's hosts' lines (Day 7's morning table)

export async function create(story) {
  const { game, dialog: D, save } = story;
  const F = (k, v) => story.flag(`d6.${k}`, v);
  const scene = game.world.scene;
  const set = buildSet(story, game);
  const { S, W } = set;
  const taps = propTaps(story, game);
  const v3 = new THREE.Vector3();
  let clock = 0; // seconds since this page opened (session timers: the raft, the hang, Maung Nge's round)
  let dirty = true; // the outdoor people need placing again (done only while Maya is outdoors)
  const T = { dsMet: F('dsMet') && !F('raftBack') ? -30 : null, asked: F('ncAsked') && !F('ncHung') ? -60 : null, mnAway: F('mnAway') && !F('mnBack') ? -25 : null };
  const indoor = { walkons: [], props: [], seat: null }; // this room visit's own walk-ons and props
  const flys = []; // the gust's fly-over (slates over Maya's head)
  let shedDone = null; // resolves when Maya leaves the cane shed during a run
  let gustDue = null, gustWarned = false, zoneWas = null, nightBusy = false, eveTried = 0;
  let looks5 = null; // slate 5: the three looks through Nay Chi's eyes (a Set while open)

  // ---- small helpers
  const run = async (fn) => {
    if (story.talking) return;
    story.talking = true;
    game.ui.cinema(true);
    try { await fn(); } catch (e) { console.error('day6', e); } finally { story.talking = false; game.ui.cinema(false); game.rig.release(); }
  };
  const nameEl = () => document.querySelector('#dialog .dialog-name');
  /** A walk-on speaks (not in cast.js): the dialogue box with their plain name. */
  const sayAs = (name, lines, o = {}) => { const p = D.say('walkon', lines, o); const el = nameEl(); if (el) el.textContent = tr(name); return p; };
  const met = (id) => { if (MET.includes(id)) F(`met.${id}`, true); };
  const slatesDone = () => [1, 2, 3, 4, 5].filter((n) => F(`slate${n}`)).length;
  const doneSlate = (n) => { F(`slate${n}`, true); F('slates', slatesDone()); call(game.audio, 'play', 'chalk'); refreshSlates(); };
  const proof = (id) => {
    if ((save.bag[`proof:${id}`] || 0) > 0) return;
    save.proofs = save.proofs || {};
    save.proofs[id] = PROOF[id];
    story.give(`proof:${id}`);
  };
  const rumour = (id) => { F(`rumour.${id}`, true); story.flag(`rumour.${id}`, 'checked'); };
  const following = () => F('gust') && !F('ncEvening');
  const inZone = (z, x, y) => x >= z.x0 && x <= z.x1 && y >= z.z0 && y <= z.z1;
  const mayaXZ = () => { const p = game.maya.root.getWorldPosition(v3); return { x: p.x, z: p.z }; };
  function place(id, spot) {
    const e = story.people.get(id);
    const s = typeof spot === 'string' ? story.room?.spots?.[spot] : spot;
    if (!e || !s) return;
    e.walking = null;
    e.p.root.position.set(s.x, s.y && s.y < 0.6 ? s.y : 0, s.z);
    e.p.root.rotation.y = s.h ?? s.heading ?? 0;
    e.ob.x = s.x; e.ob.z = s.z;
    e.home = { x: s.x, z: s.z, h: e.p.root.rotation.y };
  }

  // ---------------------------------------------------------------- the outdoor people, by how far the day has gone
  let ncMode = null;
  function followCtl(e) {
    return (dt) => {
      const m = game.maya.root.getWorldPosition(v3), h = game.maya.root.rotation.y;
      const tx = m.x - Math.sin(h) * 1.3 + Math.cos(h) * 0.55, tz = m.z - Math.cos(h) * 1.3 - Math.sin(h) * 0.55;
      const pos = e.p.root.position;
      let dx = tx - pos.x, dz = tz - pos.z, d = Math.hypot(dx, dz);
      if (d > 16) { pos.x = tx - Math.sin(h) * 6; pos.z = tz - Math.cos(h) * 6; dx = tx - pos.x; dz = tz - pos.z; d = Math.hypot(dx, dz); } // (out of sight behind her)
      const sp = d > 0.4 ? Math.min(3.4, d * 1.7) : 0;
      let face = Math.atan2(m.x - pos.x, m.z - pos.z);
      if (sp > 0) { pos.x += (dx / d) * Math.min(d, sp * dt); pos.z += (dz / d) * Math.min(d, sp * dt); face = Math.atan2(dx, dz); }
      let r = face - e.p.root.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r));
      e.p.root.rotation.y += r * (1 - Math.exp(-dt * 8));
      e.ob.x = pos.x; e.ob.z = pos.z;
      e.p.lookAt(null);
      e.p.update(dt, { speed: sp });
    };
  }
  function sync() {
    if (story.inRoom) { dirty = true; return; }
    dirty = false;
    const has = (id) => story.people.has(id);
    // Ma Wint War: by the Writing Room for the morning, then by the Post Office and its board
    if (!has('wintwar')) {
      const at = F('morning') ? P.wwPost : { x: P.about.x + 2.6, z: P.about.z + 1.2, h: -PI / 2 };
      story.spawn('wintwar', { x: at.x, z: at.z, heading: at.h });
      if (F('morning')) story.setJob('wintwar', { area: { x: P.wwPost.x, z: P.wwPost.z + 1.0, r: 2.2 }, spot: { x: P.wwPost.x, z: P.wwPost.z, h: PI }, mood: 'read', workChance: 0.5, workFor: [5, 9] });
    }
    // Nay Chi: inside the sorting room → at the bridge board → at Maya's heel → home
    const want = !F('ncAsked') ? null : !F('gust') ? 'board' : !F('ncEvening') ? 'follow' : null;
    if (want !== ncMode || (want && !has('naychi'))) {
      if (has('naychi') && ncMode !== 'leaving') story.remove('naychi');
      if (want === 'board') story.spawn('naychi', { x: P.ncBoard.x, z: P.ncBoard.z, heading: P.ncBoard.h });
      if (want === 'follow') {
        const m = mayaXZ(), h = game.maya.root.rotation.y;
        const e = story.spawn('naychi', { x: m.x - Math.sin(h) * 6, z: m.z - Math.cos(h) * 6, heading: h });
        if (e) e.ctl = followCtl(e);
      }
      ncMode = want;
    }
    // Maung Nge at his cart (away on his round for a while during slate 4)
    const mnWant = !(F('mnAway') && !F('mnBack'));
    if (mnWant && !has('maungnge')) {
      story.spawn('maungnge', { x: P.mn.x, z: P.mn.z, heading: P.mn.h });
      story.setJob('maungnge', { area: { x: P.cart.x - 0.6, z: P.cart.z + 1.6, r: 1.6 }, spot: { x: P.mn.x, z: P.mn.z, h: P.mn.h }, mood: 'work', workChance: 0.7, workFor: [6, 12], lookAt: { x: P.cart.x, z: P.cart.z } });
    }
    if (!mnWant && has('maungnge') && !story.people.get('maungnge').walking) story.remove('maungnge');
    // Ko Thiha: out on his morning run → moored at Little Jetty → up in the house over his rice → on the raft
    const thWant = F('raftBack') && !(F('rideSeen') && !F('wishes'));
    if (thWant && !has('kothiha')) story.spawn('kothiha', { x: P.raft.x, z: P.raft.z, heading: PI * 0.6 });
    if (!thWant && has('kothiha') && !story.people.get('kothiha').walking) story.remove('kothiha');
    S.raft.root.visible = !!F('raftBack');
    S.raft.setPole?.(!F('rideSeen'));
    S.pole.root.visible = !!F('rideSeen');
    if (F('wishes')) { S.pole.root.position.set(P.raft.x - 1.25, 0, P.raft.z + 0.3); S.pole.root.rotation.set(0, 0, -0.08); }
    else { S.pole.root.position.set(P.pole.x, 0, P.pole.z); S.pole.root.rotation.set(0, 0, -0.2); }
    S.pole.setWish?.(!!F('wishes'));
    // U Bo Lay on his post on the sandbar; Ko Lwin at the carvers' corner
    if (!has('ubolay')) { const e = story.spawn('ubolay', { x: P.post.x, z: P.post.z, heading: 0.2 }); if (e) e.p.root.position.y = 0.58; } // (seated on wharf.js's post, top 0.9 m)
    if (!has('kolwin')) story.spawn('kolwin', { x: P.kolwin.x, z: P.kolwin.z, heading: P.kolwin.h });
    refreshSlates();
  }
  function refreshSlates() {
    S.awningSlate.root.visible = !!F('gust') && !F('slate1');
    S.cartSlate.root.visible = !!F('gust') && !F('s4got') && !F('slate4');
    const bb = S.bridge;
    if (!bb) return;
    for (let i = 0; i < 10; i++) {
      const hung = F('ncHung') && (!F('gust') || i === 9);
      bb.setSlate?.(i, hung ? { text: SLATES[i + 1].my, faint: true } : null);
    }
  }

  // ---------------------------------------------------------------- talk: what each person says, by the day so far
  const talk = {
    wintwar: () => { if (!F('morning')) return morning(); if (F('ncAsked') && F('leftHome') && !F('wwEve')) { F('wwEve', true); return D.say('wintwar', L.wwEvening, { face: 'smile' }); } return D.say('wintwar', L.wwLater, { face: 'smile' }); },
    naychi: async (e) => { met('naychi'); return naychiTalk(e); },
    maungnge: async () => { met('maungnge'); return maungngeTalk(); },
    kothiha: async () => { met('kothiha'); return story.inRoom === 'sandahouse' ? thihaHome() : thihaRaft(); },
    dawsanda: async () => { met('dawsanda'); return sandaTalk(); },
    ubolay: async () => {
      met('ubolay');
      if (F('ch8Done')) { await D.say('ubolay', L.ubAfter, { face: 'think' }); return call(story.people.get('ubolay')?.p, 'emote', 'nod'); }
      return D.say('ubolay', story.inRoom === 'caneshed' ? L.ubTap : L.ucs, { face: 'hot' });
    },
    kophyo: async () => { met('kophyo'); return kophyoTalk(); },
    tintin: () => D.say('tintin', L.tintin, { face: 'smile' }),
    khwarnyo: async () => { met('khwarnyo'); return khwarnyoTalk(); },
    luaye: () => D.say('luaye', L.luaye, { face: 'smile' }),
    kolwin: async () => { met('kolwin'); return D.say('kolwin', L.kolwin, { face: 'think' }); },
  };

  // ---------------------------------------------------------------- 4 · morning
  async function morning() {
    await morningPost(story, {
      day: 6, ww: L.ww1, slept: SLEPT5, after: L.ww2,
      letters: [{ from: 'kothiha', text: L.thNote }],
      companions: ['fish', 'ribbon'], liftCaption: { fish: L.fish, ribbon: L.ribbon }, lift: { ribbon: L.mayaLift },
      where: L.ww3,
    });
    // she goes back to her post by the Post Office (its board on the wall beside her)
    const ww = story.people.get('wintwar');
    if (ww) story.walkPerson('wintwar', P.wwPost.x, P.wwPost.z, 1.3).then(() => { if (story.people.get('wintwar') === ww) story.setJob('wintwar', { area: { x: P.wwPost.x, z: P.wwPost.z + 1.0, r: 2.2 }, spot: { x: P.wwPost.x, z: P.wwPost.z, h: PI }, mood: 'read', workChance: 0.5, workFor: [5, 9] }); });
  }

  // ---------------------------------------------------------------- 6.1 · Nay Chi's ask (sorting room), the board, the slates' road
  async function naychiTalk() {
    if (story.inRoom === 'sortingroom' && !F('ncAsked')) return ask();
    if (F('s4carry') && !F('slate4')) return D.say('naychi', L.ncCarryNo, { face: 'think' });
    if (eveningDue()) return evening();
    if (!F('gust')) return D.say('naychi', F('ncHung') ? L.ncBoard : L.ncHanging, { face: F('ncHung') ? 'worried' : 'smile' });
    if (F('ncEvening')) return D.say('naychi', L.ncHome, { face: 'happy' });
    return D.say('naychi', L.ncFollow, { face: 'think' });
  }
  async function ask() {
    const nc = story.people.get('naychi');
    call(nc?.p, 'emote', 'bow');
    await D.say('naychi', L.nc1, { face: 'worried' });
    await D.say('maya', L.mayaYes, { face: 'smile' });
    await D.say('maya', L.mayaThink, { face: 'think' });
    // the cut: ten small slates chalked at the sorting table, grey chalk (pencil)
    await game.ui.irisClose?.();
    for (let i = 0; i < 4; i++) { call(game.audio, 'play', 'chalk'); await wait(180); }
    await game.ui.irisOpen?.();
    await D.say('maya', [L.chalking], { face: 'smile' });
    await D.say('naychi', L.nc2, { face: 'happy' });
    F('ncAsked', true);
    T.asked = clock;
    // she goes: out of the sorting room (outdoors she is already on her way to the bridge board)
    const door = story.room?.spots?.door || story.room?.door || { x: 0, z: 2.9 };
    if (nc) Promise.race([story.walkPerson('naychi', door.x, door.z, 1.5), wait(5000)]).then(() => { if (story.inRoom === 'sortingroom') story.remove('naychi'); });
    dirty = true;
  }
  async function boardTap() {
    if (!F('ncAsked')) return D.say('maya', L.boardBefore, { face: 'think' });
    if (F('board')) return D.say('maya', L.boardPinned, { face: 'smile' });
    await D.say('maya', L.boardMaya, { face: 'think' });
    await D.say('maya', [L.boardPick], { face: 'think' });
    const i = await D.choose(L.board.map((n) => ({ my: `${n.from.my}: ${n.my}`, en: `${n.from.en}: ${n.en}` })));
    const j = await D.choose(L.board[i].replies);
    F('board', true);
    F('boardReply', `${i}:${j}`); // Act 1 judges no reply (note 3 is the leaning spreading, Day 8)
    story.board.set({ replies: 4 });
    call(game.audio, 'play', 'page');
    await D.say('maya', L.boardPinned, { face: 'smile' });
  }
  async function bridgeTap() {
    const line = !F('ncHung') ? L.bridgeEmpty : !F('gust') ? L.bridgeFull : L.bridgeAfter;
    await D.say('maya', line, { face: 'think' });
  }

  // ---------------------------------------------------------------- 6.2 · the noon wind
  async function gust() {
    if (F('gust')) return;
    gustDue = null;
    story.talking = true;
    game.ui.cinema(true);
    try {
      call(game.audio, 'play', 'whoosh');
      S.gust.play();
      // what Maya sees: little grey slates lifting over the roofs, four sailing north out of sight
      const m = mayaXZ();
      const fly = slateGust({ board: null, toWharf: [-7, -2.2, 36], north: [10, 0, -95], duration: 7 });
      fly.root.position.set(m.x + 3, 0, m.z - 22);
      scene.add(fly.root);
      flys.push({ g: fly, t: 0 });
      fly.play();
      game.rig.shot(new THREE.Vector3(m.x - 1.5, 2.2, m.z + 6.5), new THREE.Vector3(m.x + 1.5, 5.5, m.z - 16), 1.1);
      await wait(3400);
      call(game.audio, 'play', 'whoosh');
      await D.say('maya', L.gustMaya, { face: 'surprised' });
      F('gust', true);
      dirty = true;
      sync();
      await wait(1200);
      await D.say('naychi', L.ncGust, { face: 'sad' });
      await D.say('maya', L.mayaGust, { face: 'smile' });
      proof('wind');
      rumour('wind');
    } finally {
      gustDue = null; // (the zone check below kept running while the slates flew: no second warning after the wind)
      game.rig.release();
      game.ui.cinema(false);
      story.talking = false;
    }
  }

  // ---------------------------------------------------------------- 5.2 · Daw Sanda (weigh-house)
  async function sandaTalk() {
    if (F('ch8Done')) return D.say('dawsanda', L.dsAfter8, { face: 'smile' });
    if (F('wishes') && !F('note3')) {
      if (!F('note2')) return D.say('dawsanda', L.dsNotYet, { face: 'think' });
      call(game.audio, 'play', 'page');
      await D.say('dawsanda', L.dsNote, { face: 'happy' });
      F('note3', true);
      return;
    }
    if (!F('dsMet')) { await D.say('dawsanda', L.ds1, { face: 'smile' }); F('dsMet', true); T.dsMet = clock; return; }
    if (!F('dsOrder')) { await D.say('dawsanda', L.dsOrder, { face: 'think' }); F('dsOrder', true); return; }
    if (!F('raftBack')) return D.say('dawsanda', L.dsEarly, { face: 'smile' });
    return D.say('dawsanda', L.dsBusy, { face: 'smile' });
  }
  async function scaleMoment() {
    // a merchant's big crate, then a child's small parcel: the same «ရပြီ», the same line in the ledger
    if (!F('scaleSeen') && story.room?.spots?.merchant) {
      await sayAs(NAMES.merchant, L.merchantAsk);
      call(game.audio, 'play', 'thud');
      await D.say('dawsanda', [L.dsDone], { face: 'smile' });
      await sayAs(NAMES.child, L.childAsk);
      call(game.audio, 'play', 'click');
      await D.say('dawsanda', [L.dsDone], { face: 'smile' });
      F('scaleSeen', true);
    }
    met('dawsanda');
    await D.say('dawsanda', L.dsScale, { face: 'think' });
  }
  async function porters() {
    if (F('ch8Done')) return sayAs(NAMES.porter, L.ptAfter8);
    const i = (F('ptN') || 0) % L.pt.length;
    F('ptN', i + 1);
    const line = L.pt[i];
    await sayAs(NAMES.porter, [line]);
    F(`heard.${line.rumour}`, true);
    const checked = line.rumour === 'grudge' ? (save.bag['proof:grudge'] || 0) > 0 : line.rumour === 'cheat' ? (save.bag['proof:cane'] || 0) > 0 : false;
    if (checked) {
      call(game.audio, 'play', 'page');
      await D.say('maya', [L.proofSay[line.rumour]], { face: 'smile' });
      await sayAs(NAMES.porter, L.ptProof);
    }
  }

  // ---------------------------------------------------------------- 5.3 · the run (Little Jetty, `pole` on the raftRun water edge)
  async function thihaRaft() {
    if (F('ch8Done')) return D.say('kothiha', L.thAfter8, { face: 'happy' });
    if (F('wishes')) {
      if (!(F('note2') && F('note3'))) return D.say('kothiha', L.thWait, { face: 'shy' });
      return hRun();
    }
    if (F('rideSeen')) return D.say('kothiha', L.thWaitHome, { face: 'smile' });
    return ride();
  }
  function bubble(line) {
    const b = document.querySelector('.ak-pole .pl-bubble');
    if (!b) return;
    const w = b.querySelector('.pl-bw');
    if (w) w.innerHTML = '';
    bi(b.querySelector('p'), line);
    b.hidden = false;
  }
  function stepOnButton(ms) {
    return new Promise((resolve) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rc-skip d6-stepon';
      btn.style.cssText = 'top:auto;right:auto;left:50%;transform:translateX(-50%);bottom:calc(150px + env(safe-area-inset-bottom));z-index:61;font-size:15px;padding:9px 20px';
      btn.textContent = tr(L.stepOn);
      let done = false;
      const fin = (v) => { if (done) return; done = true; btn.remove(); resolve(v); };
      btn.addEventListener('click', (ev) => { ev.stopPropagation(); fin(true); });
      document.getElementById('game').appendChild(btn);
      setTimeout(() => fin(false), ms);
    });
  }
  async function ride() {
    const me = game.maya;
    call(me, 'emote', 'wave');
    await D.say('maya', L.wave, { face: 'happy' });
    await D.say('kothiha', L.th1, { face: 'happy', emote: 'wave' });
    const stopIds = ['firewood', 'fish', 'rice', 'big', 'end', 'duck', 'cane'];
    const stops = stopIds.map((id, i) => ({ id, at: 0.1 + i * 0.12, label: L.stopLabels[id] }));
    const lines = { ferry: L.thHum };
    for (const id of stopIds) lines[id] = L.hello;
    let k = 0;
    const r = await pole({
      title: L.rideTitle, hint: L.rideHint, route: 'raftRun', stops, ferryPasses: 0.42, current: 0.6, lines,
      onStop: async (st) => {
        await wait(1300);
        if (st.id === 'cane') {
          // he calls to the cutters and hands them their parcel; his eyes go to the water; two hard strokes
          bubble(L.caneSilent);
          if (!F('looked')) {
            await wait(900);
            if (await stepOnButton(4200)) await shedVisit();
          } else await wait(1600);
          return;
        }
        bubble(L.answers[k++ % L.answers.length]);
        if (st.id === 'big') { await wait(1500); bubble(L.thEast); await wait(1800); }
      },
    });
    if (r?.cancelled) return; // not yet: he waits at Little Jetty
    // W · what did I see, myself?
    await D.say('maya', [L.rideQ], { face: 'think' });
    for (;;) {
      const i = await D.choose(L.rideChoices);
      if (i === 1) break;
      await D.say('maya', L.rideWrong[i], { face: 'think' });
    }
    await D.say('maya', L.rideDone, { face: 'think' });
    F('ride', true);
    F('rideSeen', true);
    // his welcome is for anyone who rode the whole run (one way for all: but one)
    await D.say('kothiha', L.thHome, { face: 'smile' });
    const e = story.people.get('kothiha');
    if (e) {
      e.job = null;
      await Promise.race([story.walkPerson('kothiha', P.houseDoor.x + 0.3, P.houseDoor.z + 0.5, 1.6), wait(7000)]);
    }
    dirty = true;
  }

  // ---------------------------------------------------------------- 5.4 · inside U Bo Lay's cane shed (from the raft)
  async function shedVisit() {
    const wrap = document.querySelector('.act-wrap');
    if (wrap) wrap.style.visibility = 'hidden';
    const wasT = story.talking;
    story.talking = false;
    game.ui.cinema(false);
    try {
      const done = new Promise((r) => { shedDone = r; });
      // (out again at the foot of Daw Sanda's steps: the raft brings her back to Little Jetty)
      const ok = await story.enter('caneshed', { door: 'sandahouse', fast: true });
      if (ok) await Promise.race([done, wait(300000)]);
      if (story.inRoom === 'caneshed') await story.exit({ instant: true });
    } catch (e) { console.error('day6 shed', e); } finally {
      shedDone = null;
      story.talking = wasT;
      game.ui.cinema(wasT);
      if (wrap) wrap.style.visibility = '';
    }
  }
  async function caneLook(id) {
    const lk = L.looks[id];
    if (!lk) return;
    if (id === 'hands') call(story.people.get('ubolay')?.p, 'emote', 'shrug');
    await D.say('maya', [{ my: `(${L.heard.my}: ${lk.pencil.my})`, en: `(${L.heard.en}: ${lk.pencil.en})` }], { face: 'think' });
    call(game.audio, 'play', 'sparkle');
    await D.say('maya', [{ my: `(${L.seen.my}: ${lk.gold.my})`, en: `(${L.seen.en}: ${lk.gold.en})` }], { face: 'smile' });
    F(`look.${id}`, true);
    if (['rack', 'jar', 'tally', 'hands'].every((x) => F(`look.${x}`)) && !F('looked')) {
      await D.say('maya', L.lookedAll, { face: 'think' });
      F('looked', true);
      proof('cane');
      rumour('cheat');
    }
  }

  // ---------------------------------------------------------------- 5.5 / 5.6 · the talk and the four wishes (Daw Sanda's house)
  async function thihaHome() {
    if (!F('rideSeen')) return D.say('kothiha', L.thWaitHome, { face: 'smile' });
    if (!F('thTalk')) {
      if (story.talk.waiting(TALK_D6_THIHA.id)) return D.say('kothiha', L.thNotYet, { face: 'smile' });
      const r = await story.talk.run(TALK_D6_THIHA);
      if (r?.busy) return;
      if (r.played?.some((p) => p.id === 'cloud' && p.result === 'miss')) await D.say('maya', L.cloudMiss, { face: 'think' }); // a true page that doesn't fit him
      if (!r.won) { await D.say('kothiha', L.thNotYet, { face: 'smile' }); return; }
      F('thTalk', true);
      proof('grudge'); // seen: no heat
      rumour('grudge');
    }
    if (!F('wishes')) return wishes();
    return D.say('kothiha', L.thWait, { face: 'shy' });
  }
  async function wishes() {
    // four scraps torn off a ledger sheet; his mother's rolled mat under the window, where she says her four
    await D.say('kothiha', [L.thC[0]], { face: 'think' });
    await D.say('kothiha', [L.thC[1]], { face: 'smile' });
    await showSlip(game, L.notes[0], { title: L.noteTitle(0) });
    await showSlip(game, L.notes[1], { title: L.noteTitle(1) });
    await showSlip(game, L.notes[2], { title: L.noteTitle(2) });
    await D.say('kothiha', [L.thC[2]], { face: 'shy' });
    await showSlip(game, L.notes[3], { title: L.noteTitle(3) });
    await D.say('kothiha', [L.thC[3]], { face: 'think' });
    F('wishes', true); // notes 2 and 3 ride with Maya (Maung Nge, then Daw Sanda; in order); 4 goes into his shirt pocket
    dirty = true;
    // down the steps together: note 1 pinned to his pole by the door; he waits on the raft at Little Jetty
    await wait(300);
    story.talking = false;
    game.ui.cinema(false);
    if (story.inRoom === 'sandahouse') await story.exit();
  }

  // ---------------------------------------------------------------- 5.7 · H at Cane Jetty: the ground, not the bowed head
  async function hRun() {
    await D.say('kothiha', L.thBack, { face: 'smile' });
    const th = story.people.get('kothiha'), ub = story.people.get('ubolay');
    const home = { raft: S.raft.root.position.clone(), pole: S.pole.root.position.clone(), th: th ? th.p.root.position.clone() : null };
    const toCane = () => {
      S.raft.root.position.set(P.raftCane.x, -0.22, P.raftCane.z);
      S.raft.root.rotation.y = P.raftCane.h;
      S.pole.root.position.set(P.raftCane.x, 0, P.raftCane.z + 1.2);
      if (th) { th.p.root.position.set(P.raftCane.x + 0.2, 0, P.raftCane.z - 0.2); th.p.root.rotation.y = 0.5; th.ob.x = P.raftCane.x; th.ob.z = P.raftCane.z; }
      game.rig.shot(new THREE.Vector3(P.post.x - 5.2, 2.5, P.post.z - 4.6), new THREE.Vector3(P.post.x + 0.2, 0.75, P.post.z - 0.7), 0.001);
    };
    const back = () => {
      S.raft.root.position.copy(home.raft);
      S.raft.root.rotation.y = 0;
      S.pole.root.position.copy(home.pole);
      if (th && home.th) { th.p.root.position.copy(home.th); th.ob.x = home.th.x; th.ob.z = home.th.z; }
      game.rig.release();
    };
    await game.ui.irisClose?.();
    toCane();
    await game.ui.irisOpen?.();
    try {
      await D.say('maya', L.hInto, { face: 'smile' });
      if (!F('looked')) {
        const i = await D.choose(L.shedOffer);
        if (i === 1) {
          await shedVisit();
          game.ui.cinema(true);
          await game.ui.irisClose?.();
          toCane();
          await game.ui.irisOpen?.();
        }
      }
      for (;;) {
        const r = await steady({ title: L.steadyTitle, hint: L.steadyHint, kind: 'stance', length: 0, loosen: true, who: 'kothiha', gusts: L.gustsH, react: L.steadyReact });
        if (r?.ok) break;
        if (r?.cancelled) { await game.ui.irisClose?.(); back(); await game.ui.irisOpen?.(); return; } // not yet: no cost, the run waits
      }
      F('steady', true);
      // the same words as to everyone: no bow, no "sorry"
      if (th) { th.p.root.rotation.y = Math.atan2(P.post.x - th.p.root.position.x, P.post.z - th.p.root.position.z); call(th.p, 'emote', 'wave'); }
      await D.say('kothiha', L.thHello, { face: 'happy' });
      await wait(500);
      call(ub?.p, 'emote', 'nod'); // U Bo Lay looks up. One nod. Not a word.
      await wait(1400);
      await D.say('kothiha', L.thAfter, { face: 'smile' });
      await D.say('maya', L.mayaAfter, { face: 'think' });
      F('ch8Done', true);
      if (!F('thTalk')) proof('grudge');
      rumour('grudge');
      // nothing is given, by anyone; no reward sound
      await game.ui.irisClose?.();
      back();
      await game.ui.irisOpen?.();
    } catch (e) {
      console.error('day6 H', e);
      back();
    }
  }

  // ---------------------------------------------------------------- 6.3 / 6.4 · slates 1 and 3 (tea shop)
  async function kophyoTalk() {
    if (!F('gust')) return D.say('kophyo', L.kpDefault, { face: 'smile' });
    if (!F('clueKp')) { await D.say('kophyo', L.clueKophyo, { face: 'think' }); F('clueKp', true); }
    if (following() && !F('slate1') && story.people.get('naychi')) return slate1();
    return D.say('kophyo', F('slate1') ? L.kpAfter1 : L.kpDefault, { face: 'smile' });
  }
  async function slate1() {
    await D.say('kophyo', L.kpHook, { face: 'smile' });
    call(game.audio, 'play', 'chalk');
    await D.say('kophyo', L.kpCup, { face: 'happy' }); // ch 6's result: he pours for nothing
    place('naychi', 'cupStart');
    await D.say('naychi', L.ncCupQ, { face: 'worried' });
    for (;;) {
      const r = await steady({ title: L.cupTitle, hint: L.cupHint, kind: 'cup', length: 6, sway: 0.15, spillAt: 0.7, loosen: true, who: 'naychi', gusts: L.gustsCup, react: { spill: L.cupSpill } });
      if (r?.ok) break;
      if (r?.cancelled) { place('naychi', 'bench'); return; }
    }
    place('naychi', 'bench');
    await D.say('naychi', L.ncCupDone, { face: 'happy' });
    await D.say('maya', L.mayaCup, { face: 'think' });
    doneSlate(1);
  }
  async function slate3() {
    if (!F('gust') || F('slate3') || !following() || !story.people.get('naychi')) return D.say('maya', L.basketEmpty, { face: 'smile' });
    await D.say('maya', L.kpFind, { face: 'surprised' });
    story.room?.set?.('slate3', false);
    await D.say('kophyo', L.kpHabit, { face: 'think' });
    await D.say('naychi', L.ncHabitQ, { face: 'think' });
    for (;;) {
      const i = await D.choose(L.habitChoices);
      if (i === 2) break;
      await D.say('naychi', L.ncLean, { face: 'worried' });
      await D.say('maya', L.mayaLean, { face: 'think' });
    }
    await D.say('naychi', L.ncOwn, { face: 'happy' });
    F('habit', true); // Day 7 morning: one line, no streak
    doneSlate(3);
  }

  // ---------------------------------------------------------------- 6.5 · slate 5 (letter counter, inside the Market post office)
  async function khwarnyoTalk() {
    if (looks5) return seenLook('khwarnyo');
    if (!F('gust')) return D.say('khwarnyo', L.kwBefore, { face: 'think' });
    if (!F('clueKw')) { await D.say('khwarnyo', L.clueKhwarnyo, { face: 'shy' }); F('clueKw', true); return; }
    return D.say('khwarnyo', L.kwDefault, { face: 'smile' });
  }
  async function heapTap() {
    if (!F('gust') || F('slate5') || !following() || !story.people.get('naychi')) return D.say('maya', L.luaye, { face: 'smile' });
    if (looks5) return D.say('maya', L.mayaSeen, { face: 'smile' });
    await D.say('maya', L.heapFind, { face: 'surprised' });
    story.room?.set?.('stamps', false);
    await D.say('naychi', L.ncSeen, { face: 'worried' });
    await D.say('maya', L.mayaSeen, { face: 'smile' });
    looks5 = new Set();
  }
  async function seenLook(who) {
    if (!looks5 || looks5.has(who)) return;
    looks5.add(who);
    call(game.audio, 'play', 'sparkle');
    await D.say('naychi', [L.seen[who]], { face: 'think' });
    if (looks5.size >= 3) {
      looks5 = null;
      await D.say('naychi', L.ncSeenDone, { face: 'happy' });
      doneSlate(5);
    }
  }

  // ---------------------------------------------------------------- 6.6 · slate 2 (the rope rack, inside the weigh-house)
  async function slate2() {
    if (!F('gust') || F('slate2') || !following() || !story.people.get('naychi')) return D.say('maya', [{ my: '(ကြိုးခွေတွေ။)', en: '(Coils of rope.)' }], { face: 'smile' });
    await D.say('maya', L.ropeFind, { face: 'surprised' });
    for (const o of indoor.props) if (o.d6slate2) o.root.visible = false;
    place('naychi', 'naychi');
    await D.say('naychi', L.ncWindQ, { face: 'worried' });
    for (;;) {
      const r = await steady({ title: L.rockTitle, hint: L.rockHint, kind: 'stance', length: 0, loosen: true, seated: true, who: 'naychi', gusts: L.gustsRock, react: L.rockReact });
      if (r?.ok) break;
      if (r?.cancelled) return;
    }
    await D.say('naychi', L.ncWindDone, { face: 'happy' });
    doneSlate(2);
  }

  // ---------------------------------------------------------------- 6.7 · slate 4 (Maung Nge's cart; her own mistake)
  const PARCELS = {
    start: [{ picture: 'rice' }, { picture: 'letter' }, { picture: 'book' }, { picture: 'duck', label: true }, { picture: 'duck', label: true }, { picture: 'duck', label: true }, { picture: 'fish', label: true }, { picture: 'fish', label: true }],
    wrong: [{ picture: 'rice' }, { picture: 'letter' }, { picture: 'book' }, { picture: 'duck', label: true }, { picture: 'fish', label: true }, { picture: 'duck', label: true }, { picture: 'fish', label: true }],
    fixed: [{ picture: 'rice' }, { picture: 'letter' }, { picture: 'book' }, { picture: 'duck', label: true }, { picture: 'duck', label: true }, { picture: 'duck', label: true }, { picture: 'fish', label: true }],
  };
  const cartState = () => (F('slate4') ? 'fixed' : F('s4got') ? 'wrong' : 'start');
  let cartShown = null;
  function refreshCart() { const k = cartState(); if (k !== cartShown) { cartShown = k; S.cart.setParcels?.(PARCELS[k]); } }
  async function maungngeTalk() {
    if (F('wishes') && !F('note2')) { call(game.audio, 'play', 'page'); await D.say('maungnge', L.mnNote, { face: 'happy' }); F('note2', true); return; }
    if (F('s4lost') && !F('s4look') && !F('slate4')) return s4Lost();
    if (F('slate4') && !F('mnAfter4')) { F('mnAfter4', true); return D.say('maungnge', L.mnAfter4, { face: 'smile' }); }
    if (F('gust') && !F('clueMn')) { await D.say('maungnge', L.clueMaungnge, { face: 'surprised' }); F('clueMn', true); return; }
    if (F('gust') && following() && !F('s4got') && story.people.get('naychi')) return s4Lift();
    if (F('ch8Done')) return D.say('maungnge', L.mnAfter8, { face: 'happy' });
    const i = (F('mnN') || 0) % L.mn.length;
    F('mnN', i + 1);
    return D.say('maungnge', [L.mn[i]], { face: 'smile' });
  }
  async function cartTap() {
    if (F('gust') && following() && !F('s4got') && story.people.get('naychi')) return s4Lift();
    return D.say('maya', [{ my: '(ဘဲဆိပ် စင်၊ ငါးဆိပ် စင်။ တံဆိပ်တိုင်းမှာ စာနဲ့ ပုံ။)', en: '(A Duck shelf and a Fish shelf. Every tag has a word and a picture.)' }], { face: 'smile' }); // (added)
  }
  async function s4Lift() {
    await D.say('maya', L.cartLift, { face: 'smile' });
    call(game.audio, 'play', 'thud');
    F('s4got', true);
    refreshSlates();
    refreshCart();
    if (story.people.get('maungnge')) {
      await D.say('maungnge', L.mnRound, { face: 'smile' });
      F('mnAway', true);
      T.mnAway = clock;
      const e = story.people.get('maungnge');
      e.job = null;
      story.walkPerson('maungnge', P.mn.x - 1.5, P.mn.z + 14, 1.4).then(() => { dirty = true; });
    }
  }
  async function s4Lost() {
    await D.say('maungnge', L.mnLost, { face: 'worried' });
    await D.say('naychi', L.ncLook, { face: 'think' });
    F('s4look', true); // L: tap the parcels on both shelves (no outline); each tap shows its tag
  }
  async function parcelTap(i) {
    if (!F('s4look') || F('s4carry')) return;
    const lower = i >= 3 && i <= 5;
    const fish = PARCELS.wrong[i]?.picture === 'fish';
    const tag = fish ? L.tagFish : L.tagDuck;
    const shelf = lower ? L.shelfDuck : L.shelfFish;
    call(game.audio, 'play', 'click');
    await D.say('naychi', [{ my: `${tag.my} · ${shelf.my}`, en: `${tag.en} · ${shelf.en}` }], { face: 'think' });
    if (!(fish && lower)) return;
    await D.say('naychi', L.ncFound, { face: 'sad' });
    // W · her sorry: her words, the player picks which line is hers
    await D.say('maya', [L.sorryQ], { face: 'think' });
    for (;;) {
      const k = await D.choose(L.sorryChoices);
      await D.say('naychi', [L.sorryChoices[k]], { face: k === 1 ? 'worried' : 'shy' });
      if (k === 1) break;
      await D.say('maungnge', L.sorryWrong[k], { face: 'think' });
    }
    // C · she carries it along the quay to Fish Jetty herself
    F('s4carry', true);
    carryParcel(true);
    const e = story.people.get('naychi');
    if (e) {
      e.ctl = null;
      story.walkPerson('naychi', P.fishWoman.x - 1.1, P.fishWoman.z + 0.15, 1.25).then(() => { F('s4there', true); });
    }
  }
  let parcelMesh = null;
  function carryParcel(on) {
    const e = story.people.get('naychi');
    if (parcelMesh) { parcelMesh.parent?.remove(parcelMesh); parcelMesh.geometry.dispose(); parcelMesh = null; }
    if (!on || !e) return;
    parcelMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.24), new THREE.MeshLambertMaterial({ color: '#B98A5A' }));
    parcelMesh.position.set(0, 0.95, 0.28);
    e.p.root.add(parcelMesh);
  }
  async function s4Deliver() {
    await sayAs(NAMES.fishwoman, L.fishThanks, { face: 'smile' });
    carryParcel(false);
    doneSlate(4);
    refreshCart();
    const e = story.people.get('naychi');
    if (e && following()) e.ctl = followCtl(e);
  }

  // ---------------------------------------------------------------- 6.8 · evening (wherever she is)
  function eveningDue() { return following() && !(F('s4carry') && !F('slate4')) && (F('ch8Done') || slatesDone() >= 3); }
  async function evening() {
    const n = slatesDone();
    await D.say('naychi', n ? L.ncEve : [L.ncEve0, L.ncEve[1]], { face: 'smile' });
    await D.say('maya', L.mayaEve, { face: 'smile' }); // Act 1: Maya says yes (Day 8 turns on this)
    await D.say('maya', L.mayaPencil, { face: 'think' });
    F('ncEvening', true);
    F('readToHer', true);
    await D.say('naychi', L.ncHome, { face: 'happy' });
    // she goes home: a few steps away, then off the page
    const e = story.people.get('naychi');
    if (e && !story.inRoom) {
      e.ctl = null;
      ncMode = 'leaving';
      const m = mayaXZ();
      Promise.race([story.walkPerson('naychi', m.x - 7, m.z + 6, 1.4), wait(9000)]).then(() => { if (story.people.get('naychi') === e) story.remove('naychi'); ncMode = null; });
    } else dirty = true;
  }

  // ---------------------------------------------------------------- 9 · the night page (Writing Room)
  async function night() {
    if (nightBusy) return;
    nightBusy = true;
    try {
      const choices = L.nightChoices.slice();
      if (!slatesDone()) choices[1] = L.nightTrue0;
      const who = MET.filter((id) => F(`met.${id}`));
      if (!who.length) who.push('kothiha');
      await nightPage(story, {
        day: 6,
        truth: { q: L.nightQ, choices, right: 1, wrong: L.nightWrong },
        before: async () => { await D.say('maya', L.strike, { face: 'think' }); story.lookalikeGone('ignore'); },
        sleep: { q: L.sleepQ, who },
        stamps: [8],
        stampText: L.stampText, extra: L.page11, tomorrow: L.tomorrow,
        turn: false,
      });
      // the reply letter: the notebook's back page, in pencil, under Day 2's line (crossed out by her hand, Day 8)
      F('reply', true);
      await showSlip(game, L.reply, { title: L.replyTitle });
      await story.turnPage();
    } catch (e) {
      console.error('day6 night', e);
      nightBusy = false;
    }
  }
  const nightReady = () => F('ch8Done') && F('ncAsked') && !F('done');

  // ---------------------------------------------------------------- props tapped outdoors (the prop itself; no outline, no ring)
  if (S.board) taps.add({ id: 'board', at: story.board.target, stand: story.board.stand, fn: () => run(boardTap) });
  taps.add({ id: 'bridge', at: { x: P.bridgeBoard.x, y: 1.4, z: P.bridgeBoard.z }, stand: P.bridgeStand, px: 70, fn: () => run(bridgeTap) });
  taps.add({ id: 'awning', when: () => S.awningSlate.root.visible, at: () => S.awningSlate.root.getWorldPosition(new THREE.Vector3()), stand: () => ({ x: S.awningSlate.root.position.x, z: S.awningSlate.root.position.z + 1.3 }), fn: () => run(() => D.say('maya', L.awningSlate, { face: 'think' })) });
  taps.add({ id: 'cart', when: () => !F('s4look') || F('s4carry'), at: { x: P.cart.x, y: 0.8, z: P.cart.z }, stand: { x: P.cart.x + 0.3, z: P.cart.z + 1.25 }, fn: () => run(cartTap) });
  for (let i = 3; i <= 6; i++) {
    taps.add({ id: `parcel${i}`, px: 26, when: () => F('s4look') && !F('s4carry'), at: () => { const a = S.cart.parcelAnchors?.[i]; return a ? a.getWorldPosition(new THREE.Vector3()) : null; }, stand: { x: P.cart.x + 0.3, z: P.cart.z + 1.25 }, fn: () => run(() => parcelTap(i)) });
  }
  taps.add({ id: 'fishwoman', at: { x: P.fishWoman.x, y: 1.2, z: P.fishWoman.z }, stand: { x: P.fishWoman.x - 1.1, z: P.fishWoman.z + 0.15 }, fn: () => run(() => (F('s4there') && !F('slate4') ? s4Deliver() : sayAs(NAMES.fishwoman, L.fishDefault))) });
  taps.add({ id: 'ferry', range: 26, at: { x: P.ferry.x, y: 1.4, z: P.ferry.z + 0.9 }, stand: { x: 90.5, z: 431.5 }, px: 60, fn: () => run(() => sayAs(NAMES.ferryman, L.ferryman)) });
  taps.add({ id: 'sandbar', range: 30, noWalk: true, at: { x: P.shed.x, y: 1.2, z: P.shed.z }, px: 70, fn: () => run(() => D.say('maya', L.shedSeen, { face: 'think' })) });
  taps.add({ id: 'lj', when: () => !F('raftBack'), at: { x: P.lj.x, y: 0.3, z: P.lj.z }, stand: { x: P.lj.x - 0.3, z: P.lj.z }, fn: () => run(() => D.say('maya', L.littleJetty, { face: 'think' })) });

  // ---------------------------------------------------------------- rooms: who is inside, what is tapped (INDEX 13.2 spots)
  function addStation(room, s) {
    if (!Array.isArray(room?.stations)) return;
    room.stations.push({ r: 0.8, marker: { visible: false, userData: { update() {} } }, d6: true, ...s });
  }
  function dropIndoor(room) {
    if (Array.isArray(room?.stations)) for (let i = room.stations.length - 1; i >= 0; i--) if (room.stations[i].d6) room.stations.splice(i, 1);
    for (const p of indoor.walkons) { p.root.parent?.remove(p.root); p.dispose?.(); }
    for (const o of indoor.props) { o.root.parent?.remove(o.root); o.dispose?.(); }
    indoor.walkons.length = 0;
    indoor.props.length = 0;
  }
  async function roomWalkOns(id, room) {
    const parent = room.scene || room.group;
    const spots = room.spots || {};
    if (!parent) return;
    if (id === 'teashop') {
      // packed at noon: every low table full (A, B; C is Ko Phyo's own corner)
      if (!indoor.seat) { try { indoor.seat = (await import('./rooms/market.js')).seatPerson; } catch { indoor.seat = null; } }
      [['yaungA', 'drinker1'], ['seatA2', 'drinker2'], ['drinkerB1', 'drinker3'], ['drinkerB2', 'drinker4']].forEach(([sp, lk]) => {
        const s = spots[sp];
        if (!s) return;
        const p = walkOn(LOOKS[lk], { x: s.x, z: s.z, h: s.h }, parent);
        p.seatY = s.seat ?? s.sit ?? 0.27;
        indoor.walkons.push(p);
      });
    }
    if (id === 'marketpost') {
      const a = spots.queue2 || { x: 0.8, z: -0.6, h: PI }, b = spots.queue3 || { x: 1.0, z: 0.2, h: PI };
      const sw = walkOn(LOOKS.stampwoman, { x: a.x, z: a.z, h: a.h }, parent);
      const pt = walkOn(LOOKS.porter, { x: b.x + 0.4, z: b.z, h: -PI / 2 }, parent);
      indoor.walkons.push(sw, pt);
      addStation(room, { id: 'd6stamp', x: a.x + 0.9, z: a.z + 0.2, look: { x: a.x, z: a.z }, at: { x: a.x, y: 1.0, z: a.z } });
      addStation(room, { id: 'd6porter', x: b.x + 1.3, z: b.z + 0.5, look: { x: b.x + 0.4, z: b.z }, at: { x: b.x + 0.4, y: 1.0, z: b.z } });
      addStation(room, { id: 'd6heap', x: 0.4, z: -1.45, look: { x: 0.4, z: -2.3 }, at: { x: 0.4, y: 1.1, z: -2.3 } });
    }
    if (id === 'weighhouse') {
      addStation(room, { id: 'd6porters', x: -2.6, z: -1.2, look: { x: -3.48, z: -1.2 }, at: { x: -3.48, y: 1.0, z: -1.2 } });
      const sp = spots.slate2;
      if (sp && F('gust') && !F('slate2')) {
        const s = chalkSlate({ w: 0.3, h: 0.22, text: '', lean: 0.2 });
        s.root.position.set(sp.x + 0.05, sp.y ?? 1.25, sp.z);
        s.root.rotation.y = sp.h ?? PI / 2;
        s.d6slate2 = true;
        parent.add(s.root);
        indoor.props.push(s);
      }
    }
  }
  const STATIONS = {
    weighhouse: { scale: scaleMoment, ropes: slate2, d6porters: porters },
    caneshed: { rack: () => caneLook('rack'), jar: () => caneLook('jar'), tally: () => caneLook('tally'), hands: () => caneLook('hands') },
    teashop: { teaBasket: slate3 },
    marketpost: { d6heap: heapTap, pigeonholes: heapTap, d6stamp: () => (looks5 ? seenLook('stampwoman') : sayAs(NAMES.stampwoman, [{ my: '…တစ်၊ နှစ်၊ သုံး…', en: '…one, two, three…' }])), d6porter: () => (looks5 ? seenLook('porter') : sayAs(NAMES.porter, [{ my: 'ထမင်းစားချိန် မရောက်သေးဘူးလား။', en: "Isn't it lunchtime yet?" }])) },
  };

  // ---------------------------------------------------------------- the page's hooks
  const day = {
    talk,
    roomOpts() { return {}; },
    roomCast(id) {
      const nc = following() && !(F('s4carry') && !F('slate4'));
      switch (id) {
        case 'sortingroom': return F('ncAsked') ? [] : [{ id: 'naychi', spot: 'naychiBench' }];
        case 'weighhouse': return [
          { id: 'dawsanda', spot: 'dawsanda' }, { id: 'porterA', spot: 'porter1' }, { id: 'porterB', spot: 'porter2' }, { id: 'clerk', spot: 'clerk' },
          ...(F('scaleSeen') ? [] : [{ id: 'merchant', spot: 'merchant' }, { id: 'child', spot: 'child' }]),
          ...(nc ? [{ id: 'naychi', spot: 'naychi' }] : []),
        ];
        case 'sandahouse': return F('rideSeen') && !F('wishes') ? [{ id: 'kothiha', spot: 'kothiha' }] : []; // Nay Chi waits on the steps: a talk is between two
        case 'caneshed': return [{ id: 'ubolay', spot: 'ubolay' }, { id: 'cutterA', spot: 'cutter1' }, { id: 'cutterB', spot: 'cutter2' }];
        case 'teashop': return [{ id: 'kophyo', spot: 'kophyoHearth' }, { id: 'tintin', spot: 'tintin' }, ...(nc ? [{ id: 'naychi', spot: 'bench' }] : [])];
        case 'marketpost': return [{ id: 'luaye', spot: 'luaye' }, { id: 'khwarnyo', spot: 'writeTable' }, ...(nc ? [{ id: 'naychi', spot: 'mayaBench' }] : [])];
        default: return undefined;
      }
    },
    async enterRoom(id, room) {
      if (story.doors?.roomCam) story.doors.roomCam(); else game.rig.setFollow(ROOM_CAM); // doors.js's shared close, low room camera
      if (id === 'about') { if (nightReady()) night(); return; }
      if (gustDue != null && !gustWarned && !F('gust')) { gustWarned = true; call(game.audio, 'play', 'door'); const k = [...story.people.keys()][0]; story.bark(k || 'maya', L.windUp, 2600); }
      try { await roomWalkOns(id, room); } catch (e) { console.error('day6 room walk-ons', e); }
      if (id === 'teashop') room.set?.('slate3', !!F('gust') && !F('slate3'));
      if (id === 'marketpost') room.set?.('stamps', !!F('gust') && !F('slate5'));
      if (id === 'caneshed' && !F('ch8Done')) setTimeout(() => { if (story.inRoom === 'caneshed') story.bark('ubolay', L.ucs[0], 3000); }, 900);
      // the one waiting for her starts by themselves when she comes in
      const auto = id === 'sortingroom' && !F('ncAsked') ? 'naychi' : id === 'sandahouse' && F('rideSeen') && !F('wishes') ? 'kothiha' : null;
      if (auto) setTimeout(() => { const e = story.people.get(auto); if (e && story.inRoom === id && !story.talking) story.talkTo(e); }, 1100);
    },
    leaveRoom(id, room) {
      dropIndoor(room);
      looks5 = null;
      if (id === 'caneshed' && shedDone) shedDone();
      dirty = true;
    },
    station(id, ctx) {
      const fn = STATIONS[ctx?.room]?.[id];
      if (!fn) return false;
      run(fn);
      return true;
    },
    dispose() {
      taps.dispose();
      set.dispose();
      for (const f of flys) { f.g.root.parent?.remove(f.g.root); f.g.dispose?.(); }
      flys.length = 0;
      carryParcel(false);
      for (const id of ['wintwar', 'naychi', 'maungnge', 'kothiha', 'ubolay', 'kolwin']) story.remove(id);
      document.querySelectorAll('.d6-stepon').forEach((b) => b.remove());
      if (window.__day6 === hooks) delete window.__day6;
    },
    async start() {
      sync();
      refreshCart();
      if (!F('morning')) {
        if (story.inRoom) await story.exit({ instant: true });
        if (!story.foot.active) await story.foot.toFoot();
        story.refreshHud?.();
        const m = mayaXZ();
        if (Math.hypot(m.x - P.about.x, m.z - (P.about.z + 1.4)) > 5) story.openWorld?.jump?.(P.about.x + 0.6, P.about.z + 1.5, 0);
        await wait(400);
        await story.talkTo(story.people.get('wintwar'));
      }
    },
    update(dt, t) {
      clock += dt;
      set.update(dt, t);
      for (const f of flys) { f.g.update(dt); f.t += dt; }
      for (let i = flys.length - 1; i >= 0; i--) if (flys[i].t > 9) { flys[i].g.root.parent?.remove(flys[i].g.root); flys[i].g.dispose?.(); flys.splice(i, 1); }
      if (story.inRoom) {
        for (const p of indoor.walkons) { p.update(dt, { speed: 0 }); if (p.seatY && indoor.seat) indoor.seat(p, p.seatY); }
      }
      if (dirty && !story.inRoom && !story.talking) sync();
      // session timers
      if (F('dsMet') && !F('raftBack')) { if (T.dsMet == null) T.dsMet = clock; if (clock - T.dsMet > 55) { F('raftBack', true); dirty = true; } }
      if (F('ncAsked') && !F('ncHung')) {
        if (T.asked == null) T.asked = clock;
        const m = mayaXZ();
        if (clock - T.asked > 90 || (!story.inRoom && Math.hypot(m.x - P.bridgeBoard.x, m.z - P.bridgeBoard.z) < 14)) { F('ncHung', true); T.hung = clock; refreshSlates(); }
      }
      if (F('mnAway') && !F('mnBack')) { if (T.mnAway == null) T.mnAway = clock; if (clock - T.mnAway > 40) { F('mnBack', true); F('s4lost', true); dirty = true; } }
      if (!story.inRoom) {
        const m = mayaXZ();
        if (F('ncAsked') && m.z > 30) F('leftHome', true);
        // the noon wind: her first arrival at the Wharf or the tea-shop street after the slates are hung
        if (F('ncHung') && !F('gust') && !story.talking) {
          const z = inZone(P.wharfZone, m.x, m.z) || inZone(P.teaZone, m.x, m.z);
          if (zoneWas === null) zoneWas = z;
          if (z && !zoneWas && gustDue == null) gustDue = clock + 3;
          if (z && zoneWas && gustDue == null && T.hung != null) gustDue = T.hung + 30;
          if (z && zoneWas && gustDue == null) gustDue = clock + 30;
          zoneWas = z;
          if (gustDue != null && clock >= gustDue && !story.talking && !game.busy && story.foot.active && game.mode === 'world') gust();
        }
        // Maung Nge back from his round, worried: he finds her at the cart
        if (F('s4lost') && !F('s4look') && !story.talking && !game.busy && story.foot.active) {
          const e = story.people.get('maungnge');
          if (e && !e.walking && Math.hypot(m.x - e.p.root.position.x, m.z - e.p.root.position.z) < 7) story.talkTo(e);
        }
        // the parcel reached Fish Jetty and Maya is there too
        if (F('s4there') && !F('slate4') && !story.talking && !game.busy && Math.hypot(m.x - P.fishWoman.x, m.z - P.fishWoman.z) < 6) run(s4Deliver);
        // evening: Nay Chi, wherever she is
        if (eveningDue() && !story.talking && !game.busy && story.foot.active && clock - eveTried > 8) {
          const e = story.people.get('naychi');
          if (e && !e.walking) { eveTried = clock; story.talkTo(e); }
        }
        // night page: back at the Writing Room door
        if (nightReady() && !story.talking && !game.busy) {
          const p = story.foot.active ? story.foot.pos : null;
          const near = p ? Math.hypot(p.x - P.about.x, p.y - P.about.z) < 1.8 : Math.hypot(game.car.root.position.x - P.about.x, game.car.root.position.z - (P.about.z + 3)) < 2.2;
          if (near) night();
        }
      }
    },
  };

  // ---------------------------------------------------------------- test hooks (headless tests and the tester)
  const BEATS = ['morning', 'asked', 'hung', 'gust', 'dsMet', 'raft', 'ride', 'looked', 'talk', 'wishes', 'notes', 'h', 'slates', 'evening', 'night'];
  const BEAT_FLAGS = {
    morning: ['morning'], asked: ['ncAsked'], hung: ['ncHung'], gust: ['gust', 'rumour.wind', 'clueKp', 'clueKw', 'clueMn'], dsMet: ['dsMet', 'dsOrder'], raft: ['raftBack'],
    ride: ['ride', 'rideSeen'], looked: ['look.rack', 'look.jar', 'look.tally', 'look.hands', 'looked', 'rumour.cheat'], talk: ['thTalk', 'rumour.grudge'],
    wishes: ['wishes'], notes: ['note2', 'note3'], h: ['steady', 'ch8Done'], slates: ['slate1', 'slate2', 'slate3', 'slate4', 'slate5', 'habit', 's4got'], evening: ['ncEvening', 'readToHer'], night: [],
  };
  const hooks = {
    F, L, set, P, BEATS,
    /** Jump the day forward: every beat up to and including `beat` counts as done (flags only; people re-placed). */
    skipTo(beat) {
      const k = BEATS.indexOf(beat);
      if (k < 0) return BEATS;
      for (let i = 0; i <= k; i++) for (const f of BEAT_FLAGS[BEATS[i]]) F(f, true);
      if (k >= BEATS.indexOf('gust')) { proof('wind'); story.flag('rumour.wind', 'checked'); }
      if (k >= BEATS.indexOf('looked')) { proof('cane'); story.flag('rumour.cheat', 'checked'); }
      if (k >= BEATS.indexOf('talk')) { proof('grudge'); story.flag('rumour.grudge', 'checked'); }
      if (k >= BEATS.indexOf('slates')) F('slates', 5);
      for (const id of MET) F(`met.${id}`, true);
      if (beat === 'night') story.openWorld?.jump?.(P.about.x, P.about.z + 2.6, PI);
      dirty = true;
      return this.state();
    },
    state() {
      return { inRoom: story.inRoom, clock: +clock.toFixed(1), gustDue, ncMode, slates: slatesDone(),
        flags: Object.fromEntries(Object.entries(save.flags).filter(([k2]) => k2.startsWith('d6.'))),
        people: [...story.people.keys()] };
    },
    gust: () => gust(),
    night: () => night(),
    enter: (id) => story.enter(id),
  };
  window.__day6 = hooks;
  return day;
}
