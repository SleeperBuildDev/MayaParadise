// Street details shared by Newsprint Junction (junction-detail.js) and Hearth Row (hearth-detail.js): pure draw
// helpers for the town detail pass (art-plan 2026-11-16, "shared street kit"), plus the pass's clear-check
// (makeClear / placer). Written beside art/street-kit.js on purpose: these two towns' ground is covered in decals at
// 0.0045-0.007 m (jPatch, jVerge, jPrint, hFootpath, hWear, item shadows), the very heights the shared kit's flats
// use, so their puddles, leaves, wear and pole/tank shadows here sit on layers of their own (Y below) and cannot
// z-fight; the wires end exactly on the insulators and the birds sit exactly on the drawn wire; the bunting runs
// between two given points. Same kit as the district art (kit.js Geo: outlined boxes in `g`, unoutlined boxes and
// flats in `f`, item-local, feet at y = 0, fronts face +Z).
// Everything here is merged into the chunk meshes (no new material, mesh, canvas or draw call). Nothing moves
// (steam and lamp cores go through ctx.smoke / ctx.glows in the detail files). Original blocky art; nothing here
// points the way.
//
//   pole(g, f, o)        power pole, crossarm, insulators, optional transformer can; 3 sagging wires to local +X
//                        (o.span m) as thin unoutlined boxes; o.birds mynas sitting on the middle wire
//   tankStand(g, f, o)   a water tank on an angle-iron stand, a pipe down to a tap and a bucket (back lots)
//   puddle(f, o)         flat blue-grey water with a pale rim and a sky glint (walk-through)
//   leaves(f, o)         fallen leaves (flat)
//   kerbWear(g, f, o)    slab seams, hairline cracks and a weed tuft along local X (flat + 2 tiny boxes)
//   scrap(g, f, kind, x, z, ry, o)   'sheet' (newspaper), 'ruled' (torn exercise-book corner), 'blot' (ink),
//                        'note' (a pinned note), 'ball' (crumpled paper)
//   cat / pigeon / crow  small perched animals, still
//   bunting(g, a, b, o)  a string of small flags between two local points (unoutlined)
import { rng, shade } from '../kit.js';

/** Flat decal heights used by this pass (never the same as the district art's own 0.004-0.007 / 0.009 / 0.01):
 * a layer each, so nothing here can z-fight another decal of its own. */
export const Y = { rim: 0.0074, water: 0.0080, glint: 0.0086, wear: 0.0083, leaf: 0.0095, paper: 0.0106, print: 0.0113 };

/** The solid Geo `g` seen as a plain one: boxes and quads drawn through it go into the item's solid mesh WITHOUT an
 * ink hull (kit.js `bare`, as build.js standUp does for buildings). Anything that stands above the ground goes this
 * way, never into the ground mesh `f`: the streamer shows a chunk's ground only while its bounding box is in view,
 * and one tall part in it (a wire at 5 m) kept the whole ground of its chunk drawn from far off (+8k triangles). */
const UNLINED = new WeakMap();
export function unlined(g) {
  let u = UNLINED.get(g);
  if (u) return u;
  const w = (k) => (...a) => { g.bare = true; try { g[k](...a); } finally { g.bare = false; } return u; };
  u = { box: w('box'), boxR: w('boxR'), quad: w('quad'), flat: w('flat'), flatR: w('flatR'),
    get tx() { return g.tx; }, get ty() { return g.ty; }, get tz() { return g.tz; }, get tc() { return g.tc; }, get ts() { return g.ts; }, get ry() { return g.ry; } };
  UNLINED.set(g, u);
  return u;
}
/** A thin unoutlined strand from (ax, ay, az) to (bx, by, bz), item-local (a wire, a string). */
export function bar(f, ax, ay, az, bx, by, bz, t, col) {
  // a ribbon t wide, lying flat across the line (2 triangles, not a 12-triangle box): the camera always looks down
  const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
  if (L < 1e-3) return;
  const px = (-dz / L) * t / 2, pz = (dx / L) * t / 2, e = t * 0.25 / L;
  const W = (x, y, z) => [f.tx + x * f.tc + z * f.ts, f.ty + y, f.tz - x * f.ts + z * f.tc];
  const x0 = ax - dx * e, z0 = az - dz * e, x1 = bx + dx * e, z1 = bz + dz * e;
  f.quad(W(x0 - px, ay, z0 - pz), W(x1 - px, by, z1 - pz), W(x1 + px, by, z1 + pz), W(x0 + px, ay, z0 + pz), col, 0, 1, 0);
}
/** Height of a sagging wire at t (0..1) drawn as `n` straight pieces between its parabola points. */
export function sagY(y0, y1, sag, t, n = 3) {
  const k = Math.min(n - 1, Math.floor(t * n)), ta = k / n, tb = (k + 1) / n;
  const P = (u) => y0 + (y1 - y0) * u - sag * 4 * u * (1 - u);
  return P(ta) + (P(tb) - P(ta)) * ((t - ta) / (tb - ta));
}

