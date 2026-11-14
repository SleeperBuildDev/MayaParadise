// Exercise-Book Quarter (Days 3 and 7) and Envelope Market (Days 4-6) outdoor props, plus the Market's
// 'letter' paper ground. Same kit as props2.js: vertex-coloured boxes merged with VoxelBuilder (one toon
// draw call + one outline per moving part), Maya's palette, round things as blocky prisms. Feet at
// y = 0, fronts face +Z. Every Burmese string here is a draft for Maya to proofread.
//
// Ground
//   letterGround(opts?)          { root, mesh, lanes, dispose }      the Market's unfolded letter (creases = lanes)
//   pageCrease({ w })            { root, dispose }                   raised paper fold across a road
// Quarter
//   parcelCart({ shelves })      { root, setParcels([{ picture, label? }]), setShelves(on), parcelAnchors, dispose }
//   markSheet({ flat, stack })   { root, setFlip(bool), dispose }
//   paperBoat({ torn })          { root, dispose }
//   jobNotice(text)              { root, setText(text), dispose }
//   storagePot()                 { root, dispose }
//   kilnSmoke({ height, tint })  { root, update(dt, t), setOn(0..1), dispose }   SMOKE_TINT: shared kiln/steam/brazier tints
//   stageClock({ post })         { root, setTime(h, m), dispose }
//   frontCurtain(w)              { root, setOpen(0..1), setKnot('hard' | 'bow'), dispose }
//   backdrop({ w, h })           { root, setPainted(0..1), setRolled(bool), dispose }
//   propBasket()                 { root, setItems(ids), dispose }
//   costumeQuill()               { root, dispose }
//   seatCard(text)               { root, setText(text), dispose }
//   programmePoster({ lang })    { root, setLang('my' | 'en'), setMargin(bool), dispose }
//   schoolBench() / benchStack(n){ root, benches, dispose }
//   brimBowl(full)               { root, setTilt(-1..1), setFull(0..1), dispose }
//   takeOneShelf()               { root, addBooks(n), setBooks(n), dispose }
//   schoolShelf()                { root, setBooks(n), setFull(bool), dispose }
// Market
//   stampAwning({ color, striped, door })  { root, dispose }
//   letterCounter({ flags })     { root, setFlag(n, up), flagAnchor(n, target), door, dispose }  (post office shell)
//   flagBoard({ flags })         { root, setFlag(n, up), flagAnchor(n, target), dispose }
//   kite()                       { root, setHeight(0..1), setSway(t), setAnchor(v3), dispose }
//   bambooPost()                 { root, tieAnchor, dispose }
//   paperPlane() / planeStack()  { root, fly(points, seconds) -> Promise, update(dt), dispose } / { root, dispose }
//   thanakaStall()               { root, dispose }
//   teaShop({ awning })          { root, setSteam(0..1), setAwning('plain' | 'stamp'), update(dt, t), door, dispose }
//   smallTeapot({ chipped })     { root, dispose }
//   streetPump()                 { root, setHandle(-1..1), setFlow(0..1), dispose }
//   freeFoodStall()              { root, door, dispose }  (free-food shop shell)
//   waterBowl()                  { root, setFull(0..1), dispose }
//   streetDog({ coat, old })     { root, update(dt, t), wake() -> Promise, drink(), sleep(), state, dispose }
//   mapStall() / envelopeCrates(){ root, update(dt, t), dispose } / { root, dispose }
//   bookCrate() riceSack() riceCart()  { root, dispose }
//   carvingBench({ cold })       { root, setGlow, setShavings, setBlock, setDust, update(dt, t), dispose }
//   stampBlock(design, nick)     { root, setPress(0..1), setNick(bool), dispose }
//   trialBlocks()                { root, dispose }
//   contestNotice()              { root, dispose }
//   teaLeafBasket() teaCup()     { root, dispose }
import * as THREE from '../game/three.js';
import { mergeGeometries } from '../game/three.js';
import { PALETTE, toon, basic, addOutline, blobShadow, fontsReady, FONT_MY, FONT_SERIF, roundRect, roundedBox, signTexture } from '../game/toon.js';
import { VoxelBuilder, jitter } from '../game/voxel.js';
import { chalkSlate } from './props2.js';

const C = {
  wood: PALETTE.wood, woodD: PALETTE.woodDark, woodL: '#CDA577', woodXL: '#DDBB8E', gold: PALETTE.gold, goldD: PALETTE.goldDeep,
  maroon: PALETTE.maroon, maroonD: PALETTE.maroonDeep, cream: PALETTE.cream, white: PALETTE.white, ink: PALETTE.ink,
  paper: PALETTE.paper, parch: PALETTE.parchment, leaf: PALETTE.leaf, leafD: PALETTE.leafDark, leafL: '#8DBA6E',
  terra: '#B5643C', terraL: '#CB7E4E', terraD: '#8E4A2C', brick: '#A0503A', brickD: '#7E3C2B', mortar: '#D9C3A6',
  iron: '#4A3B30', ironL: '#6A584A', soot: '#2B1E19', stone: '#A79C8C', stoneL: '#BDB3A3', stoneD: '#857A6C',
  kraft: '#C49A6C', kraftL: '#D3AD80', kraftD: '#A27A50', string: '#EFE6D2', rope: '#C9A97A', ropeD: '#A88A5C',
  news: '#E4DFD2', newsD: '#B7B1A4', wicker: '#C99A5B', wickerD: '#A97A40', wickerL: '#DDB57A',
  water: '#8FC1D6', waterD: '#6FA6BF', sky: '#BFD9EC', plaster: '#EADFC8', plasterD: '#D6C8AC', tile: '#9E4B36', tileD: '#7E3828',
  bamboo: '#C9B26A', bambooD: '#A08A45', bambooL: '#DCC98A', burlap: '#C2A577', burlapD: '#9F8558', thanaka: '#E8C77A',
  red: '#C8423C', green: '#4F8F5A', mustard: '#E2B33C', teal: '#3F8A86', blue: '#2F5DB3',
};

// ---------------------------------------------------------------------------------------------
// small builders (same idea as props2.js; props2 keeps its helpers private)
// ---------------------------------------------------------------------------------------------
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const MYN = '၀၁၂၃၄၅၆၇၈၉';
/** Burmese numerals for a number. */
export const myNum = (n) => String(n).replace(/\d/g, (d) => MYN[d]);

/** Box with any turn (Euler XYZ, radians) about its own centre. */
function boxR(v, x, y, z, w, h, d, col, rx = 0, ry = 0, rz = 0) {
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(w, h, d));
  v.add(UNIT, col, _m);
}
const prismCache = new Map();
function prismGeo(rTop, rBot, h, seg = 8) {
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
/** Flat-shaded prism by centre; axis along Y, optional turn (rx, ry, rz). */
function prism(v, x, y, z, rTop, rBot, h, col, seg = 8, rx = 0, ry = 0, rz = 0) {
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(1, 1, 1));
  v.add(prismGeo(rTop, rBot, h, seg), col, _m);
}
/** Prism lying along X (wheels on a Z axle use prismZ). */
const prismX = (v, x, y, z, r, len, col, seg = 8) => prism(v, x, y, z, r, r, len, col, seg, 0, 0, Math.PI / 2);
const prismZ = (v, x, y, z, r, len, col, seg = 8) => prism(v, x, y, z, r, r, len, col, seg, Math.PI / 2, 0, 0);
/** A ring of n boxes (a blocky torus) round the Y axis. */
function ring(v, x, y, z, r, n, w, h, col, ry0 = 0, seed = 0) {
  for (let i = 0; i < n; i++) {
    const a = ry0 + (i / n) * Math.PI * 2;
    boxR(v, x + Math.cos(a) * r, y, z + Math.sin(a) * r, w, h, (2 * Math.PI * r) / n + 0.004, seed ? jitter(col, 0.06, seed + i) : col, 0, -a, 0);
  }
}
/** A wheel in the XY plane (axle along Z): iron tyre, felloes, spokes, hub. */
function wheelZ(v, x, y, z, r, t = 0.05, { spokes = 6, wood = C.woodD, tyre = C.iron, hub = C.goldD } = {}) {
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const seg = (2 * Math.PI * r) / n + 0.01;
    boxR(v, x + Math.cos(a) * r, y + Math.sin(a) * r, z, 0.035, seg, t + 0.01, tyre, 0, 0, a);
    boxR(v, x + Math.cos(a) * (r - 0.04), y + Math.sin(a) * (r - 0.04), z, 0.05, seg * 0.9, t, jitter(wood, 0.06, i), 0, 0, a);
  }
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI;
    boxR(v, x, y, z, 0.03, 2 * (r - 0.05), t * 0.6, wood, 0, 0, a);
  }
  prismZ(v, x, y, z, 0.07, t + 0.04, wood, 8);
  prismZ(v, x, y, z + (z >= 0 ? 1 : -1) * (t / 2 + 0.03), 0.04, 0.03, hub, 8);
}

function shadowUnder(root, rx, rz, x = 0, z = 0, opacity = 0.5) {
  const s = blobShadow(rx, rz, opacity);
  s.position.x = x;
  s.position.z = z;
  root.add(s);
  return s;
}
/** Frees geometries (not shared ones), the listed textures/materials, and detaches root. */
function disposeTree(root, own = []) {
  const seen = new Set();
  root.traverse((o) => {
    if (o.geometry && !o.userData.sharedGeo && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); }
  });
  for (const x of own) x?.dispose?.();
  root.removeFromParent();
}
function freeMesh(m) {
  if (!m) return;
  m.geometry.dispose();
  for (const c of m.children) c.geometry?.dispose();
  m.removeFromParent();
}

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
// canvas helpers (Burmese text is drawn after fontsReady(); every canvas redraws once fonts land)
// ---------------------------------------------------------------------------------------------
function makeCanvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { cv, g: cv.getContext('2d'), tex };
}
/** Runs draw() now and again when the web fonts are in, flagging the texture each time. */
function live(tex, draw) {
  const run = () => { draw(); tex.needsUpdate = true; };
  run();
  fontsReady().then(run);
  return run;
}
/** Text that shrinks to fit maxW. */
function fitText(g, text, x, y, maxW, size, { weight = 700, font = FONT_MY, color = PALETTE.ink, align = 'center' } = {}) {
  g.font = `${weight} ${size}px ${font}`;
  const w = g.measureText(text).width;
  if (w > maxW) g.font = `${weight} ${size * (maxW / w)}px ${font}`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillText(text, x, y);
}
function grain(g, W, H, seed, n = 500, dark = 'rgba(120,100,70,0.08)', light = 'rgba(255,255,255,0.12)') {
  const r = rand(seed);
  for (let i = 0; i < n; i++) {
    g.fillStyle = r() < 0.5 ? dark : light;
    g.fillRect(r() * W, r() * H, 1 + r() * 2.5, 1 + r() * 2.5);
  }
}
/** Handwriting-like scribble line (wavy strokes with word gaps). */
function scribble(g, x0, y, x1, seed, { color = '#3A4E7A', width = 2, amp = 3 } = {}) {
  const r = rand(seed);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineCap = 'round';
  let x = x0;
  while (x < x1) {
    const len = 18 + r() * 46;
    const end = Math.min(x1, x + len);
    g.beginPath();
    g.moveTo(x, y);
    for (let xx = x; xx < end; xx += 4) g.lineTo(xx, y + Math.sin(xx * 0.55 + r() * 2) * amp - (r() < 0.12 ? amp * 1.6 : 0));
    g.stroke();
    x = end + 8 + r() * 10;
  }
}
/** Unlit picture plane (faces +Z) with its own material; dispose with the returned mesh. */
function picture(tex, w, h, opts = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h, opts.sx ?? 1, opts.sy ?? 1), basic(PALETTE.white, { map: tex, transparent: !!opts.transparent, alphaTest: opts.transparent ? 0.02 : 0 }));
  m.userData.ownMat = true;
  return m;
}
/** Disposes textures and per-mesh materials made with picture(). */
function disposePictures(root) {
  root.traverse((o) => { if (o.userData.ownMat) { o.material.map?.dispose(); o.material.dispose(); } });
}

/** Simple black line drawings for parcel labels and tags. kind: book scale jasmine pot duck fish cane rice letter plane */
// DRAFT Burmese (Maya to proofread): parcel-label words
const PIC_WORD = { book: 'စာအုပ်', scale: 'ချိန်ခွင်', jasmine: 'စံပယ်', pot: 'အိုး', duck: 'ဘဲ', fish: 'ငါး', cane: 'ကြိမ်', rice: 'ဆန်', letter: 'စာ', plane: 'လေယာဉ်' };
function drawPic(g, kind, cx, cy, s) {
  g.save();
  g.translate(cx, cy);
  g.scale(s / 100, s / 100);
  g.strokeStyle = '#1F1A16';
  g.fillStyle = '#1F1A16';
  g.lineWidth = 5;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const L = (pts, close) => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); if (close) g.closePath(); g.stroke(); };
  const O = (x, y, rx, ry = rx) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.stroke(); };
  switch (kind) {
    case 'book':
      L([0, -22, -38, -32, -38, 26, 0, 36, 38, 26, 38, -32, 0, -22, 0, 36]);
      for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) L([sx * 8, -10 + i * 12, sx * 30, -16 + i * 12]);
      break;
    case 'scale':
      L([0, -40, 0, -26]); L([-36, -26, 36, -26]);
      for (const sx of [-1, 1]) { L([sx * 36, -26, sx * 22, 14]); L([sx * 36, -26, sx * 50, 14]); g.beginPath(); g.arc(sx * 36, 14, 15, 0, Math.PI); g.stroke(); }
      L([-6, 40, 6, 40]); L([0, -26, 0, 40]);
      break;
    case 'jasmine':
      O(0, 0, 32);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const x = Math.cos(a) * 32, y = Math.sin(a) * 32;
        for (let k = 0; k < 5; k++) { const b = (k / 5) * Math.PI * 2; O(x + Math.cos(b) * 6, y + Math.sin(b) * 6, 3.5); }
      }
      L([0, 32, -8, 46]); L([0, 32, 8, 46]);
      break;
    case 'pot':
      g.beginPath(); g.moveTo(-14, -34); g.lineTo(14, -34); g.lineTo(10, -26); g.bezierCurveTo(46, -18, 44, 30, 18, 36); g.lineTo(-18, 36); g.bezierCurveTo(-44, 30, -46, -18, -10, -26); g.closePath(); g.stroke();
      L([-30, 0, 30, 0]);
      break;
    case 'duck':
      g.beginPath(); g.ellipse(4, 14, 34, 20, 0, 0, Math.PI * 2); g.stroke();
      O(-26, -16, 14); L([-40, -16, -54, -12, -40, -9]);
      g.beginPath(); g.arc(-29, -19, 2.5, 0, Math.PI * 2); g.fill();
      L([36, 6, 46, -4]); L([-2, 12, 18, 20]);
      L([-30, 46, 40, 46]);
      break;
    case 'fish':
      g.beginPath(); g.ellipse(-6, 0, 36, 18, 0, 0, Math.PI * 2); g.stroke();
      L([28, 0, 48, -18, 48, 18, 28, 0]);
      g.beginPath(); g.arc(-28, -4, 3, 0, Math.PI * 2); g.fill();
      L([-14, -14, -14, 14]); L([-4, 18, 4, 28, 10, 16]);
      break;
    case 'cane':
      for (const dx of [-12, 0, 12]) { L([dx - 10, 40, dx + 10, -40]); for (const t of [-20, 6, 30]) L([dx - 5 + t * 0.25 - 2, -t + 2, dx + 5 + t * 0.25 - 2, -t + 2]); }
      L([-22, 4, 22, 4]); L([-22, 10, 22, 10]);
      break;
    case 'rice':
      g.beginPath(); g.moveTo(-26, -24); g.lineTo(26, -24); g.lineTo(34, 36); g.lineTo(-34, 36); g.closePath(); g.stroke();
      L([-14, -24, -8, -36, 8, -36, 14, -24]);
      for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(-12 + i * 6, 8 - (i % 2) * 6, 3, 6, 0.4, 0, Math.PI * 2); g.stroke(); }
      break;
    case 'plane':
      L([-44, 8, 44, -18, -10, 28, -44, 8], true); L([44, -18, -12, 12, -10, 28]);
      break;
    default: // letter
      L([-40, -26, 40, -26, 40, 28, -40, 28], true); L([-40, -26, 0, 6, 40, -26]);
  }
  g.restore();
}

/** Plane geometry whose UVs map into one cell of a grid atlas (cols x rows), placed by a Matrix4. */
function cellQuad(w, h, cell, cols, rows, matrix) {
  const g = new THREE.PlaneGeometry(w, h);
  const cx = cell % cols, cy = Math.floor(cell / cols);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (cx + uv.getX(i)) / cols, 1 - (cy + 1 - uv.getY(i)) / rows);
  if (matrix) g.applyMatrix4(matrix);
  return g;
}

let hwMat = null;
/**
 * The shared handwriting texture: four rows of round Burmese-like letters (circles, open bowls, hooks,
 * tall loops, little tails) in faded blue-black ink, 10 m of writing per repeat. Abstract shapes, no words.
 */
function handwritingMaterial() {
  if (hwMat) return hwMat;
  const PW = 2048, PH = 640; // four rows of 160 px (0.8 m)
  const { g, tex } = makeCanvas(PW, PH);
  const r = rand(77);
  g.clearRect(0, 0, PW, PH);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const pxm = PW / 10; // pixels per metre along
  for (const row of [0, 1, 2, 3]) {
    const base = row * 160 + 120; // baseline (the blue rule sits at the strip's lower edge)
    let x = 10;
    while (x < PW - 40) {
      const n = 2 + Math.floor(r() * 5);
      const ink = r() < 0.18 ? 'rgba(92,72,120,0.6)' : 'rgba(52,70,112,0.64)';
      g.strokeStyle = ink;
      g.fillStyle = ink;
      g.lineWidth = 7 + r() * 2;
      for (let k = 0; k < n && x < PW - 40; k++) {
        const R = 16 + r() * 5; // letter radius: about 0.17 m tall letters
        const cx = x + R, cy = base - R - 2;
        const kind = r();
        g.beginPath();
        if (kind < 0.3) g.arc(cx, cy, R, 0, Math.PI * 2); // round letter
        else if (kind < 0.5) g.arc(cx, cy, R, Math.PI * 1.15, Math.PI * 3.85); // open at the top
        else if (kind < 0.68) g.arc(cx, cy, R, -Math.PI * 0.85, Math.PI * 0.85, true); // open at the bottom
        else if (kind < 0.82) { g.arc(cx, cy, R, Math.PI * 0.5, Math.PI * 2.3); g.lineTo(cx + R * 0.3, cy - R * 2.1); } // tall loop
        else { g.arc(cx - R * 0.45, cy, R * 0.6, 0, Math.PI * 2); g.moveTo(cx + R * 0.75, cy); g.arc(cx + R * 0.15, cy, R * 0.6, 0, Math.PI * 2); } // two small rings
        g.stroke();
        if (r() < 0.25) { g.beginPath(); g.arc(cx + R * 0.2, cy + R + 9, R * 0.45, Math.PI, Math.PI * 2.2); g.stroke(); } // tail below
        if (r() < 0.2) { g.beginPath(); g.arc(cx, cy - R - 9, 4, 0, Math.PI * 2); g.fill(); } // dot above
        if (r() < 0.15) { g.beginPath(); g.moveTo(cx - R, cy - R - 8); g.quadraticCurveTo(cx, cy - R - 20, cx + R, cy - R - 8); g.stroke(); } // sweep above
        x += R * 2 + 5 + r() * 4;
      }
      x += 0.22 * pxm + r() * 0.3 * pxm; // word gap
      if (r() < 0.04) { g.fillStyle = 'rgba(52,70,112,0.35)'; g.beginPath(); g.arc(x - 30, base - 40, 18, 0, Math.PI * 2); g.fill(); } // a blot
    }
  }
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  hwMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toon('#ffffff').gradientMap, map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  return hwMat;
}

// ---------------------------------------------------------------------------------------------
// GROUND: the Market's unfolded letter
// ---------------------------------------------------------------------------------------------
/**
 * The Envelope Market's paper: a whole letter unfolded flat, cream laid paper with faint blue rules,
 * a red margin, faded rows of handwriting, a date line and a signature flourish; its fold creases ARE
 * the lanes (a worn, slightly paler band with a fold line: a dark valley edge and a light ridge edge).
 * opts: { w = 60, d = 40, lanesX = [-12, 12] (north-south creases, x), lanesZ = [-8, 6] (east-west
 * creases, z), lane = 2.6 (lane width), seed = 4 }. Top surface at y = 0, centred on the origin.
 * Returns { root, mesh, lanes: { x, z, width }, dispose }. One draw call, no outline.
 */
export function letterGround({ w = 60, d = 40, lanesX = [-12, 12], lanesZ = [-8, 6], lane = 2.6, seed = 4 } = {}) {
  const root = new THREE.Group();
  root.name = 'letterGround';
  const v = new VoxelBuilder();
  const r = rand(seed);
  const W2 = w / 2, D2 = d / 2;
  const PAPER = '#F2EAD8', EDGE = '#D9CDB4', RULE = '#C7D3DE', INK = '#AEB9C8', INK2 = '#B9B2C6', MARGIN = '#E2A6A0';
  // the sheet: a thick edge (the page stands a little proud of the world) and a deckled rim
  v.boxMin(-W2, -0.12, -D2, W2, -0.004, D2, PAPER);
  v.boxMin(-W2, -0.4, -D2, W2, -0.12, D2, EDGE);
  for (let x = -W2; x < W2 - 0.01; x += 0.9) {
    const k = 0.04 + r() * 0.08;
    v.boxMin(x, -0.12, D2 - k, x + 0.9, -0.004, D2 + 0.02, jitter(PAPER, 0.03, x));
  }
  // laid lines: faint tone bands every 0.45 m across the whole sheet
  for (let z = -D2 + 0.2; z < D2; z += 0.45) v.boxMin(-W2, -0.0042, z, W2, -0.0035, z + 0.06, '#EEE5D1');
  const inLane = (x, z, pad = 0) => lanesX.some((lx) => Math.abs(x - lx) < lane / 2 + pad) || lanesZ.some((lz) => Math.abs(z - lz) < lane / 2 + pad);
  // blue rules every 1.3 m (east-west), broken where they cross the lanes
  const ruleZ = [];
  for (let z = -D2 + 2.2; z < D2 - 0.6; z += 1.3) ruleZ.push(z);
  const xCuts = [-W2, ...lanesX.flatMap((lx) => [lx - lane / 2, lx + lane / 2]), W2];
  for (const z of ruleZ) {
    if (lanesZ.some((lz) => Math.abs(z - lz) < lane / 2 + 0.05)) continue;
    for (let i = 0; i < xCuts.length; i += 2) v.boxMin(xCuts[i] + 0.1, -0.003, z - 0.025, xCuts[i + 1] - 0.1, 0.0, z + 0.025, RULE);
  }
  // red margin (north-south) near the west edge, double line
  const MX = -W2 + 3.2;
  for (const dx of [0, 0.16]) v.boxMin(MX + dx - 0.03, -0.003, -D2 + 0.4, MX + dx + 0.03, 0.0005, D2 - 0.4, MARGIN);
  // handwriting along the rules: strips of one shared canvas of round Burmese-like letters in faded blue
  // ink (abstract shapes, not words), cut where the creases run; one extra draw call for the whole sheet
  const hwParts = [];
  const HW_LEN = 10, HW_TALL = 0.8;
  for (const z of ruleZ) {
    if (lanesZ.some((lz) => Math.abs(z - lz) < lane / 2 + 0.7)) continue;
    const startX = MX + 0.5 + r() * 0.6, endX = W2 - 1.2 - r() * 5;
    const segs = [];
    let s0 = startX;
    for (const lx of lanesX.slice().sort((p, q) => p - q)) {
      if (lx + lane / 2 < startX || lx - lane / 2 > endX) continue;
      segs.push([s0, lx - lane / 2 - 0.35]);
      s0 = lx + lane / 2 + 0.35;
    }
    segs.push([s0, endX]);
    for (const [x0, x1] of segs) {
      if (x1 - x0 < 0.8) continue;
      const g = new THREE.PlaneGeometry(x1 - x0, HW_TALL);
      g.rotateX(-Math.PI / 2);
      g.translate((x0 + x1) / 2, 0.0025, z - HW_TALL / 2 + 0.1);
      const u0 = r(), u1 = u0 + (x1 - x0) / HW_LEN, row = Math.floor(r() * 4) * 0.25;
      const uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) ? u1 : u0, row + uv.getY(i) * 0.25);
      hwParts.push(g);
    }
  }
  // the date line (top right) and a signature flourish (bottom right)
  if (!inLane(W2 - 6, -D2 + 1.2)) {
    v.boxMin(W2 - 8.5, -0.002, -D2 + 1.0, W2 - 3.2, 0.001, -D2 + 1.14, INK);
    for (let i = 0; i < 4; i++) v.boxMin(W2 - 8.3 + i * 1.3, -0.002, -D2 + 0.8, W2 - 7.6 + i * 1.3, 0.001, -D2 + 0.98, INK);
  }
  for (let i = 0; i < 14; i++) {
    const a = i / 13;
    boxR(v, W2 - 9 + a * 6, -0.001, D2 - 2.2 - Math.sin(a * Math.PI * 2.2) * 0.5, 0.55, 0.002, 0.11, INK, 0, -Math.cos(a * Math.PI * 2.2) * 0.9, 0);
  }
  // the creases: a worn band (paler, the ink rubbed off) and the fold itself: the paper dips into a
  // valley, so one slope falls into shade in steps down to a dark crease line, with a bright ridge edge
  // and a cast shadow on the other side. Readable as a lane from the play camera.
  const fold = (horiz, c, from, to) => {
    const B = (a0, a1, b0, b1, y0, y1, col) => (horiz ? v.boxMin(a0, y0, b0, a1, y1, b1, col) : v.boxMin(b0, y0, a0, b1, y1, a1, col));
    const L2 = lane / 2;
    B(from, to, c - L2, c + L2, -0.004, 0.0012, '#F7F1E4'); // worn band
    B(from, to, c - L2 - 0.12, c - L2, -0.004, 0.0013, '#E6DAC1'); // band edges, scuffed darker
    B(from, to, c + L2, c + L2 + 0.12, -0.004, 0.0013, '#E9DEC7');
    // shaded slope (the -side), darkening toward the fold line
    B(from, to, c - 0.9, c - 0.45, -0.004, 0.0016, '#EADFC9');
    B(from, to, c - 0.45, c - 0.18, -0.004, 0.0018, '#DFD1B5');
    B(from, to, c - 0.18, c - 0.05, -0.004, 0.002, '#CDBC9A');
    B(from, to, c - 0.05, c + 0.01, -0.004, 0.0024, '#A8946F'); // the crease line
    B(from, to, c + 0.01, c + 0.06, -0.004, 0.0026, '#FFFCF4'); // ridge highlight
    B(from, to, c + 0.06, c + 0.32, -0.004, 0.0018, '#F2EADA'); // lit slope
    B(from, to, c + 0.32, c + 0.55, -0.004, 0.0016, '#EFE6D2'); // soft cast shadow at its foot
    for (let k = from + 1.5; k < to - 1; k += 3 + r() * 3) B(k, k + 0.6 + r(), c - 0.12, c - 0.06, -0.004, 0.0022, '#BFAE8C'); // fibre scuffs in the valley
  };
  for (const lx of lanesX) fold(false, lx, -D2, D2);
  for (const lz of lanesZ) fold(true, lz, -W2, W2);
  // where creases cross, the paper is worn thin: a pale square with a tiny tear
  for (const lx of lanesX) for (const lz of lanesZ) {
    v.boxMin(lx - 0.5, -0.004, lz - 0.5, lx + 0.5, 0.0034, lz + 0.5, '#FBF6EA');
    boxR(v, lx - 0.02, 0.0036, lz - 0.02, 0.06, 0.002, 1.0, '#B8A684', 0, 0, 0);
    boxR(v, lx - 0.02, 0.0037, lz - 0.02, 1.0, 0.002, 0.06, '#B8A684', 0, 0, 0);
    boxR(v, lx + 0.12, 0.0038, lz - 0.05, 0.3, 0.002, 0.04, '#A8946F', 0, 0.7, 0);
  }
  const mesh = v.mesh({ outline: false });
  mesh.name = 'letterPaper';
  mesh.receiveShadow = true;
  root.add(mesh);
  if (hwParts.length) {
    const geo = mergeGeometries(hwParts, false);
    for (const g of hwParts) g.dispose();
    const ink = new THREE.Mesh(geo, handwritingMaterial());
    ink.name = 'letterInk';
    ink.renderOrder = 1;
    root.add(ink);
  }
  return { root, mesh, lanes: { x: lanesX.slice(), z: lanesZ.slice(), width: lane }, dispose() { disposeTree(root); } };
}

/**
 * A raised paper fold across a road (where the envelope road meets the letter): a soft ridge 0.12 m
 * high running along X, the far slope in shade, frayed paper fibres along its foot and the ends
 * tapering into the ground. opts: { w = 6 (along X), depth = 0.9 (along Z), h = 0.12 }.
 */
export function pageCrease({ w = 6, depth = 0.9, h = 0.12 } = {}) {
  const root = new THREE.Group();
  root.name = 'pageCrease';
  const v = new VoxelBuilder();
  const r = rand(11);
  const n = Math.max(6, Math.round(w / 0.5));
  for (let i = 0; i < n; i++) {
    const x0 = -w / 2 + (i / n) * w, x1 = -w / 2 + ((i + 1) / n) * w;
    const mid = (x0 + x1) / 2;
    const taper = Math.min(1, (w / 2 - Math.abs(mid)) / 0.9);
    const hh = h * (0.35 + 0.65 * taper) * (0.94 + r() * 0.12);
    const half = depth / 2 * (0.6 + 0.4 * taper);
    const ang = Math.atan2(hh, half);
    const len = Math.hypot(hh, half) + 0.02;
    // near slope (lit) and far slope (shade), meeting at the ridge
    boxR(v, mid, hh / 2, half / 2, x1 - x0 + 0.005, 0.03, len, jitter('#F4ECDA', 0.02, i), ang, 0, 0);
    boxR(v, mid, hh / 2, -half / 2, x1 - x0 + 0.005, 0.03, len, jitter('#DCCFB4', 0.02, i + 50), -ang, 0, 0);
    v.box(mid, hh, 0, x1 - x0 + 0.005, 0.016, 0.03, '#FFFBF1');
    // fibres along the foot of the near slope
    if (r() < 0.7) boxR(v, mid + (r() - 0.5) * 0.3, 0.004, half + 0.04, 0.08 + r() * 0.1, 0.006, 0.02, '#E6DAC1', 0, (r() - 0.5) * 1.5, 0);
  }
  // a shadow strip behind the fold
  v.boxMin(-w / 2 + 0.4, 0.0005, -depth / 2 - 0.25, w / 2 - 0.4, 0.002, -depth / 2 + 0.05, '#D2C4A6');
  const mesh = v.mesh({ px: 1.2 });
  root.add(mesh);
  return { root, dispose() { disposeTree(root); } };
}

