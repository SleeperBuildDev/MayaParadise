// The shared street kit (art plan 2026-11-16, section 2): small, cheap street details that every town can lay down
// through its own detail file. Pure draw functions draw(g, f, it, ctx) in the item's local space (fronts face +Z,
// feet at y = 0), merged into the chunk meshes like every other prop: g = the outlined solids, f = the flat ground
// mesh (decals and tiny boxes without an ink hull). No canvas, no material, no mesh of their own, nothing per frame.
// Imports only kit.js / toon.js / voxel.js. Original art (no copied look); nothing here points the way.
//
// Kinds are global: a town registers the ones it uses under its own prefix (SK.kitProps('qd') ->
// { qdPole: { draw, obstacles }, ... }) and spreads them into its PROP (a lazy town must register its own).
//
//   pole      { span = 12, seed, tx, birds }   power pole, crossarm, insulators; 2 sagging wires to local +x `span`
//                                              (the next pole), a transformer can when `tx`, 0-3 mynas on the wires
//   tankStand { seed }                         water tank on an angle-iron stand (3.4 m: back lots only)
//   puddle    { w, d, seed }                   monsoon puddle (f only: walked through)
//   leaves    { w, d, seed, pal }              fallen leaves under a tree: 'padauk' | 'rain' | 'pink' (f only)
//   kerbWear  { len, seed }                    slab seams, hairline cracks, a chipped corner, a weed (f only)
//   scrap     { kind, seed }                   book-world litter: 'ruled' | 'stamp' | 'blot' | 'ball' | 'shaving' | 'tally'
//   perch     { kind, y, seed }                a still animal: 'cat' | 'dog' | 'crow' | 'pigeons', sitting at height y
//   bunting   { len, y, cols }                 a string of small flags along local x
//   jarStand  { n }                            ye-oh: drinking-water jars for anyone, on a little roofed stand
//   bikeLean  { seed }                         a bicycle leaning on a wall just behind it (local -z)
//   sillBox(g, x, y, z, w, seed)               helper: a window flower box (inside a house draw, at its window)
//   stripeAwning(g, x, y, z, w, d, cols)       helper: a sloped striped awning with a scalloped edge
import { PALETTE } from '../../../game/toon.js';
import { jitter } from '../../../game/voxel.js';
import { shade, rng } from '../kit.js';

export const SKC = {
  pole: '#7E6A55', poleD: '#5E4E3F', concrete: '#B9B2A4', concreteD: '#8F887B', iron: '#4A3B30', wire: '#5E564E',
  insul: '#F2EBDD', can: '#8C9590', canD: '#6E7672', myna: '#5A4433', beak: '#E8B832', ink: PALETTE.ink,
  tankBlack: '#3A3836', tankBlue: '#3E6FA8', tankGrey: '#9DA3A3', red: '#C8323C', blue: '#2F5DB3', white: PALETTE.white,
  water: '#9FB4C2', waterD: '#86A0B2', rim: '#D9D2C2', glint: '#E6EEF2', cream: '#F6EEDB', rule: '#7FA6D6', margin: '#D9545E',
  terra: '#B5643C', terraL: '#CB7E4E', terraD: '#8E4A2C', wood: PALETTE.wood, woodD: PALETTE.woodDark, leaf: PALETTE.leaf,
  leafD: PALETTE.leafDark, mustard: '#E2B33C', shadow: '#E3D8BE', seam: '#CFC6B2', crack: '#B5AC98', chalk: '#F7F4EC',
};
const LEAVES = { padauk: ['#E8B832', '#D9A23A', '#F0C850', '#C98E2E'], rain: ['#8E9A4E', '#A08A52', '#7E8C48', '#B39A5E'], pink: ['#E58FB0', '#D36E98', '#F0A9C3', '#C95C8A'] };
const CATS = [['#D9A05B', '#B87B3A'], ['#3A3330', '#2A2522'], ['#9C9187', '#7A7067'], ['#F1E9DC', '#D9A05B']];
const DOGS = [['#C9A37A', '#A9835A'], ['#3A3330', '#5A504A'], ['#E6D7BE', '#B89E7A']];

// ---- keep-out helpers (world space, like build.js rotBox)
export function obBox(it, w, d, ox = 0, oz = 0) {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const cx = it.x + ox * c + oz * s, cz = it.z - ox * s + oz * c;
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return { type: 'box', minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd };
}
export function circ(it, r, ox = 0, oz = 0) {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  return { type: 'circle', x: it.x + ox * c + oz * s, z: it.z - ox * s + oz * c, r };
}

