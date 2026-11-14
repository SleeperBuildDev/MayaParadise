// The Envelope Market's town pass: the district made DENSE like a real small town. Homes, shophouses, tea stalls and
// workshops on every block along every lane (both sides), back lots with gardens, sheds, small houses and trees,
// and the yard life between them. Called once from regions/market.js, AFTER every other item, door and spot is
// laid: town({ ITEMS, add, folk, defs, keep }) checks each new thing against everything already there, the lanes,
// the doors and the day scripts' spots (2 m clear) before it goes down.
// Imports only kit.js / toon.js / voxel.js. Original art; every Burmese string is a draft for Maya.
//
// Budget: the shapes here are deliberately light (front details are flat panels, not boxes; ridges and posts have
// no outline), so a whole street of homes costs less than one of the Market's story buildings. Everything merges
// into the chunk meshes per material (the shared toon set): no new draw calls except the few canvas shop boards.
//
// ART (tall: the cutaway fades them when they stand between the camera and Maya):
//   mkHut { w, d, seed, style: 'plank' | 'brick' | 'stilt' | 'bamboo' | 'lime' | 'thatch', ridge?: 'z' }   a one-storey home
//   mkRow { w, d, seed, style: 'brick' | 'timber' | 'lime', shop?, sign? }   a two-storey shophouse, gable to the street
// PROP (low: never faded, so they keep the foreground full):
//   mkLow { w, d, seed, style }   a low one-storey home (ridge under 3.2 m): the south side of the east-west lanes,
//        whose backs face the street camera (so its back wall has a window and a door too)
//   tFence { len, style: 'screen' | 'rail' | 'wall' }   tShed { w }   tJars { n }   tWash { len }   tBike   tPots { n }
//   tWood   tBench   tShrub { s }   tBed { w, d }   tHay   tCoop   tMat { w, d }   tCart
//   tStall { seed }   a roadside stall (tea, fritters, fruit...) under a cloth awning   tGround { w, d, c }   ground cover
//
// The order (each step only where the earlier ones left room): the envelope road's two frontages and back lots;
// two-storey rows in the blocks' middles; low homes on the south side of every east-west lane (the street camera
// looks north, so the near part of its view gets only low things: tall homes and trees there would be faded out);
// both sides of every north-south lane (a low front row, a taller second row); the back lots and the margin hamlet;
// the kerbs (stalls, pots, benches, bikes, jars, carts a step off the footpath); then a last sprinkle of shrubs, beds,
// hay and jars wherever paper still shows. Small loose things in a new home's way (parcels, pots, crates, saplings)
// are moved a step aside, not lost, where there is room.
import { PALETTE } from '../../../game/toon.js';
import { jitter } from '../../../game/voxel.js';
import { shade, rng } from '../kit.js';
import { TOWN_HELLO } from './market-townfolk.js';

const PI = Math.PI;
const K = {
  wood: PALETTE.wood, woodD: PALETTE.woodDark, woodL: '#CDA577', dark: '#3A2E25', stone: '#C4BBA8', stoneD: '#9F9683',
  bamboo: '#D8C27E', bambooD: '#B59A55', tin: '#B3B0A6', rust: '#A65A3A', white: PALETTE.white, cream: '#F6EEDB',
  glass: '#8FA9BC', red: '#C8323C', blue: '#2F5DB3', teal: '#3E8C8A', green: '#4F8A4F', mustard: '#E2B33C',
  terra: '#B5643C', leaf: PALETTE.leaf, leafD: PALETTE.leafDark, pink: '#E8A0A8', kraft: '#D6B486', iron: '#4A3B30',
  earth: '#D9C39C', earthD: '#C9AE84', grass: '#A9C27A', thatch: '#C9A55C', thatchD: '#A9863F', brick: '#B9573E', brickD: '#94432F',
};
const LIME = ['#F4EBDA', '#E9DFC6', '#DDE7DF', '#F1DCD2', '#E7E0C2', '#DCE3EC', '#F3E3BC'];
const TIMBER = ['#9C6B43', '#8A5A36', '#A97A4E', '#7E5233'];
const ROOF = { tin: ['#B3B0A6', '#A9A69C', '#A65A3A', '#7E8C8C', '#6F8F7A', '#5E7DA0'], tile: ['#A0642E', '#8E3B2E', '#B07A3A', '#7E4A2E', '#6E1F2A'] };
const SHUT = [K.teal, K.red, K.blue, '#3A6B3C', K.woodD, K.mustard, '#7A4E8C'];
const CLOTH = ['#C8323C', '#2F5DB3', '#E2B33C', '#FFFDF8', '#4E8C86', '#E8A0A8', '#7A4E8C', '#F3B27A'];

// ---------------------------------------------------------------------------------
// flat panels (2 triangles each, no outline): details on a wall instead of boxes
// ---------------------------------------------------------------------------------
/** a panel facing local +Z (n = 1) or -Z (n = -1), centred (x, y) on the plane local z */
function pz(G, x, y, z, w, h, color, n = 1) {
  const c = G.tc, s = G.ts, X = (lx) => G.tx + lx * c + z * s, Z = (lx) => G.tz - lx * s + z * c;
  const x0 = x - w / 2, x1 = x + w / 2, y0 = G.ty + y - h / 2, y1 = G.ty + y + h / 2;
  G.quad([X(x0), y0, Z(x0)], [X(x1), y0, Z(x1)], [X(x1), y1, Z(x1)], [X(x0), y1, Z(x0)], color, s * n, 0, c * n);
}
/** a panel facing local +X (n = 1) or -X (n = -1), on the plane local x, centred (z, y) */
function px(G, x, y, z, d, h, color, n = 1) {
  const c = G.tc, s = G.ts, X = (lz) => G.tx + x * c + lz * s, Z = (lz) => G.tz - x * s + lz * c;
  const z0 = z - d / 2, z1 = z + d / 2, y0 = G.ty + y - h / 2, y1 = G.ty + y + h / 2;
  G.quad([X(z0), y0, Z(z0)], [X(z1), y0, Z(z1)], [X(z1), y1, Z(z1)], [X(z0), y1, Z(z0)], color, c * n, 0, -s * n);
}
/** a gable triangle on a wall plane: along X at local z (axis 'z') or along Z at local x (axis 'x') */
function gableTri(G, axis, at, half, y0, rise, color, n) {
  const c = G.tc, s = G.ts;
  const W = (lx, ly, lz) => [G.tx + lx * c + lz * s, G.ty + ly, G.tz - lx * s + lz * c];
  if (axis === 'z') G.quad(W(-half, y0, at), W(half, y0, at), W(0, y0 + rise, at), W(0, y0 + rise, at), color, s * n, 0, c * n);
  else G.quad(W(at, y0, -half), W(at, y0, half), W(at, y0 + rise, 0), W(at, y0 + rise, 0), color, c * n, 0, -s * n);
}
/** a window: a dark pane, a sill, and its two shutters folded open (all flat panels) */
function win(f, x, y, z, w, h, shut, n = 1) {
  pz(f, x, y, z, w, h, K.glass, n);
  pz(f, x, y + h * 0.18, z + 0.005 * n, w * 0.86, h * 0.36, K.cream, n);
  pz(f, x, y - h / 2 - 0.05, z + 0.006 * n, w + 0.16, 0.08, K.white, n);
  if (shut) for (const sx of [-1, 1]) pz(f, x + sx * (w / 2 + 0.17), y, z, 0.3, h, shut, n);
}
/** a thin strip lying on a roof slope (local points a -> b along the slope, half-width hw across it), 2 triangles */
function slopeStrip(G, a, b, across, hw, color, nrm) {
  const c = G.tc, s = G.ts, W = (p) => [G.tx + p[0] * c + p[2] * s, G.ty + p[1], G.tz - p[0] * s + p[2] * c];
  const o = (p, k) => [p[0] + across[0] * hw * k, p[1], p[2] + across[2] * hw * k];
  G.quad(W(o(a, -1)), W(o(a, 1)), W(o(b, 1)), W(o(b, -1)), color, nrm[0] * c + nrm[2] * s, nrm[1], -nrm[0] * s + nrm[2] * c);
}
/** a gable roof: ridge along local X (default) or along local Z ('z': the gable end faces the street) */
function roof(g, f, W, D, y0, rise, color, ridge = 'x', over = 0.32, seams = null) {
  if (ridge === 'x') {
    const half = D / 2 + over, ang = Math.atan2(rise, D / 2), slope = half / Math.cos(ang);
    for (const sz of [-1, 1]) g.boxR(0, y0 + rise / 2 + 0.04, (sz * half) / 2, W + over * 2, 0.1, slope, color, sz * ang, 0, 0);
    // the roof's own lines (tin seams running down the slope, or tile courses across it): what reads as a roof
    // (a point t along the slab from its centre: rotX(sz * ang) of (0, 0, t), lifted onto its top face)
    for (const sz of [-1, 1]) {
      const a = sz * ang, yc = y0 + rise / 2 + 0.04, zc = (sz * half) / 2, ca = Math.cos(a), sa = Math.sin(a);
      const P = (x, t) => [x, yc - t * sa + 0.062 * ca, zc + t * ca + 0.062 * sa], nrm = [0, ca, sa], dark = shade(color, 0.78);
      if (seams === 'tin') for (let k = 1; k < 4; k++) { const x = -W / 2 - over + ((W + over * 2) * k) / 4; slopeStrip(f, P(x, -slope / 2), P(x, slope / 2), [1, 0, 0], 0.03, dark, nrm); }
      if (seams === 'tile') for (let k = 1; k < 3; k++) { const t = -slope / 2 + (slope * k) / 3; slopeStrip(f, P(-W / 2 - over, t), P(W / 2 + over, t), [0, 0, 1], 0.035, dark, nrm); }
    }
    f.box(0, y0 + rise + 0.08, 0, W + over * 2 + 0.04, 0.1, 0.22, shade(color, 0.82));
  } else {
    const half = W / 2 + over, ang = Math.atan2(rise, W / 2), slope = half / Math.cos(ang);
    for (const sx of [-1, 1]) g.boxR((sx * half) / 2, y0 + rise / 2 + 0.04, 0, slope, 0.1, D + over * 2, color, 0, 0, -sx * ang);
    for (const sx of [-1, 1]) {
      const a = -sx * ang, yc = y0 + rise / 2 + 0.04, xc = (sx * half) / 2, ca = Math.cos(a), sa = Math.sin(a);
      const P = (t, z) => [xc + t * ca - 0.062 * sa, yc + t * sa + 0.062 * ca, z], nrm = [-sa, ca, 0], dark = shade(color, 0.78);
      if (seams === 'tin') for (let k = 1; k < 4; k++) { const z = -D / 2 - over + ((D + over * 2) * k) / 4; slopeStrip(f, P(-slope / 2, z), P(slope / 2, z), [0, 0, 1], 0.03, dark, nrm); }
      if (seams === 'tile') for (let k = 1; k < 3; k++) { const t = -slope / 2 + (slope * k) / 3; slopeStrip(f, P(t, -D / 2 - over), P(t, D / 2 + over), [1, 0, 0], 0.035, dark, nrm); }
    }
    f.box(0, y0 + rise + 0.08, 0, 0.22, 0.1, D + over * 2 + 0.04, shade(color, 0.82));
  }
}

