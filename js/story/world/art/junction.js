// Newsprint Junction (district 4, the Fold): the district's own building and prop kinds, drawn into the
// chunk's merged solids (outlined) and its flat ground (decals, print, no outline). Registered through
// regions/junction.js (ART / PROP; format at the top of regions/index.js). Original blocky art in Maya's
// palette, with the Junction's own colours: newsprint greys, printer's ink, gold ink, post-box red and
// Ma Thida's blue. Item-local: origin = the item's (x, z) on the ground, front = +Z, metres.
//
// LIVE swaps: a few things here have a live, animated twin in js/story/props4.js that a day may want to
// play with (Nay Chi's bridge board, the well, the rope footbridge, the middle pier, the tea cart, the
// ladder, the easel, the notice board, the bridge-box). Each such item carries `live: '<props4 name>'`;
// while LIVE has that name the static one is not drawn (its keep-out stays), so the live prop can stand
// in its place without two copies overlapping. regions/junction.js `useLive(ow, names, on)` sets LIVE and
// rebuilds the Junction's chunks. Nothing here ever marks where to go.
import { shade, rng } from '../kit.js';
import { PALETTE } from '../../../game/toon.js';
import { jitter } from '../../../game/voxel.js';

/** props4 names whose static stand-in is hidden (see useLive in regions/junction.js). */
export const LIVE = new Set();

export const J = {
  news: '#E6E1D5', newsL: '#F1EDE3', newsD: '#D3CDBF', newsDD: '#BDB6A6', print: '#B9B3A5', printL: '#CCC6B8', printD: '#8F897C',
  ink: '#2E2A26', inkL: '#48433D', inside: '#3B332C', insideD: '#2A241F',
  slate: '#5D6670', slateD: '#47505A', slateL: '#7A848E', tin: '#9AA6AE', tinD: '#7C8890', tinL: '#BAC4CA', rust: '#A0643C',
  red: '#B8323A', redD: '#8E2730', redL: '#D2555B', blue: '#3F6F9E', blueD: '#2E5578', blueL: '#7FA6C8', wash: '#DCE4E6',
  teal: '#3D8A84', tealD: '#2D6B66', tealL: '#69AAA3', green: '#4F7F5A', greenD: '#3A6345', greenL: '#7FAE7E',
  gold: PALETTE.gold, goldD: PALETTE.goldDeep, inkGold: '#E3B23A', inkGoldL: '#F2CE63', inkGoldD: '#B98A1E', brass: '#C9A24A',
  wood: PALETTE.wood, woodD: PALETTE.woodDark, woodL: '#CDA577', woodG: '#A88B66', woodGD: '#8C7254',
  maroon: PALETTE.maroon, maroonD: PALETTE.maroonDeep, cream: PALETTE.cream, white: PALETTE.white, paper: PALETTE.paper, parch: PALETTE.parchment,
  brick: '#A0503A', brickD: '#7E3C2B', brickL: '#B86448', mortar: '#D8C2AE', stone: '#D8D0BE', stoneL: '#E7E0D0', stoneD: '#BDB39D', stoneDD: '#9E947E',
  glass: '#BFD3E0', glassD: '#93AFC4', leaf: PALETTE.leaf, leafD: PALETTE.leafDark, leafL: '#8DBA6E', terra: '#B5643C', terraL: '#CB7E4E', terraD: '#8E4A2C',
  mustard: '#E2B33C', rose: PALETTE.rose, sky: '#9CC3DE', shadow: '#D8D2C2', shadowD: '#CBC4B2', soil: '#8A6648', chalk: '#3E4A3F', rope: '#C9AE7E', ropeD: '#A88C5E',
  pigeon: '#8C8F99', pigeonD: '#6B6E78', pigeonL: '#B4B7BE', neck: '#5E8F8A', cloud: '#FFFFFF', cloudMid: '#FAF1F2', cloudLow: '#D8CAE2',
};
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------
// small helpers (item-local)
// ---------------------------------------------------------------------------------
/** A lamp core in world space (ctx.glows wants world coordinates). */
function glow(g, ctx, x, y, z) { ctx.glows.push(g.tx + x * g.tc + z * g.ts, y, g.tz - x * g.ts + z * g.tc); }
function smoke(g, ctx, x, y, z) { ctx.smoke.push(g.tx + x * g.tc + z * g.ts, y, g.tz - x * g.ts + z * g.tc); }
/** Keep-out box of an item, w x d round a local offset, turned with the item. */
export function rotBox(it, w, d, ox = 0, oz = 0) {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const cx = it.x + ox * c + oz * s, cz = it.z - ox * s + oz * c;
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return { type: 'box', minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd };
}
const circ = (it, r, ox = 0, oz = 0) => {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  return { type: 'circle', x: it.x + ox * c + oz * s, z: it.z - ox * s + oz * c, r };
};
/** An octagonal block (round things): two squares, one turned 45 degrees. */
function oct(g, x, y, z, w, h, col, d = w) {
  g.box(x, y, z, w * 0.83, h, d * 0.83, col);
  g.box(x, y, z, w * 0.83, h, d * 0.83, col, Math.PI / 4);
}
/** A flat upright quad facing local +Z (2 triangles, not a 12-triangle box): print on a wall. */
export function face(f, x, y, z, w, h, col) {
  const P = (lx, ly) => [f.tx + lx * f.tc + z * f.ts, f.ty + ly, f.tz - lx * f.ts + z * f.tc];
  f.quad(P(x - w / 2, y - h / 2), P(x + w / 2, y - h / 2), P(x + w / 2, y + h / 2), P(x - w / 2, y + h / 2), col, f.ts, 0, f.tc);
}
/** Printed lines on a flat face (the ground Geo: no outlines): columns of grey type, a headline now and then. */
function printFace(f, x0, x1, y0, y1, z, seed, o = {}) {
  const r = rng(seed);
  const colW = o.col || 1.05, gut = 0.14, lh = o.lh || 0.17, col = o.color || J.print, dz = o.dz ?? 0.006;
  for (let cx = x0; cx < x1 - 0.3; cx += colW + gut) {
    const cx1 = Math.min(x1, cx + colW);
    let y = y1 - 0.12;
    if (r() < 0.45) { // a headline over this column
      face(f, (cx + cx1) / 2, y - 0.06, z + dz, cx1 - cx, 0.13, o.head || J.printD);
      y -= 0.3;
    }
    if (r() < 0.2 && y - 0.7 > y0) { // a photo block
      face(f, (cx + cx1) / 2, y - 0.32, z + dz, cx1 - cx - 0.08, 0.56, o.photo || J.newsDD);
      y -= 0.78;
    }
    for (; y > y0 + 0.08; y -= lh) {
      let x = cx + (r() < 0.15 ? 0.15 : 0);
      while (x < cx1 - 0.12) {
        const len = Math.min(cx1 - x, 0.2 + r() * 0.55);
        face(f, x + len / 2, y, z + dz, len, 0.045, col);
        x += len + 0.06 + r() * 0.08;
      }
    }
  }
}
/** A window: ink frame, glass with a cross bar, sill; optional shutters, curtain, sill pots, lit-dark inside. */
function win(g, f, x, y, z, w, h, o = {}) {
  const fr = o.frame || J.ink;
  g.box(x, y, z, w + 0.14, h + 0.14, 0.08, fr);
  g.box(x, y, z + 0.025, w, h, 0.06, o.dark ? J.inside : J.glass);
  if (!o.dark) g.box(x - w * 0.22, y + h * 0.18, z + 0.058, w * 0.28, h * 0.4, 0.004, J.glassD); // a reflection
  face(f, x, y, z + 0.07, 0.04, h, fr);
  face(f, x, y + h * 0.12, z + 0.07, w, 0.04, fr);
  if (o.curtain) g.box(x + (o.curtainX || -w * 0.25), y + h * 0.1, z + 0.045, w * 0.42, h * 0.8, 0.03, o.curtain);
  g.box(x, y - h / 2 - 0.08, z + 0.09, w + 0.28, 0.06, 0.2, o.sill || J.stoneL);
  if (o.shut) for (const sx of [-1, 1]) {
    const sxp = x + sx * (w / 2 + 0.2);
    g.box(sxp, y, z + 0.05, 0.3, h + 0.04, 0.05, o.shut);
    for (let k = 0; k < 4; k++) face(f, sxp, y - h / 2 + 0.14 + k * (h - 0.2) / 4, z + 0.08, 0.22, 0.035, shade(o.shut, 0.78));
  }
  if (o.pots) for (let k = 0; k < o.pots; k++) {
    const px = x - w / 2 + 0.16 + k * ((w - 0.3) / Math.max(1, o.pots - 1));
    g.box(px, y - h / 2 + 0.04, z + 0.14, 0.16, 0.16, 0.14, k % 2 ? J.terra : J.terraL);
    g.box(px, y - h / 2 + 0.18, z + 0.14, 0.2, 0.14, 0.18, k % 3 ? J.leaf : J.leafL);
    if (k % 2 === 0) g.box(px + 0.03, y - h / 2 + 0.28, z + 0.16, 0.08, 0.07, 0.08, [J.rose, J.mustard, J.white][k % 3]);
  }
}
/** A plank door (closed), in a frame. */
function door(g, f, x, y0, z, w, h, col, o = {}) {
  g.box(x, y0 + h / 2 + 0.06, z, w + 0.2, h + 0.12, 0.1, o.frame || J.ink);
  g.box(x, y0 + h / 2, z + 0.04, w, h, 0.06, col);
  const n = Math.max(2, Math.round(w / 0.22));
  for (let k = 1; k < n; k++) face(f, x - w / 2 + (w * k) / n, y0 + h / 2, z + 0.075, 0.02, h - 0.06, shade(col, 0.78));
  for (const yy of [0.25, 0.75]) face(f, x, y0 + h * yy, z + 0.076, w - 0.06, 0.06, shade(col, 0.86));
  g.box(x + w / 2 - 0.13, y0 + h * 0.48, z + 0.085, 0.06, 0.06, 0.04, J.brass);
  g.box(x, y0 + 0.04, z + 0.2, w + 0.3, 0.08, 0.32, o.step || J.stoneD);
}
/** A flat quad lying on a roof slope (tilted by `a` about X, like g.boxR(.., a, 0, 0)): 2 triangles. */
function slab(f, x, y, z, w, len, col, a) {
  const c = Math.cos(a), s = Math.sin(a);
  const P = (dx, dz) => { const lx = x + dx, ly = y - dz * s, lz = z + dz * c; return [f.tx + lx * f.tc + lz * f.ts, f.ty + ly, f.tz - lx * f.ts + lz * f.tc]; };
  f.quad(P(-w / 2, -len / 2), P(w / 2, -len / 2), P(w / 2, len / 2), P(-w / 2, len / 2), col, s * f.ts, c, s * f.tc);
}
/** A gable roof of corrugated tin (ridge along X): two slabs, ribs down each slope, a ridge cap, gable ends. */
function tinRoof(g, f, W, D, y0, rise, col, o = {}) {
  const over = o.over ?? 0.35, half = D / 2 + over, ang = Math.atan2(rise, D / 2), slope = half / Math.cos(ang);
  for (const sz of [-1, 1]) {
    g.boxR(0, y0 + rise / 2 + 0.06, (sz * half) / 2, W + over * 2, 0.1, slope, col, sz * ang, 0, 0);
    for (let x = -W / 2 - over + 0.2; x < W / 2 + over - 0.1; x += 0.34) slab(f, x, y0 + rise / 2 + 0.14, (sz * half) / 2, 0.06, slope - 0.04, shade(col, 0.84), sz * ang);
    // rust streaks and a patched sheet (lived-in)
    if (o.patch !== false) slab(f, -W / 4 + sz * 0.6, y0 + rise / 2 + 0.145, (sz * half) / 2, 1.0, slope * 0.55, sz > 0 ? J.rust : shade(col, 1.12), sz * ang);
  }
  g.box(0, y0 + rise + 0.12, 0, W + over * 2 + 0.06, 0.12, 0.28, o.cap || shade(col, 0.7));
  if (o.ends !== false) gableEnds(g, W, D, y0, rise, o.endCol || J.newsD);
}
/** Slate tiles (ridge along X): rows of overlapping slabs, odd tiles darker, a ridge cap. */
function slateRoof(g, f, W, D, y0, rise, col, o = {}) {
  const over = o.over ?? 0.35, half = D / 2 + over, ang = Math.atan2(rise, D / 2), rows = o.rows || 5;
  const r = rng(o.seed || 3);
  for (const sz of [-1, 1]) {
    for (let k = 0; k < rows; k++) {
      const t0 = k / rows, t1 = (k + 1) / rows, tz = sz * half * (1 - (t0 + t1) / 2), ty = y0 + rise * ((t0 + t1) / 2) + 0.08;
      const len = (half / rows) / Math.cos(ang) + 0.12;
      g.boxR(0, ty, tz, W + over * 2 - k * 0.02, 0.12, len, k % 2 ? col : shade(col, 1.1), sz * ang, 0, 0);
      // tile joints and an odd tile or two
      for (let x = -W / 2 - over + 0.3 + (k % 2) * 0.2; x < W / 2 + over - 0.2; x += 0.42) {
        slab(f, x, ty + 0.075 * Math.cos(ang), tz + sz * 0.075 * Math.sin(ang), 0.03, len - 0.06, shade(col, 0.78), sz * ang);
        if (r() < 0.06) slab(f, x + 0.2, ty + 0.078 * Math.cos(ang), tz + sz * 0.078 * Math.sin(ang), 0.36, len - 0.1, shade(col, r() < 0.5 ? 0.82 : 1.22), sz * ang);
      }
    }
  }
  g.box(0, y0 + rise + 0.14, 0, W + over * 2 + 0.06, 0.16, 0.3, o.cap || J.ink);
  if (o.ends !== false) gableEnds(g, W, D, y0, rise, o.endCol || J.newsD);
}
function gableEnds(g, W, D, y0, rise, color) {
  const steps = 4;
  for (let i = 0; i < steps; i++) g.box(0, y0 + (rise * (i + 0.5)) / steps, 0, W - 0.04, rise / steps, D * (1 - (i + 0.5) / steps), color);
}
/** A newsprint-board wall front: vertical boards, each a slightly different grey, ink battens. */
function boardWall(g, f, x0, x1, y0, y1, z, seed, base = J.news) {
  const n = Math.max(3, Math.round((x1 - x0) / 0.62));
  for (let i = 0; i < n; i++) {
    const xa = x0 + ((x1 - x0) * i) / n, xb = x0 + ((x1 - x0) * (i + 1)) / n;
    g.box((xa + xb) / 2, (y0 + y1) / 2, z, xb - xa + 0.002, y1 - y0, 0.12, jitter(base, 0.035, seed + i * 7));
  }
  for (let i = 1; i < n; i++) face(f, x0 + ((x1 - x0) * i) / n, (y0 + y1) / 2, z + 0.065, 0.03, y1 - y0 - 0.04, shade(base, 0.8));
}
function plinth(g, W, D, col = J.stoneD, h = 0.22) { g.box(0, h / 2, 0, W + 0.3, h, D + 0.3, col); }
/** A potted plant (blocky): pot, leaves, maybe flowers; big = a leafy palm-ish clump. */
function pot(g, x, z, s = 1, kind = 0, y = 0) {
  g.box(x, y + 0.14 * s, z, 0.3 * s, 0.28 * s, 0.3 * s, kind % 2 ? J.terra : J.terraL);
  g.box(x, y + 0.29 * s, z, 0.34 * s, 0.05 * s, 0.34 * s, J.terraD);
  if (kind === 2) { // a little palm: fronds out
    for (let k = 0; k < 4; k++) g.boxR(x, y + 0.55 * s, z, 0.08 * s, 0.05 * s, 0.6 * s, k % 2 ? J.leaf : J.leafL, 0.5, (k * TAU) / 4, 0);
    g.box(x, y + 0.45 * s, z, 0.08 * s, 0.32 * s, 0.08 * s, J.woodG);
  } else {
    g.box(x, y + 0.44 * s, z, 0.36 * s, 0.26 * s, 0.36 * s, kind === 3 ? J.leafD : J.leaf);
    g.box(x + 0.05 * s, y + 0.6 * s, z - 0.04 * s, 0.22 * s, 0.14 * s, 0.22 * s, J.leafL);
    if (kind === 1) for (const [dx, dz, c] of [[0.12, 0.1, J.rose], [-0.1, 0.06, J.mustard], [0.02, -0.12, J.white]]) g.box(x + dx * s, y + 0.62 * s, z + dz * s, 0.08 * s, 0.08 * s, 0.08 * s, c);
  }
}
/** Shadow pad on the ground. */
const pad = (f, x0, z0, x1, z1, col = J.shadow) => f.flat(x0, z0, x1, z1, 0.007, col);

