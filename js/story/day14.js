// Day 14 (everywhere, by ribbon; the Back Cover opens) — chapter 23, ကိုးကား (References).
//
// Lesson (p110; the game's reading, INDEX 14): say whose words you carry. Maya's own last page is the model:
// a page of other people's lines, each with a name, does not make the book less hers.
//
// The day (day14-spec.md; INDEX 13.2 layouts and INDEX 9 flags win over it):
//   morning post at the Writing Room door (Day 13's slept13 line, Ei Mon's letter inks ✓ ၂၁, the Touch-me-not
//   and the Clear Glasses lift off, the `map` rumour) → the "ask Maya" board on the Post Office wall holds ONE
//   note, Toe Toe's → the invitations in the Template Shop (room `templates`) → Pho Thar at his windmill table →
//   the Quarter: the children at the notice board (rumour `essay`), Toe Toe in the classroom (room `classroom`):
//   essay read, three choices, the talk (his two stones: Step back), Maya steps OUT while he writes (bean box),
//   his list, he hands out the Quarter's invitations himself → any order: the Market (W in Daw Tin Tin's tea
//   shop, room `teashop`), the Wharf (the raft ride, `pole` passenger mode, U Bo Lay invited), the Junction
//   (room `press`: S `match`, the printing, Nay Chi decides for herself) → the drive with the booklets as cargo
//   (no page-turns) through Hearth Row (room `bakery`; Ei Mon at the kerb) and the Diary Garden (the open gate)
//   to the Blank Page (room `lodge`) → the road home → the Back Cover (Own Key, room `backcover`: desk, unload,
//   the reply with `ownwords`, the last line left blank) → the night page in the Writing Room (room `about`).
// No markers anywhere: every "where" is said by a person, written on an envelope, or can be seen.
//
// Test hooks: window.__day14 = { skipTo(beat), beats, state(), L, world }  (see the end of create()).
// Burmese lines are drafts for Maya to proofread (day14-lines.js).
import * as THREE from '../game/three.js';
import { match } from './acts/match.js';
import { ownwords } from './acts/ownwords.js';
import { pole } from './acts/pole.js';
import { morningPost, nightPage, showLetter, showSlip, stampOverlay } from './post.js';
import { castById } from './cast.js';
import { createPerson } from './people.js';
import { bookletBundle } from './props6.js';
import { loadDay } from './days.js';
import { TALK_D14_TOETOE } from './talks/day14.js';
import { L, PROOFS, INVITES, SLEPT13, EM_NOTE, SLEPT14, SAYINGS_FALLBACK } from './day14-lines.js';
import { createDay14World, SPOTS, ZONES } from './day14-world.js';

/** Tonight's next-morning lines (Day 15 reads them), and this day's Sayings for later matches. */
export const SLEPT = SLEPT14;
export { SLEPT14 };

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// the close low follow camera indoors (as Days 3, 4, 9, 15), never the site's far whole-room view
const ROOM_CAM = { tilt: 30, width: 4.8, widthLandscape: 9.5, minHeight: 0, height: 0.9, stiffness: 5, bounds: null };
const DISTRICTS = ['home', 'quarter', 'market', 'wharf', 'junction', 'hearth', 'garden', 'blank'];
// a credited line without its signature and quotes (the slips end in ' — Name')
const bare = (s) => String(s || '').replace(/\s*—\s*[^—]*$/, '').replace(/^["“«]|["”»]$/g, '').trim();
const bareLine = (l) => ({ my: bare(l.my), en: bare(l.en) });

