// Maya's Writing Room, "မာရာ့ စာရေးခန်း" (place id `about`): a cosy writer's room.
//
//   back wall:  [window + curtains over the writing desk] [gold photo frame + motto plaque] [stats stage]
//   mid room:   [how-to-order chalkboard easel]      rug + pouf      [Telegram channel poster stand]
//   front:      plants, name mat at the entrance
//
// Stations: about-hello (desk, typewriter, Writer mug), about-stats (marquee board with big gold
// numbers on a little stage; the numbers are read from the single source, index.html's
// <script id="mw-stats"> via pages.js stat()), about-channel (Telegram poster with paper planes looping round it),
// about-how (chalkboard with the 4 ordering steps). The gold frame on the back wall is an empty
// Group named 'photoFrame' (also room.photoFrame); the integrator adds Maya's photo to it at
// photoFrame.userData.picture ({ width, height, z } in the frame's local space, faces +Z).
//
// Ambient life (no allocation per frame): drifting window clouds, mug steam, a chasing marquee,
// twinkling gold sparkles, looping paper planes, swaying curtain skirts, a ticking wall clock,
// pages riffling in the open book on the pouf, a turning sun-catcher and dust motes in the window
// light. Stations react when Maya is near/active: typewriter sparkles, faster marquee, wider plane
// loops, a chalk pointer hopping through the steps.
//
// Detail pass: staggered 4-tone floor boards, soft floor shading at walls/furniture (fake AO), a
// dentil frieze, wallpaper diamonds, raised wainscot panels, a richer bookcase, rug medallion and
// runner, desk clutter, chair cushions, stage dressing (trophy, tabletop ring light, gifts,
// confetti), a plane basket and a chalk stool. Budget: 2 baked + 12 marker + 3 sign atlases +
// 2 planes + 2 FX + 1 glow + 1 shade + 2 lit pool = 25 draw calls, about 30k triangles.
//
// This file also exports a few small helpers that templates.js (same author) reuses: rotated boxes,
// sparkle/quill shapes, a sign atlas stamped from signTexture() canvases (one texture, one draw call
// for many signs), pooled instanced FX cubes/sparkles, a soft vertex-alpha glow mesh, a toon-lit
// outlined instanced pool for small animated props (createLitPool/setHanging), floor shading
// (shadeStrip/shadeDisc) and staggered floor boards (boardFloor).
import * as kit from './kit.js';
import { THREE, PALETTE, VoxelBuilder, jitter, toon, basic, addOutline, signTexture } from './kit.js';
import { mergeGeometries } from '../three.js';
import { fontsReady, FONT_MY, FONT_SERIF, FONT_SANS, roundRect } from '../toon.js';
import { stat } from '../pages.js';

const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------------
// Shared helpers (also imported by templates.js)
// ---------------------------------------------------------------------------------------------
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _c = new THREE.Color();
const _v = new THREE.Vector3();
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);

export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const frac = (x) => x - Math.floor(x);
export const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));
export function smoothstep(a, b, x) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}
export function easeOutBack(x, s = 1.70158) {
  const u = x - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
}
/** Deterministic 0..1 noise from a number. */
export function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
/** 1 when Maya is at the station, 0.7 when she is near it, else 0 (smooth it with damp()). */
export function attentionTarget(state, id) {
  return state?.active === id ? 1 : state?.near === id ? 0.7 : 0;
}

/** New Matrix4 from position, Euler rotation (XYZ) and scale. Build-time use only. */
export function mat4(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _e.set(rx, ry, rz);
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(_e), new THREE.Vector3(sx, sy, sz));
}

/** VoxelBuilder box with any rotation (VoxelBuilder.box only turns about Y). */
export function boxR(v, x, y, z, w, h, d, color, rx = 0, ry = 0, rz = 0) {
  v.add(UNIT_BOX, color, mat4(x, y, z, rx, ry, rz, w, h, d));
  return v;
}

/** Low-poly cylinder into a VoxelBuilder. axis: 'y' | 'x' | 'z'. */
export function cylinder(v, x, y, z, r, len, color, { axis = 'y', segs = 10, rTop = r } = {}) {
  const g = new THREE.CylinderGeometry(rTop, r, len, segs);
  const m = axis === 'x' ? mat4(x, y, z, 0, 0, Math.PI / 2) : axis === 'z' ? mat4(x, y, z, Math.PI / 2, 0, 0) : mat4(x, y, z);
  v.add(g, color, m);
  g.dispose();
  return v;
}

/** Four-point sparkle (her ✦ motif) with concave sides, centred, in the XY plane. */
export function sparkleShape(r = 0.5, pinch = 0.06) {
  const s = new THREE.Shape();
  s.moveTo(0, r);
  s.quadraticCurveTo(pinch, pinch, r, 0);
  s.quadraticCurveTo(pinch, -pinch, 0, -r);
  s.quadraticCurveTo(-pinch, -pinch, -r, 0);
  s.quadraticCurveTo(-pinch, pinch, 0, r);
  return s;
}
let sparkleSolidGeo = null;
/** Solid gold sparkle into a VoxelBuilder (faces +Z unless rotated). */
export function addSparkle(v, x, y, z, size, color = PALETTE.gold, { depth = 0.03, rx = 0, ry = 0, rz = 0 } = {}) {
  if (!sparkleSolidGeo) {
    sparkleSolidGeo = new THREE.ExtrudeGeometry(sparkleShape(0.5, 0.07), { depth: 1, bevelEnabled: false, curveSegments: 3 });
    sparkleSolidGeo.translate(0, 0, -0.5);
  }
  v.add(sparkleSolidGeo, color, mat4(x, y, z, rx, ry, rz, size, size, depth));
  return v;
}

let featherGeo = null;
/** Low-poly feather vane (unit length along +Y, one piece so the outline is only the silhouette). */
function featherGeometry() {
  if (featherGeo) return featherGeo;
  const pts = [
    [0, 0.2], [0.05, 0.25], [0.1, 0.37], [0.125, 0.54], [0.115, 0.72], [0.075, 0.87], [0.025, 0.97], [-0.01, 1.0],
    [-0.06, 0.91], [-0.1, 0.77], [-0.045, 0.69], [-0.115, 0.6], [-0.1, 0.43], [-0.055, 0.28],
  ];
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  featherGeo = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
  featherGeo.translate(0, 0, -0.5);
  return featherGeo;
}

/** Quill emblem into a VoxelBuilder: nib at the local origin, feather along +Y, in the XY plane (faces +Z). */
export function addQuill(v, matrix, { len = 0.5, vane = PALETTE.gold, shaft = PALETTE.goldDeep, nib = PALETTE.ink, depth = 0.03 } = {}) {
  const q = new VoxelBuilder();
  const k = len;
  q.box(0, k * 0.07, 0, k * 0.045, k * 0.14, depth * 0.7, nib);
  q.add(featherGeometry(), vane, mat4(0, 0, 0, 0, 0, 0, k, k, depth));
  q.box(0, k * 0.56, depth * 0.55, k * 0.02, k * 0.86, depth * 0.25, shaft); // shaft line on the vane
  q.box(0, k * 0.17, 0, k * 0.024, k * 0.1, depth * 0.8, shaft); // bare quill above the nib
  v.merge(q, matrix);
  return v;
}

/** Paper plane (nose +Z, wings in XZ) with real thickness so the outline works. */
export function paperPlaneGeometry(scale = 1) {
  const s = scale;
  const ex = { depth: 0.014 * s, bevelEnabled: false };
  const right = new THREE.Shape();
  right.moveTo(0, 0.24 * s);
  right.lineTo(0.18 * s, -0.13 * s);
  right.lineTo(0, -0.07 * s);
  right.closePath();
  const left = new THREE.Shape();
  left.moveTo(0, 0.24 * s);
  left.lineTo(0, -0.07 * s);
  left.lineTo(-0.18 * s, -0.13 * s);
  left.closePath();
  const gR = new THREE.ExtrudeGeometry(right, ex).rotateX(Math.PI / 2).rotateZ(0.2);
  const gL = new THREE.ExtrudeGeometry(left, ex).rotateX(Math.PI / 2).rotateZ(-0.2);
  const keel = new THREE.Shape();
  keel.moveTo(0.22 * s, 0);
  keel.lineTo(-0.07 * s, 0);
  keel.lineTo(-0.05 * s, -0.075 * s);
  keel.closePath();
  const gK = new THREE.ExtrudeGeometry(keel, ex).translate(0, 0, -0.007 * s).rotateY(-Math.PI / 2);
  const g = mergeGeometries([gR, gL, gK], false);
  gR.dispose();
  gL.dispose();
  gK.dispose();
  g.computeBoundingSphere();
  return g;
}

// ---------- pooled instanced FX (one draw call each, no outlines, unlit) ----------
function makePool(mesh) {
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const white = new THREE.Color(1, 1, 1);
  for (let i = 0; i < mesh.count; i++) {
    mesh.setMatrixAt(i, zero);
    mesh.setColorAt(i, white);
  }
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.userData.dynamic = true;
  mesh.raycast = () => {};
  let used = 0;
  let colorsDirty = true;
  return {
    mesh,
    /** Reserve n consecutive instances painted `color`; returns the first index. */
    alloc(n, color = PALETTE.white) {
      const i = used;
      used += n;
      if (used > mesh.count) throw new Error(`${mesh.name}: pool too small`);
      _c.set(color);
      for (let k = 0; k < n; k++) mesh.setColorAt(i + k, _c);
      return i;
    },
    set(i, x, y, z, sx, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) {
      _e.set(rx, ry, rz);
      _q.setFromEuler(_e);
      _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
      mesh.setMatrixAt(i, _m);
    },
    setQ(i, x, y, z, sx, sy, sz, quat) {
      _m.compose(_p.set(x, y, z), quat, _s.set(sx, sy, sz));
      mesh.setMatrixAt(i, _m);
    },
    /** matrix: THREE.Matrix4 (copied). */
    setM(i, matrix) {
      mesh.setMatrixAt(i, matrix);
    },
    hide(i) {
      mesh.setMatrixAt(i, zero);
    },
    /** color: THREE.Color (copied). */
    tint(i, color) {
      mesh.setColorAt(i, color);
      colorsDirty = true;
    },
    seal() {
      mesh.count = Math.max(1, used);
    },
    commit() {
      mesh.instanceMatrix.needsUpdate = true;
      if (colorsDirty) {
        mesh.instanceColor.needsUpdate = true;
        colorsDirty = false;
      }
    },
  };
}

/** Unlit instanced cubes + flat sparkles (2 draw calls). Call fx.seal() after allocating, fx.commit() per frame. */
export function createFX({ cubes = 64, sparkles = 24 } = {}) {
  const cubeMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), basic(PALETTE.white), cubes);
  cubeMesh.name = 'fxCubes';
  const sparkMesh = new THREE.InstancedMesh(new THREE.ShapeGeometry(sparkleShape(0.5, 0.06), 3), basic(PALETTE.white, { side: THREE.DoubleSide }), sparkles);
  sparkMesh.name = 'fxSparkles';
  sparkMesh.renderOrder = 3;
  const group = new THREE.Group();
  group.name = 'fx';
  group.add(cubeMesh, sparkMesh);
  const fx = { group, cube: makePool(cubeMesh), spark: makePool(sparkMesh) };
  fx.seal = () => {
    fx.cube.seal();
    fx.spark.seal();
  };
  fx.commit = () => {
    fx.cube.commit();
    fx.spark.commit();
  };
  return fx;
}

/**
 * Toon-lit instanced boxes with per-instance colour and a shared outline (2 draw calls) for the
 * small animated props (swaying curtains, riffling pages, turning displays). Same API as the FX
 * pools (alloc/set/setQ/setM/hide/tint/seal/commit); add pool.group to the room.
 */
export function createLitPool(count, { px = 1.4, name = 'litPool' } = {}) {
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), toon('#ffffff'), count);
  mesh.name = name;
  const group = new THREE.Group();
  group.name = name;
  group.add(mesh);
  const outline = addOutline(mesh, { px });
  const pool = makePool(mesh);
  outline.frustumCulled = false;
  const seal = pool.seal;
  pool.group = group;
  pool.seal = () => {
    seal();
    outline.count = mesh.count;
  };
  return pool;
}

/** Pivot helper for hanging/swinging pool boxes: box of size (w, h, d) hanging `drop` below the pivot, turned by euler. */
export function setHanging(pool, i, px, py, pz, w, h, d, rx, ry, rz, drop = h / 2, ox = 0, oz = 0) {
  _e.set(rx, ry, rz);
  _q.setFromEuler(_e);
  _v.set(ox, -drop, oz).applyQuaternion(_q);
  _m.compose(_p.set(px + _v.x, py + _v.y, pz + _v.z), _q, _s.set(w, h, d));
  pool.setM(i, _m);
}

/** Soft dark floor shading (fake ambient occlusion): wall strips + contact discs, one transparent mesh. */
export function shadeStrip(glow, x0, z0, x1, z1, side, alpha = 0.3, y = 0.009, hex = '#4A3020') {
  // side: which edge is dark: 'n' (z0), 's' (z1), 'w' (x0), 'e' (x1)
  const a = new THREE.Vector3(x0, y, z0);
  const b = new THREE.Vector3(x1, y, z0);
  const c = new THREE.Vector3(x1, y, z1);
  const d = new THREE.Vector3(x0, y, z1);
  const A = { n: [alpha, alpha, 0, 0], s: [0, 0, alpha, alpha], w: [alpha, 0, 0, alpha], e: [0, alpha, alpha, 0] }[side];
  glow.quad(a, b, c, d, hex, A[0], A[1], A[2], A[3]);
}
export function shadeDisc(glow, x, z, rx, rz, alpha = 0.32, y = 0.009, hex = '#4A3020') {
  glow.disc(mat4(x, y, z, -Math.PI / 2), rx, rz, hex, alpha, 0, 18);
}

/** Soft additive-looking glows (light pools, halos, beams) as one transparent vertex-alpha mesh. */
export function createGlow() {
  const pos = [];
  const col = [];
  const c = new THREE.Color();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const ctr = new THREE.Vector3();
  const vert = (p, hex, alpha) => {
    c.set(hex);
    pos.push(p.x, p.y, p.z);
    col.push(c.r, c.g, c.b, alpha);
  };
  const api = {
    /** Elliptic radial glow on the local XY plane of `matrix`: alpha a0 at the centre, a1 at the rim. */
    disc(matrix, rx, ry, hex, a0, a1 = 0, segs = 20) {
      ctr.set(0, 0, 0).applyMatrix4(matrix);
      for (let i = 0; i < segs; i++) {
        const t0 = (i / segs) * TAU;
        const t1 = ((i + 1) / segs) * TAU;
        a.set(Math.cos(t0) * rx, Math.sin(t0) * ry, 0).applyMatrix4(matrix);
        b.set(Math.cos(t1) * rx, Math.sin(t1) * ry, 0).applyMatrix4(matrix);
        vert(ctr, hex, a0);
        vert(a, hex, a1);
        vert(b, hex, a1);
      }
    },
    quad(p0, p1, p2, p3, hex, a0, a1 = a0, a2 = a1, a3 = a2) {
      vert(p0, hex, a0);
      vert(p1, hex, a1);
      vert(p2, hex, a2);
      vert(p0, hex, a0);
      vert(p2, hex, a2);
      vert(p3, hex, a3);
    },
    /** Open light beam between two rings of 4 points (top ring alpha aTop, bottom ring aBot). */
    beam(top, bot, hex, aTop, aBot) {
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        api.quad(top[i], top[j], bot[j], bot[i], hex, aTop, aTop, aBot, aBot);
      }
    },
    mesh(name = 'glow') {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
      g.computeBoundingSphere();
      const mat = basic(PALETTE.white, { transparent: true, depthWrite: false, side: THREE.DoubleSide }).clone();
      mat.vertexColors = true;
      mat.forceSinglePass = true; // no separate back-face pass (one draw call)
      const m = new THREE.Mesh(g, mat);
      m.name = name;
      m.renderOrder = 2;
      m.userData.dynamic = true;
      m.raycast = () => {};
      return m;
    },
  };
  return api;
}

