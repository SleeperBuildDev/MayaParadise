// The Envelope Market's street life: the small things that make its lanes lived in at walking height, and the
// one landmark the day scripts never needed (the stamp printers' hall). Drawn into the open world's merged chunk
// meshes like market-art.js (g = outlined solids, f = flat decals / tiny bits); fronts face +Z, feet at y = 0.
// Imported by regions/market.js (merged into its ART / PROP). Imports only kit.js / toon.js / voxel.js.
// Original art; every Burmese string is a draft for Maya.
//
// ART:
//   stampHall { w, d }        the stamp printers' hall: sawtooth roof, a press seen through the open loading bay,
//                             sheets drying on the gallery. No room behind it (its loading bay is a half-shut shutter).
// PROP:
//   folk { pose, seed, hold, stool }  a townsperson at work, still (merged; costs no draw call): pose 'stand' | 'sit' |
//                             'squat' | 'sweep' | 'carry' | 'head' (basket on the head) | 'kid' | 'read' | 'pour'
//   waterPots { sign? }       the roadside drinking-water stand: clay pots under a little roof, a tin cup on a cord
//   bambooFence { len, gate? } a low split-bamboo yard fence (gate: a gap with two taller posts)
//   foodCart { kind, seed }   a push cart under a parasol: 'mohinga' | 'cane' (sugar-cane press) | 'fritter'
//   aFrame { lines }          a chalk A-frame board on the footpath (a price list, never directions)
//   bananas { seed }          a clump of banana plants (yards)
//   sapling { seed, s }       a young tree in a woven guard (yards, kerbs)
//   baskets { seed }          a stack of bamboo baskets and winnowing trays
//   potRack { seed }          clay pots and jars drying on a plank rack
//   hopscotch                 chalk squares on the paper (children's)
//   kiteUp { h, seed }        a kite high on its line, the line down to the hand that holds it (static)
//   stoolRow { n, seed }      a row of tiny tea stools along a wall
//   drain { len }             a kerbside drain cover strip (decal)
import { PALETTE } from '../../../game/toon.js';
import { jitter } from '../../../game/voxel.js';
import { shade, rng } from '../kit.js';

const K = {
  wood: PALETTE.wood, woodD: PALETTE.woodDark, woodL: '#CDA577', ink: PALETTE.ink, cream: '#F6EEDB', white: PALETTE.white,
  red: '#C8323C', redD: '#9C2832', blue: '#2F5DB3', teal: '#3E8C8A', green: '#4F8A4F', gold: PALETTE.gold, goldD: PALETTE.goldDeep,
  mustard: '#E2B33C', maroon: PALETTE.maroon, terra: '#B5643C', terraL: '#CB7E4E', terraD: '#8E4A2C', brick: '#A0503A', brickD: '#7E3C2B',
  stone: '#C4BBA8', stoneD: '#9F9683', tin: '#B3B0A6', tinD: '#8C8981', iron: '#4A3B30', dark: '#3A2E25', shadow: '#E3D8BE',
  bamboo: '#C9B26A', bambooD: '#A89148', leaf: PALETTE.leaf, leafD: PALETTE.leafDark, leafL: '#8DBA6E', kraft: '#D6B486', kraftD: '#B8935F',
  glass: '#BFD3E0', pink: '#E8A0A8', sky: '#9CC3DE', chalk: '#3E4A3F', envL: '#F5EBD6', twine: '#B89A6A', rice: '#F7F3E8',
};
const SKIN = ['#F3CBAA', '#E8B48E', '#D9A077', '#C68A63', '#B47A55'];
const HAIR = ['#1F1B1B', '#1F1B1B', '#3E2A20', '#B9B3A8'];
const TOPS = ['#F4EFE4', '#E9DFC9', '#7A2533', '#D97C8A', '#D9A93B', '#7FB0CF', '#2F7C7A', '#E0795A', '#5E8F4E', '#8E8A84', '#EDB82E'];
const BOTS = ['#2E3D63', '#7A5434', '#6B3E64', '#2F7C7A', '#7A2533', '#3A3634', '#7A7A3A', '#C9A576'];

const wx = (g, x, z) => g.tx + x * g.tc + z * g.ts;
const wz = (g, x, z) => g.tz - x * g.ts + z * g.tc;

