// Story interiors of the Exercise-Book Quarter (INDEX 13.1 / 13.2 / 13.5):
//   classroom   Daw Hnin Wai's grade-6 classroom (Days 2, 3, 4, 7, 14)
//   snackshop   the honesty snack shop (Days 2, 7)
//   pottershed  Daw Ohn's shed (Days 2, 3, 7)
//   quartertea  the Quarter tea shop on street 62 (Day 2)
//   bordertea   the tin-roof tea shop by the border sign (Day 3)
//
//   import { ROOMS } from './rooms/quarter.js';
//   const r = ROOMS.classroom.build({ day: 7 });   // -> { scene, group, stations, obstacles, door, spots, ... }
//   r.update(dt, t); r.setEvening(0..1); r.setRain(0..1); r.dispose();
//
// Built with js/game/interiors/kit.js (createRoom, place, bake) like the site's rooms: every static
// box is baked into ONE vertex-coloured mesh (+ outline). Every sign, poster, calendar, window view
// and lamp glow is drawn on ONE canvas atlas per room and shown through three merged unlit meshes
// (signs, window views, glows). Moving bits (fan, steam, wheels, motes) are one mesh each. No
// markers: `stations` are plain tap targets for the story (INDEX 13.5). Burmese strings are drafts
// for Maya to proofread: every line carrying one is tagged DRAFT(my); check the digit forms too (the
// tea-shop prices ၅၀၀ / ၃၀၀, the snack board's "ပဲစေ့ တစ်ခွက် ၂၀၀ ကျပ်"). Coordinates: room metres, x left/right as the camera sees it, z from the back
// wall (-) to the open front (+). Spots are { x, z, h, y? } with h = heading (0 faces the camera).
import * as kit from '../../game/interiors/kit.js';
import { fontsReady, FONT_MY, FONT_SERIF, roundRect } from '../../game/toon.js';
import { mergeGeometries } from '../../game/three.js';
import { potterWheel } from '../props2.js';

const { THREE, PALETTE: P, VoxelBuilder, jitter, basic } = kit;

// ---------------------------------------------------------------------------------------------
// colours (Maya's palette + the Quarter's school greens and clay)
// ---------------------------------------------------------------------------------------------
const C = {
  wood: P.wood, woodD: P.woodDark, woodL: '#CDA577', woodXD: '#5A3D26', teak: '#C9A06A', teakD: '#A97F4E',
  gold: P.gold, goldD: P.goldDeep, maroon: P.maroon, maroonD: P.maroonDeep, cream: P.cream, paper: P.paper,
  parch: P.parchment, white: P.white, ink: P.ink, leaf: P.leaf, leafD: P.leafDark, leafL: '#8DBA6E',
  green: '#A8C49C', greenD: '#7FA383', greenXD: '#4F6F55', chalk: '#3C4A40', terra: '#B5643C', terraL: '#CB7E4E',
  terraD: '#8E4A2C', clay: '#A97E57', clayL: '#BC9268', clayD: '#8E6644', clayRaw: '#D9B48C', clayRawD: '#C49A6F',
  iron: '#4A3B30', tin: '#B9B4AA', tinL: '#D8D4CA', tinD: '#8D877C', glass: '#CFE0E6', sky: '#9CC3DE',
  soot: '#2B1E19', mustard: '#E2B33C', rose: P.rose, teal: '#4F8A86', blue: '#3D6FA8', red: '#C8323C', sack: '#C7B08A', sackD: '#A8916C',
};

// ---------------------------------------------------------------------------------------------
// small geometry helpers (build time only)
// ---------------------------------------------------------------------------------------------
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
function M(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}
/** Box with any turn about its own centre. */
function rb(v, x, y, z, w, h, d, col, rx = 0, ry = 0, rz = 0) { v.add(UNIT, col, M(x, y, z, rx, ry, rz, w, h, d)); }
const prismCache = new Map();
function prismGeo(rTop, rBot, h, seg) {
  const key = `${rTop}|${rBot}|${h}|${seg}`;
  let g = prismCache.get(key);
  if (!g) {
    g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, false, Math.PI / seg).toNonIndexed();
    g.deleteAttribute('uv');
    g.deleteAttribute('normal');
    g.computeVertexNormals();
    prismCache.set(key, g);
  }
  return g;
}
/** Flat-faceted prism (round things in the blocky style). rx/rz tip it over. */
function cyl(v, x, y, z, rTop, rBot, h, col, seg = 8, rx = 0, rz = 0, ry = 0) { v.add(prismGeo(rTop, rBot, h, seg), col, M(x, y, z, rx, ry, rz)); }
/** Group holding a builder's mesh, with a collision footprint for room.place(). */
function piece(v, fp, name = 'prop') {
  const g = new THREE.Group();
  g.name = name;
  g.add(v.mesh({ outline: true, px: 1.4 }));
  if (fp) g.userData.footprint = fp;
  return g;
}
const mm = (n) => String(n).replace(/[0-9]/g, (d) => '၀၁၂၃၄၅၆၇၈၉'[d]); // DRAFT(my)
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

// ---------------------------------------------------------------------------------------------
// canvas atlas: regions packed in rows, repainted once the Burmese font is in.
// Layers: 'signs' (unlit, alpha-tested), 'views' (window views, tinted by evening / rain),
// 'glow' (lamp flames, embers: dark by day, warm at dusk).
// ---------------------------------------------------------------------------------------------
function makeAtlas(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const ops = [];
  const geos = { signs: [], views: [], glow: [] };
  let cx = 2, cy = 2, rowH = 0;
  const atlas = {
    g,
    alloc(w, h) {
      if (cx + w > size - 2) { cx = 2; cy += rowH + 3; rowH = 0; }
      const r = { x: cx, y: cy, w, h, u0: cx / size, u1: (cx + w) / size, v0: 1 - (cy + h) / size, v1: 1 - cy / size };
      cx += w + 3;
      rowH = Math.max(rowH, h);
      if (cy + h > size) console.warn('quarter atlas full');
      return r;
    },
    /** Reserve w × h px and draw into it with fn(g, w, h) (origin at the region's corner). */
    draw(w, h, fn) {
      const r = atlas.alloc(w, h);
      ops.push([r, fn]);
      return r;
    },
    paint() {
      g.clearRect(0, 0, size, size);
      for (const [r, fn] of ops) {
        g.save();
        g.translate(r.x, r.y);
        g.beginPath();
        g.rect(0, 0, r.w, r.h);
        g.clip();
        fn(g, r.w, r.h);
        g.restore();
      }
      if (atlas.tex) atlas.tex.needsUpdate = true;
    },
    /** Plane w × h facing +Z showing region r, placed by matrix m. */
    quad(r, w, h, m, layer = 'signs') {
      const geo = new THREE.PlaneGeometry(w, h);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, r.u0 + uv.getX(i) * (r.u1 - r.u0), r.v0 + uv.getY(i) * (r.v1 - r.v0));
      geo.applyMatrix4(m);
      geos[layer].push(geo);
    },
    /** Box (scaled by m) whose faces all show the middle of region r (flames, embers). */
    block(r, m, layer = 'glow') {
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (r.u0 + r.u1) / 2, (r.v0 + r.v1) / 2);
      geo.applyMatrix4(m);
      geos[layer].push(geo);
    },
    /** Builds the texture and one mesh per used layer; adds them to parent. */
    build(parent) {
      atlas.paint();
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      atlas.tex = tex;
      const out = {};
      for (const layer of Object.keys(geos)) {
        if (!geos[layer].length) continue;
        const mat = basic('#ffffff', { map: tex, alphaTest: layer === 'signs' ? 0.4 : 0, transparent: false });
        const mesh = new THREE.Mesh(mergeGeometries(geos[layer], false), mat);
        for (const geo of geos[layer]) geo.dispose();
        mesh.name = `quarter-${layer}`;
        mesh.userData.dynamic = true;
        mesh.raycast = () => {};
        parent.add(mesh);
        out[layer] = mesh;
      }
      fontsReady().then(() => atlas.paint());
      return out;
    },
  };
  return atlas;
}

