// The layouts of the generic rooms, one function per kind (rooms/generic.js builds the stage and the context `c`
// and calls KINDS[kind](c)). Room space: x left/right as the camera sees it, z from the back wall (-hd) to the
// open front (+hd), the doorway at the front centre. The context mirrors the whole layout left/right by seed:
// c.X(x) for any x written straight into c.S, c.side('left') for a side wall; c.put / c.back / c.onWall / c.sign
// / c.win / c.res / c.spot do it themselves. Things the camera sees first (from the doorway, close and low) go on
// the back wall's middle and the floor's middle; the walkway from the door to the room's middle stays clear.
// Every Burmese string is a DRAFT for Maya (DRAFT(my)). No shrine, no holy images, no monks, no pagodas.
import { VoxelBuilder, jitter, M, rb, cyl, mm, rand } from './generic-stage.js';
import * as A from './generic-props.js';
import * as ART from './generic-art.js';
import * as D from './generic-dress.js';

const { C } = A;
const PI = Math.PI, HP = PI / 2;

// ---------------------------------------------------------------------------------------------
// the things most rooms share
// ---------------------------------------------------------------------------------------------
/**
 * common(c, { cal: [wall, along, y] | null, clock: [along, y] | null, lamps: [[wall, along, kind?, y?]], fan: x | null,
 *             slippers, plants (front corners: 0..2), umbrella (when it rains) })
 */
function common(c, { cal = null, clock = null, lamps = [], fan = null, slippers = true, plants = 1, umbrella = true } = {}) {
  const { R, hd } = c;
  if (cal) {
    const [wall, along, y = 1.8] = cal;
    c.sign(wall, along, y, 0.46, 0.64, (g, w, h) => ART.calendar(g, w, h, { month: R.pick(ART.MONTHS), pic: R.pick(['hills', 'flowers', 'boat', 'tree', 'kite']), mark: 1 + R.i(28), seed: c.seed % 97 }), 260);
    if (wall === 'back') c.S.box(c.X(along), y + 0.36, -hd + 0.03, 0.03, 0.03, 0.03, C.iron);
  }
  if (clock) {
    const [x, y = 2.5] = clock;
    A.clockBody(c.S, c.X(x), y, -hd, 0.18);
    const hr = c.hour ?? 10;
    c.st.sign(0.29, 0.29, M(c.X(x), y, -hd + 0.07), (g, w, h) => ART.clockFace(g, w, h, hr), 300);
  }
  const dk = ['wharf', 'blank'].includes(c.district) ? 'oil' : R.chance(0.55) ? 'bulb' : 'oil';
  for (const [wall, along, k, y] of lamps) c.lamp(wall, along, k || dk, y || 2.1);
  if (fan != null) c.st.fan(c.X(fan), 2.5, R.pick(['#E9DFC9', '#BFD2D0', '#E8C4C0']));
  if (slippers) {
    const v = new VoxelBuilder();
    A.slippers(v, -0.2, 0, R.pick([C.maroon, '#2E3D63', '#7A5434']));
    if (R.chance(0.6)) A.slippers(v, 0.25, 0.05, R.pick(['#C8323C', '#2F7C7A', '#D9A93B']));
    c.put(v, R.chance(0.5) ? 1.2 : -1.2, hd - 0.5, 0, null, 'slippers', false);
  }
  if (umbrella && c.rain) { // a wet umbrella drying open by the door
    const v = new VoxelBuilder();
    cyl(v, 0, 0.27, 0, 0.42, 0.05, 0.26, R.pick(['#2E3D63', '#6E1F2A', '#2F7C7A']), 8);
    v.box(0, 0.4, 0, 0.02, 0.3, 0.02, C.ink);
    for (let k = 0; k < 6; k++) v.box(Math.cos(k) * 0.32, 0.004, Math.sin(k) * 0.24, 0.06, 0.004, 0.05, '#BFD2E0');
    c.put(v, -c.hw + 0.65, hd - 0.7, 0.3, { w: 0.7, d: 0.7 }, 'umbrella');
  }
  for (let i = 0; i < plants; i++) {
    const v = new VoxelBuilder();
    A.plantPot(v, 0, 0, 0, R.range(0.9, 1.25), R.i(4), R.pick([C.terra, '#E9DFC9', C.teal]));
    const s = i % 2 ? 1 : -1;
    c.put(v, s * (c.hw - 0.4), hd - 0.45, 0, { w: 0.3, d: 0.3 }, 'plant');
  }
}
/** A woven mat with cushions round a low table (where a family sits). */
function sittingMat(c, x, z, { set = 'tea', w = 2.0, d = 1.5 } = {}) {
  const { R } = c;
  c.put(A.floorMat(w, d, c.pal.mat, jitter(c.pal.mat, -0.15, 2), c.seed), x, z, 0, null, 'mat', false);
  c.put(A.lowRoundTable({ seed: c.seed % 7, set }), x, z, 0, { w: 0.8, d: 0.8 }, 'lowTable');
  const v = new VoxelBuilder();
  const cols = [R.pick(['#C8323C', '#E2B33C', '#2F7C7A']), R.pick(['#6E1F2A', '#3D6FA8', '#D97C8A'])];
  A.cushion(v, -0.7, 0.05, cols[0], 0.42, 0.42);
  A.cushion(v, 0.7, -0.05, cols[1], 0.42, 0.42);
  c.put(v, x, z, 0, null, 'cushions', false);
}
/** Clothes on a bamboo pole along a side wall. */
function clothesOnWall(c, side, z0, z1, y = 1.75) {
  const v = new VoxelBuilder();
  A.clothesLine(v, -(z1 - z0) / 2, (z1 - z0) / 2, y, 0, c.seed % 31);
  c.onWall(v, side, (z0 + z1) / 2, null, 'clothes', 0.08);
}
/** Frames on the back wall (drawn pictures, never photos). */
function frames(c, x, y, kinds, { gap = 0.62, w = 0.46, h = 0.56 } = {}) {
  kinds.forEach((k, i) => {
    const fx = x + (i - (kinds.length - 1) / 2) * gap;
    const fh = k === 'landscape' || k === 'boat' ? h * 0.75 : h;
    c.sign('back', fx, y + (i % 2 ? 0.08 : 0), k === 'landscape' || k === 'boat' ? w * 1.25 : w, fh, (g, ww, hh) => ART.framedPic(g, ww, hh, k, c.seed + i, c.R.pick(['#8E5A3C', '#5A3D26', '#A47A2C'])), 260);
  });
}
// ---------------------------------------------------------------------------------------------
// the kinds
// ---------------------------------------------------------------------------------------------
function homeA(c) {
  const { R, hw, hd } = c;
  // back wall, left to right: the sleeping corner (a portrait, the calendar over it), a wall lamp, the window
  // with its curtain (an embroidered saying over it), the cooking corner (the clock over its shelf)
  const net = R.chance(0.7), bedW = 1.9, bedD = 1.3;
  const bedX = -hw + bedW / 2 + 0.06, bedZ = -hd + bedD / 2 + 0.04;
  c.back(A.sleepPlatform({ w: bedW, d: bedD, sheet: R.pick(['#E9DFC9', '#F4F1EA', '#E8D3D0']), blanket: R.pick(['#3D6FA8', '#C8323C', '#2F7C7A', '#D9A93B']), net, seed: c.seed % 9 }), bedX, { w: bedW, d: bedD }, 'bed');
  frames(c, bedX - 0.35, 2.3, [R.pick(['portrait', 'one', 'kids'])]);
  c.win({ x: 0.15, w: 1.0, curtain: c.pal.curtain, shutters: false });
  c.sign('back', 0.15, 2.64, 0.78, 0.36, (g, w, h) => ART.embroidery(g, w, h, R.pick(['ကျန်းမာပါစေ', 'အိမ်ချမ်းသာ', 'မင်္ဂလာပါ']), c.seed), 260); // DRAFT(my): be well / a happy home / welcome
  const sx = 1.75;
  const ck = cookCornerBack(c, sx);
  // the living mat with the low table
  const mx = -0.75, mz = -0.15;
  sittingMat(c, mx, mz, { set: R.pick(['tea', 'meal', 'tea']) });
  // the cupboard on the right wall, water pots and clothes on the left wall, a broom by the door
  c.onWall(A.cupboard({ seed: c.seed % 11, wood: R.pick([C.woodD, C.teakD, '#8E5A3C']) }), 'right', -0.5, { w: 1.1, d: 0.42 }, 'cupboard');
  c.onWall(A.waterStand({ n: 2 }), 'left', hd - 1.25, { w: 0.94, d: 0.5 }, 'water');
  clothesOnWall(c, 'left', -0.55, 0.65);
  const v = new VoxelBuilder();
  A.broom(v, 0, 0, 0.15);
  if (R.chance(0.5)) A.bucket(v, 0.4, 0.1, R.pick([C.blue, C.red, '#4F8A86']));
  c.put(v, hw - 0.55, hd - 0.9, 0, { w: 0.6, d: 0.4 }, 'broom');
  common(c, { cal: ['back', bedX + 0.4, 2.2], clock: [sx, 2.4], lamps: [['back', -0.8]], plants: 0 });
  c.st.motes(c.X(0.15), 0.9, -hd + 1.2, 1.2, 1.2, 1.0);
  // people: the cook at the stove; a child on the mat; a grandparent napping on the bed
  c.res('cook', ck.x, ck.z, ck.h, { role: R.chance(0.75) ? 'woman' : 'man' });
  if (R.chance(0.85)) c.res('play', mx - 0.45, mz + 0.5, 0.35, { role: 'child', seat: 0.02 });
  if (R.chance(0.6)) c.res('nap', bedX, bedZ + 0.1, 0, { role: 'elder', lie: 0.44 });
  else c.res('read', mx + 0.65, mz - 0.45, -0.5, { role: R.pick(['elder', 'man', 'woman']), seat: 0.12 });
  c.spot('sit', mx + 0.75, mz + 0.55, -0.4);
}
/** The cooking corner against the back wall at x; returns where the cook stands. */
function cookCornerBack(c, x) {
  const sc = A.stoveCorner({ seed: c.seed % 13 });
  c.back(sc.v, x, { w: 1.4, d: 0.7 }, 'stove');
  const z0 = -c.hd + 0.38;
  for (const [lx, ly, lz, ew, eh] of sc.embers) c.st.flame(c.X(x + lx), ly, z0 + lz, ew, eh, 'ember');
  const [qx, qy, qz] = sc.steam;
  c.st.steam(c.X(x + qx), qy, z0 + qz, 6);
  return { x: x - 0.95, z: -c.hd + 0.85, h: HP - 0.35 };
}

