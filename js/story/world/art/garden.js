// Diary Garden art (district 6): the buildings and props regions/garden.js places. Same kit as build.js:
// boxes written straight into the chunk's merged Geo (kit.js), toon + outline, Maya's palette; fronts face +Z,
// feet at y = 0. Original art. The Garden's own look: whitewash and pale green-wash walls, corrugated tin
// roofs (green, zinc, a little rust), bamboo and trellis everywhere, raised beds with a dated board at the
// head of each, terracotta pots, the big brick bottle kiln.
//
// Only kit.js and voxel.js are imported (a region file must never import build.js or region.js).
//
// Each draw(g, f, it, ctx): g = outlined solids (item-local), f = flat ground decals, ctx.glows / signs / smoke.
// Exports: GARDEN_ART (buildings: h, map, obstacles) and GARDEN_PROP (props) for regions/garden.js to merge.
import { shade, rng } from '../kit.js';
import { jitter } from '../../../game/voxel.js';

export const K = {
  ink: '#2A2118', iron: '#4A3B30', wood: '#B58A5A', woodD: '#7A5434', woodL: '#CDA577', woodG: '#9E8A70',
  bamboo: '#C9B26B', bambooD: '#9C8540', bambooL: '#DCC98A', twine: '#C8B48A',
  tin: '#A9B4B8', tinD: '#8B979C', tinG: '#6E9A7A', tinGD: '#557D61', tinR: '#A9493A', rust: '#B5643C',
  wall: '#F4EBDD', wallG: '#DCE5CB', wallY: '#F0DDB0', wallP: '#F2DCD2', wash: '#EFE6D2',
  brick: '#A0503A', brickD: '#7E3C2B', brickL: '#B86A4C', mortar: '#D9C3A6', soot: '#3A2E28',
  leaf: '#6F9E5B', leafD: '#4F7F43', leafL: '#8DBA6E', leafY: '#A8C46A', leafB: '#5C8A64',
  soil: '#8A6648', soilD: '#6E5038', soilL: '#A07A58', straw: '#E2C77A', strawD: '#C9A85A',
  gold: '#C9A24A', goldD: '#A47A2C', brass: '#D9B65A', maroon: '#6E1F2A', maroonD: '#4A141C', rose: '#E8A0A8',
  mustard: '#E2B33C', white: '#FFFDF8', cream: '#F3E9D6', paper: '#FBF6EA', teal: '#4E8C86', green: '#4F7F43',
  blue: '#2F5DB3', sky: '#9CC3DE', glass: '#BFD3E0', glassD: '#93AFC4', terra: '#B5643C', terraD: '#8E4A2C', clay: '#D9B48C',
  potG: '#9DB59A', potGD: '#7E9A7C', water: '#A9C7D2', waterD: '#8FB3C2', stone: '#B9AE9C', stoneD: '#9A8F7E', coal: '#E8833A',
  gourd: '#C9B062', gourdD: '#A88F48', red: '#C8323C', orange: '#E9862E', violet: '#B9A3D6',
};
/** Shadow / worn paper on the diary page. */
export const SH = '#E9DCCB';
const SH2 = '#E2D2BE';

// ---------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------
/** Item-local (lx, lz) -> world, for an item at it.x, it.z turned it.ry (same rule as kit.js Geo.at). */
export function toWorld(it, lx, lz) {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  return [it.x + lx * c + lz * s, it.z - lx * s + lz * c];
}
/** A keep-out box from an item-local rect (world AABB of the turned rect). */
export function obBox(it, x0, z0, x1, z1) {
  const p = [toWorld(it, x0, z0), toWorld(it, x1, z0), toWorld(it, x0, z1), toWorld(it, x1, z1)];
  return { type: 'box', minX: Math.min(p[0][0], p[1][0], p[2][0], p[3][0]), maxX: Math.max(p[0][0], p[1][0], p[2][0], p[3][0]), minZ: Math.min(p[0][1], p[1][1], p[2][1], p[3][1]), maxZ: Math.max(p[0][1], p[1][1], p[2][1], p[3][1]) };
}
export function obCircle(it, lx, lz, r) { const [x, z] = toWorld(it, lx, lz); return { type: 'circle', x, z, r }; }
/** Item-local point -> world point, for ctx.glows / ctx.smoke (g carries the item's origin and turn). */
function wp(g, lx, lz) { return [g.tx + lx * g.tc + lz * g.ts, g.tz - lx * g.ts + lz * g.tc]; }
function glow(g, ctx, lx, y, lz) { const [x, z] = wp(g, lx, lz); ctx.glows.push(x, y, z); }

