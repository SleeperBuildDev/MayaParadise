// Hearth Row, the detail pass (art-plan 2026-11-16, section 9): small things that make the Row read lived-in,
// laid LAST through the same clear-check every detail obeys: off the roads, clear of the doors (and a corridor to
// their kerbs), the desks, the day scripts' places (SPOTS) and the townsfolk's spots, never on another item,
// nothing taller than 1.3 m within 6 m south of a street. Called once from the end of regions/hearth.js:
// `detail({ ITEMS, add, PROP, ART, ... })`.
// Everything merges into the chunk meshes (outlined solids or ground decals), no new material. One canvas board
// (the kerb board by the tea side of the east end: the only new draw call, where the view is at 55). Lamp cores:
// 3 tin lamps outside Daw Nyein's shop, 2 bulbs at the noodle stalls. Steam: the cooling bread, one noodle pot.
// Lessons, said without pointing anywhere: ch 15 (a stool and a cup set apart: someone eats alone), ch 18 (a
// quarrel is said to the person, quietly: a note folded and tucked away, not pinned up; two noodle stalls side
// by side, each its own way), ch 21 (ask before you open someone's things: sketchbooks under a cloth and a
// pebble), gratitude (the board: don't forget to say thank you).
//
// PROP (prefix hd):
//   hdPole { span, birds, tx, seed, ry }   power pole + wires to local +X
//   hdPuddle { w, d, seed }  hdLeaves { w, d, n, pal, seed }  hdWear { len, d, seed, y }   (ground only)
//   hdCooling { seed }        a tray rack of loaves cooling on a stand, steam over it, a cat watching from a crate
//   hdNotes { seed }          notes fallen at the Note Wall's foot, one folded and tucked into a crack (same x, z)
//   hdSketch { seed }         a low rack of sketchbooks under a cloth with a pebble on top
//   hdNoodle { style, seed }  a noodle stall ('wide' pot, red / 'tall' steamer, green): two side by side
//   hdKiteWork { seed }       a kite frame being glued on a trestle, a glue pot, a reel of line
//   hdTinLamps { w, d }       three tin lamps on an iron bracket outside the lamp shop (same x, z, ry as the shop)
//   hdLone { seed }           one stool, one tin cup, set apart
//   hdYard { kind, seed }     a front-yard bit: 'lime' (a pot of lime wash and brush), 'mat' (a rolled mat), 'basin'
//   hdBirds { n, y, seed }    pigeons along a wall top (local X)
//   hdHop { seed }            by the hopscotch: a lost slipper, a chalk heart, a ball of jute string (flat + 3 boxes)
// Wrapped kind: hHouse { tank } (hearth.js's house, plus a small water tank on the back slope of a 'two' roof).
import { rng, shade } from '../kit.js';
import { C } from '../art/hearth.js';
import { pole, puddle, leaves, kerbWear, scrap, cat, bird, makeClear, placer, unlined, Y } from './jh-kit.js';
import { HEARTH as WORDS } from './detail-strings.js';

const rb = (it, w, d, ox = 0, oz = 0) => {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const cx = it.x + ox * c + oz * s, cz = it.z - ox * s + oz * c;
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return [{ type: 'box', minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd }];
};
const circ = (r) => (it) => [{ type: 'circle', x: it.x, z: it.z, r }];
const none = () => [];
const W2 = (g, x, z) => [g.tx + x * g.tc + z * g.ts, g.tz - x * g.ts + z * g.tc];
function stool(g, f, x, z, col, h = 0.3) {
  const u = unlined(g); // parts above the ground, without an ink line: in the solid, not the ground mesh
  g.box(x, h - 0.03, z, 0.3, 0.06, 0.3, col);
  for (const sx of [-0.11, 0.11]) for (const sz of [-0.11, 0.11]) u.box(x + sx, (h - 0.06) / 2, z + sz, 0.04, h - 0.06, 0.04, shade(col, 0.75));
}

