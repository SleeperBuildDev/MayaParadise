// The Envelope Market's fill pass: homes and yards where the low close camera still saw bare paper (the envelope
// road down from the Quarter, the letter's left margin, the gardens' south edge, the letter's lower third above the
// Wharf). Light cottages (few boxes, merged into the chunk meshes like market-art.js), their yards and the people
// at work in them. Called once from regions/market.js: fill({ ITEMS, add, folk }) after every other item is laid,
// so each thing here checks it is clear of what is already there (and of the lanes) before it goes down.
// Imports only kit.js / toon.js / voxel.js. Original art; every Burmese string is a draft for Maya.
//
// ART:
//   mkCot { w, d, seed, style: 'stilt' | 'lime' | 'shop', sign? }   a small home: 'stilt' a timber house up on posts,
//        woven-bamboo walls, tin gable roof, a front veranda and steps; 'lime' a lime-washed brick house with a
//        stepped tile roof, shutters and a stamp-shaped house plate; 'shop' the lime house with its front opened up
//        (shelves, a striped awning, a canvas board when `sign` is given: a trade name, never directions)
// PROP:
//   laneSign { name }   a lane-name board on two posts (its name only: no arrows, no "this way")
//   potPlants { n, seed }   a row of clay pots with herbs and flowers along a wall
//   bikeFix             the roadside bicycle mender's kit: a wheel on a stand, a pump, a tin of patches, a stool
//   loom                a back-strap weaver's frame under a little lean-to (Ink Lane's weaver)
import { PALETTE } from '../../../game/toon.js';
import { jitter } from '../../../game/voxel.js';
import { shade, rng } from '../kit.js';

const PI = Math.PI;
const K = {
  wood: PALETTE.wood, woodD: PALETTE.woodDark, woodL: '#CDA577', dark: '#3A2E25', stone: '#C4BBA8', stoneD: '#9F9683',
  bamboo: '#D8C27E', bambooD: '#B59A55', tin: '#B3B0A6', tinD: '#8C8981', rust: '#A65A3A', white: PALETTE.white,
  cream: '#F6EEDB', glass: '#BFD3E0', shadow: '#E3D8BE', red: '#C8323C', blue: '#2F5DB3', teal: '#3E8C8A', green: '#4F8A4F',
  mustard: '#E2B33C', goldD: PALETTE.goldDeep, terra: '#B5643C', leaf: PALETTE.leaf, leafD: PALETTE.leafDark, pink: '#E8A0A8',
  kraft: '#D6B486', iron: '#4A3B30',
};
const LIME = ['#F4EBDA', '#EFE2C8', '#F1E6D2', '#EADCC2', '#F6EFE0'];
const TILE = ['#A0642E', '#8E3B2E', '#B07A3A', '#7E4A2E', '#6E1F2A'];
const TIN = [K.tin, '#A9A69C', K.rust, '#7E8C8C'];
const SHUT = [K.teal, K.red, K.blue, '#3A6B3C', K.woodD, K.mustard];
const STAMPC = [['#C8323C', '#9C2832'], ['#4F8A4F', '#3A6B3C'], ['#D9A93B', '#B08425'], ['#3F6FB5', '#2D5590'], ['#3E8C8A', '#2C6B6A']];

