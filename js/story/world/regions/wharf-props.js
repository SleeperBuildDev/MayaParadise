// Ledger Wharf: the few street-life kinds ../art/wharf.js does not have (a street-name board on a post, a hawker
// under a big umbrella, a stack of boat planks, fish baskets, a bench of crates, plants in old tins, a hand
// scale anyone may use, chalked tally boards). Registered through regions/wharf.js (PROP; format at the top of
// regions/index.js). Item-local: origin = the item's (x, z), front = +Z, metres. Merged boxes only (kit.js Geo).
// Wharf colours: weathered silver plank, tar, teal, rust zinc, jute; ledger cream ruled blue and red.
// Nothing here marks where to go: a street-name board names the street it stands in, nothing more.
// Every Burmese string is a draft for Maya. Original art only.
import { shade, rng } from '../kit.js';

const C = {
  wood: '#B98A5A', woodD: '#7E5A38', woodL: '#CDA577', woodG: '#A89A86', woodGD: '#8C7E6A', woodGL: '#C4B9A6',
  tar: '#3F3328', teal: '#4E8C86', tealD: '#3D6F6A', ochre: '#D8B66A', rust: '#9C5B3C', zinc: '#A7A9A2', zincD: '#878A84',
  jute: '#C8A878', juteD: '#A88C5E', ledger: '#F4EEDC', rRule: '#D98579', bRule: '#8EAFCF', iron: '#4A3B30',
  red: '#C8323C', cream: '#F7EEDC', white: '#FFFDF8', leaf: '#5E8F4E', leafD: '#3F6B3A', leafL: '#8DBA6E',
  terra: '#B5643C', mustard: '#E2B33C', blue: '#2F5DB3', fish: '#C9CED1', fishD: '#9EA6AA', bamboo: '#C8B36E', bambooD: '#A8925A',
  shadow: '#E2D7BA', ink: '#2A2118', slate: '#3E4A3F', rose: '#E8A0A8', gold: '#C9A24A',
};
const SIGN_EN = { size: 19, font: 'serif', weight: 600, color: '#6E1F2A' };

/** A street-name board on two tarred posts: ledger paper ruled in blue and red, the name in Burmese large and
 * English small. it.name { my, en }. Faces +Z. */
function wStreetSign(g, f, it, ctx) {
  f.flat(-0.9, -0.3, 1.0, 0.4, 0.005, C.shadow);
  for (const sx of [-0.62, 0.62]) { g.box(sx, 0.95, 0, 0.12, 1.9, 0.12, C.tar); g.box(sx, 1.92, 0, 0.16, 0.06, 0.16, C.iron); }
  g.box(0, 1.55, 0, 1.5, 0.62, 0.08, C.woodD);
  g.box(0, 1.55, 0.045, 1.42, 0.54, 0.02, C.ledger);
  g.box(-0.45, 1.55, 0.06, 0.02, 0.54, 0.01, C.rRule);
  g.box(0.5, 1.55, 0.06, 0.02, 0.54, 0.01, C.bRule);
  if (it.name) ctx.signs.push({ x: 0, y: 1.55, z: 0.075, w: 1.36, h: 0.5, lines: [{ text: it.name.my, size: 52 }, { text: it.name.en, ...SIGN_EN }], bg: '#F4EEDC', border: null, width: 420, height: 156 });
  // a pot of marigolds at one post's foot
  g.box(0.62, 0.14, 0.22, 0.26, 0.28, 0.26, C.terra);
  g.box(0.62, 0.36, 0.22, 0.3, 0.18, 0.3, C.leaf);
  g.box(0.62, 0.48, 0.22, 0.16, 0.08, 0.16, C.mustard);
}

/** A hawker under a big striped umbrella: a low table of snacks in tins, a stool, a basket. (Tall: north
 * kerbs only.) it.seed picks the umbrella's colours. */
function wUmbrella(g, f, it) {
  const r = rng(it.seed || 3);
  const cols = [[C.red, C.cream], [C.teal, C.cream], [C.blue, C.mustard], [C.rust, C.ochre]][Math.floor(r() * 4)];
  f.flat(-1.2, -1.0, 1.3, 1.1, 0.005, C.shadow);
  g.box(0, 1.15, 0, 0.06, 2.3, 0.06, C.iron);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    g.boxR(Math.cos(a) * 0.55, 2.2, Math.sin(a) * 0.55, 1.15, 0.05, 0.48, cols[k % 2], 0, -a, 0.28);
  }
  g.box(0, 2.42, 0, 0.12, 0.12, 0.12, cols[0]);
  // the table and its tins and jars
  g.box(0, 0.5, 0.35, 1.1, 0.06, 0.62, C.woodL);
  for (const sx of [-0.48, 0.48]) for (const sz of [0.1, 0.6]) g.box(sx, 0.24, sz, 0.05, 0.48, 0.05, C.woodD);
  for (let k = 0; k < 5; k++) { const c = [C.zinc, C.mustard, C.rose, C.leafL, C.cream][k]; g.box(-0.4 + k * 0.2, 0.62, 0.3 + (k % 2) * 0.16, 0.15, 0.18, 0.15, c); }
  g.box(0.35, 0.6, 0.55, 0.26, 0.14, 0.26, C.bambooD);
  g.box(-0.75, 0.15, -0.2, 0.3, 0.3, 0.3, C.red); // stool
  g.box(0.85, 0.18, -0.25, 0.5, 0.36, 0.5, C.bamboo); // basket
}