// ---------------------------------------------------------------------------------
// ART / PROP: homes
// ---------------------------------------------------------------------------------
function wallColor(style, seed) {
  if (style === 'brick') return jitter(K.brick, 0.04, seed);
  if (style === 'plank' || style === 'stilt') return TIMBER[seed % TIMBER.length];
  if (style === 'bamboo' || style === 'thatch') return jitter(K.bamboo, 0.05, seed);
  return LIME[seed % LIME.length];
}
function roofColor(style, seed) {
  if (style === 'thatch') return K.thatch;
  if (style === 'brick' || style === 'lime') return ROOF.tile[(seed >> 1) % ROOF.tile.length];
  return ROOF.tin[(seed >> 1) % ROOF.tin.length];
}
/** a one-storey home. low = the PROP version (eaves 1.95 m, ridge under 3.2 m) */
function home(g, f, it, low) {
  const W = it.w || 4.6, D = it.d || 4.2, seed = it.seed || 1, r = rng(seed), st = it.style || 'plank';
  if (it.simple) return simpleHome(g, f, it, W, D, seed, st);
  const stilt = st === 'stilt' && !low, base = stilt ? 0.85 : 0.16;
  const H = low ? 2.1 : st === 'brick' || st === 'lime' ? 2.55 : 2.35, rise = low ? 1.0 : 1.15;
  const wall = wallColor(st, seed), rc = roofColor(st, seed), shut = SHUT[seed % SHUT.length];
  // the packed-earth yard round the house (the paper never shows right up to a wall)
  f.flat(-W / 2 - 0.7, -D / 2 - 0.6, W / 2 + 0.7, D / 2 + 1.3, 0.006, r() < 0.5 ? K.earth : K.earthD);
  if (stilt) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) f.box(sx * (W / 2 - 0.2), base / 2, sz * (D / 2 - 0.2), 0.18, base, 0.18, K.woodD);
    g.box(0, base - 0.05, 0, W + 0.24, 0.1, D + 0.24, K.wood);
  } else f.box(0, 0.08, 0, W + 0.16, 0.16, D + 0.16, st === 'brick' ? K.stoneD : K.stone);
  g.box(0, base + H / 2, 0, W, H, D, wall);
  const fz = D / 2 + 0.012, bz = -D / 2 - 0.012, y0 = base + H;
  // bands on the wall: planks, a bamboo weave, a lime-washed brick's plaster band
  if (st === 'plank' || st === 'stilt') for (let k = 1; k < 4; k++) pz(f, 0, base + (H * k) / 4, fz + 0.002, W, 0.04, shade(wall, 0.78));
  else if (st === 'bamboo' || st === 'thatch') for (let k = 0; k < 3; k++) pz(f, 0, base + 0.5 + k * 0.7, fz + 0.002, W, 0.06, K.bambooD);
  else if (st === 'brick') pz(f, 0, base + H - 0.22, fz + 0.002, W, 0.3, K.cream);
  else pz(f, 0, base + 0.2, fz + 0.002, W, 0.34, shade(wall, 0.85));
  // front: a door and one or two windows; back: a window (the south-side homes show their backs to the camera)
  const dx = (r() - 0.5) * W * 0.36;
  pz(f, dx, base + 0.95, fz + 0.004, 0.86, 1.8, K.dark);
  pz(f, dx, base + 1.9, fz + 0.006, 1.06, 0.1, K.woodD);
  for (const sx of [-1, 1]) { const x = dx + sx * Math.max(1.25, W * 0.28); if (Math.abs(x) < W / 2 - 0.55) win(f, x, base + 1.3, fz + 0.004, 0.7, 0.72, shut); }
  win(f, (r() - 0.5) * W * 0.4, base + 1.25, bz - 0.004, 0.7, 0.7, r() < 0.6 ? shut : null, -1);
  if (low && r() < 0.6) pz(f, W * 0.28, base + 0.9, bz - 0.004, 0.8, 1.75, K.dark, -1); // a back door to the yard
  if (stilt) for (let k = 0; k < 3; k++) f.box(dx, base - 0.18 - k * 0.26, D / 2 + 0.25 + k * 0.28, 0.95, 0.07, 0.3, K.woodL);
  else f.box(dx, 0.08, D / 2 + 0.3, 1.2, 0.16, 0.45, K.stone);
  // the roof, gable ends filled
  const ridge = it.ridge || 'x';
  if (ridge === 'x') for (const sx of [-1, 1]) gableTri(f, 'x', sx * (W / 2 + 0.01), D / 2, y0, rise, st === 'brick' ? K.cream : shade(wall, 0.92), sx);
  else for (const sz of [-1, 1]) gableTri(f, 'z', sz * (D / 2 + 0.01), W / 2, y0, rise, st === 'brick' ? K.cream : shade(wall, 0.92), sz);
  if (st === 'thatch') {
    roof(g, f, W, D, y0 - 0.05, rise + 0.15, K.thatch, ridge, 0.45);
  } else roof(g, f, W, D, y0, rise, rc, ridge, 0.32, st === 'brick' || st === 'lime' ? 'tile' : 'tin');
  // a small porch roof over the door on two posts (taller homes only)
  if (!low && r() < 0.55) {
    g.boxR(dx, y0 - 0.25, D / 2 + 0.55, 1.9, 0.06, 1.1, shade(rc, 0.92), 0.25, 0, 0);
    for (const sx of [-1, 1]) f.box(dx + sx * 0.85, (y0 - 0.25) / 2, D / 2 + 1.0, 0.1, y0 - 0.25, 0.1, K.woodD);
  }
  // a pot by the door (taller homes: the low ones have their yard's pots)
  if (!low) { f.box(dx + 0.75, 0.2, D / 2 + 0.35, 0.34, 0.4, 0.34, K.terra); f.box(dx + 0.75, 0.48, D / 2 + 0.35, 0.4, 0.2, 0.4, r() < 0.5 ? K.leaf : K.leafD); }
}
/** a back-lot home in few parts (about 90 triangles): walls, roof, gable ends, a door, a window, its yard */
function simpleHome(g, f, it, W, D, seed, st) {
  const stilt = st === 'stilt', base = stilt ? 0.7 : 0.05, H = st === 'brick' || st === 'lime' ? 2.5 : 2.3, rise = 1.1;
  const wall = wallColor(st, seed), rc = roofColor(st, seed), ridge = it.ridge || 'x';
  f.flat(-W / 2 - 0.6, -D / 2 - 0.5, W / 2 + 0.6, D / 2 + 1.1, 0.006, seed % 2 ? K.earth : K.earthD);
  if (stilt) for (const sx of [-1, 1]) f.box(sx * (W / 2 - 0.25), base / 2, D / 2 - 0.25, 0.16, base, 0.16, K.woodD);
  g.box(0, base + H / 2, 0, W, H, D, wall);
  const fz = D / 2 + 0.012, y0 = base + H, dx = ((seed % 5) - 2) * W * 0.08;
  pz(f, dx, base + 0.93, fz, 0.84, 1.76, K.dark);
  pz(f, dx + (dx > 0 ? -1.3 : 1.3), base + 1.3, fz, 0.7, 0.7, K.glass);
  pz(f, dx + (dx > 0 ? -1.3 : 1.3), base + 1.3, fz + 0.004, 1.3, 0.72, SHUT[seed % SHUT.length]);
  pz(f, dx + (dx > 0 ? -1.3 : 1.3), base + 1.3, fz + 0.008, 0.66, 0.66, K.glass);
  const gc = st === 'brick' ? K.cream : shade(wall, 0.92);
  if (ridge === 'x') for (const sx of [-1, 1]) gableTri(f, 'x', sx * (W / 2 + 0.01), D / 2, y0, rise, gc, sx);
  else for (const sz of [-1, 1]) gableTri(f, 'z', sz * (D / 2 + 0.01), W / 2, y0, rise, gc, sz);
  roof(g, f, W, D, y0, rise, st === 'thatch' ? K.thatch : rc, ridge);
}
function mkHut(g, f, it) { home(g, f, it, false); }
function mkLow(g, f, it) { home(g, f, it, true); }

