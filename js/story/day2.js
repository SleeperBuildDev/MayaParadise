// Day 2 (the Exercise-Book Quarter) — chapter 3 ပညာရေး (Education) in full, chapter 5 လက်လျှော့ခြင်း
// (Giving Up) Act 1, the Quarter's first Bookmark Desk and the first "ask Maya" notes (day2-spec).
//
// Lesson, ch 3 (p26–30): school is for understanding how the world works, not for reciting; every subject
// meets a real need of a child's own day (counting, why night is dark, who made light possible, which way
// to the snack shop, what the words of a rhyme mean); with no money for a class, a question asked every day
// makes the world the biggest school. School is not the enemy: the teacher wants him to understand.
// Lesson, ch 5 Act 1 (p39–45): don't give up on a person; nothing is fixed; a way that worked for you proves
// nothing for someone else; keep your goodwill steady when you are refused. Daw Ohn is not won over: she
// allows ONE day's trial, and Mi Cho (not Maya) chooses her own load. The kiln opens on Day 3.
//
// Beats (any order between the two chapters; see the report in BUILD-LOG / the hand-off):
//   home: morning post, Black Sheep lifts off, the ribbon road said · the Quarter: arrival (proof `pass`),
//   gate desk (true line) · `classroom`: the class recites, nobody says why; Daw Hnin Wai (card `want`) ·
//   playground: Toe Toe at his dead beans (recite / tell / walk) · the walk from HIS front door: `snackshop`
//   (scale, card `counted`, proof `shop`) · the lamp (ball, brass plate) · the see-saw (ruled lines) · his
//   box in the shade vs the flower bed in the sun · `classroom`: `match` at his desk → talk → `ownwords` →
//   his teacher reads it, pins it beside the exam chart → seeds · the yard: Mi Cho at the shard heap ·
//   `pottershed`: Daw Ohn says no (leave / "wrong" / watch) → six looks (three inside, three on the sunny
//   rack) → talk (one day's trial) → Mi Cho's own load (4) → `shape` → carry the four out to the shade shelf
//   · `quartertea` (Su Nwe, the tea master) · Maung Nge, Ye Yint (rumours) · home: the "ask Maya" board →
//   night page at the Writing Room door, stamp ✓ ၃, save.day = 3.
//
// No guidance anywhere: no markers, arrows, glowing paths or highlighted doors. People say where things
// are; Toe Toe walks ahead and waits; taps go to things that are really there (no outline).
// Burmese lines are drafts for Maya to proofread (day2-lines.js).
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { morningPost, nightPage } from './post.js';
import { match } from './acts/match.js';
import { ownwords } from './acts/ownwords.js';
import { shape } from './acts/shape.js';
import { createPerson } from './people.js';
import { TALK_D2_TOETOE, TALK_D2_DAWOHN } from './talks/day2.js';
import { L, PROOFS } from './day2-lines.js';
import { buildDay2Props } from './day2-props.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => performance.now();

// the Quarter's people this page places itself (the region's ambient PEOPLE wait until Day 3)
const MANAGED = ['toetoe', 'hninwai', 'dawohn', 'micho', 'sunwe', 'maungnge', 'yeyint'];
const LOOKS = ['oldShelf', 'hands', 'masterWheel', 'rim', 'sun', 'dent'];
const PUPILS = [['pupil1', 'pupilGirl'], ['pupil2', 'pupil2'], ['pupil3', 'pupilGirl2'], ['pupil5', 'pupil3'], ['pupil6', 'pupilGirl3']];

// beats for the test hook window.__day2.skipTo(beat): each beat sets every flag before it too
const BEATS = [
  ['morning', ['morning']],
  ['arrived', ['arrived', 'rumour.pass']],
  ['class', ['class', 'hwMet']],
  ['walk', ['ttMet', 'walk']],
  ['shop', ['ttDoorSaid', 'ttInShop']],
  ['lamp', ['stopShop', 'rumour.shop']],
  ['seesaw', ['s2a', 's2b', 'stopLamp']],
  ['planter', ['s3asked', 'stopSeesaw']],
  ['match', ['s4asked', 's4box', 's4bed', 'stopPlanter']],
  ['talk', ['matched']],
  ['own', ['ttTalk']],
  ['close', ['ownWords']],
  ['ch3', ['ch3Done']],
  ['shed', ['mcMet']],
  ['watch', ['ohnNo', 'ohnWatch']],
  ['looked', [...LOOKS.map((k) => `look.${k}`), 'looked', 'rumour.kiln']],
  ['ohnTalk', ['ohnTalk']],
  ['load', ['load']],
  ['trial', ['shaped', 'trial']],
  ['board', ['wwEve']],
  ['night', ['board']],
];

export { SLEPT2 } from './day2-lines.js'; // tonight's hosts' lines (later days read dayN.js SLEPTn)

