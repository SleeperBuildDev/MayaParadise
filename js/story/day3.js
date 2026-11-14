// Day 3 (the Exercise-Book Quarter, second visit) — chapters 5 လက်လျှော့ခြင်း (Giving Up, act 2: the kiln
// opens) and 9 ကရုဏာ (Compassion), and the main quest's first lean: Nay Chi asks which road, Maya answers.
//
// Lessons (day3-spec 13, INDEX 14):
//   ch 5 (p39-45)  don't give up on a person; the teacher asks herself "is it my teaching?"; a way that
//                  worked for you proves nothing for others; "can't" becomes "not yet".
//   ch 9 (p55-56)  meet someone who knows less without "not our level" or talking down; see no fault in what
//                  he doesn't know yet; guide at his pace; nobody gets everything.
//   main (p44-45)  Maya answers for Nay Chi: it feels like success (the cost waits for Day 8).
//
// Beats, in play order (any order between the three goals):
//   1. morning post   outside the Writing Room Ma Wint War calls from the Post Office side door; inside the
//                     sorting room (`sortingroom`): notebook line, Toe Toe's letter, the Why-Parrot, the "where"
//   2. ch 5           the potter's yard: the kiln waits for Maya, three taps (ring / thud) → inside the shed
//                     (`pottershed`): Daw Ohn asks herself, then Maya; W choice; the chalk «သေး»; storage pot
//   3. ch 9           the classroom (`classroom`): marks-sheet hook → four looks (two at her desk, two at his
//                     cart outside) → Su Nwe's talk → `guide` → `trace` 'boat' → he delivers the potter's parcel
//   4. main           the border tea shop (`bordertea`): Nay Chi's talk; her last stone is hers; Maya answers
//   5. optional       the road's end (proof roadEnd), the "ask Maya" board (7 notes) on the Post Office wall
//   6. night          at the Writing Room: true sentence, look-alike `wouldnt` gone, the cracked pot home, stamps 5 + 9
//
// No guidance anywhere: people say where; doors, smoke and voices are seen. Inside rooms the close low follow
// camera (and the talk's two-shot) replaces the whole-room view. Burmese lines (day3-lines.js) are drafts.
//
// Test hooks: window.__day3 = { state(), skipTo(beat), go(place), enter(room), beats, places }
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { VoxelBuilder, jitter } from '../game/voxel.js';
import { toon, addOutline, blobShadow } from '../game/toon.js';
import { trace } from './acts/trace2.js';
import { guide } from './acts/guide.js';
import { dryingShelf, pot } from './props2.js';
import { parcelCart, markSheet, paperBoat, jobNotice, kilnSmoke, teaShop } from './props3.js';
import { morningPost, nightPage, showSlip } from './post.js';
import { createPerson } from './people.js';
import { DOORS, registerDoors } from './doors.js';
import { ITEMS as Q_ITEMS } from './world/regions/quarter.js';
import { SORT_DOOR } from './world/regions/home.js';
import { TALK_D3_SUNWE, TALK_D3_NAYCHI } from './talks/day3.js';
import { L } from './day3-lines.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- places (world metres; +Z is south). Region data: world/regions/quarter.js, Home Book landmarks.
const P = {
  aboutDoor: { x: 0, z: 7.0 }, // the Writing Room's door (Home Book)
  // the sorting room's narrow green side door on the Post Office's west wall (world/regions/home.js SORT_DOOR,
  // the one door every day uses); poOut: just outside it, on the street side
  poSide: { x: SORT_DOOR.x, z: SORT_DOOR.z },
  poOut: { x: SORT_DOOR.x - 0.75, z: SORT_DOOR.z },
  kiln: { x: 57.7, z: 113.2 }, // the brick kiln's mouth (potter item x + 7.2)
  chimney: { x: 58.5, z: 111.3, y: 4.0 },
  kShelf: { x: 55.0, z: 114.8 }, // the open kiln's shelf: Daw Ohn's twelve cool here
  shaded: { x: 48.8, z: 115.75 }, // the shaded shelf under the eave: Mi Cho's four
  shards: { x: 41.6, z: 116.0 }, // the shard heap at the yard's west end
  yard: { x: 52.0, z: 116.2 }, // the kiln scene's centre
  shedDoor: { x: 46, z: 114.5 },
  cart: { x: -7.3, z: 88.15 }, // Maung Nge's cart on the footpath east of the school door
  schoolDoor: { x: -11.5, z: 88.6 },
  stage: { x: -12.2, z: 142.0 },
  sign: { x: 0.6, z: 158.2 }, // the border sign
  pageEnd: { x: 7, z: 250.5 }, // where the road stops at the torn edge
};
// the kiln scene's marks: Maya on the street's near kerb, Mi Cho and Daw Ohn just north of her on the yard strip
// (each pair across the street's line: the two-shot then looks along the street, not over the drying pots)
const K = { maya: { x: 52.4, z: 117.35 }, micho: { x: 51.7, z: 116.05 }, ohn: { x: 53.05, z: 116.0 } };
const ROOM_CAM = { tilt: 30, width: 4.6, widthLandscape: 9.5, minHeight: 0, height: 0.9, stiffness: 5, bounds: null }; // close and low, as outdoors
const OWNED = ['wintwar', 'dawohn', 'micho', 'sunwe', 'hninwai', 'maungnge', 'yeyint', 'naychi'];
const BEATS = ['morning', 'kiln', 'taps', 'shed', 'hook', 'looks', 'talk', 'guide', 'boat', 'delivery', 'naychi', 'board', 'night'];
// the flags that must be true to begin each beat (skipTo applies every set up to the chosen beat)
const BEAT_FLAGS = {
  morning: {},
  kiln: { morning: true, 'card.sorted': true, wwIn: true },
  taps: { kilnOpen: true },
  shed: { 'ring.mine': true, 'ring.hers': true, 'ring.shards': true, rang: true, 'rumour.kiln2': true },
  hook: { ohnAsked: true, glad: true, chalk: true, ch5Done: true, crackedPot: true },
  looks: { hook9: true, 'card.notyet': true },
  talk: { 'look9.timetable': true, 'look9.stub': true, 'look9.cart': true, 'look9.rope': true, looked9: true, 'card.price': true, 'rumour.parcels': true },
  guide: { snTalk: true },
  boat: { guided: true },
  delivery: { boat: true, ch9Done: true },
  naychi: { delivered: true },
  board: { ncMet: true, ncAnswered: true, ncRoad: 'shed' },
  night: { wwEvening: true, board: true },
};

export { SLEPT3 } from './day4-lines.js'; // tonight's hosts' lines (the copy Day 4's morning reads)

