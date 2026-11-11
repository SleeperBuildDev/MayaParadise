// The six building exteriors of the open-book world. Each landmark is a Group standing on
// the page (y = 0) with its front, door and sign facing +Z (the camera): one merged
// VoxelBuilder mesh + outline, one sign mesh (all signs share ONE canvas atlas texture and
// material), a few small animated parts (weathervane, clapper, steam, paper planes) and
// Maya's real artwork on unlit panels: the three template covers on the boxes outside the
// Template shop, and the "Reality Check" cover as the library book's front cover.
//
//   export LANDMARKS                        -> [{ id, x, z, door: [x, z], top }]  world placement
//   export createLandmarks()                -> { group, list, glows, beacon, makeSign, update, ready, dispose }
//   export artPanel(key, geometry)          -> unlit Mesh showing an art.js artwork (stand-in colour until loaded)
//   export disposeArtPanel(mesh)
import * as THREE from '../three.js';
import { mergeGeometries } from '../three.js';
import { PALETTE, toon, basic, addOutline, signTexture, fontsReady, FONT_SERIF } from '../toon.js';
import { VoxelBuilder, jitter } from '../voxel.js';
import { artTexture, artMaterial, ART_SIZE } from '../art.js';

// Footprint centres (world x, z), door points (where Maya walks in) and roof heights.
export const LANDMARKS = [
  { id: 'about', x: 0, z: 5.1, door: [0, 7.0], top: 5.3, tap: 3.6 },
  { id: 'templates', x: -14.0, z: -8.8, door: [-12.3, -6.2], top: 5.2, tap: 4.2 },
  { id: 'scripts', x: 0, z: -13.4, door: [0, -10.7], top: 7.6, tap: 4.6 },
  { id: 'content', x: 13.8, z: -9.2, door: [13.8, -5.2], top: 5.0, tap: 4.0 },
  { id: 'library', x: -18.7, z: 0.5, door: [-16.3, 3.0], top: 6.8, tap: 4.0 },
  { id: 'contact', x: 19.0, z: 0.5, door: [16.3, 3.0], top: 11.8, tap: 4.4, label: [17.4, 6.4, 0.5] },
];

const STONE = '#D8CBAE';
const MUG = '#FBF6EA';
const GLOW = '#FFE7A8';

// ---------------------------------------------------------------------------------
// Small building helpers (all write into a VoxelBuilder, fronts face +Z)
// ---------------------------------------------------------------------------------
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYL = new THREE.CylinderGeometry(1, 1, 1, 12);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
/** Box with any rotation (radians, XYZ order) about its own centre. */
function boxR(v, x, y, z, w, h, d, color, rx = 0, ry = 0, rz = 0) {
  _e.set(rx, ry, rz, 'XYZ');
  _q.setFromEuler(_e);
  v.add(UNIT, color, _m.compose(_p.set(x, y, z), _q, _s.set(w, h, d)));
}
const cylCache = new Map();
/** Vertical cylinder from y0 to y1 (smooth normals, so the toon ramp bands it). */
function cyl(v, x, y0, y1, z, rBottom, color, seg = 20, rTop = rBottom) {
  const key = `${rTop}|${rBottom}|${seg}`;
  if (!cylCache.has(key)) cylCache.set(key, new THREE.CylinderGeometry(rTop, rBottom, 1, seg));
  v.add(cylCache.get(key), color, _m.makeScale(1, y1 - y0, 1).setPosition(x, (y0 + y1) / 2, z));
}
/** Blocky disc in the XY plane (rows of boxes), used for round windows, the sun and a heart. */
function blockDisc(v, cx, cy, z, r, depth, color, step = 0.12, upperOnly = false) {
  for (let y = -r + step / 2; y < r; y += step) {
    if (upperOnly && y < 0) continue;
    const hw = Math.sqrt(Math.max(0, r * r - y * y));
    if (hw > 0.02) v.box(cx, cy + y, z, hw * 2, step + 0.002, depth, color);
  }
}
/** A colour scaled brighter (k > 1) or darker (k < 1): fake ambient occlusion and lit rims. */
const _sc = new THREE.Color();
const shadeCache = new Map();
function shade(hex, k) {
  const key = hex + '|' + k;
  let s = shadeCache.get(key);
  if (!s) {
    _sc.set(hex);
    _sc.setRGB(Math.min(1, _sc.r * k), Math.min(1, _sc.g * k), Math.min(1, _sc.b * k));
    s = '#' + _sc.getHexString();
    shadeCache.set(key, s);
  }
  return s;
}
const TERRA = '#B86A45';
const CARD = '#CDA77B';

/**
 * Flush seams (board joints, brick courses) on a +Z-facing wall at z, from x0 to x1 at each y,
 * cut around holes [x0, y0, x1, y1]. Barely proud of the wall, so the outline stays thin.
 */
function seamsZ(v, x0, x1, ys, z, color, holes = [], t = 0.03) {
  for (const y of ys) {
    let segs = [[x0, x1]];
    for (const [hx0, hy0, hx1, hy1] of holes) {
      if (y + t / 2 < hy0 || y - t / 2 > hy1) continue;
      segs = segs.flatMap(([a, b]) => (hx1 <= a || hx0 >= b ? [[a, b]] : [[a, Math.max(a, hx0)], [Math.min(b, hx1), b]]).filter(([p, q]) => q - p > 0.06));
    }
    for (const [a, b] of segs) v.boxMin(a, y - t / 2, z - 0.012, b, y + t / 2, z + 0.006, color);
  }
}
/** Flush seams on a side wall at x facing sx (±1), from z0 to z1 at each y. */
function seamsX(v, x, z0, z1, ys, sx, color, t = 0.03) {
  for (const y of ys) v.boxMin(Math.min(x - sx * 0.012, x + sx * 0.006), y - t / 2, z0, Math.max(x - sx * 0.012, x + sx * 0.006), y + t / 2, z1, color);
}
/** A row of roof tiles (or paving slabs) lying on y, from (x0, z0) to (x1, z1), split along 'x' or 'z'. */
function tiles(v, x0, z0, x1, z1, y, color, along = 'x', size = 0.44, seed = 0, th = 0.06) {
  const L = along === 'x' ? x1 - x0 : z1 - z0;
  const n = Math.max(1, Math.round(L / size));
  const st = L / n;
  for (let i = 0; i < n; i++) {
    const c = shade(color, [0.88, 1.04, 1.12, 0.95, 1.0][(i + seed) % 5]);
    if (along === 'x') v.boxMin(x0 + i * st + 0.018, y, z0, x0 + (i + 1) * st - 0.018, y + th, z1, c);
    else v.boxMin(x0, y, z0 + i * st + 0.018, x1, y + th, z0 + (i + 1) * st - 0.018, c);
  }
}
/** Terracotta pot with a leafy plant and a flower or two. */
function pot(v, x, y, z, s = 1, flower = PALETTE.rose) {
  v.box(x, y + 0.13 * s, z, 0.3 * s, 0.26 * s, 0.3 * s, TERRA);
  v.box(x, y + 0.29 * s, z, 0.36 * s, 0.07 * s, 0.36 * s, shade(TERRA, 1.15));
  v.box(x, y + 0.47 * s, z, 0.36 * s, 0.3 * s, 0.36 * s, PALETTE.leaf);
  v.box(x + 0.05 * s, y + 0.66 * s, z - 0.03 * s, 0.24 * s, 0.2 * s, 0.24 * s, PALETTE.leafDark);
  v.box(x - 0.1 * s, y + 0.62 * s, z + 0.14 * s, 0.11 * s, 0.11 * s, 0.11 * s, flower);
  v.box(x + 0.12 * s, y + 0.5 * s, z + 0.15 * s, 0.09 * s, 0.09 * s, 0.09 * s, PALETTE.lily);
}
/** Clipped topiary: a pot with two stacked leafy balls. */
function topiary(v, x, y, z, s = 1) {
  v.box(x, y + 0.17 * s, z, 0.38 * s, 0.34 * s, 0.38 * s, PALETTE.maroon);
  v.box(x, y + 0.36 * s, z, 0.44 * s, 0.06 * s, 0.44 * s, PALETTE.gold);
  v.box(x, y + 0.5 * s, z, 0.07 * s, 0.3 * s, 0.07 * s, PALETTE.woodDark);
  v.box(x, y + 0.82 * s, z, 0.5 * s, 0.44 * s, 0.5 * s, PALETTE.leaf);
  v.box(x, y + 0.82 * s, z, 0.62 * s, 0.3 * s, 0.38 * s, PALETTE.leaf);
  v.box(x, y + 1.15 * s, z, 0.32 * s, 0.26 * s, 0.32 * s, shade(PALETTE.leaf, 1.12));
}
/** Cardboard parcel tied with string. */
function parcel(v, x, y, z, w, h, d, ry = 0) {
  v.box(x, y + h / 2, z, w, h, d, CARD, ry);
  v.box(x, y + h / 2, z, w + 0.02, h + 0.02, 0.04, PALETTE.bronze, ry);
  v.box(x, y + h / 2, z, 0.04, h + 0.02, d + 0.02, PALETTE.bronze, ry);
}
/** Wall lantern: bracket, four slim posts round a glowing core (the core is a world glow), cap and finial. */
function wallLantern(v, x, y, z, s = 1) {
  v.box(x, y + 0.36 * s, z + 0.1 * s, 0.05 * s, 0.05 * s, 0.2 * s, PALETTE.ink);
  v.box(x, y + 0.1 * s, z + 0.03 * s, 0.1 * s, 0.5 * s, 0.05 * s, PALETTE.ink);
  v.box(x, y - 0.13 * s, z + 0.17 * s, 0.26 * s, 0.05 * s, 0.26 * s, PALETTE.gold);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(x + sx * 0.11 * s, y + 0.03 * s, z + 0.17 * s + sz * 0.11 * s, 0.035 * s, 0.32 * s, 0.035 * s, PALETTE.gold);
  v.box(x, y + 0.21 * s, z + 0.17 * s, 0.32 * s, 0.06 * s, 0.32 * s, PALETTE.maroonDeep);
  v.box(x, y + 0.28 * s, z + 0.17 * s, 0.18 * s, 0.08 * s, 0.18 * s, PALETTE.maroonDeep);
  v.box(x, y + 0.36 * s, z + 0.17 * s, 0.05 * s, 0.08 * s, 0.05 * s, PALETTE.gold);
  v.box(x, y - 0.19 * s, z + 0.17 * s, 0.06 * s, 0.07 * s, 0.06 * s, PALETTE.gold);
}

