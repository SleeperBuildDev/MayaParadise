// Day 12's outdoor set (day12-spec.md 1; INDEX 13.4 for the kiln square). The Diary Garden's region file has
// only its roads, the clasp and the two desks, so the day dresses the lane and the kiln square itself, plus
// the Home Book's flat bean bed and the soaked "ask Maya" board. Original blocky art in the props2.js style
// (VoxelBuilder boxes, Maya's palette, feet at y = 0, fronts +Z). Nothing here marks where to go: no glow,
// ring or arrow; the doors are seen (open, lamp-lit) and named by people.
//
//   const set = buildSet(story)
//   set.P                  the day's places (world metres; +X east, +Z south; buildings face the lane, +Z):
//                          Day 10's Garden layout (day10-garden.js P), so the lane is the one seen two days ago
//   set.h                  handles: htGate, htHouse, beds, farBed, dateStick, sticks, trellis, scale, notice, kiln,
//                          store, stalls, homeBed, board, umbrella
//   set.doors              the room doors it registered (hpohtawshed, dryinghall, committeeroom + Day 10's four)
//   set.update(dt, t, focus)  smoke, lamps, distance culling
//   set.dispose()          props, obstacles (the open world's spatial hash) and its doors go away
//
// Every Burmese string here is a draft for Maya.
import * as THREE from '../game/three.js';
import { VoxelBuilder, jitter } from '../game/voxel.js';
import { basic, fontsReady, FONT_MY } from '../game/toon.js';
import { chalkSlate } from './props2.js';
import {
  lockedGate, gardenBench, seedBeds, nameStick, gourdTrellis, kilnBig, marketStall, marketScale, noticeBoard,
  puddle, soakedSheets, paperStore, lampWindow, umbrella,
} from './props5.js';
import { teaShop } from './props3.js';
import { P as P10 } from './day10-garden.js';
import { DOORS, registerDoors } from './doors.js';
import { BUILT, SPOTS } from './world/regions/garden.js';

const T = (my, en) => ({ my, en });
// The Garden's region file (world/regions/garden.js) now builds the lane's fences and plots 1-2, the garden house,
// the gourd aunty's kitchen, the tea shop, the paper store, the kiln shed and packing room, the committee lean-to
// and the drying hall. BUILT lists their rooms: the day draws only its own live bits for those (no stand-ins on
// top), at the region's places (SPOTS).
const OWN = (room) => !BUILT.has(room);

const C = {
  wood: '#B98A58', woodD: '#8C6440', woodL: '#CDA577', bamboo: '#C9B26A', bambooD: '#9E8A48', tin: '#A9A79F', tinD: '#7D7B74',
  lime: '#EEE9DC', limeD: '#DCD5C4', mud: '#7D6146', brick: '#A0503A', brickD: '#7E3C2B', brickL: '#B9654A', tile: '#B5643C', tileD: '#8E4A2C',
  plaster: '#EBD9A8', ochre: '#E3CD95', stone: '#A39484', soil: '#6E5038', soilW: '#5C4231', log: '#8A6648', logD: '#6E5038', glow: '#F7D98A',
  maroon: '#6E1F2A', gold: '#C9A24A', leaf: '#5E8F4E', leafD: '#3E6B3A', cream: '#F6F0E2', paper: '#FFFDF8', ink: '#2A2118',
};

function disposeTree(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material && !Array.isArray(o.material) && o.material.map) o.material.map.dispose?.();
  });
  root.removeFromParent();
}

/**
 * Merge the static meshes under `group` into one mesh per material (draw calls), hiding the originals.
 * Children marked userData.d12live (props that animate or change state) are left alone.
 * Returns disposers for the merged geometries.
 */
function bakeStatic(group) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const m4 = new THREE.Matrix4();
  const buckets = new Map(); // key -> { mat, geos: [], src: [] }
  const ok = (o) => o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && o.visible && o.material && !Array.isArray(o.material)
    && !o.material.isShaderMaterial && o.onBeforeRender === THREE.Object3D.prototype.onBeforeRender && o.geometry?.attributes?.position
    && !Object.keys(o.geometry.morphAttributes || {}).length;
  // props that animate themselves: run their update a while and keep only the meshes that never move
  const moving = new Set();
  for (const root of group.children) {
    const up = root.userData.d12update;
    if (root.userData.d12live || !up) continue;
    const snap = new Map();
    const take = () => { root.updateMatrixWorld(true); root.traverse((o) => { if (o.isMesh) snap.set(o, [o.visible, o.geometry.attributes.position?.version, ...o.matrixWorld.elements].join(',')); }); };
    take();
    const first = new Map(snap);
    for (let i = 0; i < 60; i++) { try { up(0.1, i < 30 ? i * 0.1 : 50 + i * 0.37); } catch { /* not yet */ } }
    snap.clear(); take();
    for (const [o, v] of first) if (snap.get(o) !== v) moving.add(o);
  }
  for (const root of group.children) {
    if (root.userData.d12live || !root.visible) continue;
    root.traverse((o) => {
      if (!ok(o) || moving.has(o)) return;
      // a hidden ancestor (a state that is off) stays as it is; so does a part marked d12keep (it moves later)
      for (let p = o; p && p !== group; p = p.parent) if ((p !== o && !p.visible) || p.userData.d12keep) return;
      const g0 = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      g0.applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld));
      const names = Object.keys(g0.attributes).sort().join(',');
      const key = `${o.material.uuid}|${names}`;
      let b = buckets.get(key);
      if (!b) buckets.set(key, (b = { mat: o.material, geos: [], src: [], shadow: o.castShadow, recv: o.receiveShadow }));
      b.geos.push(g0); b.src.push(o);
    });
  }
  const out = [];
  for (const b of buckets.values()) {
    if (b.src.length < 2) { for (const g of b.geos) g.dispose(); continue; } // nothing to gain
    let geo = null;
    try { geo = THREE.mergeGeometries(b.geos, false); } catch { geo = null; }
    for (const g of b.geos) g.dispose();
    if (!geo) continue;
    const m = new THREE.Mesh(geo, b.mat);
    m.castShadow = b.shadow; m.receiveShadow = b.recv;
    m.name = 'd12baked';
    m.matrixAutoUpdate = false;
    group.add(m);
    for (const o of b.src) o.visible = false;
    out.push(() => { geo.dispose(); m.removeFromParent(); });
  }
  return out;
}

/** A small canvas sign plane (Burmese first, English small). */
function signPlane(text, { w = 1.2, h = 0.34, bg = '#6E1F2A', fg = '#F1DD9E', en = '#E9DFC9' } = {}) {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = Math.round(512 * (h / w));
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const draw = () => {
    const g = cv.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, cv.width, cv.height);
    g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(6, 6, cv.width - 12, cv.height - 12);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = fg; g.font = `700 ${Math.round(cv.height * 0.42)}px ${FONT_MY}`;
    g.fillText(text.my, cv.width / 2, cv.height * 0.42);
    g.fillStyle = en; g.font = `600 ${Math.round(cv.height * 0.2)}px system-ui, sans-serif`;
    g.fillText(text.en, cv.width / 2, cv.height * 0.8);
    tex.needsUpdate = true;
  };
  draw();
  fontsReady().then(draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic('#ffffff', { map: tex }));
  return m;
}

