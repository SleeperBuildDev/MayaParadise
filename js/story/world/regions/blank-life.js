// The Blank Page's lived-in things (district 7): what the lodge's people and the travellers who stop there leave
// out on the white, so the leaf reads lived-in from the low close camera while it stays the ONE-ROOF leaf of the
// story (day13-spec 1: "one roof, one line of smoke, one lamp-post"; nothing north of the lodge on the way to the
// back cover). So: no second building, no lamp-post (lanterns hang from a cart, the well frame and a gate),
// nothing that points the way, nothing religious. Everything is low or open (under ~2.4 m, the trees stand off
// the walking lines) so it never hides Maya from the follow camera south of her.
//
// The page's own idea is in the props too: the leaf is not written yet, so some of what people mean to build is
// only drawn in pencil (a fence that turns from woven bamboo into faint pencil posts, pencil streets and plots
// laid out to the west). What someone has tried for themselves stands; what is only planned is still pencil
// (ch 22: test it yourself instead of taking it on someone's word).
//
// Kinds (registered by regions/blank.js as PROP; keep-out shapes in world space, turned by it.ry):
//   blWell              a round brick well with a post-and-pulley frame, bucket, trough, a lantern on its hook
//   blTeaCart           a push tea cart: charcoal stove, kettle, glasses, a striped sun umbrella with a lantern,
//                       a low table and tiny stools; its board says taste first (canvas sign)
//   blFence { len, pencil }  a woven bamboo fence run; the last `pencil` fraction is only drawn in pencil
//   blGate              two posts, a bamboo top bar with a lantern, a gate swung open
//   blBanana { seed }   a banana clump (soft trunks, big leaves, a hanging bunch)
//   blTree { seed, s }  a small shade tree (trunk and three toon canopy blocks)
//   blCart              a two-wheeled travellers' cart at rest: shafts on a block, bundles, a cloth over half
//   blBundles { seed }  travellers' things: a tin trunk, rolled mats, a carrying pole with two baskets
//   blStove             an outdoor clay stove with a rice pot, firewood and a squat stool (banked: the lodge's
//                       chimney stays the leaf's one line of smoke)
//   blCoop              a bamboo hen coop with a thatch lid, a water dish and a grain tray
//   blHopscotch         a hopscotch grid drawn in pencil on the white, a flat stone, the pencil (flat)
//   blCobbler           a sandal mender's mat: pairs in a row, a last, a tool box, a stool and a small sign
//   blBeans { seed }    three rows of bean poles with vines, a watering can
//   blBlock             a chopping block with split kindling, a stack and a basket
//   blWashLine { len }  a second washing line between bamboo posts (longyi, towels), a basket under it
//   blDryMat { load }   a woven mat drying chillies ('chili') or rice crackers ('crackers')
//   blRainJars          three big glazed jars with lids and a dipper
//   blPencilTown { pts, w }  pencil streets laid out on the white: two faint lines along pts, plots ticked off (flat)
//   blPots { n }        a row of clay flower pots
// Every Burmese string here is a draft for Maya.
import { rng, shade } from '../kit.js';
import { jitter } from '../../../game/voxel.js';

const K = {
  wood: '#B58A5A', woodD: '#7A5434', woodL: '#CDA577', bamboo: '#CDB176', bambooD: '#A88C52', bambooL: '#E0C990',
  brick: '#B5643C', brickL: '#CB7E4E', brickD: '#8E4A2C', stone: '#B9AE9A', stoneL: '#CFC6B4', iron: '#4A3B30',
  clay: '#B9653F', clayL: '#CF8156', clayD: '#8C4A2C', glaze: '#5C3A24', glazeL: '#7A5032',
  leaf: '#6F9E5B', leafD: '#4F7F43', leafL: '#8DBA6E', banana: '#7DB35A', bananaD: '#5A8F3E', bananaL: '#9CCB6E',
  trunk: '#8E6A44', trunkD: '#6A4C30', canopy: '#5E8E4E', canopyD: '#46703C', canopyL: '#7FAE62',
  water: '#7FA9B8', waterD: '#5E8A9A', tin: '#9CA3A8', tinL: '#BFC5C8', soot: '#2B1E19', ember: '#E2783C',
  cream: '#EDE6D3', white: '#FFFDF8', maroon: '#6E1F2A', mustard: '#E2B33C', teal: '#2F7C7A', blue: '#3E5C8A',
  rose: '#E8A0A8', red: '#C8323C', chili: '#C8323C', chiliD: '#9A2228', cracker: '#F3E2BC', mat: '#D9BE82', matD: '#B99A5E',
  thatch: '#C9A866', thatchD: '#A8884A', pencil: '#BEB9AE', pencilD: '#A39E92', faint: '#DCD7CB', faint2: '#E3DED3',
  shadow: '#E2D9C6', earth: '#EADBB9', earthD: '#DCC79F', lit: '#F6D493',
};

/** World point of an item-local point (ctx.glows / ctx.smoke are in world space). */
function wpush(arr, g, lx, ly, lz) { arr.push(g.tx + lx * g.tc + lz * g.ts, ly, g.tz - lx * g.ts + lz * g.tc); }

/** Keep-out helpers: a box of w x d turned by it.ry (its bounding box), a circle, nothing. */
const box = (w, d, ox = 0, oz = 0) => (it) => {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const cx = it.x + ox * c + oz * s, cz = it.z - ox * s + oz * c;
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return [{ type: 'box', minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd }];
};
const circ = (r) => (it) => [{ type: 'circle', x: it.x, z: it.z, r }];
const none = () => [];

