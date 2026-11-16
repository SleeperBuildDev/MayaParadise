// The Exercise-Book Quarter's detail pass (art plan 2026-11-16, section 4): the small things of street life the Quarter
// still lacked, laid LAST (called once at the end of quarter.js), each through the Quarter's own clear-check (`place`,
// the footprints FP, the roads, STORY_CLEAR) or, for the few dressed story corners, against the day scripts' spots
// (2 m). Everything merges into the chunk meshes (boxes in g, decals in f): no canvas, no material, no draw call, no
// update. One steam point (the snack shop's tea urn). Nothing points the way; no text at all.
//
//   Q1  power poles on the first street's north kerb (the lamp line), wires to the next pole, mynas
//   Q2  house fronts: a bicycle leaning on the wall, a pair of basil pots, a broom (the side away from the door)
//       (Q3, window boxes on the stilt houses: the kind qdSill is kept but not laid, for the triangle budget)
//   Q5  pavement wear along the avenue's footpaths
//   Q6  a water tank on its stand in a back lot
//   Q7  free drinking water and two bicycles by the school (ch 9: water for anyone)
//   Q8  the snack shop's tea urn on a charcoal stove, steaming
//   Q9  puddles after the rain, a paper boat beside one (ch 9: Maung Nge teaches Su Nwe the boat)
//   Q10 paper litter in the yards: a torn ruled corner, a crumpled ball, pencil shavings by the big pencils
//   Q11 a costume rail behind the little stage, a cardboard sun leaning on it (ch 4: tonight's scene, not last year's)
//   Q12 the potter's shelf of drying pots, chalked with their days, and one cracked pot set apart (ch 5: patience)
//   Q13 a chalk hopscotch whose last square is a big "?" (ch 3: ask why)
//   Q14 a dog asleep at a corner, cats on fence posts
//   Q15 a kite laid down in a yard between flights, its tail out on the grass, the reel beside it
//   Q16 gold-star stickers fallen on the landing green (growth: stars for effort)
// (Q4, striped shop awnings: the Quarter's shops already have them.)
// Imports only kit.js / toon.js / voxel.js (and the street kit, which imports only those).
import { rng } from '../kit.js';
import * as SK from '../art/street-kit.js';

const PI = Math.PI;
const C = {
  wood: '#A0642E', woodD: '#6B482B', woodL: '#CDA577', bamboo: '#D8BE7E', bambooD: '#B8964E', iron: '#4A3B30', ink: '#2A2118',
  terra: '#B5643C', terraL: '#CB7E4E', terraD: '#8E4A2C', clay: '#D9B48A', clayD: '#C49A6C', leaf: '#6FA04E', leafD: '#5E8F44',
  white: '#FFFDF8', cream: '#F6EEDB', chalk: '#F7F4EC', red: '#C8323C', blue: '#2F5DB3', teal: '#2F7C7A', mustard: '#E2B33C',
  gold: '#E8B832', goldD: '#C9962A', copper: '#B87333', copperD: '#8E5526', straw: '#D9C27A', strawD: '#B89E52', shadow: '#E3D8BE',
  pink: '#E8A0A8', violet: '#7A4E9C', sky: '#9CC3DE',
};