// ---------------------------------------------------------------------------------
// BUILDINGS (ART)
// ---------------------------------------------------------------------------------

/** The bridge hands' hut on the west bridgehead square (room `bridgehut`): folded newsprint board, plank
 * door in the middle of its front under a hanging lamp, a propped shutter on its east end, a stove pipe,
 * the sign «တံတားစောင့်», a rope coil and a spare winch handle on hooks by the door. 6.2 x 5. */
function jHut(g, f, it, ctx) {
  const W = it.w || 6.2, D = it.d || 5, H = 2.85, fz = D / 2;
  pad(f, -W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.7, D / 2 + 0.9);
  plinth(g, W, D, J.stoneD, 0.2);
  // walls: front of vertical newsprint boards, plain sides and back; ink-black corner posts
  boardWall(g, f, -W / 2, W / 2, 0.2, H, fz - 0.06, 11);
  g.box(0, (0.2 + H) / 2, -0.06, W - 0.1, H - 0.2, D - 0.12, J.newsD);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * W / 2, (0.2 + H) / 2 + 0.05, sz * D / 2, 0.18, H - 0.1, 0.18, J.ink);
  g.box(0, H, fz + 0.02, W + 0.1, 0.14, 0.16, J.ink); // top rail
  g.box(0, 0.28, fz + 0.02, W + 0.1, 0.1, 0.16, J.inkL);
  // printed columns on the front boards (it is newsprint board, after all), left and right of the door
  printFace(f, -W / 2 + 0.25, -0.75, 0.55, H - 0.25, fz, 21);
  printFace(f, 0.75, W / 2 - 0.25, 0.55, H - 0.25, fz, 22);
  // the plank door, the lamp over it, the sign board above
  door(g, f, 0, 0.2, fz, 1.0, 2.0, J.woodG);
  g.box(0, 2.38, fz + 0.3, 0.06, 0.06, 0.55, J.ink); // lamp bracket
  g.box(0, 2.3, fz + 0.55, 0.02, 0.18, 0.02, J.ink);
  g.box(0, 2.1, fz + 0.55, 0.22, 0.26, 0.22, J.ink);
  g.box(0, 2.1, fz + 0.55, 0.16, 0.2, 0.24, '#FFE7A8');
  g.box(0, 2.25, fz + 0.55, 0.28, 0.05, 0.28, J.ink);
  glow(g, ctx, 0, 2.1, fz + 0.55);
  ctx.signs.push({ x: 0, y: 2.62, z: fz + 0.1, w: 1.7, h: 0.42, lines: [{ text: 'တံတားစောင့်', size: 50, color: '#2E2A26' }], bg: '#F1EDE3', border: '#2E2A26', width: 384, height: 96 });
  // a small window left of the door
  win(g, f, -1.85, 1.45, fz + 0.02, 0.8, 0.7, { shut: J.slate, curtain: J.red });
  // rope coil and spare winch handle on hooks, right of the door
  for (const [hx, hy] of [[1.0, 1.85], [1.55, 1.85]]) g.box(hx, hy, fz + 0.1, 0.05, 0.05, 0.14, J.ink);
  for (let k = 0; k < 8; k++) { const a = (k * TAU) / 8; g.box(1.0 + Math.sin(a) * 0.2, 1.62 + Math.cos(a) * 0.2, fz + 0.14, 0.1, 0.1, 0.08, k % 2 ? J.rope : J.ropeD, 0); }
  g.box(1.55, 1.55, fz + 0.14, 0.06, 0.6, 0.06, J.inkL); // the crank
  g.box(1.68, 1.28, fz + 0.14, 0.3, 0.06, 0.06, J.inkL);
  g.box(1.82, 1.28, fz + 0.2, 0.06, 0.16, 0.06, J.woodL);
  // the east end: the propped shutter (opens outward on a stick)
  const ex = W / 2 + 0.06;
  g.box(ex, 1.45, -0.5, 0.06, 0.8, 0.9, J.inside);
  g.boxR(ex + 0.36, 1.78, -0.5, 0.06, 0.82, 0.92, J.woodG, 0, 0, 1.0);
  g.boxR(ex + 0.22, 1.38, -0.5, 0.04, 0.5, 0.04, J.woodD, 0, 0, -0.5);
  // a water bucket and a coil of spare rope on the step; a long boat hook leaning by the west corner
  oct(g, -0.95, 0.38, fz + 0.45, 0.32, 0.36, J.tin);
  g.box(-0.95, 0.58, fz + 0.45, 0.34, 0.04, 0.04, J.inkL);
  g.boxR(-W / 2 - 0.15, 1.3, fz - 0.2, 0.05, 2.6, 0.05, J.woodD, 0.06, 0, 0.12);
  g.box(-W / 2 - 0.02, 2.55, fz - 0.15, 0.2, 0.05, 0.05, J.inkL);
  // roof: corrugated tin, ink ridge, the stove pipe with its little hat, smoking
  tinRoof(g, f, W, D, H + 0.05, 1.0, J.tin, { endCol: J.newsD, cap: J.ink });
  g.box(1.9, H + 1.35, -1.1, 0.2, 1.7, 0.2, J.tinD);
  g.box(1.9, H + 2.24, -1.1, 0.42, 0.06, 0.42, J.ink);
  g.box(1.9, H + 2.32, -1.1, 0.3, 0.06, 0.3, J.ink);
  smoke(g, ctx, 1.9, H + 2.4, -1.1);
}

/** A Junction house: 'row' (two storeys, a shop or a door below, newsprint-board upstairs, slate or tin roof)
 * or 'cottage' (one storey with a porch). w, d, seed; optional wall/roof/shut colours, shop: true. */
