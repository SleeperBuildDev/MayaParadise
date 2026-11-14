// Ledger Wharf art (District 3): the new building and prop kinds that regions/wharf.js places. Drawn with
// kit.js Geo boxes (merged per chunk cell, toon + outline), in the wharf's own colours: weathered silver
// plank, tar-black posts, teal and ochre paint, rust-red zinc and reed thatch, jute and rope, on cream ledger
// paper ruled in blue and red. Original art only. Every Burmese line is a draft for Maya.
//
// draw(g, f, it, ctx): g = outlined solid Geo (item-local, front +Z), f = flat ground Geo (no outline: decals,
// mist, cloud, tiny clutter), ctx.signs / ctx.glows / ctx.smoke as build.js. Imports only kit.js / toon.js /
// voxel.js (never build.js or region.js).
//
// The water: boats float on a cloud-stream whose surface is WATER_Y (-0.6) below the quay (props4.js's jetty
// uses the same level), so a day can drop props4.js's moving raft / ferry onto the same berths.
import { shade, rng } from '../kit.js';
import { PALETTE } from '../../../game/toon.js';
import { jitter } from '../../../game/voxel.js';

export const WATER_Y = -0.6;

const C = {
  wood: PALETTE.wood, woodD: PALETTE.woodDark, woodL: '#CDA577',
  woodG: '#A89A86', woodGD: '#8C7E6A', woodGL: '#C4B9A6', silver: '#B7AE9E',
  tar: '#3F3328', tarL: '#594938', teal: '#4E8C86', tealD: '#3D6F6A', tealL: '#7FB0A8',
  ochre: '#D8B66A', ochreD: '#B8954E', indigo: '#3E5F7A', indigoL: '#5E7F9A',
  rust: '#9C5B3C', rustD: '#7E4630', rustL: '#B8744E', zinc: '#A7A9A2', zincD: '#878A84', zincL: '#C2C4BD',
  thatch: '#C9A960', thatchD: '#A88A48', thatchL: '#DDC283',
  jute: '#C8A878', juteD: '#A88C5E', juteL: '#DCC39A', rope: '#C9AE7E', ropeD: '#A88C5E',
  ledger: '#F4EEDC', ledgerD: '#E6DDC6', rRule: '#D98579', bRule: '#8EAFCF',
  cream: PALETTE.cream, white: PALETTE.white, ink: PALETTE.ink, iron: '#4A3B30', gold: PALETTE.gold, goldD: PALETTE.goldDeep,
  maroon: PALETTE.maroon, terra: '#B5643C', terraL: '#CB7E4E', terraD: '#8E4A2C', glaze: '#5A3A26', glazeL: '#7A5232',
  leaf: PALETTE.leaf, leafD: PALETTE.leafDark, leafL: '#8DBA6E', olive: '#6E7F4C', oliveD: '#56653A',
  sand: '#E9D8AE', sandD: '#D6C090', sandW: '#CDB98E', sandL: '#F2E6C6',
  cloud: '#FFFFFF', cloudMid: '#FAF1F2', cloudLow: '#D8CAE2', cloudBlue: '#E6EDF6', cloudShade: '#DCE3EE',
  hull: '#30485A', hullD: '#243745', hullCream: '#F2EAD6', glass: '#BFD3E0', dark: '#3A2E25', interior: '#4E3F33',
  bamboo: '#C8B36E', bambooD: '#A8925A', bambooL: '#DCCB8E', cane: '#C9B66C', caneG: '#AFB662', caneD: '#9C8A4C',
  mustard: '#E2B33C', red: '#C8323C', blue: '#2F5DB3', sky: '#9CC3DE', rose: PALETTE.rose, stone: '#D8D0BE', stoneD: '#BDB39D',
  shadow: '#E2D7BA', shadowD: '#D6CAAA', fish: '#C9CED1', fishD: '#9EA6AA', mist: '#F1F0EC', mistB: '#E8EBEF',
};
const CLOTH = ['#C8323C', '#E2B33C', '#3E5F7A', '#4E8C86', '#E8A0A8', '#6F9E5B', '#D9773A', '#7A4E8C'];
const SIGN_EN = { size: 20, font: 'serif', weight: 600, color: '#6E1F2A' };

// ---------------------------------------------------------------------------------
// shared pieces
// ---------------------------------------------------------------------------------
/** Horizontal clapboards across a front (x0..x1, y0..y1) at depth z: each board a slightly different grey. */
function boards(g, x0, x1, y0, y1, z, col, seed, t = 0.1) {
  const n = Math.max(3, Math.round((y1 - y0) / 0.38)), h = (y1 - y0) / n;
  for (let i = 0; i < n; i++) g.box((x0 + x1) / 2, y0 + h * (i + 0.5), z + (i % 2) * 0.014, x1 - x0, h + 0.012, t, jitter(col, 0.06, seed + i * 7));
}
/** Vertical planks (a shed front), every bw metres, alternating shade, with a batten line. */
function vboards(g, x0, x1, y0, y1, z, col, seed, bw = 0.5) {
  const n = Math.max(2, Math.round((x1 - x0) / bw)), w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) g.box(x0 + w * (i + 0.5), (y0 + y1) / 2, z + (i % 2) * 0.012, w + 0.01, y1 - y0, 0.1, jitter(col, 0.07, seed + i * 13));
}
/** A window with no glass: dark opening, bar, side shutters folded open (or a top flap propped on a stick). */
function win(g, x, y, z, w, h, col, flap = false) {
  g.box(x, y, z, w + 0.16, h + 0.16, 0.08, C.woodD);
  g.box(x, y, z + 0.012, w, h, 0.08, C.dark);
  g.box(x, y, z + 0.05, 0.04, h, 0.04, C.woodD);
  g.box(x, y - h / 2 - 0.07, z + 0.08, w + 0.26, 0.06, 0.16, C.woodD);
  if (flap) {
    g.boxR(x, y + h / 2 + 0.05, z + 0.32, w + 0.12, 0.05, 0.7, col, 0.95, 0, 0);
    g.boxR(x + w / 2 - 0.08, y + h / 4, z + 0.3, 0.03, 0.03, 0.75, C.woodL, -0.55, 0, 0);
  } else {
    for (const sx of [-1, 1]) {
      g.box(x + sx * (w / 2 + 0.2), y, z + 0.05, 0.3, h, 0.05, col);
      g.box(x + sx * (w / 2 + 0.2), y, z + 0.08, 0.2, 0.04, 0.02, shade(col, 0.78));
    }
  }
}
/** Stepped gable end (triangle) filling between y0 and y0 + rise, depth D (ridge along X). */
function gableEnds(g, W, D, y0, rise, col, zo = 0) {
  const steps = 4;
  for (let i = 0; i < steps; i++) g.box(0, y0 + (rise * (i + 0.5)) / steps, zo, W - 0.06, rise / steps, D * (1 - (i + 0.5) / steps), col);
}
/** Corrugated zinc roof, ridge along X: two slabs, a few ribs, rust patches, a ridge cap. zo shifts it +Z. */
function zincX(g, W, D, y0, rise, col, seed, zo = 0, over = 0.4) {
  const half = D / 2 + over, ang = Math.atan2(rise, D / 2), slope = half / Math.cos(ang), r = rng(seed);
  const X = W + over * 2;
  for (const sz of [-1, 1]) {
    g.boxR(0, y0 + rise / 2 + 0.05, zo + (sz * half) / 2, X, 0.1, slope, col, sz * ang, 0, 0);
    const n = Math.max(3, Math.round(X / 1.1));
    for (let i = 0; i < n; i++) g.boxR(-X / 2 + (i + 0.5) * (X / n), y0 + rise / 2 + 0.11, zo + (sz * half) / 2, 0.07, 0.05, slope + 0.02, shade(col, 0.84), sz * ang, 0, 0);
    for (let k = 0; k < 2; k++) {
      const t = 0.25 + r() * 0.5, px = (r() - 0.5) * (X - 1.2);
      g.boxR(px, y0 + rise * (1 - t) + 0.13, zo + sz * half * t, 0.6 + r() * 0.6, 0.03, 0.5 + r() * 0.4, k ? C.rustL : C.rust, sz * ang, 0, 0);
    }
  }
  g.box(0, y0 + rise + 0.1, zo, X + 0.04, 0.12, 0.26, shade(col, 0.75));
}
/** Corrugated zinc roof with its ridge along Z (the gable faces the street). */
function zincZ(g, W, D, y0, rise, col, seed, over = 0.4) {
  const half = W / 2 + over, ang = Math.atan2(rise, W / 2), slope = half / Math.cos(ang), r = rng(seed);
  const Z = D + over * 2;
  for (const sx of [-1, 1]) {
    g.boxR((sx * half) / 2, y0 + rise / 2 + 0.05, 0, slope, 0.1, Z, col, 0, 0, -sx * ang);
    const n = Math.max(3, Math.round(Z / 1.2));
    for (let i = 0; i < n; i++) g.boxR((sx * half) / 2, y0 + rise / 2 + 0.11, -Z / 2 + (i + 0.5) * (Z / n), slope + 0.02, 0.05, 0.07, shade(col, 0.84), 0, 0, -sx * ang);
    const t = 0.3 + r() * 0.4;
    g.boxR(sx * half * t, y0 + rise * (1 - t) + 0.13, (r() - 0.5) * (Z - 2), 0.6, 0.03, 1 + r(), C.rust, 0, 0, -sx * ang);
  }
  g.box(0, y0 + rise + 0.1, 0, 0.26, 0.12, Z + 0.04, shade(col, 0.75));
}
/** Reed thatch, ridge along X: layered slabs, a ragged fringe on the front eave, a ridge roll, crossed finials. */
function thatchX(g, W, D, y0, rise, seed, zo = 0, over = 0.5) {
  const half = D / 2 + over, ang = Math.atan2(rise, D / 2), slope = half / Math.cos(ang), r = rng(seed);
  const X = W + over * 2;
  for (const sz of [-1, 1]) {
    g.boxR(0, y0 + rise / 2 + 0.06, zo + (sz * half) / 2, X, 0.2, slope, C.thatch, sz * ang, 0, 0);
    for (let k = 0; k < 3; k++) {
      const t = (k + 0.6) / 3.4;
      g.boxR(0, y0 + rise * (1 - t) + 0.19, zo + sz * half * t, X + 0.04, 0.07, 0.22, k % 2 ? C.thatchL : C.thatchD, sz * ang, 0, 0);
    }
  }
  // the front eave's ragged edge (seen from the street)
  const ez = zo + half * 0.98, ey = y0 - over * Math.tan(ang) + 0.02;
  for (let x = -X / 2 + 0.2; x < X / 2 - 0.1; x += 0.36 + r() * 0.12) g.box(x, ey - 0.06 - r() * 0.08, ez, 0.3 + r() * 0.12, 0.16 + r() * 0.12, 0.12, r() < 0.5 ? C.thatchD : C.thatch);
  g.box(0, y0 + rise + 0.14, zo, X + 0.1, 0.22, 0.34, C.thatchD);
  for (const sx of [-1, 1]) for (const s of [-1, 1]) g.boxR(sx * (X / 2 - 0.1), y0 + rise + 0.42, zo, 0.07, 0.75, 0.07, C.woodD, s * 0.55, 0, 0);
}
/** A clay water jar (glazed martaban) with a lid; at (x, z), height h. */
function jar(g, x, z, h = 0.7, col = C.glaze) {
  g.box(x, h * 0.45, z, h * 0.62, h * 0.7, h * 0.62, col);
  g.box(x, h * 0.48, z, h * 0.72, h * 0.34, h * 0.72, shade(col, 1.15));
  g.box(x, h * 0.86, z, h * 0.42, h * 0.12, h * 0.42, shade(col, 0.85));
  g.box(x, h * 0.96, z, h * 0.5, 0.05, h * 0.5, C.woodL);
}
/** A jute sack standing (tied top), turned a little. */
function sack(g, x, y, z, s = 1, ry = 0, col = C.jute) {
  g.box(x, y + 0.28 * s, z, 0.5 * s, 0.56 * s, 0.38 * s, col, ry);
  g.box(x, y + 0.6 * s, z, 0.28 * s, 0.1 * s, 0.24 * s, shade(col, 0.88), ry);
  g.box(x, y + 0.26 * s, z, 0.52 * s, 0.05 * s, 0.4 * s, shade(col, 0.82), ry);
}
/** A sack lying flat on a stack. */
function sackFlat(g, x, y, z, ry = 0, col = C.jute) {
  g.box(x, y + 0.13, z, 0.72, 0.26, 0.46, col, ry);
  g.box(x, y + 0.27, z, 0.6, 0.04, 0.3, shade(col, 1.08), ry);
}
/** A slatted crate. */
function crate(g, x, y, z, s = 0.6, ry = 0, col = C.woodL) {
  g.box(x, y + s / 2, z, s, s, s, col, ry);
  g.box(x, y + s * 0.75, z, s + 0.02, 0.05, s + 0.02, shade(col, 0.78), ry);
  g.box(x, y + s * 0.3, z, s + 0.02, 0.05, s + 0.02, shade(col, 0.78), ry);
}
/** A rope coil lying on the ground. */
function coil(g, x, z, r = 0.32, y = 0) {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.box(x + Math.cos(a) * r, y + 0.06, z + Math.sin(a) * r, 0.1, 0.12, 2 * r * Math.tan(Math.PI / 8) + 0.06, i % 2 ? C.rope : C.ropeD, -a);
  }
  g.box(x, y + 0.05, z, r * 1.1, 0.08, r * 1.1, C.ropeD);
}
/** A little standing figure (a crewman, a porter): baked art, not a townsperson. y0 = what it stands on. */
function figure(g, x, z, ry, top, bottom, skin = '#C9946A', pose = 'stand', y0 = 0) {
  const c = Math.cos(ry), s = Math.sin(ry);
  const P = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  const lean = pose === 'lean' ? 0.12 : 0.02;
  let [px, pz] = P(0, 0);
  g.box(px, y0 + 0.36, pz, 0.34, 0.72, 0.24, bottom, ry);
  [px, pz] = P(0, lean * 0.5);
  g.box(px, y0 + 0.95, pz, 0.4, 0.5, 0.26, top, ry);
  [px, pz] = P(0, lean);
  g.box(px, y0 + 1.38, pz, 0.32, 0.32, 0.3, skin, ry);
  g.box(px, y0 + 1.55, pz, 0.34, 0.08, 0.32, '#241C18', ry);
  for (const sx of [-1, 1]) { [px, pz] = P(sx * 0.25, lean + 0.06); g.box(px, y0 + 1.02, pz, 0.12, 0.44, 0.12, skin, ry); }
}
/** Item-local (lx, lz) -> world [x, z] (for glows and smoke, which are in world space). */
function world(g, lx, lz) { return [g.tx + lx * g.tc + lz * g.ts, g.tz - lx * g.ts + lz * g.tc]; }

