// The Envelope Market's own buildings and props (District 2; Days 4-7 and 14), drawn into the open world's merged
// chunk meshes (kit.js Geo: g = outlined solids, f = flat ground decals and tiny unoutlined bits). Imported by
// regions/market.js, which re-exports ART and PROP (format: regions/index.js). Imports only kit.js / toon.js /
// voxel.js. Item-local space: metres, fronts face +Z (the street camera), feet at y = 0.
//
// The Market's look (original): a town of posted things on an unfolded letter. Houses with an envelope's
// flap for a gable and a wax seal at its point; shophouses whose upper fronts are framed like postage stamps
// (white perforated border round a coloured field); parcel-wrapped sheds tied with twine; airmail stripes
// (red / cream / blue) along eaves; stalls roofed with giant stamps. Kraft browns, letter cream, stamp reds,
// greens, golds and blues. Every Burmese string is a draft for Maya.
//
// ART (buildings; h = how tall for the cutaway; w/d give the map footprint and the default keep-out box):
//   mkHouse { w, d, seed, style: 'env' | 'stamp' | 'parcel', shop? }   townhouses
//   postOffice { w: 14, d: 8 }       main door (local x -0.5) + post-room door (local x w/2 - 1.4), flag board
//   teaShop { w: 8, d: 8 }           recessed veranda (walls 1.2 back), striped stamp awning, chimney steam
//   riceShop { w: 8, d: 7 }          the free-food shop, sign over the door, no names anywhere
//   sundries { w: 6, d: 5.6 }        Ma Yu Yu's: bead-curtain door, «ကုန်စုံ» board
//   carverRow { w: 11, d: 6 }        three carvers' shops under striped awnings (1 m recess); the third is Ko Lwin's
//   stampStall { color, goods, seed, back? }   an open stall roofed with a giant postage stamp (h 2.3)
//   gateSign                         the district's name board at the crease
// PROP:
//   pageCrease { len }  thanaka  planeTable  bambooPost  pump  envCrates { w }  riceCart  dogBed  dog { seed }
//   trishaw  crates { seed }  sacks { seed }  mailSacks  postBox  lowTea  hawkerMat { seed }  stampLine { len }
//   planters { seed }  scribe  cat  goat  handcart  postmark { seed }  paving { w, d }  signature  kiteRack
//   flatStone
import { PALETTE } from '../../../game/toon.js';
import { jitter } from '../../../game/voxel.js';
import { shade, rng } from '../kit.js';

export const K = {
  kraft: '#D6B486', kraftD: '#B8935F', kraftL: '#E7CFA4', env: '#EBDCBF', envL: '#F5EBD6', cream: '#F6EEDB', paper: '#FBF6EA',
  red: '#C8323C', redD: '#9C2832', blue: '#2F5DB3', blueD: '#24488A', teal: '#3E8C8A', green: '#4F8A4F', greenD: '#3A6B3C',
  gold: PALETTE.gold, goldD: PALETTE.goldDeep, mustard: '#E2B33C', maroon: PALETTE.maroon, maroonD: PALETTE.maroonDeep,
  wood: PALETTE.wood, woodD: PALETTE.woodDark, woodL: '#CDA577', ink: PALETTE.ink, iron: '#4A3B30', glass: '#BFD3E0',
  white: PALETTE.white, terra: '#B5643C', terraL: '#CB7E4E', terraD: '#8E4A2C', brick: '#A0503A', stone: '#C4BBA8', stoneD: '#9F9683',
  shadow: '#E3D8BE', twine: '#B89A6A', dark: '#3A2E25', pink: '#E8A0A8', sky: '#9CC3DE', leaf: PALETTE.leaf, leafD: PALETTE.leafDark,
  leafL: '#8DBA6E', tin: '#B3B0A6', tinD: '#8C8981', violet: '#7E5BA6', rice: '#F7F3E8', ash: '#9A958C',
};
const STAMP = { red: ['#C8323C', '#9C2832'], green: ['#4F8A4F', '#3A6B3C'], gold: ['#D9A93B', '#B08425'], blue: ['#3F6FB5', '#2D5590'], violet: ['#7E5BA6', '#5F4382'], teal: ['#3E8C8A', '#2C6B6A'] };
const STAMP_KEYS = Object.keys(STAMP);
const AIRMAIL = [K.red, K.cream, K.blue, K.cream];

/** item-local (x, z) -> world, for glows and smoke (g.tx/g.tz origin, g.tc/g.ts its turn). */
const wx = (g, x, z) => g.tx + x * g.tc + z * g.ts;
const wz = (g, x, z) => g.tz - x * g.ts + z * g.tc;

// ---------------------------------------------------------------------------------
// Small builders
// ---------------------------------------------------------------------------------
/** A band of airmail stripes along a front (x0..x1 at height y, face z). */
function airmail(g, x0, x1, y, z, h = 0.16, step = 0.32) {
  let i = 0;
  for (let x = x0; x < x1 - 0.01; x += step, i++) {
    const w = Math.min(step, x1 - x);
    g.box(x + w / 2, y, z, w + 0.002, h, 0.05, AIRMAIL[i % 4]);
  }
}
/** A window with a frame, a sill, shutters and (usually) a curtain. */
function win(g, x, y, z, w, h, shut, curtain = K.white) {
  const f = FLAT_G || g;
  g.box(x, y, z, w + 0.14, h + 0.14, 0.08, K.white);
  f.box(x, y, z + 0.045, w, h, 0.02, K.glass); // (pane, curtain and mullion unoutlined: the phone budget)
  f.box(x, y + h * 0.18, z + 0.06, w * 0.92, h * 0.5, 0.01, curtain);
  f.box(x, y, z + 0.068, 0.05, h, 0.01, K.white);
  g.box(x, y - h / 2 - 0.09, z + 0.08, w + 0.26, 0.06, 0.18, K.goldD);
  if (shut) for (const sx of [-1, 1]) {
    g.box(x + sx * (w / 2 + 0.2), y, z + 0.04, 0.3, h, 0.05, shut);
    f.box(x + sx * (w / 2 + 0.2), y, z + 0.075, 0.2, h * 0.72, 0.02, shade(shut, 0.82));
  }
}
/** An open doorway: dark inside, a frame, a step; leaves folded back (none for a curtain). */
function doorway(g, x, z, w, h, leaf = K.greenD, frame = K.woodD) {
  g.box(x, h / 2 + 0.1, z + 0.01, w, h, 0.06, K.dark);
  g.box(x, h + 0.16, z + 0.03, w + 0.24, 0.14, 0.1, frame);
  for (const sx of [-1, 1]) g.box(x + sx * (w / 2 + 0.06), h / 2 + 0.1, z + 0.03, 0.12, h, 0.1, frame);
  if (leaf) for (const sx of [-1, 1]) {
    g.box(x + sx * (w / 2 + 0.17), h / 2 + 0.1, z + 0.2, 0.06, h - 0.06, w / 2 - 0.02, leaf, 0);
    g.box(x + sx * (w / 2 + 0.21), h / 2 + 0.1, z + 0.2, 0.02, h * 0.6, w / 2 - 0.2, shade(leaf, 1.15));
  }
  g.box(x, 0.06, z + 0.25, w + 0.4, 0.12, 0.5, K.stone);
}
/** A hipped stepped roof (rows of tiles from above). */
function tileRoof(g, W, D, y0, color, steps = 5, stepH = 0.28) {
  const w0 = W + 0.6, d0 = D + 0.6;
  g.box(0, y0 + 0.06, 0, w0 + 0.1, 0.12, d0 + 0.1, K.woodD);
  for (let i = 0; i < steps; i++) {
    const k = i / steps, w = w0 - k * Math.min(W * 0.45, 3.0), d = d0 * (1 - k * 0.9), y = y0 + 0.12 + stepH * (i + 0.5);
    g.box(0, y, 0, w, stepH, d, i % 2 ? color : shade(color, 0.9));
    g.box(0, y + stepH / 2 - 0.03, d / 2 - 0.06, w + 0.02, 0.07, 0.14, shade(color, 1.18));
  }
  g.box(0, y0 + 0.12 + stepH * steps + 0.07, 0, w0 - Math.min(W * 0.45, 3.0) + 0.2, 0.14, 0.26, K.goldD);
}
/** A gable roof, ridge along X, corrugated tin or tile strips. */
function gable(g, W, D, y0, rise, color, over = 0.35) {
  const half = D / 2 + over, ang = Math.atan2(rise, D / 2), slope = half / Math.cos(ang);
  for (const sz of [-1, 1]) {
    g.boxR(0, y0 + rise / 2 + 0.06, (sz * half) / 2, W + over * 2, 0.12, slope, color, sz * ang, 0, 0);
    for (let k = 0; k < 3; k++) {
      const t = (k + 0.5) / 3;
      g.boxR(0, y0 + rise * (1 - t) + 0.16, sz * half * t, W + over * 2 + 0.02, 0.04, 0.08, shade(color, 0.82), sz * ang, 0, 0);
    }
  }
  g.box(0, y0 + rise + 0.12, 0, W + over * 2 + 0.06, 0.14, 0.3, K.goldD);
}
/** Stepped gable infill (the triangle under a gable roof). */
function gableFill(g, W, D, y0, rise, color) {
  for (let i = 0; i < 4; i++) g.box(0, y0 + (rise * (i + 0.5)) / 4, 0, W - 0.04, rise / 4, D * (1 - (i + 0.5) / 4), color);
}
/** The envelope flap: a stepped triangle proud of a front wall (z), point down at yTip, with a wax seal. */
function flap(g, W, yTop, yTip, z, col, seal = K.red) {
  const f = FLAT_G || g;
  const steps = 4, h = (yTop - yTip) / steps;
  for (let i = 0; i < steps; i++) {
    const w = W * (1 - i / steps) - 0.1;
    g.box(0, yTop - h * (i + 0.5), z, w, h + 0.002, 0.06, i % 2 ? col : shade(col, 0.96));
    f.box(0, yTop - h * (i + 1) + 0.02, z + 0.035, w, 0.03, 0.02, shade(col, 0.82)); // its shaded lower edge
  }
  // the wax seal: a squat round disc (two crossed boxes and a cap), a stamped flower on it
  for (let k = 0; k < 4; k++) g.box(0, yTip + 0.05, z + 0.08, 0.5, 0.5, 0.08, k % 2 ? seal : shade(seal, 0.85), (k * Math.PI) / 4);
  g.boxR(0, yTip + 0.05, z + 0.08, 0.46, 0.46, 0.08, seal, 0, 0, Math.PI / 4);
  g.box(0, yTip + 0.05, z + 0.13, 0.22, 0.22, 0.03, shade(seal, 1.25));
}
/** A postage-stamp frame on a front: white border with perforation teeth round a coloured field. */
function stampFace(g, cx, cy, z, w, h, col) {
  const [F, FD] = STAMP[col] || STAMP.red;
  g.box(cx, cy, z, w, h, 0.06, K.white);
  g.box(cx, cy, z + 0.03, w - 0.36, h - 0.36, 0.04, F);
  g.box(cx, cy - h / 2 + 0.38, z + 0.05, w - 0.6, 0.06, 0.02, FD); // the value line
  // perforations: teeth along all four edges (the border scalloped)
  const nx = Math.max(4, Math.round(w / 0.5)), ny = Math.max(4, Math.round(h / 0.5)); // (teeth spaced for the phone budget)
  for (let i = 0; i < nx; i++) for (const sy of [-1, 1]) g.box(cx - w / 2 + (w * (i + 0.5)) / nx, cy + sy * (h / 2 + 0.035), z, (w / nx) * 0.55, 0.07, 0.06, K.white);
  for (let i = 0; i < ny; i++) for (const sx of [-1, 1]) g.box(cx + sx * (w / 2 + 0.035), cy - h / 2 + (h * (i + 0.5)) / ny, z, 0.07, (h / ny) * 0.55, 0.06, K.white);
}
/** A sloping stamp awning: back edge at (zb, yb), front edge at (zf, yf), centred on x; white perforated
 * border, coloured field, a small printed motif (simple shapes). */