function jHouse(g, f, it, ctx) {
  const W = it.w, D = it.d, r = rng(it.seed || 1);
  const walls = [J.news, J.newsL, '#E9E2D0', J.wash, '#EADBC8', '#E3E6DA'];
  const shuts = [J.blue, J.teal, J.red, J.green, J.woodD, J.slate];
  const wall = it.wall || walls[Math.floor(r() * walls.length)];
  const shut = it.shut || shuts[Math.floor(r() * shuts.length)];
  const roofKind = it.roof || (r() < 0.5 ? 'slate' : 'tin');
  const roofCol = it.roofCol || (roofKind === 'slate' ? [J.slate, J.slateD, '#5E4B3C', J.maroon][Math.floor(r() * 4)] : [J.tin, J.tinD, '#8E9A8C'][Math.floor(r() * 3)]);
  const fz = D / 2;
  pad(f, -W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.6, D / 2 + 0.7);
  if (it.style === 'cottage') {
    const H = 2.9;
    plinth(g, W, D, J.stoneD, 0.32);
    boardWall(g, f, -W / 2, W / 2, 0.32, H, fz - 0.6, it.seed, wall);
    g.box(0, (0.32 + H) / 2, -0.6, W - 0.1, H - 0.32, D - 1.3, shade(wall, 0.95));
    for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.06), (0.32 + H) / 2, -0.3, 0.14, H - 0.32, D - 0.6, shade(wall, 0.9));
    // porch: deck, posts, a rail with a gap at the door
    g.box(0, 0.36, fz - 0.15, W, 0.08, 1.0, J.woodL);
    const dx = (r() - 0.5) * (W - 2.6);
    for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.12), 1.6, fz + 0.25, 0.14, 2.5, 0.14, J.woodD);
    for (let x = -W / 2 + 0.3; x < W / 2 - 0.2; x += 0.42) if (Math.abs(x - dx) > 0.6) g.box(x, 0.68, fz + 0.28, 0.05, 0.56, 0.05, J.woodD);
    for (const sx of [-1, 1]) { const xa = sx < 0 ? -W / 2 + 0.1 : dx + 0.6, xb = sx < 0 ? dx - 0.6 : W / 2 - 0.1; if (xb - xa > 0.3) g.box((xa + xb) / 2, 0.94, fz + 0.28, xb - xa, 0.06, 0.08, J.wood); }
    door(g, f, dx, 0.4, fz - 0.6, 0.9, 1.9, shut, { step: J.woodG });
    for (const wx of [-W / 2 + 1.05, W / 2 - 1.05]) if (Math.abs(wx - dx) > 1.3) win(g, f, wx, 1.55, fz - 0.58, 0.8, 0.85, { shut, curtain: [J.rose, J.mustard, J.white][Math.floor(r() * 3)], pots: r() < 0.5 ? 3 : 0 });
    printFace(f, -W / 2 + 0.2, W / 2 - 0.2, H - 0.55, H - 0.1, fz - 0.6, it.seed + 3, { lh: 0.14 });
    // porch life: a chair, a water pot, a hanging bird cage or a plant
    if (r() < 0.6) { g.box(dx + 1.2, 0.62, fz - 0.15, 0.4, 0.06, 0.4, J.woodD); g.box(dx + 1.2, 0.85, fz - 0.33, 0.4, 0.42, 0.05, J.woodD); }
    pot(g, -W / 2 + 0.45, fz - 0.15, 0.9, Math.floor(r() * 4), 0.4);
    if (r() < 0.5) { g.box(dx - 1.1, 2.35, fz - 0.15, 0.03, 0.3, 0.03, J.ink); g.box(dx - 1.1, 2.08, fz - 0.15, 0.3, 0.3, 0.3, J.woodL); g.box(dx - 1.1, 2.08, fz - 0.15, 0.24, 0.24, 0.32, J.mustard); }
    tinRoof(g, f, W, D, H, 1.1, roofKind === 'slate' ? J.tin : roofCol, { endCol: shade(wall, 0.92), over: 0.45 });
    return;
  }
  // 'row' (default): two storeys
  const H1 = 3.0, H2 = 5.5;
  plinth(g, W, D, J.stoneD, 0.2);
  const shop = it.shop ?? r() < 0.45;
  if (shop) { // the ground floor stands back 1 m behind the shop opening, two side piers carry the front
    g.box(0, (0.2 + H1) / 2, -0.5, W, H1 - 0.2, D - 1.0, shade(wall, 0.96));
    for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.25), (0.2 + H1) / 2, fz - 0.5, 0.5, H1 - 0.2, 1.0, shade(wall, 0.96));
    g.box(0, H1 - 0.12, fz - 0.5, W - 0.9, 0.24, 1.0, J.insideD);
  } else g.box(0, (0.2 + H1) / 2, -0.05, W, H1 - 0.2, D - 0.1, shade(wall, 0.96));
  boardWall(g, f, -W / 2, W / 2, H1, H2, fz - 0.05, it.seed + 1, wall);
  g.box(0, (H1 + H2) / 2, -0.05, W - 0.04, H2 - H1, D - 0.1, shade(wall, 0.93));
  g.box(0, H1, fz + 0.04, W + 0.06, 0.16, 0.14, J.ink); // floor band
  for (const sx of [-1, 1]) g.box(sx * W / 2, H2 / 2 + 0.1, fz, 0.2, H2 - 0.2, 0.2, shade(wall, 0.82));
  const dx = it.doorX ?? (r() - 0.5) * (W - 2.4);
  if (shop) {
    // a shop front: dark opening, shelves of goods, a counter, a rolled shutter, a striped awning
    const OW = W - 1.0;
    g.box(0, 1.5, fz - 0.97, OW, 2.6, 0.04, J.inside);
    g.box(0, 0.23, fz - 0.5, OW, 0.04, 1.0, J.insideD);
    const goods = [J.mustard, J.red, J.blue, J.white, J.teal, '#F3B27A', J.newsL];
    for (let k = 0; k < 3; k++) {
      g.box(0, 0.75 + k * 0.55, fz - 0.82, OW - 0.1, 0.05, 0.28, J.woodL);
      for (let x = -OW / 2 + 0.25; x < OW / 2 - 0.2; x += 0.36) g.box(x, 0.91 + k * 0.55, fz - 0.82, 0.24, 0.26, 0.2, goods[(Math.round(x * 7) + k + it.seed) % goods.length]);
    }
    g.box(0, 0.6, fz - 0.28, OW - 0.6, 0.8, 0.42, J.woodG);
    g.box(0, 1.03, fz - 0.28, OW - 0.5, 0.06, 0.5, J.woodL);
    for (let k = 0; k < 4; k++) g.box(-OW / 2 + 0.7 + k * 0.5, 1.16, fz - 0.28, 0.24, 0.2, 0.24, k % 2 ? J.glass : J.newsL);
    g.box(0, 2.6, fz + 0.02, OW + 0.1, 0.36, 0.14, J.tinL);
    for (let k = 0; k < 3; k++) face(f, 0, 2.48 + k * 0.1, fz + 0.1, OW, 0.025, J.tinD);
    const awn = it.awning || [J.red, J.teal, J.blue, J.green][Math.floor(r() * 4)];
    const n = Math.max(4, Math.round(W / 0.5));
    for (let i = 0; i < n; i++) g.boxR(-W / 2 + (W * (i + 0.5)) / n, 2.82, fz + 0.62, W / n + 0.004, 0.05, 1.25, i % 2 ? J.white : awn, 0.3, 0, 0);
    for (let i = 0; i < n; i++) g.box(-W / 2 + (W * (i + 0.5)) / n, 2.52, fz + 1.2, W / n - 0.05, 0.14, 0.04, i % 2 ? J.white : awn);
  } else {
    door(g, f, dx, 0.2, fz - 0.07, 0.95, 2.1, shut);
    for (const wx of [-W / 2 + 1.0, W / 2 - 1.0]) if (Math.abs(wx - dx) > 1.25) win(g, f, wx, 1.55, fz - 0.06, 0.85, 1.0, { shut, curtain: J.cream, pots: r() < 0.6 ? 3 : 0 });
    // a doorstep plant and a pair of sandals
    pot(g, dx + 0.85, fz + 0.3, 0.9, Math.floor(r() * 4));
    for (const s of [-0.1, 0.1]) g.box(dx - 0.2 + s, 0.23, fz + 0.32, 0.1, 0.03, 0.24, s < 0 ? J.red : J.inkL);
  }
  // upstairs: two windows with shutters, a narrow balcony with a rail; washing or plants on it
  for (const wx of [-W / 4, W / 4]) win(g, f, wx, H1 + 1.2, fz + 0.02, 0.85, 1.05, { shut, curtain: [J.rose, J.white, J.sky][(it.seed + Math.round(wx)) % 3] });
  printFace(f, -W / 2 + 0.25, W / 2 - 0.25, H2 - 0.85, H2 - 0.15, fz + 0.01, it.seed + 5, { lh: 0.15 });
  if (r() < 0.65) {
    g.box(0, H1 + 0.18, fz + 0.45, W - 0.5, 0.08, 0.8, J.stoneL);
    for (let x = -W / 2 + 0.35; x <= W / 2 - 0.3; x += 0.32) g.box(x, H1 + 0.48, fz + 0.82, 0.04, 0.55, 0.04, J.ink);
    g.box(0, H1 + 0.76, fz + 0.82, W - 0.5, 0.05, 0.06, J.ink);
    if (r() < 0.5) { // washing on the balcony rail
      const cols = [J.rose, J.white, J.sky, J.mustard, J.maroon, J.teal];
      for (let k = 0, x = -W / 2 + 0.5; x < W / 2 - 0.6; k++, x += 0.5) g.box(x, H1 + 0.55, fz + 0.86, 0.38, 0.4 + (k % 3) * 0.08, 0.03, cols[(k + it.seed) % cols.length]);
    } else for (let k = 0; k < 3; k++) pot(g, -W / 2 + 0.7 + k * (W - 1.4) / 2, fz + 0.5, 0.75, (k + it.seed) % 4, H1 + 0.22);
  }
  // roof
  if (roofKind === 'slate') slateRoof(g, f, W, D, H2, 1.3, roofCol, { seed: it.seed, endCol: shade(wall, 0.9) });
  else tinRoof(g, f, W, D, H2, 1.2, roofCol, { endCol: shade(wall, 0.9) });
  // rooftop life: a water drum on a stand, or a chimney pot, or a small antenna of wire
  const rk = r();
  if (rk < 0.4) { const x = (r() - 0.5) * (W - 2); for (const sx of [-0.3, 0.3]) g.box(x + sx, H2 + 1.15, -D / 4, 0.06, 0.5, 0.06, J.ink); oct(g, x, H2 + 1.7, -D / 4, 0.8, 0.7, r() < 0.5 ? J.blueD : J.inkL); g.box(x, H2 + 2.08, -D / 4, 0.5, 0.06, 0.5, J.ink); }
  else if (rk < 0.75) { g.box(W / 2 - 0.8, H2 + 1.2, -0.7, 0.5, 1.1, 0.5, J.brick); g.box(W / 2 - 0.8, H2 + 1.8, -0.7, 0.62, 0.1, 0.62, J.ink); smoke(g, ctx, W / 2 - 0.8, H2 + 1.9, -0.7); }
  else { g.box(-W / 2 + 0.9, H2 + 1.8, -0.4, 0.04, 1.6, 0.04, J.ink); g.box(-W / 2 + 0.9, H2 + 2.4, -0.4, 0.8, 0.03, 0.03, J.ink); g.box(-W / 2 + 0.9, H2 + 2.2, -0.4, 0.5, 0.03, 0.03, J.ink); }
}

/** Ma Thida's house and letter shop (room `letterroom`): first house on the bridge-foot street, north side.
 * A narrow blue door, open by day, a painted envelope over it; through it her table and the gold glint of
 * jars; a front window with her writing table; «စာရေးပေးသည်» over it. 5.4 x 6. */
function jLetter(g, f, it, ctx) {
  const W = it.w || 5.4, D = it.d || 6, H1 = 3.0, H2 = 5.4, fz = D / 2, wall = J.wash, DX = -1.25;
  pad(f, -W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.6, D / 2 + 0.8);
  plinth(g, W, D, J.stoneD, 0.2);
  // ground floor: blue-washed plaster with a darker dado; upstairs newsprint board
  // the body, carved round the doorway so it opens into a short hall (1.06 x 1.8)
  const dl = DX - 0.53, dr = DX + 0.53;
  g.box((-W / 2 + dl) / 2, (0.2 + H1) / 2, -0.06, dl + W / 2, H1 - 0.2, D - 0.12, wall);
  g.box((dr + W / 2) / 2, (0.2 + H1) / 2, -0.06, W / 2 - dr, H1 - 0.2, D - 0.12, wall);
  g.box(DX, (0.2 + H1) / 2, -0.96, 1.06, H1 - 0.2, D - 1.92, wall);
  g.box(DX, (2.24 + H1) / 2, -0.06, 1.06, H1 - 2.24, D - 0.12, wall);
  g.box(DX, 1.2, fz - 1.9, 1.04, 2.0, 0.04, J.inside);
  g.box(DX, 0.22, fz - 0.95, 1.04, 0.04, 1.8, J.insideD);
  for (const sx of [-1, 1]) g.box(DX + sx * 0.51, 1.2, fz - 0.95, 0.02, 2.0, 1.8, J.inside);
  for (const sx of [-1, 1]) g.box(sx < 0 ? (-W / 2 + dl) / 2 : (dr + W / 2) / 2, 0.55, fz + 0.01, sx < 0 ? dl + W / 2 : W / 2 - dr, 0.7, 0.04, shade(wall, 0.86));
  boardWall(g, f, -W / 2, W / 2, H1, H2, fz - 0.05, 41, J.newsL);
  g.box(0, (H1 + H2) / 2, -0.05, W - 0.04, H2 - H1, D - 0.1, J.newsD);
  g.box(0, H1, fz + 0.04, W + 0.06, 0.16, 0.14, J.blueD);
  for (const sx of [-1, 1]) g.box(sx * W / 2, H2 / 2 + 0.1, fz, 0.2, H2 - 0.2, 0.2, J.blueD);
  // the narrow blue door, open inward: dark doorway, the leaf swung back, a glimpse of the table and jars
  g.box(DX, 2.22, fz + 0.02, 1.16, 0.12, 0.12, J.blueD); // the door frame
  for (const sx of [-1, 1]) g.box(DX + sx * 0.53, 1.2, fz + 0.02, 0.1, 2.04, 0.12, J.blueD);
  g.box(DX - 0.44, 1.2, fz - 0.46, 0.06, 1.96, 0.8, J.blue); // the leaf, swung in against the wall
  g.box(DX - 0.4, 1.2, fz - 0.8, 0.04, 0.05, 0.05, J.brass);
  g.box(DX + 0.1, 0.72, fz - 1.45, 0.8, 0.06, 0.6, J.woodL); // her table at the end of the hall
  for (const sx of [-0.3, 0.3]) g.box(DX + 0.1 + sx, 0.36, fz - 1.45, 0.05, 0.7, 0.5, J.woodD);
  g.box(DX + 0.1, 1.5, fz - 1.82, 0.9, 0.04, 0.14, J.woodL);
  for (let k = 0; k < 5; k++) g.box(DX - 0.25 + k * 0.17, 1.6, fz - 1.82, 0.1, 0.14, 0.1, k % 2 ? J.inkGold : J.inkGoldD); // jars on the shelf
  g.box(DX + 0.3, 0.8, fz - 1.4, 0.24, 0.03, 0.3, J.white);
  g.box(DX, 0.06, fz + 0.18, 1.2, 0.12, 0.36, J.stoneD);
  g.box(DX, 0.18, fz + 0.38, 1.0, 0.1, 0.3, J.stone);
  // the painted envelope over the door: white with a blue V and a red seal
  g.box(DX, 2.62, fz + 0.03, 0.9, 0.52, 0.04, J.white);
  f.boxR(DX - 0.22, 2.74, fz + 0.06, 0.52, 0.04, 0.01, J.blue, 0, 0, -0.5);
  f.boxR(DX + 0.22, 2.74, fz + 0.06, 0.52, 0.04, 0.01, J.blue, 0, 0, 0.5);
  g.box(DX, 2.6, fz + 0.06, 0.14, 0.14, 0.03, J.red);
  // the front window with her writing table inside, a pen jar and a stack of envelopes
  win(g, f, 0.95, 1.55, fz + 0.02, 1.9, 1.15, { frame: J.blueD, sill: J.white, dark: true });
  for (let k = 0; k < 6; k++) g.box(0.25 + k * 0.28, 1.25, fz + 0.075, 0.12, 0.16, 0.02, k % 2 ? J.inkGold : J.inkGoldD); // the gold glint of her jars
  g.box(0.95, 1.08, fz + 0.075, 1.6, 0.04, 0.02, J.woodL);
  g.box(0.55, 1.08, fz + 0.2, 0.36, 0.05, 0.22, J.white); // envelopes and a pen jar on the sill
  g.box(1.45, 1.13, fz + 0.2, 0.1, 0.16, 0.1, J.blueD);
  g.boxR(1.45, 1.27, fz + 0.2, 0.02, 0.2, 0.02, J.white, 0, 0, 0.2);
  ctx.signs.push({ x: 0.95, y: 2.55, z: fz + 0.08, w: 2.0, h: 0.46, lines: [{ text: 'စာရေးပေးသည်', size: 50, color: '#2E5578' }], bg: '#FFFDF8', border: '#2E5578', width: 384, height: 88 });
  // upstairs: one wide window with blue shutters and a flower box, a bird cage hung by it
  win(g, f, 0, H1 + 1.25, fz + 0.02, 1.4, 1.05, { shut: J.blue, curtain: J.rose, pots: 4 });
  printFace(f, -W / 2 + 0.25, W / 2 - 0.25, H2 - 0.75, H2 - 0.12, fz + 0.01, 43, { lh: 0.15 });
  g.box(-1.9, H1 + 1.9, fz + 0.35, 0.03, 0.3, 0.03, J.ink);
  g.box(-1.9, H1 + 1.62, fz + 0.35, 0.3, 0.34, 0.3, J.woodL);
  g.box(-1.9, H1 + 1.58, fz + 0.35, 0.12, 0.12, 0.12, J.mustard);
  slateRoof(g, f, W, D, H2, 1.25, J.slateD, { seed: 41, endCol: J.newsD });
  g.box(1.4, H2 + 1.2, -0.9, 0.46, 1.0, 0.46, J.brick);
  g.box(1.4, H2 + 1.74, -0.9, 0.6, 0.08, 0.6, J.ink);
}

/** Ko Min's corner house: a sign painter's shop on the square's north-west corner. Sample boards, paint
 * tins, the half-repainted shop sign; on its west wall a painted advert facing the north road. */