function pot(g, x, y, z, s, col = K.clay) {
  g.box(x, y + s * 0.3, z, s * 0.8, s * 0.6, s * 0.8, col);
  g.box(x, y + s * 0.3, z, s * 0.9, s * 0.34, s * 0.9, shade(col, 1.06), Math.PI / 4);
  g.box(x, y + s * 0.66, z, s * 0.6, s * 0.14, s * 0.6, shade(col, 0.82));
  g.box(x, y + s * 0.76, z, s * 0.5, s * 0.08, s * 0.5, shade(col, 1.12));
}
function stool(g, x, z, col, h = 0.24) {
  g.box(x, h, z, 0.3, 0.05, 0.3, col);
  for (const sx of [-0.11, 0.11]) for (const sz of [-0.11, 0.11]) g.box(x + sx, h / 2, z + sz, 0.04, h, 0.04, K.woodD);
}
function lantern(g, ctx, x, y, z) {
  g.box(x, y + 0.2, z, 0.03, 0.12, 0.03, K.iron);
  g.box(x, y + 0.12, z, 0.2, 0.04, 0.2, K.iron);
  g.box(x, y, z, 0.16, 0.2, 0.16, K.lit);
  g.box(x, y - 0.12, z, 0.2, 0.04, 0.2, K.iron);
  wpush(ctx.glows, g, x, y, z);
}

// ---------------------------------------------------------------------------------------------------
function blWell(g, f, it, ctx) {
  // ရေတွင်း: a ring of brick, a stone apron, two posts and a beam with a pulley, a bucket on the rim
  f.flat(-1.5, -1.3, 1.6, 1.5, 0.004, K.shadow);
  f.flatR(0, 0.1, 2.7, 2.5, 0.006, '#D9D2C2', 0);
  f.flatR(0.9, 0.9, 0.9, 0.5, 0.008, '#C9C2B2', 0.4); // the wet patch where they pour
  const R = 0.62;
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    g.box(Math.cos(a) * R, 0.36, Math.sin(a) * R, 0.36, 0.72, 0.2, jitter(k % 3 ? K.brick : K.brickL, 0.06, k), -a + Math.PI / 2);
  }
  g.box(0, 0.74, 0, 1.0, 0.04, 1.0, K.stoneL, Math.PI / 4); // (the coping stones, as an octagon)
  g.box(0, 0.74, 0, 1.02, 0.05, 1.02, K.stone);
  g.box(0, 0.1, 0, 0.9, 0.06, 0.9, K.waterD); // the dark water down inside
  for (const sx of [-0.92, 0.92]) { g.box(sx, 1.0, 0, 0.12, 2.0, 0.12, K.woodD); g.box(sx, 0.06, 0, 0.26, 0.12, 0.26, K.stone); }
  g.box(0, 1.94, 0, 2.06, 0.12, 0.14, K.wood);
  g.box(0, 1.8, 0, 0.18, 0.18, 0.08, K.iron); // the pulley
  g.box(0, 1.25, 0, 0.02, 1.1, 0.02, '#8C7A5A'); // the rope down into the well
  // a bucket on the rim, a second one on the apron, a long tin cup on a nail
  g.box(0.55, 0.9, 0.42, 0.26, 0.26, 0.26, K.tin); g.box(0.55, 1.04, 0.42, 0.28, 0.03, 0.28, K.tinL);
  g.box(0.95, 0.13, 0.95, 0.3, 0.26, 0.3, K.teal); g.box(0.95, 0.27, 0.95, 0.32, 0.03, 0.32, shade(K.teal, 1.2));
  // the trough for washing feet and pots, carved out of a log
  g.box(-1.15, 0.2, 0.85, 0.5, 0.36, 1.2, K.woodD, 0.25);
  g.box(-1.15, 0.36, 0.85, 0.36, 0.06, 1.06, K.water, 0.25);
  lantern(g, ctx, -0.92 + 0.14, 1.62, 0.12);
  // a sign board on the right post
  g.box(0.92, 1.45, 0.08, 0.72, 0.36, 0.04, K.woodD);
  ctx.signs.push({ x: 0.92, y: 1.45, z: 0.11, w: 0.66, h: 0.3, lines: [{ text: 'ရေချိုတွင်း', size: 64 }, { text: 'ကိုယ်တိုင် ခပ်သောက်ကြည့်ပါ', size: 34, color: '#6E1F2A' }], bg: '#F3EAD6', border: null, width: 440, height: 200 });
}