function stampRoof(g, cx, zb, yb, zf, yf, w, col, motif = 0, striped = false) {
  const [F, FD] = STAMP[col] || STAMP.red;
  const d = Math.hypot(zf - zb, yf - yb), a = Math.atan2(yb - yf, zf - zb), cz = (zb + zf) / 2, cy = (yb + yf) / 2;
  const nY = Math.cos(a), nZ = Math.sin(a); // the slab's up normal
  const at = (u, v, e) => [cx + u, cy + v * -Math.sin(a) + e * nY, cz + v * Math.cos(a) + e * nZ]; // v along the slope (front +)
  const put = (u, v, e, bw, bh, bd, c) => { const [x, y, z] = at(u, v, e); g.boxR(x, y, z, bw, bh, bd, c, a, 0, 0); };
  put(0, 0, 0, w, 0.06, d, K.white);
  if (striped) {
    const n = Math.max(4, Math.round((w - 0.3) / 0.3));
    for (let i = 0; i < n; i++) put(-(w - 0.3) / 2 + ((w - 0.3) * (i + 0.5)) / n, 0, 0.035, (w - 0.3) / n + 0.002, 0.02, d - 0.3, i % 2 ? K.cream : F);
  } else {
    put(0, 0, 0.035, w - 0.3, 0.02, d - 0.3, F);
    put(0, d / 2 - 0.42, 0.05, w - 0.5, 0.012, 0.05, FD);
  }
  // perforation teeth on all four edges
  const nx = Math.max(4, Math.round(w / 0.5)), nv = Math.max(3, Math.round(d / 0.5)); // (teeth spaced for the phone budget)
  for (let i = 0; i < nx; i++) for (const sv of [-1, 1]) put(-w / 2 + (w * (i + 0.5)) / nx, sv * (d / 2 + 0.04), 0, (w / nx) * 0.55, 0.06, 0.08, K.white);
  for (let i = 0; i < nv; i++) for (const su of [-1, 1]) put(su * (w / 2 + 0.04), -d / 2 + (d * (i + 0.5)) / nv, 0, 0.08, 0.06, (d / nv) * 0.55, K.white);
  // the printed picture (raised a hair): 1 sun over hills, 2 a kite, 3 a padauk sprig, 4 a little boat, 5 a bird
  const M = K.cream, e = 0.055;
  if (motif === 1) { put(-0.3, -0.15, e, 0.34, 0.012, 0.34, K.mustard); put(0.1, 0.25, e, 0.9, 0.012, 0.18, M); put(0.35, 0.12, e, 0.4, 0.012, 0.18, M); }
  else if (motif === 2) { put(0, -0.05, e, 0.34, 0.012, 0.34, M); put(0, 0.3, e, 0.04, 0.012, 0.4, M); put(0.08, 0.45, e, 0.1, 0.012, 0.06, M); }
  else if (motif === 3) { put(0, 0.1, e, 0.05, 0.012, 0.5, M); for (const [u, v] of [[-0.15, -0.05], [0.15, -0.1], [-0.1, -0.25], [0.12, -0.3]]) put(u, v, e, 0.16, 0.012, 0.16, K.mustard); }
  else if (motif === 4) { put(0, 0.2, e, 0.7, 0.012, 0.14, M); put(0, 0.05, e, 0.05, 0.012, 0.36, M); put(0.12, -0.02, e, 0.22, 0.012, 0.22, M); }
  else if (motif === 5) { put(-0.12, 0, e, 0.3, 0.012, 0.08, M); put(0.12, -0.04, e, 0.3, 0.012, 0.08, M); put(0, 0.02, e, 0.1, 0.012, 0.1, M); }
}

/** One storey's worth of shop front: a half-rolled shutter and shelves of goods (W wide, front z). */
function shopFront(g, f, W, z, seed, H = 2.6) {
  const r = rng(seed);
  g.box(0, H / 2 + 0.1, z - 0.1, W - 0.5, H - 0.1, 0.06, '#3A2E25');
  const goods = ['#E2B33C', '#C8323C', '#2F5DB3', '#FFFDF8', '#4E8C86', '#F3B27A', '#D6B486', '#E8A0A8'];
  for (let k = 0; k < 3; k++) {
    g.box(0, 0.55 + k * 0.6, z - 0.02, W - 0.8, 0.06, 0.32, K.woodL);
    for (let x = -W / 2 + 0.6; x < W / 2 - 0.5; x += 0.5) f.box(x, 0.72 + k * 0.6, z, 0.36, 0.28 + (r() < 0.3 ? 0.1 : 0), 0.22, goods[Math.floor(r() * goods.length)]);
  }
  g.box(0, H - 0.05, z + 0.02, W - 0.4, 0.42, 0.16, '#B9B0A2'); // the rolled shutter
  for (let k = 0; k < 3; k++) f.box(0, H - 0.2 + k * 0.11, z + 0.11, W - 0.4, 0.03, 0.02, '#8E8173');
  for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.12), H / 2 + 0.1, z, 0.24, H, 0.24, K.envL);
  // goods spilling out front: baskets, a sack, a stool for the keeper
  g.box(-W / 2 + 0.7, 0.22, z + 0.45, 0.6, 0.44, 0.5, K.woodL);
  f.box(-W / 2 + 0.7, 0.47, z + 0.45, 0.5, 0.08, 0.4, goods[Math.floor(r() * goods.length)]);
  g.box(W / 2 - 0.7, 0.26, z + 0.42, 0.5, 0.52, 0.4, K.kraftD);
  g.box(W / 2 - 0.7, 0.54, z + 0.42, 0.34, 0.08, 0.3, K.twine);
}

// ---------------------------------------------------------------------------------
// ART: the Market's buildings
// ---------------------------------------------------------------------------------
const WALLS = ['#F1E3C4', '#EAD7B3', '#F4EBDA', '#E2C9A0', '#F0DDBA', '#E9D9C0'];
const ROOFS = ['#A0642E', '#8E3B2E', '#3E6F8C', '#6E1F2A', '#4F7F5A', '#B07A3A'];
const SHUTS = [K.teal, K.red, K.blue, K.greenD, K.woodD, K.mustard];

function mkHouse(g, f, it, ctx) {
  const W = it.w, D = it.d, r = rng(it.seed || 1), seed = it.seed || 1;
  const style = it.style || 'env';
  const wall = it.wall || WALLS[seed % WALLS.length], roof = it.roof || ROOFS[(seed >> 2) % ROOFS.length], shut = SHUTS[(seed >> 4) % SHUTS.length];
  f.flat(-W / 2 - 0.25, -D / 2 - 0.3, W / 2 + 0.6, D / 2 + 0.7, 0.004, K.shadow);
  g.box(0, 0.08, 0, W + 0.2, 0.16, D + 0.2, K.stone);
  if (style === 'parcel') {
    // a low shed wrapped like a parcel: kraft walls, twine bands round it, a bow on the roof
    const H = 3.0;
    g.box(0, H / 2 + 0.16, 0, W, H, D, jitter(K.kraft, 0.04, seed));
    for (const sx of [-1, 1]) g.box(sx * W / 2, H / 2 + 0.16, D / 2, 0.14, H, 0.14, K.kraftD);
    g.box(0, H + 0.22, 0, W + 0.1, 0.12, D + 0.1, K.kraftL); // the folded top edge
    g.box(0, H + 0.36, 0, W - 0.2, 0.16, D - 0.2, jitter(K.kraft, 0.05, seed + 1));
    // twine: one band round the front and over the top, one along the length
    const tx = (r() - 0.5) * W * 0.4;
    g.box(tx, H / 2 + 0.2, D / 2 + 0.04, 0.08, H + 0.1, 0.04, K.twine);
    g.box(tx, H + 0.46, 0, 0.08, 0.04, D, K.twine);
    g.box(0, H + 0.46, tx * 0.3, W - 0.2, 0.04, 0.08, K.twine);
    g.box(tx - 0.25, H + 0.6, tx * 0.3, 0.42, 0.2, 0.14, K.twine, 0.4); // the bow
    g.box(tx + 0.25, H + 0.6, tx * 0.3, 0.42, 0.2, 0.14, K.twine, -0.4);
    g.box(tx, H + 0.56, tx * 0.3, 0.14, 0.14, 0.14, shade(K.twine, 0.85));
    // address label (a white slip with ink lines) and a big sliding door
    g.box(W / 2 - 1.1, 2.2, D / 2 + 0.04, 1.2, 0.7, 0.03, K.white);
    for (let k = 0; k < 3; k++) f.box(W / 2 - 1.15, 2.4 - k * 0.17, D / 2 + 0.06, 0.9 - k * 0.15, 0.04, 0.01, K.ink);
    const dx = -W / 2 + 1.6;
    doorway(g, dx, D / 2, 1.8, 2.3, null);
    g.box(dx + 1.5, 1.25, D / 2 + 0.12, 1.3, 2.3, 0.08, K.kraftD); // the slid-back door
    for (let k = 0; k < 4; k++) g.box(dx + 1.5, 0.5 + k * 0.55, D / 2 + 0.17, 1.2, 0.04, 0.02, shade(K.kraftD, 0.85));
    g.box(dx + 0.6, 2.62, D / 2 + 0.12, 2.8, 0.06, 0.06, K.iron); // the door's rail
    win(g, W / 2 - 1.1, 1.3, D / 2 + 0.02, 0.8, 0.7, shut);
    // sacks and a crate by the door
    for (const [x, z, c] of [[dx - 1.0, D / 2 + 0.5, K.rice], [dx - 0.6, D / 2 + 0.9, K.kraftL]]) { g.box(x, 0.3, z, 0.55, 0.6, 0.45, c); g.box(x, 0.64, z, 0.3, 0.1, 0.25, shade(c, 0.85)); }
    if (it.sign) ctx.signs.push({ x: W / 2 - 1.1, y: 3.0, z: D / 2 + 0.08, w: 1.6, h: 0.5, lines: [{ text: it.sign, size: 44 }], bg: '#FBF6EA', width: 384, height: 120 });
    return;
  }
  const H1 = 3.0, H2 = style === 'stamp' ? 5.6 : 5.4;
  // body: ground floor + upper floor, corner posts, a plinth band
  g.box(0, H1 / 2 + 0.16, -0.25, W, H1, D - 0.5, wall);
  g.box(0, (H1 + H2) / 2 + 0.08, -0.05, W, H2 - H1, D - 0.1, shade(wall, 1.02));
  for (const sx of [-1, 1]) g.box(sx * (W / 2), H2 / 2 + 0.1, D / 2 - 0.1, 0.22, H2, 0.22, shade(wall, 0.88));
  g.box(0, 0.32, D / 2 - 0.45, W, 0.3, 0.1, shade(wall, 0.85));
  // ground floor: a shop front (goods, shutter) or a home (door, windows, a bench)
  const shop = it.shop ?? r() < 0.6;
  if (shop) shopFront(g, f, W, D / 2 - 0.5, seed, H1);
  else {
    const dx = (r() - 0.5) * (W - 2.6);
    doorway(g, dx, D / 2 - 0.5, 1.0, 2.1, shut);
    for (const wxp of [-W / 2 + 0.95, W / 2 - 0.95]) if (Math.abs(wxp - dx) > 1.3) win(g, wxp, 1.5, D / 2 - 0.47, 0.8, 0.85, shut);
    g.box(dx + 1.3, 0.3, D / 2 - 0.15, 1.0, 0.08, 0.36, K.woodL); // a doorstep bench
    for (const sx of [-0.4, 0.4]) g.box(dx + 1.3 + sx, 0.14, D / 2 - 0.15, 0.06, 0.28, 0.3, K.woodD);
  }
  // the floor line: airmail stripes (env) or a gold band (stamp), and a little balcony
  if (style === 'env') airmail(g, -W / 2 + 0.1, W / 2 - 0.1, H1 + 0.1, D / 2 + 0.02, 0.18, 0.48);
  else g.box(0, H1 + 0.1, D / 2 + 0.02, W + 0.04, 0.16, 0.14, K.goldD);
  g.box(0, H1 + 0.26, D / 2 + 0.35, W - 0.6, 0.1, 0.7, K.cream);
  for (let x = -W / 2 + 0.4; x <= W / 2 - 0.35; x += 0.55) g.box(x, H1 + 0.55, D / 2 + 0.66, 0.05, 0.5, 0.05, K.woodD);
  g.box(0, H1 + 0.82, D / 2 + 0.66, W - 0.6, 0.06, 0.07, K.gold);
  // potted plants on the balcony, a hung cloth
  for (let k = 0; k < 3; k++) { const px = -W / 2 + 0.7 + k * 0.45; g.box(px, H1 + 0.45, D / 2 + 0.35, 0.26, 0.28, 0.26, K.terra); f.box(px, H1 + 0.68, D / 2 + 0.35, 0.3, 0.24, 0.3, k === 1 ? K.red : K.leaf); }
  g.box(W / 2 - 1.0, H1 + 0.62, D / 2 + 0.7, 0.9, 0.5, 0.03, [K.pink, K.sky, K.mustard, K.white][seed % 4]);
  if (style === 'stamp') {
    // the upper front framed as a postage stamp, two windows inside it; a flat roof that is lived on
    const col = STAMP_KEYS[seed % STAMP_KEYS.length];
    stampFace(g, 0, (H1 + H2) / 2 + 0.25, D / 2 + 0.02, W - 0.5, H2 - H1 - 0.3, col);
    for (const sx of [-1, 1]) win(g, sx * W * 0.22, (H1 + H2) / 2 + 0.35, D / 2 + 0.09, 0.75, 0.9, null, K.cream);
    g.box(0, H2 + 0.16, -0.05, W + 0.16, 0.2, D, K.goldD);
    g.box(0, H2 + 0.42, D / 2 - 0.1, W + 0.1, 0.34, 0.2, shade(wall, 0.96));
    g.box(0, H2 + 0.62, D / 2 - 0.1, W + 0.2, 0.07, 0.26, K.goldD);
    // roof life: a water tank, a stair hut, chillies drying on a mat, a wash line
    const hx = (r() < 0.5 ? -1 : 1) * (W / 2 - 0.95);
    g.box(hx, H2 + 0.9, -D / 2 + 1.0, 1.4, 1.3, 1.3, shade(wall, 0.95));
    g.box(hx, H2 + 1.6, -D / 2 + 1.0, 1.6, 0.12, 1.5, roof);
    g.box(-hx * 0.5, H2 + 0.7, -D / 2 + 0.9, 0.9, 0.9, 0.9, r() < 0.5 ? K.teal : '#3E5F7A');
    g.box(-hx * 0.5, H2 + 1.18, -D / 2 + 0.9, 0.96, 0.08, 0.96, K.iron);
    f.flat(-1.0, 0.2, 0.4, 1.2, H2 + 0.27, '#C9A24A');
    for (let k = 0; k < 6; k++) f.box(-0.85 + (k % 3) * 0.4, H2 + 0.31, 0.45 + Math.floor(k / 3) * 0.45, 0.24, 0.06, 0.18, k % 2 ? K.red : '#E06A3A');
    g.box(0, H2 + 1.25, D / 2 - 0.7, W - 1.4, 0.025, 0.025, K.ink);
    for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.7), H2 + 0.75, D / 2 - 0.7, 0.06, 1.0, 0.06, K.woodD);
    for (let x = -W / 2 + 1.0, i = 0; x < W / 2 - 1.0; x += 0.7, i++) f.box(x, H2 + 1.05, D / 2 - 0.7, 0.42, 0.38, 0.03, [K.pink, K.white, K.sky, K.mustard][(i + seed) % 4]);
  } else {
    // env: upper windows, the envelope flap across the front gable, a tin or tile gable roof
    for (const sx of [-1, 1]) win(g, sx * W * 0.26, (H1 + H2) / 2 + 0.2, D / 2 - 0.03, 0.75, 0.9, shut);
    gableFill(g, W, D - 0.1, H2 + 0.08, 1.6, shade(wall, 0.94));
    flap(g, W - 0.1, H2 + 0.05, H1 + 1.25, D / 2 + 0.06, shade(wall, 0.9), [K.red, K.maroon, '#B5463C'][seed % 3]);
    gable(g, W, D - 0.1, H2 + 0.08, 1.6, roof, 0.38);
    g.box(W / 2 - 0.9, H2 + 1.3, -0.8, 0.4, 0.9, 0.4, K.brick);
    g.box(W / 2 - 0.9, H2 + 1.78, -0.8, 0.48, 0.08, 0.48, '#7E3C2B');
  }
  if (it.sign) ctx.signs.push({ x: 0, y: H1 - 0.15, z: D / 2 + 0.12, w: Math.min(W - 1, 2.6), h: 0.55, lines: [{ text: it.sign, size: 42 }], bg: it.signBg || '#FBF6EA', width: 448, height: 112 });
}