/** A stack of new boat planks on two sleepers, a saw lying on top. it.len (along X). */
function wPlanks(g, f, it) {
  const L = it.len || 3.4;
  f.flat(-L / 2 - 0.2, -0.5, L / 2 + 0.3, 0.6, 0.005, C.shadow);
  for (const x of [-L / 3, L / 3]) g.box(x, 0.07, 0, 0.16, 0.14, 0.9, C.tar);
  for (let k = 0; k < 6; k++) g.box(((k * 7) % 3 - 1) * 0.06, 0.18 + k * 0.07, -0.3 + (k % 3) * 0.3, L - (k % 2) * 0.3, 0.06, 0.26, shade(C.woodL, 0.88 + (k % 3) * 0.07));
  g.boxR(0.3, 0.62, 0.05, 0.7, 0.02, 0.14, C.zincD, 0, 0.3, 0);
  g.boxR(-0.05, 0.62, 0.05, 0.2, 0.05, 0.05, C.woodD, 0, 0.3, 0);
}

/** Fish baskets: round bamboo baskets stacked, a few silver fish in the top one. */
function wBaskets(g, f, it) {
  const r = rng(it.seed || 5);
  f.flat(-0.8, -0.6, 0.9, 0.7, 0.005, C.shadow);
  for (const [x, z, n] of [[-0.35, 0, 3], [0.35, 0.1, 2], [0.0, -0.4, 1]]) {
    for (let k = 0; k < n; k++) { g.box(x, 0.14 + k * 0.24, z, 0.56, 0.24, 0.56, k % 2 ? C.bamboo : C.bambooD); g.box(x, 0.27 + k * 0.24, z, 0.6, 0.04, 0.6, C.bambooD); }
    if (r() < 0.7) for (let k = 0; k < 3; k++) f.box(x - 0.15 + k * 0.15, 0.3 + (n - 1) * 0.24, z, 0.12, 0.05, 0.3, k % 2 ? C.fish : C.fishD);
  }
}

/** A plank on two crates by a wall: the porters' bench, a tin cup and a folded towel on it. */
function wCrateBench(g, f) {
  f.flat(-1.1, -0.4, 1.2, 0.5, 0.005, C.shadow);
  for (const sx of [-0.75, 0.75]) { g.box(sx, 0.2, 0, 0.42, 0.4, 0.4, C.woodGL); g.box(sx, 0.3, 0, 0.44, 0.04, 0.42, shade(C.woodGL, 0.8)); }
  g.box(0, 0.44, 0, 2.0, 0.07, 0.36, C.woodG);
  g.box(-0.4, 0.53, 0.05, 0.1, 0.12, 0.1, C.zinc);
  g.box(0.5, 0.5, 0, 0.36, 0.06, 0.26, C.rose);
}

/** Plants grown in old oil tins and a cracked jar along a wall (chillies, basil, a little lime tree). */
function wTinPlants(g, f, it) {
  const n = it.n || 4, r = rng(it.seed || 9);
  f.flat(-n * 0.24 - 0.2, -0.3, n * 0.24 + 0.2, 0.32, 0.005, C.shadow);
  for (let k = 0; k < n; k++) {
    const x = -((n - 1) * 0.24) + k * 0.48, tall = r() < 0.3;
    g.box(x, 0.2, 0, 0.34, 0.4, 0.34, k % 3 === 2 ? C.terra : r() < 0.5 ? C.zinc : C.teal);
    g.box(x, 0.42, 0, 0.36, 0.04, 0.36, C.zincD);
    g.box(x, tall ? 0.75 : 0.56, 0, tall ? 0.2 : 0.36, tall ? 0.7 : 0.26, tall ? 0.2 : 0.36, C.leaf);
    if (tall) g.box(x, 1.12, 0, 0.5, 0.36, 0.5, C.leafL);
    if (r() < 0.5) g.box(x + 0.08, tall ? 1.0 : 0.72, 0.12, 0.08, 0.1, 0.08, r() < 0.5 ? C.red : C.mustard);
  }
}

/** A hand scale on a post outside a godown, hung with a chalk slate: «ကိုယ်တိုင် ချိန်ကြည့်ပါ» (weigh it
 * yourself). Anyone may check: the Wharf's own rule (Day 5's lesson in the open). */