/** A small bird sitting (myna, crow or pigeon), facing local heading ry. ~4 outlined boxes. */
export function bird(g, x, y, z, ry, kind = 'myna', f = null) {
  const fx = Math.sin(ry), fz = Math.cos(ry);
  const P = {
    myna: ['#5A4030', '#2A2420', '#E8B53A', '#F2EDE2'],
    crow: ['#2C2B2E', '#1E1D20', '#3A3A3E', '#55555C'],
    pigeon: ['#8C8F99', '#6B6E78', '#B5643C', '#5E8F8A'],
  }[kind] || ['#5A4030', '#2A2420', '#E8B53A', '#F2EDE2'];
  const s = kind === 'crow' ? 1.25 : 1;
  // (body and head carry the ink line; beak, tail and breast are small enough to go without: f, half the triangles)
  const h = f || g;
  g.box(x, y + 0.06 * s, z, 0.09 * s, 0.09 * s, 0.17 * s, P[0], ry);
  g.box(x + fx * 0.1 * s, y + 0.12 * s, z + fz * 0.1 * s, 0.075 * s, 0.075 * s, 0.075 * s, P[1], ry);
  h.box(x + fx * 0.16 * s, y + 0.115 * s, z + fz * 0.16 * s, 0.025, 0.025, 0.05 * s, P[2], ry);
  h.box(x - fx * 0.13 * s, y + 0.05 * s, z - fz * 0.13 * s, 0.05 * s, 0.025, 0.12 * s, P[1], ry);
  if (kind !== 'crow') h.box(x + fx * 0.02, y + 0.03 * s, z + fz * 0.02, 0.095 * s, 0.03, 0.08 * s, P[3], ry);
}

/** Power pole (concrete, two tones, darker foot collar), crossarm with 3 insulators, a transformer can on some
 * (o.tx), a pasted handbill; three wires to local +X over o.span metres, sagging; o.birds mynas on the middle wire.
 * Top 5.8 m: only north of a street or in back lots. ~16 outlined boxes + 9 thin wire pieces. */