// ---------------------------------------------------------------------------------
// Buildings (ART). Footprint centred on the origin, front at +d/2.
// ---------------------------------------------------------------------------------
const WALLS = ['#B7AE9E', '#A89A86', '#C4B9A6', '#8FA5A0', '#D0BE96', '#B9A486'];
const SHUT = [C.teal, C.indigo, C.maroon, C.ochre, C.rust];

/** A wharf stilt house: posts, plank walls, a front veranda with steps, thatch or zinc roof, and the
 * things of a riverside home round it (nets, a fish trap, jars, firewood, a boat under the floor). */
function wStilt(g, f, it) {
  const W = it.w, D = it.d, r = rng(it.seed || 1);
  const FL = 1.1, TOP = FL + 2.3, wall = it.wall || WALLS[(it.seed || 0) % WALLS.length], trim = C.woodGD;
  const shut = SHUT[Math.floor(r() * SHUT.length)];
  const thatch = it.roof ? it.roof === 'thatch' : r() < 0.55;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.7, D / 2 + 1.8, 0.004, C.shadow);
  // posts on stone footings, a brace or two
  for (const x of [-W / 2 + 0.15, 0, W / 2 - 0.15]) for (const z of [-D / 2 + 0.15, D / 2 - 0.15]) {
    g.box(x, FL / 2, z, 0.2, FL, 0.2, C.tar);
    f.box(x, 0.05, z, 0.34, 0.1, 0.34, C.stone);
  }
  for (const x of [-W / 2 + 0.15, W / 2 - 0.15]) g.box(x, (FL + 0.9) / 2, D / 2 + 1.0, 0.16, FL + 0.9, 0.16, C.tar);
  g.boxR(-W / 4, FL * 0.5, D / 2 - 0.15, W / 2 * 1.08, 0.07, 0.07, C.woodD, 0, 0, Math.atan2(FL * 0.8, W / 2));
  // floor, veranda deck with seams
  g.box(0, FL - 0.07, 0, W + 0.1, 0.16, D, trim);
  g.box(0, FL - 0.05, D / 2 + 0.55, W + 0.1, 0.12, 1.1, C.woodL);
  for (let k = 1; k < 4; k++) g.box(0, FL + 0.012, D / 2 + k * 0.27, W + 0.04, 0.01, 0.025, shade(C.woodL, 0.82));
  // walls: the body, then clapboards on the front; corner and plate trims
  g.box(0, (FL + TOP) / 2, -0.08, W - 0.06, TOP - FL, D - 0.2, shade(wall, 0.92));
  boards(g, -W / 2, W / 2, FL, TOP, D / 2 - 0.05, wall, it.seed || 1);
  for (const sx of [-1, 1]) g.box(sx * W / 2, (FL + TOP) / 2, D / 2 - 0.03, 0.14, TOP - FL, 0.16, trim);
  g.box(0, TOP - 0.05, D / 2 - 0.02, W + 0.06, 0.12, 0.16, trim);
  // door (one leaf open, the room dark inside) and windows
  const doorX = it.doorX ?? Math.round((r() - 0.5) * (W - 2.8) * 4) / 4;
  g.box(doorX, FL + 0.95, D / 2 + 0.02, 0.98, 1.84, 0.08, C.woodD);
  g.box(doorX, FL + 0.93, D / 2 + 0.03, 0.8, 1.74, 0.08, C.interior);
  g.box(doorX - 0.38, FL + 0.93, D / 2 + 0.38, 0.06, 1.7, 0.72, shade(shut, 0.92));
  g.box(doorX - 0.33, FL + 0.93, D / 2 + 0.38, 0.02, 0.06, 0.5, C.woodD);
  for (const wx of [-W / 2 + 0.95, W / 2 - 0.95]) if (Math.abs(wx - doorX) > 1.3) win(g, wx, FL + 1.3, D / 2 + 0.02, 0.8, 0.72, shut, r() < 0.5);
  // veranda rail (a gap at the steps), steps down at one end
  const stepX = doorX < 0 ? W / 2 - 0.55 : -W / 2 + 0.55;
  for (let x = -W / 2 + 0.08; x <= W / 2 - 0.05; x += 0.42) if (Math.abs(x - stepX) > 0.45) g.box(x, FL + 0.36, D / 2 + 1.05, 0.06, 0.6, 0.06, C.woodD);
  for (const [a, b] of [[-W / 2, stepX - 0.45], [stepX + 0.45, W / 2]]) if (b - a > 0.2) g.box((a + b) / 2, FL + 0.68, D / 2 + 1.05, b - a, 0.07, 0.09, C.wood);
  for (let k = 0; k < 3; k++) g.box(stepX, FL - 0.28 - k * 0.27, D / 2 + 1.28 + k * 0.27, 0.8, 0.07, 0.3, C.woodL);
  for (const sx of [-0.42, 0.42]) g.boxR(stepX + sx, FL * 0.5, D / 2 + 1.5, 0.07, 0.07, 1.5, C.woodD, Math.atan2(FL, 0.9), 0, 0);
  // roof over house and veranda
  const RD = D + 1.1;
  gableEnds(g, W, D - 0.2, TOP, 1.5, shade(wall, 0.86), -0.08);
  if (thatch) thatchX(g, W, RD, TOP, 1.6, (it.seed || 1) + 5, 0.55);
  else zincX(g, W, RD, TOP, 1.4, [C.rust, C.zinc, C.rustD, C.zincD][(it.seed || 0) % 4], (it.seed || 1) + 5, 0.55);
  // life round it (seeded)
  const picks = [r(), r(), r(), r(), r()];
  if (picks[0] < 0.55) { // a fishing net drying over the rail
    const nx = (doorX < 0 ? 0.6 : -0.6) * (W / 4);
    g.box(nx, FL + 0.42, D / 2 + 1.12, 1.6, 0.62, 0.05, C.olive);
    for (let k = 0; k < 4; k++) g.box(nx - 0.6 + k * 0.4, FL + 0.42, D / 2 + 1.15, 0.03, 0.62, 0.02, C.oliveD);
    for (let k = 0; k < 5; k++) g.box(nx - 0.7 + k * 0.35, FL + 0.74, D / 2 + 1.12, 0.12, 0.08, 0.1, k % 2 ? C.white : C.red);
  }
  if (picks[1] < 0.5) { // a bamboo fish trap hanging under the eave
    const tx = doorX + (doorX < 0 ? 1.2 : -1.2);
    for (let k = 0; k < 3; k++) g.box(tx, TOP - 0.3 - k * 0.2, D / 2 + 0.9, 0.42 - k * 0.1, 0.2, 0.42 - k * 0.1, k % 2 ? C.bamboo : C.bambooD);
    g.box(tx, TOP - 0.05, D / 2 + 0.9, 0.02, 0.3, 0.02, C.ink);
  } else { // a lantern by the door
    g.box(doorX + 0.75, TOP - 0.3, D / 2 + 0.3, 0.2, 0.28, 0.2, C.mustard);
    g.box(doorX + 0.75, TOP - 0.13, D / 2 + 0.3, 0.24, 0.05, 0.24, C.iron);
  }
  // under the floor: jars, firewood, a boat or a hammock
  jar(g, -W / 2 + 0.6, -0.3, 0.7);
  if (picks[2] < 0.5) jar(g, -W / 2 + 1.3, 0.1, 0.55, C.terra);
  if (picks[3] < 0.4) { // a little sampan stored under the house
    g.box(W / 4, 0.18, -0.2, 2.6, 0.24, 0.62, C.woodG);
    g.box(W / 4, 0.32, -0.2, 2.2, 0.06, 0.5, C.dark);
    for (const sx of [-1, 1]) g.boxR(W / 4 + sx * 1.35, 0.3, -0.2, 0.4, 0.14, 0.4, C.woodGD, 0, 0, sx * 0.4);
  } else if (picks[3] < 0.75) {
    for (let row = 0; row < 3; row++) for (let i = 0; i < 4 - row; i++) g.box(W / 4 - 0.45 + i * 0.3 + row * 0.15, 0.14 + row * 0.24, -0.6, 0.26, 0.24, 1.0, shade(C.wood, 0.85 + ((i + row) % 3) * 0.1));
  } else {
    for (const [x0, x1, y] of [[-0.9, -0.3, 0.75], [-0.3, 0.3, 0.62], [0.3, 0.9, 0.75]]) g.boxR(W / 4 + (x0 + x1) / 2, y, 0.1, 0.62, 0.05, 0.5, CLOTH[(it.seed || 0) % 8], 0, 0, (y - 0.68) * -3);
  }
  // pots of flowers on the veranda's edge and a pair of sandals by the steps
  if (picks[4] < 0.7) for (let k = 0; k < 2; k++) {
    const x = (doorX < 0 ? -1 : 1) * (W / 2 - 0.35 - k * 0.42);
    g.box(x, FL + 0.17, D / 2 + 0.85, 0.24, 0.24, 0.24, C.terra);
    g.box(x, FL + 0.37, D / 2 + 0.85, 0.28, 0.2, 0.28, k ? C.leaf : C.leafL);
    if (!k) g.box(x, FL + 0.5, D / 2 + 0.85, 0.12, 0.08, 0.12, C.rose);
  }
  for (const sx of [-0.12, 0.12]) f.box(stepX + sx, 0.02, D / 2 + 2.25, 0.1, 0.04, 0.26, C.maroon);
}

/** A godown (warehouse) with its gable to the street: whitewashed ledger-cream walls ruled with painted
 * blue and red account lines, a loading platform, one big door leaf open on stacked sacks, a hoist beam. */
function wGodown(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 4.0, r = rng(it.seed || 3);
  const wallC = it.wall || C.ledger;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.7, D / 2 + 1.9, 0.004, C.shadow);
  // walls on a tarred plinth
  g.box(0, 0.25, 0, W + 0.12, 0.5, D + 0.12, C.tar);
  g.box(0, 0.5 + H / 2, 0, W, H, D, shade(wallC, 0.95));
  g.box(0, 0.5 + H / 2, D / 2 - 0.02, W, H, 0.06, wallC);
  // the ledger frieze: two blue rules and a red double rule across, column lines down
  for (const y of [0.5 + H - 0.35, 0.5 + H - 0.5]) g.box(0, y, D / 2 + 0.02, W - 0.1, 0.05, 0.02, C.bRule);
  for (const y of [1.2, 1.32]) g.box(0, y, D / 2 + 0.02, W - 0.1, 0.045, 0.02, C.rRule);
  for (let x = -W / 2 + 0.6; x < W / 2 - 0.3; x += 1.2) if (Math.abs(x) > 1.7) g.box(x, 0.5 + H / 2 + 0.4, D / 2 + 0.02, 0.035, H - 1.4, 0.02, C.bRule);
  // big door: frame, one leaf open against the wall, the dark inside with sacks
  g.box(0, 0.5 + 1.45, D / 2 + 0.04, 3.0, 2.9, 0.1, C.woodD);
  g.box(0, 0.5 + 1.4, D / 2 + 0.05, 2.7, 2.8, 0.1, C.interior);
  for (let k = 0; k < 4; k++) sackFlat(g, -0.7 + (k % 2) * 0.75, 0.5 + Math.floor(k / 2) * 0.27, D / 2 - 0.5, 0.05 * k);
  sack(g, 0.85, 0.5, D / 2 - 0.4, 1.0, 0.2);
  g.box(-1.3, 0.5 + 1.4, D / 2 + 0.12, 1.35, 2.78, 0.1, jitter(it.door || C.indigo, 0.04, it.seed || 3));
  for (const y of [0.9, 1.9, 2.9]) g.box(-1.3, 0.5 + y - 0.5, D / 2 + 0.18, 1.3, 0.08, 0.04, shade(it.door || C.indigo, 0.8));
  g.boxR(2.15, 0.5 + 1.4, D / 2 + 0.68, 1.35, 2.78, 0.1, jitter(it.door || C.indigo, 0.04, (it.seed || 3) + 1), 0, -1.45, 0);
  // loading platform with steps at one side, a sack trolley
  g.box(0, 0.32, D / 2 + 0.75, W - 0.4, 0.64, 1.4, C.woodGD);
  g.box(0, 0.66, D / 2 + 0.75, W - 0.36, 0.06, 1.44, C.woodG);
  for (let k = 0; k < 2; k++) g.box(W / 2 - 0.9, 0.42 - k * 0.22, D / 2 + 1.62 + k * 0.28, 1.1, 0.08, 0.3, C.woodL);
  for (let k = 0; k < 3; k++) sack(g, -W / 2 + 0.7 + k * 0.55, 0.69, D / 2 + 0.75 - (k % 2) * 0.15, 0.95, (k - 1) * 0.3);
  sackFlat(g, -W / 2 + 1.0, 1.25, D / 2 + 0.7, 0.2);
  crate(g, W / 2 - 1.8, 0.69, D / 2 + 0.85, 0.6, 0.3);
  // the gable: stepped triangle, a round vent, a hoist beam with a pulley and a hanging rope
  const rise = W * 0.32;
  for (let i = 0; i < 5; i++) g.box(0, 0.5 + H + (rise * (i + 0.5)) / 5, 0, W * (1 - (i + 0.5) / 5), rise / 5, D - 0.04, shade(wallC, 0.9));
  g.box(0, 0.5 + H + rise * 0.42, D / 2 + 0.02, 0.62, 0.62, 0.06, C.woodD);
  g.box(0, 0.5 + H + rise * 0.42, D / 2 + 0.05, 0.46, 0.46, 0.06, C.dark);
  g.box(0, 0.5 + H + 0.25, D / 2 + 0.7, 0.18, 0.18, 1.6, C.woodD);
  g.box(0, 0.5 + H + 0.06, D / 2 + 1.4, 0.16, 0.22, 0.16, C.iron);
  g.box(0, 0.5 + H - 0.9, D / 2 + 1.42, 0.03, 1.9, 0.03, C.rope);
  g.box(0, 0.5 + H - 1.9, D / 2 + 1.42, 0.12, 0.14, 0.04, C.iron);
  zincZ(g, W, D, 0.5 + H, rise, it.roof || [C.zinc, C.rust, C.zincD][(it.seed || 0) % 3], (it.seed || 3) + 9, 0.35);
  // a lamp bracket by the door
  g.box(1.75, 0.5 + 2.7, D / 2 + 0.2, 0.06, 0.06, 0.4, C.iron);
  g.box(1.75, 0.5 + 2.55, D / 2 + 0.38, 0.2, 0.26, 0.2, C.mustard);
  if (it.label) ctx.signs.push({ x: 0, y: 0.5 + H - 0.62, z: D / 2 + 0.08, w: 2.6, h: 0.56, lines: [{ text: it.label.my, size: 46 }, { text: it.label.en, ...SIGN_EN }], bg: '#F6F0E2', width: 560, height: 120 });
  void r;
}

