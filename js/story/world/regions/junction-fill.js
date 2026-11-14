// Newsprint Junction's fill pass: the homes, back lots and yards a small Burmese town has on every block, where the
// shots still showed wide bare paper (the west bank's back lots and lane, the yards behind the east bank's north
// frontage, both sides of the road north and the east road, the block below the square, Ink Lane's south side and
// the gardens down to the page's bottom edge). Called once from regions/junction.js: fill({ ITEMS, add, folk,
// keep, roads, paths }) after the hand-placed street life and BEFORE the scatter, so the scatter's gardens, hens and
// ground patches settle round these homes. Each thing here checks it is clear of the roads, the doors, the desks,
// the day scripts' spots and everything hand-placed before it goes down; loose yard bits (a garden bed, a hen, a
// tuft) under a new home's footprint are lifted away, anything else makes the home step aside or stay out.
//
// Cheap on purpose (phone budget): every home is a handful of merged boxes in the chunk's solids (no draw call of
// its own), the far-back ones a shack of four. Imports only kit.js / toon.js / voxel.js and the Junction's own art
// palette. Original art; nothing here marks a way (no arrows, no glow, no path); every Burmese string is a draft for
// Maya, every line { my, en }.
//
// ART:
//   jHome { w, d, seed, style, door, shop?, roof? }   a one-storey home, front +Z. style: 'brick' (lime-washed or bare
//        brick on a plinth, hip roof, porch hood), 'wood' (board walls on low posts, a front porch, tin gable),
//        'stilt' (bamboo walls up on posts, a veranda and steps, tin or thatch gable). shop: the front opened up
//        (shelves, a counter, a short awning). door = the doorway's local x (the yard's gate lines up with it)
//   jShop2 { w, d, seed, door }   a two-storey shophouse (shop below, two shuttered windows above, slate gable)
//   jShack { w, d, seed }   a back-lot shed or hut: one room, a door, a lean-to roof
// PROP:
//   jYard { len, kind: 'bamboo' | 'picket' | 'wall' | 'hedge' | 'stick', gate, gw, seed }   a front fence with a
//        gateway at local x `gate` (gw wide; no gate when undefined). Keep-out only on the panels.
//   jPots { n, seed }   clay pots of herbs and flowers in a row
//   jStallLow { seed, goods }   a roadside table under a sun umbrella with a stool (knee-to-head height)
//   jSignPost { name: { my, en }, color }   a shop's name board on two posts (a trade name, never a way)
import { rng, shade } from '../kit.js';
import { J, rotBox } from '../art/junction.js';
import { jitter } from '../../../game/voxel.js';

const PI = Math.PI, HP = PI / 2;
const LIME = ['#F4EBDA', '#EFE2C8', '#F1E6D2', '#E6E1D5', '#DCE4E6', '#EAD9C9', '#DDE3CF', '#F0DDB0', '#E9E2D0'];
const WOOD = ['#CDA577', '#B8916A', '#A88B66', '#C9A77E', '#9C7A58'];
const BAMBOO = ['#D8C27E', '#CDB46E', '#E0CC8E'];
const TIN = ['#9AA6AE', '#7C8890', '#A0643C', '#8E9A8C', '#6F8F7A', '#B3B0A6', '#8E4A2C'];
const TILE = ['#A0642E', '#8E3B2E', '#B07A3A', '#7E4A2E', '#6E1F2A'];
const THATCH = ['#C9AE7E', '#B89A66'];
const SHUT = [J.teal, J.red, J.blue, J.green, J.woodD, J.mustard, J.slate];
const GOODS = [J.mustard, J.red, J.blue, J.white, J.teal, '#F3B27A', J.newsL, J.greenL];
const pick = (arr, r) => arr[Math.floor(r() * arr.length) % arr.length];

// ---------------------------------------------------------------------------------
// small builders (item-local, front +Z)
// ---------------------------------------------------------------------------------
/** a gable roof running along x: two slopes, a ridge cap (5 boxes) */
function gable(g, W, D, y0, rise, color, over = 0.35) {
  const half = D / 2 + over, ang = Math.atan2(rise, D / 2), slope = half / Math.cos(ang);
  for (const sz of [-1, 1]) g.boxR(0, y0 + rise / 2 + 0.06, (sz * half) / 2, W + over * 2, 0.12, slope, color, sz * ang, 0, 0);
  g.box(0, y0 + rise + 0.1, 0, W + over * 2 + 0.06, 0.12, 0.26, shade(color, 0.82));
}
/** the gable's end wall, stepped (2 boxes) */
function gableFill(g, W, D, y0, rise, color) {
  for (let i = 0; i < 2; i++) g.box(0, y0 + (rise * (i + 0.5)) / 2, 0, W - 0.04, rise / 2, D * (1 - (i + 0.6) / 2.2), color);
}
/** a stepped hip roof (4 boxes) */
function hipRoof(g, W, D, y0, color) {
  const w0 = W + 0.55, d0 = D + 0.55;
  g.box(0, y0 + 0.05, 0, w0 + 0.06, 0.1, d0 + 0.06, shade(color, 0.7));
  for (let i = 0; i < 3; i++) {
    const k = i / 3, w = w0 - k * Math.min(W * 0.55, 2.8), d = d0 * (1 - k * 0.78);
    g.box(0, y0 + 0.1 + 0.28 * (i + 0.5), 0, w, 0.28, d, i % 2 ? color : shade(color, 0.9));
  }
}
/** a flat upright quad on the SOLIDS facing local +Z (sz = 1) or -Z (sz = -1): two triangles, no outline, and it
 *  carries its home's anchor, so it fades with the home when the cutaway lifts it (details on the ground Geo would
 *  stay hanging in the air) */
function faceZ(g, x, y, z, w, h, col, sz = 1) {
  const P = (lx, ly) => [g.tx + lx * g.tc + z * g.ts, g.ty + ly, g.tz - lx * g.ts + z * g.tc];
  g.quad(P(x - w / 2, y - h / 2), P(x + w / 2, y - h / 2), P(x + w / 2, y + h / 2), P(x - w / 2, y + h / 2), col, sz * g.ts, 0, sz * g.tc);
}
/** a window on a wall facing +Z (sz = 1) or -Z (sz = -1): white frame, dark pane, a curtain, shutters as flat boards */
function win(g, f, x, y, z, w, h, shut, sz = 1) {
  g.box(x, y, z, w + 0.12, h + 0.12, 0.06, J.white);
  faceZ(g, x, y, z + sz * 0.035, w, h, J.inside, sz);
  faceZ(g, x, y + h * 0.18, z + sz * 0.04, w * 0.86, h * 0.36, J.cream, sz); // a curtain
  if (shut) for (const sx of [-1, 1]) faceZ(g, x + sx * (w / 2 + 0.2), y, z + sz * 0.02, 0.3, h, shut, sz);
}

// ---------------------------------------------------------------------------------
// ART
// ---------------------------------------------------------------------------------
/** a back-lot home seen only across yards or from above (far from every street): the same look in a third of the
 *  boxes (walls, a roof, the doorway and windows as flat quads) */
