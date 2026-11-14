// Hearth Row street life (district 5): the small things people leave out where they live and work, so the Row
// reads lived-in from the low close camera. Kinds registered by regions/hearth.js with the district's `h` prefix
// (PROP), and `fillStreet(add)` lays them along the south kerb, in the front yards and round the west end.
// Same kit as ../art/hearth.js: outlined boxes (kit.js Geo), item-local, feet at y = 0, fronts face +Z.
// All low or open (under ~2.3 m) so nothing hides Maya from the follow camera south of her; nothing points the way.
//
// Props:
//   waterStand          a roofed shelf with two clay drinking-water pots and a tin cup, for anyone passing
//   handcart { load }   a two-wheeled push cart: 'pots' | 'sacks' | 'greens' | 'wood'
//   cot                 a low wooden day bed with a woven mat, a pillow and slippers
//   dryMat { load }     a woven mat drying in the sun: 'chili' | 'beans' | 'crackers', a sieve tray beside it
//   potTree { seed }    a big clay pot with a small lime tree (yellow fruit), knee-to-head height
//   baskets { seed }    stacked bamboo baskets and a winnowing tray leaning on them
//   teaCorner           a low table, four tiny stools, a kettle and cups (an outdoor tea corner)
//   gutter { len }      the kerb drain: a dark channel with plank crossings (flat; no keep-out)
//   paving { len, ry }  stepping stones from a gate to the kerb (flat; no keep-out)
//   arch                a bamboo arch over a front gate with a pink creeper
//   broom               a broom leant on a post, a dustpan, a little heap of leaves
//   bikeFix             a bicycle upside down on a mat with tools, a pump and a spare tyre on a peg
//   marbles             a scratched circle in the dust with glass marbles (flat + tiny)
//   washTub             a tin tub with a washboard, a stool and a bucket
//   bigJar { glaze }    a tall glazed water jar with a lid and a dipper
//   herbBox { seed }    a raised wooden planter of herbs and chillies
//   kiteLine { len }    kites hung to dry on a line between two posts (kite workshop yard)
// Every Burmese string in the district is a draft for Maya (there is none in this file: no text signs, so no
// extra draw calls).
import { rng } from '../kit.js';
import { C } from '../art/hearth.js';

const K = {
  clay: '#B9653F', clayL: '#CF8156', clayD: '#8C4A2C', glaze: '#5C3A24', glazeL: '#7A5032', jade: '#4D7A62',
  mat: '#D9BE82', matD: '#B99A5E', chili: '#C8323C', chiliD: '#9A2228', bean: '#E2B33C', beanD: '#B98C24',
  cracker: '#F3E2BC', pink: '#D9568A', pinkL: '#EE88AE', lime: '#E8D04A', tyre: '#2B2622', steel: '#8A8C85',
  water: '#7FA9B8', cloth: '#E9DFC9', cloth2: '#C9D8E6', cloth3: '#E6B8A8',
};

const box = (w, d) => (it) => {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return [{ type: 'box', minX: it.x - hw, maxX: it.x + hw, minZ: it.z - hd, maxZ: it.z + hd }];
};
const circ = (r) => (it) => [{ type: 'circle', x: it.x, z: it.z, r }];

function pot(g, x, y, z, s, col = K.clay) {
  // a round-ish clay pot from three stacked boxes
  g.box(x, y + s * 0.3, z, s * 0.8, s * 0.6, s * 0.8, col);
  g.box(x, y + s * 0.62, z, s * 0.62, s * 0.14, s * 0.62, col === K.clay ? K.clayD : col);
  g.box(x, y + s * 0.74, z, s * 0.5, s * 0.1, s * 0.5, col === K.clay ? K.clayL : col);
}
function stoolAt(g, x, z, col, h = 0.26) {
  g.box(x, h, z, 0.34, 0.05, 0.34, col);
  for (const sx of [-0.13, 0.13]) for (const sz of [-0.13, 0.13]) g.box(x + sx, h / 2, z + sz, 0.04, h, 0.04, C.woodD);
}

