// The open-book world: Maya's own book lying open on a golden-hour sea of blocky clouds,
// with gold-ink roads, the Welcome Plaza (quill-and-inkwell fountain, whose round label is
// Maya's real logo) and six landmarks.
//
//   export createWorld(opts) -> world
//     world.scene, world.places, world.drive, world.update(dt, t), world.setRoute(points|null), world.dispose()
//   (see ARCHITECTURE.md; extras: world.landmarks, world.net, world.lights, world.ready,
//    world.reveal(seconds|null) for the intro pop-up, world.fitFog(cameraDistance))
import * as THREE from '../three.js';
import { PALETTE, toon, basic, addOutline, addStandardLights } from '../toon.js';
import { VoxelBuilder, jitter } from '../voxel.js';
import { createNetwork, addRoadsTo, createDrive, ROAD, HUB } from './roads.js';
import { createLandmarks, LANDMARKS, artPanel, disposeArtPanel, ART_LIFT } from './landmarks.js';

export const BOOK = { halfW: 26, halfD: 18, blockBottom: -1.2, coverBottom: -1.6, gutter: 2.6 };
export const FOUNTAIN = { x: 0, z: 13.9 };
/** Maya's logo as the inkwell's round label: centre height, radius, and its face (z past the fountain centre). */
const INK_LABEL = { y: 1.4, r: 0.4, z: 0.671 };

const INK_FAINT = '#D3C5A9';
const RULE = '#E2D7C2';
const SHADOW = '#E4D7BC';
const CLOUD_TOP = '#FFFFFF';
const CLOUD_MID = '#FAF1F2';
const CLOUD_LOW = '#D8CAE2';
const ABYSS = '#C7BCD9'; // lavender haze below the cloud sea (also the fog colour)

/** Small deterministic random generator (mulberry32). */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const geoCache = [];
function cylGeo(r, seg, rTop = r) {
  const g = new THREE.CylinderGeometry(rTop, r, 1, seg);
  geoCache.push(g);
  return g;
}
function cyl(v, x, y0, y1, z, r, color, seg = 24, rTop = r) {
  v.add(cylGeo(r, seg, rTop), color, _m.makeScale(1, y1 - y0, 1).setPosition(x, (y0 + y1) / 2, z));
}
function flatRing(v, x, y, z, r0, r1, color, seg = 64) {
  const g = new THREE.RingGeometry(r0, r1, seg).rotateX(-Math.PI / 2);
  geoCache.push(g);
  v.add(g, color, _m.makeTranslation(x, y, z));
}

// ---------------------------------------------------------------------------------
// The book: two cream pages with a gutter dip, gilt page edges, maroon cover, ribbon
// ---------------------------------------------------------------------------------
function buildBook(v, flat) {
  const W = BOOK.halfW, D = BOOK.halfD, B = BOOK.blockBottom;
  for (const sx of [-1, 1]) {
    const lo = (a, b) => Math.min(sx * a, sx * b), hi = (a, b) => Math.max(sx * a, sx * b);
    v.boxMin(lo(2.6, 25.55), B, -D, hi(2.6, 25.55), 0, D, PALETTE.paper);
    v.boxMin(lo(25.55, 26), B, -D + 0.12, hi(25.55, 26), -0.07, D - 0.12, PALETTE.paper);
    for (const [o, i, top, c] of [[2.6, 1.72, -0.08, '#F1E9D6'], [1.72, 0.86, -0.18, '#EAE0CA'], [0.86, 0, -0.28, '#E1D5BB']]) {
      v.boxMin(lo(o, i), B, -D, hi(o, i), top, D, c);
    }
    // Gilt fore-edge: stacked page layers, alternating golds, slightly uneven.
    const layers = [[-1.15, -0.95, '#C9A24A', 0.05], [-0.95, -0.74, '#E7CC82', 0.03], [-0.74, -0.53, '#D4AF5A', 0.06], [-0.53, -0.32, '#E9CF8A', 0.03], [-0.32, -0.12, '#CDA74F', 0.05]];
    for (const [y0, y1, c, o] of layers) v.boxMin(lo(25.97, 26 + o), y0, -D + 0.15, hi(25.97, 26 + o), y1, D - 0.15, c);
    for (const sz of [-1, 1]) {
      for (const [y0, y1, c, o] of layers) {
        v.boxMin(lo(2.65, 25.85), y0, Math.min(sz * (D - 0.03), sz * (D + o)), hi(2.65, 25.85), y1, Math.max(sz * (D - 0.03), sz * (D + o)), c);
        if (y1 < -0.3) v.boxMin(lo(0.02, 2.65), y0, Math.min(sz * (D - 0.03), sz * (D + o)), hi(0.02, 2.65), y1, Math.max(sz * (D - 0.03), sz * (D + o)), c);
      }
    }
  }
  // Cover (maroon leather) peeking out underneath, gold tooled border and corners, spine.
  v.boxMin(-W - 1, BOOK.coverBottom, -D - 0.9, W + 1, B, D + 0.9, PALETTE.maroon);
  const gl = (x0, z0, x1, z1) => v.boxMin(x0, B, z0, x1, B + 0.02, z1, PALETTE.gold);
  gl(-W - 0.55, D + 0.4, W + 0.55, D + 0.52);
  gl(-W - 0.55, -D - 0.52, W + 0.55, -D - 0.4);
  gl(W + 0.43, -D - 0.52, W + 0.55, D + 0.52);
  gl(-W - 0.55, -D - 0.52, -W - 0.43, D + 0.52);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const x = sx * (W + 1), z = sz * (D + 0.9);
      v.boxMin(Math.min(x, x - sx * 0.95), BOOK.coverBottom - 0.02, Math.min(z, z - sz * 0.42), Math.max(x, x - sx * 0.95) + (sx > 0 ? 0.05 : 0), B + 0.04, Math.max(z, z - sz * 0.42) + (sz > 0 ? 0.05 : 0), PALETTE.gold);
      v.boxMin(Math.min(x, x - sx * 0.42), BOOK.coverBottom - 0.02, Math.min(z, z - sz * 0.95), Math.max(x, x - sx * 0.42) + (sx > 0 ? 0.05 : 0), B + 0.04, Math.max(z, z - sz * 0.95) + (sz > 0 ? 0.05 : 0), PALETTE.gold);
    }
  }
  v.boxMin(-1.9, -2.05, -D - 0.9, 1.9, BOOK.coverBottom, D + 0.9, PALETTE.maroonDeep);
  for (let i = 0; i < 3; i++) v.boxMin(-0.9 + i * 0.6, -1.98, D + 0.9, -0.5 + i * 0.6, -1.66, D + 1.0, i % 2 ? PALETTE.maroon : PALETTE.gold);

  // Bookmark ribbon: from the gutter over the tail edge, hanging into the clouds.
  const RIB = '#8C2A38';
  const rx = 0.35;
  v.boxMin(rx - 0.36, -0.3, 17.2, rx + 0.36, -0.26, D + 0.08, RIB);
  v.boxMin(rx - 0.36, B - 0.02, D + 0.06, rx + 0.36, -0.26, D + 0.12, RIB);
  v.boxMin(rx - 0.36, B - 0.02, D + 0.06, rx + 0.36, B + 0.03, D + 0.96, RIB);
  const wave = [[0, 0], [0.08, 0.12], [0.16, 0.2], [0.1, 0.12], [0.02, 0.02]];
  wave.forEach(([dx, dz], i) => v.boxMin(rx - 0.36 + dx, B - 0.8 * (i + 1), D + 0.92 + dz, rx + 0.36 + dx, B - 0.8 * i + 0.02, D + 1.0 + dz, i % 2 ? jitter(RIB, 0.08, i) : RIB));
  for (const sx of [-1, 1]) v.boxMin(rx + 0.02 + sx * 0.06 - (sx < 0 ? 0.32 : 0), B - 4.42, D + 0.94, rx + 0.02 + sx * 0.06 + (sx > 0 ? 0.32 : 0), B - 4.0, D + 1.02, RIB);

  // Faint ruled lines, notebook margins and "handwriting" on the pages (flat, no outline).
  for (const sx of [-1, 1]) {
    for (let z = -16.5; z <= 16.6; z += 1.5) flat.boxMin(Math.min(sx * 3.0, sx * 24.9), 0, z - 0.035, Math.max(sx * 3.0, sx * 24.9), 0.012, z + 0.035, RULE);
    flat.boxMin(sx * 23.6 - 0.045, 0, -17.3, sx * 23.6 + 0.045, 0.013, 17.3, '#ECC9C1');
  }
  const r = rng(7);
  const zones = [[-24.4, -18.6, -16.5, -12], [18.6, 24.4, -16.5, -12], [-24.4, -11.5, 9, 16.5], [11.5, 24.4, 9, 16.5], [-24.4, -22.3, -9, 7.5], [22.3, 24.4, -9, 7.5]];
  for (const [x0, x1, z0, z1] of zones) {
    for (let z = Math.ceil(z0 / 1.5) * 1.5; z <= z1; z += 1.5) {
      let x = x0 + r() * 0.8;
      while (x < x1 - 0.4) {
        const len = Math.min(x1 - x, 0.35 + r() * 1.3);
        flat.boxMin(x, 0, z - 0.42, x + len, 0.014, z - 0.26, INK_FAINT);
        x += len + 0.25 + r() * 0.2;
      }
    }
  }
}

