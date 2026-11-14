// Hearth Row art (district 5): the buildings and street things of the Row and Workshop Lane, drawn into the
// open world's merged chunks (regions/hearth.js registers them as ART / PROP kinds). Same kit as build.js:
// outlined boxes (kit.js Geo), item-local, feet at y = 0, fronts face +Z (the street; the camera looks north).
// The district's own look: fired brick, soot, corrugated tin with rust, lime-washed and ochre plaster,
// clay stoves at every door, warm light in doorways, scorch rings on the baking-parchment ground.
// Every Burmese string is a draft for Maya. Nothing here points the player anywhere.
//
// Buildings (ART: `h` for the cutaway, `map` draws the footprint):
//   bakery { w, d }          Daw Khin May's: closed brick front, double door half open, two smoking chimneys,
//                            «ပေါင်မုန့်» board; the covered link to the back runs north along its east side
//   bakeryBack { w, d }      the oven house behind the yard: two oven vents, three brick steps up to the plank
//                            back door (room `provingroom`)
//   noteWall { w }           the long board wall under a little roof; drawer + stool west end (two old notes)
//   eveningClass { w, d }    lime-washed, green door open at the top of three steps, benches + blackboard inside
//   noodleHouse { w, d }     plank front, wide double door, red lantern left, blue right, steam vent
//   loomShed { w, d }        long low plank shed, shutters propped open, looms inside, painted shuttle on the door
//   teaHouse { w, d }        wide doorway, bamboo blinds rolled up, kettle on a brazier, painted cup sign
//   lampShop { w, d }        two storeys, lit front window with the counter, tin lamps under the eave
//   boxShop { w, d }         low wooden door, a folded lunch box hung over it, boxes stacked in the window
//   workShed { w, d, goods } open-fronted workshop: 'stoves' | 'tin' | 'paper' | 'kites' | 'baskets'
//   hHouse { w, d, style, seed }   a Row house: 'two' (brick below, timber above, balcony) | 'one' (tin porch)
//   commonOven               the street's shared clay oven under a tin roof
// Props (PROP):
//   scorch { r, seed }  roadScorch { r }  soilPatch { w, d }  hopscotch   (ground marks)
//   lowWall { len, ry }  breadRack  flourSacks { n }  sackSeat  crates { n, seed }  clayStove { smoke }
//   noodleRack { len }  bananas  plantPots { n }  charcoal  trayStack  dyeVats  kerbPot  lampBench
//   kiteBench  cat { ry }  dog  goat { ry }  hearthSign  laneSign  lookout
import { shade, rng } from '../kit.js';
import { PALETTE } from '../../../game/toon.js';
import { jitter } from '../../../game/voxel.js';

export const C = {
  wood: PALETTE.wood, woodD: PALETTE.woodDark, woodL: '#CDA577', woodDD: '#5E3F27', woodG: '#A88660',
  gold: PALETTE.gold, goldD: PALETTE.goldDeep, maroon: PALETTE.maroon, maroonD: PALETTE.maroonDeep,
  cream: PALETTE.cream, white: PALETTE.white, ink: PALETTE.ink, parch: PALETTE.parchment,
  leaf: PALETTE.leaf, leafD: PALETTE.leafDark, leafL: '#8DBA6E', rose: PALETTE.rose,
  brick: '#A0503A', brickD: '#7E3C2B', brickL: '#B8644A', mortar: '#D6BE9E',
  terra: '#B5643C', terraL: '#CB7E4E', terraD: '#8E4A2C',
  lime: '#F4ECDC', limeD: '#E2D6BE', ochre: '#E6C584', ochreD: '#C9A25E', pinkP: '#EDC6B4', mint: '#CFE0C8',
  tin: '#B3B5AE', tinL: '#D2D3CB', tinD: '#8A8C85', rust: '#A86A3E', rustD: '#8A5230',
  soot: '#2B1E19', ash: '#6B625A', stone: '#A39484', stoneL: '#C4B6A2', stoneD: '#7F7366',
  green: '#3F7A5A', greenD: '#2E5C43', teal: '#4E8C86', blue: '#2F5DB3', blueL: '#5C86C9', red: '#C8323C', redD: '#99242C', mustard: '#E2B33C',
  glass: '#BFD3E0', dark: '#3A2E25', dark2: '#4A3B2F', lit: '#F6D58E', litD: '#EDB664', ember: '#E8742E',
  sack: '#E8DAB6', sackD: '#C9B48A', flour: '#F7F2E6', crust: '#C8873E', crustL: '#DDA257', crustD: '#9A5E2A',
  bamboo: '#C9B26A', bambooD: '#9E8A48', chalk: '#3E4A3F', iron: '#4A3B30', soil: '#8A6648', soilD: '#6E5038',
  scorch: '#9C6B3C', scorchD: '#6E4526', scorchL: '#CFAE7C', shadow: '#E0CDA4', paper: '#FBF6EA',
};

// ---------------------------------------------------------------------------------
// small builders
// ---------------------------------------------------------------------------------
/** A slab (x0..x1, y0..y1, z0..z1) with rectangular holes [hx0, hy0, hx1, hy1] cut through it. */
function slab(g, x0, x1, y0, y1, z0, z1, col, holes = []) {
  const xs = [x0, x1];
  for (const h of holes) xs.push(Math.max(x0, Math.min(x1, h[0])), Math.max(x0, Math.min(x1, h[2])));
  xs.sort((a, b) => a - b);
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i], b = xs[i + 1];
    if (b - a < 1e-3) continue;
    const m = (a + b) / 2;
    const hs = holes.filter((h) => h[0] < m && h[2] > m).map((h) => [h[1], h[3]]).sort((p, q) => p[0] - q[0]);
    let y = y0;
    for (const [ha, hb] of hs) { if (ha > y + 1e-3) g.boxMin(a, y, z0, b, Math.min(ha, y1), z1, col); y = Math.max(y, hb); }
    if (y1 > y + 1e-3) g.boxMin(a, y, z0, b, y1, z1, col);
  }
}
const inHole = (x, y, holes, m = 0.12) => holes.some((h) => x > h[0] - m && x < h[2] + m && y > h[1] - m && y < h[3] + m);
/** Brick texture on a +Z face at z: mortar courses (split round holes) and odd bricks lighter or darker. */
function brickFace(g, x0, x1, y0, y1, z, holes, seed, step = 0.26) {
  const r = rng(seed);
  for (let y = y0 + step, k = 0; y < y1 - 0.06; y += step, k++) {
    let segs = [[x0, x1]];
    for (const h of holes) {
      if (y < h[1] - 0.02 || y > h[3] + 0.02) continue;
      const nx = [];
      for (const [a, b] of segs) { if (h[2] <= a || h[0] >= b) { nx.push([a, b]); continue; } if (h[0] > a) nx.push([a, h[0]]); if (h[2] < b) nx.push([h[2], b]); }
      segs = nx;
    }
    for (const [a, b] of segs) if (b - a > 0.06) g.boxMin(a, y - 0.013, z, b, y + 0.013, z + 0.014, C.mortar);
    const n = Math.max(1, Math.round((x1 - x0) / 3.2));
    for (let j = 0; j < n; j++) {
      const x = x0 + 0.25 + r() * (x1 - x0 - 0.5), yy = y - step / 2;
      if (inHole(x, yy, holes)) continue;
      g.box(x, yy, z + 0.008, 0.3, step - 0.06, 0.016, r() < 0.55 ? C.brickL : C.brickD);
    }
  }
}
/** Corrugated tin gable roof, ridge along X: two slabs, ribs, rust patches, ridge cap. */
function tinRoof(g, W, D, y0, rise, col, seed, over = 0.42, overX = 0.3) {
  const r = rng(seed);
  const half = D / 2 + over, ang = Math.atan2(rise, D / 2), slope = half / Math.cos(ang), L = W + overX * 2;
  for (const sz of [-1, 1]) {
    const cz = (sz * half) / 2, cy = y0 + rise / 2 + 0.05;
    g.boxR(0, cy, cz, L, 0.08, slope, col, sz * ang, 0, 0);
    const n = Math.round(L / 0.42);
    for (let i = 0; i <= n; i++) g.boxR(-L / 2 + (L * i) / n, cy + 0.06, cz, 0.06, 0.05, slope + 0.02, shade(col, 1.14), sz * ang, 0, 0);
    for (let k = 0; k < 2 + Math.floor(r() * 2); k++) {
      const t = 0.2 + r() * 0.6, px = -L / 2 + 0.6 + r() * (L - 1.2);
      g.boxR(px, y0 + rise * (1 - t) + 0.13, sz * half * t, 0.5 + r() * 0.7, 0.03, 0.5 + r() * 0.6, r() < 0.5 ? C.rust : C.rustD, sz * ang, 0, 0);
    }
    // a gutter line at the eaves
    g.box(0, y0 - over * Math.tan(ang) + 0.02, sz * (half - 0.02), L + 0.02, 0.08, 0.1, shade(col, 0.78));
  }
  g.box(0, y0 + rise + 0.1, 0, L + 0.04, 0.12, 0.36, shade(col, 0.8));
}
/** Stepped gable ends (the triangles under a gable roof). */
function gableEnds(g, W, D, y0, rise, col) {
  for (let i = 0; i < 4; i++) g.box(0, y0 + (rise * (i + 0.5)) / 4, 0, W - 0.04, rise / 4, D * (1 - (i + 0.5) / 4), col);
}
/** A stepped terracotta tile roof (hipped). */
function tileRoof(g, W, D, y0, col, steps = 4, stepH = 0.32) {
  const w0 = W + 0.7, d0 = D + 0.7;
  g.box(0, y0 + 0.06, 0, w0 + 0.1, 0.12, d0 + 0.1, C.woodD);
  for (let i = 0; i < steps; i++) {
    const k = i / steps, w = w0 - k * Math.min(W * 0.45, 3.2), d = d0 * (1 - k * 0.9), y = y0 + 0.12 + stepH * (i + 0.5);
    g.box(0, y, 0, w, stepH, d, i % 2 ? col : shade(col, 0.9));
    for (const sz of [-1, 1]) g.box(0, y + stepH / 2 - 0.03, sz * (d / 2 - 0.06), w + 0.02, 0.07, 0.14, shade(col, 1.18));
  }
  g.box(0, y0 + 0.12 + stepH * steps + 0.07, 0, w0 - Math.min(W * 0.45, 3.2) + 0.2, 0.14, 0.26, C.goldD);
}
/** A window on a +Z face: frame, pane (lit or dark), bars or mullion, sill, shutters folded open. */
function win(g, x, y, z, w, h, o = {}) {
  const frame = o.frame || C.woodD;
  g.box(x, y, z, w + 0.14, h + 0.14, 0.08, frame);
  g.box(x, y, z + 0.02, w, h, 0.06, o.lit ? C.lit : o.pane || C.dark2);
  if (o.lit) g.box(x, y - h * 0.18, z + 0.04, w * 0.9, h * 0.3, 0.04, C.litD);
  if (o.bars) for (let k = 1; k < 4; k++) g.box(x - w / 2 + (w * k) / 4, y, z + 0.06, 0.035, h, 0.035, C.iron);
  else g.box(x, y, z + 0.05, 0.05, h, 0.03, frame);
  g.box(x, y - h / 2 - 0.08, z + 0.08, w + 0.26, 0.06, 0.18, shade(frame, 1.2));
  if (o.shut) for (const sx of [-1, 1]) {
    g.box(x + sx * (w / 2 + 0.2), y, z + 0.04, 0.3, h, 0.05, o.shut);
    g.box(x + sx * (w / 2 + 0.2), y, z + 0.075, 0.2, h * 0.7, 0.02, shade(o.shut, 0.82));
  }
}
/** Brick steps up to a door at local (x, FZ): n steps of rise, each `run` deep. */
function steps(g, f, x, w, FZ, n, rise, run, col) {
  for (let k = 0; k < n; k++) g.boxMin(x - w / 2, 0, FZ, x + w / 2, rise * (n - k), FZ + run * (k + 1), k % 2 ? col : shade(col, 1.08));
  f.flat(x - w / 2 - 0.2, FZ, x + w / 2 + 0.2, FZ + run * n + 0.3, 0.004, C.shadow);
}
/** A little clay stove with a kettle (by a door). */
function stoveAt(g, x, z, kettle = true) {
  g.box(x, 0.18, z, 0.5, 0.36, 0.5, C.terra);
  g.box(x, 0.38, z, 0.56, 0.06, 0.56, C.terraD);
  g.box(x, 0.18, z + 0.26, 0.2, 0.14, 0.02, C.ember);
  if (kettle) { g.box(x, 0.52, z, 0.34, 0.24, 0.34, C.iron); g.box(x, 0.68, z, 0.12, 0.06, 0.12, C.iron); g.boxR(x + 0.22, 0.56, z, 0.16, 0.05, 0.05, C.iron, 0, 0, 0.6); }
}
/** Potted plants in a row (x0 .. x0 + n * 0.36) along z. */
function potsAt(g, x0, z, n, seed) {
  const r = rng(seed);
  const flowers = [C.rose, C.mustard, C.white, '#F3B27A', C.red];
  for (let i = 0; i < n; i++) {
    const x = x0 + i * 0.36, h = 0.22 + r() * 0.12;
    g.box(x, h / 2, z, 0.26, h, 0.26, i % 2 ? C.terra : C.terraL);
    g.box(x, h + 0.1, z, 0.24, 0.2, 0.24, r() < 0.5 ? C.leaf : C.leafL);
    if (r() < 0.6) g.box(x, h + 0.25, z, 0.12, 0.1, 0.12, flowers[Math.floor(r() * flowers.length)]);
  }
}
/** A hanging paper lantern (round-ish) on a cord. */
function lantern(g, x, y, z, col) {
  g.box(x, y + 0.32, z, 0.02, 0.22, 0.02, C.ink);
  g.box(x, y, z, 0.36, 0.42, 0.36, col);
  g.box(x, y, z, 0.42, 0.28, 0.42, col);
  for (const yy of [-0.22, 0.22]) g.box(x, y + yy, z, 0.24, 0.04, 0.24, C.gold);
  g.box(x, y - 0.32, z, 0.06, 0.14, 0.06, C.mustard);
}
/** Sign helper: a canvas board, Burmese first (draft), English small. */
function board(ctx, x, y, z, w, h, my, en, o = {}) {
  ctx.signs.push({
    x, y, z, w, h, ry: o.ry || 0, width: o.width || 512, height: o.height || 160, bg: o.bg === undefined ? '#F6E7C6' : o.bg, border: o.border === undefined ? C.brickD : o.border,
    lines: en ? [{ text: my, size: o.size || 52, color: o.color }, { text: en, size: 22, font: 'serif', weight: 600, color: o.enColor || '#6E1F2A' }] : [{ text: my, size: o.size || 56, color: o.color }],
  });
}
/** Turned point (item-local x, z) -> world, for glows and smoke. */
const W2 = (g, x, z) => [g.tx + x * g.tc + z * g.ts, g.tz - x * g.ts + z * g.tc];
function glow(g, ctx, x, y, z) { const [wx, wz] = W2(g, x, z); ctx.glows.push(wx, y, wz); }
function smoke(g, ctx, x, y, z) { const [wx, wz] = W2(g, x, z); ctx.smoke.push(wx, y, wz); }
/** A shallow room behind a doorway (seen through the hole): back wall, floor, ceiling, side cheeks. */
function alcove(g, x0, x1, y0, y1, zb, zf, wall, floor = C.woodD) {
  g.boxMin(x0, y0, zb - 0.06, x1, y1, zb, wall);
  g.boxMin(x0, y0 - 0.02, zb, x1, y0 + 0.02, zf, floor);
  g.boxMin(x0 - 0.06, y0, zb, x0, y1, zf, shade(wall, 0.86));
  g.boxMin(x1, y0, zb, x1 + 0.06, y1, zf, shade(wall, 0.86));
  g.boxMin(x0, y1, zb, x1, y1 + 0.06, zf, shade(wall, 0.7));
}
/** A low wooden stool. */
function stool(g, x, z, col = C.wood, h = 0.32) {
  g.box(x, h, z, 0.34, 0.05, 0.34, col);
  for (const sx of [-0.13, 0.13]) for (const sz of [-0.13, 0.13]) g.box(x + sx, h / 2, z + sz, 0.05, h, 0.05, shade(col, 0.75));
}
/** A low round-ish table. */
function lowTable(g, x, z, col = C.woodL, h = 0.42) {
  g.box(x, h, z, 0.7, 0.05, 0.7, col);
  g.box(x, h, z, 0.82, 0.04, 0.5, col);
  g.box(x, h / 2, z, 0.12, h, 0.12, shade(col, 0.7));
}

