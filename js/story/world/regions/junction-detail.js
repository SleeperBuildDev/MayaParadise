// Newsprint Junction, the detail pass (art-plan 2026-11-16, section 8): small things that make the streets read
// lived-in, laid LAST (after the fill pass and the scatter) through the same clear-check every detail obeys:
// off the roads and the pencil paths, clear of the doors (and a corridor to their kerbs), the desks, the day
// scripts' places (KEEP) and the townsfolk's spots, never on another item, nothing tall within 6 m south of a
// street. Called once from the end of regions/junction.js: `detail({ ITEMS, add, ... })`.
// Everything merges into the chunk meshes (outlined solids or ground decals): no new draw call, no canvas, no
// material. Two lamp cores (ctx.glows) under the tea shop's awning; no new smoke. Nothing moves.
// Lessons, said without pointing anywhere: ch 12 (don't believe because it is printed or said: the wind-blown
// papers in the square, the cat asleep on today's paper), ch 13 (a slate that reads 6 to the one who wrote it and 9
// from the other side), ch 23 (Ko Min's new posters pasted over old ones: whose words were they?).
//
// PROP (prefix jd):
//   jdPole { span, birds, tx, seed, ry }   power pole + wires to local +X (ry points them at the next pole)
//   jdTank { seed }                        water tank on a stand (back lots)
//   jdPuddle { w, d, seed }  jdLeaves { w, d, n, pal, seed }  jdWear { len, d, seed }   (ground only)
//   jdSheet { lift, seed }  jdBlot { seed }   a newspaper sheet blown open; spilt ink   (ground only)
//   jdBales { seed }                       paper bales tied with twine, a newsprint roll on chocks
//   jdStallCat { stallSeed }               a cat asleep on the newspaper stall's first stack (same x, z as the stall)
//   jdTeaLamps { w, d }                    two tin lanterns under Daw Sein's awning (same x, z as the tea shop)
//   jdSlate                                a school slate on the yard ground, a chalk 6 (a 9 from the far side)
//   jdOldBills { len }                     old torn bills under the new ones on Ko Min's hoarding (same x, z)
//   jdSnag { side, seed }                  scraps caught on the fold's rope rail (same line as the rail)
//   jdBunting { a, b, cols }               cut-newspaper flags on a string (a, b local [x, y, z])
//   jdBenchBirds { n, seed }               pigeons on a bench's backrest (same x, z, ry as the bench)
//   jdBamboo { seed }                      bamboo poles stacked on two chocks
//   jdShirts { len, seed }                 the bridge hands' work shirts on a line (back lots)
import { rng, shade } from '../kit.js';
import { J, face } from '../art/junction.js';
import { pole, tankStand, puddle, leaves, kerbWear, scrap, cat, bird, bunting, makeClear, placer, unlined, Y } from './jh-kit.js';

const rb = (it, w, d, ox = 0, oz = 0) => {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const cx = it.x + ox * c + oz * s, cz = it.z - ox * s + oz * c;
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return [{ type: 'box', minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd }];
};
const circ = (r) => (it) => [{ type: 'circle', x: it.x, z: it.z, r }];
const none = () => [];
const W2 = (g, x, z) => [g.tx + x * g.tc + z * g.ts, g.tz - x * g.ts + z * g.tc];

function jdBales(g, f, it) {
  const u = unlined(g); // parts above the ground, without an ink line: in the solid, not the ground mesh
  const r = rng(it.seed || 3);
  f.flatR(0, 0, 1.7, 1.0, 0.0072, J.shadow);
  // three bales of fresh newsprint, tied with twine both ways; the top one a shade whiter
  for (const [x, y, z, ry] of [[-0.38, 0.2, 0, 0.04], [0.36, 0.2, 0.02, -0.05], [0, 0.6, 0.01, 0.12]]) {
    const col = y > 0.3 ? J.newsL : r() < 0.5 ? J.news : J.white;
    g.box(x, y, z, 0.68, 0.4, 0.5, col, ry);
    u.box(x, y + 0.205, z, 0.7, 0.012, 0.03, J.rope, ry);
    u.box(x, y + 0.205, z, 0.03, 0.012, 0.52, J.rope, ry);
    u.box(x, y, z + 0.252, 0.03, 0.4, 0.008, J.ropeD, ry);
  }
  // a roll of newsprint lying on two chocks, its end showing the wound paper
  g.box(0.1, 0.24, -0.62, 0.9, 0.36, 0.36, J.newsL);
  g.boxR(0.1, 0.24, -0.62, 0.9, 0.36, 0.36, J.news, Math.PI / 4, 0, 0);
  u.box(0.56, 0.24, -0.62, 0.02, 0.12, 0.12, J.woodGD);
  for (const sx of [-0.25, 0.45]) g.box(sx, 0.05, -0.62, 0.12, 0.1, 0.46, J.woodD);
  scrap(g, f, 'ball', 0.7, 0.4, 0, { seed: 5 });
}