function shopA(c) {
  const { R, hw, hd } = c;
  const cw = 2.4, cz = -hd + 1.45, cx = -0.55;
  // stock behind the counter: two shelves, packet strips, the shop's sign; a window on the right
  c.back(A.shelves({ w: 1.4, h: 1.75, rows: 4, goods: R.pick(['tins', 'mixed', 'bottles']), seed: c.seed % 17 }), cx - 0.8, { w: 1.4, d: 0.36 }, 'shelfA');
  c.back(A.shelves({ w: 1.3, h: 1.75, rows: 4, goods: R.pick(['jars', 'mixed', 'cloth']), seed: c.seed % 19 + 3, wood: C.teakD }), cx + 0.7, { w: 1.3, d: 0.36 }, 'shelfB');
  { const a = c.X(cx - 1.45), b = c.X(cx + 1.35); A.packetStrips(c.S, Math.min(a, b), Math.max(a, b), 2.3, -hd + 0.06, c.seed % 7); }
  const name = R.pick([['ကုန်စုံဆိုင်', 'sundries'], ['ဆန် ဆီ ဆား', 'rice · oil · salt'], ['မုန့်မျိုးစုံ', 'snacks'], ['အိမ်သုံးပစ္စည်း', 'household goods']]); // DRAFT(my)
  c.sign('back', cx, 2.64, 2.0, 0.4, (g, w, h) => ART.boardSign(g, w, h, name[0], { bg: c.pal.sign }), 240);
  c.win({ x: 1.75, w: 0.9, h: 0.9, curtain: null, shutters: true });
  // the counter; the keeper behind it, off the doorway's line so Maya never hides them
  c.put(A.shopCounter({ w: cw, seed: c.seed % 23, body: R.pick([C.woodD, '#4F6F55', '#6E1F2A']) }), cx, cz, 0, { w: cw, d: 0.6 }, 'counter');
  c.res('keep', cx - 0.45, cz - 0.62, 0.15, { role: R.pick(['woman', 'man', 'elder']) });
  // a bottle shelf and a price slate on the right wall
  c.onWall(A.shelves({ w: 1.2, h: 1.4, rows: 3, goods: 'bottles', seed: c.seed % 29 }), 'right', -0.2, { w: 1.2, d: 0.36 }, 'bottleShelf');
  c.sign('right', 0.85, 1.75, 0.7, 0.55, (g, w, h) => ART.chalkBoard(g, w, h, 'ဈေးနှုန်း', [['ဆန် ၁ပြည်', 3200], ['ဆီ ၁ဗူး', 4500], ['ဆပ်ပြာ', 800]], c.seed), 260); // DRAFT(my): prices
  // sacks and baskets at the front, open to the street
  const v = new VoxelBuilder();
  A.sack(v, -0.3, 0, C.sack, 1, 0.1, '#F2E8D2');
  A.sack(v, 0.2, 0.05, C.sackD, 0.95, -0.2, '#7A3A2A');
  A.sack(v, 0.65, -0.05, C.sack, 0.9, 0.3, '#D9A94A');
  c.put(v, -hw + 1.15, hd - 1.0, 0, { w: 1.4, d: 0.5 }, 'sacks');
  const b = new VoxelBuilder();
  A.basket(b, -0.28, 0, 0, '#B5643C', 1, '#C98A5A');
  A.basket(b, 0.28, 0, 0, '#C8323C', 1, '#A82A30');
  c.put(b, hw - 1.0, hd - 0.95, 0, { w: 1.0, d: 0.5 }, 'baskets');
  common(c, { cal: ['right', -1.3, 1.85], clock: [1.75, 2.6], lamps: [['back', 1.0, null, 2.05]], slippers: false, plants: 0 });
  c.res('idle', 0.75, cz + 0.85, -2.2, { role: R.pick(['woman', 'man', 'teen', 'child']) });
  c.spot('customer', cx - 0.3, cz + 0.85, PI);
}

function teaA(c) {
  const { R, hw, hd } = c;
  // the counter a step from the back wall (the owner stands between); the shelf of glasses and tins behind
  const kx = 0.95, kz = -hd + 1.25;
  {
    const y = 0.76;
    const v = A.shopCounter({ w: 2.0, d: 0.6, h: y, glass: false, scale: false, seed: c.seed % 5, body: R.pick(['#4F6F55', C.woodD, '#2F7C7A']) });
    cyl(v, -0.65, y + 0.13, 0, 0.19, 0.16, 0.26, C.terra, 8);
    A.kettle(v, -0.65, y + 0.26, 0, 1.1);
    for (let i = 0; i < 3; i++) A.thermos(v, -0.25 + i * 0.16, y, -0.1, [C.red, C.teal, C.blue][i], 0.85);
    for (let i = 0; i < 6; i++) A.teaGlass(v, 0.3 + (i % 3) * 0.08, y, 0.05 + Math.floor(i / 3) * 0.09, i % 3 ? '#C79A68' : '#D9B48C');
    c.put(v, kx, kz, 0, { w: 2.0, d: 0.6 }, 'teaCounter');
    c.st.flame(c.X(kx - 0.65), y + 0.12, kz + 0.17, 0.1, 0.05, 'ember');
    c.st.steam(c.X(kx - 0.55), y + 0.6, kz, 7);
  }
  A.wallShelf(c.S, c.X(kx), 1.45, -hd + 0.02, 1.6, 'tins', c.seed);
  A.wallShelf(c.S, c.X(kx), 1.85, -hd + 0.02, 1.6, 'jars', c.seed + 2);
  c.sign('back', kx, 2.55, 1.9, 0.38, (g, w, h) => ART.boardSign(g, w, h, R.pick(['ရွှေလက်ဖက်ရည်', 'လမင်း လက်ဖက်ရည်', 'မနက်ခင်း လက်ဖက်ရည်']), { bg: c.pal.sign }), 240); // DRAFT(my): tea shop names
  c.sign('back', -1.3, 1.85, 1.15, 0.95, (g, w, h) => ART.chalkBoard(g, w, h, 'လက်ဖက်ရည်', [['လက်ဖက်ရည်', 500], ['ကော်ဖီ', 500], ['ပလာတာ', 800], ['အကြော်', 300]], c.seed), 220); // DRAFT(my): the menu
  c.win({ wall: 'left', along: -hd + 1.0, w: 0.9, h: 0.8, y: 1.75, sun: false, curtain: null, shutters: false });
  // low tables and tiny stools
  // (the first table a step in from the wall: whoever sits at it stays in the close entry view with the tea-maker)
  const tables = [[-1.15, -0.3], [0.95, 0.5], [-1.3, 1.05]].slice(0, R.chance(0.6) ? 3 : 2);
  tables.forEach(([x, z], i) => {
    c.put(A.teaTable({ seed: c.seed + i }), x, z, 0, { w: 0.62, d: 0.62 }, 'teaTable');
    const v = new VoxelBuilder();
    for (const [sx, sz] of [[-0.48, 0], [0.48, 0], [0, -0.48]]) A.stool(v, sx, sz, R.pick([C.maroon, '#2F7C7A', C.teakD]), 0.28);
    c.put(v, x, z, 0, null, 'stools', false);
  });
  common(c, { cal: ['right', -hd + 1.2, 1.85], clock: [-1.3, 2.62], lamps: [['back', -0.35, null, 2.15]], fan: hw > 2.9 ? 2.35 : null, slippers: false, plants: 1 });
  c.res('pour', kx + 0.45, -hd + 0.62, 0.1, { role: R.pick(['man', 'woman']) });
  const [t0x, t0z] = tables[0];
  c.res(R.pick(['read', 'idle']), t0x, t0z - 0.48, 0.15, { role: R.pick(['elder', 'man']), seat: 0.28 });
  if (R.chance(0.75)) { const [tx, tz] = tables[1]; c.res('idle', tx, tz - 0.48, -0.2, { role: R.pick(['woman', 'teen', 'man']), seat: 0.28 }); }
  c.spot('sit', tables[1][0] - 0.48, tables[1][1], HP);
}

function baker(c) {
  const { R, hw, hd } = c;
  const ov = A.brickOven({ seed: c.seed % 5 });
  const ox = -hw + 0.95;
  c.back(ov.v, ox, { w: 1.6, d: 1.2 }, 'oven');
  const oz = -hd + 0.63;
  const [ex, ey, ez, ew, eh] = ov.ember;
  c.st.flame(c.X(ox + ex), ey, oz + ez, ew, eh, 'ember');
  c.st.flame(c.X(ox), 0.66, oz + 0.62, 0.5, 0.36, 'flame'); // the iron door glows at dusk
  c.st.pool(c.X(ox + 0.4), oz + 1.3, 1.4);
  c.win({ x: 0.75, w: 1.0, curtain: null, shutters: false });
  c.sign('back', 0.75, 2.64, 1.6, 0.34, (g, w, h) => ART.boardSign(g, w, h, R.pick(['မုန့်ဖို', 'ပေါင်မုန့်', 'နံနက် မုန့်ဖို']), { bg: '#8E4A2C' }), 240); // DRAFT(my): bakery
  // the dough table in the middle (the baker behind it), the bread rack on the right wall
  const tx = 0.3, tz = -0.45;
  c.put(A.doughTable({ seed: c.seed % 7 }), tx, tz, 0, { w: 1.6, d: 0.75 }, 'doughTable');
  c.onWall(A.breadRack({ seed: c.seed % 11 }), 'right', 0.1, { w: 1.1, d: 0.45 }, 'breadRack');
  const v = new VoxelBuilder();
  A.sack(v, -0.3, 0, '#EFE6D3', 1, 0.15, '#FBF7EE');
  A.sack(v, 0.22, 0.05, '#EFE6D3', 0.95, -0.2, '#FBF7EE');
  for (let k = 0; k < 5; k++) v.boxMin(0.55, k * 0.035, -0.2, 1.05, k * 0.035 + 0.025, 0.2, C.tin);
  c.put(v, -hw + 1.2, hd - 1.0, 0, { w: 1.6, d: 0.5 }, 'flour');
  const w = new VoxelBuilder();
  for (let k = 0; k < 6; k++) rb(w, 0, 0.05 + k * 0.1, 0, 0.5, 0.09, 0.09, k % 2 ? C.woodD : C.woodL, 0, 0.2 * k, 0);
  c.put(w, hw - 0.7, hd - 0.85, 0, { w: 0.6, d: 0.5 }, 'firewood');
  c.st.motes(c.X(tx), 0.9, tz, 1.4, 1.0, 1.0, 14);
  common(c, { cal: ['back', 1.75, 1.8], clock: [-0.45, 2.62], lamps: [['back', -0.45, 'bulb', 2.0]], slippers: false, plants: 0, umbrella: false });
  c.res('knead', tx + 1.2, tz - 0.05, -HP + 0.35, { role: R.pick(['woman', 'man']) }); // at the table's end (a head bent over dough reads as hair from the camera)
  if (R.chance(0.7)) c.res('sweep', -1.0, 0.55, 0.6, { role: R.pick(['teen', 'man', 'woman']) });
  c.spot('table', tx - 0.4, tz + 0.75, PI);
}