// ---------------------------------------------------------------------------------
// small builders
// ---------------------------------------------------------------------------------
function gable(g, W, D, y0, rise, color, over = 0.35) {
  const half = D / 2 + over, ang = Math.atan2(rise, D / 2), slope = half / Math.cos(ang);
  for (const sz of [-1, 1]) {
    g.boxR(0, y0 + rise / 2 + 0.06, (sz * half) / 2, W + over * 2, 0.12, slope, color, sz * ang, 0, 0);
    g.boxR(0, y0 + rise * 0.5 + 0.14, (sz * half) / 2, W + over * 2 + 0.02, 0.03, 0.08, shade(color, 0.8), sz * ang, 0, 0);
  }
  g.box(0, y0 + rise + 0.1, 0, W + over * 2 + 0.06, 0.12, 0.26, shade(color, 0.85));
}
function gableFill(g, W, D, y0, rise, color) {
  for (let i = 0; i < 3; i++) g.box(0, y0 + (rise * (i + 0.5)) / 3, 0, W - 0.04, rise / 3, D * (1 - (i + 0.5) / 3), color);
}
function hipRoof(g, W, D, y0, color) {
  const w0 = W + 0.5, d0 = D + 0.5;
  g.box(0, y0 + 0.05, 0, w0 + 0.08, 0.1, d0 + 0.08, K.woodD);
  for (let i = 0; i < 3; i++) {
    const k = i / 3, w = w0 - k * Math.min(W * 0.5, 2.6), d = d0 * (1 - k * 0.8), y = y0 + 0.1 + 0.3 * (i + 0.5);
    g.box(0, y, 0, w, 0.3, d, i % 2 ? color : shade(color, 0.9));
  }
  g.box(0, y0 + 0.1 + 0.9 + 0.06, 0, w0 - Math.min(W * 0.5, 2.6) + 0.1, 0.12, 0.24, K.goldD);
}
function window_(g, f, x, y, z, w, h, shut) {
  g.box(x, y, z, w + 0.12, h + 0.12, 0.07, K.white);
  f.box(x, y, z + 0.04, w, h, 0.02, K.glass);
  f.box(x, y + h * 0.15, z + 0.06, w * 0.9, h * 0.45, 0.01, K.cream);
  if (shut) for (const sx of [-1, 1]) g.box(x + sx * (w / 2 + 0.17), y, z + 0.04, 0.26, h, 0.05, shut);
}
/** a stamp-shaped house plate: white border, coloured field (the Market's house numbers are stamps) */
function plate(f, x, y, z, ci) {
  const [F, FD] = STAMPC[ci % STAMPC.length];
  f.box(x, y, z, 0.42, 0.5, 0.03, K.white);
  f.box(x, y, z + 0.02, 0.3, 0.38, 0.02, F);
  f.box(x, y - 0.1, z + 0.035, 0.22, 0.03, 0.01, FD);
}

