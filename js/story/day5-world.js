// Day 5's outdoor set and helpers (used by day5.js only).
//
// The Envelope Market and Ledger Wharf region files are still nearly empty (roads, lamps, desks, jetties),
// so Day 5 stands up what it needs itself and takes it all away again in dispose():
//   Market: the post office front with the post-room door, the stamp-carvers' row (three striped awnings,
//           Ko Lwin's half-open door, his tin chimney: smoke only after the carve), the tea shop, Ma Thiri's post.
//   Wharf:  the weigh-house shell, Daw Sanda's stilt house above Little Jetty, the parcel pile, the ferry at the
//           Big Jetty, Ko Thiha's raft, the sandbar with Duck Jetty and Cane Jetty, the mist bank (the east
//           bank still folded).
// A building whose door a district file already registers (doors.js DOORS) is NOT built again here: the
// district's own is used and Day 5 only anchors its people to that door.
// No markers, arrows or glows anywhere: a door is a door.
//
//   const W = buildDay5World(story)  -> { A (anchors), root, update(dt, t), setCarved(on), raft, ferry, dispose() }
//   spawnWalkOn(story, id, look, at, name) / removeWalkOn(story, id)  tappable people without a cast id
//   lookCard(game, pencil, gold, labels) -> Promise    what was said (pencil) against what is seen (gold)
//   bundleProp() -> Group                               Ko Lwin's cloth bundle (block, note, apron)
import * as THREE from '../game/three.js';
import { VoxelBuilder } from '../game/voxel.js';
import { signTexture, signMesh, FONT_MY } from '../game/toon.js';
import { tr, lang } from '../game/ui.js';
import { createPerson } from './people.js';
import { registerDoors, DOORS } from './doors.js';
import { stampAwning, letterCounter, teaShop, kilnSmoke, SMOKE_TINT, carvingBench, bambooPost } from './props3.js';
import * as MR from './world/regions/market.js';
import * as WR from './world/regions/wharf.js';
import { raft as raftProp, ferry as ferryProp, jetty as jettyProp, weighHouse, mistBank, parcelPile, oldMansPost } from './props4.js';

const PI = Math.PI;
const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);

// ---- fallback places (world metres; +X east, +Z south). Used only when no district file has the door.
export const FALLBACK = {
  // Envelope Market: Counter Lane runs east along z 300 from the spine (x 7) to the Junction road (x 39)
  post: { x: 20.5, z: 294.4 }, // the post office (7 x 4.2), front (+Z) on the lane's north side, z 296.5
  postroom: { x: 23.4, z: 296.55, facing: 0 }, // narrow door at the east end of the same front
  shops: [{ x: 17.6, z: 305 }, { x: 21.0, z: 305 }, { x: 24.4, z: 305 }], // the carvers' row, south side, fronts face north
  tea: { x: 33.4, z: 311.4 }, // the tea shop on the tea-shop street's square (the street runs south at x 28.5)
  // Ledger Wharf: the quay between the road (x 62) and the paper's edge (x 79); jetties from x 77
  weigh: { x: 67.5, z: 412.6 },
  sanda: { x: 72.6, z: 462.2 }, // the stilt house at the landward head of Little Jetty (z 467), door to the water
};
// Jetties (region wharf.js): z of each, tip x. Big 431 / Rice 441 / Fish 450 / Wood 459 / Little 467 / End 476.
export const JETTY = { big: { z: 431, tip: 97 }, little: { z: 467, tip: 88 }, end: { z: 476, tip: 99 } };