function fisher(c) {
  const { R, hw, hd } = c;
  A.hungNet(c.S, c.X(-1.0), 2.25, -hd + 0.02, 1.6, 1.25, R.pick([C.net, '#8E9A7A', '#9C8B6E']));
  c.win({ x: 0.95, w: 1.0, h: 0.85, curtain: null, shutters: false, bars: 0 });
  A.fishRack(c.S, c.X(0.95), 2.5, -hd + 0.3, 1.1);
  { // a low bench under the window: a kettle, bowls, a tin of hooks
    const v = new VoxelBuilder();
    v.boxMin(-0.6, 0.38, -0.18, 0.6, 0.43, 0.18, C.woodL);
    for (const s of [-1, 1]) v.boxMin(s * 0.5 - 0.05, 0, -0.15, s * 0.5 + 0.05, 0.38, 0.15, C.woodD);
    A.kettle(v, -0.3, 0.43, 0, 0.8);
    A.bowl(v, 0.1, 0.43, 0.02, C.white, null, 1); A.bowl(v, 0.3, 0.43, -0.04, '#8FB0A0', null, 1);
    cyl(v, 0.48, 0.48, 0.0, 0.05, 0.05, 0.1, C.tin, 8);
    c.back(v, 0.95, { w: 1.2, d: 0.36 }, 'bench');
  }
  const o = new VoxelBuilder();
  A.oars(o, 0, 0, 2);
  c.put(o, hw - 0.45, -hd + 0.25, 0, null, 'oars', false);
  // the sleeping mat and a chest on the left wall
  c.onWall(A.sleepMat({ blanket: R.pick(['#C8323C', '#2E3D63', '#2F7C7A']) }), 'left', -0.5, null, 'sleepMat', 0.9, false);
  c.onWall(A.chest({ col: R.pick(['#5A6B70', C.maroon, '#3E6B4F']) }), 'left', 0.9, { w: 0.9, d: 0.5 }, 'chest');
  // the net being mended, spread on a mat in the middle
  const nx = -0.55, nz = -0.35;
  const n = A.floorMat(1.6, 1.2, C.mat, C.matD, 5);
  for (let k = 0; k < 14; k++) rb(n, -0.5 + (k % 7) * 0.16, 0.04, -0.2 + Math.floor(k / 7) * 0.3, 0.3, 0.05, 0.25, k % 2 ? C.net : C.netL, 0, k * 0.4, 0);
  for (let k = 0; k < 4; k++) cyl(n, 0.45, 0.04 + k * 0.05, 0.3, 0.06, 0.06, 0.05, k % 2 ? C.mustard : C.red, 6);
  c.put(n, nx, nz, 0, null, 'netMat', false);
  // traps, buckets, a basket of the catch at the front
  const t = new VoxelBuilder();
  A.trap(t, -0.25, 0, 0, 1); A.trap(t, 0.2, 0, 0.05, 0.9); A.trap(t, 0, 0.36, 0, 0.8);
  c.put(t, hw - 0.85, hd - 1.1, 0, { w: 0.9, d: 0.5 }, 'traps');
  const b = new VoxelBuilder();
  A.bucket(b, 0, 0, '#4F8A86'); A.basket(b, 0.42, 0, 0.05, '#C9CED1', 0.9, '#9EA6AA');
  c.put(b, -hw + 1.0, hd - 0.85, 0, { w: 0.9, d: 0.45 }, 'buckets');
  if (c.rain) { const d = new VoxelBuilder(); A.bucket(d, 0, 0, '#B9B4AA'); c.put(d, 1.1, -0.6, 0, { w: 0.3, d: 0.3 }, 'leakBucket'); } // under the leak
  common(c, { cal: hw > 2.9 ? ['back', -2.3, 1.85] : null, clock: null, lamps: [['back', 1.95, 'oil', 2.0]], plants: 0 });
  c.res('mend', nx - 0.2, nz - 0.2, 0.3, { role: R.pick(['man', 'woman', 'elder']), seat: 0.02 });
  if (R.chance(0.6)) c.res('play', 1.0, 0.4, -0.4, { role: 'child' });
  c.spot('net', nx + 0.7, nz + 0.8, PI - 0.4);
}

function gardener(c) {
  const { R, hw, hd } = c;
  c.back(A.seedRack({ w: 1.5, seed: c.seed % 9 }), -1.5, { w: 1.5, d: 0.5 }, 'seedRack');
  c.win({ x: 0.5, w: 1.1, curtain: R.chance(0.4) ? c.pal.curtain : null, shutters: false });
  c.back(A.shelves({ w: 1.2, h: 1.5, rows: 3, goods: R.pick(['pots', 'seed']), seed: c.seed % 13 }), 1.95, { w: 1.2, d: 0.36 }, 'potShelf');
  // herbs and onions hung to dry from a line over the window
  {
    const s = c.S, y = 2.5, z = -hd + 0.35;
    s.box(c.X(0.5), y, z, 1.6, 0.02, 0.02, C.bambooD);
    for (let i = 0; i < 8; i++) { const x = c.X(-0.2 + i * 0.2); s.box(x, y - 0.1, z, 0.01, 0.18, 0.01, C.rope); s.box(x, y - 0.24, z, 0.1, 0.14, 0.08, i % 3 === 2 ? '#C98A5A' : i % 2 ? C.leaf : C.leafD); }
  }
  c.sign('back', -1.5, 1.95, 0.9, 0.32, (g, w, h) => ART.boardSign(g, w, h, 'ပျိုးပင်', { bg: '#3E6B4F' }), 260); // DRAFT(my): seedlings
  // the potting table, seedlings and seed packets
  const tx = 0.6, tz = -0.4;
  const t = A.table({ w: 1.4, d: 0.7, h: 0.78, top: C.woodL });
  for (let i = 0; i < 6; i++) A.plantPot(t, -0.5 + i * 0.2, 0.78, -0.12 + (i % 2) * 0.2, 0.55, i % 4);
  t.boxMin(0.2, 0.78, 0.05, 0.6, 0.86, 0.3, '#6B4F35');
  A.wateringCan(t, -0.55, 0.78, 0.2, R.pick(['#4F8A86', '#C8323C', '#3D6FA8']));
  c.put(t, tx, tz, 0, { w: 1.4, d: 0.7 }, 'pottingTable');
  // soil sacks and pots at the front; tools on the left wall
  const v = new VoxelBuilder();
  A.sack(v, -0.25, 0, '#8E6644', 1, 0.2, '#5A4632');
  A.sack(v, 0.25, 0.05, '#A9824F', 0.9, -0.2, '#6B4F35');
  c.put(v, -hw + 1.0, hd - 0.9, 0, { w: 1.0, d: 0.5 }, 'soil');
  const p = new VoxelBuilder();
  for (let i = 0; i < 5; i++) A.plantPot(p, -0.5 + i * 0.25, 0, (i % 2) * 0.2, R.range(0.8, 1.2), i % 4, i % 2 ? C.terra : C.terraL);
  c.put(p, hw - 1.1, hd - 0.9, 0, { w: 1.3, d: 0.4 }, 'pots');
  const tr = new VoxelBuilder();
  A.toolRack(tr, 0, 1.75, 0, 'garden', 1.2);
  c.onWall(tr, 'left', -0.2, null, 'tools', 0.06, false);
  common(c, { cal: ['left', -hd + 1.0, 1.85], clock: [-1.5, 2.55], lamps: [['back', 1.95, null, 2.15]], plants: 0 });
  c.st.motes(c.X(0.5), 0.9, -hd + 1.3, 1.4, 1.2, 1.0);
  c.res('pot', tx + 0.45, tz - 0.62, -0.2, { role: R.pick(['woman', 'man', 'elder']) }); // behind the table, facing the room
  if (R.chance(0.55)) c.res(R.pick(['play', 'idle']), -1.0, 0.55, 0.4, { role: R.pick(['child', 'woman']) });
  c.spot('table', tx - 0.5, tz + 0.75, PI);
}

