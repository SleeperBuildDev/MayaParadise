// Ledger Wharf at walking height: the yard and work kinds the close, low camera sees most (District 3). The
// camera looks north, so the yards SOUTH of each street fill the lower half of the screen: they get packed
// earth, plank paths, drying mats, traps, basins, shrubs, low tea corners and people at work, all low enough
// never to hide Maya. Registered through regions/wharf.js (PROP; format at the top of regions/index.js).
// Item-local: origin = the item's (x, z), front = +Z, metres. Merged boxes only (kit.js Geo): no draw calls.
// Original art only. No markers, nothing that points the way. Every Burmese string is a draft for Maya.
//
//   wYard { w, d, seed, path }     packed earth over the ledger paper, tufts at its edge, a plank path
//   wDryMat { kind, seed }         a woven mat drying chillies | fish | prawns | rice | cane-shoots
//   wCrabPots { seed, n }          bamboo traps stacked by a wall
//   wBasin { seed }                a tin basin, a bucket, a scrubbing stone (washing corner)
//   wShrub { seed, s, bloom }      a low bush (bougainvillea pink, jasmine white, or plain green)
//   wTeaCorner { seed }            a low table, tiny stools, a kettle and glasses (people sit here)
//   wWorker { pose, seed, top, bottom, woman, hat, load }  a townsperson at work, still. Poses:
//       stand | carry (sack on the shoulder) | yoke (shoulder pole, two baskets) | mend (on a mat, net on the lap) |
//       fish (on a jetty edge, line in the water) | sweep | squat (washing / sorting) | sit (stool, tea) |
//       hang (pegging washing, arms up) | plane (boatwright, planing a plank on trestles) | kid | coil (rope)
//   wAFrame { lines }              a chalk price board on the footpath (a shop's own word, never directions)
//   wPlankWalk { len }             a raised plank walk across a muddy yard (low; walkable over)
//   wPuddle { w, d }               a pale wet patch (decal)
//   wDeckLitter { w, d, kind, seed } straw, rice spill, fish scales, a wet trail, chalk tally, rope end (decal)
import { shade, rng } from '../kit.js';

const C = {
  wood: '#B98A5A', woodD: '#7E5A38', woodL: '#CDA577', woodG: '#A89A86', woodGD: '#8C7E6A', woodGL: '#C4B9A6',
  tar: '#3F3328', teal: '#4E8C86', ochre: '#D8B66A', rust: '#9C5B3C', zinc: '#A7A9A2', zincD: '#878A84', zincL: '#C2C4BD',
  jute: '#C8A878', juteD: '#A88C5E', ledger: '#F4EEDC', iron: '#4A3B30', dark: '#3A2E25',
  red: '#C8323C', redD: '#9C2832', cream: '#F7EEDC', white: '#FFFDF8', leaf: '#5E8F4E', leafD: '#3F6B3A', leafL: '#8DBA6E',
  terra: '#B5643C', mustard: '#E2B33C', blue: '#2F5DB3', fish: '#C9CED1', fishD: '#9EA6AA', bamboo: '#C8B36E', bambooD: '#A8925A',
  bambooL: '#DCCB8E', shadow: '#E2D7BA', ink: '#2A2118', slate: '#3E4A3F', rose: '#E8A0A8', pink: '#D9558A', prawn: '#E59A7A',
  earth: '#E3D2AE', earthL: '#EBDDBE', earthD: '#D6C29A', mud: '#CDB78E', wet: '#D7DFE2', rice: '#F7F3E8', hat: '#E8D2A0',
};
const SKIN = ['#F3CBAA', '#E8B48E', '#D9A077', '#C68A63', '#B47A55'];
const HAIR = ['#1F1B1B', '#1F1B1B', '#2E2420', '#3E2A20', '#B9B3A8'];
const TOPS = ['#F4EFE4', '#E9DFC9', '#7FB0CF', '#4E8C86', '#D97C8A', '#D9A93B', '#8E8A84', '#E0795A', '#5E8F4E', '#C9B8A0', '#3E5F7A'];
const BOTS = ['#2E3D63', '#7A5434', '#6B3E64', '#2F7C7A', '#7A2533', '#3A3634', '#5A5A3A', '#8E4A2C', '#3E5F7A'];
const pick = (r, a) => a[Math.floor(r() * a.length)];
/** A small upright quad facing item-local +Z (the street camera's side): w x h centred on (x, y, z). Two
 * triangles where a box would be ten (for slivers too thin to show a side). */