// ---------------------------------------------------------------------------------------------
// shells: U Hpo Htaw's garden house, the committee lean-to, the drying hall
// ---------------------------------------------------------------------------------------------
/** A small tin-roofed garden house (default 3.0 x 2.4), plank door centre front, lamp window right. setOpen(bool). */
function gardenHouse({ W = 3.0, D = 2.4 } = {}) {
  const root = new THREE.Group();
  root.name = 'd12GardenHouse';
  const H = 2.3, DW = 0.9, DH = 1.85;
  const v = new VoxelBuilder();
  v.boxMin(-W / 2 - 0.1, 0, -D / 2 - 0.1, W / 2 + 0.1, 0.1, D / 2 + 0.1, C.stone);
  v.boxMin(-W / 2, 0.1, -D / 2, W / 2, H, -D / 2 + 0.14, C.lime); // back
  for (const sx of [-1, 1]) v.boxMin(sx < 0 ? -W / 2 : W / 2 - 0.14, 0.1, -D / 2, sx < 0 ? -W / 2 + 0.14 : W / 2, H, D / 2, C.lime);
  // front wall round the door
  v.boxMin(-W / 2, 0.1, D / 2 - 0.14, -DW / 2, H, D / 2, C.lime);
  v.boxMin(DW / 2, 0.1, D / 2 - 0.14, W / 2, H, D / 2, C.lime);
  v.boxMin(-DW / 2, DH, D / 2 - 0.14, DW / 2, H, D / 2, C.lime);
  // mud-brown wainscot, green trim at the door
  v.boxMin(-W / 2 - 0.005, 0.1, D / 2 - 0.005, -DW / 2, 0.55, D / 2 + 0.01, C.mud);
  v.boxMin(DW / 2, 0.1, D / 2 - 0.005, W / 2 + 0.005, 0.55, D / 2 + 0.01, C.mud);
  for (const sx of [-1, 1]) v.boxMin(sx * DW / 2 - 0.06, 0.1, D / 2, sx * DW / 2 + 0.06, DH + 0.06, D / 2 + 0.04, '#7E9A5A');
  v.boxMin(-DW / 2 - 0.06, DH, D / 2, DW / 2 + 0.06, DH + 0.08, D / 2 + 0.04, '#7E9A5A');
  // the dark doorway inside
  v.boxMin(-DW / 2, 0.1, D / 2 - 0.5, DW / 2, DH, D / 2 - 0.14, '#3A2E26');
  // tin roof, a shallow pitch to the back, with an eave over the door
  for (let i = 0; i < 14; i++) {
    const x = -W / 2 - 0.25 + i * ((W + 0.5) / 14);
    v.box(x + (W + 0.5) / 28, H + 0.2, 0.15, (W + 0.5) / 14 + 0.004, 0.06, D + 0.9, i % 2 ? C.tin : C.tinD);
  }
  v.box(0, H + 0.12, D / 2 + 0.55, W + 0.5, 0.05, 0.04, C.tinD);
  const body = v.mesh();
  body.rotation.set(0, 0, 0);
  root.add(body);
  // a slight tilt is faked by the roof boxes' heights; the door leaf swings in on its left hinge
  const dv = new VoxelBuilder();
  dv.boxMin(0, 0, -0.03, DW - 0.04, DH - 0.04, 0.03, C.woodD);
  for (let k = 0; k < 4; k++) dv.boxMin(0.02 + k * 0.215, 0.05, 0.03, 0.2 + k * 0.215, DH - 0.1, 0.035, jitter(C.wood, 0.05, k));
  dv.box(DW - 0.16, 1.0, 0.05, 0.05, 0.05, 0.04, C.tinD);
  const leaf = dv.mesh({ px: 1.2 });
  const hinge = new THREE.Group();
  hinge.position.set(-DW / 2 + 0.02, 0.1, D / 2 - 0.08);
  hinge.add(leaf);
  root.add(hinge);
  const win = lampWindow({ lit: 0 });
  win.root.scale.setScalar(0.8);
  win.root.position.set(W / 2 - 0.5, 1.0, D / 2 + 0.01);
  root.add(win.root);
  // the drip line off the eave (thin streaks, only while open/raining)
  const dripV = new VoxelBuilder();
  for (let i = 0; i < 9; i++) dripV.box(-W / 2 + 0.3 + i * (W - 0.6) / 8, H - 0.4 - (i % 3) * 0.2, D / 2 + 0.6, 0.012, 0.5, 0.012, '#C9DAE0');
  const drips = dripV.mesh({ outline: false });
  root.add(drips);
  let open = false;
  const setOpen = (b) => { open = !!b; hinge.rotation.y = open ? -1.7 : 0; win.setLit(open ? 1 : 0); };
  setOpen(false);
  return {
    root, setOpen, get open() { return open; },
    update(dt, t) { win.update?.(dt, t); drips.position.y = -((t * 1.6) % 0.4); },
    dispose() { win.dispose?.(); disposeTree(root); },
  };
}

/** The Market Committee's brick lean-to (3.2 x 2.8): a plain door, a painted name board, one lamp window. */
function committeeLean({ W = 2.8, D = 3.4 } = {}) {
  const root = new THREE.Group();
  root.name = 'd12Committee';
  const H = 2.6, DW = 0.9, DH = 1.9;
  const v = new VoxelBuilder();
  v.boxMin(-W / 2 - 0.08, 0, -D / 2, W / 2 + 0.08, 0.1, D / 2 + 0.08, C.stone);
  v.boxMin(-W / 2, 0.1, -D / 2, W / 2, H + 0.5, -D / 2 + 0.2, C.brickD);
  for (const sx of [-1, 1]) v.boxMin(sx < 0 ? -W / 2 : W / 2 - 0.2, 0.1, -D / 2, sx < 0 ? -W / 2 + 0.2 : W / 2, H, D / 2, C.brick);
  v.boxMin(-W / 2, 0.1, D / 2 - 0.2, -DW / 2, H, D / 2, C.brick);
  v.boxMin(DW / 2, 0.1, D / 2 - 0.2, W / 2, H, D / 2, C.brick);
  v.boxMin(-DW / 2, DH, D / 2 - 0.2, DW / 2, H, D / 2, C.brick);
  for (let y = 0.3, k = 0; y < H; y += 0.3, k++) for (const x0 of [-W / 2, DW / 2]) v.boxMin(x0 + (k % 2) * 0.12, y, D / 2 + 0.001, x0 + (W / 2 - DW / 2) - 0.05, y + 0.012, D / 2 + 0.006, '#D2B79A');
  v.boxMin(-DW / 2 - 0.06, 0.1, D / 2, DW / 2 + 0.06, DH + 0.08, D / 2 + 0.04, C.woodD);
  v.boxMin(-DW / 2 + 0.04, 0.1, D / 2 - 0.04, DW / 2 - 0.04, DH - 0.02, D / 2 + 0.02, '#4A5A44'); // the plain door (shut)
  v.box(DW / 2 - 0.16, 1.0, D / 2 + 0.05, 0.06, 0.06, 0.05, '#C49A3E');
  // the lean-to roof sloping down from the kiln shed's wall
  for (let i = 0; i < 8; i++) v.box(-W / 2 - 0.2 + (i + 0.5) * ((W + 0.4) / 8), H + 0.22 - 0.0, 0, (W + 0.4) / 8 + 0.004, 0.08, D + 0.6, i % 2 ? C.tile : C.tileD);
  root.add(v.mesh());
  const win = lampWindow({ lit: 1 });
  win.root.scale.setScalar(0.7);
  win.root.position.set(W / 2 - 0.42, 1.05, D / 2 + 0.01);
  win.root.scale.setScalar(0.55);
  root.add(win.root);
  const board = signPlane(T('ဈေးကော်မတီ', 'Market Committee'), { w: 1.3, h: 0.34 });
  board.position.set(0, DH + 0.33, D / 2 + 0.03);
  root.add(board);
  return { root, update(dt, t) { win.update?.(dt, t); }, dispose() { win.dispose?.(); disposeTree(root); } };
}