function studentA(c) {
  const { R, hw, hd } = c;
  c.win({ x: -0.6, w: 1.0, curtain: c.pal.curtain, shutters: false });
  const dx = -0.6, dz = -hd + 0.32;
  c.put(A.studyDesk({ seed: c.seed % 7 }), dx, dz, 0, { w: 1.1, d: 0.55 }, 'desk');
  c.put(A.chair({ col: R.pick([C.woodD, '#2F6B4F', C.teakD]) }), dx + 0.05, dz + 0.62, PI - 0.3, { w: 0.44, d: 0.44 }, 'chair');
  c.sign('back', 0.75, 1.82, 0.62, 0.72, (g, w, h) => ART.alphabetChart(g, w, h, c.seed), 240);
  c.sign('back', 0.75, 2.6, 0.72, 0.42, (g, w, h) => ART.townMap(g, w, h, c.seed), 240);
  c.sign('back', -2.05, 1.75, 0.6, 0.6, (g, w, h) => ART.timetable(g, w, h, c.seed), 240);
  c.back(A.shelves({ w: 1.1, h: 1.6, rows: 4, goods: 'books', seed: c.seed % 19 }), 1.85, { w: 1.1, d: 0.36 }, 'bookShelf');
  c.onWall(A.sleepPlatform({ w: 1.8, d: 1.0, h: 0.34, net: false, blanket: R.pick(['#3D6FA8', '#D9A93B', '#C8323C']), seed: c.seed % 5 }), 'left', 0.25, { w: 1.8, d: 1.0 }, 'bed');
  const v = A.floorMat(1.4, 1.0, c.pal.mat, jitter(c.pal.mat, -0.15, 3), 4);
  A.bookPile(v, -0.35, 0.016, 0.1, 3, c.seed % 5);
  A.satchel(v, 0.35, 0.016, -0.1, R.pick(['#2F6B4F', '#3D6FA8', C.maroon]));
  v.box(0.0, 0.02, 0.25, 0.3, 0.008, 0.22, C.paper, 0.4);
  c.put(v, 1.0, 0.25, 0, null, 'readingMat', false);
  common(c, { cal: ['right', -hd + 1.3, 1.85], clock: [-0.6, 2.62], lamps: [['left', -hd + 1.5]], plants: 1 });
  c.res('study', dx + 0.05, dz + 0.66, PI - 0.3, { role: R.pick(['teen', 'teen', 'child']), seat: 0.47 });
  if (R.chance(0.7)) c.res('read', 1.0, 0.4, -0.35, { role: R.pick(['child', 'teen']), seat: 0.02 });
  c.spot('desk', dx + 0.85, dz + 0.95, PI - 0.6);
}

function elderA(c) {
  const { R, hw, hd } = c;
  c.win({ x: 0.85, w: 1.0, curtain: c.pal.curtain, shutters: false });
  // the easy chair, a side table with the radio, the lacquer box on a low table
  const ex = -0.85, ez = -0.65;
  c.put(A.easyChair({ col: R.pick([C.rattan, '#B98A5A', '#C9A26A']) }), ex, ez, 0.2, { w: 0.7, d: 0.9 }, 'easyChair');
  const st = A.sideTable({});
  A.radio(st, 0, 0.62, 0, 1);
  A.thermos(st, -0.18, 0.62, 0.1, R.pick([C.red, C.teal]), 0.8);
  c.put(st, ex - 0.75, ez - 0.25, 0, { w: 0.55, d: 0.42 }, 'radioTable');
  const lt = A.lowRoundTable({ r: 0.32, h: 0.28, set: 'none' });
  lt.box(0, 0.33, 0, 0.26, 0.1, 0.18, '#7A1F22'); lt.box(0, 0.385, 0, 0.27, 0.015, 0.19, '#1E1414'); // a lacquer box
  A.teaGlass(lt, 0.18, 0.28, 0.1);
  c.put(lt, ex + 0.85, ez + 0.25, 0, { w: 0.64, d: 0.64 }, 'lowTable');
  frames(c, -0.95, 2.1, R.chance(0.5) ? ['portrait', 'diploma', 'one'] : ['one', 'portrait', 'landscape'], { gap: 0.6 });
  c.onWall(A.sleepPlatform({ w: 1.9, d: 1.2, net: R.chance(0.6), blanket: R.pick(['#7A5434', '#2E3D63', '#6E1F2A']), seed: c.seed % 7 }), 'right', -0.4, { w: 1.9, d: 1.2 }, 'bed');
  c.back(A.wardrobe({ wood: R.pick([C.teakD, '#8E5A3C']) }), -hw + 0.6, { w: 1.0, d: 0.5 }, 'wardrobe');
  const v = new VoxelBuilder();
  rb(v, 0, 0.45, 0, 0.035, 0.9, 0.035, C.woodD, 0, 0, 0.12); v.box(0.06, 0.88, 0, 0.12, 0.035, 0.035, C.woodD);
  c.put(v, ex + 0.42, ez + 0.35, 0, null, 'cane', false);
  c.onWall(A.waterStand({ n: 1 }), 'left', hd - 1.25, { w: 0.52, d: 0.5 }, 'water');
  common(c, { cal: ['back', 1.95, 1.65], clock: [1.95, 2.42], lamps: [['right', -hd + 1.45]], plants: 1 });
  c.st.motes(c.X(0.85), 0.9, -hd + 1.2, 1.2, 1.2, 1.0);
  c.res(R.chance(0.55) ? 'nap' : 'read', ex, ez + 0.1, 0.2, { role: 'elder', seat: 0.4 });
  if (R.chance(0.75)) c.res(R.pick(['play', 'sweep', 'idle']), 0.95, 0.45, -0.5, { role: R.pick(['child', 'teen', 'woman']) });
  c.spot('visit', ex + 0.95, ez + 0.95, PI - 0.3);
}