// ---------- sign atlas: many signTexture() canvases in one texture, many planes in one mesh ----------
/** An empty transparent canvas texture made by signTexture(); draw into atlas.ctx. */
export function createAtlas(width = 1024, height = width) {
  const texture = signTexture([], { width, height, bg: null, border: null });
  texture.premultiplyAlpha = true; // clean edges when mipmapped (blending set to match in atlasMesh)
  return { texture, ctx: texture.image.getContext('2d'), width, height };
}

/** Stamps a signTexture() canvas (Burmese-safe text) into the atlas at (x, y). Returns [x, y, w, h]. */
export function atlasText(atlas, x, y, w, h, lines, opts = {}) {
  const t = signTexture(lines, { width: w, height: h, bg: null, border: null, ...opts });
  atlas.ctx.drawImage(t.image, x, y);
  t.dispose();
  return [x, y, w, h];
}

let measureCtx = null;
export function textWidth(text, size, weight = 700, font = FONT_MY) {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  measureCtx.font = `${weight} ${size}px ${font}`;
  return measureCtx.measureText(text).width;
}

/** One left-aligned text line starting at x, vertically centred on cy. Returns the text width. */
export function atlasTextLeft(atlas, x, cy, text, { size = 48, weight = 700, font = FONT_MY, color = PALETTE.ink } = {}) {
  const tw = Math.ceil(textWidth(text, size, weight, font));
  const w = tw + 48; // signTexture() clamps text to width - 40
  const h = Math.ceil(size * 1.9);
  atlasText(atlas, Math.round(x - 24), Math.round(cy - h / 2), w, h, [{ text, size, weight, font, color }]);
  return tw;
}

/** Merged plane mesh for signs sharing an atlas. items: [{ rect: [x, y, w, h], w, h, matrix }] (planes face +Z). */
export function atlasMesh(atlas, items, name = 'signs') {
  const geos = items.map(({ rect, w, h, matrix }) => {
    const g = new THREE.PlaneGeometry(w, h);
    const uv = g.attributes.uv;
    const [x, y, rw, rh] = rect;
    const u0 = x / atlas.width;
    const u1 = (x + rw) / atlas.width;
    const v0 = 1 - (y + rh) / atlas.height;
    const v1 = 1 - y / atlas.height;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
    g.applyMatrix4(matrix);
    return g;
  });
  const geo = mergeGeometries(geos, false);
  for (const g of geos) g.dispose();
  geo.computeBoundingSphere();
  atlas.texture.needsUpdate = true;
  const mat = basic(PALETTE.white, { map: atlas.texture, transparent: true, alphaTest: 0.01 });
  mat.blending = THREE.CustomBlending; // premultiplied texture
  mat.blendSrc = THREE.OneFactor;
  mat.blendDst = THREE.OneMinusSrcAlphaFactor;
  mat.blendSrcAlpha = THREE.OneFactor;
  mat.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  mesh.renderOrder = 1;
  mesh.userData.dynamic = true;
  mesh.raycast = () => {};
  return mesh;
}

// ---------- 2D drawing bits for atlases (shapes only; all text goes through signTexture) ----------
export function drawSparkle2D(g, x, y, r, color) {
  const p = r * 0.13;
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x, y - r);
  g.quadraticCurveTo(x + p, y - p, x + r, y);
  g.quadraticCurveTo(x + p, y + p, x, y + r);
  g.quadraticCurveTo(x - p, y + p, x - r, y);
  g.quadraticCurveTo(x - p, y - p, x, y - r);
  g.fill();
}

/** Folded paper plane icon (nose pointing +x before rotation): two wings, a keel flap, fold lines. */
export function drawPlane2D(g, x, y, s, rot, light, dark, line = null) {
  const N = [1, -0.05];
  const T = [-0.95, -0.7];
  const C = [-0.42, 0.04];
  const B = [-0.62, 0.7];
  const F = [-0.12, 0.3];
  const tri = (a, b, c, fill) => {
    g.fillStyle = fill;
    g.beginPath();
    g.moveTo(a[0], a[1]);
    g.lineTo(b[0], b[1]);
    g.lineTo(c[0], c[1]);
    g.closePath();
    g.fill();
  };
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  tri(N, T, C, light); // upper wing
  tri(N, C, F, dark); // lower wing
  tri(C, B, F, dark); // keel flap
  g.globalAlpha *= 0.28;
  tri(C, B, F, '#000000');
  g.globalAlpha /= 0.28;
  g.lineJoin = 'round';
  g.lineWidth = 0.05;
  g.strokeStyle = line ?? 'rgba(255,255,255,0.75)';
  g.beginPath();
  g.moveTo(N[0], N[1]);
  g.lineTo(C[0], C[1]);
  g.lineTo(B[0], B[1]);
  g.stroke();
  g.restore();
}

// ---------------------------------------------------------------------------------------------
// The room
// ---------------------------------------------------------------------------------------------
const BACK = -4; // back wall surface (room depth 8)
const COL = {
  wall: '#F6ECDA',
  stripe: '#EEDFC6',
  wainscot: '#7B2B35',
  frameCream: '#FFF6E8',
  curtain: '#8C2C38',
  curtainDark: '#6F2230',
  slate: '#2E3B35',
  glow: '#FFE4A0',
  bulbDim: '#9C7330',
  bulbOn: '#FFF3C4',
  sparkle: '#F2C75C',
  cloud: '#FFFAF1',
  sun: '#FFD27F',
};
const BULB_DIM = new THREE.Color(COL.bulbDim);
const BULB_ON = new THREE.Color(COL.bulbOn);
const GLOW_A = new THREE.Color('#FFE9A8');
const GLOW_B = new THREE.Color('#FFF7DC');