// ---------------------------------------------------------------------------------
// The new kinds (g = outlined solids, f = the flat ground mesh)
// ---------------------------------------------------------------------------------
/** Q2: a broom leaning on the wall just behind it (local -z). */
function broom(g, f) {
  g.boxR(0, 0.62, 0.1, 0.05, 1.2, 0.05, C.woodL, -0.16, 0, 0);
  g.boxR(0, 0.12, 0.2, 0.32, 0.24, 0.08, C.straw, -0.16, 0, 0);
  g.boxR(0, 0.25, 0.18, 0.2, 0.05, 0.09, C.red, -0.16, 0, 0);
  f.flatR(0, 0.12, 0.5, 0.3, 0.0052, C.shadow);
}
/** Q2: a pair of clay pots with basil. */
function basilPots(g, f, it) {
  const r = rng(it.seed || 3);
  for (const [x, s] of [[-0.18, 1], [0.18, 0.8]]) {
    g.box(x, 0.13 * s, 0, 0.28 * s, 0.26 * s, 0.28 * s, r() < 0.5 ? C.terra : C.terraL);
    g.box(x, 0.3 * s + 0.04, 0, 0.3 * s, 0.18 * s, 0.3 * s, r() < 0.5 ? C.leaf : C.leafD);
  }
  f.flatR(0, 0.06, 0.8, 0.45, 0.0052, C.shadow);
}
/** Q3: window flower boxes for a stilt house, drawn in the house's own frame (same anchor: they fade with it). */
function stiltSills(g, f, it) {
  const W = it.w, D = it.d, r = rng(it.seed);
  r(); r(); const doorX = (r() - 0.5) * (W - 2.4); // (build.js house(): trim, shutters, then the door)
  for (const wx of [-W / 2 + 1.0, W / 2 - 1.0]) if (Math.abs(wx - doorX) > 1.2) SK.sillBox(g, wx, 1.76, D / 2, 1.06, it.seed + Math.round(wx * 10));
}
/** Q8: a tea urn on a charcoal stove with two cups on a tray (Daw Ohn's: the tea is always on). */
function teaUrn(g, f, it, ctx) {
  for (const sx of [-0.18, 0.18]) for (const sz of [-0.18, 0.18]) g.box(sx, 0.2, sz, 0.05, 0.4, 0.05, C.iron);
  g.box(0, 0.5, 0, 0.5, 0.22, 0.5, C.iron); // the stove
  g.box(0, 0.47, 0.255, 0.3, 0.1, 0.01, '#E5672E'); // embers through the door
  g.box(0, 0.8, 0, 0.36, 0.4, 0.26, C.copper); // the urn (two crossed boxes)
  g.box(0, 0.8, 0, 0.26, 0.4, 0.36, C.copper);
  g.box(0, 1.04, 0, 0.22, 0.08, 0.22, C.copperD);
  g.box(0, 1.12, 0, 0.06, 0.06, 0.06, C.ink); // knob
  g.box(0.2, 0.72, 0.1, 0.1, 0.04, 0.04, C.copperD); // the tap
  g.box(0.45, 0.32, 0.05, 0.36, 0.04, 0.3, C.woodL); // a little shelf with two glasses
  g.box(0.45, 0.16, 0.05, 0.05, 0.3, 0.05, C.woodD);
  for (const x of [0.37, 0.53]) g.box(x, 0.38, 0.05, 0.08, 0.09, 0.08, C.white);
  f.flatR(0.15, 0.05, 1.1, 0.7, 0.0052, C.shadow);
  ctx.smoke.push(g.tx, 1.45, g.tz); // steam off the urn's lid (world space; the urn stands at the item's origin)
}
/** Q9: a folded paper boat (made from a ruled page). */
function paperBoat(g, f) {
  g.box(0, 0.05, 0, 0.36, 0.08, 0.14, C.cream);
  g.box(0, 0.12, 0, 0.18, 0.12, 0.12, C.white);
  g.box(-0.13, 0.1, 0, 0.08, 0.08, 0.13, C.cream);
  g.box(0.13, 0.1, 0, 0.08, 0.08, 0.13, C.cream);
  f.flatR(0, 0.075, 0.34, 0.012, 0.0072, '#7FA6D6');
}
/** Q11: a costume rail behind the stage: shirts and a longyi on hangers, a cardboard sun leaning on its end. */
function costumeRail(g, f) {
  for (const sx of [-0.85, 0.85]) { g.box(sx, 0.82, 0, 0.06, 1.64, 0.06, C.woodD); g.box(sx, 0.03, 0, 0.08, 0.06, 0.5, C.woodD); }
  g.box(0, 1.6, 0, 1.76, 0.05, 0.05, C.iron);
  const cloth = [[-0.5, C.red, 0.7], [-0.05, C.cream, 0.6], [0.42, C.teal, 1.1]];
  for (const [x, c, h] of cloth) {
    g.box(x, 1.6 - h / 2, 0, 0.36, h, 0.06, c);
    if (h < 1) for (const sx of [-0.24, 0.24]) g.box(x + sx, 1.45, 0, 0.12, 0.26, 0.05, c); // sleeves
  }
  g.box(0.42, 1.2, 0.04, 0.38, 0.06, 0.02, C.mustard); // the longyi's band
  // the cardboard sun from last year's show, leaning on the end of the rail
  g.boxR(1.12, 0.62, 0.12, 0.7, 0.7, 0.04, C.mustard, -0.2, 0, 0);
  g.boxR(1.12, 0.62, 0.12, 0.92, 0.12, 0.03, '#F0C850', -0.2, 0, 0.6);
  g.boxR(1.12, 0.62, 0.12, 0.92, 0.12, 0.03, '#F0C850', -0.2, 0, -0.6);
  f.flatR(0.1, 0.05, 2.4, 0.7, 0.0052, C.shadow);
}
/** Q12: a plank shelf of pots drying, each chalked with its days (1 to 4 strokes), and one pot set apart, cracked:
 * it was fired before its time. */
