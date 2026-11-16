// Warm light from the story towns' windows after dark, in the Home Book's look (game/daytime.js buildWindowLights): a
// lit pane over the glass, a soft halo round the window and a spill of light on the ground in front of the low ones.
// Every lit window of the loaded chunks (build.js litWindows chose them while the chunk was built) is one instance of
// three shared unit quads: three draw calls for the whole open world after dark, none by day.
//
//   const wl = createWindowLights(root)   null when daytime.js has no town window materials (an older cached copy)
//   wl.rebuild(chunks)    from every ready chunk's out.windows (the streamer's rebuildPools, as the lamp cores)
//   wl.update()           every frame: drawn only while the hour's window light is up
//   wl.cut(slots)         the windows of a building the cutaway has faded go with it, and come back with it (index.js)
//   wl.source(push)       nightshadow.js addSource: each lit low window, facing out (who stands in its spill casts a
//                         shadow away from the house)
//   wl.count / wl.dispose()
import * as THREE from '../../game/three.js';
import * as dayKit from '../../game/daytime.js'; // (namespace: a browser still holding an older daytime.js keeps working)
import { WIN_STRIDE } from './build.js';

const WIN_CAP = 1024; // lit windows drawn at once (the chunks round her hold ~300-600)
const SPILL_Y = 0.176; // as the lamp pools (stream.js POOL_Y): just over the road's top, never cut off by the tarmac
const LOW = 4.5; // a window whose sill is lower than this over its ground spills light on it (as the Home Book's)