// ---------------------------------------------------------------------------------
// Welcome Plaza: round platform, roundabout island (the cottage garden), forecourt,
// quill-and-inkwell fountain.
// ---------------------------------------------------------------------------------
function buildPlaza(v, flat) {
  const F = FOUNTAIN;
  cyl(v, HUB.x, -0.36, 0.05, HUB.z, 7.4, PALETTE.goldDeep, 48);
  cyl(v, HUB.x, 0.05, 0.09, HUB.z, 7.25, PALETTE.parchment, 48);
  cyl(v, F.x, -0.36, 0.05, F.z, 3.85, PALETTE.goldDeep, 32);
  cyl(v, F.x, 0.05, 0.092, F.z, 3.7, PALETTE.parchment, 32);
  // Island inside the roundabout: gold kerb, light paving, flower beds round the edge.
  const ir = HUB.r - ROAD.width / 2;
  cyl(v, HUB.x, 0.09, 0.22, HUB.z, ir, PALETTE.gold, 40);
  cyl(v, HUB.x, 0.22, 0.24, HUB.z, ir - 0.14, '#EBE2CC', 40);
  const flowers = [PALETTE.rose, PALETTE.lily, PALETTE.gold];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.1;
    const x = HUB.x + Math.cos(a) * (ir - 0.55), z = HUB.z + Math.sin(a) * (ir - 0.55);
    if (z > HUB.z + 2.2 && Math.abs(x - HUB.x) < 0.9) continue; // keep the front path clear
    v.box(x, 0.36, z, 0.62, 0.26, 0.62, i % 2 ? PALETTE.leaf : PALETTE.leafDark);
    v.box(x + 0.08, 0.53, z - 0.05, 0.14, 0.12, 0.14, flowers[i % 3]);
  }
  // Paving inlays (flat): gold rings, sun-ray tiles, a sparkle in front of the fountain.
  flatRing(flat, HUB.x, 0.093, HUB.z, 6.88, 7.02, PALETTE.gold);
  flatRing(flat, F.x, 0.095, F.z, 3.38, 3.5, PALETTE.gold, 40);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    flat.box(HUB.x + Math.cos(a) * 6.55, 0.096, HUB.z + Math.sin(a) * 6.55, 0.5, 0.008, 0.12, PALETTE.cream, -a);
  }
  flat.box(F.x, 0.097, F.z + 2.75, 0.2, 0.01, 1.0, PALETTE.gold);
  flat.box(F.x, 0.097, F.z + 2.75, 1.0, 0.01, 0.2, PALETTE.gold);
  flat.box(F.x, 0.099, F.z + 2.75, 0.3, 0.01, 0.3, PALETTE.white, Math.PI / 4);

  // Fountain basin with a pool of gold ink.
  cyl(v, F.x, 0.09, 0.24, F.z, 2.14, PALETTE.maroon, 28);
  cyl(v, F.x, 0.24, 0.6, F.z, 2.05, '#EFE6D0', 28);
  cyl(v, F.x, 0.6, 0.64, F.z, 1.86, '#B8862E', 28);
  const torus = new THREE.TorusGeometry(1.95, 0.12, 6, 40).rotateX(Math.PI / 2);
  geoCache.push(torus);
  v.add(torus, PALETTE.gold, _m.makeTranslation(F.x, 0.64, F.z));
  // Inkwell: dark glass with a gold collar and a glint. Its round label is Maya's real logo
  // (an unlit art panel added in createWorld) on a gold medallion with a thin maroon rim.
  v.box(F.x, 0.75, F.z, 0.95, 0.3, 0.95, PALETTE.gold);
  v.box(F.x, 1.4, F.z, 1.25, 1.0, 1.25, '#2E2430');
  v.box(F.x, 2.0, F.z, 1.0, 0.2, 1.0, '#3B2F3D');
  v.box(F.x, 2.25, F.z, 0.62, 0.3, 0.62, PALETTE.gold);
  v.box(F.x, 2.4, F.z, 0.46, 0.02, 0.46, '#F2CC63');
  const L = INK_LABEL, faceZ = (z0, z1, r, c) => v.add(cylGeo(1, 40), c, _m.compose(_p.set(F.x, L.y, F.z + (z0 + z1) / 2), _q.setFromEuler(_e.set(Math.PI / 2, 0, 0)), _s.set(r, z1 - z0, r)));
  faceZ(0.6, L.z - 0.006, L.r + 0.06, PALETTE.gold);
  faceZ(L.z - 0.008, L.z, L.r + 0.018, PALETTE.maroonDeep);
  v.box(F.x - 0.545, 1.67, F.z + 0.63, 0.06, 0.34, 0.02, '#6C5A6E');
  // The quill: built upright, then leaned toward the camera and a little east.
  const q = new VoxelBuilder();
  q.box(0, -0.42, 0, 0.11, 0.36, 0.11, PALETTE.goldDeep);
  q.box(0, 2.15, 0, 0.09, 5.0, 0.09, '#F3E2B5');
  for (let k = 0; k < 13; k++) {
    const t = k / 12;
    const hw = 0.1 + 0.55 * Math.sin(Math.PI * Math.pow(t, 0.72)) * (1 - 0.3 * t);
    const y = 0.95 + k * 0.3;
    const c = k >= 11 ? '#F2D58A' : k % 2 ? PALETTE.white : PALETTE.cream;
    if (k !== 4) q.box(-(hw * 0.8) / 2 - 0.045, y, 0, hw * 0.8, 0.3, 0.07, c);
    if (k !== 8) q.box(hw / 2 + 0.045, y, 0, hw, 0.3, 0.07, c);
  }
  // Lean mostly sideways (east) so the whole feather reads from the high game camera.
  _q.setFromEuler(_e.set(0.22, 0, -0.5, 'XYZ'));
  v.merge(q, _m.compose(_p.set(F.x + 0.05, 2.4, F.z), _q, _s.set(1, 1, 1)));
  // Welcome sign posts (the sign itself is an atlas mesh added in createWorld).
  for (const sx of [-1, 1]) {
    v.box(F.x + sx * 1.42, 0.85, F.z + 3.05, 0.14, 1.7, 0.14, PALETTE.woodDark);
    v.box(F.x + sx * 1.42, 1.76, F.z + 3.05, 0.22, 0.12, 0.22, PALETTE.gold);
  }
}