/** A 2.3 m x 1.4 m door on a facade at z (front of the wall), bottom at y0. */
function door(v, x, y0, z, { w = 1.4, h = 2.3, panel = PALETTE.maroon, frame = PALETTE.gold, crown = false } = {}) {
  const f = 0.12;
  v.boxMin(x - w / 2, y0, z - 0.04, x + w / 2, y0 + h, z + 0.03, panel);
  v.boxMin(x - w / 2 - f, y0, z - 0.02, x - w / 2, y0 + h + f, z + 0.1, frame);
  v.boxMin(x + w / 2, y0, z - 0.02, x + w / 2 + f, y0 + h + f, z + 0.1, frame);
  v.boxMin(x - w / 2 - f, y0 + h, z - 0.02, x + w / 2 + f, y0 + h + f, z + 0.1, frame);
  // cornice cap and keystone (where there is room above the door), jamb plinths
  if (crown) {
    v.boxMin(x - w / 2 - f - 0.06, y0 + h + f, z - 0.02, x + w / 2 + f + 0.06, y0 + h + f + 0.07, z + 0.15, shade(frame, 1.12));
    v.box(x, y0 + h + 0.05, z + 0.12, 0.22, 0.2, 0.06, shade(frame, 0.82));
  }
  for (const sx of [-1, 1]) v.boxMin(x + sx * (w / 2 + f / 2) - 0.09, y0, z - 0.02, x + sx * (w / 2 + f / 2) + 0.09, y0 + 0.22, z + 0.13, shade(frame, 0.8));
  // rounded top corners, a glazed upper panel with a cross bar, a raised lower panel
  v.boxMin(x - w / 2, y0 + h - 0.16, z, x - w / 2 + 0.16, y0 + h, z + 0.08, frame);
  v.boxMin(x + w / 2 - 0.16, y0 + h - 0.16, z, x + w / 2, y0 + h, z + 0.08, frame);
  const pc = jitter(panel, 0.18, 7);
  const gy0 = y0 + h * 0.56, gy1 = y0 + h - 0.24;
  v.boxMin(x - w / 2 + 0.14, gy0 - 0.05, z + 0.02, x + w / 2 - 0.14, gy1 + 0.05, z + 0.05, shade(panel, 0.7));
  v.boxMin(x - w / 2 + 0.2, gy0, z + 0.03, x + w / 2 - 0.2, gy1, z + 0.055, PALETTE.skyTop);
  v.box(x, (gy0 + gy1) / 2, z + 0.06, 0.05, gy1 - gy0, 0.03, frame);
  v.box(x, (gy0 + gy1) / 2, z + 0.06, w - 0.4, 0.05, 0.03, frame);
  boxR(v, x - w * 0.18, gy1 - 0.12, z + 0.06, 0.04, 0.16, 0.01, PALETTE.white, 0, 0, -0.6);
  v.boxMin(x - w / 2 + 0.16, y0 + 0.22, z + 0.03, x + w / 2 - 0.16, y0 + h * 0.46, z + 0.06, pc);
  v.boxMin(x - w / 2 + 0.26, y0 + 0.32, z + 0.06, x + w / 2 - 0.26, y0 + h * 0.46 - 0.1, z + 0.075, shade(pc, 1.1));
  v.boxMin(x - w / 2 + 0.06, y0 + 0.02, z + 0.03, x + w / 2 - 0.06, y0 + 0.14, z + 0.06, PALETTE.gold); // kick plate
  for (const hy of [0.42, h - 0.5]) v.box(x - w / 2 + 0.05, y0 + hy, z + 0.06, 0.07, 0.16, 0.04, PALETTE.ink); // hinges
  v.box(x + w / 2 - 0.26, y0 + h * 0.48, z + 0.05, 0.1, 0.26, 0.03, PALETTE.goldDeep); // backplate
  v.box(x + w / 2 - 0.26, y0 + h * 0.48, z + 0.1, 0.12, 0.12, 0.1, PALETTE.gold); // knob
}
/** Framed window: curtains drawn back, lintel, sill on two brackets and a small glint. */
function win(v, x, y, z, w, h, { frame = PALETTE.white, glass = PALETTE.skyTop, sill = PALETTE.goldDeep, curtain = PALETTE.rose } = {}) {
  const f = 0.08;
  v.boxMin(x - w / 2, y - h / 2, z - 0.02, x + w / 2, y + h / 2, z + 0.02, glass);
  v.boxMin(x - w / 2, y + h / 2 - 0.08, z + 0.02, x + w / 2, y + h / 2, z + 0.026, shade(glass, 0.75));
  if (curtain) {
    for (const sx of [-1, 1]) {
      const cx0 = sx < 0 ? x - w / 2 : x + w / 2 - w * 0.22, cx1 = cx0 + w * 0.22;
      v.boxMin(cx0, y - h / 2 + h * 0.12, z + 0.02, cx1, y + h / 2 - 0.08, z + 0.032, curtain);
      v.boxMin(cx0, y - h / 2 + h * 0.36, z + 0.03, cx1, y - h / 2 + h * 0.36 + 0.05, z + 0.04, PALETTE.gold);
    }
    v.boxMin(x - w / 2, y + h / 2 - 0.16, z + 0.02, x + w / 2, y + h / 2 - 0.08, z + 0.034, shade(curtain, 0.86)); // pelmet
  }
  v.boxMin(x - w / 2 - f, y + h / 2, z - 0.02, x + w / 2 + f, y + h / 2 + f, z + 0.1, frame);
  v.boxMin(x - w / 2 - f, y - h / 2 - f, z - 0.02, x + w / 2 + f, y - h / 2, z + 0.1, frame);
  v.boxMin(x - w / 2 - f, y - h / 2, z - 0.02, x - w / 2, y + h / 2, z + 0.1, frame);
  v.boxMin(x + w / 2, y - h / 2, z - 0.02, x + w / 2 + f, y + h / 2, z + 0.1, frame);
  v.box(x, y, z + 0.05, 0.05, h, 0.04, frame);
  v.box(x, y, z + 0.05, w, 0.05, 0.04, frame);
  v.boxMin(x - w / 2 - 0.14, y + h / 2 + f, z - 0.02, x + w / 2 + 0.14, y + h / 2 + f + 0.08, z + 0.15, shade(frame, 0.9)); // lintel
  v.boxMin(x - w / 2 - 0.14, y - h / 2 - 0.16, z - 0.02, x + w / 2 + 0.14, y - h / 2 - 0.07, z + 0.2, sill);
  for (const sx of [-1, 1]) v.box(x + sx * (w / 2 - 0.02), y - h / 2 - 0.23, z + 0.07, 0.07, 0.1, 0.12, shade(sill, 0.85));
  boxR(v, x - w * 0.22, y + h * 0.2, z + 0.04, 0.05, h * 0.3, 0.01, PALETTE.white, 0, 0, -0.6);
}
/** Plain glass pane on a side wall (x, facing sx) with frame, cross bars, sill and lintel. */
function sideWin(v, x, sx, y0, y1, z0, z1, frame = PALETTE.white) {
  const o = (a, b) => [Math.min(x + sx * a, x + sx * b), Math.max(x + sx * a, x + sx * b)];
  const [g0, g1] = o(-0.04, 0.03), [f0, f1] = o(0, 0.1), [m0, m1] = o(0.02, 0.07);
  v.boxMin(g0, y0, z0, g1, y1, z1, PALETTE.skyTop);
  v.boxMin(f0, y0 - 0.08, z0 - 0.08, f1, y0, z1 + 0.08, frame);
  v.boxMin(f0, y1, z0 - 0.08, f1, y1 + 0.08, z1 + 0.08, frame);
  v.boxMin(f0, y0, z0 - 0.08, f1, y1, z0, frame);
  v.boxMin(f0, y0, z1, f1, y1, z1 + 0.08, frame);
  v.boxMin(m0, y0, (z0 + z1) / 2 - 0.025, m1, y1, (z0 + z1) / 2 + 0.025, frame);
  v.boxMin(m0, (y0 + y1) / 2 - 0.025, z0, m1, (y0 + y1) / 2 + 0.025, z1, frame);
  const [s0, s1] = o(0, 0.18);
  v.boxMin(s0, y0 - 0.16, z0 - 0.14, s1, y0 - 0.08, z1 + 0.14, PALETTE.goldDeep);
}
/** Window box with blocky flowers. */
function flowerBox(v, x, y, z, w, seed = 1) {
  v.boxMin(x - w / 2, y, z, x + w / 2, y + 0.2, z + 0.3, PALETTE.wood);
  const cols = [PALETTE.rose, PALETTE.lily, PALETTE.gold, PALETTE.rose];
  let i = 0;
  for (let fx = x - w / 2 + 0.12; fx < x + w / 2 - 0.08; fx += 0.2, i++) {
    v.box(fx, y + 0.26, z + 0.15, 0.16, 0.14, 0.18, i % 2 ? PALETTE.leafDark : PALETTE.leaf);
    v.box(fx + 0.02, y + 0.36, z + 0.17, 0.1, 0.1, 0.1, cols[(i + seed) % cols.length]);
  }
}
/** Four-point sparkle made of two crossed slim boxes (decoration on facades). */
function sparkle(v, x, y, z, s, color = PALETTE.gold) {
  v.box(x, y, z, s * 0.22, s, 0.04, color);
  v.box(x, y, z, s, s * 0.22, 0.04, color);
  boxR(v, x, y, z + 0.01, s * 0.3, s * 0.3, 0.04, color, 0, 0, Math.PI / 4);
}
/** Blocky paper plane (nose +Z, wings along X): a stepped dart of thin boxes plus a keel. */
export function paperPlaneBuilder(fold = PALETTE.cream) {
  const v = new VoxelBuilder();
  const spans = [0.46, 0.35, 0.23, 0.11];
  spans.forEach((hs, i) => v.box(0, 0, -0.36 + i * 0.25, hs * 2, 0.045, 0.26, PALETTE.white));
  v.box(0, -0.07, -0.02, 0.07, 0.12, 0.86, PALETTE.white);
  v.box(0, 0.03, 0.0, 0.035, 0.012, 0.9, fold);
  return v;
}

// ---------------------------------------------------------------------------------
// Sign atlas: every sign is drawn with signTexture() and packed into one 1024 canvas,
// so all landmark signs share one texture and one material.
// ---------------------------------------------------------------------------------
const ATLAS = 1024;
const SLOTS = {
  about: [0, 0, 512, 192],
  templates: [512, 0, 512, 192],
  scripts: [0, 192, 512, 192],
  content: [512, 192, 512, 192],
  library: [0, 384, 512, 192],
  contact: [512, 384, 512, 192],
  mug: [512, 576, 512, 192],
  welcome: [512, 768, 512, 192],
};
const SIGNS = {
  about: [[{ text: 'မာရာ့ စာရေးခန်း', size: 66 }], { bg: PALETTE.cream, border: PALETTE.goldDeep, radius: 30, borderWidth: 12 }],
  templates: [[{ text: 'Template ဆိုင်', size: 74 }], { bg: PALETTE.paper, border: PALETTE.gold, radius: 18, borderWidth: 14 }],
  scripts: [[{ text: 'Script စတူဒီယို', size: 66, color: PALETTE.white }], { bg: '#2B2522', border: PALETTE.cream, radius: 8, borderWidth: 10 }],
  content: [[{ text: 'Content နှင့်', size: 46 }, { text: 'Copywriting', size: 52, font: FONT_SERIF, weight: 600, color: PALETTE.maroon }], { bg: PALETTE.paper, border: PALETTE.maroon, radius: 26, borderWidth: 12 }],
  library: [[{ text: 'စာကြည့်တိုက်', size: 70 }], { bg: PALETTE.cream, border: PALETTE.goldDeep, radius: 24, borderWidth: 12 }],
  contact: [[{ text: 'စာတိုက်', size: 86 }], { bg: PALETTE.cream, border: PALETTE.maroon, radius: 24, borderWidth: 12 }],
  mug: [[{ text: 'Writer', size: 132, font: FONT_SERIF, weight: 600, color: PALETTE.maroon }], { bg: null, border: null }],
  welcome: [[{ text: 'မင်္ဂလာပါရှင့်', size: 60 }, { text: "Maya's Creations", size: 42, font: FONT_SERIF, weight: 600, color: PALETTE.goldDeep }], { bg: PALETTE.cream, border: PALETTE.goldDeep, radius: 26, borderWidth: 12 }],
};

function drawAtlas(canvas) {
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, ATLAS, ATLAS);
  for (const key of Object.keys(SLOTS)) {
    const [x, y, w, h] = SLOTS[key];
    const [lines, opts] = SIGNS[key];
    const tex = signTexture(lines, { width: w, height: h, ...opts });
    g.drawImage(tex.image, x, y);
    tex.dispose();
  }
}

/** Remaps a geometry's 0..1 UVs into an atlas slot. */
function toSlot(geo, key) {
  const [sx, sy, sw, sh] = SLOTS[key];
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (sx + uv.getX(i) * sw) / ATLAS, 1 - (sy + (1 - uv.getY(i)) * sh) / ATLAS);
  return geo;
}
/** Flat sign quad (faces +Z) centred at (x, y, z), width w; height follows the slot aspect. */
function signQuad(key, x, y, z, w) {
  const [, , sw, sh] = SLOTS[key];
  const g = toSlot(new THREE.PlaneGeometry(w, (w * sh) / sw), key);
  g.translate(x, y, z);
  return g;
}

// ---------------------------------------------------------------------------------
// Maya's real artwork (art.js): the template covers, the book cover and her logo, shown
// unlit on flat panels shaped to the image (never stretched or mirrored). A panel is made at
// once with a one-pixel stand-in of the artwork's main colour (so the game's shader warm-up
// already covers it), and the shared texture replaces it as soon as the image has loaded.
// The shared textures belong to art.js and are never disposed here.
// ---------------------------------------------------------------------------------
const ART_STANDIN = { tplShort: '#2D65DD', tplCreator: '#BE0020', tplBusiness: '#1D1D1D', book: '#83602C', logo: '#97654E' };
/** Art panel offset in front of its backing face (metres); the material adds a small depth bias too. */
export const ART_LIFT = 0.008;

