// The Blank Page's detail pass (district 7, art-plan 2026-11-16 section 11). The leaf stays the ONE-ROOF leaf
// (day13-spec 1): no second building, lamp-post or line of smoke, nothing on the way north to the back cover, and
// it stays mostly white. So only small things, round the lodge and the rest ground, and more pencil:
//   - pencil underdrawings west of the lodge of what is only planned: a well, a line of poles, a garden bed in the
//     next yard (ch 22: what nobody has tried yet is still pencil)
//   - travellers' sandals in a row by the tea cart and a rolled mat, a dog asleep in the cart's shade
//   - pots of basil and a towel on the lodge's verandah rails (drawn with the lodge's own anchor, so the cutaway
//     fades them with it)
//   - two puddles by the rain jars and a hoe leaning on the woven fence in the west plot
//   - a notebook left open on the path bench: a few pencil lines, the first one ticked (ch 23: a thank-you list,
//     name who taught you)
//   - a crow on the well's pulley beam; petals and leaves blown over the last hedge from the Garden
//   - on the east fence where it turns to pencil: a real bird on the last real post, a half-drawn pencil bird on
//     the first pencil one (ch 22)
// (The tea cart's and the well's lanterns already glow in the evening, and the yard already shows broom marks.)
// Registered by regions/blank.js: PROP gets DETAIL_PROP, ITEMS gets DETAIL_ITEMS. Merged into the chunk meshes,
// no new material, board, glow or smoke. Original art; imports kit.js and the shared street kit only.
import { rng, shade } from '../kit.js';
import * as SK from '../art/street-kit.js';

const C = {
  wood: '#B58A5A', woodD: '#7A5434', woodL: '#CDA577', iron: '#4A3B30', clay: '#B9653F', clayL: '#CF8156',
  leaf: '#6F9E5B', leafD: '#4F7F43', leafL: '#8DBA6E', cream: '#EDE6D3', paper: '#FBF6EA', maroon: '#6E1F2A',
  mustard: '#E2B33C', teal: '#2F7C7A', blue: '#3E5C8A', rose: '#E8A0A8', red: '#C8323C', white: '#FFFDF8',
  pencil: '#BEB9AE', pencilD: '#A39E92', faint: '#DCD7CB', faint2: '#E3DED3', mat: '#D9BE82', matD: '#B99A5E',
  bird: '#5A4636', birdD: '#2F2620', beak: '#E2B33C',
};
const HP = Math.PI / 2;
const none = () => [];

/** Faint pencil underdrawings (flat): it.kind 'well' (a ring and its frame, a bucket square) | 'poles' (three
 * crossed poles and the wires between) | 'bed' (a bed with its rows ticked off). */
