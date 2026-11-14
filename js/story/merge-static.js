// Phone budget helper: the still meshes of a few props merged into one mesh per material (toon, outline,
// blob shadow ...), so a dressed square costs a handful of draw calls instead of one or two per prop.
// The props keep their roots (taps, walk keep-outs and positions still read them); only their meshes are
// taken off the camera's layer (children still draw: a skipped glow under a merged mesh stays). Merge only while nothing in them moves or rebuilds, and call undo() before changing them again.
//
//   const m = mergeStatic([tableA.root, vase.root], scene);   // -> { meshes, calls: [before, after], undo() }
import * as THREE from '../game/three.js';
import { mergeGeometries } from '../game/three.js';

const NOOP = THREE.Object3D.prototype.onBeforeRender;
const sig = (g) => `${Object.keys(g.attributes).sort().join(',')}|${g.index ? 'i' : 'n'}|${Object.keys(g.morphAttributes || {}).length}`;

export function mergeStatic(roots, parent, { name = 'merged-static' } = {}) {
  const groups = new Map();
  parent.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(parent.matrixWorld).invert();
  for (const r of roots) {
    if (!r) continue;
    r.updateMatrixWorld(true);
    r.traverseVisible((o) => {
      if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || !o.geometry || Array.isArray(o.material)) return;
      const mat = o.material;
      // animated bits (steam, glows that fade) are usually see-through: leave them be (blob shadows excepted)
      if (mat.transparent && o.renderOrder !== -1) return;
      const key = `${mat.uuid}|${o.renderOrder}|${sig(o.geometry)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(o);
    });
  }
  const meshes = [], hidden = [];
  let before = 0;
  const m4 = new THREE.Matrix4();
  for (const list of groups.values()) {
    before += list.length;
    const geos = list.map((o) => { const g = o.geometry.clone(); g.applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld)); return g; });
    const merged = geos.length > 1 ? mergeGeometries(geos, false) : geos[0];
    if (geos.length > 1) for (const g of geos) g.dispose();
    if (!merged) { before -= list.length; continue; } // (attributes did not line up: keep these as they are)
    const src = list[0];
    const mesh = new THREE.Mesh(merged, src.material);
    mesh.name = name;
    mesh.renderOrder = src.renderOrder;
    mesh.userData.isOutline = !!src.userData.isOutline;
    if (src.onBeforeRender !== NOOP) mesh.onBeforeRender = src.onBeforeRender;
    mesh.raycast = () => {};
    mesh.matrixAutoUpdate = false;
    parent.add(mesh);
    meshes.push(mesh);
    for (const o of list) { hidden.push([o, o.layers.mask]); o.layers.set(30); }
  }
  return {
    meshes,
    calls: [before, meshes.length],
    undo() {
      for (const [o, mask] of hidden) o.layers.mask = mask;
      for (const m of meshes) { m.removeFromParent(); m.geometry.dispose(); }
      hidden.length = 0;
      meshes.length = 0;
    },
  };
}