function waterStand(g, f) {
  // ရေအိုးစင်: four posts, a little tin roof, a slatted shelf with two lidded pots, a tin cup on a hook
  f.flat(-0.8, -0.5, 0.8, 0.55, 0.005, C.shadow);
  for (const sx of [-0.62, 0.62]) for (const sz of [-0.3, 0.3]) g.box(sx, 0.85, sz, 0.08, 1.7, 0.08, C.woodD);
  g.boxR(0, 1.78, 0, 1.6, 0.05, 0.95, C.tin, 0.12, 0, 0);
  for (let k = 0; k < 5; k++) g.boxR(-0.6 + k * 0.3, 1.81, 0, 0.04, 0.03, 0.95, C.tinL, 0.12, 0, 0);
  g.box(0, 0.62, 0, 1.3, 0.06, 0.6, C.woodL);
  for (let k = 0; k < 4; k++) g.box(-0.48 + k * 0.32, 0.56, 0.0, 0.05, 0.05, 0.62, C.woodD);
  for (const sx of [-0.32, 0.32]) {
    pot(g, sx, 0.65, 0, 0.55);
    g.box(sx, 1.08, 0, 0.36, 0.04, 0.36, C.woodL); // the lid
    g.box(sx, 1.12, 0, 0.08, 0.04, 0.08, C.woodD);
  }
  g.box(0, 1.3, 0.3, 1.24, 0.03, 0.03, C.woodD); // the rail the cup hangs from
  g.box(0.02, 1.18, 0.31, 0.12, 0.12, 0.12, C.tinL);
  g.box(0.1, 1.2, 0.31, 0.04, 0.08, 0.04, C.tin);
  g.box(0, 0.06, 0.35, 1.1, 0.04, 0.1, '#C9B89A'); // the wet stone underneath
}

function handcart(g, f, it) {
  const r = rng(Math.round(it.x * 13 + it.z * 7));
  f.flat(-1.0, -0.6, 1.0, 0.6, 0.005, C.shadow);
  // the bed and its sides
  g.box(-0.1, 0.62, 0, 1.5, 0.08, 0.95, C.woodL);
  for (const sz of [-0.46, 0.46]) g.box(-0.1, 0.78, sz, 1.5, 0.24, 0.05, C.wood);
  g.box(-0.84, 0.78, 0, 0.05, 0.24, 0.95, C.wood);
  // the wheels (one each side) and the axle
  for (const sz of [-0.55, 0.55]) {
    g.box(0.05, 0.36, sz, 0.72, 0.72, 0.08, C.woodD);
    g.box(0.05, 0.36, sz, 0.5, 0.5, 0.1, C.woodL);
    g.box(0.05, 0.36, sz, 0.14, 0.14, 0.14, C.iron);
  }
  g.box(0.05, 0.36, 0, 0.06, 0.06, 1.2, C.iron);
  // the shafts and a prop leg
  for (const sz of [-0.36, 0.36]) g.box(1.15, 0.6, sz, 1.1, 0.06, 0.06, C.woodD);
  g.box(1.66, 0.6, 0, 0.06, 0.06, 0.78, C.woodD);
  g.box(-0.75, 0.3, 0, 0.06, 0.6, 0.06, C.woodD);
  const load = it.load || 'pots';
  if (load === 'pots') for (let k = 0; k < 5; k++) pot(g, -0.6 + (k % 3) * 0.42, 0.66 + Math.floor(k / 3) * 0.3, (k % 2 ? 0.18 : -0.18), 0.42, r() < 0.5 ? K.clay : K.clayL);
  else if (load === 'sacks') for (let k = 0; k < 4; k++) { g.box(-0.55 + (k % 2) * 0.62, 0.86 + Math.floor(k / 2) * 0.3, (k % 2 ? 0.15 : -0.15), 0.56, 0.32, 0.44, k % 2 ? C.sackD : C.sack); }
  else if (load === 'greens') {
    for (let k = 0; k < 8; k++) g.box(-0.62 + (k % 4) * 0.34, 0.76, -0.24 + Math.floor(k / 4) * 0.48, 0.3, 0.2, 0.4, k % 3 ? C.leaf : C.leafL);
    for (let k = 0; k < 5; k++) g.box(-0.5 + k * 0.25, 0.9, 0, 0.16, 0.12, 0.16, k % 2 ? '#C8323C' : '#E8742E');
  } else for (let k = 0; k < 9; k++) g.boxR(-0.1, 0.74 + Math.floor(k / 3) * 0.13, -0.3 + (k % 3) * 0.3, 1.4, 0.12, 0.12, k % 2 ? C.woodD : '#8E6A48', 0, (r() - 0.5) * 0.12, 0);
}

