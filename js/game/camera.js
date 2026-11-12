// Camera rig: a fixed-angle "diorama" follow camera (always looking north, so up on the stick is
// up the screen) plus eased cinematic shots for story moments (close-ups, entering buildings).
import * as THREE from './three.js';

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function createCameraRig(camera) {
  const target = new THREE.Vector3();
  const lead = new THREE.Vector3();
  const desiredPos = new THREE.Vector3();
  const desiredLook = new THREE.Vector3();
  const curPos = new THREE.Vector3(0, 20, 20);
  const curLook = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  let follow = { tilt: 52, width: 12, widthLandscape: 22, height: 0.6, bounds: null, zoom: 1, stiffness: 6 };
  let shot = null; // { fromPos, fromLook, toPos, toLook, t, dur, resolve }
  let holding = false;
  let pin = null; // fn(posOut, lookOut) called every frame while pinned (first-person views)
  let pinStiff = 10;

  function distanceForWidth(width) {
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    return width / 2 / Math.tan(hfov / 2);
  }

  function distanceForHeight(height) {
    return height / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  }

  function computeFollow() {
    const portrait = camera.aspect < 1;
    const width = (portrait ? follow.width : follow.widthLandscape) * follow.zoom;
    // minHeight: never show less than this much top-to-bottom (wide laptop screens in rooms)
    const d = Math.max(distanceForWidth(width), follow.minHeight ? distanceForHeight(follow.minHeight * follow.zoom) : 0);
    const tilt = THREE.MathUtils.degToRad(follow.tilt);
    desiredLook.copy(target).add(lead);
    desiredLook.y = target.y + follow.height;
    if (follow.bounds) {
      const b = follow.bounds;
      desiredLook.x = THREE.MathUtils.clamp(desiredLook.x, b.minX, b.maxX);
      desiredLook.z = THREE.MathUtils.clamp(desiredLook.z, b.minZ, b.maxZ);
    }
    desiredPos.set(desiredLook.x, desiredLook.y + Math.sin(tilt) * d, desiredLook.z + Math.cos(tilt) * d);
  }

  return {
    camera,
    /** Follow settings: { tilt, width, widthLandscape, height, bounds, zoom, stiffness } */
    setFollow(opts) { follow = { ...follow, ...opts }; },
    get follow() { return follow; },
    setTarget(v, leadVec) { target.copy(v); if (leadVec) lead.copy(leadVec); else lead.set(0, 0, 0); },
    /** Jump straight to the follow position (after a scene change). */
    snap() { computeFollow(); curPos.copy(desiredPos); curLook.copy(desiredLook); shot = null; holding = false; this.apply(); },
    /**
     * Cinematic move to position/look over `dur` seconds, then hold there until release().
     * Returns a promise that resolves when the move finishes.
     */
    shot(position, lookAt, dur = 1.0) {
      pin = null;
      return new Promise((resolve) => {
        if (shot?.resolve) shot.resolve();
        shot = { fromPos: curPos.clone(), fromLook: curLook.clone(), toPos: position.clone(), toLook: lookAt.clone(), t: 0, dur: Math.max(0.001, dur), resolve };
        holding = true;
      });
    },
    /** Shot relative to a subject: azimuth 0 = from the south (camera side), degrees. */
    orbitShot(subject, { dist = 3, height = 1.2, azimuth = 20, lookHeight = 0.8, dur = 1.0 } = {}) {
      const a = THREE.MathUtils.degToRad(azimuth);
      const pos = new THREE.Vector3(subject.x + Math.sin(a) * dist, subject.y + height, subject.z + Math.cos(a) * dist);
      const look = new THREE.Vector3(subject.x, subject.y + lookHeight, subject.z);
      return this.shot(pos, look, dur);
    },
    release() { holding = false; pin = null; if (shot?.resolve) shot.resolve(); shot = null; },
    /** Steer the camera every frame with fn(pos, look); eased in with `stiffness`. unpin() or shot() ends it. */
    pin(fn, stiffness = 10) { if (shot?.resolve) shot.resolve(); shot = null; pin = fn; pinStiff = stiffness; holding = true; },
    unpin() { pin = null; },
    get cinematic() { return holding; },
    update(dt) {
      computeFollow();
      if (pin) {
        pin(desiredPos, desiredLook);
        const k = 1 - Math.exp(-dt * pinStiff);
        curPos.lerp(desiredPos, k);
        curLook.lerp(desiredLook, k);
        this.apply();
        return;
      }
      if (shot) {
        shot.t += dt / shot.dur;
        const k = ease(Math.min(1, shot.t));
        curPos.lerpVectors(shot.fromPos, shot.toPos, k);
        curLook.lerpVectors(shot.fromLook, shot.toLook, k);
        if (shot.t >= 1) { const r = shot.resolve; shot.resolve = null; r?.(); }
      } else if (!holding) {
        const k = 1 - Math.exp(-dt * follow.stiffness);
        curPos.lerp(desiredPos, k);
        curLook.lerp(desiredLook, k);
      }
      this.apply();
    },
    apply() {
      camera.position.copy(curPos);
      camera.lookAt(curLook);
    },
    /** World point -> CSS pixels; returns null when behind the camera. */
    project(v, w, h, outV = tmp) {
      outV.copy(v).project(camera);
      if (outV.z > 1) return null;
      return { x: (outV.x * 0.5 + 0.5) * w, y: (-outV.y * 0.5 + 0.5) * h };
    },
  };
}