function blTeaCart(g, f, it, ctx) {
  const r = rng(Math.round(it.x * 5 + it.z * 3));
  f.flat(-1.6, -1.0, 1.8, 2.2, 0.004, K.shadow);
  // the cart: a box on two bicycle wheels, a push handle, a shelf of glasses, a charcoal stove and kettle
  g.box(0, 0.78, 0, 1.6, 0.5, 0.8, K.wood);
  g.box(0, 1.05, 0, 1.7, 0.05, 0.9, K.woodL);
  g.box(0, 0.78, 0.41, 1.5, 0.4, 0.02, '#9C6844'); // the painted front board
  g.box(0, 0.78, 0.43, 1.2, 0.26, 0.02, K.cream);
  for (const sx of [-0.62, 0.62]) {
    g.box(sx, 0.32, 0.46, 0.06, 0.64, 0.64, K.soot); g.box(sx, 0.32, 0.47, 0.07, 0.36, 0.36, K.tin);
  }
  g.box(-0.95, 1.0, -0.3, 0.6, 0.04, 0.04, K.woodD, 0.3); g.box(-1.2, 1.0, -0.4, 0.04, 0.04, 0.5, K.woodD); // handle
  g.box(0.75, 0.3, -0.25, 0.06, 0.6, 0.06, K.woodD); // the prop leg
  // stove + kettle (left end), the glasses on a tray (right), a big thermos, a jar of tea leaves
  g.box(-0.45, 1.18, -0.05, 0.42, 0.22, 0.42, K.clay); g.box(-0.45, 1.18, 0.17, 0.2, 0.1, 0.02, K.ember);
  g.box(-0.45, 1.39, -0.05, 0.32, 0.2, 0.32, K.tinL); g.box(-0.45, 1.52, -0.05, 0.12, 0.06, 0.12, K.tin);
  g.boxR(-0.24, 1.45, -0.05, 0.16, 0.04, 0.04, K.tin, 0, 0, 0.6); // spout
  g.box(0.35, 1.09, 0.08, 0.6, 0.03, 0.4, K.tin);
  for (let k = 0; k < 6; k++) g.box(0.12 + (k % 3) * 0.18, 1.16, -0.02 + Math.floor(k / 3) * 0.18, 0.09, 0.12, 0.09, k === 4 ? '#C98A4A' : '#EAF0EE');
  g.box(0.72, 1.24, -0.22, 0.18, 0.34, 0.18, K.red); g.box(0.72, 1.43, -0.22, 0.12, 0.05, 0.12, K.cream);
  g.box(0.05, 1.17, -0.3, 0.2, 0.18, 0.2, '#D9E2DF'); g.box(0.05, 1.2, -0.3, 0.16, 0.08, 0.16, '#4C6A2E');
  // the sun umbrella: a pole, eight striped panels, a lantern hung from a rib
  g.box(0.1, 1.6, -0.4, 0.05, 1.3, 0.05, K.woodD);
  const UY = 2.3, UR = 1.15;
  // eight overlapping striped panels sloping down from the crown (a low cone), the ribs' tips under the rim
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    g.boxR(0.1 + Math.cos(a) * UR * 0.46, UY - 0.13 + (k % 2) * 0.012, -0.4 + Math.sin(a) * UR * 0.46, UR * 0.96, 0.04, 0.84, k % 2 ? K.cream : K.maroon, 0, -a, -0.24);
    g.box(0.1 + Math.cos(a) * UR * 0.93, UY - 0.37, -0.4 + Math.sin(a) * UR * 0.93, 0.05, 0.05, 0.05, K.woodD);
  }
  g.box(0.1, UY + 0.05, -0.4, 0.14, 0.1, 0.14, K.maroon);
  lantern(g, ctx, 0.95, 1.86, -0.15);
  // the low table and four tiny stools in front, two glasses and a plate of fritters on it
  g.box(0.2, 0.36, 1.45, 0.9, 0.04, 0.6, K.woodL);
  for (const sx of [-0.38, 0.38]) for (const sz of [-0.24, 0.24]) g.box(0.2 + sx, 0.17, 1.45 + sz, 0.05, 0.34, 0.05, K.woodD);
  g.box(0.0, 0.43, 1.42, 0.09, 0.1, 0.09, '#C98A4A'); g.box(0.42, 0.43, 1.52, 0.09, 0.1, 0.09, '#C98A4A');
  g.box(0.22, 0.395, 1.38, 0.3, 0.03, 0.22, K.white); for (let k = 0; k < 3; k++) g.box(0.14 + k * 0.08, 0.425, 1.38, 0.07, 0.03, 0.12, '#D9A047');
  [[-0.55, 1.4, K.red], [0.95, 1.45, K.teal], [0.2, 0.95, K.blue], [0.2, 2.0, K.mustard]].forEach(([x, z, c]) => stool(g, x, z, c));
  for (let k = 0; k < 5; k++) f.flatR((r() - 0.5) * 2.4, 1.3 + (r() - 0.5) * 1.2, 0.06, 0.06, 0.006, '#C9B48A', r() * 3);
  // the board on the cart's front: taste first
  ctx.signs.push({ x: 0, y: 0.78, z: 0.445, w: 1.16, h: 0.24, lines: [{ text: 'လက်ဖက်ရည် · အရင် မြည်းကြည့်ပါ', size: 40 }, { text: 'Tea · taste it first', size: 24, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: '#EDE6D3', border: null, width: 600, height: 124 });
}

function blFence(g, f, it) {
  // a woven bamboo fence along local x (-len/2 .. len/2); the last `pencil` fraction only drawn in pencil
  const L = it.len || 6, P = it.pencil || 0, xb = L / 2 - L * P;
  const step = 1.2;
  for (let x = -L / 2; x <= L / 2 + 0.01; x += step) {
    if (x <= xb + 0.01) { g.box(x, 0.55, 0, 0.09, 1.1, 0.09, K.bambooD); g.box(x, 1.12, 0, 0.11, 0.04, 0.11, K.bamboo); }
    else { f.box(x, 0.55, 0, 0.03, 1.1, 0.03, K.pencil); f.flatR(x, 0, 0.12, 0.12, 0.005, K.faint, 0); } // a pencil post: a drawn line, no ink outline
  }
  const x0 = -L / 2, x1 = Math.max(x0, xb);
  if (x1 > x0) {
    const w = x1 - x0, cx = (x0 + x1) / 2;
    g.box(cx, 0.95, 0, w, 0.05, 0.06, K.bamboo); g.box(cx, 0.35, 0, w, 0.05, 0.06, K.bamboo);
    g.box(cx, 0.62, 0, w, 0.5, 0.03, K.bambooL); // the woven panel
    for (let x = x0 + 0.15; x < x1; x += 0.3) g.box(x, 0.62, 0.018, 0.05, 0.5, 0.01, K.bambooD); // the weave's dark ribs
    f.flatR(cx, 0.12, w, 0.3, 0.004, K.shadow, 0);
  }
  if (P > 0) { // the planned rest of it: two thin pencil rails and the line along the ground
    const w = L / 2 - xb, cx = (xb + L / 2) / 2;
    f.box(cx, 0.95, 0, w, 0.022, 0.022, K.pencil); f.box(cx, 0.35, 0, w, 0.022, 0.022, K.pencil);
    f.flatR(cx, 0, w, 0.03, 0.005, K.pencilD, 0);
    for (let k = 0; k < Math.floor(w / 0.5); k++) f.flatR(xb + 0.25 + k * 0.5, 0.18, 0.03, 0.24, 0.005, K.faint2, 0.6); // hatching
  }
}
const fenceObs = (it) => {
  const L = (it.len || 6) * (1 - (it.pencil || 0)); // only the built part keeps feet out
  const ox = -(it.len || 6) / 2 + L / 2;
  return box(L, 0.3, ox, 0)(it);
};

function blGate(g, f, it, ctx) {
  for (const sx of [-0.85, 0.85]) { g.box(sx, 0.95, 0, 0.14, 1.9, 0.14, K.bambooD); g.box(sx, 0.06, 0, 0.26, 0.12, 0.26, K.stone); }
  g.box(0, 1.86, 0, 2.0, 0.08, 0.1, K.bamboo);
  g.box(0, 1.98, 0, 2.2, 0.06, 0.12, K.bambooD);
  for (let k = 0; k < 5; k++) g.box(-0.6 + k * 0.3, 1.97 + (k % 2) * 0.04, 0.02, 0.18, 0.12, 0.16, k % 2 ? K.leaf : K.leafD); // a creeper on the bar
  g.box(-0.4, 2.0, 0.04, 0.1, 0.1, 0.1, K.rose); g.box(0.45, 2.02, 0.04, 0.1, 0.1, 0.1, K.rose);
  // the gate swung open inward (west leaf, a woven panel on a frame)
  g.boxR(-0.85 + 0.38 * Math.cos(1.2), 0.6, -0.38 * Math.sin(1.2), 0.78, 0.8, 0.04, K.bambooL, 0, 1.2, 0);
  lantern(g, ctx, 0.6, 1.64, 0.06);
}

function blBanana(g, f, it) {
  const r = rng(it.seed || 3);
  f.flatR(0, 0, 1.6, 1.4, 0.004, K.shadow, 0.3);
  const n = 3 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = i ? 0.25 + r() * 0.25 : 0, h = (i ? 1.3 + r() * 0.6 : 2.0), x = Math.cos(a) * d, z = Math.sin(a) * d;
    g.box(x, h / 2, z, 0.2, h, 0.2, jitter(K.bananaD, 0.08, i));
    g.box(x, 0.15, z, 0.28, 0.3, 0.28, K.trunk);
    for (let k = 0; k < 5; k++) {
      const la = k * 1.3 + i, lr = 0.5;
      g.boxR(x + Math.cos(la) * lr, h + 0.05 - (k % 2) * 0.12, z + Math.sin(la) * lr, 1.05, 0.04, 0.32, jitter(k % 2 ? K.banana : K.bananaL, 0.06, k + i * 5), 0, -la, -0.42);
    }
    if (i === 0) { g.box(x + 0.18, h - 0.35, z + 0.1, 0.18, 0.36, 0.18, '#9DBF4A'); g.box(x + 0.18, h - 0.6, z + 0.1, 0.1, 0.16, 0.1, K.maroon); }
  }
}

