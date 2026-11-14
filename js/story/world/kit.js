// A fast box builder for the open world: writes boxes straight into typed arrays (no BufferGeometry
// per box, no merge pass), and writes each box's outline hull at the same time (8 corners, smooth
// normals), so a whole chunk can be built in a few milliseconds and spread over frames.
//
//   const g = new Geo({ outline: true })
//   g.at(x, z, ry)                             place the next parts (item origin + turn; fronts face +Z)
//   g.box(x, y, z, w, h, d, colour, ry)        centre + size in the item's local space
//   g.boxMin(x0, y0, z0, x1, y1, z1, colour)
//   g.boxR(x, y, z, w, h, d, colour, rx, ry, rz)   any turn (Euler XYZ)
//   g.flat(x0, z0, x1, z1, y, colour)          a flat quad (ground decals; no outline)
//   g.flatR(cx, cz, w, d, y, colour, ry)
//   g.quad(a, b, c, d, colour, nx, ny, nz)     four world points (arrays), facing the normal
//   g.mesh({ px }) -> Mesh (+ outline child)   one toon draw call (+ one for the outline)
import * as THREE from '../../game/three.js';
import { toon, outlineMaterial } from '../../game/toon.js';

const _c = new THREE.Color();
const colCache = new Map();
/** sRGB hex -> linear [r, g, b] (cached). */
export function rgb(hex) {
  let v = colCache.get(hex);
  if (!v) { _c.set(hex); v = [_c.r, _c.g, _c.b]; colCache.set(hex, v); }
  return v;
}

/** Colour scaled brighter (k > 1) or darker (k < 1), as hex (cached). */
const shadeCache = new Map();
export function shade(hex, k) {
  const key = hex + k;
  let s = shadeCache.get(key);
  if (!s) {
    _c.set(hex);
    _c.setRGB(Math.min(1, _c.r * k), Math.min(1, _c.g * k), Math.min(1, _c.b * k));
    s = '#' + _c.getHexString();
    shadeCache.set(key, s);
  }
  return s;
}