function jHomeFar(g, f, it) {
  const W = it.w || 4.6, D = it.d || 4.6, seed = it.seed || 1, r = rng(seed), style = it.style || 'brick', dx = it.door ?? 0, fz = D / 2;
  const shut = pick(SHUT, r);
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.4, D / 2 + 0.8, 0.004, J.shadow);
  let y0 = 0, H = 2.6, wall, roof;
  if (style === 'stilt') {
    y0 = 1.0; H = 2.2; wall = jitter(pick(BAMBOO, r), 0.05, seed); roof = r() < 0.3 ? pick(THATCH, r) : pick(TIN, r);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (W / 2 - 0.15), y0 / 2, sz * (D / 2 - 0.15), 0.18, y0, 0.18, J.woodD);
  } else if (style === 'wood') { y0 = 0.45; H = 2.45; wall = jitter(pick(WOOD, r), 0.04, seed); roof = pick(TIN, r); }
  else { wall = r() < 0.25 ? J.brickL : jitter(pick(LIME, r), 0.03, seed); roof = r() < 0.6 ? pick(TILE, r) : pick(TIN, r); }
  g.box(0, (y0 + 0.1) / 2, 0, W + 0.1, y0 + 0.1, D + 0.1, style === 'brick' ? J.stoneD : J.woodL); // plinth or floor
  g.box(0, y0 + 0.1 + H / 2, 0, W, H, D, wall);
  faceZ(g, dx, y0 + 0.1 + 0.95, fz + 0.01, 0.9, 1.9, shut);
  for (const sx of [-1, 1]) { const x = dx + sx * Math.max(1.25, W * 0.28); if (Math.abs(x) < W / 2 - 0.5) faceZ(g, x, y0 + 1.55, fz + 0.01, 0.75, 0.75, J.inside); }
  faceZ(g, 0, y0 + 1.55, -D / 2 - 0.01, 0.75, 0.7, J.inside, -1);
  if (style === 'brick') {
    for (let i = 0; i < 3; i++) { const k = i / 3; g.box(0, y0 + 0.1 + H + 0.28 * (i + 0.5), 0, W + 0.55 - k * Math.min(W * 0.55, 2.8), 0.28, (D + 0.55) * (1 - k * 0.78), i % 2 ? roof : shade(roof, 0.9)); }
  } else {
    g.box(0, y0 + 0.1 + H + 0.25, 0, W - 0.06, 0.5, D * 0.5, shade(wall, 0.94)); // the gable's end walls, in one block (under the slopes)
    gable(g, W, D, y0 + 0.1 + H, 1.0, roof, 0.4);
  }
}
function jHome(g, f, it, ctx) {
  const W = it.w || 4.6, D = it.d || 4.6, seed = it.seed || 1, r = rng(seed), style = it.style || 'brick';
  if (it.far) return jHomeFar(g, f, it);
  const shut = pick(SHUT, r), dx = it.door ?? 0, fz = D / 2;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.4, D / 2 + 0.8, 0.004, J.shadow);
  if (style === 'stilt') {
    // bamboo walls up on posts, set back behind a veranda; steps down at the door; a tin or thatch gable
    const Hs = 1.0, H = 2.2, VD = 1.1, wz = fz - VD, roof = it.roof || (r() < 0.3 ? pick(THATCH, r) : pick(TIN, r));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (W / 2 - 0.15), Hs / 2, sz * (D / 2 - 0.15), 0.18, Hs, 0.18, J.woodD);
    g.box(0, Hs + 0.05, 0, W + 0.1, 0.1, D + 0.1, J.woodL); // the floor
    const wall = jitter(pick(BAMBOO, r), 0.05, seed);
    g.box(0, Hs + 0.1 + H / 2, (wz - D / 2) / 2, W - 0.1, H, wz + D / 2, wall);
    for (let k = 0; k < 2; k++) faceZ(g, 0, Hs + 0.7 + k * 0.85, wz + 0.01, W - 0.12, 0.05, J.woodG); // the weave's bands
    g.box(dx, Hs + 0.1 + 0.92, wz + 0.03, 0.85, 1.84, 0.05, J.inside);
    const wx = dx > 0 ? -W * 0.24 : W * 0.24;
    g.box(wx, Hs + 1.4, wz + 0.03, 0.85, 0.65, 0.05, J.inside);
    g.boxR(wx, Hs + 1.8, wz + 0.25, 0.92, 0.05, 0.5, J.woodG, -0.7, 0, 0); // the shutter propped open
    g.box(0, Hs + 1.4, -D / 2 - 0.02, 0.8, 0.6, 0.05, J.inside); // a back window
    for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.12), Hs + 0.1 + H / 2, fz - 0.12, 0.12, H, 0.12, J.woodD); // veranda posts
    g.box(0, Hs + 0.6, fz - 0.08, W - 0.3, 0.07, 0.07, J.woodL); // the rail
    for (let k = 0; k < 3; k++) g.box(dx, Hs - 0.2 - k * 0.3, fz + 0.22 + k * 0.3, 0.95, 0.07, 0.3, J.woodL); // steps
    g.box(-dx * 0.6 + (dx ? 0 : 0.9), Hs + 0.32, fz - 0.5, 0.36, 0.36, 0.36, J.terra); // a water pot on the veranda
    gableFill(g, W - 0.1, D * 0.5, Hs + 0.1 + H, 0.95, shade(wall, 0.95));
    gable(g, W, D, Hs + 0.1 + H, 1.05, roof);
    return;
  }
  if (style === 'wood') {
    // board walls on low posts, a porch across the front, a tin gable
    const Hp = 0.45, H = 2.45, PD = 1.0, wz = fz - PD, wall = it.wall || jitter(pick(WOOD, r), 0.04, seed), roof = it.roof || pick(TIN, r);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (W / 2 - 0.15), Hp / 2, sz * (D / 2 - 0.15), 0.18, Hp, 0.18, J.woodD);
    g.box(0, Hp + 0.04, 0, W + 0.06, 0.08, D + 0.06, J.woodL); // floor and porch deck
    g.box(0, Hp + 0.08 + H / 2, (wz - D / 2) / 2, W - 0.06, H, wz + D / 2, wall);
    for (let k = 0; k < 3; k++) faceZ(g, 0, Hp + 0.6 + k * 0.62, wz + 0.01, W - 0.1, 0.03, shade(wall, 0.82)); // board joints
    if (it.shop) {
      g.box(0, Hp + 1.2, wz + 0.02, W - 1.0, 1.9, 0.04, J.inside);
      for (let k = 0; k < 2; k++) for (let x = -W / 2 + 0.8; x < W / 2 - 0.7; x += 0.45) faceZ(g, x, Hp + 0.75 + k * 0.6, wz + 0.04, 0.3, 0.26, GOODS[Math.floor(r() * GOODS.length)]);
      g.box(0, Hp + 0.45, wz + 0.4, W - 1.2, 0.7, 0.4, J.woodG); // the counter
    } else {
      g.box(dx, Hp + 0.08 + 0.95, wz + 0.03, 0.9, 1.9, 0.05, shut);
      for (const sx of [-1, 1]) { const x = dx + sx * Math.max(1.25, W * 0.28); if (Math.abs(x) < W / 2 - 0.5) win(g, f, x, Hp + 1.45, wz + 0.02, 0.75, 0.75, shut); }
    }
    win(g, f, 0, Hp + 1.45, -D / 2 - 0.02, 0.75, 0.7, null, -1); // a back window
    for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.1), Hp + 0.08 + H / 2, fz - 0.1, 0.12, H, 0.12, J.woodD); // porch posts
    for (const sx of [-1, 1]) { const xa = sx < 0 ? -W / 2 + 0.15 : dx + 0.6, xb = sx < 0 ? dx - 0.6 : W / 2 - 0.15; if (xb - xa > 0.4) g.box((xa + xb) / 2, Hp + 0.55, fz - 0.08, xb - xa, 0.06, 0.06, J.woodL); }
    g.box(dx, 0.2, fz + 0.25, 1.0, 0.08, 0.4, J.woodG); // the step
    gableFill(g, W - 0.06, D * 0.55, Hp + 0.08 + H, 0.9, shade(wall, 0.94));
    gable(g, W, D, Hp + 0.08 + H, 1.0, roof, 0.4);
    return;
  }
  // 'brick': a lime-washed (or bare brick) storey on a stone plinth, a stepped hip roof, a hood over the door
  const H = 2.7, bare = r() < 0.25, wall = it.wall || (bare ? J.brickL : jitter(pick(LIME, r), 0.03, seed)), roof = it.roof || (r() < 0.6 ? pick(TILE, r) : pick(TIN, r));
  g.box(0, 0.12, 0, W + 0.16, 0.24, D + 0.16, J.stoneD);
  g.box(0, 0.24 + H / 2, 0, W, H, D, wall);
  faceZ(g, 0, 0.36, fz + 0.01, W, 0.22, shade(wall, 0.84)); // the skirting
  if (bare) for (let k = 0; k < 4; k++) faceZ(g, 0, 0.7 + k * 0.55, fz + 0.012, W - 0.02, 0.03, J.mortar);
  if (it.shop) {
    g.box(0, 1.35, fz + 0.02, W - 0.9, 2.0, 0.04, J.inside);
    for (let k = 0; k < 2; k++) {
      faceZ(g, 0, 0.75 + k * 0.62, fz + 0.04, W - 1.1, 0.05, J.woodL);
      for (let x = -W / 2 + 0.75; x < W / 2 - 0.65; x += 0.45) faceZ(g, x, 0.9 + k * 0.62, fz + 0.045, 0.3, 0.24, GOODS[Math.floor(r() * GOODS.length)]);
    }
    const awn = pick([J.red, J.teal, J.blue, J.green, J.mustard], r);
    for (let i = 0; i < 4; i++) g.boxR(-W / 2 + (W * (i + 0.5)) / 4, 2.62, fz + 0.5, W / 4 + 0.002, 0.05, 1.05, i % 2 ? J.white : awn, 0.32, 0, 0);
  } else {
    g.box(dx, 1.2, fz + 0.02, 0.95, 1.9, 0.05, shut);
    for (const sx of [-1, 1]) { const x = dx + sx * Math.max(1.3, W * 0.29); if (Math.abs(x) < W / 2 - 0.5) win(g, f, x, 1.55, fz + 0.03, 0.78, 0.82, shut); }
    g.boxR(dx, 2.45, fz + 0.38, 1.5, 0.07, 0.8, shade(roof, 0.95), 0.28, 0, 0); // the hood over the door
    g.box(dx, 0.1, fz + 0.3, 1.3, 0.2, 0.45, J.stone); // the step
  }
  win(g, f, (seed % 2 ? 1 : -1) * W * 0.2, 1.6, -D / 2 - 0.03, 0.75, 0.75, null, -1); // a back window
  hipRoof(g, W, D, 0.24 + H, roof);
}