/** The post office's main door and post-room door (item-local x) for a front w wide (regions/market.js SPOTS use these). */
export const poDoorX = (W) => (W >= 12 ? -0.5 : -1.0);
export const poRoomX = (W) => (W >= 12 ? W / 2 - 1.4 : W / 2 - 0.95);
/** Flag n's pulley (item-local x): ၁ at the board's east end ... ၁၆ at the west; the board is 4.6 m over the main door. */
export const poFlagX = (W, n) => poDoorX(W) + 2.3 - 0.14 - ((n - 1) * (4.6 - 0.28)) / 15;

function postOffice(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 3.6, wall = '#F4EAD5', trim = K.maroon;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.7, D / 2 + 0.8, 0.004, K.shadow);
  g.box(0, 0.12, 0, W + 0.3, 0.24, D + 0.3, K.stone);
  g.box(0, H / 2 + 0.24, 0, W, H, D, wall);
  // pilasters, a maroon plinth, a cornice with airmail stripes, a pediment with the clock
  // (a narrow office, w < 12, has pilasters at its corners only and its doors and windows packed closer)
  const wide = W >= 12;
  for (const x of wide ? [-W / 2, -W / 4, W / 4, W / 2] : [-W / 2, W / 2]) g.box(x, H / 2 + 0.24, D / 2 + 0.04, 0.34, H, 0.18, K.cream);
  g.box(0, 0.45, D / 2 + 0.03, W, 0.4, 0.12, trim);
  g.box(0, H + 0.34, D / 2 + 0.06, W + 0.3, 0.2, 0.3, K.goldD);
  airmail(g, -W / 2, W / 2, H + 0.08, D / 2 + 0.09, 0.2, 0.4);
  g.box(0, H + 0.58, 0, W + 0.1, 0.32, D + 0.1, shade(wall, 0.95));
  for (let k = 0; k < 4; k++) g.box(0, H + 0.9 + k * 0.32, D / 2 - 0.1, 5.2 - k * 1.25, 0.32, 0.4, k === 0 ? K.goldD : wall);
  // the clock in the pediment
  g.box(0, H + 1.5, D / 2 + 0.12, 0.8, 0.8, 0.08, K.goldD);
  g.box(0, H + 1.5, D / 2 + 0.17, 0.64, 0.64, 0.04, K.white);
  g.box(0, H + 1.62, D / 2 + 0.2, 0.05, 0.26, 0.02, K.ink);
  g.box(0.08, H + 1.5, D / 2 + 0.2, 0.2, 0.05, 0.02, K.ink);
  // roof: a stepped tile roof, two chimneys and a weather plane (a paper plane on a rod)
  tileRoof(g, W, D, H + 0.74, K.maroon, 5, 0.26);
  g.box(W / 2 - 1.4, H + 2.4, -1.4, 0.5, 1.1, 0.5, K.brick);
  g.box(-W / 2 + 1.4, H + 2.4, -1.4, 0.5, 1.1, 0.5, K.brick);
  g.box(0, H + 2.9, -0.2, 0.06, 1.0, 0.06, K.iron);
  g.boxR(0, H + 3.45, -0.2, 0.7, 0.04, 0.3, K.white, 0, 0.6, 0.1);
  g.boxR(0.05, H + 3.43, -0.2, 0.3, 0.12, 0.04, K.white, 0, 0.6, 0);
  // the main door: double green doors folded back, a fanlight, two steps
  const dx = poDoorX(W);
  doorway(g, dx, D / 2 + 0.02, 1.6, 2.4, K.greenD, K.woodD);
  g.box(dx, 2.86, D / 2 + 0.06, 1.7, 0.36, 0.05, K.glass);
  for (const k of [-0.5, 0, 0.5]) g.box(dx + k, 2.86, D / 2 + 0.09, 0.04, 0.36, 0.02, K.white);
  g.box(dx, 0.2, D / 2 + 0.6, 2.4, 0.08, 0.4, K.stoneD);
  // windows with green shutters either side; the waiting bench under the west one (outside)
  for (const x of wide ? [-W / 2 + 1.5, -W / 2 + 3.6, 2.2] : [-W / 2 + 0.95, dx + 2.0]) win(g, x, 1.75, D / 2 + 0.03, 1.0, 1.1, K.greenD);
  // the post-room door at the east end: a narrow plank door painted with a red envelope, a poster beside it
  const px = poRoomX(W);
  g.box(px, 1.2, D / 2 + 0.02, 0.95, 2.1, 0.06, K.dark);
  g.box(px, 2.32, D / 2 + 0.05, 1.15, 0.14, 0.1, K.woodD);
  for (const sx of [-1, 1]) g.box(px + sx * 0.53, 1.2, D / 2 + 0.05, 0.1, 2.1, 0.1, K.woodD);
  // its plank leaf, half open (swung in and to the left), the red envelope on it
  g.box(px - 0.3, 1.2, D / 2 + 0.04, 0.42, 2.0, 0.05, K.woodL);
  for (let k = 0; k < 3; k++) g.box(px - 0.42 + k * 0.13, 1.2, D / 2 + 0.07, 0.02, 1.95, 0.01, K.woodD);
  g.box(px - 0.3, 1.5, D / 2 + 0.08, 0.34, 0.24, 0.02, K.red);
  g.boxR(px - 0.38, 1.56, D / 2 + 0.1, 0.22, 0.03, 0.01, K.white, 0, 0, -0.55);
  g.boxR(px - 0.22, 1.56, D / 2 + 0.1, 0.22, 0.03, 0.01, K.white, 0, 0, 0.55);
  g.box(px, 0.08, D / 2 + 0.3, 1.1, 0.16, 0.4, K.stone);
  // the poster «ပြိုင်ပွဲရလဒ် — အထဲမှာ» (a sign) and the hours board are inside; outside, a red post box
  const qx = wide ? W / 2 - 2.6 : px - 1.1;
  g.box(qx, 1.55, D / 2 + 0.04, 0.8, 1.0, 0.03, K.cream);
  ctx.signs.push({ x: qx, y: 1.6, z: D / 2 + 0.08, w: 0.74, h: 0.86, lines: [{ text: 'ပြိုင်ပွဲရလဒ်', size: 30 }, { text: 'အထဲမှာ', size: 30, color: '#9C2832' }], bg: '#FBF6EA', border: '#9C2832', width: 220, height: 256 });
  // the post box by the main door
  const bx = dx - 2.2;
  g.box(bx, 0.55, D / 2 + 0.75, 0.5, 1.1, 0.5, K.red);
  g.box(bx, 1.15, D / 2 + 0.75, 0.6, 0.12, 0.6, K.redD);
  g.box(bx, 1.26, D / 2 + 0.75, 0.4, 0.1, 0.4, K.red);
  g.box(bx, 0.85, D / 2 + 1.0, 0.3, 0.06, 0.02, K.ink);
  g.box(bx, 0.6, D / 2 + 1.0, 0.24, 0.16, 0.02, K.white);
  // THE FLAG BOARD over the main door: sixteen reply flags on pulleys (၁ at the east end ... ၁၆ at the west);
  // flag ၁၄ (Ma Thiri's) is DOWN. Their cords run in through the wall.
  const bw = 4.6, by = H - 0.35, bz = D / 2 + 0.16;
  g.box(dx, by, bz, bw + 0.2, 0.5, 0.08, K.woodD);
  g.box(dx, by, bz + 0.04, bw, 0.4, 0.04, K.cream);
  for (let n = 1; n <= 16; n++) {
    const x = dx + bw / 2 - 0.14 - ((n - 1) * (bw - 0.28)) / 15;
    g.box(x, by + 0.62, bz + 0.02, 0.03, 0.85, 0.03, K.iron); // the pulley rod
    g.box(x, by + 1.06, bz + 0.02, 0.09, 0.09, 0.06, K.gold); // the pulley
    f.box(x + 0.02, by + 0.6, bz + 0.06, 0.008, 0.9, 0.008, K.ink); // the cord
    const up = n !== 14, fy = up ? by + 0.92 : by + 0.36;
    const fc = [K.red, K.cream, K.teal, K.mustard][n % 4];
    g.box(x + 0.12, fy, bz + 0.02, 0.2, 0.15, 0.02, n === 14 ? K.white : fc);
  }
  ctx.signs.push({ x: dx, y: by, z: bz + 0.08, w: bw, h: 0.34, lines: [{ text: '၁၆ ၁၅ ၁၄ ၁၃ ၁၂ ၁၁ ၁၀ ၉ ၈ ၇ ၆ ၅ ၄ ၃ ၂ ၁', size: 40 }], bg: '#F6EEDB', border: null, width: 1024, height: 76 });
  // the name: «စာတိုက်» on the pediment
  ctx.signs.push({ x: 0, y: H + 1.0, z: D / 2 + 0.13, w: 3.2, h: 0.62, lines: [{ text: 'ဈေးစာတိုက်', size: 46 }, { text: 'Market Post Office', size: 20, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: '#FBF6EA', width: 512, height: 112 });
  // lamps either side of the door (evening)
  for (const sx of [-1.25, 1.25]) { g.box(dx + sx, 2.5, D / 2 + 0.2, 0.2, 0.32, 0.2, K.gold); g.box(dx + sx, 2.7, D / 2 + 0.2, 0.26, 0.06, 0.26, K.maroon); ctx.glows.push(wx(g, dx + sx, D / 2 + 0.25), 2.5, wz(g, dx + sx, D / 2 + 0.25)); }
}

function teaShop(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 3.1, wall = '#EFD9B4', REC = 1.2, fz = D / 2 - REC;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.6, D / 2 + 0.8, 0.004, K.shadow);
  g.box(0, 0.1, 0, W + 0.2, 0.2, D + 0.2, K.stone);
  g.box(0, H / 2 + 0.2, -REC / 2, W, H, D - REC, wall);
  for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.1), H / 2 + 0.2, D / 2 - REC / 2, 0.2, H, REC, wall); // side walls hug the veranda
  // the veranda: plank deck, low stools both sides of the door, a low table
  g.box(0, 0.24, fz + REC / 2, W - 0.4, 0.08, REC - 0.05, K.woodL);
  for (let k = 0; k < 6; k++) f.box(-W / 2 + 0.6 + k * ((W - 1.2) / 5), 0.29, fz + REC / 2, 0.03, 0.01, REC - 0.1, K.woodD);
  const stool = (x, z, c) => { g.box(x, 0.48, z, 0.32, 0.05, 0.32, c); g.box(x, 0.36, z, 0.24, 0.22, 0.24, shade(c, 0.8)); };
  for (const [x, c] of [[-2.9, K.blue], [-2.2, K.red], [-1.5, K.blue], [1.5, K.red], [2.2, K.blue], [2.9, K.red]]) stool(x, fz + 0.75, c);
  g.box(-2.2, 0.62, fz + 0.3, 1.0, 0.05, 0.5, K.woodL);
  for (const sx of [-0.4, 0.4]) g.box(-2.2 + sx, 0.43, fz + 0.3, 0.05, 0.36, 0.4, K.woodD);
  f.box(-2.4, 0.7, fz + 0.3, 0.1, 0.12, 0.1, K.white); f.box(-2.05, 0.69, fz + 0.32, 0.08, 0.1, 0.08, K.white);
  // the front: door mid, two wide windows (tables and the hearth's glow inside), the menu slate
  doorway(g, 0, fz + 0.02, 1.3, 2.3, null);
  for (const sx of [-1, 1]) { win(g, sx * 2.35, 1.65, fz + 0.03, 1.5, 1.0, null, K.cream); f.box(sx * 2.35, 1.3, fz - 0.05, 1.2, 0.3, 0.02, '#F2A65A'); }
  g.boxR(1.05, 0.62, fz + 0.62, 0.55, 0.8, 0.05, K.woodD, -0.18, 0, 0);
  g.boxR(1.05, 0.66, fz + 0.66, 0.45, 0.6, 0.02, '#3E4A3F', -0.18, 0, 0);
  for (let k = 0; k < 3; k++) f.box(1.05, 0.86 - k * 0.14, fz + 0.71 - k * 0.025, 0.3 - k * 0.05, 0.025, 0.01, K.white);
  // the striped stamp awning over the door (Day 6's: slate 1 lands on it), on two iron brackets
  stampRoof(g, 0, fz + 0.05, 2.65, fz + 1.05, 2.3, 2.6, 'red', 0, true);
  for (const sx of [-1.15, 1.15]) g.boxR(sx, 2.35, fz + 0.45, 0.04, 0.04, 0.9, K.iron, -0.6, 0, 0);
  // the long eave over the whole veranda (tin), on posts
  g.boxR(0, H + 0.12, fz + REC / 2 + 0.1, W + 0.3, 0.08, REC + 0.6, K.tin, 0.22, 0, 0);
  for (let k = 0; k < 8; k++) g.boxR(-W / 2 + 0.3 + k * ((W - 0.6) / 7), H + 0.17, fz + REC / 2 + 0.1, 0.05, 0.03, REC + 0.6, K.tinD, 0.22, 0, 0);
  for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.25), (H + 0.2) / 2, D / 2 - 0.12, 0.12, H, 0.12, K.woodD);
  // roof and the tea chimney (it steams all day)
  tileRoof(g, W, D - REC, H + 0.2, '#8E3B2E', 4, 0.3);
  g.box(W / 2 - 1.5, H + 1.5, -1.6, 0.45, 1.6, 0.45, K.brick);
  g.box(W / 2 - 1.5, H + 2.34, -1.6, 0.56, 0.1, 0.56, '#7E3C2B');
  ctx.smoke.push(wx(g, W / 2 - 1.5, -1.6), H + 2.5, wz(g, W / 2 - 1.5, -1.6));
  ctx.signs.push({ x: 0, y: H + 0.62, z: fz + 0.2, w: 3.0, h: 0.62, lines: [{ text: 'လက်ဖက်ရည်ဆိုင်', size: 46 }, { text: 'Tea Shop', size: 20, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: '#F6EEDB', width: 512, height: 112 });
  ctx.glows.push(wx(g, 0, fz + 1.0), 2.2, wz(g, 0, fz + 1.0));
}

function riceShop(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 2.9, wall = '#F2E6CC';
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.6, D / 2 + 0.9, 0.004, K.shadow);
  g.box(0, 0.1, 0, W + 0.2, 0.2, D + 0.2, K.stone);
  g.box(0, H / 2 + 0.2, 0, W, H, D, wall);
  for (const sx of [-1, 1]) g.box(sx * W / 2, H / 2 + 0.2, D / 2, 0.18, H, 0.18, K.woodD);
  g.box(0, 0.38, D / 2 + 0.03, W, 0.3, 0.1, K.terraD);
  doorway(g, 0, D / 2 + 0.02, 1.4, 2.2, K.woodL);
  for (const sx of [-1, 1]) win(g, sx * 2.4, 1.6, D / 2 + 0.03, 1.3, 0.95, K.terra, K.cream);
  // a long bench either side of the door for whoever is waiting, and the water jar with a cup
  for (const sx of [-1, 1]) { g.box(sx * 2.4, 0.42, D / 2 + 0.45, 1.6, 0.07, 0.38, K.woodL); for (const k of [-0.65, 0.65]) g.box(sx * 2.4 + k, 0.2, D / 2 + 0.45, 0.07, 0.4, 0.3, K.woodD); }
  g.box(W / 2 - 0.45, 0.35, D / 2 + 0.55, 0.5, 0.7, 0.5, K.terra);
  g.box(W / 2 - 0.45, 0.74, D / 2 + 0.55, 0.42, 0.06, 0.42, K.wood);
  f.box(W / 2 - 0.35, 0.82, D / 2 + 0.6, 0.1, 0.1, 0.1, K.gold);
  // a low roof of terracotta tiles; a steam vent over the rice pot
  tileRoof(g, W, D, H + 0.2, '#B5643C', 4, 0.28);
  g.box(-W / 2 + 1.6, H + 1.4, -0.6, 0.5, 1.0, 0.5, K.tin);
  g.box(-W / 2 + 1.6, H + 1.95, -0.6, 0.7, 0.08, 0.7, K.tinD);
  ctx.smoke.push(wx(g, -W / 2 + 1.6, -0.6), H + 2.1, wz(g, -W / 2 + 1.6, -0.6));
  ctx.signs.push({ x: 0, y: H - 0.2, z: D / 2 + 0.12, w: 3.6, h: 0.7, lines: [{ text: 'စေတနာ ထမင်း', size: 40 }, { text: 'ဘယ်သူမဆို ထိုင်စားပါ', size: 30, color: '#6E1F2A' }], bg: '#FBF6EA', width: 560, height: 128 });
}