export async function buildInterior(ctx = {}) {
  await fontsReady();
  const room = kit.createRoom({
    width: 7,
    depth: 8,
    wall: COL.wall,
    wainscot: COL.wainscot,
    trim: PALETTE.goldDeep,
    floor: 'planks',
    floorColor: '#BD8E5F',
  });
  room.id = 'about';
  room.name = { my: 'မာရာ့ စာရေးခန်း', en: "Maya's Writing Room" };
  room.lights.sun.color.set('#FFEBCF'); // a touch more golden hour
  const G = room.group;
  const S = new VoxelBuilder(); // static decor in room space (baked)
  const fx = createFX({ cubes: 80, sparkles: 18 });
  const glow = createGlow();
  const atlasA = createAtlas();
  const atlasB = createAtlas();
  const atlasC = createAtlas();
  const signsA = [];
  const signsB = [];
  const signsC = [];
  const tick = []; // per-frame closures (dt, t)
  const att = { hello: 0, stats: 0, channel: 0, how: 0 };
  const lit = createLitPool(24, { name: 'aboutLife' }); // swaying curtains, clock hands, riffling pages
  const shade = createGlow(); // soft floor shading (fake ambient occlusion), constant opacity

  // ---------------- wallpaper: soft stripes above the maroon wainscot ----------------
  for (let x = -3.25; x < 3.5; x += 0.5) S.boxMin(x - 0.07, 1.07, BACK, x + 0.07, 2.86, BACK + 0.004, COL.stripe);
  writingWallDetail(S);
  // floor: staggered boards in four tones (seams drawn by the outline) + darker floor at the walls
  boardFloor(S, ['#BD8E5F', '#C99B6B', '#B2845A', '#C29061'], { seed: 3 });
  shadeStrip(shade, -3.5, -3.94, 3.5, -3.4, 'n', 0.3);
  shadeStrip(shade, -3.44, -3.94, -3.05, 4.0, 'w', 0.24);
  shadeStrip(shade, 3.05, -3.94, 3.44, 4.0, 'e', 0.24);

  // ---------------- window with curtains (back-left) + golden-hour sky FX ----------------
  const WX = -2.2;
  const WY = 1.86;
  const skirts = [];
  S.merge(windowBuilder(skirts), mat4(WX, WY, BACK));
  // a gold sun-catcher turning on a thread in the window
  S.box(WX - 0.45, WY + 0.37, BACK + 0.085, 0.006, 0.26, 0.006, PALETTE.goldDeep);
  const catcher = fx.spark.alloc(2, '#F2C75C');
  tick.push((dt, t) => {
    fx.spark.set(catcher, WX - 0.45, WY + 0.17, BACK + 0.085, 0.15, 0.15, 0.15, 0, t * 1.1, Math.sin(t * 0.7) * 0.15);
    const g = Math.pow(Math.max(0, Math.cos(t * 1.1)), 12) * 0.12;
    if (g < 0.004) fx.spark.hide(catcher + 1);
    else fx.spark.set(catcher + 1, WX - 0.4, WY + 0.22, BACK + 0.16, g, g, g, -0.6, 0, t);
  });
  const skirt0 = lit.alloc(skirts.length);
  skirts.forEach((s, k) => lit.tint(skirt0 + k, _c.set(s.color)));
  tick.push((dt, t) => {
    for (let k = 0; k < skirts.length; k++) {
      const s = skirts[k];
      const rx = -0.035 * (1 + Math.sin(t * 0.8 + s.k * 0.55 + s.side * 1.3));
      const rz = 0.022 * Math.sin(t * 0.6 + s.k * 0.8) * s.side;
      setHanging(lit, skirt0 + k, WX + s.x, WY + s.y, BACK + s.z, s.w, s.h, s.d, rx, 0, rz);
    }
  });
  glow.disc(mat4(WX, WY, BACK + 0.004), 1.15, 0.85, '#FFF0CF', 0.32);
  // soft golden light falling from the window onto the floor in front of the desk
  {
    const dir = new THREE.Vector3(0.55, -1.85, 2.3);
    const corners = [[-0.75, 0.5], [0.75, 0.5], [0.75, -0.5], [-0.75, -0.5]].map(([cx, cy]) => new THREE.Vector3(WX + cx, WY + cy, BACK + 0.02));
    const floor = corners.map((c) => c.clone().addScaledVector(dir, (c.y - 0.012) / -dir.y));
    glow.beam(corners, floor, '#FFE9B8', 0.16, 0.0);
    glow.quad(floor[0], floor[1], floor[2], floor[3], '#FFE7AE', 0.08, 0.08, 0.3, 0.3);
    // dust motes drifting in the window light
    const mote0 = fx.cube.alloc(12, '#FFF6DA');
    const motes = [];
    for (let k = 0; k < 12; k++) motes.push({ u: 0.15 + hash(k * 2.3) * 0.7, cx: (hash(k * 4.1) - 0.5) * 1.3, cy: (hash(k * 6.7) - 0.5) * 0.8, sp: 0.04 + hash(k * 8.3) * 0.05 });
    tick.push((dt, t) => {
      for (let k = 0; k < motes.length; k++) {
        const m = motes[k];
        const u = frac(m.u + t * m.sp);
        const x = WX + m.cx + dir.x * u * 0.9 + Math.sin(t * 0.7 + k) * 0.05;
        const y = WY + m.cy + dir.y * u * 0.9 + Math.sin(t * 0.9 + k * 2) * 0.04;
        const z = BACK + 0.25 + dir.z * u * 0.9;
        const s = 0.026 * Math.sin(Math.PI * u) * (0.6 + 0.4 * Math.sin(t * 3 + k * 1.7));
        if (s < 0.003) fx.cube.hide(mote0 + k);
        else fx.cube.set(mote0 + k, x, y, z, s, s, s, t + k, t * 0.7, 0);
      }
    });
  }
  const skyCols = ['#A9CEE8', '#C9DCE5', '#F2E2C8', '#F9D0A2'];
  const sky0 = fx.cube.alloc(4);
  for (let i = 0; i < 4; i++) {
    fx.cube.tint(sky0 + i, _c.set(skyCols[i]));
    fx.cube.set(sky0 + i, WX, WY + 0.5 - (i + 0.5) * 0.25, BACK + 0.012, 1.5, 0.25, 0.01);
  }
  const sun0 = fx.cube.alloc(2, COL.sun);
  fx.cube.set(sun0, WX + 0.42, WY - 0.26, BACK + 0.022, 0.22, 0.13, 0.01);
  fx.cube.set(sun0 + 1, WX + 0.42, WY - 0.26, BACK + 0.022, 0.13, 0.22, 0.01);
  const clouds = [
    { x: WX - 0.36, y: WY + 0.27, w: 0.36 },
    { x: WX + 0.32, y: WY + 0.12, w: 0.28 },
    { x: WX - 0.1, y: WY - 0.3, w: 0.4 },
  ];
  const cloud0 = fx.cube.alloc(9, COL.cloud);
  tick.push((dt, t) => {
    for (let k = 0; k < 3; k++) {
      const c = clouds[k];
      const x = c.x + Math.sin(t * 0.16 + k * 1.9) * 0.09;
      const y = c.y + Math.sin(t * 0.5 + k) * 0.008;
      const z = BACK + 0.03 + k * 0.002;
      fx.cube.set(cloud0 + k * 3, x, y, z, c.w, 0.075, 0.01);
      fx.cube.set(cloud0 + k * 3 + 1, x - c.w * 0.12, y + 0.06, z, c.w * 0.5, 0.075, 0.01);
      fx.cube.set(cloud0 + k * 3 + 2, x + c.w * 0.22, y + 0.045, z, c.w * 0.3, 0.05, 0.01);
    }
  });

  // ---------------- writing desk (about-hello) ----------------
  const DX = -2.2;
  const DZ = -3.55;
  const DY = 0.78;
  room.place(kit.desk({ w: 1.8, d: 0.75, h: DY, top: '#C49565', body: PALETTE.woodDark }), DX, DZ);
  room.place(kit.chair({ color: PALETTE.maroon }), DX - 0.15, DZ + 0.8, Math.PI + 0.3);
  S.merge(chairCushions(), mat4(DX - 0.15, 0, DZ + 0.8, 0, Math.PI + 0.3, 0));
  shadeDisc(shade, DX, DZ + 0.05, 1.05, 0.5, 0.3);
  shadeDisc(shade, DX - 0.15, DZ + 0.8, 0.34, 0.34, 0.28);
  // an open notebook with a pen (front-left), a tiny cactus (front-right), a framed postcard (back)
  {
    const nx = DX - 0.66;
    const nz = DZ + 0.265;
    boxR(S, nx, DY + 0.008, nz, 0.3, 0.016, 0.2, PALETTE.maroon, 0, -0.12, 0);
    boxR(S, nx - 0.065, DY + 0.019, nz - 0.008, 0.135, 0.008, 0.185, PALETTE.paper, 0, -0.12, 0);
    boxR(S, nx + 0.07, DY + 0.019, nz + 0.008, 0.135, 0.008, 0.185, '#FBF6EA', 0, -0.12, 0);
    for (let i = 0; i < 4; i++) boxR(S, nx + 0.07 - 0.004 * i, DY + 0.024, nz - 0.05 + i * 0.035 + 0.008, 0.1, 0.003, 0.008, '#A6957C', 0, -0.12, 0);
    boxR(S, nx + 0.03, DY + 0.03, nz + 0.02, 0.17, 0.014, 0.014, PALETTE.gold, 0, 0.6, 0);
    const cx = DX + 0.8;
    const cz = DZ + 0.27;
    S.boxMin(cx - 0.045, DY, cz - 0.045, cx + 0.045, DY + 0.07, cz + 0.045, '#C27A5B');
    S.boxMin(cx - 0.05, DY + 0.06, cz - 0.05, cx + 0.05, DY + 0.075, cz + 0.05, PALETTE.gold);
    S.box(cx, DY + 0.13, cz, 0.05, 0.11, 0.05, PALETTE.leaf);
    S.box(cx - 0.04, DY + 0.13, cz, 0.035, 0.03, 0.03, PALETTE.leafDark);
    S.box(cx, DY + 0.195, cz, 0.025, 0.02, 0.025, PALETTE.rose);
    const px = DX + 0.5;
    const pz = DZ - 0.32;
    boxR(S, px, DY + 0.1, pz, 0.15, 0.19, 0.02, PALETTE.gold, -0.15, 0, 0);
    boxR(S, px, DY + 0.1, pz + 0.008, 0.11, 0.15, 0.012, '#BFD9EC', -0.15, 0, 0);
    boxR(S, px, DY + 0.06, pz + 0.014, 0.11, 0.05, 0.008, '#7FA866', -0.15, 0, 0);
    boxR(S, px + 0.025, DY + 0.14, pz + 0.008, 0.045, 0.045, 0.012, '#FFD27F', -0.15, 0, 0);
  }
  const TX = DX - 0.02;
  const TZ = DZ + 0.02;
  typewriter(S, TX, DY, TZ);
  const MX = DX + 0.48;
  const MZ = DZ + 0.16;
  writerMug(S, MX, DY, MZ);
  signsA.push({ rect: [268, 960, 128, 64], w: 0.13, h: 0.065, matrix: mat4(MX, DY + 0.1, MZ + 0.083) });
  paperStack(S, DX - 0.6, DY, DZ + 0.06, 7, 0.12, 3);
  paperStack(S, DX - 0.66, DY, DZ - 0.2, 4, -0.18, 9);
  boxR(S, DX - 0.6, DY + 0.105, DZ + 0.07, 0.25, 0.03, 0.19, PALETTE.maroon, 0, 0.2, 0); // the script, on top
  boxR(S, DX - 0.6, DY + 0.103, DZ + 0.07, 0.235, 0.024, 0.18, PALETTE.paper, 0, 0.2, 0);
  inkAndQuill(S, DX + 0.3, DY, DZ - 0.24);
  pencilCup(S, DX - 0.82, DY, DZ - 0.22);
  const LX = DX + 0.72;
  const LZ = DZ - 0.12;
  deskLamp(S, LX, DY, LZ);
  const lampGlow = fx.cube.alloc(1, '#FFEBB0');
  fx.cube.set(lampGlow, LX, DY + 0.255, LZ + 0.05, 0.27, 0.012, 0.09);
  glow.disc(mat4(LX - 0.05, DY + 0.005, LZ + 0.14, -Math.PI / 2), 0.34, 0.22, '#FFE7A6', 0.42);
  glow.disc(mat4(LX, DY + 0.45, BACK + 0.005), 0.42, 0.36, '#FFE7A6', 0.28);
  // typing sparkles: tak-tak-tak over the paper when Maya is at the desk
  const type0 = fx.spark.alloc(3, COL.sparkle);
  tick.push((dt, t) => {
    const a = att.hello;
    for (let j = 0; j < 3; j++) {
      const ph = t * 2.6 + j / 3;
      const beat = Math.floor(ph);
      const f = ph - beat;
      const s = a * 0.12 * Math.sin(Math.PI * f) * (0.6 + 0.4 * hash(beat * 7 + j));
      if (s < 0.004) {
        fx.spark.hide(type0 + j);
        continue;
      }
      const x = TX - 0.16 + hash(beat * 3 + j * 11) * 0.32;
      fx.spark.set(type0 + j, x, DY + 0.66 + f * 0.16, TZ - 0.12, s, s, s, -0.7, 0, t * 2 + j);
    }
  });
  // the typewriter bell: a bright "ding" sparkle at the end of each typed line
  const ding = fx.spark.alloc(1, '#FFF1B8');
  tick.push((dt, t) => {
    const f = frac(t / 2.4);
    const s = att.hello * 0.2 * smoothstep(0, 0.06, f) * (1 - smoothstep(0.06, 0.32, f));
    if (s < 0.004) fx.spark.hide(ding);
    else fx.spark.set(ding, TX + 0.4, DY + 0.36, TZ - 0.08, s, s, s, -0.6, 0, f * 3);
  });
  // steam curling up from the Writer mug
  const steam0 = fx.cube.alloc(3, '#FFFDF7');
  tick.push((dt, t) => {
    for (let k = 0; k < 3; k++) {
      const f = frac(t * 0.28 + k / 3);
      const s = 0.006 + 0.03 * Math.sin(Math.PI * f);
      fx.cube.set(steam0 + k, MX + Math.sin(f * 6 + k * 2) * 0.03, DY + 0.21 + f * 0.3, MZ, s, s, s, 0, f * 2 + k, f);
    }
  });

  // a writer's wastebasket with crumpled drafts (one missed the basket)
  room.place(wastebasket(), -1.05, -3.62);

  // ---------------- photo frame + motto plaque + sconces (back centre) ----------------
  const frameGroup = photoFrame();
  room.mount(frameGroup, 'back', 0, 1.72);
  room.photoFrame = frameGroup;
  signsA.push({ rect: [0, 960, 256, 64], w: 0.32, h: 0.08, matrix: mat4(0, 1.72 - 0.61 + 0.045, BACK + 0.06 + 0.085) });
  S.boxMin(-0.78, 0.33, BACK, 0.78, 0.87, BACK + 0.03, PALETTE.goldDeep); // motto plaque backing
  signsA.push({ rect: [0, 656, 1024, 300], w: 1.48, h: 0.434, matrix: mat4(0, 0.6, BACK + 0.034) });
  for (const sx of [-1, 1]) {
    sconce(S, sx * 0.84, 1.86, BACK);
    glow.disc(mat4(sx * 0.84, 2.0, BACK + 0.006), 0.36, 0.46, '#FFE3A0', 0.5);
  }
  // under the sconces: a ticking wall clock (left) and a little block-painted picture (right)
  const CLK = { x: -0.84, y: 1.3 };
  wallClock(S, CLK.x, CLK.y, BACK);
  blockPicture(S, 0.9, 1.27, BACK, 0.4, 0.34);
  const hand0 = lit.alloc(2, PALETTE.ink);
  tick.push((dt, t) => {
    const mins = t * 0.35;
    setHanging(lit, hand0, CLK.x, CLK.y, BACK + 0.066, 0.016, 0.06, 0.008, 0, 0, -(mins / 12) - 2.1, -0.03);
    setHanging(lit, hand0 + 1, CLK.x, CLK.y, BACK + 0.072, 0.011, 0.095, 0.008, 0, 0, -Math.floor(mins * 8) / 8 - 0.4, -0.047);
  });
  const sconceGlow = fx.cube.alloc(2, '#FFEFC0');
  fx.cube.set(sconceGlow, -0.84, 1.905, BACK + 0.14, 0.15, 0.012, 0.13);
  fx.cube.set(sconceGlow + 1, 0.84, 1.905, BACK + 0.14, 0.15, 0.012, 0.13);
  const frameSpark = fx.spark.alloc(2, COL.sparkle);
  tick.push((dt, t) => {
    for (let k = 0; k < 2; k++) {
      const tw = Math.pow(Math.max(0, Math.sin(t * 1.3 + k * 2.4)), 3);
      const s = 0.05 + 0.13 * tw;
      fx.spark.set(frameSpark + k, k ? 0.5 : -0.52, k ? 1.12 : 2.32, BACK + 0.2, s, s, s, -0.6, 0, t * 0.8 + k);
    }
  });

  // ---------------- stats stage + marquee board (about-stats, back-right) ----------------
  const BX = 2.25;
  const BY = 1.6;
  room.place(statsStage(), BX, -3.42);
  marqueeBoard(S, BX, BY, BACK);
  stageDressing(S, BX, -3.42);
  shadeDisc(shade, BX, -3.3, 1.3, 0.75, 0.3);
  glow.disc(mat4(BX - 0.66, 0.72, -3.42 - 0.12 - 0.03), 0.19, 0.19, '#FFFFFF', 0.6); // ring light halo
  signsA.push({ rect: [0, 0, 1024, 646], w: 1.88, h: 1.186, matrix: mat4(BX, BY, BACK + 0.075) });
  for (const fxX of [-0.62, 0, 0.62]) glow.disc(mat4(BX + fxX, 1.05, BACK + 0.09), 0.42, 0.34, '#FFE8B0', 0.3);
  // marquee bulbs evenly spaced round the frame, in chase order
  const bulbs = perimeterPoints(BX, BY, 1.99, 1.29, 26);
  const bulb0 = fx.cube.alloc(bulbs.length, COL.bulbDim);
  bulbs.forEach((b, k) => fx.cube.set(bulb0 + k, b.x, b.y, BACK + 0.13, 0.07, 0.07, 0.05));
  let chase = 0;
  tick.push((dt, t) => {
    const a = att.stats;
    chase += dt * (2.2 + a * 7);
    for (let k = 0; k < bulbs.length; k++) {
      const wave = 0.5 + 0.5 * Math.cos(chase - k * 0.8);
      const b = Math.min(1, wave * wave * (0.85 + a * 0.4) + a * 0.25);
      fx.cube.tint(bulb0 + k, _c.lerpColors(BULB_DIM, BULB_ON, b));
    }
  });
  const statSparks = [
    [BX - 1.18, BY + 0.72], [BX + 1.2, BY + 0.6], [BX - 1.22, BY - 0.35],
    [BX + 1.24, BY - 0.15], [BX - 0.3, BY + 0.86], [BX + 0.55, BY - 0.8],
  ];
  const statSpark0 = fx.spark.alloc(statSparks.length, COL.sparkle);
  tick.push((dt, t) => {
    const a = att.stats;
    for (let k = 0; k < statSparks.length; k++) {
      const tw = Math.pow(Math.max(0, Math.sin(t * (1.6 + a * 2.5) + k * 1.7)), 2);
      const s = (0.06 + 0.12 * tw) * (1 + a * 0.8);
      const [x, y] = statSparks[k];
      fx.spark.set(statSpark0 + k, x, y + a * 0.05 * Math.sin(t * 3 + k), BACK + 0.25, s, s, s, -0.6, 0, t * (0.7 + a) + k);
    }
  });

  // ---------------- Telegram channel poster stand + paper planes (about-channel, right-mid) ----------------
  const stand = posterStand();
  room.place(stand, 2.4, 0.6, -0.22);
  stand.updateMatrixWorld(true);
  signsC.push({ rect: [0, 0, 1024, 838], w: 1.22, h: 1.0, matrix: stand.matrixWorld.clone().multiply(stand.userData.signLocal) });
  const posterSpark = fx.spark.alloc(3, COL.sparkle);
  const posterSparkLocal = [
    new THREE.Vector3(-0.66, 1.98, 0.1),
    new THREE.Vector3(0.68, 1.86, 0.12),
    new THREE.Vector3(0.64, 0.94, 0.12),
  ].map((p) => p.applyMatrix4(stand.matrixWorld));
  tick.push((dt, t) => {
    const a = att.channel;
    for (let k = 0; k < 3; k++) {
      const tw = Math.pow(Math.max(0, Math.sin(t * (1.5 + a * 2) + k * 2.1)), 2);
      const s = (0.05 + 0.11 * tw) * (1 + a * 0.6);
      const p = posterSparkLocal[k];
      fx.spark.set(posterSpark + k, p.x, p.y, p.z, s, s, s, -0.6, 0, t + k);
    }
  });
  const planeMesh = new THREE.InstancedMesh(paperPlaneGeometry(1.25), toon(PALETTE.white), 3);
  planeMesh.name = 'paperPlanes';
  planeMesh.frustumCulled = false;
  planeMesh.userData.dynamic = true;
  planeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  G.add(planeMesh);
  addOutline(planeMesh, { px: 1.4 });
  const PC = { x: 2.2, y: 2.2, z: 0.6 };
  let planePhase = 0;
  tick.push((dt, t) => {
    const a = att.channel;
    planePhase += dt * (0.75 + a * 1.0);
    const rx = 0.72 + a * 0.22;
    const rz = 0.4 + a * 0.14;
    const bob = 0.07 + a * 0.12;
    for (let k = 0; k < 3; k++) {
      const th = planePhase + (k * TAU) / 3;
      const x = PC.x + Math.cos(th) * rx;
      const z = PC.z + Math.sin(th) * rz;
      const y = PC.y + Math.sin(th * 2 + k) * bob + (k - 1) * 0.07;
      const vx = -Math.sin(th) * rx;
      const vz = Math.cos(th) * rz;
      const vy = Math.cos(th * 2 + k) * 2 * bob;
      const yaw = Math.atan2(vx, vz);
      const pitch = -Math.atan2(vy, Math.hypot(vx, vz)) * 0.9;
      _e.set(pitch, yaw, 0.45 + a * 0.2, 'YXZ');
      _q.setFromEuler(_e);
      _m.compose(_p.set(x, y, z), _q, _s.set(1, 1, 1));
      planeMesh.setMatrixAt(k, _m);
    }
    planeMesh.instanceMatrix.needsUpdate = true;
  });

  // ---------------- chalkboard easel (about-how, left-mid) ----------------
  const easel = chalkEasel();
  room.place(easel, -2.4, 0.6, 0.24);
  easel.updateMatrixWorld(true);
  const boardMat = easel.matrixWorld.clone().multiply(easel.userData.signLocal);
  signsB.push({ rect: [0, 0, 1024, 729], w: 1.46, h: 1.04, matrix: boardMat });
  const boardQ = new THREE.Quaternion();
  boardMat.decompose(new THREE.Vector3(), boardQ, new THREE.Vector3());
  const qUp = boardQ.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.62)));
  const qDn = boardQ.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.62)));
  const rowY = CHALK_ROWS.map((cy) => (0.5 - cy / 729) * 1.04);
  const ptrX = (72 / 1024 - 0.5) * 1.46;
  const ptr0 = fx.cube.alloc(2, '#F2C75C');
  tick.push((dt, t) => {
    const a = att.how;
    let ly;
    let lz = 0.03;
    if (a > 0.35) {
      const ph = t / 0.8;
      const k = Math.floor(ph) % 4;
      const f = smoothstep(0, 0.45, ph - Math.floor(ph));
      const from = rowY[(k + 3) % 4];
      ly = k === 0 ? rowY[0] + (1 - f) * 0.1 : from + (rowY[k] - from) * f;
      lz += Math.sin(Math.PI * f) * 0.06;
    } else {
      ly = rowY[0] + Math.sin(t * 2.2) * 0.012;
    }
    const lx = ptrX + Math.sin(t * 6) * 0.012;
    _v.set(lx - 0.03, ly + 0.024, lz).applyMatrix4(boardMat);
    fx.cube.setQ(ptr0, _v.x, _v.y, _v.z, 0.1, 0.03, 0.02, qUp);
    _v.set(lx - 0.03, ly - 0.024, lz).applyMatrix4(boardMat);
    fx.cube.setQ(ptr0 + 1, _v.x, _v.y, _v.z, 0.1, 0.03, 0.02, qDn);
  });

  // ---------------- bookshelf (left wall), rug, pouf, plants, mat ----------------
  room.place(richShelf({ w: 1.7, h: 2.1, d: 0.42, rows: 4, seed: 5 }), -3.27, -1.55, Math.PI / 2);
  shadeDisc(shade, -3.2, -1.55, 0.36, 1.0, 0.3);
  const shelfPlant = kit.plant({ size: 0.55, pot: PALETTE.cream });
  shelfPlant.position.y = 2.1;
  room.place(shelfPlant, -3.27, -1.0, 0, { solid: false });
  const shelfBooks = kit.bookStack({ count: 3, seed: 4 });
  shelfBooks.position.y = 2.1;
  room.place(shelfBooks, -3.27, -2.0, Math.PI / 2, { solid: false });
  rugBuilder(S, 0, -0.55, 2.8, 2.0);
  runnerRug(S, 0, 0.62, 3.12, 0.96);
  room.place(poufBuilder(), 0.45, -1.1);
  // an open book on the pouf; a few pages riffle over every few seconds (breeze from the window)
  const BK = { x: 0.49, y: 0.375, z: -1.07, ry: 0.5 };
  {
    const B = new VoxelBuilder();
    B.box(0, 0.006, 0, 0.33, 0.012, 0.215, PALETTE.boxBlue);
    B.boxMin(-0.152, 0.012, -0.097, -0.004, 0.036, 0.097, PALETTE.paper);
    B.boxMin(0.004, 0.012, -0.097, 0.152, 0.036, 0.097, '#FBF6EA');
    B.box(0, 0.03, 0, 0.01, 0.012, 0.19, '#E2D5B8');
    for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) B.box(sx * 0.078, 0.0365, -0.06 + i * 0.03, i === 4 ? 0.06 : 0.11, 0.002, 0.007, '#B5A68C');
    B.box(0.03, 0.038, 0.1, 0.014, 0.004, 0.08, PALETTE.maroon); // ribbon bookmark
    S.merge(B, mat4(BK.x, BK.y, BK.z, 0, BK.ry, 0));
  }
  const page0 = lit.alloc(3, '#FFFDF5');
  tick.push((dt, t) => {
    const f = frac(t / 4.2);
    for (let k = 0; k < 3; k++) {
      const p = smoothstep(0.04 * k, 0.04 * k + 0.16, f);
      const th = p * Math.PI + Math.sin(p * Math.PI) * 0.15;
      setHanging(lit, page0 + k, BK.x, BK.y + 0.034 + k * 0.0005, BK.z, 0.145, 0.003, 0.185, 0, BK.ry, th, 0, 0.0725, 0); // rests inside the page block
    }
  });
  shadeDisc(shade, 0.47, -1.08, 0.4, 0.4, 0.3, 0.032);
  // Telegram corner: a basket of paper planes; chalkboard corner: a stool with chalk and order slips
  room.place(planeBasket(), 3.1, 1.6, -0.2);
  shadeDisc(shade, 3.1, 1.6, 0.3, 0.26, 0.3);
  room.place(chalkStool(), -3.1, 1.75, 0.3);
  shadeDisc(shade, -3.1, 1.75, 0.27, 0.27, 0.3);
  shadeDisc(shade, 2.4, 0.62, 0.85, 0.32, 0.26);
  shadeDisc(shade, -2.4, 0.6, 0.95, 0.42, 0.26);
  shadeDisc(shade, -1.05, -3.62, 0.24, 0.24, 0.28);
  for (const [px, pz] of [[-3.0, 3.15], [3.0, 3.15]]) shadeDisc(shade, px, pz, 0.38, 0.38, 0.28);
  room.place(kit.plant({ size: 1.35, pot: PALETTE.maroon }), -3.0, 3.15);
  room.place(kit.plant({ size: 1.15, pot: PALETTE.goldDeep }), 3.0, 3.15);
  S.boxMin(-0.76, 0, 3.18, 0.76, 0.04, 3.97, PALETTE.maroonDeep); // name mat (over the kit doormat)
  signsB.push({ rect: [0, 737, 640, 287], w: 1.44, h: 0.646, matrix: mat4(0, 0.043, 3.575, -Math.PI / 2) });

  // ---------------- stations ----------------
  room.addStation({
    id: 'about-hello', x: -1.35, z: -2.4, look: { x: -2.15, z: -3.5 }, emote: 'wave', face: 'happy', labelY: 1.75,
    line: { my: 'မင်္ဂလာပါရှင့်! ကျွန်မ စာရေးတဲ့ အခန်းလေးကို ကြိုဆိုပါတယ်', en: 'Hello! Welcome to the little room where I write.' },
  });
  room.addStation({
    id: 'about-stats', x: 1.9, z: -2.0, look: { x: 2.25, z: -3.9 }, emote: 'cheer', face: 'star', labelY: 2.55,
    line: { my: 'အားပေးကြလို့ ကျေးဇူးအများကြီး တင်ပါတယ်ရှင့်', en: 'Thank you so much for all your support!' },
  });
  room.addStation({
    id: 'about-channel', x: 2.1, z: 2.1, look: { x: 2.4, z: 0.6 }, emote: 'phone', face: 'wink', labelY: 2.6,
    line: { my: 'Telegram Channel လေး Join ပေးပါဦးနော်', en: 'Please join my Telegram channel!' },
  });
  room.addStation({
    id: 'about-how', x: -2.1, z: 2.1, look: { x: -2.4, z: 0.6 }, emote: 'think', face: 'think', labelY: 2.25,
    line: { my: 'မှာယူရတာ လွယ်ပါတယ်၊ ၄ ဆင့်ပဲ ရှိပါတယ်နော်', en: 'Ordering is easy, just 4 steps!' },
  });

  // ---------------- signs (3 atlases = 3 textures, 3 draw calls) ----------------
  drawStatsBoard(atlasA, 0, 0, 1024, 646);
  drawMotto(atlasA, 0, 656, 1024, 300);
  atlasText(atlasA, 0, 960, 256, 64, [{ text: 'မာရာ', size: 30, color: PALETTE.maroonDeep }], { bg: '#D9B45A', border: PALETTE.goldDeep, borderWidth: 4, radius: 12 });
  atlasText(atlasA, 268, 960, 128, 64, [{ text: 'Writer', size: 30, weight: 600, font: FONT_SERIF, color: PALETTE.maroon }]);
  drawChalkboard(atlasB, 0, 0, 1024, 729);
  drawNameMat(atlasB, 0, 737, 640, 287);
  drawTelegramPoster(atlasC, 0, 0, 1024, 838);
  const signMeshes = [atlasMesh(atlasA, signsA, 'signsStats'), atlasMesh(atlasB, signsB, 'signsChalk'), atlasMesh(atlasC, signsC, 'signsTelegram')];
  for (const m of signMeshes) G.add(m);
  room.textures.push(atlasA.texture, atlasB.texture, atlasC.texture);

  // ---------------- finish: static decor, FX, glows, bake ----------------
  const decor = S.mesh({ outline: true, px: 1.4 });
  decor.name = 'aboutDecor';
  G.add(decor);
  fx.seal();
  G.add(fx.group);
  const glowMesh = glow.mesh('aboutGlow');
  G.add(glowMesh);
  const shadeMesh = shade.mesh('aboutShade');
  shadeMesh.renderOrder = 1;
  G.add(shadeMesh);
  lit.seal();
  G.add(lit.group);
  room.bake();

  room.animators.push((dt, t, state) => {
    att.hello = damp(att.hello, attentionTarget(state, 'about-hello'), 5, dt);
    att.stats = damp(att.stats, attentionTarget(state, 'about-stats'), 5, dt);
    att.channel = damp(att.channel, attentionTarget(state, 'about-channel'), 5, dt);
    att.how = damp(att.how, attentionTarget(state, 'about-how'), 5, dt);
    for (let i = 0; i < tick.length; i++) tick[i](dt, t);
    // lamps breathe a little
    const breathe = 0.5 + 0.5 * Math.sin(t * 1.7);
    _c.lerpColors(GLOW_A, GLOW_B, breathe * 0.6 + att.hello * 0.4);
    fx.cube.tint(lampGlow, _c);
    fx.cube.tint(sconceGlow, _c);
    fx.cube.tint(sconceGlow + 1, _c);
    glowMesh.material.opacity = 0.85 + 0.15 * breathe;
    fx.commit();
    lit.commit();
  });

  room.update(0, 0, {}); // place every instanced FX/plane before the first frame

  const ownMaterials = [glowMesh.material, shadeMesh.material, ...signMeshes.map((m) => m.material)];
  const baseDispose = room.dispose;
  room.dispose = () => {
    room.scene.traverse((o) => {
      if (o.isInstancedMesh) o.dispose(); // frees instanceMatrix / instanceColor buffers
    });
    baseDispose();
    for (const m of ownMaterials) m.dispose();
  };
  return room;
}