export const POLE_H = 5.42; // the wires' height at the insulators
export function pole(g, f, o = {}) {
  const u = unlined(g); // parts above the ground, without an ink line: in the solid, not the ground mesh
  const r = rng(o.seed || 7), span = o.span || 0, sag = o.sag ?? Math.min(0.55, span * 0.035);
  const conc = o.wood ? '#8A6A4A' : '#B9B3A6', concD = o.wood ? '#6E5238' : '#8F887B';
  f.flatR(0.1, 0.1, 0.55, 0.45, 0.0072, '#CFC6B2');
  // (outlined: the foot collar, the shaft, the crossarm, the can; the small parts go without an ink line: f)
  g.box(0, 0.25, 0, 0.24, 0.5, 0.24, concD);
  g.box(0, 2.85, 0, 0.17, 4.7, 0.17, conc);
  u.box(0, 4.0, 0, 0.175, 0.04, 0.175, shade(conc, 0.9)); // a joint band
  u.box(0, 5.38, 0, 0.2, 0.08, 0.2, concD); // cap
  // crossarm across the line (local Z), braces, three insulators
  g.box(0, 5.22, 0, 0.11, 0.11, 1.15, o.wood ? '#5E4330' : '#6F6A60');
  for (const sz of [-1, 1]) u.boxR(0, 4.98, sz * 0.24, 0.05, 0.5, 0.05, '#55524C', sz * 0.8, 0, 0);
  for (const sz of [-0.48, 0, 0.48]) u.box(0, 5.33, sz, 0.07, 0.1, 0.07, '#EDE6D6');
  // a transformer can on its bracket (every few poles), with two bushings
  if (o.tx) {
    u.box(-0.2, 4.15, 0, 0.12, 0.08, 0.3, '#55524C');
    g.box(-0.42, 4.05, 0, 0.36, 0.56, 0.36, '#7D8A86');
    u.box(-0.42, 4.36, 0, 0.4, 0.05, 0.4, '#626E6A');
    for (const sz of [-0.09, 0.09]) u.box(-0.42, 4.44, sz, 0.05, 0.12, 0.05, '#E9E2D2');
  }
  // a handbill pasted on the pole (cream, a red line), and a stencilled number band
  const side = r() < 0.5 ? 1 : -1;
  u.box(0, 1.55 + r() * 0.2, side * 0.095, 0.15, 0.2, 0.012, '#F3EEE1');
  u.box(0, 1.62, side * 0.1, 0.11, 0.025, 0.012, '#B8323A');
  u.box(0, 2.3, 0.093, 0.13, 0.05, 0.012, '#3A3632');
  if (span > 0.5) {
    for (const sz of [-0.48, 0, 0.48]) {
      for (let k = 0; k < 3; k++) {
        const ta = k / 3, tb = (k + 1) / 3;
        bar(u, ta * span, sagY(POLE_H, POLE_H, sag, ta), sz, tb * span, sagY(POLE_H, POLE_H, sag, tb - 1e-6), sz, 0.034, '#34302C');
      }
    }
    const n = o.birds || 0;
    for (let k = 0; k < n; k++) {
      const t = 0.3 + 0.12 * k + r() * 0.06;
      bird(g, t * span, sagY(POLE_H, POLE_H, sag, t) + 0.012, 0, (r() < 0.5 ? 0 : Math.PI) + (r() - 0.5) * 0.4, o.birdKind || 'myna', u);
    }
  }
}

/** A water tank on an angle-iron stand: four legs, X-braces, a plank deck, an eight-sided drum with a lid and a
 * band, a pipe down a leg to a tap, a bucket under it. 3.3 m: back lots only. ~22 outlined boxes. */
