// Dressing for the generic rooms (rooms/generic.js): after a kind has laid out its furniture, dress() fills the
// floor the close room camera actually sees (the middle band beside the walkway, the front corners by the
// posts) with lived-in clutter picked by the seed from the kind's own pool: water jars, baskets of onions,
// rolled mats, a sewing table, stacked stools, crates, a tiffin carrier, net floats, planks... It checks every
// spot against what is already in the room (furniture, mats, residents, the visitor's spots, the walkway from
// the door to the middle), so nothing lands on a cushion or in Maya's way. Blocky, original, nothing religious.
import { VoxelBuilder, jitter, rb, cyl, rand } from './generic-stage.js';
import * as A from './generic-props.js';

const { C } = A;
const PI = Math.PI;

// ---------------------------------------------------------------------------------------------
// the clutter (each: local space, feet at y 0, front +Z; returns { v, w, d })
// ---------------------------------------------------------------------------------------------
const GLAZE = ['#7A4A2A', '#6B4A2A', '#5E5A3A', '#8E5A3C'];
export function waterJars(R) {
  const v = new VoxelBuilder();
  const g = R.pick(GLAZE);
  // the big glazed water jar (lid, a tin cup on it), a smaller one beside
  cyl(v, 0, 0.1, 0, 0.2, 0.15, 0.2, jitter(g, 0.06, 1), 10);
  cyl(v, 0, 0.36, 0, 0.27, 0.2, 0.32, g, 10);
  cyl(v, 0, 0.58, 0, 0.17, 0.27, 0.12, jitter(g, 0.08, 2), 10);
  cyl(v, 0, 0.66, 0, 0.15, 0.15, 0.04, '#C9A26A', 10);
  for (let k = 0; k < 4; k++) cyl(v, 0, 0.3 + k * 0.004, 0, 0.272, 0.272, 0.012, k % 2 ? '#C9A24A' : g, 10); // a glaze band
  cyl(v, 0.05, 0.72, 0.02, 0.045, 0.04, 0.09, C.tinL, 8);
  A.claypot(v, 0.42, 0, 0.08, 0.85, R.pick([C.terra, C.terraD]));
  return { v, w: 0.95, d: 0.6 };
}
export function produceBaskets(R) {
  const v = new VoxelBuilder();
  const fills = [['#C8323C', '#A82A30'], ['#8E4A6A', '#B5643C'], ['#8DBA6E', '#6F9E5B'], ['#E2B33C', '#D98A3A'], ['#F2E6CC', '#E9DFC9']];
  const n = 2 + R.i(2);
  for (let i = 0; i < n; i++) { const [a, b] = R.pick(fills); A.basket(v, -0.3 + i * 0.36, 0, (i % 2) * 0.12, a, 0.9, b); }
  return { v, w: 0.4 + n * 0.36, d: 0.55 };
}
export function rolledMats(R) {
  const v = new VoxelBuilder();
  const cols = [C.mat, '#C8A86A', '#B89A5E', '#D9C08A'];
  for (let i = 0; i < 3; i++) cyl(v, 0, 0.09 + (i === 2 ? 0.15 : 0), -0.1 + (i === 2 ? 0.09 : i * 0.18), 0.09, 0.09, 1.0, jitter(R.pick(cols), 0.05, i), 8, 0, PI / 2);
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) cyl(v, s * 0.32, 0.09 + (i === 2 ? 0.15 : 0), -0.1 + (i === 2 ? 0.09 : i * 0.18), 0.095, 0.095, 0.03, R.pick([C.red, C.teal, '#2E3D63']), 8, 0, PI / 2);
  return { v, w: 1.1, d: 0.5 };
}
export function sewingTable(R) {
  const v = new VoxelBuilder();
  const w = 0.85, h = 0.74;
  v.boxMin(-w / 2, h - 0.05, -0.22, w / 2, h, 0.22, C.woodL);
  for (const s of [-1, 1]) { v.boxMin(s * w / 2 - 0.05 * (s > 0 ? 1 : 0), 0, -0.2, s * w / 2 + 0.05 * (s < 0 ? 1 : 0), h - 0.05, 0.2, C.iron); }
  v.boxMin(-w / 2, 0.06, -0.15, w / 2, 0.09, 0.15, C.iron); // treadle bar
  rb(v, 0, 0.08, 0.02, 0.4, 0.03, 0.26, C.iron, 0.15, 0, 0); // the treadle
  cyl(v, w / 2 - 0.08, 0.38, 0, 0.2, 0.2, 0.03, C.iron, 10, 0, PI / 2); // the wheel
  // the machine: black body with a gold line
  v.boxMin(-0.32, h, -0.08, 0.2, h + 0.1, 0.08, '#1E1A18');
  v.boxMin(0.12, h + 0.1, -0.08, 0.24, h + 0.32, 0.08, '#1E1A18');
  v.boxMin(-0.32, h + 0.26, -0.07, 0.2, h + 0.34, 0.07, '#1E1A18');
  v.boxMin(-0.34, h + 0.18, -0.04, -0.28, h + 0.32, 0.04, '#1E1A18');
  v.boxMin(-0.32, h + 0.29, 0.071, 0.2, h + 0.305, 0.075, C.gold);
  cyl(v, 0.28, h + 0.24, 0, 0.08, 0.08, 0.04, C.tinL, 10, 0, PI / 2);
  v.box(-0.05, h + 0.012, 0.15, 0.4, 0.012, 0.12, R.pick(['#D97C8A', '#3D6FA8', '#E2B33C', '#2F7C7A']), 0.1); // cloth
  v.box(0.3, h + 0.02, 0.14, 0.05, 0.04, 0.05, '#C8323C'); // a spool
  A.stool(v, 0.3, 0.5, C.teakD, 0.42);
  return { v, w: 0.95, d: 0.9 };
}
export function stoolStack(R) {
  const v = new VoxelBuilder();
  const cols = ['#C8323C', '#3D6FA8', '#2F7C7A', '#E2B33C'];
  const a = R.pick(cols), b = R.pick(cols);
  for (let k = 0; k < 3; k++) { v.box(0, 0.3 + k * 0.07, 0, 0.32, 0.04, 0.32, k % 2 ? jitter(a, 0.08, k) : a); }
  for (const [x, z] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) rb(v, x * 0.12, 0.15, z * 0.12, 0.04, 0.3, 0.04, a, z * 0.08, 0, -x * 0.08);
  for (let k = 0; k < 2; k++) v.box(0.42, 0.3 + k * 0.07, 0.06, 0.32, 0.04, 0.32, b);
  for (const [x, z] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) rb(v, 0.42 + x * 0.12, 0.15, 0.06 + z * 0.12, 0.04, 0.3, 0.04, b, z * 0.08, 0, -x * 0.08);
  return { v, w: 0.85, d: 0.45 };
}
export function crates(R) {
  const v = new VoxelBuilder();
  const wood = R.pick(['#C9A06A', '#B58A5A', '#CDA577']);
  const crate = (x, y, z, s = 1) => {
    const w = 0.5 * s, h = 0.34 * s, d = 0.38 * s;
    v.boxMin(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, jitter(wood, 0.08, x * 10 + y));
    for (let k = 0; k < 3; k++) v.boxMin(x - w / 2 - 0.005, y + 0.03 + k * h * 0.32, z + d / 2, x + w / 2 + 0.005, y + 0.03 + k * h * 0.32 + h * 0.2, z + d / 2 + 0.012, jitter(wood, -0.12, k));
  };
  crate(-0.2, 0, 0); crate(-0.2, 0.34, 0.02, 0.92); crate(0.36, 0, 0.04, 0.9);
  const r = rand(R.i(999));
  for (let i = 0; i < 5; i++) v.box(0.26 + (i % 3) * 0.1, 0.33, -0.04 + Math.floor(i / 3) * 0.12, 0.08, 0.06, 0.08, R.pick(['#E2B33C', '#C8323C', '#8DBA6E']), r() * 3);
  return { v, w: 1.0, d: 0.5 };
}
export function tiffin(R) {
  const v = new VoxelBuilder();
  A.stool(v, 0, 0, C.teakD, 0.36);
  for (let k = 0; k < 4; k++) cyl(v, 0, 0.42 + k * 0.1, 0, 0.1, 0.1, 0.09, k % 2 ? C.tinL : C.tin, 10);
  rb(v, 0, 0.88, 0, 0.02, 0.1, 0.02, C.tinD); rb(v, 0, 0.93, 0, 0.18, 0.02, 0.02, C.tinD);
  for (const s of [-1, 1]) rb(v, s * 0.11, 0.66, 0, 0.015, 0.54, 0.015, C.tinD);
  A.thermos(v, 0.35, 0, 0.05, R.pick([C.red, C.teal, C.blue]), 1.1);
  return { v, w: 0.75, d: 0.4 };
}
function laundry(R) {
  const v = new VoxelBuilder();
  cyl(v, 0, 0.14, 0, 0.3, 0.24, 0.28, C.rattan, 10);
  cyl(v, 0, 0.28, 0, 0.31, 0.31, 0.03, C.rattanD, 10);
  const cols = ['#E9DFC9', '#7A2533', '#2E3D63', '#D9A93B', '#2F7C7A', '#D97C8A'];
  for (let k = 0; k < 4; k++) v.box(-0.05 + (k % 2) * 0.08, 0.3 + k * 0.035, 0, 0.36, 0.035, 0.28, R.pick(cols), k * 0.3);
  for (let k = 0; k < 4; k++) v.box(0.55, 0.02 + k * 0.045, 0.02, 0.36, 0.045, 0.28, R.pick(cols)); // folded on the floor
  return { v, w: 1.0, d: 0.6 };
}
function toys(R) {
  const v = new VoxelBuilder();
  // a wooden toy cart, a cane ball, a slate with chalk, wooden blocks
  const cart = R.pick(['#C8323C', '#3D6FA8', '#E2B33C']);
  v.boxMin(-0.42, 0.06, -0.12, -0.04, 0.16, 0.12, cart);
  for (const sx of [-0.36, -0.1]) for (const sz of [-0.13, 0.13]) cyl(v, sx, 0.06, sz, 0.055, 0.055, 0.03, C.ink, 8, 0, PI / 2);
  rb(v, 0.02, 0.12, 0, 0.18, 0.02, 0.02, C.woodD, 0, 0, 0.3);
  cyl(v, 0.3, 0.09, 0.12, 0.09, 0.09, 0.17, '#C9A26A', 6); cyl(v, 0.3, 0.09, 0.12, 0.095, 0.095, 0.05, '#A9824F', 6, PI / 2);
  v.box(0.25, 0.01, -0.15, 0.3, 0.02, 0.22, '#2A2A2A', 0.3); v.box(0.25, 0.021, -0.15, 0.24, 0.002, 0.16, '#3A4A44', 0.3);
  for (let k = 0; k < 4; k++) v.box(-0.25 + k * 0.1, 0.04, 0.28, 0.08, 0.08, 0.08, ['#C8323C', '#E2B33C', '#3D6FA8', '#6F9E5B'][k], k * 0.4);
  return { v, w: 0.95, d: 0.7 };
}
export function bigPlant(R) {
  const v = new VoxelBuilder();
  const pot = R.pick([C.terra, '#E9DFC9', C.teal, '#5A3A22']);
  cyl(v, 0, 0.18, 0, 0.22, 0.16, 0.36, pot, 10);
  cyl(v, 0, 0.36, 0, 0.23, 0.23, 0.04, jitter(pot, -0.15, 2), 10);
  const r = rand(R.i(999));
  for (let k = 0; k < 7; k++) { const a = (k / 7) * PI * 2 + r(); rb(v, Math.cos(a) * 0.18, 0.75 + r() * 0.2, Math.sin(a) * 0.18, 0.12, 0.62, 0.025, k % 2 ? C.leaf : C.leafD, Math.sin(a) * 0.55, -a, -Math.cos(a) * 0.55); }
  v.box(0, 0.5, 0, 0.06, 0.3, 0.06, C.leafD);
  return { v, w: 0.55, d: 0.55 };
}
function charcoalStove(R) {
  const v = new VoxelBuilder();
  cyl(v, 0, 0.12, 0, 0.17, 0.14, 0.24, C.terra, 8);
  cyl(v, 0, 0.25, 0, 0.18, 0.18, 0.03, C.terraD, 8);
  v.box(0, 0.08, 0.15, 0.1, 0.07, 0.03, C.soot);
  A.cookPot(v, 0, 0.27, 0, 0.8, '#8D877C');
  A.basket(v, 0.42, 0, 0.02, '#2B2420', 0.9, '#3A3634'); // a basket of charcoal
  rb(v, -0.3, 0.02, 0.1, 0.2, 0.015, 0.24, C.bamboo, 0, 0.5, 0); // a woven fan
  return { v, w: 0.95, d: 0.5 };
}
export function lowBench(R) {
  const v = new VoxelBuilder();
  const w = 1.1, h = 0.32, wood = R.pick([C.woodD, C.teakD, '#8E5A3C']);
  v.boxMin(-w / 2, h - 0.05, -0.18, w / 2, h, 0.18, wood);
  for (const s of [-1, 1]) v.boxMin(s * (w / 2 - 0.1) - 0.04, 0, -0.15, s * (w / 2 - 0.1) + 0.04, h - 0.05, 0.15, jitter(wood, -0.1, s));
  v.box(-0.2, h + 0.05, 0, 0.42, 0.1, 0.3, R.pick(['#C8323C', '#2E3D63', '#D9A93B', '#E9DFC9'])); // a folded blanket
  A.bookPile(v, 0.3, h, 0, 2, R.i(5));
  return { v, w: 1.15, d: 0.4 };
}
function riceSacks(R) {
  const v = new VoxelBuilder();
  A.sack(v, -0.25, 0, C.sack, 1, 0.1, '#F2E8D2');
  A.sack(v, 0.22, 0.04, C.sackD, 0.95, -0.15, R.chance(0.5) ? '#7A3A2A' : null);
  v.box(-0.25, 0.24, 0.165, 0.2, 0.12, 0.004, R.pick(['#2F7C7A', '#C8323C', '#3D6FA8'])); // a printed band
  return { v, w: 0.95, d: 0.45 };
}
export function floats(R) {
  const v = new VoxelBuilder();
  const r = rand(R.i(999));
  for (let i = 0; i < 11; i++) { const a = r() * PI * 2, d = r() * 0.28; cyl(v, Math.cos(a) * d, 0.07 + (i > 7 ? 0.12 : 0), Math.sin(a) * d * 0.7, 0.07, 0.07, 0.12, i % 3 ? (i % 2 ? C.red : C.mustard) : '#F2E8D2', 8, r() * 2, r() * 2); }
  A.basket(v, 0.48, 0, 0.02, '#C9CED1', 0.85, '#9EA6AA');
  return { v, w: 1.05, d: 0.6 };
}
export function ropeCoil(R) {
  const v = new VoxelBuilder();
  for (let k = 0; k < 5; k++) cyl(v, 0, 0.025 + k * 0.045, 0, 0.28 - k * 0.015, 0.28 - k * 0.015, 0.045, k % 2 ? C.rope : '#B8986A', 12);
  cyl(v, 0, 0.25, 0, 0.12, 0.12, 0.01, '#8E6644', 12);
  A.bucket(v, 0.48, 0.05, R.pick(['#4F8A86', '#B9B4AA', C.blue]));
  return { v, w: 1.0, d: 0.6 };
}
export function planks(R) {
  const v = new VoxelBuilder();
  for (let k = 0; k < 5; k++) v.boxMin(-0.6 + (k % 2) * 0.03, k * 0.045, -0.15 + (k % 3) * 0.02, 0.6, k * 0.045 + 0.04, 0.15 + (k % 3) * 0.02, jitter(C.woodL, 0.08, k));
  // a sawhorse with a board on it
  for (const s of [-1, 1]) { rb(v, s * 0.08 + 0.85, 0.25, -0.15, 0.04, 0.52, 0.04, C.woodD, 0, 0, s * 0.18); rb(v, s * 0.08 + 0.85, 0.25, 0.15, 0.04, 0.52, 0.04, C.woodD, 0, 0, s * 0.18); }
  v.boxMin(0.8, 0.48, -0.2, 0.9, 0.53, 0.2, C.woodD);
  v.boxMin(0.62, 0.53, -0.12, 1.1, 0.57, 0.12, C.woodL);
  return { v, w: 1.8, d: 0.45 };
}
export function potsRow(R) {
  const v = new VoxelBuilder();
  const cols = [C.terra, C.terraL, C.clay, C.clayRaw];
  for (let i = 0; i < 5; i++) A.claypot(v, -0.55 + i * 0.27, 0, (i % 2) * 0.12, 0.6 + (i % 3) * 0.18, cols[(i + R.i(4)) % 4]);
  return { v, w: 1.45, d: 0.5 };
}
function paperBundles(R) {
  const v = new VoxelBuilder();
  for (let i = 0; i < 3; i++) for (let k = 0; k < 2 + (i % 2); k++) {
    const x = -0.4 + i * 0.4, y = k * 0.16;
    v.box(x, y + 0.08, 0, 0.36, 0.16, 0.28, k % 2 ? C.paper : C.cream, (i - 1) * 0.05);
    v.box(x, y + 0.08, 0, 0.37, 0.165, 0.03, '#B5643C', (i - 1) * 0.05);
  }
  return { v, w: 1.25, d: 0.4 };
}
export function yarnBasket(R) {
  const v = new VoxelBuilder();
  A.basket(v, 0, 0, 0, null, 1.1);
  const cols = ['#C8323C', '#E2B33C', '#2E3D63', '#2F7C7A', '#D97C8A', '#F4EFE4'];
  for (let k = 0; k < 6; k++) cyl(v, -0.1 + (k % 3) * 0.1, 0.28 + Math.floor(k / 3) * 0.06, -0.05 + (k % 2) * 0.1, 0.06, 0.06, 0.1, cols[(k + R.i(6)) % 6], 8, PI / 2, 0, k);
  for (let k = 0; k < 5; k++) v.box(0.5, 0.025 + k * 0.05, 0, 0.42, 0.05, 0.3, cols[(k * 2 + R.i(6)) % 6]); // folded lengths of cloth
  return { v, w: 1.0, d: 0.55 };
}
function breadCrates(R) {
  const v = new VoxelBuilder();
  for (let k = 0; k < 3; k++) {
    const y = k * 0.13;
    v.boxMin(-0.32, y, -0.24, 0.32, y + 0.12, 0.24, k % 2 ? '#C9A06A' : '#B58A5A');
    for (let i = 0; i < 6; i++) cyl(v, -0.2 + (i % 3) * 0.2, y + 0.1, -0.1 + Math.floor(i / 3) * 0.2, 0.07, 0.075, 0.06, '#D9A060', 8);
  }
  A.sack(v, 0.6, 0, '#EFE6D3', 0.9, 0.2, '#FBF7EE');
  return { v, w: 1.1, d: 0.55 };
}
function seedTrays(R) {
  const v = new VoxelBuilder();
  const r = rand(R.i(999));
  for (let t = 0; t < 4; t++) {
    const x = -0.45 + (t % 2) * 0.46, z = -0.2 + Math.floor(t / 2) * 0.42;
    v.boxMin(x - 0.2, 0, z - 0.18, x + 0.2, 0.07, z + 0.18, '#5A4632');
    v.boxMin(x - 0.18, 0.07, z - 0.16, x + 0.18, 0.075, z + 0.16, '#6B4F35');
    for (let s = 0; s < 9; s++) if (r() < 0.85) v.box(x - 0.12 + (s % 3) * 0.12, 0.1 + r() * 0.03, z - 0.11 + Math.floor(s / 3) * 0.11, 0.05, 0.05 + r() * 0.05, 0.05, s % 2 ? C.leafL : C.leaf);
  }
  A.wateringCan(v, 0.45, 0, 0, R.pick(['#4F8A86', '#C8323C', '#3D6FA8']));
  return { v, w: 1.2, d: 0.85 };
}
export function bookStacks(R) {
  const v = new VoxelBuilder();
  for (let i = 0; i < 3; i++) A.bookPile(v, -0.35 + i * 0.32, 0, (i % 2) * 0.08, 3 + R.i(4), R.i(8) + i);
  v.boxMin(0.55, 0, -0.18, 0.95, 0.3, 0.18, R.pick([C.woodD, '#5A6B70', C.maroon])); // a book box
  A.bookPile(v, 0.75, 0.3, 0, 2, R.i(5));
  return { v, w: 1.4, d: 0.45 };
}
function shoeShelf(R) {
  const v = new VoxelBuilder();
  const w = 0.8;
  for (let k = 0; k < 2; k++) v.boxMin(-w / 2, 0.06 + k * 0.22, -0.15, w / 2, 0.09 + k * 0.22, 0.15, C.woodD);
  for (const s of [-1, 1]) v.boxMin(s * w / 2 - 0.03, 0, -0.15, s * w / 2 + 0.03, 0.42, 0.15, C.woodD);
  const cols = ['#6E1F2A', '#2E3D63', '#7A5434', '#C8323C', '#2A2118', '#2F7C7A'];
  for (let k = 0; k < 2; k++) for (let i = 0; i < 3; i++) {
    if (!R.chance(0.8)) continue;
    const c = R.pick(cols), y = 0.09 + k * 0.22 + 0.015;
    for (const s of [-1, 1]) { v.box(-0.25 + i * 0.25 + s * 0.055, y, 0, 0.085, 0.03, 0.22, c); v.box(-0.25 + i * 0.25 + s * 0.055, y + 0.025, -0.04, 0.075, 0.02, 0.03, C.ink); }
  }
  return { v, w: 0.9, d: 0.35 };
}
function bucketMop(R) {
  const v = new VoxelBuilder();
  A.bucket(v, 0, 0, R.pick([C.blue, C.red, '#4F8A86']));
  A.bucket(v, 0.34, 0.06, R.pick(['#E2B33C', '#B9B4AA']));
  cyl(v, 0.1, 0.03, 0.32, 0.12, 0.12, 0.05, '#B9B4AA', 8); // a bowl for washing
  return { v, w: 0.75, d: 0.6 };
}
export function blocksCrate(R) {
  const v = new VoxelBuilder();
  v.boxMin(-0.3, 0, -0.22, 0.3, 0.3, 0.22, '#B58A5A');
  for (let i = 0; i < 9; i++) v.box(-0.18 + (i % 3) * 0.18, 0.34, -0.12 + Math.floor(i / 3) * 0.12, 0.14, 0.1, 0.1, jitter('#D9B07A', 0.1, i));
  for (let i = 0; i < 4; i++) v.box(0.5, 0.06 + i * 0.12, 0, 0.18, 0.12, 0.18, jitter('#C9955E', 0.1, i), i * 0.2);
  return { v, w: 0.95, d: 0.5 };
}