function cot(g, f) {
  f.flat(-1.1, -0.6, 1.1, 0.6, 0.005, C.shadow);
  for (const sx of [-0.92, 0.92]) for (const sz of [-0.42, 0.42]) g.box(sx, 0.2, sz, 0.08, 0.4, 0.08, C.woodD);
  g.box(0, 0.42, 0, 1.96, 0.06, 0.94, C.wood);
  // the woven mat: a checker of two straw tones
  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) g.box(-0.78 + i * 0.31, 0.47, -0.3 + j * 0.3, 0.3, 0.03, 0.29, (i + j) % 2 ? K.mat : K.matD);
  g.box(-0.72, 0.53, 0, 0.36, 0.1, 0.6, K.cloth2); // pillow
  g.box(0.5, 0.5, 0.05, 0.6, 0.04, 0.7, K.cloth3); // a folded blanket
  for (const sx of [0.3, 0.52]) g.box(sx, 0.02, 0.62, 0.14, 0.03, 0.3, K.chiliD); // slippers
}

function dryMat(g, f, it) {
  const r = rng(Math.round(it.x * 17 + it.z * 3));
  const load = it.load || 'chili';
  // the mat itself: flat weave on the ground
  f.flatR(0, 0, 2.2, 1.4, 0.008, K.mat, 0);
  for (let i = 0; i < 7; i++) f.flatR(-0.95 + i * 0.32, 0, 0.08, 1.36, 0.010, K.matD, 0);
  const col = load === 'chili' ? [K.chili, K.chiliD] : load === 'beans' ? [K.bean, K.beanD] : [K.cracker, '#E8CC94'];
  const n = load === 'crackers' ? 14 : 34;
  for (let k = 0; k < n; k++) {
    const x = -0.95 + r() * 1.9, z = -0.55 + r() * 1.1;
    if (load === 'crackers') g.box(x, 0.03, z, 0.26, 0.03, 0.26, col[k % 2]);
    else g.boxR(x, 0.03, z, load === 'chili' ? 0.16 : 0.08, 0.04, 0.05, col[k % 2], 0, r() * 3, 0);
  }
  // a round sieve tray leaning on a stone at the corner, and a little stone weight on the mat edge
  g.boxR(1.3, 0.3, 0.3, 0.64, 0.64, 0.05, C.bamboo, 0.35, 0.4, 0);
  g.box(1.24, 0.08, 0.4, 0.24, 0.16, 0.2, C.stone);
  g.box(-1.08, 0.06, -0.66, 0.2, 0.12, 0.16, C.stoneD);
}

function potTree(g, f, it) {
  const r = rng(it.seed || Math.round(it.x * 5 + it.z));
  f.flat(-0.55, -0.5, 0.6, 0.55, 0.005, C.shadow);
  g.box(0, 0.32, 0, 0.78, 0.64, 0.78, K.clay);
  g.box(0, 0.66, 0, 0.88, 0.08, 0.88, K.clayL);
  g.box(0, 0.7, 0, 0.7, 0.02, 0.7, C.soil);
  g.box(0, 1.05, 0, 0.1, 0.8, 0.1, C.woodD);
  const lumps = [[0, 1.55, 0, 0.9], [-0.3, 1.4, 0.15, 0.6], [0.32, 1.45, -0.1, 0.62], [0.05, 1.9, 0.05, 0.6]];
  for (const [x, y, z, s] of lumps) g.box(x, y, z, s, s * 0.8, s, r() < 0.5 ? C.leaf : C.leafD);
  for (let k = 0; k < 6; k++) g.box(-0.4 + r() * 0.8, 1.25 + r() * 0.65, 0.42 + r() * 0.06, 0.1, 0.1, 0.06, K.lime);
}