/** The kiln's drying hall (6.4 x 4.4): long, low, tiled; wide double doors propped open, lamplight, a doorpost slate. */
function dryingHall({ W = 4.6, D = 4.4 } = {}) {
  const root = new THREE.Group();
  root.name = 'd12DryingHall';
  const H = 2.8, DW = 1.9, DH = 2.1;
  const v = new VoxelBuilder();
  v.boxMin(-W / 2 - 0.1, 0, -D / 2, W / 2 + 0.1, 0.12, D / 2 + 0.1, C.stone);
  v.boxMin(-W / 2, 0.12, -D / 2, W / 2, H, -D / 2 + 0.2, C.lime);
  for (const sx of [-1, 1]) v.boxMin(sx < 0 ? -W / 2 : W / 2 - 0.2, 0.12, -D / 2, sx < 0 ? -W / 2 + 0.2 : W / 2, H, D / 2, C.lime);
  v.boxMin(-W / 2, 0.12, D / 2 - 0.2, -DW / 2, H, D / 2, C.lime);
  v.boxMin(DW / 2, 0.12, D / 2 - 0.2, W / 2, H, D / 2, C.lime);
  v.boxMin(-DW / 2, DH, D / 2 - 0.2, DW / 2, H, D / 2, C.lime);
  v.boxMin(-W / 2 - 0.005, 0.12, D / 2 - 0.005, -DW / 2, 0.7, D / 2 + 0.01, C.tile);
  v.boxMin(DW / 2, 0.12, D / 2 - 0.005, W / 2 + 0.005, 0.7, D / 2 + 0.01, C.tile);
  for (const sx of [-1, 1]) v.boxMin(sx * DW / 2 - 0.08, 0.12, D / 2, sx * DW / 2 + 0.08, DH + 0.1, D / 2 + 0.05, C.woodD);
  v.boxMin(-DW / 2 - 0.08, DH, D / 2, DW / 2 + 0.08, DH + 0.12, D / 2 + 0.05, C.woodD);
  // warm lamplight inside the doorway, racks of green pots glimpsed
  v.boxMin(-DW / 2, 0.12, D / 2 - 1.2, DW / 2, DH, D / 2 - 0.2, '#B98A4E');
  v.boxMin(-DW / 2, 0.12, D / 2 - 1.22, DW / 2, 0.14, D / 2 - 0.2, '#8E6A44');
  for (let i = 0; i < 6; i++) v.box(-0.7 + i * 0.28, 0.9 + (i % 2) * 0.5, D / 2 - 1.15, 0.2, 0.22, 0.12, jitter('#CDB79A', 0.05, i));
  // the two door leaves, propped open against the front wall
  for (const sx of [-1, 1]) {
    v.boxMin(sx < 0 ? -DW / 2 - 0.95 : DW / 2 + 0.05, 0.14, D / 2 + 0.05, sx < 0 ? -DW / 2 - 0.05 : DW / 2 + 0.95, DH - 0.06, D / 2 + 0.11, C.wood);
    for (let k = 0; k < 3; k++) v.boxMin(sx < 0 ? -DW / 2 - 0.92 + k * 0.3 : DW / 2 + 0.08 + k * 0.3, 0.2, D / 2 + 0.11, sx < 0 ? -DW / 2 - 0.66 + k * 0.3 : DW / 2 + 0.34 + k * 0.3, DH - 0.12, D / 2 + 0.115, jitter(C.woodD, 0.05, k));
  }
  // tiled roof: rows of terracotta, a ridge
  for (let r = 0; r < 6; r++) for (let i = 0; i < 12; i++) {
    const x = -W / 2 - 0.3 + (i + 0.5) * ((W + 0.6) / 12);
    v.box(x, H + 0.08 + r * 0.09, D / 2 + 0.4 - r * ((D + 0.8) / 6) - 0.36, (W + 0.6) / 12 - 0.02, 0.08, (D + 0.8) / 6 + 0.02, (i + r) % 2 ? C.tile : C.tileD);
  }
  v.box(0, H + 0.64, -D / 2 + 0.1, W + 0.6, 0.12, 0.3, C.tileD);
  // two high windows, lamplit
  for (const x of [-(W / 2 - 0.6), W / 2 - 0.6]) { v.boxMin(x - 0.32, 2.2, D / 2, x + 0.32, 2.55, D / 2 + 0.02, C.glow); v.boxMin(x - 0.36, 2.15, D / 2 + 0.01, x + 0.36, 2.2, D / 2 + 0.05, C.woodD); }
  root.add(v.mesh());
  const slate = chalkSlate({ w: 0.5, h: 0.36, text: 'ဈေး · မိုးရွာလို့ အထဲမှာ' });
  slate.root.position.set(-DW / 2 - 0.05, 1.25, D / 2 + 0.14);
  root.add(slate.root);
  return { root, dispose() { slate.dispose?.(); disposeTree(root); } };
}

/**
 * The garden house's door for the region's building (regions/garden-art.js hpHouse draws it shut): placed on the
 * house's front face (local z = 0 is the wall), hidden while shut; open = the dark doorway, the plank leaf swung
 * in on its left hinge, and a warm spill of lamplight on the step. setOpen(bool).
 */
function openDoorway({ DW = 0.85, DH = 1.85, y0 = 0.2 } = {}) {
  const root = new THREE.Group();
  root.name = 'd12HtDoorway';
  const v = new VoxelBuilder();
  v.boxMin(-DW / 2 + 0.03, y0, 0.004, DW / 2 - 0.03, y0 + DH - 0.03, 0.02, '#2E2620'); // the dark doorway over the shut door
  v.boxMin(-DW / 2 + 0.06, y0, 0.021, DW / 2 - 0.06, y0 + 0.012, 0.03, '#F2C66E'); // lamplight along the sill
  v.boxMin(-0.4, 0.2, 0.3, 0.4, 0.212, 0.75, '#C9A86A'); // and on the step stone
  const hole = v.mesh({ outline: false });
  root.add(hole);
  const dv = new VoxelBuilder();
  dv.boxMin(0, 0, -0.03, DW - 0.06, DH - 0.06, 0.03, C.woodD);
  for (let k = 0; k < 4; k++) dv.boxMin(0.02 + k * 0.2, 0.05, 0.03, 0.19 + k * 0.2, DH - 0.12, 0.035, jitter('#7E9A5A', 0.06, k));
  dv.box(DW - 0.18, 1.0, 0.05, 0.05, 0.05, 0.04, C.tinD);
  const leaf = dv.mesh({ px: 1.2 });
  const hinge = new THREE.Group();
  hinge.position.set(-DW / 2 + 0.03, y0, 0.02);
  hinge.rotation.y = 1.75; // swung in against the inside wall: only its edge shows from the lane
  hinge.add(leaf);
  root.add(hinge);
  let open = false;
  const setOpen = (b) => { open = !!b; root.visible = open; };
  setOpen(false);
  return { root, setOpen, get open() { return open; }, dispose() { disposeTree(root); } };
}