// ---------------------------------------------------------------------------------------------
// Props (VoxelBuilder sub-assemblies)
// ---------------------------------------------------------------------------------------------
/**
 * Window opening 1.5 x 1.0 m centred at the local origin on the wall (z = 0), curtains + valance.
 * The curtain skirts below the tie-backs are not built here: they are pushed to `skirts`
 * ({ x, y, z, w, h, d, color } in window space, y = top/pivot) so they can sway (lit pool).
 */
function windowBuilder(skirts = []) {
  const v = new VoxelBuilder();
  const ww = 1.5;
  const wh = 1.0;
  const fr = 0.08;
  const F = COL.frameCream;
  const sillY = -wh / 2 - fr + 0.01;
  v.boxMin(-ww / 2 - fr, -wh / 2 - fr, 0, ww / 2 + fr, -wh / 2, 0.1, F);
  v.boxMin(-ww / 2 - fr, wh / 2, 0, ww / 2 + fr, wh / 2 + fr, 0.1, F);
  v.boxMin(-ww / 2 - fr, -wh / 2, 0, -ww / 2, wh / 2, 0.1, F);
  v.boxMin(ww / 2, -wh / 2, 0, ww / 2 + fr, wh / 2, 0.1, F);
  for (const mx of [-0.25, 0.25]) v.boxMin(mx - 0.025, -wh / 2, 0, mx + 0.025, wh / 2, 0.065, F); // 6 panes
  v.boxMin(-ww / 2, -0.03, 0, ww / 2, 0.03, 0.065, F);
  v.boxMin(-ww / 2, -wh / 2, 0.06, ww / 2, -wh / 2 + 0.025, 0.08, '#E9DCC4'); // inner bottom rail shade
  v.boxMin(-ww / 2 - 0.16, -wh / 2 - fr - 0.07, 0, ww / 2 + 0.16, sillY, 0.22, PALETTE.goldDeep); // sill
  v.boxMin(-ww / 2 - 0.17, -wh / 2 - fr - 0.1, 0, ww / 2 + 0.17, -wh / 2 - fr - 0.07, 0.2, PALETTE.bronze); // sill lip
  for (let i = 0; i < 6; i++) v.box(-ww / 2 + 0.05 + i * 0.28, -wh / 2 - fr - 0.13, 0.04, 0.05, 0.06, 0.06, PALETTE.goldDeep); // corbels
  // a tiny succulent, a flower pot and two little books on the sill
  v.boxMin(0.42, sillY, 0.07, 0.54, sillY + 0.1, 0.17, PALETTE.cream);
  v.boxMin(0.415, sillY + 0.07, 0.065, 0.545, sillY + 0.09, 0.175, PALETTE.gold);
  v.box(0.48, sillY + 0.14, 0.12, 0.13, 0.08, 0.1, PALETTE.leaf);
  v.box(0.46, sillY + 0.19, 0.11, 0.07, 0.06, 0.07, PALETTE.leafDark);
  v.boxMin(-0.56, sillY, 0.08, -0.42, sillY + 0.11, 0.18, PALETTE.maroon);
  v.boxMin(-0.57, sillY + 0.08, 0.075, -0.41, sillY + 0.1, 0.185, PALETTE.gold);
  v.box(-0.49, sillY + 0.15, 0.13, 0.1, 0.07, 0.08, PALETTE.leafDark);
  for (const [fx, fy, fz, c] of [[-0.53, 0.21, 0.12, PALETTE.rose], [-0.46, 0.24, 0.14, '#F6E3AE'], [-0.5, 0.27, 0.11, PALETTE.rose]]) {
    v.box(fx, sillY + fy, fz, 0.055, 0.05, 0.055, c);
  }
  boxR(v, -0.3, sillY + 0.02, 0.13, 0.2, 0.035, 0.13, PALETTE.boxBlue, 0, 0.12, 0);
  boxR(v, -0.29, sillY + 0.053, 0.13, 0.18, 0.03, 0.12, '#3E6B4F', 0, -0.1, 0);
  // sticky notes on the frame (her to-do list)
  const notes = [[-0.79, 0.3, '#F7E08A', 0.12], [-0.79, 0.16, '#F2B5BE', -0.1], [0.79, -0.22, '#BFD8F0', 0.08], [0.79, -0.36, '#F7E08A', -0.15], [0.6, -0.54, '#CFE6B8', 0.1]];
  for (const [nx, ny, c, r] of notes) boxR(v, nx, ny, 0.105, 0.075, 0.075, 0.008, c, 0, 0, r);
  // pleated curtains with gold tie-backs (the skirts below the tie-backs sway)
  for (const side of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const x0 = side * (ww / 2 - 0.1 + k * 0.115);
      const x1 = x0 + side * 0.115;
      const deep = k % 2 === 0;
      const z0 = deep ? 0.11 : 0.13;
      const col = deep ? COL.curtain : COL.curtainDark;
      v.boxMin(Math.min(x0, x1), -0.13, z0, Math.max(x0, x1), wh / 2 + 0.1, z0 + 0.04, col);
      skirts.push({ x: (x0 + x1) / 2, y: -0.13, z: z0 + 0.02, w: 0.115 + (k === 3 ? 0.02 : 0), h: wh / 2 + 0.26 - 0.13, d: 0.04, color: col, k, side });
    }
    const xa = side * (ww / 2 - 0.12);
    const xb = side * (ww / 2 + 0.37);
    v.boxMin(Math.min(xa, xb), -0.16, 0.1, Math.max(xa, xb), -0.1, 0.19, PALETTE.gold);
    v.box(side * (ww / 2 - 0.13), -0.2, 0.18, 0.05, 0.12, 0.05, PALETTE.gold); // tassel
  }
  // valance with a gold trim and little scallops
  v.boxMin(-ww / 2 - 0.4, wh / 2 + 0.03, 0.12, ww / 2 + 0.4, wh / 2 + 0.22, 0.21, COL.curtain);
  v.boxMin(-ww / 2 - 0.41, wh / 2 + 0.03, 0.2, ww / 2 + 0.41, wh / 2 + 0.06, 0.22, PALETTE.gold);
  v.boxMin(-ww / 2 - 0.41, wh / 2 + 0.19, 0.2, ww / 2 + 0.41, wh / 2 + 0.215, 0.22, PALETTE.gold); // top trim
  for (let i = 0; i < 8; i++) {
    v.box(-ww / 2 - 0.29 + i * 0.3, wh / 2 + 0.0, 0.17, 0.14, 0.07, 0.07, COL.curtain);
    v.box(-ww / 2 - 0.29 + i * 0.3, wh / 2 - 0.05, 0.19, 0.035, 0.035, 0.035, PALETTE.gold); // bead tassels
  }
  // curtain rod finials poking out past the valance
  for (const sx of [-1, 1]) {
    v.box(sx * (ww / 2 + 0.47), wh / 2 + 0.13, 0.16, 0.08, 0.025, 0.025, PALETTE.goldDeep);
    v.box(sx * (ww / 2 + 0.53), wh / 2 + 0.13, 0.16, 0.07, 0.07, 0.07, PALETTE.gold);
    v.box(sx * (ww / 2 + 0.57), wh / 2 + 0.13, 0.16, 0.025, 0.035, 0.035, PALETTE.goldDeep);
  }
  return v;
}