export function tankStand(g, f, o = {}) {
  const u = unlined(g); // parts above the ground, without an ink line: in the solid, not the ground mesh
  const r = rng(o.seed || 3), H = 2.1, iron = '#5C5F63';
  const drum = o.col || ['#2E3236', '#3E6FA8', '#7E8A90', '#2F5C56'][Math.floor(r() * 4)];
  f.flatR(0, 0, 1.5, 1.4, 0.0072, '#CFC6B2');
  for (const sx of [-0.45, 0.45]) for (const sz of [-0.45, 0.45]) g.box(sx, H / 2, sz, 0.07, H, 0.07, iron);
  const a = Math.atan2(H - 0.3, 0.9);
  for (const sz of [-0.45, 0.45]) u.boxR(0, H / 2, sz, 0.04, Math.hypot(0.9, H - 0.3), 0.03, iron, 0, 0, (sz > 0 ? 1 : -1) * (Math.PI / 2 - a));
  for (const sx of [-0.45, 0.45]) u.boxR(sx, H / 2, 0, 0.03, Math.hypot(0.9, H - 0.3), 0.04, iron, (sx > 0 ? 1 : -1) * (Math.PI / 2 - a), 0, 0);
  g.box(0, H + 0.04, 0, 1.05, 0.08, 1.05, '#8A6A4A');
  g.box(0, H + 0.55, 0, 0.82, 0.95, 0.82, drum);
  g.box(0, H + 0.55, 0, 0.82, 0.95, 0.82, drum, Math.PI / 4);
  u.box(0, H + 0.62, 0, 0.88, 0.06, 0.88, shade(drum, 0.8));
  u.box(0, H + 1.04, 0, 0.36, 0.06, 0.36, shade(drum, 1.2));
  u.box(0.32, H + 1.08, 0.1, 0.05, 0.12, 0.05, '#A9AFB2'); // the vent
  // the pipe down the front-right leg to a tap, a bucket below
  u.box(0.3, H - 0.05, 0.3, 0.05, 0.1, 0.05, '#9AA3A8');
  u.box(0.52, H / 2 + 0.35, 0.52, 0.05, H - 0.7, 0.05, '#9AA3A8');
  u.box(0.52, 0.66, 0.6, 0.06, 0.06, 0.16, '#C9A24A');
  g.box(0.52, 0.17, 0.66, 0.3, 0.32, 0.3, o.bucket || '#3F6F9E');
  u.box(0.52, 0.34, 0.66, 0.32, 0.03, 0.32, shade(o.bucket || '#3F6F9E', 0.8));
  f.flatR(0.55, 0.7, 0.5, 0.36, Y.rim, '#B9C3C4'); // a wet patch under the tap
}

/** Flat rain water (monsoon): 3-4 overlapping quads, pale rim, a sky glint. ~12 triangles, walk-through. */
export function puddle(f, o = {}) {
  const r = rng(o.seed || 5), W = o.w || 1.6, D = o.d || 0.9;
  const blobs = [];
  for (let k = 0; k < 3 + (r() < 0.5 ? 1 : 0); k++) blobs.push([(r() - 0.5) * W * 0.4, (r() - 0.5) * D * 0.35, W * (0.45 + r() * 0.35), D * (0.5 + r() * 0.35), (r() - 0.5) * 0.5]);
  for (const [x, z, w, d, ry] of blobs) f.flatR(x, z, w + 0.12, d + 0.1, Y.rim, o.rim || '#C9CFCB', ry);
  blobs.forEach(([x, z, w, d, ry], k) => f.flatR(x, z, w, d, Y.water, k % 2 ? (o.water || '#9EB1B9') : shade(o.water || '#9EB1B9', 1.05), ry));
  f.flatR(blobs[0][0] - W * 0.08, blobs[0][1] - D * 0.1, W * 0.32, 0.05, Y.glint, '#EEF3F2', 0.25);
  if (r() < 0.6) f.flatR(blobs[0][0] + W * 0.1, blobs[0][1] + D * 0.08, W * 0.16, 0.04, Y.glint, '#E2EBEC', 0.2);
}

/** Fallen leaves (flat): o.n leaves over o.w x o.d, palette o.pal (padauk yellow, rain-tree brown, green). */
export const LEAF = { padauk: ['#E2B33C', '#D9A23A', '#C98F2E', '#EAC65A'], rain: ['#9C7A4A', '#8DA65A', '#B08A52', '#7F9A50'], mixed: ['#E2B33C', '#9C7A4A', '#8DA65A', '#C98F2E'] };
export function leaves(f, o = {}) {
  const r = rng(o.seed || 9), W = o.w || 2.4, D = o.d || 1.6, n = o.n || 12, pal = LEAF[o.pal] || LEAF.mixed;
  for (let k = 0; k < n; k++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    f.flatR(Math.cos(a) * d * W / 2, Math.sin(a) * d * D / 2, 0.15, 0.08, Y.leaf + (k % 3) * 0.0002, pal[k % pal.length], r() * 3);
  }
}