/** A corrugated tin gable roof, ridge along X: front slope ribbed (the camera's side), a ridge cap, rust here and there. */
function tinGable(g, W, D, y0, rise, col, { over = 0.4, rust = 0, seed = 1, gable = null } = {}) {
  const half = D / 2 + over, ang = Math.atan2(rise, D / 2), slope = half / Math.cos(ang);
  const cy = y0 + rise / 2 + 0.05, WW = W + over * 2, dark = shade(col, 0.84);
  for (const sz of [-1, 1]) g.boxR(0, cy, (sz * half) / 2, WW, 0.1, slope, col, sz * ang, 0, 0);
  const n = Math.max(4, Math.round(WW / 0.5)), ny = Math.cos(ang) * 0.065, nz = Math.sin(ang) * 0.065;
  for (let i = 0; i <= n; i++) g.boxR(-WW / 2 + 0.08 + (i * (WW - 0.16)) / n, cy + ny, half / 2 + nz, 0.05, 0.035, slope - 0.04, dark, ang, 0, 0);
  const r = rng(seed);
  for (let k = 0; k < rust; k++) {
    const t = 0.25 + r() * 0.6, x = (r() - 0.5) * (WW - 1.2);
    g.boxR(x, y0 + rise * (1 - t) + 0.12 + ny, half * t + nz * 0.5, 0.5 + r() * 0.6, 0.02, 0.35 + r() * 0.3, K.rust, ang, 0, 0);
  }
  g.box(0, y0 + rise + 0.1, 0, WW + 0.04, 0.12, 0.24, shade(col, 0.68));
  // gable ends (stepped, under the roof)
  if (gable) for (let i = 0; i < 4; i++) {
    const d = D * (1 - (i + 0.5) / 4);
    g.box(0, y0 + (rise * (i + 0.5)) / 4, 0, W - 0.04, rise / 4, d, gable);
  }
}
/** A single-slope roof falling toward +Z (the street), from y1 at the back to y0 at the front. */
function leanRoof(g, W, D, y0, y1, col, { over = 0.35, ribs = true } = {}) {
  const L = D + over * 2, ang = Math.atan2(y1 - y0, D), slope = L / Math.cos(ang);
  const cy = (y0 + y1) / 2 + 0.06;
  g.boxR(0, cy, 0, W + over * 2, 0.1, slope, col, ang, 0, 0);
  if (ribs) {
    const WW = W + over * 2, n = Math.max(3, Math.round(WW / 0.5)), ny = Math.cos(ang) * 0.065, nz = Math.sin(ang) * 0.065;
    for (let i = 0; i <= n; i++) g.boxR(-WW / 2 + 0.08 + (i * (WW - 0.16)) / n, cy + ny, nz, 0.05, 0.035, slope - 0.04, shade(col, 0.84), ang, 0, 0);
  }
}
/** A window: white frame, glass, a glazing bar, a sill, shutters folded back; lit: a warm pane (for lamp windows). */
function win(g, x, y, z, w, h, shut, { shutters = true, lit = false, curtain = null, box = null } = {}) {
  g.box(x, y, z, w + 0.14, h + 0.14, 0.08, K.white);
  g.box(x, y, z + 0.02, w, h, 0.06, lit ? '#F6D58E' : K.glass);
  if (curtain) g.box(x - w * 0.22, y + 0.02, z + 0.055, w * 0.42, h * 0.92, 0.02, curtain);
  g.box(x, y, z + 0.06, 0.04, h, 0.03, K.white);
  g.box(x, y + 0.03, z + 0.06, w, 0.04, 0.03, K.white);
  g.box(x, y - h / 2 - 0.08, z + 0.08, w + 0.26, 0.06, 0.18, K.woodD);
  if (shutters) for (const sx of [-1, 1]) {
    g.box(x + sx * (w / 2 + 0.2), y, z + 0.04, 0.3, h + 0.04, 0.05, shut);
    for (let k = -1; k <= 1; k++) g.box(x + sx * (w / 2 + 0.2), y + k * (h / 3.2), z + 0.075, 0.24, 0.03, 0.02, shade(shut, 0.8));
  }
  if (box) { // a flower box under it
    g.box(x, y - h / 2 - 0.22, z + 0.2, w + 0.2, 0.18, 0.26, K.woodL);
    for (let i = 0; i < 4; i++) g.box(x - w / 2 + 0.08 + i * ((w - 0.16) / 3), y - h / 2 - 0.06, z + 0.2, 0.18, 0.14, 0.16, i % 2 ? box : K.leafL);
  }
}
/** A plank door; open > 0 swings it inward on its left hinge (a dark doorway behind). */
function door(g, x, z, w, h, col, { open = 0, frame = K.woodD, knob = K.gold, planks = true, y0 = 0 } = {}) {
  g.box(x, y0 + h / 2 + 0.04, z, w + 0.18, h + 0.1, 0.1, frame);
  if (open > 0) {
    g.box(x, y0 + h / 2, z + 0.02, w, h, 0.08, '#3B2C22');
    g.box(x, y0 + 0.02, z + 0.02, w, 0.04, 0.12, '#5A4636'); // threshold
    const a = open * 1.35, hx = x - w / 2, hz = z - 0.02;
    g.box(hx + (w / 2) * Math.cos(a) * 0.96, y0 + h / 2, hz - (w / 2) * Math.sin(a) * 0.96, w * 0.96, h - 0.04, 0.05, col, a);
  } else {
    g.box(x, y0 + h / 2, z + 0.03, w, h, 0.06, col);
    if (planks) for (let k = 1; k < 4; k++) g.box(x - w / 2 + (k * w) / 4, y0 + h / 2, z + 0.065, 0.02, h - 0.06, 0.012, shade(col, 0.8));
    g.box(x, y0 + h * 0.3, z + 0.07, w - 0.06, 0.06, 0.02, shade(col, 0.85));
    g.box(x, y0 + h * 0.75, z + 0.07, w - 0.06, 0.06, 0.02, shade(col, 0.85));
    g.box(x + w / 2 - 0.12, y0 + h * 0.5, z + 0.085, 0.06, 0.06, 0.04, knob);
  }
}
/** A clipped green shrub (two blocks). */
function shrub(g, x, z, s = 1, col = K.leaf, y = 0) {
  g.box(x, y + 0.27 * s, z, 0.66 * s, 0.54 * s, 0.56 * s, col);
  g.box(x + 0.06 * s, y + 0.6 * s, z - 0.03 * s, 0.44 * s, 0.2 * s, 0.38 * s, shade(col, 1.12));
}
/** A potted plant (terracotta pot, leaves, maybe flowers). */
function potPlant(g, x, z, s = 1, flower = null, y = 0, pot = K.terra) {
  g.box(x, y + 0.14 * s, z, 0.3 * s, 0.28 * s, 0.3 * s, pot);
  g.box(x, y + 0.29 * s, z, 0.36 * s, 0.05 * s, 0.36 * s, shade(pot, 0.85));
  g.box(x, y + 0.46 * s, z, 0.36 * s, 0.3 * s, 0.32 * s, K.leaf);
  if (flower) g.box(x + 0.04 * s, y + 0.64 * s, z + 0.04 * s, 0.16 * s, 0.1 * s, 0.16 * s, flower);
}
/** A creeper on a wall face (z = face): leaf blocks climbing from (x, 0). */
function creeper(g, x, z, h, r, flower = null) {
  for (let y = 0.3, k = 0; y < h; y += 0.42, k++) {
    const dx = Math.sin(k * 1.7 + x) * 0.32;
    g.box(x + dx, y, z + 0.06, 0.34 + r() * 0.14, 0.28, 0.08, k % 2 ? K.leafD : K.leaf);
    if (flower && k % 3 === 1) g.box(x + dx + 0.12, y + 0.08, z + 0.11, 0.08, 0.08, 0.04, flower);
  }
}
/** A stack of three terracotta pots upside down. */
function potStack(g, x, z, n = 3, col = K.terra) {
  for (let i = 0; i < n; i++) {
    const s = 1 - i * 0.04;
    g.box(x, 0.12 + i * 0.16, z, 0.34 * s, 0.14, 0.34 * s, i % 2 ? shade(col, 0.92) : col);
  }
  g.box(x, 0.06 + n * 0.16, z, 0.18, 0.04, 0.18, shade(col, 0.8));
}
function waterJar(g, x, z, s = 1, col = '#7A4A2E') {
  g.box(x, 0.3 * s, z, 0.52 * s, 0.5 * s, 0.52 * s, col);
  g.box(x, 0.3 * s, z, 0.6 * s, 0.26 * s, 0.6 * s, shade(col, 1.08));
  g.box(x, 0.6 * s, z, 0.34 * s, 0.1 * s, 0.34 * s, shade(col, 0.85));
  g.box(x, 0.66 * s, z, 0.44 * s, 0.03, 0.44 * s, K.woodL); // lid
}
function crate(g, x, y, z, w = 0.6, h = 0.42, d = 0.45, col = K.woodL) {
  g.box(x, y + h / 2, z, w, h, d, col);
  g.box(x, y + h * 0.5, z + d / 2 + 0.005, w - 0.06, 0.06, 0.01, shade(col, 0.82));
  for (const sx of [-1, 1]) g.box(x + sx * (w / 2 - 0.03), y + h / 2, z + d / 2 + 0.005, 0.05, h, 0.012, shade(col, 0.75));
}
/** A paper bale: a cream block tied with twine (damp: greyer). */
function bale(g, x, y, z, w = 0.9, h = 0.5, d = 0.6, ry = 0, col = K.paper) {
  g.box(x, y + h / 2, z, w, h, d, col, ry);
  for (let k = 1; k <= 4; k++) g.box(x, y + (h * k) / 5, z, w + 0.005, 0.012, d + 0.005, shade(col, 0.9), ry);
  g.box(x - w * 0.25, y + h / 2, z, 0.035, h + 0.02, d + 0.02, K.twine, ry);
  g.box(x + w * 0.25, y + h / 2, z, 0.035, h + 0.02, d + 0.02, K.twine, ry);
}
/** A bamboo pole between two points (local), as one turned box. */
function pole(g, x0, y0, z0, x1, y1, z1, t = 0.06, col = K.bamboo) {
  const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, L = Math.hypot(dx, dy, dz);
  const ry = Math.atan2(-dz, dx), rz = Math.atan2(dy, Math.hypot(dx, dz));
  g.boxR((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, L, t, t, col, 0, ry, rz);
}

// ---------------------------------------------------------------------------------
// crops (one plant at x, z on a bed top at y)
// ---------------------------------------------------------------------------------
const CROPS = {
  cabbage(g, x, y, z, r) { g.box(x, y + 0.1, z, 0.3, 0.2, 0.3, K.leafL); g.box(x, y + 0.2, z, 0.18, 0.08, 0.18, '#C6DE9A'); void r; },
  chilli(g, x, y, z, r) { g.box(x, y + 0.17, z, 0.22, 0.3, 0.2, K.leafD); g.box(x + 0.07, y + 0.22, z + 0.1, 0.05, 0.12, 0.05, r() < 0.5 ? K.red : K.orange); },
  onion(g, x, y, z) { g.box(x - 0.04, y + 0.17, z, 0.04, 0.34, 0.04, K.leafY); g.box(x + 0.05, y + 0.14, z + 0.02, 0.04, 0.28, 0.04, K.leaf); g.box(x, y + 0.04, z, 0.1, 0.08, 0.1, '#EADBC5'); },
  seedling(g, x, y, z) { g.box(x, y + 0.05, z, 0.04, 0.1, 0.04, K.leafD); g.box(x, y + 0.11, z, 0.16, 0.04, 0.08, K.leafL); },
  herb(g, x, y, z, r) { g.box(x, y + 0.08, z, 0.28, 0.16, 0.24, r() < 0.5 ? K.leaf : K.leafB); },
  flower(g, x, y, z, r) {
    const c = [K.rose, K.mustard, K.white, K.orange, K.violet][Math.floor(r() * 5)];
    g.box(x, y + 0.14, z, 0.05, 0.28, 0.05, K.leafD); g.box(x, y + 0.08, z, 0.2, 0.08, 0.16, K.leaf); g.box(x, y + 0.3, z, 0.15, 0.08, 0.15, c);
  },
  tomato(g, x, y, z, r) {
    g.box(x - 0.1, y + 0.45, z, 0.03, 0.9, 0.03, K.bambooD); g.box(x, y + 0.36, z, 0.26, 0.56, 0.22, K.leafD);
    g.box(x + 0.09, y + 0.3, z + 0.12, 0.08, 0.08, 0.06, K.red); if (r() < 0.6) g.box(x - 0.05, y + 0.5, z + 0.12, 0.07, 0.07, 0.05, K.orange);
  },
  marigold(g, x, y, z, r) { g.box(x, y + 0.1, z, 0.24, 0.18, 0.22, K.leafD); g.box(x, y + 0.22, z, 0.18, 0.08, 0.16, r() < 0.5 ? K.orange : K.mustard); },
};
const CROP_STEP = { cabbage: 0.45, chilli: 0.4, onion: 0.32, seedling: 0.28, herb: 0.4, flower: 0.36, tomato: 0.55, marigold: 0.36 };

/** A raised bed (w x d): plank sides, soil, rows of one crop, a little dated board at its head (west end). */
function bed(g, f, it, x = 0, z = 0) {
  const W = it.w || 3, D = it.d || 1.2, r = rng(it.seed || 5), crop = it.crop || 'cabbage', H = 0.24;
  g.box(x, H / 2, z, W, H, D, jitter(K.woodD, 0.05, it.seed || 1));
  g.box(x, H + 0.01, z, W - 0.12, 0.03, D - 0.12, K.soil);
  for (let j = 0; j < Math.max(2, Math.round(D / 0.5)) - 1; j++) g.box(x, H + 0.025, z - D / 2 + 0.5 + j * 0.5 - 0.05, W - 0.2, 0.02, 0.06, K.soilD); // furrows
  const step = CROP_STEP[crop] || 0.4, rows = Math.max(1, Math.round((D - 0.2) / 0.42));
  const fn = CROPS[crop] || CROPS.cabbage;
  for (let j = 0; j < rows; j++) {
    const pz = z - D / 2 + 0.1 + ((j + 0.5) * (D - 0.2)) / rows;
    for (let px = x - W / 2 + 0.22 + (j % 2) * step * 0.4; px < x + W / 2 - 0.15; px += step) if (r() > 0.06) fn(g, px, H + 0.02, pz, r);
  }
  // the dated board at the head: a white card on a stake, a maroon date mark and a line of ink
  if (it.board !== false) {
    const bx = x - W / 2 - 0.12;
    g.box(bx, 0.26, z + D / 2 - 0.2, 0.04, 0.52, 0.04, K.woodD);
    g.box(bx, 0.48, z + D / 2 - 0.16, 0.34, 0.22, 0.03, K.white);
    g.box(bx - 0.08, 0.52, z + D / 2 - 0.14, 0.1, 0.06, 0.012, K.maroon);
    g.box(bx + 0.06, 0.43, z + D / 2 - 0.14, 0.16, 0.025, 0.012, '#8C7B6A');
  }
  f.flat(x - W / 2 - 0.1, z - D / 2 - 0.1, x + W / 2 + 0.2, z + D / 2 + 0.22, 0.005, SH);
}

// ---------------------------------------------------------------------------------
// BUILDINGS (ART)
// ---------------------------------------------------------------------------------

/** The big kiln's shed: an open-fronted tin shed round a brick bottle kiln whose chimney goes up through the
 * roof; the packing room (`packroom`) is the enclosed east bay, a low plank door in its front with straw
 * poking out under it. it: { w: 15, d: 11 } */
function kilnShed(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 3.4, FZ = D / 2;
  const KX = -2.2, KZ = -1.0; // kiln centre
  const BX0 = W / 2 - 4.3; // packing-room bay from here east
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.6, D / 2 + 0.7, 0.004, SH);
  f.flat(-W / 2 + 0.2, -D / 2 + 0.2, BX0, D / 2 - 0.1, 0.007, '#D8C4A2'); // swept earth floor
  for (let k = 0; k < 9; k++) f.flatR(KX + Math.cos(k * 2.3) * 2.8, KZ + 2.6 + Math.sin(k * 1.7) * 0.8, 0.5, 0.3, 0.009, '#9C8670', k); // ash scuffs
  // back and side walls: brick to 1.4, planks above
  g.box(0, 0.7, -D / 2 + 0.15, W, 1.4, 0.3, K.brick);
  g.box(0, 2.4, -D / 2 + 0.12, W, 2.0, 0.18, K.woodG);
  g.box(-W / 2 + 0.15, 0.7, 0, 0.3, 1.4, D - 0.2, K.brick);
  g.box(-W / 2 + 0.12, 2.4, 0, 0.18, 2.0, D - 0.2, K.woodG);
  for (let x = -W / 2 + 1; x < W / 2; x += 1.1) g.box(x, 1.41, -D / 2 + 0.31, 0.5, 0.04, 0.03, K.brickD);
  // posts along the open front, a beam, the roof (gable, tin, rusting)
  for (const x of [-W / 2 + 0.2, -W / 2 + 3.6, KX + 3.1, BX0]) { g.box(x, H / 2, FZ - 0.2, 0.26, H, 0.26, K.woodD); g.box(x, 0.12, FZ - 0.2, 0.4, 0.24, 0.4, K.stone); }
  g.box(0, H - 0.1, FZ - 0.2, W, 0.24, 0.3, K.woodD);
  tinGable(g, W, D, H, 1.4, K.tin, { over: 0.5, rust: 5, seed: 31, gable: K.woodG });
  // the bottle kiln: a brick drum swelling then narrowing to a neck, iron bands, the mouth facing the square
  const rings = [[0.0, 0.5, 3.8], [0.5, 0.6, 4.1], [1.1, 0.6, 4.2], [1.7, 0.6, 4.0], [2.3, 0.5, 3.5], [2.8, 0.45, 2.8], [3.25, 0.45, 2.1], [3.7, 0.5, 1.6]];
  rings.forEach(([y, h, s], i) => {
    g.box(KX, y + h / 2, KZ, s, h, s * 0.94, i % 2 ? K.brickD : K.brick);
    g.box(KX, y + h / 2, KZ, s * 0.72, h, s * 1.0, i % 2 ? K.brickD : K.brick); // rounder: a cross of two blocks
  });
  for (const y of [0.98, 2.2]) g.box(KX, y, KZ, 4.3 - (y > 2 ? 0.8 : 0), 0.08, 4.0 - (y > 2 ? 0.8 : 0), K.iron);
  // the chimney through the roof (taller than everything round the square: the smoke reads from afar)
  g.box(KX, 5.6, KZ, 1.2, 3.8, 1.2, K.brick);
  for (let y = 4.2; y < 7.4; y += 0.6) g.box(KX, y, KZ, 1.24, 0.06, 1.24, K.brickD);
  g.box(KX, 7.55, KZ, 1.44, 0.18, 1.44, K.brickD);
  g.box(KX, 7.7, KZ, 0.9, 0.14, 0.9, K.soot);
  { const [sx, sz] = wp(g, KX, KZ); ctx.smoke.push(sx, 7.8, sz); }
  // the mouth: an arched dark opening, embers, a brass door-plate propped beside it
  const MZ = KZ + 2.05;
  g.box(KX, 0.6, MZ, 1.2, 1.2, 0.14, K.soot);
  g.box(KX, 1.28, MZ + 0.02, 0.9, 0.2, 0.12, K.soot);
  g.box(KX, 1.42, MZ + 0.04, 1.5, 0.16, 0.16, K.brickL);
  for (const sx of [-1, 1]) g.box(KX + sx * 0.7, 0.7, MZ + 0.04, 0.2, 1.4, 0.16, K.brickL);
  g.box(KX, 0.14, MZ + 0.06, 0.8, 0.12, 0.08, K.coal);
  g.box(KX - 0.2, 0.22, MZ + 0.07, 0.3, 0.08, 0.06, K.mustard);
  glow(g, ctx, KX, 0.4, MZ + 0.3);
  g.boxR(KX + 1.25, 0.55, MZ + 0.2, 0.9, 1.1, 0.06, K.iron, -0.15, 0.3, 0);
  // inside the shed: fired pots on planks along the west wall, a ladder against the kiln, a barrow
  for (let k = 0; k < 2; k++) {
    g.box(-W / 2 + 0.75, 0.55 + k * 0.7, -0.4, 0.6, 0.06, D - 2.4, K.woodL);
    for (let z = -D / 2 + 1.6; z < D / 2 - 1.4; z += 0.55) {
      const c = (Math.round(z * 3) + k) % 3 ? K.terra : K.clay;
      g.box(-W / 2 + 0.75, 0.76 + k * 0.7, z, 0.36, 0.36, 0.36, c);
      g.box(-W / 2 + 0.75, 0.97 + k * 0.7, z, 0.22, 0.06, 0.22, shade(c, 0.8));
    }
  }
  pole(g, KX + 1.6, 0.05, KZ + 0.9, KX + 1.1, 2.9, KZ + 0.3, 0.07, K.woodL);
  pole(g, KX + 2.0, 0.05, KZ + 0.9, KX + 1.5, 2.9, KZ + 0.3, 0.07, K.woodL);
  for (let k = 1; k < 6; k++) pole(g, KX + 1.6 - k * 0.09, k * 0.48, KZ + 0.9 - k * 0.11, KX + 2.0 - k * 0.09, k * 0.48, KZ + 0.9 - k * 0.11, 0.05, K.woodL);
  // saggar stacks (clay boxes kilns fire pots in) on the floor, front-west
  for (const [x, z, n] of [[-5.6, 2.6, 4], [-4.9, 3.2, 3], [-6.2, 3.4, 2]]) for (let i = 0; i < n; i++) g.box(x, 0.17 + i * 0.32, z, 0.5, 0.3, 0.5, i % 2 ? K.clay : '#C9A27C');
  // the packing room: the east bay closed in with planks, a low plank door (room `packroom`), straw underneath
  const bw = W / 2 - BX0;
  g.box(BX0 + bw / 2, H / 2, FZ - 0.1, bw, H, 0.16, K.woodL);
  for (let x = BX0 + 0.3; x < W / 2 - 0.1; x += 0.36) g.box(x, H / 2, FZ - 0.01, 0.025, H - 0.1, 0.02, shade(K.woodL, 0.82));
  const PDX = it.packDoor ?? BX0 + 2.6;
  door(g, PDX, FZ, 0.95, 1.62, K.woodD, { frame: K.woodG });
  for (let k = 0; k < 9; k++) g.boxR(PDX - 0.42 + k * 0.1, 0.03, FZ + 0.12 + (k % 3) * 0.05, 0.035, 0.03, 0.26, k % 2 ? K.straw : K.strawD, 0, (k - 4) * 0.18, 0);
  win(g, BX0 + 0.85, 2.15, FZ, 0.6, 0.5, K.woodD, { shutters: false });
  crate(g, PDX + 0.95, 0, FZ + 0.4, 0.55, 0.4, 0.45);
  g.box(PDX + 0.95, 0.5, FZ + 0.4, 0.42, 0.14, 0.32, K.straw);
  // the shed's sign on the front beam
  ctx.signs.push({ x: -W / 2 + 1.9, y: H - 0.1, z: FZ + 0.0, w: 2.2, h: 0.55, lines: [{ text: 'မီးဖိုကြီး', size: 50 }, { text: 'The Big Kiln', size: 22, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: '#F3E9D6' });
}

/** The paper store (`paperstore`, the weigh room) with U Kyi Nyein's house above, set back over a terrace; the
 * outside stair up the east side to a door with three locks; one upstairs lamp window with a curtain; the
 * trader's awning out front over his hanging scale (the scale itself is dynamic: regions/garden.js
 * dressGarden). it: { w: 11.5, d: 9 } */
function paperStore(g, f, it, ctx) {
  const W = it.w, D = it.d, H1 = 3.0, H2 = 2.6, UP = 2.6; // upper storey set back UP metres
  const FZ = D / 2, DX = it.doorX ?? -1.2, DW = 3.6;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 1.9, D / 2 + 2.8, 0.004, SH);
  f.flat(DX - DW / 2, FZ, DX + DW / 2, FZ + 1.6, 0.007, '#EFE4D0'); // paper dust at the doorway
  // ground floor: brick plinth, whitewash, a wide doorway with the roll-up shutter rolled at the top
  g.box(0, 0.25, 0, W + 0.1, 0.5, D + 0.1, K.brick);
  g.box(0, H1 / 2 + 0.25, -0.02, W, H1 - 0.5, D - 0.04, K.wash);
  for (const sx of [-1, 1]) g.box(sx * (W / 2), H1 / 2, FZ, 0.2, H1, 0.2, K.woodD);
  g.box(DX, H1 / 2 - 0.1, FZ + 0.01, DW, H1 - 0.2, 0.06, '#5B4636'); // the doorway (dim inside)
  g.box(DX, H1 - 0.12, FZ + 0.12, DW + 0.4, 0.26, 0.3, K.tinD); // shutter roll
  g.box(DX, H1 - 0.12, FZ + 0.12, DW + 0.42, 0.06, 0.32, shade(K.tinD, 0.8));
  for (const sx of [-1, 1]) g.box(DX + sx * (DW / 2 + 0.06), H1 / 2 - 0.1, FZ + 0.06, 0.1, H1 - 0.2, 0.1, K.iron); // shutter rails
  // bales stacked to the roof just inside the doorway (seen through it), a hand truck
  for (let k = 0; k < 5; k++) for (let i = 0; i < 3; i++) bale(g, DX - 1.15 + i * 1.0 + (k % 2) * 0.12, 0.05 + k * 0.5, FZ - 1.0, 0.9, 0.48, 0.62);
  bale(g, DX + 0.9, 0.05, FZ - 0.25, 0.8, 0.45, 0.6, 0.2);
  // a ledger window west of the door
  win(g, -W / 2 + 1.2, 1.7, FZ, 0.9, 0.8, K.green, { shutters: true });
  // the terrace roof over the front part, railings; the upper storey behind it
  g.box(0, H1 + 0.08, FZ - UP / 2, W + 0.3, 0.16, UP + 0.2, K.woodD);
  for (let x = -W / 2 + 0.1; x <= W / 2 - 0.1; x += 0.45) g.box(x, H1 + 0.45, FZ - 0.05, 0.05, 0.6, 0.05, K.woodL);
  g.box(0, H1 + 0.78, FZ - 0.05, W, 0.08, 0.1, K.woodD);
  const UZ = FZ - UP, UD = D - UP;
  g.box(0, H1 + H2 / 2 + 0.15, -D / 2 + UD / 2, W - 0.4, H2, UD, K.wallP);
  for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.2), H1 + H2 / 2 + 0.15, UZ, 0.16, H2, 0.16, K.woodD);
  tinGable(g, W - 0.4, UD, H1 + H2 + 0.15, 1.3, K.tinR, { over: 0.45, rust: 3, seed: 7, gable: K.wallP });
  // upstairs: the lamp window (curtain; one glowing box at dusk) and the door with three locks at the stair head
  win(g, -1.6, H1 + 1.4, UZ, 1.0, 0.9, K.maroon, { shutters: true, lit: true, curtain: '#E8C9A0' });
  glow(g, ctx, -1.6, H1 + 1.4, UZ + 0.3);
  win(g, -W / 2 + 1.4, H1 + 1.4, UZ, 0.7, 0.7, K.maroon, { shutters: true });
  const LDX = W / 2 - 1.3;
  door(g, LDX, UZ, 0.9, 1.95, K.maroon, { y0: H1 + 0.16, frame: K.woodD, planks: true });
  for (let k = 0; k < 3; k++) { // three locks, one above another
    g.box(LDX + 0.3, H1 + 0.16 + 0.7 + k * 0.32, UZ + 0.1, 0.14, 0.16, 0.06, K.brass);
    g.box(LDX + 0.3, H1 + 0.16 + 0.82 + k * 0.32, UZ + 0.1, 0.1, 0.08, 0.03, K.goldD);
    g.box(LDX + 0.3, H1 + 0.16 + 0.68 + k * 0.32, UZ + 0.135, 0.025, 0.05, 0.01, K.ink);
  }
  // the outside stair: up the east side from the street to the terrace
  const SX = W / 2 + 0.55, steps = 12;
  for (let i = 0; i < steps; i++) {
    const y = (H1 * (i + 1)) / steps, z = FZ + 0.6 - (i * (UP + 1.2)) / steps;
    g.box(SX, y - 0.06, z, 0.9, 0.08, 0.3, K.woodL);
  }
  pole(g, SX + 0.45, 0, FZ + 0.6, SX + 0.45, H1, FZ - UP + 0.4, 0.12, K.woodD);
  pole(g, SX + 0.45, 0.9, FZ + 0.6, SX + 0.45, H1 + 0.9, FZ - UP + 0.4, 0.06, K.woodD);
  for (const t of [0, 0.5, 1]) g.box(SX + 0.45, 0.45 + H1 * t, FZ + 0.6 - (UP + 0.8) * t, 0.06, 0.9, 0.06, K.woodD);
  // the trader's awning: bamboo posts, a striped cloth roof out over his hanging scale (dynamic), a hook beam
  const AX0 = DX + DW / 2 + 0.3, AX1 = W / 2 - 0.1, AZ = FZ + 2.3;
  for (const x of [AX0, AX1]) g.box(x, 1.15, AZ, 0.1, 2.3, 0.1, K.bambooD);
  const aw = AX1 - AX0, n = Math.round(aw / 0.5);
  for (let i = 0; i < n; i++) g.boxR(AX0 + (i + 0.5) * (aw / n), 2.45, FZ + 1.15, aw / n + 0.01, 0.06, 2.5, i % 2 ? K.cream : K.teal, 0.14, 0, 0);
  g.box((AX0 + AX1) / 2, 2.3, AZ, aw, 0.08, 0.08, K.bambooD);
  g.box((AX0 + AX1) / 2, 2.12, FZ + 1.3, 0.06, 0.08, 0.06, K.iron);
  // sign over the doorway
  ctx.signs.push({ x: DX, y: H1 + 0.35, z: FZ + 0.12, w: 2.8, h: 0.62, lines: [{ text: 'စက္ကူဂိုဒေါင်', size: 46 }, { text: 'Paper Store · weigh room', size: 21, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: '#FBF6EA' });
  // sheds behind (more bales)
  g.box(-W / 4, 1.1, -D / 2 - 1.6, W / 2, 2.2, 2.8, K.woodG);
  leanRoof(g, W / 2, 2.8, 2.2, 2.6, K.tinD, { ribs: false });
}

/** The corner tea shop (`kilntea`): single storey on the lane, tin awning on posts, a green door standing open,
 * low stools outside, a painted teacup on its signboard. it: { w: 8, d: 7 } */
function teaShop(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 2.9, FZ = D / 2, DX = it.doorX ?? -1.5;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.4, D / 2 + 2.4, 0.004, SH);
  f.flat(-W / 2 + 0.1, FZ + 0.1, W / 2 - 0.1, FZ + 1.9, 0.006, '#E6D3B6'); // the swept front under the awning
  g.box(0, 0.12, 0, W + 0.2, 0.24, D + 0.2, K.stone);
  g.box(0, H / 2 + 0.24, 0, W, H, D, K.wallG);
  g.box(0, 0.55, FZ + 0.01, W, 0.62, 0.04, K.teal); // a painted dado
  for (const sx of [-1, 1]) g.box(sx * W / 2, H / 2 + 0.24, FZ, 0.18, H, 0.18, K.woodD);
  door(g, DX, FZ, 1.05, 2.05, K.green, { open: 0.85, y0: 0.24 });
  // the big shop window: two tables seen inside, a glass jar of snacks on the sill
  g.box(1.7, 1.55, FZ + 0.01, 3.2, 1.4, 0.06, '#5B4636');
  g.box(1.7, 1.55, FZ + 0.04, 3.3, 0.08, 0.06, K.woodD);
  for (const x of [0.6, 1.7, 2.8]) g.box(x, 1.55, FZ + 0.05, 0.06, 1.4, 0.05, K.woodD);
  g.box(1.7, 2.28, FZ + 0.05, 3.4, 0.08, 0.08, K.woodD);
  g.box(1.7, 0.84, FZ + 0.12, 3.4, 0.08, 0.26, K.woodD);
  for (const x of [0.8, 2.6]) { g.box(x, 1.1, FZ - 0.5, 0.8, 0.06, 0.5, K.woodL); g.box(x, 1.2, FZ - 0.5, 0.1, 0.1, 0.1, K.white); }
  g.box(1.4, 0.98, FZ + 0.12, 0.2, 0.22, 0.2, K.glass); g.box(1.4, 1.11, FZ + 0.12, 0.22, 0.04, 0.22, K.red);
  g.box(2.0, 0.98, FZ + 0.12, 0.2, 0.22, 0.2, K.glass); g.box(2.0, 1.11, FZ + 0.12, 0.22, 0.04, 0.22, K.mustard);
  // roof (tin, green) and the awning on bamboo posts
  tinGable(g, W, D, H + 0.24, 1.2, K.tinG, { over: 0.35, rust: 2, seed: 11, gable: K.wallG });
  const AZ = FZ + 1.9;
  for (const x of [-W / 2 + 0.2, 0.1, W / 2 - 0.2]) g.box(x, 1.25, AZ, 0.1, 2.5, 0.1, K.bambooD);
  leanRoof(g, W, 1.9, 2.45, 2.85, K.tin, { over: 0.15 });
  // the signboard over the awning: a painted teacup (blocks) beside the canvas name
  g.box(0.6, 3.6, FZ + 0.25, 3.6, 0.8, 0.08, K.white);
  g.box(0.6, 3.6, FZ + 0.22, 3.7, 0.9, 0.06, K.green);
  ctx.signs.push({ x: 1.05, y: 3.6, z: FZ + 0.3, w: 2.5, h: 0.68, lines: [{ text: 'လက်ဖက်ရည်', size: 52 }, { text: 'Tea · Kiln Corner', size: 21, font: 'serif', weight: 600, color: '#4F7F43' }], bg: '#FFFDF8', border: null });
  const cx = -0.85, cy = 3.48, cz = FZ + 0.31; // the cup
  g.box(cx, cy, cz, 0.44, 0.34, 0.04, K.white); g.box(cx, cy + 0.15, cz + 0.01, 0.48, 0.05, 0.04, K.red);
  g.box(cx + 0.28, cy + 0.02, cz, 0.1, 0.16, 0.04, K.white); g.box(cx, cy - 0.2, cz, 0.62, 0.05, 0.04, K.red);
  for (const dx of [-0.1, 0.06]) g.box(cx + dx, cy + 0.3, cz, 0.05, 0.14, 0.03, '#C8B9A6'); // steam
  // low tables and tiny stools under the awning (the tea-shop street corner), a kettle on a brazier by the door
  for (const [x, z] of [[0.9, FZ + 1.05], [2.7, FZ + 1.1]]) {
    g.box(x, 0.38, z, 0.9, 0.05, 0.6, K.woodL);
    for (const sx of [-0.38, 0.38]) for (const sz of [-0.24, 0.24]) g.box(x + sx, 0.18, z + sz, 0.05, 0.36, 0.05, K.woodD);
    for (const [dx, dz, c] of [[-0.75, 0, K.blue], [0.75, 0.05, K.red], [0, 0.6, K.mustard]]) { g.box(x + dx, 0.2, z + dz, 0.26, 0.05, 0.26, c); g.box(x + dx, 0.09, z + dz, 0.2, 0.18, 0.2, shade(c, 0.78)); }
    g.box(x - 0.15, 0.44, z, 0.1, 0.08, 0.1, K.white); g.box(x + 0.18, 0.44, z - 0.1, 0.1, 0.08, 0.1, K.white);
  }
  g.box(DX - 1.0, 0.25, FZ + 0.6, 0.42, 0.5, 0.42, K.iron); g.box(DX - 1.0, 0.52, FZ + 0.6, 0.36, 0.06, 0.36, K.coal);
  g.box(DX - 1.0, 0.68, FZ + 0.6, 0.28, 0.24, 0.24, K.goldD); g.box(DX - 0.84, 0.74, FZ + 0.6, 0.1, 0.04, 0.04, K.goldD);
  // a hanging lantern at the door, potted plants, the tea uncle's bicycle
  g.box(DX + 0.75, 2.2, FZ + 0.25, 0.03, 0.3, 0.03, K.iron); g.box(DX + 0.75, 1.98, FZ + 0.25, 0.22, 0.26, 0.22, K.goldD);
  glow(g, ctx, DX + 0.75, 1.98, FZ + 0.35);
  potPlant(g, -W / 2 + 0.35, FZ + 0.4, 1.1, K.rose);
  potPlant(g, W / 2 - 0.35, FZ + 0.35, 1.0, null);
  creeper(g, -W / 2 + 0.3, FZ, 2.6, rng(4), K.white);
  // the side wall (west, onto the square): a painted price board and stacked crates of empty bottles
  g.box(-W / 2 - 0.02, 1.7, -0.6, 0.06, 1.0, 1.6, K.green);
  g.box(-W / 2 - 0.06, 1.7, -0.6, 0.04, 0.86, 1.46, K.cream);
  for (let k = 0; k < 4; k++) g.box(-W / 2 - 0.09, 2.0 - k * 0.18, -0.6, 0.02, 0.05, 1.0 - (k % 2) * 0.3, '#8C7B6A');
  crate(g, -W / 2 - 0.45, 0, -2.0, 0.6, 0.4, 0.5, K.mustard); crate(g, -W / 2 - 0.45, 0.4, -2.0, 0.6, 0.4, 0.5, K.red);
}

