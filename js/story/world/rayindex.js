// Fast, exact raycasts against the open world's big static chunk meshes (their ground and solid quarters).
//
//   fastRaycast(mesh)   stream.js, for each chunk mesh it makes
//
// three.js tests every triangle of a mesh whose bounding box a ray crosses: a chunk quarter is 20 x 20 m and up to
// ~50k triangles, so one ray from the lens to Maya cost a few ms, and the companion's "can the camera see this spot"
// check (extras-heinhtet.js seen(): three rays through the whole scene, several spots a go) took 20-28 ms at 2x CPU
// throttle, a hitch now and then while she walked (perf pass, 2026-11-15). Here each mesh gets, the first time a ray
// reaches it, a list of its triangles per 2 m tile of the ground plan; a ray then tests only the triangles in the
// tiles its path crosses, in the same order and with the same arithmetic as three.js (the same hits, the same
// distances, points, faces and normals). Anything unusual (a moved mesh, groups, morphs) takes three's own path.
import * as THREE from '../../game/three.js';

const TILE = 2; // m
const EPS = 1e-3; // (tiles a hair wider: a triangle or a path on a tile's edge is in both)
const GRIDS = new WeakMap(); // geometry -> { x0, z0, cols, rows, start: Int32Array, list: Int32Array, mark: Uint32Array, stamp }
const base = THREE.Mesh.prototype._computeIntersections;
const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3(), pt = new THREE.Vector3(), ptW = new THREE.Vector3();
const cands = [];

function gridOf(geo) {
  let G = GRIDS.get(geo);
  if (G) return G;
  if (!geo.boundingBox) geo.computeBoundingBox();
  const bb = geo.boundingBox, P = geo.attributes.position.array, I = geo.index.array, n = Math.floor(geo.index.count / 3);
  const x0 = bb.min.x - EPS, z0 = bb.min.z - EPS;
  const cols = Math.max(1, Math.floor((bb.max.x + EPS - x0) / TILE) + 1), rows = Math.max(1, Math.floor((bb.max.z + EPS - z0) / TILE) + 1);
  const count = new Int32Array(cols * rows + 1);
  const span = new Int32Array(n * 4); // (each triangle's tile range: i0, i1, j0, j1)
  for (let t = 0; t < n; t++) {
    const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3;
    const lx = Math.min(P[a], P[b], P[c]), hx = Math.max(P[a], P[b], P[c]), lz = Math.min(P[a + 2], P[b + 2], P[c + 2]), hz = Math.max(P[a + 2], P[b + 2], P[c + 2]);
    const i0 = Math.max(0, Math.floor((lx - EPS - x0) / TILE)), i1 = Math.min(cols - 1, Math.floor((hx + EPS - x0) / TILE));
    const j0 = Math.max(0, Math.floor((lz - EPS - z0) / TILE)), j1 = Math.min(rows - 1, Math.floor((hz + EPS - z0) / TILE));
    span[t * 4] = i0; span[t * 4 + 1] = i1; span[t * 4 + 2] = j0; span[t * 4 + 3] = j1;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) count[j * cols + i + 1]++;
  }
  for (let k = 1; k <= cols * rows; k++) count[k] += count[k - 1];
  const start = count.slice(), fill = count.slice(0, cols * rows), list = new Int32Array(count[cols * rows]);
  for (let t = 0; t < n; t++) {
    const i0 = span[t * 4], i1 = span[t * 4 + 1], j0 = span[t * 4 + 2], j1 = span[t * 4 + 3];
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) list[fill[j * cols + i]++] = t;
  }
  G = { x0, z0, cols, rows, start, list, mark: new Uint32Array(n), stamp: 0 };
  GRIDS.set(geo, G);
  return G;
}

/** The triangles in the tiles the ray's path crosses (t from t0 to t1 along it), in ascending order, into cands. */
function gather(G, ray, t0, t1) {
  cands.length = 0;
  if (++G.stamp > 0xfffffff0) { G.mark.fill(0); G.stamp = 1; }
  const st = G.stamp, o = ray.origin, d = ray.direction;
  const ax = o.x + d.x * t0, az = o.z + d.z * t0, bx = o.x + d.x * t1, bz = o.z + d.z * t1;
  const visit = (i, j) => {
    for (let k = G.start[j * G.cols + i], e = G.start[j * G.cols + i + 1]; k < e; k++) {
      const t = G.list[k];
      if (G.mark[t] !== st) { G.mark[t] = st; cands.push(t); }
    }
  };
  const lz = Math.min(az, bz), hz = Math.max(az, bz);
  const j0 = Math.max(0, Math.floor((lz - EPS - G.z0) / TILE)), j1 = Math.min(G.rows - 1, Math.floor((hz + EPS - G.z0) / TILE));
  for (let j = j0; j <= j1; j++) {
    // the part of the path inside this row of tiles (all of it if it runs along the row)
    let sx0 = Math.min(ax, bx), sx1 = Math.max(ax, bx);
    const dz = bz - az;
    if (Math.abs(dz) > 1e-9) {
      const za = G.z0 + j * TILE - EPS, zb = G.z0 + (j + 1) * TILE + EPS;
      const ua = Math.max(0, Math.min(1, (za - az) / dz)), ub = Math.max(0, Math.min(1, (zb - az) / dz));
      const xa = ax + (bx - ax) * ua, xb = ax + (bx - ax) * ub;
      sx0 = Math.min(xa, xb); sx1 = Math.max(xa, xb);
    }
    const i0 = Math.max(0, Math.floor((sx0 - EPS - G.x0) / TILE)), i1 = Math.min(G.cols - 1, Math.floor((sx1 + EPS - G.x0) / TILE));
    for (let i = i0; i <= i1; i++) visit(i, j);
  }
  cands.sort((p, q) => p - q);
}