// ---------------------------------------------------------------------------------
// folk: a still townsperson, people.js proportions (blocky, a little simpler), merged into the chunk
// ---------------------------------------------------------------------------------
function folk(g, f, it) {
  const r = rng(it.seed || 7), pose = it.pose || 'stand';
  const kid = pose === 'kid', s = kid ? 0.72 : 1;
  const skin = SKIN[Math.floor(r() * SKIN.length)], hair = HAIR[Math.floor(r() * HAIR.length)];
  const top = it.top || TOPS[Math.floor(r() * TOPS.length)], bot = it.bottom || BOTS[Math.floor(r() * BOTS.length)];
  const woman = it.woman ?? r() < 0.5;
  const sit = pose === 'sit' || pose === 'read' || pose === 'pour', squat = pose === 'squat';
  f.flatR(0, 0, 0.62 * s, 0.5 * s, 0.006, '#D9CBAE', 0);
  // legs / longyi: standing is one column to the ankles; sitting folds the longyi forward over a stool
  const hipY = sit ? 0.42 : squat ? 0.32 : 0.78 * s;
  if (sit) {
    if (it.stool !== false) { // its own stool (false: it sits on something already drawn: a bench, a stall stool)
      const sc = it.stool || [K.red, K.blue, K.green][Math.floor(r() * 3)];
      g.box(0, 0.24, 0, 0.3, 0.05, 0.3, sc);
      g.box(0, 0.11, 0, 0.22, 0.22, 0.22, shade(sc, 0.8));
    }
    g.box(0, hipY, 0.08, 0.36, 0.16, 0.42, bot); // lap
    g.box(0, 0.2, 0.26, 0.34, 0.36, 0.12, bot); // shins under the longyi
    g.box(0, 0.03, 0.32, 0.32, 0.06, 0.16, K.dark); // sandals
  } else if (squat) {
    g.box(0, 0.2, 0.04, 0.4, 0.34, 0.36, bot);
    g.box(0, 0.03, 0.14, 0.34, 0.06, 0.2, K.dark);
  } else {
    g.box(0, hipY / 2 + 0.03, 0, 0.34 * s, hipY - 0.03, 0.24 * s, bot);
    if (!woman && !kid) g.box(0, hipY - 0.06, 0.125 * s, 0.1, 0.1, 0.02, shade(bot, 0.75)); // the longyi knot
    g.box(-0.08 * s, 0.03, 0.03, 0.12 * s, 0.06, 0.24 * s, K.dark);
    g.box(0.08 * s, 0.03, 0.03, 0.12 * s, 0.06, 0.24 * s, K.dark);
  }
  // body
  const tw = 0.4 * s, th = (kid ? 0.42 : 0.5), ty = hipY + th / 2;
  const lean = pose === 'sweep' ? 0.25 : pose === 'read' ? 0.15 : squat ? 0.3 : 0;
  g.boxR(0, ty, lean * 0.3, tw, th, 0.26 * s, top, lean, 0, 0);
  // arms: down at the sides, or at work
  const ay = ty + th / 2 - 0.05, ax = tw / 2 + 0.06;
  const arm = (sx, rx, rz = 0) => g.boxR(sx * ax, ay - 0.2 * s, 0.04 + Math.sin(rx) * 0.2, 0.11 * s, 0.42 * s, 0.11 * s, top, rx, 0, rz);
  const hand = (x, y, z) => g.box(x, y, z, 0.1 * s, 0.1 * s, 0.1 * s, skin);
  if (pose === 'sweep') {
    arm(-1, -0.9); arm(1, -0.7);
    g.boxR(0.05, 0.62, 0.42, 0.04, 1.2, 0.04, K.woodL, 0.55, 0, 0.1); // the broom handle
    g.boxR(0.0, 0.08, 0.78, 0.36, 0.16, 0.08, K.bambooD, 0.4, 0, 0); // its head
  } else if (pose === 'carry') {
    arm(-1, 0); arm(1, -2.6);
    g.box(0.18, ty + th / 2 + 0.16, -0.02, 0.5, 0.32, 0.36, it.load || K.rice); // a sack on the shoulder
    g.box(0.18, ty + th / 2 + 0.34, -0.02, 0.2, 0.06, 0.18, K.twine);
  } else if (pose === 'head') {
    arm(-1, -2.9); arm(1, 0);
    const c = it.load || K.mustard;
    g.box(0, ty + th / 2 + 0.36, 0, 0.62, 0.12, 0.62, K.bambooD); // the flat basket on her head
    for (let k = 0; k < 4; k++) f.box(-0.14 + (k % 2) * 0.28, ty + th / 2 + 0.47, -0.14 + (k >> 1) * 0.28, 0.2, 0.12, 0.2, k % 2 ? c : shade(c, 0.85));
  } else if (pose === 'read') {
    arm(-1, -1.0); arm(1, -1.0);
    g.boxR(0, ty + 0.0, 0.36, 0.36, 0.26, 0.02, K.cream, -0.7, 0, 0); // a newspaper / a letter
    f.box(0, ty + 0.02, 0.37, 0.24, 0.02, 0.01, K.ink);
  } else if (pose === 'pour') {
    arm(-1, -1.2); arm(1, -0.6, -0.3);
    g.box(0.24, ay - 0.1, 0.4, 0.16, 0.18, 0.14, K.white); // the kettle
    g.box(0.3, ay - 0.04, 0.5, 0.05, 0.05, 0.1, K.white);
  } else if (pose === 'kid' && it.hold === 'kite') {
    arm(-1, 0); arm(1, -2.4);
    hand(ax, ay + 0.3, 0.08);
  } else {
    arm(-1, sit ? -0.6 : 0); arm(1, sit ? -0.6 : 0);
  }
  // head: skin block, hair (bun / short / long), thanaka cheeks on some women
  const hy = ty + th / 2 + 0.17 * s + (squat ? -0.02 : 0), hs = 0.34 * s, hz = lean * 0.18;
  g.box(0, hy - 0.06, hz, 0.12, 0.08, 0.12, skin); // neck
  g.box(0, hy + 0.08, hz, hs, hs, hs, skin);
  g.box(0, hy + 0.08 + hs / 2 - 0.04, hz - 0.03, hs + 0.04, 0.12, hs - 0.02, hair);
  g.box(0, hy + 0.08, hz - hs / 2 + 0.03, hs + 0.04, hs - 0.02, 0.08, hair);
  if (woman && !kid) {
    if (r() < 0.6) g.box(0, hy + 0.2, hz - hs / 2 - 0.04, 0.16, 0.16, 0.14, hair); // the bun
    if (r() < 0.6) for (const sx of [-1, 1]) f.box(sx * 0.1 * s, hy + 0.05, hz + hs / 2 + 0.005, 0.08, 0.07, 0.01, '#F1DDA8'); // thanaka
  }
  f.box(-0.065 * s, hy + 0.1, hz + hs / 2 + 0.006, 0.035, 0.05, 0.01, K.ink);
  f.box(0.065 * s, hy + 0.1, hz + hs / 2 + 0.006, 0.035, 0.05, 0.01, K.ink);
  if (it.hat === 'sun' || (!it.hat && pose === 'squat' && r() < 0.5)) { g.box(0, hy + 0.3, hz, 0.62, 0.05, 0.62, '#E8D2A0'); g.box(0, hy + 0.36, hz, 0.24, 0.1, 0.24, '#E8D2A0'); }
}