/** a two-storey shophouse: an open shop (or shuttered) below, a balcony and windows above, the gable to the street */
function mkRow(g, f, it, ctx) {
  const W = it.w || 4.8, D = it.d || 6.4, seed = it.seed || 1, r = rng(seed), st = it.style || 'lime';
  const H1 = 3.0, H2 = 2.6, rise = 1.3;
  const wall = st === 'brick' ? jitter(K.brick, 0.04, seed) : st === 'timber' ? TIMBER[seed % TIMBER.length] : LIME[seed % LIME.length];
  const up = st === 'timber' ? shade(wall, 1.08) : st === 'brick' ? K.cream : LIME[(seed + 3) % LIME.length];
  const rc = st === 'timber' ? ROOF.tin[seed % ROOF.tin.length] : ROOF.tile[seed % ROOF.tile.length], shut = SHUT[(seed + 1) % SHUT.length];
  f.flat(-W / 2 - 0.4, -D / 2 - 0.4, W / 2 + 0.4, D / 2 + 1.6, 0.006, K.stone);
  f.box(0, 0.08, 0, W + 0.12, 0.16, D + 0.12, K.stoneD);
  g.box(0, 0.16 + H1 / 2, 0, W, H1, D, wall);
  g.box(0, 0.16 + H1 + H2 / 2, -0.1, W, H2, D - 0.2, up);
  const fz = D / 2 + 0.012, uz = D / 2 - 0.2 + 0.012;
  // below: the shop open to the street with its shelves, or folding shutters
  if (it.shop !== false) {
    pz(f, 0, 1.3, fz, W - 0.7, 2.2, K.dark);
    const goods = ['#E2B33C', '#C8323C', '#2F5DB3', '#FFFDF8', '#4E8C86', '#F3B27A', '#D6B486', '#E8A0A8'];
    for (let k = 0; k < 2; k++) for (let x = -W / 2 + 0.7; x < W / 2 - 0.6; x += 0.55) pz(f, x, 0.9 + k * 0.6, fz + 0.004, 0.4, 0.3, goods[Math.floor(r() * goods.length)]);
    g.box(0, 0.45, D / 2 + 0.35, W - 1.0, 0.7, 0.6, K.woodL); // the counter on the footpath
  } else {
    for (let k = 0; k < 4; k++) pz(f, -W / 2 + 0.5 + ((W - 1) * (k + 0.5)) / 4, 1.3, fz, (W - 1) / 4 - 0.06, 2.2, k % 2 ? shut : shade(shut, 0.85));
  }
  // the balcony: a slab, a rail with a painted balustrade, two posts; windows above it
  g.box(0, 0.16 + H1 + 0.04, D / 2 + 0.42, W + 0.1, 0.12, 0.9, K.woodD);
  pz(f, 0, 0.16 + H1 + 0.42, D / 2 + 0.86, W, 0.62, st === 'timber' ? K.cream : K.woodL);
  for (let x = -W / 2 + 0.35; x < W / 2 - 0.2; x += 0.38) pz(f, x, 0.16 + H1 + 0.42, D / 2 + 0.866, 0.07, 0.55, K.woodD);
  f.box(0, 0.16 + H1 + 0.76, D / 2 + 0.86, W + 0.1, 0.06, 0.08, K.woodD);
  const nW = W > 5 ? 3 : 2;
  for (let k = 0; k < nW; k++) win(f, -W / 2 + (W * (k + 0.5)) / nW, 0.16 + H1 + 1.25, uz, 0.66, 0.9, shut);
  // the awning over the shop, on the balcony's front
  if (it.shop !== false) g.boxR(0, 0.16 + H1 - 0.25, D / 2 + 1.25, W + 0.1, 0.05, 0.8, CLOTH[seed % CLOTH.length], 0.35, 0, 0);
  // roof with its gable to the street, the gable filled and a vent in it
  const y0 = 0.16 + H1 + H2;
  for (const sz of [-1, 1]) gableTri(f, 'z', sz * (D / 2 - 0.2 + 0.012) - 0.1, W / 2, y0, rise, up, sz);
  pz(f, 0, y0 + rise * 0.35, uz + 0.004, 0.5, 0.3, K.woodD);
  g.boxR(-W / 4 - 0.08, y0 + rise / 2 + 0.04, -0.1, Math.hypot(W / 2 + 0.3, rise), 0.1, D + 0.4, rc, 0, 0, Math.atan2(rise, W / 2));
  g.boxR(W / 4 + 0.08, y0 + rise / 2 + 0.04, -0.1, Math.hypot(W / 2 + 0.3, rise), 0.1, D + 0.4, rc, 0, 0, -Math.atan2(rise, W / 2));
  // a trade board on the balcony front: the trade's name, nothing that points anywhere
  if (it.sign) ctx.signs.push({ x: 0, y: 0.16 + H1 + 0.42, z: D / 2 + 0.9, w: Math.min(W - 0.4, 3.2), h: 0.5, lines: [{ text: it.sign.my, size: 46 }], bg: '#FFF8E8', border: '#6E1F2A', width: 448, height: 80 });
}

// ---------------------------------------------------------------------------------
// PROP: yard things (cheap: mostly no outline)
// ---------------------------------------------------------------------------------
function tFence(g, f, it) {
  const L = it.len || 5, st = it.style || 'screen';
  if (st === 'wall') {
    g.box(0, 0.42, 0, L, 0.84, 0.22, LIME[(it.seed || 0) % LIME.length]);
    f.box(0, 0.88, 0, L + 0.06, 0.08, 0.3, K.terra);
    return;
  }
  for (let x = -L / 2; x <= L / 2 + 0.01; x += L / Math.max(1, Math.round(L / 1.8))) f.box(x, 0.6, 0, 0.1, 1.2, 0.1, K.bambooD);
  if (st === 'screen') {
    // a woven split-bamboo screen, both faces, a rail on top
    for (const n of [1, -1]) pz(f, 0, 0.55, 0.03 * n, L, 0.95, n > 0 ? K.bamboo : shade(K.bamboo, 0.9), n);
    for (const n of [1, -1]) for (const y of [0.3, 0.8]) pz(f, 0, y, 0.035 * n, L, 0.05, K.bambooD, n);
    g.box(0, 1.08, 0, L + 0.1, 0.07, 0.08, K.bambooD);
  } else {
    g.box(0, 0.95, 0, L, 0.07, 0.07, K.woodL);
    g.box(0, 0.5, 0, L, 0.07, 0.07, K.woodL);
  }
}
function tShed(g, f, it) {
  const W = it.w || 2.6, r = rng(it.seed || 4);
  f.flat(-W / 2 - 0.3, -0.9, W / 2 + 0.3, 1.1, 0.005, K.earthD);
  g.box(0, 0.95, -0.7, W, 1.9, 0.12, K.bamboo);
  for (const sx of [-1, 1]) f.box(sx * (W / 2 - 0.08), 0.75, 0.7, 0.1, 1.5, 0.1, K.woodD);
  g.boxR(0, 1.78, 0, W + 0.3, 0.06, 1.9, r() < 0.5 ? K.tin : K.rust, 0.28, 0, 0);
  // what it keeps: firewood, a sack or two, a hoe against the wall
  f.box(-W / 4, 0.3, -0.35, W / 2.4, 0.6, 0.5, K.wood);
  f.box(W / 4, 0.25, -0.3, 0.6, 0.5, 0.5, K.kraft);
  pz(f, W / 2 - 0.4, 0.8, -0.63, 0.06, 1.4, K.woodD);
}
function tJars(g, f, it) {
  const n = it.n || 2;
  for (let k = 0; k < n; k++) {
    const x = (k - (n - 1) / 2) * 0.62;
    g.box(x, 0.32, 0, 0.5, 0.64, 0.5, k % 2 ? '#8A4A2E' : '#7A3F28');
    f.box(x, 0.66, 0, 0.36, 0.06, 0.36, '#5E3020');
  }
  f.box(0.1, 0.7, 0.05, 0.3, 0.03, 0.3, K.woodL); // a lid with a cup on it
}
function tWash(g, f, it) {
  const L = it.len || 3, r = rng(it.seed || 6);
  for (const sx of [-1, 1]) f.box((sx * L) / 2, 0.85, 0, 0.08, 1.7, 0.08, K.woodD);
  f.box(0, 1.62, 0, L, 0.02, 0.02, '#F3EFE4');
  for (let x = -L / 2 + 0.35; x < L / 2 - 0.2; x += 0.55 + r() * 0.2) { const c = CLOTH[Math.floor(r() * CLOTH.length)], h = 0.5 + r() * 0.35; for (const n of [1, -1]) pz(f, x + 0.2, 1.6 - h / 2, 0.01 * n, 0.42, h, c, n); }
}
function tBike(g, f) {
  for (const n of [1, -1]) {
    for (const sx of [-0.5, 0.5]) pz(f, sx, 0.34, 0.02 * n, 0.62, 0.62, '#2A2420', n);
    pz(f, 0, 0.62, 0.025 * n, 1.0, 0.06, K.red, n);
    pz(f, -0.1, 0.48, 0.025 * n, 0.06, 0.4, K.red, n);
  }
  f.box(0.42, 0.88, 0, 0.06, 0.06, 0.4, K.iron);
  f.box(-0.25, 0.76, 0, 0.26, 0.05, 0.12, K.iron);
}
function tPots(g, f, it) {
  const n = it.n || 3, r = rng(it.seed || 3), flw = [K.red, K.mustard, K.pink, '#FFFDF8', '#D86B2A'];
  for (let k = 0; k < n; k++) {
    const x = (k - (n - 1) / 2) * 0.5, h = 0.26 + r() * 0.1;
    f.box(x, h / 2, 0, 0.32, h, 0.32, K.terra);
    f.box(x, h + 0.15, 0, 0.38, 0.28, 0.38, r() < 0.5 ? K.leaf : K.leafD);
    if (r() < 0.7) f.box(x + 0.05, h + 0.31, 0.05, 0.14, 0.08, 0.14, flw[Math.floor(r() * flw.length)]);
  }
}
function tWood(g, f) {
  g.box(0, 0.35, 0, 1.6, 0.7, 0.6, K.wood);
  for (let k = 0; k < 3; k++) pz(f, -0.5 + k * 0.5, 0.35, 0.31, 0.36, 0.6, shade(K.woodL, 0.95 + k * 0.04));
  f.box(0, 0.74, 0, 1.7, 0.06, 0.7, K.tin);
}
function tBench(g, f, it) {
  const c = SHUT[(it.seed || 0) % SHUT.length];
  g.box(0, 0.44, 0, 1.6, 0.07, 0.4, c);
  for (const sx of [-0.65, 0.65]) f.box(sx, 0.21, 0, 0.08, 0.42, 0.34, shade(c, 0.75));
}
function tShrub(g, f, it) {
  const s = it.s || 1, r = rng(it.seed || 9);
  g.box(0, 0.42 * s, 0, 1.0 * s, 0.84 * s, 0.9 * s, r() < 0.5 ? K.leafD : K.leaf);
  f.box(0.1 * s, 0.9 * s, -0.05, 0.64 * s, 0.18 * s, 0.6 * s, K.leaf);
  if (r() < 0.6) for (let k = 0; k < 3; k++) f.box((r() - 0.5) * 0.7 * s, 0.6 * s + r() * 0.3 * s, 0.46 * s, 0.12, 0.12, 0.04, [K.red, K.pink, K.mustard, '#FFFDF8'][Math.floor(r() * 4)]);
}
function tBed(g, f, it) {
  const W = it.w || 3, D = it.d || 1.6, r = rng(it.seed || 2);
  f.flat(-W / 2, -D / 2, W / 2, D / 2, 0.01, '#8C6A48');
  const rows = Math.max(2, Math.round(D / 0.5));
  for (let k = 0; k < rows; k++) f.box(0, 0.08, -D / 2 + (D * (k + 0.5)) / rows, W - 0.3, 0.14 + r() * 0.1, 0.2, r() < 0.5 ? K.leaf : '#6FA35A');
}
function tHay(g, f) {
  g.box(0, 0.45, 0, 1.3, 0.9, 1.3, K.thatch);
  f.box(0, 1.0, 0, 0.8, 0.22, 0.8, K.thatchD);
}
function tCoop(g, f) {
  f.flat(-1.0, -0.8, 1.0, 0.8, 0.005, K.earthD);
  g.box(0, 0.4, -0.3, 1.2, 0.8, 0.8, K.bamboo);
  g.boxR(0, 0.88, -0.3, 1.4, 0.05, 1.0, K.thatch, 0.2, 0, 0);
  pz(f, 0, 0.3, 0.11, 0.4, 0.4, K.dark);
  for (const [x, z, c] of [[0.6, 0.4, '#FFFDF8'], [-0.5, 0.5, '#B5643C'], [0.1, 0.65, '#FFFDF8']]) { f.box(x, 0.16, z, 0.22, 0.2, 0.3, c); f.box(x, 0.3, z + 0.12, 0.12, 0.12, 0.12, c); f.box(x, 0.39, z + 0.14, 0.04, 0.06, 0.08, K.red); }
}
function tMat(g, f, it) {
  const W = it.w || 2.2, D = it.d || 1.4, c = [K.red, '#E8D9A8', '#D86B2A', '#F3E3BC'][(it.seed || 0) % 4];
  f.flat(-W / 2, -D / 2, W / 2, D / 2, 0.012, '#C9B26A');
  f.flat(-W / 2 + 0.15, -D / 2 + 0.15, W / 2 - 0.15, D / 2 - 0.15, 0.016, c);
}
/** a roadside stall: a low table under a cloth awning on two poles, two stools, the day's goods (tea, fritters,
 *  betel, fruit, shoe repair...). Low (2.1 m): it stays in the foreground */
