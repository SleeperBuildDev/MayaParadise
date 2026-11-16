// The envelope road's detail pass (art plan 2026-11-16, section 5): the road down from the Quarter to the Market was
// dense with homes and yards but plain at its own edges. Laid LAST (called once at the end of market.js), each thing
// through this file's clear-check: off the road (2.6 m from its middle line), clear of every item's keep-out, 2 m from
// the doors, desks, the day scripts' spots and the townsfolk. Everything merges into the chunk meshes (no canvas, no
// material, no draw call, nothing per frame); one steam point (the fritter cart). Nothing points the way; no text.
//
//   E1  power poles along the east verge, wires to the next pole (the line that runs on to the Market), mynas
//   E2  free drinking water on the west verge by the bend (ch 6: give without being asked)
//   E3  envelope milestones: a small stamped envelope in stone with an airmail band (no words, no arrows)
//   E4  yard fronts beside one home in three: slippers, a pot of herbs, a bucket; or a bicycle on the side wall
//   E5  puddles in the yards
//   E6  fallen leaves under the road's trees
//   E7  a fritter cart with two stools on the verge by the bend, its pan steaming
//   E8  a cat on one lime-washed home's ridge, a crow on another's (drawn with the home's own anchor: they fade with it)
//   E9  a vegetable plot on a bare back lot: a bamboo trellis of gourd vines, a watering can
//   E10 two torn stamps lying in the yards
// Imports only kit.js / toon.js / voxel.js, the street kit and market-life.js (its fritter cart).
import { rng } from '../kit.js';
import * as SK from '../art/street-kit.js';
import { PROP as LIFE } from './market-life.js';

const PI = Math.PI;
const C = {
  stone: '#E9E1CF', stoneD: '#CFC5AE', red: '#C8323C', blue: '#2F5DB3', cream: '#F6EEDB', ink: '#2A2118', woodD: '#7A5434',
  wood: '#B58A5A', bamboo: '#D8BE7E', bambooD: '#B8964E', leaf: '#6FA04E', leafD: '#4F7F43', gourd: '#9DB66A', gourdL: '#C9D98A',
  flower: '#F2C14E', terra: '#B5643C', terraL: '#CB7E4E', earth: '#E3D2B0', earthD: '#D6C29C', teal: '#4E8C86', tin: '#B3B0A6',
  shadow: '#E3D8BE', bucket: '#2F5DB3', pink: '#E8A0A8',
};

// ---------------------------------------------------------------------------------
// The new kinds
// ---------------------------------------------------------------------------------
/** E3: an envelope milestone: a stone base, a small cream envelope standing on it (its flap as two sloping slabs),
 * a red-and-blue airmail band round its edge and a round postmark. */
