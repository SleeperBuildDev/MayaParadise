// Real-time sun shadows on every tier. Every solid object casts and everything lit receives.
//  - The world's shadow camera is fitted each frame to exactly what the game camera sees (the
//    ground footprint of the view frustum, a portrait phone's tall trapezoid), clamped to the book,
//    and snapped to whole shadow texels so shadow edges never swim while the car drives.
//  - Rooms get their own key-light shadow fitted once to the room box (it never moves).
//  - markShadows() decides who casts / receives: opaque lit solids cast and receive; outlines,
//    unlit glows/signs, transparent and tiny bits do not. userData.shadow overrides it.
import * as THREE from './three.js';

/** Shadow-map sizes per tier (world follows the camera; rooms are static). */
export const SHADOW_MAP = {
  world: { low: 1024, mid: 2048, high: 2048 },
  room: { low: 1024, mid: 1024, high: 2048 },
};
/** PCF softness (shadow.radius, in texels) per tier. */
const SOFTNESS = { low: 1, mid: 2.5, high: 3 };

/** Turns shadow maps on (all tiers: low uses a smaller map). Returns true when enabled. */
export function enableShadows(renderer, tier = 'mid') {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap; // filtered + soft in r186 (PCFSoft was folded into it)
  renderer.shadowMap.autoUpdate = true;
  return true;
}

// ------------------------------------------------------------------ casters / receivers
function isUnlit(m) {
  return !m || m.isMeshBasicMaterial || m.isLineBasicMaterial || m.isPointsMaterial || m.isSpriteMaterial || (m.isShaderMaterial && !m.lights);
}

/**
 * Marks shadow casters and receivers under `object` (call after building; cheap, no allocation
 * per frame). Rules, in order:
 *   1. userData.shadow on the mesh (or on any ancestor): 'both' | 'cast' | 'receive' | 'none'.
 *   2. outlines (userData.isOutline), back-face hulls, unlit (basic / shader) and transparent
 *      materials: none.
 *   3. opaque lit meshes smaller than `minCaster` (bounding-sphere radius, metres): receive only.
 *   4. every other opaque lit mesh: cast + receive.
 * opts: { minCaster = 0.05 }
 */
export function markShadows(object, { minCaster = 0.05 } = {}) {
  const visit = (o, inherited) => {
    const role = o.userData.shadow || inherited;
    if (o.isMesh) applyRole(o, role, minCaster);
    for (const c of o.children) visit(c, role);
  };
  visit(object, null);
  return object;
}

const _s = new THREE.Vector3();
function applyRole(o, role, minCaster) {
  const mats = Array.isArray(o.material) ? o.material : [o.material];
  if (o.userData.isOutline || mats.some((m) => m && m.side === THREE.BackSide && isUnlit(m))) {
    o.castShadow = o.receiveShadow = false;
    return;
  }
  if (role) {
    o.castShadow = role === 'both' || role === 'cast';
    o.receiveShadow = role === 'both' || role === 'receive';
    return;
  }
  const unlit = mats.every(isUnlit);
  const clear = mats.some((m) => m && m.transparent && !m.alphaTest);
  if (unlit || clear) {
    o.castShadow = o.receiveShadow = false;
    return;
  }
  o.receiveShadow = true;
  const g = o.geometry;
  if (!g.boundingSphere) g.computeBoundingSphere();
  o.getWorldScale(_s);
  const r = (g.boundingSphere?.radius || 0) * Math.max(_s.x, _s.y, _s.z);
  o.castShadow = r >= minCaster;
}

/** Back-compat: opaque lit meshes in an object cast (and receive) shadows. */
export function markCasters(object, on = true) {
  if (!on) {
    object.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    return object;
  }
  return markShadows(object);
}
/** Back-compat: lit opaque meshes receive shadows. */
export function markReceivers(object) {
  object.traverse((o) => {
    if (!o.isMesh || o.userData.isOutline) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.every(isUnlit) || mats.some((m) => m && m.transparent && !m.alphaTest)) return;
    o.receiveShadow = true;
  });
  return object;
}