function jCorner(g, f, it, ctx) {
  const W = it.w || 6, D = it.d || 6.4, H1 = 3.0, H2 = 5.6, fz = D / 2, wall = '#EADBC8';
  pad(f, -W / 2 - 0.4, -D / 2 - 0.3, W / 2 + 0.6, D / 2 + 0.8);
  plinth(g, W, D, J.stoneD, 0.2);
  const o0 = -1.4, o1 = 2.2; // the shop opening (x), 1 m deep
  g.box(0, (0.2 + H1) / 2, -0.5, W, H1 - 0.2, D - 1.0, wall);
  g.box((-W / 2 + o0) / 2, (0.2 + H1) / 2, fz - 0.5, o0 + W / 2, H1 - 0.2, 1.0, wall);
  g.box((o1 + W / 2) / 2, (0.2 + H1) / 2, fz - 0.5, W / 2 - o1, H1 - 0.2, 1.0, wall);
  g.box((o0 + o1) / 2, (2.4 + H1) / 2, fz - 0.5, o1 - o0, H1 - 2.4, 1.0, wall);
  boardWall(g, f, -W / 2, W / 2, H1, H2, fz - 0.05, 61, J.news);
  g.box(0, (H1 + H2) / 2, -0.05, W - 0.04, H2 - H1, D - 0.1, J.newsD);
  g.box(0, H1, fz + 0.04, W + 0.06, 0.16, 0.14, J.ink);
  for (const sx of [-1, 1]) g.box(sx * W / 2, H2 / 2 + 0.1, fz, 0.2, H2 - 0.2, 0.2, J.ink);
  // the shop: a wide opening, boards and tins inside, a bench out front with paint pots
  g.box(0.4, 1.3, fz - 0.97, 3.6, 2.2, 0.04, J.inside);
  g.box(0.4, 0.22, fz - 0.5, 3.6, 0.04, 1.0, J.insideD);
  for (const x of [o0, o1]) g.box(x, 1.3, fz + 0.02, 0.12, 2.2, 0.12, J.ink);
  const panels = [J.red, J.teal, J.mustard, J.blue, J.white];
  for (let k = 0; k < 5; k++) g.boxR(-1.0 + k * 0.62, 1.05, fz - 0.8, 0.5, 1.5 - (k % 2) * 0.3, 0.04, panels[k], -0.15, 0, 0);
  for (let k = 0; k < 5; k++) f.boxR(-1.0 + k * 0.62, 1.2, fz - 0.77, 0.36, 0.08, 0.01, k === 4 ? J.red : J.white, -0.15, 0, 0);
  g.box(0.4, 0.42, fz + 0.3, 2.4, 0.06, 0.5, J.woodL);
  for (const sx of [-0.7, 1.5]) g.box(0.4 + sx * 0.7, 0.2, fz + 0.3, 0.06, 0.4, 0.4, J.woodD);
  for (let k = 0; k < 6; k++) { const c = [J.red, J.mustard, J.blue, J.white, J.green, J.ink][k]; oct(g, -0.4 + k * 0.32, 0.53, fz + 0.3, 0.18, 0.18, J.tinL); g.box(-0.4 + k * 0.32, 0.63, fz + 0.3, 0.14, 0.02, 0.14, c); }
  g.boxR(-0.1, 0.72, fz + 0.38, 0.03, 0.42, 0.03, J.woodL, 0.3, 0, 0.4); // a brush in a tin
  // a little door at the west end
  door(g, f, -2.15, 0.2, fz - 0.07, 0.85, 2.1, J.red);
  // the shop sign he is repainting: half fresh, half still faded; a drip below it
  g.box(0.4, 2.62, fz + 0.06, 3.5, 0.62, 0.08, J.ink);
  ctx.signs.push({ x: 0.4, y: 2.62, z: fz + 0.11, w: 3.3, h: 0.5, lines: [{ text: 'လက်ရေး ဆိုင်းဘုတ်', size: 52, color: '#B8323A' }], bg: '#F6F0E2', border: null, width: 512, height: 80 });
  // upstairs
  for (const wx of [-W / 4, W / 4]) win(g, f, wx, H1 + 1.2, fz + 0.02, 0.9, 1.05, { shut: J.red, curtain: J.white, pots: wx > 0 ? 3 : 0 });
  printFace(f, -W / 2 + 0.25, W / 2 - 0.25, H2 - 0.8, H2 - 0.12, fz + 0.01, 63, { lh: 0.15 });
  // the west wall, facing the north road: a big painted advert (an ink bottle and stripes), sample letters
  const wx = -W / 2 - 0.02;
  g.box(wx, 3.0, -0.6, 0.04, 2.6, 4.2, J.newsL);
  g.box(wx - 0.01, 3.9, -0.6, 0.03, 0.5, 3.8, J.red);
  for (let k = 0; k < 4; k++) f.box(wx - 0.03, 3.2 - k * 0.28, -0.6 + (k % 2) * 0.3, 0.01, 0.1, 3.2 - k * 0.5, J.ink);
  g.box(wx - 0.02, 2.4, 0.9, 0.04, 0.9, 0.55, J.inkL);
  g.box(wx - 0.03, 2.95, 0.9, 0.04, 0.22, 0.25, J.inkGold);
  slateRoof(g, f, W, D, H2, 1.3, J.slate, { seed: 61, endCol: J.newsD });
}

/** Daw Sein's tea shop (room `junctiontea`): a wide doorway with a cloth half-curtain, low stools out
 * front, kettle steam from a tin pipe, «ဒေါ်စိန် လက်ဖက်ရည်ဆိုင်». (Her tea cart is its own prop.) 8 x 7. */
function jTea(g, f, it, ctx) {
  const W = it.w || 8, D = it.d || 7, H = 3.2, fz = D / 2, wall = '#E9E2D0';
  pad(f, -W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.6, D / 2 + 1.4);
  plinth(g, W, D, J.stoneD, 0.2);
  // walls: plaster below, a newsprint board frieze; the deep doorway in the middle (3 m wide)
  g.box(0, (0.2 + H) / 2, -1.0, W, H - 0.2, D - 2.0, wall);
  for (const sx of [-1, 1]) {
    g.box(sx * (W / 2 - 1.2), (0.2 + H) / 2, fz - 1.0, 2.4, H - 0.2, 2.0, wall);
    g.box(sx * (W / 2 - 1.2), 0.55, fz + 0.01, 2.4, 0.7, 0.04, J.tealD);
    win(g, f, sx * (W / 2 - 1.2), 1.7, fz + 0.02, 1.5, 1.0, { frame: J.tealD, dark: true, sill: J.white });
    for (let k = 0; k < 4; k++) g.box(sx * (W / 2 - 1.2) - 0.45 + k * 0.3, 1.62, fz + 0.075, 0.12, 0.12, 0.02, J.white); // cups on the shelf inside
    g.box(sx * 1.59, 1.6, fz - 1.0, 0.02, 2.8, 2.0, J.inside);
  }
  g.box(0, H - 0.05, fz - 1.0, 3.2, 0.1, 2.0, J.insideD);
  g.box(0, 0.22, fz - 1.0, 3.2, 0.04, 2.0, J.insideD);
  g.box(0, H + 0.2, fz - 0.3, W + 0.06, 0.6, 0.64, J.newsL);
  printFace(f, -W / 2 + 0.2, W / 2 - 0.2, H - 0.05, H + 0.45, fz + 0.02, 81, { lh: 0.12 });
  // the doorway: dark inside, the counter and brazier glowing, the cloth half-curtain (teal, white hem)
  g.box(0, 1.6, fz - 1.97, 3.2, 2.8, 0.04, J.inside);
  g.box(0, 0.62, fz - 1.4, 2.6, 0.84, 0.5, J.woodG);
  g.box(0, 1.08, fz - 1.4, 2.7, 0.06, 0.6, J.woodL);
  g.box(0.8, 1.25, fz - 1.4, 0.36, 0.26, 0.36, J.ink);
  g.box(0.8, 1.42, fz - 1.4, 0.28, 0.08, 0.28, '#E8743A');
  oct(g, 0.8, 1.6, fz - 1.4, 0.26, 0.24, J.tinL);
  g.box(-0.6, 1.3, fz - 1.42, 0.5, 0.36, 0.3, J.glass); // snack cabinet
  g.box(-0.6, 1.25, fz - 1.42, 0.4, 0.12, 0.26, '#F3B27A');
  for (let k = 0; k < 9; k++) g.box(-1.3 + k * 0.32, 2.15, fz - 1.85, 0.14, 0.18, 0.1, k % 3 ? J.inkGoldD : J.ink); // hoarded ink jars on the back shelf
  g.box(0, 2.05, fz - 1.85, 2.9, 0.05, 0.2, J.woodL);
  for (const tx of [-1.0, 1.0]) { g.box(tx, 0.4, fz - 0.6, 0.6, 0.04, 0.5, J.woodL); for (const s of [-0.4, 0.4]) g.box(tx + s, 0.2, fz - 0.6, 0.24, 0.2, 0.24, s < 0 ? J.blue : J.red); }
  for (let k = 0; k < 7; k++) g.box(-1.3 + k * 0.43, 2.72, fz - 0.02, 0.4, 0.42 - (k % 2) * 0.08, 0.04, k % 2 ? J.teal : J.tealL);
  g.box(0, 2.48, fz - 0.02, 3.0, 0.06, 0.05, J.white);
  g.box(0, 2.98, fz + 0.02, 3.2, 0.12, 0.12, J.ink);
  // a striped awning over the whole front, teal and white
  const n = Math.round(W / 0.5);
  for (let i = 0; i < n; i++) g.boxR(-W / 2 + (W * (i + 0.5)) / n, 3.22, fz + 0.55, W / n + 0.004, 0.05, 1.2, i % 2 ? J.white : J.teal, 0.3, 0, 0);
  for (let i = 0; i < n; i++) g.box(-W / 2 + (W * (i + 0.5)) / n, 2.93, fz + 1.1, W / n - 0.05, 0.14, 0.04, i % 2 ? J.white : J.teal);
  // the sign on the frieze
  ctx.signs.push({ x: 0, y: 3.85, z: fz + 0.05, w: 3.8, h: 0.6, lines: [{ text: 'ဒေါ်စိန် လက်ဖက်ရည်ဆိုင်', size: 46, color: '#FFFDF8' }], bg: '#2D6B66', border: '#C9A24A', width: 512, height: 84 });
  // the kettle's tin pipe up the east side, steaming
  g.box(W / 2 - 0.25, 2.4, fz - 0.1, 0.16, 3.2, 0.16, J.tin);
  g.box(W / 2 - 0.25, 4.05, fz - 0.1, 0.32, 0.08, 0.32, J.tinD);
  smoke(g, ctx, W / 2 - 0.25, 4.2, fz - 0.1);
  // out front: two low tables with tiny stools, cups and a teapot (the pavement tea corner)
  for (const [tx, tz] of [[-2.3, fz + 1.0], [2.3, fz + 1.0]]) {
    g.box(tx, 0.36, tz, 0.9, 0.05, 0.6, J.woodL);
    for (const sx of [-0.38, 0.38]) for (const sz of [-0.24, 0.24]) g.box(tx + sx, 0.17, tz + sz, 0.05, 0.34, 0.05, J.woodD);
    g.box(tx - 0.15, 0.45, tz, 0.16, 0.14, 0.16, J.white); g.box(tx - 0.15, 0.54, tz, 0.07, 0.04, 0.07, J.goldD);
    for (const [cx, cz] of [[0.12, 0.1], [0.25, -0.12], [-0.3, -0.15]]) { g.box(tx + cx, 0.43, tz + cz, 0.07, 0.09, 0.07, J.glass); g.box(tx + cx, 0.41, tz + cz, 0.06, 0.05, 0.06, '#C98B4A'); }
    for (const [sx, sz, c] of [[-0.7, 0.05, J.blue], [0.7, -0.05, J.red], [0.05, 0.55, J.mustard]]) { g.box(tx + sx, 0.22, tz + sz, 0.28, 0.05, 0.28, c); g.box(tx + sx, 0.1, tz + sz, 0.2, 0.2, 0.2, shade(c, 0.78)); }
  }
  // a menu chalkboard leaning by the door, a crate of empty condensed-milk tins
  g.boxR(-1.85, 0.62, fz + 0.4, 0.6, 0.9, 0.05, J.woodD, -0.2, 0.25, 0);
  g.boxR(-1.85, 0.66, fz + 0.43, 0.48, 0.72, 0.02, J.chalk, -0.2, 0.25, 0);
  for (let k = 0; k < 4; k++) g.boxR(-1.85, 0.88 - k * 0.14, fz + 0.47, 0.32 - (k % 2) * 0.1, 0.03, 0.01, J.white, -0.2, 0.25, 0);
  // roof: low tin, with a tied tarpaulin patch
  tinRoof(g, f, W, D - 0.6, H + 0.5, 1.1, J.tinD, { endCol: J.newsD, over: 0.4 });
  g.boxR(-1.6, H + 1.12, 0.9, 1.6, 0.04, 1.3, J.blueL, -Math.atan2(1.1, (D - 0.6) / 2), 0, 0);
}

/** The Junction school (room `schoolroom`), the square's north-east corner: a low one-room school, a green
 * double door under a hand bell, a row of empty ink pots on the outside sill, «လမ်းဆုံ ကျောင်း». 8.4 x 7.6. */
