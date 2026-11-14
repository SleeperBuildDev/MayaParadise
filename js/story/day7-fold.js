// Day 7 · the Fold's west bridgehead (day7-spec 1.2, 14.4): what the day sets on the bridgehead square,
// and the bridge hands' hut. Local stand-ins until the shared builders exist (see the Day 7 report,
// SHARED NEEDS): the junction region has no hut, no DOORS, and rooms/*.js has no `bridgehut` room yet.
//
//   const fold = buildFold(scene)  -> { board, rope, pier, slate6, hut, lantern, obstacles, update(dt), setLit(k), dispose() }
//   HUT_ROOM = { name, build(opts) }   the walk-in room 'bridgehut' (kit.createRoom, no markers)
//   FOLD = { ... }                     where things stand (world metres, +Z south)
//
// Original art only: plank hut of folded newsprint board, iron stove, rope pegs, a pinned truss plan.
// Burmese on signs is a draft for Maya to proofread.
import * as THREE from '../game/three.js';
import { PALETTE, basic, toon, blobShadow, FONT_MY, roundRect } from '../game/toon.js';
import { VoxelBuilder, jitter } from '../game/voxel.js';
import * as kit from '../game/interiors/kit.js';
import { chalkSlate } from './props2.js';
import { bridgeBoard, ropeFootbridge, middlePier, waterJar } from './props4.js';

const C = {
  news: '#DAD6CB', newsL: '#E9E6DD', newsD: '#BCB7AA', print: '#8A867C', wood: PALETTE.wood, woodD: PALETTE.woodDark,
  woodL: '#CDA577', iron: '#4A3B30', soot: '#2B1E19', maroon: PALETTE.maroon, gold: PALETTE.gold, goldD: PALETTE.goldDeep,
  rope: '#C9AE7E', ropeD: '#A88C5E', tin: '#B9B4AA', tinD: '#8D877C', cream: PALETTE.cream, ink: PALETTE.ink, sky: '#9CC3DE',
  red: '#C8323C', white: '#F4EFE4', lamp: '#FFE3A0',
};

/** Where Day 7 puts things on the bridgehead square (junction region: jSqW (64, 300), foldW (79, 300)). */
export const FOLD = {
  square: { x: 66, z: 300, r: 13 },
  board: { x: 76.0, z: 294.3, ry: -0.9 },
  // where Nay Chi stands under the board, facing it (a step west of the bridge-mouth lamp at (74.6, 297.4), so
  // the lamp never stands between her and the street)
  boardStand: { x: 73.7, z: 295.0, h: Math.atan2(76.0 - 73.7, 294.3 - 295.0) },
  rope: { x: 79.0, z: 293.0, len: 19 },
  pier: { x: 99.0, z: 293.0 },
  hut: { x: 66.5, z: 292.0, w: 4.6, d: 3.8 },
  hutDoor: { x: 66.5, z: 294.1 },
  jar: { x: 61.6, z: 296.4 },
  bench: { x: 60.2, z: 303.6 },
  handA: { x: 77.4, z: 303.4, h: -Math.PI / 2 - 0.4 },
  handB: { x: 70.2, z: 295.2, h: 0.4 },
  lantern: { x: 117.2, z: 300 },
  farBlock: { minX: 115.6, maxX: 119.6, minZ: 296.4, maxZ: 303.6 },
};