// ---- walk-on looks (people.js SPEC; original, everyday clothes)
export const LOOKS = {
  appr1: { age: 'teen', build: 'slim', skin: 2, hair: 'short', top: 'tee', topColor: 'mustard', bottom: 'longyi', bottomColor: 'navy', extras: ['apron'] },
  appr2: { age: 'teen', build: 'mid', skin: 3, hair: 'spiky', top: 'tee', topColor: 'leaf', bottom: 'shorts', bottomColor: 'brown', extras: ['apron', 'pencil'] },
  carver1: { age: 'adult', build: 'mid', skin: 3, hair: 'side', top: 'shirt', topColor: 'cream', bottom: 'longyi', bottomColor: 'teal', check: true, extras: ['apron'] },
  carver2: { age: 'elder', build: 'slim', skin: 2, hair: 'short', hairColor: 'grey', top: 'eingyi', topColor: 'white', bottom: 'longyi', bottomColor: 'brown', extras: ['glasses', 'apron'] },
  seller: { age: 'adult', build: 'slim', skin: 1, hair: 'bun', top: 'blouse', topColor: 'coral', bottom: 'htamein', bottomColor: 'plum', extras: ['thanaka', 'satchel'], extraColor: 'tan' },
  drinker: { age: 'elder', build: 'wide', skin: 3, hair: 'bald', hairColor: 'grey', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'maroon', check: true },
  porterT1: { age: 'adult', build: 'wide', skin: 4, hair: 'short', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'brown', check: true, extras: ['towel'], extraColor: 'tan' },
  porterT2: { age: 'adult', build: 'mid', skin: 3, hair: 'cap', top: 'tee', topColor: 'grey', bottom: 'shorts', bottomColor: 'navy', extras: ['towel'], extraColor: 'cream' },
  ferryman: { age: 'adult', build: 'mid', skin: 4, hair: 'cap', top: 'shirt', topColor: 'teal', bottom: 'trousers', bottomColor: 'navy', extras: ['towel'], extraColor: 'cream' },
  porterW1: { age: 'adult', build: 'mid', skin: 3, hair: 'spiky', top: 'tee', topColor: 'olive', bottom: 'longyi', bottomColor: 'navy', extras: ['towel'], extraColor: 'cream' },
  porterW2: { age: 'adult', build: 'wide', skin: 4, hair: 'short', top: 'vest', topColor: 'cream', bottom: 'longyi', bottomColor: 'charcoal', check: true, extras: ['towel'], extraColor: 'tan' },
  duckkeeper: { age: 'elder', build: 'slim', skin: 3, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'leaf', bottom: 'htamein', bottomColor: 'brown', extras: ['towel'], extraColor: 'cream' },
  oldman: { age: 'elder', build: 'slim', skin: 2, hair: 'bald', hairColor: 'white', top: 'eingyi', topColor: 'white', bottom: 'longyi', bottomColor: 'brown', extras: ['gaungbaung', 'glasses'], extraColor: 'rose' },
};

// ---------------------------------------------------------------------------------------------
// walk-ons with lines: people in story.people without a cast id (doors.js removes indoor ones on exit)
// ---------------------------------------------------------------------------------------------
export function spawnWalkOn(story, id, look, at, name) {
  if (story.people.has(id)) return story.people.get(id);
  const p = createPerson(look);
  const sc = story.game.maya.root.parent || story.game.world.scene;
  p.root.position.set(at.x, at.y || 0, at.z);
  p.root.rotation.y = at.heading ?? at.h ?? 0;
  p.root.userData.isPerson = true;
  sc.add(p.root);
  const ob = { type: 'circle', x: at.x, z: at.z, r: p.radius, person: id };
  const cast = { id, name, look, hello: null };
  const e = { id, cast, p, home: { x: at.x, z: at.z, h: at.heading ?? at.h ?? 0 }, ob, onTalk: null, walking: null, walkOn: true };
  if (story.inRoom) e.indoor = story.inRoom;
  story.people.set(id, e);
  return e;
}
export function removeWalkOn(story, id) {
  const e = story.people.get(id);
  if (!e) return;
  e.p.root.removeFromParent();
  e.p.dispose();
  story.people.delete(id);
}

// ---------------------------------------------------------------------------------------------
// the pencil / gold look card (what is said against what is seen); resolves on a tap
// ---------------------------------------------------------------------------------------------
export function lookCard(game, pencil, gold, { heard, seen, tap } = {}) {
  injectStyle();
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'd5-look';
    el.innerHTML = '<div class="d5-card"><p class="pen"><small></small><s></s></p><p class="gold"><small></small><b></b></p><i></i></div>';
    el.querySelector('.pen small').textContent = tr(heard || { my: 'ကြားခဲ့တာ', en: 'heard' });
    el.querySelector('.pen s').textContent = `«${tr(pencil)}»`;
    el.querySelector('.gold small').textContent = tr(seen || { my: 'ကိုယ်တိုင် မြင်တာ', en: 'seen' });
    el.querySelector('.gold b').textContent = tr(gold);
    el.querySelector('i').textContent = tr(tap || { my: 'နှိပ်ပြီး ဆက်မယ်', en: 'tap to go on' });
    call(game.audio, 'play', 'page');
    el.addEventListener('click', (ev) => { ev.stopPropagation(); el.classList.add('out'); setTimeout(() => el.remove(), 200); resolve(); });
    document.getElementById('game').appendChild(el);
  });
}