function jSchool(g, f, it, ctx) {
  const W = it.w || 8.4, D = it.d || 7.6, H = 3.3, fz = D / 2, wall = '#F2EDE0';
  pad(f, -W / 2 - 0.4, -D / 2 - 0.3, W / 2 + 0.7, D / 2 + 1.2);
  plinth(g, W, D, J.stone, 0.32);
  g.box(0, (0.32 + H) / 2, 0, W, H - 0.32, D, wall);
  g.box(0, 0.6, fz + 0.01, W, 0.55, 0.04, J.greenD);
  for (const sx of [-1, 1]) g.box(sx * W / 2, H / 2 + 0.15, fz, 0.22, H - 0.1, 0.22, J.green);
  g.box(0, H, fz + 0.04, W + 0.06, 0.14, 0.14, J.green);
  // the green double door up two steps
  g.box(0, 1.35, fz + 0.01, 1.7, 2.2, 0.1, J.greenD);
  for (const sx of [-0.4, 0.4]) { g.box(sx, 1.3, fz + 0.05, 0.76, 2.0, 0.06, J.green); f.box(sx, 1.65, fz + 0.09, 0.56, 0.7, 0.01, J.greenL); f.box(sx, 0.85, fz + 0.09, 0.56, 0.6, 0.01, J.greenL); }
  g.box(-0.08, 1.3, fz + 0.1, 0.05, 0.05, 0.04, J.brass); g.box(0.08, 1.3, fz + 0.1, 0.05, 0.05, 0.04, J.brass);
  for (let k = 0; k < 2; k++) g.box(0, 0.12 + k * 0.12, fz + 0.3 + (1 - k) * 0.25, 2.2 - k * 0.3, 0.12, 0.4 + (1 - k) * 0.25, J.stoneD);
  // the hand bell in a little frame over the door, its rope looped on a hook
  g.box(0, 2.62, fz + 0.18, 0.7, 0.07, 0.07, J.woodD);
  for (const sx of [-0.32, 0.32]) g.box(sx, 2.78, fz + 0.18, 0.06, 0.38, 0.06, J.woodD);
  g.box(0, 2.95, fz + 0.18, 0.76, 0.07, 0.07, J.woodD);
  oct(g, 0, 2.76, fz + 0.18, 0.24, 0.24, J.brass);
  g.box(0, 2.6, fz + 0.18, 0.08, 0.06, 0.08, J.goldD);
  g.box(0.55, 1.9, fz + 0.12, 0.02, 1.1, 0.02, J.rope);
  // windows with green shutters, and a row of empty ink pots on the outside sill (the east window)
  for (const sx of [-1, 1]) {
    const x = sx * (W / 2 - 1.75);
    win(g, f, x, 1.85, fz + 0.02, 1.4, 1.1, { shut: J.green, sill: J.white });
  }
  for (let k = 0; k < 6; k++) { const x = W / 2 - 2.4 + k * 0.24; g.box(x, 1.35, fz + 0.2, 0.13, 0.14, 0.13, J.ink); g.box(x, 1.44, fz + 0.2, 0.08, 0.04, 0.08, J.inkL); }
  // children's chalk on the wall's dado: a hopscotch-ish sum, a house, a sun
  face(f, -2.6, 0.62, fz + 0.035, 0.5, 0.04, J.white); face(f, -2.6, 0.62, fz + 0.035, 0.04, 0.3, J.white);
  face(f, -2.1, 0.62, fz + 0.035, 0.3, 0.04, J.white); face(f, -2.1, 0.7, fz + 0.035, 0.3, 0.04, J.white);
  for (let k = 0; k < 6; k++) f.boxR(2.4, 0.66, fz + 0.035, 0.32, 0.03, 0.01, J.mustard, 0, 0, (k * Math.PI) / 6);
  // the sign on the gable
  ctx.signs.push({ x: 0, y: H + 0.62, z: fz + 0.12, w: 2.8, h: 0.6, lines: [{ text: 'လမ်းဆုံ ကျောင်း', size: 54, color: '#3A6345' }], bg: '#FFFDF8', border: '#3A6345', width: 448, height: 96 });
  g.box(0, H + 0.62, fz + 0.05, 3.0, 0.76, 0.1, J.greenD);
  // a slate rack and two leaning slates by the west wall, a small flag
  g.box(-W / 2 + 0.6, 0.65, fz + 0.4, 0.9, 0.06, 0.3, J.woodL);
  for (let k = 0; k < 3; k++) g.boxR(-W / 2 + 0.35 + k * 0.25, 0.95, fz + 0.4, 0.22, 0.32, 0.03, J.chalk, -0.15, 0, 0);
  g.box(W / 2 - 0.4, 2.0, fz + 0.6, 0.06, 3.6, 0.06, J.goldD);
  g.box(W / 2 - 0.05, 3.5, fz + 0.6, 0.7, 0.42, 0.03, J.green);
  g.box(W / 2 - 0.05, 3.5, fz + 0.62, 0.3, 0.16, 0.02, J.gold);
  tinRoof(g, f, W, D, H + 0.08, 1.4, J.slateL, { endCol: wall, cap: J.greenD, over: 0.45 });
}

/** The Gold Ink Press (room `press`), first building on the street east from the square: brick front, an
 * ink-black door frame, wide plank double doors propped open, the press dark inside, a side door in its west
 * wall to the back yard, a brick chimney smoking, «ရွှေမင် ပုံနှိပ်တိုက်». 8.4 x 8. (The easel is its own prop.) */
function jPress(g, f, it, ctx) {
  const W = it.w || 8.4, D = it.d || 8, H = 3.9, fz = D / 2, OW = 2.6, OH = 2.6;
  pad(f, -W / 2 - 0.4, -D / 2 - 0.3, W / 2 + 0.6, D / 2 + 1.0);
  plinth(g, W, D, J.stoneDD, 0.22);
  // cream plaster body, the brick front with courses and quoins
  g.box(0, (0.22 + H) / 2, -1.7, W - 0.1, H - 0.22, D - 3.4, J.cream); // the back of the shed
  for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.15), (0.22 + H) / 2, fz - 1.77, 0.2, H - 0.22, 3.26, J.cream);
  g.box(0, H - 0.15, fz - 1.77, W - 0.4, 0.3, 3.3, J.insideD); // the ceiling
  g.box(0, 0.24, fz - 1.77, W - 0.4, 0.04, 3.3, J.inside);
  g.box(0, (0.22 + H) / 2, fz - 3.38, W - 0.4, H - 0.3, 0.04, J.inside);
  for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.26), 1.6, fz - 1.77, 0.02, 2.6, 3.26, J.insideD);
  const courses = Math.round((H - 0.22) / 0.26);
  for (let k = 0; k < courses; k++) {
    const y = 0.22 + (k + 0.5) * ((H - 0.22) / courses);
    for (const sx of [-1, 1]) { // brick piers either side of the door opening
      const x0 = sx < 0 ? -W / 2 : OW / 2, x1 = sx < 0 ? -OW / 2 : W / 2;
      g.box((x0 + x1) / 2, y, fz - 0.05, x1 - x0, (H - 0.22) / courses - 0.004, 0.18, jitter(J.brick, 0.07, k * 3 + sx));
      for (let x = x0 + ((k % 2) ? 0.15 : 0.35); x < x1 - 0.1; x += 0.46) face(f, x, y, fz + 0.045, 0.025, (H - 0.22) / courses - 0.05, J.mortar);
    }
    face(f, 0, 0.22 + k * ((H - 0.22) / courses), fz + 0.046, W, 0.025, J.mortar);
    if (y > OH + 0.25) g.box(0, y, fz - 0.05, OW + 0.02, (H - 0.22) / courses - 0.004, 0.18, jitter(J.brick, 0.07, k * 5 + 9));
  }
  for (const sx of [-1, 1]) for (let k = 0; k < 7; k++) g.box(sx * (W / 2 + 0.02), 0.45 + k * 0.52, fz - 0.15 - (k % 2) * 0.12, 0.08, 0.24, 0.34 + (k % 2) * 0.24, J.brickL);
  // the ink-black door frame and the plank doors propped open (swung out to the sides)
  g.box(0, OH / 2 + 0.22, fz + 0.06, OW + 0.36, 0.2, 0.2, J.ink);
  g.box(0, OH + 0.32, fz + 0.06, OW + 0.5, 0.22, 0.24, J.ink);
  for (const sx of [-1, 1]) g.box(sx * (OW / 2 + 0.09), OH / 2 + 0.22, fz + 0.06, 0.18, OH, 0.24, J.ink);
  for (const sx of [-1, 1]) {
    const hx = sx * (OW / 2 + 0.05);
    g.boxR(hx + sx * 0.12, OH / 2 + 0.24, fz + 0.62, 0.08, OH - 0.08, 1.25, J.woodG, 0, sx * 0.15, 0);
    for (let k = 0; k < 5; k++) f.boxR(hx + sx * (0.18 + 0.02 * k), OH / 2 + 0.24, fz + 0.15 + k * 0.24, 0.01, OH - 0.2, 0.015, J.woodGD, 0, sx * 0.15, 0);
    g.boxR(hx + sx * 0.12, 0.7, fz + 1.02, 0.12, 0.08, 0.5, J.ink, 0, sx * 0.15, 0); // iron straps
    g.boxR(hx + sx * 0.12, OH - 0.2, fz + 1.02, 0.12, 0.08, 0.5, J.ink, 0, sx * 0.15, 0);
    g.box(hx + sx * 0.32, 0.2, fz + 1.75, 0.25, 0.25, 0.25, J.stoneDD); // a stone holding it open
  }
  // inside (seen through the doors): the hand press's dark frame, sheets on a line, type cases on the back
  g.box(0.5, 1.0, fz - 1.8, 1.1, 1.4, 0.9, J.ink);
  g.box(0.5, 2.0, fz - 1.8, 0.24, 0.8, 0.24, J.inkL);
  g.box(0.5, 2.45, fz - 1.8, 0.9, 0.12, 0.3, J.inkL);
  g.box(0, 2.45, fz - 2.6, OW - 0.2, 0.02, 0.02, J.ink);
  for (let k = 0; k < 5; k++) g.box(-1.0 + k * 0.5, 2.18, fz - 2.6, 0.34, 0.5, 0.02, k % 2 ? J.newsL : J.white);
  for (let k = 0; k < 3; k++) g.box(-0.8, 0.7 + k * 0.35, fz - 3.2, 1.0, 0.28, 0.4, J.woodD);
  // windows: small panes, ink frames
  for (const sx of [-1, 1]) {
    const x = sx * (W / 2 - 1.15);
    g.box(x, 1.75, fz + 0.06, 1.2, 1.25, 0.08, J.ink);
    g.box(x, 1.75, fz + 0.08, 1.04, 1.1, 0.06, J.glass);
    for (const ox of [-0.26, 0.26]) face(f, x + ox, 1.75, fz + 0.12, 0.03, 1.1, J.ink);
    for (const oy of [-0.27, 0.0, 0.27]) face(f, x, 1.75 + oy, fz + 0.12, 1.04, 0.03, J.ink);
    g.box(x, 1.12, fz + 0.15, 1.36, 0.08, 0.22, J.stone);
    g.box(x + sx * 0.18, 1.6, fz - 0.02, 0.5, 0.6, 0.04, J.newsL); // a proof sheet pinned up inside
  }
  // the sign: black board with gold letters, across the top of the brick front
  g.box(0, H - 0.45, fz + 0.12, 4.6, 0.72, 0.1, J.ink);
  g.box(0, H - 0.45, fz + 0.15, 4.7, 0.06, 0.04, J.gold);
  ctx.signs.push({ x: 0, y: H - 0.45, z: fz + 0.19, w: 4.4, h: 0.6, lines: [{ text: 'ရွှေမင် ပုံနှိပ်တိုက်', size: 52, color: '#E3B23A' }], bg: '#2E2A26', border: '#A47A2C', width: 512, height: 72 });
  // the west side door to the back yard (local z -1.8), a step, a lamp bracket
  const sx = -W / 2 - 0.02;
  g.box(sx, 1.15, -1.8, 0.08, 2.0, 1.0, J.ink);
  g.box(sx - 0.03, 1.1, -1.8, 0.06, 1.9, 0.84, J.woodG);
  for (let k = 1; k < 4; k++) f.box(sx - 0.07, 1.1, -1.8 - 0.42 + k * 0.21, 0.01, 1.84, 0.02, J.woodGD);
  g.box(sx - 0.07, 1.1, -1.48, 0.04, 0.06, 0.06, J.brass);
  g.box(sx - 0.25, 0.08, -1.8, 0.5, 0.16, 1.1, J.stoneD);
  // paper bales and a crate of empty ink jars by the east pier
  for (let k = 0; k < 3; k++) { g.box(W / 2 - 0.65, 0.42 + k * 0.42, fz + 0.55 - (k % 2) * 0.05, 0.85, 0.4, 0.6, k % 2 ? J.newsL : J.news); g.box(W / 2 - 0.65, 0.42 + k * 0.42, fz + 0.86, 0.06, 0.41, 0.02, J.rope); }
  g.box(W / 2 - 1.6, 0.42, fz + 0.6, 0.7, 0.4, 0.5, J.woodL);
  for (let k = 0; k < 6; k++) g.box(W / 2 - 1.85 + (k % 3) * 0.25, 0.7, fz + 0.48 + Math.floor(k / 3) * 0.24, 0.14, 0.18, 0.14, J.ink);
  // roof: maroon tiles with a few moss-green patches; the brick chimney with grey smoke
  slateRoof(g, f, W, D, H, 1.6, J.maroon, { seed: 91, endCol: J.cream, cap: J.ink, rows: 6 });
  g.box(-W / 2 + 1.5, H + 1.8, -1.6, 0.8, 2.4, 0.8, J.brick);
  for (let k = 0; k < 5; k++) f.box(-W / 2 + 1.5, H + 0.9 + k * 0.42, -1.19, 0.8, 0.025, 0.01, J.mortar);
  g.box(-W / 2 + 1.5, H + 3.05, -1.6, 0.96, 0.14, 0.96, J.ink);
  smoke(g, ctx, -W / 2 + 1.5, H + 3.2, -1.6);
}

/** The Junction's notice board (north edge of the square): 3.2 x 1.9 on two posts under a little shingle
 * cap; the handbill «ရွှေမင်တွင်း ခန်းတော့မယ်», the day sheet, slips in many hands, a clear space. */
