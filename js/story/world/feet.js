// Feet on the ground (story mode, the open world). Everyone who walks (Maya, every townsperson made by
// people.js) is placed by its own code at y = 0, the paper. But the paper is not all at 0: a road's cream top
// stands 0.14 m above it (ROAD.top), a footpath 0.033 m, a pad 0.19 m, a kerb or doorstep up to ~0.2 m, so
// on all of those their feet and shins sank out of sight. Once a frame, after every update and before the
// render, this lifts each of them onto the surface drawn under their feet.
//
//   const feet = createFeet(game, { streamer, net })   world/index.js; feet.settle() at the end of ow.update
//   feet.heightAt(x, z)  the surface's height there (m): the book's roads and pads worked out from the road
//                        net; out on the land, read from the chunk's own ground and low solid meshes (their
//                        flat tops, indexed by 1 m tile once per mesh), cached on a 0.2 m grid
//   feet.under(x, z)     the highest of those under a pair of feet (a road's edge under one shoe counts)
//   feet.enabled         false puts everyone back where their code put them (tests: before / after)
//
// Never lower: y = max(what their code set, the surface). Someone a script set at a height on purpose (a
// bench, a stair) keeps it; a seated person (hips lowered on a stool) is not lifted onto the stool's top.
// Only characters standing in the world scene, or in a day's level set group in it (not in the car, not in a room),
// are touched.
import * as THREE from '../../game/three.js';
import { ROAD } from '../../game/world/roads.js';
import { BOOK } from '../../game/world/world.js';
import { LIVE_PEOPLE } from '../people.js';
import { chunkOf } from './build.js';

const GRID = 0.2; // cache cell (m)
const CAP = 0.5; // highest ground surface read (m): never a table or counter top
const STEP = 0.23; // highest low solid (kerb, doorstep, low stage) someone standing is lifted onto (0.22 m kerbs: a hair over, for float error)
const MISS_TTL = 0.75; // s: a cell with no chunk built under it yet is read again after this
const SAFE = 0.004; // m: soles a hair above the surface (no z-fight with the painted decals)
const FIXED = { parent: true }; // (a cache cell's source that never goes: the home book)

