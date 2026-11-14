// Diary Garden street life (district 6): the small things people leave out where they grow, sell and live, and the
// worn ground between them, so the Garden reads lived-in from the low close camera and not like bare paper.
// Kinds registered by regions/garden.js (PROP / ART); `fillLife(add)` lays them (called from regions/garden.js after
// its own buildings, so it can read them). Same kit as ../art/garden.js: outlined boxes (kit.js Geo), item-local,
// feet at y = 0, fronts face +Z; flat ground decals on f (no outline, two triangles each).
// South of a lane only low things (under ~1.3 m), so nothing hides Maya from the follow camera; nothing points the way.
//
// Ground (flat, walk-through):
//   gdVerge { len, d, seed }          a grass verge strip along a kerb: patchy greens, a few tufts
//   gdKerbDrain { len, gaps }         the kerb drain: a dark channel with plank crossings at gx in gaps
//   gdStones { len, seed }            stepping stones from a gate to the kerb (along local z)
//   gdMeadow { w, d, seed }           a rough patch of grass and clover on the page, wild flowers
//   gdFootpath { len, w, seed }       a worn earth footpath across the grass (along local x)
//   gdHopscotch                       a chalked hopscotch on the kerb
// Props:
//   gdWaterPots { sign }              a roofed shelf of clay drinking-water pots and a cup, for anyone passing
//   gdVegTable { seed, sign }         a low trestle table of produce in baskets, a stool, a little scale
//   gdDryMat { load, seed }           a woven mat drying in the sun: 'chilli' | 'beans' | 'seeds', a sieve tray
//   gdPotRow { len, seed }            a row of terracotta pots with plants along a kerb or a fence
//   gdSeedTrays { seed, sign }        seedling trays on two trestles
//   gdWaterButt                       a rain barrel with a dipper, a watering can
//   gdToolRack                        a hoe, a rake and a spade on a short rack, a bucket
//   gdHay { s }                       a straw stack round a pole
//   gdBambooFence { len, gx, gw, h }  a light bamboo fence (posts and two rails), a gap at gx
//   gdBuckets { seed }                a flower seller's tin buckets of cut flowers
//   gdCrates { n, seed }              produce crates stacked by a stall
// Art:
//   gdFieldHut { seed }               a small bamboo field hut on short stilts, open front, a mat and a pot (h 2.7)
// Every Burmese string here is a draft for Maya.
import { rng, shade } from '../kit.js';

const K = {
  ink: '#2A2118', iron: '#4A3B30', wood: '#B58A5A', woodD: '#7A5434', woodL: '#CDA577', woodG: '#9E8A70',
  bamboo: '#C9B26B', bambooD: '#9C8540', bambooL: '#DCC98A', thatch: '#D2B46A', thatchD: '#B39350',
  clay: '#B9653F', clayL: '#CF8156', clayD: '#8C4A2C', terra: '#B5643C', terraD: '#8E4A2C',
  leaf: '#6F9E5B', leafD: '#4F7F43', leafL: '#8DBA6E', leafY: '#A8C46A',
  soil: '#8A6648', soilD: '#6E5038', straw: '#E2C77A', strawD: '#C9A85A', mat: '#D9BE82', matD: '#B99A5E',
  chilli: '#C8323C', chilliD: '#9A2228', bean: '#E2B33C', beanD: '#B98C24', seed: '#9A7B54', seedL: '#C9A877',
  white: '#FFFDF8', cream: '#F3E9D6', rose: '#E8A0A8', mustard: '#E2B33C', orange: '#E9862E', violet: '#B9A3D6',
  tin: '#A9B4B8', tinD: '#8B979C', tinG: '#6E9A7A', teal: '#4E8C86', maroon: '#6E1F2A', gourd: '#A9C27A', egg: '#F1E6CF',
  grass: '#D7DDB4', grassL: '#E2E3C0', grassD: '#C3CF9C', clover: '#B9CB8E', path: '#E3D2B6', pathD: '#D6C2A2',
  drain: '#9E8E7A', drainD: '#857562', chalk: '#FFFFFF', stone: '#CFC4B2', stoneD: '#B3A794',
};
const SH = '#E9DCCB';

/** World-space keep-out box for an item-local w x d rect centred at (cx, cz), turned with the item. */
const box = (w, d, cx = 0, cz = 0) => (it) => {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const X = it.x + cx * c + cz * s, Z = it.z - cx * s + cz * c;
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return [{ type: 'box', minX: X - hw, maxX: X + hw, minZ: Z - hd, maxZ: Z + hd }];
};
const none = () => [];

