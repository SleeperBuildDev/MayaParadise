// Hearth Row kerb life (district 5): the things that make the bare stretches of the Row's footpaths read
// lived-in from the low close camera: a parked trishaw, umbrella stalls (fritters, flowers, betel, fruit),
// sandals at doorsteps, worn footpath slabs and scuffed earth, small hand-painted kerb boards. Registered by
// regions/hearth.js with the district's `h` prefix (PROP), laid by `layKerb(add)`.
// Same kit as ../art/hearth.js: outlined boxes (kit.js Geo), item-local, feet at y = 0, fronts face +Z.
// All under ~2.3 m (the umbrellas are the tallest) so nothing hides Maya from the follow camera south of her.
// Nothing points the way: the boards say what is sold or a house's small rule, never where to go.
// Every Burmese string here is a draft for Maya.
//
// Props:
//   saika { seed }               a parked trishaw (bicycle + sidecar, two seats back to back)
//   umbrellaStall { goods }      a low table under a striped umbrella: 'fritters' | 'flowers' | 'betel' | 'fruit'
//   sandals { n, seed }          pairs of slippers left at a doorstep
//   footpath { len, d, seed }    worn footpath slabs (flat; no keep-out)
//   wear { w, d, seed }          scuffed earth, a few fallen leaves (flat; no keep-out)
//   kerbBoard { my, en }         a small A-frame board with a hand-painted line (one canvas sign = one draw call:
//                                only a few in the whole district)
import { rng } from '../kit.js';
import { C } from '../art/hearth.js';

const box = (w, d) => (it) => {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return [{ type: 'box', minX: it.x - hw, maxX: it.x + hw, minZ: it.z - hd, maxZ: it.z + hd }];
};
const seedOf = (it) => it.seed || Math.round(it.x * 13 + it.z * 7);

function wheel(g, x, y, z, d, col = C.soot) {
  g.box(x, y, z, d, d, 0.05, col);
  g.box(x, y, z, d * 0.7, d * 0.7, 0.06, C.tinD);
  g.box(x, y, z, 0.09, 0.09, 0.1, C.tinL);
}

function saika(g, f, it) {
  // ဆိုက်ကား: the bicycle on the -Z side, the sidecar on +Z; two seats back to back, a folded cloth on one
  const r = rng(seedOf(it));
  const col = [C.teal, C.green, C.blue, C.red][Math.floor(r() * 4)];
  f.flat(-1.05, -0.75, 1.05, 0.95, 0.005, C.shadow);
  wheel(g, -0.72, 0.33, -0.42, 0.64);
  wheel(g, 0.72, 0.33, -0.42, 0.64);
  g.box(0, 0.62, -0.42, 1.24, 0.05, 0.05, col); // top tube
  g.boxR(-0.28, 0.48, -0.42, 0.05, 0.36, 0.05, col, 0, 0, 0.35);
  g.boxR(0.3, 0.46, -0.42, 0.05, 0.36, 0.05, col, 0, 0, -0.45);
  g.box(-0.36, 0.84, -0.42, 0.3, 0.06, 0.14, C.dark); // saddle
  g.box(-0.36, 0.74, -0.42, 0.04, 0.16, 0.04, C.tinD);
  g.box(0.62, 0.8, -0.42, 0.05, 0.38, 0.05, col); // head tube
  g.box(0.62, 0.99, -0.42, 0.05, 0.05, 0.62, C.tinD); // handlebar
  g.box(0.62, 0.99, -0.72, 0.06, 0.06, 0.12, C.dark);
  g.box(0.62, 0.99, -0.12, 0.06, 0.06, 0.12, C.dark);
  g.box(0.74, 0.86, -0.42, 0.1, 0.08, 0.06, C.tinL); // bell
  // the sidecar: a platform on a third wheel, footboard, two seats back to back, arm rails
  wheel(g, -0.05, 0.27, 0.78, 0.5);
  g.box(-0.05, 0.42, 0.28, 1.4, 0.06, 0.78, col);
  g.box(-0.05, 0.46, 0.28, 1.32, 0.02, 0.7, C.woodL);
  g.box(0.25, 0.42, -0.08, 0.06, 0.06, 0.45, C.tinD); // the arm that holds it to the bicycle
  for (const sx of [-0.4, 0.3]) {
    g.box(sx, 0.62, 0.28, 0.46, 0.08, 0.62, C.red);
    g.box(sx, 0.52, 0.28, 0.44, 0.12, 0.6, C.redD);
  }
  g.box(-0.05, 0.84, 0.28, 0.08, 0.5, 0.68, col); // the shared back
  g.box(-0.05, 1.1, 0.28, 0.12, 0.04, 0.72, C.tinL);
  for (const sz of [-0.06, 0.62]) g.box(-0.05, 0.76, sz, 1.24, 0.04, 0.04, C.tinD); // rails
  g.box(0.32, 0.68, 0.32, 0.36, 0.05, 0.4, ['#E9DFC9', '#E6B8A8', '#C9D8E6'][Math.floor(r() * 3)]); // a folded cloth
  if (r() < 0.6) g.box(-0.42, 0.72, 0.36, 0.22, 0.12, 0.22, C.bamboo); // a little basket left on the seat
}