export async function create(story) {
  const { game, dialog: D, save, people } = story;
  const F = (k, v) => story.flag(`d3.${k}`, v);
  const scene3 = game.world.scene;
  const v3 = new THREE.Vector3();
  const objs = []; // outdoor props this page adds (dispose() takes them away)
  const obs = []; // keep-out shapes this page adds to the open world's space
  const scripted = new Set(); // people a script is moving right now (the cast sync leaves them alone)
  const roomBits = []; // props added inside the current room (removed on leaving)
  let disposed = false;
  let busy = false; // a day scene is playing

  // ---------------------------------------------------------------------------------------------
  // small helpers
  // ---------------------------------------------------------------------------------------------
  const add = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; scene3.add(o); objs.push(o); return o; };
  const addOb = (o) => { obs.push(o); if (story.openWorld?.space) story.openWorld.space.add([o]); else story.foot.obstacles.push(o); return o; };
  const at = () => (story.foot.active ? { x: story.foot.pos.x, z: story.foot.pos.y } : { x: game.car.root.position.x, z: game.car.root.position.z });
  const near = (p, r) => { const m = at(); return Math.hypot(m.x - p.x, m.z - p.z) < r; };
  const goals = () => (F('ch5Done') ? 1 : 0) + (F('ch9Done') ? 1 : 0) + (F('ncAnswered') ? 1 : 0);
  const hasParrot = () => story.companions?.has?.('parrot');
  const nameEl = () => document.querySelector('#dialog .dialog-name');
  const spot = (name) => story.room?.spots?.[name] || null;
  /** Indoors: back to the close, low follow camera (doors.js's roomCam), never the whole-room view. */
  function closeCam() {
    if (disposed || !story.inRoom) return;
    try { if (story.doors?.roomCam) story.doors.roomCam(); else game.rig.setFollow(ROOM_CAM); } catch (err) { console.warn('day3 room camera', err); }
  }

  /** A line from someone with no cast entry (the tea-shop keeper, a pupil, the parrot). */
  async function sayAs(name, p, lines) {
    const el = nameEl();
    if (el) el.textContent = tr(name);
    call(p, 'talk', 3);
    await game.ui.say(Array.isArray(lines) ? lines : [lines], { face: p ? p.portrait('smile') : undefined, onTick: () => call(game.audio, 'play', 'type') });
    call(p, 'talk', 0);
    if (el) el.textContent = tr({ my: 'မာရာ', en: 'Maya' });
  }
  /** The parrot's walk-about question: once each, never answered. */
  function parrotAsks(key) {
    if (!hasParrot() || F(`parrot.${key}`)) return;
    F(`parrot.${key}`, true);
    call(game.audio, 'play', 'chirp');
    call(game.ui, 'bark', `${tr(L.parrotName)}: ${tr(L.parrotWalk[key])}`, { ms: 4600 });
  }
  /** Rumours: pencil when heard, ink (a proof slip) when seen. */
  function hear(id) { if (!save.pencil[`rumour:${id}`]) { save.pencil[`rumour:${id}`] = 'pencil'; story.persist(); } }
  function check(id) {
    if (F(`rumour.${id}`) && story.has(`proof:${id}`)) return;
    F(`rumour.${id}`, true);
    story.flag(`rumour.${id}`, 'checked');
    save.pencil[`rumour:${id}`] = 'ink';
    save.proofs[id] = L.proof[id];
    story.give(`proof:${id}`);
  }
  /** Walk someone, never hanging the scene: after `ms` they are simply there. */
  async function walkP(id, x, z, ms = 9000, speed = 1.3) {
    const e = people.get(id);
    if (!e) return;
    const done = await Promise.race([story.walkPerson(id, x, z, speed).then(() => true), wait(ms).then(() => false)]);
    if (!done && people.get(id) === e) {
      e.walking = null;
      e.p.root.position.set(x, 0, z);
      e.ob.x = x; e.ob.z = z; e.home.x = x; e.home.z = z;
    }
  }
  /** Walk Maya (indoors or out) to a point; resolves on arrival or after `ms`. */
  function walkMaya(x, z, ms = 7000) {
    return new Promise((res) => {
      let done = false;
      const fin = () => { if (!done) { done = true; res(); } };
      try { story.foot.walkTo(x, z, fin); } catch { fin(); }
      setTimeout(fin, ms);
    });
  }
  function face(id, h) { const e = people.get(id); if (e) { e.p.root.rotation.y = h; e.home.h = h; } }
  function faceEachOther(a, b) {
    const pa = a === 'maya' ? game.maya.root.position : people.get(a)?.p.root.position;
    const pb = b === 'maya' ? game.maya.root.position : people.get(b)?.p.root.position;
    if (!pa || !pb) return;
    if (a === 'maya') { story.foot.walker.heading = Math.atan2(pb.x - pa.x, pb.z - pa.z); game.maya.root.rotation.set(0, story.foot.walker.heading, 0); } else face(a, Math.atan2(pb.x - pa.x, pb.z - pa.z));
    if (b !== 'maya') face(b, Math.atan2(pa.x - pb.x, pa.z - pb.z));
  }
  /** The shot on a scene's speakers: the talk's own low two-shot (story.twoShot: across the pair's line, from
   *  the side with nothing in the way, backed off just enough to fit both) on the first two of `ids` (Maya and
   *  whoever speaks); both turn a little toward it (a three-quarter view) and, indoors, whatever stands in
   *  front of the pair dissolves (story.talkWith). A lone speaker gets a low shot from the front. */
  function frame(ids, { dist = 3.6, h = 1.5 } = {}) {
    const ent = (id) => (id && typeof id === 'object' ? id : id === 'maya' ? null : people.get(id));
    const pos = (id) => (id && typeof id === 'object' ? id.p?.root.position : id === 'maya' ? game.maya.root.position : people.get(id)?.p.root.position);
    const two = ids.filter((id) => pos(id)).slice(0, 2);
    if (two.length === 2 && story.twoShot) {
      const a = pos(two[0]), b = pos(two[1]);
      if (Math.hypot(a.x - b.x, a.z - b.z) < 5) {
        const az = story.twoShot(a, b);
        const cheat = (h0) => { let d = az - h0; d = Math.atan2(Math.sin(d), Math.cos(d)); return h0 + d * 0.45; };
        for (const id of two) {
          if (id === 'maya') {
            const hm = cheat(game.maya.root.rotation.y);
            if (story.foot?.walker) story.foot.walker.heading = hm;
            game.maya.root.rotation.set(0, hm, 0);
          } else { const e = ent(id); if (e?.p) e.p.root.rotation.y = cheat(e.p.root.rotation.y); }
        }
        const other = two.map(ent).find((e) => e?.p);
        if (other && story.inRoom) story.talkWith = other;
        return;
      }
    }
    const pts = ids.map(pos).filter(Boolean);
    if (!pts.length) return;
    const mx = pts.reduce((a, p) => a + p.x, 0) / pts.length, mz = pts.reduce((a, p) => a + p.z, 0) / pts.length;
    let spread = 0;
    for (const p of pts) spread = Math.max(spread, Math.hypot(p.x - mx, p.z - mz));
    const portrait = game.viewW < game.viewH;
    const d = (portrait ? dist * 1.45 : dist) + spread * (portrait ? 2.2 : 1.2);
    game.rig.shot(new THREE.Vector3(mx, h + spread * 0.35, mz + d), new THREE.Vector3(mx, 0.75, mz), 0.9);
  }
  /** A shot on a point that shows about `width` metres across on this screen (a narrow phone backs off further),
   *  from azimuth `az` (0 = from the south) and `tilt` radians above the ground. */
  function wideShot(look, { width = 3.4, az = 0.5, tilt = 0.45 } = {}) {
    const cam = game.rig.camera || game.camera;
    const ta = Math.tan(THREE.MathUtils.degToRad(cam?.fov || 45) / 2), aspect = Math.min(1, cam?.aspect || game.viewW / game.viewH);
    const d = Math.max(3, width / 2 / (ta * aspect)), ch = Math.cos(tilt);
    game.rig.shot(new THREE.Vector3(look.x + Math.sin(az) * d * ch, look.y + Math.sin(tilt) * d, look.z + Math.cos(az) * d * ch), new THREE.Vector3(look.x, look.y, look.z), 0.8);
  }
  /** One of the day's scenes: blocks taps and other scenes, letterboxed, never leaves the game stuck. */
  async function scene(fn) {
    if (busy || disposed) return false;
    // (called from a talk, story.talking is already on and talkTo tidies up after; otherwise this scene owns it)
    const own = !story.talking;
    const with0 = story.talkWith;
    busy = true;
    if (own) {
      story.talking = true;
      try { story.foot.walker.stop?.(); } catch { /* ok */ }
      game.ui.cinema(true);
    }
    try { await fn(); } catch (err) { console.error('day3 scene', err); } finally {
      busy = false;
      if (own) {
        story.talking = false;
        story.talkWith = with0 || null;
        game.ui.cinema(false);
        game.rig.release();
        closeCam();
      }
    }
    return true;
  }
  /** A look: the hearsay in pencil, then what Maya sees for herself. */
  async function look(item) { await D.say('maya', [L.heard(item.pencil), item.gold], { face: 'think' }); }
  const spoke = (id) => F(`met.${id}`, true);
  const rot = {}; // rotating ambient lines
  function next(key, list) { const i = rot[key] = ((rot[key] ?? -1) + 1) % list.length; return list[i]; }
  const SPIN = 'မရသေးဘူး'; // DRAFT(my): the chalk once Daw Ohn writes သေး into the gap
  const pending = () => !F('ch5Done') || !F('ch9Done') || !F('ncAnswered');

  // ---------------------------------------------------------------------------------------------
  // props: the kiln yard, the cart, the border sign's notices, the border tea shop, the Post Office door
  // ---------------------------------------------------------------------------------------------
  // kiln smoke: a wisp column from the chimney, seen from the avenue and the stage until the kiln opens
  const smoke = kilnSmoke({ height: 11, wind: 0.5, size: 1.1 });
  add(smoke.root, P.chimney.x, P.chimney.y, P.chimney.z);
  // the kiln door bricked shut (pulled down when Maya is there)
  const bricks = (() => {
    const v = new VoxelBuilder();
    for (let row = 0; row < 7; row++) {
      const off = row % 2 ? 0.08 : 0;
      for (let k = 0; k < 4; k++) v.box(-0.42 + off + k * 0.26, 0.08 + row * 0.15, 0, 0.24, 0.13, 0.16, jitter('#A0503A', 0.08, row * 5 + k));
    }
    v.box(0, 0.08 + 7 * 0.15 - 0.04, 0, 1.1, 0.06, 0.18, '#7E3C2B');
    return v.mesh({ px: 1.2 });
  })();
  add(bricks, P.kiln.x, 0, P.kiln.z + 0.12);
  // Daw Ohn's twelve on the kiln's shelf, Mi Cho's own count on the shaded shelf, the shard heap
  const kShelf = dryingShelf([]);
  add(kShelf.root, P.kShelf.x, 0, P.kShelf.z);
  addOb({ type: 'box', minX: P.kShelf.x - 0.9, maxX: P.kShelf.x + 0.9, minZ: P.kShelf.z - 0.3, maxZ: P.kShelf.z + 0.3 });
  const shaded = dryingShelf([]);
  add(shaded.root, P.shaded.x, 0, P.shaded.z);
  addOb({ type: 'box', minX: P.shaded.x - 0.9, maxX: P.shaded.x + 0.9, minZ: P.shaded.z - 0.3, maxZ: P.shaded.z + 0.3 });
  // (three cracked pots merged into one mesh + one blob shadow: 2 draw calls instead of 9, phone budget)
  const heap = new THREE.Group();
  heap.name = 'shardHeap';
  {
    const geos = [];
    [[0, 0, 0.2, 1], [0.35, 0.12, -0.9, 0.9], [-0.3, 0.18, 1.7, 0.85]].forEach(([x, z, ry, s]) => {
      const p = pot('cracked', s);
      p.root.position.set(x, 0, z); p.root.rotation.set(0, ry, 0.5 * (x ? 1 : 0)); p.root.updateMatrixWorld(true);
      p.root.traverse((m) => { if (m.isMesh && m.material?.vertexColors) geos.push(m.geometry.clone().applyMatrix4(m.matrixWorld)); });
      p.dispose();
    });
    let g = null;
    try { g = THREE.mergeGeometries(geos, false); } catch { g = null; }
    if (g) { const m = new THREE.Mesh(g, toon('#ffffff', { vertexColors: true })); addOutline(m, { px: 1.6 }); heap.add(m); }
    for (const x of geos) if (x !== g) x.dispose();
    heap.add(blobShadow(0.62, 0.42, 0.45)).children.at(-1).position.y = 0.01;
  }
  add(heap, P.shards.x, 0, P.shards.z);
  addOb({ type: 'circle', x: P.shards.x, z: P.shards.z, r: 0.55 });
  // Maung Nge's cart: a drawing on every parcel, three paper boats on the ledge
  const cart = parcelCart({ parcels: [{ picture: 'pot' }, { picture: 'jasmine' }, { picture: 'book' }, { picture: 'scale' }] });
  add(cart.root, P.cart.x, 0, P.cart.z, 0);
  const cartOb = addOb({ type: 'box', minX: P.cart.x - 0.75, maxX: P.cart.x + 0.75, minZ: P.cart.z - 0.38, maxZ: P.cart.z + 0.38 });
  let cartFollow = null; // the person pushing it
  // the two job notices pinned to the border sign's posts
  const notices = L.noticeText.map((t, i) => {
    const n = jobNotice(t);
    add(n.root, P.sign.x + (i ? 1.62 : -1.62), 1.2 + i * 0.12, P.sign.z + 0.13, (i ? -0.06 : 0.05));
    return n;
  });
  // the border tea shop: a one-room tin-roofed shop on the avenue's west side, door in its east wall
  const tea = (() => {
    const w = 5.2, d = 4.4;
    // the clearest yard spot near (-4.5, 153.5) (the yards are seeded; the shop is new to the region)
    let best = null;
    for (const z0 of [153.5, 152.7, 154.3, 151.9]) {
      for (const x0 of [-4.5, -5.3, -3.9, -6.2]) {
        const bx0 = x0 - d / 2 - 0.4, bx1 = x0 + d / 2 + 0.4, bz0 = z0 - w / 2 - 0.4, bz1 = z0 + w / 2 + 0.4;
        const n = Q_ITEMS.filter((it) => it.k !== 'tufts' && it.x > bx0 - (it.w || 1) / 2 && it.x < bx1 + (it.w || 1) / 2 && it.z > bz0 - (it.d || 1) / 2 && it.z < bz1 + (it.d || 1) / 2).length;
        if (!best || n < best.n) best = { x0, z0, n };
      }
    }
    const shop = teaShop({ w, d, h: 3.0 });
    add(shop.root, best.x0, 0, best.z0, Math.PI / 2); // front (+Z local) turned to face east, onto the avenue
    call(shop, 'setSteam', 1);
    // local (x, z) -> world for a quarter turn: (x0 + z, z0 - x)
    const dl = shop.door || { x: -0.9, z: d / 2 };
    const door = { x: best.x0 + dl.z + 0.05, z: best.z0 - dl.x };
    addOb({ type: 'box', minX: best.x0 - d / 2, maxX: best.x0 + d / 2 - 0.12, minZ: best.z0 - w / 2, maxZ: best.z0 + w / 2 });
    return { shop, door, x0: best.x0, z0: best.z0 };
  })();
  // (the sorting room's side door and the "ask Maya" board are the Home Book's own: home.js, story.board)
  // doors: register the two this page needs if no region file has them yet
  const myDoors = [];
  function regDoor(d) { if (!DOORS[d.room]) { registerDoors([d]); myDoors.push(d.room); } }
  regDoor({ room: 'bordertea', x: tea.door.x, z: tea.door.z, facing: Math.PI / 2, region: 'exercise', r: 0.85 });

  /** Props follow the flags (also after skipTo). */
  function applyState() {
    const open = !!F('kilnOpen');
    bricks.visible = !open;
    smoke.setOn(open ? 0 : 1);
    kShelf.setPots(open ? Array.from({ length: 12 }, () => ({ kind: 'whole', size: 0.95 })) : []);
    const load = Math.max(1, Math.min(8, +story.flag('d2.load') || 4));
    const cracked = Math.max(0, Math.min(load, +story.flag('d2.cracked') || 0));
    shaded.setPots(open ? Array.from({ length: load }, (_, i) => ({ kind: i >= load - cracked ? 'cracked' : 'whole', size: 0.78 })) : []);
    if (F('delivered') && !cartFollow) { cart.root.position.set(44.2, 0, 116.9); cart.root.rotation.y = 0; moveOb(cartOb, 44.2, 116.9); }
    // the shared "ask Maya" board: yesterday's three (one with Maya's reply), seven by this evening
    story.board.set({ notes: F('wwEvening') || F('board') ? 7 : 3, replies: (story.flag('d2.boardNote') != null ? 1 : 0) + (F('boardReply') ? 1 : 0) });
  }
  function moveOb(o, x, z) { const hw = (o.maxX - o.minX) / 2, hd = (o.maxZ - o.minZ) / 2; o.minX = x - hw; o.maxX = x + hw; o.minZ = z - hd; o.maxZ = z + hd; }
  applyState();

  // ---------------------------------------------------------------------------------------------
  // the day's people outdoors (the region's ambient copies give way to these)
  // ---------------------------------------------------------------------------------------------
  function outside() {
    const o = {};
    const evening = goals() >= 2 && !F('wwEvening') && F('morning');
    o.wintwar = (!F('morning') && !F('wwIn')) || evening ? { key: 'door', x: P.poOut.x, z: P.poOut.z + 0.45, h: -Math.PI / 2 } : null;
    if (!F('rang')) o.dawohn = { key: 'kiln', x: 56.3, z: 114.95, h: -0.25, job: { area: { x: 55.4, z: 115.5, r: 1.4 }, spot: { x: 56.3, z: 114.95, h: 0 }, mood: 'work', workChance: 0.6, workFor: [5, 9] } };
    else if (!F('ch5Done')) o.dawohn = null; // inside the shed, waiting with the tea
    else o.dawohn = { key: 'doorway', x: 46.9, z: 115.55, h: 0.2, job: { area: { x: 47.4, z: 116.1, r: 1.0 }, spot: { x: 46.9, z: 115.55, h: 0.2 }, mood: 'read', workChance: 0.5, workFor: [6, 10] } };
    o.micho = !F('rang') ? { key: 'yard', x: 50.1, z: 116.45, h: 0.35, job: { area: { x: 50.4, z: 116.6, r: 1.2 }, spot: { x: 50.1, z: 116.45, h: 0.3 }, mood: 'work', workChance: 0.5, workFor: [5, 9] } } : null;
    o.sunwe = F('ch9Done') ? { key: 'bench', x: -3.6, z: 99.6, h: -0.4, job: { area: { x: -5.5, z: 99.8, r: 2.4 }, spot: { x: -3.2, z: 99.8, h: -0.6 }, mood: 'read', workChance: 0.7, workFor: [6, 12] } } : null;
    o.hninwai = null; // in her classroom all day
    if (!F('ch9Done')) o.maungnge = { key: 'cart', x: P.cart.x + 1.05, z: P.cart.z + 0.25, h: -Math.PI / 2 + 0.5 };
    else if (!F('delivered') || Date.now() - (F('deliveredAt') || 0) < 45000) o.maungnge = 'keep';
    else o.maungnge = { key: 'stage', x: -10.6, z: 143.3, h: 0.2, job: { area: { x: -12, z: 142.8, r: 2.6 }, spot: { x: -10.6, z: 143.2, h: 0 }, mood: 'play', workChance: 0.4, speed: 1.1 } };
    o.yeyint = { key: 'stage', x: P.stage.x, z: P.stage.z, h: 0, job: { area: { x: -13, z: 142.5, r: 2.0 }, spot: { x: -13, z: 141.9, h: 0 }, mood: 'read', workChance: 0.7, workFor: [6, 12] } };
    o.naychi = null; // in the border tea shop, then the sorting room
    return o;
  }
  function syncCast() {
    if (disposed || story.inRoom || game.mode !== 'world' || story.talking) return;
    const want = outside();
    for (const id of OWNED) {
      if (scripted.has(id)) continue;
      const w = want[id];
      if (w === 'keep') continue;
      let e = people.get(id);
      if (!w) { if (e) story.remove(id); continue; }
      if (e && e.__d3 === w.key) continue;
      if (e) story.remove(id);
      e = story.spawn(id, { x: w.x, z: w.z, heading: w.h });
      if (!e) continue;
      e.__d3 = w.key;
      if (w.job) story.setJob(id, w.job); else e.job = null;
    }
  }
  syncCast();

  // ---------------------------------------------------------------------------------------------
  // outdoor taps on things (no markers: the things themselves are tapped)
  // ---------------------------------------------------------------------------------------------
  const taps = [
    { id: 'mine', x: P.shaded.x, y: 0.9, z: P.shaded.z, stand: { x: P.shaded.x, z: P.shaded.z + 1.0 }, when: () => F('kilnOpen') && !F('rang'), fn: () => kilnTap('mine') },
    { id: 'hers', x: P.kShelf.x, y: 0.9, z: P.kShelf.z, stand: { x: P.kShelf.x - 0.2, z: P.kShelf.z + 1.0 }, when: () => F('kilnOpen') && !F('rang'), fn: () => kilnTap('hers') },
    { id: 'shards', x: P.shards.x, y: 0.3, z: P.shards.z, stand: { x: P.shards.x + 0.3, z: P.shards.z + 1.0 }, when: () => F('kilnOpen') && !F('rang'), fn: () => kilnTap('shards') },
    { id: 'cart', x: P.cart.x - 0.15, y: 0.75, z: P.cart.z, stand: { x: P.cart.x - 0.2, z: P.cart.z + 1.0 }, when: () => F('hook9') && !F('ch9Done'), fn: () => outsideLook('cart') },
    { id: 'rope', x: P.cart.x + 0.55, y: 0.65, z: P.cart.z + 0.3, stand: { x: P.cart.x + 0.5, z: P.cart.z + 1.0 }, when: () => F('hook9') && !F('ch9Done'), fn: () => outsideLook('rope') },
    { id: 'notice0', x: P.sign.x - 1.62, y: 1.2, z: P.sign.z + 0.13, stand: { x: P.sign.x - 1.6, z: P.sign.z + 1.0 }, fn: () => scene(() => D.say('maya', [L.notices[0]], { face: 'think' })) },
    { id: 'notice1', x: P.sign.x + 1.62, y: 1.32, z: P.sign.z + 0.13, stand: { x: P.sign.x + 1.6, z: P.sign.z + 1.0 }, fn: () => scene(() => D.say('maya', [L.notices[1]], { face: 'think' })) },
    { id: 'board', ...story.board.target, stand: story.board.stand, fn: () => openBoard() },
  ];
  const pv = new THREE.Vector3();
  function tapHook(x, y) {
    if (disposed || story.inRoom || !story.foot.active || story.talking || busy || game.busy || game.mode !== 'world') return false;
    let best = null, bd = 44;
    for (const t of taps) {
      if (t.when && !t.when()) continue;
      const q = game.rig.project(pv.set(t.x, t.y, t.z), game.viewW, game.viewH);
      if (!q) continue;
      const d = Math.hypot(q.x - x, q.y - y);
      if (d < bd) { bd = d; best = t; }
    }
    if (!best) return false;
    // a person nearer the tap wins (they are tapped to talk)
    for (const e of people.values()) {
      const q = game.rig.project(pv.set(e.p.root.position.x, e.p.height * 0.6, e.p.root.position.z), game.viewW, game.viewH);
      if (q && Math.hypot(q.x - x, q.y - y) < bd) return false;
    }
    const m = at();
    if (Math.hypot(m.x - best.stand.x, m.z - best.stand.z) > 1.2) story.foot.walkTo(best.stand.x, best.stand.z, (ok) => { if (ok !== false && !disposed) best.fn(); });
    else best.fn();
    return true;
  }
  story.tapHooks = story.tapHooks || [];
  story.tapHooks.push(tapHook);

  // ---------------------------------------------------------------------------------------------
  // 4. the morning post
  // ---------------------------------------------------------------------------------------------
  async function wwCallOutside() {
    await D.say('wintwar', L.wwCall, { face: 'happy', emote: 'wave' });
    F('wwIn', true);
    // she goes back in through her side door; Maya follows (or not) as she likes
    scripted.add('wintwar');
    walkP('wintwar', P.poSide.x - 0.35, P.poSide.z, 14000, 1.3).then(() => { scripted.delete('wintwar'); if (!story.inRoom && people.get('wintwar') && !story.talking) story.remove('wintwar'); });
  }
  async function morning() {
    // Maya stands at her right, past the sorting table's right end (she waits there, beyond the table's corner):
    // the two-shot sees both faces from the front with no table edge, lamp or lamp cord between them
    const w0 = people.get('wintwar')?.p.root.position, m0 = game.maya.root.position;
    if (w0) { const tx = Math.min(w0.x + 1.0, 2.6), tz = w0.z + 0.1; if (Math.hypot(tx - m0.x, tz - m0.z) > 0.3) await walkMaya(tx, tz, 5000); }
    faceEachOther('maya', 'wintwar');
    frame(['maya', 'wintwar']);
    await morningPost(story, {
      day: 3,
      walkUp: false,
      ww: L.ww1,
      slept: L.slept,
      after: L.ww2,
      letters: [{ from: 'toetoe', text: L.ttNote }],
      liftCaption: { parrot: L.parrot },
    });
    if (hasParrot()) {
      call(game.audio, 'play', 'flutter');
      await sayAs(L.parrotName, null, L.parrotQ);
      await D.say('maya', L.parrotMaya, { face: 'smile' });
    }
    hear('roadEnd');
    // the "where", said; the last of it with a hand on Nay Chi's half of the rack
    await D.say('wintwar', L.ww3.slice(0, 2), { face: 'smile' });
    const ww = people.get('wintwar');
    // (Maya goes along the back of the table with her, a step to her side: one pair, the table below the shot)
    if (ww) { await Promise.all([walkP('wintwar', -0.6, -2.2, 4000, 1.2), walkMaya(0.55, -2.1, 4500)]); faceEachOther('maya', 'wintwar'); frame(['maya', 'wintwar']); }
    await D.say('wintwar', L.ww3.slice(2), { face: 'happy' });
    F('card.sorted', true);
    F('morning', true);
    if (ww) face('wintwar', 0.3);
  }

  // ---------------------------------------------------------------------------------------------
  // 5. chapter 5: the kiln waits for Maya, the taps, the shed
  // ---------------------------------------------------------------------------------------------
  let kilnStarting = false;
  async function kilnScene() {
    if (kilnStarting) return;
    kilnStarting = true;
    try {
      if (!story.foot.active) await story.foot.toFoot();
      story.refreshHud?.();
    } finally { kilnStarting = false; }
    await scene(async () => {
      syncCast();
      // the car parked in the scene's street (she drove up) would fill the foreground: it waits further west
      const cp = game.car.root.position;
      if (Math.hypot(cp.x - K.maya.x, cp.z - K.maya.z) < 9) { try { game.world.drive.placeAt(36.5, 118.4, -Math.PI / 2); game.syncCar?.(0); } catch (err) { console.warn('day3 car', err); } }
      // staged on the yard's kerb, each pair standing across the street's line (north-south), so the two-shot
      // looks along the street: the shelves stay beside or behind them, the drying yard's pots out of shot
      scripted.add('micho');
      scripted.add('dawohn');
      try {
        await Promise.all([walkMaya(K.maya.x, K.maya.z, 6000), walkP('micho', K.micho.x, K.micho.z, 5000, 1.3)]);
        faceEachOther('maya', 'micho');
        frame(['maya', 'micho']);
        await D.say('micho', L.mc1, { face: 'happy', emote: 'wave' });
        spoke('micho');
        // Daw Ohn comes over from the kiln, wiping her hands
        await walkP('dawohn', K.ohn.x, K.ohn.z, 5000, 1.2);
        faceEachOther('maya', 'dawohn');
        face('micho', Math.atan2(K.maya.x - K.micho.x, K.maya.z - K.micho.z));
        frame(['maya', 'dawohn']);
        await D.say('dawohn', L.oh1, { face: 'smile' });
        spoke('dawohn');
        // she pulls the door bricks; warm light; both loads come out whole (a shot on the kiln's mouth from the street)
        await walkP('dawohn', P.kiln.x - 0.5, P.kiln.z + 0.85, 5000);
        face('dawohn', Math.PI);
        game.rig.shot(new THREE.Vector3(P.kiln.x - 2.6, 2.0, P.kiln.z + 5.6), new THREE.Vector3(P.kiln.x - 0.3, 0.85, P.kiln.z + 0.4), 0.9);
        await wait(700);
        call(people.get('dawohn')?.p, 'emote', 'nod');
        for (let i = 0; i < 3; i++) { call(game.audio, 'play', 'thud'); await wait(260); }
        F('kilnOpen', true);
        applyState();
        game.fx?.burst?.('sparkle', v3.set(P.kiln.x, 0.8, P.kiln.z + 0.3), { count: 10, spread: 0.6, up: 0.6 });
        await wait(900);
        await walkP('dawohn', K.ohn.x, K.ohn.z, 4000);
        faceEachOther('dawohn', 'maya');
        frame(['maya', 'dawohn']);
        await D.say('dawohn', L.oh2, { face: 'smile' });
        await D.say('maya', L.oh2Maya, { face: 'think' });
      } finally { scripted.delete('micho'); scripted.delete('dawohn'); }
    });
  }
  async function kilnTap(id) {
    await scene(async () => {
      const t = L.taps[id];
      const e = people.get('micho');
      // a close, low shot on Maya and what she taps, from the street's side (east), never over the drying pots
      const tp = taps.find((x) => x.id === id), mp = game.maya.root.position;
      if (tp) {
        const lx = (tp.x + mp.x) / 2, lz = (tp.z + mp.z) / 2;
        story.foot.walker.heading = Math.atan2(tp.x - mp.x, tp.z - mp.z);
        game.maya.root.rotation.set(0, story.foot.walker.heading, 0);
        // (backed off for the screen's width, from the south-east and high enough to look over the drying rows)
        wideShot({ x: lx, y: 0.75, z: lz }, { width: 3.6, az: 0.55, tilt: 0.5 });
      }
      if (id === 'mine') {
        const load = Math.max(1, +story.flag('d2.load') || 4), cracked = Math.max(0, Math.min(load, +story.flag('d2.cracked') || 0));
        for (let i = 0; i < load; i++) { call(game.audio, 'play', i >= load - cracked ? 'thud' : 'bell'); await wait(330); }
        if (cracked) {
          await D.say('maya', [L.heard(t.pencil), { my: `ကလင် ${myN(load - cracked)} လုံး၊ ဒုတ် ${myN(cracked)} လုံး။`, en: `${load - cracked} ring, ${cracked} thud.` }], { face: 'think' }); // DRAFT(my)
          if (e) await D.say('micho', L.mcCracked, { face: 'think' });
        } else await look(t);
      } else if (id === 'hers') {
        for (let i = 0; i < 4; i++) { call(game.audio, 'play', 'bell'); await wait(240); }
        await look(t);
      } else {
        call(game.audio, 'play', 'thud');
        await wait(300);
        await look(t);
      }
      F(`ring.${id}`, true);
      if (F('ring.mine') && F('ring.hers') && F('ring.shards')) {
        await D.say('maya', L.rang, { face: 'smile' });
        F('rang', true);
        check('kiln2');
        // her clay-grey hands: she comes over and asks Maya in
        if (people.get('dawohn')) {
          scripted.add('dawohn');
          const m = game.maya.root.position;
          const sx = m.x > 50 ? -1 : 1; // (beside her, on the yard's open side)
          await walkP('dawohn', m.x + sx * 1.1, Math.min(m.z - 0.9, 116.2), 6000, 1.2);
          scripted.delete('dawohn');
          faceEachOther('maya', 'dawohn');
        }
        frame(['maya', 'dawohn']);
        await D.say('dawohn', L.ohIn, { face: 'smile' });
        for (const who of ['dawohn', 'micho']) {
          if (!people.get(who)) continue;
          scripted.add(who);
          const k = who === 'dawohn' ? 0 : 0.6;
          walkP(who, P.shedDoor.x + k, P.shedDoor.z - 0.2, 9000, 1.1).then(() => { scripted.delete(who); if (!story.inRoom && !story.talking) story.remove(who); });
        }
      }
    });
  }
  const myN = (n) => String(n).replace(/\d/g, (d) => '၀၁၂၃၄၅၆၇၈၉'[d]);
  async function shedScene() {
    await scene(async () => {
      const room = story.room;
      const s = spot('mayaD3') || { x: 0.4, z: -1.2 };
      await walkMaya(s.x, s.z, 6000);
      faceEachOther('maya', 'dawohn');
      frame(['maya', 'dawohn']);
      await D.say('dawohn', L.oh3, { face: 'think' });
      await D.say('dawohn', L.oh4, { face: 'think' });
      F('ohnAsked', true);
      for (;;) {
        const i = await D.choose(L.ohChoices);
        if (i === 0) { await D.say('dawohn', L.ohToldYou, { face: 'hot' }); await D.say('maya', L.ohToldYouMaya, { face: 'think' }); continue; }
        if (i === 1) { await D.say('dawohn', L.ohNever, { face: 'sad' }); await D.say('maya', L.ohNeverMaya, { face: 'think' }); continue; }
        break;
      }
      F('glad', true);
      await D.say('dawohn', L.ohGlad, { face: 'smile' });
      // wordless: she rubs the three crosses off Mi Cho's board with her thumb and leaves the number
      call(people.get('dawohn')?.p, 'emote', 'nod');
      call(game.audio, 'play', 'chalk');
      call(room?.parts?.tally, 'set', { rubbed: true });
      game.fx?.burst?.('sparkle', v3.set(2.75, 1.6, -3.3), { count: 8, spread: 0.3, up: 0.3 });
      await wait(700);
      // across the shed to Mi Cho's wheel; Maya and Mi Cho follow
      await Promise.all([walkP('dawohn', 1.05, 1.05, 6000), walkP('micho', 2.25, 1.0, 6000), walkMaya(0.3, 1.6, 6000)]);
      face('dawohn', Math.atan2(1.6 - 1.05, 0.4 - 1.05));
      face('micho', Math.atan2(1.6 - 2.25, 0.4 - 1.0));
      frame(['dawohn', 'micho', 'maya']);
      await D.say('dawohn', L.oh5, { face: 'think' });
      call(game.audio, 'play', 'chalk');
      call(room?.parts?.chalk, 'set', SPIN);
      game.fx?.burst?.('sparkle', v3.set(1.6, 0.9, 0.6), { count: 8, spread: 0.25, up: 0.3 });
      F('chalk', true);
      await wait(500);
      await D.say('micho', L.mc2, { face: 'happy' });
      faceEachOther('dawohn', 'maya');
      await D.say('dawohn', L.oh6, { face: 'smile' });
      await D.say('dawohn', L.oh7, { face: 'smile' });
      await D.say('micho', L.mc3, { face: 'happy', emote: 'cheer' });
      story.give('storagepot');
      await D.say('maya', L.potMaya, { face: 'smile' });
      F('ch5Done', true);
      await D.say('micho', L.mc4, { face: 'smile' });
      F('crackedPot', true); // carried home by the page, set by the home bed at the night page
    });
  }

  // ---------------------------------------------------------------------------------------------
  // 6. chapter 9: the classroom
  // ---------------------------------------------------------------------------------------------
  function hideWalkOns() {
    const sc = story.room?.scene;
    if (!sc) return;
    const mine = new Set([...people.values()].map((e) => e.p.root));
    for (const o of sc.children) if (o.userData?.isPerson && !mine.has(o) && o !== game.maya.root) o.visible = false;
  }
  async function hookScene() {
    await scene(async () => {
      // Maya waits at the aisle's front end, past Su Nwe's desk (from mayaD3 she stood right in the pair's shot)
      await walkMaya(0.25, -2.15, 6000);
      faceEachOther('maya', 'sunwe');
      // she brings the marks sheets down the aisle to Su Nwe's desk: the two-shot holds the pair close (from
      // her own desk at the front it was the whole room, everyone small)
      if (people.get('hninwai')) { await walkP('hninwai', 0.3, -1.3, 6000, 1.1); faceEachOther('hninwai', 'sunwe'); }
      frame(['hninwai', 'sunwe']);
      await D.say('hninwai', L.hw1, { face: 'smile' });
      spoke('hninwai');
      // back to the board while the knock comes (the aisle beside the desk is Maung Nge's next)
      const hb = spot('hninwaiBoard') || { x: -0.9, z: -3.3 };
      walkP('hninwai', hb.x, hb.z, 6000, 1.1).then(() => face('hninwai', hb.h ?? 0.25));
      // Maung Nge knocks and comes in with the school's parcel (a book drawn on its label)
      call(game.audio, 'play', 'door');
      const ds = spot('door') || { x: 0, z: 3.5 };
      story.spawn('maungnge', { x: ds.x, z: ds.z, h: Math.PI });
      // he comes up the aisle to Su Nwe's desk (beside it, where the teacher stood): a close pair again
      await walkP('maungnge', 0.32, -1.35, 7000, 1.2);
      faceEachOther('maungnge', 'sunwe');
      frame(['maungnge', 'sunwe']);
      await sayAs(L.backRow, null, L.cls1);
      hear('parcels');
      await D.say('maungnge', L.ml1, { face: 'smile' });
      spoke('maungnge');
      // he takes it gently and holds it upside down
      if (sheet) { sheet.setFlip?.(true); const m = people.get('maungnge')?.p.root.position; if (m) { sheet.root.position.set(m.x + 0.2, 0.95, m.z + 0.2); sheet.root.rotation.set(0, 0, 0); } }
      await D.say('sunwe', L.sn1, { face: 'hot', emote: 'fists' });
      spoke('sunwe');
      if (sheet) placeSheet();
      faceEachOther('maungnge', 'maya');
      await D.say('maungnge', L.ml2, { face: 'think' });
      await D.say('hninwai', L.hw2, { face: 'sad' });
      F('hook9', true);
      F('card.notyet', true);
      // the bell: break time; the class files out, he goes back to his cart
      call(game.audio, 'play', 'ring');
      hideWalkOns();
      face('sunwe', Math.PI);
      await walkP('maungnge', ds.x, ds.z, 6000, 1.3);
      story.remove('maungnge');
      parrotAsks('marks');
    });
  }
  async function looksDone() {
    if (F('looked9') || !['timetable', 'stub', 'cart', 'rope'].every((k) => F(`look9.${k}`))) return;
    await D.say('maya', L.looked, { face: 'smile' });
    F('looked9', true);
    F('card.price', true);
  }
  function insideLook(id) {
    if (!F('hook9') || F(`look9.${id}`) || F('ch9Done')) return false;
    scene(async () => { await look(L.looks[id]); F(`look9.${id}`, true); await looksDone(); });
    return true;
  }
  async function outsideLook(id) {
    await scene(async () => {
      if (F(`look9.${id}`)) { if (id === 'cart') await D.say('maya', [L.looks.cart.gold], { face: 'smile' }); else await D.say('maungnge', L.ml2.slice(1), { face: 'smile' }); return; }
      if (id === 'rope') { const e = people.get('maungnge'); if (e) { faceEachOther('maya', 'maungnge'); frame(['maya', 'maungnge']); } }
      await look(L.looks[id]);
      F(`look9.${id}`, true);
      if (id === 'cart') check('parcels');
      await looksDone();
    });
  }
  async function snTalk() {
    // the steam tutorial plays here, the day heat is taught (talk.js shows tutorials once: reopen it once)
    const tutSeen = save.flags['talk.tutorial'];
    if (!F('steamTip')) save.flags['talk.tutorial'] = false;
    // she stands up from her bench into the aisle and Maya faces her there: the talk's two-shot then sees both
    // faces (seated, she was a back behind her desk)
    if (story.inRoom === 'classroom' && people.get('sunwe')) {
      await Promise.all([walkP('sunwe', 0.75, -1.05, 4000, 1.1), walkMaya(-0.3, -0.95, 4000)]);
      faceEachOther('maya', 'sunwe');
    }
    let r;
    try { r = await story.talk.run(TALK_D3_SUNWE); } finally { if (!F('steamTip')) F('steamTip', true); save.flags['talk.tutorial'] = tutSeen ?? true; story.persist(); }
    if (!r?.won) { if (!r?.busy) await D.say('sunwe', L.snLater, { face: 'think' }); return; }
    F('snTalk', true);
    await guideScene();
  }
  async function guideScene() {
    const ds = spot('door') || { x: 0, z: 3.5 };
    const snSeat = spot('sunwe') || { x: 1.3, z: -0.62, h: 0.15 };
    // Maya steps back into the aisle beside the desk (never where Su Nwe will sit down again)
    const mw = spot('mayaD3') || { x: 0.5, z: -0.3 };
    const mp0 = game.maya.root.position;
    if (Math.hypot(mp0.x - mw.x, mp0.z - mw.z) > 0.4) await walkMaya(mw.x, mw.z, 4000);
    // she goes to the door and calls him; he carries the three parcels to her desk
    await walkP('sunwe', ds.x + 0.4, ds.z - 0.6, 6000, 1.2);
    await D.say('sunwe', L.snCall, { face: 'smile' });
    if (!people.get('maungnge')) story.spawn('maungnge', { x: ds.x, z: ds.z, h: Math.PI });
    const seat = spot('maungngeSeat') || { x: 1.95, z: -0.62 };
    await Promise.all([walkP('sunwe', snSeat.x, snSeat.z, 6000, 1.2), walkP('maungnge', seat.x, seat.z, 7000, 1.2)]);
    face('sunwe', snSeat.h ?? 0.15); face('maungnge', seat.h ?? -0.25);
    frame(['sunwe', 'maungnge'], { dist: 3.0 });
    await D.say('sunwe', L.sn2, { face: 'smile' });
    await D.say('maungnge', L.ml3, { face: 'worried' });
    await D.say('sunwe', L.sn3, { face: 'smile' });
    const r = await guide({ title: L.guideTitle, hint: L.guideHint, labels: L.guideLabels, pace: 70, lag: 0.6, alone: 2, readFor: L.readFor, react: L.guideReact });
    if (r?.cancelled) { closeCam(); return; } // closed: the parcels wait on her desk; tap Su Nwe to go on
    F('guided', true);
    F('readFor', r?.readFor || 0);
    await boatScene();
  }
  async function boatScene() {
    const seat = spot('maungngeSeat') || { x: 1.95, z: -0.62 };
    if (!people.get('maungnge')) story.spawn('maungnge', { x: seat.x, z: seat.z, h: seat.h ?? -0.25 });
    frame(['sunwe', 'maungnge'], { dist: 3.0 });
    await D.say('sunwe', L.sn4, { face: 'surprised' });
    call(game.audio, 'play', 'page');
    await D.say('maungnge', L.ml4, { face: 'smile' });
    let wobble = 10;
    for (;;) {
      const r = await trace({ title: L.boatTitle, hint: L.boatHint, path: 'boat', wobble, tolerance: 22, round: 1, rounds: 1 });
      if (r?.cancelled) { closeCam(); return; }
      if (r?.ok) break;
      wobble = Math.max(4, wobble * 0.75); // retries are free; no lines between
    }
    // back from the act's page: the pair's two-shot again (never the whole-room view)
    frame(['sunwe', 'maungnge']);
    call(game.audio, 'play', 'chime');
    if (!torn) { torn = paperBoat({ torn: true }); roomAdd(torn.root, 1.62, 0.76, -1.25, 0.4); }
    await D.say('sunwe', L.sn5, { face: 'sad' });
    await D.say('maungnge', L.ml5, { face: 'happy' });
    await D.say('sunwe', L.sn6, { face: 'smile' });
    await D.say('maungnge', L.ml6, { face: 'happy', emote: 'cheer' });
    F('boat', true);
    F('ch9Done', true);
    // he goes out to his cart (the delivery starts outside); Daw Hnin Wai looks up from her marking
    const ds = spot('door') || { x: 0, z: 3.5 };
    walkP('maungnge', ds.x, ds.z, 6000, 1.3).then(() => { if (story.inRoom === 'classroom') story.remove('maungnge'); });
    await wait(900);
    // Maya turns to the teacher's desk, a few steps nearer (the two-shot needs them within a few metres)
    const hw = people.get('hninwai')?.p.root.position, mp = game.maya.root.position;
    if (hw && Math.hypot(hw.x - mp.x, hw.z - mp.z) > 3) {
      const d = Math.hypot(hw.x - mp.x, hw.z - mp.z), k = (d - 1.7) / d;
      await walkMaya(mp.x + (hw.x - mp.x) * k, mp.z + (hw.z - mp.z) * k, 4000);
    }
    faceEachOther('maya', 'hninwai');
    frame(['maya', 'hninwai']);
    await D.say('hninwai', L.hwEnd, { face: 'smile' });
    closeCam();
  }
  // the delivery: he pushes the cart east along the second street, down to the third and the potter's yard
  let delivering = false;
  async function deliver() {
    delivering = true;
    scripted.add('maungnge');
    let e = people.get('maungnge');
    if (!e) e = story.spawn('maungnge', { x: P.cart.x + 1.05, z: P.cart.z + 0.25, heading: Math.PI / 2 });
    if (e) e.job = null;
    cartFollow = e;
    const legs = [[-4.0, 89.0], [33.4, 89.3], [33.6, 116.6], [44.9, 116.9]];
    for (const [x, z] of legs) {
      if (disposed || !people.get('maungnge')) break;
      await walkP('maungnge', x, z, 45000, 1.25);
    }
    cartFollow = null;
    if (disposed) return;
    F('delivered', true);
    F('deliveredAt', Date.now());
    applyState();
    const m = people.get('maungnge');
    if (m) { m.__d3 = 'delivered'; face('maungnge', 0); }
    scripted.delete('maungnge');
    delivering = false;
  }

  // ---------------------------------------------------------------------------------------------
  // 8. main quest: Nay Chi in the border tea shop
  // ---------------------------------------------------------------------------------------------
  let keeper = null;
  async function makeKeeper() {
    if (keeper || !story.room) return;
    try {
      const { WALKONS } = await import('./rooms/quarter.js');
      const s = spot('keeper') || { x: -1.7, z: -2.58, h: 0 };
      keeper = createPerson(WALKONS.keeper || { age: 'elder', hair: 'bun', top: 'blouse', bottom: 'htamein', extras: ['apron'] });
      keeper.root.userData.isPerson = true;
      roomAdd(keeper.root, s.x, 0, s.z, s.h ?? 0);
    } catch (err) { console.warn('day3 keeper', err); }
  }
  async function ncScene() {
    await scene(async () => {
      await makeKeeper();
      if (!F('kp1')) { frame(['maya']); await sayAs(L.keeper, keeper, L.kp1); F('kp1', true); }
      const s = spot('mayaSeat') || { x: 1.2, z: -1.6 };
      await walkMaya(s.x, s.z, 6000);
      faceEachOther('maya', 'naychi');
      frame(['maya', 'naychi']);
      if (!F('ncMet')) { await D.say('naychi', L.nc1, { face: 'happy' }); F('ncMet', true); spoke('naychi'); }
      else await D.say('naychi', L.ncAgain, { face: 'smile' });
      await ncTalk();
    });
  }
  async function ncTalk() {
    const r = await story.talk.run(TALK_D3_NAYCHI);
    if (r?.reason === 'lean') {
      F('ncAnswered', true);
      F('ncRoad', r.card === 'square' ? 'square' : 'shed');
      await D.say('naychi', L.nc2, { face: 'happy', emote: 'cheer' });
      await D.say('maya', L.ncMaya, { face: 'smile' });
      // she leaves her tea glass half full and goes home, north up the avenue
      const ds = spot('door') || { x: 0, z: 2.65 };
      walkP('naychi', ds.x, ds.z, 6000, 1.4).then(() => { if (story.inRoom === 'bordertea') story.remove('naychi'); });
      return;
    }
    if (!r?.busy) await D.say('naychi', L.ncNotYet, { face: 'think' });
  }

  // ---------------------------------------------------------------------------------------------
  // 8.4 the "ask Maya" board (home, the Post Office wall)
  // ---------------------------------------------------------------------------------------------
  function openBoard() {
    if (document.getElementById('d3-board')) return;
    injectBoardStyle();
    const el = document.createElement('div');
    el.id = 'd3-board';
    const all = F('wwEvening') || F('board') ? [...L.board2, ...L.board3] : L.board2;
    const d2n = story.flag('d2.boardNote'), d2r = story.flag('d2.boardReply');
    const pinned = F('boardReply');
    el.innerHTML = `<div class="cork"><h3></h3><ul></ul><p class="ask"></p><div class="reps"></div><button type="button" class="x"></button></div>`;
    el.querySelector('h3').textContent = tr(L.boardTitle);
    el.querySelector('.x').textContent = tr(L.boardClose);
    const ul = el.querySelector('ul');
    const reps = el.querySelector('.reps');
    const ask = el.querySelector('.ask');
    let picked = null;
    all.forEach((n, i) => {
      const li = document.createElement('li');
      li.innerHTML = '<small></small><span></span><em></em>';
      li.querySelector('small').textContent = tr(n.from);
      li.querySelector('span').textContent = tr(n);
      // Maya's pinned replies: yesterday's, and today's once pinned
      let rep = null;
      if (i < 3 && d2n === i && L.board2[i].replies?.[d2r]) rep = L.board2[i].replies[d2r];
      if (i >= 3 && pinned && pinned.note === i - 3) rep = L.board3[i - 3].replies?.[pinned.reply];
      if (rep) li.querySelector('em').textContent = `${tr(L.boardMayaReply)}: ${tr(rep)}`;
      const can = i >= 3 && !F('board') && n.replies;
      if (can) {
        li.classList.add('can');
        li.addEventListener('click', (ev) => {
          ev.stopPropagation();
          picked = i - 3;
          ul.querySelectorAll('li').forEach((x) => x.classList.toggle('on', x === li));
          ask.textContent = tr(L.boardReplyQ);
          reps.innerHTML = '';
          n.replies.forEach((r, k) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = tr(r);
            b.addEventListener('click', (e2) => {
              e2.stopPropagation();
              F('board', true);
              F('boardReply', { note: picked, reply: k });
              call(game.audio, 'play', 'page');
              close();
              scene(() => D.say('maya', L.boardMaya, { face: 'smile' }));
            });
            reps.appendChild(b);
          });
        });
      }
      ul.appendChild(li);
    });
    if (all.length > 3 && !F('board')) ask.textContent = tr(L.boardPin);
    const close = () => { el.remove(); applyState(); };
    el.querySelector('.x').addEventListener('click', (ev) => { ev.stopPropagation(); close(); });
    el.addEventListener('click', (ev) => { if (ev.target === el) close(); });
    document.getElementById('game').appendChild(el);
    call(game.audio, 'play', 'page');
  }

  // ---------------------------------------------------------------------------------------------
  // 9. the night page
  // ---------------------------------------------------------------------------------------------
  let nightBusy = false;
  async function night() {
    if (nightBusy || F('done')) return;
    nightBusy = true;
    const who = ['dawohn', 'micho', 'sunwe', 'maungnge', 'naychi', ...['hninwai', 'toetoe', 'yeyint'].filter((id) => F(`met.${id}`))];
    try {
      await nightPage(story, {
        day: 3,
        truth: { q: L.nightQ, choices: L.nightChoices, right: 1, wrong: L.nightWrong },
        before: async () => {
          // the look-alike leaves the hand for good; Mi Cho's cracked pot goes by the beans
          story.lookalikeGone('wouldnt');
          call(game.audio, 'play', 'chalk');
          await D.say('maya', [L.lookalikeGone], { face: 'think' });
          if (F('crackedPot')) { save.home.crackedPot = { from: 'micho', day: 3 }; story.persist(); await D.say('maya', L.potHome, { face: 'smile' }); }
        },
        sleep: { q: L.sleepQ, who },
        stamps: [5, 9],
        stampText: L.stamp5,
        extra: L.stamp9,
        tomorrow: L.tomorrow,
        turn: false,
      });
      // the reply letter's new pencil line (crossed out by her own hand on Day 8)
      save.notebook.reply = Array.isArray(save.notebook.reply) ? save.notebook.reply : [];
      if (!save.notebook.reply.some((x) => x.day === 3)) save.notebook.reply.push({ day: 3, my: L.replyLine.my, en: L.replyLine.en });
      story.persist();
      await showSlip(game, L.replyLine, { title: L.replyTitle });
      parrotAsks('night');
      await wait(hasParrot() ? 1800 : 200);
    } finally { nightBusy = false; }
    if (!disposed && save.day === 4) await story.turnPage();
  }

  // ---------------------------------------------------------------------------------------------
  // inside rooms
  // ---------------------------------------------------------------------------------------------
  let sheet = null, torn = null;
  function roomAdd(obj, x, y, z, ry = 0) { const sc = story.room?.scene; if (!sc) return; obj.position.set(x, y, z); obj.rotation.y = ry; sc.add(obj); roomBits.push(obj); }
  function placeSheet() { if (!sheet) return; sheet.setFlip?.(false); sheet.root.position.set(1.45, 0.75, -1.22); sheet.root.rotation.set(0, 0.2, 0); }

  // ---------------------------------------------------------------------------------------------
  // what people say (by how far the day has gone)
  // ---------------------------------------------------------------------------------------------
  const talk = {
    wintwar: async () => {
      spoke('wintwar');
      if (!story.inRoom) {
        if (!F('morning') && !F('wwIn')) return wwCallOutside();
        if (goals() >= 2 && !F('wwEvening')) {
          await D.say('wintwar', L.wwEvening, { face: 'smile' });
          F('wwEvening', true);
          applyState();
          if (!pending()) { await D.say('wintwar', L.wwRest, { face: 'smile' }); F('restSaid', true); }
          scripted.add('wintwar');
          walkP('wintwar', P.poSide.x - 0.35, P.poSide.z, 5000, 1.2).then(() => { scripted.delete('wintwar'); if (!story.inRoom && !story.talking) story.remove('wintwar'); });
          return;
        }
        if (!pending()) { F('restSaid', true); return D.say('wintwar', L.wwRest, { face: 'smile' }); }
        return D.say('wintwar', L.wwLater, { face: 'smile' });
      }
      if (!F('morning')) return morning();
      if (goals() >= 2 && !F('wwEvening')) { await D.say('wintwar', L.wwEvening, { face: 'smile' }); F('wwEvening', true); applyState(); if (!pending()) { await D.say('wintwar', L.wwRest, { face: 'smile' }); F('restSaid', true); } return; }
      if (!pending()) { F('restSaid', true); return D.say('wintwar', L.wwRest, { face: 'smile' }); }
      return D.say('wintwar', next('ww', [L.wwLater, L.wwMessy]), { face: 'smile' });
    },
    dawohn: async () => {
      spoke('dawohn');
      if (story.inRoom === 'pottershed' && F('rang') && !F('ch5Done')) return shedScene();
      if (!F('kilnOpen')) return D.say('dawohn', L.ohBefore, { face: 'smile' });
      if (!F('rang')) return D.say('dawohn', L.oh2, { face: 'smile' });
      if (!F('ch5Done')) return D.say('dawohn', L.ohWaiting, { face: 'smile' });
      return D.say('dawohn', F('delivered') && next('oh', [0, 1]) ? L.ohDelivered : L.ohAfter, { face: 'smile' });
    },
    micho: async () => {
      spoke('micho');
      if (!F('kilnOpen')) return D.say('micho', L.mc1, { face: 'happy' });
      if (!F('ch5Done')) return D.say('micho', L.oh2, { face: 'smile' });
      return D.say('micho', L.mcAfter, { face: 'happy' });
    },
    sunwe: async () => {
      spoke('sunwe');
      if (!story.inRoom) return D.say('sunwe', L.snAfter, { face: 'smile' });
      if (!F('hook9')) return D.say('sunwe', [{ my: 'ဒီနေ့ အမှတ်စာရွက် ရမယ်။', en: 'Marks sheets today.' }], { face: 'worried' }); // DRAFT(my)
      if (!F('looked9')) return D.say('sunwe', L.snCross, { face: 'hot' });
      if (!F('snTalk')) { if (story.talk.waiting(TALK_D3_SUNWE.id)) return D.say('sunwe', L.snLater, { face: 'think' }); return snTalk(); }
      if (!F('guided')) return guideScene();
      if (!F('boat')) return boatScene();
      return D.say('sunwe', L.snAfter, { face: 'smile' });
    },
    hninwai: async () => {
      spoke('hninwai');
      if (!F('hook9')) return D.say('hninwai', L.hwBefore, { face: 'smile' });
      return D.say('hninwai', F('ch9Done') ? L.hwEnd : L.hw2, { face: 'smile' });
    },
    maungnge: async () => {
      spoke('maungnge');
      if (F('ch9Done')) return D.say('maungnge', L.mlAfter, { face: 'happy' });
      if (story.inRoom) return D.say('maungnge', L.ml3, { face: 'smile' });
      if (F('hook9') && !F('look9.rope')) {
        await look(L.looks.rope);
        F('look9.rope', true);
        return looksDone();
      }
      return D.say('maungnge', F('hook9') ? L.ml2.slice(1) : L.mlBefore, { face: 'smile' });
    },
    toetoe: async () => {
      spoke('toetoe');
      if (F('ch5Done')) return D.say('toetoe', L.ttAfter5, { face: 'think' });
      return D.say('toetoe', [next('tt', L.tt)], { face: 'happy' });
    },
    yeyint: async () => {
      spoke('yeyint');
      if (F('rumour.kiln2')) return D.say('yeyint', L.yyAfter5, { face: 'think' });
      const line = next('yy', L.yy);
      if (line === L.yy[0]) hear('kiln2');
      return D.say('yeyint', [line], { face: 'smile' });
    },
    naychi: async () => {
      spoke('naychi');
      if (story.inRoom === 'bordertea' && !F('ncAnswered')) {
        if (story.talk.waiting(TALK_D3_NAYCHI.id)) return D.say('naychi', L.ncNotYet, { face: 'think' });
        if (!F('ncMet')) { await D.say('naychi', L.nc1, { face: 'happy' }); F('ncMet', true); }
        return ncTalk();
      }
      return D.say('naychi', L.ncHome, { face: 'happy' });
    },
  };

  // ---------------------------------------------------------------------------------------------
  // per-frame checks (throttled)
  // ---------------------------------------------------------------------------------------------
  let syncT = 0, checkT = 0;
  const free = () => !disposed && !busy && !story.talking && !game.busy && game.mode === 'world' && !story.inRoom && !game.ui.dialogOpen && !document.getElementById('d3-board');

  const day = {
    talk,
    roomOpts(id) { if (id === 'pottershed') return { load: Math.max(1, +story.flag('d2.load') || 4) }; return undefined; },
    roomCast(id) {
      if (id === 'sortingroom') {
        const l = [{ id: 'wintwar', spot: F('morning') ? 'wintwarRack' : 'wintwar' }];
        if (F('ncAnswered')) l.push({ id: 'naychi', spot: 'naychiStool' });
        return l;
      }
      if (id === 'pottershed') {
        if (F('rang') && !F('ch5Done')) return [{ id: 'dawohn', spot: 'dawohnBench' }, { id: 'micho', spot: 'michoDoor' }];
        if (F('ch5Done')) return [{ id: 'micho', spot: 'micho' }];
        return [];
      }
      if (id === 'classroom') {
        const l = [{ id: 'hninwai', spot: 'hninwai' }];
        if (!F('ch9Done')) l.push({ id: 'sunwe', spot: 'sunwe' });
        if (!F('hook9')) [['pupil1', 'pupil'], ['pupil2', 'pupilGirl2'], ['pupil3', 'pupil2'], ['pupil4', 'pupilGirl'], ['pupil5', 'pupil3'], ['pupil6', 'pupilGirl3']].forEach(([s, w]) => l.push({ id: w, spot: s }));
        if (F('snTalk') && !F('ch9Done')) l.push({ id: 'maungnge', spot: 'maungngeSeat' });
        return l;
      }
      if (id === 'bordertea') return F('ncAnswered') ? [] : [{ id: 'naychi', spot: 'naychi' }];
      return undefined;
    },
    async enterRoom(id, room) {
      if (disposed) return;
      (story.doors?.roomCam ? story.doors.roomCam() : game.rig.setFollow(ROOM_CAM)); // (doors.js's shared close low camera) the close low follow camera indoors, never the whole-room view
      if (id === 'sortingroom') { if (!F('morning') && people.get('wintwar')) story.talkTo(people.get('wintwar')); return; }
      if (id === 'pottershed') {
        call(room?.parts?.tally, 'set', { rubbed: !!F('glad'), load: Math.max(1, +story.flag('d2.load') || 4) });
        call(room?.parts?.chalk, 'set', F('chalk') ? SPIN : 'မရ ဘူး'); // DRAFT(my)
        if (F('rang') && !F('ch5Done')) shedScene();
        return;
      }
      if (id === 'classroom') {
        sheet = markSheet({ flat: true });
        if (!F('ch9Done')) { roomAdd(sheet.root, 1.45, 0.75, -1.22); placeSheet(); }
        if (F('boat')) { torn = paperBoat({ torn: true }); roomAdd(torn.root, 1.62, 0.76, -1.25, 0.4); }
        if (F('morning') && !F('hook9')) hookScene();
        return;
      }
      if (id === 'bordertea') {
        await makeKeeper();
        if (!F('ncAnswered') && !F('ncMet')) ncScene();
        return;
      }
      if (id === 'about' && !pending() && !F('done')) night();
    },
    leaveRoom() {
      for (const o of roomBits) o.removeFromParent();
      roomBits.length = 0;
      for (const x of [sheet, torn]) call(x, 'dispose');
      sheet = null; torn = null;
      if (keeper) { call(keeper, 'dispose'); keeper = null; }
    },
    station(id) {
      if (id === 'cl-timetable') return insideLook('timetable');
      if (id === 'cl-stub') return insideLook('stub');
      if (id === 'bt-counter') { if (story.talking) return true; scene(async () => { await makeKeeper(); await sayAs(L.keeper, keeper, F('ncAnswered') ? L.kp2 : L.kp1); }); return true; }
      return false;
    },
    /** The page turns in place: this page's props, keep-out shapes, doors, taps and people go away. */
    dispose() {
      disposed = true;
      for (const o of objs) o.removeFromParent();
      for (const x of [smoke, kShelf, shaded, cart, tea.shop, ...notices]) call(x, 'dispose');
      story.openWorld?.space?.remove?.(obs); // (and shrunk to nothing: a harmless fallback)
      for (const o of obs) { if (o.type === 'circle') o.r = 0; else { o.minX = o.maxX = -1e6; o.minZ = o.maxZ = -1e6; } }
      for (const r of myDoors) delete DOORS[r];
      const k = story.tapHooks?.indexOf(tapHook) ?? -1;
      if (k >= 0) story.tapHooks.splice(k, 1);
      day.leaveRoom();
      for (const id of OWNED) if (people.get(id)?.__d3 || scripted.has(id)) story.remove(id);
      if (window.__day3 === hooks) delete window.__day3;
    },
    async start() {
      if (F('done')) return;
      if (!F('morning')) {
        // the day opens with Maya stepping out of the Writing Room; Ma Wint War calls from her side door
        F('wwIn', false);
        if (story.inRoom) await story.exit({ instant: true });
        if (!story.foot.active) await story.foot.toFoot();
        story.refreshHud?.();
        const d = P.aboutDoor;
        try { story.foot.walker.teleport(d.x, d.z + 0.9, 0); game.maya.root.position.set(d.x, 0, d.z + 0.9); } catch { /* ok */ }
        // scripted morning light (the morning post keeps it)
        game.day?.set?.(8.5);
        game.applyDayLook();
        syncCast();
        const ww = people.get('wintwar');
        if (ww) {
          // she comes out from her side door a few steps toward Maya, as on Day 1, then calls her in
          scripted.add('wintwar');
          const mp = game.maya.root.position;
          await walkP('wintwar', mp.x + 1.15, mp.z + 0.05, 9000, 1.5);
          scripted.delete('wintwar');
          await story.talkTo(ww);
        }
      }
    },
    update(dt) {
      if (disposed) return;
      call(smoke, 'update', dt, game.t || 0);
      call(tea.shop, 'update', dt, game.t || 0);
      // the cart goes with whoever pushes it
      if (cartFollow?.p) {
        const q = cartFollow.p.root.position, h = cartFollow.p.root.rotation.y;
        cart.root.position.set(q.x + Math.sin(h) * 0.95, 0, q.z + Math.cos(h) * 0.95);
        cart.root.rotation.y = h + Math.PI / 2;
        moveOb(cartOb, -1e5, -1e5);
      }
      if ((syncT -= dt) <= 0) { syncT = 0.4; syncCast(); }
      if ((checkT -= dt) <= 0) {
        checkT = 0.25;
        if (!free()) return;
        const m = at();
        // ch 5: the kiln waits for Maya (on foot or by car: she hops out, the scene needs her in the yard)
        if (!F('kilnOpen') && (near(P.yard, 7) || near(P.kiln, 6))) { kilnScene(); return; }
        // the parrot's questions, each once
        if (!F('kilnOpen') && Math.hypot(m.x - P.chimney.x, m.z - P.chimney.z) < 34 && m.z > 60) parrotAsks('smoke');
        if (F('morning') && near(P.schoolDoor, 3.5)) parrotAsks('marks');
        // the road's end (rumour roadEnd: "for ever" was hearsay)
        if (!F('rumour.roadEnd') && near(P.pageEnd, 6)) {
          scene(async () => { await D.say('maya', L.roadEnd, { face: 'think' }); check('roadEnd'); parrotAsks('edge'); });
          return;
        }
        // the delivery starts once Maya is back outside
        if (F('ch9Done') && !F('delivered') && !delivering) { deliver(); return; }
        // the evening: once two goals are done Maya remembers "come back towards evening" (once, said by her)
        if (goals() >= 2 && !F('wwEvening') && F('morning') && !F('eveningSaid')) {
          F('eveningSaid', true);
          scene(() => D.say('maya', L.eveningMaya, { face: 'think' }));
          return;
        }
        // ...and Ma Wint War, out by her side door with the new notes, calls her over when she is home
        if (goals() >= 2 && !F('wwEvening') && F('morning') && story.foot.active) {
          const ww = people.get('wintwar');
          const wp = ww?.p.root.position;
          if (wp && (near(P.poSide, 9) || Math.hypot(m.x - wp.x, m.z - wp.z) < 11)) { story.talkTo(ww); return; }
        }
        // all three done after the evening line: the day is over, she says so to herself (once)
        if (!pending() && F('wwEvening') && !F('restSaid') && !F('done')) {
          F('restSaid', true);
          scene(() => D.say('maya', L.restMaya, { face: 'smile' }));
          return;
        }
        // night: back at the Writing Room door with the three goals done
        if (!pending() && !F('done')) {
          const d = P.aboutDoor;
          const close = story.foot.active ? Math.hypot(m.x - d.x, m.z - (d.z + 0.6)) < 1.8 : Math.hypot(m.x - d.x, m.z - (d.z + 3)) < 2.4;
          if (close) night();
        }
      }
    },
  };

  // ---- test hooks
  const hooks = {
    beats: BEATS,
    places: { home: { x: 0, z: 8.2 }, po: { x: P.poOut.x - 0.7, z: P.poOut.z + 0.3 }, kiln: { x: 53.6, z: 117.0 }, school: { x: -11.5, z: 89.6 }, cart: { x: -7.3, z: 89.3 }, stage: { x: -12, z: 143.6 }, sign: { x: 0.6, z: 159.4 }, teashop: { x: tea.door.x + 1.2, z: tea.door.z }, pageEnd: { x: 7, z: 246 } },
    state: () => Object.fromEntries(Object.entries(save.flags).filter(([k]) => k.startsWith('d3.'))),
    /** Put the flags where `beat` begins (every earlier beat done). */
    skipTo(beat) {
      const n = BEATS.indexOf(beat);
      if (n < 0) return `unknown beat; one of ${BEATS.join(', ')}`;
      for (let i = 0; i <= n; i++) for (const [k, v] of Object.entries(BEAT_FLAGS[BEATS[i]])) save.flags[`d3.${k}`] = v;
      if (n >= BEATS.indexOf('hook') && !story.has('storagepot')) story.give('storagepot', 1, { quiet: true });
      // the talks a skip passes count as played (as talk.js writes them: 0 = won): Day 11 reads talk.d3-naychi
      if (save.flags['d3.snTalk'] && save.flags['talk.d3-sunwe'] == null) save.flags['talk.d3-sunwe'] = 0;
      if (save.flags['d3.ncAnswered'] && save.flags['talk.d3-naychi'] == null) save.flags['talk.d3-naychi'] = 0;
      for (const r of ['kiln2', 'parcels']) if (save.flags[`d3.rumour.${r}`]) { save.flags[`rumour.${r}`] = 'checked'; save.proofs[r] = L.proof[r]; if (!story.has(`proof:${r}`)) story.give(`proof:${r}`, 1, { quiet: true }); }
      story.persist();
      applyState();
      syncCast();
      return hooks.state();
    },
    /** Walk-free jump outdoors to a named place (on foot). */
    async go(place) {
      const p = hooks.places[place] || place;
      if (story.inRoom) await story.exit({ instant: true });
      if (!story.foot.active) await story.foot.toFoot();
      story.openWorld?.jump?.(p.x, p.z, 0);
      story.foot.walker.teleport(p.x, p.z, 0);
      game.maya.root.position.set(p.x, 0, p.z);
      return at();
    },
    enter: (room) => story.enter(room),
    get busy() { return busy; },
  };
  window.__day3 = hooks;
  return day;
}

