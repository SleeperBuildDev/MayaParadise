// Road network of the open-book world and the road-locked drive controller.
//
// Layout (metres, +X east, +Z south, camera looks north): a roundabout on the Welcome Plaza
// (hub), five straight spokes, and a half-ring "rim" through the five outer stops. Every road
// is a sampled, arc-length parameterised centreline; the car can only move along them.
//
//   export createNetwork()            -> net  { nodes, edges, nearest(x, z) }
//   export homeRoadData()             -> the same roads as data { nodes: [{ id, x, z }], edges: [{ id, a, b, pts, bias, group }] }
//   export createNetworkFromData(d)   -> net from data (story mode joins the open world's roads to the book's)
//   export addRoadsTo(v, net, pads)   -> adds road surfaces, gold edges, dashes and pads to a VoxelBuilder
//   export createDrive(net, places)   -> drive (see ARCHITECTURE.md: setStick, goTo, stop, teleport, update, route)
import * as THREE from '../three.js';
import { PALETTE } from '../toon.js';

export const ROAD = { width: 2.4, top: 0.14, strip: 0.18, base: -0.36 };
export const HUB = { x: 0, z: 4.5, r: 5.5 };
export const RIM_R = 13.5;
export const DRIVE = { cruise: 8, autoMax: 10, padNear: 3.5, padFar: 5, turnTime: 0.4 };

const SAMPLE = 0.25;
const CROSS = { from: 2.05, to: 3.25 }; // zebra crossings: arc length along each spoke from the plaza
const TURN_COST = 5; // metres-equivalent penalty for turning around in A*
const rad = THREE.MathUtils.degToRad;

// ---------------------------------------------------------------------------------
// Sampled edges
// ---------------------------------------------------------------------------------
function makeEdge(index, id, a, b, pts2, bias, sample = SAMPLE) {
  const curve = new THREE.CatmullRomCurve3(pts2.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  curve.arcLengthDivisions = Math.max(300, pts2.length * 60);
  const segs = Math.max(4, Math.ceil(curve.getLength() / sample));
  const pts = curve.getSpacedPoints(segs);
  const n = pts.length;
  const xs = new Float32Array(n), zs = new Float32Array(n), cum = new Float32Array(n), tx = new Float32Array(n), tz = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    xs[i] = pts[i].x;
    zs[i] = pts[i].z;
    if (i) cum[i] = cum[i - 1] + Math.hypot(xs[i] - xs[i - 1], zs[i] - zs[i - 1]);
  }
  for (let i = 0; i < n; i++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1);
    const dx = xs[i1] - xs[i0], dz = zs[i1] - zs[i0];
    const l = Math.hypot(dx, dz) || 1;
    tx[i] = dx / l;
    tz[i] = dz / l;
  }
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < n; i++) {
    minX = Math.min(minX, xs[i]); maxX = Math.max(maxX, xs[i]);
    minZ = Math.min(minZ, zs[i]); maxZ = Math.max(maxZ, zs[i]);
  }
  return { index, id, a, b, n, xs, zs, cum, tx, tz, length: cum[n - 1], bias, box: { minX, maxX, minZ, maxZ } };
}

const LOC = { i: 0, f: 0 };
function locate(e, s) {
  if (s <= 0) { LOC.i = 0; LOC.f = 0; return; }
  if (s >= e.length) { LOC.i = e.n - 2; LOC.f = 1; return; }
  let lo = 0, hi = e.n - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (e.cum[m] <= s) lo = m; else hi = m;
  }
  LOC.i = lo;
  LOC.f = (s - e.cum[lo]) / (e.cum[hi] - e.cum[lo] || 1);
}

/** World position of arc length s on edge e (y = road top). */
export function pointAt(e, s, out) {
  locate(e, s);
  const i = LOC.i, f = LOC.f;
  return out.set(e.xs[i] + (e.xs[i + 1] - e.xs[i]) * f, ROAD.top + e.bias, e.zs[i] + (e.zs[i + 1] - e.zs[i]) * f);
}

/** Unit tangent (toward b) at arc length s, written into out {x, z}. */
export function tangentAt(e, s, out) {
  locate(e, s);
  const i = LOC.i, f = LOC.f;
  const x = e.tx[i] + (e.tx[i + 1] - e.tx[i]) * f;
  const z = e.tz[i] + (e.tz[i + 1] - e.tz[i]) * f;
  const l = Math.hypot(x, z) || 1;
  out.x = x / l;
  out.z = z / l;
  return out;
}

/** Nearest point on one edge: { s, dist }. */
function nearestOnEdge(e, x, z) {
  let best = Infinity, bs = 0;
  for (let i = 0; i < e.n - 1; i++) {
    const ax = e.xs[i], az = e.zs[i], bx = e.xs[i + 1], bz = e.zs[i + 1];
    const dx = bx - ax, dz = bz - az;
    const l2 = dx * dx + dz * dz || 1e-9;
    const t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / l2));
    const px = ax + dx * t - x, pz = az + dz * t - z;
    const d2 = px * px + pz * pz;
    if (d2 < best) { best = d2; bs = e.cum[i] + (e.cum[i + 1] - e.cum[i]) * t; }
  }
  return { s: bs, dist: Math.sqrt(best) };
}

