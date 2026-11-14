// Diary Garden fill pass (district 6): the small town around the Garden's story places. Homes, shophouses, tea stalls,
// workshops and yards along every road and lane, back lanes through the north half of the page with houses on both
// sides, and back lots with gardens, sheds and trees, so from the low walking camera there is no wide bare paper and
// from the overview the Garden reads as a whole small town. Called once from regions/garden.js:
// fillTown({ ITEMS, add }) after everything else is laid; every thing here checks that it is clear of what is already
// there, of the roads and of the story places (doors, desks, day spots: 2 m) before it goes down. A tree in the way of
// a new house is moved out (trees are not story things); anything else in the way wins and the new thing is skipped.
//
// Light on purpose (phone budget): every house is a handful of outlined boxes merged into the chunk mesh, small
// details (windows, goods, weave bands) go in the flat no-outline Geo, the far rows use the 'far' style (four boxes).
// Original art; same kit as ../art/garden.js (outlined boxes, item-local, feet at y = 0, fronts face +Z).
// Imports only kit.js. Every Burmese string is a draft for Maya. Signs only name a trade, never a way.
//
// ART
//   gfHome { w, d, seed, style, roof?, sign? }   style: 'stilt' (timber house up on posts, woven walls, veranda and
//        steps) | 'shop2' (two-storey shophouse: open shop below with goods and an awning, timber upper floor with a
//        balcony; `sign` = { my, en } a trade name board) | 'brick' (brick house, lime-washed or bare, tiered roof, a
//        porch) | 'wood' (plank house on a low plinth, a side lean-to) | 'far' (the far rows: body, gable, roof)
//   gfWorkshop { seed, trade: 'carpenter' | 'bikes' | 'potter' }   an open tin lean-to with a bench and the trade's things
// PROP
//   gfTeaStall { seed }      a roadside tea stall: low table, tiny stools, a kettle on a brazier, a cloth awning
//   gfJars { n, seed }       big glazed water jars with lids (the household's water)
//   gfBanana { s, seed }     a clump of banana plants
//   gfTrishaw { col }        a side-car trishaw parked
//   gfShed { seed }          a tiny tin shed for tools
//   gfRail { len, gx, gw, h, col }   a light yard fence (posts and two rails), a gap at gx; col: 'bamboo' | 'wood'
//   gfPicket { len, gx, gw, h, col } a picket fence like the plots' but lighter (front yards of the cottages)
//   gfFolk { pose, seed, kid? }      a townsperson at work, still (merged into the chunk: no draw call):
//        'sweep' (broom), 'carry' (a yoke of two buckets), 'head' (a basket on the head), 'squat' (weeding),
//        'sit' (on a low stool), 'stand', 'play' (a child with a cane ball)
import { rng, shade } from '../kit.js';

const K = {
  ink: '#2A2118', dark: '#3A2E25', iron: '#4A3B30', wood: '#B58A5A', woodD: '#7A5434', woodL: '#CDA577', woodG: '#9E8A70', woodR: '#A0704A',
  bamboo: '#D2B970', bambooD: '#A48B48', bambooL: '#E0CC8E', thatch: '#D2B46A', thatchD: '#B39350',
  brick: '#A0503A', brickD: '#7E3C2B', stone: '#C4BBA8', stoneD: '#A79E8B', mortar: '#D9C3A6',
  tin: '#A9B4B8', tinD: '#8B979C', clay: '#B9653F', clayD: '#8C4A2C', glaze: '#6B4A2E', glazeL: '#8A6440', terra: '#B5643C',
  leaf: '#6F9E5B', leafD: '#4F7F43', leafL: '#8DBA6E', leafY: '#A8C46A',
  white: '#FFFDF8', cream: '#F3E9D6', glass: '#BFD3E0', red: '#C8323C', mustard: '#E2B33C', teal: '#4E8C86', blue: '#2F5DB3',
  rose: '#E8A0A8', orange: '#E9862E', maroon: '#6E1F2A', skin: ['#E9C39B', '#D9A77A', '#C68E62', '#B07A50', '#946240'],
};
const SH = '#E6D8C4';
const WALLS = ['#F4EBDD', '#DCE5CB', '#F0DDB0', '#F2DCD2', '#EFE6D2', '#E2ECEC', '#F3E3C3'];
const ROOFS = ['#6E9A7A', '#A9B4B8', '#B5643C', '#A0503A', '#5D86A8', '#7A2E36', '#8E9A9E', '#4E8C86', '#C0783E'];
const SHUT = ['#4F7F43', '#4E8C86', '#2F5DB3', '#6E1F2A', '#C8323C', '#7A5434', '#3A6B3C'];
const CLOTH = ['#C8323C', '#2F5DB3', '#4E8C86', '#E2B33C', '#6E1F2A', '#7E6BA8', '#3A6B3C', '#E9862E', '#F3E9D6', '#8C5A3A'];
const pick = (a, r) => a[Math.floor(r() * a.length) % a.length];

// ---------------------------------------------------------------------------------
// builders
// ---------------------------------------------------------------------------------
/** A gable roof, ridge along X: two slabs and a ridge (3 boxes). */
function gable(g, W, D, y0, rise, col, over = 0.35) {
  const half = D / 2 + over, ang = Math.atan2(rise, D / 2), sl = half / Math.cos(ang);
  for (const sz of [-1, 1]) g.boxR(0, y0 + rise / 2 + 0.05, (sz * half) / 2, W + over * 2, 0.1, sl, sz > 0 ? col : shade(col, 0.86), sz * ang, 0, 0);
  g.box(0, y0 + rise + 0.07, 0, W + over * 2 + 0.04, 0.1, 0.2, shade(col, 0.78));
}
/** The triangle under a gable, stepped (2 boxes). */
function gableFill(g, W, D, y0, rise, col) {
  g.box(0, y0 + rise * 0.25, 0, W - 0.04, rise * 0.5, D * 0.72, col);
  g.box(0, y0 + rise * 0.7, 0, W - 0.06, rise * 0.42, D * 0.3, col);
}
/** A two-tier hipped roof (3 boxes). */
function hip(g, W, D, y0, col) {
  g.box(0, y0 + 0.16, 0, W + 0.6, 0.32, D + 0.6, col);
  g.box(0, y0 + 0.48, 0, W * 0.72, 0.32, D * 0.6, shade(col, 0.9));
  g.box(0, y0 + 0.72, 0, W * 0.4, 0.16, 0.3, shade(col, 0.78));
}
function win(g, f, x, y, z, w, h, shut) {
  g.box(x, y, z, w + 0.12, h + 0.12, 0.05, K.white);
  f.box(x, y, z + 0.035, w, h, 0.02, K.glass);
  if (shut) f.box(x - w / 2 - 0.16, y, z + 0.04, 0.24, h, 0.02, shut), f.box(x + w / 2 + 0.16, y, z + 0.04, 0.24, h, 0.02, shut);
}