/** Draws tiny parts without their ink hull (Geo.bare, as build.js standUp does): an outline doubles a small box's
 * triangles and reads as nothing at that size. */
export function bare(g, fn) { g.bare = true; try { fn(); } finally { g.bare = false; } }

/** A sagging wire from (x0, y0, z) to (x1, y0, z) in local space: 3 thin straight pieces in f (no ink hull). */
function wire(f, x0, x1, y, z, sag, th = 0.018) {
  const L = x1 - x0, xs = [x0, x0 + L / 3, x0 + (2 * L) / 3, x1], ys = [y, y - sag * 0.89, y - sag * 0.89, y];
  for (let k = 0; k < 3; k++) {
    const dx = xs[k + 1] - xs[k], dy = ys[k + 1] - ys[k], len = Math.hypot(dx, dy);
    f.boxR((xs[k] + xs[k + 1]) / 2, (ys[k] + ys[k + 1]) / 2, z, len + 0.02, th, th, SKC.wire, 0, 0, Math.atan2(dy, dx));
  }
}
function myna(g, x, y, z, turn) {
  g.box(x, y + 0.07, z, 0.16, 0.11, 0.09, SKC.myna, turn);
  g.box(x + 0.07 * Math.cos(turn), y + 0.15, z - 0.07 * Math.sin(turn), 0.08, 0.08, 0.08, SKC.ink, turn);
  g.box(x + 0.12 * Math.cos(turn), y + 0.14, z - 0.12 * Math.sin(turn), 0.05, 0.025, 0.03, SKC.beak, turn);
}

/** Power pole: a two-tone post with a darker foot collar, a crossarm across the line (local z), 2 insulator nubs,
 * a tin transformer can when `tx`, and 2 sagging wires to the next pole `span` m along local +x. ~250 tris. */
export function pole(g, f, it) {
  const r = rng(it.seed || 3), H = 5.6, span = Math.min(14, it.span ?? 12), concrete = r() < 0.4;
  const c0 = concrete ? SKC.concrete : SKC.pole, c1 = concrete ? SKC.concreteD : SKC.poleD;
  g.box(0, H / 2, 0, 0.16, H, 0.16, jitter(c0, 0.05, it.seed || 3));
  g.box(0, H - 0.35, 0, 0.12, 0.1, 1.2, SKC.woodD); // crossarm (across the line)
  bare(g, () => {
    g.box(0, 0.25, 0, 0.22, 0.5, 0.22, c1); // foot collar
    for (const z of [-0.42, 0.42]) g.box(0, H - 0.22, z, 0.08, 0.14, 0.08, SKC.insul);
    if (it.tx) { g.box(0.24, H - 1.25, 0, 0.36, 0.6, 0.36, SKC.can); g.box(0.24, H - 0.93, 0, 0.4, 0.06, 0.4, SKC.canD); }
  });
  f.flatR(0.1, -0.06, 0.6, 0.45, 0.0052, SKC.shadow);
  if (span > 1) {
    // (two wires, thin and not quite black: three heavy ones read as bars across the screen near the lens)
    for (const z of [-0.42, 0.42]) wire(f, 0.04, span - 0.04, H - 0.14, z, z < 0 ? 0.34 : 0.3);
    const n = Math.min(3, it.birds | 0);
    for (let k = 0; k < n; k++) {
      // sit on the middle wire, near the low middle of the span
      const x = span * (0.38 + k * 0.1 + r() * 0.04);
      bare(g, () => myna(g, x, H - 0.14 - 0.34 * 0.89 + 0.012, -0.42, r() < 0.5 ? 0 : Math.PI));
    }
  }
}

/** A water tank (an octagonal drum: two crossed boxes) on a 2.2 m angle-iron stand with X-braces, a pipe down to a
 * tap and a bucket. 3.4 m tall: back lots only. ~380 tris. */