function jShop2(g, f, it, ctx) {
  const W = it.w || 5, D = it.d || 5.6, seed = it.seed || 1, r = rng(seed), fz = D / 2;
  const wall = it.wall || jitter(pick(LIME, r), 0.03, seed), shut = pick(SHUT, r), roof = it.roof || pick([J.slate, J.slateD, '#5E4B3C', J.maroon, J.tinD], r);
  const H1 = 3.0, H2 = 5.4;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.4, D / 2 + 0.9, 0.004, J.shadow);
  g.box(0, 0.1, 0, W + 0.12, 0.2, D + 0.12, J.stoneD);
  g.box(0, (0.2 + H1) / 2, -0.5, W, H1 - 0.2, D - 1.0, shade(wall, 0.96)); // the ground floor, back behind the opening
  for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.22), (0.2 + H1) / 2, fz - 0.5, 0.44, H1 - 0.2, 1.0, shade(wall, 0.92));
  g.box(0, 1.55, fz - 0.98, W - 0.9, 2.6, 0.04, J.inside);
  for (let k = 0; k < 2; k++) for (let x = -W / 2 + 0.8; x < W / 2 - 0.7; x += 0.45) faceZ(g, x, 1.0 + k * 0.62, fz - 0.95, 0.3, 0.26, GOODS[Math.floor(r() * GOODS.length)]);
  g.box(0, 0.55, fz - 0.35, W - 1.4, 0.7, 0.45, J.woodG); // the counter
  g.box(0, (H1 + H2) / 2, 0, W, H2 - H1, D, wall); // upstairs
  g.box(0, H1, fz + 0.04, W + 0.06, 0.16, 0.12, J.ink); // the floor band
  for (const wx of [-W / 4, W / 4]) win(g, f, wx, H1 + 1.2, fz + 0.02, 0.8, 1.0, shut);
  win(g, f, 0, H1 + 1.2, -D / 2 - 0.02, 0.8, 0.9, null, -1);
  const awn = pick([J.red, J.teal, J.blue, J.green], r);
  for (let i = 0; i < 5; i++) g.boxR(-W / 2 + (W * (i + 0.5)) / 5, 2.75, fz + 0.55, W / 5 + 0.002, 0.05, 1.15, i % 2 ? J.white : awn, 0.3, 0, 0);
  gableFill(g, W - 0.06, D * 0.55, H2, 1.0, shade(wall, 0.92));
  gable(g, W, D, H2, 1.15, roof, 0.4);
}

function jShack(g, f, it) {
  const W = it.w || 3.2, D = it.d || 3.0, r = rng(it.seed || 3), H = 2.1;
  const wall = r() < 0.5 ? jitter(pick(BAMBOO, r), 0.05, it.seed || 3) : jitter(pick(WOOD, r), 0.04, it.seed || 3), roof = pick(TIN, r);
  f.flat(-W / 2 - 0.25, -D / 2 - 0.25, W / 2 + 0.3, D / 2 + 0.6, 0.004, J.shadow);
  g.box(0, H / 2, 0, W, H, D, wall);
  g.box((r() - 0.5) * (W - 1.2), 0.85, D / 2 + 0.02, 0.8, 1.7, 0.05, J.inside);
  g.boxR(0, H + 0.2, 0.1, W + 0.5, 0.08, D + 0.6, roof, -0.16, 0, 0); // the lean-to tin, high at the front
  faceZ(g, 0, H - 0.25, D / 2 + 0.01, W, 0.05, J.woodD);
}

const homeBox = (it) => [rotBox(it, (it.w || 4.6) - 0.1, (it.d || 4.6) - 0.1)];
export const ART = {
  jHome: { h: 4.4, map: true, draw: jHome, obstacles: (it) => [...homeBox(it), ...(it.style === 'stilt' ? [rotBox(it, 1.1, 0.9, it.door || 0, (it.d || 4.6) / 2 + 0.55)] : [])] },
  jShop2: { h: 6.6, map: true, draw: jShop2, obstacles: (it) => [rotBox(it, (it.w || 5) - 0.1, (it.d || 5.6) - 1.0, 0, -0.5)] },
  jShack: { h: 2.8, map: true, draw: jShack, obstacles: homeBox },
};

