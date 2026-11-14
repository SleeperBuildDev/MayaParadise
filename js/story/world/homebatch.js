// The Home Book's draw budget (story mode only; the site's own book is untouched). build.js re-exports
// homeBookBudget from here; index.js calls homeBookBudget(world) once and update(x, z, all) every frame.
//
// The book is drawn from a few dozen meshes that never change shape: the book and plaza, the roads and ink,
// the six landmark houses, four kinds of tree, the clouds, the critters, the signs... Each was a draw call
// a frame (its ink outline a second, its sun shadow a third), drawn whole even when most of it lies off the
// side of a narrow phone screen. On the first update they are copied, once, into a few BatchedMeshes (one
// draw each, whatever they hold):
//   A  the vertex-coloured toon pieces: book + plaza, roads + ink, landmark bodies, trees, vane, clapper, planes
//   C  the instance-coloured toon pieces: critters, road birds, fountain ink
//   D  the cloud material: near and far clouds, the café steam, the chimney smoke
//   E  the sign atlas: the six landmark signs and the welcome sign
//   B  every outline of those (one material: each vertex carries its own outline width and colour)
// The big meshes are cut into cells, so what lies off screen (or off the sun's shadow map) is not drawn, and
// faces nobody can see are left out: a box face pressed against another box, and the underside of anything
// standing on the page (from above it is a back face; in the shadow map it only lies under its own body).
// Nothing else changes: the originals stay where they were (other code still moves, shows and hides them,
// the trees still sway, the birds still fly) and are only taken off the camera's layer; every frame each copy
// follows its original's world matrix, instance matrices, instance colours and visibility, and the original's
// castShadow decides whether the copy goes into the sun's shadow map.
//
// Also (as before): a landmark's little moving bits (vane, clapper, steam, smoke, planes) are hidden while she
// is more than FAR_BITS metres from it, small things stop casting (critters, road birds, fountain ink, those
// bits, the flat roads and ink), and from more than FAR_PAINT metres off the book the flat paint is not drawn.
import * as THREE from '../../game/three.js';
import { BOOK } from '../../game/world/world.js';
import { bookDist } from './region.js';

const FAR_BITS = 20, FAR_PAINT = 40;
/** The layer mask a copied original is given: no camera draws it (and the shadow pass skips it too). */
const HIDDEN = 1 << 29;
/** Cell size (metres, the mesh's own x/z) for the big meshes; everything else is one piece. */
const CELLS = { bookAndPlaza: 4, roadsAndInk: 4, cloudsNear: 8, cloudsFar: 14 };
/** Meshes standing on the page (local y = 0 is the page): their undersides are left out. */
const ON_PAGE = (o) => /^(bookAndPlaza|roadsAndInk|trees|padauks|cypresses|palms|.+-body)$/.test(o.name);
/** (the book and the roads also run off the page's edge: only undersides over the page go) */
const PAGE_CHECK = new Set(['bookAndPlaza', 'roadsAndInk']);

