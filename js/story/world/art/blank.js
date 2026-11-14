// Art for district 7, the Blank Page (regions/blank.js places it). Same kit as build.js: boxes written
// straight into the chunk's merged Geo (one toon mesh + one outline per chunk quarter), ground decals into
// the flat ground Geo. Maya's palette; the leaf itself stays almost white, so everything that stands on it
// is warm wood, clay and cloth, and the only big colour is the Home Book's maroon back cover in the north.
// No religious forms anywhere: the lodge is a plain wooden house.
//
//   lodge(g, f, it, ctx)       the travellers' lodge (10 x 4 m house, verandah, steps, shutters, side chimney)
//   lodgeYard(g, f, it)        its swept earth yard, stepping stones, pots, a whitewashed bed
//   lastHedge(g, f, it)        the Diary Garden's last hedge, in runs (it.len) with a gap for the path
//   backBoard(g, f, it)        the Home Book's back cover standing across the leaf's north edge, its door
//                              panel printed with the padauk endpaper, a brass keyhole at waist height
//   blankSign(g, f, it, ctx)   a small leaning post sign (canvas text, Burmese first; no arrows)
//   pencilStub(g, f, it)       a pencil worn down to a stub, lying where the pencil lines begin; shavings
//   sketch(g, f, it)           faint pencil underdrawing on the white (it.kind: 'house' | 'tree' | 'hatch')
//   prints(g, f, it)           faint pencil footprints along it.pts (world points): where people walked
//   restBench(g, f, it)        a plank bench with a cup and a cloth bundle, for whoever walks the path
//   dusk(g, f, it)             a very soft warm wash on the paper (the leaf sits under a low sunset)
import { shade, rng } from '../kit.js';
import { jitter } from '../../../game/voxel.js';

const W = {
  wood: '#B58A5A', woodD: '#7A5434', woodL: '#CDA577', w2: '#A57C50', w3: '#BC9363', w4: '#AD8457',
  soot: '#2B1E19', iron: '#4A3B30', gold: '#C9A24A', goldD: '#A47A2C', goldL: '#E7CC82', brass: '#D9B65A',
  maroon: '#6E1F2A', maroonD: '#4A141C', cream: '#EDE6D3', white: '#FFFDF8', ink: '#2A2118',
  leaf: '#6F9E5B', leafD: '#4F7F43', leafL: '#8DBA6E', rose: '#E8A0A8', mustard: '#E2B33C', blue: '#3E5C8A',
  terra: '#B5643C', terraL: '#CB7E4E', terraD: '#8E4A2C', stone: '#B9AE9A', stoneL: '#CFC6B4',
  lit: '#F6D493', litD: '#EDBE72', shutter: '#7D5A3E', shutter2: '#8A6448', plank: '#6E4E36',
  earth: '#EADBB9', earthD: '#DCC79F', earthL: '#F1E6CC', pencil: '#BEB9AE', pencilD: '#A39E92', faint: '#DCD7CB',
};
const SHINGLE = ['#8E5A3A', '#9C6844', '#83533A', '#A87450', '#93603F'];

/** World point of an item-local point (for ctx.glows / ctx.smoke, which are in world space). */
function wpush(arr, g, lx, ly, lz) { arr.push(g.tx + lx * g.tc + lz * g.ts, ly, g.tz - lx * g.ts + lz * g.tc); }

// =====================================================================================================
// The travellers' lodge (ခရီးသည် တည်းခိုဆောင်). Local: x along the front (-5..5), front wall at z 0.6, back
// at z -3.4, verandah to z 2.0, steps to z 2.6. Floor on short posts (0.45 m). Plain gable roof of wooden
// shingles (no tiers, no finial). One plank door mid-verandah, a lantern on a hook beside it, four
// shuttered windows lit warm, a clay-brick chimney at the WEST end (the hearth inside is on the left wall).
// =====================================================================================================
export const LODGE = { X: 5, ZF: 0.6, ZB: -3.4, FL: 0.45, VZ: 2.0, STEP: 2.62, DW: 1.0, DH: 2.05 };