function front(f, x, y, z, w, h, col) {
  const P = (lx, ly) => [f.tx + lx * f.tc + z * f.ts, f.ty + ly, f.tz - lx * f.ts + z * f.tc];
  f.quad(P(x - w / 2, y - h / 2), P(x + w / 2, y - h / 2), P(x + w / 2, y + h / 2), P(x - w / 2, y + h / 2), col, f.ts, 0, f.tc);
}

// ---------------------------------------------------------------------------------
// ground
// ---------------------------------------------------------------------------------
/** Packed earth: a few overlapping pale patches (the ruled paper still shows round them), tufts round the edge,
 * a path of planks or flat stones from the front edge in. */
function wYard(g, f, it) {
  const r = rng(it.seed || 1), W = it.w || 4, D = it.d || 3;
  f.flatR(0, 0, W, D, 0.004, C.earthL, (r() - 0.5) * 0.12);
  f.flatR((r() - 0.5) * W * 0.3, (r() - 0.5) * D * 0.3, W * (0.55 + r() * 0.25), D * (0.55 + r() * 0.25), 0.006, C.earth, (r() - 0.5) * 0.3);
  f.flatR((r() - 0.5) * W * 0.4, (r() - 0.5) * D * 0.4, W * 0.3, D * 0.3, 0.008, C.earthD, r() * 0.5);
  // the path in: stones (round the house) or planks (over the wet)
  if (it.path !== false) {
    const planks = it.path === 'planks' || r() < 0.4, px = (r() - 0.5) * W * 0.4;
    for (let z = D / 2 - 0.25; z > -D / 2 + 0.3; z -= planks ? 0.5 : 0.62) {
      if (planks) f.flatR(px + (r() - 0.5) * 0.06, z, 0.75, 0.36, 0.012, shade(C.woodGL, 0.9 + r() * 0.12), (r() - 0.5) * 0.08);
      else f.flatR(px + (r() - 0.5) * 0.2, z, 0.38 + r() * 0.12, 0.3 + r() * 0.1, 0.012, shade(C.zincL, 0.95 + r() * 0.08), r());
    }
  }
  // tufts and pebbles round the edge
  const n = Math.round((W + D) * 0.75);
  for (let k = 0; k < n; k++) {
    const side = k % 4, t = r() - 0.5;
    const x = side < 2 ? t * W : (side === 2 ? -1 : 1) * W / 2 * (0.85 + r() * 0.2);
    const z = side < 2 ? (side === 0 ? -1 : 1) * D / 2 * (0.85 + r() * 0.2) : t * D;
    if (r() < 0.65) { const h = 0.12 + r() * 0.16; g.box(x, h / 2, z, 0.16 + r() * 0.12, h, 0.14 + r() * 0.1, r() < 0.5 ? C.leaf : C.leafL); }
    else f.flatR(x, z, 0.1, 0.08, 0.045, C.zincL, 0); // a pebble (a flat chip: 2 triangles, not a 10-triangle box)
  }
}

/** A raised plank walk on low tar-black stubs (len along X): yards near the river are wet. */
function wPlankWalk(g, f, it) {
  const L = it.len || 4, r = rng(it.seed || 3);
  f.flatR(0, 0, L + 0.3, 1.0, 0.004, C.mud, 0);
  for (let x = -L / 2 + 0.4; x < L / 2; x += 1.2) for (const z of [-0.3, 0.3]) g.box(x, 0.06, z, 0.1, 0.12, 0.1, C.tar);
  for (let k = 0; k < 3; k++) g.box((r() - 0.5) * 0.08, 0.15, -0.26 + k * 0.26, L, 0.05, 0.24, shade(C.woodG, 0.9 + r() * 0.15));
}

/** A pale wet patch where washing water is thrown out. */
function wPuddle(g, f, it) {
  const W = it.w || 1.4, D = it.d || 0.9;
  f.flatR(0, 0, W, D, 0.005, C.mud, 0.2);
  f.flatR(0.05, -0.02, W * 0.75, D * 0.7, 0.007, C.wet, 0.35);
}

/** Work litter on a quay deck (decal only: walkable, no outline, cheap): straw wisps from the sacks, a spill
 * of rice, silver fish scales by the baskets, a wet trail where a bucket was carried, a porter's chalk tally
 * on a plank, a frayed rope end. w x d metres, `kind` = straw | rice | scales | wet | chalk | rope | mix. */