/** A fresh paper notice pinned on a board (one canvas plane, two pins). setText(lines): first line the heading. */
function pinnedNotice(lines, { w = 0.6, h = 0.45 } = {}) {
  const root = new THREE.Group();
  root.name = 'd12Notice';
  const cv = document.createElement('canvas');
  cv.width = 384; cv.height = Math.round(384 * (h / w));
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  let cur = lines;
  const txt = (l) => (typeof l === 'string' ? l : (l?.my || ''));
  const draw = () => {
    const g = cv.getContext('2d');
    g.fillStyle = '#FBF6E8'; g.fillRect(0, 0, cv.width, cv.height);
    g.strokeStyle = '#6E1F2A'; g.lineWidth = 5; g.strokeRect(8, 8, cv.width - 16, cv.height - 16);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = Math.max(1, cur.length), lh = (cv.height - 40) / (n + 0.4);
    cur.forEach((l, i) => {
      g.fillStyle = i ? '#2A2118' : '#6E1F2A';
      g.font = `${i ? 600 : 700} ${Math.round(lh * (i ? 0.5 : 0.62))}px ${FONT_MY}`;
      g.fillText(txt(l), cv.width / 2, 24 + lh * (i + (i ? 0.75 : 0.5)));
    });
    tex.needsUpdate = true;
  };
  draw();
  fontsReady().then(draw);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic('#ffffff', { map: tex }));
  face.position.set(0, 0.64, 0.02);
  root.add(face);
  const pv = new VoxelBuilder();
  for (const sx of [-1, 1]) pv.box(sx * (w / 2 - 0.06), 0.64 + h / 2 - 0.05, 0.03, 0.03, 0.03, 0.02, '#C8323C');
  root.add(pv.mesh({ outline: false }));
  return { root, setText(l) { cur = l; draw(); }, dispose() { tex.dispose(); face.material.dispose(); disposeTree(root); } };
}

/** A low bamboo fence along +X from x0 to x1 (local), with gaps [[a, b], ...]. */
function fence(len, gaps = []) {
  const v = new VoxelBuilder();
  const inGap = (x) => gaps.some(([a, b]) => x > a && x < b);
  for (let x = 0; x <= len + 1e-3; x += 0.9) if (!inGap(x)) v.box(x, 0.45, 0, 0.08, 0.9, 0.08, jitter(C.bambooD, 0.05, Math.round(x * 3)));
  const spans = [[0, len]];
  for (const [a, b] of gaps) for (let i = spans.length - 1; i >= 0; i--) { const [p, q] = spans[i]; if (b <= p || a >= q) continue; spans.splice(i, 1, ...[[p, a], [b, q]].filter(([u, w]) => w - u > 0.05)); }
  for (const [a, b] of spans) for (const y of [0.35, 0.72]) v.boxMin(a, y - 0.03, -0.03, b, y + 0.03, 0.03, C.bamboo);
  return v.mesh({ px: 1.2 });
}

/** A low trellis arch over the seedbed (bamboo), 0.9 m. */
function lowTrellis(w = 2.4) {
  const v = new VoxelBuilder();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * w / 2, 0.45, sz * 0.5, 0.06, 0.9, 0.06, C.bambooD);
  for (const sz of [-1, 1]) v.box(0, 0.9, sz * 0.5, w + 0.1, 0.05, 0.05, C.bamboo);
  for (let i = 0; i < 6; i++) v.box(-w / 2 + (i + 0.5) * (w / 6), 0.9, 0, 0.04, 0.04, 1.05, C.bamboo);
  // a few torn leaves still clinging, most of them beaten down onto the bed
  for (let i = 0; i < 7; i++) v.box(-w / 2 + 0.2 + i * 0.32, 0.86 - (i % 2) * 0.3, (i % 3 - 1) * 0.3, 0.14, 0.03, 0.1, i % 2 ? C.leafD : C.leaf, i);
  return v.mesh({ px: 1.2 });
}

function woodpile() {
  const v = new VoxelBuilder();
  for (let r = 0; r < 4; r++) for (let i = 0; i < 6 - r; i++) {
    const x = -0.75 + i * 0.3 + r * 0.15;
    v.box(x, 0.13 + r * 0.24, 0, 0.26, 0.24, 0.9, jitter(i % 2 ? C.log : C.logD, 0.05, r * 7 + i));
    v.box(x, 0.13 + r * 0.24, 0.452, 0.18, 0.16, 0.01, '#D9B48C');
  }
  return v.mesh();
}

/** The soaked "ask Maya" board on its post: notes with run ink, a few dry re-pinned ones (8.3). */
function askBoard() {
  const b = noticeBoard({ lines: [T('မာရာ့ကို မေးကြည့်', 'Ask Maya'), '~ ~ ~ ~', '~~ ~ ~~~', '~ ~~ ~'] });
  return b;
}

/** A plain little house shell (front door on +Z, a low pitched roof): the gourd aunty's kitchen. */
function cottage({ w, d, h = 2.3, wall = '#DDE6CF', doorX = 0, open = true, gourds = false }) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, 0, -d / 2, w / 2, h, d / 2, jitter(wall, 0.04, 15));
  v.boxMin(-w / 2 - 0.05, 0, d / 2 - 0.02, w / 2 + 0.05, 0.25, d / 2 + 0.03, '#CDBB98');
  for (let k = 0; k < 4; k++) v.boxMin(-w / 2 - 0.25, h + k * 0.14, -d / 2 - 0.3 + k * (d / 8), w / 2 + 0.25, h + 0.14 + k * 0.14, d / 2 + 0.3 - k * (d / 8), jitter(k % 2 ? '#8E5A3C' : '#6E4430', 0.05, 15 + k));
  v.boxMin(doorX - 0.53, 0.02, d / 2, doorX + 0.53, 1.98, d / 2 + 0.06, C.woodD);
  v.boxMin(doorX - 0.45, 0.02, d / 2 + 0.03, doorX + 0.45, 1.9, d / 2 + 0.03 + (open ? 0.03 : 0.05), open ? '#3A2A20' : C.wood);
  if (gourds) for (let i = 0; i < 6; i++) v.box(doorX - 0.55 + i * 0.22, 2.08 - Math.abs(i - 2.5) * 0.03, d / 2 + 0.12, 0.14, 0.2, 0.12, jitter('#A9C27A', 0.1, i));
  return v.mesh({ px: 1.3 });
}

// ---------------------------------------------------------------------------------------------
// the day's places: Day 10's Garden (day10-garden.js P) so the lane looks as it did two days ago
// ---------------------------------------------------------------------------------------------
/**
 * World metres. The lane runs west along z 100 from gEast (258, 100); plots and buildings on its north side,
 * fronts +Z. West -> east: the kiln square (paper store, kiln shed + packing room, committee lean-to, drying
 * hall), the corner tea shop, the gourd aunty's plot, U Hpo Htaw's (the third after the clasp), plots 2 and 1.
 */