function baskets(g, f, it) {
  const r = rng(it.seed || Math.round(it.x * 7 + it.z * 11));
  f.flat(-0.8, -0.5, 0.8, 0.5, 0.005, C.shadow);
  // nested stacks of round-shouldered baskets: a narrow foot, a wide belly with dark weave bands, a pale rim
  for (let s = 0; s < 3; s++) {
    const x = -0.52 + s * 0.52, h = 1 + Math.floor(r() * 3);
    g.box(x, 0.06, 0, 0.26, 0.12, 0.26, C.bambooD);
    g.box(x, 0.24, 0, 0.42, 0.26, 0.42, C.bamboo);
    for (const y of [0.17, 0.29]) g.box(x, y, 0, 0.44, 0.03, 0.44, '#7E6A34');
    for (let k = 0; k < h; k++) g.box(x, 0.4 + k * 0.1, 0, 0.48, 0.07, 0.48, k % 2 ? '#E6D49A' : C.bamboo); // the rims of the nested ones
    if (s === 1) for (let k = 0; k < 4; k++) g.box(x - 0.1 + (k % 2) * 0.2, 0.42 + h * 0.1, (k < 2 ? -0.08 : 0.1), 0.14, 0.1, 0.14, k % 2 ? '#E8742E' : C.leafL); // a few limes and oranges on top
  }
  g.boxR(0.0, 0.42, -0.3, 1.0, 0.84, 0.04, C.bamboo, 0.3, 0, 0); // the winnowing tray leaning behind
}

function teaCorner(g, f) {
  f.flat(-1.0, -0.8, 1.0, 0.8, 0.005, C.shadow);
  g.box(0, 0.4, 0, 0.9, 0.05, 0.6, C.woodL);
  for (const sx of [-0.38, 0.38]) for (const sz of [-0.24, 0.24]) g.box(sx, 0.2, sz, 0.05, 0.4, 0.05, C.woodD);
  stoolAt(g, -0.72, 0, C.red); stoolAt(g, 0.72, 0, C.blue); stoolAt(g, 0, -0.6, C.blue); stoolAt(g, 0, 0.62, C.red);
  g.box(-0.2, 0.5, 0, 0.2, 0.16, 0.18, C.tinD); // kettle
  g.box(-0.08, 0.54, 0, 0.1, 0.03, 0.03, C.tinD);
  for (const [x, z] of [[0.12, -0.12], [0.26, 0.1], [0.05, 0.16]]) g.box(x, 0.47, z, 0.08, 0.09, 0.08, C.white);
  g.box(0.3, 0.44, -0.16, 0.18, 0.04, 0.14, C.crustL); // a plate of fried snacks
}

function gutter(g, f, it) {
  const L = it.len || 8;
  f.flatR(0, 0, L, 0.42, 0.011, '#9C8A6E', 0);
  f.flatR(0, 0, L, 0.24, 0.014, '#6E604C', 0);
  for (let x = -L / 2 + 1.6; x < L / 2 - 0.4; x += 3.4) g.box(x, 0.03, 0, 0.8, 0.05, 0.6, C.woodG);
}

function paving(g, f, it) {
  const L = it.len || 3.6;
  for (let z = -L / 2 + 0.3, k = 0; z < L / 2; z += 0.62, k++) f.flatR((k % 2 ? 0.08 : -0.06), z, 0.62, 0.42, 0.012, k % 3 ? C.stoneL : '#BBAE9A', (k % 2 ? 0.1 : -0.08));
}

function arch(g, f) {
  for (const sx of [-0.75, 0.75]) g.box(sx, 1.05, 0, 0.1, 2.1, 0.1, C.bambooD);
  g.box(0, 2.12, 0, 1.7, 0.1, 0.12, C.bambooD);
  g.box(0, 2.24, 0, 1.2, 0.08, 0.1, C.bamboo);
  // the creeper: leaf clumps up both posts and over, pink flowers in the leaves
  const cl = [[-0.78, 0.6], [-0.74, 1.1], [-0.7, 1.6], [-0.5, 2.1], [0, 2.32], [0.5, 2.15], [0.76, 1.7], [0.8, 1.2]];
  cl.forEach(([x, y], k) => {
    g.box(x, y, 0.02, 0.34, 0.3, 0.3, k % 2 ? C.leaf : C.leafD);
    g.box(x + 0.08, y + 0.08, 0.17, 0.12, 0.1, 0.06, k % 3 ? K.pink : K.pinkL);
  });
}

function broom(g, f) {
  g.box(0, 0.75, 0, 0.1, 1.5, 0.1, C.woodD); // the post
  g.boxR(0.22, 0.62, 0.08, 0.04, 1.2, 0.04, C.bamboo, 0, 0, -0.18); // broom handle
  g.boxR(0.33, 0.12, 0.08, 0.3, 0.26, 0.1, C.bambooD, 0, 0, -0.18); // its head
  g.box(-0.35, 0.03, 0.25, 0.3, 0.04, 0.24, C.tinD); // dustpan
  for (let k = 0; k < 7; k++) g.box(-0.7 + (k % 4) * 0.12, 0.03, 0.4 + Math.floor(k / 4) * 0.1, 0.12, 0.05, 0.1, k % 2 ? '#B89A4E' : '#9C7A3A');
}