function injectStyle() {
  if (document.getElementById('d5-style')) return;
  const s = document.createElement('style');
  s.id = 'd5-style';
  s.textContent = `
  .d5-look { position: absolute; inset: 0; z-index: 46; display: flex; align-items: center; justify-content: center; background: rgba(42,33,24,.28); animation: d5in .25s ease; }
  .d5-look.out { opacity: 0; transition: opacity .2s; }
  .d5-look .d5-card { position: relative; width: min(84vw, 340px); box-sizing: border-box; padding: 18px 18px 12px; background: #FFFDF8; border-radius: 6px; box-shadow: 0 10px 26px rgba(42,33,24,.32); transform: rotate(-.8deg);
    font: 15.5px/1.85 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; background-image: repeating-linear-gradient(transparent 0 28px, #E6DECB 28px 29px); }
  .d5-look p { margin: 0 0 8px; } .d5-look small { display: block; font-size: 12px; font-weight: 700; }
  .d5-look .pen small { color: #8A847C; } .d5-look .pen s { color: #8A847C; text-decoration-color: rgba(138,132,124,.7); }
  .d5-look .gold small { color: #A47A2C; } .d5-look .gold b { color: #7A5418; font-weight: 600; text-shadow: 0 0 1px rgba(201,162,74,.35); }
  .d5-look i { display: block; text-align: right; font-size: 11.5px; color: #B0A288; font-style: normal; }
  @keyframes d5in { from { opacity: 0; transform: translateY(12px); } }
  `;
  document.head.appendChild(s);
}

// ---------------------------------------------------------------------------------------------
// small builders
// ---------------------------------------------------------------------------------------------
function disposeTree(o) {
  o.traverse((c) => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) for (const m of [].concat(c.material)) { m.map?.dispose?.(); m.dispose?.(); }
  });
}
function sign(lines, w, h, opts = {}) {
  const tex = signTexture(lines.map((t, i) => ({ text: t, size: i ? 30 : 44, font: FONT_MY })), { width: 512, height: Math.round(512 * h / w), ...opts });
  return signMesh(tex, w, h);
}

/** One of the three carvers' shops (local: front +Z, door at the front centre). */
function carverShop({ third = false, w = 3.0, d = 3.0, h = 2.7, seed = 0 } = {}) {
  const g = new THREE.Group();
  const v = new VoxelBuilder();
  const wall = ['#EADFC8', '#E3D3B5', '#EFE4CC'][seed % 3];
  v.boxMin(-w / 2, 0, -d / 2, w / 2, h, d / 2, wall);
  v.boxMin(-w / 2 - 0.05, 0, d / 2 - 0.02, w / 2 + 0.05, 0.35, d / 2 + 0.04, '#B9A27E'); // plinth
  v.boxMin(-w / 2 - 0.25, h, -d / 2 - 0.25, w / 2 + 0.25, h + 0.16, d / 2 + 0.3, '#8E5A3C'); // roof slab
  v.boxMin(-w / 2 - 0.1, h + 0.16, -d / 2 - 0.1, w / 2 + 0.1, h + 0.26, d / 2 + 0.15, '#7A4A30');
  // the plank door: Ko Lwin's stands half open (a dark gap and a turned leaf), the others shut
  const dw = 0.9, dh = 1.95;
  v.boxMin(-dw / 2 - 0.06, 0, d / 2, dw / 2 + 0.06, dh + 0.08, d / 2 + 0.04, '#5A3B26'); // frame
  if (third) {
    v.boxMin(-dw / 2, 0.02, d / 2 + 0.005, dw / 2, dh, d / 2 + 0.045, '#2E2219'); // the dark gap
    v.box(-dw / 2 + 0.05, dh / 2, d / 2 + 0.3, 0.05, dh - 0.04, 0.6, '#9C6E45', 0.15); // the leaf, half open
    // a carved block over the door: straight lines (his own sign)
    v.boxMin(-0.32, dh + 0.18, d / 2 + 0.02, 0.32, dh + 0.52, d / 2 + 0.1, '#B98A5A');
    for (let i = 0; i < 4; i++) v.boxMin(-0.26, dh + 0.23 + i * 0.07, d / 2 + 0.1, 0.26, dh + 0.25 + i * 0.07, d / 2 + 0.115, '#5A3B26');
    // the tin chimney pipe on the roof
    v.box(0.7, h + 0.75, -0.4, 0.16, 1.2, 0.16, '#B3B0A6');
    v.box(0.7, h + 1.38, -0.4, 0.26, 0.06, 0.26, '#8C8981');
  } else {
    for (let i = 0; i < 3; i++) v.boxMin(-dw / 2 + 0.02 + i * 0.29, 0.02, d / 2 + 0.005, -dw / 2 + 0.29 + i * 0.29, dh, d / 2 + 0.05, i % 2 ? '#8E6440' : '#9C6E45');
  }
  // a small shuttered window beside the door
  v.boxMin(0.75, 1.1, d / 2, 1.25, 1.65, d / 2 + 0.04, '#5E7F94');
  g.add(v.mesh());
  const aw = stampAwning({ door: true, striped: true, w: w - 0.2, color: ['red', 'green', 'gold'][seed % 3] });
  aw.root.position.set(0, 0, d / 2);
  g.add(aw.root);
  g.userData.dispose = () => aw.dispose?.();
  return g;
}