// ---------------------------------------------------------------------------------
// Faces nobody sees, in a merged VoxelBuilder geometry (non-indexed; each box is 36 vertices in a row).
// Returns a Uint8Array per triangle (1 = leave out).
// ---------------------------------------------------------------------------------
function hiddenFaces(P, { bottoms = false, onPage = null } = {}) {
  const nV = P.length / 3, nT = nV / 3;
  const boxes = [], own = new Int32Array(nT).fill(-1);
  const near = (a, b) => Math.abs(a - b) < 1e-5;
  const lo = [0, 0, 0], hi = [0, 0, 0], cnt = [0, 0, 0, 0, 0, 0];
  let v = 0;
  // the axis-aligned boxes (rotated boxes and other shapes can still be hidden by them)
  while (v + 36 <= nV) {
    lo[0] = lo[1] = lo[2] = Infinity; hi[0] = hi[1] = hi[2] = -Infinity;
    for (let k = v * 3; k < (v + 36) * 3; k += 3) for (let ax = 0; ax < 3; ax++) { const c = P[k + ax]; if (c < lo[ax]) lo[ax] = c; if (c > hi[ax]) hi[ax] = c; }
    let ok = hi[0] - lo[0] > 1e-6 && hi[1] - lo[1] > 1e-6 && hi[2] - lo[2] > 1e-6;
    cnt.fill(0);
    for (let t = 0; ok && t < 12; t++) {
      const o = (v + t * 3) * 3;
      let found = -1;
      for (let ax = 0; ax < 3 && found < 0; ax++) {
        const c0 = P[o + ax], c1 = P[o + 3 + ax], c2 = P[o + 6 + ax];
        if (near(c0, lo[ax]) && near(c1, lo[ax]) && near(c2, lo[ax])) found = ax * 2;
        else if (near(c0, hi[ax]) && near(c1, hi[ax]) && near(c2, hi[ax])) found = ax * 2 + 1;
      }
      if (found < 0) ok = false; else cnt[found]++;
      for (let q = 0; ok && q < 9; q++) { const ax = q % 3, c = P[o + q]; if (!near(c, lo[ax]) && !near(c, hi[ax])) ok = false; }
    }
    if (ok && cnt.every((c) => c === 2)) { own.fill(boxes.length, v / 3, v / 3 + 12); boxes.push([lo[0], lo[1], lo[2], hi[0], hi[1], hi[2]]); v += 36; }
    else v += 3;
  }
  const C = 1, grid = new Map(), key = (i, j) => i * 100003 + j;
  boxes.forEach((b, bi) => {
    for (let i = Math.floor(b[0] / C); i <= Math.floor(b[3] / C); i++) for (let j = Math.floor(b[2] / C); j <= Math.floor(b[5] / C); j++) {
      const k = key(i, j);
      let l = grid.get(k);
      if (!l) grid.set(k, (l = []));
      l.push(bi);
    }
  });
  const mask = new Uint8Array(nT);
  const EPS = 0.003, T = 1e-4, q = new Float64Array(9);
  for (let t = 0; t < nT; t++) {
    const o = t * 9;
    const ux = P[o + 3] - P[o], uy = P[o + 4] - P[o + 1], uz = P[o + 5] - P[o + 2], wx = P[o + 6] - P[o], wy = P[o + 7] - P[o + 1], wz = P[o + 8] - P[o + 2];
    let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
    const L = Math.hypot(nx, ny, nz);
    if (L < 1e-12) continue;
    nx /= L; ny /= L; nz /= L;
    const cx = (P[o] + P[o + 3] + P[o + 6]) / 3, cy = (P[o + 1] + P[o + 4] + P[o + 7]) / 3, cz = (P[o + 2] + P[o + 5] + P[o + 8]) / 3;
    // the underside of something standing on the page
    if (bottoms && ny < -0.99 && Math.max(P[o + 1], P[o + 4], P[o + 7]) < 0.02 && Math.min(P[o + 1], P[o + 4], P[o + 7]) > -0.05 && (!onPage || onPage(cx, cz))) { mask[t] = 1; continue; }
    // a face pressed into (or lying inside) another box: its three corners, a hair out along its normal, all
    // inside that one box (edges may meet: the face then lies wholly on that box's face or within it)
    for (let k = 0; k < 3; k++) for (let ax = 0; ax < 3; ax++) q[k * 3 + ax] = P[o + k * 3 + ax] + [nx, ny, nz][ax] * EPS;
    const l = grid.get(key(Math.floor(cx / C), Math.floor(cz / C)));
    if (!l) continue;
    for (const bi of l) {
      if (bi === own[t]) continue;
      const b = boxes[bi];
      let inside = true;
      for (let k = 0; k < 3 && inside; k++) {
        const x = q[k * 3], y = q[k * 3 + 1], z = q[k * 3 + 2];
        if (!(x >= b[0] - T && x <= b[3] + T && y >= b[1] - T && y <= b[4] + T && z >= b[2] - T && z <= b[5] + T)) inside = false;
      }
      if (inside) { mask[t] = 1; break; }
    }
  }
  return mask;
}