const POOLS = {
  home: [waterJars, produceBaskets, rolledMats, sewingTable, laundry, toys, bigPlant, tiffin, stoolStack, lowBench, charcoalStove, shoeShelf, bucketMop],
  shop: [crates, riceSacks, stoolStack, produceBaskets, waterJars, tiffin, crates],
  tea: [stoolStack, crates, charcoalStove, waterJars, bigPlant, tiffin, bucketMop],
  baker: [breadCrates, riceSacks, crates, waterJars, charcoalStove, bucketMop],
  fisher: [floats, ropeCoil, produceBaskets, waterJars, rolledMats, charcoalStove, bucketMop],
  gardener: [seedTrays, potsRow, bigPlant, produceBaskets, waterJars, bucketMop],
  student: [bookStacks, laundry, bigPlant, rolledMats, stoolStack, shoeShelf, waterJars],
  elder: [waterJars, bigPlant, bookStacks, rolledMats, lowBench, tiffin, laundry, sewingTable, shoeShelf],
  carver: [blocksCrate, crates, lowBench, waterJars, bigPlant],
  potter: [potsRow, waterJars, crates, potsRow, bucketMop],
  printer: [paperBundles, crates, paperBundles, stoolStack, waterJars],
  weaver: [yarnBasket, rolledMats, lowBench, waterJars, yarnBasket],
  netmender: [floats, ropeCoil, produceBaskets, waterJars, charcoalStove],
  carpenter: [planks, crates, stoolStack, waterJars, bucketMop],
};