export function lodge(g, f, it, ctx) {
  const r = rng(13);
  const { X, ZF, ZB, FL, VZ, DW, DH } = LODGE;
  const WT = 2.95; // wall top (front)
  const RZ = -1.4, RY = 4.35, EZF = 1.25, EZB = -3.9, EY = 2.92; // ridge z, ridge y, eaves
  const wd = [W.wood, W.w2, W.w3, W.w4];

  // its shadow on the paper, and the trodden ring round it
  f.flat(-X - 0.7, ZB - 0.5, X + 0.7, VZ + 0.2, 0.004, '#E2D9C6');
  f.flat(-X - 0.4, ZB - 0.25, X + 0.4, ZB + 0.2, 0.0045, '#D9CFBA');

  // ---- foundations: stone feet, short posts, the dark gap under the floor
  for (let x = -X + 0.2; x <= X - 0.1; x += 1.6) for (const z of [ZB + 0.15, ZF - 0.1, VZ - 0.12]) {
    g.box(x, 0.07, z, 0.3, 0.14, 0.3, jitter(W.stone, 0.07, x * 3 + z));
    g.box(x, 0.14 + (FL - 0.2) / 2, z, 0.16, FL - 0.2, 0.16, W.woodD);
  }
  g.boxMin(-X + 0.15, 0.1, ZB + 0.35, X - 0.15, FL - 0.1, ZF - 0.32, '#4E3828');
  g.boxMin(-X - 0.05, FL - 0.11, ZB - 0.05, X + 0.05, FL - 0.04, VZ, W.woodD); // floor beams

  // ---- verandah boards, nosing, steps
  for (let i = 0, z = ZF; z < VZ - 0.01; z += 0.2, i++) g.boxMin(-X - 0.05, FL - 0.04, z + 0.01, X + 0.05, FL, Math.min(z + 0.19, VZ), jitter(wd[i % 4], 0.05, i + 3));
  g.boxMin(-X - 0.08, FL - 0.13, VZ - 0.04, X + 0.08, FL + 0.01, VZ + 0.03, W.woodD);
  g.boxMin(-0.85, 0, VZ + 0.31, 0.85, 0.16, VZ + 0.62, jitter(W.w3, 0.04, 31));
  g.boxMin(-0.85, 0, VZ + 0.02, 0.85, 0.31, VZ + 0.31, jitter(W.w4, 0.04, 32));
  g.boxMin(-0.85, 0.155, VZ + 0.6, 0.85, 0.165, VZ + 0.63, W.woodD); // worn nosing
  for (const sx of [-1, 1]) g.boxMin(sx * 0.85 - 0.05, 0, VZ + 0.02, sx * 0.85 + 0.05, 0.36, VZ + 0.64, W.woodD); // stringers
  // slippers left on the steps and at their foot (shoes off before going in)
  const slip = [W.blue, W.maroon, W.mustard, '#4E8C86', W.rose, '#2F2A26'];
  [[-0.55, 0.33, VZ + 0.16, 0.12], [-0.2, 0.33, VZ + 0.14, -0.1], [0.35, 0.33, VZ + 0.18, 0.2], [0.6, 0.18, VZ + 0.46, -0.15], [-0.4, 0.18, VZ + 0.47, 0.05], [0.95, 0.02, VZ + 0.9, 0.4]].forEach(([x, y, z, ry], i) => {
    for (const s of [-0.065, 0.065]) {
      g.box(x + s, y, z, 0.1, 0.025, 0.25, slip[i % slip.length], ry);
      g.box(x + s, y + 0.025, z + 0.03, 0.08, 0.02, 0.02, shade(slip[i % slip.length], 0.7), ry);
    }
  });

  // ---- walls: weatherboards with a lap shadow, holes for the door and the windows
  const WIN = [-3.6, -2.0, 2.0, 3.6], WW = 0.86, WY0 = FL + 0.8, WY1 = FL + 1.6;
  const holes = [[-DW / 2 - 0.1, DW / 2 + 0.1, FL, FL + DH + 0.12], ...WIN.map((x) => [x - WW / 2 - 0.08, x + WW / 2 + 0.08, WY0 - 0.08, WY1 + 0.08])];
  for (let y = FL, i = 0; y < WT - 0.01; y += 0.22, i++) {
    const yt = Math.min(y + 0.22, WT);
    let segs = [[-X, X]];
    for (const [a, b, h0, h1] of holes) {
      if (yt <= h0 || y >= h1) continue;
      const nx = [];
      for (const [s0, s1] of segs) { if (b <= s0 || a >= s1) nx.push([s0, s1]); else { if (a > s0) nx.push([s0, a]); if (b < s1) nx.push([b, s1]); } }
      segs = nx;
    }
    for (const [a, b] of segs) {
      if (b - a < 0.03) continue;
      const c = jitter(wd[i % 4], 0.05, i * 3 + a);
      g.boxMin(a, y, ZF - 0.05, b, yt, ZF + 0.05, c);
      g.boxMin(a, y, ZF + 0.05, b, y + 0.03, ZF + 0.07, shade(c, 0.74));
    }
  }
  g.boxMin(-X, FL, ZB - 0.05, X, WT - 0.2, ZB + 0.05, W.w2); // back wall (the camera never sees it)
  for (const sx of [-1, 1]) {
    for (let y = FL, i = 0; y < WT - 0.01; y += 0.22, i++) {
      const c = jitter(wd[(i + 1) % 4], 0.05, i + sx * 7);
      g.boxMin(sx * X - 0.05, y, ZB, sx * X + 0.05, Math.min(y + 0.22, WT), ZF, c);
      g.boxMin(sx * X + sx * 0.05, y, ZB, sx * X + sx * 0.07, y + 0.03, ZF, shade(c, 0.74));
    }
    // the gable: stepped boards up under the roof line
    for (let y = WT, i = 0; y < RY - 0.1; y += 0.2, i++) {
      const k = (y + 0.2 - EY) / (RY - EY);
      const z0 = Math.max(ZB, EZB + k * (RZ - EZB) + 0.05), z1 = Math.min(ZF, EZF - k * (EZF - RZ) - 0.05);
      if (z1 - z0 > 0.05) g.boxMin(sx * X - 0.05, y, z0, sx * X + 0.05, y + 0.2, z1, jitter(wd[i % 4], 0.05, i * 5 + sx));
    }
    g.box(sx * (X + 0.06), 3.55, RZ, 0.04, 0.18, 0.3, W.soot); // gable vent
    for (const z of [ZB, ZF]) g.box(sx * X, (FL + WT) / 2, z, 0.17, WT - FL, 0.17, W.woodD); // corner posts
  }
  g.boxMin(-X - 0.06, WT - 0.07, ZF - 0.09, X + 0.06, WT + 0.05, ZF + 0.09, W.woodD); // wall plate

  // ---- the plank door (closed; lamplight shows at its edge), frame, lintel, latch
  g.boxMin(-DW / 2, FL, ZF - 0.07, DW / 2, FL + DH, ZF - 0.05, '#3A2A1E');
  g.boxMin(DW / 2 - 0.06, FL + 0.04, ZF - 0.05, DW / 2 - 0.01, FL + DH - 0.04, ZF - 0.03, W.lit);
  const pc = ['#8A6448', '#7D5A3E', '#946C4C'];
  for (let k = 0; k < 3; k++) g.boxMin(-DW / 2 + k * ((DW - 0.06) / 3) + 0.006, FL + 0.02, ZF - 0.05, -DW / 2 + (k + 1) * ((DW - 0.06) / 3) - 0.006, FL + DH - 0.01, ZF + 0.02, pc[k]);
  for (const y of [FL + 0.35, FL + DH - 0.42]) g.boxMin(-DW / 2 + 0.05, y, ZF + 0.02, DW / 2 - 0.1, y + 0.12, ZF + 0.05, W.plank);
  g.boxR(-0.03, FL + DH / 2 - 0.02, ZF + 0.035, 0.1, 1.4, 0.03, W.plank, 0, 0, 0.6);
  g.box(0.3, FL + 1.02, ZF + 0.07, 0.11, 0.11, 0.03, W.iron);
  g.box(0.3, FL + 0.94, ZF + 0.08, 0.035, 0.13, 0.02, W.iron);
  for (const sx of [-1, 1]) g.box(sx * (DW / 2 + 0.06), FL + DH / 2 + 0.06, ZF + 0.07, 0.12, DH + 0.12, 0.07, W.woodD);
  g.box(0, FL + DH + 0.14, ZF + 0.08, DW + 0.4, 0.13, 0.09, W.woodD);
  g.box(0, FL + 0.02, ZF + 0.06, DW + 0.12, 0.04, 0.14, '#5E4330');
  // the lantern on a hook beside the door
  const lx = DW / 2 + 0.36, lz = ZF + 0.3, ly = FL + 1.68;
  g.box(lx, FL + 2.02, ZF + 0.17, 0.04, 0.04, 0.32, W.iron);
  g.box(lx, FL + 1.95, lz, 0.02, 0.12, 0.02, W.iron);
  g.box(lx, ly + 0.17, lz, 0.22, 0.05, 0.22, W.iron);
  g.box(lx, ly + 0.21, lz, 0.1, 0.04, 0.1, W.iron);
  g.box(lx, ly, lz, 0.16, 0.26, 0.16, '#FFE7AE');
  for (const [dx, dz] of [[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]]) g.box(lx + dx, ly, lz + dz, 0.025, 0.28, 0.025, W.iron);
  g.box(lx, ly - 0.15, lz, 0.2, 0.04, 0.2, W.iron);
  wpush(ctx.glows, g, lx, ly, lz);

  // ---- windows: a warm lit room behind, mullions, sill, head, shutters swung open
  WIN.forEach((x, i) => {
    g.boxMin(x - WW / 2, WY0, ZF - 0.05, x + WW / 2, WY1, ZF - 0.03, i % 2 ? W.lit : W.litD);
    if (i === 0) g.box(x - 0.2, WY0 + 0.3, ZF - 0.02, 0.2, 0.42, 0.01, '#B8834E'); // a cloth hung inside
    if (i === 1) { g.box(x + 0.15, WY0 + 0.28, ZF - 0.02, 0.2, 0.22, 0.01, '#5A4636'); g.box(x + 0.15, WY0 + 0.44, ZF - 0.02, 0.16, 0.14, 0.01, '#5A4636'); } // someone's back
    if (i === 3) { g.box(x - 0.18, WY0 + 0.1, ZF + 0.12, 0.3, 0.17, 0.12, '#3C3A36'); g.box(x - 0.24, WY0 + 0.1, ZF + 0.185, 0.08, 0.08, 0.01, W.goldL); g.box(x - 0.1, WY0 + 0.24, ZF + 0.1, 0.02, 0.18, 0.02, W.iron); } // the radio on the sill
    g.box(x, (WY0 + WY1) / 2, ZF, 0.045, WY1 - WY0, 0.045, W.woodD);
    g.box(x, (WY0 + WY1) / 2 + 0.06, ZF, WW, 0.04, 0.045, W.woodD);
    for (const sx of [-1, 1]) g.box(x + sx * (WW / 2 + 0.035), (WY0 + WY1) / 2, ZF + 0.07, 0.07, WY1 - WY0 + 0.14, 0.06, W.woodD);
    g.box(x, WY0 - 0.05, ZF + 0.11, WW + 0.24, 0.06, 0.18, W.woodL);
    g.box(x, WY1 + 0.06, ZF + 0.09, WW + 0.24, 0.08, 0.12, W.woodD);
    if (i === 2) { g.box(x + 0.2, WY0 + 0.04, ZF + 0.13, 0.16, 0.14, 0.14, W.terra); g.box(x + 0.2, WY0 + 0.15, ZF + 0.13, 0.2, 0.1, 0.18, W.leaf); g.box(x + 0.23, WY0 + 0.22, ZF + 0.15, 0.06, 0.06, 0.06, W.rose); }
    const SW = WW / 2, a = 0.55;
    for (const sx of [-1, 1]) {
      const hx = x + sx * (WW / 2 + 0.08);
      const cx = hx + sx * Math.cos(a) * SW / 2, cz = ZF + 0.1 + Math.sin(a) * SW / 2, ry = -sx * a;
      const col = jitter(i % 2 ? W.shutter2 : W.shutter, 0.06, i * 4 + sx);
      g.box(cx, (WY0 + WY1) / 2, cz, SW, WY1 - WY0 + 0.1, 0.04, col, ry);
      for (const yy of [WY0 + 0.12, WY1 - 0.12]) g.box(cx + Math.sin(a) * 0.025 * sx, yy, cz + Math.cos(a) * 0.025, SW - 0.06, 0.06, 0.02, shade(col, 0.72), ry);
    }
  });
  // a small lit window in the east end wall
  g.boxMin(X + 0.04, WY0, -1.85, X + 0.07, WY1, -1.05, W.litD);
  for (const z of [-1.9, -1.0]) g.box(X + 0.08, (WY0 + WY1) / 2, z, 0.06, WY1 - WY0 + 0.1, 0.07, W.woodD);
  g.box(X + 0.1, WY0 - 0.04, -1.45, 0.14, 0.05, 1.0, W.woodL);
  g.box(X + 0.08, (WY0 + WY1) / 2, -1.45, 0.05, WY1 - WY0, 0.04, W.woodD);

  // ---- verandah rails (both ends and the short sides), posts by the steps
  for (const [a, b] of [[-X + 0.06, -2.85], [2.85, X - 0.06]]) {
    for (const x of [a, b]) { g.box(x, FL + 0.42, VZ - 0.1, 0.11, 0.84, 0.11, W.wood); g.box(x, FL + 0.87, VZ - 0.1, 0.15, 0.06, 0.15, W.woodD); }
    g.boxMin(a, FL + 0.68, VZ - 0.14, b, FL + 0.74, VZ - 0.06, W.woodL);
    g.boxMin(a, FL + 0.16, VZ - 0.13, b, FL + 0.2, VZ - 0.07, W.wood);
    for (let x = a + 0.22; x < b - 0.1; x += 0.22) g.box(x, FL + 0.44, VZ - 0.1, 0.045, 0.48, 0.045, jitter(W.woodL, 0.06, x * 7));
  }
  for (const sx of [-1, 1]) {
    g.boxMin(sx * X - 0.04, FL + 0.68, ZF + 0.1, sx * X + 0.04, FL + 0.74, VZ - 0.1, W.woodL);
    for (let z = ZF + 0.3; z < VZ - 0.15; z += 0.22) g.box(sx * X, FL + 0.44, z, 0.045, 0.48, 0.045, W.woodL);
    g.box(sx * 0.95, FL + 0.47, VZ - 0.1, 0.11, 0.94, 0.11, W.wood);
    g.box(sx * 0.95, FL + 0.97, VZ - 0.1, 0.15, 0.06, 0.15, W.woodD);
    g.box(sx * 0.95, FL + 1.04, VZ - 0.1, 0.07, 0.08, 0.07, W.gold);
  }

  // ---- on the verandah: Daw Pwint's bench and her basket of wicks, the travellers' bags, rolled mats, a
  // water pot with its cup, a broom, a tin of flowers on each rail post
  const bz = ZF + 0.14;
  g.boxMin(-3.05, FL + 0.34, bz, -1.15, FL + 0.4, bz + 0.34, W.woodL);
  for (const x of [-2.95, -1.25]) for (const z of [bz + 0.05, bz + 0.29]) g.boxMin(x - 0.035, FL, z - 0.035, x + 0.035, FL + 0.34, z + 0.035, W.woodD);
  for (const x of [-3.0, -2.1, -1.2]) g.boxMin(x - 0.03, FL + 0.4, bz, x + 0.03, FL + 0.92, bz + 0.05, W.woodD);
  g.boxMin(-3.07, FL + 0.84, bz - 0.02, -1.13, FL + 0.94, bz + 0.06, W.wood);
  g.boxMin(-3.05, FL + 0.6, bz, -1.15, FL + 0.65, bz + 0.05, W.wood);
  g.box(-2.45, FL + 0.47, bz + 0.17, 0.36, 0.14, 0.26, '#C9A66B');
  g.box(-2.45, FL + 0.55, bz + 0.17, 0.3, 0.03, 0.2, '#AE8A52');
  for (let k = 0; k < 5; k++) g.box(-2.58 + k * 0.065, FL + 0.58, bz + 0.17, 0.02, 0.02, 0.24, W.white);
  g.box(-1.6, FL + 0.46, bz + 0.18, 0.14, 0.1, 0.14, W.brass);
  g.box(-1.55, FL + 0.53, bz + 0.18, 0.08, 0.05, 0.03, W.brass);
  // three travellers' bags against the wall right of the door
  [[1.25, W.maroon, 0.42], [1.7, W.blue, 0.34], [2.62, '#5E8E4E', 0.48]].forEach(([x, c, h], k) => {
    g.box(x, FL + h / 2, ZF + 0.22, 0.38, h, 0.26, c);
    g.box(x, FL + h + 0.03, ZF + 0.22, 0.4, 0.07, 0.28, shade(c, 0.8));
    g.box(x, FL + h * 0.42, ZF + 0.37, 0.24, h * 0.36, 0.05, shade(c, 1.12));
    for (const s of [-0.1, 0.1]) g.box(x + s, FL + h * 0.55, ZF + 0.09, 0.05, h * 0.8, 0.02, W.ink);
    if (k === 2) { g.box(x, FL + h + 0.15, ZF + 0.22, 0.56, 0.16, 0.16, '#D9C08A'); g.box(x, FL + h + 0.15, ZF + 0.22, 0.04, 0.17, 0.17, W.maroon); } // a mat rolled on top
  });
  for (let k = 0; k < 3; k++) g.boxR(4.35 + k * 0.17, FL + 0.6, ZF + 0.16, 0.15, 1.2, 0.15, ['#D9C08A', '#CDB27A', '#E2CC98'][k], 0, 0, -0.08 - k * 0.02);
  g.box(4.6, FL + 0.03, 1.45, 0.5, 0.06, 0.5, W.woodD); // the water pot on its stand
  g.box(4.6, FL + 0.32, 1.45, 0.46, 0.5, 0.46, W.terra);
  g.box(4.6, FL + 0.32, 1.45, 0.52, 0.32, 0.52, W.terraL, Math.PI / 4);
  g.box(4.6, FL + 0.6, 1.45, 0.3, 0.1, 0.3, W.terraD);
  g.box(4.6, FL + 0.67, 1.45, 0.36, 0.04, 0.36, W.wood);
  g.box(4.66, FL + 0.73, 1.5, 0.1, 0.08, 0.1, W.gold);
  g.boxR(-4.65, FL + 0.7, ZF + 0.2, 0.05, 1.3, 0.05, W.woodL, 0, 0, 0.12); // broom
  g.boxR(-4.73, FL + 0.18, ZF + 0.2, 0.26, 0.36, 0.1, '#C9AE6A', 0, 0, 0.12);
  for (const x of [-X + 0.06, X - 0.06]) { g.box(x, FL + 1.0, VZ - 0.1, 0.18, 0.16, 0.18, W.terra); g.box(x, FL + 1.12, VZ - 0.1, 0.22, 0.1, 0.22, W.leaf); g.box(x + 0.05, FL + 1.2, VZ - 0.08, 0.07, 0.07, 0.07, W.mustard); }

  // ---- the chimney at the west end: clay bricks, a hearth bulge low down, soot near the top
  const CX = -X - 0.4, CZ = -1.9;
  g.box(CX + 0.05, 0.62, CZ, 0.72, 1.24, 1.0, W.terraL);
  g.box(CX + 0.05, 1.27, CZ, 0.8, 0.08, 1.08, W.terraD);
  for (let y = 0, i = 0; y < RY + 0.55; y += 0.2, i++) g.box(CX, y + 0.1, CZ, 0.62, 0.2, 0.62, jitter(i % 2 ? W.terra : '#A85A36', 0.06, i));
  g.box(CX, RY + 0.66, CZ, 0.76, 0.1, 0.76, W.terraD);
  g.box(CX, RY + 0.72, CZ, 0.46, 0.04, 0.46, W.soot);
  g.box(CX, RY + 0.4, CZ + 0.315, 0.5, 0.36, 0.01, '#5A3A2A');
  wpush(ctx.smoke, g, CX, RY + 0.85, CZ);

  // ---- the roof: wooden shingles in courses, butt edges shadowed, a ridge cap, barge boards
  const aF = Math.atan2(RY - EY, EZF - RZ), LF = Math.hypot(RY - EY, EZF - RZ);
  const aB = Math.atan2(RY - EY, RZ - EZB), LB = Math.hypot(RY - EY, RZ - EZB);
  const RX = X + 0.45, cF = Math.cos(aF), sF = Math.sin(aF), cB = Math.cos(aB), sB = Math.sin(aB);
  const onF = (s, n) => [EZF - s * cF + n * sF, EY + s * sF + n * cF]; // [z, y]
  const onB = (s, n) => [EZB + s * cB - n * sB, EY + s * sB + n * cB];
  { const [z, y] = onF(LF / 2, 0); g.boxR(0, y, z, 2 * RX, 0.1, LF + 0.12, '#6E4430', aF, 0, 0); }
  { const [z, y] = onB(LB / 2, 0); g.boxR(0, y, z, 2 * RX, 0.1, LB + 0.12, '#6E4430', -aB, 0, 0); }
  const NR = 9, st = LF / NR;
  for (let k = 0; k < NR; k++) {
    const s = (k + 0.5) * st;
    let x = -RX + (k % 2 ? 0.0 : 0.3);
    if (k % 2 === 0) { const [z, y] = onF(s, 0.08); g.boxR(-RX + 0.15, y, z, 0.3, 0.06, st * 1.12, SHINGLE[k % 5], aF, 0, 0); }
    while (x < RX - 0.05) {
      const w = Math.min(0.55 + r() * 0.55, RX - x);
      const [z, y] = onF(s, 0.08);
      g.boxR(x + w / 2, y, z, w - 0.03, 0.06, st * 1.12, jitter(SHINGLE[Math.floor(r() * 5)], 0.05, x * 9 + k), aF, 0, 0);
      x += w;
    }
    const [zb, yb] = onF(s - st / 2 + 0.03, 0.12);
    g.boxR(0, yb, zb, 2 * RX, 0.03, 0.06, '#4E3020', aF, 0, 0); // the butt edge's shadow line
  }
  for (let k = 0; k < 4; k++) { const [z, y] = onB((k + 0.5) * (LB / 4), 0.08); g.boxR(0, y, z, 2 * RX, 0.06, LB / 4 + 0.05, SHINGLE[(k + 2) % 5], -aB, 0, 0); }
  g.box(0, RY + 0.08, RZ, 2 * RX + 0.12, 0.16, 0.42, '#5E3B26');
  g.box(0, RY + 0.18, RZ, 2 * RX + 0.16, 0.06, 0.22, '#4E3020');
  for (const sx of [-1, 1]) {
    { const [z, y] = onF(LF / 2, 0.02); g.boxR(sx * (RX + 0.02), y, z, 0.08, 0.2, LF + 0.16, W.woodD, aF, 0, 0); }
    { const [z, y] = onB(LB / 2, 0.02); g.boxR(sx * (RX + 0.02), y, z, 0.08, 0.2, LB + 0.16, W.woodD, -aB, 0, 0); }
  }
  g.box(0, EY - 0.08, EZF + 0.03, 2 * RX, 0.16, 0.07, W.woodD); // fascia along the front eave
  // a gourd vine climbing the west corner post and along the eave a little (lived in)
  for (let k = 0; k < 7; k++) g.box(-X - 0.1 + (k % 2) * 0.06, FL + 0.3 + k * 0.32, ZF + 0.12, 0.2, 0.18, 0.12, k % 3 ? W.leaf : W.leafD);
  for (let k = 0; k < 4; k++) g.box(-X + 0.25 + k * 0.4, EY - 0.22, EZF + 0.06, 0.32, 0.16, 0.1, k % 2 ? W.leafD : W.leaf);
  g.box(-X + 0.6, EY - 0.42, EZF + 0.08, 0.12, 0.2, 0.12, '#C9C38A'); // a little gourd hanging
}