function jdStallCat(g, f, it) {
  // the stall's first stack (local x -1.0): its height comes from the stall's own seed, the first draw of it
  const h = 0.08 + rng(it.stallSeed || 3)() * 0.12;
  cat(g, -1.0, 0.98 + h, 0.3, 0.2, { pose: 'sleep', coat: '#D98E48' });
}

function jdTeaLamps(g, f, it, ctx) {
  const u = unlined(g); // parts above the ground, without an ink line: in the solid, not the ground mesh
  const W = it.w || 8, fz = (it.d || 7) / 2;
  for (const sx of [-1, 1]) {
    const x = sx * (W / 2 - 0.55), z = fz + 0.92;
    // a paper lantern on a hook: red cap and foot, warm paper body with dark ribs, a tassel
    u.box(x, 2.8, z, 0.02, 0.12, 0.02, J.ink);
    u.box(x, 2.72, z, 0.16, 0.05, 0.16, J.red);
    g.box(x, 2.56, z, 0.24, 0.28, 0.24, '#F2C25A');
    for (const y of [2.47, 2.56, 2.65]) u.box(x, y, z, 0.25, 0.012, 0.25, J.redD);
    u.box(x, 2.4, z, 0.14, 0.04, 0.14, J.red);
    u.box(x, 2.33, z, 0.03, 0.1, 0.03, J.redL);
    const [wx, wz] = W2(g, x, z);
    ctx.glows.push(wx, 2.56, wz);
  }
}

function jdSlate(g, f, it) {
  // a pupil's slate left on the yard ground: wooden frame, dark slate, a blocky chalk 6 (drawn to be read from
  // the street side; from the swing's side the same strokes read 9)
  g.box(0, 0.015, 0, 0.62, 0.03, 0.46, J.woodL);
  g.box(0, 0.032, 0, 0.54, 0.006, 0.38, J.chalk);
  const S = 0.05, y = 0.037, c = '#F4EFE4';
  // the 6: a stem down the left, a loop at the bottom (cells of S, x right, z toward the street = down the page)
  for (const [x0, z0, x1, z1] of [[-2, -3, -1, 3], [-1, -3, 2, -2], [-1, 0, 2, 1], [1, 1, 2, 3], [-1, 2, 1, 3]]) f.flat(x0 * S, z0 * S, x1 * S, z1 * S, y, c);
  f.flatR(0.2, -0.1, 0.1, 0.02, y, c, 0.3); // a stub of chalk on the frame
  g.box(0.2, 0.05, 0.16, 0.08, 0.025, 0.025, J.white);
  f.flatR(0.05, 0.05, 0.9, 0.7, 0.0072, J.shadow);
}

function jdOldBills(g, f, it) {
  const u = unlined(g); // parts above the ground, without an ink line: in the solid, not the ground mesh
  // old bills, sun-faded and half torn away, under Ko Min's new ones (in the board's own face plane, just in
  // front of the boards and behind every new bill, so they show only where the new ones leave a gap)
  const L = it.len || 2.7, r = rng(it.seed || 23), z = 0.0635;
  for (const [x, y, w, h, col] of [[-L / 2 + 0.32, 0.42, 0.5, 0.58, '#E7DCC6'], [L / 2 - 0.3, 2.12, 0.46, 0.5, '#D9D2C0'], [-L / 2 + 0.28, 2.02, 0.42, 0.44, '#E5CFC0'], [0.15, 0.3, 0.6, 0.36, '#DED7C7']]) {
    face(u, x, y, z, w, h, col);
    // the torn edge: a ragged step of paper left behind, grey ghost lines of the old print
    for (let k = 0; k < 4; k++) face(u, x - w / 2 + (k + 0.5) * (w / 4), y - h / 2 - 0.03 - (k % 2) * 0.03, z, w / 4 - 0.01, 0.06, col);
    for (let k = 0; k < 3; k++) face(u, x, y + h / 2 - 0.1 - k * 0.1, z + 0.0004, w * (0.7 - r() * 0.2), 0.025, '#B9B0A0');
  }
}