/** A shophouse on the street: open ground floor of wharf goods (nets, rope, tin, dried fish, rice),
 * a plank upper floor with a balcony, a striped teal awning, a hipped zinc roof. */
function wShop(g, f, it, ctx) {
  const W = it.w, D = it.d, r = rng(it.seed || 5), H1 = 2.9, H2 = 5.0;
  const wall = it.wall || WALLS[((it.seed || 0) + 2) % WALLS.length];
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.6, D / 2 + 1.7, 0.004, C.shadow);
  g.box(0, 0.08, 0, W + 0.2, 0.16, D + 0.2, C.stone);
  g.box(0, H1 / 2 + 0.08, -0.5, W, H1, D - 1.0, shade(wall, 0.9));
  for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.14), H1 / 2 + 0.08, 0, 0.28, H1, D, wall);
  g.box(0, (H1 + H2) / 2, -0.1, W, H2 - H1, D - 0.2, shade(wall, 0.96));
  boards(g, -W / 2, W / 2, H1 + 0.05, H2, D / 2 - 0.12, wall, (it.seed || 5) + 3);
  // the open front: goods inside and hanging under the awning
  g.box(0, 1.5, -D / 2 + 1.05, W - 0.6, 2.6, 0.06, C.interior);
  const kind = it.goods || ['nets', 'rope', 'tin', 'fish', 'rice'][Math.floor(r() * 5)];
  for (let k = 0; k < 3; k++) g.box(0, 0.55 + k * 0.62, -D / 2 + 1.35, W - 0.8, 0.06, 0.4, C.woodL);
  for (let k = 0; k < 3; k++) for (let x = -W / 2 + 0.7; x < W / 2 - 0.6; x += 0.46) {
    const y = 0.75 + k * 0.62, c = (Math.round(x * 5) + k + (it.seed || 0)) % 5;
    if (kind === 'rope') g.box(x, y, -D / 2 + 1.35, 0.36, 0.24, 0.3, [C.rope, C.ropeD, C.juteL, C.rope, '#8E9E6A'][c]);
    else if (kind === 'tin') g.box(x, y, -D / 2 + 1.35, 0.3, 0.3, 0.3, [C.zinc, C.zincL, C.teal, C.red, C.zincD][c]);
    else if (kind === 'rice') g.box(x, y - 0.02, -D / 2 + 1.35, 0.38, 0.32, 0.3, [C.jute, C.juteL, C.white, C.jute, C.juteD][c]);
    else g.box(x, y, -D / 2 + 1.35, 0.3, 0.28, 0.26, [C.olive, C.teal, C.white, C.ochre, C.oliveD][c]);
  }
  // counter / bench at the front with goods on it
  g.box(0, 0.42, D / 2 - 0.55, W - 1.2, 0.84, 0.6, C.woodGD);
  g.box(0, 0.86, D / 2 - 0.55, W - 1.1, 0.05, 0.7, C.woodG);
  if (kind === 'fish' || kind === 'nets') {
    // strings of dried fish (or net floats) hanging under the awning
    g.box(0, H1 - 0.22, D / 2 - 0.05, W - 0.6, 0.03, 0.03, C.ink);
    for (let x = -W / 2 + 0.5; x < W / 2 - 0.4; x += 0.3) {
      const n = 2 + (Math.round(x * 7) % 2);
      for (let k = 0; k < n; k++) g.box(x, H1 - 0.38 - k * 0.2, D / 2 - 0.05, 0.08, 0.16, 0.03, kind === 'fish' ? (k % 2 ? C.fish : C.fishD) : (k % 2 ? C.red : C.white));
    }
    if (kind === 'nets') { g.box(-W / 4, 1.0, D / 2 - 0.15, 1.2, 1.3, 0.05, C.olive); for (let k = 0; k < 3; k++) g.box(-W / 4 - 0.4 + k * 0.4, 1.0, D / 2 - 0.12, 0.03, 1.3, 0.02, C.oliveD); }
  } else if (kind === 'tin') {
    for (let x = -W / 2 + 0.7; x < W / 2 - 0.5; x += 0.62) { g.box(x, H1 - 0.45, D / 2 - 0.05, 0.3, 0.32, 0.3, C.zincL); g.box(x, H1 - 0.27, D / 2 - 0.05, 0.02, 0.1, 0.02, C.ink); }
    for (const x of [-W / 2 + 1, -W / 2 + 1.5]) { g.box(x, 1.07, D / 2 - 0.55, 0.32, 0.36, 0.32, C.zinc); g.box(x, 1.28, D / 2 - 0.55, 0.36, 0.04, 0.36, C.zincD); }
  } else if (kind === 'rope') {
    coil(g, -W / 4, D / 2 - 0.55, 0.28, 0.88); coil(g, W / 4, D / 2 - 0.55, 0.24, 0.88);
  } else {
    for (let k = 0; k < 3; k++) sack(g, -W / 2 + 0.9 + k * 0.55, 0.88, D / 2 - 0.55, 0.7, k * 0.2);
    g.box(W / 4, 1.0, D / 2 - 0.55, 0.5, 0.22, 0.5, C.white); // a tin measure of rice
  }
  // awning in teal and cream stripes
  const n = Math.max(4, Math.round(W / 0.5));
  const awn = it.awning || [C.teal, C.indigo, C.rust, C.ochreD][(it.seed || 0) % 4];
  for (let i = 0; i < n; i++) g.boxR(-W / 2 + (W * (i + 0.5)) / n, H1 + 0.02, D / 2 + 0.45, W / n + 0.005, 0.06, 1.3, i % 2 ? C.cream : awn, 0.32, 0, 0);
  for (let i = 0; i < n; i++) g.box(-W / 2 + (W * (i + 0.5)) / n, H1 - 0.34, D / 2 + 1.08, W / n - 0.05, 0.14, 0.04, i % 2 ? C.cream : awn);
  // upper balcony and windows
  g.box(0, H1 + 0.25, D / 2 + 0.12, W - 0.5, 0.08, 0.7, C.woodG);
  for (let x = -W / 2 + 0.3; x <= W / 2 - 0.25; x += 0.33) g.box(x, H1 + 0.55, D / 2 + 0.44, 0.05, 0.5, 0.05, C.woodD);
  g.box(0, H1 + 0.82, D / 2 + 0.44, W - 0.5, 0.06, 0.07, C.wood);
  for (const wx of [-W / 4, W / 4]) win(g, wx, H1 + 1.25, D / 2 - 0.1, 0.8, 0.85, SHUT[(it.seed || 0) % 5]);
  // hipped zinc roof: two stepped slabs
  g.box(0, H2 + 0.08, -0.1, W + 0.5, 0.14, D + 0.3, C.woodGD);
  const rc = it.roof || [C.rust, C.zinc, C.rustD][(it.seed || 0) % 3];
  g.box(0, H2 + 0.35, -0.1, W + 0.3, 0.4, D + 0.1, rc);
  g.box(0, H2 + 0.7, -0.1, W - 0.9, 0.32, D - 1.4, shade(rc, 1.08));
  g.box(0, H2 + 0.92, -0.1, W - 2.0, 0.14, 0.3, shade(rc, 0.75));
  for (let x = -W / 2; x <= W / 2; x += 0.9) g.box(x, H2 + 0.56, D / 2 - 0.15 + 0.1, 0.06, 0.03, 0.4, shade(rc, 0.8));
  g.box(W / 2 - 0.9, H2 + 1.0, -D / 2 + 1.0, 0.8, 0.8, 0.8, C.teal); // water tank
  g.box(W / 2 - 0.9, H2 + 1.44, -D / 2 + 1.0, 0.86, 0.06, 0.86, C.tealD);
  if (it.label) ctx.signs.push({ x: 0, y: H1 + 1.98, z: D / 2 - 0.02, w: Math.min(W - 0.8, 3.2), h: 0.62, lines: [{ text: it.label.my, size: 44 }, { text: it.label.en, ...SIGN_EN }], bg: '#F6F0E2', width: 560, height: 128 });
}

/** The weigh-house (room `weighhouse`): a big plank shed on the quay's north side, its wide loading door
 * open (two leaves folded back) on the beam scale inside; a painted scale sign above; a lean-to of sacks. */
function weighHouse(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 3.6;
  const wallC = C.woodG, trim = C.tar;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 2.6, D / 2 + 1.4, 0.004, C.shadow);
  // plinth, walls (vertical planks on the front), corner posts
  g.box(0, 0.12, 0, W + 0.3, 0.24, D + 0.3, C.stoneD);
  g.box(0, 0.24 + H / 2, -0.1, W, H, D - 0.2, shade(wallC, 0.9));
  const DW = 3.6; // the door's width
  vboards(g, -W / 2, -DW / 2 - 0.1, 0.24, 0.24 + H, D / 2 - 0.04, wallC, 41, 0.45);
  vboards(g, DW / 2 + 0.1, W / 2, 0.24, 0.24 + H, D / 2 - 0.04, wallC, 77, 0.45);
  g.box(0, 0.24 + H - 0.42, D / 2 - 0.04, DW + 0.4, 0.84, 0.1, wallC);
  for (const sx of [-1, 1]) g.box(sx * W / 2, 0.24 + H / 2, D / 2 - 0.02, 0.22, H, 0.22, trim);
  g.box(0, 0.24 + H - 0.04, D / 2 + 0.02, W + 0.1, 0.16, 0.2, trim);
  // the open doorway: dark plank floor, the beam scale inside (post, beam, chains, platform), sacks
  g.box(0, 0.24 + 1.4, D / 2 - 0.02, DW, 2.8, 0.1, C.interior);
  g.box(0, 0.26, D / 2 - 1.2, DW - 0.1, 0.04, 2.3, C.woodGD);
  g.box(0.0, 0.24 + 1.4, D / 2 - 2.6, 0.18, 2.8, 0.18, C.woodD);
  g.box(0.0, 0.24 + 2.45, D / 2 - 2.4, 2.0, 0.1, 0.1, C.goldD);
  for (const sx of [-0.9, 0.9]) g.box(sx, 0.24 + 1.7, D / 2 - 2.4, 0.03, 1.4, 0.03, C.iron);
  g.box(0, 0.24 + 0.08, D / 2 - 2.0, 1.4, 0.12, 1.1, C.woodD);
  g.box(-0.9, 0.24 + 1.0, D / 2 - 2.4, 0.3, 0.3, 0.22, C.gold);
  for (let k = 0; k < 3; k++) sackFlat(g, 1.2, 0.27 + k * 0.27, D / 2 - 1.0, k * 0.15);
  // door leaves folded back flat against the front, each with cross braces
  for (const sx of [-1, 1]) {
    const x = sx * (DW / 2 + 0.95);
    g.box(x, 0.24 + 1.4, D / 2 + 0.14, 1.75, 2.8, 0.1, C.tealD);
    g.boxR(x, 0.24 + 1.4, D / 2 + 0.2, 0.1, 3.1, 0.04, shade(C.tealD, 0.8), 0, 0, sx * 0.55);
    for (const y of [0.35, 2.45]) g.box(x, 0.24 + y, D / 2 + 0.2, 1.75, 0.12, 0.04, shade(C.tealD, 0.8));
  }
  g.box(0, 0.24 + 2.86, D / 2 + 0.12, DW + 3.8, 0.08, 0.1, C.iron); // the sliding rail
  // threshold timber and a ramp for hand carts
  g.box(0, 0.12, D / 2 + 0.35, DW + 0.2, 0.24, 0.5, C.woodGD);
  g.boxR(0, 0.08, D / 2 + 0.85, DW - 0.6, 0.06, 0.7, C.woodG, 0.22, 0, 0);
  // high windows (a row of shutters under the eaves)
  for (const wx of [-W / 2 + 1.0, W / 2 - 1.0]) win(g, wx, 0.24 + H - 0.75, D / 2 + 0.01, 0.9, 0.55, C.teal, true);
  // gable roof (ridge along X), a clerestory vent on top
  gableEnds(g, W, D - 0.2, 0.24 + H, 1.7, shade(wallC, 0.85), -0.1);
  zincX(g, W, D, 0.24 + H, 1.7, C.rust, 4401, 0, 0.45);
  g.box(0, 0.24 + H + 1.95, 0, 3.0, 0.5, 1.2, shade(wallC, 0.85));
  g.box(0, 0.24 + H + 2.25, 0, 3.4, 0.1, 1.6, C.rustD);
  // the scale sign over the door: a painted board with a small balance on top
  g.box(0, 0.24 + H + 0.42, D / 2 + 0.15, 3.0, 0.82, 0.1, C.woodD);
  ctx.signs.push({ x: 0, y: 0.24 + H + 0.42, z: D / 2 + 0.22, w: 2.8, h: 0.72, lines: [{ text: 'ချိန်ခွင်ရုံ', size: 50 }, { text: 'Weigh-house', ...SIGN_EN }], bg: '#F6F0E2', width: 560, height: 144 });
  g.box(0, 0.24 + H + 0.93, D / 2 + 0.15, 0.06, 0.3, 0.06, C.goldD);
  g.box(0, 0.24 + H + 1.08, D / 2 + 0.15, 0.9, 0.05, 0.05, C.gold);
  for (const sx of [-0.42, 0.42]) { g.box(sx, 0.24 + H + 0.92, D / 2 + 0.15, 0.02, 0.28, 0.02, C.goldD); g.box(sx, 0.24 + H + 0.78, D / 2 + 0.15, 0.24, 0.04, 0.2, C.gold); }
  // a lean-to on the east wall: sacks and crates waiting to be weighed
  g.box(W / 2 + 1.1, 0.06, 0, 2.0, 0.12, D - 1.0, C.woodGD);
  for (const z of [-D / 2 + 0.7, D / 2 - 0.7]) g.box(W / 2 + 2.0, 1.25, z, 0.14, 2.5, 0.14, C.tar);
  g.boxR(W / 2 + 1.05, 2.6, 0, 2.3, 0.08, D - 0.6, C.zincD, 0, 0, -0.32);
  for (let k = 0; k < 6; k++) sackFlat(g, W / 2 + 0.9 + (k % 2) * 0.75, 0.12 + Math.floor(k / 2) * 0.27, -1.2 + (k % 3) * 0.2, k * 0.1, k % 3 ? C.jute : C.juteL);
  crate(g, W / 2 + 1.2, 0.12, 1.6, 0.66, 0.2); crate(g, W / 2 + 1.2, 0.78, 1.6, 0.5, -0.3);
  // a hand bell and a chalk slate by the door, a lamp bracket
  g.box(-DW / 2 - 0.25, 0.24 + 2.2, D / 2 + 0.25, 0.06, 0.06, 0.3, C.iron);
  g.box(-DW / 2 - 0.25, 0.24 + 2.05, D / 2 + 0.36, 0.18, 0.2, 0.18, C.goldD);
  g.box(DW / 2 + 0.4, 0.24 + 1.4, D / 2 + 0.22, 0.6, 0.8, 0.04, C.woodD);
  g.box(DW / 2 + 0.4, 0.24 + 1.4, D / 2 + 0.25, 0.5, 0.68, 0.02, '#3E4A3F');
  for (let k = 0; k < 4; k++) g.box(DW / 2 + 0.32, 0.24 + 1.62 - k * 0.14, D / 2 + 0.27, 0.3 - (k % 2) * 0.08, 0.025, 0.01, C.white);
  g.box(DW / 2 + 0.3, 0.24 + 2.7, D / 2 + 0.35, 0.06, 0.06, 0.4, C.iron);
  g.box(DW / 2 + 0.3, 0.24 + 2.55, D / 2 + 0.5, 0.22, 0.28, 0.22, C.mustard);
}