function blTree(g, f, it) {
  const r = rng(it.seed || 7), s = it.s || 1;
  f.flatR(0.3, 0.2, 3.0 * s, 2.6 * s, 0.004, K.shadow, 0.4);
  g.box(0, 0.9 * s, 0, 0.32 * s, 1.8 * s, 0.32 * s, K.trunk);
  g.box(0, 0.12, 0, 0.5 * s, 0.24, 0.5 * s, K.trunkD);
  g.boxR(0.32 * s, 1.75 * s, 0, 0.16 * s, 0.7 * s, 0.16 * s, K.trunk, 0, 0, -0.6);
  const cols = [K.canopyD, K.canopy, K.canopyL];
  for (let k = 0; k < 4; k++) {
    const x = (r() - 0.5) * 0.9 * s, z = (r() - 0.5) * 0.8 * s, y = (2.25 + k * 0.32) * s, w = (2.1 - k * 0.38) * s;
    g.box(x, y, z, w, 0.62 * s, w * 0.9, jitter(cols[Math.min(2, k)], 0.05, k), r() * 0.5);
  }
  for (let k = 0; k < 6; k++) f.flatR((r() - 0.5) * 2.4 * s, (r() - 0.5) * 2 * s, 0.12, 0.07, 0.006, k % 2 ? '#A9B77A' : '#C9A24A', r() * 3); // leaves fallen
}