/** The lodge's yard (anchor = yard centre, about 5 m in front of the lodge): swept earth, stepping stones to
 * the pencil path, a whitewashed bed of marigolds, pots by the steps, broom marks. Walkable. */
export function lodgeYard(g, f, it) {
  const r = rng(it.seed || 21);
  // the swept earth: overlapping soft patches, darker where feet go (in front of the steps)
  // (each patch a chamfered blob: three rects, so its corners are cut and it reads as trodden ground, not a mat)
  const blob = (x, z, w, d, c, ry, y) => { f.flatR(x, z, w, d * 0.62, y, c, ry); f.flatR(x, z, w * 0.82, d, y, c, ry); f.flatR(x, z, w * 0.94, d * 0.86, y, c, ry); };
  for (const [x, z, w, d, ry] of [[0, 0.1, 12.4, 5.0, 0], [-4.6, 0.5, 4.8, 5.4, 0.25], [4.6, 0.7, 5.0, 4.6, -0.3], [6.3, 1.6, 2.6, 2.0, -0.5]]) blob(x, z, w, d, '#F3EBDA', ry, 0.0028);
  for (const [x, z, w, d, ry] of [[0, -0.1, 10.6, 3.9, 0.02], [-4.1, 0.4, 3.9, 4.3, 0.2], [4.1, 0.6, 4.1, 3.6, -0.25]]) blob(x, z, w, d, W.earth, ry, 0.0034);
  for (const [x, z, w, d, ry] of [[0, -1.5, 2.8, 1.5, 0], [2.4, 0.1, 3.4, 1.0, -0.45], [-3.4, 1.4, 2.2, 1.2, 0.3]]) blob(x, z, w, d, W.earthD, ry, 0.0038);
  // broom marks: fans of fine strokes
  for (let k = 0; k < 7; k++) {
    const cx = -4.5 + k * 1.5 + (r() - 0.5) * 0.4, cz = -0.3 + (r() - 0.5) * 2.2;
    for (let j = 0; j < 5; j++) f.flatR(cx + (j - 2) * 0.12, cz + Math.abs(j - 2) * 0.05, 0.03, 0.55, 0.004, W.earthD, 0.9 + (j - 2) * 0.18);
  }
  // stepping stones from the steps toward the pencil path (north-east corner of the yard)
  [[0.15, -1.95], [0.6, -1.15], [1.3, -0.45], [2.15, 0.1], [3.05, 0.55], [3.95, 0.9]].forEach(([x, z], k) => {
    g.box(x, 0.03, z, 0.62 + r() * 0.12, 0.06, 0.46 + r() * 0.1, jitter(W.stoneL, 0.06, k), r() * 0.6);
  });
  // a whitewashed ring of stones round a bed of marigolds, west of the steps
  const bx = -2.6, bz = -1.2;
  f.flatR(bx, bz, 2.0, 1.1, 0.004, '#B9946A', 0);
  for (let a = 0; a < Math.PI * 2 - 0.01; a += Math.PI / 7) g.box(bx + Math.cos(a) * 1.05, 0.06, bz + Math.sin(a) * 0.6, 0.2, 0.12, 0.16, W.white, -a);
  for (let k = 0; k < 9; k++) {
    const x = bx - 0.7 + (k % 5) * 0.35, z = bz - 0.22 + Math.floor(k / 5) * 0.42;
    g.box(x, 0.12, z, 0.1, 0.22, 0.1, W.leafD);
    g.box(x, 0.27, z, 0.2, 0.14, 0.2, k % 3 ? '#E9862E' : W.mustard);
  }
  // pots either side of the steps' foot, a stool and a basin by the right one
  for (const [x, z, s] of [[-1.25, -2.0, 1], [1.25, -2.0, 0.85]]) {
    g.box(x, 0.18 * s, z, 0.38 * s, 0.36 * s, 0.38 * s, W.terra);
    g.box(x, 0.18 * s, z, 0.42 * s, 0.18 * s, 0.42 * s, W.terraL, Math.PI / 4);
    g.box(x, 0.4 * s, z, 0.46 * s, 0.14 * s, 0.46 * s, W.leaf);
    g.box(x + 0.05, 0.56 * s, z, 0.3 * s, 0.22 * s, 0.3 * s, W.leafL);
    g.box(x - 0.12, 0.6 * s, z + 0.1, 0.08, 0.08, 0.08, W.rose);
  }
  g.box(2.0, 0.12, -1.6, 0.6, 0.06, 0.6, '#9C9384'); // an enamel basin with a cloth over its rim
  g.box(2.0, 0.1, -1.6, 0.5, 0.12, 0.5, '#E8E4DA');
  g.box(1.82, 0.17, -1.6, 0.18, 0.02, 0.52, W.blue);
  g.box(2.75, 0.2, -1.4, 0.32, 0.04, 0.32, '#C8323C'); g.box(2.75, 0.09, -1.4, 0.24, 0.18, 0.24, shade('#C8323C', 0.8)); // a plastic stool
  // a few pebbles and leaves blown onto the yard
  for (let k = 0; k < 14; k++) f.flatR((r() - 0.5) * 10, (r() - 0.5) * 3.6, 0.07 + r() * 0.05, 0.05, 0.005, k % 3 ? '#B7AE9E' : '#C9A24A', r() * 3);
}