export async function create(story) {
  const { game, dialog: D, save } = story;
  const F = (k, v) => story.flag(`d2.${k}`, v);
  const scene = game.world.scene;
  const v3 = new THREE.Vector3();
  let disposed = false;

  // ---------------------------------------------------------------------------------------------
  // props (open world) and the places they make
  // ---------------------------------------------------------------------------------------------
  const P = buildDay2Props(scene);
  const DOOR = P.door; // Toe Toe's front door
  const SP = {
    planterSit: { x: -23.55, z: 93.75, h: -2.3 },
    door: { x: DOOR.x, z: DOOR.z + 0.8, h: 0 },
    shopdoor: { x: 15.7, z: 60.35, h: -0.35 },
    lamp: { x: 5.45, z: 58.55, h: 0.35 },
    seesaw: { x: -13.4, z: 95.95, h: 0.45 },
    planter: { x: -23.55, z: 93.75, h: -2.3 },
    classDoor: { x: -11.5, z: 89.3, h: Math.PI },
    replant: { x: -6.3, z: 93.95, h: Math.PI },
    board: { x: -11.7, z: 93.7, h: 0.25 },
    heap: { x: 40.7, z: 122.5, h: -0.6 },
    shedDoor: { x: 46, z: 115.45, h: Math.PI },
    round: { x: 6.1, z: 75.2, h: -0.6 },
    stage: { x: -13, z: 142.7, h: 0, y: 1.0 },
  };
  const SEESAW = { x: -11.5, z: 95.4 };
  const KILN = { x: 57.7, z: 113.3 };
  const aboutDoor = game.world.places.find((p) => p.id === 'about')?.door || { x: 0, z: 7 };

  function applyProps() {
    if (F('ch3Done')) {
      P.chart.setText(['ကျွန်တော့် ပဲပင်တွေ', 'အရိပ်ထဲမှာ နေလို့', 'နေရောင် မရဘဲ သေသွားတယ်။'], 'တိုးတိုး'); // DRAFT(my): his own line, pinned beside the chart
      P.replant.root.visible = true;
    }
    if (F('trial')) P.shadeShelf.setPots([null, null, null, null, { kind: 'raw', size: 0.8 }, { kind: 'raw', size: 0.8 }, { kind: 'raw', size: 0.8 }, { kind: 'raw', size: 0.8 }]);
    // the shared "ask Maya" board (api.js story.board): Ma Wint War pins the first three notes this evening
    story.board.set({ notes: F('wwEve') || F('board') ? 3 : 0, replies: F('board') ? 1 : 0 });
  }
  applyProps();

  // ---------------------------------------------------------------------------------------------
  // small helpers: proofs and rumours, scenes, named speakers, the close room camera
  // ---------------------------------------------------------------------------------------------
  function hear(id) { if (story.flag(`rumour.${id}`) !== 'checked') story.flag(`rumour.${id}`, 'pencil'); }
  function proof(id) {
    save.proofs[id] = PROOFS[id];
    story.flag(`rumour.${id}`, 'checked');
    F(`rumour.${id}`, true);
    if (!story.has(`proof:${id}`)) story.give(`proof:${id}`);
    else story.persist();
  }
  async function beat(fn) {
    if (story.talking || disposed) return;
    story.talking = true;
    game.ui.cinema(true);
    try { await fn(); } catch (e) { console.error('day2', e); } finally {
      story.talking = false; game.ui.cinema(false); game.rig.release();
      if (paired && story.talkWith === paired) story.talkWith = null;
      paired = null;
    }
  }
  // a scripted exchange with someone beside her: the same low two-shot as a talk (story.twoShot), both
  // a little toward the camera; indoors the cut-away keeps the pair clear (story.talkWith)
  let paired = null;
  function pair(id) {
    const e = person(id);
    if (!e || !story.twoShot) return false;
    const mp = game.maya.root.position, pp = e.p.root.position;
    if (Math.hypot(mp.x - pp.x, mp.z - pp.z) > 4.5) return false;
    let hm = Math.atan2(pp.x - mp.x, pp.z - mp.z), he = Math.atan2(mp.x - pp.x, mp.z - pp.z);
    const az = story.twoShot(mp, pp);
    const cheat = (h) => { let d = az - h; d = Math.atan2(Math.sin(d), Math.cos(d)); return h + d * 0.5; };
    hm = cheat(hm); he = cheat(he);
    if (story.foot?.walker) story.foot.walker.heading = hm;
    game.maya.root.rotation.set(0, hm, 0);
    e.p.root.rotation.y = he;
    story.talkWith = e; paired = e;
    return true;
  }
  const nameEl = () => document.querySelector('#dialog .dialog-name');
  async function sayAs(name, lines, face) {
    const el = nameEl();
    if (el) el.textContent = tr(name);
    await game.ui.say(lines, { face: face || undefined, auto: false, onTick: () => call(game.audio, 'play', 'type') });
    if (el) el.textContent = tr({ my: 'မာရာ', en: 'Maya' });
  }
  function closeCam() {
    // indoors: the close, low follow camera (never the far whole-room view)
    if (story.doors?.roomCam) { story.doors.roomCam(); return; } // doors.js's shared close, low room camera
    game.rig.setFollow({ tilt: 32, width: 6.2, widthLandscape: 11.5, minHeight: 0, height: 0.9, bounds: null, stiffness: 5 });
  }
  const person = (id) => story.people.get(id);
  const myPos = () => (story.foot.active ? { x: story.foot.pos.x, z: story.foot.pos.y } : { x: game.car.root.position.x, z: game.car.root.position.z });
  const near = (a, b, r) => Math.hypot(a.x - b.x, a.z - b.z) < r;
  const rot = (id, n) => { const k = story.flag(`d2.rot.${id}`) || 0; story.flag(`d2.rot.${id}`, (k + 1) % n); return k; };
  const met = (id) => F(`met.${id}`, true);

  // little walkers that are not townspeople (pupils, the two late children): they run a path and go
  const runners = [];
  function runPath(p, pts, speed = 2.4, end) { runners.push({ p, pts, i: 0, speed, end }); }
  function stepRunners(dt) {
    for (let k = runners.length - 1; k >= 0; k--) {
      const r = runners[k];
      const t = r.pts[r.i];
      const pos = r.p.root.position;
      const dx = t.x - pos.x, dz = t.z - pos.z, d = Math.hypot(dx, dz);
      if (d < 0.06) {
        if (++r.i >= r.pts.length) { r.p.root.removeFromParent(); r.p.dispose(); runners.splice(k, 1); call(r, 'end'); }
        continue;
      }
      const s = Math.min(d, r.speed * dt);
      pos.x += (dx / d) * s; pos.z += (dz / d) * s;
      r.p.root.rotation.y = Math.atan2(dx, dz);
      r.p.update(dt, { speed: r.speed });
    }
  }
  let walkOnLooks = null;
  async function looks() { if (!walkOnLooks) { try { walkOnLooks = (await import('./rooms/quarter.js')).WALKONS || {}; } catch { walkOnLooks = {}; } } return walkOnLooks; }

  // ---------------------------------------------------------------------------------------------
  // the Quarter's people: this page decides where each stands, by the day's flags
  // ---------------------------------------------------------------------------------------------
  const spawn0 = story.spawn;
  let allowSpawn = false;
  story.spawn = (id, at) => (MANAGED.includes(id) && !story.inRoom && !allowSpawn ? undefined : spawn0(id, at));
  function spawnOut(id, at) { allowSpawn = true; try { return story.spawn(id, at); } finally { allowSpawn = false; } }
  for (const id of MANAGED) { const e = person(id); if (e && !e.indoor) story.remove(id); }

  const pts = (...a) => a.map(([x, z]) => ({ x, z }));
  function plans() {
    const out = {};
    let tt;
    if (F('ch3Done')) tt = { key: 'replant', ...SP.replant, mood: 'work', from: SP.classDoor, via: pts([-11.5, 90.2], [-14.4, 90.2], [-14.4, 93.95]) };
    else if (F('stopPlanter')) tt = { key: 'toClass', ...SP.classDoor, vanish: true, via: pts([-14.4, 93.8], [-14.4, 90.3]) };
    else if (F('stopSeesaw')) tt = { key: 'stop4', ...SP.planter, wait: true, via: pts([-14.4, 94.4], [-14.4, 93.8]) };
    else if (F('stopLamp')) tt = { key: 'stop3', ...SP.seesaw, wait: true, via: pts([4.2, 62], [4.2, 90.2], [-14.4, 90.2], [-14.4, 94.4]) };
    else if (F('stopShop')) tt = { key: 'stop2', ...SP.lamp, wait: true, from: { x: 15, z: 60.4, h: 0 }, via: pts([15, 62], [5.6, 62]) };
    else if (F('ttInShop')) tt = { key: 'inshop', x: 15, z: 59.6, vanish: true, via: [] };
    else if (F('ttDoorSaid')) tt = { key: 'shopdoor', ...SP.shopdoor, wait: true, via: pts([DOOR.x, 62], [15.7, 62]) };
    else if (F('walk')) tt = { key: 'door', ...SP.door, wait: true, via: pts([-14.4, 93.75], [-14.4, 90.2], [4.2, 90.2], [4.2, 62], [DOOR.x, 62]) };
    else tt = { key: 'planter', ...SP.planterSit, mood: 'down' };
    out.toetoe = tt;
    out.hninwai = F('ch3Done') ? { key: 'board', ...SP.board, job: { area: { x: -11.4, z: 94.2, r: 1.6 }, spot: { x: -11.7, z: 93.6, h: Math.PI }, mood: 'read', workChance: 0.6, workFor: [5, 9] } } : null;
    if (!F('mcMet')) out.micho = { key: 'heap', ...SP.heap, job: { area: { x: 42.4, z: 122.6, r: 1.8 }, spot: { x: 40.4, z: 122.4, h: -1.2 }, mood: 'work', workChance: 0.6, workFor: [5, 9] } };
    else if (F('shaped') && !F('trial')) out.micho = 'keep'; // carrying the pots out with Maya
    else if (F('trial')) out.micho = { key: 'toShed2', ...SP.shedDoor, vanish: true, via: pts([46.6, 116.4]) };
    else out.micho = { key: 'toShed', ...SP.shedDoor, vanish: true, via: pts([42.4, 119.0], [46, 117.2]) };
    out.dawohn = null; // at her wheel, inside the shed
    out.sunwe = null; // in the tea shop
    out.maungnge = { key: 'round', ...SP.round, job: { area: { x: 5.9, z: 77, r: 3.2 }, spot: { x: 6.4, z: 74.7, h: -1.4 }, mood: 'work', workChance: 0.5, workFor: [4, 8] } };
    out.yeyint = { key: 'stage', ...SP.stage };
    return out;
  }
  const recs = new Map();
  const rec = (id) => recs.get(id) || (recs.set(id, {}), recs.get(id));
  function place(e, p) {
    e.walking = null;
    e.p.root.position.set(p.x, p.y || 0, p.z);
    e.p.root.rotation.y = p.h ?? 0;
    e.home = { x: p.x, z: p.z, h: p.h ?? 0 };
    e.ob.x = p.x; e.ob.z = p.z;
    if (p.job) story.setJob(e.id, p.job); else { e.job = null; e.life = null; }
    e.baseMood = p.mood === 'down' ? 'down' : null;
    e.p.setMood(p.job ? e.baseMood : p.mood || null);
  }
  async function walkVia(id, p, speed = 2.2) {
    const r = rec(id);
    r.walking = true;
    try {
      for (const q of [...(p.via || []), p]) {
        const e = person(id);
        if (!e || disposed || story.inRoom) { r.key = null; return false; }
        e.job = null; e.life = null; e.p.setMood(null);
        const d = Math.hypot(e.p.root.position.x - q.x, e.p.root.position.z - q.z);
        const ok = await Promise.race([story.walkPerson(id, q.x, q.z, speed).then(() => true), wait(2500 + (d / speed) * 2200).then(() => false)]);
        const e2 = person(id);
        if (!e2 || story.inRoom) { r.key = null; return false; }
        if (!ok) { e2.walking = null; e2.p.root.position.set(q.x, 0, q.z); e2.ob.x = q.x; e2.ob.z = q.z; e2.home.x = q.x; e2.home.z = q.z; }
      }
      return true;
    } finally { r.walking = false; }
  }
  function inQuarter() { const m = myPos(); return m.z > 30 && !story.inRoom; }
  function sync() {
    if (disposed || story.inRoom || story.talking || game.busy || game.mode !== 'world') return;
    const all = plans();
    const inQ = inQuarter();
    const m = myPos();
    for (const id of MANAGED) {
      const p = all[id];
      const e = person(id);
      const r = rec(id);
      if (r.walking || p === 'keep') continue;
      if (!p || !inQ) { if (e && !e.indoor) story.remove(id); r.key = null; continue; }
      if (p.vanish) {
        if (!e) { r.key = p.key; continue; }
        if (r.key === p.key) { story.remove(id); continue; }
        r.key = p.key;
        walkVia(id, p).then((ok) => { if (ok && !story.inRoom && !disposed && person(id)) story.remove(id); });
        continue;
      }
      if (!e) {
        const from = p.from && Math.hypot(m.x - p.from.x, m.z - p.from.z) < 40 ? p.from : null;
        const ne = spawnOut(id, { x: (from || p).x, z: (from || p).z, heading: (from || p).h ?? 0 });
        if (!ne) continue;
        r.key = p.key;
        if (from) { place(ne, { ...from, h: from.h ?? 0 }); walkVia(id, p).then((ok) => { const e2 = person(id); if (ok && e2) { place(e2, p); r.arrived = now(); } }); }
        else { place(ne, p); r.arrived = now(); }
        continue;
      }
      if (r.key !== p.key) {
        r.key = p.key;
        const far = Math.hypot(e.p.root.position.x - p.x, e.p.root.position.z - p.z) > 80;
        if (far) { place(e, p); r.arrived = now(); continue; }
        walkVia(id, p).then((ok) => { const e2 = person(id); if (ok && e2) { place(e2, p); r.arrived = now(); } });
      }
    }
  }
  const ttAt = (key) => rec('toetoe').key === key && !rec('toetoe').walking && !!person('toetoe') && !person('toetoe').walking;

  // ---- Ma Wint War at home
  story.spawn('wintwar', { x: aboutDoor.x + 2.6, z: aboutDoor.z + 1.2, heading: -Math.PI / 2 });
  story.setJob('wintwar', { area: { x: aboutDoor.x + 3.5, z: aboutDoor.z + 2.2, r: 3.2 }, spot: { x: aboutDoor.x + 2.6, z: aboutDoor.z + 1.2, h: -0.4 }, mood: 'read', workChance: 0.5, workFor: [5, 9] });

  // ---------------------------------------------------------------------------------------------
  // taps on things that are really there (no outline, no marker): outdoors through story.tapHooks
  // ---------------------------------------------------------------------------------------------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function groundAt(sx, sy) {
    ndc.set((sx / game.viewW) * 2 - 1, -(sy / game.viewH) * 2 + 1);
    ray.setFromCamera(ndc, game.camera);
    return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
  }
  const project = (x, y, z) => game.rig.project(v3.set(x, y, z), game.viewW, game.viewH);
  const TAPS = [
    { id: 'plate', x: P.lamp.x, y: 1.48, z: P.lamp.z + 0.12, stand: { x: P.lamp.x, z: P.lamp.z + 1.0 }, when: () => true, go: tapPlate },
    { id: 'ball', x: SP.lamp.x + 0.45, y: 0.12, z: SP.lamp.z + 0.5, stand: { x: SP.lamp.x + 1.1, z: SP.lamp.z + 1.1 }, when: () => ttAt('stop2') && !F('s2a'), go: tapBall },
    { id: 'box', x: P.planters[0].x, y: 0.3, z: P.planters[0].z, stand: { x: -22.9, z: 94.0 }, when: () => true, go: tapBox },
    { id: 'bed', x: -4.2, y: 0.3, z: 93.2, stand: { x: -4.2, z: 94.2 }, when: () => true, go: tapBed },
    { id: 'rim', x: P.rackPots[0].x, y: P.rackPots[0].y, z: P.rackPots[0].z, stand: { x: 48.25, z: 122.15 }, when: () => true, go: () => look('rim', true) },
    { id: 'sun', x: P.rackPots[1].x, y: P.rackPots[1].y, z: P.rackPots[1].z, stand: { x: 48.25, z: 122.15 }, when: () => true, go: () => look('sun', true) },
    { id: 'dent', x: P.rackPots[2].x, y: P.rackPots[2].y, z: P.rackPots[2].z, stand: { x: 48.25, z: 122.15 }, when: () => true, go: () => look('dent', true) },
    { id: 'kiln', x: KILN.x, y: 1.0, z: KILN.z, stand: { x: KILN.x, z: KILN.z + 1.4 }, when: () => true, go: tapKiln },
    { id: 'shelf', x: 48.7, y: 0.9, z: 115.75, stand: { x: 48.7, z: 116.75 }, when: () => true, go: tapShelf },
    { id: 'board', ...story.board.target, stand: story.board.stand, when: () => true, go: tapBoard },
  ];
  const tapHook = (sx, sy) => {
    if (disposed || story.inRoom || !story.foot.active || story.talking || game.busy || game.mode !== 'world') return false;
    // the see-saw stop: Maya looks down at the ruled lines (any ground tap round the see-saw, not on Toe Toe)
    if (ttAt('stop3') && F('s3asked') && !F('stopSeesaw')) {
      const g = groundAt(sx, sy);
      const tt = person('toetoe');
      const q = tt && project(tt.p.root.position.x, 0.7, tt.p.root.position.z);
      if (g && Math.hypot(g.x - SEESAW.x, g.z - SEESAW.z) < 5.5 && !(q && Math.hypot(q.x - sx, q.y - sy) < 50)) { beat(stopSeesaw); return true; }
    }
    let best = null, bd = 44;
    for (const t of TAPS) {
      if (!t.when()) continue;
      if (Math.hypot(story.foot.pos.x - t.x, story.foot.pos.y - t.z) > 24) continue;
      const q = project(t.x, t.y, t.z);
      if (!q) continue;
      const d = Math.hypot(q.x - sx, q.y - sy);
      if (d < bd) { bd = d; best = t; }
    }
    if (!best) return false;
    const run = () => beat(best.go);
    const fp = story.foot.pos;
    if (Math.hypot(fp.x - best.stand.x, fp.y - best.stand.z) < 1.3) run();
    else story.foot.walkTo(best.stand.x, best.stand.z, (ok) => { if (ok !== false && !story.talking) { game.maya.root.rotation.y = Math.atan2(best.x - story.foot.pos.x, best.z - story.foot.pos.y); run(); } });
    return true;
  };
  story.tapHooks = story.tapHooks || [];
  story.tapHooks.push(tapHook);

  // ---------------------------------------------------------------------------------------------
  // the gate desk (and the stage desk): write what is seen, not what was heard, then the ribbon rises
  // ---------------------------------------------------------------------------------------------
  const ow = story.openWorld;
  const light0 = ow?.lightDesk;
  if (ow && light0) {
    ow.lightDesk = async (d) => {
      if (story.talking || game.busy) return;
      const q = d.id === 'gate' ? [L.deskGateQ, L.deskGate] : d.id === 'stage' ? [L.deskStageQ, L.deskStage] : null;
      if (q) {
        story.talking = true;
        game.ui.cinema(true);
        try {
          call(game.maya, 'emote', 'think');
          await D.say('maya', [q[0]], { face: 'think' });
          for (;;) {
            const i = await D.choose(q[1]);
            if (i === 0) break;
            await D.say('maya', L.deskWrong, { face: 'think' });
          }
        } finally { story.talking = false; game.ui.cinema(false); }
      }
      await light0.call(ow, d);
      if (d.id === 'gate' && !F('desk')) {
        F('desk', true);
        for (const r of ['shop', 'kiln', 'stage']) hear(r);
        await beat(() => D.say('maya', L.deskDone, { face: 'happy' }));
      }
      if (d.id === 'stage') { F('stageDesk', true); proof('stage'); }
    };
  }

  // ---------------------------------------------------------------------------------------------
  // what people say
  // ---------------------------------------------------------------------------------------------
  const talk = {
    wintwar: async () => {
      if (!F('morning')) return morning();
      if ((F('ch3Done') || F('trial')) && !F('wwEve')) { await D.say('wintwar', L.wwEvening, { face: 'smile' }); F('wwEve', true); applyProps(); return; }
      if (F('board')) return D.say('wintwar', L.wwAfterBoard, { face: 'smile' });
      return D.say('wintwar', L.wwLater);
    },
    toetoe: (e) => (story.inRoom ? ttRoom(e) : ttOut(e)),
    hninwai: async () => {
      if (!story.inRoom) return D.say('hninwai', L.hwAfter, { face: 'happy' });
      if (F('class')) await hwStand();
      if (!F('hwMet')) { await D.say('hninwai', L.hw1, { face: 'think' }); F('hwMet', true); return; }
      if (F('ownWords') && !F('ch3Done')) return closeCh3();
      if (F('stopPlanter') && !F('ownWords')) return D.say('maya', L.hwMarking, { face: 'smile' });
      return D.say('hninwai', L.hwWait, { face: 'smile' });
    },
    micho: async () => {
      if (!F('mcMet')) return michoHeap();
      if (F('trial')) return D.say('micho', L.mcAfter, { face: 'smile' });
      if (!story.inRoom && !F('shaped')) return D.say('micho', L.mcIn, { face: 'smile' });
      if (F('shaped')) return D.say('micho', L.mcCarryLater, { face: 'smile' });
      if (F('load')) return shapeFlow();
      if (F('ohnTalk')) return loadFlow();
      if (F('ohnWatch')) return D.say('micho', L.mcBeforeTalk, { face: 'worried' });
      return D.say('maya', L.mcWedge, { face: 'think' });
    },
    dawohn: async () => {
      if (F('trial')) { if (!F('ohEndSaid')) { F('ohEndSaid', true); return D.say('dawohn', L.ohEnd, { face: 'think' }); } return D.say('dawohn', L.ohAfter, { face: 'think' }); }
      if (F('ohnTalk')) return D.say('dawohn', L.ohBusy, { face: 'think' });
      if (F('looked') && !F('mcMet')) return D.say('dawohn', L.ohMichoOut, { face: 'think' });
      if (F('looked')) return ohnTalk();
      if (F('ohnWatch')) return D.say('dawohn', L.ohBusy, { face: 'think' });
      return refusal();
    },
    sunwe: async () => {
      met('sunwe');
      if (F('ch3Done') && !F('snAfter')) { F('snAfter', true); return D.say('sunwe', L.snAfter3, { face: 'surprised' }); }
      const i = rot('sunwe', L.sn.length);
      await D.say('sunwe', [L.sn[i]], { face: i === 0 ? 'worried' : 'smile' });
      if (i === 3) hear('shop');
    },
    maungnge: async () => {
      met('maungnge');
      const i = rot('maungnge', L.mn.length);
      await D.say('maungnge', [L.mn[i]], { face: 'smile' });
      if (i === 3) hear('stage');
      if (i === 4) hear('kiln');
    },
    yeyint: async () => {
      met('yeyint');
      if (F('ch3Done') && !F('yyAfter')) { F('yyAfter', true); return D.say('yeyint', L.yyAfter3, { face: 'think' }); }
      const i = rot('yeyint', L.yy.length);
      await D.say('yeyint', [L.yy[i]], { face: i === 0 ? 'happy' : 'smile' });
      if (i === 1) proof('stage');
    },
  };

  // ---------------------------------------------------------------------------------------------
  // 4. morning post at home
  // ---------------------------------------------------------------------------------------------
  async function morning() {
    const m = myPos();
    await morningPost(story, {
      day: 2,
      walkUp: Math.hypot(m.x, m.z) < 30,
      ww: L.ww1,
      slept: L.slept,
      after: L.ww2,
      letters: [{ from: 'phothar', text: L.ptNote }],
      liftCaption: { sheep: L.sheep },
      lift: { sheep: L.sheepMaya },
      where: L.ww3,
    });
    hear('pass');
    person('wintwar')?.p.emote('wave');
  }

  // arrival: the first step on the Quarter's paper; two late pupils run past to the school's blue door
  async function arrive() {
    F('arrived', true);
    proof('pass');
    if (story.foot.active && !story.talking) await beat(() => D.say('maya', L.arrive, { face: 'happy' }));
    else story.bark('maya', L.arrive[0], 3600);
    const W = await looks();
    const m = myPos();
    const kids = [];
    for (const [k, dx] of [['pupil', -0.35], ['pupilGirl', 0.35]]) {
      if (!W[k]) continue;
      const p = createPerson(W[k]);
      p.root.position.set(m.x + 1.6 + dx, 0, Math.max(41.5, m.z - 2.5));
      scene.add(p.root);
      kids.push(p);
      runPath(p, pts([4.4 + dx, Math.max(44, m.z + 1)], [4.4 + dx, 90.1], [-11.5 + dx, 90.1], [-11.5, 88.9]), 3.0);
    }
    if (kids[0]) game.ui.bark?.(tr(L.kids1), { face: kids[0].portrait('happy'), ms: 3000 });
    await wait(3400);
    if (kids[1] && !disposed) game.ui.bark?.(tr(L.kids2), { face: kids[1].portrait('smile'), ms: 3600 });
  }

  // ---------------------------------------------------------------------------------------------
  // 5. chapter 3 · Toe Toe
  // ---------------------------------------------------------------------------------------------
  async function ttOut(e) {
    const key = rec('toetoe').key;
    if (F('ch3Done')) return D.say('toetoe', L.ttReplant, { face: 'happy' });
    if (!F('walk')) {
      if (!F('ttMet')) { await D.say('toetoe', L.tt1, { face: 'sad', mood: 'down' }); F('ttMet', true); }
      else await D.say('toetoe', [L.tt1[1]], { face: 'sad' });
      if (!F('class')) await D.say('toetoe', L.ttTeacher, { face: 'think' });
      for (;;) {
        const i = await D.choose(L.ttChoices);
        if (i === 0) { await D.say('toetoe', L.ttRecite, { face: 'sad' }); await D.say('maya', L.ttReciteMaya, { face: 'think' }); continue; }
        if (i === 1) { await D.say('toetoe', L.ttTold, { face: 'think' }); await D.say('maya', L.ttToldMaya, { face: 'think' }); continue; }
        break;
      }
      e.p.setMood(null); e.baseMood = null;
      await D.say('toetoe', L.ttYes, { face: 'worried' });
      F('walk', true);
      return;
    }
    if (key === 'door' && !F('ttDoorSaid')) { await D.say('toetoe', L.ttDoor, { face: 'smile' }); F('ttDoorSaid', true); return; }
    if (key === 'shopdoor') { await D.say('toetoe', L.ttInShop, { face: 'smile' }); F('ttInShop', true); return; }
    if (key === 'stop2') return D.say('toetoe', L.ttAtLamp, { face: 'smile' });
    if (key === 'stop3' && !F('s3asked')) return askSeesaw();
    if (key === 'stop3' && !F('stopSeesaw')) return D.say('toetoe', L.s3Look, { face: 'think' });
    if (key === 'stop4' && !F('s4asked')) return askPlanter();
    return D.say('toetoe', L.ttWaiting, { face: 'smile' });
  }

  async function askSeesaw() {
    await D.say('maya', L.s3Maya, { face: 'smile' });
    F('s3asked', true);
    await D.say('toetoe', L.s3Look, { face: 'think' });
    s3t = 0;
  }
  async function stopSeesaw() {
    pair('toetoe');
    await D.say('maya', L.s3Hint, { face: 'think' });
    await D.say('toetoe', L.s3, { face: 'happy', emote: 'cheer' });
    F('stopSeesaw', true);
  }
  async function askPlanter() {
    await D.say('maya', L.s4Maya, { face: 'think' });
    F('s4asked', true);
  }
  async function tapBox() {
    if (!(ttAt('stop4') && F('s4asked'))) return D.say('maya', L.s4Box, { face: 'think' });
    pair('toetoe');
    await D.say('maya', L.s4Box, { face: 'think' });
    F('s4box', true);
    if (F('s4bed')) return stopPlanter();
  }
  async function tapBed() {
    if (!(ttAt('stop4') && F('s4asked'))) return D.say('maya', L.s4Bed, { face: 'smile' });
    await D.say('maya', L.s4Bed, { face: 'smile' });
    F('s4bed', true);
    if (F('s4box')) return stopPlanter();
  }
  async function stopPlanter() {
    // his box and the class flower bed stand ~19 m apart: whichever she looked at last, he runs over to
    // her (else the two-shot can't hold them both and the camera stays on an empty planter)
    const tt = person('toetoe'), mp = story.foot.pos;
    if (tt && Math.hypot(tt.p.root.position.x - mp.x, tt.p.root.position.z - mp.y) > 2.6) {
      const sx = tt.p.root.position.x < mp.x ? -1.15 : 1.15;
      await Promise.race([story.walkPerson('toetoe', mp.x + sx, mp.y + 0.05, 2.6), wait(9000)]);
      const e = person('toetoe');
      if (e && Math.hypot(e.p.root.position.x - mp.x, e.p.root.position.z - mp.y) > 2.6) { e.walking = null; e.p.root.position.set(mp.x + sx, 0, mp.y + 0.05); e.ob.x = mp.x + sx; e.ob.z = mp.y + 0.05; }
    }
    pair('toetoe');
    await D.say('toetoe', L.s4, { face: 'surprised', emote: 'cheer' });
    await D.say('toetoe', L.s4Out, { face: 'happy' });
    F('stopPlanter', true);
  }
  async function tapBall() {
    pair('toetoe');
    await D.say('maya', L.s2aMaya, { face: 'smile' });
    await D.say('toetoe', L.s2a, { face: 'surprised' });
    F('s2a', true);
    return lampDone();
  }
  async function tapPlate() {
    await D.say('maya', L.plate, { face: 'think' });
    if (!ttAt('stop2') || F('s2b')) return;
    pair('toetoe');
    await D.say('maya', L.s2bMaya, { face: 'smile' });
    await D.say('toetoe', L.s2b, { face: 'think' });
    F('s2b', true);
    return lampDone();
  }
  async function lampDone() {
    if (!(F('s2a') && F('s2b'))) return;
    await D.say('toetoe', L.s2Out, { face: 'happy' });
    F('stopLamp', true);
  }

  // ---- inside: the snack shop (stop 1), the classroom (the class, match, talk, own words, close)
  async function ttRoom() {
    if (story.inRoom === 'snackshop') return F('stopShop') ? D.say('toetoe', L.s1Out, { face: 'happy' }) : D.say('toetoe', L.ttInShop, { face: 'smile' });
    if (story.inRoom !== 'classroom') return D.say('toetoe', L.ttWaiting, { face: 'smile' });
    if (!F('stopPlanter')) return D.say('toetoe', [L.tt1[1]], { face: 'sad' });
    if (!F('ownWords')) await ttStand();
    if (!F('matched')) return matchFlow();
    if (!F('ttTalk')) return ttTalk();
    if (!F('ownWords')) return ownFlow();
    if (!F('ch3Done')) return D.say('toetoe', L.ttWaitsHw, { face: 'worried' });
    return D.say('toetoe', L.ttAfter, { face: 'happy' });
  }
  async function stop1() {
    const sc = story.room?.parts?.scale;
    // she steps back from the counter to him, in front of the bins (the bins hid him behind them), the
    // scale in view behind the two of them
    const tt = person('toetoe');
    if (tt && story.inRoom === 'snackshop') {
      const at = { x: -1.4, z: 0.85 };
      tt.walking = null; tt.p.root.position.set(at.x, 0, at.z); tt.home = { x: at.x, z: at.z, h: Math.PI / 2 }; tt.ob.x = at.x; tt.ob.z = at.z;
      await Promise.race([new Promise((r) => story.foot.walkTo(-0.55, 0.85, () => r())), wait(3500)]);
    }
    pair('toetoe');
    await D.say('toetoe', L.s1, { face: 'smile' });
    proof('shop');
    await D.say('maya', L.s1Maya, { face: 'smile' });
    call(sc, 'setTilt', -0.6);
    await D.say('toetoe', L.s1Tt, { face: 'surprised' });
    call(sc, 'setTilt', 0);
    F('stopShop', true);
    await D.say('toetoe', L.s1Out, { face: 'happy' });
    // he runs out ahead to the next stop (outdoors he waits at the lamp)
    const room = story.room;
    const door = room?.spots?.door;
    if (door && person('toetoe')) {
      Promise.race([story.walkPerson('toetoe', door.x, door.z, 1.8), wait(5000)]).then(() => { if (story.inRoom === 'snackshop' && person('toetoe')?.indoor) story.remove('toetoe'); });
    }
  }
  async function matchFlow() {
    await D.say('maya', L.ttBooks, { face: 'smile' });
    const r = await match({ title: L.matchTitle, hint: L.matchHint, pairs: L.matchStops.map((s, i) => ({ left: s, right: L.matchPages[i] })) });
    if (!r.ok) return; // cancelled: his books stay out; tap him again
    if (r.mistakes) await D.say('toetoe', L.matchWrong, { face: 'think', auto: true });
    await D.say('toetoe', L.matchDone, { face: 'surprised' });
    F('matched', true);
    return ttTalk();
  }
  async function ttTalk() {
    if (story.talk.waiting(TALK_D2_TOETOE.id)) return D.say('toetoe', L.ttNotYet, { face: 'think' });
    const r = await story.talk.run(TALK_D2_TOETOE);
    if (!r.won) { if (!r.busy) { await D.say('toetoe', L.ttNotYet, { face: 'think' }); setTimeout(() => call(story.talk, 'clearWait', TALK_D2_TOETOE.id), 15000); } return; }
    F('ttTalk', true);
    return ownFlow();
  }
  async function ownFlow() {
    const fr = L.ownFrags;
    const r = await ownwords({ title: L.ownTitle, hint: L.ownHint, prompt: L.ownPrompt, fragments: fr.map((f) => ({ my: f.my, en: f.en, good: f.good })), need: 3 });
    if (!r.ok) return;
    const wrongKinds = [...new Set((r.picks || []).map((i) => fr[i]?.kind).filter(Boolean))];
    if (wrongKinds.length) await D.say('toetoe', [L.ownReact[wrongKinds[0]]], { face: 'think' });
    await D.say('toetoe', [L.ownReact.ok], { face: 'happy' });
    F('ownWords', true);
    await D.say('maya', L.mayaOwn, { face: 'smile' });
    await D.say('toetoe', L.ttToDesk, { face: 'smile' });
    // he carries his exercise book across the room to her desk himself
    Promise.race([story.walkPerson('toetoe', TT_BY_DESK.x, -2.5, 1.2), wait(6000)]).then(() => { const e = person('toetoe'); if (e) e.p.root.rotation.y = TT_BY_DESK.h; }); // (beside her desk, on the far side from where she stands to talk: never between the lens and the pair)
  }
  // in the classroom after the lesson she marks at her desk up on the platform; to talk she steps out to
  // the platform's front edge (beside the desk, not behind it), and Maya stands below her
  const TT_BY_DESK = { x: -3.35, z: -3.35, y: 0.2, h: 1.1 }; // up on the platform past her desk's far end: behind the pair, never in the lens's foreground
  async function hwStand() {
    const room = story.room, hw = person('hninwai');
    if (story.inRoom !== 'classroom' || !hw || !room) return;
    // his book is on her desk: he waits at its end (after a reload too), not in front of the desks
    const tt = person('toetoe');
    if (tt && F('ownWords') && !F('ch3Done') && Math.hypot(tt.p.root.position.x - TT_BY_DESK.x, tt.p.root.position.z - TT_BY_DESK.z) > 0.3) {
      tt.walking = null; tt.p.root.position.set(TT_BY_DESK.x, TT_BY_DESK.y, TT_BY_DESK.z); tt.p.root.rotation.y = TT_BY_DESK.h;
      tt.home = { x: TT_BY_DESK.x, z: TT_BY_DESK.z, h: TT_BY_DESK.h }; tt.ob.x = TT_BY_DESK.x; tt.ob.z = TT_BY_DESK.z;
    }
    const s = room.spots?.hninwai;
    const at = { x: -1.75, z: -3.0, y: s?.y ?? 0.2, h: 0.5 };
    if (s && Math.hypot(hw.p.root.position.x - at.x, hw.p.root.position.z - at.z) > 0.3) {
      hw.walking = null; hw.p.root.position.set(at.x, at.y, at.z); hw.p.root.rotation.y = at.h;
      hw.home = { x: at.x, z: at.z, h: at.h }; hw.ob.x = at.x; hw.ob.z = at.z;
    }
    const fp = story.foot.pos;
    if (Math.hypot(fp.x - (at.x + 0.55), fp.y - (at.z + 0.75)) > 0.35) {
      await Promise.race([new Promise((r) => story.foot.walkTo(at.x + 0.55, at.z + 0.75, () => r())), wait(4000)]);
    }
    pair('hninwai');
  }
  // in the classroom he gets up from his desk (it stood between the camera and the two of them) and
  // stands with her in the open space before the platform, his books in his arms
  async function ttStand() {
    const tt = person('toetoe');
    if (story.inRoom !== 'classroom' || !tt) return;
    const at = { x: 1.3, z: -2.35, h: -Math.PI / 2 };
    if (Math.hypot(tt.p.root.position.x - at.x, tt.p.root.position.z - at.z) > 0.3) {
      tt.walking = null; tt.p.root.position.set(at.x, 0, at.z); tt.p.root.rotation.y = at.h;
      tt.home = { x: at.x, z: at.z, h: at.h }; tt.ob.x = at.x; tt.ob.z = at.z;
    }
    const fp = story.foot.pos;
    if (Math.hypot(fp.x - 0.2, fp.y - at.z) > 0.35) await Promise.race([new Promise((r) => story.foot.walkTo(0.2, at.z, () => r())), wait(4000)]);
    pair('toetoe');
  }
  async function closeCh3() {
    await D.say('hninwai', L.hwEnd, { face: 'happy' });
    const room = story.room;
    const door = room?.spots?.door || { x: 0, z: 3.5 };
    // at the classroom door as he leaves (down off the platform first: walks keep their height)
    { const t = person('toetoe'); if (t) t.p.root.position.y = 0; }
    await Promise.race([story.walkPerson('toetoe', door.x + 0.6, door.z - 0.9, 1.4), wait(5000)]);
    // she goes after him: his last words and the seeds in a two-shot (not his voice from off the frame)
    await Promise.race([new Promise((r) => story.foot.walkTo(door.x - 0.55, door.z - 0.9, () => r())), wait(5000)]);
    pair('toetoe');
    await D.say('toetoe', L.ttEnd, { face: 'happy' });
    story.give('seeds');
    await D.say('toetoe', L.ttAfter, { face: 'think' });
    F('ch3Done', true);
    applyProps();
    call(game.audio, 'play', 'chime');
    // he goes out to replant in the sun; she goes out to pin his line beside the chart
    for (const id of ['toetoe', 'hninwai']) {
      const e = person(id);
      if (!e) continue;
      const d = room?.spots?.door || door;
      Promise.race([story.walkPerson(id, d.x, d.z, 1.4), wait(6000)]).then(() => { if (person(id)?.indoor) story.remove(id); });
    }
  }

  async function classScene() {
    const room = story.room;
    if (!room) return;
    const W = await looks();
    const pupils = [];
    for (const [spot, look] of PUPILS) {
      const s = room.spots?.[spot];
      if (!s || !W[look]) continue;
      const p = createPerson(W[look]);
      p.root.position.set(s.x, 0, s.z);
      p.root.rotation.y = Math.PI; // facing the board
      p.root.userData.isPerson = true;
      room.scene.add(p.root);
      pupils.push(p);
    }
    const tt = person('toetoe');
    const ttHere = tt && !F('stopPlanter');
    await beat(async () => {
      game.rig.shot(new THREE.Vector3(1.3, 1.85, 4.4), new THREE.Vector3(-0.2, 0.95, -2.0), 0.9);
      await wait(500);
      for (const p of pupils) p.talk?.(3);
      await sayAs(L.chorusName, L.classChant, pupils[0]?.portrait('happy'));
      await D.say('hninwai', L.hwAsk, { face: 'smile' });
      await D.say('maya', ttHere ? L.classQuiet : L.classQuietNoTt, { face: 'think' });
      call(game.audio, 'play', 'ring');
      await D.say('maya', L.bell, { face: 'smile', auto: true });
      // the children run out to the playground; Toe Toe goes to his bean box
      for (const p of pupils) runPath(p, [{ x: p.root.position.x, z: 2.6 }, { x: 0, z: 2.9 }, { x: 0, z: 3.9 }], 2.6);
      if (ttHere) Promise.race([story.walkPerson('toetoe', 0, 3.4, 1.6), wait(6000)]).then(() => { if (person('toetoe')?.indoor) story.remove('toetoe'); });
      // the teacher sits down at her desk to mark
      const hw = person('hninwai'), s = room.spots?.hninwai;
      if (hw && s) { hw.walking = null; hw.p.root.position.set(s.x, s.y || 0, s.z); hw.p.root.rotation.y = s.h || 0; hw.home = { x: s.x, z: s.z, h: s.h || 0 }; hw.ob.x = s.x; hw.ob.z = s.z; }
      await wait(1400);
    });
    F('class', true);
    const hw = person('hninwai');
    if (hw && !disposed) {
      await story.talkTo(hw);
      if (F('stopPlanter') && !F('matched') && person('toetoe')) await story.talkTo(person('toetoe'));
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 6. chapter 5 · Daw Ohn and Mi Cho
  // ---------------------------------------------------------------------------------------------
  async function michoHeap() {
    await D.say('micho', L.mc1, { face: 'sad' });
    await D.say('micho', L.mcIn, { face: 'smile' });
    F('mcMet', true);
  }
  async function refusal() {
    if (!F('ohnNo')) { await D.say('dawohn', L.oh1, { face: 'think' }); F('ohnNo', true); }
    else await D.say('dawohn', L.ohAgain, { face: 'smile' });
    for (;;) {
      const i = await D.choose(L.ohChoices);
      if (i === 0) { await D.say('maya', L.ohLeave, { face: 'think' }); return; }
      if (i === 1) { await D.say('dawohn', L.ohWrong, { face: 'hot', emote: 'fists' }); await D.say('maya', L.ohWrongMaya, { face: 'think' }); F('ohnSteam', 1); continue; }
      break;
    }
    await D.say('dawohn', L.ohWatch, { face: 'think' });
    F('ohnWatch', true);
  }
  async function look(id, outside = false) {
    if (!F('ohnWatch')) return D.say('maya', outside ? L.rackBefore : L.noTouch, { face: 'think' });
    const l = L.looks[id];
    if (F(`look.${id}`)) return D.say('maya', [l.gold], { face: 'think' });
    call(game.audio, 'play', 'chalk');
    await D.say('maya', [l.pencil, l.gold], { face: 'think' });
    call(game.audio, 'play', 'sparkle');
    F(`look.${id}`, true);
    if (!F('looked') && LOOKS.every((k) => F(`look.${k}`))) {
      await D.say('maya', L.sameDiff, { face: 'surprised' });
      F('looked', true);
    }
  }
  async function tapKiln() {
    await D.say('maya', L.kiln, { face: 'think' });
    proof('kiln');
  }
  async function ohnTalk() {
    if (story.talk.waiting(TALK_D2_DAWOHN.id)) return D.say('dawohn', L.ohNotYet, { face: 'think' });
    const data = F('ohnSteam') ? { ...TALK_D2_DAWOHN, steam: TALK_D2_DAWOHN.steam + 1 } : TALK_D2_DAWOHN;
    const r = await story.talk.run(data);
    if (!r.won) { if (!r.busy) { await D.say('dawohn', L.ohNotYet, { face: 'think' }); setTimeout(() => call(story.talk, 'clearWait', TALK_D2_DAWOHN.id), 15000); } return; }
    F('ohnTalk', true);
    return loadFlow();
  }
  async function loadFlow() {
    if (!person('micho')) return;
    // Mi Cho steps up beside her for the load question (from her wedging board she spoke with her back
    // to the lens, filling a corner of the frame): a two-shot of the two of them
    const mc = person('micho'), mp = story.foot.pos;
    const md = Math.hypot(mc.p.root.position.x - mp.x, mc.p.root.position.z - mp.y);
    const oh = person('dawohn')?.p.root.position; // (on Maya's other side from the wheel)
    const side = oh ? (oh.x < mp.x ? 1.1 : -1.1) : 1.1;
    if (md > 1.6 || md < 0.8) await Promise.race([story.walkPerson('micho', mp.x + side, mp.y + 0.1, 1.4), wait(4000)]);
    pair('micho');
    await D.say('micho', L.mcLoadQ, { face: 'worried' });
    for (;;) {
      const i = await D.choose(L.mcChoices);
      if (i === 0) { await D.say('micho', L.mcTwelve, { face: 'sad' }); continue; }
      if (i === 1) { await D.say('micho', L.mcOne, { face: 'think' }); continue; }
      break;
    }
    await D.say('micho', L.mcFour, { face: 'happy' });
    F('load', 4);
    return shapeFlow();
  }
  async function shapeFlow() {
    const room = story.room;
    const mc = person('micho'), s = room?.spots?.micho;
    if (mc && s) { mc.walking = null; mc.p.root.position.set(s.x, 0, s.z); mc.p.root.rotation.y = s.h || 0; mc.home = { x: s.x, z: s.z, h: s.h || 0 }; mc.ob.x = s.x; mc.ob.z = s.z; }
    call(room?.parts?.spin, 'micho', 2.2);
    let r;
    for (;;) {
      r = await shape({ title: L.shapeTitle, hint: L.shapeHint, loads: [4], best: 4, rounds: 4, day: 26 });
      if (r.cancelled) { call(room?.parts?.spin, 'micho', 0); return; }
      if (r.ok) break;
      await D.say('micho', L.shapeAgain, { face: 'think' });
    }
    call(room?.parts?.spin, 'micho', 0);
    F('shaped', true);
    F('cracked', r.cracked | 0);
    await D.say('maya', L.ohShaping, { face: 'smile' });
    await D.say('micho', L.mcCarry, { face: 'happy' });
    startCarry();
  }
  let board = null;
  function startCarry() {
    if (!board) board = P.potBoard();
    story.carry(board, { with: person('micho') ? 'micho' : null, axis: 'x', length: 1.2, lift: 0.62 });
  }
  async function tapShelf() {
    if (!(F('shaped') && !F('trial') && story.carrying === board)) return D.say('maya', L.shadeShelf, { face: 'think' });
    story.carry(null, { remove: true });
    board = null;
    F('trial', true);
    applyProps();
    call(game.audio, 'play', 'thud');
    if (person('micho')) { pair('micho'); await D.say('micho', L.mcEnd, { face: 'happy' }); } // (the chapter's last words: a two-shot, not the high street camera)
    await D.say('maya', L.mayaEnd, { face: 'think' });
  }
  // the sunny rack while carrying: Mi Cho says no; otherwise the rack's three cracked pots are looks
  for (const t of TAPS) if (['rim', 'sun', 'dent'].includes(t.id)) {
    const go = t.go;
    t.go = async () => { if (F('shaped') && !F('trial') && story.carrying === board) { if (person('micho')) await D.say('micho', L.mcNotSun, { face: 'think' }); else await D.say('maya', L.mcNotSun, { face: 'think' }); return; } return go(); };
  }

  // ---------------------------------------------------------------------------------------------
  // 8.2 the "ask Maya" board at home
  // ---------------------------------------------------------------------------------------------
  async function tapBoard() {
    if (!(F('ch3Done') || F('trial'))) return D.say('maya', L.boardEmpty, { face: 'smile' });
    if (F('board')) return D.say('maya', L.boardDone, { face: 'smile' });
    if (!F('wwEve')) { F('wwEve', true); applyProps(); }
    await D.say('maya', L.boardMaya, { face: 'happy' });
    await D.say('maya', [L.boardPick], { face: 'think' });
    const ni = await D.choose(L.board.map((n) => ({ my: `${n.from.my} — ${n.my}`, en: `${n.from.en} — ${n.en}` })));
    const rj = await D.choose(L.board[ni].replies);
    F('board', true);
    F('boardNote', ni);
    F('boardReply', rj);
    applyProps();
    call(game.audio, 'play', 'page');
    await D.say('maya', L.boardDone, { face: 'smile' });
  }

  // ---------------------------------------------------------------------------------------------
  // 9. the night page (at the Writing Room door, as Day 1)
  // ---------------------------------------------------------------------------------------------
  let nightBusy = false;
  async function night() {
    if (nightBusy) return;
    nightBusy = true;
    const who = ['toetoe', 'hninwai', 'dawohn', 'micho', ...['sunwe', 'maungnge', 'yeyint'].filter((id) => F(`met.${id}`))];
    try {
      await nightPage(story, {
        day: 2,
        truth: { q: L.nightQ, choices: L.nightChoices, right: 1, wrong: L.nightWrong },
        before: async () => {
          await D.say('maya', L.seedsPlant, { face: 'smile' });
          save.home.bed = { seeds: 'toetoe', planted: 2 };
          story.take('seeds', 1, { quiet: true });
          // the notebook's back page, "Reply to the letter": Act 1's pencil line (struck out on Day 8)
          save.notebook.reply = [...(save.notebook.reply || []).filter((r) => r.day !== 2), { day: 2, my: L.replyLine.my, en: L.replyLine.en, pencil: true }];
          F('replyLine', true);
        },
        sleep: { q: L.sleepQ, who },
        stamps: [3],
        stampText: L.stampText,
        extra: L.page5,
        tomorrow: L.tomorrow,
      });
    } finally { nightBusy = false; }
  }

  // ---------------------------------------------------------------------------------------------
  // rooms (doors.js hooks)
  // ---------------------------------------------------------------------------------------------
  function roomCast(id) {
    if (id === 'classroom') {
      const list = [];
      if (!F('ch3Done')) list.push({ id: 'hninwai', spot: F('class') ? 'hninwai' : 'hninwaiBoard' });
      if ((!F('class') && !F('ttMet')) || (F('stopPlanter') && !F('ch3Done'))) list.push({ id: 'toetoe', spot: 'toetoe' });
      return list;
    }
    if (id === 'snackshop') return F('ttDoorSaid') && !F('stopShop') ? [{ id: 'toetoe', spot: 'toetoe' }] : [];
    if (id === 'pottershed') {
      const list = [{ id: 'dawohn', spot: 'dawohn' }];
      if (F('mcMet') && !(F('shaped') && !F('trial'))) list.push({ id: 'micho', spot: F('load') && !F('shaped') ? 'micho' : 'michoWedge' });
      return list;
    }
    return undefined; // quartertea: the room's own (tea master, Su Nwe, two drinkers)
  }
  async function enterRoom(id) {
    closeCam();
    if (id === 'classroom') {
      if (!F('class')) return classScene();
      if (F('stopPlanter') && !F('matched') && person('toetoe')) { await wait(400); return story.talkTo(person('toetoe')); }
    }
    if (id === 'snackshop' && F('ttDoorSaid') && !F('stopShop')) F('ttInShop', true);
    if (id === 'pottershed' && F('shaped') && !F('trial') && !story.carrying) startCarry();
  }
  function station(id) {
    const map = {
      'sn-scale': () => (person('toetoe') && F('ttDoorSaid') && !F('stopShop') ? stop1() : D.say('maya', [{ my: '(ချိန်ခွင်။ ကိုယ့်ဟာကိုယ် ချိန်ရတာ။)', en: '(The pan scale. You weigh for yourself here.)' }], { face: 'smile' })), // DRAFT(my)
      'sn-note': async () => { await D.say('maya', L.shopNote, { face: 'surprised' }); proof('shop'); },
      'sn-prices': () => D.say('maya', L.shopPrices, { face: 'think' }),
      'sn-tin': () => D.say('maya', L.shopTin, { face: 'smile' }),
      'sn-bins': () => D.say('maya', L.shopBins, { face: 'smile' }),
      'ps-oldshelf': () => look('oldShelf'),
      'ps-dawohnwheel': () => look('hands'),
      'ps-master': () => look('masterWheel'),
      'ps-hands': () => D.say('maya', L.handprints, { face: 'think' }),
      'ps-michowheel': () => D.say('maya', L.michoWheel, { face: 'think' }),
      'qt-counter': async () => { if (!F('tmSaid')) { F('tmSaid', true); await sayAs(L.tmName, L.tm); } else await sayAs(L.tmName, L.tmHello); },
      'qt-sunwe': () => talk.sunwe(),
      'cl-posters': () => D.say('maya', [{ my: '(နံရံပေါ်က ပိုစတာလေးတွေ: ဂဏန်း၊ နေနဲ့ ဘောလုံး၊ မီးတိုင်၊ လမ်းပြမြေပုံ။)', en: '(Posters on the wall: numbers, the sun and a ball, a lamp, a route map.)' }], { face: 'smile' }), // DRAFT(my)
      'cl-board': () => D.say('maya', [{ my: '(ကျောက်သင်ပုန်းပေါ်မှာ ပဲစိုက်ကဗျာ။)', en: '(The bean rhyme, in chalk on the board.)' }], { face: 'smile' }), // DRAFT(my)
    };
    const fn = map[id];
    if (!fn) return false;
    beat(fn);
    return true;
  }
  const onRoom = (ev) => {
    const { id, inside } = ev.detail || {};
    if (inside || disposed) return;
    // just outside again: Mi Cho comes out with the pots; everyone else takes their place
    if (id === 'pottershed' && F('shaped') && !F('trial') && board) {
      const mp = game.maya.root.position;
      let mc = person('micho');
      if (!mc) mc = spawnOut('micho', { x: mp.x - 1.3, z: mp.z - 0.2, heading: 0 });
      if (mc) { mc.job = null; rec('micho').key = 'carry'; }
      if (board.parent !== scene) scene.add(board);
      startCarry();
    }
    setTimeout(sync, 60);
  };
  document.addEventListener('rc:room', onRoom);

  // ---------------------------------------------------------------------------------------------
  // test hooks (window.__day2)
  // ---------------------------------------------------------------------------------------------
  const api = {
    F, P, plans, sync, recs,
    beats: BEATS.map((b) => b[0]),
    /** Set every flag up to and including `beat` (see BEATS), give the day's items so far, re-place people. */
    skipTo(beatName) {
      const k = BEATS.findIndex((b) => b[0] === beatName);
      if (k < 0) return false;
      for (let i = 0; i <= k; i++) for (const f of BEATS[i][1]) {
        if (f.startsWith('rumour.')) { const r = f.slice(7); if (PROOFS[r]) proof(r); continue; }
        F(f, f === 'load' ? 4 : true);
      }
      if (F('ch3Done') && !story.has('seeds')) story.give('seeds', 1, { quiet: true });
      if (F('trial')) F('cracked', 0);
      // the board's pinned reply (as tapBoard sets it): Day 3 and Day 10 read d2.boardNote / d2.boardReply
      if (F('board') && F('boardNote') == null) { F('boardNote', 0); F('boardReply', 0); }
      applyProps();
      for (const r of recs.values()) r.key = null;
      for (const id of MANAGED) { const e = person(id); if (e && !e.indoor) story.remove(id); }
      sync();
      return true;
    },
    /** Put Maya (on foot) at a world point: __day2.go(-12, 92). */
    go(x, z, h = 0) { story.openWorld?.jump(x, z, h); },
    night,
  };
  window.__day2 = api;

  // ---------------------------------------------------------------------------------------------
  // the module
  // ---------------------------------------------------------------------------------------------
  let syncT = 0;
  let s3t = 0; // (the see-saw stop: how long she has stood by him since she asked)
  const called = new Set();
  let wwWalking = false;
  return {
    talk,
    roomCast,
    roomOpts: (id) => (id === 'pottershed' ? { load: 4 } : {}),
    enterRoom: (id) => enterRoom(id).catch((e) => console.error('day2 enterRoom', e)),
    leaveRoom() { /* people and carried things are put right by the rc:room event once she is outside */ },
    station,
    /** The page turns in place: this page's props, people, hooks and wrappers go away. */
    dispose() {
      disposed = true;
      document.removeEventListener('rc:room', onRoom);
      const k = story.tapHooks.indexOf(tapHook);
      if (k >= 0) story.tapHooks.splice(k, 1);
      if (ow && light0) ow.lightDesk = light0;
      if (story.carrying === board && board) story.carry(null, { remove: true });
      for (const r of runners) { r.p.root.removeFromParent(); r.p.dispose(); }
      runners.length = 0;
      for (const id of [...MANAGED, 'wintwar']) { const e = person(id); if (e && !e.indoor) story.remove(id); }
      story.spawn = spawn0;
      P.dispose();
      if (window.__day2 === api) delete window.__day2;
    },
    async start() {
      if (!F('morning')) {
        if (!story.foot.active && !story.inRoom) await story.foot.toFoot();
        story.refreshHud?.();
        const ww = person('wintwar');
        const m = myPos();
        if (ww && Math.hypot(m.x - aboutDoor.x, m.z - aboutDoor.z) < 20) {
          ww.paused = true;
          await Promise.race([story.walkPerson('wintwar', m.x + 1.15, m.z + 0.05, 1.5), wait(8000)]);
          setTimeout(() => { ww.paused = false; }, 4000);
          await story.talkTo(ww);
        } else await beat(morning);
      }
    },
    update(dt) {
      if (disposed) return;
      stepRunners(dt);
      if ((syncT -= dt) <= 0) { syncT = 0.5; sync(); }
      if (story.inRoom || story.talking || game.busy || game.mode !== 'world') return;
      const m = myPos();
      const onFoot = story.foot.active;
      // arrival on the Quarter's ruled paper
      if (!F('arrived') && F('morning') && m.z > 41.8) { arrive().catch((e) => console.error('day2 arrive', e)); return; }
      // Toe Toe walks ahead and waits: at his door he names the way; at the shop door he goes in
      const tt = person('toetoe');
      if (tt && onFoot && !tt.walking && !rec('toetoe').walking) {
        const tp = { x: tt.p.root.position.x, z: tt.p.root.position.z };
        const key = rec('toetoe').key;
        if (key === 'door' && !F('ttDoorSaid') && near(m, tp, 2.6)) { story.talkTo(tt); return; }
        if (key === 'shopdoor' && near(m, tp, 3.0)) { F('ttInShop', true); return; }
        if (key === 'stop3' && !F('s3asked') && near(m, tp, 3.4)) { story.talkTo(tt); return; }
        if (key === 'stop4' && !F('s4asked') && near(m, tp, 3.4)) { story.talkTo(tt); return; }
        // the see-saw stop: standing by him a while after she asked, she looks down at what he is looking at
        if (key === 'stop3' && F('s3asked') && !F('stopSeesaw') && onFoot && near(m, tp, 3.4)) {
          if ((s3t += dt) > 9) { s3t = 0; beat(stopSeesaw); return; }
        } else s3t = 0;
        // he calls once from the next stop if she dawdles
        const r = rec('toetoe');
        if (['door', 'shopdoor', 'stop2', 'stop3', 'stop4'].includes(key) && !called.has(key) && r.arrived && now() - r.arrived > 20000 && !near(m, tp, 12) && near(m, tp, 45)) {
          called.add(key);
          story.bark('toetoe', key === 'shopdoor' ? L.ttCallIn : L.ttCall, 3200);
        }
      }
      if (P.ball) {
        const show = rec('toetoe').key === 'stop2' && !F('s2a') && !!tt && !tt.walking;
        P.ball.visible = show;
        if (show) P.ball.position.set(SP.lamp.x + 0.45, 0.11, SP.lamp.z + 0.5);
      }
      // back home after a chapter: Ma Wint War comes over about the notes on the Post Office wall
      if ((F('ch3Done') || F('trial')) && !F('wwEve') && onFoot && m.z < 17 && !wwWalking) {
        const ww = person('wintwar');
        if (ww) {
          wwWalking = true;
          ww.paused = true;
          Promise.race([story.walkPerson('wintwar', m.x + 1.15, m.z + 0.05, 1.6), wait(7000)])
            .then(() => { ww.paused = false; return story.talkTo(ww); })
            .finally(() => { wwWalking = false; });
          return;
        }
      }
      // the night page: back at the Writing Room door once both chapters' day parts are done
      if (F('ch3Done') && F('trial') && !F('done')) {
        const p = onFoot ? m : null;
        const d = aboutDoor;
        const atDoor = p ? Math.hypot(p.x - d.x, p.z - d.z) < 1.8 : Math.hypot(game.car.root.position.x - d.x, game.car.root.position.z - (d.z + 3)) < 2.2;
        if (atDoor) night().catch((e) => console.error('day2 night', e));
      }
    },
  };
}
