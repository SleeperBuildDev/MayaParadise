// Ground layers: no two flat things on the ground may lie closer than STEP in height where they overlap, or the
// depth buffer cannot tell which is on top and they flicker against each other while the camera moves (z-fighting:
// the owner's 2026-11-16 "more than 2 things in the same place ... fighting over what to show ... usually on the
// ground"). Story mode only.
//
// Why 3 mm. The open-world camera: 45 deg lens, near 0.5 m (index.js NEAR_OUT; 0.1 m in close shots within 5 m of
// her), far 400 m, a 24-bit depth buffer (WebGL default; three's logarithmic depth is off). One depth step is
// about d^2 / (near * 2^24) metres along the view ray at distance d, and a height gap h on the ground shows as
// h * sin(elevation) along it. Four steps of margin (float rounding in the vertex shader costs about the same as
// the buffer) need h >= 4 d^2 / (near * 2^24 * sin(elev)):
//   follow cam  near 0.5, d 30 m, 40 deg: 0.7 mm      d 50 m (into the haze), 30 deg: 2.4 mm
//   close shot  near 0.1, d 20 m, 20 deg: 2.8 mm
// The towns were drawn with gaps of 0.2 to 1 mm (0.0042 under 0.0046, rules at 0.003 under margins at 0.004, ...)
// and some at the very same height: some 100 000 overlapping pairs over the land (tools: the r20 z-fight scan).
//
// THE TABLE (heights above the surface a thing stands on: the paper y 0, the home page 0.006, the plaza 0.1, a road
// top ROAD.top 0.14, ...). Drawing code keeps its own heights (they say what goes over what); the chunk builder then
// stacks them so each overlapping pair is at least one STEP apart, keeping their order:
//   0              the surface itself (paper, a lawn, a road top, a yard floor, a box top)
//   + 1 STEP ...   painted ground: rules and margins, patches, verges, paths, kerb wear, seams, puddles, leaves,
//                  chalk, shadows of buildings and props, in the order their drawn heights give. Ties: a piece drawn
//                  inside another at its height (a detail on its base) goes over it; partly overlapping siblings (a
//                  heap of leaves, a ring of paving wedges) take the lowest free level. A flat may also come down by
//                  up to DROP under its drawn height (never under STEP over the paper), so the stack starts from what
//                  it really lies on. Most land on 1-3 STEPs; the busiest corners (a letter-paper crease over a kite
//                  field over ruled paper, a garden meadow) reach 3-4 cm.
//   low boxes      (Geo.box under YMAX: kerbs, slabs, steps, planters, a seal's petals) take part too: a level top that
//                  overlaps another surface within a STEP rises, with its walls' top edges and its ink hull.
//   OVER           things laid on the ground at run time, over all of that: contact blob shadows (toon.js puts them
//                  1 cm over the feet; blobpool.js adds the depth bias), event chalk lines and lantern glows
//                  (events/props.js, at y LAYER.over). Transparent, no depth write, and a polygonOffset of
//                  (overFactor, overUnits): the factor scales with the ground's slope on screen, worth about 2-3 cm
//                  of height at the follow camera's distance, so they stay over the stacked paint round them.
//   (feet.js reads the stacked tops, so people stand on the paint, not in it.)
//
//   stackFlatsJob(geos, kinds, rect, near)  generator (stream.js finish(): yields every SLICE ms). geos: the chunk's
//                  Geos (ground first, then its solid cells; Geo.quad / Geo.box record geo.flats / geo.boxes);
//                  kinds: the ground's gKind array (a decal and bare paper of one colour still count as two);
//                  rect: the chunk; near: the built neighbours' border pieces (and the home book's ink, bookNear),
//                  kept fixed. -> { pieces, moved, maxLift, maxTop, keep (this chunk's border pieces), ... }
//   stackFlats(...)                         the same, at once
//   stackBook(world)                        the home book's ink mesh, once at boot (see below)
//   No new geometry, no draw call, no triangle: only vertex heights change, before the meshes are made.
/** ?layers=0 (or localStorage 'rc-layers' = '0': the game tidies its URL) turns the stacking off, for before / after
 * comparisons (the r20 z-fight scan). */