// =====================================================================================================
// The Diary Garden's last hedge, seen from the leaf (its north face): rounded mounds of clipped leaves,
// white blossoms, woody stems at the gap's cheeks. it.len metres, centred; it.capW / it.capE: a cheek of the
// gap at that end (bare stems, a few fallen leaves).
// =====================================================================================================
export function lastHedge(g, f, it) {
  const r = rng(Math.round(it.x * 7 + it.z));
  const L = it.len, D = 0.9;
  const tiers = [[0.92, 0.32, '#46703C'], [0.98, 0.38, W.leafD], [0.92, 0.26, '#5E8E4E'], [0.76, 0.17, W.leaf], [0.5, 0.1, '#7FAE62']];
  g.boxMin(-L / 2, 0, -D / 2 + 0.05, L / 2, 0.12, D / 2 - 0.05, '#3E6236');
  const n = Math.max(2, Math.round(L / 0.62));
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + 0.31 + (i * (L - 0.62)) / (n - 1) + (r() - 0.5) * 0.06, z = (i % 2 ? 0.05 : -0.05), hs = 0.88 + r() * 0.2;
    let y = 0.06;
    tiers.forEach(([w, h, c], k) => {
      const col = jitter(c, 0.06, i * 7 + k);
      g.box(x, y + (h * hs) / 2, z, w * 0.68, h * hs, w * 0.9, col, (k % 2) * 0.785 * 0.3);
      if (k < 3) g.box(x, y + (h * hs) / 2, z, w * 0.62, h * hs * 0.9, w * 0.62, col, Math.PI / 4);
      y += h * hs;
    });
    for (let k = 0; k < 4; k++) {
      const a = (r() - 0.5) * 2.4 + Math.PI, yy = 0.3 + r() * 0.8, rr = yy > 1.0 ? 0.32 : 0.46;
      g.box(x + Math.sin(a) * rr * 0.7, yy, z + Math.cos(a) * rr, 0.09, 0.05, 0.05, r() < 0.5 ? W.leafL : '#A5CC80', a);
    }
    if (r() < 0.7) { const a = Math.PI + (r() - 0.5) * 1.2; g.box(x + Math.sin(a) * 0.3, 0.55 + r() * 0.6, z + Math.cos(a) * 0.46, 0.06, 0.06, 0.03, r() < 0.8 ? W.white : W.rose, a); }
    if (r() < 0.3) g.box(x + (r() - 0.5) * 0.3, y + 0.07, z, 0.03, 0.15, 0.03, W.leafL);
  }
  for (const [cap, sx] of [[it.capW, -1], [it.capE, 1]]) {
    if (!cap) continue;
    for (let k = 0; k < 3; k++) g.boxR(sx * (L / 2 - 0.02), 0.24, -0.25 + k * 0.25, 0.035, 0.46, 0.035, '#6E5038', 0, 0, -sx * (0.15 + k * 0.08));
    for (let k = 0; k < 5; k++) f.flatR(sx * (L / 2 + 0.2 + r() * 0.5), -D / 2 - r() * 1.2, 0.1, 0.06, 0.005, k % 2 ? W.leafD : W.leaf, r() * 3);
  }
  f.flat(-L / 2 - 0.1, -D / 2 - 0.5, L / 2 + 0.1, D / 2, 0.004, '#E4E0D3');
}

