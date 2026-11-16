// Ledger Wharf's detail pass: small river-town things laid LAST (wharf.js calls detail() after every other pass),
// each through a free-space check over everything already there (wharf-yards.js spaceOf: every footprint, the
// streets, the quay's walking line x 63.5-70.2, the jetty mouths) and 2 m clear of the doors, desks and the day
// scripts' spots. Everything merges into the chunk meshes (outlined solids or flat ground decals): no draw call, no
// material, no canvas, no board. Evening light only through the streamer's shared lamp glows (5: the tea stall's
// two lamps, three jetty-head lanterns); the tea stall's kettle already steams. Nothing points the way.
//
// Lessons carried: ch 2 the river is not yours to steer, your own net is (net-drying poles on the Rope Walk: mend
// what is yours); ch 8 greet everyone, carry no grudge (Daw Sanda's greeting bench, an honest count chalked by the
// godown: a ledger page under a stone, nothing written in the margin).
//
//   detail({ ITEMS, add, PROP, keep }) -> { placed, skipped }
//
// Kinds (prefix wd): wdPole, wdPuddle, wdLeaves, wdScrap, wdCorner, wdRope (a bollard's rope loop and a coil),
// wdFender (an old tyre on a jetty's side), wdFish (fish crates, a basin of ice, a weighing basket), wdPerch (a white
// river bird or a crow on a post), wdNets (net-drying poles), wdLedger (a crate, a ledger page under a stone),
// wdBench (Daw Sanda's greeting bench), wdLamp (a lantern; its core is a shared glow), wdCart (a parked hand cart,
// a dog asleep under it).
import { rng, shade } from '../kit.js';
import { pole, puddle, leaves, scrap, perch, crossing, line, MC } from './mw-kit.js';
import { spaceOf } from './wharf-yards.js';

const PI = Math.PI;
const C = {
  tar: '#3F3328', wood: '#B98A5A', woodD: '#7E5A38', woodL: '#CDA577', woodG: '#A89A86', woodGD: '#8C7E6A', woodGL: '#C4B9A6',
  rope: '#C8A878', ropeD: '#A88C5E', tyre: '#2B2724', tyreL: '#3E3934', iron: '#4A3B30', zinc: '#A7A9A2', zincD: '#878A84',
  fish: '#C9CED1', fishD: '#9EA6AA', ice: '#E6F0F2', iceD: '#C9DCE2', tarp: '#3E5F7A', tarpL: '#4E8C86', bamboo: '#C8B36E',
  bambooD: '#A8925A', net: '#6E7F5A', netL: '#8C9A6E', red: '#C8323C', white: '#FFFDF8', glass: '#F6D98A', ledger: '#F4EEDC',
  stone: '#9F9683', stoneL: '#B9B09C', flask: '#C8323C', teal: '#4E8C86', jute: '#C8A878',
};
const circ = (it, r, ox = 0, oz = 0) => { const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0); return { type: 'circle', x: it.x + ox * c + oz * s, z: it.z - ox * s + oz * c, r }; };
function obBox(it, w, d, ox = 0, oz = 0) {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const cx = it.x + ox * c + oz * s, cz = it.z - ox * s + oz * c;
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return { type: 'box', minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd };
}
const none = () => [];

/** A rope looped over a quay bollard (local +X: the bollard, 0.85 m on, toward the water) and, now and then, the
 * rest of it coiled flat on the deck. */
function wdRope(g, f, it) {
  const bx = 0.85;
  // the loop round the bollard's neck (four thin bars), its tail down to the deck
  for (const [dx, dz, w, d] of [[0, -0.19, 0.42, 0.05], [0, 0.19, 0.42, 0.05], [-0.19, 0, 0.05, 0.42], [0.19, 0, 0.05, 0.42]]) g.box(bx + dx, 0.5, dz, w, 0.05, d, C.rope);
  line(f, [bx - 0.2, 0.48, 0.05], [0.1, 0.04, 0.1], 0.045, C.ropeD);
  if (it.coil) for (let k = 0; k < 3; k++) { const s = 0.62 - k * 0.14; g.box(-0.05, 0.03 + k * 0.045, 0.05, s, 0.045, s, k % 2 ? C.rope : C.ropeD, k * 0.4); }
}