function injectBoardStyle() {
  if (document.getElementById('d3-board-style')) return;
  const s = document.createElement('style');
  s.id = 'd3-board-style';
  s.textContent = `
  #d3-board { position: absolute; inset: 0; z-index: 46; display: flex; align-items: center; justify-content: center; background: rgba(42,33,24,.35); padding: 16px; }
  #d3-board .cork { width: min(100%, 440px); max-height: 82vh; overflow: auto; background: #C9A576; border: 6px solid #8C6A44; border-radius: 10px; padding: 12px 12px 14px;
    font: 14px/1.65 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; box-shadow: 0 12px 30px rgba(42,33,24,.35); }
  #d3-board h3 { margin: 0 0 8px; text-align: center; color: #6E1F2A; font-size: 17px; }
  #d3-board ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  #d3-board li { background: #FFFDF8; padding: 8px 10px 8px 12px; border-radius: 3px; box-shadow: 0 2px 4px rgba(42,33,24,.2); position: relative; }
  #d3-board li:nth-child(odd) { transform: rotate(-.6deg); } #d3-board li:nth-child(even) { transform: rotate(.5deg); }
  #d3-board li small { display: block; color: #8C6A28; font-size: 12px; } #d3-board li span { display: block; }
  #d3-board li em { display: block; font-style: normal; color: #2F5D8C; font-size: 13px; } #d3-board li em:empty { display: none; }
  #d3-board li.can { cursor: pointer; border-left: 4px solid #C9A24A; } #d3-board li.on { outline: 3px solid #6E1F2A; }
  #d3-board .ask { margin: 10px 0 6px; text-align: center; font-weight: 700; color: #3B2A1A; } #d3-board .ask:empty { display: none; }
  #d3-board .reps { display: grid; gap: 6px; }
  #d3-board button { font: 600 14px/1.6 "Noto Sans Myanmar", system-ui, sans-serif; padding: 8px 12px; border-radius: 12px; border: 2px solid #A47A2C; background: #FFFDF8; color: #2A2118; }
  #d3-board .x { display: block; margin: 12px auto 0; color: #6E1F2A; }
  `;
  document.head.appendChild(s);
}