// =====================================================================================================
// The Home Book's back cover, standing across the leaf's north edge (its face toward the leaf at local
// z +0.35): maroon leather with a gold-tooled double border, the gilt edges of the pages over its top, and
// a door where the road home ends: framed in gold, its panel printed with the padauk endpaper (cream, padauk
// sprigs in gold and green), a brass keyhole plate at waist height. Taller than Maya.
// =====================================================================================================
const M = '#7A2430', MD = '#5A1820', ML = '#8E3442', G = W.gold, GD = W.goldD, GL = W.goldL, PAGE = '#F1EAD8', PAGE2 = '#E6DCC3';
export const BACK_DOOR = { DW: 1.5, DH: 2.4, keyX: 0.48, keyY: 1.0 };
export function backBoard(g, f, it) {
  const Wd = it.w || 38, H = 3.6, T = 0.7, half = Wd / 2;
  const { DW, DH } = BACK_DOOR;
  for (const [x0, x1] of [[-half, -DW / 2 - 0.2], [DW / 2 + 0.2, half]]) g.boxMin(x0, 0, -T / 2, x1, H, T / 2, M);
  g.boxMin(-DW / 2 - 0.2, DH + 0.2, -T / 2, DW / 2 + 0.2, H, T / 2, M);
  // leather grain: faint darker and lighter patches on the face
  const r = rng(5);
  for (let k = 0; k < 26; k++) {
    const x = -half + 1 + r() * (Wd - 2);
    if (Math.abs(x) < DW / 2 + 1.0) continue;
    g.boxMin(x, 0.5 + r() * 2.2, T / 2, x + 0.6 + r() * 1.4, 0.5 + r() * 2.2 + 0.3 + r() * 0.5, T / 2 + 0.008, r() < 0.5 ? ML : '#702029');
  }
  // the page block peeking over the top (gilt edges in layers), and the cover's lip over it
  for (const [y0, y1, c] of [[H, H + 0.12, GL], [H + 0.12, H + 0.22, G], [H + 0.22, H + 0.32, GL]]) g.boxMin(-half + 0.4, y0, -T / 2 - 0.6, half - 0.4, y1, T / 2 - 0.2, c);
  g.boxMin(-half - 0.15, H + 0.32, -T / 2 - 0.8, half + 0.15, H + 0.46, T / 2 + 0.06, MD);
  g.boxMin(-half - 0.05, 0, T / 2 - 0.02, half + 0.05, 0.22, T / 2 + 0.08, MD);
  for (const sx of [-1, 1]) {
    g.boxMin(sx > 0 ? half - 0.9 : -half - 0.06, H - 0.9, T / 2, sx > 0 ? half + 0.06 : -half + 0.9, H + 0.32, T / 2 + 0.06, G);
    g.boxMin(sx > 0 ? half - 0.9 : -half - 0.06, 0.22, T / 2, sx > 0 ? half + 0.06 : -half + 0.9, 0.8, T / 2 + 0.06, G);
  }
  const fz = T / 2 + 0.02;
  for (const [inset, th] of [[0.45, 0.07], [0.7, 0.04]]) {
    g.boxMin(-half + inset, H - inset - th, fz, half - inset, H - inset, fz + 0.03, GD);
    for (const [x0, x1] of [[-half + inset, -DW / 2 - 0.45], [DW / 2 + 0.45, half - inset]]) g.boxMin(x0, inset, fz, x1, inset + th, fz + 0.03, GD);
    for (const sx of [-1, 1]) g.boxMin(sx * (half - inset) - (sx > 0 ? th : 0), inset, fz, sx * (half - inset) + (sx < 0 ? th : 0), H - inset, fz + 0.03, GD);
  }
  for (let x = -half + 2.4; x < half - 2; x += 3.2) {
    if (Math.abs(x) < DW / 2 + 1.6) continue;
    g.boxR(x, H / 2 + 0.1, fz + 0.015, 0.34, 0.34, 0.03, G, 0, 0, Math.PI / 4);
    g.box(x, H / 2 + 0.1, fz + 0.03, 0.12, 0.12, 0.03, GL);
  }
  for (const sx of [-1, 1]) {
    const cx = sx * (DW / 2 + 1.25);
    for (let k = 0; k < 8; k++) g.boxR(cx, 2.0, fz + 0.015, 0.08, 0.7, 0.03, GD, 0, 0, (k * Math.PI) / 8);
    g.box(cx, 2.0, fz + 0.035, 0.26, 0.26, 0.03, GL);
  }
  // the door: gold frame; the panel is the endpaper (cream, padauk sprigs), a brass keyhole plate, a pull
  g.boxMin(-DW / 2 - 0.2, 0, -T / 2, -DW / 2, DH + 0.2, T / 2 + 0.05, GD);
  g.boxMin(DW / 2, 0, -T / 2, DW / 2 + 0.2, DH + 0.2, T / 2 + 0.05, GD);
  g.boxMin(-DW / 2 - 0.2, DH, -T / 2, DW / 2 + 0.2, DH + 0.2, T / 2 + 0.05, GD);
  g.boxMin(-DW / 2 - 0.12, DH + 0.06, T / 2 + 0.05, DW / 2 + 0.12, DH + 0.12, T / 2 + 0.07, GL);
  g.boxMin(-DW / 2, 0.02, -0.05, DW / 2, DH, 0.1, '#F1E6CF');
  g.boxMin(-DW / 2 + 0.06, 0.08, 0.1, DW / 2 - 0.06, DH - 0.06, 0.115, '#EADBBE');
  const sprig = (x, y, s, flip) => {
    g.boxR(x, y, 0.125, 0.025, 0.26 * s, 0.01, '#7A5A34', 0, 0, flip ? 0.5 : -0.5);
    for (const [dx, dy, c] of [[0.07, 0.06, '#7FA05A'], [-0.06, 0.02, '#6F9050'], [0.02, -0.07, '#7FA05A']]) g.boxR(x + dx * s * (flip ? -1 : 1), y + dy * s, 0.13, 0.08 * s, 0.045 * s, 0.01, c, 0, 0, flip ? -0.6 : 0.6);
    for (const [dx, dy] of [[-0.02, 0.12], [0.05, 0.14], [0.01, 0.18]]) g.box(x + dx * s * (flip ? -1 : 1), y + dy * s, 0.135, 0.05 * s, 0.05 * s, 0.01, '#E8B83A');
    g.box(x + 0.03 * s * (flip ? -1 : 1), y + 0.15 * s, 0.14, 0.02, 0.02, 0.01, W.maroon);
  };
  for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) {
    const x = -0.45 + i * 0.45 + (j % 2 ? 0.22 : 0), y = 0.35 + j * 0.42;
    if (x > DW / 2 - 0.15 || (Math.abs(x - BACK_DOOR.keyX) < 0.2 && Math.abs(y - BACK_DOOR.keyY) < 0.25)) continue;
    sprig(x, y, 0.9, (i + j) % 2);
  }
  g.boxMin(-DW / 2, DH * 0.62, 0.12, DW / 2, DH * 0.62 + 0.04, 0.14, GD);
  g.box(BACK_DOOR.keyX, BACK_DOOR.keyY, 0.15, 0.2, 0.32, 0.04, W.brass);
  g.box(BACK_DOOR.keyX, BACK_DOOR.keyY + 0.03, 0.175, 0.05, 0.1, 0.02, W.ink);
  g.box(BACK_DOOR.keyX, BACK_DOOR.keyY - 0.03, 0.175, 0.02, 0.06, 0.02, W.ink);
  g.box(-0.48, 1.05, 0.16, 0.08, 0.08, 0.08, W.brass);
  g.boxMin(-DW / 2 - 0.3, 0, T / 2, DW / 2 + 0.3, 0.12, T / 2 + 0.55, PAGE2);
  // its shadow on the white, and a few pale page corners lying at its foot like drifted leaves
  f.flat(-half - 0.4, T / 2, half + 0.4, T / 2 + 1.8, 0.004, '#EAE2D4');
  f.flat(-half - 0.2, T / 2, half + 0.2, T / 2 + 0.6, 0.0045, '#E1D7C5');
  for (const [x, z, ry] of [[-11.2, 1.3, 0.3], [-4.6, 1.0, -0.4], [8.4, 1.4, 0.2], [14.1, 1.1, -0.2], [-15.5, 1.6, 0.6]]) f.flatR(x, z, 0.9, 0.6, 0.006, PAGE, ry);
}
export const backBoardObstacles = (it) => [{ type: 'box', minX: it.x - (it.w || 38) / 2, maxX: it.x + (it.w || 38) / 2, minZ: it.z - 0.4, maxZ: it.z + 0.48 }];