/** The kiln's drying hall (`dryinghall`): long, low, tiled; wide double doors propped open on racks of green pots;
 * a chalk slate on the doorpost. it: { w: 15, d: 9 } */
function dryingHall(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 2.7, FZ = D / 2, DW = 2.6;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.5, D / 2 + 0.8, 0.004, SH);
  f.flat(-DW / 2 - 0.4, FZ, DW / 2 + 0.4, FZ + 1.5, 0.007, '#E6D6BE');
  g.box(0, 0.3, 0, W + 0.1, 0.6, D + 0.1, K.brick);
  for (let x = -W / 2 + 0.6; x < W / 2; x += 1.2) g.box(x, 0.3, FZ + 0.06, 0.04, 0.5, 0.02, K.brickD);
  g.box(0, H / 2 + 0.3, 0, W, H - 0.6, D, K.wall);
  for (const x of [-W / 2, -W / 4, W / 4, W / 2]) g.box(x, H / 2, FZ + 0.02, 0.2, H, 0.18, K.woodD);
  // the doorway: dim interior, three tiers of green pots on racks inside, two leaves propped wide open
  g.box(0, 1.15, FZ + 0.01, DW, 2.2, 0.06, '#4E3E32');
  for (let k = 0; k < 3; k++) {
    g.box(0, 0.4 + k * 0.6, FZ - 0.5, DW - 0.3, 0.05, 0.4, K.woodL);
    for (let x = -DW / 2 + 0.35; x < DW / 2 - 0.2; x += 0.42) g.box(x, 0.58 + k * 0.6, FZ - 0.5, 0.28, 0.3, 0.28, k % 2 ? K.potG : K.potGD);
  }
  for (const sx of [-1, 1]) {
    g.box(sx * (DW / 2 + 0.55), 1.1, FZ + 0.62, 0.08, 2.2, 1.2, K.teal, sx * 0.08);
    g.box(sx * (DW / 2 + 0.6), 1.1, FZ + 0.62, 0.04, 1.6, 0.9, shade(K.teal, 0.85), sx * 0.08);
    g.box(sx * (DW / 2 + 0.55), 0.1, FZ + 1.25, 0.24, 0.2, 0.24, K.stone); // a stone props each leaf
  }
  g.box(0, 2.3, FZ + 0.06, DW + 0.3, 0.16, 0.12, K.woodD);
  // windows with slatted shutters along the front, a vent line under the eaves
  for (const x of [-W / 2 + 1.7, -W / 2 + 4.6, W / 2 - 4.6, W / 2 - 1.7]) {
    g.box(x, 1.65, FZ + 0.01, 1.1, 0.9, 0.06, '#5B4636');
    for (let k = 0; k < 5; k++) g.boxR(x, 1.3 + k * 0.18, FZ + 0.06, 1.0, 0.03, 0.12, K.teal, -0.5, 0, 0);
    g.box(x, 1.15, FZ + 0.1, 1.24, 0.06, 0.18, K.woodD);
  }
  for (let x = -W / 2 + 0.5; x < W / 2 - 0.3; x += 0.6) g.box(x, H - 0.18, FZ + 0.02, 0.3, 0.12, 0.04, '#6E5A48');
  // the long tiled roof (stepped hip, terracotta)
  const w0 = W + 0.7, d0 = D + 0.8;
  g.box(0, H + 0.06, 0, w0 + 0.1, 0.12, d0 + 0.1, K.woodD);
  for (let i = 0; i < 5; i++) {
    const k = i / 5, w = w0 - k * 3.2, d = d0 * (1 - k * 0.9), y = H + 0.12 + 0.26 * (i + 0.5);
    g.box(0, y, 0, w, 0.26, d, i % 2 ? K.terra : shade(K.terra, 0.9));
    g.box(0, y + 0.1, d / 2 - 0.06, w + 0.02, 0.07, 0.14, shade(K.terra, 1.16));
  }
  g.box(0, H + 0.12 + 0.26 * 5 + 0.06, 0, w0 - 3.0, 0.14, 0.26, K.goldD);
  // lamps by the door, the doorpost slate (canvas), pots drying outside on planks, a broom
  for (const sx of [-1, 1]) { g.box(sx * (DW / 2 + 0.25), 2.1, FZ + 0.18, 0.18, 0.24, 0.16, K.goldD); glow(g, ctx, sx * (DW / 2 + 0.25), 2.1, FZ + 0.3); }
  g.box(DW / 2 + 0.25, 1.35, FZ + 0.1, 0.62, 0.48, 0.05, K.woodD);
  ctx.signs.push({ x: DW / 2 + 0.25, y: 1.35, z: FZ + 0.14, w: 0.56, h: 0.42, lines: [{ text: 'အိုး', size: 64, color: '#F3EEE2' }, { text: 'လှမ်းဆောင်', size: 46, color: '#F3EEE2' }], bg: '#3E4A3F', border: null, width: 256, height: 192 });
  for (const x0 of [-W / 2 + 0.6, W / 2 - 3.8]) {
    g.box(x0 + 1.6, 0.18, FZ + 0.8, 3.2, 0.06, 0.6, K.woodL);
    for (const x of [x0 + 0.2, x0 + 3.0]) g.box(x, 0.08, FZ + 0.8, 0.26, 0.16, 0.5, K.brick);
    for (let x = x0 + 0.3; x < x0 + 3.1; x += 0.5) { g.box(x, 0.38, FZ + 0.8, 0.34, 0.34, 0.34, K.potG); g.box(x, 0.57, FZ + 0.8, 0.2, 0.05, 0.2, K.potGD); }
  }
  pole(g, -W / 2 + 0.3, 0, FZ + 0.25, -W / 2 + 0.55, 1.5, FZ + 0.15, 0.05, K.woodL);
  g.box(-W / 2 + 0.28, 0.14, FZ + 0.27, 0.32, 0.26, 0.1, K.strawD);
}