// ---------------------------------------------------------------------------------
// ART: gfHome
// ---------------------------------------------------------------------------------
function home(g, f, it, ctx) {
  const W = it.w || 5, D = it.d || 4.4, seed = it.seed || 1, r = rng(seed), st = it.style || 'wood';
  const roof = it.roof || pick(ROOFS, r), shut = pick(SHUT, r), wall = pick(WALLS, r);
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.45, D / 2 + 0.6, 0.004, SH);
  if (st === 'far') {
    const H = 2.2 + r() * 0.5, col = r() < 0.4 ? pick([K.bamboo, K.woodR, K.wood], r) : wall;
    g.box(0, H / 2, 0, W, H, D, col);
    gableFill(g, W, D, H, 0.9, col);
    gable(g, W, D, H, 0.95, roof, 0.3);
    f.box((r() - 0.5) * W * 0.4, 0.95, D / 2 + 0.02, 0.85, 1.85, 0.02, K.dark);
    f.box(W / 2 - 0.9, 1.4, D / 2 + 0.02, 0.7, 0.6, 0.02, shut);
    return;
  }
  if (st === 'stilt') {
    // a timber house up on posts: woven-bamboo walls behind a veranda, a gable roof, steps down to the yard
    const Hs = 0.85 + r() * 0.3, H = 2.15, VD = 1.0, wz = D / 2 - VD, col = r() < 0.6 ? K.bamboo : K.woodL;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (W / 2 - 0.15), Hs / 2, sz * (D / 2 - 0.15), 0.18, Hs, 0.18, K.woodD);
    g.box(0, Hs + 0.06, 0, W + 0.1, 0.12, D + 0.1, K.wood);
    g.box(0, Hs + 0.12 + H / 2, (wz - D / 2) / 2, W - 0.1, H, wz + D / 2, col);
    for (const k of [0, 1]) f.box(0, Hs + 0.6 + k * 0.85, wz + 0.01, W - 0.12, 0.05, 0.02, K.bambooD);
    const dx = (r() < 0.5 ? -1 : 1) * W * 0.2;
    f.box(dx, Hs + 1.07, wz + 0.02, 0.9, 1.85, 0.02, K.dark);
    f.box(-dx, Hs + 1.4, wz + 0.02, 0.85, 0.65, 0.02, K.dark);
    g.boxR(-dx, Hs + 1.86, wz + 0.22, 0.95, 0.05, 0.46, shut, -0.7, 0, 0); // the shutter propped open
    for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.15), Hs + 0.12 + H / 2, D / 2 - 0.12, 0.13, H, 0.13, K.woodD);
    g.box(-dx / 2 - Math.sign(dx || 1) * 0.6, Hs + 0.6, D / 2 - 0.1, W * 0.45, 0.07, 0.07, K.woodL); // the veranda rail
    g.box(dx, Hs * 0.62, D / 2 + 0.35, 1.0, 0.07, 0.34, K.woodL); g.box(dx, Hs * 0.28, D / 2 + 0.68, 1.0, 0.07, 0.34, K.woodL);
    g.box(-dx + 0.3, Hs + 0.32, D / 2 - 0.5, 0.36, 0.36, 0.36, K.terra);
    gableFill(g, W - 0.1, D, Hs + 0.12 + H, 0.95, col);
    gable(g, W, D, Hs + 0.12 + H, 1.05, roof);
    return;
  }
  if (st === 'shop2') {
    // two storeys: an open shop below (goods on shelves, an awning), a timber upper floor with a balcony
    const H1 = 2.6, H2 = 2.2, col2 = r() < 0.5 ? K.woodR : wall, fz = D / 2 + 0.02;
    g.box(0, 0.09, 0, W + 0.16, 0.18, D + 0.16, K.stone);
    g.box(0, 0.18 + H1 / 2, 0, W, H1, D, wall);
    f.box(0, 1.22, fz, W - 0.8, 1.95, 0.02, K.dark);
    const goods = [K.mustard, K.red, K.blue, K.white, K.teal, '#F3B27A', '#D6B486', K.rose, K.leaf];
    for (let k = 0; k < 2; k++) {
      f.box(0, 0.75 + k * 0.6, fz + 0.04, W - 1.0, 0.04, 0.12, K.woodL);
      for (let x = -W / 2 + 0.85; x < W / 2 - 0.6; x += 0.8) f.box(x, 0.92 + k * 0.6, fz + 0.05, 0.6, 0.28, 0.06, pick(goods, r));
    }
    g.box(-W / 2 + 0.95, 0.5, fz + 0.4, 1.3, 0.62, 0.55, K.woodL); // the counter / a sack bench at the front
    f.box(-W / 2 + 0.95, 0.84, fz + 0.4, 1.1, 0.06, 0.4, pick(goods, r));
    const aw = pick(CLOTH, r);
    g.boxR(0, 2.55, fz + 0.55, W + 0.1, 0.06, 1.2, aw, 0.3, 0, 0);
    for (let x = -W / 2 + 0.45; x < W / 2; x += 0.9) f.boxR(x, 2.59, fz + 0.55, 0.36, 0.02, 1.18, K.cream, 0.3, 0, 0);
    // the upper floor, a little forward over the shop
    g.box(0, 0.18 + H1 + 0.06, 0.12, W + 0.1, 0.12, D + 0.24, K.woodD);
    g.box(0, 0.18 + H1 + 0.12 + H2 / 2, 0, W - 0.1, H2, D - 0.1, col2);
    for (const sx of [-1, 1]) win(g, f, sx * W * 0.24, 0.18 + H1 + 1.25, D / 2 - 0.03, 0.8, 0.9, shut);
    g.box(0, 0.18 + H1 + 0.62, D / 2 + 0.17, W * 0.82, 0.07, 0.07, K.woodL); // the balcony rail
    for (let x = -W * 0.4; x <= W * 0.41; x += 0.7) f.box(x, 0.18 + H1 + 0.38, D / 2 + 0.17, 0.05, 0.46, 0.05, K.woodL);
    if (r() < 0.6) f.box(W * 0.1, 0.18 + H1 + 0.45, D / 2 + 0.22, W * 0.5, 0.5, 0.02, pick(CLOTH, r)); // a longyi over the rail
    const y2 = 0.18 + H1 + 0.12 + H2;
    if (r() < 0.5) { gableFill(g, W - 0.1, D - 0.1, y2, 1.0, col2); gable(g, W - 0.1, D - 0.1, y2, 1.1, roof, 0.38); } else hip(g, W - 0.1, D - 0.1, y2, roof);
    if (it.sign) ctx.signs.push({ x: 0, y: 0.18 + H1 - 0.05, z: fz + 0.92, w: Math.min(W - 0.4, 2.6), h: 0.5, lines: [{ text: it.sign.my, size: 50 }, { text: it.sign.en, size: 20, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: '#FFF8E8', border: '#6E1F2A', width: 448, height: 120 });
    return;
  }
  if (st === 'brick') {
    const H = 2.6, bare = r() < 0.45, col = bare ? K.brick : wall, fz = D / 2 + 0.02;
    g.box(0, 0.1, 0, W + 0.2, 0.2, D + 0.2, K.stone);
    g.box(0, 0.2 + H / 2, 0, W, H, D, col);
    if (bare) for (let k = 0; k < 4; k++) f.box(0, 0.55 + k * 0.55, fz, W - 0.02, 0.03, 0.02, K.mortar);
    else for (const sx of [-1, 1]) f.box(sx * (W / 2 - 0.2), 0.9, fz, 0.32, 0.5, 0.02, K.brick); // the lime worn off at the corners
    const dx = (r() - 0.5) * W * 0.3;
    g.box(dx, 1.2, fz, 1.1, 2.0, 0.05, K.woodD); f.box(dx, 1.15, fz + 0.03, 0.9, 1.85, 0.02, shut);
    for (const sx of [-1, 1]) { const x = dx + sx * Math.max(1.35, W * 0.3); if (Math.abs(x) < W / 2 - 0.5) win(g, f, x, 1.55, fz, 0.75, 0.8, shut); }
    g.boxR(dx, 2.45, fz + 0.45, 1.8, 0.07, 1.0, shade(roof, 0.95), 0.25, 0, 0);
    for (const sx of [-0.75, 0.75]) g.box(dx + sx, 1.2, fz + 0.85, 0.08, 2.4, 0.08, K.woodD);
    hip(g, W, D, 0.2 + H, roof);
    return;
  }
  // 'wood': a plank house on a low plinth, a side lean-to for the kitchen
  const H = 2.3, col = pick([K.woodR, K.wood, K.woodG, '#B9946A'], r), fz = D / 2 + 0.02;
  g.box(0, 0.2, 0, W + 0.1, 0.4, D + 0.1, K.woodD);
  g.box(0, 0.4 + H / 2, 0, W, H, D, col);
  for (let k = 0; k < 3; k++) f.box(0, 0.85 + k * 0.55, fz, W - 0.02, 0.03, 0.02, shade(col, 0.8));
  const dx = (r() - 0.5) * W * 0.35;
  f.box(dx, 1.33, fz + 0.01, 0.85, 1.8, 0.02, K.dark);
  g.box(dx, 0.22, fz + 0.3, 1.1, 0.12, 0.5, K.woodL); // the step
  win(g, f, dx + (dx < 0 ? 1.4 : -1.4), 1.6, fz, 0.75, 0.7, shut);
  gableFill(g, W, D, 0.4 + H, 1.0, col);
  gable(g, W, D, 0.4 + H, 1.1, roof);
  // the lean-to on one side
  const sx = r() < 0.5 ? -1 : 1, LW = 1.5;
  g.box(sx * (W / 2 + LW / 2), 0.95, -0.2, LW, 1.9, D * 0.6, K.bamboo);
  g.boxR(sx * (W / 2 + LW / 2), 2.05, -0.2, LW + 0.3, 0.06, D * 0.7, shade(roof, 0.92), 0, 0, sx * 0.25);
  if (r() < 0.6) g.box(sx * (W / 2 + LW / 2), 2.3, -0.6, 0.22, 0.6, 0.22, K.brickD); // the kitchen flue
}

// ---------------------------------------------------------------------------------
// ART: gfWorkshop (an open tin lean-to)
// ---------------------------------------------------------------------------------
function workshop(g, f, it) {
  const r = rng(it.seed || 5), W = 3.4, D = 2.4, trade = it.trade || 'carpenter';
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.3, D / 2 + 0.6, 0.004, trade === 'carpenter' ? '#E3CFA8' : SH);
  for (const sx of [-1, 1]) { g.box(sx * W / 2, 1.25, D / 2, 0.12, 2.5, 0.12, K.woodD); g.box(sx * W / 2, 1.0, -D / 2, 0.12, 2.0, 0.12, K.woodD); }
  g.boxR(0, 2.3, 0, W + 0.5, 0.07, D + 0.6, pick(ROOFS, r), -0.2, 0, 0);
  g.box(0, 0.95, -D / 2 + 0.05, W, 1.9, 0.06, K.bambooL); // the back wall
  if (trade === 'carpenter') {
    g.box(0, 0.75, -0.3, 2.2, 0.1, 0.7, K.woodL); for (const sx of [-0.95, 0.95]) g.box(sx, 0.36, -0.3, 0.1, 0.72, 0.6, K.woodD);
    g.boxR(0.9, 0.45, 0.85, 0.9, 0.08, 0.4, K.woodD, 0, 0.3, 0); g.boxR(0.5, 0.52, 0.75, 1.6, 0.06, 0.22, K.woodL, 0, 0.3, 0.1); // a sawhorse, a plank
    g.box(-1.2, 0.2, 0.6, 1.1, 0.4, 0.5, K.wood); // the plank stack
    for (let k = 0; k < 6; k++) f.flat(-0.8 + r() * 1.6, 0.2 + r() * 0.6, -0.65 + r() * 1.6, 0.3 + r() * 0.6, 0.006, '#F1E2BE');
  } else if (trade === 'bikes') {
    g.box(-0.4, 0.4, 0.2, 0.06, 0.8, 0.06, K.iron); g.box(-0.4, 0.82, 0.2, 0.7, 0.7, 0.04, '#2A2420'); f.box(-0.4, 0.82, 0.23, 0.5, 0.5, 0.02, '#8C8981');
    g.box(0.6, 0.4, -0.5, 1.2, 0.8, 0.5, K.woodL); f.box(0.6, 0.82, -0.5, 1.0, 0.04, 0.4, K.iron);
    g.box(1.1, 0.12, 0.55, 0.5, 0.24, 0.4, K.tin); f.box(1.1, 0.25, 0.55, 0.42, 0.02, 0.32, '#9CC3DE');
    for (const x of [-1.2, 1.3]) g.box(x, 0.32, -0.9, 0.62, 0.62, 0.05, '#2A2420'); // tyres hung on the wall
  } else {
    g.box(0, 0.4, -0.4, 0.7, 0.8, 0.7, K.woodD); g.box(0, 0.86, -0.4, 0.6, 0.1, 0.6, K.woodL); g.box(0, 1.05, -0.4, 0.34, 0.3, 0.34, K.clay);
    for (let k = 0; k < 5; k++) g.box(-1.3 + k * 0.5, 0.18, 0.75, 0.34, 0.36, 0.34, k % 2 ? K.clay : K.clayD);
  }
}