/** Unlit Mesh showing artwork `key` (art.js) on `geometry`, whose 0..1 UVs span the whole upright image. */
export function artPanel(key, geometry) {
  const n = parseInt((ART_STANDIN[key] || '#808080').slice(1), 16);
  const standIn = new THREE.DataTexture(new Uint8Array([(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]), 1, 1);
  standIn.colorSpace = THREE.SRGBColorSpace;
  standIn.needsUpdate = true;
  const mat = artMaterial(standIn, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = `art-${key}`;
  mesh.userData.standIn = standIn;
  artTexture(key).then((tex) => {
    if (!tex || mesh.userData.disposed) return;
    mat.map = tex;
    mat.needsUpdate = true;
    standIn.dispose();
  });
  return mesh;
}

/** Frees a panel's geometry, material and stand-in (the shared artwork texture stays alive). */
export function disposeArtPanel(mesh) {
  mesh.userData.disposed = true;
  mesh.geometry.dispose();
  mesh.material.dispose();
  mesh.userData.standIn.dispose();
}

/** Upright art quad facing +Z: centre (x, y), width w, height from the artwork's aspect, at z. */
function artQuad(key, x, y, z, w) {
  const [iw, ih] = ART_SIZE[key];
  return new THREE.PlaneGeometry(w, (w * ih) / iw).translate(x, y, z);
}

// ---------------------------------------------------------------------------------
// 1. about — Maya's Writing Room cottage (on the plaza island)
// ---------------------------------------------------------------------------------
function buildAbout() {
  const v = new VoxelBuilder();
  const W = 2.2, D = 1.5, WALL = 3.2;
  v.boxMin(-W - 0.18, 0, -D - 0.18, W + 0.18, 0.3, D + 0.18, STONE); // tops out above the island paving (0.24)
  for (let i = 0; i < 9; i++) v.boxMin(-W - 0.16 + i * 0.505, 0.05, D + 0.17, -W - 0.16 + (i + 1) * 0.505 - 0.03, 0.27, D + 0.2, shade(STONE, [0.9, 1.06, 0.97][i % 3]));
  v.boxMin(-W, 0.24, -D, W, WALL, D, PALETTE.cream);
  // Darker base course (fake contact shade), clapboard seams on the front and sides.
  v.boxMin(-W, 0.3, D - 0.01, W, 0.5, D + 0.015, shade(PALETTE.cream, 0.86));
  for (const sx of [-1, 1]) v.boxMin(Math.min(sx * W, sx * (W + 0.015)), 0.3, -D, Math.max(sx * W, sx * (W + 0.015)), 0.5, D, shade(PALETTE.cream, 0.86));
  const siding = [0.74, 0.98, 1.22, 1.46, 1.7, 1.94, 2.18, 2.42, 2.66, 2.9];
  const seam = shade(PALETTE.cream, 0.84);
  seamsZ(v, -W + 0.13, W - 0.13, siding, D, seam, [[-0.92, 0, 0.92, 2.8], [1.0, 0.86, 1.9, 2.14], [-1.9, 0.86, -1.0, 2.14], [0.78, 1.88, 1.12, 2.56], [-1.12, 1.88, -0.78, 2.56], [-1.18, 2.68, 1.18, 3.6]]);
  for (const sx of [-1, 1]) {
    const ys = siding.filter((y) => y < 1.02 || y > 2.12);
    seamsX(v, sx * W, -D + 0.13, D - 0.13, ys, sx, seam);
    seamsX(v, sx * W, -D + 0.13, -0.6, siding.filter((y) => y >= 1.02 && y <= 2.12), sx, seam);
    seamsX(v, sx * W, 0.6, D - 0.13, siding.filter((y) => y >= 1.02 && y <= 2.12), sx, seam);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    v.box(sx * W, (WALL + 0.24) / 2, sz * D, 0.26, WALL - 0.24, 0.26, PALETTE.wood);
    v.box(sx * W, 0.4, sz * D, 0.32, 0.2, 0.32, PALETTE.woodDark);
  }
  v.boxMin(-W - 0.13, WALL - 0.2, -D - 0.13, W + 0.13, WALL, D + 0.13, PALETTE.wood);
  for (const sx of [-1, 1]) v.boxMin(Math.min(sx * 1.18, sx * (W + 0.15)), WALL - 0.24, D + 0.1, Math.max(sx * 1.18, sx * (W + 0.15)), WALL - 0.18, D + 0.16, PALETTE.gold);
  // Stepped gable roof, gable end facing the camera (maroon skins, cream gable infill),
  // shingled in rows of offset tiles with a gold drip line on every step of the gable edge.
  for (let i = 0; i < 6; i++) {
    const y0 = WALL + i * 0.3, y1 = y0 + 0.3, hw = W + 0.4 - i * 0.4;
    const c = jitter(PALETTE.maroon, 0.05, i);
    if (hw < 0.9) {
      v.boxMin(-hw, y0, -D - 0.34, hw, y1, D + 0.34, c);
    } else {
      v.boxMin(-hw, y0, -D - 0.34, -hw + 0.62, y1, D + 0.34, c);
      v.boxMin(hw - 0.62, y0, -D - 0.34, hw, y1, D + 0.34, c);
      v.boxMin(-hw + 0.62, y0, -D, hw - 0.62, y1, D, PALETTE.cream);
      for (const sx of [-1, 1]) {
        const a = sx * (hw - 0.43), b = sx * (hw + 0.03);
        tiles(v, Math.min(a, b), -D - 0.36, Math.max(a, b), D + 0.36, y1, c, 'z', 0.46, i * 2 + (sx > 0 ? 1 : 0));
        v.boxMin(Math.min(sx * (hw - 0.62), sx * hw), y0, D + 0.34, Math.max(sx * (hw - 0.62), sx * hw), y0 + 0.06, D + 0.39, PALETTE.gold);
      }
    }
  }
  // Board-and-batten gable infill.
  for (const [bx, top] of [[1.0, 4.1], [1.4, 3.8], [1.8, 3.5], [0.66, 4.1]]) for (const sx of [-1, 1]) v.boxMin(sx * bx - 0.03, WALL, D, sx * bx + 0.03, top, D + 0.025, shade(PALETTE.cream, 0.88));
  v.boxMin(-0.62, WALL + 1.8, -D - 0.38, 0.62, WALL + 1.94, D + 0.38, PALETTE.maroonDeep);
  tiles(v, -0.32, -D - 0.4, 0.32, D + 0.4, WALL + 1.94, PALETTE.maroonDeep, 'z', 0.5, 3, 0.08);
  v.box(0, WALL + 2.12, D + 0.36, 0.1, 0.26, 0.1, PALETTE.gold);
  v.box(0, WALL + 2.3, D + 0.36, 0.17, 0.17, 0.17, PALETTE.gold);
  // Gutters and downpipes.
  for (const sx of [-1, 1]) {
    v.boxMin(Math.min(sx * 2.6, sx * 2.72), WALL - 0.08, -D - 0.36, Math.max(sx * 2.6, sx * 2.72), WALL + 0.04, D + 0.36, PALETTE.goldDeep);
    v.boxMin(Math.min(sx * 2.24, sx * 2.32), 0.3, D - 0.42, Math.max(sx * 2.24, sx * 2.32), WALL - 0.05, D - 0.34, PALETTE.goldDeep);
    v.boxMin(Math.min(sx * 2.24, sx * 2.66), WALL - 0.12, D - 0.42, Math.max(sx * 2.24, sx * 2.66), WALL - 0.04, D - 0.34, PALETTE.goldDeep);
    v.box(sx * 2.28, 0.36, D - 0.3, 0.12, 0.08, 0.2, PALETTE.goldDeep);
  }
  // Round window in the gable.
  const wy = WALL + 0.78;
  blockDisc(v, 0, wy, D + 0.03, 0.5, 0.1, PALETTE.gold, 0.1);
  blockDisc(v, 0, wy, D + 0.08, 0.36, 0.06, PALETTE.skyTop, 0.09);
  v.box(0, wy, D + 0.12, 0.06, 0.74, 0.04, PALETTE.white);
  v.box(0, wy, D + 0.12, 0.74, 0.06, 0.04, PALETTE.white);
  boxR(v, -0.13, wy + 0.12, D + 0.12, 0.05, 0.22, 0.01, PALETTE.white, 0, 0, -0.6);
  // Brick chimney with a cream cap and two pots (smoke puffs come from world update).
  const BRICK = '#8E3B33';
  v.boxMin(0.95, WALL + 0.5, -1.0, 1.5, WALL + 2.3, -0.4, BRICK);
  for (let r = 0; r < 9; r++) {
    const y = WALL + 0.62 + r * 0.18, off = r % 2 ? 0.14 : 0;
    for (let bx = 0.95 - off; bx < 1.5; bx += 0.28) {
      const x0 = Math.max(0.95, bx + 0.015), x1 = Math.min(1.5, bx + 0.265);
      if (x1 - x0 > 0.05) v.boxMin(x0, y, -0.4, x1, y + 0.15, -0.388, shade(BRICK, [0.86, 1.08, 0.96, 1.15][(r + Math.round(bx * 10)) % 4]));
    }
  }
  v.boxMin(0.87, WALL + 2.3, -1.08, 1.58, WALL + 2.45, -0.32, PALETTE.cream);
  v.boxMin(0.92, WALL + 2.45, -1.03, 1.53, WALL + 2.5, -0.37, shade(PALETTE.cream, 0.85));
  v.box(1.08, WALL + 2.62, -0.7, 0.18, 0.24, 0.18, TERRA);
  v.box(1.36, WALL + 2.58, -0.7, 0.16, 0.16, 0.16, shade(TERRA, 0.9));
  // Door, doorstep with a welcome mat, potted plants, lanterns, sign board.
  door(v, 0, 0.3, D, { w: 1.4, h: 2.3 });
  v.boxMin(-0.85, 0, D, 0.85, 0.33, D + 0.5, PALETTE.wood);
  v.boxMin(-0.85, 0.27, D + 0.47, 0.85, 0.33, D + 0.53, shade(PALETTE.wood, 0.8));
  v.boxMin(-0.5, 0.33, D + 0.08, 0.5, 0.35, D + 0.44, PALETTE.maroon);
  v.boxMin(-0.4, 0.35, D + 0.14, 0.4, 0.356, D + 0.38, PALETTE.gold);
  v.boxMin(-0.34, 0.355, D + 0.18, 0.34, 0.36, D + 0.34, PALETTE.maroon);
  for (const sx of [-1, 1]) {
    wallLantern(v, sx * 0.95, 2.15, D - 0.04);
    pot(v, sx * 1.02, 0.24, D + 0.52, 0.9, sx > 0 ? PALETTE.gold : PALETTE.rose);
  }
  v.boxMin(-1.16, 2.7, D - 0.02, 1.16, 3.56, D + 0.17, PALETTE.woodDark); // stands proud of the wall band so the sign reads whole
  for (const sx of [-1, 1]) v.box(sx * 0.9, 3.62, D + 0.03, 0.06, 0.12, 0.06, PALETTE.gold);
  // Front windows with flower boxes.
  for (const sx of [-1, 1]) {
    win(v, sx * 1.45, 1.55, D, 0.62, 0.8, { curtain: sx > 0 ? PALETTE.rose : '#E7C46A' });
    flowerBox(v, sx * 1.45, 0.92, D, 0.86, sx > 0 ? 1 : 2);
  }
  // Side windows.
  for (const sx of [-1, 1]) sideWin(v, sx * W, sx, 1.15, 1.95, -0.45, 0.45);
  // Mailbox on a post beside the path.
  v.box(0.82, 0.62, D + 2.0, 0.09, 0.78, 0.09, PALETTE.woodDark);
  v.box(0.82, 1.08, D + 2.0, 0.3, 0.24, 0.44, PALETTE.maroon);
  v.box(0.82, 1.21, D + 2.0, 0.24, 0.05, 0.4, shade(PALETTE.maroon, 1.2));
  v.box(0.82, 1.08, D + 2.23, 0.2, 0.14, 0.02, PALETTE.gold);
  v.box(0.99, 1.2, D + 1.92, 0.03, 0.26, 0.05, PALETTE.gold);
  v.box(0.99, 1.3, D + 1.98, 0.03, 0.08, 0.12, PALETTE.rose);
  // Stepping-stone path and two round bushes in the front garden.
  for (let i = 0; i < 4; i++) {
    v.box((i % 2 ? 0.14 : -0.14), 0.27, D + 0.85 + i * 0.62, 0.74, 0.07, 0.46, PALETTE.parchment);
    v.box((i % 2 ? 0.14 : -0.14) + 0.1, 0.31, D + 0.85 + i * 0.62 - 0.05, 0.36, 0.02, 0.22, shade(PALETTE.parchment, 1.08));
  }
  for (const sx of [-1, 1]) {
    v.box(sx * 1.45, 0.42, D + 1.15, 0.9, 0.62, 0.8, PALETTE.leaf);
    v.box(sx * 1.4, 0.82, D + 1.1, 0.56, 0.36, 0.52, PALETTE.leafDark);
    v.box(sx * 1.2, 0.76, D + 1.5, 0.14, 0.14, 0.14, PALETTE.rose);
    v.box(sx * 1.7, 0.66, D + 1.42, 0.14, 0.14, 0.14, PALETTE.lily);
    v.box(sx * 1.55, 0.95, D + 0.95, 0.14, 0.14, 0.14, PALETTE.gold);
  }
  // Weathervane post (the quill on top turns).
  v.box(0, WALL + 2.2, 0, 0.07, 0.6, 0.07, PALETTE.goldDeep);
  const vane = new VoxelBuilder();
  vane.box(0, 0, 0, 1.2, 0.06, 0.06, PALETTE.gold);
  for (let i = 0; i < 6; i++) {
    const t = i / 5, hw = 0.05 + Math.sin(Math.PI * Math.pow(t, 0.8)) * 0.17;
    vane.box(-0.05 - i * 0.1, 0, 0, 0.1, hw * 2, 0.04, i % 2 ? PALETTE.white : PALETTE.cream);
  }
  vane.box(0.55, 0, 0, 0.16, 0.1, 0.05, PALETTE.goldDeep);
  sparkle(vane, 0, 0.2, 0, 0.26);
  const signs = [signQuad('about', 0, 3.13, D + 0.18, 2.18)];
  return { v, signs, vane: { builder: vane, pos: [0, WALL + 2.52, 0] }, glows: [[-0.95, 2.18, D + 0.13, 0.2], [0.95, 2.18, D + 0.13, 0.2]], smoke: [1.1, WALL + 2.78, -0.7] };
}

// ---------------------------------------------------------------------------------
// 2. templates — boutique with three giant product boxes (blue, red, black)
// ---------------------------------------------------------------------------------
function buildTemplates() {
  const v = new VoxelBuilder();
  const W = 3.2, D = 2.2, H = 4.4;
  v.boxMin(-W - 0.15, 0, -D - 0.15, W + 0.15, 0.2, D + 0.15, STONE);
  v.boxMin(-W, 0.2, -D, W, H, D, PALETTE.paper);
  for (const x of [-W, W]) v.boxMin(x - 0.12, 0.2, D - 0.05, x + 0.12, H, D + 0.1, PALETTE.gold);
  v.boxMin(0.63, 0.2, D - 0.05, 0.87, 2.6, D + 0.1, PALETTE.gold); // between window and door, below the fascia
  v.boxMin(-W, 0.2, D - 0.02, 0.63, 0.72, D + 0.06, PALETTE.maroon);
  v.boxMin(2.58, 0.2, D - 0.02, W - 0.12, 0.72, D + 0.06, PALETTE.maroon);
  // Display window (west) and door (east).
  v.boxMin(-2.95, 0.8, D - 0.02, 0.5, 2.42, D + 0.02, PALETTE.skyTop);
  for (const x of [-2.95, -1.22, 0.5]) v.boxMin(x - 0.06, 0.74, D - 0.02, x + 0.06, 2.48, D + 0.1, PALETTE.white);
  v.boxMin(-3.0, 2.42, D - 0.02, 0.56, 2.5, D + 0.1, PALETTE.white);
  v.boxMin(-3.0, 0.72, D - 0.02, 0.56, 0.8, D + 0.14, PALETTE.goldDeep);
  boxR(v, -2.4, 1.9, D + 0.03, 0.06, 0.5, 0.01, PALETTE.white, 0, 0, -0.6);
  boxR(v, -0.6, 1.9, D + 0.03, 0.06, 0.5, 0.01, PALETTE.white, 0, 0, -0.6);
  door(v, 1.72, 0.2, D, { w: 1.4, h: 2.3, panel: PALETTE.maroon });
  // Striped awning (two stepped tiers) with scallops.
  let k = 0;
  for (let x = -W + 0.05; x < W - 0.04; x += 0.4, k++) {
    const c = k % 2 ? PALETTE.cream : PALETTE.maroon;
    const x1 = Math.min(W - 0.05, x + 0.4);
    v.boxMin(x, 2.66, D, x1, 2.84, D + 0.45, c);
    v.boxMin(x, 2.5, D + 0.45, x1, 2.68, D + 0.86, c);
    if (k % 2 === 0) v.boxMin(x + 0.06, 2.36, D + 0.74, x1 - 0.06, 2.5, D + 0.86, c);
  }
  // Fascia sign board, cornice, parapet with a gold bow.
  v.boxMin(-1.72, 2.96, D - 0.02, 1.72, 4.3, D + 0.08, PALETTE.gold);
  v.boxMin(-W - 0.2, H, -D - 0.2, W + 0.2, H + 0.22, D + 0.25, PALETTE.gold);
  v.boxMin(-W - 0.1, H + 0.22, -D - 0.1, W + 0.1, H + 0.46, D + 0.14, PALETTE.maroon);
  for (const sx of [-1, 1]) v.box(sx * (W - 0.05), H + 0.62, D - 0.05, 0.3, 0.3, 0.3, PALETTE.gold);
  for (const sx of [-1, 1]) boxR(v, sx * 0.34, H + 0.72, D - 0.3, 0.55, 0.38, 0.16, PALETTE.gold, 0, 0, sx * 0.45);
  v.box(0, H + 0.66, D - 0.3, 0.24, 0.24, 0.2, PALETTE.goldDeep);
  // Side windows with frames, panel seams on the paper walls.
  const seam = shade(PALETTE.paper, 0.86);
  for (const sx of [-1, 1]) {
    sideWin(v, sx * W, sx, 1.4, 2.6, -0.8, 0.8);
    seamsX(v, sx * W, -D + 0.05, -0.95, [0.95, 1.7, 2.45, 3.2, 3.95], sx, seam);
    seamsX(v, sx * W, 0.95, D - 0.15, [0.95, 1.7, 2.45, 3.2, 3.95], sx, seam);
    seamsX(v, sx * W, -0.95, 0.95, [0.95, 3.2, 3.95], sx, seam);
    v.boxMin(Math.min(sx * W, sx * (W + 0.02)), 0.2, -D, Math.max(sx * W, sx * (W + 0.02)), 0.5, D - 0.12, shade(PALETTE.paper, 0.84));
  }
  // Upper facade: framed panels with gold sparkle medallions either side of the fascia.
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -3.0 : 1.86, x1 = x0 + 1.14;
    v.boxMin(x0, 3.0, D - 0.01, x1, 4.22, D + 0.03, shade(PALETTE.paper, 0.93));
    for (const [a, b, c, d] of [[x0, 3.0, x1, 3.06], [x0, 4.16, x1, 4.22], [x0, 3.0, x0 + 0.06, 4.22], [x1 - 0.06, 3.0, x1, 4.22]]) v.boxMin(a, b, D, c, d, D + 0.07, PALETTE.gold);
    blockDisc(v, (x0 + x1) / 2, 3.61, D + 0.05, 0.34, 0.04, PALETTE.cream, 0.08);
    sparkle(v, (x0 + x1) / 2, 3.61, D + 0.08, 0.42);
  }
  // Dentil course under the cornice, studs along the parapet.
  for (let x = -W + 0.12; x <= W - 0.1; x += 0.26) v.box(x, H - 0.07, D + 0.05, 0.13, 0.12, 0.1, PALETTE.goldDeep);
  for (let x = -W + 0.5; x <= W - 0.4; x += 0.6) v.box(x, H + 0.34, D + 0.15, 0.12, 0.12, 0.04, PALETTE.gold);
  // Roof: seams on the maroon deck, a framed skylight, a vent and two planters at the back.
  const RT = H + 0.46, rs = shade(PALETTE.maroon, 0.8);
  for (let z = -D + 0.4; z < D; z += 0.55) v.boxMin(-W - 0.05, RT - 0.01, z - 0.015, W + 0.05, RT + 0.006, z + 0.015, rs);
  for (let x = -W + 0.6; x < W; x += 0.8) v.boxMin(x - 0.015, RT - 0.01, -D - 0.05, x + 0.015, RT + 0.006, D + 0.1, rs);
  v.boxMin(-2.3, RT, -1.3, -0.7, RT + 0.12, 0.1, PALETTE.gold);
  v.boxMin(-2.2, RT + 0.12, -1.2, -0.8, RT + 0.2, 0.0, PALETTE.skyTop);
  v.box(-1.5, RT + 0.22, -0.6, 1.4, 0.05, 0.05, PALETTE.gold);
  v.box(-1.5, RT + 0.22, -0.6, 0.05, 0.05, 1.2, PALETTE.gold);
  v.box(1.9, RT + 0.25, -1.2, 0.26, 0.5, 0.26, PALETTE.cream);
  v.box(1.9, RT + 0.54, -1.2, 0.4, 0.08, 0.4, PALETTE.goldDeep);
  for (const px of [0.6, 2.3]) {
    v.boxMin(px - 0.45, RT, -2.0, px + 0.45, RT + 0.22, -1.6, PALETTE.wood);
    for (let i = 0; i < 3; i++) v.box(px - 0.28 + i * 0.28, RT + 0.34, -1.8, 0.24, 0.24 + (i % 2) * 0.1, 0.26, i % 2 ? PALETTE.leafDark : PALETTE.leaf);
    v.box(px - 0.2, RT + 0.52, -1.76, 0.1, 0.1, 0.1, PALETTE.rose);
  }
  // Awning rail and brackets, a topiary by the door, a gold step plate.
  v.boxMin(-W + 0.05, 2.5, D + 0.86, W - 0.05, 2.56, D + 0.9, PALETTE.gold);
  for (const sx of [-1, 1]) boxR(v, sx * (W - 0.12), 2.42, D + 0.45, 0.05, 0.05, 0.9, PALETTE.ink, 0.45, 0, 0);
  topiary(v, 2.92, 0.2, D + 0.36, 0.9);
  v.boxMin(0.92, 0.2, D, 2.52, 0.24, D + 0.35, PALETTE.goldDeep);
  // Three giant product boxes, small to big: blue (Short Videos), red (Creators), black
  // (Business). The whole front of each box is her real 4:5 cover (an unlit art panel between
  // the plinth and the lid), so the gold ribbon runs over the lid and down the sides instead,
  // with the bow on top and a price tag on a string at the side.
  const ART_W = [1.04, 1.18, 1.3];
  const boxes = [
    { key: 'tplShort', x: -2.43, c: '#2D62D6', lid: '#244A8F' },
    { key: 'tplCreator', x: -1.22, c: '#C0182E', lid: '#A3252F' },
    { key: 'tplBusiness', x: 0.12, c: PALETTE.boxBlack, lid: '#34343B' },
  ];
  const art = [];
  boxes.forEach((b, i) => {
    const w = ART_W[i], d = 1.1, z = D + 0.95, zf = z + d / 2;
    const [iw, ih] = ART_SIZE[b.key];
    const ah = (w * ih) / iw; // cover height at its true aspect
    const h = 0.1 + ah + 0.02; // plinth below, lid above: the cover shows whole between them
    // The lid sits back a little, so its lip barely overhangs the front and never hides the
    // top of the cover from the steep game camera.
    const lz = z - 0.038;
    v.box(b.x, h / 2, z, w, h, d, b.c);
    v.box(b.x, 0.05, z, w + 0.04, 0.1, d + 0.04, shade(b.c, 0.7));
    v.box(b.x, h + 0.06, lz, w + 0.1, 0.16, d + 0.1, b.lid);
    v.box(b.x, h + 0.06, lz, w + 0.14, 0.04, d + 0.14, shade(b.lid, 0.75));
    v.box(b.x, h + 0.145, z, w + 0.12, 0.02, 0.16, PALETTE.gold);
    for (const sx of [-1, 1]) {
      const sideX = (a, c) => [Math.min(b.x + sx * a, b.x + sx * c), Math.max(b.x + sx * a, b.x + sx * c)];
      const [r0, r1] = sideX(w / 2 - 0.005, w / 2 + 0.02), [l0, l1] = sideX(w / 2 + 0.04, w / 2 + 0.065);
      v.boxMin(r0, 0.1, z - 0.08, r1, h - 0.02, z + 0.08, PALETTE.gold); // ribbon down the side
      v.boxMin(l0, h - 0.02, z - 0.08, l1, h + 0.155, z + 0.08, PALETTE.gold); // ...and over the lid's edge
      boxR(v, b.x + sx * 0.17, h + 0.27, z, 0.3, 0.2, 0.12, PALETTE.gold, 0, 0, sx * 0.5);
      boxR(v, b.x + sx * 0.1, h + 0.17, z + 0.16, 0.07, 0.24, 0.03, PALETTE.gold, -1.1, 0, sx * 0.35); // bow tails on the lid
    }
    v.box(b.x, h + 0.23, z, 0.13, 0.13, 0.14, PALETTE.goldDeep);
    v.box(b.x + w / 2 + 0.02, h - 0.12, zf - 0.08, 0.02, 0.2, 0.02, PALETTE.ink);
    boxR(v, b.x + w / 2 + 0.03, h - 0.32, zf - 0.08, 0.04, 0.22, 0.15, PALETTE.cream, 0.15, 0, 0);
    art.push({ key: b.key, geo: artQuad(b.key, b.x, 0.1 + ah / 2, zf + ART_LIFT, w) });
  });
  const signs = [signQuad('templates', 0, 3.63, D + 0.09, 3.2)];
  return { v, signs, art };
}

// ---------------------------------------------------------------------------------
// 3. scripts — studio made of three giant standing books + a clapperboard sign
// ---------------------------------------------------------------------------------
function buildScripts() {
  const v = new VoxelBuilder();
  const Z0 = -1.9, Z1 = 1.9;
  v.boxMin(-4.0, 0, -2.25, 4.75, 0.35, 2.4, PALETTE.woodDark); // the shelf
  v.boxMin(-4.0, 0.22, 2.4, 4.75, 0.33, 2.46, PALETTE.gold);
  const book = (x0, x1, h, color, title = true) => {
    v.boxMin(x0, 0.35, Z0, x0 + 0.14, h, Z1, color);
    v.boxMin(x1 - 0.14, 0.35, Z0, x1, h, Z1, color);
    v.boxMin(x0 + 0.14, 0.42, Z0 + 0.12, x1 - 0.14, h - 0.12, Z1 - 0.1, PALETTE.paper);
    v.boxMin(x0 + 0.24, h - 0.121, Z0 + 0.5, x1 - 0.24, h - 0.11, Z0 + 0.56, PALETTE.parchment);
    v.boxMin(x0, 0.35, Z1 - 0.12, x1, h, Z1 + 0.06, color);
    for (const y of [h - 0.62, h - 0.92, 0.82]) v.boxMin(x0 - 0.03, y, Z1 + 0.03, x1 + 0.03, y + 0.13, Z1 + 0.1, PALETTE.gold);
    if (title) {
      v.boxMin(x0 + 0.22, h - 2.35, Z1 + 0.04, x1 - 0.22, h - 1.25, Z1 + 0.09, PALETTE.cream);
      v.boxMin(x0 + 0.34, h - 1.95, Z1 + 0.08, x1 - 0.34, h - 1.87, Z1 + 0.11, PALETTE.goldDeep);
      v.boxMin(x0 + 0.34, h - 1.72, Z1 + 0.08, x1 - 0.34, h - 1.64, Z1 + 0.11, PALETTE.goldDeep);
      for (const [a, b] of [[h - 2.35, h - 2.29], [h - 1.31, h - 1.25]]) v.boxMin(x0 + 0.18, a, Z1 + 0.05, x1 - 0.18, b, Z1 + 0.1, PALETTE.gold);
      sparkle(v, (x0 + x1) / 2, h - 2.85, Z1 + 0.09, 0.32);
      // raised ridges down the spine, lit on top
      for (const y of [1.35, 1.85, 2.35, 2.85]) {
        v.boxMin(x0 + 0.06, y, Z1 + 0.04, x1 - 0.06, y + 0.07, Z1 + 0.09, shade(color, 1.2));
        v.boxMin(x0 + 0.06, y - 0.03, Z1 + 0.04, x1 - 0.06, y, Z1 + 0.08, shade(color, 0.7));
      }
    }
    // page edges on the top, a striped headband and gold corner caps on the spine
    for (let x = x0 + 0.3; x < x1 - 0.22; x += 0.17) v.boxMin(x - 0.012, h - 0.125, Z0 + 0.16, x + 0.012, h - 0.112, Z1 - 0.16, PALETTE.parchment);
    for (let x = x0 + 0.16, i = 0; x < x1 - 0.16; x += 0.12, i++) v.boxMin(x, h - 0.13, Z1 - 0.17, Math.min(x1 - 0.14, x + 0.12), h - 0.08, Z1 - 0.1, i % 2 ? PALETTE.cream : PALETTE.maroon);
    for (const [cx, sx] of [[x0, 1], [x1, -1]]) {
      v.boxMin(Math.min(cx, cx + sx * 0.3), h - 0.3, Z1 + 0.04, Math.max(cx, cx + sx * 0.3), h + 0.02, Z1 + 0.1, PALETTE.gold);
      v.boxMin(Math.min(cx, cx + sx * 0.3), h - 0.05, Z1 - 0.3, Math.max(cx, cx + sx * 0.3), h + 0.02, Z1 + 0.1, PALETTE.gold);
    }
  };
  /** A bookmark ribbon over the top edge, hanging down the spine with a forked tail. */
  const ribbon = (x, h, len, c) => {
    v.boxMin(x - 0.1, h - 0.11, -0.4, x + 0.1, h - 0.08, Z1 + 0.13, c);
    v.boxMin(x - 0.1, h - len, Z1 + 0.1, x + 0.1, h - 0.08, Z1 + 0.13, c);
    for (const sx of [-1, 1]) v.box(x + sx * 0.055, h - len - 0.1, Z1 + 0.115, 0.08, 0.2, 0.03, c);
  };
  book(-3.7, -2.05, 6.3, PALETTE.maroon);
  book(-1.95, 1.95, 7.4, '#5A3A28', false);
  book(2.05, 4.45, 6.8, '#2F5A4C');
  // Middle book: arched door, star plates, clapperboard sign.
  door(v, 0, 0.35, Z1 + 0.06, { w: 1.4, h: 2.3, panel: '#3B2418', frame: PALETTE.gold });
  for (const sx of [-1, 1]) sparkle(v, sx * 1.35, 5.9, Z1 + 0.1, 0.45);
  v.boxMin(-1.85, 2.95, Z1 + 0.06, 1.85, 4.55, Z1 + 0.2, '#2B2522');
  v.boxMin(-1.85, 4.55, Z1 + 0.04, 1.85, 4.9, Z1 + 0.22, PALETTE.cream);
  for (let i = 0; i < 6; i++) v.boxMin(-1.75 + i * 0.62, 4.58, Z1 + 0.2, -1.45 + i * 0.62, 4.87, Z1 + 0.24, PALETTE.ink);
  v.box(-1.78, 4.98, Z1 + 0.13, 0.22, 0.22, 0.24, PALETTE.gold); // hinge
  // The clapper arm (animated): hinged at its west end.
  const clap = new VoxelBuilder();
  clap.boxMin(0, -0.02, -0.09, 3.7, 0.34, 0.09, PALETTE.cream);
  for (let i = 0; i < 6; i++) clap.boxMin(0.12 + i * 0.62, 0.0, 0.08, 0.42 + i * 0.62, 0.32, 0.12, PALETTE.ink);
  // Director's chair in front of the thin book.
  const cx = -2.9, cz = 3.3;
  for (const sx of [-1, 1]) {
    boxR(v, cx + sx * 0.32, 0.45, cz, 0.08, 0.9, 0.08, PALETTE.wood, 0.0, 0, sx * 0.3);
    v.box(cx + sx * 0.36, 1.05, cz - 0.22, 0.08, 1.0, 0.08, PALETTE.wood);
  }
  v.box(cx, 0.72, cz, 0.78, 0.08, 0.5, PALETTE.maroon);
  v.box(cx, 1.3, cz - 0.24, 0.76, 0.34, 0.06, PALETTE.maroon);
  v.box(cx, 0.9, cz + 0.02, 0.86, 0.06, 0.06, PALETTE.woodDark);
  v.box(cx, 1.3, cz - 0.205, 0.4, 0.12, 0.02, PALETTE.gold);
  // Bookmark ribbons, shelf trim, a red carpet with gold stanchions up to the door.
  ribbon(-2.5, 6.3, 1.5, PALETTE.gold);
  ribbon(3.75, 6.8, 1.9, PALETTE.maroon);
  ribbon(1.45, 7.4, 1.1, '#E7C46A');
  for (let x = -3.9; x < 4.7; x += 0.55) v.box(x, 0.12, 2.44, 0.06, 0.06, 0.02, PALETTE.goldDeep);
  v.boxMin(-0.62, 0.35, Z1 + 0.06, 0.62, 0.37, 2.4, PALETTE.boxRed);
  v.boxMin(-0.62, 0.0, 2.4, 0.62, 0.37, 2.47, PALETTE.boxRed);
  v.boxMin(-0.62, 0.0, 2.47, 0.62, 0.025, 3.15, PALETTE.boxRed);
  for (const sx of [-1, 1]) {
    v.boxMin(sx * 0.62 - 0.04, 0.0, 2.47, sx * 0.62 + 0.04, 0.03, 3.15, PALETTE.gold);
    for (const pz of [2.62, 3.08]) {
      v.box(sx * 0.95, 0.04, pz, 0.24, 0.08, 0.24, PALETTE.goldDeep);
      v.box(sx * 0.95, 0.46, pz, 0.07, 0.8, 0.07, PALETTE.gold);
      v.box(sx * 0.95, 0.9, pz, 0.13, 0.13, 0.13, PALETTE.gold);
    }
    v.box(sx * 0.95, 0.74, 2.85, 0.05, 0.05, 0.42, PALETTE.maroon);
    v.box(sx * 0.95, 0.7, 2.85, 0.05, 0.04, 0.18, PALETTE.maroon);
  }
  // Vintage film camera on a tripod (east) and a studio spotlight (west).
  const fx = 3.5, fz = 2.95;
  for (const [ax, az] of [[-0.3, 0.2], [0.3, 0.2], [0, -0.32]]) boxR(v, fx + ax / 2, 0.55, fz + az / 2, 0.05, 1.12, 0.05, PALETTE.woodDark, az * 0.55, 0, -ax * 0.55);
  v.box(fx, 1.12, fz, 0.2, 0.08, 0.2, PALETTE.ink);
  v.box(fx, 1.36, fz, 0.42, 0.36, 0.56, PALETTE.ink);
  v.box(fx, 1.36, fz + 0.3, 0.2, 0.2, 0.14, '#3A3536');
  v.box(fx, 1.36, fz + 0.38, 0.24, 0.24, 0.04, PALETTE.gold);
  v.box(fx, 1.36, fz + 0.4, 0.13, 0.13, 0.02, PALETTE.skyTop);
  v.box(fx - 0.22, 1.4, fz - 0.1, 0.04, 0.12, 0.12, PALETTE.gold);
  for (const rz of [-0.18, 0.2]) {
    v.add(UNIT_CYL, PALETTE.ink, _m.makeRotationZ(Math.PI / 2).scale(_s.set(0.2, 0.08, 0.2)).setPosition(fx, 1.76, fz + rz));
    v.add(UNIT_CYL, PALETTE.gold, _m.makeRotationZ(Math.PI / 2).scale(_s.set(0.07, 0.1, 0.07)).setPosition(fx, 1.76, fz + rz));
  }
  const sx0 = -3.75, sz0 = 2.75;
  for (const [ax, az] of [[-0.3, 0.2], [0.3, 0.2], [0, -0.32]]) boxR(v, sx0 + ax / 2, 0.6, sz0 + az / 2, 0.05, 1.22, 0.05, PALETTE.ink, az * 0.5, 0, -ax * 0.5);
  v.box(sx0, 1.28, sz0, 0.08, 0.24, 0.08, PALETTE.ink);
  boxR(v, sx0 + 0.1, 1.52, sz0 - 0.06, 0.44, 0.38, 0.44, PALETTE.maroonDeep, -0.35, 0.65, 0);
  boxR(v, sx0 + 0.21, 1.6, sz0 - 0.2, 0.36, 0.3, 0.08, PALETTE.gold, -0.35, 0.65, 0);
  boxR(v, sx0 + 0.235, 1.6, sz0 - 0.23, 0.26, 0.2, 0.06, GLOW, -0.35, 0.65, 0);
  const signs = [signQuad('scripts', 0, 3.75, Z1 + 0.21, 3.4)];
  return { v, signs, clapper: { builder: clap, pos: [-1.8, 4.92, Z1 + 0.13] } };
}

// ---------------------------------------------------------------------------------
// 4. content — café shaped like a giant "Writer" mug; the handle is the entrance arch
// ---------------------------------------------------------------------------------
function buildContent() {
  const v = new VoxelBuilder();
  cyl(v, 0, 0, 0.14, 0, 3.35, PALETTE.goldDeep, 28);
  cyl(v, 0, 0.14, 0.3, 0, 3.2, PALETTE.paper, 28, 3.0);
  cyl(v, 0, 0.3, 4.7, 0, 2.5, MUG, 28, 2.62);
  cyl(v, 0, 0.32, 0.8, 0, 2.535, PALETTE.maroon, 28, 2.55);
  cyl(v, 0, 0.86, 0.95, 0, 2.555, PALETTE.gold, 28, 2.56);
  cyl(v, 0, 4.64, 4.73, 0, 2.47, '#5B3A26', 28);
  const torus = new THREE.TorusGeometry(2.58, 0.13, 6, 36);
  v.add(torus, PALETTE.gold, _m.makeRotationX(Math.PI / 2).setPosition(0, 4.72, 0));
  torus.dispose();
  // Latte-art heart on the coffee (reads from the high camera).
  for (const sx of [-1, 1]) v.box(sx * 0.21, 4.745, -0.14, 0.44, 0.03, 0.44, PALETTE.cream);
  boxR(v, 0, 4.745, 0.13, 0.5, 0.03, 0.5, PALETTE.cream, 0, Math.PI / 4, 0);
  // Handle = entrance arch (cream, protruding toward the camera) with a deep doorway.
  const Z0 = 2.0, Z1 = 3.2;
  for (const sx of [-1, 1]) {
    v.boxMin(sx > 0 ? 0.72 : -1.34, 0.3, Z0, sx > 0 ? 1.34 : -0.72, 2.45, Z1, MUG);
    v.boxMin(sx > 0 ? 0.6 : -1.32, 2.45, Z0, sx > 0 ? 1.32 : -0.6, 2.7, Z1, MUG);
    v.boxMin(sx > 0 ? 0.38 : -1.24, 2.7, Z0, sx > 0 ? 1.24 : -0.38, 2.95, Z1, MUG);
    v.boxMin(sx > 0 ? 0.72 : -0.84, 0.3, Z1 - 0.02, sx > 0 ? 0.84 : -0.72, 2.42, Z1 + 0.05, PALETTE.gold);
  }
  v.boxMin(-1.1, 2.95, Z0, 1.1, 3.28, Z1, MUG);
  v.boxMin(-0.7, 0.3, Z0 + 0.05, 0.7, 2.55, Z0 + 0.42, PALETTE.maroon);
  v.box(0.42, 1.35, Z0 + 0.45, 0.12, 0.12, 0.08, PALETTE.gold);
  v.boxMin(-0.5, 1.55, Z0 + 0.4, 0.5, 2.3, Z0 + 0.45, jitter(PALETTE.maroon, 0.18, 3));
  v.boxMin(-0.85, 0.3, Z0 + 0.4, 0.85, 0.36, Z1 + 0.35, PALETTE.wood); // doormat/step
  v.boxMin(-1.36, 2.4, Z1, 1.36, 3.43, Z1 + 0.08, PALETTE.gold); // sign board on the arch
  // Café table with an umbrella and two stools (east side of the saucer).
  const tx = 3.9, tz = 1.4;
  cyl(v, tx, 0, 0.74, tz, 0.07, PALETTE.woodDark, 8);
  cyl(v, tx, 0.72, 0.8, tz, 0.5, PALETTE.gold, 16);
  v.box(tx, 1.5, tz, 0.06, 1.5, 0.06, PALETTE.cream);
  cyl(v, tx, 2.2, 2.38, tz, 1.15, PALETTE.maroon, 8, 0.85);
  cyl(v, tx, 2.38, 2.54, tz, 0.85, PALETTE.cream, 8, 0.42);
  cyl(v, tx, 2.54, 2.64, tz, 0.42, PALETTE.maroon, 8, 0.12);
  cyl(v, tx, 0.8, 0.83, tz, 0.44, PALETTE.cream, 16);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    boxR(v, tx + Math.cos(a) * 1.0, 2.3, tz + Math.sin(a) * 1.0, 0.08, 0.16, 0.08, i % 2 ? PALETTE.gold : PALETTE.cream, 0, -a, 0);
  }
  // Two café chairs with slatted backs, facing the table; a cup and saucer on top.
  for (const [sx, sz] of [[-0.68, 0.48], [0.66, -0.52]]) {
    const ry = Math.atan2(-sx, -sz);
    const c = new VoxelBuilder();
    c.box(0, 0.45, 0, 0.44, 0.06, 0.42, PALETTE.maroon);
    for (const lx of [-1, 1]) for (const lz of [-1, 1]) c.box(lx * 0.17, 0.21, lz * 0.16, 0.05, 0.42, 0.05, PALETTE.gold);
    for (const lx of [-1, 1]) c.box(lx * 0.17, 0.72, -0.18, 0.05, 0.54, 0.05, PALETTE.gold);
    for (const y of [0.62, 0.78, 0.92]) c.box(0, y, -0.18, 0.36, 0.07, 0.04, PALETTE.wood);
    v.merge(c, _m.compose(_p.set(tx + sx, 0, tz + sz), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(1, 1, 1)));
  }
  cyl(v, tx - 0.1, 0.83, 0.86, tz + 0.1, 0.16, PALETTE.white, 10);
  cyl(v, tx - 0.1, 0.86, 1.02, tz + 0.1, 0.08, PALETTE.white, 10, 0.1);
  // Saucer: gold rim line, a gold spoon, sugar cubes and coffee beans.
  const ringGeo = new THREE.TorusGeometry(3.08, 0.04, 4, 40);
  v.add(ringGeo, PALETTE.gold, _m.makeRotationX(Math.PI / 2).setPosition(0, 0.3, 0));
  ringGeo.dispose();
  cyl(v, 0, 3.3, 3.36, 0, 2.5 + 3.0 * 0.0273 + 0.016, PALETTE.gold, 28);
  const onSaucer = (deg, r) => [Math.cos((deg * Math.PI) / 180) * r, Math.sin((deg * Math.PI) / 180) * r];
  {
    const a = (158 * Math.PI) / 180, [sx, sz] = onSaucer(158, 2.78), ry = Math.atan2(-Math.cos(a), -Math.sin(a));
    const sp = new VoxelBuilder();
    sp.box(0, 0, 0, 1.15, 0.05, 0.12, PALETTE.gold);
    sp.box(0.62, 0.02, 0, 0.36, 0.07, 0.28, PALETTE.gold);
    sp.box(0.62, 0.05, 0, 0.24, 0.03, 0.18, shade(PALETTE.gold, 0.8));
    sp.box(-0.58, 0.01, 0, 0.12, 0.06, 0.16, PALETTE.goldDeep);
    v.merge(sp, _m.compose(_p.set(sx, 0.35, sz), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(1, 1, 1)));
  }
  for (const [deg, r, s] of [[128, 2.8, 0.24], [135, 2.72, 0.2]]) {
    const [sx, sz] = onSaucer(deg, r);
    v.box(sx, 0.3 + s / 2, sz, s, s, s, PALETTE.white, deg * 0.05);
  }
  for (let i = 0; i < 7; i++) {
    const [bx, bz] = onSaucer(188 + i * 5, 2.66 + (i % 3) * 0.1);
    v.box(bx, 0.34, bz, 0.12, 0.08, 0.17, '#5B3A26', i * 0.9);
    v.box(bx, 0.385, bz, 0.03, 0.012, 0.12, '#3A2418', i * 0.9);
  }
  // Round-topped windows on the mug wall (each built facing +Z, then turned onto the curve).
  for (const deg of [35, 145]) {
    const w = new VoxelBuilder();
    win(w, 0, 0, 0, 0.66, 0.78, { frame: PALETTE.cream, curtain: PALETTE.rose });
    blockDisc(w, 0, 0.47, 0.01, 0.42, 0.08, PALETTE.gold, 0.07, true);
    blockDisc(w, 0, 0.47, 0.04, 0.32, 0.06, PALETTE.skyTop, 0.07, true);
    flowerBox(w, 0, -0.8, 0.04, 0.8, deg > 90 ? 2 : 3);
    const [wx, wz] = onSaucer(deg, 2.57);
    v.merge(w, _m.compose(_p.set(wx, 1.6, wz), _q.setFromEuler(_e.set(0, Math.PI / 2 - (deg * Math.PI) / 180, 0)), _s.set(1, 1, 1)));
  }
  // A-frame chalk menu and flower pots beside the arch.
  {
    const af = new VoxelBuilder(), face = new VoxelBuilder();
    for (const s of [-1, 1]) boxR(af, 0, 0.46, s * 0.11, 0.6, 0.9, 0.05, PALETTE.wood, -s * 0.24, 0, 0);
    face.box(0, 0, 0.035, 0.5, 0.76, 0.02, '#2F3A33');
    for (let i = 0; i < 4; i++) face.box(-0.05 + (i % 2) * 0.04, 0.2 - i * 0.15, 0.05, 0.3 - (i % 2) * 0.1, 0.03, 0.012, PALETTE.white);
    face.box(0, 0.3, 0.05, 0.12, 0.08, 0.012, PALETTE.rose);
    af.merge(face, _m.compose(_p.set(0, 0.46, 0.11), _q.setFromEuler(_e.set(-0.24, 0, 0)), _s.set(1, 1, 1)));
    v.merge(af, _m.makeTranslation(2.1, 0, 3.0));
  }
  pot(v, -1.62, 0.3, 2.3, 1.0, PALETTE.gold);
  pot(v, 1.55, 0.3, 2.22, 0.8, PALETTE.rose);
  const label = toSlot(new THREE.CylinderGeometry(2.635, 2.62, 1.05, 18, 1, true, -0.53, 1.06), 'mug');
  label.translate(0, 4.0, 0);
  const signs = [signQuad('content', 0, 2.915, Z1 + 0.09, 2.62), label];
  return { v, signs, steam: [0, 4.75, 0] };
}