// ---------------------------------------------------------------------------------
// The network
// ---------------------------------------------------------------------------------
/** A point on a circle round the plaza hub (angle 0 = east, 90 = north). */
export const hubPoint = (deg, r = HUB.r) => [HUB.x + r * Math.cos(rad(deg)), HUB.z - r * Math.sin(rad(deg))];
/** Points along an arc round the hub, every `step` degrees or less. */
export function hubArc(r, d0, d1, step = 3) {
  const out = [];
  const n = Math.max(2, Math.ceil(Math.abs(d1 - d0) / step));
  for (let i = 0; i <= n; i++) out.push(hubPoint(d0 + ((d1 - d0) * i) / n, r));
  return out;
}

/**
 * The open book's roads as data: { nodes: [{ id, x, z }], edges: [{ id, a, b, pts: [[x, z], ...], bias, group }] }.
 * Edge end points are snapped to their nodes when the network is built.
 */
export function homeRoadData() {
  const hub = hubPoint, arc = hubArc;
  const nodes = [];
  const edges = [];
  const node = (id, [x, z]) => { nodes.push({ id, x, z }); return id; };
  const edge = (id, a, b, pts, bias, group = id) => edges.push({ id, a, b, pts, bias, group });

  // Roundabout exits (angle 0 = east, 90 = north) and rim junctions.
  const rE = node('rE', hub(0)), rNE = node('rNE', hub(45)), rN = node('rN', hub(90)), rNW = node('rNW', hub(135)), rW = node('rW', hub(180));
  const T = node('T', hub(135, RIM_R)), S = node('S', hub(90, RIM_R)), N = node('N', hub(45, RIM_R));

  // Roundabout (slightly higher so its surface wins where spokes overlap it).
  edge('ringNE', rE, rNE, arc(HUB.r, 0, 45), 0.006, 'ring');
  edge('ringN', rNE, rN, arc(HUB.r, 45, 90), 0.006, 'ring');
  edge('ringNW', rN, rNW, arc(HUB.r, 90, 135), 0.006, 'ring');
  edge('ringW', rNW, rW, arc(HUB.r, 135, 180), 0.006, 'ring');
  edge('ringS', rW, rE, arc(HUB.r, 180, 360), 0.006, 'ring');

  // West leg: plaza -> west, rounded corner, up the rim to T. East leg mirrors it.
  const corner = [[-9.5, HUB.z], [-12.0, HUB.z - 0.15], [-13.1, HUB.z - 0.9], [-13.45, HUB.z - 2.0]];
  edge('legW', rW, T, [hub(180), ...corner, ...arc(RIM_R, 168, 135)], 0.003, 'rim');
  edge('rimNW', T, S, arc(RIM_R, 135, 90), 0.003, 'rim');
  edge('rimNE', S, N, arc(RIM_R, 90, 45), 0.003, 'rim');
  edge('legE', rE, N, [hub(0), ...corner.map(([x, z]) => [-x, z]), ...arc(RIM_R, 12, 45)], 0.003, 'rim');

  // Spokes from the roundabout to the rim (8 m each).
  edge('spokeNW', rNW, T, [hub(135), hub(135, RIM_R)], 0);
  edge('spokeN', rN, S, [hub(90), hub(90, RIM_R)], 0);
  edge('spokeNE', rNE, N, [hub(45), hub(45, RIM_R)], 0);
  return { nodes, edges };
}

/** The open book's own network (the normal site). */
export function createNetwork() {
  return createNetworkFromData(homeRoadData());
}

/**
 * Builds a drivable network from road data (see homeRoadData for the format). Several data sets can
 * be joined by concatenating their nodes and edges (edges name nodes by id). Optional per edge:
 * `sample` (metres between centreline samples, default 0.25) for long straight streets.
 */