function hdCooling(g, f, it, ctx) {
  const u = unlined(g); // parts above the ground, without an ink line: in the solid, not the ground mesh
  // a trestle of two trays of loaves cooling (local X along the wall), a cloth half over them; a cat on a crate
  f.flatR(0, 0, 1.6, 0.8, 0.0072, C.shadow);
  for (const sx of [-0.6, 0.6]) g.box(sx, 0.35, 0, 0.05, 0.7, 0.44, C.woodD);
  g.box(0, 0.72, 0, 1.4, 0.04, 0.52, C.woodL);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) {
    g.box(-0.52 + i * 0.26, 0.8, -0.11 + j * 0.22, 0.22, 0.12, 0.18, (i + j) % 3 ? C.crust : C.crustL);
    u.box(-0.52 + i * 0.26, 0.865, -0.11 + j * 0.22, 0.14, 0.02, 0.1, C.crustD);
  }
  u.boxR(0.5, 0.79, 0.02, 0.5, 0.03, 0.56, '#F1E3C2', 0, 0, 0.12);
  // the cat on an upturned crate beside it, watching the loaves (and not touching them)
  g.box(0.97, 0.2, 0.05, 0.4, 0.4, 0.4, C.woodL);
  u.box(0.97, 0.08, 0.26, 0.42, 0.06, 0.02, C.woodD);
  u.box(0.97, 0.3, 0.26, 0.42, 0.06, 0.02, C.woodD);
  cat(g, 0.97, 0.4, 0.05, -Math.PI / 2 + 0.25, { coat: '#3A3532' });
  const [wx, wz] = W2(g, -0.1, 0);
  ctx.smoke.push(wx, 1.1, wz);
}

function hdNotes(g, f, it) {
  // at the wall's foot (local z 0.35 .. 0.75; wall face at local z ~0.05), the sunny east half: three fallen notes
  const r = rng(it.seed || 18), L = it.w || 7.2, PX = L / 2 - 0.15;
  for (const [x, z, a, col] of [[1.2, 0.5, 0.4, '#FBF3D8'], [1.75, 0.66, -0.7, '#F4E6E0'], [0.55, 0.62, 1.2, '#E9F0D8']]) scrap(g, f, 'note', x, z, a, { col, seed: Math.round(x * 100) });
  // one note folded small and tucked into the crack between two planks, low down (sent to one person, quietly)
  const x = PX - 0.95 - 0.15 * r();
  g.boxR(x, 0.47, 0.035, 0.09, 0.05, 0.02, '#FBF3D8', 0, 0, 0.15);
  g.box(x + 0.01, 0.48, 0.047, 0.05, 0.01, 0.004, '#C8323C'); // a small red mark on the fold
}

function hdSketch(g, f, it) {
  const u = unlined(g); // parts above the ground, without an ink line: in the solid, not the ground mesh
  // a low wooden rack of sketchbooks, a cloth thrown over them and a pebble on top: someone's, not ours to open
  const r = rng(it.seed || 21);
  f.flatR(0, 0, 1.2, 0.7, 0.0072, C.shadow);
  for (const sx of [-0.42, 0.42]) g.box(sx, 0.25, 0, 0.06, 0.5, 0.36, C.woodD);
  g.box(0, 0.12, 0, 0.9, 0.04, 0.36, C.woodL);
  g.box(0, 0.5, 0, 0.96, 0.04, 0.4, C.woodL);
  for (let k = 0; k < 6; k++) u.box(-0.33 + k * 0.13, 0.24, 0, 0.1, 0.2 + r() * 0.04, 0.28, [C.blue, C.red, C.green, C.mustard, C.teal, C.maroon][k]);
  // the cloth: a draped slab over the top, folds hanging at the front and the ends, a grey pebble on it
  g.box(0, 0.54, 0, 1.0, 0.03, 0.44, '#E8D9B8');
  g.box(0, 0.44, 0.215, 1.0, 0.2, 0.02, '#E8D9B8');
  for (const sx of [-0.49, 0.49]) u.box(sx, 0.46, 0, 0.02, 0.16, 0.44, '#DCCBA6');
  g.box(0.12, 0.6, 0.02, 0.14, 0.08, 0.11, C.stone, 0.4);
  u.box(0.13, 0.65, 0.02, 0.08, 0.03, 0.07, C.stoneL, 0.4);
}