function jdSnag(g, f, it) {
  // paper caught on the rope rail of the fold's lip (local X along the rail, rope at local z 0), and a torn
  // exercise-book corner on the paper at its foot (on the land side, it.side)
  const r = rng(it.seed || 5), side = it.side || 1;
  g.boxR(0.1, 0.47, 0.03 * side, 0.2, 0.24, 0.006, J.newsL, 0.12 * side, 0.2, (r() - 0.5) * 0.4);
  g.box(0.1, 0.52, 0.035 * side, 0.12, 0.02, 0.004, J.printD, 0.2);
  if (r() < 0.6) g.boxR(-0.5, 0.5, -0.02 * side, 0.14, 0.18, 0.006, '#FAF6EA', -0.1 * side, -0.3, 0.3);
  scrap(g, f, r() < 0.5 ? 'ruled' : 'sheet', 0.2, 0.45 * side, 0.6, { w: 0.4, d: 0.3, photo: false, seed: it.seed });
}

function jdBunting(g, f, it) { bunting(g, it.a, it.b, { cols: it.cols || [J.newsL, J.ink, J.red, J.news], line: J.ropeD, sag: 0.32 }); }

function jdBenchBirds(g, f, it) {
  const u = unlined(g); // parts above the ground, without an ink line: in the solid, not the ground mesh
  const r = rng(it.seed || 3), n = it.n || 2;
  for (let k = 0; k < n; k++) bird(g, -0.5 + k * 0.42 + r() * 0.15, 0.825, -0.24, (r() - 0.5) * 0.8 + (r() < 0.5 ? 0 : Math.PI), 'pigeon', u);
  for (let k = 0; k < 8; k++) f.flatR((r() - 0.5) * 1.4, 0.4 + r() * 0.4, 0.05, 0.05, Y.leaf, '#E2B33C'); // a little scattered grain
}

function jdBamboo(g, f, it) {
  const u = unlined(g); // parts above the ground, without an ink line: in the solid, not the ground mesh
  const r = rng(it.seed || 2);
  f.flatR(0, 0, 3.4, 0.9, 0.0072, J.shadow);
  for (const sx of [-1.0, 1.0]) g.box(sx, 0.07, 0, 0.16, 0.14, 0.7, J.woodD);
  for (let k = 0; k < 6; k++) {
    const z = -0.25 + (k % 4) * 0.16, y = 0.18 + (k > 3 ? 0.11 : 0), L = 2.9 + r() * 0.4;
    g.box((r() - 0.5) * 0.2, y, z + (k > 3 ? 0.08 : 0), L, 0.09, 0.09, r() < 0.5 ? '#C9B26A' : '#B8A05A');
    u.box(-L / 2 + 0.6 + r() * 0.3, y, z + (k > 3 ? 0.08 : 0), 0.04, 0.1, 0.1, '#9E8A48'); // a node
  }
}

function jdShirts(g, f, it) {
  const u = unlined(g); // parts above the ground, without an ink line: in the solid, not the ground mesh
  const L = it.len || 3.2, r = rng(it.seed || 7);
  for (const sx of [-1, 1]) { g.box(sx * L / 2, 0.95, 0, 0.09, 1.9, 0.09, J.woodD); g.box(sx * L / 2, 1.82, 0, 0.3, 0.06, 0.06, J.woodD); }
  g.box(0, 1.78, 0, L, 0.025, 0.025, J.ink);
  const cols = ['#5E7FA6', '#B7A27A', '#8E9A9E', '#6F8F6A', '#E6E1D5'];
  let x = -L / 2 + 0.45;
  for (let k = 0; x < L / 2 - 0.4; k++) {
    const c = cols[(k + Math.floor(r() * 3)) % cols.length];
    g.box(x, 1.47, 0, 0.42, 0.58, 0.03, c); // a work shirt: body, sleeves out, a darker collar
    for (const s of [-1, 1]) u.boxR(x + s * 0.27, 1.62, 0, 0.2, 0.12, 0.028, c, 0, 0, -s * 0.5);
    u.box(x, 1.74, 0.005, 0.16, 0.05, 0.03, shade(c, 0.8));
    x += 0.62;
  }
  f.flatR(0, 0, L, 0.6, 0.0072, J.shadow);
}