export async function create(story) {
  const { game, dialog: D, save } = story;
  const F = (k, v) => story.flag(`d14.${k}`, v);
  const W = createDay14World(story, { flags: { boardEmpty: () => !!F('boardEmpty') } });
  const mine = new Set(); // people this page spawned outdoors
  const stashed = new Map(); // id -> entry, so dispose() can find them while doors.js has them stashed
  const moved = new Set(); // ambient people (regions' PEOPLE) this page moved to today's spots
  const zonesOn = new Set();
  let bundleInRoom = null; // the booklet bundle carried into the Back Cover
  let newcomer = null; // the press newcomer (a walk-on, no cast id)
  let leftAt = 0; // when Maya stepped out of the classroom while Toe Toe wrote
  let roomT = 0; // seconds inside the classroom since the talk was won
  let pendingCar = false, pendingEm = false;
  let nightBusy = false, doorBusy = false;

  // ---- the roads this page needs open (they were opened on earlier days; a fresh test save may not have them)
  for (const g of ['bridgeOpen', 'backCover']) if (!story.flag(g)) call(story.openWorld, 'setFlagGate', g, true);
  // keepsakes Day 14 uses (given on Days 5 and 7; keep: true, never lost): defensively present
  for (const id of ['stampblock', 'ownkey', 'notebook']) if (!story.has(id)) story.give(id, 1, { quiet: true });

  // ---- cargo: while the booklets ride in the car, desks and map ribbons refuse the page-turn (spec 6.4)
  const prevBlocked = story.blockedTravel;
  const cargoOn = () => !!F('cargo') && !F('unloaded');
  story.blockedTravel = () => (cargoOn() ? L.cargoNo : prevBlocked?.());
  if (cargoOn() && !story.cargo.loaded) story.cargo.load('booklets', bookletBundle().root);
  else if (cargoOn() && story.cargo.loaded) { story.cargo.unload(); story.cargo.load('booklets', bookletBundle().root); } // re-seat after a reload

  // ---------------------------------------------------------------------------------------------
  // small helpers
  // ---------------------------------------------------------------------------------------------
  const lang = () => (document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'my');
  const metAdd = (id) => { const a = F('met') || []; if (!a.includes(id)) { a.push(id); F('met', a); } };
  const heard = (id) => F(`heard.${id}`, true);
  function proof(id) {
    if (F(`rumour.${id}`)) return;
    save.proofs[id] = PROOFS[id];
    story.give(`proof:${id}`);
    F(`rumour.${id}`, true);
    story.flag(`rumour.${id}`, 'checked');
  }
  function postmark() {
    if (story.has('stampblock')) story.use('stampblock', { label: L.postmarked });
    call(game.audio, 'play', 'thud');
  }
  async function run(fn) {
    if (story.talking) return;
    story.talking = true;
    try { await fn(); } catch (err) { console.error('day14', err); } finally { story.talking = false; game.ui.cinema(false); }
  }
  const walkOn = (x, z) => new Promise((res) => {
    if (!story.foot?.active) return res(false);
    let done = false;
    const fin = (ok) => { if (!done) { done = true; res(ok !== false); } };
    story.foot.walkTo(x, z, fin);
    setTimeout(() => fin(true), 9000);
  });

  // ---- Sayings (each day's `slept` table: what the house the notebook slept at wrote back)
  const SAYINGS = { 13: SLEPT13, 14: SLEPT14 };
  let sayingsLoaded = false;
  async function loadSayings() {
    if (sayingsLoaded) return SAYINGS;
    sayingsLoaded = true;
    const days = [...new Set(save.notebook.sleptAt.map((s) => s.day))].filter((d) => d >= 1 && d <= 13);
    for (const d of days) {
      try {
        const mod = await loadDay(d);
        const t = mod?.SLEPT || mod?.[`SLEPT${d}`];
        if (t && typeof t === 'object') SAYINGS[d] = { ...(SAYINGS[d] || {}), ...t };
      } catch { /* not written yet */ }
    }
    return SAYINGS;
  }
  /** The person's own Saying, if the notebook ever slept at their house (latest first). */
  function sayingOf(who) {
    for (const s of save.notebook.sleptAt.slice().reverse()) {
      if (s.who !== who) continue;
      const l = SAYINGS[s.day]?.[who];
      if (l) return bareLine(l);
    }
    return null;
  }
  function inviteText(district) {
    const I = INVITES[district];
    const line = sayingOf(I.who) || I.line;
    const name = castById(I.who)?.name || { my: I.who, en: I.who };
    const fill = (k) => L.invite[k].replace('{line}', line[k]).replace('{name}', name[k]);
    return { my: fill('my'), en: fill('en') };
  }
  /** Hand over one district's invitation: postmark (the stamp block), the card itself, the flag. */
  async function handover(district, { stamped = false } = {}) {
    if (F(`inv.${district}`)) return true;
    if (!story.has('invites')) { await D.say('maya', L.needInv, { face: 'think' }); return false; }
    await loadSayings();
    if (!stamped) postmark();
    story.take('invites', 1, { quiet: true });
    await showLetter(game, inviteText(district), { sign: L.mayaSign });
    F(`inv.${district}`, true);
    return true;
  }

  // ---- people out on the land: each district's people live while Maya is in it (spec 7, 12)
  const jobAt = (at, r = 1.6, mood = 'work') => ({ area: { x: at.x, z: at.z + 0.6, r }, spot: { x: at.x, z: at.z, h: at.h ?? 0 }, mood, workChance: 0.7, workFor: [6, 12] });
  const PEOPLE = {
    home: () => [['wintwar', F('morning') ? SPOTS.wwSorting : SPOTS.wwStart, F('morning') ? jobAt(SPOTS.wwSorting, 1.4, 'read') : null], ['phothar', SPOTS.phothar, jobAt(SPOTS.phothar, 1.2, 'play')], ['ukyaw', SPOTS.ukyaw, null]],
    quarter: () => [
      ['sunwe', SPOTS.sunwe, jobAt(SPOTS.sunwe, 1.0, 'read')], ['maungnge', SPOTS.maungnge, jobAt(SPOTS.maungnge, 1.0, 'play')],
      ['yeyint', SPOTS.yeyint, jobAt(SPOTS.yeyint, 1.6, 'work')],
      ...(F('ttNames') ? [['toetoe', SPOTS.toetoeOut, jobAt(SPOTS.toetoeOut, 2.0, 'play')]] : []),
    ],
    market: () => [['thiri', SPOTS.thiri, null]],
    wharf: () => [['kothiha', SPOTS.kothiha, jobAt(SPOTS.kothiha, 1.2, 'work')]],
    junction: () => [],
    hearth: () => [['maungarkar', SPOTS.arkar, null]],
    garden: () => [['hpohtaw', SPOTS.hpohtaw, null], ['kyinyein', SPOTS.kyinyein, jobAt(SPOTS.kyinyein, 1.0, 'work')]],
    blank: () => [],
  };
  // inside today (nobody is inside and outside at once): the street's copy of them goes
  const indoorOnly = () => ['hninwai', ...(F('ttNames') ? [] : ['toetoe'])];
  function put(id, at, job) {
    let e = story.people.get(id);
    if (!e) {
      e = story.spawn(id, { x: at.x, z: at.z, heading: at.h ?? 0 });
      if (!e) return null;
      mine.add(id);
      stashed.set(id, e);
    } else if (!mine.has(id) && !moved.has(id) && !e.indoor) {
      // a region's ambient person: today they stand where the day needs them
      moved.add(id);
      e.walking = null;
      e.p.root.position.set(at.x, 0, at.z);
      e.p.root.rotation.y = at.h ?? 0;
      e.ob.x = at.x; e.ob.z = at.z;
      e.home = { x: at.x, z: at.z, h: at.h ?? 0 };
    } else return e;
    if (job) story.setJob(id, job); else e.job = null;
    return e;
  }
  function zoneOn(zid) { zonesOn.add(zid); for (const [id, at, job] of PEOPLE[zid]()) put(id, at, job); }
  function zoneOff(zid) {
    zonesOn.delete(zid);
    for (const [id] of PEOPLE[zid]()) {
      if (!mine.has(id) || story.talkWith?.id === id) continue;
      story.remove(id);
      mine.delete(id);
    }
  }
  const herePos = () => (story.foot?.active ? game.maya.root.position : game.car.root.position);
  function refreshPeople() {
    if (story.inRoom) return;
    const p = herePos();
    for (const [zid, Z] of Object.entries(ZONES)) {
      const d = Math.hypot(p.x - Z.x, p.z - Z.z);
      if (d < Z.r) { if (!zonesOn.has(zid)) zoneOn(zid); else for (const [id, at, job] of PEOPLE[zid]()) if (!story.people.has(id)) put(id, at, job); }
      else if (d > Z.r + 20 && zonesOn.has(zid)) zoneOff(zid);
    }
    for (const id of indoorOnly()) { const e = story.people.get(id); if (e && !e.indoor && !story.talking) { story.remove(id); mine.delete(id); } }
  }

  // ---- taps on things outdoors (no marker is drawn: the board, the bean box and the back board are in the scene)
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const groundAt = (sx, sy) => {
    ndc.set((sx / game.viewW) * 2 - 1, -(sy / game.viewH) * 2 + 1);
    ray.setFromCamera(ndc, game.camera);
    return ray.ray.intersectPlane(plane, new THREE.Vector3());
  };
  const TAPS = [
    { at: SPOTS.board, r: 1.3, stand: SPOTS.boardStand, fn: () => boardTap() },
    { at: SPOTS.bean, r: 1.1, stand: { x: SPOTS.bean.x, z: SPOTS.bean.z + 1.1 }, fn: () => D.say('maya', L.bean, { face: 'smile' }) },
    { at: { x: SPOTS.backDoor.x, z: SPOTS.backDoor.z - 0.6 }, r: 1.6, stand: SPOTS.backFront, fn: () => backDoor(), own: true, when: () => !F('door') },
  ];
  const tapHook = (sx, sy) => {
    if (story.inRoom || story.talking || game.busy || !story.foot?.active) return false;
    const g = groundAt(sx, sy);
    if (!g) return false;
    for (const t of TAPS) {
      if (t.when && !t.when()) continue;
      if (Math.hypot(g.x - t.at.x, g.z - t.at.z) > t.r) continue;
      walkOn(t.stand.x, t.stand.z).then(() => (t.own ? t.fn() : run(t.fn)));
      return true;
    }
    return false;
  };
  story.tapHooks = story.tapHooks || [];
  story.tapHooks.push(tapHook);

  // ---------------------------------------------------------------------------------------------
  // 4. the morning, the board, the Template Shop, Pho Thar
  // ---------------------------------------------------------------------------------------------
  async function morning() {
    // (Day 13's slept13 table, day13-spec 9: the local copy; the same lines day13.js will export as SLEPT)
    const slept = { ...SLEPT13 };
    await morningPost(story, { day: 14, walkUp: false, ww: L.ww1, slept, letters: [{ from: 'eimon', text: EM_NOTE }], companions: [] });
    // Ei Mon's own letter inks the pencil tick Day 13 left on page 21
    const was = save.stamps.includes(21);
    if (!was) save.stamps.push(21);
    save.pencilStamps = (save.pencilStamps || []).filter((n) => n !== 21);
    story.persist();
    if (!was) await stampOverlay(game, { stamps: [21], text: L.ink21, tomorrow: { my: '', en: '' }, button: { my: 'ဆက်မယ်', en: 'Go on' } });
    await morningPost(story, { day: 14, walkUp: false, hour: null, companions: ['touchmenot', 'glasses'], lift: { touchmenot: [L.lift[0], L.liftFold] }, where: L.ww2, whereBy: 'wintwar' });
    heard('map');
    F('morning', true);
    // Ma Wint War goes back to the sorting room's side door; the board is on the wall beside it
    const ww = story.people.get('wintwar');
    if (ww) {
      ww.job = null;
      story.walkPerson('wintwar', SPOTS.wwSorting.x, SPOTS.wwSorting.z, 1.3).then(() => { const e = story.people.get('wintwar'); if (e) { e.home.h = SPOTS.wwSorting.h; story.setJob('wintwar', jobAt(SPOTS.wwSorting, 1.4, 'read')); } });
    }
  }
  async function boardTap() {
    if (!F('morning')) return;
    if (F('boardEmpty')) { F('boardSeenEmpty', true); return D.say('maya', L.boardEmpty, { face: 'smile' }); }
    await showSlip(game, L.note, { title: L.noteTitle });
    if (!F('board')) { await D.say('maya', L.noteMaya, { face: 'think' }); F('board', true); }
  }
  async function invitesStation() {
    if (F('invites')) return D.say('maya', L.shopTaken, { face: 'smile' });
    call(game.maya, 'emote', 'point');
    await D.say('maya', L.shopInv, { face: 'think' });
    const left = DISTRICTS.filter((d) => !F(`inv.${d}`)).length;
    story.give('invites', left);
    F('invites', true);
  }
  async function phothar() {
    if (F('inv.home')) return D.say('phothar', L.ptAfter, { face: 'happy' });
    if (!story.has('invites')) return D.say('phothar', L.ptBefore, { face: 'happy' });
    if (!(await handover('home'))) return;
    await D.say('phothar', L.ptInv, { face: 'surprised' });
    const uk = story.people.get('ukyaw');
    if (uk) await D.say('ukyaw', L.ukInv, { face: 'smile' });
  }

  // ---------------------------------------------------------------------------------------------
  // 5. the Quarter: Toe Toe in the classroom
  // ---------------------------------------------------------------------------------------------
  async function kids(who) {
    if (F('ttNames')) return D.say(who, L.amb[who], { face: 'happy' });
    await D.say('sunwe', [L.kids[0]], { face: 'surprised' });
    await D.say('maungnge', [L.kids[1]], { face: 'think' });
    heard('essay');
  }
  async function readEssay() {
    await D.say('maya', L.essayHolds, { face: 'smile' });
    const t = L.essayTitle, l = INVITES.quarter.line;
    await showSlip(game, { my: `«${t.my}»\n…${l.my}…`, en: `“${t.en}”\n…${l.en}…` }, { title: { my: 'တိုးတိုးရဲ့ စာစီစာကုံး', en: "Toe Toe's essay" } });
    await D.say('maya', L.essayRead, { face: 'think' });
    proof('essay');
    F('essayRead', true);
  }
  async function ttTalkRun() {
    const r = await story.talk.run(TALK_D14_TOETOE);
    if (!r.won) { await D.say('toetoe', L.ttNotYet, { face: 'think' }); return; }
    F('ttTalk', true);
    roomT = 0;
    // he turns to the window and writes, his back to the room
    const tt = story.people.get('toetoe');
    if (tt) { tt.home.h = Math.PI; tt.p.root.rotation.y = Math.PI; }
  }
  async function listScene() {
    await showSlip(game, L.ttList, { title: L.ttListTitle });
    await D.say('maya', L.ttListMaya, { face: 'smile' });
    if (story.has('invites') && !F('inv.quarter')) {
      await D.say('toetoe', L.ttCarry, { face: 'happy' });
      await handover('quarter'); // Maya stamps; he carries it
    } else {
      await D.say('toetoe', [L.ttCarry[1], L.ttCarry[2]], { face: 'happy' });
      if (!F('inv.quarter')) await D.say('toetoe', L.ttCarryNoInv, { face: 'smile' });
    }
    F('ttNames', true);
    F('boardEmpty', true);
    F('essayCarry', true);
    call(W.get('board'), 'setText', [L.boardBoardHeading]);
    // he gives Daw Hnin Wai hers at her table first (she reads her line, says nothing, only nods), then runs out
    const hw = story.people.get('hninwai');
    if (hw) call(hw.p, 'emote', 'nod');
    await D.say('toetoe', L.ttOut, { face: 'happy', emote: 'cheer' });
    const tt = story.people.get('toetoe');
    const dr = story.room?.spots?.door || { x: 0, z: 3.55 };
    if (tt) story.walkPerson('toetoe', dr.x, dr.z, 1.8).then(() => { if (story.people.get('toetoe')?.indoor) story.remove('toetoe'); });
  }
  async function toetoe() {
    if (story.inRoom !== 'classroom') {
      // outside, after his list: he hands out the Quarter's invitations himself
      if (!F('inv.quarter') && story.has('invites')) { await D.say('toetoe', [L.ttCarry[0]], { face: 'happy' }); await handover('quarter'); return; }
      return D.say('toetoe', L.ttOut, { face: 'happy' });
    }
    if (F('ttNames')) return;
    if (!F('ttMet')) { await D.say('toetoe', L.tt1, { face: 'worried' }); F('ttMet', true); }
    if (!F('essayRead')) await readEssay();
    if (F('ttTalk')) {
      if (F('ttReady')) return listScene();
      return D.say('toetoe', [L.ttDontLook], { face: 'worried' });
    }
    if (F('page')) {
      if (story.talk.waiting(TALK_D14_TOETOE.id)) return D.say('toetoe', L.ttNotYet, { face: 'think' });
      return ttTalkRun();
    }
    for (;;) {
      const i = await D.choose(L.ttChoices);
      if (i === 0) { await D.say('toetoe', L.ttMe, { face: 'sad' }); await D.say('maya', L.ttMeMaya, { face: 'think' }); continue; }
      if (i === 1) { await D.say('toetoe', L.ttAll, { face: 'sad' }); await D.say('maya', L.ttAllMaya, { face: 'think' }); continue; }
      break;
    }
    await D.say('maya', L.ttPageMaya, { face: 'smile' });
    await D.say('toetoe', L.ttPageTt, { face: 'surprised' });
    F('page', true);
    // he slides along the bench of his desk; Maya sets the Writer mug down on it
    return ttTalkRun();
  }

  // ---------------------------------------------------------------------------------------------
  // 6.1 the Market: whose border is it? (inside Daw Tin Tin's tea shop)
  // ---------------------------------------------------------------------------------------------
  async function thiri() {
    if (!F('heard.border')) { await D.say('thiri', L.thiri, { face: 'smile' }); heard('border'); return; }
    if (F('inv.market')) return D.say('thiri', L.amb.thiri, { face: 'happy' });
    return D.say('thiri', [L.thiri[1]], { face: 'smile' });
  }
  async function khwarnyo() {
    if (F('border')) return D.say('khwarnyo', L.knAfter, { face: 'happy' });
    if (!story.has('invites') && !F('inv.market')) { await D.say('khwarnyo', L.knBefore, { face: 'smile' }); return D.say('maya', L.needInv, { face: 'think' }); }
    await D.say('maya', L.knSits, { face: 'smile' });
    postmark();
    await D.say('khwarnyo', L.knQ, { face: 'think' });
    for (;;) {
      const i = await D.choose(L.knChoices);
      if (i === 0) break;
      await D.say('maya', L.knWrong, { face: 'think' });
    }
    await D.say('khwarnyo', L.knEnd, { face: 'smile' });
    await D.say('kolwin', L.ktEnd, { face: 'smile' });
    await D.say('khwarnyo', L.knEnd2, { face: 'happy' });
    proof('border');
    F('border', true);
    await handover('market', { stamped: true });
  }

  // ---------------------------------------------------------------------------------------------
  // 6.2 the Wharf: ride along, greet every jetty
  // ---------------------------------------------------------------------------------------------
  async function kothiha() {
    if (F('ride')) return D.say('kothiha', L.cmAfter, { face: 'smile' });
    if (!story.has('invites') || F('inv.wharf')) return D.say('kothiha', L.cmBefore, { face: 'smile' });
    await D.say('kothiha', L.cmInv, { face: 'happy' });
    const stops = [
      { id: 'firewood', at: 0.2, label: L.rideStops.firewood, who: 'yaung' },
      { id: 'big', at: 0.42, label: L.rideStops.big, who: 'maungnge' },
      { id: 'duck', at: 0.64, label: L.rideStops.duck, who: 'dawsanda' },
      { id: 'cane', at: 0.86, label: L.rideStops.cane, who: 'ubolay' },
    ];
    const r = await pole({
      title: L.rideTitle, hint: L.rideHint, route: 'raftRun', stops, passenger: true,
      onEvent: (name, st) => { if (name === 'greet') { const n = stops.findIndex((s) => s.id === st?.id) + 1; if (n > 0) F(`greet.${n}`, true); } },
    });
    if (r?.cancelled) return;
    // Cane Jetty: old U Bo Lay on his post (reached only by the raft)
    await D.say('ubolay', L.nt1, { face: 'think' });
    await handover('wharf');
    F('boLay', true);
    await D.say('kothiha', L.cmEnd, { face: 'smile' });
    F('ride', true);
    metAdd('ubolay');
  }

  // ---------------------------------------------------------------------------------------------
  // 6.3 the Junction: whose words? the printing; Nay Chi (inside the printing shed)
  // ---------------------------------------------------------------------------------------------
  async function doMatch() {
    await loadSayings();
    let pairs = save.notebook.sleptAt
      .map((s) => ({ who: s.who, line: SAYINGS[s.day]?.[s.who] }))
      .filter((p) => p.line && castById(p.who))
      .reverse()
      .filter((p, i, a) => a.findIndex((q) => q.who === p.who) === i) // one line per person (names unique on the right)
      .slice(0, 6)
      .reverse()
      .map((p) => ({ left: { ...bareLine(p.line), icon: 'book' }, right: castById(p.who).name }));
    for (const fb of SAYINGS_FALLBACK) {
      if (pairs.length >= 4) break;
      if (!pairs.some((p) => p.right.my === fb.right.my)) pairs.push(fb);
    }
    const r = await match({ title: L.matchTitle, hint: L.matchHint, pairs, shuffle: true });
    if (r?.mistakes) await D.say('kowunna', L.kwUnsure, { face: 'think' });
    if (!r?.ok) return false;
    F('matched', true);
    story.give('refpage');
    return true;
  }
  async function printing() {
    await D.say('maya', L.pressRuns, { face: 'smile' });
    const R = story.room;
    for (let k = 0; k < 3; k++) { for (let i = 0; i <= 10; i++) { call(R, 'pull', i / 10); await wait(28); } for (let i = 10; i >= 0; i--) { call(R, 'pull', i / 10); await wait(22); } call(game.audio, 'play', 'thud'); }
    await D.say('kowunna', L.kwPrint, { face: 'smile' });
    F('printed', true);
    F('cargo', true);
    story.cargo.load('booklets', bookletBundle().root);
    pendingCar = true;
  }
  async function kowunna() {
    if (F('printed')) return D.say('kowunna', L.kwAfter, { face: 'smile' });
    if (!F('rumour.shed')) { await D.say('kowunna', [L.kw1[0]], { face: 'think' }); proof('shed'); }
    if (!F('matched')) {
      if (F('essayCarry')) await D.say('kowunna', [L.kw1[1]], { face: 'smile' });
      await D.say('kowunna', [L.kw1[2]], { face: 'smile' });
      if (!(await doMatch())) return;
    }
    if (!F('essayCarry')) return D.say('kowunna', L.kwNoEssay, { face: 'think' });
    await printing();
  }
  async function naychi() {
    if (F('ncChoice') || (!F('inv.junction') && !story.has('invites'))) return D.say('maya', L.ncBusy, { face: 'smile' });
    if (!(await handover('junction'))) return;
    await D.say('naychi', L.nc1, { face: 'happy' });
    for (;;) {
      const i = await D.choose(L.ncChoices);
      if (i === 2) break;
      await D.say('naychi', L.ncLean, { face: 'think' });
      await D.say('maya', L.ncLeanMaya, { face: 'think' });
    }
    await D.say('naychi', L.ncEnd, { face: 'happy' });
    F('ncChoice', true);
  }

  // ---------------------------------------------------------------------------------------------
  // 6.4 the drive: Hearth Row (the bakery, Ei Mon at the kerb), the Diary Garden (the open gate)
  // ---------------------------------------------------------------------------------------------
  async function arkar() {
    if (!F('myRun')) { await D.say('maungarkar', L.myRun, { face: 'happy' }); heard('bread'); F('myRun', true); return; }
    return D.say('maungarkar', L.myAfter, { face: 'smile' });
  }
  async function khinmay() {
    if (F('inv.hearth')) return D.say('khinmay', L.kmAfter, { face: 'smile' });
    if (!story.has('invites')) return D.say('khinmay', L.kmBefore, { face: 'smile' });
    if (!(await handover('hearth'))) return;
    await D.say('khinmay', L.kmInv, { face: 'smile' });
    proof('bread');
  }
  async function eimon() {
    if (!story.inRoom && F('inv.hearth') && !F('emAsk')) {
      await D.say('eimon', L.emAsk, { face: 'smile' });
      const i = await D.choose(L.emChoices);
      if (i === 0) { call(game.audio, 'play', 'page'); await D.say('eimon', L.emRead, { face: 'happy' }); }
      else await D.say('eimon', L.emNo, { face: 'smile' });
      F('emAsk', true);
      // she ties it back and goes in again
      setTimeout(() => { const d = story.doors?.DOORS?.bakery; if (d && story.people.get('eimon') && !story.inRoom) story.walkPerson('eimon', d.x, d.z + 0.3).then(() => { if (mine.has('eimon') && !story.inRoom) { story.remove('eimon'); mine.delete('eimon'); } }); }, 400);
      return;
    }
    return D.say('eimon', L.emShop, { face: 'smile' });
  }
  async function hpohtaw() {
    if (F('inv.garden')) return D.say('hpohtaw', [L.hhInv[1]], { face: 'smile' });
    if (!story.has('invites')) return D.say('hpohtaw', L.hhBefore, { face: 'smile' });
    if (!(await handover('garden'))) return;
    await D.say('hpohtaw', L.hhInv, { face: 'smile' });
    await D.say('maya', L.hhMaya, { face: 'smile' });
  }
  async function kyinyein() {
    if (!F('inv.garden')) return D.say('kyinyein', L.spBefore, { face: 'think' });
    F('kyInv', true);
    return D.say('kyinyein', L.spInv, { face: 'smile' });
  }

  // ---------------------------------------------------------------------------------------------
  // 6.5 the Blank Page (the lodge) and 8. the Back Cover
  // ---------------------------------------------------------------------------------------------
  async function pyaesone() {
    if (F('inv.blank')) return D.say('pyaesone', L.psAfter, { face: 'smile' });
    if (!story.has('invites')) return D.say('pyaesone', L.psBefore, { face: 'smile' });
    if (!(await handover('blank'))) return;
    await D.say('pyaesone', L.psInv, { face: 'think' });
    heard('keyhole');
  }
  async function backDoor() {
    if (F('door') || doorBusy || story.talking || game.busy) return;
    doorBusy = true;
    let open = false;
    story.talking = true;
    try {
      if (!story.has('ownkey')) { await D.say('maya', L.doorNoKey, { face: 'think' }); return; }
      game.ui.cinema(true);
      story.use('ownkey');
      call(game.audio, 'play', 'door');
      await D.say('maya', L.door, { face: 'happy' });
      proof('keyhole');
      F('door', true);
      open = true;
    } catch (err) { console.error('day14 door', err); } finally { story.talking = false; game.ui.cinema(false); doorBusy = false; }
    if (!open) return;
    W.openBackDoor();
    await wait(150);
    await story.enter('backcover', { door: 'backcover' });
  }
  async function deskStation() {
    if (F('desk')) {
      if (cargoOn()) return D.say('maya', L.deskHomeCargo, { face: 'think' });
      // a lit desk opens the map (outside the door: the map turns pages on the land)
      setTimeout(async () => { if (await story.exit({})) setTimeout(() => story.openWorld?.openMap(), 400); }, 50);
      return;
    }
    await D.say('maya', [L.deskQ], { face: 'think' });
    for (;;) {
      const i = await D.choose(L.desk);
      if (i === 0) break;
      await D.say('maya', [L.deskWrong], { face: 'think' });
    }
    call(game.maya, 'emote', 'write');
    await wait(900);
    await story.openWorld?.desks?.unlock('backcover');
    call(story.room, 'setLit', true);
    F('desk', true);
    call(game.audio, 'play', 'chime');
    await D.say('maya', L.deskDone, { face: 'happy' });
  }
  async function lastLine() {
    await D.say('maya', [L.lastQ], { face: 'think' });
    for (;;) {
      const i = await D.choose(L.lastChoices);
      if (i === 2) break;
      await D.say('maya', L.lastWrong[i], { face: 'think' });
    }
    await D.say('maya', L.lastBlank, { face: 'smile' });
    F('blank', true);
    await D.say('maya', L.replyDone, { face: 'smile' });
  }
  async function slopeStation() {
    if (!F('rumour.map')) { await D.say('maya', L.mapSheet, { face: 'think' }); proof('map'); }
    if (F('reply')) return F('blank') ? D.say('maya', L.replyDone, { face: 'smile' }) : lastLine();
    await D.say('maya', L.replySit, { face: 'think' });
    const r = await ownwords({ title: L.replyTitle, hint: L.replyHint, prompt: L.replyPrompt, fragments: L.replyFragments, need: 5 });
    if (r?.picks?.some((i) => L.replyFragments[i] && !L.replyFragments[i].good)) await D.say('maya', L.replyParrot, { face: 'think' });
    if (!r?.ok) return;
    F('reply', true);
    await lastLine();
  }
  async function holesStation() {
    if (cargoOn()) {
      story.cargo.unload();
      if (bundleInRoom) { bundleInRoom.parent?.remove(bundleInRoom); bundleInRoom = null; }
      call(story.room, 'setFilled', 8);
      call(game.audio, 'play', 'thud');
      F('unloaded', true);
      F('cargo', false);
      return D.say('maya', L.unload, { face: 'smile' });
    }
    return D.say('maya', F('unloaded') ? L.holesFull : L.holesEmpty, { face: 'smile' });
  }

  // ---------------------------------------------------------------------------------------------
  // 9. the night page (inside the Writing Room, at her desk)
  // ---------------------------------------------------------------------------------------------
  const nightReady = () => !!(F('ttNames') && F('unloaded') && F('reply')) && !F('done');
  function sleepChoices() {
    const met = (F('met') || []).filter((id) => castById(id));
    const first = Object.keys(SLEPT14).filter((id) => met.includes(id));
    const rest = met.filter((id) => !first.includes(id));
    const list = [...first, ...rest].slice(0, 5);
    return list.length ? list : ['toetoe'];
  }
  async function night() {
    if (nightBusy) return;
    nightBusy = true;
    try {
      const extra = [];
      if ([...Array(22)].every((_, i) => save.stamps.includes(i + 1))) extra.push(L.allPages); // with tonight's 23: all in gold
      if (DISTRICTS.some((d) => !F(`inv.${d}`))) extra.push(L.leftover);
      await nightPage(story, {
        day: 14,
        truth: { q: L.nightQ, choices: L.nightChoices, right: 1, wrong: L.nightWrong },
        sleep: { q: L.sleepQ, who: sleepChoices() },
        stamps: [23],
        stampText: L.stampText,
        extra: extra.length ? { my: extra.map((e) => e.my).join('\n'), en: extra.map((e) => e.en).join('\n') } : undefined,
        tomorrow: L.tomorrow,
      });
    } finally { nightBusy = false; }
  }

  // ---------------------------------------------------------------------------------------------
  // who says what, by how far the day has gone (spec 7: one line per tap; they hint, never point)
  // ---------------------------------------------------------------------------------------------
  const say1 = (id, lines, face = 'smile') => () => D.say(id, lines, { face });
  const TALK = {
    wintwar: async () => {
      if (!F('morning')) return morning();
      if (!F('board')) return D.say('wintwar', L.wwBoard, { face: 'smile' });
      if (!F('ttNames')) return D.say('wintwar', L.wwLater, { face: 'smile' });
      return D.say('wintwar', L.amb.wintwar, { face: 'happy' });
    },
    phothar,
    ukyaw: () => D.say('ukyaw', F('inv.home') ? L.ukInv : L.ukBefore, { face: 'smile' }),
    sunwe: () => kids('sunwe'),
    maungnge: () => kids('maungnge'),
    yeyint: say1('yeyint', L.amb.yeyint),
    micho: say1('micho', L.amb.micho, 'happy'),
    dawohn: say1('dawohn', L.amb.dawohn),
    hninwai: () => D.say('hninwai', [L.amb.hninwai[F('ttNames') ? 1 : 0]], { face: F('ttNames') ? 'happy' : 'smile' }),
    toetoe,
    thiri,
    khwarnyo,
    kolwin: () => D.say('kolwin', F('border') ? L.ktEnd : L.klBefore, { face: 'smile' }),
    kophyo: async () => { await D.say('kophyo', L.kpTea, { face: 'smile' }); heard('shed'); },
    tintin: say1('tintin', L.amb.tintin),
    kothiha,
    kowunna,
    naychi,
    utint: say1('utint', L.utint),
    maungarkar: arkar,
    khinmay,
    eimon,
    hpohtaw,
    kyinyein,
    pyaesone,
    dawpwint: say1('dawpwint', L.amb.dawpwint),
    shwesin: say1('shwesin', [bareLine(SLEPT13.shwesin)]),
    moe: say1('moe', [bareLine(SLEPT13.moe)]),
  };
  const talk = {};
  for (const [id, fn] of Object.entries(TALK)) talk[id] = async (e) => { metAdd(id); return fn(e); };

  // ---------------------------------------------------------------------------------------------
  // the page's people and props at the start
  // ---------------------------------------------------------------------------------------------
  W.ensure('home');
  zoneOn('home');
  if (W.get('board') && F('boardEmpty')) call(W.get('board'), 'setText', [L.boardBoardHeading]);

  // ---------------------------------------------------------------------------------------------
  // rooms (doors.js hooks): who is inside, the day's dressing, the story taps
  // ---------------------------------------------------------------------------------------------
  function roomOpts(id) {
    if (id === 'press') return { dressing: 'd14' };
    if (id === 'backcover') return { lit: !!F('desk'), filled: F('unloaded') ? 8 : 0 };
    return undefined;
  }
  function roomCast(id) {
    if (id === 'classroom') return [{ id: 'hninwai', spot: 'hninwai' }, ...(F('ttNames') ? [] : [{ id: 'toetoe', spot: 'toetoe' }])];
    if (id === 'teashop') return [{ id: 'tintin', spot: 'tintin' }, { id: 'kophyo', spot: 'kophyoA' }, { id: 'khwarnyo', spot: 'khwarnyoB' }, { id: 'kolwin', spot: 'kolwinD' }];
    if (id === 'press') return [{ id: 'kowunna', spot: 'kowunnaStone' }, { id: 'naychi', spot: 'naychi' }, { id: 'utint', spot: 'utintBench' }];
    if (id === 'bakery') return [{ id: 'khinmay', spot: 'kmTable' }, { id: 'eimon', spot: 'counter' }, ...(F('myRun') ? [{ id: 'maungarkar', spot: { x: -0.9, z: 2.8, h: Math.PI } }] : [])];
    if (id === 'backcover') return [];
    return undefined; // the room's own cast (the lodge: Daw Pwint and the travellers round the low table)
  }
  async function enterRoom(id, room) {
    if (story.inRoom === id) { if (story.doors?.roomCam) story.doors.roomCam(); else game.rig.setFollow(ROOM_CAM); } // doors.js's shared close, low room camera
    if (id === 'classroom') {
      const st = room?.stations;
      if (st && !st.some((s) => s.id === 'd14-essay')) st.push({ id: 'd14-essay', x: 1.7, z: -2.7, r: 0.6, look: { x: 2.5, z: -2.3 }, labelY: 1.0, noMarker: true });
      roomT = 0;
      if (F('ttReady') && !F('ttNames')) {
        await wait(900);
        const tt = story.people.get('toetoe');
        if (tt && !story.talking && story.inRoom === 'classroom') story.talkTo(tt);
      }
    } else if (id === 'press') {
      const sp = room?.spots?.newcomer;
      if (sp && story.room?.scene) {
        newcomer = createPerson({ age: 'teen', build: 'slim', skin: 2, hair: 'braid', hairColor: '#3A2418', top: 'blouse', topColor: 'mustard', bottom: 'htamein', bottomColor: 'teal', extras: ['thanaka'] });
        newcomer.root.position.set(sp.x, 0, sp.z);
        newcomer.root.rotation.y = sp.h ?? 0;
        newcomer.root.userData.isPerson = true;
        story.room.scene.add(newcomer.root);
      }
    } else if (id === 'bakery') {
      if (F('heard.bread') && !F('rumour.bread')) { await wait(1000); if (story.inRoom === 'bakery') run(() => D.say('maya', L.breadSeen, { face: 'surprised' })); }
    } else if (id === 'lodge') {
      if (!F('cup')) { F('cup', true); await wait(1000); if (story.inRoom === 'lodge') run(() => D.say('maya', L.guestCup, { face: 'smile' })); }
    } else if (id === 'backcover') {
      if (cargoOn() && story.room?.scene) {
        bundleInRoom = bookletBundle().root;
        bundleInRoom.position.set(0.9, 0, 1.0);
        bundleInRoom.rotation.y = 0.4;
        story.room.scene.add(bundleInRoom);
      }
    } else if (id === 'about') {
      if (nightReady()) {
        await wait(500);
        const sp = story.room?.storyLayer?.spots?.mayaDesk || { x: -1.35, z: -2.4 };
        await walkOn(sp.x, sp.z);
        if (story.inRoom === 'about') night();
      }
    }
  }
  function leaveRoom(id, room) {
    if (id === 'classroom') {
      const st = room?.stations;
      if (st) { const k = st.findIndex((s) => s.id === 'd14-essay'); if (k >= 0) st.splice(k, 1); }
      if (F('ttTalk') && !F('ttNames')) { F('stepAway', true); leftAt = performance.now(); }
    } else if (id === 'press') {
      if (newcomer) { newcomer.root.parent?.remove(newcomer.root); try { newcomer.dispose(); } catch { /* gone */ } newcomer = null; }
    } else if (id === 'bakery') {
      if (F('inv.hearth') && !F('emAsk')) pendingEm = true;
    } else if (id === 'backcover') {
      if (bundleInRoom) { bundleInRoom.parent?.remove(bundleInRoom); bundleInRoom = null; }
    }
  }
  function station(id, ctx) {
    const room = ctx?.room || story.inRoom;
    if (room === 'templates' && id === 'invites') { run(invitesStation); return true; }
    if (room === 'classroom' && id === 'd14-essay') {
      const tt = story.people.get('toetoe');
      if (!F('essayRead') && tt) story.talkTo(tt); else run(() => D.say('maya', L.essayRead, { face: 'think' }));
      return true;
    }
    if (room === 'backcover') {
      if (id === 'desk') { run(deskStation); return true; }
      if (id === 'slope') { run(slopeStation); return true; }
      if (id === 'holes') { run(holesStation); return true; }
      if (id === 'plate') return true; // blank unless Maya says yes to her real references (spec 8.5): nothing is said
    }
    return false;
  }

  // ---------------------------------------------------------------------------------------------
  // test hooks: window.__day14.skipTo(beat) sets what the earlier beats would have set and puts Maya there
  // ---------------------------------------------------------------------------------------------
  const BEATS = [
    { id: 'morning', at: { x: 0, z: 8.4 } },
    { id: 'board', set: ['morning', 'heard.map'], at: { x: story.board.stand.x, z: story.board.stand.z + 0.6 } },
    { id: 'invites', set: ['board'], at: { x: -12.3, z: -5.0 } },
    { id: 'pho', set: ['invites'], items: { invites: 8 }, at: { x: 21.4, z: 10.6 } },
    { id: 'quarter', set: ['inv.home'], at: { x: -12.0, z: 95.2 } },
    { id: 'classroom', set: ['heard.essay'], at: { x: -11.5, z: 90.0 }, room: 'classroom' },
    { id: 'stepAway', set: ['ttMet', 'essayRead', 'rumour.essay', 'page', 'ttTalk'], at: { x: -11.5, z: 90.0 }, room: 'classroom' },
    { id: 'market', set: ['stepAway', 'ttReady', 'ttNames', 'boardEmpty', 'essayCarry', 'inv.quarter'], at: { x: 27.5, z: 301.0 } },
    { id: 'teashop', set: ['heard.border'], at: { x: 27.5, z: 317.0 }, room: 'teashop' },
    { id: 'wharf', set: ['border', 'rumour.border', 'inv.market', 'heard.shed'], at: { x: 70.0, z: 441.4 } },
    { id: 'junction', set: ['ride', 'boLay', 'inv.wharf', 'greet.1', 'greet.2', 'greet.3', 'greet.4'], at: { x: 160, z: 299.5 } },
    { id: 'press', set: [], at: { x: 160, z: 298.5 }, room: 'press' },
    { id: 'drive', set: ['rumour.shed', 'matched', 'printed', 'ncChoice', 'inv.junction', 'cargo', 'carKerb'], items: { refpage: 1 }, at: { x: 148, z: 220 }, cargo: true },
    { id: 'hearth', set: [], at: { x: 141.5, z: 199.6 }, cargo: true },
    { id: 'garden', set: ['myRun', 'heard.bread', 'inv.hearth', 'rumour.bread', 'emAsk'], at: { x: 236, z: 99.6 }, cargo: true },
    { id: 'blank', set: ['inv.garden', 'kyInv'], at: { x: 136.4, z: -4.0 }, cargo: true },
    { id: 'backcover', set: ['inv.blank', 'heard.keyhole', 'cup'], at: { x: 126, z: -56.5 }, cargo: true },
    { id: 'reply', set: ['door', 'rumour.keyhole', 'desk', 'unloaded'], unset: ['cargo'], at: { x: 126, z: -58.6 }, room: 'backcover' },
    { id: 'night', set: ['rumour.map', 'reply', 'blank'], at: { x: 0, z: 8.6 } },
  ];
  async function skipTo(beat) {
    const k = BEATS.findIndex((b) => b.id === beat);
    if (k < 0) return { ok: false, beats: BEATS.map((b) => b.id) };
    if (story.inRoom) await story.exit({ instant: true });
    for (let i = 0; i <= k; i++) {
      const b = BEATS[i];
      for (const f of b.set || []) F(f, true);
      for (const f of b.unset || []) F(f, false);
      for (const [id, n] of Object.entries(b.items || {})) if (!story.has(id)) story.give(id, n, { quiet: true });
      for (const f of b.set || []) if (f.startsWith('rumour.')) { const r = f.slice(7); save.proofs[r] = PROOFS[r]; if (!story.has(`proof:${r}`)) story.give(`proof:${r}`, 1, { quiet: true }); story.flag(`rumour.${r}`, 'checked'); }
    }
    // invitations left = districts not yet handed over (once collected)
    if (F('invites')) { const left = DISTRICTS.filter((d) => !F(`inv.${d}`)).length; const have = save.bag.invites || 0; if (have !== left) story.give('invites', left - have, { quiet: true }); }
    if (F('ttNames')) call(W.get('board'), 'setText', [L.boardBoardHeading]);
    const b = BEATS[k];
    if (b.cargo && !story.cargo.loaded) story.cargo.load('booklets', bookletBundle().root);
    if (!b.cargo && story.cargo.loaded && !cargoOn()) story.cargo.unload();
    if (b.id === 'reply' && F('door')) W.openBackDoor();
    if (!story.foot.active) await story.foot.toFoot();
    story.refreshHud?.();
    story.openWorld?.jump(b.at.x, b.at.z, 0);
    W.ensure(W.zoneAt(b.at.x, b.at.z) || 'home');
    refreshPeople();
    if (b.room) { await wait(300); await story.enter(b.room, b.room === 'backcover' ? { door: 'backcover' } : {}); }
    return { ok: true, beat };
  }

  const api = {
    talk,
    roomOpts, roomCast, enterRoom, leaveRoom, station,
    /** The page turns in place: this page's props, keep-out boxes, doors and people go away. */
    dispose() {
      const k = story.tapHooks?.indexOf(tapHook);
      if (k >= 0) story.tapHooks.splice(k, 1);
      story.blockedTravel = prevBlocked;
      if (bundleInRoom) { bundleInRoom.parent?.remove(bundleInRoom); bundleInRoom = null; }
      if (newcomer) { newcomer.root.parent?.remove(newcomer.root); newcomer = null; }
      // our people: gone now; while she is inside a room (the night page turns the page in the Writing
      // Room) the street's people are stashed by doors.js, so they go the moment she steps out
      const ours = [...mine].map((id) => story.people.get(id) || stashed.get(id)).filter(Boolean);
      for (const e of ours) e.p.root.removeFromParent();
      if (story.inRoom) {
        const h = (ev) => {
          if (ev.detail?.inside) return;
          document.removeEventListener('rc:room', h);
          for (const e of ours) if (story.people.get(e.id) === e) story.remove(e.id);
        };
        document.addEventListener('rc:room', h);
      } else for (const e of ours) if (story.people.get(e.id) === e) story.remove(e.id);
      mine.clear();
      W.dispose();
      if (window.__day14 === hooks) delete window.__day14;
    },
    async start() {
      if (F('morning')) return;
      // the day opens with Maya stepping out at her Writing Room; the postwoman comes over
      if (story.inRoom) await story.exit({ instant: true });
      if (!story.foot.active) await story.foot.toFoot();
      story.refreshHud?.();
      const mp0 = game.maya.root.position;
      if (Math.hypot(mp0.x - SPOTS.aboutDoor.x, mp0.z - SPOTS.aboutDoor.z) > 6) story.openWorld?.jump(SPOTS.aboutDoor.x, SPOTS.aboutDoor.z + 1.4, 0);
      // a page turned in place: Day 13 took its people (Ma Wint War too) away with it, and update() has not
      // placed the home's people yet, so place them now or the morning post never starts
      if (!story.people.get('wintwar')) refreshPeople();
      const ww = story.people.get('wintwar');
      if (!ww) return;
      ww.paused = true;
      const mp = game.maya.root.position;
      await Promise.race([story.walkPerson('wintwar', mp.x + 1.15, mp.z + 0.05, 1.5), wait(9000)]);
      setTimeout(() => { const e = story.people.get('wintwar'); if (e) e.paused = false; }, 4000);
      await story.talkTo(story.people.get('wintwar'));
    },
    update(dt, t) {
      const pos = story.inRoom ? null : herePos();
      W.update(dt, t, pos);
      if (story.inRoom === 'classroom') {
        // he writes, his back to the room; if Maya stays, he looks up once
        if (F('ttTalk') && !F('ttNames') && !F('stepAway') && !story.talking) {
          roomT += dt;
          if (roomT > 7 && !F('dontLook')) { F('dontLook', true); story.bark('toetoe', L.ttDontLook, 3000); }
        }
        return;
      }
      if (story.inRoom) return;
      // people of the district she is in
      api._peopleT = (api._peopleT || 0) - dt;
      if (api._peopleT <= 0) { api._peopleT = 1; refreshPeople(); }
      // ten seconds after she stepped out, the classroom window swings open
      if (F('stepAway') && !F('ttReady')) {
        if (!leftAt) leftAt = performance.now();
        if (performance.now() - leftAt > 10000) { F('ttReady', true); call(game.audio, 'play', 'chime'); story.bark('toetoe', L.ttDone, 3600); }
      }
      if (game.busy || story.talking) return;
      // the car rolls up at the shed's kerb with the bundle on the seat
      if (pendingCar) {
        pendingCar = false;
        if (!F('carKerb')) { F('carKerb', true); try { game.world.drive.placeAt(SPOTS.carKerb.x, SPOTS.carKerb.z, SPOTS.carKerb.h); game.syncCar?.(0); } catch (err) { console.error('day14 car', err); } }
      }
      // Ei Mon follows Maya out to the kerb, where the bundle is
      if (pendingEm && story.foot?.active) {
        pendingEm = false;
        const mp = game.maya.root.position;
        const e = put('eimon', { x: mp.x + 1.2, z: mp.z + 0.4, h: -Math.PI / 2 }, null);
        if (e) story.talkTo(e);
        return;
      }
      if (!pos) return;
      // Maung Arkar notices the car first and runs out (spec 6.4)
      if (cargoOn() && !F('myRun')) {
        const d = Math.hypot(pos.x - SPOTS.arkar.x, pos.z - SPOTS.arkar.z);
        const ma = story.people.get('maungarkar');
        if (ma && d < 8 && story.foot?.active) { story.talkTo(ma); return; }
        if (ma && d < 11 && !story.foot?.active && !F('myBark')) { F('myBark', true); story.bark('maungarkar', L.myRun[0], 3800); }
      }
      // the road ends at the back board: the Own Key (spec 8.1)
      if (!F('door') && story.foot?.active && Math.hypot(pos.x - SPOTS.backFront.x, pos.z - SPOTS.backFront.z) < 1.3) { backDoor(); return; }
      // night page fallback: at the Writing Room door by car (on foot the door takes her in)
      if (nightReady() && !story.foot?.active && Math.hypot(game.car.root.position.x - SPOTS.aboutDoor.x, game.car.root.position.z - (SPOTS.aboutDoor.z + 3)) < 2.2) night();
    },
  };

  const hooks = {
    beats: BEATS.map((b) => b.id),
    skipTo,
    state: () => Object.fromEntries(Object.entries(save.flags).filter(([k]) => k.startsWith('d14.'))),
    L, world: W, api,
    night, // (tests: play the night page wherever she is)
  };
  window.__day14 = hooks;
  return api;
}
