// Day 10's set in the Diary Garden (day10-spec 1, INDEX 13.4). The district file (world/regions/garden.js)
// lays only the lane, the clasp and the two desks; until the district builder places the plots, the kiln square
// and the shells, Day 10 stands them up here itself (SHARED NEEDS in the report) and takes them away on dispose.
//
// The map's lane runs from the clasp (258, 124) north to gEast (258, 100), then WEST along z = 100: the spec's
// "east down the lane" is west here. North side only (z < 100), fronts +Z, nothing taller than 1 m south of
// the lane. West -> east along the lane's north side: the kiln square (paper store, kiln shed + packing-room
// door, committee lean-to, drying hall), the corner tea shop at the lane's mouth, the gourd aunty's plot,
// U Hpo Htaw's plot (the third after the clasp), plot 2, plot 1.
//
//   const set = buildGarden(story)   -> { P (places), props, doors, targets, update(dt,t), dispose() }
//   buildBoard(story)                -> the "ask Maya" board by the Post Office (Home Book), same shape
import * as THREE from '../game/three.js';
import { PALETTE } from '../game/toon.js';
import { VoxelBuilder, jitter } from '../game/voxel.js';
import { DOORS } from './doors.js';
import { ASK_BOARD, SORT_DOOR } from './world/regions/home.js';
import { BUILT, SPOTS } from './world/regions/garden.js';
import {
  lockedGate, trellisPost, bulbRack, seedBeds, gardenBench, gourdTrellis, kilnBig, marketStall,
  paperStore, handCart, paperBale, waterCan, lampWindow, lockDoor,
} from './props5.js';

// The district file (world/regions/garden.js) now stands the buildings, the plot fences, plots 1 and 2 and the
// kiln square: BUILT lists the rooms whose building is there. Day 10 then draws only what is the day's own (the
// gate, his bench, trellis, rack and beds, the gourd trellis, the cart) and hangs the paper store's live bits
// (shutter, lamp window, lock door) on the region store (SPOTS.store). The old stand-ins stay only as a fallback.
const OWN = (room) => !BUILT.has(room);
import { teaShop } from './props3.js';

const C = {
  post: '#8C6A48', postD: '#6E5034', rail: '#B08A5E', wall: '#EADFC8', wallD: '#CDBB98', roof: '#8E5A3C', roofD: '#6E4430',
  brick: '#A0503A', brickD: '#7E3C2B', plank: '#9C7550', plankD: '#7A5838', green: '#3E7A5A', gourd: '#A9C27A', straw: '#E3C46E',
  cork: '#B98E5C', corkD: '#94703F', paper: '#FFFDF8', paper2: '#F4EAD2', pencil: '#6A645C', maroon: PALETTE.maroon, gold: PALETTE.gold,
};