/** A giant pencil resting on the east page (built along +X, then turned). */
function addPencil(v, flat, x, z, ry) {
  const p = new VoxelBuilder();
  p.box(0, 0, 0, 5.0, 0.52, 0.52, '#F0B83C');
  p.box(0, 0.2, 0, 5.0, 0.13, 0.36, '#F6CB60');
  p.box(0, -0.2, 0, 5.0, 0.12, 0.38, '#D99E2C');
  p.box(-2.72, 0, 0, 0.46, 0.58, 0.58, PALETTE.gold);
  for (const dx of [-2.86, -2.58]) p.box(dx, 0, 0, 0.06, 0.62, 0.62, PALETTE.goldDeep);
  p.box(-3.2, 0, 0, 0.52, 0.5, 0.5, PALETTE.rose);
  [[2.72, 0.46], [3.04, 0.34], [3.32, 0.22]].forEach(([dx, s]) => p.box(dx, 0, 0, 0.32, s, s, '#EBCB9C'));
  p.box(3.55, 0, 0, 0.22, 0.12, 0.12, PALETTE.ink);
  v.merge(p, _m.compose(_p.set(x, 0.27, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(1, 1, 1)));
  flat.box(x + 0.25, 0.003, z - 0.15, 7.2, 0.006, 0.95, SHADOW, ry);
}

// ---------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------
/** A colour scaled brighter (k > 1) or darker (k < 1): fake ambient occlusion and lit rims. */
const _sh = new THREE.Color();
const shadeCache = new Map();
function shade(hex, k) {
  const key = hex + '|' + k;
  let s = shadeCache.get(key);
  if (!s) {
    _sh.set(hex);
    _sh.setRGB(Math.min(1, _sh.r * k), Math.min(1, _sh.g * k), Math.min(1, _sh.b * k));
    s = '#' + _sh.getHexString();
    shadeCache.set(key, s);
  }
  return s;
}
const LAVENDER = '#B9A3D6';
const PADAUK = ['#F2C14E', '#E8A93A', '#F7D774'];

function benchBuilder() {
  const b = new VoxelBuilder();
  // slatted seat and back, wrought-iron frame, gold armrests
  for (let i = 0; i < 4; i++) b.box(0, 0.46, -0.15 + i * 0.105, 1.5, 0.06, 0.085, shade(PALETTE.wood, [1, 0.9, 1.07, 0.95][i]));
  for (let i = 0; i < 3; i++) b.box(0, 0.64 + i * 0.13, -0.215, 1.5, 0.09, 0.05, shade(PALETTE.wood, [0.95, 1.06, 0.9][i]));
  b.box(0, 1.02, -0.215, 1.56, 0.05, 0.08, PALETTE.woodDark);
  for (const sx of [-1, 1]) {
    b.box(sx * 0.66, 0.22, 0.12, 0.08, 0.44, 0.08, PALETTE.ink);
    b.box(sx * 0.66, 0.52, -0.2, 0.08, 1.04, 0.08, PALETTE.ink);
    b.box(sx * 0.66, 0.4, -0.04, 0.06, 0.06, 0.38, PALETTE.ink);
    b.box(sx * 0.66, 0.03, 0.12, 0.14, 0.06, 0.16, PALETTE.ink);
    b.box(sx * 0.66, 0.03, -0.2, 0.14, 0.06, 0.16, PALETTE.ink);
    b.box(sx * 0.71, 0.63, 0.0, 0.08, 0.05, 0.46, PALETTE.gold);
    b.box(sx * 0.71, 0.54, 0.19, 0.05, 0.14, 0.05, PALETTE.gold);
  }
  b.box(0, 0.25, -0.04, 1.3, 0.04, 0.04, PALETTE.ink);
  return b;
}
/** Street lamp: stepped base, collared post, scroll brackets, lantern cage, cap and finial.
 *  variant 1 hangs a flower basket, variant 2 a small maroon pennant. */
function lampBuilder(variant = 0) {
  const b = new VoxelBuilder();
  b.box(0, 0.05, 0, 0.46, 0.1, 0.46, PALETTE.goldDeep);
  b.box(0, 0.16, 0, 0.34, 0.12, 0.34, PALETTE.gold);
  b.box(0, 0.32, 0, 0.2, 0.22, 0.2, PALETTE.goldDeep);
  b.box(0, 1.3, 0, 0.11, 2.0, 0.11, PALETTE.goldDeep);
  for (const y of [0.5, 1.15, 1.95]) b.box(0, y, 0, 0.17, 0.07, 0.17, PALETTE.gold);
  b.box(0, 2.3, 0, 0.2, 0.08, 0.2, PALETTE.gold);
  b.box(0, 2.36, 0, 0.36, 0.06, 0.36, PALETTE.gold);
  for (const sx of [-1, 1]) {
    b.box(sx * 0.13, 2.2, 0, 0.16, 0.04, 0.04, PALETTE.gold);
    b.box(sx * 0.2, 2.27, 0, 0.04, 0.1, 0.04, PALETTE.gold);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(sx * 0.15, 2.56, sz * 0.15, 0.04, 0.36, 0.04, PALETTE.gold);
  b.box(0, 2.76, 0, 0.5, 0.06, 0.5, PALETTE.gold);
  b.box(0, 2.82, 0, 0.44, 0.08, 0.44, PALETTE.maroon);
  b.box(0, 2.9, 0, 0.26, 0.08, 0.26, PALETTE.maroon);
  b.box(0, 2.97, 0, 0.12, 0.06, 0.12, PALETTE.maroonDeep);
  b.box(0, 3.04, 0, 0.06, 0.1, 0.06, PALETTE.gold);
  if (variant === 1) {
    b.box(0.24, 1.98, 0, 0.42, 0.04, 0.04, PALETTE.ink);
    b.box(0.42, 1.86, 0, 0.02, 0.22, 0.02, PALETTE.ink);
    b.box(0.42, 1.66, 0, 0.3, 0.16, 0.3, PALETTE.wood);
    b.box(0.42, 1.78, 0, 0.36, 0.12, 0.36, PALETTE.leaf);
    b.box(0.42, 1.6, 0.12, 0.2, 0.14, 0.1, PALETTE.leafDark);
    for (const [fx, fz, c] of [[0.32, 0.1, PALETTE.rose], [0.52, -0.08, PALETTE.lily], [0.46, 0.14, PALETTE.gold]]) b.box(fx, 1.88, fz, 0.1, 0.1, 0.1, c);
  } else if (variant === 2) {
    b.box(0.2, 1.98, 0, 0.32, 0.04, 0.04, PALETTE.gold);
    b.box(0.22, 1.72, 0, 0.28, 0.48, 0.03, PALETTE.maroon);
    b.box(0.17, 1.44, 0, 0.09, 0.1, 0.03, PALETTE.maroon);
    b.box(0.27, 1.44, 0, 0.09, 0.1, 0.03, PALETTE.maroon);
    b.box(0.22, 1.76, 0.02, 0.05, 0.2, 0.01, PALETTE.gold);
    b.box(0.22, 1.76, 0.02, 0.2, 0.05, 0.01, PALETTE.gold);
  }
  return b;
}
function bedBuilder(w, d, seed) {
  const b = new VoxelBuilder();
  b.boxMin(-w / 2, 0, -d / 2, w / 2, 0.22, d / 2, PALETTE.woodDark);
  // brick border in alternating tones, slightly proud of the soil
  const step = 0.3;
  let k = 0;
  for (let x = -w / 2; x < w / 2 - 0.01; x += step, k++) {
    const x1 = Math.min(w / 2, x + step) - 0.02;
    for (const sz of [-1, 1]) b.boxMin(x + 0.01, 0.0, sz * d / 2 - 0.05, x1, 0.28, sz * d / 2 + 0.05, shade(PALETTE.woodDark, [0.85, 1.1, 0.95][(k + (sz > 0 ? 1 : 0)) % 3]));
  }
  k = 0;
  for (let z = -d / 2 + 0.05; z < d / 2 - 0.06; z += step, k++) {
    const z1 = Math.min(d / 2 - 0.05, z + step) - 0.02;
    for (const sx of [-1, 1]) b.boxMin(sx * w / 2 - 0.05, 0.0, z + 0.01, sx * w / 2 + 0.05, 0.28, z1, shade(PALETTE.woodDark, [1.1, 0.88, 1.0][(k + (sx > 0 ? 1 : 0)) % 3]));
  }
  b.boxMin(-w / 2 + 0.06, 0.22, -d / 2 + 0.06, w / 2 - 0.06, 0.3, d / 2 - 0.06, PALETTE.leafDark);
  const r = rng(seed);
  const cols = [PALETTE.rose, PALETTE.lily, PALETTE.gold, PALETTE.rose, LAVENDER, PALETTE.lily];
  for (let x = -w / 2 + 0.25; x < w / 2 - 0.15; x += 0.34) {
    for (let z = -d / 2 + 0.24; z < d / 2 - 0.12; z += 0.34) {
      const h = 0.12 + r() * 0.16;
      b.box(x, 0.3 + h / 2, z, 0.2, h, 0.2, r() < 0.5 ? PALETTE.leaf : shade(PALETTE.leaf, 1.1));
      b.box(x - 0.08, 0.36, z + 0.08, 0.12, 0.08, 0.12, PALETTE.leafDark);
      const c = cols[Math.floor(r() * cols.length)];
      b.box(x + 0.03, 0.38 + h, z, 0.14, 0.14, 0.14, c);
      b.box(x + 0.03, 0.46 + h, z, 0.06, 0.03, 0.06, PALETTE.gold);
    }
  }
  return b;
}
/** Round broadleaf tree: root flare, forked trunk, three-tone leaf clusters, a few blossoms. */
function oakBuilder() {
  const b = new VoxelBuilder();
  b.box(0, 0.07, 0, 0.56, 0.14, 0.56, shade(PALETTE.woodDark, 0.8));
  b.box(0, 0.65, 0, 0.34, 1.3, 0.34, PALETTE.woodDark);
  b.box(0.09, 0.62, 0.171, 0.06, 0.6, 0.01, shade(PALETTE.woodDark, 0.72));
  b.box(-0.171, 0.8, -0.05, 0.01, 0.5, 0.06, shade(PALETTE.woodDark, 0.72));
  b.box(0.2, 1.05, 0, 0.3, 0.12, 0.12, PALETTE.woodDark);
  b.box(-0.2, 1.22, 0.06, 0.26, 0.1, 0.1, PALETTE.woodDark);
  b.box(0, 1.95, 0, 1.6, 1.2, 1.6, PALETTE.leaf);
  b.box(0, 1.36, 0, 1.42, 0.1, 1.42, shade(PALETTE.leaf, 0.75));
  b.box(0.05, 2.75, -0.05, 1.12, 0.85, 1.12, jitter(PALETTE.leaf, 0.08, 3));
  b.box(0.05, 3.13, -0.05, 0.86, 0.1, 0.86, shade(PALETTE.leaf, 1.16));
  b.box(0.72, 1.82, 0.3, 0.72, 0.72, 0.72, PALETTE.leafDark);
  b.box(-0.66, 2.1, -0.32, 0.64, 0.64, 0.64, PALETTE.leafDark);
  b.box(-0.2, 1.65, 0.7, 0.6, 0.55, 0.5, jitter(PALETTE.leaf, 0.06, 5));
  b.box(0.5, 2.5, -0.55, 0.52, 0.46, 0.52, shade(PALETTE.leaf, 1.08));
  b.box(-0.58, 2.62, 0.38, 0.46, 0.4, 0.46, shade(PALETTE.leaf, 1.12));
  b.box(0.32, 2.98, 0.4, 0.36, 0.3, 0.36, shade(PALETTE.leaf, 1.05));
  b.box(0.45, 2.45, 0.62, 0.17, 0.17, 0.17, PALETTE.rose);
  b.box(-0.55, 2.62, 0.62, 0.15, 0.15, 0.15, PALETTE.gold);
  b.box(0.2, 3.22, 0.25, 0.15, 0.15, 0.15, PALETTE.lily);
  b.box(0.82, 2.0, 0.66, 0.13, 0.13, 0.13, PALETTE.rose);
  return b;
}
/** Padauk (Myanmar's golden New-Year blossom tree): low, wide, canopy crowned with gold flowers. */
function padaukBuilder() {
  const b = new VoxelBuilder();
  b.box(0, 0.06, 0, 0.5, 0.12, 0.5, shade(PALETTE.woodDark, 0.8));
  b.box(0, 0.55, 0, 0.3, 1.1, 0.3, PALETTE.woodDark);
  b.box(0.08, 0.5, 0.151, 0.06, 0.5, 0.01, shade(PALETTE.woodDark, 0.72));
  b.box(0.28, 1.12, 0, 0.42, 0.12, 0.12, PALETTE.woodDark);
  b.box(-0.26, 1.2, -0.04, 0.38, 0.12, 0.12, PALETTE.woodDark);
  b.box(0, 1.62, 0, 2.1, 0.62, 1.9, PALETTE.leafDark);
  b.box(0, 1.28, 0, 1.8, 0.1, 1.6, shade(PALETTE.leafDark, 0.75));
  b.box(0.1, 2.05, 0, 1.7, 0.5, 1.6, PALETTE.leaf);
  const g = [[0, 2.42, 0, 1.3, 0.42, 1.2, 0], [0.62, 2.22, 0.5, 0.6, 0.4, 0.6, 1], [-0.7, 2.18, 0.35, 0.62, 0.4, 0.56, 2], [-0.45, 2.3, -0.55, 0.6, 0.4, 0.6, 1], [0.55, 2.3, -0.5, 0.56, 0.38, 0.56, 0], [0.15, 2.74, 0.1, 0.74, 0.3, 0.7, 2], [-0.95, 1.86, 0.55, 0.4, 0.34, 0.4, 0], [0.98, 1.84, -0.1, 0.4, 0.34, 0.4, 2], [0.2, 1.9, 0.9, 0.46, 0.36, 0.34, 1]];
  for (const [x, y, z, w, h, d, c] of g) b.box(x, y, z, w, h, d, PADAUK[c]);
  for (const [x, z] of [[0.7, 0.9], [-0.9, -0.6], [1.1, -0.7], [-0.4, 1.1], [0.2, -1.0]]) b.box(x, 0.012, z, 0.14, 0.02, 0.14, PADAUK[(x * 10) & 1 ? 0 : 2]);
  return b;
}
/** Slim cypress: stacked dark columns with lighter sunny faces. */
function cypressBuilder() {
  const b = new VoxelBuilder();
  b.box(0, 0.3, 0, 0.22, 0.6, 0.22, PALETTE.woodDark);
  const tiers = [[0.6, 1.5, 0.96], [1.9, 1.3, 0.82], [3.0, 1.1, 0.64], [3.95, 0.8, 0.44], [4.55, 0.5, 0.24]];
  tiers.forEach(([y, h, w], i) => {
    b.box(0, y + h / 2, 0, w, h, w, i % 2 ? '#3F6E3C' : PALETTE.leafDark);
    b.box(-w * 0.18, y + h * 0.55, w * 0.2, w * 0.6, h * 0.8, w * 0.62, shade(PALETTE.leafDark, 1.18));
  });
  b.box(0, 0.62, 0, 0.9, 0.06, 0.9, shade(PALETTE.leafDark, 0.75));
  return b;
}
/** Toddy palm: ringed trunk with a slight lean, a crown of fan leaves and a cluster of fruit. */
function palmBuilder() {
  const b = new VoxelBuilder();
  b.box(0, 0.08, 0, 0.5, 0.16, 0.5, shade(PALETTE.woodDark, 0.85));
  for (let i = 0; i < 9; i++) {
    const y = 0.16 + i * 0.52, lean = Math.pow(i / 8, 2) * 0.35;
    b.box(lean, y + 0.26, 0, 0.3 - i * 0.008, 0.5, 0.3 - i * 0.008, i % 2 ? PALETTE.woodDark : shade(PALETTE.woodDark, 1.18));
    b.box(lean, y + 0.02, 0, 0.34 - i * 0.008, 0.05, 0.34 - i * 0.008, shade(PALETTE.woodDark, 0.8));
  }
  const top = 4.85, cx = 0.35;
  b.box(cx, top, 0, 0.56, 0.42, 0.56, '#5E7F3F');
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + 0.2;
    const fan = new VoxelBuilder();
    fan.box(0.62, 0, 0, 1.0, 0.05, 0.16, PALETTE.leafDark);
    for (let j = 0; j < 4; j++) fan.box(0.95 + j * 0.06, 0.02, (j - 1.5) * 0.17, 0.62, 0.04, 0.15, j % 2 ? PALETTE.leaf : shade(PALETTE.leaf, 1.12));
    b.merge(fan, _m.compose(_p.set(cx, top + 0.12, 0), _q.setFromEuler(_e.set(0, a, -0.42 - (k % 3) * 0.12, 'YXZ')), _s.set(1, 1, 1)));
  }
  for (const [fx, fz] of [[0.15, 0.2], [0.5, 0.22], [0.32, -0.25]]) b.box(cx + fx - 0.3, top - 0.32, fz, 0.18, 0.18, 0.18, '#3B2A1A');
  return b;
}
/** Blocky cloud: a soft slab, cream puffs on top, a peach underside. Puffs never rise above maxTop. */
function cloud(v, x, y, z, s, seed, maxTop = Infinity) {
  const r = rng(seed);
  // Flat base with a lavender underside, then rounded puffs (a box crossed with a wider,
  // lower box reads as a soft blocky bump), biggest in the middle.
  v.box(x, y, z, 3.4 * s, 0.7 * s, 2.2 * s, CLOUD_MID);
  v.box(x, y, z, 2.8 * s, 0.9 * s, 2.6 * s, CLOUD_MID);
  v.box(x + 0.1 * s, y - 0.48 * s, z, 2.9 * s, 0.3 * s, 1.9 * s, CLOUD_LOW);
  const n = 2 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const side = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2;
    let w = (1.55 - Math.abs(side) * 0.6 + r() * 0.35) * s;
    const ox = side * 1.05 * s + (r() - 0.5) * 0.3 * s, oz = (r() - 0.5) * 0.7 * s;
    w = Math.min(w, (maxTop - y - 0.35 * s) / 0.62);
    if (w < 0.4 * s) continue;
    const cy = y + 0.35 * s + w * 0.28;
    v.box(x + ox, cy, z + oz, w, w * 0.68, w * 0.9, CLOUD_TOP);
    v.box(x + ox, cy - w * 0.08, z + oz, w * 1.24, w * 0.46, w * 0.62, jitter(CLOUD_TOP, 0.02, i));
  }
}
/** A point on the book's outline, pushed `out` metres outward (t = 0..1 around the perimeter). */
function aroundBook(t, out) {
  const W = BOOK.halfW + 1 + out, D = BOOK.halfD + 0.9 + out;
  const per = 4 * W + 4 * D;
  let d = (((t % 1) + 1) % 1) * per;
  if (d < 2 * W) return [-W + d, D];
  d -= 2 * W;
  if (d < 2 * D) return [W, D - d];
  d -= 2 * D;
  if (d < 2 * W) return [W - d, -D];
  d -= 2 * W;
  return [-W, -D + d];
}

