// Newsprint Junction: street-life kinds that ../art/junction.js does not have (the newspaper stall, the
// poster hoarding Ko Min pastes, ink drums, a paper-roll cart, yard walls, a sign on two posts, the pavement
// numeral that reads 6 from one bench and 9 from the other). Registered through regions/junction.js
// (PROP; format at the top of regions/index.js). Item-local: origin = the item's (x, z), front = +Z, metres.
// Original blocky art in the Junction's newsprint greys and ink. Nothing here marks where to go.
// Every Burmese string is a draft for Maya.
import { rng } from '../kit.js';
import { J, rotBox, face } from '../art/junction.js';

const TAU = Math.PI * 2;
const pad = (f, x0, z0, x1, z1, col = J.shadow) => f.flat(x0, z0, x1, z1, 0.007, col);

/** Columns of grey type on a flat face (ground Geo: no outline). */
function type(f, x0, x1, y0, y1, z, seed, col = J.print) {
  const r = rng(seed);
  for (let y = y1 - 0.06; y > y0; y -= 0.09) {
    let x = x0;
    while (x < x1 - 0.06) { const l = Math.min(x1 - x, 0.08 + r() * 0.22); face(f, x + l / 2, y, z, l, 0.03, col); x += l + 0.04; }
  }
}

/** The newspaper stall: a low plank counter under a tin awning, today's papers in stacks and pegged on a
 * line, a chalk headline board on an easel beside it (the rumour, written bigger than it deserves).
 * it.head: [{ my }] chalk lines (default: the well is drying up). 2.6 x 1.4. */
function jStall(g, f, it, ctx) {
  const r = rng(it.seed || 3);
  pad(f, -1.5, -0.9, 1.7, 1.0);
  // counter and its back rack
  g.box(0, 0.45, 0.25, 2.4, 0.9, 0.7, J.woodG);
  g.box(0, 0.93, 0.25, 2.5, 0.06, 0.8, J.woodL);
  for (let k = 0; k < 4; k++) g.box(-0.9 + k * 0.6, 0.45, 0.61, 0.5, 0.7, 0.02, k % 2 ? J.newsL : J.news);
  g.box(0, 1.0, -0.45, 2.4, 2.0, 0.12, J.woodD);
  for (const sx of [-1.2, 1.2]) g.box(sx, 1.25, 0.25, 0.1, 2.5, 0.1, J.ink);
  for (const sx of [-1.2, 1.2]) g.box(sx, 1.25, -0.45, 0.1, 2.5, 0.1, J.ink);
  // the awning: tin, ink edge, a fringe of red
  g.boxR(0, 2.55, 0.15, 2.8, 0.06, 1.5, J.tin, 0.18, 0, 0);
  g.box(0, 2.42, 0.9, 2.8, 0.08, 0.05, J.red);
  // stacks of papers on the counter (newsprint, a red mast-head on top), and the pegged line behind
  for (let k = 0; k < 5; k++) {
    const x = -1.0 + k * 0.5, h = 0.08 + r() * 0.12;
    g.box(x, 0.96 + h / 2, 0.3, 0.42, h, 0.3, k % 2 ? J.newsL : J.news);
    g.box(x, 0.97 + h, 0.22, 0.36, 0.01, 0.08, k % 3 ? J.red : J.ink);
  }
  g.box(0, 1.72, -0.36, 2.3, 0.02, 0.02, J.ink);
  for (let k = 0; k < 5; k++) {
    const x = -0.95 + k * 0.48;
    g.box(x, 1.45, -0.35, 0.4, 0.5, 0.012, k % 2 ? J.newsL : J.white);
    type(f, x - 0.17, x + 0.17, 1.24, 1.62, -0.338, 30 + k);
    face(f, x, 1.64, -0.336, 0.34, 0.05, k === 2 ? J.red : J.printD);
  }
  // a stool behind, a tin money box, a stone holding the stack down
  g.box(0.7, 0.3, -0.1, 0.36, 0.06, 0.36, J.woodD);
  for (const sx of [-0.14, 0.14]) for (const sz of [-0.14, 0.14]) g.box(0.7 + sx, 0.14, -0.1 + sz, 0.04, 0.28, 0.04, J.woodD);
  g.box(-0.6, 1.02, 0.5, 0.22, 0.12, 0.16, J.blueD);
  g.box(0.95, 1.02, 0.45, 0.16, 0.1, 0.14, J.stoneDD);
  // the chalk headline board: on its easel beside the stall (it.easel 1 right, -1 left), or (0) propped
  // against the counter front
  const side = it.easel ?? 1, bx = side * 1.75, bz = side ? 0.55 : 0.68, by = side ? 0.9 : 0.5;
  if (side) {
    for (const sx of [-0.28, 0.28]) g.boxR(bx + sx, 0.6, bz, 0.05, 1.25, 0.05, J.woodD, -0.14, 0, 0);
    g.boxR(bx, 0.55, bz - 0.24, 0.05, 1.15, 0.05, J.woodD, 0.3, 0, 0);
  }
  g.boxR(bx, by, bz + 0.07, 0.72, 0.62, 0.04, J.woodD, side ? 0 : -0.15, 0, 0);
  g.boxR(bx, by, bz + 0.095, 0.64, 0.54, 0.01, J.chalk, side ? 0 : -0.15, 0, 0);
  const head = it.head || [{ my: 'ရွှေမင်တွင်း', en: 'The gold-ink well' }, { my: 'ခန်းပြီ!', en: 'has run dry!' }];
  ctx.signs.push({ x: bx, y: by, z: bz + 0.12, w: 0.62, h: 0.52, lines: head.map((l, i) => ({ text: l.my, size: i ? 54 : 46, color: i ? '#F2CE63' : '#F4EFE4' })), bg: '#3E4A3F', border: null, width: 256, height: 214 });
}