function bikeFix(g, f) {
  f.flatR(0, 0, 1.9, 1.1, 0.008, '#8E7E66', 0);
  // the bicycle, upside down: saddle and bars on the mat, wheels up
  for (const x of [-0.55, 0.55]) {
    g.box(x, 0.62, 0, 0.66, 0.66, 0.05, C.ink);
    g.box(x, 0.62, 0, 0.5, 0.5, 0.06, '#E8DCC2');
    g.box(x, 0.62, 0, 0.08, 0.08, 0.1, C.steel ?? K.steel);
  }
  g.box(0, 0.48, 0, 1.1, 0.05, 0.05, '#2F6E8C');
  g.boxR(-0.15, 0.3, 0, 0.6, 0.05, 0.05, '#2F6E8C', 0, 0, 0.7);
  g.box(-0.4, 0.06, 0, 0.26, 0.08, 0.14, C.ink); // saddle
  g.box(0.42, 0.06, 0, 0.06, 0.08, 0.6, K.steel); // bars
  // tools on the mat, a hand pump, a tyre on a peg
  for (let k = 0; k < 4; k++) g.box(-0.7 + k * 0.18, 0.02, 0.45, 0.06, 0.03, 0.26, k % 2 ? K.steel : C.redD);
  g.box(0.85, 0.3, 0.35, 0.06, 0.6, 0.06, '#3A6EA5');
  g.box(0.85, 0.02, 0.35, 0.3, 0.04, 0.12, '#3A6EA5');
  g.box(-1.05, 0.7, -0.4, 0.06, 1.4, 0.06, C.woodD);
  g.box(-1.0, 1.15, -0.32, 0.62, 0.62, 0.06, K.tyre);
  g.box(-1.0, 1.15, -0.32, 0.46, 0.46, 0.07, '#CDBB98');
}

function marbles(g, f, it) {
  const r = rng(Math.round(it.x * 3 + it.z * 19));
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; f.flatR(Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0.26, 0.05, 0.009, C.soilD, -a); }
  f.flatR(0, 1.1, 1.0, 0.05, 0.009, C.soilD, 0); // the throwing line
  const cols = ['#4E8CC9', '#3F9A6A', '#E2B33C', '#C8323C', '#9AC3D6'];
  for (let k = 0; k < 7; k++) g.box(-0.45 + r() * 0.9, 0.04, -0.45 + r() * 0.9, 0.08, 0.08, 0.08, cols[k % cols.length]);
}

function washTub(g, f) {
  f.flat(-0.9, -0.55, 0.9, 0.55, 0.005, '#CDBB98');
  g.box(0, 0.2, 0, 0.9, 0.4, 0.62, C.tin);
  g.box(0, 0.38, 0, 0.8, 0.04, 0.52, K.water);
  g.box(0, 0.42, 0, 0.98, 0.04, 0.7, C.tinD);
  g.boxR(0.2, 0.55, -0.12, 0.4, 0.6, 0.04, C.woodL, -0.4, 0, 0); // washboard
  for (let k = 0; k < 5; k++) g.boxR(0.2, 0.42 + k * 0.08, -0.08 + k * 0.032, 0.36, 0.02, 0.03, C.woodD, -0.4, 0, 0);
  stoolAt(g, -0.7, 0.25, C.blue, 0.2);
  g.box(0.75, 0.18, 0.2, 0.3, 0.36, 0.3, '#3A6EA5'); // a bucket
  g.box(0.75, 0.37, 0.2, 0.26, 0.02, 0.26, K.water);
  g.box(-0.2, 0.46, 0.15, 0.4, 0.06, 0.3, K.cloth3); // a cloth over the rim
}