export function tankStand(g, f, it) {
  const r = rng(it.seed || 5), col = [SKC.tankBlack, SKC.tankBlue, SKC.tankGrey][Math.floor(r() * 3)], S = 2.2;
  for (const sx of [-0.55, 0.55]) for (const sz of [-0.55, 0.55]) g.box(sx, S / 2, sz, 0.07, S, 0.07, SKC.iron);
  g.boxR(0, S * 0.45, 0.55, 0.05, 1.55, 0.04, SKC.iron, 0, 0, 0.62); // one brace, on the side the camera sees
  g.box(0, S + 0.04, 0, 1.3, 0.08, 1.3, SKC.iron);
  g.box(0, S + 0.55, 0, 1.15, 0.95, 0.5, col);
  g.box(0, S + 0.55, 0, 0.5, 0.95, 1.15, shade(col, 0.92));
  bare(g, () => {
    g.box(0, S + 1.06, 0, 0.42, 0.08, 0.42, shade(col, 1.2)); // lid
    g.box(0.45, S * 0.5 + 0.1, 0.42, 0.05, S, 0.05, '#8F8A84'); // pipe down
    g.box(0.45, 0.42, 0.52, 0.12, 0.05, 0.14, '#8F8A84'); // tap
  });
  g.box(0.42, 0.13, 0.62, 0.26, 0.26, 0.26, r() < 0.5 ? SKC.red : SKC.blue); // bucket
  f.flatR(0.1, 0.1, 1.9, 1.6, 0.0052, SKC.shadow);
  f.flatR(0.4, 0.55, 0.6, 0.5, 0.0058, SKC.waterD);
}

/** A monsoon puddle: 3-4 overlapping flat patches, a paler rim and a sky glint. f only (walk-through). */
export function puddle(g, f, it) {
  const r = rng(it.seed || 7), w = it.w || 1.6, d = it.d || 1.0;
  f.flatR(0, 0, w + 0.18, d + 0.16, 0.0060, SKC.rim, 0);
  f.flatR(0, 0, w, d, 0.0064, SKC.water, 0);
  for (let k = 0; k < 2; k++) f.flatR((r() - 0.5) * w * 0.5, (r() - 0.5) * d * 0.4, w * (0.45 + r() * 0.2), d * (0.6 + r() * 0.3), 0.0066, k ? SKC.waterD : SKC.water, (r() - 0.5) * 0.6);
  f.flatR(-w * 0.12, -d * 0.12, w * 0.3, 0.05, 0.0070, SKC.glint, 0.1);
}

/** Fallen leaves under a tree (f only): 10-16 tiny flat leaves in the tree's own colours. */
export function leaves(g, f, it) {
  const r = rng(it.seed || 9), w = it.w || 2.4, d = it.d || 2.0, pal = LEAVES[it.pal] || LEAVES.padauk;
  const n = 10 + Math.floor(r() * 7);
  for (let k = 0; k < n; k++) {
    const a = r() * Math.PI * 2, rr = Math.sqrt(r());
    f.flatR(Math.cos(a) * rr * w / 2, Math.sin(a) * rr * d / 2, 0.14, 0.08, 0.0062 + (k % 3) * 0.0002, pal[k % pal.length], r() * 3);
  }
}

/** Pavement wear along local x (len m): slab seams every 0.9 m, 1-2 zigzag hairline cracks, a chipped kerb corner,
 * a weed tuft in a crack. f only. */
export function kerbWear(g, f, it) {
  const r = rng(it.seed || 11), L = it.len || 6;
  for (let x = -L / 2 + 0.45; x < L / 2; x += 0.9) f.flatR(x, 0, 0.03, 0.55, 0.0060, SKC.seam);
  for (let k = 0, n = 1 + Math.floor(r() * 2); k < n; k++) {
    let x = -L / 2 + 0.5 + r() * (L - 1), z = -0.2;
    for (let s = 0; s < 3; s++) { const a = (s % 2 ? 0.6 : -0.6) + (r() - 0.5) * 0.4; f.flatR(x + Math.sin(a) * 0.09, z + 0.09, 0.022, 0.2, 0.0062, SKC.crack, a); x += Math.sin(a) * 0.18; z += 0.17; }
    if (k === 0) { f.box(x, 0.05, z, 0.05, 0.1, 0.05, SKC.leaf); f.box(x + 0.05, 0.035, z + 0.02, 0.05, 0.07, 0.04, SKC.leafD); }
  }
  f.flatR(L / 2 - 0.25, 0.26, 0.24, 0.1, 0.0064, SKC.crack); // a chipped corner
}

/** Book-world litter. 'ruled' a torn exercise-book corner, 'stamp' a perforated postage stamp with a wavy postmark,
 * 'blot' an ink blot, 'ball' a crumpled paper ball, 'shaving' pencil-shaving curls, 'tally' chalk tally strokes. */