// ---------------------------------------------------------------------------------
// ART: mkCot
// ---------------------------------------------------------------------------------
function mkCot(g, f, it, ctx) {
  const W = it.w || 5, D = it.d || 5, seed = it.seed || 1, r = rng(seed), style = it.style || 'lime';
  const shut = SHUT[seed % SHUT.length];
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.4, D / 2 + 0.9, 0.004, K.shadow);
  if (style === 'stilt') {
    // a timber house up on posts: woven-bamboo walls set back behind a veranda, a tin gable roof
    const Hs = 0.85, H = 2.3, VD = 1.1, roof = TIN[seed % TIN.length];
    for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) if (sx || sz > 0) g.box(sx * (W / 2 - 0.15), Hs / 2, sz * (D / 2 - 0.15), 0.18, Hs, 0.18, K.woodD);
    g.box(0, Hs + 0.06, 0, W + 0.1, 0.12, D + 0.1, K.wood); // the floor
    const wz = D / 2 - VD; // the wall line behind the veranda
    g.box(0, Hs + 0.12 + H / 2, (wz - D / 2) / 2, W - 0.1, H, wz + D / 2, jitter(K.bamboo, 0.05, seed));
    for (let k = 0; k < 3; k++) f.box(0, Hs + 0.55 + k * 0.7, wz + 0.01, W - 0.12, 0.05, 0.02, K.bambooD); // the weave's bands
    for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.08), Hs + 0.12 + H / 2, wz + 0.02, 0.14, H, 0.1, K.woodD);
    // a door and a window with its shutter propped open on a stick
    const dx = (r() < 0.5 ? -1 : 1) * W * 0.2;
    g.box(dx, Hs + 0.12 + 0.95, wz + 0.03, 0.9, 1.9, 0.05, K.dark);
    g.box(dx, Hs + 0.12 + 1.95, wz + 0.05, 1.1, 0.1, 0.08, K.woodD);
    g.box(-dx, Hs + 1.45, wz + 0.03, 0.9, 0.7, 0.05, K.dark);
    g.boxR(-dx, Hs + 1.86, wz + 0.25, 0.96, 0.05, 0.5, K.bambooD, -0.7, 0, 0);
    // the veranda: posts up to the eaves, a rail, steps down to the yard
    for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.15), Hs + 0.12 + H / 2, D / 2 - 0.12, 0.14, H, 0.14, K.woodD);
    for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.15 - (W / 2 - 1.1) / 2 - 0.1), Hs + 0.62, D / 2 - 0.1, W / 2 - 1.1, 0.08, 0.07, K.woodL);
    for (let k = 0; k < 3; k++) g.box(dx, Hs - 0.15 - k * 0.28, D / 2 + 0.2 + k * 0.28, 1.0, 0.07, 0.3, K.woodL);
    // a pot and a rolled mat on the veranda
    g.box(-dx + 0.2, Hs + 0.3, D / 2 - 0.55, 0.36, 0.36, 0.36, K.terra);
    f.box(dx - 0.9 * Math.sign(dx || 1), Hs + 0.2, D / 2 - 0.5, 0.9, 0.16, 0.16, '#C9B26A');
    gableFill(g, W - 0.1, D * 0.5, Hs + 0.12 + H, 0.9, jitter(K.bamboo, 0.05, seed + 3));
    gable(g, W, D, Hs + 0.12 + H, 1.05, roof);
    return;
  }
  // 'lime' and 'shop': one lime-washed storey on a stone plinth, a stepped tile roof
  const H = 2.75, wall = it.wall || LIME[seed % LIME.length], roof = TILE[(seed >> 1) % TILE.length];
  g.box(0, 0.09, 0, W + 0.2, 0.18, D + 0.2, K.stone);
  g.box(0, 0.18 + H / 2, 0, W, H, D, jitter(wall, 0.03, seed));
  g.box(0, 0.32, D / 2 + 0.02, W + 0.02, 0.28, 0.04, shade(wall, 0.86)); // the skirting
  const fz = D / 2 + 0.03;
  if (style === 'shop') {
    // the front opened up: dark inside, three shelves of goods, a striped awning, a bench for whoever waits
    const goods = ['#E2B33C', '#C8323C', '#2F5DB3', '#FFFDF8', '#4E8C86', '#F3B27A', '#D6B486', '#E8A0A8'];
    g.box(0, 1.32, fz, W - 0.8, 2.1, 0.04, K.dark);
    for (let k = 0; k < 3; k++) {
      f.box(0, 0.62 + k * 0.55, fz + 0.02, W - 1.0, 0.05, 0.22, K.woodL);
      for (let x = -W / 2 + 0.7; x < W / 2 - 0.6; x += 0.42) f.box(x, 0.76 + k * 0.55, fz + 0.03, 0.28, 0.24, 0.12, goods[Math.floor(r() * goods.length)]);
    }
    const n = Math.max(5, Math.round(W / 0.5));
    for (let i = 0; i < n; i++) g.boxR(-W / 2 + (W * (i + 0.5)) / n, 2.62, fz + 0.55, W / n + 0.002, 0.05, 1.2, i % 2 ? K.cream : SHUT[(seed + 2) % SHUT.length], 0.32, 0, 0);
    for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.1), 1.2, fz + 1.05, 0.08, 2.4, 0.08, K.woodD);
    g.box(W / 2 - 1.0, 0.22, fz + 0.5, 1.2, 0.08, 0.36, K.woodL); // the bench
    for (const sx of [-1, 1]) f.box(W / 2 - 1.0 + sx * 0.5, 0.1, fz + 0.5, 0.08, 0.2, 0.3, K.woodD);
    if (it.sign) ctx.signs.push({ x: 0, y: H + 0.05, z: fz + 0.06, w: Math.min(W - 0.6, 3.0), h: 0.55, lines: [{ text: it.sign.my, size: 48 }], bg: '#FFF8E8', border: '#6E1F2A', width: 448, height: 96 });
  } else {
    const dx = (r() - 0.5) * W * 0.3;
    g.box(dx, 1.12, fz, 1.0, 1.9, 0.05, K.dark);
    g.box(dx, 2.12, fz + 0.03, 1.2, 0.12, 0.08, K.woodD);
    for (const sx of [-1, 1]) g.box(dx + sx * 0.55, 1.12, fz + 0.03, 0.1, 1.9, 0.08, K.woodD);
    g.box(dx, 0.1, fz + 0.3, 1.4, 0.2, 0.5, K.stone); // the step
    for (const sx of [-1, 1]) { const x = dx + sx * Math.max(1.4, W * 0.3); if (Math.abs(x) < W / 2 - 0.6) window_(g, f, x, 1.5, fz, 0.8, 0.85, shut); }
    plate(f, dx + 0.8, 1.9, fz + 0.04, seed);
    // a small porch roof over the door
    g.boxR(dx, 2.42, fz + 0.4, 1.7, 0.07, 0.95, TILE[(seed + 3) % TILE.length], 0.28, 0, 0);
  }
  hipRoof(g, W, D, 0.18 + H, roof);
}