/** Pavement wear along local X (o.len): seams every ~0.9 m, a zigzag hairline crack or two, a weed in a crack. */
export function kerbWear(g, f, o = {}) {
  const r = rng(o.seed || 11), L = o.len || 4, D = o.d || 0.9, seam = o.seam || '#BDB39D', YW = o.y || Y.wear;
  for (let x = -L / 2 + 0.4 + r() * 0.4; x < L / 2 - 0.2; x += 0.85 + r() * 0.2) f.flat(x - 0.012, -D / 2, x + 0.012, D / 2, YW, seam);
  for (let c = 0; c < 1 + (r() < 0.6 ? 1 : 0); c++) {
    let x = (r() - 0.5) * L * 0.7, z = (r() - 0.5) * D * 0.6;
    for (let k = 0; k < 4; k++) {
      const a = (r() - 0.5) * 1.6 + (k % 2 ? 0.5 : -0.5), l = 0.14 + r() * 0.12;
      f.flatR(x + Math.cos(a) * l / 2, z - Math.sin(a) * l / 2, l, 0.018, YW + 0.0002, shade(seam, 0.85), a);
      x += Math.cos(a) * l; z -= Math.sin(a) * l;
    }
    if (c === 0 && o.weed !== false) { g.box(x, 0.05, z, 0.05, 0.1, 0.03, '#7FA05A'); g.box(x + 0.03, 0.04, z + 0.02, 0.03, 0.08, 0.05, '#8FAE66', 0.6); }
  }
}

/** Litter of the book world (flat, with the odd tiny unoutlined box). */
export function scrap(g, f, kind, x, z, ry = 0, o = {}) {
  const u = unlined(g); // parts above the ground, without an ink line: in the solid, not the ground mesh
  const r = rng(o.seed || Math.round(x * 31 + z * 17));
  const P = (lx, lz) => [x + lx * Math.cos(ry) + lz * Math.sin(ry), z - lx * Math.sin(ry) + lz * Math.cos(ry)];
  const fl = (lx, lz, w, d, y, col, a = 0) => { const [px, pz] = P(lx, lz); f.flatR(px, pz, w, d, y, col, ry + a); };
  if (kind === 'sheet') {
    // a newspaper sheet blown open: cream page, grey columns, a black mast bar, one corner lifted by the wind
    const W = o.w || 0.62, D = o.d || 0.44;
    fl(0, 0, W, D, Y.paper, o.col || '#EEE9DC');
    fl(0, -D / 2 + 0.05, W - 0.08, 0.05, Y.print, '#3A3632');
    for (let c = 0; c < 3; c++) for (let l = 0; l < 4; l++) fl(-W / 2 + 0.1 + c * ((W - 0.12) / 3) + 0.06, -D / 2 + 0.14 + l * 0.07, (W - 0.2) / 3 - 0.04, 0.025, Y.print, '#B9B3A5');
    if (o.photo !== false) fl(W / 2 - 0.14, D / 2 - 0.1, 0.16, 0.1, Y.print, '#8F897C');
    if (o.lift) { const [px, pz] = P(W / 2 - 0.08, D / 2 - 0.06); u.boxR(px, 0.05, pz, 0.18, 0.006, 0.14, o.col || '#EEE9DC', 0.5, ry + 0.6, 0.35); }
  } else if (kind === 'ruled') {
    // a torn exercise-book corner: cream, blue rules, a red margin, a ragged tear (stepped)
    fl(0, 0, 0.3, 0.22, Y.paper, '#FAF6EA');
    for (let l = 0; l < 3; l++) fl(0.02, -0.06 + l * 0.06, 0.24, 0.012, Y.print, '#8FB0D6');
    fl(-0.09, 0, 0.012, 0.2, Y.print, '#D2555B');
    fl(0.15, 0.08, 0.06, 0.06, Y.paper, '#FAF6EA', 0.4);
  } else if (kind === 'blot') {
    // spilt printer's ink: five overlapping squares and two drops
    for (let k = 0; k < 5; k++) fl((r() - 0.5) * 0.3, (r() - 0.5) * 0.22, 0.14 + r() * 0.14, 0.12 + r() * 0.12, Y.wear + 0.0001 * k, k % 2 ? '#2E2A26' : '#3A3540', r());
    for (let k = 0; k < 2; k++) fl(0.25 + r() * 0.15, (r() - 0.5) * 0.3, 0.05, 0.05, Y.wear, '#2E2A26');
  } else if (kind === 'note') {
    // a note fallen from a board: cream square, a pin hole, a line of writing
    fl(0, 0, 0.18, 0.15, Y.paper, o.col || '#FBF3D8');
    fl(0, -0.04, 0.012, 0.012, Y.print, '#6B625A');
    fl(0, 0.02, 0.12, 0.012, Y.print, '#7A6A5A'); fl(-0.02, 0.05, 0.08, 0.012, Y.print, '#7A6A5A');
  } else if (kind === 'ball') {
    // a crumpled ball of paper: three jittered cubes
    const [px, pz] = P(0, 0);
    for (let k = 0; k < 3; k++) u.box(px + (r() - 0.5) * 0.05, 0.05 + k * 0.012, pz + (r() - 0.5) * 0.05, 0.08, 0.07, 0.08, k % 2 ? '#EEE9DC' : '#E2DCCC', r());
  }
}