// ---- workshops by trade ----
function workshop(c) {
  const { R, hw, hd } = c;
  const trade = c.trade;
  const title = { carver: 'တံဆိပ်တုံး ထွင်းသည်', potter: 'မြေအိုး လုပ်ငန်း', printer: 'ပုံနှိပ်တိုက်', weaver: 'ယက်ကန်း', netmender: 'ပိုက်ကွန် ပြင်သည်', carpenter: 'လက်သမား' }[trade] || 'အလုပ်ရုံ'; // DRAFT(my)
  const signW = R.range(1.5, 2.0), signX = R.pick([-0.45, 0, 0.45]);
  c.sign('back', signX, 2.64, signW, 0.36, (g, w, h) => ART.boardSign(g, w, h, title, { bg: R.chance(0.5) ? c.pal.sign : R.pick(['#6E1F2A', '#2A2118', '#8E4A2C', '#2F5C5A']) }), 240);
  const winX = trade === 'printer' ? null : ['potter', 'weaver', 'carpenter'].includes(trade) ? -1.65 : 1.65;
  if (winX != null) c.win({ x: winX, w: 0.9, h: 0.9, curtain: null, shutters: false });
  const lampX = winX == null ? 1.95 : -Math.sign(winX) * 1.55;
  if (trade === 'carver') {
    const bx = -0.3, bz = -0.65;
    c.put(A.carverBench({ seed: c.seed % 9 }), bx, bz, 0, { w: 1.4, d: 0.6 }, 'bench');
    A.wallShelf(c.S, c.X(-0.35), 1.5, -hd + 0.02, 1.6, 'stamps', c.seed);
    A.wallShelf(c.S, c.X(-0.35), 1.95, -hd + 0.02, 1.6, 'stamps', c.seed + 3);
    A.toolRack(c.S, c.X(0.8), 1.62, -hd + 0.03, 'carver', 0.6);
    c.sign('back', -1.75, 1.42, 0.62, 0.62, (g, w, h) => ART.stampProofs(g, w, h, c.seed), 220);
    const v = new VoxelBuilder(); for (let i = 0; i < 9; i++) v.box(-0.3 + (i % 3) * 0.22, 0.1 + Math.floor(i / 3) * 0.2, 0, 0.2, 0.18, 0.2, jitter('#D9B07A', 0.1, i)); c.put(v, -hw + 0.8, hd - 1.1, 0, { w: 0.7, d: 0.3 }, 'blocks');
    const s = new VoxelBuilder(); const r = rand(c.seed); for (let i = 0; i < 26; i++) rb(s, r() * 1.4 - 0.7, 0.006, r() * 0.8 - 0.4, 0.07, 0.008, 0.03, '#E9C99A', 0, r() * 3, 0); c.put(s, bx, bz + 0.8, 0, null, 'shavings', false);
    const st = new VoxelBuilder(); A.stool(st, 0, 0, C.teakD, 0.32); c.put(st, bx + 0.25, bz - 0.6, 0, null, 'stool', false);
    c.res('carve', bx + 0.25, bz - 0.6, 0.1, { role: R.pick(['man', 'elder', 'woman']), seat: 0.32 });
    c.spot('bench', bx + 0.95, bz + 0.75, PI - 0.5);
  } else if (trade === 'potter') {
    const wx = -0.55, wz = -0.35;
    c.put(A.potWheel(), wx, wz, 0, { w: 1.0, d: 1.0 }, 'wheel');
    c.back(A.shelves({ w: 1.4, h: 1.45, rows: 3, goods: 'pots', seed: c.seed % 7, back: '#C49A6F' }), 1.0, { w: 1.4, d: 0.36 }, 'potShelf');
    const b = new VoxelBuilder();
    b.boxMin(-0.7, 0.3, -0.25, 0.7, 0.34, 0.25, C.woodL); for (const s of [-1, 1]) b.boxMin(s * 0.6 - 0.1, 0, -0.2, s * 0.6 + 0.1, 0.3, 0.2, C.brick);
    for (let i = 0; i < 4; i++) A.claypot(b, -0.5 + i * 0.33, 0.34, 0, 0.75, '#D9B48C');
    c.onWall(b, 'right', 0.3, { w: 1.4, d: 0.5 }, 'dryingBoard');
    const v = new VoxelBuilder(); for (let i = 0; i < 5; i++) v.box(-0.2 + (i % 3) * 0.2, 0.1 + Math.floor(i / 3) * 0.16, 0, 0.22, 0.18, 0.22, jitter(C.clayRaw, 0.08, i)); A.bucket(v, 0.55, 0, '#4F8A86'); c.put(v, -hw + 0.9, hd - 1.0, 0, { w: 1.1, d: 0.35 }, 'clay');
    c.res('throw', wx, wz - 0.5, 0.1, { role: R.pick(['woman', 'man']), seat: 0.3 });
    c.spot('wheel', wx + 0.95, wz + 0.8, PI - 0.5);
  } else if (trade === 'printer') {
    const px = -1.0, pz = -hd + 0.75;
    c.put(A.handPress(), px, pz, 0, { w: 1.1, d: 0.8 }, 'press');
    const t = new VoxelBuilder();
    t.boxMin(-0.55, 0, -0.25, 0.55, 1.2, 0.25, C.woodD);
    for (let r0 = 0; r0 < 8; r0++) for (let k = 0; k < 2; k++) { t.boxMin(-0.5 + k * 0.52, 0.06 + r0 * 0.14, 0.25, -0.02 + k * 0.52, 0.17 + r0 * 0.14, 0.265, jitter(C.woodL, 0.06, r0 + k)); t.box(-0.26 + k * 0.52, 0.115 + r0 * 0.14, 0.27, 0.06, 0.02, 0.01, C.gold); }
    t.boxMin(-0.6, 1.2, -0.3, 0.6, 1.26, 0.3, C.teak);
    A.bookPile(t, 0.2, 1.26, 0, 3, 3);
    c.back(t, 1.0, { w: 1.1, d: 0.5 }, 'typeCase');
    const y = 2.3, z = -hd + 1.25;
    c.S.box(0, y, z, c.W - 0.6, 0.015, 0.015, C.iron);
    for (let i = 0; i < 7; i++) { const x = -c.hw + 0.7 + i * ((c.W - 1.4) / 6); c.st.sign(0.34, 0.46, M(x, y - 0.25, z + 0.01, 0, 0, ((i % 2) - 0.5) * 0.06), (g, w, h) => ART.printedSheet(g, w, h, c.seed + i), 200); c.S.box(x, y - 0.01, z + 0.012, 0.04, 0.05, 0.02, C.woodL); }
    c.sign('back', 2.0, 1.6, 0.6, 0.78, (g, w, h) => ART.newsPage(g, w, h, c.seed), 200);
    const v = new VoxelBuilder(); for (let i = 0; i < 3; i++) for (let k = 0; k < 6; k++) v.box(-0.4 + i * 0.4, 0.02 + k * 0.035, 0, 0.36, 0.03, 0.28, k % 2 ? C.paper : C.cream); c.put(v, hw - 1.2, hd - 1.0, 0, { w: 1.2, d: 0.3 }, 'paper');
    c.res('press', px + 0.8, pz + 0.2, -HP + 0.45, { role: R.pick(['man', 'woman']) });
    c.spot('press', px + 0.5, pz + 1.05, PI - 0.3);
  } else if (trade === 'weaver') {
    const lx = -0.55, lz = -0.6;
    c.put(A.loom({ warp: R.pick(['#C8323C', '#2E3D63', '#2F7C7A', '#6B3E64']), weft: R.pick(['#E2B33C', '#F4EFE4', '#D97C8A']), seed: c.seed % 5 }), lx, lz, HP, { w: 1.4, d: 1.9 }, 'loom');
    c.back(A.shelves({ w: 1.3, h: 1.5, rows: 4, goods: 'yarn', seed: c.seed % 13 }), 1.05, { w: 1.3, d: 0.36 }, 'yarn');
    c.onWall(A.shelves({ w: 1.2, h: 1.2, rows: 3, goods: 'cloth', seed: c.seed % 11 }), 'right', 0.4, { w: 1.2, d: 0.36 }, 'cloth');
    for (let i = 0; i < 2; i++) c.sign('left', -hd + 1.0 + i * 0.6, 1.75, 0.48, 0.95, (g, w, h) => { const r = rand(c.seed + i); const cols = ['#C8323C', '#E2B33C', '#2E3D63', '#2F7C7A', '#F4EFE4', '#6B3E64']; for (let y0 = 0; y0 < h; y0 += 10) { g.fillStyle = cols[Math.floor(r() * 6)]; g.fillRect(0, y0, w, 10); } g.fillStyle = 'rgba(255,255,255,0.25)'; for (let k = 0; k < 6; k++) g.fillRect(0, (k * h) / 6, w, 3); }, 160);
    c.res('weave', lx + 0.76, lz, -HP + 0.25, { role: R.pick(['woman', 'woman', 'elder']), seat: 0.45 });
    c.spot('loom', lx + 1.0, lz + 1.0, PI - 0.5);
  } else if (trade === 'netmender') {
    A.hungNet(c.S, c.X(-1.35), 2.3, -hd + 0.02, 1.4, 1.3, C.net);
    A.hungNet(c.S, c.X(0.25), 2.3, -hd + 0.02, 1.0, 1.15, '#9C8B6E');
    { const v = new VoxelBuilder();
      v.boxMin(-0.6, 0.38, -0.18, 0.6, 0.43, 0.18, C.woodL);
      for (const s2 of [-1, 1]) v.boxMin(s2 * 0.5 - 0.05, 0, -0.15, s2 * 0.5 + 0.05, 0.38, 0.15, C.woodD);
      A.kettle(v, -0.3, 0.43, 0, 0.8); A.bowl(v, 0.05, 0.43, 0.02, C.white, null, 1);
      A.basket(v, 0.35, 0.43, 0, '#F2E8D2', 0.6, C.red);
      c.back(v, 1.65, { w: 1.2, d: 0.36 }, 'bench'); }
    A.fishRack(c.S, c.X(1.65), 2.5, -hd + 0.3, 1.0);
    { const o = new VoxelBuilder(); A.oars(o, 0, 0, 2); c.put(o, hw - 0.45, -hd + 0.25, 0, null, 'oars', false); }
    const n = A.floorMat(1.8, 1.3, C.mat, C.matD, 5);
    for (let k = 0; k < 18; k++) rb(n, -0.7 + (k % 9) * 0.16, 0.04, -0.3 + Math.floor(k / 9) * 0.3, 0.32, 0.06, 0.3, k % 2 ? C.net : C.netL, 0, k * 0.4, 0);
    for (let k = 0; k < 6; k++) cyl(n, 0.6, 0.04 + k * 0.05, 0.4, 0.06, 0.06, 0.05, k % 2 ? C.mustard : C.red, 6);
    c.put(n, -0.45, -0.35, 0, null, 'netMat', false);
    const t = new VoxelBuilder(); A.trap(t, -0.25, 0, 0, 1); A.trap(t, 0.2, 0, 0.05, 0.9); A.trap(t, 0, 0.36, 0, 0.8);
    c.put(t, hw - 0.85, hd - 1.1, 0, { w: 0.9, d: 0.5 }, 'traps');
    const r0 = new VoxelBuilder(); for (let k = 0; k < 5; k++) cyl(r0, 0, 0.03 + k * 0.05, 0, 0.3 - k * 0.02, 0.3 - k * 0.02, 0.05, k % 2 ? C.rope : '#B8986A', 10); c.put(r0, -hw + 0.8, hd - 1.0, 0, { w: 0.6, d: 0.6 }, 'rope');
    c.res('mend', -0.65, -0.55, 0.25, { role: R.pick(['man', 'woman', 'elder']), seat: 0.02 });
    c.spot('net', 0.5, 0.4, PI - 0.4);
  } else { // carpenter
    const bx = 0.35, bz = -0.55;
    const wb = A.workbench({ w: 1.7, seed: c.seed % 7 });
    rb(wb, -0.3, 0.84, 0.05, 0.9, 0.04, 0.18, C.woodL, 0, 0.2, 0); // a plank being planed
    c.put(wb, bx, bz, 0, { w: 1.7, d: 0.7 }, 'bench');
    A.toolRack(c.S, c.X(0.45), 2.0, -hd + 0.03, 'carpenter', 1.3);
    { // a cupboard half made: the frame, one side panel on, a door leaning against it
      const f = new VoxelBuilder(), wd = C.woodL;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) f.box(sx * 0.42, 0.55, sz * 0.18, 0.05, 1.1, 0.05, wd);
      for (const y of [0.05, 0.55, 1.08]) f.boxMin(-0.45, y - 0.025, -0.2, 0.45, y + 0.025, 0.2, jitter(wd, -0.08, y * 9));
      f.boxMin(-0.45, 0.03, -0.2, -0.42, 1.1, 0.2, jitter(wd, 0.05, 3));
      rb(f, 0.6, 0.48, 0.12, 0.4, 0.95, 0.03, jitter(wd, -0.05, 5), 0, 0.2, -0.12);
      c.back(f, -1.6, { w: 1.1, d: 0.45 }, 'cupboardFrame');
    }
    const p = new VoxelBuilder(); for (let i = 0; i < 5; i++) rb(p, i * 0.12, 1.1, 0, 0.1, 2.2, 0.04, jitter(C.woodL, 0.08, i), 0.12, 0, 0); c.put(p, hw - 0.9, -hd + 0.3, 0, null, 'planks', false);
    const ch = A.chair({ col: C.woodL }); c.put(ch, -1.35, 0.25, 0.5, { w: 0.44, d: 0.44 }, 'newChair');
    const s = new VoxelBuilder(); const r = rand(c.seed); for (let i = 0; i < 30; i++) rb(s, r() * 1.8 - 0.9, 0.005, r() * 0.9 - 0.45, 0.05, 0.008, 0.03, '#E9C99A', 0, r() * 3, 0); c.put(s, bx, bz + 0.85, 0, null, 'sawdust', false);
    c.res('plane', bx + 1.25, bz - 0.05, -HP + 0.35, { role: R.pick(['man', 'man', 'woman']) }); // at the bench's end, side on
    c.spot('bench', bx - 0.8, bz + 0.8, PI - 0.4);
  }
  common(c, { cal: R.chance(0.7) ? ['right', -hd + 1.2, 1.85] : null, clock: [Math.sign(lampX) * 2.25, 2.55], lamps: [['back', lampX, null, 2.1]], slippers: false, plants: 0, umbrella: false });
  if (R.chance(0.6)) c.res(R.pick(['sweep', 'idle']), 1.05, 0.6, -0.6, { role: R.pick(['teen', 'child', 'woman']) });
}


// ---------------------------------------------------------------------------------------------
// more layouts: the seed picks one per house, so neighbours of the same kind are not the same room
// ---------------------------------------------------------------------------------------------
function cushionsOn(v, y, xs, cols, w = 0.6, d = 0.5) { xs.forEach((x, i) => { v.box(x, y + 0.05, 0, w, 0.1, d, cols[i % cols.length]); v.box(x, y + 0.101, 0, w * 0.7, 0.004, d * 0.7, jitter(cols[i % cols.length], 0.15, i)); }); }