// ---------------------------------------------------------------------------------
// PROP
// ---------------------------------------------------------------------------------
/** the fence's panels as [x0, x1] spans (local x), the gateway left open */
function yardSpans(it) {
  const L = it.len || 5, gw = it.gw || 1.3;
  if (it.gate === undefined || it.gate === null) return [[-L / 2, L / 2]];
  const out = [];
  if (it.gate - gw / 2 > -L / 2 + 0.2) out.push([-L / 2, it.gate - gw / 2]);
  if (it.gate + gw / 2 < L / 2 - 0.2) out.push([it.gate + gw / 2, L / 2]);
  return out;
}
function jYard(g, f, it) {
  const r = rng(it.seed || 7), kind = it.kind || 'bamboo';
  for (const [a, b] of yardSpans(it)) {
    const L = b - a, cx = (a + b) / 2;
    if (kind === 'wall') {
      g.box(cx, 0.42, 0, L, 0.84, 0.22, J.stoneL);
      g.box(cx, 0.88, 0, L + 0.04, 0.08, 0.3, J.stoneD);
    } else if (kind === 'hedge') {
      g.box(cx, 0.42, 0, L, 0.84, 0.6, jitter(J.leafD, 0.04, it.seed || 7));
      for (let x = a + 0.4; x < b - 0.2; x += 0.9) f.box(x, 0.88, (r() - 0.5) * 0.2, 0.5, 0.16, 0.44, r() < 0.3 ? J.leafL : J.leaf);
    } else if (kind === 'picket') {
      for (const y of [0.35, 0.75]) g.box(cx, y, 0, L, 0.07, 0.05, J.white);
      for (let x = a + 0.1; x <= b - 0.05; x += 0.36) f.box(x, 0.48, 0.035, 0.08, 0.9, 0.03, J.newsL);
      for (const x of [a + 0.05, b - 0.05]) g.box(x, 0.5, 0, 0.1, 1.0, 0.1, J.woodD);
    } else if (kind === 'stick') {
      for (let x = a + 0.05; x <= b; x += Math.max(0.8, L / Math.ceil(L / 1.4))) g.box(x, 0.45, 0, 0.08, 0.9, 0.08, J.woodG);
      for (const y of [0.4, 0.75]) f.box(cx, y, 0, L, 0.04, 0.04, J.ropeD);
    } else { // woven bamboo panels between posts
      g.box(cx, 0.55, 0, L, 1.0, 0.06, jitter(J.rope, 0.04, it.seed || 7));
      f.box(cx, 0.85, 0.04, L, 0.05, 0.02, J.ropeD);
      for (const x of [a + 0.05, b - 0.05]) g.box(x, 0.62, 0, 0.09, 1.24, 0.09, J.woodG);
    }
  }
  if (it.gate !== undefined && it.gate !== null && kind !== 'hedge') {
    const gw = it.gw || 1.3;
    for (const sx of [-1, 1]) g.box(it.gate + sx * gw / 2, 0.7, 0, 0.12, 1.4, 0.12, J.woodD);
    if (kind !== 'stick') g.boxR(it.gate - gw / 2 + 0.3, 0.55, 0.3, 0.06, 0.9, 0.62, kind === 'picket' ? J.white : J.woodL, 0, -1.0, 0); // the gate, open inwards
  }
}
function jPots(g, f, it) {
  const r = rng(it.seed || 3), n = it.n || 3, flw = [J.red, J.mustard, J.rose, J.white, '#D86B2A'];
  for (let k = 0; k < n; k++) {
    const x = (k - (n - 1) / 2) * 0.48, h = 0.22 + r() * 0.12;
    g.box(x, h / 2, 0, 0.3, h, 0.3, k % 2 ? J.terra : J.terraD);
    f.box(x, h + 0.13, 0, 0.34, 0.24, 0.34, r() < 0.5 ? J.leaf : J.leafD);
    if (r() < 0.65) f.box(x + 0.04, h + 0.28, 0.04, 0.13, 0.08, 0.13, pick(flw, r));
  }
}
function jStallLow(g, f, it) {
  const r = rng(it.seed || 5), canopy = pick([J.red, J.teal, J.blue, J.mustard, J.green], r);
  f.flat(-0.9, -0.6, 0.9, 0.7, 0.004, J.shadow);
  g.box(0, 0.72, 0, 1.3, 0.06, 0.7, J.woodL); // the table
  for (const sx of [-1, 1]) f.box(sx * 0.58, 0.36, 0, 0.06, 0.72, 0.6, J.woodD);
  for (let k = 0; k < 4; k++) g.box(-0.45 + k * 0.3, 0.84, (r() - 0.5) * 0.3, 0.24, 0.18, 0.24, pick(GOODS, r)); // the goods
  g.box(0.75, 1.1, -0.3, 0.05, 2.2, 0.05, J.ink); // the umbrella's pole
  g.box(0.3, 2.15, -0.05, 2.0, 0.1, 1.7, canopy);
  g.box(0.3, 2.24, -0.05, 1.2, 0.08, 1.0, J.white);
  g.box(0.2, 0.22, 0.65, 0.34, 0.44, 0.34, pick([J.red, J.blue, J.teal], r)); // the stool
}
function jSignPost(g, f, it, ctx) {
  const col = it.color || J.maroon;
  for (const sx of [-0.62, 0.62]) g.box(sx, 0.95, 0, 0.09, 1.9, 0.09, J.woodD);
  g.box(0, 1.62, 0, 1.5, 0.58, 0.07, col);
  g.box(0, 1.62, 0.04, 1.4, 0.48, 0.02, J.cream);
  if (it.name) ctx.signs.push({ x: 0, y: 1.62, z: 0.06, w: 1.36, h: 0.46, lines: [{ text: it.name.my, size: 52 }, { text: it.name.en, size: 22, font: 'serif', weight: 600, color: col }], bg: '#F7EFDD', border: null, width: 448, height: 152 });
}
export const PROP = {
  jYard: { draw: jYard, obstacles: (it) => yardSpans(it).map(([a, b]) => rotBox(it, b - a, it.kind === 'hedge' ? 0.6 : 0.2, (a + b) / 2, 0)) },
  jPots: { draw: jPots, obstacles: (it) => [rotBox(it, (it.n || 3) * 0.48, 0.36)] },
  jStallLow: { draw: jStallLow, obstacles: (it) => [rotBox(it, 1.4, 0.8), rotBox(it, 0.4, 0.4, 0.2, 0.65)] },
  jSignPost: { draw: jSignPost, obstacles: (it) => [rotBox(it, 0.2, 0.2, -0.62, 0), rotBox(it, 0.2, 0.2, 0.62, 0)] },
};

// ---------------------------------------------------------------------------------
// The fill
// ---------------------------------------------------------------------------------
// loose yard bits a new home may lift off its footprint (they are scenery, not anyone's spot)
const LOOSE = new Set(['jPatch', 'jPrint', 'jPetals', 'jChalkArt', 'tufts', 'garden', 'hens', 'laundry', 'woodpile', 'jars', 'jBanana', 'flowers',
  'planters', 'goat', 'jCrates', 'jSheets', 'jBundles', 'jDryMats', 'padauk', 'rain', 'jPigeons', 'jWaterPot', 'well', 'fence']);