export const LAYERS_ON = !(/[?&]layers=0(?![0-9])/.test(globalThis.location?.search || '') || (() => { try { return globalThis.localStorage?.getItem('rc-layers') === '0'; } catch { return false; } })());
export const STEP = 0.003;
export const LAYER = { surface: 0, step: STEP, over: 0.02, overFactor: -2, overUnits: -4 };

const YMAX = 0.5; // only flats this low (world y) are stacked: the ground and what lies on low plinths
const EPS = 0.001; // overlaps thinner than this (touching edges, a shared border) do not count
const CELL = 1;
const SLICE = 1.2; // ms of work between yields (stackFlatsJob)
const DROP = 0.006; // how far under its drawn height a flat may come down (see runJob)
const BAND = 8; // a chunk keeps for its neighbours what lies this close to its border (things reach at most ~6 m over it)
/** Debug (r20 z-fight scan): set .on and every piece lifted by >= .min lands in .rows ({ g, v, y, ny }). */
export const stackLog = { on: false, min: 0.012, rows: [] };

/** Stacks the flat quads of a chunk's Geos (see the table above). Fixed pieces (box tops, and the neighbours' pieces
 * in `near`) never move; the movable ones keep clear of them too. rect: the chunk [x0, z0, x1, z1]; the result's
 * `keep` holds this chunk's pieces near its border, for the neighbours built after it (a shadow or a path drawn
 * across a chunk's edge lies over the next chunk's paper). */
export function stackFlats(geos, kinds = null, rect = null, near = null) { return finish(stackFlatsJob(geos, kinds, rect, near)); }
/** The same as a generator (stream.js: it yields every couple of milliseconds, so a busy chunk is spread over frames). */
export function* stackFlatsJob(geos, kinds = null, rect = null, near = null) {
  if (!LAYERS_ON) return { pieces: 0, near: 0, moved: 0, stuck: 0, maxLift: 0, maxTop: 0, out: 0, keep: null };
  const pcs = []; // { g, v (first vertex; -1 a fixed box top, -2 a neighbour's), pts [x, z, ...], y, ny, x0, z0, x1, z1, ci, k, ord }
  let ord = 0, tY = performance.now(), n = 0;
  for (let gi = 0; gi < geos.length; gi++) {
    const g = geos[gi];
    if (!g || g.empty) continue;
    const P = g.p, N = g.n, C = g.c, nv = g.nv;
    const mine = new Uint8Array(nv);
    for (const v of g.flats || []) {
      if ((++n & 255) === 0 && performance.now() - tY > SLICE) { yield; tY = performance.now(); }
      if (v + 3 >= nv) continue;
      const y = P[v * 3 + 1];
      if (y > YMAX) continue;
      mine[v] = mine[v + 1] = mine[v + 2] = mine[v + 3] = 1;
      const pts = [P[v * 3], P[v * 3 + 2], P[v * 3 + 3], P[v * 3 + 5], P[v * 3 + 6], P[v * 3 + 8], P[v * 3 + 9], P[v * 3 + 11]];
      const pc = piece(g, v, pts, y, C, gi === 0 && kinds ? kinds[v] : 255, ord++);
      if (pc) pcs.push(pc);
    }
    // low boxes (Geo.box: kerbs, slabs, steps, planters, plinths): the level top moves, with the side walls' top
    // edges and the ink hull's top corners, so the box stays closed (a few millimetres taller)
    const B = g.boxes || [];
    for (let b = 0; b < B.length; b += 3) {
      if ((++n & 255) === 0 && performance.now() - tY > SLICE) { yield; tY = performance.now(); }
      const v0 = B[b], v1 = Math.min(B[b + 1], nv), o0 = B[b + 2];
      for (let v = v0; v < v1; v++) mine[v] = 1;
      let top = -1;
      for (let f = v0; f + 3 < v1; f += 4) if (N[f * 3 + 1] > 0.999 && N[f * 3 + 4] > 0.999 && N[f * 3 + 7] > 0.999 && N[f * 3 + 10] > 0.999) { top = f; break; }
      if (top < 0) continue;
      const y = P[top * 3 + 1];
      if (y > YMAX) continue;
      const pts = [P[top * 3], P[top * 3 + 2], P[top * 3 + 3], P[top * 3 + 5], P[top * 3 + 6], P[top * 3 + 8], P[top * 3 + 9], P[top * 3 + 11]];
      const pc = piece(g, top, convex(pts), y, C, 255, ord++);
      if (!pc) continue;
      pc.apply = (ny) => {
        for (let v = v0; v < v1; v++) if (Math.abs(P[v * 3 + 1] - y) < 1e-6) P[v * 3 + 1] = ny;
        if (o0 >= 0 && g.op) for (let v = o0; v < o0 + 8; v++) if (Math.abs(g.op[v * 3 + 1] - y) < 1e-6) g.op[v * 3 + 1] = ny;
      };
      pcs.push(pc);
    }
    // fixed: any other up-facing flat triangles
    const I = g.i, ni = g.ni;
    for (let t = 0; t < ni; t += 3) {
      if ((++n & 1023) === 0 && performance.now() - tY > SLICE) { yield; tY = performance.now(); }
      const a = I[t], b = I[t + 1], c = I[t + 2];
      if (mine[a] || N[a * 3 + 1] < 0.999 || N[b * 3 + 1] < 0.999 || N[c * 3 + 1] < 0.999) continue;
      const y = P[a * 3 + 1];
      if (y > YMAX || Math.abs(P[b * 3 + 1] - y) > 1e-6 || Math.abs(P[c * 3 + 1] - y) > 1e-6) continue;
      const pts = [P[a * 3], P[a * 3 + 2], P[b * 3], P[b * 3 + 2], P[c * 3], P[c * 3 + 2]];
      const pc = piece(g, -1, pts, y, C, 255, ord++, a);
      if (pc) pcs.push(pc);
    }
  }
  yield;
  return yield* runJob(pcs, ord, rect, near);
}
const finish = (it) => { let r; while (!(r = it.next()).done); return r.value; };