export function scrap(g, f, it) {
  const r = rng(it.seed || 13), k = it.kind || 'ruled', y = 0.0064;
  if (k === 'ruled') {
    f.flatR(0, 0, 0.42, 0.3, y, SKC.cream, 0.3);
    for (let i = 0; i < 3; i++) f.flatR(-0.03 * i, -0.08 + i * 0.08, 0.36, 0.014, y + 0.0002, SKC.rule, 0.3);
    f.flatR(-0.11, 0.02, 0.016, 0.27, y + 0.0003, SKC.margin, 0.3);
  } else if (k === 'stamp') {
    f.flatR(0, 0, 0.26, 0.32, y, SKC.white, 0.2);
    f.flatR(0, 0, 0.18, 0.24, y + 0.0002, [SKC.red, SKC.blue, '#4F8A4F', SKC.mustard][Math.floor(r() * 4)], 0.2);
    for (let i = 0; i < 3; i++) f.flatR(0.12, -0.08 + i * 0.08, 0.3, 0.014, y + 0.0004, SKC.ink, 0.2 + (i % 2 ? 0.12 : -0.12));
  } else if (k === 'blot') {
    for (let i = 0; i < 5; i++) f.flatR((r() - 0.5) * 0.26, (r() - 0.5) * 0.2, 0.16 + r() * 0.12, 0.14 + r() * 0.1, y + i * 0.0001, i % 2 ? '#2A3550' : '#1F2A44', r() * 2);
    for (let i = 0; i < 2; i++) f.flatR(0.28 + i * 0.1, (r() - 0.5) * 0.2, 0.05, 0.05, y, '#1F2A44', 0);
  } else if (k === 'ball') {
    for (let i = 0; i < 3; i++) f.boxR((r() - 0.5) * 0.06, 0.06 + i * 0.015, (r() - 0.5) * 0.06, 0.12, 0.1, 0.11, i === 1 ? SKC.white : SKC.cream, r(), r(), r());
  } else if (k === 'shaving') {
    for (let i = 0; i < 3; i++) {
      const x = (r() - 0.5) * 0.4, z = (r() - 0.5) * 0.3;
      f.boxR(x, 0.02, z, 0.16, 0.03, 0.05, '#EBCB9C', 0.4, r() * 3, 0.3);
      f.boxR(x + 0.05, 0.024, z, 0.05, 0.03, 0.05, '#C9A06A', 0.4, r() * 3, 0.3);
    }
    f.flatR(0.05, 0.02, 0.32, 0.22, y, '#A8A39A', 0.4); // graphite dust
  } else if (k === 'tally') {
    const n = 3 + Math.floor(r() * 4);
    for (let i = 0; i < Math.min(4, n); i++) f.flatR(-0.15 + i * 0.09, 0, 0.025, 0.3, y, SKC.chalk, 0.05);
    if (n > 4) f.flatR(-0.02, 0, 0.42, 0.025, y + 0.0002, SKC.chalk, -0.5);
  }
}

/** A still animal, sitting at height y (a wall top, a step's side cheek, a ridge): 'cat' (tabby, ginger, black or
 * calico; tail curled round), 'dog' (curled up asleep), 'crow', 'pigeons' (a pair). */
