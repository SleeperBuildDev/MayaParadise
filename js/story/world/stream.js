// Streams the open world in chunks around a focus point (Maya or the car): builds the chunks ahead of
// time in small slices (a few milliseconds a frame, so nothing hitches), disposes the far ones, and
// draws every loaded chunk's trees and lamp cores with shared instanced meshes.
//
//   const st = createStreamer({ scene, net, edges, shadows, onReady(chunk), onGone(chunk) })
//   st.update(dt, t, x, z, camera)  every world frame (focus: where the player is; the camera, for culling)
//   st.ensure(x, z)            builds the chunk(s) right under a point at once; the rest stream in
//   await st.ensureAsync(x, z) builds every chunk round a point, a slice per frame (behind a page-turn)
//   st.chunks                  Map 'i,j' -> chunk { i, j, x0, z0, x1, z1, items, state, group }
//   st.refresh(x0, z0, x1, z1) rebuilds the built chunks over a box at once (a gate opened or closed)
//   st.stats()                 { loaded, queued, tris }
//   st.dispose()
import * as THREE from '../../game/three.js';
import { basic, toon, addOutline, signTexture, signMesh } from '../../game/toon.js';
import { markShadows } from '../../game/shadows.js';
import { chunkJob, treeGeo, chunkOf, CELL } from './build.js';
import { CHUNK, GRID, ITEMS, REGIONS, LAZY, LOADED, regionReady } from './region.js';
import { disposeMesh } from './kit.js';
import { createStoryGround } from './ground.js';

const LOAD_R = 50; // metres from the focus to a chunk's edge: build it
const DROP_R = 78; // farther than this: dispose it
const AHEAD = 20; // the camera looks north: the focus sits this far north of the player
const BUDGET = 3.5; // ms of building per frame while moving
const TREE_CAP = 600;
const GLOW_CAP = 200;
// Phone budget (renderer.info per frame, shadow pass included): the camera sees a narrow wedge, so
// what it cannot see costs nothing, and what is far costs less:
const OUTLINE_R = 46; // a cell farther than this from the camera drops its outline (it is deep in the haze)
const SHADOW_R = 14; // only cells this close to the focus cast the sun's shadow (painted shadows do the rest)
const SCAN = 0.25; // seconds between culling passes