// =============================================================================================
// EXERCISE-BOOK QUARTER (Days 3, 6, 7)
// =============================================================================================

/** Newsprint paper boat into v: bow along X, length 0.16 * s. torn: a rip down the +X front side. */
function boatInto(v, x, y, z, s = 1, torn = false, ry = 0) {
  const P = new VoxelBuilder();
  const N = C.news, D = C.newsD;
  // hull sides (front +Z and back -Z): trapezoids stepping wider upward
  const rows = [[0.07, 0.012], [0.1, 0.012], [0.13, 0.012], [0.16, 0.01]];
  for (const sz of [-1, 1]) {
    rows.forEach(([len, h], i) => {
      const yy = 0.006 + i * 0.012;
      if (torn && sz > 0 && i >= 1) {
        // the rip: the right half of the front side is gone above the bottom row, a flap hangs out
        P.box(-len / 4, yy + h / 2, sz * 0.024, len / 2, h, 0.004, N);
      } else P.box(0, yy + h / 2, sz * 0.024, len, h, 0.004, N);
    });
    // printed text stripes on the sides
    for (let i = 0; i < 3; i++) P.box(-0.03 + i * 0.03, 0.03, sz * 0.0265, 0.022, 0.003, 0.001, D);
    P.box(0.0, 0.018, sz * 0.0265, 0.05, 0.003, 0.001, D);
  }
  P.box(0, 0.004, 0, 0.07, 0.008, 0.05, jitter(N, 0.03, 3)); // bottom
  // the middle sail: a triangle standing up from the centre, with a fold line
  [[0.07, 0.054], [0.052, 0.066], [0.034, 0.078], [0.016, 0.09]].forEach(([wd, yy]) => P.box(0, yy, 0, wd, 0.012, 0.012, N));
  P.box(0, 0.07, 0.0065, 0.002, 0.04, 0.001, D);
  P.box(-0.012, 0.062, 0.0065, 0.016, 0.003, 0.001, D);
  if (torn) {
    // the flap folded out, jagged edge, a scrap of headline showing
    boxR(P, 0.04, 0.026, 0.034, 0.05, 0.03, 0.003, N, -0.5, 0.2, 0.12);
    boxR(P, 0.042, 0.03, 0.037, 0.03, 0.004, 0.001, '#3A342C', -0.5, 0.2, 0.12);
    for (let i = 0; i < 3; i++) P.box(0.006 + i * 0.012, 0.024 + (i % 2) * 0.006, 0.024, 0.008, 0.008, 0.004, N);
    P.box(0.035, 0.013, 0.02, 0.05, 0.004, 0.006, '#9E978A'); // dark gap inside
  }
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(s, s, s));
  v.merge(P, _m);
}

/** Paper boat, 0.16 m newsprint. opts: { torn = false, scale = 1 }. */
export function paperBoat({ torn = false, scale = 1 } = {}) {
  const root = new THREE.Group();
  root.name = 'paperBoat';
  const v = new VoxelBuilder();
  boatInto(v, 0, 0, 0, scale, torn);
  root.add(v.mesh({ px: 1.1 }));
  return { root, dispose() { disposeTree(root); } };
}

/** Brown-paper parcel tied with string into v; returns its top y. Front label slot handled by caller. */
function parcelInto(v, x, y, z, w, h, d, seed = 0, ry = 0) {
  const P = new VoxelBuilder();
  const col = jitter(C.kraft, 0.06, seed);
  P.box(0, h / 2, 0, w, h, d, col);
  P.box(0, h - 0.004, 0, w * 0.96, 0.01, d * 0.96, jitter(C.kraftL, 0.04, seed + 1)); // folded top flap
  P.box(0, h + 0.002, d * 0.18, w * 0.9, 0.004, 0.012, C.kraftD); // flap edge
  P.box(0, 0.006, 0, w + 0.004, 0.012, d + 0.004, C.kraftD); // darker foot
  // string: a cross over the top and down every side, a bow on top
  P.box(0, h + 0.006, 0, 0.012, 0.008, d + 0.012, C.string);
  P.box(0, h + 0.006, 0, w + 0.012, 0.008, 0.012, C.string);
  for (const s of [-1, 1]) {
    P.box(s * (w / 2 + 0.004), h / 2, 0, 0.008, h, 0.012, C.string);
    P.box(0, h / 2, s * (d / 2 + 0.004), 0.012, h, 0.008, C.string);
  }
  boxR(P, -0.025, h + 0.018, 0, 0.04, 0.012, 0.025, C.string, 0, 0, 0.5);
  boxR(P, 0.025, h + 0.018, 0, 0.04, 0.012, 0.025, C.string, 0, 0, -0.5);
  boxR(P, 0.02, h + 0.008, 0.03, 0.01, 0.006, 0.05, C.string, 0, 0.5, 0);
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(1, 1, 1));
  v.merge(P, _m);
  return y + h;
}

/**
 * Maung Nge's two-wheeled parcel cart (1.2 x 0.6 m bed, 0.75 m handles to +X, parked level on a prop
 * leg): plank bed with stake rails, a rope coil, a side ledge on the front holding three newsprint
 * paper boats, and brown-paper parcels tied with string, each with a white label card on its front:
 * a black line drawing and, once read, the word under it.
 * setParcels([{ picture: 'book'|'scale'|'jasmine'|'pot'|'duck'|'fish'|'cane'|'rice'|'letter'|'plane',
 * label?: true|string }]) (up to 8). opts.shelves (Day 6): two shelf boards with word-and-picture tags
 * (opts.tags, default duck and fish). parcelAnchors: one Object3D per parcel (for taps).
 */
export function parcelCart({ shelves = false, tags = [{ picture: 'duck', label: true }, { picture: 'fish', label: true }], parcels = [{ picture: 'book' }, { picture: 'scale' }, { picture: 'jasmine' }, { picture: 'pot' }] } = {}) {
  const root = new THREE.Group();
  root.name = 'parcelCart';
  const v = new VoxelBuilder();
  const BY = 0.5, BT = 0.05; // bed underside, thickness
  const top = BY + BT;
  // bed planks along X with seams and nail heads
  for (let i = 0; i < 5; i++) {
    const z0 = -0.3 + i * 0.12;
    v.boxMin(-0.6, BY, z0 + 0.003, 0.6, top, z0 + 0.117, jitter(C.wood, 0.07, i + 1));
    for (const x of [-0.55, 0, 0.55]) v.box(x, top + 0.002, z0 + 0.06, 0.016, 0.004, 0.016, C.iron);
  }
  v.boxMin(-0.62, BY - 0.06, -0.26, 0.62, BY, -0.18, C.woodD); // bearers under the bed
  v.boxMin(-0.62, BY - 0.06, 0.18, 0.62, BY, 0.26, C.woodD);
  // stake rails along the back and the two ends, a low lip along the front
  for (let i = 0; i < 6; i++) v.box(-0.55 + i * 0.22, top + 0.1, -0.29, 0.04, 0.2, 0.03, C.woodD);
  v.boxMin(-0.6, top + 0.16, -0.31, 0.6, top + 0.21, -0.27, C.woodL);
  v.boxMin(-0.6, top + 0.06, -0.31, 0.6, top + 0.09, -0.27, C.woodL);
  for (const sx of [-1, 1]) {
    v.boxMin(sx * 0.6 - 0.02, top, -0.3, sx * 0.6 + 0.02, top + 0.21, 0.3, jitter(C.woodL, 0.05, sx + 4));
    v.box(sx * 0.6, top + 0.21, 0, 0.05, 0.02, 0.62, C.woodD);
  }
  v.boxMin(-0.6, top, 0.27, 0.6, top + 0.05, 0.31, C.woodL);
  // the side ledge on the front (+Z), on two brackets, three boats on it
  v.boxMin(-0.5, top - 0.06, 0.31, 0.3, top - 0.03, 0.45, C.woodL);
  v.boxMin(-0.5, top - 0.03, 0.43, 0.3, top + 0.0, 0.45, C.woodD);
  for (const x of [-0.42, 0.22]) boxR(v, x, top - 0.12, 0.36, 0.03, 0.14, 0.03, C.woodD, 0.6, 0, 0);
  boatInto(v, -0.38, top - 0.03, 0.38, 1, false, 0.15);
  boatInto(v, -0.15, top - 0.03, 0.38, 1, false, -0.1);
  boatInto(v, 0.1, top - 0.03, 0.38, 1, false, 0.25);
  // wheels on the Z axle under the middle, axle box
  for (const sz of [-1, 1]) wheelZ(v, -0.05, 0.31, sz * 0.38, 0.31, 0.05, { spokes: 5 });
  v.boxMin(-0.1, 0.27, -0.42, 0.0, 0.35, 0.42, C.iron);
  v.boxMin(-0.13, 0.35, -0.3, 0.03, BY - 0.06, -0.24, C.woodD);
  v.boxMin(-0.13, 0.35, 0.24, 0.03, BY - 0.06, 0.3, C.woodD);
  // handles to +X with a cross grip worn pale, a prop leg so it stands level
  for (const sz of [-1, 1]) {
    v.boxMin(0.6, BY - 0.04, sz * 0.22 - 0.025, 1.35, BY + 0.02, sz * 0.22 + 0.025, jitter(C.woodD, 0.05, sz));
    v.box(1.3, BY - 0.01, sz * 0.22, 0.1, 0.07, 0.065, C.woodXL);
    v.box(0.95, (BY - 0.04) / 2, sz * 0.22, 0.04, BY - 0.04, 0.04, C.woodD);
    v.box(0.95, 0.015, sz * 0.22, 0.08, 0.03, 0.08, C.iron);
  }
  v.boxMin(1.22, BY - 0.03, -0.25, 1.26, BY + 0.01, 0.25, C.woodD);
  // rope coil in the back corner
  ring(v, -0.43, top + 0.02, -0.15, 0.09, 10, 0.03, 0.026, C.rope, 0, 5);
  ring(v, -0.43, top + 0.045, -0.15, 0.075, 10, 0.028, 0.024, C.ropeD, 0.3, 9);
  boxR(v, -0.33, top + 0.012, -0.05, 0.16, 0.022, 0.025, C.rope, 0, -0.5, 0);
  const body = v.mesh();
  root.add(body);

  // shelves (Day 6): two boards on four uprights above the back half of the bed
  const sv = new VoxelBuilder();
  for (const x of [-0.56, 0.56]) for (const z of [-0.27, -0.06]) sv.box(x, top + 0.45, z, 0.04, 0.9, 0.04, C.woodD);
  for (const yy of [top + 0.42, top + 0.84]) {
    sv.boxMin(-0.6, yy, -0.3, 0.6, yy + 0.03, -0.04, jitter(C.woodL, 0.05, yy * 10));
    sv.boxMin(-0.6, yy - 0.03, -0.045, 0.6, yy + 0.03, -0.03, C.wood);
  }
  boxR(sv, 0, top + 0.6, -0.29, 1.15, 0.03, 0.02, C.woodD, 0, 0, 0.62);
  const shelfMesh = sv.mesh();
  root.add(shelfMesh);

  // label atlas: 8 x 2 cells of 128 px (parcels 0-7, shelf tags 8-15)
  const COLS = 8, ROWS = 2;
  const { cv, g, tex } = makeCanvas(COLS * 128, ROWS * 128);
  const labelMat = basic(PALETTE.white, { map: tex });
  let parcelMesh = null, labelMesh = null, cur = parcels.slice(0, 8), curTags = tags.slice(0, 4);
  const parcelAnchors = [];
  function drawCell(i, item) {
    const x = (i % COLS) * 128, y = Math.floor(i / COLS) * 128;
    g.clearRect(x, y, 128, 128);
    g.fillStyle = '#FBF8F0';
    g.fillRect(x + 2, y + 2, 124, 124);
    g.strokeStyle = '#C9BFA9';
    g.lineWidth = 3;
    g.strokeRect(x + 6, y + 6, 116, 116);
    if (!item) return;
    const word = item.label === true ? PIC_WORD[item.picture] ?? '' : item.label || '';
    drawPic(g, item.picture, x + 64, y + (word ? 50 : 64), word ? 70 : 92);
    if (word) fitText(g, word, x + 64, y + 104, 108, 26, { color: '#1F1A16' });
  }
  function drawAll() {
    g.clearRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < 8; i++) drawCell(i, cur[i]);
    for (let i = 0; i < 4; i++) drawCell(8 + i, curTags[i]);
  }
  const redraw = live(tex, drawAll);
  function build() {
    freeMesh(parcelMesh);
    labelMesh?.geometry.dispose();
    labelMesh?.removeFromParent();
    for (const a of parcelAnchors) a.removeFromParent();
    parcelAnchors.length = 0;
    const pv = new VoxelBuilder();
    const quads = [];
    const sizes = [[0.34, 0.2, 0.26], [0.3, 0.16, 0.24], [0.42, 0.22, 0.28], [0.32, 0.26, 0.24], [0.36, 0.18, 0.26], [0.3, 0.2, 0.22], [0.4, 0.16, 0.26], [0.32, 0.22, 0.24]];
    // spots: bed front row, then on the shelves (if shown) or stacked on the bed
    const bed = [[-0.36, top, 0.08], [0.02, top, 0.08], [0.38, top, 0.06], [-0.2, top, -0.14], [0.22, top, -0.14]];
    const shelf = [[-0.33, top + 0.45, -0.17], [0.0, top + 0.45, -0.17], [0.33, top + 0.45, -0.17], [-0.2, top + 0.87, -0.17], [0.2, top + 0.87, -0.17]];
    const spots = shelfMesh.visible ? [bed[0], bed[1], bed[2], ...shelf] : [...bed, [-0.3, top + 0.2, 0.08], [0.1, top + 0.16, 0.08], [0.0, top + 0.22, -0.14]];
    cur.forEach((item, i) => {
      if (!item || i >= spots.length) return;
      let [w, h, d] = sizes[i % sizes.length];
      if (shelfMesh.visible && i >= 3) { w *= 0.8; h = Math.min(h, 0.17); d = Math.min(d, 0.22); }
      let [x, y, z] = spots[i];
      if (!shelfMesh.visible && i >= 5) y = top + sizes[i - 5][1]; // stacked on the parcel below
      const ry = ((i * 37) % 7 - 3) * 0.03;
      parcelInto(pv, x, y, z, w, h, d, i * 3 + 1, ry);
      const lw = Math.min(0.13, w * 0.5, h * 0.75);
      _m.compose(_p.set(x + Math.sin(ry) * (d / 2 + 0.006), y + h * 0.5, z + Math.cos(ry) * (d / 2 + 0.006)), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(1, 1, 1));
      quads.push(cellQuad(lw, lw, i, COLS, ROWS, _m.clone()));
      pv.box(x + Math.sin(ry) * (d / 2 + 0.003), y + h * 0.5 + lw / 2 + 0.008, z + Math.cos(ry) * (d / 2 + 0.003), 0.012, 0.012, 0.006, C.red); // tack
      const a = new THREE.Object3D();
      a.position.set(x, y + h / 2, z);
      a.userData.parcel = i;
      root.add(a);
      parcelAnchors.push(a);
    });
    if (shelfMesh.visible) {
      curTags.forEach((t, k) => {
        if (!t || k > 3) return;
        const tx = k < 2 ? -0.3 + k * 0.6 : -0.3 + (k - 2) * 0.6, ty = k < 2 ? top + 0.415 : top + 0.835;
        _m.compose(_p.set(tx, ty - 0.055, -0.026), _q.identity(), _s.set(1, 1, 1));
        quads.push(cellQuad(0.1, 0.1, 8 + k, COLS, ROWS, _m.clone()));
        pv.box(tx, ty - 0.055, -0.032, 0.11, 0.11, 0.006, C.woodD);
      });
    }
    parcelMesh = pv.mesh({ px: 1.3 });
    root.add(parcelMesh);
    if (quads.length) {
      labelMesh = new THREE.Mesh(mergeGeometries(quads, false), labelMat);
      quads.forEach((q) => q.dispose());
      root.add(labelMesh);
    } else labelMesh = null;
  }
  function setShelves(on) { shelfMesh.visible = !!on; build(); }
  function setParcels(list) { cur = (list || []).slice(0, 8); redraw(); build(); }
  function setTags(list) { curTags = (list || []).slice(0, 4); redraw(); build(); }
  shelfMesh.visible = !!shelves;
  build();
  const shadow = shadowUnder(root, 0.95, 0.5, 0.25, 0, 0.45);
  return { root, setParcels, setShelves, setTags, parcelAnchors, dispose() { labelMat.dispose(); tex.dispose(); shadow.geometry.dispose(); disposeTree(root); } };
}

/**
 * The school mark sheet: 0.21 x 0.30 m white paper, blue rules, a red margin, a pupil's answers and a red
 * circled «၉၆». Hand prop, centred, facing +Z. setFlip(true) holds it upside down (Maung Nge).
 * opts: { flat = false (lying on a desk), stack = 0 (sheets under it) }.
 */
export function markSheet({ flat = false, stack = 0, mark = '၉၆' } = {}) {
  const root = new THREE.Group();
  root.name = 'markSheet';
  const holder = new THREE.Group();
  root.add(holder);
  const { g, tex } = makeCanvas(256, 366);
  live(tex, () => {
    g.fillStyle = '#FFFEFA';
    g.fillRect(0, 0, 256, 366);
    g.strokeStyle = '#9DB8D8';
    g.lineWidth = 1.5;
    for (let y = 70; y < 356; y += 18) { g.beginPath(); g.moveTo(10, y); g.lineTo(246, y); g.stroke(); }
    g.strokeStyle = '#E39A98';
    g.beginPath(); g.moveTo(34, 0); g.lineTo(34, 366); g.stroke();
    scribble(g, 44, 28, 150, 3, { color: '#2E3A5E', width: 2.4, amp: 3 }); // name
    for (let i = 0; i < 13; i++) {
      const y = 66 + i * 18 + 12;
      g.fillStyle = '#2E3A5E';
      g.font = `600 11px ${FONT_SANS_FALLBACK}`;
      if (i % 3 === 0) g.fillText(myNum(i / 3 + 1) + '။', 14, y);
      scribble(g, 44, y - 3, 200 + (i * 29) % 40, 20 + i, { color: '#2E3A5E', width: 1.6, amp: 2.4 });
      if (i % 3 === 1) { // a red tick at each answer
        g.strokeStyle = '#C8323C'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(218, y - 2); g.lineTo(226, y + 5); g.lineTo(240, y - 10); g.stroke();
      }
    }
    // the red circled mark
    g.strokeStyle = '#C8323C';
    g.lineWidth = 4;
    g.beginPath(); g.ellipse(204, 34, 40, 27, -0.12, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.ellipse(206, 33, 43, 24, -0.05, 0.2, 1.4); g.stroke();
    fitText(g, mark, 204, 36, 66, 34, { color: '#C8323C' });
  });
  const sheet = picture(tex, 0.21, 0.3);
  sheet.material.side = THREE.DoubleSide;
  holder.add(sheet);
  const v = new VoxelBuilder();
  v.box(0, 0, -0.0015, 0.212, 0.302, 0.002, '#F1ECE0');
  for (let i = 0; i < stack; i++) boxR(v, (i % 2 ? 0.004 : -0.003), 0, -0.003 - i * 0.002, 0.21, 0.3, 0.0018, i % 2 ? '#F4F0E4' : '#EAE4D6', 0, 0, (i % 3 - 1) * 0.03);
  const back = v.mesh({ px: 1.0 });
  holder.add(back);
  if (flat) { holder.rotation.x = -Math.PI / 2; holder.position.y = 0.002 * (stack + 1); }
  function setFlip(on) { holder.rotation.z = on ? Math.PI : 0; }
  return { root, setFlip, dispose() { disposePictures(root); disposeTree(root); } };
}
const FONT_SANS_FALLBACK = 'system-ui, sans-serif';

/**
 * A pinned job notice: A4 paper (0.21 x 0.297) with a red tack at the top, the lower edge curling
 * forward, Burmese ink text. Origin at the paper's centre, facing +Z (pin it on a post or board).
 * text: string (lines split by \n; the first line is the heading) or array of lines.
 */
// DRAFT Burmese (Maya to proofread): the job notice text
export function jobNotice(text = 'လူခေါ်နေပါသည်\nအိုးဖိုတွင် လက်ထောက် တစ်ဦး\nနံနက် ၇ နာရီမှ\nဒေါ်အုန်း ထံ မေးပါ') {
  const root = new THREE.Group();
  root.name = 'jobNotice';
  const { g, tex } = makeCanvas(300, 424);
  let cur = text;
  const draw = () => {
    const lines = Array.isArray(cur) ? cur : String(cur).split('\n');
    g.fillStyle = '#FBF7EC';
    g.fillRect(0, 0, 300, 424);
    grain(g, 300, 424, 9, 400);
    g.strokeStyle = 'rgba(120,90,50,0.25)';
    g.lineWidth = 2;
    g.strokeRect(14, 14, 272, 396);
    let y = 70;
    lines.forEach((l, i) => {
      const size = i === 0 ? 36 : 23;
      fitText(g, l, 150, y, 250, size, { color: i === 0 ? '#5A1822' : '#2A2118', weight: i === 0 ? 700 : 600 });
      if (i === 0) { g.fillStyle = '#5A1822'; g.fillRect(70, y + 30, 160, 3); y += 30; }
      y += size * 1.85;
    });
    // a little drawn pot and the date corner
    drawPic(g, 'pot', 240, 360, 40);
    scribble(g, 30, 372, 150, 4, { color: '#2A2118', width: 1.6, amp: 2 });
  };
  const run = live(tex, draw);
  // paper with a curled bottom: the lowest rows of the plane bend forward
  const sheet = picture(tex, 0.21, 0.297, { sy: 8 });
  const pos = sheet.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i), x = pos.getX(i);
    const u = clamp((-y - 0.06) / 0.09, 0, 1);
    pos.setZ(i, u * u * 0.05 * (1 + x * 2.5));
    pos.setY(i, y + u * u * 0.012);
  }
  sheet.geometry.computeVertexNormals();
  sheet.material.side = THREE.DoubleSide;
  sheet.position.z = 0.004;
  root.add(sheet);
  const v = new VoxelBuilder();
  prismZ(v, 0, 0.125, 0.01, 0.012, 0.01, C.red, 8);
  prismZ(v, 0, 0.125, 0.016, 0.006, 0.006, '#E8786E', 8);
  root.add(v.mesh({ px: 1.0 }));
  return { root, setText(t) { cur = t; run(); }, dispose() { disposePictures(root); disposeTree(root); } };
}

/**
 * Daw Ohn's storage pot: a thick-walled wide pot 0.5 m tall with a dark rim, and Mi Cho's small pot
 * (0.2 m) upside down on it as a lid.
 */
export function storagePot() {
  const root = new THREE.Group();
  root.name = 'storagePot';
  const v = new VoxelBuilder();
  const T = [[0.16, 0.04, C.terraD], [0.22, 0.06, '#9D5634'], [0.27, 0.09, C.terra], [0.29, 0.1, C.terraL], [0.28, 0.07, C.terra], [0.24, 0.05, '#A45C3C'], [0.2, 0.04, C.terraD], [0.23, 0.05, '#4A2A1C']];
  let y = 0;
  T.forEach(([r, h, col], i) => { prism(v, 0, y + h / 2, 0, r, i ? T[i - 1][0] * 0.98 + r * 0.02 : r, h, col, 12); y += h; });
  // thick dark rim: an outer roll and the inner wall
  prism(v, 0, y + 0.012, 0, 0.245, 0.245, 0.024, '#3B2218', 12);
  prism(v, 0, y + 0.026, 0, 0.17, 0.17, 0.006, C.soot, 12);
  // two incised bands and a thumb-pressed wave round the belly
  prism(v, 0, 0.24, 0, 0.293, 0.293, 0.014, '#8E4A2C', 12);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    v.box(Math.sin(a) * 0.292, 0.29 + (i % 2) * 0.02, Math.cos(a) * 0.292, 0.05, 0.016, 0.012, '#E8D4B4', a);
  }
  // Mi Cho's small pot, upside down: rim down on the big pot's mouth, foot up
  const top = y + 0.024;
  const S = [[0.085, 0.015, '#B9744C'], [0.07, 0.03, '#C98457'], [0.095, 0.06, '#D49364'], [0.08, 0.04, '#C98457'], [0.05, 0.02, '#A9653F']];
  let yy = top;
  for (const [r, h, col] of S) { prism(v, 0, yy + h / 2, 0, r, r, h, col, 8); yy += h; }
  prism(v, 0, top + 0.06, 0, 0.097, 0.097, 0.01, '#EBDCBF', 8);
  // a little cloth tie under the lid, a chip of straw
  for (const s of [-1, 1]) boxR(v, s * 0.18, top - 0.03, 0.12, 0.08, 0.02, 0.01, '#E6C88E', 0, s * 0.6, s * 0.8);
  root.add(v.mesh());
  const shadow = shadowUnder(root, 0.38, 0.38, 0, 0, 0.5);
  return { root, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

/**
 * Kiln smoke (fx): a thin grey column of soft blocky puffs rising and drifting with the wind, tall
 * enough to read from far away. One instanced draw call. opts: { height = 7, puffs = 22, wind = 0.6,
 * size = 1 }. update(dt, t) every frame; setOn(0..1) fades it (0 = gone). Origin at the chimney mouth.
 */
/**
 * Shared smoke tints: a warm grey that reads against the cream ground at the base, paling as it rises.
 * kiln: thick wood smoke; steam: the tea shop's lighter steam; brazier: the carver's thin coal smoke.
 */
export const SMOKE_TINT = {
  kiln: { base: '#8E8278', top: '#C2B8AD', alpha: 0.9 },
  steam: { base: '#A99F96', top: '#D6CEC5', alpha: 0.8 },
  brazier: { base: '#948A80', top: '#C9C0B6', alpha: 0.75 },
};
/** Toon material whose opacity is multiplied per instance by the `aAlpha` attribute (smoke fades with height). */
function smokeMaterial() {
  const m = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toon('#ffffff').gradientMap, transparent: true, depthWrite: false });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aAlpha;\nvarying float vAlpha;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAlpha = aAlpha;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vAlpha;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity * vAlpha );');
  };
  m.customProgramCacheKey = () => 'props3-smoke';
  return m;
}

/**
 * Kiln smoke (fx): a column of small soft blocky puffs that starts narrow and dark-ish warm grey at the
 * mouth, widens and pales as it rises, drifts with the wind and fades out by the top, so it reads as
 * smoke (not a solid statue) against the cream ground from far away. One instanced draw call, no outline.
 * opts: { height = 7, puffs (default about 6 per metre), wind = 0.6, size = 1, tint = SMOKE_TINT.kiln
 * (or { base, top, alpha }), speed }. update(dt, t) every frame; setOn(0..1) fades it (0 = gone).
 * Origin at the chimney mouth.
 */
export function kilnSmoke({ height = 7, puffs, wind = 0.6, size = 1, tint = SMOKE_TINT.kiln, speed = 0.06 } = {}) {
  const root = new THREE.Group();
  root.name = 'kilnSmoke';
  const T = typeof tint === 'string' ? SMOKE_TINT[tint] || SMOKE_TINT.kiln : tint;
  const N = puffs ?? Math.max(10, Math.round(height * 6 + 6));
  const geo = roundedBox(1, 1, 1, 0.3, 2);
  const alpha = new THREE.InstancedBufferAttribute(new Float32Array(N), 1);
  alpha.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aAlpha', alpha);
  const mat = smokeMaterial();
  const mesh = new THREE.InstancedMesh(geo, mat, N);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  const cBase = new THREE.Color(T.base), cTop = new THREE.Color(T.top), col = new THREE.Color();
  for (let i = 0; i < N; i++) mesh.setColorAt(i, col.copy(cBase));
  root.add(mesh);
  const dummy = new THREE.Object3D();
  let on = 1;
  const seeds = Array.from({ length: N }, (_, i) => [Math.sin(i * 12.9) * 0.5 + 0.5, Math.sin(i * 7.3) * 0.5 + 0.5, Math.sin(i * 3.1) * 0.5 + 0.5]);
  // puff width: narrow at the mouth, widest around two thirds up, never a solid block
  const W0 = 0.16 * size, W1 = 0.55 * size;
  function update(dt, t) {
    for (let i = 0; i < N; i++) {
      const ph = (t * speed + i / N + seeds[i][2] * 0.5 / N) % 1;
      const [a, b] = seeds[i];
      const fadeIn = smooth(ph / 0.06);
      const s = (W0 + (W1 - W0) * Math.sqrt(ph)) * (0.75 + a * 0.45) * fadeIn * (1 - 0.35 * smooth((ph - 0.75) / 0.25)) * (on > 0 ? 1 : 0);
      const spread = 0.05 + ph * 0.32 * size;
      dummy.position.set(
        ph * ph * wind * height * 0.45 + Math.sin(t * 0.8 + i * 2.3) * spread * (a - 0.5) * 2,
        ph * height,
        Math.sin(t * 0.6 + i * 1.7) * spread * (b - 0.5) * 1.6,
      );
      dummy.rotation.set(a * 3 + t * 0.2, b * 3 + t * 0.15, 0);
      dummy.scale.set(s, s * (0.8 + b * 0.25), s * (0.85 + a * 0.3));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, col.copy(cBase).lerp(cTop, smooth(ph * 1.2)));
      alpha.array[i] = T.alpha * on * fadeIn * Math.pow(1 - ph, 1.3);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    alpha.needsUpdate = true;
    mesh.visible = on > 0.01;
  }
  update(0, 0);
  return { root, update, setOn(x) { on = clamp(x, 0, 1); }, dispose() { geo.dispose(); mat.dispose(); mesh.dispose(); root.removeFromParent(); } };
}