function milestone(g, f) {
  g.box(0, 0.08, 0, 0.62, 0.16, 0.3, C.stoneD);
  g.box(0, 0.45, 0, 0.56, 0.58, 0.18, C.stone);
  for (const sx of [-1, 1]) f.boxR(sx * 0.14, 0.62, 0.095, 0.34, 0.04, 0.01, C.stoneD, 0, 0, sx * -0.5); // the flap's fold (no ink)
  for (let k = 0; k < 6; k++) f.box(-0.25 + k * 0.1, 0.18, 0.093, 0.06, 0.035, 0.008, k % 2 ? C.blue : C.red); // airmail band
  f.box(0.16, 0.36, 0.094, 0.14, 0.14, 0.006, C.blue); // the stamp
  f.box(0.16, 0.36, 0.098, 0.1, 0.1, 0.004, C.cream);
  f.flatR(0, 0.06, 0.8, 0.5, 0.0052, C.shadow);
}
/** E4: what a home leaves by its front corner: a pair of slippers, a pot of herbs, a bucket with a dipper. */
function yardFront(g, f, it) {
  const r = rng(it.seed || 3), sc = [C.red, C.blue, C.ink, C.teal][Math.floor(r() * 4)];
  for (const sx of [-0.08, 0.08]) f.box(-0.3 + sx, 0.015, 0.2, 0.1, 0.03, 0.24, sc);
  g.box(0.05, 0.14, -0.1, 0.26, 0.28, 0.26, r() < 0.5 ? C.terra : C.terraL);
  g.box(0.05, 0.36, -0.1, 0.3, 0.18, 0.3, C.leafD);
  if (r() < 0.6) { g.box(0.42, 0.13, 0.12, 0.26, 0.26, 0.26, C.bucket); g.box(0.42, 0.3, 0.12, 0.04, 0.1, 0.24, C.ink); }
  f.flatR(0.05, 0.05, 1.1, 0.6, 0.0052, C.shadow);
}
/** E7: the fritter cart (market-life.js) with two tiny stools; its pan steams. */
function fritterCart(g, f, it, ctx) {
  LIFE.foodCart.draw(g, f, { ...it, kind: 'fritter' }, ctx);
  for (const [x, z, c] of [[-0.6, 0.95, C.red], [0.35, 1.05, C.blue]]) { g.box(x, 0.12, z, 0.26, 0.04, 0.26, c); g.box(x, 0.05, z, 0.2, 0.1, 0.2, C.woodD); }
  // steam over the pan (world space)
  const lx = -0.2, lz = 0;
  ctx.smoke.push(g.tx + lx * g.tc + lz * g.ts, 1.55, g.tz - lx * g.ts + lz * g.tc);
}
/** E8: a cat or a crow on a lime-washed home's ridge, drawn in the home's own frame (same anchor: it fades with it). */
function ridgePerch(g, f, it) {
  SK.perch(g, f, { kind: it.kind, y: it.y, seed: it.seed });
}
const ridgeAt = (g, it, fn) => { const tx = g.tx, tz = g.tz; g.at(tx + it.dx * g.tc, tz - it.dx * g.ts, g.ry); fn(); g.at(tx, tz, g.ry); };
/** E9: a vegetable plot: dug beds, a bamboo trellis with gourd vines and flowers, a hanging gourd, a watering can. */
function vegPlot(g, f) {
  f.flatR(0, 0, 3.6, 1.8, 0.0048, C.earth);
  for (const z of [-0.45, 0.45]) f.flatR(0, z, 3.2, 0.5, 0.0054, C.earthD);
  for (let k = 0; k < 7; k++) for (const z of [-0.45, 0.45]) f.box(-1.4 + k * 0.46, 0.08, z, 0.22, 0.16, 0.2, k % 2 ? C.leaf : C.leafD);
  // the trellis along the back
  for (let k = 0; k < 4; k++) g.box(-1.5 + k * 1.0, 0.75, -0.95, 0.06, 1.5, 0.06, C.bambooD);
  for (const y of [0.8, 1.45]) g.box(0, y, -0.95, 3.1, 0.05, 0.05, C.bamboo);
  for (let k = 0; k < 6; k++) g.box(-1.3 + k * 0.52, 0.95 + (k % 2) * 0.35, -0.92, 0.34, 0.3, 0.08, k % 2 ? C.gourd : C.leaf);
  for (const x of [-0.9, 0.7]) g.box(x, 1.25, -0.88, 0.07, 0.07, 0.04, C.flower);
  g.box(0.2, 0.62, -0.88, 0.14, 0.3, 0.14, C.gourdL); // a hanging gourd
  g.box(1.75, 0.13, 0.75, 0.26, 0.24, 0.18, C.teal); // the watering can
  g.boxR(1.95, 0.2, 0.75, 0.22, 0.04, 0.04, C.teal, 0, 0, 0.6);
}

/** ?nodetail (testing only): the detail pass is left out, to measure the town with and without it on one server. */
export const DETAIL_OFF = (() => { try { return new URLSearchParams(globalThis.location?.search || '').has('nodetail'); } catch { return false; } })();

export const PROP = {
  ...SK.kitProps('ev', ['pole', 'puddle', 'leaves', 'scrap', 'jarStand', 'bikeLean']),
  evMilestone: { draw: milestone, obstacles: (it) => [SK.obBox(it, 0.62, 0.3)] },
  evYard: { draw: yardFront, obstacles: (it) => [SK.circ(it, 0.32, 0.15, 0)] },
  evFritter: { draw: fritterCart, obstacles: (it) => [SK.obBox(it, 1.6, 0.85), SK.circ(it, 0.16, -0.6, 0.95), SK.circ(it, 0.16, 0.35, 1.05)] },
  evRidge: { draw: (g, f, it) => ridgeAt(g, it, () => ridgePerch(g, f, it)), cut: true, obstacles: () => [] },
  evVeg: { draw: vegPlot, obstacles: (it) => [SK.obBox(it, 3.4, 0.3, 0, -0.95), SK.circ(it, 0.2, 1.8, 0.75)] },
};