/** Daw Sanda's stilt house (room `sandahouse`): high on posts at the quay's edge above Little Jetty, its
 * plank door at the top of five steps facing the jetty (+Z), patches of cloth drying under the eaves. */
function sandaHouse(g, f, it) {
  const W = it.w, D = it.d, FL = 1.5, TOP = FL + 2.2;
  const wall = '#B9A486';
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.5, D / 2 + 1.0, 0.004, C.shadow);
  // tall posts (the east row stands down into the stream past the quay's edge)
  for (const x of [-W / 2 + 0.15, 0, W / 2 - 0.15]) for (const z of [-D / 2 + 0.15, 0, D / 2 - 0.15]) {
    const deep = x > 0.1 ? 3.0 : 0;
    g.box(x, (FL - deep) / 2, z, 0.2, FL + deep, 0.2, C.tar);
    if (deep) g.box(x, -1.2, z, 0.26, 0.1, 0.26, '#5E4330');
  }
  for (const z of [-D / 2 + 0.15, D / 2 - 0.15]) g.boxR(-W / 4, FL * 0.5, z, W / 2 * 1.05, 0.07, 0.07, C.woodD, 0, 0, Math.atan2(FL * 0.8, W / 2));
  g.box(0, FL - 0.07, 0, W + 0.1, 0.16, D, C.woodGD);
  g.box(0, FL - 0.05, D / 2 + 0.5, W + 0.1, 0.12, 1.0, C.woodL); // porch
  g.box(0, (FL + TOP) / 2, -0.08, W - 0.06, TOP - FL, D - 0.2, shade(wall, 0.9));
  boards(g, -W / 2, W / 2, FL, TOP, D / 2 - 0.05, wall, 515);
  for (const sx of [-1, 1]) g.box(sx * W / 2, (FL + TOP) / 2, D / 2 - 0.03, 0.14, TOP - FL, 0.16, C.woodGD);
  // the plank door (shut), a window with a propped flap
  const dx = it.doorX ?? -0.8;
  g.box(dx, FL + 0.95, D / 2 + 0.02, 0.98, 1.86, 0.08, C.woodD);
  for (let k = 0; k < 4; k++) g.box(dx - 0.3 + k * 0.2, FL + 0.93, D / 2 + 0.06, 0.18, 1.72, 0.06, jitter(C.woodG, 0.08, k + 3));
  g.box(dx, FL + 1.4, D / 2 + 0.1, 0.7, 0.07, 0.04, C.woodD); g.box(dx, FL + 0.5, D / 2 + 0.1, 0.7, 0.07, 0.04, C.woodD);
  g.box(dx + 0.3, FL + 0.95, D / 2 + 0.11, 0.06, 0.06, 0.04, C.iron);
  win(g, W / 2 - 1.1, FL + 1.25, D / 2 + 0.02, 0.85, 0.7, C.teal, true);
  // five steps down to the jetty (toward +Z), a hand rope
  for (let k = 0; k < 5; k++) g.box(dx, FL - 0.15 - k * 0.3, D / 2 + 1.12 + k * 0.3, 0.92, 0.07, 0.3, k % 2 ? C.woodL : C.wood);
  for (const sx of [-0.48, 0.48]) g.boxR(dx + sx, FL * 0.48, D / 2 + 1.72, 0.07, 0.08, 1.95, C.woodD, Math.atan2(FL, 1.5), 0, 0);
  g.boxR(dx + 0.5, FL * 0.48 + 0.75, D / 2 + 1.72, 0.03, 0.03, 1.95, C.rope, Math.atan2(FL, 1.5), 0, 0);
  // porch rail
  for (let x = -W / 2 + 0.08; x <= W / 2 - 0.05; x += 0.42) if (Math.abs(x - dx) > 0.5) g.box(x, FL + 0.34, D / 2 + 0.98, 0.06, 0.56, 0.06, C.woodD);
  g.box((dx + 0.5 + W / 2) / 2, FL + 0.64, D / 2 + 0.98, W / 2 - dx - 0.5, 0.07, 0.09, C.wood);
  // thatch roof, gable ends
  gableEnds(g, W, D - 0.2, TOP, 1.4, shade(wall, 0.85), -0.08);
  thatchX(g, W, D + 1.0, TOP, 1.5, 616, 0.5);
  // patches drying on a line under the eaves (seven colours, a spare bright strip)
  g.box(0.4, TOP - 0.2, D / 2 + 0.85, W - 1.6, 0.025, 0.025, C.ink);
  for (let k = 0; k < 7; k++) g.box(-0.9 + k * 0.42, TOP - 0.42, D / 2 + 0.85, 0.3, 0.36 + (k % 3) * 0.06, 0.03, CLOTH[k]);
  // a water pot and Ko Thiha's pole leaning by the door (with its new cloth grip)
  jar(g, dx + 0.85, D / 2 + 0.5, 0.5, C.terra);
  g.boxR(dx - 0.7, FL + 1.55, D / 2 + 0.7, 0.07, 3.3, 0.07, C.bamboo, 0.12, 0, 0.06);
  g.boxR(dx - 0.62, FL + 2.6, D / 2 + 0.6, 0.1, 0.3, 0.1, C.red, 0.12, 0, 0.06);
  // under the house: a net basket, a coil, a duck or two pecking
  coil(g, -W / 2 + 0.9, -0.5, 0.3);
  g.box(0.2, 0.25, -0.8, 0.7, 0.5, 0.5, C.bambooD);
}

/** U Bo Lay's cane shed (room `caneshed`) on the sandbar: woven reed walls, a reed roof, an open doorway
 * with its reed blind rolled up, cane bundles leaning by it. Its front faces +Z. */
function caneShed(g, f, it) {
  const W = it.w, D = it.d, H = 2.5;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.6, D / 2 + 0.6, 0.004, C.sandD);
  g.box(0, 0.08, 0, W + 0.2, 0.16, D + 0.2, C.woodGD);
  g.box(0, 0.16 + H / 2, -0.1, W, H, D - 0.2, shade(C.reed || C.thatch, 0.85));
  // the woven front: alternate light and dark strips, with three bamboo bindings across
  const dx = it.doorX ?? -1.3, DW = 1.3;
  for (let x = -W / 2 + 0.15, i = 0; x < W / 2; x += 0.3, i++) {
    if (Math.abs(x - dx) < DW / 2 + 0.05) continue;
    g.box(x, 0.16 + H / 2, D / 2 - 0.05 + (i % 2) * 0.02, 0.3, H, 0.08, i % 2 ? C.thatchL : C.thatch);
  }
  for (const y of [0.5, 1.4, 2.3]) g.box(0, 0.16 + y, D / 2 + 0.03, W + 0.05, 0.08, 0.08, C.bambooD);
  for (const sx of [-1, 1]) g.box(sx * W / 2, 0.16 + H / 2, D / 2, 0.16, H, 0.16, C.bambooD);
  // doorway: dark inside, the cane racks just visible, the blind rolled up above it
  g.box(dx, 0.16 + 1.05, D / 2 - 0.04, DW, 2.1, 0.08, C.interior);
  for (let k = 0; k < 4; k++) g.box(dx + 0.15, 0.16 + 0.5 + k * 0.4, D / 2 - 0.8, 1.0, 0.06, 0.6, C.cane);
  g.box(dx, 0.16 + 2.2, D / 2 + 0.12, DW + 0.2, 0.2, 0.2, C.thatchD);
  for (const sx of [-0.45, 0.45]) g.box(dx + sx, 0.16 + 2.12, D / 2 + 0.22, 0.03, 0.3, 0.03, C.rope);
  // a water jar with a tin cup just inside the door (seen from the jetty)
  jar(g, dx + DW / 2 - 0.2, D / 2 - 0.45, 0.55, C.terra);
  g.box(dx + DW / 2 - 0.2, 0.16 + 0.62, D / 2 - 0.2, 0.1, 0.1, 0.1, C.zinc);
  // reed roof (thatch), deep eaves
  gableEnds(g, W, D - 0.2, 0.16 + H, 1.3, C.thatchD, -0.1);
  thatchX(g, W, D, 0.16 + H, 1.4, 909, 0, 0.6);
  // cane bundles leaning on the front, right of the door, tied with two bands each
  for (let k = 0; k < 4; k++) {
    const x = dx + DW / 2 + 0.6 + k * 0.42;
    g.boxR(x, 1.05, D / 2 + 0.28, 0.26, 2.0, 0.26, k % 2 ? C.cane : C.caneG, -0.12, 0, (k - 1.5) * 0.05);
    for (const y of [0.55, 1.45]) g.boxR(x, y, D / 2 + 0.28 + (y - 1.05) * 0.12, 0.29, 0.07, 0.29, C.ropeD, -0.12, 0, (k - 1.5) * 0.05);
  }
  f.flat(dx + DW / 2 + 0.3, D / 2 + 0.1, dx + DW / 2 + 2.3, D / 2 + 0.6, 0.006, C.sandW);
}

/** The duck-keeper's little hut on the sandbar: short stilts, a reed roof, a duck pen of bamboo. */
function duckHut(g, f, it) {
  const W = it.w || 3.2, D = it.d || 2.6, FL = 0.6, TOP = FL + 1.8;
  f.flat(-W / 2 - 0.2, -D / 2 - 0.2, W / 2 + 0.5, D / 2 + 0.4, 0.004, C.sandD);
  for (const x of [-W / 2 + 0.12, W / 2 - 0.12]) for (const z of [-D / 2 + 0.12, D / 2 - 0.12]) g.box(x, FL / 2, z, 0.16, FL, 0.16, C.tar);
  g.box(0, FL - 0.05, 0, W, 0.12, D, C.woodGD);
  g.box(0, (FL + TOP) / 2, -0.05, W - 0.06, TOP - FL, D - 0.1, C.thatch);
  for (let x = -W / 2 + 0.15, i = 0; x < W / 2; x += 0.3, i++) if (Math.abs(x - 0.5) > 0.45) g.box(x, (FL + TOP) / 2, D / 2 - 0.02, 0.3, TOP - FL, 0.06, i % 2 ? C.thatchL : C.thatch);
  g.box(0.5, FL + 0.75, D / 2, 0.8, 1.45, 0.06, C.interior);
  for (let k = 0; k < 2; k++) g.box(0.5, FL - 0.2 - k * 0.2, D / 2 + 0.3 + k * 0.25, 0.7, 0.06, 0.25, C.woodL);
  gableEnds(g, W, D - 0.1, TOP, 1.0, C.thatchD, -0.05);
  thatchX(g, W, D, TOP, 1.1, 77, 0, 0.4);
  // a bucket of grain, a paddle leaning
  g.box(-W / 2 + 0.4, 0.2, D / 2 + 0.5, 0.36, 0.4, 0.36, C.zinc);
  g.boxR(W / 2 + 0.15, 1.0, D / 2 - 0.3, 0.12, 2.0, 0.05, C.woodL, 0, 0, -0.15);
}

