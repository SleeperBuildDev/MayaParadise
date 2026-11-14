// Furniture and small things for the generic rooms (rooms/generic.js). Each builder draws into a VoxelBuilder in
// its own local space (feet at y = 0, front +Z, toward the camera) and returns it, with the footprint the
// caller gives room.place(); or adds straight into a builder at (x, y, z). Blocky, outlined, Maya's warm
// palette, original shapes. Nothing religious (no shrine, no altar, no images of anyone holy).
import { VoxelBuilder, jitter, M, rb, cyl, rand } from './generic-stage.js';

export const C = {
  wood: '#B58A5A', woodD: '#7A5434', woodL: '#CDA577', woodXD: '#5A3D26', teak: '#C9A06A', teakD: '#A97F4E',
  gold: '#C9A24A', goldD: '#A47A2C', maroon: '#6E1F2A', cream: '#EDE6D3', paper: '#F6F0E2', white: '#FFFDF8',
  ink: '#2A2118', leaf: '#6F9E5B', leafD: '#4F7F43', leafL: '#8DBA6E', terra: '#B5643C', terraL: '#CB7E4E', terraD: '#8E4A2C',
  clay: '#A97E57', clayRaw: '#D9B48C', iron: '#4A3B30', tin: '#B9B4AA', tinL: '#D8D4CA', tinD: '#8D877C', glass: '#CFE0E6',
  soot: '#2B1E19', mustard: '#E2B33C', rose: '#E8A0A8', teal: '#4F8A86', blue: '#3D6FA8', red: '#C8323C', sack: '#C7B08A', sackD: '#A8916C',
  bamboo: '#D8C27E', bambooD: '#B59A55', rattan: '#C9A26A', rattanD: '#A9824F', mat: '#D9C08A', matD: '#B89A5E',
  brick: '#B9573E', brickD: '#94432F', mortar: '#D8C6A6', net: '#7E8F78', netL: '#9FB09A', rope: '#C8A878',
};
export const BOOKS = [C.maroon, C.goldD, '#2F5DB3', '#3E6B4F', C.cream, '#8E5A3C', '#C27A5B', C.mustard];
const GOODS = ['#C8323C', '#2F5DB3', '#E2B33C', '#6F9E5B', '#F6F0E2', '#E8A94A', '#7FB0CF', '#B5643C', '#D9558A'];

// ---------------- small things (add into v at x, y, z) ----------------
export function teaGlass(v, x, y, z, fill = '#C79A68', s = 1) {
  cyl(v, x, y + 0.045 * s, z, 0.032 * s, 0.027 * s, 0.07 * s, C.glass, 6);
  cyl(v, x, y + 0.04 * s, z, 0.03 * s, 0.025 * s, 0.055 * s, fill, 6);
}
export function thermos(v, x, y, z, col = C.red, s = 1) {
  cyl(v, x, y + 0.13 * s, z, 0.055 * s, 0.06 * s, 0.26 * s, col, 8);
  cyl(v, x, y + 0.24 * s, z, 0.062 * s, 0.062 * s, 0.03 * s, C.tinD, 8);
  cyl(v, x, y + 0.285 * s, z, 0.035 * s, 0.045 * s, 0.05 * s, C.tinL, 8);
  v.box(x, y + 0.14 * s, z + 0.058 * s, 0.05 * s, 0.05 * s, 0.006, C.cream);
}
export function kettle(v, x, y, z, s = 1) {
  cyl(v, x, y + 0.08 * s, z, 0.15 * s, 0.13 * s, 0.16 * s, C.tin, 8);
  cyl(v, x, y + 0.19 * s, z, 0.09 * s, 0.15 * s, 0.07 * s, C.tinL, 8);
  rb(v, x + 0.18 * s, y + 0.12 * s, z, 0.15 * s, 0.04 * s, 0.04 * s, C.tin, 0, 0, 0.75);
  rb(v, x, y + 0.3 * s, z, 0.03 * s, 0.03 * s, 0.2 * s, C.ink, 0, Math.PI / 2, 0);
}
export function cookPot(v, x, y, z, s = 1, col = C.tin) {
  cyl(v, x, y + 0.1 * s, z, 0.16 * s, 0.14 * s, 0.2 * s, col, 8);
  cyl(v, x, y + 0.21 * s, z, 0.165 * s, 0.165 * s, 0.025 * s, C.tinD, 8);
  cyl(v, x, y + 0.24 * s, z, 0.03 * s, 0.03 * s, 0.04 * s, C.ink, 6);
}
export function bowl(v, x, y, z, col = C.white, fill = null, s = 1) {
  cyl(v, x, y + 0.03 * s, z, 0.09 * s, 0.06 * s, 0.06 * s, col, 8);
  if (fill) cyl(v, x, y + 0.058 * s, z, 0.08 * s, 0.08 * s, 0.01, fill, 8);
}
export function jar(v, x, y, z, fill, s = 1, lid = C.maroon) {
  cyl(v, x, y + 0.1 * s, z, 0.07 * s, 0.07 * s, 0.2 * s, C.glass, 8);
  cyl(v, x, y + 0.085 * s, z, 0.062 * s, 0.062 * s, 0.15 * s, fill, 8);
  cyl(v, x, y + 0.215 * s, z, 0.072 * s, 0.072 * s, 0.03 * s, lid, 8);
}
export function claypot(v, x, y, z, s = 1, col = C.terra) {
  cyl(v, x, y + 0.06 * s, z, 0.14 * s, 0.1 * s, 0.12 * s, jitter(col, 0.05, 2), 8);
  cyl(v, x, y + 0.2 * s, z, 0.17 * s, 0.14 * s, 0.16 * s, col, 8);
  cyl(v, x, y + 0.31 * s, z, 0.1 * s, 0.17 * s, 0.06 * s, jitter(col, 0.08, 4), 8);
  cyl(v, x, y + 0.35 * s, z, 0.09 * s, 0.09 * s, 0.03 * s, C.terraD, 8);
}
export function plantPot(v, x, y, z, s = 1, kind = 0, pot = C.terra) {
  cyl(v, x, y + 0.1 * s, z, 0.12 * s, 0.09 * s, 0.2 * s, pot, 8);
  cyl(v, x, y + 0.2 * s, z, 0.13 * s, 0.13 * s, 0.03 * s, C.terraD, 8);
  if (kind === 0) { v.box(x, y + 0.36 * s, z, 0.26 * s, 0.26 * s, 0.26 * s, C.leaf); v.box(x + 0.05 * s, y + 0.52 * s, z, 0.16 * s, 0.16 * s, 0.16 * s, C.leafD); }
  else if (kind === 1) { for (let k = 0; k < 5; k++) rb(v, x + (k - 2) * 0.03 * s, y + 0.38 * s, z, 0.04 * s, 0.38 * s, 0.03 * s, k % 2 ? C.leaf : C.leafD, 0, 0, (k - 2) * 0.22); }
  else if (kind === 2) { v.box(x, y + 0.32 * s, z, 0.22 * s, 0.18 * s, 0.22 * s, C.leafD); for (let k = 0; k < 4; k++) v.box(x + Math.cos(k * 1.7) * 0.08 * s, y + 0.43 * s, z + Math.sin(k * 1.7) * 0.08 * s, 0.06 * s, 0.06 * s, 0.06 * s, [C.rose, C.mustard, C.white, C.red][k % 4]); }
  else { for (let k = 0; k < 6; k++) rb(v, x + Math.cos(k) * 0.08 * s, y + 0.34 * s, z + Math.sin(k) * 0.06 * s, 0.08 * s, 0.3 * s, 0.015, C.leaf, Math.sin(k) * 0.5, k, Math.cos(k) * 0.5); }
}
export function bookPile(v, x, y, z, n = 4, seed = 2) {
  let yy = y;
  for (let i = 0; i < n; i++) { const h = 0.04 + ((seed + i) % 3) * 0.012; v.box(x + ((i * 7) % 3 - 1) * 0.012, yy + h / 2, z, 0.26 - (i % 2) * 0.03, h, 0.19, BOOKS[(seed + i) % BOOKS.length], (i % 2) * 0.12); yy += h; }
  return yy;
}
export function basket(v, x, y, z, fill, s = 1, fill2 = null) {
  cyl(v, x, y + 0.11 * s, z, 0.22 * s, 0.17 * s, 0.22 * s, C.rattan, 8);
  cyl(v, x, y + 0.22 * s, z, 0.23 * s, 0.23 * s, 0.03 * s, C.rattanD, 8);
  if (fill) { const r = rand(Math.round(x * 100 + z * 10)); for (let i = 0; i < 9; i++) v.box(x - 0.13 * s + r() * 0.26 * s, y + 0.25 * s + r() * 0.04 * s, z - 0.13 * s + r() * 0.26 * s, 0.07 * s, 0.06 * s, 0.07 * s, i % 2 && fill2 ? fill2 : fill, r() * 3); }
}
export function sack(v, x, z, col = C.sack, s = 1, ry = 0, fill = null) {
  v.box(x, 0.2 * s, z, 0.42 * s, 0.4 * s, 0.32 * s, col, ry);
  v.box(x, 0.43 * s, z, 0.36 * s, 0.08 * s, 0.26 * s, jitter(col, 0.08, 2), ry);
  if (fill) v.box(x, 0.47 * s, z, 0.28 * s, 0.03 * s, 0.2 * s, fill, ry);
  else v.box(x, 0.49 * s, z, 0.16 * s, 0.07 * s, 0.12 * s, jitter(col, 0.12, 4), ry);
}
export function stool(v, x, z, col = C.teakD, h = 0.28) {
  v.box(x, h - 0.02, z, 0.28, 0.04, 0.28, col);
  for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) v.box(x + a * 0.1, (h - 0.04) / 2, z + b * 0.1, 0.035, h - 0.04, 0.035, jitter(col, 0.1, a + b));
}
export function cushion(v, x, z, col, w = 0.5, d = 0.5) {
  v.box(x, 0.05, z, w, 0.1, d, col);
  v.box(x, 0.101, z, w * 0.7, 0.004, d * 0.7, jitter(col, 0.15, 3));
}
export function slippers(v, x, z, col = C.maroon) {
  for (const s of [-1, 1]) { v.box(x + s * 0.07, 0.015, z, 0.09, 0.03, 0.24, col); v.box(x + s * 0.07, 0.04, z - 0.04, 0.08, 0.02, 0.03, C.ink); }
}