/** A pole between two item-local points, as one turned box. */
function pole(g, x0, y0, z0, x1, y1, z1, t = 0.06, col = K.bamboo) {
  const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, L = Math.hypot(dx, dy, dz);
  const ry = Math.atan2(-dz, dx), rz = Math.atan2(dy, Math.hypot(dx, dz));
  g.boxR((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, L, t, t, col, 0, ry, rz); // (a box long along x: tilted, then turned)
}
function pot(g, x, y, z, s, col = K.clay) {
  g.box(x, y + s * 0.28, z, s * 0.78, s * 0.56, s * 0.78, col);
  g.box(x, y + s * 0.6, z, s * 0.56, s * 0.12, s * 0.56, shade(col, 0.82));
}
function sign(ctx, x, y, z, my, en, w = 1.1, h = 0.4, ry = 0, bg = '#F6F0E2') {
  ctx.signs.push({ x, y, z, ry, w, h, lines: [{ text: my, size: 44 }, { text: en, size: 22, font: 'serif', weight: 600, color: '#6E1F2A' }], bg, width: 448, height: 164 });
}

// ---------------------------------------------------------------------------------
// ground
// ---------------------------------------------------------------------------------
function verge(g, f, it) {
  const L = it.len || 6, D = it.d || 2.4, r = rng(it.seed || 5);
  f.flat(-L / 2, -D / 2, L / 2, D / 2, 0.006, K.grass);
  for (let x = -L / 2 + 0.2; x < L / 2 - 0.3;) {
    const w = 0.5 + r() * 1.4, z0 = -D / 2 + r() * D * 0.5, d = 0.3 + r() * D * 0.45;
    f.flat(x, z0, Math.min(x + w, L / 2), Math.min(z0 + d, D / 2), 0.008, r() < 0.5 ? K.grassD : K.grassL);
    x += w + r() * 0.8;
  }
  // a ragged front edge (the kerb side, local -z) and some tufts
  for (let x = -L / 2; x < L / 2 - 0.2; x += 0.35 + r() * 0.5) f.flat(x, -D / 2 - 0.08 - r() * 0.1, x + 0.2 + r() * 0.2, -D / 2 + 0.02, 0.006, K.grass);
  const n = Math.max(2, Math.round(L / 2.2));
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + 0.4 + r() * (L - 0.8), z = -D / 2 + 0.3 + r() * (D - 0.6);
    g.box(x, 0.07, z, 0.16, 0.14, 0.12, r() < 0.5 ? K.leaf : K.leafL);
    if (r() < 0.45) g.box(x + 0.05, 0.17, z, 0.05, 0.05, 0.05, [K.white, K.mustard, K.rose, K.violet][Math.floor(r() * 4)]);
  }
}
function kerbDrain(g, f, it) {
  const L = it.len || 10, gaps = it.gaps || [];
  f.flat(-L / 2, -0.17, L / 2, 0.17, 0.007, K.drain);
  f.flat(-L / 2, -0.07, L / 2, 0.07, 0.009, K.drainD);
  for (const gx of gaps) {
    if (gx < -L / 2 || gx > L / 2) continue;
    g.box(gx, 0.03, 0, 0.9, 0.06, 0.52, K.woodL);
    g.box(gx, 0.065, 0, 0.9, 0.01, 0.02, K.woodD);
  }
}
function stones(g, f, it) {
  const L = it.len || 3, r = rng(it.seed || 3);
  for (let z = -L / 2 + 0.25, k = 0; z < L / 2; z += 0.62, k++) {
    const dx = (k % 2 ? 0.12 : -0.1) + (r() - 0.5) * 0.08, w = 0.5 + r() * 0.12, d = 0.36 + r() * 0.08;
    f.flat(dx - w / 2 - 0.04, z - d / 2 - 0.04, dx + w / 2 + 0.04, z + d / 2 + 0.04, 0.009, K.stoneD);
    f.flat(dx - w / 2, z - d / 2, dx + w / 2, z + d / 2, 0.011, K.stone);
  }
}
function meadow(g, f, it) {
  const W = it.w || 8, D = it.d || 6, r = rng(it.seed || 9);
  // a rough oval of overlapping strips
  const rows = Math.max(3, Math.round(D / 0.9));
  for (let i = 0; i < rows; i++) {
    const t = (i + 0.5) / rows, half = (W / 2) * Math.sqrt(Math.max(0.05, 1 - (2 * t - 1) ** 2)) * (0.85 + r() * 0.25);
    const z0 = -D / 2 + (i * D) / rows, z1 = z0 + D / rows + 0.05, x0 = -half + (r() - 0.5) * 0.6;
    f.flat(x0, z0, half + (r() - 0.5) * 0.6, z1, 0.005, i % 2 ? K.grass : K.grassL);
  }
  for (let k = 0; k < Math.round((W * D) / 6); k++) {
    const x = (r() - 0.5) * W * 0.8, z = (r() - 0.5) * D * 0.8, s = 0.4 + r() * 0.9;
    f.flat(x - s / 2, z - s / 3, x + s / 2, z + s / 3, 0.007, r() < 0.5 ? K.clover : K.grassD);
  }
  for (let k = 0; k < Math.round((W * D) / 10); k++) {
    const x = (r() - 0.5) * W * 0.75, z = (r() - 0.5) * D * 0.75;
    f.flat(x - 0.06, z - 0.06, x + 0.06, z + 0.06, 0.009, [K.white, K.mustard, K.rose, K.violet][Math.floor(r() * 4)]);
  }
  const n = Math.max(2, Math.round((W * D) / 14));
  for (let k = 0; k < n; k++) {
    const x = (r() - 0.5) * W * 0.7, z = (r() - 0.5) * D * 0.7;
    g.box(x, 0.09, z, 0.2, 0.18, 0.16, r() < 0.5 ? K.leaf : K.leafL);
  }
}
function footpath(g, f, it) {
  const L = it.len || 8, W = it.w || 0.9, r = rng(it.seed || 4);
  for (let x = -L / 2; x < L / 2;) {
    const s = 0.8 + r() * 1.2, dz = (r() - 0.5) * 0.2;
    f.flat(x, -W / 2 + dz, Math.min(x + s + 0.1, L / 2), W / 2 + dz, 0.008, K.path);
    if (r() < 0.6) f.flat(x + s * 0.2, -W * 0.18 + dz, x + s * 0.7, W * 0.12 + dz, 0.01, K.pathD);
    x += s;
  }
}
function hopscotch(g, f) {
  const sq = (cx, cz, s = 0.48) => {
    f.flat(cx - s / 2, cz - s / 2, cx + s / 2, cz - s / 2 + 0.04, 0.012, K.chalk);
    f.flat(cx - s / 2, cz + s / 2 - 0.04, cx + s / 2, cz + s / 2, 0.012, K.chalk);
    f.flat(cx - s / 2, cz - s / 2, cx - s / 2 + 0.04, cz + s / 2, 0.012, K.chalk);
    f.flat(cx + s / 2 - 0.04, cz - s / 2, cx + s / 2, cz + s / 2, 0.012, K.chalk);
  };
  sq(0, 0); sq(-0.25, -0.5); sq(0.25, -0.5); sq(0, -1.0); sq(-0.25, -1.5); sq(0.25, -1.5); sq(0, -2.0);
  g.box(0.3, 0.02, 0.3, 0.08, 0.04, 0.08, K.stoneD); // the throwing stone
}