function typewriter(v, x, y, z) {
  const body = PALETTE.maroon;
  const deep = PALETTE.maroonDeep;
  const key = PALETTE.cream;
  const gold = PALETTE.gold;
  v.boxMin(x - 0.32, y, z - 0.2, x + 0.32, y + 0.045, z + 0.25, deep); // base plate
  v.boxMin(x - 0.3, y + 0.045, z - 0.19, x + 0.3, y + 0.15, z + 0.04, body); // body
  for (let r = 0; r < 3; r++) {
    const kz = z + 0.2 - r * 0.075;
    const top = y + 0.07 + r * 0.03;
    v.boxMin(x - 0.28, y + 0.045, kz - 0.04, x + 0.28, top, kz + 0.04, deep);
    for (let k = 0; k < 6; k++) v.box(x - 0.2 + k * 0.08 + (r === 1 ? 0.03 : 0), top + 0.013, kz, 0.054, 0.026, 0.052, key);
  }
  v.boxMin(x - 0.29, y + 0.15, z - 0.19, x + 0.29, y + 0.245, z - 0.03, body); // carriage housing
  v.box(x, y + 0.197, z - 0.025, 0.17, 0.05, 0.012, gold); // badge
  cylinder(v, x, y + 0.29, z - 0.11, 0.052, 0.66, PALETTE.ink, { axis: 'x', segs: 10 }); // platen
  for (const sx of [-1, 1]) v.box(x + sx * 0.355, y + 0.29, z - 0.11, 0.05, 0.09, 0.09, gold); // knobs
  boxR(v, x - 0.36, y + 0.36, z - 0.06, 0.15, 0.024, 0.024, gold, 0, 0.35, 0.6); // return lever
  const P = new VoxelBuilder();
  P.box(0, 0, 0, 0.38, 0.36, 0.008, PALETTE.white);
  for (let i = 0; i < 6; i++) P.box(-0.02 + (i % 2) * 0.015, 0.11 - i * 0.042, 0.006, i === 5 ? 0.14 : 0.27, 0.012, 0.004, '#A6957C');
  v.merge(P, mat4(x, y + 0.45, z - 0.14, -0.25));
}

function writerMug(v, x, y, z) {
  const c = PALETTE.cream;
  v.boxMin(x - 0.08, y, z - 0.08, x + 0.08, y + 0.18, z + 0.08, c);
  v.boxMin(x - 0.082, y, z - 0.082, x + 0.082, y + 0.028, z + 0.082, PALETTE.maroon);
  v.boxMin(x - 0.066, y + 0.17, z - 0.066, x + 0.066, y + 0.183, z + 0.066, '#5B3A24');
  v.boxMin(x + 0.08, y + 0.05, z - 0.022, x + 0.135, y + 0.075, z + 0.022, c);
  v.boxMin(x + 0.11, y + 0.05, z - 0.022, x + 0.135, y + 0.145, z + 0.022, c);
  v.boxMin(x + 0.08, y + 0.12, z - 0.022, x + 0.135, y + 0.145, z + 0.022, c);
}

function paperStack(v, x, y, z, n, rot, seed) {
  let yy = y;
  for (let i = 0; i < n; i++) {
    const h = 0.012;
    const col = i % 3 === 2 ? '#F1E6D0' : PALETTE.white;
    boxR(v, x + (hash(seed + i) - 0.5) * 0.025, yy + h / 2, z + (hash(seed * 3 + i) - 0.5) * 0.025, 0.27, h, 0.2, col, 0, rot + (hash(seed + i * 7) - 0.5) * 0.16, 0);
    yy += h;
  }
  return yy;
}

function inkAndQuill(v, x, y, z) {
  v.boxMin(x - 0.05, y, z - 0.05, x + 0.05, y + 0.065, z + 0.05, PALETTE.ink);
  v.boxMin(x - 0.032, y + 0.065, z - 0.032, x + 0.032, y + 0.08, z + 0.032, PALETTE.gold);
  addQuill(v, mat4(x + 0.015, y + 0.05, z, 0, 0, -0.38), { len: 0.38, vane: PALETTE.white, shaft: PALETTE.goldDeep, nib: PALETTE.ink, depth: 0.022 });
}

function pencilCup(v, x, y, z) {
  cylinder(v, x, y + 0.055, z, 0.05, 0.11, PALETTE.maroon, { segs: 8 });
  boxR(v, x - 0.015, y + 0.15, z, 0.018, 0.17, 0.018, PALETTE.gold, 0, 0, 0.2);
  boxR(v, x + 0.02, y + 0.14, z + 0.01, 0.018, 0.15, 0.018, PALETTE.cream, 0.1, 0, -0.25);
  boxR(v, x, y + 0.16, z - 0.015, 0.018, 0.18, 0.018, PALETTE.boxBlue, -0.15, 0, 0.05);
}

/** Banker's desk lamp with a maroon shade (glow strip under it is an FX cube). */
function deskLamp(v, x, y, z) {
  v.boxMin(x - 0.1, y, z - 0.075, x + 0.1, y + 0.035, z + 0.075, PALETTE.gold);
  v.box(x, y + 0.15, z - 0.02, 0.028, 0.24, 0.028, PALETTE.goldDeep);
  const L = new VoxelBuilder();
  L.box(0, 0.025, 0, 0.34, 0.05, 0.15, PALETTE.maroon);
  L.box(0, -0.012, 0.065, 0.34, 0.04, 0.025, PALETTE.maroon);
  L.box(0, -0.012, -0.065, 0.34, 0.04, 0.025, PALETTE.maroon);
  for (const sx of [-1, 1]) L.box(sx * 0.175, 0.01, 0, 0.014, 0.07, 0.16, PALETTE.gold);
  v.merge(L, mat4(x, y + 0.29, z + 0.04, 0.2));
}

function sconce(v, x, y, z) {
  v.boxMin(x - 0.055, y - 0.11, z, x + 0.055, y + 0.07, z + 0.03, PALETTE.gold);
  v.boxMin(x - 0.016, y - 0.035, z + 0.03, x + 0.016, y - 0.005, z + 0.15, PALETTE.goldDeep);
  v.boxMin(x - 0.03, y - 0.03, z + 0.11, x + 0.03, y + 0.04, z + 0.17, PALETTE.gold);
  v.boxMin(x - 0.095, y + 0.045, z + 0.06, x + 0.095, y + 0.21, z + 0.22, PALETTE.cream);
  v.boxMin(x - 0.1, y + 0.19, z + 0.055, x + 0.1, y + 0.215, z + 0.225, PALETTE.gold);
}

/** Ornate gold frame with an EMPTY picture area (Maya's photo goes here). Group name 'photoFrame'. */
function photoFrame() {
  const grp = new THREE.Group();
  grp.name = 'photoFrame';
  const v = new VoxelBuilder();
  const w = 0.96;
  const h = 1.22;
  const b = 0.09;
  v.boxMin(-w / 2 - 0.12, -h / 2 - 0.12, -0.055, w / 2 + 0.12, h / 2 + 0.12, -0.025, PALETTE.maroon); // backing board
  v.boxMin(-w / 2 - 0.135, -h / 2 - 0.135, -0.06, w / 2 + 0.135, -h / 2 - 0.115, -0.02, PALETTE.goldDeep);
  v.boxMin(-w / 2, -h / 2, -0.025, w / 2, -h / 2 + b, 0.055, PALETTE.gold);
  v.boxMin(-w / 2, h / 2 - b, -0.025, w / 2, h / 2, 0.055, PALETTE.gold);
  v.boxMin(-w / 2, -h / 2 + b, -0.025, -w / 2 + b, h / 2 - b, 0.055, PALETTE.gold);
  v.boxMin(w / 2 - b, -h / 2 + b, -0.025, w / 2, h / 2 - b, 0.055, PALETTE.gold);
  const ib = 0.022; // inner bevel lip
  v.boxMin(-w / 2 + b, -h / 2 + b, -0.025, w / 2 - b, -h / 2 + b + ib, 0.03, PALETTE.goldDeep);
  v.boxMin(-w / 2 + b, h / 2 - b - ib, -0.025, w / 2 - b, h / 2 - b, 0.03, PALETTE.goldDeep);
  v.boxMin(-w / 2 + b, -h / 2 + b, -0.025, -w / 2 + b + ib, h / 2 - b, 0.03, PALETTE.goldDeep);
  v.boxMin(w / 2 - b - ib, -h / 2 + b, -0.025, w / 2 - b, h / 2 - b, 0.03, PALETTE.goldDeep);
  v.boxMin(-w / 2 + b, -h / 2 + b, -0.03, w / 2 - b, h / 2 - b, -0.02, '#EADFC9'); // empty picture area
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      v.box(sx * (w / 2 - b / 2), sy * (h / 2 - b / 2), 0.07, 0.13, 0.13, 0.03, PALETTE.goldDeep);
      v.box(sx * (w / 2 - b / 2), sy * (h / 2 - b / 2), 0.09, 0.06, 0.06, 0.02, PALETTE.gold);
    }
  }
  addSparkle(v, 0, h / 2 + 0.24, -0.02, 0.24, PALETTE.gold, { depth: 0.05 });
  v.boxMin(-0.18, -h / 2 + 0.005, 0.055, 0.18, -h / 2 + 0.085, 0.075, PALETTE.goldDeep); // name plate backing
  grp.add(v.mesh({ outline: true, px: 1.4 }));
  // Where the integrator puts the photo (frame-local; plane facing +Z, centred).
  grp.userData.picture = { width: w - 2 * b - 2 * ib, height: h - 2 * b - 2 * ib, z: 0.0 };
  return grp;
}

/** Little stage under the marquee board: footprint covers the front step. */
function statsStage() {
  const v = new VoxelBuilder();
  const w = 2.1;
  const d = 1.0;
  const h = 0.22;
  const top = '#C9965F';
  v.boxMin(-w / 2, 0, -d / 2, w / 2, h - 0.05, d / 2, PALETTE.maroon);
  v.boxMin(-w / 2 - 0.03, h - 0.05, -d / 2, w / 2 + 0.03, h, d / 2 + 0.03, top);
  v.boxMin(-w / 2 - 0.035, h - 0.075, d / 2, w / 2 + 0.035, h - 0.045, d / 2 + 0.05, PALETTE.gold);
  for (let i = 0; i < 9; i++) v.box(-w / 2 + 0.17 + (i * (w - 0.34)) / 8, 0.085, d / 2 + 0.006, 0.05, 0.05, 0.02, PALETTE.gold);
  v.boxMin(-0.4, 0, d / 2, 0.4, 0.105, d / 2 + 0.24, top); // step
  v.boxMin(-0.41, 0.075, d / 2 + 0.2, 0.41, 0.105, d / 2 + 0.25, PALETTE.gold);
  for (const ox of [-0.65, 0, 0.65]) {
    // footlights: bronze cans aimed up at the board, lens facing up/back
    const c = new VoxelBuilder();
    c.box(0, 0, 0, 0.16, 0.11, 0.13, PALETTE.bronze);
    c.box(0, 0, -0.07, 0.18, 0.13, 0.025, PALETTE.gold);
    c.box(0, 0, -0.084, 0.12, 0.08, 0.006, '#FFF3C4');
    c.box(0, -0.07, 0.02, 0.05, 0.05, 0.05, PALETTE.ink);
    v.merge(c, mat4(ox, h + 0.085, d / 2 - 0.1, 1.0, 0, 0));
  }
  for (const sx of [-1, 1]) v.box(sx * (w / 2 - 0.12), h + 0.35, -d / 2 + 0.06, 0.06, 0.7, 0.06, PALETTE.gold); // posts to the board
  const grp = new THREE.Group();
  grp.name = 'statsStage';
  grp.add(v.mesh({ outline: true, px: 1.5 }));
  grp.userData.footprint = { w: w + 0.06, d: 1.5 };
  return grp;
}

/** Marquee board frame on the back wall (the numbers are an atlas sign, the bulbs FX cubes). */
function marqueeBoard(v, x, y, back) {
  const w = 2.1;
  const h = 1.4;
  const band = 0.11;
  v.boxMin(x - w / 2, y - h / 2, back, x + w / 2, y + h / 2, back + 0.07, PALETTE.maroonDeep);
  v.boxMin(x - w / 2, y - h / 2, back + 0.07, x + w / 2, y - h / 2 + band, back + 0.11, PALETTE.gold);
  v.boxMin(x - w / 2, y + h / 2 - band, back + 0.07, x + w / 2, y + h / 2, back + 0.11, PALETTE.gold);
  v.boxMin(x - w / 2, y - h / 2 + band, back + 0.07, x - w / 2 + band, y + h / 2 - band, back + 0.11, PALETTE.gold);
  v.boxMin(x + w / 2 - band, y - h / 2 + band, back + 0.07, x + w / 2, y + h / 2 - band, back + 0.11, PALETTE.gold);
  addSparkle(v, x, y + h / 2 + 0.17, back + 0.06, 0.26, PALETTE.gold, { depth: 0.05 });
}