/** A cat: o.pose 'sit' (watching, tail round its feet) or 'sleep' (curled). y = what it sits on. ~6 boxes. */
export function cat(g, x, y, z, ry = 0, o = {}) {
  const coat = o.coat || '#D98E48', dark = shade(coat, 0.82), fx = Math.sin(ry), fz = Math.cos(ry);
  const at = (lx, lz) => [x + lx * Math.cos(ry) + lz * fx, z - lx * Math.sin(ry) + lz * fz];
  if (o.pose === 'sleep') {
    let [px, pz] = at(0, 0); g.box(px, y + 0.09, pz, 0.34, 0.18, 0.26, coat, ry);
    [px, pz] = at(0.16, 0.1); g.box(px, y + 0.08, pz, 0.17, 0.15, 0.16, coat, ry);
    [px, pz] = at(0.16, 0.12); g.box(px, y + 0.17, pz, 0.05, 0.05, 0.04, dark, ry);
    [px, pz] = at(-0.05, 0.15); g.box(px, y + 0.04, pz, 0.36, 0.06, 0.07, dark, ry);
    [px, pz] = at(-0.02, -0.02); g.box(px, y + 0.185, pz, 0.24, 0.02, 0.1, shade(coat, 1.12), ry);
  } else {
    let [px, pz] = at(0, 0); g.box(px, y + 0.15, pz, 0.24, 0.3, 0.3, coat, ry);
    [px, pz] = at(0, 0.1); g.box(px, y + 0.36, pz, 0.21, 0.19, 0.19, coat, ry);
    for (const s of [-0.065, 0.065]) { [px, pz] = at(s, 0.1); g.box(px, y + 0.48, pz, 0.05, 0.07, 0.04, dark, ry); }
    [px, pz] = at(0, 0.2); g.box(px, y + 0.35, pz, 0.09, 0.05, 0.02, '#2E2A26', ry);
    [px, pz] = at(0.12, 0.02); g.box(px, y + 0.03, pz, 0.07, 0.06, 0.34, dark, ry);
  }
}