// ---------- canvas drawing helpers ----------
function txt(g, s, x, y, size, color = C.ink, { weight = 700, font = FONT_MY, align = 'center', maxW = 0, base = 'middle' } = {}) {
  g.font = `${weight} ${size}px ${font}`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = base;
  if (maxW) g.fillText(s, x, y, maxW); else g.fillText(s, x, y);
}
function rr(g, x, y, w, h, r, fill, stroke = null, lw = 0) {
  roundRect(g, x, y, w, h, r);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
function paperBg(g, w, h, col = '#F7F0DF', seed = 3) {
  g.fillStyle = col;
  g.fillRect(0, 0, w, h);
  const r = rand(seed);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(120,90,50,${0.02 + r() * 0.03})`; g.fillRect(r() * w, r() * h, 2 + r() * 6, 1 + r() * 3); }
}
/** Hand-written scribble lines (letters, notes, exercise books). */
function scribble(g, x, y, w, rows, gap, color = '#3A4A7A', seed = 1, lw = 2) {
  const r = rand(seed);
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.lineCap = 'round';
  for (let k = 0; k < rows; k++) {
    let xx = x;
    const end = x + w * (k === rows - 1 ? 0.55 : 0.85 + r() * 0.15);
    g.beginPath();
    g.moveTo(xx, y + k * gap);
    while (xx < end) {
      const s = 4 + r() * 7;
      g.quadraticCurveTo(xx + s / 2, y + k * gap - 3 - r() * 4, xx + s, y + k * gap + (r() - 0.5) * 2);
      xx += s;
      if (r() < 0.14) { xx += 5; g.moveTo(xx, y + k * gap); }
    }
    g.stroke();
  }
}
/** Dark school-slate background with wiped smudges and chalk dust. */
function slateBg(g, w, h, seed = 7, base = ['#46534A', '#36423A']) {
  const r = rand(seed);
  const grd = g.createLinearGradient(0, 0, w, h);
  grd.addColorStop(0, base[0]);
  grd.addColorStop(1, base[1]);
  g.fillStyle = grd;
  g.fillRect(0, 0, w, h);
  g.lineCap = 'round';
  for (let i = 0; i < 10; i++) {
    g.strokeStyle = `rgba(230,236,226,${0.03 + r() * 0.04})`;
    g.lineWidth = 14 + r() * 26;
    g.beginPath();
    g.arc(r() * w, r() * h, 30 + r() * 80, r() * 6, r() * 6 + 1.6);
    g.stroke();
  }
  for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? 'rgba(58,70,62,0.5)' : 'rgba(240,240,232,0.08)'; g.fillRect(r() * w, r() * h, 1.5 + r() * 2, 1.5 + r() * 2); }
}
function chalkText(g, s, x, y, size, color = '#F4F1E8', opts = {}) {
  g.globalAlpha = 0.3;
  txt(g, s, x + 2, y + 2, size, color, opts);
  g.globalAlpha = 0.92;
  txt(g, s, x, y, size, color, opts);
  g.globalAlpha = 1;
}
function sparkle(g, x, y, r, color) {
  g.beginPath();
  g.moveTo(x, y - r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.quadraticCurveTo(x, y, x, y + r);
  g.quadraticCurveTo(x, y, x - r, y);
  g.quadraticCurveTo(x, y, x, y - r);
  g.fillStyle = color;
  g.fill();
}
/** Wall calendar: a painted picture on top, month in Burmese, a grid of days. */
function drawCalendar(g, w, h, { month = 'တော်သလင်း', pic = 'hills', mark = 0, seed = 4 } = {}) { // DRAFT(my)
  paperBg(g, w, h, '#FBF6EA', seed);
  const ph = h * 0.42;
  const sky = g.createLinearGradient(0, 0, 0, ph);
  sky.addColorStop(0, '#9CC3DE');
  sky.addColorStop(1, '#F7D9B6');
  g.fillStyle = sky;
  g.fillRect(6, 6, w - 12, ph);
  if (pic === 'hills') {
    g.fillStyle = '#7FA36A';
    g.beginPath(); g.moveTo(6, ph + 6); g.quadraticCurveTo(w * 0.3, ph * 0.35, w * 0.6, ph * 0.8); g.quadraticCurveTo(w * 0.8, ph * 0.5, w - 6, ph * 0.7); g.lineTo(w - 6, ph + 6); g.fill();
    g.fillStyle = '#F2C65A'; g.beginPath(); g.arc(w * 0.72, ph * 0.32, w * 0.08, 0, 7); g.fill();
  } else {
    // a vase of padauk flowers
    g.fillStyle = '#B5643C'; g.fillRect(w * 0.42, ph * 0.62, w * 0.16, ph * 0.38);
    for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#F2B53A' : '#E8A13A'; g.beginPath(); g.arc(w * (0.3 + (i % 5) * 0.1), ph * (0.25 + Math.floor(i / 5) * 0.18), w * 0.05, 0, 7); g.fill(); }
  }
  txt(g, month, w / 2, ph + h * 0.09, Math.round(h * 0.07), C.maroon);
  const cols = 7, rows = 5, gx = (w - 16) / cols, gy = (h - ph - h * 0.17) / rows;
  for (let i = 0; i < 31; i++) {
    const cxx = 8 + (i % cols) * gx + gx / 2, cyy = ph + h * 0.16 + Math.floor(i / cols) * gy + gy / 2;
    if (i + 1 === mark) { g.strokeStyle = C.red; g.lineWidth = 2.5; g.beginPath(); g.arc(cxx, cyy, gx * 0.42, 0, 7); g.stroke(); }
    txt(g, mm(i + 1), cxx, cyy, Math.round(gy * 0.55), i % 7 === 0 ? C.red : '#3A2E24', { weight: 600 });
  }
}
/** A soft round glow (lamp pools on the floor); one shared texture for every room. */
let poolTex = null;
function glowTexture() {
  if (poolTex) return poolTex;
  const s = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(255,214,150,0.9)');
  grd.addColorStop(0.5, 'rgba(255,190,120,0.35)');
  grd.addColorStop(1, 'rgba(255,170,100,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  poolTex = new THREE.CanvasTexture(cv);
  poolTex.userData.shared = true;
  return poolTex;
}
/** Soft-edged rectangle (sun patches, light shafts). */
let patchTex = null;
function patchTexture() {
  if (patchTex) return patchTex;
  const s = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  g.filter = 'blur(5px)';
  g.fillStyle = 'rgba(255,236,190,1)';
  g.fillRect(10, 10, s - 20, s - 20);
  patchTex = new THREE.CanvasTexture(cv);
  patchTex.userData.shared = true;
  return patchTex;
}
let shaftTex = null;
function shaftTexture() {
  if (shaftTex) return shaftTex;
  const cv = document.createElement('canvas');
  cv.width = 32; cv.height = 64;
  const g = cv.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 64);
  grd.addColorStop(0, 'rgba(255,240,205,0.95)');
  grd.addColorStop(1, 'rgba(255,240,205,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 32, 64);
  const side = g.createLinearGradient(0, 0, 32, 0);
  side.addColorStop(0, 'rgba(0,0,0,1)');
  side.addColorStop(0.2, 'rgba(0,0,0,0)');
  side.addColorStop(0.8, 'rgba(0,0,0,0)');
  side.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = side;
  g.fillRect(0, 0, 32, 64);
  shaftTex = new THREE.CanvasTexture(cv);
  shaftTex.userData.shared = true;
  return shaftTex;
}
let rainTex = null;
function rainTexture() {
  if (rainTex) return rainTex;
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = 'rgba(70,90,110,0.35)';
  g.fillRect(0, 0, 64, 128);
  const r = rand(11);
  g.strokeStyle = 'rgba(235,242,250,0.8)';
  g.lineWidth = 1.5;
  for (let i = 0; i < 26; i++) { const x = r() * 64, y = r() * 128; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 12 + r() * 10); g.stroke(); }
  for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(240,248,255,0.7)'; g.beginPath(); g.arc(r() * 64, r() * 128, 1.5 + r() * 1.5, 0, 7); g.fill(); }
  rainTex = new THREE.CanvasTexture(cv);
  rainTex.wrapS = rainTex.wrapT = THREE.RepeatWrapping;
  rainTex.userData.shared = true;
  return rainTex;
}

// ---------------------------------------------------------------------------------------------
// the stage every room is built on: kit room + atlas + window views + light decals + look state
// ---------------------------------------------------------------------------------------------
const TMP = new THREE.Color(), TMP2 = new THREE.Color();
function addDecal(parent, geos, tex, opacity, name, order = 2, side = THREE.FrontSide) {
  const m = new THREE.Mesh(mergeGeometries(geos, false), basic('#ffffff', { map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity, side }));
  geos.forEach((q) => q.dispose());
  m.renderOrder = order;
  m.raycast = () => {};
  m.name = name;
  m.userData.dynamic = true;
  parent.add(m);
  return m;
}

function makeStage(opts) {
  const room = kit.createRoom({ windows: [], ...opts });
  const { width: W, depth: D, height: H } = room;
  const hw = W / 2, hd = D / 2;
  const atlas = makeAtlas(1024);
  const S = new VoxelBuilder(); // room-space statics that need no collision (wall dressing, floor bits)
  const pools = []; // [x, y, z, r] warm pools under lamps (dusk)
  const patches = []; // [x, z, w, d, y] sun patches (day)
  const shafts = []; // window light shafts
  const rainQuads = [];
  const anims = [];
  const disposers = [];
  const st = {
    room, W, D, H, hw, hd, atlas, S, anims, disposers,
    spots: {}, stations: [], parts: {},
    /** A back-wall window: wood frame, folded shutters, iron bars, sill; view(g, w, h) paints what is outside. */
    window({ x, y = 1.75, w = 1.2, h = 1.0, view, curtain = null, shutters = true, bars = 3, frame = C.woodD, shutter = C.greenD, shutterD = C.greenXD, sun = true, sunLen = 1.6, sunY = 0.03 }) {
      const z = -hd;
      const r = atlas.draw(Math.round(w * 160), Math.round(h * 160), view);
      atlas.quad(r, w, h, M(x, y, z + 0.03), 'views');
      rainQuads.push([x, y, z + 0.036, w, h]);
      const f = 0.09;
      S.boxMin(x - w / 2 - f, y - h / 2 - f, z, x + w / 2 + f, y - h / 2, z + 0.1, frame);
      S.boxMin(x - w / 2 - f, y + h / 2, z, x + w / 2 + f, y + h / 2 + f, z + 0.1, frame);
      S.boxMin(x - w / 2 - f, y - h / 2, z, x - w / 2, y + h / 2, z + 0.1, frame);
      S.boxMin(x + w / 2, y - h / 2, z, x + w / 2 + f, y + h / 2, z + 0.1, frame);
      S.boxMin(x - w / 2 - 0.16, y - h / 2 - f - 0.05, z, x + w / 2 + 0.16, y - h / 2 - f + 0.02, z + 0.2, jitter(C.wood, 0.05, x * 7)); // sill
      S.boxMin(x - w / 2 - 0.2, y + h / 2 + f, z, x + w / 2 + 0.2, y + h / 2 + f + 0.08, z + 0.14, C.woodD); // lintel
      for (let i = 1; i <= bars; i++) S.box(x - w / 2 + (i * w) / (bars + 1), y, z + 0.06, 0.025, h, 0.025, C.iron);
      if (bars) S.box(x, y, z + 0.06, w, 0.025, 0.025, C.iron);
      if (shutters) {
        for (const s of [-1, 1]) {
          const sw = w * 0.46;
          const sv = new VoxelBuilder();
          // a louvred plank shutter folded back toward the wall
          sv.box(0, 0, 0, sw, h + 0.1, 0.04, jitter(shutter, 0.05, s + 3));
          for (let k = 0; k < 5; k++) sv.box(0, -h / 2 + 0.12 + (k * (h - 0.14)) / 4.5, 0.025, sw * 0.86, 0.035, 0.02, shutterD);
          sv.box(s * sw * 0.42, 0, 0.03, 0.03, h * 0.92, 0.02, shutterD);
          sv.box(-s * sw * 0.42, 0, 0.03, 0.03, h * 0.92, 0.02, shutterD);
          const hx = x + s * (w / 2 + f);
          S.merge(sv, M(hx + s * Math.cos(0.4) * sw / 2, y, z + 0.06 + Math.sin(0.4) * sw / 2, 0, -s * 0.4, 0));
          S.box(hx + s * 0.02, y + h * 0.3, z + 0.07, 0.05, 0.05, 0.08, C.iron); // hinges
          S.box(hx + s * 0.02, y - h * 0.3, z + 0.07, 0.05, 0.05, 0.08, C.iron);
        }
      }
      if (curtain) {
        S.box(x, y + h / 2 + f + 0.14, z + 0.2, w + 0.5, 0.03, 0.03, C.goldD); // rod
        for (let k = 0; k < 4; k++) S.box(x - w / 2 - 0.08 + k * 0.075, y + 0.1, z + 0.22 + (k % 2) * 0.025, 0.085, h + 0.3, 0.03, jitter(curtain, 0.06, k));
        S.box(x - w / 2 + 0.03, y - 0.08, z + 0.26, 0.32, 0.05, 0.06, C.gold); // tie
      }
      if (sun) {
        patches.push([x + 0.12, z + 0.25 + sunLen * 0.62, w * 1.05, sunLen * 0.75, sunY]);
        shafts.push([x, y, z + 0.07, w * 0.92, h, sunLen]);
      }
    },
    /** A flat sign/picture drawn on the atlas, mounted on a wall at (along, y). */
    wallSign(wall, along, y, w, h, draw, px = 200, layer = 'signs', out = 0.065) {
      const r = atlas.draw(Math.round(w * px), Math.round(h * px), draw);
      let m;
      if (wall === 'back') m = M(along, y, -hd + out);
      else if (wall === 'left') m = M(-hw + out, y, along, 0, Math.PI / 2, 0);
      else m = M(hw - out, y, along, 0, -Math.PI / 2, 0);
      atlas.quad(r, w, h, m, layer);
      return r;
    },
    /** A flat atlas quad placed by matrix (labels, papers on tables: rx = -PI/2 lies flat). */
    sign(w, h, m, draw, px = 200, layer = 'signs') {
      const r = atlas.draw(Math.max(8, Math.round(w * px)), Math.max(8, Math.round(h * px)), draw);
      atlas.quad(r, w, h, m, layer);
      return r;
    },
    /** A small flame (glow layer: lit at dusk) or an ember (signs layer: always lit). */
    flame(x, y, z, w = 0.05, h = 0.08, kind = 'flame') {
      if (!st._flameR) st._flameR = atlas.draw(8, 8, (g) => { g.fillStyle = '#FFE3A0'; g.fillRect(0, 0, 8, 8); });
      if (!st._emberR) st._emberR = atlas.draw(8, 8, (g) => { g.fillStyle = '#FF7A2E'; g.fillRect(0, 0, 8, 8); });
      atlas.block(kind === 'ember' ? st._emberR : st._flameR, M(x, y, z, 0, 0.6, 0, w, h, w), kind === 'ember' ? 'signs' : 'glow');
    },
    pool(x, z, r = 1.4, y = 0.035) { pools.push([x, y, z, r]); },
    spot(name, x, z, h = 0, y = 0) { st.spots[name] = y ? { x, z, h, y } : { x, z, h }; },
    /** A story tap target (no marker, ever). */
    tap(id, x, z, r, look, name) { st.stations.push({ id, x, z, r, look: look || { x, z }, name }); },
    steam(x, y, z, n = 6) { (st._steam ||= []).push([x, y, z, n]); },
    motes(x, y, z, w, h, d, n = 16) { st._motes = [x, y, z, w, h, d, n]; },
    finish() {
      const g = room.group;
      if (S.parts.length) g.add(piece(S, null, "quarterDressing"));
      room.bake();
      st.meshes = atlas.build(g);
      if (pools.length) st.poolMesh = addDecal(g, pools.map(([x, y, z, r]) => new THREE.PlaneGeometry(r * 2, r * 2).applyMatrix4(M(x, y, z, -Math.PI / 2))), glowTexture(), 0, 'lampPools');
      if (patches.length) st.patchMesh = addDecal(g, patches.map(([x, z, w, d, y]) => new THREE.PlaneGeometry(w, d).applyMatrix4(M(x, y, z, -Math.PI / 2, 0, 0.1))), patchTexture(), 0.3, 'sunPatches');
      if (shafts.length) {
        st.shaftMesh = addDecal(g, shafts.map(([x, y, z, w, h, len]) => {
          const top = y + h * 0.2, ang = Math.atan2(top, len), L = Math.hypot(top, len);
          return new THREE.PlaneGeometry(w, L).applyMatrix4(M(x + 0.06, top / 2, z + len / 2, -(Math.PI / 2 - ang), 0, 0));
        }), shaftTexture(), 0.14, 'sunShafts', 3, THREE.DoubleSide);
      }
      if (rainQuads.length) {
        const geos = rainQuads.map(([x, y, z, w, h]) => {
          const q = new THREE.PlaneGeometry(w, h);
          const uv = q.attributes.uv;
          for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h);
          return q.applyMatrix4(M(x, y, z));
        });
        const m = new THREE.Mesh(mergeGeometries(geos, false), basic('#ffffff', { map: rainTexture(), transparent: true, depthWrite: false, opacity: 0 }));
        geos.forEach((q) => q.dispose());
        m.visible = false; m.raycast = () => {}; m.name = 'windowRain'; m.userData.dynamic = true;
        g.add(m);
        st.rainMesh = m;
      }
      if (st._steam) {
        const n = st._steam.reduce((a, s) => a + s[3], 0);
        const mat = basic('#FFFFFF', { map: glowTexture(), transparent: true, opacity: 0.5, depthWrite: false });
        const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, n);
        mat.color.set('#FFFFFF');
        im.name = 'steam'; im.raycast = () => {}; im.renderOrder = 4; im.frustumCulled = false;
        const list = [];
        for (const [x, y, z, k] of st._steam) for (let i = 0; i < k; i++) list.push({ x, y, z, ph: i / k, sd: Math.sin(i * 12.9 + x * 3) });
        const dummy = new THREE.Object3D();
        g.add(im);
        st.steamMesh = im;
        anims.push((dt, t) => {
          for (let i = 0; i < list.length; i++) {
            const s = list[i];
            const a = (t * 0.3 + s.ph) % 1;
            dummy.position.set(s.x + Math.sin(t * 1.3 + s.sd * 5) * 0.06 * a + s.sd * 0.02, s.y + a * 0.75, s.z + Math.cos(t + s.sd * 4) * 0.03 * a);
            dummy.rotation.set(a * 1.2, s.sd * 3 + a, 0);
            const k = a < 0.15 ? a / 0.15 : 1 - (a - 0.15) / 0.85;
            dummy.scale.setScalar((0.07 + a * 0.16) * Math.max(0.05, k));
            dummy.updateMatrix();
            im.setMatrixAt(i, dummy.matrix);
          }
          im.instanceMatrix.needsUpdate = true;
        });
      }
      if (st._motes) {
        const [x, y, z, w, h, d, n] = st._motes;
        const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, 0.02, 0.02), basic('#FFF4CF', { map: glowTexture(), transparent: true, opacity: 0.9, depthWrite: false }), n);
        im.name = 'motes'; im.raycast = () => {}; im.renderOrder = 4; im.frustumCulled = false;
        const r = rand(5);
        const ms = Array.from({ length: n }, () => ({ x: (r() - 0.5) * w, y: r() * h, z: (r() - 0.5) * d, s: 0.5 + r(), p: r() * 6 }));
        const dummy = new THREE.Object3D();
        g.add(im);
        st.moteMesh = im;
        anims.push((dt, t) => {
          if (!im.visible) return;
          for (let i = 0; i < n; i++) {
            const m = ms[i];
            dummy.position.set(x + m.x + Math.sin(t * 0.3 * m.s + m.p) * 0.12, y + ((m.y + t * 0.04 * m.s) % h), z + m.z + Math.cos(t * 0.25 * m.s + m.p) * 0.1);
            dummy.rotation.set(t * m.s, t * 0.7, 0);
            dummy.updateMatrix();
            im.setMatrixAt(i, dummy.matrix);
          }
          im.instanceMatrix.needsUpdate = true;
        });
      }
      st.base = { hemi: room.lights.hemi.intensity, sun: room.lights.sun.intensity, sunColor: room.lights.sun.color.clone() };
      st.look = { evening: 0, rain: 0 };
      st.applyLook();
    },
    applyLook() {
      const { evening: e, rain: r } = st.look;
      const L = room.lights;
      L.hemi.intensity = st.base.hemi * (1 - 0.3 * e - 0.22 * r);
      L.sun.intensity = st.base.sun * (1 - 0.5 * e - 0.4 * r);
      L.sun.color.copy(st.base.sunColor).lerp(TMP.set('#FFB27A'), e * 0.8).lerp(TMP.set('#C9D4E0'), r * 0.6);
      const lit = Math.max(e, r * 0.55);
      if (st.meshes.glow) st.meshes.glow.material.color.copy(TMP.set('#7A6450')).lerp(TMP2.set('#FFFFFF'), lit);
      if (st.meshes.views) st.meshes.views.material.color.set('#FFFFFF').lerp(TMP.set('#E79C72'), e * 0.75).lerp(TMP.set('#8E9AA6'), r * 0.7);
      if (st.poolMesh) { st.poolMesh.material.opacity = 0.5 * lit; st.poolMesh.visible = lit > 0.02; }
      const day = (1 - e) * (1 - r);
      if (st.patchMesh) { st.patchMesh.material.opacity = 0.3 * day; st.patchMesh.visible = day > 0.02; }
      if (st.shaftMesh) { st.shaftMesh.material.opacity = 0.14 * day; st.shaftMesh.visible = day > 0.02; }
      if (st.moteMesh) st.moteMesh.visible = day > 0.3;
      if (st.rainMesh) { st.rainMesh.visible = r > 0.01; st.rainMesh.material.opacity = r; }
      for (const f of st.onLook || []) f(e, r);
    },
    result(extra = {}) {
      return {
        scene: room.scene, group: room.group, room,
        width: W, depth: D, height: H,
        bounds: room.bounds, obstacles: room.obstacles, door: room.door, spawn: room.spawn,
        stations: st.stations, spots: st.spots, parts: st.parts,
        windowViews: [], // the room paints its own views; daytime.applyRoom only sets the light
        update(dt, t) {
          for (const a of anims) a(dt, t);
          if (st.rainMesh?.visible) st.rainMesh.material.map.offset.y = (t * 1.6) % 1;
        },
        setEvening(k = 1) { st.look.evening = Math.max(0, Math.min(1, +k || 0)); st.applyLook(); },
        setRain(k = 1) { st.look.rain = k === true ? 1 : Math.max(0, Math.min(1, +k || 0)); st.applyLook(); },
        dispose() {
          for (const d of disposers) d();
          room.dispose();
          atlas.tex?.dispose();
        },
        ...extra,
      };
    },
  };
  return st;
}

// ---------------------------------------------------------------------------------------------
// shared furniture and small things (local space, feet at y = 0, fronts +Z)
// ---------------------------------------------------------------------------------------------
/** A tea-shop low table with a lower shelf. */
function lowTable({ w = 0.62, d = 0.62, h = 0.45, top = C.woodL, legs = C.woodD, seed = 1 } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-w / 2, h - 0.045, -d / 2, w / 2, h, d / 2, jitter(top, 0.05, seed));
  v.boxMin(-w / 2 - 0.01, h - 0.07, -d / 2 - 0.01, w / 2 + 0.01, h - 0.045, d / 2 + 0.01, legs);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * (w / 2 - 0.05), (h - 0.07) / 2, sz * (d / 2 - 0.05), 0.05, h - 0.07, 0.05, legs);
  v.boxMin(-w / 2 + 0.05, 0.1, -d / 2 + 0.05, w / 2 - 0.05, 0.12, d / 2 - 0.05, jitter(legs, 0.08, seed + 2));
  return v;
}
/** A tiny tea-shop stool. */
function stoolInto(v, x, z, col = C.maroon, h = 0.26, ry = 0) {
  const c = Math.cos(ry), s = Math.sin(ry);
  v.box(x, h - 0.02, z, 0.27, 0.04, 0.27, col, ry);
  v.box(x, h - 0.05, z, 0.22, 0.03, 0.22, jitter(col, 0.12, 3), ry);
  for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) v.box(x + (a * c + b * s) * 0.1, (h - 0.05) / 2, z + (-a * s + b * c) * 0.1, 0.035, h - 0.05, 0.035, jitter(col, 0.1, a + b));
  v.box(x, 0.08, z, 0.2, 0.02, 0.02, jitter(col, 0.14, 5), ry);
}
/** A glass of milk tea on a saucer. */
function teaGlass(v, x, y, z, fill = '#C79A68', s = 1) {
  cyl(v, x, y + 0.006, z, 0.045 * s, 0.045 * s, 0.012, C.white);
  cyl(v, x, y + 0.045 * s, z, 0.032 * s, 0.027 * s, 0.07 * s, C.glass, 8);
  cyl(v, x, y + 0.04 * s, z, 0.03 * s, 0.025 * s, 0.055 * s, fill, 8);
  cyl(v, x, y + 0.067 * s, z, 0.03 * s, 0.03 * s, 0.006, '#E8D2B0', 8);
}
/** A thermos flask (plain green tea on every table). */
function thermos(v, x, y, z, col = C.red, s = 1) {
  cyl(v, x, y + 0.13 * s, z, 0.055 * s, 0.06 * s, 0.26 * s, col, 8);
  cyl(v, x, y + 0.04 * s, z, 0.062 * s, 0.062 * s, 0.03 * s, C.tinD, 8);
  cyl(v, x, y + 0.24 * s, z, 0.062 * s, 0.062 * s, 0.03 * s, C.tinD, 8);
  cyl(v, x, y + 0.285 * s, z, 0.035 * s, 0.045 * s, 0.05 * s, C.tinL, 8);
  v.box(x + 0.065 * s, y + 0.16 * s, z, 0.02 * s, 0.12 * s, 0.03 * s, C.tinD);
  v.box(x, y + 0.14 * s, z + 0.058 * s, 0.05 * s, 0.05 * s, 0.006, C.cream); // a flower decal
}
/** A big aluminium kettle. */
function kettle(v, x, y, z, s = 1, ry = 0) {
  cyl(v, x, y + 0.03 * s, z, 0.15 * s, 0.13 * s, 0.06 * s, C.tinD);
  cyl(v, x, y + 0.13 * s, z, 0.16 * s, 0.15 * s, 0.14 * s, C.tin);
  cyl(v, x, y + 0.23 * s, z, 0.1 * s, 0.155 * s, 0.07 * s, C.tinL);
  cyl(v, x, y + 0.28 * s, z, 0.04 * s, 0.05 * s, 0.03 * s, C.ink);
  const c = Math.cos(ry), sn = Math.sin(ry);
  const px = (a, b) => [x + a * c + b * sn, z - a * sn + b * c];
  let [sx, sz] = px(0.19 * s, 0);
  rb(v, sx, y + 0.17 * s, sz, 0.16 * s, 0.045 * s, 0.045 * s, C.tin, 0, ry, 0.75);
  [sx, sz] = px(-0.0, 0);
  rb(v, sx, y + 0.36 * s, sz, 0.03 * s, 0.03 * s, 0.22 * s, C.ink, 0, ry + Math.PI / 2, 0);
  for (const k of [-1, 1]) { [sx, sz] = px(0, k * 0.1 * s); rb(v, sx, y + 0.31 * s, sz, 0.025 * s, 0.1 * s, 0.025 * s, C.ink, k * 0.4, ry, 0); }
}
/** A clay bucket stove on three bricks, embers glowing (ember layer is added by the room). */
function clayStove(st, v, x, y, z, s = 1, toW = (a, b) => [a, b]) {
  cyl(v, x, y + 0.13 * s, z, 0.2 * s, 0.17 * s, 0.26 * s, C.terra, 8);
  cyl(v, x, y + 0.26 * s, z, 0.21 * s, 0.21 * s, 0.03 * s, C.terraD, 8);
  cyl(v, x, y + 0.03 * s, z, 0.19 * s, 0.19 * s, 0.06 * s, C.terraD, 8);
  v.box(x, y + 0.1 * s, z + 0.17 * s, 0.13 * s, 0.1 * s, 0.04 * s, C.soot); // draught mouth
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; v.box(x + Math.cos(a) * 0.14 * s, y + 0.295 * s, z + Math.sin(a) * 0.14 * s, 0.07 * s, 0.04 * s, 0.07 * s, C.iron); }
  let [fx, fz] = toW(x, z + 0.19 * s);
  st.flame(fx, y + 0.11 * s, fz, 0.09 * s, 0.05 * s, 'ember');
  [fx, fz] = toW(x, z);
  st.flame(fx, y + 0.27 * s, fz, 0.2 * s, 0.03 * s, 'ember');
}
/** A pyramid of condensed-milk tins. */
function tinPile(v, x, y, z, n = 3, s = 1) {
  const labels = ['#2F5DB3', '#E8E2D2', '#C8323C'];
  for (let row = 0; row < n; row++) {
    for (let i = 0; i < n - row; i++) {
      const tx = x + (i - (n - row - 1) / 2) * 0.085 * s, ty = y + row * 0.1 * s;
      cyl(v, tx, ty + 0.05 * s, z, 0.04 * s, 0.04 * s, 0.1 * s, C.tinL, 8);
      cyl(v, tx, ty + 0.05 * s, z, 0.041 * s, 0.041 * s, 0.06 * s, labels[(i + row) % 3], 8);
    }
  }
}
/** A slumped sack. */
function sackInto(v, x, z, col = C.sack, s = 1, ry = 0, fill = null) {
  v.box(x, 0.2 * s, z, 0.42 * s, 0.4 * s, 0.32 * s, col, ry);
  v.box(x, 0.43 * s, z, 0.36 * s, 0.08 * s, 0.26 * s, jitter(col, 0.08, 2), ry);
  v.box(x, 0.49 * s, z, 0.16 * s, 0.07 * s, 0.12 * s, jitter(col, 0.12, 4), ry);
  v.box(x, 0.46 * s, z, 0.2 * s, 0.025 * s, 0.15 * s, C.woodD, ry); // the tie
  if (fill) v.box(x, 0.47 * s, z, 0.28 * s, 0.03 * s, 0.2 * s, fill, ry);
  v.box(x, 0.2 * s, z + 0.161 * s * Math.cos(ry), 0.2 * s, 0.12 * s, 0.004, jitter(col, -0.15, 1), ry); // a stencil band
}
/** Simple fired / raw pot, 8-sided tiers. */
function potInto(v, x, y, z, s = 1, kind = 'whole', lean = 0) {
  const P = kind === 'raw' ? [C.clayRawD, '#D3AC82', '#E4C49E', C.clayRaw, C.clayRawD] : kind === 'thick' ? ['#7F4630', C.terraD, C.terra, C.terraD, C.terra] : [C.terraD, C.terra, C.terraL, C.terra, C.terraD];
  const T = [[0.1, 0.04], [0.15, 0.07], [0.19, 0.12], [0.16, 0.07], [0.1, 0.06]];
  let yy = y;
  T.forEach(([r, h], i) => { cyl(v, x + lean * (yy - y), yy + (h * s) / 2, z, r * s, r * s, h * s, P[i], 8, 0, -lean); yy += h * s; });
  cyl(v, x + lean * (yy - y), yy + 0.015 * s, z, 0.12 * s, 0.12 * s, 0.03 * s, P[2], 8, 0, -lean);
  cyl(v, x + lean * (yy - y), yy + 0.031 * s, z, 0.085 * s, 0.085 * s, 0.004, kind === 'raw' ? '#9C7752' : C.soot, 8);
  if (kind === 'whole') cyl(v, x, y + 0.16 * s, z, 0.194 * s, 0.194 * s, 0.02 * s, '#EBDCBF', 8);
  return yy + 0.03 * s;
}
/** A wall clock (round frame); its face is an atlas quad. */
function wallClock(st, wall, along, y, r = 0.22) {
  const face = st.atlas.draw(96, 96, (g, w, h) => {
    g.fillStyle = '#FBF6EA'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 2, 0, 7); g.fill();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillStyle = C.ink; g.fillRect(w / 2 + Math.sin(a) * 36 - 2, h / 2 - Math.cos(a) * 36 - 2, 4, 4); }
    g.strokeStyle = C.ink; g.lineCap = 'round';
    g.lineWidth = 5; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + 16, h / 2 - 14); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 - 6, h / 2 - 32); g.stroke();
    g.fillStyle = C.red; g.beginPath(); g.arc(w / 2, h / 2, 4, 0, 7); g.fill();
  });
  const v = new VoxelBuilder();
  cyl(v, 0, 0, 0.03, r, r, 0.06, C.maroon, 12, Math.PI / 2);
  cyl(v, 0, 0, 0.035, r * 0.88, r * 0.88, 0.062, C.goldD, 12, Math.PI / 2);
  const hd = st.hd, hw = st.hw;
  const m = wall === 'back' ? M(along, y, -hd + 0.01) : wall === 'left' ? M(-hw + 0.01, y, along, 0, Math.PI / 2, 0) : M(hw - 0.01, y, along, 0, -Math.PI / 2, 0);
  st.S.merge(v, m);
  st.atlas.quad(face, r * 1.62, r * 1.62, m.clone().multiply(M(0, 0, 0.068)));
}
/** A hanging oil lamp on a hook from above (beam or wall bracket at top). */
function hangingLamp(st, x, y, z, chain = 0.5) {
  const S = st.S;
  S.box(x, y + chain / 2, z, 0.015, chain, 0.015, C.iron);
  cyl(S, x, y - 0.02, z, 0.09, 0.07, 0.04, C.goldD, 8);
  cyl(S, x, y - 0.13, z, 0.06, 0.08, 0.18, C.glass, 8);
  cyl(S, x, y - 0.24, z, 0.08, 0.09, 0.05, C.goldD, 8);
  st.flame(x, y - 0.14, z, 0.05, 0.09);
  st.pool(x, z + 0.15, 1.5);
}
/** Strings of snack packets hanging from a wire along the back wall (a Myanmar shop classic). */
function packetStrips(st, x0, x1, y, z, seed = 2) {
  const S = st.S;
  const r = rand(seed);
  S.box((x0 + x1) / 2, y, z, x1 - x0, 0.015, 0.015, C.iron);
  const cols = [['#E2B33C', '#C8323C'], ['#2F5DB3', '#F6F0E2'], ['#6F9E5B', '#E2B33C'], ['#C8323C', '#F6F0E2'], ['#E8A94A', '#6E1F2A']];
  for (let x = x0 + 0.12; x < x1 - 0.08; x += 0.17) {
    const [a, b] = cols[Math.floor(r() * cols.length)];
    const n = 4 + Math.floor(r() * 4);
    for (let k = 0; k < n; k++) {
      const yy = y - 0.08 - k * 0.11;
      S.box(x, yy, z + 0.01, 0.12, 0.1, 0.02, k % 2 ? a : jitter(a, 0.08, k));
      S.box(x, yy + 0.015, z + 0.022, 0.08, 0.035, 0.004, b);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// school furniture
// ---------------------------------------------------------------------------------------------
const BOOKS = [C.maroon, C.goldD, '#2F5DB3', '#3E6B4F', C.cream, '#8E5A3C', '#C27A5B', C.mustard];
/** A pupil's desk joined to its bench (two seats, or one). Pupils sit on the +Z bench facing -Z. */
function benchDesk({ seats = 2, seed = 1, books = 3 } = {}) {
  const W = seats === 2 ? 1.24 : 0.72;
  const v = new VoxelBuilder();
  const dz = -0.15, H = 0.7;
  rb(v, 0, H - 0.01, dz + 0.04, W, 0.035, 0.36, jitter(C.teak, 0.05, seed), 0.09, 0, 0); // sloping lid
  v.boxMin(-W / 2, H - 0.005, dz - 0.25, W / 2, H + 0.03, dz - 0.13, jitter(C.teakD, 0.04, seed + 1)); // flat back strip
  v.boxMin(-W / 2, H + 0.03, dz - 0.25, W / 2, H + 0.04, dz - 0.235, C.woodD);
  for (let i = 0; i < seats; i++) {
    const x = seats === 2 ? (i ? 0.31 : -0.31) : 0;
    cyl(v, x + 0.12, H + 0.035, dz - 0.19, 0.028, 0.028, 0.012, C.ink, 8); // ink well
    cyl(v, x + 0.12, H + 0.04, dz - 0.19, 0.016, 0.016, 0.004, '#1D2A4A', 8);
    v.box(x - 0.08, H + 0.034, dz - 0.19, 0.18, 0.006, 0.02, C.woodD); // pencil groove
  }
  v.boxMin(-W / 2 + 0.02, 0.3, dz - 0.25, W / 2 - 0.02, H - 0.03, dz - 0.21, C.greenD); // front panel (painted)
  for (const sx of [-1, 1]) {
    v.boxMin(sx * W / 2 - 0.035, 0, dz - 0.26, sx * W / 2 + 0.035, H - 0.02, dz - 0.18, C.woodD); // legs
    v.boxMin(sx * W / 2 - 0.035, 0.28, dz - 0.26, sx * W / 2 + 0.035, H - 0.02, dz + 0.2, C.woodD); // side cheeks
    v.boxMin(sx * W / 2 - 0.04, 0, dz - 0.3, sx * W / 2 + 0.04, 0.06, 0.5, C.woodXD); // floor runners join desk and bench
    v.boxMin(sx * W / 2 - 0.03, 0.06, 0.32, sx * W / 2 + 0.03, 0.4, 0.38, C.woodD); // bench legs
  }
  v.boxMin(-W / 2 + 0.04, 0.48, dz - 0.2, W / 2 - 0.04, 0.505, dz + 0.17, C.woodD); // book shelf under the lid
  const r = rand(seed * 13);
  let x = -W / 2 + 0.07;
  for (let k = 0; k < books * 3 && x < W / 2 - 0.1; k++) {
    const bw = 0.025 + r() * 0.02;
    if (r() > 0.25) v.boxMin(x, 0.505, dz - 0.17, x + bw, 0.505 + 0.13 + r() * 0.06, dz + 0.12, BOOKS[Math.floor(r() * BOOKS.length)]);
    x += bw + 0.006;
  }
  v.boxMin(-W / 2, 0.4, 0.2, W / 2, 0.445, 0.47, jitter(C.teak, 0.06, seed + 4)); // bench seat
  v.boxMin(-W / 2, 0.39, 0.2, W / 2, 0.4, 0.47, C.woodD);
  v.box(0, 0.16, 0.35, W - 0.06, 0.04, 0.04, C.woodD); // stretcher
  return piece(v, { w: W + 0.06, d: 0.86 }, 'benchDesk');
}
function teacherDesk({ W = 1.3, D = 0.62, H = 0.76 } = {}) {
  const v = new VoxelBuilder();
  v.boxMin(-W / 2 - 0.03, H - 0.05, -D / 2 - 0.03, W / 2 + 0.03, H, D / 2 + 0.03, jitter(C.teak, 0.04, 2));
  v.boxMin(-W / 2 - 0.035, H - 0.06, -D / 2 - 0.035, W / 2 + 0.035, H - 0.05, D / 2 + 0.035, C.woodD);
  v.boxMin(-W / 2 + 0.03, 0.18, D / 2 - 0.06, W / 2 - 0.45, H - 0.06, D / 2 - 0.02, C.greenD); // front panel
  v.boxMin(-W / 2 + 0.03, H - 0.16, D / 2 - 0.05, W / 2 - 0.45, H - 0.14, D / 2, C.woodD);
  v.boxMin(W / 2 - 0.45, 0, -D / 2 + 0.03, W / 2 - 0.02, H - 0.06, D / 2 - 0.02, C.woodD); // drawer pedestal
  for (let i = 0; i < 3; i++) {
    v.boxMin(W / 2 - 0.42, 0.06 + i * 0.22, D / 2 - 0.02, W / 2 - 0.05, 0.24 + i * 0.22, D / 2, C.teakD);
    v.box(W / 2 - 0.235, 0.15 + i * 0.22, D / 2 + 0.01, 0.1, 0.025, 0.02, C.gold);
  }
  for (const sz of [-1, 1]) v.box(-W / 2 + 0.06, (H - 0.06) / 2, sz * (D / 2 - 0.06), 0.07, H - 0.06, 0.07, C.woodD);
  return piece(v, { w: W + 0.06, d: D + 0.06 }, 'teacherDesk');
}
function woodChair(col = C.teakD) {
  const v = new VoxelBuilder();
  v.boxMin(-0.22, 0.42, -0.21, 0.22, 0.47, 0.21, col);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * 0.18, 0.21, sz * 0.17, 0.05, 0.42, 0.05, C.woodD);
  for (const sx of [-1, 1]) v.box(sx * 0.18, 0.72, -0.18, 0.05, 0.5, 0.05, C.woodD);
  v.box(0, 0.88, -0.18, 0.42, 0.1, 0.04, col);
  v.box(0, 0.68, -0.18, 0.36, 0.05, 0.03, col);
  return piece(v, { w: 0.46, d: 0.44 }, 'chair');
}
/** A low book shelf; `fill` 0..1 how full. */
function bookShelf({ w = 1.3, h = 1.1, d = 0.34, rows = 3, fill = 0.85, seed = 3, wood = C.woodD, open = false } = {}) {
  const v = new VoxelBuilder();
  if (open) {
    // open-sided (side-wall shelves: the camera looks along them, so posts instead of panels)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * (w / 2 - 0.025), h / 2, sz * (d / 2 - 0.025), 0.05, h, 0.05, wood);
  } else {
    v.boxMin(-w / 2, 0, -d / 2, -w / 2 + 0.05, h, d / 2, wood);
    v.boxMin(w / 2 - 0.05, 0, -d / 2, w / 2, h, d / 2, wood);
  }
  v.boxMin(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.03, jitter(wood, 0.12, 4));
  v.boxMin(-w / 2 - 0.02, h, -d / 2 - 0.01, w / 2 + 0.02, h + 0.04, d / 2 + 0.02, C.teakD);
  v.boxMin(-w / 2, 0, d / 2 - 0.03, w / 2, 0.08, d / 2, C.woodXD); // kick
  const gap = (h - 0.08) / rows;
  const r = rand(seed);
  for (let k = 0; k < rows; k++) {
    const y = 0.08 + k * gap;
    v.boxMin(-w / 2, y - 0.03, -d / 2, w / 2, y, d / 2, wood);
    let x = -w / 2 + 0.07;
    const end = -w / 2 + 0.07 + (w - 0.14) * fill * (0.75 + r() * 0.25);
    while (x < end) {
      const bw = 0.035 + r() * 0.035, bh = gap * (0.55 + r() * 0.3);
      if (r() < 0.12) { rb(v, x + 0.06, y + 0.03 + bh * 0.4, 0, 0.035, bh, d - 0.1, BOOKS[Math.floor(r() * 8)], 0, 0, -0.5); x += 0.13; continue; }
      v.boxMin(x, y, -d / 2 + 0.05, x + bw, y + bh, d / 2 - 0.05, BOOKS[Math.floor(r() * 8)]);
      v.box(x + bw / 2, y + bh * 0.7, d / 2 - 0.048, bw * 0.7, 0.012, 0.004, C.gold);
      x += bw + 0.008;
    }
    if (fill < 0.6) for (let i = 0; i < 2; i++) v.box(end + 0.12 + i * 0.05, y + 0.012, 0, 0.18, 0.02, d - 0.12, BOOKS[(k + i) % 8]); // a lying pile
  }
  return piece(v, { w, d }, 'bookShelf');
}
/** A clay drinking-water pot on a wooden stand, a lid and a tin cup. */
function waterPot() {
  const v = new VoxelBuilder();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * 0.17, 0.25, sz * 0.17, 0.05, 0.5, 0.05, C.woodD);
  v.boxMin(-0.22, 0.48, -0.22, 0.22, 0.53, 0.22, C.wood);
  v.boxMin(-0.2, 0.12, -0.2, 0.2, 0.15, 0.2, C.woodD);
  const top = potInto(v, 0, 0.53, 0, 1.05, 'thick');
  cyl(v, 0, top + 0.01, 0, 0.14, 0.14, 0.025, C.woodL, 8); // wooden lid
  cyl(v, 0, top + 0.04, 0, 0.03, 0.03, 0.04, C.woodD, 6);
  cyl(v, 0.13, top + 0.08, 0.02, 0.04, 0.035, 0.07, C.tinL, 8); // tin cup on the lid
  v.box(0.18, top + 0.08, 0.02, 0.03, 0.04, 0.012, C.tinD);
  return piece(v, { w: 0.5, d: 0.5 }, 'waterPot');
}

// ---------------------------------------------------------------------------------------------
// the classroom chalkboard and the Day 7 backdrop (their own small canvases: text changes by day)
// ---------------------------------------------------------------------------------------------
const BOARDS = {
  rhyme: { title: 'ပဲစိုက်ကဗျာ', lines: ['ပဲစေ့လေး မြေထဲချ၊', 'ရေလေးလောင်း၊ နေလေးပူ၊', 'ပဲပင်လေး ပေါက်လာမယ်။'], art: 'bean' }, // DRAFT(my)
  marks: { title: 'အမှတ်စာရွက်', lines: ['မြန်မာ · အင်္ဂလိပ် · သင်္ချာ', 'သိပ္ပံ · ပထဝီ · သမိုင်း'], art: 'table', date: true }, // DRAFT(my)
  cast: { title: 'ပြဇာတ် · ဇာတ်ကောင်စာရင်း', lines: ['၁။ ရဲယဉ့်', '၂။ တိုးတိုး', '၃။ မိချို', '၄။ စုနွယ်', '၅။ မောင်ငယ်'], art: 'cast' }, // DRAFT(my)
  essay: { title: 'စာစီစာကုံး', lines: ['ကျွန်တော့် ကျောင်းသွားလမ်း', 'အဆုံးမှာ — ဘယ်ကရခဲ့လဲ'], art: 'essay' }, // DRAFT(my)
};
function drawBoard(cv, key, seed = 9) {
  const g = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  slateBg(g, W, H, seed, ['#3F5546', '#2F4237']);
  const b = typeof key === 'string' ? BOARDS[key] || BOARDS.rhyme : key;
  if (b.date) chalkText(g, `${mm(12)}.${mm(6)}`, W - 90, 50, 34, '#F4F1E8', { weight: 600 });
  const cast = b.art === 'cast';
  const x0 = cast ? W * 0.82 : W * 0.38;
  chalkText(g, b.title, x0, H * 0.18, cast ? 40 : 66, '#F7E7A6');
  g.strokeStyle = 'rgba(247,231,166,0.7)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(x0 - (cast ? 150 : 230), H * 0.27); g.lineTo(x0 + (cast ? 150 : 230), H * 0.27); g.stroke();
  const n = b.lines.length;
  const size = cast ? 38 : n > 2 ? 54 : 58;
  b.lines.forEach((l, i) => chalkText(g, l, x0, H * (cast ? 0.38 : 0.42) + i * size * 1.7, size));
  if (b.art === 'bean') {
    // a chalk bean sprout under a sun
    const cx = W * 0.82, cy = H * 0.62;
    g.strokeStyle = '#F4F1E8'; g.lineWidth = 6; g.lineCap = 'round'; g.globalAlpha = 0.9;
    g.beginPath(); g.moveTo(cx - 90, cy + 110); g.lineTo(cx + 90, cy + 110); g.stroke();
    g.strokeStyle = '#BFE3A6';
    g.beginPath(); g.moveTo(cx, cy + 110); g.quadraticCurveTo(cx - 10, cy + 40, cx + 5, cy - 20); g.stroke();
    g.beginPath(); g.ellipse(cx - 34, cy + 10, 34, 16, -0.5, 0, 7); g.stroke();
    g.beginPath(); g.ellipse(cx + 38, cy - 12, 34, 16, 0.5, 0, 7); g.stroke();
    g.strokeStyle = '#F7E7A6';
    g.beginPath(); g.arc(cx + 120, cy - 130, 34, 0, 7); g.stroke();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.beginPath(); g.moveTo(cx + 120 + Math.cos(a) * 46, cy - 130 + Math.sin(a) * 46); g.lineTo(cx + 120 + Math.cos(a) * 64, cy - 130 + Math.sin(a) * 64); g.stroke(); }
    g.globalAlpha = 1;
  } else if (b.art === 'table') {
    g.strokeStyle = 'rgba(244,241,232,0.75)'; g.lineWidth = 3;
    const tx = W * 0.72, ty = H * 0.22, cw = 70, ch = 46;
    for (let r = 0; r <= 5; r++) { g.beginPath(); g.moveTo(tx, ty + r * ch); g.lineTo(tx + cw * 3.5, ty + r * ch); g.stroke(); }
    for (let c = 0; c <= 3; c++) { g.beginPath(); g.moveTo(tx + c * cw * (c === 3 ? 1.1667 : 1), ty); g.lineTo(tx + c * cw * (c === 3 ? 1.1667 : 1), ty + 5 * ch); g.stroke(); }
    ['တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ'].forEach((d, i) => chalkText(g, d, tx + cw / 2 + 4, ty + ch / 2 + i * ch, 16, '#F4F1E8', { weight: 600 })); // DRAFT(my)
  } else if (b.art === 'cast') {
    // the rest of the board hides behind the backdrop; a chalk star and the date
    sparkle(g, W * 0.95, H * 0.85, 22, 'rgba(247,231,166,0.8)');
  } else if (b.art === 'essay') {
    chalkText(g, '— ဆရာမ', W * 0.62, H * 0.86, 30, '#F2C7C7', { weight: 600 }); // DRAFT(my)
    sparkle(g, W * 0.86, H * 0.3, 26, 'rgba(247,231,166,0.85)');
  }
}
function drawBackdrop(cv, painted = 0) {
  const g = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  paperBg(g, W, H, '#F4ECD8', 21);
  // sky wash + clouds
  const sky = g.createLinearGradient(0, 0, 0, H * 0.5);
  sky.addColorStop(0, '#BFD9EC'); sky.addColorStop(1, '#F6E8CC');
  g.fillStyle = sky; g.fillRect(0, 0, W, H * 0.5);
  for (const [x, y, s] of [[0.15, 0.14, 1], [0.48, 0.09, 0.8], [0.8, 0.17, 1.1]]) { g.fillStyle = '#FFF8EE'; rr(g, W * x - 60 * s, H * y, 120 * s, 34 * s, 16 * s, '#FFF8EE'); rr(g, W * x - 30 * s, H * y - 18 * s, 70 * s, 30 * s, 14 * s, '#FFF8EE'); }
  // the Quarter: rows of little ruled houses
  const r = rand(4);
  for (let i = 0; i < 9; i++) {
    const x = 30 + i * 110, y = H * 0.42 + (i % 2) * 14;
    rr(g, x, y, 90, 70, 6, ['#E7D3AE', '#D9C29A', '#EBDCBF'][i % 3], '#8C6A3C', 3);
    g.fillStyle = C.maroon; g.beginPath(); g.moveTo(x - 8, y + 4); g.lineTo(x + 45, y - 34); g.lineTo(x + 98, y + 4); g.fill();
    g.fillStyle = '#7FA3C0'; g.fillRect(x + 14, y + 22, 18, 18); g.fillRect(x + 56, y + 22, 18, 18);
    g.strokeStyle = 'rgba(80,100,140,0.25)'; g.lineWidth = 2;
    for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x + 4, y + 50 + k * 6); g.lineTo(x + 86, y + 50 + k * 6); g.stroke(); }
  }
  // little roads fanning out of the Quarter, a tiny figure on each
  const roads = [[0.12, -0.4], [0.32, -0.15], [0.55, 0.12], [0.78, 0.38]];
  roads.forEach(([x, k], i) => {
    const sx = W * x, sy = H * 0.56, ex = sx + k * 260 + 80, ey = H * 0.96;
    g.strokeStyle = painted > 0 ? '#C9A24A' : 'rgba(60,50,40,0.5)';
    g.lineWidth = painted > 0 ? 18 : 3;
    g.setLineDash(painted > 0 ? [] : [10, 8]);
    g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + k * 120, sy + 80, ex, ey); g.stroke();
    g.setLineDash([]);
    const fx = sx + k * 140 + 30, fy = sy + 100 + r() * 20;
    g.fillStyle = C.ink; g.beginPath(); g.arc(fx, fy - 18, 7, 0, 7); g.fill(); g.fillRect(fx - 5, fy - 11, 10, 18);
  });
  // the bridge: a pencil outline, painted in when finished
  const bx = W * 0.62, by = H * 0.74;
  g.strokeStyle = painted >= 1 ? C.maroon : 'rgba(60,50,40,0.55)';
  g.lineWidth = painted >= 1 ? 10 : 3;
  g.beginPath(); g.moveTo(bx, by + 40); g.quadraticCurveTo(bx + 150, by - 50, bx + 300, by + 40); g.stroke();
  for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(bx + i * 50, by + 40 - Math.sin((i / 6) * Math.PI) * 45); g.lineTo(bx + i * 50, by + 40); g.stroke(); }
  // a ribbon of gold paper pinned at the top
  g.fillStyle = C.gold; g.fillRect(0, 0, W, 16);
  for (let i = 0; i < 6; i++) { g.fillStyle = C.maroon; g.beginPath(); g.arc(40 + i * (W - 80) / 5, 8, 7, 0, 7); g.fill(); }
}
function canvasPlane(w, h, pxW, draw) {
  const cv = document.createElement('canvas');
  cv.width = pxW;
  cv.height = Math.round((pxW * h) / w);
  draw(cv);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic('#ffffff', { map: tex }));
  mesh.userData.dynamic = true;
  mesh.raycast = () => {};
  fontsReady().then(() => { draw(cv); tex.needsUpdate = true; });
  return { mesh, cv, tex, redraw(fn = draw) { draw = fn; fn(cv); tex.needsUpdate = true; } };
}

// =============================================================================================
// classroom · Daw Hnin Wai's grade-6 classroom (INDEX 13.2): 8 x 8, platform along the back wall
// =============================================================================================
function buildClassroom(opts = {}) {
  const day = opts.day ?? 2;
  const d7 = day === 7;
  const st = makeStage({ width: 8, depth: 8, height: 3, wall: '#F4EEDD', wainscot: C.green, trim: '#8C6A3C', floor: 'planks', floorColor: C.teak, background: '#EDE6D3' });
  const { room, S, atlas, hd } = st;
  const PY = 0.2; // platform height

  // --- the platform along the back wall (x -4..4, z -4..-2.8) with plank top, riser and nosing
  for (let i = 0; i < 6; i++) S.boxMin(-4, PY - 0.03, -4 + i * 0.2, 4, PY, -4 + (i + 1) * 0.2 - 0.008, jitter('#B98F5C', 0.06, i + 20));
  S.boxMin(-4, 0, -4, 4, PY - 0.03, -2.8, C.woodD);
  S.boxMin(-4, 0.02, -2.82, 4, PY - 0.035, -2.79, jitter(C.woodD, -0.12, 3)); // riser shadow line
  S.boxMin(-4, PY - 0.035, -2.84, 4, PY + 0.008, -2.78, C.teakD); // nosing
  S.boxMin(-0.5, 0, -2.8, 0.5, 0.1, -2.55, C.teakD); // a step up, centre
  S.boxMin(-0.5, 0.1, -2.8, 0.5, 0.11, -2.56, C.woodL);
  room.obstacles.push({ type: 'box', minX: -4, maxX: 4, minZ: -4.1, maxZ: -2.75 });

  // --- back wall: windows, blackboard, alphabet strip
  const beans = opts.beansInFlower ?? day >= 14;
  const viewBeans = (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#A9CBE6'); sky.addColorStop(1, '#F4E3C6');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = '#FFF8EE'; rr(g, w * 0.1, h * 0.12, w * 0.3, h * 0.1, 8, '#FFF8EE');
    g.fillStyle = '#E8D9BC'; g.fillRect(0, h * 0.62, w, h * 0.38); // the yard
    g.fillStyle = '#C9A06A'; g.fillRect(0, h * 0.7, w, h * 0.05); // planter boxes
    for (let i = 0; i < 7; i++) {
      const x = 10 + i * (w - 20) / 6;
      g.strokeStyle = '#8C6A3C'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, h * 0.72); g.lineTo(x, h * 0.3); g.stroke(); // canes
      g.fillStyle = '#6F9E5B';
      for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x + (k % 2 ? 7 : -7), h * (0.66 - k * 0.09), 9, 6, k % 2 ? 0.5 : -0.5, 0, 7); g.fill(); }
      if (beans) { g.fillStyle = i % 2 ? '#E8A0C8' : '#F4F0FF'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x + (k % 2 ? -6 : 6), h * (0.4 + k * 0.1), 5, 0, 7); g.fill(); } }
    }
  };
  const viewYard = (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#A9CBE6'); sky.addColorStop(1, '#F7E6CA');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    rr(g, w * 0.5, h * 0.18, w * 0.34, h * 0.1, 8, '#FFF8EE');
    g.fillStyle = '#7FA36A'; g.beginPath(); g.arc(w * 0.25, h * 0.55, w * 0.3, 0, 7); g.fill(); // a big tree
    g.fillStyle = '#6F9E5B'; g.beginPath(); g.arc(w * 0.08, h * 0.62, w * 0.2, 0, 7); g.fill();
    g.fillStyle = '#7A5434'; g.fillRect(w * 0.22, h * 0.6, w * 0.06, h * 0.3);
    g.fillStyle = '#E8D9BC'; g.fillRect(0, h * 0.85, w, h * 0.15);
    g.fillStyle = '#B5643C'; g.fillRect(w * 0.55, h * 0.58, w * 0.4, h * 0.27); // the next block's wall
    g.fillStyle = '#6E1F2A'; g.fillRect(w * 0.52, h * 0.53, w * 0.46, h * 0.06);
  };
  st.window({ x: -2.9, y: 1.85, w: 1.0, h: 0.95, view: viewYard, shutters: false, curtain: '#9DBFB0', sunLen: 1.0, sunY: PY + 0.012 });
  st.window({ x: 2.4, y: 1.85, w: 1.0, h: 0.95, view: viewBeans, shutters: false, curtain: '#9DBFB0', sunLen: 1.0, sunY: PY + 0.012 });
  st.motes(2.45, 0.4, -3.1, 1.0, 1.7, 0.9, 18);

  const BX = 0.3, BY = 1.72, BW = 2.7, BH = 1.15;
  S.boxMin(BX - BW / 2 - 0.08, BY - BH / 2 - 0.08, -hd, BX + BW / 2 + 0.08, BY + BH / 2 + 0.08, -hd + 0.05, C.woodD); // frame
  S.boxMin(BX - BW / 2 - 0.12, BY - BH / 2 - 0.13, -hd, BX + BW / 2 + 0.12, BY - BH / 2 - 0.08, -hd + 0.15, C.teakD); // chalk ledge
  const chalks = [['#F4F1E8', -0.9], ['#F4F1E8', -0.82], ['#F2E28A', -0.6], ['#F2B6C0', 0.75]];
  for (const [col, x] of chalks) S.box(BX + x, BY - BH / 2 - 0.065, -hd + 0.1, 0.07, 0.025, 0.025, col);
  S.box(BX + 1.05, BY - BH / 2 - 0.05, -hd + 0.1, 0.18, 0.05, 0.07, C.maroon); // duster
  S.box(BX + 1.05, BY - BH / 2 - 0.08, -hd + 0.1, 0.18, 0.02, 0.07, '#D8D0C0');
  const board = canvasPlane(BW, BH, 1024, (cv) => drawBoard(cv, opts.board || (d7 ? 'cast' : day === 3 ? 'marks' : day >= 14 ? 'essay' : 'rhyme')));
  board.mesh.position.set(BX, BY, -hd + 0.052);
  room.group.add(board.mesh);
  st.parts.board = { setText(key) { board.redraw((cv) => drawBoard(cv, key)); } };
  st.disposers.push(() => board.tex.dispose());

  st.wallSign('back', 0, 2.68, 7.4, 0.24, (g, w, h) => {
    const letters = 'က ခ ဂ ဃ င စ ဆ ဇ ဈ ည ဋ ဌ ဍ ဎ ဏ တ ထ ဒ ဓ န ပ ဖ ဗ ဘ မ ယ ရ လ ဝ သ ဟ ဠ အ'.split(' '); // DRAFT(my)
    const cw = w / letters.length;
    letters.forEach((l, i) => {
      rr(g, i * cw + 2, 2, cw - 4, h - 4, 5, i % 2 ? '#FBF6EA' : '#F6EBD0', i % 3 === 0 ? C.greenD : i % 3 === 1 ? C.goldD : C.maroon, 2);
      txt(g, l, i * cw + cw / 2, h / 2 + 1, Math.round(h * 0.5), i % 2 ? C.maroon : '#2F4F3A');
    });
  }, 136);

  // --- Daw Hnin Wai's desk on the platform (Day 7: moved to the right wall as her marking table)
  const tdX = d7 ? 3.3 : -2.4, tdZ = d7 ? -0.9 : -3.3, tdY = d7 ? 0 : PY;
  const td = room.place(teacherDesk(), tdX, tdZ, d7 ? -Math.PI / 2 : 0, { solid: d7 });
  td.position.y = tdY;
  // her chair is never solid: on Day 7 she sits on it (spot 'hninwai'), and a solid chair walled off the
  // gap to the leavers' list behind it
  const ch = room.place(woodChair(), d7 ? 2.72 : -2.4, d7 ? -0.9 : -3.72, d7 ? Math.PI / 2 : 0, { solid: false });
  ch.position.y = tdY;
  {
    // on the desk: exercise books, a red pen, a bean seedling, the hand bell, a chalk box (+ flowers on Day 14)
    const v = new VoxelBuilder();
    const T = 0.76;
    for (let i = 0; i < 7; i++) v.box(-0.34 + (i % 2) * 0.012, T + 0.012 + i * 0.016, -0.05, 0.26, 0.014, 0.19, i % 3 ? '#E9E2CC' : jitter('#7FA3C0', 0.08, i));
    for (let i = 0; i < 4; i++) v.box(-0.04, T + 0.012 + i * 0.016, 0.02, 0.26, 0.014, 0.19, i % 2 ? '#E9E2CC' : '#C27A5B', 0.2);
    rb(v, 0.08, T + 0.008, 0.18, 0.14, 0.012, 0.012, C.red, 0, 0.6, 0);
    potInto(v, 0.45, T, -0.15, 0.42, 'whole');
    v.box(0.45, T + 0.25, -0.15, 0.01, 0.12, 0.01, C.leafD);
    v.box(0.42, T + 0.3, -0.15, 0.06, 0.03, 0.04, C.leaf); v.box(0.48, T + 0.27, -0.15, 0.05, 0.025, 0.04, C.leafL);
    cyl(v, 0.25, T + 0.05, -0.18, 0.025, 0.06, 0.08, C.gold, 8); // hand bell
    cyl(v, 0.25, T + 0.12, -0.18, 0.012, 0.012, 0.07, C.woodD, 6);
    v.box(0.22, T + 0.025, 0.15, 0.14, 0.05, 0.08, '#E8E2D2'); // chalk box
    for (let i = 0; i < 4; i++) v.box(0.17 + i * 0.03, T + 0.055, 0.15, 0.02, 0.02, 0.06, i % 2 ? '#F4F1E8' : '#F2E28A');
    if (day >= 14) { cyl(v, -0.3, T + 0.3, 0.12, 0.05, 0.05, 0.12, C.glass, 8); for (let k = 0; k < 5; k++) v.box(-0.3 + Math.sin(k * 2) * 0.05, T + 0.4 + (k % 2) * 0.04, 0.12 + Math.cos(k * 2) * 0.04, 0.05, 0.05, 0.05, k % 2 ? '#F2C65A' : C.rose); }
    if (day === 3) for (let i = 0; i < 3; i++) v.box(0.05 + i * 0.03, T + 0.03 + i * 0.012, -0.18, 0.22, 0.01, 0.3, '#F6F1E4', 0.1 * i); // marks sheets
    const g = piece(v, null, 'deskThings');
    g.position.set(tdX, tdY, tdZ);
    g.rotation.y = d7 ? -Math.PI / 2 : 0;
    room.group.add(g);
  }
  st.tap('cl-desk', d7 ? 2.0 : tdX, tdZ + (d7 ? 0 : 0.6), 0.8, { x: tdX, z: tdZ }, { my: 'ဆရာမ စားပွဲ', en: "the teacher's desk" }); // DRAFT(my)

  // --- pupils' bench-desks
  const desks = d7
    ? [[-3.2, 0.6, Math.PI / 2], [-3.2, 2.05, Math.PI / 2], [-1.6, 2.5, 0], [1.6, 2.5, 0]]
    : [[-1.6, -1.2, 0], [1.6, -1.2, 0], [-1.6, 0.3, 0], [1.6, 0.3, 0], [-1.6, 1.8, 0], [1.6, 1.8, 0]];
  desks.forEach(([x, z, r], i) => room.place(benchDesk({ seed: i + 2 }), x, z, r));
  if (d7) {
    // two more desks stacked out of the way in the front-right corner, one upside down on the other
    const a = room.place(benchDesk({ seed: 9, books: 0 }), 3.15, 2.25, -Math.PI / 2);
    const b = benchDesk({ seed: 10, books: 0 });
    b.position.set(3.15, 1.45, 2.25);
    b.rotation.set(Math.PI, Math.PI / 2, 0);
    room.group.add(b);
    void a;
    // the audience bench across the middle, the cloth for the sort, chalk crosses, paint pots
    const v = new VoxelBuilder();
    v.boxMin(-1.8, 0.4, -0.15, 1.8, 0.45, 0.15, jitter(C.teak, 0.05, 31));
    for (const x of [-1.6, 0, 1.6]) for (const s of [-1, 1]) v.box(x, 0.2, s * 0.1, 0.05, 0.4, 0.05, C.woodD);
    v.box(0, 0.15, 0, 3.4, 0.04, 0.04, C.woodD);
    room.place(piece(v, { w: 3.6, d: 0.32 }, 'audienceBench'), 0, 0.2);
    const cl = new VoxelBuilder();
    cl.boxMin(-0.8, 0, -0.5, 0.8, 0.012, 0.5, '#E9DFC6');
    cl.boxMin(-0.8, 0, -0.5, 0.8, 0.014, -0.44, C.maroon);
    cl.boxMin(-0.8, 0, 0.44, 0.8, 0.014, 0.5, C.maroon);
    room.place(piece(cl, null, 'cloth'), 0.5, -1.7, 0, { solid: false });
    const pp = new VoxelBuilder();
    pp.boxMin(-0.35, 0, -0.25, 0.35, 0.006, 0.25, '#D9D2C2'); // newspaper
    for (let i = 0; i < 6; i++) pp.box(-0.25 + (i % 3) * 0.08, 0.008, -0.15 + Math.floor(i / 3) * 0.2, 0.06, 0.004, 0.003, '#7A7268');
    ['#C8323C', '#2F5DB3', '#E2B33C', '#6F9E5B'].forEach((c, i) => { cyl(pp, -0.2 + i * 0.13, 0.05, 0.05, 0.05, 0.045, 0.1, C.tinL, 8); cyl(pp, -0.2 + i * 0.13, 0.1, 0.05, 0.042, 0.042, 0.004, c, 8); });
    rb(pp, 0.18, 0.012, -0.12, 0.26, 0.015, 0.025, C.woodL, 0, 0.4, 0); rb(pp, 0.06, 0.012, -0.12, 0.05, 0.02, 0.035, C.ink, 0, 0.4, 0);
    rb(pp, 0.2, 0.03, 0.12, 0.22, 0.015, 0.02, C.woodL, 0, -0.3, 0.1);
    const ppg = piece(pp, null, 'paintPots');
    ppg.position.set(-2.1, PY, -3.0);
    room.group.add(ppg);
    // prop basket (wicker, lid open)
    const pb = new VoxelBuilder();
    pb.boxMin(-0.4, 0, -0.25, 0.4, 0.36, 0.25, '#C9A26A');
    for (let i = 0; i < 6; i++) pb.boxMin(-0.41, 0.03 + i * 0.055, -0.26, 0.41, 0.05 + i * 0.055, 0.26, i % 2 ? '#B38A55' : '#D4B07A');
    pb.boxMin(-0.36, 0.3, -0.21, 0.36, 0.34, 0.21, '#6B5038');
    rb(pb, 0, 0.5, -0.32, 0.8, 0.04, 0.5, '#C9A26A', -1.2, 0, 0);
    pb.box(-0.15, 0.37, 0, 0.3, 0.05, 0.12, C.maroon); pb.box(0.12, 0.38, 0.05, 0.08, 0.08, 0.2, C.gold); pb.box(0.2, 0.36, -0.08, 0.16, 0.03, 0.1, '#F6F0E2');
    for (const s of [-1, 1]) pb.box(s * 0.43, 0.3, 0, 0.04, 0.06, 0.14, C.woodD);
    room.place(piece(pb, { w: 0.8, d: 0.5 }, 'propBasket'), -3.3, -1.38, Math.PI / 2); // by the costume hooks, out of the right corner
    st.tap('cl-basket', -2.55, -1.38, 0.6, { x: -3.3, z: -1.38 }, { my: 'ပြဇာတ်ပစ္စည်းခြင်း', en: 'the prop basket' }); // DRAFT(my)
    // the backdrop pinned over the board's left half; the cast list stays readable on the right
    const bd = canvasPlane(3.0, 1.9, 1024, (cv) => drawBackdrop(cv, opts.painted ?? 0));
    bd.mesh.position.set(-0.55, 1.55, -hd + 0.09);
    room.group.add(bd.mesh);
    for (const x of [-2.0, -0.55, 0.9]) { S.box(x, 2.5, -hd + 0.1, 0.05, 0.05, 0.03, C.red); }
    st.parts.backdrop = { setPainted(p) { bd.redraw((cv) => drawBackdrop(cv, p)); } };
    st.disposers.push(() => bd.tex.dispose());
    st.tap('cl-backdrop', -0.55, -2.4, 0.9, { x: -0.55, z: -3.9 }, { my: 'နောက်ခံကား', en: 'the backdrop' }); // DRAFT(my)
  }
  // chalk crosses on the platform (scene marks; faint on other days)
  for (const x of [-1.8, -0.6, 0.6, 1.8, 3.0]) {
    st.sign(0.22, 0.22, M(x, PY + 0.004, -3.3, -Math.PI / 2), (g, w, h) => {
      g.strokeStyle = d7 ? 'rgba(248,246,236,0.95)' : 'rgba(248,246,236,0.28)'; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(8, 8); g.lineTo(w - 8, h - 8); g.moveTo(w - 8, 8); g.lineTo(8, h - 8); g.stroke();
    }, 200);
  }

  // --- Toe Toe's own desk under the right window, facing it (Day 7: pushed half a metre left with the
  //     other desks, so a path stays open to the nature corner and the leavers' list by the right wall)
  const ttX = d7 ? 1.85 : 2.4;
  room.place(benchDesk({ seats: 1, seed: 21, books: 2 }), ttX, -2.3);
  {
    const v = new VoxelBuilder();
    // his bean-green satchel on a hook at the desk's end, five thin books on the lid
    v.box(2.79, 0.55, -2.38, 0.05, 0.3, 0.26, '#7BA05B');
    v.box(2.8, 0.66, -2.38, 0.06, 0.1, 0.27, '#5E8446');
    v.box(2.82, 0.58, -2.38, 0.02, 0.04, 0.08, C.gold);
    v.box(2.77, 0.76, -2.38, 0.02, 0.12, 0.02, C.woodD);
    for (let i = 0; i < 5; i++) v.box(2.24, 0.735 + i * 0.012, -2.42, 0.22, 0.011, 0.16, BOOKS[i + 1]);
    if (day >= 14) rb(v, 2.5, 0.73, -2.3, 0.2, 0.006, 0.28, '#F6F1E4', 0.09, 0.15, 0);
    S.merge(v, M(ttX - 2.4, 0, 0));
  }
  if (day >= 14) st.sign(0.18, 0.26, M(2.5, 0.738, -2.3, -Math.PI / 2 + 0.09, 0, -0.15), (g, w, h) => { paperBg(g, w, h, '#F6F1E4', 8); g.strokeStyle = 'rgba(120,140,200,0.5)'; for (let i = 1; i < 9; i++) { g.beginPath(); g.moveTo(0, i * h / 9); g.lineTo(w, i * h / 9); g.stroke(); } scribble(g, 6, h / 9 * 1.5, w - 12, 6, h / 9, '#3A4A7A', 5, 1.5); }, 300);
  st.tap('cl-toetoe-desk', ttX - 0.95, -2.25, 0.6, { x: ttX, z: -2.4 }, { my: 'တိုးတိုး စားပွဲ', en: "Toe Toe's desk" }); // DRAFT(my)

  // --- left wall: coat hooks + satchels, clock, low shelf with the four subject posters above
  S.box(-3.96, 1.5, -2.0, 0.06, 0.08, 1.3, C.woodD);
  for (let i = 0; i < 4; i++) { S.box(-3.9, 1.48, -2.5 + i * 0.33, 0.1, 0.03, 0.03, C.gold); S.box(-3.86, 1.5, -2.5 + i * 0.33, 0.03, 0.06, 0.03, C.gold); }
  S.box(-3.88, 1.22, -2.5, 0.08, 0.28, 0.24, C.maroon); S.box(-3.84, 1.3, -2.5, 0.05, 0.1, 0.25, C.maroonD); // satchels
  S.box(-3.88, 1.24, -1.84, 0.08, 0.24, 0.22, '#2F5DB3'); S.box(-3.84, 1.31, -1.84, 0.05, 0.08, 0.23, '#24488C');
  if (d7) {
    // the "Maya" costume on the middle hook: gold cardboard quill + maroon sash
    rb(S, -3.86, 1.1, -2.17, 0.04, 0.9, 0.12, C.gold, 0.15, 0, 0);
    rb(S, -3.85, 0.7, -2.2, 0.03, 0.18, 0.05, C.goldD, 0.15, 0, 0);
    S.box(-3.86, 1.15, -2.0, 0.04, 0.6, 0.12, C.maroon);
    st.tap('cl-costume', -3.2, -2.4, 0.5, { x: -3.9, z: -2.1 }, { my: 'မာရာ ဝတ်စုံ', en: 'the "Maya" costume' }); // DRAFT(my)
  }
  wallClock(st, 'left', -2.0, 2.35, 0.22);
  room.place(bookShelf({ w: 1.5, h: 1.05, fill: 0.8, seed: 5, open: true }), -3.8, -0.1, Math.PI / 2);
  const SUBJ = [
    ['သင်္ချာ', (g, w, h) => { for (let i = 0; i < 16; i++) txt(g, mm(i * 6 + 1), 18 + (i % 4) * (w - 30) / 4 + 6, h * 0.38 + Math.floor(i / 4) * h * 0.14, 15, C.ink, { weight: 600 }); }], // DRAFT(my)
    ['သိပ္ပံ', (g, w, h) => { g.fillStyle = '#F2C65A'; g.beginPath(); g.arc(w * 0.3, h * 0.55, 22, 0, 7); g.fill(); g.fillStyle = '#5E8FC0'; g.beginPath(); g.arc(w * 0.72, h * 0.62, 14, 0, 7); g.fill(); g.strokeStyle = C.ink; g.setLineDash([4, 4]); g.lineWidth = 2; g.beginPath(); g.ellipse(w * 0.5, h * 0.6, w * 0.32, h * 0.14, 0, 0, 7); g.stroke(); g.setLineDash([]); }], // DRAFT(my)
    ['သမိုင်း', (g, w, h) => { g.fillStyle = '#B5643C'; g.fillRect(w * 0.44, h * 0.32, w * 0.12, h * 0.12); g.fillStyle = '#FFD27A'; g.beginPath(); g.arc(w * 0.5, h * 0.3, 8, 0, 7); g.fill(); g.strokeStyle = C.red; g.lineWidth = 3; for (let i = 0; i < 4; i++) { const x = 16 + i * (w - 32) / 4; scribble(g, x, h * 0.72, (w - 40) / 4 - 6, 1, 10, '#555', 3 + i); g.beginPath(); g.moveTo(x, h * 0.66); g.lineTo(x + 22, h * 0.78); g.stroke(); } }], // DRAFT(my)
    ['ပထဝီ', (g, w, h) => { g.strokeStyle = 'rgba(80,100,140,0.35)'; g.lineWidth = 1.5; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(10, h * 0.35 + i * 14); g.lineTo(w - 10, h * 0.35 + i * 14); g.stroke(); } g.strokeStyle = C.maroon; g.lineWidth = 4; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(20, h * 0.85); g.bezierCurveTo(w * 0.3, h * 0.4, w * 0.6, h * 0.95, w - 22, h * 0.42); g.stroke(); g.setLineDash([]); sparkle(g, w - 22, h * 0.42, 10, C.goldD); }], // DRAFT(my)
  ];
  SUBJ.forEach(([name, art], i) => {
    st.wallSign('left', -1.0 + i * 0.52, 1.47, 0.46, 0.4, (g, w, h) => {
      rr(g, 2, 2, w - 4, h - 4, 10, ['#F6E7C8', '#E5F0E2', '#F4E0D6', '#E3EAF3'][i], ['#C9A24A', '#7FA383', '#C27A5B', '#7FA3C0'][i], 4);
      txt(g, name, w / 2, h * 0.17, Math.round(h * 0.13), C.maroon);
      art(g, w, h);
    }, 230);
  });
  st.tap('cl-posters', d7 ? -2.85 : -3.0, d7 ? -0.6 : -0.1, 0.7, { x: -3.95, z: -0.1 }, { my: 'ဘာသာရပ် ပိုစတာများ', en: 'the subject posters' }); // DRAFT(my)

  // --- right wall: nature corner (bean seedlings in jam jars), the school shelf «ကျောင်းစင်»
  S.boxMin(3.6, 0.86, -1.75, 4, 0.9, -0.65, C.teakD);
  for (const z of [-1.6, -0.8]) S.box(3.85, 0.78, z, 0.2, 0.12, 0.04, C.woodD);
  for (let i = 0; i < 5; i++) {
    const z = -1.6 + i * 0.22, tall = 0.06 + ((i * 7) % 4) * 0.035;
    cyl(S, 3.8, 0.96, z, 0.05, 0.05, 0.12, C.glass, 8);
    cyl(S, 3.8, 0.94, z, 0.045, 0.045, 0.07, '#8A6648', 8);
    S.box(3.8, 1.02 + tall / 2, z, 0.012, tall, 0.012, C.leafD);
    S.box(3.78, 1.02 + tall, z, 0.07, 0.025, 0.04, i === 2 ? '#B9A15A' : C.leaf);
    S.box(3.83, 1.0 + tall * 0.7, z, 0.05, 0.02, 0.035, C.leafL);
    S.box(3.74, 1.06, z + 0.05, 0.006, 0.14, 0.02, '#E9DFC6'); // name stick
  }
  st.wallSign('right', -1.2, 1.25, 0.9, 0.22, (g, w, h) => { rr(g, 2, 2, w - 4, h - 4, 8, '#EAF2E2', C.greenD, 3); txt(g, 'သဘာဝ ထောင့် · ပဲပင်လေးများ', w / 2, h / 2 + 2, Math.round(h * 0.42), '#2F4F3A'); }, 220); // DRAFT(my)
  st.tap('cl-nature', d7 ? 2.75 : 3.0, d7 ? -1.95 : -1.2, 0.6, { x: 3.85, z: -1.2 }, { my: 'ပဲပင် ဖန်ပုလင်းများ', en: 'the bean jars' }); // DRAFT(my)
  room.place(bookShelf({ w: 1.2, h: 1.05, fill: day >= 4 ? 0.95 : 0.4, seed: 8, wood: C.teakD, open: true }), 3.75, 0.6, -Math.PI / 2);
  st.wallSign('right', 0.6, 1.42, 0.7, 0.26, (g, w, h) => { slateBg(g, w, h, 12); chalkText(g, 'ကျောင်းစင်', w / 2, h / 2 + 2, Math.round(h * 0.5)); }, 240); // DRAFT(my)
  st.tap('cl-shelf', 3.0, 0.6, 0.7, { x: 3.8, z: 0.6 }, { my: 'ကျောင်းစင်', en: 'the school shelf' }); // DRAFT(my)
  // the pupils' hook row above the shelf (z 0.8): a rail, six brass hooks, satchels in school colours
  S.box(3.96, 2.02, 0.8, 0.06, 0.08, 1.5, C.woodD);
  for (let i = 0; i < 6; i++) { S.box(3.9, 2.0, 0.17 + i * 0.25, 0.1, 0.03, 0.03, C.gold); S.box(3.86, 2.02, 0.17 + i * 0.25, 0.03, 0.06, 0.03, C.gold); }
  [[0.17, '#2F6B4F'], [0.42, C.maroon], [0.67, '#2F5DB3'], [0.92, '#2F6B4F']].forEach(([z, c], i) => {
    if (d7 && i % 2) return;
    S.box(3.9, 1.75, z, 0.08, 0.26, 0.2, c); S.box(3.86, 1.82, z, 0.05, 0.09, 0.21, jitter(c, -0.2, i)); S.box(3.855, 1.72, z, 0.01, 0.04, 0.06, C.gold);
  });
  if (d7) {
    st.wallSign('right', -2.75, 1.85, 0.75, 0.95, (g, w, h) => {
      paperBg(g, w, h, '#F8F2E2', 14);
      txt(g, 'ဒီနှစ် နှုတ်ဆက်မယ့်သူများ', w / 2, h * 0.1, 15, C.maroon); // DRAFT(my)
      txt(g, 'နေခြည် — ပုံနှိပ်တိုက်', w / 2, h * 0.3, 14, C.ink, { weight: 600 }); // DRAFT(my)
      txt(g, '(တံတားတစ်ဖက်)', w / 2, h * 0.39, 11, C.ink, { weight: 500 }); // DRAFT(my)
      scribble(g, 22, h * 0.52, w - 44, 2, 14, '#5A5048', 31, 1.2);
      txt(g, 'ရဲယဉ့် —', w * 0.35, h * 0.78, 14, C.ink, { weight: 600 }); // DRAFT(my)
      g.strokeStyle = '#8C7B6A'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(w * 0.52, h * 0.82); g.lineTo(w * 0.9, h * 0.82); g.stroke();
    }, 220);
    S.box(3.95, 2.35, -2.75, 0.04, 0.04, 0.04, C.red);
    S.box(3.93, 1.35, -2.33, 0.012, 0.5, 0.012, C.ink); S.box(3.92, 1.08, -2.33, 0.02, 0.07, 0.02, '#F4F1E8'); // chalk pencil on a string
    st.tap('cl-leavers', 3.0, -2.38, 0.6, { x: 3.95, z: -2.75 }, { my: 'နှုတ်ဆက်စာရင်း', en: "the leavers' list" }); // DRAFT(my)
  }
  // wall lamps (brass brackets, glass chimneys) for dark afternoons
  for (const [x, z, s] of [[-3.95, -3.1, 1], [3.95, -0.9, -1]]) {
    S.box(x, 2.1, z, 0.06, 0.12, 0.06, C.goldD);
    S.box(x + s * 0.1, 2.12, z, 0.2, 0.03, 0.03, C.goldD);
    cyl(S, x + s * 0.2, 2.17, z, 0.05, 0.06, 0.12, C.glass, 8);
    cyl(S, x + s * 0.2, 2.1, z, 0.065, 0.065, 0.03, C.goldD, 8);
    st.flame(x + s * 0.2, 2.17, z, 0.035, 0.06);
    st.pool(x + s * 0.9, z, 1.3);
  }

  // --- front: water pot by the door, sandals, a broom
  room.place(waterPot(), -3.2, 3.2);
  st.tap('cl-water', -2.7, 3.0, 0.5, { x: -3.2, z: 3.2 }, { my: 'သောက်ရေအိုး', en: 'the water pot' }); // DRAFT(my)
  {
    const v = new VoxelBuilder();
    for (const [x, z, c, r] of [[1.3, 3.55, '#6E4A2E', 0.2], [1.45, 3.6, '#6E4A2E', -0.1], [1.75, 3.5, C.maroon, 0.3], [1.9, 3.58, C.maroon, 0.05], [2.25, 3.6, '#2F5DB3', -0.2], [2.4, 3.52, '#2F5DB3', 0.15]]) {
      v.box(x, 0.012, z, 0.09, 0.024, 0.24, c, r);
      v.box(x, 0.03, z - 0.03, 0.08, 0.012, 0.02, jitter(c, 0.3, 2), r);
    }
    rb(v, 3.75, 0.7, 3.0, 0.04, 1.3, 0.04, C.woodL, 0.12, 0, -0.18); // broom
    rb(v, 3.88, 0.12, 3.03, 0.18, 0.25, 0.08, '#C9A26A', 0.12, 0, -0.18);
    S.merge(v);
  }
  // --- more life: the class map of Paper Town, a timetable, pupils' drawings, open books, a bin
  S.boxMin(-2.16, 1.6, -hd, -1.24, 2.3, -hd + 0.04, C.woodD);
  st.wallSign('back', -1.7, 1.95, 0.84, 0.62, (g, w, h) => {
    paperBg(g, w, h, '#F3E9D0', 17);
    // the open book the town is drawn on: two pages, a spine, districts as coloured patches
    rr(g, 10, 14, w - 20, h - 28, 10, '#EBDDBE', '#8C6A3C', 3);
    g.strokeStyle = '#8C6A3C'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, 14); g.lineTo(w / 2, h - 14); g.stroke();
    const areas = [[0.2, 0.3, '#E5C9A0'], [0.32, 0.62, '#CFE0C0'], [0.68, 0.3, '#F2D6B0'], [0.75, 0.66, '#D7E3EE'], [0.5, 0.8, '#EED3C9']];
    for (const [x, y, c] of areas) { g.fillStyle = c; g.beginPath(); g.ellipse(w * x, h * y, w * 0.12, h * 0.14, 0, 0, 7); g.fill(); }
    g.strokeStyle = C.gold; g.lineWidth = 4; g.beginPath(); g.moveTo(w * 0.2, h * 0.3); g.lineTo(w * 0.5, h * 0.5); g.lineTo(w * 0.68, h * 0.3); g.moveTo(w * 0.5, h * 0.5); g.lineTo(w * 0.32, h * 0.62); g.moveTo(w * 0.5, h * 0.5); g.lineTo(w * 0.75, h * 0.66); g.lineTo(w * 0.5, h * 0.8); g.stroke();
    g.fillStyle = C.red; g.beginPath(); g.arc(w * 0.32, h * 0.62, 6, 0, 7); g.fill();
    txt(g, 'ဗလာစာအုပ်ရပ်', w * 0.32, h * 0.62 + 18, 12, C.maroon); // DRAFT(my)
  }, 220);
  if (!d7) {
    st.wallSign('back', 3.5, 1.85, 0.62, 0.82, (g, w, h) => {
      paperBg(g, w, h, '#FBF6EA', 19);
      rr(g, 4, 4, w - 8, h - 8, 6, null, C.greenD, 4);
      txt(g, 'အချိန်ဇယား', w / 2, 24, 18, C.maroon); // DRAFT(my)
      const rows = 6, cols = 4, top = 46, ch = (h - top - 12) / rows, cw = (w - 20) / cols;
      g.strokeStyle = 'rgba(60,80,60,0.6)'; g.lineWidth = 1.5;
      for (let r = 0; r <= rows; r++) { g.beginPath(); g.moveTo(10, top + r * ch); g.lineTo(w - 10, top + r * ch); g.stroke(); }
      for (let c = 0; c <= cols; c++) { g.beginPath(); g.moveTo(10 + c * cw, top); g.lineTo(10 + c * cw, h - 12); g.stroke(); }
      const tints = ['#F6E7C8', '#E5F0E2', '#F4E0D6', '#E3EAF3'];
      for (let r = 1; r < rows; r++) for (let c = 1; c < cols; c++) { g.fillStyle = tints[(r + c) % 4]; g.fillRect(11 + c * cw, top + r * ch + 1, cw - 2, ch - 2); }
    }, 220);
  }
  const drawingsZ = d7 ? [-1.95, -1.45] : [-3.55, -3.05, -2.0, -1.5];
  S.box(3.97, 1.98, (drawingsZ[0] + drawingsZ[drawingsZ.length - 1]) / 2, 0.01, 0.01, Math.abs(drawingsZ[drawingsZ.length - 1] - drawingsZ[0]) + 0.5, C.ink);
  drawingsZ.forEach((z, i) => {
    st.wallSign('right', z, 1.78, 0.4, 0.34, (g, w, h) => {
      paperBg(g, w, h, '#FBF8F0', 30 + i);
      const k = (i + (d7 ? 2 : 0)) % 4;
      if (k === 0) { g.fillStyle = '#F2C65A'; g.beginPath(); g.arc(w * 0.75, h * 0.28, 14, 0, 7); g.fill(); g.fillStyle = '#6F9E5B'; g.fillRect(0, h * 0.7, w, h * 0.3); g.fillStyle = C.terra; g.fillRect(w * 0.2, h * 0.42, w * 0.3, h * 0.3); g.fillStyle = C.maroon; g.beginPath(); g.moveTo(w * 0.15, h * 0.44); g.lineTo(w * 0.35, h * 0.24); g.lineTo(w * 0.55, h * 0.44); g.fill(); }
      else if (k === 1) { g.strokeStyle = '#4F7F43'; g.lineWidth = 4; g.beginPath(); g.moveTo(w / 2, h * 0.9); g.lineTo(w / 2, h * 0.3); g.stroke(); g.fillStyle = '#8DBA6E'; g.beginPath(); g.ellipse(w * 0.38, h * 0.5, 14, 7, -0.5, 0, 7); g.fill(); g.beginPath(); g.ellipse(w * 0.62, h * 0.38, 14, 7, 0.5, 0, 7); g.fill(); g.fillStyle = '#E8A0C8'; g.beginPath(); g.arc(w / 2, h * 0.26, 7, 0, 7); g.fill(); }
      else if (k === 2) { g.fillStyle = '#7FB0CF'; g.fillRect(0, h * 0.6, w, h * 0.4); g.fillStyle = '#F6F0E2'; g.beginPath(); g.moveTo(w * 0.25, h * 0.6); g.lineTo(w * 0.75, h * 0.6); g.lineTo(w * 0.62, h * 0.74); g.lineTo(w * 0.38, h * 0.74); g.fill(); g.fillRect(w * 0.48, h * 0.3, 3, h * 0.3); g.beginPath(); g.moveTo(w * 0.51, h * 0.3); g.lineTo(w * 0.7, h * 0.52); g.lineTo(w * 0.51, h * 0.52); g.fill(); }
      else { for (let j = 0; j < 3; j++) { g.fillStyle = [C.red, '#2F5DB3', C.mustard][j]; g.beginPath(); g.arc(w * (0.25 + j * 0.25), h * 0.55, 9, 0, 7); g.fill(); g.fillRect(w * (0.25 + j * 0.25) - 6, h * 0.6, 12, 20); } }
      g.fillStyle = C.red; g.beginPath(); g.arc(w / 2, 6, 4, 0, 7); g.fill();
    }, 200, 'signs', 0.05);
  });
  // open exercise books and pencils on a few desks
  const openBooks = d7 ? [] : [[-1.85, -1.22], [1.35, 0.28], [-1.35, 1.78], [1.85, 1.8]];
  openBooks.forEach(([x, z], i) => {
    st.sign(0.34, 0.22, M(x, 0.735, z + 0.02, -Math.PI / 2 + 0.09, 0, (i % 2 ? 0.08 : -0.1)), (g, w, h) => {
      paperBg(g, w, h, '#F8F4E8', 40 + i);
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(w / 2 - 1, 0, 2, h);
      g.strokeStyle = 'rgba(120,140,200,0.45)'; g.lineWidth = 1;
      for (let k = 1; k < 7; k++) { g.beginPath(); g.moveTo(4, k * h / 7); g.lineTo(w - 4, k * h / 7); g.stroke(); }
      scribble(g, 8, h / 7 * 1.6, w / 2 - 16, 4, h / 7, '#3A4A7A', 50 + i, 1.2);
      scribble(g, w / 2 + 8, h / 7 * 1.6, w / 2 - 16, 3, h / 7, '#3A4A7A', 60 + i, 1.2);
    }, 300);
    rb(S, x + 0.2, 0.745, z + 0.06, 0.14, 0.012, 0.012, ['#E2B33C', '#C8323C', '#2F5DB3', '#6F9E5B'][i], 0, 0.5 + i, 0);
  });
  {
    // a cane waste basket by the teacher's desk, paper balls, a globe on a stand
    const v = new VoxelBuilder();
    cyl(v, 0, 0.17, 0, 0.16, 0.12, 0.34, '#C9A26A', 8);
    for (let k = 0; k < 4; k++) cyl(v, 0, 0.06 + k * 0.08, 0, 0.13 + k * 0.01, 0.13 + k * 0.01, 0.02, '#A9824F', 8);
    v.box(0.02, 0.33, 0.01, 0.09, 0.08, 0.09, '#F6F1E4', 0.3); v.box(-0.05, 0.31, -0.04, 0.07, 0.07, 0.07, '#EDE6D3', 0.8);
    const bin = piece(v, { w: 0.34, d: 0.34 }, 'bin');
    bin.position.set(d7 ? 3.4 : -1.45, d7 ? 0 : PY, d7 ? 0.1 : -3.55);
    room.group.add(bin);
    S.box(-0.9, 0.04, -1.9, 0.08, 0.08, 0.08, '#F6F1E4', 0.6); // a paper ball that missed
    const gl = new VoxelBuilder();
    gl.box(0, 0.02, 0, 0.16, 0.04, 0.16, C.woodD);
    gl.box(0, 0.12, 0, 0.025, 0.18, 0.025, C.goldD);
    cyl(gl, 0, 0.3, 0, 0.11, 0.11, 0.16, '#5E8FC0', 8);
    cyl(gl, 0, 0.3, 0, 0.08, 0.08, 0.22, '#5E8FC0', 8);
    gl.box(0.05, 0.33, 0.07, 0.08, 0.07, 0.06, '#7FA36A'); gl.box(-0.07, 0.27, 0.06, 0.06, 0.08, 0.06, '#C9B07A');
    const globe = piece(gl, null, 'globe');
    globe.position.set(d7 ? 3.15 : -2.95, d7 ? 0.76 : PY + 0.76, d7 ? -1.45 : -3.4);
    room.group.add(globe);
    // a leafy plant in the front-right corner
    const pl = new VoxelBuilder();
    potInto(pl, 0, 0, 0, 1.2, 'whole');
    for (const [x, y, z, s, c] of [[0, 0.62, 0, 0.36, C.leaf], [0.1, 0.84, -0.05, 0.26, C.leafD], [-0.12, 0.76, 0.08, 0.24, C.leafL], [0.04, 1.02, 0.04, 0.18, C.leaf]]) pl.box(x, y, z, s, s, s, c, x * 3);
    room.place(piece(pl, { w: 0.45, d: 0.45 }, 'plant'), 3.45, 3.3);
  }
  // a worn path down the aisle and chalk dust under the board
  for (let z = -2.75; z < 3.9; z += 0.5) S.boxMin(-0.45, 0.0005, z, 0.45, 0.003, z + 0.488, jitter('#B98F5C', 0.04, z * 9));
  S.boxMin(BX - 1.2, PY + 0.001, -3.95, BX + 1.2, PY + 0.004, -3.75, '#CFC7B2');
  // fake contact shadows under the furniture rows (darker floor boards)
  for (const [x, z, r] of desks) S.boxMin(x - (r ? 0.5 : 0.7), 0.001, z - (r ? 0.7 : 0.45), x + (r ? 0.5 : 0.7), 0.004, z + (r ? 0.7 : 0.55), jitter(C.teak, -0.16, 7));

  // --- spots (where the day specs place people)
  if (d7) {
    st.spot('yeyint', 0.6, -3.3, 0, PY);
    st.spot('chorus1', 3.0, -3.0, -0.3, PY);
    st.spot('chorus2', 3.45, -3.45, -0.4, PY);
    st.spot('hninwai', 2.72, -0.9, Math.atan2(-2.1, -2.4));
    st.spot('naychi', -2.9, -2.2, 0.5);
    ['toetoe', 'micho', 'sunwe', 'maungnge'].forEach((id, i) => st.spot(id, [-1.3, -0.45, 0.45, 1.3][i], 0.55, Math.PI + [1.05, 0.7, -0.7, -1.05][i])); // half-turned to whisper: profiles read
    st.spot('maya', 0, 3.0, Math.PI);
    st.spot('mayaBackRow', -0.75, 3.15, Math.PI);
    st.spot('yeyintEdge', 0.4, -2.5, 0, PY);
    st.spot('mayaEdge', -0.4, -2.5, 0, PY);
    st.spot('child', 3.0, 1.2, -2.4);
  } else {
    st.spot('hninwai', -2.4, -3.68, 0, PY);
    st.spot('hninwaiBoard', -0.9, -3.3, 0.25, PY);
    st.spot('toetoe', 2.4, -1.98, Math.PI);
    st.spot('maya', 1.4, -1.8, Math.atan2(1.0, -0.2));
    st.spot('sunwe', 1.3, -0.62, 0.15); // turned round on her bench (day-3 spec: heading +Z for the talk)
    st.spot('maungngeSeat', 1.95, -0.62, -0.25);
    st.spot('maungngeHook', -0.8, -2.4, Math.atan2(-1.6, -0.9));
    st.spot('mayaD3', 0.5, -0.3, Math.atan2(0.8, -0.6));
    st.spot('mayaD14', 1.3, -2.4, Math.PI / 2);
    // walk-on pupils stand at the front of their benches, turned round to chat before the bell, so faces
    // and uniforms read from the dollhouse camera (a back view is only a black hair block at 412 px)
    [[-1.9, -0.58, 0.5], [-1.3, 0.92, -0.45], [1.3, 0.92, 0.35], [1.95, 0.92, -0.6], [-1.9, 2.42, 0.6], [1.3, 2.42, -0.3]].forEach(([x, z, h], i) => st.spot(`pupil${i + 1}`, x, z, h));
    if (day === 3) {
      // Su Nwe's satchel hanging open on her desk's side (timetable inside the flap), her pencil stub
      S.box(2.27, 0.52, -1.3, 0.07, 0.32, 0.3, '#2F6FD0'); rb(S, 2.34, 0.62, -1.3, 0.025, 0.26, 0.29, C.mustard, 0, 0, -0.5); // bright blue, mustard flap
      S.box(2.31, 0.4, -1.3, 0.02, 0.05, 0.12, C.red);
      st.sign(0.2, 0.16, M(2.355, 0.6, -1.3, 0, Math.PI / 2, 0.5), (g, w, h) => { paperBg(g, w, h, '#FBF6EA', 2); g.strokeStyle = C.ink; g.lineWidth = 1; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(0, i * h / 5); g.lineTo(w, i * h / 5); g.stroke(); } txt(g, '၁:၀၀', w * 0.75, h * 0.9, 12, C.red); }, 260); // DRAFT(my)
      S.box(1.38, 0.745, -1.28, 0.045, 0.012, 0.012, '#E2B33C'); S.box(1.355, 0.745, -1.28, 0.008, 0.012, 0.012, C.ink);
      st.tap('cl-timetable', 2.45, -0.5, 0.5, { x: 2.3, z: -1.3 }, { my: 'စုနွယ့် လွယ်အိတ်', en: "Su Nwe's satchel" }); // DRAFT(my)
      st.tap('cl-stub', 0.7, -0.5, 0.5, { x: 1.38, z: -1.28 }, { my: 'ခဲတံတို', en: 'the pencil stub' }); // DRAFT(my)
      // the parcels Maung Nge brings in, by the teacher's desk
      for (let i = 0; i < 4; i++) {
        const x = -1.5 + (i % 2) * 0.3, y = 0.11 + Math.floor(i / 2) * 0.2;
        S.box(x, y, -2.45, 0.28, 0.2, 0.22, i % 2 ? C.sack : '#D9C29A');
        S.box(x, y, -2.45, 0.29, 0.025, 0.225, C.red); S.box(x, y, -2.45, 0.025, 0.205, 0.225, C.red); // red string
        if (i === 2) S.box(x, y + 0.101, -2.45, 0.12, 0.004, 0.09, '#F7E7A6'); // the school's label
      }
      // Maung Nge's cloth bag on the hook row (bright padauk orange: his, easy to spot), and the paper boat
      // he folded, on Su Nwe's desk lid
      S.box(3.88, 1.66, 1.17, 0.09, 0.36, 0.3, '#EF8A2E'); S.box(3.83, 1.72, 1.17, 0.012, 0.14, 0.2, '#C8323C');
      rb(S, 3.88, 1.9, 1.07, 0.03, 0.18, 0.03, '#EF8A2E', 0.5, 0, 0); rb(S, 3.88, 1.9, 1.27, 0.03, 0.18, 0.03, '#EF8A2E', -0.5, 0, 0);
      const bt = new VoxelBuilder();
      bt.box(0, 0.025, 0, 0.18, 0.05, 0.07, '#FBF8F0');
      rb(bt, -0.07, 0.04, 0, 0.06, 0.05, 0.07, '#FBF8F0', 0, 0, 0.7); rb(bt, 0.07, 0.04, 0, 0.06, 0.05, 0.07, '#FBF8F0', 0, 0, -0.7);
      rb(bt, 0, 0.09, 0, 0.1, 0.08, 0.012, '#F4EEDD', 0, 0, Math.PI / 4);
      bt.box(0, 0.03, 0.036, 0.15, 0.012, 0.004, C.red);
      S.merge(bt, M(1.9, 0.745, -1.3, 0.09, 0.4, 0));
    }
  }
  st.spot('door', 0, 3.55, Math.PI);
  st.tap('cl-board', 0.3, -2.3, 1.0, { x: 0.3, z: -3.95 }, { my: 'ကျောက်သင်ပုန်း', en: 'the blackboard' }); // DRAFT(my)

  st.finish();
  return st.result({ id: 'classroom', day });
}

// =============================================================================================
// snackshop · the honesty snack shop (INDEX 13.2, Day 2's layout + Day 7's shelf and bench)
// =============================================================================================
function glassJar(v, x, y, z, fill, s = 1, lid = C.maroon) {
  v.box(x, y + 0.11 * s, z, 0.16 * s, 0.22 * s, 0.16 * s, C.glass);
  v.box(x, y + 0.08 * s, z + 0.002, 0.13 * s, 0.13 * s, 0.16 * s, fill);
  v.box(x - 0.03 * s, y + 0.12 * s, z + 0.082 * s, 0.03 * s, 0.025 * s, 0.004, jitter(fill, 0.2, 3));
  v.box(x - 0.055 * s, y + 0.17 * s, z + 0.082 * s, 0.015 * s, 0.05 * s, 0.004, C.white);
  v.box(x, y + 0.235 * s, z, 0.13 * s, 0.035 * s, 0.13 * s, lid);
}
function buildSnackshop(opts = {}) {
  const day = opts.day ?? 2;
  const d7 = day >= 7;
  const st = makeStage({ width: 7, depth: 6, height: 3, wall: '#F1E2A8', wainscot: '#C98E5A', trim: '#8C6A3C', floor: 'tiles', floorColor: '#C8754F', floorColor2: '#F1E6CC' });
  const { room, S, hd } = st;

  st.window({
    x: 2.1, y: 1.8, w: 1.0, h: 0.9, sunLen: 1.3, shutter: '#5E8FA8', shutterD: '#3F6A80',
    view: (g, w, h) => {
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#A9CBE6'); sky.addColorStop(1, '#F6E6CA');
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      g.fillStyle = '#D9C29A'; g.fillRect(0, h * 0.55, w, h * 0.45); // the back lane wall
      g.fillStyle = '#C4A97E'; for (let i = 0; i < 6; i++) g.fillRect(i * w / 6 + 2, h * 0.55 + (i % 2) * 10, w / 6 - 4, 3);
      g.fillStyle = '#6F9E5B'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(w * (0.12 + i * 0.2), h * 0.5, 22, 9, -0.6 + i * 0.3, 0, 7); g.fill(); } // banana leaves over the wall
      g.fillStyle = '#4F7F43'; g.fillRect(w * 0.18, h * 0.5, 4, h * 0.1);
      g.fillStyle = '#3A2E24'; g.beginPath(); g.ellipse(w * 0.7, h * 0.52, 12, 7, 0, 0, 7); g.fill(); g.beginPath(); g.arc(w * 0.76, h * 0.47, 6, 0, 7); g.fill(); // a cat on the wall
    },
  });

  // --- behind the counter: stock cabinet, the keeper's empty stool, a broom
  {
    const v = new VoxelBuilder();
    v.boxMin(-3.4, 0, -2.98, -0.6, 0.85, -2.55, C.woodD);
    v.boxMin(-3.45, 0.85, -3.0, -0.55, 0.9, -2.5, C.teak);
    for (let i = 0; i < 4; i++) { v.boxMin(-3.35 + i * 0.7, 0.08, -2.55, -2.73 + i * 0.7, 0.78, -2.53, jitter(C.woodL, 0.06, i)); v.box(-2.8 + i * 0.7, 0.45, -2.52, 0.03, 0.1, 0.02, C.gold); }
    // stock on top: biscuit tins, a stack of paper cones, a bag of sugar
    tinPile(v, -3.1, 0.9, -2.75, 3, 1);
    for (let i = 0; i < 3; i++) v.box(-2.4 + i * 0.22, 0.98, -2.78, 0.2, 0.16, 0.18, ['#C8323C', '#2F5DB3', '#E2B33C'][i]);
    for (let i = 0; i < 5; i++) cyl(v, -1.5, 0.92 + i * 0.03, -2.75, 0.06 - i * 0.004, 0.07 - i * 0.004, 0.03, '#F2E8D2', 8);
    v.box(-1.05, 1.0, -2.75, 0.3, 0.2, 0.22, C.sack);
    // the keeper's stool, empty, and his cloth bag hanging from it
    cyl(v, 0.5, 0.58, -2.3, 0.18, 0.18, 0.05, C.teak, 8);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; rb(v, 0.5 + Math.cos(a) * 0.12, 0.28, -2.3 + Math.sin(a) * 0.12, 0.04, 0.56, 0.04, C.woodD); }
    v.box(0.66, 0.42, -2.25, 0.06, 0.24, 0.2, '#7A9A6A');
    rb(v, 1.2, 0.7, -2.85, 0.04, 1.35, 0.04, C.woodL, 0.08, 0, 0.12);
    rb(v, 1.28, 0.12, -2.84, 0.2, 0.24, 0.08, '#C9A26A', 0.08, 0, 0.12);
    S.merge(v);
  }
  packetStrips(st, -3.2, -0.7, 2.38, -hd + 0.1, 3);

  // --- the counter (w 3.6, h 0.95) with the pan scale, weights, coin tin and the keeper's note
  {
    const W = 3.6, D = 0.62, H = 0.95; // 0.62 deep at z -1.44 so a walkway stays open between it and the bins
    const v = new VoxelBuilder();
    v.boxMin(-W / 2, 0, -D / 2, W / 2, H - 0.06, D / 2, C.woodD);
    v.boxMin(-W / 2 - 0.05, H - 0.06, -D / 2 - 0.05, W / 2 + 0.05, H, D / 2 + 0.06, jitter(C.teak, 0.04, 6));
    for (let x = -W / 2 + 0.08; x < W / 2 - 0.05; x += 0.15) v.box(x + 0.05, (H - 0.18) / 2 + 0.08, D / 2 + 0.01, 0.11, H - 0.24, 0.02, jitter(C.woodL, 0.06, x * 10));
    v.boxMin(-W / 2, 0, D / 2 - 0.02, W / 2, 0.08, D / 2 + 0.03, C.woodXD);
    v.box(0, H - 0.12, D / 2 + 0.03, W - 0.1, 0.08, 0.02, C.maroon);
    for (let i = 0; i < 9; i++) v.box(-1.6 + i * 0.4, H - 0.12, D / 2 + 0.045, 0.05, 0.05, 0.01, C.gold);
    // pan scale post and arm (the beam and pans are a moving part, added after the bake)
    v.box(-0.9, H + 0.55, -0.15, 0.07, 1.1, 0.07, C.woodD);
    v.box(-0.9, H + 0.02, -0.15, 0.2, 0.04, 0.2, C.woodXD);
    v.boxMin(-0.9, H + 1.04, -0.18, -0.25, H + 1.1, -0.12, C.woodD);
    rb(v, -0.78, H + 0.95, -0.15, 0.04, 0.3, 0.04, C.woodD, 0, 0, 0.8);
    v.box(-0.35, H + 1.02, -0.15, 0.03, 0.04, 0.03, C.iron);
    // weights in a wooden tray
    v.boxMin(-0.62, H, 0.02, -0.26, H + 0.04, 0.24, C.woodL);
    [0.07, 0.06, 0.05, 0.04, 0.035, 0.03].forEach((r, i) => { cyl(v, -0.57 + i * 0.058, H + 0.03 + r * 0.6, 0.13, r * 0.55, r * 0.6, r * 1.2, C.gold, 8); cyl(v, -0.57 + i * 0.058, H + 0.04 + r * 1.2, 0.13, 0.008, 0.008, 0.02, C.goldD, 6); });
    // the coin tin, open: notes, coins
    v.boxMin(0.72, H, -0.02, 1.08, H + 0.1, 0.22, C.tin);
    v.boxMin(0.74, H + 0.06, 0.0, 1.06, H + 0.095, 0.2, '#8FB08A');
    v.box(0.82, H + 0.1, 0.06, 0.1, 0.01, 0.06, '#C8A2C0'); v.box(0.98, H + 0.1, 0.13, 0.1, 0.012, 0.05, '#E2C36A');
    for (let i = 0; i < 5; i++) cyl(v, 0.8 + i * 0.05, H + 0.102, 0.17 - (i % 2) * 0.05, 0.018, 0.018, 0.008, i % 2 ? C.gold : C.tinL, 8);
    rb(v, 0.9, H + 0.2, -0.09, 0.36, 0.08, 0.02, C.tin, -1.1, 0, 0); // the lid, open
    // the keeper's note under a stone
    v.box(0.05, H + 0.045, 0.08, 0.13, 0.08, 0.1, '#9A938A', 0.3); v.box(0.08, H + 0.08, 0.06, 0.08, 0.04, 0.07, '#B0A99E', 0.5);
    // jars of snacks at the counter's ends
    [['#E8A94A', -1.55, -0.05], ['#C8323C', -1.3, 0.12], ['#6F9E5B', 1.35, -0.1], ['#E2B33C', 1.6, 0.1]].forEach(([c, x, z]) => glassJar(v, x, H, z, c, 1.1));
    // a stack of paper cones and a tray of fried snacks
    v.boxMin(0.25, H, -0.25, 0.6, H + 0.03, -0.02, C.woodL);
    for (let i = 0; i < 6; i++) v.box(0.3 + (i % 3) * 0.1, H + 0.05, -0.2 + Math.floor(i / 3) * 0.1, 0.08, 0.035, 0.06, ['#E8A94A', '#D98A3A', '#F0C070'][i % 3], i * 0.4);
    room.place(piece(v, { w: W, d: D }, 'snackCounter'), 0, -1.44);
    // flat papers: the note, a slate for the change
    // the keeper's note, big and propped against its stone so it reads from the camera
    st.sign(0.36, 0.25, M(0.0, H + 0.085, -1.26, -0.75, 0, 0.06), (g, w, h) => {
      paperBg(g, w, h, '#FFFBF0', 6);
      g.fillStyle = 'rgba(200,50,60,0.85)'; g.fillRect(0, 0, w, 7);
      txt(g, 'ဈေးသွားတယ်။', w / 2, h * 0.34, 30, C.ink, { maxW: w - 12 }); // DRAFT(my): the keeper's note
      txt(g, 'ကိုယ့်ဟာကိုယ် ချိန်ပါ။', w / 2, h * 0.72, 23, C.maroon, { maxW: w - 12 }); // DRAFT(my)
    }, 500);
    st.sign(0.42, 0.28, M(0.9, H + 0.19, -1.64, -0.3, 0, 0), (g, w, h) => { slateBg(g, w, h, 33); chalkText(g, 'အမ်းငွေ', w / 2, h * 0.3, 30, '#F7E7A6'); chalkText(g, 'ကိုယ်တိုင်ယူ', w / 2, h * 0.7, 28); }, 320); // DRAFT(my): change slate
    S.boxMin(0.67, H, -1.74, 1.13, H + 0.34, -1.71, C.woodL);
  }
  // the scale's beam and pans: a moving part (setTilt)
  const scaleG = new THREE.Group();
  scaleG.position.set(-0.35, 0.95 + 0.98, -1.59);
  {
    const v = new VoxelBuilder();
    v.box(0, 0.035, 0, 0.012, 0.07, 0.012, C.ink);
    const beam = new VoxelBuilder();
    beam.box(0, 0, 0, 0.56, 0.025, 0.025, C.gold);
    beam.box(0, 0.06, 0, 0.016, 0.12, 0.016, C.goldD);
    beam.box(0, 0, 0, 0.05, 0.05, 0.035, C.goldD);
    for (const s of [-1, 1]) beam.box(s * 0.28, 0, 0, 0.04, 0.04, 0.04, C.goldD);
    const pan = (s) => {
      const p = new VoxelBuilder();
      for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.3; rb(p, Math.cos(a) * 0.05, -0.15, Math.sin(a) * 0.05, 0.008, 0.3, 0.008, C.ink, Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); }
      cyl(p, 0, -0.31, 0, 0.12, 0.085, 0.035, C.gold, 8);
      cyl(p, 0, -0.292, 0, 0.105, 0.105, 0.004, '#B48D3C', 8);
      if (s < 0) { cyl(p, -0.02, -0.26, 0, 0.035, 0.04, 0.06, C.gold, 8); }
      else for (let i = 0; i < 5; i++) p.box(-0.04 + (i % 3) * 0.04, -0.28 + Math.floor(i / 3) * 0.025, -0.02 + (i % 2) * 0.04, 0.035, 0.025, 0.035, '#7A3A2A');
      return p;
    };
    const bm = beam.mesh({ px: 1.3 });
    scaleG.add(v.mesh({ px: 1.2 }));
    scaleG.add(bm);
    const pans = [-1, 1].map((s) => { const m = pan(s).mesh({ px: 1.3 }); m.userData.s = s; scaleG.add(m); return m; });
    scaleG.position.y -= 0.07;
    bm.position.y = -0.0;
    const setTilt = (t) => {
      t = Math.max(-1, Math.min(1, t));
      const a = -t * 0.3;
      bm.rotation.z = a;
      for (const p of pans) p.position.set(p.userData.s * 0.28 * Math.cos(a), p.userData.s * 0.28 * Math.sin(a), 0);
    };
    setTilt(0.15);
    st.parts.scale = { setTilt };
  }
  st.tap('sn-scale', -0.9, -0.74, 0.5, { x: -0.6, z: -1.55 }, { my: 'ချိန်ခွင်', en: 'the pan scale' }); // DRAFT(my)
  st.stations[st.stations.length - 1].labelY = 1.4; // (tap hit point up on its pans, not only the floor below)
  st.tap('sn-note', 0.0, -0.74, 0.5, { x: 0.0, z: -1.3 }, { my: 'ဆိုင်ရှင်ရဲ့ စာ', en: "the keeper's note" }); // DRAFT(my)
  st.tap('sn-tin', 0.9, -0.74, 0.5, { x: 0.9, z: -1.4 }, { my: 'ပိုက်ဆံဘူး', en: 'the coin tin' }); // DRAFT(my)

  // --- price board above the counter, the motto painted on the wall
  S.boxMin(-0.88, 1.56, -hd, 0.88, 2.34, -hd + 0.04, C.woodD);
  st.wallSign('back', 0, 1.95, 1.6, 0.7, (g, w, h) => {
    slateBg(g, w, h, 40, ['#3E4A40', '#2E3A31']);
    const rows = [['ပဲစေ့ တစ်ခွက်', '၂၀၀'], ['ပဲလှော်', '၁၀၀'], ['မန်ကျည်းပြား', '၅၀']]; // DRAFT(my)
    rows.forEach(([a, b], i) => { chalkText(g, a, w * 0.38, h * (0.22 + i * 0.28), 30); chalkText(g, `${b} ကျပ်`, w * 0.8, h * (0.22 + i * 0.28), 30, '#F7E7A6'); });
  }, 220);
  st.tap('sn-prices', -1.8, -0.74, 0.5, { x: 0, z: -2.9 }, { my: 'ဈေးနှုန်းဘုတ်', en: 'the price board' }); // DRAFT(my)
  st.wallSign('back', -1.95, 2.68, 1.9, 0.32, (g, w, h) => { rr(g, 3, 3, w - 6, h - 6, 12, C.maroon, C.gold, 5); txt(g, 'ကိုယ့်ဟာကိုယ် ချိန်၊ ကိုယ့်ဟာကိုယ် အမ်းယူ', w / 2, h / 2 + 2, Math.round(h * 0.34), '#F7E7A6'); }, 260); // DRAFT(my)

  // --- the three open bins before the counter (bean seeds, roasted peas, tamarind flakes)
  const binFills = [['#7A3A2A', '#9A4A34', 'ပဲစေ့'], ['#D9A94A', '#E8BE62', 'ပဲလှော်'], ['#6B3A22', '#8A5432', 'မန်ကျည်း']]; // DRAFT(my)
  binFills.forEach(([a, b, label], i) => {
    const v = new VoxelBuilder();
    v.boxMin(-0.3, 0, -0.3, 0.3, 0.62, 0.3, C.woodD);
    v.boxMin(-0.32, 0.6, -0.32, 0.32, 0.66, 0.32, C.teak);
    for (let k = 0; k < 3; k++) v.boxMin(-0.305, 0.08 + k * 0.18, 0.29, 0.305, 0.2 + k * 0.18, 0.305, jitter(C.woodL, 0.06, k + i * 3));
    v.boxMin(-0.27, 0.5, -0.27, 0.27, 0.62, 0.27, a);
    const r = rand(70 + i);
    for (let k = 0; k < 26; k++) v.box(-0.24 + r() * 0.48, 0.625, -0.24 + r() * 0.48, 0.035, 0.02 + r() * 0.03, 0.03, k % 3 ? b : jitter(a, 0.2, k), r() * 3);
    cyl(v, 0.08, 0.66, 0.05, 0.05, 0.045, 0.08, C.tinL, 8); // tin cup scoop
    rb(v, 0.16, 0.67, 0.05, 0.1, 0.02, 0.02, C.tinD, 0, 0, 0.3);
    const bin = piece(v, { w: 0.56, d: 0.56 }, 'bin');
    bin.scale.set(0.9, 1, 0.9);
    room.place(bin, -1.5 + i * 1.5, -0.15);
    st.sign(0.5, 0.21, M(-1.5 + i * 1.5, 0.4, -0.15 + 0.284), (g, w, h) => { rr(g, 2, 2, w - 4, h - 4, 8, '#FFF8E8', C.maroon, 5); txt(g, label, w / 2, h / 2 + 2, Math.round(h * 0.52), C.maroon, { maxW: w - 14 }); }, 280); // DRAFT(my): bin labels
  });
  st.tap('sn-bins', 0, 0.55, 0.7, { x: 0, z: -0.15 }, { my: 'ပဲပုံးများ', en: 'the bins' }); // DRAFT(my)

  // --- left wall: jar shelf; right wall: calendar (+ Day 7's take-one shelf); a lantern
  {
    const v = new VoxelBuilder();
    const w = 1.4, h = 1.7, d = 0.34;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * (w / 2 - 0.025), h / 2, sz * (d / 2 - 0.025), 0.05, h, 0.05, C.woodD);
    v.boxMin(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.03, '#B9875A');
    v.boxMin(-w / 2 - 0.03, h, -d / 2 - 0.02, w / 2 + 0.03, h + 0.05, d / 2 + 0.03, C.teak);
    const fills = ['#E8A0A8', '#F2C65A', '#8DBA6E', '#C8323C', '#F4F0FF', '#E8A94A', '#7FB0CF', '#B5643C'];
    [0.05, 0.6, 1.15].forEach((y, k) => {
      v.boxMin(-w / 2, y - 0.04, -d / 2, w / 2, y, d / 2, C.woodD);
      for (let i = 0; i < 5; i++) glassJar(v, -0.5 + i * 0.25, y, 0.02, fills[(i + k * 3) % fills.length], 1.15, [C.maroon, C.gold, '#2F5DB3'][(i + k) % 3]);
    });
    room.place(piece(v, { w, d }, 'jarShelf'), -3.28, -0.85, Math.PI / 2);
  }
  st.wallSign('right', -2.3, 1.8, 0.45, 0.62, (g, w, h) => drawCalendar(g, w, h, { month: 'တော်သလင်း', pic: 'flowers', mark: 12, seed: 8 }), 260); // DRAFT(my)
  S.box(3.47, 2.13, -2.3, 0.03, 0.03, 0.03, C.iron);
  hangingLamp(st, -2.2, 2.25, -1.6, 0.35);
  S.boxMin(-3.5, 2.58, -1.65, -2.15, 2.62, -1.55, C.woodD); // the lamp's wall bracket
  if (d7) {
    // the take-one shelf (moved inside from the stall) and the reading bench
    const v = new VoxelBuilder();
    const w = 1.1, h = 1.3, d = 0.32;
    // painted teal with gold edges (it came in from the street stall): the Day 7 change reads at once
    v.boxMin(-w / 2, 0, -d / 2, -w / 2 + 0.06, h, d / 2, C.teal);
    v.boxMin(w / 2 - 0.06, 0, -d / 2, w / 2, h, d / 2, C.teal);
    v.boxMin(-w / 2 - 0.005, 0, d / 2 - 0.02, -w / 2 + 0.065, h, d / 2 + 0.005, C.gold);
    v.boxMin(w / 2 - 0.065, 0, d / 2 - 0.02, w / 2 + 0.005, h, d / 2 + 0.005, C.gold);
    v.boxMin(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.03, '#8FC1BC');
    v.boxMin(-w / 2 - 0.03, h, -d / 2 - 0.02, w / 2 + 0.03, h + 0.06, d / 2 + 0.03, C.maroon);
    cyl(v, 0.32, h + 0.13, 0, 0.09, 0.09, 0.14, C.tinL, 10); cyl(v, 0.32, h + 0.13, 0, 0.092, 0.092, 0.08, C.red, 10); // the take-one tin on top
    const r = rand(77);
    [0.05, 0.48, 0.9].forEach((y, k) => {
      v.boxMin(-w / 2, y - 0.04, -d / 2, w / 2, y, d / 2, C.teal);
      v.boxMin(-w / 2, y - 0.04, d / 2 - 0.02, w / 2, y, d / 2 + 0.005, C.gold);
      let x = -w / 2 + 0.08;
      const end = k === 2 ? -0.05 : w / 2 - 0.25;
      while (x < end) { const bw = 0.04 + r() * 0.03; v.boxMin(x, y, -d / 2 + 0.05, x + bw, y + 0.22 + r() * 0.1, d / 2 - 0.06, BOOKS[Math.floor(r() * 8)]); x += bw + 0.01; }
      if (k === 1) for (let i = 0; i < 3; i++) v.box(0.3, y + 0.015 + i * 0.03, 0, 0.24, 0.028, 0.2, BOOKS[(i + 3) % 8], i * 0.2);
    });
    room.place(piece(v, { w, d }, 'takeOneShelf'), 3.28, -0.4, -Math.PI / 2);
    st.wallSign('right', -0.4, 1.9, 1.05, 0.34, (g, w, h) => { rr(g, 3, 3, w - 6, h - 6, 10, C.maroon, C.gold, 5); txt(g, 'တစ်ခုယူ၊ တစ်ခုထား', w / 2, h / 2 + 2, Math.round(h * 0.4), '#F7E7A6', { maxW: w - 20 }); }, 260); // DRAFT(my): take one, leave one
    S.boxMin(1.95, 0.0008, -1.0, 2.85, 0.005, 0.2, C.gold); S.boxMin(2.0, 0.005, -0.95, 2.8, 0.008, 0.15, '#E9C65A'); // a gold rag rug before it
    for (const z of [-0.85, 0.05]) S.boxMin(2.0, 0.008, z - 0.03, 2.8, 0.01, z + 0.03, C.maroon);
    st.sign(0.3, 0.22, M(3.3, 1.07, -0.62, -0.2, -Math.PI / 2, 0), (g, w, h) => { slateBg(g, w, h, 46); chalkText(g, '၉', w * 0.2, h * 0.3, 22, '#F7E7A6'); chalkText(g, 'ပေးပြီး', w * 0.6, h * 0.36, 18); chalkText(g, 'မမျှော်နဲ့', w * 0.55, h * 0.72, 18); }, 300); // DRAFT(my)
    st.tap('sn-takeone', 2.6, -0.4, 0.6, { x: 3.3, z: -0.4 }, { my: 'တစ်ခုယူ စင်', en: 'the take-one shelf' }); // DRAFT(my)
    const b = new VoxelBuilder();
    b.boxMin(-0.22, 0.38, -0.65, 0.22, 0.43, 0.65, jitter(C.teak, 0.05, 2));
    for (const z of [-0.55, 0.55]) b.boxMin(-0.18, 0, z - 0.04, 0.18, 0.38, z + 0.04, C.woodD);
    b.boxMin(-0.18, 0.43, -0.4, 0.18, 0.5, 0.2, C.maroon);
    b.boxMin(-0.16, 0.5, -0.38, 0.16, 0.505, 0.18, C.gold);
    room.place(piece(b, { w: 0.44, d: 1.3 }, 'readingBench'), -3.0, 1.4);
  } else {
    // a crate of empty bottles waiting by the right wall
    const v = new VoxelBuilder();
    v.boxMin(-0.3, 0, -0.22, 0.3, 0.26, 0.22, C.woodL);
    for (let i = 0; i < 6; i++) { cyl(v, -0.18 + (i % 3) * 0.18, 0.32, -0.08 + Math.floor(i / 3) * 0.16, 0.045, 0.05, 0.22, '#8FB0A0', 8); cyl(v, -0.18 + (i % 3) * 0.18, 0.45, -0.08 + Math.floor(i / 3) * 0.16, 0.02, 0.03, 0.06, '#8FB0A0', 6); }
    room.place(piece(v, { w: 0.6, d: 0.44 }, 'crate'), 3.0, -0.6, -Math.PI / 2);
  }
  // sacks by the door
  {
    const v = new VoxelBuilder();
    sackInto(v, -0.12, 0, C.sack, 1, 0.2, '#7A3A2A');
    sackInto(v, 0.3, 0.05, C.sackD, 0.9, -0.3, '#D9A94A');
    room.place(piece(v, { w: 0.85, d: 0.45 }, 'sacks'), -2.6, 2.4);
  }
  {
    // a basket of onions and a basket of dried chillies by the front, a low stool to sit and wait
    const v = new VoxelBuilder();
    for (const [bx, fill, fill2] of [[-0.3, '#B5643C', '#C98A5A'], [0.3, '#C8323C', '#A82A30']]) {
      cyl(v, bx, 0.13, 0, 0.25, 0.2, 0.26, '#C9A26A', 8);
      cyl(v, bx, 0.2, 0, 0.26, 0.26, 0.03, '#A9824F', 8);
      const r = rand(bx > 0 ? 3 : 4);
      for (let i = 0; i < 12; i++) v.box(bx - 0.16 + r() * 0.32, 0.27 + r() * 0.05, -0.16 + r() * 0.32, 0.07, 0.06, bx > 0 ? 0.11 : 0.07, i % 2 ? fill : fill2, r() * 3);
    }
    room.place(piece(v, { w: 1.1, d: 0.5 }, 'baskets'), 2.4, 2.3);
    const s = new VoxelBuilder();
    stoolInto(s, 0, 0, C.teakD, 0.32, 0.3);
    room.place(piece(s, { w: 0.3, d: 0.3 }, 'stool'), 2.9, 1.3);
  }
  // --- the doorway's bead curtain (INDEX: open doorway with a bead curtain), tied back to two bamboo
  //     poles on the door posts so the front-open view stays clear
  {
    const z = st.hd - 0.04;
    const beads = [C.maroon, C.gold, '#F6F0E2', C.teal, C.gold, '#C8323C'];
    for (const s of [-1, 1]) {
      S.box(s * 0.95, 1.3, z, 0.06, 0.8, 0.06, '#C9A26A');
      for (const y of [1.0, 1.35]) S.box(s * 0.95, y, z, 0.07, 0.02, 0.07, '#A9824F');
      S.box(s * 0.82, 1.68, z, 0.3, 0.035, 0.035, C.woodD);
      for (let k = 0; k < 7; k++) {
        const top = [s * (0.94 - k * 0.04), 1.66], tie = [s * (0.9 - k * 0.006), 0.82], bot = [s * (0.88 - k * 0.035), 0.1];
        let n = 0;
        for (const [a, b] of [[top, tie], [tie, bot]]) {
          const L = Math.hypot(b[0] - a[0], b[1] - a[1]), steps = Math.floor(L / 0.055);
          for (let i = 0; i < steps; i++, n++) {
            const t = i / steps;
            S.box(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, z + 0.02 + (k % 2) * 0.015, 0.032, 0.04, 0.032, beads[(n + k) % beads.length]);
          }
        }
      }
      S.box(s * 0.88, 0.82, z + 0.03, 0.1, 0.05, 0.08, C.maroon); // the tie
    }
  }
  for (const [x, z] of [[-1.5, -0.15], [0, -0.15], [1.5, -0.15]]) S.boxMin(x - 0.35, 0.0005, z - 0.35, x + 0.35, 0.002, z + 0.35, '#9C5A3C');

  // --- spots
  st.spot('toetoe', -1.2, 1.0, 0.35); // in front of the first bin (out of the lane to the counter), turned round to the door: face and satchel read
  st.spot('toetoeScale', -0.9, -0.78, Math.PI);
  st.spot('maya', 1.2, 1.3, Math.PI + 0.35);
  st.spot('door', 0, 2.65, Math.PI);
  if (d7) {
    st.spot('naychi', 2.55, -0.4, 0.95); // by the take-one shelf, half-turned to the room
    st.spot('mayaD7', 1.2, 0.6, Math.atan2(1.4, -1.0));
    st.spot('child', 2.2, 0.75, -0.45);
  }
  st.finish();
  room.group.add(scaleG);
  return st.result({ id: 'snackshop', day });
}

// =============================================================================================
// pottershed · Daw Ohn's shed (INDEX 13.2: Day 2's layout + Day 3's tally boards, bench, tea stool)
// =============================================================================================
function drawTally(cv, { load = 4, rubbed = false, mine = false } = {}) {
  const g = cv.getContext('2d');
  const W = cv.width, H = cv.height, hw = W / 2;
  // left: her master's board, weathered; right: hers for Mi Cho
  for (let b = 0; b < 2; b++) {
    g.save();
    g.translate(b * hw, 0);
    slateBg(g, hw, H, 50 + b, b ? ['#46534A', '#36423A'] : ['#4E564C', '#3E463E']);
    g.fillStyle = b ? '#A27B4E' : '#8C6A44';
    g.fillRect(0, 0, hw, 14); g.fillRect(0, H - 14, hw, 14); g.fillRect(0, 0, 14, H); g.fillRect(hw - 14, 0, 14, H);
    if (b === 0) {
      chalkText(g, '၁၂', hw / 2, 62, 58, 'rgba(244,241,232,0.75)'); // DRAFT(my)
      g.strokeStyle = 'rgba(244,241,232,0.6)'; g.lineWidth = 4; g.lineCap = 'round';
      for (let i = 0; i < 30; i++) { const x = 34 + (i % 10) * 44, y = 128 + Math.floor(i / 10) * 52; g.beginPath(); g.moveTo(x, y + 10); g.lineTo(x + 9, y + 22); g.lineTo(x + 24, y - 4); g.stroke(); }
    } else if (mine) {
      // Day 7+: Mi Cho's own counts, all rung
      ['၁၂', '၁၂', '၁၂', '၁၂'].forEach((n, i) => { chalkText(g, n, 70 + (i % 2) * 190, 80 + Math.floor(i / 2) * 110, 52); g.strokeStyle = 'rgba(191,227,166,0.9)'; g.lineWidth = 5; g.beginPath(); g.arc(70 + (i % 2) * 190, 80 + Math.floor(i / 2) * 110, 42, 0, 7); g.stroke(); }); // DRAFT(my)
    } else {
      const items = ['၁၂', '✗', '၁၂', '✗', '၁၂', '✗', mm(load), '?']; // DRAFT(my)
      items.forEach((s, i) => {
        const x = 64 + (i % 4) * 110, y = 96 + Math.floor(i / 4) * 120;
        if (s === '✗') {
          if (rubbed) { g.fillStyle = 'rgba(230,236,226,0.12)'; g.fillRect(x - 28, y - 28, 56, 56); return; }
          g.strokeStyle = '#F2A08F'; g.lineWidth = 6; g.lineCap = 'round';
          g.beginPath(); g.moveTo(x - 18, y - 18); g.lineTo(x + 18, y + 18); g.moveTo(x + 18, y - 18); g.lineTo(x - 18, y + 18); g.stroke();
        } else chalkText(g, s, x, y, 50, s === '?' ? '#F7E7A6' : '#F4F1E8');
      });
    }
    g.restore();
  }
}
function buildPottershed(opts = {}) {
  const day = opts.day ?? 2;
  const st = makeStage({ width: 8, depth: 7, height: 3, wall: '#EFE6D2', wainscot: '#B26A4C', trim: '#7A5434', floor: 'carpet', floorColor: '#C9AA80' }); // packed earth, lighter than the wainscot and the dark wheel mats
  const { room, S, hd } = st;
  const later = day >= 3;

  st.window({
    x: 0.1, y: 1.85, w: 1.0, h: 0.9, sunLen: 1.8, shutter: '#8E6644', shutterD: '#6E5038', bars: 2,
    view: (g, w, h) => {
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#A9CBE6'); sky.addColorStop(1, '#F8E2C2');
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      g.fillStyle = '#E2CFA6'; g.fillRect(0, h * 0.68, w, h * 0.32); // the yard
      g.fillStyle = '#A0503A'; g.beginPath(); g.arc(w * 0.66, h * 0.7, w * 0.22, Math.PI, 0); g.fill(); // the kiln's dome
      g.fillStyle = '#7E3C2B'; for (let i = 0; i < 5; i++) g.fillRect(w * 0.46 + i * w * 0.08, h * 0.6 - (i % 2) * 6, w * 0.06, 3);
      g.fillStyle = '#7E3C2B'; g.fillRect(w * 0.76, h * 0.25, w * 0.07, h * 0.3);
      g.fillStyle = 'rgba(240,236,228,0.8)'; g.beginPath(); g.arc(w * 0.8, h * 0.18, 9, 0, 7); g.arc(w * 0.86, h * 0.1, 11, 0, 7); g.fill();
      g.fillStyle = '#7A5434'; g.fillRect(w * 0.06, h * 0.46, 4, h * 0.26); g.fillRect(w * 0.3, h * 0.46, 4, h * 0.26); // a drying rack
      for (let k = 0; k < 2; k++) { g.fillRect(w * 0.05, h * (0.5 + k * 0.1), w * 0.27, 3); for (let i = 0; i < 3; i++) { g.fillStyle = '#D9B48C'; g.fillRect(w * (0.09 + i * 0.07), h * (0.5 + k * 0.1) - 10, 12, 10); g.fillStyle = '#7A5434'; } }
    },
  });
  st.motes(0.2, 0.3, -2.4, 1.0, 1.6, 1.4, 18);

  // --- Daw Ohn's old shelf (back-left, 3.0 wide): twelve thick pots, Mi Cho's first pot, the first-week pots
  {
    const w = 3.0, h = 1.7, d = 0.42;
    const v = new VoxelBuilder();
    for (const x of [-w / 2, -0.5, 0.5, w / 2]) v.box(x, h / 2, 0, 0.07, h, d, jitter(C.woodD, 0.08, x * 5));
    const boards = [0.06, 0.62, 1.18];
    boards.forEach((y, k) => { v.boxMin(-w / 2, y - 0.04, -d / 2, w / 2, y, d / 2, jitter('#8C6A44', 0.06, k)); v.boxMin(-w / 2, y - 0.07, d / 2 - 0.03, w / 2, y, d / 2, C.woodXD); });
    v.boxMin(-w / 2 - 0.05, h, -d / 2 - 0.03, w / 2 + 0.05, h + 0.05, d / 2 + 0.03, C.woodD);
    for (let i = 0; i < 12; i++) {
      const row = i < 6 ? 2 : 1, j = i % 6;
      potInto(v, -1.25 + j * 0.47 + (row === 1 ? 0.04 : 0), boards[row], 0.0, 0.92, 'thick');
    }
    potInto(v, 1.3, h + 0.05, 0.02, 0.5, 'whole', 0.25); // Mi Cho's first pot, small and lopsided, at the right end on top
    if (later) for (let i = 0; i < 12; i++) potInto(v, -1.32 + i * 0.24, boards[0], (i % 2) * 0.06 - 0.03, 0.5 + ((i * 7) % 3) * 0.03, 'whole', ((i * 5) % 3 - 1) * 0.12);
    else for (let i = 0; i < 4; i++) sackInto(v, -1.1 + i * 0.6, 0, C.sackD, 0.55, i * 0.3);
    room.place(piece(v, { w, d }, 'oldShelf'), -1.6, -3.2);
    st.sign(0.24, 0.07, M(-1.6 - 0.2, 1.145, -3.2 + d / 2 + 0.004), (g, w2, h2) => { g.fillStyle = '#5A3D26'; g.fillRect(0, 0, w2, h2); chalkText(g, '၁၂', w2 / 2, h2 / 2 + 2, Math.round(h2 * 0.7)); }, 300); // DRAFT(my)
    if (later) st.sign(0.5, 0.07, M(-1.6 - 0.5, 0.035, -3.2 + d / 2 + 0.004), (g, w2, h2) => { g.fillStyle = '#5A3D26'; g.fillRect(0, 0, w2, h2); chalkText(g, 'ပထမအပတ်', w2 / 2, h2 / 2 + 2, Math.round(h2 * 0.62)); }, 300); // DRAFT(my)
  }
  st.tap('ps-oldshelf', -1.6, -2.4, 0.9, { x: -1.6, z: -3.2 }, { my: 'စင်အဟောင်း', en: 'the old shelf' }); // DRAFT(my)

  // --- the master's old wheel at rest (back-right): a folded cover cloth and a fresh jasmine string
  {
    const v = new VoxelBuilder();
    const dark = '#5E4430', wood = '#7A5A3C';
    for (const z of [-0.34, 0.34]) { v.boxMin(-0.8, 0, z - 0.05, 0.55, 0.06, z + 0.05, dark); v.boxMin(-0.8, 0.36, z - 0.04, -0.3, 0.42, z + 0.04, wood); for (const x of [-0.75, -0.35]) v.box(x, 0.21, z, 0.07, 0.36, 0.07, dark); }
    for (let i = 0; i < 3; i++) v.box(-0.55, 0.45, -0.17 + i * 0.17, 0.46, 0.05, 0.16, jitter(wood, 0.08, i));
    for (const x of [-0.18, 0.5]) for (const z of [-0.34, 0.34]) v.box(x, 0.23, z, 0.08, 0.46, 0.08, dark);
    v.boxMin(-0.22, 0.42, -0.38, 0.54, 0.5, 0.38, wood);
    cyl(v, 0.16, 0.13, 0, 0.28, 0.28, 0.08, '#6E6458', 8);
    cyl(v, 0.16, 0.36, 0, 0.025, 0.025, 0.46, C.iron, 6);
    cyl(v, 0.16, 0.57, 0, 0.2, 0.2, 0.05, '#857866', 8);
    // the cover cloth folded over the wheel head, hanging down the front
    v.box(0.16, 0.61, 0, 0.44, 0.03, 0.44, '#D9CDB4');
    v.box(0.16, 0.5, 0.21, 0.4, 0.22, 0.03, '#CFC2A6');
    v.box(0.16, 0.405, 0.22, 0.4, 0.02, 0.035, C.maroon);
    // the jasmine string laid in a ring on the cloth
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; v.box(0.16 + Math.cos(a) * 0.13, 0.64, Math.sin(a) * 0.13, 0.04, 0.04, 0.04, i % 3 ? '#FBF7EE' : '#F1E6C0'); }
    v.box(0.16, 0.64, 0.0, 0.05, 0.03, 0.05, C.leafD);
    room.place(piece(v, { w: 1.4, d: 0.8 }, 'masterWheel'), 3.05, -2.75, -Math.PI / 2);
  }
  st.tap('ps-master', 2.6, -1.9, 0.6, { x: 3.05, z: -2.75 }, { my: 'ဆရာ့ ဘီးဟောင်း', en: "the master's old wheel" }); // DRAFT(my)

  // --- tally boards (Day 3+) over the master's wheel, a peg shelf and a jasmine cup
  if (later) {
    const tw = 0.8, th = 0.6;
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 384;
    let tstate = { load: opts.load ?? 4, rubbed: false, mine: day >= 7 };
    drawTally(cv, tstate);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const geos = [0, 1].map((b) => {
      const q = new THREE.PlaneGeometry(tw, th);
      const uv = q.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setX(i, (b + uv.getX(i)) / 2);
      return q.applyMatrix4(M(b ? 2.75 : 1.65, 1.62, -hd + 0.07, 0, 0, b ? 0.03 : -0.04));
    });
    const mesh = new THREE.Mesh(mergeGeometries(geos, false), basic('#ffffff', { map: tex }));
    geos.forEach((q) => q.dispose());
    mesh.userData.dynamic = true;
    mesh.name = 'tallyBoards';
    room.group.add(mesh);
    fontsReady().then(() => { drawTally(cv, tstate); tex.needsUpdate = true; });
    st.parts.tally = { set(s) { tstate = { ...tstate, ...s }; drawTally(cv, tstate); tex.needsUpdate = true; } };
    st.disposers.push(() => tex.dispose());
    for (const x of [1.65, 2.75]) { S.box(x, 1.62 + th / 2 + 0.05, -hd + 0.03, 0.03, 0.06, 0.04, C.iron); }
    S.boxMin(1.75, 1.05, -hd, 2.55, 1.09, -hd + 0.18, C.woodD);
    for (const x of [1.85, 2.45]) S.box(x, 1.0, -hd + 0.06, 0.04, 0.1, 0.1, C.woodD);
    cyl(S, 2.15, 1.14, -hd + 0.1, 0.045, 0.035, 0.09, '#F6F0E2', 8);
    for (let i = 0; i < 6; i++) S.box(2.15 + Math.cos(i) * 0.035, 1.2 + (i % 2) * 0.02, -hd + 0.1 + Math.sin(i) * 0.03, 0.03, 0.03, 0.03, '#FBF7EE');
    st.tap('ps-tally', 2.2, -1.6, 0.6, { x: 2.2, z: -3.4 }, { my: 'မှတ်တမ်းဘုတ်', en: 'the tally boards' }); // DRAFT(my)
  }
  // --- Daw Ohn's low bench and the tea stool (teapot + two cups)
  {
    const v = new VoxelBuilder();
    v.boxMin(-0.7, 0.28, -0.2, 0.7, 0.33, 0.2, jitter(C.wood, 0.05, 3));
    for (const x of [-0.6, 0.6]) v.boxMin(x - 0.04, 0, -0.16, x + 0.04, 0.28, 0.16, C.woodD);
    v.box(0.35, 0.36, 0.0, 0.3, 0.06, 0.28, '#B5643C'); // a folded cloth on it
    room.place(piece(v, { w: 1.4, d: 0.4 }, 'lowBench'), 1.4, -2.4);
    const t = new VoxelBuilder();
    t.boxMin(-0.2, 0.24, -0.2, 0.2, 0.28, 0.2, C.woodL);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) t.box(sx * 0.15, 0.12, sz * 0.15, 0.04, 0.24, 0.04, C.woodD);
    cyl(t, 0, 0.33, 0, 0.07, 0.06, 0.1, C.terraD, 8); cyl(t, 0, 0.39, 0, 0.04, 0.06, 0.03, C.terra, 8); cyl(t, 0, 0.42, 0, 0.012, 0.012, 0.02, C.terraD, 6);
    rb(t, 0.09, 0.35, 0, 0.08, 0.02, 0.02, C.terraD, 0, 0, 0.5);
    for (const [x, z] of [[-0.11, 0.1], [0.12, 0.12]]) cyl(t, x, 0.31, z, 0.03, 0.025, 0.045, '#EDE6D3', 8);
    room.place(piece(t, { w: 0.4, d: 0.4 }, 'teaStool'), 1.4, -1.6);
  }

  // --- the two working wheels (props2 potterWheel: the rotor spins, the clay changes)
  const wheels = {};
  const mkWheel = (x, z, s, chalk, clay) => {
    const w = potterWheel({ clay, chalk: chalk ?? '' });
    w.root.scale.setScalar(s);
    w.root.rotation.y = -Math.PI / 2;
    w.root.position.set(x, 0, z);
    for (const c of [...w.root.children]) if (c.renderOrder === -1) c.removeFromParent(); // its blob shadow (the floor has its own dark ring)
    const slate = w.root.children.find((c) => c.name === 'chalkSlate');
    if (slate) {
      if (chalk == null) slate.removeFromParent();
      else { slate.position.set(0.85, 0, 0.42); slate.rotation.y = Math.PI / 2 + 0.12; slate.scale.setScalar(1.45); }
    }
    w.rotor.traverse((o) => { o.userData.dynamic = true; });
    room.group.add(w.root);
    room.obstacles.push({ type: 'box', minX: x - 0.45 * s, maxX: x + 0.45 * s, minZ: z - 0.9 * s, maxZ: z + 0.7 * s });
    S.boxMin(x - 0.55, 0.0085, z - 0.95 * s, x + 0.55, 0.01, z + 0.75 * s, '#8A6446');
    for (let i = 0; i < 7; i++) S.box(x + Math.cos(i * 1.7) * 0.55, 0.012, z + 0.3 + Math.sin(i * 2.3) * 0.5, 0.08 + (i % 3) * 0.03, 0.004, 0.06, i % 2 ? '#C9A27A' : '#7E5E42'); // slip splashes
    return w;
  };
  wheels.dawohn = mkWheel(-1.8, -0.8, 1, null, 3);
  wheels.micho = mkWheel(1.6, 0.4, 0.92, day >= 7 ? 'မရသေးဘူး' : 'မရ ဘူး', day >= 7 ? 3 : 0); // DRAFT(my)
  st.parts.wheels = wheels;
  st.parts.chalk = { set: (t) => wheels.micho.setChalk(t) };
  let spinD = 0, spinM = 0;
  st.parts.spin = { dawohn: (v) => { spinD = v; }, micho: (v) => { spinM = v; } };
  st.anims.push((dt) => { if (spinD) wheels.dawohn.spin(dt, spinD); if (spinM) wheels.micho.spin(dt, spinM); });
  st.disposers.push(() => { wheels.dawohn.dispose(); wheels.micho.dispose(); });
  st.tap('ps-michowheel', 1.0, 1.0, 0.6, { x: 1.6, z: 0.6 }, { my: 'မိချိုရဲ့ ဘီး', en: "Mi Cho's wheel" }); // DRAFT(my)
  st.tap('ps-dawohnwheel', -1.2, 0.0, 0.6, { x: -1.8, z: -0.6 }, { my: 'ဒေါ်အုန်းရဲ့ ဘီး', en: "Daw Ohn's wheel" }); // DRAFT(my)

  // --- wedging board along the left wall: a clay lump, her big hand-prints and Mi Cho's small ones
  {
    const v = new VoxelBuilder();
    v.boxMin(-0.32, 0.7, -0.75, 0.32, 0.78, 0.75, '#8C6A44');
    v.boxMin(-0.3, 0.78, -0.72, 0.3, 0.8, 0.72, '#9C8270');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * 0.25, 0.35, sz * 0.66, 0.08, 0.7, 0.08, C.woodD);
    v.boxMin(-0.28, 0.15, -0.68, 0.28, 0.18, 0.68, C.woodD);
    v.box(0.02, 0.88, -0.35, 0.3, 0.16, 0.26, C.clay, 0.3); v.box(0.0, 0.97, -0.33, 0.2, 0.06, 0.18, C.clayL, 0.2);
    const hand = (x, z, s, rot) => {
      const c = Math.cos(rot), sn = Math.sin(rot);
      const P = (a, b) => [x + a * c - b * sn, z + a * sn + b * c];
      let [px, pz] = P(0, 0); v.box(px, 0.802, pz, 0.09 * s, 0.004, 0.1 * s, '#6E5038', -rot);
      for (let f = 0; f < 4; f++) { [px, pz] = P((f - 1.5) * 0.024 * s, -0.09 * s); v.box(px, 0.802, pz, 0.018 * s, 0.004, 0.06 * s, '#6E5038', -rot); }
      [px, pz] = P(0.06 * s, -0.01 * s); v.box(px, 0.802, pz, 0.018 * s, 0.004, 0.05 * s, '#6E5038', -rot + 0.9);
    };
    hand(-0.05, 0.12, 1.25, Math.PI / 2); hand(-0.05, 0.38, 1.25, Math.PI / 2);
    hand(0.08, 0.2, 0.8, Math.PI / 2); hand(0.08, 0.4, 0.8, Math.PI / 2);
    v.box(0.0, 0.75, 0.74, 0.18, 0.03, 0.02, C.iron); // cutting wire handle
    room.place(piece(v, { w: 0.64, d: 1.5 }, 'wedgingBoard'), -3.3, 1.3);
  }
  st.tap('ps-hands', -2.6, 1.3, 0.6, { x: -3.3, z: 1.4 }, { my: 'လက်ရာများ', en: 'the hand-prints' }); // DRAFT(my)

  // --- clay heap under wet sacking, sacks, buckets, firewood, tool pegs, a ware board of raw pots
  {
    const v = new VoxelBuilder();
    const r = rand(9);
    for (let i = 0; i < 9; i++) v.box(-0.35 + r() * 0.7, 0.12 + r() * 0.15, -0.3 + r() * 0.6, 0.3 + r() * 0.2, 0.22, 0.28 + r() * 0.2, i % 2 ? C.clay : C.clayD, r() * 2);
    v.box(0, 0.36, -0.05, 0.85, 0.06, 0.6, '#9C8E78', 0.2); v.box(0.1, 0.25, 0.28, 0.6, 0.2, 0.05, '#8C7F6A', 0.2); v.box(-0.32, 0.25, 0.0, 0.05, 0.22, 0.5, '#8C7F6A', 0.2);
    room.place(piece(v, { w: 0.9, d: 0.8 }, 'clayHeap'), -3.15, -1.85);
    const s = new VoxelBuilder();
    sackInto(s, -0.3, 0.0, C.sack, 0.9, 0.2, C.clayRaw); sackInto(s, 0.15, -0.1, C.sackD, 0.95, -0.2); sackInto(s, 0.1, 0.32, C.sack, 0.85, 0.5);
    room.place(piece(s, { w: 0.9, d: 0.8 }, 'claySacks'), 3.2, 2.6);
    const b = new VoxelBuilder();
    cyl(b, 0, 0.13, 0, 0.16, 0.13, 0.26, C.tin, 8); cyl(b, 0, 0.27, 0, 0.13, 0.13, 0.02, C.tinD, 8); // upturned bucket (Maya's mug spot)
    room.place(piece(b, { w: 0.34, d: 0.34 }, 'bucket'), 0.9, 2.75);
    const wb = new VoxelBuilder();
    cyl(wb, 0, 0.15, 0, 0.15, 0.13, 0.3, '#7FA3B8', 8); cyl(wb, 0, 0.28, 0, 0.13, 0.13, 0.01, '#9CC3DE', 8); rb(wb, 0, 0.36, 0, 0.3, 0.02, 0.02, C.iron, 0, 0, 0);
    wb.box(0.05, 0.3, 0.05, 0.1, 0.05, 0.08, '#E2C36A');
    room.place(piece(wb, { w: 0.34, d: 0.34 }, 'waterBucket'), 2.45, 0.95);
    const fw = new VoxelBuilder();
    for (let k = 0; k < 3; k++) for (let i = 0; i < 5 - k; i++) cyl(fw, -0.3 + i * 0.14 + k * 0.07, 0.07 + k * 0.12, 0, 0.065, 0.065, 0.7, jitter('#8C6A44', 0.12, i + k * 5), 6, Math.PI / 2);
    room.place(piece(fw, { w: 0.75, d: 0.72 }, 'firewood'), -3.0, 2.4, Math.PI / 2);
  }
  // tool pegs on the right wall: ribs, a cutting wire, a needle, sponges
  S.box(3.96, 1.5, -1.0, 0.06, 0.08, 1.0, C.woodD);
  for (let i = 0; i < 5; i++) S.box(3.9, 1.52, -1.4 + i * 0.2, 0.08, 0.03, 0.03, C.woodXD);
  rb(S, 3.92, 1.36, -1.4, 0.02, 0.22, 0.09, C.woodL, 0.2, 0, 0); rb(S, 3.92, 1.34, -1.2, 0.02, 0.18, 0.12, '#B98F5C', -0.1, 0, 0);
  S.box(3.93, 1.3, -1.0, 0.012, 0.36, 0.012, C.tinD); S.box(3.92, 1.12, -1.0, 0.03, 0.04, 0.1, C.woodD);
  S.box(3.93, 1.38, -0.8, 0.01, 0.2, 0.01, C.tinL); S.box(3.92, 1.36, -0.6, 0.06, 0.1, 0.08, '#E2C36A');
  // a ware board on the right wall with raw pots drying
  S.boxMin(3.6, 1.55, -2.9, 4.0, 1.59, -1.7, C.woodD);
  for (const z of [-2.75, -1.85]) S.box(3.85, 1.48, z, 0.25, 0.12, 0.04, C.woodD);
  for (let i = 0; i < 4; i++) potInto(S, 3.78, 1.59, -2.7 + i * 0.3, 0.55, 'raw');
  // a hanging oil lamp on a wall bracket
  S.boxMin(-4, 2.55, -2.35, -2.95, 2.6, -2.25, C.woodD);
  hangingLamp(st, -3.05, 2.2, -2.3, 0.35);
  {
    // (no worn-path band: on this flat earth floor every flat shape gets the shared outline, so a band
    //  read as a plank and overlapping discs read as fish scales; splatter and dust patches carry the wear)
    // lighter patches of dried clay dust here and there
    for (const [x, z, w, d] of [[-0.6, -2.3, 0.9, 0.5], [2.6, -0.4, 0.7, 0.6], [-2.2, 0.5, 0.6, 0.5], [0.9, 1.2, 0.5, 0.4]]) rb(S, x, 0.0064, z, w, 0.002, d, '#D8BE96', 0, x * 0.7, 0);
    // a drying plank on bricks with raw pots, a straw basket, a kick stool
    const v = new VoxelBuilder();
    for (const x of [-0.55, 0.55]) v.box(x, 0.06, 0, 0.2, 0.12, 0.28, C.terraD);
    v.boxMin(-0.75, 0.12, -0.16, 0.75, 0.16, 0.16, jitter(C.wood, 0.05, 8));
    for (let i = 0; i < 5; i++) potInto(v, -0.6 + i * 0.3, 0.16, 0, 0.55, 'raw');
    room.place(piece(v, { w: 1.5, d: 0.32 }, 'dryingPlank'), -1.7, 2.45);
    const b = new VoxelBuilder();
    cyl(b, 0, 0.16, 0, 0.26, 0.2, 0.32, '#C9A26A', 8);
    for (let k = 0; k < 3; k++) cyl(b, 0, 0.06 + k * 0.1, 0, 0.21 + k * 0.02, 0.21 + k * 0.02, 0.025, '#A9824F', 8);
    for (let i = 0; i < 9; i++) rb(b, Math.cos(i) * 0.12, 0.34, Math.sin(i * 1.7) * 0.12, 0.3, 0.02, 0.03, i % 2 ? '#E2C36A' : '#D4B058', 0.2, i * 0.7, 0.1);
    room.place(piece(b, { w: 0.5, d: 0.5 }, 'strawBasket'), 2.2, 1.95);
  }
  wallClock(st, 'left', -1.0, 2.2, 0.18);
  // --- the kiln's firing mouth in the east (right) wall: a brick arch with a glowing slot, an iron door
  //     leaning beside it, soot up the wall, spare bricks; and the ware shelf under its tin eave
  {
    const v = new VoxelBuilder();
    const z0 = -0.05, z1 = 1.25, x0 = 3.42;
    const r = rand(31);
    for (let row = 0; row < 9; row++) {
      const y = row * 0.15, off = row % 2 ? 0.13 : 0;
      for (let z = z0 - off; z < z1 - 0.02; z += 0.26) {
        const a = Math.max(z, z0), b = Math.min(z + 0.25, z1);
        if (b - a < 0.05) continue;
        const inMouth = row >= 1 && row <= 4 && a > z0 + 0.32 && b < z1 - 0.32;
        if (inMouth) continue;
        v.boxMin(x0, y, a, 4.0, y + 0.14, b, jitter(row > 6 ? '#8E4A2C' : C.terraD, 0.1, r() * 50));
      }
    }
    v.boxMin(x0 - 0.04, 1.35, z0 - 0.04, 4.0, 1.42, z1 + 0.04, '#6E3A26'); // cap
    v.boxMin(x0 + 0.02, 0.15, z0 + 0.36, 4.0, 0.75, z1 - 0.36, C.soot); // the mouth
    v.boxMin(x0 - 0.01, 0.72, z0 + 0.3, x0 + 0.06, 0.8, z1 - 0.3, '#5A3020'); // lintel
    for (let i = 0; i < 5; i++) v.box(x0 + 0.25, 0.2 + (i % 2) * 0.06, z0 + 0.45 + i * 0.09, 0.4, 0.06, 0.07, '#4A3328'); // charred logs
    // the iron door leaning against the bricks, spare bricks stacked
    rb(v, x0 - 0.1, 0.32, z1 + 0.22, 0.04, 0.62, 0.5, C.iron, 0, 0, 0.12);
    v.box(x0 - 0.13, 0.36, z1 + 0.22, 0.03, 0.06, 0.18, '#6E6458');
    for (let k = 0; k < 3; k++) for (let i = 0; i < 2; i++) v.box(x0 - 0.3 + i * 0.13, 0.04 + k * 0.08, z0 - 0.25, 0.12, 0.07, 0.24, jitter(C.terra, 0.1, i + k * 2), k % 2 ? Math.PI / 2 : 0);
    room.place(piece(v, null, 'kilnMouth'), 0, 0);
    room.obstacles.push({ type: 'box', minX: x0 - 0.3, maxX: 4, minZ: z0 - 0.4, maxZ: z1 + 0.5 });
    // soot fanning up the wall above the mouth, embers glowing in the slot
    for (let i = 0; i < 4; i++) S.boxMin(3.985, 1.42 + i * 0.18, z0 + 0.2 + i * 0.08, 3.995, 1.6 + i * 0.18, z1 - 0.2 - i * 0.08, i % 2 ? '#7E6A5A' : '#6E5A4A');
    st.flame(x0 + 0.22, 0.22, (z0 + z1) / 2, 0.08, 0.04, 'ember');
    st.flame(x0 + 0.3, 0.2, (z0 + z1) / 2 - 0.15, 0.05, 0.03, 'ember');
    st.flame(x0 + 0.3, 0.2, (z0 + z1) / 2 + 0.17, 0.06, 0.03, 'ember');
    st.tap('ps-kiln', 2.8, 0.6, 0.6, { x: 3.7, z: 0.6 }, { my: 'မီးဖိုပေါက်', en: 'the kiln mouth' }); // DRAFT(my)
    // the ware shelf on the right wall gets a second board and a tin eave that shades it
    S.boxMin(3.55, 1.0, -2.95, 4.0, 1.04, -1.65, C.woodD);
    for (const z of [-2.85, -1.75]) S.box(3.85, 0.94, z, 0.25, 0.1, 0.04, C.woodD);
    for (let i = 0; i < 4; i++) potInto(S, 3.75, 1.04, -2.75 + i * 0.32, 0.5 + (i % 2) * 0.06, 'raw', (i % 2 ? 1 : -1) * 0.08);
    for (let i = 0; i < 9; i++) rb(S, 3.72, 2.06, -3.0 + i * 0.16, 0.6, 0.03, 0.15, i % 2 ? '#A9AFB2' : '#C2C8CA', 0, 0, -0.32);
    S.boxMin(3.42, 1.9, -3.05, 3.48, 1.98, -1.55, C.woodXD);
  }
  // --- drying rack along the left wall: two boards of raw pots out of the sun
  {
    const v = new VoxelBuilder();
    for (const x of [-0.62, 0.62]) for (const z of [-0.16, 0.16]) v.box(x, 0.45, z, 0.05, 0.9, 0.05, C.woodD);
    for (const y of [0.3, 0.75]) {
      v.boxMin(-0.68, y - 0.03, -0.18, 0.68, y, 0.18, jitter(C.wood, 0.06, y * 10));
      for (let i = 0; i < 5; i++) potInto(v, -0.52 + i * 0.26, y, 0, 0.42 + ((i + y * 10) % 3) * 0.04, 'raw');
    }
    room.place(piece(v, { w: 1.36, d: 0.36 }, 'dryingRack'), -3.25, -0.35, Math.PI / 2);
  }
  // --- the floor: clay splatter, a slick of water from the bucket to Mi Cho's wheel, trimmings
  {
    const r = rand(57);
    for (let i = 0; i < 30; i++) {
      const x = -3.4 + r() * 6.8, z = -2.6 + r() * 5.6, s = 0.03 + r() * 0.06;
      if (Math.abs(x) < 0.7 && z > 2.3) continue; // keep the doormat clean
      const col = r() < 0.55 ? '#9A714C' : '#8A6446';
      cyl(S, x, 0.0072 + i * 0.00002, z, s, s, 0.002, col, 7);
      if (r() < 0.6) cyl(S, x + s * 1.2, 0.0072, z + s * 0.4, s * 0.35, s * 0.35, 0.002, col, 6); // a drip beside it
    }
    // the puddle under the water bucket and its trail to the wheel
    const pts = [[2.45, 1.05, 0.5, 0.42], [2.2, 0.8, 0.34, 0.26], [2.0, 0.65, 0.26, 0.2], [1.85, 0.55, 0.2, 0.16]];
    for (const [x, z, w, d] of pts) v_puddle(x, z, w, d);
    function v_puddle(x, z, w, d) {
      const g = new VoxelBuilder();
      cyl(g, 0, 0, 0, 0.5, 0.5, 0.002, '#93A9AB', 12);
      cyl(g, -0.14, 0.0008, -0.12, 0.2, 0.2, 0.002, '#BBD0D2', 10);
      S.merge(g, M(x, 0.0084, z, 0, 0.5, 0, w, 1, d));
    }
    for (let i = 0; i < 6; i++) cyl(S, 2.72 + Math.cos(i * 2.1) * 0.24, 0.0094, 1.18 + Math.sin(i * 1.3) * 0.22, 0.03, 0.03, 0.002, '#93A9AB', 7);
    // curly trimmings round Daw Ohn's wheel
    for (let i = 0; i < 10; i++) { const a = i * 0.7; rb(S, -1.8 + Math.cos(a) * 0.62, 0.016, -0.6 + Math.sin(a) * 0.55, 0.07, 0.02, 0.02, C.clayL, 0, a, 0.4); }
  }

  // --- spots
  st.spot('dawohn', -1.8, -1.38, 0);
  st.spot('dawohnBench', 1.4, -2.42, 0);
  st.spot('micho', 1.6, -0.13, 0);
  st.spot('michoWedge', -2.75, 1.3, -Math.PI / 2);
  st.spot('michoDoor', -1.0, 2.5, Math.atan2(2.4, -4.9));
  st.spot('maya', 0.3, 1.6, Math.PI + 0.3);
  st.spot('mayaD3', 0.4, -1.2, Math.atan2(1.0, -1.2));
  st.spot('door', 0, 3.15, Math.PI);
  st.finish();
  return st.result({ id: 'pottershed', day });
}

// =============================================================================================
// tea rooms: quartertea (street 62) and bordertea (the south edge). One builder, two dressings
// (INDEX 13.2: "tea rooms share builders"); the Market / Junction / Hearth / Kiln tea rooms can
// reuse teaTable / teaCounter with their own layout tables.
// =============================================================================================
/** A low tea table with its stools and what is on it. seats: [[dx, dz, colour]], things(v) adds cups. */
function teaTable(st, x, z, { w = 0.62, d = 0.62, seats = [], seed = 1, top = C.woodL, things } = {}) {
  const v = lowTable({ w, d, top, seed });
  if (things) things(v, 0.45);
  else {
    thermos(v, -0.16, 0.45, -0.14, [C.red, '#2F5DB3', '#3E6B4F', C.mustard][seed % 4], 0.8);
    cyl(v, 0.12, 0.47, -0.12, 0.08, 0.08, 0.03, C.white, 8); // a plate of fritters
    for (let i = 0; i < 3; i++) v.box(0.1 + (i - 1) * 0.04, 0.5, -0.12 + (i % 2) * 0.03, 0.05, 0.03, 0.05, ['#E8A94A', '#D98A3A', '#F0C070'][i], i);
    teaGlass(v, 0.15, 0.45, 0.14, '#C79A68');
    cyl(v, -0.12, 0.47, 0.15, 0.03, 0.03, 0.04, '#E8E2D2', 8); // small cup of plain tea
  }
  room_place(st, piece(v, { w, d }, 'teaTable'), x, z);
  if (seats.length) {
    const s = new VoxelBuilder();
    for (const [dx, dz, col] of seats) stoolInto(s, dx, dz, col || C.maroon, 0.26, (dx + dz) * 0.4);
    room_place(st, piece(s, null, 'stools'), x, z, 0, false);
    for (const [dx, dz] of seats) st.room.obstacles.push({ type: 'circle', x: x + dx, z: z + dz, r: 0.2 });
  }
  S_shadow(st, x, z, w + 0.5, d + 0.5);
}
function room_place(st, obj, x, z, rot = 0, solid = true) { return st.room.place(obj, x, z, rot, { solid }); }
function S_shadow(st, x, z, w, d, col = null) { st.S.boxMin(x - w / 2, 0.0006, z - d / 2, x + w / 2, 0.0026, z + d / 2, col || st.floorShade); }

function buildTeaRoom(id, opts = {}) {
  const day = opts.day ?? (id === 'bordertea' ? 3 : 2);
  const border = id === 'bordertea';
  const st = border
    ? makeStage({ width: 7, depth: 6, height: 3, wall: '#BCD3D6', wainscot: '#6B4A30', trim: '#5A3D26', floor: 'tiles', floorColor: '#C98760', floorColor2: '#EADBC0' })
    : makeStage({ width: 7, depth: 6, height: 3, wall: '#F3EAD3', wainscot: '#6E9A7C', trim: '#8C6A3C', floor: 'tiles', floorColor: '#7FA88A', floorColor2: '#EFE6D0' });
  st.floorShade = border ? '#A86E4E' : '#5E8C70';
  const { room, S, hd, hw } = st;

  if (!border) {
    // ================= quartertea =================
    st.window({
      x: 2.2, y: 1.8, w: 1.1, h: 0.9, sunLen: 1.4,
      view: (g, w, h) => {
        const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#A9CBE6'); sky.addColorStop(1, '#F6E6CA');
        g.fillStyle = sky; g.fillRect(0, 0, w, h);
        g.fillStyle = '#6F9E5B'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(w * (0.1 + i * 0.28), h * 0.42, 26, 10, -0.7 + i * 0.4, 0, 7); g.fill(); }
        g.fillStyle = '#4F7F43'; g.fillRect(w * 0.12, h * 0.42, 5, h * 0.4);
        g.fillStyle = '#8EA4B0'; rr(g, w * 0.55, h * 0.45, w * 0.3, h * 0.35, 4, '#8EA4B0'); // a water tank
        g.fillStyle = '#6E8794'; g.fillRect(w * 0.55, h * 0.52, w * 0.3, 3); g.fillRect(w * 0.55, h * 0.64, w * 0.3, 3);
        g.fillStyle = '#E2CFA6'; g.fillRect(0, h * 0.8, w, h * 0.2);
      },
    });
    // two oil lamps on wall brackets (no beam across the room: from the dollhouse camera a beam at 2.9 m
    // hides the counter and the tea master behind it)
    S.boxMin(0.95, 2.55, -hd, 1.08, 2.6, -hd + 0.45, C.woodD); S.box(1.015, 2.42, -hd + 0.04, 0.05, 0.22, 0.05, C.woodXD);
    hangingLamp(st, 1.015, 2.2, -hd + 0.4, 0.35);
    S.boxMin(-hw, 2.55, 0.85, -hw + 0.45, 2.6, 0.98, C.woodD); S.box(-hw + 0.04, 2.42, 0.915, 0.05, 0.22, 0.05, C.woodXD);
    hangingLamp(st, -hw + 0.4, 2.2, 0.915, 0.35);

    // --- the boiler counter (INDEX: (-2.0, -2.2), parallel to the back wall). People are ~1.06 m tall
    //     (big heads), so a "real" 0.8 m counter left only the tea master's head showing: the counter is a
    //     low 0.52 m pouring bench (his shoulders 0.64 m) and the tall things (stove + kettle, urn) sit at
    //     its two ends, so he shows head to waist from the dollhouse camera.
    {
      const W = 2.0, D = 0.6, H = 0.52, CX = -2.0, CZ = -2.2;
      const toW = (lx, lz) => [CX + lx, CZ + lz];
      const v = new VoxelBuilder();
      v.boxMin(-W / 2, 0, -D / 2, W / 2, H - 0.05, D / 2, '#E9E4D6');
      for (let i = 0; i < 10; i++) for (let k = 0; k < 2; k++) v.boxMin(-W / 2 + 0.02 + i * 0.198, 0.1 + k * 0.17, D / 2, -W / 2 + 0.2 + i * 0.198, 0.25 + k * 0.17, D / 2 + 0.008, (i + k) % 2 ? '#F4F0E4' : '#E2EDE4');
      v.boxMin(-W / 2, 0.4, D / 2, W / 2, 0.45, D / 2 + 0.012, '#4F8A6A'); // green tile band
      v.boxMin(-W / 2, 0, D / 2 - 0.02, W / 2, 0.08, D / 2 + 0.02, '#4F6F55');
      v.boxMin(-W / 2 - 0.04, H - 0.05, -D / 2 - 0.04, W / 2 + 0.04, H, D / 2 + 0.05, '#8C8478'); // cement top
      clayStove(st, v, -0.7, H, -0.02, 0.9, toW);
      kettle(v, -0.7, H + 0.29, -0.02, 1.05, 0.4);
      const [sx, sz] = toW(-0.7, 0.05);
      st.steam(sx, H + 0.62, sz, 7);
      // the tea urn with its brass tap (toward the room), at the right end
      cyl(v, 0.72, H + 0.28, -0.04, 0.17, 0.17, 0.56, C.tin, 10);
      cyl(v, 0.72, H + 0.58, -0.04, 0.12, 0.17, 0.06, C.tinL, 10);
      cyl(v, 0.72, H + 0.64, -0.04, 0.03, 0.03, 0.05, C.ink, 6);
      for (const y of [0.12, 0.45]) cyl(v, 0.72, H + y, -0.04, 0.175, 0.175, 0.02, C.tinD, 10);
      v.box(0.72, H + 0.12, 0.16, 0.04, 0.04, 0.1, C.gold); v.box(0.72, H + 0.08, 0.2, 0.03, 0.06, 0.03, C.gold);
      // low things in the middle: glasses upside down on a tray, condensed-milk tins, a pouring jug
      v.boxMin(-0.05, H, -0.05, 0.42, H + 0.02, 0.24, C.tinL);
      for (let i = 0; i < 6; i++) cyl(v, 0.03 + (i % 3) * 0.14, H + 0.06, 0.03 + Math.floor(i / 3) * 0.14, 0.035, 0.03, 0.08, C.glass, 8);
      tinPile(v, -0.32, H, 0.12, 2, 0.85);
      cyl(v, 0.5, H + 0.07, 0.18, 0.05, 0.06, 0.14, C.tinL, 8); rb(v, 0.56, H + 0.1, 0.18, 0.05, 0.02, 0.02, C.tinD, 0, 0, 0.6);
      // the strainer bag on its pole behind the urn
      v.box(0.42, H + 0.4, -0.24, 0.03, 0.8, 0.03, C.woodD);
      v.box(0.5, H + 0.78, -0.24, 0.18, 0.03, 0.03, C.woodD);
      cyl(v, 0.58, H + 0.56, -0.24, 0.06, 0.02, 0.36, '#E9DFC6', 8);
      cyl(v, 0.58, H + 0.75, -0.24, 0.065, 0.065, 0.02, C.iron, 8);
      room.place(piece(v, { w: W, d: D }, 'boilerCounter'), CX, CZ);
      // a duckboard to stand on behind it
      for (let i = 0; i < 6; i++) S.boxMin(-3.0 + i * 0.34, 0.0, -2.96, -3.0 + i * 0.34 + 0.29, 0.03, -2.56, jitter(C.woodL, 0.06, i));
      // a crate of milk tins and a charcoal sack at the counter's left end
      const cr = new VoxelBuilder();
      cr.boxMin(-0.3, 0, -0.55, 0.3, 0.3, -0.11, C.woodL);
      for (let k = 0; k < 2; k++) cr.boxMin(-0.31, 0.06 + k * 0.14, -0.56, 0.31, 0.11 + k * 0.14, -0.55, C.woodD);
      tinPile(cr, 0, 0.3, -0.33, 3, 0.9);
      sackInto(cr, 0.02, 0.32, '#4A4440', 0.8, 0.3, C.soot);
      room.place(piece(cr, { w: 0.62, d: 1.2 }, 'tinCrate'), -2.95, -1.2, Math.PI / 2);
    }
    // a shelf behind the counter (above the tea master's head): thermos row, tea-leaf tins, cups
    S.boxMin(-3.3, 1.95, -hd, -1.15, 1.99, -hd + 0.26, C.woodD);
    for (const x of [-3.1, -1.35]) S.box(x, 1.89, -hd + 0.06, 0.05, 0.1, 0.2, C.woodXD);
    for (let i = 0; i < 6; i++) thermos(S, -3.1 + i * 0.2, 1.99, -hd + 0.14, [C.red, '#2F5DB3', '#3E6B4F', C.mustard, C.red, '#E8E2D2'][i], 0.75);
    for (let i = 0; i < 4; i++) { cyl(S, -1.95 + i * 0.2, 2.07, -hd + 0.14, 0.07, 0.07, 0.16, ['#C8323C', '#E2B33C', '#2F5DB3', '#6F9E5B'][i], 8); cyl(S, -1.95 + i * 0.2, 2.16, -hd + 0.14, 0.072, 0.072, 0.02, C.gold, 8); }
    S.boxMin(-3.3, 2.44, -hd, -1.6, 2.48, -hd + 0.22, C.woodD);
    for (let i = 0; i < 8; i++) cyl(S, -3.2 + i * 0.2, 2.52, -hd + 0.12, 0.04, 0.04, 0.07, i % 2 ? '#F6F0E2' : '#E8E2D2', 8);
    st.wallSign('back', -0.75, 2.4, 0.5, 0.4, (g, w, h) => drawCalendar(g, w, h, { month: 'တော်သလင်း', pic: 'hills', mark: 9, seed: 5 }), 240); // DRAFT(my): month name
    st.tap('qt-counter', -1.6, -1.35, 0.6, { x: -2.0, z: -2.2 }, { my: 'လက်ဖက်ရည် ကောင်တာ', en: 'the tea counter' }); // DRAFT(my)

    // --- the glass snack cabinet
    {
      const v = new VoxelBuilder();
      const W = 0.9, D = 0.5;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * (W / 2 - 0.03), 0.3, sz * (D / 2 - 0.03), 0.05, 0.6, 0.05, C.maroon);
      v.boxMin(-W / 2, 0.55, -D / 2, W / 2, 0.6, D / 2, C.maroon);
      v.boxMin(-W / 2 + 0.03, 0.6, -D / 2 + 0.03, W / 2 - 0.03, 1.22, D / 2 - 0.03, '#D7E6EA');
      for (const sx of [-1, 1]) v.boxMin(sx * W / 2 - 0.03, 0.6, D / 2 - 0.04, sx * W / 2 + 0.03, 1.22, D / 2 + 0.005, C.maroon);
      v.boxMin(-W / 2, 1.22, -D / 2, W / 2, 1.28, D / 2, C.maroon);
      v.boxMin(-W / 2 + 0.05, 0.9, -D / 2 + 0.05, W / 2 - 0.05, 0.92, D / 2 - 0.02, '#BFD3DA');
      for (let i = 0; i < 7; i++) rb(v, -0.32 + i * 0.1, 0.64, 0.02 + (i % 2) * 0.06, 0.06, 0.04, 0.26, ['#E8A94A', '#D98A3A'][i % 2], 0, 0.15 * (i - 3), 0); // fried dough sticks
      for (let i = 0; i < 6; i++) { const x = -0.3 + i * 0.12; rb(v, x, 0.95, 0.05, 0.1, 0.04, 0.1, '#E2B062', 0, Math.PI / 4, 0); rb(v, x, 0.985, 0.05, 0.07, 0.03, 0.07, '#D59A4C', 0, Math.PI / 4, 0); } // samosas
      v.box(-0.42, 1.08, D / 2 - 0.035, 0.012, 0.25, 0.02, C.white); // glass glint
      for (let i = 0; i < 3; i++) cyl(v, -0.25 + i * 0.25, 1.3, 0, 0.11, 0.11, 0.02, C.white, 8);
      room.place(piece(v, { w: W, d: D }, 'snackCabinet'), 0.3, -2.5);
      st.tap('qt-cabinet', 0.3, -1.8, 0.6, { x: 0.3, z: -2.5 }, { my: 'မုန့်ဗီရို', en: 'the snack cabinet' }); // DRAFT(my)
    }
    st.wallSign('back', 0.3, 2.25, 1.2, 0.56, (g, w, h) => {
      rr(g, 3, 3, w - 6, h - 6, 10, '#2F4F3A', C.gold, 5);
      const rows = [['လက်ဖက်ရည်', '၅၀၀'], ['ကော်ဖီ', '၅၀၀'], ['အီကြာကွေး · စမူဆာ', '၃၀၀']]; // DRAFT(my)
      rows.forEach(([a, b], i) => { txt(g, a, w * 0.38, h * (0.24 + i * 0.27), 26, '#F7E7A6'); txt(g, b, w * 0.83, h * (0.24 + i * 0.27), 26, '#F4F1E8'); });
    }, 220);

    // --- right wall: radio shelf, wall clock, a mirror; left wall: a tin advertising sign, a coat peg
    S.boxMin(hw - 0.3, 1.3, -1.9, hw, 1.34, -1.2, C.woodD);
    for (const z of [-1.8, -1.3]) S.box(hw - 0.05, 1.25, z, 0.08, 0.1, 0.04, C.woodXD);
    {
      const v = new VoxelBuilder();
      v.boxMin(-0.22, 0, -0.1, 0.22, 0.2, 0.1, '#7A5434');
      v.boxMin(-0.2, 0.03, 0.1, 0.02, 0.17, 0.11, '#D9C29A');
      for (let i = 0; i < 6; i++) v.box(-0.09, 0.05 + i * 0.022, 0.112, 0.2, 0.006, 0.004, '#7A6A55');
      cyl(v, 0.12, 0.13, 0.1, 0.035, 0.035, 0.02, C.gold, 8, Math.PI / 2); cyl(v, 0.12, 0.06, 0.1, 0.025, 0.025, 0.02, C.ink, 8, Math.PI / 2);
      rb(v, 0.15, 0.36, -0.04, 0.008, 0.36, 0.008, C.tinL, 0, 0, -0.35);
      v.box(-0.2, 0.22, 0, 0.08, 0.04, 0.05, C.ink);
      S.merge(v, M(hw - 0.16, 1.34, -1.55, 0, -Math.PI / 2, 0));
    }
    st.wallSign('right', -2.4, 1.8, 0.45, 0.62, (g, w, h) => drawCalendar(g, w, h, { month: 'တော်သလင်း', pic: 'flowers', mark: 9, seed: 11 }), 260); // DRAFT(my)
    wallClock(st, 'right', -0.7, 2.25, 0.2);
    st.tap('qt-radio', 2.8, -1.55, 0.5, { x: 3.4, z: -1.55 }, { my: 'ရေဒီယို', en: 'the radio' }); // DRAFT(my)
    S.boxMin(-hw, 1.25, -0.95, -hw + 0.04, 2.15, -0.35, C.goldD);
    S.boxMin(-hw + 0.04, 1.3, -0.9, -hw + 0.05, 2.1, -0.4, '#C9DDE2'); // a mirror
    S.box(-hw + 0.055, 1.95, -0.75, 0.004, 0.08, 0.24, '#E8F2F4');
    st.wallSign('left', -1.9, 2.25, 0.6, 0.42, (g, w, h) => {
      rr(g, 2, 2, w - 4, h - 4, 8, '#E2B33C', C.maroon, 5);
      g.fillStyle = '#3E6B4F'; g.beginPath(); g.ellipse(w * 0.22, h * 0.52, 20, 30, 0.5, 0, 7); g.fill();
      txt(g, 'ရွှေရွက်', w * 0.62, h * 0.4, 30, C.maroon); // DRAFT(my)
      txt(g, 'လက်ဖက်ခြောက်', w * 0.62, h * 0.72, 18, C.ink, { weight: 600 }); // DRAFT(my)
    }, 220);
    S.box(-hw + 0.06, 1.12, 0.35, 0.08, 0.04, 0.04, C.gold);
    S.box(-hw + 0.08, 0.92, 0.35, 0.05, 0.36, 0.18, '#3D6FA8'); // a shopping bag on the peg

    // --- four low tables with tiny stools; Su Nwe's table with her books
    teaTable(st, -1.8, 0.3, { seed: 1, seats: [[0, 0.45, C.maroon], [-0.45, 0, C.mustard], [0.45, -0.05, '#2F5DB3']] });
    teaTable(st, 0.4, 0.9, { seed: 2, seats: [[0, 0.45, '#3E6B4F'], [0.45, 0, C.maroon], [-0.45, 0, C.mustard]] });
    teaTable(st, 2.2, -1.4, {
      seed: 3, seats: [[0, -0.48, '#2F5DB3'], [0.45, 0, C.maroon]],
      things: (v, T) => {
        // Su Nwe's open books, a pencil, a cup going cold
        rb(v, -0.08, T + 0.012, 0.0, 0.34, 0.016, 0.24, '#F6F1E4', 0, 0.15, 0);
        v.box(0.17, T + 0.03, -0.16, 0.22, 0.04, 0.16, '#3D6FA8', 0.3);
        rb(v, 0.05, T + 0.026, 0.1, 0.14, 0.012, 0.012, C.mustard, 0, 0.9, 0);
        teaGlass(v, -0.2, T, -0.18, '#B98A5E');
      },
    });
    st.sign(0.3, 0.2, M(2.12, 0.472, -1.4, -Math.PI / 2, 0, -0.15), (g, w, h) => { paperBg(g, w, h, '#F8F4E8', 70); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(w / 2 - 1, 0, 2, h); scribble(g, 8, 14, w / 2 - 16, 5, 12, '#3A4A7A', 71, 1.2); scribble(g, w / 2 + 8, 14, w / 2 - 16, 5, 12, '#3A4A7A', 72, 1.2); }, 300);
    teaTable(st, 1.9, 1.6, { seed: 4, seats: [[0.45, 0, '#2F5DB3'], [-0.45, 0.05, C.maroon]] });
    st.tap('qt-sunwe', 2.2, -0.8, 0.6, { x: 2.2, z: -1.4 }, { my: 'စုနွယ့် စားပွဲ', en: "Su Nwe's table" }); // DRAFT(my)
    // a broom and a dustpan by the door, a drinking-water pot
    rb(S, 3.3, 0.7, 2.6, 0.04, 1.3, 0.04, C.woodL, 0.1, 0, -0.15);
    rb(S, 3.38, 0.12, 2.62, 0.2, 0.24, 0.08, '#C9A26A', 0.1, 0, -0.15);
    room.place(waterPot(), -3.1, 2.4);

    // --- the ceiling fan (moving part)
    const fan = new THREE.Group();
    fan.position.set(-0.2, 3.0, 1.35); // over the front half: its blades hide only bare floor
    {
      const v = new VoxelBuilder();
      v.box(0, -0.2, 0, 0.03, 0.4, 0.03, '#EDE6D3');
      v.box(0, -0.01, 0, 0.12, 0.02, 0.12, '#D9CDB4');
      cyl(v, 0, -0.43, 0, 0.09, 0.11, 0.1, '#EDE6D3', 10);
      fan.add(v.mesh({ px: 1.3 }));
      const b = new VoxelBuilder();
      for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; rb(b, Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3, 0.48, 0.015, 0.11, '#D9CDB4', 0, -a, 0); rb(b, Math.cos(a) * 0.1, 0.01, Math.sin(a) * 0.1, 0.1, 0.02, 0.04, C.goldD, 0, -a, 0); }
      cyl(b, 0, -0.02, 0, 0.05, 0.05, 0.04, C.goldD, 8);
      const blades = b.mesh({ px: 1.3 });
      blades.position.y = -0.5;
      fan.add(blades);
      st.anims.push((dt) => { blades.rotation.y += dt * 4.2; });
    }
    st.spot('teamaster', -2.0, -2.76, 0.1);
    st.spot('sunwe', 2.2, -1.88, 0);
    st.spot('maya', 0.0, 1.9, Math.PI + 0.25);
    st.spot('mayaSeat', -1.8, 0.75, Math.PI);
    st.spot('drinker', 1.45, 1.65, 0.75); // half-turned on his stool so face and shirt read from the camera
    st.spot('drinker2', 0.85, 0.9, -0.8);
    st.spot('door', 0, 2.65, Math.PI);
    st.finish();
    room.group.add(fan);
    return st.result({ id, day });
  }

  // ================= bordertea =================
  // the tin roof's edge and rafters along the top of the back wall
  for (let x = -hw; x < hw; x += 0.18) { S.boxMin(x, 2.84, -hd - 0.1, x + 0.09, 2.92, -hd + 0.42, '#A9AFB2'); S.boxMin(x + 0.09, 2.88, -hd - 0.1, x + 0.18, 2.96, -hd + 0.42, '#C2C8CA'); }
  for (let x = -hw + 0.4; x < hw; x += 1.1) S.boxMin(x, 2.62, -hd, x + 0.12, 2.84, -hd + 0.55, C.woodXD);
  S.boxMin(-hw, 2.6, -hd + 0.42, hw, 2.68, -hd + 0.52, C.woodD);
  st.window({
    x: 1.9, y: 1.6, w: 1.6, h: 1.0, sunLen: 1.5, bars: 0, shutter: '#5E8FA8', shutterD: '#3F6A80', frame: '#5A3D26',
    view: (g, w, h) => {
      // the view south: the avenue running on past the border sign, trees, clouds
      const sky = g.createLinearGradient(0, 0, 0, h * 0.6); sky.addColorStop(0, '#9CC3DE'); sky.addColorStop(1, '#FBE6C8');
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      rr(g, w * 0.08, h * 0.12, w * 0.22, h * 0.09, 8, '#FFF8EE'); rr(g, w * 0.62, h * 0.2, w * 0.26, h * 0.1, 8, '#FFF8EE');
      rr(g, w * 0.7, h * 0.4, w * 0.3, h * 0.12, 10, '#FFF8EE'); rr(g, w * 0.0, h * 0.44, w * 0.2, h * 0.1, 10, '#FFF8EE');
      g.fillStyle = '#E8DCBE'; g.fillRect(0, h * 0.55, w, h * 0.45);
      g.fillStyle = '#C9A24A'; g.beginPath(); g.moveTo(w * 0.4, h); g.lineTo(w * 0.6, h); g.lineTo(w * 0.515, h * 0.55); g.lineTo(w * 0.485, h * 0.55); g.fill(); // the gold-ink road
      g.fillStyle = '#E8D9A8'; g.fillRect(w * 0.496, h * 0.6, w * 0.008, h * 0.4);
      for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const k = 0.3 + i * 0.22, x = w * (0.5 + s * (0.06 + k * 0.32)), y = h * (0.55 + k * 0.4); g.fillStyle = '#6F9E5B'; g.beginPath(); g.arc(x, y - 18 * k * 1.6, 13 * k * 1.6, 0, 7); g.fill(); g.fillStyle = '#7A5434'; g.fillRect(x - 2, y - 8 * k * 1.6, 4, 9 * k * 1.6); }
      g.fillStyle = '#7A5434'; g.fillRect(w * 0.66, h * 0.66, 4, h * 0.2); // the border sign
      rr(g, w * 0.6, h * 0.6, w * 0.16, h * 0.08, 3, C.maroon, C.gold, 2);
    },
  });
  st.motes(1.9, 0.3, -2.3, 1.4, 1.5, 1.0, 16);
  // --- the tea counter (INDEX: (-1.7, -1.9), parallel to the back wall; a low 0.52 m bench, below the
  //     keeper's shoulders, so she shows head to waist from the dollhouse camera): charcoal stove + kettle
  //     at the left end, biscuit jars at the right end, glasses in the middle
  {
    const W = 2.0, D = 0.6, H = 0.52, CX = -1.7, CZ = -1.9;
    const toW = (lx, lz) => [CX + lx, CZ + lz];
    const v = new VoxelBuilder();
    v.boxMin(-W / 2, 0, -D / 2, W / 2, H - 0.05, D / 2, C.woodD);
    for (let x = -W / 2 + 0.02; x < W / 2 - 0.05; x += 0.22) v.boxMin(x, 0.06, D / 2, x + 0.2, H - 0.1, D / 2 + 0.015, jitter('#8C6A44', 0.08, x * 9));
    v.boxMin(-W / 2 - 0.04, H - 0.05, -D / 2 - 0.04, W / 2 + 0.04, H, D / 2 + 0.05, jitter(C.teak, 0.04, 2));
    v.box(0, H - 0.14, D / 2 + 0.02, W - 0.1, 0.05, 0.01, '#5E8FA8');
    clayStove(st, v, -0.66, H, -0.04, 0.9, toW);
    kettle(v, -0.66, H + 0.29, -0.04, 1.0, 0.5);
    const [sx, sz] = toW(-0.66, 0.05);
    st.steam(sx, H + 0.6, sz, 6);
    [['#E8A94A', 0.38], ['#F0C070', 0.6], ['#C8323C', 0.82]].forEach(([c, x]) => glassJar(v, x - 0.06, H, -0.06, c, 1.2, C.tin));
    v.boxMin(-0.25, H, -0.12, 0.2, H + 0.02, 0.22, C.tinL);
    for (let i = 0; i < 6; i++) cyl(v, -0.18 + (i % 3) * 0.15, H + 0.05, -0.04 + Math.floor(i / 3) * 0.16, 0.035, 0.03, 0.08, C.glass, 8);
    room.place(piece(v, { w: W, d: D }, 'teaCounter'), CX, CZ);
    for (let i = 0; i < 6; i++) S.boxMin(-2.7 + i * 0.34, 0.0, -2.95, -2.7 + i * 0.34 + 0.29, 0.03, -2.3, jitter(C.woodL, 0.06, i + 4));
    st.tap('bt-counter', -1.3, -1.1, 0.7, { x: -1.7, z: -1.9 }, { my: 'လက်ဖက်ရည် ကောင်တာ', en: 'the tea counter' }); // DRAFT(my)
  }
  // thermos flasks on a shelf over the counter (above the keeper's head), a ladle rack
  S.boxMin(-2.8, 1.85, -hd, -0.6, 1.89, -hd + 0.26, C.woodD);
  for (const x of [-2.6, -0.8]) S.box(x, 1.79, -hd + 0.06, 0.05, 0.1, 0.2, C.woodXD);
  for (let i = 0; i < 8; i++) thermos(S, -2.6 + i * 0.26, 1.89, -hd + 0.14, [C.red, '#2F5DB3', '#3E6B4F', C.mustard][i % 4], 0.8);
  S.box(-3.2, 2.25, -hd + 0.04, 0.45, 0.04, 0.04, C.woodD);
  for (let i = 0; i < 3; i++) { S.box(-3.35 + i * 0.15, 2.13, -hd + 0.06, 0.015, 0.22, 0.015, C.tinD); cyl(S, -3.35 + i * 0.15, 2.0, -hd + 0.08, 0.04, 0.03, 0.05, C.tin, 8); }
  // --- the window table: Nay Chi's glass, the two notice copies
  teaTable(st, 1.9, -1.8, {
    w: 0.8, d: 0.6, seed: 5, seats: [[0.7, 0.2, '#5E8FA8'], [-0.7, 0.2, C.maroon]],
    things: (v, T) => { teaGlass(v, 0.25, T, -0.12, '#C79A68'); thermos(v, -0.3, T, -0.16, C.red, 0.75); },
  });
  for (const [x, r] of [[1.78, 0.25], [1.98, -0.12]]) st.sign(0.2, 0.27, M(x, 0.456 + (x > 1.9 ? 0.002 : 0), -1.72, -Math.PI / 2, 0, r), (g, w, h) => { paperBg(g, w, h, '#FBF6EA', 80 + r * 10); txt(g, 'အလုပ်ခေါ်', w / 2, 18, 15, C.maroon); scribble(g, 10, 40, w - 20, 6, 13, '#3A2E24', 81, 1.2); }, 300); // DRAFT(my)
  st.tap('bt-window', 1.9, -1.0, 0.7, { x: 1.9, z: -2.9 }, { my: 'ပြတင်းပေါက်', en: 'the window' }); // DRAFT(my)
  // --- two more tables; a sleeping cat on a stool at the second
  teaTable(st, -1.6, 0.6, { seed: 6, seats: [[0, 0.45, C.mustard], [-0.45, 0, '#5E8FA8'], [0.45, 0, C.maroon]] });
  teaTable(st, 1.8, 0.9, { seed: 7, seats: [[-0.45, 0, '#3E6B4F']] });
  {
    const s = new VoxelBuilder();
    stoolInto(s, 0, 0, C.maroon, 0.26, 0.2);
    room.place(piece(s, { w: 0.3, d: 0.3 }, 'catStool'), 2.3, 0.95);
    const cat = new THREE.Group();
    cat.position.set(2.3, 0.26, 0.95);
    cat.rotation.y = 0.4;
    cat.scale.setScalar(1.45); // reads at phone size
    const v = new VoxelBuilder();
    v.box(0, 0.07, 0, 0.26, 0.13, 0.2, '#D98A3A');
    v.box(-0.02, 0.11, 0, 0.18, 0.06, 0.14, '#E8A94A');
    for (let i = 0; i < 3; i++) v.box(-0.06 + i * 0.06, 0.135, 0, 0.025, 0.012, 0.16, '#B86E2A');
    v.box(0.13, 0.08, 0.05, 0.12, 0.1, 0.11, '#D98A3A');
    for (const s2 of [-1, 1]) v.box(0.15, 0.145, 0.05 + s2 * 0.035, 0.03, 0.04, 0.025, '#B86E2A');
    v.box(0.19, 0.085, 0.06, 0.012, 0.008, 0.07, '#3A2E24'); // closed eyes
    v.box(0.19, 0.06, 0.05, 0.03, 0.025, 0.04, '#F4E2C8');
    v.box(-0.02, 0.03, 0.1, 0.24, 0.04, 0.04, '#D98A3A', 0.25); v.box(0.1, 0.03, 0.12, 0.05, 0.035, 0.035, '#F4E2C8');
    const body = v.mesh({ px: 1.3 });
    cat.add(body);
    st.anims.push((dt, t) => { const k = 1 + Math.sin(t * 2.1) * 0.035; body.scale.set(1, k, 1 + (k - 1) * 0.5); });
    st.parts.cat = cat;
    st._cat = cat;
    st.tap('bt-cat', 2.3, 1.5, 0.5, { x: 2.3, z: 0.95 }, { my: 'အိပ်နေတဲ့ ကြောင်', en: 'the sleeping cat' }); // DRAFT(my)
  }
  // --- left wall: calendar and a tin sign; right wall: a shelf of condensed-milk tins
  st.wallSign('left', -0.75, 1.75, 0.45, 0.62, (g, w, h) => drawCalendar(g, w, h, { month: 'တော်သလင်း', pic: 'hills', mark: 13, seed: 13 }), 260); // DRAFT(my)
  st.wallSign('left', -1.85, 2.2, 0.62, 0.42, (g, w, h) => {
    rr(g, 2, 2, w - 4, h - 4, 6, '#C8323C', '#F4F1E8', 5);
    g.fillStyle = '#F4F1E8'; g.beginPath(); g.arc(w * 0.22, h * 0.5, 26, 0, 7); g.fill();
    g.fillStyle = '#2F5DB3'; g.fillRect(w * 0.22 - 14, h * 0.5 - 18, 28, 36);
    txt(g, 'နို့ဆီ', w * 0.64, h * 0.38, 30, '#F7E7A6'); // DRAFT(my)
    txt(g, 'ချိုချို', w * 0.64, h * 0.72, 22, '#F4F1E8'); // DRAFT(my)
  }, 220);
  S.box(-hw + 0.06, 2.45, -1.85, 0.04, 0.04, 0.04, C.iron);
  S.boxMin(hw - 0.3, 1.4, -1.6, hw, 1.44, -0.4, C.woodD);
  for (const z of [-1.5, -0.5]) S.box(hw - 0.05, 1.34, z, 0.08, 0.1, 0.04, C.woodXD);
  tinPile(S, hw - 0.15, 1.44, -1.25, 3, 0.9);
  tinPile(S, hw - 0.15, 1.44, -0.7, 2, 0.9);
  // a hanging lamp and a bunch of bananas from the rafter beam, a bench by the entrance
  hangingLamp(st, -0.2, 2.2, -hd + 0.48, 0.4);
  {
    S.box(0.6, 2.45, -hd + 0.48, 0.012, 0.3, 0.012, C.ink);
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; rb(S, 0.6 + Math.cos(a) * 0.07, 2.22 + (i % 3) * 0.05, -hd + 0.48 + Math.sin(a) * 0.07, 0.04, 0.17, 0.045, i % 2 ? '#E8C24A' : '#D9B03A', Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); }
    S.box(0.6, 2.33, -hd + 0.48, 0.04, 0.1, 0.04, '#7A9A4A');
  }
  {
    const b = new VoxelBuilder();
    b.boxMin(-0.2, 0.4, -0.7, 0.2, 0.45, 0.7, jitter(C.teak, 0.05, 4));
    for (const z of [-0.6, 0.6]) b.boxMin(-0.16, 0, z - 0.04, 0.16, 0.4, z + 0.04, C.woodD);
    b.box(0, 0.2, 0, 0.04, 0.04, 1.1, C.woodD);
    room.place(piece(b, { w: 0.4, d: 1.4 }, 'bench'), -3.0, 1.7);
  }
  rb(S, 3.3, 0.7, 2.5, 0.04, 1.3, 0.04, C.woodL, 0.1, 0, -0.15);
  rb(S, 3.38, 0.12, 2.52, 0.2, 0.24, 0.08, '#C9A26A', 0.1, 0, -0.15);
  // --- more life: a reed mat in the middle, a washing stand, bottle crates, a hanging bag, a poster,
  //     plants in milk tins on the window sill and a jar shelf under it, a basin by the bench
  {
    // the woven reed mat (flat, walkable)
    const mx = 0.1, mz = 0.3, mw = 1.8, md = 1.25;
    S.boxMin(mx - mw / 2, 0.0008, mz - md / 2, mx + mw / 2, 0.006, mz + md / 2, '#DCC28C');
    for (let i = 0; i < 12; i++) S.boxMin(mx - mw / 2 + 0.06, 0.006, mz - md / 2 + 0.08 + i * 0.093, mx + mw / 2 - 0.06, 0.008, mz - md / 2 + 0.115 + i * 0.093, i % 2 ? '#C6A66C' : '#E6CF9C');
    for (const s of [-1, 1]) {
      S.boxMin(mx - mw / 2, 0.006, mz + s * (md / 2 - 0.035) - 0.035, mx + mw / 2, 0.009, mz + s * (md / 2 - 0.035) + 0.035, C.maroon);
      S.boxMin(mx + s * (mw / 2 - 0.035) - 0.035, 0.006, mz - md / 2, mx + s * (mw / 2 - 0.035) + 0.035, 0.009, mz + md / 2, C.maroon);
    }
    // two floor cushions and a tin tray with a teapot on the mat
    for (const [x, z, c] of [[-0.35, 0.55, C.mustard], [0.55, 0.05, '#5E8FA8']]) { S.box(x, 0.05, z, 0.42, 0.09, 0.42, c, 0.2); S.box(x, 0.1, z, 0.3, 0.02, 0.3, jitter(c, 0.12, 3), 0.2); }
    cyl(S, 0.15, 0.02, 0.3, 0.22, 0.22, 0.02, C.tinL, 10);
    cyl(S, 0.12, 0.09, 0.28, 0.08, 0.07, 0.12, '#E8E2D2', 8); cyl(S, 0.12, 0.16, 0.28, 0.03, 0.05, 0.03, '#E8E2D2', 8); rb(S, 0.21, 0.1, 0.28, 0.08, 0.02, 0.02, '#E8E2D2', 0, 0, 0.6);
    for (const [x, z] of [[0.28, 0.18], [0.3, 0.42]]) cyl(S, x, 0.045, z, 0.03, 0.025, 0.045, '#F4F0E4', 8);
    // the washing stand: a tin basin of glasses on a low wooden stand, a bucket and a ladle beside it
    const ws = new VoxelBuilder();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) ws.box(sx * 0.24, 0.2, sz * 0.16, 0.05, 0.4, 0.05, C.woodD);
    ws.boxMin(-0.3, 0.38, -0.22, 0.3, 0.42, 0.22, C.wood);
    cyl(ws, 0, 0.48, 0, 0.26, 0.2, 0.12, C.tin, 10); cyl(ws, 0, 0.53, 0, 0.23, 0.23, 0.01, '#9CC3CF', 10);
    for (let i = 0; i < 4; i++) cyl(ws, -0.1 + (i % 2) * 0.17, 0.55, -0.06 + Math.floor(i / 2) * 0.13, 0.035, 0.03, 0.07, C.glass, 8, 0.4 * (i % 2 ? 1 : -1));
    cyl(ws, 0.45, 0.15, 0.05, 0.14, 0.12, 0.3, '#5E8FA8', 8); cyl(ws, 0.45, 0.29, 0.05, 0.12, 0.12, 0.01, '#9CC3CF', 8);
    rb(ws, 0.45, 0.4, 0.05, 0.02, 0.26, 0.02, C.tinD, 0.4, 0, 0);
    room.place(piece(ws, { w: 0.95, d: 0.45 }, 'washStand'), 0.3, -2.55);
    // two crates of empty soda bottles stacked against the left wall
    const cr = new VoxelBuilder();
    for (let k = 0; k < 2; k++) {
      const y = k * 0.3, col = k ? '#C8323C' : '#2F5DB3';
      cr.boxMin(-0.3, y, -0.22, 0.3, y + 0.26, 0.22, col);
      cr.boxMin(-0.27, y + 0.04, 0.22, 0.27, y + 0.1, 0.225, '#F4F1E8');
      for (let i = 0; i < 6; i++) { cyl(cr, -0.18 + (i % 3) * 0.18, y + 0.3, -0.08 + Math.floor(i / 3) * 0.16, 0.045, 0.05, 0.12, '#8FB0A0', 8); cyl(cr, -0.18 + (i % 3) * 0.18, y + 0.38, -0.08 + Math.floor(i / 3) * 0.16, 0.02, 0.03, 0.05, '#7FA090', 6); }
    }
    room.place(piece(cr, { w: 0.6, d: 0.44 }, 'bottleCrates'), -3.1, -0.55, Math.PI / 2);
    // a basin and a charcoal sack in the front-left corner, by the bench
    const fl = new VoxelBuilder();
    cyl(fl, 0, 0.07, 0, 0.3, 0.24, 0.14, C.tinL, 10); cyl(fl, 0, 0.13, 0, 0.27, 0.27, 0.01, '#A9C6CF', 10);
    sackInto(fl, 0.05, 0.62, '#4A4440', 0.85, -0.3, C.soot);
    room.place(piece(fl, { w: 0.6, d: 1.2 }, 'basinSack'), -2.95, 0.15 + 0.0, 0);
    // the shopping bag and a tin mug hanging from pegs on the left wall
    S.box(-hw + 0.06, 1.65, 0.75, 0.08, 0.04, 0.04, C.gold);
    S.box(-hw + 0.1, 1.38, 0.75, 0.06, 0.42, 0.3, '#C8323C'); S.box(-hw + 0.135, 1.42, 0.75, 0.01, 0.12, 0.18, C.mustard);
    rb(S, -hw + 0.1, 1.63, 0.68, 0.02, 0.14, 0.02, '#C8323C', 0.5, 0, 0); rb(S, -hw + 0.1, 1.63, 0.82, 0.02, 0.14, 0.02, '#C8323C', -0.5, 0, 0);
    S.box(-hw + 0.06, 1.65, 1.15, 0.06, 0.03, 0.03, C.iron);
    cyl(S, -hw + 0.1, 1.55, 1.15, 0.05, 0.045, 0.1, C.tinL, 8); S.box(-hw + 0.1, 1.55, 1.21, 0.02, 0.06, 0.02, C.tinD);
    // the window sill: plants in milk tins; a jar shelf under it
    for (let i = 0; i < 4; i++) {
      const x = 1.25 + i * 0.42;
      cyl(S, x, 1.04, -hd + 0.1, 0.05, 0.05, 0.1, C.tinL, 8); cyl(S, x, 1.04, -hd + 0.1, 0.051, 0.051, 0.05, ['#2F5DB3', '#C8323C', '#E2B33C', '#2F5DB3'][i], 8);
      S.box(x, 1.13, -hd + 0.1, 0.12, 0.07, 0.09, i % 2 ? C.leaf : C.leafD, i);
      S.box(x + 0.03, 1.18, -hd + 0.1, 0.07, 0.05, 0.06, C.leafL, i);
      if (i === 1) for (let k = 0; k < 3; k++) S.box(x - 0.03 + k * 0.03, 1.16 + (k % 2) * 0.03, -hd + 0.14, 0.025, 0.04, 0.025, C.red); // chillies
    }
    S.boxMin(1.05, 0.72, -hd, 2.75, 0.76, -hd + 0.24, C.woodD);
    for (const x of [1.15, 2.65]) S.box(x, 0.66, -hd + 0.05, 0.05, 0.1, 0.18, C.woodXD);
    [['#E8A94A', 1.3], ['#7A3A2A', 1.62], ['#F0C070', 2.1], ['#6F9E5B', 2.45]].forEach(([c, x]) => glassJar(S, x, 0.76, -hd + 0.12, c, 0.9, C.tin));
    // the free plain-tea poster on the back wall, hand painted
    st.wallSign('back', 0.15, 1.5, 0.5, 0.66, (g, w, h) => {
      paperBg(g, w, h, '#F7EBD0', 91);
      rr(g, 4, 4, w - 8, h - 8, 8, null, C.maroon, 4);
      g.fillStyle = '#3E6B4F'; g.beginPath(); g.ellipse(w * 0.5, h * 0.42, w * 0.2, h * 0.17, 0, 0, 7); g.fill(); // a teapot
      g.fillStyle = '#2F5543'; g.fillRect(w * 0.44, h * 0.21, w * 0.12, h * 0.06);
      g.strokeStyle = '#3E6B4F'; g.lineWidth = 6; g.beginPath(); g.moveTo(w * 0.68, h * 0.4); g.lineTo(w * 0.84, h * 0.3); g.stroke();
      g.strokeStyle = 'rgba(160,150,140,0.7)'; g.lineWidth = 3; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(w * (0.4 + i * 0.1), h * 0.18); g.quadraticCurveTo(w * (0.36 + i * 0.1), h * 0.1, w * (0.42 + i * 0.1), h * 0.04); g.stroke(); }
      txt(g, 'ရေနွေးကြမ်း', w / 2, h * 0.7, 19, C.maroon); // DRAFT(my): poster wording
      txt(g, 'အခမဲ့', w / 2, h * 0.84, 22, '#C8323C'); // DRAFT(my)
    }, 220);
    for (const [x, y] of [[-0.08, 1.82], [0.38, 1.82]]) S.box(x, y, -hd + 0.07, 0.035, 0.035, 0.02, C.red);
    // the front-right corner: the drinking-water pot on its stand, a stack of spare stools, two sacks of
    // tea leaves and a crate of charcoal, a string bag of limes hanging from a nail
    room.place(waterPot(), 3.1, 1.55);
    const fr = new VoxelBuilder();
    stoolInto(fr, 0, 0, C.maroon, 0.26, 0);
    const stools = piece(fr, { w: 0.34, d: 0.34 }, 'stoolStack');
    room.place(stools, 2.35, 2.55);
    // stacked stools: the same small stool, raised by its own height minus the nest
    {
      const sv = new VoxelBuilder();
      for (let k = 1; k < 4; k++) { const y = k * 0.09; sv.box(0, 0.24 + y, 0, 0.27, 0.04, 0.27, [C.maroon, '#5E8FA8', C.mustard, '#3E6B4F'][k], k * 0.25); sv.box(0, 0.21 + y, 0, 0.22, 0.03, 0.22, jitter([C.maroon, '#5E8FA8', C.mustard, '#3E6B4F'][k], 0.12, 3), k * 0.25); }
      S.merge(sv, M(2.35, 0, 2.55));
    }
    const sk = new VoxelBuilder();
    sackInto(sk, 0, 0, '#D8C49A', 1, 0.2, '#3E6B4F');
    sackInto(sk, 0.42, 0.1, '#CDB487', 0.9, -0.3, '#3E6B4F');
    sk.boxMin(-0.2, 0, 0.3, 0.3, 0.22, 0.6, C.woodL);
    for (let i = 0; i < 5; i++) sk.box(-0.12 + i * 0.1, 0.25, 0.45, 0.09, 0.07, 0.08, C.soot, i * 0.3);
    room.place(piece(sk, { w: 0.9, d: 0.75 }, 'teaSacks'), 3.2, 0.2);
    S.box(hw - 0.06, 1.75, 2.0, 0.06, 0.03, 0.03, C.iron);
    for (let i = 0; i < 7; i++) cyl(S, hw - 0.12 + (i % 2) * 0.04, 1.42 + (i % 3) * 0.08, 1.96 + (i % 4) * 0.05 - 0.07, 0.045, 0.045, 0.08, i % 2 ? '#8FBF4A' : '#A9CF5A', 8);
    S.box(hw - 0.1, 1.6, 2.0, 0.008, 0.28, 0.008, C.ink);
  }
  st.spot('keeper', -1.7, -2.58, -0.1);
  st.spot('naychi', 2.6, -1.6, -0.95); // half-turned toward the camera on her stool
  st.spot('mayaSeat', 1.2, -1.6, Math.PI / 2);
  st.spot('maya', 0.3, 1.8, Math.PI + 0.3);
  st.spot('door', 0, 2.65, Math.PI);
  st.finish();
  room.group.add(st._cat);
  return st.result({ id, day });
}

/** Unnamed walk-ons the rooms use (people.js specs): pupils, the tea master, the border keeper, a child. */
export const WALKONS = {
  pupil: { age: 'child', skin: 3, hair: 'short', top: 'school', bottom: 'schoolLongyi', seed: 3 },
  pupilGirl: { age: 'child', skin: 1, hair: 'braid', top: 'school', bottom: 'schoolSkirt', extras: ['thanaka'], seed: 5 },
  // more pupils: the uniform is fixed (white + green), so hair, skin, a satchel or a flower tell them apart
  pupil2: { age: 'child', skin: 1, hair: 'spiky', hairColor: 'brown', top: 'school', bottom: 'schoolLongyi', extras: ['satchel'], extraColor: 'padauk', seed: 7 },
  pupil3: { age: 'child', skin: 4, hair: 'side', top: 'school', bottom: 'schoolLongyi', extras: ['satchel'], extraColor: 'coral', seed: 9 },
  pupilGirl2: { age: 'child', skin: 2, hair: 'bob', hairColor: 'brown', top: 'school', bottom: 'schoolSkirt', extras: ['flower', 'thanaka'], extraColor: 'rose', seed: 11 },
  pupilGirl3: { age: 'child', skin: 0, hair: 'bun', top: 'school', bottom: 'schoolSkirt', extras: ['flower', 'satchel'], extraColor: 'sky', seed: 13 },
  teamaster: { age: 'adult', build: 'wide', skin: 3, hair: 'short', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'teal', check: true, extras: ['towel'], extraColor: 'tan' },
  keeper: { age: 'elder', build: 'mid', skin: 2, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'cream', bottom: 'htamein', bottomColor: 'brown', extras: ['apron', 'thanaka'] },
  child: { age: 'child', skin: 2, hair: 'bob', top: 'tee', topColor: 'rose', bottom: 'shorts', bottomColor: 'navy' },
  drinker: { age: 'adult', build: 'mid', skin: 4, hair: 'side', top: 'shirt', topColor: 'sky', bottom: 'longyi', bottomColor: 'maroon', check: true },
  drinker2: { age: 'elder', build: 'slim', skin: 2, hair: 'bald', hairColor: 'white', top: 'eingyi', topColor: 'white', bottom: 'longyi', bottomColor: 'brown' },
};

// =============================================================================================
// the rooms (ids from INDEX 13.1). build(opts) -> room; opts: { day, board, painted, load, beansInFlower }
// people(day) -> [[spot, castId | WALKONS key]] for a quick dressing (the story places its own).
// =============================================================================================
export const ROOMS = {
  classroom: {
    name: { my: 'စာသင်ခန်း', en: 'The classroom' }, // DRAFT(my)
    days: [2, 3, 4, 7, 14],
    build: buildClassroom,
    people(day = 2) {
      // a third element 'extra' marks walk-ons the story can drop to save draw calls (4 per person)
      if (day === 7) return [['yeyint', 'yeyint'], ['hninwai', 'hninwai'], ['naychi', 'naychi'], ['toetoe', 'toetoe'], ['micho', 'micho'], ['sunwe', 'sunwe'], ['maungnge', 'maungnge'], ['chorus1', 'pupil', 'extra'], ['chorus2', 'pupilGirl', 'extra']];
      if (day === 3) return [['hninwai', 'hninwai'], ['sunwe', 'sunwe'], ['maungngeHook', 'maungnge'], ['pupil1', 'pupil'], ['pupil2', 'pupilGirl2'], ['pupil3', 'pupil2', 'extra'], ['pupil4', 'pupilGirl', 'extra'], ['pupil5', 'pupil3'], ['pupil6', 'pupilGirl3', 'extra']];
      if (day >= 14) return [['hninwai', 'hninwai'], ['toetoe', 'toetoe']];
      return [['hninwaiBoard', 'hninwai'], ['toetoe', 'toetoe'], ['pupil1', 'pupilGirl'], ['pupil2', 'pupil2'], ['pupil3', 'pupilGirl2', 'extra'], ['pupil5', 'pupil3'], ['pupil6', 'pupilGirl3', 'extra']];
    },
  },
  snackshop: {
    name: { my: 'သစ္စာ မုန့်ဆိုင်', en: 'The honesty snack shop' }, // DRAFT(my)
    days: [2, 7],
    build: buildSnackshop,
    people(day = 2) { return day >= 7 ? [['naychi', 'naychi'], ['child', 'child']] : [['toetoe', 'toetoe']]; },
  },
  pottershed: {
    name: { my: 'ဒေါ်အုန်းရဲ့ အိုးတဲ', en: "Daw Ohn's shed" }, // DRAFT(my)
    days: [2, 3, 7],
    build: buildPottershed,
    people(day = 2) {
      if (day === 3) return [['dawohnBench', 'dawohn'], ['michoDoor', 'micho']];
      if (day >= 7) return [['dawohn', 'dawohn'], ['micho', 'micho']];
      return [['dawohn', 'dawohn'], ['michoWedge', 'micho']];
    },
  },
  quartertea: {
    name: { my: 'လက်ဖက်ရည်ဆိုင်', en: 'The Quarter tea shop' }, // DRAFT(my)
    days: [2, 3, 7, 14],
    build: (opts) => buildTeaRoom('quartertea', opts),
    people() { return [['teamaster', 'teamaster'], ['sunwe', 'sunwe'], ['drinker', 'drinker'], ['drinker2', 'drinker2']]; },
  },
  bordertea: {
    name: { my: 'နယ်နိမိတ်နား လက်ဖက်ရည်ဆိုင်', en: 'The tea shop by the border sign' }, // DRAFT(my)
    days: [3, 4, 7, 14],
    build: (opts) => buildTeaRoom('bordertea', opts),
    people() { return [['keeper', 'keeper'], ['naychi', 'naychi']]; },
  },
};