// ---------------------------------------------------------------------------------
// props
// ---------------------------------------------------------------------------------
function teaStall(g, f, it) {
  const r = rng(it.seed || 3), aw = pick(CLOTH, r);
  f.flat(-1.6, -1.0, 1.6, 1.2, 0.004, SH);
  for (const sx of [-1.35, 1.35]) g.box(sx, 1.05, -0.8, 0.08, 2.1, 0.08, K.bambooD);
  g.boxR(0, 2.05, -0.1, 3.0, 0.05, 1.7, aw, 0.22, 0, 0);
  g.box(0, 0.42, 0.2, 1.4, 0.06, 0.7, K.woodL); f.box(-0.6, 0.2, 0.2, 0.06, 0.4, 0.6, K.woodD); f.box(0.6, 0.2, 0.2, 0.06, 0.4, 0.6, K.woodD);
  for (const [x, z] of [[-0.95, 0.2], [0.95, 0.2], [-0.3, 0.85], [0.35, 0.85]]) g.box(x, 0.13, z, 0.3, 0.26, 0.3, pick([K.red, K.blue, K.teal, K.mustard], r));
  for (const x of [-0.3, 0.1, 0.4]) f.box(x, 0.49, 0.2, 0.1, 0.08, 0.1, K.white); // cups
  g.box(-1.0, 0.25, -0.65, 0.5, 0.5, 0.5, K.clayD); g.box(-1.0, 0.6, -0.65, 0.3, 0.22, 0.3, K.iron); // the brazier and kettle
  g.box(0.9, 0.35, -0.65, 0.7, 0.7, 0.45, K.woodD); f.box(0.9, 0.72, -0.65, 0.5, 0.04, 0.3, K.glass); // the cupboard of tea leaves and condensed milk
}
function jars(g, f, it) {
  // the big glazed water jars every house keeps: a round belly (stepped), a shoulder, a neck, a wooden lid, a cup
  const n = it.n || 3, r = rng(it.seed || 2);
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.8, s = 0.85 + r() * 0.25, c = i % 2 ? K.glaze : K.glazeL;
    g.box(x, 0.1 * s, 0, 0.42 * s, 0.2 * s, 0.42 * s, shade(c, 0.85));
    g.box(x, 0.4 * s, 0, 0.66 * s, 0.42 * s, 0.66 * s, c);
    g.box(x, 0.7 * s, 0, 0.46 * s, 0.18 * s, 0.46 * s, shade(c, 1.1));
    g.box(x, 0.84 * s, 0, 0.38 * s, 0.06, 0.38 * s, K.woodL);
    f.box(x, 0.48 * s, 0.335 * s, 0.5 * s, 0.05, 0.01, '#C9A24A'); // the band round the belly
    if (i === 0) f.box(x + 0.1, 0.9 * s, 0.05, 0.1, 0.08, 0.1, K.tin);
  }
  f.flat(-n * 0.42, -0.4, n * 0.42, 0.45, 0.004, SH);
}
function banana(g, f, it) {
  const s = it.s || 1, r = rng(it.seed || 4);
  for (let k = 0; k < 2; k++) {
    const x = (k - 0.5) * 0.7 * s, h = (1.5 + r() * 0.6) * s;
    g.box(x, h / 2, (r() - 0.5) * 0.3, 0.2 * s, h, 0.2 * s, K.leafY);
    for (let j = 0; j < 2; j++) { const a = r() * Math.PI; g.boxR(x + Math.cos(a) * 0.45 * s, h + 0.05, Math.sin(a) * 0.45 * s, 1.3 * s, 0.05, 0.42 * s, j ? K.leaf : K.leafL, 0, a, 0.35); }
  }
}
function trishaw(g, f, it) {
  const col = it.col || K.teal;
  for (const x of [-0.55, 0.55]) g.box(x, 0.33, 0, 0.66, 0.66, 0.04, '#2A2420');
  g.box(0.25, 0.33, 0.85, 0.6, 0.6, 0.04, '#2A2420');
  g.box(0, 0.62, 0, 1.15, 0.06, 0.06, col); g.box(-0.15, 0.85, 0, 0.26, 0.06, 0.14, K.ink); g.box(0.55, 0.95, 0, 0.06, 0.5, 0.5, K.iron);
  g.box(0.25, 0.55, 0.62, 1.0, 0.36, 0.7, col); g.box(0.25, 0.78, 0.62, 0.9, 0.08, 0.6, K.cream); // the side-car with its seat
  g.boxR(0.25, 1.42, 0.62, 1.1, 0.05, 0.82, shade(col, 0.8), 0.15, 0, 0);
  f.box(-0.25, 1.1, 0.95, 0.04, 0.6, 0.04, K.iron);
  f.flat(-0.9, -0.3, 0.95, 1.25, 0.004, SH);
}
function shed(g, f, it) {
  const r = rng(it.seed || 6), roof = pick(ROOFS, r);
  g.box(0, 0.85, 0, 1.6, 1.7, 1.3, pick([K.tin, K.woodG, K.bamboo, K.woodR], r));
  g.boxR(0, 1.8, 0, 1.9, 0.06, 1.6, roof, -0.18, 0, 0);
  f.box(0.2, 0.75, 0.66, 0.7, 1.4, 0.02, K.dark);
  f.flat(-1.0, -0.8, 1.0, 1.1, 0.004, SH);
}
function rail(g, f, it) {
  const L = it.len || 6, H = it.h || 0.9, gx = it.gx ?? null, gw = it.gw || 1.2, bam = it.col !== 'wood';
  const parts = gx == null ? [[-L / 2, L / 2]] : [[-L / 2, gx - gw / 2], [gx + gw / 2, L / 2]];
  for (const [a, b] of parts) {
    if (b - a < 0.25) continue;
    const n = Math.max(1, Math.round((b - a) / 2.0));
    for (let i = 0; i <= n; i++) g.box(a + ((b - a) * i) / n, H / 2, 0, 0.09, H, 0.09, bam ? (i % 2 ? K.bambooD : K.bamboo) : K.woodD);
    for (const y of [H * 0.42, H * 0.85]) g.box((a + b) / 2, y, 0.04, b - a, 0.05, 0.05, bam ? K.bambooL : K.woodL);
  }
}
function picket(g, f, it) {
  // the same white pickets as the plots' fences, fewer of them: posts at the ends, pickets every 0.55 m
  const L = it.len || 6, H = it.h || 0.7, gx = it.gx ?? null, gw = it.gw || 1.2, col = it.col || K.white;
  const parts = gx == null ? [[-L / 2, L / 2]] : [[-L / 2, gx - gw / 2], [gx + gw / 2, L / 2]];
  for (const [a, b] of parts) {
    if (b - a < 0.2) continue;
    const len = b - a, n = Math.max(1, Math.round(len / 0.55));
    g.box((a + b) / 2, H * 0.55, -0.02, len, 0.06, 0.05, K.woodL);
    for (let i = 0; i <= n; i++) {
      const x = a + (len * i) / n, post = i === 0 || i === n;
      g.box(x, (post ? H + 0.08 : H) / 2, 0.03, post ? 0.12 : 0.08, post ? H + 0.08 : H, post ? 0.12 : 0.035, post ? K.woodD : col);
    }
    f.flat(a, -0.14, b, 0.24, 0.006, SH);
  }
}
function person(g, f, it) {
  // a still townsperson in the game's own build (a big head, a short body): longyi / htamein, a top, arms with
  // hands, a face, hair; the pose's tool. Poses stand up (a still figure squatting reads as a box from the road).
  const r = rng(it.seed || 7), kid = !!it.kid, s = kid ? 0.68 : 1, pose = it.pose || 'stand';
  const skin = pick(K.skin, r), top = pick([K.white, K.cream, '#9CC3DE', '#E8A0A8', K.mustard, '#A8C46A', '#D6B486', '#C9D8E8'], r), low = pick(CLOTH, r);
  const hair = r() < 0.15 && !kid ? '#BDB6AA' : '#2A2118', woman = r() < 0.55, bend = pose === 'sweep' ? 0.3 : 0;
  f.flat(-0.3 * s, -0.28 * s, 0.3 * s, 0.3 * s, 0.005, '#DCCDB6');
  // legs in the longyi (a little narrower at the hem), feet
  g.box(0, 0.36 * s, 0, 0.34 * s, 0.68 * s, 0.26 * s, low);
  f.box(0, 0.5 * s, 0.135 * s, 0.3 * s, 0.04, 0.01, shade(low, 0.75)); // the knot / a fold line
  for (const sx of [-0.08, 0.08]) f.box(sx * s, 0.03, 0.04, 0.1 * s, 0.06, 0.16 * s, '#3A2E25');
  const ty = 0.68 * s + 0.24 * s;
  g.boxR(0, ty, 0.04 * bend, 0.4 * s, 0.48 * s, 0.26 * s, top, bend, 0, 0);
  // the head: big, the face toward +Z
  const hy = ty + 0.24 * s + 0.21 * s, hz = 0.16 * bend;
  g.box(0, hy, hz, 0.38 * s, 0.38 * s, 0.36 * s, skin);
  for (const sx of [-0.08, 0.08]) f.box(sx * s, hy + 0.02 * s, hz + 0.181 * s, 0.05 * s, 0.06 * s, 0.01, '#2A2118');
  if (woman && !kid) for (const sx of [-0.12, 0.12]) f.box(sx * s, hy - 0.07 * s, hz + 0.181 * s, 0.08 * s, 0.07 * s, 0.01, '#EFD9A8'); // thanaka
  g.box(0, hy + 0.21 * s, hz - 0.02, 0.4 * s, 0.1 * s, 0.4 * s, hair);
  g.box(0, hy + 0.02 * s, hz - 0.19 * s, 0.4 * s, 0.34 * s, 0.06 * s, hair);
  if (woman && !kid) g.box(0, hy + 0.12 * s, hz - 0.26 * s, 0.16 * s, 0.16 * s, 0.12 * s, hair); // the bun
  const arms = (lz, ly, up = false) => {
    for (const sx of [-1, 1]) {
      g.box(sx * 0.26 * s, ty + ly * s, lz * s, 0.11 * s, 0.4 * s, 0.11 * s, top);
      f.box(sx * 0.26 * s, ty + (ly + (up ? 0.24 : -0.24)) * s, lz * s, 0.1 * s, 0.1 * s, 0.1 * s, skin);
    }
  };
  if (pose === 'sweep') {
    arms(0.16, -0.06);
    g.boxR(0.06, 0.55, 0.4, 0.05, 1.1, 0.05, K.bambooD, 0.45, 0, 0); g.box(0.06, 0.07, 0.66, 0.4, 0.12, 0.12, K.thatch);
    for (let k = 0; k < 3; k++) f.flat(0.3 + r() * 0.6, 0.55 + r() * 0.5, 0.42 + r() * 0.6, 0.65 + r() * 0.5, 0.006, K.leafY);
  } else if (pose === 'carry') {
    arms(0, 0.06, true); g.box(0, ty + 0.27 * s, -0.02, 1.5, 0.06, 0.06, K.bambooD);
    for (const sx of [-0.7, 0.7]) { f.box(sx, ty - 0.05, 0, 0.02, 0.62, 0.02, K.iron); g.box(sx, ty - 0.5, 0, 0.32, 0.34, 0.32, K.tin); }
  } else if (pose === 'head') {
    arms(0, 0.3, true); g.box(0, hy + 0.34 * s, 0, 0.56 * s, 0.16 * s, 0.56 * s, K.bamboo); f.box(0, hy + 0.45 * s, 0, 0.42 * s, 0.08, 0.42 * s, pick([K.orange, K.leafL, K.red], r));
  } else if (pose === 'play') {
    arms(0.08, 0.06); f.box(0.36 * s + 0.2, 0.45, 0.4, 0.18, 0.18, 0.18, K.bambooL);
  } else arms(0, 0);
}