// ---------------------------------------------------------------------------------
// props
// ---------------------------------------------------------------------------------
function waterPots(g, f, it, ctx) {
  // a small roofed shelf on four posts: two (or three) clay pots with wooden lids, a tin cup on a hook
  for (const sx of [-0.75, 0.75]) for (const sz of [-0.3, 0.3]) g.box(sx, 0.75, sz, 0.08, 1.5, 0.08, K.woodD);
  g.box(0, 0.62, 0, 1.6, 0.07, 0.7, K.wood);
  for (const sz of [-1, 1]) g.boxR(0, 1.61, sz * 0.3, 1.9, 0.06, 0.66, sz < 0 ? shade(K.tinG, 0.88) : K.tinG, sz * 0.24, 0, 0);
  g.box(0, 1.69, 0, 1.92, 0.05, 0.08, shade(K.tinG, 0.7));
  const n = it.n || 2;
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.62;
    g.box(x, 0.88, 0, 0.46, 0.44, 0.46, K.clay); g.box(x, 0.88, 0, 0.52, 0.2, 0.52, K.clayL);
    g.box(x, 1.14, 0, 0.3, 0.08, 0.3, K.clayD); g.box(x, 1.19, 0, 0.4, 0.03, 0.4, K.woodL);
  }
  g.box(0.72, 1.12, 0.33, 0.1, 0.12, 0.1, K.tin);
  if (it.sign) sign(ctx, 0, 1.38, 0.38, 'ရေသောက်ရန်', 'drinking water', 0.9, 0.32);
  f.flat(-0.95, -0.5, 0.95, 0.55, 0.005, SH);
}
function vegTable(g, f, it, ctx) {
  const r = rng(it.seed || 7);
  for (const sx of [-0.72, 0.72]) for (const sz of [-0.28, 0.28]) g.box(sx, 0.34, sz, 0.07, 0.68, 0.07, K.woodD);
  g.box(0, 0.7, 0, 1.7, 0.06, 0.72, K.woodL);
  const loads = [[K.gourd, 0.34], [K.chilli, 0.2], [K.leaf, 0.26], [K.egg, 0.18], [K.orange, 0.22], [K.leafY, 0.24]];
  for (let i = 0; i < 3; i++) {
    const x = -0.52 + i * 0.52, [col, h] = loads[Math.floor(r() * loads.length)];
    g.box(x, 0.8, 0.02, 0.44, 0.14, 0.44, K.bambooL);
    g.box(x, 0.88 + h / 2 - 0.05, 0.02, 0.36, h, 0.36, col);
    if (r() < 0.6) g.box(x + 0.08, 0.92 + h, 0.05, 0.12, 0.08, 0.12, shade(col, 0.85));
  }
  // a little brass hand-scale at the end and a stool behind
  g.box(0.95, 0.76, 0.1, 0.06, 0.12, 0.06, K.iron); g.box(0.95, 0.84, 0.1, 0.3, 0.03, 0.2, K.mustard);
  g.box(0, 0.16, -0.7, 0.4, 0.06, 0.34, K.teal); for (const sx of [-0.15, 0.15]) g.box(sx, 0.07, -0.7, 0.05, 0.14, 0.28, shade(K.teal, 0.8));
  // a crate of more under the table
  g.box(-0.4, 0.17, 0, 0.6, 0.34, 0.5, K.woodG); g.box(-0.4, 0.36, 0, 0.5, 0.05, 0.4, K.leafD);
  if (it.sign) sign(ctx, 0, 1.08, 0.38, it.sign[0], it.sign[1], 1.0, 0.36);
  f.flat(-1.0, -0.95, 1.05, 0.55, 0.005, SH);
}
function dryMat(g, f, it) {
  const r = rng(it.seed || 3), load = it.load || 'chilli';
  const [c1, c2] = load === 'beans' ? [K.bean, K.beanD] : load === 'seeds' ? [K.seed, K.seedL] : [K.chilli, K.chilliD];
  g.box(0, 0.015, 0, 1.8, 0.03, 1.2, K.mat);
  for (let x = -0.8; x < 0.85; x += 0.2) f.flat(x, -0.6, x + 0.05, 0.6, 0.034, K.matD);
  for (let k = 0; k < 26; k++) {
    const x = (r() - 0.5) * 1.5, z = (r() - 0.5) * 0.95, s = 0.07 + r() * 0.06;
    f.flat(x - s, z - s / 2, x + s, z + s / 2, 0.036, r() < 0.5 ? c1 : c2);
  }
  // a round sieve tray (a flat box) at the corner with a heap on it
  g.box(1.15, 0.05, 0.35, 0.6, 0.06, 0.6, K.bambooD); g.box(1.15, 0.1, 0.35, 0.34, 0.06, 0.34, c1);
}
function potRow(g, f, it) {
  const L = it.len || 3, r = rng(it.seed || 2);
  const fl = [null, K.rose, K.mustard, K.white, K.orange, K.violet, null];
  for (let x = -L / 2 + 0.25; x <= L / 2 - 0.2; x += 0.5 + r() * 0.12) {
    const s = 0.7 + r() * 0.45, col = r() < 0.75 ? K.terra : K.tinG;
    pot(g, x, 0, (r() - 0.5) * 0.12, 0.5 * s, col);
    const tall = r() < 0.3;
    g.box(x, 0.36 * s + (tall ? 0.2 : 0.08) * s, 0, 0.34 * s, (tall ? 0.48 : 0.26) * s, 0.3 * s, r() < 0.5 ? K.leaf : K.leafD);
    const c = fl[Math.floor(r() * fl.length)];
    if (c) g.box(x + 0.04, 0.36 * s + (tall ? 0.48 : 0.24) * s, 0.04, 0.14 * s, 0.09 * s, 0.14 * s, c);
  }
}
function seedTrays(g, f, it, ctx) {
  const r = rng(it.seed || 11);
  for (const sx of [-0.85, 0.85]) {
    for (const sz of [-0.3, 0.3]) g.boxR(sx, 0.32, sz, 0.06, 0.66, 0.06, K.woodD, sz < 0 ? 0.12 : -0.12, 0, 0);
  }
  g.box(0, 0.64, 0, 2.1, 0.05, 0.8, K.woodG);
  for (let i = 0; i < 3; i++) {
    const x = -0.7 + i * 0.7;
    g.box(x, 0.71, 0, 0.62, 0.08, 0.7, K.terraD);
    for (let j = 0; j < 3; j++) g.box(x, 0.8 + r() * 0.04, -0.22 + j * 0.22, 0.54, 0.08 + r() * 0.06, 0.1, j % 2 ? K.leafL : K.leaf);
  }
  // two more trays on the ground below
  for (const x of [-0.45, 0.4]) { g.box(x, 0.05, 0.05, 0.6, 0.1, 0.6, K.terraD); g.box(x, 0.13, 0.05, 0.5, 0.06, 0.5, K.leafY); }
  if (it.sign) sign(ctx, 0, 1.12, 0.42, it.sign[0], it.sign[1], 1.0, 0.36);
  f.flat(-1.1, -0.55, 1.1, 0.6, 0.005, SH);
}
function waterButt(g, f) {
  g.box(0, 0.42, 0, 0.62, 0.84, 0.62, K.woodG);
  for (const y of [0.16, 0.68]) g.box(0, y, 0, 0.66, 0.06, 0.66, K.iron);
  g.box(0, 0.85, 0, 0.5, 0.02, 0.5, '#8FB3C2');
  pole(g, 0.1, 0.85, 0.05, 0.25, 1.15, 0.2, 0.04, K.bambooD); g.box(0.25, 1.15, 0.2, 0.14, 0.08, 0.14, K.clayD);
  g.box(0.62, 0.15, 0.2, 0.34, 0.3, 0.2, K.tinG); g.boxR(0.85, 0.27, 0.2, 0.32, 0.05, 0.05, K.tinG, 0, 0, 0.6);
  f.flat(-0.45, -0.45, 1.0, 0.5, 0.005, SH);
}
function toolRack(g, f) {
  for (const sx of [-0.55, 0.55]) g.box(sx, 0.55, 0, 0.08, 1.1, 0.08, K.woodD);
  g.box(0, 1.0, 0, 1.25, 0.06, 0.06, K.woodD);
  // hoe, rake, spade leaning on the rail
  pole(g, -0.35, 0.02, 0.32, -0.35, 1.25, 0.04, 0.045, K.woodL); g.box(-0.35, 0.06, 0.34, 0.3, 0.1, 0.04, K.iron);
  pole(g, 0.0, 0.02, 0.3, 0.02, 1.3, 0.04, 0.045, K.woodL); g.box(0.02, 1.32, 0.04, 0.4, 0.04, 0.05, K.iron);
  for (let k = 0; k < 5; k++) g.box(-0.16 + k * 0.08, 1.38, 0.04, 0.02, 0.1, 0.02, K.iron);
  pole(g, 0.35, 0.3, 0.3, 0.35, 1.2, 0.04, 0.045, K.woodL); g.box(0.35, 0.18, 0.32, 0.2, 0.26, 0.04, K.tinD);
  g.box(0.75, 0.15, 0.25, 0.26, 0.3, 0.26, K.tinD); g.box(0.75, 0.3, 0.25, 0.28, 0.02, 0.28, K.iron);
  f.flat(-0.7, -0.25, 0.95, 0.5, 0.005, SH);
}
function hay(g, f, it) {
  const s = it.s || 1;
  g.box(0, 0.35 * s, 0, 1.5 * s, 0.7 * s, 1.5 * s, K.straw);
  g.box(0, 0.9 * s, 0, 1.2 * s, 0.45 * s, 1.2 * s, K.strawD);
  g.box(0, 1.3 * s, 0, 0.8 * s, 0.38 * s, 0.8 * s, K.straw);
  g.box(0, 1.6 * s, 0, 0.4 * s, 0.25 * s, 0.4 * s, K.strawD);
  g.box(0, 1.6 * s, 0, 0.07, 1.0 * s, 0.07, K.woodD);
  g.box(0.5 * s, 0.05, 0.75 * s, 0.5, 0.1, 0.3, K.straw);
  f.flat(-0.95 * s, -0.9 * s, 0.95 * s, 1.0 * s, 0.005, SH);
}
function bambooFence(g, f, it) {
  const L = it.len || 6, H = it.h || 0.95, gx = it.gx ?? null, gw = it.gw || 1.3;
  const parts = gx == null ? [[-L / 2, L / 2]] : [[-L / 2, gx - gw / 2], [gx + gw / 2, L / 2]];
  for (const [a, b] of parts) {
    if (b - a < 0.2) continue;
    const n = Math.max(1, Math.round((b - a) / 1.3));
    for (let i = 0; i <= n; i++) g.box(a + ((b - a) * i) / n, H / 2, 0, 0.08, H, 0.08, i % 2 ? K.bambooD : K.bamboo);
    for (const y of [H * 0.4, H * 0.82]) g.box((a + b) / 2, y, 0.05, b - a, 0.05, 0.05, K.bambooL);
    // a diagonal brace in each long run
    if (b - a > 3) pole(g, a + 0.1, 0.1, 0.03, a + 1.2, H * 0.8, 0.03, 0.04, K.bambooD);
  }
}
function buckets(g, f, it) {
  const r = rng(it.seed || 8), fl = [K.mustard, K.white, K.rose, K.orange, K.violet];
  for (let i = 0; i < 3; i++) {
    const x = -0.45 + i * 0.45, z = (i % 2) * 0.12;
    g.box(x, 0.18, z, 0.32, 0.36, 0.32, K.tin); g.box(x, 0.36, z, 0.36, 0.03, 0.36, K.tinD);
    g.box(x, 0.5, z, 0.26, 0.3, 0.24, K.leafD);
    g.box(x + 0.02, 0.7, z + 0.02, 0.3, 0.14, 0.28, fl[Math.floor(r() * fl.length)]);
  }
  f.flat(-0.75, -0.3, 0.75, 0.45, 0.005, SH);
}
function crates(g, f, it) {
  const r = rng(it.seed || 5), n = it.n || 3, fill = [K.gourd, K.chilli, K.orange, K.leaf, K.egg];
  for (let i = 0; i < n; i++) {
    const x = (i % 2) * 0.62 - 0.3, y = Math.floor(i / 2) * 0.4, z = (i % 3) * 0.05;
    g.box(x, y + 0.19, z, 0.58, 0.38, 0.44, K.woodL); g.box(x, y + 0.19, z + 0.225, 0.52, 0.05, 0.01, K.woodD);
    if (y === 0 || i === n - 1) g.box(x, y + 0.36, z, 0.48, 0.06, 0.34, fill[Math.floor(r() * fill.length)]);
  }
  f.flat(-0.65, -0.3, 0.65, 0.35, 0.005, SH);
}