export function createFeet(game, { streamer, net }) {
  const scene = game.world.scene;
  const W = ROAD.width / 2;
  // ---- the home book: its roads (one cream strip each, gold dashes and studs on top) and the arrival pads
  const bookEdges = net.edges.filter((e) => !e.region);
  const pads = (game.world.places || []).map((p) => p.pad).filter(Boolean);
  const onBook = (x, z) => Math.abs(x) <= BOOK.halfW && Math.abs(z) <= BOOK.halfD;
  function bookY(x, z) {
    let h = 0;
    for (const e of bookEdges) {
      if (x < e.box.minX - W || x > e.box.maxX + W || z < e.box.minZ - W || z > e.box.maxZ + W) continue;
      let best = Infinity;
      for (let i = 0; i < e.n - 1; i++) {
        const ax = e.xs[i], az = e.zs[i], dx = e.xs[i + 1] - ax, dz = e.zs[i + 1] - az;
        const L = dx * dx + dz * dz;
        const u = L > 1e-9 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)) : 0;
        const qx = ax + dx * u - x, qz = az + dz * u - z, d = qx * qx + qz * qz;
        if (d < best) best = d;
      }
      // (the cream top; the dashes and studs on it rise 0.016 more)
      if (best < W * W) h = Math.max(h, ROAD.top + (e.bias || 0) + 0.016);
    }
    for (const p of pads) {
      const d = Math.hypot(x - p.x, z - p.z);
      if (d < 1.12) h = Math.max(h, ROAD.top + (d < 0.98 ? 0.058 : 0.037)); // gold plate, cream sparkle (roads.js)
    }
    return Math.max(h, bookMeshY(x, z));
  }
  // ...and everything else low on it, read from the book's own meshes (the originals homebatch.js copies stay in the
  // scene, off the camera's layer): the plaza and the fountain's step, the painted paths, the landmarks' porches
  // and doorsteps. (Maya at the fountain and U Kyaw by his porch stood 10-12 cm deep in them.) Their flat tops up
  // to BOOK_CAP, in world metres, bucketed by 1 m tile once, the first time anyone stands on the book (~58k faces)
  const BOOK_CAP = 0.25;
  let bookTiles = null;
  function bookIndex() {
    bookTiles = new Map();
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), e = new THREE.Vector3();
    scene.traverse((o) => {
      if (!o.isMesh || o.isBatchedMesh || o.isSkinnedMesh) return;
      if (!(o.name === 'bookAndPlaza' || o.name === 'roadsAndInk' || (/-body$/.test(o.name) && /^landmark-/.test(o.parent?.name || '')))) return;
      o.updateMatrixWorld(true);
      const P = o.geometry.attributes.position, ix = o.geometry.index, M = o.matrixWorld;
      const T = ix ? ix.count / 3 : P.count / 3;
      for (let t = 0; t < T; t++) {
        const i0 = ix ? ix.getX(t * 3) : t * 3, i1 = ix ? ix.getX(t * 3 + 1) : t * 3 + 1, i2 = ix ? ix.getX(t * 3 + 2) : t * 3 + 2;
        a.fromBufferAttribute(P, i0).applyMatrix4(M); b.fromBufferAttribute(P, i1).applyMatrix4(M); c.fromBufferAttribute(P, i2).applyMatrix4(M);
        const lo = Math.min(a.y, b.y, c.y), hi = Math.max(a.y, b.y, c.y);
        if (hi < 0.003 || lo > BOOK_CAP || hi - lo > 0.08) continue; // (the bare page is 0 anyway; nothing tall; no slopes)
        n.subVectors(b, a).cross(e.subVectors(c, a));
        if (n.y <= 0.7 * n.length()) continue; // (flat tops only)
        const tri = [a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z];
        for (let j = Math.floor(Math.min(a.z, b.z, c.z)); j <= Math.floor(Math.max(a.z, b.z, c.z)); j++) {
          for (let i = Math.floor(Math.min(a.x, b.x, c.x)); i <= Math.floor(Math.max(a.x, b.x, c.x)); i++) {
            const k = (i + 32768) * 65536 + (j + 32768);
            (bookTiles.get(k) || bookTiles.set(k, []).get(k)).push(tri);
          }
        }
      }
    });
  }
  function bookMeshY(x, z) {
    if (!bookTiles) bookIndex();
    const T = bookTiles.get((Math.floor(x) + 32768) * 65536 + (Math.floor(z) + 32768));
    let best = 0;
    if (T) for (const q of T) {
      const d = (q[5] - q[8]) * (q[0] - q[6]) + (q[6] - q[3]) * (q[2] - q[8]);
      if (Math.abs(d) < 1e-12) continue;
      const u = ((q[5] - q[8]) * (x - q[6]) + (q[6] - q[3]) * (z - q[8])) / d, v = ((q[8] - q[2]) * (x - q[6]) + (q[0] - q[6]) * (z - q[8])) / d, w = 1 - u - v;
      if (u < -1e-4 || v < -1e-4 || w < -1e-4) continue;
      const y = u * q[1] + v * q[4] + w * q[7];
      if (y > best) best = y;
    }
    return best;
  }

  // ---- out on the land: what the chunk drew (roads, footpaths, plazas, decks; kerbs and steps). Each chunk
  // mesh gets, the first time someone stands on it, an index of its flat upward faces low enough to stand on,
  // bucketed by 1 m tile (one pass over its triangles); a height is then a few point-in-triangle tests
  const grounds = [], solids = [];
  function gather(x, z) {
    grounds.length = 0; solids.length = 0;
    const c = chunkOf(x, z);
    if (!c) return;
    // (a road quad or a porch reaches over its chunk's edge, and a big thing (a stage, a raised lawn) is drawn by the
    // chunk its middle stands in, metres over: every neighbour's meshes whose box holds (x, z). The old 2 m margin
    // left Maya 15-20 cm deep in a market stage step, a wharf planter and a raised lawn)
    // (the 3x3 chunks' ground and solid meshes with their boxes, listed once per chunk until any chunk changes)
    const k = (c[0] + 32768) * 65536 + (c[1] + 32768);
    let near = nearMeshes.get(k);
    if (!near) {
      near = [];
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
        const ch = streamer.chunks.get(`${c[0] + di},${c[1] + dj}`);
        if (!ch?.group) continue;
        for (const m of ch.group.children) {
          if (!m.isMesh || (m.name !== 'ground' && m.name !== 'solid')) continue;
          if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
          near.push(m);
        }
      }
      nearMeshes.set(k, near);
    }
    for (const m of near) {
      const bb = m.geometry.boundingBox;
      if (x < bb.min.x || x > bb.max.x || z < bb.min.z || z > bb.max.z) continue;
      (m.name === 'ground' ? grounds : solids).push(m);
    }
  }
  const nearMeshes = new Map();
  const INDEX = new WeakMap(); // mesh -> { x0, z0, cols, rows, tiles: [[a, b, c vertex indices...]], p: positions }
  function indexOf(mesh, cap) {
    let I = INDEX.get(mesh);
    if (I) return I;
    const g = mesh.geometry, P = g.attributes.position, N = g.attributes.normal, ix = g.index;
    if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox, x0 = Math.floor(bb.min.x), z0 = Math.floor(bb.min.z);
    const cols = Math.max(1, Math.ceil(bb.max.x) - x0 + 1), rows = Math.max(1, Math.ceil(bb.max.z) - z0 + 1);
    const tiles = new Array(cols * rows);
    const n = ix ? ix.count / 3 : P.count / 3;
    for (let t = 0; t < n; t++) {
      const a = ix ? ix.getX(t * 3) : t * 3, b = ix ? ix.getX(t * 3 + 1) : t * 3 + 1, c = ix ? ix.getX(t * 3 + 2) : t * 3 + 2;
      if (N && N.getY(a) < 0.7) continue; // (flat tops only: no walls, no undersides)
      const ay = P.getY(a), by = P.getY(b), cy = P.getY(c);
      if (Math.min(ay, by, cy) > cap) continue;
      if (Math.max(ay, by, cy) - Math.min(ay, by, cy) > 0.08) continue; // (no roof slopes)
      const ax = P.getX(a), bx = P.getX(b), cx = P.getX(c), az = P.getZ(a), bz = P.getZ(b), cz = P.getZ(c);
      const i0 = Math.max(0, Math.floor(Math.min(ax, bx, cx)) - x0), i1 = Math.min(cols - 1, Math.floor(Math.max(ax, bx, cx)) - x0);
      const j0 = Math.max(0, Math.floor(Math.min(az, bz, cz)) - z0), j1 = Math.min(rows - 1, Math.floor(Math.max(az, bz, cz)) - z0);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * cols + i; (tiles[k] || (tiles[k] = [])).push(a, b, c); }
    }
    I = { x0, z0, cols, rows, tiles, P };
    INDEX.set(mesh, I);
    return I;
  }
  /** The highest flat top of `mesh` at (x, z) no higher than cap, or -Infinity. (Chunk meshes sit at the origin.) */
  function topAt(mesh, x, z, cap) {
    const I = indexOf(mesh, cap);
    const i = Math.floor(x) - I.x0, j = Math.floor(z) - I.z0;
    if (i < 0 || j < 0 || i >= I.cols || j >= I.rows) return -Infinity;
    const T = I.tiles[j * I.cols + i];
    if (!T) return -Infinity;
    const P = I.P;
    let best = -Infinity;
    for (let k = 0; k < T.length; k += 3) {
      const a = T[k], b = T[k + 1], c = T[k + 2];
      const ax = P.getX(a), az = P.getZ(a), bx = P.getX(b), bz = P.getZ(b), cx = P.getX(c), cz = P.getZ(c);
      const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
      if (Math.abs(d) < 1e-12) continue;
      const u = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d, v = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d, w = 1 - u - v;
      if (u < -1e-4 || v < -1e-4 || w < -1e-4) continue;
      const y = u * P.getY(a) + v * P.getY(b) + w * P.getY(c);
      if (y <= cap && y > best) best = y;
    }
    return best;
  }
  function landY(x, z, out) {
    gather(x, z);
    out.ground = 0; out.solid = -Infinity;
    if (!grounds.length && !solids.length) return false;
    let g = -Infinity, s = -Infinity;
    for (const m of grounds) g = Math.max(g, topAt(m, x, z, CAP));
    for (const m of solids) s = Math.max(s, topAt(m, x, z, STEP));
    out.ground = g === -Infinity ? 0 : g;
    out.solid = s;
    out.src = grounds[0] || solids[0];
    return true;
  }

  // ---- the cache: cell -> { ground, solid, src (a mesh of the chunk it was read from), t }
  const cache = new Map();
  let clock = 0, chunkSig = 0;
  const key = (i, j) => (i + 32768) * 65536 + (j + 32768);
  function node(i, j) { // (the grid point (i, j) * GRID)
    const k = key(i, j);
    let c = cache.get(k);
    // (a chunk rebuilt or dropped since: its old meshes have left the scene, read again)
    if (c && (c.src ? c.src.parent : clock - c.t < MISS_TTL)) return c;
    if (cache.size > 40000) cache.clear();
    c = c || { ground: 0, solid: -Infinity, src: null, t: 0 };
    const cx = i * GRID, cz = j * GRID;
    if (onBook(cx, cz)) { c.ground = bookY(cx, cz); c.solid = -Infinity; c.src = FIXED; } // (the book never changes)
    else if (!landY(cx, cz, c)) c.src = null;
    c.t = clock;
    cache.set(k, c);
    return c;
  }

  // ---- how far the lowest sole hangs below the root this frame (a heel strike, a slumped pose): the shoes'
  // bottom vertices (found once per body geometry), skinned with this frame's bones
  const SOLES = new WeakMap();
  function soleIndices(geo) {
    let s = SOLES.get(geo);
    if (s) return s;
    const pos = geo.attributes.position;
    let min = Infinity;
    for (let i = 0; i < pos.count; i++) min = Math.min(min, pos.getY(i));
    const list = [], side = [];
    for (let i = 0; i < pos.count; i++) if (pos.getY(i) < min + 0.006) { list.push(i); side.push(pos.getX(i) < 0 ? 0 : 1); } // (the soles' bottom corners: the lowest point of a tilted shoe; side: which shoe, by the rest pose's x)
    s = { idx: Int32Array.from(list), side: Int8Array.from(side) };
    SOLES.set(geo, s);
    return s;
  }
  const tv = new THREE.Vector3();
  // (this frame's two shoes, from dipOf: the middle, and the heel and toe ends of the sole along the body's facing)
  const shoe = [{ x: 0, z: 0, n: 0, hx: 0, hz: 0, hf: 0, tx: 0, tz: 0, tf: 0 }, { x: 0, z: 0, n: 0, hx: 0, hz: 0, hf: 0, tx: 0, tz: 0, tf: 0 }];
  function dipOf(root, mesh) {
    shoe[0].n = shoe[1].n = 0;
    if (!mesh?.skeleton || !mesh.geometry?.attributes?.position) return 0;
    const { idx, side } = soleIndices(mesh.geometry);
    root.updateMatrixWorld(true);
    const e = root.matrixWorld.elements, fl = Math.hypot(e[8], e[10]) || 1, fx = e[8] / fl, fz = e[10] / fl; // (facing, flat)
    let min = Infinity;
    for (let k = 0; k < idx.length; k++) {
      mesh.getVertexPosition(idx[k], tv).applyMatrix4(mesh.matrixWorld);
      if (tv.y < min) min = tv.y;
      const f = shoe[side[k]], d = tv.x * fx + tv.z * fz;
      if (!f.n) { f.x = f.z = 0; f.hf = Infinity; f.tf = -Infinity; }
      f.x += tv.x; f.z += tv.z; f.n++;
      if (d < f.hf) { f.hf = d; f.hx = tv.x; f.hz = tv.z; }
      if (d > f.tf) { f.tf = d; f.tx = tv.x; f.tz = tv.z; }
    }
    return min === Infinity ? 0 : Math.max(0, Math.min(0.08, e[13] - min));
  }
  /** The highest surface under a shoe: at its middle and a fifth of the way in from its heel and its toe. (A shoe
   *  with its toe or heel a fifth over a road's edge or a doorstep stands on it; less is the overhang of a shoe.) */
  function shoeGround(f, standing) {
    const mx = f.x / f.n, mz = f.z / f.n;
    return Math.max(feet.heightAt(mx, mz, standing),
      feet.heightAt(f.hx + (f.tx - f.hx) * 0.2, f.hz + (f.tz - f.hz) * 0.2, standing),
      feet.heightAt(f.hx + (f.tx - f.hx) * 0.8, f.hz + (f.tz - f.hz) * 0.8, standing));
  }
  const exact = { ground: 0, solid: -Infinity, src: null };
  const hOf = (c, standing) => Math.max(c.ground, standing ? c.solid : -Infinity);
  const cam = game.camera.position;
  const NEAR2 = 40 * 40; // (the sole check only for the ones the camera can see well)

  const feet = {
    enabled: true,
    cache,
    /** The surface height at (x, z); standing: false leaves out kerbs and steps (someone sitting on one). */
    heightAt(x, z, standing = true) {
      const i = Math.floor(x / GRID), j = Math.floor(z / GRID);
      const h = hOf(node(i, j), standing);
      // the four grid points round (x, z) agree: that is the height. Where they differ, an edge (a road's, a kerb's)
      // runs between them: read the meshes at (x, z) itself. (The nearest grid point could be 0.14 m off: a pair of
      // shoes 0.2 m clear of a road was lifted onto it, Maya and Ko Min floating 11 cm over the footpath beside it)
      if (Math.abs(hOf(node(i + 1, j), standing) - h) < 0.002 && Math.abs(hOf(node(i, j + 1), standing) - h) < 0.002
        && Math.abs(hOf(node(i + 1, j + 1), standing) - h) < 0.002) return h;
      if (onBook(x, z)) return bookY(x, z);
      return landY(x, z, exact) ? hOf(exact, standing) : h;
    },
    /** The highest surface under a pair of feet at (x, z) (a road's edge under one shoe counts). */
    under(x, z, standing = true) {
      const F = 0.12;
      return Math.max(feet.heightAt(x, z, standing), feet.heightAt(x + F, z, standing), feet.heightAt(x - F, z, standing), feet.heightAt(x, z + F, standing), feet.heightAt(x, z - F, standing));
    },
    /** Once a frame, after everyone has moved (ow.update, last thing in story.update). */
    settle(dt = 0) {
      clock += dt;
      // a chunk built, rebuilt or dropped anywhere: read every cell again. (A road a neighbour chunk draws reaches
      // a metre over its edge: a cell first read before that neighbour was built kept the bare paper, and the
      // townsfolk standing on that road at Hearth Row sank to the knees; the cell's own chunk never changed)
      let sig = 0;
      for (const ch of streamer.chunks.values()) if (ch.group) sig = (Math.imul(sig, 31) + ch.group.id) | 0;
      if (sig !== chunkSig) { chunkSig = sig; nearMeshes.clear(); for (const [k, c] of cache) if (c.src !== FIXED) cache.delete(k); } // (the book's cells stay)
      const m = game.maya;
      // (Maya never sits out here; her crouches (a cheer, a jump's landing) drop the hips up to ~0.1 m and must not drop her
      // off a kerb into it)
      if (m?.root) lift(m.root, m.mesh, true);
      for (const [root, b] of LIVE_PEOPLE) lift(root, b.mesh, b.hips.position.y > b.hipY - 0.08);
    },
  };
  function lift(root, mesh, standing) {
    const p = root.position, u = root.userData;
    // what their own code put them at: unchanged since we lifted them means it is still the y from before
    let base = p.y;
    if (u.feetY !== undefined && p.y === u.feetY) base = u.feetBase;
    // standing in the world: straight in its scene, or in a day's own group that stands level in it (Day 2, 4, 5,
    // 6, 7 and 10 put their walk-ons in a set group: turned round y and moved is fine, tilted or scaled is not).
    // (wx, wz) where they stand, oy the group's height
    const par = root.parent;
    let ok = par === scene, wx = p.x, wz = p.z, oy = 0;
    if (!ok && par && root.visible) {
      let a = par;
      while (a && a !== scene && a.visible && a !== game.car?.root) a = a.parent; // (never in the car)
      const e = par.matrixWorld.elements;
      if (a === scene && Math.abs(e[1]) < 1e-4 && Math.abs(e[4]) < 1e-4 && Math.abs(e[6]) < 1e-4 && Math.abs(e[9]) < 1e-4 && Math.abs(e[5] - 1) < 1e-4
        && Math.abs(e[0] * e[0] + e[2] * e[2] - 1) < 1e-3) {
        ok = true; wx = e[0] * p.x + e[8] * p.z + e[12]; wz = e[2] * p.x + e[10] * p.z + e[14]; oy = e[13];
      }
    }
    if (!ok || !root.visible || !feet.enabled || base < -0.05) {
      if (u.feetY !== undefined && p.y === u.feetY) p.y = u.feetBase; // (back to their own y)
      u.feetY = undefined;
      return;
    }
    const dx = wx - cam.x, dz = wz - cam.z;
    const dip = dx * dx + dz * dz < NEAR2 ? dipOf(root, mesh) : (shoe[0].n = shoe[1].n = 0);
    // in view: the surface under each shoe itself (shoeGround: a sample 0.12 m out from the root lifted a pair of shoes
    // 2 cm clear of a road's edge onto it, floating 11 cm over the footpath). Far off: round the root
    const ground = shoe[0].n && shoe[1].n ? Math.max(shoeGround(shoe[0], standing), shoeGround(shoe[1], standing)) : feet.under(wx, wz, standing);
    const y = Math.max(base, ground - oy + dip + SAFE);
    u.feetBase = base;
    u.feetY = y;
    p.y = y;
  }
  return feet;
}