/** An old tyre hung on a jetty's side as a fender (it faces local +Z, the water), its rope over the deck's edge. */
function wdFender(g, f, it) {
  const y = -0.36, s = 0.56, t = 0.13, d = 0.16;
  g.box(0, y + s / 2 - t / 2, 0, s, t, d, C.tyre);
  g.box(0, y - s / 2 + t / 2, 0, s, t, d, C.tyre);
  for (const sx of [-1, 1]) g.box(sx * (s / 2 - t / 2), y, 0, t, s - 2 * t, d, C.tyreL);
  line(f, [0, y + s / 2, -0.02], [0, 0.07, -0.16], 0.03, C.ropeD);
}

/** Fish crates stacked under a tarp, a tin basin of ice blocks, a round weighing basket (quay deck, off the walk). */
function wdFish(g, f, it) {
  const r = rng(it.seed || 4);
  f.flatR(0, 0, 2.0, 1.2, 0.0047, '#B9AE98', 0);
  for (let k = 0; k < 3; k++) {
    const x = -0.55 + (k % 2) * 0.62, y = 0.16 + Math.floor(k / 2) * 0.3;
    g.box(x, y, 0, 0.58, 0.3, 0.44, k % 2 ? C.teal : C.woodL, (r() - 0.5) * 0.1);
    f.flatR(x, 0, 0.5, 0.36, y + 0.155, k === 2 ? C.tarp : C.fish, 0);
    if (k < 2) for (let q = 0; q < 3; q++) f.flatR(x - 0.15 + q * 0.15, 0, 0.1, 0.3, y + 0.16, C.fishD, 0.2);
  }
  g.boxR(-0.24, 0.62, 0.0, 0.7, 0.04, 0.56, C.tarp, 0, 0.1, 0.12); // the tarp over the top crate
  g.box(0.62, 0.12, 0.1, 0.56, 0.24, 0.48, C.zinc);
  for (let k = 0; k < 4; k++) f.box(0.5 + (k % 2) * 0.22, 0.25, -0.02 + (k >> 1) * 0.22, 0.18, 0.08, 0.17, k % 2 ? C.ice : C.iceD);
  g.box(0.62, 0.15, -0.44, 0.42, 0.26, 0.42, C.bambooD);
  f.flatR(0.62, -0.44, 0.34, 0.34, 0.285, C.fish, 0.3);
}

/** Net-drying poles: three bamboo poles in a row (local X), a net hung between them, floats along its top rope
 * (ch 2: the river is not yours to steer; your own net is yours to mend). */
function wdNets(g, f, it) {
  const r = rng(it.seed || 2), L = it.len || 4.4, H = 2.2;
  f.flatR(0, 0, L + 0.4, 0.9, 0.0047, '#D6C29A', 0);
  for (const x of [-L / 2, 0, L / 2]) { g.box(x, H / 2, 0, 0.09, H, 0.09, C.bamboo); g.box(x, 0.05, 0, 0.16, 0.1, 0.16, C.bambooD); }
  for (const [a, b] of [[-L / 2, 0], [0, L / 2]]) {
    const top = H - 0.12, bot = 0.55, w = b - a;
    line(f, [a, top, 0.03], [b, top - 0.08, 0.03], 0.025, C.rope);
    for (let k = 1; k < 6; k++) { const x = a + (w * k) / 6; line(f, [x, top - 0.04, 0.035], [x + 0.06, bot + 0.1 * Math.sin(k), 0.035], 0.012, k % 2 ? C.net : C.netL); }
    for (let k = 1; k < 4; k++) { const y = top - ((top - bot) * k) / 4; line(f, [a + 0.05, y, 0.04], [b - 0.05, y - 0.06, 0.04], 0.012, C.netL); }
    for (let k = 0; k < 4; k++) f.box(a + w * (k + 0.5) / 4, top - 0.05, 0.05, 0.1, 0.08, 0.08, k % 2 ? C.red : C.white);
  }
  // a mending stool and a shuttle left on it
  g.box(L / 2 - 1.0, 0.13, 0.5, 0.3, 0.05, 0.3, MC.blue);
  g.box(L / 2 - 1.0, 0.06, 0.5, 0.22, 0.12, 0.22, shade(MC.blue, 0.8));
  f.box(L / 2 - 1.0, 0.17, 0.5, 0.06, 0.02, 0.2, C.woodL);
  void r;
}