function sundries(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 2.8, wall = '#E9D3AE';
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.6, D / 2 + 0.7, 0.004, K.shadow);
  g.box(0, 0.1, 0, W + 0.2, 0.2, D + 0.2, K.stone);
  g.box(0, H / 2 + 0.2, 0, W, H, D, wall);
  for (const sx of [-1, 1]) g.box(sx * W / 2, H / 2 + 0.2, D / 2, 0.16, H, 0.16, K.teal);
  // the bead-curtain door: strings of coloured beads
  g.box(0, 1.2, D / 2 + 0.01, 1.1, 2.1, 0.05, K.dark);
  g.box(0, 2.33, D / 2 + 0.05, 1.3, 0.12, 0.1, K.teal);
  const beads = [K.red, K.mustard, K.blue, K.white, K.green, K.pink];
  for (let i = 0; i < 9; i++) for (let k = 0; k < 9; k++) f.box(-0.48 + i * 0.12, 2.15 - k * 0.22, D / 2 + 0.07, 0.05, 0.08, 0.05, beads[(i + k) % beads.length]);
  // the window: goods stacked behind glass; goods hanging outside (buckets, brooms, sandals)
  win(g, -1.75, 1.55, D / 2 + 0.03, 1.4, 1.1, null, K.cream);
  for (let k = 0; k < 6; k++) f.box(-2.3 + k * 0.22, 1.2, D / 2 - 0.02, 0.16, 0.3, 0.1, beads[k % beads.length]);
  g.box(1.6, 2.5, D / 2 + 0.2, 1.8, 0.05, 0.05, K.iron);
  for (const [x, c, h] of [[0.95, K.red, 0.32], [1.35, K.blue, 0.32], [1.75, '#E8E2D2', 0.5], [2.1, K.green, 0.32]]) g.box(x, 2.4 - h / 2, D / 2 + 0.22, 0.3, h, 0.3, c);
  g.boxR(2.45, 1.0, D / 2 + 0.25, 0.08, 1.9, 0.08, K.woodL, 0, 0, 0.12);
  g.box(2.53, 0.25, D / 2 + 0.25, 0.32, 0.4, 0.1, '#D6B486');
  // outside: the dog-rice sack, a tin water bowl (always full), a stool
  g.box(-2.4, 0.3, D / 2 + 0.5, 0.55, 0.6, 0.45, K.rice);
  g.box(-2.4, 0.64, D / 2 + 0.5, 0.3, 0.1, 0.25, K.twine);
  f.box(-1.55, 0.05, D / 2 + 0.8, 0.36, 0.1, 0.36, K.tin);
  f.box(-1.55, 0.09, D / 2 + 0.8, 0.28, 0.04, 0.28, '#7FA9B8');
  g.box(1.9, 0.26, D / 2 + 0.55, 0.34, 0.05, 0.34, K.red); g.box(1.9, 0.12, D / 2 + 0.55, 0.26, 0.24, 0.26, K.redD);
  // a tin awning and a flat roof with a hand-painted board «ကုန်စုံ»
  g.boxR(0, 2.62, D / 2 + 0.55, W + 0.2, 0.06, 1.2, K.teal, 0.25, 0, 0);
  for (let k = 0; k < 7; k++) g.boxR(-W / 2 + 0.3 + k * ((W - 0.6) / 6), 2.66, D / 2 + 0.55, 0.05, 0.03, 1.2, shade(K.teal, 0.8), 0.25, 0, 0);
  g.box(0, H + 0.3, 0, W + 0.2, 0.2, D + 0.2, K.goldD);
  g.box(0, H + 0.62, D / 2 - 0.05, W - 0.4, 0.5, 0.12, wall);
  g.box(W / 2 - 1.0, H + 0.8, -0.8, 0.9, 0.9, 0.9, '#3E5F7A');
  g.box(W / 2 - 1.0, H + 1.28, -0.8, 0.96, 0.08, 0.96, K.iron);
  ctx.signs.push({ x: 0, y: H + 0.66, z: D / 2 + 0.03, w: 2.2, h: 0.55, lines: [{ text: 'ကုန်စုံ', size: 56 }], bg: '#F7E2A6', border: '#3E8C8A', width: 384, height: 96 });
}