export const P = {
  fenceZ: P10.fenceZ, backZ: P10.backZ,
  plot1: P10.plot1, plot2: P10.plot2, plotHP: P10.plotHP, plotGA: P10.plotGA,
  clasp: { x: 258, z: 134.4 },
  // the wet crowd huddles at the road's west edge under the clasp's leaves (the road itself stays clear)
  crowd: [{ x: 256.05, z: 132.45, h: 1.9 }, { x: 255.45, z: 133.35, h: 2.4 }, { x: 256.65, z: 133.55, h: -2.8 }, { x: 255.55, z: 131.65, h: 1.3 }],
  bail: { x: 256.9, z: 131.4 }, // a puddle by the arch that the aunty bails
  // U Hpo Htaw's plot: gate in the front fence; bench just inside, left of the path; a path from the gate
  // straight back to his garden house's door (seen through the open gate, past the bench)
  gate: { x: P10.gate.x, z: P10.fenceZ },
  htBench: { x: 239.0, z: 97.05 },
  htSit: { x: 239.0, z: 97.45, h: 0 },
  htHouse: { x: 241.2, z: 91.6, w: 3.0, d: 2.4 },
  htDoor: { x: 241.2, z: 92.85 },
  bedL: { x: 238.55, z: 95.15, w: 1.9 },
  bedR: { x: 243.75, z: 95.4, w: 2.1 },
  farBed: { x: 243.75, z: 91.9, w: 2.1 }, // the far bed: furthest from the gate, by the back fence
  seedBed: { x: 238.4, z: 91.75, w: 1.6 }, // under the low trellis
  htPlant: { x: 243.75, z: 92.85, h: Math.PI },
  mayaFar: { x: 241.7, z: 94.2 },
  arrivals: { naychi: { x: 239.3, z: 93.2, h: Math.PI / 2 }, gourdaunty: { x: 242.4, z: 96.9, h: Math.PI }, kophyo: { x: 240.2, z: 96.6, h: Math.PI * 0.8 } },
  laneOut: { x: 241.2, z: 99.6 },
  // the gourd aunty's plot and kitchen; the shared bean row on the kerb (nobody's); soaked sheets in the lane
  gourd: { x: P10.gaTrellis.x, z: P10.gaTrellis.z },
  aunty: { x: P10.ga.x, z: P10.ga.z, h: 0.6 },
  gaHouse: P10.gaHouse,
  beans: { x: 230.6, z: 98.35 },
  sheets: [{ x: 234.6, z: 99.15 }, { x: 229.2, z: 99.5 }],
  tea: P10.tea,
  // the kiln square
  store: P10.store,
  kophyo: { x: 205.6, z: 90.55, h: 0.2 },
  scale: { x: 200.8, z: 91.0 },
  trader: { x: 201.95, z: 91.05, h: -1.2 },
  girl: { x: 200.2, z: 92.4, h: Math.PI - 0.3 },
  ohnScale: { x: 200.95, z: 92.05, h: Math.PI }, // in front of the scale, clear of the empty stall's roof
  mayaScale: { x: 201.3, z: 93.1 }, // east of the empty stall, so its roof never hides her from the camera
  kiln: P10.kiln,
  pack: P10.pack,
  woodpile: { x: 213.2, z: 90.9 },
  committee: P10.committee,
  committeeDoor: { x: P10.committee.x, z: P10.committee.z + P10.committee.d / 2 + 0.05 },
  board: { x: P10.committee.x - 0.98, z: P10.committee.z + P10.committee.d / 2 + 0.04 },
  hall: P10.hall,
  hallDoor: { x: P10.hall.x, z: P10.hall.z + P10.hall.d / 2 + 0.05 },
  stalls: P10.stalls,
  ohnStall: 1, // Day 10's "Daw Ohn · pots" stall
  hallSlate: null, // (set below: the day's chalk slate by the hall door)
};
// where the region's buildings really stand (the day's people and live props follow them)
if (!OWN('hpohtawshed')) {
  P.htDoor = { x: SPOTS.hp.door.x, z: SPOTS.hp.door.z };
  P.gate = { x: SPOTS.hp.gate.x, z: SPOTS.hp.gate.z };
}
if (!OWN('gourdhouse')) P.gaHouse = { x: SPOTS.gourd.x, z: SPOTS.gourd.z, w: SPOTS.gourd.w, d: SPOTS.gourd.d };
if (!OWN('kilntea')) P.tea = { x: SPOTS.tea.x, z: SPOTS.tea.z };
if (!OWN('paperstore')) {
  const S = SPOTS.store, sc = S.scale;
  P.store = { x: S.x, z: S.z };
  // the trader's scale stands on the square east of the store's door; the trader on its west side, the girl's
  // queue behind him, Daw Ohn on its east side (so neither hides the beam from the lane)
  P.scale = { x: sc.x, z: sc.z };
  P.trader = { x: sc.x - 1.15, z: sc.z + 0.1, h: Math.PI / 2 };
  P.girl = { x: sc.x - 1.55, z: sc.z + 1.45, h: Math.PI - 0.3 };
  P.ohnScale = { x: sc.x + 1.0, z: sc.z + 0.45, h: -Math.PI / 2 - 0.25 };
  P.mayaScale = { x: sc.x + 2.7, z: sc.z + 1.6 }; // a step back and aside: she lends, she does not weigh
  P.kophyo = { x: S.door.x - 2.2, z: S.door.z + 0.55, h: 0.2 }; // weighing bales under the store's eave
  // Daw Ohn's empty stall (her slate says where the market went), clear of the scale
  P.stalls = [{ x: S.door.x - 2.0, z: S.z + S.d / 2 + 4.4 }];
  P.ohnStall = 0;
}
if (!OWN('packroom')) { P.kiln = { x: SPOTS.kiln.x, z: SPOTS.kiln.z }; P.woodpile = SPOTS.kiln.woodpile; }
if (!OWN('committeeroom')) {
  const c = SPOTS.committee;
  P.committee = { x: c.x, z: c.z, w: c.w, d: c.d };
  P.committeeDoor = { x: c.door.x, z: c.door.z };
  P.board = { x: c.board.x, z: c.board.z };
}
if (!OWN('dryinghall')) {
  const hl = SPOTS.hall;
  P.hall = { x: hl.x, z: hl.z, w: hl.w, d: hl.d };
  P.hallDoor = { x: hl.door.x, z: hl.door.z };
}
P.hallSlate = { x: P.hallDoor.x - 1.25, z: P.hallDoor.z };
P.squareFront = SPOTS.squareFront ?? 90; // (the kiln square's north fronts)