function wDeckLitter(g, f, it) {
  const r = rng(it.seed || 5), W = it.w || 2.4, D = it.d || 1.6, kind = it.kind || 'mix';
  const has = (k) => kind === k || kind === 'mix';
  if (has('straw')) for (let k = 0; k < 9; k++) f.flatR((r() - 0.5) * W, (r() - 0.5) * D, 0.45 + r() * 0.35, 0.06, 0.0062, r() < 0.5 ? C.bambooL : C.bamboo, r() * 3.1);
  if (has('rice')) { const x = (r() - 0.5) * W * 0.6, z = (r() - 0.5) * D * 0.6; f.flatR(x, z, 0.55, 0.32, 0.0064, C.rice, r()); f.flatR(x + 0.2, z + 0.1, 0.3, 0.18, 0.0066, C.cream, r()); }
  if (has('scales')) for (let k = 0; k < 10; k++) f.flatR((r() - 0.5) * W, (r() - 0.5) * D, 0.1, 0.08, 0.0068, r() < 0.5 ? C.fish : C.white, r());
  if (has('wet')) for (let k = 0; k < 4; k++) f.flatR(-W / 2 + (k + 0.5) * W / 4, (r() - 0.5) * 0.3, 0.32, 0.22, 0.006, C.wet, r() * 0.4);
  if (has('chalk')) { const x = (r() - 0.5) * W * 0.5, z = (r() - 0.5) * D * 0.5; for (let k = 0; k < 4; k++) f.flatR(x + k * 0.07, z, 0.025, 0.2, 0.007, C.white, 0); f.flatR(x + 0.1, z, 0.34, 0.025, 0.0072, C.white, -0.5); }
  if (has('rope')) { const x = (r() - 0.5) * W * 0.5, z = (r() - 0.5) * D * 0.5, a = r() * 3; f.flatR(x, z, 0.9, 0.05, 0.0066, C.juteD, a); f.flatR(x + Math.cos(a) * 0.5, z - Math.sin(a) * 0.5, 0.14, 0.12, 0.0068, C.jute, a); }
}

// ---------------------------------------------------------------------------------
// yard things
// ---------------------------------------------------------------------------------
/** A woven mat with something drying on it. */
function wDryMat(g, f, it) {
  const r = rng(it.seed || 2), kind = it.kind || pick(r, ['chili', 'fish', 'prawn', 'rice', 'chili', 'fish']);
  const W = 1.8, D = 1.2;
  g.box(0, 0.02, 0, W, 0.04, D, C.bambooL);
  for (let k = 0; k < 6; k++) f.flatR(-W / 2 + 0.15 + k * 0.3, 0, 0.03, D - 0.06, 0.05, C.bambooD, 0); // the weave's ribs (flat)
  g.box(0, 0.03, -D / 2 + 0.02, W + 0.04, 0.06, 0.05, C.bambooD);
  g.box(0, 0.03, D / 2 - 0.02, W + 0.04, 0.06, 0.05, C.bambooD);
  if (kind === 'rice') { f.flatR(0, 0, W - 0.3, D - 0.3, 0.05, C.rice, 0); g.box(0.6, 0.08, 0.3, 0.3, 0.06, 0.12, C.woodL); return; } // the rake
  const col = kind === 'chili' ? [C.red, C.redD] : kind === 'prawn' ? [C.prawn, '#D9876A'] : [C.fish, C.fishD];
  const n = kind === 'fish' ? 14 : 30;
  for (let k = 0; k < n; k++) {
    const x = (r() - 0.5) * (W - 0.3), z = (r() - 0.5) * (D - 0.3);
    if (kind === 'fish') f.flatR(x, z, 0.32, 0.1, 0.06, col[k % 2], r() * 0.6 - 0.3);
    else f.flatR(x, z, 0.09, kind === 'chili' ? 0.05 : 0.08, 0.065, col[k % 2], r()); // (flat: 2 triangles each)
  }
}

