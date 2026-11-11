// Real-time sun shadows for mid/high tiers: only Maya, the car and a few props cast; everything
// receives. The shadow box is small and follows the action, so the cost stays low on phones.
import * as THREE from './three.js';

export function enableShadows(renderer, tier) {
  const on = tier !== 'low';
  renderer.shadowMap.enabled = on;
  renderer.shadowMap.type = THREE.PCFShadowMap; // soft by default in r186 (PCFSoft is deprecated)
  return on;
}

/** Turn the scene's first directional light into a following shadow caster. */
export function setupSceneShadows(scene, { tier = 'mid', extent = 6, receive = true } = {}) {
  let sun = null;
  scene.traverse((o) => { if (!sun && o.isDirectionalLight) sun = o; });
  if (!sun) return null;
  const size = tier === 'high' ? 2048 : 1024;
  sun.castShadow = true;
  sun.shadow.mapSize.set(size, size);
  const cam = sun.shadow.camera;
  cam.left = -extent; cam.right = extent; cam.top = extent; cam.bottom = -extent;
  cam.near = 0.5; cam.far = 60;
  cam.updateProjectionMatrix();
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.025;
  sun.shadow.radius = 3;
  if (!sun.target.parent) scene.add(sun.target);
  const offset = sun.position.clone().sub(sun.target.position).normalize().multiplyScalar(22);
  if (receive) markReceivers(scene);
  return {
    light: sun,
    follow(target) {
      sun.target.position.copy(target);
      sun.position.copy(target).add(offset);
    },
  };
}

/** Opaque meshes in an object cast shadows (outlines, glows and transparent bits do not). */
export function markCasters(object, on = true) {
  object.traverse((o) => {
    if (!o.isMesh || o.userData.isOutline) return;
    const m = o.material;
    if (m && (m.transparent || m.side === THREE.BackSide)) return;
    o.castShadow = on;
  });
}

export function markReceivers(object) {
  object.traverse((o) => {
    if (!o.isMesh || o.userData.isOutline) return;
    const m = o.material;
    if (m && (m.isMeshBasicMaterial || m.transparent)) return;
    o.receiveShadow = true;
  });
}