function dryShelf(g, f) {
  for (const sx of [-0.95, 0.95]) g.box(sx, 0.12, 0, 0.24, 0.24, 0.4, C.terraD); // bricks
  g.box(0, 0.27, 0, 2.3, 0.06, 0.42, C.woodL);
  for (let i = 0; i < 4; i++) {
    const x = -0.78 + i * 0.52;
    g.box(x, 0.48, 0, 0.36, 0.36, 0.26, C.clay);
    g.box(x, 0.48, 0, 0.26, 0.36, 0.36, C.clay);
    g.box(x, 0.68, 0, 0.24, 0.04, 0.24, C.clayD);
    for (let k = 0; k <= i; k++) f.box(x - 0.09 + k * 0.06, 0.48, 0.185, 0.022, 0.16, 0.01, C.chalk); // its days, in chalk
  }
  // the cracked one, on the ground at the end, a shard beside it
  g.box(1.55, 0.18, 0.15, 0.36, 0.36, 0.26, C.clay);
  g.box(1.55, 0.18, 0.15, 0.26, 0.36, 0.36, C.clay);
  f.boxR(1.52, 0.2, 0.335, 0.025, 0.3, 0.01, C.ink, 0, 0, 0.4);
  g.boxR(1.85, 0.03, 0.4, 0.14, 0.05, 0.1, C.clayD, 0, 0.5, 0);
  f.flatR(0.3, 0.1, 3.0, 0.8, 0.0052, C.shadow);
}
/** Q13: a chalk hopscotch along local x whose last square is a big question mark. f only (walked over). */
function hopscotch(g, f) {
  const S = 0.62, y = 0.0062, w = 0.035;
  const sq = (cx, cz) => {
    f.flatR(cx, cz - S / 2, S, w, y, C.chalk); f.flatR(cx, cz + S / 2, S, w, y, C.chalk);
    f.flatR(cx - S / 2, cz, w, S, y, C.chalk); f.flatR(cx + S / 2, cz, w, S, y, C.chalk);
  };
  const cells = [[0, [0]], [1, [0]], [2, [-0.5, 0.5]], [3, [0]], [4, [-0.5, 0.5]], [5, [0]]];
  for (const [i, zs] of cells) for (const z of zs) sq(-1.7 + i * S, z * S);
  // the "?" in the last square, and a chalk stub left by it
  const qx = -1.7 + 6 * S;
  sq(qx, 0);
  f.flatR(qx - 0.12, -0.08, 0.04, 0.2, y + 0.0002, C.chalk, 0.5);
  f.flatR(qx, -0.17, 0.2, 0.04, y + 0.0002, C.chalk);
  f.flatR(qx + 0.12, -0.08, 0.04, 0.2, y + 0.0002, C.chalk, -0.5);
  f.flatR(qx + 0.06, 0.03, 0.04, 0.14, y + 0.0002, C.chalk, -0.6);
  f.flatR(qx, 0.1, 0.04, 0.1, y + 0.0002, C.chalk);
  f.flatR(qx, 0.21, 0.05, 0.05, y + 0.0002, C.chalk);
  g.box(qx + 0.45, 0.02, 0.32, 0.12, 0.04, 0.04, C.chalk);
}
/** Q15: a diamond kite laid down on the grass between flights (it waits for the afternoon wind): paper body with
 * its cross spars, a long tail of bows curling over the grass, the reel of string beside it. All low (from above it
 * reads as a kite; standing on a pole it read as a road sign). */