/** A crate by the godown with a ledger page held down by a stone, chalk tallies on the planks below: an honest
 * count, nothing in the margin (ch 8). */
function wdLedger(g, f, it) {
  g.box(0, 0.25, 0, 0.6, 0.5, 0.5, C.woodL);
  g.box(0, 0.25, 0.255, 0.44, 0.06, 0.01, C.woodD);
  f.flatR(0.02, 0.0, 0.36, 0.44, 0.505, C.ledger, 0.15);
  for (let k = -2; k <= 2; k++) f.flatR(0.02 - Math.sin(0.15) * k * 0.07, Math.cos(0.15) * k * 0.07 * -1, 0.32, 0.01, 0.507, MC.blue, 0.15);
  f.flatR(-0.09, -0.02, 0.012, 0.4, 0.508, MC.red, 0.15);
  g.box(0.06, 0.55, 0.06, 0.16, 0.08, 0.13, C.stone, 0.4);
  f.at(f.tx + 0.75 * f.tc + 0.2 * f.ts, f.tz - 0.75 * f.ts + 0.2 * f.tc, f.ry);
  scrap(g, f, { kind: 'tally', n: 2, seed: 3 });
}

/** Daw Sanda's greeting bench beside her house: a plank seat, a flask of tea and two glasses for whoever sits,
 * a back board carved with a wave (ch 8: the house that greets everyone, whoever they are). Local X along the seat. */
function wdBench(g, f, it) {
  f.flatR(0, 0, 1.6, 0.7, 0.0047, '#B9AE98', 0);
  for (const sx of [-0.55, 0.55]) { g.box(sx, 0.2, 0, 0.08, 0.4, 0.32, C.woodD); g.box(sx, 0.45, -0.17, 0.07, 0.5, 0.06, C.woodD); }
  g.box(0, 0.43, 0, 1.36, 0.06, 0.38, C.woodL);
  g.box(0, 0.72, -0.18, 1.3, 0.24, 0.05, C.woodGL);
  for (let k = 0; k < 6; k++) f.box(-0.5 + k * 0.2, 0.72 + (k % 2 ? 0.04 : -0.04), -0.15, 0.16, 0.03, 0.01, MC.blue); // the carved wave
  g.box(-0.4, 0.6, 0.02, 0.12, 0.28, 0.12, C.flask);
  f.box(-0.4, 0.76, 0.02, 0.08, 0.04, 0.08, C.white);
  for (const x of [-0.2, -0.06]) f.box(x, 0.5, 0.06, 0.07, 0.09, 0.07, '#E9C79A');
}

/** A hurricane lantern (a base, a cap and its handle; the glass is the shared glow core) at local (0, y, 0). */
function wdLamp(g, f, it, ctx) {
  const y = it.y || 1.0;
  g.box(0, y + 0.02, 0, 0.2, 0.05, 0.2, C.iron);
  g.box(0, y + 0.36, 0, 0.24, 0.05, 0.24, C.iron);
  for (const sx of [-0.1, 0.1]) f.box(sx, y + 0.19, 0, 0.02, 0.32, 0.02, C.iron);
  f.box(0, y + 0.44, 0, 0.14, 0.08, 0.02, C.iron);
  ctx.glows.push(it.x, y + 0.19, it.z);
}
/** The glow only (a lamp already drawn there by its own kind: the tea stall's hanging lamp). */
function wdGlow(g, f, it, ctx) { ctx.glows.push(it.x, it.y, it.z); }

/** A parked hand cart with two sacks, a dog asleep in its shade (drawn with the Wharf's own cart, PROP.handCart). */
function makeCart(cart) {
  return function wdCart(g, f, it, ctx) {
    if (cart) cart(g, f, it, ctx);
    for (const [x, ry] of [[-0.3, 0.2], [0.25, -0.15]]) { g.box(x, 0.86, 0, 0.5, 0.3, 0.38, C.jute, ry); g.box(x, 1.02, 0, 0.26, 0.06, 0.22, shade(C.jute, 0.85), ry); }
    perch(g, f, { kind: 'dog', seed: it.seed || 4 });
  };
}

// ---------------------------------------------------------------------------------
// The pass
// ---------------------------------------------------------------------------------
const JET = [[431, 97, 2.2], [441, 91, 1.8], [450, 92, 1.8], [459, 90, 1.8], [467, 88, 1.6], [476, 99, 2.2]];
const QUAY = 77;