export const PROP = {
  jdPole: { draw: (g, f, it) => pole(g, f, it), obstacles: circ(0.2) },
  jdTank: { draw: (g, f, it) => tankStand(g, f, it), obstacles: (it) => rb(it, 1.15, 1.15) },
  jdPuddle: { draw: (g, f, it) => puddle(f, it), obstacles: none },
  jdLeaves: { draw: (g, f, it) => leaves(f, it), obstacles: none },
  jdWear: { draw: (g, f, it) => kerbWear(g, f, it), obstacles: none },
  jdSheet: { draw: (g, f, it) => scrap(g, f, 'sheet', 0, 0, 0, it), obstacles: none },
  jdBlot: { draw: (g, f, it) => scrap(g, f, 'blot', 0, 0, 0, it), obstacles: none },
  jdBales: { draw: jdBales, obstacles: (it) => rb(it, 1.6, 1.4, 0, -0.2) },
  jdStallCat: { draw: jdStallCat, obstacles: none },
  jdTeaLamps: { draw: jdTeaLamps, obstacles: none },
  jdSlate: { draw: jdSlate, obstacles: none },
  jdOldBills: { draw: jdOldBills, obstacles: none },
  jdSnag: { draw: jdSnag, obstacles: none },
  jdBunting: { draw: jdBunting, obstacles: none },
  jdBenchBirds: { draw: jdBenchBirds, obstacles: none },
  jdBamboo: { draw: jdBamboo, obstacles: (it) => rb(it, 3.2, 0.8) },
  jdShirts: { draw: jdShirts, obstacles: (it) => [{ type: 'circle', x: it.x - (it.len || 3.2) / 2 * Math.cos(it.ry || 0), z: it.z + (it.len || 3.2) / 2 * Math.sin(it.ry || 0), r: 0.15 }, { type: 'circle', x: it.x + (it.len || 3.2) / 2 * Math.cos(it.ry || 0), z: it.z - (it.len || 3.2) / 2 * Math.sin(it.ry || 0), r: 0.15 }] },
};

const HP = Math.PI / 2;
/** The pole runs: [x, z] in order; each pole's wires reach the next one. */
const RUNS = [
  { pts: [[152.2, 287.6], [152.2, 274.6], [152.2, 261.6]], seed: 10, tx: [1], birds: [2, 0] }, // the road north, east verge
  { pts: [[125.0, 326.2], [138.4, 326.2], [151.0, 326.2], [164.0, 326.2], [177.0, 326.2]], seed: 20, tx: [2], birds: [0, 3, 0, 2] }, // Ink Lane's back lots
];