// ---------------------------------------------------------------------------------
// 5. library — a giant upright "Reality Check" book (its real cover) + a small entrance wing
// ---------------------------------------------------------------------------------
function buildLibrary() {
  const v = new VoxelBuilder();
  // The front board is shaped to the real cover (600 x 921), which covers it edge to edge.
  const x0 = -3.1, ZB = 0.3, ZF = 2.1, H = 6.65;
  const x1 = x0 + ((H - 0.25) * ART_SIZE.book[0]) / ART_SIZE.book[1];
  const LEATHER = '#5A1A24', BOARD = '#C9622F';
  v.boxMin(-3.45, 0, -2.2, 3.85, 0.25, 2.45, STONE);
  v.boxMin(x0, 0.25, ZB, x1, H, ZB + 0.15, LEATHER);
  v.boxMin(x0 + 0.05, 0.3, ZB + 0.15, x1 - 0.12, H - 0.15, ZF - 0.15, PALETTE.paper);
  v.boxMin(x0, 0.25, ZF - 0.15, x1, H, ZF, BOARD);
  v.boxMin(x0 - 0.22, 0.25, ZB, x0, H, ZF, LEATHER);
  for (const y of [0.9, H - 1.15, H - 0.75]) v.boxMin(x0 - 0.26, y, ZB - 0.02, x0, y + 0.14, ZF + 0.02, PALETTE.gold); // spine bands stop at the cover
  for (let i = 1; i < 5; i++) v.boxMin(x1 - 0.13, 0.5, ZB + 0.15 + i * 0.3, x1 - 0.1, H - 0.35, ZB + 0.18 + i * 0.3, PALETTE.parchment);
  v.boxMin(x0 + 0.25, H - 0.151, ZB + 0.6, x1 - 0.3, H - 0.14, ZB + 0.66, PALETTE.parchment);
  const art = [{ key: 'book', geo: artQuad('book', (x0 + x1) / 2, (0.25 + H) / 2, ZF + ART_LIFT, x1 - x0) }];
  // Entrance wing (east) with the door and the sign; it starts where the book ends and its
  // roof never reaches over the cover.
  const wx0 = x1, wx1 = 3.6, WZ0 = -1.7, WZ1 = 1.85, WH = 3.55;
  v.boxMin(wx0, 0.25, WZ0, wx1, WH, WZ1, PALETTE.cream);
  v.boxMin(wx1 - 0.13, 0.25, WZ1 - 0.13, wx1 + 0.13, WH, WZ1 + 0.06, PALETTE.wood);
  for (let i = 0; i < 3; i++) v.boxMin(wx0, WH + i * 0.28, WZ0 - 0.25, wx1 + 0.3 - i * 0.62, WH + (i + 1) * 0.28, WZ1 + 0.3, jitter(PALETTE.maroon, 0.05, i));
  door(v, 2.42, 0.25, WZ1, { w: 1.4, h: 2.3, panel: PALETTE.maroon });
  v.boxMin(1.42, 2.68, WZ1 - 0.02, 3.42, 3.46, WZ1 + 0.07, PALETTE.woodDark);
  sideWin(v, wx1, 1, 1.2, 2.3, -0.9, 0.5);
  // Wing details: tiled roof steps with gold drip lines, darker base course, side seams,
  // a lantern and a book-return box by the door, a potted plant.
  for (let i = 0; i < 3; i++) {
    const ex = wx1 + 0.3 - i * 0.62, inner = i < 2 ? ex - 0.62 : wx0, y = WH + (i + 1) * 0.28;
    if (i < 2) tiles(v, inner - 0.02, WZ0 - 0.27, ex + 0.02, WZ1 + 0.32, y, PALETTE.maroon, 'z', 0.46, i);
    else for (let c = 0; c < 3; c++) tiles(v, inner + c * ((ex - inner) / 3) + 0.02, WZ0 - 0.27, inner + (c + 1) * ((ex - inner) / 3) - 0.02, WZ1 + 0.32, y, PALETTE.maroon, 'z', 0.46, c + 3);
    v.boxMin(wx0, WH + i * 0.28, WZ1 + 0.3, ex, WH + i * 0.28 + 0.05, WZ1 + 0.35, PALETTE.gold);
  }
  v.boxMin(wx0, 0.25, WZ1 - 0.01, wx1, 0.45, WZ1 + 0.015, shade(PALETTE.cream, 0.86));
  v.boxMin(wx1, 0.25, WZ0, wx1 + 0.015, 0.45, WZ1, shade(PALETTE.cream, 0.86));
  seamsX(v, wx1, WZ0 + 0.05, WZ1 - 0.15, [0.7, 2.75, 3.1], 1, shade(PALETTE.cream, 0.84));
  seamsX(v, wx1, WZ0 + 0.05, -1.05, [0.95, 1.2, 1.45, 1.7, 1.95, 2.2, 2.45], 1, shade(PALETTE.cream, 0.84));
  seamsX(v, wx1, 0.65, WZ1 - 0.15, [0.95, 1.2, 1.45, 1.7, 1.95, 2.2, 2.45], 1, shade(PALETTE.cream, 0.84));
  wallLantern(v, 1.45, 2.0, WZ1 - 0.04, 0.9);
  v.box(1.45, 0.6, WZ1 + 0.24, 0.42, 0.7, 0.38, PALETTE.maroon);
  v.box(1.45, 0.98, WZ1 + 0.24, 0.48, 0.08, 0.44, PALETTE.gold);
  v.box(1.45, 0.78, WZ1 + 0.44, 0.28, 0.05, 0.02, PALETTE.ink);
  v.box(1.45, 0.58, WZ1 + 0.44, 0.16, 0.16, 0.02, PALETTE.gold);
  pot(v, 3.62, 0.25, WZ1 + 0.22, 0.85, PALETTE.gold);
  // A little stack of books by the door (with page edges and a ribbon).
  const bc = [PALETTE.boxBlue, PALETTE.gold, PALETTE.maroon];
  for (let i = 0; i < 3; i++) {
    v.box(3.2 + (i % 2) * 0.05, 0.31 + i * 0.13, WZ1 + 0.55, 0.5 - i * 0.05, 0.12, 0.36, bc[i]);
    v.box(3.2 + (i % 2) * 0.05 + 0.02, 0.31 + i * 0.13, WZ1 + 0.55, 0.44 - i * 0.05, 0.09, 0.37, PALETTE.paper);
  }
  v.box(3.25, 0.64, WZ1 + 0.74, 0.06, 0.3, 0.02, PALETTE.maroon);
  // Book top: page edges.
  for (let z = ZB + 0.3; z < ZF - 0.2; z += 0.15) v.boxMin(x0 + 0.12, H - 0.155, z - 0.012, x1 - 0.18, H - 0.142, z + 0.012, PALETTE.parchment);
  const signs = [signQuad('library', 2.42, 3.07, WZ1 + 0.08, 1.95)];
  return { v, signs, art };
}