function buildSky() {
  const g = new THREE.SphereGeometry(180, 32, 16);
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const top = new THREE.Color(PALETTE.skyTop), hor = new THREE.Color('#FAD7B2'), band = new THREE.Color('#F5C3A8'), low = new THREE.Color(ABYSS), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 180;
    if (y >= 0) c.copy(band).lerp(hor, THREE.MathUtils.smoothstep(y, 0, 0.08)).lerp(top, THREE.MathUtils.smoothstep(y, 0.06, 0.6));
    else c.copy(band).lerp(low, THREE.MathUtils.smoothstep(-y, 0, 0.18));
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  // Unlit gradient dome; basic() has no vertex-colour option, so this one material is local.
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false });
  const m = new THREE.Mesh(g, mat);
  m.name = 'sky';
  m.renderOrder = -10;
  m.frustumCulled = false;
  m.raycast = () => {};
  return m;
}

function starGeometry() {
  const s = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 2;
    const r = i % 2 ? 0.14 : 0.5;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: false });
  g.translate(0, 0, -0.035);
  return g;
}

function shimmerTexture() {
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 32;
  const g = cv.getContext('2d');
  g.fillStyle = 'rgba(236, 178, 52, 0.5)';
  g.fillRect(0, 6, 128, 20);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const x of [22, 86]) {
    g.strokeStyle = 'rgba(214, 150, 30, 1)';
    g.lineWidth = 10;
    g.beginPath();
    g.moveTo(x, 6);
    g.lineTo(x + 18, 16);
    g.lineTo(x, 26);
    g.stroke();
    g.strokeStyle = 'rgba(255, 213, 92, 1)';
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(x, 6);
    g.lineTo(x + 18, 16);
    g.lineTo(x, 26);
    g.stroke();
    g.strokeStyle = 'rgba(255, 255, 245, 1)';
    g.lineWidth = 3.5;
    g.stroke();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

// Prop placements (world x, z).
const TREES = [[-21.5, -14.5], [-17.5, -15.9], [21.5, -14.5], [17.3, -15.7], [-22.9, -6.2], [22.9, -6.2], [-7.4, -12.9], [7.4, -12.9], [-8.8, 0.4], [8.8, 0.4], [-3.5, -4.8], [3.5, -4.8], [-23.0, 9.6], [23.0, 9.6], [-17.2, 13.8], [17.2, 13.8], [-10.6, 15.9], [10.6, 15.9]];
const LAMPS = [[7.07, 1.57], [2.93, -2.57], [-2.93, -2.57], [-7.07, 1.57], [-3.2, 16.4], [3.2, 16.4], [-8.6, 6.6], [8.6, 6.6], [-5.3, -10.4], [5.3, -10.4], [-9.34, -2.04], [9.34, -2.04], [-2.0, -6.7], [2.0, -6.7]];
// (the library bench stands well back from the book, so it never hides the foot of the real cover)
const BENCHES = [[-3.05, 14.0, Math.PI / 2], [3.05, 14.0, -Math.PI / 2], [-10.6, 6.95, Math.PI], [10.6, 6.95, Math.PI], [-20.2, 5.4, 0]];
const BEDS = [[-4.7, 12.3, 1.4, 0.7], [4.7, 12.3, 1.4, 0.7], [-9.9, -8.0, 0.8, 1.6], [9.8, -9.0, 0.8, 1.4], [-5.0, -12.4, 0.8, 1.6], [22.0, 2.45, 1.8, 0.7]];
const FOOTPRINTS = [[-14.0, -8.8, 7.3, 5.3], [0.4, -13.3, 9.3, 5.3], [-18.5, 0.62, 7.9, 5.3], [17.4, 0.5, 5.3, 5.1], [22.0, 0.5, 2.9, 2.9]];
// Extra trees [kind, x, z]: 0 broadleaf, 1 padauk, 2 cypress, 3 toddy palm (each kept only if no road lies just north).
const EXTRA_TREES = [[2, -5.6, -16.4], [2, 6.4, -16.2], [2, -12.2, -16.8], [2, 12.0, -16.9], [2, -9.6, -16.6], [3, -24.3, -16.3], [3, 24.3, -16.3], [3, -24.3, 15.7], [3, 24.3, 15.7], [3, -20.4, 16.3], [1, -12.6, 9.4], [1, 12.2, 9.2], [0, -6.8, 11.6], [1, 20.6, -7.4], [1, 7.0, 13.2]];
// Keep-out boxes [x, z, halfW, halfD] round the buildings (and the pencil) for scattered greenery.
const EXCL = [[-14.0, -7.9, 4.3, 4.0], [0.4, -12.8, 5.3, 3.7], [14.4, -9.0, 4.9, 4.3], [-18.4, 0.9, 4.7, 3.5], [19.4, 0.8, 5.3, 3.7], [16.4, 10.9, 4.0, 1.6], [-6.8, 15.4, 1.2, 0.9]];

/** Tilted thin blade / stroke: a unit box scaled and turned (x, y, z rotations). */
function stroke(v, x, y, z, w, h, d, color, rx = 0, ry = 0, rz = 0) {
  v.add(UNIT, color, _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(w, h, d)));
}
const UNIT = new THREE.BoxGeometry(1, 1, 1);

/**
 * Greenery scattered along the roadsides and over the open page: round bushes and pebbles
 * (outlined, in `vs`), flower clusters and grass tufts (flat-shaded, no outline, in `flat`).
 */