/** Bamboo crab traps: cages stacked two high by a wall, one open. */
function wCrabPots(g, f, it) {
  const r = rng(it.seed || 4), n = it.n || 5;
  f.flatR(0, 0, 1.8, 1.0, 0.004, C.shadow, 0);
  for (let k = 0; k < n; k++) {
    const x = -0.55 + (k % 3) * 0.55, y = k < 3 ? 0.17 : 0.5, z = (k % 2) * 0.08;
    g.box(x, y, z, 0.48, 0.32, 0.6, k % 2 ? C.bamboo : C.bambooD);
    for (const sx of [-0.16, 0, 0.16]) front(f, x + sx, y, z + 0.306, 0.02, 0.3, C.bambooD); // the cage bars (flat, facing the street)
    g.box(x, y + 0.17, z, 0.52, 0.03, 0.64, C.tar);
  }
  if (r() < 0.6) g.box(0.95, 0.18, 0.1, 0.12, 0.36, 0.12, C.terra); // a float
}

/** A washing corner: tin basin on a stand, a bucket, a flat scrubbing stone, a bar of soap. */
function wBasin(g, f, it) {
  const r = rng(it.seed || 5);
  f.flatR(0, 0, 1.5, 1.1, 0.005, C.mud, 0.1);
  f.flatR(0.1, 0.05, 1.0, 0.7, 0.007, C.wet, 0.2);
  g.box(-0.3, 0.12, 0, 0.7, 0.24, 0.5, C.zinc);
  g.box(-0.3, 0.245, 0, 0.6, 0.01, 0.4, '#C7D3D8');
  g.box(0.35, 0.18, -0.2, 0.3, 0.36, 0.3, r() < 0.5 ? C.teal : C.red);
  g.box(0.35, 0.37, -0.2, 0.32, 0.02, 0.32, C.zincD);
  g.box(0.3, 0.05, 0.3, 0.5, 0.1, 0.36, C.zincL);
  f.box(0.3, 0.105, 0.3, 0.12, 0.04, 0.08, C.mustard);
}

/** A low bush: bougainvillea (pink), jasmine (white dots) or plain. */
function wShrub(g, f, it) {
  const r = rng(it.seed || 6), s = it.s || 1, bloom = it.bloom ?? pick(r, ['pink', 'white', null, 'pink']);
  f.flatR(0, 0, 1.3 * s, 1.1 * s, 0.004, C.shadow, 0);
  for (let k = 0; k < 4; k++) {
    const x = (r() - 0.5) * 0.7 * s, z = (r() - 0.5) * 0.5 * s, w = (0.5 + r() * 0.3) * s, h = (0.4 + r() * 0.35) * s;
    g.box(x, h / 2, z, w, h, w * 0.9, k % 2 ? C.leaf : C.leafD);
    if (bloom) for (let b = 0; b < 3; b++) f.flatR(x + (r() - 0.5) * w, z + (r() - 0.5) * w * 0.8, 0.12, 0.12, h + 0.035, bloom === 'pink' ? C.pink : C.white, 0); // (flat: seen from above)
  }
}

/** A low tea corner under the eaves: a low table, tiny stools, a kettle and glasses. */
function wTeaCorner(g, f, it) {
  const r = rng(it.seed || 7);
  f.flatR(0, 0, 2.0, 1.6, 0.004, C.shadow, 0);
  g.box(0, 0.32, 0, 0.9, 0.05, 0.6, C.woodL);
  for (const sx of [-0.38, 0.38]) for (const sz of [-0.24, 0.24]) g.box(sx, 0.15, sz, 0.05, 0.3, 0.05, C.woodD);
  g.box(-0.15, 0.42, 0, 0.18, 0.16, 0.16, C.white); // the kettle
  g.box(-0.02, 0.45, 0, 0.1, 0.04, 0.04, C.white);
  for (let k = 0; k < 3; k++) g.box(0.12 + k * 0.1, 0.39, (k % 2 ? 0.1 : -0.12), 0.06, 0.09, 0.06, '#E9C9A0');
  for (const [x, z] of [[-0.75, 0.1], [0.75, -0.05], [0.1, 0.62]]) { const c = pick(r, [C.red, C.blue, C.leaf]); g.box(x, 0.2, z, 0.3, 0.04, 0.3, c); g.box(x, 0.09, z, 0.22, 0.18, 0.22, shade(c, 0.8)); }
}