/** A poster hoarding: a newsprint-board wall on posts, pasted over and over (layers of bills, one half torn
 * away, older ones showing under it), a paste bucket and brush at its foot. len along X (default 4). */
function jHoarding(g, f, it) {
  const L = it.len || 4, H = 2.3, r = rng(it.seed || 6);
  pad(f, -L / 2 - 0.2, -0.4, L / 2 + 0.3, 0.6);
  g.box(0, H / 2 + 0.1, 0, L, H, 0.12, J.newsD);
  for (const sx of [-1, 1]) g.box(sx * L / 2, H / 2 + 0.15, 0, 0.14, H + 0.3, 0.16, J.ink);
  g.box(0, H + 0.3, 0, L + 0.3, 0.08, 0.3, J.ink);
  const cols = [J.white, '#FCE6C4', J.newsL, '#E8C6C6', '#D7E6EE', J.mustard, '#E9F0D8', J.red];
  for (let k = 0; k < 14; k++) {
    const w = 0.5 + r() * 0.5, h = 0.6 + r() * 0.5, x = -L / 2 + 0.35 + r() * (L - 0.7), y = 0.55 + r() * (H - 0.9);
    const c = cols[Math.floor(r() * cols.length)];
    g.boxR(x, y, 0.065 + k * 0.002, w, h, 0.01, c, 0, 0, (r() - 0.5) * 0.12);
    face(f, x, y + h / 2 - 0.12, 0.08 + k * 0.002, w - 0.12, 0.09, c === J.red ? J.white : J.red);
    type(f, x - w / 2 + 0.08, x + w / 2 - 0.08, y - h / 2 + 0.1, y + h / 2 - 0.22, 0.08 + k * 0.002, 50 + k, c === J.red ? J.white : J.printD);
  }
  // the torn one: a jagged strip hanging off
  g.boxR(L / 2 - 0.7, 0.9, 0.12, 0.36, 0.5, 0.01, J.white, 0.35, 0, 0.5);
  // paste bucket, brush across it, a roll of new bills
  g.box(L / 2 - 0.2, 0.18, 0.45, 0.3, 0.36, 0.3, J.tin);
  g.box(L / 2 - 0.2, 0.37, 0.45, 0.32, 0.03, 0.32, J.tinD);
  g.boxR(L / 2 - 0.2, 0.42, 0.45, 0.05, 0.05, 0.6, J.woodL, 0, 0.6, 0);
  g.boxR(L / 2 - 0.65, 0.12, 0.5, 0.2, 0.2, 0.7, J.newsL, 0, 0.3, 0);
}