/** n points evenly spaced clockwise round a w x h rectangle centred at (cx, cy), starting top-left. */
function perimeterPoints(cx, cy, w, h, n) {
  const pts = [];
  const per = 2 * (w + h);
  for (let i = 0; i < n; i++) {
    let d = (i / n) * per;
    let x;
    let y;
    if (d < w) {
      x = -w / 2 + d;
      y = h / 2;
    } else if ((d -= w) < h) {
      x = w / 2;
      y = h / 2 - d;
    } else if ((d -= h) < w) {
      x = w / 2 - d;
      y = -h / 2;
    } else {
      d -= w;
      x = -w / 2;
      y = -h / 2 + d;
    }
    pts.push({ x: cx + x, y: cy + y });
  }
  return pts;
}

/** Free-standing poster stand for the Telegram channel poster. */
function posterStand() {
  const v = new VoxelBuilder();
  const pw = 1.22;
  const ph = 1.0;
  const cy = 1.42;
  const tilt = -0.1;
  const lx = pw / 2 + 0.11;
  for (const sx of [-1, 1]) {
    v.box(sx * lx, 1.04, -0.02, 0.07, 2.08, 0.07, PALETTE.woodDark);
    v.box(sx * lx, 0.03, 0, 0.13, 0.06, 0.42, PALETTE.woodDark);
    addSparkle(v, sx * lx, 2.2, -0.02, 0.18, PALETTE.gold, { depth: 0.04 });
  }
  const b = new VoxelBuilder();
  b.boxMin(-pw / 2 - 0.07, -ph / 2 - 0.07, -0.03, pw / 2 + 0.07, ph / 2 + 0.07, 0.03, PALETTE.gold);
  b.boxMin(-pw / 2, -ph / 2, 0.03, pw / 2, ph / 2, 0.034, PALETTE.telegram);
  for (const sx of [-1, 1]) b.box(sx * (pw / 2 + 0.085), 0, 0, 0.06, 0.06, 0.05, PALETTE.goldDeep); // brackets to the legs
  v.merge(b, mat4(0, cy, 0, tilt));
  v.boxMin(-lx + 0.04, 0.6, -0.12, lx - 0.04, 0.65, 0.16, PALETTE.wood); // shelf
  const plane = paperPlaneGeometry(1.0);
  v.add(plane, PALETTE.white, mat4(-0.32, 0.68, 0.02, 0, 0.5, 0));
  v.add(plane, '#F4ECDC', mat4(0.02, 0.68, 0.03, 0, -0.3, 0.05));
  v.add(plane, PALETTE.white, mat4(-0.12, 0.71, 0.0, 0, 0.9, 0));
  plane.dispose();
  v.boxMin(0.3, 0.65, -0.06, 0.46, 0.79, 0.1, PALETTE.maroon); // a little pot
  v.box(0.38, 0.86, 0.02, 0.17, 0.12, 0.15, PALETTE.leaf);
  const grp = new THREE.Group();
  grp.name = 'telegramStand';
  grp.add(v.mesh({ outline: true, px: 1.5 }));
  grp.userData.footprint = { w: 2 * lx + 0.07, d: 0.5 };
  grp.userData.signLocal = mat4(0, cy, 0, tilt).multiply(mat4(0, 0, 0.04));
  return grp;
}

const CHALK_ROWS = [244, 366, 488, 610];
/** A-frame easel with a slate chalkboard (text is an atlas sign). */
function chalkEasel() {
  const v = new VoxelBuilder();
  const bw = 1.46;
  const bh = 1.04;
  const cy = 1.3;
  const tilt = -0.2;
  const board = new VoxelBuilder();
  board.boxMin(-bw / 2 - 0.08, -bh / 2 - 0.08, -0.035, bw / 2 + 0.08, bh / 2 + 0.08, 0.035, PALETTE.woodDark);
  board.boxMin(-bw / 2, -bh / 2, 0.035, bw / 2, bh / 2, 0.04, COL.slate);
  board.boxMin(-bw / 2, -bh / 2 - 0.12, -0.01, bw / 2, -bh / 2 - 0.08, 0.14, PALETTE.wood); // chalk tray
  board.boxMin(-bw / 2, -bh / 2 - 0.12, 0.12, bw / 2, -bh / 2 - 0.05, 0.145, PALETTE.wood);
  board.box(-0.42, -bh / 2 - 0.065, 0.07, 0.12, 0.028, 0.03, PALETTE.white);
  board.box(-0.25, -bh / 2 - 0.065, 0.06, 0.09, 0.028, 0.03, '#F2C75C');
  board.box(-0.12, -bh / 2 - 0.065, 0.075, 0.07, 0.028, 0.03, PALETTE.rose);
  board.box(0.38, -bh / 2 - 0.05, 0.065, 0.22, 0.06, 0.08, PALETTE.maroon); // eraser
  board.box(0.38, -bh / 2 - 0.015, 0.065, 0.22, 0.02, 0.08, PALETTE.wood);
  v.merge(board, mat4(0, cy, 0, tilt));
  for (const sx of [-1, 1]) boxR(v, sx * 0.86, 0.98, 0.02, 0.075, 2.0, 0.075, PALETTE.woodDark, tilt, 0, 0);
  boxR(v, 0, 0.95, -0.36, 0.075, 1.95, 0.075, PALETTE.woodDark, 0.2, 0, 0);
  boxR(v, 0, 0.55, 0.11, 1.72, 0.06, 0.06, PALETTE.woodDark, tilt, 0, 0);
  addSparkle(v, -0.86, 2.0, -0.17, 0.16, PALETTE.gold, { depth: 0.04, rx: tilt });
  addSparkle(v, 0.86, 2.0, -0.17, 0.16, PALETTE.gold, { depth: 0.04, rx: tilt });
  const grp = new THREE.Group();
  grp.name = 'chalkEasel';
  grp.add(v.mesh({ outline: true, px: 1.5 }));
  grp.userData.footprint = { w: 1.8, d: 0.8 };
  grp.userData.signLocal = mat4(0, cy, 0, tilt).multiply(mat4(0, 0, 0.045));
  return grp;
}

function rugBuilder(v, x, z, w, d) {
  v.boxMin(x - w / 2, 0, z - d / 2, x + w / 2, 0.02, z + d / 2, PALETTE.gold);
  v.boxMin(x - w / 2 + 0.09, 0, z - d / 2 + 0.09, x + w / 2 - 0.09, 0.024, z + d / 2 - 0.09, PALETTE.maroon);
  const ix = w / 2 - 0.24;
  const iz = d / 2 - 0.24;
  const t = 0.035;
  v.boxMin(x - ix, 0, z - iz, x + ix, 0.027, z - iz + t, PALETTE.cream);
  v.boxMin(x - ix, 0, z + iz - t, x + ix, 0.027, z + iz, PALETTE.cream);
  v.boxMin(x - ix, 0, z - iz, x - ix + t, 0.027, z + iz, PALETTE.cream);
  v.boxMin(x + ix - t, 0, z - iz, x + ix, 0.027, z + iz, PALETTE.cream);
  addSparkle(v, x, 0.026, z, 0.8, PALETTE.gold, { depth: 0.012, rx: -Math.PI / 2 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) addSparkle(v, x + sx * (ix - 0.22), 0.026, z + sz * (iz - 0.2), 0.22, PALETTE.gold, { depth: 0.01, rx: -Math.PI / 2 });
  // darker selvedge just inside the gold border, and a band of little gold diamonds
  const s0 = 0.09;
  const s1 = 0.13;
  v.boxMin(x - w / 2 + s0, 0, z - d / 2 + s0, x + w / 2 - s0, 0.0255, z - d / 2 + s1, PALETTE.maroonDeep);
  v.boxMin(x - w / 2 + s0, 0, z + d / 2 - s1, x + w / 2 - s0, 0.0255, z + d / 2 - s0, PALETTE.maroonDeep);
  v.boxMin(x - w / 2 + s0, 0, z - d / 2 + s0, x - w / 2 + s1, 0.0255, z + d / 2 - s0, PALETTE.maroonDeep);
  v.boxMin(x + w / 2 - s1, 0, z - d / 2 + s0, x + w / 2 - s0, 0.0255, z + d / 2 - s0, PALETTE.maroonDeep);
  const bx = (w / 2 + ix) / 2 - 0.035;
  const bz = (d / 2 + iz) / 2 - 0.035;
  for (let i = 0; i <= 12; i++) {
    const fx = x - bx + (i * 2 * bx) / 12;
    for (const sz of [-1, 1]) boxR(v, fx, 0.026, z + sz * bz, 0.05, 0.006, 0.05, i % 2 ? PALETTE.cream : PALETTE.gold, 0, Math.PI / 4, 0);
  }
  for (let i = 1; i < 8; i++) {
    const fz = z - bz + (i * 2 * bz) / 8;
    for (const sx of [-1, 1]) boxR(v, x + sx * bx, 0.026, fz, 0.05, 0.006, 0.05, i % 2 ? PALETTE.cream : PALETTE.gold, 0, Math.PI / 4, 0);
  }
  // medallion: a ring of cream dots and rose petals round the big sparkle
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU;
    boxR(v, x + Math.cos(a) * 0.56, 0.027, z + Math.sin(a) * 0.42, k % 2 ? 0.05 : 0.07, 0.006, k % 2 ? 0.05 : 0.035, k % 2 ? PALETTE.cream : '#C9606A', 0, -a, 0);
  }
  for (let i = 0; i < 16; i++) {
    const fx = x - w / 2 + 0.12 + (i * (w - 0.24)) / 15;
    const c = i % 2 ? PALETTE.gold : PALETTE.cream;
    v.box(fx, 0.008, z - d / 2 - 0.045, 0.045, 0.016, 0.09, c);
    v.box(fx, 0.008, z + d / 2 + 0.045, 0.045, 0.016, 0.09, c);
  }
}

/** Long runner from the entrance to the big rug: gold border, cream chevrons, little sparkles. */
function runnerRug(v, x, z0, z1, w) {
  v.boxMin(x - w / 2, 0, z0, x + w / 2, 0.016, z1, PALETTE.gold);
  v.boxMin(x - w / 2 + 0.06, 0, z0 + 0.06, x + w / 2 - 0.06, 0.02, z1 - 0.06, '#7E2531');
  v.boxMin(x - w / 2 + 0.06, 0, z0 + 0.06, x - w / 2 + 0.1, 0.021, z1 - 0.06, PALETTE.maroonDeep);
  v.boxMin(x + w / 2 - 0.1, 0, z0 + 0.06, x + w / 2 - 0.06, 0.021, z1 - 0.06, PALETTE.maroonDeep);
  for (const sx of [-1, 1]) v.boxMin(x + sx * (w / 2 - 0.17) - 0.015, 0, z0 + 0.14, x + sx * (w / 2 - 0.17) + 0.015, 0.022, z1 - 0.14, PALETTE.cream);
  const n = Math.floor((z1 - z0 - 0.3) / 0.32);
  for (let i = 0; i < n; i++) {
    const zc = z0 + 0.3 + i * 0.32;
    if (i % 3 === 1) addSparkle(v, x, 0.022, zc, 0.2, PALETTE.gold, { depth: 0.008, rx: -Math.PI / 2 });
    else {
      boxR(v, x - 0.07, 0.022, zc, 0.17, 0.004, 0.035, i % 2 ? PALETTE.cream : '#E2B85A', 0, 0.62, 0); // chevron
      boxR(v, x + 0.07, 0.022, zc, 0.17, 0.004, 0.035, i % 2 ? PALETTE.cream : '#E2B85A', 0, -0.62, 0);
    }
  }
  for (let i = 0; i < 7; i++) v.box(x - w / 2 + 0.1 + (i * (w - 0.2)) / 6, 0.008, z0 - 0.04, 0.04, 0.016, 0.08, i % 2 ? PALETTE.gold : PALETTE.cream); // fringe
}

function wastebasket() {
  const v = new VoxelBuilder();
  v.boxMin(-0.15, 0, -0.15, 0.15, 0.04, 0.15, PALETTE.woodDark);
  for (let i = 0; i < 4; i++) {
    // woven slats
    const c = i % 2 ? PALETTE.wood : '#C99B66';
    v.boxMin(-0.16, 0.04 + i * 0.07, -0.16, 0.16, 0.11 + i * 0.07, 0.16, c);
  }
  v.boxMin(-0.165, 0.32, -0.165, 0.165, 0.35, 0.165, PALETTE.goldDeep);
  v.boxMin(-0.13, 0.25, -0.13, 0.13, 0.33, 0.13, '#3A2C20'); // dark inside
  const balls = [[-0.05, 0.37, -0.03, 0.12], [0.06, 0.39, 0.04, 0.11], [0.0, 0.43, -0.05, 0.1], [0.07, 0.36, -0.07, 0.09]];
  balls.forEach(([x, y, z, s], i) => boxR(v, x, y, z, s, s * 0.9, s, i % 2 ? PALETTE.white : '#F2EADB', 0.4 * i, 0.7 * i, 0.3));
  boxR(v, 0.3, 0.05, 0.16, 0.1, 0.09, 0.1, PALETTE.white, 0.3, 0.5, 0.2); // the one that missed
  const grp = new THREE.Group();
  grp.name = 'wastebasket';
  grp.add(v.mesh({ outline: true, px: 1.4 }));
  grp.userData.footprint = { w: 0.36, d: 0.36 };
  return grp;
}

function poufBuilder() {
  const v = new VoxelBuilder();
  cylinder(v, 0, 0.17, 0, 0.3, 0.34, '#C98A3E', { segs: 8 });
  cylinder(v, 0, 0.355, 0, 0.27, 0.03, '#DDA457', { segs: 8 });
  v.box(0, 0.372, 0, 0.06, 0.02, 0.06, PALETTE.cream);
  cylinder(v, 0, 0.018, 0, 0.305, 0.036, '#A8702F', { segs: 8 }); // darker base band
  for (let k = 0; k < 8; k++) {
    // tufted buttons round the side
    const a = (k / 8) * TAU + Math.PI / 8;
    v.box(Math.sin(a) * 0.285, 0.2, Math.cos(a) * 0.285, 0.035, 0.035, 0.035, PALETTE.cream, a);
  }
  const grp = new THREE.Group();
  grp.name = 'pouf';
  grp.add(v.mesh({ outline: true, px: 1.4 }));
  grp.userData.footprint = { w: 0.62, d: 0.62 };
  return grp;
}