// ---------------------------------------------------------------------------------------------
// free-space check and placement
// ---------------------------------------------------------------------------------------------
/** Room-space AABB of a builder placed at (x, z) turned ry (quarter turns exact, else its bounding circle). */
export function boundsOf(v, x, z, ry = 0) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, y1 = 0;
  for (const g of v.parts || []) {
    const P = g.attributes?.position;
    if (!P) continue;
    for (let i = 0; i < P.count; i++) { const px = P.getX(i), pz = P.getZ(i), py = P.getY(i); if (px < x0) x0 = px; if (px > x1) x1 = px; if (pz < z0) z0 = pz; if (pz > z1) z1 = pz; if (py > y1) y1 = py; }
  }
  if (!Number.isFinite(x0)) return null;
  const q = Math.round(ry / (PI / 2)), exact = Math.abs(ry - q * (PI / 2)) < 1e-3;
  if (!exact) { const r = Math.max(Math.hypot(x0, z0), Math.hypot(x1, z1), Math.hypot(x0, z1), Math.hypot(x1, z0)); return { minX: x - r, maxX: x + r, minZ: z - r, maxZ: z + r, h: y1 }; }
  const c = Math.round(Math.cos(ry)), s = Math.round(Math.sin(ry));
  const pts = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([a, b]) => [a * c + b * s, -a * s + b * c]);
  return { minX: x + Math.min(...pts.map((p) => p[0])), maxX: x + Math.max(...pts.map((p) => p[0])), minZ: z + Math.min(...pts.map((p) => p[1])), maxZ: z + Math.max(...pts.map((p) => p[1])), h: y1 };
}
const hitBox = (a, b, m = 0) => a.minX - m < b.maxX && a.maxX + m > b.minX && a.minZ - m < b.maxZ && a.maxZ + m > b.minZ;
const hitCircle = (a, x, z, r) => { const cx = Math.max(a.minX, Math.min(x, a.maxX)), cz = Math.max(a.minZ, Math.min(z, a.maxZ)); return Math.hypot(cx - x, cz - z) < r; };