export function createNetworkFromData(data) {
  const nodes = [];
  const edges = [];
  const byId = new Map();
  for (const n of data.nodes) {
    if (byId.has(n.id)) continue;
    const nd = { id: n.id, index: nodes.length, x: n.x, z: n.z, edges: [] };
    nodes.push(nd);
    byId.set(n.id, nd);
  }
  for (const d of data.edges) {
    const a = byId.get(d.a), b = byId.get(d.b);
    if (!a || !b) throw new Error(`road ${d.id}: unknown node ${a ? d.b : d.a}`);
    const pts = d.pts ? d.pts.map((p) => [p[0], p[1]]) : [[a.x, a.z], [b.x, b.z]];
    pts[0] = [a.x, a.z];
    pts[pts.length - 1] = [b.x, b.z];
    const e = makeEdge(edges.length, d.id, a, b, pts, d.bias ?? 0, d.sample);
    e.group = d.group ?? d.id;
    if (d.style) e.style = d.style;
    a.edges.push(e);
    b.edges.push(e);
    edges.push(e);
  }
  return {
    nodes,
    edges,
    /** Nearest road point to (x, z): { edge, s, dist } (optionally limited to some edges). */
    nearest(x, z, only = null) {
      let best = null;
      for (const e of only || edges) {
        // skip roads whose bounding box is already farther than the best found (same answer, fewer tests)
        if (best) {
          const bx = Math.max(e.box.minX - x, 0, x - e.box.maxX), bz = Math.max(e.box.minZ - z, 0, z - e.box.maxZ);
          if (bx * bx + bz * bz >= best.dist * best.dist) continue;
        }
        const r = nearestOnEdge(e, x, z);
        if (!best || r.dist < best.dist) best = { edge: e, s: r.s, dist: r.dist };
      }
      return best;
    },
    /**
     * True when (x, z) lies on the paved surface of a different road than `except`
     * (roads of the same group, e.g. the roundabout arcs, count as one road).
     */
    onOtherRoad(x, z, except, margin = 0.05) {
      const lim = ROAD.width / 2 - margin;
      for (const e of edges) {
        if (e === except || (except && e.group === except.group)) continue;
        const b = e.box;
        if (x < b.minX - lim || x > b.maxX + lim || z < b.minZ - lim || z > b.maxZ + lim) continue;
        const r = nearestOnEdge(e, x, z);
        if (r.dist >= lim) continue;
        const last = e.n - 1;
        if (r.s < 0.01 && (x - e.xs[0]) * e.tx[0] + (z - e.zs[0]) * e.tz[0] < -0.05) continue;
        if (r.s > e.length - 0.01 && (x - e.xs[last]) * e.tx[last] + (z - e.zs[last]) * e.tz[last] > 0.05) continue;
        return true;
      }
      return false;
    },
  };
}

// ---------------------------------------------------------------------------------
// Road geometry (flat-shaded, added to a VoxelBuilder; no outline)
// ---------------------------------------------------------------------------------
function triList() {
  const pos = [], nor = [];
  return {
    pos, nor,
    /** Triangle with a given normal; flips winding so the face points along the normal. */
    tri(a, b, c, nx, ny, nz) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
      const flip = cx * nx + cy * ny + cz * nz < 0;
      const list = flip ? [a, c, b] : [a, b, c];
      for (const p of list) { pos.push(p[0], p[1], p[2]); nor.push(nx, ny, nz); }
    },
    quad(a, b, c, d, nx, ny, nz) { this.tri(a, b, c, nx, ny, nz); this.tri(a, c, d, nx, ny, nz); },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      return g;
    },
  };
}

/**
 * Adds every road to VoxelBuilder `v`: cream surface, gold edge strips, gold side walls,
 * a gold dashed centre line and the round gold arrival pads (pads: [{ x, z }]).
 */