/** The Market Committee's brick lean-to (`committeeroom`) on the kiln shed's wall: a plain door under a painted
 * name board, one lamp window, the public notice board outside beside the door. it: { w: 5, d: 5.6 } */
function committeeLean(g, f, it, ctx) {
  const W = it.w, D = it.d, FZ = D / 2, DX = it.doorX ?? -0.6;
  f.flat(-W / 2 - 0.2, -D / 2, W / 2 + 0.2, D / 2 + 0.9, 0.004, SH);
  g.box(0, 1.35, 0, W, 2.7, D, K.brick);
  for (let y = 0.3; y < 2.6; y += 0.3) g.box(0, y, FZ + 0.005, W - 0.02, 0.025, 0.01, K.brickD);
  for (let y = 0.15, k = 0; y < 2.6; y += 0.3, k++) for (let x = -W / 2 + (k % 2 ? 0.35 : 0.7); x < W / 2; x += 0.7) g.box(x, y, FZ + 0.006, 0.025, 0.28, 0.01, K.brickD);
  leanRoof(g, W, D, 2.8, 3.5, K.tinD, { over: 0.3 });
  door(g, DX, FZ, 0.95, 2.05, K.teal, { frame: K.woodD });
  g.box(DX, 2.42, FZ + 0.1, 1.9, 0.5, 0.06, K.maroon);
  ctx.signs.push({ x: DX, y: 2.42, z: FZ + 0.14, w: 1.8, h: 0.44, lines: [{ text: 'ဈေးကော်မတီ', size: 56, color: '#F6E7C3' }, { text: 'Market Committee', size: 22, font: 'serif', weight: 600, color: '#E2C88A' }], bg: '#6E1F2A', border: '#C9A24A', width: 512, height: 128 });
  win(g, 1.35, 1.55, FZ, 0.75, 0.75, K.teal, { shutters: false, lit: true, curtain: '#F1E3C6' });
  glow(g, ctx, 1.35, 1.55, FZ + 0.25);
  // the public notice board (outside, beside the door; a day can pin its notice there)
  const NX = 1.3, NZ = FZ + 0.25;
  for (const sx of [-0.62, 0.62]) g.box(NX + sx, 0.8, NZ, 0.08, 1.6, 0.08, K.woodD);
  g.box(NX, 1.95, NZ - 0.02, 1.5, 0.08, 0.32, K.tinD);
  g.box(NX, 1.0, NZ, 1.3, 0.04, 0.1, K.woodD);
  // (the board face sits under the window: kept low so the window still reads)
  g.box(NX, 0.62, NZ + 0.02, 1.32, 0.66, 0.05, K.woodL);
  g.box(NX, 0.62, NZ + 0.05, 1.2, 0.56, 0.02, '#D9C8A4');
  for (const [x, y, w, h, c] of [[-0.38, 0.7, 0.32, 0.36, K.white], [0.05, 0.62, 0.36, 0.42, '#FCE6C4'], [0.42, 0.72, 0.26, 0.3, K.white]]) {
    g.box(NX + x, y, NZ + 0.07, w, h, 0.01, c);
    g.box(NX + x, y + h / 2 - 0.04, NZ + 0.08, 0.04, 0.04, 0.01, K.red);
  }
  g.box(-W / 2 + 0.3, 0.25, FZ + 0.4, 0.4, 0.5, 0.4, K.iron); // umbrella stand outside
  g.box(-W / 2 + 0.3, 0.75, FZ + 0.4, 0.06, 0.6, 0.06, K.maroon);
  g.box(-W / 2 + 0.38, 0.7, FZ + 0.42, 0.06, 0.5, 0.06, K.blue);
}

/** U Hpo Htaw's garden house (`hpohtawshed`): small, tin-roofed, a plank door in the south wall facing the lane
 * (seen through his gate), a lamp window, an empty hook on the wall. it: { w: 4.6, d: 4.2 } */
function gardenHouse(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 2.35, FZ = D / 2, DX = it.doorX ?? 0.45, r = rng(17);
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.4, D / 2 + 0.7, 0.004, SH);
  g.box(0, 0.1, 0, W + 0.2, 0.2, D + 0.2, K.stone);
  g.box(0, H / 2 + 0.2, 0, W, H, D, K.wash);
  for (let x = -W / 2 + 0.3; x < W / 2; x += 0.42) g.box(x, H / 2 + 0.2, FZ + 0.005, 0.02, H - 0.1, 0.01, '#DDD0B8'); // board joints
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * W / 2, H / 2 + 0.2, sz * D / 2, 0.14, H, 0.14, K.woodD);
  tinGable(g, W, D, H + 0.2, 1.0, K.tin, { over: 0.45, rust: 4, seed: 23, gable: K.wash });
  door(g, DX, FZ, 0.85, 1.9, K.woodG, { y0: 0.2, frame: K.woodD });
  win(g, -1.35, 1.45, FZ, 0.7, 0.62, K.green, { shutters: true, lit: false });
  // the empty hook (where something used to hang), a trowel on a nail, a stone step
  g.box(-0.4, 1.95, FZ + 0.06, 0.05, 0.05, 0.1, K.iron);
  g.box(-0.4, 1.88, FZ + 0.1, 0.04, 0.1, 0.04, K.iron);
  g.box(1.45, 1.2, FZ + 0.05, 0.06, 0.24, 0.03, K.woodD); g.box(1.45, 1.0, FZ + 0.06, 0.12, 0.18, 0.02, K.tinD);
  g.box(DX, 0.1, FZ + 0.32, 1.0, 0.2, 0.44, K.stoneD);
  // a rain barrel at the corner, a creeper up the side, a hoe leaning (his, not lent)
  waterJar(g, W / 2 + 0.4, FZ - 0.5, 1.0, '#5E6E66');
  creeper(g, -W / 2 + 0.25, FZ, 2.3, r, null);
  pole(g, W / 2 + 0.15, 0.02, FZ - 1.2, W / 2 + 0.05, 1.5, FZ - 1.4, 0.05, K.woodL);
  g.box(W / 2 + 0.16, 0.06, FZ - 1.1, 0.24, 0.1, 0.05, K.iron);
  void ctx;
}

/** The gourd aunty's little house (`gourdhouse`): bamboo-mat walls, a tin roof with a stove pipe, the front door
 * propped open on the lane under a string of dried gourds. it: { w: 5, d: 4.4 } */