function jNotice(g, f, it, ctx) {
  if (LIVE.has(it.live)) return;
  const BW = 3.2, B0 = 0.62, B1 = 2.52;
  pad(f, -1.9, -0.5, 1.9, 0.7);
  for (const sx of [-1, 1]) { g.box(sx * (BW / 2 + 0.08), 1.4, 0, 0.16, 2.8, 0.16, J.woodD); g.box(sx * (BW / 2 + 0.08), 0.08, 0, 0.32, 0.16, 0.32, J.stoneD); }
  g.box(0, (B0 + B1) / 2, -0.02, BW, B1 - B0, 0.08, J.woodL);
  g.box(0, (B0 + B1) / 2, 0.025, BW - 0.14, B1 - B0 - 0.14, 0.02, '#CDBF9C');
  for (const y of [B0, B1]) g.box(0, y, 0.03, BW + 0.04, 0.08, 0.1, J.woodD);
  // the cap: two little slabs of shingles
  g.boxR(0, B1 + 0.36, -0.18, BW + 0.6, 0.06, 0.55, J.slateD, 0.55, 0, 0);
  g.boxR(0, B1 + 0.36, 0.18, BW + 0.6, 0.06, 0.55, J.slate, -0.55, 0, 0);
  // the handbill (top left, red band) as a sign; the day sheet (middle) with print; the slips
  g.box(-0.95, 1.95, 0.045, 1.0, 0.8, 0.012, J.white);
  ctx.signs.push({ x: -0.95, y: 1.95, z: 0.06, w: 0.96, h: 0.76, lines: [{ text: 'ရွှေမင်တွင်း', size: 64, color: '#B8323A' }, { text: 'ခန်းတော့မယ်', size: 64, color: '#2E2A26' }], bg: '#FFFDF8', border: '#B8323A', width: 320, height: 256 });
  g.box(0.25, 1.62, 0.045, 0.8, 1.05, 0.012, J.newsL);
  printFace(f, -0.1, 0.6, 1.15, 2.08, 0.05, 101, { col: 0.33, lh: 0.07, color: J.printD });
  const r = rng(7);
  const cols = [J.white, '#FCE6C4', '#F6F0E2', '#E8C6C6', '#D7E6EE', '#E9F0D8'];
  for (let k = 0; k < 20; k++) {
    const x = 0.85 + (k % 4) * 0.19 + (r() - 0.5) * 0.04 - (k > 15 ? 2.4 + (k - 16) * 0.25 : 0), y = k > 15 ? 0.95 : 0.95 + Math.floor(k / 4) * 0.33 + (r() - 0.5) * 0.04;
    g.boxR(x, y, 0.045, 0.17, 0.26, 0.012, cols[k % cols.length], 0, 0, (r() - 0.5) * 0.25);
    face(f, x, y + 0.04, 0.055, 0.12, 0.02, J.printD); face(f, x - 0.01, y - 0.02, 0.055, 0.1, 0.02, J.printD);
    g.box(x, y + 0.11, 0.058, 0.03, 0.03, 0.01, [J.red, J.gold, J.blue][k % 3]);
  }
}

/** Nay Chi's bridge board (west bridgehead, north of the bridge mouth): ten slate frames (empty iron hooks
 * with painted numbers), two key hooks under the tenth, the heading board, a small lamp on top. Live twin:
 * props4 bridgeBoard. */
function jBoard(g, f, it, ctx) {
  if (LIVE.has(it.live)) return;
  const BW = 2.4, B0 = 0.5, B1 = 3.1;
  pad(f, -1.5, -0.5, 1.5, 0.7);
  for (const sx of [-1, 1]) { g.box(sx * (BW / 2 + 0.1), 1.85, 0, 0.18, 3.7, 0.18, J.ink); g.box(sx * (BW / 2 + 0.1), 0.1, 0, 0.36, 0.2, 0.36, J.stoneD); }
  g.box(0, (B0 + B1) / 2, -0.03, BW, B1 - B0, 0.08, J.newsD);
  g.box(0, (B0 + B1) / 2, 0.02, BW - 0.12, B1 - B0 - 0.12, 0.02, J.news);
  printFace(f, -BW / 2 + 0.15, BW / 2 - 0.15, B0 + 0.1, B1 - 0.1, 0.03, 111, { lh: 0.2, color: J.printL, col: 0.6 });
  for (let c = 0; c < 2; c++) for (let k = 0; k < 5; k++) {
    const x = c ? 0.58 : -0.58, y = B1 - 0.36 - k * 0.5;
    // the faint outline of where a slate hangs, a hook, and its painted number (a gold dot per ten)
    for (const [bx, by, bw, bh] of [[0, 0.2, 0.9, 0.03], [0, -0.2, 0.9, 0.03], [-0.45, 0, 0.03, 0.42], [0.45, 0, 0.03, 0.42]]) face(f, x + bx, y + by, 0.04, bw, bh, J.printD);
    g.box(x, y + 0.28, 0.07, 0.05, 0.12, 0.06, J.ink);
    g.box(x, y + 0.22, 0.1, 0.05, 0.04, 0.06, J.ink);
    g.box(x - 0.56, y + 0.18, 0.05, 0.12, 0.12, 0.02, c ? J.red : J.ink);
  }
  // two key hooks under the tenth frame (bottom right)
  for (const kx of [0.35, 0.8]) { g.box(kx, B0 + 0.2, 0.08, 0.04, 0.1, 0.06, J.brass); g.box(kx, B0 + 0.14, 0.11, 0.04, 0.03, 0.06, J.brass); }
  // the heading board and its lamp
  g.box(0, B1 + 0.36, 0.0, BW + 0.3, 0.56, 0.1, J.ink);
  ctx.signs.push({ x: 0, y: B1 + 0.36, z: 0.07, w: BW + 0.15, h: 0.46, lines: [{ text: 'ဖြတ်ကူးမယ့်သူတိုင်းအတွက်', size: 34, color: '#2E2A26' }, { text: 'သင်ခန်းစာတို ဆယ်ခု', size: 34, color: '#8E2730' }], bg: '#F1EDE3', border: null, width: 448, height: 96 });
  g.box(0, B1 + 0.8, 0.0, 0.08, 0.3, 0.08, J.ink);
  g.box(0, B1 + 1.0, 0.06, 0.22, 0.24, 0.22, J.ink);
  g.box(0, B1 + 1.0, 0.06, 0.16, 0.18, 0.24, '#FFE7A8');
  g.box(0, B1 + 1.15, 0.06, 0.3, 0.05, 0.3, J.ink);
}

// ---------------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------------

/** The gold-ink well, centre of the square, on the fold line: a low round stone curb (knee height), gold ink
 * standing at the third of five ring marks, a deep old mark lower down, children's empty ink pots and a
 * ladle on the curb, pigeons, a ring of paving. Live twin: props4 goldInkWell. Ø 2.0. */
function jWell(g, f, it) {
  const RO = 1.0, RI = 0.72, TOP = 0.55, N = 12, Rm = (RO + RI) / 2;
  // the paving ring (ground): twelve wedges of stone round it, a darker joint between
  for (let i = 0; i < 16; i++) { const a = (i * TAU) / 16; f.flatR(Math.sin(a) * 1.45, Math.cos(a) * 1.45, 0.6, 0.5, 0.009, i % 2 ? J.stone : J.stoneL, a); }
  f.flatR(0, 0, 3.4, 3.4, 0.0085, J.stoneD, Math.PI / 8);
  if (LIVE.has(it.live)) return;
  // the curb: twelve blocks with cap stones
  for (let i = 0; i < N; i++) {
    const a = (i * TAU) / N, x = Math.sin(a) * Rm, z = Math.cos(a) * Rm;
    g.box(x, TOP / 2 - 0.02, z, 0.42, TOP - 0.04, RO - RI, jitter(J.stone, 0.05, i), a);
    g.box(x * 1.02, TOP + 0.02, z * 1.02, 0.46, 0.08, RO - RI + 0.08, i % 3 ? J.stoneL : jitter(J.stoneL, 0.06, i + 5), a);
  }
  // the shaft: dark walls, ring marks cut in them (five, at the curb's inner face), the gold ink at the third
  oct(g, 0, -0.2, 0, RI * 2 - 0.06, 0.6, J.stoneDD);
  for (let k = 0; k < 5; k++) for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8 + 0.2, y = 0.5 - k * 0.09;
    f.box(Math.sin(a) * (RI - 0.03), y, Math.cos(a) * (RI - 0.03), 0.4, 0.018, 0.012, k === 2 ? J.inkGoldD : J.stoneDD, a);
  }
  oct(g, 0, 0.31, 0, RI * 2 - 0.1, 0.04, J.inkGold);
  g.box(-0.18, 0.335, 0.12, 0.34, 0.01, 0.18, J.inkGoldL, 0.4);
  g.box(0.24, 0.335, -0.2, 0.2, 0.01, 0.12, J.inkGoldL, -0.3);
  g.box(0.05, 0.335, 0.3, 0.1, 0.01, 0.1, J.white);
  // the children's empty ink pots on the curb (the south side, facing the camera), the ladle
  for (const a of [-0.55, -0.25, 0.1, 0.42]) { const x = Math.sin(a) * Rm, z = Math.cos(a) * Rm; g.box(x, TOP + 0.13, z, 0.12, 0.14, 0.12, J.ink); g.box(x, TOP + 0.21, z, 0.07, 0.03, 0.07, J.inkL); }
  g.boxR(Math.sin(2.2) * Rm, TOP + 0.1, Math.cos(2.2) * Rm, 0.05, 0.05, 0.62, J.woodD, 0, 2.2 + 0.4, 0.12);
  g.box(Math.sin(2.2) * Rm + 0.2, TOP + 0.12, Math.cos(2.2) * Rm + 0.2, 0.18, 0.1, 0.18, J.tin);
  // two pigeons on the curb (the old saying: the pigeons are here)
  pigeon(g, Math.sin(3.5) * Rm, TOP + 0.06, Math.cos(3.5) * Rm, 3.5 + 1.2);
  pigeon(g, Math.sin(4.1) * Rm, TOP + 0.06, Math.cos(4.1) * Rm, 4.1 - 1.4, J.pigeonL);
}
function pigeon(g, x, y, z, ry, body = J.pigeon) {
  const fx = Math.sin(ry), fz = Math.cos(ry);
  g.box(x, y + 0.09, z, 0.12, 0.1, 0.2, body, ry);
  g.box(x + fx * 0.11, y + 0.17, z + fz * 0.11, 0.08, 0.08, 0.08, J.pigeonD, ry);
  g.box(x + fx * 0.09, y + 0.13, z + fz * 0.09, 0.09, 0.04, 0.05, J.neck, ry);
  g.box(x + fx * 0.16, y + 0.165, z + fz * 0.16, 0.03, 0.02, 0.04, J.terra, ry);
  g.box(x - fx * 0.13, y + 0.1, z - fz * 0.13, 0.08, 0.03, 0.1, J.pigeonD, ry);
  g.box(x, y + 0.02, z, 0.02, 0.04, 0.02, J.terra);
}
/** A few pigeons pecking about. */
function jPigeons(g, f, it) {
  const r = rng(it.seed || 5), n = it.n || 4;
  for (let k = 0; k < n; k++) pigeon(g, (r() - 0.5) * 2.2, 0, (r() - 0.5) * 1.4, r() * TAU, r() < 0.3 ? J.pigeonL : J.pigeon);
  for (let k = 0; k < 10; k++) f.flatR((r() - 0.5) * 2, (r() - 0.5) * 1.2, 0.05, 0.05, 0.01, J.mustard);
}

/** The red bridge-box at the east bridge foot: a pillar post box with a domed cap, a slot and an enamel
 * plate «စာထုတ်ချိန် မနက် 6:00». Live twin: props4 bridgeBox. */
function jBox(g, f, it, ctx) {
  if (LIVE.has(it.live)) return;
  pad(f, -0.45, -0.4, 0.5, 0.5);
  g.box(0, 0.08, 0, 0.6, 0.16, 0.6, J.stoneD);
  oct(g, 0, 0.7, 0, 0.5, 1.05, J.red);
  oct(g, 0, 1.27, 0, 0.58, 0.1, J.redD);
  oct(g, 0, 1.38, 0, 0.44, 0.14, J.red);
  oct(g, 0, 1.48, 0, 0.26, 0.08, J.redD);
  g.box(0, 1.05, 0.22, 0.28, 0.04, 0.04, J.ink); // slot
  g.box(0, 1.1, 0.215, 0.32, 0.03, 0.03, J.redD);
  g.box(0, 0.78, 0.215, 0.28, 0.2, 0.02, J.white);
  g.box(0, 0.78, 0.225, 0.24, 0.16, 0.01, J.blueD);
  ctx.signs.push({ x: 0, y: 0.78, z: 0.235, w: 0.24, h: 0.16, lines: [{ text: 'မနက် 6:00', size: 52, color: '#FFFDF8' }], bg: '#2E5578', border: null, width: 256, height: 160 });
  g.box(0, 0.45, 0.215, 0.12, 0.06, 0.02, J.brass);
}

/** Daw Sein's tea cart, parked by her door: maroon panels on two spoked wheels, shafts on a prop leg, a
 * brazier with a kettle, a tray of glasses, four ink jars hung on its rail. Live twin: props4 teaCart. */