// ---------------------------------------------------------------------------------
// a building: the field hut
// ---------------------------------------------------------------------------------
function fieldHut(g, f, it) {
  const W = 2.6, D = 2.0, FL = 0.45, r = rng(it.seed || 4);
  for (const sx of [-W / 2, W / 2]) for (const sz of [-D / 2, D / 2]) g.box(sx, 1.15, sz, 0.12, 2.3, 0.12, K.woodD);
  g.box(0, FL, 0, W, 0.08, D, K.bambooD);
  for (let x = -W / 2 + 0.2; x < W / 2; x += 0.22) f.flat(x, D / 2 + 0.01, x + 0.02, D / 2 + 0.02, 0.006, K.bambooD); // (slat ends)
  // back and side walls of woven bamboo, the front open
  g.box(0, FL + 0.85, -D / 2 + 0.04, W - 0.1, 1.7, 0.06, K.bambooL);
  for (let y = FL + 0.2; y < FL + 1.7; y += 0.3) g.box(0, y, -D / 2 + 0.08, W - 0.12, 0.04, 0.02, K.bamboo);
  for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.03), FL + 0.85, -0.2, 0.06, 1.7, D - 0.5, K.bambooL);
  // thatch roof: two slopes, ridge along X
  for (const sz of [-1, 1]) g.boxR(0, 2.5, sz * 0.62, W + 0.6, 0.18, 1.45, sz < 0 ? K.thatchD : K.thatch, sz * 0.5, 0, 0);
  g.box(0, 2.85, 0, W + 0.66, 0.12, 0.18, K.thatchD);
  for (let k = 0; k < 6; k++) g.box(-W / 2 - 0.2 + r() * (W + 0.4), 2.12, D / 2 + 0.5, 0.18, 0.08, 0.06, K.strawD); // ragged eave
  // inside: a rolled mat, a clay pot, a hat on a peg; the ladder step in front
  g.box(-0.6, FL + 0.12, -0.3, 0.9, 0.16, 0.16, K.mat);
  pot(g, 0.7, FL + 0.04, -0.4, 0.5, K.clay);
  g.box(0.2, FL + 1.35, -D / 2 + 0.14, 0.42, 0.06, 0.42, K.straw); g.box(0.2, FL + 1.41, -D / 2 + 0.14, 0.18, 0.08, 0.18, K.strawD);
  g.box(0, 0.22, D / 2 + 0.3, 0.9, 0.06, 0.32, K.woodD); for (const sx of [-0.4, 0.4]) g.box(sx, 0.11, D / 2 + 0.3, 0.06, 0.22, 0.06, K.woodD);
  f.flat(-W / 2 - 0.4, -D / 2 - 0.4, W / 2 + 0.5, D / 2 + 0.7, 0.005, SH);
}