function gourdHouse(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 2.4, FZ = D / 2, DX = it.doorX ?? 0.5;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.3, D / 2 + 1.0, 0.004, SH);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (W / 2 - 0.1), 0.25, sz * (D / 2 - 0.1), 0.18, 0.5, 0.18, K.woodD); // short stilts
  g.box(0, 0.5, 0, W, 0.12, D, K.wood);
  g.box(0, H / 2 + 0.55, 0, W - 0.1, H, D - 0.1, K.bambooL);
  // woven bamboo matting: alternating strips on the front
  for (let y = 0.7, k = 0; y < H + 0.4; y += 0.24, k++) for (let x = -W / 2 + 0.12 + (k % 2) * 0.2; x < W / 2 - 0.1; x += 0.4) g.box(x, y, FZ - 0.04, 0.2, 0.22, 0.02, K.bamboo);
  for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.05), H / 2 + 0.55, FZ - 0.02, 0.12, H, 0.12, K.bambooD);
  tinGable(g, W, D, H + 0.55, 1.0, K.tinG, { over: 0.5, rust: 2, seed: 41, gable: K.bambooL });
  g.box(-1.2, H + 1.9, -0.4, 0.16, 1.4, 0.16, K.iron); g.box(-1.2, H + 2.62, -0.4, 0.3, 0.06, 0.3, K.iron);
  { const [sx, sz] = wp(g, -1.2, -0.4); ctx.smoke.push(sx, H + 2.7, sz); }
  // the door propped open, a stone, two plank steps
  door(g, DX, FZ, 0.85, 1.85, K.teal, { open: 0.75, y0: 0.56 });
  g.box(DX + 0.38, 0.62, FZ - 0.35, 0.18, 0.14, 0.16, K.stoneD);
  for (let k = 0; k < 2; k++) g.box(DX, 0.14 + k * 0.2, FZ + 0.55 - k * 0.28, 1.0, 0.08, 0.3, K.woodL);
  // a string of dried gourds over the door
  for (let i = 0; i < 6; i++) {
    const x = DX - 0.55 + i * 0.22, y = 2.55 - Math.sin((i / 5) * Math.PI) * 0.12;
    g.box(x, y, FZ + 0.12, 0.13, 0.2, 0.13, i % 2 ? K.gourd : K.gourdD);
    g.box(x, y + 0.14, FZ + 0.12, 0.06, 0.1, 0.06, K.gourdD);
  }
  g.box(DX, 2.68, FZ + 0.12, 1.4, 0.02, 0.02, K.twine);
  win(g, -1.3, 1.65, FZ, 0.7, 0.6, K.teal, { shutters: false, box: K.orange });
  glow(g, ctx, DX, 1.6, FZ - 0.6);
  // kitchen things outside: a water jar on a stand, a charcoal stove, a stack of firewood
  waterJar(g, -W / 2 + 0.45, FZ + 0.55, 0.95);
  g.box(W / 2 - 0.4, 0.2, FZ + 0.6, 0.38, 0.4, 0.38, K.terraD); g.box(W / 2 - 0.4, 0.42, FZ + 0.6, 0.3, 0.05, 0.3, K.coal);
  for (let k = 0; k < 3; k++) g.box(-W / 2 - 0.35, 0.1 + k * 0.14, -0.6, 0.3, 0.13, 1.4 - k * 0.2, k % 2 ? K.woodL : K.wood);
}

/** A gardener's cottage (several variants by seed): wash walls, tin roof, a porch, shutters, plants. it: { w, d, seed } */
function cottage(g, f, it, ctx) {
  const W = it.w, D = it.d, r = rng(it.seed || 3), H = 2.45 + r() * 0.2;
  const wall = [K.wall, K.wallG, K.wallY, K.wallP][Math.floor(r() * 4)], roof = [K.tinG, K.tin, K.tinR, K.tinG][Math.floor(r() * 4)];
  const shut = [K.green, K.teal, K.blue, K.maroon][Math.floor(r() * 4)], FZ = D / 2;
  const DX = (r() - 0.5) * (W - 2.6);
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.5, D / 2 + 0.7, 0.004, SH);
  for (let k = 0; k < 3; k++) f.flatR(DX + (k % 2 ? 0.07 : -0.07), FZ + 0.9 + k * 0.5, 0.5, 0.34, 0.008, '#E3D4BC');
  g.box(0, 0.12, 0, W + 0.2, 0.24, D + 0.2, K.stone);
  g.box(0, H / 2 + 0.24, 0, W, H, D, wall);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * W / 2, H / 2 + 0.24, sz * D / 2, 0.14, H, 0.14, K.woodD);
  g.box(0, 0.5, FZ + 0.005, W, 0.5, 0.02, shade(wall, 0.9));
  tinGable(g, W, D, H + 0.24, 1.15, roof, { over: 0.42, rust: Math.floor(r() * 4), seed: it.seed || 3, gable: wall });
  door(g, DX, FZ, 0.9, 1.95, shut, { y0: 0.24 });
  // a little porch roof on two posts
  for (const sx of [-0.6, 0.6]) g.box(DX + sx, 1.2, FZ + 0.9, 0.08, 2.4, 0.08, K.woodL);
  g.boxR(DX, 2.42, FZ + 0.5, 1.6, 0.07, 1.1, roof, 0.22, 0, 0);
  for (const wx of [-W / 2 + 0.95, W / 2 - 0.95]) if (Math.abs(wx - DX) > 1.2) win(g, wx, 1.5, FZ, 0.75, 0.72, shut, { box: [K.rose, K.mustard, K.white][Math.floor(r() * 3)] });
  if (r() < 0.6) creeper(g, W / 2 - 0.2, FZ, H, r, r() < 0.5 ? K.rose : null);
  potPlant(g, DX - 0.75, FZ + 0.35, 1, r() < 0.5 ? K.red : null);
  if (r() < 0.6) potPlant(g, DX + 0.75, FZ + 0.4, 0.9, K.mustard);
  if (r() < 0.5) { g.box(W / 2 - 0.7, H + 1.25, -0.5, 0.36, 0.8, 0.36, K.brick); g.box(W / 2 - 0.7, H + 1.68, -0.5, 0.44, 0.06, 0.44, K.brickD); }
  void ctx;
}

/** A paper seed-house: a bamboo frame glazed with oiled paper panels, staging with seedling trays inside,
 * the front door open. it: { w: 5, d: 3.6 } */
function seedHouse(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 2.1, FZ = D / 2, P = '#F5EEDC', P2 = '#EADFC6';
  f.flat(-W / 2 - 0.2, -D / 2 - 0.2, W / 2 + 0.3, D / 2 + 0.5, 0.004, SH);
  g.box(0, 0.08, 0, W + 0.1, 0.16, D + 0.1, K.stone);
  // panels: back and sides solid paper, front panels either side of the door
  g.box(0, H / 2 + 0.16, -D / 2 + 0.03, W, H, 0.04, P2);
  for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.02), H / 2 + 0.16, 0, 0.04, H, D, P2);
  for (const sx of [-1, 1]) g.box(sx * (W / 4 + 0.3), H / 2 + 0.16, FZ, W / 2 - 0.6, H, 0.04, P);
  // the bamboo frame over the panels: posts, rails
  for (let x = -W / 2; x <= W / 2 + 0.01; x += W / 5) { g.box(x, H / 2 + 0.16, FZ + 0.03, 0.07, H, 0.07, K.bamboo); g.box(x, H / 2 + 0.16, -D / 2, 0.07, H, 0.07, K.bamboo); }
  for (const y of [0.9, H + 0.14]) g.box(0, y, FZ + 0.04, W, 0.06, 0.06, K.bambooD);
  // a paper roof (two slopes) with bamboo ribs
  const ang = Math.atan2(0.9, D / 2), sl = (D / 2 + 0.2) / Math.cos(ang);
  for (const sz of [-1, 1]) g.boxR(0, H + 0.62, (sz * (D / 2 + 0.2)) / 2, W + 0.3, 0.05, sl, sz > 0 ? P : P2, sz * ang, 0, 0);
  for (let x = -W / 2; x <= W / 2 + 0.01; x += W / 5) g.boxR(x, H + 0.67, (D / 2 + 0.2) / 2 + 0.02, 0.06, 0.05, sl, K.bamboo, ang, 0, 0);
  g.box(0, H + 1.08, 0, W + 0.35, 0.08, 0.12, K.bambooD);
  // inside (seen through the door): staging with trays of seedlings
  g.box(0, 0.75, FZ, 1.1, 1.5, 0.03, '#6E5A48');
  for (const z of [-D / 2 + 0.55]) {
    g.box(0, 0.8, z, W - 0.6, 0.05, 0.7, K.woodL);
    for (let x = -W / 2 + 0.6; x < W / 2 - 0.5; x += 0.42) { g.box(x, 0.86, z, 0.36, 0.06, 0.5, K.soilD); g.box(x, 0.93, z, 0.3, 0.06, 0.4, K.leafL); }
  }
  // the dated label on the door frame and a watering can at the step
  g.box(0.65, 1.7, FZ + 0.06, 0.3, 0.2, 0.02, K.white); g.box(0.6, 1.73, FZ + 0.075, 0.12, 0.05, 0.01, K.maroon);
  g.box(0.9, 0.18, FZ + 0.45, 0.32, 0.3, 0.2, K.tinG); g.boxR(1.12, 0.32, FZ + 0.45, 0.3, 0.05, 0.05, K.tinG, 0, 0, 0.6);
  void ctx;
}

/** A shade-net nursery: bamboo posts, a lattice of slats overhead, benches of potted seedlings. it: { w, d } */
function shadeFrame(g, f, it) {
  const W = it.w, D = it.d, H = 2.3, r = rng(it.seed || 9);
  f.flat(-W / 2, -D / 2, W / 2, D / 2, 0.006, '#E4D7BF');
  for (let x = -W / 2; x <= W / 2 + 0.01; x += W / 3) for (const z of [-D / 2, D / 2]) g.box(x, H / 2, z, 0.1, H, 0.1, K.bambooD);
  for (const z of [-D / 2, D / 2]) g.box(0, H, z, W + 0.2, 0.08, 0.08, K.bambooD);
  for (let x = -W / 2 + 0.25; x < W / 2; x += 0.5) g.box(x, H + 0.06, 0, 0.06, 0.04, D + 0.3, K.bamboo);
  for (let z = -D / 2 + 0.4; z < D / 2; z += 0.8) g.box(0, H + 0.1, z, W + 0.2, 0.03, 0.2, '#7E9A7C'); // the net strips
  for (const z of [-D / 4, D / 4]) {
    g.box(0, 0.62, z, W - 0.8, 0.05, 0.7, K.woodL);
    for (const x of [-W / 2 + 0.6, 0, W / 2 - 0.6]) g.box(x, 0.3, z, 0.1, 0.6, 0.6, K.woodD);
    for (let x = -W / 2 + 0.7; x < W / 2 - 0.5; x += 0.38) for (const dz of [-0.17, 0.17]) {
      g.box(x, 0.74, z + dz, 0.2, 0.2, 0.2, K.terra);
      g.box(x, 0.9, z + dz, 0.2 + r() * 0.08, 0.14 + r() * 0.1, 0.18, r() < 0.2 ? K.leafY : K.leafL);
    }
  }
}

/** A low market stall with a cloth awning (≤ 2.1 m, empty: not a market day); slate: a chalk sign on it. */
function stall(g, f, it, ctx) {
  const W = it.w || 2.0, r = rng(it.seed || 2), col = it.color || [K.maroon, K.teal, K.mustard, K.terra][Math.floor(r() * 4)];
  f.flat(-W / 2 - 0.2, -0.7, W / 2 + 0.3, 0.9, 0.005, SH);
  g.box(0, 0.62, 0.05, W, 0.06, 0.8, K.woodL);
  g.box(0, 0.35, 0.44, W, 0.5, 0.04, K.woodD);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (W / 2 - 0.06), 0.31, 0.05 + sz * 0.34, 0.07, 0.62, 0.07, K.woodD);
  for (const sx of [-1, 1]) { g.box(sx * (W / 2 - 0.04), 1.05, -0.4, 0.07, 2.1, 0.07, K.bambooD); g.box(sx * (W / 2 - 0.04), 0.85, 0.5, 0.06, 1.7, 0.06, K.bambooD); }
  const n = Math.round(W / 0.4);
  for (let i = 0; i < n; i++) g.boxR(-W / 2 + (i + 0.5) * (W / n), 1.92, 0.05, W / n + 0.01, 0.05, 1.2, i % 2 ? K.cream : col, 0.33, 0, 0);
  for (let i = 0; i < n; i++) g.box(-W / 2 + (i + 0.5) * (W / n), 1.66, 0.62, W / n - 0.02, 0.14, 0.03, i % 2 ? col : K.cream);
  // empty today: a rolled mat, a stack of empty baskets, a cloth over the counter
  g.box(-W / 4, 0.72, 0.0, 0.7, 0.14, 0.14, K.strawD);
  g.box(W / 4, 0.7, -0.05, 0.5, 0.1, 0.5, K.bamboo); g.box(W / 4, 0.8, -0.05, 0.44, 0.1, 0.44, K.bambooL);
  g.box(0, 0.66, 0.36, W - 0.2, 0.03, 0.12, shade(col, 0.9));
  if (it.slate) {
    g.box(W / 2 - 0.45, 0.95, 0.47, 0.62, 0.48, 0.05, K.woodD);
    ctx.signs.push({ x: W / 2 - 0.45, y: 0.95, z: 0.51, w: 0.56, h: 0.42, lines: it.slate, bg: '#3E4A3F', border: null, width: 256, height: 192 });
  }
}

// ---------------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------------

/** A plot's lane fence (len along X): pickets, rails; an optional gate opening at gx (width gw), with or without a
 * gate leaf and a trellis arch over it; `posts`: two stout gateposts only (a dynamic gate hangs there). */
