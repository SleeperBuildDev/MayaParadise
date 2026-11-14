// Every soft round contact shadow (toon.js blobShadow: one shared material, a 1 x 1 plane) drawn as ONE
// instanced mesh per scene instead of one draw call each: people, Maya, the car, the props that carry one.
// Same look: the same material and plane, each copy at its original's world matrix, drawn first among the
// see-through things (renderOrder -1), as before.
//
//   installBlobPool(game)        once; wraps renderer.render so the copies follow this very frame
//   game.blobPool.on = false     back to one draw call each (a same-frame comparison); .stats()
//
// The originals stay where they are, untouched, only moved off the camera's layer (layer 28) while the pool
// draws them; a blob nobody shows (hidden, or taken off the camera's layer by someone else) is not drawn. A blob
// drawn on its own is noticed by its material's onBeforeRender and taken over from the next frame.
import * as THREE from '../../game/three.js';
import { blobShadow } from '../../game/toon.js';

const OURS = 1 << 28; // layer mask of an original while its copy draws it
const CAP = 512;

export function installBlobPool(game) {
  if (game.blobPool) return game.blobPool;
  const renderer = game.renderer;
  const probe = blobShadow();
  const mat = probe.material; // (the shared blob material)
  probe.geometry.dispose();
  const plane = new THREE.PlaneGeometry(1, 1);
  const pools = new Map(); // scene -> { mesh, list: Set }
  const fr = new THREE.Frustum(), pm = new THREE.Matrix4(), sph = new THREE.Sphere(), sc = new THREE.Vector3();
  let drawn = 0, failed = false;

  function poolFor(scene) {
    let P = pools.get(scene);
    if (P) return P;
    const mesh = new THREE.InstancedMesh(plane, mat, CAP);
    mesh.name = 'blobPool';
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.renderOrder = -1;
    mesh.matrixAutoUpdate = false;
    mesh.castShadow = mesh.receiveShadow = false;
    mesh.raycast = () => {};
    mesh.userData.blobPool = true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);
    P = { mesh, list: new Set(), seen: performance.now() };
    pools.set(scene, P);
    return P;
  }
  const release = (o) => { if (o.layers.mask === OURS) o.layers.mask = o.userData.blobMask ?? 1; };

  // a blob still drawn on its own: take it over (from the next frame on)
  const before0 = mat.onBeforeRender;
  mat.onBeforeRender = function (r, scene, camera, geometry, object) {
    before0?.apply(this, arguments);
    if (!api.on || failed || !object || object.isInstancedMesh || !scene?.isScene) return;
    poolFor(scene).list.add(object);
  };

  function sync(scene, camera) {
    const P = pools.get(scene);
    if (!P) return;
    P.seen = performance.now();
    if (P.mesh.parent !== scene) scene.add(P.mesh);
    P.mesh.castShadow = P.mesh.receiveShadow = false;
    camera.updateMatrixWorld();
    fr.setFromProjectionMatrix(pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    const camMask = camera.layers.mask;
    let n = 0;
    for (const o of P.list) {
      let p = o, vis = true;
      for (; p && p !== scene; p = p.parent) if (!p.visible) vis = false;
      if (p !== scene || o.material !== mat) { release(o); P.list.delete(o); continue; } // (gone, or dressed differently)
      const L = o.layers.mask;
      if (L !== OURS) {
        if (!(L & camMask)) continue; // someone else took it off the camera's layer
        o.userData.blobMask = L;
        o.layers.mask = OURS;
      }
      if (!vis || !((o.userData.blobMask ?? 1) & camMask) || n >= CAP) continue;
      o.updateWorldMatrix(true, false);
      sph.center.setFromMatrixPosition(o.matrixWorld);
      sc.setFromMatrixScale(o.matrixWorld);
      sph.radius = Math.max(sc.x, sc.y, sc.z) * 0.75;
      if (!fr.intersectsSphere(sph)) continue;
      P.mesh.setMatrixAt(n++, o.matrixWorld);
    }
    P.mesh.count = n;
    if (n) P.mesh.instanceMatrix.needsUpdate = true;
    drawn = n;
  }
  function off() {
    for (const P of pools.values()) { for (const o of P.list) release(o); P.list.clear(); P.mesh.count = 0; }
  }

  // a scene not drawn for a while (a room left behind): its originals get their layer back, the pool lets go of it
  let pruneT = 0;
  function prune() {
    const now = performance.now();
    if (now - pruneT < 5000) return;
    pruneT = now;
    for (const [scene, P] of pools) {
      if (now - (P.seen || 0) < 8000) continue;
      for (const o of P.list) release(o);
      P.list.clear();
      P.mesh.removeFromParent();
      P.mesh.dispose();
      pools.delete(scene);
    }
  }

  const render0 = renderer.render;
  renderer.render = function (scene, camera) {
    if (api.on && !failed && scene?.isScene && camera) {
      try { sync(scene, camera); prune(); } catch (e) { failed = true; off(); console.warn('blobPool', e); }
    }
    return render0.apply(this, arguments);
  };

  let on = !/[?&]blobpool=off\b/.test(location.search);
  const api = {
    get on() { return on; },
    set on(v) { on = !!v; if (!on) off(); },
    stats() {
      let held = 0;
      for (const P of pools.values()) held += P.list.size;
      return { on, failed, scenes: pools.size, held, drawn };
    },
  };
  game.blobPool = api;
  return api;
}