/** home B: the front room: a settee under the window, the glass cupboard, a sewing corner, a low table. */
function homeB(c) {
  const { R, hw, hd } = c;
  c.win({ x: -0.95, w: 1.0, curtain: c.pal.curtain, shutters: false });
  c.sign('back', -0.95, 2.62, 0.78, 0.34, (g, w, h) => ART.embroidery(g, w, h, R.pick(['ကျန်းမာပါစေ', 'အိမ်ချမ်းသာ', 'မင်္ဂလာပါ']), c.seed + 1), 260); // DRAFT(my)
  const se = new VoxelBuilder();
  { const w = 1.5, col = R.pick([C.rattan, '#B98A5A', C.teakD]);
    se.boxMin(-w / 2, 0.36, -0.3, w / 2, 0.44, 0.3, col);
    se.boxMin(-w / 2, 0.44, -0.3, w / 2, 0.86, -0.22, col);
    for (let k = 0; k < 5; k++) se.boxMin(-w / 2 + 0.05, 0.5 + k * 0.07, -0.222, w / 2 - 0.05, 0.52 + k * 0.07, -0.215, C.rattanD);
    for (const s of [-1, 1]) { se.boxMin(s * w / 2 - 0.05, 0, -0.3, s * w / 2 + 0.05, 0.62, 0.3, C.woodD); se.boxMin(s * w / 2 - 0.06, 0.6, -0.3, s * w / 2 + 0.06, 0.65, 0.32, C.woodD); }
    cushionsOn(se, 0.44, [-0.36, 0.36], [R.pick(['#C8323C', '#2F7C7A', '#D9A93B']), R.pick(['#6E1F2A', '#3D6FA8', '#D97C8A'])]);
  }
  c.back(se, -0.95, { w: 1.6, d: 0.62 }, 'settee');
  c.back(A.cupboard({ seed: c.seed % 11, wood: R.pick([C.woodD, C.teakD, '#8E5A3C']) }), 1.25, { w: 1.1, d: 0.42 }, 'cupboard');
  frames(c, 1.25, 2.38, R.chance(0.5) ? ['kids', 'landscape'] : ['portrait', 'boat'], { gap: 0.62, w: 0.4, h: 0.44 });
  // a low table and a mat before the settee
  c.put(A.floorMat(1.8, 1.1, c.pal.mat, jitter(c.pal.mat, -0.15, 2), c.seed), -0.95, -hd + 1.35, 0, null, 'mat', false);
  c.put(A.lowRoundTable({ seed: c.seed % 7, set: R.pick(['tea', 'books']) }), -0.95, -hd + 1.35, 0, { w: 0.8, d: 0.8 }, 'lowTable');
  // the sewing corner (the stool behind, so the one sewing faces the room)
  const sw = D.sewingTable(R);
  const sx = 1.3, sz = -0.25;
  c.put(sw.v, sx, sz, PI, { w: 0.9, d: 0.5 }, 'sewing');
  { const v = new VoxelBuilder(); for (let k = 0; k < 3; k++) v.box(0, 0.02 + k * 0.04, 0, 0.4, 0.04, 0.3, R.pick(['#E9DFC9', '#D97C8A', '#3D6FA8', '#E2B33C']), k * 0.2); c.put(v, sx + 0.75, sz + 0.1, 0, null, 'cloth', false); }
  clothesOnWall(c, 'left', -0.6, 0.6);
  c.onWall(A.chest({ col: R.pick([C.maroon, '#5A6B70', '#3E6B4F']) }), 'right', 0.6, { w: 0.9, d: 0.5 }, 'chest');
  common(c, { cal: ['back', 2.15, 1.75], clock: [0.15, 2.5], lamps: [['back', 0.15, null, 1.9]], fan: hw > 2.9 ? -2.2 : null, plants: 1 });
  c.res('sew', sx - 0.3, sz - 0.5, 0.1, { role: R.chance(0.8) ? 'woman' : 'man', seat: 0.42 });
  c.res(R.pick(['read', 'nap', 'idle']), -1.3, -hd + 0.48, 0, { role: R.pick(['elder', 'man', 'woman']), seat: 0.44 });
  if (R.chance(0.7)) c.res('play', -1.65, -hd + 1.75, 0.5, { role: 'child', seat: 0.02 });
  c.spot('sit', -0.25, -hd + 2.0, PI - 0.3);
}

/** home C: the kitchen and the family table: the stove, the water pots, a dining table with chairs. */
function homeC(c) {
  const { R, hw, hd } = c;
  const ck = cookCornerBack(c, -1.45);
  c.win({ x: 0.35, w: 0.9, h: 0.85, curtain: R.chance(0.5) ? c.pal.curtain : null, shutters: R.chance(0.4) });
  c.back(A.waterStand({ n: 2 }), 0.35, { w: 0.94, d: 0.5 }, 'water');
  // the meat safe (a screened cupboard) and tins on it
  const ms = new VoxelBuilder();
  { const w = 0.8, h = 1.45, wood = R.pick([C.woodD, '#5A6B70', '#3E6B4F']);
    ms.boxMin(-w / 2, 0, -0.2, w / 2, h, 0.2, wood);
    for (const y of [0.5, 0.98]) ms.boxMin(-w / 2 + 0.06, y, 0.2, w / 2 - 0.06, y + 0.4, 0.21, '#B9C4C4');
    for (let k = 0; k < 6; k++) ms.box(0, 0.55 + k * 0.14, 0.212, w - 0.14, 0.006, 0.004, '#8D9898');
    ms.boxMin(-w / 2, 0.08, 0.2, w / 2, 0.42, 0.215, jitter(wood, 0.1, 3));
    ms.box(0.3, 0.75, 0.22, 0.03, 0.08, 0.02, C.gold);
    for (let i = 0; i < 4; i++) cyl(ms, -0.27 + i * 0.18, h + 0.08, 0, 0.06, 0.06, 0.16, i % 2 ? C.tinL : C.tin, 8); }
  c.back(ms, 1.75, { w: 0.8, d: 0.4 }, 'meatSafe');
  // onions and chillies hung over the stove
  { const s = c.S, y = 2.35, z = -c.hd + 0.25; s.box(c.X(-1.45), y, z, 1.2, 0.02, 0.02, C.bambooD);
    for (let i = 0; i < 6; i++) { const x = c.X(-1.95 + i * 0.2); s.box(x, y - 0.12, z, 0.01, 0.2, 0.01, C.rope); s.box(x, y - 0.27, z, 0.09, 0.12, 0.09, i % 2 ? '#8E4A6A' : '#C8323C'); } }
  // the family table
  const tx = 0.95, tz = -0.35;
  const t = A.table({ w: 1.2, d: 0.75, h: 0.74, top: R.pick([C.woodL, '#E9DFC9', '#CFE0E6']) });
  A.cookPot(t, 0, 0.74, 0, 0.7, C.tinL);
  for (let k = 0; k < 3; k++) A.bowl(t, -0.4 + k * 0.4, 0.74, 0.22, C.white, ['#E9DFC9', '#8DBA6E', '#E2B33C'][k], 0.85);
  A.thermos(t, 0.45, 0.74, -0.2, R.pick([C.red, C.teal]), 0.9);
  c.put(t, tx, tz, 0, { w: 1.2, d: 0.75 }, 'table');
  const chairCol = R.pick([C.woodD, C.teakD, '#2F6B4F']);
  for (const cx2 of [-0.32, 0.32]) c.put(A.chair({ col: chairCol }), tx + cx2, tz - 0.55, 0, { w: 0.44, d: 0.44 }, 'chair');
  c.put(A.chair({ col: chairCol }), tx + 0.85, tz + 0.05, -HP, { w: 0.44, d: 0.44 }, 'chair');
  common(c, { cal: ['back', -0.55, 1.95], clock: [1.75, 2.55], lamps: [['back', 1.0, 'bulb', 2.05]], plants: 0 });
  c.st.motes(c.X(0.35), 0.9, -hd + 1.2, 1.2, 1.2, 1.0);
  c.res('cook', ck.x, ck.z, ck.h, { role: R.chance(0.75) ? 'woman' : 'man' });
  c.res(R.pick(['study', 'read']), tx - 0.32, tz - 0.55, 0, { role: R.pick(['child', 'teen']), seat: 0.47 });
  if (R.chance(0.65)) c.res('idle', tx + 0.32, tz - 0.55, 0, { role: R.pick(['elder', 'man', 'woman']), seat: 0.47 });
  c.spot('table', tx - 0.3, tz + 0.75, PI);
}
function home(c) { return [homeA, homeB, homeC][c.R.i(3)](c); }