function blCart(g, f, it) {
  f.flat(-1.4, -1.1, 2.4, 1.1, 0.004, K.shadow);
  // two big spoked wheels, the axle, a plank bed with side rails, the shafts resting on a block
  for (const sz of [-0.78, 0.78]) {
    const o = Math.sign(sz), R = 0.58, seg = 2 * R * Math.sin(Math.PI / 10) * 1.08;
    for (let k = 0; k < 10; k++) { // the rim, ten felloes
      const a = (k / 10) * Math.PI * 2;
      g.boxR(Math.cos(a) * R, 0.62 + Math.sin(a) * R, sz, seg, 0.1, 0.1, K.woodD, 0, 0, a + Math.PI / 2);
    }
    for (let k = 0; k < 5; k++) g.boxR(0, 0.62, sz + o * 0.01, 1.08, 0.05, 0.05, K.wood, 0, 0, (k * Math.PI) / 5); // spokes
    g.box(0, 0.62, sz + o * 0.03, 0.2, 0.2, 0.12, K.iron);
  }
  g.box(0, 0.62, 0, 0.1, 0.1, 1.66, K.iron);
  g.boxMin(-1.0, 0.8, -0.65, 1.0, 0.9, 0.65, K.woodL);
  for (const sz of [-0.66, 0.66]) g.box(0, 1.08, sz, 2.0, 0.06, 0.05, K.wood);
  for (let x = -0.9; x <= 0.91; x += 0.45) for (const sz of [-0.66, 0.66]) g.box(x, 0.99, sz, 0.05, 0.22, 0.05, K.woodD);
  for (const sz of [-0.42, 0.42]) g.boxR(1.75, 0.55, sz, 1.65, 0.07, 0.07, K.wood, 0, 0, 0.32);
  g.box(2.5, 0.14, 0, 0.36, 0.28, 1.0, K.woodD); // the block the shafts rest on
  // the load: two sacks, a rolled mat, a bundle in blue cloth, a cloth thrown over the back half
  g.box(-0.5, 1.06, -0.25, 0.56, 0.34, 0.4, '#D6C7A2'); g.box(-0.5, 1.06, 0.25, 0.5, 0.3, 0.38, '#CDBB94');
  g.boxR(0.3, 1.02, 0, 0.26, 0.26, 1.14, K.mat, Math.PI / 4, 0, 0);
  g.box(0.68, 1.06, 0.2, 0.42, 0.32, 0.4, K.blue); g.box(0.68, 1.24, 0.2, 0.12, 0.08, 0.42, shade(K.blue, 0.8));
  g.boxR(-0.62, 1.3, 0, 0.7, 0.04, 1.42, '#B5643C', 0, 0, 0.12); // a cloth thrown over the back half, its end hanging
  g.boxMin(-1.03, 0.92, -0.71, -0.97, 1.27, 0.71, shade('#B5643C', 0.86));
}

function blBundles(g, f, it) {
  const r = rng(it.seed || 5);
  f.flat(-1.0, -0.6, 1.1, 0.6, 0.004, K.shadow);
  g.box(-0.45, 0.22, -0.05, 0.8, 0.44, 0.5, '#3E6E8A'); g.box(-0.45, 0.45, -0.05, 0.82, 0.04, 0.52, '#2F5670'); // a tin trunk
  g.box(-0.45, 0.3, 0.21, 0.12, 0.1, 0.02, K.mustard);
  g.boxR(-0.4, 0.58, -0.05, 0.22, 0.22, 0.78, K.mat, 0, Math.PI / 2, Math.PI / 4); // a rolled mat on it
  // a carrying pole across two baskets
  for (const sx of [0.25, 0.95]) { g.box(sx, 0.2, 0.05, 0.46, 0.4, 0.46, jitter(K.bamboo, 0.05, sx * 10)); g.box(sx, 0.38, 0.05, 0.5, 0.05, 0.5, K.bambooD); g.box(sx, 0.48, 0.05, 0.34, 0.14, 0.34, r() < 0.5 ? '#8DBA6E' : '#E9862E'); }
  g.boxR(0.6, 0.72, 0.05, 1.5, 0.05, 0.05, K.bambooD, 0, 0, 0.04);
  for (const sx of [0.25, 0.95]) for (const sz of [-0.15, 0.25]) g.box(sx, 0.6, sz, 0.015, 0.25, 0.015, '#8C7A5A');
}

function blStove(g, f, it, ctx) {
  f.flatR(0, 0, 1.6, 1.3, 0.004, '#DCCFB4', 0);
  g.box(0, 0.22, 0, 0.62, 0.44, 0.56, K.clay);
  g.box(0, 0.44, 0, 0.66, 0.06, 0.6, K.clayD);
  g.box(0, 0.18, 0.29, 0.26, 0.2, 0.02, K.soot); g.box(0, 0.14, 0.3, 0.16, 0.08, 0.02, K.ember);
  g.box(0, 0.62, 0, 0.44, 0.32, 0.44, K.soot); g.box(0, 0.8, 0, 0.48, 0.04, 0.48, K.iron); // the rice pot and lid
  g.box(0, 0.85, 0, 0.08, 0.05, 0.08, K.iron);
  for (let k = 0; k < 4; k++) g.boxR(0.05 + k * 0.05, 0.1, 0.55 + k * 0.04, 0.07, 0.07, 0.6, k % 2 ? K.woodD : K.wood, 0, 0.3 + k * 0.15, 0); // sticks fed in
  g.box(-0.62, 0.1, 0.25, 0.3, 0.06, 0.28, K.woodL); for (const sx of [-0.1, 0.1]) g.box(-0.62 + sx, 0.04, 0.25, 0.04, 0.08, 0.24, K.woodD); // squat stool
  g.box(0.62, 0.08, -0.1, 0.36, 0.16, 0.36, K.tinL); g.box(0.62, 0.17, -0.1, 0.3, 0.02, 0.3, K.water); // a basin of washed rice water
  g.boxR(0.6, 0.25, 0.3, 0.06, 0.04, 0.42, K.woodD, 0, 0.6, 0); // a ladle on the side
}

function blCoop(g, f) {
  f.flat(-0.8, -0.6, 0.9, 0.7, 0.004, K.shadow);
  g.box(0, 0.38, 0, 1.2, 0.56, 0.8, '#B5995E');
  for (let x = -0.55; x <= 0.56; x += 0.11) g.box(x, 0.38, 0.41, 0.04, 0.56, 0.02, K.bambooD);
  for (const sx of [-0.58, 0.58]) for (const sz of [-0.38, 0.38]) g.box(sx, 0.05, sz, 0.08, 0.1, 0.08, K.woodD);
  g.boxR(0, 0.78, -0.12, 1.4, 0.1, 0.7, K.thatch, -0.3, 0, 0); g.boxR(0, 0.78, 0.3, 1.4, 0.08, 0.36, K.thatchD, 0.35, 0, 0);
  g.box(0.3, 0.38, 0.42, 0.26, 0.26, 0.02, '#4E3828'); // the little door
  g.box(-0.4, 0.04, 0.68, 0.32, 0.06, 0.24, K.clay); g.box(-0.4, 0.075, 0.68, 0.26, 0.01, 0.18, K.water);
  g.box(0.5, 0.03, 0.72, 0.4, 0.04, 0.3, K.bamboo); for (let k = 0; k < 6; k++) g.box(0.36 + k * 0.05, 0.06, 0.66 + (k % 2) * 0.08, 0.03, 0.02, 0.03, K.mustard);
}