function tStall(g, f, it) {
  const r = rng(it.seed || 3), c = CLOTH[(it.seed || 0) % CLOTH.length];
  f.flat(-1.1, -0.8, 1.1, 0.9, 0.005, K.earthD);
  g.box(0, 0.62, -0.1, 1.5, 0.08, 0.7, K.woodL);
  for (const sx of [-0.65, 0.65]) f.box(sx, 0.3, -0.1, 0.07, 0.6, 0.6, K.woodD);
  for (const sx of [-0.9, 0.9]) f.box(sx, 1.05, -0.5, 0.06, 2.1, 0.06, K.bambooD);
  g.boxR(0, 2.05, -0.05, 2.1, 0.05, 1.3, c, 0.22, 0, 0);
  pz(f, 0, 1.86, 0.62, 2.1, 0.2, shade(c, 0.85));
  const goods = ['#E2B33C', '#C8323C', '#FFFDF8', '#4E8C86', '#F3B27A', '#D6B486', '#7FAE66'];
  for (let k = 0; k < 4; k++) f.box(-0.55 + k * 0.37, 0.74, -0.15 + (k % 2) * 0.12, 0.26, 0.16, 0.24, goods[Math.floor(r() * goods.length)]);
  if (r() < 0.5) { f.box(0.45, 0.82, -0.25, 0.22, 0.3, 0.22, '#5E5850'); f.box(0.45, 1.0, -0.25, 0.1, 0.06, 0.1, K.dark); } // a kettle on a charcoal stove
  for (const sx of [-0.55, 0.55]) { const cc = SHUT[Math.floor(r() * SHUT.length)]; f.box(sx, 0.24, 0.6, 0.3, 0.05, 0.3, cc); f.box(sx, 0.11, 0.6, 0.22, 0.22, 0.22, shade(cc, 0.8)); }
}
/** ground cover for an open place (the kite field's grass, the gardens' tilled earth): a few flat patches */
function tGround(g, f, it) {
  const W = it.w || 10, D = it.d || 8, r = rng(it.seed || 5);
  const cs = it.c === 'earth' ? ['#D2B88C', '#C9AE84', '#D9C39C'] : ['#B3C982', '#A4BE74', '#BCCF8E'];
  f.flat(-W / 2, -D / 2, W / 2, D / 2, 0.003, cs[0]);
  for (let k = 0; k < 5; k++) { const w = W * (0.2 + r() * 0.25), d = D * (0.2 + r() * 0.25); f.flatR((r() - 0.5) * (W - w), (r() - 0.5) * (D - d), w, d, 0.004, cs[1 + (k % 2)], (r() - 0.5) * 0.6); }
}
function tCart(g, f, it) {
  const c = SHUT[(it.seed || 2) % SHUT.length];
  g.box(0, 0.72, 0, 1.5, 0.14, 0.9, K.wood);
  for (const n of [1, -1]) pz(f, -0.2, 0.42, 0.47 * n, 0.66, 0.66, '#2A2420', n);
  f.box(0.95, 0.66, 0, 0.6, 0.05, 0.05, K.woodD);
  f.box(-0.2, 0.92, 0, 1.2, 0.26, 0.7, c === K.woodD ? K.kraft : '#E8D9A8');
}

// keep-out helper (world space, from the item's turn)
function box(it, w, d, ox = 0, oz = 0) {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const cx = it.x + ox * c + oz * s, cz = it.z - ox * s + oz * c;
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return { type: 'box', minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd };
}
const homeObs = (it) => [box(it, (it.w || 4.6) + 0.2, (it.d || 4.2) + 0.2)];
export const ART = {
  mkHut: { h: 4.4, map: true, draw: mkHut, obstacles: homeObs },
  mkRow: { h: 7.2, map: true, draw: mkRow, obstacles: (it) => [box(it, (it.w || 4.8) + 0.1, (it.d || 6.4) + 0.1), ...(it.shop !== false ? [box(it, (it.w || 4.8) - 1.0, 0.6, 0, (it.d || 6.4) / 2 + 0.35)] : [])] },
};
export const PROP = {
  mkLow: { draw: mkLow, obstacles: homeObs },
  tFence: { draw: tFence, obstacles: (it) => [box(it, it.len || 5, 0.2)] },
  tShed: { draw: tShed, obstacles: (it) => [box(it, (it.w || 2.6) + 0.2, 1.7)] },
  tJars: { draw: tJars, obstacles: (it) => [box(it, (it.n || 2) * 0.62, 0.6)] },
  tWash: { draw: tWash, obstacles: (it) => [box(it, 0.2, 0.2, -(it.len || 3) / 2, 0), box(it, 0.2, 0.2, (it.len || 3) / 2, 0)] },
  tBike: { draw: tBike, obstacles: (it) => [box(it, 1.7, 0.4)] },
  tPots: { draw: tPots, obstacles: (it) => [box(it, (it.n || 3) * 0.5, 0.42)] },
  tWood: { draw: tWood, obstacles: (it) => [box(it, 1.7, 0.7)] },
  tBench: { draw: tBench, obstacles: (it) => [box(it, 1.6, 0.42)] },
  tShrub: { draw: tShrub, obstacles: (it) => [box(it, 1.0 * (it.s || 1), 0.9 * (it.s || 1))] },
  tBed: { draw: tBed, obstacles: () => [] },
  tHay: { draw: tHay, obstacles: (it) => [box(it, 1.3, 1.3)] },
  tCoop: { draw: tCoop, obstacles: (it) => [box(it, 1.3, 0.9, 0, -0.3)] },
  tMat: { draw: tMat, obstacles: () => [] },
  tCart: { draw: tCart, obstacles: (it) => [box(it, 1.9, 1.0)] },
  tGround: { draw: tGround, obstacles: () => [] },
  tStall: { draw: tStall, obstacles: (it) => [box(it, 1.9, 1.2, 0, -0.1)] },
};