function buildScatter(vs, flat, net, trees, low, places) {
  const r = rng(77);
  // keep Maya's walk from each pad to its door clear (she hops out about a metre beside the car)
  const walks = places.map((pl) => [pl.pad.x, pl.pad.z, pl.door.x, pl.door.z]);
  const nearWalk = (x, z, rad) => walks.some(([ax, az, bx, bz]) => {
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const k = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    return Math.hypot(ax + dx * k - x, az + dz * k - z) < 1.6 + rad;
  });
  const taken = [];
  for (const t of trees) taken.push([t.x, t.z, t.kind === 1 ? 1.35 : t.kind >= 2 ? 0.7 : 1.05]);
  for (const [x, z] of LAMPS) taken.push([x, z, 0.5]);
  for (const [x, z] of BENCHES) taken.push([x, z, 1.15]);
  for (const [x, z, w, d] of BEDS) taken.push([x, z, Math.max(w, d) / 2 + 0.35]);
  const free = (x, z, rad, gap) => {
    if (Math.abs(x) < 3.3 || Math.abs(x) > 24.8 || Math.abs(z) > 17.0) return false;
    if (Math.hypot(x - HUB.x, z - HUB.z) < 7.8 + rad || Math.hypot(x - FOUNTAIN.x, z - FOUNTAIN.z) < 4.0 + rad) return false;
    for (const [cx, cz, hw, hd] of EXCL) if (Math.abs(x - cx) < hw + rad && Math.abs(z - cz) < hd + rad) return false;
    for (const [tx, tz, tr] of taken) if (Math.hypot(x - tx, z - tz) < tr + rad) return false;
    if (nearWalk(x, z, rad)) return false;
    return net.nearest(x, z).dist > ROAD.width / 2 + gap + rad;
  };
  const blooms = [PALETTE.rose, PALETTE.lily, PALETTE.gold, LAVENDER, PALETTE.rose, '#F3B27A'];
  const bush = (x, z, s) => {
    const c = blooms[Math.floor(r() * blooms.length)];
    vs.box(x, 0.22 * s, z, 0.84 * s, 0.44 * s, 0.72 * s, PALETTE.leaf);
    vs.box(x + 0.2 * s, 0.38 * s, z - 0.08 * s, 0.5 * s, 0.42 * s, 0.5 * s, shade(PALETTE.leaf, 1.12));
    vs.box(x - 0.22 * s, 0.3 * s, z + 0.12 * s, 0.46 * s, 0.38 * s, 0.44 * s, PALETTE.leafDark);
    if (r() < 0.7) {
      vs.box(x + 0.08 * s, 0.62 * s, z + 0.16 * s, 0.12 * s, 0.12 * s, 0.12 * s, c);
      vs.box(x - 0.26 * s, 0.5 * s, z + 0.32 * s, 0.1 * s, 0.1 * s, 0.1 * s, c);
    }
    flat.box(x + 0.12, 0.003, z - 0.06, 1.0 * s, 0.006, 0.8 * s, SHADOW);
    taken.push([x, z, 0.5 * s]);
  };
  const flowers = (x, z) => {
    const n = 2 + Math.floor(r() * 3), c = blooms[Math.floor(r() * blooms.length)];
    for (let i = 0; i < n; i++) {
      const fx = x + (r() - 0.5) * 0.5, fz = z + (r() - 0.5) * 0.4, h = 0.14 + r() * 0.16;
      flat.box(fx, h / 2, fz, 0.035, h, 0.035, PALETTE.leafDark);
      flat.box(fx + 0.05, 0.05, fz, 0.1, 0.03, 0.05, PALETTE.leaf, r() * 3);
      flat.box(fx, h + 0.04, fz, 0.11, 0.08, 0.11, i % 3 === 2 ? blooms[Math.floor(r() * blooms.length)] : c, r() * 3);
      flat.box(fx, h + 0.085, fz, 0.045, 0.02, 0.045, PALETTE.gold);
    }
    taken.push([x, z, 0.3]);
  };
  const tuft = (x, z) => {
    for (let i = 0; i < 3; i++) {
      const h = 0.16 + r() * 0.14, a = (i - 1) * 0.42 + (r() - 0.5) * 0.2;
      stroke(flat, x + (i - 1) * 0.06, h / 2 - 0.01, z + (r() - 0.5) * 0.05, 0.045, h, 0.045, [PALETTE.leaf, PALETTE.leafDark, shade(PALETTE.leaf, 1.15)][i], 0, r() * 3, a);
    }
  };
  const pebbles = (x, z) => {
    const c = shade('#CFC2A6', 0.9 + r() * 0.2);
    vs.box(x, 0.06, z, 0.26 + r() * 0.12, 0.12, 0.2 + r() * 0.1, c, r() * 3);
    vs.box(x + 0.2, 0.04, z + 0.08, 0.14, 0.08, 0.12, shade(c, 1.08), r() * 3);
    taken.push([x, z, 0.3]);
  };
  // 1) Roadsides: every ~1.7 m on both sides of every road, a bush, flowers, a tuft or pebbles.
  for (const e of net.edges) {
    for (let s = 0.8; s < e.length - 0.5; s += 1.5 + r() * 0.6) {
      let i = 0;
      while (i < e.n - 2 && e.cum[i + 1] < s) i++;
      const px = e.xs[i], pz = e.zs[i], nx = -e.tz[i], nz = e.tx[i];
      for (const side of [-1, 1]) {
        if (r() < (low ? 0.55 : 0.2)) continue;
        const off = ROAD.width / 2 + 0.55 + r() * 0.9, x = px + nx * off * side, z = pz + nz * off * side;
        const k = r();
        if (k < 0.3) { if (free(x, z, 0.45, 0.25)) bush(x, z, 0.8 + r() * 0.35); }
        else if (k < 0.7) { if (free(x, z, 0.3, 0.12)) flowers(x, z); }
        else if (k < 0.9) { if (free(x, z, 0.15, 0.1)) tuft(x, z); }
        else if (free(x, z, 0.3, 0.1)) pebbles(x, z);
      }
    }
  }
  // 2) Open page: a looser sprinkle of flowers, tufts, bushes and pebbles.
  const n = low ? 90 : 240;
  for (let i = 0; i < n; i++) {
    const x = (r() - 0.5) * 49, z = (r() - 0.5) * 34, k = r();
    if (k < 0.12) { if (free(x, z, 0.45, 0.3)) bush(x, z, 0.75 + r() * 0.4); }
    else if (k < 0.5) { if (free(x, z, 0.3, 0.2)) flowers(x, z); }
    else if (k < 0.9) { if (free(x, z, 0.15, 0.2)) tuft(x, z); }
    else if (free(x, z, 0.3, 0.2)) pebbles(x, z);
  }
}

/** Faint margin doodles in pencil-ink on the pages, a coffee-ring stain and a giant eraser. */
function buildDoodles(flat, vs) {
  const INK = '#C9B791', PINK = '#E6BDB6';
  const y = 0.016;
  const line = (x0, z0, x1, z1, c = INK, w = 0.07) => flat.box((x0 + x1) / 2, y, (z0 + z1) / 2, Math.hypot(x1 - x0, z1 - z0), 0.006, w, c, -Math.atan2(z1 - z0, x1 - x0));
  const ring = (x, z, r0, r1, c = INK, t0 = 0, tl = Math.PI * 2, seg = 28) => {
    const g = new THREE.RingGeometry(r0, r1, seg, 1, t0, tl).rotateX(-Math.PI / 2);
    geoCache.push(g);
    flat.add(g, c, _m.makeTranslation(x, y, z));
  };
  // a little sun
  ring(-9.6, -15.0, 0.42, 0.5);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    line(-9.6 + Math.cos(a) * 0.68, -15.0 + Math.sin(a) * 0.68, -9.6 + Math.cos(a) * 1.0, -15.0 + Math.sin(a) * 1.0);
  }
  // a heart (filled, faint rose)
  flat.box(9.0, y, -14.8, 0.62, 0.006, 0.62, PINK, Math.PI / 4);
  ring(8.78, -15.02, 0, 0.31, PINK);
  ring(9.22, -15.02, 0, 0.31, PINK);
  // a four-point sparkle and a few dots
  for (const [a, l] of [[0, 1.0], [Math.PI / 2, 1.0], [Math.PI / 4, 0.5], [-Math.PI / 4, 0.5]]) line(6.6 - Math.cos(a) * l / 2, 15.4 - Math.sin(a) * l / 2, 6.6 + Math.cos(a) * l / 2, 15.4 + Math.sin(a) * l / 2);
  for (const [dx, dz] of [[0.9, -0.5], [1.2, 0.2], [-0.8, 0.6]]) flat.box(6.6 + dx, y, 15.4 + dz, 0.09, 0.006, 0.09, INK);
  // a paper plane with a dashed flight path
  const px = -9.7, pz = 12.9;
  line(px - 0.6, pz + 0.25, px + 0.55, pz - 0.2);
  line(px - 0.6, pz + 0.25, px - 0.25, pz - 0.3);
  line(px - 0.25, pz - 0.3, px + 0.55, pz - 0.2);
  line(px - 0.25, pz - 0.3, px - 0.05, pz + 0.02);
  for (let k = 0; k < 5; k++) {
    const a = 2.2 + k * 0.32;
    line(px - 0.9 + Math.cos(a) * 1.0, pz + 0.9 + Math.sin(a) * 0.5, px - 0.9 + Math.cos(a + 0.16) * 1.0, pz + 0.9 + Math.sin(a + 0.16) * 0.5);
  }
  // a spiral
  let lx = 21.2, lz = -5.6;
  for (let k = 1; k < 22; k++) {
    const a = k * 0.5, rr = 0.06 + k * 0.035;
    const nx = 21.2 + Math.cos(a) * rr, nz = -5.6 + Math.sin(a) * rr;
    line(lx, lz, nx, nz, INK, 0.06);
    lx = nx;
    lz = nz;
  }
  // a coffee-ring stain beside the café
  ring(19.2, -12.0, 1.18, 1.3, '#DCC6A2', 0, Math.PI * 2, 40);
  ring(19.45, -11.8, 1.2, 1.28, '#E2CFAE', 0.6, 3.6, 30);
  // a giant eraser with its paper sleeve and a few crumbs
  const er = new VoxelBuilder();
  er.box(0, 0.24, 0, 1.5, 0.48, 0.78, PALETTE.rose);
  er.box(-0.78, 0.22, 0, 0.08, 0.4, 0.7, shade(PALETTE.rose, 1.08));
  er.box(0.1, 0.25, 0, 0.66, 0.52, 0.82, PALETTE.white);
  er.box(0.1, 0.25, 0.415, 0.5, 0.06, 0.01, PALETTE.maroon);
  er.box(0.1, 0.36, 0.415, 0.36, 0.04, 0.01, PALETTE.gold);
  er.box(0.1, 0.512, 0, 0.5, 0.01, 0.06, PALETTE.maroon);
  vs.merge(er, _m.compose(_p.set(-6.8, 0, 15.4), _q.setFromEuler(_e.set(0, 0.4, 0)), _s.set(1, 1, 1)));
  for (const [dx, dz] of [[-1.2, 0.5], [-1.0, 0.8], [-1.35, 0.9]]) vs.box(-6.8 + dx, 0.04, 15.4 + dz, 0.1, 0.08, 0.08, PALETTE.rose, dx);
  flat.box(-6.6, 0.003, 15.3, 1.8, 0.006, 1.1, SHADOW, 0.4);
}