function blHopscotch(g, f, it) {
  // drawn in soft pencil straight on the leaf: squares 1..8 in a child's hand, a flat stone, the pencil itself
  const c = '#A8A296', y = 0.005, t = 0.035, S = 0.5;
  const sq = (cx, cz) => { f.flatR(cx, cz - S / 2, S, t, y, c, 0); f.flatR(cx, cz + S / 2, S, t, y, c, 0); f.flatR(cx - S / 2, cz, t, S, y, c, 0); f.flatR(cx + S / 2, cz, t, S, y, c, 0); };
  const cells = [[0, 0], [0, -S], [-S / 2, -2 * S], [S / 2, -2 * S], [0, -3 * S], [-S / 2, -4 * S], [S / 2, -4 * S], [0, -5 * S]];
  cells.forEach(([x, z]) => sq(x, z));
  // the numbers, as little tick strokes (one per count, so no font is needed)
  cells.forEach(([x, z], i) => { for (let k = 0; k <= i % 4; k++) f.flatR(x - 0.1 + k * 0.06, z, 0.025, 0.14, y + 0.001, '#8E887C', 0.2); });
  // the half-round "home" at the top
  for (let k = 0; k < 7; k++) { const a = Math.PI + (k / 6) * Math.PI; f.flatR(Math.cos(a) * 0.4, -5.5 * S - 0.15 + Math.sin(a) * 0.35, 0.16, t, y, c, -a + Math.PI / 2); }
  g.box(0.06, 0.03, -2 * S, 0.14, 0.05, 0.11, '#9C9384', 0.4); // the stone, tossed onto square three
  // the pencil they drew it with, put down beside
  g.boxR(0.7, 0.04, 0.2, 0.06, 0.06, 0.46, '#E8B832', 0, 0.5, 0); g.boxR(0.81, 0.04, 0.39, 0.04, 0.04, 0.08, '#EBD3A8', 0, 0.5, 0);
  for (let k = 0; k < 10; k++) f.flatR(0.6 + (k % 3) * 0.2 - 0.6, 0.55 + Math.floor(k / 3) * 0.16, 0.08, 0.12, 0.005, K.faint, 0.4); // where small feet hopped
}