function hdNoodle(g, f, it, ctx) {
  const u = unlined(g); // parts above the ground, without an ink line: in the solid, not the ground mesh
  // a little noodle stall; two stand side by side, each its own: it.style 'wide' (red awning, a wide pot, blue
  // stools) or 'tall' (green awning, a tall bamboo steamer, mustard stools). Low (awning at 1.25 m).
  {
    const tall = it.style === 'tall', sx = 0, seed = tall ? 2 : 1, pot = tall ? 'tall' : 'wide';
    const awn = tall ? C.green : C.red, awnD = tall ? C.greenD : C.redD;
    const r = rng((it.seed || 5) + seed);
    f.flatR(sx, 0, 1.7, 1.1, 0.0072, C.shadow);
    g.box(sx, 0.36, -0.15, 1.2, 0.06, 0.5, C.woodL); // the cart's board
    for (const ox of [-0.55, 0.55]) for (const oz of [-0.35, 0.05]) u.box(sx + ox, 0.18, oz, 0.05, 0.36, 0.05, C.woodD);
    u.box(sx, 0.25, -0.15, 1.1, 0.04, 0.44, C.wood);
    for (const ox of [-0.55, 0.55]) g.box(sx + ox, 0.82, -0.4, 0.04, 0.92, 0.04, C.woodD); // awning posts
    g.boxR(sx, 1.27, -0.12, 1.3, 0.04, 0.72, awn, 0.22, 0, 0);
    for (let k = 0; k < 5; k++) u.box(sx - 0.52 + k * 0.26, 1.17, 0.24, 0.13, 0.08, 0.02, k % 2 ? C.cream : awnD);
    // the pot on its brazier
    g.box(sx + 0.3, 0.45, -0.18, 0.3, 0.12, 0.3, C.soot);
    if (pot === 'wide') { g.box(sx + 0.3, 0.6, -0.18, 0.36, 0.2, 0.36, C.tin); g.box(sx + 0.3, 0.6, -0.18, 0.36, 0.2, 0.36, C.tin, Math.PI / 4); g.box(sx + 0.3, 0.71, -0.18, 0.28, 0.02, 0.28, '#E8DCC0'); }
    else { for (let k = 0; k < 3; k++) g.box(sx + 0.3, 0.58 + k * 0.13, -0.18, 0.3 - k * 0.02, 0.12, 0.3 - k * 0.02, k % 2 ? C.bamboo : C.bambooD); g.box(sx + 0.3, 0.97, -0.18, 0.2, 0.04, 0.2, C.bambooD); }
    // bowls, a jar of chilli, chopsticks in a cup
    for (let k = 0; k < 3; k++) u.box(sx - 0.42 + k * 0.17, 0.43, -0.05, 0.13, 0.07, 0.13, k % 2 ? C.white : '#9CC3DE');
    u.box(sx - 0.1, 0.45, -0.28, 0.08, 0.12, 0.08, C.red);
    u.box(sx - 0.25, 0.46, -0.3, 0.07, 0.12, 0.07, C.woodL);
    // stools on the customers' side, each stall its own colour
    stool(g, f, sx - 0.35, 0.42, seed === 1 ? C.blue : C.mustard, 0.28);
    stool(g, f, sx + 0.35, 0.46, seed === 1 ? C.blue : C.mustard, 0.28);
    if (r() < 0.5) u.box(sx + 0.35, 0.3, 0.46, 0.12, 0.05, 0.12, C.white);
    // a bulb under each awning (lit in the evening)
    u.box(sx, 1.12, -0.1, 0.08, 0.1, 0.08, C.lit);
    const [wx, wz] = W2(g, sx, -0.1);
    ctx.glows.push(wx, 1.1, wz);
    if (pot === 'tall') { const [px, pz] = W2(g, sx + 0.3, -0.18); ctx.smoke.push(px, 1.1, pz); }
  }
}