// =====================================================================================================
// Small things
// =====================================================================================================
/** A small wooden board on one post, leaning a little; canvas text (it.lines). */
export function blankSign(g, f, it, ctx) {
  const h = it.h || 1.15, w = it.w || 1.3, bh = it.bh || 0.5;
  g.box(0, h / 2, -0.06, 0.1, h, 0.1, W.woodD);
  g.box(0, 0.05, -0.06, 0.24, 0.1, 0.24, W.stone);
  g.box(0, h - bh / 2 + 0.05, 0, w + 0.08, bh + 0.08, 0.06, W.woodD);
  g.box(0, h - bh / 2 + 0.05, 0.035, w, bh, 0.02, '#F3EAD6');
  if (it.vine) for (let k = 0; k < 4; k++) g.box(0.05 - (k % 2) * 0.1, 0.2 + k * 0.18, 0.0, 0.16, 0.12, 0.16, k % 2 ? W.leaf : W.leafD);
  ctx.signs.push({ x: 0, y: h - bh / 2 + 0.05, z: 0.05, w, h: bh, lines: it.lines, bg: '#F3EAD6', border: null, width: 512, height: Math.round(512 * bh / w) });
  f.flatR(0.15, -0.05, 0.6, 0.3, 0.004, '#E4DED0', 0);
}