function carverRow(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 2.9, REC = 1.4, fz = D / 2 - REC, n = 3, sw = W / n;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.6, D / 2 + 0.8, 0.004, K.shadow);
  g.box(0, 0.1, 0, W + 0.2, 0.2, D + 0.2, K.stone);
  g.box(0, H / 2 + 0.2, -REC / 2, W, H, D - REC, '#E6D2AE');
  tileRoof(g, W, D - REC, H + 0.2, '#6E4A2E', 4, 0.26);
  for (let i = 0; i < n; i++) {
    const cx = -W / 2 + sw * (i + 0.5), r = rng(i + 3);
    // party walls out to the awning line
    if (i > 0) g.box(-W / 2 + sw * i, H / 2 + 0.2, fz + REC / 2, 0.16, H, REC, '#D9C29A');
    // the striped awning
    stampRoof(g, cx, fz + 0.05, 2.75, D / 2 + 0.2, 2.35, sw - 0.15, ['gold', 'teal', 'red'][i], 0, true);
    g.box(cx, 2.3, D / 2 + 0.15, sw - 0.2, 0.06, 0.06, K.woodD);
    if (i < 2) {
      // open fronts: a counter of stamp blocks, ink pads, the bench out under the awning (busy)
      g.box(cx, 1.25, fz + 0.01, sw - 0.6, 2.0, 0.05, K.dark);
      for (let k = 0; k < 3; k++) { g.box(cx, 0.8 + k * 0.45, fz + 0.06, sw - 0.8, 0.05, 0.22, K.woodL); for (let x = -sw / 2 + 0.55; x < sw / 2 - 0.5; x += 0.2) f.box(cx + x, 0.88 + k * 0.45, fz + 0.08, 0.12, 0.1 + r() * 0.05, 0.12, r() < 0.5 ? K.woodL : '#E4C79A'); }
      const bx = cx - 0.2, bz = fz + 0.8;
      g.box(bx, 0.72, bz, 1.4, 0.08, 0.6, K.wood);
      for (const sx of [-0.6, 0.6]) for (const sz of [-0.24, 0.24]) g.box(bx + sx, 0.34, bz + sz, 0.07, 0.68, 0.07, K.woodD);
      g.box(bx - 0.45, 0.86, bz, 0.22, 0.2, 0.2, K.iron); // the vice
      f.box(bx + 0.1, 0.8, bz + 0.05, 0.14, 0.08, 0.14, K.woodL); // a block in work
      for (let k = 0; k < 5; k++) f.box(bx + 0.3 + (k % 3) * 0.1, 0.77, bz - 0.15 + Math.floor(k / 3) * 0.12, 0.06, 0.02, 0.04, '#EBD3A8'); // shavings
      for (const [x, c] of [[0.45, K.red], [0.6, K.blue]]) f.box(bx + x, 0.78, bz + 0.18, 0.12, 0.03, 0.12, c); // ink pads
      // the little wax brazier, lit (a glow)
      g.box(cx + 0.95, 0.3, bz + 0.1, 0.32, 0.6, 0.32, K.terraD);
      f.box(cx + 0.95, 0.62, bz + 0.1, 0.24, 0.06, 0.24, '#F2873A');
      ctx.glows.push(wx(g, cx + 0.95, bz + 0.1), 0.7, wz(g, cx + 0.95, bz + 0.1));
      g.box(bx, 0.36, bz - 0.55, 0.36, 0.06, 0.36, K.woodL); for (const sx of [-0.13, 0.13]) g.box(bx + sx, 0.17, bz - 0.55, 0.05, 0.34, 0.3, K.woodD); // the carver's stool
      for (let k = 0; k < 8; k++) f.flatR(bx + (r() - 0.5) * 1.6, bz + 0.2 + r() * 0.5, 0.08, 0.05, 0.215, '#EBD3A8', r() * 3);
    } else {
      // Ko Lwin's: a half-open plank door, a carved straight-line sign block over it, a tin chimney pipe
      g.box(cx - 0.4, 1.2, fz + 0.01, 1.0, 2.1, 0.05, K.dark);
      g.box(cx - 0.4, 2.3, fz + 0.05, 1.2, 0.12, 0.1, K.woodD);
      for (const sx of [-1, 1]) g.box(cx - 0.4 + sx * 0.55, 1.2, fz + 0.05, 0.1, 2.1, 0.1, K.woodD);
      g.box(cx - 0.62, 1.2, fz + 0.12, 0.52, 2.0, 0.06, K.woodL, -0.5);
      for (let k = 0; k < 3; k++) g.box(cx - 0.75 + k * 0.15, 1.2, fz + 0.18, 0.02, 1.95, 0.01, K.woodD, -0.5);
      win(g, cx + 0.95, 1.55, fz + 0.03, 0.75, 0.8, K.woodD, K.cream);
      g.box(cx - 0.4, 2.55, fz + 0.12, 0.8, 0.3, 0.14, K.woodL); // the sign block: straight lines cut into it
      for (let k = 0; k < 3; k++) f.box(cx - 0.4, 2.47 + k * 0.08, fz + 0.2, 0.6, 0.025, 0.01, K.woodD);
      g.box(cx + 0.6, H + 1.5, -0.6, 0.18, 1.4, 0.18, K.tinD); // the tin chimney pipe (cold until chapter 10)
      g.box(cx + 0.6, H + 2.25, -0.6, 0.32, 0.08, 0.32, K.tin);
      // his water jar and a pupil's stool outside, empty
      g.box(cx + 1.0, 0.3, fz + 0.4, 0.4, 0.6, 0.4, K.terra);
      g.box(cx + 1.0, 0.62, fz + 0.4, 0.34, 0.05, 0.34, K.wood);
      g.box(cx - 1.25, 0.3, fz + 0.45, 0.3, 0.05, 0.3, K.woodL); for (const sx of [-0.11, 0.11]) g.box(cx - 1.25 + sx, 0.14, fz + 0.45, 0.04, 0.28, 0.26, K.woodD);
    }
  }
  ctx.signs.push({ x: -sw / 2, y: H + 0.55, z: fz + 0.06, w: 3.2, h: 0.55, lines: [{ text: 'တံဆိပ်တုံး ထွင်းသူများ', size: 40 }], bg: '#F6EEDB', width: 512, height: 96 });
}

// An open stall roofed with a giant postage stamp. goods: envelopes, stamps, maps, fruit, flowers, cloth, kites,
// pots, paper, snacks, books. it.back: drawn facing the other way's street (it.ry turns it; this only dresses
// the back with crates). Local: counter front at z +0.85, the keeper's space behind it at z -0.2.
const GOODS_COL = {
  envelopes: [K.white, K.envL, K.kraft, K.sky, K.pink, K.mustard], stamps: [K.red, K.green, K.gold, K.blue, K.violet, K.white],
  maps: [K.mustard, K.red, K.sky, K.green, K.pink, K.violet], fruit: ['#E8B832', '#7FAE66', '#E06A3A', '#C8323C', '#F2D06B', '#8DBA6E'],
  flowers: [K.white, K.pink, K.mustard, '#F3B27A', '#B9A3D6', K.red], cloth: [K.maroon, K.teal, K.mustard, K.blue, K.pink, K.green],
  kites: [K.red, K.cream, K.mustard, K.blue, K.green, K.pink], pots: [K.terra, K.terraL, K.terraD, '#C9A27A', K.terra, K.terraL],
  paper: [K.white, K.cream, K.envL, K.kraftL, K.sky, K.pink], snacks: ['#F3B27A', '#E2B33C', K.red, '#C9A57A', K.green, K.white],
  books: [K.maroon, K.blue, K.green, K.mustard, K.red, K.teal],
};
function stampStall(g, f, it, ctx) {
  const W = it.w || 3.0, D = 1.7, r = rng(it.seed || 5), col = it.color || STAMP_KEYS[(it.seed || 0) % STAMP_KEYS.length];
  const goods = it.goods || 'paper', cols = GOODS_COL[goods] || GOODS_COL.paper;
  f.flat(-W / 2 - 0.15, -D / 2 - 0.1, W / 2 + 0.35, D / 2 + 0.3, 0.004, K.shadow);
  // posts and a back rail
  for (const [x, z, h] of [[-W / 2 + 0.08, -D / 2 + 0.1, 2.15], [W / 2 - 0.08, -D / 2 + 0.1, 2.15], [-W / 2 + 0.08, D / 2 - 0.1, 1.9], [W / 2 - 0.08, D / 2 - 0.1, 1.9]]) {
    g.box(x, h / 2, z, 0.09, h, 0.09, jitter(K.wood, 0.06, x * 7 + z));
    g.box(x, 0.05, z, 0.15, 0.1, 0.15, K.stoneD);
  }
  g.box(0, 1.7, -D / 2 + 0.1, W - 0.16, 0.05, 0.05, K.woodD);
  stampRoof(g, 0, -D / 2 - 0.05, 2.25, D / 2 + 0.3, 1.95, W + 0.35, col, it.motif ?? 1 + Math.floor(r() * 5));
  // the counter: a plank table with a cloth front, goods on it
  const cz = D / 2 - 0.35;
  g.box(0, 0.74, cz, W - 0.3, 0.07, 0.6, K.woodL);
  g.box(0, 0.42, cz + 0.29, W - 0.3, 0.6, 0.03, [K.cream, K.envL, '#E9D9C0'][Math.floor(r() * 3)]);
  g.box(0, 0.68, cz + 0.31, W - 0.3, 0.08, 0.03, (STAMP[col] || STAMP.red)[0]);
  for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.25), 0.36, cz, 0.06, 0.72, 0.5, K.woodD);
  const top = 0.78;
  if (goods === 'envelopes' || goods === 'paper' || goods === 'stamps') {
    for (let x = -W / 2 + 0.35; x < W / 2 - 0.3; x += 0.44) {
      const n = 1 + Math.floor(r() * 4), c = cols[Math.floor(r() * cols.length)];
      for (let k = 0; k < n; k++) f.box(x + (r() - 0.5) * 0.04, top + 0.02 + k * 0.05, cz + (r() - 0.5) * 0.12, 0.28, 0.04, 0.2, k % 2 ? c : shade(c, 0.94));
    }
    if (goods === 'stamps') for (let k = 0; k < 6; k++) f.box(-W / 2 + 0.5 + k * 0.4, 1.45, -D / 2 + 0.16, 0.26, 0.32, 0.02, cols[k % cols.length]); // sheets pinned to the back rail
  } else if (goods === 'maps') {
    // painted maps hanging on a line (loud colours), paint pots and a stencil on the counter
    g.box(0, 1.62, -D / 2 + 0.12, W - 0.2, 0.02, 0.02, K.ink);
    for (let k = 0; k < 5; k++) {
      const x = -W / 2 + 0.45 + k * ((W - 0.9) / 4), c = cols[k % cols.length];
      g.box(x, 1.28, -D / 2 + 0.14, 0.46, 0.6, 0.02, K.paper);
      f.box(x, 1.32, -D / 2 + 0.16, 0.38, 0.06, 0.01, c); f.box(x - 0.08, 1.2, -D / 2 + 0.16, 0.06, 0.34, 0.01, shade(c, 0.8)); f.box(x + 0.1, 1.12, -D / 2 + 0.16, 0.2, 0.05, 0.01, K.red);
    }
    for (let k = 0; k < 4; k++) { f.box(-W / 2 + 0.4 + k * 0.22, top + 0.08, cz - 0.1, 0.14, 0.16, 0.14, K.tin); f.box(-W / 2 + 0.4 + k * 0.22, top + 0.17, cz - 0.1, 0.1, 0.02, 0.1, cols[k]); }
    f.box(0.5, top + 0.02, cz, 0.7, 0.02, 0.45, K.paper); f.box(0.5, top + 0.035, cz, 0.5, 0.01, 0.06, K.red); f.box(0.4, top + 0.035, cz, 0.06, 0.01, 0.35, K.green);
    // an easel with a big one on show
    g.boxR(W / 2 + 0.25, 0.85, cz + 0.1, 0.06, 1.7, 0.06, K.woodD, -0.12, 0, 0);
    g.boxR(W / 2 + 0.25, 1.15, cz + 0.16, 0.7, 0.85, 0.03, K.paper, -0.12, 0, 0);
    f.box(W / 2 + 0.25, 1.2, cz + 0.2, 0.5, 0.06, 0.01, K.red); f.box(W / 2 + 0.1, 1.05, cz + 0.2, 0.06, 0.4, 0.01, K.mustard); f.box(W / 2 + 0.35, 0.95, cz + 0.22, 0.3, 0.05, 0.01, K.blue);
  } else if (goods === 'kites') {
    for (let k = 0; k < 4; k++) { const x = -W / 2 + 0.55 + k * ((W - 1.1) / 3); g.box(x, 1.35, -D / 2 + 0.14, 0.42, 0.42, 0.02, cols[k], 0); g.boxR(x, 1.35, -D / 2 + 0.16, 0.3, 0.3, 0.02, cols[(k + 1) % 6], 0, 0, Math.PI / 4); f.box(x, 0.95, -D / 2 + 0.16, 0.02, 0.4, 0.01, K.ink); }
    for (let k = 0; k < 6; k++) f.boxR(-W / 2 + 0.4 + k * 0.4, top + 0.06, cz, 0.24, 0.02, 0.12, K.white, 0, 0.3 * (k % 2 ? 1 : -1), 0); // paper planes
    g.box(W / 2 - 0.5, top + 0.12, cz - 0.05, 0.22, 0.22, 0.22, K.twine);
  } else if (goods === 'pots') {
    for (let x = -W / 2 + 0.4; x < W / 2 - 0.3; x += 0.42) { const h = 0.18 + r() * 0.2; g.box(x, top + h / 2, cz, 0.26, h, 0.26, cols[Math.floor(r() * cols.length)]); }
    for (let k = 0; k < 3; k++) g.box(-W / 2 + 0.6 + k * 0.9, 0.25, D / 2 + 0.35, 0.44, 0.5, 0.44, cols[k]);
  } else if (goods === 'flowers' || goods === 'fruit') {
    for (let x = -W / 2 + 0.38; x < W / 2 - 0.3; x += 0.5) {
      g.box(x, top + 0.08, cz, 0.42, 0.16, 0.36, K.twine); // a flat basket
      for (let k = 0; k < 4; k++) f.box(x - 0.1 + (k % 2) * 0.2, top + 0.2, cz - 0.08 + Math.floor(k / 2) * 0.16, 0.14, 0.12, 0.14, cols[Math.floor(r() * cols.length)]);
    }
    if (goods === 'flowers') for (let k = 0; k < 3; k++) { const x = -W / 2 + 0.6 + k * 0.9; g.box(x, 0.25, D / 2 + 0.35, 0.36, 0.5, 0.36, K.tin); for (let j = 0; j < 4; j++) f.box(x - 0.1 + (j % 2) * 0.2, 0.62 + (j >> 1) * 0.1, D / 2 + 0.3 + (j % 2) * 0.08, 0.14, 0.14, 0.14, cols[(k + j) % 6]); }
    else for (let k = 0; k < 4; k++) f.box(-W / 2 + 0.4 + k * 0.3, 1.5 - (k % 2) * 0.1, -D / 2 + 0.16, 0.16, 0.4, 0.14, '#E8B832'); // bananas hung on the rail
  } else if (goods === 'cloth') {
    for (let k = 0; k < 5; k++) g.box(-W / 2 + 0.45 + k * ((W - 0.9) / 4), 1.15, -D / 2 + 0.14, 0.42, 1.0, 0.03, cols[k % cols.length]);
    for (let x = -W / 2 + 0.4; x < W / 2 - 0.3; x += 0.42) f.box(x, top + 0.1, cz, 0.36, 0.2, 0.28, cols[Math.floor(r() * cols.length)]);
  } else {
    for (let x = -W / 2 + 0.38; x < W / 2 - 0.3; x += 0.4) f.box(x, top + 0.1, cz, 0.3, 0.2, 0.18, cols[Math.floor(r() * cols.length)]);
    g.box(0, 1.5, -D / 2 + 0.12, W - 0.4, 0.02, 0.02, K.ink);
    for (let k = 0; k < 6; k++) f.box(-W / 2 + 0.5 + k * 0.4, 1.32, -D / 2 + 0.14, 0.2, 0.34, 0.04, cols[k % cols.length]);
  }
  // the keeper's stool behind the counter, a crate under it, a basket at the side
  g.box(0.5, 0.42, -0.25, 0.32, 0.05, 0.32, K.woodL); for (const sx of [-0.12, 0.12]) g.box(0.5 + sx, 0.2, -0.25, 0.04, 0.4, 0.28, K.woodD);
  g.box(-W / 2 + 0.45, 0.2, -0.3, 0.5, 0.4, 0.4, K.kraftD);
  // a side cloth (the walls of the painted shortcut's gap)
  if (it.side) {
    const sx = it.side * (W / 2 - 0.05), cc = (STAMP[col] || STAMP.red)[0];
    g.box(sx, 1.0, 0, 0.04, 1.5, D - 0.15, K.cream);
    for (let k = 0; k < 4; k++) g.box(sx + it.side * 0.015, 0.45 + k * 0.36, 0, 0.02, 0.1, D - 0.2, k % 2 ? cc : K.envL);
  }
  if (it.back) for (let k = 0; k < 3; k++) g.box(-W / 2 + 0.5 + k * 0.95, 0.3 + (k % 2) * 0.05, -D / 2 - 0.3, 0.8, 0.6 + (k % 2) * 0.1, 0.5, k % 2 ? K.kraft : K.kraftD);
}