/** A raised bed like the plots' (frame, soil, a dated board at the head) with its crop as leafy rows: the light
 * stand-in for the Garden's decorative beds (regions/garden.js keeps the story plots' own beds). */
const CROPC = { cabbage: ['#8DBA6E', '#B9D49A'], onion: ['#A8C46A', '#F3E9D6'], chilli: ['#4F7F43', '#C8323C'], tomato: ['#5C8A4C', '#D8452E'],
  marigold: ['#4F7F43', '#E9A22E'], herb: ['#4F7F43', '#8DBA6E'], flower: ['#5C8A4C', '#E8A0A8'] };
function lightBed(g, f, it) {
  const W = it.w || 3, D = it.d || 1.2, r = rng(it.seed || 5), H = 0.24, [leaf, acc] = CROPC[it.crop] || CROPC.cabbage;
  g.box(0, H / 2, 0, W, H, D, shade(K.woodD, 0.95 + r() * 0.1));
  f.box(0, H + 0.01, 0, W - 0.12, 0.03, D - 0.12, '#8A6648');
  const rows = Math.max(1, Math.round((D - 0.2) / 0.42));
  for (let j = 0; j < rows; j++) {
    const pz = -D / 2 + 0.1 + ((j + 0.5) * (D - 0.2)) / rows;
    g.box(0, H + 0.1, pz, W - 0.34, 0.18 + r() * 0.06, 0.26, shade(leaf, 0.92 + r() * 0.16));
    for (let px = -W / 2 + 0.35 + (j % 2) * 0.2; px < W / 2 - 0.3; px += 0.55) f.box(px, H + 0.21, pz + (r() - 0.5) * 0.08, 0.14, 0.08, 0.14, acc);
  }
  const bx = -W / 2 - 0.12;
  g.box(bx, 0.26, D / 2 - 0.2, 0.04, 0.52, 0.04, K.woodD);
  g.box(bx, 0.48, D / 2 - 0.16, 0.34, 0.22, 0.03, K.white);
  f.box(bx - 0.08, 0.52, D / 2 - 0.14, 0.1, 0.06, 0.012, K.maroon);
  f.flat(-W / 2 - 0.1, -D / 2 - 0.1, W / 2 + 0.2, D / 2 + 0.22, 0.005, SH);
}