export function perch(g, f, it) {
  const r = rng(it.seed || 17), y = it.y || 0, k = it.kind || 'cat';
  if (k === 'cat') {
    const [a, b] = CATS[Math.floor(r() * CATS.length)];
    g.box(0, y + 0.12, 0, 0.2, 0.24, 0.3, a); // sitting body
    g.box(0, y + 0.31, 0.06, 0.17, 0.15, 0.15, a); // head
    for (const sx of [-0.05, 0.05]) g.box(sx, y + 0.41, 0.06, 0.04, 0.05, 0.03, b); // ears
    g.box(0.1, y + 0.03, -0.08, 0.06, 0.05, 0.24, b); // tail round the feet
    g.box(0, y + 0.29, 0.14, 0.09, 0.03, 0.01, SKC.ink); // closed eyes (dozing)
    if (y < 0.02) f.flatR(0, 0, 0.36, 0.42, 0.0054, SKC.shadow);
  } else if (k === 'dog') {
    const [a, b] = DOGS[Math.floor(r() * DOGS.length)];
    g.box(0, y + 0.12, 0, 0.6, 0.24, 0.34, a); // curled body
    g.box(0.3, y + 0.12, 0.12, 0.2, 0.18, 0.2, a); // head on the paws
    g.box(0.33, y + 0.08, 0.24, 0.1, 0.08, 0.08, b); // muzzle
    g.box(0.3, y + 0.2, 0.06, 0.06, 0.08, 0.1, b); // ear
    g.box(-0.25, y + 0.05, 0.16, 0.26, 0.07, 0.07, b); // tail round
    if (y < 0.02) f.flatR(0, 0.05, 0.86, 0.56, 0.0054, SKC.shadow);
  } else if (k === 'crow') {
    g.box(0, y + 0.1, 0, 0.13, 0.15, 0.24, '#2B2B30');
    g.box(0, y + 0.2, 0.12, 0.1, 0.1, 0.1, '#2B2B30');
    g.box(0, y + 0.19, 0.2, 0.04, 0.035, 0.08, '#4A4A50');
    g.boxR(0, y + 0.1, -0.16, 0.1, 0.03, 0.14, '#3A3A40', -0.4, 0, 0);
  } else {
    for (const [x, t] of [[-0.14, 0.3], [0.14, -0.4]]) {
      g.box(x, y + 0.08, 0, 0.14, 0.13, 0.2, '#9EA3AE', t);
      g.box(x + 0.06 * Math.sin(t), y + 0.17, 0.08 * Math.cos(t), 0.08, 0.08, 0.08, '#6F7682', t);
      g.box(x, y + 0.11, 0.01, 0.15, 0.03, 0.08, '#7FA39A', t); // the green-violet neck sheen
    }
  }
}

/** A string of small flags along local x at height y (between two existing posts or eaves). The string in f, each flag
 * two thin stacked boxes (a triangle-ish pennant), colours in turn. */
export function bunting(g, f, it) {
  const L = it.len || 6, y = it.y ?? 3.4, cols = it.cols || [SKC.red, SKC.cream, SKC.blue];
  wire(f, -L / 2, L / 2, y, 0, 0.22, 0.016);
  const n = Math.max(2, Math.floor(L / 0.5));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, x = -L / 2 + t * L, yy = y - 0.22 * 4 * t * (1 - t) - 0.03;
    const c = cols[i % cols.length];
    f.box(x, yy - 0.07, 0, 0.22, 0.12, 0.012, c);
    f.box(x, yy - 0.17, 0, 0.1, 0.09, 0.012, c);
  }
}

/** Ye-oh: 2-3 round clay drinking-water jars (crossed boxes, a rim and a lid each) on a little roofed wooden stand,
 * a coconut-shell dipper on a hook and a tin cup. Water for anyone who passes. ~22 boxes. */
export function jarStand(g, f, it) {
  const n = Math.min(3, it.n || 3), W = 0.62 * n + 0.2;
  for (const sx of [-W / 2, W / 2]) for (const sz of [-0.3, 0.3]) g.box(sx, 0.85, sz, 0.08, 1.7, 0.08, SKC.woodD);
  g.box(0, 0.55, 0, W + 0.1, 0.08, 0.7, SKC.wood); // the shelf
  g.boxR(0, 1.78, -0.02, W + 0.4, 0.07, 0.95, SKC.terraD, 0.18, 0, 0); // the little roof
  for (let i = 0; i < n; i++) {
    const x = -W / 2 + 0.41 + i * 0.62;
    g.box(x, 0.84, 0, 0.46, 0.5, 0.3, SKC.terra);
    g.box(x, 0.84, 0, 0.3, 0.5, 0.46, SKC.terraL);
    g.box(x, 1.12, 0, 0.36, 0.06, 0.36, SKC.woodD); // wooden lid
  }
  g.box(W / 2 + 0.06, 1.25, 0.18, 0.04, 0.04, 0.16, SKC.iron); // hook
  g.box(W / 2 + 0.08, 1.12, 0.26, 0.14, 0.1, 0.14, '#6B4A2E'); // coconut-shell dipper
  g.box(-W / 2 + 0.25, 0.63, 0.24, 0.1, 0.1, 0.1, '#B3B0A6'); // tin cup
  f.flatR(0, 0.1, W + 0.6, 1.1, 0.0052, SKC.shadow);
  f.flatR(0, 0.5, W * 0.6, 0.35, 0.0058, '#D8CDB4'); // the damp patch where it drips
}