function gateSign(g, f, it, ctx) {
  // the district's name, on a board shaped like an envelope (flap and seal), two posts, a little roof
  for (const sx of [-1.5, 1.5]) { g.box(sx, 1.2, 0, 0.14, 2.4, 0.14, K.woodD); g.box(sx, 0.08, 0, 0.3, 0.16, 0.3, K.stoneD); }
  g.box(0, 1.75, -0.02, 3.2, 1.1, 0.1, K.envL);
  for (let i = 0; i < 4; i++) g.box(0, 2.25 - i * 0.12, 0.05, 3.0 * (1 - i / 4), 0.12, 0.03, shade(K.env, 0.92 - i * 0.02));
  for (let k = 0; k < 4; k++) g.box(0, 1.74, 0.08, 0.34, 0.34, 0.05, k % 2 ? K.red : K.redD, (k * Math.PI) / 4);
  airmail(g, -1.6, 1.6, 1.24, 0.04, 0.12, 0.27);
  g.boxR(0, 2.48, -0.05, 3.6, 0.08, 0.6, K.maroon, 0.3, 0, 0);
  g.boxR(0, 2.48, -0.05 + 0.0, 3.6, 0.08, 0.6, K.maroon, -0.3, 0, 0);
  ctx.signs.push({ x: 0, y: 1.6, z: 0.12, w: 2.4, h: 0.5, lines: [{ text: 'စာအိတ်ဈေး', size: 46 }, { text: 'Envelope Market', size: 20, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: '#FBF6EA', border: null, width: 448, height: 96 });
}

export const ART = {
  mkHouse: { h: 7.0, map: true, draw: mkHouse, obstacles: (it) => [box(it, it.w, it.d - 0.2, 0, -0.1)] },
  postOffice: { h: 6.0, map: true, draw: postOffice, obstacles: (it) => [box(it, it.w, it.d, 0, 0), box(it, 0.6, 0.6, poDoorX(it.w) - 2.2, it.d / 2 + 0.75)] },
  teaShop: { h: 5.4, map: true, draw: teaShop, obstacles: (it) => [box(it, it.w, it.d - 1.2, 0, -0.6), box(it, 1.35, 0.6, -2.2, it.d / 2 - 1.2 + 0.4), box(it, 0.5, 1.0, -it.w / 2 + 0.1, it.d / 2 - 0.6), box(it, 0.5, 1.0, it.w / 2 - 0.1, it.d / 2 - 0.6)] },
  riceShop: { h: 4.6, map: true, draw: riceShop, obstacles: (it) => [box(it, it.w, it.d + 0.1, 0, 0.05), box(it, 1.7, 0.45, -2.4, it.d / 2 + 0.45), box(it, 1.7, 0.45, 2.4, it.d / 2 + 0.45)] },
  sundries: { h: 4.0, map: true, draw: sundries, obstacles: (it) => [box(it, it.w, it.d, 0, 0), box(it, 0.6, 0.5, -2.4, it.d / 2 + 0.5)] },
  carverRow: { h: 4.6, map: true, draw: carverRow, obstacles: (it) => [box(it, it.w, it.d - 1.4, 0, -0.7), box(it, 1.5, 0.62, -it.w / 3 - 0.2, it.d / 2 - 0.6), box(it, 1.5, 0.62, -0.2, it.d / 2 - 0.6), box(it, 0.45, 0.45, it.w / 3 + 1.0, it.d / 2 - 1.0)] },
  stampStall: { h: 2.4, draw: stampStall, obstacles: (it) => [box(it, (it.w || 3.0) - 0.2, 0.7, 0, 0.5), box(it, (it.w || 3.0), 0.3, 0, -0.75)] },
  gateSign: { h: 2.8, draw: gateSign, obstacles: (it) => [circ(it, -1.5, 0, 0.2), circ(it, 1.5, 0, 0.2)] },
};

// keep-out helpers (world space, from the item's turn)
function box(it, w, d, ox = 0, oz = 0) {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const cx = it.x + ox * c + oz * s, cz = it.z - ox * s + oz * c;
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return { type: 'box', minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd };
}
function circ(it, ox, oz, r) {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  return { type: 'circle', x: it.x + ox * c + oz * s, z: it.z - ox * s + oz * c, r };
}

// ---------------------------------------------------------------------------------
// PROP: small things
// ---------------------------------------------------------------------------------
function pageCrease(g, f, it) {
  // the letter's top fold: a long low ridge of paper across the land, the road ramps over it
  const L = it.len || 20, gap = it.gap || 4.6;
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -L / 2 : gap / 2, x1 = sx < 0 ? -gap / 2 : L / 2, w = x1 - x0, cx = (x0 + x1) / 2;
    g.boxR(cx, 0.12, -0.2, w, 0.05, 0.5, '#F7F1E2', 0.45, 0, 0);
    g.boxR(cx, 0.12, 0.2, w, 0.05, 0.5, '#E6DCC6', -0.45, 0, 0);
    g.box(cx, 0.22, 0, w, 0.04, 0.12, K.paper);
  }
  f.flat(-gap / 2, -0.06, gap / 2, 0.06, 0.16, '#D8CCB2');
}
function thanaka(g, f) {
  // Grandmother Pwa Pwa's: a round stone slab on a low stand, thanaka logs, a cup of water, a low stool, a mirror
  f.flat(-0.9, -0.6, 1.0, 0.7, 0.004, K.shadow);
  g.box(0, 0.2, 0, 0.7, 0.4, 0.5, K.woodD);
  for (let k = 0; k < 4; k++) g.box(0, 0.45, 0, 0.62, 0.08, 0.36, K.stone, (k * Math.PI) / 4);
  f.box(0, 0.5, 0, 0.3, 0.01, 0.3, '#E9D49A'); // the paste
  for (let k = 0; k < 4; k++) g.boxR(0.55 + (k % 2) * 0.12, 0.08 + Math.floor(k / 2) * 0.12, -0.2 + k * 0.08, 0.5, 0.11, 0.11, k % 2 ? '#D9B98C' : '#C9A57A', 0, 0.3 + k * 0.2, Math.PI / 2 * 0);
  g.box(-0.5, 0.48, 0.05, 0.12, 0.12, 0.12, K.white);
  g.box(-0.6, 0.2, -0.4, 0.34, 0.05, 0.34, K.blue); g.box(-0.6, 0.09, -0.4, 0.26, 0.18, 0.26, K.blueD);
  g.box(0.3, 0.75, -0.24, 0.3, 0.38, 0.04, K.goldD); f.box(0.3, 0.75, -0.21, 0.22, 0.28, 0.01, K.glass);
}
function planeTable(g, f) {
  // Ma Thiri's: a low table of neatly folded paper planes, rows of them
  f.flat(-0.8, -0.5, 0.9, 0.6, 0.004, K.shadow);
  g.box(0, 0.6, 0, 1.3, 0.06, 0.65, K.woodL);
  g.box(0, 0.5, 0.31, 1.3, 0.14, 0.03, K.red);
  for (const sx of [-0.58, 0.58]) for (const sz of [-0.27, 0.27]) g.box(sx, 0.29, sz, 0.05, 0.58, 0.05, K.woodD);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    const x = -0.45 + i * 0.3, z = -0.18 + j * 0.18;
    f.boxR(x, 0.67, z, 0.22, 0.02, 0.07, K.white, 0, 0, 0);
    f.boxR(x - 0.03, 0.69, z, 0.12, 0.04, 0.02, K.white, 0, 0, 0);
  }
  g.box(-0.85, 0.22, -0.1, 0.32, 0.05, 0.32, K.mustard); g.box(-0.85, 0.1, -0.1, 0.24, 0.2, 0.24, shade(K.mustard, 0.8));
}
function bambooPost(g, f) {
  // Ma Thiri's own post (Day 4): bamboo, three node rings, old pale string marks near the top
  g.box(0, 0.06, 0, 0.3, 0.12, 0.3, K.stoneD);
  g.box(0, 0.85, 0, 0.12, 1.7, 0.12, '#C9B26A');
  for (const y of [0.45, 0.95, 1.4]) g.box(0, y, 0, 0.15, 0.04, 0.15, '#A89148');
  for (const y of [1.52, 1.58, 1.64]) f.box(0, y, 0, 0.14, 0.012, 0.14, '#EFE6CF');
  f.flat(-0.3, -0.25, 0.4, 0.3, 0.004, K.shadow);
}
function pump(g, f) {
  // the street pump: an iron column on a stone apron, a long handle, a spout, a bucket hook and a pail
  f.flat(-0.8, -0.6, 0.8, 0.8, 0.005, K.stone);
  f.flat(-0.6, 0.1, 0.5, 0.7, 0.008, '#B7C9CE');
  g.box(0, 0.08, 0, 0.6, 0.16, 0.6, K.stoneD);
  g.box(0, 0.7, -0.05, 0.26, 1.2, 0.26, K.iron);
  g.box(0, 1.35, -0.05, 0.32, 0.12, 0.32, shade(K.iron, 1.2));
  g.box(0, 1.45, -0.05, 0.16, 0.12, 0.16, K.gold);
  g.box(0, 1.0, 0.18, 0.12, 0.12, 0.3, K.iron); // the spout
  g.box(0, 0.94, 0.32, 0.08, 0.1, 0.08, K.iron);
  g.boxR(0.0, 1.32, -0.55, 0.07, 0.07, 1.0, K.iron, -0.25, 0, 0); // the long handle
  g.box(0.0, 1.47, -1.02, 0.12, 0.12, 0.14, K.woodD);
  g.box(0.2, 0.75, 0.05, 0.12, 0.04, 0.04, K.iron); // the bucket hook
  g.box(0.25, 0.25, 0.4, 0.34, 0.4, 0.34, K.tin);
  g.box(0.25, 0.43, 0.4, 0.28, 0.04, 0.28, '#7FA9B8');
}
function envCrates(g, f, it) {
  // a stacked wall of crates stencilled with envelopes (the dead end of the painted shortcut)
  const W = it.w || 1.6, r = rng(it.seed || 2);
  f.flat(-W / 2 - 0.2, -0.5, W / 2 + 0.3, 0.6, 0.004, K.shadow);
  const rows = 3, n = Math.max(2, Math.round(W / 0.55));
  for (let j = 0; j < rows; j++) for (let i = 0; i < n - (j === 2 ? 1 : 0); i++) {
    const cw = W / n, x = -W / 2 + cw * (i + 0.5) + (j === 2 ? cw / 2 : 0) + (r() - 0.5) * 0.05, y = 0.27 + j * 0.54;
    g.box(x, y, (r() - 0.5) * 0.08, cw - 0.04, 0.52, 0.6, j % 2 ? K.woodL : '#C9A57A');
    g.box(x, y, 0.31, cw - 0.14, 0.4, 0.02, K.envL); // the stencilled envelope
    f.boxR(x - 0.06, y + 0.06, 0.33, 0.24, 0.02, 0.01, K.red, 0, 0, -0.5);
    f.boxR(x + 0.06, y + 0.06, 0.33, 0.24, 0.02, 0.01, K.red, 0, 0, 0.5);
  }
}
function riceCart(g, f) {
  // Daw Kyar's hand cart with one rice sack, shafts down
  f.flat(-1.1, -0.6, 1.2, 0.7, 0.004, K.shadow);
  g.box(0, 0.62, 0, 1.4, 0.08, 0.9, K.wood);
  for (const sz of [-0.42, 0.42]) g.box(0, 0.75, sz, 1.4, 0.2, 0.05, K.woodD);
  for (const sz of [-0.5, 0.5]) { g.box(0.1, 0.36, sz, 0.66, 0.66, 0.06, K.woodD); g.box(0.1, 0.36, sz, 0.5, 0.5, 0.07, K.woodL); g.box(0.1, 0.36, sz + Math.sign(sz) * 0.03, 0.12, 0.12, 0.06, K.iron); }
  for (const sz of [-0.38, 0.38]) g.boxR(-1.05, 0.38, sz, 0.9, 0.06, 0.06, K.woodD, 0, 0, -0.4);
  g.box(0.15, 0.95, 0, 0.75, 0.55, 0.6, K.rice); g.box(0.15, 1.25, 0, 0.45, 0.1, 0.4, '#E8E0CC');
  g.box(0.15, 0.95, 0.31, 0.3, 0.2, 0.01, K.green); // a printed sack mark
  g.box(-0.4, 0.75, 0.0, 0.2, 0.14, 0.3, K.tin); // a scoop
}
function flatStone(g, f) {
  // the dogs' corner's flat stone (the bowls go on it) and the sacking they sleep on
  f.flat(-0.7, -0.5, 0.8, 0.6, 0.004, '#D9CDB0');
  g.box(0, 0.06, 0, 0.9, 0.12, 0.6, K.stone);
  g.box(0.05, 0.13, 0.02, 0.7, 0.03, 0.45, shade(K.stone, 1.08));
}
function dogBed(g, f, it) {
  // a worn sack laid in the shade, a chewed sandal, a bone
  const r = rng(it.seed || 4);
  f.flatR(0, 0, 1.0, 0.7, 0.01, '#C9B08A', (r() - 0.5) * 0.4);
  f.flatR(0.05, 0.02, 0.8, 0.5, 0.012, '#BFA57E', (r() - 0.5) * 0.4);
  f.box(0.6, 0.03, 0.4, 0.24, 0.04, 0.1, K.red);
  f.box(-0.55, 0.03, -0.3, 0.2, 0.05, 0.05, K.white);
}
function dog(g, f, it) {
  // a sleeping box dog curled on its side (static; the Day 4 dogs that wake are props3's streetDog)
  const r = rng(it.seed || 6), c = ['#C9955A', '#E9DCC0', '#6B4A33', '#D8B07A'][Math.floor(r() * 4)], cd = shade(c, 0.82);
  f.flatR(0, 0, 0.9, 0.5, 0.006, '#D9CDB0', 0);
  g.box(0, 0.16, 0, 0.62, 0.3, 0.34, c); // body
  g.box(0.36, 0.13, 0.08, 0.22, 0.22, 0.24, c); // head down on the paws
  g.box(0.48, 0.1, 0.14, 0.1, 0.1, 0.12, cd); // muzzle
  g.box(0.5, 0.12, 0.2, 0.04, 0.04, 0.04, K.ink);
  for (const sz of [-0.07, 0.11]) g.box(0.32, 0.27, sz, 0.08, 0.08, 0.05, cd); // ears
  g.box(0.25, 0.05, 0.2, 0.3, 0.08, 0.08, cd); // front paws
  g.boxR(-0.38, 0.08, 0.14, 0.3, 0.06, 0.06, cd, 0, 0.6, 0); // the tail tucked round
  if (r() < 0.5) g.box(-0.05, 0.31, 0, 0.26, 0.02, 0.2, cd); // a patch
}
function cat(g, f) {
  g.box(0, 0.1, 0, 0.34, 0.18, 0.22, '#E07A3A');
  g.box(0.16, 0.12, 0.05, 0.14, 0.12, 0.14, '#E07A3A');
  for (const sz of [0.0, 0.1]) g.box(0.18, 0.2, sz, 0.04, 0.05, 0.03, '#B8592A');
  g.boxR(-0.15, 0.04, 0.12, 0.26, 0.04, 0.04, '#B8592A', 0, 0.8, 0);
  for (const x of [-0.05, 0.08]) g.box(x, 0.2, 0, 0.06, 0.01, 0.2, '#B8592A');
}
function goat(g, f, it) {
  // a tethered goat (stands still, chewing), its peg and rope
  g.box(0, 0.5, 0, 0.7, 0.32, 0.3, K.white);
  for (const [x, z] of [[-0.25, -0.1], [-0.25, 0.1], [0.25, -0.1], [0.25, 0.1]]) g.box(x, 0.18, z, 0.07, 0.36, 0.07, '#D8D2C4');
  g.box(0.42, 0.68, 0, 0.18, 0.22, 0.18, K.white);
  g.box(0.52, 0.62, 0, 0.12, 0.1, 0.12, '#E8E2D2');
  for (const sz of [-0.05, 0.05]) g.boxR(0.4, 0.84, sz, 0.04, 0.16, 0.04, '#8C7A62', 0, 0, -0.5);
  g.box(0.5, 0.52, 0, 0.04, 0.1, 0.04, '#D8D2C4');
  g.box(-0.38, 0.6, 0, 0.06, 0.14, 0.06, K.white);
  g.box(1.3, 0.12, 0.2, 0.06, 0.24, 0.06, K.woodD);
  f.box(0.9, 0.3, 0.1, 0.8, 0.012, 0.012, K.twine);
  f.flat(-0.5, -0.3, 0.7, 0.35, 0.004, K.shadow);
}
function trishaw(g, f, it) {
  // a sidecar trishaw parked: the bicycle and the passenger seat beside it, a folded canopy
  const red = it.seed % 2 ? K.teal : K.maroon;
  const wheel = (x, z, s = 0.62) => { for (const [w, h] of [[s, 0.06], [0.06, s]]) g.box(x, s / 2 + 0.02, z, w, h, 0.04, K.ink); g.box(x, s / 2 + 0.02, z, s * 0.7, s * 0.7, 0.02, '#8E8173'); };
  wheel(-0.6, -0.3); wheel(0.55, -0.3); wheel(-0.05, 0.55, 0.5);
  g.box(0, 0.62, -0.3, 1.1, 0.06, 0.06, red);
  g.box(-0.25, 0.85, -0.3, 0.26, 0.06, 0.14, K.ink);
  g.box(0.55, 0.95, -0.3, 0.06, 0.6, 0.06, red);
  g.box(0.55, 1.22, -0.3, 0.06, 0.06, 0.5, K.ink);
  g.box(0, 0.55, 0.45, 1.0, 0.1, 0.55, red);
  g.box(0, 0.62, 0.45, 0.9, 0.08, 0.45, K.woodL);
  g.box(-0.48, 0.85, 0.45, 0.08, 0.5, 0.55, red);
  g.box(0.48, 0.75, 0.45, 0.08, 0.3, 0.55, red);
  g.box(-0.4, 1.18, 0.45, 0.3, 0.2, 0.62, K.cream); // folded canopy
  f.flat(-0.9, -0.6, 0.9, 0.9, 0.004, K.shadow);
}
function crates(g, f, it) {
  const r = rng(it.seed || 9);
  f.flat(-0.8, -0.5, 0.9, 0.6, 0.004, K.shadow);
  const n = 2 + Math.floor(r() * 3);
  for (let k = 0; k < n; k++) {
    const x = (k % 2) * 0.62 - 0.3, y = 0.24 + Math.floor(k / 2) * 0.46, ry = (r() - 0.5) * 0.3;
    g.box(x, y, (r() - 0.5) * 0.1, 0.58, 0.44, 0.5, k % 2 ? K.woodL : '#C9A57A', ry);
    g.box(x, y, 0.26, 0.4, 0.06, 0.01, K.woodD, ry);
  }
  if (r() < 0.6) for (let k = 0; k < 4; k++) f.box(-0.3 + (k % 2) * 0.2, 0.5 + 0.06, -0.1 + (k >> 1) * 0.2, 0.16, 0.12, 0.16, ['#E8B832', '#7FAE66', '#E06A3A', K.red][k]);
}
function sacks(g, f, it) {
  const r = rng(it.seed || 3), cols = [K.rice, K.kraftL, '#E8E0CC', K.kraft];
  f.flat(-0.7, -0.5, 0.8, 0.5, 0.004, K.shadow);
  for (let k = 0; k < 3; k++) { const x = -0.35 + k * 0.36, c = cols[Math.floor(r() * 4)]; g.box(x, 0.28, (r() - 0.5) * 0.15, 0.4, 0.56, 0.36, c); g.box(x, 0.6, 0, 0.22, 0.1, 0.18, shade(c, 0.85)); }
  g.box(0, 0.8, 0, 0.42, 0.34, 0.34, cols[1], 0.3);
}
function mailSacks(g, f) {
  f.flat(-0.8, -0.5, 0.9, 0.6, 0.004, K.shadow);
  for (const [x, z, ry] of [[-0.35, 0, 0.2], [0.3, 0.05, -0.3], [0, -0.15, 0]]) { g.box(x, 0.3, z, 0.5, 0.6, 0.42, '#C9B48E', ry); g.box(x, 0.62, z, 0.2, 0.08, 0.18, K.twine, ry); g.box(x, 0.35, z + 0.2, 0.22, 0.14, 0.02, K.red, ry); }
}
function postBox(g, f) {
  g.box(0, 0.55, 0, 0.5, 1.1, 0.5, K.red); g.box(0, 1.15, 0, 0.6, 0.12, 0.6, K.redD); g.box(0, 1.26, 0, 0.4, 0.1, 0.4, K.red);
  g.box(0, 0.85, 0.25, 0.3, 0.06, 0.02, K.ink); g.box(0, 0.6, 0.25, 0.24, 0.16, 0.02, K.white);
  f.flat(-0.4, -0.35, 0.5, 0.45, 0.004, K.shadow);
}
function lowTea(g, f, it) {
  // a street tea table: low table, four tiny stools, glasses and a pot
  const r = rng(it.seed || 2), cs = [K.red, K.blue, K.green, K.mustard];
  f.flat(-0.9, -0.7, 1.0, 0.8, 0.004, K.shadow);
  g.box(0, 0.42, 0, 0.9, 0.05, 0.6, K.woodL);
  for (const sx of [-0.38, 0.38]) for (const sz of [-0.24, 0.24]) g.box(sx, 0.2, sz, 0.05, 0.4, 0.05, K.woodD);
  f.box(-0.15, 0.52, 0, 0.16, 0.16, 0.16, K.white); f.box(-0.15, 0.62, 0, 0.08, 0.04, 0.08, K.gold);
  for (const [x, z] of [[0.12, 0.12], [0.26, -0.08]]) f.box(x, 0.49, z, 0.07, 0.1, 0.07, '#E9C79A');
  for (const [x, z, k] of [[-0.75, 0, 0], [0.75, 0, 1], [0, 0.55, 2], [0, -0.55, 3]]) { const c = cs[(k + Math.floor(r() * 4)) % 4]; g.box(x, 0.26, z, 0.3, 0.05, 0.3, c); g.box(x, 0.12, z, 0.22, 0.24, 0.22, shade(c, 0.8)); }
}
function hawkerMat(g, f, it) {
  // vegetables laid out on a cloth on the ground, a flat basket, the seller's stool and a sun hat
  const r = rng(it.seed || 8), veg = ['#7FAE66', '#E06A3A', '#C8323C', '#E8B832', '#5E8F4C', '#F2D06B', '#8E4A2C'];
  f.flat(-0.9, -0.55, 0.9, 0.55, 0.01, [K.blue, K.maroon, K.teal][Math.floor(r() * 3)]);
  f.flat(-0.8, -0.45, 0.8, 0.45, 0.012, [K.cream, K.envL, '#F2E2C4'][Math.floor(r() * 3)]);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    const x = -0.5 + i * 0.5, z = -0.2 + j * 0.4, c = veg[Math.floor(r() * veg.length)];
    for (let k = 0; k < 3; k++) f.box(x - 0.08 + (k % 2) * 0.14, 0.06 + (k > 1 ? 0.07 : 0), z + (k > 1 ? 0 : 0.06 * (k ? 1 : -1)), 0.12, 0.1, 0.12, c);
  }
  g.box(1.15, 0.12, -0.2, 0.6, 0.12, 0.45, K.twine);
  g.box(-1.1, 0.2, -0.45, 0.3, 0.05, 0.3, K.red); g.box(-1.1, 0.09, -0.45, 0.22, 0.18, 0.22, K.redD);
  g.box(-1.12, 0.26, -0.45, 0.44, 0.03, 0.44, '#E8D2A0'); g.box(-1.12, 0.31, -0.45, 0.2, 0.08, 0.2, '#E8D2A0');
}
function stampLine(g, f, it) {
  // sheets of stamps pegged on a line to dry (the Market prints its own)
  const L = it.len || 3.2;
  for (const sx of [-1, 1]) g.box(sx * L / 2, 0.9, 0, 0.08, 1.8, 0.08, K.woodD);
  g.box(0, 1.72, 0, L, 0.02, 0.02, K.ink);
  let i = 0;
  for (let x = -L / 2 + 0.35; x < L / 2 - 0.3; x += 0.42, i++) {
    const c = (STAMP[STAMP_KEYS[i % STAMP_KEYS.length]])[0];
    g.box(x, 1.5, 0, 0.34, 0.4, 0.02, K.white);
    for (let k = 0; k < 4; k++) f.box(x - 0.08 + (k % 2) * 0.16, 1.58 - (k >> 1) * 0.18, 0.012, 0.12, 0.14, 0.01, c);
    f.box(x, 1.71, 0.02, 0.04, 0.06, 0.03, K.woodL);
  }
}
function planters(g, f, it) {
  const r = rng(it.seed || 3), cols = [K.pink, K.mustard, K.white, '#F3B27A', K.red];
  for (let k = 0; k < 3; k++) {
    const x = -0.4 + k * 0.4, h = 0.3 + r() * 0.2;
    g.box(x, h / 2, (r() - 0.5) * 0.2, 0.32, h, 0.32, k % 2 ? K.terra : K.tin);
    f.box(x, h + 0.14, 0, 0.36, 0.28, 0.36, k === 1 && r() < 0.5 ? K.leafD : K.leaf);
    f.box(x, h + 0.32, 0, 0.14, 0.12, 0.14, cols[Math.floor(r() * cols.length)]);
  }
}
function scribe(g, f) {
  // the public letter-writer's table: a typewriter, a stack of envelopes, an ink pot, two stools, a parasol
  f.flat(-1.0, -0.7, 1.1, 0.8, 0.004, K.shadow);
  g.box(0, 0.72, 0, 1.1, 0.06, 0.6, K.woodL);
  for (const sx of [-0.48, 0.48]) for (const sz of [-0.24, 0.24]) g.box(sx, 0.35, sz, 0.05, 0.7, 0.05, K.woodD);
  g.box(-0.1, 0.84, -0.05, 0.42, 0.16, 0.32, K.ink); g.box(-0.1, 0.94, -0.17, 0.36, 0.08, 0.05, '#555'); g.box(-0.1, 1.0, -0.2, 0.26, 0.16, 0.02, K.white);
  for (let k = 0; k < 4; k++) f.box(0.35, 0.77 + k * 0.03, 0.05, 0.26, 0.025, 0.16, k % 2 ? K.envL : K.white);
  f.box(0.38, 0.8, -0.2, 0.08, 0.1, 0.08, K.ink);
  for (const [z, c] of [[-0.55, K.blue], [0.6, K.red]]) { g.box(0, 0.42, z, 0.32, 0.05, 0.32, c); g.box(0, 0.2, z, 0.24, 0.4, 0.24, shade(c, 0.8)); }
  g.box(0.75, 1.0, 0.0, 0.05, 2.0, 0.05, K.woodD);
  for (let k = 0; k < 8; k++) g.box(0.75 + Math.cos(k * Math.PI / 4) * 0.55, 2.0 - 0.06, Math.sin(k * Math.PI / 4) * 0.55, 0.6, 0.05, 0.6, k % 2 ? K.cream : K.red, k * Math.PI / 4);
}
function handcart(g, f, it) {
  // a two-wheeled handcart of parcels and a basket of stamps' wrapping paper
  f.flat(-1.0, -0.55, 1.1, 0.6, 0.004, K.shadow);
  g.box(0, 0.55, 0, 1.3, 0.07, 0.8, K.woodL);
  for (const sz of [-0.45, 0.45]) { g.box(0.1, 0.32, sz, 0.6, 0.6, 0.05, K.ink); g.box(0.1, 0.32, sz, 0.42, 0.42, 0.06, '#8E8173'); }
  g.boxR(-0.95, 0.42, 0, 0.7, 0.06, 0.6, K.woodD, 0, 0, -0.3);
  for (const [x, z, w, h, c] of [[-0.3, -0.15, 0.5, 0.35, '#C9A57A'], [0.25, 0.1, 0.5, 0.45, K.kraft], [0.0, 0.15, 0.3, 0.25, K.kraftL]]) { g.box(x, 0.6 + h / 2, z, w, h, 0.35, c); g.box(x, 0.6 + h / 2, z, 0.04, h + 0.01, 0.36, K.maroon); }
}
function postmark(g, f, it) {
  // a big postmark printed on the paper (a decal): a double ring with the date bar and five wavy lines
  const r = rng(it.seed || 2), ink = it.ink || '#B8B0C8';
  for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 2; f.flatR(Math.sin(a) * 1.0, Math.cos(a) * 1.0, 0.38, 0.06, 0.006, ink, a); f.flatR(Math.sin(a) * 0.82, Math.cos(a) * 0.82, 0.3, 0.04, 0.006, ink, a); }
  f.flat(-0.6, -0.08, 0.6, 0.08, 0.006, ink);
  for (let j = 0; j < 5; j++) for (let k = 0; k < 6; k++) f.flatR(1.4 + k * 0.42, -0.6 + j * 0.3, 0.44, 0.05, 0.006, ink, (k % 2 ? 0.35 : -0.35) + (r() - 0.5) * 0.05);
}
function paving(g, f, it) {
  // the tea-shop square's brick paving (a decal under the roads), a rim of edge stones
  const W = it.w || 20, D = it.d || 12;
  f.flat(-W / 2, -D / 2, W / 2, D / 2, 0.008, '#E3CFAE');
  for (let z = -D / 2 + 0.5, j = 0; z < D / 2; z += 1.0, j++) for (let x = -W / 2 + (j % 2 ? 0.5 : 0); x < W / 2 - 0.4; x += 1.0) f.flat(x + 0.06, z - 0.44, x + 0.94, z + 0.44, 0.01, ((j * 7 + Math.round(x)) % 5) ? '#E9D6B4' : '#DEC7A2');
  for (const sz of [-1, 1]) f.flat(-W / 2, sz * D / 2 - 0.1, W / 2, sz * D / 2 + 0.1, 0.012, K.stoneD);
}
function signature(g, f) {
  // the letter's sign-off, written large in faded ink on the paper's last third: loops and a long underline
  const ink = '#C9C3D6';
  for (let k = 0; k < 7; k++) { const cx = -6 + k * 2.0, rr = 0.7 + (k % 3) * 0.2; for (let a = 0; a < 12; a++) { const t = (a / 12) * Math.PI * 2; f.flatR(cx + Math.sin(t) * rr, Math.cos(t) * rr * 1.3, 0.42, 0.1, 0.005, ink, t); } }
  f.flatR(0, 2.4, 16, 0.12, 0.005, ink, 0.03);
  f.flatR(7.5, 2.1, 2.6, 0.1, 0.005, ink, -0.4);
}
function kiteRack(g, f, it) {
  // a bamboo rack with kites drying on it (children's, at the field's edge)
  const cols = [K.red, K.mustard, K.blue, K.green, K.pink];
  for (const sx of [-1.1, 1.1]) g.box(sx, 0.8, 0, 0.08, 1.6, 0.08, '#C9B26A');
  g.box(0, 1.55, 0, 2.4, 0.05, 0.05, '#C9B26A');
  for (let k = 0; k < 4; k++) { const x = -0.8 + k * 0.53; g.boxR(x, 1.15, 0.03, 0.38, 0.38, 0.02, cols[k], 0, 0, Math.PI / 4); g.boxR(x, 1.15, 0.05, 0.24, 0.24, 0.02, cols[(k + 2) % 5], 0, 0, Math.PI / 4); f.box(x, 0.7, 0.04, 0.015, 0.4, 0.01, K.ink); }
  f.flat(-1.3, -0.2, 1.4, 0.3, 0.004, K.shadow);
}