/** A pencil worn to a stub, lying on the white where the two pencil lines begin; curls of shavings. */
export function pencilStub(g, f, it) {
  const L = 1.15;
  g.box(-0.1, 0.17, 0, L - 0.4, 0.3, 0.32, '#E8B832');
  g.box(-0.1, 0.33, 0, L - 0.4, 0.03, 0.18, '#F2CB55');
  for (const sz of [-1, 1]) g.box(-0.1, 0.2, sz * 0.155, L - 0.4, 0.06, 0.03, '#C99A22');
  g.box(L / 2 - 0.12, 0.17, 0, 0.32, 0.24, 0.26, '#EBD3A8');
  g.box(L / 2 + 0.1, 0.17, 0, 0.16, 0.12, 0.13, '#EBD3A8');
  g.box(L / 2 + 0.22, 0.17, 0, 0.1, 0.06, 0.06, W.ink);
  g.box(-L / 2 + 0.12, 0.17, 0, 0.12, 0.31, 0.33, '#4E4A44'); // the blunt end, sawn off and dark (an old stub)
  for (let k = 0; k < 6; k++) g.boxR(L / 2 + 0.45 + (k % 3) * 0.22, 0.03, -0.25 + k * 0.1, 0.16, 0.04, 0.1, k % 2 ? '#EBD3A8' : '#E8B832', 0, k * 0.7, 0.3);
  f.flat(-L / 2 - 0.15, -0.3, L / 2 + 0.3, 0.32, 0.004, '#E6E1D5');
  for (let k = 0; k < 9; k++) f.flatR(L / 2 + 0.6 + k * 0.08, 0.1 + Math.sin(k) * 0.2, 0.05, 0.05, 0.005, W.pencilD, k);
}