/**
 * dress(c, { taken, people, n }): fill free floor the camera sees with clutter from the kind's pool.
 *   taken   room-space AABBs of everything already put (generic.js records them)
 *   people  [{ x, z }] the residents' spots;   n  how many pieces to try for (default by the seed)
 */
export function dress(c, { taken = [], people = [], n = null } = {}) {
  const { R, st, hw, hd } = c;
  const pool = POOLS[c.kind === 'workshop' ? c.trade : c.kind];
  if (!pool) return 0;
  const want = n ?? 3 + R.i(2);
  const blocks = [...taken, ...st.room.obstacles.filter((o) => o.type === 'box')];
  const circles = [
    ...st.room.obstacles.filter((o) => o.type === 'circle').map((o) => [o.x, o.z, o.r]),
    ...people.map((p) => [p.x, p.z, 0.5]),
    ...Object.values(st.spots).map((s) => [s.x, s.z, 0.45]),
    [0, hd - 0.35, 0.8], [0, hd - 1.1, 0.6],
  ];
  // where the close camera looks: the middle band beside the walkway first, then the front corners, the back
  // candidates: [side, the inner edge's distance from the room's middle line, z]; the inner edge hugs the walkway
  // (0.85 m out) first, so the piece sits inside the close camera's frame rather than against a far side wall
  const edges = [0.85, 1.1, 1.45, 1.85];
  const zs = [0.25, -0.3, 0.8, -0.85, hd - 0.75, 1.3].filter((z) => z < hd - 0.55 && z > -hd + 0.6);
  const cands = [];
  for (const z of zs) for (const e of edges) for (const s of [-1, 1]) cands.push([s, e, z]);
  // shuffle by the seed (keeping the band order loosely: stable sort on a jittered rank)
  const ranked = cands.map((p, i) => ({ p, k: i + R.f() * 10 })).sort((a, b) => a.k - b.k).map((o) => o.p);
  const used = new Set();
  let placed = 0, side = R.chance(0.5) ? 1 : -1;
  for (let tries = 0; tries < pool.length * 2 && placed < want; tries++) {
    const make = pool[(R.i(pool.length) + tries) % pool.length];
    if (used.has(make)) continue;
    const it = make(R);
    const b0 = boundsOf(it.v, 0, 0, 0);
    if (!b0) continue;
    let ok = null;
    // alternate the sides so both halves of the frame get something
    const order = ranked.filter(([s]) => s === side).concat(ranked.filter(([s]) => s !== side));
    for (const [s, e, z] of order) {
      const x = s > 0 ? e - b0.minX : -e - b0.maxX;
      // turned to face into the room from the side walls a little (exact quarter turns keep collisions boxes)
      const ry = 0;
      const b = boundsOf(it.v, x, z, ry);
      if (!b) break;
      if (b.minX < -hw + 0.15 || b.maxX > hw - 0.15 || b.minZ < -hd + 0.1 || b.maxZ > hd - 0.2) continue;
      if (b.minX < 0.8 && b.maxX > -0.8 && b.maxZ > -0.8) continue; // the walkway from the door to the room's middle
      if (blocks.some((o) => hitBox(b, o, 0.1))) continue;
      if (circles.some(([cx, cz, r]) => hitCircle(b, cx, cz, r))) continue;
      ok = { x, z, ry, b };
      break;
    }
    if (!ok) continue;
    st.put(it.v, ok.x, ok.z, ok.ry, null, 'clutter', false);
    st.room.obstacles.push({ type: 'box', minX: ok.b.minX - 0.05, maxX: ok.b.maxX + 0.05, minZ: ok.b.minZ - 0.05, maxZ: ok.b.maxZ + 0.05 });
    blocks.push(ok.b);
    used.add(make);
    placed++;
    side = -side;
  }
  return placed;
}