// ---------------- furniture (returns a builder in local space) ----------------
/** A low round tea table (Myanmar homes sit on the floor). */
export function lowRoundTable({ r = 0.42, h = 0.32, top = C.woodL, legs = C.woodD, seed = 1, set = 'tea' } = {}) {
  const v = new VoxelBuilder();
  cyl(v, 0, h - 0.025, 0, r, r, 0.05, top, 12);
  cyl(v, 0, h - 0.06, 0, r - 0.03, r - 0.03, 0.03, legs, 12);
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.78; v.box(Math.cos(a) * (r - 0.1), (h - 0.07) / 2, Math.sin(a) * (r - 0.1), 0.05, h - 0.07, 0.05, legs); }
  if (set === 'tea') {
    thermos(v, -0.15, h, -0.1, [C.red, C.teal, C.blue, '#6F9E5B'][seed % 4], 0.9);
    for (let k = 0; k < 3; k++) teaGlass(v, 0.08 + k * 0.09, h, 0.08 - (k % 2) * 0.07, '#C79A68');
    cyl(v, 0.12, h + 0.015, -0.14, 0.11, 0.11, 0.02, C.white, 10);
    for (let k = 0; k < 4; k++) v.box(0.08 + (k % 2) * 0.07, h + 0.04, -0.17 + Math.floor(k / 2) * 0.06, 0.05, 0.03, 0.04, ['#E8A94A', '#D98A3A'][k % 2], k);
  } else if (set === 'meal') {
    cookPot(v, 0, h, 0, 0.7, C.tinL);
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.4; bowl(v, Math.cos(a) * 0.28, h, Math.sin(a) * 0.25, C.white, ['#E9DFC9', '#8DBA6E', '#C8323C', '#E2B33C'][k], 0.8); }
  } else if (set === 'books') {
    bookPile(v, -0.1, h, 0, 3, seed);
    v.box(0.15, h + 0.008, 0.05, 0.22, 0.016, 0.16, C.paper, 0.3);
  }
  return v;
}
/** A woven floor mat (flat). */
export function floorMat(w, d, a = C.mat, b = C.matD, seed = 1) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, 0, -d / 2, w / 2, 0.012, d / 2, b);
  v.boxMin(-w / 2 + 0.06, 0.004, -d / 2 + 0.06, w / 2 - 0.06, 0.016, d / 2 - 0.06, a);
  const n = Math.round(w / 0.16);
  for (let i = 0; i < n; i++) if (i % 2) v.boxMin(-w / 2 + 0.06 + (i * (w - 0.12)) / n, 0.016, -d / 2 + 0.06, -w / 2 + 0.06 + ((i + 1) * (w - 0.12)) / n, 0.018, d / 2 - 0.06, jitter(a, 0.06, seed + i));
  return v;
}
/** A raised wooden sleeping platform with a folded mosquito net, pillows, a rolled blanket. */
export function sleepPlatform({ w = 1.9, d = 1.3, h = 0.36, wood = C.woodD, sheet = '#E9DFC9', blanket = '#3D6FA8', pillow = '#F6F0E2', net = true, seed = 1 } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, h - 0.08, -d / 2, w / 2, h, d / 2, jitter(wood, 0.05, seed));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * (w / 2 - 0.06), (h - 0.08) / 2, sz * (d / 2 - 0.06), 0.09, h - 0.08, 0.09, wood);
  v.boxMin(-w / 2 + 0.06, h, -d / 2 + 0.06, w / 2 - 0.06, h + 0.08, d / 2 - 0.06, sheet); // the mattress
  v.box(-w / 2 + 0.3, h + 0.12, 0, 0.36, 0.09, d * 0.5, pillow); // pillows at one end
  v.box(-w / 2 + 0.3, h + 0.12, -d * 0.28, 0.32, 0.08, 0.24, jitter(pillow, 0.08, 4));
  cyl(v, w / 2 - 0.35, h + 0.15, 0, 0.12, 0.12, d * 0.7, blanket, 8, Math.PI / 2); // rolled blanket
  v.boxMin(w * 0.05, h + 0.081, -d / 2 + 0.1, w / 2 - 0.5, h + 0.09, d / 2 - 0.1, jitter(blanket, 0.2, 3)); // a folded sheet
  if (net) {
    const top = h + 1.35;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * (w / 2 - 0.04), (h + top) / 2, sz * (d / 2 - 0.04), 0.035, top - h, 0.035, C.woodXD);
    for (const sz of [-1, 1]) v.box(0, top, sz * (d / 2 - 0.04), w, 0.03, 0.03, C.woodXD);
    for (const sx of [-1, 1]) v.box(sx * (w / 2 - 0.04), top, 0, 0.03, 0.03, d, C.woodXD);
    v.boxMin(-w / 2 + 0.02, top - 0.32, -d / 2 + 0.02, w / 2 - 0.02, top - 0.02, -d / 2 + 0.12, '#F4F1EA'); // the net, rolled up
    for (const sx of [-1, 1]) v.box(sx * (w / 2 - 0.12), top - 0.2, 0, 0.08, 0.28, d - 0.2, '#F4F1EA');
  }
  return v;
}
/** A thin sleeping mat on the floor, rolled half open (huts). */
export function sleepMat({ w = 1.7, d = 0.9, col = C.mat, blanket = '#C8323C' } = {}) {
  const v = floorMat(w, d, col, C.matD, 3);
  cyl(v, w / 2 - 0.15, 0.1, 0, 0.1, 0.1, d - 0.04, jitter(col, 0.06, 2), 8, Math.PI / 2);
  v.box(-w / 2 + 0.22, 0.06, 0, 0.3, 0.1, d * 0.6, C.white);
  v.boxMin(-w / 2 + 0.45, 0.016, -d / 2 + 0.06, 0.1, 0.05, d / 2 - 0.06, blanket);
  return v;
}
/** A glass-fronted cupboard of plates and cups. */
export function cupboard({ w = 1.1, h = 1.65, d = 0.42, wood = C.woodD, seed = 1 } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, 0, -d / 2, w / 2, h, d / 2, wood);
  v.boxMin(-w / 2 - 0.03, h, -d / 2 - 0.02, w / 2 + 0.03, h + 0.06, d / 2 + 0.03, jitter(wood, 0.1, 2));
  v.boxMin(-w / 2 + 0.06, 0.75, d / 2 - 0.02, w / 2 - 0.06, h - 0.06, d / 2 + 0.005, '#E6EEF0'); // glass doors
  v.box(0, (0.75 + h - 0.06) / 2, d / 2 + 0.01, 0.03, h - 0.81, 0.01, wood);
  const r = rand(seed);
  for (const y of [0.82, 1.22]) for (let i = 0; i < 5; i++) {
    const x = -w / 2 + 0.16 + i * (w - 0.3) / 4;
    if (r() < 0.5) cyl(v, x, y + 0.12, d / 2 - 0.12, 0.09, 0.09, 0.02, C.white, 10, Math.PI / 2); // plates standing
    else cyl(v, x, y + 0.05, d / 2 - 0.12, 0.04, 0.035, 0.1, [C.white, C.teal, C.mustard][i % 3], 8);
  }
  for (const y of [0.78, 1.18]) v.boxMin(-w / 2 + 0.05, y - 0.02, -d / 2 + 0.03, w / 2 - 0.05, y, d / 2 - 0.03, jitter(wood, 0.12, y * 10));
  for (let i = 0; i < 2; i++) { v.boxMin(-w / 2 + 0.05 + i * (w / 2 - 0.02), 0.08, d / 2 - 0.01, -0.03 + i * (w / 2 - 0.02), 0.68, d / 2 + 0.01, jitter(wood, 0.08, i + 5)); v.box(-0.08 + i * 0.16, 0.4, d / 2 + 0.02, 0.03, 0.08, 0.02, C.gold); }
  return v;
}
/** A plain wardrobe / almirah. */
export function wardrobe({ w = 1.0, h = 1.85, d = 0.5, wood = C.teakD, mirror = true } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, 0, -d / 2, w / 2, h, d / 2, wood);
  v.boxMin(-w / 2 - 0.03, h, -d / 2 - 0.02, w / 2 + 0.03, h + 0.06, d / 2 + 0.03, jitter(wood, 0.1, 2));
  for (const s of [-1, 1]) v.boxMin(s < 0 ? -w / 2 + 0.05 : 0.02, 0.1, d / 2, s < 0 ? -0.02 : w / 2 - 0.05, h - 0.08, d / 2 + 0.015, jitter(wood, 0.06, s + 3));
  if (mirror) v.boxMin(0.08, 0.6, d / 2 + 0.016, w / 2 - 0.12, h - 0.25, d / 2 + 0.022, '#D9E6EA');
  for (const s of [-1, 1]) v.box(s * 0.06, h * 0.5, d / 2 + 0.03, 0.03, 0.12, 0.02, C.gold);
  return v;
}
/** Open shelves (goods: 'books' | 'jars' | 'tins' | 'pots' | 'mixed' | 'yarn' | 'seed' | 'paper'). */
export function shelves({ w = 1.4, h = 1.7, d = 0.36, rows = 4, wood = C.woodD, goods = 'mixed', seed = 3, back = '#B9875A' } = {}) {
  const v = new VoxelBuilder();
  for (const sx of [-1, 1]) v.boxMin(sx < 0 ? -w / 2 : w / 2 - 0.05, 0, -d / 2, sx < 0 ? -w / 2 + 0.05 : w / 2, h, d / 2, wood);
  v.boxMin(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.025, back);
  const r = rand(seed);
  const gap = (h - 0.06) / rows;
  for (let k = 0; k <= rows; k++) v.boxMin(-w / 2, k * gap, -d / 2, w / 2, k * gap + 0.04, d / 2, jitter(wood, 0.06, k));
  for (let k = 0; k < rows; k++) {
    const y = k * gap + 0.04;
    const g = goods === 'mixed' ? ['books', 'jars', 'tins', 'pots', 'cloth'][Math.floor(r() * 5)] : goods;
    let x = -w / 2 + 0.1;
    while (x < w / 2 - 0.12) {
      if (r() < 0.12) { x += 0.12; continue; }
      if (g === 'books') { const bw = 0.04 + r() * 0.035, bh = gap * (0.55 + r() * 0.3); v.boxMin(x, y, -d / 2 + 0.05, x + bw, y + bh, d / 2 - 0.06, BOOKS[Math.floor(r() * 8)]); x += bw + 0.008; }
      else if (g === 'jars') { jar(v, x + 0.07, y, 0, GOODS[Math.floor(r() * GOODS.length)], 0.95); x += 0.17; }
      else if (g === 'tins') { const c = GOODS[Math.floor(r() * GOODS.length)]; for (let s = 0; s < 2; s++) { cyl(v, x + 0.05, y + 0.05 + s * 0.1, 0.02, 0.045, 0.045, 0.1, C.tinL, 8); cyl(v, x + 0.05, y + 0.05 + s * 0.1, 0.02, 0.046, 0.046, 0.06, c, 8); } x += 0.11; }
      else if (g === 'pots') { claypot(v, x + 0.14, y, 0, 0.75, [C.terra, C.terraL, C.clay][Math.floor(r() * 3)]); x += 0.3; }
      else if (g === 'cloth' || g === 'yarn') {
        if (g === 'yarn') { cyl(v, x + 0.06, y + 0.07, 0, 0.06, 0.06, 0.14, GOODS[Math.floor(r() * GOODS.length)], 8, Math.PI / 2); x += 0.13; }
        else { const c = GOODS[Math.floor(r() * GOODS.length)]; for (let s = 0; s < 3; s++) v.box(x + 0.13, y + 0.025 + s * 0.05, 0, 0.26, 0.045, d - 0.1, s % 2 ? jitter(c, 0.15, s) : c); x += 0.3; }
      } else if (g === 'seed') { v.box(x + 0.1, y + 0.05, 0, 0.18, 0.1, d - 0.12, C.kraft || '#D6B486'); v.box(x + 0.1, y + 0.08, d / 2 - 0.059, 0.1, 0.04, 0.004, GOODS[Math.floor(r() * GOODS.length)]); x += 0.21; }
      else if (g === 'paper') { const n = 3 + Math.floor(r() * 5); for (let s = 0; s < n; s++) v.box(x + 0.15, y + 0.01 + s * 0.018, 0, 0.3, 0.016, d - 0.1, s % 3 ? C.paper : C.cream); x += 0.34; }
      else if (g === 'bottles') { const c = ['#8FB0A0', '#C8323C', '#E2B33C', '#7FB0CF'][Math.floor(r() * 4)]; cyl(v, x + 0.04, y + 0.1, 0, 0.035, 0.04, 0.2, c, 6); cyl(v, x + 0.04, y + 0.22, 0, 0.015, 0.02, 0.05, c, 6); x += 0.09; }
      else x += 0.1;
    }
  }
  return v;
}
/** A shop counter with a glass case of sweets/goods on top. */
export function shopCounter({ w = 2.2, d = 0.6, h = 0.78, body = C.woodD, top = C.teak, panel = C.woodL, seed = 2, glass = true, scale = true } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, 0, -d / 2, w / 2, h - 0.06, d / 2, body);
  v.boxMin(-w / 2 - 0.05, h - 0.06, -d / 2 - 0.05, w / 2 + 0.05, h, d / 2 + 0.06, top);
  for (let x = -w / 2 + 0.08; x < w / 2 - 0.1; x += 0.3) v.boxMin(x, 0.12, d / 2, x + 0.24, h - 0.16, d / 2 + 0.015, jitter(panel, 0.06, x * 10));
  v.boxMin(-w / 2, 0, d / 2 - 0.02, w / 2, 0.08, d / 2 + 0.03, C.woodXD);
  const r = rand(seed);
  if (glass) { // a glass case of sweets: a wooden frame, the goods inside, a thin glass lid
    const gw = Math.min(1.0, w * 0.42), gx = w / 2 - gw / 2 - 0.12, gh = 0.26;
    v.boxMin(gx - gw / 2, h, -0.2, gx + gw / 2, h + 0.03, 0.2, C.woodD);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(gx + sx * (gw / 2 - 0.015), h + gh / 2, sz * 0.185, 0.03, gh, 0.03, C.woodD);
    v.boxMin(gx - gw / 2, h + gh, -0.2, gx + gw / 2, h + gh + 0.02, 0.2, '#E3EEF0');
    for (let i = 0; i < 6; i++) { const c = GOODS[Math.floor(r() * GOODS.length)]; jar(v, gx - gw / 2 + 0.1 + (i % 3) * ((gw - 0.2) / 2), h + 0.03, i < 3 ? -0.08 : 0.08, c, 0.85, [C.maroon, C.gold, '#2F5DB3'][i % 3]); }
  }
  if (scale) { // a pan scale at the left end, a coin tin
    const sx = -w / 2 + 0.3;
    v.box(sx, h + 0.03, 0, 0.16, 0.06, 0.16, C.woodXD);
    v.box(sx, h + 0.25, 0, 0.04, 0.42, 0.04, C.woodD);
    rb(v, sx, h + 0.46, 0, 0.46, 0.025, 0.025, C.gold);
    for (const s2 of [-1, 1]) cyl(v, sx + s2 * 0.22, h + 0.26, 0, 0.09, 0.06, 0.03, C.gold, 8);
    v.boxMin(-0.05, h, 0.02, 0.17, h + 0.08, 0.22, C.tin);
  }
  return v;
}
/** A low table/bench for tea (the tea shop). */
export function teaTable({ w = 0.62, d = 0.62, h = 0.45, top = C.woodL, legs = C.woodD, seed = 1, things = true } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, h - 0.045, -d / 2, w / 2, h, d / 2, jitter(top, 0.05, seed));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * (w / 2 - 0.05), (h - 0.045) / 2, sz * (d / 2 - 0.05), 0.05, h - 0.045, 0.05, legs);
  v.boxMin(-w / 2 + 0.05, 0.1, -d / 2 + 0.05, w / 2 - 0.05, 0.12, d / 2 - 0.05, jitter(legs, 0.08, seed + 2));
  if (things) {
    thermos(v, -0.15, h, -0.12, [C.red, C.teal, C.blue][seed % 3], 0.85);
    teaGlass(v, 0.1, h, 0.1);
    if (seed % 2) teaGlass(v, -0.05, h, 0.15, '#B98A5A');
    cyl(v, 0.12, h + 0.012, -0.1, 0.1, 0.1, 0.02, C.white, 10);
    for (let k = 0; k < 3; k++) v.box(0.08 + (k % 2) * 0.07, h + 0.035, -0.13 + (k > 1 ? 0.06 : 0), 0.05, 0.03, 0.04, ['#E8A94A', '#D98A3A', '#F0C070'][k], k);
  }
  return v;
}
/** A plain table (desk height). */
export function table({ w = 1.2, d = 0.7, h = 0.76, top = C.woodL, legs = C.woodD } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, h - 0.05, -d / 2, w / 2, h, d / 2, top);
  v.boxMin(-w / 2 + 0.04, h - 0.12, -d / 2 + 0.04, w / 2 - 0.04, h - 0.05, d / 2 - 0.04, legs);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * (w / 2 - 0.06), (h - 0.05) / 2, sz * (d / 2 - 0.06), 0.06, h - 0.05, 0.06, legs);
  return v;
}
export function chair({ col = C.woodD, seat = null } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-0.22, 0.42, -0.22, 0.22, 0.47, 0.22, seat || col);
  v.boxMin(-0.22, 0.47, -0.22, 0.22, 0.95, -0.18, col);
  v.box(0, 0.8, -0.2, 0.36, 0.1, 0.02, jitter(col, 0.15, 2));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * 0.18, 0.21, sz * 0.18, 0.05, 0.42, 0.05, col);
  return v;
}
/** The long-armed rattan easy chair (an elder's chair on the veranda). */
export function easyChair({ col = C.rattan, frame = C.woodD } = {}) {
  const v = new VoxelBuilder();
  rb(v, 0, 0.42, 0.05, 0.56, 0.06, 0.62, col, -0.12, 0, 0); // seat sloping
  rb(v, 0, 0.72, -0.34, 0.56, 0.62, 0.06, col, -0.45, 0, 0); // back reclining
  for (const s of [-1, 1]) {
    v.box(s * 0.31, 0.58, 0.12, 0.07, 0.04, 0.9, frame); // the long arms
    v.box(s * 0.31, 0.29, 0.5, 0.06, 0.58, 0.06, frame);
    v.box(s * 0.31, 0.27, -0.25, 0.06, 0.54, 0.06, frame);
    rb(v, s * 0.31, 0.62, -0.44, 0.06, 0.5, 0.05, frame, -0.45, 0, 0);
  }
  v.box(0, 0.48, -0.2, 0.42, 0.1, 0.22, '#E9DFC9'); // a cushion
  return v;
}
/** A table radio (old, wooden, with a dial). */
export function radio(v, x, y, z, s = 1) {
  v.box(x, y + 0.11 * s, z, 0.36 * s, 0.22 * s, 0.16 * s, '#8E5A3C');
  v.box(x - 0.07 * s, y + 0.11 * s, z + 0.081 * s, 0.17 * s, 0.15 * s, 0.006, '#D8C6A6'); // speaker cloth
  for (let k = 0; k < 4; k++) v.box(x - 0.07 * s, y + 0.06 * s + k * 0.035 * s, z + 0.085 * s, 0.15 * s, 0.006, 0.004, '#A08A68');
  cyl(v, x + 0.1 * s, y + 0.13 * s, z + 0.082 * s, 0.035 * s, 0.035 * s, 0.01, C.cream, 10, Math.PI / 2);
  cyl(v, x + 0.1 * s, y + 0.06 * s, z + 0.082 * s, 0.022 * s, 0.022 * s, 0.02, C.ink, 8, Math.PI / 2);
  rb(v, x + 0.12 * s, y + 0.32 * s, z, 0.01, 0.24 * s, 0.01, C.tinL, 0, 0, -0.4); // aerial
}
/** A side table on four legs (radio / lamp / thermos). */
export function sideTable({ w = 0.55, d = 0.42, h = 0.62, top = C.teak, legs = C.woodD } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, h - 0.04, -d / 2, w / 2, h, d / 2, top);
  v.boxMin(-w / 2 + 0.04, 0.12, -d / 2 + 0.04, w / 2 - 0.04, 0.15, d / 2 - 0.04, jitter(legs, 0.1, 2));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * (w / 2 - 0.04), (h - 0.04) / 2, sz * (d / 2 - 0.04), 0.045, h - 0.04, 0.045, legs);
  v.boxMin(-w / 2 + 0.02, h, -d / 2 + 0.02, w / 2 - 0.02, h + 0.004, d / 2 - 0.02, '#F4F1EA'); // a crochet cloth
  return v;
}
/** Water pots on a wooden stand, a cup on the lid (drinking water by every door). */
export function waterStand({ n = 2 } = {}) {
  const v = new VoxelBuilder();
  const w = 0.42 * n + 0.1;
  v.boxMin(-w / 2, 0.36, -0.24, w / 2, 0.42, 0.24, C.woodD);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * (w / 2 - 0.04), 0.18, sz * 0.2, 0.05, 0.36, 0.05, C.woodD);
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.26 + i * 0.42;
    claypot(v, x, 0.42, 0, 1.0, [C.terra, C.terraD][i % 2]);
    cyl(v, x, 0.79, 0, 0.11, 0.11, 0.02, C.woodL, 8);
    cyl(v, x + 0.03, 0.84, 0.02, 0.04, 0.035, 0.08, C.tinL, 8);
  }
  return v;
}
/** The cooking corner: a low clay stove (with embers), a pot on it, a shelf with jars; firewood. Returns { v, embers }. */
export function stoveCorner({ w = 1.4, seed = 2 } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, 0, -0.35, w / 2, 0.32, 0.3, '#C4A57E'); // a raised clay hearth platform
  v.boxMin(-w / 2 - 0.02, 0.32, -0.37, w / 2 + 0.02, 0.36, 0.32, '#B0906A');
  cyl(v, -0.2, 0.48, -0.02, 0.2, 0.17, 0.24, C.terra, 8);
  cyl(v, -0.2, 0.6, -0.02, 0.21, 0.21, 0.03, C.terraD, 8);
  v.box(-0.2, 0.44, 0.16, 0.13, 0.09, 0.04, C.soot);
  cookPot(v, -0.2, 0.62, -0.02, 1.0, '#8D877C');
  kettle(v, 0.3, 0.36, -0.1, 0.8);
  for (let k = 0; k < 4; k++) rb(v, w / 2 - 0.15, 0.4 + k * 0.05, 0.1, 0.42, 0.05, 0.05, C.woodD, 0, 0.2 + k * 0.1, 0);
  const r = rand(seed);
  // a wall shelf over it: spice jars and bowls
  v.boxMin(-w / 2, 1.35, -0.34, w / 2, 1.39, -0.12, C.woodD);
  for (let i = 0; i < 6; i++) { const x = -w / 2 + 0.12 + i * (w - 0.2) / 6; if (i % 3 === 2) bowl(v, x, 1.39, -0.23, C.white, null, 0.9); else jar(v, x, 1.39, -0.23, GOODS[Math.floor(r() * GOODS.length)], 0.7); }
  // ladles hanging
  for (let k = 0; k < 3; k++) { v.box(w / 2 - 0.5 + k * 0.12, 1.12, -0.33, 0.015, 0.3, 0.015, C.tinD); cyl(v, w / 2 - 0.5 + k * 0.12, 0.96, -0.32, 0.035, 0.03, 0.03, C.tinD, 6); }
  return { v, embers: [[-0.2, 0.44, 0.19, 0.09, 0.05], [-0.2, 0.6, -0.02, 0.18, 0.03]], steam: [-0.2, 0.86, -0.02] };
}
/** A school desk with a chair, books, a lamp. */
export function studyDesk({ w = 1.1, seed = 3, lamp = true } = {}) {
  const v = table({ w, d: 0.55, h: 0.74, top: C.woodL });
  bookPile(v, -w / 2 + 0.2, 0.74, -0.1, 4, seed);
  v.box(0.05, 0.75, 0.05, 0.36, 0.012, 0.26, C.paper, 0.15); // an exercise book open
  v.box(0.13, 0.756, 0.06, 0.15, 0.004, 0.2, '#E9E4FA', 0.15);
  rb(v, 0.28, 0.76, 0.1, 0.14, 0.012, 0.012, C.mustard, 0, 0.6, 0); // a pencil
  if (lamp) { v.box(w / 2 - 0.14, 0.76, -0.12, 0.14, 0.03, 0.14, C.ink); rb(v, w / 2 - 0.14, 0.95, -0.12, 0.025, 0.36, 0.025, C.ink, 0.3, 0, 0); v.box(w / 2 - 0.14, 1.1, -0.02, 0.18, 0.1, 0.16, C.teal); }
  return v;
}
/** A school satchel. */
export function satchel(v, x, y, z, col = '#2F6B4F') {
  v.box(x, y + 0.15, z, 0.34, 0.3, 0.12, col);
  v.box(x, y + 0.25, z + 0.065, 0.34, 0.12, 0.02, jitter(col, 0.15, 2));
  v.box(x, y + 0.2, z + 0.077, 0.06, 0.04, 0.01, C.gold);
}
/** Clothes on a bamboo pole / wall line. */
export function clothesLine(v, x0, x1, y, z, seed = 4, cols = null) {
  v.box((x0 + x1) / 2, y, z, x1 - x0, 0.03, 0.03, C.bambooD);
  const r = rand(seed);
  const pal = cols || ['#7A2533', '#2E3D63', '#D9A93B', '#2F7C7A', '#E9DFC9', '#D97C8A', '#7A5434'];
  for (let x = x0 + 0.12; x < x1 - 0.2; x += 0.34 + r() * 0.1) {
    const c = pal[Math.floor(r() * pal.length)], L = 0.5 + r() * 0.35;
    v.box(x + 0.13, y - L / 2, z + 0.02, 0.28, L, 0.03, c);
    v.box(x + 0.13, y - L * 0.6, z + 0.036, 0.28, 0.05, 0.004, jitter(c, 0.25, x * 10));
  }
}
/** A broom leaning on a wall (local: lean in x). */
export function broom(v, x, z, lean = 0.12) {
  rb(v, x, 0.7, z, 0.035, 1.35, 0.035, C.woodL, 0.05, 0, lean);
  rb(v, x - Math.sin(lean) * 0.68, 0.11, z, 0.22, 0.24, 0.07, '#C9A26A', 0.05, 0, lean);
}
/** A bucket. */
export function bucket(v, x, z, col = C.blue) {
  cyl(v, x, 0.13, z, 0.15, 0.12, 0.26, col, 8);
  cyl(v, x, 0.25, z, 0.135, 0.135, 0.01, '#8FB8CF', 8);
  rb(v, x, 0.33, z, 0.28, 0.015, 0.015, C.iron);
}
/** A broad wall-mounted rack of hooks with tools (local x along the wall). */
export function toolRack(v, x, y, z, kind = 'garden', w = 1.1) {
  v.box(x, y, z, w, 0.08, 0.04, C.woodD);
  const tools = kind === 'garden' ? ['hoe', 'rake', 'fork', 'sickle', 'trowel'] : kind === 'carver' ? ['chisel', 'chisel', 'mallet', 'chisel', 'saw'] : ['saw', 'hammer', 'square', 'chisel', 'plane'];
  tools.forEach((t, i) => {
    const tx = x - w / 2 + 0.12 + (i * (w - 0.2)) / (tools.length - 1);
    if (t === 'hoe' || t === 'rake' || t === 'fork') { v.box(tx, y - 0.5, z + 0.04, 0.03, 1.0, 0.03, C.woodL); v.box(tx, y - 1.0, z + 0.05, t === 'hoe' ? 0.14 : 0.2, 0.08, 0.02, C.tinD); }
    else if (t === 'sickle') { rb(v, tx, y - 0.15, z + 0.04, 0.03, 0.18, 0.03, C.woodD); rb(v, tx + 0.05, y - 0.3, z + 0.045, 0.15, 0.025, 0.015, C.tinD, 0, 0, 0.6); }
    else if (t === 'saw') { v.box(tx, y - 0.26, z + 0.045, 0.14, 0.42, 0.012, C.tinL); v.box(tx, y - 0.04, z + 0.05, 0.12, 0.08, 0.03, C.woodD); }
    else if (t === 'mallet' || t === 'hammer') { v.box(tx, y - 0.16, z + 0.04, 0.025, 0.26, 0.025, C.woodL); v.box(tx, y - 0.3, z + 0.05, t === 'mallet' ? 0.14 : 0.1, 0.07, 0.07, t === 'mallet' ? C.woodD : C.iron); }
    else if (t === 'square') { v.box(tx, y - 0.2, z + 0.04, 0.025, 0.32, 0.01, C.tinL); v.box(tx + 0.08, y - 0.35, z + 0.04, 0.18, 0.025, 0.01, C.tinL); }
    else { v.box(tx, y - 0.1, z + 0.04, 0.025, 0.16, 0.025, C.woodL); v.box(tx, y - 0.22, z + 0.04, 0.012, 0.1, 0.012, C.tinL); }
  });
}
/** A workbench with a vice and shavings. */
export function workbench({ w = 1.6, d = 0.7, h = 0.82, top = C.woodL, legs = C.woodD, seed = 2 } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, h - 0.08, -d / 2, w / 2, h, d / 2, jitter(top, 0.04, seed));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * (w / 2 - 0.08), (h - 0.08) / 2, sz * (d / 2 - 0.08), 0.09, h - 0.08, 0.09, legs);
  v.boxMin(-w / 2 + 0.08, 0.18, -d / 2 + 0.08, w / 2 - 0.08, 0.22, d / 2 - 0.08, legs);
  v.box(-w / 2 + 0.14, h + 0.06, d / 2 - 0.08, 0.16, 0.12, 0.14, C.iron); // vice
  const r = rand(seed);
  for (let i = 0; i < 10; i++) rb(v, -0.4 + r() * 0.8, h + 0.008, -0.2 + r() * 0.4, 0.06, 0.01, 0.03, '#E9C99A', 0, r() * 3, 0); // shavings
  return v;
}
/** A potter's kick wheel (low). */
export function potWheel() {
  const v = new VoxelBuilder();
  cyl(v, 0, 0.06, 0, 0.36, 0.38, 0.12, C.woodD, 10);
  v.box(0, 0.3, 0, 0.06, 0.36, 0.06, C.iron);
  cyl(v, 0, 0.5, 0, 0.24, 0.24, 0.05, C.woodL, 10);
  claypot(v, 0, 0.52, 0, 0.6, C.clayRaw);
  v.boxMin(-0.5, 0, -0.62, 0.5, 0.3, -0.4, C.woodD); // the bench behind
  return v;
}
/** A small hand press (printer): a frame, a platen and a big screw wheel. */
export function handPress() {
  const v = new VoxelBuilder();
  v.boxMin(-0.5, 0, -0.35, 0.5, 0.75, 0.35, C.iron);
  v.boxMin(-0.55, 0.75, -0.4, 0.55, 0.82, 0.4, '#3A3634');
  for (const s of [-1, 1]) v.box(s * 0.42, 1.25, 0, 0.12, 1.0, 0.16, C.iron);
  v.box(0, 1.78, 0, 1.0, 0.14, 0.2, '#3A3634');
  v.box(0, 1.3, 0, 0.12, 0.6, 0.12, C.tinD);
  v.box(0, 1.0, 0, 0.6, 0.08, 0.5, '#3A3634'); // platen
  v.boxMin(-0.36, 0.82, -0.28, 0.36, 0.85, 0.28, C.paper);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; rb(v, Math.cos(a) * 0.22, 1.62, Math.sin(a) * 0.22, 0.42, 0.03, 0.03, C.iron, 0, -a, 0); }
  cyl(v, 0, 1.62, 0, 0.06, 0.06, 0.06, C.gold, 8);
  return v;
}
/** A floor loom: frame, warp threads, a cloth roll, a bench. */
export function loom({ w = 1.4, warp = '#C8323C', weft = '#E2B33C', seed = 5 } = {}) {
  const v = new VoxelBuilder();
  for (const s of [-1, 1]) { v.box(s * w / 2, 0.75, -0.5, 0.08, 1.5, 0.08, C.woodD); v.box(s * w / 2, 0.45, 0.45, 0.08, 0.9, 0.08, C.woodD); v.box(s * w / 2, 0.5, 0, 0.06, 0.06, 1.0, C.woodD); v.box(s * w / 2, 1.45, -0.2, 0.06, 0.06, 0.65, C.woodD); }
  v.box(0, 1.45, -0.5, w, 0.08, 0.08, C.woodD);
  cyl(v, 0, 0.85, 0.45, 0.06, 0.06, w, C.woodL, 8, 0, Math.PI / 2); // breast beam
  cyl(v, 0, 0.55, -0.5, 0.1, 0.1, w - 0.1, warp, 8, 0, Math.PI / 2); // warp beam
  cyl(v, 0, 0.62, 0.4, 0.09, 0.09, w - 0.1, weft, 8, 0, Math.PI / 2); // cloth roll
  for (let i = 0; i < 18; i++) rb(v, -w / 2 + 0.12 + i * (w - 0.24) / 17, 0.72, -0.05, 0.008, 0.008, 0.95, jitter(warp, 0.1, i), 0.15, 0, 0);
  v.boxMin(-w / 2 + 0.1, 0.78, 0.06, w / 2 - 0.1, 0.8, 0.4, weft); // woven part
  for (let k = 0; k < 4; k++) v.boxMin(-w / 2 + 0.1, 0.801, 0.1 + k * 0.08, w / 2 - 0.1, 0.803, 0.13 + k * 0.08, jitter(warp, 0.05, k));
  v.box(0, 1.1, -0.05, w - 0.1, 0.25, 0.04, C.woodL); // heddle frame
  v.boxMin(-w / 2 + 0.1, 0.42, 0.62, w / 2 - 0.1, 0.48, 0.9, C.woodL); // bench
  for (const s of [-1, 1]) v.box(s * (w / 2 - 0.2), 0.21, 0.76, 0.06, 0.42, 0.22, C.woodD);
  return v;
}
/** A fishing net hung on the wall in loops (local x along the wall). */
export function hungNet(v, x, y, z, w = 1.4, h = 1.2, col = C.net) {
  for (let i = 0; i < 9; i++) { const t = i / 8; rb(v, x - w / 2 + t * w, y - h / 2 + Math.sin(t * 3) * 0.05, z + 0.03, 0.012, h * (0.85 + Math.sin(i) * 0.1), 0.012, col, 0, 0, (t - 0.5) * 0.3); }
  for (let k = 0; k < 6; k++) v.box(x, y - h + 0.15 + k * (h / 6), z + 0.035, w * (0.8 + Math.sin(k) * 0.08), 0.012, 0.012, k % 2 ? col : C.netL);
  for (let i = 0; i < 6; i++) cyl(v, x - w / 2 + 0.1 + i * (w - 0.2) / 5, y - h + 0.12, z + 0.06, 0.05, 0.05, 0.06, i % 2 ? C.mustard : C.red, 6, Math.PI / 2); // floats
  v.box(x, y + 0.02, z + 0.03, w + 0.1, 0.04, 0.04, C.bambooD);
}
/** A crab pot / fish trap (bamboo). */
export function trap(v, x, y, z, s = 1, ry = 0) {
  cyl(v, x, y + 0.18 * s, z, 0.2 * s, 0.24 * s, 0.36 * s, C.bamboo, 8, 0, 0, ry);
  cyl(v, x, y + 0.37 * s, z, 0.1 * s, 0.18 * s, 0.06 * s, C.bambooD, 8, 0, 0, ry);
  for (let k = 0; k < 3; k++) cyl(v, x, y + 0.06 * s + k * 0.12 * s, z, 0.215 * s + k * 0.012 * s, 0.215 * s + k * 0.012 * s, 0.02, C.bambooD, 8);
}
/** A rack of seed trays with green sprouts (gardener). */
export function seedRack({ w = 1.4, rows = 3, seed = 7 } = {}) {
  const v = new VoxelBuilder();
  const d = 0.5, h = 1.3;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * (w / 2 - 0.03), h / 2, sz * (d / 2 - 0.03), 0.05, h, 0.05, C.bambooD);
  const r = rand(seed);
  for (let k = 0; k < rows; k++) {
    const y = 0.2 + k * ((h - 0.25) / rows);
    v.boxMin(-w / 2, y - 0.03, -d / 2, w / 2, y, d / 2, C.bamboo);
    for (let t = 0; t < 3; t++) {
      const tx = -w / 2 + 0.24 + t * (w - 0.4) / 2;
      v.boxMin(tx - 0.2, y, -0.2, tx + 0.2, y + 0.06, 0.2, '#5A4632');
      v.boxMin(tx - 0.18, y + 0.06, -0.18, tx + 0.18, y + 0.065, 0.18, '#6B4F35');
      const g = r() < 0.75;
      if (g) for (let s = 0; s < 9; s++) v.box(tx - 0.13 + (s % 3) * 0.13, y + 0.09 + r() * 0.03, -0.13 + Math.floor(s / 3) * 0.13, 0.05, 0.05 + r() * 0.04, 0.05, s % 2 ? C.leafL : C.leaf);
    }
  }
  return v;
}
/** A watering can. */
export function wateringCan(v, x, y, z, col = '#4F8A86', ry = 0) {
  cyl(v, x, y + 0.11, z, 0.1, 0.11, 0.22, col, 8);
  rb(v, x + Math.cos(ry) * 0.17, y + 0.17, z - Math.sin(ry) * 0.17, 0.22, 0.03, 0.03, col, 0, ry, 0.7);
  rb(v, x, y + 0.27, z, 0.16, 0.02, 0.02, C.iron, 0, ry, 0);
}
/** A bread rack of loaves and buns (baker). */
export function breadRack({ w = 1.1, rows = 4, seed = 9 } = {}) {
  const v = new VoxelBuilder();
  const h = 1.6, d = 0.45;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * (w / 2 - 0.03), h / 2, sz * (d / 2 - 0.03), 0.05, h, 0.05, C.tinD);
  const r = rand(seed);
  for (let k = 0; k < rows; k++) {
    const y = 0.15 + k * ((h - 0.2) / rows);
    v.boxMin(-w / 2, y - 0.02, -d / 2, w / 2, y, d / 2, C.tin);
    const loaves = r() < 0.5;
    for (let i = 0; i < (loaves ? 4 : 8); i++) {
      if (loaves) { const lx = -w / 2 + 0.16 + i * (w - 0.3) / 3; v.box(lx, y + 0.06, 0, 0.18, 0.11, 0.3, '#C98A4A'); v.box(lx, y + 0.12, 0, 0.14, 0.03, 0.26, '#D9A060'); }
      else { const lx = -w / 2 + 0.12 + (i % 4) * (w - 0.24) / 3, lz = i < 4 ? -0.1 : 0.1; cyl(v, lx, y + 0.04, lz, 0.07, 0.08, 0.07, '#D9A060', 8); }
    }
  }
  return v;
}
/** A brick oven with a black iron door and a chimney (baker's back room). */
export function brickOven({ w = 1.6, d = 1.2, h = 1.3, seed = 3 } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, 0, -d / 2, w / 2, h, d / 2, C.brick);
  for (let row = 0; row < 7; row++) for (let i = 0; i < 6; i++) {
    const off = row % 2 ? 0.13 : 0;
    const bx = -w / 2 + off + i * 0.27;
    if (bx + 0.24 > w / 2) continue;
    v.boxMin(bx + 0.01, 0.02 + row * 0.18, d / 2, bx + 0.25, 0.17 + row * 0.18, d / 2 + 0.012, jitter(C.brick, 0.08, row * 7 + i + seed));
  }
  v.boxMin(-w / 2 - 0.05, h, -d / 2 - 0.05, w / 2 + 0.05, h + 0.08, d / 2 + 0.05, C.brickD);
  v.boxMin(-0.32, 0.45, d / 2 + 0.012, 0.32, 0.88, d / 2 + 0.04, C.soot); // the iron door
  v.box(0, 0.66, d / 2 + 0.05, 0.3, 0.03, 0.02, C.tinL);
  v.box(0, 0.25, d / 2 + 0.03, 0.4, 0.12, 0.03, C.soot); // ash door
  v.boxMin(w / 2 - 0.45, h, -d / 2 + 0.05, w / 2 - 0.1, h + 1.4, -d / 2 + 0.4, C.brickD); // chimney
  return { v, ember: [0, 0.27, d / 2 + 0.05, 0.3, 0.06] };
}
/** A dough table with a slab of dough, a rolling pin, trays of buns. */
export function doughTable({ w = 1.6, d = 0.75, seed = 4 } = {}) {
  const v = table({ w, d, h: 0.82, top: '#E7D3B0', legs: C.woodD });
  v.box(-0.3, 0.86, 0, 0.5, 0.07, 0.35, '#F2E6CC');
  cyl(v, 0.15, 0.86, 0.15, 0.03, 0.03, 0.42, C.woodL, 8, 0, Math.PI / 2, 0.3);
  v.boxMin(0.3, 0.82, -0.3, 0.75, 0.84, 0.05, C.tin);
  for (let i = 0; i < 6; i++) cyl(v, 0.38 + (i % 3) * 0.14, 0.86, -0.22 + Math.floor(i / 3) * 0.14, 0.05, 0.055, 0.05, '#F2E6CC', 8);
  for (let i = 0; i < 6; i++) v.box(-0.2 + Math.sin(i * 3.1) * 0.3, 0.825, 0.25 + Math.cos(i * 2.3) * 0.08, 0.06, 0.004, 0.05, '#FBF7EE'); // flour dust
  return v;
}
/** A carving bench: a low table with blocks, a half-carved stamp, chisels; shavings around. */
export function carverBench({ seed = 6 } = {}) {
  const v = workbench({ w: 1.4, d: 0.6, h: 0.62, seed });
  const r = rand(seed);
  for (let i = 0; i < 5; i++) v.box(-0.5 + i * 0.12, 0.66, -0.15, 0.09, 0.08 + r() * 0.06, 0.09, jitter('#D9B07A', 0.08, i));
  v.box(0.15, 0.68, 0.05, 0.2, 0.12, 0.2, '#C9955E');
  v.box(0.15, 0.745, 0.05, 0.16, 0.012, 0.16, C.maroon); // the face being cut
  for (let i = 0; i < 4; i++) rb(v, 0.45, 0.63, -0.1 + i * 0.06, 0.2, 0.015, 0.02, i % 2 ? C.woodD : C.tinL, 0, 0.1 * i, 0);
  return v;
}
/** A rack of finished things on a wall shelf (stamps / pots / boxes). */
export function wallShelf(v, x, y, z, w, kind = 'stamps', seed = 3, wall = 'back') {
  v.boxMin(x - w / 2, y - 0.03, z, x + w / 2, y, z + 0.24, C.woodD);
  const r = rand(seed);
  for (let i = 0; i < Math.floor(w / 0.16); i++) {
    const tx = x - w / 2 + 0.1 + i * 0.16;
    if (kind === 'stamps') { v.box(tx, y + 0.07, z + 0.12, 0.08, 0.14, 0.08, jitter('#C9955E', 0.1, i)); v.box(tx, y + 0.145, z + 0.12, 0.06, 0.02, 0.06, [C.maroon, C.ink, C.blue][i % 3]); }
    else if (kind === 'pots') { if (i % 2 === 0) claypot(v, tx + 0.05, y, z + 0.12, 0.6, [C.terra, C.terraL][i % 2]); }
    else if (kind === 'jars') jar(v, tx, y, z + 0.12, GOODS[Math.floor(r() * GOODS.length)], 0.8);
    else if (kind === 'books') v.boxMin(tx - 0.05, y, z + 0.03, tx + 0.02, y + 0.22 + r() * 0.06, z + 0.21, BOOKS[Math.floor(r() * 8)]);
    else if (kind === 'tins') { cyl(v, tx, y + 0.06, z + 0.12, 0.05, 0.05, 0.12, C.tinL, 8); cyl(v, tx, y + 0.06, z + 0.12, 0.051, 0.051, 0.07, GOODS[i % GOODS.length], 8); }
  }
}
/** Hanging packet strips (a shop classic) along a wire. */
export function packetStrips(v, x0, x1, y, z, seed = 2) {
  const r = rand(seed);
  v.box((x0 + x1) / 2, y, z, x1 - x0, 0.015, 0.015, C.iron);
  const cols = [['#E2B33C', '#C8323C'], ['#2F5DB3', '#F6F0E2'], ['#6F9E5B', '#E2B33C'], ['#C8323C', '#F6F0E2'], ['#E8A94A', '#6E1F2A']];
  for (let x = x0 + 0.12; x < x1 - 0.08; x += 0.17) {
    const [a, b] = cols[Math.floor(r() * cols.length)];
    const n = 3 + Math.floor(r() * 4);
    for (let k = 0; k < n; k++) { const yy = y - 0.08 - k * 0.11; v.box(x, yy, z + 0.01, 0.12, 0.1, 0.02, k % 2 ? a : jitter(a, 0.08, k)); v.box(x, yy + 0.015, z + 0.022, 0.08, 0.035, 0.004, b); }
  }
}
/** A wall clock body (its face is an atlas quad added by the caller). */
export function clockBody(v, x, y, z, r = 0.2) {
  cyl(v, x, y, z + 0.03, r, r, 0.06, C.maroon, 12, Math.PI / 2);
  cyl(v, x, y, z + 0.035, r * 0.88, r * 0.88, 0.062, C.goldD, 12, Math.PI / 2);
}
/** A hanging lamp: a bulb under a tin shade (electric) or a glass oil lamp (kerosene). */
export function hangLamp(v, x, y, z, kind = 'bulb', chain = 0.5) {
  v.box(x, y + chain / 2, z, 0.015, chain, 0.015, C.iron);
  if (kind === 'bulb') { cyl(v, x, y - 0.05, z, 0.05, 0.2, 0.12, '#3E6B4F', 10); }
  else { cyl(v, x, y - 0.02, z, 0.09, 0.07, 0.04, C.goldD, 8); cyl(v, x, y - 0.13, z, 0.06, 0.08, 0.18, C.glass, 8); cyl(v, x, y - 0.24, z, 0.08, 0.09, 0.05, C.goldD, 8); }
}
/** A wall lamp on a bracket: kerosene glass ('oil') or a bulb under a tin shade ('bulb'). (x, z) on the wall,
 *  (dx, dz) the way the wall faces. Returns the flame point [x, y, z]. */