/** A tea stall on the quay: a lean-to on four poles, a brazier and kettle, glasses, low tables and stools. */
function teaHut(g, f, it, ctx) {
  const W = it.w || 4.2, D = it.d || 2.4;
  f.flat(-W / 2 - 0.5, -D / 2 - 0.3, W / 2 + 0.6, D / 2 + 2.2, 0.004, C.shadow);
  for (const x of [-W / 2 + 0.1, W / 2 - 0.1]) { g.box(x, 1.3, -D / 2 + 0.1, 0.12, 2.6, 0.12, C.bambooD); g.box(x, 1.15, D / 2 - 0.1, 0.12, 2.3, 0.12, C.bambooD); }
  g.boxR(0, 2.48, 0, W + 0.6, 0.08, D + 0.8, C.zincD, 0.14, 0, 0);
  for (let x = -W / 2; x <= W / 2; x += 0.7) g.boxR(x, 2.53, 0, 0.06, 0.04, D + 0.8, shade(C.zincD, 0.8), 0.14, 0, 0);
  g.box(0, 1.25, -D / 2 + 0.06, W - 0.2, 2.4, 0.08, C.woodGL);
  // counter with glasses and a tea pot, a brazier with a big kettle
  g.box(-0.4, 0.45, -D / 2 + 0.6, W - 1.6, 0.9, 0.55, C.woodG);
  g.box(-0.4, 0.92, -D / 2 + 0.6, W - 1.5, 0.05, 0.65, C.woodL);
  for (let k = 0; k < 6; k++) g.box(-1.3 + k * 0.22, 1.0, -D / 2 + 0.52 + (k % 2) * 0.12, 0.09, 0.12, 0.09, k % 3 ? C.glass : C.white);
  g.box(0.4, 1.06, -D / 2 + 0.6, 0.24, 0.24, 0.24, C.white); g.box(0.4, 1.2, -D / 2 + 0.6, 0.1, 0.05, 0.1, C.gold);
  g.box(W / 2 - 0.55, 0.35, -D / 2 + 0.55, 0.5, 0.7, 0.5, C.terraD);
  g.box(W / 2 - 0.55, 0.72, -D / 2 + 0.55, 0.42, 0.06, 0.42, '#E8A94A');
  g.box(W / 2 - 0.55, 0.92, -D / 2 + 0.55, 0.4, 0.34, 0.4, C.zinc);
  g.box(W / 2 - 0.3, 1.0, -D / 2 + 0.55, 0.18, 0.05, 0.05, C.zinc);
  { const [sx, sz] = world(g, W / 2 - 0.55, -D / 2 + 0.55); ctx.smoke.push(sx, 1.35, sz); }
  // jars of snacks, a calendar, a hanging lamp
  for (let k = 0; k < 3; k++) { g.box(-1.6 + k * 0.32, 1.12, -D / 2 + 0.75, 0.24, 0.3, 0.24, C.glass); g.box(-1.6 + k * 0.32, 1.06, -D / 2 + 0.75, 0.2, 0.16, 0.2, [C.ochre, C.red, C.leafL][k]); }
  g.box(-0.9, 1.75, -D / 2 + 0.12, 0.4, 0.5, 0.02, C.white); g.box(-0.9, 1.92, -D / 2 + 0.13, 0.4, 0.14, 0.02, C.red);
  g.box(0.2, 2.15, 0, 0.2, 0.26, 0.2, C.mustard);
  // low tables and tiny stools out front
  for (const [x, z] of [[-1.1, D / 2 + 0.7], [1.0, D / 2 + 1.0]]) {
    g.box(x, 0.36, z, 0.8, 0.05, 0.6, C.woodL);
    for (const sx of [-0.33, 0.33]) for (const sz of [-0.24, 0.24]) g.box(x + sx, 0.17, z + sz, 0.05, 0.34, 0.05, C.woodD);
    g.box(x - 0.15, 0.44, z, 0.09, 0.12, 0.09, C.glass);
    for (const [sx, sz, c] of [[-0.62, 0.1, C.red], [0.62, 0.1, C.blue], [0.0, 0.62, C.ochre]]) { g.box(x + sx, 0.22, z + sz, 0.3, 0.05, 0.3, c); g.box(x + sx, 0.1, z + sz, 0.22, 0.2, 0.22, shade(c, 0.8)); }
  }
  if (it.label !== false) ctx.signs.push({ x: 0, y: 2.25, z: D / 2 + 0.42, ry: 0, w: 1.9, h: 0.48, lines: [{ text: 'လက်ဖက်ရည်', size: 46 }, { text: 'Tea', ...SIGN_EN }], bg: '#FCE6C4', width: 420, height: 112 });
}

/** A hand crane on the quay's edge: an A-frame, a boom out over the water, a rope net of sacks. */
function derrick(g, f, it) {
  f.flat(-1.4, -1.4, 1.6, 1.6, 0.004, C.shadow);
  g.box(0, 0.15, 0, 1.6, 0.3, 1.6, C.stoneD);
  for (const sx of [-1, 1]) g.boxR(sx * 0.45, 2.4, 0, 0.22, 4.8, 0.22, C.woodD, 0, 0, sx * -0.1);
  g.box(0, 4.6, 0, 0.9, 0.22, 0.22, C.woodD);
  g.boxR(1.9, 4.3, 0, 4.2, 0.18, 0.18, C.woodD, 0, 0, 0.18);
  g.box(3.85, 4.62, 0, 0.24, 0.3, 0.24, C.iron);
  g.box(3.85, 3.4, 0, 0.03, 2.2, 0.03, C.rope);
  // the hanging net of sacks
  g.box(3.85, 2.05, 0, 0.9, 0.62, 0.9, C.olive);
  for (let k = 0; k < 3; k++) g.box(3.7 + (k % 2) * 0.3, 2.05 + (k - 1) * 0.15, (k - 1) * 0.2, 0.42, 0.24, 0.32, C.jute);
  // the winch with its handle and coiled rope
  g.box(0, 1.0, 0.35, 0.95, 0.36, 0.36, C.woodG);
  for (const sx of [-0.55, 0.55]) g.box(sx, 1.0, 0.35, 0.06, 0.5, 0.06, C.iron);
  g.boxR(-0.62, 1.15, 0.6, 0.05, 0.5, 0.05, C.iron, 0.7, 0, 0);
  coil(g, -0.9, 0.9, 0.3);
}

/** The east bank: a tall page still folded in the mist (a crease down it, nothing to land on). Its face
 * looks west (-X); drawn soft (no outlines) in fog tones. len along Z. */
function mistBank(g, f, it) {
  const L = it.len || 40, Hh = it.h || 9;
  const r = rng(it.seed || 21);
  // the page in two leaves meeting at a crease (a shallow V toward the stream)
  for (const s of [-1, 1]) {
    f.boxR(-0.2, Hh / 2 - 2.5, s * L / 4, 0.25, Hh, L / 2 + 0.2, s < 0 ? '#EFEDE7' : '#E9E8E3', 0, s * 0.14, 0);
    f.boxR(-0.38, Hh / 2 - 2.5, s * L / 4, 0.05, Hh - 2.4, L / 2 - 2, '#F4F2EE', 0, s * 0.14, 0);
  }
  f.box(-1.6, Hh / 2 - 2.5, 0, 0.12, Hh, 0.16, '#D9D8D2'); // the crease
  // faint rules on the folded leaf, washing out upward
  for (let k = 0; k < 6; k++) f.boxR(-0.42, -0.5 + k * 1.1, -L / 4, 0.02, 0.05, L / 2 - 3, k < 3 ? '#DCE1E8' : '#E6E9EE', 0, -0.14, 0);
  // mist: wide soft banks in front of it and drifting across
  for (let k = 0; k < 9; k++) {
    const z = -L / 2 + (k + 0.5) * (L / 9) + (r() - 0.5) * 2, w = 3 + r() * 3, y = -1.2 + r() * 2.2;
    f.box(-3.5 - r() * 3, y, z, w, 0.9 + r() * 0.8, 5 + r() * 3, k % 2 ? C.mist : C.mistB);
    f.box(-2.5 - r() * 2, y + 1.6 + r() * 2.5, z + 1.5, w * 0.8, 0.5 + r() * 0.5, 4 + r() * 3, '#F6F5F2');
  }
  f.box(-6, -1.6, 0, 8, 0.6, L, '#EDEEF0');
}

/** No drawing: a footprint for the notebook map (jetties, the sandbar). */
function mapMark() {}

// ---------------------------------------------------------------------------------
// Props (PROP)
// ---------------------------------------------------------------------------------
/** A plank jetty on posts (item-local: length along X, the quay end at -len/2). Walkable via REGION.walk.
 * it: { len, w, name: { my, en }, end (Jetty End's landing), low (the sandbar's low jetties), lamp, cargo, ladder } */
function wJetty(g, f, it, ctx) {
  const L = it.len, W = it.w || 1.8, x0 = -L / 2, low = !!it.low;
  const post = low ? 1.0 : 2.4;
  for (let x = x0, k = 0; x < L / 2 - 0.05; x += 0.42, k++) {
    const c = k % 5 === 0 ? C.woodGD : k % 3 === 0 ? C.woodGL : C.woodG;
    g.box(x + 0.2, 0.0, ((k * 37) % 7 - 3) * 0.01, 0.38, 0.12, W + ((k * 13) % 3) * 0.04, c);
    if (k % 9 === 4) g.box(x + 0.2, 0.065, 0, 0.36, 0.01, 0.02, C.dark); // a nail line
  }
  for (const sz of [-1, 1]) g.box(0, -0.14, sz * (W / 2 - 0.15), L, 0.16, 0.14, C.woodGD);
  for (let x = x0 + 1.0; x < L / 2; x += 2.1) for (const sz of [-1, 1]) {
    g.box(x, -post / 2 - 0.05, sz * (W / 2 - 0.02), 0.2, post, 0.2, C.tar);
    g.box(x, WATER_Y + (low ? 0.38 : 0.05), sz * (W / 2 - 0.02), 0.26, 0.1, 0.26, '#5E4330'); // a tide ring
  }
  // cross-braces under the deck
  for (let x = x0 + 2.05; x < L / 2 - 1; x += 4.2) g.boxR(x, -0.7, 0, 0.08, 0.08, W * 1.2, C.woodD, 0.5, 0, 0);
  // a low rail along the north side (the camera's side stays open)
  if (!low) {
    for (let x = x0 + 1.8; x < L / 2 - 0.4; x += 1.9) g.box(x, 0.36, -W / 2 + 0.06, 0.1, 0.62, 0.1, C.woodGD);
    g.box(0.6, 0.64, -W / 2 + 0.06, L - 3, 0.06, 0.06, C.rope);
  }
  // the mooring post at the tip with its rope
  g.box(L / 2 - 0.3, 0.42, W / 2 - 0.25, 0.26, 0.9, 0.26, C.tar);
  g.box(L / 2 - 0.3, 0.9, W / 2 - 0.25, 0.32, 0.06, 0.32, C.iron);
  g.boxR(L / 2 - 0.05, 0.52, W / 2 - 0.25, 0.5, 0.05, 0.05, C.rope, 0, 0, -0.5);
  if (it.ladder !== false && !low) {
    for (const sz of [-0.2, 0.2]) g.box(L / 2 - 1.4 + sz, -0.4, W / 2 + 0.07, 0.06, 1.0, 0.06, C.woodD);
    for (let y = -0.75; y < 0; y += 0.25) g.box(L / 2 - 1.4, y, W / 2 + 0.09, 0.42, 0.05, 0.05, C.wood);
  }
  if (it.lamp) {
    g.box(L / 2 - 0.9, 1.1, -W / 2 + 0.15, 0.12, 2.2, 0.12, C.tar);
    g.box(L / 2 - 0.9, 2.25, -W / 2 + 0.15, 0.3, 0.36, 0.3, C.iron);
    g.box(L / 2 - 0.9, 2.25, -W / 2 + 0.15, 0.22, 0.26, 0.22, '#F6D98A');
    { const [gx, gz] = world(g, L / 2 - 0.9, -W / 2 + 0.15); ctx.glows.push(gx, 2.25, gz); }
  }
  // cargo on the deck
  if (it.cargo === 'sacks') { for (let k = 0; k < 4; k++) sackFlat(g, x0 + 2.2 + (k % 2) * 0.75, 0.06 + Math.floor(k / 2) * 0.26, -0.2, k * 0.2); sack(g, x0 + 3.3, 0.06, 0.35, 0.9, 0.4); }
  if (it.cargo === 'firewood') for (let row = 0; row < 3; row++) for (let i = 0; i < 4 - row; i++) g.box(x0 + 2.6 + i * 0.3 + row * 0.15, 0.2 + row * 0.24, -0.25, 0.26, 0.24, 1.0, shade(C.wood, 0.85 + ((i + row) % 3) * 0.1));
  if (it.cargo === 'fish') { for (let k = 0; k < 3; k++) { g.box(x0 + 2.4 + k * 0.6, 0.2, -0.35, 0.5, 0.3, 0.4, C.bambooD); g.box(x0 + 2.4 + k * 0.6, 0.36, -0.35, 0.4, 0.04, 0.3, C.fish); } coil(g, x0 + 4.6, 0.25, 0.26, 0.06); }
  if (it.cargo === 'crates') { crate(g, x0 + 2.4, 0.06, -0.3, 0.6, 0.2); crate(g, x0 + 3.1, 0.06, -0.35, 0.55, -0.15); crate(g, x0 + 2.6, 0.66, -0.3, 0.5, 0.4); }
  // Jetty End: a wider landing at the tip (desk room), its planks laid the other way
  if (it.end) {
    const ex = L / 2 - 3.5;
    for (let z = -4.0, k = 0; z < 4.0; z += 0.46, k++) g.box(ex, 0.005, z + 0.23, 7.0, 0.11, 0.42, k % 4 === 0 ? C.woodGL : C.woodG);
    for (const [px, pz] of [[-3.3, -3.8], [3.3, -3.8], [-3.3, 3.8], [3.3, 3.8], [0, -3.8], [0, 3.8]]) g.box(ex + px, -1.25, pz, 0.22, 2.5, 0.22, C.tar);
    for (const sz of [-1, 1]) g.box(ex, -0.14, sz * 3.85, 7.0, 0.16, 0.14, C.woodGD);
    // the end of the planks: a mooring post with a frayed rope, nothing beyond
    g.box(ex + 3.25, 0.5, 0.6, 0.3, 1.0, 0.3, C.tar);
    g.box(ex + 3.25, 1.02, 0.6, 0.36, 0.06, 0.36, C.iron);
    for (let k = 0; k < 3; k++) g.boxR(ex + 3.5 + k * 0.05, 0.6 - k * 0.12, 0.6 + (k - 1) * 0.06, 0.4, 0.035, 0.035, C.rope, 0, (k - 1) * 0.4, -0.7 - k * 0.15);
    // a low rail along its north and east edge
    for (let z = -3.6; z < 3.7; z += 1.2) g.box(ex + 3.4, 0.35, z, 0.08, 0.6, 0.08, C.woodGD);
    g.box(ex + 3.4, 0.64, 0, 0.06, 0.06, 7.2, C.rope);
  }
  // the name board on a post at the shore end, facing the street side (+Z)
  if (it.name) {
    const nx = x0 + (low ? 0.6 : 1.0), nz = W / 2 + 0.25;
    for (const sx of [-0.62, 0.62]) g.box(nx + sx, 0.55 + (low ? 0 : 0), nz, 0.1, 1.5, 0.1, C.tar);
    ctx.signs.push({ x: nx, y: 1.12, z: nz + 0.07, w: 1.45, h: 0.52, lines: [{ text: it.name.my, size: 54 }, { text: it.name.en, ...SIGN_EN }], bg: '#F4EEDC', border: '#7A5434', width: 400, height: 144 });
  }
  // the quay end: a footing decal
  f.flat(-L / 2 - 0.3, -W / 2 - 0.2, -L / 2 + 1.2, W / 2 + 0.2, 0.006, C.shadowD);
}