/** Faint pencil underdrawing on the white: the page is waiting to be written. Ground only (no outline). */
export function sketch(g, f, it) {
  const s = it.s || 1, y = 0.004, c = W.faint, c2 = '#E3DED3', t = 0.05;
  const line = (x0, z0, x1, z1, col = c, w = t) => f.flatR((x0 + x1) / 2, (z0 + z1) / 2, w, Math.hypot(x1 - x0, z1 - z0), y, col, Math.atan2(x1 - x0, z1 - z0));
  if (it.kind === 'house') {
    const Wd = 5 * s, D = 3.2 * s;
    line(-Wd / 2, 0, Wd / 2, 0); line(-Wd / 2, -D, Wd / 2, -D); line(-Wd / 2, 0, -Wd / 2, -D); line(Wd / 2, 0, Wd / 2, -D);
    line(-Wd / 2 - 0.4 * s, -D, 0, -D - 1.8 * s); line(0, -D - 1.8 * s, Wd / 2 + 0.4 * s, -D); // a roof drawn in plan, a child's way
    line(-0.4 * s, 0, -0.4 * s, -1.3 * s); line(0.4 * s, 0, 0.4 * s, -1.3 * s); line(-0.4 * s, -1.3 * s, 0.4 * s, -1.3 * s);
    line(-Wd / 2 - 1.2 * s, 0, -Wd / 2 + 0.6 * s, 0, c2, 0.03); line(Wd / 2 - 0.6 * s, -D, Wd / 2 + 1.4 * s, -D, c2, 0.03); // construction lines run past the corners
    line(-Wd / 2, 0.8 * s, -Wd / 2, -D - 0.6 * s, c2, 0.03);
  } else if (it.kind === 'tree') {
    const R = 1.6 * s;
    for (let k = 0; k < 14; k++) { const a0 = (k / 14) * Math.PI * 2, a1 = ((k + 1) / 14) * Math.PI * 2; line(Math.cos(a0) * R, Math.sin(a0) * R * 0.8, Math.cos(a1) * R * (k === 13 ? 0.9 : 1), Math.sin(a1) * R * 0.8); }
    line(-0.15 * s, R * 0.75, -0.12 * s, R * 2.0); line(0.15 * s, R * 0.75, 0.16 * s, R * 2.0);
  } else {
    for (let k = 0; k < 7; k++) line(k * 0.35 * s, 0, k * 0.35 * s + 0.9 * s, -1.1 * s, c2, 0.035);
  }
  if (it.crumbs) { const r = rng(it.crumbs); for (let k = 0; k < 8; k++) f.box((r() - 0.5) * 1.2 + 1.5 * s, 0.02, (r() - 0.5) * 0.8 + 0.6, 0.06, 0.04, 0.05, k % 3 ? '#E9C9C8' : '#D9B3B2'); }
}

/** Faint pencil footprints along it.pts (WORLD points; the item's own x, z is only its chunk anchor). it.walkers
 * tracks side by side (offsets in metres), it.fade (0..1) how old (paler). The pencil remembers where people walked. */
export function prints(g, f, it) {
  const pts = it.pts, offs = it.walkers || [0], step = it.step || 0.64;
  const r = rng(it.seed || 3);
  const cols = ['#DCD8CE', '#E2DED5', '#E8E5DD'];
  for (let w = 0; w < offs.length; w++) {
    let carry = r() * step, side = w % 2;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
      const L = Math.hypot(x1 - x0, z1 - z0), tx = (x1 - x0) / L, tz = (z1 - z0) / L, ang = Math.atan2(tx, tz);
      for (let s = carry; s < L; s += step) {
        side ^= 1;
        const o = offs[w] + (side ? 0.11 : -0.11) + (r() - 0.5) * 0.04;
        const px = x0 + tx * s - tz * o - it.x, pz = z0 + tz * s + tx * o - it.z;
        if (r() < (it.gaps || 0.08)) continue;
        const col = cols[Math.min(2, Math.floor((it.fade || 0) * 2 + r() * 1.4))];
        f.flatR(px + tx * 0.05, pz + tz * 0.05, 0.085, 0.13, 0.006, col, ang + (side ? 0.08 : -0.08));
        f.flatR(px - tx * 0.08, pz - tz * 0.08, 0.065, 0.065, 0.006, col, ang);
        carry = s + step - L;
      }
      if (carry < 0) carry = 0;
    }
  }
}

/** A plank bench by the path, a tin cup and a cloth bundle someone left on it. */
export function restBench(g, f) {
  g.box(0, 0.42, 0, 1.7, 0.07, 0.42, W.woodL);
  g.box(0, 0.38, 0.19, 1.7, 0.05, 0.05, W.woodD);
  for (const sx of [-0.68, 0.68]) { g.box(sx, 0.19, 0, 0.1, 0.38, 0.36, W.woodD); g.box(sx, 0.05, 0, 0.18, 0.1, 0.42, W.wood); }
  g.box(-0.45, 0.5, 0.02, 0.1, 0.1, 0.1, '#9CA3A8'); g.box(-0.39, 0.5, 0.02, 0.03, 0.06, 0.02, '#9CA3A8');
  g.box(0.35, 0.53, -0.02, 0.42, 0.16, 0.3, '#C8644A'); g.box(0.35, 0.62, -0.02, 0.12, 0.06, 0.32, shade('#C8644A', 0.8));
  f.flat(-1.0, -0.35, 1.0, 0.45, 0.004, '#E4DED0');
}

/** A soft warm wash on the white (low sunset): it.w x it.d, colour it.c, with a softer rim. Ground only. */
export function dusk(g, f, it) {
  const w = it.w || 20, d = it.d || 20;
  f.flat(-w / 2, -d / 2, w / 2, d / 2, 0.0012, it.c || '#FBF1E4');
}