/** elder B: sitting on the floor: a mat, the radio on a low table, the glass cabinet, drawn frames over it. */
function elderB(c) {
  const { R, hw, hd } = c;
  c.back(A.cupboard({ seed: c.seed % 13, wood: R.pick([C.teakD, '#8E5A3C', C.woodD]) }), -1.55, { w: 1.1, d: 0.42 }, 'cabinet');
  c.win({ x: 0.75, w: 1.0, curtain: c.pal.curtain, shutters: false });
  frames(c, -1.55, 2.4, R.chance(0.5) ? ['portrait', 'one'] : ['diploma', 'portrait'], { gap: 0.55, w: 0.42, h: 0.46 });
  c.sign('back', 1.95, 1.65, 0.5, 0.62, (g, w, h) => ART.framedPic(g, w, h, 'diploma', c.seed, '#A47A2C'), 240);
  // the sitting mat: a low table with the radio, a lacquer box, glasses of tea
  const mx = -0.4, mz = -hd + 1.55;
  c.put(A.floorMat(2.0, 1.4, c.pal.mat, jitter(c.pal.mat, -0.15, 4), c.seed), mx, mz, 0, null, 'mat', false);
  const lt = A.lowRoundTable({ r: 0.4, set: 'none', seed: c.seed % 5 });
  A.radio(lt, -0.1, 0.32, -0.05, 0.9);
  lt.box(0.2, 0.37, 0.12, 0.2, 0.09, 0.14, '#7A1F22'); lt.box(0.2, 0.418, 0.12, 0.21, 0.012, 0.15, '#1E1414');
  A.teaGlass(lt, 0.25, 0.32, -0.15); A.teaGlass(lt, 0.33, 0.32, -0.05, '#B98A5A');
  c.put(lt, mx, mz, 0, { w: 0.8, d: 0.8 }, 'lowTable');
  { const v = new VoxelBuilder(); A.cushion(v, -0.15, -0.55, R.pick(['#6E1F2A', '#2E3D63', '#C8323C']), 0.5, 0.45); A.cushion(v, 0.62, 0.15, R.pick(['#D9A93B', '#2F7C7A']), 0.45, 0.45); c.put(v, mx, mz, 0, null, 'cushions', false); }
  // the easy chair by the window, a cane leaning on it
  c.put(A.easyChair({ col: R.pick([C.rattan, '#B98A5A']) }), 1.3, -0.5, -0.35, { w: 0.7, d: 0.9 }, 'easyChair');
  { const v = new VoxelBuilder(); rb(v, 0, 0.45, 0, 0.035, 0.9, 0.035, C.woodD, 0, 0, 0.12); v.box(0.06, 0.88, 0, 0.12, 0.035, 0.035, C.woodD); c.put(v, 0.8, -0.3, 0, null, 'cane', false); }
  c.onWall(A.sleepPlatform({ w: 1.9, d: 1.2, net: R.chance(0.6), blanket: R.pick(['#7A5434', '#2E3D63', '#6E1F2A']), seed: c.seed % 7 }), 'right', 0.9, { w: 1.9, d: 1.2 }, 'bed');
  common(c, { cal: ['back', 0.0, 1.75], clock: [0.75, 2.6], lamps: [['back', -0.55, null, 2.15]], plants: 1 });
  c.st.motes(c.X(0.75), 0.9, -hd + 1.2, 1.2, 1.2, 1.0);
  c.res(R.pick(['idle', 'read']), mx - 0.15, mz - 0.55, 0.1, { role: 'elder', seat: 0.08 });
  if (R.chance(0.6)) c.res(R.pick(['nap', 'read']), 1.3, -0.45, -0.35, { role: 'elder', seat: 0.42 });
  else if (R.chance(0.7)) c.res('play', mx + 0.62, mz + 0.15, -1.2, { role: 'child', seat: 0.08 });
  c.spot('visit', mx + 0.9, mz + 0.85, PI - 0.4);
}
function elder(c) { return [elderA, elderB][c.R.i(2)](c); }

/** student B: studying on the floor: the low table under the window, the bed along the back wall, posters. */
function studentB(c) {
  const { R, hw, hd } = c;
  c.back(A.sleepPlatform({ w: 1.8, d: 1.0, h: 0.34, net: false, blanket: R.pick(['#3D6FA8', '#D9A93B', '#C8323C', '#2F7C7A']), seed: c.seed % 5 }), -hw + 0.98, { w: 1.8, d: 1.0 }, 'bed');
  c.win({ x: 0.45, w: 1.0, curtain: c.pal.curtain, shutters: false });
  c.back(A.shelves({ w: 1.0, h: 1.55, rows: 4, goods: R.pick(['books', 'mixed']), seed: c.seed % 23 }), 1.9, { w: 1.0, d: 0.36 }, 'bookShelf');
  c.sign('back', -1.85, 1.95, 0.6, 0.72, (g, w, h) => ART.alphabetChart(g, w, h, c.seed), 240);
  c.sign('back', -1.05, 2.05, 0.6, 0.6, (g, w, h) => ART.timetable(g, w, h, c.seed + 2), 240);
  c.sign('back', 1.9, 2.35, 0.72, 0.42, (g, w, h) => ART.townMap(g, w, h, c.seed + 1), 240);
  // the low table and a cushion on a mat before the window
  const mx = 0.45, mz = -hd + 1.35;
  c.put(A.floorMat(1.6, 1.1, c.pal.mat, jitter(c.pal.mat, -0.15, 3), c.seed + 2), mx, mz, 0, null, 'mat', false);
  c.put(A.lowRoundTable({ r: 0.38, set: 'books', seed: c.seed % 5 }), mx, mz, 0, { w: 0.76, d: 0.76 }, 'lowTable');
  { const v = new VoxelBuilder(); A.cushion(v, 0, -0.55, R.pick(['#C8323C', '#2F7C7A', '#D9A93B']), 0.45, 0.42); A.satchel(v, 0.62, 0.012, 0.15, R.pick(['#2F6B4F', '#3D6FA8', C.maroon])); c.put(v, mx, mz, 0, null, 'cushion', false); }
  // drawings pinned on the left wall
  for (let i = 0; i < 3; i++) c.sign('left', -0.6 + i * 0.5, 1.95 + (i % 2) * 0.06, 0.4, 0.32, (g, w, h) => ART.framedPic(g, w, h, ['landscape', 'boat', 'kids'][(c.seed + i) % 3], c.seed + i, '#F6F0E2'), 160);
  common(c, { cal: ['right', -hd + 1.3, 1.85], clock: [0.45, 2.62], lamps: [['back', -0.55, 'bulb', 2.2]], plants: 1 });
  c.res('study', mx, mz - 0.55, 0, { role: R.pick(['teen', 'teen', 'child']), seat: 0.08 });
  if (R.chance(0.65)) c.res('read', -hw + 1.2, -hd + 0.6, 0.15, { role: R.pick(['child', 'teen']), seat: 0.44 });
  c.spot('desk', mx + 0.85, mz + 0.75, PI - 0.5);
}
function student(c) { return [studentA, studentB][c.R.i(2)](c); }

/** shop B: shelves right across the back, the counter turned along the left side, a stepped stand of produce. */
function shopB(c) {
  const { R, hw, hd } = c;
  const goods = ['tins', 'jars', 'bottles', 'mixed', 'cloth'];
  for (const [x, i] of [[-1.55, 0], [0.0, 1], [1.55, 2]]) c.back(A.shelves({ w: 1.4, h: 1.85, rows: 4, goods: R.pick(goods), seed: c.seed % 31 + i * 5, wood: i === 1 ? C.teakD : C.woodD }), x, { w: 1.4, d: 0.36 }, 'shelf');
  { const a = c.X(-2.2), b = c.X(2.2); A.packetStrips(c.S, Math.min(a, b), Math.max(a, b), 2.42, -hd + 0.45, c.seed % 7 + 2); }
  const name = R.pick([['ကုန်စုံဆိုင်', 'sundries'], ['ဆန် ဆီ ဆား', 'rice · oil · salt'], ['မုန့်မျိုးစုံ', 'snacks'], ['အိမ်သုံးပစ္စည်း', 'household goods']]); // DRAFT(my)
  c.sign('back', 0, 2.72, 2.2, 0.36, (g, w, h) => ART.boardSign(g, w, h, name[0], { bg: R.pick([c.pal.sign, '#6E1F2A', '#2F5C5A']) }), 240);
  // the counter along the left, the keeper on a stool behind it facing the walkway
  const cx = -1.55, cz = -0.2;
  c.put(A.shopCounter({ w: 1.7, seed: c.seed % 23, body: R.pick([C.woodD, '#4F6F55', '#6E1F2A']) }), cx, cz, HP, { w: 1.7, d: 0.6 }, 'counter');
  // the keeper on a stool at the counter's back end, facing the room
  { const v = new VoxelBuilder(); A.stool(v, 0, 0, C.teakD, 0.5); c.put(v, cx + 0.05, cz - 1.2, 0, null, 'stool', false); }
  c.res('keep', cx + 0.05, cz - 1.2, 0.3, { role: R.pick(['woman', 'man', 'elder']), seat: 0.5 });
  // a stepped stand of produce baskets on the right
  const sv = new VoxelBuilder();
  for (let k = 0; k < 3; k++) sv.boxMin(-0.6, 0, -0.15 - k * 0.25, 0.6, 0.22 + k * 0.22, 0.1 - k * 0.25, jitter(C.woodL, 0.06, k));
  const fills = [['#C8323C', '#A82A30'], ['#8E4A6A', '#B5643C'], ['#8DBA6E', '#6F9E5B'], ['#E2B33C', '#D98A3A'], ['#F2E6CC', '#E9DFC9']];
  for (let k = 0; k < 3; k++) for (let i = 0; i < 3; i++) { const [a, b] = R.pick(fills); A.basket(sv, -0.38 + i * 0.38, 0.22 + k * 0.22, -0.02 - k * 0.25, a, 0.7, b); }
  c.put(sv, 1.6, -0.2, 0, { w: 1.2, d: 0.8 }, 'produce');
  common(c, { cal: ['right', -hd + 0.9, 1.85], clock: null, lamps: [['back', 0.78, 'bulb', 2.25]], slippers: false, plants: 0 });
  c.res('idle', cx + 0.75, cz + 0.15, -HP + 0.2, { role: R.pick(['woman', 'man', 'teen', 'child']) });
  c.spot('customer', cx + 0.7, cz - 0.45, -HP);
}
function shop(c) { return [shopA, shopB][c.R.i(2)](c); }