/**
 * The stage clock: a round cream paper face 0.7 m across, maroon rim, Burmese hour numerals, black
 * hands, on a bracket. opts: { post = true (a 2.9 m wooden post; the clock at 2.3 m on its front) }.
 * setTime(h, m).
 */
export function stageClock({ post = true, height = 2.3 } = {}) {
  const root = new THREE.Group();
  root.name = 'stageClock';
  const v = new VoxelBuilder();
  const CZ = 0.16; // clock face plane in front of the post
  if (post) {
    v.box(0, 1.45, -0.06, 0.14, 2.9, 0.14, C.woodD);
    v.box(0, 0.08, -0.06, 0.2, 0.16, 0.2, C.stoneD);
    v.box(0, 2.92, -0.06, 0.18, 0.05, 0.18, C.gold);
  }
  // bracket: an arm out from the post with a curl brace, the clock hung below it
  v.box(0, height + 0.42, 0.04, 0.06, 0.06, 0.26, C.iron);
  boxR(v, 0, height + 0.32, 0.0, 0.03, 0.2, 0.03, C.iron, -0.7, 0, 0);
  v.box(0, height + 0.38, CZ - 0.04, 0.04, 0.06, 0.04, C.iron);
  // rim and back plate
  prismZ(v, 0, height, CZ - 0.04, 0.35, 0.06, C.maroon, 16);
  prismZ(v, 0, height, CZ - 0.075, 0.31, 0.02, C.maroonD, 16);
  for (let i = 0; i < 16; i++) { // gold beading round the rim
    const a = (i / 16) * Math.PI * 2 + Math.PI / 16;
    v.box(Math.cos(a) * 0.35, height + Math.sin(a) * 0.35, CZ - 0.01, 0.03, 0.03, 0.02, C.gold);
  }
  v.box(0, height + 0.36, CZ - 0.02, 0.08, 0.05, 0.05, C.gold); // top finial
  root.add(v.mesh());
  const { g, tex } = makeCanvas(512, 512);
  live(tex, () => {
    g.clearRect(0, 0, 512, 512);
    g.fillStyle = '#F7EFDC';
    g.beginPath(); g.arc(256, 256, 254, 0, Math.PI * 2); g.fill();
    grain(g, 512, 512, 5, 600);
    g.strokeStyle = '#C9A24A'; g.lineWidth = 6;
    g.beginPath(); g.arc(256, 256, 236, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const r0 = i % 5 ? 222 : 208;
      g.strokeStyle = i % 5 ? '#8C7A62' : '#4A141C';
      g.lineWidth = i % 5 ? 2 : 5;
      g.beginPath(); g.moveTo(256 + Math.sin(a) * r0, 256 - Math.cos(a) * r0); g.lineTo(256 + Math.sin(a) * 230, 256 - Math.cos(a) * 230); g.stroke();
    }
    for (let h = 1; h <= 12; h++) {
      const a = (h / 12) * Math.PI * 2;
      fitText(g, myNum(h), 256 + Math.sin(a) * 168, 262 - Math.cos(a) * 168, 70, 50, { color: '#3B2A1A' });
    }
    // Maya's four-point sparkle under the twelve
    g.fillStyle = '#C9A24A';
    g.beginPath(); g.moveTo(256, 118); g.lineTo(264, 140); g.lineTo(286, 148); g.lineTo(264, 156); g.lineTo(256, 178); g.lineTo(248, 156); g.lineTo(226, 148); g.lineTo(248, 140); g.closePath(); g.fill();
  });
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.315, 32), basic(PALETTE.white, { map: tex }));
  face.userData.ownMat = true;
  face.position.set(0, height, CZ - 0.008);
  root.add(face);
  const hand = (len, wid, col) => {
    const pivot = new THREE.Group();
    pivot.position.set(0, height, CZ);
    const hv = new VoxelBuilder();
    hv.box(0, len / 2 - 0.03, 0, wid, len, 0.01, col);
    hv.box(0, len - 0.03, 0, wid * 1.8, wid * 1.8, 0.01, col, Math.PI / 4);
    pivot.add(hv.mesh({ px: 1.0 }));
    root.add(pivot);
    return pivot;
  };
  const hourH = hand(0.17, 0.028, '#1F1A16');
  const minH = hand(0.25, 0.018, '#1F1A16');
  minH.position.z += 0.006;
  const cv = new VoxelBuilder();
  prismZ(cv, 0, height, CZ + 0.014, 0.022, 0.012, C.gold, 8);
  root.add(cv.mesh({ px: 1.0 }));
  function setTime(h, m = 0) {
    minH.rotation.z = -(m / 60) * Math.PI * 2;
    hourH.rotation.z = -(((h % 12) + m / 60) / 12) * Math.PI * 2;
  }
  setTime(5, 40);
  const shadow = post ? shadowUnder(root, 0.25, 0.25, 0, -0.06, 0.4) : null;
  return { root, setTime, dispose() { shadow?.geometry.dispose(); disposePictures(root); disposeTree(root); } };
}

/**
 * The stage's front curtain: two maroon pleated panels on a rod under a gold-scalloped valance with
 * sparkles, gold fringe at the hem; a rope runs from the rod's right end down to a cleat at 0.9 m.
 * setOpen(0..1) bunches the panels to the sides; setKnot('hard' | 'bow') ties the rope at the cleat.
 * Origin at the centre of the curtain line on the floor.
 */
export function frontCurtain(w = 10, { h = 3 } = {}) {
  const root = new THREE.Group();
  root.name = 'frontCurtain';
  const v = new VoxelBuilder();
  // rod with finials and brackets
  v.box(0, h + 0.05, 0.02, w + 0.4, 0.05, 0.05, C.goldD);
  for (const s of [-1, 1]) {
    v.box(s * (w / 2 + 0.24), h + 0.05, 0.02, 0.1, 0.1, 0.1, C.gold);
    v.box(s * (w / 2 + 0.1), h + 0.12, -0.04, 0.05, 0.16, 0.12, C.iron);
  }
  // valance: maroon pelmet, gold scallops, little four-point sparkles
  v.box(0, h + 0.16, 0.1, w + 0.3, 0.3, 0.06, C.maroonD);
  const nS = Math.round(w / 0.5);
  for (let i = 0; i < nS; i++) {
    const x = -w / 2 + (i + 0.5) * (w / nS);
    v.box(x, h - 0.02, 0.12, w / nS - 0.05, 0.08, 0.05, C.maroon);
    v.box(x, h - 0.07, 0.12, w / nS - 0.18, 0.04, 0.05, C.maroon);
    v.box(x, h - 0.1, 0.125, 0.03, 0.05, 0.03, C.gold);
    if (i % 2 === 0) { v.box(x, h + 0.17, 0.135, 0.1, 0.025, 0.01, C.gold); v.box(x, h + 0.17, 0.135, 0.025, 0.1, 0.01, C.gold); }
  }
  v.box(0, h + 0.3, 0.135, w + 0.3, 0.03, 0.02, C.gold);
  v.box(0, h + 0.03, 0.135, w + 0.3, 0.02, 0.02, C.gold);
  // the rope to a cleat on the right
  const RX = w / 2 + 0.18;
  v.box(RX, (h + 0.9) / 2 + 0.05, 0.06, 0.025, h - 0.85, 0.025, C.rope);
  v.box(RX, 0.9, 0.0, 0.08, 0.3, 0.03, C.woodD); // cleat plate
  v.box(RX, 0.9, 0.04, 0.22, 0.04, 0.04, C.iron);
  v.box(RX, 0.62, 0.06, 0.03, 0.5, 0.03, C.ropeD); // tail hanging
  root.add(v.mesh());
  // the panels, built from the outer edge toward the middle so scale.x bunches them outward
  const half = w / 2 + 0.06;
  const pleat = 0.22;
  const n = Math.round(half / pleat);
  const pv = new VoxelBuilder();
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * (half / n);
    const front = i % 2 === 0;
    pv.box(x, h / 2 + 0.03, front ? 0.02 : -0.02, half / n + 0.01, h - 0.06, 0.05, front ? jitter(C.maroon, 0.04, i) : '#5A1822');
    pv.box(x, 0.06, front ? 0.03 : -0.01, half / n + 0.01, 0.08, 0.06, C.gold); // fringe band
    pv.box(x, 0.01, front ? 0.03 : -0.01, 0.03, 0.02, 0.03, C.goldD); // tassel
    pv.box(x, h - 0.05, 0.0, half / n * 0.4, 0.04, 0.07, C.gold); // ring on the rod
  }
  const panelGeo = pv.geometry();
  const panelMat = toon('#ffffff', { vertexColors: true });
  const panels = [-1, 1].map((s) => {
    const p = new THREE.Group();
    p.position.x = s * (w / 2 + 0.06);
    p.scale.x = -s; // left panel grows +X from the left edge, right panel grows -X
    const m = new THREE.Mesh(panelGeo, panelMat);
    m.userData.sharedGeo = true;
    addOutline(m);
    p.add(m);
    root.add(p);
    return p;
  });
  // knots at the cleat
  const kv = new VoxelBuilder();
  kv.box(RX, 0.96, 0.07, 0.07, 0.06, 0.06, C.ropeD);
  kv.box(RX + 0.02, 0.92, 0.075, 0.05, 0.05, 0.05, C.rope);
  kv.box(RX - 0.02, 1.0, 0.075, 0.05, 0.04, 0.05, C.ropeD);
  const hard = kv.mesh({ px: 1.2 });
  const loopV = new VoxelBuilder();
  for (const s of [-1, 1]) {
    _m.compose(_p.set(RX + s * 0.07, 0.97, 0.08), _q.setFromEuler(_e.set(Math.PI / 2, 0, s * 0.3)), _s.set(1, 0.6, 1));
    const l = new VoxelBuilder();
    ring(l, 0, 0, 0, 0.045, 9, 0.016, 0.016, C.rope);
    loopV.merge(l, _m);
    boxR(loopV, RX + s * 0.03, 0.91, 0.08, 0.015, 0.09, 0.015, C.rope, 0, 0, s * 0.35);
  }
  loopV.box(RX, 0.96, 0.075, 0.045, 0.045, 0.045, C.ropeD);
  const bow = loopV.mesh({ px: 1.2 });
  root.add(hard, bow);
  function setOpen(t) {
    const e = smooth(t);
    for (const p of panels) p.scale.x = Math.sign(p.scale.x) * (1 - 0.84 * e);
  }
  function setKnot(k) { hard.visible = k !== 'bow'; bow.visible = k === 'bow'; }
  setOpen(0);
  setKnot('hard');
  return { root, setOpen, setKnot, dispose() { panelGeo.dispose(); disposeTree(root); } };
}

/** Draws the painted Quarter scenery: streets, houses, little roads with tiny figures, a bridge. */
function drawBackdrop(g, W, H, painted) {
  const r = rand(21);
  // sky wash and a paper border
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#CFE2EE');
  sky.addColorStop(0.55, '#F8E8CC');
  sky.addColorStop(1, '#F1E4C9');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  // soft clouds (Maya's motif)
  g.fillStyle = 'rgba(255,250,240,0.9)';
  for (const [x, y, s] of [[140, 60, 1], [520, 44, 1.3], [860, 70, 0.9]]) {
    for (const [dx, dy, rr] of [[-30, 6, 22], [0, 0, 30], [32, 6, 22], [10, 12, 24]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, rr * s, 0, Math.PI * 2); g.fill(); }
  }
  // distant exercise-book hills: ruled lines on green
  g.fillStyle = '#B9CFA0';
  g.beginPath(); g.moveTo(0, 190); for (let x = 0; x <= W; x += 40) g.lineTo(x, 170 + Math.sin(x * 0.012) * 18); g.lineTo(W, 210); g.lineTo(0, 210); g.fill();
  // rows of houses (painted already): blocks with roofs, windows
  const houses = [];
  for (let x = 20; x < W - 60; x += 70 + r() * 30) houses.push([x, 46 + r() * 30, 50 + r() * 34]);
  for (const [x, w, h] of houses) {
    if (x > 690 && x < 900) continue; // the river and the bridge go here
    const base = 236;
    g.fillStyle = ['#EADFC8', '#E8CFA8', '#DCC3A0', '#F0E2C4'][Math.floor(r() * 4)];
    g.fillRect(x, base - h, w, h);
    g.fillStyle = ['#9E4B36', '#6E1F2A', '#A47A2C'][Math.floor(r() * 3)];
    g.beginPath(); g.moveTo(x - 6, base - h); g.lineTo(x + w / 2, base - h - 26); g.lineTo(x + w + 6, base - h); g.fill();
    g.fillStyle = '#7C9DB6';
    g.fillRect(x + 8, base - h + 12, 10, 12);
    if (w > 60) g.fillRect(x + w - 18, base - h + 12, 10, 12);
    g.fillStyle = '#6B4A31';
    g.fillRect(x + w / 2 - 6, base - 22, 12, 22);
    g.strokeStyle = 'rgba(60,40,20,0.5)'; g.lineWidth = 1.5; g.strokeRect(x, base - h, w, h);
  }
  // the river under the bridge
  g.fillStyle = '#9CC3DE';
  g.fillRect(700, 236, 200, H - 236);
  g.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 6; i++) g.fillRect(720 + i * 28, 262 + (i % 3) * 18, 18, 3);
  // the roads: pencil outlines always; filled with ochre paint by `painted`
  const roads = [
    [[0, 300], [180, 262], [360, 270], [520, 248], [700, 240]],
    [[260, 330], [300, 290], [360, 270]],
    [[520, 330], [540, 280], [520, 248]],
  ];
  const strokeRoad = (pts, width, style) => {
    g.strokeStyle = style; g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; g.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2); }
    g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
    g.stroke();
  };
  for (const pts of roads) {
    g.globalAlpha = painted;
    strokeRoad(pts, 26, '#D9A93A');
    strokeRoad(pts, 4, '#F6E3A8');
    g.globalAlpha = 1;
    strokeRoad(pts, 28, 'rgba(90,90,90,0.0)');
    g.setLineDash([3, 5]);
    strokeRoad(pts, 1.6, 'rgba(70,70,70,0.75)');
    g.setLineDash([]);
  }
  // pencil road edges
  g.strokeStyle = 'rgba(70,70,70,0.55)'; g.lineWidth = 1.3;
  for (const pts of roads) { g.save(); g.translate(0, -12); strokeRoad(pts, 1.3, 'rgba(70,70,70,0.55)'); g.translate(0, 24); strokeRoad(pts, 1.3, 'rgba(70,70,70,0.55)'); g.restore(); }
  // the bridge: pencil outline, painted maroon deck and gold rails by `painted`
  const bx0 = 690, bx1 = 910, by = 236;
  g.globalAlpha = painted;
  g.fillStyle = '#6E1F2A';
  g.beginPath(); g.moveTo(bx0, by); g.quadraticCurveTo(800, by - 40, bx1, by); g.lineTo(bx1, by + 12); g.quadraticCurveTo(800, by - 26, bx0, by + 12); g.fill();
  g.strokeStyle = '#C9A24A'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(bx0, by - 22); g.quadraticCurveTo(800, by - 64, bx1, by - 22); g.stroke();
  g.globalAlpha = 1;
  g.strokeStyle = 'rgba(60,60,60,0.8)'; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(bx0, by); g.quadraticCurveTo(800, by - 40, bx1, by); g.lineTo(bx1, by + 12); g.quadraticCurveTo(800, by - 26, bx0, by + 12); g.closePath(); g.stroke();
  g.beginPath(); g.moveTo(bx0, by - 22); g.quadraticCurveTo(800, by - 64, bx1, by - 22); g.stroke();
  for (let i = 0; i <= 8; i++) { const x = bx0 + (i / 8) * (bx1 - bx0); const t = i / 8; const yy = by - 40 * 4 * t * (1 - t) * 0.5; g.beginPath(); g.moveTo(x, yy - 22 - 21 * 4 * t * (1 - t) * 0.5); g.lineTo(x, yy); g.stroke(); }
  // tiny figures on the roads
  for (const [x, y, c] of [[120, 270, '#6E1F2A'], [330, 262, '#2F5DB3'], [450, 252, '#4F8F5A'], [600, 238, '#C8423C'], [530, 300, '#A47A2C']]) {
    g.fillStyle = c; g.fillRect(x - 3, y - 16, 6, 10);
    g.fillStyle = '#3B2A1A'; g.beginPath(); g.arc(x, y - 20, 3.4, 0, Math.PI * 2); g.fill();
    g.fillRect(x - 2.5, y - 6, 2, 6); g.fillRect(x + 0.5, y - 6, 2, 6);
  }
  // foreground: grass strip with ruled exercise-book lines
  g.fillStyle = '#A8C48C';
  g.fillRect(0, 300, W, H - 300);
  g.strokeStyle = 'rgba(80,110,160,0.35)'; g.lineWidth = 1;
  for (let y = 306; y < H; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  for (const pts of roads) { /* re-draw the road ends over the grass */ g.globalAlpha = painted; strokeRoad(pts.filter((p) => p[1] > 290), 26, '#D9A93A'); g.globalAlpha = 1; }
  grain(g, W, H, 33, 900, 'rgba(80,60,30,0.06)', 'rgba(255,255,255,0.1)');
  // brush-stroke border
  g.strokeStyle = '#A47A2C'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6);
}

/**
 * The stage backdrop: painted Quarter streets on canvas between two battens, hung by two ropes.
 * setPainted(0..1) fills the roads and the bridge (pencil outlines before); setRolled(true) swaps it
 * for a 0.3 m roll lying on the ground (for the carry). Origin at the bottom centre, faces +Z.
 */
export function backdrop({ w = 10, h = 3.2, painted = 0, rolled = false } = {}) {
  const root = new THREE.Group();
  root.name = 'backdrop';
  const flat = new THREE.Group();
  root.add(flat);
  const v = new VoxelBuilder();
  v.box(0, h + 0.05, 0, w + 0.2, 0.08, 0.08, C.woodD);
  v.box(0, 0.08, 0, w + 0.1, 0.07, 0.07, C.woodD);
  for (const s of [-1, 1]) {
    v.box(s * (w / 2 - 0.3), h + 0.5, 0, 0.025, 0.9, 0.025, C.rope);
    v.box(s * (w / 2 - 0.3), h + 0.1, 0.0, 0.08, 0.06, 0.1, C.iron);
    v.box(s * (w / 2 + 0.06), h / 2 + 0.06, -0.02, 0.06, h, 0.04, C.woodL); // side stiles
  }
  flat.add(v.mesh());
  const PX = 1024, PY = Math.round((1024 * (h - 0.06)) / w);
  const { g, tex } = makeCanvas(PX, PY);
  let amount = painted;
  const run = live(tex, () => drawBackdrop(g, PX, PY, amount));
  const canvasMesh = picture(tex, w, h - 0.06);
  canvasMesh.position.set(0, h / 2 + 0.08, 0.042);
  flat.add(canvasMesh);
  // the roll: canvas rolled round a pole, tied in three places, lying on the ground
  const rv = new VoxelBuilder();
  prismX(rv, 0, 0.15, 0, 0.15, w, '#EFE3C9', 12);
  prismX(rv, 0, 0.15, 0, 0.152, w * 0.98, '#E3D3B2', 12);
  for (const s of [-1, 1]) {
    prismX(rv, s * (w / 2 + 0.06), 0.15, 0, 0.05, 0.12, C.woodD, 8);
    prismX(rv, s * (w / 2 - 0.004), 0.15, 0, 0.11, 0.01, '#D9A93A', 12); // painted edge showing in the spiral
    prismX(rv, s * (w / 2 - 0.002), 0.15, 0, 0.06, 0.01, '#6E1F2A', 12);
  }
  for (const x of [-w / 3, 0, w / 3]) prismX(rv, x, 0.15, 0, 0.158, 0.05, C.rope, 12);
  const roll = rv.mesh();
  root.add(roll);
  function setRolled(on) { flat.visible = !on; roll.visible = !!on; }
  let lastQ = -1;
  function setPainted(t) {
    amount = clamp(t, 0, 1);
    const q = Math.round(amount * 20);
    if (q !== lastQ) { lastQ = q; run(); }
  }
  setRolled(rolled);
  return { root, setPainted, setRolled, dispose() { disposePictures(root); disposeTree(root); } };
}

/** Wicker basket box into v (w x d x h), weave rows and stakes. */
function wickerInto(v, w, d, h, seed = 1) {
  const rows = Math.round(h / 0.045);
  for (let i = 0; i < rows; i++) {
    const y = 0.03 + i * (h - 0.05) / rows;
    const hh = (h - 0.05) / rows - 0.006;
    const off = i % 2 ? 0.0 : 0.006;
    const col = jitter(i % 2 ? C.wicker : C.wickerL, 0.05, seed + i);
    v.box(0, y + hh / 2, d / 2 + off - 0.01, w, hh, 0.02, col);
    v.box(0, y + hh / 2, -d / 2 - off + 0.01, w, hh, 0.02, col);
    v.box(w / 2 + off - 0.01, y + hh / 2, 0, 0.02, hh, d, col);
    v.box(-w / 2 - off + 0.01, y + hh / 2, 0, 0.02, hh, d, col);
  }
  const ns = Math.round(w / 0.08);
  for (let i = 0; i <= ns; i++) {
    const x = -w / 2 + (i / ns) * w;
    v.box(x, h / 2, d / 2 + 0.008, 0.012, h - 0.02, 0.012, C.wickerD);
    v.box(x, h / 2, -d / 2 - 0.008, 0.012, h - 0.02, 0.012, C.wickerD);
  }
  v.boxMin(-w / 2 - 0.02, h - 0.035, -d / 2 - 0.02, w / 2 + 0.02, h + 0.01, d / 2 + 0.02, C.wickerD); // rim
  v.boxMin(-w / 2 + 0.02, 0, -d / 2 + 0.02, w / 2 - 0.02, 0.03, d / 2 - 0.02, C.wickerD); // base
  v.boxMin(-w / 2 + 0.02, h - 0.04, -d / 2 + 0.02, w / 2 - 0.02, h - 0.02, d / 2 - 0.02, '#5E4426'); // dark inside
}

const BASKET_ITEMS = ['ribbon', 'sheet', 'badge', 'timetable', 'wicks', 'rope', 'promptBook'];
/**
 * The play's prop basket: wicker 0.8 x 0.5 x 0.4 m, the lid hinged open at the back, rope handles at
 * both ends. setItems(ids) shows what is in it: 'ribbon' 'sheet' 'badge' 'timetable' 'wicks' 'rope'
 * 'promptBook'.
 */
export function propBasket({ items = BASKET_ITEMS } = {}) {
  const root = new THREE.Group();
  root.name = 'propBasket';
  const W = 0.8, D = 0.5, H = 0.4;
  const v = new VoxelBuilder();
  wickerInto(v, W, D, H, 3);
  // rope handles at both ends
  for (const s of [-1, 1]) {
    v.box(s * (W / 2 + 0.05), H - 0.06, -0.08, 0.03, 0.03, 0.03, C.rope);
    v.box(s * (W / 2 + 0.05), H - 0.06, 0.08, 0.03, 0.03, 0.03, C.rope);
    v.box(s * (W / 2 + 0.07), H - 0.11, 0, 0.03, 0.03, 0.19, C.rope);
    for (const z of [-0.08, 0.08]) v.box(s * (W / 2 + 0.06), H - 0.085, z, 0.03, 0.05, 0.03, C.ropeD);
  }
  // a painted label strip on the front «ပြဇာတ်»: simple maroon band with gold dots
  v.box(0, 0.2, D / 2 + 0.016, 0.3, 0.08, 0.008, C.maroon);
  for (let i = 0; i < 5; i++) v.box(-0.1 + i * 0.05, 0.2, D / 2 + 0.021, 0.02, 0.02, 0.004, C.gold);
  root.add(v.mesh());
  // the lid, hinged on the back edge, open and leaning back
  const hinge = new THREE.Group();
  hinge.position.set(0, H + 0.005, -D / 2 - 0.02);
  hinge.rotation.x = -1.95;
  const lv = new VoxelBuilder();
  lv.boxMin(-W / 2 - 0.025, 0, 0, W / 2 + 0.025, 0.04, D + 0.045, C.wickerD);
  for (let i = 0; i < 6; i++) lv.boxMin(-W / 2, 0.04, 0.03 + i * 0.075, W / 2, 0.052, 0.03 + i * 0.075 + 0.06, jitter(i % 2 ? C.wicker : C.wickerL, 0.05, i + 20));
  lv.box(0, 0.06, D - 0.02, 0.1, 0.02, 0.06, C.rope); // lid loop
  hinge.add(lv.mesh());
  root.add(hinge);
  let itemsMesh = null;
  function setItems(ids) {
    freeMesh(itemsMesh);
    const has = new Set(ids || []);
    const iv = new VoxelBuilder();
    const T = H - 0.03;
    if (has.has('sheet')) { boxR(iv, -0.2, T + 0.1, -0.08, 0.21, 0.28, 0.006, '#FBF8F0', -0.25, 0.2, 0.15); for (let k = 0; k < 4; k++) boxR(iv, -0.2 + 0.0, T + 0.16 - k * 0.04, -0.075 + 0.0, 0.15, 0.008, 0.002, '#9DB8D8', -0.25, 0.2, 0.15); }
    if (has.has('timetable')) { boxR(iv, 0.05, T + 0.09, -0.12, 0.24, 0.17, 0.008, '#F1E3C2', -0.2, -0.1, -0.05); for (let k = 0; k < 4; k++) boxR(iv, 0.05, T + 0.05 + k * 0.035, -0.112, 0.2, 0.004, 0.002, C.maroon, -0.2, -0.1, -0.05); }
    if (has.has('promptBook')) { iv.box(0.24, T + 0.04, 0.02, 0.18, 0.05, 0.24, C.maroon, 0.3); iv.box(0.24, T + 0.066, 0.02, 0.1, 0.004, 0.08, C.gold, 0.3); iv.box(0.2, T + 0.04, 0.06, 0.17, 0.035, 0.23, '#F6F0E2', 0.3); }
    if (has.has('rope')) { ring(iv, -0.25, T + 0.02, 0.1, 0.08, 10, 0.03, 0.025, C.rope, 0, 3); ring(iv, -0.25, T + 0.045, 0.1, 0.065, 9, 0.026, 0.022, C.ropeD, 0.2, 8); }
    if (has.has('wicks')) for (let k = 0; k < 7; k++) boxR(iv, 0.05 + k * 0.012, T + 0.04, 0.12, 0.006, 0.006, 0.26, '#FFFDF4', 0.15, 0.5, 0.1 * (k - 3));
    if (has.has('wicks')) iv.box(0.09, T + 0.045, 0.12, 0.03, 0.02, 0.02, C.maroon, 0.5);
    if (has.has('badge')) { prism(iv, -0.05, T + 0.07, 0.15, 0.05, 0.05, 0.012, C.gold, 10, 0.5, 0, 0); prism(iv, -0.05, T + 0.075, 0.153, 0.03, 0.03, 0.012, C.goldD, 10, 0.5, 0, 0); for (const s of [-1, 1]) boxR(iv, -0.05 + s * 0.02, T + 0.02, 0.18, 0.025, 0.07, 0.006, C.maroon, 0.5, 0, s * 0.3); }
    if (has.has('ribbon')) {
      // a long gold ribbon spilling over the front rim and down to the ground
      const pts = [[0.12, T + 0.05, 0.1], [0.14, T + 0.03, 0.2], [0.15, H + 0.0, D / 2 + 0.04], [0.16, H - 0.12, D / 2 + 0.05], [0.18, H - 0.26, D / 2 + 0.055], [0.2, 0.06, D / 2 + 0.06], [0.24, 0.006, D / 2 + 0.16]];
      for (let k = 0; k < pts.length - 1; k++) {
        const [x0, y0, z0] = pts[k], [x1, y1, z1] = pts[k + 1];
        const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0);
        _m.lookAt(_p.set(x0, y0, z0), _s.set(x1, y1, z1), new THREE.Vector3(0, 1, 0.001));
        _q.setFromRotationMatrix(_m);
        _m.compose(_p.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), _q, _s.set(0.06, 0.006, len + 0.01));
        iv.add(UNIT, k % 2 ? '#E2B33C' : '#D9A93A', _m);
      }
    }
    itemsMesh = iv.mesh({ px: 1.2 });
    root.add(itemsMesh);
  }
  setItems(items);
  const shadow = shadowUnder(root, 0.55, 0.38, 0, 0, 0.45);
  return { root, setItems, ITEMS: BASKET_ITEMS, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

/**
 * The "Maya" costume on a coat hook: a 1.1 m cardboard gold quill hanging from a string loop, and a
 * maroon sash «မာရာ» draped over the hook. Origin at the hook's wall plate (wall at z = 0), faces +Z.
 */
export function costumeQuill() {
  const root = new THREE.Group();
  root.name = 'costumeQuill';
  const v = new VoxelBuilder();
  // hook: a wooden plate and a brass peg
  v.box(0, 0, 0.012, 0.16, 0.08, 0.024, C.woodD);
  v.box(0, 0, 0.06, 0.03, 0.03, 0.08, C.gold);
  v.box(0, 0.02, 0.1, 0.035, 0.05, 0.03, C.goldD);
  // the quill, built along +Y then hung tilted
  const q = new VoxelBuilder();
  const L = 1.1;
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const y = 0.12 + t * (L - 0.16);
    const wv = Math.sin(Math.pow(t, 0.8) * Math.PI) * 0.17 * (t < 0.15 ? t / 0.15 : 1) + 0.015;
    const gap = i % 5 === 2; // splits in the vane
    const off = (t - 0.5) * 0.02;
    q.box(-wv / 2 - 0.004 + off, y, 0, wv - (gap ? 0.04 : 0), 0.038, 0.012, jitter(C.gold, 0.05, i));
    q.box(wv / 2 + 0.004 + off, y, 0, wv * 0.8 - (gap ? 0.03 : 0), 0.038, 0.012, jitter('#D9B45A', 0.05, i + 40));
    q.box(-wv - 0.006 + off + (gap ? 0.04 : 0), y, -0.002, 0.012, 0.04, 0.014, C.kraftD); // cardboard edge
  }
  q.box(0, L / 2, 0.007, 0.018, L - 0.1, 0.008, C.goldD); // shaft
  q.box(0, 0.06, 0, 0.026, 0.12, 0.014, C.goldD); // the nib
  q.box(0, 0.02, 0.002, 0.016, 0.05, 0.016, C.ink);
  q.box(0, 0.08, 0.009, 0.004, 0.06, 0.004, C.ink);
  _m.compose(_p.set(0.02, -1.15, 0.12), _q.setFromEuler(_e.set(0, 0, 0.12)), _s.set(1, 1, 1));
  v.merge(q, _m);
  // string loop from the hook to the quill top
  boxR(v, 0.0, -0.06, 0.1, 0.008, 0.12, 0.008, C.string, 0, 0, 0.15);
  boxR(v, 0.0, -0.06, 0.1, 0.008, 0.12, 0.008, C.string, 0, 0, -0.1);
  // the sash: over the hook, two ends hanging in front of the quill, gold edging, fringe
  const sash = (x0, ang, len) => {
    boxR(v, x0, -len / 2, 0.15, 0.12, len, 0.014, C.maroon, 0, 0, ang);
    for (const s of [-1, 1]) boxR(v, x0 + Math.cos(ang) * s * 0.058, -len / 2 + Math.sin(ang) * s * 0.058, 0.158, 0.012, len, 0.004, C.gold, 0, 0, ang);
    for (let k = 0; k < 5; k++) boxR(v, x0 + Math.sin(ang) * len - 0.04 + k * 0.02, -len - 0.03, 0.15, 0.008, 0.05, 0.008, C.gold, 0, 0, ang);
  };
  sash(-0.04, -0.12, 0.62);
  sash(0.07, 0.05, 0.8);
  v.box(0.01, 0.03, 0.13, 0.17, 0.05, 0.06, C.maroonD); // the fold over the hook
  root.add(v.mesh());
  const { g, tex } = makeCanvas(256, 64);
  live(tex, () => {
    g.clearRect(0, 0, 256, 64);
    fitText(g, 'မာရာ', 128, 34, 230, 44, { color: '#E9C46A' }); // DRAFT Burmese (Maya to proofread)
  });
  const word = picture(tex, 0.36, 0.09, { transparent: true });
  word.position.set(0.07 + Math.sin(0.05) * 0.4, -0.45, 0.168);
  word.rotation.z = Math.PI / 2 + 0.05;
  root.add(word);
  return { root, dispose() { disposePictures(root); disposeTree(root); } };
}