/** Ink drums: two or three oil drums of printer's ink, black with gold lids, one on its side on chocks. */
function jDrums(g, f, it) {
  const n = it.n || 3;
  pad(f, -0.9, -0.6, 1.0, 0.7);
  const oct = (x, y, z, w, h, c) => { g.box(x, y, z, w * 0.83, h, w * 0.83, c); g.box(x, y, z, w * 0.83, h, w * 0.83, c, Math.PI / 4); };
  for (let k = 0; k < Math.min(2, n); k++) {
    const x = -0.45 + k * 0.62;
    oct(x, 0.45, 0, 0.58, 0.9, J.ink);
    for (const y of [0.25, 0.65]) oct(x, y, 0, 0.6, 0.04, J.inkL);
    oct(x, 0.92, 0, 0.5, 0.04, J.inkGold);
    g.box(x + 0.12, 0.95, 0.06, 0.08, 0.03, 0.08, J.inkGoldD);
    g.box(x, 0.5, 0.29, 0.26, 0.2, 0.01, J.inkGold);
  }
  if (n > 2) {
    g.boxR(0.5, 0.3, 0.55, 0.52, 0.52, 0.86, J.ink, 0, 0.3, 0);
    g.boxR(0.5, 0.3, 0.55, 0.42, 0.42, 0.9, J.inkGoldD, 0, 0.3, 0);
    for (const s of [-0.3, 0.3]) g.box(0.5 + s, 0.05, 0.55, 0.12, 0.1, 0.5, J.woodD, 0.3);
  }
}

/** A hand cart of paper rolls for the press: two wheels, shafts on a prop leg, three fat rolls of newsprint. */
function jRollCart(g, f, it) {
  pad(f, -1.1, -0.7, 1.4, 0.7);
  g.box(0, 0.62, 0, 1.6, 0.08, 0.95, J.woodG);
  for (const sz of [-1, 1]) g.box(0, 0.75, sz * 0.47, 1.6, 0.22, 0.05, J.woodD);
  for (const sz of [-1, 1]) {
    g.box(0, 0.4, sz * 0.56, 0.14, 0.14, 0.08, J.woodD); // hub; the wheel is a ring of turned bars
    for (let k = 0; k < 6; k++) g.boxR(0, 0.4, sz * 0.56, 0.06, 0.78, 0.04, J.wood, 0, 0, (k * Math.PI) / 6);
  }
  for (const sz of [-0.3, 0.3]) g.boxR(1.35, 0.5, sz, 1.4, 0.06, 0.06, J.woodD, 0, 0, -0.18);
  g.box(1.9, 0.18, 0, 0.06, 0.36, 0.06, J.woodD);
  for (let k = 0; k < 3; k++) {
    const x = -0.5 + k * 0.5;
    for (let a = 0; a < 3; a++) g.boxR(x, 0.95, 0, 0.42, 0.42, 0.9, k === 1 ? J.newsL : J.news, a * Math.PI / 6, 0, 0);
    g.box(x, 0.95, 0.46, 0.14, 0.14, 0.02, J.newsDD);
    g.box(x, 0.95, -0.46, 0.14, 0.14, 0.02, J.newsDD);
  }
}

/** A low whitewashed yard wall with a coping and a newsprint-grey plinth (len along X); it.gate: a gap
 * of 1.2 m at local x `gate`. */