function bigJar(g, f, it) {
  const col = it.glaze === 'jade' ? K.jade : K.glaze, colL = it.glaze === 'jade' ? '#6C9A80' : K.glazeL;
  f.flat(-0.5, -0.45, 0.5, 0.5, 0.005, C.shadow);
  g.box(0, 0.1, 0, 0.56, 0.2, 0.56, col);
  g.box(0, 0.48, 0, 0.82, 0.6, 0.82, col);
  g.box(0, 0.86, 0, 0.66, 0.18, 0.66, col);
  g.box(0, 1.0, 0, 0.5, 0.1, 0.5, colL);
  g.box(0, 1.08, 0, 0.56, 0.06, 0.56, C.woodL); // wooden lid
  g.box(0.12, 1.14, 0.0, 0.5, 0.04, 0.08, C.tinL); // the dipper on the lid
  g.box(0.36, 1.16, 0.0, 0.14, 0.08, 0.14, C.tinL);
  g.box(0, 0.62, 0.42, 0.5, 0.06, 0.02, colL); // a pale band round its belly
}

function herbBox(g, f, it) {
  const r = rng(it.seed || Math.round(it.x * 9 + it.z * 5));
  g.box(0, 0.3, 0, 1.4, 0.6, 0.5, C.woodL);
  for (const y of [0.15, 0.45]) g.box(0, y, 0.26, 1.42, 0.05, 0.02, C.woodD);
  g.box(0, 0.6, 0, 1.3, 0.03, 0.42, C.soil);
  for (let k = 0; k < 6; k++) {
    const x = -0.55 + k * 0.22, h = 0.2 + r() * 0.25;
    g.box(x, 0.62 + h / 2, (k % 2 ? 0.08 : -0.08), 0.16, h, 0.16, k % 3 ? C.leaf : C.leafL);
    if (k % 2 === 0) g.box(x + 0.04, 0.66 + h, 0.1, 0.05, 0.12, 0.05, K.chili);
  }
}

function kiteLine(g, f, it) {
  const L = it.len || 3.4;
  for (const sx of [-L / 2, L / 2]) g.box(sx, 0.95, 0, 0.08, 1.9, 0.08, C.woodD);
  g.box(0, 1.82, 0, L, 0.02, 0.02, C.ink);
  const cols = [C.red, C.mustard, C.teal, '#F6F0E2', C.blueL];
  for (let x = -L / 2 + 0.45, k = 0; x < L / 2 - 0.3; x += 0.62, k++) {
    g.boxR(x, 1.5, 0.02, 0.44, 0.44, 0.02, cols[k % cols.length], 0, 0, Math.PI / 4);
    g.box(x, 1.5, 0.04, 0.03, 0.6, 0.01, C.ink);
    g.box(x, 1.12, 0.03, 0.02, 0.36, 0.01, cols[(k + 2) % cols.length]);
  }
}

/** PROP kinds (unprefixed here; regions/hearth.js adds the `h` prefix: waterStand -> hWaterStand). */
export const LIFE_PROP = {
  waterStand: { draw: waterStand, obstacles: box(1.4, 0.75) },
  handcart: { draw: handcart, obstacles: box(2.9, 1.25) },
  cot: { draw: cot, obstacles: box(2.0, 1.0) },
  dryMat: { draw: dryMat, obstacles: () => [] },
  potTree: { draw: potTree, obstacles: circ(0.45) },
  baskets: { draw: baskets, obstacles: box(1.5, 0.6) },
  teaCorner: { draw: teaCorner, obstacles: box(1.4, 0.9) },
  gutter: { draw: gutter, obstacles: () => [] },
  paving: { draw: paving, obstacles: () => [] },
  arch: { draw: arch, obstacles: (it) => { const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0); return [-0.75, 0.75].map((d) => ({ type: 'circle', x: it.x + d * c, z: it.z - d * s, r: 0.1 })); } },
  broom: { draw: broom, obstacles: circ(0.15) },
  bikeFix: { draw: bikeFix, obstacles: box(1.6, 0.9) },
  marbles: { draw: marbles, obstacles: () => [] },
  washTub: { draw: washTub, obstacles: box(1.6, 0.8) },
  bigJar: { draw: bigJar, obstacles: circ(0.45) },
  herbBox: { draw: herbBox, obstacles: box(1.4, 0.5) },
  kiteLine: { draw: kiteLine, obstacles: (it) => { const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0), L = (it.len || 3.4) / 2; return [{ type: 'circle', x: it.x - L * c, z: it.z + L * s, r: 0.1 }, { type: 'circle', x: it.x + L * c, z: it.z - L * s, r: 0.1 }]; } },
};