/** One flag of a string: two upright quads (a square and its tip), facing the string's +Z side (the street camera). */
function pennant(f, x, y, z, ry, c) {
  const ca = Math.cos(ry), sa = Math.sin(ry);
  const P = (u, v) => [f.tx + (x + u * ca) * f.tc + (z - u * sa) * f.ts, f.ty + y + v, f.tz - (x + u * ca) * f.ts + (z - u * sa) * f.tc];
  const nx = Math.sin(f.ry + ry), nz = Math.cos(f.ry + ry);
  f.quad(P(-0.1, -0.02), P(0.1, -0.02), P(0.1, -0.18), P(-0.1, -0.18), c, nx, 0, nz);
  f.quad(P(-0.05, -0.18), P(0.05, -0.18), P(0.02, -0.27), P(-0.02, -0.27), c, nx, 0, nz);
}
/** A string of small flags from local point a to b ([x, y, z]), sagging; o.cols cycles. Unoutlined (f). */
export function bunting(g, a, b, o = {}) {
  const u = unlined(g); // parts above the ground, without an ink line: in the solid, not the ground mesh
  const L = Math.hypot(b[0] - a[0], b[2] - a[2]), sag = o.sag ?? Math.min(0.5, L * 0.05), n = Math.max(3, Math.round(L / 0.42));
  const cols = o.cols || ['#E6E1D5', '#2E2A26', '#B8323A'];
  for (let k = 0; k < 3; k++) {
    const ta = k / 3, tb = (k + 1) / 3;
    bar(u, a[0] + (b[0] - a[0]) * ta, sagY(a[1], b[1], sag, ta), a[2] + (b[2] - a[2]) * ta, a[0] + (b[0] - a[0]) * tb, sagY(a[1], b[1], sag, tb - 1e-6), a[2] + (b[2] - a[2]) * tb, 0.02, o.line || '#5A4E40');
  }
  const ry = Math.atan2(-(b[2] - a[2]), b[0] - a[0]);
  for (let k = 1; k < n; k++) {
    const t = k / n, x = a[0] + (b[0] - a[0]) * t, z = a[2] + (b[2] - a[2]) * t, y = sagY(a[1], b[1], sag, t);
    const c = cols[k % cols.length];
    pennant(u, x, y, z, ry, c);
  }
}

// ---------------------------------------------------------------------------------
// The detail pass's clear-check (runs once when a town's file loads; nothing per frame)
// ---------------------------------------------------------------------------------
const TREE_R = { padauk: 0.5, rain: 0.55, lamp: 0.22, jars: 0.7, woodpile: 0.9, bikes: 0.6, flowers: 0.45, bench: 0.85, well: 1.0, tufts: 0.3, hens: 0.7, goat: 0.45 };
function itemShapes(it, KINDS) {
  const kd = KINDS[it.k];
  if (kd?.obstacles) { try { return kd.obstacles(it) || []; } catch { return []; } }
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const rb = (w, d) => { const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2; return [{ type: 'box', minX: it.x - hw, maxX: it.x + hw, minZ: it.z - hd, maxZ: it.z + hd }]; };
  if (it.w && it.d) return rb(it.w, it.d);
  if (it.len) return rb(it.len, 0.4);
  return [{ type: 'circle', x: it.x, z: it.z, r: kd?.r || TREE_R[it.k] || 0.6 }];
}
const segDist = (px, pz, ax, az, bx, bz) => {
  const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L2));
  return Math.hypot(px - ax - t * dx, pz - az - t * dz);
};
/** makeClear({ ITEMS, KINDS, DOORS, DESKS, PEOPLE, KEEP, ROAD_NODES, ROAD_EDGES, rect }) -> check(x, z, r, o) ->
 * null when clear, else the reason. o.flat: a ground decal (only off roads, keep-outs, doors and other items'
 * footprints); o.tall: taller than 1.3 m (never within 6 m south of a street); o.road: metres kept off a road's
 * edge (default 1.4). Every placed solid is claimed, so two details never overlap. */
/** put(check, add, placed, skipped)(item, r, o): lays `item` when its footprint is clear (o.half: also its two ends,
 * o.half metres along its local X, for a long thing such as a washing line). */