function jYardWall(g, f, it) {
  const L = it.len || 6, gx = it.gate;
  const seg = (x0, x1) => {
    if (x1 - x0 < 0.1) return;
    g.box((x0 + x1) / 2, 0.45, 0, x1 - x0, 0.9, 0.24, J.stoneL);
    g.box((x0 + x1) / 2, 0.08, 0, x1 - x0 + 0.04, 0.16, 0.3, J.stoneD);
    g.box((x0 + x1) / 2, 0.95, 0, x1 - x0 + 0.06, 0.08, 0.32, J.newsDD);
  };
  if (gx === undefined) seg(-L / 2, L / 2);
  else { seg(-L / 2, gx - 0.6); seg(gx + 0.6, L / 2); for (const s of [-0.68, 0.68]) g.box(gx + s, 0.6, 0, 0.3, 1.2, 0.32, J.stoneD); }
}

/** A painted sign on two posts (it.text: { my }, it.color: ink colour, it.bg). Small: 1.6 x 0.5 at 1.8 m. */
function jPostSign(g, f, it, ctx) {
  const w = it.w || 1.6;
  for (const sx of [-1, 1]) g.box(sx * (w / 2 - 0.1), 1.0, 0, 0.08, 2.0, 0.08, J.woodD);
  g.box(0, 1.85, -0.02, w, 0.56, 0.05, J.woodD);
  ctx.signs.push({ x: 0, y: 1.85, z: 0.015, w: w - 0.08, h: 0.48, lines: [{ text: it.text?.my || '', size: 50, color: it.color || '#2E2A26' }], bg: it.bg || '#F1EDE3', border: null, width: 384, height: 112 });
}

/** The pavement numeral: a big blocky "6" painted in the square between two benches that face each other.
 * Sitting on the south bench (looking north, as the street camera does) it reads 6; from the north bench, 9.
 * Ground only (it.ry turns it). */
const SIX = ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'];
function jSix(g, f, it) {
  const s = it.s || 0.32, W = 5 * s, D = 7 * s;
  f.flat(-W / 2 - 0.25, -D / 2 - 0.25, W / 2 + 0.25, D / 2 + 0.25, 0.0105, J.newsD);
  // the glyph's top row lies north (-Z), its left column west (-X): upright for anyone looking north
  SIX.forEach((row, j) => [...row].forEach((c, i) => {
    if (c !== '#') return;
    const x = -W / 2 + (i + 0.5) * s, z = -D / 2 + (j + 0.5) * s;
    f.flat(x - s / 2 + 0.02, z - s / 2 + 0.02, x + s / 2 - 0.02, z + s / 2 - 0.02, 0.012, J.inkGoldD);
  }));
}

/** A string of paper lanterns between two posts (len along X), unlit by day (it adds lamp cores: glows). */
function jLanterns(g, f, it, ctx) {
  const L = it.len || 6, n = Math.max(3, Math.round(L / 1.1));
  for (const sx of [-1, 1]) g.box(sx * L / 2, 1.5, 0, 0.1, 3.0, 0.1, J.woodD);
  const cols = [J.red, J.mustard, J.white, J.redL];
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n, x = -L / 2 + t * L, y = 2.8 - Math.sin(t * Math.PI) * 0.45;
    g.box(x, y + 0.2, 0, 0.02, 0.18, 0.02, J.ink);
    g.box(x, y, 0, 0.24, 0.3, 0.24, cols[k % cols.length]);
    g.box(x, y + 0.17, 0, 0.16, 0.04, 0.16, J.ink);
    if (k % 2 === 0) ctx.glows.push(g.tx + x * g.tc, y, g.tz - x * g.ts);
  }
  for (let k = 0; k < n * 3; k++) { const t = k / (n * 3), x = -L / 2 + t * L; g.box(x, 3.0 - Math.sin(t * Math.PI) * 0.45, 0, L / (n * 3) + 0.02, 0.02, 0.02, J.ink); }
}