/** A folded paper seat card (0.3 x 0.2 flat, a tent 0.1 high) with text on its front. */
export function seatCard(text = '') {
  const root = new THREE.Group();
  root.name = 'seatCard';
  const v = new VoxelBuilder();
  const ang = 0.42, s = 0.12, CW = 0.34;
  for (const z of [-1, 1]) boxR(v, 0, Math.cos(ang) * s / 2, z * Math.sin(ang) * s / 2, CW, s, 0.004, z > 0 ? '#FBF6EA' : '#EFE6D3', -z * ang, 0, 0); // a tent: both halves lean in to the ridge
  v.box(0, Math.cos(ang) * s, 0, CW, 0.006, 0.006, '#E2D6BC');
  root.add(v.mesh({ px: 1.0 }));
  const { g, tex } = makeCanvas(340, 120);
  let cur = text; // DRAFT Burmese (Maya to proofread): the name written on the card
  const run = live(tex, () => {
    g.fillStyle = '#FBF6EA';
    g.fillRect(0, 0, 340, 120);
    g.strokeStyle = '#C9A24A'; g.lineWidth = 4; g.strokeRect(6, 6, 328, 108);
    if (cur) fitText(g, cur, 170, 64, 310, 72, { color: '#4A141C' });
  });
  const face = picture(tex, CW - 0.01, s * 0.96);
  face.position.set(0, Math.cos(ang) * s / 2, Math.sin(ang) * s / 2 + 0.003);
  face.rotation.x = -ang;
  root.add(face);
  return { root, setText(t) { cur = t; run(); }, dispose() { disposePictures(root); disposeTree(root); } };
}

// DRAFT Burmese (Maya to proofread): the programme, all lines
const PROGRAMME = {
  my: { title: 'နှုတ်ဆက်ပွဲ ပြဇာတ်', sub: '"ကျွန်တော်တို့ရဲ့ တစ်နှစ်"', when: 'ဒီည ၆ နာရီ · စင်မြင့်လေး',
    rows: [['၁။ အရိပ်ထဲက ပဲပင်', 'မာရာ — ရဲယဉ့်'], ['၂။ နေပူထဲက အိုး', 'မာရာ — ရဲယဉ့်'], ['၃။ ပါဆယ်တံဆိပ်', 'မာရာ — ရဲယဉ့်'], ['၄။ တံတားဘုတ်', 'မာရာ — ရဲယဉ့်'], ['၅။ နှုတ်ဆက်စကား', 'ရဲယဉ့်']],
    by: 'ရေးသူ — ရဲယဉ့်', margin: 'အကောင်းဆုံး သရုပ်ဆောင်ဆု ရှိမယ်တဲ့', font: FONT_MY },
  en: { title: 'Farewell play', sub: '"Our Year"', when: 'Tonight 6 pm · the little stage',
    rows: [['1. Beans in the shade', 'Maya — Ye Yint'], ['2. Pots in the sun', 'Maya — Ye Yint'], ['3. The parcel labels', 'Maya — Ye Yint'], ['4. The bridge board', 'Maya — Ye Yint'], ['5. Farewell words', 'Ye Yint']],
    by: 'Written by Ye Yint', margin: 'a best-actor prize, they say', font: FONT_SERIF },
};
/**
 * The play programme (Day 7): 0.6 x 0.85 m paper pinned at four corners, the cast list. Origin at its
 * centre, faces +Z. setLang('my' | 'en'); setMargin(bool) shows the pencilled prize rumour.
 */
export function programmePoster({ lang = 'my', margin = true } = {}) {
  const root = new THREE.Group();
  root.name = 'programmePoster';
  const PW = 512, PH = 726;
  const { g, tex } = makeCanvas(PW, PH);
  let L = lang, M = margin;
  const run = live(tex, () => {
    const T = PROGRAMME[L] || PROGRAMME.my;
    const en = L === 'en';
    g.fillStyle = '#FBF5E6';
    g.fillRect(0, 0, PW, PH);
    grain(g, PW, PH, 17, 900);
    g.strokeStyle = '#6E1F2A'; g.lineWidth = 8; g.strokeRect(18, 18, PW - 36, PH - 36);
    g.strokeStyle = '#C9A24A'; g.lineWidth = 3; g.strokeRect(32, 32, PW - 64, PH - 64);
    // a curtain swag drawn at the top
    g.fillStyle = '#6E1F2A';
    g.beginPath(); g.moveTo(32, 32); g.lineTo(PW - 32, 32); g.lineTo(PW - 32, 70); for (let i = 6; i >= 0; i--) g.quadraticCurveTo(32 + (i + 0.5) * ((PW - 64) / 7), 100, 32 + i * ((PW - 64) / 7), 70); g.closePath(); g.fill();
    fitText(g, T.title, PW / 2, 140, PW - 100, en ? 54 : 46, { color: '#4A141C', font: T.font, weight: en ? 600 : 700 });
    fitText(g, T.sub, PW / 2, 200, PW - 120, en ? 38 : 32, { color: '#A47A2C', font: T.font, weight: en ? 600 : 700 });
    fitText(g, T.when, PW / 2, 252, PW - 120, en ? 28 : 24, { color: '#2A2118', font: T.font, weight: 600 });
    g.fillStyle = '#C9A24A'; g.fillRect(120, 284, PW - 240, 3);
    T.rows.forEach(([a, b], i) => {
      const y = 340 + i * 64;
      fitText(g, a, 56, y, 250, en ? 28 : 24, { color: '#2A2118', font: T.font, weight: 600, align: 'left' });
      g.fillStyle = 'rgba(60,40,20,0.45)';
      for (let x = 310; x < 330; x += 6) g.fillRect(x, y + 4, 2, 2);
      fitText(g, b, PW - 56, y, 140, en ? 26 : 22, { color: '#6E1F2A', font: T.font, weight: 700, align: 'right' });
    });
    fitText(g, T.by, PW / 2, 676, 300, en ? 26 : 22, { color: '#A47A2C', font: T.font, weight: 600 });
    if (M) {
      g.save(); g.translate(PW - 80, 470); g.rotate(-Math.PI / 2 + 0.04);
      fitText(g, T.margin, 0, 0, 300, en ? 24 : 20, { color: 'rgba(70,70,70,0.75)', font: T.font, weight: 400 });
      g.restore();
      g.strokeStyle = 'rgba(70,70,70,0.6)'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(PW - 92, 330); g.quadraticCurveTo(PW - 120, 316, PW - 140, 338); g.stroke();
    }
  });
  const sheet = picture(tex, 0.6, 0.85, { sy: 4 });
  const pos = sheet.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.abs(pos.getY(i)) < 0.3 ? 0.006 : 0.0); // a soft belly where it is not pinned
  sheet.position.z = 0.006;
  root.add(sheet);
  const v = new VoxelBuilder();
  v.box(0, 0, 0.0, 0.61, 0.86, 0.004, '#E9DFC8');
  for (const [x, y] of [[-0.27, 0.4], [0.27, 0.4], [-0.27, -0.4], [0.27, -0.4]]) prismZ(v, x, y, 0.014, 0.014, 0.012, C.red, 8);
  root.add(v.mesh({ px: 1.0 }));
  return { root, setLang(l) { L = l; run(); }, setMargin(on) { M = !!on; run(); }, dispose() { disposePictures(root); disposeTree(root); } };
}