function jCart(g, f, it, ctx) {
  if (LIVE.has(it.live)) return;
  pad(f, -1.1, -0.7, 1.2, 0.8);
  const Y = 0.72;
  g.box(0, Y, 0, 1.2, 0.08, 0.6, J.woodL);
  g.box(0, Y - 0.25, 0.3, 1.2, 0.45, 0.05, J.maroon);
  g.box(0, Y - 0.25, -0.3, 1.2, 0.45, 0.05, J.maroon);
  for (const sx of [-1, 1]) g.box(sx * 0.6, Y - 0.25, 0, 0.05, 0.45, 0.6, J.maroonD);
  f.box(0, Y - 0.25, 0.33, 0.9, 0.04, 0.01, J.gold);
  for (const sz of [-1, 1]) { // spoked wheels
    oct(g, 0.1, 0.38, sz * 0.4, 0.74, 0.06, J.woodD, 0.06);
    g.box(0.1, 0.38, sz * 0.42, 0.62, 0.05, 0.04, J.woodG); g.box(0.1, 0.38, sz * 0.42, 0.05, 0.62, 0.04, J.woodG);
    g.box(0.1, 0.38, sz * 0.43, 0.1, 0.1, 0.06, J.ink);
  }
  for (const sz of [-0.22, 0.22]) g.boxR(-1.0, 0.55, sz, 0.9, 0.05, 0.05, J.woodD, 0, 0, -0.22);
  g.box(-1.35, 0.22, 0, 0.05, 0.44, 0.05, J.woodD);
  // brazier and kettle, the tray of glasses, a stack of cups
  g.box(0.35, Y + 0.15, 0, 0.36, 0.22, 0.36, J.ink);
  g.box(0.35, Y + 0.27, 0, 0.26, 0.04, 0.26, '#E8743A');
  oct(g, 0.35, Y + 0.42, 0, 0.26, 0.24, J.tinL);
  g.box(0.5, Y + 0.48, 0, 0.18, 0.04, 0.04, J.tinL);
  smoke(g, ctx, 0.35, Y + 0.65, 0);
  g.box(-0.25, Y + 0.06, 0, 0.5, 0.04, 0.4, J.tinD);
  for (let k = 0; k < 6; k++) g.box(-0.42 + (k % 3) * 0.17, Y + 0.14, -0.1 + Math.floor(k / 3) * 0.2, 0.08, 0.12, 0.08, J.glass);
  // the rail along the front, four heavy ink jars hung on it
  g.box(0, Y + 0.32, 0.36, 1.25, 0.04, 0.04, J.brass);
  for (const sx of [-0.6, 0.6]) g.box(sx, Y + 0.16, 0.36, 0.04, 0.32, 0.04, J.brass);
  for (let k = 0; k < 4; k++) { const x = -0.42 + k * 0.28; g.box(x, Y + 0.2, 0.38, 0.02, 0.2, 0.02, J.rope); g.box(x, Y - 0.02, 0.4, 0.2, 0.24, 0.2, J.ink); g.box(x, Y + 0.11, 0.4, 0.14, 0.04, 0.14, J.inkGoldD); }
}

/** Ko Min's low step ladder (on the pavement before his sign), a jar of ink on its top step. Live twin:
 * props4 stepLadder. */
function jLadder(g, f, it) {
  if (LIVE.has(it.live)) return;
  pad(f, -0.5, -0.5, 0.5, 0.6);
  for (const sx of [-0.28, 0.28]) { g.boxR(sx, 0.85, 0.12, 0.06, 1.75, 0.06, J.woodL, 0.18, 0, 0); g.boxR(sx, 0.85, -0.22, 0.05, 1.75, 0.05, J.woodD, -0.18, 0, 0); }
  for (let k = 0; k < 4; k++) g.box(0, 0.35 + k * 0.4, 0.16 - k * 0.06, 0.58, 0.05, 0.16, J.woodL);
  g.box(0, 1.72, -0.05, 0.62, 0.07, 0.36, J.woodG);
  g.box(0.12, 1.84, -0.05, 0.14, 0.18, 0.14, J.ink); g.box(0.12, 1.94, -0.05, 0.1, 0.03, 0.1, J.inkGold);
  g.boxR(-0.12, 1.8, -0.05, 0.03, 0.03, 0.34, J.woodL, 0, 0.6, 0);
}

/** The chalk slate on its little easel left of the press door. Live twin: props4 doorEasel. */
function jEasel(g, f, it) {
  if (LIVE.has(it.live)) return;
  for (const sx of [-0.25, 0.25]) g.boxR(sx, 0.6, 0.05, 0.05, 1.2, 0.05, J.woodD, -0.12, 0, sx * 0.25);
  g.boxR(0, 0.55, -0.22, 0.04, 1.1, 0.04, J.woodD, 0.35, 0, 0);
  g.box(0, 0.42, 0.1, 0.6, 0.04, 0.08, J.woodD);
  g.boxR(0, 0.78, 0.08, 0.62, 0.48, 0.04, J.woodL, -0.12, 0, 0);
  g.boxR(0, 0.78, 0.1, 0.54, 0.4, 0.02, J.chalk, -0.12, 0, 0);
  for (let k = 0; k < 4; k++) f.boxR(-0.05 + (k % 2) * 0.04, 0.9 - k * 0.08, 0.125 + k * 0.01, 0.38 - (k % 3) * 0.08, 0.025, 0.006, J.white, -0.12, 0, 0);
}

/** The middle pier with the boom's winch (in the fold, halfway across; top at y = 0): courses of stone-paper
 * blocks down into the clouds, a plank top, two posts for the footbridge's ropes, the winch. Live twin:
 * props4 middlePier. */
function jPier(g, f, it) {
  if (LIVE.has(it.live)) return;
  for (let k = 0; k < 9; k++) {
    const y = -0.4 - k * 0.72, s = 2.0 + k * 0.06;
    g.box(0, y, 0, s, 0.7, s, jitter(k % 2 ? J.stone : J.stoneL, 0.04, k));
    g.box(0, y + 0.36, 0, s + 0.04, 0.03, s + 0.04, J.stoneDD);
  }
  g.box(0, -7.0, 0, 3.6, 0.9, 3.0, J.cloud);
  g.box(0.6, -6.6, 0.4, 2.0, 0.6, 1.8, J.cloudMid);
  g.box(0, -0.04, 0, 2.1, 0.1, 2.1, J.woodG);
  for (let k = 0; k < 5; k++) f.box(-0.8 + k * 0.4, 0.02, 0, 0.02, 0.01, 2.0, J.woodGD);
  for (const sz of [-0.5, 0.5]) { g.box(-0.85, 0.65, sz, 0.14, 1.3, 0.14, J.woodD); g.box(-0.85, 1.32, sz, 0.2, 0.06, 0.2, J.ink); }
  // the winch: two cheeks, a drum with rope wound on, a crank (slate 6 hangs there on Day 7)
  for (const sz of [-0.35, 0.35]) g.box(0.4, 0.5, sz, 0.5, 0.9, 0.08, J.ink);
  oct(g, 0.4, 0.75, 0, 0.42, 0.62, J.woodL, 0.42);
  g.boxR(0.4, 0.75, 0, 0.44, 0.42, 0.62, J.rope, Math.PI / 2, 0, 0);
  g.box(0.4, 0.75, 0.45, 0.08, 0.08, 0.2, J.ink);
  g.box(0.4, 0.55, 0.55, 0.07, 0.45, 0.07, J.inkL);
  g.box(0.4, 0.34, 0.62, 0.07, 0.07, 0.2, J.woodL);
}

/** The old rope footbridge: from its two west posts on the lip (origin) along +X `len` metres to the middle
 * pier; a plank deck 1 m wide sagging in the middle, rope rails on hangers; one pale new plank. Live twin:
 * props4 ropeFootbridge. */
function jRope(g, f, it) {
  if (LIVE.has(it.live)) return;
  const L = it.len || 20, sag = it.sag || 0.9;
  const dy = (x) => -sag * Math.sin((Math.PI * x) / L);
  for (const sz of [-0.55, 0.55]) { g.box(0.1, 0.6, sz, 0.16, 1.4, 0.16, J.woodD); g.box(0.1, 1.33, sz, 0.22, 0.08, 0.22, J.ink); }
  const step = 0.32;
  for (let x = 0.35, k = 0; x < L - 0.2; x += step, k++) {
    const y = dy(x) - 0.03;
    g.box(x, y, 0, 0.24, 0.05, 1.0, k === 23 ? J.newsL : jitter(J.woodG, 0.08, k));
  }
  // rope rails (two each side: hand rope and toe rope), hangers between them
  for (const sz of [-0.5, 0.5]) for (let x = 0.2, k = 0; x < L - 0.2; x += 0.8, k++) {
    const x1 = Math.min(L, x + 0.8), ya = dy(x), yb = dy(x1), ang = Math.atan2(yb - ya, x1 - x);
    g.boxR((x + x1) / 2, (ya + yb) / 2 + 0.95, sz, 0.82, 0.04, 0.04, J.rope, 0, 0, ang);
    f.boxR((x + x1) / 2, (ya + yb) / 2 + 0.05, sz, 0.82, 0.03, 0.03, J.ropeD, 0, 0, ang);
    if (k % 2 === 0) g.box(x, ya + 0.5, sz, 0.02, 0.9, 0.02, J.ropeD);
  }
}

/** Newsprint paving (a square's floor): big slabs printed with old pages, joints, a fold crease through it
 * (it.fold: local x of the crease), a few headline slabs. Ground only. w x d. */
function jPaving(g, f, it) {
  const W = it.w, D = it.d, S = it.slab || 1.5, r = rng(it.seed || 9);
  const y = 0.009;
  f.flat(-W / 2, -D / 2, W / 2, D / 2, y - 0.002, J.newsDD);
  for (let z = -D / 2; z < D / 2 - 0.05; z += S) for (let x = -W / 2 + ((Math.round((z + D) / S) % 2) ? S / 2 : 0); x < W / 2 - 0.05; x += S) {
    const x0 = Math.max(-W / 2, x) + 0.04, x1 = Math.min(W / 2, x + S) - 0.04, z0 = z + 0.04, z1 = Math.min(D / 2, z + S) - 0.04;
    if (x1 - x0 < 0.2) continue;
    const t = r();
    f.flat(x0, z0, x1, z1, y, t < 0.33 ? J.news : t < 0.66 ? J.newsL : '#E9E4D8');
    if (t > 0.86) { // a slab with a headline across it
      f.flat(x0 + 0.12, z0 + 0.15, x1 - 0.12, z0 + 0.38, y + 0.001, J.print);
      for (let k = 0; k < 3; k++) f.flat(x0 + 0.12, z0 + 0.6 + k * 0.22, x0 + 0.12 + (x1 - x0 - 0.24) * (0.5 + r() * 0.5), z0 + 0.66 + k * 0.22, y + 0.001, J.printL);
    } else if (t < 0.18) for (let k = 0; k < 4; k++) f.flat(x0 + 0.15, z0 + 0.2 + k * 0.28, x1 - 0.15 - r() * 0.4, z0 + 0.26 + k * 0.28, y + 0.001, J.printL);
  }
  if (it.fold !== undefined) { // the fold line, like the crease down a newspaper
    const fx = it.fold;
    f.flat(fx - 0.5, -D / 2, fx + 0.5, D / 2, y + 0.002, '#E8E3D7');
    f.flat(fx - 0.06, -D / 2, fx + 0.02, D / 2, y + 0.003, J.newsDD);
    f.flat(fx + 0.02, -D / 2, fx + 0.1, D / 2, y + 0.003, J.white);
  }
  // a kerb of darker stones round the edge
  for (const [x0, z0, x1, z1] of [[-W / 2, -D / 2, W / 2, -D / 2 + 0.22], [-W / 2, D / 2 - 0.22, W / 2, D / 2], [-W / 2, -D / 2, -W / 2 + 0.22, D / 2], [W / 2 - 0.22, -D / 2, W / 2, D / 2]]) if (!it.open?.includes?.(x0 === -W / 2 && x1 === W / 2 ? (z0 < 0 ? 'n' : 's') : x0 < 0 ? 'w' : 'e')) f.flat(x0, z0, x1, z1, y + 0.002, J.stoneD);
}

/** A low fold-lip rail: short posts and a rope along the edge where the paper folds down into the clouds
 * (len along local X). */
function jLip(g, f, it) {
  const L = it.len || 8, n = Math.max(2, Math.round(L / 1.6));
  for (let i = 0; i <= n; i++) {
    const x = -L / 2 + (L * i) / n;
    g.box(x, 0.35, 0, 0.14, 0.7, 0.14, i % 2 ? J.newsD : J.ink);
    g.box(x, 0.72, 0, 0.2, 0.06, 0.2, J.ink);
  }
  for (let i = 0; i < n; i++) {
    const xa = -L / 2 + (L * i) / n, xb = -L / 2 + (L * (i + 1)) / n;
    g.box((xa + xb) / 2, 0.6, 0, xb - xa, 0.035, 0.035, J.rope);
    g.box((xa + xb) / 2, 0.53, 0, (xb - xa) * 0.4, 0.035, 0.035, J.rope);
  }
}

/** Bundles of yesterday's papers, tied with twine, stacked (n stacks). */
function jBundles(g, f, it) {
  const r = rng(it.seed || 2), n = it.n || 3;
  pad(f, -0.9, -0.6, 0.9, 0.7);
  for (let s = 0; s < n; s++) {
    const bx = -0.55 + s * 0.55, h = 1 + Math.floor(r() * 3);
    for (let k = 0; k < h; k++) {
      const y = 0.15 + k * 0.29, ry = (r() - 0.5) * 0.3;
      g.box(bx, y, 0, 0.5, 0.28, 0.38, k % 2 ? J.newsL : J.news, ry);
      f.box(bx, y, 0.195, 0.44, 0.02, 0.01, J.print, ry);
      g.box(bx, y, 0, 0.03, 0.29, 0.4, J.rope, ry);
      g.box(bx, y + 0.145, 0, 0.51, 0.01, 0.03, J.rope, ry);
    }
  }
}