/** The stacking itself, over collected pieces (movable: v >= 0, moved by p.apply(y) or in their Geo). */
function* runJob(pcs, ord, rect, near) {
  const own = pcs.length;
  if (near && own) {
    // only the neighbours' pieces that reach what this chunk drew (its pieces stick out over its border a little)
    let ex0 = Infinity, ez0 = Infinity, ex1 = -Infinity, ez1 = -Infinity;
    for (let k = 0; k < own; k++) { const p = pcs[k]; if (p.x0 < ex0) ex0 = p.x0; if (p.z0 < ez0) ez0 = p.z0; if (p.x1 > ex1) ex1 = p.x1; if (p.z1 > ez1) ez1 = p.z1; }
    const [rx0, rz0, rx1, rz1] = rect || [ex0, ez0, ex1, ez1];
    const over = [];
    for (let k = 0; k < own; k++) { const p = pcs[k]; if (p.x0 < rx0 || p.x1 > rx1 || p.z0 < rz0 || p.z1 > rz1) over.push(p); }
    let i = 0, tN = performance.now();
    for (const list of near) for (const q of list) {
      if ((++i & 255) === 0 && performance.now() - tN > SLICE) { yield; tN = performance.now(); }
      if (q.x1 <= ex0 || q.x0 >= ex1 || q.z1 <= ez0 || q.z0 >= ez1) continue;
      // (a neighbour's piece wholly outside this chunk's rect matters only where this chunk's pieces stick out)
      if ((q.x1 <= rx0 || q.x0 >= rx1 || q.z1 <= rz0 || q.z0 >= rz1) && !over.some((p) => p.x0 < q.x1 && q.x0 < p.x1 && p.z0 < q.z1 && q.z0 < p.z1)) continue;
      pcs.push({ ...q, g: null, v: -2, ord: ord++ });
    }
  }
  pcs.sort((a, b) => a.y - b.y || a.ord - b.ord);
  yield;
  let tY = performance.now();
  const grid = new Map();
  const put = (p) => {
    for (let gx = Math.floor(p.x0 / CELL); gx <= Math.floor(p.x1 / CELL); gx++) for (let gz = Math.floor(p.z0 / CELL); gz <= Math.floor(p.z1 / CELL); gz++) {
      const key = gx * 65536 + gz;
      let cell = grid.get(key);
      if (!cell) grid.set(key, (cell = []));
      cell.push(p);
    }
  };
  // the fixed ones are there from the start: what comes before them in order keeps out of their way
  for (let k = 0; k < pcs.length; k++) {
    if ((k & 255) === 255 && performance.now() - tY > SLICE) { yield; tY = performance.now(); }
    pcs[k].id = k; if (pcs[k].v < 0) put(pcs[k]);
  }
  const stamp = new Int32Array(pcs.length).fill(-1), sib = [];
  let moved = 0, stuck = 0, maxLift = 0, maxTop = 0, paintOut = 0, paintBand = 0;
  for (let k = 0; k < pcs.length; k++) {
    if ((k & 7) === 7 && performance.now() - tY > SLICE) { yield; tY = performance.now(); }
    const p = pcs[k];
    if (p.v === -2) continue; // (a neighbour's: already where it is)
    // what it must lie over (drawn lower, or drawn at its height with it inside: a detail on its base, which the
    // later draw used to win) sets its floor; its siblings (same drawn height, only partly over it: scattered leaves,
    // a ring of paving wedges) and the fixed pieces drawn higher only keep a STEP away (a free slot under them, or
    // over them), so a heap of siblings takes two or three levels, not one each
    // (a flat may also come down a little, to DROP under its drawn height: the stack then starts from what it
    // really lies on, and a busy corner stays low; a box keeps its top)
    const floor0 = p.apply || p.v < 0 ? p.y : Math.max(p.y - DROP, Math.min(p.y, STEP));
    let need = floor0, by = null;
    sib.length = 0;
    const gx0 = Math.floor(p.x0 / CELL), gx1 = Math.floor(p.x1 / CELL), gz0 = Math.floor(p.z0 / CELL), gz1 = Math.floor(p.z1 / CELL);
    for (let gx = gx0; gx <= gx1; gx++) for (let gz = gz0; gz <= gz1; gz++) {
      const cell = grid.get(gx * 65536 + gz);
      if (!cell) continue;
      for (const q of cell) {
        if (q === p || stamp[q.id] === k) continue;
        stamp[q.id] = k;
        if (q.ny + STEP <= floor0) continue; // (already clear of it)
        if (q.ci === p.ci && q.k === p.k) continue; // the same paint: one look, nothing to fight
        if (q.x1 - EPS <= p.x0 || p.x1 - EPS <= q.x0 || q.z1 - EPS <= p.z0 || p.z1 - EPS <= q.z0) continue;
        if (!overlaps(p.pts, q.pts) || !overlaps(q.pts, p.pts)) continue;
        const below = q.y < p.y - 1e-6 || (q.y <= p.y + 1e-6 && q.ord < p.ord);
        if (q.v < 0 && !below) { sib.push(q.ny); continue; } // fixed, after it in order
        const inside = p.x0 >= q.x0 - 0.01 && p.x1 <= q.x1 + 0.01 && p.z0 >= q.z0 - 0.01 && p.z1 <= q.z1 + 0.01;
        if (q.y < p.y - 1e-6 || inside || p.v < 0 || q.v < 0) { if (q.ny + STEP > need) { need = q.ny + STEP; by = q; } }
        else sib.push(q.ny);
      }
    }
    if (sib.length) { // the lowest free slot from the floor up
      sib.sort((a, b) => a - b);
      for (const e of sib) if (e > need - STEP + 1e-7 && e < need + STEP - 1e-7) need = e + STEP;
    }
    if (p.v === -1) { if (need - p.y > 1e-6) stuck++; continue; } // (a box top just over something: left as it is)
    if (p.y < 0.03 && need > maxTop) maxTop = need;
    if (p.k <= 1) { if (p.y < 0.03 && need >= 0.03) paintOut++; if (p.y >= 0.03 && p.y < 0.06) paintBand++; }
    if (Math.abs(need - p.y) > 1e-6) {
      if (p.apply) p.apply(need);
      else { const P = p.g.p; for (let v = p.v; v < p.v + 4; v++) P[v * 3 + 1] = need; }
      moved++;
      if (need - p.y > maxLift) maxLift = need - p.y;
      if (stackLog.on && p.g && need - p.y >= stackLog.min) stackLog.rows.push({ g: p.g, v: p.v, y: p.y, ny: need, by });
      p.ny = need;
    }
    put(p);
  }
  // this chunk's pieces near its border (and over it), for the neighbours
  const keep = [];
  let out = 0;
  if (rect) {
    const [rx0, rz0, rx1, rz1] = rect;
    let i = 0;
    for (const p of pcs) {
      if ((++i & 511) === 0 && performance.now() - tY > SLICE) { yield; tY = performance.now(); }
      if (p.v === -2) continue;
      out = Math.max(out, rx0 - p.x0, p.x1 - rx1, rz0 - p.z0, p.z1 - rz1);
      if (rect.all || p.x0 < rx0 + BAND || p.x1 > rx1 - BAND || p.z0 < rz0 + BAND || p.z1 > rz1 - BAND) {
        keep.push({ y: p.y, ny: p.ny, pts: p.pts, x0: p.x0, z0: p.z0, x1: p.x1, z1: p.z1, ci: p.ci, k: p.k });
      }
    }
  }
  return { pieces: own, near: pcs.length - own, moved, stuck, maxLift, maxTop, paintOut, paintBand, out, keep };
}