export function createStreamer({ scene, net, edges, shadows = false, low = false, cut = null, extraGlows = null, onReady = null, onGone = null, offPaper = null }) {
  const root = new THREE.Group();
  root.name = 'openWorld';
  scene.add(root);

  // ---- chunk table, items bucketed by the chunk that holds their anchor
  const chunks = new Map();
  for (let j = 0; j < GRID.rows; j++) for (let i = 0; i < GRID.cols; i++) {
    const x0 = GRID.x0 + i * CHUNK, z0 = GRID.z0 + j * CHUNK;
    chunks.set(`${i},${j}`, { key: `${i},${j}`, i, j, x0, z0, x1: x0 + CHUNK, z1: z0 + CHUNK, items: [], state: 'empty', group: null, job: null, dist: 0 });
  }
  for (const it of ITEMS) {
    const c = chunkOf(it.x, it.z);
    if (c) chunks.get(`${c[0]},${c[1]}`).items.push(it);
  }
  // a chunk with no paper, roads or items is never built (paper: a land region's rect, with a margin for
  // its page edge and the clouds tucked under it)
  const ownEdges = edges;
  const overlaps = (ch, a, b, c, d) => !(c < ch.x0 || a > ch.x1 || d < ch.z0 || b > ch.z1);
  for (const ch of chunks.values()) {
    ch.useful = ch.items.length > 0 || ownEdges.some((e) => overlaps(ch, e.box.minX, e.box.minZ, e.box.maxX, e.box.maxZ))
      || REGIONS.some((r) => overlaps(ch, r.rect[0] - 3, r.rect[1] - 3, r.rect[2] + 3, r.rect[3] + 3));
  }

  // ---- shared instanced trees (padauk, rain tree) and lamp cores
  const warm = new THREE.Color('#FFE6C2'), white = new THREE.Color('#FFFFFF');
  const pools = {};
  for (const kind of ['padauk', 'rain']) {
    const g = treeGeo(kind);
    const mesh = new THREE.InstancedMesh(g.geometry(), cut ? cut.trees : toon('#ffffff', { vertexColors: true }), TREE_CAP);
    mesh.name = 'ow-' + kind;
    mesh.count = 0;
    for (let k = 0; k < TREE_CAP; k++) mesh.setColorAt(k, k % 3 === 0 ? warm : white);
    root.add(mesh);
    const outline = addOutline(mesh, { px: 1.4 });
    if (cut) outline.material = cut.outline14;
    outline.count = 0;
    if (shadows) { mesh.castShadow = true; mesh.receiveShadow = true; }
    if (cut) mesh.customDepthMaterial = cut.depth;
    pools[kind] = { mesh, outline, list: [], all: [] };
  }
  const glows = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), basic('#FFE3A0'), GLOW_CAP);
  glows.name = 'ow-glows';
  glows.count = 0;
  root.add(glows);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();

  function rebuildPools() {
    for (const kind in pools) pools[kind].all.length = 0;
    let ng = 0;
    for (const ch of chunks.values()) {
      if (ch.state !== 'ready') continue;
      for (const it of ch.out.trees) {
        const P = pools[it.k];
        if (P.all.length < TREE_CAP) P.all.push(it);
      }
      const G = ch.out.glows;
      for (let k = 0; k < G.length && ng < GLOW_CAP; k += 3) {
        glows.setMatrixAt(ng++, m4.compose(p.set(G[k], G[k + 1], G[k + 2]), q.identity(), sc.set(0.26, 0.3, 0.26)));
      }
    }
    const X = extraGlows ? extraGlows() : null; // lit Bookmark Desk lamps
    if (X) for (let k = 0; k < X.length && ng < GLOW_CAP; k += 3) glows.setMatrixAt(ng++, m4.compose(p.set(X[k], X[k + 1], X[k + 2]), q.identity(), sc.set(0.26, 0.3, 0.26)));
    glows.count = ng;
    glows.instanceMatrix.needsUpdate = true;
    glows.computeBoundingSphere();
    for (const kind in pools) for (const it of pools[kind].all) {
      it._ry ??= ((it.x * 12.9898 + it.z * 78.233) % 6.283);
      it._ph ??= (it.x * 0.37 + it.z * 0.21) % 6.283;
    }
    cullTrees();
  }
  // only the trees the camera can see (or whose shadow may fall into view), inside the haze
  const frustum = new THREE.Frustum(), pv = new THREE.Matrix4(), sph = new THREE.Sphere();
  let viewOk = false, viewFar = 1e9;
  const camAt = new THREE.Vector3();
  function cullTrees() {
    for (const kind in pools) {
      const P = pools[kind];
      P.list.length = 0;
      for (const it of P.all) {
        if (viewOk) {
          const s = it.s || 1;
          if (Math.hypot(it.x - camAt.x, it.z - camAt.z) > viewFar + 4) continue;
          sph.center.set(it.x, 2.2 * s, it.z); sph.radius = 4.5 * s;
          if (!frustum.intersectsSphere(sph)) continue;
        }
        P.list.push(it);
      }
      P.list.forEach((it, k) => P.mesh.setMatrixAt(k, m4.compose(p.set(it.x, 0, it.z), q.setFromEuler(e.set(0, it._ry, 0)), sc.setScalar(it.s || 1))));
      P.mesh.count = P.outline.count = P.list.length;
      P.mesh.instanceMatrix.needsUpdate = true;
      P.mesh.computeBoundingSphere();
      P.outline.computeBoundingSphere();
    }
  }
  /** Per culling pass: outlines off far away, shadows cast only near the focus, nothing past the haze. */
  function cullCells(fx, fz, fogFar) {
    for (const ch of chunks.values()) {
      if (ch.state !== 'ready' || !ch.cells) continue;
      for (const c of ch.cells) {
        const dc = Math.hypot(Math.max(c.x0 - camAt.x, 0, camAt.x - c.x1), Math.max(c.z0 - camAt.z, 0, camAt.z - c.z1));
        // (view depth is at most ~10% shorter than the distance inside a phone's narrow view)
        c.mesh.visible = dc * 0.9 < fogFar + 2;
        if (c.outline) c.outline.visible = dc < OUTLINE_R;
        if (c.cast) c.mesh.castShadow = Math.hypot(Math.max(c.x0 - fx, 0, fx - c.x1), Math.max(c.z0 - fz, 0, fz - c.z1)) < SHADOW_R;
      }
    }
  }

  // ---- building and disposing
  const queue = [];
  let current = null;
  const ctx = { net, edges: ownEdges, isOpen: (e) => (net.isOpen ? net.isOpen(e) : true), offPaper };
  // lazy towns (townloader.js): a town not here yet adds no land and no roads (its chunks are rebuilt when it comes)
  if (LAZY) { ctx.regionOk = regionReady; ctx.edgeOk = (e) => !e.town || LOADED.has(e.town); }
  // the painted ground (ground.js, style C): one shared material for every chunk's ground, no extra draw calls;
  // its zone map follows the roads (refresh() below tells it when a gate changes them). ?ground=off: plain paper
  const painted = createStoryGround({ edges: ownEdges, isOpen: ctx.isOpen, low });

  function finish(ch) {
    const group = new THREE.Group();
    group.name = `chunk ${ch.key}`;
    if (!ch.ground.empty) {
      const g = ch.ground.mesh(painted ? { material: painted.material(toon('#ffffff', { vertexColors: true })) } : undefined);
      if (painted) painted.tag(g.geometry, ch.gKind);
      g.name = 'ground';
      g.userData.shadow = 'receive';
      group.add(g);
    }
    ch.cells = [];
    ch.solids.forEach((geo, k) => {
      if (!geo || geo.empty) return;
      const s = geo.mesh({ px: 1.5, material: cut?.solid });
      if (cut) s.customDepthMaterial = cut.depth;
      if (cut && s.children[0]) s.children[0].material = cut.outline; // see-through round Maya (cutaway.js)
      s.name = 'solid';
      group.add(s);
      const x0 = ch.x0 + (k & 1 ? CELL : 0), z0 = ch.z0 + (k & 2 ? CELL : 0);
      ch.cells.push({ mesh: s, outline: s.children[0] || null, x0, z0, x1: x0 + CELL, z1: z0 + CELL, cast: true });
    });
    ch.signMeshes = [];
    for (const s of ch.out.signs) {
      const tex = signTexture(s.lines.map((l) => ({ text: l.text, size: l.size, weight: l.weight, font: l.font === 'serif' ? '"Cormorant Garamond", Georgia, serif' : undefined, color: l.color })),
        { width: s.width || 512, height: s.height || 160, bg: s.bg === undefined ? '#F6F0E2' : s.bg, border: s.border === undefined ? '#A47A2C' : s.border, radius: 18, borderWidth: s.border === null ? 0 : 8 });
      const m = signMesh(tex, s.w, s.h);
      m.position.set(s.x, s.y, s.z);
      m.rotation.y = s.ry || 0;
      m.name = 'sign';
      m.userData.tex = tex;
      m.userData.ax = s.ax; m.userData.az = s.az; m.userData.tall = s.tall; // its item (a faded building hides its sign too)
      group.add(m);
      ch.signMeshes.push(m);
    }
    if (shadows) markShadows(group);
    for (const c of ch.cells) c.cast = c.mesh.castShadow;
    ch.ground = ch.solids = null; ch.gKind = null; // typed arrays can go
    ch.group = group;
    ch.state = 'ready';
    root.add(group);
    rebuildPools();
    onReady?.(ch);
  }
  function drop(ch) {
    if (ch.state === 'building' && current === ch) current = null;
    const qi = queue.indexOf(ch);
    if (qi >= 0) queue.splice(qi, 1);
    if (ch.group) {
      for (const m of ch.signMeshes || []) { m.userData.tex?.dispose(); m.material.dispose(); }
      for (const o of [...ch.group.children]) disposeMesh(o);
      root.remove(ch.group);
    }
    const was = ch.state === 'ready';
    ch.group = null; ch.job = null; ch.ground = ch.solids = null; ch.out = null; ch.signMeshes = null; ch.cells = null;
    ch.state = 'empty';
    if (was) { rebuildPools(); onGone?.(ch); }
  }
  /** Builds a chunk to the end right now (taking it off the queue). */
  function build(ch) {
    if (current === ch) current = null;
    const qi = queue.indexOf(ch);
    if (qi >= 0) queue.splice(qi, 1);
    while (!step(ch, 1e9));
  }
  function step(ch, budget) {
    const t0 = performance.now();
    if (!ch.job) { ch.state = 'building'; ch.job = chunkJob(ch, ctx); }
    for (;;) {
      const r = ch.job.next();
      if (r.done) { ch.job = null; finish(ch); return true; }
      if (performance.now() - t0 > budget) return false;
    }
  }
  const itemsBox = (items) => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const it of items) { a = Math.min(a, it.x); b = Math.min(b, it.z); c = Math.max(c, it.x); d = Math.max(d, it.z); } return a === Infinity ? [0, 0, 0, 0] : [a - 8, b - 8, c + 8, d + 8]; };
  const rectDist = (ch, x, z) => Math.hypot(Math.max(ch.x0 - x, 0, x - ch.x1), Math.max(ch.z0 - z, 0, z - ch.z1));

  const smokeBuf = [];
  let scanT = 0;
  let swayT = 0;
  let hold = false; // loadAll(): keep everything (overview shots, debugging)
  const api = {
    root,
    chunks,
    pools,
    /** Builds every chunk near (x, z) right now (used behind a page-turn, e.g. a desk teleport). */
    ensure(x, z) {
      // only what is right round her now (a few tens of ms); update() streams the rest in, nearest first
      for (const ch of chunks.values()) {
        if (!ch.useful || ch.state === 'ready') continue;
        if (rectDist(ch, x, z) < 8) build(ch);
      }
      scanT = 0;
    },
    /** Every chunk round (x, z), built a slice per frame so a page-turn animation keeps playing. */
    async ensureAsync(x, z, sliceMs = 10) {
      const todo = [...chunks.values()].filter((ch) => ch.useful && ch.state !== 'ready' && rectDist(ch, x, z - AHEAD) < LOAD_R)
        .sort((a, b) => rectDist(a, x, z) - rectDist(b, x, z));
      for (const ch of todo) {
        if (ch.state === 'ready') continue;
        if (current === ch) current = null;
        const qi = queue.indexOf(ch);
        if (qi >= 0) queue.splice(qi, 1);
        while (!step(ch, sliceMs)) await new Promise((r) => requestAnimationFrame(() => r()));
      }
      scanT = 0;
    },
    /** Debug: build every chunk and keep them all (a top-down overview); unhold() lets streaming drop them again. */
    loadAll() {
      hold = true;
      for (const ch of chunks.values()) if (ch.useful && ch.state !== 'ready') build(ch);
    },
    unhold() { hold = false; scanT = 0; },
    /** Rebuilds every built chunk over the box right now, swapping the new build in for the old (no gap):
     * a gate opened or closed (the boom, the tear, a road that was not there). Its people stay. */
    refresh(bx0, bz0, bx1, bz1) {
      painted?.roadsChanged(bx0, bz0, bx1, bz1); // (the strips of paper along the roads follow on the next update)
      for (const ch of chunks.values()) {
        if (ch.x1 < bx0 || ch.x0 > bx1 || ch.z1 < bz0 || ch.z0 > bz1) continue;
        if (ch.state === 'building') { if (current === ch) current = null; ch.job = null; ch.state = 'empty'; continue; }
        if (ch.state !== 'ready') continue;
        const old = { group: ch.group, signs: ch.signMeshes };
        ch.group = null; ch.signMeshes = null; ch.cells = null; ch.out = null; ch.job = null; ch.state = 'empty';
        const ready = onReady;
        onReady = null; // (the same chunk: its people are already there)
        try { build(ch); } finally { onReady = ready; }
        for (const m of old.signs || []) { m.userData.tex?.dispose(); m.material.dispose(); }
        for (const o of [...old.group.children]) disposeMesh(o);
        root.remove(old.group);
      }
      rebuildPools();
      scanT = 0;
    },
    /** Lazy towns: a town's items arrived (file them under their chunks; the caller refreshes the box). */
    addItems(items) {
      for (const it of items) {
        const c = chunkOf(it.x, it.z);
        if (!c) continue;
        const ch = chunks.get(`${c[0]},${c[1]}`);
        ch.items.push(it);
        ch.useful = true;
      }
      painted?.itemsChanged?.(...itemsBox(items));
    },
    /** Redraws the shared glows (a desk lamp was lit). */
    refreshGlows() { rebuildPools(); },
    update(dt, t, x, z, camera = null, fogFar = 1e9) {
      painted?.update();
      scanT -= dt;
      const fx = x, fz = z - AHEAD;
      if (scanT <= 0) {
        scanT = SCAN;
        if (camera) {
          camera.updateMatrixWorld();
          camAt.setFromMatrixPosition(camera.matrixWorld);
          frustum.setFromProjectionMatrix(pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
          viewOk = true; viewFar = fogFar;
          cullTrees();
          cullCells(x, z, fogFar);
        } else viewOk = false;
        for (const ch of chunks.values()) {
          if (!ch.useful) continue;
          ch.dist = rectDist(ch, fx, fz);
          if (ch.state !== 'empty' && ch.dist > DROP_R && !hold) drop(ch);
          else if (ch.state === 'empty' && ch.dist < LOAD_R && !queue.includes(ch) && current !== ch) queue.push(ch);
        }
        queue.sort((a, b) => a.dist - b.dist);
      }
      if (current && current.state === 'ready') current = null; // (finished by ensure)
      if (!current && queue.length) current = queue.shift();
      if (current && current.state === 'ready') current = null;
      if (current) {
        // the chunk under the player's feet goes first and faster (it must be there before they see it)
        const urgent = rectDist(current, x, z) < 6;
        if (step(current, urgent ? BUDGET * 3 : BUDGET)) current = null;
      }
      // trees sway a little (only every other frame on low phones)
      swayT += dt;
      if (low && swayT < 0.06) return;
      swayT = 0;
      for (const kind in pools) {
        const P = pools[kind];
        for (let k = 0; k < P.list.length; k++) {
          const it = P.list[k];
          q.setFromEuler(e.set(Math.sin(t * 0.9 + it._ph) * 0.018, it._ry, Math.sin(t * 0.7 + it._ph * 1.3) * 0.022, 'YXZ'));
          P.mesh.setMatrixAt(k, m4.compose(p.set(it.x, 0, it.z), q, sc.setScalar(it.s || 1)));
        }
        if (P.list.length) P.mesh.instanceMatrix.needsUpdate = true;
      }
    },
    stats() {
      let loaded = 0, tris = 0;
      for (const ch of chunks.values()) {
        if (ch.state !== 'ready') continue;
        loaded++;
        ch.group.traverse((o) => { if (o.geometry?.index) tris += o.geometry.index.count / 3; });
      }
      return { loaded, queued: queue.length + (current ? 1 : 0), tris: Math.round(tris), trees: pools.padauk.list.length + pools.rain.list.length, glows: glows.count, ground: painted ? painted.info().mode : 'off' };
    },
    smokePoints() {
      const out = smokeBuf;
      out.length = 0;
      for (const ch of chunks.values()) if (ch.state === 'ready') for (let k = 0; k < ch.out.smoke.length; k += 3) out.push(ch.out.smoke[k], ch.out.smoke[k + 1], ch.out.smoke[k + 2]);
      return out;
    },
    dispose() {
      for (const ch of chunks.values()) drop(ch);
      for (const kind in pools) { pools[kind].mesh.geometry.dispose(); pools[kind].mesh.dispose(); pools[kind].outline.dispose(); }
      glows.geometry.dispose(); glows.dispose();
      painted?.dispose();
      scene.remove(root);
    },
  };
  return api;
}
