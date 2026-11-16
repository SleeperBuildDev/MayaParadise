// Diary Garden detail pass (district 6, art-plan 2026-11-16 section 10): the small things that make the Garden
// look lived in from the low walking camera. Power poles behind the north plots, flower rows that are not all
// alike, clay dust and broken pots in the kiln square, bees at the hives, a creeper that touches the neighbour's
// fence and stops short of the sapling (ch 16), a weight stone anyone may use at the paper store's scale (ch 17),
// dated tags in the beds and puddles in a furrow (ch 19), steam and lanterns at the corner tea shop, a cat on a
// gate post, a dog asleep in a yard, a goat on its tether, hay and water pots on the north road, tanks, compost
// and a barrow in the back lots, pigeons on a bench and a straw hat someone dropped.
//
// Called LAST from regions/garden.js: fillDetail({ ITEMS, add, town, gates }) after fillTown (town = its return:
// put / putNear / clear, the town's own clear-check: roads, lanes, doors, story places, people, what is there).
// Cost rules (art-plan section 0): no new material, mesh, board or canvas; everything is merged into the chunk
// meshes (outlined solids in g, small no-ink boxes and flat decals in f); 3 smoke points at most (this pass: 1),
// evening glows at most 8 (this pass: 2); each draw well under 60 boxes; nothing has an update.
// Things fixed to a building (the tea shop's lanterns, the stone shelf on the scale's awning post) take the building's own anchor (same x, z) and are `cut`, so the cutaway fades them with it.
// Nothing here points the way; no words (no boards). Original art; imports kit.js, the Garden's palette and the
// shared street kit only.
import { rng, shade } from '../kit.js';
import { K } from '../art/garden.js';
import * as SK from '../art/street-kit.js';

const HP = Math.PI / 2;
/** item-local (lx, lz) -> world (g carries the item's origin and turn) */
const wp = (g, lx, lz) => [g.tx + lx * g.tc + lz * g.ts, g.tz - lx * g.ts + lz * g.tc];
const box = (x0, z0, x1, z1) => ({ type: 'box', minX: x0, maxX: x1, minZ: z0, maxZ: z1 });
/** keep-out of an item-local rect, turned (world AABB) */
function obB(w, d, ox = 0, oz = 0) {
  return (it) => {
    const c = Math.abs(Math.cos(it.ry || 0)), s = Math.abs(Math.sin(it.ry || 0));
    const cx = it.x + ox * Math.cos(it.ry || 0) + oz * Math.sin(it.ry || 0), cz = it.z - ox * Math.sin(it.ry || 0) + oz * Math.cos(it.ry || 0);
    const ex = (c * w + s * d) / 2, ez = (s * w + c * d) / 2;
    return [box(cx - ex, cz - ez, cx + ex, cz + ez)];
  };
}
const none = () => [];

// ---------------------------------------------------------------------------------
// draws
// ---------------------------------------------------------------------------------
/** A flower row that is not all alike: the same low blooms, and every fourth plant something else (a sunflower
 * under a metre, a round marigold, a creeper on two sticks). Swapped in for gdBorder (same footprint: none). */