function plotFence(g, f, it) {
  const L = it.len, H = it.h || 0.85, col = it.col || K.white, gx = it.gx ?? null, gw = it.gw || 1.2;
  const pieces = gx == null ? [[-L / 2, L / 2]] : [[-L / 2, gx - gw / 2], [gx + gw / 2, L / 2]];
  for (const [a, b] of pieces) {
    if (b - a < 0.2) continue;
    const len = b - a, mid = (a + b) / 2, n = Math.max(1, Math.round(len / 0.32));
    for (const y of [H * 0.32, H * 0.72]) g.box(mid, y, -0.02, len, 0.06, 0.05, K.woodL);
    for (let i = 0; i <= n; i++) {
      const x = a + (len * i) / n, post = i === 0 || i === n;
      g.box(x, (post ? H + 0.08 : H) / 2, 0.03, post ? 0.12 : 0.08, post ? H + 0.08 : H, post ? 0.12 : 0.035, post ? K.woodD : jitter(col, 0.03, i + it.x));
      if (!post) g.box(x, H + 0.02, 0.03, 0.05, 0.05, 0.035, jitter(col, 0.03, i + it.x));
    }
    f.flat(a, -0.16, b, 0.26, 0.006, SH);
  }
  if (gx == null) return;
  for (const sx of [-1, 1]) { g.box(gx + sx * (gw / 2 + 0.02), (H + 0.35) / 2, 0.03, 0.16, H + 0.35, 0.16, K.woodD); g.box(gx + sx * (gw / 2 + 0.02), H + 0.4, 0.03, 0.22, 0.06, 0.22, K.gold); }
  if (it.leaf === 'closed' || it.leaf === 'ajar') {
    const a = it.leaf === 'ajar' ? 0.5 : 0, w = gw - 0.08, hx = gx - gw / 2 + 0.04;
    const cx = hx + (w / 2) * Math.cos(a), cz = -(w / 2) * Math.sin(a);
    for (const y of [H * 0.25, H * 0.75]) g.box(cx, y, cz, w, 0.07, 0.05, K.woodL, a);
    for (let i = 0; i < 4; i++) { const t = (i + 0.5) / 4 - 0.5; g.box(cx + t * w * Math.cos(a), H / 2, cz - t * w * Math.sin(a), 0.08, H - 0.1, 0.035, col, a); }
  }
  if (it.arch) { // a bamboo trellis arch over the gate, a creeper with flowers
    const AH = 2.35, r = rng(Math.round(it.x * 7));
    for (const sx of [-1, 1]) { g.box(gx + sx * (gw / 2 + 0.15), AH / 2, 0.15, 0.07, AH, 0.07, K.bamboo); g.box(gx + sx * (gw / 2 + 0.15), AH / 2, -0.15, 0.07, AH, 0.07, K.bamboo); }
    const n = 7, R = gw / 2 + 0.15;
    for (let i = 0; i < n; i++) {
      const a0 = (Math.PI * i) / n, a1 = (Math.PI * (i + 1)) / n;
      const xa = -Math.cos(a0) * R, xb = -Math.cos(a1) * R, ya = AH + Math.sin(a0) * 0.5, yb = AH + Math.sin(a1) * 0.5;
      g.boxR(gx + (xa + xb) / 2, (ya + yb) / 2, 0, Math.hypot(xb - xa, yb - ya) + 0.04, 0.07, 0.38, K.bambooD, 0, 0, Math.atan2(yb - ya, xb - xa));
      g.box(gx + (xa + xb) / 2, (ya + yb) / 2 + 0.1, (r() - 0.5) * 0.2, 0.36, 0.2, 0.44, i % 2 ? K.leaf : K.leafD);
      if (i % 2 === 0) g.box(gx + (xa + xb) / 2 + 0.05, (ya + yb) / 2 + 0.2, 0.2, 0.1, 0.1, 0.06, it.arch === true ? K.rose : it.arch);
    }
    for (const sx of [-1, 1]) for (let y = 0.5; y < AH; y += 0.55) g.box(gx + sx * (gw / 2 + 0.15), y, 0.18, 0.2, 0.22, 0.08, (y * 10) % 2 > 1 ? K.leaf : K.leafD);
  }
}

