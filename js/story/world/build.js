// Builds the open world's chunks from region.js data: ground (paper, rules, roads, decals; one flat
// mesh), buildings and props (one outlined mesh), plus lists of trees, lamp glows and signs that the
// streamer draws with shared instanced meshes. Original blocky art in Maya's palette.
//
//   chunkJob(chunk, ctx)  generator: builds into chunk.ground (Geo) and chunk.solids (one Geo per CELL-square
//                         quarter of the chunk, so the narrow phone view culls what it cannot see), yields after each
//                         item so the streamer can spread the work over frames
//   itemObstacles(item)   keep-out shapes for walking ({ type: 'box' | 'circle' })
//   treeGeo(kind)         Geo of one tree (instanced by the streamer)
import * as THREE from '../../game/three.js';
import { mergeGeometries } from '../../game/three.js';
import { PALETTE } from '../../game/toon.js';
import { jitter } from '../../game/voxel.js';
import { ROAD } from '../../game/world/roads.js';
import { Geo, shade, rng, rgb } from './kit.js';
import { CHUNK, GRID, REGIONS, BRIDGE, ART as REG_ART, PROP as REG_PROP, regionAt, bookDist } from './region.js';

const C = {
  paper: '#F6F1E4', rule: '#C7D7E6', margin: '#E5A9A4', envelope: '#EBDCBF', envLine: '#D8C39C', envDark: '#C9B084',
  edge1: '#F1EAD8', edge2: '#E6DCC3', edge3: '#DCCFB1', cover: '#7A2430', coverDeep: '#5A1820',
  wood: PALETTE.wood, woodD: PALETTE.woodDark, woodL: '#CDA577', gold: PALETTE.gold, goldD: PALETTE.goldDeep,
  maroon: PALETTE.maroon, maroonD: PALETTE.maroonDeep, cream: PALETTE.cream, white: PALETTE.white, ink: PALETTE.ink,
  parch: PALETTE.parchment, leaf: PALETTE.leaf, leafD: PALETTE.leafDark, leafL: '#8DBA6E', terra: '#B5643C', terraL: '#CB7E4E',
  terraD: '#8E4A2C', glass: '#BFD3E0', glassD: '#93AFC4', soil: '#8A6648', brick: '#A0503A', brickD: '#7E3C2B',
  rose: PALETTE.rose, lily: PALETTE.lily, sky: '#9CC3DE', mustard: '#E2B33C', teal: '#4E8C86', shadow: '#E3D8BE', shadowEnv: '#D9C7A2',
  chalk: '#3E4A3F', iron: '#4A3B30', cloud: '#FFFFFF', cloudMid: '#FAF1F2', cloudLow: '#D8CAE2',
};
const ROADTOP = ROAD.top;

// ---------------------------------------------------------------------------------
// Keep-out shapes (walking): buildings are boxes, round things are circles.
// ---------------------------------------------------------------------------------
const R = { padauk: 0.5, rain: 0.55, lamp: 0.22, jars: 0.7, woodpile: 0.7, bikes: 0.6, flowers: 0.45, kiln: 1.6 };
function rotBox(it, w, d, ox = 0, oz = 0) {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const cx = it.x + ox * c + oz * s, cz = it.z - ox * s + oz * c;
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return { type: 'box', minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd };
}
export function itemObstacles(it) {
  switch (it.k) {
    case 'house': return [rotBox(it, it.w - 0.2, it.d - 0.1, 0, -0.05)];
    case 'school': return [rotBox(it, it.w, it.d - 0.2, 0, -0.1), rotBox(it, 1.2, 0.8, -11.6, it.d / 2 + 0.9)];
    case 'snack': return [rotBox(it, it.w, 3.2, 0, -1.0), rotBox(it, it.w - 1.4, 0.7, 0, 1.5)];
    case 'potter': return [rotBox(it, 13.4, it.d - 1.6, -3.6, -0.6), { type: 'circle', x: it.x + 7.2, z: it.z, r: R.kiln }];
    case 'stage': return [rotBox(it, it.w, it.d)];
    case 'pots': return [rotBox(it, it.w, it.d)];
    case 'bench': return [rotBox(it, 1.6, 0.6)];
    case 'fence': return [rotBox(it, it.len, 0.16)];
    case 'hedge': return [rotBox(it, it.len, 0.8)];
    case 'garden': return [rotBox(it, it.w, it.d)];
    case 'laundry': return [{ type: 'circle', x: it.x - it.len / 2, z: it.z, r: 0.15 }, { type: 'circle', x: it.x + it.len / 2, z: it.z, r: 0.15 }];
    case 'stall': return [rotBox(it, 1.4, 0.9)];
    case 'swing': return [rotBox(it, 3.0, 0.5, 0, -0.6), rotBox(it, 0.3, 1.6, -1.45, 0), rotBox(it, 0.3, 1.6, 1.45, 0)];
    case 'seesaw': return [rotBox(it, 3.2, 0.5)];
    case 'slide': return [rotBox(it, 1.0, 3.4)];
    case 'noticeBoard': return [rotBox(it, 1.8, 0.3)];
    case 'pencil': return [rotBox(it, (it.len || 3.2) + 0.3, 0.55)];
    case 'eraser': return [rotBox(it, 1.4, 0.75)];
    case 'clip': return [{ type: 'circle', x: it.x - 0.8 * Math.cos(it.ry || 0), z: it.z + 0.8 * Math.sin(it.ry || 0), r: 0.12 }, { type: 'circle', x: it.x + 0.8 * Math.cos(it.ry || 0), z: it.z - 0.8 * Math.sin(it.ry || 0), r: 0.12 }];
    case 'well': return [rotBox(it, 1.4, 1.4)];
    case 'teaSet': return [rotBox(it, 1.9, 0.6)];
    case 'bookSign': return [rotBox(it, 3.6, 1.6)];
    case 'borderSign': return [{ type: 'circle', x: it.x - 1.6, z: it.z, r: 0.2 }, { type: 'circle', x: it.x + 1.6, z: it.z, r: 0.2 }];
    case 'pageEnd': return [rotBox(it, 9.6, 4.8, 0, 2.0), rotBox(it, 1.4, 1.4, -3.6, 0.6)];
    case 'seal': return [{ type: 'circle', x: it.x, z: it.z, r: 0.65 }];
    case 'parcel': return [{ type: 'circle', x: it.x, z: it.z, r: 0.55 }];
    case 'desk': return [rotBox(it, 1.3, 0.75, 0, -0.1), { type: 'circle', x: it.x - 1.0 * Math.cos(it.ry || 0), z: it.z + 1.0 * Math.sin(it.ry || 0), r: 0.18 }];
    default: {
      // a kind from a district file: its own keep-out shapes, or a radius, or a box from w/d
      const x = REG_ART[it.k] || REG_PROP[it.k];
      if (x?.obstacles) return x.obstacles(it) || [];
      if (x?.r) return [{ type: 'circle', x: it.x, z: it.z, r: x.r * (it.s || 1) }];
      if (x && it.w && it.d) return [rotBox(it, it.w, it.d)];
      return R[it.k] ? [{ type: 'circle', x: it.x, z: it.z, r: R[it.k] * (it.s || 1) }] : [];
    }
  }
}

// ---------------------------------------------------------------------------------
// Trees (instanced): golden padauk, and a broad green rain tree. Built once.
// ---------------------------------------------------------------------------------
export function treeGeo(kind) {
  const g = new Geo({ outline: true, cap: 1200 });
  if (kind === 'padauk') {
    g.box(0, 0.85, 0, 0.32, 1.7, 0.32, '#7A5434');
    g.box(0.12, 1.5, 0.1, 0.14, 0.6, 0.14, '#6B482B', 0.6);
    g.boxR(0.32, 1.9, 0, 0.6, 0.16, 0.16, '#7A5434', 0, 0, 0.6);
    g.boxR(-0.3, 2.0, 0.05, 0.56, 0.16, 0.16, '#7A5434', 0, 0, -0.7);
    const gold = ['#F2C14E', '#E8A93A', '#F7D774', '#EDB548'];
    const blobs = [[0, 2.55, 0, 2.2, 1.0, 2.0], [0.55, 2.35, 0.35, 1.3, 0.8, 1.2], [-0.6, 2.3, -0.2, 1.3, 0.8, 1.3], [0.1, 3.05, -0.1, 1.4, 0.6, 1.3], [-0.25, 2.2, 0.6, 0.9, 0.5, 0.8]];
    blobs.forEach(([x, y, z, w, h, d], i) => g.box(x, y, z, w, h, d, gold[i % 4]));
    g.box(0.1, 2.06, 0.1, 1.9, 0.12, 1.7, '#6F9E5B'); // green underleaf
    for (const [x, z] of [[0.9, 0.2], [-0.95, 0.35], [0.3, 0.95], [-0.2, -0.9], [0.75, -0.6]]) g.box(x, 2.0, z, 0.22, 0.22, 0.22, '#F7D774');
  } else {
    g.box(0, 0.9, 0, 0.36, 1.8, 0.36, '#6B482B');
    g.boxR(0.4, 1.85, 0, 0.8, 0.18, 0.2, '#6B482B', 0, 0, 0.5);
    g.boxR(-0.4, 1.9, 0.1, 0.8, 0.18, 0.2, '#6B482B', 0, 0, -0.5);
    const greens = ['#6F9E5B', '#5E8F4C', '#7FAE66', '#4F7F43'];
    const blobs = [[0, 2.5, 0, 3.0, 0.9, 2.6], [0.9, 2.3, 0.5, 1.5, 0.7, 1.4], [-1.0, 2.3, -0.3, 1.5, 0.7, 1.5], [0.2, 3.0, 0, 2.0, 0.55, 1.8], [-0.3, 2.25, 0.9, 1.2, 0.5, 0.8]];
    blobs.forEach(([x, y, z, w, h, d], i) => g.box(x, y, z, w, h, d, greens[i % 4]));
    for (const [x, z] of [[1.2, -0.4], [-1.3, 0.5], [0.4, 1.1]]) g.box(x, 2.75, z, 0.24, 0.2, 0.24, '#F2A3B0'); // pink puffs
  }
  return g;
}