function border(g, f, it) {
  const L = it.len || 4, r = rng((it.seed || 2) * 7 + 1), cols = [K.rose, K.mustard, K.white, K.orange, K.violet];
  let i = 0;
  for (let x = -L / 2 + 0.2; x < L / 2 - 0.1; x += 0.34, i++) {
    const z = (r() - 0.5) * 0.2, pick = r();
    if (i % 4 === 2 && pick < 0.36) { // a sunflower: stalk, a leaf, the face and its brown middle
      const h = 0.72 + r() * 0.3;
      g.box(x, h / 2, z, 0.05, h, 0.05, K.leafD);
      g.box(x + 0.08, h * 0.5, z, 0.16, 0.04, 0.09, K.leaf);
      g.box(x, h + 0.08, z + 0.02, 0.26, 0.26, 0.05, K.mustard);
      f.box(x, h + 0.08, z + 0.055, 0.11, 0.11, 0.02, K.woodD);
    } else if (i % 4 === 2 && pick < 0.7) { // a marigold dome
      g.box(x, 0.16, z, 0.3, 0.32, 0.3, K.leafD);
      g.box(x, 0.35, z, 0.32, 0.1, 0.32, K.orange);
      f.box(x, 0.41, z, 0.16, 0.04, 0.16, K.mustard);
    } else if (i % 4 === 2) { // a creeper on two sticks, one flower
      for (const sx of [-0.09, 0.09]) g.box(x + sx, 0.36, z, 0.03, 0.72, 0.03, K.bambooD);
      for (let k = 0; k < 3; k++) f.box(x + (k % 2 ? 0.07 : -0.06), 0.18 + k * 0.2, z + 0.03, 0.13, 0.11, 0.07, k % 2 ? K.leaf : K.leafL);
      f.box(x + 0.04, 0.66, z + 0.05, 0.07, 0.07, 0.07, K.rose);
    } else {
      const h = 0.18 + r() * 0.18;
      g.box(x, h / 2, z, 0.26, h, 0.24, r() < 0.5 ? K.leaf : K.leafD);
      if (r() < 0.7) g.box(x + 0.02, h + 0.05, (r() - 0.5) * 0.15, 0.14, 0.08, 0.14, cols[Math.floor(r() * cols.length)]);
    }
  }
  f.flat(-L / 2, -0.3, L / 2, 0.3, 0.0045, '#DCCBB0');
  // two petals fallen on the kerb side
  f.flatR(-L / 4, 0.42, 0.09, 0.06, 0.0052, K.rose, 0.6); f.flatR(L / 5, 0.38, 0.08, 0.06, 0.0052, K.mustard, -0.4);
}

/** Clay dust on the square's paving round a pallet of fired pots bedded in straw (ch 20: pots that came through
 * the fire). it: {} */
function clayCorner(g, f) {
  const r = rng(51);
  for (let k = 0; k < 5; k++) f.flatR((r() - 0.5) * 2.2, (r() - 0.5) * 1.3, 0.8 + r() * 0.8, 0.5 + r() * 0.5, 0.0052 + k * 0.0002, k % 2 ? '#E2C7A6' : '#DCBD99', r() * 3);
  // the pallet: three bearers, slats, a straw bed, two rows of three pots (rims lighter), straw between them
  for (const z of [-0.32, 0, 0.32]) g.box(0, 0.05, z, 1.1, 0.1, 0.12, K.woodG);
  g.box(0, 0.13, 0, 1.12, 0.06, 0.86, K.woodL);
  g.box(0, 0.19, 0, 1.04, 0.06, 0.8, K.straw);
  for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) {
    const x = -0.34 + i * 0.34, z = -0.18 + j * 0.36, h = 0.26 + ((i + j) % 2) * 0.04, c = (i + j) % 3 ? K.terra : K.brickL;
    g.box(x, 0.22 + h / 2, z, 0.26, h, 0.26, c);
    f.box(x, 0.22 + h + 0.015, z, 0.3, 0.03, 0.3, shade(c, 1.12));
  }
  for (const [x, z] of [[-0.5, 0.3], [0.52, -0.3], [0.1, 0.44]]) f.box(x, 0.26, z, 0.14, 0.08, 0.1, K.strawD);
}
/** A few broken shards and grit by the kiln shed's front (flat; walk-through). */
function shards(g, f) {
  const r = rng(77);
  f.flatR(0, 0, 1.6, 0.7, 0.0054, '#DDC3A2', 0.1);
  for (let k = 0; k < 6; k++) f.boxR((r() - 0.5) * 1.3, 0.025, (r() - 0.5) * 0.5, 0.1 + r() * 0.08, 0.03, 0.08 + r() * 0.06, k % 2 ? K.terra : K.terraD, 0.4 * (r() - 0.5), r() * 3, 0.5 * (r() - 0.5));
  void g;
}
/** On the paper store's awning post (the item takes the store's own anchor): a little shelf with the check-weight
 * stone (a grey block, a white painted band, a brass ring to lift it) that anyone may put on the scale (ch 17). */