function hdKiteWork(g, f, it) {
  const u = unlined(g); // parts above the ground, without an ink line: in the solid, not the ground mesh
  // a trestle with a bamboo kite frame being papered (half done), a glue pot and brush, a reel of line on the ground
  f.flatR(0, 0, 1.6, 1.0, 0.0072, C.shadow);
  for (const sx of [-0.5, 0.5]) { g.boxR(sx, 0.25, -0.15, 0.05, 0.52, 0.05, C.woodD, 0.25, 0, 0); g.boxR(sx, 0.25, 0.15, 0.05, 0.52, 0.05, C.woodD, -0.25, 0, 0); }
  g.box(0, 0.5, 0, 1.3, 0.04, 0.5, C.woodL);
  // the frame: a diamond of bamboo laid flat, a cross brace, paper glued over half
  for (const [a, x, z] of [[0.6, -0.17, -0.11], [-0.6, 0.17, -0.11], [-0.6, -0.17, 0.11], [0.6, 0.17, 0.11]]) u.box(x, 0.535, z, 0.42, 0.02, 0.02, C.bamboo, a);
  u.box(0, 0.54, 0, 0.66, 0.02, 0.02, C.bambooD);
  u.box(0, 0.54, 0, 0.02, 0.02, 0.44, C.bambooD);
  u.box(-0.13, 0.528, 0, 0.26, 0.006, 0.3, C.red, 0);
  u.box(-0.19, 0.53, 0.0, 0.12, 0.006, 0.18, C.mustard, 0);
  g.box(0.45, 0.58, 0.12, 0.1, 0.1, 0.1, C.white);
  g.boxR(0.45, 0.66, 0.12, 0.02, 0.18, 0.02, C.woodL, 0.3, 0, 0.2);
  // the reel of line and a spare tail of paper ribbons
  g.box(0.75, 0.1, 0.45, 0.2, 0.2, 0.08, C.woodD);
  g.box(0.75, 0.1, 0.45, 0.14, 0.14, 0.1, '#F4ECDC');
  f.flatR(0.4, 0.5, 0.5, 0.05, Y.leaf, C.red, 0.3);
  f.flatR(0.45, 0.58, 0.4, 0.05, Y.leaf, C.mustard, 0.2);
}

function hdTinLamps(g, f, it, ctx) {
  const u = unlined(g); // parts above the ground, without an ink line: in the solid, not the ground mesh
  // an iron bracket off the shop front's far corner (local +X end, clear of the door) with three tin lamps on a bar
  const W = it.w || 6, FZ = (it.d || 5) / 2, x0 = W / 2 - 0.25;
  g.box(x0, 2.55, FZ + 0.42, 0.06, 0.06, 0.84, C.iron);
  g.boxR(x0, 2.32, FZ + 0.2, 0.04, 0.5, 0.04, C.iron, 0.8, 0, 0);
  g.box(x0, 2.55, FZ + 0.84, 0.06, 0.06, 0.06, C.iron);
  g.box(x0 - 0.42, 2.53, FZ + 0.62, 0.9, 0.03, 0.03, C.iron);
  for (const [dx, h] of [[-0.8, 0.28], [-0.42, 0.42], [-0.04, 0.32]]) {
    const x = x0 + dx, y = 2.5 - h;
    u.box(x, 2.5 - h / 2 + 0.06, FZ + 0.62, 0.015, h - 0.12, 0.015, C.ink);
    g.box(x, y, FZ + 0.62, 0.2, 0.24, 0.2, C.tinL);
    u.box(x, y + 0.14, FZ + 0.62, 0.14, 0.06, 0.14, C.tinD);
    u.box(x, y, FZ + 0.725, 0.12, 0.15, 0.012, C.lit);
    const [wx, wz] = W2(g, x, FZ + 0.62);
    ctx.glows.push(wx, y, wz);
  }
}