function blCobbler(g, f, it, ctx) {
  f.flatR(0, 0, 1.7, 1.2, 0.005, K.mat, 0);
  for (let k = 0; k < 6; k++) f.flatR(-0.7 + k * 0.28, 0, 0.03, 1.2, 0.006, K.matD, 0);
  // pairs of sandals in a row (one pair waiting with its strap off), a wooden last, a tool box, a stool
  const cols = ['#6E4E36', K.maroon, '#3E5C8A', '#2B2622', '#B5643C'];
  for (let k = 0; k < 5; k++) for (const sx of [-0.06, 0.06]) {
    const x = -0.62 + k * 0.28 + sx, z = 0.35;
    g.box(x, 0.02, z, 0.09, 0.03, 0.24, cols[k]);
    if (k !== 2 || sx < 0) g.box(x, 0.05, z - 0.03, 0.09, 0.03, 0.02, shade(cols[k], 1.3));
  }
  g.boxR(0.12, 0.06, 0.58, 0.02, 0.01, 0.3, cols[2], 0, 0.8, 0); // the loose strap
  g.box(0.42, 0.13, -0.22, 0.4, 0.22, 0.26, K.woodD); g.box(0.42, 0.25, -0.22, 0.42, 0.03, 0.28, K.wood);
  g.box(0.32, 0.29, -0.22, 0.04, 0.06, 0.18, K.iron); g.box(0.5, 0.3, -0.24, 0.12, 0.04, 0.04, K.iron); // hammer, awl
  g.box(-0.2, 0.12, -0.25, 0.08, 0.24, 0.08, K.woodD); g.box(-0.2, 0.26, -0.22, 0.12, 0.06, 0.24, K.wood); // the last
  stool(g, -0.6, -0.3, K.woodL, 0.2);
  // her little sign on a stake at the mat's corner
  g.box(0.78, 0.4, 0.5, 0.05, 0.8, 0.05, K.woodD);
  g.box(0.78, 0.78, 0.53, 0.62, 0.26, 0.03, K.woodD);
  ctx.signs.push({ x: 0.78, y: 0.78, z: 0.55, w: 0.56, h: 0.21, lines: [{ text: 'ဖိနပ် ပြင်သည်', size: 60 }, { text: 'sandals mended', size: 30, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: '#F3EAD6', border: null, width: 400, height: 150 });
}

function blBeans(g, f, it) {
  const r = rng(it.seed || 11);
  f.flat(-1.3, -0.9, 1.3, 0.9, 0.004, '#B9946A');
  for (let row = 0; row < 3; row++) {
    const z = -0.6 + row * 0.6;
    f.flat(-1.2, z - 0.14, 1.2, z + 0.14, 0.006, '#9E7A52');
    for (let k = 0; k < 4; k++) {
      const x = -0.95 + k * 0.62;
      g.boxR(x, 0.75, z, 0.03, 1.5, 0.03, K.bambooD, 0.08, 0, 0.08); g.boxR(x + 0.04, 0.75, z, 0.03, 1.5, 0.03, K.bambooD, -0.08, 0, -0.08);
      for (let h = 0; h < 4; h++) g.box(x + (h % 2 ? 0.05 : -0.04), 0.25 + h * 0.3 + r() * 0.08, z + (r() - 0.5) * 0.06, 0.16, 0.14, 0.12, jitter(h % 2 ? K.leaf : K.leafD, 0.06, h + k * 4 + row * 16));
      if (row !== 1) g.box(x + 0.06, 0.6 + r() * 0.4, z + 0.07, 0.03, 0.18, 0.03, '#9DBF4A');
    }
  }
  g.box(1.45, 0.15, 0.7, 0.3, 0.26, 0.2, '#5E8A6A'); g.boxR(1.68, 0.24, 0.7, 0.26, 0.04, 0.04, '#5E8A6A', 0, 0, 0.6); // watering can
}

function blBlock(g, f) {
  f.flatR(0, 0, 1.8, 1.3, 0.004, '#DCCFB4', 0);
  g.box(0, 0.22, 0, 0.56, 0.44, 0.56, K.trunk); g.box(0, 0.445, 0, 0.5, 0.01, 0.5, '#D9B98C');
  g.boxR(0.06, 0.55, 0.05, 0.08, 0.22, 0.2, '#9C9384', 0, 0, 0.1); g.boxR(-0.08, 0.6, 0.05, 0.05, 0.05, 0.5, K.woodD, 0.4, 0, 0); // the axe, left bitten into the block
  for (let k = 0; k < 14; k++) g.boxR(0.7 + (k % 4) * 0.14, 0.06 + Math.floor(k / 4) * 0.11, -0.2 + (k % 3) * 0.12, 0.09, 0.09, 0.55, k % 3 ? '#D9B98C' : K.woodL, 0, 0.2 + (k % 3) * 0.05, 0);
  g.box(-0.7, 0.18, 0.2, 0.44, 0.36, 0.44, K.bamboo); g.box(-0.7, 0.38, 0.2, 0.48, 0.04, 0.48, K.bambooD);
  for (let k = 0; k < 4; k++) g.boxR(-0.7, 0.42, 0.2 + (k - 1.5) * 0.08, 0.06, 0.06, 0.5, '#D9B98C', 0, 0.2 * k, 0);
  for (let k = 0; k < 10; k++) f.flatR(-0.4 + (k % 5) * 0.2, 0.45 + Math.floor(k / 5) * 0.2, 0.1, 0.03, 0.006, '#C9A877', k);
}

function blWashLine(g, f, it) {
  const L = it.len || 3.6;
  for (const sx of [-L / 2, L / 2]) { g.box(sx, 0.9, 0, 0.08, 1.8, 0.08, K.bambooD); g.box(sx, 0.05, 0, 0.2, 0.1, 0.2, K.stone); }
  g.box(0, 1.72, 0, L, 0.02, 0.02, '#5A4A3A');
  const cols = ['#2F7C7A', '#E8A0A8', '#EDE6D3', '#3E5C8A', '#E2B33C', '#C8644A', '#8E3B46'];
  const r = rng(Math.round(L * 10 + (it.seed || 1)));
  for (let x = -L / 2 + 0.35, k = 0; x < L / 2 - 0.3; k++) {
    const w = 0.35 + r() * 0.35, h = 0.45 + r() * 0.5, c = cols[(k + (it.seed || 0)) % cols.length];
    g.box(x + w / 2, 1.7 - h / 2, 0, w, h, 0.02, c);
    if (k % 2) g.box(x + w / 2, 1.7 - h * 0.6, 0.011, w, 0.06, 0.005, shade(c, 0.8)); // a checked band
    g.box(x + 0.04, 1.73, 0, 0.03, 0.06, 0.04, K.woodL);
    x += w + 0.12;
  }
  g.box(L / 2 - 0.5, 0.15, 0.4, 0.5, 0.3, 0.36, K.bamboo); g.box(L / 2 - 0.5, 0.31, 0.4, 0.4, 0.04, 0.3, '#EDE6D3');
  f.flatR(0, 0.2, L, 0.6, 0.004, '#E4DED0', 0);
}

function blDryMat(g, f, it) {
  f.flatR(0, 0, 1.6, 1.1, 0.006, K.mat, 0);
  for (let k = 0; k < 6; k++) f.flatR(-0.65 + k * 0.26, 0, 0.03, 1.1, 0.007, K.matD, 0);
  const r = rng(Math.round(it.x * 9 + it.z * 2));
  const crackers = it.load === 'crackers';
  for (let k = 0; k < 28; k++) {
    const x = (r() - 0.5) * 1.4, z = (r() - 0.5) * 0.9;
    if (crackers) g.box(x, 0.02, z, 0.14, 0.02, 0.14, r() < 0.3 ? '#EFD49A' : K.cracker, r() * 2);
    else g.box(x, 0.025, z, 0.05, 0.04, 0.14, r() < 0.4 ? K.chiliD : K.chili, r() * 3);
  }
  g.box(0.95, 0.06, 0.4, 0.5, 0.06, 0.5, K.bamboo); g.box(0.95, 0.1, 0.4, 0.4, 0.02, 0.4, K.matD); // a winnowing tray
}

function blRainJars(g, f) {
  f.flat(-1.3, -0.5, 1.3, 0.5, 0.004, K.shadow);
  [-0.8, 0, 0.8].forEach((x, k) => {
    const s = k === 1 ? 1.05 : 0.9;
    g.box(x, 0.45 * s, 0, 0.62 * s, 0.9 * s, 0.62 * s, k === 1 ? K.glazeL : K.glaze);
    g.box(x, 0.45 * s, 0, 0.7 * s, 0.5 * s, 0.7 * s, shade(K.glaze, 1.12), Math.PI / 4);
    g.box(x, 0.94 * s, 0, 0.46 * s, 0.08, 0.46 * s, K.wood);
    g.box(x, 0.99 * s, 0, 0.1, 0.05, 0.1, K.woodD);
  });
  g.boxR(0.3, 1.05, 0.05, 0.05, 0.04, 0.4, K.woodD, 0, 0.4, 0); g.box(0.42, 1.06, 0.22, 0.12, 0.06, 0.12, '#9C6844'); // the coconut-shell dipper
}

function blPencilTown(g, f, it) {
  // pencil streets for a town that is not written yet: two faint lines along it.pts (WORLD points), the plots
  // along them squared off in pencil, a few ticked (someone has paced them out themselves)
  const pts = it.pts, W = (it.w || 4) / 2, y = 0.0045, c = '#D6D1C5', c2 = '#E1DCD1', t = 0.045;
  const r = rng(it.seed || 2);
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
    const L = Math.hypot(x1 - x0, z1 - z0), tx = (x1 - x0) / L, tz = (z1 - z0) / L, ang = Math.atan2(tx, tz);
    const mx = (x0 + x1) / 2 - it.x, mz = (z0 + z1) / 2 - it.z;
    for (const sd of [-1, 1]) f.flatR(mx - tz * W * sd, mz + tx * W * sd, t, L + 0.6, y, c, ang);
    // the plots: squares off both sides every 6 m, a tick in some
    for (let s = 3; s < L - 2; s += 6) for (const sd of [-1, 1]) {
      const cx = x0 + tx * s - it.x - tz * (W + 2.6) * sd, cz = z0 + tz * s - it.z + tx * (W + 2.6) * sd, P = 2.1;
      f.flatR(cx + tx * P, cz + tz * P, 0.03, 4.2, y, c2, ang + Math.PI / 2);
      f.flatR(cx - tx * P, cz - tz * P, 0.03, 4.2, y, c2, ang + Math.PI / 2);
      f.flatR(cx - tz * 2.1 * sd, cz + tx * 2.1 * sd, 0.03, 4.2, y, c2, ang);
      if (r() < 0.35) { f.flatR(cx - 0.12, cz + 0.05, 0.05, 0.32, y + 0.001, '#B9B3A6', ang + 0.8); f.flatR(cx + 0.1, cz - 0.08, 0.05, 0.6, y + 0.001, '#B9B3A6', ang - 0.6); }
    }
  }
}

function blPots(g, f, it) {
  const n = it.n || 4, r = rng(Math.round(it.x * 3 + it.z * 11));
  for (let k = 0; k < n; k++) {
    const x = (k - (n - 1) / 2) * 0.55, s = 0.6 + r() * 0.3;
    pot(g, x, 0, 0, s * 0.6);
    g.box(x, s * 0.5, 0, s * 0.42, s * 0.22, s * 0.42, k % 2 ? K.leaf : K.leafD);
    g.box(x + 0.04, s * 0.66, 0.02, s * 0.24, s * 0.16, s * 0.24, K.leafL);
    if (k % 2 === 0) g.box(x - 0.05, s * 0.72, 0.06, 0.08, 0.08, 0.08, [K.rose, K.mustard, '#E9862E'][k % 3]);
  }
}

/** PROP kinds (regions/blank.js registers them as they are: the `bl` prefix is already theirs). */
export const LIFE_PROP = {
  blWell: { draw: blWell, obstacles: (it) => [{ type: 'circle', x: it.x, z: it.z, r: 0.95 }, ...box(0.6, 1.3, -1.15, 0.85)(it)] },
  blTeaCart: { draw: blTeaCart, obstacles: (it) => [...box(1.9, 1.1)(it), ...box(1.0, 0.7, 0.2, 1.45)(it)] },
  blFence: { draw: blFence, obstacles: fenceObs },
  blGate: { draw: blGate, obstacles: (it) => { const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0); return [-0.85, 0.85].map((d) => ({ type: 'circle', x: it.x + d * c, z: it.z - d * s, r: 0.14 })); } },
  blBanana: { draw: blBanana, obstacles: circ(0.45) },
  blTree: { draw: blTree, obstacles: (it) => [{ type: 'circle', x: it.x, z: it.z, r: 0.3 * (it.s || 1) }] },
  blCart: { draw: blCart, obstacles: box(4.0, 1.8, 0.5, 0) },
  blBundles: { draw: blBundles, obstacles: box(2.0, 0.8, 0.1, 0) },
  blStove: { draw: blStove, obstacles: box(1.0, 0.8) },
  blCoop: { draw: blCoop, obstacles: box(1.3, 0.9) },
  blHopscotch: { draw: blHopscotch, obstacles: none },
  blCobbler: { draw: blCobbler, obstacles: none },
  blBeans: { draw: blBeans, obstacles: box(2.5, 1.7) },
  blBlock: { draw: blBlock, obstacles: box(1.0, 0.7) },
  blWashLine: { draw: blWashLine, obstacles: (it) => { const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0), L = (it.len || 3.6) / 2; return [{ type: 'circle', x: it.x - L * c, z: it.z + L * s, r: 0.12 }, { type: 'circle', x: it.x + L * c, z: it.z - L * s, r: 0.12 }]; } },
  blDryMat: { draw: blDryMat, obstacles: none },
  blRainJars: { draw: blRainJars, obstacles: box(2.4, 0.8) },
  blPencilTown: { draw: blPencilTown, obstacles: none },
  blPots: { draw: blPots, obstacles: (it) => box((it.n || 4) * 0.55, 0.5)(it) },
};