export function addRoadsTo(v, net, pads = []) {
  const W = ROAD.width / 2;
  const top = triList(), strip = triList(), wall = triList();
  const P = new THREE.Vector3();
  const tan = { x: 0, z: 0 };
  for (const e of net.edges) {
    const y = ROAD.top + e.bias;
    const n = Math.max(2, Math.ceil(e.length / 0.35));
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const s = (e.length * i) / n;
      pointAt(e, s, P);
      tangentAt(e, s, tan);
      const nx = -tan.z, nz = tan.x;
      const cur = {
        x: P.x, z: P.z, nx, nz,
        cutL: net.onOtherRoad(P.x + nx * (W - 0.09), P.z + nz * (W - 0.09), e, -0.15),
        cutR: net.onOtherRoad(P.x - nx * (W - 0.09), P.z - nz * (W - 0.09), e, -0.15),
      };
      if (prev) {
        const pt = (q, off, yy) => [q.x + q.nx * off, yy, q.z + q.nz * off];
        top.quad(pt(prev, W, y), pt(prev, -W, y), pt(cur, -W, y), pt(cur, W, y), 0, 1, 0);
        const ys = y + 0.004;
        if (!prev.cutL && !cur.cutL) strip.quad(pt(prev, W, ys), pt(prev, W - ROAD.strip, ys), pt(cur, W - ROAD.strip, ys), pt(cur, W, ys), 0, 1, 0);
        if (!prev.cutR && !cur.cutR) strip.quad(pt(prev, -W, ys), pt(prev, -W + ROAD.strip, ys), pt(cur, -W + ROAD.strip, ys), pt(cur, -W, ys), 0, 1, 0);
        const mx = (prev.nx + cur.nx) / 2, mz = (prev.nz + cur.nz) / 2;
        wall.quad(pt(prev, W, ROAD.base), pt(cur, W, ROAD.base), pt(cur, W, y), pt(prev, W, y), mx, 0, mz);
        wall.quad(pt(prev, -W, ROAD.base), pt(cur, -W, ROAD.base), pt(cur, -W, y), pt(prev, -W, y), -mx, 0, -mz);
      }
      prev = cur;
    }
    // Zebra crossing on each spoke just outside the plaza (cream stripes on a parchment band, gold stop bars).
    const zebra = e.id.startsWith('spoke');
    if (zebra) {
      const sm = (CROSS.from + CROSS.to) / 2, len = CROSS.to - CROSS.from;
      pointAt(e, sm, P);
      tangentAt(e, sm, tan);
      const ang = Math.atan2(tan.x, tan.z), nx = -tan.z, nz = tan.x, inner = ROAD.width - 2 * ROAD.strip - 0.02;
      v.box(P.x, y + 0.005, P.z, inner, 0.01, len, PALETTE.parchment, ang);
      for (let k = 0; k < 5; k++) {
        const off = -0.8 + k * 0.4;
        v.box(P.x + nx * off, y + 0.011, P.z + nz * off, 0.24, 0.012, len - 0.22, PALETTE.white, ang);
      }
      for (const end of [-1, 1]) v.box(P.x + tan.x * end * (len / 2 + 0.22), y + 0.008, P.z + tan.z * end * (len / 2 + 0.22), inner, 0.016, 0.1, PALETTE.gold, ang);
    }
    // Dashed gold centre line (skipped inside junctions, under pads and across the zebra crossings).
    for (let s = 1.0; s < e.length - 0.8; s += 1.3) {
      if (zebra && s > CROSS.from - 0.65 && s < CROSS.to + 0.65) continue;
      pointAt(e, s, P);
      if (net.onOtherRoad(P.x, P.z, e, -0.1)) continue;
      if (pads.some((p) => Math.hypot(p.x - P.x, p.z - P.z) < 1.4)) continue;
      tangentAt(e, s, tan);
      v.box(P.x, y + 0.008, P.z, 0.13, 0.016, 0.62, PALETTE.gold, Math.atan2(tan.x, tan.z));
    }
    // Little gold studs along both edge strips.
    for (let s = 0.6; s < e.length - 0.3; s += 1.6) {
      pointAt(e, s, P);
      tangentAt(e, s, tan);
      for (const side of [-1, 1]) {
        const ox = P.x - tan.z * side * (W - ROAD.strip / 2), oz = P.z + tan.x * side * (W - ROAD.strip / 2);
        if (net.onOtherRoad(ox, oz, e, -0.15)) continue;
        v.box(ox, y + 0.012, oz, 0.09, 0.016, 0.09, PALETTE.white, Math.atan2(tan.x, tan.z) + Math.PI / 4);
      }
    }
  }
  v.add(top.geometry(), PALETTE.cream);
  v.add(strip.geometry(), PALETTE.gold);
  v.add(wall.geometry(), PALETTE.goldDeep);

  // Arrival pads: round gold plate, darker rim, cream four-point sparkle.
  const disc = new THREE.CylinderGeometry(1, 1, 1, 24);
  const m = new THREE.Matrix4();
  for (const p of pads) {
    const y = ROAD.top + 0.01;
    v.add(disc, PALETTE.goldDeep, m.makeScale(1.12, 0.03, 1.12).setPosition(p.x, y + 0.012, p.z));
    v.add(disc, PALETTE.gold, m.makeScale(0.98, 0.03, 0.98).setPosition(p.x, y + 0.022, p.z));
    v.box(p.x, y + 0.042, p.z, 0.16, 0.012, 1.05, PALETTE.cream);
    v.box(p.x, y + 0.042, p.z, 1.05, 0.012, 0.16, PALETTE.cream);
    v.box(p.x, y + 0.046, p.z, 0.32, 0.012, 0.32, PALETTE.white, Math.PI / 4);
  }
  disc.dispose();
}

// ---------------------------------------------------------------------------------
// A* route planning between road positions
// ---------------------------------------------------------------------------------
function pushStep(out, k, edge, s0, s1, dir) {
  if (Math.abs(s1 - s0) <= 1e-4) return k;
  const st = out.steps[k];
  st.edge = edge;
  st.s0 = s0;
  st.s1 = s1;
  st.dir = dir;
  return k + 1;
}

/** A reusable plan: a pool of step objects ({ edge, s0, s1, dir }), the used count and total length. */
export function makePlan(net) {
  const steps = [];
  for (let i = 0; i < net.nodes.length + 4; i++) steps.push({ edge: null, s0: 0, s1: 0, dir: 1 });
  return { steps, count: 0, length: 0 };
}

/**
 * A* shortest route from (fromE, fromS) moving in fromDir (+1 toward edge.b) to (goalE, goalS),
 * written into `out` (from makePlan). Allocation-free: scratch buffers live on the network.
 * Turning around costs TURN_COST metres.
 */