const job = (x, z, h, mood = 'work', r = 0.9) => ({ area: { x, z, r }, spot: { x, z, h }, mood, workChance: 0.8, workFor: [8, 16] });
const HELLO = TOWN_HELLO;

// ---------------------------------------------------------------------------------
// The packing itself
// ---------------------------------------------------------------------------------
// lane centre lines: nothing may stand on a lane (its surface and kerb), [x0, z0, x1, z1]
const LANES = [
  [-58, 272, 37, 272], [-58, 300, 39, 300], [-30, 334, 37, 334], [-30, 358, 30, 358],
  [7, 258, 7, 368], [7.6, 368, 7, 378], [-30, 272, -30, 358], [-58, 272, -58, 300], [29, 300, 29, 334],
];
const ROAD = [[4, 160], [4, 180], [8.5, 200], [11, 215], [9, 232], [7, 250], [7, 258]];
for (let k = 0; k < ROAD.length - 1; k++) LANES.push([...ROAD[k], ...ROAD[k + 1]]);
const roadX = (z) => { for (let k = 0; k < ROAD.length - 1; k++) { const [xa, za] = ROAD[k], [xb, zb] = ROAD[k + 1]; if (z <= zb) return xa + ((xb - xa) * (z - za)) / (zb - za); } return 7; };
// places kept open on purpose (beyond the doors and spots): the letter's signature, the kite field's middle,
// the tea square, the dogs' corner, the painted shortcut, the crease where the road comes onto the letter,
// the Quarter's border sign, and the letter's left page edge (its paper look)
const KEEP_RECTS = [
  [-55, 359, -37, 366], [-50, 310, -36, 327], [9, 312.5, 27, 321.5], [27.5, 278.5, 34.5, 284.5], [19.5, 274, 23.5, 281],
  [-1, 256.5, 15, 263.5], [-4, 159, 12, 165], [-97, 258, -88, 379], [-27, 159, -22, 259], [31, 159, 35, 259],
];
// the day scripts' own coordinates in the Market (day4..day14 files): keep 2 m round each
const DAY_PTS = [
  [7, 258.4], [2.6, 261.4], [3.9, 262.7], [12, 269.5], [12, 271], [21.6, 270.9], [28.4, 269.8], [31, 269.8], [21.5, 275.4], [21.5, 277.7],
  [31.6, 280.4], [29.9, 281.4], [12.6, 297.4], [15.4, 297.9], [16.9, 297.95], [21.2, 295], [33.4, 295.6], [24, 311], [23.1, 317.2],
  [29, 329], [33.6, 330.4], [28.6, 302.4], [3, 301.5], [7, 262], [18, 272.2], [21.5, 273.2], [21.2, 299.2], [24, 315.6], [23.1, 318.8],
  [29, 332.2], [29.9, 283], [20.5, 294.4], [23.4, 296.55], [17.6, 305], [21, 305], [24.4, 305], [33.4, 311.4], [7, 290], [22.5, 291],
  [27.4, 296.9], [33, 314], [11.6, 285.5], [24.2, 297.6], [24, 306], [27.5, 313], [24.1, 297.6], [23.2, 296.9], [27.5, 318.6], [27.5, 301], [27.5, 317],
  [7, 366], [7, 378], [39, 300],
];
const FLAT = new Set(['tGround', 'tufts', 'postmark', 'stamp', 'seal', 'signature', 'paving', 'hopscotch', 'drain', 'pageCrease', 'kiteUp', 'tBed', 'tMat', 'stoolRow']);
const TREE = new Set(['padauk', 'rain', 'palm']);
// small loose things a new home may push a step aside (never lamps, benches, carts, stalls or people)
const SOFT = new Set(['parcel', 'sapling', 'flowers', 'potPlants', 'baskets', 'crates', 'sacks', 'tufts', 'mailSacks', 'jars', 'woodpile', 'potRack', 'tShrub', 'tPots', 'tJars', 'tWood', 'tHay', 'tCart', 'tCoop', 'tBench']);