/** A drying line of printed sheets between two posts (len): today's pages hung to dry, one red headline. */
function jSheets(g, f, it) {
  const L = it.len || 3.6, r = rng(it.seed || 4);
  for (const sx of [-1, 1]) { g.box(sx * L / 2, 1.0, 0, 0.09, 2.0, 0.09, J.woodD); g.box(sx * L / 2, 1.95, 0, 0.3, 0.06, 0.06, J.woodD); }
  g.box(0, 1.9, 0, L, 0.025, 0.025, J.ink);
  for (let x = -L / 2 + 0.3, k = 0; x < L / 2 - 0.45; x += 0.62, k++) {
    const h = 0.6 + r() * 0.15, sway = (r() - 0.5) * 0.12;
    g.boxR(x + 0.25, 1.88 - h / 2, 0, 0.5, h, 0.02, k % 2 ? J.newsL : J.white, sway, 0, 0);
    f.boxR(x + 0.25, 1.82 - 0.04, 0.014, 0.42, 0.06, 0.004, (k + (it.seed || 0)) % 4 === 1 ? J.red : J.printD, sway, 0, 0);
    for (let j = 0; j < 4; j++) f.boxR(x + 0.25, 1.68 - j * 0.11, 0.014, 0.42 - (j % 2) * 0.1, 0.03, 0.004, J.print, sway, 0, 0);
    g.box(x + 0.08, 1.9, 0.0, 0.03, 0.06, 0.04, J.woodL);
  }
}

/** The bridge-builders' timber: printed planks stacked on bearers, a saw horse, a cable drum, a rope coil. */
function jTimber(g, f, it) {
  const r = rng(it.seed || 8);
  pad(f, -1.8, -0.9, 1.9, 1.0);
  for (const x of [-1.1, 0, 1.1]) g.box(x, 0.08, 0, 0.16, 0.16, 1.4, J.woodD);
  for (let k = 0; k < 5; k++) for (let j = 0; j < 4 - (k > 2 ? 1 : 0); j++) {
    const z = -0.48 + j * 0.32, y = 0.22 + k * 0.12;
    g.box((r() - 0.5) * 0.12, y, z, 3.0, 0.1, 0.28, jitter(J.woodL, 0.06, k * 5 + j));
    if ((k + j) % 3 === 0) f.box(0.4, y + 0.052, z, 1.4, 0.004, 0.18, J.printL);
  }
  // saw horse with a half-cut plank
  for (const sx of [-0.4, 0.4]) { g.boxR(1.6 + sx * 0.2, 0.4, 0.75 + sx * 0.1, 0.06, 0.82, 0.06, J.woodD, 0, 0, 0.25); g.boxR(1.6 + sx * 0.2, 0.4, 1.0 + sx * 0.1, 0.06, 0.82, 0.06, J.woodD, 0, 0, -0.25); }
  g.box(1.6, 0.8, 0.87, 0.9, 0.06, 0.4, J.woodD);
  g.box(1.6, 0.88, 0.87, 1.4, 0.08, 0.26, J.woodL);
  // a cable drum lying on its side, a coil of rope on top of the stack
  oct(g, -1.5, 0.45, 1.0, 0.9, 0.5, J.woodG, 0.9);
  g.boxR(-1.5, 0.45, 1.0, 0.92, 0.3, 0.92, J.rope, Math.PI / 2, 0, 0);
  for (let k = 0; k < 6; k++) { const a = (k * TAU) / 6; g.box(0.6 + Math.sin(a) * 0.22, 0.86, Math.cos(a) * 0.22, 0.14, 0.1, 0.14, J.rope); }
}

/** Crates: stacked wooden crates of empty ink jars and type sorts. */
function jCrates(g, f, it) {
  const r = rng(it.seed || 6);
  pad(f, -0.8, -0.5, 0.9, 0.6);
  const spots = [[-0.4, 0, 0], [0.32, 0.05, 0], [-0.1, 0, 1]];
  for (const [x, z, lvl] of spots) {
    const y = 0.22 + lvl * 0.44, ry = (r() - 0.5) * 0.3;
    g.box(x, y, z, 0.62, 0.42, 0.46, J.woodL, ry);
    f.box(x, y, z + 0.235, 0.56, 0.04, 0.01, J.woodGD, ry);
    f.box(x, y + 0.12, z + 0.235, 0.56, 0.04, 0.01, J.woodGD, ry);
    if (lvl === 1 || r() < 0.5) for (let k = 0; k < 4; k++) g.box(x - 0.2 + (k % 2) * 0.4 * 0.6, y + 0.27, z - 0.08 + Math.floor(k / 2) * 0.16, 0.12, 0.14, 0.12, J.ink, ry);
  }
}

/** A street dog curled asleep on the warm paper. */
function jDog(g, f, it) {
  const c = it.color || '#C9A57A';
  pad(f, -0.5, -0.4, 0.5, 0.45);
  g.box(0, 0.14, 0, 0.62, 0.26, 0.4, c);
  g.box(0.32, 0.16, 0.14, 0.26, 0.22, 0.24, c);
  g.box(0.42, 0.12, 0.24, 0.1, 0.08, 0.12, shade(c, 0.8));
  g.box(0.3, 0.3, 0.06, 0.08, 0.1, 0.06, shade(c, 0.75)); g.box(0.36, 0.3, 0.2, 0.08, 0.1, 0.06, shade(c, 0.75));
  g.boxR(-0.28, 0.08, 0.22, 0.36, 0.08, 0.08, shade(c, 0.9), 0, 0.4, 0);
  g.box(0.44, 0.2, 0.18, 0.04, 0.02, 0.04, J.ink);
}

/** A hen run behind the press (w x d): a low wire run on posts, a little coop, hens; a closed newsprint wall
 * along its north side (the Painted Map's lane that isn't there). */
function jHenRun(g, f, it) {
  const W = it.w || 6, D = it.d || 4, r = rng(it.seed || 12);
  f.flat(-W / 2, -D / 2, W / 2, D / 2, 0.006, '#D9CDAE');
  for (let k = 0; k < 14; k++) f.flatR((r() - 0.5) * (W - 0.6), (r() - 0.5) * (D - 0.6), 0.06, 0.06, 0.008, J.mustard);
  for (let x = -W / 2; x <= W / 2 + 0.01; x += W / 4) for (const z of [-D / 2, D / 2]) g.box(x, 0.5, z, 0.08, 1.0, 0.08, J.woodD);
  for (const z of [-D / 2, D / 2]) for (let k = 0; k < 4; k++) g.box(0, 0.15 + k * 0.25, z, W, 0.015, 0.015, J.tinD);
  for (const x of [-W / 2, W / 2]) { g.box(x, 0.5, 0, 0.08, 1.0, 0.08, J.woodD); for (let k = 0; k < 4; k++) g.box(x, 0.15 + k * 0.25, 0, 0.015, 0.015, D, J.tinD); }
  // the coop
  g.box(-W / 2 + 0.9, 0.55, -D / 2 + 0.8, 1.2, 0.8, 0.9, J.woodG);
  g.boxR(-W / 2 + 0.9, 1.05, -D / 2 + 0.8, 1.4, 0.06, 1.1, J.tinD, 0.2, 0, 0);
  g.box(-W / 2 + 0.9, 0.4, -D / 2 + 1.26, 0.34, 0.36, 0.02, J.insideD);
  g.boxR(-W / 2 + 0.9, 0.18, -D / 2 + 1.5, 0.3, 0.04, 0.5, J.woodL, 0.5, 0, 0);
  for (let k = 0; k < 4; k++) {
    const x = (r() - 0.2) * (W - 2), z = (r() - 0.5) * (D - 1.2), c = k % 2 ? '#8E4A2C' : J.white, ry = r() * TAU;
    const fx = Math.sin(ry) * 0.16, fz = Math.cos(ry) * 0.16;
    g.box(x, 0.2, z, 0.26, 0.22, 0.26, c);
    g.box(x + fx, 0.34, z + fz, 0.13, 0.16, 0.13, c);
    g.box(x + fx * 1.5, 0.36, z + fz * 1.5, 0.05, 0.04, 0.05, J.mustard);
    g.box(x + fx, 0.45, z + fz, 0.04, 0.07, 0.09, J.red);
  }
  // the closed wall: tall folded newsprint sheets on battens
  const wz = -D / 2 - 0.5;
  for (let x = -W / 2 - 1, k = 0; x < W / 2 + 1; x += 0.9, k++) {
    g.box(x + 0.45, 1.1, wz, 0.9, 2.2, 0.12, jitter(J.news, 0.04, k));
    face(f, x + 0.45, 1.1, wz + 0.065, 0.02, 2.1, J.newsDD);
  }
  printFace(f, -W / 2 - 0.9, W / 2 + 0.9, 0.3, 2.0, wz + 0.06, 121, { col: 0.86, lh: 0.2 });
  g.box(0, 2.24, wz, W + 2.1, 0.08, 0.2, J.ink);
}

/** A banana plant (a big blocky clump of leaves on a green trunk): yards and corners. */
function jBanana(g, f, it) {
  const s = it.s || 1;
  pad(f, -0.6 * s, -0.5 * s, 0.7 * s, 0.6 * s);
  g.box(0, 0.75 * s, 0, 0.3 * s, 1.5 * s, 0.3 * s, J.greenL);
  g.box(0.25 * s, 0.4 * s, 0.1 * s, 0.2 * s, 0.8 * s, 0.2 * s, J.leaf);
  for (let k = 0; k < 6; k++) {
    const a = (k * TAU) / 6 + 0.3;
    g.boxR(Math.sin(a) * 0.45 * s, 1.75 * s, Math.cos(a) * 0.45 * s, 0.32 * s, 0.05 * s, 1.2 * s, k % 2 ? J.leaf : J.leafL, 0.55, a, 0);
  }
  g.box(0, 1.6 * s, 0, 0.18 * s, 0.32 * s, 0.18 * s, J.leafD);
}

/** A big glazed water jar for passers-by, under a little tin roof, a cup on a chain (the bridgehead's). */
function jWaterPot(g, f) {
  pad(f, -0.6, -0.5, 0.7, 0.6);
  g.box(0, 0.25, 0, 0.9, 0.5, 0.7, J.stoneD);
  oct(g, 0, 0.82, 0, 0.66, 0.66, J.terraD);
  oct(g, 0, 0.82, 0, 0.74, 0.3, J.terra);
  oct(g, 0, 1.2, 0, 0.42, 0.1, J.terraD);
  oct(g, 0, 1.27, 0, 0.5, 0.04, J.woodL);
  g.box(0.18, 1.33, 0.12, 0.12, 0.08, 0.12, J.tinL);
  for (const sx of [-0.45, 0.45]) g.box(sx, 1.0, -0.3, 0.06, 1.8, 0.06, J.woodD);
  g.boxR(0, 1.95, -0.05, 1.3, 0.05, 0.85, J.tin, 0.2, 0, 0);
  g.box(0, 1.6, -0.3, 0.9, 0.05, 0.05, J.woodD);
}

export const ART = {
  jHut: { draw: jHut, h: 4.6, map: true, obstacles: (it) => [rotBox(it, it.w || 6.2, it.d || 5)] },
  jHouse: { draw: jHouse, h: 6.6, map: true },
  jLetter: { draw: jLetter, h: 6.5, map: true },
  jCorner: { draw: jCorner, h: 6.8, map: true },
  jTea: { draw: jTea, h: 4.8, map: true, obstacles: (it) => [rotBox(it, it.w || 8, (it.d || 7) - 0.1, 0, -0.05), rotBox(it, 1.9, 0.9, -2.3, (it.d || 7) / 2 + 1.0), rotBox(it, 1.9, 0.9, 2.3, (it.d || 7) / 2 + 1.0)] },
  jSchool: { draw: jSchool, h: 4.8, map: true },
  jPress: { draw: jPress, h: 5.6, map: true, obstacles: (it) => [rotBox(it, it.w || 8.4, it.d || 8), rotBox(it, 0.35, 1.4, -1.55, (it.d || 8) / 2 + 0.65), rotBox(it, 0.35, 1.4, 1.55, (it.d || 8) / 2 + 0.65), rotBox(it, 1.0, 0.8, (it.w || 8.4) / 2 - 0.65, (it.d || 8) / 2 + 0.55)] },
  jNotice: { draw: jNotice, h: 3.0, obstacles: (it) => [circ(it, 0.2, -1.68, 0), circ(it, 0.2, 1.68, 0)] },
  jBoard: { draw: jBoard, h: 4.3, obstacles: (it) => [circ(it, 0.24, -1.3, 0), circ(it, 0.24, 1.3, 0), rotBox(it, 2.4, 0.3)] },
};
export const PROP = {
  jWell: { draw: jWell, r: 1.05 },
  jPigeons: { draw: jPigeons },
  jBox: { draw: jBox, r: 0.32 },
  jCart: { draw: jCart, obstacles: (it) => [rotBox(it, 2.2, 1.0, -0.3, 0)] },
  jLadder: { draw: jLadder, r: 0.4 },
  jEasel: { draw: jEasel, r: 0.3 },
  jPier: { draw: jPier },
  jRope: { draw: jRope, obstacles: (it) => [circ(it, 0.12, 0.1, -0.55), circ(it, 0.12, 0.1, 0.55)] },
  jPaving: { draw: jPaving },
  jLip: { draw: jLip, obstacles: (it) => [rotBox(it, it.len || 8, 0.25)] },
  jBundles: { draw: jBundles, obstacles: (it) => [rotBox(it, 1.6, 0.5)] },
  jSheets: { draw: jSheets, obstacles: (it) => [circ(it, 0.12, -(it.len || 3.6) / 2, 0), circ(it, 0.12, (it.len || 3.6) / 2, 0)] },
  jTimber: { draw: jTimber, obstacles: (it) => [rotBox(it, 3.2, 1.5), circ(it, 0.5, -1.5, 1.0), rotBox(it, 1.0, 0.6, 1.6, 0.87)] },
  jCrates: { draw: jCrates, obstacles: (it) => [rotBox(it, 1.3, 0.6)] },
  jDog: { draw: jDog, r: 0.35 },
  jHenRun: { draw: jHenRun, obstacles: (it) => [rotBox(it, (it.w || 6) + 2.2, 0.3, 0, -(it.d || 4) / 2 - 0.5), rotBox(it, it.w || 6, it.d || 4)] },
  jBanana: { draw: jBanana, r: 0.35 },
  jWaterPot: { draw: jWaterPot, obstacles: (it) => [rotBox(it, 1.0, 0.8)] },
};
