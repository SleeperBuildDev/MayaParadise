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
//   g.parasol(x, y, z, r, drop, colours, n)    an umbrella canopy: a true cone of n wedges (crown at x, y, z)
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
  /** An umbrella canopy in the item's local space: a true low cone of n wedges from the crown (x, y, z) down to
   * a rim of radius r, `drop` lower, the wedges taking `colours` in turn, a shaded underside and a short hem.
   * (Overlapping tilted slabs, the old way, cut through each other along shallow seams: on a phone's depth
   * buffer they showed as torn stripes and holes that crawled while the camera moved. Wedges never overlap.) */
  parasol(x, y, z, r, drop, colours, n = 8, hem = 0.07) {
    const P = (a, rr, dy) => { const o = [0, 0, 0]; this.#wp(x + Math.cos(a) * rr, y + dy, z + Math.sin(a) * rr, o, 0); return o; };
    const N = (lx, ly, lz) => [lx * this.tc + lz * this.ts, ly, -lx * this.ts + lz * this.tc];
    const crown = P(0, 0, 0), crownU = P(0, 0, -0.03);
    const sl = drop / r, nl = Math.hypot(1, sl);
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2;
      const col = colours[k % colours.length], under = shade(col, 0.72);
      const r0 = P(a0, r, -drop), r1 = P(a1, r, -drop);
      // the wedge's own (flat) normal: up and out along its middle
      const ca = Math.cos(am), sa = Math.sin(am), up = N((ca * sl) / nl, 1 / nl, (sa * sl) / nl);
      this.quad(crown, r0, r1, crown, col, up[0], up[1], up[2]);
      const u0 = P(a0, r - 0.02, -drop - 0.03), u1 = P(a1, r - 0.02, -drop - 0.03);
      this.quad(crownU, u0, u1, crownU, under, -up[0], -up[1], -up[2]);
      if (hem > 0) {
        const h0 = P(a0, r, -drop - hem), h1 = P(a1, r, -drop - hem), out = N(ca, 0, sa);
        this.quad(r0, r1, h1, h0, shade(col, 0.88), out[0], 0, out[2]);
      }
    }
    return this;
  }
  #emit(color, bottom) {
    const [r, g, b] = rgb(color);
    const nf = bottom ? 6 : 5;
    const v0 = this.nv, o0 = this.outline && !this.bare ? this.onv : -1;
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
    if (this.outline && !this.bare) { // (bare: a part drawn without its ink hull, build.js standUp)
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
    // (its vertices and ink hull: ground-layers.js may lift a low box's level top clear of what it overlaps)
    (this.boxes || (this.boxes = [])).push(v0, this.nv, o0);
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
    // a level, up-facing quad (a ground decal): ground-layers.js may lift it clear of what it overlaps
    if (ny === 1 && a[1] === b[1] && a[1] === c[1] && a[1] === d[1]) (this.flats || (this.flats = [])).push(base);
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

// ---------------------------------------------------------------------------------
// Window panes: every window helper of the towns calls pane() for its glass (or its dark opening), so the windows
// can light up after dark (windowlights.js). build.js chunkJob points PANES.list at the item being built (null the
// rest of the time: a helper drawing anywhere else records nothing). A module-level list, not an argument: the
// helpers are called with only the Geo in hand, a dozen files deep.
// ---------------------------------------------------------------------------------
export const PANES = { list: null };
export const PANE_STRIDE = 10;
/**
 * A window's glass on g's current item: centre (x, y, z) and size w x h in the item's local space, the glass d deep,
 * facing local +Z (face = 1), -Z (-1), +X (2) or -X (-2); lit: painted lit by day already (a lamp window), so never
 * left dark. Records world centre, size, depth, world facing (nx, nz), lit and the item's ground height.
 */
export function pane(g, x, y, z, w, h, d = 0, face = 1, lit = false) {
  const L = PANES.list;
  if (!L) return;
  const s = Math.sign(face), nx = Math.abs(face) === 2 ? g.tc * s : g.ts * s, nz = Math.abs(face) === 2 ? -g.ts * s : g.tc * s;
  L.push(g.tx + x * g.tc + z * g.ts, g.ty + y, g.tz - x * g.ts + z * g.tc, w, h, d, nx, nz, lit ? 1 : 0, g.ty);
}

// ---------------------------------------------------------------------------------
// Small light fittings for stalls, carts and shop fronts (the towns' own boxes round one glowing core each: the
// shared instanced lamp core, so its pool on the ground and the night shadows come too). All in the item's local
// space; the core sits at (x, y, z). Each has its own little glass inside the core (seen when it is not lit: build.js
// leaves a fitting's light out when another light is closer than 2.5 m, ctx.fits). Thin parts are drawn without
// their ink hull (g.bare): a wire or a hook outlined at phone size is a black smear.
// ---------------------------------------------------------------------------------
/** A fitting's lamp core at (x, y, z) in g's item space (into ctx.fits while a chunk is built, else ctx.glows). */
export const FIT_STRIDE = 5; // x, y, z, the core's width and height (just over the fitting's own glass)
export function glowAt(g, ctx, x, y, z, w = 0.26, h = 0.3) {
  const X = g.tx + x * g.tc + z * g.ts, Z = g.tz - x * g.ts + z * g.tc;
  if (ctx.fits) ctx.fits.push(X, g.ty + y, Z, w, h); else ctx.glows.push(X, g.ty + y, Z);
}
/** The fitting's own boxes (drawn by fn) are not what makes its prop tall: build.js leaves them out of the height that
 *  decides whether the cutaway may fade the prop (a bulb on its flex over a low table is not a roof). */
function fitting(g, ctx, fn) { const v0 = g.nv; fn(); ctx.fitV?.push(v0, g.nv); }
function thin(g, fn) { const b = g.bare; g.bare = true; try { fn(); } finally { g.bare = b; } }
/** A bare bulb hanging on its flex from a roof or a beam at height top: a little socket cap over the core; shade:
 *  a wide tin shade over it instead (a working lamp, the Wharf's). */
export function bulb(g, ctx, x, y, z, top, { cap = '#3A2E25', shade = false } = {}) {
  fitting(g, ctx, () => {
    thin(g, () => { if (top - y > 0.25) g.box(x, (top + y + 0.2) / 2, z, 0.025, top - y - 0.2, 0.025, '#2B2420'); });
    g.box(x, y + 0.19, z, 0.12, 0.08, 0.12, cap);
    if (shade) g.box(x, y + 0.17, z, 0.42, 0.04, 0.42, cap);
    g.box(x, y + 0.02, z, 0.12, 0.2, 0.12, '#EFE6CF'); // the bulb
  });
  glowAt(g, ctx, x, y, z, 0.16, 0.25);
}
/** A lantern hung from a bracket on a wall facing local +Z (the wall's face at z - out): a back plate, an arm, a hook,
 *  a cap and a foot round the core. kind 'tin' (dark metal, the Wharf's working lamps) or 'paper' (a paper shade). */
export function wallLantern(g, ctx, x, y, z, out, { kind = 'tin', col = '#4A3B30' } = {}) {
  fitting(g, ctx, () => wallLanternBoxes(g, x, y, z, out, kind, col));
  glowAt(g, ctx, x, y, z, kind === 'paper' ? 0.245 : 0.225, 0.28);
}
function wallLanternBoxes(g, x, y, z, out, kind, col) {
  g.box(x, y + 0.42, z - out + 0.03, 0.12, 0.2, 0.06, col); // the plate on the wall
  g.box(x, y + 0.42, z - out / 2 + 0.03, 0.05, 0.05, out, col); // the arm
  thin(g, () => g.box(x, y + 0.3, z, 0.02, 0.18, 0.02, col)); // the hook
  if (kind === 'paper') {
    g.box(x, y + 0.19, z, 0.2, 0.06, 0.2, col);
    g.box(x, y - 0.19, z, 0.2, 0.06, 0.2, col);
    g.box(x, y, z, 0.22, 0.26, 0.22, '#F3E6C4'); // the paper
    for (const dy of [-0.08, 0.08]) thin(g, () => g.box(x, y + dy, z, 0.29, 0.02, 0.29, '#C9A24A')); // ribs over the paper
  } else {
    g.box(x, y, z, 0.2, 0.26, 0.2, '#E8E2CC'); // the glass
    g.box(x, y + 0.2, z, 0.32, 0.06, 0.32, col);
    g.box(x, y + 0.26, z, 0.16, 0.06, 0.16, col);
    g.box(x, y - 0.19, z, 0.3, 0.06, 0.3, col);
  }
}
/** A hurricane lamp standing on a counter or a table whose top is at height top: foot, cap, and its wire handle. */
export function hurricane(g, ctx, x, top, z, col = '#4A3B30') {
  const y = top + 0.21;
  fitting(g, ctx, () => {
    g.box(x, top + 0.03, z, 0.24, 0.06, 0.24, col);
    g.box(x, y + 0.19, z, 0.22, 0.07, 0.22, col);
    g.box(x, y, z, 0.16, 0.3, 0.16, '#E8E2CC'); // the chimney glass
    thin(g, () => { for (const sx of [-0.13, 0.13]) g.box(x + sx, y + 0.27, z, 0.02, 0.16, 0.02, col); g.box(x, y + 0.35, z, 0.28, 0.02, 0.02, col); });
  });
  glowAt(g, ctx, x, y, z, 0.185, 0.29);
}

/** Frees a mesh made by Geo.mesh() (and its outline); the shared materials stay. */
export function disposeMesh(m) {
  if (!m) return;
  m.parent?.remove(m);
  m.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
}