function yardKite(g, f, it) {
  const r = rng(it.seed || 5), c = [C.red, C.blue, C.teal][Math.floor(r() * 3)], c2 = r() < 0.5 ? C.cream : C.mustard;
  g.box(0, 0.025, 0, 0.62, 0.02, 0.62, c, PI / 4);
  g.box(0, 0.03, 0.0, 0.3, 0.02, 0.3, c2, PI / 4);
  f.flatR(0, 0, 0.86, 0.025, 0.045, C.bambooD, 0); f.flatR(0, 0, 0.025, 0.86, 0.045, C.bambooD, 0);
  for (let k = 0; k < 6; k++) {
    const x = 0.5 + k * 0.22, z = 0.12 + Math.sin(k * 0.9) * 0.16;
    f.flatR(x, z, 0.24, 0.012, 0.0062, C.ink, 0.3 * Math.cos(k * 0.9));
    f.flatR(x + 0.11, z, 0.09, 0.07, 0.0066, k % 2 ? c : c2, 0.6);
  }
  g.box(-0.6, 0.06, 0.35, 0.18, 0.12, 0.12, C.woodL); // the reel
  g.box(-0.6, 0.06, 0.35, 0.08, 0.14, 0.14, C.white);
}
/** Q16: a gold-star sticker (two crossed flats and a pale rim), fallen on the grass. */
function goldStar(g, f, it) {
  const a = it.seed || 0.3;
  for (const t of [0, PI / 5 * 2, PI / 5 * 4]) f.flatR(0, 0, 0.36, 0.1, 0.0066, C.goldD, a + t);
  for (const t of [0, PI / 5 * 2, PI / 5 * 4]) f.flatR(0, 0, 0.3, 0.07, 0.0068, C.gold, a + t);
}

/** Q5: the avenue's footpaths are a raised parchment strip (build.js roads: top 0.033, seams 0.038), so the wear is
 * drawn just above it. */
function footpathWear(g, f, it) { f.ty = 0.034; SK.kerbWear(g, f, it); f.ty = 0; }

/** ?nodetail (testing only): the detail pass is left out, to measure the town with and without it on one server. */
export const DETAIL_OFF = (() => { try { return new URLSearchParams(globalThis.location?.search || '').has('nodetail'); } catch { return false; } })();

export const PROP = {
  ...SK.kitProps('qd', ['pole', 'tankStand', 'puddle', 'scrap', 'perch', 'bikeLean']),
  qdKerbWear: { draw: footpathWear, obstacles: () => [] },
  qdBroom: { draw: broom, obstacles: (it) => [SK.circ(it, 0.15, 0, 0.12)] },
  qdBasil: { draw: basilPots, obstacles: (it) => [SK.obBox(it, 0.65, 0.32)] },
  qdSill: { draw: stiltSills, cut: true, obstacles: () => [] },
  qdUrn: { draw: teaUrn, obstacles: (it) => [SK.obBox(it, 0.95, 0.5, 0.15, 0.03)] },
  qdBoat: { draw: paperBoat, obstacles: () => [] },
  qdCostume: { draw: costumeRail, obstacles: (it) => [SK.obBox(it, 2.5, 0.5, 0.1, 0)] },
  qdDryShelf: { draw: dryShelf, obstacles: (it) => [SK.obBox(it, 2.4, 0.5), SK.circ(it, 0.25, 1.55, 0.15)] },
  qdHop: { draw: hopscotch, obstacles: () => [] },
  qdKite: { draw: yardKite, obstacles: () => [] },
  qdStar: { draw: goldStar, obstacles: () => [] },
};