// ---------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------
function lamp(g, ctx) {
  g.box(0, 0.12, 0, 0.42, 0.24, 0.42, C.maroonD);
  g.box(0, 0.3, 0, 0.3, 0.14, 0.3, C.gold);
  g.box(0, 1.45, 0, 0.12, 2.2, 0.12, C.goldD);
  g.box(0, 2.4, 0, 0.2, 0.08, 0.2, C.gold);
  g.box(0, 2.62, 0, 0.38, 0.06, 0.38, C.maroon);
  for (const [dx, dz] of [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]]) g.box(dx, 2.62, dz, 0.05, 0.38, 0.05, C.gold);
  g.box(0, 2.86, 0, 0.46, 0.08, 0.46, C.maroon);
  g.box(0, 2.96, 0, 0.26, 0.1, 0.26, C.maroon);
  g.box(0, 3.06, 0, 0.08, 0.1, 0.08, C.gold);
  ctx.glows.push(g.tx, 2.62, g.tz);
}
function bench(g) {
  for (let i = 0; i < 3; i++) g.box(0, 0.44, -0.14 + i * 0.12, 1.5, 0.06, 0.1, shade(C.wood, [1, 0.9, 1.06][i]));
  for (let i = 0; i < 2; i++) g.box(0, 0.64 + i * 0.14, -0.24, 1.5, 0.09, 0.05, shade(C.wood, [0.95, 1.05][i]));
  for (const sx of [-0.62, 0.62]) { g.box(sx, 0.2, -0.02, 0.07, 0.4, 0.38, C.iron); g.box(sx, 0.62, -0.25, 0.06, 0.44, 0.06, C.iron); g.box(sx, 0.58, 0.04, 0.08, 0.06, 0.4, C.gold); }
}
function fence(g, f, it) {
  const n = Math.max(2, Math.round(it.len / 0.46));
  const L = it.len;
  for (const y of [0.3, 0.62]) g.box(0, y, 0, L, 0.06, 0.05, C.woodL);
  for (let i = 0; i <= n; i++) {
    const x = -L / 2 + (L * i) / n;
    const post = i === 0 || i === n;
    g.box(x, post ? 0.45 : 0.4, 0.04, post ? 0.12 : 0.09, post ? 0.9 : 0.8, post ? 0.12 : 0.04, post ? C.wood : jitter(C.white, 0.03, i + it.x));
  }
  f.flat(-L / 2, -0.14, L / 2, 0.24, 0.006, C.shadow);
}
function hedge(g, f, it) {
  const L = it.len;
  g.box(0, 0.38, 0, L, 0.76, 0.8, C.leafD);
  for (let x = -L / 2 + 0.5; x < L / 2 - 0.3; x += 1.1) g.box(x, 0.82, (x * 7) % 0.2 - 0.05, 0.9, 0.16, 0.6, C.leaf);
  for (let x = -L / 2 + 0.9; x < L / 2; x += 2.3) g.box(x, 0.93, 0.15, 0.14, 0.1, 0.14, C.rose);
  f.flat(-L / 2 - 0.1, -0.3, L / 2 + 0.2, 0.62, 0.006, C.shadow);
}
function garden(g, f, it) {
  const r = rng(it.seed || 1), W = it.w, D = it.d;
  g.box(0, 0.12, 0, W, 0.24, D, C.woodD);
  g.box(0, 0.25, 0, W - 0.16, 0.04, D - 0.16, C.soil);
  const rows = Math.max(2, Math.round(D / 0.55));
  for (let j = 0; j < rows; j++) {
    const z = -D / 2 + 0.3 + (j * (D - 0.6)) / Math.max(1, rows - 1);
    const kind = Math.floor(r() * 3);
    for (let x = -W / 2 + 0.35; x < W / 2 - 0.2; x += 0.5) {
      if (kind === 0) g.box(x, 0.38, z, 0.26, 0.22, 0.26, jitter(C.leaf, 0.08, x * 3 + j));
      else if (kind === 1) { g.box(x, 0.36, z, 0.12, 0.18, 0.12, C.leafD); g.box(x, 0.5, z, 0.18, 0.1, 0.18, j % 2 ? C.rose : C.mustard); }
      else g.box(x, 0.33, z, 0.34, 0.12, 0.2, C.leafL);
    }
  }
  f.flat(-W / 2 - 0.1, -D / 2 - 0.1, W / 2 + 0.25, D / 2 + 0.2, 0.005, C.shadow);
}
function laundry(g, it) {
  const L = it.len;
  for (const sx of [-1, 1]) { g.box(sx * L / 2, 0.95, 0, 0.09, 1.9, 0.09, C.woodD); g.box(sx * L / 2, 1.82, 0, 0.3, 0.06, 0.06, C.woodD); }
  g.box(0, 1.78, 0, L, 0.025, 0.025, C.ink);
  const cols = ['#E8A0A8', '#FFFDF8', '#9CC3DE', '#E2B33C', '#6E1F2A', '#4E8C86'];
  let x = -L / 2 + 0.4;
  let i = 0;
  while (x < L / 2 - 0.4) {
    const w = 0.34 + ((i * 37) % 5) * 0.06, h = 0.4 + ((i * 13) % 4) * 0.1;
    g.box(x + w / 2, 1.76 - h / 2, 0, w, h, 0.03, cols[(i + Math.round(it.x)) % cols.length]);
    x += w + 0.12; i++;
  }
}
function jars(g, f) {
  // a roadside water-jar stand: two clay jars with lids and a cup, under a little roof
  g.box(0, 0.35, 0, 1.2, 0.08, 0.6, C.wood);
  for (const sx of [-0.55, 0.55]) for (const sz of [-0.25, 0.25]) g.box(sx, 0.17, sz, 0.08, 0.34, 0.08, C.woodD);
  for (const sx of [-0.28, 0.28]) {
    g.box(sx, 0.62, 0, 0.44, 0.46, 0.44, C.terra);
    g.box(sx, 0.62, 0, 0.5, 0.2, 0.5, C.terraL);
    g.box(sx, 0.9, 0, 0.3, 0.1, 0.3, C.terraD);
    g.box(sx, 0.97, 0, 0.36, 0.04, 0.36, C.wood);
  }
  g.box(0.28, 1.03, 0.08, 0.1, 0.08, 0.1, C.gold);
  for (const sx of [-0.6, 0.6]) g.box(sx, 0.9, -0.28, 0.07, 1.1, 0.07, C.woodD);
  g.boxR(0, 1.5, -0.05, 1.5, 0.06, 0.9, C.maroon, 0.18, 0, 0);
  f.flat(-0.75, -0.4, 0.8, 0.5, 0.005, C.shadow);
}
function bikes(g) {
  const wheel = (x) => { for (const [w, h] of [[0.62, 0.06], [0.06, 0.62]]) g.box(x, 0.33, 0, w, h, 0.04, C.ink); g.box(x, 0.33, 0, 0.44, 0.44, 0.02, '#8E8173'); };
  wheel(-0.48); wheel(0.48);
  g.boxR(-0.15, 0.5, 0, 0.75, 0.05, 0.05, C.maroon, 0, 0, 0.35);
  g.box(0.12, 0.6, 0, 0.62, 0.05, 0.05, C.maroon);
  g.box(-0.18, 0.75, 0, 0.24, 0.05, 0.12, C.ink);
  g.box(0.42, 0.85, 0, 0.05, 0.5, 0.05, C.maroon);
  g.box(0.42, 1.08, 0, 0.05, 0.05, 0.42, C.ink);
  g.box(0.62, 0.62, 0, 0.2, 0.16, 0.26, C.wood); // basket
}
function woodpile(g, f) {
  for (let row = 0; row < 3; row++) for (let i = 0; i < 4 - row; i++) g.box(-0.45 + i * 0.3 + row * 0.15, 0.14 + row * 0.24, 0, 0.26, 0.24, 1.0, shade(C.wood, 0.85 + ((i + row) % 3) * 0.1));
  g.box(0.7, 0.3, 0.1, 0.36, 0.6, 0.36, C.woodD); // chopping block
  g.boxR(0.7, 0.72, 0.1, 0.06, 0.4, 0.06, C.wood, 0, 0, 0.5);
  f.flat(-0.75, -0.6, 1.0, 0.7, 0.005, C.shadow);
}
function flowers(g, it) {
  const r = rng(it.seed || 3);
  const cols = [C.rose, C.mustard, C.white, '#F3B27A', '#B9A3D6'];
  for (let i = 0; i < 4; i++) {
    const x = -0.45 + i * 0.3 + r() * 0.08, z = (r() - 0.5) * 0.4, h = 0.24 + r() * 0.12;
    g.box(x, h / 2, z, 0.24, h, 0.24, i % 2 ? C.terra : C.terraL);
    g.box(x, h + 0.08, z, 0.2, 0.14, 0.2, C.leaf);
    g.box(x, h + 0.2, z, 0.12, 0.1, 0.12, cols[Math.floor(r() * cols.length)]);
  }
}
// ---- exercise-book things grown big in the yards (the Quarter's own look), and yard life
function pencil(g, f, it) {
  // a giant yellow pencil lying in the grass: the neighbours sit on it like a log
  const L = it.len || 3.2;
  g.box(-0.2, 0.26, 0, L - 0.9, 0.44, 0.5, '#E8B832');
  g.box(-0.2, 0.49, 0, L - 0.9, 0.04, 0.28, '#F2CB55'); // a lighter facet on top
  for (const sz of [-1, 1]) g.box(-0.2, 0.3, sz * 0.24, L - 0.9, 0.08, 0.04, '#C99A22');
  g.box(L / 2 - 0.55 - 0.2 + 0.25, 0.26, 0, 0.5, 0.38, 0.42, '#EBD3A8'); // shaved wood
  g.box(L / 2 - 0.2 + 0.08, 0.26, 0, 0.3, 0.2, 0.24, '#EBD3A8');
  g.box(L / 2 + 0.06, 0.26, 0, 0.14, 0.1, 0.1, C.ink); // the lead
  g.box(-L / 2 + 0.2, 0.26, 0, 0.3, 0.48, 0.54, C.gold); // ferrule
  for (const dx of [-0.06, 0.06]) g.box(-L / 2 + 0.2 + dx, 0.26, 0, 0.03, 0.5, 0.56, C.goldD);
  g.box(-L / 2 - 0.12, 0.26, 0, 0.36, 0.44, 0.5, '#E8A0A8'); // the eraser end
  for (let k = 0; k < 3; k++) g.box(L / 2 + 0.5 + k * 0.22, 0.03, 0.3 - k * 0.2, 0.18, 0.04, 0.12, k % 2 ? '#EBD3A8' : '#E8B832'); // shavings
  f.flat(-L / 2 - 0.3, -0.4, L / 2 + 0.4, 0.5, 0.005, C.shadow);
}
function eraser(g, f) {
  // a big pink eraser with its paper sleeve half off, worn soft on one corner: the children's seat
  g.box(0, 0.3, 0, 1.3, 0.6, 0.7, '#EFA9B4');
  g.box(0.68, 0.24, 0, 0.12, 0.44, 0.62, '#E496A3');
  g.box(-0.25, 0.31, 0, 0.62, 0.64, 0.74, '#2F5DB3');
  g.box(-0.25, 0.31, 0.375, 0.5, 0.2, 0.01, '#FFFDF8');
  g.box(-0.25, 0.64, 0, 0.62, 0.02, 0.5, '#FFFDF8');
  for (let k = 0; k < 4; k++) g.box(0.9 + (k % 2) * 0.2, 0.03, -0.2 + k * 0.14, 0.1, 0.05, 0.08, '#EFA9B4'); // crumbs
  f.flat(-0.75, -0.45, 0.85, 0.5, 0.005, C.shadow);
}
function paperClip(g, f) {
  // a paper-clip garden arch with a jasmine vine on it (no walls: you walk under it)
  const S = '#B9B6B0', S2 = '#D9D6CF';
  for (const sx of [-0.8, 0.8]) g.box(sx, 1.0, 0, 0.08, 2.0, 0.08, S);
  for (const sx of [-0.55, 0.55]) g.box(sx, 0.85, 0.04, 0.07, 1.7, 0.07, S2);
  g.box(0, 2.0, 0, 1.68, 0.08, 0.08, S);
  g.box(0, 1.7, 0.04, 1.18, 0.07, 0.07, S2);
  for (let k = 0; k < 7; k++) { const y = 0.4 + k * 0.26, sx = k % 2 ? -0.8 : 0.8; g.box(sx, y, 0.08, 0.18, 0.14, 0.14, C.leaf); if (k % 3 === 0) g.box(sx, y + 0.08, 0.14, 0.08, 0.08, 0.06, C.white); }
  for (let x = -0.6; x <= 0.6; x += 0.3) g.box(x, 2.08, 0.06, 0.2, 0.12, 0.16, C.leafD);
  f.flat(-0.6, -0.5, 0.6, 0.5, 0.004, '#EADFC6');
}
function hens(g, f, it) {
  // three hens pecking round a scatter of grain
  const r = rng(it.seed || 7);
  for (let k = 0; k < 3; k++) {
    const x = (r() - 0.5) * 1.6, z = (r() - 0.5) * 1.0, c = k === 1 ? '#8E4A2C' : C.white, ry = r() * 6;
    const fx = Math.sin(ry) * 0.16, fz = Math.cos(ry) * 0.16;
    g.box(x, 0.2, z, 0.26, 0.22, 0.26, c);
    g.box(x + fx, 0.34, z + fz, 0.13, 0.16, 0.13, c);
    g.box(x + fx * 1.5, 0.36, z + fz * 1.5, 0.05, 0.04, 0.05, C.mustard);
    g.box(x + fx, 0.45, z + fz, 0.04, 0.07, 0.09, '#C8323C');
    g.box(x - fx, 0.3, z - fz, 0.1, 0.16, 0.1, shade(c, 0.85));
    for (const s of [-0.05, 0.05]) g.box(x + s, 0.05, z, 0.03, 0.1, 0.03, C.mustard);
  }
  for (let k = 0; k < 8; k++) f.flatR((r() - 0.5) * 1.4, (r() - 0.5) * 0.8, 0.06, 0.06, 0.006, C.mustard);
}
function well(g, f) {
  // a square brick well with a little roof and a bucket on the rope
  for (const [x, z, w, d] of [[0, -0.55, 1.3, 0.2], [0, 0.55, 1.3, 0.2], [-0.55, 0, 0.2, 0.9], [0.55, 0, 0.2, 0.9]]) g.box(x, 0.36, z, w, 0.72, d, C.brick);
  g.box(0, 0.74, 0, 1.36, 0.06, 1.36, C.brickD);
  g.box(0, 0.6, 0, 0.9, 0.04, 0.9, '#4E8C86');
  for (const sx of [-0.6, 0.6]) g.box(sx, 1.25, 0, 0.1, 1.1, 0.1, C.woodD);
  g.box(0, 1.6, 0, 1.3, 0.08, 0.08, C.wood);
  g.boxR(0, 1.95, -0.3, 1.6, 0.06, 0.8, C.maroon, 0.5, 0, 0);
  g.boxR(0, 1.95, 0.3, 1.6, 0.06, 0.8, C.maroon, -0.5, 0, 0);
  g.box(0, 1.25, 0, 0.02, 0.7, 0.02, C.ink);
  g.box(0, 0.95, 0, 0.22, 0.2, 0.22, C.iron);
  f.flat(-0.8, -0.8, 0.9, 0.9, 0.005, C.shadow);
}
function teaSet(g, f) {
  // two plastic stools and a low table with a teapot: a neighbour's afternoon
  g.box(0, 0.32, 0, 0.8, 0.05, 0.5, C.woodL);
  for (const sx of [-0.34, 0.34]) for (const sz of [-0.2, 0.2]) g.box(sx, 0.15, sz, 0.05, 0.3, 0.05, C.woodD);
  g.box(-0.12, 0.42, 0, 0.18, 0.16, 0.18, '#FFFDF8'); g.box(-0.12, 0.52, 0, 0.08, 0.05, 0.08, C.gold); g.box(0.0, 0.44, 0, 0.1, 0.03, 0.03, '#FFFDF8');
  for (const sx of [0.12, 0.24]) g.box(sx, 0.39, 0.08, 0.07, 0.08, 0.07, '#FFFDF8');
  for (const [sx, c] of [[-0.75, '#C8323C'], [0.75, '#2F5DB3']]) { g.box(sx, 0.24, 0.05, 0.36, 0.06, 0.36, c); g.box(sx, 0.11, 0.05, 0.28, 0.22, 0.28, shade(c, 0.8)); }
  f.flat(-1.0, -0.4, 1.0, 0.45, 0.005, C.shadow);
}
function tufts(g, f, it) {
  // a few tufts of grass and a wild flower or two on the paper (no keep-out: you walk through them).
  // Drawn into the ground mesh: too small to need outlines, and many of them
  const r = rng(it.seed || 11);
  for (let k = 0; k < 5; k++) {
    const x = (r() - 0.5) * 2.4, z = (r() - 0.5) * 1.4, h = 0.12 + r() * 0.14;
    f.box(x, h / 2, z, 0.22, h, 0.12, k % 2 ? C.leaf : C.leafL);
    f.box(x + 0.08, h * 0.4, z + 0.05, 0.1, h * 0.8, 0.1, C.leafD);
    if (k % 3 === 0) f.box(x, h + 0.05, z, 0.09, 0.09, 0.09, [C.rose, C.white, C.mustard][Math.floor(r() * 3)]);
  }
}
function stall(g, f) {
  // tea corner: a low table and tiny stools (a Yangon tea-shop street corner)
  g.box(0, 0.42, 0, 1.2, 0.06, 0.7, C.woodL);
  for (const sx of [-0.52, 0.52]) for (const sz of [-0.28, 0.28]) g.box(sx, 0.2, sz, 0.06, 0.4, 0.06, C.woodD);
  for (const [x, z] of [[-0.95, 0.1], [0.95, 0.1], [0, 0.75], [-0.4, -0.7]]) { g.box(x, 0.2, z, 0.3, 0.06, 0.3, ['#2F5DB3', '#C8323C', '#E2B33C', '#4E8C86'][Math.abs(Math.round(x * 10 + z * 3)) % 4]); g.box(x, 0.09, z, 0.22, 0.18, 0.22, shade('#C8323C', 0.8)); }
  g.box(-0.25, 0.5, 0.05, 0.14, 0.1, 0.14, C.white); g.box(0.2, 0.5, -0.1, 0.14, 0.1, 0.14, C.white);
  g.box(0.3, 0.55, 0.15, 0.22, 0.2, 0.18, C.goldD); // kettle
  f.flat(-1.2, -1.0, 1.2, 1.1, 0.005, C.shadow);
}
function noticeBoard(g, ctx) {
  for (const sx of [-0.8, 0.8]) g.box(sx, 0.85, 0, 0.1, 1.7, 0.1, C.woodD);
  g.box(0, 1.25, 0, 1.8, 0.9, 0.08, C.woodL);
  g.box(0, 1.25, 0.045, 1.66, 0.76, 0.02, '#D9C8A4');
  const cols = [C.white, '#FCE6C4', '#F6F0E2', '#E8A0A8'];
  [[-0.55, 1.38, 0.4, 0.3], [-0.1, 1.2, 0.36, 0.42], [0.36, 1.4, 0.44, 0.28], [0.45, 1.06, 0.3, 0.24], [-0.5, 1.02, 0.34, 0.2]].forEach(([x, y, w, h], i) => {
    g.box(x, y, 0.06, w, h, 0.012, cols[i % 4]);
    g.box(x, y + h / 2 - 0.04, 0.07, 0.05, 0.05, 0.012, C.maroon);
  });
  g.box(0, 1.76, 0, 2.0, 0.08, 0.2, C.maroon);
  void ctx;
}
function swing(g, f) {
  for (const sx of [-1.45, 1.45]) { g.boxR(sx, 1.1, -0.35, 0.1, 2.3, 0.1, C.maroon, 0.3, 0, 0); g.boxR(sx, 1.1, 0.35, 0.1, 2.3, 0.1, C.maroon, -0.3, 0, 0); }
  g.box(0, 2.22, 0, 3.1, 0.12, 0.12, C.gold);
  for (const sx of [-0.7, 0.7]) {
    for (const dx of [-0.22, 0.22]) g.box(sx + dx, 1.5, 0, 0.03, 1.4, 0.03, C.ink);
    g.box(sx, 0.78, 0, 0.6, 0.06, 0.3, C.woodL);
  }
  f.flat(-1.7, -0.9, 1.7, 0.9, 0.005, C.shadow);
}
function seesaw(g) {
  g.box(0, 0.25, 0, 0.3, 0.5, 0.4, C.maroon);
  g.boxR(0, 0.55, 0, 3.2, 0.08, 0.3, C.woodL, 0, 0, 0.14);
  for (const sx of [-1.4, 1.4]) g.box(sx, sx < 0 ? 0.62 : 0.98, 0, 0.06, 0.3, 0.3, C.gold);
}
function slide(g) {
  g.box(0, 1.2, -1.0, 0.9, 0.08, 0.9, C.gold);
  for (const sx of [-0.42, 0.42]) { g.box(sx, 0.6, -1.4, 0.07, 1.2, 0.07, C.maroon); g.box(sx, 0.6, -0.6, 0.07, 1.2, 0.07, C.maroon); }
  for (let i = 0; i < 4; i++) g.box(0, 0.25 + i * 0.27, -1.5, 0.8, 0.05, 0.06, C.wood);
  g.boxR(0, 0.68, 0.2, 0.7, 0.06, 2.1, '#E2B33C', -0.55, 0, 0);
  for (const sx of [-0.37, 0.37]) g.boxR(sx, 0.77, 0.2, 0.05, 0.14, 2.1, C.maroon, -0.55, 0, 0);
}
function pots(g, f, it) {
  // drying boards on bricks, rows of fresh pots (pale clay) and a few fired ones (terracotta)
  const W = it.w, D = it.d;
  for (const z of [-D / 4, D / 4]) {
    g.box(0, 0.16, z, W, 0.06, 0.8, C.woodL);
    for (const x of [-W / 2 + 0.3, 0, W / 2 - 0.3]) g.box(x, 0.06, z, 0.3, 0.12, 0.7, C.brick);
    for (let x = -W / 2 + 0.35; x < W / 2 - 0.2; x += 0.62) {
      const fired = ((x * 10) | 0) % 3 === 0;
      const body = fired ? C.terra : '#D9B48C', rim = fired ? C.terraD : '#C49A6F';
      g.box(x, 0.36, z, 0.42, 0.34, 0.42, body);
      g.box(x, 0.36, z, 0.48, 0.14, 0.48, shade(body, 1.06));
      g.box(x, 0.58, z, 0.26, 0.1, 0.26, rim);
    }
  }
  f.flat(-W / 2 - 0.1, -D / 2, W / 2 + 0.3, D / 2 + 0.2, 0.005, C.shadow);
}

