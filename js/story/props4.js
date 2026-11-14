// Ledger Wharf and Newsprint Junction outdoor props (INDEX 11: Wharf D5-6, The Fold / Junction D6-8).
// Same kit as props2.js: vertex-coloured boxes merged with VoxelBuilder (one toon draw call + one outline
// per moving part), Maya's palette, round things as 8- or 12-sided blocky prisms, signs on canvas (Burmese
// first, every line a draft for Maya). Feet at y = 0 and fronts face +Z unless said. Boats: y = 0 is the
// water surface. Jetties and bridges: y = 0 is the deck top at the shore end (the quay / road level);
// `waterY` / `drop` say how far the water or valley floor is below.
//
// Wharf
//   raft({ patches, parcels, pole })        { root, setPole(on), setParcels(n), update(dt, t), seat, dispose }
//   bambooPole({ len, wish })               { root, setWish(on), dispose }       stands along +Y, origin at the foot
//   ferry({ bailing })                      { root, crew, bucket, bail(t), update(dt, t), dispose }
//   jetty({ len, low, name, en, dir, frayed, lamp, ladder })  { root, tip, mooring, waterY, dispose }
//   weighHouse({ door })                    { root, door, setDoor(0..1), dispose }    exterior shell, 5 x 3.5
//   mistBank({ w, h })                      { root, update(dt, t), dispose }
//   parcelPile({ tags })                    { root, dispose }                   tags: 'duck' | 'cane' | 'fish'
//   caneRack({ roof, turned })              { root, setTurned(0..1), dispose }
//   tallyBoard({ wall, marks, bundles })    { root, setMarks(n), rub(), dispose }
//   oldMansPost()                           { root, seat, dispose }
//   wishNote()                              { root, dispose }
//   waterJar({ stand })                     { root, dispose }
// Junction
//   bridgeBoard({ slates, keys, lit })      { root, setSlate(i, text|null), setFaint(i, on), setKeys(n), setLit(on), keys, dispose }
//   brassKey(tag)                           { root, setTag(text), dispose }
//   ropeFootbridge({ len })                 { root, sway(dt, amount), dispose }       runs +X from its west post
//   newBridge({ len, width })               { root, setBoom(0..1), setLamps(0..1), update(dt, t), dispose }  runs +X
//   middlePier({ h })                       { root, handle, setTurn(0..1), dispose }  top at y = 0
//   goldInkWell({ level, pots })            { root, setLevel(0..1), update(dt, t), dispose }
//   inkJar({ full })                        { root, setFull(on), dispose }
//   slipBoard({ slips })                    { root, setSlips([{ text }]), pin(sheet), dispose }
//   bridgeBox()                             { root, dispose }
//   teaCart({ jars })                       { root, setJars(n), update(dt, t), dispose }
//   stepLadder({ jar })                     { root, dispose }
//   printShed({ doors, slate })             { root, door, sideDoor, slate, setDoors(0..1), update(dt, t), dispose }
//   doorEasel({ text })                     { root, slate, dispose }
//   slateGust({ board, toWharf, north })    { root, play(), update(dt), playing, landed, progress, dispose }   Day 6 noon gust fx
// Wharf, indoors
//   ropeRack()                              { root, dispose }                   flat, for room.mount
// The printing shed's own pieces (Junction, D8 / D14; rooms/junction.js bakes its own copies into its rooms)
//   typeCase({ jumbled, labels })           { root, setJumbled(on), sorts, dispose }
//   handPress({ pull })                     { root, bar, pull(0..1), dispose }
//   typeBlock('six'|'title', { faceDown })  { root, kind, setTurn(0..1), setFaceDown(on), dispose }
//   scrapCrate({ title })                   { root, title (typeBlock handle), setTitle(on), dispose }
//   letterTable()                           { root, dispose }
//   disposeShared()                         frees the module caches (halo / mist textures, prism geometry)
// Lights and glows: every lamp here starts dark. setLit / setLamps / setLamp are for the story's own
// reasons only (dusk, Day 8's lamps); the halos are small and dim and never mark where to go.
import * as THREE from '../game/three.js';
import { PALETTE, basic, toon, addOutline, blobShadow, fontsReady, FONT_MY, FONT_SANS, FONT_SERIF, roundRect } from '../game/toon.js';
import { VoxelBuilder, jitter } from '../game/voxel.js';
import { chalkSlate } from './props2.js';

const C = {
  wood: PALETTE.wood, woodD: PALETTE.woodDark, woodL: '#CDA577', woodG: '#A88B66', woodGD: '#8C7254', gold: PALETTE.gold, goldD: PALETTE.goldDeep,
  maroon: PALETTE.maroon, maroonD: PALETTE.maroonDeep, cream: PALETTE.cream, white: PALETTE.white, ink: PALETTE.ink, paper: PALETTE.paper,
  parch: PALETTE.parchment, leaf: PALETTE.leaf, leafD: PALETTE.leafDark, rose: PALETTE.rose, terra: '#B5643C', terraL: '#CB7E4E', terraD: '#8E4A2C',
  brick: '#A0503A', brickD: '#7E3C2B', brickL: '#B86448', mortar: '#D8B9A0', glass: '#BFD3E0', mustard: '#E2B33C', teal: '#3D8A84', tealL: '#5FA39C',
  indigo: '#3E5F7A', iron: '#4A3B30', soot: '#2B1E19', sky: '#9CC3DE', chalk: '#3E4A3F',
  bamboo: '#C8B36E', bambooL: '#DCCB8E', bambooD: '#A8925A', node: '#9C8650', rope: '#C9AE7E', ropeD: '#A88C5E',
  ledger: '#F4EEDC', rRule: '#D98579', bRule: '#8EAFCF', stone: '#D8D0BE', stoneL: '#E7E0D0', stoneD: '#BDB39D', stoneDD: '#9E947E',
  news: '#DAD6CB', newsL: '#E9E6DD', newsD: '#BCB7AA', print: '#8A867C', brass: '#C9A24A', brassL: '#E6C873',
  postRed: '#B8323A', postRedD: '#8E2730', inkGold: '#E3B23A', glazeB: '#2F3D4C', glazeBL: '#45576A',
  reed: '#C9A960', reedD: '#A88A48', reedL: '#DDC283', cane: '#C9B66C', caneG: '#AFB662', caneD: '#9C8A4C',
  hull: '#30485A', hullD: '#243745', hullCream: '#F2EAD6', tin: '#9AA3A6', tinD: '#7D8689', jarBrown: '#5A3A26', jarDrip: '#A8803E',
  interior: '#4E3F33', interiorD: '#3A2E26',
};
const CLOTH = ['#C8323C', '#E2B33C', '#3E5F7A', '#4E8C86', '#E8A0A8', '#6F9E5B', '#D9773A', '#7A4E8C'];
const MY_DIGITS = '၀၁၂၃၄၅၆၇၈၉';

// ---------------------------------------------------------------------------------------------
// small builders (same conventions as props2.js)
// ---------------------------------------------------------------------------------------------
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const TAU = Math.PI * 2;
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };

/** Box with any turn (Euler XYZ, radians) about its own centre. */
function boxR(v, x, y, z, w, h, d, col, rx = 0, ry = 0, rz = 0) {
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(w, h, d));
  v.add(UNIT, col, _m);
}
/** A box stretched between two points (a rope, a brace, a rail), cross-section t x t. */
function beam(v, x0, y0, z0, x1, y1, z1, t, col, t2 = t) {
  const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
  const len = Math.hypot(dx, dy, dz);
  _p.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  _q.setFromUnitVectors(_s.set(1, 0, 0), new THREE.Vector3(dx / len, dy / len, dz / len));
  _m.compose(_p, _q, _s.set(len, t, t2));
  v.add(UNIT, col, _m);
}
const cylCache = new Map();
/** Flat-shaded n-sided prism along Y (a flat facet faces +Z), cached per shape. */
function prismGeo(rTop, rBot, h, seg = 8) {
  const key = `${rTop}|${rBot}|${h}|${seg}`;
  let g = cylCache.get(key);
  if (!g) {
    g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, false, Math.PI / seg).toNonIndexed();
    g.deleteAttribute('uv');
    g.deleteAttribute('normal');
    g.computeVertexNormals();
    cylCache.set(key, g);
  }
  return g;
}
/** Prism by centre: radius top/bottom, height; turned by rx, ry, rz (rz = PI/2 lays it along X, rx = PI/2 along Z). */
function prism(v, x, y, z, rTop, rBot, h, col, seg = 8, rx = 0, ry = 0, rz = 0) {
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(1, 1, 1));
  v.add(prismGeo(rTop, rBot, h, seg), col, _m);
}
/** A ring of n boxes (a hoop, a rope coil, a rim) lying flat at height y, or standing (axis 'z'/'x'). */
function ring(v, x, y, z, r, t, col, n = 10, axis = 'y', h = t) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, len = 2 * r * Math.tan(Math.PI / n) + t * 0.6;
    if (axis === 'y') boxR(v, x + Math.cos(a) * r, y, z + Math.sin(a) * r, t, h, len, col, 0, -a, 0);
    else if (axis === 'z') boxR(v, x + Math.cos(a) * r, y + Math.sin(a) * r, z, t, len, h, col, 0, 0, a);
    else boxR(v, x, y + Math.sin(a) * r, z + Math.cos(a) * r, h, t, len, col, -a, 0, 0);
  }
}
function shadowUnder(root, rx, rz, x = 0, z = 0, opacity = 0.5) {
  const s = blobShadow(rx, rz, opacity);
  s.position.x = x;
  s.position.z = z;
  root.add(s);
  return s;
}
function freeMesh(m) {
  if (!m) return;
  m.geometry.dispose();
  for (const c of m.children) if (!c.userData.isOutline) c.geometry?.dispose();
  m.removeFromParent();
}
/** Frees geometries, canvas textures and own materials under root (shared toon/outline materials stay). */
function disposeTree(root, own = []) {
  root.traverse((o) => {
    if (o.geometry && !o.userData.sharedGeo) o.geometry.dispose();
    if (o.userData.ownMat) { if (!o.userData.sharedMap) o.material.map?.dispose(); o.material.dispose(); }
  });
  for (const x of own) x?.dispose?.();
  root.removeFromParent();
}
// deterministic random
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
const myNum = (n) => String(n).replace(/[0-9]/g, (d) => MY_DIGITS[d]);