// ---------------------------------------------------------------------------------
// 6. contact — post office with mail slots + a tall spiral paper-plane tower with a beacon
// ---------------------------------------------------------------------------------
function buildContact(plane) {
  const v = new VoxelBuilder();
  const x0 = -3.8, x1 = 0.6, D = 2.1, H = 3.7;
  v.boxMin(x0 - 0.15, 0, -D - 0.15, x1 + 0.15, 0.22, D + 0.15, STONE);
  v.boxMin(x0, 0.22, -D, x1, H, D, PALETTE.cream);
  for (const x of [x0, x1]) v.boxMin(x - 0.14, 0.22, D - 0.1, x + 0.14, H, D + 0.08, PALETTE.maroon);
  v.boxMin(x0, 0.22, D - 0.02, -3.54, 0.62, D + 0.05, PALETTE.maroon);
  v.boxMin(-1.86, 0.22, D - 0.02, x1, 0.62, D + 0.05, PALETTE.maroon);
  door(v, -2.7, 0.22, D, { w: 1.4, h: 2.3, panel: '#2F6E9E' });
  for (const y of [1.45, 1.98]) {
    for (const x of [-1.45, -0.8, -0.15]) {
      v.boxMin(x - 0.27, y - 0.13, D - 0.02, x + 0.27, y + 0.13, D + 0.07, PALETTE.gold);
      v.boxMin(x - 0.2, y - 0.04, D + 0.06, x + 0.2, y + 0.04, D + 0.08, PALETTE.ink);
    }
  }
  v.boxMin(-2.32, 2.6, D - 0.02, 0.42, 3.62, D + 0.07, PALETTE.gold);
  // Stepped hip roof in maroon with a gold eave.
  v.boxMin(x0 - 0.3, H, -D - 0.3, x1 + 0.3, H + 0.3, D + 0.36, PALETTE.maroon);
  v.boxMin(x0 - 0.02, H + 0.3, -D, x1 + 0.02, H + 0.6, D + 0.06, jitter(PALETTE.maroon, 0.05, 2));
  v.boxMin(x0 + 0.3, H + 0.6, -D + 0.3, x1 - 0.3, H + 0.9, D - 0.24, jitter(PALETTE.maroon, 0.05, 3));
  v.boxMin(x0 + 0.65, H + 0.9, -D + 0.65, x1 - 0.65, H + 1.08, D - 0.6, PALETTE.maroonDeep);
  v.boxMin(x0 - 0.33, H - 0.07, D + 0.3, x1 + 0.33, H + 0.04, D + 0.42, PALETTE.gold);
  v.merge(plane, _m.compose(_p.set(-1.6, H + 1.38, 0.2), _q.setFromEuler(_e.set(-0.25, Math.PI / 2, 0, 'YXZ')), _s.set(1.3, 1.3, 1.3)));
  v.box(-1.6, H + 1.12, 0.2, 0.06, 0.12, 0.06, PALETTE.goldDeep);
  // Pillar mailbox in front of the slots.
  cyl(v, -1.15, 0, 1.0, 2.85, 0.3, PALETTE.maroon, 12);
  cyl(v, -1.15, 1.0, 1.13, 2.85, 0.36, PALETTE.gold, 12, 0.28);
  v.box(-1.15, 0.8, 3.15, 0.3, 0.06, 0.04, PALETTE.ink);
  v.box(-1.15, 0.45, 3.13, 0.2, 0.2, 0.04, PALETTE.gold);
  // The tower: a slim column wound with a spiral of white paper planes.
  const tx = 3.0;
  v.boxMin(tx - 1.15, 0, -1.15, tx + 1.15, 0.3, 1.15, PALETTE.maroon);
  v.boxMin(tx - 0.9, 0.3, -0.9, tx + 0.9, 0.55, 0.9, PALETTE.gold);
  v.boxMin(tx - 0.45, 0.55, -0.45, tx + 0.45, 10.0, 0.45, PALETTE.cream);
  for (let y = 2.3; y < 9.9; y += 1.9) v.boxMin(tx - 0.53, y, -0.53, tx + 0.53, y + 0.15, 0.53, PALETTE.gold);
  for (let k = 0; k < 12; k++) {
    const a = k * 0.92, y = 1.15 + k * 0.72, r = 0.98;
    _q.setFromEuler(_e.set(-0.22, Math.atan2(-Math.sin(a), Math.cos(a)), 0.35, 'YXZ'));
    v.merge(plane, _m.compose(_p.set(tx + Math.cos(a) * r, y, Math.sin(a) * r), _q, _s.set(1.25, 1.25, 1.25)));
  }
  v.boxMin(tx - 0.78, 10.0, -0.78, tx + 0.78, 10.16, 0.78, PALETTE.gold);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(tx + sx * 0.64, 10.6, sz * 0.64, 0.13, 0.9, 0.13, PALETTE.gold);
  v.boxMin(tx - 0.84, 11.05, -0.84, tx + 0.84, 11.3, 0.84, PALETTE.maroon);
  v.boxMin(tx - 0.52, 11.3, -0.52, tx + 0.52, 11.55, 0.52, jitter(PALETTE.maroon, 0.06, 4));
  v.boxMin(tx - 0.2, 11.55, -0.2, tx + 0.2, 11.85, 0.2, PALETTE.gold);
  // Tiled roof steps (front rows along x, side rows along z).
  const RL = [[-4.1, 0.9, -2.4, 2.46, H + 0.3], [-3.82, 0.62, -2.1, 2.16, H + 0.6], [-3.5, 0.3, -1.8, 1.86, H + 0.9]];
  RL.forEach(([ax, bx, az, bz, y], i) => {
    const nx = i < 2 ? RL[i + 1] : [-3.15, -0.05, -1.45, 1.5];
    tiles(v, ax, nx[3] - 0.02, bx, bz + 0.02, y, PALETTE.maroon, 'x', 0.44, i * 3);
    tiles(v, ax - 0.02, az, nx[0] + 0.02, nx[3], y, PALETTE.maroon, 'z', 0.46, i * 3 + 1);
    tiles(v, nx[1] - 0.02, az, bx + 0.02, nx[3], y, PALETTE.maroon, 'z', 0.46, i * 3 + 2);
  });
  // Darker base course, side seams, a west window; a "stamp" edge round the sign board.
  v.boxMin(x0, 0.62, D - 0.01, x1, 0.74, D + 0.015, shade(PALETTE.cream, 0.86));
  for (const [x, sx] of [[x0, -1], [x1, 1]]) {
    v.boxMin(Math.min(x, x + sx * 0.015), 0.22, -D, Math.max(x, x + sx * 0.015), 0.5, D - 0.12, shade(PALETTE.cream, 0.86));
    seamsX(v, x, -D + 0.05, D - 0.16, [0.8, 2.75, 3.05, 3.35], sx, shade(PALETTE.cream, 0.84));
    seamsX(v, x, -D + 0.05, -1.05, [1.1, 1.4, 1.7, 2.0, 2.3], sx, shade(PALETTE.cream, 0.84));
    seamsX(v, x, 0.65, D - 0.16, [1.1, 1.4, 1.7, 2.0, 2.3], sx, shade(PALETTE.cream, 0.84));
  }
  sideWin(v, x0, -1, 1.25, 2.4, -0.9, 0.5);
  sideWin(v, x1, 1, 1.25, 2.4, -0.9, 0.5);
  for (let x = -2.3; x <= 0.42; x += 0.17) for (const y of [2.555, 3.665]) v.box(x, y, D + 0.02, 0.09, 0.05, 0.06, PALETTE.goldDeep);
  for (let y = 2.66; y <= 3.6; y += 0.17) for (const x of [-2.365, 0.465]) v.box(x, y, D + 0.02, 0.05, 0.09, 0.06, PALETTE.goldDeep);
  // Parcels stacked by the door, a postie's bicycle with a basket of letters.
  parcel(v, -1.76, 0, D + 0.45, 0.42, 0.34, 0.38, 0.1);
  parcel(v, -1.8, 0.34, D + 0.44, 0.3, 0.24, 0.28, -0.2);
  {
    const bk = new VoxelBuilder();
    const tor = new THREE.TorusGeometry(0.3, 0.035, 5, 14);
    for (const wx of [-0.42, 0.42]) {
      bk.add(tor, PALETTE.ink, _m.makeTranslation(wx, 0.33, 0));
      bk.box(wx, 0.33, 0, 0.08, 0.08, 0.06, PALETTE.gold);
    }
    tor.dispose();
    boxR(bk, -0.2, 0.52, 0, 0.5, 0.05, 0.05, '#2F6E9E', 0, 0, 0.55);
    boxR(bk, 0.12, 0.5, 0, 0.62, 0.05, 0.05, '#2F6E9E', 0, 0, -0.45);
    bk.box(0.0, 0.66, 0, 0.62, 0.05, 0.05, '#2F6E9E');
    boxR(bk, 0.36, 0.54, 0, 0.05, 0.5, 0.05, '#2F6E9E', 0, 0, -0.3);
    bk.box(-0.24, 0.8, 0, 0.22, 0.06, 0.14, PALETTE.ink);
    bk.box(0.42, 0.88, 0, 0.05, 0.05, 0.5, PALETTE.ink);
    bk.box(0.56, 0.74, 0, 0.28, 0.2, 0.3, PALETTE.wood);
    for (let i = 0; i < 3; i++) boxR(bk, 0.52 + i * 0.05, 0.88, -0.06 + i * 0.06, 0.04, 0.16, 0.2, i % 2 ? PALETTE.white : PALETTE.cream, 0, 0, 0.25 - i * 0.2);
    v.merge(bk, _m.makeTranslation(0.14, 0, D + 0.42));
  }
  // Tower: little windows between the rings, a door at its foot.
  for (const y of [3.2, 5.1, 7.0, 8.9]) {
    v.boxMin(tx - 0.16, y - 0.3, 0.44, tx + 0.16, y + 0.3, 0.48, PALETTE.skyTop);
    v.boxMin(tx - 0.22, y - 0.36, 0.43, tx + 0.22, y - 0.3, 0.52, PALETTE.gold);
    v.boxMin(tx - 0.22, y + 0.3, 0.43, tx + 0.22, y + 0.36, 0.52, PALETTE.gold);
    v.boxMin(tx - 0.03, y - 0.3, 0.46, tx + 0.03, y + 0.3, 0.5, PALETTE.gold);
  }
  v.boxMin(tx - 0.3, 0.55, 0.44, tx + 0.3, 1.5, 0.5, PALETTE.maroon);
  v.boxMin(tx - 0.36, 1.5, 0.43, tx + 0.36, 1.58, 0.53, PALETTE.gold);
  v.box(tx + 0.18, 1.0, 0.52, 0.06, 0.06, 0.04, PALETTE.gold);
  const signs = [signQuad('contact', -0.95, 3.11, D + 0.08, 2.62)];
  return { v, signs, glows: [[tx, 10.6, 0, 0.9]], beacon: [tx, 12.65, 0], tower: [tx, 0, 0] };
}