/** tea B: the urn counter at the back left, a glass case of snacks at the right, tables in rows. */
function teaB(c) {
  const { R, hw, hd } = c;
  const kx = -1.35, kz = -hd + 1.0;
  {
    const y = 0.8;
    const v = A.shopCounter({ w: 1.7, d: 0.6, h: y, glass: false, scale: false, seed: c.seed % 5, body: R.pick(['#2F7C7A', C.woodD, '#6E1F2A']) });
    cyl(v, -0.45, y + 0.2, 0, 0.17, 0.17, 0.4, C.tinL, 10); cyl(v, -0.45, y + 0.42, 0, 0.12, 0.17, 0.06, C.tin, 10); v.box(-0.45, y + 0.12, 0.18, 0.04, 0.04, 0.06, C.gold); // the urn
    for (let i = 0; i < 2; i++) A.thermos(v, 0.0 + i * 0.16, y, -0.12, [C.red, C.blue][i], 0.85);
    for (let i = 0; i < 8; i++) A.teaGlass(v, 0.35 + (i % 4) * 0.08, y, 0.0 + Math.floor(i / 4) * 0.1, i % 3 ? '#C79A68' : '#D9B48C');
    c.put(v, kx, kz, 0, { w: 1.7, d: 0.6 }, 'teaCounter');
    c.st.steam(c.X(kx - 0.45), y + 0.5, kz, 6);
  }
  A.wallShelf(c.S, c.X(kx), 1.55, -hd + 0.02, 1.5, 'jars', c.seed + 5);
  c.sign('back', kx, 2.12, 1.4, 0.48, (g, w, h) => ART.boardSign(g, w, h, R.pick(['လမင်း လက်ဖက်ရည်', 'ညီအစ်ကို လက်ဖက်ရည်', 'မနက်ခင်း လက်ဖက်ရည်']), { bg: c.pal.sign }), 240); // DRAFT(my)
  c.win({ x: 0.45, w: 1.0, curtain: null, shutters: false });
  // the glass case of snacks
  { const v = A.table({ w: 1.1, d: 0.55, h: 0.8, top: C.teak });
    v.boxMin(-0.5, 0.8, -0.22, 0.5, 0.83, 0.22, C.woodD);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * 0.48, 1.0, sz * 0.2, 0.03, 0.4, 0.03, C.woodD);
    v.boxMin(-0.5, 1.2, -0.22, 0.5, 1.22, 0.22, '#E3EEF0');
    for (let i = 0; i < 8; i++) v.box(-0.36 + (i % 4) * 0.24, 0.86, -0.08 + Math.floor(i / 4) * 0.16, 0.14, 0.06, 0.1, ['#E8A94A', '#D98A3A', '#F0C070', '#C98A4A'][i % 4], i * 0.4);
    c.back(v, 1.75, { w: 1.1, d: 0.55 }, 'snackCase'); }
  c.sign('back', 1.75, 1.95, 0.95, 0.72, (g, w, h) => ART.chalkBoard(g, w, h, 'မုန့်', [['ပလာတာ', 800], ['စမူဆာ', 300], ['ကြက်ဥကြော်', 500]], c.seed), 220); // DRAFT(my)
  const tables = [[1.35, -0.55], [-1.45, 0.25], [1.4, 0.75]];
  tables.forEach(([x, z], i) => {
    c.put(A.teaTable({ seed: c.seed + i + 3 }), x, z, 0, { w: 0.62, d: 0.62 }, 'teaTable');
    const v = new VoxelBuilder();
    for (const [sx, sz] of [[-0.48, 0], [0.48, 0], [0, -0.48]]) A.stool(v, sx, sz, R.pick(['#C8323C', '#3D6FA8', '#2F7C7A', C.teakD]), 0.28);
    c.put(v, x, z, 0, null, 'stools', false);
  });
  common(c, { cal: ['back', -0.35, 1.9], clock: [-0.35, 2.6], lamps: [['back', 1.0, null, 2.4]], fan: hw > 2.9 ? -2.4 : null, slippers: false, plants: 1 });
  c.res('pour', kx + 1.2, kz - 0.1, -HP + 0.3, { role: R.pick(['man', 'woman']) }); // at the counter's end, by the glasses
  c.res(R.pick(['read', 'idle']), tables[0][0], tables[0][1] - 0.48, 0.1, { role: R.pick(['elder', 'man']), seat: 0.28 });
  if (R.chance(0.75)) c.res('idle', tables[1][0], tables[1][1] - 0.48, 0.25, { role: R.pick(['woman', 'teen', 'man']), seat: 0.28 });
  c.spot('sit', tables[2][0] - 0.48, tables[2][1], HP);
}
function tea(c) { return [teaA, teaB][c.R.i(2)](c); }

// ---- the Blank Page: a room that is still being drawn ----
function wire(v, x0, y0, z0, x1, y1, z1, col = '#3A342E', t = 0.022, skip = []) {
  const E = [
    [[x0, y0, z0], [x1, y0, z0]], [[x0, y1, z0], [x1, y1, z0]], [[x0, y0, z1], [x1, y0, z1]], [[x0, y1, z1], [x1, y1, z1]],
    [[x0, y0, z0], [x0, y1, z0]], [[x1, y0, z0], [x1, y1, z0]], [[x0, y0, z1], [x0, y1, z1]], [[x1, y0, z1], [x1, y1, z1]],
    [[x0, y0, z0], [x0, y0, z1]], [[x1, y0, z0], [x1, y0, z1]], [[x0, y1, z0], [x0, y1, z1]], [[x1, y1, z0], [x1, y1, z1]],
  ];
  E.forEach(([a, b], i) => {
    if (skip.includes(i)) return;
    v.boxMin(Math.min(a[0], b[0]) - t / 2, Math.min(a[1], b[1]) - t / 2, Math.min(a[2], b[2]) - t / 2, Math.max(a[0], b[0]) + t / 2, Math.max(a[1], b[1]) + t / 2, Math.max(a[2], b[2]) + t / 2, col);
  });
}
function blank(c) {
  const { R, hw, hd } = c;
  const W = '#FBFAF6', INK = '#3A342E';
  c.win({ x: 1.1, w: 1.0, curtain: null, shutters: false, bars: 0, frame: '#FFFFFF', sill: '#F1EFE9', sun: true });
  c.sign('back', -0.9, 1.55, 3.2, 1.75, (g, w, h) => ART.sketchWall(g, w, h, c.seed), 170);
  // a table: top finished in white, legs still pencil lines; one stool coloured in, one only drawn
  const t = new VoxelBuilder();
  t.boxMin(-0.6, 0.7, -0.4, 0.6, 0.76, 0.4, W);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) t.boxMin(sx * 0.52 - 0.012, 0, sz * 0.32 - 0.012, sx * 0.52 + 0.012, 0.7, sz * 0.32 + 0.012, INK);
  A.bookPile(t, -0.2, 0.76, 0, 2, 4);
  t.box(0.25, 0.77, 0.05, 0.3, 0.012, 0.22, W, 0.2);
  c.put(t, 0.4, -0.5, 0, { w: 1.2, d: 0.8 }, 'table');
  const s = new VoxelBuilder();
  A.stool(s, -0.85, 0, R.pick(['#E2B33C', '#C8323C', '#4F8A86']), 0.45);
  wire(s, 0.7, 0, -0.18, 1.06, 0.45, 0.18);
  c.put(s, 0.4, -0.5, 0, null, 'stools', false);
  // a sofa that is only an outline, half hatched with a pencil
  const so = new VoxelBuilder();
  wire(so, -0.9, 0, -0.4, 0.9, 0.45, 0.4, INK, 0.025);
  wire(so, -0.9, 0.45, -0.4, 0.9, 0.95, -0.22, INK, 0.025, [8, 9]);
  for (let k = 0; k < 8; k++) so.boxMin(-0.85 + k * 0.1, 0.0, 0.38, -0.84 + k * 0.1, 0.45, 0.39, '#B8B2A6'); // pencil hatching on its front
  c.onWall(so, 'left', -0.5, { w: 1.8, d: 0.8 }, 'sofaSketch');
  // a shelf drawn, two books coloured in
  const sh = new VoxelBuilder();
  wire(sh, -0.55, 0, -0.17, 0.55, 1.4, 0.17, INK, 0.022);
  for (const y of [0.45, 0.9]) sh.boxMin(-0.55, y - 0.01, -0.17, 0.55, y + 0.01, 0.17, INK);
  sh.boxMin(-0.45, 0.46, -0.1, -0.38, 0.72, 0.1, '#C8323C'); sh.boxMin(-0.37, 0.46, -0.1, -0.3, 0.68, 0.1, '#2F5DB3');
  c.onWall(sh, 'right', -0.7, { w: 1.1, d: 0.34 }, 'shelfSketch');
  // a rug half coloured; the big pencil leaning on the wall; an eraser and its crumbs
  const rg = new VoxelBuilder();
  rg.boxMin(-1.0, 0, -0.6, 0, 0.012, 0.6, '#E8A0A8');
  rg.boxMin(0, 0, -0.6, 1.0, 0.012, 0.6, W);
  wire(rg, -1.0, 0.0, -0.6, 1.0, 0.014, 0.6, INK, 0.02);
  for (let k = 0; k < 9; k++) rg.boxMin(-0.1 + k * 0.11, 0.013, -0.55, -0.08 + k * 0.11, 0.016, 0.55, '#E3DED3');
  c.put(rg, -0.4, 0.55, 0, null, 'rug', false);
  const p = new VoxelBuilder();
  rb(p, 0, 1.05, 0, 0.12, 2.0, 0.12, '#E8B832', 0, 0, 0.18);
  rb(p, -Math.sin(0.18) * 1.1, 0.0 + 0.04, 0, 0.1, 0.18, 0.1, '#EBD3A8', 0, 0, 0.18);
  rb(p, Math.sin(0.18) * 1.05, 2.07, 0, 0.12, 0.14, 0.12, '#E9A0A0', 0, 0, 0.18);
  c.put(p, hw - 0.5, -hd + 0.5, 0, { w: 0.4, d: 0.3 }, 'pencil');
  const e = new VoxelBuilder();
  e.box(0, 0.08, 0, 0.42, 0.16, 0.22, '#E9A0A0', 0.3); e.box(0.12, 0.08, 0.05, 0.16, 0.162, 0.222, '#7FB0CF', 0.3);
  const r = rand(c.seed); for (let k = 0; k < 10; k++) e.box(0.3 + r() * 0.6, 0.015, -0.2 + r() * 0.4, 0.05, 0.03, 0.04, k % 3 ? '#E9C9C8' : '#D9B3B2');
  c.put(e, hw - 1.3, hd - 1.0, 0, { w: 0.5, d: 0.3 }, 'eraser');
  common(c, { cal: null, clock: [1.1, 2.6], lamps: [['back', 2.15, 'oil', 2.05]], slippers: true, plants: 0 });
  c.res('draw', -0.4, -hd + 1.05, PI - 0.5, { role: R.pick(['woman', 'teen', 'man']) });
  c.spot('table', 0.4, 0.3, PI);
}

export const KINDS = { home, shop, tea, baker, fisher, gardener, student, elder, workshop, blank };