/** A chalk A-frame price board: it.lines [{ my, en }] (a shop's own words, never directions). */
function wAFrame(g, f, it, ctx) {
  f.flatR(0, 0, 0.9, 0.7, 0.004, C.shadow, 0);
  g.boxR(0, 0.5, 0.14, 0.7, 0.95, 0.04, C.woodD, -0.25, 0, 0);
  g.boxR(0, 0.5, -0.14, 0.7, 0.95, 0.04, C.woodD, 0.25, 0, 0);
  g.boxR(0, 0.52, 0.17, 0.6, 0.8, 0.02, C.slate, -0.25, 0, 0);
  const L = it.lines || [];
  if (L.length) ctx.signs.push({ x: 0, y: 0.52, z: 0.2, w: 0.58, h: 0.76, lines: L.flatMap((l) => [{ text: l.my, size: 40, color: '#F4EEDC' }, ...(l.en ? [{ text: l.en, size: 20, font: 'serif', weight: 600, color: '#D8D0BE' }] : [])]), bg: '#3E4A3F', border: null, width: 300, height: 380 });
}

// ---------------------------------------------------------------------------------
// people at work (still; merged into the chunk: they cost no draw call)
// ---------------------------------------------------------------------------------
function wWorker(g, f, it) {
  const r = rng(it.seed || 11), pose = it.pose || 'stand';
  const kid = pose === 'kid', s = kid ? 0.72 : 1;
  const skin = pick(r, SKIN), hair = pick(r, HAIR), top = it.top || pick(r, TOPS), bot = it.bottom || pick(r, BOTS);
  const woman = it.woman ?? r() < 0.5;
  const sitStool = pose === 'sit', onMat = pose === 'mend', edge = pose === 'fish', squat = pose === 'squat';
  f.flatR(0, 0, 0.62 * s, 0.5 * s, 0.006, '#D9CBAE', 0);
  let hipY;
  if (sitStool) {
    const sc = pick(r, [C.red, C.blue, C.leaf]);
    g.box(0, 0.24, 0, 0.3, 0.05, 0.3, sc); g.box(0, 0.11, 0, 0.22, 0.22, 0.22, shade(sc, 0.8));
    hipY = 0.42;
    g.box(0, hipY, 0.08, 0.36, 0.16, 0.42, bot); g.box(0, 0.2, 0.26, 0.34, 0.36, 0.12, bot); g.box(0, 0.03, 0.32, 0.32, 0.06, 0.16, C.dark);
  } else if (onMat) {
    g.box(0, 0.015, 0.1, 1.0, 0.03, 0.9, C.bambooL);
    hipY = 0.14;
    g.box(0, 0.1, 0.18, 0.62, 0.16, 0.42, bot); // crossed legs under the longyi
  } else if (edge) {
    hipY = 0.1; // sitting on the deck edge, shins hanging over (+Z is the water)
    g.box(0, 0.08, 0.05, 0.36, 0.16, 0.4, bot);
    g.box(0, -0.18, 0.28, 0.32, 0.4, 0.12, bot); g.box(0, -0.4, 0.3, 0.3, 0.06, 0.16, skin);
  } else if (squat) {
    hipY = 0.32; g.box(0, 0.2, 0.04, 0.4, 0.34, 0.36, bot); g.box(0, 0.03, 0.14, 0.34, 0.06, 0.2, C.dark);
  } else {
    hipY = 0.78 * s;
    g.box(0, hipY / 2 + 0.03, 0, 0.34 * s, hipY - 0.03, 0.24 * s, bot);
    if (!woman && !kid) g.box(0, hipY - 0.06, 0.125, 0.1, 0.1, 0.02, shade(bot, 0.75));
    g.box(-0.08 * s, 0.03, 0.03, 0.12 * s, 0.06, 0.24 * s, C.dark); g.box(0.08 * s, 0.03, 0.03, 0.12 * s, 0.06, 0.24 * s, C.dark);
  }
  const tw = 0.4 * s, th = kid ? 0.42 : 0.5, ty = hipY + th / 2;
  const lean = pose === 'sweep' ? 0.25 : squat || pose === 'plane' ? 0.3 : onMat ? 0.2 : pose === 'yoke' ? 0.08 : 0;
  g.boxR(0, ty, lean * 0.3, tw, th, 0.26 * s, top, lean, 0, 0);
  const ay = ty + th / 2 - 0.05, ax = tw / 2 + 0.06;
  const arm = (sx, rx, rz = 0) => g.boxR(sx * ax, ay - 0.2 * s, 0.04 + Math.sin(rx) * 0.2, 0.11 * s, 0.42 * s, 0.11 * s, top, rx, 0, rz);
  const top2 = ty + th / 2;
  switch (pose) {
    case 'carry': arm(-1, 0); arm(1, -2.6);
      g.box(0.18, top2 + 0.16, -0.02, 0.52, 0.32, 0.38, it.load || C.jute); g.box(0.18, top2 + 0.33, -0.02, 0.2, 0.05, 0.2, C.juteD); break;
    case 'yoke': arm(-1, -2.2); arm(1, -0.4);
      g.boxR(0, top2 + 0.04, 0, 1.9, 0.05, 0.06, C.bambooD, 0, 0, 0.04); // the pole across the shoulder (along X)
      for (const sx of [-0.88, 0.88]) {
        for (const dz of [-0.12, 0.12]) g.box(sx, top2 - 0.32, dz, 0.015, 0.7, 0.015, C.jute);
        g.box(sx, top2 - 0.75, 0, 0.5, 0.26, 0.5, C.bambooD); g.box(sx, top2 - 0.6, 0, 0.42, 0.06, 0.42, it.load || C.fish);
      }
      break;
    case 'mend': arm(-1, -1.1); arm(1, -1.0);
      for (let k = 0; k < 5; k++) f.flatR(-0.1 + (k % 3) * 0.12, 0.55 + k * 0.08, 1.1 - k * 0.1, 0.12, 0.2 + k * 0.006, k % 2 ? '#7E8C7A' : '#94A28E', 0.1 * k);
      g.box(0.4, 0.06, 0.6, 0.3, 0.12, 0.3, C.bambooD); break; // the shuttle basket
    case 'fish': arm(-1, -1.0); arm(1, -1.3);
      g.boxR(0.12, top2 + 0.2, 0.9, 0.03, 0.03, 1.9, C.bambooD, -0.45, 0, 0); // the rod out over the water
      g.box(0.12, top2 - 0.2, 1.75, 0.01, 1.2, 0.01, C.white); // the line
      g.box(-0.45, 0.08, -0.1, 0.32, 0.16, 0.32, C.bambooD); break; // the creel beside her
    case 'sweep': arm(-1, -0.9); arm(1, -0.7);
      g.boxR(0.05, 0.62, 0.42, 0.04, 1.2, 0.04, C.woodL, 0.55, 0, 0.1); g.boxR(0, 0.08, 0.78, 0.4, 0.16, 0.08, C.bambooD, 0.4, 0, 0); break;
    case 'squat': arm(-1, -1.3); arm(1, -1.1);
      if (it.load !== false) { g.box(0, 0.08, 0.5, 0.6, 0.14, 0.42, C.zinc); f.flatR(0, 0.5, 0.5, 0.32, 0.155, it.load || '#C7D3D8', 0); } break;
    case 'sit': arm(-1, -0.6); arm(1, -1.2); g.box(0.2, ay - 0.06, 0.28, 0.07, 0.1, 0.07, '#E9C9A0'); break;
    case 'hang': arm(-1, -2.9); arm(1, -2.8); break;
    case 'plane': arm(-1, -1.2); arm(1, -1.2);
      for (const sx of [-0.7, 0.7]) g.box(sx, 0.3, 0.6, 0.12, 0.6, 0.36, C.woodD);
      g.box(0, 0.64, 0.6, 1.9, 0.07, 0.3, C.woodL); g.box(0.1, 0.71, 0.6, 0.26, 0.08, 0.12, C.woodD);
      for (let k = 0; k < 6; k++) f.box(-0.5 + r(), 0.02, 0.4 + r() * 0.6, 0.1, 0.02, 0.05, C.woodL); break;
    case 'coil': arm(-1, -0.9); arm(1, -0.9);
      g.box(0, ay - 0.22, 0.36, 0.3, 0.06, 0.3, C.jute);
      for (let k = 0; k < 3; k++) g.box(0, 0.05 + k * 0.08, 0.7, 0.62 - k * 0.1, 0.07, 0.62 - k * 0.1, k % 2 ? C.jute : C.juteD); break;
    default: arm(-1, 0); arm(1, kid ? -0.5 : 0);
  }
  const hy = top2 + 0.17 * s - (squat ? 0.02 : 0), hs = 0.34 * s, hz = lean * 0.18;
  g.box(0, hy - 0.06, hz, 0.12, 0.08, 0.12, skin);
  g.box(0, hy + 0.08, hz, hs, hs, hs, skin);
  g.box(0, hy + 0.08 + hs / 2 - 0.04, hz - 0.03, hs + 0.04, 0.12, hs - 0.02, hair);
  g.box(0, hy + 0.08, hz - hs / 2 + 0.03, hs + 0.04, hs - 0.02, 0.08, hair);
  if (woman && !kid) {
    if (r() < 0.6) g.box(0, hy + 0.2, hz - hs / 2 - 0.04, 0.16, 0.16, 0.14, hair);
    if (r() < 0.6) for (const sx of [-1, 1]) front(f, sx * 0.1 * s, hy + 0.05, hz + hs / 2 + 0.01, 0.08, 0.07, '#F1DDA8'); // (flat quads on the face)
  }
  front(f, -0.065 * s, hy + 0.1, hz + hs / 2 + 0.011, 0.035, 0.05, C.ink);
  front(f, 0.065 * s, hy + 0.1, hz + hs / 2 + 0.011, 0.035, 0.05, C.ink);
  const hat = it.hat ?? (['carry', 'yoke', 'fish', 'plane'].includes(pose) && r() < 0.55 ? 'sun' : pose === 'carry' ? 'towel' : null);
  if (hat === 'sun') { g.box(0, hy + 0.3, hz, 0.66, 0.05, 0.66, C.hat); g.box(0, hy + 0.37, hz, 0.36, 0.08, 0.36, C.hat); g.box(0, hy + 0.43, hz, 0.14, 0.06, 0.14, C.hat); }
  else if (hat === 'towel') g.box(0, hy + 0.27, hz, hs + 0.08, 0.08, hs + 0.06, pick(r, [C.white, C.rose, '#E9DFC9']));
}