/** Plaza extras: paving seams on the forecourt and platform rim, studs and plates on the fountain, coins. */
function addPlazaDetail(vs, flat) {
  const F = FOUNTAIN, seam = shade(PALETTE.parchment, 0.86);
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    if (Math.abs(a - Math.PI / 2) < 0.3) continue;
    const c = Math.cos(a), s = Math.sin(a);
    flat.box(F.x + c * 2.85, 0.094, F.z + s * 2.85, 0.95, 0.006, 0.035, seam, -a);
  }
  flatRing(flat, F.x, 0.0945, F.z, 2.78, 2.82, seam, 40);
  for (let k = 0; k < 64; k++) {
    const a = (k / 64) * Math.PI * 2;
    flat.box(HUB.x + Math.cos(a) * 6.98, 0.094, HUB.z + Math.sin(a) * 6.98, 0.5, 0.006, 0.03, seam, -a);
  }
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8, c = Math.cos(a), s = Math.sin(a), ry = Math.atan2(c, s);
    vs.box(F.x + c * 2.07, 0.42, F.z + s * 2.07, 0.22, 0.05, 0.04, PALETTE.gold, ry);
    vs.box(F.x + c * 2.07, 0.42, F.z + s * 2.07, 0.05, 0.22, 0.04, PALETTE.gold, ry);
    vs.box(F.x + c * 2.17, 0.17, F.z + s * 2.17, 0.12, 0.08, 0.06, PALETTE.gold, ry);
  }
  const coin = cylGeo(0.09, 10);
  for (const [a, rr] of [[0.4, 1.2], [1.3, 1.5], [2.2, 1.05], [3.5, 1.4], [4.4, 1.25], [5.5, 1.55], [5.9, 0.95]]) vs.add(coin, PALETTE.gold, _m.makeScale(1, 0.02, 1).setPosition(F.x + Math.cos(a) * rr, 0.652, F.z + Math.sin(a) * rr));
}

/**
 * Creates the whole open-book world. opts: { detail: 'high' | 'low' } ('low' drops the far
 * cloud ring and half the sparkles). Signs need web fonts: call after fontsReady() or wait
 * for world.ready (signs are redrawn once the fonts arrive).
 */