function hdLone(g, f, it) {
  // one low stool and a tin cup on the ground beside it, a little apart from everyone
  stool(g, f, 0, 0, C.woodL, 0.26);
  g.box(0.28, 0.05, 0.08, 0.08, 0.1, 0.08, C.tinL);
  g.box(0.28, 0.095, 0.08, 0.06, 0.01, 0.06, C.woodD);
  f.flatR(0.08, 0.04, 0.7, 0.55, 0.0072, C.shadow);
}

function hdYard(g, f, it) {
  const r = rng(it.seed || 3);
  if (it.kind === 'lime') {
    // a clay pot of lime wash with a long brush across it, white drips on the ground
    g.box(0, 0.16, 0, 0.32, 0.32, 0.32, C.terra); g.box(0, 0.16, 0, 0.32, 0.32, 0.32, C.terra, Math.PI / 4);
    g.box(0, 0.31, 0, 0.26, 0.02, 0.26, '#F7F3EA');
    g.boxR(0.05, 0.36, 0, 0.62, 0.03, 0.04, C.woodL, 0, 0.5, 0.1);
    for (let k = 0; k < 3; k++) f.flatR(0.3 + r() * 0.2, (r() - 0.5) * 0.3, 0.07, 0.06, Y.leaf, '#F7F3EA', r());
  } else if (it.kind === 'mat') {
    // a rolled sleeping mat leaning on a low stool
    stool(g, f, 0, 0, C.woodD, 0.3);
    g.boxR(0.05, 0.33, 0, 0.9, 0.14, 0.14, '#D8B86A', 0, 0.2, 0.08);
    g.boxR(0.05, 0.33, 0, 0.9, 0.14, 0.14, '#C9A85A', Math.PI / 4, 0.2, 0.08);
    for (const t of [-0.3, 0.3]) g.boxR(0.05 + t, 0.33, t * 0.2, 0.03, 0.16, 0.16, C.red, 0, 0.2, 0);
  } else {
    // a basin on a stand with a folded towel, a cup on the rim
    for (const sx of [-0.18, 0.18]) for (const sz of [-0.18, 0.18]) g.box(sx, 0.3, sz, 0.04, 0.6, 0.04, C.woodD);
    g.box(0, 0.62, 0, 0.5, 0.05, 0.5, C.woodL);
    g.box(0, 0.7, 0, 0.44, 0.1, 0.44, C.tinL);
    g.box(0, 0.75, 0, 0.36, 0.01, 0.36, '#BFD3E0');
    g.box(0.24, 0.5, 0, 0.04, 0.24, 0.3, r() < 0.5 ? '#9CC3DE' : '#E8A0A8');
  }
  f.flatR(0, 0, 0.8, 0.6, 0.0072, C.shadow);
}

function hdBirds(g, f, it) {
  const u = unlined(g); // parts above the ground, without an ink line: in the solid, not the ground mesh
  const r = rng(it.seed || 6), n = it.n || 3, L = it.len || 2;
  for (let k = 0; k < n; k++) bird(g, 0, it.y || 1.0, -L / 2 + (k + 0.5) * (L / n) + (r() - 0.5) * 0.2, (r() - 0.5) * 1.2 + (r() < 0.5 ? 0 : Math.PI), 'pigeon', u);
}