export function createWindowLights(root, { low = false } = {}) {
  const mats = dayKit.townWindowMaterials?.();
  if (!mats) return null;
  const col = new THREE.Color();
  // the pane is brighter toward the bottom (a lamp in the room), as the Home Book's: a grey ramp in the quad's own
  // vertex colours, times each window's warmth (its instance colour)
  const paneGeo = new THREE.PlaneGeometry(1, 1);
  const ramp = [];
  const pp = paneGeo.attributes.position;
  for (let v = 0; v < pp.count; v++) { const k = 1.12 - 0.36 * (pp.getY(v) + 0.5); ramp.push(k, k, k); }
  paneGeo.setAttribute('color', new THREE.Float32BufferAttribute(ramp, 3));
  const make = (geo, mat, name) => {
    const m = new THREE.InstancedMesh(geo, mat, WIN_CAP);
    m.name = name;
    m.count = 0;
    m.renderOrder = 3; // (after the lamp pools, as the Home Book's)
    m.frustumCulled = false; // (spread over every loaded chunk: one draw, its sphere would hold them all anyway)
    m.raycast = () => {};
    m.castShadow = m.receiveShadow = false;
    m.userData.shadow = 'none';
    m.visible = false;
    m.setColorAt(0, col.setRGB(1, 1, 1)); // (its colour buffer from the start: the shader is compiled once, with it)
    root.add(m);
    return m;
  };
  const panes = make(paneGeo, mats.panes, 'ow-winPanes');
  const halos = make(new THREE.PlaneGeometry(1, 1), mats.halos, 'ow-winHalos');
  const spills = make(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mats.spills, 'ow-winSpills');
  // what each instance shows when its building is not faded (cut() writes zeros over it, then these back)
  const base = { p: new Float32Array(WIN_CAP * 16), h: new Float32Array(WIN_CAP * 16), s: new Float32Array(WIN_CAP * 16) };
  const ax = new Float32Array(WIN_CAP), az = new Float32Array(WIN_CAP), spillOf = new Int16Array(WIN_CAP);
  const hidden = new Uint8Array(WIN_CAP);
  let n = 0, ns = 0, anyHidden = false;
  // the low lit windows as light sources: x, y, z, reach, nx, nz
  const lights = new Float32Array(WIN_CAP * 6);
  let nl = 0;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);

  let lastSlots = null, capWarned = false;
  function rebuild(chunks) {
    n = ns = nl = 0;
    anyHidden = false;
    hidden.fill(0);
    for (const ch of chunks.values()) {
      if (ch.state !== 'ready') continue;
      const L = ch.out.windows;
      if (n + L.length / WIN_STRIDE > WIN_CAP && !capWarned) { capWarned = true; console.warn('[windowlights] more lit windows than WIN_CAP: some are not drawn'); }
      for (let k = 0; k < L.length && n < WIN_CAP; k += WIN_STRIDE) {
        const x = L[k], y = L[k + 1], z = L[k + 2], w = L[k + 3], h = L[k + 4], nx = L[k + 5], nz = L[k + 6], warm = L[k + 9], gy = L[k + 10];
        q.setFromAxisAngle(up, Math.atan2(nx, nz)); // (the quads' +Z turned to face out of the window)
        m4.compose(p.set(x, y, z), q, sc.set(w, h, 1));
        m4.toArray(base.p, n * 16);
        panes.setColorAt(n, col.setRGB(warm, warm * 0.9, warm * 0.74));
        m4.compose(p.set(x + nx * 0.05, y, z + nz * 0.05), q, sc.set(2 * (w * 0.9 + 0.5), 2 * (h * 0.9 + 0.5), 1));
        m4.toArray(base.h, n * 16);
        halos.setColorAt(n, col.setRGB(warm, warm, warm));
        const sill = y - h / 2 - gy;
        spillOf[n] = -1;
        if (sill < LOW) {
          const reach = 1.2 + Math.max(0, sill) * 0.25;
          m4.compose(p.set(x + nx * reach * 0.8, SPILL_Y + gy, z + nz * reach * 0.8), q, sc.set(2 * (w * 0.8 + 0.5), 1, 2 * reach));
          m4.toArray(base.s, ns * 16);
          spills.setColorAt(ns, col.setRGB(warm, warm, warm));
          spillOf[n] = ns++;
          if (y < 5) { const o = nl++ * 6; lights[o] = x; lights[o + 1] = Math.max(y, 1.5); lights[o + 2] = z; lights[o + 3] = reach * 1.8 + 1.6; lights[o + 4] = nx; lights[o + 5] = nz; }
        }
        ax[n] = L[k + 7]; az[n] = L[k + 8];
        n++;
      }
    }
    panes.instanceMatrix.array.set(base.p.subarray(0, n * 16));
    halos.instanceMatrix.array.set(base.h.subarray(0, n * 16));
    spills.instanceMatrix.array.set(base.s.subarray(0, ns * 16));
    panes.count = halos.count = n;
    spills.count = ns;
    for (const m of [panes, halos, spills]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    if (lastSlots) cut(lastSlots); // (a chunk came or went while a building was faded: its windows stay hidden)
  }

  // the faded buildings this frame (their items' origins): a few at most (cutaway.js BLOCKERS)
  const fx = new Float32Array(16), fz = new Float32Array(16);
  function cut(slots) {
    lastSlots = slots;
    let nf = 0;
    for (const sl of slots) if (sl.key !== null && sl.fade > 0.5 && nf < 16) { fx[nf] = sl.x; fz[nf] = sl.z; nf++; }
    if (!nf && !anyHidden) return;
    anyHidden = false;
    let changed = false;
    const P = panes.instanceMatrix.array, H = halos.instanceMatrix.array, S = spills.instanceMatrix.array;
    for (let i = 0; i < n; i++) {
      let hide = 0;
      for (let f = 0; f < nf; f++) if (Math.abs(fx[f] - ax[i]) + Math.abs(fz[f] - az[i]) < 0.02) { hide = 1; break; }
      if (hide) anyHidden = true;
      if (hide === hidden[i]) continue;
      hidden[i] = hide;
      changed = true;
      const o = i * 16, s = spillOf[i];
      if (hide) { P.fill(0, o, o + 16); H.fill(0, o, o + 16); if (s >= 0) S.fill(0, s * 16, s * 16 + 16); }
      else { P.set(base.p.subarray(o, o + 16), o); H.set(base.h.subarray(o, o + 16), o); if (s >= 0) S.set(base.s.subarray(s * 16, s * 16 + 16), s * 16); }
    }
    if (changed) { panes.instanceMatrix.needsUpdate = halos.instanceMatrix.needsUpdate = spills.instanceMatrix.needsUpdate = true; }
  }

  return {
    rebuild,
    cut,
    update() {
      const on = mats.panes.opacity > 0.015 && n > 0; // (by day: not drawn at all)
      panes.visible = on;
      halos.visible = on && !low; // (low graphics: no halos, the widest of the three see-through layers)
      spills.visible = on && ns > 0;
    },
    /** Lit windows light the night shadows (as daytime.js windowSource does the Home Book's) once they are well lit.
     *  Its own building faded or not, a window still counts: its light must not come and go as she walks behind it. */
    source(push) {
      if (!(mats.panes.opacity > 0.475)) return; // (state.windows > 0.5)
      for (let i = 0; i < nl; i++) { const o = i * 6; push(lights[o], lights[o + 1], lights[o + 2], lights[o + 3], 0.85, lights[o + 4], lights[o + 5]); }
    },
    get count() { return n; },
    get lights() { return nl; },
    dispose() {
      for (const m of [panes, halos, spills]) { root.remove(m); m.geometry.dispose(); m.dispose(); } // (the materials are daytime.js's: kept)
    },
  };
}