/** Ko Thiha's old raft: bamboo floats, planks, seven cloth patches, the pole with its new grip, a loose rope. */
function oldRaft(g, f, it) {
  const y = WATER_Y + 0.1, L = 3.2;
  for (let i = 0; i < 8; i++) g.box(0, y, -0.7 + i * 0.2, L - (i % 2) * 0.1, 0.17, 0.17, i % 3 ? C.bambooD : C.bamboo);
  for (const x of [-1.2, 0, 1.2]) g.box(x, y + 0.1, 0, 0.12, 0.06, 1.7, C.bambooD);
  for (let k = 0; k < 5; k++) g.box(-1.0 + k * 0.5, y + 0.15, 0, 0.44, 0.05, 1.3, jitter(C.woodG, 0.08, k + 61));
  // seven patches, each a different cloth, a stitch line round each
  [[-1.1, -0.35], [-0.55, 0.3], [-0.05, -0.4], [0.4, 0.25], [0.85, -0.3], [1.15, 0.35], [-1.25, 0.4]].forEach(([x, z], k) => {
    g.box(x, y + 0.185, z, 0.34, 0.02, 0.3, CLOTH[k]);
    g.box(x, y + 0.2, z, 0.2, 0.01, 0.02, shade(CLOTH[k], 0.6));
  });
  // a stool, a water pot, the pole lying across with its bright new grip
  g.box(0.9, y + 0.33, -0.05, 0.3, 0.3, 0.3, C.woodD);
  g.box(-0.7, y + 0.33, 0.45, 0.3, 0.3, 0.3, C.terra);
  g.boxR(0, y + 0.26, -0.15, 3.6, 0.07, 0.07, C.bamboo, 0, 0.1, 0);
  g.boxR(1.25, y + 0.26, -0.28, 0.32, 0.1, 0.1, C.red, 0, 0.1, 0);
  // the rope back to the jetty post, slack
  g.boxR(-1.9, y + 0.4, 0.2, 1.3, 0.04, 0.04, C.rope, 0, 0.2, 0.45);
  // cloud puffs round the floats (it sits on the stream)
  for (const [x, z, s] of [[-1.7, 0.6, 0.6], [1.7, -0.6, 0.5], [0.4, 0.95, 0.45]]) f.box(x, WATER_Y - 0.05, z, s * 1.8, s * 0.4, s, C.cloud);
}

/** A cargo raft of bamboo (sacks on it) or a little wooden sampan, moored. kind: 'raft' | 'sampan'. */
function boat(g, f, it) {
  const y = WATER_Y;
  if (it.kind === 'sampan') {
    const L = it.len || 4.2;
    g.box(0, y + 0.12, 0, L - 0.8, 0.36, 0.95, it.col || C.woodG);
    for (const sx of [-1, 1]) {
      g.boxR(sx * (L / 2 - 0.55), y + 0.25, 0, 0.8, 0.3, 0.7, it.col || C.woodG, 0, 0, sx * 0.35);
      g.boxR(sx * (L / 2 - 0.15), y + 0.45, 0, 0.3, 0.16, 0.4, shade(it.col || C.woodG, 0.85), 0, 0, sx * 0.5);
    }
    g.box(0, y + 0.31, 0, L - 1.0, 0.04, 0.72, C.dark);
    for (const x of [-0.8, 0.5]) g.box(x, y + 0.34, 0, 0.12, 0.06, 0.8, C.woodL);
    g.box(-0.3, y + 0.42, 0, 0.6, 0.12, 0.5, CLOTH[(it.seed || 0) % 8]);
    g.boxR(0.4, y + 0.45, 0.25, 2.4, 0.05, 0.05, C.woodL, 0, 0.12, 0);
    // a half-roof of matting at the stern
    g.boxR(-(L / 2 - 1.2), y + 0.75, 0, 1.0, 0.06, 1.0, C.thatch, 0, 0, 0);
    for (const s of [-0.45, 0.45]) g.box(-(L / 2 - 1.2), y + 0.55, s, 0.05, 0.4, 0.05, C.bambooD);
  } else {
    const L = it.len || 4.4;
    for (let i = 0; i < 9; i++) g.box(0, y + 0.08, -0.9 + i * 0.22, L - (i % 2) * 0.12, 0.18, 0.18, i % 3 ? C.bambooD : C.bamboo);
    for (const x of [-1.5, 0, 1.5]) g.box(x, y + 0.2, 0, 0.12, 0.06, 2.0, C.bambooD);
    for (let k = 0; k < 5; k++) sackFlat(g, -1.0 + (k % 3) * 0.75, y + 0.2 + Math.floor(k / 3) * 0.26, -0.2 + (k % 2) * 0.35, k * 0.2);
    g.box(1.3, y + 0.35, 0.5, 0.4, 0.3, 0.4, C.terra);
  }
  for (const [x, z, s] of [[-(it.len || 4) / 2, 0.5, 0.6], [(it.len || 4) / 2, -0.4, 0.5]]) f.box(x, y - 0.06, z, s * 1.8, s * 0.4, s, C.cloud);
}

/** The new ferry at Big Jetty: cream and teal over a deep dark hull, a windowed cabin, cargo on the fore
 * deck, and a crewman at the +Z rail bailing over the side with a bucket (it has to read from the quay). */
function ferry(g, f, it) {
  const L = 9, B = 2.6, y0 = WATER_Y;
  const hull = (ya, yb, col, sx = 1, sz = 1) => {
    const y = y0 + (ya + yb) / 2, h = yb - ya;
    g.box(-0.4, y, 0, (L - 1.6) * sx, h, B * sz, col);
    g.box(L / 2 - 1.0, y, 0, 1.4 * sx, h, B * 0.72 * sz, col);
    g.box(L / 2 - 0.15, y, 0, 0.5 * sx, h, B * 0.38 * sz, col);
    g.box(-L / 2 + 0.2, y, 0, 0.4 * sx, h, B * 0.86 * sz, col);
  };
  hull(-0.5, -0.05, C.hullD, 0.96, 0.84);
  hull(-0.05, 0.62, C.hull);
  hull(0.62, 0.72, C.hullCream, 1.006, 1.012);
  hull(0.72, 0.94, C.teal, 1.01, 1.02);
  g.box(0, y0 + 0.96, 0, L - 0.6, 0.05, B + 0.08, C.goldD);
  g.box(-0.4, y0 + 0.9, 0, L - 2.0, 0.04, B - 0.3, C.woodL); // deck
  // portholes, a name band painted on the bow
  for (let x = -3.2; x < 3.4; x += 1.1) for (const s of [-1, 1]) { g.box(x, y0 + 0.3, s * (B / 2 + 0.01), 0.22, 0.22, 0.03, C.hullCream); g.box(x, y0 + 0.3, s * (B / 2 + 0.03), 0.14, 0.14, 0.03, C.glass); }
  for (const s of [-1, 1]) g.box(L / 2 - 1.2, y0 + 0.82, s * (B * 0.36 + 0.02), 0.9, 0.12, 0.02, C.maroon);
  // the cabin
  g.box(-1.0, y0 + 1.6, 0, 3.6, 1.3, 1.9, C.hullCream);
  for (let x = -2.4; x < 0.6; x += 0.7) for (const s of [-1, 1]) g.box(x, y0 + 1.75, s * 0.96, 0.46, 0.5, 0.04, C.glass);
  g.box(-1.0, y0 + 2.32, 0, 4.0, 0.12, 2.3, C.teal);
  g.box(-1.0, y0 + 2.42, 0, 3.4, 0.08, 1.7, C.tealD);
  for (let k = 0; k < 3; k++) g.box(-2.2 + k * 1.0, y0 + 2.6, 0, 0.7, 0.3, 0.7, [C.jute, C.white, C.juteL][k]); // luggage on the roof
  g.box(-2.6, y0 + 2.9, -0.6, 0.18, 0.9, 0.18, C.iron); g.box(-2.6, y0 + 3.38, -0.6, 0.26, 0.08, 0.26, C.ink); // stove pipe
  // fore deck: benches, crates, a coil; rope fenders over the side
  g.box(2.4, y0 + 1.1, -0.5, 1.4, 0.3, 0.4, C.woodD);
  crate(g, 2.6, y0 + 0.92, 0.5, 0.55, 0.3);
  coil(g, 3.6, 0, 0.24, y0 + 0.92);
  for (const x of [-2.5, 0.0, 2.2]) for (const s of [-1, 1]) g.box(x, y0 + 0.5, s * (B / 2 + 0.12), 0.24, 0.4, 0.16, C.ropeD);
  // a flag at the stern
  g.box(-L / 2 + 0.6, y0 + 1.7, 0, 0.05, 1.6, 0.05, C.woodD);
  g.box(-L / 2 + 0.35, y0 + 2.3, 0, 0.5, 0.32, 0.02, C.red);
  // the crewman bailing at the +Z rail, the bucket out over the side, a spill of water falling
  figure(g, 0.9, B / 2 - 0.35, 0, '#4E8C86', '#3E5F7A', '#B07A52', 'lean', y0 + 0.92);
  g.box(0.9, y0 + 0.92 + 1.12, B / 2 + 0.12, 0.3, 0.26, 0.28, C.zinc);
  g.box(0.9, y0 + 0.92 + 1.24, B / 2 + 0.12, 0.32, 0.04, 0.3, C.zincD);
  for (let k = 0; k < 4; k++) f.box(0.92 + (k % 2) * 0.06, y0 + 1.4 - k * 0.32, B / 2 + 0.36 + k * 0.05, 0.12, 0.2, 0.12, '#CFE3F0');
  // it sits on the stream: cloud bunched along the waterline, a little bow wave
  for (const [x, z, s] of [[-3.5, B / 2 + 0.3, 0.8], [0.2, B / 2 + 0.35, 0.7], [3.4, B / 2 + 0.2, 0.7], [-2, -B / 2 - 0.3, 0.8], [2, -B / 2 - 0.3, 0.7], [L / 2 + 0.3, 0, 0.6]]) {
    f.box(x, y0 - 0.12, z, s * 2.2, s * 0.45, s * 1.1, C.cloud);
    f.box(x + 0.3, y0 - 0.32, z, s * 1.6, s * 0.3, s * 1.2, C.cloudMid);
  }
  // (the crewman is art; the story's ferryman is a person a day can place on Big Jetty)
  void it;
}

/** The cloud-stream itself (soft, no outlines): near the quay a surface of low cloud the boats float on,
 * farther out the deep channel with puffs far below; 'side' = the shallow side channel by the sandbar. */
function cloudWater(g, f, it) {
  const r = rng(it.seed || 99);
  const w = it.w, d = it.d;
  const n = Math.round((w * d) / (it.kind === 'side' ? 22 : 34));
  for (let k = 0; k < n; k++) {
    const x = (r() - 0.5) * w, z = (r() - 0.5) * d;
    const surface = it.kind === 'side' || r() < 0.55;
    const sz = surface ? 1.2 + r() * 1.6 : 2 + r() * 2.4;
    const y = surface ? WATER_Y - 0.22 - r() * 0.35 : -2.4 - r() * 2.6;
    f.box(x, y, z, sz * 1.7, sz * 0.32, sz * 1.1, surface ? (k % 3 ? C.cloud : C.cloudBlue) : C.cloudMid);
    f.box(x + sz * 0.3, y + sz * 0.2, z - 0.1, sz * 0.9, sz * 0.3, sz * 0.7, C.cloud);
    if (!surface) f.box(x, y - sz * 0.3, z, sz * 1.3, sz * 0.18, sz * 0.9, C.cloudLow);
    else if (k % 4 === 0) f.box(x - sz * 0.4, y - 0.18, z + 0.3, sz * 1.2, 0.2, sz * 0.9, C.cloudShade);
  }
  // the shallow side channel: sand showing through the cloud, a few ripples of light
  if (it.kind === 'side') for (let k = 0; k < Math.round((w * d) / 30); k++) {
    const x = (r() - 0.5) * w, z = (r() - 0.5) * d;
    f.box(x, WATER_Y - 0.36, z, 1.2 + r() * 1.6, 0.12, 0.6 + r() * 1.0, k % 2 ? C.sandW : C.sandD);
  }
}

/** The sandbar: a long low bank of sand in the stream (walkable via REGION.walk), wet at the edges,
 * ripples, shells, driftwood, reeds. w x d centred on the item. */
function sandbar(g, f, it) {
  const W = it.w, D = it.d, r = rng(it.seed || 31);
  f.flat(-W / 2, -D / 2, W / 2, D / 2, 0.0, C.sand);
  // the body (soft, no outline): layers of drier and wetter sand going down into the cloud
  f.box(0, -0.25, 0, W + 0.5, 0.5, D + 0.5, C.sandD);
  f.box(0, -0.62, 0, W + 1.4, 0.3, D + 1.4, C.sandW);
  f.box(0, WATER_Y - 0.15, 0, W + 2.6, 0.12, D + 2.6, '#DCCFB0');
  for (const [a, b] of [[-W / 2 - 0.25, 0.5], [W / 2 + 0.25, 0.5]]) f.box(a, -0.02, 0, b, 0.04, D + 0.4, C.sandW);
  // ripples, a wet band, shells
  for (let k = 0; k < Math.round(D * W / 9); k++) f.flatR((r() - 0.5) * (W - 1), (r() - 0.5) * (D - 1), 0.8 + r() * 1.4, 0.07, 0.004, C.sandD, (r() - 0.5) * 0.4);
  for (let k = 0; k < Math.round(D * W / 14); k++) f.flatR((r() - 0.5) * (W - 1), (r() - 0.5) * (D - 1), 0.1, 0.08, 0.006, k % 2 ? C.white : '#E8C9B8', r() * 3);
  // reed clumps along both shores
  for (let z = -D / 2 + 1; z < D / 2 - 0.5; z += 2.2 + r() * 1.8) for (const sx of [-1, 1]) {
    if (r() < 0.35) continue;
    const x = sx * (W / 2 - 0.4 - r() * 0.6);
    for (let k = 0; k < 4; k++) g.box(x + (r() - 0.5) * 0.5, 0.45 + r() * 0.2, z + (r() - 0.5) * 0.5, 0.06, 0.9 + r() * 0.5, 0.06, k % 2 ? C.oliveD : C.olive);
    g.box(x, 1.05, z, 0.1, 0.22, 0.1, C.thatchD);
  }
  // driftwood
  g.boxR((r() - 0.5) * (W - 3), 0.1, (r() - 0.5) * (D - 4), 1.8, 0.16, 0.18, C.silver, 0, r() * 3, 0.05);
}

/** A shoal: a flat patch of sand just under the cloud's surface (the shallow side channel). */
function shoal(g, f, it) {
  const r = rng(it.seed || 5);
  for (let k = 0; k < 3; k++) f.boxR((r() - 0.5) * it.w * 0.5, WATER_Y - 0.28 + k * 0.03, (r() - 0.5) * it.d * 0.5, it.w * (1 - k * 0.25), 0.1, it.d * (1 - k * 0.3), [C.sandW, C.sandD, C.sand][k], 0, r() * 0.5, 0);
}

/** The quay: planks over the ledger paper from the road to the water's edge, a heavy kerb with bollards
 * and old fenders, cleats; w x d centred on the item (planks run east-west). */