export function detail({ ITEMS, add, PROP, keep = [] }) {
  const own = {
    wdPole: { draw: pole, obstacles: (it) => [circ(it, 0.2)] },
    wdPuddle: { draw: puddle, obstacles: none },
    wdLeaves: { draw: leaves, obstacles: none },
    wdScrap: { draw: scrap, obstacles: none },
    wdCorner: { draw: crossing, obstacles: none },
    wdRope: { draw: wdRope, obstacles: (it) => (it.coil ? [circ(it, 0.32, -0.05, 0.05)] : []) },
    wdFender: { draw: wdFender, obstacles: none },
    wdFish: { draw: wdFish, obstacles: (it) => [obBox(it, 1.9, 1.1)] },
    wdPerch: { draw: perch, obstacles: none },
    wdNets: { draw: wdNets, obstacles: (it) => [obBox(it, (it.len || 4.4) + 0.3, 0.4)] },
    wdLedger: { draw: wdLedger, obstacles: (it) => [obBox(it, 0.65, 0.55)] },
    wdBench: { draw: wdBench, obstacles: (it) => [obBox(it, 1.4, 0.5)] },
    wdLamp: { draw: wdLamp, obstacles: none },
    wdGlow: { draw: wdGlow, obstacles: none },
    wdCart: { draw: makeCart(PROP.handCart?.draw), obstacles: (it) => [obBox(it, 2.0, 1.2, -0.2, 0)] },
  };
  Object.assign(PROP, own);
  const placed = [], skipped = [];
  // the streets, the quay's walking line and the jetty mouths: corridors kept clear (as wharf.js's yard bands)
  const roads = [
    [-60, 446.4, 63.2, 449.6], [-40, 480.4, 63.2, 483.6], [-55, 420.4, 17.2, 423.6], [14.4, 400, 17.6, 498],
    [60.4, 404, 70.2, 498], ...JET.map(([z, , w]) => [70, z - w / 2 - 0.4, QUAY + 0.2, z + w / 2 + 0.4]),
  ];
  // the sloping lanes from the Market down to the quay: a band either side of each piece
  const LANE = [[7, 378], [8, 392], [16, 404], [32, 414], [48, 420], [62, 424]];
  const laneD = (x, z) => { let b = Infinity; for (let k = 0; k < LANE.length - 1; k++) { const [x0, z0] = LANE[k], [x1, z1] = LANE[k + 1], dx = x1 - x0, dz = z1 - z0, t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz))); b = Math.min(b, Math.hypot(x - x0 - dx * t, z - z0 - dz * t)); } return b; };
  const space = spaceOf(ITEMS, roads);
  const keepOk = (x, z, d = 2.0) => keep.every((k) => Math.hypot(k.x - x, k.z - z) >= d);
  const keepRect = (x0, z0, x1, z1, d = 2.0) => keep.every((k) => Math.hypot(Math.max(x0 - k.x, 0, k.x - x1), Math.max(z0 - k.z, 0, k.z - z1)) >= d);
  /** a solid thing: the first candidate whose footprint (w x d, turned) is free and 2 m from the keep places */
  const tryPut = (o, w, d, cands, lane = 2.4) => {
    const sw = Math.abs(Math.sin(o.ry || 0)) > 0.7;
    const [ww, dd] = sw ? [d, w] : [w, d];
    for (const [x, z] of cands) {
      if (!space.free(x, z, ww + 0.3, dd + 0.3) || !keepRect(x - ww / 2, z - dd / 2, x + ww / 2, z + dd / 2) || laneD(x, z) < lane + Math.max(ww, dd) / 2) continue;
      space.take(x, z, ww + 0.3, dd + 0.3);
      placed.push(o.k);
      return add({ ...o, x, z });
    }
    skipped.push(o.k + '@' + cands[0]);
    return null;
  };
  const flat = (o, lane = 1.6) => { if (!keepOk(o.x, o.z, 1.6) || laneD(o.x, o.z) < lane) { skipped.push(o.k + '@' + o.x + ',' + o.z); return null; } placed.push(o.k); return add(o); };
  const grid = (x0, x1, z0, z1, st) => { const o = []; for (let z = z0; z <= z1 + 1e-6; z += st) for (let x = x0; x <= x1 + 1e-6; x += st) o.push([+x.toFixed(2), +z.toFixed(2)]); return o; };

  // W1 ropes on the quay's bollards (every bollard of each kerbed deck stretch, as art/wharf.js quayDeck lays them),
  // one in three with the rest of the rope coiled on the deck
  let nb = 0;
  for (const q of ITEMS.filter((it) => it.k === 'quayDeck' && it.kerb !== false)) {
    for (let z = -q.d / 2 + 2; z < q.d / 2 - 1; z += q.bollards || 7.5) {
      if (nb++ % 2) continue;
      const x = q.x + q.w / 2 - 0.45 - 0.85, wz = q.z + z, coil = nb % 3 === 1;
      if (coil && !space.free(x - 0.05, wz + 0.05, 0.7, 0.7)) continue;
      if (coil) space.take(x - 0.05, wz + 0.05, 0.7, 0.7);
      add({ k: 'wdRope', x, z: wz, coil }); placed.push('wdRope');
    }
  }
  // W2 old tyres on the jetties' south sides (clear of the boats moored there and of each jetty's ladder and tip)
  // (between the jetty's posts, which stand every 2.1 m from x 78.0)
  for (const [z, tip, w, xs] of [[431, 97, 2.2, [81.15, 87.45]], [441, 91, 1.8, [81.15]], [450, 92, 1.8, [81.15, 85.35]], [459, 90, 1.8, [81.15]], [467, 88, 1.6, [81.15, 83.25]]]) {
    for (const x of xs) if (x < tip - 2.6) { add({ k: 'wdFender', x, z: z + w / 2 + 0.09, ry: 0 }); placed.push('wdFender'); }
  }
  // W14 lanterns on the Rice, Fish and Wood jetty heads' mooring posts (lit in the evening)
  for (const [z, tip, w] of [JET[1], JET[2], JET[3]]) { add({ k: 'wdLamp', x: tip - 0.3, z: z + w / 2 - 0.25, y: 0.94 }); placed.push('wdLamp'); }
  // W4 river birds and crows on the posts: an egret on Little Jetty's and Jetty End's mooring posts, a crow on Big
  // Jetty's, a crow on a quay lamp's head
  add({ k: 'wdPerch', kind: 'egret', x: 88 - 0.3, z: 467 + 0.8 - 0.25, y: 0.94, ry: -0.6, seed: 1 });
  add({ k: 'wdPerch', kind: 'egret', x: 88 + 10.75, z: 476.6, y: 1.06, ry: 2.4, seed: 2 });
  add({ k: 'wdPerch', kind: 'crow', x: 97 - 0.3, z: 431 + 1.1 - 0.25, y: 0.9, ry: 1.2, seed: 3 });
  const qlamp = ITEMS.find((it) => it.k === 'lamp' && Math.abs(it.x - 64.6) < 0.2 && Math.abs(it.z - 452) < 0.5);
  if (qlamp) add({ k: 'wdPerch', kind: 'crow', x: qlamp.x, z: qlamp.z, y: 3.08, ry: -0.8, seed: 4 });
  placed.push('wdPerch', 'wdPerch', 'wdPerch');
  // W9 the tea stall's lamps (evening): its own hanging lamp lit, a hurricane lamp on the free end of its counter
  const tea = ITEMS.find((it) => it.k === 'teaHut');
  if (tea) {
    const D = tea.d || 2.4;
    add({ k: 'wdGlow', x: tea.x + 0.2, z: tea.z, y: 2.15 });
    add({ k: 'wdLamp', x: tea.x + 0.75, z: tea.z - D / 2 + 0.6, y: 0.95 });
    placed.push('wdGlow', 'wdLamp');
  }
  // W3 fish crates and ice on the quay deck, off the walking line, between the jetty mouths
  let fishN = 0;
  for (const z of [428.6, 446.4, 457.0, 470.8, 438.0, 464.0]) {
    if (fishN >= 3) break;
    if (tryPut({ k: 'wdFish', ry: 0, seed: Math.round(z) }, 1.9, 1.1, [[72.4, z], [74.4, z], [73.2, z + 0.8], [75.2, z - 0.8], [72.8, z - 1.2]], 0)) fishN++;
  }
  // W13 Daw Sanda's greeting bench, beside her house, not in front of her door or its path to the quay
  tryPut({ k: 'wdBench', ry: PI / 2 }, 1.4, 0.5, [[75.3, 461.7], [75.4, 462.0]], 0); // (her east side, toward the water)
  // W8 the honest count by the quay road's godowns: a crate, a ledger page under a stone, chalk tallies
  tryPut({ k: 'wdLedger', ry: PI / 2 }, 0.65, 0.55, [[59.6, 448.6], [59.8, 444.6], [59.6, 460.6], [59.8, 468.2]], 1.8);
  // W5 a power line down the first lane's east side, from the Market's foot toward the river (the lane runs north-
  // south here: nothing of it stands south of a street), mynas on one span
  {
    const P = [];
    for (const [x, z] of [[10.0, 381.2], [10.6, 388.6], [14.4, 396.8]]) {
      let got = null;
      for (const [dx, dz] of [[0, 0], [0.3, 0.8], [0.3, -0.8], [0.6, 1.4], [0.6, -1.4], [-0.3, 0.8]]) {
        const px = x + dx, pz = z + dz;
        if (space.free(px, pz, 0.5, 0.5) && keepOk(px, pz) && laneD(px, pz) > 2.5) { space.take(px, pz, 0.5, 0.5); got = add({ k: 'wdPole', x: px, z: pz, ry: 0, span: 0, seed: Math.round(pz) }); placed.push('wdPole'); break; }
      }
      if (!got) skipped.push('wdPole@' + z);
      P.push(got);
    }
    P.forEach((p, i) => {
      const q = P[i + 1];
      if (!p || !q) return;
      const dx = q.x - p.x, dz = q.z - p.z, L = Math.hypot(dx, dz);
      if (L > 14.2) return;
      Object.assign(p, { span: L, ry: Math.atan2(-dz, dx), birds: i === 0 ? 3 : 0, tx: i === 1 });
      q.ry = p.ry;
    });
  }
  // W6 net-drying poles on the Rope Walk's south side, well back from the street (z 490+: the low camera's foreground
  // stays low), on the bare earth
  for (let n = 0; n < 2; n++) { const p = tryPut({ k: 'wdNets', ry: 0, len: 4.4, seed: n + 2 }, 4.8, 0.9, grid(-30, 56, 490.2, 494.6, 1.4), 0); if (p) space.take(p.x, p.z, 22, 2); }
  // W11 a hand cart parked in a yard south of Godown Row's west half, a dog asleep in its shade
  tryPut({ k: 'wdCart', ry: 0, seed: 4 }, 2.1, 1.3, grid(-48, -4, 451.6, 454.6, 1.0), 0);
  // W7 about half the loose tufts on the bare yards become rain puddles (flat; the rest stay)
  let tn = 0;
  for (const it of ITEMS) {
    if (it.k !== 'tufts' || it.z < 380 || tn++ % 2) continue;
    const r = rng(Math.round(it.x * 31 + it.z * 7));
    Object.assign(it, { k: 'wdPuddle', w: 1.3 + r() * 0.8, d: 0.8 + r() * 0.4, seed: it.seed || 3 });
    placed.push('wdPuddle');
  }
  // W10 Net Lane's crossings: worn paving corners; fallen leaves under the trees by the lanes
  [[16, 422, 11], [16, 448, 12], [16, 482, 13]].forEach(([x, z, s]) => { add({ k: 'wdCorner', x, z, seed: s, o: 2.2, drain: s % 4, a: [1, 1, 1, 1] }); placed.push('wdCorner'); });
  let lv = 0;
  for (const t of ITEMS) {
    if ((t.k !== 'padauk' && t.k !== 'rain') || t.z < 380) continue;
    if (lv++ % 2) continue;
    flat({ k: 'wdLeaves', x: t.x + 0.3, z: t.z + 0.9, w: 2.4 * (t.s || 1), d: 1.6, n: 10, pal: t.k === 'rain' ? 'rain' : 'padauk', seed: Math.round(t.x * 11 + t.z) });
  }
  // W8 chalk tallies on the deck by the weigh-house door and the godowns (decals)
  for (const [x, z, n] of [[66.8, 417.6, 3], [68.4, 446.6, 2]]) flat({ k: 'wdScrap', kind: 'tally', x, z, n, seed: Math.round(z) }, 0);
  return { placed, skipped };
}