const box = (w, d, ox = 0, oz = 0) => (it) => {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const cx = it.x + ox * c + oz * s, cz = it.z - ox * s + oz * c;
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return [{ type: 'box', minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd }];
};
const none = () => [];
const person = (it) => (it.pose === 'fish' ? [] : [{ type: 'circle', x: it.x, z: it.z, r: it.pose === 'yoke' ? 0.55 : it.pose === 'plane' || it.pose === 'mend' ? 0.6 : 0.3 }]);

export const WHARF_YARD_PROP = {
  wYard: { draw: wYard, obstacles: none },
  wPlankWalk: { draw: wPlankWalk, obstacles: none },
  wPuddle: { draw: wPuddle, obstacles: none },
  wDeckLitter: { draw: wDeckLitter, obstacles: none },
  wDryMat: { draw: wDryMat, obstacles: (it) => box(1.8, 1.2)(it) },
  wCrabPots: { draw: wCrabPots, obstacles: (it) => box(1.7, 0.75)(it) },
  wBasin: { draw: wBasin, obstacles: (it) => box(1.2, 0.7)(it) },
  wShrub: { draw: wShrub, r: 0.5 },
  wTeaCorner: { draw: wTeaCorner, obstacles: (it) => box(1.9, 1.4)(it) },
  wAFrame: { draw: wAFrame, r: 0.4 },
  wWorker: { draw: wWorker, obstacles: person },
};