function weighShelf(g, f, it) {
  const D = it.d || 6, W = it.w || 8, X = W / 2 - 0.1, Z = D / 2 + 2.3 + 0.06; // the awning's east post (art/garden.js paperStore)
  g.box(X, 0.92, Z + 0.13, 0.36, 0.04, 0.24, K.woodL);
  g.box(X, 0.84, Z + 0.04, 0.05, 0.12, 0.08, K.woodD);
  g.box(X - 0.04, 1.02, Z + 0.15, 0.2, 0.16, 0.16, K.stone);
  f.box(X - 0.04, 1.02, Z + 0.235, 0.21, 0.035, 0.012, K.white);
  f.box(X - 0.04, 1.115, Z + 0.15, 0.07, 0.03, 0.07, K.brass);
}
/** Bees about a hive stand's mouths (same anchor and turn as the gdHives they belong to): tiny, still, in a ring. */
function bees(g, f, it) {
  const r = rng(Math.round(it.x * 13 + it.z * 7));
  for (let k = 0; k < 6; k++) {
    const hx = k % 2 ? 0.5 : -0.5, a = r() * Math.PI * 2, rr = 0.18 + r() * 0.3;
    const x = hx + Math.cos(a) * rr, y = 0.5 + r() * 0.55, z = 0.42 + Math.abs(Math.sin(a)) * rr;
    f.box(x, y, z, 0.075, 0.055, 0.055, K.mustard, a);
    f.box(x, y, z, 0.022, 0.06, 0.06, K.ink, a);
    f.box(x, y + 0.04, z, 0.05, 0.01, 0.08, '#F4F1EA', a);
  }
  void g;
}
/** A bamboo trellis against the shared plot fence: the creeper on it reaches over and touches the neighbour's
 * fence, and stops a hand short of the sapling at the end (ch 16: connected, not choking). Along local z. */
function creeperTrellis(g, f) {
  const r = rng(16);
  for (const z of [-1.6, 0, 1.4]) g.box(0, 0.58, z, 0.06, 1.16, 0.06, K.bambooD);
  for (const y of [0.5, 1.04]) g.box(0, y, -0.1, 0.04, 0.04, 3.1, K.bamboo);
  // the creeper: leaves along both rails from the north end to z 0.9, three tendrils over to the fence (x -0.33)
  for (let z = -1.55; z < 0.9; z += 0.24) for (const y of [0.5, 1.04]) {
    if (r() < 0.25) continue;
    f.box((r() - 0.5) * 0.08, y + (r() - 0.3) * 0.12, z, 0.1, 0.12, 0.14, r() < 0.5 ? K.leaf : K.leafB);
  }
  for (const z of [-1.2, -0.3, 0.5]) { f.box(-0.17, 0.78, z, 0.3, 0.025, 0.025, K.leafD); f.box(-0.3, 0.8, z, 0.06, 0.08, 0.08, K.leafL); }
  f.box(0.04, 0.83, 0.82, 0.06, 0.06, 0.06, K.rose); f.box(-0.03, 0.62, -0.7, 0.06, 0.06, 0.06, K.white);
  // the sapling, a hand clear of the last leaf: a stake, a thin stem and three leaves
  g.box(0.1, 0.36, 1.98, 0.035, 0.72, 0.035, K.woodL);
  f.box(0, 0.28, 2.0, 0.04, 0.56, 0.04, K.leafD);
  for (const [x, y] of [[-0.07, 0.5], [0.07, 0.42], [0, 0.6]]) f.box(x, y, 2.0, 0.1, 0.05, 0.1, K.leafL);
  f.flatR(0.05, 2.0, 0.4, 0.4, 0.0052, K.soilL, 0.3);
}
/** Little seed tags along a bed (same anchor, turn and size as the bed): the sowing date's cards on sticks; `can`: a watering can at its foot (ch 19: what is mine to tend). */
function bedTags(g, f, it) {
  const W = it.w || 3, D = it.d || 1.2, H = 0.24, z = D / 2 - 0.11;
  for (let k = 0; k < 3; k++) {
    const x = -W / 2 + 0.5 + (k * (W - 1.0)) / 2;
    f.box(x, H + 0.12, z, 0.022, 0.24, 0.022, K.woodL);
    f.box(x, H + 0.22, z + 0.016, 0.1, 0.065, 0.012, k === 1 ? K.cream : K.white);
  }
  if (it.can) {
    const cx = W / 2 + 0.3, cz = D / 2 - 0.1;
    g.box(cx, 0.11, cz, 0.24, 0.22, 0.14, K.tinG);
    g.boxR(cx + 0.18, 0.2, cz, 0.2, 0.035, 0.035, K.tinGD, 0, 0, 0.7);
    g.box(cx - 0.02, 0.27, cz, 0.16, 0.04, 0.03, K.tinGD);
  }
}
/** The tea shop's west side (the item takes the shop's anchor): a lantern on a wall bracket and one hung from
 * the awning's west end (evening glows), the kettle's steam (one smoke point). */