// ---------------------------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------------------------
function canvasPlane(w, h, px, draw) {
  const cv = document.createElement('canvas');
  cv.width = Math.round(w * px); cv.height = Math.round(h * px);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic('#ffffff', { map: tex, transparent: true, alphaTest: 0.02 }));
  mesh.userData.ownMat = true;
  const redraw = (fn = draw) => { draw = fn; const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); fn(g, cv.width, cv.height); tex.needsUpdate = true; };
  redraw();
  if (document.fonts?.ready) document.fonts.ready.then(() => redraw());
  return { mesh, tex, redraw };
}
function signText(g, W, H, text, { bg = C.cream, border = C.maroon, ink = C.maroon, size = 0.46 } = {}) {
  g.fillStyle = bg; roundRect(g, 4, 4, W - 8, H - 8, 14); g.fill();
  g.strokeStyle = border; g.lineWidth = 6; g.stroke();
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 ${Math.round(H * size)}px ${FONT_MY}`;
  g.fillText(text, W / 2, H / 2 + 2, W - 24);
}
function disposeTree(root) {
  root.traverse((o) => {
    if (o.geometry && !o.userData.sharedGeo) o.geometry.dispose();
    if (o.userData.ownMat) { o.material.map?.dispose(); o.material.dispose(); }
  });
  root.removeFromParent();
}
/** Newsprint board: a slab with faint printed columns (vertex colours only). */
function newsSlab(v, x0, y0, z0, x1, y1, z1, seed = 1) {
  v.boxMin(x0, y0, z0, x1, y1, z1, jitter(C.news, 0.04, seed));
}

// ---------------------------------------------------------------------------------------------
// the hut seen from outside: plank walls of folded newsprint board, a plank door under a lamp, a
// propped shutter on the east end, a stove pipe, the sign «တံတားစောင့်», a rope coil and a winch handle
// ---------------------------------------------------------------------------------------------
function hutOutside() {
  const root = new THREE.Group();
  root.name = 'd7HutOutside';
  const { w: W, d: D } = FOLD.hut;
  const H = 2.35, hw = W / 2, hd = D / 2;
  const v = new VoxelBuilder();
  // floor sill and the four walls (planks: alternating newsprint tones, a printed column stripe on each)
  v.boxMin(-hw - 0.08, 0, -hd - 0.08, hw + 0.08, 0.14, hd + 0.08, C.woodD);
  let i = 0;
  for (let x = -hw; x < hw - 1e-3; x += 0.38, i++) {
    const x1 = Math.min(hw, x + 0.37);
    const doorGap = x1 > -0.48 && x < 0.48;
    v.boxMin(x, 0.14, hd - 0.1, x1, doorGap ? 0.14 : H, hd, jitter(i % 2 ? C.news : C.newsL, 0.03, i));
    if (!doorGap) v.boxMin(x + 0.06, 0.6, hd + 0.001, x + 0.1, H - 0.3, hd + 0.004, C.print); // a printed column line
    v.boxMin(x, 0.14, -hd, x1, H, -hd + 0.1, jitter(i % 2 ? C.newsD : C.news, 0.03, i + 30));
  }
  for (const s of [-1, 1]) {
    for (let z = -hd, k = 0; z < hd - 1e-3; z += 0.38, k++) {
      const z1 = Math.min(hd, z + 0.37);
      const shutter = s > 0 && z1 > -0.7 && z < 0.3; // the propped shutter on the east end
      if (shutter) { v.boxMin(s * hw - 0.05, 0.14, z, s * hw + 0.05, 1.05, z1, jitter(C.news, 0.03, k)); v.boxMin(s * hw - 0.05, 1.75, z, s * hw + 0.05, H, z1, jitter(C.news, 0.03, k)); continue; }
      v.boxMin(s * hw - 0.05, 0.14, z, s * hw + 0.05, H, z1, jitter(k % 2 ? C.news : C.newsD, 0.03, k + s * 9));
    }
  }
  // corner posts and top plate
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * hw, H / 2, sz * hd, 0.14, H, 0.14, C.woodD);
  v.boxMin(-hw - 0.08, H - 0.08, -hd - 0.08, hw + 0.08, H + 0.04, hd + 0.08, C.woodD);
  // a low pitched roof of folded board, the fold along x
  for (let k = 0; k < 6; k++) {
    const t = k / 6, t1 = (k + 1) / 6;
    const y0 = H + 0.04 + (1 - Math.abs(t * 2 - 1)) * 0.55, y1 = H + 0.04 + (1 - Math.abs(t1 * 2 - 1)) * 0.55;
    const z0 = -hd - 0.3 + t * (D + 0.6), z1 = -hd - 0.3 + t1 * (D + 0.6);
    v.boxMin(-hw - 0.3, Math.min(y0, y1), z0, hw + 0.3, Math.max(y0, y1) + 0.06, z1, jitter(k % 2 ? '#8E867A' : '#9C9488', 0.04, k));
  }
  // the plank door, half open inward (a dark gap), frame, step
  v.boxMin(-0.5, 0.14, hd - 0.06, -0.44, 1.95, hd + 0.04, C.woodD);
  v.boxMin(0.44, 0.14, hd - 0.06, 0.5, 1.95, hd + 0.04, C.woodD);
  v.boxMin(-0.5, 1.95, hd - 0.06, 0.5, 2.05, hd + 0.04, C.woodD);
  v.boxMin(-0.44, 0.14, hd - 0.08, 0.44, 1.95, hd - 0.04, '#3A2E26'); // the dark inside
  v.box(-0.2, 1.05, hd - 0.25, 0.08, 1.8, 0.5, jitter(C.wood, 0.05, 4), 0.9); // the door, swung in
  v.boxMin(-0.62, 0, hd, 0.62, 0.12, hd + 0.4, C.woodL); // step
  // the lamp over the door (bracket + glass)
  v.box(0, 2.25, hd + 0.18, 0.04, 0.04, 0.36, C.iron);
  v.box(0, 2.12, hd + 0.34, 0.03, 0.18, 0.03, C.iron);
  v.box(0, 1.98, hd + 0.34, 0.14, 0.14, 0.14, '#D8C27A');
  // stove pipe on the roof's back half
  v.box(1.3, H + 0.9, -hd + 0.7, 0.14, 1.4, 0.14, C.soot);
  v.box(1.3, H + 1.62, -hd + 0.7, 0.24, 0.06, 0.24, C.soot);
  // rope coil and a spare winch handle on hooks by the door
  for (let k = 0; k < 4; k++) v.box(0.95, 1.35 - k * 0.05, hd + 0.08, 0.36 - k * 0.04, 0.05, 0.05, k % 2 ? C.rope : C.ropeD);
  v.box(0.95, 1.5, hd + 0.06, 0.04, 0.06, 0.06, C.iron);
  v.box(-0.95, 1.25, hd + 0.08, 0.06, 0.5, 0.05, C.iron);
  v.box(-0.95, 1.05, hd + 0.14, 0.16, 0.05, 0.05, C.woodL);
  // the propped shutter (east end), a stick holding it up; lamplight inside shows later (glow plane)
  v.box(hw + 0.28, 1.95, -0.2, 0.06, 0.04, 1.0, C.wood);
  v.box(hw + 0.18, 1.82, -0.2, 0.42, 0.04, 1.0, jitter(C.news, 0.03, 77), 0);
  v.box(hw + 0.3, 1.5, -0.2, 0.03, 0.6, 0.03, C.woodD);
  const mesh = v.mesh({ px: 1.5 });
  root.add(mesh);
  // the sign «တံတားစောင့်» over the door
  const sign = canvasPlane(1.2, 0.32, 260, (g, w, h) => signText(g, w, h, 'တံတားစောင့်', { bg: '#F2EBD8', border: C.goldD, ink: C.maroon }));
  sign.mesh.position.set(0, 2.42, hd + 0.03);
  root.add(sign.mesh);
  // warm glows: the door lamp, the shutter (lamplight inside, once the deck is lit)
  const glowMat = basic(C.lamp, { transparent: true, opacity: 0.0, depthWrite: false });
  const lampGlow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), basic(C.lamp));
  lampGlow.position.set(0, 1.98, hd + 0.34);
  root.add(lampGlow);
  const shutterGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.66), glowMat);
  shutterGlow.position.set(hw + 0.065, 1.4, -0.2);
  shutterGlow.rotation.y = Math.PI / 2;
  shutterGlow.userData.ownMat = true;
  root.add(shutterGlow);
  const shadow = blobShadow(W * 0.62, D * 0.62, 0.35);
  root.add(shadow);
  return {
    root,
    setLit(k) { shutterGlow.material.opacity = 0.85 * k; lampGlow.material.color.set(k > 0.3 ? C.lamp : '#D8C27A'); },
    dispose() { sign.tex.dispose(); shadow.geometry.dispose(); disposeTree(root); },
  };
}

/** A string of paper lanterns across the far end of the deck with the board «မနက်ဖြန် မနက်ကစ». */
function lanternString() {
  const root = new THREE.Group();
  root.name = 'd7Lanterns';
  const v = new VoxelBuilder();
  for (const s of [-1, 1]) v.box(0, 1.6, s * 2.3, 0.12, 3.2, 0.12, C.woodD);
  const cols = [C.red, C.gold, '#F1D9AA', C.maroon, C.gold, C.red, '#F1D9AA'];
  for (let k = 0; k < 7; k++) {
    const z = -2.0 + k * (4.0 / 6), y = 2.9 - Math.sin((k / 6) * Math.PI) * 0.35;
    v.box(0, y, z, 0.26, 0.32, 0.26, cols[k]);
    v.box(0, y + 0.19, z, 0.1, 0.06, 0.1, C.goldD);
  }
  v.box(0, 3.08, 0, 0.03, 0.03, 4.6, C.ink);
  root.add(v.mesh({ px: 1.4 }));
  const sign = canvasPlane(2.2, 0.42, 240, (g, w, h) => signText(g, w, h, 'မနက်ဖြန် မနက်ကစ', { bg: '#FFF3D6', border: C.maroon, ink: C.maroon, size: 0.5 }));
  sign.mesh.position.set(-0.08, 2.35, 0);
  sign.mesh.rotation.y = -Math.PI / 2; // faces west, toward the square
  root.add(sign.mesh);
  return { root, dispose() { sign.tex.dispose(); disposeTree(root); } };
}

/** A plain bench (1.4 m) for the square. */
function squareBench() {
  const v = new VoxelBuilder();
  v.boxMin(-0.7, 0.4, -0.18, 0.7, 0.46, 0.18, C.woodL);
  for (const s of [-1, 1]) v.boxMin(s * 0.6 - 0.05, 0, -0.16, s * 0.6 + 0.05, 0.4, 0.16, C.woodD);
  const g = new THREE.Group();
  g.add(v.mesh({ px: 1.4 }));
  return g;
}

// ---------------------------------------------------------------------------------------------
// everything the day sets on the square
// ---------------------------------------------------------------------------------------------
// hut: false / jar: false when the junction region already stands its own (regions/junction.js jHut, jWaterPot)
export function buildFold(scene, { slates = [], keys = 2, lit = false, hut: withHut = true, jar: withJar = true } = {}) {
  const parts = [];
  const add = (root, x, z, ry = 0, y = 0) => { root.position.set(x, y, z); root.rotation.y = ry; scene.add(root); return root; };
  const board = bridgeBoard({ slates: slates.length ? slates : [null, null, null, null, null, null, null, null, null, ''], keys, lit });
  add(board.root, FOLD.board.x, FOLD.board.z, FOLD.board.ry);
  parts.push(board);
  const rope = ropeFootbridge({ len: FOLD.rope.len });
  add(rope.root, FOLD.rope.x, FOLD.rope.z);
  parts.push(rope);
  const pier = middlePier();
  add(pier.root, FOLD.pier.x, FOLD.pier.z);
  parts.push(pier);
  // slate 6 hangs on the winch handle out on the pier
  const slate6 = chalkSlate({ w: 0.36, h: 0.27, text: '' });
  slate6.root.position.set(0, -0.32, 0.06);
  slate6.root.scale.setScalar(0.9);
  pier.handle.add(slate6.root);
  parts.push(slate6);
  let hut = null;
  if (withHut) {
    hut = hutOutside();
    add(hut.root, FOLD.hut.x, FOLD.hut.z);
    parts.push(hut);
  }
  if (withJar) {
    const jar = waterJar();
    add(jar.root, FOLD.jar.x, FOLD.jar.z);
    parts.push(jar);
  }
  const bench = squareBench();
  add(bench, FOLD.bench.x, FOLD.bench.z);
  parts.push({ root: bench, dispose: () => disposeTree(bench) });
  const lantern = lanternString();
  add(lantern.root, FOLD.lantern.x, FOLD.lantern.z);
  lantern.root.visible = false;
  parts.push(lantern);
  const obstacles = [
    { type: 'circle', x: FOLD.board.x, z: FOLD.board.z, r: 1.0 },
    { type: 'box', minX: FOLD.bench.x - 0.75, maxX: FOLD.bench.x + 0.75, minZ: FOLD.bench.z - 0.22, maxZ: FOLD.bench.z + 0.22 },
  ];
  if (withHut) obstacles.push({ type: 'box', minX: FOLD.hut.x - FOLD.hut.w / 2 - 0.1, maxX: FOLD.hut.x + FOLD.hut.w / 2 + 0.1, minZ: FOLD.hut.z - FOLD.hut.d / 2 - 0.1, maxZ: FOLD.hut.z + FOLD.hut.d / 2 - 0.05 });
  if (withJar) obstacles.push({ type: 'circle', x: FOLD.jar.x, z: FOLD.jar.z, r: 0.42 });
  let swayK = 0.5;
  return {
    board, rope, pier, slate6, lantern, obstacles,
    hut: hut || { root: null, setLit() {} }, // (the region's hut: its lamp is the region's)
    setSway(k) { swayK = k; },
    update(dt) { rope.sway(dt, swayK); },
    dispose() { for (const p of parts) { try { p.dispose(); } catch { p.root?.removeFromParent(); } } },
  };
}

// ---------------------------------------------------------------------------------------------
// the walk-in room 'bridgehut' (INDEX 13.1 / day7-spec 14.4): 6 x 5, newsprint-board walls, a long table
// under a hanging lamp, a bench, two stools, an iron stove with kettle and tin cups, rope pegs and a spare
// winch handle on the left wall, the truss plan pinned on the back wall, a water jar by the door, a propped
// shutter in the east wall (sky by day, the deck lamps' glow once the bridge is lit). No markers: taps are
// people and the plain `stations` below.
// opts: { day, slates: bool (ten slates laid on the table), cups: bool, key: bool, glow: 0..1, evening }
// ---------------------------------------------------------------------------------------------
function buildHut(opts = {}) {
  const W = 6, D = 5, H = 3;
  const room = kit.createRoom({ width: W, depth: D, height: H, wall: '#E3DFD3', wainscot: '#B8B2A3', trim: '#8C6A3C', floor: 'planks', floorColor: '#9C7C58', background: '#E6E2D6', windows: [{ x: 1.6, y: 1.85, w: 0.9, h: 0.7 }] });
  const hw = W / 2, hd = D / 2;
  const g = room.group;
  const textures = [];
  const v = new VoxelBuilder();
  // printed columns on the back and side walls (newsprint board)
  for (let k = 0; k < 9; k++) v.boxMin(-hw + 0.3 + k * 0.62, 1.15, -hd + 0.005, -hw + 0.36 + k * 0.62, 2.7, -hd + 0.012, C.print);
  for (let k = 0; k < 3; k++) for (const s of [-1, 1]) v.boxMin(s * (hw - 0.005) - 0.004, 1.15, -hd + 0.3 + k * 0.5, s * (hw - 0.005) + 0.004, 2.5, -hd + 0.34 + k * 0.5, C.print);
  // long table and the bench behind it, two stools at its ends
  v.boxMin(-1.3, 0.72, -1.15, 1.3, 0.78, -0.25, jitter(C.woodL, 0.04, 3));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * 1.18, 0.36, -0.7 + sz * 0.36, 0.08, 0.72, 0.08, C.woodD);
  v.boxMin(-1.2, 0.42, -1.68, 1.2, 0.47, -1.36, C.wood);
  for (const sx of [-1, 1]) v.boxMin(sx * 1.05 - 0.05, 0, -1.66, sx * 1.05 + 0.05, 0.42, -1.38, C.woodD);
  for (const sx of [-1, 1]) { v.box(sx * 1.62, 0.22, -0.7, 0.32, 0.04, 0.32, C.maroon); v.box(sx * 1.62, 0.1, -0.7, 0.22, 0.2, 0.22, C.woodD); }
  // the hanging lamp over the table (chain, shade, glass)
  v.box(0, 2.62, -0.7, 0.02, 0.7, 0.02, C.iron);
  v.box(0, 2.24, -0.7, 0.34, 0.06, 0.34, C.goldD);
  v.box(0, 2.14, -0.7, 0.16, 0.16, 0.16, '#E8D9A8');
  // the iron stove with its kettle (back right), pipe up through the roof, tin cups on a shelf above
  v.boxMin(2.05, 0, -2.3, 2.75, 0.62, -1.55, C.iron);
  v.boxMin(2.0, 0.62, -2.35, 2.8, 0.68, -1.5, C.soot);
  v.box(2.4, 0.3, -1.54, 0.24, 0.16, 0.02, '#E0793A'); // the fire door's glow slot
  v.box(2.55, 1.85, -2.05, 0.14, 2.3, 0.14, C.soot);
  v.box(2.3, 0.78, -1.9, 0.26, 0.2, 0.22, C.tinD); v.box(2.3, 0.9, -1.9, 0.1, 0.05, 0.1, C.tin); v.box(2.46, 0.82, -1.9, 0.14, 0.04, 0.04, C.tinD);
  v.boxMin(1.85, 1.45, -2.5, 2.85, 1.5, -2.25, C.woodD);
  for (let k = 0; k < 4; k++) v.box(1.98 + k * 0.24, 1.56, -2.38, 0.1, 0.12, 0.1, C.tin);
  // rope coils and a spare winch handle on pegs (left wall), a spare striped boom tip in the back-left corner
  for (let k = 0; k < 3; k++) { v.box(-hw + 0.06, 1.6, -1.0 + k * 0.45, 0.08, 0.04, 0.04, C.iron); for (let r = 0; r < 4; r++) v.box(-hw + 0.14, 1.48 - r * 0.06, -1.0 + k * 0.45, 0.08, 0.05, 0.3 - r * 0.03, r % 2 ? C.rope : C.ropeD); }
  v.box(-hw + 0.1, 1.2, 0.5, 0.06, 0.6, 0.06, C.iron); v.box(-hw + 0.18, 0.95, 0.5, 0.06, 0.06, 0.22, C.woodL);
  for (let k = 0; k < 6; k++) v.box(-2.6, 0.18 + k * 0.3, -2.0, 0.12, 0.3, 0.12, k % 2 ? C.white : C.red);
  // the propped shutter in the right (east) wall: an opening with a sky panel, the flap held out on a stick
  v.boxMin(hw - 0.02, 1.02, -0.9, hw + 0.01, 1.78, -0.1, C.sky);
  v.boxMin(hw - 0.06, 1.75, -0.95, hw + 0.04, 1.82, -0.05, C.woodD);
  v.boxMin(hw - 0.06, 0.98, -0.95, hw + 0.04, 1.04, -0.05, C.woodD);
  // a reed mat by the door
  v.boxMin(-0.8, 0.002, 1.4, 0.8, 0.012, 2.1, '#C9B07A');
  const mesh = v.mesh({ px: 1.4 });
  g.add(mesh);
  // the truss plan pinned on the back wall
  const plan = canvasPlane(1.3, 0.8, 300, (gg, w, h) => {
    gg.fillStyle = '#F4F0E4'; gg.fillRect(0, 0, w, h);
    gg.strokeStyle = '#3E5F7A'; gg.lineWidth = 3;
    const y0 = h * 0.62, x0 = w * 0.08, x1 = w * 0.92;
    gg.beginPath(); gg.moveTo(x0, y0); gg.lineTo(x1, y0); gg.stroke();
    for (let k = 0; k <= 8; k++) { const x = x0 + (x1 - x0) * (k / 8); gg.beginPath(); gg.moveTo(x, y0); gg.lineTo(x + (k % 2 ? -1 : 1) * (x1 - x0) / 16, y0 - h * 0.22); gg.stroke(); }
    gg.beginPath(); gg.moveTo(x0, y0 - h * 0.22); gg.lineTo(x1, y0 - h * 0.22); gg.stroke();
    gg.fillStyle = '#3E5F7A'; gg.fillRect(w * 0.48, y0, w * 0.04, h * 0.25);
    gg.font = `700 ${Math.round(h * 0.1)}px ${FONT_MY}`; gg.textAlign = 'center'; gg.fillText('တံတားသစ် ပုံစံ', w / 2, h * 0.16); // DRAFT(my): the new bridge plan
    gg.fillStyle = C.red; for (const [x, y] of [[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]]) { gg.beginPath(); gg.arc(x, y, 6, 0, 7); gg.fill(); }
  });
  plan.mesh.position.set(-1.2, 1.75, -hd + 0.03);
  g.add(plan.mesh);
  textures.push(plan.tex);
  // the water jar on its stand by the door
  const jar = waterJar();
  room.place(Object.assign(jar.root, { userData: { footprint: { w: 0.55, d: 0.55 } } }), -2.3, 1.6);
  room.bake(); // statics merged; the things that show and hide below stay their own meshes
  const dyn = (o) => { o.traverse((c) => { c.userData.dynamic = true; }); return o; };
  // the ten slates laid flat on the table in two rows of five (shown while she orders them)
  const slateGroup = new THREE.Group();
  const slates = [];
  for (let k = 0; k < 10; k++) {
    const s = chalkSlate({ w: 0.36, h: 0.26, text: '' });
    s.root.rotation.x = -Math.PI / 2;
    s.root.position.set(-1.0 + (k % 5) * 0.5, 0.785, -0.95 + Math.floor(k / 5) * 0.42);
    slateGroup.add(s.root);
    slates.push(s);
  }
  slateGroup.visible = !!opts.slates;
  g.add(dyn(slateGroup));
  // two tin cups of tea and Nay Chi's key on its tag (the tea, 6.7)
  const cv = new VoxelBuilder();
  for (const x of [-0.25, 0.55]) { cv.box(x, 0.84, -0.55, 0.1, 0.12, 0.1, C.tin); cv.box(x, 0.9, -0.55, 0.08, 0.005, 0.08, '#C79A68'); }
  const cups = cv.mesh({ px: 1.2 });
  cups.visible = !!opts.cups;
  g.add(dyn(cups));
  const kv = new VoxelBuilder();
  kv.box(-0.05, 0.79, -0.85, 0.12, 0.01, 0.03, '#C9A24A'); kv.box(0.06, 0.79, -0.86, 0.1, 0.006, 0.06, '#F7EFD8');
  const key = kv.mesh({ px: 1.0, outline: false });
  key.visible = !!opts.key;
  g.add(dyn(key));
  // lamp glow (lit in the evening and once the deck is lit), the shutter glow
  const lampMat = basic(C.lamp, { transparent: true, opacity: 0.2, depthWrite: false });
  const lampGlow = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8), lampMat);
  lampGlow.position.set(0, 2.12, -0.7);
  lampGlow.userData.ownMat = true; lampGlow.userData.dynamic = true;
  g.add(lampGlow);
  const shutterMat = basic('#F2C46A', { transparent: true, opacity: 0, depthWrite: false });
  const shutterGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.74), shutterMat);
  shutterGlow.position.set(hw - 0.035, 1.4, -0.5); shutterGlow.rotation.y = -Math.PI / 2;
  shutterGlow.userData.dynamic = true;
  g.add(shutterGlow);
  // keep-outs
  room.obstacles.push({ type: 'box', minX: -1.4, maxX: 1.4, minZ: -1.25, maxZ: -0.15 }); // table
  room.obstacles.push({ type: 'box', minX: -1.3, maxX: 1.3, minZ: -1.8, maxZ: -1.3 }); // bench
  room.obstacles.push({ type: 'box', minX: 1.95, maxX: 2.9, minZ: -2.5, maxZ: -1.45 }); // stove
  const spots = {
    handA: { x: 2.25, z: -1.15, h: -0.6 },
    handB: { x: -1.0, z: 1.55, h: 0.3 },
    naychi: { x: -1.68, z: -0.12, h: 0.75 }, // at the table's left end by her stool: the ten slates in front of her
    naychiDoor: { x: 0.3, z: 1.6, h: Math.PI },
    maya: { x: 1.6, z: -0.0, h: -Math.PI / 2 - 0.4 },
    door: { x: 0, z: 2.05, h: Math.PI },
  };
  let glow = opts.glow ?? 0, evening = opts.evening ?? 0;
  const look = () => {
    lampMat.opacity = 0.18 + 0.5 * Math.max(evening, glow);
    shutterMat.opacity = 0.75 * glow;
  };
  look();
  return {
    scene: room.scene, group: g, room,
    width: W, depth: D, height: H,
    bounds: room.bounds, obstacles: room.obstacles, door: room.door, spawn: room.spawn,
    stations: [], spots, cast: [],
    parts: {
      slates: { show(on) { slateGroup.visible = !!on; }, list: slates },
      cups: { show(on) { cups.visible = !!on; } },
      key: { show(on) { key.visible = !!on; } },
      setGlow(k) { glow = k; look(); },
    },
    update() {},
    setEvening(k = 1) { evening = Math.max(0, Math.min(1, +k || 0)); look(); },
    setRain() {},
    dispose() {
      for (const s of slates) s.dispose();
      for (const t of textures) t.dispose();
      jar.dispose?.();
      room.dispose();
    },
  };
}

export const HUT_ROOM = { name: { my: 'တံတားစောင့် တဲ', en: "The bridge hands' hut" }, district: 'junction', days: [7, 8], build: buildHut };