// ---------------------------------------------------------------------------------
// The home book (js/game/world/world.js, shared with the website, so it is not edited there): its flat ink mesh
// ('roadsAndInk': rules, margins, road edges, seams, shadows, all thin boxes) is stacked the same way here, over the
// fixed book and plaza ('bookAndPlaza'), once, in story mode, before homebatch.js copies them. Each up-facing face
// (with every vertex at the same spot: the box's side walls) moves as one, so a lifted rule stays a closed box.
// bookNear: its pieces, for the chunks drawn over the book (the Home Book's detail pass, home-detail.js).
// ---------------------------------------------------------------------------------
export let bookNear = null;
export const BOOK_RECT = [-27, -19, 27, 19];
export function stackBook(world) {
  const ink = world?.scene?.getObjectByName('roadsAndInk'), book = world?.scene?.getObjectByName('bookAndPlaza');
  if (!ink || !book || !LAYERS_ON) return null;
  const t0 = performance.now();
  const pcs = [];
  let ord = 0;
  for (const [mesh, movable] of [[book, false], [ink, true]]) {
    mesh.updateWorldMatrix(true, false);
    const e = mesh.matrixWorld.elements;
    // (only a moved, unturned, unscaled mesh: then local y + e[13] is world y)
    if (Math.abs(e[0] - 1) > 1e-6 || Math.abs(e[5] - 1) > 1e-6 || Math.abs(e[10] - 1) > 1e-6 || Math.abs(e[4]) > 1e-6 || Math.abs(e[8]) > 1e-6) return null;
    const ox = e[12], oy = e[13], oz = e[14];
    const g = mesh.geometry, pos = g.attributes.position, nor = g.attributes.normal, col = g.attributes.color, idx = g.index;
    if (!pos || !nor) continue;
    const n = idx ? idx.count : pos.count, at = (t) => (idx ? idx.getX(t) : t);
    // vertices by position (a face's corners and the side walls' top edges share them)
    const key = (v) => `${Math.round(pos.getX(v) * 1e4)},${Math.round(pos.getY(v) * 1e5)},${Math.round(pos.getZ(v) * 1e4)}`;
    const byPos = new Map();
    for (let v = 0; v < pos.count; v++) { const k = key(v); const a = byPos.get(k); if (a) a.push(v); else byPos.set(k, [v]); }
    // up-facing flat triangles, joined into faces through shared positions
    const parent = new Map();
    const find = (k) => { let r = k; while (parent.get(r) !== r) r = parent.get(r); parent.set(k, r); return r; };
    const tris = [];
    for (let t = 0; t + 2 < n; t += 3) {
      const a = at(t), b = at(t + 1), c = at(t + 2);
      if (nor.getY(a) < 0.999 || nor.getY(b) < 0.999 || nor.getY(c) < 0.999) continue;
      const y = pos.getY(a);
      if (y + oy > YMAX || Math.abs(pos.getY(b) - y) > 1e-6 || Math.abs(pos.getY(c) - y) > 1e-6) continue;
      const ks = [key(a), key(b), key(c)];
      for (const k of ks) if (!parent.has(k)) parent.set(k, k);
      parent.set(find(ks[1]), find(ks[0])); parent.set(find(ks[2]), find(ks[0]));
      tris.push([a, ks]);
    }
    const faces = new Map();
    for (const [a, ks] of tris) {
      const r = find(ks[0]);
      let f = faces.get(r);
      if (!f) faces.set(r, (f = { a, keys: new Set(), xs: [] }));
      for (const k of ks) if (!f.keys.has(k)) { f.keys.add(k); const v = byPos.get(k)[0]; f.xs.push([pos.getX(v) + ox, pos.getZ(v) + oz]); }
    }
    for (const f of faces.values()) {
      const pts = hull(f.xs);
      if (pts.length < 6) continue;
      const C = col ? [col.getX(f.a), col.getY(f.a), col.getZ(f.a)] : [1, 1, 1];
      const pc = piece(null, movable ? 0 : -1, pts, pos.getY(f.a) + oy, C, 255, ord++, 0);
      if (!pc) continue;
      if (movable) {
        const vs = [];
        for (const k of f.keys) vs.push(...byPos.get(k));
        pc.apply = (y) => { for (const v of vs) pos.setY(v, y - oy); };
      }
      pcs.push(pc);
    }
    if (movable) pos.needsUpdate = true;
  }
  const r = finish(runJob(pcs, ord, Object.assign([...BOOK_RECT], { all: true }), null));
  if (r.moved) { ink.geometry.computeBoundingBox(); ink.geometry.computeBoundingSphere(); }
  bookNear = r.keep;
  r.keep = null;
  r.ms = performance.now() - t0;
  stackLog.book = r;
  return r;
}
/** A box top's four corners in order round it (the Geo writes them in face order, which may cross). */
function convex(pts) { const a = []; for (let j = 0; j < pts.length; j += 2) a.push([pts[j], pts[j + 1]]); return hull(a); }
/** Convex hull of [x, z] points -> flat [x, z, ...] (counter-clockwise). */
function hull(p) {
  p.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1)).flat();
}