// ---------------------------------------------------------------------------------------------
// Detail props (owner request: richer rooms). All static unless noted; merged by room.bake().
// ---------------------------------------------------------------------------------------------
/** Staggered floor boards in a few tones over the kit's plank rows (the outline draws the seams). */
export function boardFloor(v, tones, { hw = 3.5, z0 = -4, rows = 16, row = 0.5, seed = 1 } = {}) {
  for (let i = 0; i < rows; i++) {
    const za = z0 + i * row + 0.001;
    const zb = z0 + (i + 1) * row - 0.013;
    let x = -hw - hash(i * 3.7 + seed) * 1.3;
    for (let k = 0; x < hw; k++) {
      const len = 1.05 + hash(i * 11.3 + k * 5.7 + seed) * 0.95;
      const xa = Math.max(-hw, x);
      const xb = Math.min(hw, x + len) - (x + len < hw ? 0.016 : 0);
      if (xb - xa > 0.06) v.boxMin(xa, -0.004, za, xb, 0.004, zb, tones[Math.floor(hash(i * 7.1 + k * 13.7 + seed) * tones.length)]);
      x += len;
    }
  }
}

/** Back wall of the writing room: frieze with dentils, wallpaper diamonds, raised wainscot panels. */
function writingWallDetail(v) {
  v.boxMin(-3.5, 2.7, BACK, 3.5, 2.88, BACK + 0.012, '#EFE1C7'); // frieze band under the crown
  v.boxMin(-3.5, 2.725, BACK, 3.5, 2.75, BACK + 0.026, PALETTE.gold); // bead
  for (let x = -3.44; x < 3.45; x += 0.14) v.boxMin(x, 2.79, BACK, x + 0.075, 2.88, BACK + 0.04, jitter(PALETTE.goldDeep, 0.05, x * 10)); // dentils
  for (let k = 0; k < 14; k++) {
    for (let j = 0; j < 3; j++) {
      const y = 1.3 + j * 0.5 + (k % 2) * 0.25;
      boxR(v, -3.0 + k * 0.5, y, BACK + 0.006, 0.055, 0.055, 0.008, '#E3CB98', 0, 0, Math.PI / 4);
    }
  }
  for (let k = 0; k < 10; k++) {
    const xc = -3.15 + k * 0.7;
    v.boxMin(xc - 0.28, 0.22, BACK, xc + 0.28, 0.88, BACK + 0.016, '#86303B'); // raised panel
    v.boxMin(xc - 0.21, 0.29, BACK, xc + 0.21, 0.81, BACK + 0.024, '#70252F'); // sunk field
    v.boxMin(xc - 0.21, 0.79, BACK, xc + 0.21, 0.81, BACK + 0.028, PALETTE.gold); // gold top bead
    v.boxMin(xc - 0.28, 0.22, BACK, xc + 0.28, 0.245, BACK + 0.02, '#5E1E27'); // shadow at the foot
  }
}

/** Round wall clock (face + rim + ticks); hands are lit-pool boxes. */
function wallClock(v, x, y, z) {
  cylinder(v, x, y, z + 0.02, 0.15, 0.04, PALETTE.gold, { axis: 'z', segs: 12 });
  cylinder(v, x, y, z + 0.045, 0.125, 0.012, PALETTE.paper, { axis: 'z', segs: 12 });
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU;
    const big = k % 3 === 0;
    boxR(v, x + Math.sin(a) * 0.1, y + Math.cos(a) * 0.1, z + 0.053, big ? 0.016 : 0.01, big ? 0.03 : 0.018, 0.006, big ? PALETTE.maroon : '#8A7A60', 0, 0, -a);
  }
  v.box(x, y, z + 0.06, 0.022, 0.022, 0.01, PALETTE.goldDeep);
  addSparkle(v, x, y + 0.2, z + 0.02, 0.09, PALETTE.gold, { depth: 0.025 });
}

/** Little framed picture painted in blocks: clouds over gold hills (her motifs), no photo. */
function blockPicture(v, x, y, z, w = 0.4, h = 0.34) {
  const b = 0.04;
  v.boxMin(x - w / 2, y - h / 2, z, x + w / 2, y + h / 2, z + 0.035, PALETTE.woodDark);
  v.boxMin(x - w / 2 + 0.012, y - h / 2 + 0.012, z + 0.035, x + w / 2 - 0.012, y + h / 2 - 0.012, z + 0.042, PALETTE.gold);
  const ix0 = x - w / 2 + b;
  const ix1 = x + w / 2 - b;
  const iy0 = y - h / 2 + b;
  const iy1 = y + h / 2 - b;
  const iz = z + 0.043;
  v.boxMin(ix0, iy0, iz - 0.004, ix1, iy1, iz, '#BFD9EC'); // sky
  v.boxMin(ix0, iy0 + (iy1 - iy0) * 0.45, iz - 0.002, ix1, iy0 + (iy1 - iy0) * 0.62, iz + 0.002, '#F9D9AE'); // sunset band
  v.boxMin(ix0, iy0, iz, ix1, iy0 + 0.05, iz + 0.006, '#7FA866'); // meadow
  v.boxMin(ix0 + 0.02, iy0 + 0.05, iz, ix0 + 0.16, iy0 + 0.1, iz + 0.006, '#6F9E5B'); // hill
  v.boxMin(ix1 - 0.13, iy0 + 0.05, iz, ix1 - 0.02, iy0 + 0.085, iz + 0.006, PALETTE.gold); // gold field
  v.box(ix1 - 0.07, iy1 - 0.06, iz + 0.004, 0.05, 0.05, 0.006, '#FFD27F'); // sun
  v.box(ix0 + 0.09, iy1 - 0.07, iz + 0.005, 0.12, 0.035, 0.006, PALETTE.cloud); // cloud
  v.box(ix0 + 0.08, iy1 - 0.045, iz + 0.005, 0.06, 0.03, 0.006, PALETTE.cloud);
  v.box(x, y + h / 2 + 0.04, z + 0.01, 0.012, 0.08, 0.012, PALETTE.goldDeep); // hanging cord
  v.box(x, y + h / 2 + 0.085, z + 0.02, 0.03, 0.03, 0.03, PALETTE.gold); // nail
}

/** Seat + back cushions for the desk chair (chair-local frame: seat at 0.42..0.5, back at z -0.24..-0.17). */
function chairCushions() {
  const c = new VoxelBuilder();
  c.boxMin(-0.21, 0.5, -0.17, 0.21, 0.56, 0.22, '#F1E4C8');
  c.boxMin(-0.215, 0.53, -0.175, 0.215, 0.54, 0.225, PALETTE.gold); // piping
  c.box(0, 0.565, 0.02, 0.03, 0.012, 0.03, PALETTE.goldDeep); // button
  c.boxMin(-0.19, 0.58, -0.17, 0.19, 0.92, -0.11, PALETTE.gold);
  c.boxMin(-0.16, 0.61, -0.11, 0.16, 0.89, -0.095, '#D8B661');
  addSparkle(c, 0, 0.75, -0.09, 0.12, PALETTE.maroon, { depth: 0.01 });
  return c;
}

/** Stage dressing for the stats corner: boards, confetti, a trophy, a phone on a ring-light tripod, gifts. */
function stageDressing(v, x0, z0) {
  const top = 0.22;
  const tones = ['#C9965F', '#D2A26C', '#BE8B56'];
  for (let i = 0; i < 6; i++) v.boxMin(x0 - 1.05 + i * 0.35 + 0.006, top - 0.004, z0 - 0.5 + 0.004, x0 - 1.05 + (i + 1) * 0.35 - 0.006, top + 0.004, z0 + 0.5 - 0.004, tones[i % 3]);
  const conf = [PALETTE.gold, PALETTE.maroon, PALETTE.cream, PALETTE.rose, PALETTE.telegram, '#F2C75C'];
  for (let k = 0; k < 26; k++) {
    const cx = x0 - 0.95 + hash(k * 3.1 + 7) * 1.9;
    const cz = z0 - 0.42 + hash(k * 5.3 + 2) * 0.62;
    boxR(v, cx, top + 0.007, cz, 0.04, 0.006, 0.026, conf[k % conf.length], 0, hash(k) * TAU, 0);
  }
  // trophy (right)
  const tx = x0 + 0.72;
  const tz = z0 - 0.2;
  v.boxMin(tx - 0.09, top, tz - 0.07, tx + 0.09, top + 0.06, tz + 0.07, PALETTE.woodDark);
  v.boxMin(tx - 0.06, top + 0.06, tz - 0.045, tx + 0.06, top + 0.085, tz + 0.045, PALETTE.goldDeep);
  v.box(tx, top + 0.035, tz + 0.071, 0.1, 0.03, 0.004, PALETTE.gold);
  v.box(tx, top + 0.115, tz, 0.035, 0.06, 0.035, PALETTE.gold);
  cylinder(v, tx, top + 0.205, tz, 0.075, 0.13, PALETTE.gold, { segs: 8, rTop: 0.095 });
  for (const sx of [-1, 1]) {
    v.box(tx + sx * 0.105, top + 0.22, tz, 0.025, 0.08, 0.025, PALETTE.goldDeep);
    v.box(tx + sx * 0.085, top + 0.255, tz, 0.04, 0.02, 0.025, PALETTE.goldDeep);
  }
  addSparkle(v, tx, top + 0.2, tz + 0.08, 0.07, '#FFF3C4', { depth: 0.015 });
  // phone on a small tabletop tripod with a ring light (left, kept below the board): creator corner
  const rx = x0 - 0.66;
  const rz = z0 - 0.12;
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * TAU + 0.4;
    boxR(v, rx + Math.sin(a) * 0.07, top + 0.1, rz + Math.cos(a) * 0.07, 0.02, 0.22, 0.02, PALETTE.ink, -Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55);
  }
  v.box(rx, top + 0.27, rz, 0.026, 0.2, 0.026, PALETTE.ink);
  const ring = new THREE.TorusGeometry(0.12, 0.024, 5, 16);
  v.add(ring, PALETTE.white, mat4(rx, top + 0.5, rz));
  ring.dispose();
  v.box(rx, top + 0.5, rz + 0.012, 0.065, 0.12, 0.014, PALETTE.ink); // phone
  v.box(rx, top + 0.5, rz + 0.02, 0.052, 0.1, 0.004, '#3B4A6B'); // its screen
  v.box(rx, top + 0.4, rz, 0.045, 0.045, 0.04, PALETTE.ink); // clamp
  // two wrapped gifts from fans (centre back)
  const gifts = [[x0 + 0.12, z0 - 0.3, 0.2, 0.16, PALETTE.maroon, PALETTE.gold, 0.2], [x0 + 0.34, z0 - 0.28, 0.14, 0.12, PALETTE.cream, PALETTE.maroon, -0.3]];
  for (const [gx, gz, s, h, c, rib, ry] of gifts) {
    const g = new VoxelBuilder();
    g.box(0, h / 2, 0, s, h, s, c);
    g.box(0, h / 2, 0, s + 0.006, h + 0.004, 0.03, rib);
    g.box(0, h / 2, 0, 0.03, h + 0.004, s + 0.006, rib);
    boxR(g, -0.035, h + 0.025, 0, 0.06, 0.04, 0.025, rib, 0, 0, 0.5);
    boxR(g, 0.035, h + 0.025, 0, 0.06, 0.04, 0.025, rib, 0, 0, -0.5);
    v.merge(g, mat4(gx, top, gz, 0, ry, 0));
  }
}

/** Woven basket full of folded paper planes and letters (Telegram corner). */
function planeBasket() {
  const v = new VoxelBuilder();
  for (let i = 0; i < 4; i++) v.boxMin(-0.2, i * 0.07, -0.16, 0.2, (i + 1) * 0.07, 0.16, i % 2 ? '#C99B66' : PALETTE.wood);
  for (let k = -3; k <= 3; k++) v.box(k * 0.055, 0.14, 0.162, 0.018, 0.28, 0.008, '#A87A48'); // weave ribs
  v.boxMin(-0.215, 0.27, -0.175, 0.215, 0.3, 0.175, PALETTE.goldDeep);
  v.boxMin(-0.17, 0.2, -0.13, 0.17, 0.285, 0.13, '#3A2C20');
  const plane = paperPlaneGeometry(0.9);
  v.add(plane, PALETTE.white, mat4(-0.06, 0.34, 0.0, -0.5, 0.4, 0.2));
  v.add(plane, '#F4ECDC', mat4(0.08, 0.36, -0.03, -0.7, -0.6, -0.1));
  v.add(plane, '#DCEFFB', mat4(0.0, 0.4, 0.05, -0.9, 2.6, 0.15));
  plane.dispose();
  boxR(v, -0.1, 0.33, -0.06, 0.2, 0.13, 0.01, PALETTE.paper, -0.2, 0.2, 0.15); // envelopes
  boxR(v, -0.1, 0.33, -0.05, 0.08, 0.04, 0.012, PALETTE.maroon, -0.2, 0.2, 0.15);
  boxR(v, 0.12, 0.32, -0.08, 0.18, 0.12, 0.01, '#F2E6CF', -0.1, -0.3, -0.2);
  for (const sx of [-1, 1]) boxR(v, sx * 0.2, 0.33, 0, 0.03, 0.09, 0.08, PALETTE.goldDeep, 0, 0, sx * -0.3); // handles
  const grp = new THREE.Group();
  grp.name = 'planeBasket';
  grp.add(v.mesh({ outline: true, px: 1.4 }));
  grp.userData.footprint = { w: 0.42, d: 0.36 };
  return grp;
}