function wHandScale(g, f, it, ctx) {
  f.flat(-0.6, -0.4, 0.7, 0.5, 0.005, C.shadow);
  g.box(0, 0.9, -0.1, 0.14, 1.8, 0.14, C.tar);
  g.box(0, 1.78, 0.15, 0.06, 0.06, 0.6, C.iron);
  g.box(0, 1.6, 0.42, 0.02, 0.36, 0.02, C.iron);
  g.box(0, 1.42, 0.42, 0.5, 0.04, 0.04, C.gold);
  for (const sx of [-0.22, 0.22]) { g.box(sx, 1.22, 0.42, 0.02, 0.38, 0.02, C.iron); g.box(sx, 1.02, 0.42, 0.24, 0.04, 0.24, C.gold); }
  g.box(-0.22, 1.08, 0.42, 0.12, 0.1, 0.12, C.iron); // a weight in one pan
  g.box(0.22, 1.1, 0.42, 0.18, 0.12, 0.16, C.jute); // a parcel in the other
  g.box(0, 0.62, 0.0, 0.5, 0.36, 0.04, C.woodD);
  g.box(0, 0.62, 0.025, 0.44, 0.3, 0.02, C.slate);
  if (it.say !== false) ctx.signs.push({ x: 0, y: 0.62, z: 0.04, w: 0.42, h: 0.28, lines: [{ text: 'ကိုယ်တိုင် ချိန်ကြည့်', size: 40, color: '#F4EEDC' }], bg: '#3E4A3F', border: null, width: 300, height: 200 });
}

/** A chalked tally board on a stand: bundle marks in fives (a godown's count of what came in). */
function wTally(g, f, it) {
  const r = rng(it.seed || 2);
  f.flat(-0.6, -0.3, 0.7, 0.4, 0.005, C.shadow);
  for (const sx of [-0.45, 0.45]) g.boxR(sx, 0.6, 0, 0.07, 1.25, 0.07, C.woodD, -0.12, 0, 0);
  g.boxR(0, 0.85, 0.05, 1.0, 0.7, 0.05, C.slate, -0.12, 0, 0);
  for (let row = 0; row < 3; row++) {
    const n = 2 + Math.floor(r() * 4);
    for (let k = 0; k < n; k++) {
      const x = -0.35 + k * 0.17, y = 1.05 - row * 0.2;
      for (let m = 0; m < 4; m++) g.boxR(x + m * 0.03, y, 0.085 - (y - 0.85) * 0.12, 0.012, 0.11, 0.01, C.white, -0.12, 0, 0);
      g.boxR(x + 0.045, y, 0.087 - (y - 0.85) * 0.12, 0.14, 0.012, 0.01, C.white, -0.12, 0, -0.5);
    }
  }
}

/** A low ledger-paper wall (the town's paper, folded up into a garden wall), ruled in blue with a red margin.
 * it.len along X. You can see over it. */
function wPaperWall(g, f, it) {
  const L = it.len || 4;
  f.flat(-L / 2 - 0.1, -0.25, L / 2 + 0.1, 0.35, 0.005, C.shadow);
  g.box(0, 0.42, 0, L, 0.84, 0.16, C.ledger);
  g.box(0, 0.86, 0, L + 0.04, 0.05, 0.2, shade(C.ledger, 0.88));
  for (const y of [0.25, 0.45, 0.65]) g.box(0, y, 0.085, L - 0.06, 0.018, 0.01, C.bRule);
  g.box(-L / 2 + 0.5, 0.42, 0.085, 0.02, 0.8, 0.01, C.rRule);
}

const box = (w, d, ox = 0, oz = 0) => (it) => {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const cx = it.x + ox * c + oz * s, cz = it.z - ox * s + oz * c;
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return [{ type: 'box', minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd }];
};

export const WHARF_EXTRA_PROP = {
  wStreetSign: { draw: wStreetSign, obstacles: (it) => [...box(0.2, 0.2, -0.62, 0)(it), ...box(0.2, 0.2, 0.62, 0)(it)] },
  wUmbrella: { draw: wUmbrella, obstacles: (it) => box(1.3, 0.8, 0, 0.3)(it) },
  wPlanks: { draw: wPlanks, obstacles: (it) => box((it.len || 3.4) + 0.1, 1.0)(it) },
  wBaskets: { draw: wBaskets, r: 0.55 },
  wCrateBench: { draw: wCrateBench, obstacles: (it) => box(2.0, 0.45)(it) },
  wTinPlants: { draw: wTinPlants, obstacles: (it) => box((it.n || 4) * 0.48, 0.4)(it) },
  wHandScale: { draw: wHandScale, obstacles: (it) => box(0.6, 0.5, 0, 0.1)(it) },
  wTally: { draw: wTally, obstacles: (it) => box(1.0, 0.3)(it) },
  wPaperWall: { draw: wPaperWall, obstacles: (it) => box(it.len || 4, 0.2)(it) },
};