/** Places (world metres). Exported so day10.js and the tester agree on where things are. */
export const P = {
  lane: { z: 100, kerbN: 98.75, kerbS: 101.25 },
  clasp: { x: 258, z: 137.6 },
  fenceZ: 97.9, backZ: 90.4,
  plot1: { x0: 250.5, x1: 256.2 }, plot2: { x0: 245, x1: 250.5 }, plotHP: { x0: 237.5, x1: 245 }, plotGA: { x0: 231, x1: 237.5 },
  gate: { x: 241.2, z: 97.9 },
  hpBench: { x: 241.2, z: 96.95 },
  hp: { x: 241.2, z: 97.3, h: 0 },
  trellis: { x: 242.85, z: 97.25 },
  rack: { x: 238.7, z: 97.15 },
  beds: [{ x: 238.6, z: 95.4 }, { x: 241.2, z: 95.4 }, { x: 243.8, z: 95.4 }],
  visitors: { x: 243.6, z: 92.5 },
  hpHouse: { x: 240.4, z: 91.9, w: 3.4, d: 2.4 },
  hook: { x: 241.75, y: 1.55, z: 93.12 },
  vine: { x: 237.5, z: 96.6 },
  laneBench: { x: 241.2, z: 102.05 },
  gaTrellis: { x: 236.3, z: 96.8 },
  ga: { x: 235.6, z: 97.35, h: 0.6 },
  gaHouse: { x: 233.4, z: 95.0, w: 3.6, d: 2.9 },
  tea: { x: 227.5, z: 95.6 },
  store: { x: 203.5, z: 88.0 },
  kiln: { x: 210.6, z: 87.6 },
  pack: { x: 215.8, z: 88.2, w: 2.4, d: 3.4 },
  committee: { x: 219.1, z: 88.2, w: 2.8, d: 3.4 },
  hall: { x: 223.2, z: 87.9, w: 4.6, d: 4.4 },
  stalls: [{ x: 199.6, z: 94.6, slate: '' }, { x: 203.4, z: 94.8, slate: 'ဒေါ်အုန်း · အိုး' }, { x: 207.4, z: 94.6, slate: '' }, { x: 219.4, z: 94.6, slate: '' }],
  cart: { x: 204.6, z: 102.7 },
  kp: { x: 203.1, z: 102.35, h: Math.PI / 2 },
  crate: { x: 204.35, z: 103.75 },
  stair: { x: 206.95, z: 90.9 },
  mnLane: { x: 248.5, z: 101.3 },
  mnFrom: { x: 197.5, z: 96.8 }, mnTo: { x: 212.5, z: 97.0 },
  // home (the Post Office: landmark 'contact', main door (16.3, 3.0)); the board stands just west of it
  board: { x: ASK_BOARD.x, z: ASK_BOARD.z }, // the shared board (world/regions/home.js; its look: story.board)
  sortDoor: { x: SORT_DOOR.x, z: SORT_DOOR.z }, // the sorting room's side door on the west wall (home.js)
  wwEve: { x: 14.55, z: 1.75, h: -Math.PI / 2 },
  // where the region's buildings really stand (Day 10 reads these; the fields above stay as Day 12 reads them)
  R: OWN('paperstore') ? null : {
    store: { x: SPOTS.store.x, z: SPOTS.store.z },
    storeDoor: SPOTS.store.door,
    stair: { x: SPOTS.store.x + SPOTS.store.w / 2 + 0.55, y: 0.23, z: SPOTS.store.z + SPOTS.store.d / 2 + 0.57 }, // the stair's first step
    stairStand: { x: SPOTS.store.x + SPOTS.store.w / 2 + 0.15, z: SPOTS.store.z + SPOTS.store.d / 2 + 1.5 },
    offerStand: { x: SPOTS.store.door.x - 1.1, z: SPOTS.store.door.z + 2.25 },
    teaStand: { x: SPOTS.tea.door.x + 0.6, z: SPOTS.tea.door.z + 2.6 },
    kaungStand: { x: SPOTS.pack.door.x, z: SPOTS.pack.door.z + 1.9 },
  },
};

// ---------------------------------------------------------------------------------------------
// small builders (VoxelBuilder, world-local groups)
// ---------------------------------------------------------------------------------------------
function fenceRun(v, x0, z0, x1, z1, seed = 0) {
  const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 1.1));
  const ang = Math.atan2(x1 - x0, z1 - z0);
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
    v.box(x, 0.45, z, 0.09, 0.9, 0.09, jitter(C.post, 0.08, seed + i));
  }
  for (const y of [0.38, 0.74]) v.box((x0 + x1) / 2, y, (z0 + z1) / 2, 0.05, 0.06, len, C.rail, ang);
}
function shell(v, { w, d, h, wall = C.wall, roof = C.roof, door = null, win = null, seed = 1 }) {
  v.boxMin(-w / 2, 0, -d / 2, w / 2, h, d / 2, jitter(wall, 0.04, seed));
  v.boxMin(-w / 2 - 0.05, 0, d / 2 - 0.02, w / 2 + 0.05, 0.25, d / 2 + 0.03, C.wallD);
  // a low pitched roof (ridge along X)
  for (let k = 0; k < 4; k++) v.boxMin(-w / 2 - 0.25 + k * 0.0, h + k * 0.14, -d / 2 - 0.3 + k * (d / 8), w / 2 + 0.25, h + 0.14 + k * 0.14, d / 2 + 0.3 - k * (d / 8), jitter(k % 2 ? roof : C.roofD, 0.05, seed + k));
  if (door) {
    v.boxMin(door.x - door.w / 2 - 0.08, 0.02, d / 2, door.x + door.w / 2 + 0.08, door.h + 0.08, d / 2 + 0.06, door.frame || C.plankD);
    v.boxMin(door.x - door.w / 2, 0.02, d / 2 + 0.03, door.x + door.w / 2, door.h, d / 2 + 0.08 - (door.open ? 0.05 : 0), door.open ? '#3A2A20' : (door.panel || C.plank));
    if (!door.open) for (let i = 1; i < 4; i++) v.box(door.x - door.w / 2 + (i * door.w) / 4, door.h / 2, d / 2 + 0.085, 0.015, door.h - 0.1, 0.01, C.plankD);
  }
  if (win) v.boxMin(win.x - 0.4, 1.1, d / 2, win.x + 0.4, 1.7, d / 2 + 0.05, '#4E5A60');
}
function place(scene, list, obj, x, z, ry = 0, y = 0) {
  const root = obj.root || obj;
  root.position.set(x, y, z);
  root.rotation.y = ry;
  scene.add(root);
  list.push(obj);
  return obj;
}
function meshOf(v, list, scene) {
  const m = v.mesh({ outline: true, px: 1.3 });
  scene.add(m);
  list.push({ root: m, dispose() { m.geometry.dispose(); m.children.forEach((c) => c.geometry?.dispose()); } });
  return m;
}