const FLAT = new Set(['jPatch', 'jPrint', 'jPetals', 'jChalkArt', 'tufts', 'jHopscotch', 'jSix', 'jPaving']);
const LEN = new Set(['fence', 'laundry', 'jLip', 'jVerge', 'jYardWall', 'jSheets', 'jRope', 'jYard', 'hedge']);
/** an item's footprint [x0, z0, x1, z1] in world metres (flat ground decals: null) */
export function rectOf(it) {
  if (FLAT.has(it.k)) return it.k === 'jPaving' ? [it.x - it.w / 2, it.z - it.d / 2, it.x + it.w / 2, it.z + it.d / 2] : null;
  let hw, hd;
  if (it.k === 'padauk' || it.k === 'rain') hw = hd = 1.1 * (it.s || 1);
  else if (it.w && it.d) { hw = it.w / 2; hd = it.d / 2; }
  else if (LEN.has(it.k) && it.len) { hw = it.len / 2; hd = it.k === 'jVerge' ? 0.6 : it.k === 'hedge' ? 0.4 : 0.25; }
  else if (it.k === 'jFolk') hw = hd = 0.35;
  else if (it.k === 'lamp') hw = hd = 0.3;
  else if (it.k === 'jPots') { hw = (it.n || 3) * 0.24; hd = 0.2; }
  else if (it.k === 'bikes') { hw = 0.6; hd = 0.3; }
  else if (it.k === 'jars') hw = hd = 0.5;
  else if (it.k === 'bench') { hw = 0.8; hd = 0.3; }
  else if (it.k === 'jSignPost') { hw = 0.75; hd = 0.12; }
  else hw = hd = 0.65;
  const c = Math.abs(Math.cos(it.ry || 0)), s = Math.abs(Math.sin(it.ry || 0));
  const ex = c * hw + s * hd, ez = s * hw + c * hd;
  return [it.x - ex, it.z - ez, it.x + ex, it.z + ez];
}
const gap = (a, b) => Math.max(a[0] - b[2], b[0] - a[2], a[1] - b[3], b[1] - a[3]); // < 0: they overlap
const ptRect = (x, z, q) => Math.hypot(Math.max(q[0] - x, 0, x - q[2]), Math.max(q[1] - z, 0, z - q[3]));

/**
 * Fill. ITEMS/add/folk are junction.js's own. keep: rects nothing may touch (day spots, doors, desks); roads: the
 * street centre polylines [[x, z], ...]; paths: the pencil footpaths. Returns { added, lifted, skipped } for the tests.
 */