/** School bench into v: 1.6 x 0.35 seat at 0.45, two trestle ends, a stretcher, initials scratched. */
function benchInto(v, seed = 0) {
  const W = 1.6, D = 0.35, H = 0.45;
  for (let i = 0; i < 2; i++) v.boxMin(-W / 2, H - 0.05, -D / 2 + i * D / 2 + 0.004, W / 2, H, -D / 2 + (i + 1) * D / 2, jitter(C.wood, 0.06, seed + i));
  v.boxMin(-W / 2 + 0.02, H - 0.052, -0.004, W / 2 - 0.02, H - 0.048, 0.004, C.woodD); // seam
  for (const s of [-1, 1]) {
    const x = s * (W / 2 - 0.16);
    v.boxMin(x - 0.025, 0, -D / 2 + 0.03, x + 0.025, H - 0.05, D / 2 - 0.03, C.woodD);
    v.boxMin(x - 0.04, 0, -D / 2 + 0.01, x + 0.04, 0.05, D / 2 - 0.01, C.woodD); // foot
    v.boxMin(x - 0.03, H - 0.09, -D / 2 + 0.02, x + 0.03, H - 0.05, D / 2 - 0.02, C.wood); // cleat
    v.boxMin(x - 0.02, 0.1, -D / 2 + 0.1, x + 0.02, 0.2, D / 2 - 0.1, '#5E4126'); // cut-out shadow
  }
  v.boxMin(-W / 2 + 0.18, 0.14, -0.02, W / 2 - 0.18, 0.2, 0.02, C.woodD); // stretcher
  // chalk initials and a carved heart on the seat
  v.box(-0.4, H + 0.001, 0.06, 0.08, 0.002, 0.012, '#E8E2D2');
  v.box(-0.36, H + 0.001, 0.07, 0.012, 0.002, 0.04, '#E8E2D2');
  v.box(0.45, H + 0.001, -0.05, 0.04, 0.002, 0.04, C.woodD, Math.PI / 4);
}
let benchGeo = null;
function benchMesh() {
  if (!benchGeo) { const v = new VoxelBuilder(); benchInto(v, 2); benchGeo = v.geometry(); }
  const m = new THREE.Mesh(benchGeo, toon('#ffffff', { vertexColors: true }));
  m.userData.sharedGeo = true;
  addOutline(m);
  m.children[0].userData.sharedGeo = true;
  return m;
}
/** One carryable school bench (1.6 x 0.35 x 0.45 m). */
export function schoolBench() {
  const root = new THREE.Group();
  root.name = 'schoolBench';
  root.add(benchMesh());
  const shadow = shadowUnder(root, 0.9, 0.28, 0, 0, 0.4);
  return { root, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}
/**
 * School benches stacked two and two (the lower one upright, the upper one upside down on its seat).
 * n benches (default 4). benches: one Group per bench (lift one out to carry it).
 */
export function benchStack(n = 4) {
  const root = new THREE.Group();
  root.name = 'benchStack';
  const benches = [];
  const piles = Math.ceil(n / 2);
  for (let i = 0; i < n; i++) {
    const pile = Math.floor(i / 2), up = i % 2 === 1;
    const g = new THREE.Group();
    g.add(benchMesh());
    g.position.set((pile - (piles - 1) / 2) * 1.75, up ? 0.9 : 0, (pile % 2 ? 0.12 : 0) + (up ? 0.02 : 0));
    g.rotation.y = (pile % 2 ? 0.05 : -0.04) + (up ? 0.03 : 0);
    if (up) g.rotation.x = Math.PI;
    root.add(g);
    benches.push(g);
  }
  const shadow = shadowUnder(root, piles * 0.95, 0.35, 0, 0.05, 0.4);
  return { root, benches, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

/**
 * The brimming bowl (Day 7): a wide glazed pot 0.45 m across, terracotta foot, brown glaze with a cream
 * wave band, and water inside. setFull(0..1) raises the water to the brim; setTilt(-1..1) slops it,
 * and at the brim a tilt spills a drip over the low side onto a wet ring.
 */
export function brimBowl(full = 1) {
  const root = new THREE.Group();
  root.name = 'brimBowl';
  const v = new VoxelBuilder();
  const T = [[0.12, 0.03, C.terraD], [0.16, 0.04, C.terra], [0.2, 0.06, '#7A4128'], [0.222, 0.08, '#6E3B22'], [0.225, 0.05, '#7E4529'], [0.232, 0.03, '#5C2F1B']];
  let y = 0;
  T.forEach(([r, h, col], i) => { prism(v, 0, y + h / 2, 0, r, i ? T[i - 1][0] : r, h, col, 12); y += h; });
  const RIM = y;
  prism(v, 0, 0.17, 0, 0.226, 0.226, 0.026, '#E8D6B4', 12); // cream band
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + Math.PI / 12; v.box(Math.sin(a) * 0.226, 0.17 + (i % 2 ? 0.008 : -0.008), Math.cos(a) * 0.226, 0.05, 0.01, 0.01, '#7A4128', a); }
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3; v.box(Math.sin(a) * 0.222, 0.24, Math.cos(a) * 0.222, 0.025, 0.05, 0.008, '#A0663E', a); } // glaze runs, a glint
  prism(v, 0, RIM + 0.004, 0, 0.205, 0.205, 0.008, '#3A2016', 12); // inner wall seen at the rim
  root.add(v.mesh());
  const wv = new VoxelBuilder();
  prism(wv, 0, 0, 0, 0.2, 0.2, 0.012, C.water, 12);
  wv.box(-0.06, 0.007, -0.04, 0.12, 0.003, 0.02, '#E6F2F6', 0.4);
  wv.box(0.05, 0.007, 0.06, 0.05, 0.003, 0.015, '#E6F2F6', -0.3);
  const water = wv.mesh({ outline: false });
  root.add(water);
  const dv = new VoxelBuilder();
  dv.box(0, -0.12, 0, 0.02, 0.24, 0.02, C.water);
  dv.box(0, -0.25, 0, 0.03, 0.03, 0.03, C.waterD);
  const drip = dv.mesh({ outline: false });
  root.add(drip);
  const wet = new VoxelBuilder();
  prism(wet, 0, 0.002, 0, 0.12, 0.12, 0.003, '#8A7C6A', 10);
  const ring2 = wet.mesh({ outline: false });
  root.add(ring2);
  let f = full, tilt = 0;
  function place() {
    water.position.y = 0.05 + f * (RIM - 0.056);
    water.rotation.z = tilt * 0.14 * (0.4 + 0.6 * f);
    const spill = f > 0.95 && Math.abs(tilt) > 0.35;
    drip.visible = spill;
    ring2.visible = spill;
    const s = Math.sign(tilt) || 1;
    drip.position.set(-s * 0.245, RIM, 0.0);
    ring2.position.set(-s * 0.3, 0, 0.02);
  }
  place();
  const shadow = shadowUnder(root, 0.32, 0.32, 0, 0, 0.45);
  return { root, setFull(x) { f = clamp(x, 0, 1); place(); }, setTilt(x) { tilt = clamp(x, -1, 1); place(); }, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

const BOOK_COLS = [C.maroon, '#2F5DB3', '#4F8F5A', C.goldD, '#C8423C', '#6B4A8C', '#2E6E6E', '#D98B3A', '#7A5434', '#E2B33C'];
/** n books standing in a row from (x0, y, z) along +X; some lean, some lie flat. Returns end x. */
function booksInto(v, x0, y, z, n, seed = 1, depth = 0.17, maxX = Infinity) {
  const r = rand(seed);
  let x = x0;
  for (let i = 0; i < n && x < maxX; i++) {
    const t = 0.025 + r() * 0.03, h = 0.16 + r() * 0.1, d = depth * (0.8 + r() * 0.2);
    const col = BOOK_COLS[Math.floor(r() * BOOK_COLS.length)];
    if (r() < 0.12 && i > 0) {
      // lying flat
      v.box(x + h / 2, y + t / 2, z, h, t, d, col);
      v.box(x + h / 2, y + t / 2, z + d / 2 + 0.001, h - 0.02, t * 0.4, 0.002, '#F6F0E2');
      x += h + 0.01;
      continue;
    }
    const lean = r() < 0.15 ? 0.22 : 0;
    boxR(v, x + t / 2 + Math.sin(lean) * h / 2, y + h / 2 * Math.cos(lean), z, t, h, d, col, 0, 0, -lean);
    if (!lean) {
      v.box(x + t / 2, y + h * 0.78, z + d / 2 + 0.001, t * 0.9, 0.012, 0.002, C.gold);
      v.box(x + t / 2, y + h * 0.3, z + d / 2 + 0.001, t * 0.6, 0.03, 0.002, '#F6F0E2');
    }
    x += t + 0.003 + (lean ? Math.sin(lean) * h : 0);
  }
  return x;
}

/**
 * The take-one shelf: a little two-board shelf (0.9 x 0.6 m) that stands on a stall, a chalk card
 * «တစ်ခုယူ၊ တစ်ခုထား» (take one, leave one), a few books. addBooks(n) / setBooks(n) (0-14).
 */
export function takeOneShelf({ books = 4 } = {}) {
  const root = new THREE.Group();
  root.name = 'takeOneShelf';
  const v = new VoxelBuilder();
  const W = 0.9, H = 0.6, D = 0.24;
  for (const s of [-1, 1]) {
    v.boxMin(s * W / 2 - 0.02, 0, -D / 2, s * W / 2 + 0.02, H, D / 2, jitter(C.woodL, 0.05, s + 3));
    v.box(s * W / 2, H + 0.02, 0, 0.06, 0.04, D + 0.02, C.woodD);
  }
  for (const y of [0, 0.3]) v.boxMin(-W / 2, y, -D / 2, W / 2, y + 0.025, D / 2, jitter(C.wood, 0.05, y * 9));
  v.boxMin(-W / 2, 0.29, D / 2 - 0.004, W / 2, 0.33, D / 2 + 0.012, C.woodD); // lip
  v.boxMin(-W / 2, 0, -D / 2 - 0.01, W / 2, H, -D / 2, '#8E6A45'); // back
  v.boxMin(-W / 2 - 0.03, H - 0.02, -D / 2 - 0.02, W / 2 + 0.03, H + 0.01, D / 2 + 0.02, C.woodD); // top
  root.add(v.mesh());
  const card = chalkSlate({ w: 0.42, h: 0.18, text: 'တစ်ခုယူ၊ တစ်ခုထား', lean: 0.12 }); // DRAFT Burmese (Maya to proofread)
  card.root.position.set(0.05, H + 0.01, 0.0);
  root.add(card.root);
  let n = books, bookMesh = null;
  function build() {
    freeMesh(bookMesh);
    const bv = new VoxelBuilder();
    const a = Math.min(n, 7), b = Math.max(0, n - 7);
    booksInto(bv, -W / 2 + 0.04, 0.025, 0, a, 7, 0.18, W / 2 - 0.08);
    booksInto(bv, -W / 2 + 0.06, 0.325, 0, b, 13, 0.18, W / 2 - 0.08);
    if (n < 7) bv.box(-W / 2 + 0.06 + a * 0.05 + 0.03, 0.1, 0.0, 0.015, 0.15, 0.1, C.iron); // a bookend
    bookMesh = bv.mesh({ px: 1.2 });
    root.add(bookMesh);
  }
  build();
  return { root, addBooks(k = 1) { n = clamp(n + k, 0, 14); build(); }, setBooks(k) { n = clamp(k, 0, 14); build(); }, get books() { return n; }, dispose() { card.dispose(); disposeTree(root); } };
}

/**
 * The school shelf «ကျောင်းစင်» (Quarter classroom): an open bookshelf 1.2 x 1.1 m, three boards, a
 * chalk label slate on top, half empty. setBooks(n) (0-30) or setFull(true) after the books are given.
 */
export function schoolShelf({ books = 11 } = {}) {
  const root = new THREE.Group();
  root.name = 'schoolShelf';
  const v = new VoxelBuilder();
  const W = 1.2, H = 1.1, D = 0.3;
  for (const s of [-1, 1]) {
    v.boxMin(s * W / 2 - 0.03, 0, -D / 2, s * W / 2 + 0.03, H, D / 2, jitter(C.wood, 0.05, s + 5));
    v.boxMin(s * W / 2 - 0.035, 0, D / 2 - 0.02, s * W / 2 + 0.035, 0.08, D / 2 + 0.01, C.woodD); // plinth
  }
  const BOARDS = [0.06, 0.4, 0.74];
  for (const y of [...BOARDS, H - 0.03]) v.boxMin(-W / 2, y, -D / 2, W / 2, y + 0.03, D / 2, jitter(C.woodL, 0.05, y * 7));
  for (const y of BOARDS) v.boxMin(-W / 2, y - 0.01, D / 2, W / 2, y + 0.03, D / 2 + 0.012, C.woodD);
  v.boxMin(-W / 2, 0, -D / 2 - 0.012, W / 2, H, -D / 2, '#E6D6B8'); // back board painted cream
  for (let i = 0; i < 5; i++) v.boxMin(-W / 2 + 0.1 + i * 0.25, 0.05, -D / 2 - 0.002, -W / 2 + 0.104 + i * 0.25, H - 0.05, -D / 2, '#CDBB98');
  v.boxMin(-W / 2 - 0.04, H, -D / 2 - 0.02, W / 2 + 0.04, H + 0.04, D / 2 + 0.03, C.woodD);
  v.boxMin(-W / 2, 0.0, D / 2, W / 2, 0.06, D / 2 + 0.01, C.woodD);
  // pupils' things on the boards: a slate, a jar of pencils, a paper plane
  prism(v, W / 2 - 0.12, 0.74 + 0.03 + 0.06, 0.02, 0.04, 0.04, 0.12, '#BFD3E0', 8);
  for (let k = 0; k < 4; k++) boxR(v, W / 2 - 0.13 + k * 0.012, 0.74 + 0.03 + 0.15, 0.02, 0.008, 0.12, 0.008, [C.red, C.mustard, C.blue, C.green][k], 0, 0, (k - 1.5) * 0.12);
  root.add(v.mesh());
  const label = chalkSlate({ w: 0.42, h: 0.2, text: 'ကျောင်းစင်', lean: 0 }); // DRAFT Burmese (Maya to proofread)
  label.root.position.set(0, H + 0.04, -0.02);
  root.add(label.root);
  let n = books, bookMesh = null;
  function build() {
    freeMesh(bookMesh);
    const bv = new VoxelBuilder();
    let left = n;
    BOARDS.forEach((y, i) => {
      const k = Math.min(left, 10);
      left -= k;
      const maxX = i === 2 ? W / 2 - 0.2 : W / 2 - 0.05;
      booksInto(bv, -W / 2 + 0.06 + (i === 1 ? 0.12 : 0), y + 0.03, 0.0, k, 31 + i * 5, 0.22, maxX);
    });
    if (n < 20) boatInto(bv, 0.3, 0.4 + 0.03, 0.04, 1.2, false, 0.3);
    bookMesh = bv.mesh({ px: 1.2 });
    root.add(bookMesh);
  }
  build();
  const shadow = shadowUnder(root, 0.75, 0.3, 0, 0.05, 0.4);
  return { root, setBooks(k) { n = clamp(k, 0, 30); build(); }, setFull(on) { n = on ? 30 : 11; build(); }, get books() { return n; }, dispose() { label.dispose(); shadow.geometry.dispose(); disposeTree(root); } };
}

// =============================================================================================
// ENVELOPE MARKET (Days 4-6)
// =============================================================================================
const STAMP = { red: ['#C8423C', '#A8322E', '#E07A6E'], green: ['#4F8F5A', '#3D7448', '#7FB287'], gold: ['#D9A93A', '#B98A28', '#ECCB78'], blue: ['#3E6FB8', '#2F5794', '#7EA2D6'], maroon: ['#6E1F2A', '#4A141C', '#A65A64'] };

const stampPrints = new Map();
/** The printed face of a giant stamp (cached per colour): a paper plane over a cloud, the value, a postmark. */
function stampPrint(color = 'red', striped = false) {
  const key = color + striped;
  if (stampPrints.has(key)) return stampPrints.get(key);
  const [F, FD, FL] = STAMP[color] || STAMP.red;
  const { g, tex } = makeCanvas(512, 320);
  live(tex, () => {
    const W = 512, H = 320;
    g.clearRect(0, 0, W, H);
    if (striped) {
      for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#F3E9D2' : F; g.fillRect(i * W / 8, 0, W / 8 + 1, H); }
    } else {
      const grd = g.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, FL); grd.addColorStop(0.55, F); grd.addColorStop(1, FD);
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      // a cloud and a sun, a paper plane flying up with a dotted trail
      g.fillStyle = 'rgba(255,248,236,0.95)';
      for (const [x, y, r] of [[150, 220, 46], [205, 200, 58], [265, 222, 44], [110, 240, 32], [300, 244, 30]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
      g.fillRect(100, 236, 230, 40);
      g.fillStyle = 'rgba(255,236,190,0.9)';
      g.beginPath(); g.arc(420, 80, 34, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FFFDF8';
      g.beginPath(); g.moveTo(200, 150); g.lineTo(380, 70); g.lineTo(260, 172); g.closePath(); g.fill();
      g.fillStyle = '#E6DCC8';
      g.beginPath(); g.moveTo(380, 70); g.lineTo(246, 160); g.lineTo(262, 192); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,253,248,0.9)'; g.lineWidth = 5; g.setLineDash([10, 12]);
      g.beginPath(); g.moveTo(60, 200); g.quadraticCurveTo(110, 120, 196, 152); g.stroke(); g.setLineDash([]);
      // the value in a corner box
      g.fillStyle = 'rgba(255,253,248,0.92)'; g.fillRect(24, 22, 92, 70);
      fitText(g, '၅', 70, 60, 70, 56, { color: FD }); // stamp value (numeral)
    }
    // thin frame, and a soft postmark over one corner
    g.strokeStyle = striped ? FD : 'rgba(255,253,248,0.85)'; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, H - 20);
    // a tidy round postmark (double ring, the market's name, a row of date dots) with three even
    // wavy cancel lines running out to its left
    const PX = W - 96, PY = H - 84;
    g.strokeStyle = 'rgba(40,30,45,0.6)'; g.fillStyle = 'rgba(40,30,45,0.6)'; g.lineCap = 'round';
    g.lineWidth = 5; g.beginPath(); g.arc(PX, PY, 50, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.arc(PX, PY, 40, 0, Math.PI * 2); g.stroke();
    fitText(g, 'ဈေး', PX, PY - 8, 56, 24, { color: 'rgba(40,30,45,0.65)' }); // DRAFT Burmese (Maya to proofread)
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.arc(PX + i * 10, PY + 18, 2.5, 0, Math.PI * 2); g.fill(); }
    g.lineWidth = 4;
    for (let k = -1; k <= 1; k++) {
      g.beginPath();
      for (let x = PX - 230; x <= PX - 62; x += 4) { const y = PY + k * 18 + Math.sin((x - PX) * 0.07) * 6; if (x === PX - 230) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
    }
  });
  const mat = basic(PALETTE.white, { map: tex });
  stampPrints.set(key, mat);
  return mat;
}
/** Adds the printed face as a quad on a stamp sheet built by stampSheet (same matrix), into root. */
function stampFace(root, w, d, color, striped, matrix, t = 0.04) {
  const B = Math.min(w, d) * 0.07;
  const fw = w - 0.1 - 2 * B, fd = d - 0.1 - 2 * B;
  const geo = new THREE.PlaneGeometry(fw, fd);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, t / 2 + 0.006, 0);
  geo.applyMatrix4(matrix);
  const m = new THREE.Mesh(geo, stampPrint(color, striped));
  root.add(m);
  return m;
}

/**
 * A postage-stamp sheet lying in the XZ plane (top face up), w along X, d along Z, centred: white
 * perforated border (teeth all round), coloured field, thin frame, a white paper-plane motif, a
 * postmark (ring and waves). striped: field in colour/cream stripes running front to back.
 */
function stampSheet(w, d, color = 'red', { striped = false, seed = 1, motif = true, t = 0.04 } = {}) {
  const v = new VoxelBuilder();
  const [F, FD, FL] = STAMP[color] || STAMP.red;
  const B = Math.min(w, d) * 0.07; // border width
  v.box(0, 0, 0, w - 0.1, t, d - 0.1, '#FBF7EE'); // white paper
  // perforations: teeth along every edge with round-ish gaps
  const tooth = 0.1;
  for (const [len, along, sgn] of [[w, 'x', 1], [w, 'x', -1], [d, 'z', 1], [d, 'z', -1]]) {
    const n = Math.floor((len - 0.1) / tooth);
    for (let i = 0; i < n; i++) {
      const p = -((n - 1) * tooth) / 2 + i * tooth;
      if (along === 'x') v.box(p, 0, sgn * (d / 2 - 0.05 + 0.025), tooth * 0.55, t, 0.05, '#FBF7EE');
      else v.box(sgn * (w / 2 - 0.05 + 0.025), 0, p, 0.05, t, tooth * 0.55, '#FBF7EE');
    }
  }
  const fw = w - 0.1 - 2 * B, fd = d - 0.1 - 2 * B;
  if (striped) {
    const n = Math.max(3, Math.round(fw / 0.32));
    for (let i = 0; i < n; i++) v.box(-fw / 2 + (i + 0.5) * (fw / n), t / 2 + 0.002, 0, fw / n + 0.002, 0.006, fd, i % 2 ? '#F3E9D2' : F);
  } else v.box(0, t / 2 + 0.002, 0, fw, 0.006, fd, F);
  // a thin frame line inside the border
  for (const s of [-1, 1]) {
    v.box(0, t / 2 + 0.004, s * (fd / 2 + B * 0.35), fw + B * 0.7, 0.006, 0.02, FD);
    v.box(s * (fw / 2 + B * 0.35), t / 2 + 0.004, 0, 0.02, 0.006, fd + B * 0.7, FD);
  }
  if (motif === 'blocks' && !striped) {
    // paper plane, flying up-right (in the sheet's plane: x right, -z = "up" on the stamp)
    const pv = (x, z, ww, dd, col) => v.box(x, t / 2 + 0.008, z, ww, 0.006, dd, col);
    const s = Math.min(fw, fd) * 0.32;
    for (let i = 0; i < 5; i++) pv(-s * 0.5 + i * s * 0.22, s * 0.25 - i * s * 0.14, s * (1.1 - i * 0.2), s * 0.12, FL);
    pv(-s * 0.1, s * 0.12, s * 0.6, s * 0.05, '#FFF8EE');
    // a sun and the denomination bar
    ring(v, fw / 2 - s * 0.45, t / 2 + 0.008, -fd / 2 + s * 0.45, s * 0.16, 10, s * 0.06, 0.006, '#FFF3D6');
    pv(-fw / 2 + s * 0.4, fd / 2 - s * 0.25, s * 0.5, s * 0.1, '#FFF3D6');
    pv(-fw / 2 + s * 0.4, fd / 2 - s * 0.42, s * 0.3, s * 0.06, '#FFF3D6');
  }
  if (motif === 'blocks') {
    // postmark: a ring and three waves across one corner, in dark ink
    const cx = w / 2 - B - 0.25, cz = d / 2 - B - 0.2;
    const R = Math.min(w, d) * 0.15;
    for (let i = 0; i < 16; i++) {
      if (i % 4 === 3) continue;
      const a = (i / 16) * Math.PI * 2;
      boxR(v, cx + Math.cos(a) * R, t / 2 + 0.012, cz + Math.sin(a) * R, 0.03, 0.004, (2 * Math.PI * R) / 16 + 0.01, '#3B3340', 0, -a, 0);
    }
    for (let k = 0; k < 3; k++) for (let i = 0; i < 6; i++) {
      boxR(v, cx - R * 1.4 - i * 0.12, t / 2 + 0.012, cz - R * 0.5 + k * R * 0.5 + Math.sin(i * 1.4) * 0.03, 0.12, 0.004, 0.025, '#3B3340', 0, Math.cos(i * 1.4) * 0.35, 0);
    }
  }
  return v;
}

/**
 * A Market stall whose awning is a giant postage stamp (white perforated edges round a coloured field),
 * 3.0 w x 2.0 h x 1.6 d, open front, with a cloth-skirted counter. opts: { color: 'red'|'green'|'gold'|
 * 'blue'|'maroon', striped = false, counter = true }. Door variant (Day 6, over the tea-shop door):
 * { door: true, w = 2.4, y = 2.55 }: a wall-mounted striped awning printed with big stamp shapes and a
 * perforated valance; origin at the wall foot (wall at z = 0), the awning reaching 0.9 m out.
 * Returns { root, counterTop, dispose }.
 */
export function stampAwning({ color = 'red', striped = false, door = false, w, y = 2.55, counter = true } = {}) {
  const root = new THREE.Group();
  root.name = door ? 'stampAwningDoor' : 'stampAwning';
  const v = new VoxelBuilder();
  const [F, FD] = STAMP[color] || STAMP.red;
  if (door) {
    const W = w ?? 2.4, OUT = 0.95, drop = 0.35;
    const ang = Math.atan2(drop, OUT);
    const len = Math.hypot(drop, OUT);
    // the striped canvas with three stamp shapes printed on it
    const sv = new VoxelBuilder();
    const n = Math.round(W / 0.3);
    for (let i = 0; i < n; i++) sv.box(-W / 2 + (i + 0.5) * (W / n), 0, 0, W / n + 0.002, 0.03, len, i % 2 ? '#F3E9D2' : F);
    for (const k of [-1, 0, 1]) {
      const st = stampSheet(0.52, 0.42, color === 'gold' ? 'maroon' : 'gold', { motif: false, t: 0.01, seed: k + 3 });
      _m.compose(_p.set(k * W * 0.32, 0.02, 0.0), _q.identity(), _s.set(1, 1, 1));
      sv.merge(st, _m);
    }
    // perforated valance: a hanging strip of teeth along the front edge
    _m.compose(_p.set(0, y - drop / 2, OUT / 2), _q.setFromEuler(_e.set(ang, 0, 0)), _s.set(1, 1, 1));
    v.merge(sv, _m);
    const base = _m.clone();
    const faces = [-1, 0, 1].map((k) => stampFace(root, 0.52, 0.42, color === 'gold' ? 'maroon' : 'gold', false, base.clone().multiply(new THREE.Matrix4().makeTranslation(k * W * 0.32, 0.02, 0)), 0.01));
    const merged = new THREE.Mesh(mergeGeometries(faces.map((f) => f.geometry), false), faces[0].material);
    for (const f of faces) { f.geometry.dispose(); f.removeFromParent(); }
    root.add(merged);
    v.box(0, y - drop - 0.09, OUT + 0.01, W, 0.16, 0.025, '#FBF7EE');
    for (let i = 0; i < Math.floor(W / 0.1); i++) v.box(-W / 2 + 0.05 + i * 0.1, y - drop - 0.19, OUT + 0.01, 0.055, 0.05, 0.025, '#FBF7EE');
    v.box(0, y - drop - 0.07, OUT + 0.025, W - 0.1, 0.03, 0.01, F);
    v.box(0, y - drop - 0.12, OUT + 0.025, W - 0.1, 0.012, 0.01, FD);
    // wall batten and two iron brackets with a curl
    v.box(0, y + 0.03, 0.03, W + 0.1, 0.1, 0.06, C.woodD);
    for (const s of [-1, 1]) {
      const x = s * (W / 2 - 0.12);
      boxR(v, x, y - 0.4, 0.42, 0.035, 0.035, 0.95, C.iron, -0.75, 0, 0);
      v.box(x, y - 0.75, 0.04, 0.08, 0.12, 0.04, C.iron);
      ring(v, x, y - 0.42, 0.22, 0.07, 8, 0.02, 0.02, C.iron);
    }
    root.add(v.mesh());
    return { root, dispose() { disposeTree(root); } };
  }
  const W = w ?? 3.0, D = 1.6, HB = 2.0, HF = 1.78;
  // posts: bamboo-ish wood with dark feet and gold caps
  for (const [x, z, h] of [[-W / 2 + 0.08, -D / 2 + 0.08, HB], [W / 2 - 0.08, -D / 2 + 0.08, HB], [-W / 2 + 0.08, D / 2 - 0.08, HF], [W / 2 - 0.08, D / 2 - 0.08, HF]]) {
    v.box(x, h / 2, z, 0.08, h, 0.08, jitter(C.wood, 0.05, x * 3 + z));
    v.box(x, 0.05, z, 0.14, 0.1, 0.14, C.stoneD);
    for (const yy of [0.5, 1.1]) v.box(x, yy, z, 0.095, 0.03, 0.095, C.woodD);
  }
  // side rails, back rail with hooks
  for (const s of [-1, 1]) v.box(s * (W / 2 - 0.08), 1.65, 0, 0.05, 0.05, D - 0.16, C.woodD);
  v.box(0, 1.55, -D / 2 + 0.08, W - 0.16, 0.05, 0.05, C.woodD);
  for (let i = 0; i < 5; i++) v.box(-1 + i * 0.5, 1.5, -D / 2 + 0.1, 0.02, 0.08, 0.02, C.iron);
  // the stamp awning, sloping to the front, overhanging all round
  const ang = Math.atan2(HB - HF, D - 0.16);
  const st = stampSheet(W + 0.3, D + 0.45, color, { striped, seed: W * 7, motif: false });
  _m.compose(_p.set(0, (HB + HF) / 2 + 0.05, 0.08), _q.setFromEuler(_e.set(ang, 0, 0)), _s.set(1, 1, 1));
  v.merge(st, _m);
  stampFace(root, W + 0.3, D + 0.45, color, striped, _m);
  // underside shade line and the front edge beam
  v.box(0, HF + 0.02, D / 2 - 0.08, W - 0.1, 0.06, 0.06, C.woodD);
  v.box(0, HB + 0.02, -D / 2 + 0.08, W - 0.1, 0.06, 0.06, C.woodD);
  let counterTop = 0;
  if (counter) {
    // counter across the front: plank top, cloth skirt in the stall's colour with a cream hem
    const CT = 0.82;
    counterTop = CT + 0.04;
    v.boxMin(-W / 2 + 0.15, CT, D / 2 - 0.62, W / 2 - 0.15, CT + 0.04, D / 2 - 0.12, jitter(C.woodL, 0.04, 9));
    v.boxMin(-W / 2 + 0.17, 0.08, D / 2 - 0.15, W / 2 - 0.17, CT, D / 2 - 0.11, F);
    for (let i = 0; i < 8; i++) v.box(-W / 2 + 0.35 + i * ((W - 0.7) / 7), CT / 2 + 0.04, D / 2 - 0.105, 0.03, CT - 0.1, 0.008, FD);
    v.boxMin(-W / 2 + 0.17, 0.08, D / 2 - 0.115, W / 2 - 0.17, 0.16, D / 2 - 0.1, '#F3E9D2');
    for (const s of [-1, 1]) v.boxMin(s * (W / 2 - 0.2) - 0.03, 0, D / 2 - 0.6, s * (W / 2 - 0.2) + 0.03, CT, D / 2 - 0.54, C.woodD);
    // a low back bench with a cloth bundle
    v.boxMin(-W / 2 + 0.2, 0.4, -D / 2 + 0.15, W / 2 - 0.2, 0.45, -D / 2 + 0.5, C.wood);
    for (const s of [-1, 1]) v.boxMin(s * (W / 2 - 0.3) - 0.03, 0, -D / 2 + 0.2, s * (W / 2 - 0.3) + 0.03, 0.4, -D / 2 + 0.45, C.woodD);
    v.box(-0.8, 0.52, -D / 2 + 0.32, 0.4, 0.14, 0.26, '#E6D3AE', 0.2);
    v.box(-0.8, 0.6, -D / 2 + 0.32, 0.06, 0.04, 0.27, F, 0.2);
  }
  root.add(v.mesh());
  const shadow = shadowUnder(root, W * 0.62, D * 0.65, 0, 0.1, 0.4);
  return { root, counterTop, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

/** Plane geometry mapped to a UV rect of an atlas (u0, v0 top-left .. u1, v1 bottom-right in 0..1 from the top). */
function uvQuad(w, h, u0, t0, u1, t1, matrix) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), 1 - (t0 + (1 - uv.getY(i)) * (t1 - t0)));
  if (matrix) g.applyMatrix4(matrix);
  return g;
}

/** A plank door 1.4 x 2.3 into v on a wall front at z, bottom y0: frame, battens, a lattice light, brass pull, step. */
function doorInto(v, x, y0, z, { w = 1.4, h = 2.3, panel = C.maroon, frame = C.gold, step = true } = {}) {
  const f = 0.1;
  for (let i = 0; i < 5; i++) v.boxMin(x - w / 2 + (i * w) / 5 + 0.004, y0, z - 0.04, x - w / 2 + ((i + 1) * w) / 5, y0 + h, z + 0.02, jitter(panel, 0.06, i + 3));
  for (const yy of [0.35, h - 0.55]) v.boxMin(x - w / 2 + 0.06, y0 + yy, z + 0.02, x + w / 2 - 0.06, y0 + yy + 0.12, z + 0.05, shadeHex(panel, 0.75));
  boxR(v, x, y0 + (h - 0.2) / 2 + 0.05, z + 0.035, 0.08, Math.hypot(w - 0.2, h - 1.2), 0.02, shadeHex(panel, 0.75), 0, 0, Math.atan2(w - 0.2, h - 1.2));
  // the light: a small lattice window near the top
  v.boxMin(x - 0.32, y0 + h - 0.42, z + 0.02, x + 0.32, y0 + h - 0.12, z + 0.04, C.sky);
  for (let i = 0; i < 4; i++) v.box(x - 0.24 + i * 0.16, y0 + h - 0.27, z + 0.05, 0.025, 0.3, 0.02, frame);
  v.box(x, y0 + h - 0.27, z + 0.05, 0.64, 0.025, 0.02, frame);
  // frame, lintel with a keystone, jamb plinths
  v.boxMin(x - w / 2 - f, y0, z - 0.03, x - w / 2, y0 + h + f, z + 0.09, frame);
  v.boxMin(x + w / 2, y0, z - 0.03, x + w / 2 + f, y0 + h + f, z + 0.09, frame);
  v.boxMin(x - w / 2 - f - 0.05, y0 + h + f, z - 0.03, x + w / 2 + f + 0.05, y0 + h + f + 0.08, z + 0.13, shadeHex(frame, 0.85));
  v.box(x, y0 + h + 0.08, z + 0.11, 0.16, 0.16, 0.05, shadeHex(frame, 1.1));
  for (const s of [-1, 1]) v.boxMin(x + s * (w / 2 + f / 2) - 0.08, y0, z - 0.03, x + s * (w / 2 + f / 2) + 0.08, y0 + 0.2, z + 0.12, shadeHex(frame, 0.75));
  // brass pull, hinges, kick plate
  v.box(x + w / 2 - 0.2, y0 + 1.1, z + 0.07, 0.05, 0.22, 0.05, C.gold);
  v.box(x + w / 2 - 0.2, y0 + 1.1, z + 0.04, 0.09, 0.3, 0.02, C.goldD);
  for (const hy of [0.4, h - 0.4]) v.box(x - w / 2 + 0.1, y0 + hy, z + 0.035, 0.18, 0.05, 0.02, C.iron);
  v.boxMin(x - w / 2 + 0.04, y0 + 0.02, z + 0.02, x + w / 2 - 0.04, y0 + 0.14, z + 0.045, C.goldD);
  if (step) v.boxMin(x - w / 2 - 0.25, 0, z, x + w / 2 + 0.25, y0, z + 0.45, C.stone);
}
function shadeHex(hex, k) {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, c.r * k); c.g = Math.min(1, c.g * k); c.b = Math.min(1, c.b * k);
  return '#' + c.getHexString(THREE.SRGBColorSpace);
}
/** A window into v: frame, sill on brackets, shutters open, a dark room with a hint of a shelf. */
function windowInto(v, x, y, z, w, h, { frame = C.cream, shutter = C.teal, sill = C.goldD, glow = '#3E2E22' } = {}) {
  v.boxMin(x - w / 2, y - h / 2, z - 0.06, x + w / 2, y + h / 2, z - 0.02, glow);
  v.boxMin(x - w / 2 + 0.05, y - h * 0.1, z - 0.05, x + w / 2 - 0.05, y - h * 0.1 + 0.03, z - 0.01, C.woodD); // shelf inside
  for (let i = 0; i < 4; i++) prism(v, x - w / 2 + 0.16 + i * (w - 0.3) / 3, y - h * 0.1 + 0.08, z - 0.035, 0.035, 0.03, 0.1, [C.terra, C.terraL, '#7A4128', C.terra][i], 6);
  const f = 0.07;
  v.boxMin(x - w / 2 - f, y - h / 2, z - 0.02, x - w / 2, y + h / 2, z + 0.06, frame);
  v.boxMin(x + w / 2, y - h / 2, z - 0.02, x + w / 2 + f, y + h / 2, z + 0.06, frame);
  v.boxMin(x - w / 2 - f, y + h / 2, z - 0.02, x + w / 2 + f, y + h / 2 + f, z + 0.08, frame);
  v.box(x, y, z + 0.0, 0.04, h, 0.03, frame);
  v.boxMin(x - w / 2 - 0.12, y - h / 2 - 0.07, z - 0.02, x + w / 2 + 0.12, y - h / 2, z + 0.16, sill);
  for (const s of [-1, 1]) {
    v.box(x + s * (w / 2 - 0.08), y - h / 2 - 0.13, z + 0.08, 0.05, 0.1, 0.1, sill);
    // shutter open against the wall, with louvres
    const sx = x + s * (w / 2 + f + w / 4 + 0.02);
    v.boxMin(sx - w / 4, y - h / 2, z, sx + w / 4, y + h / 2, z + 0.04, shutter);
    for (let k = 0; k < 5; k++) v.box(sx, y - h / 2 + 0.12 + k * (h - 0.24) / 4, z + 0.05, w / 2 - 0.08, 0.025, 0.02, shadeHex(shutter, 0.78));
  }
}

/**
 * A small shell building: plaster walls with skirting and corner pilasters, a pitched tile roof with
 * gable ends and rafter tails, a plank door in the middle of the front (+Z) wall, windows either side.
 * Returns the door's foot point { x, z } (front of the step).
 */
function shellInto(v, { w = 6, d = 4, h = 3, wall = C.plaster, wallD = C.plasterD, trim = C.maroon, roof = C.tile, roofD = C.tileD, door = {}, windows = true, seed = 1, winOpts = {} } = {}) {
  const Z = d / 2, y0 = 0.22;
  v.boxMin(-w / 2 - 0.1, 0, -Z - 0.1, w / 2 + 0.1, y0, Z + 0.1, C.stoneD); // plinth
  v.boxMin(-w / 2, y0, -Z, w / 2, h, Z, wall);
  // plaster patches and wall panelling on the front
  const r = rand(seed);
  for (let i = 0; i < 6; i++) v.box(-w / 2 + 0.6 + r() * (w - 1.2), y0 + 0.6 + r() * (h - 1.2), Z + 0.004, 0.2 + r() * 0.4, 0.12 + r() * 0.2, 0.01, jitter(wall, 0.05, i + seed));
  v.boxMin(-w / 2 - 0.02, y0, Z - 0.02, w / 2 + 0.02, y0 + 0.3, Z + 0.035, wallD); // skirting
  v.boxMin(-w / 2 - 0.03, h - 0.18, Z - 0.02, w / 2 + 0.03, h, Z + 0.06, trim); // cornice
  v.boxMin(-w / 2 - 0.03, h - 0.24, Z + 0.01, w / 2 + 0.03, h - 0.2, Z + 0.07, C.gold);
  for (const s of [-1, 1]) v.boxMin(s * w / 2 - 0.12, y0, Z - 0.1, s * w / 2 + 0.06 * s + (s < 0 ? 0.12 : -0.0), h, Z + 0.05, wallD); // pilasters
  doorInto(v, door.x ?? 0, y0, Z + 0.02, { step: true, ...door });
  if (windows) for (const s of [-1, 1]) windowInto(v, s * Math.min(w / 2 - 1.0, 1.9), y0 + 1.45, Z + 0.02, 0.95, 0.9, winOpts);
  // the roof: tiles in rows on both slopes, ridge, gable ends, rafter tails along the front eave
  const OH = 0.4, RH = Math.min(1.4, d * 0.32);
  const run = Z + OH;
  const ang = Math.atan2(RH, run);
  const len = Math.hypot(RH, run);
  const rows = Math.round(len / 0.24);
  for (const s of [-1, 1]) {
    for (let i = 0; i < rows; i++) {
      const t = (i + 0.5) / rows;
      const zz = s * run * (1 - t), yy = h + RH * t;
      boxR(v, 0, yy + 0.04, zz, w + 2 * OH * 0.6, 0.07, len / rows + 0.03, jitter(i % 2 ? roof : roofD, 0.04, i + (s > 0 ? 0 : 40)), s * ang, 0, 0);
    }
    for (let k = 0; k < Math.floor((w + OH) / 0.45); k++) v.box(-w / 2 - OH * 0.3 + 0.2 + k * 0.45, h + 0.02, s * (Z + OH * 0.55), 0.06, 0.07, OH * 0.9, C.woodD);
  }
  v.box(0, h + RH + 0.08, 0, w + 2 * OH * 0.6 + 0.05, 0.12, 0.2, roofD);
  // gable ends: stepped plaster triangles with a round vent
  for (const s of [-1, 1]) {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      v.box(s * (w / 2 - 0.02), h + RH * (t + 0.5 / n), 0, 0.06, RH / n + 0.01, 2 * Z * (1 - t - 0.5 / n), wall);
    }
    prism(v, s * (w / 2 + 0.01), h + RH * 0.4, 0, 0.12, 0.12, 0.04, C.woodD, 8, 0, 0, Math.PI / 2);
  }
  return { x: door.x ?? 0, z: Z + 0.5 };
}

/**
 * The flag board over the Market post office door: a long plank with 16 small reply flags on pulleys
 * (masts, iron wheels, cords running into the wall) and Burmese numerals under them, ၁ at the east (+X)
 * end, ၁၆ at the west. setFlag(n, up 0..1) (n = 1..flags); flag ၁၄ starts DOWN, the rest up.
 * flagAnchor(n, target) -> world position of pulley n (the kite line ties to ၁၄). Origin at the board's
 * back centre (fix it to a wall at z = 0), the board's bottom at y = 0.
 */
export function flagBoard({ flags = 16, spacing = 0.34, down = [14] } = {}) {
  const root = new THREE.Group();
  root.name = 'flagBoard';
  const W = (flags - 1) * spacing + 0.4;
  const v = new VoxelBuilder();
  v.box(0, 0.1, 0.04, W, 0.2, 0.08, C.woodL);
  v.box(0, 0.21, 0.05, W + 0.06, 0.03, 0.1, C.woodD);
  v.box(0, -0.01, 0.05, W + 0.06, 0.03, 0.1, C.woodD);
  const MAST = 0.42;
  const xs = [];
  for (let i = 0; i < flags; i++) {
    const x = W / 2 - 0.2 - i * spacing;
    xs.push(x);
    v.box(x, 0.22 + MAST / 2, 0.06, 0.018, MAST, 0.018, C.iron); // mast
    prismZ(v, x, 0.24 + MAST, 0.06, 0.035, 0.025, C.ironL, 8); // pulley wheel
    v.box(x, 0.24 + MAST, 0.06, 0.012, 0.012, 0.04, C.goldD);
    v.box(x + 0.03, 0.22 + MAST / 2, 0.06, 0.006, MAST, 0.006, C.string); // cord
    v.box(x + 0.03, 0.12, 0.03, 0.03, 0.03, 0.03, C.soot); // where it runs in
  }
  root.add(v.mesh());
  // numerals strip
  const { g, tex } = makeCanvas(1024, 64);
  live(tex, () => {
    g.fillStyle = '#F3E9D2';
    g.fillRect(0, 0, 1024, 64);
    const cw = 1024 / flags;
    for (let i = 0; i < flags; i++) { g.fillStyle = i % 2 ? '#EDE1C6' : '#F3E9D2'; g.fillRect(i * cw, 0, cw, 64); }
    for (let i = 0; i < flags; i++) {
      fitText(g, myNum(i + 1), (flags - 1 - i + 0.5) * cw, 34, cw - 6, 40, { color: '#4A141C' });
    }
  });
  const strip = picture(tex, (flags) * spacing, 0.13);
  strip.position.set(-0.0 + (xs[0] + xs[flags - 1]) / 2, 0.1, 0.082);
  root.add(strip);
  // flags: one instanced pennant (two draw calls with its outline)
  const fv = new VoxelBuilder();
  fv.box(0.07, 0, 0, 0.12, 0.09, 0.008, C.red);
  fv.box(0.07, 0.0, 0.005, 0.12, 0.02, 0.003, '#FBF7EE');
  fv.box(0.14, 0.03, 0, 0.03, 0.03, 0.008, C.red);
  fv.box(0.14, -0.03, 0, 0.03, 0.03, 0.008, C.red);
  fv.box(0.005, 0, 0, 0.012, 0.11, 0.014, C.goldD);
  const fgeo = fv.geometry();
  const fl = new THREE.InstancedMesh(fgeo, toon('#ffffff', { vertexColors: true }), flags);
  root.add(fl);
  addOutline(fl, { px: 1.2 });
  const ups = new Array(flags).fill(1);
  for (const n of down) if (n >= 1 && n <= flags) ups[n - 1] = 0;
  const dummy = new THREE.Object3D();
  function place(i) {
    const u = ups[i];
    dummy.position.set(xs[i] + 0.01, 0.3 + u * (MAST - 0.12), 0.075);
    dummy.rotation.set(0, 0, -(1 - u) * 1.25); // limp when down
    dummy.updateMatrix();
    fl.setMatrixAt(i, dummy.matrix);
  }
  for (let i = 0; i < flags; i++) place(i);
  function setFlag(n, up) {
    if (n < 1 || n > flags) return;
    ups[n - 1] = clamp(up, 0, 1);
    place(n - 1);
    fl.instanceMatrix.needsUpdate = true;
  }
  function flagAnchor(n, target = new THREE.Vector3()) {
    root.updateWorldMatrix(true, false);
    return target.set(xs[clamp(n, 1, flags) - 1], 0.24 + MAST, 0.06).applyMatrix4(root.matrixWorld);
  }
  return { root, setFlag, flagAnchor, width: W, dispose() { fgeo.dispose(); fl.dispose(); disposePictures(root); disposeTree(root); } };
}

/** A building sign board (canvas) into the root: framed plank with Burmese text. Returns the picture. */
function signBoard(root, v, lines, { x = 0, y, z, w, h, bg = '#F3E9D2', border = C.maroon, ink = '#4A141C', frame = C.woodD } = {}) {
  v.box(x, y, z - 0.02, w + 0.12, h + 0.12, 0.05, frame);
  v.box(x, y + h / 2 + 0.07, z, w + 0.2, 0.04, 0.08, C.gold);
  const PX = 512, PY = Math.round((512 * h) / w);
  const tex = signTexture(lines, { width: PX, height: PY, bg, border, color: ink, radius: 10, borderWidth: 8 });
  const redo = () => {
    const t2 = signTexture(lines, { width: PX, height: PY, bg, border, color: ink, radius: 10, borderWidth: 8 });
    tex.image.getContext('2d').drawImage(t2.image, 0, 0);
    t2.dispose();
    tex.needsUpdate = true;
  };
  fontsReady().then(redo);
  const m = picture(tex, w, h);
  m.position.set(x, y, z + 0.008);
  root.add(m);
  return m;
}

/**
 * The Market post office, outside shell (Day 4 `letterCounter` outdoors): a low cream building, a plank
 * door in the middle of its front, windows with blue shutters, a red letter box by the door, the sign
 * «စာတိုက်», and the flag board of 16 reply flags over the door. setFlag / flagAnchor as flagBoard.
 * door: local { x, z } in front of the step. Origin at the building's ground centre.
 */
export function letterCounter({ flags = 16, w = 7, d = 4.2, h = 4.05 } = {}) {
  const root = new THREE.Group();
  root.name = 'postOffice';
  const v = new VoxelBuilder();
  const door = shellInto(v, { w, d, h, wall: '#EFE4CC', wallD: '#D9C9A8', trim: C.maroon, roof: '#8E3A2E', roofD: '#6E2A22', door: { panel: '#2F5794', frame: C.gold }, winOpts: { shutter: '#3E6FB8' }, seed: 3 });
  const Z = d / 2;
  // red letter box on a post, right of the door
  v.box(1.25, 0.6, Z + 0.35, 0.08, 1.0, 0.08, C.iron);
  v.boxMin(1.05, 1.0, Z + 0.2, 1.45, 1.5, Z + 0.5, C.red);
  v.boxMin(1.03, 1.5, Z + 0.18, 1.47, 1.56, Z + 0.52, '#A8322E');
  v.box(1.25, 1.36, Z + 0.505, 0.24, 0.04, 0.01, C.soot);
  v.box(1.25, 1.18, Z + 0.505, 0.16, 0.12, 0.01, C.gold);
  // envelope motif pressed into the cornice
  for (const s of [-1, 1]) {
    const x = s * (w / 2 - 0.6);
    v.box(x, h - 0.6, Z + 0.03, 0.5, 0.32, 0.03, C.paper);
    boxR(v, x - 0.12, h - 0.53, Z + 0.05, 0.3, 0.025, 0.01, C.maroon, 0, 0, -0.5);
    boxR(v, x + 0.12, h - 0.53, Z + 0.05, 0.3, 0.025, 0.01, C.maroon, 0, 0, 0.5);
  }
  // DRAFT Burmese (Maya to proofread): post office sign
  signBoard(root, v, [{ text: 'စာတိုက်', size: 74 }], { y: h - 0.36, z: Z + 0.1, w: 1.5, h: 0.4 });
  root.add(v.mesh());
  const fb = flagBoard({ flags });
  fb.root.position.set(0, 2.8, Z + 0.02);
  root.add(fb.root);
  const shadow = shadowUnder(root, w * 0.62, d * 0.7, 0, 0.1, 0.4);
  return { root, setFlag: fb.setFlag, flagAnchor: fb.flagAnchor, door, flagBoard: fb, dispose() { fb.dispose(); shadow.geometry.dispose(); disposePictures(root); disposeTree(root); } };
}