// ---------------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------------
const floatsOf = (a) => {
  if (!a.isInterleavedBufferAttribute && a.array instanceof Float32Array) return a.array;
  const out = new Float32Array(a.count * a.itemSize);
  for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) out[i * a.itemSize + k] = a.getComponent(i, k);
  return out;
};
/** A non-indexed geometry with `names` attributes (a missing colour, or any when `white`, is white). */
function flatGeo(geo, names, white = false) {
  let g = geo.index ? geo.toNonIndexed() : geo;
  if (names.includes('normal') && !g.attributes.normal) { if (g === geo) g = geo.clone(); g.computeVertexNormals(); }
  const out = {};
  for (const n of names) {
    const a = g.attributes[n];
    if (a && !(white && n === 'color')) out[n] = { array: floatsOf(a), size: a.itemSize };
    else if (n === 'color') out[n] = { array: new Float32Array(g.attributes.position.count * 3).fill(1), size: 3 };
    else return null;
  }
  return out;
}
/** The given triangles (ids) of a flat attribute set, as a new non-indexed BufferGeometry. */
function pickTris(flat, tris) {
  const g = new THREE.BufferGeometry();
  for (const n in flat) {
    const { array, size } = flat[n], w = size * 3, arr = new Float32Array(tris.length * w);
    let o = 0;
    for (const t of tris) { arr.set(array.subarray(t * w, t * w + w), o); o += w; }
    g.setAttribute(n, new THREE.BufferAttribute(arr, size));
  }
  return g;
}
/** The given triangles of an outline geometry (indexed, smooth normals), compacted, with the outline's width and colour per vertex. */
function pickOutline(og, tris, px, col) {
  const pos = floatsOf(og.attributes.position), nor = floatsOf(og.attributes.normal);
  const idx = og.index ? og.index.array : null;
  const nTri = idx ? idx.length / 3 : og.attributes.position.count / 3;
  const list = tris || Array.from({ length: nTri }, (_, i) => i);
  const map = new Int32Array(og.attributes.position.count).fill(-1);
  const verts = [];
  const index = new Uint32Array(list.length * 3);
  let o = 0;
  for (const t of list) for (let k = 0; k < 3; k++) {
    const vtx = idx ? idx[t * 3 + k] : t * 3 + k;
    if (map[vtx] < 0) { map[vtx] = verts.length; verts.push(vtx); }
    index[o++] = map[vtx];
  }
  const n = verts.length, P = new Float32Array(n * 3), N = new Float32Array(n * 3), W = new Float32Array(n).fill(px), Cc = new Float32Array(n * 3);
  verts.forEach((vtx, i) => {
    P.set(pos.subarray(vtx * 3, vtx * 3 + 3), i * 3);
    N.set(nor.subarray(vtx * 3, vtx * 3 + 3), i * 3);
    Cc[i * 3] = col.r; Cc[i * 3 + 1] = col.g; Cc[i * 3 + 2] = col.b;
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  g.setAttribute('aOutlinePx', new THREE.BufferAttribute(W, 1));
  g.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
  g.setIndex(new THREE.BufferAttribute(n > 65535 ? index : new Uint16Array(index), 1));
  return g;
}
/** An outline material's width in pixels (toon.js keeps it in its compile hook). */
function outlinePx(mat) {
  if (typeof mat?.onBeforeCompile !== 'function' || mat.customProgramCacheKey?.() !== 'toon-outline') return null;
  const fake = { uniforms: {}, vertexShader: 'void main() {\n#include <project_vertex>\n}', fragmentShader: '' };
  try { mat.onBeforeCompile(fake); } catch { return null; }
  const v = fake.uniforms.uOutlinePx?.value;
  return typeof v === 'number' ? v : null;
}
/** One outline material for every outline in batch B: width and colour per vertex, the rest as toon.js's. */
function batchOutlineMaterial(ref) {
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, side: THREE.BackSide, toneMapped: false });
  m.onBeforeCompile = (shader) => {
    ref.onBeforeCompile(shader); // (its resolution uniform and screen-space push)
    shader.vertexShader = shader.vertexShader
      .replace('uniform float uOutlinePx;', 'attribute float aOutlinePx;')
      .replace('uOutlinePx * gl_Position.w', 'aOutlinePx * gl_Position.w');
  };
  m.customProgramCacheKey = () => 'toon-outline-batched';
  return m;
}