export function fill({ ITEMS, add, folk, keep, roads, paths, region }) {
  const skipped = [], lifted = [];
  const base = ITEMS.length;
  const segDist = (q, lines) => {
    let best = Infinity;
    for (const pts of lines) for (let k = 0; k < pts.length - 1; k++) {
      const [xa, za] = pts[k], [xb, zb] = pts[k + 1], L = Math.hypot(xb - xa, zb - za), n = Math.max(1, Math.ceil(L / 0.5));
      for (let i = 0; i <= n; i++) best = Math.min(best, ptRect(xa + ((xb - xa) * i) / n, za + ((zb - za) * i) / n, q));
    }
    return best;
  };
  const [RX0, RZ0, RX1, RZ1] = region;
  const onPaper = (q) => q[0] > RX0 + 0.5 && q[2] < RX1 - 0.4 && q[1] > RZ0 + 0.5 && q[3] < RZ1 - 0.5 && (q[2] < 78.0 || q[0] > 120.0);
  /** why a rect cannot go down (null = it can); loose things under it are listed in `under` */
  const why = (q, o) => {
    if (!onPaper(q)) return 'edge';
    if (segDist(q, roads) < o.road) return 'road';
    if (segDist(q, paths) < o.path) return 'path';
    for (const k of keep) if (gap(q, k) < o.keep) return 'keep';
    o.under = [];
    for (let i = 0; i < ITEMS.length; i++) {
      const it = ITEMS[i], b = rectOf(it);
      if (!b || gap(q, b) >= o.gap) continue;
      if (o.lift && LOOSE.has(it.k) && gap(q, b) < 0.3) { o.under.push(i); continue; }
      if (o.lift && LOOSE.has(it.k)) continue; // close but not under: it may stay
      return `${it.k}@${it.x.toFixed(1)},${it.z.toFixed(1)}`;
    }
    return null;
  };
  const liftAway = (idx) => { for (const i of idx.sort((a, b) => b - a)) { lifted.push(ITEMS[i].k); ITEMS.splice(i, 1); } };
  const rectFor = (x, z, w, d, ry) => { const c = Math.abs(Math.cos(ry)) > 0.5; const hw = (c ? w : d) / 2, hd = (c ? d : w) / 2; return [x - hw, z - hd, x + hw, z + hd]; };

  /** a home at centre (x, z) turned ry; nudged along `slide` (world dir) up to 2 m when something is in the way.
   *  yard: what stands round it, [k, lx, lz, extra] in the home's local frame (lz from the FRONT face, + outwards). */
  const home = (k, x, z, w, d, ry, seed, extra = {}, yard = []) => {
    const r = rng(seed * 7 + 3);
    const door = extra.door ?? Math.round((r() - 0.5) * (w - 2.4) * 10) / 10;
    const sl = extra.slide || [Math.cos(ry), -Math.sin(ry)]; // along the frontage
    for (const s of [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2, -2]) {
      const px = x + sl[0] * s, pz = z + sl[1] * s, q = rectFor(px, pz, w, d, ry);
      const o = { road: 2.9, path: 1.4, keep: 2.0, gap: 0.3, lift: true };
      const no = why(q, o);
      if (no) { if (s === -2) skipped.push(`${k}@${x.toFixed(1)},${z.toFixed(1)} (${no})`); continue; }
      liftAway(o.under);
      const { slide, ...rest } = extra;
      const far = k === 'jHome' && segDist(q, roads) > 9 && segDist(q, paths) > 6; // seen only across yards: the light build
      const it = add({ k, x: px, z: pz, w, d, ry, seed, door, ...(far ? { far: true } : {}), ...rest });
      // the yard, in the home's frame
      const c = Math.cos(ry), sn = Math.sin(ry);
      const W2L = (lx, lz) => [px + lx * c + (d / 2 + lz) * sn, pz - lx * sn + (d / 2 + lz) * c];
      for (const [yk, lx, lz, more = {}] of yard) {
        const [wx, wz] = W2L(lx === 'door' ? door : lx, lz);
        const yry = ry + (more.ry || 0);
        if (yk === 'folk') { const { ry: _r, pose = 'stand', ...fx } = more; put({ k: 'jFolk', x: wx, z: wz, ry: yry, pose, seed: Math.floor(wx * 13 + wz * 7), ...fx }, { road: 1.6, path: 0.4, keep: 0.5, gap: 0.05 }); continue; }
        const gate = yk === 'jYard' && more.gate === 'door' ? door - lx : more.gate;
        put({ k: yk, x: wx, z: wz, ...more, ry: yry, ...(yk === 'jYard' ? { gate } : {}) }, { road: yk === 'jYard' ? 2.5 : 2.2, path: 0.6, keep: 1.0, gap: 0.12, lift: true });
      }
      return it;
    }
    return null;
  };
  /** put a small thing down if it is clear */
  const put = (o, opt = {}) => {
    const b = rectOf(o) || [o.x - 0.2, o.z - 0.2, o.x + 0.2, o.z + 0.2];
    const op = { road: 2.4, path: 0.6, keep: 1.0, gap: 0.15, ...opt };
    const no = why(b, op);
    if (no) { skipped.push(`${o.k}@${o.x.toFixed(1)},${o.z.toFixed(1)} (${no})`); return null; }
    if (op.lift && op.under?.length) liftAway(op.under);
    return add(o);
  };

  // the usual yard sets (local frame: lx along the front, lz out from the front face; negative lz = behind)
  const fence = (w, kind = 'bamboo', lz = 1.5) => ['jYard', 0, lz, { len: w + 0.6, kind, gate: 'door', seed: Math.round(w * 10) }];
  const Y = {
    pots: (lx, lz = 0.45, n = 3) => ['jPots', lx, lz, { n, seed: Math.round((+lx || 1) * 10 + lz * 7 + n) }],
    jars: (lx, lz) => ['jars', lx, lz, {}], bikes: (lx, lz) => ['bikes', lx, lz, { ry: HP }], wood: (lx, lz) => ['woodpile', lx, lz, {}],
    wash: (lx, lz, len = 3.0) => ['laundry', lx, lz, { len }], banana: (lx, lz) => ['jBanana', lx, lz, {}], hens: (lx, lz) => ['hens', lx, lz, { seed: Math.round(lx * 13 + 7) }],
    garden: (lx, lz, w = 2.8) => ['garden', lx, lz, { w, d: 1.5, seed: Math.round(lx * 9 + 40) }], pot: (lx, lz) => ['jWaterPot', lx, lz, {}],
  };
  const F = (lx, lz, pose, more = {}) => ['folk', lx, lz, { pose, ...more }];

  // ================= WEST BANK =================
  // ---- the back lots behind the Market road's north frontage: a second row of homes facing south over their yards,
  // a third under the trees, sheds at the page's top edge
  home('jHome', 42.4, 281.9, 4.4, 4.6, 0, 501, { style: 'stilt' }, [fence(4.4, 'bamboo', 1.7), Y.banana(0.6, -5.9), F(1.0, 1.0, 'sweep', { woman: true })]);
  home('jHome', 48.3, 281.9, 4.8, 4.6, 0, 502, { style: 'wood' }, [Y.pots('door', 0.5, 3), Y.wash(0.3, -5.9, 3.2), Y.bikes(3.4, -1.5)]);
  home('jHome', 54.3, 281.9, 4.6, 4.6, 0, 503, { style: 'brick' }, [fence(4.6, 'picket', 1.6), F(-1.4, 0.8, 'sit', { woman: true })]);
  home('jHome', 61.0, 282.2, 4.4, 4.4, 0, 504, { style: 'wood' }, [Y.jars(-3.1, 0.4), Y.hens(1.0, 1.2)]);
  home('jHome', 72.6, 281.8, 4.4, 4.4, 0, 505, { style: 'brick' }, [Y.pots(1.4, 0.5, 2), F(-1.2, 1.2, 'carry', { load: '#CDA577' })]);
  home('jShack', 44.0, 270.0, 3.4, 3.2, 0, 506, {}, [Y.wood(2.6, -0.4)]);
  home('jHome', 49.9, 271.6, 4.6, 4.2, 0, 524, { style: 'brick' }, [Y.pots('door', 0.45, 2)]);
  home('jHome', 56.5, 271.4, 4.4, 4.4, 0, 507, { style: 'stilt' }, [Y.garden(0, 1.6, 3.2), F(2.7, 2.6, 'squat', { woman: true, hat: true })]);
  home('jHome', 63.4, 272.0, 4.6, 4.2, 0, 525, { style: 'wood' }, [Y.pots('door', 0.45, 3)]);
  home('jHome', 70.6, 272.2, 4.4, 4.2, 0, 508, { style: 'wood' }, [Y.wash(0, 1.9, 3.0), F(-0.8, 2.6, 'hang', { woman: true, ry: PI })]);
  home('jShack', 76.0, 270.6, 3.0, 3.0, 0, 526, {}, []);
  home('jShack', 63.6, 262.4, 3.2, 3.0, 0, 509, {}, []);
  home('jShack', 51.0, 261.6, 3.0, 2.8, 0, 510, {}, []);
  home('jShack', 57.4, 262.0, 3.0, 2.8, 0, 527, {}, []);
  home('jHome', 70.0, 261.6, 4.4, 4.0, 0, 528, { style: 'stilt' }, []);
  // ---- south of the Market road: a row facing the road over long front gardens (seen down the lane and from above)
  home('jHome', 42.4, 314.7, 4.4, 4.6, PI, 511, { style: 'wood' }, [fence(4.4, 'stick', 1.5), Y.pots('door', 0.45, 2)]);
  home('jHome', 48.1, 314.9, 4.4, 4.6, PI, 512, { style: 'stilt' }, [Y.pots('door', 0.45, 2)]);
  // ---- the bridge hands' lane: homes either side, their fronts to the pencil path
  home('jHome', 57.6, 316.9, 4.6, 4.6, HP, 513, { style: 'brick', slide: [0, 1] }, [Y.pots('door', 0.5, 3), F(1.4, 0.9, 'sit', { woman: true })]);
  home('jHome', 57.8, 333.4, 4.6, 4.6, HP, 514, { style: 'wood', slide: [0, 1] }, [Y.pots('door', 0.45, 3), Y.wash(0, -5.8, 3.0)]);
  home('jHome', 58.2, 342.6, 4.2, 4.0, HP, 529, { style: 'brick', slide: [0, 1] }, []);
  home('jHome', 56.8, 351.5, 4.6, 4.6, HP, 515, { style: 'stilt', slide: [0, 1] }, [Y.hens(1.4, 1.6), F(-1.2, 1.4, 'sweep', { woman: true })]);
  home('jHome', 68.0, 319.0, 4.6, 4.6, -HP, 516, { style: 'brick', shop: true, slide: [0, 1] }, [F(0.8, 0.6, 'sell', { woman: true }), ['jSignPost', -1.6, 0.9, { name: { my: 'ကုန်စုံ', en: 'Sundries' }, color: J.tealD }]]);
  home('jHome', 67.9, 342.0, 4.6, 4.6, -HP, 517, { style: 'wood', slide: [0, 1] }, [Y.pots('door', 0.5, 2), Y.bikes(-3.3, 0.7)]);
  home('jHome', 63.6, 357.8, 4.4, 4.0, 0, 530, { style: 'brick' }, [fence(4.4, 'picket', 1.4)]);
  // ---- deeper west, to the page's edge
  home('jHome', 43.4, 325.0, 4.4, 4.2, 0, 518, { style: 'brick' }, [Y.garden(0.4, 1.7, 3.0)]);
  home('jHome', 48.6, 324.6, 4.0, 4.2, 0, 590, { style: 'stilt' }, []);
  home('jShack', 42.4, 333.4, 3.2, 3.0, 0, 591, {}, []);
  home('jHome', 42.6, 341.0, 4.2, 4.2, 0, 519, { style: 'wood' }, [F(1.0, 1.0, 'kid')]);
  home('jHome', 48.4, 348.0, 4.4, 4.4, 0, 592, { style: 'brick' }, [Y.wash(0.2, 1.9, 3.0)]);
  home('jHome', 42.6, 356.0, 4.2, 4.0, 0, 593, { style: 'wood' }, []);
  home('jShack', 45.0, 365.0, 3.4, 3.2, 0, 520, {}, [Y.wood(2.6, 0.2)]);
  home('jHome', 57.5, 361.8, 4.4, 4.4, 0, 521, { style: 'stilt' }, [Y.wash(0, 2.0, 3.0), F(1.6, 1.0, 'head', { woman: true, load: '#9FB8C8' })]);
  home('jHome', 67.5, 366.0, 4.2, 4.0, 0, 522, { style: 'wood' }, [Y.pots('door', 0.5, 3)]);
  home('jShack', 50.6, 357.6, 3.0, 2.8, 0, 523, {}, []);
  home('jShack', 73.8, 364.0, 3.4, 3.0, 0, 594, {}, []);
  home('jShack', 52.0, 371.4, 3.0, 2.8, 0, 595, {}, []);
  home('jHome', 61.0, 372.0, 4.4, 4.0, 0, 596, { style: 'stilt' }, []);

  // ================= EAST BANK =================
  // ---- behind the bridge-foot street's north frontage
  home('jHome', 140.6, 284.6, 4.6, 4.6, HP, 531, { style: 'wood', slide: [0, 1] }, [Y.pots('door', 0.5, 3)]);
  home('jHome', 124.0, 285.2, 4.4, 4.2, 0, 532, { style: 'stilt' }, [Y.jars(3.1, 0.2)]);
  home('jHome', 130.2, 284.6, 4.2, 4.0, 0, 533, { style: 'brick' }, []);
  home('jShack', 135.5, 285.0, 3.2, 3.0, 0, 534, {}, []);
  home('jHome', 123.6, 270.6, 4.2, 3.6, 0, 597, { style: 'wood' }, []);
  home('jHome', 124.6, 264.6, 4.6, 4.4, 0, 535, { style: 'brick' }, [fence(4.6, 'hedge', 1.4)]);
  home('jHome', 131.0, 264.0, 4.4, 4.4, 0, 536, { style: 'stilt' }, [Y.wash(0.2, 2.2, 2.8), F(0.2, 2.9, 'hang', { woman: true, ry: PI })]);
  // ---- the road north's east side and the yards behind the school and the press
  home('jHome', 156.0, 274.6, 4.4, 4.6, -HP, 537, { style: 'brick', slide: [0, 1] }, [Y.pots('door', 0.5, 2)]);
  home('jShack', 154.6, 261.6, 3.4, 3.0, -HP, 598, {}, []);
  home('jHome', 166.5, 273.0, 4.6, 4.4, 0, 538, { style: 'wood' }, [fence(4.6, 'picket', 1.5), F(1.2, 0.8, 'sweep', { woman: true })]);
  home('jHome', 173.6, 274.6, 4.4, 4.4, 0, 539, { style: 'stilt' }, [Y.hens(-1.2, 1.4)]);
  home('jHome', 180.8, 273.6, 4.4, 4.4, 0, 540, { style: 'brick' }, [Y.bikes(3.3, 0.6)]);
  home('jShack', 186.2, 273.0, 3.0, 3.0, 0, 599, {}, []);
  home('jShack', 176.8, 261.6, 3.2, 3.0, 0, 541, {}, []);
  home('jShack', 186.0, 266.0, 3.0, 3.0, 0, 542, {}, []);
  home('jShack', 161.4, 262.0, 3.2, 3.0, 0, 543, {}, []);
  // ---- south of the bridge-foot street, behind its street life: homes facing the street over long yards
  home('jHome', 124.0, 318.9, 4.6, 4.6, PI, 551, { style: 'wood' }, [Y.pots('door', 0.45, 3)]);
  home('jHome', 129.6, 318.9, 4.4, 4.6, PI, 552, { style: 'brick' }, []);
  home('jHome', 135.0, 319.2, 4.2, 4.4, PI, 553, { style: 'stilt' }, []);
  // ---- below the square, looking up at it; and south of the press street
  home('jHome', 158.6, 320.7, 4.8, 4.6, PI, 554, { style: 'brick' }, [Y.pots('door', 0.45, 3)]);
  home('jHome', 164.6, 320.9, 4.2, 4.4, PI, 555, { style: 'wood' }, []);
  home('jHome', 169.6, 314.6, 4.8, 4.6, PI, 556, { style: 'brick' }, []);
  home('jHome', 175.6, 314.6, 4.6, 4.6, PI, 557, { style: 'stilt' }, []);
  home('jHome', 171.0, 322.0, 4.2, 4.0, PI, 580, { style: 'wood' }, []);
  // ---- the east road's west side, fronts to the road
  home('jHome', 178.1, 322.8, 4.6, 4.6, HP, 558, { style: 'wood', shop: true, slide: [0, 1] }, [F(0.9, 0.6, 'sit'), ['jSignPost', -1.7, 1.0, { name: { my: 'မုန့်ဆိုင်', en: 'Snacks' }, color: J.redD }]]);
  home('jShack', 179.4, 310.4, 3.2, 3.4, HP, 559, { slide: [0, 1] }, []);
  // ---- Ink Lane's south side: homes set back behind front yards (fences, gates, pots, bicycles), so the lane's
  // camera looks down on yards and verge life, never on a home's lifted roof; a gap for the children's corner
  for (const [x, w, style, sd, yard] of [
    [125.4, 4.4, 'stilt', 561, [fence(4.4, 'bamboo', 1.2), Y.pots(1.2, 0.4, 2)]],
    [131.0, 4.6, 'brick', 562, [fence(4.6, 'wall', 1.2), Y.pots(-1.5, 0.4, 2)]],
    [137.6, 4.2, 'wood', 563, [fence(4.2, 'picket', 1.2), Y.pots(1.3, 0.4, 2)]],
    [152.2, 4.6, 'brick', 564, [fence(4.6, 'stick', 1.2), ['jSignPost', -1.6, 0.6, { name: { my: 'အပ်ချုပ်ဆိုင်', en: 'Tailor' }, color: J.blueD }]]],
    [158.0, 4.4, 'wood', 565, [fence(4.4, 'bamboo', 1.2), Y.pots(-1.3, 0.4, 3)]],
    [164.0, 4.2, 'stilt', 566, [fence(4.2, 'hedge', 1.3)]],
    [170.0, 4.6, 'brick', 567, [fence(4.6, 'picket', 1.2), Y.pots(1.4, 0.4, 2)]],
    [176.2, 4.4, 'wood', 568, [fence(4.4, 'bamboo', 1.2), Y.pots(1.4, 0.4, 3)]],
    [182.0, 4.2, 'brick', 569, [fence(4.2, 'stick', 1.2)]],
  ]) home('jHome', x, 348.8, w, 4.0, PI, sd, { style, ...(sd === 564 || sd === 567 ? { shop: true } : {}) }, yard);
  // ---- the gardens down to the page's bottom edge: small homes and sheds among the beds and trees
  home('jHome', 174.5, 362.6, 4.4, 4.2, 0, 571, { style: 'stilt' }, [F(1.4, 1.2, 'squat', { woman: true, hat: true })]);
  home('jHome', 183.4, 356.6, 4.4, 4.2, -HP, 572, { style: 'brick' }, []);
  home('jHome', 183.2, 368.6, 4.0, 4.0, 0, 581, { style: 'wood' }, []);
  home('jShack', 125.6, 359.6, 3.4, 3.0, 0, 573, {}, []);
  home('jHome', 131.6, 366.4, 4.2, 4.0, 0, 582, { style: 'stilt' }, [Y.wash(0, 1.9, 2.8)]);
  home('jHome', 139.5, 365.0, 4.4, 4.2, 0, 575, { style: 'wood' }, []);
  home('jHome', 147.6, 370.6, 4.2, 4.0, 0, 583, { style: 'brick' }, []);
  home('jShack', 156.0, 368.0, 3.2, 3.0, 0, 574, {}, []);
  home('jShack', 165.6, 366.8, 3.2, 3.0, 0, 576, {}, []);
  home('jHome', 151.0, 363.0, 4.0, 4.0, 0, 584, { style: 'wood' }, [F(1.2, 1.0, 'kid')]);
  home('jHome', 162.0, 374.0, 4.0, 3.8, 0, 585, { style: 'brick' }, []);
  home('jHome', 128.6, 374.0, 4.0, 3.8, 0, 586, { style: 'wood' }, []);
  home('jShack', 174.0, 372.6, 3.6, 3.4, 0, 587, {}, []);
  home('jShack', 123.0, 355.2, 3.0, 3.0, HP, 588, {}, []);
  home('jShack', 186.2, 347.0, 3.0, 3.0, -HP, 589, {}, []);

  // ================= pass 3: the last wide gaps =================
  // the yards behind the press and the school, the top edge
  home('jShack', 177.4, 283.0, 3.2, 3.0, 0, 600, {}, []);
  home('jHome', 168.6, 265.6, 4.4, 4.0, 0, 601, { style: 'brick' }, [Y.pots('door', 0.45, 2)]);
  home('jShack', 181.4, 263.0, 3.2, 3.0, 0, 602, {}, []);
  home('jShack', 135.0, 270.0, 3.0, 2.6, 0, 603, {}, []);
  // the west lane's east side and the bench end; a shed by the lip
  home('jShack', 74.4, 325.2, 3.4, 3.2, -HP, 604, {}, []);
  home('jShack', 74.8, 350.4, 3.0, 2.8, 0, 605, {}, []);
  home('jShack', 73.6, 374.4, 3.0, 2.8, 0, 606, {}, []);
  home('jShack', 48.6, 340.4, 3.6, 3.0, 0, 607, {}, []);
  home('jShack', 74.6, 341.6, 3.0, 3.0, 0, 608, {}, []);
  home('jShack', 141.2, 357.0, 3.0, 3.0, 0, 609, {}, []);
  home('jShack', 171.0, 356.4, 3.0, 3.0, 0, 610, {}, []);
  home('jShack', 136.4, 375.4, 3.0, 2.8, 0, 614, {}, []);
  // the square's south apron, behind Ink Lane's back walls: a shared washing line, pots, a neighbour pegging shirts
  put({ k: 'laundry', x: 148.8, z: 325.4, len: 3.4 }, { road: 2.4, lift: true });
  put({ k: 'jPots', x: 155.6, z: 325.8, n: 3, seed: 616 }, { road: 2.4, lift: true });
  put({ k: 'jFolk', x: 148.4, z: 326.1, ry: PI, pose: 'hang', woman: true, seed: 617 }, { road: 2.2, gap: -0.3 });
  // Ink Lane's children's corner: a fritter stall at the verge, under its umbrella (low: the lane's camera looks over it)
  put({ k: 'jStallLow', x: 148.6, z: 344.2, ry: PI, seed: 615 }, { road: 2.4, lift: true });
  // the road north's east kerb before the school yard: a tea table under an umbrella, pots (low: the camera looks over)
  put({ k: 'jStallLow', x: 153.4, z: 281.4, ry: -HP, seed: 611 }, { road: 2.6, lift: true });
  put({ k: 'jFolk', x: 153.6, z: 282.9, ry: -HP + 0.3, pose: 'sit', woman: true, seed: 612 }, { road: 2.6, gap: 0.05, lift: true });
  put({ k: 'jPots', x: 151.4, z: 278.2, ry: -HP, n: 3, seed: 613 }, { road: 2.6 });
  // the east road's far kerb: a hedge in short runs along the page's edge, with gaps
  for (const z of [304.5, 311.0, 324.0, 334.0]) put({ k: 'jYard', x: 187.7, z, ry: HP, len: 4.6, kind: 'hedge', seed: Math.round(z) }, { road: 2.5, lift: true });
  // Ink Lane's front yards, between the verge and the fences: a bench at a gate, jars, a bicycle, a child
  for (const o of [
    { k: 'bench', x: 128.0, z: 344.4, ry: PI }, { k: 'jars', x: 156.0, z: 344.5 }, { k: 'bikes', x: 167.6, z: 344.5, ry: 0.15 },
    { k: 'jPots', x: 173.0, z: 344.5, n: 3, seed: 621 }, { k: 'jPots', x: 179.6, z: 344.4, n: 2, seed: 622 }, { k: 'bench', x: 161.0, z: 344.5, ry: PI },
  ]) put(o, { road: 2.4, lift: true });
  for (const [x, z, pose, more] of [[128.2, 344.0, 'sit', { woman: true, ry: PI }], [154.6, 343.8, 'kid', { ry: 0.4 }], [161.6, 344.1, 'read', { ry: PI }], [175.0, 344.6, 'sweep', { woman: true, ry: -0.6 }]]) {
    const { ry = 0, ...m } = more;
    const sits = pose === 'sit' || pose === 'read';
    put({ k: 'jFolk', x, z, ry, pose, seed: Math.floor(x * 13 + z * 7), ...(sits ? { stool: false } : {}), ...m }, { road: 2.0, gap: sits ? -0.8 : 0.05 });
  }
  // the townsfolk at their yard work: sweeping, hanging washing, carrying water, children at play
  for (const [x, z, pose, ry, more] of [
    [47.0, 285.8, 'kid', 0.4, {}], [52.0, 276.6, 'carry', 1.2, { load: '#B5643C' }], [66.6, 276.8, 'sweep', -0.4, { woman: true }],
    [60.0, 323.0, 'head', HP, { woman: true, load: '#D9A23A' }], [64.8, 336.0, 'kid', -0.5, {}], [46.0, 344.6, 'hang', 0, { woman: true }],
    [53.6, 366.8, 'squat', 0.8, { woman: true, hat: true }], [70.2, 360.2, 'kid', 2.0, {}],
    [127.4, 289.0, 'sweep', 0.2, { woman: true }], [136.6, 288.2, 'carry', -1.2, { load: '#CDA577' }], [128.0, 268.2, 'kid', 0.6, {}],
    [163.0, 277.0, 'kid', 0.3, {}], [178.4, 278.8, 'head', -0.4, { woman: true, load: '#7FAE66' }],
    [127.2, 324.4, 'hang', PI, { woman: true }], [167.8, 326.4, 'sweep', 0.5, {}], [180.6, 317.0, 'sit', -HP, { woman: true }],
    [135.6, 362.2, 'squat', 0.3, { woman: true, hat: true }], [168.0, 359.4, 'carry', 1.0, { load: '#C9A24A' }], [143.6, 370.0, 'kid', -0.8, {}],
  ]) put({ k: 'jFolk', x, z, ry, pose, seed: Math.floor(x * 13 + z * 7), ...more }, { road: 2.2, gap: 0.05 });
  // two chalk boards in the yards with the chapters' sayings (ch 12, ch 13): words to think on, never a way
  put({ k: 'jABoard', x: 133.6, z: 344.5, ry: 0, lines: [{ my: 'ဟောင်းလို့', en: 'Old does not' }, { my: 'မှန်တာ မဟုတ်', en: 'make it true:' }, { my: 'ကိုယ်တိုင် စမ်းပါ', en: 'try it yourself' }] }, { road: 2.4, lift: true });
  put({ k: 'jABoard', x: 166.4, z: 326.0, ry: 0, lines: [{ my: 'ငါ့ဘက်က ၆', en: 'Six from my side,' }, { my: 'သူ့ဘက်က ၉', en: 'nine from theirs:' }, { my: 'စေတနာနဲ့ ပြော', en: 'speak with goodwill' }] }, { road: 2.4, lift: true });

  return { added: ITEMS.length - base + lifted.length, lifted, skipped };
}