export function wallLamp(v, x, y, z, dx, dz, kind = 'oil') {
  const o = (k) => [x + dx * k, z + dz * k];
  let [a, b] = o(0.02);
  v.box(a, y + 0.05, b, dz ? 0.12 : 0.04, 0.24, dx ? 0.12 : 0.04, C.goldD);
  [a, b] = o(0.15);
  v.box(a, y + 0.16, b, dz ? 0.03 : 0.28, 0.03, dx ? 0.03 : 0.28, C.iron);
  [a, b] = o(0.28);
  if (kind === 'bulb') {
    v.box(a, y + 0.12, b, 0.015, 0.06, 0.015, C.iron);
    cyl(v, a, y + 0.04, b, 0.04, 0.15, 0.1, '#3E6B4F', 10);
    return [a, y - 0.02, b];
  }
  cyl(v, a, y - 0.12, b, 0.07, 0.06, 0.05, C.goldD, 8);
  cyl(v, a, y - 0.01, b, 0.04, 0.065, 0.17, C.glass, 8);
  cyl(v, a, y + 0.09, b, 0.05, 0.04, 0.03, C.goldD, 8);
  v.box(a, y + 0.13, b, 0.015, 0.05, 0.015, C.iron);
  return [a, y - 0.03, b];
}
/** A low wooden chest (clothes, papers). */
export function chest({ w = 0.9, d = 0.5, h = 0.5, col = C.maroon, trim = C.gold } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, 0, -d / 2, w / 2, h, d / 2, col);
  v.boxMin(-w / 2 - 0.02, h - 0.1, -d / 2 - 0.02, w / 2 + 0.02, h, d / 2 + 0.02, jitter(col, 0.1, 3));
  for (const s of [-1, 1]) v.boxMin(s * w / 2 - 0.04, 0, d / 2, s * w / 2 + 0.04, h, d / 2 + 0.01, trim);
  v.box(0, h - 0.16, d / 2 + 0.012, 0.08, 0.1, 0.01, trim);
  return v;
}
/** Oars / poles leaning on a wall (local: along x). */
export function oars(v, x, z, n = 2) {
  for (let i = 0; i < n; i++) { rb(v, x + i * 0.18, 1.1, z, 0.05, 2.2, 0.04, C.woodL, 0.08, 0, 0.12 - i * 0.05); rb(v, x + i * 0.18 + 0.12, 0.25, z, 0.16, 0.45, 0.025, C.woodD, 0.08, 0, 0.12 - i * 0.05); }
}
/** A drying rack of small fish on strings. */
export function fishRack(v, x, y, z, w = 1.0) {
  v.box(x, y, z, w, 0.025, 0.025, C.bambooD);
  for (let i = 0; i < 7; i++) { const fx = x - w / 2 + 0.1 + i * (w - 0.2) / 6; v.box(fx, y - 0.08, z, 0.01, 0.14, 0.01, C.rope); v.box(fx, y - 0.2, z, 0.05, 0.14, 0.02, i % 2 ? '#C9CED1' : '#9EA6AA'); v.box(fx, y - 0.28, z, 0.06, 0.04, 0.012, '#9EA6AA'); }
}