function piece(g, v, pts, y, C, k, ord, cv = v) {
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  for (let j = 0; j < pts.length; j += 2) {
    if (pts[j] < x0) x0 = pts[j]; if (pts[j] > x1) x1 = pts[j];
    if (pts[j + 1] < z0) z0 = pts[j + 1]; if (pts[j + 1] > z1) z1 = pts[j + 1];
  }
  if (x1 - x0 < 1e-5 || z1 - z0 < 1e-5) return null;
  // colour key (linear floats, as written)
  const ci = Math.round(C[cv * 3] * 1e4) * 1e8 + Math.round(C[cv * 3 + 1] * 1e4) * 1e4 + Math.round(C[cv * 3 + 2] * 1e4);
  return { g, v, pts, y, ny: y, x0, z0, x1, z1, ci, k, ord, id: 0 };
}

/** Separating axes: no edge normal of `a` separates the convex polygons a and b by more than -EPS. */
function overlaps(a, b) {
  const n = a.length;
  for (let j = 0; j < n; j += 2) {
    const ax = a[j], az = a[j + 1], bx = a[(j + 2) % n], bz = a[(j + 3) % n];
    let nx = bz - az, nz = ax - bx;
    const l = Math.hypot(nx, nz);
    if (l < 1e-9) continue;
    nx /= l; nz /= l;
    let amin = Infinity, amax = -Infinity, bmin = Infinity, bmax = -Infinity;
    for (let i = 0; i < n; i += 2) { const d = a[i] * nx + a[i + 1] * nz; if (d < amin) amin = d; if (d > amax) amax = d; }
    for (let i = 0; i < b.length; i += 2) { const d = b[i] * nx + b[i + 1] * nz; if (d < bmin) bmin = d; if (d > bmax) bmax = d; }
    if (Math.min(amax, bmax) - Math.max(amin, bmin) < EPS) return false;
  }
  return true;
}
