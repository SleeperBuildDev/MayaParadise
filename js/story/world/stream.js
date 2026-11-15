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

export function createStreamer({ scene, net, edges, shadows = false, low = false, cut = null, extraGlows = null, onReady = null, onGone = null, offPaper = null, shadowArea = null }) {
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
    cullTrees(true);
  }
  // a tree's pose this frame: its turn, and a little sway (update() writes every drawn tree's each frame)
  let swayAt = 0;
  const poseTree = (it, t) => m4.compose(p.set(it.x, 0, it.z), q.setFromEuler(e.set(Math.sin(t * 0.9 + it._ph) * 0.018, it._ry, Math.sin(t * 0.7 + it._ph * 1.3) * 0.022, 'YXZ')), sc.setScalar(it.s || 1));
  // only the trees the camera can see (or whose shadow may fall into view), inside the haze
  // (checked again just before each draw with the camera of that very frame (viewNow): checked only every SCAN
  // with the camera of the frame before, the trees at the screen's edge popped in late while the camera swung
  // between the car's view and the walking view, and a tree just off screen took its shadow on screen with it)
  const frustum = new THREE.Frustum(), pv = new THREE.Matrix4(), sph = new THREE.Sphere();
  let viewOk = false, viewFar = 1e9;
  const camAt = new THREE.Vector3();
  const treeBuf = [];
  function cullTrees(force = false) {
    for (const kind in pools) {
      const P = pools[kind];
      const L = treeBuf;
      L.length = 0;
      for (const it of P.all) {
        if (viewOk) {
          const s = it.s || 1;
          if (Math.hypot(it.x - camAt.x, it.z - camAt.z) > viewFar + 4) continue;
          sph.center.set(it.x, 2.2 * s, it.z); sph.radius = 4.5 * s;
          if (!frustum.intersectsSphere(sph)) {
            // its shadow: the crown (about 4 m up) laid along the sun onto the ground
            sph.center.set(it.x + sunX * 3.2 * s, 0.5, it.z + sunZ * 3.2 * s); sph.radius = 3.4 * s + Math.hypot(sunX, sunZ) * 1.6 * s;
            if (!shadows || !frustum.intersectsSphere(sph)) continue;
          }
        }
        L.push(it);
      }
      let same = !force && L.length === P.list.length;
      for (let k = 0; same && k < L.length; k++) if (L[k] !== P.list[k]) same = false;
      if (same) continue;
      P.list.length = 0;
      for (const it of L) P.list.push(it);
      P.list.forEach((it, k) => P.mesh.setMatrixAt(k, poseTree(it, swayAt)));
      P.mesh.count = P.outline.count = P.list.length;
      P.mesh.instanceMatrix.needsUpdate = true;
      P.mesh.computeBoundingSphere();
      P.outline.computeBoundingSphere();
    }
  }
  /** Per culling pass: outlines off far away, shadows cast only where the sun's shadow map is drawn, nothing past the haze. */
  function cullCells(fx, fz, fogFar) {
    for (const ch of chunks.values()) {
      if (ch.state !== 'ready' || !ch.cells) continue;
      for (const c of ch.cells) {
        const dc = Math.hypot(Math.max(c.x0 - camAt.x, 0, camAt.x - c.x1), Math.max(c.z0 - camAt.z, 0, camAt.z - c.z1));
        // (view depth is at most ~10% shorter than the distance inside a phone's narrow view)
        c.near = dc * 0.9 < fogFar + 2;
        c.mesh.visible = c.near && c.inView !== false;
        c.inked = dc < OUTLINE_R;
        if (c.outline) c.outline.visible = c.inked && c.boxSeen !== false;
        if (!c.cast) continue;
        if (shadowArea && !shadowArea.isEmpty()) {
          // a block casts while its shadow can land inside the patch the sun's shadow map covers (index.js moves it
          // with her; main.js fits the map to the view inside it). Only within SHADOW_R of her, a whole block of
          // houses took its shadows on and off at once, 14 m up the street in the middle of the screen, as she walked.
          // (a block off screen with its shadow off screen is not drawn at all: viewCells)
          const h = Math.min(c.box ? c.box.max.y : 8, 30), ox = sunX * h, oz = sunZ * h;
          const a = shadowArea;
          // (4 m to spare: the patch moves on between two passes, up to 2.5 m at the car's top speed)
          c.mesh.castShadow = Math.min(c.x0, c.x0 + ox) - 4 < a.max.x && Math.max(c.x1, c.x1 + ox) + 4 > a.min.x
            && Math.min(c.z0, c.z0 + oz) - 4 < a.max.z && Math.max(c.z1, c.z1 + oz) + 4 > a.min.z;
        } else c.mesh.castShadow = Math.hypot(Math.max(c.x0 - fx, 0, fx - c.x1), Math.max(c.z0 - fz, 0, fz - c.z1)) < SHADOW_R;
      }
    }
  }
  // Per frame: a block (and its outline) or a piece of ground the camera cannot see is not drawn at all (three.js'
  // own test uses a loose sphere, so blocks behind the lens or past the top of a phone screen were still drawn).
  // A block that casts the sun's shadow stays while that shadow can fall into view (its box swept along the sun).
  const vFr = new THREE.Frustum(), vM = new THREE.Matrix4(), vBox = new THREE.Box3(), vSun = new THREE.Vector3(), vTgt = new THREE.Vector3();
  let sun = null, sunScan = 0;
  let sunX = 0, sunZ = 0; // the sun's shadow offset on the ground per metre of height (viewCells keeps it current)
  // The view test runs again right before the scene is drawn, with the camera this frame is drawn from: update()
  // runs before the camera rig moves the camera, so its test used the frame before's, and while the camera swung
  // (the car's view <-> the walking view, a turn) a block at the screen's edge was left out for a frame.
  let viewCam = null, viewLive = true;
  // A block kept only for the shadow it lays into view (its own box off screen) is drawn into the sun's map but not
  // on screen: three.js lists what the camera draws before it draws the sun's map, so it is hidden for that list and
  // shown again for the shadow pass (one draw call a frame each, not two).
  const shadowOnly = [];
  const shadowHooked = new WeakSet();
  function hookShadowPass(renderer) {
    const sm = renderer?.shadowMap;
    if (!sm || shadowHooked.has(sm)) return;
    shadowHooked.add(sm);
    const render0 = sm.render;
    sm.render = function () {
      for (const c of shadowOnly) c.mesh.visible = true;
      shadowOnly.length = 0;
      return render0.apply(this, arguments);
    };
  }
  const beforeRender0 = scene.onBeforeRender;
  scene.onBeforeRender = function (renderer, sc0, camera) {
    if (typeof beforeRender0 === 'function') beforeRender0.apply(this, arguments);
    for (const c of shadowOnly) c.mesh.visible = true; // (a frame whose shadow pass did not run)
    shadowOnly.length = 0;
    if (!viewLive || !viewOk || !camera || camera !== viewCam || hold || !api.viewCull) return;
    try {
      camAt.setFromMatrixPosition(camera.matrixWorld);
      frustum.setFromProjectionMatrix(pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      cullTrees();
      viewCells(camera);
      if (shadows && renderer?.shadowMap?.enabled) {
        hookShadowPass(renderer);
        for (const ch of chunks.values()) {
          if (ch.state !== 'ready' || !ch.cells) continue;
          for (const c of ch.cells) if (c.mesh.visible && !c.boxSeen) { c.mesh.visible = false; shadowOnly.push(c); }
        }
      }
    } catch (err) { viewLive = false; console.warn('stream view', err); }
  };
  function showAll() {
    for (const ch of chunks.values()) {
      if (ch.state !== 'ready' || !ch.cells) continue;
      for (const c of ch.cells) { c.inView = true; c.boxSeen = true; c.mesh.visible = c.near !== false; if (c.outline) c.outline.visible = c.inked !== false; }
      for (const o of ch.group.children) if (o.name === 'ground') o.visible = true;
    }
  }
  function viewCells(camera) {
    if ((sunScan -= 1) <= 0) { sunScan = 120; sun = null; scene.traverse((o) => { if (!sun && o.isDirectionalLight && o.castShadow) sun = o; }); }
    let sx = 0, sz = 0; // shadow offset on the ground per metre of height
    if (sun) {
      sun.getWorldPosition(vSun); sun.target.getWorldPosition(vTgt);
      vTgt.sub(vSun);
      const dn = Math.max(0.12, -vTgt.y);
      sx = vTgt.x / dn; sz = vTgt.z / dn;
    }
    sunX = sx; sunZ = sz;
    vFr.setFromProjectionMatrix(vM.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    const M = 1.5; // (a margin: the sun's map is fitted to the view with a texel's slack, and edges may round)
    for (const ch of chunks.values()) {
      if (ch.state !== 'ready' || !ch.cells) continue;
      for (const c of ch.cells) {
        if (!c.box) { const g = c.mesh.geometry; if (!g.boundingBox) g.computeBoundingBox(); c.box = g.boundingBox.clone().applyMatrix4(c.mesh.matrixWorld); }
        vBox.copy(c.box).expandByScalar(M);
        let seen = vFr.intersectsBox(vBox);
        // (a block kept only for the shadow it lays into view: its ink hull is off screen, and casts nothing)
        c.boxSeen = seen;
        if (c.outline) c.outline.visible = c.inked !== false && seen;
        if (!seen && c.mesh.castShadow) {
          const h = Math.min(c.box.max.y, 30), ox = sx * h, oz = sz * h;
          vBox.min.x = Math.min(c.box.min.x, c.box.min.x + ox) - M; vBox.max.x = Math.max(c.box.max.x, c.box.max.x + ox) + M;
          vBox.min.z = Math.min(c.box.min.z, c.box.min.z + oz) - M; vBox.max.z = Math.max(c.box.max.z, c.box.max.z + oz) + M;
          vBox.min.y = -0.5; vBox.max.y = c.box.max.y + M;
          // (only the part of that shadow inside the patch the sun's map covers can show: the long evening shadows of
          // blocks far off the side of the screen kept them all drawn for nothing)
          const a = shadowArea && !shadowArea.isEmpty() ? shadowArea : null;
          if (a) {
            vBox.min.x = Math.max(vBox.min.x, a.min.x - M); vBox.max.x = Math.min(vBox.max.x, a.max.x + M);
            vBox.min.z = Math.max(vBox.min.z, a.min.z - M); vBox.max.z = Math.min(vBox.max.z, a.max.z + M);
          }
          seen = (!a || (vBox.min.x <= vBox.max.x && vBox.min.z <= vBox.max.z)) && vFr.intersectsBox(vBox);
        }
        c.inView = seen;
        c.mesh.visible = c.near !== false && seen;
      }
      for (const o of ch.group.children) {
        if (o.name !== 'ground') continue;
        if (!o.userData.vbox) { const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); o.userData.vbox = g.boundingBox.clone().applyMatrix4(o.matrixWorld); }
        o.visible = vFr.intersectsBox(vBox.copy(o.userData.vbox).expandByScalar(M));
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
    viewCull: true, // (false: blocks off screen are drawn again; for a same-frame comparison)
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
        viewCam = camera;
        if (!camera || hold || !api.viewCull) showAll();
        for (const ch of chunks.values()) {
          if (!ch.useful) continue;
          ch.dist = rectDist(ch, fx, fz);
          if (ch.state !== 'empty' && ch.dist > DROP_R && !hold) drop(ch);
          else if (ch.state === 'empty' && ch.dist < LOAD_R && !queue.includes(ch) && current !== ch) queue.push(ch);
        }
        queue.sort((a, b) => a.dist - b.dist);
      }
      if (camera && !hold && api.viewCull) { camera.updateMatrixWorld(); viewCells(camera); }
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
      swayAt = t;
      for (const kind in pools) {
        const P = pools[kind];
        for (let k = 0; k < P.list.length; k++) P.mesh.setMatrixAt(k, poseTree(P.list[k], t));
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
      viewLive = false;
      for (const ch of chunks.values()) drop(ch);
      for (const kind in pools) { pools[kind].mesh.geometry.dispose(); pools[kind].mesh.dispose(); pools[kind].outline.dispose(); }
      glows.geometry.dispose(); glows.dispose();
      painted?.dispose();
      scene.remove(root);
    },
  };
  return api;
}