/** A bicycle leaning on a wall just behind it (local -z): two wheels (rim crosses), frame, saddle, bars, a basket. */
export function bikeLean(g, f, it) {
  const r = rng(it.seed || 19), col = [SKC.red, SKC.blue, '#2F7C7A', SKC.ink, '#4F8A4F'][Math.floor(r() * 5)], lean = -0.12;
  for (const x of [-0.5, 0.5]) {
    g.boxR(x, 0.34, 0, 0.6, 0.05, 0.04, SKC.ink, lean, 0, 0);
    g.boxR(x, 0.34, 0, 0.05, 0.6, 0.04, SKC.ink, lean, 0, 0);
  }
  g.boxR(0, 0.52, -0.06, 0.9, 0.05, 0.05, col, lean, 0, 0); // top tube
  g.boxR(-0.18, 0.5, -0.06, 0.05, 0.36, 0.05, col, lean, 0, 0.35); // seat tube
  g.boxR(-0.22, 0.74, -0.09, 0.22, 0.05, 0.1, SKC.ink, lean, 0, 0); // saddle
  g.boxR(0.42, 0.82, -0.1, 0.05, 0.05, 0.42, '#8F8A84', lean, 0, 0); // bars
  if (r() < 0.6) g.boxR(0.58, 0.68, -0.08, 0.26, 0.18, 0.26, '#C9A86A', lean, 0, 0); // basket
  f.flatR(0, 0.08, 1.4, 0.4, 0.0052, SKC.shadow);
}

/** Helper for a house draw: a window flower box under a window at (x, y, z) (y = the sill), w wide. ~6 boxes. */
export function sillBox(g, x, y, z, w, seed = 1) {
  const r = rng(seed);
  g.box(x, y - 0.08, z + 0.12, w, 0.16, 0.2, SKC.terra);
  g.box(x, y + 0.03, z + 0.12, w - 0.06, 0.08, 0.16, SKC.leafD);
  const n = Math.max(3, Math.min(5, Math.round(w / 0.22)));
  for (let i = 0; i < n; i++) g.box(x - w / 2 + (w * (i + 0.5)) / n, y + 0.1, z + 0.13, 0.09, 0.08, 0.09, ['#E8A0A8', SKC.white, SKC.mustard, SKC.red, '#B9A3D6'][Math.floor(r() * 5)]);
}

/** Helper: a sloped striped awning (top edge at y, z; d deep toward +z), 0.25 m stripes and a scalloped front edge. */
export function stripeAwning(g, x, y, z, w, d, cols = [SKC.rule, SKC.white]) {
  const n = Math.max(2, Math.round(w / 0.25)), sw = w / n, ang = 0.32, cz = z + (d / 2) * Math.cos(ang), cy = y - (d / 2) * Math.sin(ang);
  for (let i = 0; i < n; i++) g.boxR(x - w / 2 + sw * (i + 0.5), cy, cz, sw + 0.004, 0.05, d, cols[i % cols.length], ang, 0, 0);
  const ey = y - d * Math.sin(ang) - 0.06, ez = z + d * Math.cos(ang) + 0.01;
  for (let i = 0; i < n; i++) g.box(x - w / 2 + sw * (i + 0.5), ey, ez, sw * 0.8, 0.1, 0.03, cols[i % cols.length]);
}

const DRAW = { pole, tankStand, puddle, leaves, kerbWear, scrap, perch, bunting, jarStand, bikeLean };
const NONE = () => [];
const OBST = {
  pole: (it) => [circ(it, 0.2)],
  tankStand: (it) => [obBox(it, 1.3, 1.3), circ(it, 0.18, 0.42, 0.62)],
  puddle: NONE, leaves: NONE, kerbWear: NONE, scrap: NONE, bunting: NONE,
  perch: (it) => ((it.y || 0) > 0.05 ? [] : [circ(it, it.kind === 'dog' ? 0.38 : 0.22)]),
  jarStand: (it) => [obBox(it, 0.62 * Math.min(3, it.n || 3) + 0.4, 0.8)],
  bikeLean: (it) => [obBox(it, 1.3, 0.35)],
};
/** A town's kit kinds under its own prefix: kitProps('qd') -> { qdPole: { draw, obstacles }, qdTankStand: ..., ... }. */
export function kitProps(prefix, kinds = Object.keys(DRAW)) {
  const out = {};
  for (const k of kinds) out[prefix + k[0].toUpperCase() + k.slice(1)] = { draw: DRAW[k], obstacles: OBST[k] };
  return out;
}