// ---------------------------------------------------------------------------------
// the stamp printers' hall
// ---------------------------------------------------------------------------------
function stampHall(g, f, it, ctx) {
  const W = it.w || 12, D = it.d || 8, H = 4.6, wall = '#EADCC2', brick = K.brick;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.7, D / 2 + 0.9, 0.004, K.shadow);
  g.box(0, 0.12, 0, W + 0.3, 0.24, D + 0.3, K.stone);
  // brick piers and cream panels between them (a works, not a house)
  g.box(0, H / 2 + 0.24, 0, W, H, D, wall);
  const bays = Math.max(3, Math.round(W / 3));
  for (let i = 0; i <= bays; i++) { const x = -W / 2 + (W * i) / bays; g.box(x, H / 2 + 0.24, D / 2 + 0.05, 0.42, H, 0.2, jitter(brick, 0.05, i + 3)); }
  g.box(0, 0.42, D / 2 + 0.04, W, 0.36, 0.12, K.brickD);
  g.box(0, H + 0.12, D / 2 + 0.08, W + 0.2, 0.24, 0.3, K.brickD);
  // the gallery: a narrow balcony with lines of stamp sheets drying on it
  g.box(0, H - 1.55, D / 2 + 0.45, W - 0.8, 0.1, 0.8, K.woodL);
  for (let x = -W / 2 + 0.6; x <= W / 2 - 0.6; x += 0.4) g.box(x, H - 1.25, D / 2 + 0.82, 0.05, 0.52, 0.05, K.woodD);
  g.box(0, H - 0.98, D / 2 + 0.82, W - 0.9, 0.06, 0.07, K.goldD);
  g.box(0, H - 0.2, D / 2 + 0.55, W - 1.0, 0.02, 0.02, K.ink);
  const sc = [K.red, K.green, K.blue, K.mustard, '#7E5BA6', K.teal];
  for (let x = -W / 2 + 0.8, i = 0; x < W / 2 - 0.7; x += 0.55, i++) {
    g.box(x, H - 0.48, D / 2 + 0.56, 0.42, 0.5, 0.02, K.white);
    for (let k = 0; k < 4; k++) f.box(x - 0.1 + (k % 2) * 0.2, H - 0.38 - (k >> 1) * 0.22, D / 2 + 0.575, 0.15, 0.17, 0.01, sc[(i + k) % sc.length]);
  }
  // upper windows behind the gallery
  for (let i = 0; i < bays; i++) { const x = -W / 2 + (W * (i + 0.5)) / bays; g.box(x, H - 0.75, D / 2 + 0.03, 1.4, 0.8, 0.06, K.glass); g.box(x, H - 0.75, D / 2 + 0.06, 0.05, 0.8, 0.03, K.white); }
  // ground floor: the loading bay (shutter half down: you see the press's feet and paper stacks), windows
  const lx = -W / 2 + W / bays * 0.5 + 0.1;
  g.box(lx, 1.2, D / 2 + 0.02, 2.2, 2.0, 0.05, K.dark);
  g.box(lx, 1.85, D / 2 + 0.07, 2.3, 0.75, 0.06, '#B9B0A2'); // the shutter, half down
  for (let k = 0; k < 4; k++) g.box(lx, 1.55 + k * 0.18, D / 2 + 0.11, 2.3, 0.03, 0.02, '#8E8173');
  g.box(lx - 0.5, 0.55, D / 2 - 0.2, 0.7, 0.6, 0.5, K.iron); // the press's base
  for (let k = 0; k < 3; k++) g.box(lx + 0.5, 0.35 + k * 0.12, D / 2 - 0.15, 0.6, 0.1, 0.45, k % 2 ? K.white : K.envL); // paper stacks
  g.box(lx, 0.06, D / 2 + 0.45, 2.6, 0.12, 0.8, K.stoneD); // the loading step
  for (let i = 1; i < bays; i++) { const x = -W / 2 + (W * (i + 0.5)) / bays; g.box(x, 1.55, D / 2 + 0.03, 1.3, 1.2, 0.06, K.glass); g.box(x, 1.55, D / 2 + 0.07, 1.3, 0.05, 0.02, K.white); g.box(x, 0.88, D / 2 + 0.12, 1.5, 0.06, 0.2, K.goldD); }
  // the sawtooth roof: north-light teeth along x
  const teeth = Math.max(2, Math.round(D / 2.6)), td = D / teeth;
  for (let i = 0; i < teeth; i++) {
    const z0 = -D / 2 + td * i;
    g.boxR(0, H + 0.24 + 0.55, z0 + td / 2 + 0.05, W + 0.3, 0.1, td * 1.12, '#8C5A3A', -0.42, 0, 0);
    g.box(0, H + 0.24 + 0.55, z0 + 0.05, W + 0.2, 1.1, 0.08, K.glass);
  }
  // a tall brick chimney at the back (cold: the hall prints with hand presses)
  g.box(W / 2 - 1.2, H + 1.7, -D / 2 + 1.0, 0.7, 3.2, 0.7, brick);
  g.box(W / 2 - 1.2, H + 3.35, -D / 2 + 1.0, 0.85, 0.12, 0.85, K.brickD);
  // stacks of paper reams and an empty handcart by the bay; a crate of misprints
  for (let k = 0; k < 3; k++) g.box(lx + 1.7, 0.2 + k * 0.22, D / 2 + 0.7, 0.62, 0.2, 0.46, k % 2 ? K.envL : K.white);
  g.box(lx + 2.6, 0.3, D / 2 + 0.75, 0.6, 0.5, 0.5, K.woodL);
  for (let k = 0; k < 5; k++) f.box(lx + 2.45 + (k % 3) * 0.14, 0.58, D / 2 + 0.65 + (k >> 1) * 0.1, 0.14, 0.03, 0.16, sc[k]);
  ctx.signs.push({ x: 0, y: H + 0.12, z: D / 2 + 0.25, w: 4.4, h: 0.6, lines: [{ text: 'တံဆိပ်ခေါင်း ပုံနှိပ်ရုံ', size: 44 }, { text: 'Stamp printers', size: 20, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: '#FBF6EA', width: 640, height: 112 });
}

// ---------------------------------------------------------------------------------
// street things
// ---------------------------------------------------------------------------------
function waterPots(g, f, it, ctx) {
  // the roadside drinking-water stand: whoever passes may drink; someone fills the pots every morning
  f.flat(-0.75, -0.45, 0.8, 0.55, 0.004, K.shadow);
  g.box(0, 0.42, 0, 1.25, 0.08, 0.6, K.woodL);
  for (const sx of [-0.55, 0.55]) for (const sz of [-0.24, 0.24]) g.box(sx, 0.2, sz, 0.07, 0.4, 0.07, K.woodD);
  for (const sx of [-0.62, 0.62]) g.box(sx, 0.95, -0.26, 0.07, 1.9, 0.07, K.woodD);
  g.boxR(0, 1.86, 0.0, 1.5, 0.06, 0.95, K.terra, 0.25, 0, 0); // a little tiled roof
  g.boxR(0, 1.9, 0.0, 1.55, 0.04, 0.2, K.terraD, 0.25, 0, 0);
  for (const sx of [-0.32, 0.32]) {
    g.box(sx, 0.66, 0, 0.42, 0.4, 0.42, K.terra);
    g.box(sx, 0.9, 0, 0.3, 0.1, 0.3, K.terraL);
    g.box(sx, 0.97, 0, 0.36, 0.04, 0.36, K.woodL); // the lid
  }
  g.box(0.32, 1.02, 0.12, 0.1, 0.08, 0.1, K.tin); // the cup
  f.box(0.45, 0.85, 0.14, 0.01, 0.3, 0.01, K.twine);
  if (it.sign) ctx.signs.push({ x: 0, y: 1.45, z: -0.22, w: 0.9, h: 0.34, lines: [{ text: 'သောက်ရေ', size: 52 }], bg: '#FBF6EA', border: '#8E4A2C', width: 256, height: 96 });
}
function bambooFence(g, f, it) {
  const L = it.len || 4, gate = it.gate;
  const seg = (x0, x1) => {
    const w = x1 - x0, c = (x0 + x1) / 2;
    g.box(c, 0.42, 0.065, w, 0.05, 0.05, K.bambooD);
    g.box(c, 0.78, 0.065, w, 0.05, 0.05, K.bambooD);
    // the split-bamboo screen as one panel, its slats drawn on it (no outline each: the phone budget)
    g.box(c, 0.47, 0.03, w, 0.86, 0.03, K.bamboo);
    for (let x = x0 + 0.16; x < x1 - 0.05; x += 0.24) f.box(x, 0.5 + ((Math.round(x * 13) % 3) - 1) * 0.03, 0.052, 0.025, 0.84, 0.012, (Math.round(x * 7) % 2) ? K.bambooD : jitter(K.bambooD, 0.08, Math.round(x * 31)));
  };
  if (gate) {
    const gw = 1.1;
    seg(-L / 2, -gw / 2); seg(gw / 2, L / 2);
    for (const sx of [-1, 1]) g.box(sx * gw / 2, 0.65, 0, 0.12, 1.3, 0.12, K.woodD);
  } else seg(-L / 2, L / 2);
  for (let x = -L / 2; x <= L / 2 + 0.01; x += Math.max(1.2, L / Math.ceil(L / 1.6))) g.box(x, 0.5, 0, 0.09, 1.0, 0.09, K.woodD);
}
function foodCart(g, f, it) {
  const r = rng(it.seed || 3), kind = it.kind || 'mohinga';
  const body = [K.teal, K.maroon, K.blue][Math.floor(r() * 3)];
  f.flat(-1.0, -0.6, 1.1, 0.75, 0.004, K.shadow);
  g.box(0, 0.75, 0, 1.4, 0.5, 0.7, body);
  g.box(0, 1.02, 0, 1.5, 0.05, 0.78, K.woodL);
  g.box(0, 0.75, 0.355, 1.3, 0.12, 0.02, K.cream);
  for (const sx of [-0.45, 0.45]) { g.box(sx, 0.28, 0.4, 0.06, 0.5, 0.5, K.ink); g.box(sx, 0.28, 0.4, 0.04, 0.36, 0.36, '#8E8173'); }
  g.boxR(-0.95, 0.85, 0, 0.6, 0.05, 0.05, K.woodD, 0, 0, 0.1);
  // the parasol
  g.box(0.5, 1.6, -0.25, 0.05, 1.2, 0.05, K.woodD);
  const pc = [K.red, K.cream];
  for (let k = 0; k < 8; k++) g.box(0.5 + Math.cos(k * Math.PI / 4) * 0.5, 2.18, -0.25 + Math.sin(k * Math.PI / 4) * 0.5, 0.62, 0.05, 0.62, pc[k % 2], k * Math.PI / 4);
  if (kind === 'mohinga') {
    g.box(-0.3, 1.2, 0, 0.5, 0.32, 0.5, K.tinD); g.box(-0.3, 1.38, 0, 0.54, 0.04, 0.54, K.tin); // the big soup pot
    for (let k = 0; k < 4; k++) f.box(0.25 + (k % 2) * 0.2, 1.08, -0.15 + (k >> 1) * 0.25, 0.16, 0.06, 0.16, K.white); // bowls
    f.box(0.45, 1.12, 0.1, 0.24, 0.1, 0.18, '#F2D06B'); // fritters
  } else if (kind === 'cane') {
    g.box(-0.25, 1.25, 0, 0.5, 0.42, 0.42, K.iron); g.box(-0.25, 1.25, 0.23, 0.42, 0.08, 0.06, K.gold); // the press wheels
    for (let k = 0; k < 5; k++) g.boxR(0.35 + k * 0.08, 1.35, -0.2, 0.05, 1.0, 0.05, '#9DB66A', 0.12, 0, 0.1); // canes standing
    for (let k = 0; k < 3; k++) f.box(0.25 + k * 0.15, 1.12, 0.18, 0.09, 0.16, 0.09, '#D8E6A8');
  } else {
    g.box(-0.2, 1.12, 0, 0.6, 0.12, 0.5, K.iron); f.box(-0.2, 1.19, 0, 0.5, 0.02, 0.4, '#E2A33C'); // the frying pan
    for (let k = 0; k < 6; k++) f.box(0.35 + (k % 3) * 0.12, 1.08, -0.1 + (k > 2 ? 0.16 : 0), 0.1, 0.06, 0.1, '#E8B05A');
  }
  // two tiny stools in front
  for (const [x, c] of [[-0.45, K.red], [0.4, K.blue]]) { g.box(x, 0.26, 0.85, 0.3, 0.05, 0.3, c); g.box(x, 0.12, 0.85, 0.22, 0.24, 0.22, shade(c, 0.8)); }
}
function aFrame(g, f, it, ctx) {
  for (const sz of [-1, 1]) g.boxR(0, 0.5, sz * 0.12, 0.62, 0.92, 0.04, K.woodD, sz * 0.22, 0, 0);
  g.boxR(0, 0.52, 0.135, 0.52, 0.76, 0.02, K.chalk, -0.22, 0, 0);
  f.flat(-0.35, -0.25, 0.4, 0.3, 0.004, K.shadow);
  if (it.lines) ctx.signs.push({ x: 0, y: 0.54, z: 0.17, ry: 0, w: 0.48, h: 0.66, lines: it.lines.map((t) => ({ text: t, size: 34, color: '#F3EFE4' })), bg: '#3E4A3F', border: null, width: 224, height: 300 });
}
function bananas(g, f, it) {
  const r = rng(it.seed || 2);
  f.flat(-0.8, -0.6, 0.9, 0.7, 0.004, '#DCCFAE');
  for (let k = 0; k < 3; k++) {
    const x = (k - 1) * 0.55 + (r() - 0.5) * 0.2, z = (r() - 0.5) * 0.4, h = 1.3 + r() * 0.7;
    g.box(x, h / 2, z, 0.16, h, 0.16, '#9DB66A');
    for (let j = 0; j < 4; j++) { const a = j * Math.PI / 2 + r() * 0.5; g.boxR(x + Math.sin(a) * 0.38, h + 0.05 - (j % 2) * 0.12, z + Math.cos(a) * 0.38, 0.22, 0.04, 0.9, j % 2 ? K.leafL : K.leaf, 0.35, a, 0); }
  }
}
function sapling(g, f, it) {
  const r = rng(it.seed || 4), s = it.s || 1;
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; g.box(Math.sin(a) * 0.28, 0.4, Math.cos(a) * 0.28, 0.05, 0.8, 0.05, K.bambooD); }
  g.box(0, 0.62, 0, 0.62, 0.05, 0.62, K.bamboo);
  g.box(0, 0.9 * s, 0, 0.12, 1.8 * s, 0.12, '#7A5434');
  const crown = [K.leaf, K.leafL, K.leafD][Math.floor(r() * 3)];
  g.box(0, 1.95 * s, 0, 1.0 * s, 0.6 * s, 1.0 * s, crown);
  g.box(0.1 * s, 2.35 * s, -0.05, 0.7 * s, 0.4 * s, 0.7 * s, shade(crown, 1.1));
  f.flat(-0.6, -0.4, 0.8, 0.6, 0.004, K.shadow);
}
function baskets(g, f, it) {
  const r = rng(it.seed || 6);
  f.flat(-0.7, -0.5, 0.8, 0.55, 0.004, K.shadow);
  for (let k = 0; k < 4; k++) g.box(-0.3, 0.08 + k * 0.13, 0, 0.6 - k * 0.04, 0.12, 0.6 - k * 0.04, k % 2 ? K.bamboo : K.bambooD);
  for (let k = 0; k < 3; k++) g.boxR(0.4, 0.4, -0.15 + k * 0.08, 0.7, 0.7, 0.03, k % 2 ? K.bamboo : '#D8C27E', 0, 0, 0.1 * (r() - 0.5)); // trays leaning
  g.box(0.1, 0.18, 0.35, 0.36, 0.36, 0.36, K.bambooD);
}
function potRack(g, f, it) {
  const r = rng(it.seed || 5), cols = [K.terra, K.terraL, K.terraD, '#C9A27A'];
  f.flat(-1.1, -0.45, 1.2, 0.5, 0.004, K.shadow);
  for (const y of [0.35, 0.85]) g.box(0, y, 0, 2.0, 0.06, 0.5, K.woodL);
  for (const sx of [-0.95, 0.95]) g.box(sx, 0.55, 0, 0.07, 1.1, 0.45, K.woodD);
  for (const y of [0.38, 0.88]) for (let x = -0.8; x < 0.85; x += 0.32) { const h = 0.18 + r() * 0.16; g.box(x, y + h / 2 + 0.03, (r() - 0.5) * 0.1, 0.24, h, 0.24, cols[Math.floor(r() * cols.length)]); }
}
function hopscotch(g, f) {
  const ch = '#FFFFFF';
  for (const [x, z] of [[0, 0], [0, -0.6], [-0.3, -1.2], [0.3, -1.2], [0, -1.8], [-0.3, -2.4], [0.3, -2.4], [0, -3.0]]) {
    f.flat(x - 0.28, z - 0.28, x + 0.28, z - 0.24, 0.006, ch); f.flat(x - 0.28, z + 0.24, x + 0.28, z + 0.28, 0.006, ch);
    f.flat(x - 0.28, z - 0.28, x - 0.24, z + 0.28, 0.006, ch); f.flat(x + 0.24, z - 0.28, x + 0.28, z + 0.28, 0.006, ch);
  }
  f.flat(-0.08, 0.5, 0.06, 0.62, 0.006, K.red); // the pebble
}
function kiteUp(g, f, it) {
  // a kite flying high, its line slanting down to the hand at local (0, 1.25, 0) (a `folk` kid stands there)
  const r = rng(it.seed || 3), h = it.h || 7, cols = [K.red, K.mustard, K.blue, K.green, K.pink];
  const c1 = cols[Math.floor(r() * cols.length)], c2 = cols[Math.floor(r() * cols.length)];
  const kx = -1.6, kz = -1.6;
  g.boxR(kx, h, kz, 0.8, 0.8, 0.03, c1, 0.2, 0, Math.PI / 4);
  g.boxR(kx, h, kz + 0.02, 0.5, 0.5, 0.03, c2, 0.2, 0, Math.PI / 4);
  for (let k = 0; k < 4; k++) f.box(kx + 0.05 * k, h - 0.7 - k * 0.3, kz + 0.05, 0.12, 0.05, 0.02, k % 2 ? c2 : c1); // the tail
  const n = 10;
  for (let k = 0; k < n; k++) {
    const t0 = k / n, t1 = (k + 1) / n;
    const p0 = [kx * (1 - t0), 1.25 + (h - 1.25) * (1 - t0) - Math.sin(t0 * Math.PI) * 0.6, kz * (1 - t0)];
    const p1 = [kx * (1 - t1), 1.25 + (h - 1.25) * (1 - t1) - Math.sin(t1 * Math.PI) * 0.6, kz * (1 - t1)];
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2], L = Math.hypot(dx, dy, dz);
    f.boxR((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2, 0.015, L, 0.015, '#F3EFE4', Math.atan2(Math.hypot(dx, dz), dy), Math.atan2(dx, dz), 0); // (boxR turns YXZ: tilt, then heading)
  }
}
function stoolRow(g, f, it) {
  const r = rng(it.seed || 2), n = it.n || 4, cs = [K.red, K.blue, K.green, K.mustard];
  for (let k = 0; k < n; k++) { const c = cs[Math.floor(r() * 4)], x = (k - (n - 1) / 2) * 0.5; g.box(x, 0.26, 0, 0.3, 0.05, 0.3, c); g.box(x, 0.12, 0, 0.22, 0.24, 0.22, shade(c, 0.8)); }
}
function drain(g, f, it) {
  const L = it.len || 4;
  f.flat(-L / 2, -0.18, L / 2, 0.18, 0.006, K.stoneD);
  for (let x = -L / 2 + 0.25; x < L / 2; x += 0.5) f.flat(x - 0.02, -0.16, x + 0.02, 0.16, 0.008, K.stone);
}