/**
 * The paper store's live bits, hung on the region's gdPaperStore (world/art/garden.js paperStore: doorway 3.6 m wide
 * at doorX, ground floor 3 m, the upstairs set back 2.6 m with the lamp window 1.6 m west of centre and the lock door
 * 1.3 m in from the east end): the roll-up shutter that rattles down at dusk, the lamp window (lit, a figure behind
 * the curtain, the curtain's jerk) and the three-lock door (jiggles). Same handle as props5 paperStore.
 */
function liveStore() {
  const S = SPOTS.store, FZ = S.z + S.d / 2, H1 = 3.0, UZ = FZ - 2.6;
  const DX = S.door.x, DW = 3.7, TOP = H1 - 0.22;
  const root = new THREE.Group();
  root.name = 'd10LiveStore';
  const shut = new THREE.Group();
  shut.position.set(DX, TOP, FZ + 0.15);
  const sv = new VoxelBuilder();
  sv.box(0, -TOP / 2, 0, DW, TOP, 0.03, '#A39E92');
  for (let y = -0.08; y > -TOP; y -= 0.1) sv.box(0, y, 0.02, DW, 0.035, 0.02, '#B8B3A7');
  sv.box(0, -TOP + 0.03, 0.03, DW, 0.06, 0.05, '#4A4642');
  for (const sx of [-0.6, 0.6]) sv.box(sx, -TOP + 0.08, 0.06, 0.12, 0.06, 0.04, '#6E6A64');
  shut.add(sv.mesh());
  root.add(shut);
  const lw = lampWindow({ lit: 0 });
  lw.root.position.set(S.lamp.x, H1 + 1.4, UZ + 0.04);
  root.add(lw.root);
  const ld = lockDoor({ scale: 0.95 });
  ld.root.position.set(S.x + S.w / 2 - 1.3, H1 + 0.16, UZ + 0.12);
  root.add(ld.root);
  function setShutter(t) { t = Math.max(0, Math.min(1, t)); shut.scale.y = Math.max(0.02, t); shut.visible = t > 0.02; }
  setShutter(0);
  return {
    root, door: new THREE.Vector3(DX, 0, FZ + 0.6), lockDoor: ld, lampWindow: lw,
    setShutter, setLit: lw.setLit,
    update(dt, t) { ld.update(dt); lw.update(dt, t); },
    dispose() {
      ld.dispose(); lw.dispose();
      shut.traverse((o) => { o.geometry?.dispose?.(); });
    },
  };
}