export function planInto(net, fromE, fromS, fromDir, goalE, goalS, out) {
  const nodes = net.nodes;
  const n = nodes.length;
  const sc = net.scratch || (net.scratch = { g: new Float64Array(n), prev: new Int32Array(n), via: new Array(n), closed: new Uint8Array(n), open: new Uint8Array(n), chain: new Array(n + 1) });
  const { g, prev, via: viaEdge, closed, open, chain } = sc;
  g.fill(Infinity);
  prev.fill(-1);
  closed.fill(0);
  open.fill(0);
  locate(goalE, goalS);
  const gx = goalE.xs[LOC.i] + (goalE.xs[LOC.i + 1] - goalE.xs[LOC.i]) * LOC.f;
  const gz = goalE.zs[LOC.i] + (goalE.zs[LOC.i + 1] - goalE.zs[LOC.i]) * LOC.f;
  const costB = fromE.length - fromS + (fromDir === 1 ? 0 : TURN_COST);
  const costA = fromS + (fromDir === -1 ? 0 : TURN_COST);
  if (costB < g[fromE.b.index]) { g[fromE.b.index] = costB; prev[fromE.b.index] = -2; open[fromE.b.index] = 1; }
  if (costA < g[fromE.a.index]) { g[fromE.a.index] = costA; prev[fromE.a.index] = -2; open[fromE.a.index] = 1; }

  let best = Infinity;
  let via = null; // null = direct along the start edge
  if (fromE === goalE) {
    const d = goalS - fromS;
    best = Math.abs(d) + ((d >= 0 ? 1 : -1) === fromDir || Math.abs(d) < 0.05 ? 0 : TURN_COST);
  }
  for (;;) {
    let u = -1, fu = Infinity;
    for (let i = 0; i < n; i++) {
      if (!open[i]) continue;
      const f = g[i] + Math.hypot(nodes[i].x - gx, nodes[i].z - gz);
      if (f < fu) { fu = f; u = i; }
    }
    if (u < 0 || fu >= best) break;
    open[u] = 0;
    closed[u] = 1;
    const nd = nodes[u];
    if (nd === goalE.a && g[u] + goalS < best) { best = g[u] + goalS; via = nd; }
    if (nd === goalE.b && g[u] + goalE.length - goalS < best) { best = g[u] + goalE.length - goalS; via = nd; }
    for (const e of nd.edges) {
      const o = e.a === nd ? e.b : e.a;
      if (closed[o.index]) continue;
      const c = g[u] + e.length;
      if (c < g[o.index]) { g[o.index] = c; prev[o.index] = u; viaEdge[o.index] = e; open[o.index] = 1; }
    }
  }

  let k = 0;
  if (!via) {
    if (fromE === goalE) k = pushStep(out, k, fromE, fromS, goalS, goalS >= fromS ? 1 : -1);
  } else {
    let m = 0;
    let cur = via.index;
    while (prev[cur] !== -2) { chain[m++] = cur; cur = prev[cur]; }
    const first = nodes[cur];
    k = pushStep(out, k, fromE, fromS, first === fromE.b ? fromE.length : 0, first === fromE.b ? 1 : -1);
    for (let j = m - 1; j >= 0; j--) {
      const e = viaEdge[chain[j]];
      const fwd = e.b === nodes[chain[j]];
      k = pushStep(out, k, e, fwd ? 0 : e.length, fwd ? e.length : 0, fwd ? 1 : -1);
    }
    const lastFwd = goalE.a === via;
    k = pushStep(out, k, goalE, lastFwd ? 0 : goalE.length, goalS, lastFwd ? 1 : -1);
  }
  if (!k) { const st = out.steps[k++]; st.edge = goalE; st.s0 = goalS; st.s1 = goalS; st.dir = fromDir; }
  out.count = k;
  let len = 0;
  for (let i = 0; i < k; i++) len += Math.abs(out.steps[i].s1 - out.steps[i].s0);
  out.length = len;
  return out;
}

/** Convenience (allocating) version: { steps: [{ edge, s0, s1, dir }], length }. */
export function planRoute(net, fromE, fromS, fromDir, goalE, goalS) {
  const p = planInto(net, fromE, fromS, fromDir, goalE, goalS, makePlan(net));
  return { steps: p.steps.slice(0, p.count).map((s) => ({ ...s })), length: p.length };
}

// ---------------------------------------------------------------------------------
// Drive controller
// ---------------------------------------------------------------------------------
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/**
 * places: [{ id, x, z, heading }] (pad positions on the roads).
 * Returns the drive controller from ARCHITECTURE.md.
 */