// ---------------------------------------------------------------------------------
// Buildings
// ---------------------------------------------------------------------------------
function bakery(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 4.5, FZ = D / 2, SK = 0.3, AL = 1.3; // skin, alcove depth
  const DW = 1.9, DH = 2.5, DY = 0.3;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.3, FZ + 0.9, 0.004, C.shadow);
  // plinth, body, side walls by the alcove, the brick front with its door hole
  g.boxMin(-W / 2 - 0.12, 0, -D / 2 - 0.06, W / 2 + 0.12, DY, FZ + 0.14, C.stone);
  g.boxMin(-W / 2 - 0.12, DY - 0.04, FZ + 0.06, W / 2 + 0.12, DY + 0.02, FZ + 0.16, C.stoneL);
  g.boxMin(-W / 2, DY, -D / 2, W / 2, H, FZ - AL, C.brickD);
  for (const sx of [-1, 1]) g.boxMin(sx < 0 ? -W / 2 : W / 2 - 0.3, DY, FZ - AL, sx < 0 ? -W / 2 + 0.3 : W / 2, H, FZ - SK, C.brickD);
  g.boxMin(-W / 2, H - 0.3, FZ - AL, W / 2, H, FZ - SK, C.brickD);
  const holes = [[-DW / 2, DY, DW / 2, DY + DH], [-3.6, 2.5, -2.6, 3.3], [2.6, 2.5, 3.6, 3.3]];
  slab(g, -W / 2, W / 2, DY, H, FZ - SK, FZ, C.brick, holes);
  brickFace(g, -W / 2, W / 2, DY, H - 0.4, FZ, holes, 911);
  // quoins and a soot-dark band under the cornice
  for (const sx of [-1, 1]) for (let y = DY, k = 0; y < H - 0.5; y += 0.4, k++) g.box(sx * (W / 2 - 0.2), y + 0.2, FZ + 0.02, k % 2 ? 0.3 : 0.44, 0.36, 0.06, jitter('#D8C3A2', 0.05, k + sx));
  g.boxMin(-W / 2 - 0.1, H - 0.42, FZ - 0.1, W / 2 + 0.1, H - 0.1, FZ + 0.1, '#5A3A2C');
  g.boxMin(-W / 2 - 0.16, H - 0.1, -D / 2 - 0.1, W / 2 + 0.16, H + 0.05, FZ + 0.18, C.stoneD);
  g.boxMin(-W / 2 - 0.05, H + 0.05, FZ - 0.15, W / 2 + 0.05, H + 0.5, FZ + 0.05, C.brick); // parapet
  g.boxMin(-W / 2 - 0.1, H + 0.5, FZ - 0.2, W / 2 + 0.1, H + 0.58, FZ + 0.1, C.stoneL);
  // roof behind the parapet: tin, low, and the two big chimneys at the back, smoking
  g.boxMin(-W / 2 + 0.05, H + 0.05, -D / 2 + 0.05, W / 2 - 0.05, H + 0.18, FZ - 0.2, C.tinD);
  for (let x = -W / 2 + 0.4; x < W / 2 - 0.2; x += 0.5) g.box(x, H + 0.22, -0.3, 0.05, 0.06, D - 1.2, C.tin);
  for (const cx of [-2.7, 2.5]) {
    g.box(cx, H + 1.7, -D / 2 + 1.1, 1.0, 3.4, 1.0, C.brickD);
    for (let y = H + 0.4; y < H + 3.3; y += 0.3) g.box(cx, y, -D / 2 + 1.61, 1.0, 0.025, 0.02, C.mortar);
    g.box(cx, H + 3.45, -D / 2 + 1.1, 1.2, 0.18, 1.2, C.stoneD);
    g.box(cx, H + 3.6, -D / 2 + 1.1, 0.7, 0.14, 0.7, C.soot);
    g.box(cx, H + 3.2, -D / 2 + 1.61, 1.0, 0.4, 0.03, '#4A3329'); // soot streak
    smoke(g, ctx, cx, H + 3.9, -D / 2 + 1.1);
  }
  // the doorway: a warm room behind (oven glow on the back wall, a work table, trays), leaves half open
  alcove(g, -DW / 2, DW / 2, DY, DY + DH, FZ - AL, FZ - SK, '#6B4A35', C.woodD);
  g.boxMin(-0.7, DY + 0.4, FZ - AL + 0.01, 0.2, DY + 1.3, FZ - AL + 0.06, C.soot); // an oven mouth
  g.boxMin(-0.6, DY + 0.5, FZ - AL + 0.06, 0.1, DY + 1.05, FZ - AL + 0.09, C.ember);
  g.boxMin(-0.5, DY + 0.55, FZ - AL + 0.09, 0.0, DY + 0.9, FZ - AL + 0.11, C.lit);
  g.boxMin(-0.85, DY + 0.86, FZ - AL + 0.3, 0.85, DY + 0.94, FZ - AL + 0.85, C.woodL); // work table
  for (const x of [-0.55, -0.15, 0.25]) g.box(x, DY + 1.0, FZ - AL + 0.55, 0.3, 0.12, 0.22, C.crust);
  g.boxR(-DW / 2 + 0.22, DY + DH / 2, FZ - SK - 0.38, 0.08, DH - 0.06, 0.88, C.wood, 0, -0.35, 0); // left leaf swung in
  g.boxMin(0.05, DY, FZ - 0.12, DW / 2, DY + DH, FZ - 0.04, C.wood); // right leaf, half open: the gap shows warm
  for (let k = 0; k < 4; k++) g.boxMin(0.1, DY + 0.15 + k * 0.6, FZ - 0.05, DW / 2 - 0.05, DY + 0.55 + k * 0.6, FZ - 0.02, shade(C.wood, k % 2 ? 0.9 : 1.05));
  g.box(0.16, DY + 1.25, FZ - 0.01, 0.06, 0.16, 0.04, C.iron);
  g.boxMin(-DW / 2 - 0.16, DY + DH, FZ, DW / 2 + 0.16, DY + DH + 0.18, FZ + 0.08, C.stoneL); // lintel
  for (const sx of [-1, 1]) g.boxMin(sx < 0 ? -DW / 2 - 0.16 : DW / 2, DY, FZ, sx < 0 ? -DW / 2 : DW / 2 + 0.16, DY + DH, FZ + 0.07, C.stoneL);
  f.flatR(0, FZ + 0.6, 2.2, 1.0, 0.006, C.flour); // flour on the step
  // the little high windows with bars, warm inside
  for (const sx of [-1, 1]) win(g, sx * 3.1, 2.9, FZ, 0.95, 0.75, { bars: true, lit: true, frame: C.stoneL });
  // the board over the door, with a carved loaf on top
  board(ctx, 0, DY + DH + 0.62, FZ + 0.1, 2.5, 0.72, 'ပေါင်မုန့်', 'Bakery', { bg: '#F4DDA6' });
  g.box(0, DY + DH + 0.62, FZ + 0.06, 2.7, 0.88, 0.06, C.woodD);
  g.box(0, DY + DH + 1.13, FZ + 0.08, 0.9, 0.24, 0.24, C.crust);
  g.box(0, DY + DH + 1.27, FZ + 0.08, 0.7, 0.08, 0.2, C.crustL);
  for (const x of [-0.25, 0, 0.25]) g.box(x, DY + DH + 1.32, FZ + 0.16, 0.06, 0.03, 0.12, C.crustD);
  // a lamp bracket by the door, a bench and sacks, a bicycle with a bread basket
  g.box(-1.6, 2.7, FZ + 0.25, 0.08, 0.08, 0.5, C.iron);
  g.box(-1.6, 2.5, FZ + 0.48, 0.24, 0.3, 0.24, C.lit);
  g.box(-1.6, 2.68, FZ + 0.48, 0.3, 0.06, 0.3, C.iron);
  glow(g, ctx, -1.6, 2.5, FZ + 0.48);
  for (let k = 0; k < 3; k++) { g.box(-3.7 + k * 0.62, 0.26, FZ + 0.42, 0.56, 0.42 - (k % 2) * 0.06, 0.48, k % 2 ? C.sackD : C.sack); g.box(-3.7 + k * 0.62, 0.48, FZ + 0.42, 0.3, 0.06, 0.2, C.sackD); }
  g.box(-3.4, 0.7, FZ + 0.42, 0.56, 0.4, 0.48, C.sack);
  // the covered link north along the east side to the oven house (room behind the yard)
  if (it.link) {
    const [lx0, lx1, lz0] = it.link; // local x range and how far back it runs
    g.boxMin(lx0, 0, lz0, lx1, 3.0, -D / 2, C.brickD);
    g.boxMin(lx0 - 0.2, 3.0, lz0 - 0.1, lx1 + 0.1, 3.12, -D / 2 + 0.1, C.tinD);
    for (let z = lz0 + 0.3; z < -D / 2; z += 0.5) g.box((lx0 + lx1) / 2, 3.17, z, lx1 - lx0 + 0.25, 0.05, 0.06, C.tin);
    for (let z = lz0 + 0.8; z < -D / 2 - 0.5; z += 2.4) g.box(lx0 - 0.03, 1.7, z, 0.06, 0.7, 0.8, C.dark2); // little side windows on the yard
  }
}
function bakeryBack(g, f, it, ctx) {
  // the oven house: the back of the ovens; its south wall (facing the yard) has two oven vents low down and,
  // between them, three worn brick steps up to the plank back door (room provingroom)
  const W = it.w, D = it.d, H = 3.4, FZ = D / 2, dx = it.door || 0;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.3, FZ + 1.6, 0.004, C.shadow);
  g.boxMin(-W / 2 - 0.1, 0, -D / 2 - 0.05, W / 2 + 0.1, 0.25, FZ + 0.1, C.stone);
  const holes = [[dx - 0.55, 0.85, dx + 0.55, 2.85], [dx - 2.7, 0.3, dx - 1.9, 0.75], [dx + 1.9, 0.3, dx + 2.7, 0.75]];
  g.boxMin(-W / 2, 0.25, -D / 2, W / 2, H, FZ - 0.25, C.brickD);
  slab(g, -W / 2, W / 2, 0.25, H, FZ - 0.25, FZ, C.brick, holes);
  brickFace(g, -W / 2, W / 2, 0.25, H - 0.2, FZ, holes, 1313);
  // the oven vents: iron frames, a red glow inside, soot fanned up the wall above them
  for (const sx of [-1, 1]) {
    const vx = dx + sx * 2.3;
    g.boxMin(vx - 0.42, 0.26, FZ - 0.25, vx + 0.42, 0.79, FZ - 0.2, C.soot);
    g.boxMin(vx - 0.3, 0.34, FZ - 0.2, vx + 0.3, 0.68, FZ - 0.16, C.ember);
    for (let k = 0; k < 4; k++) g.box(vx - 0.3 + k * 0.2, 0.52, FZ - 0.08, 0.04, 0.48, 0.04, C.iron);
    g.boxMin(vx - 0.48, 0.79, FZ - 0.02, vx + 0.48, 0.86, FZ + 0.06, C.iron);
    for (let k = 0; k < 3; k++) g.box(vx, 1.05 + k * 0.32, FZ + 0.016, 0.9 - k * 0.24, 0.3, 0.012, k ? '#5A3A2C' : '#4A3329');
  }
  // the back door, up three steps; a horseshoe of flour on the top step
  g.boxMin(dx - 0.55, 0.85, FZ - 0.22, dx + 0.55, 2.85, FZ - 0.12, C.woodD);
  for (let k = 0; k < 5; k++) g.boxMin(dx - 0.5 + k * 0.2, 0.9, FZ - 0.12, dx - 0.32 + k * 0.2, 2.8, FZ - 0.06, jitter(C.wood, 0.08, k + 3));
  g.box(dx, 1.4, FZ - 0.04, 0.9, 0.08, 0.04, C.woodDD);
  g.box(dx, 2.3, FZ - 0.04, 0.9, 0.08, 0.04, C.woodDD);
  g.box(dx + 0.35, 1.85, FZ - 0.02, 0.07, 0.07, 0.06, C.iron);
  g.boxMin(dx - 0.7, 2.85, FZ, dx + 0.7, 3.0, FZ + 0.12, C.stoneL);
  for (let k = 0; k < 3; k++) g.boxMin(dx - 0.75 + k * 0.03, 0, FZ, dx + 0.75 - k * 0.03, 0.85 - k * 0.28, FZ + 0.4 * (k + 1), k === 1 ? C.brickL : C.brick);
  for (let k = 0; k < 3; k++) g.box(dx - 0.2 + k * 0.24, 0.86, FZ + 0.2, 0.18, 0.012, 0.12, C.flour);
  // tin roof, a hanging lamp, a mitt on a nail, a tray rack and a broom against the wall
  gableEnds(g, W, D, H, 1.1, C.brickD);
  tinRoof(g, W, D, H, 1.1, C.tin, 77);
  g.box(dx - 1.1, 2.6, FZ + 0.3, 0.06, 0.06, 0.6, C.iron);
  g.box(dx - 1.1, 2.38, FZ + 0.56, 0.22, 0.28, 0.22, C.lit);
  glow(g, ctx, dx - 1.1, 2.38, FZ + 0.56);
  g.box(dx + 1.0, 1.7, FZ + 0.05, 0.22, 0.3, 0.06, C.maroon);
  const rx = dx + 4.4;
  for (const sx of [-0.55, 0.55]) g.box(rx + sx, 0.9, FZ + 0.35, 0.06, 1.8, 0.06, C.woodD);
  for (let k = 0; k < 5; k++) { g.box(rx, 0.3 + k * 0.32, FZ + 0.35, 1.2, 0.04, 0.5, C.woodL); g.box(rx, 0.34 + k * 0.32, FZ + 0.35, 1.0, 0.03, 0.42, C.tinD); }
  g.boxR(dx - 3.6, 0.8, FZ + 0.12, 0.06, 1.6, 0.06, C.bamboo, 0.15, 0, 0.05);
  g.boxR(dx - 3.6, 0.12, FZ + 0.25, 0.3, 0.24, 0.12, C.bambooD, 0.15, 0, 0.05);
  // windows west of the door (the back room's), shutters closed
  win(g, dx - 5.2, 1.8, FZ, 0.9, 0.8, { shut: C.greenD, frame: C.woodD });
  win(g, dx + 6.8, 1.8, FZ, 0.9, 0.8, { bars: true, frame: C.woodD });
  // a water jar and a basin by the steps
  g.box(dx - 1.5, 0.32, FZ + 0.55, 0.5, 0.6, 0.5, C.terra);
  g.box(dx - 1.5, 0.32, FZ + 0.55, 0.56, 0.24, 0.56, C.terraL);
  g.box(dx - 1.5, 0.66, FZ + 0.55, 0.36, 0.08, 0.36, C.wood);
  g.box(dx + 1.5, 0.12, FZ + 0.7, 0.7, 0.24, 0.5, C.tinD);
}
function noteWall(g, f, it, ctx) {
  const L = it.w, PX = L / 2 - 0.15;
  f.flat(-L / 2 - 0.9, -0.3, L / 2 + 0.2, 1.3, 0.004, C.shadow);
  for (const sx of [-1, 0, 1]) {
    g.box(sx * PX, 0.07, 0, 0.32, 0.14, 0.32, C.stone);
    g.box(sx * PX, 1.2, 0, 0.18, 2.3, 0.18, C.woodD);
  }
  for (let x = -PX + 0.1, k = 0; x < PX - 0.05; x += 0.3, k++) g.boxMin(x, 0.42, -0.08, Math.min(x + 0.29, PX - 0.08), 2.1, 0.02, jitter(C.wood, 0.07, k));
  g.boxMin(-PX + 0.12, 0.55, 0.02, PX - 0.12, 1.92, 0.05, '#B98E5C'); // cork
  const r = rng(52);
  for (let k = 0; k < 30; k++) g.box(-PX + 0.3 + r() * (2 * PX - 0.6), 0.62 + r() * 1.24, 0.052, 0.04, 0.02, 0.006, '#A07A4C');
  for (const y of [0.5, 1.92]) g.boxMin(-PX + 0.06, y - 0.04, 0.02, PX - 0.06, y + 0.04, 0.08, C.woodD);
  // header board and the little plank roof
  g.boxMin(-PX + 0.06, 1.96, -0.02, PX - 0.06, 2.24, 0.07, C.maroon);
  g.boxMin(-PX + 0.08, 2.22, 0.0, PX - 0.08, 2.25, 0.075, C.gold);
  board(ctx, 0, 2.1, 0.09, 2.2, 0.26, 'စာကပ်နံရံ', null, { bg: C.maroon, border: null, color: '#F6E7C6', size: 64, width: 512, height: 64 });
  const R0 = 2.62, R1 = 2.4, rl = Math.hypot(0.7, R0 - R1), ra = Math.atan2(R0 - R1, 0.7);
  for (let x = -PX - 0.3, k = 0; x < PX + 0.3; x += 0.36, k++) g.boxR(x + 0.18, (R0 + R1) / 2, 0.16, 0.35, 0.05, rl, jitter(k % 2 ? C.woodL : C.wood, 0.05, k + 50), ra, 0, 0);
  g.box(0, R1 - 0.03, 0.52, 2 * PX + 0.7, 0.1, 0.04, C.maroon);
  for (const sx of [-1, 1]) g.boxR(sx * PX, 2.28, 0.25, 0.06, 0.06, 0.5, C.woodD, -0.35, 0, 0);
  // the ledge with seven pin tins (the reply pins), under the board
  g.boxMin(-PX + 0.1, 0.36, 0.0, PX - 0.1, 0.42, 0.26, C.woodD);
  for (let i = 0; i < 7; i++) {
    const x = -PX + (2 * PX * (i + 0.5)) / 7;
    g.box(x, 0.48, 0.15, 0.11, 0.1, 0.11, C.tin);
    g.box(x, 0.54, 0.15, 0.08, 0.04, 0.08, i % 2 ? C.red : C.gold);
  }
  // today it is nearly bare: an old recipe card and a lost-cat notice (the day files pin the rest)
  g.box(-PX + 1.4, 1.38, 0.065, 0.62, 0.78, 0.012, C.paper);
  for (let k = 0; k < 5; k++) g.box(-PX + 1.4, 1.62 - k * 0.11, 0.073, 0.44 - (k % 2) * 0.1, 0.025, 0.006, '#8A7A66');
  g.box(-PX + 1.4, 1.74, 0.075, 0.05, 0.05, 0.02, C.red);
  g.boxR(PX - 1.9, 1.1, 0.065, 0.58, 0.7, 0.012, '#F1E3C2', 0, 0, 0.06);
  g.boxR(PX - 1.9, 1.18, 0.074, 0.3, 0.22, 0.006, '#7A6A5A', 0, 0, 0.06); // the cat drawn on it
  g.boxR(PX - 1.97, 1.31, 0.075, 0.07, 0.07, 0.006, '#7A6A5A', 0, 0, 0.8);
  g.boxR(PX - 1.83, 1.31, 0.075, 0.07, 0.07, 0.006, '#7A6A5A', 0, 0, 0.8);
  for (let k = 0; k < 3; k++) g.box(PX - 1.9, 0.94 - k * 0.09, 0.075, 0.36, 0.025, 0.006, '#8A7A66');
  // west end: the drawer chest and Nay Chi's stool; a lamp on the end post
  g.box(-PX - 0.6, 0.34, 0.15, 0.56, 0.6, 0.42, C.wood);
  g.box(-PX - 0.6, 0.66, 0.15, 0.62, 0.05, 0.48, C.woodD);
  for (const y of [0.2, 0.46]) { g.box(-PX - 0.6, y, 0.37, 0.46, 0.2, 0.02, C.woodL); g.box(-PX - 0.6, y, 0.39, 0.08, 0.03, 0.03, C.gold); }
  stool(g, -PX + 0.3, 0.8, C.woodL, 0.4);
  g.box(PX, 2.1, 0.2, 0.06, 0.06, 0.32, C.iron);
  g.box(PX, 1.92, 0.34, 0.2, 0.26, 0.2, C.lit);
  glow(g, ctx, PX, 1.92, 0.34);
}
function eveningClass(g, f, it, ctx) {
  const W = it.w, D = it.d, P = 0.62, H = 3.5, FZ = D / 2, SK = 0.25, AL = 2.2, dx = it.door || 1.3;
  const DW = 1.15, DH = 2.15;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.3, FZ + 1.2, 0.004, C.shadow);
  g.boxMin(-W / 2 - 0.1, 0, -D / 2 - 0.05, W / 2 + 0.1, P, FZ + 0.08, C.stone);
  g.boxMin(-W / 2 - 0.12, P - 0.06, FZ - 0.02, W / 2 + 0.12, P, FZ + 0.12, C.stoneL);
  g.boxMin(-W / 2, P, -D / 2, W / 2, H, FZ - AL, C.limeD);
  for (const sx of [-1, 1]) g.boxMin(sx < 0 ? -W / 2 : W / 2 - 0.25, P, FZ - AL, sx < 0 ? -W / 2 + 0.25 : W / 2, H, FZ - SK, C.lime);
  g.boxMin(-W / 2, H - 0.25, FZ - AL, W / 2, H, FZ - SK, C.lime);
  const holes = [[dx - DW / 2, P, dx + DW / 2, P + DH], [-2.6, 1.35, -1.3, 2.45]];
  slab(g, -W / 2, W / 2, P, H, FZ - SK, FZ, C.lime, holes);
  // lime wash worn at the foot, a green dado band, corner posts
  g.boxMin(-W / 2 - 0.01, P, FZ - 0.01, W / 2 + 0.01, P + 0.5, FZ + 0.012, C.limeD);
  for (const sx of [-1, 1]) g.boxMin(sx * W / 2 - 0.1, P, FZ - 0.05, sx * W / 2 + 0.1, H, FZ + 0.06, C.greenD);
  g.boxMin(-W / 2 - 0.1, H - 0.18, FZ - 0.05, W / 2 + 0.1, H, FZ + 0.08, C.greenD);
  // inside the doorway: grown-up benches in rows and the blackboard with today's chalk question
  alcove(g, dx - DW / 2, dx + DW / 2, P, P + DH, FZ - AL, FZ - SK, '#E7DCC6', C.woodD);
  g.boxMin(dx - DW / 2 + 0.05, P + 0.9, FZ - AL + 0.01, dx + DW / 2 - 0.05, P + 1.75, FZ - AL + 0.05, C.chalk);
  for (let k = 0; k < 3; k++) g.box(dx - 0.15 + (k % 2) * 0.15, P + 1.55 - k * 0.18, FZ - AL + 0.055, 0.5 - k * 0.1, 0.03, 0.01, '#F2EEE4');
  g.box(dx + 0.36, P + 1.2, FZ - AL + 0.055, 0.08, 0.12, 0.01, '#F2EEE4'); // the question mark
  for (const bz of [FZ - AL + 0.6, FZ - AL + 1.35]) {
    g.boxMin(dx - DW / 2 + 0.02, P + 0.42, bz, dx + DW / 2 - 0.02, P + 0.48, bz + 0.34, C.wood);
    g.boxMin(dx - DW / 2 + 0.02, P + 0.7, bz - 0.3, dx + DW / 2 - 0.02, P + 0.76, bz - 0.04, C.woodL);
  }
  // the green door, open by day (the leaf swung in against the jamb)
  g.boxR(dx + DW / 2 - 0.08, P + DH / 2, FZ - SK - 0.48, 0.07, DH - 0.06, 0.95, C.green, 0, 0.3, 0);
  g.boxMin(dx - DW / 2 - 0.12, P, FZ - 0.03, dx - DW / 2, P + DH + 0.12, FZ + 0.07, C.greenD);
  g.boxMin(dx + DW / 2, P, FZ - 0.03, dx + DW / 2 + 0.12, P + DH + 0.12, FZ + 0.07, C.greenD);
  g.boxMin(dx - DW / 2 - 0.12, P + DH, FZ - 0.03, dx + DW / 2 + 0.12, P + DH + 0.14, FZ + 0.07, C.greenD);
  steps(g, f, dx, DW + 0.9, FZ, 3, P / 3, 0.3, C.stone);
  // the sandal rack on the top step: big pairs and two small
  g.boxMin(dx - DW / 2 - 0.95, P, FZ + 0.0, dx - DW / 2 - 0.15, P + 0.32, FZ + 0.3, C.woodL);
  g.boxMin(dx - DW / 2 - 0.95, P + 0.15, FZ + 0.02, dx - DW / 2 - 0.15, P + 0.18, FZ + 0.28, C.woodD);
  const sandals = [[0.0, 0.3, C.woodDD], [0.32, 0.3, C.maroon], [0.6, 0.2, C.blue], [0.0, 0.3, C.ink], [0.36, 0.2, C.rose]];
  sandals.forEach(([sx, len, col], k) => { const y = k < 3 ? P + 0.34 : P + 0.2; g.box(dx - DW / 2 - 0.85 + sx, y, FZ + 0.15, 0.1, 0.03, len, col); g.box(dx - DW / 2 - 0.73 + sx, y, FZ + 0.15, 0.1, 0.03, len, col); });
  // the window left of the door (the tin sapling's sill is inside) and a slate shelf
  win(g, -1.95, 1.9, FZ, 1.3, 1.1, { shut: C.green, frame: C.greenD });
  g.boxMin(-2.72, 1.24, FZ + 0.02, -1.18, 1.3, FZ + 0.3, C.woodL);
  // the class board over the door and a little slate easel on the forecourt
  board(ctx, -0.6, H - 0.55, FZ + 0.09, 2.7, 0.62, 'ညနေ စာသင်တန်း', 'Evening Class', { bg: '#F7F2E6', border: C.greenD, size: 46 });
  g.boxR(-3.4, 0.62, FZ + 0.7, 0.66, 0.9, 0.05, C.woodD, -0.2, 0.25, 0);
  g.boxR(-3.4, 0.68, FZ + 0.73, 0.54, 0.7, 0.02, C.chalk, -0.2, 0.25, 0);
  for (let k = 0; k < 3; k++) g.boxR(-3.4, 0.86 - k * 0.14, FZ + 0.76, 0.34 - (k % 2) * 0.1, 0.03, 0.02, '#F2EEE4', -0.2, 0.25, 0);
  // a tiled roof, a school bell under the eave
  tileRoof(g, W, D, H, '#8E3B2E', 4, 0.3);
  g.box(W / 2 - 0.6, H - 0.4, FZ + 0.3, 0.06, 0.4, 0.06, C.iron);
  g.box(W / 2 - 0.6, H - 0.7, FZ + 0.3, 0.26, 0.26, 0.26, C.gold);
  potsAt(g, W / 2 - 1.6, FZ + 0.4, 3, 33);
}
function noodleHouse(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 3.6, FZ = D / 2, SK = 0.22, AL = 2.4, dx = it.door || 1.0;
  const DW = 2.2, DH = 2.3;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.3, FZ + 1.0, 0.004, C.shadow);
  g.boxMin(-W / 2 - 0.1, 0, -D / 2 - 0.05, W / 2 + 0.1, 0.22, FZ + 0.1, C.stone);
  g.boxMin(-W / 2, 0.22, -D / 2, W / 2, H, FZ - AL, C.woodG);
  for (const sx of [-1, 1]) g.boxMin(sx < 0 ? -W / 2 : W / 2 - 0.22, 0.22, FZ - AL, sx < 0 ? -W / 2 + 0.22 : W / 2, H, FZ - SK, C.woodG);
  g.boxMin(-W / 2, H - 0.22, FZ - AL, W / 2, H, FZ - SK, C.woodG);
  const holes = [[dx - DW / 2, 0.22, dx + DW / 2, 0.22 + DH], [-3.9, 1.1, -2.1, 2.1]];
  // the front: vertical planks round the holes
  slab(g, -W / 2, W / 2, 0.22, H, FZ - SK, FZ - 0.06, C.wood, holes);
  for (let x = -W / 2 + 0.15, k = 0; x < W / 2; x += 0.32, k++) {
    const segs = [];
    if (x > dx - DW / 2 - 0.1 && x < dx + DW / 2 + 0.1) segs.push([0.22 + DH, H]);
    else if (x > -4.0 && x < -2.0) { segs.push([0.22, 1.1]); segs.push([2.1, H]); }
    else segs.push([0.22, H]);
    for (const [a, b] of segs) g.boxMin(x, a, FZ - 0.07, Math.min(x + 0.3, W / 2), b, FZ, jitter(C.woodG, 0.07, k));
  }
  // inside: a lantern post, red tables and blue stools, a queue at the counter far back, steam
  alcove(g, dx - DW / 2, dx + DW / 2, 0.22, 0.22 + DH, FZ - AL, FZ - SK, '#7A5A40', C.woodD);
  g.boxMin(dx - DW / 2 + 0.1, 0.22, FZ - AL + 0.05, dx + DW / 2 - 0.1, 1.1, FZ - AL + 0.45, C.wood); // the counter
  g.box(dx - 0.5, 1.25, FZ - AL + 0.25, 0.5, 0.36, 0.5, C.tinD);
  g.box(dx - 0.5, 1.46, FZ - AL + 0.25, 0.42, 0.04, 0.42, '#E8A94A');
  for (let k = 0; k < 4; k++) g.box(dx + 0.3 + (k % 2) * 0.22, 1.16 + Math.floor(k / 2) * 0.1, FZ - AL + 0.25, 0.18, 0.08, 0.18, C.white);
  lowTable(g, dx - 0.45, FZ - AL + 1.3, C.red, 0.5);
  stool(g, dx + 0.4, FZ - AL + 1.2, C.blue, 0.34);
  stool(g, dx - 0.45, FZ - SK - 0.35, C.blue, 0.34);
  // the double door propped open, a cloth curtain half drawn over the top, red lantern left, blue right
  for (const sx of [-1, 1]) g.boxR(dx + sx * (DW / 2 - 0.05), 0.22 + DH / 2, FZ - SK - 0.5, 0.06, DH - 0.06, 1.0, C.wood, 0, sx * 0.2, 0);
  g.boxMin(dx - DW / 2, 0.22 + DH - 0.55, FZ - 0.08, dx + DW / 2, 0.22 + DH, FZ - 0.03, '#E8E0CC');
  for (let k = 0; k < 4; k++) g.boxMin(dx - DW / 2 + 0.05 + k * 0.54, 0.22 + DH - 0.55, FZ - 0.03, dx - DW / 2 + 0.06 + k * 0.54 + 0.02, 0.22 + DH, FZ - 0.01, '#C9BFA6');
  g.box(dx, 0.22 + DH - 0.3, FZ - 0.01, 0.9, 0.22, 0.02, C.red);
  g.boxMin(dx - DW / 2 - 0.12, 0.22 + DH, FZ - 0.08, dx + DW / 2 + 0.12, 0.22 + DH + 0.16, FZ + 0.06, C.woodD);
  lantern(g, dx - DW / 2 - 0.45, 2.45, FZ + 0.4, C.red);
  lantern(g, dx + DW / 2 + 0.45, 2.45, FZ + 0.4, C.blue);
  // the left window: noodles hanging to dry inside, menu boards
  win(g, -3.0, 1.6, FZ - 0.06, 1.8, 1.0, { pane: '#5A4636', frame: C.woodD });
  for (let k = 0; k < 7; k++) g.box(-3.7 + k * 0.23, 1.62, FZ - 0.02, 0.06, 0.62, 0.02, '#F3E6B8');
  g.box(-3.0, 1.95, FZ, 1.7, 0.04, 0.04, C.woodD);
  for (const [mx, col] of [[-1.25, '#F7F2E6'], [-0.75, '#F3D7A0']]) { g.box(mx, 1.6, FZ + 0.02, 0.4, 0.8, 0.04, col); for (let k = 0; k < 4; k++) g.box(mx, 1.85 - k * 0.16, FZ + 0.045, 0.28, 0.03, 0.01, C.redD); }
  // eave beam, tin roof with a steam vent (smoke), a sign board
  g.boxMin(-W / 2 - 0.2, H - 0.05, FZ - 0.1, W / 2 + 0.2, H + 0.1, FZ + 0.25, C.woodD);
  gableEnds(g, W, D, H, 1.4, C.woodG);
  tinRoof(g, W, D, H, 1.4, '#A9ABA4', 401);
  g.box(-1.6, H + 1.25, -0.6, 0.7, 0.9, 0.7, C.tinD);
  g.box(-1.6, H + 1.78, -0.6, 1.0, 0.12, 1.0, C.tin);
  smoke(g, ctx, -1.6, H + 2.0, -0.6);
  board(ctx, -1.6, H - 0.55, FZ + 0.08, 2.9, 0.62, 'ဒေါ်စောယု ခေါက်ဆွဲ', 'Noodle House', { bg: '#F7E3B5', border: C.redD, size: 46 });
  g.box(-1.6, H - 0.55, FZ + 0.04, 3.05, 0.76, 0.06, C.redD);
  g.box(W / 2 - 0.5, 0.42, FZ + 0.35, 0.5, 0.4, 0.5, C.tinD); // a slop bucket and a stack of bowls
  for (let k = 0; k < 4; k++) g.box(W / 2 - 0.5, 0.66 + k * 0.07, FZ + 0.35, 0.32 - k * 0.02, 0.06, 0.32 - k * 0.02, C.white);
}
function loomShed(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 3.0, FZ = D / 2, dx = it.door || 3.6;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.3, FZ + 0.9, 0.004, C.shadow);
  g.boxMin(-W / 2 - 0.1, 0, -D / 2 - 0.05, W / 2 + 0.1, 0.25, FZ + 0.1, C.stone);
  const wins = [-5.2, -2.6, 0.0];
  const holes = wins.map((x) => [x - 0.85, 1.1, x + 0.85, 2.2]);
  g.boxMin(-W / 2, 0.25, -D / 2, W / 2, H, FZ - 1.2, C.woodG);
  for (const sx of [-1, 1]) g.boxMin(sx < 0 ? -W / 2 : W / 2 - 0.2, 0.25, FZ - 1.2, sx < 0 ? -W / 2 + 0.2 : W / 2, H, FZ - 0.2, C.woodG);
  g.boxMin(-W / 2, H - 0.2, FZ - 1.2, W / 2, H, FZ - 0.2, C.woodG);
  slab(g, -W / 2, W / 2, 0.25, H, FZ - 0.2, FZ - 0.1, C.woodD, holes);
  for (let x = -W / 2, k = 0; x < W / 2 - 0.01; x += 0.36, k++) {
    if (Math.abs(x + 0.17 - dx) < 0.6) continue;
    const segs = holes.some((h) => x + 0.18 > h[0] && x + 0.18 < h[2]) ? [[0.25, 1.1], [2.2, H]] : [[0.25, H]];
    for (const [a, b] of segs) g.boxMin(x, a, FZ - 0.1, Math.min(x + 0.35, W / 2), b, FZ, jitter('#9A7552', 0.08, k));
  }
  g.boxMin(-W / 2, 0.25, FZ, W / 2, 0.4, FZ + 0.04, C.woodDD);
  // windows: shutters propped open on sticks (top-hinged), looms in the dim light inside
  for (const x of wins) {
    alcove(g, x - 0.85, x + 0.85, 1.1, 2.2, FZ - 1.2, FZ - 0.2, '#5A4636', '#5A4636');
    for (const lx of [-0.45, 0.45]) {
      g.box(x + lx, 1.6, FZ - 0.75, 0.06, 1.0, 0.06, C.woodL);
      g.box(x + lx, 1.95, FZ - 0.75, 0.5, 0.06, 0.06, C.woodL);
      for (let k = 0; k < 5; k++) g.box(x + lx - 0.2 + k * 0.1, 1.55, FZ - 0.72, 0.012, 0.75, 0.012, ['#E2B33C', '#C8323C', '#F7F2E6', '#4E8C86', '#2F5DB3'][(k + Math.round(x)) % 5]);
    }
    g.boxR(x, 2.42, FZ + 0.42, 1.8, 0.06, 0.9, C.wood, -0.95, 0, 0);
    g.box(x, 2.2, FZ + 0.02, 1.9, 0.08, 0.1, C.woodD);
    g.boxR(x + 0.7, 1.75, FZ + 0.42, 0.04, 1.0, 0.04, C.woodD, 0.5, 0, 0);
  }
  // the plank door with a painted shuttle, a little lintel; skeins of thread drying under the eave
  g.boxMin(dx - 0.6, 0.25, FZ - 0.14, dx + 0.6, 2.3, FZ - 0.04, C.woodD);
  for (let k = 0; k < 4; k++) g.boxMin(dx - 0.55 + k * 0.28, 0.3, FZ - 0.04, dx - 0.29 + k * 0.28, 2.25, FZ + 0.0, jitter(C.wood, 0.08, k + 11));
  g.box(dx, 1.45, FZ + 0.02, 0.8, 0.18, 0.02, C.mustard);
  g.box(dx, 1.45, FZ + 0.03, 0.56, 0.08, 0.02, C.maroon);
  for (const sx of [-1, 1]) g.box(dx + sx * 0.42, 1.45, FZ + 0.02, 0.12, 0.1, 0.02, C.woodDD);
  g.box(dx + 0.4, 1.1, FZ + 0.03, 0.06, 0.1, 0.04, C.iron);
  g.boxMin(dx - 0.75, 2.3, FZ - 0.05, dx + 0.75, 2.45, FZ + 0.12, C.woodDD);
  g.box(0, H + 0.05, FZ + 0.5, W, 0.04, 0.04, C.ink);
  for (let k = 0; k < 9; k++) {
    const x = -W / 2 + 1.0 + k * ((W - 2) / 8);
    if (Math.abs(x - dx) < 0.8) continue;
    g.box(x, H - 0.25, FZ + 0.5, 0.18, 0.55, 0.08, ['#C8323C', '#E2B33C', '#2F5DB3', '#4E8C86', '#E8A0A8', '#F7F2E6', '#6E1F2A'][k % 7]);
  }
  // a low pitched tin roof, two spinning wheels by the door, baskets of bobbins
  gableEnds(g, W, D, H, 0.9, C.woodG);
  tinRoof(g, W, D, H, 0.9, C.tinL, 515, 0.7);
  for (const sx of [-1.3, 1.25]) {
    const x = dx + sx;
    g.box(x, 0.26, FZ + 0.6, 0.6, 0.08, 0.3, C.woodD);
    g.box(x, 0.65, FZ + 0.6, 0.06, 0.08, 0.06, C.woodD);
    for (const [w, h] of [[0.7, 0.06], [0.06, 0.7]]) g.box(x, 0.66, FZ + 0.62, w, h, 0.03, C.woodL);
  }
  g.box(-W / 2 + 0.8, 0.22, FZ + 0.5, 0.6, 0.44, 0.5, C.bamboo);
  for (let k = 0; k < 4; k++) g.box(-W / 2 + 0.62 + k * 0.12, 0.48, FZ + 0.5, 0.1, 0.14, 0.1, ['#C8323C', '#2F5DB3', '#E2B33C', '#F7F2E6'][k]);
  board(ctx, -2.6, H - 0.35, FZ + 0.06, 2.2, 0.48, 'ယက်ကန်းရုံ', 'Loom Shed', { bg: '#EFE2C6', border: C.woodDD, size: 46 });
}
function teaHouse(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 3.6, FZ = D / 2, SK = 0.25, AL = 2.6, dx = it.door || 0;
  const DW = 3.0, DH = 2.35;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.8, FZ + 1.4, 0.004, C.shadow);
  g.boxMin(-W / 2 - 0.1, 0, -D / 2 - 0.05, W / 2 + 0.1, 0.2, FZ + 0.1, C.stone);
  g.boxMin(-W / 2, 0.2, -D / 2, W / 2, H, FZ - AL, C.ochreD);
  for (const sx of [-1, 1]) g.boxMin(sx < 0 ? -W / 2 : W / 2 - 0.25, 0.2, FZ - AL, sx < 0 ? -W / 2 + 0.25 : W / 2, H, FZ - SK, C.ochre);
  g.boxMin(-W / 2, H - 0.25, FZ - AL, W / 2, H, FZ - SK, C.ochre);
  const holes = [[dx - DW / 2, 0.2, dx + DW / 2, 0.2 + DH]];
  slab(g, -W / 2, W / 2, 0.2, H, FZ - SK, FZ, C.ochre, holes);
  g.boxMin(-W / 2 - 0.01, 0.2, FZ - 0.01, W / 2 + 0.01, 0.75, FZ + 0.015, C.greenD); // green dado
  for (const sx of [-1, 1]) g.boxMin(sx * W / 2 - 0.1, 0.2, FZ - 0.05, sx * W / 2 + 0.1, H, FZ + 0.05, C.green);
  // inside: the brazier with the big kettle by the door, low tables and stools, the counter, oil lamps
  alcove(g, dx - DW / 2, dx + DW / 2, 0.2, 0.2 + DH, FZ - AL, FZ - SK, '#7A5638', '#6A4A30');
  g.boxMin(dx - DW / 2 + 0.1, 0.2, FZ - AL + 0.05, dx + DW / 2 - 0.1, 1.05, FZ - AL + 0.5, C.woodD);
  for (let k = 0; k < 5; k++) g.box(dx - 1.1 + k * 0.5, 1.15, FZ - AL + 0.25, 0.22, 0.2, 0.22, k % 2 ? C.glass : C.mustard);
  g.boxMin(dx - DW / 2 + 0.1, 1.55, FZ - AL + 0.01, dx + DW / 2 - 0.1, 1.6, FZ - AL + 0.3, C.woodL);
  for (let k = 0; k < 6; k++) g.box(dx - 1.15 + k * 0.46, 1.7, FZ - AL + 0.15, 0.16, 0.2, 0.16, C.white);
  const bx = dx + DW / 2 - 0.45;
  g.box(bx, 0.35, FZ - SK - 0.45, 0.6, 0.3, 0.6, C.iron);
  g.box(bx, 0.52, FZ - SK - 0.45, 0.5, 0.06, 0.5, C.ember);
  g.box(bx, 0.75, FZ - SK - 0.45, 0.48, 0.4, 0.48, C.tinD);
  g.box(bx, 0.98, FZ - SK - 0.45, 0.2, 0.08, 0.2, C.tin);
  g.boxR(bx - 0.32, 0.82, FZ - SK - 0.45, 0.24, 0.07, 0.07, C.tinD, 0, 0, 0.5);
  smoke(g, ctx, dx + DW / 2 + 0.3, H + 0.3, FZ - 0.6);
  lowTable(g, dx - 0.7, FZ - AL + 1.4, C.woodL, 0.42);
  stool(g, dx - 0.1, FZ - AL + 1.5, C.blue, 0.3); stool(g, dx - 1.25, FZ - AL + 1.25, C.red, 0.3);
  // bamboo blinds rolled up over the doorway, a valance, the painted cup sign
  g.boxMin(dx - DW / 2 - 0.1, 0.2 + DH, FZ - 0.04, dx + DW / 2 + 0.1, 0.2 + DH + 0.18, FZ + 0.08, C.woodD);
  for (let k = 0; k < 2; k++) g.box(dx + (k - 0.5) * 1.5, 0.2 + DH - 0.12, FZ + 0.16, 1.45, 0.24, 0.24, k ? C.bamboo : C.bambooD);
  for (let k = 0; k < 4; k++) g.box(dx - 1.3 + k * 0.86, 0.2 + DH - 0.12, FZ + 0.29, 0.04, 0.3, 0.02, C.maroon);
  g.box(dx - 2.4, H - 0.72, FZ + 0.12, 1.4, 0.95, 0.06, C.woodD);
  g.box(dx - 2.4, H - 0.72, FZ + 0.16, 1.24, 0.8, 0.02, '#F6E7C6');
  g.box(dx - 2.4, H - 0.8, FZ + 0.18, 0.46, 0.34, 0.02, C.white);
  g.box(dx - 2.4, H - 0.98, FZ + 0.18, 0.56, 0.06, 0.02, C.white);
  g.box(dx - 2.12, H - 0.78, FZ + 0.18, 0.12, 0.18, 0.02, C.white);
  g.box(dx - 2.4, H - 0.68, FZ + 0.19, 0.36, 0.1, 0.01, C.crustD);
  for (const sx of [-0.1, 0.1]) g.box(dx - 2.4 + sx, H - 0.45, FZ + 0.19, 0.04, 0.16, 0.01, '#B9B0A2'); // steam
  board(ctx, dx + 1.1, H - 0.55, FZ + 0.09, 2.4, 0.52, 'လက်ဖက်ရည်', 'Tea', { bg: '#F6E7C6', border: C.greenD, size: 48 });
  // the awning over the forecourt with stools and two low tables outside
  const n = Math.round(W / 0.55);
  for (let i = 0; i < n; i++) g.boxR(-W / 2 + (W * (i + 0.5)) / n, H - 0.15, FZ + 0.65, W / n + 0.005, 0.06, 1.35, i % 2 ? C.cream : C.green, 0.3, 0, 0);
  for (let i = 0; i < n; i++) g.box(-W / 2 + (W * (i + 0.5)) / n, H - 0.48, FZ + 1.28, W / n - 0.05, 0.14, 0.04, i % 2 ? C.cream : C.green);
  for (const tx of [-3.3, 3.3]) { lowTable(g, dx + tx, FZ + 0.9, C.woodL, 0.4); stool(g, dx + tx - 0.55, FZ + 0.95, C.red, 0.28); stool(g, dx + tx + 0.55, FZ + 0.85, C.blue, 0.28); g.box(dx + tx, 0.48, FZ + 0.9, 0.12, 0.1, 0.12, C.white); }
  // the side window looking east (at the kite), a tin roof with a pipe
  for (const sx of [1]) { g.box(sx * W / 2 + 0.02, 1.8, 0.4, 0.06, 1.0, 1.2, C.greenD); g.box(sx * W / 2 + 0.05, 1.8, 0.4, 0.04, 0.84, 1.04, C.dark2); g.box(sx * W / 2 + 0.07, 1.8, 0.4, 0.02, 0.84, 0.05, C.greenD); }
  gableEnds(g, W, D, H, 1.3, C.ochreD);
  tinRoof(g, W, D, H, 1.3, C.tin, 931);
  g.box(2.6, H + 1.6, -1.6, 0.22, 1.6, 0.22, C.tinD);
  g.box(2.6, H + 2.45, -1.6, 0.4, 0.1, 0.4, C.tinD);
  // the oil lamps hung by the door
  for (const sx of [-1, 1]) { g.box(dx + sx * (DW / 2 + 0.3), 2.5, FZ + 0.2, 0.05, 0.05, 0.4, C.iron); g.box(dx + sx * (DW / 2 + 0.3), 2.3, FZ + 0.38, 0.2, 0.26, 0.2, C.lit); glow(g, ctx, dx + sx * (DW / 2 + 0.3), 2.3, FZ + 0.38); }
}
function lampShop(g, f, it, ctx) {
  const W = it.w, D = it.d, H1 = 3.0, H2 = 5.4, FZ = D / 2, dx = it.door || -1.6, wx = 1.3;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.3, FZ + 0.9, 0.004, C.shadow);
  g.boxMin(-W / 2 - 0.1, 0, -D / 2 - 0.05, W / 2 + 0.1, 0.22, FZ + 0.1, C.stone);
  const holes = [[dx - 0.55, 0.22, dx + 0.55, 2.35], [wx - 1.25, 0.9, wx + 1.25, 2.3]];
  g.boxMin(-W / 2, 0.22, -D / 2, W / 2, H1, FZ - 1.6, C.brickD);
  for (const sx of [-1, 1]) g.boxMin(sx < 0 ? -W / 2 : W / 2 - 0.25, 0.22, FZ - 1.6, sx < 0 ? -W / 2 + 0.25 : W / 2, H1, FZ - 0.25, C.brickD);
  g.boxMin(-W / 2, H1 - 0.25, FZ - 1.6, W / 2, H1, FZ - 0.25, C.brickD);
  slab(g, -W / 2, W / 2, 0.22, H1, FZ - 0.25, FZ, C.brick, holes);
  brickFace(g, -W / 2, W / 2, 0.22, H1 - 0.1, FZ, holes, 4141);
  // the lit window: the counter, lamps on a beam, warm light
  alcove(g, wx - 1.25, wx + 1.25, 0.9, 2.3, FZ - 1.6, FZ - 0.25, '#F0C987', C.woodD);
  g.boxMin(wx - 1.2, 0.9, FZ - 1.2, wx + 1.2, 1.35, FZ - 0.9, C.woodL);
  g.box(wx, 2.05, FZ - 1.0, 2.4, 0.06, 0.06, C.woodD);
  for (let k = 0; k < 5; k++) { const x = wx - 0.95 + k * 0.48; g.box(x, 1.8, FZ - 1.0, 0.24, 0.3, 0.24, k % 2 ? C.tinL : C.tin); g.box(x, 1.8, FZ - 0.87, 0.14, 0.18, 0.02, C.lit); }
  g.box(wx - 0.6, 1.5, FZ - 1.05, 0.3, 0.3, 0.3, C.lit);
  g.boxMin(wx - 1.32, 0.82, FZ, wx + 1.32, 0.9, FZ + 0.2, C.stoneL);
  g.box(wx, 2.32, FZ + 0.02, 2.66, 0.1, 0.1, C.woodD);
  g.box(wx, 1.6, FZ - 0.05, 0.05, 1.4, 0.05, C.woodD);
  // the shop door
  alcove(g, dx - 0.55, dx + 0.55, 0.22, 2.35, FZ - 1.6, FZ - 0.25, '#6A4A35');
  g.boxR(dx + 0.45, 1.28, FZ - 0.65, 0.06, 2.06, 0.8, '#3E5F7A', 0, 0.4, 0);
  g.boxMin(dx - 0.68, 2.35, FZ, dx + 0.68, 2.5, FZ + 0.08, C.stoneL);
  // the upper floor: plaster, two shuttered windows, a little balcony with tin lamps drying
  g.boxMin(-W / 2, H1, -D / 2 + 0.1, W / 2, H2, FZ - 0.2, C.pinkP);
  g.boxMin(-W / 2 - 0.1, H1 - 0.05, FZ - 0.25, W / 2 + 0.1, H1 + 0.12, FZ + 0.45, C.woodD);
  for (const x of [-1.5, 1.5]) win(g, x, H1 + 1.25, FZ - 0.2, 0.8, 1.0, { shut: '#3E5F7A', frame: C.white });
  for (let x = -W / 2 + 0.2; x <= W / 2 - 0.15; x += 0.32) g.box(x, H1 + 0.42, FZ + 0.4, 0.04, 0.6, 0.04, C.iron);
  g.box(0, H1 + 0.74, FZ + 0.4, W - 0.2, 0.05, 0.06, C.iron);
  g.boxMin(-W / 2 - 0.12, H2 - 0.05, -D / 2, W / 2 + 0.12, H2 + 0.1, FZ, C.stoneD);
  g.boxMin(-W / 2 - 0.05, H2 + 0.1, FZ - 0.3, W / 2 + 0.05, H2 + 0.45, FZ - 0.05, C.pinkP);
  g.boxMin(-W / 2 + 0.1, H2 + 0.08, -D / 2 + 0.1, W / 2 - 0.1, H2 + 0.16, FZ - 0.3, C.tinD);
  // tin lamps hung all along the eave (two lit), the shop sign
  for (let k = 0; k < 6; k++) {
    const x = -W / 2 + 0.6 + k * ((W - 1.2) / 5);
    g.box(x, H1 - 0.15, FZ + 0.35, 0.02, 0.24, 0.02, C.ink);
    g.box(x, H1 - 0.42, FZ + 0.35, 0.26, 0.3, 0.26, k % 2 ? C.tinL : C.tin);
    g.box(x, H1 - 0.25, FZ + 0.35, 0.18, 0.08, 0.18, C.tinD);
    g.box(x, H1 - 0.42, FZ + 0.49, 0.14, 0.18, 0.02, k === 1 || k === 4 ? C.lit : C.dark2);
    if (k === 1 || k === 4) glow(g, ctx, x, H1 - 0.42, FZ + 0.35);
  }
  board(ctx, 0, H1 + 0.36, FZ + 0.47, 2.8, 0.5, 'သံပြား မီးအိမ်', 'Tin Lamps', { bg: '#E6EEF2', border: '#3E5F7A', size: 44 });
  potsAt(g, -W / 2 + 0.3, FZ + 0.35, 2, 71);
}
function boxShop(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 3.1, FZ = D / 2, dx = it.door || -0.6, wx = 1.9;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.3, FZ + 0.9, 0.004, C.shadow);
  g.boxMin(-W / 2 - 0.1, 0, -D / 2 - 0.05, W / 2 + 0.1, 0.2, FZ + 0.1, C.stone);
  const holes = [[dx - 0.5, 0.2, dx + 0.5, 1.95], [wx - 0.85, 0.85, wx + 0.85, 2.05]];
  g.boxMin(-W / 2, 0.2, -D / 2, W / 2, H, FZ - 1.3, '#9A7552');
  for (const sx of [-1, 1]) g.boxMin(sx < 0 ? -W / 2 : W / 2 - 0.2, 0.2, FZ - 1.3, sx < 0 ? -W / 2 + 0.2 : W / 2, H, FZ - 0.2, '#9A7552');
  g.boxMin(-W / 2, H - 0.2, FZ - 1.3, W / 2, H, FZ - 0.2, '#9A7552');
  slab(g, -W / 2, W / 2, 0.2, H, FZ - 0.2, FZ - 0.08, C.wood, holes);
  for (let x = -W / 2, k = 0; x < W / 2 - 0.01; x += 0.4, k++) {
    const segs = [];
    let y = 0.2;
    for (const h of holes) if (x + 0.2 > h[0] && x + 0.2 < h[2]) { if (h[1] > y) segs.push([y, h[1]]); y = h[3]; }
    segs.push([y, H]);
    for (const [a, b] of segs) if (b > a + 0.02) g.boxMin(x, a, FZ - 0.08, Math.min(x + 0.39, W / 2), b, FZ, jitter('#B08A62', 0.07, k));
  }
  // the low door
  alcove(g, dx - 0.5, dx + 0.5, 0.2, 1.95, FZ - 1.3, FZ - 0.2, '#5A4636');
  g.boxR(dx - 0.42, 1.07, FZ - 0.55, 0.06, 1.7, 0.75, C.woodD, 0, -0.35, 0);
  g.boxMin(dx - 0.62, 1.95, FZ - 0.08, dx + 0.62, 2.07, FZ + 0.08, C.woodDD);
  // over it, hung on two cords: a folded lunch box (the sign)
  for (const sx of [-0.3, 0.3]) g.box(dx + sx, 2.3, FZ + 0.25, 0.02, 0.4, 0.02, C.ink);
  g.box(dx, 2.15, FZ + 0.25, 0.8, 0.36, 0.5, '#F1E3C2');
  g.box(dx, 2.35, FZ + 0.25, 0.84, 0.06, 0.54, C.red);
  g.box(dx, 2.15, FZ + 0.51, 0.5, 0.06, 0.01, C.redD);
  g.box(dx, 2.42, FZ + 0.25, 0.3, 0.08, 0.06, C.redD);
  // the window: paper boxes in towers
  alcove(g, wx - 0.85, wx + 0.85, 0.85, 2.05, FZ - 1.3, FZ - 0.2, '#6A5240');
  const cols = ['#F1E3C2', '#E8A0A8', '#9CC3DE', '#E2B33C', '#F7F2E6', '#C8873E'];
  let k = 0;
  for (const bx of [-0.5, 0.05, 0.55]) for (let y = 0.88, j = 0; y < 1.95 && j < 4; j++, k++) { const h = 0.18 + (k % 3) * 0.06; g.box(wx + bx, y + h / 2, FZ - 0.7, 0.42 - (j % 2) * 0.06, h, 0.4, cols[k % cols.length]); y += h + 0.01; }
  g.boxMin(wx - 0.95, 0.78, FZ - 0.08, wx + 0.95, 0.86, FZ + 0.16, C.woodD);
  g.boxMin(wx - 0.95, 2.05, FZ - 0.08, wx + 0.95, 2.12, FZ + 0.08, C.woodD);
  // a bench out front with a half-folded box and flattened card
  g.box(-W / 2 + 0.9, 0.42, FZ + 0.45, 1.2, 0.06, 0.4, C.woodL);
  for (const sx of [-0.5, 0.5]) g.box(-W / 2 + 0.9 + sx, 0.2, FZ + 0.45, 0.06, 0.4, 0.34, C.woodD);
  g.box(-W / 2 + 0.7, 0.55, FZ + 0.45, 0.4, 0.2, 0.3, '#F1E3C2');
  g.boxR(-W / 2 + 1.2, 0.47, FZ + 0.45, 0.5, 0.02, 0.36, '#E8D7B0', 0, 0.3, 0);
  gableEnds(g, W, D, H, 1.1, '#9A7552');
  tinRoof(g, W, D, H, 1.1, C.tin, 1717);
  board(ctx, wx, H - 0.45, FZ + 0.04, 1.9, 0.42, 'ဘူးခေါက်ဆိုင်', null, { bg: '#F1E3C2', border: C.redD, size: 50, width: 512, height: 112 });
}
const GOODS = {
  stoves(g, W, FZ) {
    for (let row = 0; row < 3; row++) for (let i = 0; i < 5 - row; i++) {
      const x = -W / 2 + 1.2 + i * 0.62 + row * 0.31, y = row * 0.44;
      g.box(x, y + 0.2, FZ - 0.9, 0.5, 0.4, 0.5, row % 2 ? C.terraL : C.terra);
      g.box(x, y + 0.42, FZ - 0.9, 0.56, 0.05, 0.56, C.terraD);
      g.box(x, y + 0.2, FZ - 0.64, 0.2, 0.14, 0.02, C.terraD);
    }
    for (let k = 0; k < 3; k++) stoveAt(g, W / 2 - 1.0 - k * 0.7, FZ - 0.35, k === 0);
    g.box(1.0, 0.45, -0.6, 1.4, 0.9, 0.8, C.woodL); g.box(1.0, 1.0, -0.6, 0.5, 0.2, 0.5, C.terraL);
  },
  tin(g, W, FZ) {
    for (let k = 0; k < 6; k++) g.boxR(-W / 2 + 0.8 + k * 0.12, 1.0, FZ - 1.4 + k * 0.05, 0.04, 1.8, 1.2, k % 2 ? C.tinL : C.tin, 0, 0, -0.18);
    g.box(0.4, 0.5, FZ - 0.6, 0.5, 1.0, 0.5, C.iron); g.box(0.4, 1.05, FZ - 0.6, 0.8, 0.12, 0.34, C.ash);
    for (let k = 0; k < 4; k++) g.box(W / 2 - 0.9, 0.2 + k * 0.42, FZ - 0.3, 0.42 - k * 0.04, 0.4, 0.42 - k * 0.04, k % 2 ? C.tinD : C.tin);
    for (let k = 0; k < 5; k++) { g.box(-0.6 + k * 0.4, 2.3, FZ - 0.2, 0.02, 0.3, 0.02, C.ink); g.box(-0.6 + k * 0.4, 2.05, FZ - 0.2, 0.24, 0.26, 0.24, C.tinL); }
  },
  paper(g, W, FZ) {
    for (let row = 0; row < 3; row++) { g.box(0, 0.5 + row * 0.62, FZ - 1.6, W - 1.0, 0.06, 0.8, C.woodD); for (let i = 0; i < Math.floor(W - 1.4) * 2; i++) g.box(-W / 2 + 0.8 + i * 0.5, 0.75 + row * 0.62, FZ - 1.55, 0.4, 0.4, 0.7, ['#FBF6EA', '#F1E3C2', '#E8D7B0', '#F6E7C6', '#E3EEF2'][(i + row) % 5]); }
    g.box(0.6, 0.45, FZ - 0.2, 1.6, 0.06, 0.8, C.woodL); for (const sx of [-0.7, 0.7]) g.box(0.6 + sx, 0.22, FZ - 0.2, 0.06, 0.44, 0.7, C.woodD);
    g.box(0.6, 0.5, FZ - 0.2, 1.3, 0.03, 0.6, C.paper);
  },
  kites(g, W, FZ) {
    const cols = [C.red, C.mustard, C.blue, C.teal, C.rose];
    for (let k = 0; k < 6; k++) { const x = -W / 2 + 0.8 + k * ((W - 1.6) / 5), y = 1.5 + (k % 2) * 0.5; g.boxR(x, y, FZ - 1.3, 0.62, 0.62, 0.03, cols[k % 5], 0, 0, Math.PI / 4); g.box(x, y, FZ - 1.27, 0.03, 0.86, 0.02, C.bambooD); g.box(x, y - 0.6, FZ - 1.27, 0.03, 0.4, 0.02, cols[(k + 2) % 5]); }
    g.box(0, 0.45, FZ - 0.4, 2.2, 0.06, 0.8, C.woodL); for (const sx of [-1, 1]) g.box(sx, 0.22, FZ - 0.4, 0.06, 0.44, 0.7, C.woodD);
    for (let k = 0; k < 8; k++) g.box(-0.9 + k * 0.25, 0.5, FZ - 0.4, 0.03, 0.03, 0.7, C.bamboo);
  },
  baskets(g, W, FZ) {
    for (let k = 0; k < 9; k++) { const x = -W / 2 + 0.7 + (k % 5) * 0.75, y = Math.floor(k / 5) * 0.5; g.box(x, y + 0.24, FZ - 1.0 - (k % 2) * 0.3, 0.6, 0.46, 0.6, k % 3 ? C.bamboo : C.bambooD); g.box(x, y + 0.48, FZ - 1.0 - (k % 2) * 0.3, 0.66, 0.04, 0.66, C.bambooD); }
    for (let k = 0; k < 10; k++) g.box(W / 2 - 1.2 + (k % 2) * 0.15, 0.9, FZ - 0.4 + Math.floor(k / 2) * 0.03, 0.04, 1.8, 0.04, C.bamboo);
  },
};
function workShed(g, f, it, ctx) {
  // an open-fronted workshop: back and side walls of brick or plank, a tin roof on posts over the front
  const W = it.w, D = it.d, H = 3.1, FZ = D / 2, r = rng(it.seed || 3);
  const wall = [C.brickD, '#9A7552', C.ochreD][Math.floor(r() * 3)];
  f.flat(-W / 2 - 0.2, -D / 2 - 0.3, W / 2 + 0.3, FZ + 0.8, 0.004, C.shadow);
  f.flat(-W / 2 + 0.2, -D / 2 + 0.6, W / 2 - 0.2, FZ, 0.006, '#D9C49A'); // the swept work floor
  g.boxMin(-W / 2, 0, -D / 2, W / 2, H, -D / 2 + 0.6, wall);
  g.boxMin(-W / 2, 0, -D / 2, -W / 2 + 0.25, H, FZ - 1.4, wall);
  g.boxMin(W / 2 - 0.25, 0, -D / 2, W / 2, H, FZ - 1.4, wall);
  g.boxMin(-W / 2 + 0.25, H - 0.22, -D / 2 + 0.6, W / 2 - 0.25, H, FZ - 1.4, shade(wall, 0.9));
  for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.15), H / 2, FZ - 0.15, 0.2, H, 0.2, C.woodD);
  g.box(0, H - 0.1, FZ - 0.15, W, 0.2, 0.22, C.woodD);
  // a work bench along the back wall, tools on a peg rail
  g.box(0, 0.8, -D / 2 + 0.95, W - 1.2, 0.08, 0.6, C.woodL);
  for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.9), 0.4, -D / 2 + 0.95, 0.08, 0.8, 0.5, C.woodD);
  g.box(0, 1.8, -D / 2 + 0.64, W - 1.4, 0.06, 0.06, C.woodD);
  for (let k = 0; k < 6; k++) g.box(-W / 2 + 1.2 + k * ((W - 2.4) / 5), 1.6, -D / 2 + 0.68, 0.08, 0.36, 0.04, k % 2 ? C.iron : C.woodD);
  (GOODS[it.goods] || GOODS.baskets)(g, W, FZ);
  gableEnds(g, W, D, H, 0.9, wall);
  tinRoof(g, W, D, H, 0.9, r() < 0.5 ? C.tin : C.tinL, it.seed || 9);
  if (it.sign) board(ctx, 0, H - 0.45, FZ + 0.1, Math.min(2.8, W - 1), 0.44, it.sign, null, { bg: '#F1E3C2', border: C.woodDD, size: 46, width: 512, height: 112 });
  if (r() < 0.6) { g.box(W / 2 - 0.4, 1.4, FZ + 0.2, 0.06, 0.06, 0.4, C.iron); g.box(W / 2 - 0.4, 1.2, FZ + 0.38, 0.2, 0.26, 0.2, C.lit); glow(g, ctx, W / 2 - 0.4, 1.2, FZ + 0.38); }
}
function hHouse(g, f, it, ctx) {
  const W = it.w, D = it.d, FZ = D / 2, r = rng(it.seed || 1);
  const plaster = [C.ochre, C.lime, C.pinkP, C.mint, '#EBD7B2'][Math.floor(r() * 5)];
  const shut = [C.green, C.teal, '#3E5F7A', C.maroon, C.woodD][Math.floor(r() * 5)];
  const roofC = r() < 0.5 ? C.tin : '#A6A89F';
  const doorX = (r() < 0.5 ? -1 : 1) * (0.6 + r() * Math.max(0, W / 2 - 1.8));
  f.flat(-W / 2 - 0.2, -D / 2 - 0.3, W / 2 + 0.4, FZ + 0.9, 0.004, C.shadow);
  for (let k = 0; k < 3; k++) f.flatR(doorX + (k % 2 ? 0.08 : -0.08), FZ + 0.45 + k * 0.5, 0.5, 0.34, 0.008, C.brickL);
  if (it.style === 'two') {
    const H1 = 2.9, H2 = 5.3;
    g.boxMin(-W / 2 - 0.1, 0, -D / 2, W / 2 + 0.1, 0.2, FZ + 0.1, C.stone);
    g.boxMin(-W / 2, 0.2, -D / 2, W / 2, H1, FZ, C.brick);
    const holes = [[doorX - 0.5, 0.2, doorX + 0.5, 2.2]];
    const wx = doorX > 0 ? -W / 4 - 0.2 : W / 4 + 0.2;
    holes.push([wx - 0.5, 1.1, wx + 0.5, 1.9]);
    brickFace(g, -W / 2, W / 2, 0.2, H1, FZ, holes, it.seed || 5);
    g.boxMin(doorX - 0.5, 0.2, FZ, doorX + 0.5, 2.2, FZ + 0.05, C.woodD);
    g.boxMin(doorX - 0.42, 0.25, FZ + 0.05, doorX + 0.42, 2.12, FZ + 0.08, shut);
    g.box(doorX + 0.28, 1.15, FZ + 0.1, 0.06, 0.06, 0.04, C.gold);
    g.boxMin(doorX - 0.62, 2.2, FZ, doorX + 0.62, 2.32, FZ + 0.1, C.stoneL);
    win(g, wx, 1.5, FZ, 0.9, 0.75, { bars: true, frame: C.stoneL });
    // upper floor: timber and plaster, overhanging, a balcony rail with washing
    g.boxMin(-W / 2 - 0.05, H1, -D / 2 + 0.05, W / 2 + 0.05, H1 + 0.16, FZ + 0.55, C.woodD);
    g.boxMin(-W / 2, H1 + 0.16, -D / 2 + 0.1, W / 2, H2, FZ - 0.05, plaster);
    for (const sx of [-1, 1]) g.boxMin(sx * W / 2 - 0.08, H1 + 0.16, FZ - 0.1, sx * W / 2 + 0.08, H2, FZ + 0.02, C.woodD);
    for (const x of W > 6 ? [-W / 4, W / 4] : [0]) win(g, x, H1 + 1.2, FZ - 0.05, 0.85, 1.0, { shut, frame: C.white });
    for (let x = -W / 2 + 0.15; x <= W / 2 - 0.1; x += 0.3) g.box(x, H1 + 0.45, FZ + 0.5, 0.04, 0.55, 0.04, C.woodD);
    g.box(0, H1 + 0.74, FZ + 0.5, W, 0.06, 0.08, C.wood);
    const cols = ['#E8A0A8', '#FFFDF8', '#9CC3DE', '#E2B33C', '#6E1F2A', '#4E8C86'];
    for (let x = -W / 2 + 0.5, i = 0; x < W / 2 - 0.6; x += 0.62, i++) if (r() < 0.6) g.box(x, H1 + 0.5, FZ + 0.56, 0.42, 0.42, 0.03, cols[(i + (it.seed || 0)) % cols.length]);
    gableEnds(g, W, D, H2, 1.3, plaster);
    tinRoof(g, W, D, H2, 1.3, roofC, (it.seed || 1) + 3);
    if (r() < 0.7) { g.box(W / 2 - 0.9, H2 + 1.5, -D / 4, 0.5, 1.5, 0.5, C.brickD); g.box(W / 2 - 0.9, H2 + 2.28, -D / 4, 0.6, 0.08, 0.6, C.soot); if (r() < 0.5) smoke(g, ctx, W / 2 - 0.9, H2 + 2.5, -D / 4); }
  } else {
    const H = 2.7;
    g.boxMin(-W / 2 - 0.1, 0, -D / 2, W / 2 + 0.1, 0.3, FZ + 0.1, C.stone);
    g.boxMin(-W / 2, 0.3, -D / 2, W / 2, H, FZ, plaster);
    g.boxMin(-W / 2 - 0.01, 0.3, FZ - 0.01, W / 2 + 0.01, 0.75, FZ + 0.012, shade(plaster, 0.88));
    for (const sx of [-1, 1]) g.boxMin(sx * W / 2 - 0.08, 0.3, FZ - 0.08, sx * W / 2 + 0.08, H, FZ + 0.04, C.woodD);
    g.boxMin(doorX - 0.48, 0.3, FZ, doorX + 0.48, 2.2, FZ + 0.05, C.woodD);
    g.boxMin(doorX - 0.4, 0.35, FZ + 0.05, doorX + 0.4, 2.12, FZ + 0.08, shut);
    g.box(doorX + 0.26, 1.2, FZ + 0.1, 0.06, 0.06, 0.04, C.gold);
    for (const wx of [-W / 2 + 1.0, W / 2 - 1.0]) if (Math.abs(wx - doorX) > 1.2) win(g, wx, 1.55, FZ, 0.8, 0.75, { shut, frame: C.woodD });
    // the tin porch roof on two posts, a bench under it
    for (const sx of [-1, 1]) g.box(doorX + sx * 1.0, 1.15, FZ + 1.0, 0.1, 2.3, 0.1, C.woodL);
    g.boxR(doorX, 2.35, FZ + 0.55, 2.4, 0.06, 1.3, roofC, 0.22, 0, 0);
    for (let k = 0; k < 6; k++) g.boxR(doorX - 1.0 + k * 0.4, 2.39, FZ + 0.55, 0.05, 0.04, 1.3, shade(roofC, 1.15), 0.22, 0, 0);
    gableEnds(g, W, D, H, 1.2, plaster);
    tinRoof(g, W, D, H, 1.2, roofC, (it.seed || 1) + 7);
    if (r() < 0.5) { g.box(-W / 2 + 0.7, H + 1.0, -D / 4, 0.18, 1.4, 0.18, C.tinD); g.box(-W / 2 + 0.7, H + 1.75, -D / 4, 0.36, 0.08, 0.36, C.tinD); }
  }
  // by the door: a clay stove with a kettle or a water jar; pots of herbs
  const sx = doorX > 0 ? doorX - 1.1 : doorX + 1.1;
  if (r() < 0.6) stoveAt(g, sx, FZ + 0.45, true);
  else { g.box(sx, 0.3, FZ + 0.4, 0.46, 0.56, 0.46, C.terra); g.box(sx, 0.3, FZ + 0.4, 0.52, 0.22, 0.52, C.terraL); g.box(sx, 0.62, FZ + 0.4, 0.32, 0.06, 0.32, C.wood); }
  potsAt(g, doorX > 0 ? -W / 2 + 0.3 : W / 2 - 1.1, FZ + 0.32, 3, (it.seed || 1) + 11);
}
function commonOven(g, f, it, ctx) {
  // the street's shared clay oven, a dome of clay on a brick base under a tin roof on four posts
  f.flat(-2.2, -1.8, 2.4, 2.2, 0.004, C.shadow);
  g.boxMin(-1.3, 0, -1.1, 1.3, 0.7, 1.1, C.brick);
  brickFace(g, -1.3, 1.3, 0, 0.7, 1.1, [], 88, 0.23);
  for (let k = 0; k < 4; k++) { const s = 1 - k * 0.22; g.box(0, 0.86 + k * 0.28, 0, 2.3 * s, 0.3, 1.9 * s, k % 2 ? C.terraL : C.terra); }
  g.box(0, 1.98, 0, 0.36, 0.2, 0.36, C.terraD);
  g.boxMin(-0.4, 0.75, 0.9, 0.4, 1.25, 0.97, C.soot);
  g.boxMin(-0.3, 0.8, 0.97, 0.3, 1.1, 1.0, C.ember);
  smoke(g, ctx, 0, 2.3, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * 1.9, 1.3, sz * 1.6, 0.14, 2.6, 0.14, C.woodD);
  g.boxR(0, 2.72, 0, 4.4, 0.08, 3.8, C.tin, 0.12, 0, 0);
  for (let k = 0; k < 10; k++) g.boxR(-2.0 + k * 0.45, 2.77, 0, 0.05, 0.05, 3.8, C.tinL, 0.12, 0, 0);
  // a peel leaning on a post, loaves cooling on a board, firewood
  g.boxR(1.95, 1.1, 1.75, 0.08, 2.0, 0.08, C.wood, 0.1, 0, 0.12);
  g.box(2.08, 0.15, 1.85, 0.5, 0.06, 0.4, C.woodL);
  g.box(-1.6, 0.75, 1.5, 1.0, 0.06, 0.5, C.woodL);
  for (const x of [-1.9, -1.6, -1.3]) g.box(x, 0.84, 1.5, 0.24, 0.12, 0.34, C.crust);
  for (const sx of [-0.4, 0.4]) g.box(-1.6 + sx, 0.37, 1.5, 0.06, 0.74, 0.4, C.woodD);
  for (let row = 0; row < 2; row++) for (let i = 0; i < 4 - row; i++) g.box(-0.6 + i * 0.3 + row * 0.15, 0.13 + row * 0.24, -1.6, 0.26, 0.24, 0.9, shade(C.wood, 0.85 + ((i + row) % 3) * 0.1));
}