export function buildSet(story) {
  const { game } = story;
  const scene = game.world.scene;
  const garden = new THREE.Group(); garden.name = 'd12Garden';
  const home = new THREE.Group(); home.name = 'd12Home';
  scene.add(garden, home);
  const disposers = [];
  const updaters = [];
  const obs = [];
  const space = story.openWorld?.space || null;
  const addOb = (o) => { obs.push(o); if (space) space.add([o]); else story.foot.obstacles.push(o); return o; };
  const box = (x0, x1, z0, z1) => addOb({ type: 'box', minX: Math.min(x0, x1), maxX: Math.max(x0, x1), minZ: Math.min(z0, z1), maxZ: Math.max(z0, z1) });
  const put = (h, parent, x, z, ry = 0, s = 1) => {
    const r = h.root || h;
    r.position.set(x, 0, z);
    r.rotation.y = ry;
    if (s !== 1) r.scale.setScalar(s);
    parent.add(r);
    if (h.dispose) disposers.push(() => h.dispose());
    else disposers.push(() => disposeTree(r));
    if (h.update) { updaters.push((dt, t) => h.update(dt, t)); r.userData.d12update = (dt, t) => h.update(dt, t); }
    return h;
  };
  const mesh = (m, parent = garden) => { parent.add(m); disposers.push(() => disposeTree(m)); return m; };
  const h = {};

  // ---- Home Book: the flat bean bed by the Writing Room (Day 11's place), the soaked board by the Post Office
  const placeDoor = (id, d) => game.world.places.find((p) => p.id === id)?.door || d;
  const ab = placeDoor('about', { x: 0, z: 7 });
  const po = placeDoor('contact', { x: 16.3, z: 3.0 });
  P.homeBed = { x: ab.x - 2.1, z: ab.z + 0.25 };
  P.aboutDoor = { x: ab.x, z: ab.z };
  h.homeBed = put(seedBeds({ w: 1.6, d: 0.7, state: 'flat', seed: 12, date: '' }), home, P.homeBed.x, P.homeBed.z);
  box(P.homeBed.x - 0.85, P.homeBed.x + 0.85, P.homeBed.z - 0.4, P.homeBed.z + 0.4);
  // the soaked "ask Maya" board is the one shared board (api.js story.board, home.js ASK_BOARD; BOARD_DAYS
  // gives it today's soaked look): no second board here. Ma Wint War stands beside it in the evening.
  const SB = story.board;
  if (SB) {
    P.homeBoard = { x: SB.x, z: SB.z, y: SB.target?.y ?? 1.4, stand: SB.stand };
    P.ww = { x: SB.x + 1.15, z: SB.z + 1.05, h: -Math.PI / 2 - 0.35 };
    SB.set({ soaked: true });
    h.board = { setText: (lines) => SB.set({ soaked: true, notice: lines }) };
  } else {
    P.homeBoard = { x: po.x - 1.6, z: po.z + 0.55, y: 1.3 };
    P.ww = { x: po.x - 0.6, z: po.z + 1.2, h: -0.6 };
    h.board = put(askBoard(), home, P.homeBoard.x, P.homeBoard.z);
    addOb({ type: 'circle', x: P.homeBoard.x, z: P.homeBoard.z, r: 0.55 });
  }

  // ---- the lane's plots: one front fence (U Hpo Htaw's gate in it, the gourd aunty's house front), side and back
  // fences, and plots 1 and 2's beds: the region lays them now (gdFence, gdBed); the day draws them only without it
  const FZ = P.fenceZ;
  if (OWN('hpohtawshed')) {
    const fv = new VoxelBuilder();
    const run = (x0, z0, x1, z1, seed) => {
      const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 1.1)), ang = Math.atan2(x1 - x0, z1 - z0);
      for (let i = 0; i <= n; i++) { const t = i / n; fv.box(x0 + (x1 - x0) * t, 0.45, z0 + (z1 - z0) * t, 0.09, 0.9, 0.09, jitter(C.woodD, 0.08, seed + i)); }
      for (const y of [0.38, 0.74]) fv.box((x0 + x1) / 2, y, (z0 + z1) / 2, 0.05, 0.06, len, C.wood, ang);
    };
    run(P.plotGA.x0, FZ, P.gaHouse.x - P.gaHouse.w / 2, FZ, 1);
    run(P.gaHouse.x + P.gaHouse.w / 2, FZ, P.gate.x - 1.15, FZ, 7);
    run(P.gate.x + 1.15, FZ, P.plot1.x1, FZ, 13);
    for (const x of [P.plotGA.x0, P.plotHP.x0, P.plotHP.x1, P.plot2.x1, P.plot1.x1]) run(x, FZ, x, P.backZ, 31 + x);
    run(P.plotGA.x0, P.backZ, P.plot1.x1, P.backZ, 51);
    for (const gx of [247.7, 253.3]) { fv.box(gx, 0.42, FZ + 0.02, 1.0, 0.7, 0.05, C.wood); for (const s of [-1, 1]) fv.box(gx + s * 0.55, 0.55, FZ, 0.12, 1.1, 0.12, C.woodD); }
    mesh(fv.mesh({ px: 1.3 }));
    box(P.plotGA.x0 - 0.1, P.gate.x - 1.15, FZ - 0.12, FZ + 0.12);
    box(P.gate.x + 1.15, P.plot1.x1 + 0.1, FZ - 0.12, FZ + 0.12);
    for (const x of [P.plotGA.x0, P.plotHP.x0, P.plotHP.x1, P.plot1.x1]) box(x - 0.12, x + 0.12, P.backZ, FZ);
    box(P.plotGA.x0, P.plot1.x1, P.backZ - 0.12, P.backZ + 0.12);
    // plots 1 and 2: flattened too (the rain fell on every plot)
    for (const [i, b] of [[0, { x: 253.3, z: 95.2 }], [1, { x: 247.7, z: 95.2 }], [2, { x: 253.3, z: 92.6 }], [3, { x: 247.7, z: 92.6 }]]) {
      put(seedBeds({ w: 2.6, d: 1.1, seed: 20 + i, date: '၁၂ ရက်', state: 'flat' }), garden, b.x, b.z);
    }
  } else {
    // the region's beds in plots 1 and 2 stand; the rain still lies on every plot: puddles in the paths between them
    for (const [x, z, w, d, s] of [[250.5, 93.9, 1.1, 0.7, 31], [247.7, 96.6, 1.4, 0.55, 32], [253.3, 96.65, 1.3, 0.5, 33], [253.3, 93.9, 1.2, 0.6, 34]]) put(puddle({ w, d, seed: s }), garden, x, z);
  }

  // ---- U Hpo Htaw's plot (gate open as he left it, bench, beds flat, name sticks, garden house)
  h.htGate = put(lockedGate({ locked: false, ajar: 1, loaf: false }), garden, P.gate.x, P.gate.z);
  h.htGate.setLocked?.(false); h.htGate.setAjar?.(1);
  h.bench = put(gardenBench({}), garden, P.htBench.x, P.htBench.z);
  box(P.htBench.x - 0.72, P.htBench.x + 0.72, P.htBench.z - 0.28, P.htBench.z + 0.2);
  h.beds = [];
  for (const [p, seed] of [[P.bedL, 3], [P.bedR, 5], [P.seedBed, 9]]) {
    const b = put(seedBeds({ w: p.w, d: 1.0, state: 'flat', seed, date: '၁၂ ရက်' }), garden, p.x, p.z);
    h.beds.push(b);
    box(p.x - p.w / 2 - 0.05, p.x + p.w / 2 + 0.05, p.z - 0.55, p.z + 0.55);
  }
  h.farBed = put(seedBeds({ w: P.farBed.w, d: 1.0, state: 'flat', seed: 7, date: '၁၂ ရက်' }), garden, P.farBed.x, P.farBed.z);
  box(P.farBed.x - P.farBed.w / 2 - 0.05, P.farBed.x + P.farBed.w / 2 + 0.05, P.farBed.z - 0.55, P.farBed.z + 0.5);
  mesh(lowTrellis(1.6)).position.set(P.seedBed.x, 0, P.seedBed.z);
  // his name sticks, beaten over (one canvas each: four is enough to read the lane)
  h.sticks = [];
  // (two sticks: each is its own canvas, a draw call; the far bed gets the date stick after the replant)
  for (const [p, dx] of [[P.bedL, 0.5], [P.bedR, -0.6]]) {
    const s = put(nameStick(T('ဦးဖိုးထော့် ပျိုးပင်', "U Hpo Htaw's seedlings"), { size: 1.2 }), garden, p.x + dx, p.z + 0.42, dx > 0 ? 0.25 : -0.3);
    s.root.rotation.z = dx > 0 ? 0.35 : -0.4;
    h.sticks.push(s);
  }
  // tonight's new stick in the far bed: the date, not his name (shown after the replant)
  h.dateStick = put(nameStick(T('၁၂ ရက်', 'the 12th'), { size: 1.2 }), garden, P.farBed.x - 0.6, P.farBed.z + 0.42);
  h.dateStick.root.visible = false;
  if (OWN('hpohtawshed')) {
    h.htHouse = put(gardenHouse({ W: P.htHouse.w, D: P.htHouse.d }), garden, P.htHouse.x, P.htHouse.z);
    box(P.htHouse.x - P.htHouse.w / 2 - 0.05, P.htHouse.x + P.htHouse.w / 2 + 0.05, P.htHouse.z - P.htHouse.d / 2, P.htHouse.z + P.htHouse.d / 2 + 0.02);
  } else {
    // the region's garden house stands there: the day hangs only its door, swung in, and the dark doorway
    h.htHouse = put(openDoorway({ DW: 0.85, DH: 1.85, y0: 0.2 }), garden, SPOTS.hp.house.x, SPOTS.hp.house.z + SPOTS.hp.house.d / 2);
  }

  // ---- the gourd aunty's plot: her trellis flat in the mud, her kitchen (the region's, door open)
  h.trellis = put(gourdTrellis('down'), garden, P.gourd.x, P.gourd.z);
  box(P.gourd.x - 0.9, P.gourd.x + 0.9, P.gourd.z - 0.5, P.gourd.z + 0.5);
  if (OWN('gourdhouse')) {
    mesh(cottage({ w: P.gaHouse.w, d: P.gaHouse.d, doorX: -0.1, gourds: true })).position.set(P.gaHouse.x, 0, P.gaHouse.z);
    box(P.gaHouse.x - P.gaHouse.w / 2, P.gaHouse.x + P.gaHouse.w / 2, P.gaHouse.z - P.gaHouse.d / 2, P.gaHouse.z + P.gaHouse.d / 2);
  }
  // the shared bean row on the kerb: nobody's (no gate, no sticks)
  h.beanRow = put(seedBeds({ w: 2.2, d: 0.5, state: 'flat', seed: 21, date: '' }), garden, P.beans.x, P.beans.z);
  box(P.beans.x - 1.15, P.beans.x + 1.15, P.beans.z - 0.28, P.beans.z + 0.28);
  // soaked blank sheets blown out of the store, along the kerb and in the puddles
  put(soakedSheets(7, 3), garden, P.sheets[0].x, P.sheets[0].z);
  put(soakedSheets(5, 8), garden, P.sheets[1].x, P.sheets[1].z, 0.6);
  for (const [x, z, w, d, s] of [[236.4, 99.3, 1.6, 0.9, 2], [241.4, 98.7, 1.0, 0.6, 12], [246.0, 99.1, 1.4, 0.7, 6], [252.0, 99.4, 1.8, 0.9, 7], [225.5, 99.2, 1.4, 0.8, 4], [216.0, 99.3, 1.5, 0.8, 9], [205.0, 97.2, 1.4, 0.9, 11], [258.8, 116.0, 1.6, 0.9, 13], [P.bail.x, P.bail.z, 1.5, 1.0, 14]]) put(puddle({ w, d, seed: s }), garden, x, z);

  // ---- the corner tea shop at the lane's mouth (`kilntea`): the region's, when it stands
  if (OWN('kilntea')) {
    h.tea = put(teaShop({ awning: 'plain' }), garden, P.tea.x, P.tea.z);
    box(P.tea.x - 2.65, P.tea.x + 2.65, P.tea.z - 1.95, P.tea.z + 1.95);
  }

  // ---- the kiln square (the region's store, kiln shed + packing room, committee lean-to and drying hall; the day
  // adds the trader's scale, the notice pinned on the committee's board, the hall's chalk slate, Daw Ohn's stall)
  if (OWN('paperstore')) {
    h.store = put(paperStore({ lit: 1 }), garden, P.store.x, P.store.z);
    box(P.store.x - 3.1, P.store.x + 3.1, P.store.z - 2.05, P.store.z + 1.85);
  }
  h.scale = put(marketScale({ tilt: -0.15, weights: 'filed' }), garden, P.scale.x, P.scale.z);
  box(P.scale.x - 0.7, P.scale.x + 0.7, P.scale.z - 0.3, P.scale.z + 0.3);
  const pk = P.pack;
  if (OWN('packroom')) {
    h.kiln = put(kilnBig({ glow: 0.5, smoke: 0.9 }), garden, P.kiln.x, P.kiln.z);
    box(P.kiln.x - 2.6, P.kiln.x + 2.6, P.kiln.z - 2.4, P.kiln.z + 2.4);
    // the packing room lean-to on the kiln shed (low plank door, straw under it) and the woodpile by the desk
    const sv = new VoxelBuilder();
    sv.boxMin(pk.x - pk.w / 2, 0, pk.z - pk.d / 2, pk.x + pk.w / 2, 2.2, pk.z + pk.d / 2, jitter(C.brick, 0.05, 3));
    sv.boxMin(pk.x - pk.w / 2 - 0.15, 2.2, pk.z - pk.d / 2 - 0.2, pk.x + pk.w / 2 + 0.15, 2.32, pk.z + pk.d / 2 + 0.3, '#9C9A92');
    sv.boxMin(pk.x - 0.4, 0.02, pk.z + pk.d / 2, pk.x + 0.4, 1.55, pk.z + pk.d / 2 + 0.07, C.wood);
    for (let i = 0; i < 7; i++) sv.box(pk.x - 0.35 + i * 0.11, 0.02, pk.z + pk.d / 2 + 0.12, 0.08, 0.03, 0.12, '#E3C46E');
    mesh(sv.mesh({ px: 1.3 }));
    box(pk.x - pk.w / 2, pk.x + pk.w / 2, pk.z - pk.d / 2, pk.z + pk.d / 2);
    mesh(woodpile()).position.set(P.woodpile.x, 0, P.woodpile.z);
    box(P.woodpile.x - 0.95, P.woodpile.x + 0.95, P.woodpile.z - 0.5, P.woodpile.z + 0.5);
  }
  if (OWN('committeeroom')) {
    h.committee = put(committeeLean({ W: P.committee.w, D: P.committee.d }), garden, P.committee.x, P.committee.z);
    box(P.committee.x - P.committee.w / 2, P.committee.x + P.committee.w / 2, P.committee.z - P.committee.d / 2, P.committee.z + P.committee.d / 2);
    h.notice = put(noticeBoard({ wall: true, lines: [T('အသိပေးချက်', 'Notice'), T('ဈေးနေ့ · ခုနစ်ရက်တစ်ခါ', 'Market day · once a week'), T('ဆိုင်ခ · ကော်မတီသို့', 'Stall fees · to the committee')] }), garden, P.board.x, P.board.z, 0, 0.62);
  } else {
    // a fresh paper pinned on the region's public board (its face: 1.2 x 0.56 at y 0.62, just proud of the board)
    h.notice = put(pinnedNotice([T('အသိပေးချက်', 'Notice'), T('ဈေးနေ့ · ခုနစ်ရက်တစ်ခါ', 'Market day · once a week'), T('ဆိုင်ခ · ကော်မတီသို့', 'Stall fees · to the committee')], { w: 0.62, h: 0.46 }), garden, P.board.x, P.board.z + 0.1);
  }
  if (OWN('dryinghall')) {
    h.hall = put(dryingHall({ W: P.hall.w, D: P.hall.d }), garden, P.hall.x, P.hall.z);
    box(P.hall.x - P.hall.w / 2, P.hall.x + P.hall.w / 2, P.hall.z - P.hall.d / 2, P.hall.z + P.hall.d / 2);
  } else {
    // the chalk slate on the hall's front wall, west of the door: «the market is inside, for the rain»
    const sl = chalkSlate({ w: 0.5, h: 0.36, text: 'ဈေး · မိုးရွာလို့ အထဲမှာ' });
    h.hallSlate = put(sl, garden, P.hallSlate.x, P.hallDoor.z + 0.04);
    sl.root.position.y = 1.25;
  }
  // the outdoor stalls stand empty today; Daw Ohn's slate says where the market went
  h.stalls = P.stalls.map((s, i) => {
    const st = put(marketStall({ w: 1.6, striped: i % 2 === 0, slate: true, text: i === P.ohnStall ? 'ဒေါ်အုန်း · အိုး → အိုးလှမ်းဆောင်' : '' }), garden, s.x, s.z);
    box(s.x - 0.85, s.x + 0.85, s.z - 0.5, s.z + 0.5);
    return st;
  });

  // ---- Maya's umbrella (she walks dry today; it keeps nothing else dry): the day holds it in her hand
  h.umbrella = umbrella({ open: true });
  h.umbrella.root.scale.setScalar(1.25);
  h.umbrella.root.visible = false;
  disposers.push(() => { h.umbrella.root.removeFromParent(); h.umbrella.dispose(); });

  // ---- doors into the rooms (INDEX 13.1/13.4), registered here until the district declares them;
  // the garden house and the committee room stay shut until their owners open them (the day's setDoor)
  const doors = [
    { room: 'hpohtawshed', x: P.htDoor.x, z: P.htDoor.z + 0.02, facing: 0, r: 0.7, region: 'garden' },
    { room: 'dryinghall', x: P.hallDoor.x, z: P.hallDoor.z, facing: 0, r: 1.0, region: 'garden' },
    { room: 'committeeroom', x: P.committeeDoor.x, z: P.committeeDoor.z, facing: 0, r: 0.7, region: 'garden' },
    { room: 'gourdhouse', x: P.gaHouse.x - 0.1, z: P.gaHouse.z + P.gaHouse.d / 2 + 0.05, facing: 0, r: 0.75, region: 'garden' },
    { room: 'kilntea', x: P.tea.x + (h.tea?.door?.x ?? -0.9), z: P.tea.z + 1.95, facing: 0, r: 0.8, region: 'garden' },
    { room: 'paperstore', x: P.store.x, z: P.store.z + 2.05, facing: 0, r: 1.15, region: 'garden' },
    { room: 'packroom', x: pk.x, z: pk.z + pk.d / 2 + 0.05, facing: 0, r: 0.7, region: 'garden' },
  ];
  const mine = doors.filter((d) => !DOORS[d.room]); // a district file that already owns a door keeps it
  if (story.doors?.registerDoors) story.doors.registerDoors(mine); else registerDoors(mine);

  // ---- phone budget: bake every static prop into one mesh per material (the props' roots stay, so their
  // positions still answer taps; only props that change during the day keep their own meshes)
  for (const k of ['farBed', 'dateStick', 'htHouse']) { const r = h[k]?.root || (h[k]?.isObject3D ? h[k] : null); if (r) r.userData.d12live = true; }
  // the scale's posts and awning bake with the rest; its beam and pans (setTilt) stay their own. (A canvas face,
  // like the notice's, is never merged: its material is its own, so setText still shows.)
  for (const c of h.scale?.root?.children || []) if (!c.isMesh) c.userData.d12keep = true;
  // clusters (the lane, the kiln square, the clasp road), each baked by itself and shown only when Maya or the
  // camera's focus is near: one merged mesh over the whole Garden could never be frustum-culled
  const CL = [
    { name: 'lane', c: new THREE.Vector3(244, 0, 96), r: 52, test: (p) => p.z < 110 && p.x >= 228 },
    { name: 'square', c: new THREE.Vector3(208, 0, 93), r: 52, test: (p) => p.z < 110 && p.x < 228 },
    { name: 'clasp', c: new THREE.Vector3(258, 0, 124), r: 38, test: () => true },
  ].map((k) => { const g = new THREE.Group(); g.name = `d12${k.name}`; garden.add(g); return { ...k, g }; });
  for (const ch of garden.children.slice()) {
    if (CL.some((k) => k.g === ch)) continue;
    const k = CL.find((q) => q.test(ch.position));
    k.g.attach(ch);
  }
  // the flattened beds' little date cards (one canvas each, a draw call apiece) lie face down in the mud today
  for (const b of [...h.beds, h.beanRow]) b?.root?.children.forEach((o) => { if (o.isMesh && o.material?.map && o.position.y > 0.3) o.visible = false; });
  for (const k of CL) for (const f of bakeStatic(k.g)) disposers.push(f);

  const GC = new THREE.Vector3(226, 0, 100);
  return {
    P, h, garden, home, doors: mine,
    update(dt, t, focus) {
      for (const f of updaters) f(dt, t);
      if (focus) {
        const m = game.maya?.root?.position;
        garden.visible = Math.hypot(focus.x - GC.x, focus.z - GC.z) < 110 || (m && Math.hypot(m.x - GC.x, m.z - GC.z) < 110);
        const near = story.foot?.active ? 0.62 : 1; // on foot the view is narrow: nearer culling
        if (garden.visible) for (const k of CL) { const r = k.r * near; k.g.visible = Math.hypot(focus.x - k.c.x, focus.z - k.c.z) < r || (m && Math.hypot(m.x - k.c.x, m.z - k.c.z) < r); }
        home.visible = Math.hypot(focus.x - 8, focus.z - 5) < 70;
      }
    },
    dispose() {
      for (const f of disposers) { try { f(); } catch { /* gone */ } }
      garden.removeFromParent(); home.removeFromParent();
      space?.remove?.(obs);
      for (const o of obs) {
        const arr = space ? space.all : story.foot.obstacles;
        const k = arr?.indexOf(o) ?? -1; if (k >= 0) arr.splice(k, 1);
        if (o.type === 'circle') { o.x = o.z = 1e9; } else { o.minX = o.maxX = o.minZ = o.maxZ = 1e9; }
      }
      obs.length = 0;
      for (const d of mine) if (DOORS[d.room] && DOORS[d.room].x === d.x && DOORS[d.room].z === d.z) delete DOORS[d.room];
    },
  };
}