/** Small clay teapot (0.18 m) into v. chipped: Ko Phyo's plain pot with a chip in the lid. */
function teapotInto(v, x, y, z, s = 1, chipped = false, ry = 0) {
  const P = new VoxelBuilder();
  const body = chipped ? '#9E5A3A' : C.terra, dark = chipped ? '#7E4630' : C.terraD, light = chipped ? '#B06A48' : C.terraL;
  prism(P, 0, 0.012, 0, 0.05, 0.05, 0.024, dark, 8);
  prism(P, 0, 0.05, 0, 0.085, 0.06, 0.05, body, 8);
  prism(P, 0, 0.095, 0, 0.07, 0.085, 0.04, light, 8);
  prism(P, 0, 0.122, 0, 0.045, 0.07, 0.018, body, 8);
  prism(P, 0, 0.138, 0, 0.042, 0.042, 0.014, dark, 8);
  prism(P, 0, 0.155, 0, 0.012, 0.012, 0.02, dark, 6); // knob
  if (!chipped) prism(P, 0, 0.075, 0, 0.087, 0.087, 0.012, '#EBDCBF', 8);
  else P.box(0.03, 0.142, 0.02, 0.025, 0.012, 0.02, '#D9B48C'); // the chip
  // spout (to +X) and handle (to -X)
  boxR(P, 0.1, 0.085, 0, 0.06, 0.022, 0.022, body, 0, 0, 0.6);
  boxR(P, 0.13, 0.11, 0, 0.03, 0.018, 0.018, dark, 0, 0, 0.9);
  P.box(-0.1, 0.11, 0, 0.02, 0.02, 0.018, dark);
  P.box(-0.1, 0.06, 0, 0.02, 0.02, 0.018, dark);
  P.box(-0.115, 0.085, 0, 0.018, 0.07, 0.018, dark);
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(s, s, s));
  v.merge(P, _m);
}
/** A small clay teapot, 0.18 m. opts: { chipped } (Ko Phyo's plain pot). */
export function smallTeapot({ chipped = false } = {}) {
  const root = new THREE.Group();
  root.name = 'smallTeapot';
  const v = new VoxelBuilder();
  teapotInto(v, 0, 0, 0, 1.1, chipped);
  root.add(v.mesh({ px: 1.2 }));
  return { root, dispose() { disposeTree(root); } };
}

/** Low stool (0.3 m) into v. */
function stoolInto(v, x, z, col = C.wood, seed = 1, h = 0.28) {
  v.boxMin(x - 0.16, h - 0.04, z - 0.16, x + 0.16, h, z + 0.16, jitter(col, 0.06, seed));
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) v.box(x + dx * 0.12, (h - 0.04) / 2, z + dz * 0.12, 0.04, h - 0.04, 0.04, C.woodD);
  v.boxMin(x - 0.12, 0.08, z - 0.02, x + 0.12, 0.11, z + 0.02, C.woodD);
}

/**
 * Daw Tin Tin's tea shop, outside shell: a warm timber-and-plaster front with a plank door under a
 * small awning, a wide propped-up shutter window showing the shelf of small clay teapots, the sign
 * «လက်ဖက်ရည်ဆိုင်», a menu slate, two low stools by the door and a tin chimney that steams.
 * opts: { awning: 'plain' | 'stamp' (Day 6's stampAwning door variant) }. setSteam(0..1),
 * setAwning(kind), update(dt, t) (steam). door: local { x, z }.
 */
export function teaShop({ awning = 'plain', w = 5.2, d = 3.8, h = 3.1 } = {}) {
  const root = new THREE.Group();
  root.name = 'teaShop';
  const v = new VoxelBuilder();
  const Z = d / 2;
  const door = shellInto(v, { w, d, h, wall: '#E9D9B8', wallD: '#C9B48E', trim: '#7A5434', roof: '#9E4B36', roofD: '#7E3828', door: { x: -0.9, panel: C.maroon, frame: C.gold }, windows: false, seed: 7 });
  // timber framing on the front
  for (const x of [-w / 2 + 0.25, 0.1, w / 2 - 0.25]) v.box(x, h / 2 + 0.1, Z + 0.03, 0.12, h - 0.2, 0.06, C.woodD);
  v.box(0, 2.72, Z + 0.03, w - 0.2, 0.1, 0.06, C.woodD);
  // the wide counter window, shutter propped up on two sticks, teapots on the sill shelf
  const WX = 1.3, WW = 1.8, WY = 1.4;
  v.boxMin(WX - WW / 2, WY - 0.45, Z - 0.05, WX + WW / 2, WY + 0.5, Z - 0.01, '#3E2E22');
  v.boxMin(WX - WW / 2 - 0.08, WY - 0.52, Z - 0.02, WX + WW / 2 + 0.08, WY - 0.45, Z + 0.35, C.woodL); // counter sill
  for (let i = 0; i < 5; i++) teapotInto(v, WX - 0.7 + i * 0.35, WY - 0.45, Z + 0.18, 0.95, false, 0.3 * i);
  v.boxMin(WX - WW / 2 + 0.06, WY + 0.05, Z - 0.045, WX + WW / 2 - 0.06, WY + 0.08, Z - 0.02, C.woodD);
  for (let i = 0; i < 6; i++) prism(v, WX - 0.75 + i * 0.3, WY + 0.15, Z - 0.035, 0.04, 0.035, 0.12, ['#BFD3E0', '#E2B33C', C.terra][i % 3], 6); // jars inside
  const shAng = 1.1;
  boxR(v, WX, WY + 0.5 + Math.sin(shAng) * 0.45, Z + Math.cos(shAng) * 0.45 + 0.02, WW + 0.16, 0.06, 0.95, C.teal, -(Math.PI / 2 - shAng), 0, 0);
  for (const s of [-1, 1]) boxR(v, WX + s * (WW / 2 - 0.1), WY + 0.45, Z + 0.45, 0.03, 0.03, 0.85, C.woodD, 0.9, 0, 0);
  for (const s of [-1, 1]) v.box(WX + s * (WW / 2 + 0.06), WY, Z + 0.03, 0.1, 1.05, 0.08, C.woodD);
  // two low stools by the door, a menu slate leaning on the wall, a water pot on a stand
  stoolInto(v, -2.0, Z + 0.55, C.wood, 3);
  stoolInto(v, 0.2, Z + 0.6, '#C9A06A', 5);
  prism(v, -2.3, 0.35, Z + 0.25, 0.14, 0.12, 0.3, C.terra, 8);
  v.boxMin(-2.45, 0, Z + 0.1, -2.15, 0.2, Z + 0.4, C.woodD);
  // chimney: a tin pipe through the roof with a little hat
  const CX = 1.6, CZ = -0.4;
  prism(v, CX, h + 1.1, CZ, 0.1, 0.1, 1.6, '#9C9690', 8);
  prism(v, CX, h + 1.92, CZ, 0.17, 0.12, 0.06, '#7E7872', 8);
  for (const yy of [h + 0.6, h + 1.3]) prism(v, CX, yy, CZ, 0.11, 0.11, 0.04, '#6E6862', 8);
  // DRAFT Burmese (Maya to proofread). Sign sits over the window, clear of the door awning.
  signBoard(root, v, [{ text: 'လက်ဖက်ရည်ဆိုင်', size: 64 }], { x: 1.3, y: h - 0.4, z: Z + 0.08, w: 2.0, h: 0.46, bg: '#FBF3E0', border: C.goldD });
  // a hanging kettle sign on a bracket at the west corner
  v.box(-w / 2 + 0.05, 2.5, Z + 0.35, 0.05, 0.05, 0.7, C.iron);
  teapotInto(v, -w / 2 + 0.05, 2.08, Z + 0.62, 2.2, false, Math.PI / 2);
  v.box(-w / 2 + 0.05, 2.38, Z + 0.62, 0.01, 0.12, 0.01, C.iron);
  root.add(v.mesh());
  // the door awning: plain striped tin, or the stamp awning (Day 6)
  const pv = new VoxelBuilder();
  const AW = 1.9;
  for (let i = 0; i < 8; i++) boxR(pv, -0.9 - AW / 2 + (i + 0.5) * (AW / 8), 2.78, Z + 0.4, AW / 8 + 0.004, 0.04, 0.8, i % 2 ? '#F3E9D2' : C.maroon, 0.35, 0, 0);
  for (const s of [-1, 1]) boxR(pv, -0.9 + s * (AW / 2 - 0.1), 2.6, Z + 0.3, 0.03, 0.03, 0.6, C.iron, -0.7, 0, 0);
  for (let i = 0; i < 10; i++) pv.box(-0.9 - AW / 2 + 0.1 + i * (AW - 0.2) / 9, 2.6, Z + 0.78, 0.09, 0.08, 0.02, i % 2 ? C.maroon : '#F3E9D2');
  const plain = pv.mesh();
  root.add(plain);
  const stamp = stampAwning({ door: true, w: 2.0, color: 'red', y: 2.95 });
  stamp.root.position.set(-0.9, 0, Z + 0.02);
  root.add(stamp.root);
  function setAwning(k) { plain.visible = k !== 'stamp'; stamp.root.visible = k === 'stamp'; }
  setAwning(awning);
  const steam = kilnSmoke({ height: 2.2, puffs: 16, wind: 0.4, size: 0.5, tint: SMOKE_TINT.steam, speed: 0.18 });
  steam.root.position.set(CX, h + 1.96, CZ);
  root.add(steam.root);
  const shadow = shadowUnder(root, w * 0.62, d * 0.7, 0, 0.15, 0.4);
  return {
    root, door, setAwning, setSteam: steam.setOn, update: steam.update,
    dispose() { steam.dispose(); stamp.dispose(); shadow.geometry.dispose(); disposePictures(root); disposeTree(root); },
  };
}

/**
 * Daw Yi's free-food shop, outside shell: a low pale-green plaster building, door in the middle of its
 * front, a long sign over the door «စေတနာ ထမင်း · ဘယ်သူမဆို ထိုင်စားပါ» (no giver's name anywhere), a
 * bench by the wall, a drinking-water pot on a stand with a cup, a pot of herbs. door: local { x, z }.
 */
export function freeFoodStall({ w = 5.6, d = 3.8, h = 2.9 } = {}) {
  const root = new THREE.Group();
  root.name = 'freeFoodShop';
  const v = new VoxelBuilder();
  const Z = d / 2;
  const door = shellInto(v, { w, d, h, wall: '#DCE3C6', wallD: '#BCC7A2', trim: C.woodD, roof: '#8E5A3A', roofD: '#6E422A', door: { panel: '#4F8F5A', frame: C.goldD }, winOpts: { shutter: '#6E8F4A', frame: '#F3E9D2' }, seed: 9 });
  // DRAFT Burmese (Maya to proofread): sign text
  signBoard(root, v, [{ text: 'စေတနာ ထမင်း', size: 52 }, { text: 'ဘယ်သူမဆို ထိုင်စားပါ', size: 34, color: '#6E1F2A' }], { y: h - 0.3, z: Z + 0.1, w: 2.4, h: 0.55, bg: '#FBF3E0', border: C.goldD });
  // a long bench along the wall right of the door
  v.boxMin(1.2, 0.42, Z + 0.15, 2.6, 0.47, Z + 0.5, C.wood);
  for (const x of [1.3, 2.5]) v.boxMin(x - 0.03, 0, Z + 0.2, x + 0.03, 0.42, Z + 0.45, C.woodD);
  // drinking-water pot on a stand with a lid and a tin cup, left of the door
  v.boxMin(-2.3, 0, Z + 0.25, -1.8, 0.6, Z + 0.75, C.woodD);
  v.boxMin(-2.35, 0.6, Z + 0.2, -1.75, 0.65, Z + 0.8, C.wood);
  prism(v, -2.05, 0.66 + 0.08, Z + 0.5, 0.17, 0.12, 0.16, C.terra, 8);
  prism(v, -2.05, 0.66 + 0.22, Z + 0.5, 0.12, 0.17, 0.12, C.terraL, 8);
  prism(v, -2.05, 0.66 + 0.3, Z + 0.5, 0.13, 0.13, 0.03, C.woodD, 8);
  prism(v, -1.82, 0.69, Z + 0.68, 0.035, 0.03, 0.06, '#B9B3A8', 8);
  // herbs in a cut tin, a broom against the wall
  prism(v, 2.5, 0.12 + 0.47, Z + 0.32, 0.09, 0.08, 0.2, '#A9A39A', 8);
  for (let i = 0; i < 6; i++) boxR(v, 2.5 + Math.sin(i) * 0.06, 0.8, Z + 0.32 + Math.cos(i) * 0.05, 0.06, 0.14, 0.03, i % 2 ? C.leaf : C.leafL, 0, i, (i - 3) * 0.12);
  boxR(v, -2.65, 0.75, Z + 0.15, 0.03, 1.3, 0.03, C.woodL, 0, 0, -0.15);
  boxR(v, -2.55, 0.12, Z + 0.15, 0.2, 0.25, 0.06, C.bamboo, 0, 0, -0.15);
  root.add(v.mesh());
  const shadow = shadowUnder(root, w * 0.62, d * 0.7, 0, 0.15, 0.4);
  return { root, door, dispose() { shadow.geometry.dispose(); disposePictures(root); disposeTree(root); } };
}

/**
 * Ma Thiri's red-and-cream diamond kite (0.7 x 0.9 m) with a paper tail of bows, on a line from an
 * anchor. Origin = the anchor (where the line is tied). setHeight(0..1) flies it up and away (to about
 * 7 m); setSway(t) rocks it with time t (call each frame); setAnchor(v3) moves the line's lower end
 * (root-local), e.g. the flag-၁၄ pulley.
 */
export function kite({ height = 0.6 } = {}) {
  const root = new THREE.Group();
  root.name = 'kite';
  const body = new THREE.Group();
  root.add(body);
  const v = new VoxelBuilder();
  const KW = 0.7, KH = 0.9, CY = 0.12; // cross bar above the centre
  const rows = 12;
  for (let i = 0; i < rows; i++) {
    const y0 = -KH / 2 + 0.04 + (i / rows) * (KH - 0.08) + (KH - 0.08) / rows / 2;
    const tUp = y0 > CY ? (KH / 2 - y0) / (KH / 2 - CY) : (y0 + KH / 2) / (CY + KH / 2);
    const half = (KW / 2) * tUp;
    if (half < 0.01) continue;
    const top = y0 > CY;
    v.box(-half / 2, y0, 0, half, (KH - 0.08) / rows + 0.002, 0.012, top ? C.red : C.cream);
    v.box(half / 2, y0, 0, half, (KH - 0.08) / rows + 0.002, 0.012, top ? C.cream : C.red);
  }
  v.box(0, 0, 0.012, 0.016, KH, 0.012, C.woodD); // spine
  v.box(0, CY, 0.012, KW, 0.014, 0.012, C.woodD); // cross spar
  // a gold sparkle painted in the cream quarter, a maroon edge tape
  v.box(0.12, 0.25, 0.008, 0.07, 0.016, 0.004, C.gold);
  v.box(0.12, 0.25, 0.008, 0.016, 0.07, 0.004, C.gold);
  for (const [x0, y0, x1, y1] of [[0, KH / 2, KW / 2, CY], [KW / 2, CY, 0, -KH / 2], [0, -KH / 2, -KW / 2, CY], [-KW / 2, CY, 0, KH / 2]]) {
    boxR(v, (x0 + x1) / 2, (y0 + y1) / 2, 0.006, Math.hypot(x1 - x0, y1 - y0), 0.014, 0.014, C.maroonD, 0, 0, Math.atan2(y1 - y0, x1 - x0));
  }
  const kmesh = v.mesh({ px: 1.3 });
  body.add(kmesh);
  // tail: a string with six paper bows, swinging from the bottom corner
  const tail = new THREE.Group();
  tail.position.y = -KH / 2;
  body.add(tail);
  const tv = new VoxelBuilder();
  for (let i = 0; i < 6; i++) {
    const y = -0.12 - i * 0.14;
    tv.box(0, y + 0.07, 0, 0.006, 0.14, 0.006, C.string);
    tv.box(-0.04, y, 0, 0.06, 0.04, 0.008, i % 2 ? C.red : C.cream, 0);
    tv.box(0.04, y, 0, 0.06, 0.04, 0.008, i % 2 ? C.red : C.cream, 0);
    tv.box(0, y, 0, 0.02, 0.025, 0.01, C.maroonD);
  }
  tail.add(tv.mesh({ px: 1.1 }));
  // line: a thin box stretched between the anchor and the bridle
  const lineMat = basic('#5A4A3A');
  const line = new THREE.Mesh(UNIT, lineMat);
  line.userData.sharedGeo = true;
  root.add(line);
  const anchor = new THREE.Vector3();
  const base = new THREE.Vector3();
  const tmp = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  let h = height, swayT = 0;
  function place() {
    base.set(anchor.x + 1.4 * h, anchor.y + 0.9 + 6.2 * h, anchor.z - 1.6 * h);
    body.position.set(base.x + Math.sin(swayT * 1.1) * 0.35 * h, base.y + Math.sin(swayT * 0.8) * 0.2 * h, base.z);
    body.rotation.set(-0.35 * h, 0, Math.sin(swayT * 1.6) * 0.22 * h);
    tail.rotation.z = Math.sin(swayT * 2.3 + 1) * 0.35;
    tail.rotation.x = Math.sin(swayT * 1.7) * 0.2;
    tmp.copy(body.position).sub(anchor);
    const len = tmp.length();
    line.position.copy(anchor).addScaledVector(tmp, 0.5);
    line.quaternion.setFromUnitVectors(up, tmp.normalize());
    line.scale.set(0.012, len, 0.012);
    line.visible = len > 0.05;
  }
  place();
  return {
    root, kite: body,
    setHeight(x) { h = clamp(x, 0, 1); place(); },
    setSway(t) { swayT = t; place(); },
    setAnchor(p) { anchor.copy(p); place(); },
    dispose() { disposeTree(root); },
  };
}