// ---------------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------------
const RECT = [-26, 160, 34, 258];
// keep-outs of the build.js kinds (district kinds bring their own obstacles())
const R = { lamp: 0.35, padauk: 0.6, rain: 0.65, bench: 0.9, flowers: 0.5, hens: 1.0, stamp: 0.8, seal: 0.7, parcel: 0.6, jars: 0.8, bikes: 0.7, woodpile: 0.8, well: 0.8 };
const SKIP = new Set(['folk', 'tufts', 'pageCrease']);

/** Called once at the end of market.js: m = { ITEMS, add, defs, keep, PROP, ART, ROAD_EDGES }. */
export function detail(m) {
  if (DETAIL_OFF) return;
  const { ITEMS, add, defs, keep } = m;
  Object.assign(m.PROP, PROP);
  const r = rng(25816);
  const route = m.ROAD_EDGES.find((e) => e.id === 'route1').pts;
  const inRect = (x, z, pad = 0) => x > RECT[0] + pad && x < RECT[2] - pad && z > RECT[1] + pad && z < RECT[3] - pad;
  // the road's middle line: distance, nearest point and its direction
  const near = (x, z) => {
    let best = { d: 1e9 };
    for (let i = 0; i + 1 < route.length; i++) {
      const [ax, az] = route[i], [bx, bz] = route[i + 1], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2)), px = ax + dx * t, pz = az + dz * t, d = Math.hypot(x - px, z - pz);
      if (d < best.d) best = { d, px, pz, tx: dx / Math.sqrt(L2), tz: dz / Math.sqrt(L2) };
    }
    return best;
  };
  // every keep-out in and round the road, as boxes [x0, z0, x1, z1]
  const BOX = [], TREES = [], LAMPS = [];
  const addOb = (o) => BOX.push(o.type === 'circle' ? [o.x - o.r, o.z - o.r, o.x + o.r, o.z + o.r] : [o.minX, o.minZ, o.maxX, o.maxZ]);
  for (const it of ITEMS) {
    if (SKIP.has(it.k) || !inRect(it.x, it.z, -6)) continue;
    if (it.k === 'padauk' || it.k === 'rain') TREES.push(it);
    if (it.k === 'lamp') LAMPS.push(it);
    const d = defs[it.k];
    let obs = d?.obstacles ? d.obstacles(it) : null;
    if (!obs || !obs.length) {
      if (it.w && it.d) obs = [SK.obBox(it, it.w, it.d)];
      else if (it.len) obs = [SK.obBox(it, it.len, 0.3)];
      else obs = [SK.circ(it, R[it.k] ?? 0.6)];
    }
    obs.forEach(addOb);
  }
  // (and Day 3's stop at the torn edge, day3.js pageEnd)
  const KEEP = [...keep, { x: 7, z: 250.5 }, { x: 7, z: 246 }].filter((p) => Number.isFinite(p.x) && inRect(p.x, p.z, -4));
  /** Is the box (centre x, z; half sizes hw, hd) clear: on the paper, 2.6 m off the road's middle, of every keep-out
   * (margin m) and 2 m from every kept spot? */
  const clear = (x, z, hw, hd, m = 0.3, roadGap = 2.6) => {
    if (!inRect(x - hw, z - hd, 0.5) || !inRect(x + hw, z + hd, 0.5)) return false;
    for (const [cx, cz] of [[x - hw, z - hd], [x + hw, z - hd], [x - hw, z + hd], [x + hw, z + hd], [x, z]]) if (near(cx, cz).d < roadGap) return false;
    if (BOX.some((b) => !(x + hw + m < b[0] || x - hw - m > b[2] || z + hd + m < b[1] || z - hd - m > b[3]))) return false;
    if (KEEP.some((p) => Math.hypot(p.x - x, p.z - z) < 2 + Math.max(hw, hd))) return false;
    return true;
  };
  // a solid thing only where its 20 m cell (stream.js grid: x0 -120, z0 -80) already has a solid mesh (else it adds one)
  const cellOf = (x, z) => Math.floor((x + 120) / 20) + ',' + Math.floor((z + 80) / 20);
  const GROUND_ONLY = new Set(['evPuddle', 'evScrap', 'evLeaves']);
  // (the homes and buildings always draw solids, and lamps, benches and fences: a cell holding one has its mesh)
  const SOLID_CELLS = new Set(ITEMS.filter((it) => m.ART[it.k] || it.k === 'lamp' || it.k === 'bench' || it.k === 'fence').map((it) => cellOf(it.x, it.z)));
  const put = (o, hw, hd, m) => { if (!GROUND_ONLY.has(o.k) && !SOLID_CELLS.has(cellOf(o.x, o.z))) return null; if (!clear(o.x, o.z, hw, hd, m)) return null; BOX.push([o.x - hw, o.z - hd, o.x + hw, o.z + hd]); return add(o); };
  // a point beside the road: s metres along it (from the Quarter), `off` metres to its east (+) or west (-)
  const along = [];
  for (let i = 0; i + 1 < route.length; i++) {
    const [ax, az] = route[i], [bx, bz] = route[i + 1], L = Math.hypot(bx - ax, bz - az);
    for (let t = 0; t < L; t += 0.5) along.push([ax + ((bx - ax) * t) / L, az + ((bz - az) * t) / L, (bx - ax) / L, (bz - az) / L]);
  }
  const beside = (k, off) => { const [x, z, tx, tz] = along[Math.max(0, Math.min(along.length - 1, k))]; return [x + tz * off, z - tx * off, Math.atan2(tx, tz)]; };
  // (the road runs south: its east side is +x when it runs straight down, so `off` > 0 is east: x + tz * off)

  // ---- E1 power poles on the east verge: about one per 10-13 m where a gap allows, wires on to the next
  const poles = [];
  for (let k = 6; k < along.length - 6;) {
    let got = -1, off = 0;
    for (let j = k; j < Math.min(along.length - 6, k + 14) && got < 0; j++) for (const o of [3.25, 3.65, 4.1]) {
      const [x, z] = beside(j, o);
      if (z < 163 || z > 254) continue;
      if (TREES.some((t) => Math.hypot(t.x - x, t.z - z) < 1.3 * (t.s || 1) + 0.35)) continue;
      if (LAMPS.some((l) => Math.hypot(l.x - x, l.z - z) < 0.9)) continue;
      if (!clear(x, z, 0.14, 0.14, 0.4, 2.7)) continue;
      got = j; off = o; break;
    }
    if (got < 0) { k += 4; continue; }
    const [x, z] = beside(got, off);
    if (poles.length && Math.hypot(x - poles.at(-1).x, z - poles.at(-1).z) > 14.2) poles.push(null); // a break in the line
    poles.push({ x, z });
    BOX.push([x - 0.15, z - 0.15, x + 0.15, z + 0.15]);
    k = got + 20 + Math.floor(r() * 5); // 10-12 m on
  }
  poles.forEach((p, i) => {
    if (!p) return;
    const n = poles[i + 1], prev = poles[i - 1];
    if (!n && !prev) return; // a pole alone
    const span = n ? Math.hypot(n.x - p.x, n.z - p.z) : 0;
    const ry = n ? Math.atan2(-(n.z - p.z), n.x - p.x) : prev ? Math.atan2(-(p.z - prev.z), p.x - prev.x) : 0;
    add({ k: 'evPole', x: p.x, z: p.z, ry, span, seed: 500 + i, tx: i % 4 === 2, birds: n && i % 3 === 1 ? 2 + (i % 2) : 0 });
  });

  // ---- E2 drinking water on the west verge, twice (round z 190 and 232), facing the road
  for (const z0 of [232]) { // (one stand, by the tea table at the bend: the triangle budget)
    const k0 = along.findIndex((a) => a[1] >= z0);
    let done = false;
    for (let o = 0; o < 48 && !done; o++) for (const off of [-3.5, -4.2, -5.0]) {
      const k = k0 + (o % 2 ? -1 : 1) * Math.ceil(o / 2) * 2, [x, z, h] = beside(k, off);
      if (put({ k: 'evJarStand', x, z, ry: h + PI / 2, n: 2 }, 0.72, 0.72, 0.25)) { done = true; break; }
    }
  }

  // ---- E3 envelope milestones every 25 m, on alternate sides, facing the road
  for (let s = 20, side = 1; s < along.length * 0.5 - 4; s += 40, side = -side) {
    let done = false;
    for (let o = 0; o < 12 && !done; o++) for (const sd of [side, -side]) for (const off of [3.05, 3.6, 4.2]) {
      if (done) break;
      const k = Math.round((s + (o % 2 ? -1 : 1) * Math.ceil(o / 2)) * 2), [x, z, h] = beside(k, sd * off);
      if (put({ k: 'evMilestone', x, z, ry: h + (sd > 0 ? -PI / 2 : PI / 2) }, 0.35, 0.35, 0.25)) done = true;
    }
  }

  // ---- E4 yard fronts beside one home in three (by its front corner, outside its walls), or a bicycle on its side wall
  const homes = ITEMS.filter((it) => /^(mkCot|mkLow|mkHut)$/.test(it.k) && inRect(it.x, it.z) && it.w && it.d);
  let yards = 0;
  homes.forEach((h, i) => {
    if (i % 3 || yards >= 4) return;
    const c = Math.cos(h.ry || 0), s = Math.sin(h.ry || 0), side = i % 2 ? 1 : -1;
    const bike = i % 12 === 3, lx = side * (h.w / 2 + (bike ? 0.34 : 0.62)), lz = h.d / 2 - (bike ? 0.75 : 0.6);
    const x = h.x + lx * c + lz * s, z = h.z - lx * s + lz * c;
    // (half sizes in the world: a bike runs 1.3 m along the home's depth, 0.35 m out from its wall)
    const turned = Math.abs(s) > 0.7, bw = turned ? 0.65 : 0.18, bd = turned ? 0.18 : 0.65;
    if (bike ? put({ k: 'evBikeLean', x, z, ry: (h.ry || 0) + side * PI / 2, seed: i }, bw, bd, 0.03) : put({ k: 'evYard', x, z, ry: h.ry || 0, seed: i }, 0.42, 0.42, 0.03)) yards++;
  });

  // ---- E5 puddles in the yards (three), E10 two torn stamps
  for (let n = 0, made = 0; n < 40 && made < 3; n++) {
    const x = RECT[0] + 4 + r() * (RECT[2] - RECT[0] - 8), z = RECT[1] + 6 + r() * (RECT[3] - RECT[1] - 12);
    if (put({ k: 'evPuddle', x, z, ry: (r() - 0.5) * 0.6, w: 1.4 + r() * 0.8, d: 0.9 + r() * 0.4, seed: 30 + n }, 1.1, 0.75, 0.15)) made++;
  }
  for (let n = 0, made = 0; n < 30 && made < 2; n++) {
    const x = RECT[0] + 4 + r() * (RECT[2] - RECT[0] - 8), z = RECT[1] + 6 + r() * (RECT[3] - RECT[1] - 12);
    if (put({ k: 'evScrap', x, z, ry: r() * 3, kind: 'stamp', seed: 60 + n }, 0.25, 0.25, 0.05)) made++;
  }

  // ---- E6 fallen leaves under the road's trees (decals; never on the road)
  TREES.forEach((t, i) => {
    if (!inRect(t.x, t.z) || near(t.x, t.z).d < 3.4) return;
    add({ k: 'evLeaves', x: t.x + 0.3, z: t.z - 0.1, ry: i * 0.7, w: 2.2 * (t.s || 1), d: 1.8 * (t.s || 1), seed: 70 + i, pal: t.k === 'padauk' ? 'padauk' : 'rain' });
  });

  // ---- E7 the fritter cart on the verge by the bend (round (19, 229)), facing the road
  for (let n = 0; n < 30; n++) {
    const x = 18.6 + (r() - 0.5) * 5, z = 229.5 + (r() - 0.5) * 6;
    if (put({ k: 'evFritter', x, z, ry: -PI / 2 }, 1.1, 1.1, 0.2)) break;
  }

  // ---- E8 a cat and a crow on two lime-washed homes' ridges (the stepped tile roof's gold ridge cap: y 4.05)
  homes.filter((h) => h.k === 'mkCot' && h.style === 'lime').slice(0, 2).forEach((h, i) => {
    add({ k: 'evRidge', x: h.x, z: h.z, ry: h.ry || 0, dx: i ? -0.7 : 0.8, y: 4.05, kind: i ? 'crow' : 'cat', seed: 11 + i });
  });

  // ---- E9 a vegetable plot on a bare back lot west of the road (round (-17, 187))
  for (let n = 0; n < 60; n++) {
    const x = -17 + (r() - 0.5) * 12, z = 187 + (r() - 0.5) * 10;
    if (put({ k: 'evVeg', x, z, ry: 0 }, 2.0, 1.1, 0.3)) break;
  }
}