export const LIFE_PROP = {
  gdVerge: { draw: verge, obstacles: none },
  gdKerbDrain: { draw: kerbDrain, obstacles: none },
  gdStones: { draw: stones, obstacles: none },
  gdMeadow: { draw: meadow, obstacles: none },
  gdFootpath: { draw: footpath, obstacles: none },
  gdHopscotch: { draw: hopscotch, obstacles: none },
  gdWaterPots: { draw: waterPots, obstacles: box(1.7, 0.75) },
  gdVegTable: { draw: vegTable, obstacles: box(1.8, 0.8) },
  gdDryMat: { draw: dryMat, obstacles: none },
  gdPotRow: { draw: potRow, obstacles: (it) => box(it.len || 3, 0.42)(it) },
  gdSeedTrays: { draw: seedTrays, obstacles: box(2.15, 0.85) },
  gdWaterButt: { draw: waterButt, obstacles: box(1.1, 0.7, 0.25, 0) },
  gdToolRack: { draw: toolRack, obstacles: box(1.5, 0.5, 0.1, 0.1) },
  gdHay: { draw: hay, obstacles: (it) => [{ type: 'circle', x: it.x, z: it.z, r: 0.8 * (it.s || 1) }] },
  gdBambooFence: { draw: bambooFence, obstacles: (it) => {
    const L = it.len || 6, gx = it.gx ?? null, gw = it.gw || 1.3;
    const parts = gx == null ? [[-L / 2, L / 2]] : [[-L / 2, gx - gw / 2], [gx + gw / 2, L / 2]];
    return parts.filter(([a, b]) => b - a > 0.2).flatMap(([a, b]) => box(b - a, 0.22, (a + b) / 2, 0)(it));
  } },
  gdBuckets: { draw: buckets, obstacles: box(1.3, 0.5) },
  gdCrates: { draw: crates, obstacles: box(1.25, 0.55) },
};
export const LIFE_ART = {
  gdFieldHut: { draw: fieldHut, h: 2.9, map: true, obstacles: box(2.8, 2.2) },
};