/** town({ ITEMS, add, folk, defs, keep }) -> { added, houses, people, skipped }. defs = every ART/PROP def (for keep-outs) */
export function town({ ITEMS, add, folk, defs = {}, keep = [] }) {
  const base = ITEMS.length;
  // ---- a coarse spatial hash of every footprint (rects [x0, z0, x1, z1])
  const CELL = 4, grid = new Map();
  const cellsOf = (r) => { const out = []; for (let i = Math.floor(r[0] / CELL); i <= Math.floor(r[2] / CELL); i++) for (let j = Math.floor(r[1] / CELL); j <= Math.floor(r[3] / CELL); j++) out.push(i * 10007 + j); return out; };
  const insert = (r, tag, it = null) => { r.tag = tag; r.it = it; for (const c of cellsOf(r)) { let l = grid.get(c); if (!l) grid.set(c, (l = [])); l.push(r); } };
  const rectsOf = (it) => {
    if (FLAT.has(it.k)) return [];
    const d = defs[it.k];
    if (TREE.has(it.k)) { const h = 1.25 * (it.s || 1); return [[it.x - h, it.z - h, it.x + h, it.z + h]]; }
    if (d && d.obstacles) { const o = d.obstacles(it); if (o.length) return o.map((b) => (b.type === 'box' ? [b.minX, b.minZ, b.maxX, b.maxZ] : [b.x - b.r, b.z - b.r, b.x + b.r, b.z + b.r])); }
    let hw, hd;
    if (it.w && it.d) { hw = it.w / 2; hd = it.d / 2; } else if (it.len) { hw = it.len / 2; hd = 0.3; } else if (it.k === 'folk') hw = hd = 0.35; else hw = hd = 0.65;
    const c = Math.abs(Math.cos(it.ry || 0)), s = Math.abs(Math.sin(it.ry || 0));
    const ex = c * hw + s * hd, ez = s * hw + c * hd;
    return [[it.x - ex, it.z - ez, it.x + ex, it.z + ez]];
  };
  for (const it of ITEMS) for (const r of rectsOf(it)) insert(r, it.k, it);
  const removeRects = (it) => { for (const l of grid.values()) for (let i = l.length - 1; i >= 0; i--) if (l[i].it === it) l.splice(i, 1); };
  /** the rects a new thing must find clear: its keep-outs, or its whole extent for lines and flat beds */
  const placeRects = (o) => {
    const full = (w, d) => { const c = Math.abs(Math.cos(o.ry || 0)), s = Math.abs(Math.sin(o.ry || 0)), ex = (c * w + s * d) / 2, ez = (s * w + c * d) / 2; return [[o.x - ex, o.z - ez, o.x + ex, o.z + ez]]; };
    if (o.k === 'tWash') return full((o.len || 3) + 0.2, 0.7);
    if (o.k === 'tBed' || o.k === 'tMat') return full(o.w || 3, o.d || 1.6);
    const rs = rectsOf(o);
    return rs.length ? rs : [[o.x - 0.3, o.z - 0.3, o.x + 0.3, o.z + 0.3]];
  };
  const keepPts = [...keep, ...DAY_PTS.map(([x, z]) => ({ x, z }))];
  const gapTo = (a, b) => Math.max(a[0] - b[2], b[0] - a[2], a[1] - b[3], b[1] - a[3]);
  const ptRect = (x, z, r) => Math.hypot(Math.max(r[0] - x, 0, x - r[2]), Math.max(r[1] - z, 0, z - r[3]));
  const laneDist = (r) => {
    let best = Infinity;
    for (const [x0, z0, x1, z1] of LANES) {
      if (Math.min(x0, x1) - r[2] > 6 || r[0] - Math.max(x0, x1) > 6 || Math.min(z0, z1) - r[3] > 6 || r[1] - Math.max(z0, z1) > 6) continue;
      const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(L / 0.4));
      for (let i = 0; i <= n; i++) { const d = ptRect(x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n, r); if (d < best) best = d; }
    }
    return best;
  };
  /** is rect r clear of every footprint by gap, of the lanes by laneGap, and of the keep places? */
  let why = '';
  let soft = null; // while a home is tested: the small loose things it may push aside (moved a little, never lost if there is room)
  const clear = (r, gap, laneGap) => {
    if (laneDist(r) < laneGap) { why = 'lane'; return false; }
    for (const k of keepPts) if (ptRect(k.x, k.z, r) < 2.0) { why = 'keep'; return false; }
    for (const k of KEEP_RECTS) if (gapTo(r, k) < 0) { why = 'keepRect'; return false; }
    // (and only inside chunk quarters that already hold the Market's things: a quarter that gets its first solid
    // costs two more draw calls, so the page edge west of x -80 and the top strip west of x -20 stay as they were)
    if (r[0] < -79.8 || r[2] > 38.6 || r[1] < 160.5 || r[3] > 377.6) { why = 'edge'; return false; }
    // the envelope road's paper (east of x 19.8 is another chunk quarter: filling it costs the road's views ~5 draw calls, so it is left as it was)
    if (r[1] < 260.1 && (r[0] < -19.8 || r[2] > 19.8)) { why = 'edge'; return false; }
    for (const c of cellsOf(r)) for (const o of grid.get(c) || []) if (gapTo(r, o) < gap) { if (soft && o.it && SOFT.has(o.tag) && !o.it.townKeep) { soft.add(o.it); continue; } why = o.tag; return false; }
    return true;
  };
  let houses = 0, people = 0, relocated = 0;
  const dropped = [];
  const skipped = [];
  /** put an item down if its footprint is clear; returns it or null */
  // the strip just south of each east-west lane is the near part of the street camera's view: nothing tall there
  // (a tree or a tall home in it would stand between the camera and Maya)
  const EW = LANES.filter(([x0, z0, x1, z1]) => z0 === z1);
  const inNearStrip = (o) => EW.some(([x0, z, x1]) => o.x > Math.min(x0, x1) - 3 && o.x < Math.max(x0, x1) + 3 && o.z > z && o.z - z < 8.8);
  const put = (o, gap = 0.25, laneGap = 2.5, push = false) => {
    if ((TREE.has(o.k) || ART[o.k]) && inNearStrip(o)) { why = 'near'; return null; }
    // no new trees in the Market's core blocks: the instanced trees cost two draw calls wherever one is in view,
    // and the core views had none (the core gets shrubs and potted plants instead)
    if (TREE.has(o.k) && o.x > -33 && o.z > 262) { if (o.townKeep) return null; return put({ ...o, k: 'tShrub', s: 1.1 + (o.s || 1) * 0.2, seed: Math.floor(o.x * 7 + o.z) }, gap, laneGap, push); }
    const rs = placeRects(o);
    soft = push ? new Set() : null;
    for (const r of rs) if (!clear(r, gap, laneGap)) { soft = null; return null; }
    const moved = soft ? [...soft] : [];
    soft = null;
    for (const it of moved) { removeRects(it); const i = ITEMS.indexOf(it); if (i >= 0) ITEMS.splice(i, 1); }
    add(o);
    for (const r of rs) insert(r, o.k, o);
    // what was pushed aside goes down again close by, where there is room (a ring of tries out to 3 m)
    for (const it of moved) {
      let done = false;
      for (const rad of [1.2, 2.0, 3.0]) {
        for (let a = 0; a < 8 && !done; a++) {
          const t = (a / 8) * PI * 2, c = { ...it, x: it.x + Math.cos(t) * rad, z: it.z + Math.sin(t) * rad, townKeep: true };
          if (put(c, 0.15, 2.0)) { done = true; relocated++; }
        }
        if (done) break;
      }
      if (!done) dropped.push(`${it.k}@${it.x.toFixed(1)},${it.z.toFixed(1)}`);
    }
    return o;
  };
  const person = (x, z, ry, pose, seed, extra = {}, force = false) => {
    const r = [x - 0.3, z - 0.3, x + 0.3, z + 0.3];
    if (!force && !clear(r, 0.05, 2.0)) return false;
    folk(x, z, ry, pose, seed, extra); insert(r, 'folk'); people++; return true;
  };
  // local (along, out) offsets -> world, for a home turned by ry (front = local +Z)
  const at = (o, lx, lz) => { const c = Math.cos(o.ry || 0), s = Math.sin(o.ry || 0); return [o.x + lx * c + lz * s, o.z - lx * s + lz * c]; };

  const STYLES_HUT = ['plank', 'stilt', 'brick', 'bamboo', 'lime', 'thatch', 'plank', 'lime', 'stilt'];
  const STYLES_LOW = ['plank', 'bamboo', 'lime', 'brick', 'thatch', 'lime'];
  const TRADES = [
    { my: 'အပ်ချုပ်ဆိုင်' }, { my: 'ဆံပင်ညှပ်' }, { my: 'ဆေးဆိုင်' }, { my: 'ရွှေဆိုင်' }, { my: 'ထီးပြင်' }, { my: 'လက်ဖက်ရည်' }, { my: 'မုန့်ဆိုင်' }, { my: 'ဖိနပ်' },
  ];
  let signsLeft = 0, tradeK = 0, seedN = 9000; // (the trade boards go on at the end, spread out: see below)
  const POSES = ['sweep', 'stand', 'squat', 'carry', 'kid', 'sit', 'kid', 'read', 'head'];
  /** the life round one home: a fence, a wash line, jars, pots, a bike, a person at work (all optional, all checked) */
  const yard = (h, r, lots = 1) => {
    const W = h.w, D = h.d, side = r() < 0.5 ? -1 : 1;
    const bits = [];
    // beside the house: one thing in the side gap
    const p = r();
    if (p < 0.22) bits.push(['tJars', side * (W / 2 + 0.75), -D / 4, { n: 2 }]);
    else if (p < 0.38) bits.push(['tWood', side * (W / 2 + 1.0), -D / 4, {}, PI / 2]);
    else if (p < 0.52) bits.push(['tBike', side * (W / 2 + 0.6), D / 4, {}, PI / 2]);
    else if (p < 0.64) bits.push(['tShrub', side * (W / 2 + 0.8), 0, { s: 0.9 + r() * 0.4, seed: Math.floor(r() * 1e4) }]);
    else if (p < 0.74) bits.push(['tShrub', side * (W / 2 + 0.9), -D / 3, { s: 1.2, seed: Math.floor(r() * 1e4) }]);
    // in front of it: pots on the step side, a bench, or nothing (the door must stay clear)
    const q = r();
    if (q < 0.3) bits.push(['tPots', -side * (W / 2 - 0.3), D / 2 + 0.55, { n: 2, seed: Math.floor(r() * 1e4) }]);
    else if (q < 0.45 && W > 4.4) bits.push(['tBench', -side * (W / 2 - 0.85), D / 2 + 0.6, { seed: Math.floor(r() * 10) }]);
    // behind it: a wash line, a garden bed, a shed, a coop, a fence along the lot's back
    if (lots) {
      const b = r();
      if (b < 0.25) bits.push(['tWash', 0, -D / 2 - 1.1, { len: Math.min(3.2, W - 0.6), seed: Math.floor(r() * 1e4) }]);
      else if (b < 0.45) bits.push(['tBed', (r() - 0.5) * 1.5, -D / 2 - 1.4, { w: Math.min(3.4, W), d: 1.4, seed: Math.floor(r() * 1e4) }]);
      else if (b < 0.58) bits.push(['tShed', (r() - 0.5) * 1.5, -D / 2 - 1.4, { w: 2.4, seed: Math.floor(r() * 1e4) }]);
      else if (b < 0.68) bits.push(['tCoop', (r() - 0.5) * 2, -D / 2 - 1.3, {}]);
      if (r() < 0.35) bits.push(['tFence', 0, -D / 2 - 2.5, { len: W + 1.2, style: r() < 0.7 ? 'screen' : 'rail' }]);
    }
    for (const [k, lx, lz, more, ry2 = 0] of bits) { const [x, z] = at(h, lx, lz); put({ k, x, z, ry: (h.ry || 0) + ry2, ...more }, 0.15, 2.3); }
    // someone at work in front, now and then
    if (r() < 0.18) { const [x, z] = at(h, side * (W / 2 - 0.5), D / 2 + 1.2); const pose = POSES[Math.floor(r() * POSES.length)]; person(x, z, (h.ry || 0) + (r() - 0.5) * 1.2, pose, seedN++, { woman: r() < 0.55, ...(pose === 'carry' || pose === 'head' ? { load: CLOTH[Math.floor(r() * CLOTH.length)] } : {}) }); }
  };
  /** one home of kind k: 'hut' (tall, mkHut), 'row' (two-storey), 'low' (PROP mkLow) */
  const placeHome = (k, x, z, ry, w, d, seed, gap = 0.5, laneGap = 2.5, simple = false, shops = true) => {
    const r = rng(seed);
    let o;
    if (k === 'row') {
      o = { k: 'mkRow', x, z, ry, w, d, seed, style: ['brick', 'timber', 'lime', 'lime'][seed % 4], shop: shops && r() < 0.75 };
      if (o.shop && signsLeft > 0 && r() < 0.45) { o.sign = TRADES[tradeK++ % TRADES.length]; signsLeft--; }
    } else if (k === 'low') o = { k: 'mkLow', x, z, ry, w, d, seed, style: STYLES_LOW[seed % STYLES_LOW.length], ridge: r() < 0.5 ? 'z' : 'x' };
    else o = { k: 'mkHut', x, z, ry, w, d, seed, style: STYLES_HUT[seed % STYLES_HUT.length], ridge: r() < 0.3 ? 'z' : 'x', ...(simple ? { simple: true } : {}) };
    // a porch and a step stand out in front: keep that much more room before the lane
    const got = put(o, gap, laneGap, true);
    if (got) {
      houses++;
      // a shop keeps the ground before its counter open (customers stand there; nothing else is put down on it)
      if (o.k === 'mkRow' && o.shop) { const [fx, fz] = at(o, 0, d / 2 + 1.7), c = Math.abs(Math.cos(ry)) > 0.5, hw = c ? Math.min(w - 1, 2.6) / 2 : 0.9, hd = c ? 0.9 : Math.min(w - 1, 2.6) / 2, fr = [fx - hw, fz - hd, fx + hw, fz + hd]; if (clear(fr, 0.05, 1.8)) { insert(fr, 'shopFront'); o.roomy = true; } }
    }
    else if (o.sign) { signsLeft++; tradeK--; }
    return got;
  };

  /** a frontage along a lane. axis 'x': an east-west lane at z = at (side +1 = south, -1 = north);
   *  axis 'z': a north-south lane at x = at (side -1 = west, +1 = east). set = lane centre -> house front */
  const frontage = ({ axis, at: L, from, to, side, set, kind, seed, w = [4.2, 5.8], d = [4.0, 5.0], gaps = [0.8, 2.2], lots = 1 }) => {
    const r = rng(seed);
    let u = from + r() * 1.2;
    while (u < to - 3) {
      const W0 = w[0] + r() * (w[1] - w[0]), D0 = d[0] + r() * (d[1] - d[0]);
      const k0 = typeof kind === 'function' ? kind(r) : kind;
      let h = null, W = W0;
      // the house as drawn; then set further back (past a lamp, a cart, a mat at the kerb); then a smaller one
      for (const [kk, ww, dd, back] of [[k0, W0, D0, 0], [k0, W0, D0, 1.3], ['hut', 3.6, 3.5, 0], [k0 === 'row' ? 'hut' : k0, W0, D0, 2.6], ['hut', 3.6, 3.5, 1.5]]) {
        const k = k0 === 'low' ? 'low' : kk;
        const DD = k === 'row' ? Math.max(dd, 5.4) : dd;
        if (u + ww > to) continue;
        const off = set + back + DD / 2;
        let x, z, ry;
        if (axis === 'x') { x = u + ww / 2; z = L + side * off; ry = side > 0 ? PI : 0; }
        else { const lx = typeof L === 'function' ? L(u + ww / 2) : L; z = u + ww / 2; x = lx + side * off; ry = side > 0 ? -PI / 2 : PI / 2; }
        h = placeHome(k, x, z, ry, ww, DD, seed * 31 + Math.floor(u * 7 + 1000), 0.45, set - 0.9);
        if (h) { W = ww; break; }
      }
      if (h) { yard(h, r, lots); u += W + gaps[0] + r() * (gaps[1] - gaps[0]); }
      else { skipped.push(`f${seed}:${why}`); u += 0.9; }
    }
  };
  /** back lots: rows of homes facing +Z (the camera) across a rect, with yards, sheds, gardens and trees between */
  const pack = ({ rect: [x0, z0, x1, z1], seed, kinds = ['hut'], w = [4.0, 5.6], d = [3.8, 4.8], gx = [1.4, 3.2], gz = [2.6, 4.2], face = 0, shops = true }) => {
    const r = rng(seed);
    let z = z0 + r() * 1.5;
    while (z < z1 - 3) {
      const D = d[0] + r() * (d[1] - d[0]);
      let x = x0 + r() * 2.5;
      while (x < x1 - 3) {
        const W = w[0] + r() * (w[1] - w[0]);
        const k = kinds[Math.floor(r() * kinds.length)];
        const DD = k === 'row' ? Math.max(D, 5.4) : D;
        const ry = face === 'any' ? [0, 0, 0, PI / 2, -PI / 2][Math.floor(r() * 5)] : face;
        const cx = x + W / 2, cz = z + DD / 2 + (r() - 0.5) * 1.2;
        const ww = Math.abs(Math.sin(ry)) > 0.5 ? DD : W;
        let h = cx + ww / 2 <= x1 ? placeHome(k, cx, cz, ry, W, DD, seed * 17 + Math.floor(x * 13 + z * 7 + 5000), 0.6, 2.8, true, shops) : null;
        if (!h && r() < 0.75) h = placeHome('hut', cx, cz, ry, 3.6, 3.4, seed * 19 + Math.floor(x * 11 + z * 5 + 7000), 0.5, 2.8, true);
        if (h) { yard(h, r, r() < 0.5 ? 1 : 0); x += ww + gx[0] + r() * (gx[1] - gx[0]); }
        else {
          // no room for a home here: a tree, a shed or a garden bed instead
          const p = r();
          if (p < 0.4) put({ k: r() < 0.55 ? 'padauk' : 'rain', x: x + 1.5, z: z + 1.8, s: 0.9 + r() * 0.35 }, 0.3, 3.2);
          else if (p < 0.6) put({ k: 'tShed', x: x + 1.6, z: z + 1.5, ry: face === 'any' ? 0 : face, w: 2.4, seed: Math.floor(r() * 1e4) }, 0.3, 2.6);
          else if (p < 0.8) put({ k: 'tBed', x: x + 1.8, z: z + 1.6, w: 3.0, d: 1.6, seed: Math.floor(r() * 1e4) }, 0.2, 2.4);
          x += 2.2;
        }
      }
      z += D + gz[0] + r() * (gz[1] - gz[0]);
    }
  };
  /** the last pass: anything still bare between it all gets a little life (shrubs, beds, jars, a tree, hay, a mat) */
  const sprinkle = ({ rect: [x0, z0, x1, z1], seed, step = 3.4, p = 0.75, trees = 0.22 }) => {
    const r = rng(seed);
    for (let z = z0; z < z1; z += step) for (let x = x0; x < x1; x += step) {
      if (r() > p) continue;
      const cx = x + r() * step * 0.6, cz = z + r() * step * 0.6;
      const probe = [cx - 1.3, cz - 1.3, cx + 1.3, cz + 1.3];
      if (!clear(probe, 0.1, 2.6)) continue;
      const q = r();
      let o;
      if (q < trees) o = { k: r() < 0.5 ? 'padauk' : 'rain', x: cx, z: cz, s: 0.85 + r() * 0.35 };
      else if (q < trees + 0.22) o = { k: 'tShrub', x: cx, z: cz, s: 0.8 + r() * 0.5, seed: Math.floor(r() * 1e4) };
      else if (q < trees + 0.38) o = { k: 'tBed', x: cx, z: cz, w: 2.4 + r(), d: 1.4, seed: Math.floor(r() * 1e4) };
      else if (q < trees + 0.48) o = { k: 'tJars', x: cx, z: cz, n: 2 + Math.floor(r() * 2), ry: (r() - 0.5) * 0.6 };
      else if (q < trees + 0.56) o = { k: 'tHay', x: cx, z: cz, ry: r() };
      else if (q < trees + 0.64) o = { k: 'tMat', x: cx, z: cz, w: 2.0, d: 1.3, seed: Math.floor(r() * 4) };
      else if (q < trees + 0.72) o = { k: 'tCart', x: cx, z: cz, ry: (r() - 0.5) * 1.2, seed: Math.floor(r() * 7) };
      else if (q < trees + 0.8) o = { k: 'tFence', x: cx, z: cz, len: 3 + r() * 2, style: r() < 0.6 ? 'screen' : 'wall', seed: Math.floor(r() * 7), ry: r() < 0.5 ? 0 : PI / 2 };
      else o = { k: 'tPots', x: cx, z: cz, n: 3, seed: Math.floor(r() * 1e4) };
      put(o, 0.2, 2.6);
    }
  };

  // ground cover under the open places (laid straight down: flat, it stands in nobody's way)
  for (const [x, z, w, d, c, sd] of [[-44.5, 316.5, 22, 22, 'grass', 1], [-46, 337.5, 16, 12, 'earth', 2], [-17.5, 367.5, 20, 13, 'earth', 3], [-46, 368, 18, 8, 'grass', 4], [-70, 300, 16, 70, 'grass', 5]]) add({ k: 'tGround', x, z, w, d, c, seed: sd });

  // ================= THE ENVELOPE ROAD (x -26..34, z 160..258): both sides, a second row, back lots
  const mixRoad = (r) => (r() < 0.45 ? 'row' : 'hut');
  // (the front row low: a tall home south of Maya would be faded out of the foreground by the cutaway)
  frontage({ axis: 'z', at: roadX, from: 164, to: 256, side: -1, set: 3.4, kind: 'low', seed: 11, w: [4.0, 5.4], d: [3.8, 4.6] });
  frontage({ axis: 'z', at: roadX, from: 164, to: 256, side: 1, set: 3.4, kind: 'low', seed: 12, w: [4.0, 5.4], d: [3.8, 4.6] });
  // the second row, tall homes and shophouses facing the road
  frontage({ axis: 'z', at: roadX, from: 164, to: 256, side: -1, set: 9.4, kind: mixRoad, seed: 15 });
  frontage({ axis: 'z', at: roadX, from: 164, to: 256, side: 1, set: 9.4, kind: mixRoad, seed: 16 });
  pack({ rect: [-19.5, 163, -6, 256], seed: 13, kinds: ['hut', 'hut', 'row'], face: 'any' });
  pack({ rect: [15, 163, 19.8, 256], seed: 14, kinds: ['hut', 'row'], face: 'any' });

  // ================= THE LETTER
  // two-storey shophouses in the blocks' middles (laid first: seen over the low rows from the lanes, and from the map)
  pack({ rect: [-27, 311.4, 4, 318.2], seed: 48, kinds: ['row'], w: [4.4, 5.4], d: [5.4, 5.8], gx: [0.8, 1.8] });
  pack({ rect: [-57, 283.0, -32, 289.8], seed: 49, kinds: ['row'], w: [4.4, 5.4], d: [5.4, 5.8], gx: [0.8, 1.8], shops: false }); // (homes: their fronts face a back lane)
  pack({ rect: [-27, 283.0, 4, 289.8], seed: 50, kinds: ['row'], w: [4.4, 5.4], d: [5.4, 5.8], gx: [0.8, 1.8], shops: false });
  // the south sides of the east-west lanes: low homes facing the lane (their backs to the camera), and their yards
  const LOWW = [3.8, 5.2], LOWD = [3.6, 4.4];
  frontage({ axis: 'x', at: 272, from: -57.5, to: -22, side: 1, set: 6.2, kind: 'low', seed: 21, w: LOWW, d: LOWD });
  frontage({ axis: 'x', at: 272, from: 1, to: 11.5, side: 1, set: 6.2, kind: 'low', seed: 22, w: LOWW, d: LOWD });
  frontage({ axis: 'x', at: 300, from: -57.5, to: 6, side: 1, set: 6.2, kind: 'low', seed: 23, w: LOWW, d: LOWD });
  frontage({ axis: 'x', at: 300, from: 8, to: 20, side: 1, set: 6.2, kind: 'low', seed: 24, w: LOWW, d: LOWD });
  frontage({ axis: 'x', at: 334, from: -29.5, to: 6, side: 1, set: 6.2, kind: 'low', seed: 25, w: LOWW, d: LOWD });
  frontage({ axis: 'x', at: 334, from: 8, to: 37.5, side: 1, set: 6.2, kind: 'low', seed: 26, w: LOWW, d: LOWD });
  frontage({ axis: 'x', at: 358, from: -29.5, to: 6, side: 1, set: 6.2, kind: 'low', seed: 27, w: LOWW, d: LOWD });
  frontage({ axis: 'x', at: 358, from: 8, to: 37.5, side: 1, set: 6.2, kind: 'low', seed: 28, w: LOWW, d: LOWD });
  // the north sides where a gap is left (Counter Lane's far west, Rice Lane's west end)
  frontage({ axis: 'x', at: 300, from: -57.5, to: -28, side: -1, set: 2.7, kind: 'row', seed: 29, w: [4.4, 5.4], d: [6, 6.6] });
  // the north-south lanes, both sides: the west lane, the far-west link, the spine, the tea-shop street
  const mixLane = (r) => (r() < 0.55 ? 'row' : 'hut');
  for (const [L, from, to, sd] of [[-30, 275, 298, 31], [-30, 303, 332, 33], [-30, 337, 356, 35], [-58, 262, 299, 37], [7, 275, 298, 39], [7, 303, 332, 41], [7, 337, 356, 43], [7, 361, 377, 45], [29, 303, 332, 47]]) {
    frontage({ axis: 'z', at: L, from, to, side: -1, set: 2.9, kind: 'low', seed: sd, w: [4.0, 5.4], d: [3.8, 4.6] });
    frontage({ axis: 'z', at: L, from, to, side: 1, set: 2.9, kind: 'low', seed: sd + 1, w: [4.0, 5.4], d: [3.8, 4.6] });
    frontage({ axis: 'z', at: L, from, to, side: -1, set: 8.6, kind: mixLane, seed: sd + 100 });
    frontage({ axis: 'z', at: L, from, to, side: 1, set: 8.6, kind: mixLane, seed: sd + 101 });
  }
  // back lots
  pack({ rect: [-57, 259, -27, 266.6], seed: 51, kinds: ['hut'], w: [3.6, 4.6], d: [3.2, 3.8] }); // behind Stamp Lane's north stalls
  pack({ rect: [13, 259, 37, 266.6], seed: 52, kinds: ['hut'], w: [3.6, 4.6], d: [3.2, 3.8] });
  pack({ rect: [-57, 276, -32, 290], seed: 53, kinds: ['hut', 'row'] });
  pack({ rect: [-27, 276, 4, 290], seed: 54, kinds: ['hut'] });
  pack({ rect: [-27, 305, 4, 323.5], seed: 55, kinds: ['hut'] }); // behind Counter Lane's south homes (round the shophouse row)
  pack({ rect: [-28, 338, 4, 348], seed: 56, kinds: ['hut', 'row'] });
  pack({ rect: [9, 338, 37, 348], seed: 57, kinds: ['hut'] });
  pack({ rect: [-57, 330, -33, 358], seed: 58, kinds: ['hut'], face: 'any' });
  pack({ rect: [-57, 365, -32, 377.5], seed: 59, kinds: ['hut'] });
  pack({ rect: [-29, 361, 4, 377.5], seed: 60, kinds: ['hut'] });
  pack({ rect: [9, 361, 37.5, 377.5], seed: 61, kinds: ['hut'] });
  pack({ rect: [31, 303, 38.5, 333], seed: 62, kinds: ['hut'], w: [3.4, 4.4], d: [3.4, 4.2] });
  // the margin hamlet (the letter's left margin, x -88..-59): homesteads in loose rows, the page edge left as paper
  pack({ rect: [-79.5, 261, -60, 377.5], seed: 63, kinds: ['hut', 'hut', 'hut'], face: 'any', gx: [2.4, 4.6], gz: [3.2, 5.0] });
  pack({ rect: [-57, 302, -51, 330], seed: 64, kinds: ['hut'], w: [3.6, 4.4], d: [3.4, 4.0] }); // the kite field's west edge
  // the kerbs: along every lane, both sides, low street life a step off the footpath (the near part of the low
  // camera's view, where anything tall is faded away: so only low things here). Never on the lane, never at a door.
  const kerb = ({ axis, at: L, from, to, side, off, seed, step = 3.3, p = 0.7 }) => {
    const r = rng(seed);
    for (let u = from + r() * step; u < to; u += step * (0.8 + r() * 0.5)) {
      if (r() > p) continue;
      const q = r();
      const k = q < 0.22 ? 'tStall' : q < 0.32 ? 'tPots' : q < 0.42 ? 'tBench' : q < 0.52 ? 'tBike' : q < 0.62 ? 'tJars' : q < 0.74 ? 'tShrub' : q < 0.84 ? 'tCart' : q < 0.94 ? 'tFence' : 'tJars';
      const lx = typeof L === 'function' ? L(u) : L;
      let x, z, ry;
      if (axis === 'x') { x = u; z = L + side * off; ry = side > 0 ? PI : 0; } else { z = u; x = lx + side * off; ry = side > 0 ? -PI / 2 : PI / 2; }
      const o = { k, x, z, ry, seed: Math.floor(r() * 1e4) };
      if (k === 'tFence') Object.assign(o, { len: 2.4 + r() * 1.2, style: r() < 0.5 ? 'wall' : 'screen' });
      if (k === 'tPots') o.n = 3 + Math.floor(r() * 2);
      if (k === 'tShrub') o.s = 0.8 + r() * 0.35;
      if (!put(o, 0.2, off - 0.7)) continue;
      // a seller at a stall, someone on a bench, now and then
      if (k === 'tStall') { const [px2, pz2] = at(o, 0.2, -1.15); person(px2, pz2, ry, r() < 0.5 ? 'sit' : 'stand', seedN++, { woman: r() < 0.6 }); }
      else if (k === 'tBench' && r() < 0.3) { const [px2, pz2] = at(o, 0.3, 0.05); person(px2, pz2, ry, r() < 0.5 ? 'sit' : 'read', seedN++, { stool: false, woman: r() < 0.5 }, true); }
    }
  };
  kerb({ axis: 'z', at: roadX, from: 164, to: 256, side: -1, off: 2.6, seed: 81 });
  kerb({ axis: 'z', at: roadX, from: 164, to: 256, side: 1, off: 2.6, seed: 82 });
  for (const [L, from, to, sd] of [[-30, 275, 357, 83], [-58, 262, 299, 85], [7, 275, 377, 87], [29, 303, 332, 89]]) {
    kerb({ axis: 'z', at: L, from, to, side: -1, off: 2.6, seed: sd });
    kerb({ axis: 'z', at: L, from, to, side: 1, off: 2.6, seed: sd + 1 });
  }
  for (const [L, from, to, sd] of [[272, -57, 36, 91], [300, -57, 38, 93], [334, -29, 37, 95], [358, -29, 30, 97]]) {
    kerb({ axis: 'x', at: L, from, to, side: 1, off: 3.1, seed: sd, p: 0.8 });
    kerb({ axis: 'x', at: L, from, to, side: 1, off: 4.8, seed: sd + 50, p: 0.3 });
  }

  // the last pass: nothing bare between it all
  sprinkle({ rect: [-19.5, 161, 19.8, 257], seed: 71 });
  sprinkle({ rect: [-79.5, 260.2, -33, 377.5], seed: 72 });
  sprinkle({ rect: [-33, 260.2, 38, 377.5], seed: 73, p: 0.5 });

  // ---- townsfolk with hellos: beside the things they work with (only where there is room)
  const TOWN_PEOPLE = [];
  const helloAt = (id, x, z, h, mood, force = false) => {
    if (!person(x, z, h, 'stand', 0, {}, force)) return false;
    ITEMS.pop(); people--; // (person() only tests the spot; the cast person stands there instead of a still figure)
    TOWN_PEOPLE.push({ id, x, z, heading: h, hello: HELLO[id], job: job(x, z, h, mood) });
    return true;
  };
  const mine = ITEMS.slice(base);
  // the trade boards: on a few shophouses well apart (each board is a draw call of its own)
  const shops = mine.filter((it) => it.k === 'mkRow' && it.shop), boards = [];
  // (on the letter only: the envelope road's views already carry the first fill's two shop boards)
  // (and only where the shop front has room before it: a board over a shop that faces a wall would be no shop)
  const letterShops = shops.filter((it) => it.z > 262 && it.roomy);
  for (const it of letterShops) if (boards.length < TRADES.length && boards.every((b) => Math.hypot(b.x - it.x, b.z - it.z) > 18)) boards.push(it);
  boards.forEach((it, i) => { it.sign = TRADES[i]; });
  const front = (it, dz) => at(it, 0, it.d / 2 + dz);
  const tryAt = (id, mood, list, dz = 1.6, dx = 0) => {
    for (const it of list) { const [x, z] = at(it, dx, it.d / 2 + dz); if (helloAt(id, x, z, it.ry || 0, mood, !!it.roomy)) return true; }
    return false;
  };
  void front;
  tryAt('mpauksi', 'work', boards.filter((it) => it.sign.my === 'ဆံပင်ညှပ်').concat(shops.filter((it) => it.roomy)));
  tryAt('mohnmar', 'work', boards.filter((it) => it.sign.my === 'အပ်ချုပ်ဆိုင်').concat(shops.filter((it) => it.roomy).reverse()));
  tryAt('mthawda', 'sweep', mine.filter((it) => (it.k === 'mkHut' || it.k === 'mkLow') && Math.abs(it.x + 30) < 10 && it.z > 276 && it.z < 356), 1.2);
  tryAt('mlaylay', 'work', mine.filter((it) => (it.k === 'mkHut' || it.k === 'mkLow') && it.z > 302 && it.z < 330 && it.x > -28 && it.x < 6), 1.8, 1.0);
  tryAt('uaungba', 'work', mine.filter((it) => it.k === 'mkHut' && it.x < -60), 1.4);

  return { added: ITEMS.length - base, houses, people, relocated, dropped, skipped, TOWN_PEOPLE };
}