const SPINES = [PALETTE.maroon, PALETTE.goldDeep, PALETTE.boxBlue, '#3E6B4F', PALETTE.cream, '#8E5A3C', PALETTE.ink, '#C27A5B', '#5B6FA8', '#A33A44', '#D9C08A', '#2F5D4F'];
/** Writer's bookcase (faces +Z): varied books with gold bands, leaning books, book ends, jars, a plant, scrolls. */
function richShelf({ w = 1.7, h = 2.1, d = 0.42, rows = 4, seed = 5 } = {}) {
  const v = new VoxelBuilder();
  const wood = PALETTE.woodDark;
  v.boxMin(-w / 2, 0, -d / 2, -w / 2 + 0.07, h, d / 2, wood);
  v.boxMin(w / 2 - 0.07, 0, -d / 2, w / 2, h, d / 2, wood);
  v.boxMin(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.04, '#5E3F26'); // dark back
  v.boxMin(-w / 2 - 0.03, h - 0.02, -d / 2, w / 2 + 0.03, h + 0.05, d / 2 + 0.03, PALETTE.wood); // cornice
  v.boxMin(-w / 2 - 0.03, h + 0.0, d / 2, w / 2 + 0.03, h + 0.02, d / 2 + 0.035, PALETTE.gold);
  v.boxMin(-w / 2, 0, d / 2 - 0.02, w / 2, 0.1, d / 2 + 0.01, '#5E3F26'); // plinth
  const gap = (h - 0.1) / rows;
  for (let r = 0; r <= rows; r++) {
    const y = 0.1 + r * gap;
    v.boxMin(-w / 2, y - 0.03, -d / 2, w / 2, y + 0.03, d / 2, wood);
    v.boxMin(-w / 2 + 0.07, y + 0.03, -d / 2 + 0.04, w / 2 - 0.07, y + 0.05, -d / 2 + 0.1, '#4A3020'); // shelf shadow at the back
    v.boxMin(-w / 2, y - 0.03, d / 2, w / 2, y + 0.0, d / 2 + 0.012, PALETTE.gold); // gold lip
  }
  let k = seed * 17;
  for (let r = 0; r < rows; r++) {
    const y0 = 0.1 + r * gap + 0.03;
    let x = -w / 2 + 0.09;
    const xEnd = w / 2 - 0.09;
    while (x < xEnd - 0.06) {
      const kind = hash(k * 1.37);
      k++;
      if (kind < 0.72) {
        // a run of books
        const n = 3 + Math.floor(hash(k * 2.1) * 5);
        for (let b = 0; b < n && x < xEnd - 0.05; b++, k++) {
          const bw = 0.04 + hash(k * 3.3) * 0.035;
          const bh = gap * (0.55 + hash(k * 4.7) * 0.32);
          const bd = 0.22 + hash(k * 5.9) * 0.1;
          const col = jitter(SPINES[Math.floor(hash(k * 6.1) * SPINES.length)], 0.06, k);
          v.boxMin(x, y0, d / 2 - 0.03 - bd, x + bw, y0 + bh, d / 2 - 0.03, col);
          if (hash(k * 7.3) < 0.55) v.boxMin(x - 0.001, y0 + bh * 0.78, d / 2 - 0.032, x + bw + 0.001, y0 + bh * 0.84, d / 2 - 0.026, PALETTE.gold); // gilt band
          if (hash(k * 8.9) < 0.3) v.boxMin(x - 0.001, y0 + bh * 0.2, d / 2 - 0.032, x + bw + 0.001, y0 + bh * 0.24, d / 2 - 0.026, PALETTE.gold);
          x += bw + 0.006;
        }
        if (hash(k * 9.7) < 0.4 && x < xEnd - 0.2) {
          // one book leaning on the run
          const bh = gap * 0.68;
          boxR(v, x + 0.07, y0 + bh / 2 - 0.02, 0.0, 0.045, bh, 0.26, jitter(SPINES[k % SPINES.length], 0.05, k), 0, 0, -0.42);
          x += 0.17;
        }
        x += 0.02;
      } else if (kind < 0.8) {
        // a lying stack
        let yy = y0;
        for (let b = 0; b < 3; b++, k++) {
          const bh = 0.035 + hash(k) * 0.02;
          v.boxMin(x + b * 0.008, yy, -0.1, x + 0.24 - b * 0.012, yy + bh, 0.16, SPINES[(k + b) % SPINES.length]);
          yy += bh;
        }
        x += 0.28;
      } else if (kind < 0.88) {
        // two glass jars (buttons, sparkles)
        for (let j = 0; j < 2; j++) {
          cylinder(v, x + 0.05 + j * 0.1, y0 + 0.06, 0.06, 0.04, 0.12, j ? '#CFE3E6' : '#E8DDBF', { segs: 8 });
          v.box(x + 0.05 + j * 0.1, y0 + 0.13, 0.06, 0.06, 0.025, 0.06, PALETTE.gold);
        }
        x += 0.22;
      } else if (kind < 0.94) {
        // a little potted plant
        v.boxMin(x, y0, -0.02, x + 0.12, y0 + 0.1, 0.1, PALETTE.cream);
        v.box(x + 0.06, y0 + 0.15, 0.04, 0.14, 0.1, 0.12, PALETTE.leaf);
        v.box(x + 0.04, y0 + 0.21, 0.03, 0.07, 0.06, 0.07, PALETTE.leafDark);
        x += 0.18;
      } else {
        // rolled scripts tied with ribbon
        for (let j = 0; j < 3; j++) cylinder(v, x + 0.12, y0 + 0.03 + (j === 2 ? 0.05 : 0), -0.06 + j * 0.06 - (j === 2 ? 0.03 : 0), 0.026, 0.24, j === 1 ? '#F1E6D0' : PALETTE.paper, { axis: 'x', segs: 6 });
        v.box(x + 0.12, y0 + 0.05, 0.0, 0.025, 0.08, 0.16, PALETTE.maroon);
        x += 0.28;
      }
    }
  }
  addSparkle(v, 0, h + 0.18, 0, 0.18, PALETTE.gold, { depth: 0.04 });
  const grp = new THREE.Group();
  grp.name = 'richShelf';
  grp.add(v.mesh({ outline: true, px: 1.4 }));
  grp.userData.footprint = { w, d };
  return grp;
}

/** Three-legged stool beside the chalkboard: chalk box, order slips, a mug of chalk. */
function chalkStool() {
  const v = new VoxelBuilder();
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * TAU + 0.5;
    boxR(v, Math.sin(a) * 0.12, 0.24, Math.cos(a) * 0.12, 0.045, 0.5, 0.045, PALETTE.woodDark, -Math.cos(a) * 0.16, 0, Math.sin(a) * 0.16);
  }
  cylinder(v, 0, 0.5, 0, 0.2, 0.05, PALETTE.wood, { segs: 8 });
  cylinder(v, 0, 0.18, 0, 0.13, 0.03, PALETTE.woodDark, { segs: 6 }); // rung ring
  v.boxMin(-0.13, 0.525, -0.07, 0.03, 0.585, 0.07, PALETTE.maroon); // chalk box
  v.boxMin(-0.13, 0.585, -0.07, 0.03, 0.595, -0.03, PALETTE.maroonDeep);
  for (let k = 0; k < 4; k++) v.box(-0.11 + k * 0.035, 0.6, 0.0, 0.022, 0.03, 0.06, [PALETTE.white, '#F2C75C', PALETTE.rose, PALETTE.white][k]);
  boxR(v, 0.09, 0.53, 0.04, 0.13, 0.012, 0.17, PALETTE.paper, 0, 0.3, 0); // order slips
  boxR(v, 0.09, 0.542, 0.04, 0.12, 0.012, 0.16, '#F1E6D0', 0, 0.15, 0);
  boxR(v, 0.1, 0.552, 0.02, 0.012, 0.012, 0.14, PALETTE.goldDeep, 0, -0.5, 0); // pencil
  const grp = new THREE.Group();
  grp.name = 'chalkStool';
  grp.add(v.mesh({ outline: true, px: 1.4 }));
  grp.userData.footprint = { w: 0.42, d: 0.42 };
  return grp;
}

// ---------------------------------------------------------------------------------------------
// Atlas drawings (shapes on canvas; every text line goes through signTexture via atlasText)
// ---------------------------------------------------------------------------------------------
function drawStatsBoard(atlas, x0, y0, W, H) {
  const g = atlas.ctx;
  g.save();
  g.fillStyle = PALETTE.maroon;
  roundRect(g, x0 + 4, y0 + 4, W - 8, H - 8, 22);
  g.fill();
  g.strokeStyle = '#D8B25A';
  g.lineWidth = 6;
  roundRect(g, x0 + 22, y0 + 22, W - 44, H - 44, 16);
  g.stroke();
  g.strokeStyle = 'rgba(216,178,90,0.75)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x0 + W / 2, y0 + 56);
  g.lineTo(x0 + W / 2, y0 + H - 56);
  g.moveTo(x0 + 56, y0 + H / 2);
  g.lineTo(x0 + W - 56, y0 + H / 2);
  g.stroke();
  drawSparkle2D(g, x0 + W / 2, y0 + H / 2, 24, '#F0C966');
  for (const [sx, sy] of [[60, 60], [W - 60, 60], [60, H - 60], [W - 60, H - 60]]) drawSparkle2D(g, x0 + sx, y0 + sy, 13, '#D8B25A');
  g.restore();
  // the numbers come from the single source: <script id="mw-stats"> in index.html (pages.js stat())
  const cells = [
    ['TikTok', stat('tiktokFollowers', '26.7K'), 'ဖော်လိုဝါ'],
    ['TikTok', stat('tiktokLikes', '289.4K'), 'လိုက်ခ်'],
    ['Facebook', stat('facebookFollowers', '1.2K'), 'ဖော်လိုဝါ'],
    ['Telegram', stat('telegramMembers', '499'), 'Channel အဖွဲ့ဝင်'],
  ];
  cells.forEach(([platform, num, label], i) => {
    const cx = x0 + (i % 2) * (W / 2);
    const cy = y0 + Math.floor(i / 2) * (H / 2);
    atlasText(atlas, cx + 26, cy + 20, W / 2 - 52, H / 2 - 40, [
      { text: platform, size: 30, weight: 700, font: FONT_SANS, color: '#E8D5A6' },
      { text: num, size: 98, weight: 600, font: FONT_SERIF, color: '#F2CB68' },
      { text: label, size: 32, weight: 700, font: FONT_MY, color: '#FBF3E2' },
    ]);
  });
}

function drawMotto(atlas, x0, y0, W, H) {
  atlasText(atlas, x0, y0, W, H, [
    { text: 'ဖန်တီးသူ ငြိမ်းချမ်းမှ၊', size: 62, color: PALETTE.maroon },
    { text: 'ဖန်တီးမှု တောက်ပမည်', size: 62, color: PALETTE.maroon },
  ], { bg: '#FBF5E8', border: '#C9A24A', borderWidth: 12, radius: 24 });
  drawSparkle2D(atlas.ctx, x0 + 62, y0 + H / 2, 24, '#C9A24A');
  drawSparkle2D(atlas.ctx, x0 + W - 62, y0 + H / 2, 24, '#C9A24A');
}

function drawChalkboard(atlas, x0, y0, W, H) {
  const g = atlas.ctx;
  g.save();
  g.fillStyle = COL.slate;
  g.fillRect(x0, y0, W, H);
  g.fillStyle = 'rgba(255,255,255,0.04)';
  for (let i = 0; i < 8; i++) {
    g.beginPath();
    g.ellipse(x0 + 90 + i * 125, y0 + 110 + ((i * 173) % 520), 170, 55, -0.25, 0, TAU);
    g.fill();
  }
  g.strokeStyle = 'rgba(246,240,226,0.85)';
  g.lineWidth = 5;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x0 + 372, y0 + 146);
  g.quadraticCurveTo(x0 + 512, y0 + 158, x0 + 652, y0 + 142);
  g.stroke();
  g.restore();
  atlasText(atlas, x0 + 212, y0 + 26, 600, 120, [{ text: 'မှာယူနည်း', size: 62, color: '#FBF3E2' }]);
  drawSparkle2D(g, x0 + 318, y0 + 86, 18, '#F2C75C');
  drawSparkle2D(g, x0 + 706, y0 + 86, 18, '#F2C75C');
  const steps = ['ခလုတ်လေး နှိပ်ပါ', 'စာလေး ပို့ပါ', 'ငွေချေနည်း ပြန်ပြောပါမယ်', 'လက်ခံရယူပါ'];
  const nums = ['၁', '၂', '၃', '၄'];
  steps.forEach((text, i) => {
    const cy = y0 + CHALK_ROWS[i];
    g.fillStyle = '#E2B85A';
    g.beginPath();
    g.arc(x0 + 160, cy, 40, 0, TAU);
    g.fill();
    g.strokeStyle = 'rgba(255,248,230,0.6)';
    g.lineWidth = 3;
    g.stroke();
    atlasText(atlas, x0 + 110, cy - 50, 100, 100, [{ text: nums[i], size: 46, color: COL.slate }]);
    const tw = atlasTextLeft(atlas, x0 + 228, cy, text, { size: 50, color: '#FBF3E2' });
    g.save();
    g.strokeStyle = 'rgba(246,240,226,0.7)';
    g.lineWidth = 4;
    g.lineCap = 'round';
    if (i < 3) {
      g.beginPath();
      g.moveTo(x0 + 160, cy + 50);
      g.lineTo(x0 + 160, cy + 72);
      g.moveTo(x0 + 152, cy + 64);
      g.lineTo(x0 + 160, cy + 73);
      g.lineTo(x0 + 168, cy + 64);
      g.stroke();
    }
    const dx = x0 + 228 + tw + 56;
    if (i === 1) {
      g.globalAlpha = 0.85;
      drawPlane2D(g, dx, cy, 30, -0.25, '#FBF3E2', '#C9C2B2');
    } else if (i === 3) {
      drawSparkle2D(g, dx, cy, 20, '#F2C75C');
      drawSparkle2D(g, dx + 38, cy - 22, 11, '#F2C75C');
    }
    g.restore();
  });
}

function drawNameMat(atlas, x0, y0, W, H) {
  atlasText(atlas, x0, y0, W, H, [{ text: 'မာရာ့ စာရေးခန်း', size: 64, color: '#F6E3AE' }], { bg: PALETTE.maroon, border: PALETTE.gold, borderWidth: 14, radius: 34 });
  drawSparkle2D(atlas.ctx, x0 + 52, y0 + H / 2, 18, '#E2B85A');
  drawSparkle2D(atlas.ctx, x0 + W - 52, y0 + H / 2, 18, '#E2B85A');
}

function drawTelegramPoster(atlas, x0, y0, W, H) {
  const g = atlas.ctx;
  g.save();
  g.fillStyle = PALETTE.telegram;
  roundRect(g, x0 + 4, y0 + 4, W - 8, H - 8, 40);
  g.fill();
  g.fillStyle = '#FBF5E8';
  roundRect(g, x0 + 30, y0 + 30, W - 60, H - 60, 26);
  g.fill();
  g.strokeStyle = 'rgba(164,122,44,0.6)';
  g.lineWidth = 7;
  g.lineCap = 'round';
  g.setLineDash([2, 20]);
  g.beginPath();
  g.moveTo(x0 + 120, y0 + 330);
  g.bezierCurveTo(x0 + 230, y0 + 140, x0 + 360, y0 + 380, x0 + 470, y0 + 250);
  g.stroke();
  g.setLineDash([]);
  drawPlane2D(g, x0 + 610, y0 + 205, 160, -0.38, '#D9B45A', '#A47A2C');
  drawPlane2D(g, x0 + 870, y0 + 110, 46, -0.2, '#E2C27A', '#B48A3C');
  drawPlane2D(g, x0 + 150, y0 + 115, 40, 0.15, '#E2C27A', '#B48A3C');
  drawSparkle2D(g, x0 + 860, y0 + 300, 20, '#C9A24A');
  drawSparkle2D(g, x0 + 300, y0 + 120, 14, '#C9A24A');
  g.fillStyle = PALETTE.telegram;
  roundRect(g, x0 + 222, y0 + 612, 580, 124, 62);
  g.fill();
  g.restore();
  atlasText(atlas, x0 + 40, y0 + 372, W - 80, 112, [{ text: 'တယ်လီဂရမ် ချန်နယ်', size: 64, color: PALETTE.maroon }]);
  atlasText(atlas, x0 + 40, y0 + 482, W - 80, 92, [{ text: 'Writer Maya - မာရာ', size: 50, color: PALETTE.goldDeep }]);
  atlasText(atlas, x0 + 222, y0 + 612, 580, 124, [{ text: 'Join ပေးပါဦးရှင့်', size: 52, color: '#FFFFFF' }]);
}
