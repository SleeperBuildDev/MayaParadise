// Day 2 story props (the potter's yard, the school, the snack stall). Same kit as props.js and the
// open world: vertex-coloured boxes merged with VoxelBuilder (one toon draw call + one outline per
// moving part), Maya's palette, round things as 8-sided blocky prisms. Feet at y = 0, fronts face +Z.
//
//   potterWheel()        { root, setClay(0..3), spin(dt, speed), setChalk(text), dispose }
//   dryingShelf(pots?)   { root, setPots([{ kind, size }]), dispose }
//   pot(kind, size?)     { root, setKind(kind), dispose }        kind: 'whole' | 'cracked' | 'raw'
//   kiln()               { root, setOpen(0..1), setGlow(0..1), dispose }
//   beanPlanter(state)   { root, setState('dead' | 'growing'), dispose }
//   snackScale()         { root, setTilt(-1..1), dispose }
//   seeSaw()             { root, setTilt(-1..1), dispose }
//   flowerBed()          { root, dispose }
//   examChart(opts?)     { root, setText(lines), setBars(values, labels?), dispose }
//   chalkSlate(opts?)    { root, setChalk(text | lines), dispose }
import * as THREE from '../game/three.js';
import { PALETTE, basic, blobShadow, fontsReady, FONT_MY, roundRect } from '../game/toon.js';
import { VoxelBuilder, jitter } from '../game/voxel.js';

// the open world's prop colours (js/story/world/build.js)
const C = {
  wood: PALETTE.wood, woodD: PALETTE.woodDark, woodL: '#CDA577', gold: PALETTE.gold, goldD: PALETTE.goldDeep,
  maroon: PALETTE.maroon, maroonD: PALETTE.maroonDeep, cream: PALETTE.cream, white: PALETTE.white, ink: PALETTE.ink,
  paper: PALETTE.paper, leaf: PALETTE.leaf, leafD: PALETTE.leafDark, leafL: '#8DBA6E', rose: PALETTE.rose,
  terra: '#B5643C', terraL: '#CB7E4E', terraD: '#8E4A2C', soil: '#8A6648', soilD: '#6E5038', brick: '#A0503A', brickD: '#7E3C2B',
  glass: '#BFD3E0', mustard: '#E2B33C', chalk: '#3E4A3F', iron: '#4A3B30', sky: '#9CC3DE', soot: '#2B1E19',
  clayRaw: '#D9B48C', clayRawL: '#E4C49E', clayRawD: '#C49A6F', clayWet: '#A97E57', clayWetL: '#BC9268', clayWetD: '#8E6644',
};
const POT = {
  whole: { foot: C.terraD, low: C.terra, belly: C.terraL, up: C.terra, sh: C.terra, neck: C.terraD, rim: C.terraL, band: '#EBDCBF' },
  cracked: { foot: '#7F4630', low: '#A45C3C', belly: '#B57050', up: '#A45C3C', sh: '#A45C3C', neck: '#7F4630', rim: '#B57050', band: '#D9C7A6' },
  raw: { foot: C.clayRawD, low: '#D3AC82', belly: C.clayRawL, up: C.clayRaw, sh: C.clayRaw, neck: C.clayRawD, rim: C.clayRawL, band: null },
};

// ---------------------------------------------------------------------------------------------
// small builders
// ---------------------------------------------------------------------------------------------
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();

/** Box with any turn (Euler XYZ, radians) about its own centre. */
function boxR(v, x, y, z, w, h, d, col, rx = 0, ry = 0, rz = 0) {
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(w, h, d));
  v.add(UNIT, col, _m);
}

const cylCache = new Map();
/** Flat-shaded n-sided prism (a flat facet faces +Z), cached per shape. */
function prismGeo(rTop, rBot, h, seg = 8) {
  const key = `${rTop}|${rBot}|${h}|${seg}`;
  let g = cylCache.get(key);
  if (!g) {
    g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, false, Math.PI / seg).toNonIndexed();
    g.deleteAttribute('uv');
    g.deleteAttribute('normal');
    g.computeVertexNormals(); // non-indexed -> flat facets, like boxes
    cylCache.set(key, g);
  }
  return g;
}
/** Prism by centre and size: radius at top and bottom, height; optional turn about Y. */
function prism(v, x, y, z, rTop, rBot, h, col, seg = 8, ry = 0) {
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(1, 1, 1));
  v.add(prismGeo(rTop, rBot, h, seg), col, _m);
}

function shadowUnder(root, rx, rz, x = 0, z = 0, opacity = 0.5) {
  const s = blobShadow(rx, rz, opacity);
  s.position.x = x;
  s.position.z = z;
  root.add(s);
  return s;
}

/** Frees geometries, textures and non-shared materials under root. */
function disposeTree(root, own = []) {
  root.traverse((o) => { if (o.geometry && !o.userData.sharedGeo) o.geometry.dispose(); });
  for (const x of own) x?.dispose?.();
  root.removeFromParent();
}

function freeMesh(m) {
  if (!m) return;
  m.geometry.dispose();
  for (const c of m.children) c.geometry?.dispose();
  m.removeFromParent();
}

// ---------------------------------------------------------------------------------------------
// pots
// ---------------------------------------------------------------------------------------------
const COS8 = Math.cos(Math.PI / 8);
/** Adds one pot (foot at y, centred x/z) into builder v. kind 'whole' | 'cracked' | 'raw'. */
function potInto(v, x, y, z, kind = 'whole', s = 1, ry = 0) {
  const P = POT[kind] || POT.whole;
  // tiers bottom -> top: [radius, height, colour]
  const T = [[0.1, 0.035, P.foot], [0.155, 0.07, P.low], [0.195, 0.12, P.belly], [0.175, 0.07, P.up], [0.13, 0.045, P.sh], [0.088, 0.05, P.neck], [0.122, 0.035, P.rim]];
  let yy = y;
  const tops = [];
  for (const [r, h, col] of T) {
    prism(v, x, yy + (h * s) / 2, z, r * s, r * s, h * s, col, 8, ry);
    tops.push([yy, yy + h * s, r * s]);
    yy += h * s;
  }
  // a dark open mouth, a little inner wall
  prism(v, x, yy + 0.003, z, 0.09 * s, 0.09 * s, 0.006, kind === 'raw' ? '#9C7752' : C.soot, 8, ry);
  // painted band round the belly (fired pots)
  if (P.band) prism(v, x, y + (0.035 + 0.07 + 0.075) * s, z, 0.199 * s, 0.199 * s, 0.022 * s, P.band, 8, ry);
  if (P.band) prism(v, x, y + (0.035 + 0.07 + 0.12 + 0.035) * s, z, 0.178 * s, 0.178 * s, 0.012 * s, C.maroon, 8, ry);
  if (kind === 'cracked') {
    // a zig-zag crack down the front facet, from the shoulder to the bottom of the belly
    const pts = [[0.03, 0.31], [-0.025, 0.268], [0.032, 0.226], [-0.03, 0.18], [0.024, 0.14], [-0.012, 0.11]];
    const cs = Math.cos(ry), sn = Math.sin(ry);
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      const len = Math.hypot(x1 - x0, y1 - y0) + 0.012;
      const ang = Math.atan2(y1 - y0, x1 - x0);
      const tier = tops.find(([a, b]) => y + my * s >= a && y + my * s <= b) || tops[2];
      const fz = tier[2] * COS8 + 0.004 * s;
      const th = (i === 2 || i === 1 ? 0.024 : 0.017) * s;
      boxR(v, x + (mx * s) * cs + fz * sn, y + my * s, z - (mx * s) * sn + fz * cs, len * s, th, 0.02 * s, C.soot, 0, ry, ang);
    }
    // a chip out of the rim
    const rimY = y + (0.425 - 0.012) * s;
    boxR(v, x + 0.07 * s * cs + 0.085 * s * sn, rimY, z - 0.07 * s * sn + 0.085 * s * cs, 0.06 * s, 0.03 * s, 0.05 * s, C.soot, 0, ry + 0.4, 0);
  }
  if (kind === 'raw') {
    // throwing rings: faint lines round the wet-looking clay
    for (const k of [0.09, 0.15, 0.2]) prism(v, x, y + k * s, z, (k < 0.1 ? 0.158 : 0.198) * s, (k < 0.1 ? 0.158 : 0.198) * s, 0.008 * s, C.clayRawD, 8, ry);
  }
  return y + 0.425 * s;
}