// ---------------------------------------------------------------------------------
// Buildings (local space: footprint centred on the origin, front at +d/2)
// ---------------------------------------------------------------------------------
function windowBox(g, x, y, z, w, h, shut, open = true) {
  g.box(x, y, z, w + 0.12, h + 0.12, 0.08, C.white);
  g.box(x, y, z + 0.02, w, h, 0.06, C.glass);
  g.box(x, y, z + 0.05, 0.05, h, 0.03, C.white);
  g.box(x, y - h / 2 - 0.08, z + 0.08, w + 0.24, 0.06, 0.16, C.goldD);
  if (open) for (const sx of [-1, 1]) {
    g.box(x + sx * (w / 2 + 0.2), y, z + 0.04, 0.3, h, 0.05, shut);
    g.box(x + sx * (w / 2 + 0.2), y, z + 0.075, 0.2, h * 0.75, 0.02, shade(shut, 0.82));
  }
}
function gableRoof(g, W, D, y0, rise, color, over = 0.35) {
  // two sloping slabs (ridge along X), corrugation strips, a ridge cap, stepped gable ends
  const half = D / 2 + over, ang = Math.atan2(rise, D / 2), slope = half / Math.cos(ang);
  for (const sz of [-1, 1]) {
    const cz = (sz * half) / 2, cy = y0 + rise / 2 + 0.06;
    g.boxR(0, cy, cz, W + over * 2, 0.12, slope, color, sz * ang, 0, 0);
    for (let k = 0; k < 3; k++) {
      const t = (k + 0.5) / 3;
      g.boxR(0, y0 + rise * (1 - t) + 0.16, sz * half * t, W + over * 2 + 0.02, 0.04, 0.08, shade(color, 0.82), sz * ang, 0, 0);
    }
  }
  g.box(0, y0 + rise + 0.12, 0, W + over * 2 + 0.06, 0.14, 0.3, C.goldD);
}
/** A stepped tile roof (hipped, shrinking in both directions), seen from above it reads as rows of
 * tiles: each step has a lighter rim on its front and back, the ridge a gold cap. */
function tileRoof(g, W, D, y0, color, steps = 5, stepH = 0.3) {
  const w0 = W + 0.7, d0 = D + 0.7;
  g.box(0, y0 + 0.06, 0, w0 + 0.1, 0.12, d0 + 0.1, C.woodD); // eaves board
  for (let i = 0; i < steps; i++) {
    const k = i / steps;
    const w = w0 - k * Math.min(W * 0.45, 3.2), d = d0 * (1 - k * 0.92);
    const y = y0 + 0.12 + stepH * (i + 0.5);
    const c = i % 2 ? color : shade(color, 0.9);
    g.box(0, y, 0, w, stepH, d, c);
    for (const sz of [-1, 1]) g.box(0, y + stepH / 2 - 0.03, sz * (d / 2 - 0.06), w + 0.02, 0.07, 0.14, shade(color, 1.18));
  }
  g.box(0, y0 + 0.12 + stepH * steps + 0.07, 0, w0 - Math.min(W * 0.45, 3.2) + 0.2, 0.14, 0.26, C.goldD);
}
function gableEnds(g, W, D, y0, rise, color) {
  const steps = 4;
  for (let i = 0; i < steps; i++) {
    const d = D * (1 - (i + 0.5) / steps);
    g.box(0, y0 + (rise * (i + 0.5)) / steps, 0, W - 0.04, rise / steps, d, color);
  }
}

function house(g, f, it) {
  const W = it.w, D = it.d, r = rng(it.seed);
  const wall = it.wall, roof = it.roof, trim = r() < 0.5 ? C.goldD : C.woodD;
  const shut = [C.maroon, '#4E8C86', '#2F5DB3', C.woodD][Math.floor(r() * 4)];
  f.flat(-W / 2 - 0.2, -D / 2 - 0.3, W / 2 + 0.6, D / 2 + 0.6, 0.004, C.shadow);
  // stepping-stone path from the door to the footpath
  const doorX = (r() - 0.5) * (W - 2.4);
  for (let k = 0; k < 3; k++) f.flatR(doorX + (k % 2 ? 0.08 : -0.08), D / 2 + 0.55 + k * 0.5, 0.5, 0.34, 0.008, C.parch);

  if (it.style === 'stilt') {
    const FL = 0.95, top = 3.2;
    for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) g.box(sx * (W / 2 - 0.2), FL / 2, sz * (D / 2 - 0.2), 0.2, FL, 0.2, C.woodD);
    g.box(0, FL - 0.05, 0, W, 0.16, D, C.wood);
    g.box(0, FL + 0.03, D / 2 + 0.5, W, 0.1, 1.0, C.woodL); // veranda
    // walls: vertical boards on the front, plain sides and back
    const n = Math.max(6, Math.round(W / 0.5));
    for (let i = 0; i < n; i++) {
      const x = -W / 2 + (W * (i + 0.5)) / n;
      g.box(x, (FL + top) / 2, D / 2 - 0.06, W / n + 0.002, top - FL, 0.12, jitter(wall, 0.05, it.seed + i));
    }
    g.box(0, (FL + top) / 2, -0.06, W - 0.1, top - FL, D - 0.12, shade(wall, 0.95));
    g.box(0, top - 0.06, D / 2, W + 0.08, 0.12, 0.16, trim);
    g.box(0, FL + 0.12, D / 2, W + 0.06, 0.1, 0.16, trim);
    for (const sx of [-1, 1]) g.box(sx * (W / 2), (FL + top) / 2, D / 2, 0.14, top - FL, 0.16, trim);
    // door, windows
    g.box(doorX, FL + 0.95, D / 2 + 0.02, 0.9, 1.75, 0.08, C.woodD);
    g.box(doorX, FL + 0.95, D / 2 + 0.05, 0.7, 1.55, 0.04, shade(C.wood, 0.9));
    g.box(doorX + 0.22, FL + 0.95, D / 2 + 0.09, 0.07, 0.07, 0.04, C.gold);
    for (const wx of [-W / 2 + 1.0, W / 2 - 1.0]) if (Math.abs(wx - doorX) > 1.2) windowBox(g, wx, FL + 1.25, D / 2 + 0.03, 0.75, 0.8, shut);
    // veranda rail and steps
    for (let x = -W / 2 + 0.1; x <= W / 2 - 0.05; x += 0.5) if (Math.abs(x - doorX) > 0.55) g.box(x, FL + 0.38, D / 2 + 0.95, 0.06, 0.62, 0.06, C.woodD);
    for (const sx of [-1, 1]) { const x0 = sx < 0 ? -W / 2 + 0.05 : doorX + 0.55, x1 = sx < 0 ? doorX - 0.55 : W / 2 - 0.05; if (x1 - x0 > 0.2) g.box((x0 + x1) / 2, FL + 0.66, D / 2 + 0.95, x1 - x0, 0.06, 0.08, C.wood); }
    for (let k = 0; k < 3; k++) g.box(doorX, FL - 0.2 - k * 0.27, D / 2 + 1.15 + k * 0.28, 0.95, 0.08, 0.3, C.woodL);
    gableEnds(g, W, D, top, 1.5, shade(wall, 0.9));
    gableRoof(g, W, D, top, 1.5, roof, 0.4);
    // pots of flowers on the veranda, a hanging lantern
    g.box(-W / 2 + 0.35, FL + 0.25, D / 2 + 0.75, 0.26, 0.26, 0.26, C.terra);
    g.box(-W / 2 + 0.35, FL + 0.45, D / 2 + 0.75, 0.24, 0.16, 0.24, C.rose);
    g.box(doorX + 0.75, top - 0.35, D / 2 + 0.5, 0.18, 0.26, 0.18, C.mustard);
  } else if (it.style === 'shop') {
    const H1 = 3.0, H2 = 5.6;
    g.box(0, 0.08, 0, W + 0.2, 0.16, D + 0.2, C.parch);
    g.box(0, H1 / 2 + 0.08, -0.4, W, H1, D - 0.8, wall);
    g.box(0, (H1 + H2) / 2, -0.1, W, H2 - H1, D - 0.2, shade(wall, 1.02));
    // shop front: shutter half up, goods on shelves inside
    g.box(0, 1.5, D / 2 - 0.82, W - 0.6, 2.6, 0.06, '#3A2E25');
    for (let k = 0; k < 3; k++) {
      g.box(0, 0.6 + k * 0.6, D / 2 - 0.75, W - 0.9, 0.06, 0.3, C.woodL);
      for (let x = -W / 2 + 0.7; x < W / 2 - 0.6; x += 0.42) g.box(x, 0.78 + k * 0.6, D / 2 - 0.72, 0.26, 0.3, 0.22, ['#E2B33C', '#C8323C', '#2F5DB3', '#FFFDF8', '#4E8C86', '#F3B27A'][(Math.round(x * 7) + k + it.seed) % 6]);
    }
    g.box(0, 2.72, D / 2 - 0.78, W - 0.5, 0.5, 0.14, '#B9B0A2'); // rolled shutter
    for (let k = 0; k < 3; k++) g.box(0, 2.56 + k * 0.12, D / 2 - 0.7, W - 0.5, 0.03, 0.02, '#8E8173');
    for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.15), H1 / 2 + 0.08, D / 2 - 0.75, 0.3, H1, 0.3, shade(wall, 0.9));
    // striped awning
    const stripes = Math.max(4, Math.round(W / 0.5));
    for (let i = 0; i < stripes; i++) g.boxR(-W / 2 + (W * (i + 0.5)) / stripes, H1 + 0.0, D / 2 - 0.15, W / stripes + 0.005, 0.06, 1.3, i % 2 ? C.white : roof, 0.32, 0, 0);
    g.box(0, H1 - 0.2, D / 2 + 0.45, W + 0.02, 0.16, 0.04, C.goldD);
    // balcony, upper windows
    g.box(0, H1 + 0.32, D / 2 + 0.1, W - 0.4, 0.1, 0.8, C.cream);
    for (let x = -W / 2 + 0.3; x <= W / 2 - 0.25; x += 0.35) g.box(x, H1 + 0.62, D / 2 + 0.45, 0.05, 0.5, 0.05, C.goldD);
    g.box(0, H1 + 0.9, D / 2 + 0.45, W - 0.4, 0.06, 0.07, C.gold);
    for (const wx of [-W / 4, W / 4]) windowBox(g, wx, H1 + 1.35, D / 2 - 0.08, 0.8, 1.0, '#4E8C86');
    // parapet and cornice
    g.box(0, H2 + 0.12, -0.1, W + 0.2, 0.24, D, C.goldD);
    g.box(0, H2 + 0.4, D / 2 - 0.15, W + 0.1, 0.36, 0.2, wall);
    g.box(0, H2 + 0.62, D / 2 - 0.15, W + 0.2, 0.08, 0.26, C.goldD);
    g.box(0, H2 + 0.4, D / 2 - 0.04, 1.3, 0.26, 0.06, roof); // little painted panel
    for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.2), H2 + 0.62, D / 2 - 0.15, 0.3, 0.3, 0.3, C.goldD);
    // the flat roof is lived on (the street camera looks down on it): paving lines, a stair hut, a water
    // tank, potted chillies and a wash line
    for (let k = 1; k < 4; k++) g.box(0, H2 + 0.25, -0.1 - D / 2 + (D * k) / 4, W - 0.1, 0.02, 0.06, shade(C.goldD, 1.18));
    const hx = (r() < 0.5 ? -1 : 1) * (W / 2 - 1.0);
    g.box(hx, H2 + 0.95, -D / 2 + 1.0, 1.5, 1.4, 1.4, shade(wall, 0.96));
    g.box(hx, H2 + 1.7, -D / 2 + 1.0, 1.7, 0.12, 1.6, roof);
    g.box(hx, H2 + 0.85, -D / 2 + 1.71, 0.7, 1.15, 0.04, C.woodD);
    g.box(-hx * 0.55, H2 + 0.75, -D / 2 + 0.9, 0.9, 0.95, 0.9, r() < 0.5 ? '#4E8C86' : '#3E5F7A');
    g.box(-hx * 0.55, H2 + 1.25, -D / 2 + 0.9, 0.96, 0.08, 0.96, C.iron);
    for (let k = 0; k < 3; k++) { const px = -W / 2 + 0.6 + k * 0.5; g.box(px, H2 + 0.42, D / 2 - 0.75, 0.3, 0.3, 0.3, C.terra); g.box(px, H2 + 0.68, D / 2 - 0.75, 0.32, 0.24, 0.32, k === 1 ? '#C8323C' : C.leaf); }
    g.box(0, H2 + 1.3, 0.2, W - 1.6, 0.025, 0.025, C.ink);
    for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.8), H2 + 0.78, 0.2, 0.06, 1.1, 0.06, C.woodD);
    for (let x = -W / 2 + 1.2, i = 0; x < W / 2 - 1.2; x += 0.55, i++) g.box(x, H2 + 1.08, 0.2, 0.4, 0.42, 0.03, ['#E8A0A8', '#FFFDF8', '#9CC3DE', '#E2B33C'][(i + it.seed) % 4]);
    // a potted plant and a sign by the door
    g.box(W / 2 - 0.5, 0.3, D / 2 + 0.2, 0.34, 0.44, 0.34, C.terra);
    g.box(W / 2 - 0.5, 0.65, D / 2 + 0.2, 0.44, 0.34, 0.44, C.leaf);
  } else {
    // cottage: one storey, a stepped roof, a porch over the door, window boxes
    const H = 2.6;
    g.box(0, 0.1, 0, W + 0.2, 0.2, D + 0.2, C.parch);
    g.box(0, H / 2 + 0.2, 0, W, H, D, wall);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (W / 2), H / 2 + 0.2, sz * (D / 2), 0.16, H, 0.16, C.woodD);
    g.box(0, H + 0.14, D / 2, W + 0.1, 0.1, 0.14, C.woodD);
    g.box(doorX, 1.15, D / 2 + 0.02, 0.95, 1.9, 0.08, C.woodD);
    g.box(doorX, 1.15, D / 2 + 0.05, 0.75, 1.7, 0.04, shut);
    g.box(doorX + 0.24, 1.15, D / 2 + 0.09, 0.07, 0.07, 0.04, C.gold);
    for (const wx of [-W / 2 + 0.95, W / 2 - 0.95]) {
      if (Math.abs(wx - doorX) < 1.2) continue;
      windowBox(g, wx, 1.5, D / 2 + 0.03, 0.8, 0.8, shut, false);
      g.box(wx, 0.92, D / 2 + 0.2, 1.0, 0.18, 0.26, C.woodL);
      for (const dx of [-0.32, 0, 0.32]) g.box(wx + dx, 1.07, D / 2 + 0.2, 0.2, 0.14, 0.18, dx ? C.rose : C.mustard);
    }
    // porch roof on two posts
    for (const sx of [-0.55, 0.55]) g.box(doorX + sx, 1.1, D / 2 + 0.85, 0.1, 2.2, 0.1, C.woodL);
    g.boxR(doorX, 2.3, D / 2 + 0.55, 1.5, 0.08, 1.1, roof, 0.25, 0, 0);
    // stepped roof (three shrinking slabs) and a ridge
    for (let k = 0; k < 3; k++) {
      const s = 1 - k * 0.27;
      g.box(0, H + 0.36 + k * 0.42, 0, (W + 0.6) * (1 - k * 0.18), 0.42, (D + 0.6) * s, k % 2 ? shade(roof, 1.1) : roof);
      g.box(0, H + 0.17 + k * 0.42, (D + 0.6) * s / 2, (W + 0.6) * (1 - k * 0.18) + 0.02, 0.05, 0.05, C.goldD);
    }
    g.box(0, H + 1.6, 0, (W + 0.6) * 0.5, 0.14, 0.3, C.goldD);
    g.box(W / 2 - 0.8, H + 1.5, -0.6, 0.4, 0.9, 0.4, C.brick); // chimney
    g.box(W / 2 - 0.8, H + 1.98, -0.6, 0.48, 0.08, 0.48, C.brickD);
  }
}