// ---------------------------------------------------------------------------------
// the layout (world metres; the plan in regions/garden.js). MORE_COTTAGES go in before regions/garden.js lays the
// front yards (so they get theirs); fillLife(add, gates) runs after, with every cottage's gate (world x, z, ry).
// ---------------------------------------------------------------------------------
const HP = Math.PI / 2, PI = Math.PI;
/** The north road's centre x at z (its polyline (140, 100) (140, 70) (142, 46) (140, 18)). */
export function northRoadX(z) {
  if (z >= 70) return 140;
  if (z >= 46) return 140 + (2 * (70 - z)) / 24;
  return 142 - (2 * (46 - z)) / 28;
}
/** Distance from (x, z) to the nearest road centreline in the Garden (lane, crease lane, clasp road, north road). */
function roadDist(x, z) {
  const d = [];
  if (x > 139 && x < 259) d.push(Math.abs(z - 100));
  if (z > 100 && z < 137.6) { d.push(Math.abs(x - 172)); d.push(Math.abs(x - 258)); }
  if (z > 18 && z < 100) d.push(Math.abs(x - northRoadX(z)));
  return d.length ? Math.min(...d) : 99;
}

export const MORE_COTTAGES = [
  // the north road's west side, facing it
  { x: 130.4, z: 52.0, w: 5.2, d: 4.2, seed: 121, ry: HP },
  { x: 130.4, z: 32.4, w: 5.0, d: 4.2, seed: 122, ry: HP },
  // its east side, past the bean field
  { x: 150.0, z: 28.6, w: 4.8, d: 4.0, seed: 123, ry: -HP },
];