const obB = (w, d, cx = 0, cz = 0) => (it) => {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const X = it.x + cx * c + cz * s, Z = it.z - cx * s + cz * c;
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return [{ type: 'box', minX: X - hw, maxX: X + hw, minZ: Z - hd, maxZ: Z + hd }];
};
const fenceOb = (it) => {
  const L = it.len || 6, gx = it.gx ?? null, gw = it.gw || 1.2;
  const parts = gx == null ? [[-L / 2, L / 2]] : [[-L / 2, gx - gw / 2], [gx + gw / 2, L / 2]];
  return parts.filter(([a, b]) => b - a > 0.2).flatMap(([a, b]) => obB(b - a, 0.2, (a + b) / 2, 0)(it));
};
/** The house's own footprint plus, for a wood house, its lean-to (the side the seed picks) and a stilt house's steps. */
function homeOb(it) {
  const W = it.w || 5, D = it.d || 4.4, out = obB(W, D)(it);
  if (it.style === 'wood') out.push(...obB(W + 3.2, D * 0.6, 0, -0.2)(it)); // (the lean-to, on whichever side)
  if (it.style === 'stilt') out.push(...obB(W * 0.7, 0.9, 0, D / 2 + 0.45)(it)); // (the steps)
  if (it.style === 'shop2') out.push(...obB(1.4, 0.6, -W / 2 + 0.95, D / 2 + 0.4)(it));
  return out;
}

export const TOWN_ART = {
  gfHome: { draw: home, h: 4.6, map: true, obstacles: homeOb },
  gfWorkshop: { draw: workshop, h: 2.6, map: true, obstacles: obB(3.6, 2.6) },
};
export const TOWN_PROP = {
  gfTeaStall: { draw: teaStall, obstacles: (it) => [...obB(1.5, 0.75, 0, 0.2)(it), ...obB(2.9, 0.5, 0, -0.75)(it)] },
  gfJars: { draw: jars, obstacles: (it) => obB((it.n || 3) * 0.8, 0.7)(it) },
  gfBanana: { draw: banana, obstacles: (it) => [{ type: 'circle', x: it.x, z: it.z, r: 0.5 * (it.s || 1) }] },
  gfTrishaw: { draw: trishaw, obstacles: obB(1.5, 1.6, 0, 0.4) },
  gfShed: { draw: shed, obstacles: obB(1.7, 1.4) },
  gfRail: { draw: rail, obstacles: fenceOb },
  gfPicket: { draw: picket, obstacles: fenceOb },
  gfBed: { draw: lightBed, obstacles: (it) => obB(it.w || 3, it.d || 1.2)(it) },
  gfFolk: { draw: person, obstacles: (it) => [{ type: 'circle', x: it.x, z: it.z, r: it.kid ? 0.2 : 0.28 }] },
};

// ---------------------------------------------------------------------------------
// The fill
// ---------------------------------------------------------------------------------
const HP = Math.PI / 2, PI = Math.PI;
/** The north road's centre x at z (its polyline (140, 100) (140, 70) (142, 46) (140, 18)). */
function northX(z) {
  if (z >= 70) return 140;
  if (z >= 46) return 140 + (2 * (70 - z)) / 24;
  return 142 - (2 * (46 - z)) / 28;
}
// the roads (centre lines, half the road's width) and the town's own back lanes (earth footpaths)
const ROADS = [
  { a: [137, 100], b: [261, 100], half: 1.3 }, { a: [172, 100], b: [172, 138], half: 1.3 }, { a: [258, 100], b: [258, 138], half: 1.3 },
  { a: [140, 100], b: [140, 70], half: 1.3 }, { a: [140, 70], b: [142, 46], half: 1.3 }, { a: [142, 46], b: [140, 16], half: 1.3 },
];
/** The back lanes: earth paths on the page, walkable (no road for the car), houses on both sides. */
export const LANES = [
  { id: 'bl1', a: [142.2, 57], b: [264.6, 57], w: 1.7 }, // the first back lane, across the north half
  { id: 'bl2', a: [142.4, 33], b: [264.6, 33], w: 1.6 }, // the second, near the hedge
  { id: 'ns1', a: [177.6, 98.6], b: [177.6, 33], w: 1.5 }, // up from the lane between the street gardens and the square
  { id: 'bl0', a: [186.4, 80.4], b: [255.0, 80.4], w: 1.3 }, // the back alley behind the kiln square
  { id: 'ns2', a: [264.6, 98.6], b: [264.6, 33], w: 1.6 }, // up the east edge from the lane's end
  { id: 'ns3', a: [213, 82.4], b: [213, 33], w: 1.4 }, // behind the kiln yard
  { id: 'bl3', a: [184, 119.4], b: [247.5, 119.4], w: 1.4 }, // behind the lane's south cottages
  { id: 'bl4', a: [126, 119.0], b: [159.8, 119.0], w: 1.4 }, // west of the crease lane, south of the lane
];
const segDist = (x, z, [ax, az], [bx, bz]) => {
  const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz, t = L2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2)) : 0;
  return Math.hypot(x - ax - dx * t, z - az - dz * t);
};
/** clearance of a rect (world AABB) from every road's kerb and lane's edge (negative: on it) */
function wayGap(r) {
  let best = Infinity;
  const probe = (x, z) => {
    for (const w of ROADS) best = Math.min(best, segDist(x, z, w.a, w.b) - w.half);
    for (const w of LANES) best = Math.min(best, segDist(x, z, w.a, w.b) - w.w / 2);
  };
  // the rect's edges, sampled
  const [x0, z0, x1, z1] = r, nx = Math.max(1, Math.ceil((x1 - x0) / 0.5)), nz = Math.max(1, Math.ceil((z1 - z0) / 0.5));
  for (let i = 0; i <= nx; i++) { probe(x0 + ((x1 - x0) * i) / nx, z0); probe(x0 + ((x1 - x0) * i) / nx, z1); }
  for (let j = 0; j <= nz; j++) { probe(x0, z0 + ((z1 - z0) * j) / nz); probe(x1, z0 + ((z1 - z0) * j) / nz); }
  // (a rect straddling a centre line: its centre)
  probe((x0 + x1) / 2, (z0 + z1) / 2);
  return best;
}
// story places nothing new may come near: the kiln square and the plots, the clasp and the desk inside it, the doors
const CORE = [[184.5, 83.6, 257.0, 99.2], [251.5, 126.5, 266.5, 138], [240, 99, 243, 103]];
const KEEP = [ // day spots (day10-garden, day12-set, day14-world), desks, the pond, the hedge gap: 2 m clear
  [262.6, 128.4], [214, 94.4], [160.6, 69.8], [140, 19.4], [138.3, 20], [258, 134.4], [204.6, 102.7], [248.5, 101.3], [244, 101.4], [241.2, 102.05], [233, 98], [172, 134], [258, 131],
];
const FLAT = new Set(['tufts', 'gdVerge', 'gdKerbDrain', 'gdMeadow', 'gdPaving', 'gdPressed', 'gdRibbon', 'gdBorder', 'gdDryMat', 'flowers', 'diaryEdge']);
// (walk-through too, but nothing new may stand on them: the paths to the gates, the chalk game)
const ALONG_Z = new Set(['gdStones', 'gdGravel']);
const TREE = new Set(['padauk', 'rain']);
function rectOf(it, def) {
  if (FLAT.has(it.k)) return null;
  const ob = def?.obstacles?.(it);
  if (ob && ob.length) {
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const o of ob) {
      if (o.type === 'circle') { x0 = Math.min(x0, o.x - o.r); x1 = Math.max(x1, o.x + o.r); z0 = Math.min(z0, o.z - o.r); z1 = Math.max(z1, o.z + o.r); } else { x0 = Math.min(x0, o.minX); x1 = Math.max(x1, o.maxX); z0 = Math.min(z0, o.minZ); z1 = Math.max(z1, o.maxZ); }
    }
    return [x0, z0, x1, z1];
  }
  let hw, hd;
  if (TREE.has(it.k)) hw = hd = 1.0 * (it.s || 1);
  else if (ALONG_Z.has(it.k)) { hw = 0.45; hd = (it.len || 2) / 2; }
  else if (it.k === 'gdHopscotch') { hw = 0.45; hd = 1.2; }
  else if (it.k === 'gdFootpath') { hw = (it.len || 8) / 2; hd = (it.w || 0.9) / 2; }
  else if (it.w && it.d) { hw = it.w / 2; hd = it.d / 2; }
  else if (it.len) { hw = it.len / 2; hd = 0.3; }
  else hw = hd = it.k === 'lamp' ? 0.25 : 0.6;
  const c = Math.abs(Math.cos(it.ry || 0)), s = Math.abs(Math.sin(it.ry || 0));
  const ex = c * hw + s * hd, ez = s * hw + c * hd;
  return [it.x - ex, it.z - ez, it.x + ex, it.z + ez];
}
const rectGap = (a, b) => Math.max(a[0] - b[2], b[0] - a[2], a[1] - b[3], b[1] - a[3]);
const ptGap = (x, z, r) => Math.hypot(Math.max(r[0] - x, 0, x - r[2]), Math.max(r[1] - z, 0, z - r[3]));
const inLand = (r) => r[0] > 119.6 && r[2] < 268.6 && r[1] > 19.6 && r[3] < 137.0;