/** A cycle-trishaw parked up, its hood folded, a towel on the seat (newsprint delivery: a bundle on the step). */
function jSidecar(g, f, it) {
  pad(f, -1.1, -0.8, 1.2, 0.8);
  // the bicycle: frame, two wheels, saddle, bars
  for (const x of [-0.75, 0.55]) { g.box(x, 0.33, -0.35, 0.62, 0.62, 0.05, J.ink); g.box(x, 0.33, -0.35, 0.48, 0.48, 0.06, J.newsL); g.box(x, 0.33, -0.35, 0.1, 0.1, 0.08, J.ink); }
  g.boxR(-0.1, 0.62, -0.35, 1.2, 0.06, 0.06, J.blueD, 0, 0, 0.15);
  g.box(-0.45, 0.86, -0.35, 0.26, 0.06, 0.12, J.ink);
  g.box(0.5, 0.95, -0.35, 0.06, 0.06, 0.5, J.inkL);
  // the side-car: a seat box with a back, a folded hood, a little step
  g.box(-0.05, 0.5, 0.35, 1.0, 0.12, 0.66, J.blue);
  g.box(-0.05, 0.75, 0.05, 1.0, 0.5, 0.08, J.blue);
  g.box(-0.05, 0.6, 0.35, 0.86, 0.1, 0.56, J.mustard);
  g.boxR(-0.05, 1.05, 0.1, 1.04, 0.3, 0.3, J.maroon, 0.4, 0, 0);
  g.box(0.42, 0.25, 0.38, 0.4, 0.42, 0.05, J.inkL);
  for (const sx of [-0.5, 0.4]) g.box(sx, 0.22, 0.72, 0.36, 0.36, 0.06, J.ink);
  g.box(-0.05, 0.38, 0.75, 0.6, 0.04, 0.2, J.woodD);
  g.box(-0.05, 0.47, 0.75, 0.44, 0.14, 0.18, J.newsL);
}

/** Old print on the paper itself (ground only, 2 triangles a mark): faded columns of type, a headline bar,
 * sometimes a photo block: the Junction's streets are newsprint. w x d (default 3 x 2.2). */
function jPrint(g, f, it) {
  const r = rng(it.seed || 1), W = it.w || 3, D = it.d || 2.2, y = 0.006;
  const ink = it.dark ? J.newsDD : '#DCD6C9', head = it.dark ? J.print : '#CFC8B9';
  if (r() < 0.7) f.flat(-W / 2, -D / 2, W / 2, -D / 2 + 0.22, y + 0.0005, head);
  const cols = Math.max(1, Math.round(W / 0.95)), cw = W / cols;
  for (let c = 0; c < cols; c++) {
    const x0 = -W / 2 + c * cw + 0.06, x1 = x0 + cw - 0.14;
    let z = -D / 2 + 0.38;
    if (r() < 0.25 && D > 1.6) { f.flat(x0, z, x1, z + 0.6, y, head); z += 0.75; }
    for (; z < D / 2 - 0.05; z += 0.16) {
      const xe = r() < 0.15 ? x0 + (x1 - x0) * (0.3 + r() * 0.5) : x1;
      f.flat(x0, z, xe, z + 0.05, y, ink);
    }
  }
}

/** A chalked hopscotch on the paper (ground only): boxes up to a round home, a pebble on 4. */
function jHopscotch(g, f, it) {
  const y = 0.008, c = '#F7F5EF', s = 0.55, L = 0.04;
  const sq = (x, z) => { f.flat(x - s / 2, z - s / 2, x + s / 2, z - s / 2 + L, y, c); f.flat(x - s / 2, z + s / 2 - L, x + s / 2, z + s / 2, y, c); f.flat(x - s / 2, z - s / 2, x - s / 2 + L, z + s / 2, y, c); f.flat(x + s / 2 - L, z - s / 2, x + s / 2, z + s / 2, y, c); };
  const rows = [[0], [0], [-0.5, 0.5], [0], [-0.5, 0.5], [0]];
  rows.forEach((xs, j) => xs.forEach((x) => sq(x * s, 1.4 - j * s)));
  for (let k = 0; k < 10; k++) { const a = (k * TAU) / 10; f.flatR(Math.sin(a) * 0.32, 1.4 - 6 * s + 0.05 + Math.cos(a) * 0.32, 0.18, 0.05, y, c, a + Math.PI / 2); }
  g.box(-0.25, 0.03, 1.4 - 3 * s, 0.08, 0.06, 0.07, J.stoneDD);
}