export function placer(check, add, placed, skipped) {
  return (it, r, o = {}) => {
    const pts = [[it.x, it.z]];
    if (o.half) { const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0); pts.push([it.x - o.half * c, it.z + o.half * s], [it.x + o.half * c, it.z - o.half * s]); }
    for (const [x, z] of pts) { const why = check(x, z, r, { ...o, probe: true }); if (why) { skipped.push([it.k, it.x, it.z, why]); return null; } }
    for (const [x, z] of pts) check(x, z, r, o);
    placed.push(it);
    return add(it);
  };
}
export function makeClear({ ITEMS, KINDS, DOORS = [], DESKS = [], PEOPLE = [], KEEP = [], ROAD_NODES = [], ROAD_EDGES = [], SPOTS = [], LOW = [], SKIP = [] }) {
  const skip = new Set(SKIP); // kinds the merge drops (region.js STILL_FOLK)
  const low = new Set(LOW); // ground decals far below this pass's layers (their y never meets ours)
  const N = new Map(ROAD_NODES.map((n) => [n.id, [n.x, n.z]]));
  const roads = [], paths = [];
  for (const e of ROAD_EDGES) {
    const a = N.get(e.a), b = N.get(e.b);
    if (!a || !b || e.style === 'deck') continue;
    const pts = e.pts || [a, b];
    (e.style === 'pencil' ? paths : roads).push(pts);
  }
  const shapes = [], flats = [];
  for (const it of ITEMS) {
    if (skip.has(it.k)) continue;
    const sh = itemShapes(it, KINDS);
    if (sh.length) shapes.push(...sh);
    else if (it.w && it.d && !low.has(it.k)) flats.push([it.x, it.z, Math.max(it.w, it.d) / 2]);
  }
  const spots = [...DOORS.map((d) => [d.x, d.z, 2.0]), ...DESKS.map((d) => [d.x, d.z, 2.0]), ...SPOTS.map((p) => [p[0], p[1], p[2] ?? 2.0]),
    ...PEOPLE.map((p) => [p.job?.spot?.x ?? p.x, p.job?.spot?.z ?? p.z, 1.3])];
  // a 1 m corridor from each door out to its kerb (3.2 m along the way it looks out)
  const halls = DOORS.map((d) => [d.x, d.z, d.x + Math.sin(d.facing || 0) * 3.2, d.z + Math.cos(d.facing || 0) * 3.2]);
  const lineDist = (x, z, list) => { let m = 1e9; for (const p of list) for (let k = 0; k + 1 < p.length; k++) m = Math.min(m, segDist(x, z, p[k][0], p[k][1], p[k + 1][0], p[k + 1][1])); return m; };
  const southOfStreet = (x, z) => { for (const p of roads) for (let k = 0; k + 1 < p.length; k++) { const [ax, az] = p[k], [bx, bz] = p[k + 1]; for (let t = 0; t <= 1; t += 0.05) { const rx = ax + (bx - ax) * t, rz = az + (bz - az) * t; if (rz < z && z - rz < 8.2 && Math.abs(rx - x) < 2.6) return true; } } return false; };
  const hit = (x, z, r, m = 0.08) => shapes.some((o) => (o.type === 'circle' ? Math.hypot(o.x - x, o.z - z) < o.r + r + m : x > o.minX - r - m && x < o.maxX + r + m && z > o.minZ - r - m && z < o.maxZ + r + m));
  return function check(x, z, r = 0.5, o = {}) {
    const rd = lineDist(x, z, roads);
    if (rd < 2.2 + (o.flat ? 0.15 : (o.road ?? 1.4)) + r) return 'road';
    if (lineDist(x, z, paths) < (o.flat ? 0.45 : 1.4) + r) return 'path';
    if (KEEP.some(([a, b, c, d]) => x > a - r && x < c + r && z > b - r && z < d + r)) return 'keep';
    if (spots.some(([sx, sz, m]) => Math.hypot(sx - x, sz - z) < m + r)) return 'spot';
    if (halls.some(([ax, az, bx, bz]) => segDist(x, z, ax, az, bx, bz) < 0.5 + r)) return 'door';
    if (o.tall && southOfStreet(x, z)) return 'south';
    if (o.on) return null; // drawn on/against an existing thing on purpose
    if (hit(x, z, r, o.flat ? 0.25 : 0.08)) return 'item';
    if (o.flat && flats.some(([fx, fz, fr]) => Math.hypot(fx - x, fz - z) < fr + r * 0.6)) return 'decal';
    if (o.probe) return null; // only asking
    if (!o.flat) shapes.push({ type: 'circle', x, z, r });
    else flats.push([x, z, r]);
    return null;
  };
}