/** detail({ ITEMS, add, PROP, ART, DOORS, DESKS, PEOPLE, KEEP, ROAD_NODES, ROAD_EDGES }) -> { placed, skipped } */
export function detail(T) {
  Object.assign(T.PROP, PROP);
  const check = makeClear({ ...T, KINDS: { ...T.PROP, ...T.ART }, LOW: ['jPatch', 'jPrint', 'jPaving'], SKIP: ['jFolk'] });
  const placed = [], skipped = [], put = placer(check, T.add, placed, skipped);
  // ---- J1 pole runs (tall: north of the streets and in back lots only)
  for (const run of RUNS) {
    run.pts.forEach(([x, z], k) => {
      const nx = run.pts[k + 1];
      const span = nx ? Math.hypot(nx[0] - x, nx[1] - z) : 0, ry = nx ? Math.atan2(-(nx[1] - z), nx[0] - x) : (k ? Math.atan2(-(z - run.pts[k - 1][1]), x - run.pts[k - 1][0]) : 0);
      put({ k: 'jdPole', x, z, ry, span, seed: run.seed + k, tx: run.tx.includes(k), birds: run.birds[k] || 0 }, 0.25, { tall: true });
    });
  }
  // ---- J2 the wind has the papers in the square (flat; clear of the well, its queue, the benches and the 6)
  for (const [x, z, ry, lift] of [[140.6, 305.4, 0.3, 1], [139.4, 311.6, -0.5, 0], [161.4, 303.6, 0.9, 0], [162.2, 307.8, -0.2, 1], [153.6, 311.2, 0.6, 0], [144.0, 311.0, 2.4, 0]]) put({ k: 'jdSheet', x, z, ry, lift: !!lift, w: 0.86, d: 0.6, seed: Math.round(x * 7 + z) }, 0.45, { flat: true, on: true });
  // ---- J3 the press: ink drips under the drums, paper bales and a roll on the press street's south side
  put({ k: 'jdBlot', x: 176.7, z: 304.3, ry: 0.4, seed: 3 }, 0.3, { flat: true, on: true });
  put({ k: 'jdBlot', x: 145.0, z: 289.3, ry: -0.8, seed: 9 }, 0.3, { flat: true, on: true });
  put({ k: 'jdBales', x: 173.4, z: 304.4, ry: 0.06, seed: 4 }, 0.5);
  // ---- J4 a cat asleep on today's papers at the newspaper stall (the stall's own x, z)
  T.add({ k: 'jdStallCat', x: 165.8, z: 296.6, ry: 0, stallSeed: 4 });
  // ---- J5 Daw Sein's awning: two tin lanterns, lit in the evening (the tea shop's own x, z)
  T.add({ k: 'jdTeaLamps', x: 139.6, z: 293.9, w: 8, d: 7 });
  // ---- J6 the school yard: a slate on the ground with a chalk 6
  put({ k: 'jdSlate', x: 156.0, z: 280.6, ry: 0.15 }, 0.45, { flat: true });
  // ---- J7 fallen leaves under the trees by the walks; worn paving at the squares' edges
  for (const it of T.ITEMS) {
    if ((it.k !== 'padauk' && it.k !== 'rain') || !LEAF_TREES.some(([x, z]) => Math.abs(x - it.x) < 0.2 && Math.abs(z - it.z) < 0.2)) continue;
    put({ k: 'jdLeaves', x: it.x + 0.6, z: it.z + 0.8, w: 2.6 * (it.s || 1), d: 1.8 * (it.s || 1), n: 12, pal: it.k, seed: Math.round(it.x * 5 + it.z) }, 0.6, { flat: true, on: true });
  }
  for (const [x, z, ry, len] of [[141.2, 314.0, 0, 3.2], [163.0, 305.4, HP, 2.2], [57.6, 307.6, 0, 3.0], [150.6, 312.6, 0, 2.4]]) put({ k: 'jdWear', x, z, ry, len, d: 0.8, seed: Math.round(x + z), seam: J.stoneDD }, 0.4, { flat: true, on: true });
  // ---- J8 Ink Lane's south gardens and the square: rain puddles, bamboo poles stacked
  for (const [x, z, w, d, seed] of [[148.6, 348.1, 1.8, 1.0, 1], [169.3, 344.5, 1.4, 0.8, 2], [161.6, 312.6, 1.2, 0.7, 3], [60.8, 323.9, 1.3, 0.8, 4], [128.6, 315.5, 1.5, 0.8, 5]]) put({ k: 'jdPuddle', x, z, w, d, seed, ry: (seed % 3) * 0.3 }, Math.max(w, d) / 2, { flat: true });
  put({ k: 'jdBamboo', x: 137.6, z: 357.4, ry: 0.05, seed: 2 }, 0.45, { half: 1.4 });
  // ---- J9 the west bank: the bridge hands' work shirts drying, a woodpile, a tank by the cottages
  put({ k: 'jdShirts', x: 70.2, z: 338.7, len: 3.2, seed: 7 }, 0.4, { tall: true, half: 1.6 });
  put({ k: 'woodpile', x: 47.2, z: 342.8 }, 0.8);
  put({ k: 'jdTank', x: 50.3, z: 319.6, seed: 5 }, 0.7, { tall: true });
  // ---- J10 pigeons on the backs of the lip benches (each bench's own x, z, ry)
  T.add({ k: 'jdBenchBirds', x: 76.2, z: 356.0, ry: HP, n: 2, seed: 4 });
  // ---- J11 old torn bills under Ko Min's new ones (the hoarding's own x, z)
  T.add({ k: 'jdOldBills', x: 128.85, z: 296.8, len: 2.7, seed: 23 });
  // ---- J12 scraps caught on the fold's rope rails (on the rail's own line; the scrap on the land side)
  for (const [x, z, side, seed] of [[119.3, 311.6, 1, 3], [119.3, 333.8, 1, 5], [78.7, 323.4, -1, 7], [78.7, 281.0, -1, 9]]) T.add({ k: 'jdSnag', x, z, ry: HP, side, seed });
  // ---- J13 cut-newspaper flags strung along Ink Lane's north footpath, lamp post to lamp post (east-west, so the
  // street camera sees the flags face on; under the row's balconies, in front of the cottage's porch posts)
  T.add({ k: 'jdBunting', x: 152.6, z: 335.9, a: [-6.12, 2.42, 0], b: [6.12, 2.42, 0] });
  // ---- J14 water tanks behind the north frontage
  put({ k: 'jdTank', x: 186.8, z: 279.6, seed: 8 }, 0.7, { tall: true });
  put({ k: 'jdTank', x: 128.8, z: 287.5, seed: 2 }, 0.7, { tall: true });
  return { placed, skipped };
}
/** trees whose fallen leaves show from the walks (the east road, the road north, the west lane) */
const LEAF_TREES = [[186.6, 316.0], [186.4, 330.0], [153.0, 263.2], [142.0, 266.8], [44.0, 318.4], [75.0, 320.0], [44.6, 337.0], [75.2, 346.6]];