function sketch(g, f, it) {
  const s = it.s || 1, y = 0.0042, t = 0.05;
  const line = (x0, z0, x1, z1, col = C.faint, w = t) => f.flatR((x0 + x1) / 2, (z0 + z1) / 2, w, Math.hypot(x1 - x0, z1 - z0), y, col, Math.atan2(x1 - x0, z1 - z0));
  if (it.kind === 'well') {
    const R = 0.75 * s;
    for (let k = 0; k < 12; k++) { const a0 = (k / 12) * Math.PI * 2, a1 = ((k + 1) / 12) * Math.PI * 2; line(Math.cos(a0) * R, Math.sin(a0) * R, Math.cos(a1) * R * (k === 11 ? 0.92 : 1), Math.sin(a1) * R); }
    line(-1.1 * s, -0.15, -1.1 * s, 0.15); line(1.1 * s, -0.15, 1.1 * s, 0.15); line(-1.3 * s, 0, 1.3 * s, 0, C.faint2, 0.03);
    line(0.9 * s, 1.0 * s, 1.3 * s, 1.0 * s); line(1.3 * s, 1.0 * s, 1.3 * s, 1.4 * s); line(1.3 * s, 1.4 * s, 0.9 * s, 1.4 * s); line(0.9 * s, 1.4 * s, 0.9 * s, 1.0 * s);
  } else if (it.kind === 'poles') {
    for (let k = 0; k < 3; k++) { const x = (k - 1) * 5 * s; line(x - 0.35, 0, x + 0.35, 0); line(x, -0.35, x, 0.35); f.flatR(x, 0, 0.16, 0.16, y + 0.0004, C.pencil, 0.78); }
    for (const dz of [-0.18, 0, 0.18]) line(-5 * s, dz, 5 * s, dz, C.faint2, 0.025);
  } else {
    const Wd = 3 * s, D = 1.4 * s;
    line(-Wd / 2, -D / 2, Wd / 2, -D / 2); line(-Wd / 2, D / 2, Wd / 2, D / 2); line(-Wd / 2, -D / 2, -Wd / 2, D / 2); line(Wd / 2, -D / 2, Wd / 2, D / 2);
    for (let k = 1; k < 4; k++) line(-Wd / 2 + 0.2, -D / 2 + (k * D) / 4, Wd / 2 - 0.2, -D / 2 + (k * D) / 4, C.faint2, 0.03);
    for (let k = 0; k < 4; k++) { const x = -Wd / 2 + 0.35 + k * 0.75; line(x - 0.08, D / 2 + 0.25, x, D / 2 + 0.16, C.pencil, 0.03); line(x, D / 2 + 0.16, x + 0.16, D / 2 + 0.36, C.pencil, 0.03); }
  }
  void g;
}
/** Travellers' sandals in a row (shoes off at the tea cart's mat) and a rolled sleeping mat. */
function shoes(g, f) {
  const cols = [C.blue, C.maroon, '#2F2A26', C.teal];
  for (let k = 0; k < 4; k++) for (const s of [-0.065, 0.065]) {
    const x = -0.6 + k * 0.4 + s;
    g.box(x, 0.0125, 0, 0.1, 0.025, 0.25, cols[k], (k % 2 ? 0.1 : -0.08));
    f.box(x, 0.032, 0.03, 0.08, 0.015, 0.02, shade(cols[k], 0.7), (k % 2 ? 0.1 : -0.08));
  }
  g.box(1.05, 0.11, -0.05, 0.9, 0.22, 0.22, C.mat);
  f.box(1.05, 0.11, -0.05, 0.06, 0.23, 0.23, C.matD); f.box(0.75, 0.11, -0.05, 0.04, 0.23, 0.23, C.red); f.box(1.35, 0.11, -0.05, 0.04, 0.23, 0.23, C.red);
  f.flat(-0.85, -0.25, 1.55, 0.25, 0.0048, '#E6DDCB');
}
/** On the lodge's verandah rails (the lodge's own anchor and size): clay pots of basil, a towel over the east rail. */
function railPots(g, f) {
  const FL = 0.45, VZ = 2.0, Y = FL + 0.74, Z = VZ - 0.1;
  for (const x of [-4.5, -3.92, -3.34, 3.3, 4.5]) {
    g.box(x, Y + 0.065, Z, 0.15, 0.13, 0.15, C.clay);
    f.box(x, Y + 0.135, Z, 0.17, 0.025, 0.17, C.clayL);
    g.box(x, Y + 0.2, Z, 0.17, 0.11, 0.13, C.leaf);
    f.box(x + 0.02, Y + 0.28, Z, 0.09, 0.06, 0.09, C.leafL);
  }
  // a towel hung over the east rail to dry (over the top, down the front)
  g.box(3.9, Y + 0.012, Z, 0.36, 0.025, 0.14, C.teal);
  g.box(3.9, Y - 0.2, Z + 0.075, 0.36, 0.42, 0.025, C.teal);
  f.box(3.9, Y - 0.32, Z + 0.09, 0.36, 0.05, 0.01, C.white);
}
/** A hoe leaning on the woven fence (the fence is local -x of it): the handle's top on the rail, the blade down. */
function hoe(g, f) {
  const th = 0.5, L = 1.3, fx = 0.55, dx = -Math.sin(th), dy = Math.cos(th);
  g.boxR(fx + (dx * L) / 2, (dy * L) / 2, 0, 0.045, L, 0.045, C.woodL, 0, 0, th);
  g.box(fx + 0.06, 0.04, 0, 0.14, 0.05, 0.22, C.iron);
  f.flatR(0.3, 0, 0.7, 0.3, 0.0046, '#E2D9C6', 0);
}
/** A notebook left open on the path bench (the bench's anchor and turn): pencil lines on the right page, the
 * first ticked, a pencil across the fold. */