/** The lane bench: a plain plank bench that belongs to the lane (no back). */
function laneBench(g, f) {
  g.box(0, 0.45, 0, 1.7, 0.07, 0.36, K.woodL);
  g.box(0, 0.45, 0.17, 1.7, 0.05, 0.03, shade(K.woodL, 0.85));
  for (const sx of [-0.66, 0.66]) { g.box(sx, 0.21, 0, 0.1, 0.42, 0.3, K.woodD); g.box(sx, 0.06, 0, 0.12, 0.12, 0.4, K.woodD); }
  f.flat(-0.95, -0.35, 1.0, 0.45, 0.005, SH);
}
/** A long visitors' bench with a back. */
function longBench(g, f, it) {
  const L = it.len || 2.4;
  g.box(0, 0.44, 0, L, 0.06, 0.4, K.woodL);
  g.box(0, 0.8, -0.18, L, 0.24, 0.05, K.woodL);
  for (const sx of [-1, 0, 1]) { g.box(sx * (L / 2 - 0.15), 0.22, 0.05, 0.08, 0.44, 0.08, K.woodD); g.box(sx * (L / 2 - 0.15), 0.5, -0.18, 0.07, 1.0, 0.06, K.woodD); }
  f.flat(-L / 2 - 0.1, -0.35, L / 2 + 0.15, 0.4, 0.005, SH);
}
function bedProp(g, f, it) { bed(g, f, it, 0, 0); }
/** A low bamboo trellis frame over a bed (the seedling bed under a low trellis). */
function lowTrellis(g, f, it) {
  const W = it.w || 2.6, D = it.d || 1.2, H = 0.95;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box((sx * W) / 2, H / 2, (sz * D) / 2, 0.05, H, 0.05, K.bamboo);
  for (const sz of [-1, 1]) g.box(0, H, (sz * D) / 2, W + 0.1, 0.05, 0.05, K.bambooD);
  for (let x = -W / 2 + 0.3; x < W / 2; x += 0.5) g.box(x, H + 0.03, 0, 0.04, 0.04, D + 0.1, K.bamboo);
  for (let x = -W / 2 + 0.5; x < W / 2; x += 0.9) g.box(x, H + 0.06, 0.1, 0.4, 0.06, 0.34, K.leafL);
  void f;
}
/** A row of bean-pole tents (tall: north of a lane only). it: { len } */
function beanPoles(g, f, it) {
  const L = it.len || 4, r = rng(it.seed || 3);
  g.box(0, 1.85, 0, L, 0.05, 0.05, K.bambooD);
  for (let x = -L / 2 + 0.2; x <= L / 2 - 0.1; x += 0.55) {
    for (const sz of [-1, 1]) pole(g, x, 0, sz * 0.4, x, 1.9, 0, 0.04, K.bamboo);
    for (let y = 0.3; y < 1.8; y += 0.38) {
      g.box(x + (r() - 0.5) * 0.12, y, (r() - 0.5) * 0.3, 0.24, 0.18, 0.2, r() < 0.5 ? K.leaf : K.leafD);
      if (r() < 0.25) g.box(x + 0.1, y - 0.1, 0.12, 0.04, 0.2, 0.04, K.leafY); // a pod
    }
  }
  f.flat(-L / 2 - 0.2, -0.5, L / 2 + 0.2, 0.6, 0.006, '#E0CDB2');
}
/** A tall bamboo trellis arch over a road (it.span wide), creepers and flowers on it. */
function roadArch(g, f, it) {
  const S = it.span || 4.2, H = 3.6, r = rng(it.seed || 5);
  for (const sx of [-1, 1]) for (const sz of [-0.2, 0.2]) { g.box((sx * S) / 2, H / 2, sz, 0.09, H, 0.09, K.bambooD); g.box((sx * S) / 2, 0.06, sz, 0.2, 0.12, 0.2, K.stone); }
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a0 = (Math.PI * i) / n, a1 = (Math.PI * (i + 1)) / n;
    const xa = (-Math.cos(a0) * S) / 2, xb = (-Math.cos(a1) * S) / 2, ya = H + Math.sin(a0) * 0.8, yb = H + Math.sin(a1) * 0.8;
    g.boxR((xa + xb) / 2, (ya + yb) / 2, 0, Math.hypot(xb - xa, yb - ya) + 0.04, 0.08, 0.5, K.bamboo, 0, 0, Math.atan2(yb - ya, xb - xa));
    g.box((xa + xb) / 2, (ya + yb) / 2 + 0.12, (r() - 0.5) * 0.2, 0.44, 0.22, 0.56, i % 2 ? K.leaf : K.leafD);
    if (i % 2) g.box((xa + xb) / 2, (ya + yb) / 2 - 0.06, 0.26, 0.1, 0.12, 0.06, [K.rose, K.white, K.violet][i % 3]);
  }
  for (const sx of [-1, 1]) for (let y = 0.4; y < H; y += 0.5) g.box((sx * S) / 2, y, 0.1 + (r() - 0.5) * 0.1, 0.24, 0.26, 0.5, r() < 0.5 ? K.leaf : K.leafD);
  void f;
}
/** The kiln's woodpile: split logs stacked between stakes, a chopping block. */
function kilnWood(g, f, it) {
  const L = it.len || 2.6;
  f.flat(-L / 2 - 0.4, -0.6, L / 2 + 0.5, 0.8, 0.005, '#DCC8AA');
  for (const sx of [-1, 1]) g.box((sx * L) / 2, 0.7, 0, 0.1, 1.4, 0.1, K.woodD);
  for (let k = 0; k < 5; k++) for (let i = 0; i < Math.round(L / 0.32); i++) {
    const x = -L / 2 + 0.18 + i * 0.32 + (k % 2) * 0.08;
    if (x > L / 2 - 0.12) continue;
    g.box(x, 0.13 + k * 0.25, 0, 0.26, 0.24, 0.7, (i + k) % 3 ? K.wood : K.woodL);
    g.box(x, 0.13 + k * 0.25, 0.355, 0.18, 0.16, 0.01, K.straw);
  }
  g.box(L / 2 + 0.6, 0.22, 0.2, 0.5, 0.44, 0.5, K.woodD);
  g.box(L / 2 + 0.6, 0.45, 0.2, 0.42, 0.02, 0.42, K.straw);
}
/** Stacked paper bales (it.n). */
function bales(g, f, it) {
  const n = it.n || 4, r = rng(it.seed || 3);
  for (let i = 0; i < n; i++) bale(g, (i % 3) * 0.95 - 0.95, Math.floor(i / 3) * 0.5, (r() - 0.5) * 0.1, 0.9, 0.48, 0.62, (r() - 0.5) * 0.12, r() < 0.3 ? K.cream : K.paper);
  f.flat(-1.5, -0.45, 1.5, 0.55, 0.005, SH);
}
/** A heap of crates and pots by a wall. */
function potYard(g, f, it) {
  const r = rng(it.seed || 4);
  potStack(g, -0.8, 0, 3); potStack(g, -0.45, 0.3, 2, K.clay);
  crate(g, 0.2, 0, 0, 0.6, 0.4, 0.45); crate(g, 0.2, 0.4, 0, 0.55, 0.38, 0.42, K.wood);
  for (let i = 0; i < 4; i++) g.box(0.85 + (i % 2) * 0.3, 0.17, (i > 1 ? 0.3 : -0.05), 0.3, 0.34, 0.3, r() < 0.5 ? K.terra : K.potG);
  f.flat(-1.2, -0.4, 1.3, 0.6, 0.005, SH);
}
/** A rain barrel + watering can + coiled hose: a tidy water corner. */
function waterCorner(g, f) {
  waterJar(g, 0, 0, 1.15, '#5E6E66');
  g.box(0.6, 0.15, 0.15, 0.32, 0.3, 0.2, K.tinG); g.boxR(0.82, 0.28, 0.15, 0.3, 0.05, 0.05, K.tinG, 0, 0, 0.6);
  g.box(0.5, 0.36, 0.15, 0.04, 0.12, 0.2, K.tinGD);
  f.flat(-0.5, -0.45, 1.0, 0.5, 0.005, SH);
}
function wheelbarrow(g, f, it) {
  g.box(0, 0.42, 0, 0.7, 0.3, 0.5, it.col || K.teal);
  g.box(0, 0.58, 0, 0.74, 0.04, 0.54, shade(it.col || K.teal, 0.8));
  g.box(0, 0.5, 0, 0.6, 0.06, 0.4, K.soil);
  g.box(0.45, 0.2, 0, 0.36, 0.36, 0.06, K.iron);
  for (const sz of [-0.2, 0.2]) { pole(g, 0.2, 0.36, sz, -0.7, 0.56, sz, 0.04, K.woodD); g.box(-0.25, 0.15, sz, 0.05, 0.3, 0.05, K.woodD); }
  f.flat(-0.8, -0.35, 0.65, 0.35, 0.005, SH);
}
/** A low hand pump on a stone slab, a bucket. */
function pump(g, f) {
  g.box(0, 0.05, 0, 1.0, 0.1, 0.8, K.stone);
  g.box(0, 0.5, -0.15, 0.14, 0.9, 0.14, K.teal);
  g.box(0, 0.88, -0.05, 0.08, 0.06, 0.28, K.teal);
  g.boxR(-0.2, 1.0, -0.15, 0.5, 0.05, 0.05, K.iron, 0, 0, -0.4);
  g.box(0.1, 0.2, 0.2, 0.26, 0.24, 0.26, K.tinD);
  f.flat(-0.5, -0.4, 0.5, 0.4, 0.004, '#DCCDB8');
}
/** A scarecrow (paper hat, longyi, arms out). Tall: north of a lane only. */
function scarecrow(g) {
  g.box(0, 0.9, 0, 0.07, 1.8, 0.07, K.woodD);
  g.box(0, 1.35, 0, 1.2, 0.06, 0.06, K.woodD);
  g.box(0, 1.25, 0, 0.42, 0.5, 0.22, K.mustard);
  for (const sx of [-1, 1]) g.box(sx * 0.42, 1.33, 0, 0.36, 0.14, 0.16, K.mustard);
  g.box(0, 0.82, 0, 0.36, 0.46, 0.2, K.teal);
  g.box(0, 1.7, 0, 0.26, 0.26, 0.24, K.straw);
  g.box(0, 1.9, 0, 0.5, 0.06, 0.44, K.paper); g.box(0, 2.0, 0, 0.26, 0.14, 0.24, K.paper);
  g.box(0.05, 1.72, 0.13, 0.04, 0.04, 0.01, K.ink); g.box(-0.06, 1.72, 0.13, 0.04, 0.04, 0.01, K.ink);
  for (const sx of [-1, 1]) g.box(sx * 0.62, 1.3, 0, 0.1, 0.14, 0.1, K.straw);
}
/** Beehive boxes on a stand (two). */
function hives(g, f) {
  for (const x of [-0.5, 0.5]) {
    g.box(x, 0.2, 0, 0.5, 0.4, 0.5, K.woodD);
    for (let k = 0; k < 3; k++) g.box(x, 0.5 + k * 0.2, 0, 0.56, 0.19, 0.5, k % 2 ? K.white : K.cream);
    g.box(x, 1.12, 0, 0.64, 0.06, 0.58, K.tinG);
    g.box(x, 0.43, 0.26, 0.2, 0.03, 0.02, K.ink);
  }
  f.flat(-0.9, -0.4, 0.95, 0.45, 0.005, SH);
}
/** A clothes line between two bamboo poles. */
function washLine(g, f, it) {
  const L = it.len || 3.2, r = rng(it.seed || 6);
  for (const sx of [-1, 1]) g.box((sx * L) / 2, 0.95, 0, 0.07, 1.9, 0.07, K.bambooD);
  g.box(0, 1.82, 0, L, 0.02, 0.02, K.ink);
  const cols = [K.white, K.rose, K.sky, K.mustard, K.green, K.maroon, '#E9862E'];
  for (let x = -L / 2 + 0.35; x < L / 2 - 0.25; x += 0.5 + r() * 0.15) {
    const w = 0.32 + r() * 0.2, h = 0.4 + r() * 0.35, c = cols[Math.floor(r() * cols.length)];
    g.box(x, 1.8 - h / 2, 0, w, h, 0.03, c);
    if (r() < 0.4) g.box(x, 1.8 - h * 0.7, 0.02, w, 0.06, 0.01, shade(c, 0.8));
  }
  f.flat(-L / 2, -0.25, L / 2, 0.25, 0.004, '#EADFCE');
}
/** A compost bin (slatted box), a fork stuck in it. */
function compost(g, f) {
  for (const sz of [-0.45, 0.45]) g.box(0, 0.35, sz, 1.0, 0.7, 0.06, K.woodG);
  for (const sx of [-0.5, 0.5]) g.box(sx, 0.35, 0, 0.06, 0.7, 0.9, K.woodG);
  g.box(0, 0.62, 0, 0.9, 0.12, 0.84, K.soilD);
  for (let k = 0; k < 4; k++) g.box(-0.3 + k * 0.2, 0.7, -0.2 + (k % 2) * 0.3, 0.16, 0.06, 0.12, k % 2 ? K.leafY : K.strawD);
  pole(g, 0.2, 0.6, 0.1, 0.35, 1.5, 0.1, 0.04, K.woodL);
  f.flat(-0.6, -0.55, 0.65, 0.6, 0.005, SH);
}
/** The last hedge: tall (1.6 m) and clipped, roses on it; it.gap leaves an opening at local gx (where the gravel runs out). */
function lastHedge(g, f, it) {
  const L = it.len, H = 1.6, gx = it.gx ?? null, gw = it.gw || 1.6;
  const parts = gx == null ? [[-L / 2, L / 2]] : [[-L / 2, gx - gw / 2], [gx + gw / 2, L / 2]];
  for (const [a, b] of parts) {
    if (b - a < 0.3) continue;
    const w = b - a, m = (a + b) / 2;
    g.box(m, H / 2, 0, w, H, 1.1, K.leafD);
    for (let x = a + 0.5; x < b - 0.3; x += 1.2) g.box(x, H + 0.08, ((x * 7) % 0.3) - 0.1, 1.0, 0.16, 0.8, K.leaf);
    for (let x = a + 0.3; x < b - 0.2; x += 0.9) g.box(x, 0.6 + ((x * 13) % 0.7), 0.56, 0.5, 0.3, 0.04, K.leaf);
    for (let x = a + 0.8; x < b; x += 2.1) g.box(x, 1.3, 0.57, 0.12, 0.12, 0.04, K.rose);
    f.flat(a - 0.1, -0.7, b + 0.1, 0.9, 0.006, SH);
  }
}
/** The kiln square's paving: a patch of brick-red and ochre setts, swept (ground only). it: { w, d } */
function squarePaving(g, f, it) {
  const W = it.w, D = it.d, r = rng(it.seed || 12);
  f.flat(-W / 2, -D / 2, W / 2, D / 2, 0.0028, '#E7D2B8');
  for (let z = -D / 2 + 0.5; z < D / 2 - 0.3; z += 1.0) for (let x = -W / 2 + 0.5 + ((z * 2) % 1) * 0.5; x < W / 2 - 0.4; x += 1.0) {
    if (r() < 0.55) continue;
    f.flat(x - 0.42, z - 0.4, x + 0.42, z + 0.4, 0.0036, r() < 0.5 ? '#E1C6A6' : '#E9D7BE');
  }
  void g;
}
/** Gravel scattered along a path (ground only). it: { len, ry } */
function gravel(g, f, it) {
  const L = it.len || 8, r = rng(it.seed || 5);
  for (let k = 0; k < L * 4; k++) f.flatR((r() - 0.5) * 2.8, (r() - 0.5) * L, 0.1 + r() * 0.14, 0.08 + r() * 0.1, 0.004 + r() * 0.002, r() < 0.5 ? '#CFC3B2' : '#BDB09D', r() * 3);
  void g;
}
/** A lily pond: water decals in a stone rim, lily pads and flowers, reeds. it: { w, d } */
function pond(g, f, it) {
  const W = it.w, D = it.d, r = rng(it.seed || 8);
  f.flat(-W / 2, -D / 2, W / 2, D / 2, 0.003, K.water);
  f.flat(-W / 2 + 0.6, -D / 2 + 0.5, W / 2 - 0.9, D / 2 - 0.6, 0.0036, '#B6D1DA');
  for (let k = 0; k < 6; k++) f.flatR((r() - 0.5) * (W - 2), (r() - 0.5) * (D - 1.5), 1.2 + r(), 0.05, 0.0042, '#D2E4EA', r() * 0.4);
  // rim stones
  for (let x = -W / 2; x < W / 2; x += 0.62) for (const z of [-D / 2, D / 2]) g.box(x + 0.3, 0.09, z + (r() - 0.5) * 0.06, 0.56, 0.18 + r() * 0.06, 0.42, r() < 0.5 ? K.stone : K.stoneD);
  for (let z = -D / 2 + 0.6; z < D / 2 - 0.3; z += 0.62) for (const x of [-W / 2, W / 2]) g.box(x + (r() - 0.5) * 0.06, 0.09, z, 0.42, 0.18 + r() * 0.06, 0.56, r() < 0.5 ? K.stone : K.stoneD);
  // lily pads and flowers
  for (let k = 0; k < Math.round(W * D / 3); k++) {
    const x = (r() - 0.5) * (W - 1.2), z = (r() - 0.5) * (D - 1.0);
    f.flatR(x, z, 0.5, 0.5, 0.0048, r() < 0.5 ? K.leafL : K.leaf, r() * 3);
    if (r() < 0.35) g.box(x + 0.05, 0.06, z, 0.16, 0.1, 0.16, r() < 0.5 ? K.rose : K.white);
  }
  // reeds in the corners
  for (const [cx, cz] of [[-W / 2 + 0.7, -D / 2 + 0.6], [W / 2 - 0.6, D / 2 - 0.7]]) for (let k = 0; k < 7; k++) g.box(cx + (r() - 0.5) * 0.7, 0.45, cz + (r() - 0.5) * 0.5, 0.04, 0.6 + r() * 0.5, 0.04, k % 2 ? K.leafD : K.leafY);
}
/** A giant fountain pen lying in the grass (the diary's own pen), an ink blot under its nib. */
function bigPen(g, f, it) {
  const L = it.len || 4.4, R = 0.42;
  f.flat(-L / 2 - 0.2, -0.6, L / 2 + 0.4, 0.7, 0.005, SH);
  g.box(-L * 0.12, R, 0, L * 0.62, R * 2, R * 1.7, K.maroon);
  g.box(-L * 0.12, R, 0, L * 0.62, R * 1.6, R * 2.0, K.maroon);
  g.box(L * 0.22, R, 0, 0.18, R * 2.05, R * 2.05, K.gold);
  g.box(-L * 0.43, R, 0, 0.16, R * 2.05, R * 2.05, K.gold);
  g.box(L * 0.3, R * 0.95, 0, L * 0.12, R * 1.6, R * 1.6, K.ink);
  g.boxR(L * 0.42, R * 0.8, 0, L * 0.14, 0.08, R * 1.1, K.gold, 0, 0, -0.18);
  g.box(L * 0.42, R * 0.86, 0, 0.1, 0.1, 0.03, K.ink);
  g.box(-L * 0.12, R * 2.02, R * 0.4, L * 0.4, 0.08, 0.1, K.gold); // the clip
  f.flatR(L * 0.55, 0.15, 1.3, 0.9, 0.006, '#283A5A', 0.3);
  f.flatR(L * 0.68, -0.2, 0.4, 0.3, 0.006, '#283A5A', 0.8);
}
/** A pressed flower lying flat on the page (ground decals), its stem and two leaves. */
function pressedFlower(g, f, it) {
  const r = rng(it.seed || 3), c = it.col || K.rose, S = it.s || 1;
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; f.flatR(Math.cos(a) * 0.55 * S, Math.sin(a) * 0.55 * S, 0.9 * S, 0.55 * S, 0.0045 + k * 0.0002, k % 2 ? c : shade(c, 0.92), -a); }
  f.flatR(0, 0, 0.4 * S, 0.4 * S, 0.006, K.mustard);
  f.flatR(0, 1.6 * S, 0.12 * S, 2.2 * S, 0.0042, '#9DB27C', 0.15);
  for (const sx of [-1, 1]) f.flatR(sx * 0.45 * S, 1.7 * S, 0.8 * S, 0.34 * S, 0.0043, '#A9BE88', sx * 0.6 + r() * 0.1);
  void g;
}
/** A ribbon bookmark lying across the grass, forked at its end. */
function ribbonMark(g, f, it) {
  const L = it.len || 7;
  f.flat(-L / 2, -0.32, L / 2, 0.32, 0.0045, '#8C2A38');
  f.flat(-L / 2, -0.24, L / 2, -0.2, 0.005, '#C9A24A'); f.flat(-L / 2, 0.2, L / 2, 0.24, 0.005, '#C9A24A');
  f.flatR(L / 2 + 0.25, 0.16, 0.6, 0.3, 0.0045, '#8C2A38', 0.5); f.flatR(L / 2 + 0.25, -0.16, 0.6, 0.3, 0.0045, '#8C2A38', -0.5);
  void g;
}
/** A flower border (low): a strip of blooms along a kerb or wall. it: { len } */
function flowerBorder(g, f, it) {
  const L = it.len || 4, r = rng(it.seed || 2), cols = it.cols || [K.rose, K.mustard, K.white, K.orange, K.violet];
  for (let x = -L / 2 + 0.2; x < L / 2 - 0.1; x += 0.34) {
    const h = 0.18 + r() * 0.18;
    g.box(x, h / 2, (r() - 0.5) * 0.2, 0.26, h, 0.24, r() < 0.5 ? K.leaf : K.leafD);
    if (r() < 0.7) g.box(x + 0.02, h + 0.05, (r() - 0.5) * 0.15, 0.14, 0.08, 0.14, cols[Math.floor(r() * cols.length)]);
  }
  f.flat(-L / 2, -0.3, L / 2, 0.3, 0.0045, '#DCCBB0');
}
/** A nameboard on two posts (canvas sign): the lane names, the garden's welcome board. it.lines, it.w */
function nameBoard(g, f, it, ctx) {
  const W = it.w || 1.8, H = it.h || 0.6, Y = it.y || 1.25;
  for (const sx of [-1, 1]) { g.box((sx * W) / 2, Y / 2 + H / 2, 0, 0.09, Y + H, 0.09, K.woodD); g.box((sx * W) / 2, Y + H + 0.06, 0, 0.14, 0.06, 0.14, K.gold); }
  g.box(0, Y + H / 2, -0.03, W + 0.06, H + 0.06, 0.05, K.woodD);
  ctx.signs.push({ x: 0, y: Y + H / 2, z: 0.0, w: W - 0.04, h: H - 0.04, lines: it.lines, bg: it.bg || '#FBF6EA', border: it.border === undefined ? '#6E1F2A' : it.border, width: it.pw || 512, height: it.ph || 170 });
  flowerBorderAt(g, 0, 0.35, W * 0.8);
  void f;
}
function flowerBorderAt(g, x0, z0, L) {
  for (let x = -L / 2; x < L / 2; x += 0.36) { g.box(x0 + x, 0.12, z0, 0.26, 0.24, 0.22, K.leafD); g.box(x0 + x, 0.27, z0, 0.12, 0.07, 0.12, (Math.round(x * 3) % 2) ? K.rose : K.mustard); }
}
/** A low plot-side hedge (0.9 m). it: { len } (runs along X) */
function lowHedge(g, f, it) {
  const L = it.len;
  g.box(0, 0.42, 0, L, 0.84, 0.7, K.leafB);
  for (let x = -L / 2 + 0.4; x < L / 2 - 0.2; x += 1.0) g.box(x, 0.9, ((x * 5) % 0.2) - 0.05, 0.8, 0.12, 0.5, K.leaf);
  f.flat(-L / 2, -0.4, L / 2, 0.55, 0.005, SH);
}
/** A low stone kerb with a little ledge of potted herbs (south of a lane: under knee height). */
function herbLedge(g, f, it) {
  const L = it.len || 3, r = rng(it.seed || 4);
  g.box(0, 0.16, 0, L, 0.32, 0.4, K.stone);
  for (let x = -L / 2 + 0.25; x < L / 2 - 0.1; x += 0.42) potPlant(g, x, (r() - 0.5) * 0.1, 0.62, r() < 0.4 ? [K.rose, K.mustard, K.white][Math.floor(r() * 3)] : null, 0.32, r() < 0.5 ? K.terra : K.clay);
  f.flat(-L / 2, -0.3, L / 2, 0.35, 0.005, SH);
}
/** A low hen coop (0.9 m) with hens round it. */
function coop(g, f, it) {
  const r = rng(it.seed || 7);
  g.box(0, 0.45, 0, 1.2, 0.6, 0.8, K.woodG);
  g.boxR(0, 0.86, 0, 1.4, 0.06, 1.0, K.tinD, 0.2, 0, 0);
  g.box(0.3, 0.38, 0.41, 0.3, 0.32, 0.02, K.ink);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * 0.55, 0.08, sz * 0.35, 0.08, 0.16, 0.08, K.woodD);
  for (let k = 0; k < 3; k++) {
    const x = (r() - 0.5) * 2.2, z = 0.8 + r() * 0.8, c = k === 1 ? '#8E4A2C' : K.white, ry = r() * 6;
    g.box(x, 0.2, z, 0.3, 0.22, 0.2, c, ry); g.box(x + Math.sin(ry) * 0.14, 0.34, z + Math.cos(ry) * 0.14, 0.12, 0.14, 0.12, c, ry);
    g.box(x + Math.sin(ry) * 0.2, 0.42, z + Math.cos(ry) * 0.2, 0.05, 0.06, 0.05, K.red, ry);
  }
  f.flat(-0.8, -0.55, 0.85, 0.6, 0.005, SH);
}
/** A cat asleep on a sack (a lived-in touch). */
function sackCat(g, f) {
  g.box(0, 0.16, 0, 0.7, 0.32, 0.5, K.strawD);
  g.box(0.05, 0.38, 0, 0.36, 0.14, 0.24, '#E9862E');
  g.box(0.24, 0.42, 0.02, 0.14, 0.12, 0.14, '#E9862E');
  for (const dz of [-0.04, 0.06]) g.box(0.27, 0.5, dz, 0.04, 0.04, 0.03, '#C8692A');
  g.box(-0.16, 0.34, 0.1, 0.24, 0.05, 0.05, '#C8692A');
  f.flat(-0.45, -0.32, 0.45, 0.35, 0.005, SH);
}
/** A bicycle against something, with a basket (low). */
function bike(g, f, it) {
  const col = it.col || K.teal;
  const wheel = (x) => { for (const [w, h] of [[0.6, 0.05], [0.05, 0.6]]) g.box(x, 0.32, 0, w, h, 0.04, K.ink); g.box(x, 0.32, 0, 0.42, 0.42, 0.02, '#8E8173'); };
  wheel(-0.5); wheel(0.5);
  pole(g, -0.5, 0.32, 0, 0.0, 0.62, 0, 0.05, col); pole(g, 0.5, 0.32, 0, 0.0, 0.62, 0, 0.05, col); pole(g, 0.0, 0.62, 0, 0.42, 0.78, 0, 0.05, col);
  g.box(-0.15, 0.78, 0, 0.24, 0.05, 0.12, K.ink);
  g.box(0.5, 0.86, 0, 0.32, 0.05, 0.04, K.ink);
  g.box(0.62, 0.72, 0, 0.3, 0.24, 0.3, K.bamboo);
  f.flat(-0.85, -0.2, 0.85, 0.25, 0.005, SH);
}