function teaSide(g, f, it, ctx) {
  const W = it.w || 7, D = it.d || 4.6, FZ = D / 2, DX = it.doorX ?? -1.5;
  const lantern = (x, y, z) => {
    g.box(x, y + 0.16, z, 0.2, 0.05, 0.2, K.iron);
    g.box(x, y, z, 0.16, 0.24, 0.16, '#FFE7AE');
    for (const [dx, dz] of [[-0.075, -0.075], [0.075, 0.075]]) f.box(x + dx, y, z + dz, 0.025, 0.25, 0.025, K.iron);
    g.box(x, y - 0.14, z, 0.18, 0.04, 0.18, K.goldD);
    const [gx, gz] = wp(g, x, z); ctx.glows.push(gx, y, gz);
  };
  // on the west wall: a bracket out of the wall, the lantern under it
  const bx = -W / 2 - 0.36, bz = -0.4;
  g.box(-W / 2 - 0.2, 2.42, bz, 0.4, 0.05, 0.05, K.iron);
  f.box(bx, 2.32, bz, 0.02, 0.16, 0.02, K.iron);
  lantern(bx, 2.06, bz);
  // from the awning's west end
  const ax = -W / 2 + 0.55, az = FZ + 1.75;
  f.box(ax, 2.3, az, 0.02, 0.2, 0.02, K.iron);
  lantern(ax, 2.06, az);
  // the kettle's steam (the kettle is the shop's own, on its brazier left of the door)
  const [sx, sz] = wp(g, DX - 1.0, FZ + 0.6); ctx.smoke.push(sx, 1.0, sz);
}
/** A tethered goat in a back plot: body, legs, head with horns and beard, a stake and its rope lying slack. */
function goat(g, f, it) {
  const c = it.col || '#EFE6D6', d = shade(c, 0.8);
  g.box(0, 0.5, 0, 0.62, 0.3, 0.28, c);
  for (const [x, z] of [[-0.22, -0.09], [-0.22, 0.09], [0.22, -0.09], [0.22, 0.09]]) g.box(x, 0.18, z, 0.07, 0.36, 0.07, d);
  g.box(0.38, 0.68, 0, 0.18, 0.18, 0.18, c);
  g.box(0.5, 0.64, 0, 0.12, 0.1, 0.13, d);
  for (const sz of [-0.05, 0.05]) f.boxR(0.34, 0.8, sz, 0.03, 0.12, 0.03, '#8C7A5A', 0, 0, 0.5);
  f.box(0.5, 0.55, 0, 0.04, 0.08, 0.04, d); // the beard
  f.box(-0.33, 0.6, 0, 0.06, 0.1, 0.05, d); // the tail
  g.box(-1.1, 0.12, 0.35, 0.06, 0.24, 0.06, K.woodD); // the stake
  f.flatR(-0.55, 0.2, 1.1, 0.025, 0.0055, '#8C7A5A', -0.32); // the rope, slack on the grass
  f.flatR(-0.05, 0.06, 0.12, 0.3, 0.0055, '#8C7A5A', 0.4);
  f.flat(-0.4, -0.25, 0.65, 0.25, 0.0048, K.soilL); // the grass it has cropped
}
/** A straw hat someone dropped by the bench. */
function hat(g, f) {
  g.box(0, 0.025, 0, 0.44, 0.03, 0.44, K.straw, 0.4);
  g.box(0, 0.1, 0, 0.22, 0.12, 0.22, K.strawD, 0.4);
  f.box(0, 0.09, 0, 0.235, 0.035, 0.235, K.maroon, 0.4);
}
// ---------------------------------------------------------------------------------
// kinds (prefix gx). Kit kinds come from ../art/street-kit.js.
// ---------------------------------------------------------------------------------
export const DETAIL_PROP = {
  ...SK.kitProps('gx', ['pole', 'tankStand', 'puddle', 'leaves', 'perch', 'bikeLean']),
  gxBorder: { draw: border, obstacles: none },
  gxClayCorner: { draw: clayCorner, obstacles: obB(1.15, 0.9) },
  gxShards: { draw: shards, obstacles: none },
  gxWeighShelf: { draw: weighShelf, cut: true, obstacles: none },
  gxBees: { draw: bees, obstacles: none },
  gxCreeper: { draw: creeperTrellis, obstacles: (it) => [box(it.x - 0.06, it.z - 1.65, it.x + 0.06, it.z + 1.45), { type: 'circle', x: it.x + 0.1, z: it.z + 1.98, r: 0.08 }] },
  gxBedTags: { draw: bedTags, obstacles: (it) => (it.can ? obB(0.3, 0.2, (it.w || 3) / 2 + 0.3, (it.d || 1.2) / 2 - 0.1)(it) : []) },
  gxTeaSide: { draw: teaSide, cut: true, obstacles: none },
  gxGoat: { draw: goat, obstacles: obB(1.0, 0.4) },
  gxHat: { draw: hat, obstacles: none },
};