/** three.js' Mesh._computeIntersections (indexed geometry, one material), over the tiles the ray crosses only. */
function computeIntersections(raycaster, intersects, ray) {
  const geo = this.geometry, mat = this.material, e = this.matrixWorld.elements;
  const ix = geo.index, pos = geo.attributes.position;
  // (three's own path for anything this does not cover: a mesh moved off the origin, materials per group, morphs,
  // a part of the geometry drawn, interleaved positions)
  if (!ix || Array.isArray(mat) || this.morphTargetInfluences || pos.isInterleavedBufferAttribute || geo.drawRange.start !== 0 || geo.drawRange.count < ix.count
    || e[0] !== 1 || e[5] !== 1 || e[10] !== 1 || e[15] !== 1 || e[12] !== 0 || e[13] !== 0 || e[14] !== 0
    || e[1] !== 0 || e[2] !== 0 || e[3] !== 0 || e[4] !== 0 || e[6] !== 0 || e[7] !== 0 || e[8] !== 0 || e[9] !== 0 || e[11] !== 0) {
    return base.call(this, raycaster, intersects, ray);
  }
  const G = gridOf(geo);
  // where along the ray it is over the mesh's ground plan (the triangles' tiles cover it), within near..far
  const o = ray.origin, d = ray.direction;
  let t0 = Math.max(0, raycaster.near), t1 = raycaster.far;
  const bb = geo.boundingBox;
  for (const [oc, dc, lo, hi] of [[o.x, d.x, bb.min.x - EPS, bb.max.x + EPS], [o.z, d.z, bb.min.z - EPS, bb.max.z + EPS]]) {
    if (Math.abs(dc) < 1e-12) { if (oc < lo || oc > hi) return; continue; }
    let u = (lo - oc) / dc, v = (hi - oc) / dc;
    if (u > v) { const w = u; u = v; v = w; }
    if (u > t0) t0 = u;
    if (v < t1) t1 = v;
  }
  if (!(t0 <= t1)) return;
  if (!Number.isFinite(t1)) t1 = t0; // (straight down: one point of the plan)
  gather(G, ray, t0, t1);
  const uv = geo.attributes.uv, uv1 = geo.attributes.uv1, normal = geo.attributes.normal;
  const I = ix.array;
  for (let k = 0; k < cands.length; k++) {
    const f = cands[k], a = I[f * 3], b = I[f * 3 + 1], c = I[f * 3 + 2];
    this.getVertexPosition(a, vA); this.getVertexPosition(b, vB); this.getVertexPosition(c, vC);
    const hit = mat.side === THREE.BackSide ? ray.intersectTriangle(vC, vB, vA, true, pt) : ray.intersectTriangle(vA, vB, vC, mat.side === THREE.FrontSide, pt);
    if (hit === null) continue;
    ptW.copy(pt).applyMatrix4(this.matrixWorld);
    const distance = raycaster.ray.origin.distanceTo(ptW);
    if (distance < raycaster.near || distance > raycaster.far) continue;
    const h = { distance, point: ptW.clone(), object: this };
    const bc = new THREE.Vector3();
    THREE.Triangle.getBarycoord(pt, vA, vB, vC, bc);
    if (uv) h.uv = THREE.Triangle.getInterpolatedAttribute(uv, a, b, c, bc, new THREE.Vector2());
    if (uv1) h.uv1 = THREE.Triangle.getInterpolatedAttribute(uv1, a, b, c, bc, new THREE.Vector2());
    if (normal) {
      h.normal = THREE.Triangle.getInterpolatedAttribute(normal, a, b, c, bc, new THREE.Vector3());
      if (h.normal.dot(ray.direction) > 0) h.normal.multiplyScalar(-1);
    }
    const face = { a, b, c, normal: new THREE.Vector3(), materialIndex: 0 };
    THREE.Triangle.getNormal(vA, vB, vC, face.normal);
    h.face = face;
    h.barycoord = bc;
    h.faceIndex = f;
    intersects.push(h);
  }
}

/** Gives a chunk mesh the tiled raycast (its outline child keeps its own: none). */
export function fastRaycast(mesh) {
  if (mesh?.isMesh && !mesh.isInstancedMesh && !mesh.isSkinnedMesh) mesh._computeIntersections = computeIntersections;
  return mesh;
}
/** Makes the mesh's tile lists now (stream.js: a slice of a chunk's build), not on the first ray that reaches it. */
export function prepareRaycast(mesh) {
  const g = mesh?.geometry;
  if (mesh?._computeIntersections === computeIntersections && g?.index && g.attributes.position && !g.attributes.position.isInterleavedBufferAttribute) gridOf(g);
}
/** Tests: the same ray through three.js' own triangle loop, for comparing. */
export function slowIntersections(mesh, raycaster, ray, out) { return base.call(mesh, raycaster, out, ray); }