export function fillLife(add, gates) {
  // ---- stepping stones from every cottage's front gate out to its road (as far as the kerb)
  const laneGates = [];
  for (const gt of gates) {
    const nx = Math.sin(gt.ry), nz = Math.cos(gt.ry);
    let t = 0;
    for (; t < 9; t += 0.2) if (roadDist(gt.x + nx * t, gt.z + nz * t) < 1.45) break;
    if (t < 0.6 || t >= 9) continue;
    add({ k: 'gdStones', x: gt.x + (nx * t) / 2, z: gt.z + (nz * t) / 2, ry: gt.ry, len: t, seed: Math.round(gt.x * 7 + gt.z) });
    if (Math.abs(gt.z + nz * t - 100) < 2 && nz < -0.5) laneGates.push(gt.x);
  }

  // ---- the lane's south kerb (z 101.25): a drain with plank crossings at the gates, a grass verge, low things on it
  for (const [x0, x1] of [[141.5, 150.5], [150.5, 160.5], [160.5, 170.4], [173.6, 182], [182, 192], [192, 202], [202, 212], [212, 222], [222, 232], [232, 242], [242, 252], [252, 256.6]]) {
    const cx = (x0 + x1) / 2;
    add({ k: 'gdKerbDrain', x: cx, z: 101.55, len: x1 - x0, gaps: laneGates.filter((g) => g > x0 && g < x1).map((g) => g - cx) });
    add({ k: 'gdVerge', x: cx, z: 103.35, len: x1 - x0 - 0.2, d: 2.9, seed: Math.round(cx) });
  }
  // kept under ~1.3 m: Daw Khin Lay's chillies dry beside her baskets, Daw Hla's table further on
  add({ k: 'gdPotRow', x: 181.6, z: 103.9, len: 2.4, seed: 1 });
  add({ k: 'gdDryMat', x: 190.6, z: 103.7, load: 'chilli', seed: 2 });
  add({ k: 'gdHopscotch', x: 209.2, z: 104.3 });
  add({ k: 'gdVegTable', x: 216.6, z: 103.55, seed: 3, sign: ['ဟင်းသီးဟင်းရွက် လတ်လတ်', 'fresh vegetables'] });
  add({ k: 'gdCrates', x: 218.6, z: 103.9, n: 3, seed: 4 });
  add({ k: 'gdBuckets', x: 223.8, z: 103.95, seed: 5 });
  add({ k: 'gdPotRow', x: 238.6, z: 104.0, len: 1.8, seed: 6 });
  add({ k: 'gdPotRow', x: 249.0, z: 103.95, len: 2.2, seed: 7 });
  add({ k: 'gdDryMat', x: 254.4, z: 103.7, load: 'beans', seed: 8 });
  add({ k: 'gdPotRow', x: 146.2, z: 103.9, len: 2.6, seed: 9 });
  add({ k: 'gdDryMat', x: 159.6, z: 103.6, load: 'seeds', seed: 10 });
  add({ k: 'gdWaterButt', x: 165.8, z: 104.0 });
  // the north kerb: a few pots at the plots' fence posts
  add({ k: 'gdPotRow', x: 255.2, z: 98.32, len: 1.4, seed: 11 });
  add({ k: 'gdPotRow', x: 245.9, z: 98.32, len: 1.2, seed: 12 });
  add({ k: 'gdPotRow', x: 168.6, z: 98.32, len: 1.6, seed: 13 });

  // ---- the crease lane (x 172): drains and verges both sides, the seedling stall, a water stand for travellers
  for (const [z0, z1] of [[102.2, 112], [112, 122], [122, 131], [131, 136.4]]) {
    const cz = (z0 + z1) / 2;
    for (const s of [-1, 1]) {
      add({ k: 'gdKerbDrain', x: 172 + s * 1.55, z: cz, ry: HP, len: z1 - z0 });
      add({ k: 'gdVerge', x: 172 + s * 2.2, z: cz, ry: s < 0 ? -HP : HP, len: z1 - z0 - 0.3, d: 0.9, seed: Math.round(cz * 3 + s) }); // (to the yard fences)
    }
  }
  add({ k: 'gdSeedTrays', x: 175.0, z: 115.6, ry: -HP, seed: 14, sign: ['ပျိုးပင် ရောင်းသည်', 'seedlings for sale'] });
  add({ k: 'gdDryMat', x: 168.4, z: 125.6, ry: HP, load: 'seeds', seed: 15 });
  add({ k: 'gdHopscotch', x: 169.0, z: 107.4, ry: HP });
  add({ k: 'gdWaterPots', x: 168.9, z: 133.8, ry: HP, n: 3 });
  add({ k: 'gdToolRack', x: 169.3, z: 115.4, ry: HP });

  // ---- the clasp road (x 258): a water butt by the pump, tools, pots by the gates
  add({ k: 'gdWaterButt', x: 262.3, z: 113.4, ry: -HP });
  add({ k: 'gdToolRack', x: 262.4, z: 126.0, ry: -HP });
  add({ k: 'gdPotRow', x: 255.9, z: 114.2, ry: HP, len: 1.6, seed: 16 });
  add({ k: 'gdBuckets', x: 260.6, z: 103.6, ry: -HP, seed: 17 });

  // ---- the north road (x ~140): verges both sides, the street gardens' side fence, a field hut and hay, the bean
  // field with its fence half mended, the water stand
  for (let z0 = 24; z0 < 96; z0 += 9) {
    const z1 = Math.min(z0 + 9, 97), cz = (z0 + z1) / 2, rx = northRoadX(cz), ang = Math.atan2(northRoadX(z1) - northRoadX(z0), z1 - z0);
    for (const s of [-1, 1]) add({ k: 'gdVerge', x: rx + s * 2.4, z: cz, ry: (s < 0 ? -HP : HP) + ang, len: z1 - z0 - 0.4, d: 1.8, seed: Math.round(cz * 5 + s) });
  }
  add({ k: 'gdBambooFence', x: 142.75, z: 92.0, ry: HP, len: 11.4 });
  add({ k: 'gdFieldHut', x: 147.6, z: 79.4, ry: -HP, seed: 18 });
  add({ k: 'gdHay', x: 151.4, z: 81.6, s: 1.0 });
  add({ k: 'gdDryMat', x: 146.4, z: 76.0, ry: -HP, load: 'beans', seed: 19 });
  add({ k: 'gdFootpath', x: 150.2, z: 71.3, len: 12.4, seed: 20 });
  add({ k: 'gdWaterPots', x: 136.9, z: 60.6, ry: HP, n: 2, sign: true });
  add({ k: 'gdWaterButt', x: 136.6, z: 67.2, ry: HP });
  add({ k: 'gdDryMat', x: 135.0, z: 70.4, ry: HP, load: 'chilli', seed: 21 });
  // the bean field (x 145-157, z 38.6-50): fenced on four sides, a broken run on the road side being mended
  add({ k: 'gdBambooFence', x: 145.0, z: 41.0, ry: HP, len: 4.8 });
  add({ k: 'gdBambooFence', x: 145.0, z: 48.2, ry: HP, len: 3.6 });
  add({ k: 'gdBambooFence', x: 151.0, z: 38.6, len: 12.0 });
  add({ k: 'gdBambooFence', x: 151.0, z: 50.0, len: 12.0, gx: 3.2, gw: 1.4 });
  add({ k: 'gdBambooFence', x: 157.0, z: 44.3, ry: HP, len: 11.4 });
  add({ k: 'gdToolRack', x: 145.9, z: 44.6, ry: -HP });
  for (const [x, z, crop, s] of [[154.4, 40.6, 'tomato', 131], [154.4, 46.4, 'chilli', 132]]) add({ k: 'gdBed', x, z, w: 3.0, d: 1.1, crop, seed: s, ry: HP });
  add({ k: 'gdFieldHut', x: 148.2, z: 52.9, ry: -HP, seed: 22 });
  add({ k: 'gdHay', x: 154.8, z: 31.0, s: 1.0 }); add({ k: 'gdHay', x: 158.6, z: 33.8, s: 0.85 });
  add({ k: 'gdSeedTrays', x: 136.0, z: 40.4, ry: HP, seed: 23 });
  // a few more low things along the road's sides (both sides, 3.5 to 5 m out)
  add({ k: 'gdPotRow', x: 136.0, z: 93.2, ry: HP, len: 2.4, seed: 27 });
  add({ k: 'gdHay', x: 135.8, z: 80.6, s: 0.8 });
  add({ k: 'gdCrates', x: 136.6, z: 46.0, ry: HP, n: 4, seed: 28 });
  add({ k: 'gdDryMat', x: 145.6, z: 61.4, ry: -HP, load: 'chilli', seed: 29 });
  add({ k: 'gdWaterButt', x: 146.0, z: 57.8, ry: -HP });
  add({ k: 'gdFootpath', x: 144.8, z: 79.4, len: 3.0, seed: 30 });
  add({ k: 'gdPotRow', x: 145.2, z: 23.4, ry: -HP, len: 2.0, seed: 31 });

  // ---- the west of the lane: a water stand where the lane turns north, a field hut, hay
  add({ k: 'gdWaterPots', x: 136.6, z: 103.6, ry: 0.6, n: 2 });
  add({ k: 'gdFieldHut', x: 156.4, z: 113.2, ry: PI, seed: 24 });
  add({ k: 'gdHay', x: 160.2, z: 112.0, s: 0.9 });
  add({ k: 'gdToolRack', x: 153.0, z: 112.6, ry: PI });

  // ---- the ground: rough grass on the open page (flat), worn footpaths
  for (const [x, z, w, d, s] of [[152, 61, 11, 7, 1], [128, 120, 10, 8, 2], [163, 52, 9, 7, 3], [127, 96, 8, 6, 4], [190, 46, 14, 10, 5], [215, 39, 12, 9, 6],
    [240, 50, 14, 10, 7], [258, 40, 10, 9, 8], [176, 64, 10, 8, 9], [224, 62, 9, 7, 10], [198, 120, 10, 5, 11], [232, 120, 9, 5, 12], [150, 132, 12, 6, 13],
    [262, 92, 6, 6, 14], [128, 70, 6, 10, 15], [146, 104.8, 5, 2.2, 16], [207, 108, 6, 3, 17], [186, 128, 8, 6, 18], [242, 130, 8, 5, 19]]) add({ k: 'gdMeadow', x, z, w, d, seed: 600 + s });
  add({ k: 'gdFootpath', x: 186.6, z: 84.4, ry: HP, len: 6.2, seed: 25 });
  add({ k: 'gdFootpath', x: 262.0, z: 97.0, ry: HP, len: 6.0, seed: 26 });
}