function canopy(g, y, cols, ox = 0, oz = 0) {
  // a square umbrella in four tilted quarters (a two-colour checker), centred at (ox, oz)
  const q = [[-0.5, -0.5, 0.16, -0.16], [0.5, -0.5, 0.16, 0.16], [-0.5, 0.5, -0.16, -0.16], [0.5, 0.5, -0.16, 0.16]];
  q.forEach(([x, z, rx, rz], k) => g.boxR(ox + x, y - 0.08, oz + z, 1.04, 0.04, 1.04, cols[k === 0 || k === 3 ? 0 : 1], rx, 0, rz));
  g.box(ox, y + 0.06, oz, 0.14, 0.1, 0.14, C.woodDD);
  for (const [x, z] of [[-1.0, -1.0], [1.0, -1.0], [-1.0, 1.0], [1.0, 1.0]]) g.box(ox + x, y - 0.25, oz + z, 0.05, 0.08, 0.05, cols[0]); // rib tips
}

function umbrellaStall(g, f, it) {
  const r = rng(seedOf(it));
  const goods = it.goods || 'fritters';
  const pairs = { fritters: [C.red, C.cream], flowers: [C.green, C.cream], betel: [C.blue, C.cream], fruit: [C.mustard, C.redD] };
  f.flat(-1.2, -1.0, 1.2, 1.0, 0.005, C.shadow);
  // the umbrella: pole at the back-left corner, tied to a weighted tin
  g.box(-0.7, 1.08, -0.45, 0.06, 2.16, 0.06, C.woodD);
  g.box(-0.7, 0.14, -0.45, 0.3, 0.28, 0.3, C.tinD);
  g.box(-0.45, 2.16, -0.28, 0.5, 0.04, 0.04, C.woodD); // the arm from the pole to the canopy's middle
  canopy(g, 2.2, pairs[goods] || pairs.fritters, -0.2, -0.1);
  // the table
  g.box(0, 0.72, 0, 1.3, 0.06, 0.72, C.woodL);
  for (const sx of [-0.58, 0.58]) for (const sz of [-0.3, 0.3]) g.box(sx, 0.35, sz, 0.06, 0.7, 0.06, C.woodD);
  g.box(0, 0.73, 0.37, 1.32, 0.12, 0.02, pairs[goods]?.[0] || C.red); // a cloth hem along the front
  // the seller's stool behind it
  g.box(0.3, 0.26, -0.72, 0.34, 0.05, 0.34, C.blue);
  for (const sx of [-0.13, 0.13]) for (const sz of [-0.13, 0.13]) g.box(0.3 + sx, 0.12, -0.72 + sz, 0.04, 0.24, 0.04, C.woodD);
  if (goods === 'fritters') {
    // ပဲကြော်: a clay stove with a wok, a draining rack of fritters, a basket of more
    g.box(-0.95, 0.3, 0.1, 0.5, 0.6, 0.5, C.terra);
    g.box(-0.95, 0.45, 0.36, 0.22, 0.16, 0.02, C.ember);
    g.box(-0.95, 0.64, 0.1, 0.62, 0.08, 0.62, C.soot);
    g.box(-0.95, 0.69, 0.1, 0.5, 0.02, 0.5, C.crustD);
    g.box(-0.62, 0.7, 0.1, 0.3, 0.03, 0.03, C.tinD); // the wok handle
    g.box(-0.1, 0.78, 0.0, 0.7, 0.04, 0.5, C.tinL); // the rack
    for (let k = 0; k < 12; k++) g.box(-0.36 + (k % 4) * 0.17, 0.84, -0.17 + Math.floor(k / 4) * 0.17, 0.13, 0.06, 0.13, k % 3 ? C.crustL : C.crust);
    g.box(0.45, 0.85, 0.05, 0.36, 0.2, 0.36, C.bamboo);
    for (let k = 0; k < 4; k++) g.box(0.38 + (k % 2) * 0.14, 0.97, -0.02 + Math.floor(k / 2) * 0.14, 0.12, 0.05, 0.12, C.crustL);
  } else if (goods === 'flowers') {
    // jasmine strings, roses, marigolds in tin buckets; a string of jasmine hung from the pole
    const cols = ['#FFFDF8', C.red, C.mustard, '#E88AA8', C.ember];
    for (let k = 0; k < 4; k++) {
      const x = -0.45 + k * 0.3;
      g.box(x, 0.88, 0, 0.24, 0.26, 0.24, C.tin);
      for (let j = 0; j < 3; j++) g.box(x + (j - 1) * 0.06, 1.06 + (j % 2) * 0.05, (j - 1) * 0.04, 0.1, 0.1, 0.1, cols[(k + j) % cols.length]);
      g.box(x, 1.0, 0, 0.04, 0.16, 0.04, C.leafD);
    }
    for (let k = 0; k < 6; k++) g.box(-0.7, 1.8 - k * 0.12, -0.38, 0.06, 0.06, 0.06, '#FFFDF8');
    for (let k = 0; k < 3; k++) g.box(-0.95 + k * 0.03, 0.18, 0.25 + k * 0.12, 0.26, 0.36, 0.26, C.tinD);
    for (let k = 0; k < 3; k++) g.box(-0.95 + k * 0.03, 0.42, 0.25 + k * 0.12, 0.2, 0.14, 0.2, cols[(k + 1) % cols.length]);
  } else if (goods === 'betel') {
    // a glass-sided case on the table; leaves stacked, lime tins, a cup of water with a brush
    g.box(-0.1, 0.98, 0, 0.9, 0.46, 0.5, C.glass);
    g.box(-0.1, 1.22, 0, 0.94, 0.04, 0.54, C.woodD);
    for (let k = 0; k < 5; k++) g.box(-0.4 + k * 0.15, 0.8, 0.05, 0.12, 0.05 + (k % 2) * 0.03, 0.2, C.leaf);
    for (let k = 0; k < 3; k++) g.box(0.45, 0.8 + k * 0.08, 0.12 - k * 0.1, 0.12, 0.08, 0.12, k % 2 ? C.tinL : C.limeD);
    g.box(0.5, 0.82, -0.2, 0.1, 0.14, 0.1, C.white);
  } else {
    // fruit: mangoes, a hand of bananas, pomelos, in flat baskets
    for (let k = 0; k < 3; k++) {
      const x = -0.42 + k * 0.42;
      g.box(x, 0.78, 0, 0.38, 0.06, 0.4, C.bamboo);
      const col = [C.mustard, '#9DBB4E', '#E8A23C'][k];
      for (let j = 0; j < 4; j++) g.box(x - 0.08 + (j % 2) * 0.16, 0.86 + Math.floor(j / 2) * 0.08, -0.07 + (j % 2) * 0.14, 0.13, 0.11, 0.13, j === 3 ? shadeOf(col) : col);
    }
    g.box(0.95, 0.2, 0.3, 0.42, 0.4, 0.42, C.bamboo);
    for (let k = 0; k < 4; k++) g.box(0.88 + (k % 2) * 0.14, 0.44, 0.24 + Math.floor(k / 2) * 0.14, 0.14, 0.12, 0.14, '#9DBB4E');
  }
  void r;
}
const shadeOf = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.round(v * 0.82));
  return '#' + ((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0');
};

function sandals(g, f, it) {
  const r = rng(seedOf(it));
  const n = it.n || 3;
  const cols = [C.red, C.blue, C.dark, C.teal, C.mustard, C.brickD];
  for (let k = 0; k < n; k++) {
    const x = -0.45 * (n - 1) / 2 + k * 0.45 + (r() - 0.5) * 0.08, z = (r() - 0.5) * 0.12, a = (r() - 0.5) * 0.5;
    const col = cols[Math.floor(r() * cols.length)], small = r() < 0.3 ? 0.75 : 1;
    for (const sx of [-0.07, 0.07]) {
      g.boxR(x + sx, 0.02, z, 0.11 * small, 0.03, 0.27 * small, col, 0, a, 0);
      g.boxR(x + sx, 0.045, z - 0.03, 0.08 * small, 0.02, 0.03, C.cream, 0, a, 0);
    }
  }
}

function footpath(g, f, it) {
  // worn slabs along a footpath, local x = along it; two tones, the odd cracked or missing one
  const r = rng(seedOf(it));
  const L = it.len || 12, D = it.d || 1.2;
  let x = -L / 2;
  while (x < L / 2 - 0.3) {
    const w = 0.8 + r() * 0.35;
    const p = r();
    if (p > 0.08) {
      const col = p < 0.45 ? '#E9D8B4' : p < 0.8 ? '#E3CFA6' : '#DCC59A';
      f.flat(x + 0.03, -D / 2, Math.min(L / 2, x + w) - 0.03, D / 2, 0.006, col);
      if (r() < 0.2) f.flat(x + w * 0.3, -0.02, x + w * 0.75, 0.02, 0.008, '#C9AE80'); // a crack
    } else f.flat(x + 0.03, -D / 2, Math.min(L / 2, x + w) - 0.03, D / 2, 0.004, C.soil); // a slab gone: bare earth
    x += w;
  }
  g.box(0, 0.04, D / 2 + 0.05, L, 0.08, 0.1, C.stoneL); // the kerb edge on the road side
}

function wear(g, f, it) {
  // scuffed earth where feet go, a few dropped leaves and a bottle top
  const r = rng(seedOf(it));
  const W = it.w || 3, D = it.d || 1.6;
  for (let k = 0; k < 4; k++) {
    const cx = (r() - 0.5) * W * 0.7, cz = (r() - 0.5) * D * 0.6, w = W * (0.25 + r() * 0.3), d = D * (0.25 + r() * 0.3);
    f.flat(cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, 0.003 + k * 0.0004, k % 2 ? '#E2CDA2' : '#DCC497');
  }
  for (let k = 0; k < 7; k++) {
    const x = (r() - 0.5) * W, z = (r() - 0.5) * D;
    f.flatR(x, z, 0.16, 0.09, 0.006, k % 3 ? '#B8863E' : '#8DA65A', r() * 3);
  }
  if (r() < 0.5) f.flat(0.2, 0.1, 0.26, 0.16, 0.007, C.red);
}

function kerbBoard(g, f, it, ctx) {
  // an A-frame board: two legs, the face leaning back a little
  f.flat(-0.45, -0.35, 0.45, 0.35, 0.005, C.shadow);
  g.boxR(0, 0.5, 0.06, 0.74, 0.96, 0.04, C.woodD, -0.16, 0, 0);
  g.boxR(0, 0.5, -0.12, 0.7, 0.9, 0.04, C.woodD, 0.16, 0, 0);
  g.boxR(0, 0.52, 0.09, 0.64, 0.8, 0.02, C.chalk, -0.16, 0, 0);
  ctx.signs.push({
    x: 0, y: 0.55, z: 0.13, w: 0.6, h: 0.72, ry: 0, width: 256, height: 300, bg: C.chalk, border: null,
    lines: it.en
      ? [{ text: it.my, size: it.size || 44, color: '#F6F0E2' }, { text: it.en, size: 22, font: 'serif', weight: 600, color: '#E9D9B8' }]
      : [{ text: it.my, size: it.size || 48, color: '#F6F0E2' }],
  });
}

/** PROP kinds (unprefixed; regions/hearth.js adds the `h`: saika -> hSaika). */
export const KERB_PROP = {
  saika: { draw: saika, obstacles: box(2.1, 1.7) },
  umbrellaStall: { draw: umbrellaStall, obstacles: box(1.9, 1.1) },
  sandals: { draw: sandals, obstacles: () => [] },
  footpath: { draw: footpath, obstacles: () => [] },
  wear: { draw: wear, obstacles: () => [] },
  kerbBoard: { draw: kerbBoard, obstacles: box(0.8, 0.4) },
};