// keep-out helpers (world space, from the item's turn)
function box(it, w, d, ox = 0, oz = 0) {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const cx = it.x + ox * c + oz * s, cz = it.z - ox * s + oz * c;
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return { type: 'box', minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd };
}
const circ = (it, r) => ({ type: 'circle', x: it.x, z: it.z, r });

export const ART = {
  stampHall: { h: 6.4, map: true, draw: stampHall, obstacles: (it) => [box(it, it.w || 12, it.d || 8), box(it, 1.4, 0.6, -(it.w || 12) / 2 + (it.w || 12) / Math.max(3, Math.round((it.w || 12) / 3)) * 0.5 + 2.0, (it.d || 8) / 2 + 0.72)] },
};
export const PROP = {
  folk: { draw: folk, obstacles: (it) => [circ(it, it.pose === 'sit' || it.pose === 'squat' ? 0.3 : 0.25)] },
  waterPots: { draw: waterPots, obstacles: (it) => [box(it, 1.35, 0.65)] },
  bambooFence: { draw: bambooFence, obstacles: (it) => (it.gate ? [box(it, (it.len - 1.1) / 2, 0.16, -(it.len + 1.1) / 4, 0), box(it, (it.len - 1.1) / 2, 0.16, (it.len + 1.1) / 4, 0)] : [box(it, it.len || 4, 0.16)]) },
  foodCart: { draw: foodCart, obstacles: (it) => [box(it, 1.6, 0.85)] },
  aFrame: { draw: aFrame, obstacles: (it) => [box(it, 0.6, 0.4)] },
  bananas: { draw: bananas, obstacles: (it) => [circ(it, 0.6)] },
  sapling: { draw: sapling, obstacles: (it) => [circ(it, 0.35)] },
  baskets: { draw: baskets, obstacles: (it) => [box(it, 1.2, 0.8)] },
  potRack: { draw: potRack, obstacles: (it) => [box(it, 2.0, 0.55)] },
  hopscotch: { draw: hopscotch, obstacles: () => [] },
  kiteUp: { draw: kiteUp, obstacles: () => [] },
  stoolRow: { draw: stoolRow, obstacles: () => [] },
  drain: { draw: drain, obstacles: () => [] },
};
export { wx, wz };