// ---------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------
function ring(f, r, t, y, col, n = 18, gap = 0, seed = 1) {
  const rr = rng(seed);
  for (let i = 0; i < n; i++) {
    if (gap && rr() < gap) continue;
    const a = (i / n) * Math.PI * 2, len = (2 * Math.PI * r) / n + 0.04;
    f.flatR(Math.cos(a) * r, Math.sin(a) * r, len, t * (0.8 + rr() * 0.4), y, col, -a - Math.PI / 2);
  }
}
function scorch(g, f, it) {
  // a ring burnt into the baking parchment by a hot pot, long ago
  const R = it.r || 1.2, s = it.seed || 1;
  ring(f, R + 0.08, 0.34, 0.0045, '#E3CB9C', 22, 0, s);
  ring(f, R, 0.12, 0.0055, C.scorch, 22, 0.12, s + 1);
  ring(f, R - 0.12, 0.05, 0.006, C.scorchD, 20, 0.35, s + 2);
  if ((s % 3) === 0) ring(f, R * 0.55, 0.06, 0.0055, C.scorchL, 14, 0.3, s + 3);
}
function roadScorch(g, f, it) {
  // the deep ring in the road where a cart wheel drops: dark sunken centre, a curled paper lip
  const R = it.r || 0.8, y = 0.152;
  f.flatR(0, 0, R * 1.5, R * 1.5, y, '#7A5232', 0.4);
  f.flatR(0, 0, R * 1.2, R * 1.2, y + 0.002, '#5E3C24', 0.0);
  ring(f, R + 0.12, 0.26, y + 0.004, C.scorch, 20, 0, 7);
  ring(f, R + 0.3, 0.18, y + 0.003, '#C99E6A', 22, 0.2, 8);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.2;
    g.boxR(Math.cos(a) * (R + 0.05), 0.17, Math.sin(a) * (R + 0.05), 0.34, 0.05, 0.1, i % 2 ? C.scorchL : C.scorch, 0, -a - Math.PI / 2, 0.35);
  }
}
function soilPatch(g, f, it) {
  const w = it.w || 2, d = it.d || 1.5;
  f.flatR(0, 0, w + 0.3, d + 0.3, 0.005, '#C9A97A', 0.05);
  f.flatR(0, 0, w, d, 0.007, C.soil, 0.05);
  const r = rng(it.seed || 2);
  for (let k = 0; k < 6; k++) g.box((r() - 0.5) * w * 0.8, 0.03, (r() - 0.5) * d * 0.8, 0.14, 0.06, 0.12, C.soilD);
}
function hopscotch(g, f) {
  const cells = [[0, 0], [0, 0.7], [-0.36, 1.4], [0.36, 1.4], [0, 2.1], [-0.36, 2.8], [0.36, 2.8], [0, 3.5]];
  for (const [x, z] of cells) {
    for (const [dx, dz, w, d] of [[0, -0.33, 0.7, 0.04], [0, 0.33, 0.7, 0.04], [-0.33, 0, 0.04, 0.7], [0.33, 0, 0.04, 0.7]]) f.flat(x + dx - w / 2, -z + dz - d / 2, x + dx + w / 2, -z + dz + d / 2, 0.008, '#FBF6EA');
  }
  g.box(0.5, 0.02, 0.4, 0.12, 0.04, 0.1, C.stone);
}
function lowWall(g, f, it) {
  // a knee-high brick wall with a stone coping
  const L = it.len;
  g.box(0, 0.42, 0, L, 0.84, 0.36, C.brick);
  brickFace(g, -L / 2, L / 2, 0, 0.84, 0.18, [], Math.round(it.x * 7 + it.z), 0.21);
  g.box(0, 0.9, 0, L + 0.08, 0.1, 0.46, C.stoneL);
  f.flat(-L / 2, 0.18, L / 2, 0.6, 0.004, C.shadow);
  if (L > 3) for (let x = -L / 2 + 1.2; x < L / 2 - 0.5; x += 2.6) potsAt(g, x, 0, 1, Math.round(x * 13 + it.z));
}
function breadRack(g, f) {
  // the kerb rack of loaves: three slatted shelves on legs under a little cloth roof
  for (const sx of [-0.55, 0.55]) for (const sz of [-0.22, 0.22]) g.box(sx, 0.75, sz, 0.06, 1.5, 0.06, C.woodD);
  for (let k = 0; k < 3; k++) {
    g.box(0, 0.4 + k * 0.42, 0, 1.2, 0.05, 0.5, C.woodL);
    for (let i = 0; i < 4; i++) { g.box(-0.42 + i * 0.28, 0.5 + k * 0.42, 0.02, 0.24, 0.14, 0.36, (i + k) % 3 ? C.crust : C.crustL); g.box(-0.42 + i * 0.28, 0.58 + k * 0.42, 0.02, 0.16, 0.03, 0.26, C.crustD); }
  }
  g.boxR(0, 1.62, 0.05, 1.36, 0.05, 0.7, '#F1E3C2', 0.2, 0, 0);
  g.box(0, 1.52, 0.38, 1.36, 0.12, 0.02, C.maroon);
  f.flat(-0.75, -0.35, 0.75, 0.45, 0.005, C.shadow);
}
function flourSacks(g, f, it) {
  const n = it.n || 5;
  for (let k = 0; k < n; k++) {
    const row = k < 3 ? 0 : 1, i = row ? k - 3 : k;
    const x = -0.6 + i * 0.6 + row * 0.3, y = row * 0.4;
    g.box(x, y + 0.22, (k % 2) * 0.06, 0.56, 0.44, 0.42, k % 2 ? C.sackD : C.sack);
    g.box(x, y + 0.46, (k % 2) * 0.06, 0.26, 0.06, 0.16, C.sackD);
    g.box(x, y + 0.22, 0.22 + (k % 2) * 0.06, 0.26, 0.12, 0.01, C.maroon);
  }
  f.flat(-1.0, -0.35, 1.1, 0.5, 0.005, C.shadow);
  f.flatR(0.2, 0.45, 1.2, 0.4, 0.006, C.flour, 0.1);
}
function sackSeat(g, f) {
  // one bench-height sack against the wall (where Maung Arkar eats alone) and a tin tiffin on the ground
  g.box(0, 0.24, 0, 0.62, 0.48, 0.46, C.sack);
  g.box(0, 0.5, 0, 0.5, 0.06, 0.36, C.sackD);
  g.box(0.5, 0.08, 0.15, 0.2, 0.16, 0.2, C.tin);
  g.box(0.5, 0.18, 0.15, 0.16, 0.04, 0.16, C.tinD);
  f.flat(-0.4, -0.3, 0.7, 0.35, 0.005, C.shadow);
}
function crates(g, f, it) {
  const r = rng(it.seed || 4), n = it.n || 3;
  for (let k = 0; k < n; k++) {
    const x = (k % 2) * 0.55 - 0.25, y = Math.floor(k / 2) * 0.46, s = 0.5 - r() * 0.06;
    g.box(x, y + 0.22, (r() - 0.5) * 0.1, s, 0.44, s, C.woodL);
    for (const yy of [0.08, 0.36]) g.box(x, y + yy, (r() - 0.5) * 0.1 + s / 2, s + 0.02, 0.06, 0.02, C.woodD);
    if (r() < 0.5) for (let i = 0; i < 3; i++) g.box(x - 0.14 + i * 0.14, y + 0.46, 0, 0.12, 0.1, 0.12, [C.crust, C.mustard, C.red, C.leaf][Math.floor(r() * 4)]);
  }
  f.flat(-0.6, -0.35, 0.65, 0.4, 0.005, C.shadow);
}
function clayStove(g, f, it, ctx) {
  stoveAt(g, 0, 0, true);
  g.box(0.5, 0.15, 0.1, 0.3, 0.3, 0.3, C.sackD); // a little charcoal sack
  g.box(0.5, 0.31, 0.1, 0.2, 0.04, 0.2, C.soot);
  if (it.smoke) smoke(g, ctx, 0, 1.0, 0);
  f.flat(-0.4, -0.35, 0.75, 0.4, 0.005, C.shadow);
}
function noodleRack(g, f, it) {
  // rice noodles drying on bamboo poles: two trestles, three poles, long pale strands
  const L = it.len || 3;
  for (const sx of [-1, 1]) for (const sz of [-0.3, 0.3]) g.boxR(sx * L / 2, 0.8, sz * 0.6, 0.06, 1.7, 0.06, C.bambooD, sz * 0.5, 0, 0);
  for (const z of [-0.25, 0, 0.25]) {
    g.box(0, 1.55, z, L + 0.2, 0.05, 0.05, C.bamboo);
    for (let x = -L / 2 + 0.15; x < L / 2 - 0.1; x += 0.16) g.box(x, 1.2, z, 0.08, 0.66 - ((x * 7) % 0.2), 0.02, (Math.round(x * 10) % 3) ? '#F6EFD8' : '#EADFC2');
  }
  f.flat(-L / 2 - 0.2, -0.5, L / 2 + 0.2, 0.5, 0.005, C.shadow);
}
function bananas(g, f, it) {
  const r = rng(it.seed || 5);
  for (let k = 0; k < 3; k++) {
    const x = (k - 1) * 0.45 + (r() - 0.5) * 0.2, z = (r() - 0.5) * 0.5, h = 1.4 + r() * 0.8;
    g.box(x, h / 2, z, 0.18, h, 0.18, '#8DA35A');
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + k; g.boxR(x + Math.cos(a) * 0.45, h + 0.1, z + Math.sin(a) * 0.45, 1.0, 0.04, 0.32, i % 2 ? C.leafL : C.leaf, 0, -a, -0.45); }
  }
  f.flat(-1.0, -0.6, 1.0, 0.6, 0.005, C.shadow);
}
function plantPots(g, f, it) { potsAt(g, -((it.n || 4) - 1) * 0.18, 0, it.n || 4, Math.round(it.x * 3 + it.z)); }
function charcoal(g, f) {
  for (let k = 0; k < 4; k++) { const x = -0.5 + (k % 3) * 0.5, y = k === 3 ? 0.4 : 0; g.box(x + (k === 3 ? 0.25 : 0), y + 0.2, 0, 0.46, 0.4, 0.4, '#4A423C'); g.box(x + (k === 3 ? 0.25 : 0), y + 0.42, 0, 0.3, 0.05, 0.24, C.soot); }
  for (let k = 0; k < 6; k++) g.box(-0.5 + k * 0.2, 0.03, 0.35, 0.1, 0.06, 0.08, C.soot);
  f.flat(-0.8, -0.3, 0.8, 0.5, 0.005, '#BFA98A');
}
function trayStack(g, f) {
  for (let k = 0; k < 7; k++) g.box(0, 0.04 + k * 0.07, 0, 0.7 - (k % 2) * 0.02, 0.04, 0.5, k % 2 ? C.tinD : C.tin);
  g.boxR(0.5, 0.36, 0.0, 0.7, 0.04, 0.5, C.tin, 0, 0, 1.2);
}
function dyeVats(g, f) {
  const cols = ['#2F5DB3', '#C8323C', '#E2B33C'];
  for (let k = 0; k < 3; k++) { const x = (k - 1) * 0.75; g.box(x, 0.3, 0, 0.6, 0.6, 0.6, C.terra); g.box(x, 0.3, 0, 0.66, 0.2, 0.66, C.terraL); g.box(x, 0.58, 0, 0.48, 0.04, 0.48, cols[k]); }
  g.boxR(0.4, 0.9, 0.1, 0.05, 1.2, 0.05, C.bamboo, 0, 0, 0.5);
  for (const sx of [-1.4, 1.4]) g.box(sx, 0.9, -0.5, 0.06, 1.8, 0.06, C.woodD);
  g.box(0, 1.75, -0.5, 2.9, 0.03, 0.03, C.ink);
  for (let k = 0; k < 5; k++) g.box(-1.0 + k * 0.5, 1.4, -0.5, 0.2, 0.7, 0.04, cols[k % 3]);
}
function kerbPot(g, f, it, ctx) {
  // Daw Saw Yu's street counter at the kerb: an awning on two poles, the soup pot steaming on a stove,
  // a bowl stack, a tray of herbs, two stools
  f.flat(-1.3, -0.8, 1.3, 0.9, 0.005, C.shadow);
  g.box(0, 0.45, -0.1, 1.6, 0.9, 0.62, C.wood);
  g.box(0, 0.92, -0.1, 1.7, 0.06, 0.72, C.woodD);
  for (let x = -0.7; x < 0.75; x += 0.28) g.box(x, 0.45, 0.22, 0.04, 0.82, 0.02, C.woodD);
  g.box(-0.4, 1.05, -0.1, 0.5, 0.2, 0.5, C.iron);
  g.box(-0.4, 1.32, -0.1, 0.56, 0.42, 0.56, C.tinD);
  g.box(-0.4, 1.54, -0.1, 0.48, 0.04, 0.48, '#E8A94A');
  g.box(-0.4, 1.58, -0.1, 0.2, 0.06, 0.2, C.tin);
  smoke(g, ctx, -0.4, 1.8, -0.1);
  for (let k = 0; k < 5; k++) g.box(0.25, 0.99 + k * 0.06, -0.2, 0.24 - k * 0.01, 0.05, 0.24 - k * 0.01, C.white);
  g.box(0.6, 0.98, 0.0, 0.36, 0.04, 0.3, C.bamboo);
  for (let k = 0; k < 4; k++) g.box(0.5 + (k % 2) * 0.18, 1.02, -0.06 + Math.floor(k / 2) * 0.14, 0.12, 0.05, 0.1, k % 2 ? C.leafL : C.leaf);
  for (const sx of [-0.9, 0.9]) g.box(sx, 1.15, -0.45, 0.08, 2.3, 0.08, C.woodD);
  for (let i = 0; i < 6; i++) g.boxR(-0.95 + i * 0.38, 2.28, 0.0, 0.38, 0.05, 1.2, i % 2 ? C.cream : C.red, 0.25, 0, 0);
  for (let i = 0; i < 6; i++) g.box(-0.95 + i * 0.38, 2.05, 0.6, 0.34, 0.14, 0.03, i % 2 ? C.cream : C.red);
  stool(g, -0.5, 0.65, C.blue, 0.3); stool(g, 0.5, 0.75, C.red, 0.3);
}
function lampBench(g, f, it, ctx) {
  // the lamp-mender's open-air bench: a lean-to tin awning on poles, the bench with tools, paper lamps
  // waiting, one hanging lit
  f.flat(-2.3, -1.0, 2.3, 1.2, 0.005, C.shadow);
  for (const sx of [-1.9, 1.9]) { g.box(sx, 1.25, -0.8, 0.1, 2.5, 0.1, C.woodD); g.box(sx, 1.05, 0.9, 0.1, 2.1, 0.1, C.woodD); }
  g.boxR(0, 2.3, 0.05, 4.2, 0.06, 2.0, C.tin, -0.17, 0, 0);
  for (let k = 0; k < 10; k++) g.boxR(-1.9 + k * 0.42, 2.34, 0.05, 0.05, 0.04, 2.0, C.tinL, -0.17, 0, 0);
  g.box(0, 2.08, -0.8, 4.0, 0.08, 0.08, C.woodD);
  g.box(0, 0.7, -0.35, 2.6, 0.08, 0.7, C.woodL);
  for (const sx of [-1.1, 1.1]) g.box(sx, 0.35, -0.35, 0.08, 0.7, 0.6, C.woodD);
  // on the bench: a paper lamp opened up, glue pot, brushes, a roll of paper, scissors
  g.box(-0.5, 0.95, -0.35, 0.44, 0.42, 0.44, '#F1E3C2');
  g.box(-0.5, 0.95, -0.35, 0.48, 0.06, 0.48, C.woodD);
  g.box(-0.5, 0.95, -0.12, 0.2, 0.18, 0.02, '#D8B98A'); // the patch
  g.box(0.25, 0.82, -0.3, 0.16, 0.16, 0.16, C.terra);
  g.boxR(0.4, 0.8, -0.2, 0.03, 0.03, 0.3, C.woodD, 0, 0.6, 0);
  g.box(0.85, 0.8, -0.45, 0.6, 0.12, 0.12, C.paper);
  g.box(-1.0, 0.76, -0.2, 0.2, 0.02, 0.08, C.iron);
  // lamps hanging from the beam (paper and tin), one lit
  const cols = ['#F6E7C6', C.red, '#F1D9AA', C.mustard];
  for (let k = 0; k < 4; k++) {
    const x = -1.5 + k * 1.0;
    g.box(x, 1.92, -0.8, 0.02, 0.26, 0.02, C.ink);
    g.box(x, 1.62, -0.8, 0.34, 0.38, 0.34, k === 2 ? C.lit : cols[k]);
    g.box(x, 1.44, -0.8, 0.22, 0.04, 0.22, C.woodD);
    if (k === 2) glow(g, ctx, x, 1.62, -0.8);
  }
  stool(g, 0, 0.35, C.woodL, 0.4);
  for (let k = 0; k < 3; k++) g.box(1.55, 0.2 + k * 0.4, 0.2, 0.36, 0.38, 0.36, cols[(k + 1) % 4]);
  g.box(-1.6, 0.22, 0.3, 0.6, 0.44, 0.4, C.bamboo);
}
function kiteBench(g, f, it, ctx) {
  // Uncle Chit's bench at the open north-east end: a big diamond kite flying steady on a line tied to the bench
  // leg (a double knot at the bridle), two small kites being mended, a pot of paste
  f.flat(-1.2, -0.5, 1.2, 0.6, 0.005, C.shadow);
  g.box(0, 0.44, 0, 2.0, 0.08, 0.5, C.woodL);
  for (const sx of [-0.85, 0.85]) g.box(sx, 0.22, 0, 0.1, 0.44, 0.42, C.woodD);
  g.box(0, 0.75, -0.24, 2.0, 0.08, 0.06, C.woodL);
  for (const sx of [-0.85, 0.85]) g.box(sx, 0.6, -0.24, 0.08, 0.36, 0.06, C.woodD);
  g.boxR(-0.4, 0.5, 0.0, 0.5, 0.02, 0.5, C.mustard, 0, 0.785, 0);
  g.boxR(0.3, 0.5, 0.05, 0.42, 0.02, 0.42, C.teal, 0, 0.785, 0);
  g.box(0.3, 0.52, 0.05, 0.02, 0.03, 0.56, C.bambooD);
  g.box(0.75, 0.54, 0.05, 0.14, 0.12, 0.14, C.terra);
  g.box(-0.85, 0.15, 0.24, 0.16, 0.14, 0.12, C.ink); // the knot at the leg
  // the line up into the sky (north, so the street camera sees it rising), the kite
  const K = [1.0, 8.6, -7.0], A = [-0.85, 0.12, 0.26];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, sag = (t) => -Math.sin(t * Math.PI) * 0.9;
    const a = [A[0] + (K[0] - A[0]) * t0, A[1] + (K[1] - A[1]) * t0 + sag(t0), A[2] + (K[2] - A[2]) * t0];
    const b = [A[0] + (K[0] - A[0]) * t1, A[1] + (K[1] - A[1]) * t1 + sag(t1), A[2] + (K[2] - A[2]) * t1];
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz);
    g.boxR((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, 0.03, len, 0.03, C.ink, Math.atan2(dz, dy), 0, -Math.atan2(dx, Math.hypot(dy, dz)));
  }
  const [kx, ky, kz] = K;
  g.boxR(kx, ky + 0.6, kz, 1.25, 1.25, 0.05, C.red, 0, 0, Math.PI / 4);
  g.boxR(kx, ky + 0.6, kz + 0.03, 0.62, 0.62, 0.04, C.mustard, 0, 0, Math.PI / 4);
  g.box(kx, ky + 0.6, kz + 0.06, 0.04, 1.8, 0.03, C.bambooD);
  g.box(kx, ky + 0.6, kz + 0.06, 1.8, 0.04, 0.03, C.bambooD);
  for (let k = 0; k < 5; k++) g.boxR(kx + Math.sin(k) * 0.1, ky - 0.5 - k * 0.32, kz, 0.22, 0.08, 0.03, k % 2 ? C.white : C.red, 0, 0, Math.sin(k) * 0.4);
}
function cat(g, f) {
  // a ginger cat sitting, tail curled
  g.box(0, 0.16, 0, 0.3, 0.3, 0.4, '#D98E48');
  g.box(0, 0.36, 0.14, 0.24, 0.22, 0.22, '#D98E48');
  for (const sx of [-0.08, 0.08]) g.box(sx, 0.5, 0.14, 0.06, 0.08, 0.05, '#C27838');
  g.box(0, 0.35, 0.26, 0.1, 0.06, 0.02, C.ink);
  g.box(0.16, 0.05, -0.05, 0.08, 0.06, 0.36, '#C27838');
  g.box(0, 0.24, -0.1, 0.26, 0.04, 0.12, '#F0E2CC');
}
function dog(g, f) {
  // a brown street dog asleep in the shade
  g.box(0, 0.15, 0, 0.62, 0.3, 0.34, '#A47A4E');
  g.box(0.38, 0.12, 0.08, 0.26, 0.22, 0.26, '#A47A4E');
  g.box(0.5, 0.1, 0.12, 0.12, 0.1, 0.14, '#8A6440');
  g.box(0.36, 0.25, 0.0, 0.08, 0.06, 0.12, '#7A5634');
  g.box(-0.36, 0.06, 0.1, 0.2, 0.06, 0.06, '#8A6440');
  f.flat(-0.5, -0.3, 0.7, 0.35, 0.005, C.shadow);
}
function goat(g, f) {
  g.box(0, 0.62, 0, 0.36, 0.34, 0.72, '#F1E9DC');
  for (const sx of [-0.12, 0.12]) for (const sz of [-0.26, 0.26]) g.box(sx, 0.24, sz, 0.08, 0.48, 0.08, '#D8CDBA');
  g.box(0, 0.86, 0.42, 0.22, 0.24, 0.26, '#F1E9DC');
  g.box(0, 0.78, 0.58, 0.16, 0.14, 0.12, '#E3D8C6');
  for (const sx of [-0.07, 0.07]) g.boxR(sx, 1.04, 0.38, 0.04, 0.16, 0.04, '#8E8173', -0.5, 0, 0);
  g.box(0, 0.64, 0.66, 0.04, 0.1, 0.04, '#D8CDBA');
  g.box(0, 0.74, -0.38, 0.06, 0.12, 0.06, '#E3D8C6');
  f.flat(-0.3, -0.45, 0.3, 0.55, 0.005, C.shadow);
}
function hearthSign(g, f, it, ctx) {
  // the district's name at its gate from the Junction: a brick pillar like a little chimney, a tin plate
  f.flat(-1.4, -0.6, 1.4, 0.8, 0.005, C.shadow);
  for (const sx of [-1.15, 1.15]) {
    g.box(sx, 1.1, 0, 0.5, 2.2, 0.5, C.brick);
    brickFace(g, sx - 0.25, sx + 0.25, 0, 2.2, 0.25, [], 31, 0.24);
    g.box(sx, 2.28, 0, 0.62, 0.14, 0.62, C.stoneL);
    g.box(sx, 2.5, 0, 0.32, 0.3, 0.32, C.brickD);
    g.box(sx, 2.68, 0, 0.36, 0.06, 0.36, C.soot);
  }
  g.box(0, 1.55, -0.02, 2.0, 1.0, 0.08, C.tinD);
  board(ctx, 0, 1.55, 0.04, 1.9, 0.9, 'မီးဖိုတန်း', 'Hearth Row', { bg: '#F4DDA6', border: C.brickD, size: 64, width: 512, height: 240 });
  g.box(0, 0.8, 0.0, 1.9, 0.12, 0.12, C.woodD);
  potsAt(g, -0.5, 0.45, 3, 61);
}
function laneSign(g, f, it, ctx) {
  g.box(0, 1.1, 0, 0.12, 2.2, 0.12, C.woodD);
  g.box(0, 2.0, 0.07, 1.7, 0.5, 0.06, C.woodD);
  board(ctx, 0, 2.0, 0.11, 1.6, 0.42, it.my || 'လက်မှုလမ်း', it.en || 'Workshop Lane', { bg: '#F1E3C2', border: null, size: 46, width: 512, height: 136 });
  g.box(0, 0.06, 0, 0.36, 0.12, 0.36, C.stone);
}
function lookout(g, f, it) {
  // the end of a street at the paper's west edge: a low wall, a bench looking over the clouds
  g.box(0, 0.45, 0, 0.36, 0.9, it.len || 4, C.brick);
  g.box(0, 0.95, 0, 0.46, 0.1, (it.len || 4) + 0.08, C.stoneL);
  g.box(1.0, 0.42, 0, 0.42, 0.06, 1.4, C.woodL);
  for (const sz of [-0.55, 0.55]) g.box(1.0, 0.21, sz, 0.36, 0.42, 0.06, C.woodD);
  g.box(1.2, 0.68, 0, 0.06, 0.4, 1.4, C.woodL);
}

