// Night shadows that follow the nearest light. After dark the one shadow-casting light (the moon) is blended toward
// the lit source nearest the player (a street lamp, lantern, stall bulb: every instance of the 'glows' / 'ow-glows'
// lamp-core meshes), so shadows of the player, the townsfolk, props and walls fall AWAY from that lamp and swing
// round as the player walks from lamp to lamp. Far from every lamp the moon's direction returns.
// No extra shadow maps, no extra draw calls: it only steers the existing light each frame.
import * as THREE from './three.js';

const NEAR = 5, FAR = 15; // metres: fully lamp-lit inside NEAR, back to the moon beyond FAR
const WARM = new THREE.Color('#FFD7A0');

export function createLampShadow({ scene, shadow, day, restore }) {
  const light = shadow?.light;
  const names = ['glows', 'ow-glows'];
  let pts = new Float32Array(0), nPts = 0, scanAt = -1e9, active = false;
  const cur = new THREE.Vector3(), tgt = new THREE.Vector3(), moon = new THREE.Vector3(), lampDir = new THREE.Vector3();
  const m4 = new THREE.Matrix4(), moonCol = new THREE.Color();
  let inited = false;

  function scan() {
    const list = [];
    for (const n of names) { const o = scene.getObjectByName(n); if (o?.isInstancedMesh) list.push(o); }
    let total = 0;
    for (const o of list) total += o.count;
    if (pts.length < total * 3) pts = new Float32Array(total * 3 + 96);
    nPts = 0;
    for (const o of list) {
      const e = o.instanceMatrix.array;
      for (let i = 0; i < o.count; i++) { const k = i * 16; pts[nPts * 3] = e[k + 12]; pts[nPts * 3 + 1] = e[k + 13]; pts[nPts * 3 + 2] = e[k + 14]; nPts++; }
    }
    void m4;
  }

  return {
    /** Per frame, before the shadow camera is fitted. fx, fz: where the player stands. */
    update(dt, t, fx, fz) {
      if (!light || !shadow?.setDir) return;
      const s = day.state, k = Math.max(0, Math.min(1, (s.lamps - 0.3) / 0.7));
      if (k <= 0.001) { if (active) { active = false; inited = false; restore?.(); } return; }
      if (t - scanAt > 1.5) { scan(); scanAt = t; }
      moon.set(s.sunDir[0], s.sunDir[1], s.sunDir[2]).normalize();
      let best = -1, bd = FAR * FAR;
      for (let i = 0; i < nPts; i++) {
        const dx = pts[i * 3] - fx, dz = pts[i * 3 + 2] - fz, d2 = dx * dx + dz * dz;
        if (d2 < bd) { bd = d2; best = i; }
      }
      let w = 0;
      if (best >= 0) {
        const d = Math.sqrt(bd);
        const x = Math.max(0, Math.min(1, (d - NEAR) / (FAR - NEAR)));
        w = (1 - x * x * (3 - 2 * x)) * k;
        const dx = pts[best * 3] - fx, dz = pts[best * 3 + 2] - fz, h = Math.hypot(dx, dz) || 0.001;
        lampDir.set(dx, Math.max(pts[best * 3 + 1], 0.45 * h, 0.8), dz).normalize(); // the lamp's side; never grazing the ground
      }
      tgt.copy(moon).lerp(lampDir, best >= 0 ? Math.min(0.92, w) : 0).normalize();
      if (!inited) { cur.copy(tgt); inited = true; } else cur.lerp(tgt, 1 - Math.exp(-dt * 3.5)).normalize();
      active = true;
      moonCol.set(s.sun);
      light.color.copy(moonCol).lerp(WARM, Math.min(0.85, w) * 0.8);
      shadow.setDir(cur);
    },
  };
}