function quayDeck(g, f, it) {
  const W = it.w, D = it.d, r = rng(it.seed || 12);
  f.flat(-W / 2, -D / 2, W / 2, D / 2, 0.003, '#CDBA98');
  for (let z = -D / 2 + 0.24, k = 0; z < D / 2; z += 0.48, k++) {
    // two plank lengths per row, joints staggered
    const j = -W / 2 + 2 + ((k * 37) % 5) * 0.9 + r() * 0.4;
    f.flat(-W / 2 + 0.02, z - 0.22, j - 0.02, z + 0.22, 0.0045, jitter(C.woodGL, 0.06, k * 3));
    f.flat(j + 0.02, z - 0.22, W / 2 - 0.02, z + 0.22, 0.0045, jitter(C.woodG, 0.05, k * 3 + 1));
    if (k % 7 === 3) f.flat(j - 0.9, z - 0.04, j - 0.5, z + 0.04, 0.0055, C.woodGD);
  }
  if (it.kerb !== false) {
    // the kerb on the water side (+X edge) with bollards and fenders
    g.box(W / 2 - 0.2, 0.12, 0, 0.4, 0.24, D, C.tar);
    for (let z = -D / 2 + 2; z < D / 2 - 1; z += it.bollards || 7.5) {
      if ((it.skip || []).some(([a, b]) => z > a && z < b)) continue;
      g.box(W / 2 - 0.45, 0.3, z, 0.3, 0.6, 0.3, C.iron);
      g.box(W / 2 - 0.45, 0.64, z, 0.4, 0.12, 0.4, C.iron);
      g.box(W / 2 + 0.06, -0.3, z + 1.8, 0.24, 0.6, 0.5, '#2B2522');
    }
  }
}

/** Handwritten ledger entries on the paper (no outline): figures in the money columns, ticks, a total
 * line, in faded blue and red ink. w x d area. */
function entries(g, f, it) {
  const r = rng(it.seed || 3), W = it.w || 8, D = it.d || 6;
  const inks = ['#9AA3B8', '#A6AEC2', '#C49A92'];
  for (let z = -D / 2 + 0.6; z < D / 2; z += 1.5) {
    if (r() < 0.25) continue;
    let x = -W / 2 + r() * 1.2;
    const ink = inks[r() < 0.8 ? Math.floor(r() * 2) : 2];
    while (x < W / 2 - 0.8) {
      const n = 2 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) f.flatR(x + k * 0.2, z - 0.42, 0.13, 0.05 + (k % 2) * 0.03, 0.0052, ink, (r() - 0.5) * 0.5);
      if (r() < 0.25) { f.flatR(x + n * 0.2 + 0.15, z - 0.4, 0.14, 0.04, 0.0052, ink, 0.8); f.flatR(x + n * 0.2 + 0.26, z - 0.45, 0.24, 0.04, 0.0052, ink, -0.9); }
      x += n * 0.2 + 1.4 + r() * 2.2;
    }
    if (r() < 0.15) f.flat(-W / 4, z - 0.2, W / 4, z - 0.16, 0.0052, inks[2]);
  }
}

/** A pile of jute sacks (6-9), a tarp corner over some. */
function sacks(g, f, it) {
  const r = rng(it.seed || 2), n = it.n || 7;
  f.flat(-1.0, -0.7, 1.2, 0.8, 0.005, C.shadow);
  for (let k = 0; k < n; k++) {
    const row = k < 4 ? 0 : k < 7 ? 1 : 2, i = row === 0 ? k : row === 1 ? k - 4 : k - 7;
    sackFlat(g, -0.75 + i * 0.5 + row * 0.25, row * 0.26, (r() - 0.5) * 0.2, (r() - 0.5) * 0.3, r() < 0.3 ? C.juteL : C.jute);
  }
  if (it.tarp) g.boxR(-0.4, 0.62, 0.05, 1.3, 0.05, 0.9, C.teal, 0, 0.1, 0.15);
}
/** A stack of crates and a drum or two. */
function crates(g, f, it) {
  const r = rng(it.seed || 4);
  f.flat(-0.9, -0.7, 1.1, 0.7, 0.005, C.shadow);
  crate(g, -0.4, 0, 0, 0.62, r() * 0.3); crate(g, 0.3, 0, 0.1, 0.56, -r() * 0.3); crate(g, -0.2, 0.62, 0.05, 0.5, r() * 0.5);
  if (it.drum !== false) { g.box(0.85, 0.42, -0.25, 0.5, 0.84, 0.5, r() < 0.5 ? C.indigo : C.rust); g.box(0.85, 0.85, -0.25, 0.52, 0.04, 0.52, C.zincD); g.box(0.85, 0.42, -0.25, 0.54, 0.05, 0.54, C.zincD); }
}
/** Oil drums. */
function drums(g, f, it) {
  const cols = [C.indigo, C.rust, C.teal, C.red];
  f.flat(-0.8, -0.6, 0.9, 0.6, 0.005, C.shadow);
  [[-0.3, 0], [0.3, 0.1], [0, -0.45]].forEach(([x, z], k) => { const c = cols[((it.seed || 0) + k) % 4]; g.box(x, 0.42, z, 0.5, 0.84, 0.5, c); for (const y of [0.25, 0.6]) g.box(x, y, z, 0.54, 0.05, 0.54, shade(c, 0.8)); g.box(x, 0.85, z, 0.46, 0.03, 0.46, shade(c, 1.1)); });
}
/** A rope coil (prop). */
function ropeCoil(g, f, it) { coil(g, 0, 0, it.r || 0.34); f.flat(-0.45, -0.45, 0.5, 0.5, 0.005, C.shadow); }
/** An iron bollard. */
function bollard(g) { g.box(0, 0.3, 0, 0.3, 0.6, 0.3, C.iron); g.box(0, 0.64, 0, 0.4, 0.12, 0.4, C.iron); }
/** A net drying on two poles, floats along its top. */
function netRack(g, f, it) {
  const L = it.len || 3.2;
  f.flat(-L / 2 - 0.2, -0.4, L / 2 + 0.3, 0.6, 0.005, C.shadow);
  for (const sx of [-1, 1]) g.box(sx * L / 2, 1.0, 0, 0.1, 2.0, 0.1, C.bambooD);
  g.box(0, 1.95, 0, L + 0.2, 0.07, 0.07, C.bamboo);
  g.box(0, 1.2, 0, L - 0.1, 1.45, 0.04, C.olive);
  for (let x = -L / 2 + 0.3; x < L / 2; x += 0.36) g.box(x, 1.2, 0.02, 0.025, 1.45, 0.02, C.oliveD);
  for (const y of [0.8, 1.3]) g.box(0, y, 0.02, L - 0.1, 0.025, 0.02, C.oliveD);
  for (let x = -L / 2 + 0.25; x < L / 2; x += 0.4) g.box(x, 1.88, 0.03, 0.12, 0.1, 0.1, Math.round(x * 3) % 2 ? C.white : C.red);
  for (let k = 0; k < 3; k++) f.box(-L / 2 + 0.6 + k * 0.9, 0.06, 0.25, 0.5, 0.1, 0.3, C.olive);
}
/** A rack of fish drying in the sun: a bamboo table with rows of little silver fish (no outlines on the fish). */
function fishRack(g, f, it) {
  const L = it.len || 2.6;
  f.flat(-L / 2 - 0.2, -0.6, L / 2 + 0.3, 0.7, 0.005, C.shadow);
  for (const sx of [-1, 1]) for (const sz of [-0.4, 0.4]) g.box(sx * (L / 2 - 0.1), 0.38, sz, 0.07, 0.76, 0.07, C.bambooD);
  g.box(0, 0.78, 0, L, 0.05, 0.95, C.bamboo);
  for (let x = -L / 2 + 0.2; x < L / 2 - 0.1; x += 0.22) for (let z = -0.35; z < 0.4; z += 0.18) f.flatR(x, z, 0.16, 0.07, 0.85, (Math.round(x * 9 + z * 5)) % 3 ? C.fish : C.fishD, 0); // (flat on the slats: 2 triangles a fish)
}
/** A boat drawn up on blocks for mending (a sampan, upside down or keel down). */
function boatBlocks(g, f, it) {
  const L = it.len || 4.2, col = it.col || C.woodG;
  f.flat(-L / 2 - 0.3, -0.8, L / 2 + 0.4, 0.9, 0.005, C.shadow);
  for (const x of [-1.2, 1.2]) g.box(x, 0.15, 0, 0.4, 0.3, 1.0, C.woodD);
  g.box(0, 0.5, 0, L - 0.8, 0.4, 0.95, col);
  for (const sx of [-1, 1]) g.boxR(sx * (L / 2 - 0.5), 0.62, 0, 0.8, 0.32, 0.7, col, 0, 0, sx * 0.35);
  g.box(0, 0.7, 0, L - 1.0, 0.04, 0.72, C.dark);
  g.box(0.6, 0.55, 0.49, 0.8, 0.2, 0.02, C.ochre); // a new plank, not yet tarred
  g.box(-0.8, 0.12, 0.8, 0.4, 0.24, 0.3, C.tar); // a tar pot
  g.boxR(-0.4, 0.05, 0.85, 0.6, 0.05, 0.08, C.woodL, 0, 0.4, 0);
}
/** Maung Nge's hand cart: two wheels, a bed with two shelves, each with a word-and-picture tag (duck, fish), parcels. */
function handCart(g, f, it) {
  f.flat(-1.0, -0.6, 1.1, 0.7, 0.005, C.shadow);
  for (const sz of [-0.55, 0.55]) { g.box(0.15, 0.32, sz, 0.64, 0.64, 0.08, C.woodD); g.box(0.15, 0.32, sz, 0.12, 0.12, 0.12, C.iron); }
  g.box(0.15, 0.62, 0, 1.4, 0.08, 1.0, C.wood);
  for (const sz of [-0.42, 0.42]) g.boxR(-0.9, 0.6, sz, 1.2, 0.06, 0.06, C.woodD, 0, 0, -0.12);
  for (const x of [-0.45, 0.75]) g.box(x, 0.95, 0, 0.06, 0.62, 0.92, C.woodD);
  g.box(0.15, 1.05, 0, 1.3, 0.05, 0.9, C.woodL); // the upper shelf
  // tags: a duck on the lower shelf, a fish on the upper
  g.box(0.15, 0.78, 0.5, 0.36, 0.22, 0.02, C.white); g.box(0.1, 0.78, 0.52, 0.14, 0.1, 0.01, C.mustard); g.box(0.2, 0.82, 0.52, 0.06, 0.06, 0.01, C.mustard);
  g.box(0.15, 1.2, 0.47, 0.36, 0.2, 0.02, C.white); g.box(0.15, 1.2, 0.49, 0.2, 0.06, 0.01, C.sky); g.box(0.27, 1.2, 0.49, 0.05, 0.1, 0.01, C.sky);
  for (let k = 0; k < 3; k++) { g.box(-0.1 + k * 0.4, 0.8, -0.1, 0.32, 0.26, 0.4, k % 2 ? '#B98A5A' : '#C9A274'); g.box(-0.1 + k * 0.4, 0.8, -0.1, 0.34, 0.03, 0.03, C.ink); }
  for (let k = 0; k < 2; k++) { g.box(0.0 + k * 0.45, 1.2, -0.05, 0.36, 0.26, 0.36, k ? '#C9A274' : '#B98A5A'); g.box(0.0 + k * 0.45, 1.2, -0.05, 0.03, 0.27, 0.37, C.ink); }
}
/** A pile of brown-paper parcels the ferry turned away: labels with little pictures (duck, cane). */
function parcelPile(g, f, it) {
  const r = rng(it.seed || 6);
  f.flat(-0.8, -0.6, 0.9, 0.6, 0.005, C.shadow);
  const pos = [[-0.4, 0, 0], [0.2, 0, 0.1], [0.6, 0, -0.2], [-0.1, 0.32, 0.0], [0.4, 0.32, 0], [0.1, 0.6, 0.05]];
  pos.forEach(([x, y, z], k) => {
    const w = 0.42 + r() * 0.12, h = 0.3, d = 0.36 + r() * 0.1, ry = (r() - 0.5) * 0.5;
    g.box(x, y + h / 2, z, w, h, d, k % 2 ? '#B98A5A' : '#C9A274', ry);
    g.box(x, y + h / 2, z, w + 0.01, 0.03, 0.04, C.ink, ry);
    g.box(x, y + h + 0.002, z, 0.16, 0.01, 0.12, C.white, ry);
    g.box(x, y + h + 0.008, z, 0.07, 0.01, 0.06, k % 2 ? C.mustard : C.caneG, ry);
  });
}
/** A trishaw (bicycle with a sidecar) parked. */
function trishaw(g, f, it) {
  const col = it.col || C.teal;
  f.flat(-1.0, -0.8, 1.1, 0.9, 0.005, C.shadow);
  const wheel = (x, z) => { g.box(x, 0.33, z, 0.62, 0.62, 0.05, C.ink); g.box(x, 0.33, z, 0.44, 0.44, 0.03, '#8E8173'); };
  wheel(-0.5, -0.35); wheel(0.5, -0.35); wheel(0.1, 0.55);
  g.box(0, 0.62, -0.35, 1.0, 0.06, 0.06, col); g.box(-0.2, 0.8, -0.35, 0.26, 0.06, 0.14, C.ink); g.box(0.48, 0.95, -0.35, 0.06, 0.06, 0.5, C.ink);
  g.box(0.05, 0.62, 0.35, 1.1, 0.1, 0.75, col);
  g.box(0.05, 0.85, 0.35, 0.9, 0.12, 0.6, C.maroon);
  g.box(-0.4, 1.0, 0.35, 0.08, 0.6, 0.65, col);
  g.boxR(0.05, 1.45, 0.4, 1.1, 0.05, 0.8, C.cream, 0, 0, 0.12);
  for (const x of [-0.45, 0.5]) g.box(x, 1.15, 0.72, 0.04, 0.6, 0.04, C.iron);
}
/** A toddy palm: a tall ringed trunk, a ball of fan leaves. */
function palm(g, f, it) {
  const s = it.s || 1, H = 6.2 * s;
  f.flatR(0.4, -0.3, 2.4 * s, 2.0 * s, 0.004, C.shadow, 0.3);
  for (let k = 0; k < 7; k++) g.box(0, (k + 0.5) * (H / 7), 0, 0.42 - k * 0.02, H / 7 + 0.02, 0.42 - k * 0.02, k % 2 ? '#6E5A44' : '#5E4C3A');
  g.box(0, H + 0.1, 0, 0.7, 0.5, 0.7, '#5E4C3A');
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
    g.boxR(c * 0.9 * s, H + 0.35 + (k % 2) * 0.2, sn * 0.9 * s, 1.5 * s, 0.08, 0.9 * s, k % 2 ? C.leaf : C.leafD, 0, -a, k % 2 ? 0.3 : -0.1);
  }
  g.box(0, H + 0.75, 0, 0.5, 0.6, 0.5, C.leafL);
  for (const [x, z] of [[0.3, 0.3], [-0.3, 0.2], [0, -0.35]]) g.box(x, H - 0.2, z, 0.2, 0.22, 0.2, '#3A2E25'); // fruit
}
/** A banana clump (low). */
function banana(g, f, it) {
  const r = rng(it.seed || 8);
  f.flatR(0, 0, 2.0, 1.6, 0.004, C.shadow, 0.3);
  for (let k = 0; k < 3; k++) {
    const x = (r() - 0.5) * 0.8, z = (r() - 0.5) * 0.6, h = 1.3 + r() * 0.6;
    g.box(x, h / 2, z, 0.2, h, 0.2, '#8DA05C');
    for (let j = 0; j < 4; j++) { const a = j * 1.6 + k; g.boxR(x + Math.cos(a) * 0.5, h + 0.1, z + Math.sin(a) * 0.5, 1.0, 0.05, 0.36, j % 2 ? C.leafL : C.leaf, 0, -a, 0.35); }
  }
}
/** Ducks on the sand (or by a pen): white bodies, orange bills. */
function ducks(g, f, it) {
  const r = rng(it.seed || 9), n = it.n || 5;
  for (let k = 0; k < n; k++) {
    const x = (r() - 0.5) * (it.w || 2.4), z = (r() - 0.5) * (it.d || 1.4), ry = r() * 6.28, c = k === 2 ? '#C9B79A' : C.white;
    const fx = Math.sin(ry) * 0.17, fz = Math.cos(ry) * 0.17;
    g.box(x, 0.16, z, 0.24, 0.18, 0.24, c, ry);
    g.box(x + fx, 0.3, z + fz, 0.12, 0.16, 0.12, c);
    g.box(x + fx * 1.6, 0.3, z + fz * 1.6, 0.09, 0.04, 0.09, '#E8963A');
    g.box(x - fx * 0.8, 0.22, z - fz * 0.8, 0.1, 0.08, 0.1, shade(c, 0.85));
  }
  for (let k = 0; k < 6; k++) f.flatR((r() - 0.5) * 2, (r() - 0.5) * 1.2, 0.08, 0.08, 0.006, C.sandW);
}
/** A low bamboo pen fence (len along X). */
function bambooFence(g, f, it) {
  const L = it.len || 4;
  for (let x = -L / 2; x <= L / 2 + 0.01; x += 0.35) g.box(x, 0.32, 0, 0.07, 0.64, 0.07, C.bambooD);
  for (const y of [0.22, 0.52]) g.box(0, y, 0, L, 0.05, 0.05, C.bamboo);
}
/** Old U Bo Lay's post on the cane landing: a thick mooring post, worn flat on top, a folded towel on it. */
function oldPost(g) {
  g.box(0, 0.42, 0, 0.42, 0.84, 0.42, C.tar);
  g.box(0, 0.86, 0, 0.46, 0.05, 0.46, '#6E5A44');
  g.box(0.02, 0.9, 0, 0.36, 0.05, 0.3, C.cream);
  g.box(0, 0.4, 0, 0.46, 0.08, 0.46, C.rope);
}
/** A small plank landing on the sand (w x d), planks along X. */
function landing(g, f, it) {
  const W = it.w, D = it.d;
  for (let z = -D / 2 + 0.22, k = 0; z < D / 2; z += 0.44, k++) g.box(0, 0.02, z, W, 0.08, 0.4, k % 3 ? C.woodG : C.woodGL);
}
/** An outdoor cane rack under a reed roof on four poles (cane laid across, one length half-turned). */
function caneRack(g, f, it) {
  f.flat(-1.5, -0.8, 1.6, 0.9, 0.005, C.sandD);
  for (const sx of [-1.15, 1.15]) for (const sz of [-0.45, 0.45]) g.box(sx, 0.9, sz, 0.1, 1.8, 0.1, C.bambooD);
  for (const y of [0.5, 0.9, 1.3]) for (const sz of [-0.45, 0.45]) g.box(0, y, sz, 2.4, 0.06, 0.06, C.bamboo);
  for (const y of [0.56, 0.96, 1.36]) for (let x = -1.0; x < 1.1; x += 0.13) g.box(x, y, 0, 0.06, 0.06, 1.05, (Math.round(x * 10) + Math.round(y * 10)) % 3 ? C.cane : C.caneG);
  g.boxR(0.3, 0.98, 0.1, 0.06, 0.06, 1.05, C.caneD, 0, 0.5, 0);
  g.box(0, 1.92, 0, 2.8, 0.14, 1.4, C.thatch);
  g.box(0, 2.02, 0, 2.5, 0.08, 1.1, C.thatchL);
}
/** Cane bundles stacked on the sand, tied tight with two bands each. */
function caneBundles(g, f, it) {
  const n = it.n || 6;
  f.flat(-1.2, -0.6, 1.3, 0.6, 0.005, C.sandD);
  for (let k = 0; k < n; k++) {
    const row = k < 4 ? 0 : 1, i = row ? k - 4 : k;
    const x = -0.75 + i * 0.5 + row * 0.25, y = 0.15 + row * 0.28;
    g.box(x, y, 0, 0.28, 0.28, 2.0, k % 2 ? C.cane : C.caneG);
    for (const z of [-0.55, 0.55]) g.box(x, y, z, 0.31, 0.31, 0.08, C.ropeD);
  }
}
/** A hand pump and a stone trough. */
function pump(g, f) {
  f.flat(-0.8, -0.5, 0.9, 0.6, 0.005, C.shadowD);
  g.box(0, 0.5, 0, 0.18, 1.0, 0.18, C.indigo);
  g.box(0, 1.02, 0, 0.26, 0.1, 0.26, C.indigoL);
  g.box(0.16, 0.82, 0, 0.3, 0.08, 0.08, C.indigo);
  g.boxR(-0.3, 1.15, 0, 0.6, 0.06, 0.06, C.iron, 0, 0, 0.4);
  g.box(0.35, 0.2, 0, 0.7, 0.4, 0.5, C.stoneD);
  g.box(0.35, 0.38, 0, 0.6, 0.04, 0.4, '#9CC3DE');
}
/** The district's name board at the lane's foot: a giant account book standing open (ruled columns on
 * both pages), the name painted on the right page. */