function notebook(g, f) {
  const x = -0.68, y = 0.455, z = 0.02; // (at the bench's end: whoever sits in the middle stays clear of it)
  f.box(x, y + 0.004, z, 0.33, 0.008, 0.23, C.maroon);
  f.box(x - 0.078, y + 0.012, z, 0.15, 0.008, 0.21, C.paper);
  f.box(x + 0.078, y + 0.012, z, 0.15, 0.008, 0.21, C.paper);
  for (let k = 0; k < 5; k++) f.box(x + 0.085, y + 0.0175, z - 0.075 + k * 0.038, 0.1 - (k % 3) * 0.02, 0.003, 0.009, C.pencilD);
  f.box(x + 0.02, y + 0.018, z - 0.078, 0.03, 0.003, 0.01, C.red, 0.7); f.box(x + 0.04, y + 0.018, z - 0.082, 0.05, 0.003, 0.01, C.red, -0.6);
  g.box(x - 0.01, y + 0.03, z + 0.02, 0.025, 0.025, 0.26, C.mustard, 0.15);
  void g;
}
/** Petals and leaves blown over the last hedge from the Garden, lying on the white (flat). it: { len } */
function petals(g, f, it) {
  const L = it.len || 14, r = rng(it.seed || 7), cols = [C.rose, C.rose, C.mustard, C.white, C.leafL, '#C9A24A'];
  for (let k = 0; k < 26; k++) {
    const x = (r() - 0.5) * L, z = (r() - 0.5) * 0.9 * (1 - Math.abs(x) / L);
    f.flatR(x, z, 0.08 + r() * 0.06, 0.05 + r() * 0.04, 0.0052 + (k % 3) * 0.0002, cols[k % cols.length], r() * 3);
  }
  void g;
}
/** A blocky myna (body, head, beak, tail) at local (x, y, z), turned a. */
function bird(g, f, x, y, z, a = 0) {
  g.box(x, y + 0.06, z, 0.16, 0.1, 0.09, C.bird, a);
  g.box(x + 0.08 * Math.cos(a), y + 0.13, z - 0.08 * Math.sin(a), 0.08, 0.08, 0.08, C.birdD, a);
  f.box(x + 0.14 * Math.cos(a), y + 0.125, z - 0.14 * Math.sin(a), 0.05, 0.025, 0.025, C.beak, a);
  f.box(x - 0.11 * Math.cos(a), y + 0.07, z + 0.11 * Math.sin(a), 0.08, 0.025, 0.06, C.birdD, a);
}
/** On the east fence where it turns to pencil: a real bird on the last real post, a half-drawn one on the first
 * pencil post (only its back and head, in pencil lines; ch 22). Along local z (the fence runs north-south). */
function postBirds(g, f) {
  bird(g, f, 0, 1.14, 0.6, HP);
  // the drawn one: a few thin pencil strokes, no ink outline, the lower half not drawn yet
  const P = C.pencilD, y = 1.1, z = -0.6;
  f.box(0, y + 0.11, z, 0.012, 0.012, 0.16, P);
  f.box(0, y + 0.06, z + 0.08, 0.012, 0.1, 0.012, P);
  f.box(0, y + 0.18, z - 0.08, 0.012, 0.08, 0.012, P);
  f.box(0, y + 0.22, z - 0.12, 0.012, 0.012, 0.08, P);
  f.box(0, y + 0.18, z - 0.16, 0.012, 0.012, 0.05, P);
  f.box(0, y + 0.08, z + 0.15, 0.012, 0.012, 0.09, C.pencil);
}

export const DETAIL_PROP = {
  ...SK.kitProps('bx', ['puddle', 'perch']),
  bxSketch: { draw: sketch, obstacles: none },
  bxShoes: { draw: shoes, obstacles: none },
  bxRailPots: { draw: railPots, cut: true, obstacles: none },
  bxHoe: { draw: hoe, obstacles: none },
  bxNotebook: { draw: notebook, obstacles: none },
  bxPetals: { draw: petals, obstacles: none },
  bxPostBirds: { draw: postBirds, obstacles: none },
};

/** Where they go (world metres; the host's anchor where a thing belongs to it). */
export const DETAIL_ITEMS = [
  // B1 pencil underdrawings west of the lodge (flat, no keep-out): a well, a line of poles, a bed in the next yard
  { k: 'bxSketch', x: 107.6, z: 13.6, kind: 'well', s: 1 },
  { k: 'bxSketch', x: 104.0, z: -20.0, kind: 'poles', s: 1 },
  { k: 'bxSketch', x: 109.6, z: -8.2, kind: 'bed', s: 1 },
  // B2 the rest ground: sandals and a mat by the tea cart, a dog asleep in its shade
  { k: 'bxShoes', x: 131.3, z: 10.1, ry: 0.5 },
  { k: 'bxPerch', x: 134.9, z: 6.6, ry: -0.4, kind: 'dog', seed: 13 },
  // B3 the lodge's rails (the lodge's anchor: 131, -9.15)
  { k: 'bxRailPots', x: 131, z: -9.15 },
  // B4 puddles by the rain jars, a hoe on the west fence
  { k: 'bxPuddle', x: 118.95, z: -10.35, ry: 0.1, w: 0.9, d: 0.5, seed: 4 },
  { k: 'bxPuddle', x: 120.2, z: -14.0, ry: -0.05, w: 1.0, d: 0.4, seed: 9 },
  { k: 'bxHoe', x: 117.3, z: -7.6, ry: 0 },
  // B5 the notebook on the path bench (the bench's anchor and turn)
  { k: 'bxNotebook', x: 141.9, z: 4.2, ry: -HP },
  // B6 a crow on the well's pulley beam (the beam's top: 2.0 m)
  { k: 'bxPerch', x: 127.55, z: 5.0, ry: 0.5, kind: 'crow', y: 2.0, seed: 6 },
  // B7 petals over the last hedge (z 17.4), west of the sign
  { k: 'bxPetals', x: 127.6, z: 16.35, len: 13, seed: 17 },
  // B9 the east fence's last real post and first pencil one (x 145.3; posts at z 8.3 and 7.1)
  { k: 'bxPostBirds', x: 145.3, z: 7.7, ry: 0 },
];