// ---------------------------------------------------------------------------------------------
// the Garden set
// ---------------------------------------------------------------------------------------------
export function buildGarden(story) {
  const scene = story.game.world.scene;
  const props = [];
  const obs = [];
  const space = story.openWorld?.space || null;
  const addOb = (o) => { obs.push(o); if (space) space.add([o]); else story.foot.obstacles.push(o); };
  const box = (x0, z0, x1, z1) => addOb({ type: 'box', minX: Math.min(x0, x1), maxX: Math.max(x0, x1), minZ: Math.min(z0, z1), maxZ: Math.max(z0, z1) });

  // ---- fences: one solid front line (U Hpo Htaw's gate in it), side fences, a back fence
  const FZ = P.fenceZ;
  if (OWN('hpohtawshed')) { // (the region lays the plot fences, the wickets and plots 1 and 2's dated beds)
    const fv = new VoxelBuilder();
    fenceRun(fv, P.plotGA.x0, FZ, P.gaHouse.x - P.gaHouse.w / 2, FZ, 1);
    fenceRun(fv, P.gaHouse.x + P.gaHouse.w / 2, FZ, P.gate.x - 1.15, FZ, 7);
    fenceRun(fv, P.gate.x + 1.15, FZ, P.plot1.x1, FZ, 13);
    for (const x of [P.plotGA.x0, P.plotHP.x0, P.plotHP.x1, P.plot2.x1, P.plot1.x1]) fenceRun(fv, x, FZ, x, P.backZ, 31 + x);
    fenceRun(fv, P.plotGA.x0, P.backZ, P.plot1.x1, P.backZ, 51);
    // plot 1 and 2: closed wicket gates, beds, a few flowers on today's line (yesterday's wilt)
    for (const gx of [247.7, 253.3]) { fv.box(gx, 0.42, FZ + 0.02, 1.0, 0.7, 0.05, C.rail); for (const s of [-1, 1]) fv.box(gx + s * 0.55, 0.55, FZ, 0.12, 1.1, 0.12, C.postD); }
    meshOf(fv, props, scene);
    box(P.plotGA.x0 - 0.1, FZ - 0.12, P.plot1.x1 + 0.1, FZ + 0.12);
    for (const x of [P.plotGA.x0, P.plot1.x1]) box(x - 0.12, P.backZ, x + 0.12, FZ);
    box(P.plotGA.x0, P.backZ - 0.12, P.plot1.x1, P.backZ + 0.12);
    for (const [i, b] of [[0, { x: 253.3, z: 95.2 }], [1, { x: 247.7, z: 95.2 }], [2, { x: 253.3, z: 92.6 }], [3, { x: 247.7, z: 92.6 }]]) {
      place(scene, props, seedBeds({ w: 2.6, d: 1.1, seed: 20 + i, date: i < 2 ? '၁၀ ရက်' : '၉ ရက်', state: i < 2 ? 'tended' : 'growing' }), b.x, b.z);
    }
  }

  // ---- U Hpo Htaw's plot (the third after the clasp)
  const gate = place(scene, props, lockedGate({ locked: true, ajar: 0, loaf: true }), P.gate.x, P.gate.z);
  box(P.gate.x - 1.15, FZ - 0.15, P.gate.x + 1.15, FZ + 0.15);
  const hpBench = place(scene, props, gardenBench({ turn: 0 }), P.hpBench.x, P.hpBench.z);
  const trellis = place(scene, props, trellisPost({ tendril: 1, mode: 'coil' }), P.trellis.x, P.trellis.z);
  const rack = place(scene, props, bulbRack({ count: 60 }), P.rack.x, P.rack.z);
  const beds = P.beds.map((b, i) => place(scene, props, seedBeds({ w: 2.2, d: 1.0, seed: 3 + i, date: '၁၀ ရက်' }), b.x, b.z));
  const visitors = place(scene, props, gardenBench({ visitors: true }), P.visitors.x, P.visitors.z, Math.PI);
  // his garden house (`hpohtawshed`, Day 12): plank door facing the lane, shut today; the empty hook on its wall
  // (the region's gdHpHouse draws the house, the empty hook and the pale patch: SPOTS.hp.hook)
  const hook = OWN('hpohtawshed') ? P.hook : SPOTS.hp.hook;
  if (OWN('hpohtawshed')) {
    const hv = new VoxelBuilder();
    shell(hv, { w: P.hpHouse.w, d: P.hpHouse.d, h: 2.1, wall: '#D9CBA8', door: { x: -0.4, w: 0.8, h: 1.75 }, seed: 9 });
    hv.box(P.hook.x - P.hpHouse.x, P.hook.y, P.hpHouse.d / 2 + 0.06, 0.05, 0.05, 0.1, '#4A3B30');
    hv.box(P.hook.x - P.hpHouse.x, P.hook.y - 0.04, P.hpHouse.d / 2 + 0.11, 0.05, 0.1, 0.03, '#4A3B30');
    hv.box(P.hook.x - P.hpHouse.x + 0.35, 1.3, P.hpHouse.d / 2 + 0.06, 0.05, 0.6, 0.05, '#B9A07A'); // a rake's ghost: a pale patch where tools hung
    const hm = meshOf(hv, props, scene); hm.position.set(P.hpHouse.x, 0, P.hpHouse.z);
    box(P.hpHouse.x - P.hpHouse.w / 2, P.hpHouse.z - P.hpHouse.d / 2, P.hpHouse.x + P.hpHouse.w / 2, P.hpHouse.z + P.hpHouse.d / 2);
  }
  // his beans over the side fence onto the gourd aunty's trellis (a green run of leaves along the top rail)
  const bv = new VoxelBuilder();
  for (let i = 0; i < 9; i++) bv.box(P.vine.x + 0.2 - i * 0.14, 0.82 + Math.sin(i * 1.7) * 0.06, P.vine.z + Math.cos(i * 2.3) * 0.12, 0.16, 0.1, 0.14, jitter('#5E8F4E', 0.12, i));
  for (let i = 0; i < 4; i++) bv.box(P.vine.x - 0.5 - i * 0.12, 0.95 + i * 0.12, P.vine.z + 0.05, 0.12, 0.09, 0.1, '#6EA05A');
  meshOf(bv, props, scene);

  // ---- the gourd aunty: her trellis and her little house (`gourdhouse`), door on the lane, propped open
  const gtr = place(scene, props, gourdTrellis('up'), P.gaTrellis.x, P.gaTrellis.z);
  if (OWN('gourdhouse')) {
    const gv = new VoxelBuilder();
    shell(gv, { w: P.gaHouse.w, d: P.gaHouse.d, h: 2.3, wall: '#DDE6CF', door: { x: -0.1, w: 0.9, h: 1.9, open: true }, seed: 15 });
    for (let i = 0; i < 6; i++) gv.box(-0.55 + i * 0.22, 2.08 - Math.abs(i - 2.5) * 0.03, P.gaHouse.d / 2 + 0.12, 0.14, 0.2, 0.12, jitter(C.gourd, 0.1, i)); // dried gourds over the door
    meshOf(gv, props, scene).position.set(P.gaHouse.x, 0, P.gaHouse.z);
    box(P.gaHouse.x - P.gaHouse.w / 2, P.gaHouse.z - P.gaHouse.d / 2, P.gaHouse.x + P.gaHouse.w / 2, P.gaHouse.z + P.gaHouse.d / 2);
  }

  // ---- the corner tea shop (`kilntea`) at the lane's mouth (the region's gdTeaShop when it stands)
  let tea = null;
  if (OWN('kilntea')) {
    tea = place(scene, props, teaShop({ awning: 'plain' }), P.tea.x, P.tea.z);
    box(P.tea.x - 2.65, P.tea.z - 1.95, P.tea.x + 2.65, P.tea.z + 1.95);
  }

  // ---- the kiln square: paper store, big kiln, packing-room door, committee lean-to, drying hall, empty stalls
  let store, kiln = null;
  if (OWN('paperstore')) {
    store = place(scene, props, paperStore({ shutter: 0, lit: 0 }), P.store.x, P.store.z);
    box(P.store.x - 3.1, P.store.z - 2.05, P.store.x + 3.1, P.store.z + 1.85);
  } else store = place(scene, props, liveStore(), 0, 0);
  if (OWN('packroom')) {
    kiln = place(scene, props, kilnBig({ glow: 0, smoke: 0.2 }), P.kiln.x, P.kiln.z);
    box(P.kiln.x - 2.6, P.kiln.z - 2.4, P.kiln.x + 2.6, P.kiln.z + 2.4);
  }
  const sv = new VoxelBuilder();
  if (OWN('packroom')) {
    // the packing room: a brick lean-to on the kiln shed, a LOW plank door with straw poking out under it
    sv.boxMin(P.pack.x - P.pack.w / 2, 0, P.pack.z - P.pack.d / 2, P.pack.x + P.pack.w / 2, 2.2, P.pack.z + P.pack.d / 2, jitter(C.brick, 0.05, 3));
    sv.boxMin(P.pack.x - P.pack.w / 2 - 0.15, 2.2, P.pack.z - P.pack.d / 2 - 0.2, P.pack.x + P.pack.w / 2 + 0.15, 2.32, P.pack.z + P.pack.d / 2 + 0.3, '#9C9A92');
    sv.boxMin(P.pack.x - 0.4, 0.02, P.pack.z + P.pack.d / 2, P.pack.x + 0.4, 1.55, P.pack.z + P.pack.d / 2 + 0.07, C.plank);
    for (let i = 0; i < 7; i++) sv.box(P.pack.x - 0.35 + i * 0.11, 0.02, P.pack.z + P.pack.d / 2 + 0.12, 0.08, 0.03, 0.12, C.straw);
    // woodpile by the kiln desk
    for (let i = 0; i < 12; i++) sv.box(P.pack.x - 1.85 + (i % 4) * 0.28, 0.12 + Math.floor(i / 4) * 0.2, P.pack.z + 2.05, 0.24, 0.18, 0.7, jitter('#7A5434', 0.12, i));
    box(P.pack.x - P.pack.w / 2, P.pack.z - P.pack.d / 2, P.pack.x + P.pack.w / 2, P.pack.z + P.pack.d / 2);
  }
  // the committee lean-to (door shut: not a market day) and the drying hall (doors open on green-pot racks)
  if (OWN('committeeroom')) {
    sv.boxMin(P.committee.x - P.committee.w / 2, 0, P.committee.z - P.committee.d / 2, P.committee.x + P.committee.w / 2, 2.3, P.committee.z + P.committee.d / 2, jitter(C.brickD, 0.05, 5));
    sv.boxMin(P.committee.x - 0.45, 0.02, P.committee.z + P.committee.d / 2, P.committee.x + 0.45, 1.9, P.committee.z + P.committee.d / 2 + 0.07, '#5E6E5A');
    box(P.committee.x - P.committee.w / 2, P.committee.z - P.committee.d / 2, P.committee.x + P.committee.w / 2, P.committee.z + P.committee.d / 2);
  }
  if (OWN('dryinghall')) {
    sv.boxMin(P.hall.x - P.hall.w / 2, 0, P.hall.z - P.hall.d / 2, P.hall.x + P.hall.w / 2, 2.8, P.hall.z + P.hall.d / 2, '#E3D6BC');
    sv.boxMin(P.hall.x - P.hall.w / 2 - 0.2, 2.8, P.hall.z - P.hall.d / 2 - 0.2, P.hall.x + P.hall.w / 2 + 0.2, 2.95, P.hall.z + P.hall.d / 2 + 0.35, '#8E5A3C');
    sv.boxMin(P.hall.x - 1.0, 0.02, P.hall.z + P.hall.d / 2, P.hall.x + 1.0, 2.2, P.hall.z + P.hall.d / 2 + 0.05, '#4A3A30');
    for (let i = 0; i < 4; i++) sv.box(P.hall.x - 0.7 + i * 0.46, 0.9 + (i % 2) * 0.4, P.hall.z + P.hall.d / 2 - 0.1, 0.26, 0.3, 0.26, '#A3A98C');
    box(P.hall.x - P.hall.w / 2, P.hall.z - P.hall.d / 2, P.hall.x + P.hall.w / 2, P.hall.z + P.hall.d / 2);
  }
  if (sv.parts.length) meshOf(sv, props, scene);
  // empty stalls (not a market day): the region's two stand at the square's west end
  const stalls = OWN('paperstore') ? P.stalls.map((s, i) => place(scene, props, marketStall({ w: 1.6, striped: i % 2 === 0, slate: true, text: s.slate }), s.x, s.z)) : [];
  if (OWN('paperstore')) for (const s of P.stalls) box(s.x - 0.85, s.z - 0.5, s.x + 0.85, s.z + 0.5);

  // ---- Ko Phyo's hand cart on the south kerb, opposite the store; a bale and the can beside it (from 6.1)
  const cart = place(scene, props, handCart({ lit: 0 }), P.cart.x, P.cart.z);
  box(P.cart.x - 1.0, P.cart.z - 0.6, P.cart.x + 1.0, P.cart.z + 0.6);
  const can = place(scene, props, waterCan({ size: 1.2 }), P.cart.x + 1.25, P.cart.z - 0.2);
  can.root.visible = false;
  const bale = place(scene, props, paperBale({ seed: 5 }), P.cart.x - 1.3, P.cart.z + 0.15, 0.3);
  // the lane bench "that belongs to the lane", south kerb, facing his gate
  const laneBench = place(scene, props, gardenBench({ turn: 0 }), P.laneBench.x, P.laneBench.z, Math.PI);
  box(P.laneBench.x - 0.7, P.laneBench.z - 0.22, P.laneBench.x + 0.7, P.laneBench.z + 0.22);

  // ---- doors into the four rooms (INDEX 13.1): only those the district does not declare (the region's stay its own)
  const doors = [
    { room: 'gourdhouse', x: P.gaHouse.x - 0.1, z: P.gaHouse.z + P.gaHouse.d / 2 + 0.05, facing: 0, r: 0.75, region: 'garden' },
    { room: 'kilntea', x: P.tea.x + (tea?.door?.x ?? -0.9), z: P.tea.z + 1.95, facing: 0, r: 0.8, region: 'garden' },
    { room: 'paperstore', x: P.store.x, z: P.store.z + 2.05, facing: 0, r: 1.15, region: 'garden' },
    { room: 'packroom', x: P.pack.x, z: P.pack.z + P.pack.d / 2 + 0.05, facing: 0, r: 0.7, region: 'garden' },
  ].filter((d) => !DOORS[d.room]);
  story.doors?.registerDoors(doors);

  /** World points the player can tap (no marker: the props themselves). */
  const targets = {
    bell: { x: P.gate.x + 0.55, y: 1.25, z: P.gate.z + 0.12, r: 9 },
    loaf: { x: P.gate.x - 1.05, y: 1.5, z: P.gate.z + 0.05, r: 9 },
    bench: { x: P.hpBench.x + 0.5, y: 0.45, z: P.hpBench.z, r: 9 },
    rack: { x: P.rack.x, y: 0.6, z: P.rack.z, r: 9 },
    visitors: { x: P.visitors.x, y: 0.5, z: P.visitors.z, r: 11 },
    tendril: { x: P.trellis.x, y: 1.2, z: P.trellis.z, r: 9 },
    vine: { x: P.vine.x - 0.2, y: 0.9, z: P.vine.z, r: 9 },
    hook: { x: hook.x, y: hook.y, z: hook.z, r: 11 },
    ...(P.R ? {
      store: { x: SPOTS.store.door.x, y: 1.4, z: SPOTS.store.door.z, r: 22 },
      locks: { x: SPOTS.store.locks.x, y: SPOTS.store.locks.y, z: SPOTS.store.locks.z + 0.1, r: 22 },
      lamp: { x: SPOTS.store.lamp.x, y: SPOTS.store.lamp.y, z: SPOTS.store.lamp.z, r: 22 },
      shutter: { x: SPOTS.store.door.x, y: 1.6, z: SPOTS.store.door.z + 0.1, r: 7 },
    } : {
      store: { x: P.store.x - 1.6, y: 1.4, z: P.store.z + 2.0, r: 22 },
      locks: { x: P.store.x + 1.9, y: 3.7, z: P.store.z + 0.4, r: 22 },
      lamp: { x: P.store.x - 0.6, y: 4.05, z: P.store.z + 0.4, r: 22 },
      shutter: { x: P.store.x, y: 1.6, z: P.store.z + 2.1, r: 7 },
    }),
  };

  return {
    P, gate, hpBench, trellis, rack, beds, visitors, gtr, tea, store, kiln, stalls, cart, can, bale, laneBench, targets, doors,
    update(dt, t) {
      for (const p of props) p.update?.(dt, t);
    },
    dispose() {
      for (const p of props) { p.root?.parent?.remove(p.root); try { p.dispose?.(); } catch { /* shared */ } }
      props.length = 0;
      space?.remove?.(obs);
      for (const o of obs) {
        const arr = space ? space.all : story.foot.obstacles; // (outdoors foot.obstacles IS space.all)
        const k = arr.indexOf(o); if (k >= 0) arr.splice(k, 1);
        // (the spatial hash keeps its reference: move the shape far away so it never collides again)
        if (o.type === 'circle') { o.x = o.z = 1e9; } else { o.minX = o.maxX = o.minZ = o.maxZ = 1e9; }
      }
      obs.length = 0;
      for (const d of doors) if (DOORS[d.room] && DOORS[d.room].x === d.x && DOORS[d.room].z === d.z) delete DOORS[d.room];
      story.doors?.setDoor?.('paperstore', true); // (shut at dusk today: open again for the days after)
    },
  };
}

// ---------------------------------------------------------------------------------------------
// the "ask Maya" board by the Post Office (Home Book) and the sorting room's side door
// ---------------------------------------------------------------------------------------------
export function buildBoard(story, { notes = 30, gap = true } = {}) {
  // the shared board (api.js story.board) and the Home Book's own side door (home.js): today 30 notes, the
  // gap where Ko Kaung's came down
  story.board.set({ notes, gap, replies: 4 });
  return {
    target: { ...story.board.target, r: 6 },
    dispose() {},
  };
}

void THREE;