/** A standalone pot. kind: 'whole' (fired terracotta) | 'cracked' | 'raw' (pale unfired clay). */
export function pot(kind = 'whole', size = 1) {
  const root = new THREE.Group();
  root.name = 'pot';
  let mesh = null;
  const shadow = shadowUnder(root, 0.26 * size, 0.26 * size, 0, 0, 0.45);
  function setKind(k) {
    freeMesh(mesh);
    const v = new VoxelBuilder();
    potInto(v, 0, 0, 0, k, size);
    if (k === 'cracked') {
      // a shard on the ground beside it
      boxR(v, 0.27 * size, 0.012, 0.12 * size, 0.09 * size, 0.02, 0.06 * size, POT.cracked.belly, 0.1, 0.6, 0.15);
      boxR(v, 0.32 * size, 0.01, 0.03 * size, 0.05 * size, 0.016, 0.04 * size, POT.cracked.low, 0, -0.4, 0.1);
    }
    mesh = v.mesh();
    root.add(mesh);
  }
  setKind(kind);
  return { root, setKind, dispose() { freeMesh(mesh); shadow.geometry.dispose(); root.removeFromParent(); } };
}

// ---------------------------------------------------------------------------------------------
// chalk slate (Burmese chalk writing on a canvas)
// ---------------------------------------------------------------------------------------------
function chalkCanvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { cv, tex };
}

// deterministic random for smudges and grain
function rand(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** lines: string | [string | { text, strike, color, size }] */
function drawChalk(cv, lines, seed = 7) {
  const g = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const r = rand(seed);
  g.clearRect(0, 0, W, H);
  // slate: dark green-grey with soft wiped smudges
  const grd = g.createLinearGradient(0, 0, W, H);
  grd.addColorStop(0, '#46534A');
  grd.addColorStop(1, '#36423A');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  g.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    g.strokeStyle = `rgba(230,236,226,${0.035 + r() * 0.04})`;
    g.lineWidth = 18 + r() * 30;
    g.beginPath();
    const x = r() * W, y = r() * H;
    g.arc(x, y, 40 + r() * 90, r() * 6, r() * 6 + 1.6);
    g.stroke();
  }
  const list = (Array.isArray(lines) ? lines : String(lines ?? '').split('\n')).map((l) => (typeof l === 'string' ? { text: l } : l)).filter((l) => l.text);
  if (list.length) {
    const base = Math.min(H / (list.length * 1.75), 120);
    let y = (H - list.reduce((a, l) => a + (l.size ?? base) * 1.7, 0)) / 2;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const l of list) {
      let size = l.size ?? base;
      g.font = `700 ${size}px ${FONT_MY}`;
      const wmax = W * 0.86;
      const tw = g.measureText(l.text).width;
      if (tw > wmax) { size *= wmax / tw; g.font = `700 ${size}px ${FONT_MY}`; }
      y += (size * 1.7) / 2;
      const col = l.color || '#F4F1E8';
      // chalk: a soft wide pass, then the stroke, a little offset
      g.globalAlpha = 0.35;
      g.fillStyle = col;
      g.fillText(l.text, W / 2 + 2, y + 2);
      g.globalAlpha = 0.92;
      g.fillText(l.text, W / 2, y);
      g.globalAlpha = 1;
      if (l.strike) {
        const w = Math.min(g.measureText(l.text).width, wmax) * 0.55 + 16;
        g.strokeStyle = l.strikeColor || '#F2A08F';
        g.lineWidth = size * 0.09;
        g.beginPath();
        g.moveTo(W / 2 - w, y + size * 0.05);
        g.lineTo(W / 2 + w, y - size * 0.12);
        g.stroke();
      }
      y += (size * 1.7) / 2;
    }
  }
  // grain: tiny specks wiped out of the chalk and dust on the slate
  for (let i = 0; i < 900; i++) {
    const x = r() * W, y = r() * H;
    g.fillStyle = r() < 0.5 ? 'rgba(58,70,62,0.55)' : 'rgba(240,240,232,0.10)';
    g.fillRect(x, y, 1.5 + r() * 2, 1.5 + r() * 2);
  }
}