// ---------------------------------------------------------------------------------
// Placement: a yard band filled densely, never on a road, never on another item
// ---------------------------------------------------------------------------------
const RAD = { wGodown: 5, wShop: 4, wStilt: 4, weighHouse: 4.5, sandaHouse: 3, teaHut: 2.4, lamp: 0.5, bambooFence: 0.6, wPaperWall: 0.6, fence: 0.6 };
/** Rough footprint of an existing item as a box [x0, z0, x1, z1] (fences and walls by their length and turn). */
function foot(it) {
  if (it.k === 'cloudWater' || it.k === 'mistBank' || it.k === 'wMapMark' || it.k === 'entries' || it.k === 'wYard' || it.k === 'wPuddle' || it.k === 'wDeckLitter' || it.k === 'quayDeck') return null;
  const turned = Math.abs(Math.sin(it.ry || 0)) > 0.7;
  let w = it.w ?? it.len ?? (RAD[it.k] ?? 0.8) * 2, d = it.d ?? (it.len ? 0.5 : (RAD[it.k] ?? 0.8) * 2);
  if (turned) [w, d] = [d, w];
  return [it.x - w / 2, it.z - d / 2, it.x + w / 2, it.z + d / 2];
}
/** Make a free-space test over the items so far. roads: [[x0, z0, x1, z1]] corridors to keep clear. */
export function spaceOf(items, roads = []) {
  const boxes = [];
  for (const it of items) { const b = foot(it); if (b) boxes.push(b); }
  const hit = (x0, z0, x1, z1) => boxes.some((b) => x0 < b[2] && x1 > b[0] && z0 < b[3] && z1 > b[1]) || roads.some((b) => x0 < b[2] && x1 > b[0] && z0 < b[3] && z1 > b[1]);
  return {
    free: (x, z, w, d) => !hit(x - w / 2, z - d / 2, x + w / 2, z + d / 2),
    take: (x, z, w, d) => boxes.push([x - w / 2, z - d / 2, x + w / 2, z + d / 2]),
  };
}
const SIZE = { wDryMat: [2.0, 1.4], wCrabPots: [1.9, 1.0], wBasin: [1.6, 1.2], wShrub: [1.2, 1.1], wTeaCorner: [2.2, 1.8], wWorker: [0.9, 0.9],
  jars: [1.4, 1.0], hens: [1.6, 1.2], flowers: [1.2, 1.0], wTinPlants: [1.8, 0.6], wPlanks: [3.6, 1.2], boatBlocks: [4.4, 1.4], netRack: [3.4, 0.6], woodpile: [1.6, 1.0], ducks: [2.6, 2.0] };