// ---------------------------------------------------------------------------------
// The budget
// ---------------------------------------------------------------------------------
export function homeBookBudget(world) {
  const lm = world?.landmarks;
  const scene = world?.scene;
  const root = scene?.getObjectByName('world');
  if (!lm || !root) return { update() {}, stats: () => null };
  const NO_CAST = new Set(['critters', 'roadBirds', 'fountainInk', 'roadsAndInk']);
  const quiet = [], bits = [];
  const paint = root.getObjectByName('roadsAndInk');
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (NO_CAST.has(o.name)) quiet.push(o);
    else if (o.parent && o.parent.parent === lm.group && !/-(body|sign)$/.test(o.name) && !/^art-/.test(o.name)) {
      bits.push({ o, x: o.parent.position.x, z: o.parent.position.z }); // vane, clapper, steam, smoke, planes (+ the planes' outline)
      if (!o.userData.isOutline) quiet.push(o);
    }
  });

  let built = false, hooked = false, renderer = null;
  const batches = [];
  const info = { batches: 0, sources: 0, outlines: 0, trisIn: 0, trisOut: 0, ms: 0, err: null };
  const _m = new THREE.Matrix4(), _c = new THREE.Color();

  function build() {
    const t0 = performance.now();
    const multi = !!renderer.extensions?.has?.('WEBGL_multi_draw');
    info.multiDraw = multi;
    // the sources: every plain mesh under the book's root whose material another one shares (or a big one, cut
    // into cells), grouped by material and by whether it takes shadows
    const all = [];
    root.traverse((o) => { if (o.isMesh && !o.isBatchedMesh && !o.isSkinnedMesh && !o.userData.isOutline && !Array.isArray(o.material) && !o.morphTargetInfluences && o.geometry?.attributes?.position && o.geometry.drawRange.count === Infinity && o.name !== 'routeShimmer') all.push(o); });
    const plain = (m) => m && !m.isShaderMaterial && (m.isMeshToonMaterial || m.isMeshBasicMaterial || m.isMeshLambertMaterial) && m.onBeforeCompile === THREE.Material.prototype.onBeforeCompile;
    // (two opaque toon materials that differ only in vertex colours draw the same with white vertex colours:
    // the instance-coloured critters, birds and ink join the vertex-coloured book)
    const twinKey = (m) => (m.isMeshToonMaterial && !m.transparent && !m.map && !m.alphaMap && !m.emissiveMap
      ? [m.color.getHex(), m.emissive.getHex(), m.emissiveIntensity, m.side, m.opacity, m.gradientMap?.uuid, m.fog, m.alphaTest, m.depthWrite, m.depthTest, m.blending, m.polygonOffset, m.wireframe, m.flatShading].join('|') : null);
    const twins = new Map();
    for (const o of all) { const k = plain(o.material) && twinKey(o.material); if (k && (!twins.has(k) || (o.material.vertexColors && !twins.get(k).vertexColors))) twins.set(k, o.material); }
    const byMat = new Map();
    for (const o of all) {
      if (!plain(o.material)) continue;
      const k = twinKey(o.material);
      const m = (k && twins.get(k)) || o.material;
      let l = byMat.get(m);
      if (!l) byMat.set(m, (l = []));
      l.push(o);
    }
    const groups = new Map(); // material uuid + receiveShadow -> { mat, receive, recs }
    const outRecs = [];
    let outRef = null;
    for (const [mat, list] of byMat) {
      if (list.length < 2 && !CELLS[list[0].name]) continue;
      const names = ['position'];
      if (list.every((o) => o.geometry.attributes.normal)) names.push('normal');
      if (mat.vertexColors) names.push('color');
      if (mat.map || mat.alphaMap) { if (!list.every((o) => o.geometry.attributes.uv)) continue; names.push('uv'); }
      const solid = !mat.transparent && !mat.isMeshBasicMaterial; // (hidden faces: opaque lit voxels only)
      for (const o of list) {
        const flat = flatGeo(o.geometry, names, !o.material.vertexColors); // (a twin without vertex colours: white)
        if (!flat) continue;
        const nT = flat.position.array.length / 9;
        // faces nobody sees (VoxelBuilder geometry: non-indexed boxes)
        let mask = null;
        if (solid && !o.geometry.index) {
          const onPage = PAGE_CHECK.has(o.name) ? (() => { o.updateWorldMatrix(true, false); const e = o.matrixWorld.elements; return (x, z) => Math.abs(e[0] * x + e[8] * z + e[12]) < BOOK.halfW - 0.1 && Math.abs(e[2] * x + e[10] * z + e[14]) < BOOK.halfD - 0.1; })() : null;
          mask = hiddenFaces(flat.position.array, { bottoms: ON_PAGE(o), onPage });
        }
        // cells (the mesh's own x/z), by triangle centre
        const size = multi ? CELLS[o.name] : 0; // (without multi-draw each piece is a call of its own: no cells)
        const cells = new Map();
        const P = flat.position.array;
        for (let t = 0; t < nT; t++) {
          if (mask && mask[t]) continue;
          const k = size ? Math.floor((P[t * 9] + P[t * 9 + 3] + P[t * 9 + 6]) / 3 / size) + ',' + Math.floor((P[t * 9 + 2] + P[t * 9 + 5] + P[t * 9 + 8]) / 3 / size) : '0';
          let l = cells.get(k);
          if (!l) cells.set(k, (l = []));
          l.push(t);
        }
        const cellTris = [...cells.values()];
        if (!cellTris.length) continue;
        info.trisIn += nT; info.trisOut += cellTris.reduce((n, l) => n + l.length, 0);
        const key = mat.uuid + (o.receiveShadow ? 'r' : '');
        let G = groups.get(key);
        if (!G) groups.set(key, (G = { mat, receive: o.receiveShadow, recs: [], name: o.name || o.parent?.name || 'mesh' }));
        G.recs.push({ obj: o, geos: cellTris.map((l) => pickTris(flat, l)), n: o.isInstancedMesh ? o.instanceMatrix.count : 1, body: true });
        // its outline (a child of a mesh; the sibling sharing an instanced mesh's matrices)
        const ol = o.isInstancedMesh ? o.parent?.children.find((c) => c !== o && c.userData.isOutline && c.instanceMatrix === o.instanceMatrix) : o.children.find((c) => c.isMesh && c.userData.isOutline);
        const px = ol && outlinePx(ol.material);
        if (ol && px != null && ol.geometry?.attributes?.normal) {
          const og = ol.geometry;
          const same = (og.index ? og.index.count / 3 : og.attributes.position.count / 3) === nT; // (toon.js outlineGeometry keeps the body's triangle order)
          const col = ol.material.color.clone();
          outRef = outRef || ol.material;
          outRecs.push({ obj: ol, geos: same ? cellTris.map((l) => pickOutline(og, l, px, col)) : [pickOutline(og, null, px, col)], n: ol.isInstancedMesh ? ol.instanceMatrix.count : 1, body: false });
        }
      }
    }
    const made = [];
    // see-through pieces (a window's pane, its additive halo, its spill on the ground) are drawn in an order the
    // renderer picks per mesh, back to front among siblings: so each such material gets one batch per place in
    // that order (rank), and every frame each piece is drawn by the batch of its current rank (see ranks())
    const seeThrough = (m) => m.transparent && !m.alphaTest;
    for (const G of groups.values()) if (seeThrough(G.mat)) for (const r of G.recs) { const p = r.obj.parent; if (!p) continue; if (!rankSets.has(p)) rankSets.set(p, []); rankSets.get(p).push(r.obj); }
    for (const G of groups.values()) {
      if (!seeThrough(G.mat)) { made.push(makeBatch(`homeBatch-${G.name}`, G.mat, G.recs, { cast: !G.mat.isMeshBasicMaterial, receive: G.receive, sort: true })); continue; }
      const nRank = Math.max(...G.recs.map((r) => rankSets.get(r.obj.parent)?.length || 1));
      for (let k = 0; k < nRank; k++) made.push(makeBatch(`homeBatch-${G.name}#${k}`, G.mat, G.recs.map((r) => ({ ...r })), { cast: false, receive: G.receive, sort: true, rank: k }));
    }
    if (outRecs.length && outRef) made.push(makeBatch('homeBatch-outlines', batchOutlineMaterial(outRef), outRecs, { cast: false, receive: false, sort: false }));
    for (const G of groups.values()) for (const r of G.recs) for (const g of r.geos || []) g.dispose(); // (each batch keeps its own copy)
    for (const r of outRecs) for (const g of r.geos || []) g.dispose();
    // all made: now the originals leave the camera's layer (the copies take over)
    for (const B of made) {
      scene.add(B.mesh);
      batches.push(B);
      for (const r of B.recs) r.obj.layers.mask = HIDDEN;
      info.sources += B.recs.length;
      if (B.mesh.name === 'homeBatch-outlines') info.outlines = B.recs.length;
    }
    info.batches = batches.length;
    info.ms = Math.round(performance.now() - t0);
  }

  function makeBatch(name, material, recs, { cast, receive, sort, rank = -1 }) {
    let nInst = 0, nV = 0, nI = 0;
    for (const r of recs) for (const g of r.geos) { nInst += r.n; nV += g.attributes.position.count; nI += g.index ? g.index.count : 0; }
    const mesh = new THREE.BatchedMesh(nInst, nV, nI, material);
    mesh.name = name;
    mesh.frustumCulled = false; // (each piece is culled on its own, for the camera and for the sun)
    mesh.perObjectFrustumCulled = true;
    mesh.sortObjects = sort;
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    mesh.raycast = () => {};
    // (a see-through rank batch draws after the ranks before it, still among its originals' render order)
    mesh.renderOrder = (recs[0].obj.renderOrder || 0) + (rank > 0 ? rank * 0.01 : 0);
    const B = { mesh, recs, rank, vis: new Uint8Array(nInst).fill(1), frame: -1, colors: false };
    for (const r of recs) {
      const gids = r.geos.map((g) => mesh.addGeometry(g));
      r.ids = [];
      for (let j = 0; j < r.n; j++) r.ids.push(gids.map((gid) => mesh.addInstance(gid)));
      r.mw = new Float64Array(16).fill(NaN);
      r.ver = -1; r.cver = -1;
      r.vis = false;
      if (r.obj.isInstancedMesh && r.obj.instanceColor) B.colors = true;
    }
    mesh.onBeforeRender = function (renderer, sc, camera, geometry, mat, group) {
      if (rank >= 0) ranks(renderer, camera);
      sync(B, renderer, false);
      THREE.BatchedMesh.prototype.onBeforeRender.call(this, renderer, sc, camera, geometry, mat, group);
    };
    mesh.onBeforeShadow = function (renderer, object, camera, shadowCamera, geometry, depthMaterial) {
      sync(B, renderer, true);
      THREE.BatchedMesh.prototype.onBeforeRender.call(this, renderer, null, shadowCamera, geometry, depthMaterial);
    };
    return B;
  }

  /** Each see-through original's place among its batched siblings this frame, as the renderer sorts them
   *  (render order, then farther first by the centre of its geometry's bounding sphere, then id). */
  const rankSets = new Map(), rankOf = new Map(), _v = new THREE.Vector3(), _pm = new THREE.Matrix4();
  let rankFrame = -1;
  function ranks(renderer, camera) {
    const frame = renderer.info.render.frame;
    if (frame === rankFrame) return;
    rankFrame = frame;
    _pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    for (const list of rankSets.values()) {
      for (const o of list) {
        const g = o.geometry;
        if (!g.boundingSphere) g.computeBoundingSphere();
        o.userData.rankZ = _v.copy(g.boundingSphere.center).applyMatrix4(o.matrixWorld).applyMatrix4(_pm).z;
      }
      list.sort((a, b) => (a.renderOrder - b.renderOrder) || (b.userData.rankZ - a.userData.rankZ) || (a.id - b.id));
      list.forEach((o, i) => rankOf.set(o, i));
    }
  }

  /** Is the original shown (it and every parent up to the scene)? Hidden on the camera's layer by us is fine. */
  function shown(o) {
    const L = o.layers.mask;
    if (L !== HIDDEN) {
      if (!(L & 1)) return false; // someone else took it off the camera's layer: so does its copy
      o.layers.mask = HIDDEN; // someone put it back on the camera's layer: the copy draws it, not it
    }
    for (let p = o; p; p = p.parent) { if (!p.visible) return false; if (p === scene) return true; }
    return false;
  }

  function sync(B, renderer, shadowPass) {
    const mesh = B.mesh;
    const frame = renderer.info.render.frame;
    if (frame !== B.frame) {
      B.frame = frame;
      for (const r of B.recs) {
        const o = r.obj;
        r.vis = shown(o);
        if (!r.vis) continue;
        const e = o.matrixWorld.elements;
        let moved = false;
        for (let k = 0; k < 16; k++) if (r.mw[k] !== e[k]) { moved = true; r.mw[k] = e[k]; }
        if (o.isInstancedMesh) {
          const im = o.instanceMatrix;
          if (moved || im.version !== r.ver) {
            r.ver = im.version;
            for (let j = 0; j < r.n; j++) { _m.fromArray(im.array, j * 16).premultiply(o.matrixWorld); for (const id of r.ids[j]) mesh.setMatrixAt(id, _m); }
          }
          const ic = o.instanceColor;
          if (ic && ic.version !== r.cver) {
            r.cver = ic.version;
            for (let j = 0; j < r.n; j++) { _c.fromArray(ic.array, j * 3); for (const id of r.ids[j]) mesh.setColorAt(id, _c); }
          }
        } else if (moved) for (const id of r.ids[0]) mesh.setMatrixAt(id, o.matrixWorld);
      }
    }
    for (const r of B.recs) {
      const on = r.vis && (!shadowPass || (r.body && r.obj.castShadow)) && (B.rank < 0 || rankOf.get(r.obj) === B.rank);
      const count = r.obj.isInstancedMesh ? r.obj.count : 1;
      for (let j = 0; j < r.n; j++) {
        const want = on && j < count ? 1 : 0;
        for (const id of r.ids[j]) if (B.vis[id] !== want) { B.vis[id] = want; mesh.setVisibleAt(id, !!want); }
      }
    }
  }

  const api = {
    update(x = 0, z = 0, all = false) {
      if (!built) {
        // (first the renderer, from the scene's next draw: whether it draws many pieces in one call decides the cells)
        if (!renderer) {
          if (!hooked) {
            hooked = true;
            const prev = scene.onBeforeRender;
            const mine = function (r, ...a) { renderer = r; if (scene.onBeforeRender === mine) scene.onBeforeRender = prev; return prev.call(this, r, ...a); };
            scene.onBeforeRender = mine;
          }
        } else {
          built = true;
          try { build(); } catch (err) { info.err = String(err?.message || err); console.warn('homeBookBudget', err); }
        }
      }
      for (const b of bits) {
        const far = !all && Math.hypot(b.x - x, b.z - z) > FAR_BITS;
        if (b.o.visible === far) b.o.visible = !far;
      }
      for (const q of quiet) if (q.castShadow) q.castShadow = false;
      if (paint) { const near = all || bookDist(x, z) <= FAR_PAINT; if (paint.visible !== near) paint.visible = near; } // (index.js hides the whole book past 82 m)
    },
    stats: () => ({ ...info, bits: bits.length, quiet: quiet.length, list: batches.map((B) => `${B.mesh.name}: ${B.recs.length} src, ${B.mesh.instanceCount} pieces`) }),
  };
  scene.userData.homeBookBudget = api; // (tests read its stats)
  return api;
}