// ---------------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------------
/**
 * Builds the six landmarks. Returns:
 *   group                      Group holding one child Group per landmark (origin on the ground)
 *   list                       [{ id, group, center, door, labelAnchor, tapRadius }] (world space)
 *   glows                      [{ position: Vector3, size }] unlit lantern cores for world.js
 *   beacon                     Vector3, top of the paper-plane tower (world.js puts a sparkle there)
 *   makeSign(key, width)       extra sign Mesh from the shared atlas (e.g. 'welcome')
 *   update(dt, t)              weathervane, clapper, steam puffs, circling paper planes
 *   ready                      Promise, resolves once signs are redrawn with the web fonts
 *   dispose()
 */
export function createLandmarks() {
  const group = new THREE.Group();
  group.name = 'landmarks';
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = ATLAS;
  drawAtlas(canvas);
  const atlas = new THREE.CanvasTexture(canvas);
  atlas.colorSpace = THREE.SRGBColorSpace;
  atlas.anisotropy = 4;
  const signMat = basic(PALETTE.white, { map: atlas, transparent: true, alphaTest: 0.04 });
  const planeBuilder = paperPlaneBuilder();
  const planeGeo = planeBuilder.geometry();
  const builders = { about: buildAbout, templates: buildTemplates, scripts: buildScripts, content: buildContent, library: buildLibrary, contact: () => buildContact(planeBuilder) };

  const list = [];
  const glows = [];
  const artPanels = [];
  let beacon = null;
  let vane = null, clapper = null, steam = null, smoke = null, planes = null, towerPos = null;
  // Soft blocky puffs (a box crossed with a wider, flatter one), same lifted white as the clouds;
  // shared by the café steam and the cottage chimney smoke.
  const puff = new VoxelBuilder();
  puff.box(0, 0, 0, 1, 0.74, 0.9, PALETTE.white);
  puff.box(0, -0.06, 0, 1.3, 0.48, 0.62, '#F7EFF2');
  const steamGeo = puff.geometry();
  const puffMat = toon('#ffffff', { vertexColors: true, emissive: '#FFF6F0', emissiveIntensity: 0.2 });

  for (const L of LANDMARKS) {
    const g = new THREE.Group();
    g.name = `landmark-${L.id}`;
    g.position.set(L.x, 0, L.z);
    group.add(g);
    const b = builders[L.id]();
    const body = b.v.mesh({ outline: true, px: 1.6 });
    body.name = `${L.id}-body`;
    g.add(body);
    const sign = new THREE.Mesh(mergeGeometries(b.signs, false), signMat);
    for (const s of b.signs) s.dispose();
    sign.name = `${L.id}-sign`;
    g.add(sign);
    for (const a of b.art || []) {
      const panel = artPanel(a.key, a.geo);
      g.add(panel);
      artPanels.push(panel);
    }
    if (b.vane) {
      vane = b.vane.builder.mesh({ outline: true, px: 1.3 });
      vane.position.set(...b.vane.pos);
      g.add(vane);
    }
    if (b.clapper) {
      clapper = b.clapper.builder.mesh({ outline: true, px: 1.4 });
      clapper.position.set(...b.clapper.pos);
      g.add(clapper);
    }
    if (b.steam) {
      steam = new THREE.InstancedMesh(steamGeo, puffMat, 9);
      steam.frustumCulled = false;
      steam.position.set(...b.steam);
      g.add(steam);
    }
    if (b.smoke) {
      smoke = new THREE.InstancedMesh(steamGeo, puffMat, 5);
      smoke.frustumCulled = false;
      smoke.position.set(...b.smoke);
      g.add(smoke);
    }
    if (b.tower) {
      towerPos = b.tower;
      planes = new THREE.InstancedMesh(planeGeo, toon('#ffffff', { vertexColors: true }), 5);
      planes.frustumCulled = false;
      g.add(planes);
      addOutline(planes, { px: 1.2 });
    }
    for (const [x, y, z, size] of b.glows || []) glows.push({ position: new THREE.Vector3(L.x + x, y, L.z + z), size, group: g, local: new THREE.Vector3(x, y, z) });
    if (b.beacon) {
      beacon = new THREE.Vector3(L.x + b.beacon[0], b.beacon[1], L.z + b.beacon[2]);
      beacon.group = g;
    }
    list.push({
      id: L.id,
      group: g,
      center: new THREE.Vector3(L.x, 0, L.z),
      door: new THREE.Vector3(L.door[0], 0, L.door[1]),
      labelAnchor: L.label ? new THREE.Vector3(...L.label) : new THREE.Vector3(L.x, L.top + 1.0, L.z),
      tapRadius: L.tap,
    });
  }

  // If the web fonts were not ready yet, redraw the signs once they are.
  const fontsWereReady = !document.fonts || (document.fonts.check('700 32px "Noto Sans Myanmar"', 'မာရာ') && document.fonts.check('600 32px "Cormorant Garamond"', 'Maya'));
  const ready = fontsWereReady
    ? Promise.resolve()
    : fontsReady().then(() => {
        drawAtlas(canvas);
        atlas.needsUpdate = true;
      });

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  const backOut = (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2);

  return {
    group,
    list,
    glows,
    beacon,
    ready,
    /** Extra sign mesh from the shared atlas (keys: about, templates, scripts, content, library, contact, welcome). */
    makeSign(key, width) {
      return new THREE.Mesh(signQuad(key, 0, 0, 0, width), signMat);
    },
    update(dt, t) {
      if (vane) vane.rotation.y = Math.sin(t * 0.6) * 0.9 + Math.sin(t * 1.7 + 1) * 0.25;
      if (clapper) {
        // Clap every 5 s: snap shut (anticipation), then spring back open with overshoot.
        const ph = (t % 5) / 5;
        let a = 0.3;
        if (ph > 0.78 && ph < 0.83) a = 0.3 + 0.08 * Math.sin(((ph - 0.78) / 0.05) * Math.PI); // wind-up
        else if (ph >= 0.83 && ph < 0.86) a = 0.38 * (1 - (ph - 0.83) / 0.03);
        else if (ph >= 0.86 && ph < 0.89) a = 0;
        else if (ph >= 0.89) a = 0.3 * backOut(Math.min(1, (ph - 0.89) / 0.09));
        clapper.rotation.z = a;
      }
      if (steam) {
        for (let i = 0; i < 9; i++) {
          const ph = (t * 0.3 + i / 9) % 1;
          const ox = Math.cos(i * 2.4) * 1.05, oz = Math.sin(i * 2.4) * 0.9;
          p.set(ox + ph * 0.9 + Math.sin(t * 0.9 + i * 2.1) * 0.18, ph * 3.4, oz + Math.cos(t * 0.7 + i) * 0.12);
          const s = (0.2 + 0.7 * Math.sin(Math.PI * Math.pow(ph, 0.8))) * (i % 3 === 0 ? 1.25 : 0.9);
          q.setFromEuler(e.set(0, ph * 0.9 + i, Math.sin(t + i) * 0.15));
          steam.setMatrixAt(i, m4.compose(p, q, sc.set(s, s, s)));
        }
        steam.instanceMatrix.needsUpdate = true;
      }
      if (smoke) {
        // Chimney smoke: small puffs rise, drift east, swell and shrink away.
        for (let i = 0; i < 5; i++) {
          const ph = (t * 0.2 + i / 5) % 1;
          p.set(ph * 1.2 + Math.sin(t * 0.8 + i * 1.7) * 0.08, ph * 1.6, -ph * 0.2);
          const s = 0.1 + 0.36 * Math.sin(Math.PI * Math.pow(ph, 0.65));
          q.setFromEuler(e.set(0, i * 1.3 + ph, 0));
          smoke.setMatrixAt(i, m4.compose(p, q, sc.set(s, s, s)));
        }
        smoke.instanceMatrix.needsUpdate = true;
      }
      if (planes) {
        for (let i = 0; i < 5; i++) {
          const r = 2.2 + (i % 3) * 0.6, a = t * (0.5 + i * 0.06) + i * 1.3;
          p.set(towerPos[0] + Math.cos(a) * r, 5.6 + i * 1.05 + Math.sin(t * 1.3 + i) * 0.35, Math.sin(a) * r);
          q.setFromEuler(e.set(-0.08 + Math.sin(t * 1.3 + i) * 0.1, Math.atan2(-Math.sin(a), Math.cos(a)), -0.45, 'YXZ'));
          planes.setMatrixAt(i, m4.compose(p, q, sc.set(1.1, 1.1, 1.1)));
        }
        planes.instanceMatrix.needsUpdate = true;
      }
    },
    dispose() {
      group.traverse((o) => {
        if (o.geometry && o.geometry !== planeGeo && o.geometry !== steamGeo) o.geometry.dispose();
        if (o.isInstancedMesh) o.dispose();
      });
      steamGeo?.dispose();
      planeGeo.dispose();
      atlas.dispose();
      signMat.dispose();
      for (const p of artPanels) disposeArtPanel(p);
    },
  };
}
