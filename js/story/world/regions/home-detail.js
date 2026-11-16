// The Home Book's detail pass (art plan 2026-11-16, section 3): a few small, low, lived-in things on the plaza and
// the pages (the book itself is world.js; these are open-world items, merged into the chunk meshes: no canvas, no
// material, no draw call, nothing per frame). Called once at the end of home.js. Each item sits on its own surface
// (`y`: the page, the plaza ring or the cottage's raised island), clear of the ring road, its crossings and the car
// pads, the ask board, the sorting-room door and the home desk. Nothing points the way; no text.
//
//   H1 paper windmills stuck in the island's flower beds (ch 1: Pho Thar's windmills, practise and the strokes straighten)
//   H2 fallen leaves under five trees on the east page
//   H3 pencil shavings and graphite dust by the giant pencil's tip
//   H4 the postman's bicycle by the Post Office, a mail satchel on its rack
//   H5 a cat asleep in the sun on the giant pencil
//   H6 pigeons on two lamp heads
//   H7 a dropped script page and an ink blot
//   H8 a watering can and a coil of hose by the cottage's flower bed
// Imports only kit.js / toon.js / voxel.js (and the street kit, which imports only those).
import { PALETTE } from '../../../game/toon.js';
import * as SK from '../art/street-kit.js';

const PI = Math.PI;
// surfaces (world.js): the page; the plaza ring and the fountain forecourt; the cottage's island (paving at 0.24)
const PAGE = 0.006, PLAZA = 0.1, ISLAND = 0.245;

/** Lifts an item's whole drawing onto its surface (it.y): every part, solids and decals, rides on Geo.ty. */
const onSurface = (fn) => (g, f, it, ctx) => {
  const y = it.y || 0;
  g.ty = y; f.ty = y;
  fn(g, f, it, ctx);
  g.ty = 0; f.ty = 0;
};

/** H1: a paper windmill on a stick (four folded paper vanes round a gold pin), planted in a flower bed. */
function windmill(g, f, it) {
  const cols = [[PALETTE.cream, PALETTE.gold], [PALETTE.gold, PALETTE.maroon], [PALETTE.white, PALETTE.rose], [PALETTE.cream, PALETTE.maroon]][it.seed % 4];
  g.box(0, 0.42, 0, 0.035, 0.84, 0.035, PALETTE.woodDark);
  for (let k = 0; k < 4; k++) {
    const a = k * PI / 2 + (it.seed || 0) * 0.3;
    g.boxR(Math.cos(a) * 0.09, 0.86 + Math.sin(a) * 0.09, 0.04, 0.18, 0.08, 0.012, cols[k % 2], 0, 0, a + 0.5);
  }
  g.box(0, 0.86, 0.06, 0.04, 0.04, 0.03, PALETTE.gold);
}
/** H4: the postman's bicycle on its stand, a canvas mail satchel on the rack and letters in the front basket. */
function postBike(g, f) {
  for (const x of [-0.5, 0.5]) { g.box(x, 0.33, 0, 0.62, 0.06, 0.04, PALETTE.ink); g.box(x, 0.33, 0, 0.06, 0.62, 0.04, PALETTE.ink); g.box(x, 0.33, 0, 0.42, 0.42, 0.02, '#8E8173'); }
  g.boxR(-0.12, 0.5, 0, 0.75, 0.05, 0.05, PALETTE.maroon, 0, 0, 0.35);
  g.box(0.12, 0.6, 0, 0.62, 0.05, 0.05, PALETTE.maroon);
  g.box(-0.2, 0.76, 0, 0.24, 0.05, 0.12, PALETTE.ink); // saddle
  g.box(0.44, 0.84, 0, 0.05, 0.5, 0.05, PALETTE.maroon);
  g.box(0.44, 1.08, 0, 0.05, 0.05, 0.44, PALETTE.ink); // bars
  g.box(-0.48, 0.66, 0, 0.42, 0.04, 0.24, PALETTE.ink); // rack
  g.box(-0.48, 0.66, 0.2, 0.36, 0.3, 0.12, '#C9A86A'); // the satchel hangs on the near side
  g.box(-0.48, 0.79, 0.27, 0.36, 0.1, 0.02, '#A9834A'); // its flap
  g.box(-0.48, 0.74, 0.28, 0.06, 0.06, 0.01, PALETTE.gold); // buckle
  g.box(0.64, 0.66, 0, 0.22, 0.16, 0.26, PALETTE.wood); // the front basket
  g.box(0.62, 0.78, 0.02, 0.14, 0.1, 0.02, PALETTE.white); // letters in it
  g.box(0.68, 0.79, -0.04, 0.12, 0.1, 0.02, '#F2E2C4');
  g.box(-0.05, 0.14, 0.14, 0.03, 0.26, 0.03, PALETTE.ink); // the stand
  f.flatR(0, 0.05, 1.5, 0.45, 0.0022, '#D9CFBA');
}
/** H7: a script page dropped face up: cream sheet, four grey lines of typing, a scene number. */
function scriptPage(g, f, it) {
  const a = it.ry2 || 0.25;
  f.flatR(0, 0, 0.42, 0.56, 0.0062, PALETTE.white, a);
  for (let k = 0; k < 4; k++) f.flatR(-0.02 + (k === 1 ? 0.06 : 0) - 0.03 * Math.sin(a) * k, -0.14 + k * 0.1, k === 1 ? 0.22 : 0.3, 0.025, 0.0066, '#9A948A', a);
  f.flatR(-0.15, -0.21, 0.06, 0.04, 0.0066, PALETTE.maroon, a);
}
/** H8: a watering can (body, spout, handle) and a short coil of green hose. */
function wateringCan(g, f) {
  g.box(0, 0.14, 0, 0.3, 0.26, 0.2, '#4E8C86');
  g.box(0, 0.28, 0, 0.24, 0.03, 0.14, '#3E7A74');
  g.boxR(0.24, 0.24, 0, 0.26, 0.04, 0.04, '#4E8C86', 0, 0, 0.6);
  g.box(0.35, 0.32, 0, 0.06, 0.06, 0.08, '#3E7A74'); // the rose
  g.box(-0.04, 0.36, 0, 0.2, 0.04, 0.03, '#3E7A74'); // handle
  for (let k = 0; k < 3; k++) {
    const R = 0.28 - k * 0.06;
    f.flatR(0.75, 0.25, R * 2, 0.045, 0.0062 + k * 0.0003, '#5E9A4E', 0);
    f.flatR(0.75, 0.25, 0.045, R * 2, 0.0062 + k * 0.0003, '#5E9A4E', 0);
  }
  f.flatR(0.1, 0.05, 0.6, 0.45, 0.0058, '#D9CFBA'); // wet patch
}