export const PROP = {
  pageCrease: { draw: pageCrease, obstacles: () => [] },
  thanaka: { draw: thanaka, obstacles: (it) => [box(it, 0.8, 0.6, 0, 0)] },
  planeTable: { draw: planeTable, obstacles: (it) => [box(it, 1.35, 0.7, 0, 0)] },
  bambooPost: { draw: bambooPost, r: 0.15 },
  pump: { draw: pump, obstacles: (it) => [circ(it, 0, -0.05, 0.35)] },
  envCrates: { draw: envCrates, obstacles: (it) => [box(it, (it.w || 1.6) + 0.1, 0.7, 0, 0)] },
  riceCart: { draw: riceCart, obstacles: (it) => [box(it, 1.6, 1.0, 0, 0)] },
  flatStone: { draw: flatStone, obstacles: () => [] },
  dogBed: { draw: dogBed, obstacles: () => [] },
  dog: { draw: dog, obstacles: (it) => [circ(it, 0, 0, 0.32)] },
  cat: { draw: cat, obstacles: () => [] },
  goat: { draw: goat, obstacles: (it) => [circ(it, 0, 0, 0.45)] },
  trishaw: { draw: trishaw, obstacles: (it) => [box(it, 1.6, 1.4, 0, 0.1)] },
  crates: { draw: crates, obstacles: (it) => [box(it, 1.3, 0.65, 0, 0)] },
  sacks: { draw: sacks, obstacles: (it) => [box(it, 1.2, 0.5, 0, 0)] },
  mailSacks: { draw: mailSacks, obstacles: (it) => [box(it, 1.2, 0.6, 0, 0)] },
  postBox: { draw: postBox, r: 0.32 },
  lowTea: { draw: lowTea, obstacles: (it) => [box(it, 0.9, 0.6, 0, 0)] },
  hawkerMat: { draw: hawkerMat, obstacles: (it) => [box(it, 1.6, 0.9, 0, 0)] },
  stampLine: { draw: stampLine, obstacles: (it) => [circ(it, -(it.len || 3.2) / 2, 0, 0.12), circ(it, (it.len || 3.2) / 2, 0, 0.12)] },
  planters: { draw: planters, obstacles: (it) => [box(it, 1.2, 0.45, 0, 0)] },
  scribe: { draw: scribe, obstacles: (it) => [box(it, 1.1, 0.6, 0, 0)] },
  handcart: { draw: handcart, obstacles: (it) => [box(it, 1.8, 1.0, -0.2, 0)] },
  postmark: { draw: postmark, obstacles: () => [] },
  paving: { draw: paving, obstacles: () => [] },
  signature: { draw: signature, obstacles: () => [] },
  kiteRack: { draw: kiteRack, obstacles: (it) => [circ(it, -1.1, 0, 0.12), circ(it, 1.1, 0, 0.12)] },
};

// the flat (unoutlined) geo of the item being drawn, for the small builders that only get `g` (win, flap)
let FLAT_G = null;
for (const T of [ART, PROP]) for (const k of Object.keys(T)) {
  const d = T[k], fn = typeof d === 'function' ? d : d.draw;
  const wrapped = (g, f, it, ctx) => { FLAT_G = f; try { return fn(g, f, it, ctx); } finally { FLAT_G = null; } };
  if (typeof d === 'function') T[k] = wrapped; else d.draw = wrapped;
}