// ---------------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------------
/** Day-script marks out on the Quarter's streets (outside STORY_CLEAR), kept 2 m clear too: Day 3's walk to the kiln
 * (day3.js legs) and its border sign. */
const DAY_SPOTS = [[-4.0, 89.0], [33.4, 89.3], [33.6, 116.6], [44.9, 116.9], [0.6, 159.4], [0.6, 158.2]].map(([x, z]) => ({ x, z }));
/** Called once at the very end of quarter.js: q = { ITEMS, add, place, FP, PROP, STORY_CLEAR, STREETS_Z, STREETS_X,
 * AVE_X, ROAD_HALF, PEOPLE, DESKS }. Adds the detail items and registers their kinds into the Quarter's PROP. */
export function detail(q) {
  if (DETAIL_OFF) return;
  const { ITEMS, add, FP, STORY_CLEAR, STREETS_Z, STREETS_X, AVE_X, ROAD_HALF } = q;
  Object.assign(q.PROP, PROP);
  // 2 m clear of the townsfolk's spots and the Bookmark Desks, on top of the Quarter's own clear-check
  const SPOTS = [...(q.PEOPLE || []).flatMap((p) => [p, p.job?.spot].filter(Boolean)), ...(q.DESKS || []), ...DAY_SPOTS];
  const spotOK = (x, z, hw = 0, hd = 0) => !SPOTS.some((p) => Math.hypot(p.x - x, p.z - z) < 2 + Math.max(hw, hd));
  // a solid thing only where its 20 m cell of the chunk grid (stream.js: x0 -120, z0 -80) already has a solid mesh:
  // in a cell of nothing but trees (instanced) and ground decals it would add a mesh, two draw calls with its ink
  const cellOf = (x, z) => Math.floor((x + 120) / 20) + ',' + Math.floor((z + 80) / 20);
  const GROUND_ONLY = new Set(['qdPuddle', 'qdScrap', 'qdKerbWear', 'qdHop', 'qdStar']);
  // (kinds that always draw solids: a cell holding one of them has its mesh; a stoop may draw only slippers)
  const SOLID = new Set(['house', 'school', 'snack', 'potter', 'stage', 'lamp', 'bench', 'fence', 'hedge', 'laundry', 'jars', 'bikes', 'woodpile',
    'pencil', 'eraser', 'clip', 'well', 'teaSet', 'stall', 'noticeBoard', 'swing', 'seesaw', 'slide', 'pots', 'bookSign', 'borderSign',
    'qBamboo', 'qBanana', 'qPots', 'qPump', 'qDrum', 'qHammock', 'qWashTub', 'qBikeShop', 'qTeaStall', 'qChilli']);
  const SOLID_CELLS = new Set(ITEMS.filter((it) => SOLID.has(it.k)).map((it) => cellOf(it.x, it.z)));
  const place = (o, hw, hd, m) => ((GROUND_ONLY.has(o.k) || SOLID_CELLS.has(cellOf(o.x, o.z))) && spotOK(o.x, o.z, hw, hd) ? q.place(o, hw, hd, m) : null);
  const r = rng(16116);
  const inRect = (x, z, [a, b, c, d], m = 0) => x > a - m && x < c + m && z > b - m && z < d + m;
  const hitsFP = (b, m) => FP.some((f) => !(b[2] + m < f[0] || b[0] - m > f[2] || b[3] + m < f[1] || b[1] - m > f[3]));
  const doorOf = (h) => { const rr = rng(h.seed); rr(); rr(); return (rr() - 0.5) * (h.w - 2.4); };
  const houses = ITEMS.filter((it) => it.k === 'house');
  const trees = ITEMS.filter((it) => it.k === 'padauk' || it.k === 'rain');
  const lamps = ITEMS.filter((it) => it.k === 'lamp');

  // ---- Q1 power poles on the north kerb (the lamp line), about one per 12.5 m, in the gaps between the houses
  // where it can (else before a shop, or a cottage well clear of its door; never before a stilt house's veranda)
  let poles = 0;
  // (on the first street only, the one the bridge comes down to: a line on every street cost too many triangles)
  for (const zs of [STREETS_Z[0]]) {
    const zp = zs - ROAD_HALF - 0.6;
    const front = houses.filter((h) => Math.abs(h.z + h.d / 2 - (zs - ROAD_HALF - 1.5)) < 0.05);
    const ok = (x, strict) => {
      if (STREETS_X.some((xs) => Math.abs(x - xs) < 2.6)) return false;
      if (STORY_CLEAR.some((c) => inRect(x, zp, c, 0.3))) return false;
      if (trees.some((t) => Math.hypot(t.x - x, t.z - zp) < 1.25 * (t.s || 1) + 0.3)) return false;
      if (lamps.some((l) => Math.hypot(l.x - x, l.z - zp) < 0.8)) return false;
      for (const h of front) {
        if (Math.abs(x - h.x) > h.w / 2 + 0.25) continue;
        if (strict || h.style === 'stilt') return false;
        if (h.style === 'cottage' && Math.abs(x - (h.x + doorOf(h))) < 1.3) return false;
      }
      return spotOK(x, zp) && !hitsFP([x - 0.13, zp - 0.13, x + 0.13, zp + 0.13], 0.12);
    };
    const line = [];
    for (let x = STREETS_X[0] + 3.4; x < STREETS_X.at(-1) - 2.6; x += 12.5) {
      let got = null;
      for (const strict of [true, false]) {
        for (let o = 0; o <= 3.2 && got == null; o += 0.4) for (const s of o ? [1, -1] : [1]) if (got == null && ok(x + s * o, strict)) got = x + s * o;
        if (got != null) break;
      }
      if (got != null && (!line.length || got - line.at(-1) > 6)) line.push(got);
    }
    line.forEach((x, i) => {
      const next = line[i + 1], prev = line[i - 1];
      const span = next != null && next - x <= 14.2 ? next - x : 0;
      if (!span && !(prev != null && x - prev <= 14.2)) return; // a pole alone, with no wire to anyone: left out
      if (poles >= 40) return;
      FP.push([x - 0.13, zp - 0.13, x + 0.13, zp + 0.13]);
      add({ k: 'qdPole', x, z: zp, ry: 0, span, seed: 300 + poles, tx: poles % 4 === 1, birds: span && poles % 4 === 1 ? 2 : 0 });
      poles++;
    });
  }

  // ---- Q2 house fronts, on the side away from the door (cottages and shops: a stilt house's front is its veranda),
  // and Q3 flower boxes under a stilt house's windows (every other one)
  let fronts = 0; // (three at most: the polish pass's stoops and bicycles already dress most fronts)
  for (const h of houses) {
    const front = h.z + h.d / 2;
    if (h.style === 'stilt') continue; // (window boxes, Q3, left out for the triangle budget: the cottages have their own)
    const pick = r();
    if (pick > 0.42 || fronts >= 3) continue;
    const doorX = doorOf(h), side = doorX > 0 ? -1 : 1, lx = side * (h.w / 2 - 0.62);
    if (h.style === 'shop' && side > 0) continue; // (a shop's potted plant stands at its east end)
    if (Math.abs(lx - doorX) < 0.9) continue;
    const x = h.x + lx, z = front + 0.3;
    let got = null;
    fronts++;
    if (pick < 0.12) got = place({ k: 'qdBikeLean', x, z, ry: 0, seed: h.seed % 97 }, 0.66, 0.2, 0.05);
    else if (pick < 0.31) got = place({ k: 'qdBasil', x, z, ry: 0, seed: h.seed % 89 }, 0.34, 0.18, 0.05);
    else got = place({ k: 'qdBroom', x, z: z - 0.05, ry: 0 }, 0.18, 0.18, 0.05);
    // the front is taken (the neighbours' slippers and stools are there): a bicycle or a broom on the side wall instead
    if (!got) {
      const sx = h.x + side * (h.w / 2 + 0.3), sz = front - 1.0;
      if (pick < 0.12) place({ k: 'qdBikeLean', x: sx, z: sz, ry: side * PI / 2, seed: h.seed % 97 }, 0.2, 0.66, 0.05);
      else place({ k: 'qdBroom', x: h.x + side * (h.w / 2 + 0.14), z: sz, ry: side * PI / 2 }, 0.2, 0.2, 0.05);
    }
  }

  // ---- Q5 wear on the avenue's footpaths (decals: walked over)
  const AVE_SPANS = [[64.5, 87.5], [92.5, 115.5]]; // (the two blocks south of the bridge, where everyone walks)
  for (const side of [-1, 1]) for (const [z0, z1] of AVE_SPANS) {
    for (let z = z0 + 3.2 + (side > 0 ? 2.5 : 0); z < z1 - 3; z += 9) add({ k: 'qdKerbWear', x: AVE_X + side * 2.25, z, ry: PI / 2, len: 6, seed: Math.round(z * 7 + side) });
  }

  // ---- Q6 a water tank on its stand in a back lot (deep in the yard)
  STREETS_Z.slice(0, -1).forEach((zs, si) => {
    for (let k = 0; k < STREETS_X.length - 1; k++) {
      if ((k + si) % 4 || si !== 0) continue;
      const xa = STREETS_X[k] + 4, xb = STREETS_X[k + 1] - 4;
      for (let n = 0; n < 8; n++) if (place({ k: 'qdTankStand', x: xa + r() * (xb - xa), z: zs + 15.6 + r() * 1.2, ry: 0, seed: 40 + k + si * 5 }, 0.75, 0.75, 0.3)) break;
    }
  });

  // ---- the dressed story corners (inside STORY_CLEAR: laid by hand, 2 m clear of every day-script spot there)
  // Q7 by the school: free drinking water and two bicycles, at the playground's east edge, facing the avenue
  add({ k: 'jars', x: 0.9, z: 96.6, ry: PI / 2 });
  add({ k: 'bikes', x: 0.5, z: 99.0, ry: PI / 2 });
  add({ k: 'bikes', x: 1.15, z: 99.4, ry: PI / 2 });
  // Q8 the snack shop's tea corner: the urn on its stove, steaming
  add({ k: 'qdUrn', x: 12.8, z: 67.7, ry: 0.2 });
  // Q11 behind the stage: the costume rail
  add({ k: 'qdCostume', x: -9.4, z: 133.3, ry: 0 });
  // Q12 the potter's drying shelf at the south edge of his yard
  add({ k: 'qdDryShelf', x: 47.0, z: 128.3, ry: 0 });
  // Q13 the hopscotch at the back of the playground
  add({ k: 'qdHop', x: -11.5, z: 102.2, ry: 0 });
  for (const it of ITEMS.slice(-7)) FP.push([it.x - 1.3, it.z - 0.6, it.x + 1.3, it.z + 0.6]);

  // ---- Q9 puddles in the yards south of the second and third streets; a paper boat by the first
  let boat = false;
  for (const zs of [90, 118]) {
    for (let n = 0, made = 0; n < 12 && made < 2; n++) {
      const x = STREETS_X[0] + 6 + r() * (STREETS_X.at(-1) - STREETS_X[0] - 12), z = zs + 5.5 + r() * 5;
      const it = place({ k: 'qdPuddle', x, z, ry: (r() - 0.5) * 0.6, w: 1.5 + r() * 0.8, d: 0.9 + r() * 0.4, seed: 70 + n }, 1.1, 0.7, 0.25);
      if (!it) continue;
      made++;
      if (!boat) { boat = true; add({ k: 'qdBoat', x: x + 0.3, z: z + 0.1, ry: 0.5 }); }
    }
  }

  // ---- Q10 paper litter in the yards (one per block), pencil shavings by the big pencils
  const kinds = ['ruled', 'ball', 'ruled', 'tally'];
  STREETS_Z.slice(0, -1).forEach((zs, si) => {
    for (let k = 0; k < STREETS_X.length - 1; k++) {
      if ((k + si) % 2 || k === 0) continue;
      const xa = STREETS_X[k] + 3, xb = STREETS_X[k + 1] - 3;
      for (let n = 0; n < 4; n++) if (place({ k: 'qdScrap', x: xa + r() * (xb - xa), z: zs + 4.5 + r() * 9, ry: r() * 3, kind: kinds[(k + si) % 4], seed: 90 + k + si * 7 }, 0.3, 0.3, 0.1)) break;
    }
  });
  let shav = 0;
  for (const p of ITEMS.filter((it) => it.k === 'pencil')) {
    if (shav >= 6) break;
    const L = (p.len || 3.2) / 2 + 0.55, c = Math.cos(p.ry || 0), s = Math.sin(p.ry || 0);
    if (place({ k: 'qdScrap', x: p.x + L * c, z: p.z - L * s + 0.45, ry: r() * 3, kind: 'shaving', seed: 120 + shav }, 0.25, 0.2, 0.02)) shav++;
  }

  // ---- Q14 a dog asleep at some corners (on the paper, outside the kerb), cats on some fence posts
  let dogs = 0;
  STREETS_Z.forEach((zs, si) => STREETS_X.forEach((xs, k) => {
    if ((k + si) % 4 || dogs >= 1) return;
    // (the north-east corner, off both footpaths; else just inside the south-east yard's fence corner)
    if (place({ k: 'qdPerch', x: xs + 2.9, z: zs - 2.9, ry: 0.4, kind: 'dog', seed: 7 + k }, 0.45, 0.3, 0.05)
      || place({ k: 'qdPerch', x: xs + 3.0, z: zs + 3.0, ry: -0.3, kind: 'dog', seed: 7 + k }, 0.45, 0.3, 0.05)) dogs++;
  }));
  let cats = 0;
  ITEMS.filter((it) => it.k === 'fence' && !it.ry).forEach((fe, i) => {
    if (i % 4 !== 1 || cats >= 2) return;
    const x = fe.x + (i % 8 === 1 ? -1 : 1) * fe.len / 2;
    if (STORY_CLEAR.some((c) => inRect(x, fe.z, c, 1))) return;
    add({ k: 'qdPerch', x, z: fe.z + 0.04, ry: (r() - 0.5) * 0.8, kind: 'cat', y: 0.9, seed: 30 + i });
    cats++;
  });

  // ---- Q15 kites tied up in two yards (round (35, 62) and (-27, 118))
  for (const [cx, cz, seed] of [[38, 72.5, 3], [-23, 129, 8]]) {
    for (let n = 0; n < 10; n++) if (place({ k: 'qdKite', x: cx + (r() - 0.5) * 8, z: cz + (r() - 0.5) * 3, ry: (r() - 0.5) * 0.6, seed }, 1.0, 0.5, 0.2)) break;
  }

  // ---- Q16 gold stars fallen on the landing green, either side of the avenue
  add({ k: 'qdStar', x: -3.1, z: 54.7, seed: 0.3 });
  add({ k: 'qdStar', x: 11.6, z: 55.6, seed: 1.1 });
  add({ k: 'qdStar', x: -5.4, z: 57.4, seed: 0.7 });
}