/** A framed school slate. opts: { w = 0.46, h = 0.34, text, lean = 0 }. Origin at its bottom edge. */
export function chalkSlate({ w = 0.46, h = 0.34, text = '', lean = 0 } = {}) {
  const root = new THREE.Group();
  root.name = 'chalkSlate';
  const tilt = new THREE.Group();
  tilt.rotation.x = -lean;
  root.add(tilt);
  const v = new VoxelBuilder();
  const f = 0.035, t = 0.03;
  v.box(0, h / 2, 0, w, h, t * 0.6, C.chalk); // the slate
  v.box(0, f / 2, 0, w + f * 0.4, f, t, C.woodL); // frame
  v.box(0, h - f / 2, 0, w + f * 0.4, f, t, C.woodL);
  for (const sx of [-1, 1]) v.box(sx * (w / 2 - f / 2 + f * 0.2), h / 2, 0, f, h, t, jitter(C.woodL, 0.05, sx));
  v.box(w / 2 - 0.06, h + 0.012, 0.0, 0.03, 0.03, 0.03, C.woodD); // string hole peg
  tilt.add(v.mesh({ px: 1.4 }));
  const pxW = 512, pxH = Math.round((512 * (h - 2 * f)) / (w - f * 1.2));
  const { cv, tex } = chalkCanvas(pxW, pxH);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w - f * 1.6, h - f * 2), basic('#E9E6DC', { map: tex }));
  face.position.set(0, h / 2, t * 0.3 + 0.002);
  tilt.add(face);
  let cur = text;
  function setChalk(next) {
    cur = next;
    drawChalk(cv, cur);
    tex.needsUpdate = true;
  }
  setChalk(text);
  fontsReady().then(() => setChalk(cur)); // redraw once the Burmese font is in
  return { root, setChalk, dispose() { tex.dispose(); face.material.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// potter's kick wheel
// ---------------------------------------------------------------------------------------------
function clayStage(stage) {
  const v = new VoxelBuilder();
  const y = 0; // sits on the wheel head's top
  const W = C.clayWet, L = C.clayWetL, D = C.clayWetD;
  if (stage === 0) {
    // a lumpy, off-centre ball of clay
    v.box(0.02, y + 0.07, 0.01, 0.2, 0.14, 0.18, W, 0.35);
    v.box(-0.03, y + 0.15, -0.01, 0.13, 0.08, 0.12, L, -0.2);
    v.box(0.07, y + 0.05, 0.06, 0.08, 0.08, 0.08, D, 0.7);
    v.box(-0.07, y + 0.04, -0.05, 0.07, 0.07, 0.07, L, 0.2);
  } else if (stage === 1) {
    // centred: a smooth mound
    prism(v, 0, y + 0.05, 0, 0.13, 0.145, 0.1, W);
    prism(v, 0, y + 0.13, 0, 0.08, 0.12, 0.06, L);
    prism(v, 0, y + 0.175, 0, 0.04, 0.07, 0.03, W);
  } else if (stage === 2) {
    // opened up into a cylinder
    prism(v, 0, y + 0.02, 0, 0.13, 0.13, 0.04, D);
    prism(v, 0, y + 0.11, 0, 0.115, 0.125, 0.14, W);
    prism(v, 0, y + 0.19, 0, 0.12, 0.12, 0.02, L);
    prism(v, 0, y + 0.2, 0, 0.088, 0.088, 0.006, '#5E432C');
    prism(v, 0, y + 0.08, 0, 0.127, 0.127, 0.008, D);
  } else {
    // a shaped pot, still wet
    prism(v, 0, y + 0.02, 0, 0.1, 0.1, 0.04, D);
    prism(v, 0, y + 0.075, 0, 0.14, 0.12, 0.07, W);
    prism(v, 0, y + 0.135, 0, 0.12, 0.14, 0.05, L);
    prism(v, 0, y + 0.18, 0, 0.075, 0.115, 0.04, W);
    prism(v, 0, y + 0.215, 0, 0.065, 0.065, 0.03, D);
    prism(v, 0, y + 0.238, 0, 0.088, 0.088, 0.018, L);
    prism(v, 0, y + 0.249, 0, 0.06, 0.06, 0.004, '#5E432C');
    prism(v, 0, y + 0.1, 0, 0.143, 0.143, 0.008, D);
  }
  const m = v.mesh({ px: 1.4 });
  m.name = `clay${stage}`;
  return m;
}

/**
 * A potter's kick wheel: a wooden frame with a seat on the west (-X) end, a splash tray round the
 * wheel head, a heavy flywheel at the bottom to kick, a lump of clay, and a chalk slate leaning on
 * its front leg. Handles: setClay(0..3), spin(dt, speed), setChalk(text).
 */
export function potterWheel({ clay = 0, chalk = '' } = {}) {
  const root = new THREE.Group();
  root.name = 'potterWheel';
  const HX = 0.18, HEAD = 0.6; // wheel axis x, wheel head top
  const v = new VoxelBuilder();
  const wood = C.wood, dark = C.woodD;
  // two long side rails on skids, the seat plank at the west end
  for (const z of [-0.36, 0.36]) {
    v.boxMin(-0.86, 0, z - 0.05, 0.62, 0.06, z + 0.05, dark);
    v.boxMin(-0.86, 0.36, z - 0.04, -0.3, 0.42, z + 0.04, jitter(wood, 0.05, z * 10));
    for (const x of [-0.8, -0.36]) v.box(x, 0.21, z, 0.07, 0.36, 0.07, dark);
  }
  for (let i = 0; i < 3; i++) v.box(-0.58, 0.45, -0.17 + i * 0.17, 0.5, 0.05, 0.16, jitter(C.woodL, 0.06, i + 3)); // seat planks
  v.box(-0.58, 0.425, 0, 0.44, 0.02, 0.62, dark);
  // the tray frame: four legs, a box tray round the head, a cross bar holding the shaft
  for (const x of [HX - 0.38, HX + 0.38]) for (const z of [-0.36, 0.36]) v.box(x, 0.23, z, 0.08, 0.46, 0.08, dark);
  v.boxMin(HX - 0.42, 0.42, -0.4, HX + 0.42, 0.46, 0.4, jitter(wood, 0.04, 9)); // tray floor
  v.boxMin(HX - 0.42, 0.46, 0.34, HX + 0.42, 0.53, 0.4, wood); // tray walls
  v.boxMin(HX - 0.42, 0.46, -0.4, HX + 0.42, 0.53, -0.34, wood);
  v.boxMin(HX + 0.36, 0.46, -0.34, HX + 0.42, 0.53, 0.34, jitter(wood, 0.05, 4));
  v.boxMin(HX - 0.42, 0.53, 0.34, HX + 0.42, 0.545, 0.41, C.goldD); // a brass edge on the front
  v.boxMin(HX - 0.42, 0.46, -0.34, HX - 0.37, 0.49, 0.34, wood); // low lip on the potter's side
  v.box(HX, 0.462, 0, 0.5, 0.006, 0.5, '#8F6B4B'); // slip in the tray
  v.box(HX, 0.24, 0, 0.84, 0.06, 0.08, dark); // lower bearing bar
  // a bowl of water and a wooden rib on the tray
  prism(v, HX + 0.27, 0.5, -0.23, 0.07, 0.05, 0.08, C.terra);
  prism(v, HX + 0.27, 0.538, -0.23, 0.055, 0.055, 0.006, C.sky);
  boxR(v, HX + 0.26, 0.47, 0.24, 0.14, 0.012, 0.05, C.woodL, 0, 0.5, 0);
  // a wedged block of clay waiting on the floor by the seat
  v.box(-0.2, 0.07, 0.5, 0.24, 0.14, 0.2, '#9C8270', 0.3);
  v.box(-0.2, 0.15, 0.5, 0.2, 0.03, 0.16, '#B09684', 0.3);
  v.box(-0.12, 0.12, 0.58, 0.07, 0.07, 0.06, '#8C7262', 0.9);
  const frame = v.mesh();
  root.add(frame);

  // the turning parts: flywheel, shaft, head (one mesh) + the clay
  const rotor = new THREE.Group();
  rotor.position.set(HX, 0, 0);
  root.add(rotor);
  const r = new VoxelBuilder();
  prism(r, 0, 0.13, 0, 0.3, 0.3, 0.08, '#8E8173');
  prism(r, 0, 0.13, 0, 0.31, 0.31, 0.03, C.iron);
  for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; r.box(Math.cos(a) * 0.22, 0.175, Math.sin(a) * 0.22, 0.05, 0.012, 0.05, C.gold); }
  r.box(0.29, 0.13, 0, 0.04, 0.085, 0.07, C.maroon); // a painted mark, so the turning shows
  prism(r, 0, 0.36, 0, 0.025, 0.025, 0.46, C.iron, 6);
  prism(r, 0, HEAD - 0.035, 0, 0.21, 0.21, 0.05, '#9A8B78');
  prism(r, 0, HEAD - 0.007, 0, 0.19, 0.19, 0.01, '#A9987F');
  prism(r, 0, HEAD - 0.055, 0, 0.07, 0.07, 0.03, C.iron);
  r.box(0.15, HEAD + 0.001, 0, 0.05, 0.004, 0.03, C.clayWetD); // slip smears
  r.box(-0.08, HEAD + 0.001, 0.12, 0.04, 0.004, 0.06, C.clayWetD, 0.6);
  rotor.add(r.mesh());
  const clayGroup = new THREE.Group();
  clayGroup.position.y = HEAD;
  rotor.add(clayGroup);
  const stages = [0, 1, 2, 3].map((s) => { const m = clayStage(s); m.visible = false; clayGroup.add(m); return m; });

  const slate = chalkSlate({ text: chalk, lean: 0.22 });
  slate.root.position.set(HX + 0.5, 0, 0.5);
  slate.root.rotation.y = -0.3;
  root.add(slate.root);
  const shadow = shadowUnder(root, 1.05, 0.6, -0.1, 0.05, 0.4);

  let stage = -1;
  function setClay(s) {
    s = Math.max(0, Math.min(3, Math.round(s)));
    if (s === stage) return;
    stage = s;
    stages.forEach((m, i) => (m.visible = i === s));
  }
  setClay(clay);
  return {
    root,
    rotor,
    setClay,
    spin(dt, speed = 6) { rotor.rotation.y += dt * speed; },
    setChalk: slate.setChalk,
    dispose() { slate.dispose(); shadow.geometry.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// drying shelf
// ---------------------------------------------------------------------------------------------
/** A three-tier wooden drying rack with 4 pot slots per tier (12; index 0 = bottom-left). */
export function dryingShelf(pots = []) {
  const root = new THREE.Group();
  root.name = 'dryingShelf';
  const W = 1.7, D = 0.46, TIERS = [0.14, 0.66, 1.18], TOP = 1.72;
  const v = new VoxelBuilder();
  for (const x of [-W / 2, W / 2]) for (const z of [-D / 2, D / 2]) v.box(x, TOP / 2, z, 0.08, TOP, 0.08, C.woodD);
  TIERS.forEach((y, k) => {
    for (let i = 0; i < 4; i++) v.box(0, y, -D / 2 + 0.06 + i * ((D - 0.12) / 3), W + 0.04, 0.035, 0.1, jitter(C.wood, 0.07, k * 7 + i));
    for (const z of [-D / 2, D / 2]) v.box(0, y - 0.04, z, W, 0.05, 0.05, C.woodD); // rails under the slats
  });
  v.box(0, TOP + 0.03, 0, W + 0.2, 0.06, D + 0.16, C.woodD); // a little roof board
  v.box(0, TOP + 0.08, 0, W + 0.1, 0.04, D + 0.04, C.wood);
  // X brace across the back
  const diag = Math.hypot(W, TOP - 0.2), ang = Math.atan2(TOP - 0.2, W);
  for (const s of [-1, 1]) boxR(v, 0, (TOP + 0.1) / 2, -D / 2 - 0.035, diag, 0.05, 0.025, C.woodD, 0, 0, s * ang);
  // bricks under the feet
  for (const x of [-W / 2, W / 2]) v.box(x, 0.02, 0, 0.18, 0.04, D + 0.16, C.brick);
  const frame = v.mesh();
  root.add(frame);
  const shadow = shadowUnder(root, W * 0.62, D * 0.9, 0, 0, 0.42);
  let potsMesh = null;
  function setPots(list = []) {
    freeMesh(potsMesh);
    potsMesh = null;
    const pv = new VoxelBuilder();
    list.forEach((p, i) => {
      if (!p || i >= 12) return;
      const k = Math.floor(i / 4), j = i % 4;
      const x = -W / 2 + 0.25 + j * ((W - 0.5) / 3);
      potInto(pv, x, TIERS[k] + 0.0175, 0.02, p.kind || 'raw', p.size ?? 0.85, 0);
    });
    if (pv.parts.length) { potsMesh = pv.mesh(); root.add(potsMesh); }
  }
  setPots(pots);
  return { root, setPots, dispose() { freeMesh(potsMesh); shadow.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// kiln
// ---------------------------------------------------------------------------------------------
/**
 * A small brick beehive kiln with a firebox porch, an iron-strapped door (hinged on its left) and a
 * chimney. setOpen(0..1) swings the door, setGlow(0..1) lights the fire inside.
 */
export function kiln() {
  const root = new THREE.Group();
  root.name = 'kiln';
  const v = new VoxelBuilder();
  // plinth
  prism(v, 0, 0.07, 0, 0.9, 0.92, 0.14, '#8C7B6A');
  // the dome: courses of brick, alternating shades, stepping in
  const R = [0.8, 0.8, 0.79, 0.77, 0.74, 0.7, 0.64, 0.56, 0.46, 0.34];
  let y = 0.14;
  R.forEach((r, i) => {
    const h = 0.15;
    prism(v, 0, y + h / 2, 0, r, i === 0 ? r : R[i - 1] * 0.995, h, jitter(i % 2 ? C.brickD : C.brick, 0.05, i));
    prism(v, 0, y + h - 0.006, 0, r + 0.006, r + 0.006, 0.012, '#C98D6E', 8); // mortar line
    y += h;
  });
  prism(v, 0, y + 0.04, 0, 0.22, 0.3, 0.08, C.brickD);
  // chimney
  prism(v, 0, y + 0.3, 0, 0.13, 0.15, 0.46, C.brick, 6);
  prism(v, 0, y + 0.55, 0, 0.17, 0.17, 0.06, C.brickD, 6);
  prism(v, 0, y + 0.584, 0, 0.1, 0.1, 0.008, C.soot, 6);
  // firebox porch in front of the dome: brick jambs, a lintel and a little stepped arch
  const PZ = 0.86, MW = 0.46, MH = 0.5, MY = 0.16;
  for (const sx of [-1, 1]) {
    v.box(sx * (MW / 2 + 0.11), 0.48, PZ - 0.22, 0.22, 0.8, 0.5, jitter(C.brick, 0.06, sx + 2));
    for (let k = 0; k < 5; k++) v.box(sx * (MW / 2 + 0.11), 0.16 + k * 0.15, PZ + 0.03, 0.23, 0.012, 0.012, '#C98D6E');
  }
  v.box(0, 0.86, PZ - 0.22, MW + 0.44, 0.16, 0.5, C.brickD);
  v.box(0, 0.86, PZ + 0.035, MW + 0.46, 0.17, 0.02, C.brickD);
  for (let k = 0; k < 5; k++) v.box(-0.28 + k * 0.14, 0.86, PZ + 0.047, 0.012, 0.15, 0.012, '#C98D6E');
  v.box(0, 0.72, PZ - 0.01, MW + 0.02, 0.12, 0.06, C.brickD); // arch shoulders
  v.box(0, 0.94, PZ + 0.02, 0.18, 0.06, 0.05, C.goldD); // a keystone
  v.box(0, MY - 0.04, PZ - 0.1, MW + 0.5, 0.08, 0.6, '#8C7B6A'); // hearth step
  // the mouth: a dark recess and the fire inside
  v.box(0, MY + MH / 2, PZ - 0.12, MW, MH, 0.02, C.soot);
  for (const sx of [-1, 1]) v.box(sx * (MW / 2 - 0.005), MY + MH / 2, PZ - 0.06, 0.01, MH, 0.12, '#3A2820');
  v.box(0, MY + MH - 0.005, PZ - 0.06, MW, 0.01, 0.12, '#3A2820');
  // firewood stacked by the side, a couple of spare bricks
  for (let row = 0; row < 3; row++) for (let i = 0; i < 3 - row; i++) {
    v.box(1.0 + i * 0.13 + row * 0.065, 0.06 + row * 0.11, 0.55, 0.11, 0.11, 0.6, jitter(C.wood, 0.1, i * 3 + row));
    v.box(1.0 + i * 0.13 + row * 0.065, 0.06 + row * 0.11, 0.851, 0.07, 0.07, 0.004, '#E2C29C');
  }
  v.box(-0.95, 0.05, 0.7, 0.24, 0.1, 0.12, C.brick, 0.3);
  v.box(-0.92, 0.15, 0.7, 0.24, 0.1, 0.12, C.brickD, -0.2);
  const body = v.mesh();
  root.add(body);

  // fire: embers on the floor of the firebox and a glowing back wall (unlit, colour driven by glow)
  const fireMat = basic(C.soot).clone();
  const fv = new VoxelBuilder();
  fv.box(0, MY + MH / 2 - 0.02, PZ - 0.105, MW - 0.03, MH - 0.06, 0.005, '#ffffff');
  for (let i = 0; i < 6; i++) fv.box(-0.16 + i * 0.065, MY + 0.03 + (i % 2) * 0.02, PZ - 0.08 + (i % 3) * 0.025, 0.09, 0.05, 0.05, '#ffd2a0', 0.4 * i);
  const fire = new THREE.Mesh(fv.geometry(), fireMat);
  fireMat.vertexColors = true;
  root.add(fire);
  // a soft halo in front of the mouth when lit
  const haloTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,200,120,0.9)');
    grd.addColorStop(0.5, 'rgba(255,150,60,0.35)');
    grd.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const haloMat = new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.9), haloMat);
  halo.position.set(0, MY + MH / 2, PZ + 0.06);
  halo.renderOrder = 2;
  root.add(halo);

  // the door: planks with iron straps and a ring handle, hinged on the left jamb
  const hinge = new THREE.Group();
  hinge.position.set(-MW / 2 - 0.01, MY, PZ + 0.07);
  root.add(hinge);
  const dv = new VoxelBuilder();
  const DW = MW + 0.04, DH = MH + 0.03;
  for (let i = 0; i < 4; i++) dv.box(DW * (i + 0.5) / 4, DH / 2, 0, DW / 4 - 0.006, DH, 0.05, jitter('#6B4A31', 0.08, i + 11));
  for (const yy of [0.1, DH - 0.1]) dv.box(DW / 2, yy, 0.03, DW, 0.05, 0.012, C.iron);
  for (const yy of [0.1, DH - 0.1]) for (const xx of [0.06, DW / 2, DW - 0.06]) dv.box(xx, yy, 0.04, 0.02, 0.02, 0.01, C.gold);
  dv.box(DW - 0.08, DH / 2, 0.045, 0.04, 0.1, 0.03, C.iron);
  dv.box(DW - 0.08, DH / 2 - 0.06, 0.06, 0.06, 0.02, 0.02, C.gold); // handle
  dv.box(DW / 2, DH * 0.62, 0.03, 0.1, 0.05, 0.01, C.soot); // a spy hole
  const door = dv.mesh();
  hinge.add(door);

  const shadow = shadowUnder(root, 1.25, 1.1, 0.15, 0.15, 0.45);
  const dark = new THREE.Color(C.soot), hot = new THREE.Color('#FF9A3C'), white = new THREE.Color('#FFE2B0');
  let glow = 0;
  function setGlow(t) {
    glow = Math.max(0, Math.min(1, t));
    fireMat.color.copy(dark).lerp(hot, glow).lerp(white, Math.max(0, glow - 0.6) * 0.8);
    // embers stay faintly red when cooling
    if (glow > 0 && glow < 0.15) fireMat.color.lerp(new THREE.Color('#7A2A18'), 0.6);
    haloMat.opacity = glow * 0.85;
    halo.visible = glow > 0.01;
  }
  function setOpen(t) {
    t = Math.max(0, Math.min(1, t));
    const e = t * t * (3 - 2 * t);
    hinge.rotation.y = -e * 1.95;
  }
  setGlow(0);
  setOpen(0);
  return {
    root, door: hinge, setOpen, setGlow,
    get glow() { return glow; },
    dispose() { fireMat.dispose(); haloMat.dispose(); haloTex.dispose(); shadow.geometry.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// school bean planter
// ---------------------------------------------------------------------------------------------
function beanSprouts(state) {
  const v = new VoxelBuilder();
  const top = 0.3;
  const spots = [[-0.36, -0.06], [-0.24, 0.07], [-0.11, -0.05], [0.02, 0.06], [0.14, -0.07], [0.27, 0.05], [0.38, -0.04]];
  spots.forEach(([x, z], i) => {
    const h = 0.12 + ((i * 37) % 5) * 0.03;
    if (state === 'growing') {
      const lean = ((i % 3) - 1) * 0.12;
      boxR(v, x + Math.sin(lean) * h * 0.5, top + h / 2, z, 0.018, h, 0.018, i % 2 ? C.leafL : '#9CC77C', 0, 0, -lean);
      const tx = x + Math.sin(lean) * h, ty = top + h;
      // two round seed leaves, and a true leaf pair on the taller ones
      for (const s of [-1, 1]) boxR(v, tx + s * 0.04, ty + 0.012, z, 0.075, 0.016, 0.055, s > 0 ? C.leaf : C.leafL, 0, 0.3 * s, s * 0.35);
      if (h > 0.17) {
        for (const s of [-1, 1]) boxR(v, tx + s * 0.035, ty - 0.05, z + s * 0.015, 0.06, 0.012, 0.045, C.leafD, 0.2, -0.4 * s, s * 0.5);
        v.box(tx, ty + 0.03, z, 0.025, 0.025, 0.025, '#B9D99A'); // the new bud
      }
      if (i % 3 === 0) v.box(tx + 0.01, ty - 0.02, z + 0.02, 0.03, 0.022, 0.02, '#E9DCC0'); // seed coat still clinging
    } else {
      // dead: a short stalk, then folded over and drooping, brown shrivelled leaves
      const hs = h * 0.45;
      v.box(x, top + hs / 2, z, 0.02, hs, 0.02, '#8A6A45');
      const dir = i % 2 ? 1 : -1, bend = 1.15 + (i % 3) * 0.2;
      const len = h * 0.6;
      const cx = x + dir * Math.sin(bend) * len / 2, cy = top + hs + Math.cos(bend) * len / 2;
      boxR(v, cx, cy, z, 0.018, len, 0.018, '#7E5E3C', 0, 0, -dir * bend);
      const ex = x + dir * Math.sin(bend) * len, ey = top + hs + Math.cos(bend) * len;
      boxR(v, ex + dir * 0.015, Math.max(top + 0.01, ey - 0.02), z, 0.05, 0.012, 0.035, '#6E4E30', 0.3, 0.4, dir * 1.0);
      boxR(v, ex - dir * 0.01, Math.max(top + 0.01, ey - 0.035), z + 0.02, 0.04, 0.01, 0.03, '#8E6B44', -0.3, -0.2, dir * 1.3);
    }
  });
  if (state === 'dead') {
    // a fallen leaf or two on the dry soil
    boxR(v, -0.05, top + 0.006, 0.12, 0.05, 0.008, 0.03, '#8E6B44', 0, 0.8, 0);
    boxR(v, 0.33, top + 0.006, 0.1, 0.04, 0.008, 0.03, '#6E4E30', 0, -0.5, 0);
  }
  const m = v.mesh({ px: 1.2 });
  m.name = `beans-${state}`;
  return m;
}

/** A class bean box on two bricks: state 'dead' (dry, brown, drooping) or 'growing' (green sprouts). */
export function beanPlanter(state = 'growing') {
  const root = new THREE.Group();
  root.name = 'beanPlanter';
  const v = new VoxelBuilder();
  for (const x of [-0.36, 0.36]) v.box(x, 0.05, 0, 0.22, 0.1, 0.3, C.brick);
  v.boxMin(-0.5, 0.1, -0.19, 0.5, 0.14, 0.19, C.woodD); // bottom
  for (const z of [-0.19, 0.19]) v.boxMin(-0.5, 0.1, z - 0.02, 0.5, 0.3, z + 0.02, jitter(C.wood, 0.05, z * 10));
  for (const x of [-0.5, 0.5]) v.boxMin(x - 0.02, 0.1, -0.21, x + 0.02, 0.3, 0.21, C.woodD);
  v.boxMin(-0.5, 0.2, 0.209, 0.5, 0.215, 0.212, C.woodD); // plank seam
  // the class label: a paper card pinned on the front, a stick with a seed packet
  v.box(-0.2, 0.2, 0.215, 0.26, 0.11, 0.008, C.paper);
  v.box(-0.2, 0.235, 0.22, 0.18, 0.012, 0.004, C.maroon);
  v.box(-0.2, 0.2, 0.22, 0.2, 0.01, 0.004, '#B9AE98');
  v.box(-0.2, 0.175, 0.22, 0.14, 0.01, 0.004, '#B9AE98');
  v.box(0.44, 0.42, -0.12, 0.02, 0.32, 0.02, C.woodL);
  v.box(0.44, 0.54, -0.105, 0.09, 0.11, 0.01, C.mustard);
  v.box(0.44, 0.555, -0.099, 0.05, 0.04, 0.004, C.leafD);
  const body = v.mesh();
  root.add(body);
  // soil (changes colour with the state)
  const soil = { growing: null, dead: null };
  for (const s of ['growing', 'dead']) {
    const sv = new VoxelBuilder();
    sv.boxMin(-0.48, 0.14, -0.17, 0.48, 0.29, 0.17, s === 'dead' ? '#A48461' : C.soil);
    for (let i = 0; i < 7; i++) sv.box(-0.4 + i * 0.13, 0.292, -0.1 + (i % 3) * 0.08, 0.06, 0.006, 0.04, s === 'dead' ? '#8F7050' : C.soilD);
    if (s === 'dead') for (let i = 0; i < 4; i++) boxR(sv, -0.3 + i * 0.2, 0.293, (i % 2) * 0.06 - 0.03, 0.12, 0.004, 0.008, '#6E5038', 0, 0.6 * (i % 2 ? 1 : -1), 0); // cracks
    else for (let i = 0; i < 5; i++) sv.box(-0.33 + i * 0.17, 0.293, 0.11, 0.08, 0.004, 0.05, '#7A5A3F'); // damp patches
    soil[s] = sv.mesh({ outline: false });
    root.add(soil[s]);
  }
  const sprouts = { growing: beanSprouts('growing'), dead: beanSprouts('dead') };
  root.add(sprouts.growing, sprouts.dead);
  const shadow = shadowUnder(root, 0.6, 0.3, 0, 0, 0.45);
  let cur = null;
  function setState(s) {
    cur = s === 'dead' ? 'dead' : 'growing';
    for (const k of ['growing', 'dead']) { sprouts[k].visible = soil[k].visible = k === cur; }
  }
  setState(state);
  return { root, setState, get state() { return cur; }, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// snack stall counter with a hanging hand scale
// ---------------------------------------------------------------------------------------------
/** A snack counter with jars, a post and arm, and a brass hand scale. setTilt(-1..1): + = right pan down. */
export function snackScale() {
  const root = new THREE.Group();
  root.name = 'snackScale';
  const v = new VoxelBuilder();
  const W = 1.5, D = 0.6, H = 0.9;
  v.boxMin(-W / 2, 0, -D / 2, W / 2, H, D / 2, C.wood);
  v.boxMin(-W / 2 - 0.04, H, -D / 2 - 0.04, W / 2 + 0.04, H + 0.05, D / 2 + 0.06, C.goldD);
  for (let x = -W / 2 + 0.1; x < W / 2; x += 0.16) v.box(x, H / 2, D / 2 + 0.01, 0.04, H - 0.12, 0.03, C.woodD);
  v.boxMin(-W / 2, 0, D / 2 - 0.02, W / 2, 0.08, D / 2 + 0.04, C.woodD); // kick board
  v.box(0, H - 0.1, D / 2 + 0.03, W - 0.1, 0.12, 0.02, C.maroon); // painted band
  for (let i = 0; i < 6; i++) v.box(-0.6 + i * 0.24, H - 0.1, D / 2 + 0.045, 0.06, 0.06, 0.01, C.gold);
  // jars of snacks
  const fills = ['#F3B27A', '#C8323C', '#E2B33C', '#6F9E5B'];
  [-0.62, -0.38, 0.38, 0.62].forEach((x, i) => {
    const z = i % 2 ? -0.1 : 0.05;
    v.box(x, H + 0.21, z, 0.2, 0.3, 0.2, C.glass);
    v.box(x, H + 0.15, z + 0.004, 0.16, 0.18, 0.2, fills[i]);
    v.box(x - 0.03, H + 0.235, z + 0.101, 0.05, 0.03, 0.004, shade(fills[i], 1.15));
    v.box(x + 0.035, H + 0.215, z + 0.101, 0.04, 0.025, 0.004, shade(fills[i], 0.85));
    v.box(x - 0.07, H + 0.33, z + 0.101, 0.02, 0.06, 0.004, C.white); // glass glint
    v.box(x, H + 0.38, z, 0.16, 0.05, 0.16, C.maroon);
    v.box(x, H + 0.415, z, 0.06, 0.02, 0.06, C.gold);
  });
  // a stack of paper cones and a tray of fried snacks in the middle
  v.box(-0.12, H + 0.05, 0.12, 0.3, 0.04, 0.2, C.woodL);
  for (let i = 0; i < 5; i++) v.box(-0.22 + i * 0.05, H + 0.085, 0.1 + (i % 2) * 0.05, 0.05, 0.035, 0.05, ['#E8A94A', '#D98A3A', '#F0C070'][i % 3]);
  // the post and arm the scale hangs from
  const PX = 0.62, PZ = -0.2, TOPY = 2.1;
  v.box(PX, (H + TOPY) / 2, PZ, 0.07, TOPY - H, 0.07, C.woodD);
  v.box(PX, TOPY + 0.02, PZ, 0.1, 0.04, 0.1, C.goldD);
  v.boxMin(-0.08, 2.02, PZ - 0.03, PX, 2.08, PZ + 0.03, C.woodD);
  boxR(v, PX - 0.13, 1.9, PZ, 0.05, 0.36, 0.04, C.woodD, 0, 0, 0.78);
  v.box(0, 2.0, PZ, 0.03, 0.04, 0.03, C.iron); // hook
  root.add(v.mesh());

  // the scale: a beam on a pivot, two pans on strings
  const SX = 0, SY = 1.74, SZ = -0.2, HALF = 0.3, DROP = 0.32;
  const scale = new THREE.Group();
  scale.position.set(SX, SY, SZ);
  root.add(scale);
  const hv = new VoxelBuilder();
  hv.box(0, 0.13, 0, 0.012, 0.26, 0.012, C.ink); // the cord to the hook
  const hang = hv.mesh({ px: 1.2 });
  scale.add(hang);
  const beam = new THREE.Group();
  scale.add(beam);
  const bv = new VoxelBuilder();
  bv.box(0, 0, 0, HALF * 2, 0.025, 0.025, C.gold);
  for (const s of [-1, 1]) bv.box(s * HALF, 0, 0, 0.04, 0.04, 0.04, C.goldD);
  bv.box(0, 0.06, 0, 0.016, 0.12, 0.016, C.goldD); // the pointer
  bv.box(0, 0, 0, 0.05, 0.05, 0.035, C.goldD);
  beam.add(bv.mesh({ px: 1.3 }));
  const pans = [-1, 1].map((s) => {
    const g = new THREE.Group();
    scale.add(g);
    const pv = new VoxelBuilder();
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.3;
      const ox = Math.cos(a) * 0.1, oz = Math.sin(a) * 0.1;
      const len = Math.hypot(ox, DROP, oz);
      // from the beam end (0, 0, 0) down to the pan rim (ox, -DROP, oz)
      const rot = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(ox, -DROP, oz).normalize());
      _m.compose(_p.set(ox / 2, -DROP / 2, oz / 2), rot, _s.set(0.008, 0.008, len));
      pv.add(UNIT, C.ink, _m);
    }
    prism(pv, 0, -DROP - 0.015, 0, 0.13, 0.09, 0.035, C.gold);
    prism(pv, 0, -DROP + 0.004, 0, 0.115, 0.115, 0.004, '#B48D3C');
    if (s < 0) { pv.box(-0.02, -DROP + 0.04, 0, 0.07, 0.07, 0.07, C.iron); pv.box(0.05, -DROP + 0.025, 0.02, 0.04, 0.04, 0.04, C.iron); }
    else for (let i = 0; i < 6; i++) pv.box(-0.05 + (i % 3) * 0.05, -DROP + 0.02 + Math.floor(i / 3) * 0.03, -0.02 + (i % 2) * 0.04, 0.045, 0.03, 0.045, ['#E8A94A', '#D98A3A', '#F0C070'][i % 3]);
    g.add(pv.mesh({ px: 1.3 }));
    return { g, s };
  });
  const shadow = shadowUnder(root, W * 0.6, D * 0.85, 0, 0, 0.45);
  function setTilt(t) {
    t = Math.max(-1, Math.min(1, t));
    const a = -t * 0.32;
    beam.rotation.z = a;
    for (const p of pans) p.g.position.set(p.s * HALF * Math.cos(a), p.s * HALF * Math.sin(a), 0);
  }
  setTilt(0);
  return { root, setTilt, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}
function shade(hex, k) {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, c.r * k); c.g = Math.min(1, c.g * k); c.b = Math.min(1, c.b * k);
  return '#' + c.getHexString(THREE.SRGBColorSpace);
}

// ---------------------------------------------------------------------------------------------
// see-saw
// ---------------------------------------------------------------------------------------------
/** A playground see-saw. setTilt(-1..1): + = right (+X) end down to the ground. */
export function seeSaw() {
  const root = new THREE.Group();
  root.name = 'seeSaw';
  const PY = 0.52, L = 3.0;
  const v = new VoxelBuilder();
  // A-frame stand: two maroon trestles, a gold axle housing, a base plate
  v.box(0, 0.03, 0, 0.5, 0.06, 0.62, '#8C7B6A');
  for (const z of [-0.22, 0.22]) {
    for (const s of [-1, 1]) boxR(v, s * 0.11, PY / 2, z, 0.08, PY + 0.06, 0.08, C.maroon, 0, 0, s * 0.38);
    v.box(0, PY, z, 0.12, 0.12, 0.08, C.maroonD);
  }
  v.box(0, PY, 0, 0.06, 0.06, 0.56, C.gold);
  // tyre bumpers under each end
  for (const s of [-1, 1]) { v.box(s * 1.38, 0.06, 0, 0.26, 0.12, 0.26, C.ink); v.box(s * 1.38, 0.121, 0, 0.12, 0.004, 0.12, '#5A4F45'); }
  root.add(v.mesh());
  const plank = new THREE.Group();
  plank.position.y = PY + 0.06;
  root.add(plank);
  const pv = new VoxelBuilder();
  pv.box(0, 0, 0, L, 0.07, 0.28, C.woodL);
  for (const s of [-1, 1]) pv.box(s * 0.5, -0.04, 0, 0.9, 0.025, 0.2, C.woodD); // strengthening rails
  pv.box(0, -0.04, 0, 0.18, 0.06, 0.32, C.goldD);
  for (const s of [-1, 1]) {
    pv.box(s * (L / 2 - 0.25), 0.045, 0, 0.36, 0.03, 0.3, s < 0 ? '#C8323C' : '#2F5DB3'); // painted seats
    // T handle
    pv.box(s * (L / 2 - 0.55), 0.17, 0, 0.05, 0.3, 0.05, C.gold);
    pv.box(s * (L / 2 - 0.55), 0.32, 0, 0.06, 0.05, 0.34, C.gold);
    for (const z of [-0.18, 0.18]) pv.box(s * (L / 2 - 0.55), 0.32, z, 0.07, 0.06, 0.05, C.maroon);
    pv.box(s * (L / 2 - 0.02), 0.0, 0, 0.04, 0.075, 0.29, C.maroon); // end caps
  }
  pv.box(0, 0.036, 0, 0.6, 0.004, 0.04, C.gold);
  plank.add(pv.mesh());
  const shadow = shadowUnder(root, 1.7, 0.4, 0, 0, 0.4);
  const maxA = Math.asin((PY + 0.06 - 0.2) / (L / 2));
  function setTilt(t) { plank.rotation.z = -Math.max(-1, Math.min(1, t)) * maxA; }
  setTilt(0);
  return { root, setTilt, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// flower bed
// ---------------------------------------------------------------------------------------------
/** A small school flower bed: a sawtooth whitewashed brick edge, dark soil, marigolds and roses. */
export function flowerBed({ w = 1.7, d = 0.8, seed = 5 } = {}) {
  const root = new THREE.Group();
  root.name = 'flowerBed';
  const r = rand(seed);
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, 0, -d / 2, w / 2, 0.1, d / 2, C.soilD);
  v.boxMin(-w / 2 + 0.04, 0.1, -d / 2 + 0.04, w / 2 - 0.04, 0.13, d / 2 - 0.04, C.soil);
  // bricks set on edge at a slant, whitewashed, every fourth painted maroon
  const edge = (x0, z0, x1, z1, seed0) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.round(len / 0.15);
    const ry = -Math.atan2(z1 - z0, x1 - x0);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      // half-buried bricks turned 45 degrees: a row of whitewashed teeth
      boxR(v, x, 0.06, z, 0.11, 0.11, 0.07, jitter('#F2ECDF', 0.05, i * 3 + seed0), 0, ry, Math.PI / 4);
    }
  };
  edge(-w / 2, d / 2, w / 2, d / 2, 0);
  edge(w / 2, -d / 2, -w / 2, -d / 2, 1);
  edge(-w / 2, -d / 2, -w / 2, d / 2, 2);
  edge(w / 2, d / 2, w / 2, -d / 2, 3);
  // plants in two staggered rows
  const heads = [C.mustard, '#E9862E', C.rose, C.white, '#E9862E', C.mustard, '#C8323C'];
  let k = 0;
  for (let row = 0; row < 2; row++) {
    for (let x = -w / 2 + 0.2 + row * 0.12; x < w / 2 - 0.15; x += 0.26) {
      const z = (row ? -0.13 : 0.14) + (r() - 0.5) * 0.06;
      const h = 0.14 + r() * 0.1;
      v.box(x, 0.13 + h / 2, z, 0.024, h, 0.024, C.leafD);
      v.box(x, 0.2, z, 0.2, 0.09, 0.18, jitter(C.leaf, 0.08, k), r() * 0.8);
      v.box(x + 0.03, 0.26, z - 0.02, 0.13, 0.07, 0.12, jitter(C.leafL, 0.06, k + 1), r());
      const col = heads[k++ % heads.length];
      const fy = 0.13 + h + 0.03;
      // a blocky flower head: two crossed petal boxes and a centre
      v.box(x, fy, z, 0.11, 0.05, 0.11, col, 0.785);
      v.box(x, fy, z, 0.11, 0.05, 0.11, shade(col, 0.92));
      v.box(x, fy + 0.03, z, 0.04, 0.02, 0.04, col === C.mustard || col === '#E9862E' ? '#A0531F' : C.gold);
    }
  }
  root.add(v.mesh());
  const shadow = shadowUnder(root, w * 0.62, d * 0.7, 0, 0, 0.35);
  return { root, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// exam chart board
// ---------------------------------------------------------------------------------------------
const BAR_COLS = ['#6E1F2A', '#C9A24A', '#4E8C86', '#2F5DB3', '#C8323C'];
function drawChart(cv, title, values, labels) {
  const g = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#FFFDF8';
  g.fillRect(0, 0, W, H);
  // squared paper
  g.strokeStyle = 'rgba(156,195,222,0.45)';
  g.lineWidth = 1.5;
  for (let x = 0; x <= W; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y <= H; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#6E1F2A';
  g.font = `700 42px ${FONT_MY}`;
  g.fillText(title, W / 2, 48, W - 40);
  const x0 = 70, y0 = H - 92, top = 120, n = values.length;
  // axis and gridlines with marks
  g.strokeStyle = '#2A2118';
  g.lineWidth = 4;
  g.beginPath(); g.moveTo(x0, top - 10); g.lineTo(x0, y0); g.lineTo(W - 24, y0); g.stroke();
  g.font = `600 20px ${FONT_MY}`;
  g.fillStyle = '#5A4A3A';
  for (let m = 0; m <= 100; m += 25) {
    const y = y0 - ((y0 - top) * m) / 100;
    g.fillText(String(m), x0 - 30, y);
    g.strokeStyle = 'rgba(42,33,24,0.25)';
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(x0, y); g.lineTo(W - 24, y); g.stroke();
  }
  const slot = (W - 24 - x0) / n;
  values.forEach((val, i) => {
    const v = Math.max(0, Math.min(100, val));
    const bh = ((y0 - top) * v) / 100;
    const bx = x0 + slot * i + slot * 0.18, bw = slot * 0.64;
    g.fillStyle = 'rgba(42,33,24,0.18)';
    g.fillRect(bx + 6, y0 - bh + 6, bw, bh - 6);
    g.fillStyle = BAR_COLS[i % BAR_COLS.length];
    g.fillRect(bx, y0 - bh, bw, bh);
    g.fillStyle = 'rgba(255,255,255,0.22)';
    g.fillRect(bx, y0 - bh, bw * 0.28, bh);
    g.strokeStyle = '#2A2118';
    g.lineWidth = 3;
    g.strokeRect(bx, y0 - bh, bw, bh);
    g.fillStyle = '#2A2118';
    g.font = `700 22px ${FONT_MY}`;
    g.fillText(String(Math.round(val)), bx + bw / 2, y0 - bh - 18);
    g.font = `700 22px ${FONT_MY}`;
    g.fillText(labels[i] ?? '', bx + bw / 2, y0 + 36, slot - 4);
  });
}
function drawRhyme(cv, lines, title) {
  const g = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#FCE6C4';
  roundRect(g, 0, 0, W, H, 18);
  g.fill();
  g.strokeStyle = '#E8A0A8';
  g.lineWidth = 14;
  roundRect(g, 14, 14, W - 28, H - 28, 14);
  g.stroke();
  g.strokeStyle = '#6E1F2A';
  g.lineWidth = 3;
  g.setLineDash([10, 8]);
  roundRect(g, 30, 30, W - 60, H - 60, 10);
  g.stroke();
  g.setLineDash([]);
  // little corner flowers
  for (const [x, y] of [[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]]) {
    g.fillStyle = '#C9A24A';
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; g.beginPath(); g.arc(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 7, 0, 7); g.fill(); }
    g.fillStyle = '#6E1F2A';
    g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill();
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let y = 92;
  if (title) {
    g.fillStyle = '#6E1F2A';
    g.font = `700 38px ${FONT_MY}`;
    g.fillText(title, W / 2, y, W - 90);
    g.fillStyle = '#C9A24A';
    g.fillRect(W / 2 - 60, y + 34, 120, 5);
    y += 76;
  }
  const list = (lines || []).map((l) => (typeof l === 'string' ? { text: l } : l));
  const avail = H - y - 50;
  const size = Math.min(34, avail / Math.max(1, list.length) / 1.7);
  for (const l of list) {
    g.fillStyle = l.color || '#2A2118';
    g.font = `${l.weight ?? 700} ${l.size ?? size}px ${FONT_MY}`;
    y += ((l.size ?? size) * 1.7) / 2;
    g.fillText(l.text, W / 2, y, W - 90);
    y += ((l.size ?? size) * 1.7) / 2;
  }
}

/**
 * A classroom wall board: a wooden frame round a pin board, a marks chart (bars) on the left and a
 * rhyme poster on the right. By default it hangs on a wall (back at z = 0, bottom 0.9 m up); pass
 * { posts: true } to stand it on two legs. setText(lines) rewrites the rhyme poster,
 * setBars(values 0..100, labels?) redraws the chart.
 */
export function examChart({ posts = false, title = 'စာမေးပွဲ ရမှတ်', bars = [45, 62, 38, 80], labels = ['မြန်မာ', 'အင်္ဂလိပ်', 'သင်္ချာ', 'သိပ္ပံ'], rhymeTitle = 'ကဗျာ', lines = ['မရသေးဘူး၊ ကြိုးစားမယ်', 'နေ့တိုင်း နည်းနည်း', 'လေ့ကျင့်ရင် ရလာမယ်'] } = {}) {
  const root = new THREE.Group();
  root.name = 'examChart';
  const W = 2.0, H = 1.15, Y0 = 0.95, T = 0.06;
  const cy = Y0 + H / 2, fz = T / 2;
  const v = new VoxelBuilder();
  v.box(0, cy, 0, W, H, T, C.woodL); // backing
  v.box(0, cy, fz, W - 0.12, H - 0.12, 0.01, '#D9C8A4'); // pin board
  for (const s of [-1, 1]) {
    v.box(0, cy + s * (H / 2 - 0.03), fz + 0.01, W + 0.04, 0.07, 0.04, C.woodD);
    v.box(s * (W / 2 - 0.03), cy, fz + 0.01, 0.07, H + 0.04, 0.04, C.woodD);
  }
  v.box(0, Y0 - 0.02, fz + 0.05, W - 0.2, 0.03, 0.1, C.wood); // chalk ledge
  v.box(-0.5, Y0 + 0.005, fz + 0.06, 0.08, 0.02, 0.02, C.white);
  v.box(-0.38, Y0 + 0.005, fz + 0.07, 0.06, 0.02, 0.02, '#F2A08F');
  v.box(0.6, Y0 + 0.012, fz + 0.06, 0.14, 0.035, 0.05, C.woodD); // a duster
  v.box(0.6, Y0 + 0.035, fz + 0.06, 0.12, 0.012, 0.045, '#C9C2B4');
  // the school crest strip on top
  v.box(0, Y0 + H + 0.08, fz - 0.01, 0.6, 0.14, 0.04, C.maroon);
  v.box(0, Y0 + H + 0.08, fz + 0.012, 0.1, 0.1, 0.01, C.gold);
  if (posts) {
    for (const s of [-1, 1]) {
      v.box(s * (W / 2 - 0.12), (Y0 + H - 0.1) / 2, -0.06, 0.09, Y0 + H - 0.1, 0.09, C.woodD);
      v.box(s * (W / 2 - 0.12), 0.03, -0.06, 0.12, 0.06, 0.5, C.woodD);
    }
  }
  // pins for the two sheets
  const chartW = 0.9, chartH = 0.86, posterW = 0.66, posterH = 0.86;
  const chartX = -W / 2 + 0.12 + chartW / 2 + 0.04, posterX = W / 2 - 0.12 - posterW / 2 - 0.04;
  for (const [x, w] of [[chartX, chartW], [posterX, posterW]]) for (const s of [-1, 1]) v.box(x + s * (w / 2 - 0.04), cy + posterH / 2 - 0.035, fz + 0.03, 0.035, 0.035, 0.03, s < 0 ? C.maroon : '#2F5DB3');
  v.box(posterX + 0.26, cy - posterH / 2 + 0.06, fz + 0.03, 0.08, 0.08, 0.008, C.gold); // a gold star sticker
  root.add(v.mesh());
  const chart = chalkCanvas(512, Math.round((512 * chartH) / chartW));
  const poster = chalkCanvas(384, Math.round((384 * posterH) / posterW));
  const mat1 = basic('#F1EBDF', { map: chart.tex }), mat2 = basic('#F1EBDF', { map: poster.tex });
  const sheet1 = new THREE.Mesh(new THREE.PlaneGeometry(chartW, chartH), mat1);
  sheet1.position.set(chartX, cy, fz + 0.012);
  sheet1.rotation.z = 0.006;
  const sheet2 = new THREE.Mesh(new THREE.PlaneGeometry(posterW, posterH), mat2);
  sheet2.position.set(posterX, cy, fz + 0.012);
  sheet2.rotation.z = -0.012;
  root.add(sheet1, sheet2);
  let state = { title, bars, labels, rhymeTitle, lines };
  const redraw = () => {
    drawChart(chart.cv, state.title, state.bars, state.labels);
    drawRhyme(poster.cv, state.lines, state.rhymeTitle);
    chart.tex.needsUpdate = poster.tex.needsUpdate = true;
  };
  redraw();
  fontsReady().then(redraw);
  let shadow = null;
  if (posts) shadow = shadowUnder(root, W * 0.55, 0.35, 0, -0.06, 0.35);
  return {
    root,
    setText(next, nextTitle) { state.lines = next; if (nextTitle !== undefined) state.rhymeTitle = nextTitle; redraw(); },
    setBars(values, lbls, ttl) { state.bars = values; if (lbls) state.labels = lbls; if (ttl) state.title = ttl; redraw(); },
    dispose() { chart.tex.dispose(); poster.tex.dispose(); mat1.dispose(); mat2.dispose(); shadow?.geometry.dispose(); disposeTree(root); },
  };
}