/** Printed sheets laid out to dry on a reed mat, rows of them, pebbles holding them down (the press's overflow). */
function jDryMats(g, f, it) {
  const W = it.w || 3, D = it.d || 2, r = rng(it.seed || 2);
  f.flat(-W / 2 - 0.1, -D / 2 - 0.1, W / 2 + 0.1, D / 2 + 0.1, 0.006, '#C9B48E');
  for (let z = -D / 2 + 0.35; z < D / 2 - 0.2; z += 0.62) for (let x = -W / 2 + 0.3; x < W / 2 - 0.2; x += 0.5) {
    const sw = 0.42, sd = 0.56, rot = (r() - 0.5) * 0.12;
    f.flatR(x, z, sw, sd, 0.01, r() < 0.15 ? '#FFFDF8' : J.newsL, rot);
    for (let k = 0; k < 6; k++) f.flatR(x, z - sd / 2 + 0.12 + k * 0.07, sw - 0.1, 0.025, 0.0115, k ? J.print : (r() < 0.3 ? J.red : J.printD), rot);
    if (r() < 0.6) g.box(x + 0.12, 0.035, z + 0.18, 0.08, 0.07, 0.07, r() < 0.5 ? J.stoneDD : J.stoneD);
  }
}

export const PROP = {
  jPrint: { draw: jPrint, obstacles: () => [] },
  jHopscotch: { draw: jHopscotch, obstacles: () => [] },
  jDryMats: { draw: jDryMats, obstacles: () => [] },
  jStall: { draw: jStall, obstacles: (it) => [rotBox(it, 2.6, 1.0, 0, 0.1), ...((it.easel ?? 1) ? [rotBox(it, 0.7, 0.5, (it.easel ?? 1) * 1.75, 0.5)] : [])] },
  jHoarding: { draw: jHoarding, obstacles: (it) => [rotBox(it, it.len || 4, 0.3)] },
  jDrums: { draw: jDrums, obstacles: (it) => [rotBox(it, 1.6, 1.0, 0.1, 0.2)] },
  jRollCart: { draw: jRollCart, obstacles: (it) => [rotBox(it, 2.4, 1.2, 0.3, 0)] },
  jYardWall: { draw: jYardWall, obstacles: (it) => (it.gate === undefined ? [rotBox(it, it.len || 6, 0.34)]
    : [rotBox(it, it.gate - 0.6 + (it.len || 6) / 2, 0.34, (-(it.len || 6) / 2 + it.gate - 0.6) / 2), rotBox(it, (it.len || 6) / 2 - it.gate - 0.6, 0.34, ((it.len || 6) / 2 + it.gate + 0.6) / 2)]) },
  jPostSign: { draw: jPostSign, obstacles: (it) => [rotBox(it, it.w || 1.6, 0.2)] },
  jSix: { draw: jSix, obstacles: () => [] },
  jLanterns: { draw: jLanterns, obstacles: (it) => { const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0), L = (it.len || 6) / 2; return [{ type: 'circle', x: it.x - L * c, z: it.z + L * s, r: 0.12 }, { type: 'circle', x: it.x + L * c, z: it.z - L * s, r: 0.12 }]; } },
  jSidecar: { draw: jSidecar, obstacles: (it) => [rotBox(it, 2.0, 1.4)] },
};