export const GARDEN_ART = {
  gdKilnShed: { draw: kilnShed, h: 8.2, map: true, obstacles: (it) => {
    const W = it.w, D = it.d, BX0 = W / 2 - 4.3;
    return [obBox(it, -W / 2, -D / 2, W / 2, -D / 2 + 0.35), obBox(it, -W / 2, -D / 2, -W / 2 + 0.35, D / 2 - 0.1), obBox(it, BX0, -D / 2, W / 2, D / 2), obCircle(it, -2.2, -1.0, 2.25),
      obBox(it, -W / 2 + 0.4, -D / 2 + 1.4, -W / 2 + 1.1, D / 2 - 1.4), obBox(it, -6.6, 2.2, -4.5, 3.8)];
  } },
  gdPaperStore: { draw: paperStore, h: 6.8, map: true, obstacles: (it) => {
    const W = it.w, D = it.d, DX = it.doorX ?? -1.2;
    return [obBox(it, -W / 2, -D / 2, W / 2, D / 2), obBox(it, W / 2, D / 2 - 3.5, W / 2 + 1.05, D / 2 + 0.75), obBox(it, -W / 2, -D / 2 - 3.0, 0, -D / 2), obCircle(it, DX + 1.8 + 0.3, D / 2 + 2.3, 0.1), obCircle(it, W / 2 - 0.1, D / 2 + 2.3, 0.1)];
  } },
  gdTeaShop: { draw: teaShop, h: 4.1, map: true, obstacles: (it) => [obBox(it, -it.w / 2, -it.d / 2, it.w / 2, it.d / 2), obBox(it, 0.2, it.d / 2 + 0.6, 3.5, it.d / 2 + 1.6), obCircle(it, (it.doorX ?? -1.5) - 1.0, it.d / 2 + 0.6, 0.3), obBox(it, -it.w / 2 - 0.8, -2.4, -it.w / 2, -1.6)] },
  gdDryingHall: { draw: dryingHall, h: 4.2, map: true, obstacles: (it) => [obBox(it, -it.w / 2, -it.d / 2, it.w / 2, it.d / 2), obBox(it, -it.w / 2 + 0.5, it.d / 2 + 0.45, -it.w / 2 + 3.9, it.d / 2 + 1.15), obBox(it, it.w / 2 - 3.9, it.d / 2 + 0.45, it.w / 2 - 0.5, it.d / 2 + 1.15)] },
  gdCommittee: { draw: committeeLean, h: 3.6, map: true, obstacles: (it) => [obBox(it, -it.w / 2, -it.d / 2, it.w / 2, it.d / 2), obBox(it, 0.62, it.d / 2, 1.98, it.d / 2 + 0.4)] },
  gdGardenHouse: { draw: gardenHouse, h: 3.7, map: true, obstacles: (it) => [obBox(it, -it.w / 2, -it.d / 2, it.w / 2, it.d / 2), obCircle(it, it.w / 2 + 0.4, it.d / 2 - 0.5, 0.35)] },
  gdGourdHouse: { draw: gourdHouse, h: 4.0, map: true, obstacles: (it) => [obBox(it, -it.w / 2, -it.d / 2, it.w / 2, it.d / 2), obCircle(it, -it.w / 2 + 0.45, it.d / 2 + 0.55, 0.35), obCircle(it, it.w / 2 - 0.4, it.d / 2 + 0.6, 0.25), obBox(it, -it.w / 2 - 0.55, -1.3, -it.w / 2, 0.1)] },
  gdCottage: { draw: cottage, h: 3.9, map: true },
  gdSeedHouse: { draw: seedHouse, h: 3.3, map: true },
  gdShade: { draw: shadeFrame, h: 2.5, obstacles: (it) => [-1, 1].map((s) => obBox(it, -it.w / 2 + 0.35, s * it.d / 4 - 0.38, it.w / 2 - 0.35, s * it.d / 4 + 0.38)) },
  gdStall: { draw: stall, h: 2.1, obstacles: (it) => [obBox(it, -(it.w || 2) / 2, -0.45, (it.w || 2) / 2, 0.5)] },
};
export const GARDEN_PROP = {
  gdFence: { draw: plotFence, obstacles: (it) => {
    const L = it.len, gx = it.gx ?? null, gw = it.gw || 1.2;
    const parts = gx == null ? [[-L / 2, L / 2]] : [[-L / 2, gx - gw / 2], [gx + gw / 2, L / 2]];
    const out = parts.filter(([a, b]) => b - a > 0.1).map(([a, b]) => obBox(it, a, -0.1, b, 0.12));
    if (gx != null && (it.leaf === 'closed' || it.leaf === 'ajar' || it.shut)) out.push(obBox(it, gx - gw / 2, -0.1, gx + gw / 2, 0.12));
    return out;
  } },
  gdLaneBench: { draw: laneBench, obstacles: (it) => [obBox(it, -0.85, -0.2, 0.85, 0.2)] },
  gdLongBench: { draw: longBench, obstacles: (it) => [obBox(it, -(it.len || 2.4) / 2, -0.25, (it.len || 2.4) / 2, 0.25)] },
  gdBed: { draw: bedProp, obstacles: (it) => [obBox(it, -(it.w || 3) / 2, -(it.d || 1.2) / 2, (it.w || 3) / 2, (it.d || 1.2) / 2)] },
  gdLowTrellis: { draw: lowTrellis, obstacles: () => [] },
  gdBeanPoles: { draw: beanPoles, obstacles: (it) => [obBox(it, -(it.len || 4) / 2, -0.45, (it.len || 4) / 2, 0.45)] },
  gdRoadArch: { draw: roadArch, obstacles: (it) => [-1, 1].map((s) => obCircle(it, (s * (it.span || 4.2)) / 2, 0, 0.18)) },
  gdKilnWood: { draw: kilnWood, obstacles: (it) => [obBox(it, -(it.len || 2.6) / 2 - 0.05, -0.38, (it.len || 2.6) / 2 + 0.05, 0.38), obCircle(it, (it.len || 2.6) / 2 + 0.6, 0.2, 0.3)] },
  gdBales: { draw: bales, obstacles: (it) => [obBox(it, -1.45, -0.35, 1.45, 0.35)] },
  gdPotYard: { draw: potYard, obstacles: (it) => [obBox(it, -1.0, -0.3, 1.25, 0.5)] },
  gdWater: { draw: waterCorner, obstacles: (it) => [obCircle(it, 0, 0, 0.4), obCircle(it, 0.6, 0.15, 0.2)] },
  gdBarrow: { draw: wheelbarrow, obstacles: (it) => [obBox(it, -0.75, -0.3, 0.6, 0.3)] },
  gdPump: { draw: pump, obstacles: (it) => [obBox(it, -0.5, -0.4, 0.5, 0.4)] },
  gdScarecrow: { draw: scarecrow, r: 0.3 },
  gdHives: { draw: hives, obstacles: (it) => [obBox(it, -0.85, -0.35, 0.85, 0.35)] },
  gdWash: { draw: washLine, obstacles: (it) => [-1, 1].map((s) => obCircle(it, (s * (it.len || 3.2)) / 2, 0, 0.12)) },
  gdCompost: { draw: compost, obstacles: (it) => [obBox(it, -0.55, -0.5, 0.55, 0.5)] },
  gdLastHedge: { draw: lastHedge, obstacles: (it) => {
    const L = it.len, gx = it.gx ?? null, gw = it.gw || 1.6;
    const parts = gx == null ? [[-L / 2, L / 2]] : [[-L / 2, gx - gw / 2], [gx + gw / 2, L / 2]];
    return parts.filter(([a, b]) => b - a > 0.3).map(([a, b]) => obBox(it, a, -0.55, b, 0.55));
  } },
  gdPaving: { draw: squarePaving, obstacles: () => [] },
  gdGravel: { draw: gravel, obstacles: () => [] },
  gdPond: { draw: pond, obstacles: (it) => [obBox(it, -it.w / 2, -it.d / 2, it.w / 2, it.d / 2)] },
  gdPen: { draw: bigPen, obstacles: (it) => [obBox(it, -(it.len || 4.4) / 2, -0.45, (it.len || 4.4) / 2 * 0.85, 0.45)] },
  gdPressed: { draw: pressedFlower, obstacles: () => [] },
  gdRibbon: { draw: ribbonMark, obstacles: () => [] },
  gdBorder: { draw: flowerBorder, obstacles: () => [] },
  gdNameBoard: { draw: nameBoard, obstacles: (it) => [-1, 1].map((s) => obCircle(it, (s * (it.w || 1.8)) / 2, 0, 0.12)) },
  gdLowHedge: { draw: lowHedge, obstacles: (it) => [obBox(it, -it.len / 2, -0.35, it.len / 2, 0.35)] },
  gdHerbLedge: { draw: herbLedge, obstacles: (it) => [obBox(it, -(it.len || 3) / 2, -0.2, (it.len || 3) / 2, 0.2)] },
  gdCoop: { draw: coop, obstacles: (it) => [obBox(it, -0.65, -0.45, 0.65, 0.45)] },
  gdCat: { draw: sackCat, obstacles: (it) => [obBox(it, -0.35, -0.25, 0.35, 0.25)] },
  gdBike: { draw: bike, obstacles: (it) => [obBox(it, -0.85, -0.15, 0.85, 0.15)] },
};