/** Deterministic random numbers (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// faces: [normal axis, sign, u axis, sign, v axis, sign] with u x v = normal (counter-clockwise outside)
const FACES = [[0, 1, 1, 1, 2, 1], [0, -1, 2, 1, 1, 1], [1, 1, 2, 1, 0, 1], [1, -1, 0, 1, 2, 1], [2, 1, 0, 1, 1, 1], [2, -1, 1, 1, 0, 1]];
const QUAD = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
// outline hull: corner id = bit0 x+, bit1 y+, bit2 z+; 12 triangles, outward winding
const HULL = [];
for (const [na, ns, ua, us, va, vs] of FACES) {
  const ids = QUAD.map(([cu, cv]) => {
    const s = [0, 0, 0];
    s[na] = ns; s[ua] = us * cu; s[va] = vs * cv;
    return (s[0] > 0 ? 1 : 0) | (s[1] > 0 ? 2 : 0) | (s[2] > 0 ? 4 : 0);
  });
  HULL.push(ids[0], ids[1], ids[2], ids[0], ids[2], ids[3]);
}

const _m = new THREE.Matrix4(), _e = new THREE.Euler();
const AX = [new Float32Array(3), new Float32Array(3), new Float32Array(3)];
const HALF = new Float32Array(3);
const CEN = new Float32Array(3);

export class Geo {
  constructor({ outline = false, cap = 2048, anchors = false } = {}) {
    this.outline = outline;
    this.p = new Float32Array(cap * 3); this.n = new Float32Array(cap * 3); this.c = new Float32Array(cap * 3);
    // anchors: every vertex also carries its item's origin (x, z) and a "tall" flag (cutaway.js lets tall
    // things near the lens go whole, not as torn pieces)
    this.anchors = anchors;
    if (anchors) { this.a = new Float32Array(cap * 3); if (outline) this.oa = new Float32Array(cap * 1.5); }
    this.ax = 0; this.az = 0; this.tall = 0;
    this.i = new Uint32Array(cap * 2);
    this.nv = 0; this.ni = 0;
    if (outline) { this.op = new Float32Array(cap * 1.5); this.on = new Float32Array(cap * 1.5); this.oi = new Uint32Array(cap * 2); this.onv = 0; this.oni = 0; }
    this.tx = 0; this.ty = 0; this.tz = 0; this.tc = 1; this.ts = 0; this.ry = 0;
  }
  /** Item origin and turn for the following parts. */
  at(x, z, ry = 0, y = 0) { this.tx = x; this.ty = y; this.tz = z; this.ry = ry; this.tc = Math.cos(ry); this.ts = Math.sin(ry); return this; }
  /** The item the next parts belong to (anchors): its origin and whether it is tall. */
  item(x, z, tall) { this.ax = x; this.az = z; this.tall = tall ? 1 : 0; return this; }
  get tris() { return this.ni / 3; }
  get empty() { return this.nv === 0; }

  #grow(nv, ni) {
    if (this.nv + nv > this.p.length / 3) {
      const cap = Math.max(this.p.length * 2, (this.nv + nv) * 3 + 3000);
      for (const k of this.anchors ? ['p', 'n', 'c', 'a'] : ['p', 'n', 'c']) { const a = new Float32Array(cap); a.set(this[k]); this[k] = a; }
    }
    if (this.ni + ni > this.i.length) { const a = new Uint32Array(Math.max(this.i.length * 2, this.ni + ni + 3000)); a.set(this.i); this.i = a; }
  }
  #growO(nv, ni) {
    if (this.onv + nv > this.op.length / 3) {
      const cap = Math.max(this.op.length * 2, (this.onv + nv) * 3 + 1500);
      for (const k of this.anchors ? ['op', 'on', 'oa'] : ['op', 'on']) { const a = new Float32Array(cap); a.set(this[k]); this[k] = a; }
    }
    if (this.oni + ni > this.oi.length) { const a = new Uint32Array(Math.max(this.oi.length * 2, this.oni + ni + 1500)); a.set(this.oi); this.oi = a; }
  }
  /** local point -> world, written at out[o..o+2] */
  #wp(lx, ly, lz, out, o) {
    out[o] = this.tx + lx * this.tc + lz * this.ts;
    out[o + 1] = this.ty + ly;
    out[o + 2] = this.tz - lx * this.ts + lz * this.tc;
  }

  /** Box by centre and size (local space), turned by ry about its own centre. */
  box(x, y, z, w, h, d, color, ry = 0) {
    const a = this.ry + ry, c = Math.cos(a), s = Math.sin(a);
    AX[0][0] = c; AX[0][1] = 0; AX[0][2] = -s;
    AX[1][0] = 0; AX[1][1] = 1; AX[1][2] = 0;
    AX[2][0] = s; AX[2][1] = 0; AX[2][2] = c;
    this.#wp(x, y, z, CEN, 0);
    HALF[0] = w / 2; HALF[1] = h / 2; HALF[2] = d / 2;
    return this.#emit(color, CEN[1] - HALF[1] > this.ty + 0.002 || this.ty > 0.002 ? 1 : 0);
  }
  boxMin(x0, y0, z0, x1, y1, z1, color) {
    return this.box((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), color);
  }
  /** Box with any turn (Euler XYZ, local), e.g. a sloping roof slab or a leaning plank. */
  boxR(x, y, z, w, h, d, color, rx = 0, ry = 0, rz = 0) {
    _m.makeRotationFromEuler(_e.set(rx, ry + this.ry, rz, 'YXZ'));
    const m = _m.elements;
    for (let k = 0; k < 3; k++) { AX[k][0] = m[k * 4]; AX[k][1] = m[k * 4 + 1]; AX[k][2] = m[k * 4 + 2]; }
    this.#wp(x, y, z, CEN, 0);
    HALF[0] = w / 2; HALF[1] = h / 2; HALF[2] = d / 2;
    return this.#emit(color, 1);
  }
  #emit(color, bottom) {
    const [r, g, b] = rgb(color);
    const nf = bottom ? 6 : 5;
    this.#grow(nf * 4, nf * 6);
    const P = this.p, N = this.n, C = this.c, I = this.i;
    for (let f = 0; f < 6; f++) {
      const [na, ns, ua, us, va, vs] = FACES[f];
      if (!bottom && na === 1 && ns < 0 && AX[1][1] > 0.99) continue; // a box on the ground never shows its underside
      const nx = AX[na][0] * ns, ny = AX[na][1] * ns, nz = AX[na][2] * ns;
      const base = this.nv;
      for (let q = 0; q < 4; q++) {
        const cu = QUAD[q][0] * us, cv = QUAD[q][1] * vs;
        const o = this.nv * 3;
        for (let k = 0; k < 3; k++) {
          P[o + k] = CEN[k] + AX[na][k] * ns * HALF[na] + AX[ua][k] * cu * HALF[ua] + AX[va][k] * cv * HALF[va];
        }
        N[o] = nx; N[o + 1] = ny; N[o + 2] = nz;
        C[o] = r; C[o + 1] = g; C[o + 2] = b;
        if (this.anchors) { this.a[o] = this.ax; this.a[o + 1] = this.az; this.a[o + 2] = this.tall; }
        this.nv++;
      }
      I[this.ni++] = base; I[this.ni++] = base + 1; I[this.ni++] = base + 2;
      I[this.ni++] = base; I[this.ni++] = base + 2; I[this.ni++] = base + 3;
    }
    if (this.outline) {
      this.#growO(8, 36);
      const OP = this.op, ON = this.on, base = this.onv;
      for (let id = 0; id < 8; id++) {
        const sx = id & 1 ? 1 : -1, sy = id & 2 ? 1 : -1, sz = id & 4 ? 1 : -1;
        const o = this.onv * 3;
        let lx = 0, ly = 0, lz = 0;
        for (let k = 0; k < 3; k++) {
          OP[o + k] = CEN[k] + AX[0][k] * sx * HALF[0] + AX[1][k] * sy * HALF[1] + AX[2][k] * sz * HALF[2];
          const nk = AX[0][k] * sx + AX[1][k] * sy + AX[2][k] * sz;
          if (k === 0) lx = nk; else if (k === 1) ly = nk; else lz = nk;
        }
        const l = Math.hypot(lx, ly, lz) || 1;
        ON[o] = lx / l; ON[o + 1] = ly / l; ON[o + 2] = lz / l;
        if (this.anchors) { this.oa[o] = this.ax; this.oa[o + 1] = this.az; this.oa[o + 2] = this.tall; }
        this.onv++;
      }
      for (let k = 0; k < 36; k++) this.oi[this.oni++] = base + HULL[k];
    }
    return this;
  }

  /** Four world-space points (arrays [x, y, z]) as one quad facing (nx, ny, nz). No outline. */
  quad(a, b, c, d, color, nx = 0, ny = 1, nz = 0) {
    const [r, g, bl] = rgb(color);
    this.#grow(4, 6);
    // winding: flip if (b - a) x (c - a) points away from the normal
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const flip = (uy * vz - uz * vy) * nx + (uz * vx - ux * vz) * ny + (ux * vy - uy * vx) * nz < 0;
    const base = this.nv;
    for (const p of [a, b, c, d]) {
      const o = this.nv * 3;
      this.p[o] = p[0]; this.p[o + 1] = p[1]; this.p[o + 2] = p[2];
      this.n[o] = nx; this.n[o + 1] = ny; this.n[o + 2] = nz;
      this.c[o] = r; this.c[o + 1] = g; this.c[o + 2] = bl;
      if (this.anchors) { this.a[o] = this.ax; this.a[o + 1] = this.az; this.a[o + 2] = this.tall; }
      this.nv++;
    }
    const I = this.i;
    if (flip) { I[this.ni++] = base; I[this.ni++] = base + 2; I[this.ni++] = base + 1; I[this.ni++] = base; I[this.ni++] = base + 3; I[this.ni++] = base + 2; }
    else { I[this.ni++] = base; I[this.ni++] = base + 1; I[this.ni++] = base + 2; I[this.ni++] = base; I[this.ni++] = base + 2; I[this.ni++] = base + 3; }
    return this;
  }
  /** Flat axis-aligned quad in local space (turned with the item), facing up. */
  flat(x0, z0, x1, z1, y, color) {
    const A = [0, 0, 0], B = [0, 0, 0], C = [0, 0, 0], D = [0, 0, 0];
    this.#wp(x0, y, z0, A, 0); this.#wp(x1, y, z0, B, 0); this.#wp(x1, y, z1, C, 0); this.#wp(x0, y, z1, D, 0);
    return this.quad(A, B, C, D, color, 0, 1, 0);
  }
  /** Flat quad by centre, size and its own turn. */
  flatR(cx, cz, w, d, y, color, ry = 0) {
    const c = Math.cos(ry), s = Math.sin(ry), hw = w / 2, hd = d / 2;
    const pt = (u, v) => { const o = [0, 0, 0]; this.#wp(cx + u * c + v * s, y, cz - u * s + v * c, o, 0); return o; };
    return this.quad(pt(-hw, -hd), pt(hw, -hd), pt(hw, hd), pt(-hw, hd), color, 0, 1, 0);
  }

  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.p.slice(0, this.nv * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.n.slice(0, this.nv * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.c.slice(0, this.nv * 3), 3));
    if (this.anchors) g.setAttribute('cutAnchor', new THREE.BufferAttribute(this.a.slice(0, this.nv * 3), 3));
    g.setIndex(new THREE.BufferAttribute(this.nv > 65535 ? this.i.slice(0, this.ni) : Uint16Array.from(this.i.subarray(0, this.ni)), 1));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
  outlineGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.op.slice(0, this.onv * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.on.slice(0, this.onv * 3), 3));
    if (this.anchors) g.setAttribute('cutAnchor', new THREE.BufferAttribute(this.oa.slice(0, this.onv * 3), 3));
    g.setIndex(new THREE.BufferAttribute(this.onv > 65535 ? this.oi.slice(0, this.oni) : Uint16Array.from(this.oi.subarray(0, this.oni)), 1));
    g.computeBoundingSphere();
    return g;
  }
  /** One vertex-coloured toon mesh, plus its outline (a child, like toon.js addOutline). */
  mesh({ px = 1.5, material = null } = {}) {
    const m = new THREE.Mesh(this.geometry(), material || toon('#ffffff', { vertexColors: true }));
    if (this.outline && this.onv) {
      const o = new THREE.Mesh(this.outlineGeometry(), outlineMaterial(px));
      o.userData.isOutline = true;
      o.raycast = () => {};
      m.add(o);
    }
    return m;
  }
}

/** Frees a mesh made by Geo.mesh() (and its outline); the shared materials stay. */
export function disposeMesh(m) {
  if (!m) return;
  m.parent?.remove(m);
  m.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
}