function ledgerSign(g, f, it, ctx) {
  f.flat(-2.1, -0.9, 2.3, 1.0, 0.005, C.shadow);
  for (const s of [-1, 1]) {
    g.boxR(s * 0.86, 1.25, 0.15, 1.6, 2.1, 0.12, C.ledger, 0, s * -0.32, 0);
    g.boxR(s * 0.86, 1.25, 0.08, 1.7, 2.2, 0.08, C.maroon, 0, s * -0.32, 0);
  }
  g.box(0, 1.25, 0.0, 0.18, 2.2, 0.2, C.maroonD || '#4A141C');
  g.box(0, 0.12, 0.1, 2.8, 0.24, 0.9, C.woodD);
  // ruled columns on the left page (painted lines)
  for (let k = 0; k < 6; k++) g.boxR(-0.86, 0.55 + k * 0.28, 0.23, 1.4, 0.025, 0.01, C.bRule, 0, 0.32, 0);
  for (const x of [-0.45, 0.0]) g.boxR(-0.86 + x * 0.95 + 0.25, 1.25, 0.23 - x * 0.3, 0.02, 1.8, 0.01, C.rRule, 0, 0.32, 0);
  ctx.signs.push({ x: 0.86, y: 1.35, z: 0.24, ry: -0.32, w: 1.45, h: 1.2, lines: [{ text: 'စာရင်းစာအုပ်', size: 44 }, { text: 'ဆိပ်', size: 50 }, { text: 'Ledger Wharf', size: 22, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: null, border: null, width: 512, height: 420 });
  g.box(1.6, 0.5, 0.5, 0.3, 0.3, 0.3, C.terra); g.box(1.6, 0.72, 0.5, 0.34, 0.2, 0.34, C.leaf);
}
/** A quay-side cat asleep on a crate, a dog under a cart: tiny life. */
function cat(g) { g.box(0, 0.12, 0, 0.42, 0.2, 0.26, '#E2B07A'); g.box(0.2, 0.2, 0.02, 0.18, 0.16, 0.18, '#E2B07A'); for (const sz of [-0.05, 0.05]) g.box(0.26, 0.3, sz, 0.04, 0.06, 0.04, '#C89060'); g.boxR(-0.25, 0.08, 0.1, 0.3, 0.06, 0.06, '#C89060', 0, 0.8, 0); }
function dog(g) { g.box(0, 0.16, 0, 0.6, 0.24, 0.3, '#B08A62'); g.box(0.36, 0.22, 0, 0.24, 0.2, 0.22, '#B08A62'); g.box(0.5, 0.2, 0, 0.1, 0.1, 0.12, '#3A2E25'); for (const sz of [-0.09, 0.09]) g.box(0.36, 0.34, sz, 0.06, 0.1, 0.05, '#8E6A48'); g.boxR(-0.38, 0.14, 0.05, 0.3, 0.06, 0.06, '#8E6A48', 0, 0.5, 0); }

// ---------------------------------------------------------------------------------
// Registration tables (regions/wharf.js re-exports these as its ART / PROP)
// ---------------------------------------------------------------------------------
const box = (w, d, ox = 0, oz = 0) => (it) => {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const cx = it.x + ox * c + oz * s, cz = it.z - ox * s + oz * c;
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return [{ type: 'box', minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd }];
};
const none = () => [];

export const WHARF_ART = {
  // houses on stilts: the house and its posts; the veranda steps stay walkable round their foot
  wStilt: { draw: wStilt, h: 5.4, map: true, obstacles: (it) => box(it.w, it.d + 1.2, 0, 0.5)(it) },
  wGodown: { draw: wGodown, h: 7.0, map: true, obstacles: (it) => box(it.w + 0.1, it.d + 1.5, 0, 0.7)(it) },
  wShop: { draw: wShop, h: 6.2, map: true, obstacles: (it) => box(it.w, it.d - 0.2, 0, -0.1)(it) },
  weighHouse: { draw: weighHouse, h: 6.4, map: true, obstacles: (it) => [...box(it.w, it.d)(it), ...box(2.2, it.d - 1.0, it.w / 2 + 1.1, 0)(it)] },
  sandaHouse: { draw: sandaHouse, h: 5.6, map: true, obstacles: (it) => box(it.w, it.d + 1.0, 0, 0.5)(it) },
  caneShed: { draw: caneShed, h: 4.4, map: true, obstacles: (it) => box(it.w, it.d)(it) },
  duckHut: { draw: duckHut, h: 3.6, map: true, obstacles: (it) => box(it.w || 3.2, it.d || 2.6)(it) },
  teaHut: { draw: teaHut, h: 2.9, obstacles: (it) => box((it.w || 4.2) - 0.4, 1.2, 0, -(it.d || 2.4) / 2 + 0.6)(it) },
  derrick: { draw: derrick, h: 5.2, obstacles: (it) => box(1.6, 1.6)(it) },
  palm: { draw: palm, h: 7.2, obstacles: (it) => [{ type: 'circle', x: it.x, z: it.z, r: 0.3 }] },
  mistBank: { draw: mistBank, obstacles: none },
  wMapMark: { draw: mapMark, map: true, obstacles: none },
};
export const WHARF_PROP = {
  wJetty: { draw: wJetty, obstacles: (it) => {
    const L = it.len, W = it.w || 1.8, out = [];
    if (it.end) out.push({ type: 'circle', x: it.x + L / 2 - 0.25, z: it.z + 0.6, r: 0.25 });
    else out.push({ type: 'circle', x: it.x + L / 2 - 0.3, z: it.z + W / 2 - 0.25, r: 0.2 });
    if (it.name) for (const sx of [-0.62, 0.62]) out.push({ type: 'circle', x: it.x - L / 2 + (it.low ? 0.6 : 1.0) + sx, z: it.z + W / 2 + 0.25, r: 0.1 });
    return out;
  } },
  oldRaft: { draw: oldRaft, obstacles: none },
  boat: { draw: boat, obstacles: none },
  ferry: { draw: ferry, obstacles: none },
  cloudWater: { draw: cloudWater, obstacles: none },
  sandbar: { draw: sandbar, obstacles: none },
  shoal: { draw: shoal, obstacles: none },
  quayDeck: { draw: quayDeck, obstacles: none },
  entries: { draw: entries, obstacles: none },
  sacks: { draw: sacks, r: 0.8 },
  crates: { draw: crates, r: 0.75 },
  drums: { draw: drums, r: 0.6 },
  ropeCoil: { draw: ropeCoil, r: 0.38 },
  bollard: { draw: bollard, r: 0.22 },
  netRack: { draw: netRack, obstacles: (it) => box((it.len || 3.2) + 0.2, 0.3)(it) },
  fishRack: { draw: fishRack, obstacles: (it) => box((it.len || 2.6) + 0.1, 1.0)(it) },
  boatBlocks: { draw: boatBlocks, obstacles: (it) => box((it.len || 4.2), 1.1)(it) },
  handCart: { draw: handCart, obstacles: (it) => box(2.0, 1.2, -0.2, 0)(it) },
  parcelPile: { draw: parcelPile, r: 0.65 },
  trishaw: { draw: trishaw, obstacles: (it) => box(1.5, 1.4, 0, 0.1)(it) },
  banana: { draw: banana, r: 0.5 },
  ducks: { draw: ducks, obstacles: none },
  bambooFence: { draw: bambooFence, obstacles: (it) => box(it.len || 4, 0.16)(it) },
  oldPost: { draw: oldPost, r: 0.26 },
  landing: { draw: landing, obstacles: none },
  caneRack: { draw: caneRack, obstacles: (it) => box(2.5, 1.0)(it) },
  caneBundles: { draw: caneBundles, obstacles: (it) => box(1.9, 2.0)(it) },
  pump: { draw: pump, obstacles: (it) => box(1.1, 0.6, 0.15, 0)(it) },
  ledgerSign: { draw: ledgerSign, obstacles: (it) => box(3.4, 1.0, 0, 0.1)(it) },
  cat: { draw: cat, obstacles: none },
  dog: { draw: dog, obstacles: none },
};