/** Daw Sanda's stilt house (local: front +Z, the door up five steps). */
function stiltHouse({ w = 4.4, d = 4.0, h = 2.5, lift = 0.9 } = {}) {
  const g = new THREE.Group();
  const v = new VoxelBuilder();
  for (const x of [-w / 2 + 0.2, 0, w / 2 - 0.2]) for (const z of [-d / 2 + 0.2, d / 2 - 0.2]) v.box(x, lift / 2, z, 0.18, lift, 0.18, '#7E5A38'); // posts
  v.boxMin(-w / 2, lift, -d / 2, w / 2, lift + 0.14, d / 2, '#9C7A55'); // floor
  v.boxMin(-w / 2 + 0.05, lift + 0.14, -d / 2 + 0.05, w / 2 - 0.05, lift + h, d / 2 - 0.05, '#F1E8D2'); // ledger-paper walls
  for (const y of [0.55, 1.15, 1.75]) v.boxMin(-w / 2 + 0.04, lift + y, d / 2 - 0.06, w / 2 - 0.04, lift + y + 0.025, d / 2 - 0.02, '#D98579'); // red rules
  v.boxMin(-w / 2 + 0.04, lift + 0.14, d / 2 - 0.06, -w / 2 + 0.6, lift + h, d / 2 - 0.02, '#8EAFCF'); // a blue margin column
  // roof: two slopes (stepped)
  for (let i = 0; i < 4; i++) v.boxMin(-w / 2 - 0.35 + i * 0.12, lift + h + i * 0.2, -d / 2 - 0.3, w / 2 + 0.35 - i * 0.12, lift + h + 0.2 + i * 0.2, d / 2 + 0.4, i % 2 ? '#8E6440' : '#A67A50');
  // the plank door and its frame
  v.boxMin(-0.5, lift + 0.12, d / 2 - 0.04, 0.5, lift + 2.0, d / 2 + 0.02, '#5A3B26');
  for (let i = 0; i < 3; i++) v.boxMin(-0.44 + i * 0.29, lift + 0.16, d / 2 + 0.015, -0.17 + i * 0.29, lift + 1.94, d / 2 + 0.05, i % 2 ? '#8E6440' : '#9C6E45');
  // five steps down to the quay
  for (let i = 0; i < 5; i++) {
    const y = lift - (i + 1) * (lift / 5);
    v.boxMin(-0.55, Math.max(0, y), d / 2 + i * 0.32, 0.55, y + lift / 5, d / 2 + (i + 1) * 0.32, i % 2 ? '#8E6440' : '#A67A50');
  }
  // a window on the side and the washing line under the eaves with patch-cloth scraps
  v.boxMin(w / 2 - 0.02, lift + 1.0, -0.6, w / 2 + 0.03, lift + 1.6, 0.2, '#5E7F94');
  v.boxMin(-w / 2 - 0.2, lift + 2.15, d / 2 + 0.25, w / 2 + 0.2, lift + 2.17, d / 2 + 0.27, '#C9AE7E');
  const cloth = ['#C8323C', '#E2B33C', '#3E5F7A', '#4E8C86', '#E8A0A8', '#6F9E5B', '#D9773A'];
  cloth.forEach((c, i) => v.boxMin(-w / 2 + 0.2 + i * 0.6, lift + 1.82, d / 2 + 0.25, -w / 2 + 0.55 + i * 0.6, lift + 2.15, d / 2 + 0.27, c));
  g.add(v.mesh());
  return g;
}

/** A narrow plank door painted with a red envelope, and the small result poster beside it (on a wall, front +Z). */
function postRoomDoor() {
  const g = new THREE.Group();
  const v = new VoxelBuilder();
  v.boxMin(-0.42, 0, 0, 0.42, 2.0, 0.08, '#5A3B26');
  v.boxMin(-0.36, 0.03, 0.05, 0.36, 1.94, 0.1, '#9C6E45');
  v.boxMin(-0.2, 1.05, 0.1, 0.2, 1.33, 0.12, '#C8323C'); // the painted envelope
  v.boxMin(-0.2, 1.19, 0.12, 0.0, 1.21, 0.13, '#8E2730');
  v.boxMin(0.0, 1.19, 0.12, 0.2, 1.21, 0.13, '#8E2730');
  g.add(v.mesh());
  const poster = sign(['ပြိုင်ပွဲရလဒ်', '— အထဲမှာ —'], 0.42, 0.3, { bg: '#FFFDF8', border: '#C8323C', borderWidth: 12, radius: 10 });
  poster.position.set(0.75, 1.45, 0.06);
  g.add(poster);
  return g;
}