export function createWorld(opts = {}) {
  const low = opts.detail === 'low';
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(ABYSS);
  scene.fog = new THREE.Fog(ABYSS, 60, 200);
  const lights = addStandardLights(scene, { sun: '#FFEBD2', sky: '#FFF6E8', ground: '#D8C6A2' });
  const root = new THREE.Group();
  root.name = 'world';
  scene.add(root);
  const sky = buildSky();
  scene.add(sky);
  const ownedTextures = [];
  const ownedMaterials = [sky.material];

  // ---- roads, landmarks, places, drive ----
  // Story mode passes a bigger network (the open world's streets joined on): `net` drives the car,
  // `drawNet` (its part on the book) is what this module paints; keepClear(x, z) drops set dressing
  // that would stand on the new roads. The normal site passes none of these.
  const net = opts.net || createNetwork();
  const drawNet = opts.drawNet || net;
  const keep = opts.keepClear ? (x, z) => !opts.keepClear(x, z) : () => true;
  const landmarks = createLandmarks();
  root.add(landmarks.group);
  const places = landmarks.list.map((L) => {
    let px = HUB.x, pz = HUB.z + HUB.r;
    if (L.id !== 'about') {
      const r = drawNet.nearest(L.door.x, L.door.z);
      const e = r.edge;
      let i = 0;
      while (i < e.n - 2 && e.cum[i + 1] < r.s) i++;
      const f = (r.s - e.cum[i]) / (e.cum[i + 1] - e.cum[i] || 1);
      px = e.xs[i] + (e.xs[i + 1] - e.xs[i]) * f;
      pz = e.zs[i] + (e.zs[i + 1] - e.zs[i]) * f;
    }
    const door = L.door.clone();
    if (L.id === 'about') door.y = 0.24;
    // focus: where an arrival close-up should aim so both the car and the building fit.
    const focus = new THREE.Vector3((px + L.center.x) / 2, 1.2, (pz + L.center.z) / 2);
    return { id: L.id, pad: new THREE.Vector3(px, ROAD.top, pz), padHeading: Math.PI / 2, door, labelAnchor: L.labelAnchor.clone(), tapRadius: L.tapRadius, center: L.center.clone(), focus, group: L.group };
  });
  const drive = createDrive(net, places.map((p) => ({ id: p.id, x: p.pad.x, z: p.pad.z, heading: p.padHeading })));
  for (const p of places) {
    if (p.id === 'about') continue;
    drive.teleport('about');
    const pts = drive.route(p.id);
    let a = pts.length - 2;
    while (a > 0 && pts[a].distanceTo(pts[pts.length - 1]) < 0.2) a--;
    const b = pts[pts.length - 1];
    p.padHeading = Math.atan2(b.x - pts[a].x, b.z - pts[a].z);
  }
  drive.pads.forEach((dp, i) => (dp.heading = places[i].padHeading));
  drive.teleport('about');

  // ---- static scenery: one outlined mesh + one flat (no outline) mesh ----
  const vs = new VoxelBuilder();
  const flat = new VoxelBuilder();
  buildBook(vs, flat);
  buildPlaza(vs, flat);
  addPencil(vs, flat, 16.4, 10.9, 0.28);
  addRoadsTo(flat, drawNet, places.map((p) => ({ x: p.pad.x, z: p.pad.z })));
  const bench = benchBuilder(), lamps = [lampBuilder(0), lampBuilder(1), lampBuilder(2)];
  for (const [x, z, ry] of BENCHES) {
    if (!keep(x, z)) continue;
    vs.merge(bench, _m.makeRotationY(ry).setPosition(x, 0, z));
    flat.box(x, 0.003, z, 1.8, 0.006, 0.9, SHADOW, ry);
  }
  LAMPS.forEach(([x, z], i) => {
    // basket / pennant arms point away from the nearest road so they never overhang it
    const nr = drawNet.nearest(x, z), e = nr.edge;
    let k = 0;
    while (k < e.n - 2 && e.cum[k + 1] < nr.s) k++;
    const away = Math.atan2(z - e.zs[k], x - e.xs[k]);
    vs.merge(lamps[i % 3], _m.makeRotationY(-away).setPosition(x, 0, z));
    flat.box(x + 0.12, 0.003, z - 0.08, 0.62, 0.006, 0.62, SHADOW);
  });
  BEDS.forEach(([x, z, w, d], i) => keep(x, z) && vs.merge(bedBuilder(w, d, 20 + i), _m.makeTranslation(x, 0, z)));
  for (const [x, z, w, d] of FOOTPRINTS) flat.box(x, 0.002, z, w, 0.004, d, SHADOW);
  flat.add(cylGeo(3.8, 28), SHADOW, _m.makeScale(1, 0.004, 1).setPosition(13.8, 0.002, -9.2));

  // Trees: the original spots alternate broadleaf and golden padauk; slim cypresses and toddy
  // palms are added only where no road lies just north of them (they must never hide the car).
  const clearNorth = (x, z, h) => {
    for (let t = 0; t <= h * 0.8 + 0.8; t += 0.4) for (const dx of [-1.1, 0, 1.1]) if (drawNet.nearest(x + dx, z - t).dist < ROAD.width / 2 + 0.25) return false;
    return true;
  };
  // (the original spots keep their original size, turn and sway phase, so camera shots near them are unchanged)
  const treeSpots = TREES.map(([x, z], i) => ({ kind: i % 3 === 1 ? 1 : 0, x, z, s: 0.85 + ((i * 37) % 10) * 0.04, ry: (i * 1.7) % (Math.PI * 2), ph: i * 0.9 }));
  EXTRA_TREES.forEach(([kind, x, z], k) => {
    const i = TREES.length + k;
    if (keep(x, z) && clearNorth(x, z, kind === 3 ? 5.4 : kind === 2 ? 5.0 : 3.6)) treeSpots.push({ kind, x, z, s: (kind >= 2 ? 0.92 : 0.85) + ((i * 37) % 10) * (kind >= 2 ? 0.02 : 0.04), ry: (i * 2.3) % (Math.PI * 2), ph: i * 0.9 });
  });
  for (const t of treeSpots) flat.add(cylGeo(1.15, 14), SHADOW, _m.makeScale(t.kind >= 2 ? 0.7 : t.kind === 1 ? 1.15 : 1, 0.006, t.kind >= 2 ? 0.7 : t.kind === 1 ? 1.1 : 1).setPosition(t.x + 0.3, 0.003, t.z - 0.2));
  buildScatter(vs, flat, drawNet, treeSpots, low, places);
  buildDoodles(flat, vs);
  addPlazaDetail(vs, flat);

  const staticMesh = vs.mesh({ outline: true, px: 1.5 });
  staticMesh.name = 'bookAndPlaza';
  root.add(staticMesh);
  const flatMesh = new THREE.Mesh(flat.geometry(), toon('#ffffff', { vertexColors: true }));
  flatMesh.name = 'roadsAndInk';
  root.add(flatMesh);
  for (const g of geoCache.splice(0)) g.dispose();

  // Welcome sign on the forecourt, tilted back toward the camera.
  const welcome = landmarks.makeSign('welcome', 2.6);
  welcome.position.set(FOUNTAIN.x, 1.24, FOUNTAIN.z + 3.1);
  welcome.rotation.x = -0.3;
  root.add(welcome);
  // Maya's logo, round, as the label on the fountain's inkwell (the plaza's centrepiece).
  const logo = artPanel('logo', new THREE.CircleGeometry(INK_LABEL.r, 48).translate(FOUNTAIN.x, INK_LABEL.y, FOUNTAIN.z + INK_LABEL.z + ART_LIFT));
  root.add(logo);

  // ---- clouds: low clouds tucked under the cover's edge and puffy ones beside the book
  // (they only sway, so they never drift into the pages), plus outer rings that circle slowly ----
  const r = rng(3);
  const nearB = new VoxelBuilder(), farB = new VoxelBuilder();
  for (let i = 0; i < 24; i++) {
    const s = 1.7 + r() * 0.8;
    const [x, z] = aroundBook(i / 24 + r() * 0.015, -0.5 + r() * 2.5);
    cloud(nearB, x, -1.78 - 0.45 * s, z, s, 100 + i, -1.72);
  }
  for (let i = 0; i < 14; i++) {
    const s = 1.4 + r() * 0.9;
    const [x, z] = aroundBook(i / 14 + 0.03 + r() * 0.02, 4.2 * s + 1.6 + r() * 3);
    cloud(nearB, x, -2.6 + r() * 2.6, z, s, 200 + i);
  }
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + r() * 0.3, rad = 45 + r() * 12;
    cloud(farB, Math.cos(a) * rad, -3 + r() * 4.5, Math.sin(a) * rad, 1.8 + r() * 1.2, 300 + i);
  }
  if (!low) {
    // The cloud sea: a dense far ring, then broad flat cloud banks deep below (fog tints them lavender).
    for (let i = 0; i < 42; i++) {
      const a = (i / 42) * Math.PI * 2 + r() * 0.12;
      const rad = 50 + r() * 55;
      cloud(farB, Math.cos(a) * rad, -8 + r() * 4.5, Math.sin(a) * rad, 2.6 + r() * 2.2, 400 + i);
    }
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2 + r() * 0.2;
      const rad = 30 + r() * 62;
      const y = -14 + r() * 3;
      cloud(farB, Math.cos(a) * rad, y, Math.sin(a) * rad, 5 + r() * 2.5, 500 + i, y + 3.2);
    }
  }
  const cloudMat = toon('#ffffff', { vertexColors: true, emissive: '#FFF6F0', emissiveIntensity: 0.2 });
  const nearClouds = new THREE.Mesh(nearB.geometry(), cloudMat);
  addOutline(nearClouds, { px: 1.3, color: '#9F8BA8' });
  nearClouds.name = 'cloudsNear';
  root.add(nearClouds);
  const farClouds = new THREE.Mesh(farB.geometry(), cloudMat);
  farClouds.name = 'cloudsFar';
  farClouds.visible = !low;
  root.add(farClouds);

  // ---- trees: four species, one instanced mesh (+ outline) each, gentle sway ----
  const warm = new THREE.Color('#FFE6C2'), white = new THREE.Color('#FFFFFF');
  const speciesB = [oakBuilder, padaukBuilder, cypressBuilder, palmBuilder];
  const treeSets = [];
  const treeData = [];
  speciesB.forEach((make, kind) => {
    const spots = treeSpots.filter((t) => t.kind === kind);
    if (!spots.length) return;
    const mesh = new THREE.InstancedMesh(make().geometry(), toon('#ffffff', { vertexColors: true }), spots.length);
    mesh.name = ['trees', 'padauks', 'cypresses', 'palms'][kind];
    root.add(mesh);
    spots.forEach((t, j) => {
      const i = treeData.length;
      treeData.push({ mesh, j, x: t.x, z: t.z, s: t.s, ry: t.ry, ph: t.ph, amp: kind === 3 ? 1.6 : kind === 2 ? 0.7 : 1 });
      mesh.setColorAt(j, i % 3 === 0 ? warm : white);
    });
    addOutline(mesh, { px: 1.4 });
    treeSets.push(mesh);
  });

  // ---- sparkles (instanced gold four-point stars) ----
  const starGeo = starGeometry();
  const sparkleData = [];
  const rs = rng(11);
  const nOver = low ? 12 : 24;
  while (sparkleData.length < nOver) {
    const x = (rs() - 0.5) * 48, z = (rs() - 0.5) * 34;
    if (LANDMARKS.some((L) => Math.hypot(L.x - x, L.z - z) < 6.5) || Math.hypot(x - FOUNTAIN.x, z - FOUNTAIN.z) < 3) continue;
    sparkleData.push({ x, y: 3 + rs() * 4.5, z, s: 0.5 + rs() * 0.5, ph: rs() * 6.28, sp: 0.6 + rs() * 0.9 });
  }
  for (let i = 0; i < (low ? 6 : 14); i++) {
    const a = (i / 14) * Math.PI * 2 + rs() * 0.3, rad = 30 + rs() * 14;
    sparkleData.push({ x: Math.cos(a) * rad, y: -1 + rs() * 5, z: Math.sin(a) * rad, s: 0.6 + rs() * 0.6, ph: rs() * 6.28, sp: 0.5 + rs() * 0.8 });
  }
  sparkleData.push({ x: FOUNTAIN.x + 1.0, y: 7.0, z: FOUNTAIN.z + 2.2, s: 0.55, ph: 1, sp: 1.6 });
  const beaconIndex = sparkleData.length;
  if (landmarks.beacon) sparkleData.push({ x: landmarks.beacon.x, y: landmarks.beacon.y, z: landmarks.beacon.z, s: 1.9, ph: 0, sp: 1.2, beacon: true });
  const sparkles = new THREE.InstancedMesh(starGeo, basic('#FFFFFF'), sparkleData.length);
  sparkles.name = 'sparkles';
  sparkles.frustumCulled = false;
  const golds = ['#FFD86E', '#FFE9A6', '#F2BE48'].map((h) => new THREE.Color(h));
  sparkleData.forEach((d, i) => sparkles.setColorAt(i, d.beacon ? new THREE.Color('#FFF1B8') : golds[i % 3]));
  root.add(sparkles);

  // ---- unlit lamp cores and lanterns ----
  const glowList = [...LAMPS.map(([x, z]) => ({ position: new THREE.Vector3(x, 2.56, z), size: 0.27 })), ...landmarks.glows];
  const glows = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), basic('#FFE3A0'), glowList.length);
  glows.name = 'glows';
  glows.frustumCulled = false;
  /** Places glow i; lantern cores that belong to a landmark follow its (intro) scale. */
  function placeGlow(i) {
    const g = glowList[i];
    if (!g.group) return glows.setMatrixAt(i, _m.compose(g.position, _q.identity(), _s.set(g.size, g.size * 1.15, g.size)));
    const sc = g.group.scale, k = g.group.visible ? Math.min(sc.x, sc.y) : 0;
    _p.set(g.group.position.x + g.local.x * sc.x, g.local.y * sc.y, g.group.position.z + g.local.z * sc.z);
    glows.setMatrixAt(i, _m.compose(_p, _q.identity(), _s.set(g.size * k, g.size * 1.15 * k, g.size * k)));
  }
  glowList.forEach((g, i) => placeGlow(i));
  root.add(glows);

  // ---- fountain: gold ink blocks arcing out of the inkwell and bobbing in the pool ----
  const inkCount = 24;
  const ink = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), toon('#FFFFFF'), inkCount);
  ink.name = 'fountainInk';
  ink.frustumCulled = false;
  const inkCols = ['#F2CC63', '#FBE6A6', '#E7B84A'].map((h) => new THREE.Color(h));
  for (let i = 0; i < inkCount; i++) ink.setColorAt(i, inkCols[i % 3]);
  root.add(ink);
  addOutline(ink, { px: 1.2 });

  // ---- ripples spreading over the gold-ink pool ----
  const rippleGeo = new THREE.RingGeometry(0.93, 1.0, 36).rotateX(-Math.PI / 2);
  const ripples = new THREE.InstancedMesh(rippleGeo, basic('#F6D77E'), 3);
  ripples.name = 'fountainRipples';
  ripples.frustumCulled = false;
  root.add(ripples);

  // ---- critters: doves looping high over the pages, butterflies round the flowers ----
  // One instanced unit box: each bird is a body + two wings, each butterfly two wings.
  const BIRDS = [[-7, -3, 7.5, 7.2, 0.32, 0], [-7, -3, 7.5, 7.5, 0.32, 0.35], [8, -5, 6.5, 8.0, -0.28, 2], [8, -5, 6.5, 7.6, -0.28, 2.4], [2, 7, 10, 9.0, 0.22, 4], [-14, 9, 6, 7.8, -0.3, 1]].slice(0, low ? 3 : 6);
  const FLY = [[-4.7, 12.3], [4.7, 12.3], [-9.9, -8.0], [9.8, -9.0], [-5.0, -12.4], [22.0, 2.45], [-1.4, 8.4], [12.0, 6.0], [-12.2, 6.2]].slice(0, low ? 4 : 9);
  const critters = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), toon('#FFFFFF'), BIRDS.length * 3 + FLY.length * 2);
  critters.name = 'critters';
  critters.frustumCulled = false;
  const dove = new THREE.Color('#FFFDF8'), doveWing = new THREE.Color('#F1E3C8');
  const wingCols = [PALETTE.rose, '#F2C14E', LAVENDER, PALETTE.white, '#F3B27A'].map((h) => new THREE.Color(h));
  BIRDS.forEach((b, i) => {
    critters.setColorAt(i * 3, dove);
    critters.setColorAt(i * 3 + 1, doveWing);
    critters.setColorAt(i * 3 + 2, doveWing);
  });
  FLY.forEach((f, i) => {
    critters.setColorAt(BIRDS.length * 3 + i * 2, wingCols[i % wingCols.length]);
    critters.setColorAt(BIRDS.length * 3 + i * 2 + 1, wingCols[i % wingCols.length]);
  });
  root.add(critters);
  addOutline(critters, { px: 1.1 });
  /** Writes one critter part: centre (x, y, z) + yaw, a side offset hinged at the body, roll, size. */
  function part(i, x, y, z, yaw, side, hinge, len, roll, w, h, d) {
    const ox = side * (hinge + len * Math.cos(roll)), oy = len * Math.sin(roll);
    p.set(x + ox * Math.cos(yaw), y + oy, z - ox * Math.sin(yaw));
    q.setFromEuler(e.set(0, yaw, side * roll, 'YXZ'));
    critters.setMatrixAt(i, m4.compose(p, q, sc.set(w, h, d)));
  }

  // ---- arrival pad rings (pulse; the pad the car is at glows brighter) ----
  const ringGeo = new THREE.RingGeometry(1.22, 1.5, 40).rotateX(-Math.PI / 2);
  const ringMat = basic('#FFFFFF', { transparent: true, opacity: 0.8, depthWrite: false });
  const rings = new THREE.InstancedMesh(ringGeo, ringMat, places.length);
  rings.name = 'padRings';
  rings.renderOrder = 1;
  const ringIdle = new THREE.Color('#E2B955'), ringHot = new THREE.Color('#FFD45E'), ringC = new THREE.Color();
  places.forEach((p, i) => rings.setColorAt(i, ringIdle));
  root.add(rings);

  // ---- route shimmer (preallocated ribbon) ----
  const MAXP = 1000;
  const rPos = new Float32Array(MAXP * 6), rUv = new Float32Array(MAXP * 4);
  const rIdx = new Uint16Array((MAXP - 1) * 6);
  for (let i = 0; i < MAXP - 1; i++) rIdx.set([2 * i, 2 * i + 2, 2 * i + 1, 2 * i + 1, 2 * i + 2, 2 * i + 3], i * 6);
  const routeGeo = new THREE.BufferGeometry();
  routeGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3).setUsage(THREE.DynamicDrawUsage));
  routeGeo.setAttribute('uv', new THREE.BufferAttribute(rUv, 2).setUsage(THREE.DynamicDrawUsage));
  routeGeo.setIndex(new THREE.BufferAttribute(rIdx, 1));
  const shimmerTex = shimmerTexture();
  ownedTextures.push(shimmerTex);
  const routeMat = basic('#FFFFFF', { map: shimmerTex, transparent: true, depthWrite: false });
  ownedMaterials.push(routeMat);
  const route = new THREE.Mesh(routeGeo, routeMat);
  route.name = 'routeShimmer';
  route.visible = false;
  route.frustumCulled = false;
  route.renderOrder = 2;
  root.add(route);

  // ---- per-frame scratch ----
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  const F = FOUNTAIN;

  function setRoute(points) {
    if (!points || points.length < 2) {
      route.visible = false;
      return;
    }
    const n = Math.min(points.length, MAXP);
    let cum = 0;
    for (let i = 0; i < n; i++) {
      const a = points[Math.max(0, i - 1)], b = points[Math.min(n - 1, i + 1)];
      let tx = b.x - a.x, tz = b.z - a.z;
      const l = Math.hypot(tx, tz) || 1;
      tx /= l;
      tz /= l;
      if (i > 0) cum += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z);
      const nx = -tz * 0.42, nz = tx * 0.42, y = ROAD.top + 0.075;
      rPos.set([points[i].x + nx, y, points[i].z + nz, points[i].x - nx, y, points[i].z - nz], i * 6);
      rUv.set([cum / 1.5, 1, cum / 1.5, 0], i * 4);
    }
    routeGeo.attributes.position.needsUpdate = true;
    routeGeo.attributes.uv.needsUpdate = true;
    routeGeo.setDrawRange(0, (n - 1) * 6);
    route.visible = true;
  }

  function update(dt, t) {
    nearClouds.position.set(Math.sin(t * 0.07) * 1.1, Math.sin(t * 0.3) * 0.12, Math.sin(t * 0.05 + 1) * 0.6);
    farClouds.rotation.y = t * 0.0035;

    for (let i = 0; i < sparkleData.length; i++) {
      const d = sparkleData[i];
      if (d.beacon) {
        const bg = landmarks.beacon.group, by = bg ? bg.scale.y : 1, bk = bg && !bg.visible ? 0 : Math.min(1, by);
        p.set(d.x, (d.y + Math.sin(t * 1.6) * 0.12) * by, d.z);
        const s = d.s * (1 + 0.14 * Math.sin(t * 3.2)) * bk;
        q.setFromEuler(e.set(-0.35, t * d.sp, 0, 'YXZ'));
        sparkles.setMatrixAt(i, m4.compose(p, q, sc.set(s, s, s)));
        continue;
      }
      p.set(d.x + Math.sin(t * 0.21 + d.ph) * 0.6, d.y + Math.sin(t * 0.8 + d.ph) * 0.3, d.z + Math.cos(t * 0.17 + d.ph) * 0.4);
      const tw = Math.pow(Math.max(0, Math.sin(t * d.sp * 1.7 + d.ph)), 6);
      const s = d.s * (0.72 + 0.22 * Math.sin(t * 2.2 + d.ph) + 0.45 * tw);
      q.setFromEuler(e.set(-0.35, t * d.sp + d.ph, 0, 'YXZ'));
      sparkles.setMatrixAt(i, m4.compose(p, q, sc.set(s, s, s)));
    }
    sparkles.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < treeData.length; i++) {
      const d = treeData[i];
      q.setFromEuler(e.set(Math.sin(t * 0.9 + d.ph) * 0.018 * d.amp, d.ry, Math.sin(t * 0.7 + d.ph * 1.3) * 0.022 * d.amp, 'YXZ'));
      d.mesh.setMatrixAt(d.j, m4.compose(p.set(d.x, 0, d.z), q, sc.set(d.s, d.s, d.s)));
    }
    for (let i = 0; i < treeSets.length; i++) treeSets[i].instanceMatrix.needsUpdate = true;

    // Fountain: 4 jets x 4 blocks on parabolic arcs, 8 bobbing bubbles.
    for (let j = 0; j < 4; j++) {
      const a = j * (Math.PI / 2) + Math.PI / 4;
      const cx = Math.cos(a), cz = Math.sin(a);
      for (let k = 0; k < 4; k++) {
        const ph = (t * 0.85 + k / 4 + j * 0.13) % 1;
        const dist = 0.3 + ph * 1.3;
        p.set(F.x + cx * dist, 2.45 + 2.0 * ph - 3.85 * ph * ph, F.z + cz * dist);
        const s = 0.24 * (1 - 0.35 * ph);
        q.setFromEuler(e.set(ph * 3, a + ph * 2, 0));
        ink.setMatrixAt(j * 4 + k, m4.compose(p, q, sc.set(s, s, s)));
      }
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + t * 0.35;
      const rr = 1.2 + Math.sin(t * 1.3 + i) * 0.15;
      const s = 0.13 + 0.05 * Math.sin(t * 2.6 + i * 1.7);
      p.set(F.x + Math.cos(a) * rr, 0.66 + Math.abs(Math.sin(t * 2.1 + i)) * 0.1, F.z + Math.sin(a) * rr);
      q.setFromEuler(e.set(0, a, 0));
      ink.setMatrixAt(16 + i, m4.compose(p, q, sc.set(s, s, s)));
    }
    ink.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.45 + i / 3) % 1, rr = 0.62 + ph * 1.12;
      ripples.setMatrixAt(i, m4.compose(p.set(F.x, 0.656, F.z), q.identity(), sc.set(rr, 1, rr)));
    }
    ripples.instanceMatrix.needsUpdate = true;

    // Doves circle in pairs, flapping with a little rise and fall; butterflies flutter in figure-eights.
    for (let i = 0; i < BIRDS.length; i++) {
      const B = BIRDS[i], cx = B[0], cz = B[1], R = B[2], h = B[3], w = B[4], ph = B[5];
      const a = t * w + ph, dir = w > 0 ? 1 : -1;
      const x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R, y = h + Math.sin(t * 0.6 + ph) * 0.35;
      const yaw = Math.atan2(-Math.sin(a) * dir, Math.cos(a) * dir);
      const flap = 0.12 + 0.55 * Math.sin(t * 6.5 + ph * 3);
      part(i * 3, x, y, z, yaw, 0, 0, 0, 0, 0.15, 0.12, 0.44);
      part(i * 3 + 1, x, y, z, yaw, 1, 0.05, 0.24, flap, 0.48, 0.035, 0.22);
      part(i * 3 + 2, x, y, z, yaw, -1, 0.05, 0.24, flap, 0.48, 0.035, 0.22);
    }
    for (let i = 0, base = BIRDS.length * 3; i < FLY.length; i++) {
      const fx = FLY[i][0], fz = FLY[i][1];
      const a = t * 0.9 + i * 1.7;
      const x = fx + Math.sin(a) * 0.9, z = fz + Math.sin(2 * a) * 0.5, y = 0.6 + Math.sin(t * 1.9 + i) * 0.25 + Math.sin(t * 7 + i) * 0.06;
      const yaw = Math.atan2(Math.cos(a) * 0.9, Math.cos(2 * a));
      const flap = 0.2 + 0.95 * Math.abs(Math.sin(t * 13 + i * 2));
      part(base + i * 2, x, y, z, yaw, 1, 0.0, 0.1, flap, 0.2, 0.02, 0.24);
      part(base + i * 2 + 1, x, y, z, yaw, -1, 0.0, 0.1, flap, 0.2, 0.02, 0.24);
    }
    critters.instanceMatrix.needsUpdate = true;

    // Pad rings: gentle pulse; the pad nearest the car (within 5 m) glows.
    const car = drive.state.position;
    for (let i = 0; i < places.length; i++) {
      const pd = places[i].pad;
      const near = Math.hypot(pd.x - car.x, pd.z - car.z) < 5;
      const s = (near ? 1.12 : 1) + Math.sin(t * 2.4 + i) * 0.05;
      rings.setMatrixAt(i, m4.compose(p.set(pd.x, ROAD.top + 0.065, pd.z), q.identity(), sc.set(s, 1, s)));
      rings.setColorAt(i, ringC.copy(near ? ringHot : ringIdle));
    }
    rings.instanceMatrix.needsUpdate = true;
    rings.instanceColor.needsUpdate = true;

    if (route.visible) shimmerTex.offset.x = -t * 1.1;
    landmarks.update(dt, t);
  }

  // Intro pop-up: landmarks spring up in a ripple out from the spine (120 ms apart) with
  // squash and stretch. reveal(seconds since the intro started); reveal(null) shows all.
  const revealOrder = [...places].sort((a, b) => Math.abs(a.center.x) - Math.abs(b.center.x) || b.center.z - a.center.z);
  const backOut = (k) => 1 + 3.2 * Math.pow(k - 1, 3) + 2.2 * Math.pow(k - 1, 2);
  function reveal(sec) {
    for (let i = 0; i < revealOrder.length; i++) {
      const g = revealOrder[i].group;
      if (sec === null || sec === undefined) {
        g.visible = true;
        g.scale.set(1, 1, 1);
        continue;
      }
      const u = (sec - i * 0.12) / 0.6;
      g.visible = u > 0;
      if (u <= 0) continue;
      const k = Math.min(1, u);
      const y = Math.max(0.001, backOut(k));
      const xz = (1 + (1 - y) * 0.4) * Math.min(1, 0.35 + k * 2);
      g.scale.set(xz, y, xz);
    }
    for (let i = LAMPS.length; i < glowList.length; i++) placeGlow(i);
    glows.instanceMatrix.needsUpdate = true;
  }

  update(0, 0);

  return {
    scene,
    lights,
    places,
    drive,
    net,
    landmarks,
    ready: landmarks.ready,
    update,
    setRoute,
    reveal,
    /** Optional: scale the fog to a camera distance (the default suits the ~30 m game camera). */
    fitFog(distance) {
      scene.fog.near = Math.max(60, distance * 1.6);
      scene.fog.far = Math.max(200, distance * 4.5);
    },
    dispose() {
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.isInstancedMesh) o.dispose();
      });
      landmarks.dispose();
      disposeArtPanel(logo);
      for (const t of ownedTextures) t.dispose();
      for (const m of ownedMaterials) m.dispose();
    },
  };
}