// ---------------------------------------------------------------------------------------------
// canvases (drawn now and again once the Burmese font is in)
// ---------------------------------------------------------------------------------------------
function liveCanvas(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  let dead = false;
  tex.addEventListener('dispose', () => { dead = true; });
  const redraw = () => { if (dead) return; draw(cv.getContext('2d'), w, h); tex.needsUpdate = true; };
  redraw();
  fontsReady().then(redraw); // a no-op if the prop was disposed before the font came in
  return { cv, tex, redraw };
}
function fitText(g, text, x, y, size, maxW, { weight = 700, font = FONT_MY, color = C.ink, align = 'center' } = {}) {
  g.font = `${weight} ${size}px ${font}`;
  const tw = g.measureText(text).width;
  if (tw > maxW) { size *= maxW / tw; g.font = `${weight} ${size}px ${font}`; }
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillText(text, x, y);
  return size;
}
/** A flat unlit plane with its own canvas texture (a painted sign). Faces +Z. */
function signPlane(tex, w, h, opts = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic(PALETTE.white, { map: tex, transparent: !!opts.transparent, alphaTest: opts.transparent ? 0.05 : 0 }));
  m.userData.ownMat = true;
  return m;
}
/** Painted board: a cream plank sign with a border, Burmese line and an optional small English line. */
function paintBoard(g, W, H, { my, en, bg = C.cream, border = C.maroon, ink = C.maroon, inkEn = C.woodD, grain = true }) {
  g.clearRect(0, 0, W, H);
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  if (grain) {
    const r = rand(W + H);
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(120,84,52,${0.04 + r() * 0.05})`; g.fillRect(0, r() * H, W, 1 + r() * 3); }
  }
  g.strokeStyle = border;
  g.lineWidth = H * 0.06;
  g.strokeRect(H * 0.05, H * 0.05, W - H * 0.1, H - H * 0.1);
  const big = en ? H * 0.34 : H * 0.42;
  fitText(g, my, W / 2, en ? H * 0.42 : H * 0.5, big, W * 0.84, { color: ink });
  if (en) fitText(g, en, W / 2, H * 0.76, H * 0.15, W * 0.8, { weight: 600, font: FONT_SERIF, color: inkEn });
}

/** A chalk slate face drawn into a cell of an atlas (wiped smudges, chalk lines with a soft pass, dust specks). */
function drawChalkCell(g, x, y, W, H, lines, seed = 7) {
  const r = rand(seed);
  g.save();
  g.beginPath(); g.rect(x, y, W, H); g.clip();
  g.fillStyle = '#3E4A3F'; g.fillRect(x, y, W, H);
  for (let i = 0; i < 5; i++) {
    g.fillStyle = `rgba(200,210,200,${0.04 + r() * 0.05})`;
    g.beginPath(); g.ellipse(x + r() * W, y + r() * H, W * (0.12 + r() * 0.2), H * (0.08 + r() * 0.12), r() * 3, 0, TAU); g.fill();
  }
  const list = lines.filter(Boolean);
  if (list.length) {
    const base = Math.min(H / (list.length * 1.75), 110);
    list.forEach((l, i) => {
      const yy = y + H / 2 + (i - (list.length - 1) / 2) * base * 1.7;
      g.globalAlpha = 0.35; fitText(g, l, x + W / 2 + 2, yy + 2, base, W * 0.86, { color: '#F4F1E8' });
      g.globalAlpha = 0.92; fitText(g, l, x + W / 2, yy, base, W * 0.86, { color: '#F4F1E8' });
      g.globalAlpha = 1;
    });
  }
  for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? 'rgba(58,70,62,0.55)' : 'rgba(240,240,232,0.10)'; g.fillRect(x + r() * W, y + r() * H, 1.5 + r() * 2, 1.5 + r() * 2); }
  g.restore();
}

/** Many textured quads from one atlas, merged into one mesh; quads can be hidden one by one. */
class Quads {
  constructor(cw, ch) { this.cw = cw; this.ch = ch; this.list = []; }
  /** x,y,z centre; w,h size; rx,ry,rz turn (order YXZ: rx -PI/2 lays it flat, ry then spins it); cell [px, py, pw, ph] */
  add(x, y, z, w, h, cell, rx = 0, ry = 0, rz = 0) { this.list.push({ x, y, z, w, h, cell, rx, ry, rz }); return this.list.length - 1; }
  mesh(tex, opts = {}) {
    const n = this.list.length;
    const pos = new Float32Array(n * 12), uv = new Float32Array(n * 8), idx = [];
    const v = new THREE.Vector3(), e = new THREE.Euler(0, 0, 0, 'YXZ'), m = new THREE.Matrix4(), q = new THREE.Quaternion();
    this.list.forEach((o, i) => {
      m.compose(v.set(o.x, o.y, o.z), q.setFromEuler(e.set(o.rx, o.ry, o.rz, 'YXZ')), new THREE.Vector3(1, 1, 1));
      const c = [[-o.w / 2, -o.h / 2], [o.w / 2, -o.h / 2], [o.w / 2, o.h / 2], [-o.w / 2, o.h / 2]];
      c.forEach(([a, b], k) => { v.set(a, b, 0).applyMatrix4(m); pos.set([v.x, v.y, v.z], i * 12 + k * 3); });
      const [px, py, pw, ph] = o.cell;
      const u0 = px / this.cw, u1 = (px + pw) / this.cw, vT = 1 - py / this.ch, vB = 1 - (py + ph) / this.ch;
      uv.set([u0, vB, u1, vB, u1, vT, u0, vT], i * 8);
      idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    this.base = pos.slice();
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: opts.additive ? 0 : 0.05, toneMapped: false, depthWrite: !opts.additive,
      blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: opts.side ?? THREE.FrontSide, opacity: opts.opacity ?? 1 });
    this.m = new THREE.Mesh(g, mat);
    this.m.userData.ownMat = true;
    this.m.userData.sharedMap = !!opts.sharedMap;
    return this.m;
  }
  setVisible(i, on) {
    const a = this.m.geometry.attributes.position;
    for (let k = 0; k < 12; k++) a.array[i * 12 + k] = on ? this.base[i * 12 + k] : this.base[i * 12 + (k % 3)];
    a.needsUpdate = true;
  }
}

/** n little cubes in one unlit mesh, moved by set(i, x, y, z, s) then commit(): steam, smoke, drops. */
class Puffs {
  /** cols: optional list of colours, one per cube (cube i takes cols[i % cols.length]); then one draw call serves several kinds. */
  constructor(n, col, opacity = 0.6, cols = null) {
    this.n = n;
    const b = UNIT.toNonIndexed();
    this.unit = b.attributes.position.array;
    b.dispose();
    this.per = this.unit.length;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.per * n), 3));
    if (cols) {
      const ca = new Float32Array(this.per * n), c = new THREE.Color();
      for (let i = 0; i < n; i++) {
        c.set(cols[i % cols.length]).convertSRGBToLinear();
        for (let k = 0; k < this.per; k += 3) ca.set([c.r, c.g, c.b], i * this.per + k);
      }
      g.setAttribute('color', new THREE.BufferAttribute(ca, 3));
    }
    g.computeBoundingSphere();
    this.mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(cols ? '#ffffff' : col), vertexColors: !!cols, transparent: true, opacity, depthWrite: false, toneMapped: false });
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.raycast = () => {};
    this.mesh.userData.ownMat = true;
  }
  set(i, x, y, z, s) {
    const a = this.mesh.geometry.attributes.position.array, u = this.unit, o = i * this.per;
    for (let k = 0; k < this.per; k += 3) { a[o + k] = x + u[k] * s; a[o + k + 1] = y + u[k + 1] * s; a[o + k + 2] = z + u[k + 2] * s; }
  }
  commit() { this.mesh.geometry.attributes.position.needsUpdate = true; }
}

let haloTex = null;
function haloTexture() {
  if (haloTex) return haloTex;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,214,140,0.7)');
  grd.addColorStop(0.3, 'rgba(255,184,100,0.28)');
  grd.addColorStop(0.6, 'rgba(255,160,70,0.06)');
  grd.addColorStop(1, 'rgba(255,140,50,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  haloTex = new THREE.CanvasTexture(cv);
  haloTex.colorSpace = THREE.SRGBColorSpace;
  return haloTex;
}
/** Additive soft glows (one draw call for many lamps); returns { mesh, set(0..1) }. */
function halos(points, size = 0.9) {
  const q = new Quads(64, 64);
  for (const [x, y, z, s = 1] of points) q.add(x, y, z, size * s, size * s, [0, 0, 64, 64]);
  const mesh = q.mesh(haloTexture(), { additive: true, sharedMap: true });
  mesh.renderOrder = 3;
  mesh.raycast = () => {};
  return { mesh, set(t) { mesh.material.opacity = t; mesh.visible = t > 0.01; } };
}

// =============================================================================================
// LEDGER WHARF
// =============================================================================================

/** Folded scrap of ledger paper (red and blue rules), ~0.12 m: a wish pinned on the pole. Origin at the pin. */
function wishInto(v, x, y, z, ry = 0) {
  const cs = Math.cos(ry), sn = Math.sin(ry);
  const P = (dx, dy, dz) => [x + dx * cs + dz * sn, y + dy, z - dx * sn + dz * cs];
  // two leaves of a fold, the front one a little open
  let [a, b, c] = P(0, -0.045, 0.004);
  boxR(v, a, b, c, 0.1, 0.085, 0.006, C.ledger, 0.12, ry, 0.05);
  [a, b, c] = P(0.004, -0.05, -0.002);
  boxR(v, a, b, c, 0.1, 0.08, 0.005, '#E8E0C8', -0.05, ry, 0.05);
  for (const [k, col] of [[-0.02, C.bRule], [-0.045, C.bRule], [-0.07, C.rRule]]) {
    [a, b, c] = P(0.002, k, 0.012);
    boxR(v, a, b, c, 0.085, 0.004, 0.003, col, 0.12, ry, 0.05);
  }
  [a, b, c] = P(-0.025, -0.045, 0.014);
  boxR(v, a, b, c, 0.003, 0.08, 0.003, C.rRule, 0.12, ry, 0.05); // the margin rule
  [a, b, c] = P(0, 0, 0.012);
  prism(v, a, b, c, 0.012, 0.012, 0.012, C.gold, 6, Math.PI / 2, ry, 0); // the pin head
}
export function wishNote() {
  const root = new THREE.Group();
  root.name = 'wishNote';
  const v = new VoxelBuilder();
  wishInto(v, 0, 0, 0);
  root.add(v.mesh({ px: 1.1 }));
  return { root, dispose() { disposeTree(root); } };
}

function poleInto(v, len = 3.6, x = 0, z = 0) {
  const r = 0.034, seg = 0.42;
  let y = 0;
  let i = 0;
  while (y < len - 0.01) {
    const h = Math.min(seg, len - y);
    const wet = y < 0.7;
    prism(v, x, y + h / 2, z, r * (1 - y / len * 0.18), r * (1 - (y + h) / len * 0.18 + 0.004), h, jitter(wet ? '#8E7C4E' : (i % 2 ? C.bamboo : C.bambooD), 0.05, i), 6);
    if (y + h < len - 0.02) prism(v, x, y + h, z, r * 1.2, r * 1.2, 0.03, wet ? '#6E5F3A' : C.node, 6);
    y += h;
    i++;
  }
  prism(v, x, len + 0.006, z, r * 0.7, r * 0.7, 0.012, C.bambooL, 6); // cut end
  // the new cloth grip near the top: bright, wrapped, a tied tail
  const g0 = len - 0.78;
  prism(v, x, g0 + 0.16, z, r * 1.32, r * 1.32, 0.32, '#D9573A', 6);
  for (let k = 0; k < 5; k++) boxR(v, x, g0 + 0.03 + k * 0.065, z + r * 1.1, 0.07, 0.014, 0.012, '#F3B27A', 0, 0, 0.45);
  prism(v, x, g0 + 0.005, z, r * 1.4, r * 1.4, 0.016, '#A8402A', 6);
  prism(v, x, g0 + 0.325, z, r * 1.4, r * 1.4, 0.016, '#A8402A', 6);
  boxR(v, x + 0.04, g0 - 0.03, z + 0.03, 0.016, 0.09, 0.01, '#D9573A', 0, 0, -0.3);
  boxR(v, x + 0.055, g0 - 0.035, z + 0.02, 0.014, 0.07, 0.01, '#E26A48', 0, 0, -0.55);
  // a band of old worn tape lower down, where his hands used to go
  prism(v, x, len - 1.4, z, r * 1.18, r * 1.18, 0.12, '#9C8F78', 6);
}
/** Ko Thiha's bamboo pole, standing along +Y (origin at the wet foot); a bright new cloth grip near the top. */
export function bambooPole({ len = 3.6, wish = false } = {}) {
  const root = new THREE.Group();
  root.name = 'bambooPole';
  const v = new VoxelBuilder();
  poleInto(v, len);
  root.add(v.mesh({ px: 1.2 }));
  let note = null;
  function setWish(on) {
    freeMesh(note);
    note = null;
    if (!on) return;
    const w = new VoxelBuilder();
    wishInto(w, 0, len - 0.86, 0.04, 0);
    note = w.mesh({ px: 1.0 });
    root.add(note);
  }
  setWish(wish);
  return { root, setWish, dispose() { disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// raft
// ---------------------------------------------------------------------------------------------
const RAFT_PATCH = [[-1.12, -0.36, 0.1], [-0.62, 0.32, -0.15], [-0.18, -0.42, 0.05], [0.42, 0.36, 0.2], [0.82, -0.34, -0.08], [1.24, 0.3, 0.12], [-1.3, 0.44, -0.05]];

function parcelsInto(v, list, seed = 1) {
  const r = rand(seed);
  for (const [x, y, z, w, h, d] of list) {
    const ry = (r() - 0.5) * 0.3;
    const col = jitter('#B88E5E', 0.07, x * 13 + z * 7);
    v.box(x, y + h / 2, z, w, h, d, col, ry);
    // string crossed over the top and down the front
    v.box(x, y + h + 0.004, z, w + 0.004, 0.008, 0.014, '#EDE2C6', ry);
    v.box(x, y + h + 0.004, z, 0.014, 0.008, d + 0.004, '#EDE2C6', ry);
    const cs = Math.cos(ry), sn = Math.sin(ry);
    v.box(x + (d / 2 + 0.002) * sn, y + h / 2, z + (d / 2 + 0.002) * cs, 0.014, h, 0.006, '#EDE2C6', ry);
    v.box(x + (d / 2 + 0.002) * sn, y + h / 2, z + (d / 2 + 0.002) * cs, w * 0.9, 0.012, 0.006, '#D9C8A2', ry);
    v.box(x, y + h + 0.012, z, 0.04, 0.012, 0.04, '#EDE2C6', ry); // the knot
  }
}

/**
 * Ko Thiha's old flat raft, 3.2 x 1.6, deck ~0.2 above the water (y = 0 is the water): eight bamboo floats,
 * lashed crossbars, weathered planks, seven cloth patches each stitched with its year (၁-၇), his stool,
 * a water pot, a rope coil and a mooring post. setPole(on) lays his pole on the deck; setParcels(n) 0..5.
 */
export function raft({ patches = 7, parcels = 0, pole = true } = {}) {
  const root = new THREE.Group();
  root.name = 'raft';
  const float = new THREE.Group();
  root.add(float);
  const v = new VoxelBuilder();
  const L = 3.2;
  for (let i = 0; i < 8; i++) {
    const z = -0.7 + i * 0.2, off = (i % 2) * 0.05, len = L - off * 2;
    prism(v, 0, 0, z, 0.088, 0.088, len, jitter(i % 3 ? C.bambooD : C.bamboo, 0.06, i + 3), 8, 0, 0, Math.PI / 2);
    for (let k = -3; k <= 3; k++) prism(v, k * 0.46 + (i % 2) * 0.13, 0, z, 0.095, 0.095, 0.03, C.node, 8, 0, 0, Math.PI / 2);
    for (const s of [-1, 1]) prism(v, s * (len / 2 + 0.004), 0, z, 0.06, 0.06, 0.01, '#E6D7A6', 8, 0, 0, Math.PI / 2);
  }
  // crossbars, lashed to every float
  for (const x of [-1.35, -0.45, 0.45, 1.35]) {
    v.box(x, 0.115, 0, 0.09, 0.07, 1.74, C.woodGD);
    for (let i = 0; i < 8; i++) v.box(x, 0.06, -0.7 + i * 0.2, 0.12, 0.09, 0.045, jitter(C.rope, 0.06, i + x * 10));
  }
  // weathered deck planks across, two missing (the floats show), a few short or replaced
  const r = rand(17);
  for (let k = 0; k < 15; k++) {
    if (k === 3 || k === 10) continue;
    const x = -1.4 + k * 0.2, short = k === 6 ? 0.3 : 0;
    const col = k === 8 ? '#C9A97A' : jitter([C.woodG, '#B89A72', C.woodGD][k % 3], 0.05, k);
    v.box(x, 0.172, short / 2, 0.185, 0.045, 1.5 - short, col);
    for (const zz of [-0.45, 0.45]) v.box(x + (r() - 0.5) * 0.06, 0.197, zz + (r() - 0.5) * 0.4, 0.17, 0.004, 0.01, '#8C7254'); // grain
    for (const zz of [-0.7, 0.7]) v.box(x, 0.197, zz, 0.025, 0.006, 0.025, C.iron); // nails
  }
  // seven cloth patches, stitched round the edge
  const D = 0.197;
  RAFT_PATCH.slice(0, patches).forEach(([x, z, ry], i) => {
    const w = 0.34 + (i % 3) * 0.03, d = 0.27 + (i % 2) * 0.03;
    v.box(x, D + 0.006, z, w, 0.012, d, CLOTH[i], ry);
    const cs = Math.cos(ry), sn = Math.sin(ry);
    const th = i === 1 || i === 4 ? '#FFF6E2' : '#3B2A1A';
    for (let k = 0; k < 5; k++) {
      const t = (k + 0.5) / 5 - 0.5;
      for (const s of [-1, 1]) {
        let lx = t * w, lz = s * (d / 2 - 0.018);
        v.box(x + lx * cs + lz * sn, D + 0.0135, z - lx * sn + lz * cs, 0.035, 0.003, 0.008, th, ry);
        lx = s * (w / 2 - 0.018); lz = t * d * 0.9;
        if (k < 4) v.box(x + lx * cs + lz * sn, D + 0.0135, z - lx * sn + lz * cs, 0.008, 0.003, 0.03, th, ry);
      }
    }
  });
  // his stool, a clay water pot with a cup, a rope coil, a mooring post at the bow
  v.box(-1.22, D + 0.11, 0.02, 0.32, 0.03, 0.24, C.woodL);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(-1.22 + sx * 0.13, D + 0.05, 0.02 + sz * 0.09, 0.035, 0.1, 0.035, C.woodD);
  prism(v, -1.4, D + 0.08, -0.5, 0.1, 0.07, 0.16, C.terra, 8);
  prism(v, -1.4, D + 0.17, -0.5, 0.06, 0.09, 0.03, C.terraD, 8);
  prism(v, -1.4, D + 0.188, -0.5, 0.05, 0.05, 0.004, C.soot, 8);
  prism(v, -1.25, D + 0.03, -0.55, 0.035, 0.03, 0.06, C.tin, 8);
  for (let k = 0; k < 3; k++) ring(v, 1.18, D + 0.02 + k * 0.03, 0.5, 0.14 - k * 0.025, 0.035, jitter(C.rope, 0.05, k), 10, 'y', 0.03);
  prism(v, 1.5, D + 0.13, 0, 0.05, 0.06, 0.26, C.woodD, 8);
  prism(v, 1.5, D + 0.27, 0, 0.065, 0.065, 0.03, '#5E4128', 8);
  ring(v, 1.5, D + 0.18, 0, 0.065, 0.025, C.ropeD, 8, 'y', 0.03);
  beam(v, 1.53, D + 0.18, 0.04, 1.75, 0.02, 0.18, 0.03, C.ropeD); // the loose rope down to the water
  const body = v.mesh();
  float.add(body);

  // the year marks: stitched Burmese numerals ၁-၇ (one atlas)
  const atlas = liveCanvas(896, 128, (g) => {
    g.clearRect(0, 0, 896, 128);
    for (let i = 0; i < 7; i++) {
      const light = i === 1 || i === 4;
      g.save();
      g.translate(i * 128 + 64, 66);
      g.font = `700 92px ${FONT_MY}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.lineWidth = 7;
      g.setLineDash([11, 7]);
      g.strokeStyle = light ? '#7A3B12' : '#FFF6E2';
      g.strokeText(MY_DIGITS[i + 1], 0, 0);
      g.restore();
    }
  });
  const q = new Quads(896, 128);
  RAFT_PATCH.slice(0, patches).forEach(([x, z, ry], i) => q.add(x, D + 0.0145, z, 0.22, 0.22, [i * 128, 0, 128, 128], -Math.PI / 2, ry));
  const marks = q.mesh(atlas.tex);
  float.add(marks);

  // foam where the floats sit in the water
  const fv = new VoxelBuilder();
  for (const s of [-1, 1]) {
    fv.box(0, 0.004, s * 0.81, 3.25, 0.01, 0.07, '#ffffff');
    fv.box(s * 1.64, 0.004, 0, 0.08, 0.01, 1.62, '#ffffff');
    for (let k = 0; k < 4; k++) fv.box(-1.2 + k * 0.8 + s * 0.1, 0.004, s * 0.88, 0.3, 0.01, 0.05, '#ffffff');
  }
  const foam = new THREE.Mesh(fv.geometry(), basic('#FFFFFF', { transparent: true, opacity: 0.55, depthWrite: false }));
  foam.raycast = () => {};
  root.add(foam);
  const shadow = shadowUnder(root, 1.9, 1.05, 0, 0, 0.3);

  const seat = new THREE.Object3D();
  seat.position.set(-1.22, D + 0.13, 0.02);
  float.add(seat);
  let poleH = null, parcelMesh = null;
  function setPole(on) {
    if (on && !poleH) {
      poleH = bambooPole({ len: 3.6 });
      poleH.root.rotation.z = -Math.PI / 2;
      poleH.root.position.set(-1.75, D + 0.04, 0.66);
      float.add(poleH.root);
    } else if (!on && poleH) { poleH.dispose(); poleH = null; }
  }
  function setParcels(n) {
    freeMesh(parcelMesh);
    parcelMesh = null;
    if (!n) return;
    const pv = new VoxelBuilder();
    const spots = [[0.05, D, -0.05, 0.3, 0.2, 0.24], [0.4, D, -0.08, 0.26, 0.16, 0.22], [0.08, D + 0.2, -0.04, 0.24, 0.14, 0.2], [0.24, D, 0.22, 0.24, 0.18, 0.2], [0.42, D + 0.16, -0.06, 0.2, 0.12, 0.18]];
    parcelsInto(pv, spots.slice(0, Math.min(5, n)), 9);
    parcelMesh = pv.mesh({ px: 1.3 });
    float.add(parcelMesh);
  }
  setPole(pole);
  setParcels(parcels);
  return {
    root, seat, setPole, setParcels,
    update(dt, t) {
      float.position.y = Math.sin(t * 1.3) * 0.022;
      float.rotation.z = Math.sin(t * 0.9) * 0.018;
      float.rotation.x = Math.sin(t * 1.1 + 1) * 0.022;
    },
    dispose() { poleH?.dispose(); atlas.tex.dispose(); shadow.geometry.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// ferry
// ---------------------------------------------------------------------------------------------
/** Top-view outline of the hull (x along the length, bow at +x), scaled; returns Vector2s (CCW). */
function hullPts(L, B, sx = 1, sz = 1, bowLen = 2.3, r = 0.5) {
  const pts = [];
  const x0 = L / 2 - bowLen;
  const P = (x, y) => pts.push(new THREE.Vector2(x * sx, y * sz));
  P(L / 2, 0);
  for (let k = 7; k >= 0; k--) { const t = k / 8; P(x0 + bowLen * t, (B / 2) * (1 - t * t)); }
  for (let k = 0; k <= 3; k++) { const a = (k / 3) * (Math.PI / 2); P(-L / 2 + r - Math.sin(a) * r, B / 2 - r + Math.cos(a) * r); }
  for (let k = 0; k <= 3; k++) { const a = (k / 3) * (Math.PI / 2); P(-L / 2 + r - Math.cos(a) * r, -B / 2 + r - Math.sin(a) * r); }
  for (let k = 0; k <= 7; k++) { const t = k / 8; P(x0 + bowLen * t, -(B / 2) * (1 - t * t)); }
  return pts;
}
function hullSlab(v, L, B, y0, y1, col, sx = 1, sz = 1, hole = null) {
  const shape = new THREE.Shape(hullPts(L, B, sx, sz));
  if (hole) shape.holes.push(new THREE.Path(hullPts(L, B, hole[0], hole[1]).reverse()));
  const g = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0, 0);
  v.add(g, col);
  g.dispose();
}

/**
 * The new ferry, 9 x 2.6, deck at 1.0 (y = 0 is the water; bow at +X): deep dark hull, cream and teal
 * paint, a gold rubbing strake, portholes, a windowed cabin with a luggage rack, a stove pipe, rope
 * fenders, benches and cargo on the fore deck. `crew` is where the bailing crewman stands (at the +Z rail,
 * facing +Z); `bail(t)` swings the bucket over the rail and tips it (water falls to the river).
 */
export function ferry({ bailing = true } = {}) {
  const root = new THREE.Group();
  root.name = 'ferry';
  const float = new THREE.Group();
  root.add(float);
  const L = 9, B = 2.6;
  const v = new VoxelBuilder();
  hullSlab(v, L, B, -0.45, -0.05, C.hullD, 0.92, 0.78);
  hullSlab(v, L, B, -0.05, 0.62, C.hull);
  hullSlab(v, L, B, 0.62, 0.7, C.hullCream, 1.006, 1.012);
  hullSlab(v, L, B, 0.7, 0.94, C.teal, 1.01, 1.02);
  hullSlab(v, L, B, 0.94, 1.0, C.goldD, 1.016, 1.045);
  hullSlab(v, L, B, 0.94, 0.99, '#D6B88C', 0.99, 0.95); // the deck
  hullSlab(v, L, B, 1.0, 1.3, C.hullCream, 1.0, 1.0, [0.985, 0.94]); // bulwark
  hullSlab(v, L, B, 1.3, 1.35, C.teal, 1.004, 1.012, [0.982, 0.93]); // cap rail
  // deck seams
  for (let k = -5; k <= 5; k++) v.box(-0.5, 0.993, k * 0.2, 7.2, 0.006, 0.012, '#B08A5E');
  // portholes along the hull (+Z side faces the quay camera), a painted waterline number
  for (let k = 0; k < 6; k++) {
    const x = -3.4 + k * 0.85;
    for (const s of [-1, 1]) {
      v.box(x, 0.38, s * (B / 2 + 0.005), 0.17, 0.17, 0.02, C.brass);
      v.box(x, 0.38, s * (B / 2 + 0.015), 0.11, 0.11, 0.01, '#1A2228');
      v.box(x - 0.025, 0.405, s * (B / 2 + 0.02), 0.03, 0.03, 0.006, '#6F8A99');
    }
  }
  for (let k = 0; k < 4; k++) v.box(3.55, 0.08 + k * 0.12, B / 2 - 0.6 + 0.004 * k, 0.06, 0.015, 0.01, C.hullCream); // draught marks
  // cabin: cream walls, teal window posts, glass with glare, a cream roof edged in teal
  const X0 = -3.6, X1 = 0.6, CZ = 0.95, top = 2.4;
  v.boxMin(X0, 1.0, -CZ, X1, 1.62, CZ, C.hullCream);
  v.boxMin(X0, 2.22, -CZ, X1, top, CZ, C.hullCream);
  v.boxMin(X0 + 0.04, 1.62, -CZ + 0.04, X1 - 0.04, 2.22, CZ - 0.04, '#2E3A40'); // dark cabin seen through the glass
  const nW = 6, ww = (X1 - X0) / nW;
  for (let k = 0; k <= nW; k++) for (const s of [-1, 1]) v.box(X0 + k * ww, 1.92, s * CZ, 0.08, 0.62, 0.06, C.teal);
  for (let k = 0; k < nW; k++) for (const s of [-1, 1]) {
    v.box(X0 + (k + 0.5) * ww, 1.92, s * (CZ - 0.01), ww - 0.08, 0.56, 0.02, '#8FB2C4');
    v.box(X0 + (k + 0.5) * ww - 0.12, 1.95, s * (CZ + 0.003), 0.06, 0.4, 0.01, '#D9ECF2', 0); // glare
    v.box(X0 + (k + 0.5) * ww, 1.68, s * (CZ + 0.02), ww - 0.04, 0.04, 0.05, C.teal); // sill
  }
  for (const x of [X0, X1]) {
    v.box(x, 1.92, 0, 0.06, 0.62, 2 * CZ, C.teal);
    for (const z of [-0.45, 0.45]) v.box(x + (x > 0 ? 0.01 : -0.01), 1.92, z, 0.02, 0.5, 0.7, '#8FB2C4');
  }
  v.box(X0 - 0.01, 1.32, 0, 0.04, 0.6, 0.6, C.teal); // aft door
  v.box((X0 + X1) / 2, 1.3, CZ + 0.006, X1 - X0, 0.05, 0.01, C.teal); // a teal line round the cabin
  v.boxMin(X0 - 0.25, top, -CZ - 0.22, X1 + 0.3, top + 0.1, CZ + 0.22, C.hullCream);
  v.boxMin(X0 - 0.27, top + 0.02, CZ + 0.2, X1 + 0.32, top + 0.08, CZ + 0.24, C.teal);
  v.boxMin(X0 - 0.27, top + 0.02, -CZ - 0.24, X1 + 0.32, top + 0.08, -CZ - 0.2, C.teal);
  // roof rack: rails, bundles, a rolled mat, a basket
  for (const s of [-1, 1]) v.box((X0 + X1) / 2, top + 0.24, s * 0.85, X1 - X0 - 0.2, 0.04, 0.04, C.woodD);
  for (let k = 0; k < 6; k++) for (const s of [-1, 1]) v.box(X0 + 0.15 + k * 0.78, top + 0.17, s * 0.85, 0.04, 0.14, 0.04, C.woodD);
  parcelsInto(v, [[-2.6, top + 0.1, -0.2, 0.5, 0.26, 0.4], [-2.0, top + 0.1, 0.25, 0.42, 0.22, 0.36], [-1.95, top + 0.32, 0.2, 0.3, 0.16, 0.26]], 4);
  prism(v, -0.9, top + 0.22, 0, 0.12, 0.12, 1.2, '#D6C08C', 8, Math.PI / 2, 0, 0); // rolled mat
  for (const z of [-0.4, 0, 0.4]) prism(v, -0.9, top + 0.22, z, 0.125, 0.125, 0.04, '#9C7F4E', 8, Math.PI / 2, 0, 0);
  prism(v, -0.1, top + 0.22, -0.4, 0.2, 0.16, 0.24, C.reed, 8);
  prism(v, -0.1, top + 0.345, -0.4, 0.21, 0.21, 0.03, C.reedD, 8);
  // life ring on the cabin side
  ring(v, 0.1, 1.95, CZ + 0.06, 0.17, 0.07, '#D9573A', 10, 'z', 0.06);
  for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + 0.4; v.box(0.1 + Math.cos(a) * 0.17, 1.95 + Math.sin(a) * 0.17, CZ + 0.095, 0.08, 0.08, 0.02, C.hullCream); }
  // stove pipe with a gold band, a stern flag (maroon and gold, no emblem)
  prism(v, X0 + 0.4, top + 0.55, -0.4, 0.08, 0.09, 0.9, '#2B2B2B', 8);
  prism(v, X0 + 0.4, top + 0.85, -0.4, 0.1, 0.1, 0.06, C.gold, 8);
  prism(v, X0 + 0.4, top + 1.02, -0.4, 0.12, 0.08, 0.06, '#2B2B2B', 8);
  v.box(-4.25, 1.9, 0, 0.04, 1.8, 0.04, C.woodD);
  for (let k = 0; k < 4; k++) v.box(-4.25 - 0.1 - k * 0.12, 2.62 - k * 0.025, 0, 0.14, 0.28 - k * 0.06, 0.02, k % 2 ? C.gold : C.maroon);
  // stern: tiller, a crate, a coiled line
  v.box(-4.15, 1.12, 0.3, 0.1, 0.24, 0.1, C.woodD);
  boxR(v, -3.95, 1.25, 0.3, 0.5, 0.05, 0.05, C.woodD, 0, 0, 0.2);
  v.box(-4.0, 1.12, -0.55, 0.4, 0.24, 0.3, C.wood);
  for (let k = 0; k < 3; k++) ring(v, -3.9, 1.01 + k * 0.03, 0.75, 0.15 - k * 0.03, 0.035, C.rope, 10, 'y', 0.03);
  // fore deck: two benches across, sacks and a basket, bollards, an anchor, a rope coil
  for (const x of [1.15, 2.05]) {
    v.box(x, 1.4, -0.12, 0.34, 0.05, 1.6, C.woodL);
    v.box(x - 0.14, 1.62, -0.12, 0.05, 0.3, 1.6, C.wood);
    for (const z of [-0.8, 0.55]) v.box(x, 1.2, z, 0.3, 0.4, 0.05, C.woodD);
  }
  for (const [x, z, s] of [[2.85, -0.55, 0], [3.1, -0.15, 1], [2.75, -0.2, 2]]) {
    v.box(x, 1.13, z, 0.36, 0.26, 0.28, jitter('#E6DCC2', 0.05, s), 0.3 * s);
    v.box(x, 1.27, z, 0.12, 0.04, 0.12, '#C9B48A', 0.3 * s);
  }
  prism(v, 3.3, 1.12, 0.35, 0.16, 0.12, 0.24, C.reed, 8);
  for (const [x, z] of [[3.75, -0.3], [3.75, 0.3]]) { prism(v, x, 1.1, z, 0.06, 0.06, 0.2, C.iron, 8); prism(v, x, 1.21, z, 0.08, 0.08, 0.03, C.iron, 8); }
  v.box(4.05, 1.05, 0, 0.3, 0.05, 0.05, C.iron);
  v.box(4.05, 1.05, 0, 0.05, 0.05, 0.36, C.iron);
  for (let k = 0; k < 3; k++) ring(v, 3.55, 1.01 + k * 0.03, 0.05, 0.13 - k * 0.025, 0.03, C.rope, 10, 'y', 0.03);
  // rope fenders hung over the +Z side
  for (const x of [-2.9, -1.0, 2.6]) {
    prism(v, x, 0.82, B / 2 + 0.08, 0.075, 0.075, 0.34, C.ropeD, 8);
    v.box(x, 1.18, B / 2 + 0.03, 0.025, 0.25, 0.025, C.rope);
  }
  // name board on the cabin's +Z face (painted canvas below)
  v.box(-1.5, 2.31, CZ + 0.03, 1.4, 0.2, 0.03, C.teal);
  const body = v.mesh();
  float.add(body);
  const name = liveCanvas(512, 72, (g, W, H) => {
    g.fillStyle = C.hullCream; g.fillRect(0, 0, W, H);
    fitText(g, 'ကူးတို့ · ဆိပ်ကြီး', W / 2 - 40, H / 2 + 2, 40, W * 0.7, { color: C.teal });
    fitText(g, 'Ferry', W - 70, H / 2 + 2, 30, 110, { weight: 600, font: FONT_SERIF, color: C.goldD });
  });
  const nameM = signPlane(name.tex, 1.32, 0.17);
  nameM.position.set(-1.5, 2.31, CZ + 0.047);
  float.add(nameM);

  // waterline foam and a bow wave
  const fv = new VoxelBuilder();
  hullSlab(fv, L, B, -0.005, 0.015, '#ffffff', 1.05, 1.12, [1.0, 1.0]);
  for (const s of [-1, 1]) boxR(fv, 4.0, 0.01, s * 0.5, 1.2, 0.02, 0.12, '#ffffff', 0, s * 0.5, 0);
  const foam = new THREE.Mesh(fv.geometry(), basic('#FFFFFF', { transparent: true, opacity: 0.55, depthWrite: false }));
  foam.raycast = () => {};
  root.add(foam);
  const shadow = shadowUnder(root, 5.0, 1.7, 0, 0, 0.3);

  // the crewman's place and the bucket (pivot at its front rim, so it tips outward over the rail)
  const crew = new THREE.Object3D();
  crew.position.set(1.62, 1.0, 0.72);
  float.add(crew);
  const bucket = new THREE.Group();
  float.add(bucket);
  const bv = new VoxelBuilder();
  prism(bv, 0, -0.11, -0.1, 0.11, 0.085, 0.22, C.tin, 8);
  prism(bv, 0, 0.0, -0.1, 0.12, 0.12, 0.02, C.tinD, 8);
  prism(bv, 0, -0.005, -0.1, 0.095, 0.095, 0.006, '#6E9AAE', 8); // water in it
  prism(bv, 0, -0.17, -0.1, 0.1, 0.1, 0.015, C.tinD, 8);
  bv.box(-0.115, 0.07, -0.1, 0.012, 0.14, 0.012, C.iron);
  bv.box(0.115, 0.07, -0.1, 0.012, 0.14, 0.012, C.iron);
  bv.box(0, 0.14, -0.1, 0.24, 0.012, 0.012, C.iron);
  bucket.add(bv.mesh({ px: 1.2 }));
  // bail drops (0-8) and stove-pipe smoke (9-12) share one unlit mesh: one draw call
  const drops = new Puffs(13, '#D6EAF0', 0.75, ['#D6EAF0', '#D6EAF0', '#D6EAF0', '#D6EAF0', '#D6EAF0', '#D6EAF0', '#D6EAF0', '#D6EAF0', '#D6EAF0', '#E8E4DA', '#E8E4DA', '#E8E4DA', '#E8E4DA']);
  float.add(drops.mesh);
  const BAIL = 2.8;
  function bail(t) {
    const p = (((t % BAIL) + BAIL) % BAIL) / BAIL;
    const up = smooth(p / 0.32) * (1 - smooth((p - 0.66) / 0.3));
    const tip = smooth((p - 0.34) / 0.14) * (1 - smooth((p - 0.6) / 0.14));
    bucket.position.set(1.72, 1.12 + up * 0.48, 0.92 + up * 0.5);
    bucket.rotation.x = tip * 1.9;
    for (let i = 0; i < 9; i++) {
      const s = (p - 0.4 - i * 0.022) / 0.26;
      if (s < 0 || s > 1) { drops.set(i, 0, -5, 0, 0); continue; }
      drops.set(i, 1.72 + ((i * 37) % 7 - 3) * 0.02, 1.62 - s * s * 1.65, 1.62 + s * 0.42 + (i % 3) * 0.03, 0.05 - s * 0.02);
    }
    drops.commit();
  }
  bail(0.2);
  return {
    root, crew, bucket, bail,
    update(dt, t) {
      float.position.y = Math.sin(t * 0.9) * 0.03;
      float.rotation.x = Math.sin(t * 0.7) * 0.012;
      float.rotation.z = Math.sin(t * 0.55 + 1) * 0.008;
      for (let i = 0; i < 4; i++) {
        const s = ((t * 0.35 + i / 4) % 1);
        drops.set(9 + i, X0 + 0.4 - s * 0.5, top + 1.1 + s * 1.0, -0.4 + Math.sin(i * 2 + t) * 0.05, 0.1 + s * 0.16);
      }
      if (bailing) bail(t); else drops.commit();
    },
    dispose() { name.tex.dispose(); shadow.geometry.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// jetty
// ---------------------------------------------------------------------------------------------
function cargoInto(v, kind, x, z) {
  if (kind === 'rice') {
    for (const [dx, dz, dy, s] of [[0, 0, 0, 0], [0.42, 0.05, 0, 1], [0.2, 0.02, 0.26, 2]]) {
      v.box(x + dx, 0.13 + dy, z + dz, 0.42, 0.26, 0.3, jitter('#E6DCC2', 0.05, s), 0.15 * s);
      v.box(x + dx, 0.13 + dy, z + dz + 0.152, 0.2, 0.1, 0.004, s === 1 ? C.maroon : C.indigo, 0.15 * s); // printed mark
      v.box(x + dx - 0.2, 0.22 + dy, z + dz, 0.05, 0.08, 0.32, '#D6CBB0', 0.15 * s); // tied ear
    }
  } else if (kind === 'fish') {
    for (const [dx, dz] of [[0, 0], [0.4, 0.06]]) {
      prism(v, x + dx, 0.1, z + dz, 0.17, 0.14, 0.2, C.reed, 8);
      prism(v, x + dx, 0.2, z + dz, 0.175, 0.175, 0.025, C.reedD, 8);
      for (let k = 0; k < 3; k++) boxR(v, x + dx - 0.07 + k * 0.07, 0.215, z + dz + (k - 1) * 0.03, 0.16, 0.03, 0.05, '#A9B9BF', 0, 0.6 * k, 0);
    }
  } else if (kind === 'wood') {
    for (let row = 0; row < 3; row++) for (let i = 0; i < 4 - row; i++) {
      prism(v, x + i * 0.13 + row * 0.065, 0.06 + row * 0.11, z, 0.055, 0.055, 0.7, jitter(C.wood, 0.1, i * 3 + row), 6, Math.PI / 2, 0, 0);
      prism(v, x + i * 0.13 + row * 0.065, 0.06 + row * 0.11, z + 0.352, 0.04, 0.04, 0.006, '#E2C29C', 6, Math.PI / 2, 0, 0);
    }
  } else if (kind === 'cane') {
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < 7; i++) v.box(x, 0.07 + k * 0.13 + (i % 2) * 0.03, z + (i - 3) * 0.028, 1.3, 0.028, 0.028, jitter(i % 3 ? C.cane : C.caneG, 0.06, i + k * 7));
      for (const bx of [-0.35, 0.35]) v.box(x + bx, 0.09 + k * 0.13, z, 0.04, 0.12, 0.22, C.ropeD);
    }
  } else if (kind === 'duck') {
    // a woven duck basket, two white ducks beside it
    prism(v, x, 0.12, z, 0.24, 0.22, 0.24, C.reed, 8);
    prism(v, x, 0.25, z, 0.245, 0.245, 0.02, C.reedD, 8);
    for (const [dx, dz, ry] of [[0.42, 0.05, 0.4], [0.62, -0.12, -0.6]]) {
      boxR(v, x + dx, 0.1, z + dz, 0.22, 0.13, 0.13, '#F7F3EA', 0, ry, 0);
      boxR(v, x + dx + Math.cos(ry) * 0.1, 0.2, z + dz - Math.sin(ry) * 0.1, 0.08, 0.1, 0.08, '#F7F3EA', 0, ry, 0);
      boxR(v, x + dx + Math.cos(ry) * 0.16, 0.2, z + dz - Math.sin(ry) * 0.16, 0.06, 0.03, 0.04, '#E89A3C', 0, ry, 0);
      boxR(v, x + dx - Math.cos(ry) * 0.12, 0.14, z + dz + Math.sin(ry) * 0.12, 0.05, 0.05, 0.08, '#EDE6D6', 0, ry, 0);
    }
  }
}

/**
 * A plank jetty on posts, 1.4 wide, running `len` metres out from the quay toward dir (-1 = west, -X).
 * y = 0 is its deck top at the shore end (quay level); the water is at waterY below (low: true for the
 * sandbar jetties, just above the water). A Burmese name board at the shore end faces +Z; the tip ends at
 * a mooring post (frayed: the rope ends in a frayed tail, Jetty End). cargo: 'rice'|'fish'|'wood'|'cane'|'duck'.
 */
export function jetty({ len = 6, low = false, name = 'ဆိပ်ကြီး', en = '', dir = -1, frayed = false, lamp = false, ladder = true, cargo = null, seed = 1 } = {}) {
  const root = new THREE.Group();
  root.name = 'jetty';
  const waterY = low ? -0.22 : -0.6;
  const v = new VoxelBuilder();
  const X = (x) => x * dir;
  const r = rand(seed * 31 + 7);
  // deck planks across, weathered, a few replaced (paler) or nudged
  const n = Math.round(len / 0.22);
  for (let i = 0; i < n; i++) {
    const x = X(0.11 + i * 0.22);
    const repl = r() < 0.08;
    v.box(x, -0.028, (r() - 0.5) * 0.03, 0.205, 0.056, 1.4 - (r() < 0.1 ? 0.12 : 0), repl ? '#CDB48A' : jitter([C.woodG, '#B89A72', '#A08262'][i % 3], 0.05, i + seed));
    if (i % 2 === 0) for (const z of [-0.5, 0.5]) v.box(x, 0.002, z, 0.02, 0.006, 0.02, C.iron);
    if (r() < 0.3) v.box(x + (r() - 0.5) * 0.08, 0.001, (r() - 0.5) * 0.8, 0.16, 0.004, 0.012, '#8C7254'); // grain
  }
  // stringers and edge kerbs
  for (const z of [-0.5, 0.5]) v.boxMin(Math.min(0, X(len)), -0.15, z - 0.05, Math.max(0, X(len)), -0.056, z + 0.05, C.woodGD);
  for (const z of [-0.66, 0.66]) {
    const end = len - (ladder && z > 0 ? 0.7 : 0.05);
    v.boxMin(Math.min(X(0.05), X(end)), 0, z - 0.04, Math.max(X(0.05), X(end)), 0.06, z + 0.04, C.woodD);
  }
  // posts in pairs, wet below the waterline, a band of green weed, braces between
  const bays = Math.max(1, Math.round(len / 1.5));
  for (let k = 0; k <= bays; k++) {
    const x = X(0.12 + (len - 0.24) * (k / bays));
    for (const z of [-0.66, 0.66]) {
      const top = 0.07, bot = waterY - 0.7, wet = waterY + 0.25;
      prism(v, x, (top + wet) / 2, z, 0.08, 0.085, top - wet, jitter(C.woodD, 0.06, k + z), 8);
      prism(v, x, (wet + bot) / 2, z, 0.088, 0.09, wet - bot, '#4E3A28', 8);
      prism(v, x, waterY + 0.04, z, 0.095, 0.095, 0.1, '#6E7F4C', 8);
      prism(v, x, top + 0.004, z, 0.07, 0.07, 0.008, '#9C7A55', 8);
    }
    if (!low && k < bays) {
      const x2 = X(0.12 + (len - 0.24) * ((k + 1) / bays));
      for (const z of [-0.7, 0.7]) beam(v, x, -0.12, z, x2, waterY + 0.12, z, 0.06, C.woodGD);
    }
  }
  // the tip: a thick mooring post with a rope (frayed or neatly looped)
  const tx = X(len - 0.22), tz = -0.42;
  prism(v, tx, 0.24, tz, 0.11, 0.12, 0.5, '#6E5038', 8);
  prism(v, tx, 0.5, tz, 0.1, 0.1, 0.03, '#9C7A55', 8);
  for (let k = 0; k < 3; k++) ring(v, tx, 0.28 + k * 0.045, tz, 0.125, 0.04, jitter(C.rope, 0.05, k), 8, 'y', 0.04);
  if (frayed) {
    beam(v, tx + X(0.1), 0.3, tz + 0.05, tx + X(0.55), 0.04, tz + 0.35, 0.035, C.rope);
    for (let k = 0; k < 5; k++) beam(v, tx + X(0.55), 0.04, tz + 0.35, tx + X(0.66 + (k % 2) * 0.05), 0.03 + (k % 3) * 0.008, tz + 0.27 + k * 0.04, 0.012, '#D9C79E');
  } else {
    beam(v, tx + X(0.1), 0.3, tz + 0.05, tx + X(0.25), waterY + 0.3, tz + 0.2, 0.035, C.rope);
  }
  // rope fenders hung on the tip face
  for (const z of [-0.2, 0.35]) {
    prism(v, X(len + 0.04), -0.24, z, 0.07, 0.07, 0.3, C.ropeD, 8);
    v.box(X(len + 0.02), -0.04, z, 0.02, 0.16, 0.02, C.rope);
  }
  // a ladder down to the water on the +Z side near the tip
  if (ladder) {
    const lx = X(len - 0.4);
    for (const s of [-0.18, 0.18]) v.box(lx + s, (waterY - 0.3 + 0.12) / 2, 0.74, 0.05, 0.12 - (waterY - 0.3), 0.05, C.woodD);
    for (let y = waterY - 0.2; y < 0.05; y += 0.24) v.box(lx, y, 0.74, 0.36, 0.04, 0.05, C.wood);
  }
  // name board at the shore end, facing +Z
  // a big two-post name board (2.2 x 0.9, leaning back a little toward the high camera): maroon with
  // large cream lettering, readable at phone size from the quay
  const bx = X(1.3), bz = 0.9, bh = low ? 1.4 : 1.55, BWn = 2.2, BHn = 0.9, LEAN = -0.3;
  const bcy = bh - BHn / 2 - 0.04;
  for (const s of [-1, 1]) {
    v.box(bx + s * (BWn / 2 + 0.05), bh / 2 - 0.05, bz, 0.1, bh + 0.1, 0.1, C.woodD);
    v.box(bx + s * (BWn / 2 + 0.05), bh + 0.07, bz, 0.14, 0.04, 0.14, C.goldD);
    beam(v, bx + s * (BWn / 2 + 0.05), 0.05, bz - 0.45, bx + s * (BWn / 2 + 0.05), bh * 0.6, bz - 0.03, 0.06, C.woodGD); // a back strut
  }
  boxR(v, bx, bcy, bz - 0.02, BWn + 0.1, BHn + 0.1, 0.05, C.woodD, LEAN, 0, 0);
  boxR(v, bx, bcy + Math.cos(LEAN) * (BHn / 2 + 0.07), bz + 0.01 - Math.sin(LEAN) * (BHn / 2 + 0.07) * -1, BWn + 0.2, 0.06, 0.12, C.maroonD, LEAN, 0, 0);
  // a coil of rope on the deck, cargo at the shore end
  for (let k = 0; k < 3; k++) ring(v, X(len - 1.0), 0.015 + k * 0.03, 0.35, 0.14 - k * 0.03, 0.035, C.rope, 10, 'y', 0.03);
  if (cargo) cargoInto(v, cargo, X(1.2), -0.25);
  // a lamp post on the -Z edge near the tip (Big Jetty)
  let glow = null;
  if (lamp) {
    const lx = X(len - 0.8);
    prism(v, lx, 0.9, -0.62, 0.035, 0.045, 1.8, C.woodD, 6);
    v.box(lx + X(0.15), 1.75, -0.62, 0.32, 0.04, 0.04, C.woodD);
    v.box(lx + X(0.28), 1.6, -0.62, 0.16, 0.22, 0.16, C.mustard);
    v.box(lx + X(0.28), 1.72, -0.62, 0.2, 0.04, 0.2, C.iron);
    v.box(lx + X(0.28), 1.48, -0.62, 0.12, 0.03, 0.12, C.iron);
    glow = halos([[lx + X(0.28), 1.6, -0.5, 1]], 0.75);
    glow.set(0);
  }
  root.add(v.mesh());
  if (glow) root.add(glow.mesh);
  const board = liveCanvas(640, 262, (g, W, H) => {
    g.fillStyle = C.maroon; g.fillRect(0, 0, W, H);
    const rr = rand(W);
    for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(30,10,10,${0.06 + rr() * 0.08})`; g.fillRect(0, rr() * H, W, 1 + rr() * 3); } // grain
    g.strokeStyle = C.gold; g.lineWidth = 7; g.strokeRect(9, 9, W - 18, H - 18);
    fitText(g, name, W / 2, en ? H * 0.44 : H * 0.52, en ? H * 0.56 : H * 0.62, W * 0.9, { color: '#F6EFDC' });
    if (en) fitText(g, en, W / 2, H * 0.84, H * 0.12, W * 0.7, { weight: 600, font: FONT_SERIF, color: '#E3C27A' });
  });
  const bm = signPlane(board.tex, BWn, BHn);
  bm.position.set(bx, bcy + Math.sin(-LEAN) * 0.03, bz - 0.02 + Math.cos(LEAN) * 0.03);
  bm.rotation.x = LEAN;
  root.add(bm);
  return {
    root, waterY,
    tip: new THREE.Vector3(X(len - 0.5), 0, 0), mooring: new THREE.Vector3(tx, 0, tz),
    setLamp(t) { glow?.set(t); },
    dispose() { disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// weigh-house (exterior shell; the room inside is interiors' weighhouse)
// ---------------------------------------------------------------------------------------------
const mixHex = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
/**
 * A lived-in tiled gable roof (ridge along X): a dark underlay, then overlapping rows of clay tiles laid in a
 * stagger, each row tipped a little so its lower edge stands proud (shingle shadow lines), two or three tones
 * per roof, odd replaced tiles, chipped and short tiles, moss patches on the north slope and near the eaves,
 * optional soot round a chimney, a drip edge and a ridge of capping tiles with gold collars.
 * opts: { seed, soot: [x, z, r] | null, moss: 0..1, tones: [base, light, dark] }
 */
function gableRoof(v, W, D, y0, rise, color, over = 0.35, front = 0, opts = {}) {
  const ang = Math.atan2(rise, D / 2);
  const r = rand(opts.seed ?? 11);
  const tones = opts.tones ?? [color, mixHex(color, '#F2E2C0', 0.22), mixHex(color, '#2B1E19', 0.22)];
  const mossC = ['#7D8A4C', '#93A05C', '#6A7A44'], sootC = ['#4A3A33', '#5A4840'];
  const RW = W + over * 2, x0 = -RW / 2;
  const moss = [];
  const nm = Math.round(3 + (opts.moss ?? 0.6) * 5);
  for (let i = 0; i < nm; i++) moss.push([x0 + 0.4 + r() * (RW - 0.8), i % 3 === 0 ? 1 : -1, 0.55 + r() * 0.45, 0.35 + r() * 0.5]); // x, side, along (0 ridge..1 eave), radius
  for (const sz of [-1, 1]) {
    const half = D / 2 + over + (sz > 0 ? front : 0);
    const slope = half / Math.cos(ang);
    const ca = Math.cos(ang), sa = Math.sin(ang);
    // a point d down the slope from the ridge, lifted h along the roof normal
    const at = (d, h) => [y0 + rise - d * sa + h * ca + 0.04, sz * (d * ca + h * sa)];
    {
      const [cy, cz] = at(slope / 2, 0);
      boxR(v, 0, cy, cz, RW, 0.08, slope, '#4A2A22', sz * ang, 0, 0); // underlay (dark between tiles)
    }
    const TL = 0.27, rows = Math.ceil(slope / TL);
    for (let row = 0; row < rows; row++) {
      const d0 = row * TL, dl = Math.min(TL * 1.18, slope - d0 + 0.04);
      const stagger = row % 2 ? 0.17 : 0;
      for (let x = x0 - stagger; x < RW / 2; ) {
        let tw = 0.3 + r() * 0.06;
        const a = Math.max(x0, x), b = Math.min(RW / 2, x + tw);
        x += tw;
        if (b - a < 0.06) continue;
        const along = (d0 + dl / 2) / slope;
        // tone: mostly base, some light, some dark; moss near its patches, soot near the chimney
        let col = r() < 0.62 ? tones[0] : r() < 0.6 ? tones[1] : tones[2];
        for (const [mx, ms, md, mr] of moss) {
          if (ms !== sz && !(sz > 0 && along > 0.85)) continue;
          const dd = Math.hypot((a + b) / 2 - mx, (along - md) * slope);
          if (dd < mr * (0.6 + r() * 0.5)) col = mossC[Math.floor(r() * 3)];
        }
        if (opts.soot) {
          const [sx, szz, sr] = opts.soot;
          const zz = sz * (d0 + dl / 2) * ca;
          if (Math.hypot((a + b) / 2 - sx, zz - szz) < sr * (0.7 + r() * 0.5)) col = sootC[Math.floor(r() * 2)];
        }
        const chip = r() < 0.07;            // a chipped corner: shorter, a little skewed
        const len = chip ? dl * (0.6 + r() * 0.2) : dl;
        const tip = 0.07 + r() * 0.03;     // lower edge proud of the row below
        const [cy, cz] = at(d0 + len / 2, 0.05 + row * 0.0015);
        boxR(v, (a + b) / 2, cy, cz, b - a - 0.022, 0.04, len, jitter(col, 0.05, row * 97 + Math.round(x * 31)), sz * (ang - tip), (chip ? (r() - 0.5) * 0.12 : 0), 0);
      }
    }
    // drip edge / eaves board and a gutter lip
    const [ey, ez] = at(slope, 0);
    v.box(0, ey - 0.03, ez + sz * 0.01, RW + 0.04, 0.12, 0.07, C.woodD);
    v.box(0, ey - 0.1, ez + sz * 0.03, RW + 0.04, 0.025, 0.05, '#3A2A20');
    // barge boards on the gable ends
    const [by, bz] = at(slope / 2, 0.02);
    for (const s of [-1, 1]) boxR(v, s * (RW / 2 + 0.02), by, bz, 0.06, 0.16, slope + 0.05, C.woodD, sz * ang, 0, 0);
  }
  // ridge: capping tiles with small gaps, gold collars every few
  const capN = Math.round((RW + 0.06) / 0.34);
  for (let k = 0; k < capN; k++) {
    const x = -RW / 2 - 0.03 + (k + 0.5) * ((RW + 0.06) / capN);
    v.box(x, y0 + rise + 0.15, 0, (RW + 0.06) / capN - 0.03, 0.12, 0.28, jitter(k % 4 === 1 ? tones[2] : C.goldD, 0.05, k + 300));
    if (k % 3 === 0) v.box(x - (RW + 0.06) / capN / 2 + 0.015, y0 + rise + 0.16, 0, 0.03, 0.15, 0.31, C.gold);
  }
}
/**
 * The gable under a roof: a true triangular prism (no stepped boxes, whose corners used to poke through the
 * tiles as pale lines), kept just under the slope, with battens on the two triangular end faces.
 */
function gableEnds(v, W, D, y0, rise, color) {
  const h = rise - 0.03, x0 = -W / 2 + 0.02, x1 = W / 2 - 0.02, z = D / 2;
  const A = [x0, 0, -z], B = [x0, 0, z], Cc = [x0, h, 0], A2 = [x1, 0, -z], B2 = [x1, 0, z], C2 = [x1, h, 0];
  const tris = [A, Cc, B, A2, B2, C2, A, B, B2, A, B2, A2, B, Cc, C2, B, C2, B2, A, A2, C2, A, C2, Cc];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tris.flat()), 3));
  g.computeVertexNormals();
  v.add(g, color, new THREE.Matrix4().makeTranslation(0, y0, 0));
  g.dispose();
  // battens on the end faces (shorter toward the eaves), a dark vent under the ridge
  const dark = mixHex(color, '#2B1E19', 0.25);
  for (const s of [-1, 1]) {
    for (let k = -3; k <= 3; k++) {
      const zz = (k / 4) * z, hh = h * (1 - Math.abs(zz) / z);
      if (hh > 0.08) v.box(s * (W / 2 - 0.005), y0 + hh / 2, zz, 0.02, hh - 0.04, 0.03, dark);
    }
    v.box(s * (W / 2 - 0.004), y0 + h * 0.6, 0, 0.02, 0.16, 0.22, '#2B1E19');
  }
}
/** Vertical planks with a dark backing; axis 'x' = a wall along X at z, 'z' = a wall along Z at x (= z arg). */
function plankWall(v, a0, a1, y0, y1, at, t, col, seed, axis = 'x') {
  const len = Math.abs(a1 - a0), n = Math.max(1, Math.round(len / 0.24));
  for (let i = 0; i < n; i++) {
    const a = Math.min(a0, a1) + (len * (i + 0.5)) / n, w = len / n - 0.014;
    const c = jitter(col, 0.06, seed + i);
    if (axis === 'x') v.box(a, (y0 + y1) / 2, at, w, y1 - y0, t, c);
    else v.box(at, (y0 + y1) / 2, a, t, y1 - y0, w, c);
  }
  if (axis === 'x') v.box((a0 + a1) / 2, (y0 + y1) / 2, at - Math.sign(at || 1) * t * 0.3, len, y1 - y0, t * 0.5, '#5E4128');
  else v.box(at - Math.sign(at || 1) * t * 0.3, (y0 + y1) / 2, (a0 + a1) / 2, t * 0.5, y1 - y0, len, '#5E4128');
}

/**
 * The weigh-house on the quay, 5 x 3.5: a plank shed on a stone plinth with a loading platform, a wide
 * two-leaf loading door (setDoor 1 = both leaves folded back against the wall), the beam scale's dark
 * silhouette inside, a painted scale sign over the door, a lantern, sacks, a carrying pole, a rain barrel.
 * `door` is a local point in front of the platform (the room trigger). setLamp(0..1) lights the lantern.
 */
export function weighHouse({ door = 1 } = {}) {
  const root = new THREE.Group();
  root.name = 'weighHouse';
  const W = 5, D = 3.5, F = 0.25, H = 2.9, OW = 2.6, OH = 2.35;
  const v = new VoxelBuilder();
  // plinth and the loading platform
  v.boxMin(-W / 2 - 0.12, 0, -D / 2 - 0.12, W / 2 + 0.12, F, D / 2 + 0.05, C.stoneD);
  for (let k = 0; k < 7; k++) v.box(-W / 2 + 0.36 + k * 0.72, F / 2, D / 2 + 0.056, 0.02, F, 0.01, C.stoneDD);
  for (let i = 0; i < 22; i++) v.box(-W / 2 - 0.05 + (i + 0.5) * ((W + 0.1) / 22), F - 0.03, D / 2 + 0.5, (W + 0.1) / 22 - 0.012, 0.06, 0.9, jitter(C.woodG, 0.06, i));
  v.boxMin(-W / 2 - 0.05, 0, D / 2 + 0.92, W / 2 + 0.05, F - 0.06, D / 2 + 0.98, C.woodD);
  for (const x of [-W / 2, -0.9, 0.9, W / 2]) v.box(x, (F - 0.06) / 2, D / 2 + 0.92, 0.12, F - 0.06, 0.12, C.woodD);
  boxR(v, 0, F / 2 - 0.01, D / 2 + 1.33, OW - 0.3, 0.06, 0.88, C.woodG, 0.28, 0, 0); // ramp
  for (let k = 0; k < 5; k++) boxR(v, 0, F / 2 + 0.03 - k * 0.045, D / 2 + 1.0 + k * 0.17, OW - 0.3, 0.02, 0.03, C.woodGD, 0.28, 0, 0);
  // floor inside, the dark room, and the scale's silhouette
  // floor boards: dark at the back, a pale wedge of daylight spilling in through the door
  for (let i = 0; i < 9; i++) {
    const z0 = -D / 2 + 0.1 + i * ((D - 0.15) / 9), z1 = z0 + (D - 0.15) / 9 - 0.01;
    v.boxMin(-W / 2 + 0.1, F, z0, W / 2 - 0.1, F + 0.02, z1, ['#2E241C', '#352A20', '#3D3024', '#46372A', '#4E3E2E', '#57452F', '#5E4B34', '#66523A', '#6E583E'][i]);
  }
  for (let k = 0; k < 4; k++) { // the light patch: three steps narrowing into the room
    const w = OW * (0.98 - k * 0.18), z1 = D / 2 - 0.06 - k * 0.42;
    v.boxMin(-w / 2, F + 0.021 + k * 0.001, z1 - 0.42, w / 2, F + 0.022 + k * 0.001, z1, ['#B39468', '#A3855C', '#8E7250', '#7A6146'][k]);
  }
  v.boxMin(-W / 2 + 0.1, F, -D / 2 + 0.1, W / 2 - 0.1, H, -D / 2 + 0.16, '#2A211B');
  for (const s of [-1, 1]) v.boxMin(s * (W / 2 - 0.16), F, -D / 2 + 0.1, s * (W / 2 - 0.1), H, D / 2 - 0.1, '#241C16');
  v.boxMin(-W / 2 + 0.1, H - 0.1, -D / 2 + 0.1, W / 2 - 0.1, H, D / 2 - 0.1, '#1E1712');
  for (const s of [-1, 1]) v.boxMin(s * (OW / 2 - 0.02) - 0.14, F, D / 2 - 0.5, s * (OW / 2 - 0.02) + 0.14, H, D / 2 - 0.16, '#1C1611'); // jamb shade
  v.boxMin(-OW / 2 - 0.1, F + OH - 0.32, D / 2 - 0.5, OW / 2 + 0.1, F + OH, D / 2 - 0.12, '#17120E'); // lintel shadow
  // the beam scale: a tall post, the beam with brass ends, chains and pans, a sack on one pan, weights by its foot
  v.box(0.35, F + 1.1, -0.9, 0.16, 2.2, 0.16, '#2C221A');
  v.box(0.35, F + 0.06, -0.9, 0.6, 0.12, 0.5, '#241C15');
  boxR(v, 0.35, F + 2.05, -0.9, 1.7, 0.1, 0.1, '#3A2C20', 0, 0, 0.06);
  for (const s of [-1, 1]) {
    const yy = F + 2.05 + s * 0.05;
    v.box(0.35 + s * 0.85, yy, -0.9, 0.08, 0.12, 0.12, C.brass);
    for (const dz of [-0.12, 0.12]) beam(v, 0.35 + s * 0.85, yy - 0.05, -0.9, 0.35 + s * 0.8, F + 1.1 + s * 0.06, -0.9 + dz, 0.014, '#6B5A48');
    prism(v, 0.35 + s * 0.8, F + 1.06 + s * 0.06, -0.9, 0.26, 0.2, 0.06, s < 0 ? '#8C6A38' : '#7A5C30', 10);
  }
  v.box(-0.45, F + 1.32 - 0.06, -0.9, 0.36, 0.34, 0.3, '#B8AC90'); // a sack on the left pan (that side down)
  v.box(-0.45, F + 1.32 - 0.06, -0.745, 0.14, 0.08, 0.004, C.maroon);
  v.box(0.35, F + 2.22, -0.9, 0.12, 0.12, 0.12, C.goldD);
  for (const [x, s] of [[0.0, 0.14], [0.2, 0.11], [0.36, 0.08]]) prism(v, x + 0.55, F + s / 2, -0.55, s * 0.7, s * 0.8, s, '#3A3A3A', 8); // iron weights
  // a hanging lamp from the ridge beam, lit warm (a small bright pane, no glow)
  v.box(-0.5, H - 0.35, -0.2, 0.015, 0.5, 0.015, '#3A2C20');
  v.box(-0.5, H - 0.62, -0.2, 0.2, 0.04, 0.2, C.iron);
  v.box(-0.5, H - 0.76, -0.2, 0.15, 0.22, 0.15, '#FFD27A');
  v.box(-0.5, H - 0.89, -0.2, 0.18, 0.03, 0.18, C.iron);
  // the clerk's high desk with an open ledger, shelves of ledgers behind
  v.box(-1.6, F + 0.5, -1.2, 0.9, 1.0, 0.5, '#3A2C22');
  boxR(v, -1.6, F + 1.05, -1.15, 0.95, 0.04, 0.56, '#4A3828', 0.25, 0, 0);
  boxR(v, -1.6, F + 1.08, -1.12, 0.6, 0.012, 0.36, C.ledger, 0.25, 0, 0);
  boxR(v, -1.6, F + 1.085, -1.12, 0.01, 0.014, 0.36, C.rRule, 0.25, 0, 0);
  for (let k = 0; k < 3; k++) v.box(-1.6, F + 1.4 + k * 0.38, -D / 2 + 0.3, 1.3, 0.04, 0.28, '#3A2C22');
  for (let k = 0; k < 14; k++) v.box(-2.15 + (k % 7) * 0.17, F + 1.55 + Math.floor(k / 7) * 0.38, -D / 2 + 0.3, 0.12, 0.26, 0.22, jitter(['#6E1F2A', '#3E5F7A', '#8C6A48', '#4A5A3A'][k % 4], 0.08, k));
  for (const [x, z, s] of [[1.6, -1.0, 0], [2.0, -1.2, 1], [1.8, -0.95, 2]]) v.box(x, F + 0.2 + (s === 2 ? 0.34 : 0), z, 0.42, 0.34, 0.3, jitter('#9E9278', 0.05, s));
  // walls: planks, corner posts, a top beam, a cream band ruled like the ledger
  plankWall(v, -W / 2, W / 2, F, H, -D / 2 + 0.05, 0.1, C.wood, 3);
  for (const s of [-1, 1]) plankWall(v, -D / 2, D / 2, F, H, s * (W / 2 - 0.05), 0.1, C.wood, 11 + s, 'z');
  const fz = D / 2 - 0.05;
  plankWall(v, -W / 2, -OW / 2 - 0.1, F, H, fz, 0.1, C.wood, 21);
  plankWall(v, OW / 2 + 0.1, W / 2, F, H, fz, 0.1, C.wood, 31);
  plankWall(v, -OW / 2 - 0.1, OW / 2 + 0.1, F + OH, H, fz, 0.1, C.wood, 41);
  v.box(0, H - 0.17, fz + 0.06, W + 0.04, 0.26, 0.03, C.ledger);
  v.box(0, H - 0.08, fz + 0.077, W + 0.04, 0.014, 0.01, C.bRule);
  v.box(0, H - 0.26, fz + 0.077, W + 0.04, 0.014, 0.01, C.rRule);
  for (const s of [-1, 1]) for (const sz of [-1, 1]) v.box(s * W / 2, (F + H) / 2, sz * D / 2, 0.16, H - F, 0.16, C.woodD);
  v.box(0, H - 0.05, fz, W + 0.16, 0.1, 0.18, C.woodD); // wall plate, under the eaves
  // the door frame and its iron track
  for (const s of [-1, 1]) v.box(s * (OW / 2 + 0.05), F + OH / 2, fz + 0.04, 0.12, OH, 0.16, C.woodD);
  v.box(0, F + OH + 0.06, fz + 0.04, OW + 0.22, 0.12, 0.16, C.woodD);
  v.box(0, F + 0.01, fz + 0.04, OW, 0.02, 0.14, C.iron);
  // small shuttered window on the left, hooks with ropes and a carrying pole on the right
  v.box(-1.85, F + 1.55, fz + 0.06, 0.66, 0.56, 0.04, C.woodD);
  v.box(-1.85, F + 1.55, fz + 0.075, 0.5, 0.42, 0.02, C.interiorD);
  for (const s of [-1, 1]) v.box(-1.85 + s * 0.42, F + 1.55, fz + 0.1, 0.2, 0.5, 0.03, s < 0 ? C.teal : C.tealL);
  v.box(-1.85, F + 1.24, fz + 0.12, 0.74, 0.05, 0.12, C.woodD);
  for (const x of [1.75, 2.15]) {
    v.box(x, F + 1.75, fz + 0.1, 0.04, 0.04, 0.12, C.iron);
    for (let k = 0; k < 3; k++) ring(v, x, F + 1.55 - k * 0.04, fz + 0.14, 0.13 - k * 0.02, 0.03, jitter(C.rope, 0.05, k + x), 10, 'z', 0.04);
  }
  boxR(v, 1.5, F + 1.0, fz + 0.2, 0.06, 2.1, 0.06, C.bamboo, 0, 0, 0.1);
  for (const y of [0.25, 1.85]) v.box(1.5 - Math.tan(0.1) * (y - 1.0), F + y, fz + 0.2, 0.08, 0.05, 0.08, C.ropeD);
  // sacks on the platform, right of the door; a rain barrel at the corner
  for (const [x, z, dy, s] of [[1.85, D / 2 + 0.5, 0, 0], [2.25, D / 2 + 0.45, 0, 1], [2.05, D / 2 + 0.5, 0.3, 2]]) {
    v.box(x, F + 0.15 + dy, z, 0.4, 0.3, 0.3, jitter('#E6DCC2', 0.05, s), 0.1 * s);
    v.box(x, F + 0.15 + dy, z + 0.152, 0.18, 0.1, 0.004, s === 1 ? C.maroon : C.indigo, 0.1 * s);
  }
  prism(v, W / 2 + 0.38, 0.38, D / 2 - 0.2, 0.26, 0.24, 0.76, C.wood, 8);
  for (const y of [0.12, 0.62]) prism(v, W / 2 + 0.38, y, D / 2 - 0.2, 0.265, 0.265, 0.04, C.iron, 8);
  prism(v, W / 2 + 0.38, 0.755, D / 2 - 0.2, 0.22, 0.22, 0.01, '#7FA9B8', 8);
  // roof (deep front overhang over the platform), gable ends
  gableEnds(v, W, D, H, 1.15, jitter(C.wood, 0.04, 5));
  gableRoof(v, W, D, H, 1.15, '#A9563C', 0.32, 0.6, { seed: 5, moss: 0.9, tones: ['#A9563C', '#C06C48', '#8A4430'] });
  {
    const ang = Math.atan2(1.15, D / 2);
    for (const [x, t, w, col] of [[-1.4, 0.45, 0.8, '#8E8478'], [0.9, 0.7, 0.6, '#B86A44'], [1.9, 0.3, 0.5, '#9A8F80']]) {
      const zz = (D / 2 + 0.92) * t;
      boxR(v, x, H + 1.15 - zz * Math.tan(ang) + 0.14, zz, w, 0.02, 0.7, col, ang, 0, 0);
      for (const dx of [-w / 2 + 0.05, w / 2 - 0.05]) boxR(v, x + dx, H + 1.15 - zz * Math.tan(ang) + 0.155, zz, 0.03, 0.02, 0.03, C.iron, ang, 0, 0);
    }
    v.box(-1.0, H + 1.33, 0, 0.5, 0.18, 0.4, C.iron);
    v.box(-1.0, H + 1.45, 0, 0.62, 0.05, 0.5, '#5E5248');
  }
  // sign board over the door, a lantern on a bracket
  v.box(0, F + OH + 0.54, fz + 0.1, 2.3, 0.56, 0.06, C.woodD); // the sign stands on the eaves on two iron stays
  for (const sx of [-0.85, 0.85]) { v.box(sx, F + OH + 0.2, fz + 0.06, 0.04, 0.3, 0.04, C.iron); beam(v, sx, F + OH + 0.36, fz + 0.07, sx, F + OH + 0.12, fz - 0.25, 0.03, C.iron); }
  v.box(1.6, F + OH + 0.25, fz + 0.35, 0.05, 0.05, 0.6, C.iron);
  v.box(1.6, F + OH + 0.08, fz + 0.62, 0.2, 0.28, 0.2, C.mustard);
  v.box(1.6, F + OH + 0.24, fz + 0.62, 0.24, 0.04, 0.24, C.iron);
  v.box(1.6, F + OH - 0.07, fz + 0.62, 0.16, 0.04, 0.16, C.iron);
  root.add(v.mesh());
  const glow = halos([[1.6, F + OH + 0.08, fz + 0.75, 1]], 0.85);
  glow.set(0);
  root.add(glow.mesh);
  const sign = liveCanvas(640, 156, (g, W2, H2) => {
    g.fillStyle = C.ledger; g.fillRect(0, 0, W2, H2);
    g.fillStyle = C.bRule; for (let y = 30; y < H2; y += 30) g.fillRect(0, y, W2, 2);
    g.fillStyle = C.rRule; g.fillRect(124, 0, 3, H2);
    g.strokeStyle = C.maroon; g.lineWidth = 8; g.strokeRect(4, 4, W2 - 8, H2 - 8);
    // a painted beam scale
    g.save(); g.translate(64, 80); g.strokeStyle = C.maroon; g.fillStyle = C.goldD; g.lineWidth = 6;
    g.beginPath(); g.moveTo(0, -46); g.lineTo(0, 44); g.moveTo(-40, -30); g.lineTo(40, -30); g.moveTo(-22, 44); g.lineTo(22, 44); g.stroke();
    for (const s of [-1, 1]) { g.lineWidth = 3; g.beginPath(); g.moveTo(s * 40, -30); g.lineTo(s * 40 - 14, 6); g.moveTo(s * 40, -30); g.lineTo(s * 40 + 14, 6); g.stroke(); g.beginPath(); g.arc(s * 40, 8, 17, 0, Math.PI); g.fill(); }
    g.restore();
    fitText(g, 'ကုန်ချိန်ရုံ', 384, 66, 58, 470, { color: C.maroon });
    fitText(g, 'Weigh-house', 384, 122, 28, 400, { weight: 600, font: FONT_SERIF, color: C.woodD });
  });
  const sm = signPlane(sign.tex, 2.2, 0.5);
  sm.position.set(0, F + OH + 0.54, fz + 0.135);
  root.add(sm);
  // the two door leaves (planks, Z brace, iron straps), hinged at the frame
  const leaves = [];
  for (const s of [-1, 1]) {
    const hinge = new THREE.Group();
    hinge.position.set(s * OW / 2, F, fz + 0.14);
    root.add(hinge);
    const lv = new VoxelBuilder();
    const LW = OW / 2 - 0.01, dx = -s;
    for (let i = 0; i < 5; i++) lv.box(dx * (LW * (i + 0.5)) / 5, OH / 2, 0, LW / 5 - 0.01, OH - 0.04, 0.06, jitter(C.woodG, 0.06, i + s * 5));
    for (const y of [0.3, OH - 0.3]) lv.box(dx * LW / 2, y, 0.04, LW, 0.12, 0.03, C.woodGD);
    beam(lv, dx * 0.1, 0.36, 0.045, dx * (LW - 0.1), OH - 0.36, 0.045, 0.1, C.woodGD, 0.03);
    for (const y of [0.3, OH - 0.3]) lv.box(dx * 0.25, y, 0.065, 0.45, 0.05, 0.012, C.iron);
    lv.box(dx * (LW - 0.12), OH / 2, 0.06, 0.04, 0.22, 0.03, C.iron);
    hinge.add(lv.mesh());
    leaves.push([hinge, s]);
  }
  function setDoor(t) {
    const e = smooth(t);
    for (const [hinge, s] of leaves) hinge.rotation.y = s * e * (Math.PI - 0.12);
  }
  setDoor(door);
  const shadow = shadowUnder(root, W / 2 + 0.6, D / 2 + 0.9, 0, 0.3, 0.4);
  return {
    root, door: new THREE.Vector3(0, 0, D / 2 + 1.9), setDoor,
    setLamp(t) { glow.set(t); },
    dispose() { shadow.geometry.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// mist bank (the east bank as a tall folded page in fog)
// ---------------------------------------------------------------------------------------------
let mistTex = null;
function mistTexture() {
  if (mistTex) return mistTex;
  const W = 512, H = 128;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const r = rand(5);
  for (let i = 0; i < 60; i++) {
    const x = r() * W, y = H * (0.35 + r() * 0.35), rr = 18 + r() * 40;
    for (const ox of [-W, 0, W]) {
      const grd = g.createRadialGradient(x + ox, y, 0, x + ox, y, rr);
      grd.addColorStop(0, 'rgba(255,255,255,0.5)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd;
      g.fillRect(x + ox - rr, y - rr, rr * 2, rr * 2);
    }
  }
  mistTex = new THREE.CanvasTexture(cv);
  mistTex.colorSpace = THREE.SRGBColorSpace;
  mistTex.wrapS = THREE.RepeatWrapping;
  return mistTex;
}
/**
 * The east bank, out of reach: a tall pale page standing in fog, folded once (a crease line down the
 * middle), faint rules, its foot lost in drifting mist (three layers that slide slowly). w x h, faces +Z.
 */
export function mistBank({ w = 40, h = 8 } = {}) {
  const root = new THREE.Group();
  root.name = 'mistBank';
  const page = liveCanvas(512, 256, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, 'rgba(250,246,236,0)');
    grd.addColorStop(0.14, 'rgba(246,241,228,0.8)');
    grd.addColorStop(0.7, 'rgba(240,234,220,0.95)');
    grd.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = grd;
    g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(150,165,190,0.16)';
    for (let y = 50; y < H * 0.8; y += 16) g.fillRect(16, y, W - 32, 2);
    g.fillStyle = 'rgba(200,120,110,0.16)';
    g.fillRect(64, 34, 2, H * 0.66);
  });
  const mat = new THREE.MeshBasicMaterial({ map: page.tex, transparent: true, depthWrite: false, toneMapped: false });
  const A = 0.18, back = Math.sin(A) * w / 4;
  for (const s of [-1, 1]) {
    const geo = new THREE.PlaneGeometry(w / 2, h);
    if (s > 0) { const uv = geo.attributes.uv.array; for (let i = 0; i < uv.length; i += 2) uv[i] = 1 - uv[i]; }
    const m = new THREE.Mesh(geo, mat);
    m.position.set(s * (w / 4) * Math.cos(A), h / 2, -back);
    m.rotation.y = s * A;
    m.raycast = () => {};
    root.add(m);
  }
  // the crease: a thin shadow line and a bright line beside it
  const cv = new VoxelBuilder();
  cv.box(-0.05, h * 0.52, -back * 2 + 0.06, 0.08, h * 0.8, 0.02, '#BDB5A4');
  cv.box(0.06, h * 0.52, -back * 2 + 0.06, 0.06, h * 0.8, 0.02, '#FFFFFF');
  const crease = new THREE.Mesh(cv.geometry(), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6, toneMapped: false, depthWrite: false }));
  crease.userData.ownMat = true;
  root.add(crease);
  const layers = [];
  [[0.5, 0.95, 1.0], [2.5, 0.75, 1.4], [4.5, 0.5, 1.9]].forEach(([z, op, sc], i) => {
    const t = mistTexture().clone();
    t.repeat.set(2 + i, 1);
    t.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.2, h * 0.55 * sc), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: op, depthWrite: false, toneMapped: false }));
    m.position.set(0, h * 0.18 + i * 0.8, z);
    m.userData.ownMat = true;
    m.raycast = () => {};
    m.renderOrder = 4;
    root.add(m);
    layers.push(m);
  });
  return {
    root,
    update(dt, t) {
      for (let i = 0; i < layers.length; i++) {
        const m = layers[i];
        m.material.map.offset.x = (t * (0.006 + i * 0.004) * (i % 2 ? -1 : 1)) % 1;
        m.position.y = h * 0.18 + i * 0.8 + Math.sin(t * 0.3 + i) * 0.15;
      }
    },
    dispose() { mat.dispose(); page.tex.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// parcels with picture-and-word tags
// ---------------------------------------------------------------------------------------------
export const TAGS = {
  duck: { my: 'ဘဲဆိပ်', en: 'Duck Jetty' },
  cane: { my: 'ကြိမ်ဆိပ်', en: 'Cane Jetty' },
  fish: { my: 'ငါးဆိပ်', en: 'Fish Jetty' },
};
const TAG_KINDS = ['duck', 'cane', 'fish'];
function drawTagIcon(g, kind, cx, cy, s) {
  g.save();
  g.translate(cx, cy);
  g.scale(s, s);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.strokeStyle = C.ink;
  g.lineWidth = 3;
  if (kind === 'duck') {
    g.fillStyle = '#FFFFFF';
    g.beginPath(); g.ellipse(-4, 8, 26, 15, 0, 0, TAU); g.fill(); g.stroke();
    g.beginPath(); g.arc(16, -14, 11, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#E89A3C';
    g.beginPath(); g.moveTo(26, -16); g.lineTo(38, -12); g.lineTo(26, -9); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = C.ink; g.beginPath(); g.arc(18, -16, 2.2, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(-18, 6); g.quadraticCurveTo(-4, 0, 6, 8); g.stroke();
    g.strokeStyle = '#7FA9B8'; g.beginPath(); g.moveTo(-36, 26); g.lineTo(30, 26); g.stroke();
  } else if (kind === 'cane') {
    for (let i = -3; i <= 3; i++) {
      g.strokeStyle = i % 2 ? '#9C8A4C' : '#AFB662';
      g.lineWidth = 6;
      g.beginPath(); g.moveTo(-30 + i * 2, 28 - Math.abs(i)); g.lineTo(26 + i * 3, -30 + Math.abs(i)); g.stroke();
    }
    g.strokeStyle = C.maroon; g.lineWidth = 5;
    for (const k of [-12, 10]) { g.beginPath(); g.moveTo(-10 + k, -2 + k * 0.1 - 10); g.lineTo(6 + k, 10 + k * 0.1 - 10); g.stroke(); }
  } else {
    g.fillStyle = '#A9C3CC';
    g.beginPath(); g.moveTo(-26, 0); g.quadraticCurveTo(0, -20, 22, 0); g.quadraticCurveTo(0, 20, -26, 0); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-24, 0); g.lineTo(-38, -12); g.lineTo(-38, 12); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = C.ink; g.beginPath(); g.arc(12, -3, 2.4, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(2, -10); g.quadraticCurveTo(-4, 0, 2, 10); g.stroke();
  }
  g.restore();
}
/** Atlas of the three tags (duck, cane, fish), each 256 x 144: hole and string, picture, word. */
function tagAtlas() {
  return liveCanvas(768, 144, (g) => {
    g.clearRect(0, 0, 768, 144);
    TAG_KINDS.forEach((k, i) => {
      const x = i * 256;
      g.fillStyle = '#F7EFD8';
      roundRect(g, x + 6, 6, 244, 132, 14); g.fill();
      g.strokeStyle = C.goldD; g.lineWidth = 4; g.stroke();
      g.fillStyle = '#C9B48A'; g.beginPath(); g.arc(x + 26, 72, 8, 0, TAU); g.fill();
      g.strokeStyle = '#8C7254'; g.lineWidth = 2; g.stroke();
      drawTagIcon(g, k, x + 84, 66, 1.05);
      fitText(g, TAGS[k].my, x + 186, 70, 40, 120, { color: C.maroon });
    });
  });
}

/**
 * Brown-paper parcels the ferry turned away, ~1.2 x 0.8: tied with string, each with a picture-and-word
 * tag facing +Z (duck = Duck Jetty, cane = Cane Jetty, fish = Fish Jetty).
 */
export function parcelPile({ tags = ['duck', 'cane', 'duck', 'fish', 'cane', 'duck'] } = {}) {
  const root = new THREE.Group();
  root.name = 'parcelPile';
  const v = new VoxelBuilder();
  const P = [[-0.36, 0, 0.12, 0.42, 0.3, 0.34], [0.1, 0, 0.16, 0.38, 0.26, 0.32], [0.46, 0, 0.05, 0.3, 0.22, 0.3], [-0.2, 0.3, 0.08, 0.34, 0.22, 0.28],
    [0.18, 0.26, 0.1, 0.3, 0.2, 0.26], [-0.1, 0, -0.26, 0.5, 0.34, 0.34], [0.36, 0, -0.24, 0.3, 0.26, 0.28]];
  parcelsInto(v, P, 21);
  // a wooden pallet underneath
  for (let k = 0; k < 5; k++) v.box(-0.5 + k * 0.25, -0.02, 0, 0.2, 0.03, 0.85, C.woodG);
  root.add(v.mesh());
  root.children[0].position.y = 0.035;
  const atlas = tagAtlas();
  const q = new Quads(768, 144);
  const faces = [0, 1, 2, 3, 4];
  faces.forEach((pi, i) => {
    const [x, y, z, w, h, d] = P[pi];
    const k = TAG_KINDS.indexOf(tags[i % tags.length]);
    q.add(x + (i % 2 ? 0.06 : -0.05), 0.035 + y + h * 0.45, z + d / 2 + 0.008, 0.2, 0.113, [Math.max(0, k) * 256, 0, 256, 144], -0.08, (i % 2 ? 0.1 : -0.1), (i % 2 ? -0.12 : 0.1));
  });
  root.add(q.mesh(atlas.tex));
  const shadow = shadowUnder(root, 0.8, 0.55, 0, 0, 0.4);
  return { root, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// cane rack
// ---------------------------------------------------------------------------------------------
/**
 * U Bo Lay's cane drying rack, 2.4 x 1: three tiers of cane laid across (fresh green below, dry tan above),
 * one length on the top tier turned by hand (setTurned 0..1 rolls it over: green side to tan side).
 * roof: true adds a reed roof on four bamboo poles (outdoor; 1.8 m), false for inside the cane shed.
 */
export function caneRack({ roof = true, turned = 0.4 } = {}) {
  const root = new THREE.Group();
  root.name = 'caneRack';
  const v = new VoxelBuilder();
  const W = 2.4, D = 1.0, tiers = [0.45, 0.85, 1.25];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) prism(v, sx * (W / 2 - 0.06), (roof ? 1.86 : 1.4) / 2, sz * (D / 2 - 0.06), 0.04, 0.045, roof ? 1.86 : 1.4, jitter(C.bambooD, 0.05, sx + sz * 3), 6);
  tiers.forEach((y, ti) => {
    for (const bx of [-W / 2 + 0.06, 0, W / 2 - 0.06]) {
      prism(v, bx, y, 0, 0.03, 0.03, D, C.bamboo, 6, Math.PI / 2, 0, 0);
      for (const sz of [-1, 1]) if (bx) v.box(bx, y, sz * (D / 2 - 0.06), 0.1, 0.06, 0.1, C.ropeD);
    }
    if (ti === 1) prism(v, 0, y / 2, -D / 2 + 0.06, 0.035, 0.035, y, C.bambooD, 6); // middle prop
    const r = rand(40 + ti);
    for (let z = -D / 2 + 0.1; z < D / 2 - 0.08; z += 0.058 + r() * 0.02) {
      if (ti === 2 && Math.abs(z - 0.12) < 0.05) continue; // the turned one goes here
      const fresh = ti === 0 ? 0.7 : ti === 1 ? 0.35 : 0.08;
      const col = r() < fresh ? jitter(C.caneG, 0.08, z * 31 + ti) : jitter(r() < 0.5 ? C.cane : C.caneD, 0.07, z * 17 + ti);
      const len = W - 0.05 + r() * 0.25, ox = (r() - 0.5) * 0.18;
      v.box(ox, y + 0.045, z, len, 0.032, 0.032, col, (r() - 0.5) * 0.03);
      for (let k = 0; k < 3; k++) if (r() < 0.5) v.box(ox - 0.9 + k * 0.85 + r() * 0.1, y + 0.045, z, 0.02, 0.038, 0.038, '#8C7A40');
    }
  });
  // a bundle of fresh-cut cane leaning on the end, a low stool
  for (let i = 0; i < 8; i++) boxR(v, W / 2 + 0.22 + (i % 3) * 0.035, 0.75, -0.1 + (i - 4) * 0.035, 0.032, 1.5, 0.032, jitter(C.caneG, 0.07, i), 0, 0, -0.18);
  for (const y of [0.35, 1.05]) boxR(v, W / 2 + 0.22 - Math.sin(0.18) * (y - 0.75), y, -0.1, 0.16, 0.05, 0.32, C.ropeD, 0, 0, -0.18);
  v.box(-W / 2 - 0.35, 0.2, 0.25, 0.32, 0.04, 0.26, C.woodL);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(-W / 2 - 0.35 + sx * 0.12, 0.09, 0.25 + sz * 0.09, 0.04, 0.18, 0.04, C.woodD);
  if (roof) {
    // reed thatch: layered slabs, a straw fringe at the eaves, a tied ridge
    const RW = W + 0.5, RD = D + 0.7, y0 = 1.86, rise = 0.5, ang = Math.atan2(rise, RD / 2);
    for (const sz of [-1, 1]) {
      const slope = (RD / 2) / Math.cos(ang);
      for (let k = 0; k < 3; k++) {
        const t0 = k / 3;
        boxR(v, 0, y0 + rise * (1 - t0 - 1 / 6) + 0.04 + k * 0.012, sz * (RD / 2) * (t0 + 1 / 6), RW - k * 0.02, 0.07, slope / 3 + 0.06, k % 2 ? C.reed : C.reedL, sz * ang, 0, 0);
      }
      for (let k = 0; k < 6; k++) {
        const t = (k + 0.7) / 6.4;
        boxR(v, 0, y0 + rise * (1 - t) + 0.085, sz * (RD / 2) * t, RW + 0.02, 0.025, 0.045, k % 2 ? C.reedD : '#B8984F', sz * ang, 0, 0);
      }
      for (let x = -RW / 2 + 0.1; x < RW / 2; x += 0.23) boxR(v, x, y0 + rise * 0.5 + 0.09, sz * (RD / 4), 0.012, 0.02, slope * 0.9, '#D9BE7E', sz * ang, 0, 0);
      for (let x = -RW / 2; x <= RW / 2; x += 0.07) v.box(x, y0 - 0.03, sz * (RD / 2 + 0.01), 0.05, 0.12 + ((x * 100) % 3) * 0.02, 0.05, jitter(C.reedD, 0.08, x * 50));
    }
    v.box(0, y0 + rise + 0.07, 0, RW + 0.06, 0.1, 0.18, C.reedD);
    for (let x = -RW / 2 + 0.2; x < RW / 2; x += 0.5) v.box(x, y0 + rise + 0.07, 0, 0.05, 0.13, 0.2, C.ropeD);
  }
  root.add(v.mesh());
  // the turned length: tan on one side, still green on the other
  const tv = new VoxelBuilder();
  tv.box(0, 0.009, 0, 2.4, 0.018, 0.034, C.cane);
  tv.box(0, -0.009, 0, 2.4, 0.018, 0.034, C.caneG);
  for (const x of [-0.8, 0.1, 0.9]) tv.box(x, 0, 0, 0.02, 0.04, 0.04, '#8C7A40');
  const turn = tv.mesh({ px: 1.2 });
  turn.position.set(0.05, tiers[2] + 0.047, 0.12);
  root.add(turn);
  const setTurned = (t) => { turn.rotation.x = Math.PI * (1 - clamp01(t)); };
  setTurned(turned);
  const shadow = shadowUnder(root, 1.6, 0.8, 0, 0, 0.4);
  return { root, setTurned, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// tally board
// ---------------------------------------------------------------------------------------------
function drawTally(g, W, H, n, rubbed) {
  const grd = g.createLinearGradient(0, 0, W, H);
  grd.addColorStop(0, '#46534A');
  grd.addColorStop(1, '#36423A');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  const r = rand(11);
  g.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    g.strokeStyle = `rgba(230,236,226,${0.03 + r() * 0.04})`;
    g.lineWidth = 16 + r() * 22;
    g.beginPath();
    g.arc(r() * W, r() * H, 30 + r() * 60, r() * 6, r() * 6 + 1.4);
    g.stroke();
  }
  fitText(g, 'ကြိမ်စည်း', 20, 34, 30, 200, { color: '#F1EEE2', align: 'left' });
  g.strokeStyle = '#F1EEE2';
  g.lineWidth = 5;
  const perRow = 25, x0 = 24, dx = 15.5, rowH = 64, y0 = 64;
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / perRow), k = i % perRow;
    const grp = Math.floor(k / 5), j = k % 5;
    const y = y0 + row * rowH;
    if (y + 46 > H) break;
    const gx = x0 + grp * (dx * 4 + 22);
    g.globalAlpha = 0.9;
    g.beginPath();
    if (j < 4) { const x = gx + j * dx; g.moveTo(x, y); g.lineTo(x + 1, y + 42); }
    else { g.moveTo(gx - 6, y + 34); g.lineTo(gx + dx * 3 + 6, y + 8); }
    g.stroke();
  }
  g.globalAlpha = 1;
  if (rubbed) {
    g.fillStyle = 'rgba(160,172,160,0.35)';
    g.beginPath(); g.ellipse(W * 0.7, H * 0.7, W * 0.18, H * 0.13, -0.2, 0, TAU); g.fill();
  }
  for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? 'rgba(58,70,62,0.5)' : 'rgba(240,240,232,0.08)'; g.fillRect(r() * W, r() * H, 1.5 + r() * 2, 1.5 + r() * 2); }
}
/**
 * The bundle tally board, 0.9 x 0.6: straight rows of chalk tally marks in fives (every bundle counted).
 * wall: true = flat (for room.mount, origin at its centre); else on a post with a little cap, a chalk ledge,
 * a rag, and three cane bundles tied tight (two bands each) at its foot. setMarks(n), rub() smudges a patch.
 */
export function tallyBoard({ wall = false, marks = 23, bundles = true } = {}) {
  const root = new THREE.Group();
  root.name = 'tallyBoard';
  const v = new VoxelBuilder();
  const BW = 0.9, BH = 0.6, by = wall ? 0 : 1.25;
  v.box(0, by, -0.02, BW + 0.08, BH + 0.08, 0.04, C.woodD);
  v.box(0, by - BH / 2 - 0.05, 0.03, BW, 0.03, 0.08, C.wood); // chalk ledge
  v.box(0.25, by - BH / 2 - 0.025, 0.04, 0.06, 0.02, 0.02, '#F4F1E8');
  if (!wall) {
    v.box(0, (by - BH / 2) / 2, -0.07, 0.1, by - BH / 2 + 0.1, 0.1, C.woodD);
    v.box(0, by + BH / 2 + 0.12, -0.04, 0.12, 0.2, 0.08, C.woodD);
    boxR(v, -0.28, by + BH / 2 + 0.1, 0, 0.62, 0.05, 0.22, C.terra, 0, 0, 0.2);
    boxR(v, 0.28, by + BH / 2 + 0.1, 0, 0.62, 0.05, 0.22, C.terra, 0, 0, -0.2);
    v.box(0.5, by - 0.15, 0.0, 0.03, 0.03, 0.06, C.iron);
    v.box(0.53, by - 0.26, 0.03, 0.08, 0.2, 0.02, '#D9CBB0'); // a rag
    v.box(0, 0.03, -0.07, 0.3, 0.06, 0.3, C.stoneD);
    if (bundles) {
      for (let b = 0; b < 3; b++) {
        const bz = 0.25 + (b === 2 ? 0.05 : 0), bx = b === 2 ? 0.05 : (b - 0.5) * 0.26, byy = b === 2 ? 0.2 : 0.08;
        for (let i = 0; i < 9; i++) v.box(bx + ((i % 3) - 1) * 0.03, byy + (Math.floor(i / 3) - 1) * 0.03, bz, 0.03, 0.03, 0.95, jitter(i % 4 ? C.cane : C.caneD, 0.07, i + b * 9), 0.0);
        for (const zz of [-0.25, 0.25]) v.box(bx, byy, bz + zz, 0.12, 0.12, 0.05, C.ropeD);
      }
    }
  }
  root.add(v.mesh());
  let count = marks, rubbed = false;
  const cnv = liveCanvas(512, 340, (g, W, H) => drawTally(g, W, H, count, rubbed));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(BW - 0.04, BH - 0.04), basic('#E9E6DC', { map: cnv.tex }));
  face.userData.ownMat = true;
  face.position.set(0, by, 0.002);
  root.add(face);
  let shadow = null;
  if (!wall) shadow = shadowUnder(root, 0.45, 0.4, 0, 0.1, 0.4);
  return {
    root,
    setMarks(n) { count = n; rubbed = false; cnv.redraw(); },
    rub() { rubbed = true; cnv.redraw(); },
    dispose() { shadow?.geometry.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// the old man's post, the water jar
// ---------------------------------------------------------------------------------------------
/** A thick mooring post (0.9 m) on Cane Jetty with a worn flat top and a folded towel; `seat` is where he sits. */
export function oldMansPost() {
  const root = new THREE.Group();
  root.name = 'oldMansPost';
  const v = new VoxelBuilder();
  prism(v, 0, 0.44, 0, 0.19, 0.21, 0.88, '#7A5A3E', 8);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + 0.2; v.box(Math.sin(a) * 0.2, 0.3 + (k % 3) * 0.17, Math.cos(a) * 0.2, 0.012, 0.3, 0.012, '#5E4128', a); } // grain cracks
  prism(v, 0, 0.885, 0, 0.18, 0.185, 0.03, '#B08C64', 8); // worn smooth top
  prism(v, 0, 0.9, 0, 0.12, 0.12, 0.004, '#C49C70', 8);
  for (let k = 0; k < 4; k++) ring(v, 0, 0.42 + k * 0.045, 0, 0.215, 0.04, jitter(C.rope, 0.06, k), 8, 'y', 0.04); // rope groove
  v.box(0, 0.62, 0.21, 0.07, 0.07, 0.04, C.iron); // a staple
  ring(v, 0, 0.56, 0.24, 0.05, 0.016, C.iron, 8, 'z', 0.016);
  // the folded towel: maroon and cream checks
  for (let k = 0; k < 2; k++) {
    v.box(0.02, 0.92 + k * 0.025, 0.01, 0.3, 0.025, 0.2 - k * 0.02, k ? '#F2E9D6' : C.maroon);
    for (let i = 0; i < 4; i++) v.box(-0.11 + i * 0.075, 0.933 + k * 0.025, 0.01, 0.025, 0.004, 0.2 - k * 0.02, k ? '#C8505A' : '#E9DCC0');
  }
  v.box(0.15, 0.87, 0.01, 0.03, 0.08, 0.18, C.maroon);
  for (const [x, z] of [[0.2, 0.12], [-0.18, 0.15], [0.05, -0.22]]) v.box(x, 0.03, z, 0.12, 0.06, 0.1, C.stoneD, x * 3);
  root.add(v.mesh());
  const seat = new THREE.Object3D();
  seat.position.set(0, 0.96, 0);
  root.add(seat);
  const shadow = shadowUnder(root, 0.32, 0.32, 0, 0, 0.45);
  return { root, seat, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

/** A round-bellied glazed water jar (0.5 m) with a wooden lid, on a 0.6 m stand; a tin cup on a nail. */
export function waterJar({ stand = true } = {}) {
  const root = new THREE.Group();
  root.name = 'waterJar';
  const v = new VoxelBuilder();
  const y0 = stand ? 0.6 : 0;
  if (stand) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) boxR(v, sx * 0.2, 0.3, sz * 0.2, 0.06, 0.6, 0.06, jitter(C.woodD, 0.05, sx + sz * 2), sz * 0.05, 0, -sx * 0.05);
    for (const s of [-1, 1]) { v.box(0, y0 - 0.03, s * 0.21, 0.5, 0.06, 0.06, C.wood); v.box(s * 0.21, y0 - 0.03, 0, 0.06, 0.06, 0.5, C.wood); }
    for (const s of [-1, 1]) { v.box(0, 0.16, s * 0.21, 0.46, 0.04, 0.04, C.woodD); v.box(s * 0.21, 0.16, 0, 0.04, 0.04, 0.46, C.woodD); }
    v.box(0, 0.19, 0, 0.42, 0.02, 0.42, C.woodG);
  }
  // the jar: a dark glaze with an ochre drip band
  const T = [[0.1, 0.04, C.jarBrown], [0.16, 0.06, C.jarBrown], [0.2, 0.08, '#6B4630'], [0.22, 0.1, '#6B4630'], [0.2, 0.07, C.jarBrown], [0.15, 0.05, C.jarBrown], [0.11, 0.04, '#4A2E1E'], [0.13, 0.03, '#6B4630']];
  let y = y0;
  for (const [r, h, col] of T) { prism(v, 0, y + h / 2, 0, r, r, h, col, 10); y += h; }
  prism(v, 0, y0 + 0.26, 0, 0.222, 0.222, 0.03, C.jarDrip, 10);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + 0.3; v.box(Math.sin(a) * 0.215, y0 + 0.215, Math.cos(a) * 0.215, 0.03, 0.07, 0.02, C.jarDrip, a); }
  prism(v, 0, y0 + 0.3, 0, 0.205, 0.205, 0.02, '#8A5E3E', 10); // shine
  // the lid: two boards and a knob
  prism(v, 0, y + 0.015, 0, 0.16, 0.16, 0.03, C.woodL, 10);
  v.box(0, y + 0.035, 0, 0.3, 0.015, 0.012, C.woodD);
  v.box(0, y + 0.055, 0, 0.06, 0.03, 0.04, C.woodD);
  // the tin cup on a nail on the front leg
  if (stand) {
    v.box(0.2, 0.5, 0.25, 0.015, 0.015, 0.05, C.iron);
    prism(v, 0.2, 0.43, 0.29, 0.045, 0.04, 0.1, C.tin, 8);
    prism(v, 0.2, 0.48, 0.29, 0.048, 0.048, 0.01, C.tinD, 8);
    v.box(0.2, 0.46, 0.25, 0.015, 0.06, 0.03, C.tinD);
    prism(v, 0, 0.002, 0, 0.3, 0.3, 0.004, '#9A8466', 10); // a damp ring under the stand
  }
  root.add(v.mesh());
  const shadow = shadowUnder(root, 0.36, 0.36, 0, 0, 0.45);
  return { root, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

// =============================================================================================
// THE FOLD / NEWSPRINT JUNCTION
// =============================================================================================

// ---------------------------------------------------------------------------------------------
// brass key with a paper tag
// ---------------------------------------------------------------------------------------------
function keyInto(v, x, y, z) {
  ring(v, x, y - 0.03, z, 0.024, 0.012, C.brass, 8, 'z', 0.008);
  v.box(x, y - 0.075, z, 0.012, 0.07, 0.008, C.brass);
  v.box(x, y - 0.054, z, 0.022, 0.01, 0.009, C.brassL); // collar
  v.box(x + 0.012, y - 0.1, z, 0.022, 0.012, 0.008, C.brass);
  v.box(x + 0.01, y - 0.084, z, 0.016, 0.01, 0.008, C.brass);
  v.box(x, y - 0.004, z, 0.006, 0.012, 0.006, C.iron);
}
function drawTag(g, W, H, text) {
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#F7EFD8';
  roundRect(g, 4, 4, W - 8, H - 8, 10); g.fill();
  g.strokeStyle = '#C9B48A'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#C9B48A'; g.beginPath(); g.arc(18, H / 2, 6, 0, TAU); g.fill();
  if (text) fitText(g, text, W / 2 + 8, H / 2 + 2, H * 0.42, W - 40, { color: C.indigo, weight: 400 });
}
/** A small brass key (0.12 m) hanging from its origin, with a paper tag on a string; setTag(text). */
export function brassKey(tag = '') {
  const root = new THREE.Group();
  root.name = 'brassKey';
  const v = new VoxelBuilder();
  keyInto(v, 0, 0, 0);
  v.box(0.03, -0.03, 0.002, 0.04, 0.004, 0.004, '#E8DCC0'); // string to the tag
  root.add(v.mesh({ px: 1.0 }));
  let cur = tag;
  const cnv = liveCanvas(160, 80, (g, W, H) => drawTag(g, W, H, cur));
  const m = signPlane(cnv.tex, 0.08, 0.04, { transparent: true });
  m.position.set(0.085, -0.045, 0.004);
  m.rotation.z = -0.25;
  root.add(m);
  return { root, setTag(t) { cur = t; cnv.redraw(); }, dispose() { disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// bridge board: ten slate frames, two key hooks, a lamp
// ---------------------------------------------------------------------------------------------
const SLATE_CELL = [204, 128];
/** The ten frame centres on the bridge board (board-local, metres): 1-5 left column, 6-10 right, top to bottom. */
function boardFrames() {
  const out = [];
  for (let col = 0; col < 2; col++) for (let row = 0; row < 5; row++) out.push([(col ? 1 : -1) * 0.56, 2.56 - row * 0.44, 0]);
  return out;
}
/** The empty frame's backing: cork with a chalked outline where a slate hangs, old pin holes, a little wear. */
function drawCorkCell(g, x, y, w, h) {
  const r = rand(23);
  g.fillStyle = '#B98F5E'; g.fillRect(x, y, w, h);
  for (let i = 0; i < 520; i++) { g.fillStyle = r() < 0.5 ? 'rgba(120,80,44,0.35)' : 'rgba(232,206,160,0.3)'; g.fillRect(x + r() * w, y + r() * h, 1 + r() * 2, 1 + r() * 2); }
  g.fillStyle = 'rgba(90,60,36,0.25)'; g.fillRect(x, y, w, 6); g.fillRect(x, y, 5, h); // the frame's shade
  g.strokeStyle = 'rgba(246,242,230,0.55)'; g.lineWidth = 2.5; g.setLineDash([7, 5]);
  roundRect(g, x + 14, y + 12, w - 28, h - 22, 6); g.stroke();
  g.setLineDash([]);
  g.fillStyle = 'rgba(70,46,28,0.6)';
  for (const [px, py] of [[0.2, 0.3], [0.83, 0.7], [0.62, 0.25]]) { g.beginPath(); g.arc(x + px * w, y + py * h, 1.8, 0, TAU); g.fill(); }
}
function drawSlateCell(g, x, y, w, h, s) {
  g.clearRect(x, y, w, h);
  if (!s || !s.text && s.text !== '') return;
  g.fillStyle = '#C49A68';
  roundRect(g, x + 2, y + 2, w - 4, h - 4, 8); g.fill();
  g.fillStyle = '#A57B4E';
  g.fillRect(x + 2, y + h - 12, w - 4, 10);
  const sx = x + 12, sy = y + 12, sw = w - 24, sh = h - 24;
  const grd = g.createLinearGradient(sx, sy, sx + sw, sy + sh);
  grd.addColorStop(0, s.tint === 'gold' ? '#4E4A36' : '#46534A');
  grd.addColorStop(1, s.tint === 'gold' ? '#3C3826' : '#36423A');
  g.fillStyle = grd;
  g.fillRect(sx, sy, sw, sh);
  g.fillStyle = 'rgba(230,236,226,0.06)';
  g.beginPath(); g.ellipse(sx + sw * 0.3, sy + sh * 0.6, sw * 0.3, sh * 0.25, 0.4, 0, TAU); g.fill();
  if (s.text) {
    const col = s.faint ? 'rgba(200,204,198,0.55)' : s.tint === 'gold' ? '#F1CF6A' : '#F4F1E8';
    g.save();
    g.beginPath(); g.rect(sx, sy, sw, sh); g.clip();
    const lines = String(s.text).split('\n');
    const size = Math.min(sh / (lines.length * 1.7), 40);
    lines.forEach((l, i) => fitText(g, l, sx + sw / 2, sy + sh / 2 + (i - (lines.length - 1) / 2) * size * 1.7, size, sw - 14, { color: col }));
    g.restore();
  }
  g.fillStyle = '#E8DCC0'; // the string loop at the top
  g.fillRect(x + w / 2 - 2, y, 4, 12);
}
/**
 * Nay Chi's bridge board, 2.4 x 2.8 (+ a heading and a small lamp above): ten slate frames in two columns
 * (1-5 left, 6-10 right, top to bottom; each with an iron hook and a painted Burmese number), heading
 * «ဖြတ်ကူးမယ့်သူတိုင်းအတွက် သင်ခန်းစာတို ဆယ်ခု», two brass keys on hooks under frame 10.
 * slates: 10 entries of null (empty hook) | text | { text, faint, tint: 'gold' }. setSlate(i 0..9, s), setFaint(i, on),
 * setKeys(n 0..2), setLit(on); keys = the two brassKey handles (for taking one).
 */
export function bridgeBoard({ slates = [null, null, null, null, null, null, null, null, null, ''], keys = 2, lit = false, heading = 'ဖြတ်ကူးမယ့်သူတိုင်းအတွက် သင်ခန်းစာတို ဆယ်ခု', en = 'Ten short lessons for everyone who crosses' } = {}) {
  const root = new THREE.Group();
  root.name = 'bridgeBoard';
  const v = new VoxelBuilder();
  const BW = 2.4, B0 = 0.5, B1 = 2.82;
  for (const s of [-1, 1]) {
    v.box(s * (BW / 2 + 0.02), 1.65, -0.05, 0.14, 3.3, 0.14, C.woodD);
    v.box(s * (BW / 2 + 0.02), 0.05, -0.05, 0.3, 0.1, 0.3, C.stoneD);
  }
  // the board: vertical planks, a frame round it
  const n = 10;
  for (let i = 0; i < n; i++) v.box(-BW / 2 + (BW * (i + 0.5)) / n, (B0 + B1) / 2, -0.08, BW / n - 0.012, B1 - B0, 0.05, jitter('#8C6A48', 0.05, i));
  v.box(0, (B0 + B1) / 2, -0.11, BW, B1 - B0, 0.02, '#4A3424');
  for (const y of [B0, B1]) v.box(0, y, -0.05, BW + 0.12, 0.08, 0.08, C.woodD);
  // heading panel and its little roof
  v.box(0, 3.04, -0.07, BW + 0.1, 0.36, 0.05, C.woodD);
  boxR(v, 0, 3.3, -0.02, BW + 0.5, 0.06, 0.42, C.brick, 0.32, 0, 0);
  for (let k = 0; k < 12; k++) boxR(v, -BW / 2 - 0.2 + k * ((BW + 0.4) / 11), 3.33, -0.02, 0.03, 0.03, 0.42, C.brickD, 0.32, 0, 0);
  v.box(0, 3.37, -0.1, BW + 0.54, 0.06, 0.08, C.goldD);
  // the lamp on top
  v.box(0, 3.53, -0.08, 0.05, 0.3, 0.05, C.iron);
  v.box(0, 3.7, -0.08, 0.2, 0.04, 0.2, C.iron);
  v.box(0, 3.82, -0.08, 0.14, 0.05, 0.14, C.iron);
  v.box(0, 3.88, -0.08, 0.04, 0.06, 0.04, C.goldD);
  // a chalk ledge along the foot of the board, a stub of chalk and a rag; a few old nail holes
  v.box(0, B0 - 0.02, 0.02, BW - 0.1, 0.03, 0.1, C.wood);
  v.box(-0.7, B0 + 0.0, 0.04, 0.07, 0.02, 0.02, '#F4F1E8');
  v.box(-0.95, B0 - 0.05, 0.06, 0.12, 0.12, 0.02, '#D9CBB0');
  // ten frames: a raised border, an iron hook, a little number tag
  const pos = [];
  for (const p of boardFrames()) pos.push([p[0], p[1]]);
  pos.forEach(([x, y]) => {
    const fw = 0.72, fh = 0.4;
    v.box(x, y + fh / 2, -0.035, fw, 0.03, 0.04, C.woodL);
    v.box(x, y - fh / 2, -0.035, fw, 0.03, 0.04, C.woodL);
    for (const s of [-1, 1]) v.box(x + s * fw / 2, y, -0.035, 0.03, fh + 0.03, 0.04, C.woodL);
    v.box(x, y - 0.005, -0.05, fw - 0.04, fh - 0.04, 0.005, '#5E4430');
    v.box(x, y + 0.16, -0.01, 0.02, 0.04, 0.04, C.iron);
    v.box(x, y + 0.145, 0.01, 0.02, 0.02, 0.02, C.iron);
  });
  // the key rail under frame 10, two hooks
  const kx = 0.56, ky = 0.33;
  v.box(kx, ky + 0.05, -0.06, 0.5, 0.09, 0.05, C.woodD);
  for (const s of [-1, 1]) { v.box(kx + s * 0.1, ky + 0.02, -0.02, 0.015, 0.015, 0.05, C.iron); v.box(kx + s * 0.1, ky + 0.035, 0.0, 0.015, 0.03, 0.015, C.iron); }
  root.add(v.mesh());

  // heading + number tags + slates, all on one atlas (1024 x 512)
  const state = slates.map((s) => (s === null || s === undefined ? null : typeof s === 'string' ? { text: s } : { ...s }));
  while (state.length < 10) state.push(null);
  const atlas = liveCanvas(1024, 512, (g) => {
    g.clearRect(0, 0, 1024, 512);
    // heading strip (1024 x 150)
    g.fillStyle = '#F6EFDC'; g.fillRect(0, 0, 1024, 150);
    g.strokeStyle = C.maroon; g.lineWidth = 8; g.strokeRect(6, 6, 1012, 138);
    fitText(g, heading, 512, 62, 54, 960, { color: C.maroon });
    fitText(g, en, 512, 118, 28, 900, { weight: 600, font: FONT_SERIF, color: C.woodD });
    // number tags 1-10 (10 cells of 64 x 64 at y 150)
    for (let i = 0; i < 10; i++) {
      const x = i * 64, y = 152;
      g.fillStyle = '#EFE3C2'; roundRect(g, x + 4, y + 4, 56, 56, 10); g.fill();
      fitText(g, myNum(i + 1), x + 32, y + 34, 40, 50, { color: C.maroon });
    }
    for (let i = 0; i < 10; i++) drawSlateCell(g, (i % 5) * SLATE_CELL[0], 256 + Math.floor(i / 5) * SLATE_CELL[1], SLATE_CELL[0], SLATE_CELL[1], state[i]);
    drawCorkCell(g, 640, 152, 192, 96);
  });
  const q = new Quads(1024, 512);
  q.add(0, 3.04, -0.04, BW, BW * 150 / 1024, [0, 0, 1024, 150]);
  pos.forEach(([x, y]) => q.add(x, y, -0.026, 0.67, 0.35, [640, 152, 192, 96])); // cork backing with a chalked outline: frames never read as holes
  pos.forEach(([x, y], i) => q.add(x - 0.32, y + 0.16, 0.03, 0.1, 0.1, [i * 64, 152, 64, 64]));
  const slateIdx = pos.map(([x, y], i) => q.add(x, y - 0.015, 0.012, 0.56, 0.56 * SLATE_CELL[1] / SLATE_CELL[0], [(i % 5) * SLATE_CELL[0], 256 + Math.floor(i / 5) * SLATE_CELL[1], SLATE_CELL[0], SLATE_CELL[1]], -0.04, 0, (i % 3 - 1) * 0.025));
  const qm = q.mesh(atlas.tex);
  root.add(qm);
  const syncVis = () => state.forEach((s, i) => q.setVisible(slateIdx[i], !!s));
  syncVis();

  // the keys
  const keyH = [brassKey(''), brassKey('')];
  keyH.forEach((k, i) => { k.root.position.set(kx + (i ? 0.1 : -0.1), ky + 0.03, 0.01); k.root.rotation.z = i ? -0.06 : 0.08; root.add(k.root); });
  const setKeys = (nk) => keyH.forEach((k, i) => { k.root.visible = i < nk; });
  setKeys(keys);

  // lamp pane + glow
  const paneMat = basic('#E9DFC8').clone();
  const pane = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.14), paneMat);
  pane.position.set(0, 3.76, -0.08);
  pane.userData.ownMat = true;
  root.add(pane);
  // a small, dim halo hugging the lamp (no beacon: the story lights it at dusk, nothing else)
  const glow = halos([[0, 3.76, 0.02, 1]], 0.42);
  root.add(glow.mesh);
  const off = new THREE.Color('#E9DFC8'), on = new THREE.Color('#FFD27A');
  const setLit = (b) => { paneMat.color.copy(b ? on : off); glow.set(b ? 0.3 : 0); };
  setLit(lit);
  const shadow = shadowUnder(root, 1.5, 0.45, 0, 0, 0.4);
  return {
    root, keys: keyH, setKeys, setLit,
    setSlate(i, s) { state[i] = s === null || s === undefined ? null : typeof s === 'string' ? { text: s } : { ...s }; atlas.redraw(); syncVis(); },
    setFaint(i, b) { if (state[i]) { state[i].faint = b; atlas.redraw(); } },
    dispose() { keyH.forEach((k) => k.dispose()); shadow.geometry.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// old rope footbridge (runs +X from its west posts to the middle pier)
// ---------------------------------------------------------------------------------------------
/**
 * The old rope footbridge, 1 m wide, `len` long along +X, deck y = 0 at both ends sagging `sag` in the
 * middle; rope rails with hangers, plank deck (one new pale "kind" plank), two west posts. sway(dt, amount)
 * swings the middle sideways (the ends stay put).
 */
export function ropeFootbridge({ len = 6, sag = 0.35, kind = true } = {}) {
  const root = new THREE.Group();
  root.name = 'ropeFootbridge';
  const dy = (x) => -sag * Math.sin((Math.PI * x) / len);
  const slope = (x) => Math.atan(-sag * (Math.PI / len) * Math.cos((Math.PI * x) / len));
  const v = new VoxelBuilder();
  const n = Math.round(len / 0.26);
  for (let i = 0; i < n; i++) {
    const x = (len * (i + 0.5)) / n;
    const isKind = kind && i === Math.floor(n * 0.62);
    const short = i % 7 === 3 ? 0.18 : 0;
    boxR(v, x, dy(x) - 0.02, short / 2 * (i % 2 ? 1 : -1), 0.2, 0.04, 1.0 - short, isKind ? '#E9D3A6' : jitter([C.woodG, '#9C805C', '#B39470'][i % 3], 0.06, i), 0, (i % 5 - 2) * 0.03, slope(x));
  }
  const seg = 14;
  for (let k = 0; k < seg; k++) {
    const x0 = (len * k) / seg, x1 = (len * (k + 1)) / seg;
    for (const z of [-0.47, 0.47]) {
      beam(v, x0, dy(x0) - 0.05, z, x1, dy(x1) - 0.05, z, 0.04, C.ropeD); // under-ropes
      const r0 = 0.95 + dy(x0) * 0.55, r1 = 0.95 + dy(x1) * 0.55;
      beam(v, x0, r0, z * 1.1, x1, r1, z * 1.1, 0.035, C.rope); // hand ropes
      if (k > 0) beam(v, x0, r0, z * 1.1, x0, dy(x0) - 0.03, z, 0.012, '#B89C6E'); // hangers
    }
  }
  const sway = v.mesh();
  root.add(sway);
  // west posts (do not sway)
  const pv = new VoxelBuilder();
  for (const z of [-0.6, 0.6]) {
    prism(pv, -0.12, 0.62, z, 0.07, 0.08, 1.3, C.woodD, 8);
    for (let k = 0; k < 4; k++) ring(pv, -0.12, 0.9 + k * 0.04, z, 0.085, 0.035, C.rope, 8, 'y', 0.035);
    beam(pv, -0.12, 0.95, z, 0.02, 0.95, z * 1.1, 0.035, C.rope);
    beam(pv, -0.12, 0.2, z, -0.6, 0.0, z * 1.3, 0.035, C.ropeD); // guy rope to a stake
    pv.box(-0.62, 0.06, z * 1.3, 0.06, 0.14, 0.06, C.woodD);
  }
  pv.box(-0.1, -0.05, 0, 0.3, 0.08, 1.1, C.woodGD);
  root.add(pv.mesh());
  // remember rest positions (deck mesh + its outline) and a weight per vertex
  const geos = [sway.geometry, sway.children[0].geometry];
  const rest = geos.map((g) => g.attributes.position.array.slice());
  let time = 0;
  return {
    root,
    sway(dt, amount = 1) {
      time += dt;
      const off = amount * 0.09 * Math.sin(time * 1.7), lift = amount * 0.02 * Math.sin(time * 3.4);
      geos.forEach((g, gi) => {
        const a = g.attributes.position.array, b = rest[gi];
        for (let i = 0; i < a.length; i += 3) {
          const w = Math.sin((Math.PI * Math.min(len, Math.max(0, b[i]))) / len);
          a[i + 1] = b[i + 1] + lift * w;
          a[i + 2] = b[i + 2] + off * w + off * w * (b[i + 1] - dy(b[i])) * 0.3;
        }
        g.attributes.position.needsUpdate = true;
      });
    },
    dispose() { disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// the new bridge
// ---------------------------------------------------------------------------------------------
/**
 * The new paper-truss bridge across the fold, `len` along +X, `width` wide (deck top at y = 0, flush with the
 * shore at both ends; the
 * valley floor `drop` below): planks printed with yesterday's columns, low folded-paper trusses (0.9 m),
 * deck lamps, a striped boom across the west mouth (setBoom 0 = down/closed .. 1 = up), and a string of
 * paper lanterns with a name board across the east end. setLamps(0..1).
 */
export function newBridge({ len = 12, width = 4, drop = 2.6 } = {}) {
  const root = new THREE.Group();
  root.name = 'newBridge';
  const v = new VoxelBuilder();
  const HW = width / 2, DY = 0;
  const r = rand(77);
  // deck planks with printed columns
  const n = Math.round(len / 0.3);
  for (let i = 0; i < n; i++) {
    const x = (len * (i + 0.5)) / n;
    v.box(x, DY - 0.05, 0, len / n - 0.02, 0.1, width, jitter(i % 4 === 0 ? '#CDBB98' : '#D8C9A8', 0.04, i));
    for (let c = 0; c < 6; c++) {
      const z0 = -HW + 0.25 + c * ((width - 0.5) / 6), cw = (width - 0.5) / 6 - 0.12;
      if ((i + c) % 9 === 0) { v.box(x, DY + 0.002, z0 + cw / 2, 0.16, 0.004, cw, '#5E5A52'); continue; } // a headline
      for (let k = 0; k < 2; k++) {
        const l = cw * (0.55 + r() * 0.45);
        v.box(x - 0.06 + k * 0.12, DY + 0.002, z0 + l / 2, 0.035, 0.004, l, '#8E897E');
      }
    }
  }
  // fascia beams (newsprint) and the low folded-paper trusses
  for (const s of [-1, 1]) {
    v.box(len / 2, DY - 0.15, s * (HW + 0.06), len, 0.3, 0.12, C.newsL);
    v.box(len / 2, DY - 0.29, s * (HW + 0.125), len, 0.02, 0.01, C.newsD);
    for (let k = 0; k < 6; k++) v.box(len / 2, DY - 0.2 + k * 0.035, s * (HW + 0.122), len - 0.3, 0.008, 0.006, '#A8A396');
    v.box(len / 2, DY + 0.06, s * (HW - 0.05), len, 0.12, 0.12, C.woodD); // bottom chord
    v.box(len / 2, DY + 0.9, s * (HW - 0.05), len + 0.1, 0.08, 0.16, C.woodL); // top rail
    v.box(len / 2, DY + 0.95, s * (HW - 0.05), len + 0.1, 0.02, 0.17, C.goldD);
    const bays = Math.round(len / 1.0);
    for (let k = 0; k < bays; k++) {
      const x0 = (len * k) / bays, x1 = (len * (k + 1)) / bays;
      const up = k % 2 === 0;
      beam(v, x0 + 0.05, up ? DY + 0.12 : DY + 0.86, s * (HW - 0.05), x1 - 0.05, up ? DY + 0.86 : DY + 0.12, s * (HW - 0.05), 0.12, k % 2 ? C.newsL : C.paper, 0.05);
      beam(v, x0 + 0.05, up ? DY + 0.12 : DY + 0.86, s * (HW - 0.02), x1 - 0.05, up ? DY + 0.86 : DY + 0.12, s * (HW - 0.02), 0.02, C.newsD, 0.02); // fold edge
      v.box(x0, DY + 0.48, s * (HW - 0.05), 0.08, 0.8, 0.1, C.woodD);
    }
    v.box(len, DY + 0.48, s * (HW - 0.05), 0.08, 0.8, 0.1, C.woodD);
  }
  // abutments and two trestle bents down into the fold
  for (const x of [0.4, len - 0.4]) for (let c = 0; c < Math.ceil(drop / 0.35); c++) {
    const y = -0.2 - c * 0.35;
    v.box(x + (c % 2 ? 0.05 : -0.05), y - 0.17, 0, 0.9, 0.34, width + 0.3, jitter(c % 2 ? C.stone : C.stoneL, 0.04, c + x));
  }
  for (const x of [len / 3, (2 * len) / 3]) {
    for (const z of [-HW + 0.3, HW - 0.3]) v.box(x, -drop / 2, z, 0.2, drop, 0.2, C.woodD);
    beam(v, x, -0.25, -HW + 0.3, x, -drop + 0.3, HW - 0.3, 0.1, C.woodGD);
    beam(v, x, -0.25, HW - 0.3, x, -drop + 0.3, -HW + 0.3, 0.1, C.woodGD);
    v.box(x, -0.2, 0, 0.24, 0.16, width, C.woodD);
  }
  // lamp posts on the rails
  const lampX = [];
  for (let x = 2; x < len - 1; x += 4) lampX.push(x);
  const lamps = [];
  lampX.forEach((x, i) => {
    const s = i % 2 ? 1 : -1;
    for (const ss of [s, -s]) {
      const z = ss * (HW - 0.05);
      v.box(x, DY + 1.3, z, 0.06, 0.8, 0.06, C.iron);
      v.box(x, DY + 1.71, z, 0.24, 0.04, 0.24, C.maroon);
      v.box(x, DY + 1.76, z, 0.08, 0.06, 0.08, C.goldD);
      v.box(x, DY + 1.48, z, 0.18, 0.03, 0.18, C.maroon);
      lamps.push([x, DY + 1.6, z]);
    }
  });
  // east end: two posts, a string of paper lanterns, a name board facing +Z
  const ex = len - 0.25, LZ = HW + 0.3;
  for (const s of [-1, 1]) {
    v.box(ex, 1.35, s * LZ, 0.12, 2.6, 0.12, C.woodD);
    v.box(ex, 2.68, s * LZ, 0.18, 0.08, 0.18, C.goldD);
  }
  const strPts = [];
  const nl = 7;
  for (let k = 0; k <= 16; k++) {
    const t = k / 16, z = -LZ + 2 * LZ * t, y = 2.55 - Math.sin(Math.PI * t) * 0.35;
    strPts.push([z, y]);
  }
  for (let k = 0; k < 16; k++) beam(v, ex, strPts[k][1], strPts[k][0], ex, strPts[k + 1][1], strPts[k + 1][0], 0.015, C.ink);
  const LCOL = [C.maroon, C.mustard, '#F2E9D6', C.teal, C.maroon, C.mustard, '#F2E9D6'];
  for (let k = 0; k < nl; k++) {
    const t = (k + 1) / (nl + 1), z = -LZ + 2 * LZ * t, y = 2.55 - Math.sin(Math.PI * t) * 0.35 - 0.16;
    lamps.push([ex, y, z]);
    v.box(ex, y + 0.12, z, 0.01, 0.06, 0.01, C.ink);
    v.box(ex, y + 0.08, z, 0.1, 0.025, 0.1, C.goldD);
    v.box(ex, y - 0.08, z, 0.08, 0.025, 0.08, C.goldD);
    for (const k2 of [-1, 1]) v.box(ex, y, z, 0.13 + (k2 > 0 ? 0 : 0.02), 0.13, 0.13 - (k2 > 0 ? 0.02 : 0), LCOL[k]);
  }
  v.box(ex - 0.66, 1.95, -LZ + 0.04, 1.2, 0.5, 0.06, C.woodD); // board backing on the north post, facing +Z (sign plane below)
  for (const y of [1.75, 2.15]) v.box(ex - 0.33, y, -LZ + 0.04, 0.6, 0.05, 0.08, C.iron);
  // the boom's posts: pivot post (north) with a counterweight, a rest fork (south)
  const BX = 0.7, PZ = -HW - 0.35;
  v.box(BX, 0.55, PZ, 0.18, 1.1, 0.18, C.woodD);
  v.box(BX, 0.05, PZ, 0.34, 0.1, 0.34, C.stoneD);
  v.box(BX, 0.45, HW + 0.32, 0.12, 0.9, 0.12, C.woodD);
  for (const s of [-1, 1]) v.box(BX + s * 0.07, 0.95, HW + 0.32, 0.04, 0.14, 0.12, C.woodD);
  root.add(v.mesh());
  const boom = new THREE.Group();
  boom.position.set(BX, 1.0, PZ);
  root.add(boom);
  const bv = new VoxelBuilder();
  const BL = width + 0.75;
  const stripes = 9;
  for (let k = 0; k < stripes; k++) bv.box(0, 0, 0.1 + (BL * (k + 0.5)) / stripes, 0.1, 0.1, BL / stripes, k % 2 ? '#F2E9D6' : C.maroon);
  bv.box(0, 0, -0.3, 0.2, 0.2, 0.32, C.iron); // counterweight
  bv.box(0, 0, 0, 0.14, 0.14, 0.14, C.goldD); // hub
  bv.box(0, -0.12, BL * 0.55, 0.012, 0.18, 0.012, C.ink);
  bv.box(0, -0.25, BL * 0.55, 0.18, 0.12, 0.012, C.mustard); // a small hanging plate
  boom.add(bv.mesh());
  const setBoom = (t) => { boom.rotation.x = -smooth(t) * 1.4; };
  setBoom(0);
  // name board, lantern panes (lit colour), glows
  const name = liveCanvas(512, 200, (g, W, H) => paintBoard(g, W, H, { my: 'သတင်းစာလမ်းဆုံ', en: 'Newsprint Junction', bg: C.newsL, border: C.maroon }));
  const nm = signPlane(name.tex, 1.1, 0.43);
  nm.position.set(ex - 0.66, 1.95, -LZ + 0.075);
  root.add(nm);
  const pv = new VoxelBuilder();
  lamps.forEach(([x, y, z], i) => { if (i < lampX.length * 2) pv.box(x, y, z, 0.16, 0.2, 0.16, '#ffffff'); });
  const paneMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const panes = new THREE.Mesh(pv.geometry(), paneMat);
  panes.userData.ownMat = true;
  root.add(panes);
  // small dim halos close round each lamp (Day 8's lamps; off by default, lit only by the story)
  const glow = halos(lamps.map(([x, y, z], i) => [x, y, z + (i < lampX.length * 2 ? Math.sign(z) * 0.1 : 0.08), i < lampX.length * 2 ? 1 : 0.5]), 0.55);
  root.add(glow.mesh);
  const off = new THREE.Color('#EDE3CC'), on = new THREE.Color('#FFD27A');
  const setLamps = (t) => { paneMat.color.copy(off).lerp(on, clamp01(t)); glow.set(clamp01(t) * 0.38); };
  setLamps(0);
  return {
    root, setBoom, setLamps,
    update() {},
    dispose() { disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// middle pier with the boom's winch
// ---------------------------------------------------------------------------------------------
/**
 * The middle pier, 2 x 2, top at y = 0 (its foot `h` below on the valley floor): courses of stone-paper
 * blocks, a plank top, two posts on its west side for the footbridge ropes, and the winch (setTurn 0..1
 * turns drum and crank). `handle` is the crank grip (slate 6 hangs there), it turns with the crank.
 */
export function middlePier({ h = 2.6 } = {}) {
  const root = new THREE.Group();
  root.name = 'middlePier';
  const v = new VoxelBuilder();
  const S = 2.0;
  const courses = Math.ceil(h / 0.32);
  for (let c = 0; c < courses; c++) {
    const y = -0.08 - c * 0.32 - 0.16, s = S + c * 0.03;
    const off = c % 2 ? 0.25 : 0;
    for (let k = 0; k < 4; k++) {
      const a = -s / 2 + off + k * (s / 4);
      const w = Math.min(s / 4, s / 2 - a) - 0.02;
      if (w > 0.05) for (const z of [-1, 1]) v.box(a + w / 2, y, z * (s / 2 - 0.03), w, 0.3, 0.06, jitter([C.stone, C.stoneL, C.stoneD][(k + c) % 3], 0.04, k + c * 4 + z));
      if (w > 0.05) for (const x of [-1, 1]) v.box(x * (s / 2 - 0.03), y, a + w / 2, 0.06, 0.3, w, jitter([C.stoneL, C.stone, C.stoneD][(k + c) % 3], 0.04, k + c * 7 + x));
    }
    v.box(0, y, 0, s - 0.04, 0.32, s - 0.04, C.stoneDD);
    v.box(0, y + 0.16, 0, s + 0.01, 0.02, s + 0.01, '#A79D88');
  }
  // plank top with a lip
  for (let i = 0; i < 9; i++) v.box(-1.0 + (i + 0.5) * (2.1 / 9), -0.04, 0, 2.1 / 9 - 0.015, 0.08, 2.1, jitter(C.woodG, 0.05, i));
  for (const s of [-1, 1]) v.box(0, -0.06, s * 1.08, 2.2, 0.1, 0.06, C.woodD);
  // a low rail on the north and east sides
  for (let k = 0; k < 5; k++) { v.box(-0.9 + k * 0.45, 0.35, -0.98, 0.06, 0.7, 0.06, C.woodD); v.box(0.98, 0.35, -0.9 + k * 0.45, 0.06, 0.7, 0.06, C.woodD); }
  v.box(0, 0.7, -0.98, 2.0, 0.06, 0.08, C.woodL);
  v.box(0.98, 0.7, 0, 0.08, 0.06, 2.0, C.woodL);
  // footbridge posts on the west side
  for (const z of [-0.6, 0.6]) {
    prism(v, -0.9, 0.55, z, 0.07, 0.08, 1.1, C.woodD, 8);
    for (let k = 0; k < 4; k++) ring(v, -0.9, 0.8 + k * 0.04, z, 0.085, 0.035, C.rope, 8, 'y', 0.035);
  }
  // winch cheeks
  for (const z of [-0.36, 0.36]) {
    beam(v, 0.05, 0, z, 0.3, 0.75, z, 0.1, C.woodD, 0.08);
    beam(v, 0.55, 0, z, 0.3, 0.75, z, 0.1, C.woodD, 0.08);
    v.box(0.3, 0.02, z, 0.7, 0.06, 0.12, C.woodD);
  }
  // a rope running off the drum toward the boom (south)
  beam(v, 0.3, 0.6, 0.3, 0.6, -0.05, 1.08, 0.03, C.rope);
  root.add(v.mesh());
  const drum = new THREE.Group();
  drum.position.set(0.3, 0.7, 0);
  root.add(drum);
  const dv = new VoxelBuilder();
  prism(dv, 0, 0, 0, 0.13, 0.13, 0.62, C.wood, 8, Math.PI / 2, 0, 0);
  for (const z of [-0.3, 0.3]) prism(dv, 0, 0, z, 0.18, 0.18, 0.03, C.woodD, 8, Math.PI / 2, 0, 0);
  for (let k = 0; k < 8; k++) prism(dv, 0, 0, -0.24 + k * 0.068, 0.15, 0.15, 0.05, jitter(C.rope, 0.05, k), 8, Math.PI / 2, 0, 0);
  prism(dv, 0, 0, 0.0, 0.03, 0.03, 0.95, C.iron, 6, Math.PI / 2, 0, 0); // axle
  // crank on the +Z end
  dv.box(0, -0.13, 0.47, 0.05, 0.3, 0.04, C.iron);
  dv.box(0, -0.27, 0.56, 0.05, 0.05, 0.18, C.woodL);
  drum.add(dv.mesh());
  const handle = new THREE.Object3D();
  handle.position.set(0, -0.27, 0.6);
  drum.add(handle);
  const setTurn = (t) => { drum.rotation.z = -t * TAU; };
  setTurn(0);
  return { root, handle, setTurn, dispose() { disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// ink jars
// ---------------------------------------------------------------------------------------------
/** One small glazed ink jar (0.22 x 0.3 at s = 1) into v; full: corked with a gold drip. */
function jarInto(v, x, y, z, full = true, s = 1, glaze = C.glazeB) {
  const T = [[0.07, 0.03], [0.1, 0.05], [0.11, 0.07], [0.1, 0.04], [0.075, 0.03], [0.05, 0.03], [0.062, 0.02]];
  let yy = y;
  T.forEach(([r, h], i) => {
    prism(v, x, yy + (h * s) / 2, z, r * s, r * s, h * s, i === 2 ? C.glazeBL : i === 6 ? '#4E5E70' : glaze, 8);
    yy += h * s;
  });
  prism(v, x, y + 0.095 * s, z, 0.111 * s, 0.111 * s, 0.012 * s, '#C9B48A', 8); // a paper band
  if (full) {
    prism(v, x, yy + 0.02 * s, z, 0.042 * s, 0.038 * s, 0.05 * s, '#C49A68', 8); // cork
    prism(v, x, yy - 0.004 * s, z, 0.064 * s, 0.064 * s, 0.008 * s, C.inkGold, 8); // gold at the lip
    v.box(x + 0.03 * s, yy - 0.05 * s, z + 0.055 * s, 0.018 * s, 0.07 * s, 0.01 * s, C.inkGold); // a drip
    v.box(x + 0.03 * s, yy - 0.088 * s, z + 0.058 * s, 0.024 * s, 0.018 * s, 0.01 * s, C.inkGold);
  } else {
    prism(v, x, yy + 0.001, z, 0.04 * s, 0.04 * s, 0.004, C.soot, 8); // dry, open mouth
  }
  return yy;
}
/** A small glazed ink jar (0.22 x 0.3), corked with a gold glint when full; setFull(bool). */
export function inkJar({ full = true, scale = 1 } = {}) {
  const root = new THREE.Group();
  root.name = 'inkJar';
  let mesh = null;
  function setFull(f) {
    freeMesh(mesh);
    const v = new VoxelBuilder();
    jarInto(v, 0, 0, 0, f, scale);
    mesh = v.mesh({ px: 1.2 });
    root.add(mesh);
  }
  setFull(full);
  const shadow = shadowUnder(root, 0.14 * scale, 0.14 * scale, 0, 0, 0.4);
  return { root, setFull, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// the gold-ink well
// ---------------------------------------------------------------------------------------------
const WELL_RINGS = [1.0, 0.8, 0.6, 0.4, 0.2];
const wellY = (L) => 0.03 + L * 0.44;
/**
 * The gold-ink well in the square, Ø 2.0, curb 0.55 high: twelve stone-paper blocks with cap stones, the
 * shaft going down below the paving, five ring marks cut in the inner wall (level 1.0 .. 0.2; 0.6 = the third
 * from the top), one deep old mark with a scratched «နွေရှည်နှစ်» lower down, gold ink inside (setLevel 0..1),
 * a few children's empty ink pots and a ladle on the curb, a ring of paving. update(dt, t) twinkles the ink.
 */
export function goldInkWell({ level = 0.6, pots = 4 } = {}) {
  const root = new THREE.Group();
  root.name = 'goldInkWell';
  const v = new VoxelBuilder();
  const RO = 1.0, RI = 0.72, TOP = 0.55, BOT = 0, Rm = (RO + RI) / 2, N = 12;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU, ry = Math.PI / 2 - a;
    const cx = Math.cos(a), cz = Math.sin(a);
    const tw = 2 * Rm * Math.tan(Math.PI / N);
    boxR(v, cx * Rm, (BOT + TOP - 0.08) / 2, cz * Rm, tw - 0.025, TOP - 0.08 - BOT, RO - RI, jitter(i % 2 ? C.stone : C.stoneD, 0.05, i), 0, ry, 0);
    boxR(v, cx * (Rm + 0.02), TOP - 0.04, cz * (Rm + 0.02), tw + 0.02, 0.08, RO - RI + 0.08, jitter(C.stoneL, 0.04, i + 20), 0, ry, 0);
    boxR(v, cx * (RO + 0.045), TOP - 0.085, cz * (RO + 0.045), tw - 0.03, 0.012, 0.012, C.stoneDD, 0, ry, 0); // drip line under the cap
    // ring marks on the inner face of every block
    for (const L of WELL_RINGS) boxR(v, cx * (RI - 0.004), wellY(L), cz * (RI - 0.004), tw - 0.06, 0.022, 0.02, '#7E745F', 0, ry, 0);
    boxR(v, cx * (RI - 0.006), wellY(0.05), cz * (RI - 0.006), tw - 0.06, 0.04, 0.025, '#4E4638', 0, ry, 0);
    // dried gold film just above the marks (old high water)
    boxR(v, cx * (RI - 0.002), wellY(0.9), cz * (RI - 0.002), tw - 0.04, 0.05, 0.012, '#CDBB8A', 0, ry, 0);
  }
  // the dark bottom of the well (seen when the ink is low)
  prism(v, 0, 0.012, 0, RI, RI, 0.024, '#3A3226', N);
  prism(v, 0, 0.026, 0, RI * 0.6, RI * 0.6, 0.006, '#2A241C', N);
  // paving ring round the foot
  for (let i = 0; i < N; i++) {
    const a = ((i + 0.5) / N) * TAU, ry = Math.PI / 2 - a;
    boxR(v, Math.cos(a) * 1.25, 0.02, Math.sin(a) * 1.25, 2 * 1.25 * Math.tan(Math.PI / N) - 0.03, 0.04, 0.44, jitter(C.newsD, 0.05, i), 0, ry, 0);
  }
  // children's empty ink pots and a ladle on the curb
  const potAng = [1.25, 1.6, 1.95, 0.8, 2.3].slice(0, pots);
  potAng.forEach((a, i) => jarInto(v, Math.cos(a) * Rm, TOP, Math.sin(a) * Rm, false, 0.55, i % 2 ? '#4E5E70' : C.glazeB));
  beam(v, Math.cos(0.3) * (RO + 0.05), TOP + 0.03, Math.sin(0.3) * (RO + 0.05), Math.cos(0.3) * 0.45, TOP + 0.28, Math.sin(0.3) * 0.45, 0.03, C.woodD);
  prism(v, Math.cos(0.3) * (RO + 0.12), TOP + 0.04, Math.sin(0.3) * (RO + 0.12), 0.08, 0.06, 0.07, C.tin, 8);
  root.add(v.mesh());
  // the scratched label on the north inner face, at the deep mark
  const lab = liveCanvas(256, 96, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(140,128,104,0.6)'; roundRect(g, 4, 10, W - 8, H - 20, 8); g.fill();
    g.save(); g.globalAlpha = 0.9;
    fitText(g, 'နွေရှည်နှစ်', W / 2, H / 2 + 2, 40, W - 30, { color: '#F1E9D6', weight: 400 });
    g.restore();
  });
  const lm = signPlane(lab.tex, 0.3, 0.11, { transparent: true });
  lm.position.set(0, wellY(0.05) + 0.07, -RI * Math.cos(Math.PI / N) + 0.012);
  root.add(lm);
  // the ink: a 12-sided pool with a soft gold sheen, and sparkles
  const ink = liveCanvas(256, 256, (g, W, H) => {
    const grd = g.createRadialGradient(W * 0.42, H * 0.4, 8, W / 2, H / 2, W * 0.55);
    grd.addColorStop(0, '#FFE9A6');
    grd.addColorStop(0.35, '#F0C452');
    grd.addColorStop(0.8, '#C9952A');
    grd.addColorStop(1, '#9E7020');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,240,190,0.35)'; g.lineWidth = 3;
    for (let k = 1; k < 5; k++) { g.beginPath(); g.ellipse(W / 2, H / 2, k * 26, k * 22, 0, 0, TAU); g.stroke(); }
  });
  const poolGeo = new THREE.CircleGeometry(RI * Math.cos(Math.PI / N) / Math.cos(Math.PI / N) - 0.005, N, Math.PI / N);
  poolGeo.rotateX(-Math.PI / 2);
  const pool = new THREE.Mesh(poolGeo, new THREE.MeshBasicMaterial({ map: ink.tex, toneMapped: false }));
  pool.userData.ownMat = true;
  root.add(pool);
  // four-point sparkles (Maya's motif), flat on the pool
  const sp = liveCanvas(64, 64, (g) => {
    g.clearRect(0, 0, 64, 64);
    g.fillStyle = '#FFF6D8';
    g.beginPath();
    g.moveTo(32, 2); g.quadraticCurveTo(36, 28, 62, 32); g.quadraticCurveTo(36, 36, 32, 62); g.quadraticCurveTo(28, 36, 2, 32); g.quadraticCurveTo(28, 28, 32, 2);
    g.fill();
  });
  const SPK = [[-0.3, -0.2], [0.25, -0.35], [0.1, 0.25], [-0.15, 0.4], [0.4, 0.1]];
  const sq = new Quads(64, 64);
  // small, soft and low inside the curb: ambience on the ink only, never a beacon seen from afar
  SPK.forEach(([x, z]) => sq.add(x, 0.012, z, 0.1, 0.1, [0, 0, 64, 64], -Math.PI / 2));
  const spark = sq.mesh(sp.tex, { additive: true, opacity: 0.55 });
  spark.renderOrder = 3;
  root.add(spark);
  const spRest = spark.geometry.attributes.position.array.slice();
  const shadow = shadowUnder(root, 1.4, 1.4, 0, 0, 0.35);
  let L = level;
  function setLevel(t) {
    L = clamp01(t);
    pool.position.y = wellY(L);
    spark.position.y = wellY(L);
    pool.visible = spark.visible = L > 0.01;
  }
  setLevel(level);
  return {
    root, setLevel,
    get level() { return L; },
    update(dt, t) {
      const a = spark.geometry.attributes.position.array;
      for (let i = 0; i < SPK.length; i++) {
        const s = Math.max(0, Math.sin(t * 1.1 + i * 2.3)) ** 3;
        const [cx, cz] = SPK[i];
        for (let k = 0; k < 4; k++) {
          const o = i * 12 + k * 3;
          a[o] = cx + (spRest[o] - cx) * s;
          a[o + 2] = cz + (spRest[o + 2] - cz) * s;
        }
      }
      spark.geometry.attributes.position.needsUpdate = true;
      ink.tex.offset.set(Math.sin(t * 0.2) * 0.02, Math.cos(t * 0.17) * 0.02);
    },
    dispose() { sp.tex.dispose(); shadow.geometry.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// the notice board of "Maya says" slips
// ---------------------------------------------------------------------------------------------
const SLIP_PAPER = ['#F7F0DC', '#F3D9D6', '#DCE8EE', '#E6EFD8', '#F5E6A8', '#EFE3F0', '#FFFDF6'];
const SLIP_INK = ['#2A2118', '#2F5DB3', '#6E1F2A', '#3E5F7A', '#4A3B30', '#1E5E4E'];
function drawSlip(g, x, y, w, h, rot, paper, ink, text, i) {
  g.save();
  g.translate(x + w / 2, y + h / 2);
  g.rotate(rot);
  g.fillStyle = 'rgba(40,30,20,0.18)';
  g.fillRect(-w / 2 + 3, -h / 2 + 4, w, h);
  g.fillStyle = paper;
  g.fillRect(-w / 2, -h / 2, w, h);
  if (i % 3 === 0) { g.fillStyle = 'rgba(142,175,207,0.5)'; for (let yy = -h / 2 + 18; yy < h / 2; yy += 14) g.fillRect(-w / 2 + 4, yy, w - 8, 1.5); }
  fitText(g, text, 0, -h * 0.16, 17 + (i % 3) * 2, w - 14, { color: ink, weight: i % 2 ? 700 : 400 });
  g.strokeStyle = ink; g.lineWidth = 2; g.globalAlpha = 0.7;
  g.beginPath();
  for (let k = 0; k < 2; k++) {
    const yy = h * 0.12 + k * 13;
    g.moveTo(-w / 2 + 10, yy);
    for (let xx = -w / 2 + 10; xx < w / 2 - 12 - k * 18; xx += 6) g.lineTo(xx, yy + Math.sin(xx * 0.5 + i + k) * 2.5);
  }
  g.stroke();
  g.globalAlpha = 1;
  g.fillStyle = ['#C8323C', '#C9A24A', '#2F5DB3'][i % 3];
  g.beginPath(); g.arc(0, -h / 2 + 6, 5, 0, TAU); g.fill();
  g.restore();
}
/**
 * The Junction's notice board, 3.2 x 1.9 on two posts (top at ~2.6) under a little shingle cap:
 * the handbill «ရွှေမင်တွင်း ခန်းတော့မယ်», today's day sheet, ~20 «မာရာက ပြောတယ်…» slips in many hands,
 * and a clear space for one more sheet. setSlips([{ text }]) redraws the slips; pin({ title, lines, color })
 * puts a sheet in the clear space (pin(null) clears it).
 */
export function slipBoard({ slips = null } = {}) {
  const root = new THREE.Group();
  root.name = 'slipBoard';
  const v = new VoxelBuilder();
  const BW = 3.2, B0 = 0.62, B1 = 2.52;
  for (const s of [-1, 1]) {
    v.box(s * (BW / 2 + 0.06), 1.4, -0.06, 0.14, 2.8, 0.14, C.woodD);
    v.box(s * (BW / 2 + 0.06), 0.04, -0.06, 0.3, 0.08, 0.3, C.stoneD);
  }
  v.box(0, (B0 + B1) / 2, -0.08, BW + 0.08, B1 - B0 + 0.08, 0.06, C.woodD);
  for (const y of [B0 - 0.03, B1 + 0.03]) v.box(0, y, -0.03, BW + 0.16, 0.07, 0.06, C.woodL);
  for (const s of [-1, 1]) v.box(s * (BW / 2 + 0.05), (B0 + B1) / 2, -0.03, 0.07, B1 - B0 + 0.1, 0.06, C.woodL);
  // shingle cap
  for (let k = 0; k < 3; k++) boxR(v, 0, B1 + 0.18 + k * 0.05, 0.02 - k * 0.06, BW + 0.5 - k * 0.1, 0.05, 0.26, k % 2 ? C.maroonD : C.maroon, 0.35, 0, 0);
  for (let k = 0; k < 14; k++) boxR(v, -BW / 2 - 0.2 + k * ((BW + 0.4) / 13), B1 + 0.2, 0.06, 0.02, 0.03, 0.3, '#3E1218', 0.35, 0, 0);
  v.box(0, B1 + 0.33, -0.1, BW + 0.54, 0.06, 0.08, C.goldD);
  // a paste bucket and brush at the foot
  prism(v, 1.2, 0.13, 0.3, 0.12, 0.1, 0.26, C.tin, 8);
  prism(v, 1.2, 0.26, 0.3, 0.1, 0.1, 0.01, '#EFE9DA', 8);
  boxR(v, 1.24, 0.38, 0.3, 0.03, 0.3, 0.03, C.wood, 0, 0, -0.3);
  root.add(v.mesh());
  let list = slips || Array.from({ length: 20 }, () => ({ text: 'မာရာက ပြောတယ်…' }));
  let extra = null;
  const cnv = liveCanvas(1024, 608, (g, W, H) => {
    const r = rand(9);
    g.fillStyle = '#CFCAB9'; g.fillRect(0, 0, W, H);
    // old pasted newsprint under everything
    for (let c = 0; c < 8; c++) for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(110,104,92,${0.12 + r() * 0.08})`; g.fillRect(14 + c * 126, 12 + k * 15, 100 * (0.5 + r() * 0.5), 4); }
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.08})`; g.fillRect(r() * W, r() * H, 40 + r() * 120, 20 + r() * 60); }
    // the handbill
    g.save(); g.translate(180, 170); g.rotate(-0.02);
    g.fillStyle = 'rgba(40,30,20,0.2)'; g.fillRect(-148, -138, 300, 290);
    g.fillStyle = '#F5E6A8'; g.fillRect(-150, -142, 300, 290);
    g.fillStyle = C.maroon; g.fillRect(-150, -142, 300, 14);
    fitText(g, 'ရွှေမင်တွင်း', 0, -86, 52, 270, { color: C.ink });
    fitText(g, 'ခန်းတော့မယ်', 0, -18, 54, 270, { color: '#B8323A' });
    // a little drawn well with drops
    g.strokeStyle = C.ink; g.lineWidth = 4; g.fillStyle = '#E3B23A';
    g.beginPath(); g.ellipse(0, 70, 64, 18, 0, 0, TAU); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-64, 70); g.lineTo(-64, 110); g.moveTo(64, 70); g.lineTo(64, 110); g.stroke();
    g.beginPath(); g.ellipse(0, 110, 64, 18, 0, 0, Math.PI); g.stroke();
    g.fillStyle = 'rgba(42,33,24,0.55)'; for (let k = 0; k < 3; k++) g.fillRect(-120, 128 + k * 6, 240 - k * 60, 3);
    g.fillStyle = '#B8323A'; g.beginPath(); g.arc(0, -134, 6, 0, TAU); g.fill();
    g.restore();
    // today's day sheet
    g.save(); g.translate(470, 160); g.rotate(0.015);
    g.fillStyle = 'rgba(40,30,20,0.18)'; g.fillRect(-118, -126, 240, 266);
    g.fillStyle = '#FFFDF6'; g.fillRect(-120, -130, 240, 266);
    fitText(g, 'ယနေ့', 0, -96, 36, 200, { color: C.maroon });
    g.fillStyle = 'rgba(42,33,24,0.6)';
    for (let k = 0; k < 12; k++) for (let c = 0; c < 2; c++) g.fillRect(-104 + c * 108, -58 + k * 15, 92 * (0.6 + r() * 0.4), 4);
    g.fillStyle = '#C9A24A'; g.beginPath(); g.arc(0, -122, 6, 0, TAU); g.fill();
    g.restore();
    // the slips
    const spots = [];
    for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) spots.push([606 + col * 136, 22 + row * 98]);
    for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) if (!(row > 0 && col > 3)) spots.push([22 + col * 150, 330 + row * 92]);
    list.slice(0, spots.length).forEach((s, i) => {
      const [x, y] = spots[i];
      drawSlip(g, x + (r() - 0.5) * 18, y + (r() - 0.5) * 10, 124, 80, (r() - 0.5) * 0.16, SLIP_PAPER[i % SLIP_PAPER.length], SLIP_INK[(i * 5) % SLIP_INK.length], s.text, i);
    });
    // the clear space (bottom right): one more sheet goes here
    if (extra) {
      g.save(); g.translate(905, 470); g.rotate(-0.015);
      g.fillStyle = 'rgba(40,30,20,0.2)'; g.fillRect(-82, -104, 168, 212);
      g.fillStyle = extra.color || '#FFFDF6'; g.fillRect(-84, -108, 168, 212);
      if (extra.title) fitText(g, extra.title, 0, -70, 30, 150, { color: C.maroon });
      (extra.lines || []).forEach((l, k) => fitText(g, l, 0, -28 + k * 34, 22, 150, { color: C.ink, weight: 400 }));
      g.fillStyle = '#C8323C'; g.beginPath(); g.arc(0, -100, 6, 0, TAU); g.fill();
      g.restore();
    }
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(BW, B1 - B0), basic('#FFFFFF', { map: cnv.tex }));
  face.userData.ownMat = true;
  face.position.set(0, (B0 + B1) / 2, -0.045);
  root.add(face);
  const shadow = shadowUnder(root, 1.9, 0.45, 0, 0, 0.35);
  return {
    root,
    setSlips(l) { list = l; cnv.redraw(); },
    pin(sheet) { extra = sheet; cnv.redraw(); },
    dispose() { shadow.geometry.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// the bridge-box (a red post box)
// ---------------------------------------------------------------------------------------------
/** A red pillar post box, 0.45 x 1.1, with a slot, a little door, and an enamel plate «စာထုတ်ချိန် မနက် 6:00». */
export function bridgeBox({ plate = 'စာထုတ်ချိန် မနက် 6:00' } = {}) {
  const root = new THREE.Group();
  root.name = 'bridgeBox';
  const v = new VoxelBuilder();
  v.box(0, 0.04, 0, 0.5, 0.08, 0.5, C.stoneD);
  prism(v, 0, 0.12, 0, 0.215, 0.225, 0.08, C.postRedD, 8);
  prism(v, 0, 0.5, 0, 0.2, 0.2, 0.68, C.postRed, 8);
  prism(v, 0, 0.86, 0, 0.205, 0.205, 0.04, C.postRedD, 8);
  prism(v, 0, 0.9, 0, 0.24, 0.24, 0.05, C.postRed, 8);
  prism(v, 0, 0.96, 0, 0.2, 0.235, 0.07, C.postRed, 8);
  prism(v, 0, 1.02, 0, 0.12, 0.19, 0.05, C.postRedD, 8);
  prism(v, 0, 1.06, 0, 0.04, 0.1, 0.04, C.postRed, 8);
  prism(v, 0, 1.09, 0, 0.03, 0.03, 0.03, C.gold, 8);
  const fz = 0.2 * Math.cos(Math.PI / 8);
  // the slot with a lip
  v.box(0, 0.79, fz + 0.012, 0.2, 0.035, 0.02, '#1A1210');
  v.box(0, 0.815, fz + 0.03, 0.24, 0.02, 0.05, C.postRedD);
  // the collection door outline, hinge side, a gold keyhole
  v.box(0, 0.32, fz + 0.006, 0.17, 0.012, 0.012, C.postRedD);
  v.box(0, 0.66, fz + 0.006, 0.17, 0.012, 0.012, C.postRedD);
  for (const s of [-1, 1]) v.box(s * 0.08, 0.49, fz + 0.006, 0.012, 0.35, 0.012, C.postRedD);
  v.box(0.05, 0.4, fz + 0.012, 0.025, 0.035, 0.01, C.gold);
  // a gold envelope emblem on the cap band
  v.box(0, 0.9, 0.24 * Math.cos(Math.PI / 8) + 0.006, 0.1, 0.035, 0.008, C.gold);
  v.box(0, 0.9, 0.24 * Math.cos(Math.PI / 8) + 0.012, 0.03, 0.02, 0.006, C.postRedD);
  root.add(v.mesh());
  const pl = liveCanvas(256, 160, (g, W, H) => {
    g.fillStyle = '#F4F1E8'; roundRect(g, 4, 4, W - 8, H - 8, 16); g.fill();
    g.strokeStyle = '#2F5DB3'; g.lineWidth = 7; roundRect(g, 10, 10, W - 20, H - 20, 12); g.stroke();
    const [a, b] = plate.includes('မနက်') ? [plate.slice(0, plate.indexOf('မနက်')).trim(), plate.slice(plate.indexOf('မနက်'))] : [plate, ''];
    fitText(g, a, W / 2, H * 0.36, 34, W - 40, { color: '#2F5DB3' });
    if (b) fitText(g, b, W / 2, H * 0.7, 36, W - 40, { color: C.ink });
  });
  const pm = signPlane(pl.tex, 0.17, 0.106, { transparent: true });
  pm.position.set(0, 0.55, fz + 0.016);
  root.add(pm);
  const shadow = shadowUnder(root, 0.32, 0.32, 0, 0, 0.45);
  return { root, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// Daw Sein's tea cart
// ---------------------------------------------------------------------------------------------
function stoolInto(v, x, z, ry = 0, col = C.woodL) {
  v.box(x, 0.24, z, 0.3, 0.035, 0.3, col, ry);
  const cs = Math.cos(ry), sn = Math.sin(ry);
  for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) v.box(x + (a * 0.12) * cs + (b * 0.12) * sn, 0.11, z - (a * 0.12) * sn + (b * 0.12) * cs, 0.035, 0.22, 0.035, C.woodD, ry);
  v.box(x, 0.07, z, 0.26, 0.02, 0.02, C.woodD, ry);
}
/**
 * Daw Sein's tea cart, 1.6 x 1.1: a maroon-panelled wooden cart on two spoked wheels with shafts and a
 * prop leg, a charcoal brazier with a kettle (steam), a tray of tea glasses, a rail along the front with
 * ink jars hung on it (setJars 0..4; too heavy to push now), four low stools.
 */
export function teaCart({ jars = 4 } = {}) {
  const root = new THREE.Group();
  root.name = 'teaCart';
  const v = new VoxelBuilder();
  const L = 1.2, Dp = 0.6, Y = 0.72;
  // wheels on both sides (face +Z / -Z)
  for (const s of [-1, 1]) {
    const z = s * (Dp / 2 + 0.06);
    ring(v, 0, 0.36, z, 0.33, 0.06, C.woodD, 14, 'z', 0.06);
    ring(v, 0, 0.36, z, 0.355, 0.02, C.iron, 14, 'z', 0.065);
    for (let k = 0; k < 8; k++) boxR(v, Math.cos((k / 8) * Math.PI) * 0.16, 0.36 + Math.sin((k / 8) * Math.PI) * 0.16, z, 0.025, 0.32, 0.025, C.wood, 0, 0, (k / 8) * Math.PI - Math.PI / 2);
    prism(v, 0, 0.36, z + s * 0.02, 0.06, 0.06, 0.1, C.woodD, 8, Math.PI / 2, 0, 0);
  }
  prism(v, 0, 0.36, 0, 0.025, 0.025, Dp + 0.2, C.iron, 6, Math.PI / 2, 0, 0); // axle
  // body: a tray box with maroon panels and a gold line
  v.box(0, Y - 0.03, 0, L, 0.06, Dp, C.woodD);
  for (const s of [-1, 1]) {
    v.box(0, Y + 0.09, s * (Dp / 2 - 0.02), L, 0.18, 0.04, C.wood);
    v.box(0, Y + 0.09, s * (Dp / 2 + 0.002), L - 0.12, 0.12, 0.01, C.maroon);
    v.box(0, Y + 0.09, s * (Dp / 2 + 0.008), L - 0.16, 0.012, 0.005, C.gold);
    v.box(s * (L / 2 - 0.02), Y + 0.09, 0, 0.04, 0.18, Dp, C.wood);
  }
  v.box(0, Y - 0.12, 0, L - 0.1, 0.03, Dp - 0.1, C.woodGD); // shelf below
  for (let k = 0; k < 3; k++) v.box(-0.3 + k * 0.25, Y - 0.06, -0.05, 0.18, 0.08, 0.3, jitter('#D9C8A2', 0.05, k)); // stacked saucers / tins
  // shafts toward -X resting on the ground, a prop leg at +X
  for (const z of [-0.22, 0.22]) {
    beam(v, -L / 2 + 0.1, Y - 0.04, z, -L / 2 - 0.75, 0.06, z * 1.2, 0.05, C.woodD);
    v.box(-L / 2 - 0.75, 0.04, z * 1.2, 0.08, 0.08, 0.08, C.woodD);
    v.box(L / 2 - 0.12, (Y - 0.06) / 2, z, 0.05, Y - 0.06, 0.05, C.woodD);
  }
  // the brazier and kettle
  prism(v, -0.32, Y + 0.1, 0, 0.14, 0.11, 0.2, C.terra, 8);
  prism(v, -0.32, Y + 0.205, 0, 0.15, 0.15, 0.02, C.terraD, 8);
  for (let k = 0; k < 4; k++) v.box(-0.36 + (k % 2) * 0.07, Y + 0.215, -0.04 + Math.floor(k / 2) * 0.07, 0.05, 0.03, 0.05, k % 2 ? '#E8742C' : '#C8402A');
  prism(v, -0.32, Y + 0.3, 0, 0.12, 0.13, 0.16, '#B8BCB8', 8);
  prism(v, -0.32, Y + 0.39, 0, 0.07, 0.11, 0.04, '#9EA3A0', 8);
  prism(v, -0.32, Y + 0.42, 0, 0.025, 0.025, 0.03, C.ink, 8);
  boxR(v, -0.18, Y + 0.34, 0, 0.14, 0.03, 0.03, '#9EA3A0', 0, 0, 0.55); // spout
  for (const s of [-1, 1]) v.box(-0.32 + s * 0.08, Y + 0.46, 0, 0.02, 0.1, 0.02, C.ink);
  v.box(-0.32, Y + 0.51, 0, 0.18, 0.02, 0.02, C.ink);
  // tray of glasses, a tin of leaves, a folded cloth
  v.box(0.18, Y + 0.02, 0, 0.42, 0.02, 0.32, C.tin);
  for (let i = 0; i < 6; i++) {
    const gx = 0.04 + (i % 3) * 0.13, gz = -0.07 + Math.floor(i / 3) * 0.14;
    prism(v, gx, Y + 0.075, gz, 0.035, 0.03, 0.09, i === 4 ? '#E9EEF0' : '#C98A3A', 8);
    prism(v, gx, Y + 0.124, gz, 0.037, 0.037, 0.01, '#E9EEF0', 8);
  }
  prism(v, 0.48, Y + 0.08, -0.15, 0.06, 0.06, 0.13, C.teal, 8);
  v.box(0.47, Y + 0.025, 0.14, 0.18, 0.03, 0.14, '#F2E9D6');
  // the rail along the front for hanging jars
  for (const x of [-0.5, 0.5]) v.box(x, Y + 0.4, Dp / 2 + 0.1, 0.04, 0.42, 0.04, C.woodD);
  v.box(0, Y + 0.6, Dp / 2 + 0.1, 1.08, 0.04, 0.04, C.wood);
  // four stools
  stoolInto(v, 0.95, 0.75, 0.2);
  stoolInto(v, 0.3, 0.95, -0.1, C.wood);
  stoolInto(v, -0.45, 0.9, 0.3);
  stoolInto(v, 1.15, -0.2, 0.5, C.wood);
  root.add(v.mesh());
  let jarMesh = null;
  function setJars(n) {
    freeMesh(jarMesh);
    jarMesh = null;
    if (!n) return;
    const jv = new VoxelBuilder();
    for (let i = 0; i < Math.min(4, n); i++) {
      const x = -0.36 + i * 0.24;
      jv.box(x, Y + 0.52, Dp / 2 + 0.1, 0.012, 0.14, 0.012, C.rope);
      jarInto(jv, x, Y + 0.18, Dp / 2 + 0.1, true, 0.85);
    }
    jarMesh = jv.mesh({ px: 1.2 });
    root.add(jarMesh);
  }
  setJars(jars);
  const steam = new Puffs(5, '#F4F1EA', 0.5);
  root.add(steam.mesh);
  const shadow = shadowUnder(root, 1.2, 0.8, 0.1, 0.2, 0.4);
  return {
    root, setJars,
    update(dt, t) {
      for (let i = 0; i < 5; i++) {
        const s = (t * 0.5 + i / 5) % 1;
        steam.set(i, -0.1 + s * 0.08 + Math.sin(t * 2 + i) * 0.02, Y + 0.4 + s * 0.55, Math.sin(i * 1.7) * 0.03, 0.03 + s * 0.07);
      }
      steam.commit();
    },
    dispose() { shadow.geometry.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// Ko Min's step ladder
// ---------------------------------------------------------------------------------------------
/** A low wooden step ladder (0.6 x 1.4) splashed with paint; a jar of ink on the top step, a brush across. */
export function stepLadder({ jar = true } = {}) {
  const root = new THREE.Group();
  root.name = 'stepLadder';
  const v = new VoxelBuilder();
  const H = 1.4;
  for (const s of [-1, 1]) {
    beam(v, s * 0.28, 0, 0.32, s * 0.24, H, -0.02, 0.06, C.woodL, 0.05);
    beam(v, s * 0.27, 0, -0.42, s * 0.24, H - 0.05, -0.08, 0.05, C.wood, 0.04);
  }
  for (let k = 1; k <= 4; k++) {
    const t = k / 5, y = t * H, z = 0.32 - t * 0.34;
    v.box(0, y, z - 0.03, 0.5 - t * 0.06, 0.035, 0.14, jitter(C.woodL, 0.05, k));
    if (k % 2) v.box(-0.1 + k * 0.03, y + 0.019, z - 0.01, 0.06, 0.004, 0.05, [C.maroon, C.gold, C.teal, '#2F5DB3'][k % 4]); // paint drops
  }
  v.box(0, H + 0.02, -0.05, 0.56, 0.05, 0.24, C.woodL);
  beam(v, -0.25, 0.55, 0.15, -0.25, 0.55, -0.32, 0.015, C.rope);
  beam(v, 0.25, 0.55, 0.15, 0.25, 0.55, -0.32, 0.015, C.rope);
  for (const [x, z, c] of [[0.1, 0.25, C.maroon], [-0.15, 0.4, C.gold], [0.3, -0.2, C.teal]]) v.box(x, 0.003, z, 0.08, 0.004, 0.06, c);
  if (jar) {
    jarInto(v, -0.12, H + 0.045, -0.05, true, 0.8);
    boxR(v, 0.13, H + 0.07, -0.02, 0.26, 0.02, 0.02, C.wood, 0, 0.4, 0);
    boxR(v, 0.25, H + 0.07, -0.07, 0.05, 0.03, 0.03, C.inkGold, 0, 0.4, 0);
  }
  v.box(0.3, 1.0, 0.12, 0.02, 0.24, 0.1, '#D9CBB0'); // a rag over a rail
  root.add(v.mesh());
  const shadow = shadowUnder(root, 0.45, 0.5, 0, -0.05, 0.4);
  return { root, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// the printing shed (Gold Ink Press), outside
// ---------------------------------------------------------------------------------------------
/** A little wooden easel holding a chalk slate (props2 chalkSlate); origin at its feet. */
export function doorEasel({ text = ['မနက်ဖွင့်ချိန် အရင်ရောက်သူ', 'စာစီသင်ရမယ်'] } = {}) {
  const root = new THREE.Group();
  root.name = 'doorEasel';
  const v = new VoxelBuilder();
  for (const s of [-1, 1]) beam(v, s * 0.26, 0, 0.12, s * 0.16, 1.05, -0.02, 0.04, C.woodL);
  beam(v, 0, 0, -0.38, 0, 1.0, -0.05, 0.04, C.wood);
  v.box(0, 0.52, 0.07, 0.6, 0.04, 0.09, C.woodL);
  v.box(0, 0.55, 0.11, 0.6, 0.04, 0.02, C.woodD);
  root.add(v.mesh({ px: 1.3 }));
  const slate = chalkSlate({ w: 0.56, h: 0.4, text, lean: 0 });
  slate.root.position.set(0, 0.54, 0.06);
  slate.root.rotation.x = -0.12;
  root.add(slate.root);
  const shadow = shadowUnder(root, 0.36, 0.3, 0, -0.1, 0.35);
  return { root, slate, dispose() { slate.dispose(); shadow.geometry.dispose(); disposeTree(root); } };
}

/**
 * The Gold Ink Press from the street, 6.5 x 5: a brick front with an ink-black door frame and wide plank
 * double doors (setDoors 1 = propped open), the press and hanging sheets dark inside, black-and-gold sign
 * «ရွှေမင် ပုံနှိပ်တိုက်», small-paned windows, cream plaster sides with brick quoins, a maroon roof,
 * a brick chimney with thin grey smoke, a side door in the west wall, paper bales, a crate of empty jars,
 * and the chalk slate on its easel left of the door. door / sideDoor are local trigger points.
 */
export function printShed({ doors = 1, slate = true } = {}) {
  const root = new THREE.Group();
  root.name = 'printShed';
  const W = 6.5, D = 5, H = 3.8, F = 0.12, OW = 2.4, OH = 2.5;
  const v = new VoxelBuilder();
  const fz = D / 2;
  v.boxMin(-W / 2 - 0.1, 0, -D / 2 - 0.1, W / 2 + 0.1, F, D / 2 + 0.25, C.stoneD);
  // inside (seen through the door): dark floor and walls, the press, sheets on a line, type cases
  // floor: ink-dark planks deepening toward the back, a stepped wedge of daylight in from the door
  for (let i = 0; i < 10; i++) {
    const z0 = -D / 2 + 0.2 + i * ((D - 0.4) / 10), z1 = z0 + (D - 0.4) / 10 - 0.012;
    v.boxMin(-W / 2 + 0.2, F, z0, W / 2 - 0.2, F + 0.02, z1, mixHex('#1E1814', '#4E3E30', i / 9));
  }
  for (let k = 0; k < 4; k++) {
    const w = OW * (0.98 - k * 0.17), z1 = fz - 0.14 - k * 0.45;
    v.boxMin(-w / 2, F + 0.021 + k * 0.001, z1 - 0.45, w / 2, F + 0.022 + k * 0.001, z1, ['#A88E6A', '#937A5A', '#7C674C', '#66553F'][k]);
  }
  v.box(0.55, F + 0.024, fz - 1.1, 0.5, 0.004, 0.3, '#1A1614'); // an old ink spill in the light
  v.boxMin(-W / 2 + 0.2, F, -D / 2 + 0.2, W / 2 - 0.2, H, -D / 2 + 0.3, '#221C18');
  for (const s of [-1, 1]) v.boxMin(s * (W / 2 - 0.3), F, -D / 2 + 0.2, s * (W / 2 - 0.2), H, fz - 0.2, '#1E1916');
  v.boxMin(-W / 2 + 0.2, H - 0.1, -D / 2 + 0.2, W / 2 - 0.2, H, fz - 0.2, '#181411');
  for (const s of [-1, 1]) v.boxMin(s * (OW / 2) - 0.13, F, fz - 0.55, s * (OW / 2) + 0.13, F + OH, fz - 0.15, '#16120F'); // jamb shade
  v.boxMin(-OW / 2 - 0.12, F + OH - 0.36, fz - 0.6, OW / 2 + 0.12, F + OH + 0.1, fz - 0.15, '#110E0C'); // lintel shadow
  // the hand press, a black iron silhouette in the middle distance: two cheeks, the head, the screw and
  // bar (its brass ball catches the lamp), the bed with a white sheet on the tympan
  const PX = 0.35, PZ = -0.9;
  for (const s of [-1, 1]) {
    v.box(PX + s * 0.42, F + 0.85, PZ, 0.12, 1.7, 0.36, '#1F1F23');
    v.box(PX + s * 0.42, F + 0.05, PZ, 0.24, 0.1, 0.6, '#18181B');
  }
  v.box(PX, F + 1.62, PZ, 0.98, 0.22, 0.4, '#25252A');
  v.box(PX, F + 1.8, PZ, 0.3, 0.14, 0.3, '#2E2E33');
  v.box(PX, F + 1.4, PZ, 0.08, 0.36, 0.08, '#3A3A40');
  beam(v, PX, F + 1.3, PZ, PX + 0.7, F + 1.5, PZ + 0.5, 0.05, '#3A3A40');
  v.box(PX + 0.72, F + 1.51, PZ + 0.52, 0.1, 0.1, 0.1, C.brass);
  v.box(PX, F + 1.2, PZ, 0.62, 0.08, 0.42, '#2A2A2F'); // platen
  v.box(PX, F + 0.8, PZ + 0.15, 0.7, 0.06, 1.1, '#2C2C31'); // bed and rails
  v.box(PX, F + 0.84, PZ + 0.35, 0.46, 0.012, 0.34, '#E9E2CE'); // a sheet on the tympan
  // type-case rack on the left: a dark frame of shallow drawers, brass label dots
  v.box(-1.75, F + 0.55, -D / 2 + 0.55, 1.4, 1.1, 0.5, '#2C221B');
  for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
    v.box(-2.25 + c * 0.33, F + 0.18 + r * 0.2, -D / 2 + 0.81, 0.3, 0.16, 0.02, jitter('#4A382A', 0.06, r * 4 + c));
    v.box(-2.25 + c * 0.33, F + 0.2 + r * 0.2, -D / 2 + 0.825, 0.06, 0.03, 0.01, C.brass);
  }
  boxR(v, -1.75, F + 1.18, -D / 2 + 0.5, 1.4, 0.05, 0.6, '#3A2C22', 0.35, 0, 0); // the sloped case top
  for (let k = 0; k < 3; k++) v.box(-2.05 + k * 0.35, F + 1.75 + k * 0.03, -D / 2 + 0.32, 0.26, 0.5, 0.18, jitter('#3A2C22', 0.08, k + 40)); // shelf boxes
  v.box(-1.75, F + 1.5, -D / 2 + 0.32, 1.5, 0.04, 0.3, '#2C221B');
  // a delivery table on the right with paper stacks, a roller rack on the wall
  v.box(1.85, F + 0.42, -0.4, 1.1, 0.84, 0.6, '#2A2019');
  v.box(1.85, F + 0.86, -0.4, 1.16, 0.05, 0.66, '#3E2E22');
  for (let k = 0; k < 3; k++) v.box(1.55 + k * 0.3, F + 0.92 + (k % 2) * 0.03, -0.4, 0.24, 0.06 + (k % 2) * 0.06, 0.34, jitter('#D9D2BE', 0.04, k));
  for (let k = 0; k < 3; k++) prism(v, W / 2 - 0.38, F + 1.4 + k * 0.22, -1.2, 0.05, 0.05, 0.5, '#2A2A2E', 8, Math.PI / 2);
  // the drying line high at the back (sheets above the press, kept clear of the doorway view)
  v.box(0, F + 2.55, -1.6, W - 1.2, 0.015, 0.015, '#4A3E34');
  for (let k = 0; k < 8; k++) {
    v.box(-2.3 + k * 0.62, F + 2.3, -1.6, 0.42, 0.48, 0.01, jitter(k === 5 ? '#CFC7B2' : '#B9B19C', 0.04, k));
    for (let l = 0; l < 4; l++) v.box(-2.3 + k * 0.62, F + 2.42 - l * 0.08, -1.594, 0.32 - (l === 3 ? 0.12 : 0), 0.018, 0.004, '#57524A');
  }
  // a hanging lamp over the press (a warm pane; no glow, it is only a lamp in a shed)
  v.box(PX - 0.1, H - 0.35, PZ + 0.2, 0.015, 0.6, 0.015, '#3A3A40');
  boxR(v, PX - 0.1, H - 0.68, PZ + 0.2, 0.42, 0.1, 0.42, '#2E3A34', 0, 0.3, 0);
  v.box(PX - 0.1, H - 0.78, PZ + 0.2, 0.2, 0.08, 0.2, '#FFD27A');
  // brick front with openings: the door, two windows
  const win = [[-2.15, F + 1.55, 1.0, 1.05], [2.15, F + 1.55, 1.0, 1.05]];
  const holes = [[-OW / 2 - 0.12, OW / 2 + 0.12, F, F + OH + 0.12], ...win.map(([x, y, w, h]) => [x - w / 2 - 0.06, x + w / 2 + 0.06, y - h / 2 - 0.06, y + h / 2 + 0.06])];
  const inHole = (x0, x1, y) => holes.some(([a, b, c, d]) => x1 > a && x0 < b && y > c && y < d);
  v.boxMin(-W / 2, F, fz - 0.14, -OW / 2 - 0.12, H, fz - 0.06, C.mortar);
  v.boxMin(OW / 2 + 0.12, F, fz - 0.14, W / 2, H, fz - 0.06, C.mortar);
  v.boxMin(-OW / 2 - 0.12, F + OH + 0.12, fz - 0.14, OW / 2 + 0.12, H, fz - 0.06, C.mortar);
  const BH = 0.13, BWk = 0.3;
  let row = 0;
  for (let y = F + BH / 2; y < H; y += BH, row++) {
    const off = row % 2 ? BWk / 2 : 0;
    for (let x = -W / 2 - off; x < W / 2; x += BWk) {
      const x0 = Math.max(-W / 2, x + 0.008), x1 = Math.min(W / 2, x + BWk - 0.008);
      if (x1 - x0 < 0.04 || inHole(x0, x1, y)) continue;
      v.box((x0 + x1) / 2, y, fz - 0.03, x1 - x0, BH - 0.016, 0.08, jitter([C.brick, C.brickL, C.brickD][(row * 7 + Math.round(x * 10)) % 3], 0.05, row * 31 + x * 17));
    }
  }
  // brick lintels over the windows, sills with ink stains, small panes
  for (const [x, y, w, h] of win) {
    for (let k = 0; k < 7; k++) v.box(x - w / 2 - 0.03 + (k + 0.5) * ((w + 0.06) / 7), y + h / 2 + 0.12, fz + 0.02, (w + 0.06) / 7 - 0.012, 0.2, 0.1, C.brickD);
    v.box(x, y - h / 2 - 0.06, fz + 0.06, w + 0.2, 0.08, 0.2, C.stoneL);
    v.box(x + 0.2, y - h / 2 - 0.015, fz + 0.1, 0.12, 0.004, 0.08, C.soot);
    v.box(x, y, fz - 0.06, w, h, 0.04, '#2E2A28');
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) v.box(x - w / 3 + i * (w / 3), y - h / 3 + j * (h / 3), fz - 0.03, w / 3 - 0.05, h / 3 - 0.05, 0.02, (i + j) % 3 ? '#9FB4BC' : '#C2D3D8');
    for (let i = 1; i < 3; i++) { v.box(x - w / 2 + (i * w) / 3, y, fz - 0.015, 0.04, h, 0.03, C.woodD); v.box(x, y - h / 2 + (i * h) / 3, fz - 0.015, w, 0.04, 0.03, C.woodD); }
    v.box(x, y, fz - 0.02, w + 0.08, h + 0.08, 0.02, C.woodD);
  }
  win.forEach(([x, y], i) => { if (i === 1) v.box(x - 0.15, y - 0.3, fz - 0.07, 0.4, 0.2, 0.02, '#E9E2CE'); }); // paper stacked inside
  // the ink-black door frame with a thin gold line
  for (const s of [-1, 1]) {
    v.box(s * (OW / 2 + 0.06), F + OH / 2, fz + 0.04, 0.16, OH, 0.18, '#1E1A18');
    v.box(s * (OW / 2 - 0.005), F + OH / 2, fz + 0.12, 0.02, OH - 0.1, 0.02, C.gold);
  }
  v.box(0, F + OH + 0.08, fz + 0.04, OW + 0.28, 0.16, 0.18, '#1E1A18');
  v.box(0, F + OH - 0.005, fz + 0.12, OW - 0.02, 0.02, 0.02, C.gold);
  v.box(0, F + 0.01, fz + 0.1, OW + 0.3, 0.03, 0.4, C.stoneL); // step
  // the black sign board above the door
  v.box(0, F + OH + 0.48, fz + 0.06, 3.1, 0.6, 0.08, '#1E1A18');
  v.box(0, F + OH + 0.48, fz + 0.085, 3.0, 0.5, 0.02, C.goldD);
  // cornice and parapet line
  v.box(0, H - 0.06, fz + 0.02, W + 0.2, 0.1, 0.24, C.stoneL); // kept under the eaves (it used to poke through the tiles)
  v.box(0, H - 0.15, fz + 0.01, W + 0.1, 0.06, 0.16, C.brickD);
  // sides and back: cream plaster with brick quoins at the corners
  for (const s of [-1, 1]) {
    v.box(s * (W / 2 - 0.05), (F + H) / 2, 0, 0.1, H - F, D - 0.1, '#E6E1D3');
    for (let k = 0; k < 15; k++) for (const z of [fz - 0.2, -D / 2 + 0.2]) v.box(s * (W / 2 + 0.005), F + 0.13 + k * 0.25, z + (k % 2 ? 0 : z > 0 ? -0.08 : 0.08), 0.03, 0.12, k % 2 ? 0.3 : 0.45, C.brick);
  }
  v.box(0, (F + H) / 2, -D / 2 + 0.05, W, H - F, 0.1, '#E2DCCC');
  // west side door with a step, a small lamp
  v.box(-W / 2 - 0.01, F + 1.0, -0.6, 0.06, 2.0, 0.95, C.woodD);
  for (let k = 0; k < 4; k++) v.box(-W / 2 - 0.04, F + 1.0, -0.95 + k * 0.23, 0.02, 1.9, 0.21, jitter(C.wood, 0.06, k));
  v.box(-W / 2 - 0.06, F + 1.0, -0.25, 0.03, 0.06, 0.06, C.gold);
  v.box(-W / 2 - 0.25, 0.08, -0.6, 0.4, 0.16, 1.0, C.stoneL);
  // gable roof (ridge along X), maroon, gable ends in plaster
  gableEnds(v, W, D, H, 1.4, '#E2DCCC');
  gableRoof(v, W, D, H, 1.4, C.maroon, 0.3, 0, { seed: 9, moss: 0.4, soot: [2.2, -1.2, 1.1], tones: [C.maroon, '#9A3A44', C.maroonD] });
  // the chimney at the back right
  v.box(2.2, H + 1.3, -1.4, 0.55, 2.6, 0.55, C.brick);
  for (let k = 0; k < 9; k++) v.box(2.2, H + 0.2 + k * 0.28, -1.4 + 0.278, 0.56, 0.02, 0.004, C.mortar);
  v.box(2.2, H + 2.65, -1.4, 0.68, 0.12, 0.68, C.brickD);
  v.box(2.2, H + 2.72, -1.4, 0.4, 0.04, 0.4, C.soot);
  // a gutter and a downpipe
  v.box(W / 2 + 0.05, (F + H) / 2, fz + 0.12, 0.08, H - F, 0.08, C.iron);
  v.box(W / 2 + 0.05, 0.16, fz + 0.22, 0.14, 0.06, 0.2, C.iron);
  // paper bales tied with twine (right of the door), a crate of empty ink jars
  for (const [x, z, y, s] of [[1.65, fz + 0.55, 0, 0], [2.15, fz + 0.5, 0, 1], [1.9, fz + 0.52, 0.32, 2]]) {
    v.box(x, F + 0.16 + y, z, 0.46, 0.32, 0.38, jitter('#EFE9DA', 0.03, s));
    for (let k = 0; k < 4; k++) v.box(x, F + 0.05 + y + k * 0.075, z + 0.192, 0.46, 0.008, 0.004, '#C9C2B0');
    v.box(x, F + 0.16 + y, z, 0.47, 0.33, 0.03, '#B89C6E');
  }
  v.box(2.7, F + 0.15, fz + 0.55, 0.5, 0.3, 0.38, C.woodG);
  for (let k = 0; k < 3; k++) v.box(2.7, F + 0.06 + k * 0.1, fz + 0.745, 0.5, 0.04, 0.01, C.woodGD);
  for (let i = 0; i < 4; i++) jarInto(v, 2.55 + (i % 2) * 0.3, F + 0.3, fz + 0.48 + Math.floor(i / 2) * 0.15, false, 0.6);
  // the wedge bricks that hold the leaves open (they stay on the step when the doors shut)
  for (const s of [-1, 1]) v.box(s * (OW / 2 + 0.55), F + 0.06, fz + 0.32, 0.22, 0.1, 0.1, C.brickD, 0.3 * s);
  // the chalk slate's easel left of the door, built into the shell (one draw call); its face is in the sign atlas
  const one = new THREE.Vector3(1, 1, 1);
  const eM = new THREE.Matrix4().compose(new THREE.Vector3(-1.85, F, fz + 0.75), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.12, 0)), one);
  const sM = eM.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(0, 0.54, 0.06), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.12, 0, 0)), one));
  const SW = 0.56, SH = 0.4, SF = 0.035, ST = 0.03;
  if (slate) {
    const ev = new VoxelBuilder();
    for (const s of [-1, 1]) beam(ev, s * 0.26, 0, 0.12, s * 0.16, 1.05, -0.02, 0.04, C.woodL);
    beam(ev, 0, 0, -0.38, 0, 1.0, -0.05, 0.04, C.wood);
    ev.box(0, 0.52, 0.07, 0.6, 0.04, 0.09, C.woodL);
    ev.box(0, 0.55, 0.11, 0.6, 0.04, 0.02, C.woodD);
    ev.box(0.18, 0.565, 0.1, 0.06, 0.02, 0.02, '#F4F1E8'); // a stub of chalk on the ledge
    v.merge(ev, eM);
    const sv = new VoxelBuilder();
    sv.box(0, SH / 2, 0, SW, SH, ST * 0.6, C.chalk);
    sv.box(0, SF / 2, 0, SW + SF * 0.4, SF, ST, C.woodL);
    sv.box(0, SH - SF / 2, 0, SW + SF * 0.4, SF, ST, C.woodL);
    for (const sx of [-1, 1]) sv.box(sx * (SW / 2 - SF / 2 + SF * 0.2), SH / 2, 0, SF, SH, ST, jitter(C.woodL, 0.05, sx));
    v.merge(sv, sM);
  }
  root.add(v.mesh());
  // one atlas for the sign (gold on black) and the slate's chalk face: one draw call for both
  let chalk = ['မနက်ဖွင့်ချိန် အရင်ရောက်သူ', 'စာစီသင်ရမယ်'];
  const atlas = liveCanvas(1024, 512, (g) => {
    g.clearRect(0, 0, 1024, 512);
    g.fillStyle = '#1E1A18'; g.fillRect(0, 0, 768, 128);
    g.strokeStyle = '#C9A24A'; g.lineWidth = 4; g.strokeRect(10, 10, 748, 108);
    fitText(g, 'ရွှေမင် ပုံနှိပ်တိုက်', 384, 128 * 0.42, 54, 688, { color: '#E9C76A' });
    fitText(g, 'GOLD INK PRESS', 384, 128 * 0.8, 20, 568, { weight: 600, font: FONT_SANS, color: '#C9A24A' });
    drawChalkCell(g, 0, 132, 512, 326, chalk, 7);
  });
  const sq = new Quads(1024, 512);
  sq.add(0, F + OH + 0.48, fz + 0.1, 2.94, 0.49, [0, 0, 768, 128]);
  if (slate) {
    const fM = sM.clone().multiply(new THREE.Matrix4().makeTranslation(0, SH / 2, ST * 0.3 + 0.003));
    const fp = new THREE.Vector3(), fq = new THREE.Quaternion();
    fM.decompose(fp, fq, new THREE.Vector3());
    const fe = new THREE.Euler().setFromQuaternion(fq, 'YXZ');
    sq.add(fp.x, fp.y, fp.z, SW - SF * 1.6, SH - SF * 2, [0, 132, 512, 326], fe.x, fe.y, fe.z);
  }
  root.add(sq.mesh(atlas.tex));
  const slateH = slate ? { root: null, setChalk(lines) { chalk = Array.isArray(lines) ? lines : String(lines ?? '').split('\n'); atlas.redraw(); } } : null;
  // the double doors: both leaves in ONE mesh; setDoors swings their vertices about the two hinges in place
  const lv = new VoxelBuilder();
  const HZ = fz + 0.14;
  for (const s of [-1, 1]) {
    const LW = OW / 2 - 0.01, dx = -s, hx = s * OW / 2, y0 = F + 0.02;
    for (let i = 0; i < 4; i++) lv.box(hx + dx * (LW * (i + 0.5)) / 4, y0 + OH / 2 - 0.02, HZ, LW / 4 - 0.012, OH - 0.06, 0.06, jitter('#5E4430', 0.08, i + s * 4));
    for (const y of [0.35, OH / 2, OH - 0.35]) lv.box(hx + dx * LW / 2, y0 + y, HZ + 0.04, LW - 0.06, 0.08, 0.03, '#4A3424');
    for (const y of [0.35, OH - 0.35]) lv.box(hx + dx * 0.22, y0 + y, HZ + 0.06, 0.38, 0.05, 0.012, C.iron);
    lv.box(hx + dx * (LW - 0.15), y0 + OH / 2 - 0.1, HZ + 0.07, 0.03, 0.2, 0.03, C.gold);
    for (let k = 0; k < 3; k++) lv.box(hx + dx * (0.3 + k * 0.28), y0 + 0.12 + (k % 2) * 0.05, HZ + 0.035, 0.12, 0.08, 0.004, '#3A2A1E'); // scuffs at the foot
  }
  const leaves = lv.mesh();
  root.add(leaves);
  const lgeos = [leaves.geometry, leaves.children[0].geometry];
  const big = new THREE.Sphere(new THREE.Vector3(0, F + OH / 2, fz), 3.2);
  lgeos.forEach((g) => { g.boundingSphere = big.clone(); });
  const lrest = lgeos.map((g) => [g.attributes.position.array.slice(), g.attributes.normal.array.slice()]);
  function setDoors(t) {
    const e = smooth(t);
    lgeos.forEach((g, gi) => {
      const P0 = lrest[gi][0], N0 = lrest[gi][1], pa = g.attributes.position.array, na = g.attributes.normal.array;
      for (let i = 0; i < pa.length; i += 3) {
        const s = P0[i] > 0 ? 1 : -1, th = s * e * (Math.PI - 0.14), c = Math.cos(th), sn = Math.sin(th);
        const x = P0[i] - s * OW / 2, z = P0[i + 2] - HZ;
        pa[i] = s * OW / 2 + x * c + z * sn;
        pa[i + 1] = P0[i + 1];
        pa[i + 2] = HZ - x * sn + z * c;
        const nx = N0[i], nz = N0[i + 2];
        na[i] = nx * c + nz * sn;
        na[i + 2] = -nx * sn + nz * c;
      }
      g.attributes.position.needsUpdate = true;
      g.attributes.normal.needsUpdate = true;
    });
  }
  setDoors(doors);
  const smoke = new Puffs(7, '#A8A49A', 0.45);
  root.add(smoke.mesh);
  const shadow = shadowUnder(root, W / 2 + 0.5, D / 2 + 0.6, 0, 0.2, 0.4);
  return {
    root, setDoors, slate: slateH,
    door: new THREE.Vector3(0, 0, fz + 1.1), sideDoor: new THREE.Vector3(-W / 2 - 0.9, 0, -0.6),
    update(dt, t) {
      for (let i = 0; i < 7; i++) {
        const s = (t * 0.22 + i / 7) % 1;
        smoke.set(i, 2.2 + s * 0.6 + Math.sin(t + i) * 0.08, H + 2.8 + s * 2.2, -1.4 - s * 0.3, 0.14 + s * 0.4);
      }
      smoke.commit();
    },
    dispose() { shadow.geometry.dispose(); disposeTree(root); },
  };
}

// =============================================================================================
// ADDED: ropeRack (Wharf, weigh-house inside wall) and slateGust (the Day 6 noon gust at the bridge board)
// =============================================================================================

/**
 * A rope coil hanging from a peg at (x, y): five thin loops seen from the front, each made of many short
 * pieces with dark diagonal lay marks (so it reads as twisted rope, not stacked blocks), a lashing of thin
 * cord wrapped round the bundle at the bottom and at the peg, and a hanging whipped tail.
 */
function coilInto(v, x, y, z, r, col, colD, seed) {
  const loops = 5, n = 18, T = 0.03;
  const lay = mixHex(colD, '#1E1510', 0.35);
  for (let k = 0; k < loops; k++) {
    // each loop an oval that hangs a little lower and swings a little wider than the one behind it
    const rx = r * (0.9 + k * 0.04), ry = r * (1.1 + k * 0.05), cx = x + (k - loops / 2) * 0.014 * (seed % 2 ? 1 : -1);
    const cy = y - ry - 0.005, cz = z + 0.025 + k * 0.024;
    const col0 = jitter(k % 2 ? colD : col, 0.05, seed * 7 + k);
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, am = (a0 + a1) / 2;
      const px0 = cx + Math.sin(a0) * rx, py0 = cy + Math.cos(a0) * ry, px1 = cx + Math.sin(a1) * rx, py1 = cy + Math.cos(a1) * ry;
      beam(v, px0, py0, cz, px1, py1, cz, T, jitter(col0, 0.03, i + k * 31), T * 0.9);
      // lay marks: a short dark diagonal across the front of every piece of the two front loops
      if (k >= loops - 2) {
        const mx = cx + Math.sin(am) * rx, my = cy + Math.cos(am) * ry, ang = Math.atan2(py1 - py0, px1 - px0);
        boxR(v, mx, my, cz + T * 0.47, 0.007, T * 1.05, 0.004, lay, 0, 0, ang + 0.6);
      }
    }
  }
  // the lashing round the bundle at the bottom (three turns of thin pale cord) and the binding at the peg
  const bz = z + 0.025 + (loops - 1) * 0.012, by = y - 2 * r * 1.2;
  for (let t = 0; t < 3; t++) ring(v, x + (t - 1) * 0.022, by, bz, 0.075, 0.012, '#E6D7B0', 8, 'x', 0.012);
  v.box(x, y - 0.04, z + 0.07, 0.07, 0.07, 0.11, colD);
  for (let t = 0; t < 3; t++) ring(v, x + (t - 1) * 0.02, y - 0.04, z + 0.07, 0.06, 0.01, '#E6D7B0', 8, 'x', 0.01);
  // the tail
  const tl = 0.16 + (seed % 3) * 0.06, side = (seed % 2) * 2 - 1, ty = y - 2.3 * r;
  const tz = z + 0.025 + loops * 0.024 + 0.02;
  for (let k = 0; k < 4; k++) {
    const y0 = ty + 0.06 - (k * (tl + 0.06)) / 4, y1 = ty + 0.06 - ((k + 1) * (tl + 0.06)) / 4;
    beam(v, x + side * (0.05 + k * 0.01), y0, tz, x + side * (0.05 + (k + 1) * 0.01), y1, tz, 0.026, jitter(col, 0.04, k + seed));
    boxR(v, x + side * (0.055 + k * 0.01), (y0 + y1) / 2, tz + 0.012, 0.006, 0.03, 0.004, lay, 0, 0, 0.6);
  }
  v.box(x + side * 0.09, ty - tl - 0.02, tz, 0.034, 0.04, 0.034, colD); // the whipped end
  for (let k = 0; k < 3; k++) boxR(v, x + side * 0.09 + (k - 1) * 0.01, ty - tl - 0.06, tz, 0.007, 0.05, 0.007, col, 0, 0, (k - 1) * 0.3); // fray
}
/**
 * The porters' rope rack, 1.6 m wide, flat for room.mount (origin at its centre, back on the wall at z = 0,
 * front +Z): a dark peg rail with five turned pegs, four coiled ropes (hemp, a tarred one, a newer pale one),
 * an iron cargo hook and a shoulder pad on the last peg; chalked names on the rail (drafts for Maya).
 */
export function ropeRack() {
  const root = new THREE.Group();
  root.name = 'ropeRack';
  const v = new VoxelBuilder();
  const W = 1.6;
  v.box(0, 0.2, 0.02, W, 0.16, 0.04, C.woodD);              // the peg rail
  v.box(0, 0.29, 0.03, W + 0.06, 0.03, 0.06, C.wood);       // its cap moulding
  v.box(0, 0.115, 0.03, W + 0.02, 0.02, 0.05, '#5E4128');
  for (const s of [-1, 1]) for (const yy of [0.15, 0.25]) prism(v, s * (W / 2 - 0.05), yy, 0.045, 0.016, 0.016, 0.01, C.iron, 6, Math.PI / 2);
  const cols = [[C.rope, C.ropeD], ['#4E3A2A', '#36281C'], [C.rope, C.ropeD], ['#E0CFA6', '#C2AE84']];
  const pegs = 5;
  for (let i = 0; i < pegs; i++) {
    const x = -W / 2 + 0.16 + i * ((W - 0.32) / (pegs - 1));
    // a turned peg sloping up a little, with a knob
    prism(v, x, 0.19, 0.11, 0.022, 0.026, 0.16, C.woodL, 8, Math.PI / 2 - 0.18);
    prism(v, x, 0.205, 0.2, 0.034, 0.034, 0.03, C.wood, 8, Math.PI / 2 - 0.18);
    if (i < 4) coilInto(v, x, 0.17, 0.02, 0.15 + (i % 2) * 0.025, cols[i][0], cols[i][1], i + 1);
  }
  // the last peg: an iron cargo hook on a short sling, and a worn shoulder pad
  const hx = W / 2 - 0.16;
  boxR(v, hx, 0.08, 0.13, 0.024, 0.2, 0.024, C.ropeD, 0.12, 0, 0);
  v.box(hx, -0.03, 0.15, 0.03, 0.06, 0.03, C.iron);
  v.box(hx, -0.1, 0.15, 0.025, 0.1, 0.025, C.iron);
  v.box(hx + 0.035, -0.15, 0.15, 0.08, 0.025, 0.025, C.iron);
  v.box(hx + 0.068, -0.125, 0.15, 0.022, 0.05, 0.025, C.iron);
  boxR(v, hx - 0.07, 0.04, 0.1, 0.13, 0.22, 0.05, '#7A6A55', 0, 0, 0.1);
  boxR(v, hx - 0.07, 0.04, 0.127, 0.1, 0.17, 0.004, '#8E7D66', 0, 0, 0.1);
  root.add(v.mesh({ px: 1.3 }));
  const names = ['ကိုလွင်', 'မောင်ငယ်', 'ဦးဘိုလေး', 'အသစ်', ''];
  const cnv = liveCanvas(1024, 96, (g, Wc, Hc) => {
    g.clearRect(0, 0, Wc, Hc);
    names.forEach((n, i) => { if (n) fitText(g, n, ((0.16 + i * 0.32 + 0.155) / 1.6) * Wc, Hc * 0.52, Hc * 0.56, 0.2 / 1.6 * Wc, { color: 'rgba(244,241,232,0.9)', weight: 400 }); });
  });
  const strip = signPlane(cnv.tex, W - 0.04, (W - 0.04) * 96 / 1024, { transparent: true });
  strip.position.set(0, 0.215, 0.042);
  root.add(strip);
  return { root, dispose() { disposeTree(root); } };
}

/** One grey slate in its little wooden frame (0.6 x 0.4), centred, face +Z, a string loop on top. */
function flyingSlateGeo() {
  const v = new VoxelBuilder();
  v.box(0, 0, 0, 0.6, 0.4, 0.03, '#B98E5E');
  v.box(0, -0.17, 0.002, 0.58, 0.04, 0.03, '#A57B4E');
  v.box(0, 0.01, 0.012, 0.5, 0.3, 0.012, '#46534A');
  v.box(-0.1, 0.04, 0.02, 0.18, 0.014, 0.004, '#A8B2A8');
  v.box(0.06, -0.03, 0.02, 0.22, 0.014, 0.004, '#A8B2A8');
  v.box(0, 0.23, 0, 0.012, 0.06, 0.012, '#E8DCC0');
  return v.geometry();
}
/**
 * The Day 6 noon gust at Nay Chi's bridge board. Put `root` where the board's root is (same position and turn),
 * or add it as a child of board.root. play() lifts nine grey slates off frames 1-9 (frame 10 stays) with a
 * spray of paper scraps: slates 1-5 tumble up and back over the Market roofs and come down toward `toWharf`;
 * 6-9 sail high toward `north` and shrink out of sight. Pass `board` (a bridgeBoard handle) and each frame is
 * emptied the moment its slate lifts. Offsets are in the board's local space (metres). Nothing marks where
 * they land: the player only sees them go.
 * Returns { root, play(), update(dt), playing, landed: [Vector3 x5], progress (0..1), dispose }.
 */
export function slateGust({ board = null, toWharf = [-26, -2.6, 14], north = [6, 0, -70], duration = 7, scraps = 24, seed = 6 } = {}) {
  const root = new THREE.Group();
  root.name = 'slateGust';
  const r = rand(seed);
  // the same frame layout as bridgeBoard: 1-5 left column, 6-10 right, top to bottom
  const frames = [];
  for (const [x, y] of boardFrames()) frames.push(new THREE.Vector3(x, y - 0.015, 0.03));
  const Wv = new THREE.Vector3(...toWharf), Nv = new THREE.Vector3(...north);
  const fly = [];
  for (let i = 0; i < 9; i++) {
    const toW = i < 5;
    const end = toW
      ? Wv.clone().add(new THREE.Vector3((i - 2) * 2.4 + (r() - 0.5) * 1.6, 0, (r() - 0.5) * 3))
      : Nv.clone().add(new THREE.Vector3((i - 6.5) * 6 + (r() - 0.5) * 4, 0, (r() - 0.5) * 8));
    fly.push({
      i, toW, start: frames[i], end,
      peak: toW ? 7 + r() * 3 : 14 + r() * 6,     // how high the arc rises above the board
      delay: 0.1 + ((i * 4) % 9) * 0.2 + r() * 0.15,
      len: toW ? duration * (0.62 + r() * 0.2) : duration * (0.7 + r() * 0.2),
      spin: [(r() - 0.5) * 9, (r() - 0.5) * 7, (r() - 0.5) * 11],
      lifted: false,
    });
    fly[i].peel = frames[i].clone().add(new THREE.Vector3(-0.4, 0.7, 0.9));
  }
  const PEEL = 0.55;
  const geo = flyingSlateGeo();
  // the shared vertex-colour toon material (cached in toon.js: never disposed here)
  const slates = new THREE.InstancedMesh(geo, toon('#ffffff', { vertexColors: true }), 9);
  slates.frustumCulled = false;
  root.add(slates);
  const outline = addOutline(slates, { px: 1.4 });
  // paper scraps: big bright ledger and newsprint sheets (unlit, so they stay brighter than the slates'
  // parchment in any light) that whirl up and drift off toward the Wharf, thinning out slowly
  const sgeo = new THREE.PlaneGeometry(0.4, 0.28);
  const scrapMat = new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide, toneMapped: false });
  const scrapMesh = new THREE.InstancedMesh(sgeo, scrapMat, scraps);
  scrapMesh.frustumCulled = false;
  scrapMesh.userData.ownMat = true;
  const papers = ['#FFFFFF', '#FFF8E6', '#FFFDF4', '#F6F3EC', '#FFF1CF'];
  const sc = [];
  const tmpC = new THREE.Color();
  for (let k = 0; k < scraps; k++) {
    scrapMesh.setColorAt(k, tmpC.set(papers[k % papers.length]));
    const a = r() * TAU;
    sc.push({
      from: new THREE.Vector3((r() - 0.5) * 2.6, 0.5 + r() * 2.4, 0.3 + r() * 1.2),
      vel: new THREE.Vector3(-1.4 - r() * 2.6, 1.4 + r() * 2.2, Math.sin(a) * 1.4),
      swirl: 0.8 + r() * 1.8, ph: r() * TAU, delay: r() * 1.4, life: 4.5 + r() * 3.5, s: 0.8 + r() * 0.5,
    });
  }
  root.add(scrapMesh);
  const Z0 = new THREE.Matrix4().makeScale(0, 0, 0);
  const hideAll = () => {
    for (let i = 0; i < 9; i++) slates.setMatrixAt(i, Z0);
    for (let k = 0; k < scraps; k++) scrapMesh.setMatrixAt(k, Z0);
    slates.instanceMatrix.needsUpdate = true;
    scrapMesh.instanceMatrix.needsUpdate = true;
  };
  hideAll();
  root.visible = false;
  const landed = fly.filter((f) => f.toW).map((f) => f.end.clone());
  const P = new THREE.Vector3(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(), M = new THREE.Matrix4();
  const h = {
    root, landed, playing: false, progress: 0, time: 0,
    play() { h.playing = true; h.time = 0; h.progress = 0; root.visible = true; fly.forEach((f) => { f.lifted = false; f.gone = false; }); sc.forEach((s) => { s.gone = false; }); },
    update(dt) {
      if (!h.playing) return;
      h.time += dt;
      const t = h.time;
      h.progress = Math.min(1, t / (duration + 3));
      let live = 0;
      for (const f of fly) {
        if (f.gone) continue;
        live++;
        if (t < f.delay) { slates.setMatrixAt(f.i, Z0); continue; }
        if (!f.lifted) { f.lifted = true; board?.setSlate(f.i, null); }
        const tau = t - f.delay;
        if (tau < PEEL) {
          // peeling off the hook: it jerks forward and up, flapping
          const k = smooth(tau / PEEL);
          P.copy(f.start);
          P.z += k * 0.9; P.y += k * 0.7 + Math.sin(tau * 30) * 0.03; P.x += -k * 0.4;
          E.set(-k * 1.1 + Math.sin(tau * 26 + f.i) * 0.35, Math.sin(tau * 19) * 0.3, Math.sin(tau * 23 + f.i) * 0.4);
          M.compose(P, Q.setFromEuler(E), S.setScalar(1 + 0.3 * k)); // grows to 1.3x as it comes off, so it reads in flight
          slates.setMatrixAt(f.i, M);
          continue;
        }
        const u = clamp01((tau - PEEL) / f.len);
        // a jerk off the hook, then a long arc: up and over and down (Wharf), or up and away, shrinking (north)
        const e = f.toW ? u : 1 - (1 - u) * (1 - u);
        P.lerpVectors(f.peel, f.end, e);
        P.y += Math.sin(Math.PI * Math.min(1, f.toW ? u : u * 0.8)) * f.peak + (f.toW ? 0 : u * f.peak * 0.4);
        P.x += Math.sin(u * 9 + f.i) * 0.6 * u;                 // flutter
        E.set(-1.1 + f.spin[0] * u, f.spin[1] * u, f.spin[2] * u);
        const sz = f.toW ? 1 : 1 - smooth((u - 0.55) / 0.45);
        S.setScalar(u >= 1 ? 0 : Math.max(0, sz) * 1.3);
        M.compose(P, Q.setFromEuler(E), S);
        slates.setMatrixAt(f.i, M);
        if (u >= 1) f.gone = true; // landed (Wharf) or out of sight (north): no more writes for it
      }
      if (live) slates.instanceMatrix.needsUpdate = true;
      let liveS = 0;
      for (let k = 0; k < sc.length; k++) {
        const s = sc[k];
        if (s.gone) continue;
        liveS++;
        const tt = t - s.delay, u = tt / s.life;
        if (tt < 0 || u >= 1) { scrapMesh.setMatrixAt(k, Z0); if (u >= 1) s.gone = true; continue; }
        P.copy(s.from).addScaledVector(s.vel, tt);
        P.y -= 0.22 * tt * tt;
        P.x += Math.sin(tt * s.swirl * 2 + s.ph) * 0.7;
        P.z += Math.cos(tt * s.swirl * 2 + s.ph) * 0.6;
        E.set(tt * 3.5 * s.swirl, tt * 2.5 + s.ph, tt * 3);
        S.setScalar(s.s * (1 - smooth((u - 0.75) / 0.25)));
        M.compose(P, Q.setFromEuler(E), S);
        scrapMesh.setMatrixAt(k, M);
      }
      if (liveS) scrapMesh.instanceMatrix.needsUpdate = true;
      // done: every slate landed or gone, every scrap gone -> stop (no more per-frame writes at all)
      if ((!live && !liveS) || t > duration + 3) { h.playing = false; hideAll(); root.visible = false; h.progress = 1; }
    },
    dispose() { h.playing = false; geo.dispose(); sgeo.dispose(); scrapMat.dispose(); slates.dispose(); scrapMesh.dispose(); outline.geometry.dispose(); outline.dispose(); outline.removeFromParent(); root.removeFromParent(); },
  };
  return h;
}

// =============================================================================================
// THE PRINTING SHED'S OWN PIECES (Junction, INDEX 11: typeCase, handPress, typeBlock, scrapCrate,
// letterTable). Stand-alone factories for close-ups, the Day 14 press, the Day 8 letter room and any
// scene that needs them loose. rooms/junction.js bakes its own copies into the `press` and `letterroom`
// rooms (one merged draw for the whole room); these match them in size, colour and layout.
// =============================================================================================
const TYPE = { metal: '#7C766E', metalL: '#A3A09A', metalD: '#55514B', ink: '#221C18', inkL: '#3A322C', steel: '#6E6A64' };

/** One sort (a single piece of metal type), unit size: shank 0..1 in Y, a paler face on top, the nick on +Z. */
function sortGeo() {
  const v = new VoxelBuilder();
  v.box(0, 0.5, 0, 0.72, 1.0, 0.86, TYPE.metal);
  v.box(0, 1.02, 0, 0.6, 0.05, 0.68, TYPE.metalL);
  v.box(0.06, 1.05, 0, 0.3, 0.02, 0.4, TYPE.ink);   // the inked letter on the face
  v.box(0, 0.62, 0.44, 0.72, 0.09, 0.03, TYPE.metalD); // nick: says which way up
  return v.geometry();
}
const CASE_LABELS = ['က', 'ခ', 'ဂ', 'ဃ', 'င', 'စ', 'ဆ', 'ဇ', 'ည', 'တ', 'ထ', 'ဒ']; // drawer labels (drafts for Maya)

/**
 * A printer's type case, 1.24 x 0.56, 1.18 high at the back: a cabinet of twelve shallow drawers (two
 * columns of six, each with a brass label plate «က ခ ဂ …» and a cup pull, worn pale round the pull), and the
 * sloped case on top, six by four compartments full of sorts (instanced). jumbled: false = every sort upright
 * the same way (nicks all facing the compositor); true = turned every which way, a few lying down, one
 * upside down in each compartment. A composing stick and a few loose sorts on the ledge. Origin floor centre,
 * front +Z. Draws: body + outline, sorts, labels (4).
 */
export function typeCase({ jumbled = false, labels = CASE_LABELS } = {}) {
  const root = new THREE.Group();
  root.name = 'typeCase';
  const v = new VoxelBuilder();
  const W = 1.24, D = 0.56, CH = 0.98, FZ = D / 2;
  v.boxMin(-W / 2, 0, -D / 2, W / 2, 0.06, D / 2, C.woodD);                    // plinth
  v.boxMin(-W / 2 + 0.02, 0.06, -D / 2 + 0.02, W / 2 - 0.02, CH, -D / 2 + 0.05, C.woodD); // back
  for (const s of [-1, 1]) {
    v.boxMin(s * W / 2 - 0.035, 0, -D / 2, s * W / 2 + 0.035, CH + 0.02, D / 2, jitter(C.wood, 0.04, s + 3)); // sides
    v.box(s * (W / 2 + 0.036), CH * 0.5, FZ - 0.02, 0.004, CH * 0.9, 0.012, mixHex(C.wood, '#F2E2C0', 0.3)); // worn front edge
  }
  v.boxMin(-W / 2 + 0.03, 0.06, -D / 2 + 0.05, W / 2 - 0.03, CH - 0.01, FZ - 0.08, '#2A2019'); // the dark carcass behind the drawers
  // drawers: 2 x 6, label plates, pulls, wear round the pulls, an ink smudge or two
  const DW = 0.565, DH = 0.13;
  const lab = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 2; c++) {
    const x0 = -0.575 + c * 0.585, y0 = 0.075 + r * DH;
    const open = (r === 2 && c === 1) ? 0.07 : 0; // one drawer left a little open
    v.boxMin(x0, y0, FZ - 0.07 + open, x0 + DW - 0.012, y0 + DH - 0.012, FZ - 0.01 + open, jitter(C.woodL, 0.06, r * 2 + c));
    v.boxMin(x0 + 0.005, y0 + 0.005, FZ - 0.0105 + open, x0 + DW - 0.017, y0 + 0.012, FZ - 0.009 + open, mixHex(C.woodL, '#3A2A1E', 0.35)); // shadow line at the foot
    const lx = x0 + DW / 2 - 0.006;
    v.boxMin(lx - 0.085, y0 + 0.068, FZ - 0.01 + open, lx + 0.085, y0 + 0.112, FZ - 0.004 + open, C.goldD); // label frame
    lab.push([lx, y0 + 0.09, FZ - 0.0035 + open]);
    v.box(lx, y0 + 0.035, FZ - 0.0 + open, 0.07, 0.026, 0.02, C.brass);               // cup pull
    v.box(lx, y0 + 0.03, FZ - 0.0095 + open, 0.13, 0.05, 0.001, mixHex(C.woodL, '#F4E6C6', 0.35)); // worn pale
    if ((r * 3 + c) % 5 === 1) v.box(lx + 0.16, y0 + 0.05, FZ - 0.0092 + open, 0.05, 0.03, 0.001, TYPE.inkL); // inky thumb
    if (open) {
      v.boxMin(x0 + 0.02, y0 + 0.01, FZ - 0.075, x0 + DW - 0.03, y0 + 0.095, FZ - 0.005 + open, '#3A2C22'); // the drawer's tray
      for (let k = 0; k < 6; k++) v.box(x0 + 0.07 + k * 0.08, y0 + 0.105, FZ - 0.035 + (k % 2) * 0.02, 0.05, 0.02, 0.03, jitter(TYPE.metal, 0.05, k)); // sorts in the open drawer
    }
  }
  // apron above the drawers with a gold rule
  v.boxMin(-W / 2 + 0.03, CH - 0.06, FZ - 0.05, W / 2 - 0.03, CH + 0.02, FZ, C.wood);
  v.boxMin(-W / 2 + 0.05, CH - 0.035, FZ, W / 2 - 0.05, CH - 0.025, FZ + 0.004, C.gold);
  // the sloped case: pivots at the front edge, rises to the back
  const tilt = 0.32;
  const topM = new THREE.Matrix4().compose(new THREE.Vector3(0, CH + 0.02, FZ - 0.02), new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, 0, 0)), new THREE.Vector3(1, 1, 1));
  const tv = new VoxelBuilder();
  const TW = 1.22, TD = 0.56;
  tv.box(0, 0.02, -TD / 2, TW, 0.04, TD, C.woodD);
  for (const z of [-0.012, -TD + 0.012]) tv.box(0, 0.06, z, TW, 0.07, 0.025, C.wood);
  for (const s of [-1, 1]) tv.box(s * (TW / 2 - 0.012), 0.06, -TD / 2, 0.025, 0.07, TD, C.wood);
  for (let i = 1; i < 6; i++) tv.box(-TW / 2 + i * (TW / 6), 0.06, -TD / 2, 0.014, 0.045, TD - 0.03, C.woodL);
  for (let k = 1; k < 4; k++) tv.box(0, 0.06, -TD + k * (TD / 4), TW - 0.03, 0.045, 0.012, C.woodL);
  tv.box(-0.3, 0.096, -0.012, 0.4, 0.012, 0.03, C.goldD); // a brass edge strip, worn
  v.merge(tv, topM);
  for (const s of [-1, 1]) v.box(s * (W / 2 - 0.05), CH + 0.1, -0.16, 0.05, 0.17, 0.14, C.woodD); // wedges under the raised back
  // the ledge for the composing stick, the stick, loose sorts
  v.box(0, CH + 0.03, FZ + 0.03, W - 0.1, 0.02, 0.06, C.woodD);
  v.box(0.22, CH + 0.055, FZ + 0.035, 0.34, 0.03, 0.045, TYPE.steel);
  v.box(0.22, CH + 0.075, FZ + 0.035, 0.3, 0.012, 0.035, TYPE.metalL);
  for (let k = 0; k < 4; k++) v.box(0.12 + k * 0.035, CH + 0.08, FZ + 0.035, 0.022, 0.04, 0.026, TYPE.metal);
  for (const [x, rz] of [[-0.35, 1.5], [-0.3, 0.2], [-0.42, 1.2]]) boxR(v, x, CH + 0.052, FZ + 0.04, 0.022, 0.04, 0.026, TYPE.metal, 0, x * 3, rz);
  // a paper chit tacked on the side (a list of fonts), a rag hung on the side
  v.box(W / 2 + 0.04, 0.72, 0.05, 0.004, 0.16, 0.12, '#EFE7D2');
  for (let k = 0; k < 4; k++) v.box(W / 2 + 0.043, 0.76 - k * 0.03, 0.05, 0.002, 0.008, 0.08 - (k % 2) * 0.03, '#6A625A');
  v.box(-W / 2 - 0.045, 0.55, 0.12, 0.012, 0.3, 0.16, '#B7A88E');
  v.box(-W / 2 - 0.05, 0.5, 0.12, 0.012, 0.08, 0.17, '#6E6458');
  const body = v.mesh();
  root.add(body);
  // sorts: 4 per compartment, in a group carrying the slope (instanced, no outline: tiny)
  const top = new THREE.Group();
  top.position.set(0, CH + 0.02, FZ - 0.02);
  top.rotation.x = tilt;
  root.add(top);
  const slots = [];
  for (let i = 0; i < 6; i++) for (let k = 0; k < 4; k++) for (let j = 0; j < 4; j++) {
    slots.push([-TW / 2 + (i + 0.5) * (TW / 6) + ((j % 2) - 0.5) * 0.06 + (j > 1 ? 0.03 : -0.02), 0.04, -TD + (k + 0.5) * (TD / 4) + ((j > 1) - 0.5) * 0.05]);
  }
  const sg = sortGeo();
  const sorts = new THREE.InstancedMesh(sg, toon('#ffffff', { vertexColors: true }), slots.length);
  top.add(sorts);
  const M = new THREE.Matrix4(), Pp = new THREE.Vector3(), Qq = new THREE.Quaternion(), Ee = new THREE.Euler(), SS = new THREE.Vector3(0.03, 0.05, 0.026);
  function setJumbled(on) {
    const r = rand(41);
    slots.forEach(([x, y, z], i) => {
      Pp.set(x, y, z);
      if (!on) Ee.set(0, 0, 0);
      else {
        const a = r(), kind = i % 16 === 5 ? 'flip' : a < 0.18 ? 'lie' : 'turn';
        if (kind === 'flip') { Ee.set(Math.PI, r() * 3, 0); Pp.y += 0.052; }
        else if (kind === 'lie') { Ee.set(0, r() * 3, Math.PI / 2); Pp.x += 0.02; Pp.y += 0.0; }
        else Ee.set((r() - 0.5) * 0.4, (r() - 0.5) * 6, (r() - 0.5) * 0.3);
        Pp.x += (r() - 0.5) * 0.02; Pp.z += (r() - 0.5) * 0.02;
      }
      M.compose(Pp, Qq.setFromEuler(Ee), SS);
      sorts.setMatrixAt(i, M);
    });
    sorts.instanceMatrix.needsUpdate = true;
  }
  setJumbled(jumbled);
  // brass labels: engraved letters on one atlas
  const cnv = liveCanvas(512, 96, (g) => {
    g.clearRect(0, 0, 512, 96);
    for (let i = 0; i < 12; i++) {
      const x = (i % 6) * 84 + 2, y = Math.floor(i / 6) * 48;
      const grd = g.createLinearGradient(x, y, x, y + 44);
      grd.addColorStop(0, '#F0D488'); grd.addColorStop(0.5, '#D9B356'); grd.addColorStop(1, '#A9832E');
      g.fillStyle = grd; g.fillRect(x, y, 80, 44);
      g.fillStyle = 'rgba(80,56,20,0.5)'; g.fillRect(x, y + 41, 80, 3);
      g.fillStyle = '#6A4A16'; for (const px of [x + 6, x + 74]) { g.beginPath(); g.arc(px, y + 22, 2.5, 0, TAU); g.fill(); }
      fitText(g, labels[i] ?? '', x + 40, y + 24, 34, 54, { color: '#3A2810' });
    }
  });
  const q = new Quads(512, 96);
  lab.forEach(([x, y, z], i) => q.add(x, y, z, 0.15, 0.036, [(i % 6) * 84 + 2, Math.floor(i / 6) * 48, 80, 44]));
  root.add(q.mesh(cnv.tex));
  const shadow = shadowUnder(root, 0.8, 0.42, 0, 0.02, 0.45);
  return {
    root, setJumbled, sorts,
    dispose() { sg.dispose(); sorts.dispose(); shadow.geometry.dispose(); disposeTree(root); },
  };
}

/**
 * The hand press (an iron platen press on a wooden stand), 1.0 x 1.6 long x 1.9 high, the bed running along
 * Z with the tympan folded open toward +Z (a fresh sheet on it, still wet with print). Iron cheeks with brass
 * bosses, the head with a small gold crown scroll, the screw and platen, the rounce (bed crank) on +X, an ink
 * slab with a brayer on a side shelf (-X), an oil can and a rag. pull(0..1) swings the bar (its own mesh);
 * `bar` is its pivot. Origin floor centre. Draws: frame + outline, bar + outline (4).
 */
export function handPress({ pull = 0 } = {}) {
  const root = new THREE.Group();
  root.name = 'handPress';
  const v = new VoxelBuilder();
  const IRON = '#3A3A40', IRON_D = '#26262B', IRON_L = '#5A5A62'; // cast iron, blue-black (the stand is wood)
  // the wooden stand: feet, legs, stretchers
  v.boxMin(-0.5, 0, -0.5, 0.5, 0.08, 0.5, C.woodD);
  for (const sx of [-1, 1]) for (const z of [-0.42, 0.62]) v.boxMin(sx * 0.42 - 0.05, 0, z - 0.05, sx * 0.42 + 0.05, 0.72, z + 0.05, jitter(C.woodD, 0.05, sx + z * 5));
  for (const sx of [-1, 1]) v.boxMin(sx * 0.42 - 0.03, 0.22, -0.42, sx * 0.42 + 0.03, 0.28, 0.62, C.wood);
  v.boxMin(-0.42, 0.22, 0.58, 0.42, 0.28, 0.64, C.wood);
  for (const sx of [-1, 1]) v.boxMin(sx * 0.3 - 0.03, 0.72, -0.5, sx * 0.3 + 0.03, 0.78, 0.78, IRON_D); // rails
  // the bed with the type forme locked up in its chase
  v.boxMin(-0.36, 0.78, -0.42, 0.36, 0.84, 0.4, IRON);
  v.boxMin(-0.3, 0.84, -0.34, 0.3, 0.855, 0.32, IRON_D);           // chase
  for (let r = 0; r < 7; r++) v.boxMin(-0.26, 0.855, -0.3 + r * 0.085, r === 3 ? 0.05 : 0.26, 0.868, -0.24 + r * 0.085, r % 2 ? '#6E6A64' : '#7C766E'); // lines of type
  v.boxMin(-0.27, 0.855, -0.31, -0.24, 0.868, 0.29, C.woodL);       // furniture (wood spacers)
  // tympan + frisket folded open at the front, a fresh sheet
  v.boxMin(-0.32, 0.84, 0.42, 0.32, 0.87, 0.98, IRON_L);
  v.boxMin(-0.29, 0.87, 0.45, 0.29, 0.874, 0.95, '#F4EFE3');
  for (let r = 0; r < 7; r++) v.boxMin(-0.24, 0.874, 0.49 + r * 0.06, r === 3 ? 0.03 : 0.24, 0.876, 0.515 + r * 0.06, r === 0 ? '#3A322C' : '#6E665E'); // the print, a heading first
  // the iron frame: two cheeks with brass bosses, the head, crown scroll, screw, platen
  for (const sx of [-1, 1]) {
    v.boxMin(sx * 0.48 - 0.07, 0.72, -0.12, sx * 0.48 + 0.07, 1.62, 0.12, IRON);
    v.boxMin(sx * 0.48 - 0.09, 0.72, -0.15, sx * 0.48 + 0.09, 0.8, 0.15, IRON_D);
    v.boxMin(sx * 0.48 - 0.072, 1.0, -0.122, sx * 0.48 + 0.072, 1.06, 0.122, IRON_L); // a cast rib
    v.box(sx * 0.48, 1.3, 0.125, 0.07, 0.07, 0.014, C.gold);
    v.box(sx * 0.48, 1.3, 0.134, 0.03, 0.03, 0.008, C.goldD);
    v.box(sx * 0.48 + 0.02, 0.9, 0.122, 0.05, 0.12, 0.003, IRON_D); // inky fingermarks
  }
  v.boxMin(-0.6, 1.55, -0.15, 0.6, 1.72, 0.15, IRON);
  v.boxMin(-0.6, 1.71, -0.16, 0.6, 1.73, 0.16, IRON_L);
  v.boxMin(-0.3, 1.73, -0.05, 0.3, 1.78, 0.05, C.gold);
  boxR(v, 0, 1.85, 0, 0.12, 0.12, 0.05, C.gold, 0, 0, Math.PI / 4);
  for (const s of [-1, 1]) boxR(v, s * 0.14, 1.82, 0, 0.12, 0.04, 0.04, C.goldD, 0, 0, s * 0.5); // the scroll's arms
  v.boxMin(-0.06, 1.2, -0.06, 0.06, 1.55, 0.06, IRON_D);          // the screw
  for (let k = 0; k < 5; k++) v.box(0, 1.25 + k * 0.06, 0.061, 0.11, 0.012, 0.002, IRON_L); // its thread
  v.boxMin(-0.34, 1.12, -0.28, 0.34, 1.18, 0.28, IRON_L);         // platen
  v.boxMin(-0.36, 1.1, -0.3, 0.36, 1.12, 0.3, IRON);
  // the rounce (bed crank) on +X: an axle and a four-spoke handle
  prism(v, 0.56, 0.78, 0.1, 0.03, 0.03, 0.22, IRON_D, 6, 0, 0, Math.PI / 2);
  for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + 0.3; beam(v, 0.68, 0.78, 0.1, 0.68, 0.78 + Math.sin(a) * 0.2, 0.1 + Math.cos(a) * 0.2, 0.03, IRON); prism(v, 0.71, 0.78 + Math.sin(a) * 0.22, 0.1 + Math.cos(a) * 0.22, 0.022, 0.022, 0.08, C.woodL, 6, 0, 0, Math.PI / 2); }
  // the ink slab and brayer on a shelf at -X, an oil can on the foot, a rag over the rail
  v.boxMin(-0.78, 0.66, 0.1, -0.5, 0.7, 0.5, C.wood);
  beam(v, -0.52, 0.66, 0.3, -0.52, 0.3, 0.3, 0.04, C.woodD);
  v.boxMin(-0.76, 0.7, 0.13, -0.52, 0.73, 0.47, '#8E8A84');
  v.boxMin(-0.74, 0.73, 0.16, -0.54, 0.732, 0.42, '#2A2420');           // rolled-out ink
  for (let k = 0; k < 3; k++) v.box(-0.64, 0.7325, 0.2 + k * 0.08, 0.17, 0.001, 0.012, '#4A403A');
  prism(v, -0.64, 0.775, 0.3, 0.04, 0.04, 0.18, '#1E1A18', 8, 0, 0, Math.PI / 2); // brayer roller
  beam(v, -0.64, 0.78, 0.3, -0.64, 0.82, 0.45, 0.02, IRON);
  v.box(-0.64, 0.825, 0.49, 0.03, 0.03, 0.09, C.woodL);
  prism(v, 0.3, 0.17, 0.38, 0.05, 0.065, 0.12, '#6E7A6E', 8);            // oil can
  beam(v, 0.3, 0.22, 0.38, 0.37, 0.3, 0.44, 0.014, '#6E7A6E');
  boxR(v, 0.0, 0.66, -0.47, 0.6, 0.012, 0.16, '#B9AE98', 0.2, 0, 0.05);  // rag over the back stretcher
  root.add(v.mesh());
  // the bar: pivot at the screw; pull 0..1 swings it round toward the pressman (+Z)
  const bar = new THREE.Group();
  bar.name = 'pressBar';
  bar.position.set(0, 1.38, 0);
  const bv = new VoxelBuilder();
  bv.box(0, 0, 0, 0.13, 0.1, 0.13, IRON_D);
  bv.box(0.33, 0, 0.12, 0.62, 0.05, 0.05, IRON, 0.35);
  bv.box(0.68, 0, 0.36, 0.1, 0.07, 0.07, C.woodL, 0.35);
  bv.box(0.76, 0, 0.42, 0.18, 0.085, 0.085, mixHex(C.woodL, '#3A2A1E', 0.25), 0.35); // the grip, darkened by hands
  bar.add(bv.mesh({ px: 1.4 }));
  root.add(bar);
  const setPull = (t) => { bar.rotation.y = -clamp01(t) * 1.1; };
  setPull(pull);
  const shadow = shadowUnder(root, 0.85, 0.85, 0, 0.15, 0.4);
  return { root, bar, pull: setPull, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

/** The raised '6' as a path (glyph units: x right, y up, about -0.5..0.5); turned half round it reads 9. */
function sixPath() {
  const pts = [[0.2, 0.4], [0.08, 0.49], [-0.07, 0.47], [-0.18, 0.37], [-0.25, 0.19], [-0.27, -0.02], [-0.26, -0.2]];
  for (let k = 0; k <= 14; k++) { const a = Math.PI + (k / 14) * TAU; pts.push([Math.cos(a) * 0.25, -0.24 + Math.sin(a) * 0.25]); }
  return pts;
}
/**
 * A type block, hand-size, face up (+Y), origin at its foot:
 *   'six'   a big wood-type block (0.18 cube-ish) whose inked face carries a raised '6'; seen from the far
 *           side (setTurn(1), half round) the same block reads 9. A nick on its +Z side, a pencilled number.
 *   'title' the shed's old name block, 0.6 x 0.12: type-metal face with «ရွှေမင် ပုံနှိပ်တိုက်» in mirror
 *           writing (as type is), on a dark worn wooden base. faceDown: true lays it on its face (the scrap
 *           crate), showing the back with an old paper inventory label.
 * Returns { root, kind, setTurn(0..1), setFaceDown(on), dispose }. Draws: block + outline (+ face/label quad).
 */
export function typeBlock(kind = 'six', { faceDown = false, text = 'ရွှေမင် ပုံနှိပ်တိုက်' } = {}) {
  const root = new THREE.Group();
  root.name = 'typeBlock';
  const spin = new THREE.Group();
  root.add(spin);
  const v = new VoxelBuilder();
  let H, quads = null, cnv = null;
  if (kind === 'title') {
    const L = 0.6, D = 0.12; H = 0.075;
    v.box(0, 0.025, 0, L, 0.05, D, '#5A4030');                      // the old base
    for (let k = 0; k < 6; k++) v.box(-L / 2 + 0.05 + k * 0.1, 0.051, (k % 2 ? 0.02 : -0.03), 0.06, 0.002, 0.004, '#4A3424'); // grain
    v.box(0, 0.06, 0, L - 0.02, 0.02, D - 0.02, TYPE.metalD);       // type-metal plate
    v.box(0, 0.071, 0, L - 0.04, 0.004, D - 0.035, TYPE.metal);     // shoulder
    for (const s of [-1, 1]) v.box(s * (L / 2 - 0.03), 0.074, 0, 0.012, 0.006, D - 0.04, TYPE.inkL); // border rules
    v.box(-L / 2 + 0.002, 0.03, 0.02, 0.004, 0.03, 0.04, '#7A6A55');  // a chipped corner, paler wood
    v.box(L / 2 - 0.05, 0.026, D / 2 + 0.001, 0.06, 0.018, 0.002, '#7A6A55');
    cnv = liveCanvas(512, 160, (g) => {
      g.clearRect(0, 0, 512, 160);
      // the face: letters in mirror writing, raised and inked, a light edge where the metal is worn
      g.fillStyle = '#8A867E'; g.fillRect(0, 0, 512, 100);
      g.save(); g.translate(512, 0); g.scale(-1, 1);
      fitText(g, text, 258, 54, 64, 470, { color: '#F0EDE6' });
      fitText(g, text, 256, 52, 64, 470, { color: TYPE.ink });
      g.restore();
      // the back's paper label (a stock number, pencilled; a draft for Maya)
      g.fillStyle = '#E9DFC6'; g.fillRect(4, 108, 200, 48);
      g.fillStyle = 'rgba(120,96,60,0.35)'; g.fillRect(150, 108, 54, 48);
      fitText(g, 'ခေါင်းစီး ၁', 92, 133, 28, 170, { color: '#4A4038', weight: 400 });
    });
    quads = new Quads(512, 160);
    quads.add(0, 0.0745, 0, L - 0.06, (L - 0.06) * 100 / 512, [0, 0, 512, 100], -Math.PI / 2);
    quads.add(0.08, -0.0005, 0, 0.16, 0.038, [4, 108, 200, 48], Math.PI / 2, 0, 0); // under the base: reads upright once the block lies face down
  } else {
    const B = 0.18; H = 0.14;
    // pale end-grain body with darker ink-soaked edges, the shoulder, the nick
    v.box(0, H / 2 - 0.006, 0, B, H - 0.012, B, '#D9BE8E');
    for (const s of [-1, 1]) { v.box(s * (B / 2 - 0.004), H / 2, 0, 0.01, H - 0.02, B - 0.01, '#C4A676'); v.box(0, H / 2, s * (B / 2 - 0.004), B - 0.01, H - 0.02, 0.01, '#C9AC7C'); }
    for (let k = 0; k < 4; k++) v.box(0, 0.02 + k * 0.032, B / 2 + 0.001, B - 0.02, 0.003, 0.002, '#B8996A'); // grain rings on the side
    v.box(0, H - 0.008, 0, B - 0.01, 0.006, B - 0.01, '#A88E68');  // the face's low ground: worn wood, ink-stained
    v.box(0, 0.035, B / 2 + 0.002, B, 0.014, 0.004, '#8C6E46');    // nick on +Z
    v.box(-0.05, 0.085, B / 2 + 0.003, 0.03, 0.03, 0.001, '#6A5A48'); // pencilled stock mark
    // the raised glyph: beams along the path, inked black with a worn pale top edge
    const S = 0.13, pts = sixPath();
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      beam(v, x0 * S, H + 0.002, -y0 * S, x1 * S, H + 0.002, -y1 * S, 0.012, '#141110', 0.026);
      beam(v, x0 * S, H + 0.0085, -y0 * S, x1 * S, H + 0.0085, -y1 * S, 0.002, '#4A403A', 0.014);
    }
  }
  const mesh = v.mesh({ px: 1.2 });
  spin.add(mesh);
  if (quads) spin.add(quads.mesh(cnv.tex));
  const shadow = shadowUnder(root, kind === 'title' ? 0.36 : 0.13, kind === 'title' ? 0.1 : 0.13, 0, 0, 0.35);
  let turn = 0, down = faceDown;
  const place = () => {
    spin.rotation.set(down ? Math.PI : 0, turn * Math.PI, 0, 'YXZ');
    spin.position.y = down ? H : 0;
  };
  place();
  return {
    root, kind,
    setTurn(t) { turn = clamp01(t); place(); },
    setFaceDown(b) { down = !!b; place(); },
    dispose() { shadow.geometry.dispose(); disposeTree(root); },
  };
}

/**
 * The scrap crate just inside the press's side door, 0.72 x 0.48 x 0.42: a slatted crate (dark gaps, rope
 * handles, chalk "X" for scrap) heaped with broken sorts, wood offcuts, spoiled sheets, a bent brass rule and
 * half a composing stick. The old title block (typeBlock('title')) lies on top, face down: `title` is its
 * handle (lift it out); setTitle(false) hides it. Origin floor centre, front +Z. Draws: crate + outline,
 * title block 3 (5).
 */
export function scrapCrate({ title = true } = {}) {
  const root = new THREE.Group();
  root.name = 'scrapCrate';
  const v = new VoxelBuilder();
  const W = 0.72, D = 0.48, H = 0.42;
  const r = rand(808);
  v.boxMin(-W / 2 + 0.03, 0.0, -D / 2 + 0.03, W / 2 - 0.03, 0.03, D / 2 - 0.03, C.woodGD);              // floor
  v.boxMin(-W / 2 + 0.035, 0.03, -D / 2 + 0.035, W / 2 - 0.035, H - 0.02, D / 2 - 0.035, '#2E241C');   // dark inside (seen through the gaps)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * (W / 2 - 0.025), H / 2, sz * (D / 2 - 0.025), 0.05, H, 0.05, jitter(C.woodD, 0.05, sx * 2 + sz)); // corner posts
  for (let k = 0; k < 3; k++) {
    const y = 0.07 + k * 0.135, sh = 0.105;
    for (const sz of [-1, 1]) v.box(0, y, sz * (D / 2 - 0.01), W - 0.04, sh, 0.02, jitter(k === 1 && sz > 0 ? '#C7A97C' : C.woodG, 0.06, k * 3 + sz));
    for (const sx of [-1, 1]) v.box(sx * (W / 2 - 0.01), y, 0, 0.02, sh, D - 0.04, jitter(C.woodG, 0.06, k * 5 + sx));
  }
  for (const sz of [-1, 1]) v.box(0, H - 0.012, sz * (D / 2 - 0.01), W, 0.024, 0.03, C.woodD); // top rim
  for (const sx of [-1, 1]) v.box(sx * (W / 2 - 0.01), H - 0.012, 0, 0.03, 0.024, D, C.woodD);
  // rope handles on the ends, a chalk X and a stencilled number on the front
  for (const sx of [-1, 1]) for (let k = 0; k < 6; k++) {
    const a0 = (k / 6) * Math.PI, a1 = ((k + 1) / 6) * Math.PI;
    beam(v, sx * (W / 2 + 0.02), H - 0.12 + Math.sin(a0) * 0.05, -0.08 + (1 - Math.cos(a0)) * 0.08, sx * (W / 2 + 0.02), H - 0.12 + Math.sin(a1) * 0.05, -0.08 + (1 - Math.cos(a1)) * 0.08, 0.018, C.rope);
  }
  for (const s of [-1, 1]) boxR(v, -0.14, 0.205, D / 2 + 0.002, 0.2, 0.016, 0.002, '#EDEAE0', 0, 0, s * 0.62);
  for (const [x, w] of [[0.12, 0.016], [0.16, 0.05], [0.2, 0.016]]) v.box(x, 0.205, D / 2 + 0.002, w, 0.06, 0.002, '#3A2C22'); // a stencilled mark
  // the heap: broken sorts, offcuts, crumpled sheets, a bent rule, half a composing stick
  const hy = (x, z) => H - 0.08 + 0.06 * Math.cos((x / W) * 2.6) * Math.cos((z / D) * 2.4);
  for (let i = 0; i < 70; i++) {
    const x = (r() - 0.5) * (W - 0.12), z = (r() - 0.5) * (D - 0.12);
    const under = Math.abs(x - 0.04) < 0.38 && Math.abs(z + 0.01) < 0.16; // bedded down under the title block
    const y = under ? Math.min(hy(x, z), H - 0.13) : hy(x, z) + (r() - 0.5) * 0.03;
    const k = r();
    if (k < 0.5) boxR(v, x, y, z, 0.022 + r() * 0.01, 0.04 + r() * 0.015, 0.026, jitter(r() < 0.3 ? TYPE.metalD : TYPE.metal, 0.06, i), r() * 3, r() * 3, r() * 3);
    else if (k < 0.72) boxR(v, x, y, z, 0.12 + r() * 0.12, 0.018, 0.04, jitter(C.woodL, 0.07, i), (r() - 0.5) * 0.6, r() * 3, (r() - 0.5) * 0.5);
    else if (k < 0.92) boxR(v, x, y + 0.01, z, 0.09 + r() * 0.06, 0.05 + r() * 0.03, 0.08 + r() * 0.05, jitter(r() < 0.5 ? '#EFE9DA' : '#DAD6CB', 0.04, i), r() * 3, r() * 3, r() * 3);
    else boxR(v, x, y, z, 0.05, 0.03, 0.05, '#2A2420', r(), r() * 3, r());
  }
  boxR(v, -0.2, H - 0.03, 0.12, 0.3, 0.008, 0.016, C.brass, 0.1, 0.4, 0.25); // a bent brass rule
  boxR(v, -0.05, H - 0.03, 0.17, 0.12, 0.008, 0.016, C.brass, 0.1, 0.4, -0.15);
  boxR(v, 0.24, H - 0.02, -0.12, 0.2, 0.03, 0.05, TYPE.steel, 0.2, -0.6, 0.35); // half a composing stick
  root.add(v.mesh());
  // the title block, face down on top of the heap
  const tb = typeBlock('title', { faceDown: true });
  tb.root.position.set(0.04, H - 0.035, -0.01);
  tb.root.rotation.set(0.04, 0.22, -0.05);
  root.add(tb.root);
  tb.root.visible = title;
  const shadow = shadowUnder(root, 0.48, 0.34, 0, 0, 0.45);
  return {
    root, title: tb,
    setTitle(on) { tb.root.visible = !!on; },
    dispose() { tb.dispose(); shadow.geometry.dispose(); disposeTree(root); },
  };
}

/** A line of joined-up handwriting (a scrawl, not real words). */
function scrawl(g, x, y, w, seed, color = '#2E3D63', lw = 2) {
  const r = rand(seed);
  g.strokeStyle = color; g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, y);
  let px = x;
  while (px < x + w) {
    const step = 4 + r() * 6;
    g.quadraticCurveTo(px + step / 2, y - 3 - r() * 6, px + step, y + (r() - 0.5) * 2);
    px += step;
    if (r() < 0.12) { px += 6; g.moveTo(px, y); }
  }
  g.stroke();
}
/**
 * Ma Thida's folding letter table, 1.0 x 0.7, 0.72 high: X legs with a stretcher, a green blotter with the
 * letter she is writing (blue rules, her hand), a stack of letters, three envelopes fanned (one stamped and
 * addressed), her small ink pot with a dip pen, a tin of stamps, a string-tied bundle, a glass paperweight
 * and a little oil lamp. Origin floor centre, front +Z (the customer's side). Draws: table + outline, papers (3).
 */
export function letterTable() {
  const root = new THREE.Group();
  root.name = 'letterTable';
  const v = new VoxelBuilder();
  const TH = 0.72;
  v.boxMin(-0.5, TH - 0.04, -0.35, 0.5, TH, 0.35, C.woodL);
  v.boxMin(-0.52, TH - 0.06, -0.37, 0.52, TH - 0.04, 0.37, C.wood);
  v.box(0, TH - 0.001, 0.349, 0.98, 0.002, 0.003, mixHex(C.woodL, '#F4E6C6', 0.4)); // the worn front edge
  for (const sx of [-1, 1]) {
    boxR(v, sx * 0.4, TH / 2 - 0.03, 0, 0.04, TH * 1.08, 0.04, C.woodD, 0.5, 0, 0);
    boxR(v, sx * 0.4, TH / 2 - 0.03, 0, 0.04, TH * 1.08, 0.04, C.woodD, -0.5, 0, 0);
    v.box(sx * 0.4, 0.02, 0, 0.05, 0.04, 0.66, C.woodD);
    v.box(sx * 0.4, TH / 2 - 0.03, 0, 0.06, 0.06, 0.06, C.iron); // the hinge pin
  }
  v.boxMin(-0.36, 0.34, -0.02, 0.36, 0.37, 0.02, C.woodD);
  v.boxMin(-0.32, TH, -0.24, 0.14, TH + 0.008, 0.22, '#4F7F63');          // green blotter
  v.boxMin(-0.32, TH, -0.24, 0.14, TH + 0.009, -0.22, '#3E6650');
  for (const [x, z] of [[-0.2, -0.1], [0.05, 0.12]]) v.box(x, TH + 0.0085, z, 0.06, 0.001, 0.03, '#2E4A3C'); // blots
  // stack of letters (right), each sheet a hair askew
  for (let k = 0; k < 7; k++) boxR(v, 0.28, TH + 0.005 + k * 0.009, -0.06, 0.22, 0.008, 0.16, jitter(k % 3 ? '#F4EEE0' : '#EDE4CF', 0.03, k), 0, -0.15 + Math.sin(k * 2.3) * 0.06, 0);
  // fanned envelopes (front right)
  ['#E3EEF6', '#F6F0E2', '#F2E2C8'].forEach((c, i) => boxR(v, 0.3 + i * 0.02, TH + 0.008 + i * 0.006, 0.18 - i * 0.02, 0.2, 0.006, 0.12, c, 0, 0.4 - i * 0.25, 0));
  // string-tied bundle (back right), a tin of stamps, a glass paperweight
  v.box(0.36, TH + 0.04, -0.26, 0.16, 0.08, 0.1, '#EFE6CF');
  v.box(0.36, TH + 0.04, -0.26, 0.17, 0.084, 0.008, '#B07A4A');
  v.box(0.36, TH + 0.04, -0.26, 0.008, 0.084, 0.11, '#B07A4A');
  prism(v, 0.19, TH + 0.02, 0.27, 0.05, 0.05, 0.04, C.postRed, 8);
  prism(v, 0.19, TH + 0.042, 0.27, 0.052, 0.052, 0.008, C.gold, 8);
  prism(v, 0.05, TH + 0.03, -0.18, 0.04, 0.045, 0.05, '#BFD3E0', 8);
  prism(v, 0.05, TH + 0.056, -0.18, 0.025, 0.035, 0.012, '#DCE8EE', 8);
  // her ink pot with a dip pen, a pen wiper rag
  jarInto(v, -0.4, TH, -0.22, true, 0.55);
  boxR(v, -0.34, TH + 0.11, -0.18, 0.008, 0.008, 0.22, C.ink, -0.9, 0.3, 0);
  boxR(v, -0.33, TH + 0.2, -0.25, 0.02, 0.03, 0.02, C.gold, -0.9, 0.3, 0);
  boxR(v, -0.42, TH + 0.008, 0.16, 0.12, 0.01, 0.09, '#8E5A5A', 0, 0.3, 0);
  // the little oil lamp: brass foot, glass chimney (unlit; the room decides the light)
  prism(v, -0.42, TH + 0.02, 0.0, 0.06, 0.07, 0.04, C.brass, 8);
  prism(v, -0.42, TH + 0.06, 0.0, 0.05, 0.04, 0.05, C.gold, 8);
  prism(v, -0.42, TH + 0.15, 0.0, 0.03, 0.045, 0.13, '#E8EEF0', 8);
  prism(v, -0.42, TH + 0.12, 0.0, 0.012, 0.012, 0.03, '#E2B33C', 6);
  root.add(v.mesh());
  // papers: the letter on the blotter and the addressed envelope on top of the fan
  const cnv = liveCanvas(512, 256, (g) => {
    g.clearRect(0, 0, 512, 256);
    g.fillStyle = '#FBF7EE'; g.fillRect(0, 0, 192, 256);
    g.fillStyle = 'rgba(120,150,190,0.45)'; for (let y = 34; y < 246; y += 18) g.fillRect(12, y, 168, 1.5);
    g.fillStyle = 'rgba(200,90,90,0.4)'; g.fillRect(28, 0, 1.5, 256);
    for (let k = 0; k < 9; k++) scrawl(g, 34, 30 + k * 18, k === 8 ? 60 : 140, k + 3);
    g.fillStyle = '#F6F0E2'; g.fillRect(200, 0, 200, 120);
    g.strokeStyle = '#D9CDB4'; g.lineWidth = 3; g.strokeRect(201, 1, 198, 118);
    g.fillStyle = '#B8323A'; g.fillRect(352, 10, 36, 44);
    g.strokeStyle = '#F6F0E2'; g.setLineDash([3, 3]); g.strokeRect(355, 13, 30, 38); g.setLineDash([]);
    fitText(g, 'မသီတာ', 300, 74, 30, 150, { color: '#2E3D63', weight: 400 });
    scrawl(g, 236, 100, 120, 31, '#2E3D63', 2);
  });
  const q = new Quads(512, 256);
  q.add(-0.09, TH + 0.0105, -0.01, 0.26, 0.34, [0, 0, 192, 256], -Math.PI / 2, 0.12, 0);
  const ey = TH + 0.008 + 2 * 0.006 + 0.0045;
  q.add(0.34, ey, 0.14, 0.2, 0.12, [200, 0, 200, 120], -Math.PI / 2, 0.4 - 2 * 0.25, 0);
  root.add(q.mesh(cnv.tex));
  const shadow = shadowUnder(root, 0.6, 0.45, 0, 0, 0.4);
  return { root, dispose() { shadow.geometry.dispose(); disposeTree(root); } };
}

/**
 * Frees this module's shared caches (the lamp-halo texture, the mist texture, the prism geometries).
 * Per-prop dispose() never touches them, since other props may still use them; call this once when the
 * whole Junction/Wharf scene is torn down. They are rebuilt on demand afterwards.
 */
export function disposeShared() {
  haloTex?.dispose(); haloTex = null;
  mistTex?.dispose(); mistTex = null;
  for (const g of cylCache.values()) g.dispose();
  cylCache.clear();
}