function hdHop(g, f, it) {
  // a slipper left behind (one), a chalk heart, a ball of jute string by the hopscotch
  g.box(0, 0.025, 0, 0.12, 0.03, 0.27, C.blue, 0.4);
  g.box(0.01, 0.045, 0.02, 0.1, 0.012, 0.03, C.red, 0.4);
  const S = 0.06, y = Y.print;
  for (const [x0, z0, x1, z1] of [[-2, -1, -1, 0], [1, -1, 2, 0], [-3, -2, -1, -1], [1, -2, 3, -1], [-3, -1, 3, 0], [-2, 0, 2, 1], [-1, 1, 1, 2], [0 - 0.5, 2, 0.5, 2.6]]) f.flat(0.7 + x0 * S, 0.1 + z0 * S, 0.7 + x1 * S, 0.1 + z1 * S, y, '#F4EFE4');
  g.box(-0.5, 0.07, 0.35, 0.14, 0.14, 0.14, '#C9AE7E');
  g.box(-0.5, 0.07, 0.35, 0.15, 0.04, 0.15, '#A88C5E', 0.5);
  f.flatR(-0.25, 0.4, 0.4, 0.015, Y.print, '#C9AE7E', 0.3);
}

/** A small water tank on the back slope of a 'two' house's tin roof: legs down to the slope, a plank stand, a drum. */
function roofTank(g, it) {
  const W = it.w, D = it.d, H2 = 5.3, rise = 1.3, half = D / 2;
  const roofY = (z) => H2 + rise * (1 - Math.abs(z) / half) + 0.09;
  const x = -W / 2 + 1.25, zc = -D / 4 - 0.1, top = roofY(zc - 0.32) + 0.3;
  for (const sx of [-0.3, 0.3]) for (const sz of [-0.32, 0.32]) { const y0 = roofY(zc + sz) - 0.02; g.box(x + sx, (y0 + top) / 2, zc + sz, 0.06, top - y0, 0.06, '#5C5F63'); }
  g.box(x, top + 0.03, zc, 0.78, 0.06, 0.8, '#8A6A4A');
  const col = (it.seed || 0) % 2 ? '#2E3236' : '#3E6FA8';
  g.box(x, top + 0.4, zc, 0.62, 0.7, 0.62, col);
  g.box(x, top + 0.4, zc, 0.62, 0.7, 0.62, col, Math.PI / 4);
  g.box(x, top + 0.77, zc, 0.3, 0.05, 0.3, shade(col, 1.2));
  g.box(x + 0.3, top - 0.1, zc + 0.3, 0.04, 0.3, 0.04, '#9AA3A8');
}

export const PROP = {
  hdPole: { draw: (g, f, it) => pole(g, f, it), obstacles: circ(0.2) },
  hdPuddle: { draw: (g, f, it) => puddle(f, it), obstacles: none },
  hdLeaves: { draw: (g, f, it) => leaves(f, it), obstacles: none },
  hdWear: { draw: (g, f, it) => kerbWear(g, f, it), obstacles: none },
  hdCooling: { draw: hdCooling, obstacles: (it) => rb(it, 1.85, 0.6, 0.22, 0) },
  hdNotes: { draw: hdNotes, obstacles: none },
  hdSketch: { draw: hdSketch, obstacles: (it) => rb(it, 1.1, 0.5) },
  hdNoodle: { draw: hdNoodle, obstacles: (it) => rb(it, 1.7, 1.1, 0, 0.05) },
  hdKiteWork: { draw: hdKiteWork, obstacles: (it) => rb(it, 1.4, 0.6) },
  hdTinLamps: { draw: hdTinLamps, obstacles: none },
  hdLone: { draw: hdLone, obstacles: circ(0.25) },
  hdYard: { draw: hdYard, obstacles: circ(0.3) },
  hdBirds: { draw: hdBirds, obstacles: none },
  hdHop: { draw: hdHop, obstacles: none },
};

