// Blocky building kit. Collect many coloured boxes, then merge them into ONE mesh with
// vertex colours (one draw call, plus one for its outline). This is how every blocky
// prop, building, room and character part in the game is made.
//
//   const v = new VoxelBuilder();
//   v.box(0, 0.5, 0, 1, 1, 1, PALETTE.wood);          // centre x,y,z + size w,h,d
//   v.boxMin(-1, 0, -1, 1, 0.1, 1, PALETTE.cream);    // min corner -> max corner
//   const mesh = v.mesh({ outline: true });             // toon + outline
import * as THREE from './three.js';
import { mergeGeometries } from './three.js';
import { toon, addOutline } from './toon.js';

const tmpColor = new THREE.Color();
const unitBox = new THREE.BoxGeometry(1, 1, 1);

export class VoxelBuilder {
  constructor() {
    this.parts = [];
  }

  /** Box by centre (x, y, z) and size (w, h, d). Optional rotY (radians) about its own centre. */
  box(x, y, z, w, h, d, color, rotY = 0) {
    const g = unitBox.clone();
    g.scale(w, h, d);
    if (rotY) g.rotateY(rotY);
    g.translate(x, y, z);
    this.#paint(g, color);
    this.parts.push(g);
    return this;
  }

  /** Box from min corner to max corner. */
  boxMin(x0, y0, z0, x1, y1, z1, color) {
    return this.box((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), color);
  }

  /** Any BufferGeometry (e.g. a cylinder for a lamp pole), painted one colour, placed by a Matrix4. */
  add(geometry, color, matrix = null) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (matrix) g.applyMatrix4(matrix);
    this.#paint(g, color);
    this.parts.push(g);
    return this;
  }

  /** Merge another builder's parts, transformed by a Matrix4 (to reuse sub-assemblies). */
  merge(other, matrix = null) {
    for (const p of other.parts) {
      const g = p.clone();
      if (matrix) g.applyMatrix4(matrix);
      this.parts.push(g);
    }
    return this;
  }

  /** Merged BufferGeometry with position, normal and color attributes. */
  geometry() {
    if (!this.parts.length) return new THREE.BufferGeometry();
    const nonIndexed = this.parts.map((p) => (p.index ? p.toNonIndexed() : p));
    for (const g of nonIndexed) {
      for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(name)) g.deleteAttribute(name);
    }
    const merged = mergeGeometries(nonIndexed, false);
    merged.computeBoundingSphere();
    merged.computeBoundingBox();
    return merged;
  }

  /** Mesh with the shared vertex-colour toon material. opts: { outline = true, px = 1.6 } */
  mesh(opts = {}) {
    const mesh = new THREE.Mesh(this.geometry(), toon('#ffffff', { vertexColors: true }));
    if (opts.outline !== false) addOutline(mesh, { px: opts.px ?? 1.6 });
    return mesh;
  }

  #paint(g, color) {
    tmpColor.set(color); // sRGB hex -> linear (colour management is on)
    const n = g.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = tmpColor.r;
      arr[i * 3 + 1] = tmpColor.g;
      arr[i * 3 + 2] = tmpColor.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  }
}

/** Slightly vary a colour (for planks, leaves, bricks) without leaving the palette's feel. */
export function jitter(hex, amount = 0.06, seed = 0) {
  const c = new THREE.Color(hex);
  const r = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  const f = 1 + ((r - Math.floor(r)) - 0.5) * 2 * amount;
  c.r = Math.min(1, c.r * f);
  c.g = Math.min(1, c.g * f);
  c.b = Math.min(1, c.b * f);
  return '#' + c.getHexString(THREE.SRGBColorSpace);
}