/** Ko Lwin's cloth bundle: the block, his note, her apron (carried by Maya). */
export function bundleProp() {
  const g = new THREE.Group();
  g.name = 'd5Bundle';
  const v = new VoxelBuilder();
  v.box(0, 0.07, 0, 0.26, 0.14, 0.2, '#D9C7A3');
  v.box(0, 0.145, 0, 0.27, 0.02, 0.05, '#B5463C');
  v.box(0, 0.145, 0, 0.05, 0.02, 0.21, '#B5463C');
  v.box(0, 0.17, 0, 0.08, 0.04, 0.08, '#B5463C'); // the knot
  g.add(v.mesh());
  g.userData.dispose = () => disposeTree(g);
  return g;
}

// ---------------------------------------------------------------------------------------------
// the outdoor set
// ---------------------------------------------------------------------------------------------
export function buildDay5World(story) {
  const { game } = story;
  const scene = game.world.scene;
  const root = new THREE.Group();
  root.name = 'day5';
  scene.add(root);
  const parts = []; // { root, update?, dispose? }
  const shapes = []; // keep-out shapes added to the open world's space
  const space = story.openWorld?.space;
  const block = (o) => {
    shapes.push(o);
    if (space) space.add([o]); else story.foot?.obstacles?.push(o);
  };
  const add = (p, x, y, z, ry = 0) => {
    const r = p.root || p;
    r.position.set(x, y, z);
    r.rotation.y = ry;
    root.add(r);
    parts.push(p.root ? p : { root: r, dispose: () => { call(r.userData, 'dispose'); disposeTree(r); } });
    return p;
  };
  const A = {}; // anchors: where people stand and doors are
  const mine = []; // doors this page registered (taken away again in dispose)
  const reg = (list) => { registerDoors(list); for (const d of list) { mine.push(d.room); if (DOORS[d.room]) DOORS[d.room].d5 = true; } };
  A.reg = reg;

  // ===== Envelope Market =====
  const MS = MR.SPOTS || {};
  const builtPost = !DOORS.postroom;
  if (builtPost) {
    const po = letterCounter({});
    add(po, FALLBACK.post.x, 0, FALLBACK.post.z, 0);
    const pd = po.door ? { x: FALLBACK.post.x + po.door.x, z: FALLBACK.post.z + po.door.z } : { x: FALLBACK.post.x, z: 296.6 };
    if (!DOORS.marketpost) reg([{ room: 'marketpost', x: pd.x, z: Math.min(pd.z, 296.6), facing: 0, region: 'market', r: 0.8 }]);
    add(postRoomDoor(), FALLBACK.postroom.x, 0, FALLBACK.postroom.z - 0.06, 0);
    reg([{ room: 'postroom', x: FALLBACK.postroom.x, z: FALLBACK.postroom.z + 0.05, facing: 0, region: 'market', r: 0.75 }]);
    block({ type: 'box', minX: FALLBACK.post.x - 3.5, maxX: FALLBACK.post.x + 3.5, minZ: FALLBACK.post.z - 2.1, maxZ: FALLBACK.post.z + 2.0 });
  }
  const pr = DOORS.postroom;
  A.postroom = { x: pr.x, z: pr.z, facing: pr.facing ?? 0 };
  if (MS.thiri && !builtPost) A.thiri = { x: MS.thiri.x, z: MS.thiri.z, heading: MS.thiri.h ?? 0 };
  else A.thiri = builtPost ? { x: FALLBACK.post.x - 4.3, z: 297.3, heading: 0.3 } : { x: pr.x - 7.5, z: pr.z + 0.9, heading: 0.3 };
  if (builtPost) { const bp = bambooPost({}); add(bp, A.thiri.x - 0.6, 0, A.thiri.z - 0.35, 0); block({ type: 'circle', x: A.thiri.x - 0.6, z: A.thiri.z - 0.35, r: 0.15 }); }

  const builtShops = !DOORS.carvershop;
  let pipe = null;
  if (builtShops) {
    FALLBACK.shops.forEach((s, i) => {
      add(carverShop({ third: i === 2, seed: i }), s.x, 0, s.z, PI);
      block({ type: 'box', minX: s.x - 1.5, maxX: s.x + 1.5, minZ: s.z - 1.48, maxZ: s.z + 1.5 });
    });
    const t = FALLBACK.shops[2];
    reg([{ room: 'carvershop', x: t.x, z: t.z - 1.55, facing: PI, region: 'market', r: 0.75 }]);
    pipe = { x: t.x - 0.7, y: 2.7 + 1.42, z: t.z + 0.4 };
    // the two busy benches out under their awnings
    for (const s of FALLBACK.shops.slice(0, 2)) {
      const b = carvingBench({ cold: false, block: 'bare', shavings: 0.8 });
      add(b, s.x - 0.65, 0, s.z - 2.0, PI);
      call(b, 'setGlow', 1);
      block({ type: 'box', minX: s.x - 1.4, maxX: s.x + 0.1, minZ: s.z - 2.4, maxZ: s.z - 1.6 });
    }
  } else if (MS.kolwinChimney) pipe = { x: MS.kolwinChimney.x, y: MS.kolwinChimney.y ?? 5.3, z: MS.kolwinChimney.z };
  const cs = DOORS.carvershop;
  A.carvershop = { x: cs.x, z: cs.z, facing: cs.facing ?? PI };
  // the row runs along from Ko Lwin's door; the two busy carvers at the first two benches
  const fx = Math.sin(A.carvershop.facing), fz = Math.cos(A.carvershop.facing); // out of the door
  const sx = fz, sz = -fx;
  const along = (k, out = 0.9) => ({ x: cs.x + sx * k + fx * out, z: cs.z + sz * k + fz * out });
  if (!builtShops && MS.khwarnyo && MS.kolwin) {
    // (the district's bench spots: Day 4 had Khwar Nyo and Ko Lwin there; today two other carvers work them)
    A.carver1 = { x: MS.khwarnyo.x, z: MS.khwarnyo.z, heading: MS.khwarnyo.h ?? 0 };
    A.carver2 = { x: MS.kolwin.x, z: MS.kolwin.z, heading: MS.kolwin.h ?? 0 };
    A.apprStop = [{ x: MS.kolwin.x - 1.8, z: MS.kolwin.z + 2.6 }, { x: MS.kolwin.x - 1.0, z: MS.kolwin.z + 3.0 }];
  } else {
    A.carver1 = { ...along(6.0, 0.75), heading: A.carvershop.facing };
    A.carver2 = { ...along(2.6, 0.75), heading: A.carvershop.facing };
    A.apprStop = [along(4.2, 2.2), along(3.4, 2.6)];
  }
  if (pipe) {
    const sm = kilnSmoke({ height: 3.4, size: 0.35, wind: 0.35, tint: SMOKE_TINT.brazier, speed: 0.05 });
    add(sm, pipe.x, pipe.y, pipe.z, 0);
    call(sm, 'setOn', 0);
    A.smoke = sm;
  }

  if (!DOORS.teashop) {
    const ts = teaShop({ awning: 'stamp' });
    const dl = ts.door || { x: -0.9, z: 1.9 };
    add(ts, FALLBACK.tea.x, 0, FALLBACK.tea.z, 0);
    reg([{ room: 'teashop', x: FALLBACK.tea.x + dl.x, z: FALLBACK.tea.z + Math.min(dl.z, 1.95), facing: 0, region: 'market', r: 0.8 }]);
    block({ type: 'box', minX: FALLBACK.tea.x - 2.6, maxX: FALLBACK.tea.x + 2.6, minZ: FALLBACK.tea.z - 1.9, maxZ: FALLBACK.tea.z + 1.85 });
    call(ts, 'setSteam', 1);
  }
  A.teashop = { x: DOORS.teashop.x, z: DOORS.teashop.z };

  // ===== Ledger Wharf (the district's own art when it has it; else Day 5's props) =====
  const WS = WR.SPOTS || {};
  const witems = WR.ITEMS || [];
  const item = (...ks) => witems.find((it) => ks.includes(it.k)) || null;
  // the jetties, north to south (Big Jetty first, Jetty End last)
  const jets = witems.filter((it) => (it.k === 'jetty' || it.k === 'wJetty') && !it.low && it.len).sort((a, b) => a.z - b.z);
  const tipOf = (it) => ({ x: it.x + it.len / 2, z: it.z });
  const littleJ = jets.find((j) => /ငယ်/.test(j.name || '')) || jets[jets.length - 2];
  const endJ = jets.find((j) => j.end) || jets[jets.length - 1];
  const J = {
    big: jets[0] ? tipOf(jets[0]) : { x: JETTY.big.tip, z: JETTY.big.z },
    little: littleJ ? tipOf(littleJ) : { x: JETTY.little.tip, z: JETTY.little.z },
    end: endJ ? tipOf(endJ) : { x: JETTY.end.tip, z: JETTY.end.z },
  };
  A.J = J;

  if (!DOORS.weighhouse) {
    const wh = weighHouse({ door: 1 });
    add(wh, FALLBACK.weigh.x, 0, FALLBACK.weigh.z, 0);
    const dz = wh.door ? wh.door.z : 3.65;
    reg([{ room: 'weighhouse', x: FALLBACK.weigh.x, z: FALLBACK.weigh.z + Math.min(dz, 2.6), facing: 0, region: 'wharf', r: 1.1 }]);
    block({ type: 'box', minX: FALLBACK.weigh.x - 2.5, maxX: FALLBACK.weigh.x + 2.5, minZ: FALLBACK.weigh.z - 1.75, maxZ: FALLBACK.weigh.z + 1.6 });
  }
  A.weighhouse = { x: DOORS.weighhouse.x, z: DOORS.weighhouse.z };
  const wPile = item('parcelPile', 'parcels', 'wParcels');
  if (wPile) A.pile = { x: wPile.x, z: wPile.z };
  else {
    A.pile = WS.parcels ? { x: WS.parcels.x, z: WS.parcels.z } : { x: A.weighhouse.x - 4.2, z: A.weighhouse.z + 1.2 };
    const pile = parcelPile({ tags: ['duck', 'cane', 'duck', 'cane', 'duck', 'fish'] });
    add(pile, A.pile.x, 0, A.pile.z, 0.3);
    block({ type: 'box', minX: A.pile.x - 0.65, maxX: A.pile.x + 0.65, minZ: A.pile.z - 0.45, maxZ: A.pile.z + 0.45 });
  }
  A.maungnge = WS.maungnge ? { x: WS.maungnge.x, z: WS.maungnge.z, heading: WS.maungnge.h ?? PI / 2 } : { x: A.pile.x - 1.1, z: A.pile.z + 0.6, heading: PI / 2 };

  // Daw Sanda's house: Day 5 opens its door only once Ko Thiha opens it (day5.js)
  const wHouse = item('sandaHouse');
  if (!DOORS.sandahouse && !wHouse) {
    add(stiltHouse({}), FALLBACK.sanda.x, 0, FALLBACK.sanda.z, PI / 2);
    block({ type: 'box', minX: FALLBACK.sanda.x - 2.05, maxX: FALLBACK.sanda.x + 2.05, minZ: FALLBACK.sanda.z - 2.25, maxZ: FALLBACK.sanda.z + 2.25 });
    A.sandaDoor = { room: 'sandahouse', x: FALLBACK.sanda.x + 2.0 + 1.75, z: FALLBACK.sanda.z, facing: PI / 2, region: 'wharf', r: 0.9 };
  } else if (DOORS.sandahouse) {
    A.sandaDoor = { ...DOORS.sandahouse };
  } else {
    // the district drew the house but declared no door yet: its front faces +Z unless turned
    const fr = wHouse.ry || 0, dd = (wHouse.d || 4) / 2 + 1.4;
    A.sandaDoor = { room: 'sandahouse', x: wHouse.x + Math.sin(fr) * dd, z: wHouse.z + Math.cos(fr) * dd, facing: fr, region: 'wharf', r: 0.9 };
  }

  // the ferry at the Big Jetty (bailing), the raft at Little Jetty
  const wFerry = item('ferry');
  if (wFerry) A.ferryAt = { x: wFerry.x, z: wFerry.z, r: 5 };
  else {
    const fy = ferryProp({ bailing: true });
    add(fy, J.big.x - 5.2, -0.75, J.big.z - 2.75, 0);
    A.ferry = fy;
    A.ferryAt = { x: J.big.x - 5.2, z: J.big.z - 2.75, r: 5 };
  }
  A.ferryman = WS.ferryman ? { x: WS.ferryman.x, z: WS.ferryman.z, heading: WS.ferryman.h ?? PI } : { x: J.big.x - 4.8, z: J.big.z - 0.55, heading: PI };
  const wRaft = item('oldRaft');
  if (wRaft) A.raftAt = { x: wRaft.x, z: wRaft.z, r: 2.4 };
  else {
    const rf = raftProp({ patches: 7, parcels: 0, pole: true });
    add(rf, J.little.x - 2.6, -0.4, J.little.z + 1.9, 0);
    A.raft = rf;
    A.raftAt = { x: J.little.x - 2.6, z: J.little.z + 1.9, r: 2.4 };
  }
  A.kothiha = WS.kothiha ? { x: WS.kothiha.x, z: WS.kothiha.z, heading: WS.kothiha.h ?? 0 } : { x: J.little.x - 1.4, z: J.little.z + 0.35, heading: 0 };
  A.kothihaMum = { x: A.weighhouse.x + 1.2, z: A.weighhouse.z + 0.9, heading: PI };

  // the sandbar across the side channel: Duck Jetty and Cane Jetty, low and shallow (the ferry can't go in)
  const far = [];
  const wSand = item('sandbar', 'shoal');
  if (wSand) {
    A.sandbar = { x: wSand.x, z: wSand.z, r: Math.max(6, (wSand.d || wSand.len || 20) / 2) };
    A.sandbarObjs = [];
  } else {
    const sand = new VoxelBuilder();
    sand.boxMin(102, -0.95, 437, 110, -0.62, 467, '#E8D9B2');
    sand.boxMin(100.6, -1.0, 439, 102, -0.82, 465, '#D9E6E3'); // pale shallow water at its edge
    for (let i = 0; i < 9; i++) sand.box(103.5 + (i % 3) * 2.2, -0.55, 440 + i * 3, 0.12, 0.5 + (i % 2) * 0.3, 0.12, '#A8925A'); // reeds
    const sandMesh = sand.mesh();
    sandMesh.name = 'd5Sandbar';
    root.add(sandMesh);
    parts.push({ root: sandMesh, dispose: () => disposeTree(sandMesh) });
    const duckJ = jettyProp({ len: 4.5, low: true, name: 'ဘဲဆိပ်', en: 'Duck Jetty', dir: -1, cargo: 'duck', seed: 3 });
    add(duckJ, 102.6, -0.62, 446, 0);
    const caneJ = jettyProp({ len: 4.5, low: true, name: 'ကြိမ်ဆိပ်', en: 'Cane Jetty', dir: -1, cargo: 'cane', seed: 5 });
    add(caneJ, 102.6, -0.62, 460, 0);
    const post = oldMansPost();
    add(post, 99.0, -0.62, 460.7, 0);
    A.sandbar = { x: 104, z: 452, r: 15 };
    A.sandbarObjs = [sandMesh, duckJ.root, caneJ.root, post.root];
    // walk-ons out of reach: the duck-keeper and the old man on Cane Jetty's post (Day 6's person; he only watches)
    for (const [look, x, y, z, h] of [['duckkeeper', 99.6, -0.62, 446.6, -PI / 2], ['oldman', 99.1, -0.62, 461.4, -PI / 2]]) {
      const p = createPerson(LOOKS[look]);
      p.root.position.set(x, y, z);
      p.root.rotation.y = h;
      root.add(p.root);
      far.push(p);
    }
  }

  // the east bank: a tall folded page in the mist, beyond the deep channel (nothing to land on)
  if (!item('mistBank')) {
    const mist = mistBank({ w: 40, h: 8 });
    add(mist, J.end.x + 29, -2.5, J.end.z, -PI / 2);
  }
  A.jettyEnd = { x: J.end.x - 2.5, z: J.end.z + 0.4, minX: J.end.x - 6.5, minZ: J.end.z - 4.6, maxZ: J.end.z + 4.6 };
  A.naychi = WS.naychi ? { x: WS.naychi.x, z: WS.naychi.z, heading: WS.naychi.h ?? PI / 2 } : { x: J.end.x - 1.4, z: J.end.z + 1.3, heading: PI / 2 };
  A.porterW1 = { x: 60.4, z: 430.5, heading: PI / 2 };
  A.porterW2 = { x: 64.6, z: 446.0, heading: -PI / 2 };

  let carved = false;
  return {
    A, root,
    setCarved(on) { carved = !!on; call(A.smoke, 'setOn', carved ? 1 : 0); },
    update(dt, t) {
      for (const p of parts) call(p, 'update', dt, t);
      for (const p of far) p.update(dt, { speed: 0 });
    },
    dispose() {
      for (const p of parts) { try { call(p, 'dispose'); } catch (e) { console.warn('day5 prop', e); } }
      for (const p of far) p.dispose();
      root.removeFromParent();
      space?.remove?.(shapes); // (then neutralised too: a harmless fallback)
      for (const o of shapes) {
        if (o.type === 'circle') { o.x = o.z = 1e9; o.r = 0; } else { o.minX = o.maxX = o.minZ = o.maxZ = 1e9; }
        const all = space?.all || story.foot?.obstacles;
        const k = all ? all.indexOf(o) : -1;
        if (k >= 0) all.splice(k, 1);
      }
      for (const id of mine) if (DOORS[id]?.d5) delete DOORS[id];
    },
  };
}

/** True when the game is in English (for a few canvas texts). */
export const isEn = () => lang() === 'en';