// ---------------------------------------------------------------------------------
// the pass
// ---------------------------------------------------------------------------------
// east-west walk lines (x0, x1, z): nothing taller than 1.3 m within 6 m south of them (the follow camera's side)
const EW = [[137, 261, 100], [184, 247.5, 119.4], [126, 159.8, 119], [142.2, 264.6, 57], [142.4, 264.6, 33], [186.4, 255, 80.4]];
const southOfWalk = (x, z) => EW.some(([a, b, wz]) => x > a - 1 && x < b + 1 && z > wz && z < wz + 6);

/**
 * Lay the details. ITEMS / add: garden.js's own; town: fillTown's return ({ put, putNear, clear }); gates: the
 * cottages' front gates ({ x, z, ry } in the yard fence). Returns { added, skipped } (for the tests).
 */
export function fillDetail({ ITEMS, add, town, gates = [] }) {
  const base = ITEMS.length, skipped = [];
  const find = (k, x, z, tol = 0.6) => ITEMS.find((it) => it.k === k && Math.abs(it.x - x) < tol && Math.abs(it.z - z) < tol);
  const put = (o, opt = {}) => {
    if (opt.tall && southOfWalk(o.x, o.z)) { skipped.push(`${o.k}@${o.x.toFixed(1)},${o.z.toFixed(1)} (south of a walk)`); return false; }
    const ok = opt.near ? town.putNear(o, opt) : town.put(o, opt);
    if (!ok) skipped.push(`${o.k}@${o.x.toFixed(1)},${o.z.toFixed(1)}`);
    return ok;
  };
  const at = (host, k, extra = {}) => add({ k, x: host.x, z: host.z, ry: host.ry || 0, w: host.w, d: host.d, doorX: host.doorX, ...extra });

  // G1 power poles: a short run behind the street allotments, a long one along the back alley behind the kiln
  // square and the plots; wires run to the next pole (local +x), birds on a few
  // (behind the street gardens; just behind the plots' back fence; north of the back alley, where the square's
  // back sheds leave room)
  for (const run of [{ z: 92.9, xs: [143.6, 153.9, 164.5] }, { z: 89.2, xs: [229.6, 241.0, 252.4] }, { z: 77.5, xs: [205.6, 216.6, 228.0] }]) {
    const okX = [];
    for (const x of run.xs) if (put({ k: 'gxPole', x, z: run.z, ry: 0, seed: Math.round(x) }, { way: 1.4, gap: 0.3, core: false })) okX.push(ITEMS[ITEMS.length - 1]);
    okX.forEach((p, i) => { const nx = okX[i + 1]; p.span = nx && nx.x - p.x < 14 ? nx.x - p.x : 0; p.tx = i % 4 === 1; p.birds = i % 3 === 0 ? 2 : i % 3 === 2 ? 1 : 0; });
  }

  // G2 flower rows: each border becomes the varied one (same place, same footprint: none)
  for (const it of ITEMS) if (it.k === 'gdBorder') it.k = 'gxBorder';

  // G3 the kiln square: clay dust and a pallet of fired pots at its west end, shards by the kiln shed
  put({ k: 'gxClayCorner', x: 190.6, z: 91.9, ry: 0.12 }, { way: 1.4, gap: 0.25, core: false, near: true });
  add({ k: 'gxShards', x: 211.6, z: 90.75, ry: 0.05 });

  // G4 the check-weight stone on the scale's awning post (the store's anchor). (G14: U Kyi Nyein's door already
  // has its three locks, and the days' lines count three: nothing added there.)
  const store = find('gdPaperStore', 200.6, 87.05);
  if (store) at(store, 'gxWeighShelf');

  // G5 bees at every hive stand
  for (const h of ITEMS.filter((it) => it.k === 'gdHives')) add({ k: 'gxBees', x: h.x, z: h.z, ry: h.ry || 0 });

  // G6 the creeper trellis inside plot 2, against U Hpo Htaw's east fence (x 245)
  put({ k: 'gxCreeper', x: 245.38, z: 94.9, ry: 0 }, { way: 1.4, gap: 0.05, core: false });

  // G7 dated tags in the street allotments and the two closed plots; a can; puddles in the plots' furrow
  let nTag = 0;
  for (const b of ITEMS.filter((it) => (it.k === 'gfBed' || it.k === 'gdBed') && it.z > 88 && it.z < 99 && it.x < 257 && !(it.x > 231 && it.x < 245.2))) {
    add({ k: 'gxBedTags', x: b.x, z: b.z, ry: b.ry || 0, w: b.w, d: b.d, can: nTag++ === 1 });
  }
  for (const [x, z, w] of [[247.7, 93.9, 1.4], [253.0, 93.92, 1.1]]) add({ k: 'gxPuddle', x, z, ry: 0.05, w, d: 0.55, seed: Math.round(x) });

  // G8 the corner tea shop: lanterns and the kettle's steam (the shop's anchor)
  const tea = find('gdTeaShop', 227.5, 94.0);
  if (tea) at(tea, 'gxTeaSide');

  // G9 the clasp road: a cat on a gate post (the east cottage), a dog asleep in a west yard, a goat behind it
  {
    const g = gates.filter((q) => q.x > 260 && q.z > 112 && q.z < 128)[0];
    if (g) { const c = Math.cos(g.ry), s = Math.sin(g.ry); add({ k: 'gxPerch', x: g.x + 0.65 * c, z: g.z - 0.65 * s, ry: g.ry + 0.3, kind: 'cat', y: 0.78, seed: 3 }); }
  }
  put({ k: 'gxPerch', x: 254.2, z: 114.6, ry: 2.6, kind: 'dog', seed: 5 }, { way: 1.4, gap: 0.2, near: true });
  put({ k: 'gxGoat', x: 245.8, z: 112.2, ry: 0.4, col: '#E8DDCB' }, { way: 1.4, gap: 0.3, near: true });

  // G10 the north road's verges: a bicycle at a field hut, water pots for whoever passes, hay
  for (const h of ITEMS.filter((it) => it.k === 'gdFieldHut').slice(0, 2)) put({ k: 'gxBikeLean', x: h.x + 0.8 * Math.cos(h.ry || 0) + 1.35 * Math.sin(h.ry || 0), z: h.z - 0.8 * Math.sin(h.ry || 0) + 1.35 * Math.cos(h.ry || 0), ry: h.ry || 0, seed: 7 }, { way: 1.4, gap: 0.1, near: true });
  put({ k: 'gdWaterPots', x: 143.9, z: 66.0, ry: -HP }, { way: 1.4, gap: 0.3, near: true });
  put({ k: 'gdHay', x: 145.6, z: 41.0, s: 0.9, seed: 3 }, { way: 1.6, gap: 0.3, near: true });
  put({ k: 'gdHay', x: 134.6, z: 50.6, s: 0.8, seed: 4 }, { way: 1.6, gap: 0.3, near: true });

  // G11 the back lots: two water tanks on stands, a compost bin and a barrow beside each
  for (const [x, z] of [[188.0, 65.6], [228.0, 66.0]]) {
    if (!put({ k: 'gxTankStand', x, z, ry: 0, seed: Math.round(x) }, { way: 1.6, gap: 0.4, near: true, tall: true })) continue;
    const t = ITEMS[ITEMS.length - 1];
    put({ k: 'gdCompost', x: t.x + 1.7, z: t.z + 0.2 }, { way: 1.2, gap: 0.2, near: true });
    put({ k: 'gdBarrow', x: t.x - 1.6, z: t.z + 0.6, ry: 0.6 }, { way: 1.2, gap: 0.2, near: true });
  }

  // G12 a small pressed flower in the grass behind the south cottages
  put({ k: 'gdPressed', x: 203.0, z: 116.8, col: K.rose, s: 0.55, seed: 121 }, { way: 1.4, gap: 0.3, near: true });

  // G13 pigeons on the lane bench by the pond, a straw hat dropped beside it
  const lb = find('gdLaneBench', 220.6, 102.2);
  if (lb) {
    add({ k: 'gxPerch', x: lb.x + 0.45, z: lb.z, ry: 0.4, kind: 'pigeons', y: 0.49, seed: 9 });
    put({ k: 'gxHat', x: lb.x - 1.35, z: lb.z + 0.75, ry: 0 }, { way: 1.0, gap: 0.05, near: true });
  }

  // fallen leaves under a few trees by the walks, a puddle or two on the verges
  for (const [k, x, z] of [['padauk', 186.4, 92.2], ['rain', 176.0, 90.6], ['padauk', 186.6, 118.0], ['rain', 158.0, 116.0], ['padauk', 266.0, 101.6]]) {
    const t = find(k, x, z);
    if (t) add({ k: 'gxLeaves', x: t.x + 0.6, z: t.z + 0.9, ry: 0.3, w: 2.2, d: 1.6, pal: k === 'rain' ? 'rain' : 'padauk', seed: Math.round(x + z) });
  }
  for (const [x, z, w] of [[175.6, 113.0, 1.3], [255.0, 121.0, 1.2], [143.4, 79.0, 1.4]]) put({ k: 'gxPuddle', x, z, ry: 0.3, w, d: 0.8, seed: Math.round(z) }, { way: 1.4, gap: 0.2, near: true });

  return { added: ITEMS.length - base, skipped };
}