/** The south row's door: hHouse draws it at doorX from its seed (the fourth and fifth draws), turned with ry. */
function doorOf(it) {
  const r = rng(it.seed || 1); r(); r(); r();
  const sign = r() < 0.5 ? -1 : 1, doorX = sign * (0.6 + r() * Math.max(0, it.w / 2 - 1.8));
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0), FZ = it.d / 2 + 0.45;
  return [it.x + doorX * c + FZ * s, it.z - doorX * s + FZ * c];
}

const HP = Math.PI / 2;
/** detail({ ITEMS, add, PROP, ART, DOORS, DESKS, PEOPLE, SPOTS, ROAD_NODES, ROAD_EDGES }) -> { placed, skipped } */
export function detail(T) {
  Object.assign(T.PROP, PROP);
  // R10: the house kind learns a roof tank (only where an item asks for one)
  const house = T.ART.hHouse, draw0 = house.draw;
  T.ART.hHouse = { ...house, draw: (g, f, it, ctx) => { draw0(g, f, it, ctx); if (it.tank) roofTank(g, it); } };
  // the day scripts' places, every named point in SPOTS (2 m), and the south row's own doors (with their paths)
  const spots = [];
  const walk = (v) => { if (!v || typeof v !== 'object') return; if (Array.isArray(v)) return v.forEach(walk); if (typeof v.x === 'number' && typeof v.z === 'number' && !v.w) spots.push([v.x, v.z, 2.0]); for (const k of Object.keys(v)) if (typeof v[k] === 'object') walk(v[k]); };
  walk(T.SPOTS);
  const south = T.ITEMS.filter((it) => it.k === 'hHouse' && Math.abs((it.ry || 0) - Math.PI) < 0.01 && it.z > 214);
  const homeDoors = south.map((it) => { const [x, z] = doorOf(it); return { x, z, facing: Math.PI }; });
  const check = makeClear({ ...T, KINDS: { ...T.PROP, ...T.ART }, DOORS: [...T.DOORS, ...homeDoors], SPOTS: spots, ROAD_NODES: [...T.ROAD_NODES, { id: 'jNorth', x: 148, z: 258 }], LOW: ['hFootpath', 'hWear', 'hScorch', 'hPaving', 'hSoilPatch', 'hRoadScorch'] });
  const placed = [], skipped = [], put = placer(check, T.add, placed, skipped);

  // ---- R1 a pole run along the back yards behind the north frontage (wires well above the tin roofs' eaves)
  const run = [[176.7, 186.7], [189.6, 187.0], [202.8, 186.4], [215.1, 187.4], [228.6, 187.0]];
  run.forEach(([x, z], k) => {
    const nx = run[k + 1], span = nx ? Math.hypot(nx[0] - x, nx[1] - z) : 0;
    put({ k: 'hdPole', x, z, ry: 0, span, seed: 40 + k, tx: k === 2, birds: [2, 0, 3, 0, 0][k] }, 0.25, { tall: true });
  });
  // ---- R2 the south row: slippers at three doors, a small thing in four front yards
  south.forEach((it, k) => {
    if (k % 3 === 1) return;
    const [x, z] = doorOf(it);
    T.add({ k: 'hSandals', x: x + 0.62, z: z + 0.05, n: 2 + (k % 2), seed: 300 + k, ry: Math.PI }); // at the doorstep, beside its stones
  });
  for (const [x, z, kind, seed] of [[178.8, 213.3, 'lime', 1], [214.6, 213.0, 'basin', 3]]) put({ k: 'hdYard', x, z, kind, seed }, 0.35);
  // ---- R3 puddles on the packed earth, leaves under the pot trees, cracks on the south footpath's slabs
  for (const [x, z, w, d, seed] of [[166.2, 211.6, 1.4, 0.8, 1], [247.6, 211.4, 1.2, 0.7, 2], [129.0, 213.4, 1.5, 0.8, 3]]) put({ k: 'hdPuddle', x, z, w, d, seed, ry: seed * 0.4 }, Math.max(w, d) / 2, { flat: true });
  for (const it of T.ITEMS) if (it.k === 'hPotTree' && it.z > 203) put({ k: 'hdLeaves', x: it.x + 0.2, z: it.z + 0.5, w: 1.6, d: 1.0, n: 9, pal: 'mixed', seed: Math.round(it.x * 3) }, 0.4, { flat: true, on: true });
  for (const x of [176.0, 201.0, 226.0]) put({ k: 'hdWear', x, z: 205.6, len: 3.0, d: 1.0, y: 0.0092, seed: Math.round(x), seam: '#C9AE80' }, 0.3, { flat: true, on: true });
  // ---- R4 bread cooling by the common oven, steam over it, a black cat watching from a crate
  put({ k: 'hdCooling', x: 195.1, z: 194.6, ry: 0 }, 0.25, { half: 0.5 });
  // ---- R5 the Note Wall's foot: fallen notes, one folded and tucked into a crack (the wall's own x, z)
  T.add({ k: 'hdNotes', x: 152.6, z: 196.6, w: 7.2, seed: 18 });
  // ---- R6 the evening class's back: sketchbooks under a cloth, a pebble on top
  put({ k: 'hdSketch', x: 155.4, z: 212.2, ry: Math.PI }, 0.55);
  // ---- R7 two noodle stalls side by side, each its own way
  if (put({ k: 'hdNoodle', x: 166.65, z: 212.6, ry: 0, style: 'wide', seed: 5 }, 0.6)) put({ k: 'hdNoodle', x: 168.55, z: 212.6, ry: 0, style: 'tall', seed: 6 }, 0.6);
  // ---- R8 Uncle Chit's kite work: a frame being papered on a trestle, a reel
  put({ k: 'hdKiteWork', x: 249.7, z: 191.9, ry: 0.2 }, 0.6);
  // ---- R9 the one new board, on the kerb by the tea side of the east end (a saying, never a way)
  put({ k: 'hKerbBoard', x: 254.4, z: 204.4, ry: 0, my: WORDS.thanks.my, en: WORDS.thanks.en }, 0.45);
  // ---- R10 roof tanks on two 'two' houses of the south row (drawn inside the house: they fade with it)
  south.filter((it) => it.style === 'two').slice(0, 3).forEach((it, k) => { if (k !== 1) it.tank = true; });
  // ---- R11 three tin lamps on a bracket outside Daw Nyein's shop (the shop's own x, z, ry)
  const shop = T.ITEMS.find((it) => it.k === 'lampShop');
  if (shop) T.add({ k: 'hdTinLamps', x: shop.x, z: shop.z, ry: shop.ry, w: shop.w, d: shop.d });
  // ---- R12 by the hopscotch: a lost slipper, a chalk heart, a ball of string
  put({ k: 'hdHop', x: 163.6, z: 204.4, ry: 0.3 }, 0.3, { flat: true });
  // ---- R13 pigeons on the lookout's low wall (its top at 1.0 m, along local z), leaves at its foot
  T.add({ k: 'hdBirds', x: 121.4, z: 198.8, ry: HP, n: 3, y: 1.0, len: 2.2, seed: 7 });
  put({ k: 'hdLeaves', x: 123.0, z: 194.6, w: 1.8, d: 1.2, n: 10, pal: 'padauk', seed: 5 }, 0.5, { flat: true, on: true });
  // ---- R14 longyi and towels on lines far back, behind the set-back houses
  for (const [x, z] of [[197.0, 224.4], [229.0, 224.6]]) put({ k: 'laundry', x, z, len: 3.2 }, 0.4, { tall: true, half: 1.6 });
  // ---- R15 a single stool and a tin cup set apart by the common oven (someone eats alone)
  put({ k: 'hdLone', x: 195.4, z: 197.95, ry: 0.3 }, 0.3, { road: -0.5 });
  return { placed, skipped };
}