const box = (w, d) => (it) => {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return [{ type: 'box', minX: it.x - hw, maxX: it.x + hw, minZ: it.z - hd, maxZ: it.z + hd }];
};
const rect = (it, x0, z0, x1, z1) => ({ type: 'box', minX: it.x + x0, maxX: it.x + x1, minZ: it.z + z0, maxZ: it.z + z1 });
const circ = (r) => (it) => [{ type: 'circle', x: it.x, z: it.z, r }];

export const ART = {
  bakery: { draw: bakery, h: 8.4, map: true, obstacles: (it) => [rect(it, -it.w / 2, -it.d / 2, it.w / 2, it.d / 2 + 0.05), ...(it.link ? [rect(it, it.link[0], it.link[2], it.link[1], -it.d / 2)] : [])] },
  bakeryBack: { draw: bakeryBack, h: 4.6, map: true, obstacles: (it) => [rect(it, -it.w / 2, -it.d / 2, it.w / 2, it.d / 2 + 0.05), rect(it, (it.door || 0) + 3.8, it.d / 2, (it.door || 0) + 5.0, it.d / 2 + 0.7), rect(it, (it.door || 0) - 1.85, it.d / 2, (it.door || 0) - 1.15, it.d / 2 + 0.85)] },
  noteWall: { draw: noteWall, h: 2.7, map: true, obstacles: (it) => [rect(it, -it.w / 2, -0.2, it.w / 2, 0.3), rect(it, -it.w / 2 - 0.9, -0.1, -it.w / 2, 0.4)] },
  eveningClass: { draw: eveningClass, h: 5.0, map: true, obstacles: (it) => [rect(it, -it.w / 2, -it.d / 2, it.w / 2, it.d / 2 + 0.05), rect(it, -it.w / 2, it.d / 2, (it.door || 1.3) - 1.05, it.d / 2 + 0.35), rect(it, -3.75, it.d / 2 + 0.5, -3.05, it.d / 2 + 0.95)] },
  noodleHouse: { draw: noodleHouse, h: 5.3, map: true, obstacles: (it) => [rect(it, -it.w / 2, -it.d / 2, it.w / 2, it.d / 2 + 0.05), rect(it, it.w / 2 - 0.8, it.d / 2, it.w / 2 - 0.2, it.d / 2 + 0.65)] },
  loomShed: { draw: loomShed, h: 4.2, map: true, obstacles: (it) => [rect(it, -it.w / 2, -it.d / 2, it.w / 2, it.d / 2 + 0.05), rect(it, (it.door || 3.6) - 1.7, it.d / 2, (it.door || 3.6) - 0.9, it.d / 2 + 0.8), rect(it, (it.door || 3.6) + 0.9, it.d / 2, (it.door || 3.6) + 1.6, it.d / 2 + 0.8)] },
  teaHouse: { draw: teaHouse, h: 5.2, map: true, obstacles: (it) => [rect(it, -it.w / 2, -it.d / 2, it.w / 2, it.d / 2 + 0.05), rect(it, -4.2, it.d / 2 + 0.4, -2.4, it.d / 2 + 1.35), rect(it, 2.4, it.d / 2 + 0.4, 4.2, it.d / 2 + 1.35)] },
  lampShop: { draw: lampShop, h: 6.0, map: true },
  boxShop: { draw: boxShop, h: 4.4, map: true, obstacles: (it) => [rect(it, -it.w / 2, -it.d / 2, it.w / 2, it.d / 2 + 0.05), rect(it, -it.w / 2 + 0.2, it.d / 2, -it.w / 2 + 1.6, it.d / 2 + 0.7)] },
  workShed: { draw: workShed, h: 4.2, map: true, obstacles: (it) => [rect(it, -it.w / 2, -it.d / 2, it.w / 2, it.d / 2 - 0.4)] },
  hHouse: { draw: hHouse, h: 6.8, map: true, obstacles: (it) => [rect(it, -it.w / 2, -it.d / 2, it.w / 2, it.d / 2 + 0.05)] },
  commonOven: { draw: commonOven, h: 3.0, map: true, obstacles: box(2.8, 2.4) },
};
export const PROP = {
  scorch: { draw: scorch, obstacles: () => [] },
  roadScorch: { draw: roadScorch, obstacles: () => [] },
  soilPatch: { draw: soilPatch, obstacles: () => [] },
  hopscotch: { draw: hopscotch, obstacles: () => [] },
  lowWall: { draw: lowWall, obstacles: (it) => box(it.len, 0.46)(it) },
  breadRack: { draw: breadRack, obstacles: box(1.3, 0.6) },
  flourSacks: { draw: flourSacks, obstacles: box(2.0, 0.6) },
  sackSeat: { draw: sackSeat, obstacles: box(0.7, 0.5) },
  crates: { draw: crates, obstacles: circ(0.6) },
  clayStove: { draw: clayStove, obstacles: circ(0.45) },
  noodleRack: { draw: noodleRack, obstacles: (it) => box((it.len || 3) + 0.3, 1.1)(it) },
  bananas: { draw: bananas, obstacles: circ(0.6) },
  plantPots: { draw: plantPots, obstacles: () => [] },
  charcoal: { draw: charcoal, obstacles: box(1.5, 0.5) },
  trayStack: { draw: trayStack, obstacles: circ(0.45) },
  dyeVats: { draw: dyeVats, obstacles: box(3.0, 1.1) },
  kerbPot: { draw: kerbPot, obstacles: (it) => [rect(it, -0.9, -0.45, 0.9, 0.25)] },
  lampBench: { draw: lampBench, obstacles: (it) => [rect(it, -1.5, -0.75, 1.5, 0.0), rect(it, 1.35, 0.0, 1.8, 0.4), { type: 'circle', x: it.x - 1.9, z: it.z - 0.8, r: 0.12 }, { type: 'circle', x: it.x + 1.9, z: it.z - 0.8, r: 0.12 }] },
  kiteBench: { draw: kiteBench, obstacles: box(2.1, 0.6) },
  cat: { draw: cat, obstacles: () => [] },
  dog: { draw: dog, obstacles: circ(0.35) },
  goat: { draw: goat, obstacles: circ(0.45) },
  hearthSign: { draw: hearthSign, obstacles: (it) => [{ type: 'circle', x: it.x - 1.15, z: it.z, r: 0.35 }, { type: 'circle', x: it.x + 1.15, z: it.z, r: 0.35 }] },
  laneSign: { draw: laneSign, obstacles: circ(0.2) },
  lookout: { draw: lookout, obstacles: (it) => [rect(it, -0.25, -(it.len || 4) / 2, 0.25, (it.len || 4) / 2), rect(it, 0.75, -0.7, 1.3, 0.7)] },
};