/**
 * Lay the town. `ITEMS` / `add` are regions/garden.js's own; `defs` = its merged ART / PROP (for footprints);
 * `doors` = its DOORS; `people` = its PEOPLE (where they work stays clear). Returns { added, skipped, moved } (for the tests).
 */
export function fillTown({ ITEMS, add, defs, doors, people = [] }) {
  const base = ITEMS.length, skipped = [];
  let moved = 0;
  const keepPts = [...KEEP, ...doors.map((d) => [d.x, d.z])];
  const fp = (o) => rectOf(o, defs[o.k]) || [o.x - 0.3, o.z - 0.3, o.x + 0.3, o.z + 0.3];
  /** clear? (wayGap: from road kerbs and lane edges; gap: from other things). Trees in the way of a house move out. */
  function clear(o, { way = 1.6, gap = 0.3, displace = false } = {}) {
    const me = fp(o);
    if (!inLand(me)) return 'edge';
    for (const c of CORE) if (rectGap(me, c) < 0.4) return 'core';
    for (const [x, z] of keepPts) if (ptGap(x, z, me) < 2.0) return 'spot';
    for (const p of people) if (ptGap(p.x, p.z, me) < 0.75) return 'person';
    if (wayGap(me) < way) return 'way';
    const trees = [];
    for (let i = 0; i < ITEMS.length; i++) {
      const it = ITEMS[i];
      if (it.town) continue; // (the town's own lane decals: wayGap keeps to them)
      const r = rectOf(it, defs[it.k]);
      if (!r || rectGap(me, r) >= gap) continue;
      if (displace && TREE.has(it.k)) { trees.push(i); continue; }
      return `${it.k}@${it.x.toFixed(1)},${it.z.toFixed(1)}`;
    }
    for (const i of trees.reverse()) ITEMS.splice(i, 1);
    moved += trees.length;
    return null;
  }
  /** put it at the first clear place on a small spiral round (x, z) (up to 3 m off) */
  const putNear = (o, opt) => {
    for (let k = 0; k < 25; k++) {
      const a = k * 2.4, rr = Math.sqrt(k) * 0.6, p = { ...o, x: o.x + Math.cos(a) * rr, z: o.z + Math.sin(a) * rr };
      if (!clear(p, opt)) { add(p); return true; }
    }
    skipped.push(`${o.k}@${o.x.toFixed(1)},${o.z.toFixed(1)} (near)`); return false;
  };
  const put = (o, opt) => { const why = clear(o, opt); if (why) { skipped.push(`${o.k}@${o.x.toFixed(1)},${o.z.toFixed(1)} (${why})`); return false; } add(o); return true; };

  // ---- the lanes themselves (flat earth paths, walk-through)
  for (const L of LANES) {
    const [ax, az] = L.a, [bx, bz] = L.b, len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(len / 12));
    const ry = -Math.atan2(bz - az, bx - ax);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      add({ k: 'gdFootpath', x: ax + (bx - ax) * t, z: az + (bz - az) * t, ry, len: len / n + 0.4, w: L.w, seed: 900 + i + L.id.length * 31, town: true });
    }
  }

  // ---- a lot: the house (front line along the street; `face` = the turn so its front looks at the street) and
  // its yard things, each placed in the house's own frame (lx across the front, lz out from the front line)
  let seedN = 700;
  const STYLES_NEAR = ['stilt', 'wood', 'brick', 'stilt', 'shop2', 'wood', 'brick', 'stilt'];
  const toW = (cx, cz, ry, lx, lz) => [cx + lx * Math.cos(ry) + lz * Math.sin(ry), cz - lx * Math.sin(ry) + lz * Math.cos(ry)];
  const SIGNS = [
    { my: 'ကုန်စုံဆိုင်', en: 'general store' }, { my: 'ဆန်ဆိုင်', en: 'rice shop' }, { my: 'အပ်ချုပ်ဆိုင်', en: 'tailor' },
    { my: 'မုန့်ဆိုင်', en: 'snacks' }, { my: 'ဆေးဆိုင်', en: 'medicines' }, { my: 'မျိုးစေ့ဆိုင်', en: 'seed shop' },
    { my: 'သံထည်ဆိုင်', en: 'hardware' }, { my: 'ပန်းဆိုင်', en: 'flowers' }, { my: 'ကွမ်းယာဆိုင်', en: 'betel' }, { my: 'ဒန်အိုးဆိုင်', en: 'pots and pans' },
  ];
  let signN = 0;
  const POSES = ['sweep', 'carry', 'head', 'stand', 'sweep', 'play'];
  function lot(fx, fz, ry, w, d, style, opts = {}) {
    // fx, fz: the middle of the house's front line (world); the house sits behind it
    const seed = seedN++, r = rng(seed * 7 + 3);
    const [cx, cz] = toW(fx, fz, ry, 0, -d / 2);
    const o = { k: 'gfHome', x: cx, z: cz, ry, w, d, seed, style };
    if (!put(o, { way: opts.way ?? 0.9, gap: 0.5, displace: true })) return null;
    // a trade name board, once it stands: on the lane's shophouses and a few more (each board is a draw call)
    if (style === 'shop2' && (opts.sign ?? true) && signN < 5) o.sign = SIGNS[signN++];
    const at = (lx, lz, extra) => { const [x, z] = toW(cx, cz, ry, lx, lz); return { x, z, ry, ...extra }; };
    const yard = (k, lx, lz, extra = {}, way = 0.5) => put({ k, ...at(lx, lz, extra) }, { way, gap: 0.15 });
    const far = style === 'far', W2 = w / 2, D2 = d / 2;
    const side = r() < 0.5 ? -1 : 1;
    // the yard: beside the house, and in front of it where the street allows
    if (!far && opts.fence !== false) {
      const fzL = D2 + (opts.yard ?? 2.2);
      if (opts.yard !== 0) put({ k: 'gfRail', ...at(0, fzL, { len: w + 1.6, gx: (r() - 0.5) * (w - 2.4), gw: 1.3, col: r() < 0.6 ? 'bamboo' : 'wood' }) }, { way: 0.4, gap: 0.1 });
    }
    const picks = [];
    picks.push(() => yard('gfBanana', side * (W2 + 1.0), -D2 * 0.4, { s: 0.9 + r() * 0.3, seed }));
    if (!far) {
      picks.push(() => yard('gfJars', -side * (W2 - 0.7), D2 + 0.6, { n: 2 + Math.floor(r() * 2), seed }));
      picks.push(() => yard('gdWash', side * (W2 + 1.6), D2 * 0.3, { len: 2.6, ry: ry + HP, seed }));
      picks.push(() => yard('gdBike', -side * (W2 + 0.9), D2 - 0.4, { ry: ry + HP + 0.2, col: pick([K.teal, K.red, K.blue, K.maroon], r) }));
      picks.push(() => yard('woodpile', side * (W2 + 0.9), -D2 + 0.8, {}));
      picks.push(() => yard('hens', -side * 1.0, D2 + 1.3, { seed }));
      picks.push(() => yard('gdPotRow', 0.3, D2 + 0.45, { len: Math.min(2.4, w * 0.5), seed }));
      picks.push(() => yard('gfFolk', -side * 1.2, D2 + 1.0, { ry: ry + (r() - 0.5) * 1.2, pose: pick(POSES, r), seed: seed * 3, kid: r() < 0.25 }));
    }
    // a tree or a shed behind
    if (r() < (opts.trees ?? 0.75)) yard(r() < 0.55 ? 'rain' : 'padauk', side * (0.4 + r() * 1.2), -d - 1.4 - r() * 0.8, { s: 0.8 + r() * 0.35 });
    picks.push(() => yard('gfShed', -side * (W2 - 0.9), -d - 0.9, { seed }));
    const n = far ? 1 + Math.floor(r() * 2) : 3 + Math.floor(r() * 3);
    for (let k = 0; k < picks.length && k < 20; k++) { /* shuffle a little */ const j = Math.floor(r() * picks.length); [picks[k], picks[j]] = [picks[j], picks[k]]; }
    for (let k = 0; k < Math.min(n, picks.length); k++) picks[k]();
    if (opts.extra) for (const [k, lx, lz, ex] of opts.extra) yard(k, lx, lz, ex || {});
    return o;
  }
  /**
   * A row of lots along a street: from `a` to `b` (world), houses on the side `n` (unit normal pointing from the
   * street to the houses), fronts `off` metres from the street's centre line. The first house that fits at each
   * place goes down; then on by its width and a gap.
   */
  function row(a, b, n, off, { styles = STYLES_NEAR, gapMin = 1.6, gapMax = 3.2, w = [4.2, 5.8], d = [3.8, 4.8], far = false, ...opts } = {}) {
    const [ax, az] = a, [bx, bz] = b, L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
    const ry = Math.atan2(-n[0], -n[1]); // the front (+Z local) faces back to the street: -n
    let t = 0, k = 0;
    const r = rng(Math.round(ax * 13 + az * 7 + bx));
    while (t < L - 3) {
      const W = w[0] + r() * (w[1] - w[0]), D = d[0] + r() * (d[1] - d[0]), st = far ? 'far' : styles[(k + Math.floor(r() * 3)) % styles.length];
      const tc = t + W / 2, sx = ax + ux * tc, sz = az + uz * tc;
      const fx = sx + n[0] * off, fz = sz + n[1] * off;
      if (tc + W / 2 > L) break;
      const ok = lot(fx, fz, ry, W, D, st, opts);
      if (ok) { t += W + gapMin + r() * (gapMax - gapMin); k++; } else t += 1.2;
    }
  }
  const along = (pts, fn) => { for (let i = 0; i < pts.length - 1; i++) fn(pts[i], pts[i + 1]); };

  // ---- 6. workshops, a trishaw rank, more tea stalls: the town at work (on the lanes, never on a story spot)
  for (const [k, x, z, ry, ex] of [
    ['gfWorkshop', 155.3, 61.2, PI, { trade: 'carpenter', seed: 21 }], ['gfWorkshop', 205.6, 52.4, 0, { trade: 'bikes', seed: 22 }],
    ['gfWorkshop', 236.4, 36.6, PI, { trade: 'potter', seed: 23 }], ['gfTeaStall', 182.4, 59.8, PI, { seed: 24 }],
    ['gfTeaStall', 228.4, 54.2, 0, { seed: 25 }], ['gfTeaStall', 168.0, 30.2, 0, { seed: 26 }],
    ['gfTrishaw', 196.4, 59.4, 0, { col: K.teal }], ['gfTrishaw', 135.6, 98.0, 0.3, { col: K.red }], ['gfTrishaw', 261.0, 61.0, -HP, { col: K.blue }],
    ['lamp', 179.9, 66.0, 0, {}], ['lamp', 179.9, 44.0, 0, {}], ['lamp', 197.0, 58.2, 0, {}], ['lamp', 232.0, 58.2, 0, {}], ['lamp', 160.0, 34.2, 0, {}],
    ['lamp', 220.0, 34.2, 0, {}], ['lamp', 263.4, 78.0, 0, {}], ['lamp', 212.0, 120.6, 0, {}], ['lamp', 142.0, 120.2, 0, {}],
  ]) putNear({ k, x, z, ry, ...ex }, { way: k === 'lamp' ? 0.1 : 0.4, gap: 0.2 });
  // people at work out on the lanes (still figures)
  for (const [x, z, ry, pose, kid] of [
    [176.4, 75.0, HP, 'sweep'], [181.2, 48.0, -HP, 'carry'], [200.0, 55.4, 0, 'head'], [224.0, 58.6, PI, 'sweep'], [246.0, 55.4, 0.4, 'carry'],
    [190.4, 34.6, PI, 'play', true], [191.6, 35.4, PI + 0.8, 'play', true], [155.0, 31.6, 0, 'head'], [262.8, 46.0, -HP, 'stand'], [214.6, 70.0, -HP, 'carry'],
    [150.4, 58.6, PI, 'stand'], [229.6, 55.0, PI, 'stand'], [183.4, 58.8, PI, 'stand'], [138.4, 76.0, HP, 'sweep'], [144.4, 66.0, -HP, 'head'],
  ]) putNear({ k: 'gfFolk', x, z, ry, pose, kid: !!kid, seed: Math.round(x * 3 + z) }, { way: 0.05, gap: 0.1 });

  // ---- 1. the lane's north side between the street gardens and the kiln square, and at its east end: shophouses
  // (two, either side of the back lane's mouth at x 177.6)
  lot(173.7, 96.9, 0, 4.0, 4.6, 'shop2', { yard: 0, fence: false, way: 0.75 });
  lot(181.3, 96.9, 0, 4.2, 4.6, 'shop2', { yard: 0, fence: false, way: 0.75 });
  row([256.6, 100], [263.0, 100], [0, -1], 3.1, { styles: ['shop2'], w: [4.0, 4.2], d: [4.0, 4.4], yard: 0, fence: false, way: 0.8 });
  // tea stalls and a workshop on the lane's north kerb by them (low cloth awnings; the camera sees under them)
  // ---- 2. the north road: both sides (the west strip has a second row behind)
  along([[140, 97], [140, 70], [142, 46], [140, 21]], (a, b) => {
    row(a, b, [-1, 0], 3.9, { yard: 0 });
    row(a, b, [1, 0], 3.9, { yard: 0 });
  });
  row([128.6, 98], [128.6, 21], [-1, 0], 0.0, { far: true, w: [4.0, 5.0], d: [3.6, 4.2], gapMin: 1.4, gapMax: 2.6 });
  // ---- 3. the back lanes: houses both sides, the far rows behind
  for (const L of LANES) {
    const [ax, az] = L.a, [bx, bz] = L.b, len = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / len, nz = (bx - ax) / len;
    const off = L.w / 2 + 2.0;
    row(L.a, L.b, [nx, nz], off, { yard: 1.4 });
    row(L.a, L.b, [-nx, -nz], off, { yard: 1.4 });
  }
  // the far rows in the deep back lots (between the lanes): simple houses, a tree or a shed
  for (const [z, fz, nz] of [[45.2, 45.2, -1], [68.0, 68.0, 1], [24.0, 24.0, -1]]) row([146, z], [262, z], [0, nz], 0, { far: true, w: [3.8, 5.0], d: [3.4, 4.2], gapMin: 2.4, gapMax: 5.0 });
  // ---- 3b. the south band: a row facing north behind the lane's cottages, its back to the diary's edge
  row([184, 127.8], [249, 127.8], [0, 1], 0, { w: [4.0, 5.2], d: [3.6, 4.4], gapMin: 1.4, gapMax: 3.0, yard: 1.2 });
  row([123, 127.8], [166, 127.8], [0, 1], 0, { w: [4.0, 5.2], d: [3.6, 4.4], gapMin: 1.4, gapMax: 3.0, yard: 1.2 });
  // ---- 4. the crease lane and the clasp road: both sides where the cottages leave room
  row([172, 102.5], [172, 136.5], [-1, 0], 3.4, { yard: 1.0 });
  row([172, 102.5], [172, 136.5], [1, 0], 3.4, { yard: 1.0 });
  row([258, 102.5], [258, 127], [-1, 0], 3.4, { yard: 1.0 });
  row([258, 102.5], [258, 127], [1, 0], 3.2, { yard: 0, w: [3.6, 4.4], d: [3.0, 3.6] });
  // ---- 5. south of the lane: set back from z 108 (behind the camera on the lane), the back rows by the diary's edge
  row([143, 100], [169, 100], [0, 1], 8.4, { yard: 0, fence: false });
  row([243, 100], [255.6, 100], [0, 1], 8.4, { yard: 0, fence: false });
  row([184, 137.4], [248, 137.4], [0, -1], 3.0, { far: true, w: [4.0, 5.2], d: [3.4, 4.0], gapMin: 1.6, gapMax: 3.4 });
  row([122, 137.4], [166, 137.4], [0, -1], 3.0, { far: true, w: [4.0, 5.2], d: [3.4, 4.0], gapMin: 1.6, gapMax: 3.4 });

  // ---- 7. the street edges: where no house front reaches, the low things of the yards come out to the verge
  // (jars, pots, a hen run, a bit of fence, a bed, a banana clump, a bike; trees set further back). South of the
  // lane only low things (the follow camera stands there).
  function dress(a, b, n, offs, { low = false, step = 3.2, seed = 1, trees = true } = {}) {
    const [ax, az] = a, [bx, bz] = b, L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
    const ry = Math.atan2(-n[0], -n[1]), r = rng(Math.round(seed * 17));
    const LOW = ['gdPotRow', 'gfJars', 'gfRail', 'gdPotRow', 'gfJars', 'gfBed'];
    const ALL = [...LOW, 'gfBanana', 'gfBanana', 'gdBike', 'woodpile', 'gfFolk'];
    for (let t = 1 + r() * 2; t < L - 1; t += step * (0.75 + r() * 0.5)) {
      const k = pick(low ? LOW : ALL, r), off = offs[0] + r() * (offs[1] - offs[0]);
      const x = ax + ux * t + n[0] * off, z = az + uz * t + n[1] * off;
      const ex = k === 'gdPotRow' ? { len: 1.6 + r() * 1.2, seed: seedN++ } : k === 'gfRail' ? { len: 2.6 + r() * 2, col: r() < 0.6 ? 'bamboo' : 'wood' }
        : k === 'gfBed' ? { w: 2.4 + r() * 0.8, d: 1.0, crop: pick(['cabbage', 'onion', 'chilli', 'tomato', 'marigold', 'herb', 'flower'], r), seed: seedN++ }
          : k === 'gfFolk' ? { pose: pick(['sweep', 'stand', 'carry', 'head'], r), seed: seedN++ }
            : k === 'gdBike' ? { col: pick([K.teal, K.red, K.blue, K.maroon], r) } : { seed: seedN++, n: 2 + Math.floor(r() * 2), s: 0.9 + r() * 0.3 };
      put({ k, x, z, ry: k === 'gdBike' ? ry + HP : ry, ...ex }, { way: 0.5, gap: 0.25 });
      if (trees && !low && r() < 0.45) put({ k: r() < 0.5 ? 'rain' : 'padauk', x: x + n[0] * (2.6 + r()), z: z + n[1] * (2.6 + r()), s: 0.8 + r() * 0.3 }, { way: 1.0, gap: 0.2 });
    }
  }
  along([[140, 97], [140, 70], [142, 46], [140, 21]], (a, b) => { dress(a, b, [-1, 0], [2.6, 3.6], { seed: 31 + a[1] }); dress(a, b, [1, 0], [2.6, 3.6], { seed: 37 + a[1] }); });
  dress([172, 102.5], [172, 136.5], [-1, 0], [2.4, 3.0], { seed: 41, trees: false, step: 4.6 });
  dress([172, 102.5], [172, 136.5], [1, 0], [2.4, 3.0], { seed: 43, trees: false, step: 4.6 });
  dress([258, 102.5], [258, 127], [-1, 0], [2.6, 3.4], { seed: 47 });
  dress([258, 102.5], [258, 127], [1, 0], [2.4, 3.0], { seed: 53 });
  dress([142, 100], [183, 100], [0, 1], [4.8, 6.8], { low: true, seed: 59 });
  dress([244, 100], [256, 100], [0, 1], [4.8, 6.8], { low: true, seed: 61 });
  for (const L of LANES) {
    const [ax, az] = L.a, [bx, bz] = L.b, len = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / len, nz = (bx - ax) / len;
    dress(L.a, L.b, [nx, nz], [L.w / 2 + 0.6, L.w / 2 + 1.4], { seed: 70 + L.id.length + ax, step: 4.0 });
    dress(L.a, L.b, [-nx, -nz], [L.w / 2 + 0.6, L.w / 2 + 1.4], { seed: 80 + L.id.length + az, step: 4.0 });
  }

  // ---- 8. the leftover back lots: wherever a patch of the page is still bare (nothing within a few metres, away
  // from the roads and the story places), a kitchen garden, a tree, a tool shed, a banana clump or a small house
  {
    const r = rng(4711);
    for (let z = 22; z < 136; z += 4.6) for (let x = 122; x < 267; x += 4.6) {
      const px = x + (r() - 0.5) * 2.0, pz = z + (r() - 0.5) * 2.0;
      if (pz > 100.5 && pz < 108.5) continue; // (south of the lane only low things at the kerb: garden-life's)
      const probe = { k: 'gfShed', x: px, z: pz, w: 4.4, d: 4.4 }; // (a 4.4 m square must be empty)
      const pr = [px - 2.2, pz - 2.2, px + 2.2, pz + 2.2];
      if (!inLand(pr) || CORE.some((c) => rectGap(pr, c) < 1) || wayGap(pr) < 1.0) continue;
      let busy = false;
      for (const it of ITEMS) { if (it.town && it.k === 'gdFootpath') continue; const q = rectOf(it, defs[it.k]); if (q && rectGap(pr, q) < 0.3) { busy = true; break; } }
      if (busy) continue;
      void probe;
      const u = r(), ry = Math.floor(r() * 4) * HP;
      if (u < 0.36) put({ k: r() < 0.55 ? 'rain' : 'padauk', x: px, z: pz, s: 0.85 + r() * 0.35 }, { way: 1.0, gap: 0.3 });
      else if (u < 0.6) put({ k: 'gfBed', x: px, z: pz, ry, w: 2.6 + r() * 0.8, d: 1.1, crop: pick(['cabbage', 'onion', 'chilli', 'tomato', 'marigold', 'herb', 'flower'], r), seed: seedN++ }, { way: 1.0, gap: 0.3 });
      else if (u < 0.72) put({ k: 'gfShed', x: px, z: pz, ry, seed: seedN++ }, { way: 1.0, gap: 0.3 });
      else if (u < 0.82) put({ k: 'gfBanana', x: px, z: pz, s: 0.9 + r() * 0.3, seed: seedN++ }, { way: 1.0, gap: 0.3 });
      else put({ k: 'gfHome', x: px, z: pz, ry, w: 3.6 + r() * 0.8, d: 3.2 + r() * 0.6, style: 'far', seed: seedN++ }, { way: 1.2, gap: 0.5, displace: true });
    }
  }

  return { added: ITEMS.length - base, skipped, moved };
}