function school(g, f, it, ctx) {
  const W = it.w, D = it.d, H1 = 3.0, H2 = 6.0;
  const wall = '#F3ECDC', green = '#4F7F43';
  f.flat(-W / 2 - 0.4, -D / 2 - 0.4, W / 2 + 0.8, D / 2 + 1.8, 0.004, C.shadow);
  g.box(0, 0.12, 0, W + 0.3, 0.24, D + 0.3, C.parch);
  g.box(0, (0.24 + H2) / 2, 0, W, H2 - 0.24, D, wall);
  g.box(0, H1, D / 2 + 0.05, W + 0.04, 0.16, 0.14, C.goldD); // floor band
  g.box(0, 0.4, D / 2 + 0.03, W, 0.32, 0.1, shade(wall, 0.88));
  // windows: two floors, green shutters
  for (let i = 0; i < 9; i++) {
    const x = -W / 2 + 1.4 + i * ((W - 2.8) / 8);
    if (Math.abs(x) < 2.0) continue;
    windowBox(g, x, 1.7, D / 2 + 0.03, 0.9, 1.1, green);
    windowBox(g, x, 4.5, D / 2 + 0.03, 0.9, 1.1, green);
  }
  // corner pilasters
  for (const sx of [-1, 1]) g.box(sx * W / 2, H2 / 2, D / 2, 0.3, H2, 0.3, C.cream);
  // entrance: porch with columns, a gable with the school's sign, steps
  g.box(0, H2 / 2 + 0.2, D / 2 + 0.6, 4.2, H2 + 0.4, 1.2, shade(wall, 1.02));
  g.box(0, 1.35, D / 2 + 1.22, 1.8, 2.5, 0.08, '#3A2E25');
  for (const sx of [-0.45, 0.45]) g.box(sx, 1.35, D / 2 + 1.26, 0.8, 2.3, 0.04, green);
  for (const sx of [-1.9, -1.2, 1.2, 1.9]) g.box(sx, 1.6, D / 2 + 1.4, 0.26, 3.2, 0.26, C.white);
  for (let k = 0; k < 3; k++) g.box(0, 0.1 + k * 0.1, D / 2 + 1.75 + (2 - k) * 0.25, 4.6 - k * 0.3, 0.1, 0.5 + k * 0.25, C.parch);
  windowBox(g, 0, 4.4, D / 2 + 1.23, 1.4, 1.1, green, false);
  for (let k = 0; k < 4; k++) g.box(0, H2 + 0.6 + k * 0.32, D / 2 + 0.6, 4.6 - k * 1.1, 0.32, 1.3, k === 0 ? C.goldD : wall);
  // roof: two broad stepped slabs, maroon, gold eaves
  tileRoof(g, W, D, H2, C.maroon, 6, 0.28);
  g.box(0, H2 + 0.12, D / 2 + 0.4, W + 0.82, 0.08, 0.06, C.gold);
  // a bell turret on the ridge and two chimneys, so the long roof has things on it
  g.box(0, H2 + 2.2, -0.2, 1.2, 1.0, 1.2, C.cream);
  g.box(0, H2 + 2.2, 0.41, 0.6, 0.6, 0.02, '#3A2E25');
  g.box(0, H2 + 2.55, 0.43, 0.22, 0.26, 0.04, C.gold);
  g.box(0, H2 + 2.85, -0.2, 1.5, 0.22, 1.5, C.maroon);
  g.box(0, H2 + 3.1, -0.2, 0.9, 0.3, 0.9, shade(C.maroon, 1.12));
  for (const sx of [-8, 8]) { g.box(sx, H2 + 1.6, -1.6, 0.7, 1.2, 0.7, '#B5643C'); g.box(sx, H2 + 2.24, -1.6, 0.86, 0.12, 0.86, C.iron); }
  // flagpole with a plain school pennant, and the old school bell (a bar hung in a little frame)
  g.box(5.4, 0.15, D / 2 + 2.3, 0.6, 0.3, 0.6, C.parch);
  g.box(5.4, 3.3, D / 2 + 2.3, 0.08, 6.3, 0.08, C.goldD);
  g.box(5.4, 6.5, D / 2 + 2.3, 0.16, 0.16, 0.16, C.gold);
  g.box(5.95, 6.0, D / 2 + 2.3, 1.0, 0.6, 0.03, green);
  g.box(5.95, 6.0, D / 2 + 2.32, 0.4, 0.25, 0.02, C.gold);
  for (const sx of [-12.1, -11.1]) g.box(sx, 1.0, D / 2 + 0.9, 0.12, 2.0, 0.12, C.woodD);
  g.box(-11.6, 2.0, D / 2 + 0.9, 1.3, 0.12, 0.14, C.woodD);
  g.box(-11.6, 1.6, D / 2 + 0.9, 0.7, 0.14, 0.08, C.goldD);
  g.box(-11.6, 1.82, D / 2 + 0.9, 0.02, 0.32, 0.02, C.ink);
  ctx.signs.push({ x: 0, y: H2 + 1.3, z: D / 2 + 1.27, w: 3.6, h: 0.9, lines: [{ text: 'ဗလာစာအုပ် မူလတန်းကျောင်း', size: 40 }, { text: 'Exercise-Book Primary School', size: 22, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: '#FFFDF8' });
}

function snack(g, f, it, ctx) {
  const W = it.w, D = it.d, H = 2.9;
  const wall = '#F2E2C4';
  f.flat(-W / 2 - 0.2, -D / 2 - 0.3, W / 2 + 0.6, D / 2 + 1.6, 0.004, C.shadow);
  g.box(0, 0.1, 0, W + 0.2, 0.2, D + 0.2, C.parch);
  g.box(0, H / 2 + 0.2, -D / 2 + 0.6, W, H, 1.2, wall); // back wall
  for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.15), H / 2 + 0.2, 0, 0.3, H, D, wall);
  tileRoof(g, W, D, H + 0.2, '#A0642E', 4);
  // a water tank on the roof, a little potted chilli plant and a drying basket by it (lived in)
  g.box(-W / 2 + 1.4, H + 1.7, -0.6, 1.1, 0.9, 1.1, '#4E8C86');
  g.box(-W / 2 + 1.4, H + 2.18, -0.6, 1.16, 0.08, 1.16, shade('#4E8C86', 1.2));
  for (const sx of [-0.45, 0.45]) g.box(-W / 2 + 1.4 + sx, H + 1.25, -0.6, 0.1, 0.3, 1.0, C.iron);
  g.box(W / 2 - 1.6, H + 1.6, -0.4, 0.9, 0.18, 0.9, '#C9A24A');
  for (let k = 0; k < 5; k++) g.box(W / 2 - 1.9 + (k % 3) * 0.28, H + 1.74, -0.6 + Math.floor(k / 3) * 0.3, 0.2, 0.08, 0.2, k % 2 ? '#C8323C' : '#E2B33C');
  // shelves of tins and jars on the back wall
  for (let k = 0; k < 3; k++) {
    g.box(0, 0.9 + k * 0.6, -D / 2 + 1.35, W - 1, 0.06, 0.3, C.woodL);
    for (let x = -W / 2 + 0.8; x < W / 2 - 0.6; x += 0.4) g.box(x, 1.08 + k * 0.6, -D / 2 + 1.35, 0.24, 0.3, 0.2, ['#E2B33C', '#C8323C', '#FFFDF8', '#4E8C86', '#F3B27A', '#B9A3D6'][(Math.round(x * 5) + k) % 6]);
  }
  // the counter along the front, glass jars of snacks on it
  g.box(0, 0.5, D / 2 - 0.5, W - 1.0, 1.0, 0.7, C.wood);
  g.box(0, 1.03, D / 2 - 0.5, W - 0.9, 0.06, 0.8, C.goldD);
  for (let x = -W / 2 + 0.8; x < W / 2 - 0.6; x += 0.3) g.box(x, 0.5, D / 2 - 0.13, 0.04, 0.84, 0.04, C.woodD);
  const fills = ['#F3B27A', '#C8323C', '#E2B33C', '#6F9E5B', '#F6F0E2', '#B5643C'];
  for (let i = 0; i < 9; i++) {
    const x = -W / 2 + 1.0 + i * ((W - 2.2) / 8);
    g.box(x, 1.24, D / 2 - 0.55, 0.36, 0.36, 0.36, C.glass);
    g.box(x, 1.17, D / 2 - 0.55, 0.3, 0.2, 0.3, fills[i % 6]);
    g.box(x, 1.45, D / 2 - 0.55, 0.26, 0.06, 0.26, C.maroon);
  }
  // a big pot of noodle soup on a stove at the east end
  g.box(W / 2 - 0.9, 0.4, D / 2 - 0.1, 0.8, 0.8, 0.8, C.iron);
  g.box(W / 2 - 0.9, 1.0, D / 2 - 0.1, 0.72, 0.5, 0.72, '#B9B0A2');
  g.box(W / 2 - 0.9, 1.27, D / 2 - 0.1, 0.62, 0.04, 0.62, '#E8A94A');
  // snacks hanging on a string under the awning
  g.box(0, 2.62, D / 2 - 0.15, W - 0.8, 0.03, 0.03, C.ink);
  for (let x = -W / 2 + 0.7; x < W / 2 - 0.5; x += 0.32) g.box(x, 2.42, D / 2 - 0.15, 0.2, 0.34, 0.04, fills[Math.abs(Math.round(x * 3)) % 6]);
  // striped awning
  const n = Math.round(W / 0.5);
  for (let i = 0; i < n; i++) g.boxR(-W / 2 + (W * (i + 0.5)) / n, 2.95, D / 2 + 0.35, W / n + 0.005, 0.06, 1.3, i % 2 ? C.white : C.maroon, 0.35, 0, 0);
  for (let i = 0; i < n; i++) g.box(-W / 2 + (W * (i + 0.5)) / n, 2.63, D / 2 + 0.98, W / n - 0.06, 0.16, 0.04, i % 2 ? C.white : C.maroon);
  // a chalk menu board out front, and stools
  g.boxR(-W / 2 - 0.2, 0.62, D / 2 + 0.6, 0.7, 1.0, 0.06, C.woodD, -0.2, 0.3, 0);
  g.boxR(-W / 2 - 0.2, 0.66, D / 2 + 0.64, 0.56, 0.8, 0.02, C.chalk, -0.2, 0.3, 0);
  for (let k = 0; k < 4; k++) g.boxR(-W / 2 - 0.2 + (k % 2) * 0.04, 0.88 - k * 0.15, D / 2 + 0.67, 0.36 - (k % 3) * 0.06, 0.03, 0.02, C.white, -0.2, 0.3, 0);
  for (const x of [-2.4, -1.0, 0.4]) { g.box(x, 0.26, D / 2 + 0.55, 0.32, 0.06, 0.32, '#2F5DB3'); g.box(x, 0.12, D / 2 + 0.55, 0.24, 0.24, 0.24, shade('#2F5DB3', 0.8)); }
  ctx.signs.push({ x: 0, y: H + 0.85, z: D / 2 + 0.1, w: 2.8, h: 0.7, lines: [{ text: 'သစ္စာ မုန့်ဆိုင်', size: 44 }, { text: 'Honesty Snacks', size: 22, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: '#FCE6C4' });
  for (const sx of [-1.2, 1.2]) g.box(sx, H + 0.6, D / 2 + 0.06, 0.08, 0.5, 0.08, C.goldD);
}

function potter(g, f, it, ctx) {
  const W = it.w, D = it.d;
  f.flat(-W / 2 - 0.2, -D / 2 - 0.3, W / 2 + 0.6, D / 2 + 1.0, 0.004, C.shadow);
  f.flat(-W / 2 + 0.3, -D / 2 + 0.3, 3.0, D / 2 - 0.2, 0.007, '#E9D8B4'); // packed clay floor (light: it lies in the roof's shade)
  // a woven mat and wet clay rings on the floor, where the street looks in under the roof
  f.flat(-6.6, 0.9, -1.4, 2.7, 0.009, '#D9B776');
  for (let x = -6.3; x < -1.6; x += 0.5) f.flat(x, 0.95, x + 0.06, 2.65, 0.011, '#C49A5A');
  // the open shed: posts, a thatch-coloured roof sloping to the back
  const sx0 = -W / 2 + 0.4, sx1 = 2.9;
  for (const x of [sx0, (sx0 + sx1) / 2, sx1]) for (const z of [-D / 2 + 0.4, D / 2 - 0.4]) g.box(x, z > 0 ? 1.6 : 1.3, z, 0.22, z > 0 ? 3.2 : 2.6, 0.22, C.woodD);
  const span = D, ang = Math.atan2(0.6, span);
  g.boxR((sx0 + sx1) / 2, 3.0, 0, sx1 - sx0 + 1.2, 0.18, span + 1.0, '#B98E5C', -ang, 0, 0);
  for (let k = 0; k < 5; k++) g.boxR((sx0 + sx1) / 2, 3.12, -span / 2 + 0.3 + k * (span / 4.4), sx1 - sx0 + 1.24, 0.05, 0.12, '#A07849', -ang, 0, 0);
  g.box((sx0 + sx1) / 2, 3.3, D / 2 + 0.5, sx1 - sx0 + 1.2, 0.12, 0.1, C.goldD);
  // back wall of planks, shelves full of pots
  g.box((sx0 + sx1) / 2, 1.3, -D / 2 + 0.25, sx1 - sx0, 2.6, 0.12, C.woodL);
  for (let k = 0; k < 3; k++) {
    g.box((sx0 + sx1) / 2, 0.5 + k * 0.62, -D / 2 + 0.55, sx1 - sx0 - 0.4, 0.06, 0.5, C.wood);
    for (let x = sx0 + 0.5; x < sx1 - 0.3; x += 0.55) {
      const fired = (Math.round(x * 3) + k) % 2;
      g.box(x, 0.72 + k * 0.62, -D / 2 + 0.55, 0.36, 0.34, 0.36, fired ? C.terra : '#D9B48C');
      g.box(x, 0.93 + k * 0.62, -D / 2 + 0.55, 0.22, 0.08, 0.22, fired ? C.terraD : '#C49A6F');
    }
  }
  // a row of fresh pots drying on planks just inside the front (glazed: cream, terracotta, gold, teal)
  g.box(-4.0, 0.1, D / 2 - 1.7, 6.6, 0.2, 0.6, C.woodL);
  const glaze = [C.terra, '#F3E6CC', C.mustard, C.teal, '#D9B48C', C.maroon];
  for (let i = 0; i < 11; i++) {
    const x = -7.0 + i * 0.6, h = 0.3 + (i % 3) * 0.08;
    g.box(x, 0.2 + h / 2, D / 2 - 1.7, 0.38, h, 0.38, glaze[i % glaze.length]);
    g.box(x, 0.22 + h, D / 2 - 1.7, 0.24, 0.06, 0.24, shade(glaze[i % glaze.length], 0.8));
  }
  // a lantern hung from the front beam (lit at night with the street lamps)
  g.box(-1.5, 2.75, D / 2 - 0.45, 0.04, 0.4, 0.04, C.iron);
  g.box(-1.5, 2.45, D / 2 - 0.45, 0.3, 0.3, 0.3, C.goldD);
  ctx.glows.push(g.tx + -1.5 * g.tc + (D / 2 - 0.45) * g.ts, 2.45, g.tz - -1.5 * g.ts + (D / 2 - 0.45) * g.tc);
  // the potter's wheel and stool, a heap of clay, a water bucket
  g.box(-4.2, 0.35, 0.6, 0.9, 0.7, 0.9, C.woodD);
  g.box(-4.2, 0.74, 0.6, 0.8, 0.08, 0.8, '#8E8173');
  g.box(-4.2, 0.86, 0.6, 0.4, 0.18, 0.4, '#C49A6F');
  g.box(-4.2, 0.24, 1.45, 0.4, 0.48, 0.4, C.wood);
  g.box(-7.4, 0.3, 0.9, 1.2, 0.6, 1.0, '#A57B55');
  g.box(-7.3, 0.66, 0.85, 0.7, 0.24, 0.6, '#B98E64');
  g.box(-2.4, 0.25, 1.2, 0.44, 0.5, 0.44, '#7F8C99');
  g.box(-2.4, 0.47, 1.2, 0.38, 0.04, 0.38, C.sky);
  // the kiln: a brick dome, a dark mouth, a chimney
  const kx = 7.2;
  for (let k = 0; k < 5; k++) {
    const s = 3.0 - k * 0.5;
    g.box(kx, 0.3 + k * 0.5, 0, s, 0.5, s * 0.92, k % 2 ? C.brickD : C.brick);
  }
  g.box(kx, 0.6, 1.45, 1.0, 1.0, 0.12, '#2B1E19');
  g.box(kx, 1.15, 1.48, 1.2, 0.12, 0.14, C.goldD);
  g.box(kx + 0.8, 3.0, -0.4, 0.5, 1.6, 0.5, C.brickD);
  g.box(kx + 0.8, 3.85, -0.4, 0.62, 0.1, 0.62, C.brick);
  g.box(kx - 1.9, 0.2, 1.3, 0.9, 0.4, 0.5, C.woodD); // firewood by the mouth
  ctx.smoke.push(g.tx + (kx + 0.8) * g.tc, 4.0, g.tz - (kx + 0.8) * g.ts - 0.4 * g.tc);
  ctx.signs.push({ x: -1.5, y: 3.65, z: D / 2 + 0.56, w: 2.6, h: 0.65, lines: [{ text: 'အိုးလုပ်တဲ', size: 46 }, { text: "Potter's yard", size: 22, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: '#F6F0E2' });
}

function stage(g, f, it, ctx) {
  const W = it.w, D = it.d, P = 1.0;
  f.flat(-W / 2 - 0.3, -D / 2 - 0.3, W / 2 + 0.6, D / 2 + 0.6, 0.004, C.shadow);
  g.box(0, P / 2, 0, W, P, D, C.wood);
  for (let x = -W / 2 + 0.3; x < W / 2; x += 0.6) g.box(x, P + 0.01, 0, 0.04, 0.02, D, C.woodD);
  g.box(0, P - 0.1, D / 2 + 0.02, W + 0.04, 0.12, 0.06, C.gold);
  for (let x = -W / 2 + 0.4; x < W / 2; x += 0.8) g.box(x, 0.45, D / 2 + 0.03, 0.4, 0.4, 0.04, C.maroon); // panels
  for (let k = 0; k < 3; k++) g.box(-W / 2 + 1.2, 0.17 + k * 0.33, D / 2 + 0.9 - k * 0.3, 1.4, 0.1, 0.32, C.woodL); // steps
  // posts, a top beam with a scalloped gold valance, the back curtain in folds
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (W / 2 - 0.15), P + 1.7, sz * (D / 2 - 0.15), 0.22, 3.4, 0.22, sz > 0 ? C.goldD : C.woodD);
  g.box(0, P + 3.45, D / 2 - 0.15, W + 0.2, 0.3, 0.3, C.maroon);
  for (let x = -W / 2 + 0.3; x < W / 2; x += 0.6) g.box(x, P + 3.18, D / 2 - 0.06, 0.5, 0.26, 0.06, C.gold);
  g.box(0, P + 3.45, 0, W, 0.2, D - 0.2, C.maroonD);
  for (let i = 0; i < Math.round(W / 0.45); i++) g.box(-W / 2 + 0.25 + i * 0.45, P + 1.6, -D / 2 + 0.3, 0.46, 3.2, i % 2 ? 0.16 : 0.24, i % 2 ? C.maroon : shade(C.maroon, 1.18));
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) g.box(sx * (W / 2 - 0.6 - i * 0.36), P + 1.6, D / 2 - 0.5, 0.4, 3.0, 0.14, i % 2 ? C.maroon : shade(C.maroon, 1.15));
  // footlights
  for (let x = -W / 2 + 0.8; x < W / 2 - 0.5; x += 1.2) g.box(x, P + 0.08, D / 2 - 0.15, 0.24, 0.14, 0.18, '#F7D774');
  // bunting from the front posts out to two poles
  for (const sx of [-1, 1]) g.box(sx * (W / 2 + 2.2), 1.7, D / 2 + 0.4, 0.1, 3.4, 0.1, C.goldD);
  const cols = [C.maroon, C.gold, C.white, C.rose, '#4E8C86'];
  for (const sx of [-1, 1]) {
    const x0 = sx * (W / 2 - 0.15), x1 = sx * (W / 2 + 2.2);
    for (let k = 0; k < 5; k++) {
      const t = (k + 0.5) / 5, x = x0 + (x1 - x0) * t, y = P + 3.3 - (1.0 + 0.4 * Math.sin(Math.PI * t)) * 0.5 - (P + 3.3 - 3.3) * t;
      g.boxR(x, y - 0.12, D / 2 + 0.25, 0.22, 0.28, 0.02, cols[(k + (sx > 0 ? 2 : 0)) % 5], 0, 0, Math.PI / 4);
    }
  }
  ctx.signs.push({ x: 0, y: P + 3.45, z: D / 2 + 0.02, w: 3.2, h: 0.62, lines: [{ text: 'ရပ်ကွက် ဇာတ်စင်', size: 44, color: '#FFFDF8' }], bg: '#6E1F2A', border: '#C9A24A' });
}

function bookSign(g, f, it, ctx) {
  // a giant exercise book standing open, the Quarter's name on its right page
  g.box(0, 0.15, 0, 3.8, 0.3, 1.4, C.goldD);
  g.box(0, 0.34, 0, 3.6, 0.08, 1.2, C.gold);
  for (const sx of [-1, 1]) {
    const ry = sx * 0.32;
    g.boxR(sx * 0.86, 1.45, 0.05, 1.7, 2.1, 0.08, '#5E7FA8', 0, ry, 0); // cover
    g.boxR(sx * 0.84, 1.45, 0.1, 1.62, 2.0, 0.06, C.white, 0, ry, 0); // page
    for (let k = 0; k < 6; k++) g.boxR(sx * 0.84, 0.75 + k * 0.28, 0.135, 1.5, 0.02, 0.01, C.rule, 0, ry, 0);
  }
  g.box(0, 1.45, 0.02, 0.12, 2.1, 0.12, '#4A6A90');
  ctx.signs.push({ x: 0.86, y: 1.55, z: 0.62, ry: 0.32, w: 1.5, h: 1.15, lines: [{ text: 'ဗလာစာအုပ်', size: 46 }, { text: 'ရပ်', size: 46 }, { text: 'Exercise-Book Quarter', size: 20, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: null, border: null, width: 512, height: 400 });
  ctx.signs.push({ x: -0.86, y: 1.55, z: 0.62, ry: -0.32, w: 1.5, h: 1.15, lines: [{ text: '၁ + ၁ = ၂', size: 54, color: '#2F5DB3' }, { text: 'က ခ ဂ ဃ င', size: 44, color: '#2F5DB3' }], bg: null, border: null, width: 512, height: 400 });
  f.flat(-2.1, -0.9, 2.3, 1.0, 0.005, C.shadow);
}

function borderSign(g, f, it, ctx) {
  for (const sx of [-1.6, 1.6]) { g.box(sx, 1.3, 0, 0.18, 2.6, 0.18, C.woodD); g.box(sx, 0.12, 0, 0.36, 0.24, 0.36, C.parch); }
  g.box(0, 2.0, -0.02, 3.6, 1.2, 0.12, C.woodD);
  g.boxR(0, 2.82, -0.05, 3.9, 0.08, 0.6, C.maroon, 0.2, 0, 0);
  g.box(2.15, 1.25, 0.02, 0.8, 0.34, 0.08, C.gold); // arrow board pointing on (south-east, along the road)
  g.boxR(2.65, 1.25, 0.02, 0.3, 0.3, 0.08, C.gold, 0, 0, Math.PI / 4);
  ctx.signs.push({ x: 0, y: 2.0, z: 0.05, w: 3.4, h: 1.05, lines: [{ text: 'ဗလာစာအုပ်ရပ် ဒီမှာ ဆုံးတယ်', size: 30 }, { text: 'ရှေ့ဆက် → စာအိတ်ဈေး', size: 38, color: '#6E1F2A' }, { text: 'Envelope Market ahead', size: 20, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: '#F6F0E2', width: 640, height: 200 });
  f.flat(-2, -0.4, 2.2, 0.6, 0.005, C.shadowEnv);
}

function pageEnd(g, f, it, ctx) {
  // The road runs out onto a blank page: this part of the world is not written yet. A turning ring
  // painted where the road stops, a big empty sheet lying on the paper with its far edge curling up,
  // a giant quill resting on it beside a spilt drop of ink, and the sign.
  const r = rng(9);
  // the turning ring at the road's end (local z -2.6)
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2;
    f.flatR(Math.sin(a) * 2.5, -2.6 + Math.cos(a) * 2.5, 0.5, 0.16, ROADTOP + 0.012, k % 2 ? C.gold : C.goldD, a + Math.PI / 2);
  }
  // the blank sheet: white, a faint pink margin, no writing at all
  f.flat(-4.6, -0.6, 4.6, 3.6, 0.012, '#FFFDF8');
  f.flat(-3.7, -0.6, -3.62, 3.6, 0.016, C.margin);
  for (let z = 0.4; z < 3.5; z += 0.9) f.flat(-4.4, z, 4.4, z + 0.03, 0.016, '#E4ECF3');
  // its far edge curls up toward the clouds
  for (let k = 0; k < 4; k++) g.boxR(0, 0.08 + k * 0.22, 3.62 + k * 0.16 - (k > 2 ? 0.12 : 0), 9.2, 0.05, 0.36, k % 2 ? '#FFFDF8' : '#F6F0E2', -0.35 - k * 0.42, 0, 0);
  // loose leaves blown against the curl
  for (let i = 0; i < 5; i++) g.boxR(-3.6 + i * 1.8 + (r() - 0.5) * 0.4, 0.04, 2.6 + r() * 0.6, 0.8, 0.02, 1.0, i % 2 ? C.white : '#F6F0E2', 0, (r() - 0.5) * 0.9, (r() - 0.5) * 0.1);
  // the giant quill lying across the sheet, nib in a fresh drop of ink
  const qa = 0.5;
  const qx = (u) => -0.6 + Math.cos(qa) * u, qz = (u) => 1.4 - Math.sin(qa) * u;
  for (let i = 0; i < 9; i++) g.boxR(qx(-1.6 + i * 0.5), 0.09, qz(-1.6 + i * 0.5), 0.52, 0.08, 0.09, i < 2 ? C.goldD : '#F3E9D6', 0, qa, 0);
  for (let i = 0; i < 6; i++) {
    const u = 0.6 + i * 0.5, w = 0.34 + Math.sin((i + 1) / 7 * Math.PI) * 0.4;
    g.boxR(qx(u), 0.07, qz(u), 0.5, 0.05, w * 2, i % 2 ? C.white : C.cream, 0, qa, 0);
  }
  g.boxR(qx(-2.0), 0.08, qz(-2.0), 0.36, 0.07, 0.07, C.gold, 0, qa, 0);
  f.flatR(qx(-2.6), qz(-2.6), 0.9, 0.7, 0.02, C.ink, 0.3);
  f.flatR(qx(-2.9), qz(-2.2), 0.3, 0.26, 0.02, C.ink, 0.9);
  // the ink pot, open
  g.box(-3.6, 0.3, 0.6, 0.6, 0.6, 0.6, C.ink);
  g.box(-3.6, 0.64, 0.6, 0.4, 0.08, 0.4, C.gold);
  // the sign on two posts at the sheet's near edge
  for (const sx of [-1.2, 1.2]) g.box(sx, 1.0, -0.2, 0.1, 2.0, 0.1, C.woodD);
  ctx.signs.push({ x: 0, y: 1.7, z: -0.13, w: 2.6, h: 0.75, lines: [{ text: 'ဒီစာမျက်နှာ မရေးရသေးဘူး', size: 36 }, { text: 'This page is not written yet', size: 20, font: 'serif', weight: 600, color: '#6E1F2A' }], bg: '#FFFDF8', width: 560, height: 160 });
}

/** A postage stamp printed on the envelope paper (a flat decal, perforated edge, a little picture). */
function stamp(g, f, it) {
  const r = rng(it.seed || 1), W = 1.6, H = 2.0;
  const ink = [C.maroon, C.teal, '#2F5DB3', C.terra][Math.floor(r() * 4)];
  f.flat(-W / 2, -H / 2, W / 2, H / 2, 0.006, C.white);
  for (let k = 0; k < 6; k++) { // perforations: little bites out of the edge
    const u = -W / 2 + 0.15 + k * ((W - 0.3) / 5), v = -H / 2 + 0.15 + k * ((H - 0.3) / 5);
    for (const sd of [-1, 1]) { f.flatR(u, sd * H / 2, 0.12, 0.12, 0.008, C.envelope); f.flatR(sd * W / 2, v, 0.12, 0.12, 0.008, C.envelope); }
  }
  f.flat(-W / 2 + 0.2, -H / 2 + 0.2, W / 2 - 0.2, H / 2 - 0.2, 0.008, ink);
  f.flat(-W / 2 + 0.3, -H / 2 + 0.3, W / 2 - 0.3, H / 2 - 0.6, 0.01, C.cream); // a picture: a padauk sprig
  f.flatR(0, -0.3, 0.42, 0.42, 0.012, C.mustard, 0.785);
  f.flatR(0, 0.15, 0.08, 0.5, 0.012, C.woodD);
  f.flat(-W / 2 + 0.3, H / 2 - 0.5, W / 2 - 0.3, H / 2 - 0.42, 0.012, C.cream); // the value line
  void g;
}
/** A wax seal: a squat maroon disc with a raised rim and a stamped flower. */
function seal(g, f) {
  f.flatR(0.3, -0.2, 1.7, 1.5, 0.006, C.shadowEnv, 0.4);
  for (let k = 0; k < 4; k++) g.boxR(0, 0.08, 0, 1.3, 0.16, 0.54, k % 2 ? C.maroon : C.maroonD, 0, (k * Math.PI) / 4, 0);
  for (let k = 0; k < 2; k++) g.boxR(0, 0.2, 0, 0.8, 0.1, 0.36, C.maroon, 0, (k * Math.PI) / 2 + 0.4, 0);
  g.box(0, 0.27, 0, 0.26, 0.05, 0.26, shade(C.maroon, 1.25));
}
/** A tied parcel waiting by the road. */
function parcel(g, f, it) {
  const r = rng(it.seed || 3), w = 0.8 + r() * 0.5, d = 0.6 + r() * 0.3, h = 0.45 + r() * 0.3;
  f.flatR(0.15, -0.1, w + 0.4, d + 0.3, 0.006, C.shadowEnv);
  g.box(0, h / 2, 0, w, h, d, '#C9A57A');
  g.box(0, h / 2, 0, 0.06, h + 0.02, d + 0.02, C.maroon);
  g.box(0, h / 2, 0, w + 0.02, h + 0.02, 0.06, C.maroon);
  g.box(0, h + 0.03, 0, 0.2, 0.06, 0.2, C.maroon);
  g.box(0.22, h + 0.005, d / 4, 0.24, 0.01, 0.18, C.white);
}

/** Bookmark Desk base (desks.js adds the ribbon and the lamp core): a writing desk under a lamp post. */
export function deskBase(g, ctx) {
  g.box(0, 0.74, 0, 1.25, 0.08, 0.65, C.woodL);
  g.box(0, 0.68, 0.3, 1.25, 0.06, 0.06, C.goldD);
  for (const sx of [-0.55, 0.55]) for (const sz of [-0.26, 0.26]) g.box(sx, 0.35, sz, 0.08, 0.7, 0.08, C.woodD);
  g.box(0.4, 0.55, 0, 0.36, 0.3, 0.56, C.wood); // drawer
  g.box(0.4, 0.55, 0.29, 0.1, 0.04, 0.03, C.gold);
  // an open notebook, inkpot and quill on top
  for (const sx of [-1, 1]) g.boxR(sx * 0.17 - 0.1, 0.8, 0.02, 0.32, 0.03, 0.42, C.white, 0, 0, sx * -0.05);
  g.box(0.36, 0.84, -0.12, 0.12, 0.12, 0.12, C.ink);
  g.box(0.36, 0.91, -0.12, 0.08, 0.03, 0.08, C.gold);
  g.boxR(0.38, 1.0, -0.1, 0.03, 0.34, 0.03, C.white, 0.3, 0, -0.35);
  // a small chair
  g.box(0, 0.42, -0.62, 0.48, 0.06, 0.44, C.wood);
  for (const sx of [-0.2, 0.2]) for (const sz of [-0.82, -0.42]) g.box(sx, 0.2, sz, 0.06, 0.4, 0.06, C.woodD);
  g.box(0, 0.72, -0.84, 0.48, 0.5, 0.06, C.wood);
  // the lamp post at its west end
  g.at(g.tx - Math.cos(g.ry) * 1.0, g.tz + Math.sin(g.ry) * 1.0, g.ry, g.ty);
  lamp(g, ctx);
}

// ---------------------------------------------------------------------------------
// Ground: the paper of each district (its kind from region data), page edges and clouds, holes (the
// cloud-stream), the roads, bridges and gates
// ---------------------------------------------------------------------------------
function clip(a0, a1, b0, b1) { return [Math.max(a0, b0), Math.min(a1, b1)]; }

/** rect minus holes -> axis-aligned pieces of paper */
function pieces(rect, holes) {
  let out = [rect];
  for (const h of holes) {
    const next = [];
    for (const p of out) {
      const [x0, z0, x1, z1] = p;
      if (h[2] <= x0 || h[0] >= x1 || h[3] <= z0 || h[1] >= z1) { next.push(p); continue; }
      const hx0 = Math.max(h[0], x0), hx1 = Math.min(h[2], x1), hz0 = Math.max(h[1], z0), hz1 = Math.min(h[3], z1);
      if (hz0 > z0) next.push([x0, z0, x1, hz0]);
      if (hz1 < z1) next.push([x0, hz1, x1, z1]);
      if (hx0 > x0) next.push([x0, hz0, hx0, hz1]);
      if (hx1 < x1) next.push([hx1, hz0, x1, hz1]);
    }
    out = next;
  }
  return out;
}

/** The base colour of each paper (the map and the torn crease use it too). */
export const PAPER = {
  ruled: C.paper, envelope: C.envelope, letter: '#FAF5E9', ledger: '#F3ECD5', newsprint: '#ECE8DE', parchment: '#F0E1BD', diary: '#F7EEE2', blank: '#FCFAF5',
};
const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

function hRules(f, gx0, gz0, gx1, gz1, step, w, y, col, rz0, rz1, phase = 0) {
  for (let z = Math.ceil((gz0 - phase) / step) * step + phase; z < gz1; z += step) {
    if (Math.abs(z - rz0) < 0.5 || Math.abs(z - rz1) < 0.5) continue;
    f.flat(gx0, z - w / 2, gx1, z + w / 2, y, col);
  }
}
function vRule(f, x, gz0, gx0, gz1, gx1, w, y, col) { if (x - w / 2 >= gx0 && x + w / 2 <= gx1) f.flat(x - w / 2, gz0, x + w / 2, gz1, y, col); }

// Each painter fills one piece of paper (gx0..gx1, gz0..gz1, already clipped to the chunk) with its
// pattern; reg.rect gives the whole sheet (margins, creases and columns line up across chunks).
const PAINT = {
  ruled(f, reg, gx0, gz0, gx1, gz1) {
    const [rx0, rz0, , rz1] = reg.rect;
    hRules(f, gx0, gz0, gx1, gz1, 1.5, 0.06, 0.003, C.rule, rz0, rz1);
    // the red margin of an exercise book, down the west side
    vRule(f, rx0 + 6, gz0, gx0, gz1, gx1, 0.1, 0.004, C.margin);
    vRule(f, rx0 + 6.21, gz0, gx0, gz1, gx1, 0.06, 0.004, C.margin);
  },
  envelope(f, reg, gx0, gz0, gx1, gz1) {
    // envelope folds: a V from the two top corners to the middle, and the side flaps
    const [rx0, rz0, rx1, rz1] = reg.rect, cx = (rx0 + rx1) / 2, cz = rz0 + (rz1 - rz0) * 0.42;
    const lines = [[rx0, rz0, cx, cz], [rx1, rz0, cx, cz], [rx0, rz1, cx, cz + 10], [rx1, rz1, cx, cz + 10]];
    for (const [ax, az, bx, bz] of lines) {
      const len = Math.hypot(bx - ax, bz - az), n = Math.ceil(len / 2);
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n;
        const px = ax + (bx - ax) * (t0 + t1) / 2, pz = az + (bz - az) * (t0 + t1) / 2;
        if (px < gx0 || px >= gx1 || pz < gz0 || pz >= gz1) continue;
        f.flatR(px, pz, len / n + 0.02, 0.12, 0.003, C.envLine, Math.atan2(-(bz - az), bx - ax));
      }
    }
    for (let z = Math.ceil(gz0 / 6) * 6; z < gz1; z += 6) for (let x = Math.ceil(gx0 / 6) * 6; x < gx1; x += 6) if (((x + z) / 6) % 3 === 0 && x + 1.7 < gx1 && z + 2.2 < gz1) f.flatR(x + 1.5, z + 2, 0.4, 0.4, 0.003, C.envDark, 0.5);
  },
  letter(f, reg, gx0, gz0, gx1, gz1, r) {
    // writing paper: faint lines with faded handwriting on them, and the creases it was folded along
    const [rx0, rz0, rx1, rz1] = reg.rect;
    hRules(f, gx0, gz0, gx1, gz1, 2.4, 0.05, 0.003, '#E6DDCB', rz0, rz1, 1.2);
    for (let z = Math.ceil((gz0 - 1.2) / 2.4) * 2.4 + 1.2; z < gz1; z += 2.4) {
      if (z - 0.45 < gz0) continue;
      for (let x = gx0 + r() * 2; x < gx1 - 0.8;) {
        const len = 0.5 + r() * 1.6;
        if (r() < 0.45) f.flat(x, z - 0.4, Math.min(gx1, x + len), z - 0.31, 0.004, '#DDD6CA');
        x += len + 0.35 + r() * 1.4;
      }
    }
    const cr = reg.creases || { x: [(rx0 + rx1) / 2], z: [rz0 + (rz1 - rz0) / 3, rz0 + (2 * (rz1 - rz0)) / 3] };
    for (const z of cr.z || []) if (z > gz0 + 0.4 && z < gz1 - 0.4) {
      f.flat(gx0, z - 0.45, gx1, z + 0.45, 0.0045, '#F1EADA');
      f.flat(gx0, z - 0.07, gx1, z + 0.02, 0.005, '#D8CCB2');
      f.flat(gx0, z + 0.02, gx1, z + 0.1, 0.005, '#FFFDF6');
    }
    for (const x of cr.x || []) if (x > gx0 + 0.4 && x < gx1 - 0.4) {
      f.flat(x - 0.45, gz0, x + 0.45, gz1, 0.0047, '#F1EADA');
      f.flat(x - 0.07, gz0, x + 0.02, gz1, 0.0052, '#D8CCB2');
      f.flat(x + 0.02, gz0, x + 0.1, gz1, 0.0052, '#FFFDF6');
    }
  },
  ledger(f, reg, gx0, gz0, gx1, gz1) {
    // an account book: blue rules across, money columns ruled down in blue, a red double rule every fourth
    const [rx0, rz0, rx1, rz1] = reg.rect;
    hRules(f, gx0, gz0, gx1, gz1, 1.5, 0.05, 0.003, '#C8D6E0', rz0, rz1, 0.75);
    hRules(f, gx0, gz0, gx1, gz1, 12, 0.12, 0.0035, '#BACBD8', rz0, rz1, 6.75);
    for (let k = 0, x = rx0 + 7; x < rx1 - 1; k++, x += 5) {
      if (k % 4 === 0) { vRule(f, x - 0.13, gz0, gx0, gz1, gx1, 0.06, 0.004, '#DFA39C'); vRule(f, x + 0.13, gz0, gx0, gz1, gx1, 0.06, 0.004, '#DFA39C'); }
      else vRule(f, x, gz0, gx0, gz1, gx1, 0.05, 0.004, '#BFCFDC');
    }
  },
  newsprint(f, reg, gx0, gz0, gx1, gz1, r) {
    // a newspaper sheet: columns of grey type, column rules, a headline and a photo block now and then
    const [rx0, rz0] = reg.rect;
    const CW = 9, G = 1.0, LH = 0.75;
    for (let c = Math.floor((gx0 - rx0 - 3) / CW) - 1; ; c++) {
      const cx0 = rx0 + 3 + c * CW, cx1 = cx0 + CW - G;
      if (cx0 > gx1) break;
      if (cx1 < gx0) continue;
      const a = Math.max(cx0, gx0), b = Math.min(cx1, gx1);
      vRule(f, cx1 + G / 2, gz0, gx0, gz1, gx1, 0.05, 0.004, '#C8C2B4');
      for (let z = Math.ceil((gz0 - rz0) / LH) * LH + rz0 + 0.3; z < gz1 - 0.3; z += LH) {
        const blk = Math.floor((z - rz0) / 30), inBlk = (z - rz0) - blk * 30;
        const kind = hash(c, blk);
        if (inBlk < 2.4 && kind < 0.5) { // a headline over two columns
          if (inBlk < 1.6 && Math.floor(inBlk / 0.8) % 2 === 0) f.flat(a, z - 0.32, b, z + 0.12, 0.004, '#B9B2A4');
          continue;
        }
        if (inBlk > 6 && inBlk < 12.5 && kind > 0.72) { // a photo block
          if (inBlk < 6.8) f.flat(a + 0.2, z - 0.3, b - 0.2, z + 0.45, 0.004, '#CFC9BB');
          else f.flat(a + 0.2, z - 0.3, b - 0.2, z + 0.45, 0.004, (Math.floor(z * 1.33) % 3 ? '#DCD6C8' : '#D3CCBD'));
          continue;
        }
        const para = Math.floor((z - rz0) / LH) % 9;
        if (para === 8) continue;
        const end = para === 7 ? a + (b - a) * (0.3 + hash(z, c) * 0.4) : b;
        for (let x = a + (para === 0 ? 0.6 : 0); x < end - 0.3;) {
          const len = Math.min(end - x, 1.2 + r() * 2.6);
          f.flat(x, z - 0.1, x + len, z + 0.1, 0.004, '#D7D2C6');
          x += len + 0.25;
        }
      }
    }
  },
  parchment(f, reg, gx0, gz0, gx1, gz1, r) {
    // old parchment: soft mottling in warmer and paler patches, and long fibres
    // (each patch a soft stack: a wide faint wash, a smaller deeper heart, never two patches overlapping)
    const cell = 10;
    for (let z = Math.floor(gz0 / cell) * cell; z < gz1; z += cell) for (let x = Math.floor(gx0 / cell) * cell; x < gx1; x += cell) {
      const h = hash(x, z);
      if (h < 0.3) continue;
      const w = 4.5 + h * 3.5, d = 3 + hash(z, x) * 3.5, ry = hash(x + 7, z) * 3;
      const cx = x + cell / 2 + (hash(x + 1, z) - 0.5) * 1.2, cz = z + cell / 2 + (hash(x, z + 1) - 0.5) * 1.2;
      if (cx - w / 2 < gx0 || cx + w / 2 > gx1 || cz - d / 2 < gz0 || cz + d / 2 > gz1) continue;
      const warm = h > 0.62;
      f.flatR(cx, cz, w, d, 0.0016, warm ? '#EDDDB6' : '#F3E6C6', ry);
      f.flatR(cx + 0.3, cz - 0.2, w * 0.55, d * 0.5, 0.0024, warm ? '#EAD8AE' : '#F5EACF', ry + 0.4);
    }
    const n = Math.round((gx1 - gx0) * (gz1 - gz0) / 160);
    for (let k = 0; k < n; k++) {
      const len = 1.5 + r() * 3.5, x = gx0 + 2 + r() * Math.max(0, gx1 - gx0 - 4), z = gz0 + 2 + r() * Math.max(0, gz1 - gz0 - 4);
      f.flatR(x, z, len, 0.05, 0.003, '#E6D3A8', (r() - 0.5) * 0.6);
    }
  },
  diary(f, reg, gx0, gz0, gx1, gz1) {
    // a diary's page: rose-brown rules, a double margin, a printed date heading every so often, the gutter
    const [rx0, rz0, rx1, rz1] = reg.rect;
    hRules(f, gx0, gz0, gx1, gz1, 1.5, 0.05, 0.003, '#EAD2C6', rz0, rz1);
    vRule(f, rx0 + 6, gz0, gx0, gz1, gx1, 0.08, 0.004, '#E2A9A3');
    vRule(f, rx0 + 6.22, gz0, gx0, gz1, gx1, 0.05, 0.004, '#E2A9A3');
    const mid = (rx0 + rx1) / 2;
    if (mid - 0.6 > gx0 && mid + 0.6 < gx1) f.flat(mid - 0.6, gz0, mid + 0.6, gz1, 0.0035, '#EFE2D2');
    for (let z = rz0 + 12; z < rz1 - 4; z += 30) {
      if (z - 0.8 < gz0 || z + 0.2 > gz1) continue;
      f.flat(gx0, z - 0.05, gx1, z + 0.07, 0.0045, '#D9A9A0');
      for (const px of [rx0 + 8.5, mid + 3]) if (px > gx0 && px + 5 < gx1) {
        f.flat(px, z - 0.75, px + 0.55, z - 0.2, 0.005, '#B5545A');
        f.flat(px + 0.8, z - 0.62, px + 3.2, z - 0.42, 0.005, '#CFA39A');
        f.flat(px + 3.5, z - 0.62, px + 4.6, z - 0.42, 0.005, '#CFA39A');
      }
    }
  },
  blank(f, reg, gx0, gz0, gx1, gz1) {
    // almost nothing: a fleck of grain here and there
    for (let z = Math.ceil(gz0 / 9) * 9; z < gz1; z += 9) for (let x = Math.ceil(gx0 / 9) * 9; x < gx1; x += 9) {
      if (hash(x, z) < 0.55) continue;
      const cx = x + hash(z, x) * 7, cz = z + hash(x + 3, z) * 7;
      if (cx < gx1 - 0.3 && cz < gz1 - 0.3) f.flatR(cx, cz, 0.6 + hash(cx, cz), 0.06, 0.002, '#F1ECE0', hash(z, cx) * 3);
    }
  },
};

function groundRegion(f, reg, x0, z0, x1, z1, extraHoles) {
  const [rx0, rz0, rx1, rz1] = reg.rect;
  if (rx1 <= x0 || rx0 >= x1 || rz1 <= z0 || rz0 >= z1) return;
  const paint = PAINT[reg.paper] || PAINT.blank;
  const r = rng(Math.round(x0 * 31 + z0 * 7 + rx0));
  f.at(0, 0, 0);
  for (const [px0, pz0, px1, pz1] of pieces(reg.rect, [...(reg.holes || []), ...extraHoles])) {
    const [gx0, gx1] = clip(px0, px1, x0, x1), [gz0, gz1] = clip(pz0, pz1, z0, z1);
    if (gx1 - gx0 <= 0 || gz1 - gz0 <= 0) continue;
    gk(f, GK.paper);
    f.flat(gx0, gz0, gx1, gz1, 0, PAPER[reg.paper] || PAPER.blank);
    gk(f, GK.mark);
    paint(f, reg, gx0, gz0, gx1, gz1, r);
  }
  gk(f, GK.decal);
  // the cloud-stream under a hole: puffs drifting far below the paper
  if (reg.stream) for (const h of reg.holes || []) {
    const [gx0, gx1] = clip(h[0], h[2], x0, x1), [gz0, gz1] = clip(h[1], h[3], z0, z1);
    if (gx1 - gx0 <= 0 || gz1 - gz0 <= 0) continue;
    const n = Math.round((gx1 - gx0) * (gz1 - gz0) / 75);
    for (let k = 0; k < n; k++) {
      const sz = 2 + r() * 2.6, y = -3.4 - r() * 2.6;
      f.at(gx0 + r() * (gx1 - gx0), gz0 + r() * (gz1 - gz0), r() * 0.8);
      f.box(0, y, 0, sz * 1.7, sz * 0.5, sz * 1.1, C.cloudMid);
      f.box(sz * 0.3, y + sz * 0.35, -0.1, sz * 0.9, sz * 0.45, sz * 0.8, C.cloud);
      f.box(-sz * 0.45, y + sz * 0.22, 0.2, sz * 0.7, sz * 0.4, sz * 0.6, C.cloud);
      f.box(0, y - sz * 0.32, 0, sz * 1.3, sz * 0.18, sz * 0.9, C.cloudLow);
    }
    f.at(0, 0, 0);
  }
}

/** The sides of a region that can be page edges: its rim, and the sides of its holes (facing into them). */
function sidesOf(reg) {
  const [rx0, rz0, rx1, rz1] = reg.rect;
  const s = [
    { horiz: true, a: rz0, s0: rx0, s1: rx1, out: -1, rim: true }, { horiz: true, a: rz1, s0: rx0, s1: rx1, out: 1, rim: true },
    { horiz: false, a: rx0, s0: rz0, s1: rz1, out: -1, rim: true }, { horiz: false, a: rx1, s0: rz0, s1: rz1, out: 1, rim: true },
  ];
  for (const h of reg.holes || []) {
    if (h[1] > rz0 + 0.01) s.push({ horiz: true, a: h[1], s0: h[0], s1: h[2], out: 1 });
    if (h[3] < rz1 - 0.01) s.push({ horiz: true, a: h[3], s0: h[0], s1: h[2], out: -1 });
    if (h[0] > rx0 + 0.01) s.push({ horiz: false, a: h[0], s0: h[1], s1: h[3], out: 1 });
    if (h[2] < rx1 - 0.01) s.push({ horiz: false, a: h[2], s0: h[1], s1: h[3], out: -1 });
  }
  return s;
}
function cutSpan(pieces, c0, c1) {
  for (let i = pieces.length - 1; i >= 0; i--) {
    const [p0, p1] = pieces[i];
    if (c1 <= p0 || c0 >= p1) continue;
    pieces.splice(i, 1);
    if (c0 > p0) pieces.push([p0, c0]);
    if (c1 < p1) pieces.push([c1, p1]);
  }
}

/** Page edges and clouds along each region side that no other region shares (and round its holes). */
function regionEdges(f, reg, x0, z0, x1, z1) {
  const r = rng(Math.round(reg.rect[0] * 7 + reg.rect[1] * 13 + x0 + z0 * 3));
  for (const sd of sidesOf(reg)) {
    const { horiz, a: at, out } = sd;
    if (horiz ? at < z0 || at >= z1 : at < x0 || at >= x1) continue;
    const [s0, s1] = horiz ? clip(sd.s0, sd.s1, x0, x1) : clip(sd.s0, sd.s1, z0, z1);
    if (s1 <= s0) continue;
    const pieces = [[s0, s1]];
    const seams = [];
    if (sd.rim) {
      for (const o of REGIONS) {
        if (o === reg) continue;
        const [ox0, oz0, ox1, oz1] = o.rect;
        const touches = horiz ? (Math.abs(oz0 - at) < 0.01 || Math.abs(oz1 - at) < 0.01) : (Math.abs(ox0 - at) < 0.01 || Math.abs(ox1 - at) < 0.01);
        if (!touches) continue;
        const [c0, c1] = horiz ? [ox0, ox1] : [oz0, oz1];
        cutSpan(pieces, c0, c1);
        if (out < 0) seams.push(clip(c0, c1, s0, s1));
      }
      // a hole that reaches the rim: no paper there, so no edge either
      for (const h of reg.holes || []) {
        const onRim = horiz ? (Math.abs(h[1] - at) < 0.01 || Math.abs(h[3] - at) < 0.01) : (Math.abs(h[0] - at) < 0.01 || Math.abs(h[2] - at) < 0.01);
        if (onRim) cutSpan(pieces, horiz ? h[0] : h[1], horiz ? h[2] : h[3]);
      }
    }
    // where two papers meet: a fine seam, like the join of two sheets (drawn once, from the south/east sheet)
    gk(f, GK.mark);
    for (const [c0, c1] of seams) {
      if (c1 - c0 <= 0) continue;
      if (horiz) f.flat(c0, at - 0.05, c1, at + 0.05, 0.0042, '#DDD2BA');
      else f.flat(at - 0.05, c0, at + 0.05, c1, 0.0042, '#DDD2BA');
    }
    gk(f, GK.decal);
    for (const [p0, p1] of pieces) {
      const layers = [[0, -0.22, C.edge1], [-0.22, -0.48, C.edge2], [-0.48, -0.74, C.edge1], [-0.74, -1.0, C.edge3]];
      for (const [y0, y1, col] of layers) {
        if (horiz) f.quad([p0, y0, at], [p1, y0, at], [p1, y1, at], [p0, y1, at], col, 0, 0, out);
        else f.quad([at, y0, p0], [at, y0, p1], [at, y1, p1], [at, y1, p0], col, out, 0, 0);
      }
      // cover underneath, sticking out a little
      const lip = 0.5;
      if (horiz) {
        f.quad([p0, -1.0, at], [p1, -1.0, at], [p1, -1.0, at + out * lip], [p0, -1.0, at + out * lip], C.cover, 0, 1, 0);
        f.quad([p0, -1.0, at + out * lip], [p1, -1.0, at + out * lip], [p1, -1.4, at + out * lip], [p0, -1.4, at + out * lip], C.coverDeep, 0, 0, out);
      } else {
        f.quad([at, -1.0, p0], [at, -1.0, p1], [at + out * lip, -1.0, p1], [at + out * lip, -1.0, p0], C.cover, 0, 1, 0);
        f.quad([at + out * lip, -1.0, p0], [at + out * lip, -1.0, p1], [at + out * lip, -1.4, p1], [at + out * lip, -1.4, p0], C.coverDeep, out, 0, 0);
      }
      // clouds tucked under the edge
      for (let s = p0 + 2 + r() * 3; s < p1 - 1; s += 5 + r() * 4) {
        const sz = 1.6 + r() * 1.4, off = out * (0.6 + r() * 2.2), y = -1.5 - r() * 0.8;
        const cx = horiz ? s : at + off, cz = horiz ? at + off : s;
        f.at(cx, cz, r() * 0.6);
        f.box(0, y, 0, sz * 1.6, sz * 0.5, sz * 1.1, C.cloudMid);
        f.box(sz * 0.3, y + sz * 0.35, -0.1, sz * 0.9, sz * 0.45, sz * 0.8, C.cloud);
        f.box(-sz * 0.4, y + sz * 0.25, 0.2, sz * 0.7, sz * 0.4, sz * 0.6, C.cloud);
        f.box(0, y - sz * 0.32, 0, sz * 1.3, sz * 0.18, sz * 0.9, C.cloudLow);
        f.at(0, 0, 0);
      }
    }
  }
}

// ---------------------------------------------------------------------------------
// Gates: a closed road looks closed (a striped boom across a bridge mouth, a torn split in the paper
// with a rope before it, or simply no road at all), and open when its flag is on. Never a marker.
// ---------------------------------------------------------------------------------
/** The torn split of a 'tear' gate (x0, z0, x1, z1 round gateAt): a hole in the paper while closed. */
export function tearRect(e) {
  const [gx, gz] = e.gateAt || [(e.xs[0] + e.xs[e.n - 1]) / 2, (e.zs[0] + e.zs[e.n - 1]) / 2];
  return [gx - 3.6, gz - 0.8, gx + 3.6, gz + 0.8];
}
const isClosed = (ctx, e) => !!e.gate && !(ctx.isOpen ? ctx.isOpen(e) : false);

/** Position (P) and unit tangent (T) at arc length s along an edge. */
function sampleAt(e, s, P, T) {
  let lo = 0, hi = e.n - 1;
  if (s <= 0) { lo = 0; hi = 1; } else if (s >= e.length) { lo = e.n - 2; hi = e.n - 1; } else {
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (e.cum[m] <= s) lo = m; else hi = m; }
  }
  const t = Math.min(1, Math.max(0, (s - e.cum[lo]) / (e.cum[hi] - e.cum[lo] || 1)));
  P.x = e.xs[lo] + (e.xs[hi] - e.xs[lo]) * t; P.z = e.zs[lo] + (e.zs[hi] - e.zs[lo]) * t;
  const tx = e.tx[lo] + (e.tx[hi] - e.tx[lo]) * t, tz = e.tz[lo] + (e.tz[hi] - e.tz[lo]) * t, l = Math.hypot(tx, tz) || 1;
  T.x = tx / l; T.z = tz / l;
}

const TRUSS = '#E7E1D3', TRUSS_D = '#C9C0AC', TRUSS_INK = '#5E574C', PIER = '#D9D1C0';
/** A paper-truss bridge's sides and piers (solids), along a 'deck' edge. */
function deckDressing(solidFor, e, x0, z0, x1, z1) {
  const P = { x: 0, z: 0 }, T = { x: 0, z: 0 }, W = (e.deck || 4.2) / 2;
  const north = (T) => (-T.z > 0 ? 1 : T.x === 0 ? 1 : -1); // which normal side is north (away from the camera)
  for (let s = 0.8, k = 0; s < e.length - 0.4; s += 1.6, k++) {
    sampleAt(e, s, P, T);
    if (P.x < x0 || P.x >= x1 || P.z < z0 || P.z >= z1) continue;
    const g = solidFor(P.x, P.z);
    const nx = -T.z, nz = T.x, ry = Math.atan2(-T.z, T.x);
    const sN = north(T);
    g.item(P.x, P.z, 0);
    // north side: a tall folded-paper truss (top chord, posts, alternating diagonals)
    let bx = P.x + nx * sN * (W - 0.12), bz = P.z + nz * sN * (W - 0.12);
    g.at(bx, bz, ry);
    g.box(0, 0.75, 0, 0.14, 1.3, 0.14, TRUSS);
    g.box(0, 1.42, 0, 1.62, 0.12, 0.18, TRUSS_D);
    g.boxR(0, 0.78, 0, 1.75, 0.08, 0.08, TRUSS, 0, 0, (k % 2 ? 1 : -1) * 0.66);
    g.box(0, 0.2, 0, 1.62, 0.1, 0.16, TRUSS_D);
    if (k % 3 === 0) g.box(0, 1.5, 0, 0.18, 0.06, 0.22, TRUSS_INK); // an ink-printed rivet line
    // south side (the camera's): only a low rail on short posts, so she is never hidden
    bx = P.x - nx * sN * (W - 0.12); bz = P.z - nz * sN * (W - 0.12);
    g.at(bx, bz, ry);
    g.box(0, 0.38, 0, 0.12, 0.56, 0.12, TRUSS);
    g.box(0, 0.62, 0, 1.62, 0.08, 0.1, TRUSS_D);
    // a pier into the clouds every ten metres, a cross-girder under every post
    g.at(P.x, P.z, ry);
    g.box(0, -0.42, 0, 0.18, 0.2, W * 2, TRUSS_D);
    if (k % 6 === 3) {
      for (const sd of [-1, 1]) g.box(0, -3.4, sd * (W - 0.5), 0.55, 6.2, 0.55, PIER);
      g.box(0, -1.2, 0, 0.4, 0.3, W * 2 - 0.6, PIER);
      g.box(0, -6.2, 0, 2.2, 0.7, W * 2 + 0.6, C.cloud);
    }
  }
}

/** Boom (bridge mouth), tear (the crease) and its rope or its twine. */
function gateDressing(solidFor, ground, e, open, x0, z0, x1, z1, ctx) {
  const P = { x: 0, z: 0 }, T = { x: 0, z: 0 }, W = ROAD.width / 2;
  if (e.look === 'boom') {
    sampleAt(e, Math.min(1.4, e.length / 2), P, T);
    if (P.x < x0 || P.x >= x1 || P.z < z0 || P.z >= z1) return;
    // across the road: from the pivot post on the north side (or east) to a rest on the other side
    let ax = -T.z, az = T.x;
    if (az > 0 || (az === 0 && ax < 0)) { ax = -ax; az = -az; } // (ax, az) points from the far side to the pivot side
    const half = (e.deck ? e.deck / 2 : W) + 0.35;
    const px = P.x + ax * half, pz = P.z + az * half;
    const g = solidFor(px, pz);
    g.item(px, pz, 0).at(px, pz, Math.atan2(az, -ax)); // local +X runs from the pivot across the road
    const STRIPE = ['#7A2430', '#F6F0E2'];
    g.box(0, 0.65, 0, 0.32, 1.3, 0.32, '#5A1820');
    g.box(0, 1.34, 0, 0.42, 0.1, 0.42, C.gold);
    g.box(0, 0.06, 0, 0.62, 0.12, 0.62, C.woodD);
    const L = half * 2 + 0.4;
    if (!open) {
      for (let k = 0, x = 0.2; x < L; k++, x += 0.5) g.box(x + 0.25, 1.08, 0, 0.5, 0.16, 0.16, STRIPE[k % 2]);
      g.box(-0.55, 1.08, 0, 0.6, 0.3, 0.3, C.iron); // the counterweight behind the pivot
      // the rest on the far side: a forked post the pole lies in
      g.box(L - 0.15, 0.48, 0, 0.18, 0.96, 0.18, '#5A1820');
      g.box(L - 0.15, 1.0, -0.12, 0.08, 0.2, 0.06, C.gold);
      g.box(L - 0.15, 1.0, 0.12, 0.08, 0.2, 0.06, C.gold);
      // a little paper pennant tied on the middle, and its knot
      g.box(L / 2, 0.86, 0, 0.06, 0.3, 0.06, '#C9B48A');
      g.boxR(L / 2 + 0.12, 0.68, 0, 0.3, 0.26, 0.02, '#F6E7B8', 0, 0, 0.12);
    } else {
      // raised: standing up from the pivot, the weight down by the post
      for (let k = 0, y = 1.25; y < 1.25 + L; k++, y += 0.5) g.box(0.0, y + 0.25, -0.24, 0.16, 0.5, 0.16, STRIPE[k % 2]);
      g.box(0, 0.75, -0.24, 0.3, 0.6, 0.3, C.iron);
      g.box(L - 0.15, 0.48, 0, 0.18, 0.96, 0.18, '#5A1820');
    }
    return;
  }
  if (e.look === 'tear') {
    const [tx0, tz0, tx1, tz1] = tearRect(e);
    const cx = (tx0 + tx1) / 2, cz = (tz0 + tz1) / 2;
    if (cx < x0 || cx >= x1 || cz < z0 || cz >= z1) return;
    const r = rng(Math.round(cx * 13 + cz * 7));
    const half = (tx1 - tx0) / 2, depth = (tz1 - tz0) / 2;
    const regN = regionAt(cx, tz0 - 0.4), regS = regionAt(cx, tz1 + 0.4);
    const colN = PAPER[regN?.paper] || PAPER.blank, colS = PAPER[regS?.paper] || PAPER.blank;
    // the jagged line of the tear (both lips), tapering to nothing at the ends
    const xs = [], nz = [], sz = [];
    for (let x = -half; x <= half + 0.01; x += 0.4) {
      const taper = 1 - Math.pow(Math.abs(x) / half, 2);
      xs.push(x);
      nz.push(-(0.05 + (0.3 + r() * 0.42) * taper));
      sz.push(0.05 + (0.3 + r() * 0.42) * taper);
    }
    if (!open) {
      ground.at(0, 0, 0);
      for (let i = 0; i < xs.length - 1; i++) {
        const xa = cx + xs[i], xb = cx + xs[i + 1];
        // paper lips filling the cut-out up to the jag (north = one sheet, south = the other)
        gk(ground, GK.paper);
        ground.quad([xa, 0, tz0], [xb, 0, tz0], [xb, 0, cz + nz[i + 1]], [xa, 0, cz + nz[i]], colN, 0, 1, 0);
        ground.quad([xa, 0, cz + sz[i]], [xb, 0, cz + sz[i + 1]], [xb, 0, tz1], [xa, 0, tz1], colS, 0, 1, 0);
        gk(ground, GK.decal);
        // the paper's torn thickness, in layers, down into the gap (the north lip faces the camera)
        ground.quad([xa, 0, cz + nz[i]], [xb, 0, cz + nz[i + 1]], [xb, -0.28, cz + nz[i + 1] - 0.02], [xa, -0.28, cz + nz[i] - 0.02], C.edge2, 0, 0, 1);
        ground.quad([xa, -0.28, cz + nz[i] - 0.02], [xb, -0.28, cz + nz[i + 1] - 0.02], [xb, -0.6, cz + nz[i + 1] - 0.04], [xa, -0.6, cz + nz[i] - 0.04], C.edge3, 0, 0, 1);
        ground.quad([xa, 0, cz + sz[i]], [xb, 0, cz + sz[i + 1]], [xb, -0.4, cz + sz[i + 1]], [xa, -0.4, cz + sz[i]], C.edge1, 0, 0, -1);
        // white fibres sticking out of the torn lips
        if (i % 2 === 0) ground.flatR(xa + 0.2, cz + nz[i] + 0.04, 0.05, 0.16, 0.003, '#FFFDF6', 0.3);
        if (i % 3 === 1) ground.flatR(xa + 0.2, cz + sz[i] - 0.04, 0.05, 0.14, 0.003, '#FFFDF6', -0.4);
      }
      // the clouds far down through the gap
      ground.flat(tx0, tz0 + 0.1, tx1, tz1 - 0.1, -1.4, C.cloudLow);
      for (let k = 0; k < 4; k++) ground.box(cx - half * 0.7 + k * half * 0.45, -1.15, cz, 0.9, 0.3, 0.5, C.cloud);
      // a rope across the lane before it (south side, where she comes from), on two short posts, with tags
      const g = solidFor(cx, tz1 + 1.4);
      g.item(cx, tz1 + 1.4, 0).at(cx, tz1 + 1.3, 0);
      for (const sx of [-1, 1]) {
        g.box(sx * 1.95, 0.45, 0, 0.16, 0.9, 0.16, C.woodD);
        g.box(sx * 1.95, 0.93, 0, 0.22, 0.06, 0.22, C.wood);
      }
      const sag = [0.82, 0.72, 0.66, 0.66, 0.72, 0.82];
      for (let k = 0; k < 5; k++) {
        const xa = -1.95 + k * 0.78, ya = sag[k], yb = sag[k + 1];
        g.boxR(xa + 0.39, (ya + yb) / 2, 0, 0.8, 0.06, 0.06, k % 2 ? '#F6F0E2' : '#B5404A', 0, 0, Math.atan2(yb - ya, 0.78));
      }
      for (const [x, c] of [[-0.8, '#F6E7B8'], [0.5, '#E9C9C6']]) { g.box(x, 0.58, 0, 0.03, 0.12, 0.03, '#C9B48A'); g.box(x, 0.44, 0.01, 0.22, 0.18, 0.02, c); }
    } else {
      // mended: the tear's line, laced shut with twine in crossed stitches, a bow at each end
      ground.at(0, 0, 0);
      for (let i = 0; i < xs.length - 1; i++) {
        const xa = cx + xs[i], xb = cx + xs[i + 1], za = cz + (nz[i] + sz[i]) * 0.25, zb = cz + (nz[i + 1] + sz[i + 1]) * 0.25;
        const onRoad = Math.abs(xa + 0.2 - cx) < W + 0.1;
        const y = onRoad ? ROADTOP + 0.012 : 0.006;
        ground.quad([xa, y, za - 0.03], [xb, y, zb - 0.03], [xb, y, zb + 0.03], [xa, y, za + 0.03], '#C9BBA0', 0, 1, 0);
        if (i % 2 === 0) for (const sg of [-1, 1]) ground.flatR(xa + 0.2, (za + zb) / 2, 0.05, 0.62, y + 0.002, '#9A7448', sg * 0.55);
      }
      const g = solidFor(cx, cz);
      g.item(cx, cz, 0).at(cx, cz, 0);
      for (const sx of [-1, 1]) {
        g.box(sx * (half - 0.25), 0.04, 0, 0.16, 0.08, 0.12, '#9A7448');
        g.boxR(sx * (half - 0.25) - 0.12, 0.05, 0.08, 0.2, 0.04, 0.1, '#9A7448', 0, 0.5, 0);
        g.boxR(sx * (half - 0.25) + 0.12, 0.05, 0.08, 0.2, 0.04, 0.1, '#9A7448', 0, -0.5, 0);
      }
    }
  }
}

/** Two faint pencil lines on the paper where a road has only been sketched (a 'pencil' edge). */
function pencilLines(f, e, x0, z0, x1, z1) {
  const P = { x: 0, z: 0 }, T = { x: 0, z: 0 };
  f.at(0, 0, 0);
  for (let s = 0.3, k = 0; s < e.length - 0.3; s += 0.55, k++) {
    sampleAt(e, s, P, T);
    if (P.x < x0 || P.x >= x1 || P.z < z0 || P.z >= z1) continue;
    const ang = Math.atan2(T.x, T.z);
    for (const sd of [-1, 1]) {
      if ((k * 7 + (sd > 0 ? 3 : 0)) % 11 === 0) continue; // a sketchy break now and then
      const off = sd * 0.95 + Math.sin(s * 0.45 + sd) * 0.06;
      f.flatR(P.x - T.z * off, P.z + T.x * off, 0.06, 0.58, 0.006, k % 5 === 0 ? '#ABA699' : '#BEB9AE', ang);
    }
  }
}

/** Roads (open-world part): cream surface, gold strips and walls, footpaths, dashes. The first bridge is a
 * ribbon, a 'deck' edge a paper-truss bridge deck; 'pencil' edges are sketched; closed gates per their look. */
function roadsInChunk(f, net, x0, z0, x1, z1, ownEdges, ctx) {
  const W = ROAD.width / 2;
  const P = { x: 0, y: 0, z: 0 }, T = { x: 0, z: 0 };
  for (const e of ownEdges) {
    if (e.box.maxX < x0 - 2 || e.box.minX > x1 + 2 || e.box.maxZ < z0 - 2 || e.box.minZ > z1 + 2) continue;
    const closed = isClosed(ctx, e);
    if (closed && e.look === 'hidden') continue;
    if (e.style === 'pencil') { pencilLines(f, e, x0, z0, x1, z1); continue; }
    const ribbon = e.style === 'ribbon', deck = e.style === 'deck';
    const tear = closed && e.look === 'tear' ? tearRect(e) : null;
    const y = ROADTOP + (e.bias || 0);
    const step = 0.5;
    const n = Math.max(2, Math.ceil(e.length / step));
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const s = (e.length * i) / n;
      sampleAt(e, s, P, T);
      const nx = -T.z, nz = T.x;
      const cur = { x: P.x, z: P.z, nx, nz, cutL: net.onOtherRoad(P.x + nx * (W - 0.09), P.z + nz * (W - 0.09), e, -0.15), cutR: net.onOtherRoad(P.x - nx * (W - 0.09), P.z - nz * (W - 0.09), e, -0.15) };
      if (prev) {
        const mx = (prev.x + cur.x) / 2, mz = (prev.z + cur.z) / 2;
        const torn = tear && mx > tear[0] - 0.3 && mx < tear[2] + 0.3 && mz > tear[1] - 0.25 && mz < tear[3] + 0.25;
        if (!torn && mx >= x0 && mx < x1 && mz >= z0 && mz < z1) {
          const pt = (q, off, yy) => [q.x + q.nx * off, yy, q.z + q.nz * off];
          f.quad(pt(prev, W, y), pt(prev, -W, y), pt(cur, -W, y), pt(cur, W, y), C.cream, 0, 1, 0);
          const ys = y + 0.004;
          if (!prev.cutL && !cur.cutL) f.quad(pt(prev, W, ys), pt(prev, W - ROAD.strip, ys), pt(cur, W - ROAD.strip, ys), pt(cur, W, ys), C.gold, 0, 1, 0);
          if (!prev.cutR && !cur.cutR) f.quad(pt(prev, -W, ys), pt(prev, -W + ROAD.strip, ys), pt(cur, -W + ROAD.strip, ys), pt(cur, -W, ys), C.gold, 0, 1, 0);
          const wx = (prev.nx + cur.nx) / 2, wz = (prev.nz + cur.nz) / 2;
          if (ribbon || deck) {
            // under the road: the bookmark ribbon (maroon, stitched with gold, thin as cloth), or a bridge's
            // deck of folded paper (wider, cream, thick, its edge printed with a fine ink rule)
            const RW = (e.deck || BRIDGE.deck) / 2, yr = y - 0.05, th = deck ? 0.55 : 0.3;
            const top = deck ? '#EDE7D8' : C.maroon, side = deck ? TRUSS_D : C.maroonD;
            for (const sd of [1, -1]) {
              f.quad(pt(prev, sd * W, yr), pt(prev, sd * RW, yr), pt(cur, sd * RW, yr), pt(cur, sd * W, yr), top, 0, 1, 0);
              f.quad(pt(prev, sd * RW, yr), pt(cur, sd * RW, yr), pt(cur, sd * RW, yr - th), pt(prev, sd * RW, yr - th), side, wx * sd, 0, wz * sd);
              if (i % 2) f.quad(pt(prev, sd * (RW - 0.12), yr + 0.003), pt(prev, sd * (RW - 0.18), yr + 0.003), pt(cur, sd * (RW - 0.18), yr + 0.003), pt(cur, sd * (RW - 0.12), yr + 0.003), deck ? TRUSS_INK : C.gold, 0, 1, 0);
            }
            f.quad(pt(prev, RW, yr - th), pt(prev, -RW, yr - th), pt(cur, -RW, yr - th), pt(cur, RW, yr - th), side, 0, -1, 0);
            f.quad(pt(prev, W, yr), pt(cur, W, yr), pt(cur, W, y), pt(prev, W, y), C.goldD, wx, 0, wz);
            f.quad(pt(prev, -W, yr), pt(cur, -W, yr), pt(cur, -W, y), pt(prev, -W, y), C.goldD, -wx, 0, -wz);
          } else {
            f.quad(pt(prev, W, ROAD.base), pt(cur, W, ROAD.base), pt(cur, W, y), pt(prev, W, y), C.goldD, wx, 0, wz);
            f.quad(pt(prev, -W, ROAD.base), pt(cur, -W, ROAD.base), pt(cur, -W, y), pt(prev, -W, y), C.goldD, -wx, 0, -wz);
            // footpaths both sides (parchment), cut where another road crosses
            for (const sd of [1, -1]) {
              const cut = sd > 0 ? prev.cutL || cur.cutL : prev.cutR || cur.cutR;
              if (cut) continue;
              const fy = 0.033 + (e.bias || 0), a = pt(prev, sd * (W + 0.05), fy), b = pt(prev, sd * (W + 1.15), fy), c = pt(cur, sd * (W + 1.15), fy), d = pt(cur, sd * (W + 0.05), fy);
              if (net.onOtherRoad(b[0], b[2], e, -0.3) || net.onOtherRoad(c[0], c[2], e, -0.3)) continue;
              if (ctx.offPaper && (ctx.offPaper(b[0], b[2]) || ctx.offPaper(c[0], c[2]))) continue;
              f.quad(a, b, c, d, C.parch, 0, 1, 0);
              if (i % 3 === 0) f.quad(pt(prev, sd * (W + 0.05), 0.038), pt(prev, sd * (W + 1.15), 0.038), pt(prev, sd * (W + 1.15), 0.038).map((v, k) => (k === 1 ? v : v + (k === 0 ? T.x : T.z) * 0.05)), pt(prev, sd * (W + 0.05), 0.038).map((v, k) => (k === 1 ? v : v + (k === 0 ? T.x : T.z) * 0.05)), shade(C.parch, 0.9), 0, 1, 0);
            }
          }
          // dashed centre line
          if (i % 3 === 1 && !net.onOtherRoad(cur.x, cur.z, e, -0.1)) {
            const ang = Math.atan2(T.x, T.z);
            f.flatR(cur.x, cur.z, 0.13, 0.62, y + 0.008, C.gold, ang);
          }
        }
      }
      prev = cur;
    }
  }
}

// ---------------------------------------------------------------------------------
// The chunk job
// ---------------------------------------------------------------------------------
const ART = { house, school, snack, potter, stage, bookSign, borderSign, pageEnd };
const PROP = {
  lamp: (g, f, it, ctx) => lamp(g, ctx),
  bench: (g, f) => { bench(g); f.flat(-0.9, -0.4, 1.0, 0.5, 0.005, C.shadow); },
  fence, hedge, garden, laundry: (g, f, it) => laundry(g, it), jars: (g, f) => jars(g, f), bikes: (g) => bikes(g),
  woodpile: (g, f) => woodpile(g, f), flowers: (g, f, it) => flowers(g, it), stall: (g, f) => stall(g, f),
  noticeBoard: (g, f, it, ctx) => noticeBoard(g, ctx),
  stamp, seal: (g, f) => seal(g, f), parcel,
  pencil, eraser: (g, f) => eraser(g, f), clip: (g, f) => paperClip(g, f), hens, tufts, well: (g, f) => well(g, f), teaSet: (g, f) => teaSet(g, f), swing: (g, f) => swing(g, f), seesaw: (g) => seesaw(g), slide: (g) => slide(g), pots,
};
// new kinds from the district files (regions/<id>.js ART / PROP)
for (const [k, v] of Object.entries(REG_ART)) if (v?.draw) ART[k] = v.draw;
for (const [k, v] of Object.entries(REG_PROP)) if (v?.draw) PROP[k] = v.draw;
/** Lazy towns (townloader.js): a town that arrived later brings new kinds (region.js merged them into REG_ART / REG_PROP). */
export function registerRegionKinds() {
  for (const [k, v] of Object.entries(REG_ART)) if (v?.draw) ART[k] = v.draw;
  for (const [k, v] of Object.entries(REG_PROP)) if (v?.draw) PROP[k] = v.draw;
}
/** True when a kind is a building (tall: the cutaway may fade it, signs on it hide with it). */
export const isArt = (k) => !!ART[k];

/** chunk: { i, j, x0, z0, x1, z1, items }; ctx: { net, edges, isOpen(edge), offPaper(x, z) } (edges: the open-world road edges). */
export function* chunkJob(chunk, ctx) {
  const ground = new Geo({ outline: false, cap: 6000 });
  const { x0, z0, x1, z1 } = chunk;
  // buildings and props go into the quarter of the chunk that holds their anchor
  const solids = [null, null, null, null];
  const solidFor = (x, z) => {
    const k = (x - x0 >= CELL ? 1 : 0) + (z - z0 >= CELL ? 2 : 0);
    return solids[k] || (solids[k] = new Geo({ outline: true, cap: 4000, anchors: true }));
  };
  const out = { trees: [], glows: [], signs: [], smoke: [] };
  chunk.ground = ground; chunk.solids = solids; chunk.out = out;
  // closed tears cut a hole in the paper
  // (lazy towns: ctx.regionOk / ctx.edgeOk leave out the land and roads of a town not here yet; the chunk is rebuilt when it comes)
  const edges = ctx.edgeOk ? ctx.edges.filter(ctx.edgeOk) : ctx.edges;
  const tears = [];
  for (const e of edges) if (e.look === 'tear' && isClosed(ctx, e)) tears.push(tearRect(e));
  for (const reg of REGIONS) { if (ctx.regionOk && !ctx.regionOk(reg)) continue; groundRegion(ground, reg, x0, z0, x1, z1, tears); regionEdges(ground, reg, x0, z0, x1, z1); }
  yield;
  gk(ground, GK.decal);
  roadsInChunk(ground, ctx.net, x0, z0, x1, z1, edges, ctx);
  for (const e of edges) {
    if (e.box.maxX < x0 - 4 || e.box.minX > x1 + 4 || e.box.maxZ < z0 - 4 || e.box.minZ > z1 + 4) continue;
    if (e.style === 'deck') deckDressing(solidFor, e, x0, z0, x1, z1);
    if (e.gate && e.look !== 'hidden' && e.look !== 'none') gateDressing(solidFor, ground, e, !isClosed(ctx, e), x0, z0, x1, z1, ctx);
  }
  yield;
  const local = { glows: [], signs: [], smoke: [] };
  for (const it of chunk.items) {
    if (it.k === 'padauk' || it.k === 'rain') {
      out.trees.push(it);
      ground.at(it.x, it.z, 0);
      gk(ground, GK.mark);
      ground.flatR(0.35, -0.2, 2.6 * (it.s || 1), 2.2 * (it.s || 1), 0.004, it.k === 'rain' ? C.shadow : '#EADFC6');
      continue;
    }
    const fn = ART[it.k] || PROP[it.k];
    if (!fn) continue;
    const solid = solidFor(it.x, it.z);
    solid.at(it.x, it.z, it.ry || 0).item(it.x, it.z, ART[it.k] ? 1 : 0);
    ground.at(it.x, it.z, it.ry || 0);
    gk(ground, GK.item);
    local.glows.length = 0; local.signs.length = 0; local.smoke.length = 0;
    fn(solid, ground, it, local);
    for (let k = 0; k < local.glows.length; k += 3) out.glows.push(local.glows[k], local.glows[k + 1], local.glows[k + 2]); // (world space)
    for (const s of local.signs) {
      // sign positions are in the item's local space: turn them into world space
      const c = Math.cos(it.ry || 0), sn = Math.sin(it.ry || 0);
      out.signs.push({ ...s, x: it.x + s.x * c + s.z * sn, z: it.z - s.x * sn + s.z * c, ry: (it.ry || 0) + (s.ry || 0), ax: it.x, az: it.z, tall: !!ART[it.k] });
    }
    for (let k = 0; k < local.smoke.length; k += 3) out.smoke.push(local.smoke[k], local.smoke[k + 1], local.smoke[k + 2]);
    if (it.k !== 'fence' && it.k !== 'lamp' && it.k !== 'flowers') yield;
  }
  ground.at(0, 0, 0);
  for (const g of solids) g?.at(0, 0, 0);
  chunk.gKind = gKinds(ground);
}

// ---------------------------------------------------------------------------------
// Ground kinds (ground.js paints the land over the paper and must know what each ground vertex is):
// 0 bare paper (painted over), 1 the paper's own markings and soft shadows (painted over, still showing),
// 2 a decal (kept as drawn: roads, paths, stamps, stepping stones...). Written as runs while painting.
// ---------------------------------------------------------------------------------
export const GK = { paper: 0, mark: 1, decal: 2, item: 3 }; // item: an item's decals (its soft shadow counts as a mark)
/** From the next vertex of `f` on, the ground is of kind k. */
function gk(f, k) {
  const r = f.gkRuns || (f.gkRuns = [0, GK.decal]);
  if (r[r.length - 2] === f.nv) { r[r.length - 1] = k; return; }
  if (r[r.length - 1] !== k) r.push(f.nv, k);
}
// the soft shadows items lay on the paper (build.js's, and the district art's own shadow colours)
const SHADOWS = [C.shadow, C.shadowEnv, '#EADFC6', '#E2D7BA', '#E0CDA4', '#D8D2C2', '#CBC4B2', '#D6CAAA'].map(rgb);
/** The per-vertex kinds of a ground Geo (Uint8, one per vertex: the `gKind` attribute). */
function gKinds(f) {
  const n = f.nv, out = new Uint8Array(n), r = f.gkRuns || [0, GK.decal];
  for (let k = 0; k < r.length; k += 2) {
    const a = r[k], b = k + 2 < r.length ? r[k + 2] : n, kind = r[k + 1];
    if (kind !== GK.item) { out.fill(kind, a, b); continue; }
    for (let v = a; v < b; v++) {
      const c = f.c, o = v * 3;
      out[v] = f.n[o + 1] > 0.5 && SHADOWS.some((s) => Math.abs(s[0] - c[o]) < 1e-4 && Math.abs(s[1] - c[o + 1]) < 1e-4 && Math.abs(s[2] - c[o + 2]) < 1e-4) ? GK.mark : GK.decal;
    }
  }
  return out;
}
/** Side of a chunk's solid cells (metres): a chunk is drawn as up to four of them. */
export const CELL = CHUNK / 2;

/** Which chunk (i, j) holds world point (x, z); null outside the grid. */
export function chunkOf(x, z) {
  const i = Math.floor((x - GRID.x0) / CHUNK), j = Math.floor((z - GRID.z0) / CHUNK);
  if (i < 0 || j < 0 || i >= GRID.cols || j >= GRID.rows) return null;
  return [i, j];
}

// ---------------------------------------------------------------------------------
// Home Book budget (story mode only; the site's own book is untouched): homebatch.js copies the book's fixed
// meshes into a few batched draws (cut into cells, unseen faces left out) and keeps them in step every frame.
// ---------------------------------------------------------------------------------
export { homeBookBudget } from './homebatch.js';