/** ?nodetail (testing only): the detail pass is left out, to measure the town with and without it on one server. */
export const DETAIL_OFF = (() => { try { return new URLSearchParams(globalThis.location?.search || '').has('nodetail'); } catch { return false; } })();

export const PROP = {
  hmWindmill: { draw: onSurface(windmill), obstacles: () => [] },
  hmLeaves: { draw: onSurface(SK.leaves), obstacles: () => [] },
  hmScrap: { draw: onSurface(SK.scrap), obstacles: () => [] },
  hmBike: { draw: onSurface(postBike), obstacles: (it) => [SK.obBox(it, 1.5, 0.4)] },
  hmPerch: { draw: SK.perch, obstacles: () => [] }, // (perch sits at its own `y`)
  hmPage: { draw: onSurface(scriptPage), obstacles: () => [] },
  hmCan: { draw: onSurface(wateringCan), obstacles: (it) => [SK.circ(it, 0.22)] },
};

// (all of it in the book's south-east quarter: the open world builds the home book's items into its chunk meshes, and
// only the 20 m cell of the Post Office's side door (x 0..20, z 0..20) and the ground of its 40 m chunk (the ribbon
// road's) have meshes there already: an item anywhere else would add a mesh, two draw calls with its ink)
export const ITEMS = [
  // H1 windmills in two of the island's ring beds east of the cottage (in the bed's inner half; clear of the window
  // bed east of the door, day15.js BED, and of Pho Thar's own windmills at the page's windy edge)
  { k: 'hmWindmill', x: 3.53, z: 4.85, ry: -0.3, y: ISLAND + 0.12, seed: 0 },
  { k: 'hmWindmill', x: 3.33, z: 3.28, ry: -0.4, y: ISLAND + 0.12, seed: 1 },
  // H2 leaves under five trees (padauk gold under the padauks, rain-tree browns under the others), 2.6 m and more
  // from a road's middle line
  { k: 'hmLeaves', x: 9.0, z: 0.8, y: PAGE, w: 1.4, d: 1.0, seed: 1, pal: 'rain' },
  { k: 'hmLeaves', x: 12.5, z: 9.0, y: PAGE, w: 2.2, d: 1.6, seed: 2, pal: 'padauk' },
  { k: 'hmLeaves', x: 8.4, z: 13.3, y: PAGE, w: 1.4, d: 1.4, seed: 3, pal: 'padauk' },
  { k: 'hmLeaves', x: 17.5, z: 13.6, y: PAGE, w: 2.2, d: 1.6, seed: 4, pal: 'rain' },
  { k: 'hmLeaves', x: 10.9, z: 15.7, y: PAGE, w: 2.2, d: 1.6, seed: 5, pal: 'rain' },
  // H3 shavings by the giant pencil's tip
  { k: 'hmScrap', x: 19.7, z: 8.85, ry: 0.3, y: PAGE, kind: 'shaving', seed: 3 },
  // H4 the postman's bicycle on its stand before the Post Office's east end (west of it the paved strip is the road's)
  { k: 'hmBike', x: 19.9, z: 3.4, ry: 0, y: PAGE },
  // H5 a cat asleep in the sun on the giant pencil
  { k: 'hmPerch', x: 15.44, z: 11.18, ry: 0.28, y: 0.53, kind: 'cat', seed: 2 },
  // H6 pigeons on two lamp heads (the cap's maroon ledge)
  { k: 'hmPerch', x: 8.6, z: 6.6, ry: 0.2, y: 2.86, kind: 'pigeons', seed: 1 },
  { k: 'hmPerch', x: 7.07, z: 1.57, ry: -0.3, y: 2.86, kind: 'pigeons', seed: 2 },
  // H7 a dropped script page and an ink blot out on the east page
  { k: 'hmPage', x: 13.4, z: 12.9, ry: 0, y: PAGE, ry2: 0.35 },
  { k: 'hmScrap', x: 14.6, z: 13.4, ry: 0.5, y: PAGE, kind: 'blot', seed: 5 },
  // H8 the watering can by the cottage's east wall, beside the bed, its hose coiled on the island paving
  { k: 'hmCan', x: 2.95, z: 5.6, ry: -0.5, y: ISLAND },
];

/** Called once at the end of home.js: adds the items and their kinds to the Home Book's own tables. */
export function detail({ ITEMS: items, PROP: props }) {
  if (DETAIL_OFF) return;
  Object.assign(props, PROP);
  items.push(...ITEMS);
}