export function createDrive(net, places) {
  // Every representation of each pad on the network (a pad on a junction lies on 3 edges).
  const pads = places.map((p) => {
    const reps = [];
    for (const e of net.edges) {
      const r = nearestOnEdge(e, p.x, p.z);
      if (r.dist < 0.08) reps.push({ edge: e, s: r.s });
    }
    if (!reps.length) { const r = net.nearest(p.x, p.z); reps.push({ edge: r.edge, s: r.s }); }
    return { id: p.id, x: p.x, z: p.z, heading: p.heading ?? 0, reps };
  });
  const padById = new Map(pads.map((p) => [p.id, p]));

  const state = { position: new THREE.Vector3(), heading: 0, speed: 0, steer: 0, accel: 0 };
  const result = { atPad: null, arrived: null };
  const stick = { x: 0, z: 0, m: 0 }; // world-space direction (x east, z south) and magnitude
  const tan = { x: 0, z: 0 };
  const tan2 = { x: 0, z: 0 };

  let edge = net.edges[0];
  let s = 0;
  let dir = 1;
  let speed = 0;
  let lastSpeed = 0;
  let pathHeading = 0;
  let visHeading = 0;
  let lastVis = 0;
  let pivot = 0;
  let pivotFrom = 0;
  let pivotDelta = 0;
  let padId = null;
  let accelS = 0;
  let steerS = 0;
  const auto = { active: false, id: null, steps: null, count: 0, idx: 0, t: 0, replan: false };

  function headingOf(e, ss, d) {
    tangentAt(e, ss, tan);
    return Math.atan2(tan.x * d, tan.z * d);
  }
  function syncPose() {
    pointAt(edge, s, state.position);
    pathHeading = headingOf(edge, s, dir);
  }
  function startPivot(newDir, spin) {
    dir = newDir;
    pivot = DRIVE.turnTime;
    pivotFrom = visHeading;
    const target = headingOf(edge, s, dir);
    let delta = wrapAngle(target - visHeading);
    if (Math.abs(Math.abs(delta) - Math.PI) < 0.35 && spin) delta = Math.abs(delta) * spin;
    pivotDelta = delta;
    speed = 0;
  }
  /** Outgoing unit direction of edge e leaving node nd (written to tan2); returns the travel dir. */
  function outOf(e, nd) {
    if (e.a === nd) { tangentAt(e, 0, tan2); return 1; }
    tangentAt(e, e.length, tan2);
    tan2.x = -tan2.x;
    tan2.z = -tan2.z;
    return -1;
  }
  /** Picks the edge to continue on at node nd (manual driving). */
  function chooseAt(nd, from) {
    const hx = Math.sin(pathHeading), hz = Math.cos(pathHeading);
    let best = null, bestScore = -Infinity, bestDir = 1;
    for (const e of nd.edges) {
      if (e === from) continue;
      const d = outOf(e, nd);
      const straight = tan2.x * hx + tan2.z * hz;
      const score = stick.m > 0 ? tan2.x * stick.x + tan2.z * stick.z + 0.3 * straight : straight;
      if (score > bestScore) { bestScore = score; best = e; bestDir = d; }
    }
    if (!best) return false;
    edge = best;
    dir = bestDir;
    s = bestDir === 1 ? 0 : best.length;
    return true;
  }
  /** Moves `dist` metres along the road in manual mode, choosing branches at nodes. */
  function moveManual(dist) {
    let guard = 8;
    while (dist > 1e-6 && guard--) {
      const room = dir === 1 ? edge.length - s : s;
      if (dist <= room) { s += dir * dist; return; }
      dist -= room;
      const nd = dir === 1 ? edge.b : edge.a;
      s = dir === 1 ? edge.length : 0;
      pathHeading = headingOf(edge, s, dir);
      if (!chooseAt(nd, edge)) { speed = 0; return; }
    }
  }
  /** At (or very near) a node while nearly stopped: pick the best edge for the stick, any direction. */
  const pick = { score: 0, edge: null, dir: 1, s: 0 };
  function consider(e, d, ss, bonus) {
    tangentAt(e, ss, tan2);
    const score = (tan2.x * stick.x + tan2.z * stick.z) * d + bonus;
    if (score > pick.score + 1e-3) { pick.score = score; pick.edge = e; pick.dir = d; pick.s = ss; }
  }
  function chooseFromRest() {
    const nearB = edge.length - s < 0.35, nearA = s < 0.35;
    pick.score = -Infinity;
    consider(edge, dir, s, 0.2); // keep going the current way unless the stick clearly says otherwise
    consider(edge, -dir, s, 0);
    const nd = nearB ? edge.b : nearA ? edge.a : null;
    if (nd) for (const e of nd.edges) if (e !== edge) consider(e, e.a === nd ? 1 : -1, e.a === nd ? 0 : e.length, 0);
    if (pick.edge === edge && pick.dir === dir) return;
    const spin = Math.sign(Math.cos(pathHeading) * stick.x - Math.sin(pathHeading) * stick.z) || 1;
    edge = pick.edge;
    s = pick.s;
    const turn = Math.abs(wrapAngle(headingOf(edge, s, pick.dir) - visHeading));
    if (turn > 1.2) startPivot(pick.dir, spin);
    else dir = pick.dir;
  }
  function padAhead() {
    let bestD = Infinity;
    for (const p of pads) {
      for (const r of p.reps) {
        if (r.edge !== edge) continue;
        const d = (r.s - s) * dir;
        if (d > 0.02 && d < bestD) bestD = d;
      }
    }
    return bestD;
  }
  // Preallocated plans: the autopilot's, the route preview's, and a scratch candidate.
  const planAuto = makePlan(net), planView = makePlan(net), planTry = makePlan(net);
  const suffix = new Float32Array(planAuto.steps.length + 1);
  /** Best plan from the car to a pad (over every representation of the pad), written into out. */
  function planTo(id, out) {
    const pad = padById.get(id);
    let bestLen = Infinity;
    for (const r of pad.reps) {
      planInto(net, edge, s, dir, r.edge, r.s, planTry);
      if (planTry.length < bestLen) {
        bestLen = planTry.length;
        for (let i = 0; i < planTry.count; i++) Object.assign(out.steps[i], planTry.steps[i]);
        out.count = planTry.count;
        out.length = planTry.length;
      }
    }
    return out;
  }
  function beginAuto(pl) {
    auto.steps = pl.steps;
    auto.count = pl.count;
    auto.idx = 0;
    suffix[pl.count] = 0;
    for (let i = pl.count - 1; i >= 0; i--) suffix[i] = suffix[i + 1] + Math.abs(pl.steps[i].s1 - pl.steps[i].s0);
    const st = pl.steps[0];
    edge = st.edge;
    s = st.s0;
    if (st.dir !== dir) startPivot(st.dir, 1);
  }
  function finishAuto() {
    const id = auto.id;
    auto.active = false;
    auto.id = null;
    auto.steps = null;
    speed = 0;
    result.arrived = id;
  }

  const drive = {
    state,
    get isAuto() { return auto.active; },
    /** Screen stick: x right, y up (= north, -Z); magnitude 0..1. A real push cancels autopilot. */
    setStick(x, y) {
      let m = Math.hypot(x, y);
      if (m < 0.12) { stick.x = 0; stick.z = 0; stick.m = 0; return; }
      if (auto.active) { auto.active = false; auto.id = null; auto.steps = null; }
      stick.x = x / m;
      stick.z = -y / m;
      stick.m = Math.min(1, m);
    },
    goTo(id) {
      if (!padById.has(id)) return;
      auto.active = true;
      auto.id = id;
      auto.t = 0;
      stick.m = 0;
      const pl = planTo(id, planAuto);
      if (pivot <= 0 && speed > 0.6 && pl.steps[0].dir !== dir) {
        // Moving the wrong way: brake first, then plan again from where the car stops.
        auto.replan = true;
        auto.steps = null;
        return;
      }
      auto.replan = false;
      beginAuto(pl);
    },
    stop() {
      auto.active = false;
      auto.id = null;
      auto.steps = null;
      stick.m = 0;
    },
    teleport(id) {
      const pad = padById.get(id);
      if (!pad) return;
      const r = pad.reps[0];
      edge = r.edge;
      s = r.s;
      tangentAt(edge, s, tan);
      const fwd = Math.atan2(tan.x, tan.z);
      dir = Math.abs(wrapAngle(fwd - pad.heading)) < Math.PI / 2 ? 1 : -1;
      speed = 0;
      lastSpeed = 0;
      pivot = 0;
      auto.active = false;
      auto.id = null;
      auto.steps = null;
      syncPose();
      visHeading = lastVis = pathHeading;
      state.heading = visHeading;
      state.speed = 0;
      state.steer = steerS = 0;
      state.accel = accelS = 0;
      padId = id;
    },
    /** Put the car on the road point nearest (x, z), pointing as close to `heading` as the road allows
     * (story mode: the car comes to wherever Maya is walking). Returns that point. */
    placeAt(x, z, heading = 0) {
      const r = net.nearest(x, z);
      if (!r) return null;
      edge = r.edge;
      s = r.s;
      tangentAt(edge, s, tan);
      const fwd = Math.atan2(tan.x, tan.z);
      dir = Math.abs(wrapAngle(fwd - heading)) < Math.PI / 2 ? 1 : -1;
      speed = 0;
      lastSpeed = 0;
      pivot = 0;
      auto.active = false;
      auto.id = null;
      auto.steps = null;
      syncPose();
      visHeading = lastVis = pathHeading;
      state.heading = visHeading;
      state.speed = 0;
      state.steer = steerS = 0;
      state.accel = accelS = 0;
      padId = null;
      return state.position;
    },
    /** Route points (every ~0.5 m, y = road top) from the car to a place's pad. */
    route(id) {
      if (!padById.has(id)) return [];
      const pl = planTo(id, planView);
      const pts = [];
      const P = new THREE.Vector3();
      for (let j = 0; j < pl.count; j++) {
        const st = pl.steps[j];
        const len = Math.abs(st.s1 - st.s0);
        const k = Math.max(1, Math.ceil(len / 0.5));
        for (let i = pts.length ? 1 : 0; i <= k; i++) pts.push(pointAt(st.edge, st.s0 + (st.s1 - st.s0) * (i / k), P).clone());
      }
      return pts;
    },
    get pads() { return pads; },

    update(dt) {
      dt = Math.min(Math.max(dt, 0), 0.1);
      result.arrived = null;
      if (pivot > 0) {
        pivot = Math.max(0, pivot - dt);
        speed = 0;
        visHeading = wrapAngle(pivotFrom + pivotDelta * easeInOut(1 - pivot / DRIVE.turnTime));
      } else if (auto.active) {
        auto.t += dt;
        if (auto.replan) {
          // Braking before turning around for a new destination.
          speed = Math.max(0, speed - 18 * dt);
          moveManual(speed * dt);
          if (speed < 0.3) { auto.replan = false; beginAuto(planTo(auto.id, planAuto)); }
        } else if (auto.steps) {
          const st = auto.steps[auto.idx];
          const remaining = Math.abs(st.s1 - s) + suffix[auto.idx + 1];
          const vBrake = Math.min(Math.sqrt(2 * 4.5 * Math.max(0, remaining)), 2.8 * remaining + 0.35);
          const vT = Math.min(DRIVE.autoMax, vBrake);
          const aLim = Math.min(7, 1.5 + 16 * auto.t);
          speed = speed < vT ? Math.min(vT, speed + aLim * dt) : Math.max(vT, speed - 12 * dt);
          let move = speed * dt;
          let guard = 12;
          while (move > 0 && auto.idx < auto.count && guard--) {
            const cs = auto.steps[auto.idx];
            const left = Math.abs(cs.s1 - s);
            if (move < left) { s += cs.dir * move; move = 0; break; }
            s = cs.s1;
            move -= left;
            auto.idx++;
            if (auto.idx < auto.count) {
              const nx = auto.steps[auto.idx];
              edge = nx.edge;
              s = nx.s0;
              dir = nx.dir;
            }
          }
          if (auto.idx >= auto.count || remaining - speed * dt < 0.02) {
            const last = auto.steps[auto.count - 1];
            edge = last.edge;
            s = last.s1;
            dir = last.dir;
            finishAuto();
          }
        }
      } else if (stick.m > 0) {
        tangentAt(edge, s, tan);
        const fx = tan.x * dir, fz = tan.z * dir;
        const c = fx * stick.x + fz * stick.z;
        if (speed < 0.8) {
          chooseFromRest();
        } else if (c < -0.35) {
          // Pulling back: brake hard, then pivot.
          speed = Math.max(0, speed - 22 * dt);
          if (speed < 0.8) {
            const spin = Math.sign(fz * stick.x - fx * stick.z) || 1;
            startPivot(-dir, spin);
          }
        }
        if (pivot <= 0) {
          tangentAt(edge, s, tan);
          const align = Math.max(0, tan.x * dir * stick.x + tan.z * dir * stick.z);
          const vT = DRIVE.cruise * stick.m * (0.55 + 0.45 * align);
          speed = speed < vT ? Math.min(vT, speed + 10 * dt) : Math.max(vT, speed - 12 * dt);
          moveManual(speed * dt);
        }
      } else if (speed > 0) {
        // No input: go straight on and ease to a stop, settling onto a pad just ahead.
        let decel = 9;
        const d = padAhead();
        const stopDist = (speed * speed) / (2 * decel);
        if (d < stopDist * 1.6 + 3) decel = THREE.MathUtils.clamp((speed * speed) / (2 * d), 1.5, 14);
        speed = Math.max(0, speed - decel * dt);
        const step = speed * dt;
        if (d < Infinity && step >= d) { moveManual(d); speed = 0; } else moveManual(step);
        if (speed < 0.05) speed = 0;
      }

      syncPose();
      if (pivot <= 0) {
        const diff = wrapAngle(pathHeading - visHeading);
        const maxTurn = 9 * dt;
        visHeading = wrapAngle(visHeading + THREE.MathUtils.clamp(diff * (1 - Math.exp(-dt * 18)), -maxTurn, maxTurn));
      }
      const rate = dt > 0 ? wrapAngle(visHeading - lastVis) / dt : 0;
      lastVis = visHeading;
      steerS += (THREE.MathUtils.clamp(rate / 2.5, -1, 1) - steerS) * (1 - Math.exp(-dt * 10));
      const a = dt > 0 ? (speed - lastSpeed) / dt : 0;
      lastSpeed = speed;
      accelS += (a - accelS) * (1 - Math.exp(-dt * 12));
      state.heading = visHeading;
      state.speed = speed;
      state.steer = steerS;
      state.accel = accelS;

      // Pad detection with hysteresis: stopped within 3.5 m sets it, beyond 5 m clears it.
      const px = state.position.x, pz = state.position.z;
      if (padId) {
        const p = padById.get(padId);
        if (Math.hypot(p.x - px, p.z - pz) > DRIVE.padFar) padId = null;
      }
      if (!padId && speed < 0.5 && pivot <= 0) {
        let bd = DRIVE.padNear;
        for (const p of pads) {
          const d = Math.hypot(p.x - px, p.z - pz);
          if (d < bd) { bd = d; padId = p.id; }
        }
      }
      result.atPad = padId;
      return result;
    },
  };
  syncPose();
  visHeading = lastVis = pathHeading;
  return drive;
}