// ------------------------------------------------------------------ the sun shadow controller
const UP = new THREE.Vector3(0, 1, 0);
const NDC = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

/**
 * Turns the scene's first directional light into a fitted, texel-snapped shadow caster.
 * opts: { tier = 'mid', mapSize, kind = 'world' | 'room', box: Box3 (fit once, rooms),
 *         bounds: Box3 (world: never cover more than this), heights = [0, 4.5] (planes the
 *         camera footprint is measured on), maxDistance = 70, extent (legacy follow box) }
 * Returns { light, fitCamera(camera), fitBox(box3), follow(target), texel, dispose() }.
 */
export function setupSceneShadows(scene, opts = {}) {
  const { tier = 'mid', kind = opts.box ? 'room' : 'world', heights = [0, 4.5], maxDistance = 70, bounds = null } = opts;
  let sun = null;
  scene.traverse((o) => { if (!sun && o.isDirectionalLight) sun = o; });
  if (!sun) return null;
  const maxTex = 4096;
  const size = Math.min(maxTex, opts.mapSize || SHADOW_MAP[kind]?.[tier] || 1024);
  sun.castShadow = true;
  sun.shadow.mapSize.set(size, size);
  sun.shadow.radius = SOFTNESS[tier] ?? 2;
  sun.shadow.blurSamples = 8;
  if (!sun.target.parent) scene.add(sun.target);
  const cam = sun.shadow.camera;

  // light basis (Z toward the sun; matches the shadow camera's own lookAt basis)
  const Z = new THREE.Vector3(), X = new THREE.Vector3(), Y = new THREE.Vector3();
  const refreshBasis = () => {
    Z.subVectors(sun.position, sun.target.position);
    if (Z.lengthSq() < 1e-8) Z.set(-0.6, 0.65, 0.4);
    Z.normalize();
    X.crossVectors(UP, Z);
    if (X.lengthSq() < 1e-8) X.set(1, 0, 0);
    X.normalize();
    Y.crossVectors(Z, X);
  };
  refreshBasis();

  const D = 50; // light distance from the fitted centre (casters up to ~30 m tall stay inside)
  const DEPTH = 55; // depth range below the centre
  let curW = 0, curH = 0;
  const o = new THREE.Vector3(), p = new THREE.Vector3(), r = new THREE.Vector3(), c = new THREE.Vector3();
  const state = { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
  const reset = () => { state.minX = state.minY = state.minZ = Infinity; state.maxX = state.maxY = state.maxZ = -Infinity; };
  const addPoint = (q) => {
    const lx = q.dot(X), ly = q.dot(Y), lz = q.dot(Z);
    if (lx < state.minX) state.minX = lx;
    if (lx > state.maxX) state.maxX = lx;
    if (ly < state.minY) state.minY = ly;
    if (ly > state.maxY) state.maxY = ly;
    if (lz < state.minZ) state.minZ = lz;
    if (lz > state.maxZ) state.maxZ = lz;
  };

  // Apply the light-space rectangle: quantised size (stable texel size), texel-snapped centre.
  const apply = (margin, quant) => {
    let w = state.maxX - state.minX + margin * 2;
    let h = state.maxY - state.minY + margin * 2;
    w = Math.ceil(w / quant) * quant;
    h = Math.ceil(h / quant) * quant;
    // hysteresis: keep the current size unless it is too small or much too big (no size flicker)
    if (w <= curW && w > curW * 0.82) w = curW;
    if (h <= curH && h > curH * 0.82) h = curH;
    const tx = w / size, ty = h / size;
    const cx = Math.round((state.minX + state.maxX) / 2 / tx) * tx;
    const cy = Math.round((state.minY + state.maxY) / 2 / ty) * ty;
    const cz = state.maxZ; // top of the covered volume toward the sun
    c.copy(X).multiplyScalar(cx).addScaledVector(Y, cy).addScaledVector(Z, cz);
    sun.target.position.copy(c);
    sun.position.copy(c).addScaledVector(Z, D);
    sun.target.updateMatrixWorld();
    sun.updateMatrixWorld();
    if (w !== curW || h !== curH) {
      curW = w; curH = h;
      cam.left = -w / 2; cam.right = w / 2; cam.top = h / 2; cam.bottom = -h / 2;
      cam.near = 0.5;
      cam.far = D + (state.maxZ - state.minZ) + DEPTH;
      cam.updateProjectionMatrix();
      // biases tuned for voxel faces: normal offset ~1.5 texels kills acne on faces at grazing
      // sun angles; a tiny depth bias avoids peter-panning under thin blocks.
      const texel = Math.max(tx, ty);
      sun.shadow.normalBias = texel * 1.5;
      sun.shadow.bias = -0.00025;
      ctl.texel = texel;
    }
  };

  const ctl = {
    light: sun,
    texel: 0,
    /**
     * World: fit to the camera's view each frame. Footprint = the frustum's corner rays hitting the
     * ground (heights[0]) and a roof-height plane (heights[1]), clamped to `bounds` and maxDistance.
     */
    fitCamera(camera) {
      camera.updateMatrixWorld();
      o.setFromMatrixPosition(camera.matrixWorld);
      reset();
      for (let i = 0; i < 4; i++) {
        r.set(NDC[i][0], NDC[i][1], 0.5).applyMatrix4(camera.projectionMatrixInverse).applyMatrix4(camera.matrixWorld).sub(o).normalize();
        for (let k = 0; k < heights.length; k++) {
          let t = r.y < -1e-4 ? (heights[k] - o.y) / r.y : maxDistance;
          if (!(t > 0) || t > maxDistance) t = maxDistance;
          p.copy(o).addScaledVector(r, t);
          if (bounds) {
            p.x = THREE.MathUtils.clamp(p.x, bounds.min.x, bounds.max.x);
            p.z = THREE.MathUtils.clamp(p.z, bounds.min.z, bounds.max.z);
            p.y = THREE.MathUtils.clamp(p.y, bounds.min.y, bounds.max.y);
          }
          addPoint(p);
        }
      }
      if (bounds) { // tall casters (towers, trees) inside the view still need their tops covered
        p.set(0, bounds.max.y, 0);
        const lz = p.dot(Z);
        if (lz > state.maxZ) state.maxZ = lz;
      }
      apply(1.0, 2);
    },
    /** Rooms (or any fixed area): fit once to a Box3. */
    fitBox(box) {
      reset();
      for (let i = 0; i < 8; i++) {
        p.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
        addPoint(p);
      }
      curW = curH = 0;
      apply(0.2, 0.25);
    },
    /** Legacy: a square box of `extent` metres around a target. */
    follow(target) {
      const e = opts.extent || 7;
      reset();
      for (let i = 0; i < 8; i++) {
        p.set(target.x + (i & 1 ? e : -e), target.y + (i & 2 ? e * 0.6 : -1), target.z + (i & 4 ? e : -e));
        addPoint(p);
      }
      apply(0, 1);
    },
    /** Call if the light was re-aimed (e.g. a different lighting preset). */
    refresh() { refreshBasis(); curW = curH = 0; },
    dispose() { sun.shadow.map?.dispose(); sun.shadow.map = null; },
  };
  if (opts.box) ctl.fitBox(opts.box);
  if (opts.receive !== false) markShadows(scene);
  return ctl;
}

/**
 * Shadows for a stand-alone scene (dev pages, previews): shadows on, casters marked and a sun
 * shadow fitted to `box` (default: the bounds of every shadow-casting mesh).
 */
export function stageScene(renderer, scene, { preset = 'outdoor', tier = 'high', box = null } = {}) {
  enableShadows(renderer, tier);
  markShadows(scene);
  let fit = box;
  if (!fit) {
    fit = new THREE.Box3();
    scene.traverse((o) => {
      if (!o.isMesh || !o.castShadow) return;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      if ((o.geometry.boundingSphere?.radius || 0) > 60) return;
      fit.expandByObject(o);
    });
    if (fit.isEmpty()) fit.set(new THREE.Vector3(-5, -1, -5), new THREE.Vector3(5, 5, 5));
  }
  return setupSceneShadows(scene, { tier, box: fit, kind: preset === 'indoor' ? 'room' : 'world', receive: false });
}