// ---------------------------------------------------------------------------------
// PROP
// ---------------------------------------------------------------------------------
function laneSign(g, f, it, ctx) {
  f.flat(-0.8, -0.3, 0.9, 0.4, 0.005, K.shadow);
  for (const sx of [-0.55, 0.55]) g.box(sx, 0.95, 0, 0.1, 1.9, 0.1, K.woodD);
  g.box(0, 1.6, 0, 1.4, 0.56, 0.07, '#6E1F2A');
  g.box(0, 1.6, 0.04, 1.32, 0.48, 0.02, K.cream);
  if (it.name) ctx.signs.push({ x: 0, y: 1.6, z: 0.06, w: 1.26, h: 0.44, lines: [{ text: it.name.my, size: 54 }, { text: it.name.en, size: 22, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: '#F7EFDD', border: null, width: 448, height: 156 });
  g.box(0.55, 0.13, 0.2, 0.24, 0.26, 0.24, K.terra); // marigolds at a post's foot
  f.box(0.55, 0.32, 0.2, 0.28, 0.14, 0.28, K.leaf);
  f.box(0.55, 0.42, 0.2, 0.14, 0.07, 0.14, K.mustard);
}
function potPlants(g, f, it) {
  const r = rng(it.seed || 3), n = it.n || 4, flw = [K.red, K.mustard, K.pink, '#FFFDF8', '#D86B2A'];
  for (let k = 0; k < n; k++) {
    const x = (k - (n - 1) / 2) * 0.5, h = 0.24 + r() * 0.12;
    g.box(x, h / 2, 0, 0.32, h, 0.32, k % 3 ? K.terra : shade(K.terra, 0.85));
    f.box(x, h + 0.14, 0, 0.36, 0.26, 0.36, r() < 0.5 ? K.leaf : K.leafD);
    if (r() < 0.7) f.box(x + 0.05, h + 0.3, 0.05, 0.14, 0.08, 0.14, flw[Math.floor(r() * flw.length)]);
  }
}
function bikeFix(g, f) {
  f.flat(-1.0, -0.6, 1.0, 0.6, 0.004, K.shadow);
  // a wheel up on its stand
  g.box(-0.5, 0.35, 0, 0.08, 0.7, 0.08, K.iron);
  for (let a = 0; a < 8; a++) { const t = (a / 8) * Math.PI * 2; f.box(-0.5 + Math.cos(t) * 0.34, 0.75 + Math.sin(t) * 0.34, 0, 0.06, 0.06, 0.04, '#2A2420'); }
  f.box(-0.5, 0.75, 0, 0.06, 0.6, 0.02, '#8C8981');
  f.box(-0.5, 0.75, 0, 0.6, 0.06, 0.02, '#8C8981');
  // the pump, a tin of patches, a basin of water, the mender's stool
  g.box(0.3, 0.35, 0.1, 0.07, 0.7, 0.07, K.red);
  g.box(0.3, 0.03, 0.1, 0.3, 0.05, 0.12, K.iron);
  g.box(0.62, 0.08, -0.15, 0.24, 0.16, 0.24, K.blue);
  g.box(0.1, 0.07, -0.3, 0.5, 0.14, 0.4, K.tin);
  f.box(0.1, 0.15, -0.3, 0.42, 0.02, 0.32, '#9CC3DE');
  g.box(0.75, 0.2, 0.3, 0.28, 0.05, 0.28, K.green);
  g.box(0.75, 0.09, 0.3, 0.2, 0.18, 0.2, shade(K.green, 0.8));
}
function loom(g, f) {
  f.flat(-1.3, -0.9, 1.3, 0.9, 0.004, K.shadow);
  for (const sx of [-1, 1]) g.box(sx * 1.1, 1.1, -0.6, 0.1, 2.2, 0.1, K.bambooD);
  g.boxR(0, 2.25, -0.15, 2.5, 0.06, 1.3, K.tin, 0.35, 0, 0);
  // the warp tied to the back post, the cloth on the weaver's lap (stripes)
  g.box(0, 0.9, -0.6, 1.0, 0.1, 0.1, K.woodD);
  for (let k = 0; k < 6; k++) f.boxR(0, 0.6, -0.15 + k * 0.001, 0.8, 0.02, 0.9, k % 2 ? K.red : K.cream, -0.3, 0, 0);
  g.box(0, 0.06, 0.4, 1.0, 0.12, 0.7, '#C9B26A'); // the mat she sits on
  g.box(0.9, 0.2, 0.4, 0.4, 0.4, 0.4, K.kraft); // a basket of thread
  for (const [x, c] of [[0.8, K.red], [0.95, K.blue], [1.0, K.mustard]]) f.box(x, 0.44, 0.35, 0.12, 0.1, 0.12, c);
}

function box(it, w, d, ox = 0, oz = 0) {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const cx = it.x + ox * c + oz * s, cz = it.z - ox * s + oz * c;
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return { type: 'box', minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd };
}

export const ART = {
  mkCot: {
    h: 4.6, map: true, draw: mkCot,
    // the house; for a stilt house the steps, for a shop the awning posts' bench corner
    obstacles: (it) => [box(it, it.w || 5, (it.d || 5) - 0.1, 0, -0.05), ...(it.style === 'shop' ? [box(it, 1.3, 0.4, (it.w || 5) / 2 - 1.0, (it.d || 5) / 2 + 0.5)] : [])],
  },
};
export const PROP = {
  laneSign: { draw: laneSign, obstacles: (it) => [box(it, 0.2, 0.2, -0.55, 0), box(it, 0.2, 0.2, 0.55, 0)] },
  potPlants: { draw: potPlants, obstacles: (it) => [box(it, (it.n || 4) * 0.5, 0.4)] },
  bikeFix: { draw: bikeFix, obstacles: (it) => [box(it, 1.8, 0.9)] },
  loom: { draw: loom, obstacles: (it) => [box(it, 2.4, 1.2, 0, -0.3)] },
};

// ---------------------------------------------------------------------------------
// The fill itself
// ---------------------------------------------------------------------------------
// lanes (centre lines) nothing may stand on: [x0, z0, x1, z1]; the envelope road is a polyline
const LANES = [
  [-58, 272, 37, 272], [-58, 300, 39, 300], [-30, 334, 37, 334], [-30, 358, 30, 358],
  [7, 258, 7, 378], [-30, 272, -30, 358], [-58, 272, -58, 300], [29, 300, 29, 334],
];
const ROAD = [[4, 160], [4, 180], [8.5, 200], [11, 215], [9, 232], [7, 250], [7, 258]];
for (let k = 0; k < ROAD.length - 1; k++) LANES.push([...ROAD[k], ...ROAD[k + 1]]);
const FLAT = new Set(['tufts', 'postmark', 'stamp', 'seal', 'signature', 'paving', 'hopscotch', 'drain', 'pageCrease', 'kiteUp']);
const TREE = new Set(['padauk', 'rain', 'palm']);
const OWN = { potPlants: (it) => [(it.n || 4) * 0.25, 0.2], bikeFix: () => [0.9, 0.45], loom: () => [1.2, 0.6], laneSign: () => [0.7, 0.15] };
/** an existing item's footprint as a rect [x0, z0, x1, z1] (null = flat, never in the way) */
function rectOf(it) {
  if (FLAT.has(it.k)) return null;
  let hw, hd;
  if (TREE.has(it.k)) hw = hd = 1.1 * (it.s || 1);
  else if (it.w && it.d) { hw = it.w / 2; hd = it.d / 2; }
  else if (it.len) { hw = it.len / 2; hd = 0.3; }
  else if (it.k === 'folk') hw = hd = 0.35;
  else if (OWN[it.k]) [hw, hd] = OWN[it.k](it);
  else hw = hd = 0.65;
  const c = Math.abs(Math.cos(it.ry || 0)), s = Math.abs(Math.sin(it.ry || 0));
  const ex = c * hw + s * hd, ez = s * hw + c * hd;
  return [it.x - ex, it.z - ez, it.x + ex, it.z + ez];
}
const rectGap = (a, b) => Math.max(a[0] - b[2], b[0] - a[2], a[1] - b[3], b[1] - a[3]); // < 0: they overlap
const ptRect = (x, z, r) => Math.hypot(Math.max(r[0] - x, 0, x - r[2]), Math.max(r[1] - z, 0, z - r[3]));
function laneDist(r) {
  let best = Infinity;
  for (const [x0, z0, x1, z1] of LANES) {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(L / 0.5));
    for (let i = 0; i <= n; i++) best = Math.min(best, ptRect(x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n, r));
  }
  return best;
}

/** Fill. `add`/`folk` are market.js's own (they push into ITEMS). Returns what was skipped (for the tests). */
export function fill({ ITEMS, add, folk }) {
  const skipped = [];
  const base = ITEMS.length;
  /** is a rect of half-size (hw, hd) at (x, z) clear of every item by `gap` and of every lane centre by `laneGap`? */
  const clear = (x, z, hw, hd, gap = 0.25, laneGap = 3.0) => {
    const me = [x - hw, z - hd, x + hw, z + hd];
    if (laneDist(me) < laneGap) { clear.why = 'lane'; return false; }
    for (let i = 0; i < ITEMS.length; i++) { const r = rectOf(ITEMS[i]); if (r && rectGap(me, r) < gap) { clear.why = `${ITEMS[i].k}@${ITEMS[i].x.toFixed(1)},${ITEMS[i].z.toFixed(1)}`; return false; } }
    return true;
  };
  const size = (o) => { const r = rectOf({ ...o, ry: o.ry || 0 }); return r ? [(r[2] - r[0]) / 2, (r[3] - r[1]) / 2] : [0.3, 0.3]; };
  /** put a thing down if it is clear */
  const put = (o, laneGap = 3.0, gap = 0.25) => {
    const [hw, hd] = size(o);
    if (clear(o.x, o.z, hw, hd, gap, laneGap)) { add(o); return true; }
    skipped.push(`${o.k}@${o.x.toFixed(1)},${o.z.toFixed(1)} (${clear.why})`); return false;
  };
  const person = (x, z, ry, pose, seed, extra) => { if (clear(x, z, 0.3, 0.3, 0.05, 2.4)) folk(x, z, ry, pose, seed, extra); else skipped.push(`folk@${x.toFixed(1)},${z.toFixed(1)} (${clear.why})`); };
  /** a home: the cottage (front at `front`, facing +Z), and its yard things listed as [k, dx, dz, extra]:
   *  dx from the house's centre line, dz from its FRONT line */
  const home = (x, front, w, d, seed, style, yard = [], extra = {}) => {
    const ok = put({ k: 'mkCot', x, z: front - d / 2, w, d, seed, style, ...extra }, 2.6, 0.4);
    if (!ok) return;
    for (const [k, dx, dz, more] of yard) {
      if (k === 'folk') { const { ry = 0, pose = 'stand', ...rest } = more || {}; person(x + dx, front + dz, ry, pose, seed * 13 + Math.round(dx * 7 + dz * 3), rest); continue; }
      put({ k, x: x + dx, z: front + dz, ...(more || {}) }, 2.4, 0.1);
    }
  };

  /** the envelope road's centre x at z (its polyline), and a home set `gap` m off its centre on one side */
  const roadX = (z) => { for (let k = 0; k < ROAD.length - 1; k++) { const [xa, za] = ROAD[k], [xb, zb] = ROAD[k + 1]; if (z <= zb) return xa + ((xb - xa) * (z - za)) / (zb - za); } return 7; };
  const byRoad = (side, front, w, d, seed, style, yard, extra, gap = 3.7) => home(roadX(front - d / 2) + side * (gap + w / 2), front, w, d, seed, style, yard, extra);

  // ---- the envelope road: a straggle of homes either side on the way down, close enough to the road that the
  // low camera has them at both edges of the frame (west side, then east side; the road's centre runs x 4 -> 11 -> 7)
  byRoad(-1, 174.0, 5.0, 5.0, 301, 'stilt', [['bananas', -3.4, -1.8, { seed: 31 }], ['laundry', -0.6, 2.1, { len: 3.0 }], ['folk', -1.0, 3.1, { ry: PI + 0.2, pose: 'stand', woman: true }], ['hens', -3.4, 1.4, { seed: 32 }]]);
  byRoad(-1, 206.0, 5.0, 5.0, 302, 'lime', [['potPlants', 0.2, 0.7, { n: 4, seed: 33 }], ['woodpile', -3.6, -1.4], ['bikes', -3.4, 0.8]]);
  byRoad(-1, 220.0, 5.0, 5.0, 303, 'stilt', [['jars', -3.4, -1.0], ['folk', -3.2, 0.7, { ry: 0.3, pose: 'sweep', woman: true }]]);
  byRoad(-1, 241.0, 5.0, 5.0, 305, 'shop', [['folk', 1.5, 0.55, { ry: 0, pose: 'sit', stool: false }], ['planters', -3.4, 0.6, { seed: 38 }]], { sign: { my: 'ကုန်စုံ' } });
  byRoad(1, 168.0, 5.0, 5.0, 308, 'lime', [['woodpile', 3.4, -1.0], ['garden', 0, 1.9, { w: 2.6, d: 1.5, seed: 42 }], ['folk', 0.4, 3.2, { ry: 0.2, pose: 'squat', woman: true, hat: 'sun' }]]);
  byRoad(1, 184.0, 5.0, 5.0, 309, 'stilt', [['laundry', 0.4, 2.1, { len: 3.0 }], ['jars', 3.4, -1.4], ['hens', 3.4, 1.0, { seed: 43 }], ['folk', 1.0, 3.1, { ry: PI - 0.3, pose: 'stand', woman: true }]]);
  byRoad(1, 201.0, 5.4, 5.0, 310, 'lime', [['bananas', 3.6, -2.0, { seed: 44 }], ['potRack', 3.6, 0.6, { seed: 45 }], ['folk', 1.2, 1.4, { ry: -0.4, pose: 'carry', load: '#D6B486' }]]);
  byRoad(1, 221.0, 5.0, 5.0, 311, 'shop', [['bikeFix', 0.4, 1.8], ['folk', 1.7, 1.5, { ry: -PI / 2 + 0.3, pose: 'squat' }], ['bikes', 3.4, 0.6]], { sign: { my: 'စက်ဘီးပြင်' } });
  byRoad(1, 246.0, 5.0, 5.0, 312, 'stilt', [['garden', 3.6, 1.8, { w: 2.6, d: 1.5, seed: 46 }], ['woodpile', 3.4, -1.6], ['hens', 1.0, 1.2, { seed: 47 }]]);
  home(18.6, 256.7, 5.0, 5.0, 313, 'lime', [['jars', 3.4, -0.4], ['potPlants', 0.4, 0.7, { n: 3, seed: 47 }]]);
  // a second row further off the road (seen as the road bends, and from the map)
  home(-12, 196.6, 5.0, 5.0, 314, 'stilt', [['hens', 3.2, 1.0, { seed: 36 }]]);
  home(25.6, 178.0, 5.0, 5.0, 315, 'lime', [['laundry', 0, 2.1, { len: 3.0 }]]);
  // the road's own life between the homes: a goat tethered, kids racing a tyre, a sapling or two, flowers
  for (const o of [
    { k: 'goat', x: -4.6, z: 183.4, ry: 0.7 }, { k: 'sapling', x: -3.2, z: 212.6, seed: 48 },
    { k: 'sapling', x: 12.0, z: 236.4, seed: 50 }, { k: 'flowers', x: -3.4, z: 236.0, seed: 51 }, { k: 'tufts', x: 9.0, z: 172.0, seed: 52 },
    { k: 'tufts', x: 4.0, z: 228.0, seed: 53 }, { k: 'baskets', x: 21.6, z: 215.0, seed: 54 }, { k: 'lamp', x: 4.0, z: 211.0 }, { k: 'lamp', x: 0.6, z: 168.0 },
    { k: 'potPlants', x: 13.6, z: 194.0, n: 3, seed: 55 }, { k: 'flowers', x: 2.0, z: 194.6, seed: 56 }, { k: 'sapling', x: -0.4, z: 180.4, seed: 57 },
  ]) put(o, 2.6);
  person(-1.6, 198.4, 1.2, 'kid', 9301, {}); person(-0.2, 199.4, 1.6, 'kid', 9302, { woman: true });

  // ---- the letter's left margin: a hamlet past where Stamp Lane and Counter Lane run out
  home(-65.0, 280.5, 5.0, 5.0, 321, 'stilt', [['laundry', 0, 2.2, { len: 3.4 }], ['folk', 0.6, 3.4, { ry: PI + 0.2, pose: 'stand', woman: true }], ['hens', 3.4, 1.2, { seed: 61 }]]);
  home(-71.5, 284.0, 5.4, 5.0, 322, 'lime', [['bananas', -3.8, -1.6, { seed: 62 }], ['potPlants', 0.2, 0.75, { n: 4, seed: 63 }]]);
  home(-65.0, 293.0, 5.6, 5.0, 323, 'shop', [['folk', -1.2, 0.6, { ry: 0, pose: 'sit', stool: false, woman: true }], ['crates', 3.6, 0.6, { seed: 64 }]], { sign: { my: 'ဆန်ဆီ' } });
  home(-63.5, 318.0, 5.0, 5.0, 324, 'stilt', [['woodpile', 3.4, -1.0], ['jars', -3.4, 0.4], ['folk', 1.0, 1.6, { ry: 0.4, pose: 'carry', woman: true, load: '#9FB8C8' }]]);
  home(-64.0, 344.0, 5.0, 5.0, 325, 'lime', [['laundry', 0.4, 2.0, { len: 3.2 }], ['hens', 3.4, 0.8, { seed: 65 }]]);
  home(-63.0, 366.0, 5.4, 5.0, 326, 'stilt', [['garden', 0, 2.0, { w: 3.6, d: 1.6, seed: 66 }], ['folk', 2.4, 2.0, { ry: 0.2, pose: 'squat', hat: 'sun' }], ['bananas', -3.8, -1.4, { seed: 67 }]]);
  for (const o of [{ k: 'goat', x: -60.6, z: 307.0, ry: 1.4 }, { k: 'sapling', x: -61.0, z: 330.0, seed: 68 }, { k: 'flowers', x: -62.6, z: 286.6, seed: 69 }, { k: 'woodpile', x: -70.0, z: 352.6 }]) put(o, 2.6);

  // ---- south of the market gardens, before the letter's sign-off: two homes and the weaver
  home(-52.4, 355.5, 5.0, 5.0, 331, 'lime', [['potPlants', 0.2, 0.75, { n: 4, seed: 71 }]]);
  home(-46.5, 355.5, 5.0, 5.0, 332, 'stilt', [['jars', 3.4, -0.6], ['hens', 3.6, 1.4, { seed: 72 }]]);
  put({ k: 'loom', x: -38.2, z: 350.8 }, 2.6);
  folk(-38.2, 351.25, 0, 'sit', 9331, { stool: false, woman: true }); // the weaver on her mat (part of the loom)

  // ---- the letter's lower third: homes along its bottom edge, fronts to the Wharf road
  home(-21.5, 377.6, 5.4, 4.6, 341, 'stilt', []);
  home(-8.0, 377.6, 5.0, 4.6, 342, 'lime', []);
  home(14.2, 377.6, 4.6, 4.6, 343, 'shop', [], { sign: { my: 'လက်ဖက်ရည်' } });
  home(23.6, 377.6, 5.0, 4.6, 344, 'lime', []);
  home(35.0, 377.6, 4.4, 4.6, 345, 'stilt', []);

  // ---- lane-name boards at the spine's crossings (a name and nothing else)
  for (const [x, z, my, en] of [
    [3.8, 275.6, 'တံဆိပ်ခေါင်းလမ်း', 'Stamp Lane'], [3.6, 303.6, 'ကောင်တာလမ်း', 'Counter Lane'],
    [3.2, 337.4, 'ဆန်လမ်း', 'Rice Lane'], [3.4, 361.6, 'မင်လမ်း', 'Ink Lane'],
  ]) put({ k: 'laneSign', x, z, name: { my, en } }, 2.4);

  return { added: ITEMS.length - base, skipped };
}