/** Fill a band [x0, x1] x [z0, z1] (the yards south of a street) with yard life at roughly `step` metres. */
export function fillBand(add, space, x0, x1, z0, z1, seed, step = 3.2, workers = []) {
  const r = rng(seed);
  // A deep band is filled in rows (the camera looks north, so the first ~8 m south of a street fill the lower
  // half of the screen: they are packed tight; deeper rows thin out, they are only seen from the yards).
  const rowH = 3.4;
  const rows = [];
  for (let zr = z0; zr < z1 - 0.8; zr += rowH) rows.push([zr, Math.min(z1, zr + rowH), zr - z0 < 7 ? 1 : 2.3]); // (deep rows thin out: phone budget)
  // packed-earth patches first (decals: anything may stand on them)
  for (const [ra, rb, thin] of rows) {
    for (let x = x0 + 1.5 + r() * 2; x < x1 - 1.5; x += (5.5 + r() * 4) * thin) {
      const d = Math.min(rb - ra + 0.8, 2.2 + r() * 1.8), w = 2.6 + r() * 2.6, z = ra + d / 2 + r() * Math.max(0, rb - ra - d);
      add({ k: 'wYard', x, z, w, d, seed: Math.floor(r() * 1e5) });
    }
  }
  const kinds = [['wDryMat', 4.2], ['wShrub', 5], ['wCrabPots', 1.3], ['wBasin', 1.3], ['jars', 0.3], ['flowers', 0.55], ['wTinPlants', 0.5], ['hens', 0.25], ['woodpile', 0.6], ['wTeaCorner', 0.5], ['wPuddle', 1.2]]; // (cheap low kinds weigh most: phone budget)
  const total = kinds.reduce((a, k) => a + k[1], 0);
  for (const [ra, rb, thin] of rows) {
    for (let x = x0 + 0.8 + r() * step; x < x1 - 0.8; x += step * thin * (0.7 + r() * 0.6)) {
      for (let tries = 0; tries < 3; tries++) {
        let q = r() * total, k = kinds[0][0];
        for (const [kk, wgt] of kinds) { if ((q -= wgt) < 0) { k = kk; break; } }
        const [w, d] = SIZE[k] || [1.2, 1.2];
        const z = ra + d / 2 + 0.2 + r() * Math.max(0, rb - ra - d - 0.4);
        if (!space.free(x, z, w + 0.4, d + 0.4)) continue;
        space.take(x, z, w + 0.4, d + 0.4);
        const it = { k, x, z, seed: Math.floor(r() * 1e5) };
        if (k === 'wShrub') it.s = 0.85 + r() * 0.4;
        if (k === 'wTinPlants') it.n = 3 + Math.floor(r() * 2);
        if (k === 'wPuddle') { it.w = 1.2 + r() * 0.6; it.d = 0.8 + r() * 0.3; }
        add(it);
        break;
      }
    }
  }
  for (const w of workers) {
    const [ww, dd] = SIZE.wWorker;
    if (space.free(w.x, w.z, ww, dd)) { space.take(w.x, w.z, ww, dd); add({ k: 'wWorker', ...w }); }
  }
}