/** A bamboo post 0.12 x 1.6 m with three node rings and pale string marks; tieAnchor near the top. */
export function bambooPost({ h = 1.6 } = {}) {
  const root = new THREE.Group();
  root.name = 'bambooPost';
  const v = new VoxelBuilder();
  const nodes = [0.42, 0.88, 1.3];
  let y = 0;
  for (let i = 0; i <= nodes.length; i++) {
    const y1 = i < nodes.length ? nodes[i] : h;
    prism(v, 0, (y + y1) / 2, 0, 0.058, 0.06, y1 - y - 0.01, jitter(C.bamboo, 0.06, i), 8);
    prism(v, 0.0, (y + y1) / 2, 0.0, 0.0605, 0.0605, (y1 - y) * 0.3, jitter(C.bambooL, 0.05, i + 9), 8); // sheen band
    if (i < nodes.length) { prism(v, 0, y1, 0, 0.068, 0.068, 0.03, C.bambooD, 8); prism(v, 0, y1 + 0.02, 0, 0.062, 0.062, 0.012, '#8C7A3C', 8); }
    y = y1;
  }
  prism(v, 0, h + 0.005, 0, 0.05, 0.05, 0.01, '#E6DBA8', 8); // cut top
  // pale string marks: rubbed bands where a line was tied over the years, a leftover knot
  for (const [yy, hh] of [[1.42, 0.05], [1.5, 0.025], [1.12, 0.03]]) prism(v, 0, yy, 0, 0.0612, 0.0612, hh, '#EFE6C2', 8);
  ring(v, 0, 1.47, 0, 0.064, 8, 0.012, 0.012, C.string);
  boxR(v, 0.06, 1.44, 0.03, 0.01, 0.07, 0.01, C.string, 0.3, 0, 0.3);
  // set in a small mound of earth with two wedge stones
  prism(v, 0, 0.04, 0, 0.12, 0.17, 0.08, '#9C8466', 8);
  for (const s of [-1, 1]) boxR(v, s * 0.12, 0.05, 0.04 * s, 0.1, 0.07, 0.08, C.stone, 0.1, s * 0.5, s * 0.2);
  root.add(v.mesh());
  const tieAnchor = new THREE.Object3D();
  tieAnchor.position.set(0, 1.47, 0.07);
  root.add(tieAnchor);
  const shadow = shadowUnder(root, 0.16, 0.16, 0, 0, 0.4);
  return { root, tieAnchor, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

/** A neat folded paper plane into v, nose along +Z, 0.25 * s long. stripe: an edge colour. */
function planeInto(v, x, y, z, s = 1, ry = 0, col = C.white, stripe = null) {
  const P = new VoxelBuilder();
  const spans = [[0.018, 0.1], [0.04, 0.05], [0.062, 0.0], [0.082, -0.05], [0.098, -0.095]];
  for (const [hs, zz] of spans) P.box(0, 0.012, zz, hs * 2, 0.006, 0.052, col);
  P.box(0, 0.012, 0.12, 0.012, 0.006, 0.02, col);
  P.box(0, 0.0, 0.0, 0.012, 0.024, 0.23, shadeHex(col, 0.92)); // keel
  P.box(0, 0.016, 0.0, 0.004, 0.002, 0.23, shadeHex(col, 0.82)); // centre fold
  for (const sx of [-1, 1]) P.box(sx * 0.03, 0.0158, -0.02, 0.003, 0.002, 0.16, shadeHex(col, 0.88), sx * 0.12); // wing creases
  if (stripe) for (const sx of [-1, 1]) P.box(sx * 0.094, 0.0155, -0.095, 0.012, 0.003, 0.05, stripe);
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(s, s, s));
  v.merge(P, _m);
}

/**
 * One paper plane (0.25 m), nose along +Z. fly(points, seconds) glides it along a smooth path through
 * the given points (parent-space Vector3s), nose first with a little bank, and resolves when it lands;
 * call update(dt) every frame.
 */
export function paperPlane({ color = C.white, stripe = C.red } = {}) {
  const root = new THREE.Group();
  root.name = 'paperPlane';
  const v = new VoxelBuilder();
  planeInto(v, 0, 0, 0, 1, 0, color, stripe);
  const mesh = v.mesh({ px: 1.1 });
  root.add(mesh);
  let curve = null, dur = 1, u = 0, done = null;
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  function fly(points, seconds = 1.8) {
    curve = new THREE.CatmullRomCurve3(points.map((p) => p.clone()));
    dur = Math.max(0.1, seconds);
    u = 0;
    return new Promise((res) => { done = res; });
  }
  function update(dt) {
    if (!curve) return;
    u = Math.min(1, u + dt / dur);
    const e = u < 0.15 ? u * u / 0.3 + 0 : u; // a quick launch
    curve.getPointAt(Math.min(1, e), a);
    curve.getPointAt(Math.min(1, e + 0.02), b);
    root.position.copy(a);
    if (b.distanceToSquared(a) > 1e-8) { if (root.parent) root.parent.localToWorld(b); root.lookAt(b); }
    mesh.rotation.z = Math.sin(u * Math.PI * 2) * 0.35 * (1 - u);
    if (u >= 1) { curve = null; mesh.rotation.z = 0; const d = done; done = null; d?.(); }
  }
  return { root, fly, update, get flying() { return !!curve; }, dispose() { disposeTree(root); } };
}

/** A neat pile of folded paper planes, 0.6 x 0.3 m. opts: { table = false } puts it on a low table. */
export function planeStack({ table = false } = {}) {
  const root = new THREE.Group();
  root.name = 'planeStack';
  const v = new VoxelBuilder();
  let y = 0;
  if (table) {
    y = 0.45;
    v.boxMin(-0.45, 0.4, -0.25, 0.45, 0.45, 0.25, jitter(C.woodL, 0.04, 1));
    v.boxMin(-0.47, 0.38, -0.27, 0.47, 0.4, 0.27, C.woodD);
    for (const [x, z] of [[-0.4, -0.2], [0.4, -0.2], [-0.4, 0.2], [0.4, 0.2]]) v.box(x, 0.19, z, 0.05, 0.38, 0.05, C.woodD);
    v.boxMin(-0.4, 0.44, 0.22, 0.4, 0.452, 0.3, '#F3E9D2'); // a cloth runner edge
  }
  const cols = [C.white, '#FBF3E2', C.white];
  for (let layer = 0; layer < 4; layer++) for (let i = 0; i < 3; i++) {
    planeInto(v, -0.2 + i * 0.2 + (layer % 2) * 0.01, y + layer * 0.03, (layer % 2 ? 0.01 : -0.01), 1.05, (i - 1) * 0.04, cols[(i + layer) % 3], layer === 3 && i === 1 ? C.red : null);
  }
  // two loose ones on top, a stack of flat sheets ready to fold, a red ribbon round them
  planeInto(v, 0.05, y + 0.13, 0.03, 1.05, 0.5, C.white, C.red);
  v.boxMin(0.28, y, -0.13, 0.5, y + 0.05, 0.13, '#FBF6EA');
  v.boxMin(0.28, y + 0.05, -0.13, 0.5, y + 0.054, 0.13, '#EFE6D3');
  v.box(0.39, y + 0.028, 0.0, 0.225, 0.058, 0.02, C.red);
  root.add(v.mesh({ px: 1.2 }));
  const shadow = table ? shadowUnder(root, 0.55, 0.32, 0, 0, 0.4) : null;
  return { root, dispose() { shadow?.geometry.dispose(); disposeTree(root); } };
}

/**
 * Grandmother Pwa Pwa's thanaka stall (1.2 x 0.7 m): a low platform on a woven mat, the round grinding
 * stone with a pale yellow smear and a little water bowl, a short thanaka log being ground and a tied
 * bundle of logs, her low stool behind (-Z).
 */
export function thanakaStall() {
  const root = new THREE.Group();
  root.name = 'thanakaStall';
  const v = new VoxelBuilder();
  // woven mat
  for (let i = 0; i < 8; i++) v.boxMin(-0.62 + i * 0.155, 0, -0.38, -0.62 + (i + 1) * 0.155 - 0.005, 0.012, 0.38, i % 2 ? '#D9BE86' : '#C9A970');
  for (let k = 0; k < 6; k++) v.boxMin(-0.62, 0.012, -0.36 + k * 0.13, 0.62, 0.016, -0.36 + k * 0.13 + 0.04, '#BFA068');
  // low platform
  v.boxMin(-0.5, 0.2, -0.28, 0.5, 0.25, 0.28, jitter(C.wood, 0.05, 2));
  for (const [x, z] of [[-0.44, -0.22], [0.44, -0.22], [-0.44, 0.22], [0.44, 0.22]]) v.box(x, 0.1, z, 0.06, 0.2, 0.06, C.woodD);
  // the grinding stone: thick round slab with a lip, a spout channel to the front, wet centre
  prism(v, -0.1, 0.25 + 0.04, 0.0, 0.2, 0.21, 0.08, C.stone, 12);
  prism(v, -0.1, 0.25 + 0.083, 0.0, 0.17, 0.17, 0.006, C.stoneL, 12);
  prism(v, -0.1, 0.25 + 0.087, 0.0, 0.1, 0.1, 0.004, C.thanaka, 12);
  prism(v, -0.06, 0.25 + 0.089, 0.03, 0.05, 0.05, 0.004, '#F2D896', 8);
  v.box(-0.1, 0.25 + 0.075, 0.2, 0.06, 0.03, 0.06, C.stoneD); // spout
  v.box(-0.1, 0.25 + 0.088, 0.17, 0.03, 0.004, 0.06, '#E3C27A');
  // the log being ground (standing on the stone, held at an angle) and the bundle
  boxR(v, -0.02, 0.25 + 0.17, 0.0, 0.07, 0.2, 0.07, '#8A6A45', 0, 0, -0.5);
  boxR(v, -0.075, 0.25 + 0.098, 0.0, 0.072, 0.012, 0.072, '#EED9A0', 0, 0, -0.5);
  for (let i = 0; i < 4; i++) {
    const z = -0.12 + (i % 2) * 0.08, yy = 0.25 + 0.04 + Math.floor(i / 2) * 0.07;
    v.box(0.3, yy, z, 0.3, 0.07, 0.07, jitter('#8A6A45', 0.08, i));
    v.box(0.452, yy, z, 0.006, 0.06, 0.06, '#E8D3A0');
  }
  for (const x of [0.22, 0.38]) v.box(x, 0.25 + 0.075, -0.08, 0.02, 0.16, 0.18, C.rope);
  // water bowl and a little stack of leaf cones (for taking thanaka home)
  prism(v, -0.38, 0.25 + 0.03, 0.12, 0.07, 0.05, 0.06, C.terra, 8);
  prism(v, -0.38, 0.25 + 0.058, 0.12, 0.058, 0.058, 0.006, C.water, 8);
  for (let i = 0; i < 3; i++) boxR(v, -0.36 + i * 0.05, 0.25 + 0.02, -0.15, 0.04, 0.03, 0.08, C.leafD, 0, 0.3 * i, 0);
  // her low stool behind
  stoolInto(v, -0.1, -0.55, C.woodL, 6, 0.22);
  root.add(v.mesh());
  const shadow = shadowUnder(root, 0.75, 0.55, 0, -0.08, 0.35);
  return { root, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

/**
 * The street pump (0.5 x 1.3 m): a green-painted iron column with gold bands on a stone slab with a
 * drain lip, a spout to the front, a long handle on a pivot (setHandle(-1..1): -1 up, 1 pushed down),
 * a tin bucket under the spout and a hook. setFlow(0..1) runs water from the spout.
 */
export function streetPump() {
  const root = new THREE.Group();
  root.name = 'streetPump';
  const v = new VoxelBuilder();
  const IRON = '#3D5E4A', IRONL = '#557A62';
  // slab with a raised lip and a drain notch, a wet patch
  v.boxMin(-0.42, 0, -0.32, 0.42, 0.08, 0.5, C.stone);
  v.boxMin(-0.42, 0.08, -0.32, 0.42, 0.12, -0.26, C.stoneD);
  for (const s of [-1, 1]) v.boxMin(s * 0.42 - (s > 0 ? 0.06 : 0), 0.08, -0.32, s * 0.42 + (s < 0 ? 0.06 : 0), 0.12, 0.5, C.stoneD);
  v.boxMin(-0.36, 0.08, 0.44, -0.05, 0.12, 0.5, C.stoneD);
  v.boxMin(0.12, 0.08, 0.44, 0.36, 0.12, 0.5, C.stoneD);
  v.boxMin(-0.3, 0.081, -0.1, 0.3, 0.083, 0.42, '#8E8577');
  // the column: base flange, body with bands, cap
  prism(v, 0, 0.16, -0.12, 0.13, 0.15, 0.08, IRON, 8);
  prism(v, 0, 0.62, -0.12, 0.085, 0.095, 0.86, IRON, 8);
  prism(v, 0.0, 0.62, -0.12, 0.088, 0.088, 0.3, IRONL, 8);
  for (const yy of [0.3, 0.96]) prism(v, 0, yy, -0.12, 0.1, 0.1, 0.035, C.gold, 8);
  prism(v, 0, 1.08, -0.12, 0.11, 0.1, 0.06, IRON, 8);
  prism(v, 0, 1.14, -0.12, 0.05, 0.1, 0.06, IRONL, 8);
  prism(v, 0, 1.19, -0.12, 0.03, 0.03, 0.05, C.gold, 8);
  // spout to the front
  v.box(0, 0.78, 0.0, 0.07, 0.07, 0.2, IRON);
  boxR(v, 0, 0.74, 0.12, 0.06, 0.08, 0.06, IRON, 0.5, 0, 0);
  v.box(0, 0.7, 0.14, 0.05, 0.02, 0.05, C.soot);
  // pivot bracket (handle points to -X)
  v.box(-0.1, 1.1, -0.12, 0.08, 0.12, 0.05, IRON);
  // the hook for the bucket, a bucket under the spout
  v.box(0.1, 0.9, -0.03, 0.03, 0.03, 0.12, C.iron);
  v.box(0.1, 0.86, 0.03, 0.03, 0.08, 0.03, C.iron);
  prism(v, 0, 0.12 + 0.12, 0.15, 0.13, 0.11, 0.24, '#A9A39A', 10);
  prism(v, 0, 0.12 + 0.235, 0.15, 0.135, 0.135, 0.02, '#8E8880', 10);
  prism(v, 0, 0.12 + 0.24, 0.15, 0.115, 0.115, 0.004, C.water, 10);
  for (const s of [-1, 1]) v.box(s * 0.13, 0.12 + 0.3, 0.15, 0.012, 0.12, 0.012, C.iron);
  boxR(v, 0, 0.12 + 0.36, 0.15, 0.27, 0.012, 0.012, C.iron, 0, 0, 0);
  prism(v, 0, 0.12 + 0.12, 0.15, 0.132, 0.132, 0.02, '#8E8880', 10);
  root.add(v.mesh());
  // the handle
  const pivot = new THREE.Group();
  pivot.position.set(-0.1, 1.14, -0.12);
  const hv = new VoxelBuilder();
  hv.box(-0.42, 0, 0, 0.84, 0.04, 0.04, IRON);
  hv.box(-0.86, 0, 0, 0.12, 0.06, 0.06, C.woodL); // wooden grip
  hv.box(-0.05, 0, 0, 0.08, 0.08, 0.06, C.gold);
  hv.box(0.05, -0.04, 0, 0.03, 0.12, 0.03, IRON); // link to the plunger
  pivot.add(hv.mesh());
  root.add(pivot);
  // water stream
  const wv = new VoxelBuilder();
  wv.box(0, -0.18, 0, 0.035, 0.36, 0.035, '#BFE0EC');
  wv.box(0, -0.36, 0, 0.09, 0.02, 0.09, '#E8F4F8');
  const stream = wv.mesh({ outline: false });
  stream.position.set(0, 0.7, 0.14);
  root.add(stream);
  function setHandle(t) { pivot.rotation.z = clamp(t, -1, 1) * 0.4; }
  function setFlow(t) { t = clamp(t, 0, 1); stream.visible = t > 0.02; stream.scale.set(0.4 + 0.6 * t, 1, 0.4 + 0.6 * t); }
  setHandle(-0.6);
  setFlow(0);
  const shadow = shadowUnder(root, 0.6, 0.45, -0.1, 0.05, 0.4);
  return { root, setHandle, setFlow, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

/** A shallow clay water bowl (0.25 m) for the dogs. setFull(0..1). */
export function waterBowl({ full = 1 } = {}) {
  const root = new THREE.Group();
  root.name = 'waterBowl';
  const v = new VoxelBuilder();
  prism(v, 0, 0.01, 0, 0.08, 0.08, 0.02, C.terraD, 10);
  prism(v, 0, 0.035, 0, 0.115, 0.085, 0.03, C.terra, 10);
  prism(v, 0, 0.06, 0, 0.125, 0.115, 0.02, C.terraL, 10);
  prism(v, 0, 0.072, 0, 0.128, 0.128, 0.008, '#D9926A', 10);
  prism(v, 0, 0.0765, 0, 0.1, 0.1, 0.002, '#5E3322', 10);
  root.add(v.mesh({ px: 1.2 }));
  const wv = new VoxelBuilder();
  prism(wv, 0, 0, 0, 0.104, 0.104, 0.006, C.water, 10);
  wv.box(-0.03, 0.004, -0.02, 0.05, 0.002, 0.012, '#E6F2F6', 0.5);
  const water = wv.mesh({ outline: false });
  root.add(water);
  function setFull(f) { f = clamp(f, 0, 1); water.visible = f > 0.02; water.position.y = 0.0815; const s = 0.55 + 0.45 * f; water.scale.set(s, 1, s); }
  setFull(full);
  const shadow = shadowUnder(root, 0.16, 0.16, 0, 0, 0.35);
  return { root, setFull, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

/**
 * A tapered tube along points (Vector3s) into v: one smooth flat-shaded curl (tails, ropes), radius r0 at
 * the first point to r1 at the last, `sides` round. tip: colour of the last `tipFrac` of its length.
 */
function taperTube(v, pts, r0, r1, col, { sides = 6, tip = null, tipFrac = 0.25 } = {}) {
  const curve = new THREE.CatmullRomCurve3(pts);
  const N = Math.max(6, pts.length * 4);
  const frames = curve.computeFrenetFrames(N, false);
  const ringAt = (i) => {
    const t = i / N, c = curve.getPointAt(t), r = r0 + (r1 - r0) * t;
    const out = [];
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * Math.PI * 2;
      out.push(c.clone().addScaledVector(frames.normals[i], Math.cos(a) * r).addScaledVector(frames.binormals[i], Math.sin(a) * r));
    }
    return out;
  };
  const rings = Array.from({ length: N + 1 }, (_, i) => ringAt(i));
  const body = [], end = [];
  for (let i = 0; i < N; i++) {
    const dst = tip && i >= N * (1 - tipFrac) ? end : body;
    for (let k = 0; k < sides; k++) {
      const a = rings[i][k], b = rings[i][(k + 1) % sides], c = rings[i + 1][(k + 1) % sides], d = rings[i + 1][k];
      dst.push(a, b, c, a, c, d);
    }
  }
  // caps
  const c0 = curve.getPointAt(0), c1 = curve.getPointAt(1);
  for (let k = 0; k < sides; k++) {
    body.push(c0, rings[0][(k + 1) % sides], rings[0][k]);
    (tip ? end : body).push(c1, rings[N][k], rings[N][(k + 1) % sides]);
  }
  for (const [list, colour] of [[body, col], [end, tip]]) {
    if (!list.length) continue;
    const g = new THREE.BufferGeometry().setFromPoints(list);
    g.computeVertexNormals();
    v.add(g, colour);
    g.dispose();
  }
}

const DOG_COATS = {
  tan: { body: '#C99A62', dark: '#A87A48', light: '#EAD3AE', ear: '#8E6438' },
  black: { body: '#3A302A', dark: '#2A221E', light: '#C9A06A', ear: '#2A221E' },
  white: { body: '#EEE6D6', dark: '#D3C6AE', light: '#FBF7EE', ear: '#9E7650' },
  brindle: { body: '#9C7450', dark: '#6E4E34', light: '#D9BE96', ear: '#5E4026' },
};
/**
 * A sleeping street dog (box dog, 0.6 x 0.35 m lying), curled with its head on its paws and slow
 * breathing; wake() -> Promise pops it up onto its feet (squash and stretch), drink() lowers its head to
 * a bowl in front (+Z, about 0.35 m) and laps, sleep() lies it back down. Faces +Z when standing.
 * opts: { coat: 'tan'|'black'|'white'|'brindle', old (grey muzzle, slower) }. update(dt, t) every frame.
 */
export function streetDog({ coat = 'tan', old = false, seed = 1 } = {}) {
  const root = new THREE.Group();
  root.name = 'streetDog';
  const K = DOG_COATS[coat] || DOG_COATS.tan;
  const muzzle = old ? '#BDB5A8' : K.light;
  // --- curled sleeping pose (one mesh) ---
  const sl = new THREE.Group();
  root.add(sl);
  const sv = new VoxelBuilder();
  sv.box(0, 0.09, -0.02, 0.44, 0.17, 0.26, K.body, 0.25); // body lying, a little turned
  sv.box(-0.15, 0.12, -0.06, 0.18, 0.15, 0.24, K.dark, 0.25); // haunch
  sv.box(0.02, 0.05, 0.08, 0.3, 0.09, 0.08, K.light, 0.25); // belly side
  for (const dx of [0.08, 0.16]) sv.box(dx + 0.06, 0.03, 0.17, 0.05, 0.05, 0.16, K.body, 0.1); // front paws stretched forward
  sv.box(0.22, 0.03, 0.27, 0.06, 0.05, 0.05, K.light, 0.1);
  sv.box(0.13, 0.03, 0.27, 0.06, 0.05, 0.05, K.light, 0.1);
  // head resting on the paws, eyes shut, ear flopped
  sv.box(0.17, 0.1, 0.2, 0.17, 0.13, 0.16, K.body, 0.2);
  sv.box(0.19, 0.08, 0.31, 0.1, 0.08, 0.09, muzzle, 0.2);
  sv.box(0.2, 0.1, 0.36, 0.04, 0.035, 0.02, '#1F1A16', 0.2);
  for (const s of [-1, 1]) sv.box(0.17 + s * 0.045, 0.125, 0.285, 0.035, 0.008, 0.01, '#1F1A16', 0.2);
  sv.box(0.09, 0.13, 0.16, 0.05, 0.1, 0.11, K.ear, 0.6);
  sv.box(0.26, 0.13, 0.15, 0.05, 0.09, 0.1, K.ear, -0.4);
  // tail curled round the front
  { const pts = []; for (let i = 0; i <= 6; i++) { const a = -2.4 + i * 0.34; pts.push(new THREE.Vector3(-0.12 + Math.cos(a) * 0.2, 0.04 - i * 0.002, 0.14 - Math.sin(a) * 0.18)); } taperTube(sv, pts, 0.034, 0.018, K.body, { tip: K.light, tipFrac: 0.2 }); }
  const sleepMesh = sv.mesh();
  sl.add(sleepMesh);
  // --- standing pose: body, head and tail move ---
  const st = new THREE.Group();
  root.add(st);
  const bv = new VoxelBuilder();
  bv.box(0, 0.33, 0, 0.2, 0.19, 0.46, K.body);
  bv.box(0, 0.37, -0.15, 0.21, 0.13, 0.16, K.dark);
  bv.box(0, 0.25, 0.05, 0.14, 0.04, 0.3, K.light);
  bv.box(0, 0.39, 0.2, 0.18, 0.18, 0.12, K.body); // chest
  for (const [x, z] of [[-0.065, 0.17], [0.065, 0.17], [-0.065, -0.17], [0.065, -0.17]]) {
    bv.box(x, 0.13, z, 0.06, 0.24, 0.07, z > 0 ? K.body : K.dark);
    bv.box(x, 0.02, z + 0.015, 0.07, 0.04, 0.09, K.light);
  }
  if (old) bv.box(0, 0.42, -0.05, 0.12, 0.012, 0.2, '#C9C0B0'); // a greying back
  const standBody = bv.mesh();
  st.add(standBody);
  const head = new THREE.Group();
  head.position.set(0, 0.45, 0.24);
  st.add(head);
  const hv = new VoxelBuilder();
  hv.box(0, 0.06, 0.06, 0.16, 0.14, 0.15, K.body);
  hv.box(0, 0.03, 0.17, 0.1, 0.08, 0.1, muzzle);
  hv.box(0, 0.06, 0.225, 0.045, 0.035, 0.02, '#1F1A16');
  hv.box(0, 0.005, 0.19, 0.06, 0.012, 0.04, '#8E4A44'); // mouth line
  for (const s of [-1, 1]) {
    hv.box(s * 0.045, 0.09, 0.136, 0.03, 0.03, 0.01, '#1F1A16');
    hv.box(s * 0.04, 0.097, 0.142, 0.01, 0.01, 0.004, '#FFFFFF');
    boxR(hv, s * 0.09, 0.1, 0.03, 0.04, 0.1, 0.07, K.ear, 0.2, 0, s * 0.5);
  }
  const tongue = new VoxelBuilder();
  tongue.box(0, -0.02, 0.2, 0.04, 0.012, 0.05, '#E07A7A');
  const headMesh = hv.mesh();
  head.add(headMesh);
  const tongueMesh = tongue.mesh({ outline: false });
  head.add(tongueMesh);
  const tail = new THREE.Group();
  tail.position.set(0, 0.4, -0.23);
  st.add(tail);
  const tv = new VoxelBuilder();
  taperTube(tv, [[0, 0, 0.02], [0, 0.06, -0.05], [0, 0.15, -0.08], [0, 0.22, -0.04], [0, 0.23, 0.03], [0.01, 0.19, 0.07]].map((p) => new THREE.Vector3(...p)), 0.03, 0.017, K.body, { tip: K.light, tipFrac: 0.22 }); // a street dog's tail, curled up over the back
  tail.add(tv.mesh());
  const shadow = shadowUnder(root, 0.34, 0.3, 0.02, 0.05, 0.45);
  let state = 'sleep', trans = 0, transDir = 0, resolve = null;
  const phase = seed * 1.7;
  const breath = old ? 1.1 : 1.5;
  function apply(tt) {
    // tt: 0 asleep .. 1 standing
    sl.visible = tt < 0.45;
    st.visible = tt >= 0.45;
    if (sl.visible) { const s = 1 - smooth(tt / 0.45) * 0.4; sl.scale.set(1 + (1 - s) * 0.3, s, 1 + (1 - s) * 0.2); }
    if (st.visible) {
      const k = (tt - 0.45) / 0.55;
      const sy = 0.7 + 0.3 * k + Math.sin(k * Math.PI) * 0.18;
      st.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
    }
  }
  function wake() {
    if (state !== 'sleep' && transDir >= 0) return Promise.resolve();
    transDir = 1; state = 'waking';
    return new Promise((r) => { resolve = r; });
  }
  function sleep() { transDir = -1; state = 'lying'; head.rotation.x = 0; tongueMesh.visible = false; }
  function drink() { if (state === 'sleep') wake().then(() => { state = 'drink'; }); else state = 'drink'; }
  apply(0);
  tongueMesh.visible = false;
  function update(dt, t) {
    if (transDir) {
      trans = clamp(trans + transDir * dt / (old ? 0.9 : 0.6), 0, 1);
      apply(trans);
      if (transDir > 0 && trans >= 1) { transDir = 0; if (state === 'waking') state = 'stand'; const r = resolve; resolve = null; r?.(); }
      if (transDir < 0 && trans <= 0) { transDir = 0; state = 'sleep'; }
    }
    if (state === 'sleep') {
      const b = Math.sin(t * breath + phase);
      sleepMesh.scale.set(1 + b * 0.012, 1 + b * 0.04, 1 + b * 0.015);
      sleepMesh.position.y = 0;
    } else if (st.visible) {
      const drinking = state === 'drink';
      head.rotation.x = drinking ? 0.95 + Math.sin(t * 9) * 0.08 : Math.sin(t * 0.7 + phase) * 0.05;
      head.rotation.y = drinking ? 0 : Math.sin(t * 0.4 + phase) * 0.25;
      tongueMesh.visible = drinking && Math.sin(t * 9) > 0.2;
      tail.rotation.z = Math.sin(t * (drinking ? 9 : 4)) * (old ? 0.2 : 0.4); // wag side to side
      tail.rotation.x = old ? 0.35 : 0; // the old dog carries it lower
    }
  }
  return { root, update, wake, sleep, drink, get state() { return state; }, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

const LOUD = ['#E0457B', '#27A9C8', '#F2C230', '#7BC043', '#F07B2A', '#8E5BD6'];
/** Ko Yaung's painted maps: loud roads, a dashed "shortcut", little houses. */
function drawMap(g, x0, y0, S, seed) {
  const r = rand(seed);
  g.save();
  g.translate(x0, y0);
  g.fillStyle = ['#FFF4D6', '#F6ECFF', '#E8FBF2', '#FFF0E6'][seed % 4];
  g.fillRect(4, 4, S - 8, S - 8);
  g.fillStyle = '#9CD3EA';
  g.beginPath(); g.moveTo(0, S * (0.2 + r() * 0.2)); g.bezierCurveTo(S * 0.3, S * 0.4, S * 0.6, S * 0.1, S, S * (0.3 + r() * 0.2)); g.lineTo(S, S * 0.45); g.bezierCurveTo(S * 0.6, S * 0.25, S * 0.3, S * 0.55, 0, S * 0.4); g.fill();
  for (let i = 0; i < 4; i++) {
    g.strokeStyle = LOUD[(seed + i) % LOUD.length]; g.lineWidth = 10 + r() * 8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(r() * S, S); g.quadraticCurveTo(r() * S, r() * S, r() * S, 0); g.stroke();
  }
  for (let i = 0; i < 7; i++) { g.fillStyle = LOUD[Math.floor(r() * LOUD.length)]; const x = 20 + r() * (S - 50), y = 20 + r() * (S - 50); g.fillRect(x, y, 16, 14); g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + 8, y - 9); g.lineTo(x + 19, y); g.fill(); }
  g.setLineDash([10, 8]); g.strokeStyle = '#D11E3A'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(S * 0.15, S * 0.85); g.lineTo(S * 0.5, S * 0.55); g.lineTo(S * 0.82, S * 0.2); g.stroke();
  g.setLineDash([]);
  g.fillStyle = '#D11E3A'; g.beginPath(); g.arc(S * 0.82, S * 0.2, 9, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#3B2A1A'; g.lineWidth = 6; g.strokeRect(3, 3, S - 6, S - 6);
  g.restore();
}
/**
 * Ko Yaung's map stall (2.0 x 1.8 m): painted maps in loud colours hanging from a line between two
 * posts (they sway: update(dt, t)), a table with a paint pot and brush, stencils and a rolled map, and
 * his board «မာရာ့လမ်း» ("Maya's Way").
 */
export function mapStall() {
  const root = new THREE.Group();
  root.name = 'mapStall';
  const v = new VoxelBuilder();
  for (const s of [-1, 1]) {
    v.box(s * 0.95, 0.9, -0.35, 0.08, 1.8, 0.08, jitter(C.wood, 0.05, s));
    v.box(s * 0.95, 0.05, -0.35, 0.16, 0.1, 0.16, C.stoneD);
    v.box(s * 0.95, 1.82, -0.35, 0.12, 0.05, 0.12, C.gold);
  }
  v.box(0, 1.66, -0.35, 1.9, 0.02, 0.02, C.rope);
  // table: planks, paint-splashed cloth, things on it
  v.boxMin(-0.8, 0.7, -0.1, 0.8, 0.75, 0.4, jitter(C.woodL, 0.04, 3));
  for (const [x, z] of [[-0.74, -0.05], [0.74, -0.05], [-0.74, 0.35], [0.74, 0.35]]) v.box(x, 0.35, z, 0.05, 0.7, 0.05, C.woodD);
  v.boxMin(-0.8, 0.5, 0.39, 0.8, 0.75, 0.41, '#F3E9D2');
  for (let i = 0; i < 9; i++) v.box(-0.7 + i * 0.17, 0.55 + (i * 37 % 5) * 0.04, 0.415, 0.05, 0.04, 0.004, LOUD[i % LOUD.length]);
  // paint pots (three) with a brush
  [[-0.55, LOUD[0]], [-0.42, LOUD[1]], [-0.3, LOUD[2]]].forEach(([x, col], i) => {
    prism(v, x, 0.75 + 0.05, 0.12, 0.05, 0.045, 0.1, '#B9B3A8', 8);
    prism(v, x, 0.75 + 0.1, 0.12, 0.042, 0.042, 0.006, col, 8);
    boxR(v, x, 0.75 + 0.06, 0.12 + 0.05, 0.05, 0.08, 0.004, col, 0, 0, 0.2 * i); // drips
  });
  boxR(v, -0.48, 0.75 + 0.14, 0.12, 0.012, 0.22, 0.012, C.woodL, 0.2, 0, -0.5);
  boxR(v, -0.53, 0.75 + 0.06, 0.12, 0.02, 0.04, 0.02, LOUD[0], 0.2, 0, -0.5);
  // stencils: card cut-outs, a rolled map tied with string
  for (let i = 0; i < 3; i++) {
    v.box(0.05 + i * 0.03, 0.752 + i * 0.004, 0.18, 0.26, 0.004, 0.2, i === 2 ? '#E6D3AE' : '#D9C49C', 0.15 * i);
    v.box(0.05 + i * 0.03, 0.755 + i * 0.004, 0.18, 0.08, 0.002, 0.05, '#5E4426', 0.15 * i);
  }
  prismX(v, 0.55, 0.79, 0.15, 0.04, 0.4, '#FFF4D6', 8);
  prismX(v, 0.55, 0.79, 0.15, 0.042, 0.02, C.red, 8);
  prismX(v, 0.75, 0.79, 0.15, 0.025, 0.004, LOUD[1], 8);
  // DRAFT Burmese (Maya to proofread): sign text
  signBoard(root, v, [{ text: 'မာရာ့လမ်း', size: 64, color: '#D11E3A' }, { text: 'လမ်းပြမြေပုံ', size: 34 }], { y: 0.58, z: 0.44, w: 0.7, h: 0.3, bg: '#FFF4D6', border: '#E0457B', frame: C.woodD });
  root.add(v.mesh());
  // the hanging maps: one atlas, four swaying sheets, each with two pegs
  const { g, tex } = makeCanvas(1024, 256);
  live(tex, () => { for (let i = 0; i < 4; i++) drawMap(g, i * 256, 0, 256, i + 2); });
  const maps = [];
  const mat = basic(PALETTE.white, { map: tex, side: THREE.DoubleSide });
  const pegs = new VoxelBuilder();
  for (let i = 0; i < 4; i++) {
    const piv = new THREE.Group();
    const x = -0.68 + i * 0.45;
    piv.position.set(x, 1.66, -0.33);
    const m = new THREE.Mesh(cellQuad(0.4, 0.4, i, 4, 1, null), mat);
    m.position.y = -0.21;
    piv.add(m);
    root.add(piv);
    maps.push(piv);
    for (const s of [-1, 1]) pegs.box(x + s * 0.15, 1.65, -0.33, 0.02, 0.06, 0.03, C.woodL);
  }
  root.add(pegs.mesh({ px: 1.0 }));
  function update(dt, t) { maps.forEach((p, i) => { p.rotation.x = Math.sin(t * 1.3 + i * 1.7) * 0.12 - 0.04; p.rotation.z = Math.sin(t * 0.9 + i) * 0.03; }); }
  update(0, 0);
  const shadow = shadowUnder(root, 1.1, 0.55, 0, 0.0, 0.35);
  return { root, update, dispose() { mat.dispose(); tex.dispose(); shadow.geometry.dispose(); disposePictures(root); disposeTree(root); } };
}

/** One slatted crate into v (w x h x d), front stencil: 'envelope' | 'none'. */
function crateInto(v, x, y, z, w, h, d, seed = 1, stencil = 'envelope', ry = 0) {
  const P = new VoxelBuilder();
  const col = jitter(C.woodL, 0.07, seed);
  const n = Math.max(2, Math.round(h / 0.12));
  for (let i = 0; i < n; i++) {
    const yy = (i + 0.5) * (h / n);
    P.box(0, yy, d / 2 - 0.01, w, h / n - 0.012, 0.02, jitter(col, 0.04, i + seed));
    P.box(0, yy, -d / 2 + 0.01, w, h / n - 0.012, 0.02, col);
    P.box(w / 2 - 0.01, yy, 0, 0.02, h / n - 0.012, d, col);
    P.box(-w / 2 + 0.01, yy, 0, 0.02, h / n - 0.012, d, col);
  }
  P.box(0, h / 2, 0, w - 0.04, h - 0.02, d - 0.04, '#6E5034'); // dark inside
  for (const s of [-1, 1]) {
    P.box(s * (w / 2 - 0.025), h / 2, d / 2 + 0.002, 0.05, h, 0.025, C.woodD); // corner posts
    P.box(s * (w / 2 - 0.025), h / 2, -d / 2 - 0.002, 0.05, h, 0.025, C.woodD);
  }
  P.box(0, h - 0.01, 0, w, 0.02, d, C.woodD);
  if (stencil === 'envelope') {
    const ew = w * 0.5, eh = h * 0.5, ez = d / 2 + 0.013, col2 = seed % 3 ? '#7A2E2E' : '#2F3E5E';
    P.box(0, h / 2 + eh / 2, ez, ew, 0.018, 0.004, col2);
    P.box(0, h / 2 - eh / 2, ez, ew, 0.018, 0.004, col2);
    for (const s of [-1, 1]) {
      P.box(s * ew / 2, h / 2, ez, 0.018, eh, 0.004, col2);
      boxR(P, s * ew / 4, h / 2 + eh * 0.2, ez, Math.hypot(ew / 2, eh * 0.6), 0.016, 0.004, col2, 0, 0, s * Math.atan2(eh * 0.6, ew / 2));
    }
  }
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(1, 1, 1));
  v.merge(P, _m);
}
/** Daw Pyone's wall of envelope-stencilled crates (2.2 x 1.6 m): the painted shortcut's dead end. */
export function envelopeCrates() {
  const root = new THREE.Group();
  root.name = 'envelopeCrates';
  const v = new VoxelBuilder();
  const r = rand(17);
  const rows = 4, cols = 4, w = 0.55, h = 0.4, d = 0.46;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    if (j === 3 && (i === 0 || i === 3)) continue; // a ragged top
    crateInto(v, -1.1 + w / 2 + i * w + (r() - 0.5) * 0.05, j * h, (r() - 0.5) * 0.06, w - 0.01, h - 0.005, d, i * 5 + j * 3 + 1, 'envelope', (r() - 0.5) * 0.06);
  }
  // loose envelopes and twine on top, one crate at the foot pulled out
  for (let i = 0; i < 4; i++) boxR(v, -0.3 + i * 0.16, 1.6 + 0.008 + i * 0.002, 0.05, 0.2, 0.006, 0.13, i % 2 ? '#F6F0E2' : '#EDE0C2', 0, 0.3 * i, 0);
  crateInto(v, 0.75, 0, 0.55, 0.5, 0.36, 0.42, 9, 'envelope', 0.25);
  root.add(v.mesh());
  const shadow = shadowUnder(root, 1.3, 0.45, 0.1, 0.1, 0.4);
  return { root, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

/** A crate of books (0.6 m): slats, books standing inside spine-up, a twine tie. */
export function bookCrate() {
  const root = new THREE.Group();
  root.name = 'bookCrate';
  const v = new VoxelBuilder();
  crateInto(v, 0, 0, 0, 0.6, 0.34, 0.42, 4, 'none');
  // the books, standing in two rows, tops showing (page edges cream, spines coloured)
  const r = rand(5);
  for (const z of [-0.09, 0.09]) {
    let x = -0.26;
    while (x < 0.25) {
      const t = 0.03 + r() * 0.025, hh = 0.26 + r() * 0.1;
      const col = BOOK_COLS[Math.floor(r() * BOOK_COLS.length)];
      v.box(x + t / 2, hh / 2, z, t, hh, 0.17, col);
      v.box(x + t / 2, hh + 0.001, z + 0.01, t * 0.85, 0.004, 0.14, '#F6F0E2');
      x += t + 0.004;
    }
  }
  v.box(0, 0.345, 0, 0.012, 0.012, 0.44, C.string);
  v.box(0, 0.25, 0.215, 0.012, 0.2, 0.012, C.string);
  v.box(0.02, 0.36, 0.0, 0.05, 0.02, 0.03, C.string, 0.5);
  root.add(v.mesh());
  const shadow = shadowUnder(root, 0.4, 0.3, 0, 0, 0.45);
  return { root, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

/** A rice sack into v (standing, 0.5 m): slumped burlap, tied neck with ears, a printed sheaf mark. */
function sackInto(v, x, y, z, s = 1, rx = 0, ry = 0, rz = 0) {
  const P = new VoxelBuilder();
  const rows = [[0.36, 0.06], [0.4, 0.1], [0.38, 0.1], [0.34, 0.08], [0.28, 0.06], [0.16, 0.04]];
  let yy = 0;
  rows.forEach(([w, h], i) => { P.box(0, yy + h / 2, 0, w, h, w * 0.72, jitter(i % 2 ? C.burlap : '#B89A6A', 0.04, i)); yy += h; });
  P.box(0, yy + 0.03, 0, 0.1, 0.06, 0.08, C.burlapD); // neck
  for (const sx of [-1, 1]) boxR(P, sx * 0.06, yy + 0.08, 0, 0.08, 0.05, 0.06, C.burlap, 0, 0, sx * 0.6); // ears
  P.box(0, yy + 0.02, 0, 0.12, 0.025, 0.1, C.rope);
  // stitching down the side and the printed mark on the front
  for (let i = 0; i < 6; i++) P.box(0.2, 0.06 + i * 0.06, 0.0, 0.006, 0.03, 0.012, C.burlapD);
  const fz = 0.4 * 0.72 / 2 + 0.003;
  P.box(0, 0.22, fz, 0.004, 0.14, 0.004, C.maroon);
  for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) boxR(P, sx * 0.022, 0.25 + i * 0.025, fz, 0.035, 0.012, 0.004, C.maroon, 0, 0, sx * 0.6);
  P.box(0, 0.12, fz, 0.16, 0.02, 0.004, C.maroon);
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(s, s, s));
  v.merge(P, _m);
}
/** A burlap rice sack, 0.5 m. */
export function riceSack() {
  const root = new THREE.Group();
  root.name = 'riceSack';
  const v = new VoxelBuilder();
  sackInto(v, 0, 0, 0, 1);
  // a few grains spilled at the foot
  for (let i = 0; i < 7; i++) v.box(0.22 + (i % 3) * 0.03, 0.004, 0.12 + Math.floor(i / 3) * 0.025, 0.012, 0.008, 0.008, '#F6F0E2', i);
  root.add(v.mesh());
  const shadow = shadowUnder(root, 0.3, 0.25, 0, 0, 0.45);
  return { root, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}
/** Daw Kyar's rice cart (1.4 x 0.9 m): a hand cart with one sack lying on it, handles to +X. */
export function riceCart() {
  const root = new THREE.Group();
  root.name = 'riceCart';
  const v = new VoxelBuilder();
  const BY = 0.48;
  for (let i = 0; i < 4; i++) v.boxMin(-0.6, BY, -0.4 + i * 0.2 + 0.004, 0.45, BY + 0.05, -0.4 + (i + 1) * 0.2, jitter(C.wood, 0.07, i + 7));
  for (const z of [-0.42, 0.42]) {
    v.boxMin(-0.62, BY, z - 0.02, 0.47, BY + 0.14, z + 0.02, C.woodL);
    for (let i = 0; i < 4; i++) v.box(-0.55 + i * 0.32, BY + 0.1, z, 0.04, 0.2, 0.04, C.woodD);
  }
  for (const s of [-1, 1]) wheelZ(v, -0.1, 0.33, s * 0.5, 0.33, 0.05, { spokes: 6, wood: C.woodD });
  v.boxMin(-0.15, 0.29, -0.53, -0.05, 0.37, 0.53, C.iron);
  for (const s of [-1, 1]) {
    v.boxMin(0.45, BY - 0.02, s * 0.3 - 0.025, 1.0, BY + 0.04, s * 0.3 + 0.025, C.woodD);
    v.box(0.95, BY + 0.01, s * 0.3, 0.1, 0.07, 0.065, C.woodXL);
    v.box(0.6, BY / 2, s * 0.3, 0.04, BY, 0.04, C.woodD);
  }
  v.boxMin(0.86, BY, -0.32, 0.9, BY + 0.03, 0.32, C.woodD);
  sackInto(v, -0.1, BY + 0.05 + 0.15, 0.0, 1.05, 0, Math.PI / 2, Math.PI / 2 - 0.05);
  // a tin scoop and a folded cloth on the cart
  prism(v, 0.3, BY + 0.09, 0.25, 0.05, 0.04, 0.08, '#A9A39A', 8);
  v.box(0.3, BY + 0.06, -0.25, 0.2, 0.03, 0.18, '#E6D3AE');
  root.add(v.mesh());
  const shadow = shadowUnder(root, 0.95, 0.6, 0.15, 0, 0.45);
  return { root, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

/** A small glass of milk tea on a saucer into v. */
function teaCupInto(v, x, y, z, s = 1) {
  prism(v, x, y + 0.006 * s, z, 0.06 * s, 0.05 * s, 0.012 * s, '#FBF7EE', 10);
  prism(v, x, y + 0.012 * s, z, 0.062 * s, 0.062 * s, 0.003 * s, C.gold, 10);
  prism(v, x, y + 0.05 * s, z, 0.034 * s, 0.028 * s, 0.07 * s, '#C88A4A', 8);
  prism(v, x, y + 0.0855 * s, z, 0.036 * s, 0.036 * s, 0.004 * s, '#E9D4B4', 8);
  prism(v, x, y + 0.03 * s, z, 0.0345 * s, 0.0345 * s, 0.012 * s, '#E6EEF0', 8);
}
/** A small glass of tea on a saucer (0.1 m). */
export function teaCup() {
  const root = new THREE.Group();
  root.name = 'teaCup';
  const v = new VoxelBuilder();
  teaCupInto(v, 0, 0, 0, 1);
  v.box(0.05, 0.016, 0.02, 0.05, 0.004, 0.008, '#B9B3A8', 0.4); // a spoon
  root.add(v.mesh({ px: 1.0 }));
  return { root, dispose() { disposeTree(root); } };
}
/** A shallow woven basket of tea leaves (0.5 m). */
export function teaLeafBasket() {
  const root = new THREE.Group();
  root.name = 'teaLeafBasket';
  const v = new VoxelBuilder();
  prism(v, 0, 0.015, 0, 0.23, 0.2, 0.03, C.wickerD, 12);
  ring(v, 0, 0.05, 0, 0.235, 18, 0.04, 0.05, C.wicker, 0, 2);
  ring(v, 0, 0.08, 0, 0.245, 18, 0.045, 0.022, C.wickerD, 0.17);
  for (let i = 0; i < 5; i++) v.box(-0.16 + i * 0.08, 0.032, 0, 0.035, 0.004, 0.36, i % 2 ? C.wickerL : C.wicker);
  const r = rand(23);
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * 0.19;
    const hgt = 0.04 + (1 - rr / 0.19) * 0.05;
    boxR(v, Math.cos(a) * rr, hgt + r() * 0.015, Math.sin(a) * rr, 0.05 + r() * 0.03, 0.008, 0.025, [C.leafD, '#5E6E3A', '#7A6A3A', C.leaf, '#4E5A2E'][Math.floor(r() * 5)], (r() - 0.5) * 0.5, r() * 3, (r() - 0.5) * 0.5);
  }
  root.add(v.mesh({ px: 1.2 }));
  const shadow = shadowUnder(root, 0.3, 0.3, 0, 0, 0.4);
  return { root, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

/** A carving gouge into v, lying along X. */
function gougeInto(v, x, y, z, ry = 0, col = C.woodL) {
  const P = new VoxelBuilder();
  P.box(-0.04, 0, 0, 0.09, 0.022, 0.022, col);
  P.box(0.0, 0, 0, 0.012, 0.026, 0.026, C.goldD);
  P.box(0.045, 0, 0, 0.08, 0.008, 0.012, '#9AA0A6');
  P.box(0.088, 0, 0, 0.01, 0.006, 0.014, '#C9CED2');
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(1, 1, 1));
  v.merge(P, _m);
}
/** A stamp design as small relief boxes in the XZ plane (size S square, centred), into v at height y. */
function stampDesignInto(v, y, S, design, nick, col, borderCol = col) {
  const B = S * 0.46;
  // dotted border
  const n = 9;
  for (let i = 0; i < n; i++) {
    const p = -B + (i + 0.5) * ((2 * B) / n);
    for (const s of [-1, 1]) {
      if (!(nick && s > 0 && i >= 6 && i <= 7)) v.box(p, y, s * B, S * 0.06, 0.006, S * 0.035, borderCol);
      v.box(s * B, y, p, S * 0.035, 0.006, S * 0.06, borderCol);
    }
  }
  if (design === 'twoTails') {
    // straight lines: a ribbon band down the middle forking into two tails, a straight-edged plane
    v.box(0, y, -B * 0.25, S * 0.1, 0.006, B * 1.1, col);
    for (const s of [-1, 1]) boxR(v, s * B * 0.18, y, B * 0.5, S * 0.07, 0.006, B * 0.6, col, 0, s * 0.45, 0);
    for (const [x0, z0, x1, z1] of [[-B * 0.7, -B * 0.1, B * 0.3, -B * 0.7], [B * 0.3, -B * 0.7, -B * 0.2, -B * 0.05], [-B * 0.2, -B * 0.05, -B * 0.7, -B * 0.1]]) {
      boxR(v, (x0 + x1) / 2, y, (z0 + z1) / 2, Math.hypot(x1 - x0, z1 - z0), 0.006, S * 0.05, col, 0, -Math.atan2(z1 - z0, x1 - x0), 0);
    }
  } else {
    // ribbonPlane: a paper plane in the middle, a bookmark ribbon looping round it in curls
    const pl = [[-B * 0.45, B * 0.1], [B * 0.45, -B * 0.25], [-B * 0.1, B * 0.3]];
    for (let i = 0; i < 3; i++) {
      const [x0, z0] = pl[i], [x1, z1] = pl[(i + 1) % 3];
      boxR(v, (x0 + x1) / 2, y, (z0 + z1) / 2, Math.hypot(x1 - x0, z1 - z0), 0.006, S * 0.05, col, 0, -Math.atan2(z1 - z0, x1 - x0), 0);
    }
    const N = 40;
    let px = null, pz = null;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2.6 - 0.3;
      const rr = B * (0.68 - 0.12 * Math.sin(t * 1.5));
      const x = Math.cos(t) * rr + Math.sin(t * 3) * B * 0.06, z = Math.sin(t) * rr * 0.85;
      if (px !== null) boxR(v, (x + px) / 2, y, (z + pz) / 2, Math.hypot(x - px, z - pz) + S * 0.01, 0.006, S * 0.055, col, 0, -Math.atan2(z - pz, x - px), 0);
      px = x; pz = z;
    }
    // two little curled tails at the bottom
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
      const a = i * 0.7;
      v.box(s * (B * 0.25 + Math.cos(a) * B * 0.12 * (1 - i / 8)), y, B * 0.78 + Math.sin(a) * B * 0.1 * (1 - i / 8), S * 0.04, 0.006, S * 0.04, col);
    }
  }
}

/**
 * Ko Lwin's carving bench (1.4 x 0.7 m, top at 0.75) under a striped awning on one post: rows of small
 * blocks, a vice with a block (setBlock('cloth' | 'bare' | 'none')), a gouge roll (setDust(bool)),
 * a tea glass, a small clay brazier on the ground (setGlow(0..1): grey ash to orange embers, with a
 * thin smoke), shavings (setShavings(0..1)), his low stool. opts.cold starts unlit and dim.
 * update(dt, t) runs the smoke.
 */
export function carvingBench({ cold = true, block = 'cloth', shavings = 0 } = {}) {
  const root = new THREE.Group();
  root.name = 'carvingBench';
  const v = new VoxelBuilder();
  const W = 1.4, D = 0.7, T = 0.75;
  // the bench: three thick top planks, splayed legs, a lower shelf with block stock
  for (let i = 0; i < 3; i++) v.boxMin(-W / 2, T - 0.06, -D / 2 + i * D / 3 + 0.004, W / 2, T, -D / 2 + (i + 1) * D / 3, jitter(C.wood, 0.06, i + 2));
  for (const [x, z] of [[-0.6, -0.28], [0.6, -0.28], [-0.6, 0.28], [0.6, 0.28]]) boxR(v, x, (T - 0.06) / 2, z, 0.07, T - 0.06, 0.07, C.woodD, z * 0.12, 0, -x * 0.06);
  v.boxMin(-0.6, 0.18, -0.3, 0.6, 0.22, 0.3, C.woodD);
  for (let i = 0; i < 6; i++) v.box(-0.45 + i * 0.13, 0.27, -0.1 + (i % 2) * 0.12, 0.12, 0.1, 0.12, jitter(C.woodL, 0.08, i + 30), 0.1 * i);
  v.boxMin(-W / 2, T - 0.08, D / 2 - 0.02, W / 2, T, D / 2 + 0.01, C.woodD);
  // rows of small blocks on the bench (some carved: a dark face pattern on top)
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) {
    const x = -0.62 + i * 0.075, z = -0.25 + r * 0.075;
    v.box(x, T + 0.025, z, 0.05, 0.05, 0.05, jitter(C.woodXL, 0.06, r * 6 + i));
    if ((r + i) % 3 === 0) v.box(x, T + 0.051, z, 0.03, 0.003, 0.03, C.maroonD);
  }
  // the vice at the right end
  v.box(0.58, T + 0.06, 0.12, 0.16, 0.12, 0.08, C.iron);
  v.box(0.58, T + 0.06, 0.26, 0.16, 0.12, 0.05, C.iron);
  v.box(0.58, T + 0.06, 0.34, 0.03, 0.03, 0.16, C.ironL);
  v.box(0.58, T + 0.06, 0.42, 0.16, 0.025, 0.025, C.ironL);
  // the gouge roll: cloth unrolled with pockets, six tools
  v.boxMin(-0.2, T, 0.05, 0.3, T + 0.008, 0.3, '#B5643C');
  for (let i = 0; i < 6; i++) v.boxMin(-0.18 + i * 0.08, T + 0.008, 0.18, -0.12 + i * 0.08, T + 0.02, 0.29, '#A0503A');
  for (let i = 0; i < 6; i++) gougeInto(v, -0.15 + i * 0.08, T + 0.025, 0.2, -Math.PI / 2 + (i % 2) * 0.05, i % 2 ? C.woodL : '#B98A64');
  prismX(v, -0.24, T + 0.03, 0.17, 0.03, 0.06, '#A0503A', 8); // rolled end
  // tea glass and a sharpening stone
  teaCupInto(v, -0.45, T, 0.2, 1);
  v.box(0.2, T + 0.02, -0.22, 0.2, 0.04, 0.06, '#6E7A84');
  // awning post at the back left with a small striped cloth canopy
  v.box(-0.8, 1.0, -0.42, 0.07, 2.0, 0.07, C.woodD);
  v.box(-0.8, 0.05, -0.42, 0.14, 0.1, 0.14, C.stoneD);
  const ang = 0.28;
  for (let i = 0; i < 6; i++) boxR(v, -0.8 + 0.1 + i * 0.22, 1.95 - 0.05, -0.12, 0.22, 0.03, 0.8, i % 2 ? '#F3E9D2' : '#3E6FB8', ang, 0, 0);
  // a second post at the back right and a cross-beam under the canopy's back edge (lashed with twine)
  v.box(0.48, 1.0, -0.42, 0.07, 2.0, 0.07, C.woodD);
  v.box(0.48, 0.05, -0.42, 0.14, 0.1, 0.14, C.stoneD);
  v.boxMin(-0.84, 1.93, -0.46, 0.52, 1.98, -0.4, C.wood);
  for (const x of [-0.8, 0.48]) v.box(x, 1.9, -0.42, 0.09, 0.04, 0.09, '#C9A06A');
  for (let i = 0; i < 12; i++) v.box(-0.8 + 0.06 + i * 0.11, 1.78, 0.27, 0.05, 0.06, 0.02, i % 2 ? '#3E6FB8' : '#F3E9D2');
  // the low stool behind
  stoolInto(v, 0.1, -0.7, C.woodL, 8, 0.4);
  root.add(v.mesh());
  // brazier on the ground at the front left
  const BX = -0.95, BZ = 0.35;
  const bv = new VoxelBuilder();
  prism(bv, BX, 0.05, BZ, 0.12, 0.1, 0.1, C.terraD, 8);
  prism(bv, BX, 0.15, BZ, 0.17, 0.12, 0.1, C.terra, 8);
  prism(bv, BX, 0.205, BZ, 0.18, 0.18, 0.02, C.terraL, 8);
  for (const s of [-1, 1]) bv.box(BX + s * 0.19, 0.15, BZ, 0.04, 0.03, 0.06, C.terraD);
  bv.box(BX, 0.1, BZ + 0.13, 0.08, 0.05, 0.02, C.soot); // draught hole
  boxR(bv, BX + 0.2, 0.01, BZ + 0.05, 0.25, 0.02, 0.02, C.iron, 0, 0.4, 0); // tongs
  root.add(bv.mesh());
  const coalMat = basic('#7A746C').clone();
  coalMat.vertexColors = true;
  const cv = new VoxelBuilder();
  for (let i = 0; i < 9; i++) cv.box(BX - 0.09 + (i % 3) * 0.08, 0.215 + (i % 2) * 0.015, BZ - 0.08 + Math.floor(i / 3) * 0.08, 0.07, 0.04, 0.06, i % 2 ? '#ffffff' : '#d8d0c8', i);
  const coals = new THREE.Mesh(cv.geometry(), coalMat);
  root.add(coals);
  const smoke = kilnSmoke({ height: 1.5, puffs: 14, wind: 0.3, size: 0.32, tint: SMOKE_TINT.brazier, speed: 0.22 });
  smoke.root.position.set(BX, 0.26, BZ);
  root.add(smoke.root);
  // the block in the vice: bare, or wrapped in cloth
  const blk = { bare: new VoxelBuilder(), cloth: new VoxelBuilder() };
  blk.bare.box(0.58, T + 0.14, 0.19, 0.11, 0.1, 0.1, C.woodXL);
  blk.bare.box(0.58, T + 0.191, 0.19, 0.08, 0.004, 0.07, C.maroonD);
  blk.cloth.box(0.58, T + 0.14, 0.19, 0.13, 0.11, 0.12, '#E6D3AE');
  blk.cloth.box(0.58, T + 0.2, 0.19, 0.05, 0.03, 0.05, '#D3BE94');
  blk.cloth.box(0.58, T + 0.14, 0.255, 0.14, 0.02, 0.01, '#B5643C');
  const blocks = { bare: blk.bare.mesh({ px: 1.2 }), cloth: blk.cloth.mesh({ px: 1.2 }) };
  root.add(blocks.bare, blocks.cloth);
  // dust over the gouge roll (left untouched for a while)
  const dv = new VoxelBuilder();
  dv.boxMin(-0.2, T + 0.035, 0.05, 0.3, T + 0.037, 0.3, '#D8D0C0');
  const dust = dv.mesh({ outline: false });
  dust.material = toon('#ffffff', { vertexColors: true, transparent: true, opacity: 0.55 });
  root.add(dust);
  // shavings: a few curls on the bench, more on the ground round it
  const shv = (n, seed, onBench) => {
    const sv2 = new VoxelBuilder();
    const r = rand(seed);
    for (let i = 0; i < n; i++) {
      const x = onBench ? 0.2 + r() * 0.4 : (r() - 0.5) * 1.8, z = onBench ? -0.1 + r() * 0.3 : 0.3 + r() * 0.6;
      const y = onBench ? T + 0.006 : 0.008;
      const a = r() * 3;
      for (let k = 0; k < 3; k++) boxR(sv2, x + Math.cos(a + k * 0.9) * 0.015, y + k * 0.004, z + Math.sin(a + k * 0.9) * 0.015, 0.025, 0.006, 0.012, k % 2 ? '#F2DDB4' : '#E8CC98', 0, a + k * 0.9, 0);
    }
    return sv2.mesh({ px: 1.0 });
  };
  const shBench = shv(10, 3, true), shFloor = shv(26, 7, false);
  root.add(shBench, shFloor);
  const ash = new THREE.Color('#7A746C'), hot = new THREE.Color('#FF8A3A'), white = new THREE.Color('#FFD9A0');
  let glow = 0;
  function setGlow(t) {
    glow = clamp(t, 0, 1);
    coalMat.color.copy(ash).lerp(hot, glow).lerp(white, Math.max(0, glow - 0.7));
    smoke.setOn(glow > 0.1 ? 0.5 + glow * 0.5 : 0);
  }
  function setBlock(k) { blocks.bare.visible = k === 'bare'; blocks.cloth.visible = k === 'cloth'; }
  function setShavings(t) { shBench.visible = t > 0.05; shFloor.visible = t > 0.4; shFloor.scale.setScalar(0.6 + 0.4 * clamp(t, 0, 1)); }
  function setDust(on) { dust.visible = !!on; }
  setGlow(cold ? 0 : 0.9);
  setBlock(block);
  setShavings(shavings);
  setDust(cold);
  const shadow = shadowUnder(root, 0.95, 0.6, -0.1, 0, 0.45);
  return {
    root, setGlow, setBlock, setShavings, setDust, update: smoke.update, get glow() { return glow; },
    dispose() { coalMat.dispose(); smoke.dispose(); shadow.geometry.dispose(); disposeTree(root); },
  };
}

/**
 * A hand-held stamp block (0.12 x 0.12 x 0.06 m + a turned knob): the carved, inked design on its face
 * (bottom): design 'ribbonPlane' (Khwar Nyo's curls: a ribbon looping round a paper plane) or 'twoTails'
 * (straight lines); nick: a notch in the dotted border. Rests face down at y = 0. setPress(t): 0 lifts
 * it 0.1 m, 1 presses it down (with a small squash). opts.faceUp shows the face (for close-ups).
 */
export function stampBlock(design = 'ribbonPlane', nick = false, { faceUp = false, ink = C.maroon } = {}) {
  const root = new THREE.Group();
  root.name = 'stampBlock';
  const lift = new THREE.Group();
  root.add(lift);
  const body = new THREE.Group();
  lift.add(body);
  const S = 0.12, H = 0.06;
  const v = new VoxelBuilder();
  v.box(0, 0.006 + H / 2, 0, S, H, S, C.woodXL);
  for (const s of [-1, 1]) { v.box(s * (S / 2 + 0.001), 0.006 + H / 2, 0, 0.002, H - 0.01, S - 0.01, '#C9A06A'); v.box(0, 0.006 + H / 2, s * (S / 2 + 0.001), S - 0.01, H - 0.01, 0.002, '#D3AE7E'); }
  v.box(0, 0.006 + H - 0.004, 0, S + 0.004, 0.008, S + 0.004, C.woodD);
  prism(v, 0, 0.006 + H + 0.02, 0, 0.022, 0.03, 0.04, C.wood, 8);
  prism(v, 0, 0.006 + H + 0.05, 0, 0.032, 0.022, 0.025, C.woodL, 8);
  prism(v, 0, 0.006 + H + 0.066, 0, 0.02, 0.032, 0.01, C.woodD, 8);
  // ink-darkened face rim
  v.box(0, 0.006 + 0.004, 0, S + 0.002, 0.008, S + 0.002, '#B98A64');
  body.add(v.mesh({ px: 1.2 }));
  let faceMesh = null, curNick = nick;
  function buildFace() {
    freeMesh(faceMesh);
    const fv = new VoxelBuilder();
    fv.box(0, 0.0045, 0, S * 0.96, 0.003, S * 0.96, '#D9B48C');
    stampDesignInto(fv, 0.003, S, design, curNick, ink);
    if (curNick) fv.box(S * 0.46, 0.004, S * 0.46, 0.022, 0.012, 0.022, '#5E4426'); // the chipped corner
    faceMesh = fv.mesh({ px: 1.0 });
    body.add(faceMesh);
  }
  buildFace();
  if (faceUp) { body.rotation.x = Math.PI; body.position.y = 0.006 + H + 0.08; }
  function setPress(t) {
    t = clamp(t, 0, 1);
    lift.position.y = (1 - t) * 0.1;
    const sq = t > 0.92 ? 1 - (t - 0.92) / 0.08 * 0.06 : 1;
    lift.scale.set(1 + (1 - sq) * 0.5, sq, 1 + (1 - sq) * 0.5);
  }
  setPress(1);
  return { root, setPress, setNick(on) { curNick = !!on; buildFace(); }, design, dispose() { disposeTree(root); } };
}

/**
 * Khwar Nyo's trial blocks: forty little blocks (0.05 m) strung on a twine that spills in loops out of a
 * cloth satchel; the first ones rough-cut and dark, the last ones fine and pale.
 */
export function trialBlocks() {
  const root = new THREE.Group();
  root.name = 'trialBlocks';
  const v = new VoxelBuilder();
  // satchel lying on its side, flap open, strap looping
  const SX = -0.45;
  v.boxMin(SX - 0.16, 0, -0.14, SX + 0.12, 0.2, 0.12, '#8E6A45');
  v.boxMin(SX - 0.17, 0.0, -0.15, SX - 0.1, 0.21, 0.13, '#7A5838');
  v.boxMin(SX + 0.12, 0.02, -0.12, SX + 0.14, 0.18, 0.1, '#3E2E22'); // the open mouth
  boxR(v, SX + 0.24, 0.02, 0.0, 0.22, 0.012, 0.24, '#9E7A52', 0, 0, -0.15); // flap thrown open
  v.box(SX + 0.33, 0.03, 0.0, 0.03, 0.02, 0.05, C.goldD); // buckle
  for (let i = 0; i < 8; i++) { const a = i * 0.5; v.box(SX - 0.25 - Math.sin(a) * 0.12, 0.012, -0.05 + Math.cos(a) * 0.14 - 0.1, 0.04, 0.012, 0.06, '#7A5838', a); }
  // the twine: a meandering path, 40 blocks threaded on it
  const pts = [];
  const N = 220;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    pts.push([SX + 0.13 + t * 0.9, 0.02 + Math.max(0, 0.06 - t * 0.6), Math.sin(t * Math.PI * 3.2) * 0.22 * (0.4 + t * 0.6)]);
  }
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]));
  for (let i = 1; i < pts.length; i += 2) {
    const [x0, y0, z0] = pts[i - 1], [x1, y1, z1] = pts[Math.min(pts.length - 1, i + 1)];
    boxR(v, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.hypot(x1 - x0, z1 - z0) + 0.004, 0.006, 0.006, C.string, 0, -Math.atan2(z1 - z0, x1 - x0), 0);
  }
  const total = lens[lens.length - 1];
  const r = rand(41);
  let j = 0;
  for (let b = 0; b < 40; b++) {
    const want = 0.04 + (b / 39) * (total - 0.06);
    while (j < lens.length - 1 && lens[j] < want) j++;
    const [x, y, z] = pts[j];
    const [xa, , za] = pts[Math.max(0, j - 1)];
    const ry = -Math.atan2(z - za, x - xa);
    const k = b / 39; // 0 rough .. 1 fine
    const s = 0.05;
    const col = new THREE.Color('#9C7448').lerp(new THREE.Color('#E8CDA0'), k);
    const hex = '#' + col.getHexString(THREE.SRGBColorSpace);
    if (k < 0.5) {
      // rough: chunky, uneven, gouge bites out of the edges
      boxR(v, x, y + s / 2, z, s * (0.9 + r() * 0.2), s * (0.85 + r() * 0.2), s * (0.9 + r() * 0.2), hex, (r() - 0.5) * 0.4, ry + (r() - 0.5) * 0.6, (r() - 0.5) * 0.4);
      boxR(v, x + 0.012, y + s * 0.9, z, s * 0.4, s * 0.25, s * 0.5, shadeHex(hex, 0.8), 0, ry, 0.3);
    } else {
      boxR(v, x, y + s / 2, z, s, s, s, hex, 0, ry, 0);
      boxR(v, x, y + s + 0.001, z, s * 0.7, 0.002, s * 0.7, C.maroon, 0, ry + Math.PI / 4 * (b % 2), 0); // a neat inked mark
    }
  }
  root.add(v.mesh({ px: 1.2 }));
  const shadow = shadowUnder(root, 0.75, 0.35, 0.05, 0, 0.35);
  return { root, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

/** Draws Khwar Nyo's winning mark large: a bookmark ribbon looping round a paper plane, all curls. */
function drawCurlMark(g, cx, cy, R, color = '#6E1F2A') {
  g.save();
  g.translate(cx, cy);
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  // dotted border
  for (let i = 0; i < 36; i++) { const t = i / 36; const s = R * 1.05; const p = t * 8; const side = Math.floor(p / 2), u = (p % 2) / 2 * 2 - 1; const [x, y] = [[u * s, -s], [s, u * s], [-u * s, s], [-s, -u * s]][side]; g.beginPath(); g.arc(x, y, R * 0.025, 0, Math.PI * 2); g.fill(); }
  // the plane
  g.lineWidth = R * 0.05;
  g.beginPath(); g.moveTo(-R * 0.45, R * 0.12); g.lineTo(R * 0.5, -R * 0.28); g.lineTo(-R * 0.12, R * 0.32); g.closePath(); g.stroke();
  g.beginPath(); g.moveTo(R * 0.5, -R * 0.28); g.lineTo(-R * 0.1, R * 0.08); g.lineTo(-R * 0.12, R * 0.32); g.stroke();
  // the ribbon: a long looping curl
  g.lineWidth = R * 0.07;
  g.beginPath();
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * Math.PI * 2.6 - 0.3;
    const rr = R * (0.72 - 0.12 * Math.sin(t * 1.5));
    const x = Math.cos(t) * rr + Math.sin(t * 3) * R * 0.06, y = Math.sin(t) * rr * 0.85;
    if (i) g.lineTo(x, y); else g.moveTo(x, y);
  }
  g.stroke();
  for (const s of [-1, 1]) {
    g.beginPath();
    for (let i = 0; i <= 30; i++) { const a = i * 0.25; const rr = R * 0.14 * (1 - i / 40); const x = s * (R * 0.25 + Math.cos(a) * rr), y = R * 0.8 + Math.sin(a) * rr; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke();
  }
  g.restore();
}
/**
 * The stamp contest notice (1.0 x 0.7 m board): the winning curl design printed large and
 * «စာအုပ်မိတ်ဆက်ပွဲနေ့ တံဆိပ် · ခွာညို». Origin at the back centre (mount on a wall at z = 0), faces +Z.
 */
export function contestNotice() {
  const root = new THREE.Group();
  root.name = 'contestNotice';
  const v = new VoxelBuilder();
  v.box(0, 0, 0.02, 1.06, 0.76, 0.04, C.woodD);
  for (const [x, y] of [[-0.5, 0.35], [0.5, 0.35], [-0.5, -0.35], [0.5, -0.35]]) v.box(x, y, 0.045, 0.07, 0.07, 0.02, C.gold);
  v.box(0, 0.4, 0.04, 0.4, 0.03, 0.04, C.gold);
  root.add(v.mesh());
  const { g, tex } = makeCanvas(640, 448);
  live(tex, () => {
    g.fillStyle = '#FBF5E6';
    g.fillRect(0, 0, 640, 448);
    grain(g, 640, 448, 29, 700);
    g.strokeStyle = '#C9A24A'; g.lineWidth = 6; g.strokeRect(14, 14, 612, 420);
    // the mark sits on a square of inked paper like a giant stamp print
    g.fillStyle = 'rgba(110,31,42,0.06)';
    g.fillRect(212, 34, 216, 216);
    drawCurlMark(g, 320, 142, 96);
    // DRAFT Burmese (Maya to proofread)
    fitText(g, 'စာအုပ်မိတ်ဆက်ပွဲနေ့ တံဆိပ်', 320, 312, 596, 58, { color: '#4A141C' });
    fitText(g, '· ခွာညို ·', 320, 386, 440, 52, { color: '#A47A2C' });
    // a small rosette in the corner
    g.fillStyle = '#C9A24A';
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; g.beginPath(); g.arc(560 + Math.cos(a) * 22, 80 + Math.sin(a) * 22, 12, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#6E1F2A'; g.beginPath(); g.arc(560, 80, 18, 0, Math.PI * 2); g.fill();
    g.fillRect(548, 100, 9, 44); g.fillRect(564, 100, 9, 40);
  });
  const sheet = picture(tex, 0.96, 0.67);
  sheet.position.z = 0.042;
  root.add(sheet);
  return { root, dispose() { disposePictures(root); disposeTree(root); } };
}
