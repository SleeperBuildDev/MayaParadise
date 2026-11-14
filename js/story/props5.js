// Outdoor props for Hearth Row (Days 9, 11, 13) and the Diary Garden (Days 9-12), INDEX section 11.
// Same kit as props2.js: vertex-coloured boxes merged with VoxelBuilder (one toon draw call + one outline
// per moving part), Maya's palette, round things as blocky prisms. Feet at y = 0, fronts face +Z.
// Every Burmese string here is a draft for Maya. Nothing here points the player anywhere (no glow pins).
// WIRING: every { my } string below (signs, boards, notes, menu tags, name cards) is DRAFT: tag it «draft: Maya» in
// the day file that passes or shows it, and keep the English for her.
//
// LESSON MAP (INDEX section 14: which chapter each prop carries; "set" = how a state change plays it)
//   ch 14 (D9 Hearth Row, `bakery`)  bakeryFront (shell), breadCart (tip = the rough-mouth cost), loaf / breadTray, flourSacks
//   ch 15 (D9, Ei Mon)                noodleShopFront, noodleCounter('street'), backStep, tiffin (back-yard look), lampBench
//   ch 16 (D10 Garden, gate)          lockedGate (opens in its owner's time; Maya never goes in), trellisPost (tendril:
//                                     nothing stays the same), gardenBench (turns), bulbRack, seedBeds + nameStick +
//                                     seedTin + waterCan (the planting), diaryClasp (setOpen(1) from D10)
//   ch 17 (D10, `paperstore`/`kilntea`) paperStore (+ lockDoor, lampWindow), handCart + handSteelyard, trueWeight,
//                                     kilnBig, marketStall, paperBale
//   ch 18 (D11 Hearth Row)            noteWall (D9 bare -> D11 seven notes, setCurl, rosette, removeNote = picking up
//                                     fire burns you first), replyPin (hot note held), scorchRing, tornCrease (setLaced),
//                                     kiteBench, tinSapling (plant), tinLamp(Row), shopSign, paperBox(Tower),
//                                     practiceSheet, musicStand, wallCalendar, orderBook, noodleCounter('soup'|'dry'),
//                                     eveningClass, umbrella / twineCoil (hand props)
//   ch 19 (D12 Garden, rain)          seedBeds('flat'), gourdTrellis('down'), puddle, soakedSheets, paperBale({damp}),
//                                     rainFx + RAIN_TINT, gardenDiary (the diary line)
//   ch 20 (D12, `dryinghall`/`committeeroom`) angerPot (charcoalStove + ricePot: rattle() = catch the first rattle),
//                                     marketScale (setWeights('filed') -> 'true': checked facts), trueWeight,
//                                     glazeShelf + shardHeap, committeeTable + noticeBoard (the proper door)
//   ch 21 (D13 Hearth Row)            brickOven, ovenVent, backStep (`provingroom` door), coveredBundle (blue/green
//                                     tie), handLoom({ cover: 'on' | 'tagged' }) (covered = the touchy spot; the tag =
//                                     others can ask first), weavingShed
//
// HEARTH ROW
//   bakeryFront(o?)        { root, door, setOpen(0..1), setSmoke(0..1|bool), setLit(0..1), update(dt,t), dispose }
//   loaf(o?)               { root, setSplit(bool), dispose }
//   breadTray(n?, o?)      { root, setLoaves(n), setSplit(i), dispose }
//   breadCart(o?)          { root, body, setTipped(0..1), setTrays([n,n,n,n]), setTied(bool), dispose }
//   flourSacks(n?)         { root, seat, dispose }
//   noteWall(o?)           { root, setNote(i, note|null), setNotes([note]), removeNote(i), setCurl(0..1), dispose }
//   rosette()              { root, dispose }
//   replyPin()             { root, setHot(0..1), dispose }
//   diaryClasp(o?)         { root, setOpen(0..1), dispose }
//   scorchRing(o?)         { root, dispose }
//   tornCrease(o?)         { root, setLaced(bool), dispose }
//   shopSign(o?)           { root, setText(text|{my,en}), dispose }
//   tinLamp(o?)            { root, setLit(0..1), update(dt,t), dispose }
//   tinLampRow(points, o?) { root, setLit(0..1), dispose }       one instanced draw call for a lane of lamps
//   kiteBench()            { root, update(dt,t), dispose }
//   lampBench(o?)          { root, setLit(0..1), update(dt,t), dispose }
//   tinSapling(o?)         { root, plant(), setPlanted(bool), dispose }
//   umbrella(o?)           { root, setOpen(bool), dispose }
//   twineCoil()            { root, dispose }
// DIARY GARDEN (second half of the file)
//   lockedGate, trellisPost, bulbRack, seedBeds (= gardenBed), nameStick, gardenBench, seedTin, waterCan,
//   gourdTrellis, kilnBig (= bottleKiln), marketStall (= stallAwning), handCart, handSteelyard, paperBale,
//   charcoalStove, ricePot, angerPot, glazeShelf, shardHeap, marketScale, trueWeight, noticeBoard,
//   puddle, soakedSheets, rainFx, paperStore, lockDoor, lampWindow
// LATER ADDITIONS (shells and hand props, after the garden)
//   brickOven, ovenVent, backStep, noodleCounter(kind), eveningClass, weavingShed, tiffin, orderBook, paperBox,
//   paperBoxTower, practiceSheet, musicStand, coveredBundle, gardenDiary, committeeTable, wallCalendar,
//   handLoom({ cover: 'off'|'on'|'tagged', beam: 'full'|'empty' })  { root, setCover, setBeam, dispose }
//   noodleShopFront({ open, lit, title, menu, counter })  { root, door, counter, setOpen, setLit, setCurtain, update, dispose }
import * as THREE from '../game/three.js';
import { mergeGeometries } from '../game/three.js';
import { PALETTE, basic, toon, addOutline, blobShadow, fontsReady, FONT_MY, FONT_SERIF, roundRect } from '../game/toon.js';
import { VoxelBuilder, jitter } from '../game/voxel.js';
import { kiln, chalkSlate } from './props2.js';

// the open world's prop colours (props2.js) + Hearth Row / Garden extras
const C = {
  wood: PALETTE.wood, woodD: PALETTE.woodDark, woodL: '#CDA577', woodDD: '#5E3F27', gold: PALETTE.gold, goldD: PALETTE.goldDeep,
  maroon: PALETTE.maroon, maroonD: PALETTE.maroonDeep, cream: PALETTE.cream, white: PALETTE.white, ink: PALETTE.ink,
  paper: PALETTE.paper, parch: PALETTE.parchment, leaf: PALETTE.leaf, leafD: PALETTE.leafDark, leafL: '#8DBA6E', leafLL: '#A9CF85', rose: PALETTE.rose,
  terra: '#B5643C', terraL: '#CB7E4E', terraD: '#8E4A2C', soil: '#8A6648', soilD: '#6E5038', soilW: '#5C4231', brick: '#A0503A', brickD: '#7E3C2B', brickL: '#B8644A',
  mortar: '#D2B79A', stone: '#A39484', stoneL: '#C4B6A2', stoneD: '#7F7366', quoin: '#DCCBAE',
  glass: '#BFD3E0', mustard: '#E2B33C', chalk: '#3E4A3F', iron: '#4A3B30', ironL: '#6A5A4C', soot: '#2B1E19',
  crust: '#C8873E', crustL: '#DDA257', crustLL: '#E8B76C', crustD: '#9A5E2A', score: '#F2D79A', crumb: '#F6E9C8',
  tray: '#4E4842', trayL: '#6E675E', sack: '#E2D3AE', sackD: '#C4B088', flour: '#F7F2E6',
  brass: '#D4AE52', brassL: '#E8C978', brassD: '#9C7A2E', leather: '#7A4A2E', leatherD: '#56321E', leatherL: '#946042', stitch: '#EBD9AE',
  cork: '#B98E5C', corkD: '#A07A4C', tin: '#B9B5A9', tinL: '#DAD6CB', tinD: '#8C887E',
  bamboo: '#C9B26A', bambooD: '#9E8A48', bambooL: '#DCC98A', twine: '#D8C08A', twineD: '#B89E66',
  glaze: '#3E6FA8', glazeL: '#6A95C8', glazeD: '#2C4F7C', bulb: '#9A6B42', bulbD: '#77502F', bulbL: '#B8865A',
  gourd: '#A9C27A', gourdL: '#C6D99A', gourdD: '#7E9A55', tarp: '#4E7A6A', tarpD: '#3B5E51', tarpL: '#6A968A',
  water: '#9FB6C0', waterL: '#C9DAE0', waterD: '#7F98A4', clay: '#4A3A34', clayL: '#625049', foam: '#F4F1EA',
  green: '#4F7A5A', greenD: '#3C5F45', white2: '#F2ECDF',
};

// ---------------------------------------------------------------------------------------------
// small builders
// ---------------------------------------------------------------------------------------------
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
const _o = new THREE.Object3D();
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const ease = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };

/** Box with any turn (Euler, radians) about its own centre. order 'YXZ' = turn about Y last (tilt in local frame). */
function boxR(v, x, y, z, w, h, d, col, rx = 0, ry = 0, rz = 0, order = 'XYZ') {
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, order)), _s.set(w, h, d));
  v.add(UNIT, col, _m);
}

/** A stick / rope / beam from point a to point b (arrays), square section t. */
function stick(v, a, b, t, col, t2 = t) {
  _a.set(a[0], a[1], a[2]);
  _b.set(b[0], b[1], b[2]);
  _d.subVectors(_b, _a);
  const len = _d.length();
  if (len < 1e-5) return;
  _q.setFromUnitVectors(_up, _d.multiplyScalar(1 / len));
  _m.compose(_p.addVectors(_a, _b).multiplyScalar(0.5), _q, _s.set(t, len, t2));
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
    g.computeVertexNormals();
    cylCache.set(key, g);
  }
  return g;
}
/** Prism by centre, radius top/bottom and height; optional turn (rx, ry, rz). */
function prism(v, x, y, z, rTop, rBot, h, col, seg = 8, ry = 0, rx = 0, rz = 0) {
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(1, 1, 1));
  v.add(prismGeo(rTop, rBot, h, seg), col, _m);
}
/** A ring of n boxes (a wheel rim, a tin rim): centre, radius, box section, axis 'y' (flat) | 'z' (faces +Z) | 'x'. */
function ring(v, x, y, z, r, n, t, w, col, axis = 'y', a0 = 0) {
  const seg = (2 * Math.PI * r) / n + 0.004;
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2;
    const c = Math.cos(a) * r, s = Math.sin(a) * r;
    if (axis === 'y') boxR(v, x + c, y, z + s, seg, w, t, col, 0, -a + Math.PI / 2, 0);
    else if (axis === 'z') boxR(v, x + c, y + s, z, t, seg, w, col, 0, 0, a);
    else boxR(v, x, y + s, z + c, w, seg, t, col, a, 0, 0);
  }
}

function shadowUnder(root, rx, rz, x = 0, z = 0, opacity = 0.5) {
  const s = blobShadow(rx, rz, opacity);
  s.position.x = x;
  s.position.z = z;
  root.add(s);
  return s;
}

/** Frees geometries (and outline geometries) under root, plus extra disposables; detaches root. */
function disposeTree(root, own = []) {
  root.traverse((o) => {
    if (o.geometry && !o.userData.sharedGeo) o.geometry.dispose();
    if (o.isInstancedMesh) o.dispose();
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
function shade(hex, k) {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, c.r * k); c.g = Math.min(1, c.g * k); c.b = Math.min(1, c.b * k);
  return '#' + c.getHexString(THREE.SRGBColorSpace);
}

function canvasTex(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { cv, g: cv.getContext('2d'), tex };
}
/** Greedy word wrap (Burmese strings break at their spaces). */
function wrap(g, text, maxW) {
  const words = String(text).split(' ');
  const out = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}
const textOf = (t) => (t == null ? { my: '', en: '' } : typeof t === 'string' ? { my: t, en: '' } : { my: t.my ?? '', en: t.en ?? '' });

// shared soft glow (additive) texture
let haloTexture = null;
function haloTex() {
  if (haloTexture) return haloTexture;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,214,150,0.8)');
  grd.addColorStop(0.3, 'rgba(255,180,90,0.32)');
  grd.addColorStop(0.6, 'rgba(255,160,70,0.08)');
  grd.addColorStop(1, 'rgba(255,140,50,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  haloTexture = new THREE.CanvasTexture(cv);
  haloTexture.colorSpace = THREE.SRGBColorSpace;
  return haloTexture;
}
/**
 * A soft additive glow plane (own material: opacity is driven per prop). flat = lies on the ground.
 * Standing halos are capped (max, metres across) so a lamp reads as a small warm bloom, never a marker disc.
 */
const HALO_MAX = 0.6;
function halo(w, h, flat = false, max = flat ? 99 : HALO_MAX) {
  w = Math.min(w, max); h = Math.min(h, max);
  const mat = new THREE.MeshBasicMaterial({ map: haloTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  if (flat) { m.rotation.x = -Math.PI / 2; m.position.y = 0.02; }
  m.renderOrder = 2;
  m.raycast = () => {};
  m.visible = false;
  return m;
}
function setHalo(m, o) { m.material.opacity = o; m.visible = o > 0.01; }

/** An unlit glow material (lamp panes, door gaps) with a dark -> warm ramp. */
function glow(dark = '#3A2A1C', warm = '#FFC978') {
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(dark), toneMapped: false, vertexColors: true });
  const d = new THREE.Color(dark), w = new THREE.Color(warm);
  return { mat, set(t) { mat.color.copy(d).lerp(w, clamp01(t)); } };
}
/** A VoxelBuilder drawn with an unlit glow material (vertex colours tint it; paint them white-ish). */
function glowMesh(v, g) {
  const m = new THREE.Mesh(v.geometry(), g.mat);
  m.raycast = () => {};
  return m;
}

/**
 * Rising smoke: one instanced draw call of soft cream boxes from one or more chimney tops.
 * points: [[x, y, z], ...] in the parent's space.
 */
function smokeFx(points, { n = 12, rise = 2.4, size = 0.34, spread = 0.32, drift = 0.6, speed = 0.22, color = '#EEE8DC' } = {}) {
  const mesh = new THREE.InstancedMesh(UNIT, toon(color, { transparent: true, opacity: 0.86 }), n * points.length);
  mesh.frustumCulled = false;
  mesh.raycast = () => {};
  mesh.userData.sharedGeo = true;
  let amount = 1;
  function update(t) {
    let k = 0;
    for (let e = 0; e < points.length; e++) {
      const P = points[e];
      for (let i = 0; i < n; i++, k++) {
        const ph = (t * speed + i / n + e * 0.37) % 1;
        const grow = Math.min(1, ph / 0.12) * (1 - Math.max(0, (ph - 0.68) / 0.32));
        const s = size * (0.45 + ph * 1.35) * grow * amount;
        _o.position.set(P[0] + Math.sin(i * 2.3 + t * 0.7) * spread * ph + drift * ph * ph, P[1] + ph * rise, P[2] + Math.cos(i * 1.7 + t * 0.5) * spread * 0.5 * ph);
        _o.rotation.set(i * 0.7, ph * 2 + i, i * 0.3);
        _o.scale.setScalar(Math.max(0.0001, s));
        _o.updateMatrix();
        mesh.setMatrixAt(k, _o.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.visible = amount > 0.001;
  }
  update(0);
  return { mesh, update, setAmount(a) { amount = typeof a === 'boolean' ? (a ? 1 : 0) : clamp01(a); }, get amount() { return amount; } };
}

/** A plane with UVs remapped to a sub-rectangle of an atlas (u0, v0, u1, v1), placed at (x, y, z). */
function atlasQuad(w, h, x, y, z, u0, v0, u1, v1) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  g.translate(x, y, z);
  return g;
}

// ---------------------------------------------------------------------------------------------
// bread: loaves, trays, sacks
// ---------------------------------------------------------------------------------------------
/** One loaf (0.22 x 0.12 x 0.12 at s = 1), bottom at y, long axis on local X turned by ry. */
function loafInto(v, x, y, z, s = 1, ry = 0, split = false, seed = 0) {
  const L = 0.22 * s, Wd = 0.12 * s;
  const cs = Math.cos(ry), sn = Math.sin(ry);
  const at = (lx, lz) => [x + lx * cs + lz * sn, z - lx * sn + lz * cs];
  const tone = jitter(C.crust, 0.06, seed);
  boxR(v, x, y + 0.016 * s, z, L * 0.94, 0.032 * s, Wd * 0.9, C.crustD, 0, ry, 0);
  boxR(v, x, y + 0.055 * s, z, L, 0.05 * s, Wd, tone, 0, ry, 0);
  boxR(v, x, y + 0.088 * s, z, L * 0.9, 0.03 * s, Wd * 0.8, C.crustL, 0, ry, 0);
  boxR(v, x, y + 0.106 * s, z, L * 0.7, 0.012 * s, Wd * 0.5, C.crustLL, 0, ry, 0);
  for (const e of [-1, 1]) {
    const [ex, ez] = at(e * L * 0.5, 0);
    boxR(v, ex, y + 0.048 * s, ez, 0.03 * s, 0.058 * s, Wd * 0.74, C.crustD, 0, ry, 0);
  }
  if (!split) {
    for (let k = -1; k <= 1; k++) {
      const [sx, sz] = at(k * 0.058 * s, 0);
      boxR(v, sx, y + 0.114 * s, sz, 0.016 * s, 0.006 * s, Wd * 0.56, C.score, 0, ry + 0.62, 0);
    }
  } else {
    boxR(v, x, y + 0.11 * s, z, L * 0.82, 0.014 * s, Wd * 0.26, C.crumb, 0, ry, 0);
    for (const e of [-1, 1]) {
      const [ex, ez] = at(0, e * Wd * 0.19);
      boxR(v, ex, y + 0.117 * s, ez, L * 0.8, 0.018 * s, 0.022 * s, C.crustD, 0, ry, e * 0.25);
    }
  }
  // a dusting of flour
  const [fx, fz] = at(-0.05 * s, 0.02 * s);
  boxR(v, fx, y + 0.1 * s, fz, 0.03 * s, 0.006 * s, 0.025 * s, C.flour, 0, ry, 0);
}

/** A dark tin tray (0.7 x 0.05 x 0.45) with up to 9 loaves; tray centre at (x, y, z). */
function trayInto(v, x, y, z, n = 6, split = -1, seed = 0) {
  v.box(x, y + 0.008, z, 0.7, 0.016, 0.45, C.tray);
  for (const sz of [-1, 1]) v.box(x, y + 0.03, z + sz * 0.22, 0.7, 0.045, 0.012, C.trayL);
  for (const sx of [-1, 1]) {
    v.box(x + sx * 0.344, y + 0.03, z, 0.012, 0.045, 0.45, C.trayL);
    v.box(x + sx * 0.36, y + 0.045, z, 0.03, 0.012, 0.12, C.tray); // lip handles
  }
  for (let i = 0; i < Math.min(9, n); i++) {
    const col = i % 3, row = Math.floor(i / 3);
    loafInto(v, x - 0.22 + col * 0.22, y + 0.016, z - 0.14 + row * 0.14, 0.92, ((i * 7) % 3 - 1) * 0.06, i === split, seed + i);
  }
}

/** A single loaf. */
export function loaf({ split = false, scale = 1 } = {}) {
  const root = new THREE.Group();
  root.name = 'loaf';
  let mesh = null;
  const sh = shadowUnder(root, 0.15 * scale, 0.09 * scale, 0, 0, 0.4);
  function setSplit(b) {
    freeMesh(mesh);
    const v = new VoxelBuilder();
    loafInto(v, 0, 0, 0, scale, 0, !!b, 3);
    mesh = v.mesh({ px: 1.3 });
    root.add(mesh);
  }
  setSplit(split);
  return { root, setSplit, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

/** A tin tray of loaves. setLoaves(n) (0..9), setSplit(i) (-1 = none): one loaf split open on top. */
export function breadTray(n = 6, { split = -1 } = {}) {
  const root = new THREE.Group();
  root.name = 'breadTray';
  let mesh = null, count = n, sp = split;
  const sh = shadowUnder(root, 0.42, 0.28, 0, 0, 0.35);
  function rebuild() {
    freeMesh(mesh);
    const v = new VoxelBuilder();
    trayInto(v, 0, 0, 0, count, sp, 5);
    mesh = v.mesh({ px: 1.3 });
    root.add(mesh);
  }
  rebuild();
  return {
    root,
    setLoaves(k) { count = Math.max(0, Math.min(9, k | 0)); rebuild(); },
    setSplit(i) { sp = i; rebuild(); },
    dispose() { sh.geometry.dispose(); disposeTree(root); },
  };
}

/** A flour sack lying down (0.6 x 0.3 x 0.4), bottom at y. */
function sackInto(v, x, y, z, s = 1, ry = 0, seed = 0) {
  const cs = Math.cos(ry), sn = Math.sin(ry);
  const at = (lx, lz) => [x + lx * cs + lz * sn, z - lx * sn + lz * cs];
  const base = jitter(C.sack, 0.05, seed);
  boxR(v, x, y + 0.03 * s, z, 0.52 * s, 0.06 * s, 0.36 * s, C.sackD, 0, ry, 0);
  boxR(v, x, y + 0.14 * s, z, 0.56 * s, 0.18 * s, 0.4 * s, base, 0, ry, 0);
  boxR(v, x, y + 0.25 * s, z, 0.48 * s, 0.06 * s, 0.32 * s, shade(base, 1.04), 0, ry, 0);
  // tied ears at the corners of both ends
  for (const ex of [-1, 1]) for (const ez of [-1, 1]) {
    const [cx, cz] = at(ex * 0.3 * s, ez * 0.16 * s);
    boxR(v, cx, y + 0.2 * s, cz, 0.07 * s, 0.06 * s, 0.06 * s, C.sackD, 0, ry + ex * ez * 0.4, 0);
  }
  // stitched seam on one end, a printed stamp (maroon frame, gold wheat) on the front, flour on top
  for (let k = 0; k < 5; k++) {
    const [sx, sz] = at(0.282 * s, (-0.14 + k * 0.07) * s);
    boxR(v, sx, y + 0.2 * s, sz, 0.008 * s, 0.012 * s, 0.03 * s, C.woodD, 0, ry, 0);
  }
  const [px, pz] = at(-0.02 * s, 0.201 * s);
  boxR(v, px, y + 0.14 * s, pz, 0.24 * s, 0.11 * s, 0.006 * s, C.maroon, 0, ry, 0);
  boxR(v, px, y + 0.14 * s, pz + 0.002 * cs, 0.2 * s, 0.075 * s, 0.006 * s, C.sack, 0, ry, 0);
  for (let k = 0; k < 3; k++) {
    const [wx, wz] = at((-0.05 + k * 0.05) * s, 0.205 * s);
    boxR(v, wx, y + 0.14 * s, wz, 0.012 * s, 0.05 * s, 0.006 * s, C.goldD, 0, ry, (k - 1) * 0.35);
  }
  const [fx, fz] = at(0.06 * s, -0.04 * s);
  boxR(v, fx, y + 0.283 * s, fz, 0.2 * s, 0.008 * s, 0.14 * s, C.flour, 0, ry + 0.3, 0);
}

/** Stacked flour sacks (2 below, 1 above, then a second row behind). seat: the top sack (sittable). */
export function flourSacks(n = 3) {
  const root = new THREE.Group();
  root.name = 'flourSacks';
  const spots = [[-0.31, 0, 0.02, 0.05], [0.31, 0, 0, -0.06], [0, 0.29, 0.01, 0.1], [-0.3, 0, -0.44, -0.04], [0.32, 0, -0.43, 0.08], [0.02, 0.29, -0.42, -0.1]];
  const v = new VoxelBuilder();
  let top = 0;
  spots.slice(0, Math.max(1, n)).forEach(([x, y, z, ry], i) => { sackInto(v, x, y, z, 1, ry, i + 2); top = Math.max(top, y + 0.29); });
  // spilled flour on the ground
  boxR(v, 0.5, 0.004, 0.32, 0.26, 0.008, 0.14, C.flour, 0, 0.4, 0);
  boxR(v, 0.66, 0.004, 0.36, 0.08, 0.006, 0.06, C.flour, 0, -0.3, 0);
  root.add(v.mesh());
  const sh = shadowUnder(root, 0.75, n > 3 ? 0.65 : 0.38, 0, n > 3 ? -0.2 : 0, 0.42);
  const seat = new THREE.Vector3(0, top, 0);
  return { root, seat, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// the bakery front (building shell, 9 w x 4 h x 6 d, chimneys to 7 m)
// ---------------------------------------------------------------------------------------------
/** Paints a shop board: cream plank, gold rule, maroon Burmese title, small English line. */
function drawBoard(cv, t, { bg = '#F3E6C6', fg = C.maroon, rule = C.goldD, sub = '#7A5434', sprigs = true } = {}) {
  const g = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  g.clearRect(0, 0, W, H);
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // plank grain
  g.strokeStyle = 'rgba(120,84,52,0.12)';
  g.lineWidth = 2;
  for (let y = 10; y < H; y += 17) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + 4, W * 0.6, y - 4, W, y + 2); g.stroke(); }
  g.strokeStyle = rule;
  g.lineWidth = 4;
  g.strokeRect(10, 10, W - 20, H - 20);
  const hasEn = !!t.en;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = fg;
  const big = Math.round(H * (hasEn ? 0.4 : 0.5));
  g.font = `700 ${big}px ${FONT_MY}`;
  g.fillText(t.my, W / 2, H * (hasEn ? 0.42 : 0.52), W - 120);
  if (hasEn) {
    g.fillStyle = sub;
    g.font = `600 ${Math.round(H * 0.17)}px ${FONT_SERIF}`;
    g.fillText(t.en.toUpperCase().split('').join(' '), W / 2, H * 0.8, W - 120);
  }
  if (sprigs) {
    // little wheat sprigs either side
    g.fillStyle = C.goldD;
    for (const sx of [70, W - 70]) {
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.ellipse(sx - 9, H * 0.3 + k * 15, 5, 9, -0.5, 0, Math.PI * 2);
        g.ellipse(sx + 9, H * 0.3 + k * 15, 5, 9, 0.5, 0, Math.PI * 2);
        g.fill();
      }
      g.fillRect(sx - 1.5, H * 0.24, 3, H * 0.56);
    }
  }
}

/**
 * Hearth Row's bakery: a brick front with quoins, a tiled gable roof, two smoking chimneys, a wooden double door
 * (setOpen, half open by default) with warm light in the gap, two shop windows under striped awnings, the
 * «ပေါင်မုန့်» board, a big golden loaf over it, a bread rack and flour sacks on the kerb.
 * door: a local Vector3 just outside the doorway (where Maya stands to go in).
 */
export function bakeryFront({ open = 0.45, smoke = true, lit = 1, sign = { my: 'ပေါင်မုန့်', en: 'Bakery' } } = {}) {
  const root = new THREE.Group();
  root.name = 'bakeryFront';
  const W = 9, H = 4, D = 6, FZ = D / 2;
  const DW = 1.7, LH = 2.0, TH = 0.36, DY = 0.3; // doorway width, leaf height, transom, sill height
  const r = rand(91);
  const v = new VoxelBuilder();
  // plinth and footing
  v.boxMin(-W / 2 - 0.12, 0, -D / 2 - 0.06, W / 2 + 0.12, 0.3, FZ + 0.14, C.stone);
  v.boxMin(-W / 2 - 0.12, 0.27, FZ + 0.08, W / 2 + 0.12, 0.33, FZ + 0.16, C.stoneL);
  for (let x = -W / 2 + 0.3; x < W / 2; x += 0.62) v.box(x, 0.13, FZ + 0.145, 0.014, 0.22, 0.01, C.stoneD);
  // body behind a front skin with the door hole
  v.boxMin(-W / 2, 0.3, -D / 2, W / 2, H, FZ - 0.3, C.brickD);
  v.boxMin(-W / 2, 0.3, FZ - 0.3, -DW / 2, H, FZ, C.brick);
  v.boxMin(DW / 2, 0.3, FZ - 0.3, W / 2, H, FZ, C.brick);
  v.boxMin(-DW / 2, DY + LH + TH, FZ - 0.3, DW / 2, H, FZ, C.brick);
  // mortar courses and odd bricks (colour texture through blocks)
  for (let y = 0.52, k = 0; y < H - 0.15; y += 0.22, k++) {
    const segs = y < DY + LH + TH + 0.05 ? [[-W / 2, -DW / 2 - 0.1], [DW / 2 + 0.1, W / 2]] : [[-W / 2, W / 2]];
    for (const [x0, x1] of segs) v.boxMin(x0, y - 0.009, FZ, x1, y + 0.009, FZ + 0.008, C.mortar);
    for (let j = 0; j < 7; j++) {
      const x = -W / 2 + 0.4 + r() * (W - 0.8);
      if (Math.abs(x) < DW / 2 + 0.3 && y < DY + LH + TH + 0.1) continue;
      v.box(x, y + 0.11, FZ + 0.006, 0.26, 0.19, 0.014, jitter(r() > 0.5 ? C.brickL : C.brickD, 0.08, k * 9 + j));
    }
  }
  // quoins
  for (const sx of [-1, 1]) for (let y = 0.3, k = 0; y < H - 0.1; y += 0.36, k++) {
    const w = k % 2 ? 0.26 : 0.4;
    v.box(sx * (W / 2 - w / 2 + 0.02), y + 0.17, FZ + 0.015, w, 0.32, 0.05, jitter(C.quoin, 0.04, k + sx));
  }
  // cornice: cream cap, maroon dentils, gold rule
  v.boxMin(-W / 2 - 0.16, H - 0.1, FZ - 0.1, W / 2 + 0.16, H + 0.06, FZ + 0.14, C.cream);
  v.boxMin(-W / 2 - 0.1, H - 0.17, FZ, W / 2 + 0.1, H - 0.1, FZ + 0.06, C.gold);
  for (let x = -W / 2 + 0.05; x < W / 2; x += 0.3) v.box(x, H - 0.24, FZ + 0.035, 0.12, 0.08, 0.06, C.maroon);
  // gable roof, ridge along X
  const RH = 1.7, EZ = FZ + 0.45, RY = H + 0.06;
  const slopeL = Math.hypot(EZ, RH), ang = Math.atan2(RH, EZ);
  for (const side of [1, -1]) {
    const cz = side * EZ / 2, cy = RY + RH / 2;
    boxR(v, 0, cy, cz, W + 0.6, 0.1, slopeL, C.terraD, side * ang, 0, 0);
    // tile courses with staggered seams
    const nC = 11;
    for (let k = 0; k < nC; k++) {
      const f = (k + 0.5) / nC; // 0 = ridge, 1 = eave
      const zz = side * EZ * f, yy = RY + RH * (1 - f) + 0.07;
      boxR(v, 0, yy, zz, W + 0.56, 0.05, slopeL / nC + 0.02, jitter(k % 2 ? C.terra : C.terraL, 0.04, k + side * 20), side * ang, 0, 0);
      if (side > 0) {
        for (let x = -W / 2 + (k % 2 ? 0.2 : 0.42); x < W / 2 + 0.2; x += 0.44) {
          boxR(v, x, yy + 0.028, zz, 0.025, 0.012, slopeL / nC, C.terraD, side * ang, 0, 0);
          if (r() < 0.06) boxR(v, x + 0.22, yy + 0.03, zz, 0.4, 0.02, slopeL / nC - 0.04, jitter(C.terraD, 0.1, x * 7), side * ang, 0, 0);
        }
      }
    }
  }
  v.box(0, RY + RH + 0.08, 0, W + 0.66, 0.14, 0.24, C.terraD); // ridge cap
  for (let x = -W / 2; x <= W / 2 + 0.01; x += 0.5) v.box(x, RY + RH + 0.16, 0, 0.12, 0.04, 0.26, C.terra);
  for (const sx of [-1, 1]) {
    v.box(sx * (W / 2 + 0.3), RY + RH + 0.25, 0, 0.12, 0.3, 0.12, C.gold); // finials
    v.box(sx * (W / 2 + 0.3), RY + RH + 0.44, 0, 0.07, 0.08, 0.07, C.goldD);
    // brick gable ends (stepped under the roof) and maroon barge boards
    for (let y = RY; y < RY + RH; y += 0.2) {
      const dz = (1 - (y - RY + 0.1) / RH) * EZ;
      v.box(sx * (W / 2 - 0.15), y + 0.1, 0, 0.3, 0.2, Math.max(0.05, dz * 2 - 0.1), C.brickD);
    }
    for (const side of [1, -1]) boxR(v, sx * (W / 2 + 0.31), RY + RH / 2 + 0.02, side * EZ / 2, 0.06, 0.18, slopeL + 0.1, C.maroon, side * ang, 0, 0);
  }
  // gutter and downpipes
  v.box(0, RY - 0.02, EZ - 0.02, W + 0.6, 0.09, 0.1, C.tinD);
  for (const sx of [-1, 1]) {
    v.box(sx * (W / 2 + 0.2), (RY + 0.3) / 2, FZ + 0.25, 0.08, RY - 0.3, 0.08, C.tin);
    for (const y of [1, 2.2, 3.4]) v.box(sx * (W / 2 + 0.2), y, FZ + 0.2, 0.12, 0.04, 0.12, C.tinD);
    v.box(sx * (W / 2 + 0.2), 0.38, FZ + 0.32, 0.1, 0.08, 0.2, C.tin);
  }
  // chimneys
  const CH = [[-2.7, -0.7], [2.9, -0.9]];
  const smokeAt = [];
  for (const [cx, cz] of CH) {
    const top = 7.0;
    v.boxMin(cx - 0.36, H, cz - 0.36, cx + 0.36, top, cz + 0.36, C.brick);
    for (let y = H + 0.3; y < top - 0.1; y += 0.24) v.boxMin(cx - 0.365, y, cz - 0.365, cx + 0.365, y + 0.02, cz + 0.365, C.mortar);
    v.boxMin(cx - 0.45, top - 0.06, cz - 0.45, cx + 0.45, top + 0.1, cz + 0.45, C.stoneL);
    v.boxMin(cx - 0.4, top - 0.24, cz - 0.4, cx + 0.4, top - 0.16, cz + 0.4, C.brickD);
    for (const dx of [-0.16, 0.17]) {
      prism(v, cx + dx, top + 0.24, cz, 0.08, 0.1, 0.28, C.terra);
      prism(v, cx + dx, top + 0.39, cz, 0.1, 0.1, 0.04, C.terraD);
      prism(v, cx + dx, top + 0.412, cz, 0.06, 0.06, 0.006, C.soot);
      smokeAt.push([cx + dx, top + 0.5, cz]);
    }
    v.boxMin(cx - 0.37, top - 0.7, cz - 0.37, cx + 0.37, top - 0.4, cz + 0.37, '#6B3A2C'); // soot-dark band
  }
  // doorway: jambs, lintel, transom bars, a stone step, and the dark-warm reveal
  for (const sx of [-1, 1]) {
    v.boxMin(sx * DW / 2 - (sx > 0 ? 0 : 0.18), DY, FZ - 0.3, sx * DW / 2 + (sx > 0 ? 0.18 : 0), DY + LH + TH + 0.1, FZ + 0.08, C.woodD);
    v.box(sx * (DW / 2 + 0.09), DY + LH + TH + 0.17, FZ + 0.1, 0.26, 0.1, 0.1, C.gold);
  }
  v.boxMin(-DW / 2 - 0.26, DY + LH + TH, FZ - 0.3, DW / 2 + 0.26, DY + LH + TH + 0.16, FZ + 0.1, C.woodD);
  v.boxMin(-DW / 2, DY + LH - 0.02, FZ - 0.12, DW / 2, DY + LH + 0.04, FZ - 0.04, C.woodD); // transom bar
  for (let k = 1; k < 6; k++) v.box(-DW / 2 + (k * DW) / 6, DY + LH + TH / 2, FZ - 0.08, 0.03, TH, 0.04, C.woodD);
  v.boxMin(-DW / 2 - 0.25, 0, FZ + 0.14, DW / 2 + 0.25, 0.18, FZ + 0.6, C.stoneL);
  v.boxMin(-DW / 2 - 0.25, 0.17, FZ + 0.14, DW / 2 + 0.25, 0.19, FZ + 0.6, C.stone);
  v.boxMin(-DW / 2, DY, FZ - 0.3, DW / 2, DY + 0.02, FZ, C.woodDD); // threshold
  // shop windows under striped awnings
  for (const sx of [-1, 1]) {
    const wx = sx * 2.75, WW = 1.7, WH = 1.25, WY = 1.0;
    v.boxMin(wx - WW / 2 - 0.1, WY - 0.12, FZ, wx + WW / 2 + 0.1, WY, FZ + 0.26, C.stoneL); // sill
    v.boxMin(wx - WW / 2 - 0.06, WY - 0.06, FZ + 0.2, wx + WW / 2 + 0.06, WY, FZ + 0.27, C.stone);
    for (const fx of [-1, 1]) v.box(wx + fx * (WW / 2 + 0.04), WY + WH / 2, FZ + 0.08, 0.1, WH + 0.04, 0.16, C.maroon);
    v.box(wx, WY + WH + 0.04, FZ + 0.08, WW + 0.18, 0.1, 0.16, C.maroon);
    v.box(wx, WY + WH / 2 + 0.05, FZ + 0.14, 0.05, WH, 0.04, C.maroonD); // mullion
    v.box(wx, WY + WH * 0.62, FZ + 0.14, WW, 0.04, 0.04, C.maroonD); // transom
    v.box(wx, WY + WH + 0.1, FZ + 0.17, WW + 0.2, 0.025, 0.02, C.gold);
    // display shelf of loaves behind the glass
    v.boxMin(wx - WW / 2 + 0.04, WY + 0.02, FZ + 0.02, wx + WW / 2 - 0.04, WY + 0.06, FZ + 0.12, C.woodL);
    for (let k = 0; k < 5; k++) loafInto(v, wx - 0.64 + k * 0.32, WY + 0.06, FZ + 0.07, 1.05, ((k % 2) - 0.5) * 0.3, false, k + sx * 10);
    v.boxMin(wx - WW / 2 + 0.04, WY + 0.5, FZ + 0.02, wx + WW / 2 - 0.04, WY + 0.53, FZ + 0.1, C.woodL);
    for (let k = 0; k < 4; k++) { prism(v, wx - 0.55 + k * 0.37, WY + 0.6, FZ + 0.06, 0.07, 0.08, 0.13, k % 2 ? C.crust : C.crustL, 8); prism(v, wx - 0.55 + k * 0.37, WY + 0.675, FZ + 0.06, 0.04, 0.07, 0.03, C.crustLL, 8); }
    // shutters folded open, with slats
    for (const fx of [-1, 1]) {
      const shx = wx + fx * (WW / 2 + 0.36);
      v.box(shx, WY + WH / 2, FZ + 0.05, 0.5, WH + 0.04, 0.05, C.green);
      for (let y = WY + 0.12; y < WY + WH - 0.05; y += 0.12) v.box(shx, y, FZ + 0.08, 0.42, 0.03, 0.02, C.greenD);
      v.box(shx - fx * 0.2, WY + WH * 0.3, FZ + 0.09, 0.03, 0.06, 0.03, C.gold);
    }
    // striped awning on two iron arms, scalloped valance
    const A0 = WY + WH + 0.35, A1 = A0 - 0.42, AZ = 0.95, aw = WW + 0.5;
    const al = Math.hypot(AZ, A0 - A1), aa = Math.atan2(A0 - A1, AZ);
    const ns = 9;
    for (let k = 0; k < ns; k++) boxR(v, wx - aw / 2 + (k + 0.5) * (aw / ns), (A0 + A1) / 2, FZ + AZ / 2, aw / ns + 0.002, 0.04, al, k % 2 ? C.cream : C.maroon, aa, 0, 0);
    for (let k = 0; k < ns; k++) {
      v.box(wx - aw / 2 + (k + 0.5) * (aw / ns), A1 - 0.08, FZ + AZ + 0.01, aw / ns - 0.02, 0.14, 0.03, k % 2 ? C.cream : C.maroon);
      v.box(wx - aw / 2 + (k + 0.5) * (aw / ns), A1 - 0.17, FZ + AZ + 0.01, aw / ns * 0.5, 0.05, 0.03, k % 2 ? C.cream : C.maroon);
    }
    v.box(wx, A0 + 0.03, FZ + 0.03, aw + 0.04, 0.06, 0.08, C.goldD);
    for (const fx of [-1, 1]) stick(v, [wx + fx * aw / 2, A0 - 0.6, FZ], [wx + fx * aw / 2, A1 - 0.02, FZ + AZ], 0.03, C.iron);
  }
  // wall lantern on a scroll bracket, left of the door
  {
    const lx = -1.32, ly = 2.55;
    v.box(lx, ly + 0.3, FZ + 0.03, 0.12, 0.2, 0.04, C.iron);
    v.box(lx, ly + 0.35, FZ + 0.18, 0.04, 0.04, 0.3, C.iron);
    v.box(lx, ly + 0.25, FZ + 0.31, 0.03, 0.12, 0.03, C.iron);
    v.box(lx, ly + 0.16, FZ + 0.31, 0.2, 0.05, 0.2, C.iron);
    v.box(lx, ly - 0.14, FZ + 0.31, 0.16, 0.04, 0.16, C.iron);
    for (const fx of [-1, 1]) for (const fz of [-1, 1]) v.box(lx + fx * 0.075, ly, FZ + 0.31 + fz * 0.075, 0.02, 0.28, 0.02, C.iron);
  }
  // the sign board's plank and frame (the painted face is a canvas plane)
  const SW = 2.7, SH = 0.66, SY = DY + LH + TH + 0.62;
  v.boxMin(-SW / 2 - 0.08, SY - SH / 2 - 0.08, FZ + 0.02, SW / 2 + 0.08, SY + SH / 2 + 0.08, FZ + 0.1, C.woodD);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) v.box(sx * (SW / 2 + 0.03), SY + sy * (SH / 2 + 0.03), FZ + 0.11, 0.06, 0.06, 0.02, C.gold);
  // the big golden loaf over the cornice (the shop's emblem)
  loafInto(v, 0, H + 0.08, FZ - 0.05, 4.2, 0, false, 40);
  v.boxMin(-0.42, H + 0.02, FZ - 0.3, 0.42, H + 0.1, FZ + 0.18, C.goldD);
  // kerb: a bread rack beside the door and flour sacks on the other side
  {
    const rx = 1.62, rz = FZ + 0.82;
    for (const fx of [-1, 1]) for (const fz of [-1, 1]) v.box(rx + fx * 0.42, 0.55, rz + fz * 0.2, 0.05, 1.1, 0.05, C.woodD);
    v.box(rx, 1.12, rz, 0.95, 0.04, 0.48, C.wood);
    for (const [k, y] of [0.18, 0.52, 0.86].entries()) {
      v.box(rx, y, rz, 0.9, 0.03, 0.46, C.woodL);
      for (let j = 0; j < 3; j++) loafInto(v, rx - 0.28 + j * 0.28, y + 0.015, rz + (j % 2 ? -0.08 : 0.07), 1, (j - 1) * 0.15, false, k * 3 + j);
      if (k === 1) loafInto(v, rx + 0.02, y + 0.015, rz + 0.13, 1, 1.4, true, 33);
    }
    v.box(rx, 1.2, rz - 0.2, 0.9, 0.12, 0.03, C.maroon);
    v.box(rx, 1.2, rz - 0.18, 0.84, 0.02, 0.01, C.gold);
  }
  sackInto(v, -1.55, 0, FZ + 0.62, 1, 0.25, 7);
  sackInto(v, -1.5, 0.29, FZ + 0.6, 0.95, -0.15, 8);
  sackInto(v, -2.2, 0, FZ + 0.75, 1, 1.35, 9);
  boxR(v, -1.1, 0.004, FZ + 0.85, 0.3, 0.008, 0.16, C.flour, 0, 0.5, 0);
  // a bench under the right window for the queue
  for (const fx of [-1, 1]) v.box(3.15 + fx * 0.6, 0.2, FZ + 0.62, 0.08, 0.4, 0.3, C.woodD);
  v.box(3.15, 0.42, FZ + 0.62, 1.45, 0.05, 0.36, C.wood);
  v.box(3.15, 0.42, FZ + 0.8, 1.45, 0.05, 0.02, C.woodD);
  const body = v.mesh();
  root.add(body);

  // warm light: doorway reveal, transom and shop-window backs (one unlit material)
  const g = glow('#3A2A1C', '#FFC978');
  const gv = new VoxelBuilder();
  gv.box(0, DY + LH / 2, FZ - 0.29, DW, LH, 0.01, '#ffffff');
  gv.box(0, DY + LH + TH / 2, FZ - 0.11, DW, TH - 0.04, 0.01, '#FFE6B8');
  for (const sx of [-1, 1]) gv.box(sx * 2.75, 1.0 + 0.625, FZ + 0.004, 1.66, 1.21, 0.01, '#FFE2B0');
  gv.box(-1.32, 2.55, FZ + 0.31, 0.13, 0.26, 0.13, '#FFF0D0'); // the lantern
  const glowM = glowMesh(gv, g);
  root.add(glowM);
  const pool = halo(2.8, 2.0, true);
  pool.position.set(0, 0.2, FZ + 1.1);
  root.add(pool);
  const lampHalo = halo(0.9, 0.9);
  lampHalo.position.set(-1.32, 2.55, FZ + 0.45);
  root.add(lampHalo);

  // the double door: two plank leaves hinged on the jambs, opening inward
  const leaves = [-1, 1].map((sx) => {
    const hinge = new THREE.Group();
    hinge.position.set(sx * (DW / 2 - 0.01), DY, FZ - 0.09);
    root.add(hinge);
    const lv = new VoxelBuilder();
    const LW = DW / 2 - 0.01, dir = -sx; // leaf runs from the hinge toward the middle
    const cx = (dir * LW) / 2;
    lv.box(cx, LH / 2, 0, LW, LH, 0.06, C.wood);
    for (const ex of [-1, 1]) lv.box(cx + ex * (LW / 2 - 0.05), LH / 2, 0.035, 0.1, LH, 0.02, C.woodD);
    for (const y of [0.06, LH * 0.5, LH - 0.06]) lv.box(cx, y, 0.035, LW, 0.1, 0.02, C.woodD);
    for (const y of [LH * 0.27, LH * 0.75]) {
      lv.box(cx, y, 0.04, LW - 0.22, LH * 0.38, 0.02, jitter(C.woodL, 0.04, y));
      lv.box(cx, y, 0.052, LW - 0.34, LH * 0.28, 0.01, C.wood);
    }
    lv.box(dir * (LW - 0.1), LH * 0.5, 0.07, 0.04, 0.16, 0.04, C.gold); // handle
    lv.box(dir * (LW - 0.1), LH * 0.5 + 0.1, 0.06, 0.06, 0.04, 0.02, C.goldD);
    for (const y of [0.25, LH - 0.25]) lv.box(dir * 0.05, y, 0.04, 0.16, 0.05, 0.02, C.iron); // hinge straps
    const leaf = lv.mesh();
    hinge.add(leaf);
    return { hinge, sx };
  });

  // painted sign face
  const { cv, tex } = canvasTex(1024, 256);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), basic('#ffffff', { map: tex }));
  board.position.set(0, SY, FZ + 0.105);
  root.add(board);
  const st = textOf(sign);
  const draw = () => { drawBoard(cv, st); tex.needsUpdate = true; };
  draw();
  fontsReady().then(draw);

  const sm = smokeFx(smokeAt, { n: 9, rise: 2.6, size: 0.36, drift: 0.7 });
  root.add(sm.mesh);
  const sh = shadowUnder(root, W * 0.62, D * 0.62, 0, 0.2, 0.4);

  let openT = 0, litT = 1;
  function setOpen(t) {
    openT = clamp01(t);
    const a = ease(openT) * 1.55;
    for (const l of leaves) l.hinge.rotation.y = l.sx < 0 ? a : -a;
    setHalo(pool, Math.min(1, openT * 1.6) * litT * 0.75);
  }
  function setLit(t) { litT = clamp01(t); g.set(0.15 + litT * 0.85); setHalo(lampHalo, litT * 0.7); setOpen(openT); }
  setLit(lit);
  setOpen(open);
  sm.setAmount(smoke);
  root.userData.footprint = { w: W + 0.4, d: D + 0.4 };
  return {
    root,
    door: new THREE.Vector3(0, 0, FZ + 0.9),
    setOpen, setLit,
    setSmoke: sm.setAmount,
    update(dt, t) { sm.update(t); },
    dispose() { g.mat.dispose(); tex.dispose(); board.material.dispose(); pool.material.dispose(); lampHalo.material.dispose(); sh.geometry.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// bread cart (1.3 x 1.0 x 0.8): two wheels, four tray slots, rope cleats; tips forward on its axle
// ---------------------------------------------------------------------------------------------
function wheelInto(v, x, y, z, R, { spokes = 8, tyre = C.iron, rim = C.wood, hub = C.goldD, t = 0.06 } = {}) {
  ring(v, x, y, z, R, 16, 0.07, t, tyre, 'z');
  ring(v, x, y, z, R - 0.05, 16, 0.04, t * 0.8, rim, 'z');
  for (let k = 0; k < spokes; k++) {
    const a = (k / spokes) * Math.PI * 2 + 0.2;
    boxR(v, x + Math.cos(a) * R * 0.48, y + Math.sin(a) * R * 0.48, z, R * 0.9, 0.035, 0.035, rim, 0, 0, a);
  }
  prism(v, x, y, z, 0.07, 0.07, t + 0.06, hub, 8, 0, Math.PI / 2);
  prism(v, x, y, z + (z > 0 ? 1 : -1) * 0.05, 0.035, 0.035, 0.04, C.gold, 8, 0, Math.PI / 2);
}

/** A baker's push cart. setTipped(0..1) tips it forward over the axle; setTrays([n, n, n, n]) loaves per slot. */
// Lesson ch 14 (D9): setTipped = what a rough mouth spills; the bread is someone's morning.
export function breadCart({ trays = [6, 6, 5, 6], tied = true, tipped = 0 } = {}) {
  const root = new THREE.Group();
  root.name = 'breadCart';
  const AX = 0.12, R = 0.3;
  const wv = new VoxelBuilder();
  for (const z of [-0.45, 0.45]) wheelInto(wv, AX, R, z, R);
  root.add(wv.mesh());
  const body = new THREE.Group();
  body.position.set(AX, R, 0);
  root.add(body);
  const v = new VoxelBuilder();
  const X0 = -0.42 - AX, X1 = 0.5 - AX, Y0 = 0.38 - R, Y1 = 1.0 - R, Z = 0.36;
  v.box(0, -0.02, 0, 0.06, 0.06, 0.84, C.iron); // axle
  v.boxMin(X0, Y0, -Z, X1, Y0 + 0.04, Z, C.woodD); // floor
  for (const x of [X0, X1]) for (const z of [-Z, Z]) v.boxMin(x - 0.025, Y0, z - 0.025, x + 0.025, Y1 + 0.04, z + 0.025, C.woodD);
  // slatted long sides with a painted panel on the front
  for (const z of [-Z, Z]) {
    for (let y = Y0 + 0.08; y < Y1; y += 0.14) v.boxMin(X0, y, z - 0.015, X1, y + 0.09, z + 0.015, jitter(C.wood, 0.06, y * 10 + z));
  }
  v.boxMin(X0 + 0.12, Y0 + 0.2, Z + 0.015, X1 - 0.12, Y1 - 0.12, Z + 0.03, C.maroon);
  v.boxMin(X0 + 0.15, Y0 + 0.23, Z + 0.03, X1 - 0.15, Y1 - 0.15, Z + 0.034, C.maroonD);
  v.boxMin(X0 + 0.14, Y1 - 0.135, Z + 0.03, X1 - 0.14, Y1 - 0.125, Z + 0.036, C.gold);
  v.boxMin(X0 + 0.14, Y0 + 0.215, Z + 0.03, X1 - 0.14, Y0 + 0.225, Z + 0.036, C.gold);
  loafInto(v, (X0 + X1) / 2, (Y0 + Y1) / 2 - 0.08, Z + 0.06, 1.3, 0, false, 9); // a carved loaf badge
  // closed front end with slats, an open back end with two bars (trays slide in there)
  for (let y = Y0 + 0.08; y < Y1; y += 0.14) v.boxMin(X1 - 0.015, y, -Z, X1 + 0.015, y + 0.09, Z, jitter(C.wood, 0.06, y * 13));
  for (const y of [Y0 + 0.3, Y1 - 0.02]) v.boxMin(X0 - 0.015, y, -Z, X0 + 0.015, y + 0.04, Z, C.woodD);
  // tray runners inside both long sides
  for (const y of [0.45, 0.6, 0.75, 0.9]) for (const z of [-Z + 0.04, Z - 0.04]) v.boxMin(X0, y - R - 0.02, z - 0.02, X1, y - R, z + 0.02, C.woodL);
  // top rail and rope cleats (horn cleats on each corner post)
  for (const z of [-Z, Z]) v.boxMin(X0 - 0.03, Y1, z - 0.04, X1 + 0.03, Y1 + 0.04, z + 0.04, C.woodL);
  for (const x of [X0, X1]) for (const z of [-Z, Z]) { v.box(x, Y1 - 0.1, z + Math.sign(z) * 0.04, 0.12, 0.03, 0.03, C.brassD); v.box(x, Y1 - 0.1, z + Math.sign(z) * 0.035, 0.03, 0.05, 0.03, C.brassD); }
  // shafts and grips, a prop leg
  for (const z of [-0.3, 0.3]) {
    stick(v, [X0, Y0 + 0.25, z], [-0.92 - AX, 0.78 - R, z], 0.05, C.woodD);
    stick(v, [-0.78 - AX, 0.74 - R, z], [-0.95 - AX, 0.79 - R, z], 0.065, C.leatherD);
    stick(v, [X0 + 0.05, Y0, z], [X0 + 0.02, -R, z], 0.05, C.woodD);
    v.box(X0 + 0.02, -R + 0.02, z, 0.09, 0.04, 0.09, C.iron);
  }
  stick(v, [-0.75 - AX, 0.7 - R, -0.3], [-0.75 - AX, 0.7 - R, 0.3], 0.035, C.woodD);
  body.add(v.mesh());
  // the load (rebuilt) and the lashing ropes (toggled)
  const loadG = new THREE.Group();
  body.add(loadG);
  let load = null, cur = trays.slice();
  function setTrays(list) {
    cur = (list || []).slice(0, 4);
    freeMesh(load);
    const lv = new VoxelBuilder();
    cur.forEach((n, i) => { if (n != null && n >= 0) trayInto(lv, (X0 + X1) / 2 + 0.02, 0.45 + i * 0.15 - R, 0, n, i === 3 && n > 4 ? 4 : -1, i * 11); });
    load = lv.mesh({ px: 1.2 });
    loadG.add(load);
  }
  const rv = new VoxelBuilder();
  for (const z of [-Z - 0.05, Z + 0.05]) {
    stick(rv, [X0, Y1 - 0.1, z], [X1, Y1 + 0.06, z * 0.4], 0.022, C.twine);
    stick(rv, [X1, Y1 - 0.1, z], [X0, Y1 + 0.06, z * 0.4], 0.022, C.twine);
  }
  stick(rv, [X0, Y1 + 0.06, -Z * 0.4], [X1, Y1 + 0.06, Z * 0.4], 0.022, C.twineD);
  stick(rv, [X1, Y1 + 0.06, -Z * 0.4], [X0, Y1 + 0.06, Z * 0.4], 0.022, C.twineD);
  const ropes = rv.mesh({ px: 1.1 });
  body.add(ropes);
  const sh = shadowUnder(root, 0.85, 0.55, -0.1, 0, 0.45);
  function setTipped(t) {
    t = ease(t);
    body.rotation.z = -t * 1.02;
    loadG.position.x = t * 0.1;
  }
  setTrays(trays);
  setTipped(tipped);
  ropes.visible = !!tied;
  return { root, body, setTipped, setTrays, setTied(b) { ropes.visible = !!b; }, get trays() { return cur.slice(); }, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// the Note Wall (7.0 w x 2.2 h): seven quarrel notes, curling corners, reply-pin tins
// ---------------------------------------------------------------------------------------------
const WALL_NOTES = [
  { my: 'ဒေါ်ခင်မေ့ ပေါင်မုန့် တူးနေပြန်ပြီ', en: "Daw Khin May's bread burnt again", heat: 0.75 },
  { my: 'ဒေါ်စောယုဆိုင်ထဲက ခေါက်ဆွဲ နှစ်မျိုး: ဘယ်ဟာ မှန်လဲ', en: 'Two kinds of noodles: which is right?', heat: 0.6 },
  { my: 'ပန်းလေးရဲ့ "တစ်နေ့ကျရင်" အပင်', en: 'Pan\'s "someday" tree', heat: 0.45 },
  { my: 'အလုပ်ရုံလမ်းက ဆိုင်းဘုတ်အသစ်', en: 'The new sign on the workshop lane', heat: 1, pins: 30, hook: true },
  { my: 'ညနေတန်း လှေကားထစ်က စက္ကူဘူးတွေ', en: 'The paper boxes on the class steps', heat: 0.4 },
  { my: 'လက်ဖက်ရည်ဆိုင် သီချင်း: နှစ်ယောက်လား၊ တစ်ယောက်တည်းလား', en: 'The tea-shop song: a duet, or not?', heat: 0.55 },
  { my: 'ဦးချစ် ပြောတာတွေ', en: 'Things Uncle Chit says', heat: 0.1, hearts: true },
];
const NOTE_TINTS = ['#F7F0DE', '#F3E8D0', '#F9F3E6', '#F1E6CC', '#F6EEDC', '#F4EBD6', '#F8F1E2'];

function drawFlame(g, x, y, s, r) {
  g.beginPath();
  g.moveTo(x, y - 14 * s);
  g.bezierCurveTo(x + 9 * s, y - 4 * s, x + 7 * s, y + 7 * s, x, y + 8 * s);
  g.bezierCurveTo(x - 7 * s, y + 7 * s, x - 9 * s, y - 2 * s, x - 2 * s, y - 6 * s + r * 3);
  g.closePath();
  g.fillStyle = '#EC8A2E';
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = '#C8323C';
  g.stroke();
}
function drawHeart(g, x, y, s) {
  g.beginPath();
  g.moveTo(x, y + 6 * s);
  g.bezierCurveTo(x - 10 * s, y - 2 * s, x - 5 * s, y - 9 * s, x, y - 4 * s);
  g.bezierCurveTo(x + 5 * s, y - 9 * s, x + 10 * s, y - 2 * s, x, y + 6 * s);
  g.fillStyle = '#C8323C';
  g.fill();
}

/**
 * Hearth Row's wall newspaper: a plank board on two posts under a little roof, cork panel, seven note slots, a ledge
 * with a reply-pin tin under each, a drawer and stool at the west end, a bare patch of earth at the east end.
 * note: { my, en, heat 0..1 (red/orange scribbles, never words), pins (pins stuck in it), hook (empty brass hook
 * beside it), ribbon (rosette on that hook), hearts (a list with hearts) } | null (bare cork).
 * notes: how many of the seven default quarrel notes to show (0 = bare board, Day 9 uses setNotes).
 */
// Lesson ch 18 (D11; bare board D9): seven quarrel notes, setCurl, rosette, removeNote(i) = putting the fire down.
export function noteWall({ notes = 7, curl = 0.6, title = { my: 'စာကပ်နံရံ', en: 'Note Wall' } } = {}) {
  const root = new THREE.Group();
  root.name = 'noteWall';
  const PX = 3.4, NW = 0.72, NH = 0.95, NY = 1.2, NZ = 0.066;
  const slotX = (i) => -2.76 + i * 0.92;
  const v = new VoxelBuilder();
  // posts on stone feet, plank board, cork panel and frame, header board
  for (const sx of [-1, 1]) {
    v.box(sx * PX, 0.06, 0, 0.3, 0.12, 0.3, C.stone);
    v.box(sx * PX, 1.17, 0, 0.16, 2.1, 0.16, C.woodD);
    v.box(sx * PX, 2.24, 0, 0.1, 0.1, 0.1, C.gold);
  }
  for (let x = -PX + 0.08, k = 0; x < PX - 0.05; x += 0.26, k++) v.boxMin(x, 0.42, -0.07, x + 0.25, 2.05, 0.03, jitter(C.wood, 0.07, k));
  v.boxMin(-PX + 0.1, 0.5, 0.03, PX - 0.1, 1.86, 0.055, C.cork);
  for (let k = 0; k < 40; k++) { const rr = rand(k + 4); v.box(-PX + 0.2 + rr() * (2 * PX - 0.4), 0.55 + rr() * 1.25, 0.056, 0.03, 0.02, 0.004, C.corkD); }
  v.boxMin(-PX + 0.06, 0.46, 0.02, PX - 0.06, 0.52, 0.08, C.woodD);
  v.boxMin(-PX + 0.06, 1.84, 0.02, PX - 0.06, 1.9, 0.08, C.woodD);
  v.boxMin(-PX + 0.06, 1.9, -0.02, PX - 0.06, 2.12, 0.07, C.maroon);
  v.boxMin(-PX + 0.08, 2.1, 0.0, PX - 0.08, 2.12, 0.075, C.gold);
  // little plank roof, front overhang 0.4
  const R0 = 2.36, R1 = 2.16;
  const rl = Math.hypot(0.62, R0 - R1), ra = Math.atan2(R0 - R1, 0.62);
  for (let x = -PX - 0.3, k = 0; x < PX + 0.3; x += 0.34, k++) boxR(v, x + 0.17, (R0 + R1) / 2, 0.15, 0.33, 0.05, rl, jitter(k % 2 ? C.woodL : C.wood, 0.05, k + 50), ra, 0, 0);
  v.box(0, R1 - 0.03, 0.47, 2 * PX + 0.66, 0.1, 0.04, C.maroon);
  v.box(0, R1 + 0.03, 0.49, 2 * PX + 0.66, 0.02, 0.02, C.gold);
  for (const sx of [-1, 1]) stick(v, [sx * PX, 2.0, 0.05], [sx * PX, R1, 0.4], 0.06, C.woodD);
  // ledge with tins
  v.boxMin(-PX + 0.1, 0.36, 0.0, PX - 0.1, 0.42, 0.24, C.woodD);
  for (let i = 0; i < 7; i++) {
    const x = slotX(i);
    v.box(x - 0.2, 0.3, 0.06, 0.04, 0.12, 0.12, C.woodD);
    prism(v, x, 0.46, 0.14, 0.05, 0.05, 0.08, C.tin, 8);
    prism(v, x, 0.465, 0.14, 0.052, 0.052, 0.035, i % 2 ? C.maroon : C.goldD, 8);
    prism(v, x, 0.502, 0.14, 0.046, 0.046, 0.006, C.soot, 8);
    for (let k = 0; k < 4; k++) { v.box(x - 0.02 + (k % 2) * 0.03, 0.53, 0.13 + (k >> 1) * 0.03, 0.006, 0.05, 0.006, C.tinD); v.box(x - 0.02 + (k % 2) * 0.03, 0.56, 0.13 + (k >> 1) * 0.03, 0.016, 0.016, 0.016, k % 2 ? C.brass : '#C8323C'); }
  }
  // west end: a little drawer chest and a stool; east end: bare earth
  v.box(-PX - 0.55, 0.32, 0.15, 0.5, 0.56, 0.4, C.wood);
  v.box(-PX - 0.55, 0.62, 0.15, 0.56, 0.05, 0.46, C.woodD);
  for (const y of [0.2, 0.44]) { v.box(-PX - 0.55, y, 0.36, 0.44, 0.2, 0.02, C.woodL); v.box(-PX - 0.55, y, 0.38, 0.08, 0.03, 0.03, C.brass); }
  for (const fx of [-1, 1]) for (const fz of [-1, 1]) v.box(-PX + 0.05 + fx * 0.12, 0.2, 0.75 + fz * 0.12, 0.04, 0.4, 0.04, C.woodD);
  v.box(-PX + 0.05, 0.42, 0.75, 0.36, 0.05, 0.36, C.woodL);
  v.box(PX + 0.62, 0.012, 0.35, 0.95, 0.024, 0.7, C.soil);
  for (let k = 0; k < 9; k++) { const rr = rand(k + 70); v.box(PX + 0.2 + rr() * 0.85, 0.03, 0.05 + rr() * 0.6, 0.06, 0.03, 0.05, rr() > 0.5 ? C.soilD : '#9C7A58'); }
  root.add(v.mesh());

  // notes: one atlas (seven notes + the title strip), one mesh
  const AW = 2048, AH = 512, SW = 292, SHH = 384;
  const { cv, g, tex } = canvasTex(AW, AH);
  const geos = [];
  for (let i = 0; i < 7; i++) geos.push(atlasQuad(NW, NH, slotX(i), NY, NZ, (i * SW) / AW, 1 - SHH / AH, ((i + 1) * SW) / AW, 1));
  geos.push(atlasQuad(2.4, 0.2, 0, 2.01, 0.072, 0, 0, 1280 / AW, 128 / AH));
  const notesGeo = mergeGeometries(geos);
  geos.forEach((x) => x.dispose());
  const notesMat = toon('#ffffff', { map: tex });
  const notesMesh = new THREE.Mesh(notesGeo, notesMat);
  root.add(notesMesh);

  // curling corners: one instanced mesh (two bottom corners per note)
  const curlMesh = new THREE.InstancedMesh(UNIT, toon('#E6DAC0'), 14);
  curlMesh.userData.sharedGeo = true;
  root.add(curlMesh);
  // pins, hooks and rosettes (rebuilt with the notes)
  let pinsMesh = null;
  const state = new Array(7).fill(null);
  let curlT = curl;
  const tt = textOf(title);

  function drawSlot(i) {
    const s = state[i];
    const x0 = i * SW;
    g.save();
    g.beginPath();
    g.rect(x0, 0, SW, SHH);
    g.clip();
    g.translate(x0, 0);
    g.fillStyle = C.cork;
    g.fillRect(0, 0, SW, SHH);
    const r = rand(i * 31 + 7);
    g.fillStyle = C.corkD;
    for (let k = 0; k < 60; k++) g.fillRect(r() * SW, r() * SHH, 2 + r() * 3, 2);
    if (s === 'removed') {
      // the pin stays; a pencil line on the cork beneath
      g.strokeStyle = 'rgba(70,60,52,0.7)';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(40, 210);
      g.bezierCurveTo(110, 200, 170, 218, 250, 205);
      g.stroke();
      g.fillStyle = '#EFE5CF';
      g.beginPath(); g.moveTo(132, 30); g.lineTo(160, 28); g.lineTo(150, 52); g.closePath(); g.fill();
    } else if (s) {
      const rot = (r() - 0.5) * 0.05;
      g.translate(SW / 2, SHH / 2);
      g.rotate(rot);
      g.translate(-SW / 2, -SHH / 2);
      g.fillStyle = 'rgba(60,40,20,0.25)';
      g.fillRect(14, 18, SW - 22, SHH - 26);
      g.fillStyle = NOTE_TINTS[i % NOTE_TINTS.length];
      g.fillRect(8, 10, SW - 20, SHH - 24);
      // heading strip
      g.font = `700 23px ${FONT_MY}`;
      const lines = wrap(g, s.my, SW - 56).slice(0, 3);
      const hh = 18 + lines.length * 38 + (s.en ? 22 : 0);
      g.fillStyle = '#EADDBF';
      g.fillRect(16, 20, SW - 36, hh);
      g.fillStyle = C.maroon;
      g.fillRect(16, 20, 6, hh);
      g.fillStyle = C.ink;
      g.textBaseline = 'middle';
      g.textAlign = 'left';
      lines.forEach((l, k) => g.fillText(l, 30, 20 + 26 + k * 38));
      if (s.en) { g.font = `italic 600 15px ${FONT_SERIF}`; g.fillStyle = '#7A6A58'; g.fillText(s.en, 30, 20 + hh - 16, SW - 60); }
      // body: heat scribbles, or calm handwriting lines
      const top = 20 + hh + 16, bot = SHH - 30;
      const heat = s.heat ?? 0;
      const nl = Math.max(3, Math.floor((bot - top) / 26));
      for (let k = 0; k < nl; k++) {
        const y = top + k * 26 + 8;
        if (s.hearts) drawHeart(g, 28, y, 0.9);
        const hot = !s.hearts && heat > 0.15 && r() < 0.35 + heat * 0.6;
        g.strokeStyle = hot ? (r() > 0.5 ? '#C8323C' : '#E0702A') : 'rgba(80,70,60,0.75)';
        g.lineWidth = hot ? 2.5 + heat * 2.5 : 2;
        g.beginPath();
        let x = s.hearts ? 44 : 26;
        g.moveTo(x, y);
        const end = SW - 34 - r() * 50;
        while (x < end) {
          const step = hot ? 7 : 12;
          const amp = hot ? 4 + heat * 7 : 3;
          x += step;
          if (!hot && r() < 0.12) { g.moveTo(x + 8, y); x += 8; continue; } // word gaps
          g.lineTo(x, y + (r() - 0.5) * 2 * amp);
        }
        g.stroke();
      }
      const flames = Math.round(heat * 6);
      for (let k = 0; k < flames; k++) drawFlame(g, 40 + r() * (SW - 90), top + 10 + r() * (bot - top - 20), 0.8 + r() * 0.6, r());
      if (heat > 0.8) { g.strokeStyle = '#C8323C'; g.lineWidth = 4; g.strokeRect(12, 14, SW - 28, SHH - 32); }
    }
    g.restore();
  }
  function drawTitle() {
    g.clearRect(0, AH - 128, 1280, 128);
    g.fillStyle = C.maroon;
    g.fillRect(0, AH - 128, 1280, 128);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#F3E6C6';
    g.font = `700 64px ${FONT_MY}`;
    g.fillText(tt.my, 520, AH - 62, 820);
    g.font = `600 34px ${FONT_SERIF}`;
    g.fillStyle = C.gold;
    g.fillText(tt.en.toUpperCase(), 1070, AH - 58, 360);
  }
  function rebuildPins() {
    freeMesh(pinsMesh);
    pinsMesh = null;
    // an empty wall (notes: 0) has no pins at all: an empty builder cannot be merged into a mesh
    if (!state.some((s) => s)) return;
    const pv = new VoxelBuilder();
    for (let i = 0; i < 7; i++) {
      const s = state[i], x = slotX(i);
      if (s === 'removed') { pv.box(x - 0.005, NY + NH / 2 - 0.08, NZ + 0.01, 0.03, 0.03, 0.02, C.brass); continue; }
      if (!s) continue;
      for (const fx of [-1, 1]) pv.box(x + fx * 0.28, NY + NH / 2 - 0.06, NZ + 0.012, 0.03, 0.03, 0.02, C.brass);
      const rr = rand(i * 17 + 3);
      for (let k = 0; k < (s.pins | 0); k++) {
        const px = x + (rr() - 0.5) * (NW - 0.14), py = NY - NH / 2 + 0.1 + rr() * (NH - 0.42);
        pv.box(px, py, NZ + 0.022, 0.006, 0.006, 0.04, C.tinD);
        pv.box(px, py, NZ + 0.045, 0.022, 0.022, 0.016, ['#C8323C', C.brass, C.white, '#2F5DB3', C.brass][k % 5]);
      }
      if (s.hook || s.ribbon) {
        const hx = x + NW / 2 + 0.06, hy = NY + 0.2;
        pv.box(hx, hy + 0.04, NZ + 0.005, 0.05, 0.1, 0.01, C.brassD);
        pv.box(hx, hy, NZ + 0.035, 0.015, 0.015, 0.06, C.brass);
        pv.box(hx, hy + 0.02, NZ + 0.065, 0.015, 0.05, 0.015, C.brass);
        if (s.ribbon) rosetteInto(pv, hx, hy + 0.01, NZ + 0.08, 0.75);
      }
    }
    pinsMesh = pv.mesh({ px: 1.1 });
    root.add(pinsMesh);
  }
  function placeCurls() {
    const th = curlT * 1.25, cs = 0.11;
    let k = 0;
    for (let i = 0; i < 7; i++) {
      const on = state[i] && state[i] !== 'removed';
      for (const sx of [-1, 1]) {
        const cx = slotX(i) + sx * (NW / 2 - 0.01), cy = NY - NH / 2 + 0.015;
        // hinge along the corner's diagonal, through a point a little inside the corner
        _a.set(cx - sx * cs * 0.5, cy + cs * 0.5, NZ + 0.004);
        _d.set(1, sx, 0).normalize(); // diagonal direction
        _q.setFromAxisAngle(_d, -th);
        _m.makeRotationZ(Math.PI / 4);
        _m2.makeScale(on ? cs * 1.41 : 0.0001, on ? cs * 1.41 : 0.0001, 0.006);
        _m.multiply(_m2);
        _m2.makeRotationFromQuaternion(_q);
        _m2.multiply(_m);
        _m2.setPosition(_a);
        curlMesh.setMatrixAt(k++, _m2);
      }
    }
    curlMesh.instanceMatrix.needsUpdate = true;
  }
  function refresh() { for (let i = 0; i < 7; i++) drawSlot(i); drawTitle(); tex.needsUpdate = true; rebuildPins(); placeCurls(); }
  const norm = (n) => (n == null ? null : typeof n === 'string' ? { my: n, en: '', heat: 0.5 } : { ...n, my: n.my ?? textOf(n.heading).my, en: n.en ?? textOf(n.heading).en });
  for (let i = 0; i < Math.min(7, notes); i++) state[i] = { ...WALL_NOTES[i] };
  refresh();
  fontsReady().then(refresh);
  const sh = shadowUnder(root, 4.2, 0.6, 0, 0.1, 0.35);
  root.userData.footprint = { w: 7.8, d: 0.6 };
  return {
    root,
    slot(i) { return new THREE.Vector3(slotX(i), NY, NZ); },
    setNote(i, n) { if (i < 0 || i > 6) return; state[i] = norm(n); refresh(); },
    setNotes(list = []) { for (let i = 0; i < 7; i++) state[i] = norm(list[i]); refresh(); },
    removeNote(i) { if (state[i]) { state[i] = 'removed'; refresh(); } },
    setCurl(t) { curlT = clamp01(t); placeCurls(); },
    get notes() { return state.map((s) => (s && s !== 'removed' ? { ...s } : s)); },
    dispose() { tex.dispose(); notesMat.dispose(); curlMesh.dispose(); sh.geometry.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// rosette, reply pin
// ---------------------------------------------------------------------------------------------
/** A red ribbon rosette with a gold centre and two notched tails, hung from its top at (x, y, z), facing +Z. */
function rosetteInto(v, x, y, z, s = 1) {
  const cy = y - 0.11 * s;
  for (const [sx, a] of [[-1, 0.28], [1, -0.28]]) {
    const len = 0.3 * s;
    const ex = x + sx * Math.sin(Math.abs(a)) * len, ey = cy - Math.cos(a) * len;
    stick(v, [x + sx * 0.01 * s, cy, z - 0.006], [ex, ey, z - 0.006], 0.06 * s, sx < 0 ? '#C8323C' : '#B02A35', 0.01 * s);
    boxR(v, ex - sx * 0.012 * s, ey - 0.01 * s, z - 0.004, 0.035 * s, 0.05 * s, 0.012 * s, '#8E1F29', 0, 0, 0.6 * sx);
    boxR(v, ex + sx * 0.016 * s, ey - 0.012 * s, z - 0.004, 0.03 * s, 0.05 * s, 0.012 * s, '#8E1F29', 0, 0, -0.6 * sx);
  }
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    boxR(v, x + Math.cos(a) * 0.072 * s, cy + Math.sin(a) * 0.072 * s, z, 0.07 * s, 0.05 * s, 0.014 * s, k % 2 ? '#C8323C' : '#D8424A', 0, 0, a);
  }
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + 0.2;
    boxR(v, x + Math.cos(a) * 0.045 * s, cy + Math.sin(a) * 0.045 * s, z + 0.008, 0.045 * s, 0.035 * s, 0.012 * s, '#9E2430', 0, 0, a);
  }
  prism(v, x, cy, z + 0.016, 0.032 * s, 0.032 * s, 0.014, C.gold, 8, 0, Math.PI / 2);
  prism(v, x, cy, z + 0.022, 0.016 * s, 0.016 * s, 0.006, C.brassL, 8, 0, Math.PI / 2);
  v.box(x, y - 0.012 * s, z - 0.01, 0.014 * s, 0.03 * s, 0.01, C.brass);
}

/** The rosette (0.22 dia + two 0.3 tails); root is the hang point. */
export function rosette({ scale = 1 } = {}) {
  const root = new THREE.Group();
  root.name = 'rosette';
  const v = new VoxelBuilder();
  rosetteInto(v, 0, 0, 0, scale);
  root.add(v.mesh({ px: 1.1 }));
  return { root, dispose() { disposeTree(root); } };
}

/** A brass pin through a folded hot note (red edge). setHot(0..1): the edge reddens, then glows orange. */
export function replyPin({ hot = 0.6 } = {}) {
  const root = new THREE.Group();
  root.name = 'replyPin';
  const v = new VoxelBuilder();
  v.box(0, 0.06, 0, 0.008, 0.12, 0.008, C.brassD);
  prism(v, 0, 0.125, 0, 0.018, 0.018, 0.022, C.brass, 8);
  v.box(0, 0.003, 0, 0.004, 0.006, 0.004, C.ink);
  // the folded note on the shaft: two leaves in a shallow V
  boxR(v, -0.0, 0.065, 0.012, 0.12, 0.09, 0.004, '#F3EAD6', 0.18, 0, 0);
  boxR(v, -0.0, 0.065, -0.012, 0.12, 0.09, 0.004, '#E9DDC4', -0.18, 0, 0);
  for (let k = 0; k < 3; k++) boxR(v, -0.03 + k * 0.025, 0.07 - k * 0.012, 0.022, 0.05, 0.004, 0.002, 'rgb(150,90,80)', 0.18, 0, (k - 1) * 0.2);
  root.add(v.mesh({ px: 1.1 }));
  const g = glow('#E8DCC0', '#C8323C');
  const ev = new VoxelBuilder();
  boxR(ev, 0, 0.022, 0.02, 0.124, 0.012, 0.006, '#ffffff', 0.18, 0, 0);
  for (const sx of [-1, 1]) boxR(ev, sx * 0.061, 0.065, 0.013, 0.006, 0.092, 0.006, '#ffffff', 0.18, 0, 0);
  const edge = glowMesh(ev, g);
  root.add(edge);
  const hl = halo(0.22, 0.22);
  hl.position.set(0, 0.065, 0.04);
  root.add(hl);
  const hotC = new THREE.Color('#FF8A3C');
  function setHot(t) {
    t = clamp01(t);
    g.set(Math.min(1, t * 1.6));
    if (t > 0.6) g.mat.color.lerp(hotC, (t - 0.6) / 0.4);
    setHalo(hl, Math.max(0, t - 0.4) * 0.9);
  }
  setHot(hot);
  return { root, setHot, dispose() { g.mat.dispose(); hl.material.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// the diary clasp across the road (6 x 2 x 1)
// ---------------------------------------------------------------------------------------------
/**
 * A huge brass diary clasp where Hearth Row meets the Garden: a riveted hinge block (west), a catch block with a
 * keyhole (east), a brass arch over the road and a stitched leather strap. setOpen(0..1) swings the strap back
 * (about the hinge block) so it lies folded along the cover's edge.
 */
export function diaryClasp({ open = 0 } = {}) {
  const root = new THREE.Group();
  root.name = 'diaryClasp';
  const AX = 2.78, AW = 0.44;
  const v = new VoxelBuilder();
  for (const sx of [-1, 1]) {
    const x = sx * AX;
    // the leather cover's edge it is fixed to
    v.boxMin(x - 0.5, 0, -0.6, x + 0.5, 0.16, 0.6, C.leatherD);
    for (let k = 0; k < 8; k++) v.box(x - 0.4 + k * 0.115, 0.165, 0.52, 0.06, 0.006, 0.014, C.stitch);
    v.box(x, 0.96, 0, AW, 1.62, 0.78, C.brass);
    v.box(x, 0.2, 0, AW + 0.12, 0.1, 0.9, C.brassD);
    v.box(x, 1.8, 0, AW + 0.1, 0.08, 0.86, C.brassD);
    v.box(x, 0.96, 0.392, AW - 0.1, 1.3, 0.012, C.brassL);
    v.box(x, 0.96, 0.4, AW - 0.18, 1.2, 0.01, C.brass);
    for (const yy of [0.42, 1.5]) for (const zz of [-0.25, 0.25]) v.box(x + sx * 0.0, yy, zz + 0.0, 0.05, 0.05, 0.05, C.brassD);
    for (const yy of [0.42, 1.5]) v.box(x, yy, 0.41, 0.06, 0.06, 0.02, C.brassD);
    // engraved scroll lines
    for (let k = 0; k < 4; k++) boxR(v, x, 0.7 + k * 0.18, 0.408, 0.18, 0.012, 0.004, C.brassD, 0, 0, (k % 2 ? 1 : -1) * 0.5);
  }
  // the catch (east): slot and keyhole
  v.box(AX - AW / 2 - 0.02, 1.15, 0, 0.06, 0.92, 0.3, C.brassD);
  v.box(AX - AW / 2 - 0.05, 1.15, 0, 0.02, 0.7, 0.14, C.soot);
  prism(v, AX, 1.0, 0.41, 0.06, 0.06, 0.02, C.brassD, 8, 0, Math.PI / 2);
  v.box(AX, 1.02, 0.422, 0.035, 0.035, 0.01, C.soot);
  v.box(AX, 0.97, 0.422, 0.016, 0.07, 0.01, C.soot);
  // the hinge knuckles (west)
  for (let k = 0; k < 4; k++) prism(v, -AX + AW / 2 + 0.06, 0.85 + k * 0.2, 0.0, 0.07, 0.07, 0.16, k % 2 ? C.brass : C.brassD, 8);
  // the arch over the road
  const segs = 12;
  for (let k = 0; k < segs; k++) {
    const t0 = k / segs, t1 = (k + 1) / segs;
    const xa = -AX + t0 * 2 * AX, xb = -AX + t1 * 2 * AX;
    const ya = 1.88 + Math.sin(t0 * Math.PI) * 0.42, yb = 1.88 + Math.sin(t1 * Math.PI) * 0.42;
    stick(v, [xa, ya, 0], [xb, yb, 0], 0.16, k % 2 ? C.brass : C.brassL, 0.3);
    if (k % 3 === 1) v.box((xa + xb) / 2, (ya + yb) / 2 + 0.11, 0, 0.08, 0.08, 0.08, C.gold);
  }
  // a gold four-point sparkle at the crown
  v.box(0, 2.48, 0.0, 0.07, 0.26, 0.05, C.gold);
  v.box(0, 2.48, 0.0, 0.26, 0.07, 0.05, C.gold);
  v.box(0, 2.48, 0.0, 0.1, 0.1, 0.06, C.brassL, Math.PI / 4);
  root.add(v.mesh());

  // the strap, hinged on the west block, running east to the catch
  const hinge = new THREE.Group();
  hinge.position.set(-AX + AW / 2 + 0.06, 0, 0);
  root.add(hinge);
  const L = 2 * AX - AW - 0.1, Y0 = 0.82, Y1 = 1.5;
  const sv = new VoxelBuilder();
  sv.boxMin(0, Y0, -0.06, L - 0.32, Y1, 0.06, C.leather);
  sv.boxMin(0, Y0, -0.065, L - 0.32, Y0 + 0.05, 0.065, C.leatherD);
  sv.boxMin(0, Y1 - 0.05, -0.065, L - 0.32, Y1, 0.065, C.leatherD);
  for (let x = 0.15; x < L - 0.4; x += 0.16) for (const y of [Y0 + 0.09, Y1 - 0.09]) for (const z of [-0.066, 0.066]) sv.box(x, y, z, 0.08, 0.016, 0.006, C.stitch);
  for (let k = 0; k < 6; k++) { const rr = rand(k + 200); sv.box(0.4 + rr() * (L - 1.2), Y0 + 0.15 + rr() * 0.38, 0.064, 0.2 + rr() * 0.3, 0.012, 0.004, C.leatherL); }
  // brass tip and tongue
  sv.boxMin(L - 0.36, Y0 - 0.04, -0.09, L - 0.04, Y1 + 0.04, 0.09, C.brass);
  sv.boxMin(L - 0.33, Y0, 0.09, L - 0.07, Y1, 0.1, C.brassL);
  sv.boxMin(L - 0.06, Y0 + 0.14, -0.05, L + 0.06, Y1 - 0.14, 0.05, C.brassD);
  for (const y of [Y0 + 0.1, Y1 - 0.1]) sv.box(L - 0.32, y, 0.1, 0.04, 0.04, 0.02, C.brassD);
  sv.box(0.1, (Y0 + Y1) / 2, 0, 0.18, Y1 - Y0 + 0.1, 0.16, C.brassD);
  hinge.add(sv.mesh());
  const sh = shadowUnder(root, 3.3, 0.6, 0, 0, 0.35);
  function setOpen(t) { hinge.rotation.y = ease(t) * 1.72; }
  setOpen(open);
  return { root, setOpen, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// ground decals: scorch ring, torn crease
// ---------------------------------------------------------------------------------------------
/** A curled brown scorch ring (1.4 dia) on the baking-paper ground, with a raised curled lip. */
export function scorchRing({ r = 0.7, seed = 4 } = {}) {
  const root = new THREE.Group();
  root.name = 'scorchRing';
  const rr = rand(seed);
  const v = new VoxelBuilder();
  const n = 34;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const R = r * (0.86 + rr() * 0.06), w = r * (0.16 + rr() * 0.08);
    const seg = (2 * Math.PI * R) / n + 0.02;
    boxR(v, Math.cos(a) * R, 0.004, Math.sin(a) * R, seg, 0.006, w, jitter('#7A4A28', 0.12, i), 0, Math.PI / 2 - a, 0);
    boxR(v, Math.cos(a) * R * 0.74, 0.003, Math.sin(a) * R * 0.74, seg * 0.8, 0.004, r * 0.12, jitter('#B07E4E', 0.08, i + 50), 0, Math.PI / 2 - a, 0);
    if (i % 3) boxR(v, Math.cos(a) * R * 0.6, 0.002, Math.sin(a) * R * 0.6, seg * 0.6, 0.003, r * 0.1, '#CDA77A', 0, Math.PI / 2 - a, 0);
  }
  for (let k = 0; k < 7; k++) v.box((rr() - 0.5) * r, 0.003, (rr() - 0.5) * r, 0.05, 0.004, 0.03, '#8C6A4A', rr() * 3); // ash flecks
  root.add(v.mesh({ outline: false }));
  const lv = new VoxelBuilder();
  for (let i = 0; i < n; i++) {
    if (rr() < 0.25) continue;
    const a = (i / n) * Math.PI * 2;
    const R = r * 1.02;
    const seg = (2 * Math.PI * R) / n + 0.01;
    boxR(lv, Math.cos(a) * R, 0.012, Math.sin(a) * R, seg, 0.005, 0.04 + rr() * 0.035, jitter('#8E5C34', 0.1, i + 9), -(0.25 + rr() * 0.3), Math.PI / 2 - a, 0, 'YXZ');
  }
  root.add(lv.mesh({ px: 0.8 }));
  return { root, dispose() { disposeTree(root); } };
}

/**
 * A split in the parchment (len along X, w across) with torn lifted edges and a rope barrier;
 * setLaced(true): twine lacing through brass eyelets closes it into a footway (the barrier comes down).
 */
export function tornCrease({ len = 12, w = 1.2, laced = false, seed = 3 } = {}) {
  const root = new THREE.Group();
  root.name = 'tornCrease';
  const rr = rand(seed);
  const v = new VoxelBuilder();
  const step = 0.3, n = Math.round(len / step);
  const gapW = [];
  for (let i = 0; i <= n; i++) gapW.push(0.26 + Math.sin(i * 0.7 + seed) * 0.06 + rr() * 0.08);
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + (i + 0.5) * step, gw = gapW[i];
    v.box(x, 0.003, 0, step + 0.02, 0.004, gw, C.soot);
    v.box(x, 0.004, (rr() - 0.5) * gw * 0.4, step * 0.6, 0.004, gw * 0.25, '#4A3524');
    for (const sz of [-1, 1]) {
      const fw = 0.07 + rr() * 0.1, tilt = 0.15 + rr() * 0.4;
      const fz = sz * (gw / 2 + fw * 0.4);
      boxR(v, x + (rr() - 0.5) * 0.04, 0.01 + Math.sin(tilt) * fw * 0.5, fz, step * (0.8 + rr() * 0.35), 0.008, fw, jitter('#E8D9BA', 0.05, i * 2 + sz), sz * tilt, (rr() - 0.5) * 0.25, 0, 'YXZ');
      // pale torn fibres along the lip
      v.box(x + (rr() - 0.5) * 0.1, 0.012 + Math.sin(tilt) * fw * 0.9, sz * (gw / 2 + 0.005), step * 0.5, 0.006, 0.012, C.white2);
    }
  }
  for (const ex of [-1, 1]) v.box(ex * (len / 2 + 0.06), 0.004, 0, 0.16, 0.004, 0.12, '#4A3524'); // tapering ends
  root.add(v.mesh({ px: 1.1 }));
  // rope barrier on both sides
  const bv = new VoxelBuilder();
  const posts = Math.max(2, Math.round(len / 2) + 1);
  for (const sz of [-1, 1]) {
    const z = sz * (w / 2 + 0.12);
    for (let k = 0; k < posts; k++) {
      const x = -len / 2 + (k / (posts - 1)) * len;
      bv.box(x, 0.32, z, 0.07, 0.64, 0.07, C.woodD);
      bv.box(x, 0.67, z, 0.1, 0.06, 0.1, C.maroon);
      bv.box(x, 0.02, z, 0.14, 0.04, 0.14, C.stone);
      if (k < posts - 1) {
        const x2 = -len / 2 + ((k + 1) / (posts - 1)) * len;
        const pts = [0, 0.25, 0.5, 0.75, 1].map((t) => [x + (x2 - x) * t, 0.58 - Math.sin(t * Math.PI) * 0.16, z]);
        for (let j = 0; j < 4; j++) stick(bv, pts[j], pts[j + 1], 0.025, C.twineD);
      }
    }
  }
  const barrier = bv.mesh({ px: 1.2 });
  root.add(barrier);
  // the lacing
  const lv = new VoxelBuilder();
  const ls = 0.4, nl = Math.floor(len / ls);
  for (let k = 0; k <= nl; k++) {
    const x = -len / 2 + 0.2 + k * ls;
    if (x > len / 2 - 0.1) break;
    const gw = gapW[Math.min(n, Math.round((x + len / 2) / step))];
    for (const sz of [-1, 1]) lv.box(x, 0.02, sz * (gw / 2 + 0.07), 0.05, 0.02, 0.05, C.brass);
    if (x + ls < len / 2 - 0.1) {
      stick(lv, [x, 0.03, -(gw / 2 + 0.07)], [x + ls, 0.03, gw / 2 + 0.07], 0.025, C.twine, 0.012);
      stick(lv, [x, 0.035, gw / 2 + 0.07], [x + ls, 0.035, -(gw / 2 + 0.07)], 0.025, C.twineD, 0.012);
    }
  }
  const lacing = lv.mesh({ px: 1.1 });
  root.add(lacing);
  function setLaced(b) { lacing.visible = !!b; barrier.visible = !b; }
  setLaced(laced);
  return { root, setLaced, dispose() { disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// shop sign, tin lamps, kite bench, lamp bench
// ---------------------------------------------------------------------------------------------
/** A painted plank sign (1.6 x 0.45) on two wall brackets; back at z = 0. setText(text | { my, en }). */
export function shopSign({ text = { my: 'ဆိုင်', en: 'Shop' }, w = 1.6, h = 0.45, colors } = {}) {
  const root = new THREE.Group();
  root.name = 'shopSign';
  const v = new VoxelBuilder();
  const Z = 0.12;
  v.box(0, 0, Z, w + 0.08, h + 0.08, 0.05, C.woodD);
  for (const sx of [-1, 1]) {
    v.box(sx * (w / 2 - 0.2), h / 2 + 0.12, 0.03, 0.06, 0.16, 0.06, C.iron);
    v.box(sx * (w / 2 - 0.2), h / 2 + 0.17, Z / 2, 0.04, 0.04, Z, C.iron);
    v.box(sx * (w / 2 - 0.2), h / 2 + 0.08, Z, 0.03, 0.1, 0.03, C.iron);
    v.box(sx * (w / 2 - 0.2), -h / 2 - 0.06, 0.03, 0.06, 0.08, 0.06, C.iron);
    stick(v, [sx * (w / 2 - 0.2), -h / 2 - 0.06, 0.03], [sx * (w / 2 - 0.2), -h / 2 - 0.04, Z - 0.02], 0.03, C.iron);
  }
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) v.box(sx * (w / 2 + 0.01), sy * (h / 2 + 0.01), Z + 0.03, 0.04, 0.04, 0.02, C.gold);
  root.add(v.mesh());
  const { cv, tex } = canvasTex(1024, Math.round((1024 * h) / w));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic('#ffffff', { map: tex }));
  face.position.set(0, 0, Z + 0.027);
  root.add(face);
  let cur = textOf(text);
  const draw = () => { drawBoard(cv, cur, { sprigs: false, ...(colors || {}) }); tex.needsUpdate = true; };
  draw();
  fontsReady().then(draw);
  return { root, setText(t) { cur = textOf(t); draw(); }, dispose() { tex.dispose(); face.material.dispose(); disposeTree(root); } };
}

/** Punched-tin lamp body into a builder (origin = the lamp's hanging ring); holes go to hv (glow). */
function tinLampInto(v, hv, x, y, z) {
  v.box(x, y - 0.01, z, 0.04, 0.02, 0.012, C.tinD); // ring
  prism(v, x, y - 0.04, z, 0.012, 0.03, 0.04, C.tinD, 8);
  prism(v, x, y - 0.085, z, 0.03, 0.095, 0.06, C.tin, 8);
  prism(v, x, y - 0.12, z, 0.098, 0.098, 0.012, C.tinD, 8);
  prism(v, x, y - 0.2, z, 0.082, 0.082, 0.15, C.tin, 8);
  prism(v, x, y - 0.28, z, 0.092, 0.08, 0.02, C.tinD, 8);
  prism(v, x, y - 0.3, z, 0.04, 0.07, 0.03, C.tinD, 8);
  for (let f = 0; f < 8; f++) {
    const a = (f / 8) * Math.PI * 2;
    const nx = Math.sin(a), nz = Math.cos(a);
    for (let row = 0; row < 3; row++) for (let c = -1; c <= 1; c += (row % 2 ? 2 : 1)) {
      const off = c * 0.02;
      hv.box(x + nx * 0.083 + nz * off, y - 0.15 - row * 0.045, z + nz * 0.083 - nx * off, 0.012, 0.014, 0.012, '#ffffff');
    }
  }
}

/** A punched-tin lamp (0.18 x 0.28) on a wall bracket (bracket: true) or hanging free. setLit(0..1). */
export function tinLamp({ bracket = true, lit = 0 } = {}) {
  const root = new THREE.Group();
  root.name = 'tinLamp';
  const v = new VoxelBuilder(), hv = new VoxelBuilder();
  const LZ = bracket ? 0.3 : 0, LY = bracket ? 0 : 0.3;
  if (bracket) {
    v.box(0, 0.04, 0.015, 0.1, 0.18, 0.03, C.iron);
    v.box(0, 0.1, 0.17, 0.03, 0.03, 0.3, C.iron);
    stick(v, [0, -0.03, 0.03], [0, 0.09, 0.2], 0.025, C.iron);
    v.box(0, 0.115, LZ - 0.01, 0.05, 0.03, 0.05, C.iron);
    v.box(0, 0.06, LZ, 0.01, 0.1, 0.01, C.iron);
    v.box(0.0, 0.135, 0.06, 0.04, 0.04, 0.04, C.gold); // scroll curl
  }
  const yy = bracket ? 0.01 : LY;
  tinLampInto(v, hv, 0, yy, LZ);
  root.add(v.mesh({ px: 1.2 }));
  const g = glow('#4A3A2C', '#FFD27A');
  hv.box(0, yy - 0.2, LZ, 0.14, 0.13, 0.14, '#FFB060'); // inner flame seen through the holes
  root.add(glowMesh(hv, g));
  const hl = halo(0.7, 0.7);
  hl.position.set(0, yy - 0.2, LZ + 0.1);
  root.add(hl);
  let litT = 0, flick = 0;
  function setLit(t) { litT = clamp01(t); g.set(litT); setHalo(hl, litT * 0.75); }
  setLit(lit);
  return {
    root, setLit,
    update(dt, t) { if (litT > 0.01) { flick = 0.9 + Math.sin(t * 13.1) * 0.05 + Math.sin(t * 7.3) * 0.05; setHalo(hl, litT * 0.75 * flick); } },
    dispose() { g.mat.dispose(); hl.material.dispose(); disposeTree(root); },
  };
}

/** A lane of tin lamps as two instanced draw calls. points: [[x, y, z, ry?]] (hanging ring positions). */
export function tinLampRow(points, { lit = 0 } = {}) {
  const root = new THREE.Group();
  root.name = 'tinLampRow';
  const v = new VoxelBuilder(), hv = new VoxelBuilder();
  tinLampInto(v, hv, 0, 0, 0);
  hv.box(0, -0.2, 0, 0.14, 0.13, 0.14, '#FFB060');
  const bodyGeo = v.geometry(), holeGeo = hv.geometry();
  const body = new THREE.InstancedMesh(bodyGeo, toon('#ffffff', { vertexColors: true }), points.length);
  const g = glow('#4A3A2C', '#FFD27A');
  const holes = new THREE.InstancedMesh(holeGeo, g.mat, points.length);
  points.forEach((p, i) => {
    _o.position.set(p[0], p[1], p[2]);
    _o.rotation.set(0, p[3] || 0, 0);
    _o.scale.setScalar(1);
    _o.updateMatrix();
    body.setMatrixAt(i, _o.matrix);
    holes.setMatrixAt(i, _o.matrix);
  });
  root.add(body, holes);
  addOutline(body, { px: 1.1 });
  function setLit(t) { g.set(clamp01(t)); }
  setLit(lit);
  return { root, setLit, dispose() { g.mat.dispose(); bodyGeo.dispose(); holeGeo.dispose(); disposeTree(root); } };
}

/** Diamond (rhombus) facing +Z: centre, half-width, half-height, thickness. */
function diamond(v, x, y, z, hw, hh, t, col, rx = 0) {
  _m.compose(_p.set(0, 0, 0), _q.setFromEuler(_e.set(0, 0, Math.PI / 4)), _s.set(Math.SQRT1_2 * 2, Math.SQRT1_2 * 2, t));
  _m2.makeScale(hw, hh, 1);
  _m2.multiply(_m);
  if (rx) _m2.premultiply(_m.makeRotationX(rx));
  _m2.setPosition(x, y, z);
  v.add(UNIT, col, _m2);
}

/**
 * A kite-mender's bench (1.4 w): two small kites being mended, paste pot, bamboo sticks, a string reel; a maroon
 * and gold diamond kite flies ~6 m up on a line tied to the bench leg with a double knot. update(dt, t) sways it.
 */
export function kiteBench() {
  const root = new THREE.Group();
  root.name = 'kiteBench';
  const v = new VoxelBuilder();
  for (const fx of [-1, 1]) for (const fz of [-1, 1]) v.box(fx * 0.6, 0.22, fz * 0.17, 0.07, 0.44, 0.07, C.woodD);
  for (const fx of [-1, 1]) v.box(fx * 0.6, 0.12, 0, 0.05, 0.05, 0.36, C.woodD);
  v.box(0, 0.12, 0.17, 1.2, 0.04, 0.04, C.woodD);
  for (let k = 0; k < 3; k++) v.box(0, 0.465, -0.13 + k * 0.13, 1.4, 0.05, 0.12, jitter(C.wood, 0.06, k));
  // two small kites lying on it, one with a torn corner and a fresh patch
  diamond(v, -0.38, 0.5, 0.0, 0.16, 0.2, 0.01, C.mustard, -Math.PI / 2);
  stick(v, [-0.38, 0.512, -0.2], [-0.38, 0.512, 0.2], 0.012, C.bambooD);
  boxR(v, -0.38, 0.512, -0.03, 0.32, 0.012, 0.012, C.bambooD, 0, 0, 0);
  boxR(v, -0.3, 0.507, 0.08, 0.08, 0.004, 0.07, C.white2, 0, 0.3, 0);
  boxR(v, 0.1, 0.5, 0.02, 0.28, 0.008, 0.36, '#2F7F8E', 0, 0.785, 0);
  boxR(v, 0.1, 0.505, 0.02, 0.012, 0.012, 0.38, C.bambooD, 0, 0.785, 0);
  // paste pot with a brush, bamboo sticks, string reel, scissors
  prism(v, 0.42, 0.55, -0.06, 0.05, 0.045, 0.08, C.terra, 8);
  prism(v, 0.42, 0.592, -0.06, 0.042, 0.042, 0.006, C.cream, 8);
  stick(v, [0.42, 0.56, -0.06], [0.48, 0.68, -0.03], 0.012, C.woodL);
  for (let k = 0; k < 5; k++) stick(v, [0.2 + k * 0.02, 0.495, -0.15], [0.62 + k * 0.01, 0.5, -0.1], 0.012, k % 2 ? C.bamboo : C.bambooL);
  prism(v, 0.55, 0.53, 0.1, 0.05, 0.05, 0.05, C.woodL, 8, 0, Math.PI / 2);
  prism(v, 0.55, 0.53, 0.1, 0.035, 0.035, 0.06, C.white2, 8, 0, Math.PI / 2);
  // the double knot on the front-right leg
  const KX = 0.6, KY = 0.24, KZ = 0.2;
  v.box(KX, KY, KZ, 0.1, 0.04, 0.1, C.white2);
  v.box(KX, KY + 0.045, KZ, 0.095, 0.035, 0.095, C.white2);
  v.box(KX + 0.05, KY + 0.06, KZ + 0.04, 0.04, 0.03, 0.03, C.white2);
  root.add(v.mesh());
  // the flying kite (own group, sways)
  const kite = new THREE.Group();
  const kb = new THREE.Vector3(1.6, 6.0, -1.8);
  kite.position.copy(kb);
  root.add(kite);
  const kv = new VoxelBuilder();
  diamond(kv, 0, 0, 0, 0.36, 0.46, 0.02, C.maroon);
  diamond(kv, 0, 0, 0.012, 0.26, 0.34, 0.01, C.gold);
  diamond(kv, 0, 0, 0.02, 0.05, 0.16, 0.008, C.cream);
  diamond(kv, 0, 0, 0.02, 0.13, 0.05, 0.008, C.cream);
  kv.box(0, 0, -0.02, 0.025, 0.92, 0.02, C.bambooD);
  kv.box(0, 0.06, -0.02, 0.72, 0.025, 0.02, C.bambooD);
  for (let k = 0; k < 6; k++) {
    const y = -0.5 - k * 0.16, x = Math.sin(k * 0.9) * 0.06;
    kv.box(x, y, 0, 0.012, 0.16, 0.01, C.white2);
    kv.box(x, y - 0.06, 0.005, 0.1, 0.04, 0.01, k % 2 ? C.gold : C.maroon, 0);
  }
  kite.add(kv.mesh({ px: 1.2 }));
  // the line: a sagging curve of segments (instanced, updated each frame)
  const SEG = 10;
  const line = new THREE.InstancedMesh(UNIT, toon(C.white2), SEG);
  line.userData.sharedGeo = true;
  line.frustumCulled = false;
  root.add(line);
  const A = new THREE.Vector3(KX + 0.05, KY + 0.05, KZ), B = new THREE.Vector3(), P0 = new THREE.Vector3(), P1 = new THREE.Vector3();
  function place(t) {
    kite.position.set(kb.x + Math.sin(t * 0.7) * 0.35, kb.y + Math.sin(t * 1.1) * 0.2, kb.z);
    kite.rotation.set(0.15, Math.sin(t * 0.5) * 0.15, Math.sin(t * 0.9) * 0.22);
    B.set(0, -0.08, 0.03).applyEuler(kite.rotation).add(kite.position);
    for (let i = 0; i < SEG; i++) {
      const t0 = i / SEG, t1 = (i + 1) / SEG;
      P0.lerpVectors(A, B, t0); P0.y -= Math.sin(t0 * Math.PI) * 0.7;
      P1.lerpVectors(A, B, t1); P1.y -= Math.sin(t1 * Math.PI) * 0.7;
      _d.subVectors(P1, P0);
      const len = _d.length();
      _q.setFromUnitVectors(_up, _d.multiplyScalar(1 / len));
      _m.compose(_p.addVectors(P0, P1).multiplyScalar(0.5), _q, _s.set(0.012, len, 0.012));
      line.setMatrixAt(i, _m);
    }
    line.instanceMatrix.needsUpdate = true;
  }
  place(0);
  const sh = shadowUnder(root, 0.85, 0.35, 0, 0, 0.45);
  return { root, kite, update(dt, t) { place(t); }, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

/** A lamp-mender's bench (1.2 x 0.8 x 0.6): vice, tools, tin sheets, a half-mended tin lamp and a lit paper lamp. */
export function lampBench({ lit = 1 } = {}) {
  const root = new THREE.Group();
  root.name = 'lampBench';
  const v = new VoxelBuilder();
  const TY = 0.78;
  for (const fx of [-1, 1]) for (const fz of [-1, 1]) v.box(fx * 0.54, TY / 2, fz * 0.24, 0.07, TY, 0.07, C.woodD);
  v.box(0, 0.16, 0, 1.1, 0.04, 0.5, C.woodD);
  v.box(0, TY + 0.025, 0, 1.24, 0.05, 0.62, C.wood);
  v.box(0, TY + 0.025, 0.31, 1.24, 0.05, 0.02, C.woodD);
  for (let k = 0; k < 4; k++) v.box(-0.4 + k * 0.27, TY + 0.052, -0.05 + (k % 2) * 0.1, 0.12, 0.004, 0.03, C.woodDD); // burn marks
  // shelf below with tin sheets and a box of rivets
  for (let k = 0; k < 4; k++) boxR(v, -0.15 + k * 0.03, 0.19 + k * 0.012, 0.02, 0.5, 0.01, 0.34, k % 2 ? C.tin : C.tinL, 0, 0.05 * k, 0);
  v.box(0.35, 0.23, 0, 0.2, 0.1, 0.2, C.woodL);
  // vice on the left end
  v.box(-0.5, TY + 0.11, 0.2, 0.1, 0.16, 0.12, C.iron);
  v.box(-0.5, TY + 0.11, 0.28, 0.1, 0.16, 0.04, C.ironL);
  v.box(-0.5, TY + 0.12, 0.36, 0.02, 0.02, 0.14, C.ironL);
  v.box(-0.5, TY + 0.12, 0.43, 0.14, 0.025, 0.025, C.ironL);
  // tools: hammer, snips, pliers, a soldering iron on its stand
  v.box(-0.18, TY + 0.065, 0.16, 0.26, 0.025, 0.03, C.woodL, 0.3);
  v.box(-0.05, TY + 0.07, 0.12, 0.05, 0.04, 0.09, C.iron, 0.3);
  boxR(v, 0.06, TY + 0.06, 0.2, 0.16, 0.015, 0.03, C.maroon, 0, -0.4, 0);
  boxR(v, 0.06, TY + 0.06, 0.22, 0.16, 0.015, 0.03, C.maroon, 0, -0.2, 0);
  boxR(v, 0.15, TY + 0.065, 0.16, 0.08, 0.02, 0.04, C.ironL, 0, -0.3, 0);
  v.box(-0.25, TY + 0.08, -0.15, 0.08, 0.06, 0.06, C.iron);
  stick(v, [-0.25, TY + 0.1, -0.15], [-0.05, TY + 0.13, -0.18], 0.025, C.ironL);
  stick(v, [-0.36, TY + 0.1, -0.15], [-0.26, TY + 0.11, -0.15], 0.035, C.woodL);
  // a tin lamp being mended, its top off
  prism(v, 0.15, TY + 0.13, -0.12, 0.08, 0.08, 0.15, C.tin, 8);
  prism(v, 0.15, TY + 0.207, -0.12, 0.084, 0.084, 0.012, C.tinD, 8);
  prism(v, 0.3, TY + 0.075, -0.05, 0.095, 0.03, 0.05, C.tin, 8, 0, 0, 0.6);
  // a stool
  for (const fx of [-1, 1]) for (const fz of [-1, 1]) v.box(-0.2 + fx * 0.12, 0.22, 0.62 + fz * 0.12, 0.04, 0.44, 0.04, C.woodD);
  v.box(-0.2, 0.46, 0.62, 0.34, 0.05, 0.34, C.woodL);
  root.add(v.mesh());
  // the paper lamp (glows)
  const LX = 0.42, LZ = 0.08, LY = TY + 0.05;
  const fv = new VoxelBuilder();
  for (const fx of [-1, 1]) for (const fz of [-1, 1]) fv.box(LX + fx * 0.09, LY + 0.17, LZ + fz * 0.09, 0.025, 0.34, 0.025, C.woodD);
  fv.box(LX, LY + 0.01, LZ, 0.22, 0.02, 0.22, C.woodD);
  fv.box(LX, LY + 0.345, LZ, 0.24, 0.03, 0.24, C.woodD);
  fv.box(LX, LY + 0.38, LZ, 0.08, 0.04, 0.08, C.maroon);
  fv.box(LX, LY + 0.42, LZ, 0.02, 0.06, 0.02, C.iron);
  root.add(fv.mesh({ px: 1.2 }));
  const g = glow('#8E7E62', '#FFE2A8');
  const pv = new VoxelBuilder();
  pv.box(LX, LY + 0.18, LZ, 0.17, 0.3, 0.17, '#ffffff');
  for (const fx of [-1, 1]) pv.box(LX + fx * 0.0, LY + 0.18, LZ + 0.087, 0.02, 0.3, 0.004, '#E8B060');
  const paper = glowMesh(pv, g);
  root.add(paper);
  const hl = halo(1.1, 1.1);
  hl.position.set(LX, LY + 0.2, LZ + 0.2);
  root.add(hl);
  let litT = 0;
  function setLit(t) { litT = clamp01(t); g.set(0.25 + litT * 0.75); setHalo(hl, litT * 0.5); }
  setLit(lit);
  const sh = shadowUnder(root, 0.8, 0.55, 0, 0.15, 0.45);
  return { root, setLit, update(dt, t) { if (litT > 0.01) setHalo(hl, litT * (0.46 + Math.sin(t * 9.7) * 0.03 + Math.sin(t * 5.1) * 0.03)); }, dispose() { g.mat.dispose(); hl.material.dispose(); sh.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// tin sapling, umbrella, twine coil
// ---------------------------------------------------------------------------------------------
/** A feathery tamarind leaf (rachis + leaflet pairs) from (x, y, z) at angle a (about Y) and lift. */
function tamarindLeaf(v, x, y, z, a, lift, len, s = 1) {
  const dx = Math.cos(a), dz = -Math.sin(a);
  const ex = x + dx * len * Math.cos(lift), ey = y + len * Math.sin(lift), ez = z + dz * len * Math.cos(lift);
  stick(v, [x, y, z], [ex, ey, ez], 0.006 * s, C.leafD);
  const n = Math.max(3, Math.round(len / 0.014));
  for (let k = 1; k <= n; k++) {
    const t = k / (n + 0.5);
    const px = x + (ex - x) * t, py = y + (ey - y) * t, pz = z + (ez - z) * t;
    for (const side of [-1, 1]) boxR(v, px - dz * side * 0.012 * s, py + 0.002, pz + dx * side * 0.012 * s, 0.01 * s, 0.004, 0.022 * s, k % 2 ? C.leafL : C.leafLL, 0, a, 0);
  }
}

/** A condensed-milk tin with a tamarind seedling (roots poking out); plant() puts it in an earth ring (0.35 h). */
export function tinSapling({ planted = false } = {}) {
  const root = new THREE.Group();
  root.name = 'tinSapling';
  const tv = new VoxelBuilder();
  prism(tv, 0, 0.07, 0, 0.06, 0.06, 0.14, C.tin, 10);
  prism(tv, 0, 0.068, 0, 0.0615, 0.0615, 0.08, C.cream, 10);
  prism(tv, 0, 0.08, 0, 0.062, 0.062, 0.035, C.maroon, 10);
  prism(tv, 0, 0.1, 0, 0.0622, 0.0622, 0.006, C.gold, 10);
  prism(tv, 0, 0.138, 0, 0.063, 0.063, 0.006, C.tinD, 10);
  prism(tv, 0, 0.136, 0, 0.056, 0.056, 0.004, C.soil, 10);
  for (let k = 0; k < 3; k++) stick(tv, [0.0, 0.003, 0.0], [Math.cos(k * 2.1) * 0.08, -0.0, Math.sin(k * 2.1) * 0.08], 0.006, '#E6D4B0');
  tv.box(0.04, 0.003, 0.05, 0.03, 0.004, 0.01, '#E6D4B0');
  stick(tv, [0, 0.135, 0], [0.005, 0.32, 0.0], 0.008, '#7E6A44');
  [[0.2, 0.5, 0.08], [2.3, 0.6, 0.07], [4.1, 0.45, 0.075], [1.2, 0.9, 0.06]].forEach(([a, l, len], i) => tamarindLeaf(tv, 0.004, 0.2 + i * 0.035, 0, a, l, len));
  const tin = tv.mesh({ px: 1.1 });
  root.add(tin);
  const pv = new VoxelBuilder();
  ring(pv, 0, 0.025, 0, 0.16, 14, 0.07, 0.05, C.soilD, 'y');
  prism(pv, 0, 0.018, 0, 0.14, 0.15, 0.036, C.soil, 10);
  for (let k = 0; k < 6; k++) pv.box(Math.cos(k) * 0.1, 0.04, Math.sin(k) * 0.1, 0.03, 0.02, 0.025, '#9C7A58');
  stick(pv, [0, 0.03, 0], [0.01, 0.36, 0.0], 0.012, '#7E6A44');
  [[0.2, 0.45, 0.11], [2.3, 0.55, 0.1], [4.1, 0.4, 0.1], [1.1, 0.7, 0.09], [3.3, 0.6, 0.09], [5.2, 0.8, 0.08]].forEach(([a, l, len], i) => tamarindLeaf(pv, 0.006, 0.14 + i * 0.04, 0, a, l, len, 1.2));
  // the empty tin lying beside it
  prism(pv, 0.26, 0.06, 0.06, 0.06, 0.06, 0.14, C.tin, 10, 0.4, Math.PI / 2);
  prism(pv, 0.26, 0.06, 0.06, 0.0615, 0.0615, 0.08, C.cream, 10, 0.4, Math.PI / 2);
  prism(pv, 0.26, 0.06, 0.06, 0.062, 0.062, 0.035, C.maroon, 10, 0.4, Math.PI / 2);
  const bed = pv.mesh({ px: 1.1 });
  root.add(bed);
  function setPlanted(b) { bed.visible = !!b; tin.visible = !b; }
  setPlanted(planted);
  return { root, plant() { setPlanted(true); }, setPlanted, dispose() { disposeTree(root); } };
}

/** An umbrella (maroon cloth, gold trim). Origin = the shaft's foot; grip: local hand point. setOpen(bool). */
export function umbrella({ open = true, color = C.maroon } = {}) {
  const root = new THREE.Group();
  root.name = 'umbrella';
  const shaft = new VoxelBuilder();
  shaft.box(0, 0.42, 0, 0.022, 0.84, 0.022, C.woodD);
  stick(shaft, [0, 0.1, 0], [0.04, 0.0, 0], 0.03, C.woodL);
  stick(shaft, [0.04, 0.0, 0], [0.09, 0.03, 0], 0.03, C.woodL);
  stick(shaft, [0.09, 0.03, 0], [0.1, 0.08, 0], 0.03, C.woodL);
  root.add(shaft.mesh({ px: 1.2 }));
  const ov = new VoxelBuilder();
  prism(ov, 0, 0.8, 0, 0.06, 0.5, 0.16, color, 8);
  prism(ov, 0, 0.88, 0, 0.02, 0.07, 0.04, shade(color, 0.9), 8);
  prism(ov, 0, 0.712, 0, 0.505, 0.505, 0.02, C.gold, 8);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    ov.box(Math.sin(a) * 0.5, 0.71, Math.cos(a) * 0.5, 0.025, 0.04, 0.025, C.goldD);
    stick(ov, [0, 0.55, 0], [Math.sin(a) * 0.32, 0.74, Math.cos(a) * 0.32], 0.01, C.woodD);
  }
  ov.box(0, 0.93, 0, 0.03, 0.06, 0.03, C.gold);
  const openM = ov.mesh();
  root.add(openM);
  const cvb = new VoxelBuilder();
  prism(cvb, 0, 0.62, 0, 0.03, 0.07, 0.36, color, 8);
  prism(cvb, 0, 0.6, 0, 0.075, 0.075, 0.03, C.gold, 8);
  cvb.box(0, 0.83, 0, 0.03, 0.06, 0.03, C.gold);
  const shutM = cvb.mesh();
  root.add(shutM);
  function setOpen(b) { openM.visible = !!b; shutM.visible = !b; }
  setOpen(open);
  return { root, grip: new THREE.Vector3(0, 0.3, 0), setOpen, dispose() { disposeTree(root); } };
}

/** A coil of twine (0.18 dia) with a loose end. */
export function twineCoil() {
  const root = new THREE.Group();
  root.name = 'twineCoil';
  const v = new VoxelBuilder();
  for (let k = 0; k < 4; k++) ring(v, 0, 0.012 + k * 0.022, 0, 0.075 - (k % 2) * 0.006, 12, 0.026, 0.022, k % 2 ? C.twine : C.twineD, 'y', k * 0.2);
  prism(v, 0, 0.05, 0, 0.045, 0.045, 0.09, C.twineD, 8);
  stick(v, [0.08, 0.08, 0.02], [0.18, 0.012, 0.1], 0.016, C.twine);
  stick(v, [0.18, 0.012, 0.1], [0.28, 0.01, 0.06], 0.016, C.twine);
  root.add(v.mesh({ px: 1.1 }));
  return { root, dispose() { disposeTree(root); } };
}

// =============================================================================================
// DIARY GARDEN
// =============================================================================================
// ---------------------------------------------------------------------------------------------
// the locked gate (2.2 w x 1.6 h)
// ---------------------------------------------------------------------------------------------
/** A paper parcel (a loaf wrapped in paper, tied with twine), bottom at y. */
function parcelInto(v, x, y, z, ry = 0) {
  boxR(v, x, y + 0.055, z, 0.26, 0.11, 0.15, '#EFE6D2', 0, ry, 0);
  boxR(v, x, y + 0.112, z, 0.22, 0.012, 0.12, '#F7F0E2', 0, ry, 0);
  boxR(v, x, y + 0.056, z, 0.265, 0.114, 0.02, C.twineD, 0, ry, 0);
  boxR(v, x, y + 0.056, z, 0.02, 0.114, 0.155, C.twineD, 0, ry, 0);
  boxR(v, x, y + 0.125, z, 0.05, 0.02, 0.04, C.twine, 0, ry + 0.5, 0);
  boxR(v, x - 0.12 * Math.cos(ry), y + 0.06, z + 0.12 * Math.sin(ry), 0.04, 0.07, 0.1, C.crust, 0, ry, 0); // crust peeking out
}
/** A brass padlock, body centre at (x, y, z), facing +Z; open = shackle swung up/out. */
function padlockInto(v, x, y, z, open = false, s = 1) {
  v.box(x, y, z, 0.08 * s, 0.07 * s, 0.035 * s, C.brass);
  v.box(x, y - 0.035 * s, z, 0.085 * s, 0.012 * s, 0.04 * s, C.brassD);
  v.box(x, y + 0.004, z + 0.018 * s, 0.012 * s, 0.022 * s, 0.004, C.soot);
  const lift = open ? 0.03 * s : 0;
  for (const sx of [-1, 1]) v.box(x + sx * 0.026 * s + (open && sx > 0 ? 0.01 : 0), y + 0.06 * s + (sx < 0 ? lift : 0), z, 0.013 * s, 0.06 * s, 0.013 * s, C.ironL);
  v.box(x, y + 0.093 * s + lift, z, 0.065 * s, 0.013 * s, 0.013 * s, C.ironL);
}

/**
 * U Hpo Htaw's garden gate: two posts, a barred wooden leaf with a hand-wide gap between two bars, a hasp and
 * padlock, a brass bell (cord on the lane side) and a loaf in paper on the left post.
 * setLocked(bool) (padlock on the hasp, or hung open on the post hook) · setAjar(0..1) (0.15 = a hand-width)
 * · ring() · setLoaf(bool) · update(dt, t).
 */
// Lesson ch 16 (D10): a gate opens in its owner's time; Maya stays on the lane side.
export function lockedGate({ locked = true, ajar = 0, loaf = true } = {}) {
  const root = new THREE.Group();
  root.name = 'lockedGate';
  const PX = 1.0, PH = 1.75, LW = 1.82, LH = 1.5;
  const v = new VoxelBuilder();
  for (const sx of [-1, 1]) {
    const x = sx * PX;
    v.box(x, 0.07, 0, 0.32, 0.14, 0.32, C.stone);
    v.box(x, PH / 2, 0, 0.18, PH, 0.18, jitter(C.woodD, 0.04, sx));
    for (let y = 0.25; y < PH - 0.1; y += 0.42) v.box(x, y, 0.091, 0.12, 0.006, 0.004, C.woodDD); // grain
    v.box(x, PH + 0.03, 0, 0.24, 0.06, 0.24, C.wood);
    v.box(x, PH + 0.08, 0, 0.16, 0.05, 0.16, C.woodL);
    v.box(x, PH + 0.13, 0, 0.08, 0.06, 0.08, C.gold);
    for (const y of [0.3, 1.35]) v.box(x - sx * 0.1, y, 0, 0.04, 0.14, 0.06, C.iron); // hinge pins / keepers
  }
  // a creeper on the left post
  for (let k = 0; k < 9; k++) {
    const y = 0.15 + k * 0.16, a = k * 1.3;
    v.box(-PX + Math.sin(a) * 0.1, y, Math.cos(a) * 0.1, 0.1, 0.07, 0.1, k % 2 ? C.leaf : C.leafL, a);
  }
  // hasp staple on the right post, the post hook for the open padlock
  v.box(PX - 0.1, 0.9, 0.06, 0.03, 0.08, 0.05, C.iron);
  v.box(PX - 0.11, 0.9, 0.1, 0.03, 0.03, 0.03, C.ironL);
  v.box(PX, 1.33, 0.1, 0.03, 0.03, 0.05, C.iron);
  v.box(PX, 1.35, 0.125, 0.03, 0.06, 0.012, C.iron);
  // bell bracket on the right post top, arm out over the lane side
  v.box(PX, 1.66, 0.14, 0.04, 0.04, 0.3, C.iron);
  stick(v, [PX, 1.5, 0.09], [PX, 1.64, 0.25], 0.03, C.iron);
  v.box(PX, 1.69, 0.28, 0.04, 0.04, 0.04, C.gold);
  root.add(v.mesh());
  // the leaf, hinged on the left post, opening into the garden (-Z)
  const hinge = new THREE.Group();
  hinge.position.set(-LW / 2, 0, 0);
  root.add(hinge);
  const lv = new VoxelBuilder();
  for (const y of [0.16, 0.8, LH]) lv.box(LW / 2, y, 0, LW, 0.09, 0.07, jitter(C.wood, 0.05, y * 9));
  for (const x of [0.04, LW - 0.04]) lv.box(x, (0.12 + LH + 0.05) / 2, 0, 0.08, LH - 0.07, 0.08, C.woodD);
  stick(lv, [0.1, 0.22, -0.045], [LW - 0.12, LH - 0.06, -0.045], 0.07, C.wood, 0.03); // brace (garden side)
  const GAPX = 1.12;
  for (let x = 0.18; x < LW - 0.1; x += 0.12) {
    if (Math.abs(x - GAPX) < 0.07) continue; // the hand-wide gap
    lv.box(x, (0.12 + LH + 0.16) / 2, 0, 0.024, LH + 0.04, 0.024, C.iron);
    lv.box(x, LH + 0.12, 0, 0.045, 0.06, 0.045, C.ironL, Math.PI / 4);
  }
  lv.box(LW - 0.08, 0.9, 0.06, 0.12, 0.05, 0.02, C.iron); // hasp plate
  lv.box(LW - 0.02, 0.9, 0.06, 0.04, 0.06, 0.02, C.ironL);
  for (const y of [0.3, 1.35]) lv.box(0.12, y, 0.045, 0.2, 0.05, 0.015, C.iron);
  lv.box(LW - 0.2, 1.05, 0.05, 0.05, 0.12, 0.03, C.brassD); // latch knob
  hinge.add(lv.mesh());
  // padlock: on the hasp (locked) or on the post hook (open)
  const pl = new VoxelBuilder();
  padlockInto(pl, PX - 0.11, 0.82, 0.12, false, 1.1);
  const lockOn = pl.mesh({ px: 1.2 });
  root.add(lockOn);
  const po = new VoxelBuilder();
  padlockInto(po, PX, 1.25, 0.14, true, 1.1);
  const lockOff = po.mesh({ px: 1.2 });
  root.add(lockOff);
  // the bell and its cord (swing together)
  const bell = new THREE.Group();
  bell.position.set(PX, 1.67, 0.28);
  root.add(bell);
  const bv = new VoxelBuilder();
  bv.box(0, -0.03, 0, 0.012, 0.05, 0.012, C.iron);
  prism(bv, 0, -0.08, 0, 0.025, 0.055, 0.07, C.brass, 8);
  prism(bv, 0, -0.12, 0, 0.065, 0.065, 0.014, C.brassD, 8);
  bv.box(0, -0.14, 0, 0.022, 0.022, 0.022, C.brassD);
  bv.box(0, -0.4, 0.0, 0.012, 0.52, 0.012, C.twine);
  bv.box(0, -0.68, 0.0, 0.03, 0.05, 0.03, C.maroon);
  bell.add(bv.mesh({ px: 1.2 }));
  // the loaf in paper on the left post's cap
  const lp = new VoxelBuilder();
  parcelInto(lp, -PX, PH + 0.16, 0.0, 0.25);
  const parcel = lp.mesh({ px: 1.2 });
  root.add(parcel);
  const sh = shadowUnder(root, 1.3, 0.35, 0, 0, 0.4);
  let ringT = 9;
  function setLocked(b) { lockOn.visible = !!b; lockOff.visible = !b; }
  function setAjar(t) { hinge.rotation.y = 1.6 * Math.pow(clamp01(t), 1.8); }
  setLocked(locked);
  setAjar(ajar);
  parcel.visible = !!loaf;
  return {
    root, door: hinge,
    gap: new THREE.Vector3(-LW / 2 + GAPX, 1.0, 0.1),
    setLocked, setAjar,
    setLoaf(b) { parcel.visible = !!b; },
    ring() { ringT = 0; },
    update(dt) {
      if (ringT > 3) return;
      ringT += dt;
      const a = Math.exp(-ringT * 2.2) * Math.sin(ringT * 16) * 0.5;
      bell.rotation.z = a;
      bell.rotation.x = a * 0.4;
    },
    dispose() { sh.geometry.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// trellis post, its vine and tendril, the sapling it winds round
// ---------------------------------------------------------------------------------------------
/**
 * A bamboo post (0.2 x 1.8 h) with a vine climbing it and one tendril, and a young sapling (0.9 h) beside it.
 * setTendril(0..1, 'coil' | 'reach' | 'touch'): how far the tendril has grown along its path; coil = wound round
 * the sapling, reach = curling back toward the post in the air, touch = its tip resting on the post in one loose
 * loop. setBend(0..1): the sapling bends toward the post (the coil drags it).
 */
export function trellisPost({ tendril = 1, mode = 'coil', bend = mode === 'coil' ? 0.7 : 0 } = {}) {
  const root = new THREE.Group();
  root.name = 'trellisPost';
  const v = new VoxelBuilder();
  prism(v, 0, 0.9, 0, 0.042, 0.048, 1.8, C.bamboo, 8);
  for (let y = 0.28; y < 1.8; y += 0.32) { prism(v, 0, y, 0, 0.052, 0.052, 0.025, C.bambooD, 8); prism(v, 0, y + 0.02, 0, 0.046, 0.046, 0.01, C.bambooL, 8); }
  prism(v, 0, 1.805, 0, 0.044, 0.044, 0.012, C.bambooD, 8);
  prism(v, 0, 0.03, 0, 0.1, 0.12, 0.06, C.soilD, 8);
  for (const y of [0.6, 1.2]) prism(v, 0, y, 0, 0.054, 0.054, 0.03, C.twine, 8);
  prism(v, 0.25, 0.012, 0, 0.42, 0.45, 0.024, C.soil, 10);
  for (let k = 0; k < 7; k++) v.box(0.25 + Math.cos(k * 1.9) * 0.3, 0.03, Math.sin(k * 1.9) * 0.25, 0.05, 0.02, 0.04, C.soilD);
  // the vine climbing the post: a helix of stem with leaves
  let prev = [0.06, 0.02, 0.0];
  for (let k = 1; k <= 22; k++) {
    const a = k * 0.62, y = k * 0.045;
    const p = [Math.cos(a) * 0.058, y, Math.sin(a) * 0.058];
    stick(v, prev, p, 0.014, C.leafD);
    if (k % 2 === 0) {
      const lx = Math.cos(a) * 0.12, lz = Math.sin(a) * 0.12;
      boxR(v, lx, y + 0.01, lz, 0.085, 0.014, 0.075, k % 4 ? C.leaf : C.leafL, 0.3, -a, 0);
      boxR(v, lx + Math.cos(a) * 0.03, y + 0.005, lz + Math.sin(a) * 0.03, 0.04, 0.012, 0.035, C.leafD, 0.3, -a, 0);
    }
    prev = p;
  }
  root.add(v.mesh());
  // the sapling: base group (lean) + top group (bend)
  const SX = 0.5, SH1 = 0.45;
  const sap = new THREE.Group();
  sap.position.set(SX, 0, 0);
  root.add(sap);
  const s1 = new VoxelBuilder();
  s1.box(0, SH1 / 2, 0, 0.03, SH1, 0.03, '#7E6A44');
  s1.box(0, 0.02, 0, 0.07, 0.04, 0.07, C.soilD);
  boxR(s1, 0.05, 0.3, 0.0, 0.06, 0.012, 0.04, C.leafL, 0, 0, -0.4);
  sap.add(s1.mesh({ px: 1.2 }));
  const sapTop = new THREE.Group();
  sapTop.position.set(0, SH1, 0);
  sap.add(sapTop);
  const s2 = new VoxelBuilder();
  s2.box(0, 0.22, 0, 0.024, 0.44, 0.024, '#86744A');
  stick(s2, [0, 0.25, 0], [0.12, 0.36, 0.02], 0.014, '#86744A');
  stick(s2, [0, 0.3, 0], [-0.1, 0.4, -0.02], 0.014, '#86744A');
  const crown = [[0, 0.46, 0, 0.16], [0.12, 0.38, 0.03, 0.12], [-0.1, 0.42, -0.02, 0.12], [0.04, 0.52, -0.04, 0.1], [-0.05, 0.36, 0.06, 0.09]];
  crown.forEach(([x, y, z, s], i) => { s2.box(x, y, z, s, s * 0.7, s, i % 2 ? C.leafL : C.leaf, i * 0.6); s2.box(x + 0.02, y + s * 0.3, z, s * 0.6, s * 0.3, s * 0.6, C.leafLL, i); });
  sapTop.add(s2.mesh());
  // the tendril (instanced segments + three little leaves)
  const SEG = 44;
  const tmesh = new THREE.InstancedMesh(UNIT, toon('#6E9A4E'), SEG);
  tmesh.userData.sharedGeo = true;
  tmesh.frustumCulled = false;
  root.add(tmesh);
  addOutline(tmesh, { px: 1.0 });
  const tipLeaf = new THREE.InstancedMesh(UNIT, toon(C.leafL), 3);
  tipLeaf.userData.sharedGeo = true;
  tipLeaf.frustumCulled = false;
  root.add(tipLeaf);
  const pts = Array.from({ length: SEG + 1 }, () => new THREE.Vector3());
  const O = new THREE.Vector3(0.05, 0.98, 0.03);
  const T0 = new THREE.Vector3(), T1 = new THREE.Vector3(), T2 = new THREE.Vector3();
  const Cb = new THREE.Vector3(), Cc = new THREE.Vector3();
  let bendT = 0, grow = 1, md = mode;
  // a point on the sapling (sapling-local, ly from its foot) in root space, after lean and bend
  function sapPoint(lx, ly, lz, out) {
    let x = lx, y = ly;
    if (ly > SH1) {
      const a2 = sapTop.rotation.z, yy = ly - SH1;
      x = lx * Math.cos(a2) - yy * Math.sin(a2);
      y = lx * Math.sin(a2) + yy * Math.cos(a2) + SH1;
    }
    const a1 = sap.rotation.z;
    return out.set(SX + x * Math.cos(a1) - y * Math.sin(a1), x * Math.sin(a1) + y * Math.cos(a1), lz);
  }
  function bez(a, b, c, d, t, out) {
    const u = 1 - t;
    return out.set(
      u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
      u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
      u * u * u * a.z + 3 * u * u * t * b.z + 3 * u * t * t * c.z + t * t * t * d.z);
  }
  function pathPoint(s, out) {
    if (md === 'coil') {
      sapPoint(0, 0.66, 0.0, T0);
      if (s < 0.38) {
        Cb.set(O.x + 0.15, O.y + 0.18, O.z + 0.05);
        Cc.set(T0.x - 0.12, T0.y + 0.1, 0.06);
        return bez(O, Cb, Cc, T0, s / 0.38, out);
      }
      const u = (s - 0.38) / 0.62, th = u * Math.PI * 4.2 + Math.PI;
      return sapPoint(Math.cos(th) * 0.03, 0.66 + u * 0.2, Math.sin(th) * 0.03, out);
    }
    const touch = md === 'touch';
    if (s < 0.8) {
      Cb.set(0.3, 1.12, 0.08);
      Cc.set(0.3, 1.42, 0.06);
      T1.set(touch ? 0.06 : 0.1, 1.4, touch ? 0.05 : 0.09);
      return bez(O, Cb, Cc, T1, s / 0.8, out);
    }
    const u = (s - 0.8) / 0.2;
    if (touch) { const th = Math.PI * 0.35 + u * Math.PI * 1.25; return out.set(Math.cos(th) * 0.065, 1.4 + u * 0.06, Math.sin(th) * 0.065); }
    const th = u * Math.PI * 1.6; // a little curl at the tip, in the air
    return out.set(0.1 + Math.sin(th) * 0.035, 1.4 + (1 - Math.cos(th)) * 0.03, 0.08 + Math.cos(th) * 0.01);
  }
  function rebuild() {
    sap.rotation.z = bendT * 0.16;
    sapTop.rotation.z = bendT * 0.5;
    const n = Math.max(1, Math.round(SEG * grow));
    for (let i = 0; i <= SEG; i++) pathPoint(Math.min(i, n) / SEG, pts[i]);
    for (let i = 0; i < SEG; i++) {
      if (i >= n || grow < 0.01) { _m.makeScale(0.0001, 0.0001, 0.0001); tmesh.setMatrixAt(i, _m); continue; }
      _d.subVectors(pts[i + 1], pts[i]);
      const len = _d.length() + 0.004;
      _q.setFromUnitVectors(_up, _d.normalize());
      const th = 0.014 * (1 - (i / SEG) * 0.45);
      _m.compose(_p.addVectors(pts[i], pts[i + 1]).multiplyScalar(0.5), _q, _s.set(th, len, th));
      tmesh.setMatrixAt(i, _m);
    }
    tmesh.instanceMatrix.needsUpdate = true;
    [0.2, 0.45, 0.7].forEach((f, k) => {
      const i = Math.floor(f * SEG);
      if (i >= n || grow < 0.05) { _m.makeScale(0.0001, 0.0001, 0.0001); tipLeaf.setMatrixAt(k, _m); return; }
      _m.compose(_p.copy(pts[i]).add(T2.set(0.0, 0.025, 0.03)), _q.setFromEuler(_e.set(0.5, k * 1.4, 0.3)), _s.set(0.07, 0.012, 0.055));
      tipLeaf.setMatrixAt(k, _m);
    });
    tipLeaf.instanceMatrix.needsUpdate = true;
  }
  function setTendril(t, m) { grow = clamp01(t); if (m) md = m; rebuild(); }
  function setBend(t) { bendT = clamp01(t); rebuild(); }
  bendT = clamp01(bend);
  setTendril(tendril, mode);
  const sh = shadowUnder(root, 0.55, 0.35, 0.25, 0, 0.35);
  return { root, sapling: sap, setTendril, setBend, get mode() { return md; }, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// bulb rack, seed beds, name sticks, garden bench, seed tin, watering can
// ---------------------------------------------------------------------------------------------
function bulbInto(v, x, y, z, s = 1, seed = 0) {
  const col = jitter(seed % 3 ? C.bulb : C.bulbL, 0.08, seed);
  prism(v, x, y + 0.02 * s, z, 0.04 * s, 0.03 * s, 0.04 * s, col, 6, seed);
  prism(v, x, y + 0.05 * s, z, 0.022 * s, 0.04 * s, 0.025 * s, shade(col, 0.92), 6, seed);
  v.box(x, y + 0.072 * s, z, 0.01 * s, 0.025 * s, 0.01 * s, C.bulbD);
  v.box(x, y + 0.004, z, 0.04 * s, 0.008, 0.04 * s, '#D9C7A0'); // root plate
}

/** A low slatted rack (1.4 w x 0.9 h) heaped with brown bulbs. setCount(n) (0..72). */
export function bulbRack({ count = 48 } = {}) {
  const root = new THREE.Group();
  root.name = 'bulbRack';
  const v = new VoxelBuilder();
  const W = 1.4, D = 0.5;
  for (const fx of [-1, 1]) for (const fz of [-1, 1]) v.box(fx * (W / 2 - 0.03), 0.45, fz * (D / 2 - 0.03), 0.05, 0.9, 0.05, C.woodD);
  for (const y of [0.3, 0.68]) {
    for (let k = 0; k < 6; k++) v.box(0, y, -D / 2 + 0.05 + k * 0.08, W - 0.04, 0.025, 0.05, jitter(C.woodL, 0.05, k + y * 10));
    v.box(0, y + 0.04, D / 2 - 0.02, W, 0.06, 0.02, C.wood);
    for (const fx of [-1, 1]) v.box(fx * (W / 2 - 0.03), y - 0.03, 0, 0.04, 0.03, D, C.woodD);
  }
  v.box(0, 0.88, -D / 2 + 0.02, W, 0.04, 0.04, C.woodD);
  v.box(0, 0.78, D / 2 - 0.015, 0.36, 0.1, 0.01, C.paper);
  v.box(-0.06, 0.79, D / 2 - 0.008, 0.18, 0.015, 0.004, C.ink);
  v.box(0.06, 0.765, D / 2 - 0.008, 0.16, 0.012, 0.004, '#9A8A70');
  prism(v, W / 2 + 0.28, 0.08, 0.1, 0.2, 0.16, 0.16, C.bamboo, 10);
  prism(v, W / 2 + 0.28, 0.165, 0.1, 0.205, 0.205, 0.02, C.bambooD, 10);
  for (let k = 0; k < 5; k++) bulbInto(v, W / 2 + 0.2 + (k % 3) * 0.07, 0.15, 0.04 + (k >> 1) * 0.07, 1, k + 90);
  root.add(v.mesh());
  const r = rand(17);
  const spots = [];
  for (const [y0, cap] of [[0.69, 38], [0.31, 34]]) {
    for (let i = 0; i < cap; i++) {
      const layer = i < cap * 0.65 ? 0 : 1;
      const x = (r() - 0.5) * (layer ? 0.9 : 1.22), z = (r() - 0.5) * (layer ? 0.24 : 0.36);
      spots.push([x, y0 + 0.012 + layer * 0.055, z, 0.9 + r() * 0.3]);
    }
  }
  let mesh = null, n = count;
  function setCount(k) {
    n = Math.max(0, Math.min(spots.length, k | 0));
    freeMesh(mesh);
    const bv = new VoxelBuilder();
    for (let i = 0; i < n; i++) { const [x, y, z, s] = spots[i]; bulbInto(bv, x, y, z, s, i); }
    mesh = bv.mesh({ px: 1.0 });
    root.add(mesh);
  }
  setCount(count);
  const sh = shadowUnder(root, 0.95, 0.4, 0.1, 0, 0.42);
  return { root, setCount, get count() { return n; }, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

/** A seedling (stem + leaf pairs), foot at y; flat = lying in the mud. */
function seedlingInto(v, x, y, z, h, seed, flat = false) {
  if (flat) {
    const a = seed * 2.1;
    stick(v, [x, y + 0.005, z], [x + Math.cos(a) * h, y + 0.012, z + Math.sin(a) * h * 0.6], 0.01, '#7FA05C');
    boxR(v, x + Math.cos(a) * h, y + 0.012, z + Math.sin(a) * h * 0.6, 0.05, 0.006, 0.035, seed % 2 ? '#7E9A55' : '#6E8A4A', 0, -a, 0);
    return;
  }
  v.box(x, y + h / 2, z, 0.012, h, 0.012, '#7FA05C');
  const a = seed * 1.3;
  for (const sd of [-1, 1]) boxR(v, x + Math.cos(a) * sd * 0.025, y + h, z + Math.sin(a) * sd * 0.025, 0.05, 0.008, 0.032, sd > 0 ? C.leaf : C.leafL, 0, -a, sd * 0.35);
  if (h > 0.09) for (const sd of [-1, 1]) boxR(v, x - Math.sin(a) * sd * 0.022, y + h * 0.65, z + Math.cos(a) * sd * 0.022, 0.04, 0.008, 0.026, C.leafD, 0, -a + Math.PI / 2, sd * 0.4);
}
function stickCardInto(v, x, y, z, h = 0.38) {
  v.box(x, y + h / 2, z, 0.026, h, 0.026, C.woodL);
  v.box(x, y + h - 0.04, z + 0.014, 0.15, 0.1, 0.008, C.maroonD); // frame
  v.box(x, y + h - 0.04, z + 0.019, 0.13, 0.08, 0.004, '#FBF5E6');
  v.box(x, y + h - 0.004, z + 0.02, 0.13, 0.014, 0.003, C.maroon);
  v.box(x, y + h - 0.036, z + 0.022, 0.1, 0.014, 0.002, C.ink);
  v.box(x, y + h - 0.06, z + 0.022, 0.07, 0.01, 0.002, '#6E5E4C');
}

/**
 * A raised seed bed (w x d x 0.3) with a dated board at its head (= gardenBed).
 * setState('tended' | 'growing' | 'flat' | 'sown'): neat rows / rain-flattened in mud and puddles / fresh furrows.
 */
export function seedBeds({ w = 3, d = 1.2, state = 'tended', seed = 1, date = '၁၀ ရက်' } = {}) {
  const root = new THREE.Group();
  root.name = 'seedBeds';
  const v = new VoxelBuilder();
  const H = 0.3;
  for (const z of [-d / 2, d / 2]) for (const [y0, y1, k] of [[0, 0.15, 0], [0.15, H, 1]]) v.boxMin(-w / 2, y0, z - 0.03, w / 2, y1 - 0.005, z + 0.03, jitter(C.wood, 0.06, k + z * 7));
  for (const x of [-w / 2, w / 2]) for (const [y0, y1, k] of [[0, 0.15, 2], [0.15, H, 3]]) v.boxMin(x - 0.03, y0, -d / 2, x + 0.03, y1 - 0.005, d / 2, jitter(C.woodD, 0.05, k + x));
  for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) { v.box(x, H / 2 + 0.04, z, 0.07, H + 0.08, 0.07, C.woodD); v.box(x, H + 0.09, z, 0.05, 0.02, 0.05, C.gold); }
  v.box(-w / 2 - 0.18, 0.28, 0.25, 0.04, 0.56, 0.04, C.woodD);
  v.box(-w / 2 - 0.18, 0.5, 0.275, 0.34, 0.2, 0.02, C.woodD);
  v.box(-w / 2 + 0.3, 0.22, d / 2 + 0.032, 0.5, 0.01, 0.004, C.maroon); // printed date line on the plank
  root.add(v.mesh());
  const { g, tex } = canvasTex(256, 150);
  const card = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.176), basic('#ffffff', { map: tex }));
  card.position.set(-w / 2 - 0.18, 0.5, 0.287);
  root.add(card);
  const drawDate = () => {
    g.fillStyle = '#F4ECD9'; g.fillRect(0, 0, 256, 150);
    g.strokeStyle = C.goldD; g.lineWidth = 6; g.strokeRect(5, 5, 246, 140);
    g.fillStyle = 'rgba(110,31,42,0.2)'; for (let y = 40; y < 150; y += 30) g.fillRect(14, y + 24, 228, 2);
    g.fillStyle = C.maroon; g.font = `700 52px ${FONT_MY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(date, 128, 74, 230);
    tex.needsUpdate = true;
  };
  drawDate();
  fontsReady().then(drawDate);
  const looks = {};
  function build(s) {
    const r = rand(seed * 13 + 5);
    const sv = new VoxelBuilder();
    const top = H - 0.02;
    const wet = s === 'flat';
    sv.boxMin(-w / 2 + 0.03, 0.02, -d / 2 + 0.03, w / 2 - 0.03, top, d / 2 - 0.03, wet ? C.soilW : C.soil);
    const rows = Math.max(2, Math.round((d - 0.2) / 0.26));
    for (let k = 0; k < rows; k++) {
      const z = -d / 2 + 0.16 + (k * (d - 0.32)) / (rows - 1);
      if (s === 'sown') {
        sv.box(0, top + 0.002, z, w - 0.16, 0.006, 0.07, C.soilD);
        for (const sz of [-1, 1]) sv.box(0, top + 0.012, z + sz * 0.055, w - 0.16, 0.02, 0.03, '#9C7A58');
        for (let x = -w / 2 + 0.14; x < w / 2 - 0.1; x += 0.1) sv.box(x + (r() - 0.5) * 0.03, top + 0.008, z, 0.018, 0.01, 0.018, C.cream);
      } else if (wet) {
        for (let x = -w / 2 + 0.14; x < w / 2 - 0.1; x += 0.13) if (r() > 0.2) seedlingInto(sv, x, top, z + (r() - 0.5) * 0.04, 0.07 + r() * 0.05, Math.floor(r() * 9), true);
      } else {
        sv.box(0, top + 0.012, z, w - 0.14, 0.025, 0.1, '#7E5C40');
        for (let x = -w / 2 + 0.14; x < w / 2 - 0.1; x += 0.13) seedlingInto(sv, x + (r() - 0.5) * 0.02, top + 0.02, z + (r() - 0.5) * 0.02, 0.06 + r() * 0.07, Math.floor(r() * 9));
      }
      if (k % 2 === 0) {
        if (wet && k === 0) boxR(sv, w / 2 - 0.2, top + 0.02, z, 0.3, 0.018, 0.018, C.woodL, 0, 0.3, 0.1);
        else stickCardInto(sv, w / 2 - 0.12, top, z);
      }
    }
    if (wet) {
      for (let k = 0; k < 6; k++) boxR(sv, (r() - 0.5) * (w - 0.5), top + 0.004, (r() - 0.5) * (d - 0.4), 0.2 + r() * 0.3, 0.006, 0.12 + r() * 0.12, k % 2 ? C.water : C.waterL, 0, r() * 3, 0);
      for (let k = 0; k < 10; k++) sv.box((r() - 0.5) * w, 0.05 + r() * 0.15, d / 2 + 0.034, 0.05 + r() * 0.06, 0.02 + r() * 0.03, 0.004, C.soilW);
      for (let k = 0; k < 4; k++) boxR(sv, (r() - 0.5) * w, 0.004, d / 2 + 0.15 + r() * 0.15, 0.3 + r() * 0.3, 0.006, 0.12, C.water, 0, r(), 0);
    }
    return sv.mesh({ px: 1.1 });
  }
  let cur = null;
  function setState(s) {
    if (s === 'growing') s = 'tended';
    if (!['tended', 'flat', 'sown'].includes(s)) s = 'tended';
    if (!looks[s]) { looks[s] = build(s); root.add(looks[s]); }
    for (const k in looks) looks[k].visible = k === s;
    cur = s;
  }
  setState(state);
  const sh = shadowUnder(root, w * 0.6, d * 0.65, 0, 0, 0.35);
  root.userData.footprint = { w: w + 0.2, d: d + 0.1 };
  return { root, setState, get state() { return cur; }, dispose() { tex.dispose(); card.material.dispose(); sh.geometry.dispose(); disposeTree(root); } };
}
export const gardenBed = seedBeds;

/**
 * A name stick (0.47 m at the default size 1.35) with a card (canvas text). setText(text | { my, en }).
 * Lesson ch 16 (D10): the name sticks U Hpo Htaw holds and Maya plants; sized up to read on a 412 px phone.
 */
export function nameStick(text = '', { size = 1.35 } = {}) {
  const root = new THREE.Group();
  root.name = 'nameStick';
  const body = new THREE.Group();
  body.scale.setScalar(size);
  root.add(body);
  const v = new VoxelBuilder();
  v.box(0, 0.16, 0, 0.022, 0.32, 0.022, C.woodL);
  v.box(0, 0.01, 0, 0.012, 0.02, 0.012, C.woodD);
  v.box(0, 0.3, 0.006, 0.17, 0.115, 0.012, C.maroonD); // frame in front of the stick
  v.box(0, 0.365, 0.0, 0.024, 0.024, 0.024, C.brass);
  body.add(v.mesh({ px: 1.2 }));
  const { g, tex } = canvasTex(256, 170);
  const card = new THREE.Mesh(new THREE.PlaneGeometry(0.155, 0.103), basic('#ffffff', { map: tex }));
  card.position.set(0, 0.3, 0.0135);
  body.add(card);
  let cur = textOf(text);
  const draw = () => {
    g.fillStyle = '#FBF5E6'; g.fillRect(0, 0, 256, 170);
    g.fillStyle = C.maroon; g.fillRect(0, 0, 256, 18);
    g.strokeStyle = C.goldD; g.lineWidth = 5; g.strokeRect(3, 3, 250, 164);
    g.fillStyle = '#1E140C'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `800 ${cur.en ? 44 : 52}px ${FONT_MY}`;
    g.fillText(cur.my, 128, cur.en ? 74 : 96, 236);
    if (cur.en) { g.font = `600 26px ${FONT_SERIF}`; g.fillStyle = '#6E5E4C'; g.fillText(cur.en, 128, 132, 236); }
    tex.needsUpdate = true;
  };
  draw();
  fontsReady().then(draw);
  return { root, setText(t) { cur = textOf(t); draw(); }, dispose() { tex.dispose(); card.material.dispose(); disposeTree(root); } };
}

/** A plain garden bench (1.4 w). setTurn(ry) snaps, turnTo(ry) eases (update). visitors: it faces a low wall. */
export function gardenBench({ visitors = false, turn = 0 } = {}) {
  const root = new THREE.Group();
  root.name = 'gardenBench';
  const pivot = new THREE.Group();
  root.add(pivot);
  const v = new VoxelBuilder();
  for (const fx of [-1, 1]) {
    for (const fz of [-1, 1]) v.box(fx * 0.58, 0.21, fz * 0.16, 0.07, 0.42, 0.07, C.woodD);
    v.box(fx * 0.58, 0.1, 0, 0.05, 0.05, 0.34, C.woodD);
    v.box(fx * 0.58, 0.62, -0.2, 0.06, 0.42, 0.06, C.woodD);
  }
  for (let k = 0; k < 3; k++) v.box(0, 0.445, -0.13 + k * 0.13, 1.4, 0.045, 0.115, jitter(C.wood, 0.06, k));
  for (const y of [0.62, 0.78]) v.box(0, y, -0.21, 1.36, 0.09, 0.035, jitter(C.woodL, 0.05, y * 10));
  v.box(0, 0.47, 0.19, 1.4, 0.01, 0.012, C.woodD);
  for (let k = 0; k < 3; k++) v.box(-0.4 + k * 0.4, 0.47, 0.0, 0.08, 0.004, 0.02, C.woodDD);
  pivot.add(v.mesh());
  if (visitors) {
    const wv = new VoxelBuilder();
    for (let row = 0; row < 5; row++) for (let k = 0; k < 8; k++) {
      const x = -0.85 + (row % 2 ? 0.13 : 0) + k * 0.26;
      if (x > 0.86) continue;
      wv.box(x, 0.09 + row * 0.18, 0.95, 0.24, 0.16, 0.2, jitter(C.brick, 0.08, row * 7 + k));
    }
    wv.box(0, 0.92, 0.95, 1.86, 0.06, 0.26, C.stoneL);
    root.add(wv.mesh());
  }
  const sh = shadowUnder(root, 0.8, 0.35, 0, 0, 0.42);
  let target = turn, cur = turn;
  pivot.rotation.y = turn;
  return {
    root, pivot,
    seat: new THREE.Vector3(0, 0.47, 0),
    setTurn(ry) { target = cur = ry; pivot.rotation.y = ry; },
    turnTo(ry) { target = ry; },
    update(dt) { if (Math.abs(target - cur) > 1e-3) { cur += (target - cur) * Math.min(1, dt * 3); pivot.rotation.y = cur; } },
    dispose() { sh.geometry.dispose(); disposeTree(root); },
  };
}

/**
 * A lidded round seed tin (0.2 dia at the default size 1.35) with a painted label; open: lid off beside it, seeds
 * inside. Lesson ch 16 (D10, the planting). Green body + maroon lid so it reads against soil and cream ground.
 */
export function seedTin({ open = false, size = 1.35 } = {}) {
  const root = new THREE.Group();
  root.name = 'seedTin';
  const v = new VoxelBuilder();
  prism(v, 0, 0.055, 0, 0.075, 0.075, 0.11, C.tinL, 10);
  prism(v, 0, 0.055, 0, 0.0765, 0.0765, 0.07, C.green, 10);
  prism(v, 0, 0.055, 0, 0.0775, 0.0775, 0.03, C.cream, 10); // the label band
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; v.box(Math.sin(a) * 0.078, 0.055, Math.cos(a) * 0.078, 0.022, 0.022, 0.006, k % 2 ? C.mustard : C.maroon, a); }
  if (open) {
    prism(v, 0, 0.11, 0, 0.068, 0.068, 0.004, C.soilD, 10);
    for (let k = 0; k < 6; k++) v.box(Math.cos(k) * 0.04, 0.114, Math.sin(k) * 0.04, 0.014, 0.008, 0.014, C.cream);
    prism(v, 0.13, 0.008, 0.05, 0.08, 0.08, 0.016, C.maroon, 10);
  } else {
    prism(v, 0, 0.118, 0, 0.079, 0.079, 0.022, C.maroon, 10);
    prism(v, 0, 0.134, 0, 0.022, 0.022, 0.014, C.gold, 8);
  }
  const m = v.mesh({ px: 1.1 });
  m.scale.setScalar(size);
  root.add(m);
  const sh = shadowUnder(root, 0.09 * size, 0.09 * size, 0, 0, 0.4);
  return { root, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

/** A green-painted tin watering can (0.47 h at the default size 1.35). Lesson ch 16 (D10, watering the beds). */
export function waterCan({ size = 1.35 } = {}) {
  const root = new THREE.Group();
  root.name = 'waterCan';
  const v = new VoxelBuilder();
  prism(v, 0, 0.11, 0, 0.11, 0.12, 0.22, C.green, 10);
  prism(v, 0, 0.115, 0, 0.1215, 0.1215, 0.07, C.greenD, 10); // a darker painted band
  for (const y of [0.03, 0.2]) prism(v, 0, y, 0, 0.123, 0.123, 0.02, C.tinD, 10);
  prism(v, 0, 0.225, 0, 0.07, 0.11, 0.03, C.tinL, 10);
  prism(v, 0, 0.243, 0, 0.06, 0.06, 0.006, C.soot, 10);
  const H = [[-0.12, 0.2], [-0.1, 0.32], [-0.02, 0.36], [0.06, 0.33], [0.08, 0.24]];
  for (let k = 0; k < H.length - 1; k++) stick(v, [H[k][0], H[k][1], 0], [H[k + 1][0], H[k + 1][1], 0], 0.02, C.tinD);
  stick(v, [0.1, 0.05, 0], [0.32, 0.27, 0], 0.03, C.tin);
  prism(v, 0.335, 0.285, 0, 0.045, 0.02, 0.04, C.tinD, 8, 0, 0, -0.8);
  for (let k = 0; k < 4; k++) v.box(-0.06 + k * 0.03, 0.12, 0.112, 0.012, 0.012, 0.004, C.tinD);
  boxR(v, 0.04, 0.17, 0.1, 0.06, 0.04, 0.02, '#6C9270', 0, 0.3, 0); // paint worn off a dent
  const m = v.mesh();
  m.scale.setScalar(size);
  root.add(m);
  const sh = shadowUnder(root, 0.2 * size, 0.15 * size, 0.05 * size, 0, 0.4);
  return { root, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// gourd trellis (up | down after the rain)
// ---------------------------------------------------------------------------------------------
function gourdInto(v, x, y, z, s = 1, lying = 0) {
  if (lying) {
    const ry = lying;
    prism(v, x, y + 0.07 * s, z, 0.075 * s, 0.075 * s, 0.13 * s, C.gourd, 8, ry, 0, Math.PI / 2);
    prism(v, x + Math.cos(ry) * 0.11 * s, y + 0.05 * s, z - Math.sin(ry) * 0.11 * s, 0.05 * s, 0.04 * s, 0.1 * s, C.gourdL, 8, ry, 0, Math.PI / 2);
    return;
  }
  v.box(x, y - 0.03 * s, z, 0.012, 0.06 * s, 0.012, C.leafD);
  prism(v, x, y - 0.08 * s, z, 0.02 * s, 0.035 * s, 0.05 * s, C.gourdL, 8);
  prism(v, x, y - 0.13 * s, z, 0.035 * s, 0.03 * s, 0.05 * s, C.gourd, 8);
  prism(v, x, y - 0.21 * s, z, 0.07 * s, 0.045 * s, 0.11 * s, C.gourd, 8);
  prism(v, x, y - 0.285 * s, z, 0.05 * s, 0.072 * s, 0.04 * s, C.gourdD, 8);
  v.box(x + 0.03 * s, y - 0.2 * s, z + 0.06 * s, 0.02 * s, 0.05 * s, 0.01, C.gourdL);
}

/** A 1.6 m bamboo gourd trellis with big leaves, yellow flowers and hanging bottle gourds. setState('up' | 'down'). */
export function gourdTrellis(state = 'up') {
  const root = new THREE.Group();
  root.name = 'gourdTrellis';
  const base = new VoxelBuilder();
  prism(base, 0, 0.015, 0, 0.75, 0.8, 0.03, C.soil, 10);
  for (let k = 0; k < 8; k++) base.box(Math.cos(k * 0.8) * 0.6, 0.035, Math.sin(k * 0.8) * 0.4, 0.06, 0.025, 0.05, C.soilD);
  root.add(base.mesh({ outline: false }));
  const looks = {};
  function build(s) {
    const r = rand(s === 'up' ? 23 : 29);
    const v = new VoxelBuilder();
    if (s === 'up') {
      for (const x of [-0.6, 0, 0.6]) { prism(v, x, 0.8, 0, 0.025, 0.03, 1.6, C.bamboo, 6); for (let y = 0.35; y < 1.6; y += 0.42) prism(v, x, y, 0, 0.034, 0.034, 0.02, C.bambooD, 6); }
      for (const y of [0.5, 1.0, 1.5]) {
        stick(v, [-0.72, y, 0.035], [0.72, y, 0.035], 0.03, C.bambooL);
        for (const x of [-0.6, 0, 0.6]) v.box(x, y, 0.045, 0.06, 0.05, 0.04, C.twine);
      }
      for (let k = 0; k < 34; k++) {
        const x = (r() - 0.5) * 1.4, y = 0.2 + r() * 1.35, z = 0.04 + r() * 0.08;
        boxR(v, x, y, z, 0.14 + r() * 0.06, 0.12 + r() * 0.05, 0.014, [C.leaf, C.leafD, C.leafL][k % 3], (r() - 0.5) * 0.6, (r() - 0.5) * 0.6, r() * 3);
      }
      for (let k = 0; k < 6; k++) { const x = (r() - 0.5) * 1.3, y = 0.6 + r() * 1.0; v.box(x, y, 0.13, 0.05, 0.05, 0.02, '#F2D24C', 0.785); v.box(x, y, 0.14, 0.02, 0.02, 0.01, '#C9932A'); }
      for (const [x, s2] of [[-0.35, 1], [0.2, 1.15], [0.48, 0.9], [-0.05, 0.85]]) gourdInto(v, x, 1.48, 0.12, s2);
      prism(v, -0.3, 0.12, 0.25, 0.04, 0.05, 0.05, C.leafD, 6); // a bean tangle at its foot
      for (let k = 0; k < 5; k++) stick(v, [-0.3, 0.12, 0.25], [-0.6 + k * 0.08, 0.3 + (k % 2) * 0.12, 0.08], 0.01, '#7FA05C');
    } else {
      stick(v, [-0.62, 0, 0], [-0.2, 0.5, 0.95], 0.05, C.bamboo);
      stick(v, [0.02, 0, 0], [0.25, 0.18, 1.3], 0.05, C.bamboo);
      stick(v, [0.6, 0, -0.05], [0.95, 0.85, 0.7], 0.05, C.bamboo);
      stick(v, [-0.7, 0.2, 0.7], [0.75, 0.32, 0.4], 0.03, C.bambooL);
      stick(v, [-0.6, 0.06, 1.15], [0.5, 0.06, 1.0], 0.03, C.bambooL);
      stick(v, [0.45, 0.62, 0.55], [0.95, 0.55, 0.1], 0.03, C.bambooD);
      for (let k = 0; k < 28; k++) {
        const x = (r() - 0.5) * 1.6, z = 0.2 + r() * 1.0;
        boxR(v, x, 0.03 + r() * 0.06, z, 0.13 + r() * 0.05, 0.012, 0.11 + r() * 0.04, [C.leafD, '#6E8A4A', C.leaf][k % 3], (r() - 0.5) * 0.4, r() * 3, (r() - 0.5) * 0.3);
      }
      gourdInto(v, -0.4, 0, 0.9, 1, 0.6);
      gourdInto(v, 0.3, 0, 1.2, 1.1, -0.9);
      gourdInto(v, 0.75, 0, 0.6, 0.9, 2.1);
      for (let k = 0; k < 3; k++) boxR(v, -0.2 + k * 0.4, 0.004, 0.7 + k * 0.15, 0.4, 0.006, 0.2, C.water, 0, r(), 0);
    }
    return v.mesh();
  }
  let cur = null;
  function setState(s) {
    s = s === 'down' ? 'down' : 'up';
    if (!looks[s]) { looks[s] = build(s); root.add(looks[s]); }
    for (const k in looks) looks[k].visible = k === s;
    cur = s;
  }
  setState(state);
  const sh = shadowUnder(root, 0.95, 0.5, 0, 0.2, 0.35);
  return { root, setState, get state() { return cur; }, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// pots (glazed / terracotta), glaze shelf, shard heap
// ---------------------------------------------------------------------------------------------
const JAR = {
  glaze: { foot: C.terraD, low: C.glazeD, belly: C.glaze, up: C.glaze, sh: C.glazeL, neck: C.glazeD, rim: C.glazeL, band: C.white2 },
  terra: { foot: C.terraD, low: C.terra, belly: C.terraL, up: C.terra, sh: C.terra, neck: C.terraD, rim: C.terraL, band: '#EBDCBF' },
};
/** A round pot (0.425 h at s = 1), foot at y. */
function jarInto(v, x, y, z, s = 1, P = JAR.glaze, ry = 0) {
  const T = [[0.1, 0.035, P.foot], [0.155, 0.07, P.low], [0.195, 0.12, P.belly], [0.175, 0.07, P.up], [0.13, 0.045, P.sh], [0.088, 0.05, P.neck], [0.122, 0.035, P.rim]];
  let yy = y;
  for (const [r, h, col] of T) { prism(v, x, yy + (h * s) / 2, z, r * s, r * s, h * s, col, 8, ry); yy += h * s; }
  prism(v, x, yy + 0.003, z, 0.09 * s, 0.09 * s, 0.006, C.soot, 8, ry);
  if (P.band) prism(v, x, y + 0.18 * s, z, 0.199 * s, 0.199 * s, 0.018 * s, P.band, 8, ry);
  v.box(x - 0.06 * s, y + 0.25 * s, z + 0.17 * s, 0.03 * s, 0.06 * s, 0.01, C.white); // glint
  return yy;
}

/** A shelf of even blue glazed pots (1.3 w x 1.3 h x 0.4 d), three boards of four. */
export function glazeShelf() {
  const root = new THREE.Group();
  root.name = 'glazeShelf';
  const v = new VoxelBuilder();
  const W = 1.3, D = 0.4;
  for (const fx of [-1, 1]) for (const fz of [-1, 1]) v.box(fx * (W / 2 - 0.03), 0.66, fz * (D / 2 - 0.03), 0.05, 1.32, 0.05, C.woodD);
  for (const y of [0.06, 0.5, 0.94]) { v.box(0, y, 0, W, 0.04, D, jitter(C.wood, 0.05, y * 10)); v.box(0, y + 0.03, D / 2 - 0.01, W, 0.02, 0.02, C.woodD); }
  v.box(0, 1.33, -D / 2 + 0.02, W, 0.06, 0.04, C.woodD);
  for (const y of [0.06, 0.5, 0.94]) for (let k = 0; k < 4; k++) jarInto(v, -0.45 + k * 0.3, y + 0.02, 0.0, 0.62, JAR.glaze);
  v.box(0.45, 1.2, 0.04, 0.16, 0.1, 0.01, C.paper);
  v.box(0.45, 1.21, 0.046, 0.1, 0.014, 0.004, C.maroon);
  root.add(v.mesh());
  const sh = shadowUnder(root, 0.8, 0.32, 0, 0, 0.42);
  return { root, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

/** A small heap of shards (0.6 dia): glazed = blue faces with terracotta breaks; else plain terracotta. */
export function shardHeap({ glazed = true, seed = 11 } = {}) {
  const root = new THREE.Group();
  root.name = 'shardHeap';
  const r = rand(seed);
  const v = new VoxelBuilder();
  prism(v, 0, 0.02, 0, 0.26, 0.32, 0.04, C.terraD, 8);
  for (let k = 0; k < 42; k++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.3;
    const x = Math.cos(a) * d, z = Math.sin(a) * d, y = 0.03 + (1 - d / 0.3) * 0.14 + r() * 0.02;
    const w = 0.07 + r() * 0.07, dd = 0.05 + r() * 0.05, rx = (r() - 0.5) * 1.2, ry = r() * 3, rz = (r() - 0.5) * 1.2;
    const face = glazed ? [C.glaze, C.glazeL, C.glazeD][k % 3] : [C.terra, C.terraL, C.terraD][k % 3];
    boxR(v, x, y, z, w, 0.016, dd, C.terra, rx, ry, rz);
    boxR(v, x, y + 0.01, z, w * 0.92, 0.008, dd * 0.9, face, rx, ry, rz);
  }
  root.add(v.mesh({ px: 1.1 }));
  const sh = shadowUnder(root, 0.42, 0.38, 0, 0, 0.35);
  return { root, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// the big kiln in its roofed shed (Day 2's kiln x 1.8)
// ---------------------------------------------------------------------------------------------
/** kilnBig = bottleKiln: Day 2's kiln() x 1.8 in an open shed with a tin roof, its chimney through the roof, warm
 * pots stacked beside, firewood, a water barrel. setGlow(0..1), setOpen(0..1), setSmoke(0..1), update(dt, t). */
export function kilnBig({ glow = 0, smoke = 0.2, open = 0 } = {}) {
  const root = new THREE.Group();
  root.name = 'kilnBig';
  const k = kiln();
  k.root.scale.setScalar(1.8);
  root.add(k.root);
  const v = new VoxelBuilder();
  const X = 3.0, ZB = -2.3, ZF = 2.9, YB = 3.65, YF = 3.0;
  // floor of beaten earth and a brick apron
  v.boxMin(-X - 0.1, 0, ZB - 0.1, X + 0.1, 0.03, ZF + 0.1, '#B79A78');
  for (let i = 0; i < 9; i++) v.box(-1.2 + i * 0.3, 0.035, ZF - 0.25, 0.28, 0.02, 0.4, jitter(C.brick, 0.08, i));
  // posts and beams
  for (const x of [-X, 0.0, X]) for (const z of [ZB, ZF]) {
    if (x === 0 && z === ZF) continue;
    const top = z === ZB ? YB : YF;
    v.box(x, top / 2, z, 0.16, top, 0.16, jitter(C.woodD, 0.05, x + z));
    v.box(x, 0.08, z, 0.28, 0.16, 0.28, C.stone);
  }
  v.box(0, YF, ZF, 2 * X + 0.3, 0.14, 0.16, C.woodD);
  v.box(0, YB, ZB, 2 * X + 0.3, 0.14, 0.16, C.woodD);
  for (const x of [-X, X]) stick(v, [x, YF, ZF], [x, YB, ZB], 0.14, C.woodD);
  for (const x of [-X, X]) for (const z of [ZB, ZF]) stick(v, [x, (z === ZB ? YB : YF) - 0.6, z], [x + (x < 0 ? 0.5 : -0.5), z === ZB ? YB : YF, z], 0.08, C.wood);
  // corrugated tin roof with a hole for the chimney (x -0.45..0.45, z -0.45..0.45)
  const rl = Math.hypot(ZF - ZB + 0.6, YB - YF), ra = Math.atan2(YB - YF, ZF - ZB + 0.6);
  const yAt = (z) => YF + 0.1 + ((ZF + 0.3 - z) / (ZF - ZB + 0.6)) * (YB - YF);
  const panels = [[-X - 0.3, -0.45, ZB - 0.3, ZF + 0.3], [0.45, X + 0.3, ZB - 0.3, ZF + 0.3], [-0.45, 0.45, ZB - 0.3, -0.45], [-0.45, 0.45, 0.45, ZF + 0.3]];
  panels.forEach(([x0, x1, z0, z1], pi) => {
    const zc = (z0 + z1) / 2, len = (z1 - z0) / Math.cos(ra);
    boxR(v, (x0 + x1) / 2, yAt(zc), zc, x1 - x0, 0.04, len, '#9C978B', ra, 0, 0);
    for (let x = x0 + 0.08; x < x1 - 0.02; x += 0.16) boxR(v, x, yAt(zc) + 0.03, zc, 0.05, 0.03, len, '#B4AFA2', ra, 0, 0);
    if (pi < 2) for (let j = 0; j < 3; j++) { const rz = z0 + 0.6 + j * 1.6; boxR(v, x0 + 0.5 + j * 0.7, yAt(rz) + 0.05, rz, 0.5, 0.012, 0.4, jitter('#9E5A3A', 0.1, j + pi * 3), ra, 0, 0); }
  });
  void rl;
  // flashing collar round the chimney
  v.box(0, yAt(0) + 0.08, 0, 0.6, 0.12, 0.6, '#7F7A70');
  // pots stacked beside (left), firewood under the back eave, a water barrel
  for (let row = 0; row < 3; row++) for (let i = 0; i < 3 - row; i++) jarInto(v, -2.45 + i * 0.36 + row * 0.18, row * 0.3, -0.4, 0.7, JAR.terra, i * 0.4);
  for (let i = 0; i < 4; i++) jarInto(v, -2.5 + i * 0.32, 0, 0.5, 0.55, JAR.terra);
  for (let row = 0; row < 4; row++) for (let i = 0; i < 7; i++) { v.box(-1.4 + i * 0.4 + (row % 2) * 0.2, 0.1 + row * 0.18, ZB + 0.35, 0.18, 0.17, 0.6, jitter(C.wood, 0.1, i + row * 7)); v.box(-1.4 + i * 0.4 + (row % 2) * 0.2, 0.1 + row * 0.18, ZB + 0.656, 0.12, 0.12, 0.004, '#E2C29C'); }
  prism(v, 2.5, 0.38, -1.6, 0.3, 0.27, 0.76, C.woodD, 10);
  for (const y of [0.15, 0.6]) prism(v, 2.5, y, -1.6, 0.31, 0.31, 0.04, C.iron, 10);
  prism(v, 2.5, 0.765, -1.6, 0.25, 0.25, 0.01, C.water, 10);
  stick(v, [2.2, 0.0, -0.9], [2.0, 1.6, -1.1], 0.04, C.woodL); // a rake leaning
  v.box(2.0, 1.62, -1.1, 0.4, 0.04, 0.05, C.iron);
  root.add(v.mesh());
  const top = (0.14 + 1.5 + 0.08 + 0.584) * 1.8;
  const sm = smokeFx([[0, top + 0.1, 0]], { n: 12, rise: 3.2, size: 0.42, spread: 0.4, drift: 0.9, speed: 0.16 });
  root.add(sm.mesh);
  const sh = shadowUnder(root, 3.4, 2.9, 0, 0.3, 0.38);
  k.setGlow(glow);
  k.setOpen(open);
  sm.setAmount(smoke);
  root.userData.footprint = { w: 6.4, d: 5.6 };
  return {
    root, kiln: k,
    setGlow: k.setGlow, setOpen: k.setOpen, setSmoke: sm.setAmount,
    update(dt, t) { sm.update(t); },
    dispose() { k.dispose(); sh.geometry.dispose(); disposeTree(root); },
  };
}
export const bottleKiln = kilnBig;

// ---------------------------------------------------------------------------------------------
// market stall with a cloth awning (= stallAwning)
// ---------------------------------------------------------------------------------------------
/** A low market stall (w x ~1.9 h): plank platform, cloth skirt, bamboo poles, a cloth awning with a scalloped
 * valance and a chalk slate leaning on the front. goods: null (empty) | 'pots' | 'rice'. slate text via the slate handle. */
export function marketStall({ w = 1.6, color = C.maroon, striped = true, slate = true, goods = null, text = '' } = {}) {
  const root = new THREE.Group();
  root.name = 'marketStall';
  const v = new VoxelBuilder();
  const D = 0.75, TY = 0.55, A0 = 1.95, A1 = 1.55;
  const alt = color === C.cream ? C.maroon : C.cream;
  // platform on crates
  for (const fx of [-1, 1]) v.box(fx * (w / 2 - 0.2), TY / 2 - 0.02, 0, 0.36, TY - 0.04, D - 0.1, C.woodD);
  for (let k = 0; k < 5; k++) v.box(0, TY, -D / 2 + 0.08 + k * 0.15, w, 0.04, 0.14, jitter(C.woodL, 0.05, k));
  // cloth skirt with a scalloped hem
  v.box(0, TY / 2 + 0.02, D / 2 + 0.01, w - 0.04, TY - 0.06, 0.02, color);
  for (let x = -w / 2 + 0.1; x < w / 2; x += 0.2) v.box(x, 0.06, D / 2 + 0.022, 0.12, 0.05, 0.01, alt);
  v.box(0, TY - 0.05, D / 2 + 0.024, w - 0.04, 0.03, 0.01, C.gold);
  // poles and the awning
  for (const fx of [-1, 1]) {
    prism(v, fx * (w / 2 - 0.02), A1 / 2, D / 2 + 0.12, 0.022, 0.026, A1, C.bamboo, 6);
    prism(v, fx * (w / 2 - 0.02), A0 / 2, -D / 2, 0.022, 0.026, A0, C.bamboo, 6);
    v.box(fx * (w / 2 - 0.02), 0.04, D / 2 + 0.12, 0.1, 0.08, 0.1, C.stone);
  }
  const al = Math.hypot(D + 0.3, A0 - A1), aa = Math.atan2(A0 - A1, D + 0.3);
  const ns = Math.max(4, Math.round(w / 0.2));
  for (let k = 0; k < ns; k++) boxR(v, -w / 2 - 0.08 + (k + 0.5) * ((w + 0.16) / ns), (A0 + A1) / 2 + 0.03, 0.06, (w + 0.16) / ns + 0.002, 0.03, al, striped && k % 2 ? alt : color, aa, 0, 0);
  for (let k = 0; k < ns; k++) {
    const x = -w / 2 - 0.08 + (k + 0.5) * ((w + 0.16) / ns);
    v.box(x, A1 - 0.04, D / 2 + 0.2, (w + 0.16) / ns - 0.01, 0.12, 0.02, striped && k % 2 ? alt : color);
    v.box(x, A1 - 0.12, D / 2 + 0.2, ((w + 0.16) / ns) * 0.45, 0.05, 0.02, striped && k % 2 ? alt : color);
    if (k % 2 === 0) v.box(x, A1 - 0.2, D / 2 + 0.2, 0.02, 0.06, 0.02, C.gold); // tassels
  }
  // a folded cloth, a cash tin and a low stool behind
  v.box(-w / 2 + 0.3, TY + 0.04, -0.1, 0.3, 0.05, 0.22, C.cream);
  v.box(-w / 2 + 0.3, TY + 0.07, -0.1, 0.3, 0.012, 0.22, color);
  v.box(w / 2 - 0.25, TY + 0.05, -0.18, 0.16, 0.07, 0.12, C.tin);
  v.box(w / 2 - 0.25, TY + 0.088, -0.18, 0.16, 0.006, 0.12, C.tinD);
  for (const fx of [-1, 1]) for (const fz of [-1, 1]) v.box(fx * 0.1, 0.12, -D / 2 - 0.3 + fz * 0.1, 0.035, 0.24, 0.035, C.woodD);
  v.box(0, 0.25, -D / 2 - 0.3, 0.28, 0.04, 0.28, C.woodL);
  if (goods === 'pots') for (let k = 0; k < 4; k++) jarInto(v, -w / 2 + 0.35 + k * ((w - 0.7) / 3), TY + 0.02, 0.05, 0.5, JAR.glaze);
  if (goods === 'rice') for (let k = 0; k < 3; k++) { const x = -w / 2 + 0.35 + k * ((w - 0.7) / 2); prism(v, x, TY + 0.08, 0.05, 0.16, 0.13, 0.12, C.bamboo, 10); prism(v, x, TY + 0.15, 0.05, 0.08, 0.15, 0.06, '#F4EFE2', 8); }
  root.add(v.mesh());
  let sl = null;
  if (slate) {
    sl = chalkSlate({ w: 0.4, h: 0.3, text, lean: 0.22 });
    sl.root.position.set(w / 2 - 0.35, 0, D / 2 + 0.2);
    root.add(sl.root);
  }
  const sh = shadowUnder(root, w * 0.62, 0.6, 0, 0, 0.42);
  return { root, slate: sl, setChalk: (t) => sl?.setChalk(t), dispose() { sl?.dispose(); sh.geometry.dispose(); disposeTree(root); } };
}
export const stallAwning = marketStall;

// ---------------------------------------------------------------------------------------------
// paper bales, hand steelyard, hand cart
// ---------------------------------------------------------------------------------------------
/** A string-tied bale of printed sheets (0.6 x 0.45 x 0.45), bottom at y, long side on local X turned by ry. */
function paperBaleInto(v, x, y, z, ry = 0, damp = false, seed = 0, lite = false) {
  const cs = Math.cos(ry), sn = Math.sin(ry);
  const at = (lx, lz) => [x + lx * cs + lz * sn, z - lx * sn + lz * cs];
  const base = damp ? '#B9B2A2' : jitter('#EEE6D2', 0.03, seed);
  const sag = damp ? 0.03 : 0;
  boxR(v, x, y + 0.22 - sag / 2, z, 0.6, 0.44 - sag, 0.45, base, 0, ry, 0);
  if (damp) boxR(v, x, y + 0.44 - sag + 0.004, z, 0.5, 0.008, 0.36, '#A49C8B', 0, ry, 0);
  if (!lite) {
    for (let k = 0; k < 6; k++) {
      const yy = y + 0.05 + k * 0.065;
      const [fx, fz] = at(0, 0.226);
      boxR(v, fx, yy, fz, 0.58, 0.012, 0.006, k % 2 ? (damp ? '#9E9686' : '#D6CBB2') : (damp ? '#C6BFAF' : '#F7F1E4'), 0, ry, 0);
      const [ex, ez] = at(0.302, 0);
      boxR(v, ex, yy, ez, 0.006, 0.012, 0.43, k % 2 ? (damp ? '#9E9686' : '#D6CBB2') : '#F7F1E4', 0, ry, 0);
    }
    // printed lines on the top sheet
    for (let row = 0; row < 4; row++) for (let c = 0; c < 4; c++) {
      const [px, pz] = at(-0.2 + c * 0.13, -0.13 + row * 0.08);
      boxR(v, px, y + 0.442 - sag, pz, 0.09 - (c === 3 ? 0.04 : 0), 0.004, 0.018, damp ? '#6E6A64' : '#3E3832', 0, ry, 0);
    }
  }
  // twine: two strands round it, a knot on top
  for (const lx of [-0.16, 0.16]) {
    const [tx, tz] = at(lx, 0);
    boxR(v, tx, y + 0.445 - sag, tz, 0.022, 0.01, 0.46, C.twineD, 0, ry, 0);
    const [fx, fz] = at(lx, 0.228);
    boxR(v, fx, y + 0.22, fz, 0.022, 0.44, 0.01, C.twineD, 0, ry, 0);
  }
  if (!lite) { const [kx, kz] = at(-0.16, 0); boxR(v, kx, y + 0.46 - sag, kz, 0.05, 0.02, 0.04, C.twine, 0, ry + 0.4, 0); }
  if (damp && !lite) {
    const [dx, dz] = at(0.1, 0.32);
    boxR(v, dx, 0.003, dz, 0.4, 0.004, 0.22, C.water, 0, ry + 0.3, 0);
    const [ox, oz] = at(0.12, 0.235);
    boxR(v, ox, y + 0.03, oz, 0.016, 0.03, 0.016, C.waterL, 0, ry, 0); // a drip
  }
}

/** One bale of printed paper. damp: darker, sagging, a drip and a puddle under it. */
export function paperBale({ damp = false, seed = 2 } = {}) {
  const root = new THREE.Group();
  root.name = 'paperBale';
  const v = new VoxelBuilder();
  paperBaleInto(v, 0, 0, 0, 0, damp, seed);
  root.add(v.mesh());
  const sh = shadowUnder(root, 0.4, 0.3, 0, 0, 0.42);
  return { root, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

/**
 * A hand steelyard (0.7 long): wooden beam with brass notches, a brass poise on a loop, a load hook on two links,
 * a little needle at the pivot. Origin = the hang loop. setPoise(0..1) slides the poise out; setTilt(-1..1).
 */
export function handSteelyard({ poise = 0.55, tilt = 0 } = {}) {
  const root = new THREE.Group();
  root.name = 'handSteelyard';
  const hv = new VoxelBuilder();
  hv.box(0, -0.005, 0, 0.03, 0.02, 0.01, C.iron);
  hv.box(0, -0.06, 0, 0.01, 0.1, 0.01, C.twineD);
  root.add(hv.mesh({ px: 1.1 }));
  const beam = new THREE.Group();
  beam.position.y = -0.12;
  root.add(beam);
  const v = new VoxelBuilder();
  v.box(0.2, 0, 0, 0.7, 0.03, 0.03, C.woodL);
  v.box(-0.15, 0, 0, 0.04, 0.036, 0.036, C.brassD);
  v.box(0.55, 0, 0, 0.03, 0.036, 0.036, C.brassD);
  for (let k = 1; k <= 9; k++) v.box(k * 0.055, 0.017, 0.0, 0.006, 0.006, 0.032, k % 3 ? C.brass : C.goldD);
  v.box(0, 0.035, 0, 0.012, 0.05, 0.012, C.brass); // needle
  v.box(0, 0.0, 0, 0.026, 0.05, 0.038, C.iron);
  // load hook on two links
  v.box(-0.12, -0.04, 0, 0.012, 0.05, 0.012, C.iron);
  v.box(-0.12, -0.08, 0, 0.026, 0.026, 0.008, C.ironL);
  v.box(-0.12, -0.115, 0, 0.01, 0.05, 0.01, C.iron);
  v.box(-0.105, -0.14, 0, 0.03, 0.01, 0.01, C.iron);
  v.box(-0.092, -0.128, 0, 0.01, 0.025, 0.01, C.iron);
  beam.add(v.mesh({ px: 1.1 }));
  const pg = new THREE.Group();
  beam.add(pg);
  const pv = new VoxelBuilder();
  pv.box(0, -0.0, 0, 0.012, 0.045, 0.04, C.iron);
  pv.box(0, -0.035, 0, 0.008, 0.03, 0.008, C.iron);
  prism(pv, 0, -0.07, 0, 0.025, 0.032, 0.05, C.brass, 8);
  prism(pv, 0, -0.1, 0, 0.034, 0.034, 0.012, C.brassD, 8);
  pg.add(pv.mesh({ px: 1.1 }));
  function setPoise(t) { pg.position.x = 0.06 + clamp01(t) * 0.46; }
  function setTilt(t) { beam.rotation.z = -Math.max(-1, Math.min(1, t)) * 0.28; }
  setPoise(poise);
  setTilt(tilt);
  return { root, setPoise, setTilt, dispose() { disposeTree(root); } };
}

/** A small lantern into builders: frame into v, glass/flame into gv (glow). Origin = top ring. */
function lanternInto(v, gv, x, y, z) {
  v.box(x, y - 0.01, z, 0.04, 0.02, 0.01, C.iron);
  prism(v, x, y - 0.05, z, 0.02, 0.07, 0.05, C.iron, 6);
  prism(v, x, y - 0.24, z, 0.075, 0.075, 0.025, C.iron, 6);
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; v.box(x + Math.sin(a) * 0.055, y - 0.155, z + Math.cos(a) * 0.055, 0.012, 0.16, 0.012, C.iron); }
  gv.box(x, y - 0.155, z, 0.09, 0.15, 0.09, '#FFE4B0');
  gv.box(x, y - 0.17, z, 0.03, 0.05, 0.03, '#FF9A40');
}

/**
 * Ko Phyo's hand cart (1.8 x 1 x 0.9 h): flatbed on two big wheels, market bales under a tarp and rope, a pole with
 * a hook where his hand steelyard hangs, a small lantern (setLit), a crate to sit on.
 */
export function handCart({ lit = 0 } = {}) {
  const root = new THREE.Group();
  root.name = 'handCart';
  const v = new VoxelBuilder();
  const R = 0.38, BY = 0.5;
  for (const z of [-0.5, 0.5]) wheelInto(v, 0.1, R, z, R, { spokes: 10 });
  v.box(0.1, R, 0, 0.06, 0.06, 1.04, C.iron);
  // bed and side rails
  v.boxMin(-0.6, BY, -0.42, 0.75, BY + 0.05, 0.42, C.woodD);
  for (let k = 0; k < 6; k++) v.box(0.075, BY + 0.06, -0.36 + k * 0.144, 1.35, 0.02, 0.12, jitter(C.wood, 0.06, k));
  for (const z of [-0.43, 0.43]) { v.boxMin(-0.6, BY + 0.05, z - 0.02, 0.75, BY + 0.2, z + 0.02, C.wood); for (let x = -0.5; x < 0.75; x += 0.3) v.box(x, BY + 0.12, z, 0.04, 0.16, 0.05, C.woodD); }
  // shafts to the back and a prop leg
  for (const z of [-0.32, 0.32]) {
    stick(v, [-0.6, BY + 0.02, z], [-1.05, 0.42, z], 0.06, C.woodD);
    stick(v, [-0.92, 0.45, z], [-1.08, 0.41, z], 0.07, C.leatherD);
    stick(v, [-0.55, BY, z], [-0.58, 0, z], 0.05, C.woodD);
  }
  // bales under a tarp
  paperBaleInto(v, -0.2, BY + 0.07, -0.2, 0, false, 1, true);
  paperBaleInto(v, -0.2, BY + 0.07, 0.24, 0, false, 2, true);
  paperBaleInto(v, 0.42, BY + 0.07, 0.0, Math.PI / 2, false, 3, true);
  paperBaleInto(v, 0.0, BY + 0.52, 0.0, 0.1, false, 4, true);
  const TOP = BY + 0.98;
  v.boxMin(-0.55, TOP - 0.02, -0.4, 0.55, TOP + 0.03, 0.4, C.tarp);
  for (const s of [-1, 1]) {
    boxR(v, 0, TOP - 0.24, s * 0.43, 1.12, 0.48, 0.03, C.tarp, s * 0.06, 0, 0);
    boxR(v, s * 0.58, TOP - 0.2, 0, 0.03, 0.42, 0.82, C.tarpD, 0, 0, -s * 0.08);
  }
  for (let k = 0; k < 4; k++) v.box(-0.45 + k * 0.3, TOP + 0.035, 0.0, 0.1, 0.012, 0.8, C.tarpL); // folds
  for (const x of [-0.3, 0.3]) { v.box(x, TOP + 0.04, 0, 0.025, 0.02, 0.84, C.twineD); v.box(x, TOP - 0.25, 0.46, 0.025, 0.5, 0.02, C.twineD); }
  // the pole with a hook for the steelyard, and a lantern hook
  v.box(0.72, BY + 0.7, 0.36, 0.06, 1.4, 0.06, C.woodD);
  v.box(0.72, BY + 1.42, 0.36, 0.09, 0.05, 0.09, C.gold);
  v.box(0.72, BY + 1.35, 0.5, 0.04, 0.04, 0.3, C.woodD);
  v.box(0.72, BY + 1.31, 0.63, 0.012, 0.06, 0.012, C.iron);
  v.box(0.84, BY + 0.95, 0.36, 0.2, 0.03, 0.03, C.iron);
  // a crate to sit on, beside the cart
  v.box(-0.25, 0.19, 0.95, 0.5, 0.38, 0.38, C.wood);
  for (const y of [0.1, 0.28]) v.box(-0.25, y, 1.142, 0.5, 0.06, 0.01, C.woodD);
  v.box(-0.25, 0.385, 0.95, 0.52, 0.02, 0.4, C.woodL);
  root.add(v.mesh());
  // steelyard on the hook
  const sy = handSteelyard({ poise: 0.4, tilt: 0.15 });
  sy.root.position.set(0.72, BY + 1.27, 0.63);
  sy.root.scale.setScalar(0.9);
  root.add(sy.root);
  // the lantern
  const lv = new VoxelBuilder(), gv = new VoxelBuilder();
  lanternInto(lv, gv, 0.92, BY + 0.94, 0.36);
  root.add(lv.mesh({ px: 1.1 }));
  const g = glow('#5A4A3A', '#FFD38A');
  root.add(glowMesh(gv, g));
  const hl = halo(0.8, 0.8);
  hl.position.set(0.92, BY + 0.78, 0.5);
  root.add(hl);
  let litT = 0;
  function setLit(t) { litT = typeof t === 'boolean' ? (t ? 1 : 0) : clamp01(t); g.set(litT); setHalo(hl, litT * 0.55); }
  setLit(lit);
  const sh = shadowUnder(root, 1.2, 0.75, -0.1, 0.15, 0.45);
  return {
    root, steelyard: sy, seat: new THREE.Vector3(-0.25, 0.395, 0.95), setLit,
    update(dt, t) { if (litT > 0.01) setHalo(hl, litT * (0.5 + Math.sin(t * 11.3) * 0.04)); },
    dispose() { sy.dispose(); g.mat.dispose(); hl.material.dispose(); sh.geometry.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// charcoal stove + rice pot (the "anger pot")
// ---------------------------------------------------------------------------------------------
/** A small clay bucket stove with a tin band, an air door and glowing charcoal. top: where a pot sits. setGlow(0..1). */
export function charcoalStove({ glow: gl = 0.8 } = {}) {
  const root = new THREE.Group();
  root.name = 'charcoalStove';
  const v = new VoxelBuilder();
  prism(v, 0, 0.13, 0, 0.2, 0.16, 0.26, jitter(C.terra, 0.04, 3), 10);
  prism(v, 0, 0.25, 0, 0.205, 0.205, 0.03, C.tinD, 10);
  prism(v, 0, 0.04, 0, 0.168, 0.168, 0.025, C.tinD, 10);
  prism(v, 0, 0.267, 0, 0.17, 0.17, 0.006, C.soot, 10);
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + Math.PI / 2; v.box(Math.cos(a) * 0.16, 0.285, Math.sin(a) * 0.16, 0.06, 0.04, 0.06, C.terraD, -a); }
  v.box(0, 0.1, 0.17, 0.12, 0.09, 0.02, C.soot); // air door
  v.box(0.05, 0.1, 0.184, 0.08, 0.1, 0.01, C.tin);
  v.box(0.08, 0.1, 0.19, 0.02, 0.02, 0.01, C.ironL);
  for (let k = 0; k < 4; k++) v.box(-0.12 + k * 0.07, 0.18, 0.165, 0.05, 0.01, 0.006, C.terraL); // soot streaks / glaze runs
  // a palm fan beside it
  boxR(v, 0.3, 0.01, 0.12, 0.2, 0.01, 0.24, C.bambooL, 0, 0.6, 0);
  stick(v, [0.24, 0.015, 0.2], [0.14, 0.015, 0.36], 0.02, C.bambooD);
  root.add(v.mesh());
  const g = glow('#3A2520', '#FF8A3C');
  const cv = new VoxelBuilder();
  for (let k = 0; k < 8; k++) { const a = k * 0.8, d = (k % 3) * 0.05; cv.box(Math.cos(a) * d, 0.272, Math.sin(a) * d, 0.06, 0.035, 0.05, k % 2 ? '#FFC07A' : '#FF8A50', a); }
  root.add(glowMesh(cv, g));
  const hl = halo(0.55, 0.55, true);
  hl.position.y = 0.3;
  root.add(hl);
  let litT = 0;
  function setGlow(t) { litT = clamp01(t); g.set(litT); setHalo(hl, litT * 0.55); }
  setGlow(gl);
  const sh = shadowUnder(root, 0.26, 0.26, 0, 0, 0.45);
  return { root, top: new THREE.Vector3(0, 0.3, 0), setGlow, update(dt, t) { if (litT > 0.01) g.set(litT * (0.88 + Math.sin(t * 6.1) * 0.08 + Math.sin(t * 13.7) * 0.04)); }, dispose() { g.mat.dispose(); hl.material.dispose(); sh.geometry.dispose(); disposeTree(root); } };
}

/**
 * A lidded clay rice pot. boil(0..1): steam from under the lid; past 0.75 foam creeps out round the rim and the lid
 * jitters. rattle(): the lid's first rattle (two hops, a puff). update(dt, t).
 */
export function ricePot({ boil: b0 = 0 } = {}) {
  const root = new THREE.Group();
  root.name = 'ricePot';
  const v = new VoxelBuilder();
  const T = [[0.09, 0.03, C.clay], [0.13, 0.05, C.clayL], [0.16, 0.08, C.clayL], [0.15, 0.04, C.clay], [0.125, 0.03, C.clay], [0.132, 0.02, C.clayL]];
  let y = 0;
  for (const [r, h, col] of T) { prism(v, 0, y + h / 2, 0, r, r, h, col, 10); y += h; }
  const RIM = y;
  for (const sx of [-1, 1]) v.box(sx * 0.17, 0.15, 0, 0.05, 0.03, 0.06, C.clay);
  prism(v, 0, 0.12, 0, 0.162, 0.162, 0.015, '#3A2E2A', 10);
  v.box(-0.06, 0.14, 0.15, 0.04, 0.05, 0.01, '#7A6A60'); // a dull shine
  root.add(v.mesh());
  const lid = new THREE.Group();
  lid.position.y = RIM;
  root.add(lid);
  const lv = new VoxelBuilder();
  prism(lv, 0, 0.012, 0, 0.14, 0.14, 0.024, C.clay, 10);
  prism(lv, 0, 0.035, 0, 0.1, 0.135, 0.025, C.clayL, 10);
  prism(lv, 0, 0.055, 0, 0.03, 0.03, 0.02, C.clay, 8);
  prism(lv, 0, 0.07, 0, 0.045, 0.035, 0.015, C.clayL, 8);
  lid.add(lv.mesh({ px: 1.2 }));
  const fv = new VoxelBuilder();
  for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; fv.box(Math.cos(a) * 0.13, 0.0, Math.sin(a) * 0.13, 0.07, 0.035, 0.06, C.foam, -a); }
  for (let k = 0; k < 5; k++) { const a = k * 1.3 + 0.4; fv.box(Math.cos(a) * 0.15, -0.04, Math.sin(a) * 0.15, 0.03, 0.08, 0.03, C.foam, -a); }
  const foam = fv.mesh({ px: 1.0 });
  foam.position.y = RIM;
  root.add(foam);
  const steam = smokeFx([[0, RIM + 0.06, 0]], { n: 8, rise: 0.75, size: 0.1, spread: 0.12, drift: 0.12, speed: 0.55, color: '#FFFFFF' });
  root.add(steam.mesh);
  let boilT = 0, hopT = 9, puff = 0;
  function boil(t) { boilT = clamp01(t); }
  function place(t) {
    const fo = Math.max(0, (boilT - 0.75) / 0.25);
    foam.visible = fo > 0.01;
    foam.scale.set(0.8 + fo * 0.25, fo, 0.8 + fo * 0.25);
    let hop = 0, tilt = 0;
    if (hopT < 0.5) { const k = hopT / 0.5; hop = Math.abs(Math.sin(k * Math.PI * 2)) * 0.02 * (1 - k); tilt = Math.sin(k * Math.PI * 4) * 0.08 * (1 - k); }
    if (boilT > 0.85) { hop += Math.abs(Math.sin(t * 23)) * 0.006 * (boilT - 0.85) / 0.15; tilt += Math.sin(t * 17) * 0.03; }
    lid.position.y = RIM + hop + fo * 0.02;
    lid.rotation.z = tilt;
    steam.setAmount(Math.min(1, boilT * 0.9 + puff));
    steam.update(t);
  }
  boil(b0);
  place(0);
  return {
    root, lid,
    boil, rattle() { hopT = 0; puff = 0.8; },
    get boiling() { return boilT; },
    update(dt, t) { if (hopT < 9) hopT += dt; puff = Math.max(0, puff - dt * 1.5); place(t); },
    dispose() { disposeTree(root); },
  };
}

/** The aunty's stove with the rice pot on it (Day 12's "anger pot"): { root, stove, pot, rattle, boil, setGlow, update }. */
// Lesson ch 20 (D12): rattle() = the first rattle of anger; catch it before it boils over.
export function angerPot({ boil = 0.4, glow: gl = 0.8 } = {}) {
  const root = new THREE.Group();
  root.name = 'angerPot';
  const stove = charcoalStove({ glow: gl });
  const pot = ricePot({ boil });
  pot.root.position.y = stove.top.y;
  root.add(stove.root, pot.root);
  return {
    root, stove, pot,
    rattle: pot.rattle, boil: pot.boil, setGlow: stove.setGlow,
    update(dt, t) { stove.update(dt, t); pot.update(dt, t); },
    dispose() { stove.dispose(); pot.dispose(); root.removeFromParent(); },
  };
}

// ---------------------------------------------------------------------------------------------
// market scale and the true weight
// ---------------------------------------------------------------------------------------------
/** One brass weight (bell-shaped steps + knob), foot at y. bright = the true weight (polished, gold rim). */
function weightInto(v, x, y, z, s = 1, bright = false, filed = false) {
  const b = bright ? C.brassL : filed ? '#A88A44' : C.brass, d = bright ? C.gold : C.brassD;
  prism(v, x, y + 0.015 * s, z, 0.05 * s, 0.052 * s, 0.03 * s, d, 8);
  prism(v, x, y + 0.055 * s, z, 0.036 * s, 0.046 * s, 0.05 * s, b, 8);
  prism(v, x, y + 0.087 * s, z, 0.02 * s, 0.03 * s, 0.015 * s, d, 8);
  prism(v, x, y + 0.104 * s, z, 0.026 * s, 0.026 * s, 0.02 * s, b, 8);
  if (filed) for (let k = 0; k < 3; k++) { const a = k * 2.1; v.box(x + Math.sin(a) * 0.047 * s, y + 0.02 * s, z + Math.cos(a) * 0.047 * s, 0.022 * s, 0.014 * s, 0.006, '#F4E2A6', a); } // bright filed nicks
  if (bright) v.box(x - 0.02 * s, y + 0.06 * s, z + 0.04 * s, 0.01 * s, 0.03 * s, 0.006, C.white);
}

/** The true weight (the bag item's 3D form). */
export function trueWeight({ scale = 1.4 } = {}) {
  const root = new THREE.Group();
  root.name = 'trueWeight';
  const v = new VoxelBuilder();
  weightInto(v, 0, 0, 0, scale, true);
  root.add(v.mesh({ px: 1.2 }));
  const sh = shadowUnder(root, 0.09 * scale, 0.09 * scale, 0, 0, 0.4);
  return { root, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

/**
 * The trader's hanging beam scale on a wooden gallows (1.5 w x 2.1 h), rice in the right pan, weights in the left,
 * a weight box on the ground. setTilt(-1..1) (+ = right pan down); setWeights('filed' | 'true').
 */
// Lesson ch 20 (D12): setWeights('filed') cheats the next buyer; 'true' + trueWeight() = the checked fact.
export function marketScale({ tilt = 0, weights = 'filed' } = {}) {
  const root = new THREE.Group();
  root.name = 'marketScale';
  const v = new VoxelBuilder();
  for (const sx of [-1, 1]) { v.box(sx * 0.72, 1.05, 0, 0.09, 2.1, 0.09, C.woodD); v.box(sx * 0.72, 0.05, 0, 0.3, 0.1, 0.36, C.stone); stick(v, [sx * 0.72, 1.7, 0], [sx * 0.4, 2.05, 0], 0.06, C.wood); }
  v.box(0, 2.08, 0, 1.62, 0.09, 0.1, C.woodD);
  v.box(0, 2.14, 0, 0.12, 0.04, 0.12, C.gold);
  v.box(0, 2.0, 0, 0.03, 0.08, 0.03, C.iron);
  // the weight box on the ground: lid open, weights in holes
  v.box(0.45, 0.08, 0.5, 0.36, 0.16, 0.26, C.wood);
  v.box(0.45, 0.165, 0.5, 0.32, 0.01, 0.22, C.woodDD);
  boxR(v, 0.45, 0.28, 0.36, 0.36, 0.24, 0.02, C.woodL, -0.35, 0, 0);
  for (let k = 0; k < 4; k++) weightInto(v, 0.33 + k * 0.08, 0.165, 0.5, 0.45 + k * 0.1, false);
  root.add(v.mesh());
  const scale = new THREE.Group();
  scale.position.set(0, 1.72, 0);
  root.add(scale);
  const hv = new VoxelBuilder();
  hv.box(0, 0.14, 0, 0.012, 0.28, 0.012, C.ink);
  scale.add(hv.mesh({ px: 1.2 }));
  const beam = new THREE.Group();
  scale.add(beam);
  const HALF = 0.44, DROP = 0.5;
  const bv = new VoxelBuilder();
  bv.box(0, 0, 0, HALF * 2, 0.03, 0.03, C.gold);
  for (const s of [-1, 1]) bv.box(s * HALF, 0, 0, 0.05, 0.05, 0.05, C.goldD);
  bv.box(0, 0.08, 0, 0.018, 0.16, 0.018, C.goldD);
  bv.box(0, 0, 0, 0.06, 0.06, 0.04, C.goldD);
  for (let k = 1; k < 4; k++) for (const s of [-1, 1]) bv.box(s * k * 0.1, 0.017, 0, 0.006, 0.006, 0.032, C.goldD);
  beam.add(bv.mesh({ px: 1.3 }));
  const pans = [-1, 1].map((s) => {
    const g = new THREE.Group();
    scale.add(g);
    const pv = new VoxelBuilder();
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.3;
      stick(pv, [0, 0, 0], [Math.cos(a) * 0.16, -DROP, Math.sin(a) * 0.16], 0.008, C.ink);
    }
    prism(pv, 0, -DROP - 0.02, 0, 0.2, 0.14, 0.045, C.gold, 10);
    prism(pv, 0, -DROP + 0.004, 0, 0.18, 0.18, 0.006, '#B48D3C', 10);
    if (s > 0) { prism(pv, 0, -DROP + 0.03, 0, 0.08, 0.16, 0.05, '#F4EFE2', 8); prism(pv, 0, -DROP + 0.065, 0, 0.03, 0.08, 0.025, C.white, 8); }
    g.add(pv.mesh({ px: 1.3 }));
    return { g, s };
  });
  let load = null;
  function setWeights(kind) {
    freeMesh(load);
    const lv = new VoxelBuilder();
    if (kind === 'true') weightInto(lv, 0, -DROP + 0.007, 0, 1.3, true);
    else { weightInto(lv, -0.06, -DROP + 0.007, 0.02, 1.1, false, true); weightInto(lv, 0.06, -DROP + 0.007, -0.03, 0.9, false, true); weightInto(lv, 0.02, -DROP + 0.007, 0.08, 0.7, false, true); }
    load = lv.mesh({ px: 1.2 });
    pans[0].g.add(load);
  }
  function setTilt(t) {
    t = Math.max(-1, Math.min(1, t));
    const a = -t * 0.3;
    beam.rotation.z = a;
    for (const p of pans) p.g.position.set(p.s * HALF * Math.cos(a), p.s * HALF * Math.sin(a), 0);
  }
  setWeights(weights);
  setTilt(tilt);
  const sh = shadowUnder(root, 0.9, 0.5, 0, 0.1, 0.42);
  return { root, setTilt, setWeights, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// notice board
// ---------------------------------------------------------------------------------------------
/** An outside notice board (1.3 x 0.9) under a little roof, on two posts (or wall: true, back at z = 0).
 * Pinned paper notices drawn on one canvas. setText(lines) (first line = heading). */
export function noticeBoard({ lines = [{ my: 'အသိပေးချက်', en: 'Notice' }, 'ကော်မတီ အစည်းအဝေး', 'ညနေ ၅ နာရီ'], wall = false } = {}) {
  const root = new THREE.Group();
  root.name = 'noticeBoard';
  const v = new VoxelBuilder();
  const BW = 1.3, BH = 0.9, BY = wall ? 1.3 : 1.35, Z = wall ? 0.06 : 0;
  if (!wall) for (const sx of [-1, 1]) { v.box(sx * (BW / 2 + 0.05), 0.95, -0.02, 0.09, 1.9, 0.09, C.woodD); v.box(sx * (BW / 2 + 0.05), 0.05, -0.02, 0.2, 0.1, 0.2, C.stone); }
  v.box(0, BY, Z - 0.02, BW + 0.12, BH + 0.12, 0.06, C.woodD);
  v.box(0, BY, Z + 0.012, BW, BH, 0.01, C.cork);
  const rl = 0.4;
  for (let x = -BW / 2 - 0.12; x < BW / 2 + 0.1; x += 0.25) boxR(v, x + 0.125, BY + BH / 2 + 0.16, Z + 0.1, 0.24, 0.04, rl, jitter(C.wood, 0.06, x * 9), 0.45, 0, 0);
  v.box(0, BY + BH / 2 + 0.08, Z + 0.28, BW + 0.32, 0.06, 0.03, C.maroon);
  v.box(0, BY - BH / 2 - 0.08, Z + 0.06, BW + 0.04, 0.04, 0.1, C.woodD); // ledge
  root.add(v.mesh());
  const { g, tex } = canvasTex(512, 354);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), basic('#ffffff', { map: tex }));
  face.position.set(0, BY, Z + 0.019);
  root.add(face);
  let cur = lines;
  const draw = () => {
    g.fillStyle = C.cork; g.fillRect(0, 0, 512, 354);
    const r = rand(5);
    g.fillStyle = C.corkD; for (let k = 0; k < 90; k++) g.fillRect(r() * 512, r() * 354, 3, 2);
    // a big notice and two small slips
    g.save(); g.translate(256, 170); g.rotate(-0.015);
    g.fillStyle = 'rgba(60,40,20,0.25)'; g.fillRect(-176, -142, 360, 290);
    g.fillStyle = '#F7F0DE'; g.fillRect(-180, -146, 352, 284);
    const items = cur.map(textOf);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (items[0]) {
      g.fillStyle = C.maroon; g.fillRect(-160, -128, 312, 64);
      g.fillStyle = '#F3E6C6'; g.font = `700 32px ${FONT_MY}`; g.fillText(items[0].my, -4, -100, 290);
      if (items[0].en) { g.font = `600 15px ${FONT_SERIF}`; g.fillStyle = C.gold; g.fillText(items[0].en.toUpperCase(), -4, -73, 290); }
    }
    g.fillStyle = C.ink; g.font = `600 27px ${FONT_MY}`;
    items.slice(1, 5).forEach((t, k) => { g.fillText(t.my, -4, -26 + k * 46, 300); if (t.en) { g.font = `italic 14px ${FONT_SERIF}`; g.fillStyle = '#7A6A58'; g.fillText(t.en, -4, -6 + k * 46, 300); g.fillStyle = C.ink; g.font = `600 27px ${FONT_MY}`; } });
    g.restore();
    for (const [x, y] of [[90, 30], [420, 30]]) { g.fillStyle = C.brass; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); }
    g.fillStyle = '#EFE5CF'; g.save(); g.translate(460, 300); g.rotate(0.12); g.fillRect(-40, -30, 80, 60); g.fillStyle = 'rgba(80,70,60,0.6)'; for (let k = 0; k < 3; k++) g.fillRect(-30, -16 + k * 14, 50 - k * 10, 3); g.restore();
    tex.needsUpdate = true;
  };
  draw();
  fontsReady().then(draw);
  const sh = wall ? null : shadowUnder(root, 0.8, 0.25, 0, 0, 0.35);
  return { root, setText(l) { cur = l; draw(); }, dispose() { tex.dispose(); face.material.dispose(); sh?.geometry.dispose(); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// rain: puddles, soaked sheets, the rain itself
// ---------------------------------------------------------------------------------------------
/** A flat puddle (w x d) of overlapping water blocks with pale highlights. */
export function puddle({ w = 1.2, d = 0.8, seed = 6 } = {}) {
  const root = new THREE.Group();
  root.name = 'puddle';
  const r = rand(seed);
  const v = new VoxelBuilder();
  for (let k = 0; k < 7; k++) boxR(v, (r() - 0.5) * w * 0.5, 0.004 + k * 0.0004, (r() - 0.5) * d * 0.5, w * (0.4 + r() * 0.4), 0.004, d * (0.4 + r() * 0.4), k % 3 ? C.water : C.waterD, 0, r() * 3, 0);
  for (let k = 0; k < 4; k++) boxR(v, (r() - 0.5) * w * 0.5, 0.008, (r() - 0.5) * d * 0.4, 0.12 + r() * 0.2, 0.002, 0.025, C.waterL, 0, 0.3 + r() * 0.3, 0);
  root.add(v.mesh({ outline: false }));
  return { root, dispose() { disposeTree(root); } };
}

/** n soaked sheets of paper lying in puddles (grey-white, ink smeared, edges curled). */
export function soakedSheets(n = 5, seed = 3) {
  const root = new THREE.Group();
  root.name = 'soakedSheets';
  const r = rand(seed);
  const v = new VoxelBuilder();
  for (let i = 0; i < n; i++) {
    const x = (r() - 0.5) * 1.3, z = (r() - 0.5) * 0.9, ry = r() * Math.PI;
    boxR(v, x + 0.03, 0.003, z + 0.02, 0.46, 0.004, 0.38, C.water, 0, ry + 0.3, 0);
    boxR(v, x, 0.008, z, 0.3, 0.005, 0.42, jitter('#DAD6CC', 0.04, i), 0, ry, 0);
    for (const sx of [-1, 1]) {
      const cx = x + Math.cos(ry) * sx * 0.16, cz = z - Math.sin(ry) * sx * 0.16;
      boxR(v, cx, 0.02, cz, 0.05, 0.005, 0.4, '#CFCBC0', 0, ry, -sx * 0.6, 'YXZ');
    }
    for (let k = 0; k < 4; k++) {
      const off = -0.12 + k * 0.08;
      boxR(v, x + Math.sin(ry) * off, 0.012, z + Math.cos(ry) * off, 0.18 - (k % 2) * 0.05, 0.002, 0.03, '#8E9AAE', 0, ry, 0);
    }
  }
  root.add(v.mesh({ px: 1.0 }));
  return { root, dispose() { disposeTree(root); } };
}

/** The colour the game's grade layer should take on in rain (story.weather). */
export const RAIN_TINT = '#8E9AA6';

/**
 * Rain round a point: exactly two draw calls, an InstancedMesh of slanted streaks (soft, semi-transparent, 3 cm thick)
 * and an InstancedMesh of ground splashes. Put root at the camera's
 * look point (it covers area x area metres). setAmount(0..1) (drizzle ~0.35), update(dt, t).
 */
export function rainFx({ count = 420, area = 14, height = 9, speed = 11 } = {}) {
  const root = new THREE.Group();
  root.name = 'rainFx';
  const streaks = new THREE.InstancedMesh(UNIT, basic('#E4ECF2', { transparent: true, opacity: 0.38, depthWrite: false }), count);
  const NS = 64;
  const splash = new THREE.InstancedMesh(UNIT, basic('#EEF3F6', { transparent: true, opacity: 0.7, depthWrite: false }), NS);
  for (const m of [streaks, splash]) { m.frustumCulled = false; m.userData.sharedGeo = true; m.raycast = () => {}; root.add(m); }
  const r = rand(77);
  const P = new Float32Array(count * 3), S = new Float32Array(NS * 3), A = new Float32Array(NS).fill(9);
  for (let i = 0; i < count; i++) { P[i * 3] = (r() - 0.5) * area; P[i * 3 + 1] = r() * height; P[i * 3 + 2] = (r() - 0.5) * area; }
  let active = count, si = 0;
  const SLANT = 0.24, TILT = Math.atan(SLANT);
  function setAmount(a) { a = clamp01(a); active = Math.round(count * a); streaks.count = active; root.visible = a > 0.001; }
  function update(dt) {
    for (let i = 0; i < active; i++) {
      let y = P[i * 3 + 1] - speed * dt;
      if (y < 0) {
        y += height;
        if (i % 3 === 0) { S[si * 3] = P[i * 3]; S[si * 3 + 2] = P[i * 3 + 2]; A[si] = 0; si = (si + 1) % NS; }
      }
      P[i * 3 + 1] = y;
      _o.position.set(P[i * 3] + y * SLANT, y, P[i * 3 + 2]);
      _o.rotation.set(0, 0, -TILT); // leans with its own fall (top towards +x, where it came from)
      _o.scale.set(0.032, 0.62, 0.032);
      _o.updateMatrix();
      streaks.setMatrixAt(i, _o.matrix);
    }
    for (let k = 0; k < NS; k++) {
      A[k] += dt;
      const s = A[k] < 0.3 ? A[k] / 0.3 : 0;
      _o.position.set(S[k * 3], 0.02, S[k * 3 + 2]);
      _o.rotation.set(0, k, 0);
      _o.scale.set(Math.max(1e-4, 0.05 + s * 0.14), 0.006, Math.max(1e-4, (0.05 + s * 0.14) * (s > 0 ? 1 : 0)));
      _o.updateMatrix();
      splash.setMatrixAt(k, _o.matrix);
    }
    streaks.instanceMatrix.needsUpdate = true;
    splash.instanceMatrix.needsUpdate = true;
  }
  setAmount(1);
  update(0);
  return { root, setAmount, update(dt) { update(Math.min(dt, 0.1)); }, dispose() { disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// the paper store (6 w x 5 h x 4 d), its lock door and lamp window
// ---------------------------------------------------------------------------------------------
/** A plank door (1 w x 2.1 h) with three locks stacked down its edge. jiggle(): it rattles (update). Back at z = 0. */
export function lockDoor({ scale = 1 } = {}) {
  const root = new THREE.Group();
  root.name = 'lockDoor';
  const v = new VoxelBuilder();
  const W = 1.0, H = 2.1;
  for (const sx of [-1, 1]) v.box(sx * (W / 2 + 0.05), H / 2, 0.04, 0.1, H + 0.05, 0.1, C.woodD);
  v.box(0, H + 0.06, 0.04, W + 0.24, 0.1, 0.12, C.woodD);
  v.box(0, 0.01, 0.06, W + 0.1, 0.02, 0.12, C.stoneD);
  root.add(v.mesh());
  const leaf = new THREE.Group();
  root.add(leaf);
  const lv = new VoxelBuilder();
  for (let k = 0; k < 5; k++) lv.box(-W / 2 + (k + 0.5) * (W / 5), H / 2, 0.02, W / 5 - 0.008, H, 0.04, jitter('#7A5236', 0.08, k + 30));
  for (const y of [0.25, H / 2, H - 0.25]) lv.box(0, y, 0.045, W - 0.06, 0.1, 0.02, '#5E3E28');
  // three locks: a padlock on a hasp, a rim lock, a bolt with its own padlock
  const LX = W / 2 - 0.14;
  lv.box(LX, 1.5, 0.06, 0.16, 0.05, 0.015, C.iron);
  padlockInto(lv, LX + 0.02, 1.43, 0.08, false, 1.0);
  lv.box(LX, 1.08, 0.065, 0.16, 0.2, 0.03, C.brassD);
  lv.box(LX, 1.08, 0.082, 0.12, 0.16, 0.006, C.brass);
  lv.box(LX, 1.1, 0.088, 0.02, 0.03, 0.004, C.soot);
  lv.box(LX - 0.1, 1.04, 0.09, 0.05, 0.03, 0.04, C.brassL);
  lv.box(LX - 0.04, 0.62, 0.06, 0.22, 0.04, 0.03, C.ironL);
  lv.box(LX + 0.07, 0.62, 0.07, 0.04, 0.08, 0.03, C.iron);
  padlockInto(lv, LX - 0.02, 0.55, 0.09, false, 0.8);
  leaf.add(lv.mesh());
  root.scale.setScalar(scale);
  let jt = 9;
  return {
    root,
    jiggle() { jt = 0; },
    update(dt) { if (jt > 1) return; jt += dt; const a = jt < 0.7 ? Math.sin(jt * 60) * 0.006 * (1 - jt / 0.7) : 0; leaf.position.x = a; leaf.rotation.y = a * 2; },
    dispose() { disposeTree(root); },
  };
}

/** A window (1 x 0.9) lit from inside by one glowing box, with a curtain. setLit(bool | 0..1), silhouette(walk)
 * (a figure crosses behind the curtain while true), jerk() (the curtain twitches). Back at z = 0. */
export function lampWindow({ lit = 1 } = {}) {
  const root = new THREE.Group();
  root.name = 'lampWindow';
  const W = 1.0, H = 0.9;
  const v = new VoxelBuilder();
  for (const sx of [-1, 1]) v.box(sx * (W / 2 + 0.04), 0, 0.05, 0.08, H + 0.08, 0.1, C.woodD);
  v.box(0, H / 2 + 0.06, 0.06, W + 0.24, 0.08, 0.12, C.woodD);
  v.box(0, -H / 2 - 0.06, 0.08, W + 0.2, 0.06, 0.18, C.stoneL);
  v.box(0, 0, 0.07, 0.04, H, 0.03, C.woodD);
  v.box(0, 0.12, 0.07, W, 0.035, 0.03, C.woodD);
  for (const sx of [-1, 1]) { v.box(sx * (W / 2 + 0.33), 0, 0.03, 0.5, H + 0.04, 0.04, C.green); for (let y = -H / 2 + 0.1; y < H / 2; y += 0.12) v.box(sx * (W / 2 + 0.33), y, 0.055, 0.42, 0.03, 0.02, C.greenD); }
  // a flower pot on the sill
  prism(v, -0.32, -H / 2 + 0.04, 0.12, 0.06, 0.05, 0.1, C.terra, 8);
  for (let k = 0; k < 4; k++) v.box(-0.32 + Math.cos(k * 1.6) * 0.04, -H / 2 + 0.13, 0.12 + Math.sin(k * 1.6) * 0.03, 0.06, 0.05, 0.06, k % 2 ? C.leaf : C.rose);
  root.add(v.mesh());
  const g = glow('#3E3430', '#FFCB7A');
  const gv = new VoxelBuilder();
  gv.box(0, 0, -0.02, W, H, 0.01, '#ffffff');
  root.add(glowMesh(gv, g));
  // the silhouette (dark, unlit) between the light and the curtain
  const fig = new THREE.Group();
  fig.position.set(-0.6, -0.1, 0.0);
  root.add(fig);
  const fv = new VoxelBuilder();
  fv.box(0, 0.32, 0, 0.16, 0.16, 0.01, '#2E2420');
  fv.box(0, 0.04, 0, 0.3, 0.42, 0.01, '#2E2420');
  fv.box(0.04, 0.42, 0, 0.12, 0.05, 0.01, '#2E2420');
  const figM = new THREE.Mesh(fv.geometry(), new THREE.MeshBasicMaterial({ color: '#2E2420' }));
  fig.add(figM);
  fig.visible = false;
  // clip the figure to the window: it is hidden outside +-W/2 in update
  const curtain = new THREE.Group();
  curtain.position.set(W / 2 - 0.02, 0, 0.02);
  root.add(curtain);
  const cvb = new VoxelBuilder();
  for (let k = 0; k < 5; k++) cvb.box(-0.05 - k * 0.075, -0.01, (k % 2) * 0.01, 0.08, H - 0.04, 0.012, k % 2 ? C.maroon : '#82283A');
  cvb.box(-0.2, -H / 2 + 0.06, 0.02, 0.4, 0.04, 0.012, C.gold);
  cvb.box(-0.2, H / 2 - 0.03, 0.02, 0.44, 0.03, 0.03, C.woodD);
  curtain.add(cvb.mesh({ px: 1.1 }));
  const hl = halo(1.6, 1.3, false, 1.4); // a lit window pane, not a lamp
  hl.position.set(0, 0, 0.2);
  root.add(hl);
  let walk = false, wt = 0, jt = 9, litT = 0;
  function setLit(t) { litT = typeof t === 'boolean' ? (t ? 1 : 0) : clamp01(t); g.set(litT); setHalo(hl, litT * 0.45); }
  setLit(lit);
  return {
    root, setLit,
    silhouette(b) { walk = !!b; if (!walk) fig.visible = false; },
    jerk() { jt = 0; },
    update(dt) {
      if (walk && litT > 0.1) {
        wt += dt;
        const x = -0.75 + ((wt * 0.35) % 1.5);
        fig.position.x = x;
        fig.position.y = -0.1 + Math.abs(Math.sin(wt * 6)) * 0.015;
        fig.visible = Math.abs(x) < W / 2 - 0.12;
      }
      if (jt < 0.6) { jt += dt; curtain.position.x = W / 2 - 0.02 + Math.sin(jt * 30) * 0.03 * (1 - jt / 0.6); }
    },
    dispose() { g.mat.dispose(); figM.material.dispose(); hl.material.dispose(); disposeTree(root); },
  };
}

/**
 * The paper store on the kiln square: an open-fronted ground floor (roll-up shutter, bales stacked to the ceiling),
 * a gallery deck that roofs the front (a hanging pan scale under it, the store board on its fascia), the trader's
 * house above with the three-lock door and one lamp window, an outside stair on the east side, sheds behind.
 * setShutter(0..1) (1 = down), setLit(bool | 0..1) (the upstairs lamp), update(dt, t). door: the shop doorway.
 */
export function paperStore({ shutter = 0, lit = 0, sign = { my: 'စက္ကူဆိုင်', en: 'Paper Store' } } = {}) {
  const root = new THREE.Group();
  root.name = 'paperStore';
  const W = 6, D = 4, FZ = 2, H1 = 2.6, UZ = 0.3, H2 = 5.0, DZ = 2.9, OW = 2.45;
  const PL = '#E3D6BC', PL2 = '#EADFC8', IN = '#6E5A44';
  const r = rand(41);
  const v = new VoxelBuilder();
  v.boxMin(-W / 2 - 0.1, 0, -D / 2 - 0.05, W / 2 + 0.1, 0.12, FZ + 0.05, C.stone);
  // ground floor shell: back, sides, front piers, header beam
  v.boxMin(-W / 2, 0.12, -D / 2, W / 2, H1, -D / 2 + 0.2, PL);
  for (const sx of [-1, 1]) {
    v.boxMin(sx < 0 ? -W / 2 : W / 2 - 0.2, 0.12, -D / 2, sx < 0 ? -W / 2 + 0.2 : W / 2, H1, FZ, PL);
    v.boxMin(sx < 0 ? -W / 2 : OW, 0.12, FZ - 0.25, sx < 0 ? -OW : W / 2, H1, FZ, PL);
    v.boxMin(sx < 0 ? -W / 2 : OW, 0.12, FZ, sx < 0 ? -OW : W / 2, 0.55, FZ + 0.01, C.maroon); // dado
    for (let y = 0.3; y < H1; y += 0.4) v.box(sx * (W / 2 - 0.12), y + 0.15, FZ + 0.01, 0.24 + (y * 10 % 2) * 0.1, 0.3, 0.02, C.quoin);
  }
  v.boxMin(-W / 2, 2.35, FZ - 0.25, W / 2, H1, FZ + 0.02, C.woodD);
  for (let k = 0; k < 10; k++) v.box(-W / 2 + 0.3 + r() * (W - 0.6), 0.7 + r() * 1.5, FZ + 0.004, 0.2 + r() * 0.3, 0.12 + r() * 0.2, 0.01, jitter(PL, 0.06, k));
  // interior: dim floor, back wall, ceiling, bales to the ceiling, a counter
  v.boxMin(-W / 2 + 0.2, 0.12, -D / 2 + 0.2, W / 2 - 0.2, 0.14, FZ - 0.25, '#6E5038');
  v.boxMin(-W / 2 + 0.2, 0.14, -D / 2 + 0.2, W / 2 - 0.2, 2.45, -D / 2 + 0.22, IN);
  v.boxMin(-W / 2 + 0.2, 2.42, -D / 2 + 0.2, W / 2 - 0.2, 2.45, FZ - 0.25, '#4E3E30');
  for (const sx of [-1, 1]) for (let zi = 0; zi < 5; zi++) for (let k = 0; k < 5; k++) paperBaleInto(v, sx * 2.45, 0.14 + k * 0.45, -1.45 + zi * 0.62, Math.PI / 2, false, zi * 5 + k + (sx > 0 ? 50 : 0), true);
  for (let xi = 0; xi < 6; xi++) for (let k = 0; k < 5; k++) { if (k < 2 && (xi === 2 || xi === 3)) continue; paperBaleInto(v, -1.55 + xi * 0.62, 0.14 + k * 0.45, -1.5, 0, false, xi * 7 + k + 100, true); }
  v.boxMin(-0.7, 0.14, -0.9, 0.7, 0.9, -0.5, C.woodD);
  v.boxMin(-0.75, 0.9, -0.95, 0.75, 0.95, -0.45, C.wood);
  // gallery deck over the front, landing to the stair, fascia, posts, railing
  v.boxMin(-W / 2 - 0.1, H1, UZ, W / 2 + 0.1, H1 + 0.12, DZ, C.wood);
  v.boxMin(W / 2, H1, 1.15, W / 2 + 0.85, H1 + 0.12, DZ, C.wood);
  for (let x = -W / 2; x < W / 2 + 0.8; x += 0.3) v.box(x, H1 + 0.122, (UZ + DZ) / 2 + (x > W / 2 ? 0.45 : 0), 0.012, 0.004, x > W / 2 ? DZ - 1.15 : DZ - UZ, C.woodD);
  v.boxMin(-W / 2 - 0.12, H1 - 0.3, DZ, W / 2 + 0.87, H1 + 0.12, DZ + 0.05, C.maroon);
  v.boxMin(-W / 2 - 0.12, H1 + 0.06, DZ + 0.05, W / 2 + 0.87, H1 + 0.09, DZ + 0.07, C.gold);
  for (const x of [-W / 2 + 0.05, W / 2 + 0.75]) { v.box(x, H1 / 2, DZ - 0.12, 0.16, H1, 0.16, C.woodD); v.box(x, 0.06, DZ - 0.12, 0.28, 0.12, 0.28, C.stone); }
  for (const x of [-W / 2 + 0.05, -OW, OW, W / 2 + 0.75]) stick(v, [x, H1 - 0.7, x === -OW || x === OW ? FZ + 0.02 : DZ - 0.12], [x, H1 - 0.02, x === -OW || x === OW ? DZ - 0.3 : DZ - 0.6], 0.08, C.wood);
  const RY = H1 + 0.12;
  for (let x = -W / 2; x <= W / 2 + 0.8; x += 0.15) v.box(x, RY + 0.4, DZ - 0.05, 0.03, 0.8, 0.03, Math.round(x / 0.15) % 4 === 0 ? C.woodD : C.woodL);
  v.boxMin(-W / 2 - 0.05, RY + 0.78, DZ - 0.1, W / 2 + 0.88, RY + 0.86, DZ, C.woodD);
  v.boxMin(-W / 2 - 0.05, RY + 0.36, DZ - 0.08, W / 2 + 0.88, RY + 0.4, DZ - 0.02, C.woodD);
  for (let z = 1.2; z < DZ; z += 0.15) v.box(W / 2 + 0.83, RY + 0.4, z, 0.03, 0.8, 0.03, C.woodL);
  v.boxMin(W / 2 + 0.79, RY + 0.78, 1.15, W / 2 + 0.87, RY + 0.86, DZ, C.woodD);
  // upstairs house: walls with timber frame, a small shuttered window, roof of corrugated tin
  v.boxMin(-W / 2, RY, -D / 2, W / 2, H2, UZ, PL2);
  for (const y of [RY + 0.05, H2 - 0.08]) v.boxMin(-W / 2, y - 0.05, UZ, W / 2, y + 0.05, UZ + 0.05, C.woodD);
  for (const x of [-W / 2 + 0.05, -1.45, 0.25, 1.25, 2.55, W / 2 - 0.05]) v.boxMin(x - 0.05, RY, UZ, x + 0.05, H2, UZ + 0.05, C.woodD);
  v.boxMin(-2.45, RY + 0.9, UZ, -1.75, RY + 1.6, UZ + 0.04, C.green);
  for (let y = RY + 0.98; y < RY + 1.55; y += 0.1) v.boxMin(-2.42, y, UZ + 0.04, -1.78, y + 0.03, UZ + 0.06, C.greenD);
  v.boxMin(-2.5, RY + 0.84, UZ, -1.7, RY + 0.9, UZ + 0.14, C.stoneL);
  const EZ = UZ + 0.45, RZ = -0.85, RH = 0.7, BZ = -D / 2 - 0.4;
  for (const [z0, z1, s] of [[EZ, RZ, 1], [BZ, RZ, -1]]) {
    const len = Math.hypot(z0 - z1, RH), a = Math.atan2(RH, Math.abs(z0 - z1));
    const zc = (z0 + z1) / 2, yc = H2 + RH / 2;
    boxR(v, 0, yc, zc, W + 0.5, 0.05, len, '#9C978B', s * a, 0, 0);
    if (s > 0) {
      for (let x = -W / 2 - 0.2; x < W / 2 + 0.25; x += 0.16) boxR(v, x, yc + 0.035, zc, 0.05, 0.03, len, '#B4AFA2', a, 0, 0);
      for (let j = 0; j < 5; j++) boxR(v, -2.4 + j * 1.2 + r() * 0.3, yc + 0.06, zc + (r() - 0.5) * 0.4, 0.5 + r() * 0.4, 0.012, 0.3 + r() * 0.3, jitter('#9E5A3A', 0.1, j), a, 0, 0);
    }
  }
  v.box(0, H2 + RH + 0.03, RZ, W + 0.55, 0.08, 0.16, '#7F7A70');
  for (const sx of [-1, 1]) for (let y = H2; y < H2 + RH; y += 0.14) { const f = 1 - (y - H2) / RH; v.box(sx * (W / 2 - 0.1), y + 0.07, (RZ + (EZ + BZ) / 2) / 2 + 0.0, 0.2, 0.14, Math.max(0.1, f * (EZ - BZ) - 0.2), PL2); }
  // outside stair on the east side, from the back (ground) up to the landing
  const SN = 13, SZ0 = -1.8, SZ1 = 1.15;
  for (let k = 0; k < SN; k++) {
    const t = (k + 1) / SN, y = t * RY, z = SZ0 + t * (SZ1 - SZ0);
    v.box(W / 2 + 0.42, y - 0.02, z - 0.1, 0.72, 0.05, 0.26, jitter(C.woodL, 0.05, k));
  }
  for (const x of [W / 2 + 0.06, W / 2 + 0.8]) stick(v, [x, 0, SZ0 - 0.1], [x, RY, SZ1], 0.08, C.woodD, 0.06);
  for (let k = 0; k <= 4; k++) { const t = k / 4; v.box(W / 2 + 0.8, t * RY + 0.45, SZ0 + t * (SZ1 - SZ0), 0.05, 0.9, 0.05, C.woodD); }
  stick(v, [W / 2 + 0.8, 0.9, SZ0], [W / 2 + 0.8, RY + 0.86, SZ1], 0.05, C.woodL);
  // sheds behind (lean-tos with tin roofs)
  for (const [x0, x1] of [[-2.8, -0.6], [0.4, 2.6]]) {
    v.boxMin(x0, 0, -D / 2 - 1.5, x1, 1.7, -D / 2, jitter(C.wood, 0.05, x0));
    for (let x = x0 + 0.2; x < x1; x += 0.3) v.box(x, 0.85, -D / 2 - 1.51, 0.03, 1.7, 0.02, C.woodD);
    boxR(v, (x0 + x1) / 2, 1.95, -D / 2 - 0.75, x1 - x0 + 0.2, 0.04, 1.75, '#A7A296', -0.3, 0, 0);
  }
  // outside: a stack of bales by the west pier, a stool with a basket of weights under the scale
  paperBaleInto(v, -2.6, 0.12, 2.45, 0.1, false, 7);
  paperBaleInto(v, -2.0, 0.12, 2.5, -0.15, false, 8);
  paperBaleInto(v, -2.35, 0.57, 2.45, 0.05, false, 9);
  for (const fx of [-1, 1]) for (const fz of [-1, 1]) v.box(-1.2 + fx * 0.13, 0.22, 2.55 + fz * 0.13, 0.04, 0.44, 0.04, C.woodD);
  v.box(-1.2, 0.46, 2.55, 0.36, 0.05, 0.36, C.woodL);
  prism(v, -1.2, 0.55, 2.55, 0.14, 0.11, 0.12, C.bamboo, 10);
  for (let k = 0; k < 3; k++) weightInto(v, -1.26 + k * 0.06, 0.6, 2.55, 0.6);
  // the hanging pan scale under the deck
  const HX = -1.2, HZ = 2.45;
  v.box(HX, H1 - 0.02, HZ, 0.06, 0.04, 0.06, C.iron);
  v.box(HX, H1 - 0.35, HZ, 0.012, 0.66, 0.012, C.ink);
  v.box(HX, H1 - 0.68, HZ, 0.62, 0.025, 0.025, C.gold);
  v.box(HX, H1 - 0.63, HZ, 0.015, 0.1, 0.015, C.goldD);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; stick(v, [HX + s * 0.3, H1 - 0.68, HZ], [HX + s * 0.3 + Math.cos(a) * 0.1, H1 - 1.02, HZ + Math.sin(a) * 0.1], 0.008, C.ink); }
    prism(v, HX + s * 0.3, H1 - 1.04, HZ, 0.13, 0.09, 0.035, C.gold, 8);
  }
  root.add(v.mesh());
  // the board on the fascia
  const { cv, tex } = canvasTex(1024, 160);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.4), basic('#ffffff', { map: tex }));
  board.position.set(0.0, H1 - 0.09, DZ + 0.056);
  root.add(board);
  const st = textOf(sign);
  const draw = () => { drawBoard(cv, st, { sprigs: false }); tex.needsUpdate = true; };
  draw();
  fontsReady().then(draw);
  // roll-up shutter: drum + a corrugated panel that scales down from it
  const dv = new VoxelBuilder();
  prism(dv, 0, 0, 0, 0.13, 0.13, 2 * OW + 0.1, '#8C887E', 8, 0, 0, Math.PI / 2);
  for (const sx of [-1, 1]) dv.box(sx * (OW + 0.06), 0, 0, 0.04, 0.3, 0.3, C.iron);
  const drum = dv.mesh();
  drum.position.set(0, 2.3, FZ + 0.12);
  root.add(drum);
  const shut = new THREE.Group();
  shut.position.set(0, 2.2, FZ + 0.08);
  root.add(shut);
  const sv = new VoxelBuilder();
  sv.box(0, -1.04, 0, 2 * OW, 2.08, 0.03, '#A39E92');
  for (let y = -0.08; y > -2.08; y -= 0.1) sv.box(0, y, 0.02, 2 * OW, 0.035, 0.02, '#B8B3A7');
  sv.box(0, -2.06, 0.03, 2 * OW, 0.06, 0.05, C.iron);
  for (const sx of [-0.6, 0.6]) sv.box(sx, -1.98, 0.06, 0.12, 0.06, 0.04, C.ironL);
  shut.add(sv.mesh());
  // upstairs: the lock door and the lamp window
  const ld = lockDoor({ scale: 0.98 });
  ld.root.position.set(1.9, RY, UZ);
  root.add(ld.root);
  const lw = lampWindow({ lit });
  lw.root.position.set(-0.6, RY + 1.2, UZ);
  root.add(lw.root);
  const sh = shadowUnder(root, 4.0, 3.0, 0.3, 0.3, 0.38);
  function setShutter(t) { t = clamp01(t); shut.scale.y = Math.max(0.02, t); }
  setShutter(shutter);
  root.userData.footprint = { w: W + 1.0, d: D + 1.5 };
  return {
    root, door: new THREE.Vector3(0, 0, FZ + 0.6), lockDoor: ld, lampWindow: lw,
    setShutter, setLit: lw.setLit,
    update(dt, t) { ld.update(dt); lw.update(dt, t); },
    dispose() { ld.dispose(); lw.dispose(); tex.dispose(); board.material.dispose(); sh.geometry.dispose(); disposeTree(root); },
  };
}



// =============================================================================================
// HEARTH ROW, part two (Days 9, 11, 13): the brick oven, oven vents and the back step, the noodle counter, the
// evening class and the weaving shed (closed shells), and the small things people hold or pin up.
// DIARY GARDEN extras: gardenDiary, committeeTable, wallCalendar.
//   brickOven(o?)       { root, setOpen(0..1), setGlow(0..1), setSmoke(0..1|bool), update(dt,t), dispose }
//   ovenVent(o?)        { root, setHeat(0..1), update(dt,t), dispose }                       back at z = 0
//   backStep(o?)        { root, door, vents, setOpen(0..1), setHeat(0..1), update(dt,t), dispose }  wall back at z = 0
//   noodleCounter(kind) { root, spots, setQueue(n), setSteam(0..1), update(dt,t), dispose }  'street' | 'soup' | 'dry'
//   eveningClass(o?)    { root, door, setOpen(0..1), setLit(0..1), update(dt,t), dispose }
//   weavingShed(o?)     { root, door, clack, setLit(0..1), setWeaving(bool), update(dt,t), dispose }
//   tiffin(o?)          { root, setOpen(0..3), dispose }
//   orderBook()         { root, dispose }
//   paperBox(o?)        { root, setFolded(0..1), dispose }      paperBoxTower(n?) { root, dispose }
//   practiceSheet(o?)   { root, setTicks(a, b), setNames([a, b]), dispose }                   back at z = 0
//   musicStand()        { root, dispose }
//   coveredBundle(o?)   { root, grip, liftCorner(0..1), setTie(color), dispose }
//   gardenDiary(o?)     { root, setOpen(0..1), setPage(lines), dispose }
//   committeeTable(o?)  { root, setLit(0..1), update(dt,t), dispose }
//   wallCalendar(o?)    { root, flip(), reset(), setLabel(text), setDay(n), update(dt), dispose } back at z = 0
// =============================================================================================
const MY_DIGITS = '၀၁၂၃၄၅၆၇၈၉';
const myDigits = (n) => String(n).replace(/[0-9]/g, (d) => MY_DIGITS[+d]);

/** Brick courses on a flat face: mortar lines every `step` and a few odd-toned bricks (colour texture through blocks). */
function brickFace(v, x0, x1, y0, y1, z, r, { step = 0.13, odd = 0.5, skip = null, holes = [] } = {}) {
  for (let y = y0 + step, k = 0; y < y1 - 0.02; y += step, k++) {
    // the mortar line, split round any holes ([hx0, hx1, hy0, hy1]) it crosses
    let spans = [[x0, x1]];
    for (const [hx0, hx1, hy0, hy1] of holes) {
      if (y < hy0 - 0.01 || y > hy1 + 0.01) continue;
      spans = spans.flatMap(([a, b]) => (hx1 <= a || hx0 >= b ? [[a, b]] : [[a, Math.max(a, hx0)], [Math.min(b, hx1), b]].filter(([p, q]) => q - p > 0.02)));
    }
    for (const [a, b] of spans) v.boxMin(a, y - 0.007, z, b, y + 0.007, z + 0.006, C.mortar);
    const n = Math.max(1, Math.round((x1 - x0) * odd * 3));
    for (let j = 0; j < n; j++) {
      const x = x0 + 0.12 + r() * Math.max(0.01, x1 - x0 - 0.24);
      if (skip && skip(x, y)) continue;
      v.box(x, y + step / 2, z + 0.004, 0.22, step - 0.026, 0.01, jitter(r() > 0.5 ? C.brickL : C.brickD, 0.08, k * 13 + j));
    }
  }
}

// ---------------------------------------------------------------------------------------------
// brick oven (1.6 w x 1.5 h x 1.4 d, chimney to 4.5)
// ---------------------------------------------------------------------------------------------
/**
 * The baker's oven: a brick plinth with a log store, a stone hearth, a brick dome in courses, an arched mouth with a
 * hinged iron door (setOpen) and the fire behind it (setGlow), a chimney at the back (setSmoke). A peel leans on it.
 */
export function brickOven({ open = 0, glow: gl = 0.8, smoke = true, chimney = true } = {}) {
  const root = new THREE.Group();
  root.name = 'brickOven';
  const r = rand(17);
  const v = new VoxelBuilder();
  const BH = 0.6, HY = BH + 0.07, FZ = 0.66; // plinth top, hearth top, mouth face
  // plinth with a log store
  v.boxMin(-0.8, 0, -0.7, 0.8, BH, 0.62, C.brickD);
  brickFace(v, -0.8, 0.8, 0, BH, 0.62, r, { skip: (x, y) => Math.abs(x) < 0.62 && y < 0.5, holes: [[-0.62, 0.62, 0, 0.5]] });
  for (const sx of [-1, 1]) for (let y = 0.13; y < BH; y += 0.13) v.boxMin(sx > 0 ? 0.8 : -0.806, y - 0.007, -0.7, sx > 0 ? 0.806 : -0.8, y + 0.007, 0.62, C.mortar);
  v.boxMin(-0.46, 0.04, 0.3, 0.46, 0.36, 0.626, C.soot);
  for (let i = 0; i < 9; i++) { const a = Math.PI * (i + 0.5) / 9; boxR(v, Math.cos(a) * 0.5, 0.36 + Math.sin(a) * 0.12, 0.63, 0.12, 0.07, 0.04, C.brickL, 0, 0, a - Math.PI / 2); }
  for (let k = 0; k < 7; k++) {
    const row = k < 4 ? 0 : 1, col = row ? k - 4 : k;
    const lx = -0.3 + col * 0.2 + row * 0.1, ly = 0.1 + row * 0.12;
    prism(v, lx, ly, 0.48, 0.06, 0.06, 0.32, jitter(C.woodL, 0.08, k), 7, 0, Math.PI / 2);
    prism(v, lx, ly, 0.642, 0.045, 0.045, 0.006, C.crumb, 7, 0, Math.PI / 2);
  }
  // stone hearth slab and a crust of ash on its lip
  v.boxMin(-0.86, BH, -0.76, 0.86, HY, 0.74, C.stoneL);
  v.boxMin(-0.86, BH, 0.7, 0.86, BH + 0.02, 0.745, C.stone);
  v.boxMin(-0.24, HY, 0.66, 0.26, HY + 0.008, 0.73, '#B9AEA2');
  // the dome, course by course (centre pulled back so the mouth face stands proud)
  const R = 0.64, DH = 0.82, DZ = -0.13, NC = 8; // the dome's front (z 0.51) stays behind the throat
  for (let k = 0; k < NC; k++) {
    const a0 = (k / NC) * Math.PI / 2, a1 = ((k + 1) / NC) * Math.PI / 2;
    const y0 = HY + DH * Math.sin(a0), y1 = HY + DH * Math.sin(a1);
    prism(v, 0, (y0 + y1) / 2, DZ, Math.max(0.05, R * Math.cos(a1)), R * Math.cos(a0), y1 - y0, jitter(k % 2 ? C.brick : C.brickL, 0.05, k), 12);
    prism(v, 0, y1 - 0.004, DZ, R * Math.cos(a1) + 0.006, R * Math.cos(a1) + 0.006, 0.012, C.mortar, 12);
  }
  prism(v, 0, HY + DH + 0.03, DZ, 0.1, 0.13, 0.06, C.brickD, 8);
  // odd bricks scattered on the dome's front quarter
  for (let k = 0; k < 14; k++) {
    const a = 0.2 + r() * 0.6, ph = -1.2 + r() * 2.4;
    const rr = R * Math.cos(a) + 0.004, y = HY + DH * Math.sin(a);
    boxR(v, Math.sin(ph) * rr, y, DZ + Math.cos(ph) * rr, 0.16, 0.07, 0.02, jitter(r() > 0.5 ? C.brickD : '#C0705A', 0.06, k), -a * 0.8, ph, 0, 'YXZ');
  }
  // mouth collar: a proud brick face with an arched opening (0.54 wide, 0.49 high)
  const MW = 0.27, MR = 0.27, MS = HY + 0.22; // half width, arch radius, arch springing height
  v.boxMin(-0.5, HY, 0.36, -MW, HY + 0.68, FZ, C.brick);
  v.boxMin(MW, HY, 0.36, 0.5, HY + 0.68, FZ, C.brick);
  for (let x = -MW; x < MW - 0.001; x += 0.03) {
    const yTop = MS + Math.sqrt(Math.max(0, MR * MR - (x + 0.015) * (x + 0.015)));
    v.boxMin(x, yTop, 0.36, x + 0.03, HY + 0.68, FZ, C.brick);
    v.boxMin(x, HY, 0.52, x + 0.03, yTop, 0.6, C.soot); // the dark throat
  }
  brickFace(v, -0.5, 0.5, HY, HY + 0.68, FZ, r, { step: 0.12, odd: 0.4, skip: (x, y) => Math.abs(x) < 0.42 && y < MS + 0.36, holes: [[-0.36, 0.36, HY, MS + MR + 0.1]] });
  for (let i = 0; i < 9; i++) { const a = Math.PI * (i + 0.5) / 9; boxR(v, Math.cos(a) * (MR + 0.06), MS + Math.sin(a) * (MR + 0.06), FZ + 0.02, 0.07, 0.12, 0.05, i === 4 ? C.stoneL : jitter(C.brickL, 0.06, i), 0, 0, a - Math.PI / 2); }
  v.boxMin(-0.52, HY + 0.66, 0.34, 0.52, HY + 0.72, FZ + 0.04, C.stoneL); // cap stone over the collar
  // soot tongue above the mouth
  for (let k = 0; k < 3; k++) v.box(0, MS + MR + 0.14 + k * 0.05, FZ + 0.007, 0.26 - k * 0.07, 0.05, 0.004, k < 2 ? '#5A3328' : '#7A4334');
  // chimney at the back
  const smokeAt = [];
  if (chimney) {
    const top = 4.5;
    v.boxMin(-0.2, HY + 0.4, -0.72, 0.2, top, -0.32, C.brick);
    for (let y = HY + 0.6; y < top - 0.1; y += 0.2) v.boxMin(-0.205, y, -0.725, 0.205, y + 0.016, -0.315, C.mortar);
    v.boxMin(-0.27, top - 0.04, -0.79, 0.27, top + 0.08, -0.25, C.stoneL);
    v.boxMin(-0.21, top - 0.5, -0.73, 0.21, top - 0.2, -0.31, '#6B3A2C');
    prism(v, 0, top + 0.2, -0.52, 0.08, 0.1, 0.24, C.terra);
    prism(v, 0, top + 0.33, -0.52, 0.1, 0.1, 0.03, C.terraD);
    smokeAt.push([0, top + 0.42, -0.52]);
    v.boxMin(-0.215, 2.2, -0.735, 0.215, 2.25, -0.305, C.iron); // an iron tie band round the stack
  }
  // a baker's peel leaning on the right, a rake on the left, a log basket
  stick(v, [0.9, 0.36, 0.5], [0.7, 1.75, 0.52], 0.04, C.woodL);
  boxR(v, 0.92, 0.2, 0.5, 0.3, 0.36, 0.02, C.woodL, 0, Math.PI / 2, -0.12);
  stick(v, [-0.86, 0.02, 0.45], [-0.66, 1.55, 0.5], 0.035, C.woodD);
  boxR(v, -0.88, 0.06, 0.45, 0.04, 0.1, 0.24, C.iron, 0, 0, 0.1);
  prism(v, -1.15, 0.13, 0.25, 0.2, 0.17, 0.26, C.bambooD, 10);
  prism(v, -1.15, 0.25, 0.25, 0.205, 0.205, 0.03, C.bamboo, 10);
  for (let k = 0; k < 4; k++) prism(v, -1.15 + (k - 1.5) * 0.08, 0.3, 0.25 + (k % 2) * 0.04, 0.04, 0.04, 0.36, jitter(C.woodL, 0.08, k + 9), 7, 0, Math.PI / 2, 0.2);
  root.add(v.mesh());

  // the fire: an arch-shaped unlit panel in the throat (dark when out), embers on the hearth
  const g = glow('#2A1A14', '#FFB25C');
  const gv = new VoxelBuilder();
  for (let x = -MW + 0.03; x < MW - 0.031; x += 0.03) {
    const yTop = MS + Math.sqrt(Math.max(0, (MR - 0.03) ** 2 - (x + 0.015) ** 2));
    gv.boxMin(x, HY, 0.6, x + 0.03, yTop - 0.02, 0.605, '#FFD9A0');
  }
  for (let k = 0; k < 9; k++) gv.box(-0.2 + k * 0.05, HY + 0.025, 0.615 + (k % 3) * 0.01, 0.045, 0.04, 0.02, k % 2 ? '#FFFFFF' : '#FF9A5A', k * 0.7);
  root.add(glowMesh(gv, g));
  const hl = halo(1.2, 0.9, false, 1.2); // the oven mouth
  hl.position.set(0, MS + 0.05, FZ + 0.1);
  root.add(hl);

  // the iron door, hinged on the left of the mouth, swings out
  const hinge = new THREE.Group();
  hinge.position.set(-MW - 0.02, HY, FZ + 0.04);
  root.add(hinge);
  const dv = new VoxelBuilder();
  const DWd = 2 * MW + 0.04;
  for (let x = 0; x < DWd - 0.001; x += 0.04) {
    const cx = x + 0.02 - DWd / 2;
    const yTop = MS - HY + Math.sqrt(Math.max(0, (MR + 0.02) ** 2 - cx * cx));
    dv.boxMin(x, 0.0, -0.015, x + 0.04, yTop, 0.015, '#3E322B');
  }
  dv.boxMin(0.03, 0.04, 0.015, DWd - 0.03, 0.08, 0.03, C.ironL);
  dv.boxMin(0.03, 0.3, 0.015, DWd - 0.03, 0.34, 0.03, C.ironL);
  for (let k = 0; k < 6; k++) for (const y of [0.06, 0.32]) dv.box(0.07 + k * ((DWd - 0.14) / 5), y, 0.035, 0.02, 0.02, 0.01, C.tinD);
  dv.boxMin(DWd - 0.12, 0.16, 0.03, DWd - 0.04, 0.2, 0.08, C.brassD); // latch handle
  dv.box(DWd - 0.05, 0.18, 0.09, 0.04, 0.1, 0.03, C.brass);
  for (const y of [0.1, 0.36]) dv.box(0.0, y, 0.0, 0.06, 0.05, 0.05, C.iron); // hinge knuckles
  hinge.add(dv.mesh({ px: 1.3 }));
  // the door's draught slot glows a little even when shut
  const sv = new VoxelBuilder();
  sv.boxMin(0.16, 0.2, 0.016, DWd - 0.16, 0.24, 0.02, '#FFD9A0');
  hinge.add(glowMesh(sv, g));

  const sm = smokeFx(smokeAt.length ? smokeAt : [[0, 0, 0]], { n: 9, rise: 2.4, size: 0.3, drift: 0.5 });
  if (smokeAt.length) root.add(sm.mesh);
  const sh = shadowUnder(root, 1.0, 0.9, 0, 0.05, 0.42);
  let openT = 0, glowT = 0;
  function setOpen(t) { openT = clamp01(t); hinge.rotation.y = -ease(openT) * 1.9; setHalo(hl, glowT * (0.15 + openT * 0.6)); }
  function setGlow(t) { glowT = clamp01(t); g.set(glowT); setOpen(openT); }
  setGlow(gl);
  setOpen(open);
  sm.setAmount(smoke);
  root.userData.footprint = { w: 1.9, d: 1.6 };
  return {
    root, door: hinge,
    setOpen, setGlow, setSmoke: sm.setAmount,
    update(dt, t) { if (smokeAt.length) sm.update(t); if (glowT > 0.01) g.set(glowT * (0.9 + Math.sin(t * 5.3) * 0.06 + Math.sin(t * 12.1) * 0.04)); },
    dispose() { g.mat.dispose(); hl.material.dispose(); sh.geometry.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// oven vent and the back step
// ---------------------------------------------------------------------------------------------
/** A brick vent low in a wall (0.5 x 0.4, back at z = 0, centre 0.3 up) with an iron grille, a soot stain and a
 * thin heat shimmer (setHeat). */
export function ovenVent({ heat = 1 } = {}) {
  const root = new THREE.Group();
  root.name = 'ovenVent';
  const v = new VoxelBuilder();
  const Y = 0.3;
  v.box(0, Y, 0.03, 0.5, 0.4, 0.06, C.stoneL); // frame
  v.box(0, Y - 0.22, 0.06, 0.58, 0.05, 0.12, C.stone); // sill
  v.box(0, Y + 0.02, 0.062, 0.36, 0.26, 0.01, C.soot); // dark throat
  for (let k = 0; k < 5; k++) v.box(-0.14 + k * 0.07, Y + 0.02, 0.075, 0.025, 0.28, 0.025, C.iron);
  v.box(0, Y + 0.02, 0.08, 0.38, 0.025, 0.02, C.ironL);
  // soot licks above
  for (let k = 0; k < 4; k++) v.box((k % 2 ? 0.03 : -0.02), Y + 0.24 + k * 0.06, 0.004, 0.34 - k * 0.07, 0.06, 0.008, k < 2 ? '#4E3A30' : '#6E5244');
  root.add(v.mesh({ px: 1.2 }));
  const g = glow('#2A1A14', '#FF9A50');
  const gv = new VoxelBuilder();
  gv.box(0, Y - 0.06, 0.066, 0.32, 0.08, 0.004, '#FFFFFF');
  root.add(glowMesh(gv, g));
  const st = smokeFx([[0, Y + 0.18, 0.12]], { n: 5, rise: 0.6, size: 0.045, spread: 0.1, drift: 0.04, speed: 0.6, color: '#F6EEE2' });
  root.add(st.mesh);
  let heatT = 0;
  function setHeat(t) { heatT = typeof t === 'boolean' ? (t ? 1 : 0) : clamp01(t); g.set(heatT * 0.7); st.setAmount(heatT * 0.6); }
  setHeat(heat);
  return { root, setHeat, update(dt, t) { st.update(t); }, dispose() { g.mat.dispose(); disposeTree(root); } };
}

/**
 * The bakery's back step: a strip of brick wall (3.2 w x 2.9 h, back at z = 0) with a plank back door (the
 * provingroom door; setOpen swings it inward onto warm light), three worn brick steps (1.6 x 0.45 x 0.9) and an
 * oven vent either side. A broom, a tin bucket and a sack mat. door: where Maya stands on the bottom step.
 */
export function backStep({ open = 0, heat = 1 } = {}) {
  const root = new THREE.Group();
  root.name = 'backStep';
  const r = rand(23);
  const v = new VoxelBuilder();
  const W = 3.2, H = 2.9, T = 0.3, SH = 0.45, DW = 0.98, DH = 2.0;
  // wall with the door hole
  v.boxMin(-W / 2, 0, -T, -DW / 2, H, 0, C.brick);
  v.boxMin(DW / 2, 0, -T, W / 2, H, 0, C.brick);
  v.boxMin(-DW / 2, SH + DH, -T, DW / 2, H, 0, C.brick);
  v.boxMin(-DW / 2, 0, -T, DW / 2, SH, 0, C.brickD);
  brickFace(v, -W / 2, W / 2, 0, H, 0, r, { step: 0.14, skip: (x, y) => Math.abs(x) < DW / 2 + 0.12 && y < SH + DH + 0.1 });
  v.boxMin(-W / 2, 0, 0, W / 2, 0.16, 0.05, C.stone); // footing
  v.boxMin(-W / 2 - 0.04, H - 0.08, -T - 0.02, W / 2 + 0.04, H + 0.02, 0.1, C.stoneL); // coping
  // frame, lintel, threshold
  for (const sx of [-1, 1]) v.boxMin(sx * DW / 2 - (sx > 0 ? 0 : 0.1), SH, -T, sx * DW / 2 + (sx > 0 ? 0.1 : 0), SH + DH + 0.08, 0.06, C.woodD);
  v.boxMin(-DW / 2 - 0.2, SH + DH + 0.05, -T, DW / 2 + 0.2, SH + DH + 0.2, 0.08, C.stoneL);
  v.boxMin(-DW / 2, SH, -T, DW / 2, SH + 0.02, 0.02, C.woodDD);
  // three worn steps, a paler dip in the middle of each tread
  for (let k = 0; k < 3; k++) {
    const y0 = k * 0.15, z1 = 0.9 - k * 0.3;
    v.boxMin(-0.8, y0, 0, 0.8, y0 + 0.15, z1, jitter(C.brickD, 0.05, k));
    v.boxMin(-0.8, y0 + 0.14, z1 - 0.06, 0.8, y0 + 0.153, z1, C.brickL);
    v.box(0.05, y0 + 0.152, z1 - 0.15, 0.6, 0.004, 0.18, '#C98D74');
    v.box(-0.05, y0 + 0.154, z1 - 0.13, 0.3, 0.004, 0.1, '#D9A58C');
    for (let x = -0.6; x < 0.7; x += 0.4) v.box(x + (k % 2) * 0.2, y0 + 0.075, z1 + 0.003, 0.012, 0.13, 0.006, C.mortar);
    v.boxMin(-0.8, y0 + 0.07, z1, 0.8, y0 + 0.084, z1 + 0.006, C.mortar);
  }
  // a hook lantern over the door (unlit iron)
  v.box(0, SH + DH + 0.38, 0.06, 0.06, 0.24, 0.1, C.iron);
  v.box(0, SH + DH + 0.3, 0.18, 0.18, 0.04, 0.18, C.iron);
  // broom against the wall, tin bucket, a sack mat at the foot of the steps
  stick(v, [1.05, 0.25, 0.1], [0.98, 1.5, 0.05], 0.035, C.bambooL);
  for (let k = 0; k < 9; k++) stick(v, [1.05 + (k - 4) * 0.015, 0.25, 0.1], [1.06 + (k - 4) * 0.035, 0.01, 0.16 + (k % 2) * 0.02], 0.016, k % 2 ? C.twine : C.twineD);
  v.box(1.05, 0.26, 0.1, 0.1, 0.05, 0.05, C.maroon);
  prism(v, -1.0, 0.14, 0.3, 0.15, 0.12, 0.28, C.tin, 10);
  prism(v, -1.0, 0.27, 0.3, 0.155, 0.155, 0.02, C.tinL, 10);
  prism(v, -1.0, 0.26, 0.3, 0.13, 0.13, 0.005, C.water, 10);
  stick(v, [-1.14, 0.27, 0.3], [-1.0, 0.42, 0.3], 0.012, C.iron);
  stick(v, [-1.0, 0.42, 0.3], [-0.86, 0.27, 0.3], 0.012, C.iron);
  boxR(v, 0, 0.006, 1.25, 0.9, 0.012, 0.55, C.sack, 0, 0.04, 0);
  for (let k = 0; k < 4; k++) boxR(v, 0, 0.013, 1.05 + k * 0.13, 0.86, 0.004, 0.015, C.sackD, 0, 0.04, 0);
  root.add(v.mesh());
  // warm light behind the door
  const g = glow('#2E2218', '#FFC978');
  const gv = new VoxelBuilder();
  gv.box(0, SH + DH / 2, -T + 0.02, DW, DH, 0.01, '#FFFFFF');
  root.add(glowMesh(gv, g));
  const pool = halo(1.6, 1.4, true);
  pool.position.set(0, SH + 0.02, 0.7);
  root.add(pool);
  // the plank door, hinged on the right jamb, opens inward
  const hinge = new THREE.Group();
  hinge.position.set(DW / 2 - 0.01, SH, -0.08);
  root.add(hinge);
  const lv = new VoxelBuilder();
  for (let k = 0; k < 5; k++) lv.box(-DW + (k + 0.5) * (DW / 5) + 0.01, DH / 2, 0, DW / 5 - 0.008, DH - 0.02, 0.05, jitter('#8A5E3C', 0.08, k + 70));
  for (const y of [0.3, DH - 0.3]) lv.box(-DW / 2, y, 0.03, DW - 0.06, 0.1, 0.02, '#6A4630');
  boxR(lv, -DW / 2, DH / 2, 0.03, 0.08, DH - 0.6, 0.02, '#6A4630', 0, 0, 0.42);
  for (const y of [0.3, DH - 0.3]) lv.box(-0.12, y, 0.045, 0.24, 0.05, 0.015, C.iron);
  lv.box(-DW + 0.12, DH * 0.5, 0.05, 0.05, 0.05, 0.04, C.iron); // latch
  lv.box(-DW + 0.18, DH * 0.5, 0.06, 0.14, 0.025, 0.02, C.ironL);
  hinge.add(lv.mesh());
  const vents = [-1, 1].map((sx) => { const o = ovenVent({ heat }); o.root.position.set(sx * 1.2, 0.05, 0); root.add(o.root); return o; });
  const sh = shadowUnder(root, 1.1, 0.6, 0, 0.5, 0.35);
  let openT = 0;
  function setOpen(t) { openT = clamp01(t); hinge.rotation.y = ease(openT) * 1.6; g.set(0.12 + openT * 0.88); setHalo(pool, openT * 0.6); }
  setOpen(open);
  root.userData.footprint = { w: W, d: 1.4 };
  return {
    root, door: new THREE.Vector3(0, 0, 1.15), vents,
    setOpen, setHeat(t) { for (const o of vents) o.setHeat(t); },
    update(dt, t) { for (const o of vents) o.update(dt, t); },
    dispose() { for (const o of vents) o.dispose(); g.mat.dispose(); pool.material.dispose(); sh.geometry.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// noodle counter (street 2.4 x 2.2 x 1.4; soup / dry 1.8 x 1.1 x 0.8 indoor)
// ---------------------------------------------------------------------------------------------
function bowlInto(v, x, y, z, s = 1, col = C.white2, rim = C.glaze) {
  prism(v, x, y + 0.012 * s, z, 0.035 * s, 0.03 * s, 0.024 * s, col, 8);
  prism(v, x, y + 0.04 * s, z, 0.07 * s, 0.045 * s, 0.035 * s, col, 10);
  prism(v, x, y + 0.06 * s, z, 0.072 * s, 0.072 * s, 0.008 * s, rim, 10);
}
function stoolInto(v, x, z, col, ry = 0) {
  const cs = Math.cos(ry), sn = Math.sin(ry);
  prism(v, x, 0.27, z, 0.15, 0.15, 0.03, col, 10, ry);
  prism(v, x, 0.25, z, 0.14, 0.14, 0.02, shade(col, 0.8), 10, ry);
  for (const [lx, lz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const ax = (lx * cs + lz * sn) * 0.1, az = (-lx * sn + lz * cs) * 0.1;
    stick(v, [x + ax * 0.75, 0.24, z + az * 0.75], [x + ax * 1.15, 0, z + az * 1.15], 0.035, shade(col, 0.88));
  }
  prism(v, x, 0.12, z, 0.11, 0.11, 0.02, shade(col, 0.88), 8, ry);
}

/**
 * The noodle shop's counter. 'street': the kerb counter under a tarp awning, the big soup pot steaming on a brick
 * stove at its end, a glass case of noodles and greens, three low stools (maroon, teal). 'soup' / 'dry': the two indoor
 * counters (soup = pot on a charcoal stove behind; dry = bowl stack, peanut and lime trays). spots: queue places.
 */
export function noodleCounter(kind = 'street', { sign = { my: 'ပူပူနွေးနွေး', en: 'Served hot' } } = {}) {
  const root = new THREE.Group();
  root.name = `noodleCounter:${kind}`;
  const street = kind === 'street';
  const r = rand(kind.length * 7 + 3);
  const v = new VoxelBuilder();
  const CW = street ? 1.9 : 1.8, CH = street ? 0.92 : 0.95, CD = 0.62, CX = street ? -0.2 : 0;
  // counter body: planks, a maroon apron board, a cream top with a gold edge
  v.boxMin(CX - CW / 2, 0, -CD / 2, CX + CW / 2, CH - 0.05, CD / 2, C.woodD);
  for (let k = 0; k < Math.round(CW / 0.19); k++) v.box(CX - CW / 2 + 0.095 + k * 0.19, (CH - 0.05) / 2, CD / 2 + 0.01, 0.17, CH - 0.1, 0.02, jitter(C.wood, 0.07, k + 5));
  v.boxMin(CX - CW / 2, CH - 0.3, CD / 2 + 0.02, CX + CW / 2, CH - 0.12, CD / 2 + 0.04, C.maroon);
  v.boxMin(CX - CW / 2, CH - 0.31, CD / 2 + 0.04, CX + CW / 2, CH - 0.29, CD / 2 + 0.05, C.gold);
  v.boxMin(CX - CW / 2 - 0.04, CH - 0.05, -CD / 2 - 0.04, CX + CW / 2 + 0.04, CH, CD / 2 + 0.06, C.cream);
  v.boxMin(CX - CW / 2 - 0.04, CH - 0.06, CD / 2 + 0.06, CX + CW / 2 + 0.04, CH - 0.02, CD / 2 + 0.07, C.goldD);
  v.boxMin(CX - CW / 2, 0, CD / 2 - 0.02, CX + CW / 2, 0.08, CD / 2 + 0.04, C.woodDD); // kick board
  const top = CH;
  // a glass case (frame + pale panes) with noodle bundles and greens
  const gx = CX - CW / 2 + 0.45;
  for (const fx of [-1, 1]) for (const fz of [-1, 1]) v.box(gx + fx * 0.33, top + 0.2, fz * 0.18, 0.03, 0.4, 0.03, C.woodD);
  v.box(gx, top + 0.41, 0, 0.7, 0.03, 0.4, C.woodD);
  v.box(gx, top + 0.33, 0.18, 0.64, 0.14, 0.006, C.glass); // a sneeze-glass strip; the case is open below it
  v.box(gx - 0.22, top + 0.34, 0.185, 0.04, 0.08, 0.004, C.white);
  v.box(gx, top + 0.255, 0.18, 0.66, 0.02, 0.02, C.woodD);
  for (let k = 0; k < 5; k++) {
    boxR(v, gx - 0.24 + k * 0.12, top + 0.04, -0.02, 0.1, 0.05, 0.16, jitter('#F1E3B4', 0.05, k), 0, (k % 2) * 0.2, 0);
    for (let j = 0; j < 3; j++) v.box(gx - 0.27 + k * 0.12 + j * 0.03, top + 0.07, -0.02, 0.01, 0.012, 0.15, '#E3D09A');
  }
  v.box(gx, top + 0.22, 0, 0.62, 0.02, 0.36, C.glass);
  for (let k = 0; k < 6; k++) v.box(gx - 0.25 + k * 0.1, top + 0.26, (k % 2) * 0.06 - 0.03, 0.08, 0.05, 0.08, k % 3 ? C.leaf : C.leafL);
  // chopstick cup, chilli jar, fish-sauce bottle, a stack of bowls, lime saucer
  const ux = CX + 0.15;
  prism(v, ux, top + 0.06, 0.12, 0.04, 0.035, 0.12, C.bambooD, 8);
  for (let k = 0; k < 7; k++) stick(v, [ux - 0.02 + (k % 3) * 0.02, top + 0.05, 0.11 + (k % 2) * 0.02], [ux - 0.04 + (k % 4) * 0.025, top + 0.24, 0.1 + (k % 3) * 0.02], 0.008, C.bambooL);
  prism(v, ux + 0.14, top + 0.05, 0.14, 0.04, 0.04, 0.1, '#E8DCC8', 8);
  prism(v, ux + 0.14, top + 0.04, 0.14, 0.035, 0.035, 0.07, '#B3361E', 8);
  prism(v, ux + 0.14, top + 0.11, 0.14, 0.042, 0.042, 0.02, C.maroon, 8);
  prism(v, ux + 0.25, top + 0.08, 0.1, 0.03, 0.03, 0.16, '#8A4E22', 8);
  prism(v, ux + 0.25, top + 0.18, 0.1, 0.012, 0.018, 0.05, '#8A4E22', 8);
  prism(v, ux + 0.25, top + 0.21, 0.1, 0.014, 0.014, 0.02, C.maroon, 6);
  for (let k = 0; k < 5; k++) bowlInto(v, ux + 0.03, top + k * 0.036, -0.12, 1.1, C.white2, k % 2 ? C.glaze : C.maroon);
  prism(v, ux + 0.3, top + 0.01, -0.12, 0.09, 0.09, 0.015, C.white2, 10);
  for (let k = 0; k < 5; k++) prism(v, ux + 0.27 + (k % 3) * 0.03, top + 0.035, -0.14 + (k > 2 ? 0.05 : 0), 0.025, 0.025, 0.03, k % 2 ? C.leafL : '#B7CF6A', 7);
  // a price card on a stand
  const pcx = CX + CW / 2 - 0.2;
  v.box(pcx, top + 0.12, 0.2, 0.22, 0.18, 0.01, C.parch);
  v.box(pcx, top + 0.17, 0.206, 0.16, 0.025, 0.004, C.maroon);
  for (let k = 0; k < 3; k++) v.box(pcx, top + 0.12 - k * 0.035, 0.206, 0.14 - k * 0.02, 0.012, 0.004, C.ink);
  v.box(pcx, top + 0.02, 0.18, 0.12, 0.03, 0.06, C.woodD);
  // the pot (street: a brick stove at the right end; soup: a charcoal stove behind the counter)
  const steamAt = [];
  if (kind !== 'dry') {
    const px = street ? CX + CW / 2 + 0.42 : 0.35, pz = street ? 0.05 : -0.62, py = street ? 0.62 : 0.6;
    if (street) {
      v.boxMin(px - 0.32, 0, pz - 0.32, px + 0.32, py - 0.06, pz + 0.32, C.brickD);
      brickFace(v, px - 0.32, px + 0.32, 0, py - 0.06, pz + 0.32, r, { step: 0.11, odd: 0.8 });
      v.boxMin(px - 0.12, 0.08, pz + 0.3, px + 0.12, 0.26, pz + 0.33, C.soot);
      v.boxMin(px - 0.08, 0.1, pz + 0.331, px + 0.08, 0.14, pz + 0.335, '#E0703A');
      v.boxMin(px - 0.36, py - 0.06, pz - 0.36, px + 0.36, py, pz + 0.36, C.stoneL);
    } else {
      prism(v, px, 0.3, pz, 0.24, 0.2, 0.6, C.terra, 10);
      prism(v, px, 0.585, pz, 0.25, 0.25, 0.03, C.tinD, 10);
    }
    // the big aluminium pot with a ladle
    prism(v, px, py + 0.21, pz, 0.27, 0.25, 0.42, '#B8BEC2', 12);
    prism(v, px, py + 0.43, pz, 0.285, 0.285, 0.03, '#D4D9DC', 12);
    prism(v, px, py + 0.405, pz, 0.25, 0.25, 0.012, '#C88A3C', 12); // the broth
    for (let k = 0; k < 6; k++) v.box(px + Math.cos(k * 1.1) * 0.13, py + 0.415, pz + Math.sin(k * 1.1) * 0.13, 0.05, 0.01, 0.04, k % 2 ? C.leafL : '#F2E6C8');
    for (const sx of [-1, 1]) v.box(px + sx * 0.3, py + 0.34, pz, 0.06, 0.04, 0.1, '#8E959A');
    v.box(px, py + 0.2, pz + 0.255, 0.3, 0.02, 0.01, '#9AA1A6');
    stick(v, [px + 0.08, py + 0.4, pz + 0.05], [px + 0.2, py + 0.78, pz + 0.12], 0.02, C.woodD);
    prism(v, px + 0.07, py + 0.4, pz + 0.04, 0.06, 0.05, 0.05, '#C9CED2', 8);
    steamAt.push([px - 0.08, py + 0.48, pz], [px + 0.1, py + 0.48, pz - 0.05]);
  }
  if (kind === 'dry' || street) {
    // peanut and lime trays, a crisp-shallot jar
    const tx = kind === 'dry' ? 0.3 : CX - 0.2, tz = kind === 'dry' ? 0 : 0.17;
    [[0, '#C9925A'], [1, '#B7CF6A']].forEach(([k, col]) => {
      v.box(tx + k * 0.2, top + 0.015, tz, 0.17, 0.03, 0.13, C.tin);
      for (let j = 0; j < 6; j++) v.box(tx + k * 0.2 - 0.05 + (j % 3) * 0.05, top + 0.035, tz - 0.03 + Math.floor(j / 3) * 0.06, 0.04, 0.02, 0.04, jitter(col, 0.08, j));
    });
    if (kind === 'dry') {
      prism(v, tx + 0.42, top + 0.08, tz - 0.02, 0.05, 0.05, 0.16, C.glass, 8);
      prism(v, tx + 0.42, top + 0.05, tz - 0.02, 0.045, 0.045, 0.09, '#C88A3C', 8);
      prism(v, tx + 0.42, top + 0.17, tz - 0.02, 0.052, 0.052, 0.02, C.maroon, 8);
      for (let k = 0; k < 8; k++) bowlInto(v, -0.55 + (k % 2) * 0.17, top + Math.floor(k / 2) * 0.036, 0.05, 1.1, C.white2, C.glaze);
    }
  }
  // street extras: awning on posts, a hanging board, three stools, a wash bucket
  let board = null, tex = null;
  if (street) {
    const AW = 2.5, AY0 = 2.2, AY1 = 1.95, AZ0 = -0.55, AZ1 = 0.75;
    for (const sx of [-1, 1]) for (const z of [AZ0, AZ1]) { const h = z === AZ0 ? AY0 : AY1; v.box(sx * (AW / 2 - 0.05), h / 2, z, 0.07, h, 0.07, C.woodD); v.box(sx * (AW / 2 - 0.05), 0.04, z, 0.14, 0.08, 0.14, C.stone); }
    const al = Math.hypot(AZ1 - AZ0, AY0 - AY1), aa = Math.atan2(AY0 - AY1, AZ1 - AZ0);
    const ns = 8;
    for (let k = 0; k < ns; k++) boxR(v, -AW / 2 + (k + 0.5) * (AW / ns), (AY0 + AY1) / 2 + 0.04, (AZ0 + AZ1) / 2, AW / ns + 0.002, 0.035, al + 0.2, k % 2 ? C.tarpL : C.tarp, aa, 0, 0);
    for (let k = 0; k < ns * 2; k++) v.box(-AW / 2 + (k + 0.5) * (AW / ns / 2), AY1 - 0.07, AZ1 + 0.1, AW / ns / 2 - 0.03, 0.1 + (k % 2) * 0.04, 0.02, k % 4 < 2 ? C.tarpL : C.tarp);
    for (const sx of [-1, 1]) v.box(sx * (AW / 2 - 0.05), AY1 - 0.15, (AZ0 + AZ1) / 2, 0.05, 0.05, AZ1 - AZ0, C.woodD);
    for (const sx of [-1, 1]) stick(v, [sx * 0.42, AY1 - 0.06, AZ1 - 0.05], [sx * 0.42, AY1 - 0.24, AZ1 - 0.05], 0.012, C.twineD);
    v.box(0, AY1 - 0.44, AZ1 - 0.07, 1.04, 0.42, 0.04, C.woodD);
    stoolInto(v, -0.75, 0.95, C.maroon, 0.3); // the palette's maroon and a muted teal, not plastic red/blue
    stoolInto(v, 0.1, 1.05, C.tarpL, -0.2);
    stoolInto(v, 0.85, 0.95, C.maroon, 0.1);
    prism(v, -1.35, 0.15, 0.55, 0.2, 0.17, 0.3, '#5E86A6', 10);
    prism(v, -1.35, 0.29, 0.55, 0.205, 0.205, 0.02, '#7AA0BE', 10);
    prism(v, -1.35, 0.28, 0.55, 0.18, 0.18, 0.005, C.water, 10);
    bowlInto(v, -1.4, 0.27, 0.52, 1, C.white2, C.glaze);
    boxR(v, -1.18, 0.24, 0.6, 0.03, 0.12, 0.14, C.white2, 0, 0, 0.2);
    const ct = canvasTex(512, 200);
    tex = ct.tex;
    const paint = () => { drawBoard(ct.cv, textOf(sign), { sprigs: false }); tex.needsUpdate = true; }; // differs from the shop board on purpose
    paint();
    fontsReady().then(paint);
    board = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.37), basic('#ffffff', { map: tex }));
    board.position.set(0, AY1 - 0.44, AZ1 - 0.048);
    root.add(board);
  }
  root.add(v.mesh());
  const st = smokeFx(steamAt.length ? steamAt : [[0, 0, 0]], { n: 8, rise: 0.9, size: 0.12, spread: 0.16, drift: 0.1, speed: 0.45, color: '#FFFFFF' });
  if (steamAt.length) root.add(st.mesh);
  const sh = shadowUnder(root, street ? 1.5 : 1.0, street ? 0.9 : 0.45, 0, street ? 0.1 : 0, 0.38);
  const spots = street ? [new THREE.Vector3(-0.4, 0, 1.35), new THREE.Vector3(0.3, 0, 1.6), new THREE.Vector3(0.9, 0, 1.9), new THREE.Vector3(1.4, 0, 2.3)]
    : [new THREE.Vector3(0, 0, 0.75), new THREE.Vector3(0.15, 0, 1.3), new THREE.Vector3(-0.1, 0, 1.85), new THREE.Vector3(0.2, 0, 2.4)];
  let queue = 2;
  root.userData.footprint = { w: street ? 2.6 : 1.9, d: street ? 1.6 : 0.9 };
  return {
    root, spots,
    setQueue(n) { queue = Math.max(0, Math.min(spots.length, n | 0)); return spots.slice(0, queue); },
    get queue() { return queue; },
    setSteam: st.setAmount,
    update(dt, t) { if (steamAt.length) st.update(t); },
    dispose() { tex?.dispose(); board?.material.dispose(); sh.geometry.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// shells: the evening class (7 x 3.5 x 5) and the weaving shed (12 x 3.2 x 4)
// ---------------------------------------------------------------------------------------------
/** Corrugated tin gable roof, ridge along X: eaves at y0, ridge at y0 + rh, half depth ez, width w. */
function tinRoofInto(v, w, y0, rh, ez, r, { col = '#A8A296', colD = '#8C887E', rust = '#B07A4E', ridge = C.tinD } = {}) {
  const sl = Math.hypot(ez, rh), ang = Math.atan2(rh, ez);
  for (const side of [1, -1]) {
    boxR(v, 0, y0 + rh / 2, side * ez / 2, w, 0.06, sl, colD, side * ang, 0, 0);
    // corrugation ribs running down the slope
    for (let x = -w / 2 + 0.08; x < w / 2; x += 0.16) boxR(v, x, y0 + rh / 2 + 0.035, side * ez / 2, 0.06, 0.02, sl, col, side * ang, 0, 0);
    // sheet laps and rust patches
    for (let x = -w / 2 + 1.1; x < w / 2 - 0.3; x += 1.1) boxR(v, x, y0 + rh / 2 + 0.05, side * ez / 2, 0.04, 0.012, sl, colD, side * ang, 0, 0);
    for (let k = 0; k < Math.round(w * 0.9); k++) {
      const f = 0.2 + r() * 0.75;
      boxR(v, -w / 2 + 0.3 + r() * (w - 0.6), y0 + rh * (1 - f) + 0.06, side * ez * f, 0.25 + r() * 0.35, 0.012, 0.18 + r() * 0.3, jitter(rust, 0.1, k), side * ang, 0, 0);
    }
  }
  v.box(0, y0 + rh + 0.03, 0, w + 0.06, 0.08, 0.26, ridge);
}

/** A pair of sandals (flip-flops) at x, z on a surface at y; s = size. */
function sandalsInto(v, x, y, z, s, sole, strap, ry = 0) {
  for (const sx of [-1, 1]) {
    const cx = x + Math.cos(ry) * sx * 0.06 * s, cz = z - Math.sin(ry) * sx * 0.06 * s;
    boxR(v, cx, y + 0.01, cz, 0.08 * s, 0.02, 0.24 * s, sole, 0, ry + sx * 0.05, 0);
    boxR(v, cx, y + 0.021, cz, 0.07 * s, 0.004, 0.22 * s, shade(sole, 1.15), 0, ry + sx * 0.05, 0);
    boxR(v, cx - Math.sin(ry) * 0.02 * s, y + 0.035, cz - Math.cos(ry) * 0.02 * s, 0.085 * s, 0.022, 0.025, strap, 0, ry, 0);
  }
}

/**
 * The evening class (closed shell): whitewashed walls with damp and a patch of bare brick, a corrugated tin roof, a
 * green door two steps up (setOpen; lamplight inside), barred windows with green shutters (setLit), the class board
 * over the door, a chalk easel, a water-pot stand, and a sandal rack on the step (big pairs, two small).
 */
export function eveningClass({ open = 0, lit = 0.8, title = { my: 'ညနေ စာသင်တန်း', en: 'Evening Class' }, chalk = ['ယနေ့ ည ၇ နာရီ', 'စာဖတ်ခြင်း'] } = {}) {
  const root = new THREE.Group();
  root.name = 'eveningClass';
  const r = rand(37);
  const v = new VoxelBuilder();
  const W = 7, H = 3.5, D = 5, FZ = D / 2, PL = 0.5, DW = 1.05, DH = 2.15;
  const WASH = '#F1EADB', WASHD = '#E2D8C4';
  // plinth
  v.boxMin(-W / 2 - 0.1, 0, -D / 2 - 0.1, W / 2 + 0.1, PL, FZ + 0.1, C.stone);
  v.boxMin(-W / 2 - 0.1, PL - 0.05, FZ + 0.05, W / 2 + 0.1, PL, FZ + 0.12, C.stoneL);
  for (let x = -W / 2 + 0.35; x < W / 2; x += 0.7) v.box(x, PL / 2, FZ + 0.105, 0.012, PL - 0.1, 0.008, C.stoneD);
  // walls (front skin with the door hole)
  v.boxMin(-W / 2, PL, -D / 2, W / 2, H, FZ - 0.25, WASH);
  v.boxMin(-W / 2, PL, FZ - 0.25, -DW / 2, H, FZ, WASH);
  v.boxMin(DW / 2, PL, FZ - 0.25, W / 2, H, FZ, WASH);
  v.boxMin(-DW / 2, PL + DH, FZ - 0.25, DW / 2, H, FZ, WASH);
  // damp band, whitewash patches, a patch of bare brick
  v.boxMin(-W / 2, PL, FZ, W / 2, PL + 0.22, FZ + 0.006, WASHD);
  for (let k = 0; k < 16; k++) { const x = -W / 2 + 0.3 + r() * (W - 0.6); if (Math.abs(x) < DW / 2 + 0.2) continue; v.box(x, PL + 0.3 + r() * 2.4, FZ + 0.004, 0.2 + r() * 0.5, 0.12 + r() * 0.3, 0.008, jitter(r() > 0.5 ? WASHD : '#F7F2E6', 0.02, k)); }
  {
    const bx = 2.95, by = 1.0;
    v.box(bx, by, FZ + 0.004, 0.5, 0.32, 0.01, '#D8CDB8');
    for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) v.box(bx - 0.15 + j * 0.24 + (k % 2) * 0.1, by - 0.09 + k * 0.09, FZ + 0.01, 0.18, 0.07, 0.01, jitter(C.brickL, 0.06, k * 3 + j));
  }
  // a maroon fascia band and gold rule under the eaves
  v.boxMin(-W / 2 - 0.04, H - 0.22, FZ, W / 2 + 0.04, H - 0.06, FZ + 0.05, C.maroon);
  v.boxMin(-W / 2 - 0.04, H - 0.25, FZ + 0.01, W / 2 + 0.04, H - 0.22, FZ + 0.055, C.gold);
  // roof
  const EZ = FZ + 0.55, RH = 1.25;
  tinRoofInto(v, W + 0.7, H, RH, EZ, r);
  for (const sx of [-1, 1]) {
    for (let y = H; y < H + RH; y += 0.18) { const dz = (1 - (y - H + 0.09) / RH) * EZ; v.box(sx * (W / 2 - 0.12), y + 0.09, 0, 0.24, 0.18, Math.max(0.05, dz * 2 - 0.12), WASH); }
    for (const side of [1, -1]) boxR(v, sx * (W / 2 + 0.36), H + RH / 2, side * EZ / 2, 0.06, 0.16, Math.hypot(EZ, RH) + 0.06, C.green, side * Math.atan2(RH, EZ), 0, 0);
  }
  v.box(0, H - 0.02, EZ - 0.04, W + 0.7, 0.08, 0.1, C.tinD); // gutter
  v.box(W / 2 + 0.22, (H + PL) / 2, FZ + 0.3, 0.08, H - PL, 0.08, C.tin);
  // door frame, lintel, two steps up to the door and a landing
  for (const sx of [-1, 1]) v.boxMin(sx * DW / 2 - (sx > 0 ? 0 : 0.12), PL, FZ - 0.25, sx * DW / 2 + (sx > 0 ? 0.12 : 0), PL + DH + 0.1, FZ + 0.06, C.woodD);
  v.boxMin(-DW / 2 - 0.22, PL + DH + 0.05, FZ - 0.25, DW / 2 + 0.22, PL + DH + 0.2, FZ + 0.08, C.green);
  v.boxMin(-DW / 2, PL, FZ - 0.25, DW / 2, PL + 0.02, FZ, C.woodDD);
  v.boxMin(-1.45, 0, FZ + 0.1, 1.45, PL, FZ + 0.62, C.stoneL); // landing
  v.boxMin(-1.0, 0, FZ + 0.62, 1.0, PL / 2, FZ + 0.98, C.stoneL); // first step
  v.boxMin(-1.45, PL - 0.03, FZ + 0.58, 1.45, PL, FZ + 0.63, C.stone);
  v.boxMin(-1.0, PL / 2 - 0.03, FZ + 0.94, 1.0, PL / 2, FZ + 0.99, C.stone);
  // windows: green frames, bars, open shutters, sills with a pot
  for (const sx of [-1, 1]) {
    const wx = sx * 2.05, WW = 1.15, WH = 1.25, WY = 1.35;
    v.boxMin(wx - WW / 2 - 0.08, WY - 0.1, FZ, wx + WW / 2 + 0.08, WY, FZ + 0.18, C.stoneL);
    for (const fx of [-1, 1]) v.box(wx + fx * (WW / 2 + 0.03), WY + WH / 2, FZ + 0.05, 0.08, WH, 0.1, C.green);
    v.box(wx, WY + WH + 0.04, FZ + 0.05, WW + 0.16, 0.09, 0.1, C.green);
    for (let k = 1; k < 6; k++) v.box(wx - WW / 2 + (k * WW) / 6, WY + WH / 2, FZ + 0.02, 0.022, WH, 0.022, C.iron);
    v.box(wx, WY + WH * 0.55, FZ + 0.02, WW, 0.025, 0.025, C.iron);
    for (const fx of [-1, 1]) {
      const shx = wx + fx * (WW / 2 + 0.33);
      v.box(shx, WY + WH / 2, FZ + 0.04, 0.5, WH, 0.05, C.green);
      for (let y = WY + 0.1; y < WY + WH - 0.05; y += 0.11) v.box(shx, y, FZ + 0.07, 0.42, 0.03, 0.02, C.greenD);
    }
    prism(v, wx + sx * 0.3, WY + 0.06, FZ + 0.1, 0.07, 0.055, 0.12, C.terra, 8);
    for (let k = 0; k < 5; k++) v.box(wx + sx * 0.3 + Math.cos(k * 1.3) * 0.05, WY + 0.16 + (k % 2) * 0.04, FZ + 0.1 + Math.sin(k * 1.3) * 0.04, 0.06, 0.06, 0.06, k % 2 ? C.leaf : C.leafL);
  }
  // the board over the door (frame; face is a canvas)
  const SW = 2.2, SH = 0.5, SY = PL + DH + 0.55;
  v.boxMin(-SW / 2 - 0.07, SY - SH / 2 - 0.07, FZ, SW / 2 + 0.07, SY + SH / 2 + 0.07, FZ + 0.08, C.green);
  // wall lamp: a tin shade on a bracket over the board's left
  const LX = -0.95, LY = PL + DH + 0.05;
  v.box(LX - 0.3, LY + 0.32, FZ + 0.05, 0.04, 0.04, 0.3, C.iron);
  v.box(LX - 0.3, LY + 0.2, FZ + 0.2, 0.03, 0.2, 0.03, C.iron);
  prism(v, LX - 0.3, LY + 0.08, FZ + 0.2, 0.05, 0.14, 0.08, C.green, 8);
  // sandal rack on the landing (big pairs on the top board, two small pairs below) and a few pairs on the step
  {
    const rx = 0.95, rz = FZ + 0.36, ry = PL;
    for (const fx of [-1, 1]) for (const fz of [-1, 1]) v.box(rx + fx * 0.36, ry + 0.14, rz + fz * 0.12, 0.04, 0.28, 0.04, C.woodD);
    v.box(rx, ry + 0.27, rz, 0.8, 0.025, 0.3, C.wood);
    v.box(rx, ry + 0.12, rz, 0.8, 0.025, 0.3, C.wood);
    sandalsInto(v, rx - 0.2, ry + 0.28, rz, 1.0, '#3A2E28', '#2A221E');
    sandalsInto(v, rx + 0.17, ry + 0.28, rz, 1.0, '#6E4A32', C.maroon);
    sandalsInto(v, rx - 0.18, ry + 0.13, rz, 0.62, '#E59AAE', '#F4E2A6');
    sandalsInto(v, rx + 0.14, ry + 0.13, rz, 0.62, '#6FA3D0', '#F2ECDF');
    sandalsInto(v, -0.55, PL / 2, FZ + 0.8, 1.0, '#4E4038', '#7A2A2A', 0.15);
    sandalsInto(v, -0.15, PL / 2, FZ + 0.82, 1.0, '#2E2A28', '#3E6FA8', -0.1);
  }
  // a chalk easel at the left of the steps
  const EX = -1.85, EZ2 = FZ + 0.85;
  stick(v, [EX - 0.32, 0, EZ2 + 0.12], [EX - 0.24, 1.35, EZ2 - 0.02], 0.045, C.woodD);
  stick(v, [EX + 0.32, 0, EZ2 + 0.12], [EX + 0.24, 1.35, EZ2 - 0.02], 0.045, C.woodD);
  stick(v, [EX, 0, EZ2 - 0.4], [EX, 1.3, EZ2 - 0.04], 0.04, C.woodD);
  boxR(v, EX, 0.92, EZ2 + 0.04, 0.66, 0.84, 0.03, C.woodD, -0.1, 0, 0);
  boxR(v, EX, 0.5, EZ2 + 0.12, 0.6, 0.03, 0.06, C.wood, -0.1, 0, 0);
  boxR(v, EX - 0.15, 0.53, EZ2 + 0.13, 0.06, 0.02, 0.02, C.white, -0.1, 0, 0.3);
  // a water-pot stand at the right: two lidded clay pots and a tin cup on a chain
  {
    const px = 2.35, pz = FZ + 0.85;
    for (const fx of [-1, 1]) for (const fz of [-1, 1]) v.box(px + fx * 0.42, 0.42, pz + fz * 0.2, 0.06, 0.84, 0.06, C.woodD);
    v.box(px, 0.84, pz, 1.0, 0.04, 0.5, C.wood);
    v.box(px, 1.5, pz - 0.2, 1.06, 0.05, 0.08, C.woodD);
    for (const fx of [-1, 1]) v.box(px + fx * 0.42, 1.18, pz - 0.2, 0.05, 0.64, 0.05, C.woodD);
    for (const fx of [-1, 1]) {
      const cx = px + fx * 0.22;
      prism(v, cx, 0.96, pz, 0.12, 0.14, 0.2, C.terra, 10);
      prism(v, cx, 1.08, pz, 0.15, 0.12, 0.06, C.terraL, 10);
      prism(v, cx, 1.14, pz, 0.08, 0.15, 0.04, C.terraD, 10);
      prism(v, cx, 1.18, pz, 0.12, 0.12, 0.02, C.terraL, 10);
      prism(v, cx, 1.2, pz, 0.02, 0.03, 0.03, C.terraD, 6);
    }
    prism(v, px, 0.89, pz + 0.17, 0.04, 0.035, 0.08, C.tinL, 8);
    stick(v, [px + 0.04, 0.9, pz + 0.17], [px + 0.2, 0.86, pz + 0.24], 0.01, C.tinD);
  }
  // a bicycle-free kerb: a low potted bush either side of the landing
  for (const sx of [-1, 1]) {
    prism(v, sx * 1.3, 0.62, FZ + 0.4, 0.11, 0.09, 0.22, C.terra, 8);
    for (let k = 0; k < 7; k++) v.box(sx * 1.3 + Math.cos(k * 0.9) * 0.08, 0.8 + (k % 3) * 0.06, FZ + 0.4 + Math.sin(k * 0.9) * 0.07, 0.1, 0.09, 0.1, k % 2 ? C.leafD : C.leaf);
  }
  root.add(v.mesh());

  // light: door reveal, window backs, the lamp bulb
  const g = glow('#3A3028', '#FFD08A');
  const gv = new VoxelBuilder();
  for (const sx of [-1, 1]) gv.box(sx * 2.05, 1.35 + 0.625, FZ - 0.01, 1.12, 1.22, 0.01, '#FFFFFF');
  gv.box(LX - 0.3, LY + 0.03, FZ + 0.2, 0.07, 0.06, 0.07, '#FFFFFF');
  root.add(glowMesh(gv, g));
  const dg = glow('#2E261E', '#FFCC80');
  const dgv = new VoxelBuilder();
  dgv.box(0, PL + DH / 2, FZ - 0.24, DW, DH, 0.01, '#FFFFFF');
  root.add(glowMesh(dgv, dg));
  const lampHalo = halo(1.0, 1.0);
  lampHalo.position.set(LX - 0.3, LY, FZ + 0.32);
  root.add(lampHalo);
  const pool = halo(2.2, 1.6, true);
  pool.position.set(0, PL + 0.02, FZ + 0.6);
  root.add(pool);

  // the green door, hinged on the left jamb, opens inward
  const hinge = new THREE.Group();
  hinge.position.set(-DW / 2 + 0.01, PL, FZ - 0.08);
  root.add(hinge);
  const lv = new VoxelBuilder();
  const LW = DW - 0.02;
  lv.box(LW / 2, DH / 2, 0, LW, DH, 0.06, C.green);
  for (const ex of [-1, 1]) lv.box(LW / 2 + ex * (LW / 2 - 0.05), DH / 2, 0.035, 0.1, DH, 0.02, C.greenD);
  for (const y of [0.06, DH * 0.5, DH - 0.06]) lv.box(LW / 2, y, 0.035, LW, 0.1, 0.02, C.greenD);
  for (const y of [DH * 0.27, DH * 0.75]) { lv.box(LW / 2, y, 0.04, LW - 0.26, DH * 0.36, 0.02, '#5E8A68'); lv.box(LW / 2, y, 0.05, LW - 0.38, DH * 0.26, 0.01, C.green); }
  lv.box(LW - 0.12, DH * 0.48, 0.08, 0.05, 0.05, 0.05, C.brass);
  lv.box(LW - 0.12, DH * 0.42, 0.07, 0.03, 0.06, 0.01, C.soot);
  lv.box(LW / 2, DH * 0.62, 0.05, 0.24, 0.05, 0.01, C.brassL); // a small brass name strip
  hinge.add(lv.mesh());

  // canvases: the board over the door and the chalk easel
  const board = canvasTex(1024, 232);
  const boardM = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), basic('#ffffff', { map: board.tex }));
  boardM.position.set(0, SY, FZ + 0.085);
  root.add(boardM);
  const slate = canvasTex(320, 400);
  const slateM = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.72), basic('#ffffff', { map: slate.tex }));
  slateM.position.set(EX, 0.94, EZ2 + 0.058);
  slateM.rotation.x = -0.1;
  root.add(slateM);
  const tt = textOf(title);
  const paint = () => {
    drawBoard(board.cv, tt, { bg: '#F3E6C6', fg: '#2F5A3E', rule: C.goldD, sprigs: false });
    const g2 = slate.g;
    g2.fillStyle = C.chalk; g2.fillRect(0, 0, 320, 400);
    g2.strokeStyle = 'rgba(255,255,255,0.08)'; g2.lineWidth = 18;
    for (let k = 0; k < 4; k++) { g2.beginPath(); g2.moveTo(20, 80 + k * 90); g2.lineTo(300, 60 + k * 95); g2.stroke(); }
    g2.fillStyle = '#F4F1EA'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
    chalk.forEach((line, k) => { g2.font = `${k ? 600 : 700} ${k ? 34 : 40}px ${FONT_MY}`; g2.fillText(line, 160, 110 + k * 90, 290); });
    g2.strokeStyle = '#E8C978'; g2.lineWidth = 4; g2.beginPath(); g2.moveTo(70, 300); g2.lineTo(250, 300); g2.stroke();
    g2.fillStyle = '#E8C978'; g2.font = `600 26px ${FONT_SERIF}`; g2.fillText(tt.en || '', 160, 345, 290);
    board.tex.needsUpdate = true; slate.tex.needsUpdate = true;
  };
  paint();
  fontsReady().then(paint);
  const sh = shadowUnder(root, W * 0.6, D * 0.6, 0, 0.3, 0.38);
  let openT = 0, litT = 0;
  function setOpen(t) { openT = clamp01(t); hinge.rotation.y = ease(openT) * 1.5; dg.set((0.1 + litT * 0.9) * (0.15 + openT * 0.85)); setHalo(pool, openT * litT * 0.7); }
  function setLit(t) { litT = typeof t === 'boolean' ? (t ? 1 : 0) : clamp01(t); g.set(0.12 + litT * 0.88); setHalo(lampHalo, litT * 0.75); setOpen(openT); }
  setLit(lit);
  setOpen(open);
  root.userData.footprint = { w: W + 0.4, d: D + 1.2 };
  return {
    root, door: new THREE.Vector3(0, 0, FZ + 1.3),
    setOpen, setLit,
    update() {},
    dispose() { g.mat.dispose(); dg.mat.dispose(); lampHalo.material.dispose(); pool.material.dispose(); board.tex.dispose(); slate.tex.dispose(); boardM.material.dispose(); slateM.material.dispose(); sh.geometry.dispose(); disposeTree(root); },
  };
}

/**
 * The weaving shed (closed shell): a long plank shed on a brick footing under a shingled roof; one plank door with a
 * painted shuttle (the loomshed door) at the west end, five shutters propped open on the street side showing warm
 * light and flat loom-and-weaver cut-outs whose beaters swing (setWeaving; one instanced draw call), skeins of dyed
 * thread drying on a pole, a bobbin basket and a bench. clack: the sound anchor at the door.
 */
export function weavingShed({ lit = 1, weaving = true, title = { my: 'ယက်ကန်းရုံ', en: 'Weaving Shed' } } = {}) {
  const root = new THREE.Group();
  root.name = 'weavingShed';
  const r = rand(53);
  const v = new VoxelBuilder();
  const W = 12, H = 3.2, D = 4, FZ = D / 2, FT = 0.25;
  const DX = -4.9, DW = 1.1, DH = 2.15;
  const WX = [-2.95, -1.05, 0.85, 2.75, 4.65], WW = 1.2, WY = 1.15, WH = 0.85;
  // footing
  v.boxMin(-W / 2 - 0.06, 0, -D / 2 - 0.06, W / 2 + 0.06, FT, FZ + 0.08, C.brickD);
  for (let x = -W / 2 + 0.25; x < W / 2; x += 0.5) v.box(x, FT / 2, FZ + 0.085, 0.012, FT - 0.06, 0.006, C.mortar);
  // the shed body, then vertical planks on the front (skipping the door and the window holes)
  v.boxMin(-W / 2, FT, -D / 2, W / 2, H, FZ - 0.45, '#7A5236');
  // inner lining behind the plank skin: solid between the holes, reveals round them
  v.boxMin(-W / 2, FT, FZ - 0.45, W / 2, WY, FZ - 0.12, '#6A4630');
  v.boxMin(-W / 2, WY + WH, FZ - 0.45, W / 2, H, FZ - 0.12, '#6A4630');
  let lx = -W / 2;
  for (const wx of [DX, ...WX]) { const hw = wx === DX ? DW / 2 : WW / 2; v.boxMin(lx, WY, FZ - 0.45, wx - hw, WY + WH, FZ - 0.12, '#6A4630'); lx = wx + hw; }
  v.boxMin(lx, WY, FZ - 0.45, W / 2, WY + WH, FZ - 0.12, '#6A4630');
  const inHole = (x0, x1, y0, y1) => (x1 > DX - DW / 2 && x0 < DX + DW / 2 && y0 < FT + DH) || WX.some((wx) => x1 > wx - WW / 2 && x0 < wx + WW / 2 && y1 > WY && y0 < WY + WH);
  const PW = 0.2;
  for (let x = -W / 2, k = 0; x < W / 2 - 0.001; x += PW, k++) {
    const col = jitter(k % 3 === 0 ? C.woodD : k % 3 === 1 ? C.wood : '#A87A50', 0.06, k);
    // a plank is split round the holes: walk down it in 0.05 m steps of "solid" spans
    const ys = [FT, WY, WY + WH, FT + DH, H];
    const cuts = [...new Set(ys)].sort((a, b) => a - b);
    for (let i = 0; i < cuts.length - 1; i++) {
      const y0 = cuts[i], y1 = cuts[i + 1];
      if (!inHole(x + 0.01, x + PW - 0.01, y0 + 0.001, y1 - 0.001)) v.boxMin(x + 0.008, y0, FZ - 0.12, x + PW - 0.008, y1, FZ, col);
    }
  }
  // battens and a cap rail
  for (const by of [FT + 0.35, H - 0.3]) for (let x = -W / 2; x < W / 2; x += 2) { const x1 = Math.min(W / 2, x + 2); if (!inHole(x, x1, by - 0.04, by + 0.04)) v.boxMin(x, by - 0.04, FZ, x1, by + 0.04, FZ + 0.04, C.woodDD); }
  v.boxMin(-W / 2 - 0.05, H - 0.1, FZ - 0.02, W / 2 + 0.05, H, FZ + 0.06, C.woodDD);
  for (const sx of [-1, 1]) v.boxMin(sx * W / 2 - 0.08, FT, FZ - 0.08, sx * W / 2 + 0.08, H, FZ + 0.08, C.woodDD); // corner posts
  // shingled roof (dark teak rows with a few mossy shingles)
  const EZ = FZ + 0.6, RH = 1.1, sl = Math.hypot(EZ, RH), ang = Math.atan2(RH, EZ);
  for (const side of [1, -1]) {
    boxR(v, 0, H + RH / 2, side * EZ / 2, W + 0.6, 0.08, sl, C.woodDD, side * ang, 0, 0);
    const nC = 9;
    for (let k = 0; k < nC; k++) {
      const f = (k + 0.5) / nC, zz = side * EZ * f, yy = H + RH * (1 - f) + 0.07;
      boxR(v, 0, yy, zz, W + 0.56, 0.05, sl / nC + 0.03, jitter(k % 2 ? '#6E4A32' : '#7E5A3C', 0.04, k + side * 9), side * ang, 0, 0);
      if (side > 0) for (let x = -W / 2 + (k % 2 ? 0.15 : 0.3); x < W / 2 + 0.2; x += 0.3) {
        boxR(v, x, yy + 0.03, zz, 0.02, 0.012, sl / nC, '#4E3424', side * ang, 0, 0);
        if (r() < 0.05) boxR(v, x + 0.15, yy + 0.035, zz, 0.26, 0.02, sl / nC - 0.04, jitter('#7E8E52', 0.1, x * 5), side * ang, 0, 0);
      }
    }
  }
  v.box(0, H + RH + 0.05, 0, W + 0.66, 0.12, 0.22, '#4E3424');
  for (const sx of [-1, 1]) {
    for (let y = H; y < H + RH; y += 0.16) { const dz = (1 - (y - H + 0.08) / RH) * EZ; v.box(sx * (W / 2 - 0.1), y + 0.08, 0, 0.2, 0.16, Math.max(0.05, dz * 2 - 0.1), '#7A5236'); }
    for (const side of [1, -1]) boxR(v, sx * (W / 2 + 0.3), H + RH / 2, side * EZ / 2, 0.06, 0.16, sl + 0.06, C.maroon, side * ang, 0, 0);
  }
  // the door: frame, plank leaf (fixed shut; the room behind is its own scene), the painted shuttle, strap hinges
  for (const sx of [-1, 1]) v.boxMin(DX + sx * DW / 2 - 0.07, FT, FZ - 0.12, DX + sx * DW / 2 + 0.07, FT + DH + 0.08, FZ + 0.06, C.woodDD);
  v.boxMin(DX - DW / 2 - 0.15, FT + DH, FZ - 0.12, DX + DW / 2 + 0.15, FT + DH + 0.14, FZ + 0.08, C.woodDD);
  for (let k = 0; k < 5; k++) v.box(DX - DW / 2 + (k + 0.5) * (DW / 5), FT + DH / 2, FZ - 0.08, DW / 5 - 0.01, DH, 0.05, jitter('#8A5E3C', 0.07, k + 40));
  for (const y of [FT + 0.35, FT + DH - 0.35]) { v.box(DX, y, FZ - 0.045, DW - 0.08, 0.1, 0.02, '#6A4630'); v.box(DX - DW / 2 + 0.2, y, FZ - 0.03, 0.36, 0.05, 0.015, C.iron); }
  {
    // the painted shuttle: a gold boat shape with maroon tips and a cream thread
    const sy = FT + DH * 0.62, sz = FZ - 0.025;
    v.box(DX, sy, sz, 0.56, 0.12, 0.012, C.gold);
    for (const sx of [-1, 1]) { v.box(DX + sx * 0.32, sy, sz, 0.1, 0.08, 0.012, C.goldD); v.box(DX + sx * 0.39, sy, sz, 0.06, 0.04, 0.012, C.maroon); }
    v.box(DX, sy, sz + 0.004, 0.3, 0.05, 0.012, C.maroonD);
    v.box(DX, sy - 0.01, sz + 0.008, 0.22, 0.03, 0.012, C.cream);
    for (let k = 0; k < 6; k++) v.box(DX + 0.12 + k * 0.08, sy - 0.03 - k * 0.025, sz, 0.08, 0.012, 0.012, C.cream);
  }
  v.box(DX + DW / 2 - 0.16, FT + DH * 0.48, FZ - 0.01, 0.05, 0.12, 0.05, C.iron);
  v.boxMin(DX - DW / 2 - 0.2, 0, FZ + 0.08, DX + DW / 2 + 0.2, FT, FZ + 0.55, C.stoneL); // door step
  // windows: frames, propped top-hung shutters, sills
  for (const wx of WX) {
    for (const sx of [-1, 1]) v.boxMin(wx + sx * WW / 2 - 0.05, WY - 0.02, FZ - 0.12, wx + sx * WW / 2 + 0.05, WY + WH + 0.04, FZ + 0.04, C.woodDD);
    v.boxMin(wx - WW / 2 - 0.08, WY - 0.08, FZ - 0.12, wx + WW / 2 + 0.08, WY, FZ + 0.14, C.woodD);
    const sa = 1.05; // shutter swung out about its top edge
    const cy = WY + WH + 0.02 - Math.cos(sa) * WH / 2, cz = FZ + 0.03 + Math.sin(sa) * WH / 2;
    boxR(v, wx, cy, cz, WW + 0.04, WH, 0.05, '#8A5E3C', sa, 0, 0);
    for (let k = 0; k < 4; k++) { const f = -0.38 + k * 0.25; boxR(v, wx, cy + Math.cos(sa) * f * WH, cz - Math.sin(sa) * f * WH + 0.03, WW, 0.05, 0.02, '#6A4630', sa, 0, 0); }
    stick(v, [wx + WW / 2 - 0.12, WY + 0.02, FZ + 0.08], [wx + WW / 2 - 0.12, WY + WH + 0.02 - Math.cos(sa) * WH * 0.95, FZ + 0.03 + Math.sin(sa) * WH * 0.95], 0.03, C.bamboo);
  }
  // skeins of dyed thread drying on a bamboo pole at the east end
  {
    const x0 = W / 2 - 1.35, x1 = W / 2 + 0.85, pz = FZ + 0.9, py = 1.75;
    for (const x of [x0, x1]) { v.box(x, py / 2, pz, 0.08, py, 0.08, C.woodD); v.box(x, 0.04, pz, 0.16, 0.08, 0.16, C.stone); }
    stick(v, [x0 - 0.1, py + 0.02, pz], [x1 + 0.1, py + 0.02, pz], 0.05, C.bamboo);
    const dyes = [C.maroon, C.gold, '#3B4F86', C.green, '#C8433A', C.mustard, '#6E3A6E'];
    for (let k = 0; k < 7; k++) {
      const x = x0 + 0.22 + k * 0.27, col = dyes[k];
      v.box(x, py - 0.32, pz, 0.12, 0.6, 0.06, col);
      v.box(x, py - 0.32, pz + 0.035, 0.03, 0.56, 0.01, shade(col, 0.82));
      v.box(x, py - 0.64, pz, 0.08, 0.06, 0.05, shade(col, 0.85));
      v.box(x, py - 0.05, pz, 0.14, 0.06, 0.08, shade(col, 1.12));
    }
  }
  // a bench under the middle windows, a bobbin basket by the door, a stack of warp beams
  for (const fx of [-1, 1]) v.box(-0.1 + fx * 0.75, 0.2, FZ + 0.45, 0.08, 0.4, 0.3, C.woodD);
  v.box(-0.1, 0.42, FZ + 0.45, 1.7, 0.05, 0.38, C.wood);
  prism(v, DX + 0.95, 0.14, FZ + 0.55, 0.2, 0.16, 0.28, C.bambooD, 10);
  prism(v, DX + 0.95, 0.27, FZ + 0.55, 0.205, 0.205, 0.03, C.bamboo, 10);
  for (let k = 0; k < 6; k++) prism(v, DX + 0.88 + (k % 3) * 0.07, 0.32, FZ + 0.5 + Math.floor(k / 3) * 0.09, 0.03, 0.03, 0.1, [C.maroon, C.gold, '#3B4F86'][k % 3], 6, 0, Math.PI / 2);
  for (let k = 0; k < 3; k++) prism(v, 1.9, 0.08 + k * 0.13, FZ + 0.5, 0.065, 0.065, 1.3, jitter(C.woodL, 0.06, k), 8, 0, 0, Math.PI / 2);
  root.add(v.mesh());

  // light behind the windows, loom cut-outs (one flat dark mesh), swinging beaters (one instanced mesh)
  const g = glow('#3A2E24', '#FFC678');
  const gv = new VoxelBuilder();
  for (const wx of WX) gv.box(wx, WY + WH / 2, FZ - 0.44, WW, WH, 0.01, '#FFFFFF');
  root.add(glowMesh(gv, g));
  const SIL = '#3A2A20';
  const sv = new VoxelBuilder();
  WX.forEach((wx, i) => {
    const z = FZ - 0.36, f = i % 2 ? -1 : 1, y0 = WY - 0.02;
    sv.box(wx + f * 0.42, y0 + 0.35, z, 0.05, 0.75, 0.01, SIL); // back post
    sv.box(wx - f * 0.1, y0 + 0.35, z, 0.05, 0.75, 0.01, SIL); // front post
    sv.box(wx + f * 0.16, y0 + 0.72, z, 0.6, 0.05, 0.01, SIL); // top rail
    sv.box(wx + f * 0.16, y0 + 0.22, z, 0.58, 0.035, 0.01, SIL); // warp line
    sv.box(wx + f * 0.16, y0 + 0.3, z, 0.56, 0.02, 0.01, '#5A4636');
    // the weaver: head and shoulders on the bench side
    sv.box(wx - f * 0.36, y0 + 0.52, z, 0.14, 0.14, 0.01, SIL);
    sv.box(wx - f * 0.36, y0 + 0.28, z, 0.24, 0.3, 0.01, SIL);
    sv.box(wx - f * 0.2, y0 + 0.32, z, 0.18, 0.05, 0.01, SIL); // arm to the beater
  });
  const silM = new THREE.Mesh(sv.geometry(), new THREE.MeshBasicMaterial({ color: '#ffffff', vertexColors: true }));
  silM.raycast = () => {};
  root.add(silM);
  const beaters = new THREE.InstancedMesh(UNIT, basic(SIL), WX.length);
  beaters.userData.sharedGeo = true;
  beaters.raycast = () => {};
  root.add(beaters);
  const sign = canvasTex(512, 160);
  const signM = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.375), basic('#ffffff', { map: sign.tex }));
  signM.position.set(DX, FT + DH + 0.38, FZ + 0.01);
  root.add(signM);
  const sb = new VoxelBuilder();
  sb.box(DX, FT + DH + 0.38, FZ - 0.02, 1.3, 0.46, 0.05, C.woodDD);
  root.add(sb.mesh({ px: 1.2 }));
  const tt = textOf(title);
  const paint = () => { drawBoard(sign.cv, tt, { sprigs: false }); sign.tex.needsUpdate = true; };
  paint();
  fontsReady().then(paint);
  const sh = shadowUnder(root, W * 0.56, D * 0.62, 0, 0.3, 0.38);
  let litT = 0, weave = !!weaving;
  function placeBeaters(t) {
    WX.forEach((wx, i) => {
      const f = i % 2 ? -1 : 1, ph = t * 2.4 + i * 1.7;
      const swing = weave ? Math.max(0, Math.sin(ph)) ** 3 * 0.12 : 0;
      _o.position.set(wx - f * (0.02 + swing), WY + 0.36, FZ - 0.355);
      _o.rotation.set(0, 0, f * swing * 0.8);
      _o.scale.set(0.035, 0.5, 0.01);
      _o.updateMatrix();
      beaters.setMatrixAt(i, _o.matrix);
    });
    beaters.instanceMatrix.needsUpdate = true;
  }
  function setLit(t) { litT = typeof t === 'boolean' ? (t ? 1 : 0) : clamp01(t); g.set(0.15 + litT * 0.85); }
  setLit(lit);
  placeBeaters(0);
  root.userData.footprint = { w: W + 0.4, d: D + 1.6 };
  return {
    root,
    door: new THREE.Vector3(DX, 0, FZ + 0.9),
    clack: new THREE.Vector3(DX, 1.2, FZ),
    setLit, setWeaving(b) { weave = !!b; },
    update(dt, t) { placeBeaters(t); },
    dispose() { g.mat.dispose(); silM.material.dispose(); sign.tex.dispose(); signM.material.dispose(); sh.geometry.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// small things: tiffin, order book, paper lunch box, practice sheet, music stand, covered bundle
// ---------------------------------------------------------------------------------------------
const STEEL = '#C3C9CD', STEELD = '#9AA2A8', STEELL = '#E2E6E8';
/**
 * A three-tier steel tiffin carrier (0.18 x 0.32 x 0.18) with side bars and a carry handle. setOpen(n): 0 shut,
 * 1 lid off (rice showing), 2 the rice tier set beside it (curry showing), 3 the curry tier too (greens showing).
 */
export function tiffin({ open = 0 } = {}) {
  const root = new THREE.Group();
  root.name = 'tiffin';
  const TR = 0.085, TH = 0.075;
  const foods = ['#F4F0E4', '#C9772E', '#7EA552'];
  const tier = (k) => {
    const v = new VoxelBuilder();
    prism(v, 0, TH / 2, 0, TR, TR * 0.96, TH, k % 2 ? STEEL : STEELL, 12);
    prism(v, 0, TH - 0.006, 0, TR + 0.006, TR + 0.006, 0.012, STEELD, 12);
    prism(v, 0, 0.01, 0, TR * 0.9, TR * 0.9, 0.02, STEELD, 12);
    prism(v, 0, TH - 0.016, 0, TR * 0.9, TR * 0.9, 0.006, foods[k], 12);
    if (k === 1) for (let j = 0; j < 4; j++) v.box(Math.cos(j * 1.6) * 0.04, TH - 0.011, Math.sin(j * 1.6) * 0.04, 0.03, 0.012, 0.025, '#8E4A22');
    if (k === 2) for (let j = 0; j < 5; j++) v.box(Math.cos(j * 1.3) * 0.045, TH - 0.01, Math.sin(j * 1.3) * 0.045, 0.035, 0.012, 0.02, j % 2 ? C.leafL : C.leaf, j);
    if (k === 0) for (let j = 0; j < 6; j++) v.box(Math.cos(j) * 0.05, TH - 0.011, Math.sin(j) * 0.05, 0.015, 0.008, 0.015, '#FFFFFF');
    for (const sx of [-1, 1]) v.box(sx * (TR + 0.008), TH / 2, 0, 0.012, 0.03, 0.03, STEELD); // lugs
    v.box(0, TH * 0.5, TR * 0.97, 0.05, 0.012, 0.004, STEELL); // shine
    const m = v.mesh({ px: 1.2 });
    return m;
  };
  // tiers bottom (greens) to top (rice), then the lid with the side bars and handle
  const parts = [2, 1, 0].map((food, i) => { const m = tier(food); m.position.y = i * TH; root.add(m); return m; });
  const lidG = new THREE.Group();
  root.add(lidG);
  const lv = new VoxelBuilder();
  prism(lv, 0, 0.012, 0, TR + 0.004, TR + 0.004, 0.024, STEELL, 12);
  prism(lv, 0, 0.03, 0, TR * 0.6, TR + 0.004, 0.02, STEEL, 12);
  prism(lv, 0, 0.045, 0, 0.02, 0.025, 0.014, STEELD, 8);
  for (const sx of [-1, 1]) {
    lv.box(sx * (TR + 0.02), -0.1, 0, 0.012, 0.23, 0.022, STEELD); // side bars down to the bottom tier
    lv.box(sx * (TR + 0.02), -0.215, 0, 0.022, 0.012, 0.03, STEELD);
    lv.box(sx * (TR + 0.012), 0.06, 0, 0.012, 0.06, 0.016, STEELD);
  }
  stick(lv, [-TR - 0.012, 0.09, 0], [-0.04, 0.15, 0], 0.012, STEELD);
  stick(lv, [TR + 0.012, 0.09, 0], [0.04, 0.15, 0], 0.012, STEELD);
  lv.box(0, 0.152, 0, 0.09, 0.016, 0.02, C.maroon); // a wrapped grip
  lidG.add(lv.mesh({ px: 1.2 }));
  const sh = shadowUnder(root, 0.13, 0.13, 0, 0, 0.42);
  function setOpen(n) {
    n = Math.max(0, Math.min(3, Math.round(n)));
    lidG.position.set(n >= 1 ? -0.26 : 0, 3 * TH, n >= 1 ? 0.03 : 0); // off, it stands beside on its bars' feet
    parts[2].position.set(n >= 2 ? 0.22 : 0, n >= 2 ? 0 : 2 * TH, n >= 2 ? 0.04 : 0);
    parts[1].position.set(n >= 3 ? 0.2 : 0, n >= 3 ? 0 : TH, n >= 3 ? -0.18 : 0);
  }
  setOpen(open);
  return { root, setOpen, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

/** The noodle shop's order book (0.25 x 0.03 x 0.18 open): ruled pages with pencilled orders, a pencil, and an eraser
 * on a string tied to the spine. */
export function orderBook() {
  const root = new THREE.Group();
  root.name = 'orderBook';
  const v = new VoxelBuilder();
  v.box(0, 0.004, 0, 0.26, 0.008, 0.185, C.maroonD); // cover underneath
  for (const sx of [-1, 1]) {
    boxR(v, sx * 0.064, 0.016, 0, 0.122, 0.016, 0.175, sx < 0 ? '#F3EAD3' : C.paper, 0, 0, sx * -0.04);
    for (let k = 0; k < 9; k++) v.box(sx * 0.064, 0.026, -0.07 + k * 0.018, 0.11, 0.002, 0.002, '#B9C7D4');
    v.box(sx * 0.064 - 0.045, 0.026, 0, 0.002, 0.002, 0.17, '#D49A9A');
    for (let k = 0; k < 6; k++) v.box(sx * 0.064 + 0.005 - (k % 3) * 0.008, 0.027, -0.061 + k * 0.018, 0.06 + ((k * 7) % 4) * 0.008, 0.002, 0.005, '#6E6A66');
    for (let k = 0; k < 3; k++) v.box(sx * 0.064 + 0.045, 0.027, -0.061 + k * 0.036, 0.012, 0.002, 0.005, sx < 0 ? '#6E6A66' : C.maroon); // ticks
  }
  v.box(0, 0.02, 0, 0.008, 0.012, 0.18, C.maroon); // spine gutter
  // the pencil, the string and the eraser
  const px = 0.05;
  prism(v, px, 0.03, 0.02, 0.006, 0.006, 0.16, C.mustard, 6, 0.5, Math.PI / 2, 0);
  boxR(v, px + Math.sin(0.5) * 0.085, 0.03, 0.02 + Math.cos(0.5) * 0.085, 0.006, 0.006, 0.014, '#E8C9A0', 0, 0.5, 0);
  stick(v, [0, 0.022, -0.09], [-0.06, 0.004, -0.13], 0.003, C.twineD);
  stick(v, [-0.06, 0.004, -0.13], [-0.13, 0.004, -0.11], 0.003, C.twineD);
  v.box(-0.15, 0.008, -0.105, 0.04, 0.014, 0.022, '#E79AA6');
  v.box(-0.15, 0.016, -0.105, 0.04, 0.002, 0.022, '#F0B6BE');
  root.add(v.mesh({ px: 1.0 }));
  return { root, dispose() { disposeTree(root); } };
}

const WAX = '#EFE5C6', WAXD = '#DCCFA8', WAXL = '#F8F1DC';
/** One waxed-paper lunch box into v at (x, y, z), turn ry; f = 0 flat sheet .. 1 folded shut. */
function paperBoxInto(v, x, y, z, f = 1, ry = 0, seed = 0) {
  const W = 0.16, Dd = 0.12, Hh = 0.08;
  const a = ease(f) * Math.PI / 2; // wall fold angle (0 = flat, pi/2 = up)
  const cs = Math.cos(ry), sn = Math.sin(ry);
  const P = (lx, ly, lz) => [x + lx * cs + lz * sn, y + ly, z - lx * sn + lz * cs];
  const put = (lx, ly, lz, w, h, d, col, rx = 0, rz = 0) => { const [px, py, pz] = P(lx, ly, lz); boxR(v, px, py, pz, w, h, d, col, rx, ry, rz, 'YXZ'); };
  put(0, 0.002, 0, W, 0.004, Dd, jitter(WAX, 0.03, seed));
  // front/back walls hinge on the long edges, the side walls on the short edges
  for (const s of [-1, 1]) {
    put(0, Math.sin(a) * Hh / 2 + 0.002, s * (Dd / 2 + Math.cos(a) * Hh / 2), W, 0.004, Hh, s > 0 ? WAXL : WAXD, s * a);
    put(s * (W / 2 + Math.cos(a) * Hh / 2), Math.sin(a) * Hh / 2 + 0.002, 0, Hh, 0.004, Dd, WAX, 0, -s * a);
  }
  if (f > 0.85) {
    // the folded lid flaps and a twine tie
    const t = (f - 0.85) / 0.15;
    put(0, Hh + 0.004, -Dd / 4, W, 0.004, Dd / 2 * t, WAXL);
    put(0, Hh + 0.008, Dd / 4, W, 0.004, Dd / 2 * t, WAXD);
    put(0, Hh + 0.012, 0, 0.012, 0.004, Dd + 0.01, C.twineD);
    put(0, Hh / 2 + 0.004, Dd / 2 + 0.004, 0.012, Hh, 0.004, C.twineD);
    put(0.03, Hh + 0.016, 0.0, 0.02, 0.006, 0.01, C.twineD, 0, 0.6);
  } else {
    // the creases on the open sheet
    for (const s of [-1, 1]) put(s * W / 2, 0.005, 0, 0.003, 0.002, Dd, WAXD);
  }
}

/** A folded waxed-paper lunch box (0.16 x 0.08 x 0.12). setFolded(0..1): 0 = the flat sheet, 1 = folded and tied. */
export function paperBox({ folded = 1, open = false } = {}) {
  const root = new THREE.Group();
  root.name = 'paperBox';
  let mesh = null;
  function setFolded(f) {
    freeMesh(mesh);
    const v = new VoxelBuilder();
    paperBoxInto(v, 0, 0, 0, clamp01(f), 0, 3);
    mesh = v.mesh({ px: 1.0 });
    root.add(mesh);
  }
  const sh = shadowUnder(root, 0.12, 0.1, 0, 0, 0.35);
  const fold0 = setFolded;
  // a flat net lies on the ground: no blob shadow over it
  const setF = (f) => { fold0(f); sh.visible = clamp01(f) > 0.35; };
  setF(open ? 0 : folded);
  return { root, setFolded: setF, dispose() { sh.geometry.dispose(); freeMesh(mesh); disposeTree(root); } };
}

/** A tower of n folded lunch boxes, a little askew, one draw call (the box workshop and the class steps). */
export function paperBoxTower(n = 6, { seed = 5 } = {}) {
  const root = new THREE.Group();
  root.name = 'paperBoxTower';
  const r = rand(seed);
  const v = new VoxelBuilder();
  for (let i = 0; i < n; i++) paperBoxInto(v, (r() - 0.5) * 0.02, i * 0.093, (r() - 0.5) * 0.02, 1, (r() - 0.5) * 0.18 + (i % 2) * 0.05, i + seed);
  root.add(v.mesh({ px: 1.0 }));
  const sh = shadowUnder(root, 0.13, 0.11, 0, 0, 0.4);
  return { root, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

/**
 * A ruled practice sheet (0.4 x 0.3) pinned to a wall (back at z = 0): a heading, two name rows, ten tick boxes each.
 * setTicks(a, b) ticks the first a / b boxes (default seven in row one, none in row two). setNames([a, b]).
 */
export function practiceSheet({ ticks = [7, 0], names = ['ကိုအာကာ', 'မမြတ်'], title = { my: 'လေ့ကျင့်ခန်း စာရွက်', en: 'Practice sheet' } } = {}) {
  const root = new THREE.Group();
  root.name = 'practiceSheet';
  const W = 0.4, H = 0.3;
  const v = new VoxelBuilder();
  for (const [x, y] of [[-W / 2 + 0.025, H / 2 - 0.025], [W / 2 - 0.025, H / 2 - 0.025]]) { prism(v, x, y, 0.014, 0.012, 0.012, 0.012, C.brass, 8, 0, Math.PI / 2); }
  v.box(W / 2 - 0.03, -H / 2 + 0.025, 0.012, 0.05, 0.05, 0.012, '#E6DCC2'); // the lifted corner
  root.add(v.mesh({ px: 1.0 }));
  const { g, tex } = canvasTex(512, 384);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W, H), basic('#ffffff', { map: tex }));
  face.position.z = 0.006;
  root.add(face);
  let tk = ticks.slice(), nm = names.slice();
  const tt = textOf(title);
  const draw = () => {
    g.fillStyle = '#F7F1E1'; g.fillRect(0, 0, 512, 384);
    g.strokeStyle = 'rgba(80,110,150,0.25)'; g.lineWidth = 2;
    for (let y = 70; y < 384; y += 26) { g.beginPath(); g.moveTo(14, y); g.lineTo(498, y); g.stroke(); }
    g.strokeStyle = 'rgba(180,70,70,0.35)'; g.beginPath(); g.moveTo(40, 0); g.lineTo(40, 384); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = C.maroon; g.font = `700 36px ${FONT_MY}`; g.fillText(tt.my, 256, 34, 470);
    g.fillStyle = '#8A6A4A'; g.font = `italic 16px ${FONT_SERIF}`; g.fillText(tt.en, 256, 64, 470);
    for (let row = 0; row < 2; row++) {
      const y = 140 + row * 120;
      g.textAlign = 'left'; g.fillStyle = C.ink; g.font = `600 26px ${FONT_MY}`; g.fillText(nm[row] || '', 50, y - 34, 300);
      for (let b = 0; b < 10; b++) {
        const x = 52 + b * 44;
        g.strokeStyle = '#5A4A3C'; g.lineWidth = 3; g.strokeRect(x, y - 8, 32, 32);
        if (b < (tk[row] || 0)) {
          g.strokeStyle = C.maroon; g.lineWidth = 5; g.beginPath();
          g.moveTo(x + 5, y + 8 + ((b * 3) % 4)); g.lineTo(x + 13, y + 18); g.lineTo(x + 30, y - 6 + ((b * 5) % 5)); g.stroke();
        }
      }
    }
    tex.needsUpdate = true;
  };
  draw();
  fontsReady().then(draw);
  return {
    root,
    setTicks(a, b) { tk = [a | 0, b | 0]; draw(); },
    setNames(n) { nm = n.slice(); draw(); },
    dispose() { tex.dispose(); face.material.dispose(); disposeTree(root); },
  };
}

/** A wooden music stand (0.5 x 1.2) on three feet with an open songbook (canvas). */
export function musicStand({ book = { my: 'သီချင်းစာအုပ်', en: 'Songbook' } } = {}) {
  const root = new THREE.Group();
  root.name = 'musicStand';
  const v = new VoxelBuilder();
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + Math.PI / 2; stick(v, [0, 0.32, 0], [Math.cos(a) * 0.28, 0.0, Math.sin(a) * 0.28], 0.03, C.woodD); v.box(Math.cos(a) * 0.28, 0.01, Math.sin(a) * 0.28, 0.06, 0.02, 0.06, C.woodDD); }
  prism(v, 0, 0.62, 0, 0.025, 0.025, 0.66, C.wood, 8);
  prism(v, 0, 0.34, 0, 0.04, 0.04, 0.06, C.brassD, 8);
  prism(v, 0, 0.9, 0, 0.032, 0.032, 0.04, C.brass, 8);
  // tilted desk with slats and a ledge
  const DY = 1.06, tilt = -0.32;
  boxR(v, 0, DY, 0.01, 0.52, 0.36, 0.02, C.wood, tilt, 0, 0);
  for (let k = 0; k < 4; k++) boxR(v, 0, DY - 0.12 + k * 0.08, 0.025 - (k * 0.08 - 0.12) * Math.sin(-tilt), 0.5, 0.015, 0.01, C.woodD, tilt, 0, 0);
  boxR(v, 0, DY - 0.18, 0.08, 0.54, 0.03, 0.06, C.woodD, tilt, 0, 0);
  stick(v, [0, 0.9, 0], [0, DY - 0.1, -0.02], 0.03, C.woodD);
  // the book's page block (two pages, a little fanned)
  for (const sx of [-1, 1]) boxR(v, sx * 0.115, DY + 0.01, 0.035, 0.22, 0.29, 0.012, C.paper, tilt, sx * -0.08, 0);
  boxR(v, 0, DY + 0.01, 0.02, 0.48, 0.3, 0.008, C.maroon, tilt, 0, 0);
  root.add(v.mesh());
  const { g, tex } = canvasTex(512, 320);
  const page = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.275), basic('#ffffff', { map: tex }));
  page.position.set(0, DY + 0.012, 0.05);
  page.rotation.x = tilt;
  root.add(page);
  const bt = textOf(book);
  const draw = () => {
    g.fillStyle = '#F8F2E2'; g.fillRect(0, 0, 512, 320);
    g.fillStyle = 'rgba(90,70,50,0.25)'; g.fillRect(253, 0, 6, 320);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = C.maroon; g.font = `700 30px ${FONT_MY}`; g.fillText(bt.my, 128, 40, 230);
    g.fillStyle = '#8A6A4A'; g.font = `italic 15px ${FONT_SERIF}`; g.fillText(bt.en, 128, 68, 230);
    // chord letters over squiggle lines (no words: the song is Maya's to write)
    for (const ox of [0, 256]) for (let k = 0; k < (ox ? 7 : 5); k++) {
      const y = (ox ? 36 : 104) + k * 38;
      g.fillStyle = C.goldD; g.font = `700 13px ${FONT_SERIF}`; g.textAlign = 'left';
      for (let c = 0; c < 3; c++) g.fillText(['C', 'G', 'Am', 'F', 'D'][(k + c) % 5], ox + 26 + c * 72, y - 12);
      g.strokeStyle = 'rgba(60,50,40,0.75)'; g.lineWidth = 3; g.beginPath(); g.moveTo(ox + 24, y + 6);
      for (let x = ox + 24; x < ox + 230; x += 10) g.lineTo(x, y + 6 + Math.sin(x * 0.4 + k) * 3);
      g.stroke();
    }
    tex.needsUpdate = true;
  };
  draw();
  fontsReady().then(draw);
  const sh = shadowUnder(root, 0.3, 0.3, 0, 0, 0.4);
  return { root, dispose() { tex.dispose(); page.material.dispose(); sh.geometry.dispose(); disposeTree(root); } };
}

const TIES = { blue: '#3E6FA8', green: '#4F7A5A' };
/**
 * A cloth-wrapped roll (0.7 x 0.22 x 0.22) tied with string in three places (tie 'blue' | 'green' | a colour).
 * Carryable: grip is the local hold point (middle, top). liftCorner(0..1) raises one cloth corner (nothing drawn
 * beneath it).
 */
export function coveredBundle({ tie = 'blue', lift = 0 } = {}) {
  const root = new THREE.Group();
  root.name = 'coveredBundle';
  const R = 0.105, L = 0.62;
  const CL = '#C9A06A', CLD = '#A9804E', CLL = '#DDBA86';
  let body = null;
  function build(col) {
    freeMesh(body);
    const v = new VoxelBuilder();
    prism(v, 0, R, 0, R, R, L, CL, 8, 0, 0, Math.PI / 2);
    for (let k = 0; k < 5; k++) prism(v, -L / 2 + 0.07 + k * 0.12, R, 0, R + 0.006, R + 0.006, 0.04, k % 2 ? CLD : CLL, 8, 0, 0, Math.PI / 2); // folds
    for (const sx of [-1, 1]) {
      prism(v, sx * (L / 2 + 0.03), R, 0, R * 0.55, R * 0.95, 0.06, CLD, 8, 0, 0, sx * Math.PI / 2); // gathered ends
      prism(v, sx * (L / 2 + 0.07), R, 0, R * 0.25, R * 0.5, 0.04, CL, 8, 0, 0, sx * Math.PI / 2);
      for (let k = 0; k < 4; k++) boxR(v, sx * (L / 2 + 0.1), R + Math.cos(k * 1.6) * 0.04, Math.sin(k * 1.6) * 0.04, 0.05, 0.02, 0.04, CLL, k, 0, sx * 0.4); // frilled tufts
    }
    // a seam along the top where the cloth overlaps
    v.box(0, R * 2 - 0.004, 0.03, L, 0.01, 0.05, CLD);
    // string ties
    for (const x of [-0.22, 0, 0.22]) {
      prism(v, x, R, 0, R + 0.012, R + 0.012, 0.018, col, 8, 0, 0, Math.PI / 2);
      v.box(x, R * 2 + 0.012, 0.0, 0.03, 0.02, 0.03, shade(col, 0.85));
      if (x === 0) { stick(v, [0.01, R * 2 + 0.015, 0.0], [0.06, R * 2 + 0.005, 0.07], 0.01, col); stick(v, [-0.01, R * 2 + 0.015, 0.0], [-0.05, R * 2 - 0.02, 0.08], 0.01, col); }
    }
    body = v.mesh({ px: 1.2 });
    root.add(body);
  }
  build(TIES[tie] || tie);
  // the liftable corner: a small cloth flap at the front-right end, hinged along its back edge
  const flap = new THREE.Group();
  flap.position.set(L / 2 - 0.08, R * 1.75, R * 0.7);
  root.add(flap);
  const fv = new VoxelBuilder();
  fv.box(0, 0, 0.04, 0.14, 0.012, 0.08, CLL);
  fv.box(0.05, -0.004, 0.075, 0.04, 0.01, 0.02, CLD);
  flap.add(fv.mesh({ px: 1.0 }));
  const sh = shadowUnder(root, 0.42, 0.14, 0, 0, 0.4);
  function liftCorner(t) { flap.rotation.x = -ease(t) * 1.1; flap.rotation.z = -ease(t) * 0.2; }
  liftCorner(lift);
  return { root, grip: new THREE.Vector3(0, R * 2 + 0.02, 0), liftCorner, setTie(c) { build(TIES[c] || c); }, dispose() { sh.geometry.dispose(); freeMesh(body); disposeTree(root); } };
}

// ---------------------------------------------------------------------------------------------
// the garden diary, the committee table, the wall calendar
// ---------------------------------------------------------------------------------------------
/**
 * The garden diary: a thick book in a tin box on a low bench. setOpen(0..1): the tin lid lifts (first half), then the
 * cover opens (second half) onto a page (canvas: a date heading and the gardener's notes). setPage(lines).
 */
export function gardenDiary({ open = 0, bench = true, lines = [{ my: '၁၀ ရက်၊ တန်ဆောင်မုန်း', en: 'Day 10' }, 'ပဲပင်တွေ ရေလောင်းပြီး', 'နာမည်တိုင်တွေ စိုက်ပြီး', 'ဒီနေ့ သူ မလာဘူး'] } = {}) {
  const root = new THREE.Group();
  root.name = 'gardenDiary';
  const v = new VoxelBuilder();
  const BY = bench ? 0.42 : 0; // box sits here
  if (bench) {
    for (const fx of [-1, 1]) { v.box(fx * 0.4, 0.2, 0, 0.07, 0.4, 0.34, C.woodD); v.box(fx * 0.4, 0.06, 0, 0.09, 0.03, 0.38, C.woodDD); }
    v.box(0, 0.4, 0, 1.0, 0.04, 0.4, C.wood);
    for (let k = 0; k < 3; k++) v.box(0, 0.422, -0.13 + k * 0.13, 0.98, 0.004, 0.006, C.woodD);
    v.box(0, 0.16, 0, 0.74, 0.04, 0.04, C.woodD);
    prism(v, 0.38, 0.47, 0.08, 0.035, 0.03, 0.08, C.terra, 8); // a little pot of pencils
    for (let k = 0; k < 3; k++) stick(v, [0.37 + k * 0.01, 0.48, 0.08], [0.35 + k * 0.025, 0.6, 0.07 + k * 0.01], 0.01, k % 2 ? C.mustard : C.leaf);
  }
  // tin box (0.42 x 0.12 x 0.32) with a rolled rim and a few rust freckles
  const TW = 0.42, TD = 0.32, TH = 0.12;
  v.box(-0.05, BY + TH / 2, 0, TW, TH, TD, C.tin);
  v.box(-0.05, BY + TH - 0.006, 0, TW + 0.012, 0.012, TD + 0.012, C.tinD);
  v.box(-0.05, BY + TH - 0.004, 0, TW - 0.03, 0.01, TD - 0.03, '#5E544A'); // the dark inside
  for (const [x, y, z] of [[0.1, 0.03, TD / 2], [-0.2, 0.08, TD / 2], [0.12, 0.09, TD / 2]]) v.box(-0.05 + x, BY + y, z + 0.002, 0.03, 0.02, 0.004, '#B07A4E');
  v.box(-0.05, BY + TH * 0.55, TD / 2 + 0.004, 0.08, 0.03, 0.006, C.tinL); // latch plate
  root.add(v.mesh());
  // the book, its page block sitting in the box
  const bv = new VoxelBuilder();
  const BW = 0.34, BD = 0.25, BT = 0.07;
  const bx = -0.05, by = BY + TH - 0.05;
  bv.box(bx, by + 0.004, 0, BW, 0.008, BD, C.leatherD);
  bv.box(bx + 0.005, by + BT / 2, 0, BW - 0.02, BT - 0.012, BD - 0.014, C.paper);
  for (let k = 0; k < 5; k++) bv.box(bx + 0.005, by + 0.012 + k * 0.011, BD / 2 - 0.006, BW - 0.03, 0.002, 0.002, '#DCCFAE'); // page edges
  bv.box(bx - BW / 2 + 0.006, by + BT / 2, 0, 0.014, BT, BD + 0.004, C.leather); // spine
  for (let k = 0; k < 3; k++) bv.box(bx + 0.06 + k * 0.03, by + BT + 0.002, BD / 2 - 0.02 + k * 0.01, 0.012, 0.002, 0.05, [C.maroon, C.leaf, C.gold][k]); // ribbons
  root.add(bv.mesh({ px: 1.2 }));
  // the page (canvas) on top of the block
  const { g, tex } = canvasTex(512, 380);
  const page = new THREE.Mesh(new THREE.PlaneGeometry(BW - 0.03, BD - 0.02), basic('#ffffff', { map: tex }));
  page.rotation.x = -Math.PI / 2;
  page.position.set(bx + 0.005, by + BT - 0.004, 0);
  root.add(page);
  // the cover, hinged on the spine (left), and the tin lid hinged at the back
  const coverH = new THREE.Group();
  coverH.position.set(bx - BW / 2, by + BT, 0);
  root.add(coverH);
  const cv = new VoxelBuilder();
  cv.box(BW / 2, 0.005, 0, BW, 0.01, BD, C.leather);
  cv.box(BW / 2 + 0.01, 0.012, 0, BW - 0.06, 0.004, BD - 0.06, C.leatherL);
  cv.box(BW / 2 + 0.01, 0.015, 0, 0.12, 0.004, 0.05, C.gold); // a gold label
  cv.box(BW / 2, -0.001, 0, BW - 0.01, 0.002, BD - 0.01, C.cream); // endpaper
  coverH.add(cv.mesh({ px: 1.2 }));
  const lidH = new THREE.Group();
  lidH.position.set(-0.05, BY + TH, -TD / 2);
  root.add(lidH);
  const lv = new VoxelBuilder();
  lv.box(0, 0.012, TD / 2, TW + 0.016, 0.024, TD + 0.016, C.tinL);
  lv.box(0, 0.026, TD / 2, TW - 0.06, 0.006, TD - 0.06, C.tin);
  lv.box(0, 0.03, TD / 2, TW - 0.14, 0.004, TD - 0.14, C.tinL);
  for (let k = 0; k < 4; k++) lv.box(-0.14 + k * 0.09, 0.034, TD / 2 + 0.02 * ((k % 2) - 0.5), 0.05, 0.004, 0.03, k % 2 ? C.leafL : C.rose); // painted flowers on the lid
  lv.box(0, 0.006, TD + 0.012, 0.06, 0.03, 0.008, C.tinD);
  lidH.add(lv.mesh({ px: 1.2 }));
  let cur = lines;
  const draw = () => {
    g.fillStyle = '#F8F1DE'; g.fillRect(0, 0, 512, 380);
    g.strokeStyle = 'rgba(110,140,90,0.3)'; g.lineWidth = 2;
    for (let y = 92; y < 380; y += 44) { g.beginPath(); g.moveTo(24, y); g.lineTo(488, y); g.stroke(); }
    const items = cur.map(textOf);
    g.textAlign = 'left'; g.textBaseline = 'middle';
    if (items[0]) {
      g.fillStyle = C.maroon; g.font = `700 32px ${FONT_MY}`; g.fillText(items[0].my, 30, 40, 450);
      if (items[0].en) { g.fillStyle = '#8A6A4A'; g.font = `italic 16px ${FONT_SERIF}`; g.textAlign = 'right'; g.fillText(items[0].en, 488, 72); g.textAlign = 'left'; }
    }
    g.fillStyle = '#3A3A52'; g.font = `500 27px ${FONT_MY}`;
    items.slice(1, 7).forEach((t, k) => g.fillText(t.my, 34, 118 + k * 44, 450));
    // a pressed leaf in the corner
    g.fillStyle = '#7E9A55'; g.beginPath(); g.ellipse(456, 330, 18, 34, 0.7, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#5E7A3E'; g.lineWidth = 2; g.beginPath(); g.moveTo(440, 352); g.lineTo(474, 306); g.stroke();
    tex.needsUpdate = true;
  };
  draw();
  fontsReady().then(draw);
  const sh = shadowUnder(root, bench ? 0.6 : 0.3, bench ? 0.28 : 0.22, 0, 0, 0.4);
  function setOpen(t) {
    t = clamp01(t);
    lidH.rotation.x = -ease(Math.min(1, t * 2)) * 1.95;
    coverH.rotation.z = ease(Math.max(0, t * 2 - 1)) * Math.PI * 0.97;
  }
  setOpen(open);
  return { root, setOpen, setPage(l) { cur = l; draw(); }, dispose() { tex.dispose(); page.material.dispose(); sh.geometry.dispose(); disposeTree(root); } };
}

/**
 * The garden committee's table (1.6 x 0.8, 0.75 high) under a maroon cloth with a gold fringe: the open ledger, an
 * ink pot and dip pen, a hand bell, a stack of complaint slips under a stone, and a hurricane lamp (setLit).
 */
export function committeeTable({ lit = 0 } = {}) {
  const root = new THREE.Group();
  root.name = 'committeeTable';
  const v = new VoxelBuilder();
  const W = 1.6, D = 0.8, H = 0.75;
  for (const fx of [-1, 1]) for (const fz of [-1, 1]) { v.box(fx * (W / 2 - 0.07), (H - 0.04) / 2, fz * (D / 2 - 0.07), 0.07, H - 0.04, 0.07, C.woodD); v.box(fx * (W / 2 - 0.07), 0.02, fz * (D / 2 - 0.07), 0.09, 0.04, 0.09, C.woodDD); }
  v.box(0, H - 0.02, 0, W, 0.04, D, C.wood);
  // cloth: top, a front drop to half height with a gold fringe, short side drops
  v.box(0, H + 0.003, 0.0, W + 0.02, 0.006, D + 0.02, C.maroon);
  v.box(0, H - 0.2, D / 2 + 0.012, W + 0.02, 0.4, 0.008, C.maroon);
  for (const sx of [-1, 1]) v.box(sx * (W / 2 + 0.012), H - 0.12, 0, 0.008, 0.24, D + 0.02, C.maroonD);
  v.box(0, H - 0.4, D / 2 + 0.016, W + 0.02, 0.025, 0.008, C.gold);
  for (let x = -W / 2 + 0.02; x < W / 2; x += 0.04) v.box(x, H - 0.43, D / 2 + 0.016, 0.012, 0.035, 0.006, C.goldD);
  v.box(0, H - 0.05, D / 2 + 0.017, W - 0.1, 0.012, 0.004, C.gold);
  // the ledger: two ruled pages with red and ink columns
  const LX = -0.15, LY = H + 0.006;
  v.box(LX, LY + 0.006, 0.05, 0.5, 0.012, 0.34, C.maroonD);
  for (const sx of [-1, 1]) {
    boxR(v, LX + sx * 0.122, LY + 0.022, 0.05, 0.236, 0.022, 0.32, C.paper, 0, 0, sx * -0.03);
    for (let k = 0; k < 10; k++) v.box(LX + sx * 0.122, LY + 0.035, -0.08 + k * 0.028, 0.21, 0.002, 0.003, '#C3CDD6');
    for (const cx of [-0.05, 0.06]) v.box(LX + sx * 0.122 + cx, LY + 0.035, 0.05, 0.003, 0.002, 0.3, '#C46A6A');
    for (let k = 0; k < (sx < 0 ? 9 : 5); k++) { v.box(LX + sx * 0.122 - 0.04, LY + 0.036, -0.08 + k * 0.028, 0.1 - (k % 3) * 0.02, 0.002, 0.008, '#3A3A52'); v.box(LX + sx * 0.122 + 0.09, LY + 0.036, -0.08 + k * 0.028, 0.03, 0.002, 0.008, k % 4 === 2 ? C.maroon : '#3A3A52'); }
  }
  v.box(LX, LY + 0.03, 0.05, 0.012, 0.02, 0.33, C.maroon);
  // ink pot and dip pen
  prism(v, 0.32, LY + 0.03, 0.1, 0.04, 0.045, 0.06, '#2E3A4E', 8);
  prism(v, 0.32, LY + 0.065, 0.1, 0.02, 0.025, 0.015, '#2E3A4E', 8);
  stick(v, [0.32, LY + 0.06, 0.1], [0.36, LY + 0.22, 0.04], 0.01, C.ink);
  v.box(0.24, LY + 0.004, 0.13, 0.14, 0.008, 0.08, C.woodL); // pen tray
  // hand bell
  prism(v, 0.5, LY + 0.04, -0.1, 0.03, 0.055, 0.07, C.brass, 10);
  prism(v, 0.5, LY + 0.004, -0.1, 0.057, 0.057, 0.008, C.brassD, 10);
  prism(v, 0.5, LY + 0.11, -0.1, 0.012, 0.012, 0.08, C.woodD, 8);
  prism(v, 0.5, LY + 0.155, -0.1, 0.02, 0.02, 0.02, C.woodD, 8);
  // complaint slips under a river stone
  for (let k = 0; k < 6; k++) boxR(v, -0.62 + (k % 2) * 0.01, LY + 0.004 + k * 0.005, 0.1, 0.16, 0.004, 0.11, jitter(C.paper, 0.04, k), 0, (k - 3) * 0.07, 0);
  prism(v, -0.62, LY + 0.055, 0.1, 0.04, 0.055, 0.04, C.stone, 8);
  // two chairs' worth of floor: a low stool behind
  stoolInto(v, 0, -0.75, '#8A5E3C', 0);
  // the lamp: tin base, glass chimney (lit core), wire handle
  const AX = 0.62, AZ = 0.18;
  prism(v, AX, LY + 0.04, AZ, 0.06, 0.07, 0.08, C.tinD, 10);
  prism(v, AX, LY + 0.09, AZ, 0.04, 0.06, 0.02, C.tin, 10);
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; v.box(AX + Math.cos(a) * 0.05, LY + 0.2, AZ + Math.sin(a) * 0.05, 0.008, 0.2, 0.008, C.tinD); }
  prism(v, AX, LY + 0.31, AZ, 0.05, 0.05, 0.02, C.tinD, 10);
  stick(v, [AX - 0.05, LY + 0.32, AZ], [AX, LY + 0.4, AZ], 0.008, C.iron);
  stick(v, [AX, LY + 0.4, AZ], [AX + 0.05, LY + 0.32, AZ], 0.008, C.iron);
  root.add(v.mesh());
  const g = glow('#7A7064', '#FFE0A0');
  const gv = new VoxelBuilder();
  prism(gv, AX, LY + 0.2, AZ, 0.035, 0.045, 0.18, '#F4ECDC', 10);
  root.add(glowMesh(gv, g));
  const hl = halo(0.9, 0.9);
  hl.position.set(AX, LY + 0.2, AZ + 0.1);
  root.add(hl);
  const pool = halo(1.4, 1.0, true);
  pool.position.set(0.2, LY + 0.01, 0);
  root.add(pool);
  const sh = shadowUnder(root, 0.95, 0.75, 0, -0.15, 0.4);
  let litT = 0;
  function setLit(t) { litT = typeof t === 'boolean' ? (t ? 1 : 0) : clamp01(t); g.set(0.1 + litT * 0.9); setHalo(hl, litT * 0.7); setHalo(pool, litT * 0.35); }
  setLit(lit);
  root.userData.footprint = { w: W + 0.1, d: D + 0.9 };
  return {
    root, setLit,
    update(dt, t) { if (litT > 0.01) g.set(0.1 + litT * (0.86 + Math.sin(t * 7.3) * 0.04 + Math.sin(t * 17.1) * 0.03)); },
    dispose() { g.mat.dispose(); hl.material.dispose(); pool.material.dispose(); sh.geometry.dispose(); disposeTree(root); },
  };
}

/**
 * A tear-off wall calendar (0.4 x 0.55) on a nail, back at z = 0: a painted header (flowers) with the month label and
 * a pad with a big Burmese numeral. flip(): the top leaf curls up and flies off (0.25 s) and the next day shows.
 * reset() back to the first day; setLabel(text); setDay(n).
 */
export function wallCalendar({ label = 'တန်ဆောင်မုန်း', day = 9 } = {}) {
  const root = new THREE.Group();
  root.name = 'wallCalendar';
  const W = 0.4, H = 0.55;
  const v = new VoxelBuilder();
  v.box(0, H / 2 + 0.04, 0.02, 0.02, 0.02, 0.04, C.iron); // nail
  stick(v, [-0.07, H / 2 - 0.01, 0.012], [0, H / 2 + 0.04, 0.03], 0.006, C.twineD);
  stick(v, [0.07, H / 2 - 0.01, 0.012], [0, H / 2 + 0.04, 0.03], 0.006, C.twineD);
  v.box(0, H / 2 - 0.012, 0.008, W + 0.01, 0.024, 0.016, C.woodD); // top strip
  v.box(0, 0, 0.003, W, H, 0.006, '#E9DEC6'); // backing card
  v.box(0, -H * 0.2, 0.012, W - 0.06, H * 0.5, 0.018, '#F2EBDB'); // the pad's thickness
  for (let k = 0; k < 4; k++) v.box(0, -H * 0.45 + 0.004 * k, 0.022, W - 0.07, 0.002, 0.002, '#D8CDB6');
  root.add(v.mesh({ px: 1.0 }));
  const { g, tex } = canvasTex(512, 704);
  // the backing (header + pad face) is one quad; the flying leaf is a second quad showing the pad half of the atlas
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W, H), basic('#ffffff', { map: tex }));
  face.position.z = 0.0225;
  root.add(face);
  const leafPivot = new THREE.Group();
  leafPivot.position.set(0, 0.05, 0.024);
  root.add(leafPivot);
  const leafMat = basic('#ffffff', { map: tex, side: THREE.DoubleSide });
  const leaf = new THREE.Mesh(atlasQuad(W - 0.06, H * 0.5, 0, -H * 0.25, 0.001, 0.075, 0, 0.925, 0.5), leafMat);
  leafPivot.add(leaf);
  leafPivot.visible = false;
  let lab = label, d0 = day, d = day, ft = 9;
  const draw = (n) => {
    g.fillStyle = '#E9DEC6'; g.fillRect(0, 0, 512, 704);
    // header: a painted spray of padauk flowers on cream
    g.fillStyle = '#F6EEDA'; g.fillRect(16, 26, 480, 300);
    g.fillStyle = '#7E9A55';
    for (let k = 0; k < 9; k++) { g.beginPath(); g.ellipse(120 + k * 34, 150 + Math.sin(k) * 30, 10, 22, k * 0.7, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#E2B33C';
    for (let k = 0; k < 26; k++) { g.beginPath(); g.arc(130 + ((k * 53) % 260), 110 + ((k * 37) % 90), 9, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = C.maroon; g.fillRect(16, 250, 480, 76);
    g.fillStyle = '#F3E6C6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 40px ${FONT_MY}`; g.fillText(lab, 256, 290, 440);
    // pad face
    g.fillStyle = '#FBF6EA'; g.fillRect(38, 352, 436, 352);
    g.fillStyle = C.maroon; g.font = `700 190px ${FONT_MY}`; g.fillText(myDigits(n), 256, 520, 400);
    g.fillStyle = '#7A6A58'; g.font = `600 26px ${FONT_MY}`; g.fillText('ရက်', 256, 650);
    tex.needsUpdate = true;
  };
  draw(d);
  fontsReady().then(() => draw(d));
  return {
    root,
    flip() { ft = 0; leafPivot.visible = true; leafPivot.position.set(0, 0.05, 0.024); leafPivot.rotation.set(0, 0, 0); d += 1; },
    reset() { d = d0; ft = 9; leafPivot.visible = false; draw(d); },
    setLabel(t) { lab = t; draw(d); },
    setDay(n) { d = n; draw(d); },
    get day() { return d; },
    update(dt) {
      if (ft > 1) return;
      ft += dt;
      const k = Math.min(1, ft / 0.25);
      leafPivot.rotation.x = -k * 2.4;
      leafPivot.rotation.z = k * 0.6;
      leafPivot.position.set(k * 0.18, 0.05 + k * 0.12, 0.024 + k * 0.15);
      if (k >= 1) { leafPivot.visible = false; ft = 9; draw(d); }
    },
    dispose() { tex.dispose(); face.material.dispose(); leafMat.dispose(); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// Day 13: the hand loom (loom shed; also usable outdoors under the shed's eaves)
// ---------------------------------------------------------------------------------------------
/**
 * A hand loom, about 1.2 w x 1.5 h x 1.3 d (+ bench to z = 1.15), the weaver's side toward +Z. A dark wooden frame,
 * castle beam with heddles on cords, a hanging beater, four treadles. beam 'full': a cream warp wound on the back
 * beam running to the fell, a band of woven cloth to the breast beam and rolled on the cloth beam, a shuttle with a
 * bobbin; 'empty': bare beams and an empty shuttle. cover 'off' | 'on' | 'tagged': a plain maroon cloth thrown over
 * the top and tied down with twine (never shows a pattern); 'tagged' adds a small cream tag on a string.
 *   handLoom({ cover, beam, cloth, cloth2, bench }) -> { root, setCover(state), setBeam(state), dispose }
 */
// Lesson ch 21 (D13): cover 'on' = a touchy spot kept covered; 'tagged' = others can ask first.
export function handLoom({ cover = 'off', beam = 'full', cloth = C.glaze, cloth2 = C.white2, bench = true } = {}) {
  const root = new THREE.Group();
  root.name = 'handLoom';
  const v = new VoxelBuilder();
  const wd = C.wood, wdD = C.woodDD, wdM = C.woodD;
  const PX = 0.55, PZ = 0.6, TOP = 1.5;
  // four posts on little feet, top and bottom side rails
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    v.box(a * PX, TOP / 2, b * PZ, 0.075, TOP, 0.075, wdD);
    v.box(a * PX, 0.02, b * PZ, 0.11, 0.04, 0.11, wdM);
  }
  for (const a of [-1, 1]) {
    v.boxMin(a * PX - 0.04, TOP - 0.06, -PZ - 0.06, a * PX + 0.04, TOP + 0.02, PZ + 0.06, wd);
    v.boxMin(a * PX - 0.04, 0.12, -PZ - 0.04, a * PX + 0.04, 0.19, PZ + 0.04, wdM);
    v.box(a * PX, 0.98, -PZ, 0.06, 0.03, 0.06, wdM); // warp-beam brackets
  }
  v.boxMin(-PX - 0.04, TOP - 0.06, -0.045, PX + 0.04, TOP + 0.03, 0.045, wd); // castle beam
  v.boxMin(-PX + 0.03, TOP + 0.03, -0.03, PX - 0.03, TOP + 0.06, 0.03, wdM);
  v.boxMin(-PX - 0.02, 0.76, PZ - 0.04, PX + 0.02, 0.84, PZ + 0.05, wd); // breast beam
  v.boxMin(-PX + 0.02, 0.84, PZ - 0.03, PX - 0.02, 0.855, PZ + 0.04, C.woodL); // its worn top
  v.boxMin(-PX - 0.02, 0.14, -PZ - 0.02, PX + 0.02, 0.2, -PZ + 0.04, wdM); // back foot rail
  prism(v, 0, 0.46, PZ - 0.1, 0.055, 0.055, 1.04, wdM, 8, 0, 0, Math.PI / 2); // cloth beam
  prism(v, 0, 0.92, -PZ + 0.02, 0.055, 0.055, 1.04, wdM, 8, 0, 0, Math.PI / 2); // warp beam
  for (const a of [-1, 1]) {
    prism(v, a * 0.48, 0.46, PZ - 0.1, 0.07, 0.07, 0.03, wd, 8, 0, 0, Math.PI / 2); // ratchet wheels
    prism(v, a * 0.48, 0.92, -PZ + 0.02, 0.07, 0.07, 0.03, wd, 8, 0, 0, Math.PI / 2);
  }
  boxR(v, 0.5, 0.58, PZ - 0.04, 0.02, 0.14, 0.02, C.iron, 0.4, 0, 0); // pawl
  // heddles: two shafts on cords from the castle, a lamm under each
  for (const z of [-0.07, 0.05]) {
    v.boxMin(-0.46, 1.12, z - 0.012, 0.46, 1.15, z + 0.012, wd);
    v.boxMin(-0.46, 0.92, z - 0.012, 0.46, 0.95, z + 0.012, wd);
    for (let i = 0; i < 15; i++) v.box(-0.42 + i * 0.06, 1.035, z, 0.006, 0.17, 0.006, C.tinD);
    for (const a of [-0.32, 0.32]) {
      v.box(a, 1.32, z, 0.008, 0.34, 0.008, C.twineD);
      v.box(a, 0.62, z, 0.008, 0.3, 0.008, C.twineD);
    }
    v.boxMin(-0.4, 0.46, z - 0.015, 0.4, 0.48, z + 0.015, wdM);
  }
  prism(v, 0, TOP - 0.13, 0.0, 0.03, 0.03, 0.9, C.woodL, 8, 0, 0, Math.PI / 2); // pulley roller
  // the beater: swords from a pivot rod low between the posts, a reed in the batten
  for (const a of [-1, 1]) {
    stick(v, [a * 0.47, 0.22, 0.3], [a * 0.47, 1.0, 0.36], 0.04, wd);
    v.box(a * PX - a * 0.03, 0.22, 0.3, 0.06, 0.06, 0.06, wdM);
  }
  v.boxMin(-0.5, 0.94, 0.33, 0.5, 1.02, 0.4, wd);
  for (let i = 0; i < 24; i++) v.box(-0.44 + i * 0.038, 0.87, 0.348, 0.008, 0.14, 0.008, C.tinD); // reed dents
  v.boxMin(-0.5, 0.76, 0.33, 0.5, 0.8, 0.39, wd);
  // treadles hinged at the front, tied up to the lamms
  for (let i = 0; i < 4; i++) {
    const x = -0.24 + i * 0.16;
    boxR(v, x, 0.08, 0.2, 0.07, 0.025, 0.72, i % 2 ? wd : C.woodL, -0.1, 0, 0);
    v.box(x, 0.26, -0.06 + (i % 2) * 0.1, 0.006, 0.36, 0.006, C.twineD);
  }
  v.box(0, 0.06, PZ - 0.04, 0.72, 0.05, 0.05, wdM); // treadle bar
  // the bench
  if (bench) {
    const z = 1.0;
    v.boxMin(-0.44, 0.44, z - 0.15, 0.44, 0.5, z + 0.15, wd);
    v.boxMin(-0.42, 0.5, z - 0.13, 0.42, 0.51, z + 0.13, C.woodL);
    for (const a of [-1, 1]) for (const b of [-1, 1]) stick(v, [a * 0.36, 0.44, z + b * 0.09], [a * 0.4, 0, z + b * 0.12], 0.05, wdM);
    v.box(0, 0.2, z, 0.74, 0.04, 0.04, wdM);
  }
  root.add(v.mesh());
  const sh = shadowUnder(root, 0.8, 0.95, 0, 0.2, 0.42);

  let beamMesh = null, coverMesh = null, beamState = beam, coverState = cover;
  function setBeam(state) {
    beamState = state === 'empty' ? 'empty' : 'full';
    freeMesh(beamMesh);
    const b = new VoxelBuilder();
    if (beamState === 'full') {
      prism(b, 0, 0.92, -PZ + 0.02, 0.085, 0.085, 0.9, cloth2, 10, 0, 0, Math.PI / 2); // warp wound on the back beam
      for (const a of [-1, 1]) prism(b, a * 0.44, 0.92, -PZ + 0.02, 0.088, 0.088, 0.02, shade(cloth2, 0.85), 10, 0, 0, Math.PI / 2);
      // the warp from the back beam over the heddles to the fell, alternate threads a shade apart
      for (let i = 0; i < 22; i++) {
        const x = -0.42 + i * 0.04;
        const col = i % 2 ? cloth2 : shade(cloth2, 0.88);
        stick(b, [x, 1.0, -PZ + 0.02], [x, 1.03, -0.07], 0.007, col);
        stick(b, [x, 1.03, -0.07], [x, 0.87, 0.33], 0.007, col);
      }
      // woven band from the fell to the breast beam, rolled on the cloth beam
      boxR(b, 0, 0.855, 0.47, 0.86, 0.012, 0.26, cloth, -0.06, 0, 0);
      for (let i = 0; i < 5; i++) boxR(b, 0, 0.862, 0.36 + i * 0.05, 0.86, 0.006, 0.014, i % 2 ? shade(cloth, 1.25) : cloth2, -0.06, 0, 0);
      boxR(b, 0, 0.66, PZ + 0.07, 0.86, 0.36, 0.012, cloth, 0, 0, 0); // over the breast beam and down
      prism(b, 0, 0.46, PZ - 0.1, 0.095, 0.095, 0.88, cloth, 12, 0, 0, Math.PI / 2);
      for (const a of [-1, 1]) prism(b, a * 0.38, 0.46, PZ - 0.1, 0.098, 0.098, 0.03, cloth2, 12, 0, 0, Math.PI / 2);
      // the shuttle with its bobbin on the breast beam, a spare pirn beside it
      boxR(b, 0.2, 0.88, PZ, 0.32, 0.035, 0.055, '#C9A06A', 0, 0.05, 0);
      boxR(b, 0.2, 0.9, PZ, 0.12, 0.03, 0.035, cloth, 0, 0.05, 0);
      prism(b, -0.3, 0.875, PZ + 0.01, 0.025, 0.025, 0.12, cloth2, 6, 0, 0, Math.PI / 2);
    } else {
      boxR(b, 0.12, 0.875, PZ, 0.3, 0.03, 0.05, '#C9A06A', 0, -0.08, 0); // an empty shuttle
      for (const a of [-1, 1]) boxR(b, a * 0.3, 0.4, PZ - 0.04, 0.012, 0.12, 0.012, C.twineD, 0.3, 0, 0); // cut tie-on cords
    }
    beamMesh = b.mesh();
    root.add(beamMesh);
  }
  function setCover(state) {
    coverState = state === 'on' || state === 'tagged' ? state : 'off';
    freeMesh(coverMesh);
    coverMesh = null;
    if (coverState === 'off') return;
    const c = new VoxelBuilder();
    const M = C.maroon, MD = C.maroonD, ML = shade(C.maroon, 1.18);
    const Y = TOP + 0.08;
    c.boxMin(-PX - 0.1, Y - 0.03, -PZ - 0.1, PX + 0.1, Y + 0.02, PZ + 0.12, M); // over the top
    for (let k = 0; k < 5; k++) c.box(-0.44 + k * 0.22, Y + 0.025, 0, 0.05, 0.012, 1.3, k % 2 ? MD : ML); // soft folds
    // a soft crown where the cloth sags over the castle beam
    c.boxMin(-PX - 0.02, Y + 0.02, -PZ * 0.55, PX + 0.02, Y + 0.05, PZ * 0.55, ML);
    c.boxMin(-PX + 0.1, Y + 0.05, -0.12, PX - 0.1, Y + 0.075, 0.12, M);
    // front and back drops hang in folds: strips of uneven length (longest mid-way), every other one a step proud
    const NS = 7, SW2 = (PX * 2 + 0.2) / NS;
    for (const s of [1, -1]) {
      const z0 = s * (PZ + 0.13), drop = s > 0 ? 0.66 : 0.5;
      for (let k = 0; k < NS; k++) {
        const u = (k + 0.5) / NS - 0.5, x = u * (PX * 2 + 0.2);
        const len = drop * (1 - 0.55 * u * u * 4 * 0.5) * (k % 2 ? 0.96 : 1.0);
        const col = k % 2 ? MD : (k % 3 ? M : ML);
        const zz = z0 + s * (0.035 + (k % 2) * 0.018 + len * 0.06);
        boxR(c, x, Y - len / 2, zz, SW2 + 0.012, len, 0.03, col, s * 0.12, 0, 0);
        boxR(c, x, Y - len + 0.025, zz + s * 0.04, SW2 + 0.012, 0.05, 0.035, shade(col, 0.82), s * 0.12, 0, 0); // hem
      }
    }
    // the sides hang in a stepped point
    for (const a of [-1, 1]) for (let k = 0; k < 4; k++) {
      const h = 0.6 - k * 0.13, wz = 1.42 - k * 0.3;
      c.box(a * (PX + 0.12 + k * 0.006), Y - h / 2 - 0.02, 0.01, 0.03, h, wz, k % 2 ? M : shade(M, 0.92));
    }
    // twine tied round, a bow on the front
    for (const x of [-0.38, 0.38]) {
      c.box(x, Y + 0.035, 0, 0.02, 0.02, 1.36, C.twine);
      boxR(c, x, Y - 0.25, PZ + 0.31, 0.02, 0.52, 0.02, C.twine, 0.12, 0, 0);
      boxR(c, x, Y - 0.2, -PZ - 0.22, 0.02, 0.42, 0.02, C.twine, -0.12, 0, 0);
      boxR(c, x - 0.04, Y - 0.06, PZ + 0.27, 0.08, 0.025, 0.02, C.twineD, 0, 0, 0.5);
      boxR(c, x + 0.04, Y - 0.06, PZ + 0.27, 0.08, 0.025, 0.02, C.twineD, 0, 0, -0.5);
    }
    if (coverState === 'tagged') {
      // a big cream card tag on a twine loop, hanging on the front drop: the "ask first" sign has to read from the door
      const tx = 0.12, ty = Y - 0.36, tz = PZ + 0.36, rz = -0.1;
      stick(c, [0.38, Y - 0.06, PZ + 0.29], [tx + 0.03, ty + 0.17, tz - 0.01], 0.012, C.twineD);
      stick(c, [-0.38, Y - 0.06, PZ + 0.29], [tx - 0.03, ty + 0.17, tz - 0.01], 0.012, C.twineD);
      boxR(c, tx, ty, tz - 0.006, 0.3, 0.36, 0.012, C.goldD, 0, 0, rz); // gold edge
      boxR(c, tx, ty, tz, 0.27, 0.33, 0.012, '#FBF5E6', 0, 0, rz);
      boxR(c, tx, ty + 0.13, tz + 0.007, 0.05, 0.05, 0.004, C.maroonD, 0, 0, rz); // eyelet
      boxR(c, tx, ty + 0.06, tz + 0.007, 0.2, 0.026, 0.003, C.maroon, 0, 0, rz);
      for (let k = 0; k < 3; k++) boxR(c, tx + k * 0.006, ty - 0.01 - k * 0.05, tz + 0.007, 0.19 - k * 0.04, 0.018, 0.003, C.ink, 0, 0, rz);
    }
    coverMesh = c.mesh();
    root.add(coverMesh);
  }
  setBeam(beam);
  setCover(cover);
  root.userData.footprint = { w: 1.3, d: bench ? 1.9 : 1.4 };
  return {
    root, setBeam, setCover,
    get cover() { return coverState; }, get beam() { return beamState; },
    dispose() { sh.geometry.dispose(); freeMesh(beamMesh); freeMesh(coverMesh); disposeTree(root); },
  };
}

// ---------------------------------------------------------------------------------------------
// Day 9 / 11: the noodle shop front (shell of room `noodlehouse`)
// ---------------------------------------------------------------------------------------------
/** Paint the three hanging menu tags (one atlas, three rows). */
function drawMenuTags(cv, lines) {
  const g = cv.getContext('2d');
  const W = cv.width, RH = cv.height / 3;
  g.clearRect(0, 0, W, cv.height);
  lines.forEach((ln, i) => {
    const t = textOf(ln);
    const y0 = i * RH;
    g.fillStyle = i === 2 ? '#F1E3C2' : '#E8CFA0';
    g.fillRect(0, y0, W, RH);
    g.strokeStyle = 'rgba(110,70,40,0.16)';
    g.lineWidth = 2;
    for (let y = y0 + 12; y < y0 + RH; y += 14) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.4, y + 3, W * 0.7, y - 3, W, y + 1); g.stroke(); }
    g.strokeStyle = i === 2 ? '#3C6E52' : C.maroon;
    g.lineWidth = 5;
    g.strokeRect(8, y0 + 8, W - 16, RH - 16);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = i === 2 ? '#2F5A3E' : C.maroonD;
    g.font = `700 ${Math.round(RH * (t.en ? 0.4 : 0.5))}px ${FONT_MY}`;
    g.fillText(t.my, W / 2, y0 + RH * (t.en ? 0.42 : 0.52), W - 40);
    if (t.en) {
      g.fillStyle = '#7A5434';
      g.font = `600 ${Math.round(RH * 0.18)}px ${FONT_SERIF}`;
      g.fillText(t.en, W / 2, y0 + RH * 0.8, W - 40);
    }
  });
}

/**
 * The noodle shop (closed shell, 7 w x 3.5 h to the eaves x 5 d), across the Row from the bakery. A timber shophouse:
 * faded blue plank dado, cream plaster between dark posts, a rust-red tin roof; a plank door standing open against the
 * front (setOpen) with a faded cloth curtain in the doorway that sways (update), warm light behind it (setLit);
 * a serving window with its plank shutter propped up on a stick, bowls on the sill; the «ခေါက်ဆွဲဆိုင်» board over
 * the door, three menu tags on cords, a string of chillies and garlic under the eaves, a noodle-drying rack on the
 * right, crates of greens, a water bucket and a broom. noodleCounter('street') stands at the kerb left of the door.
 *   noodleShopFront({ open, lit, title, menu, counter }) ->
 *   { root, door: Vector3, counter (noodleCounter handle | null), setOpen(0..1), setLit(0..1), setCurtain(0..1), update(dt, t), dispose }
 */
export function noodleShopFront({
  open = 1, lit = 0.7, counter = true,
  title = { my: 'ခေါက်ဆွဲဆိုင်', en: 'Noodle Shop' },
  menu = [{ my: 'ခေါက်ဆွဲ ဟင်းချို', en: 'Noodle soup' }, { my: 'ခေါက်ဆွဲ သုပ်', en: 'Noodle salad' }, { my: 'ရေနွေးကြမ်း အခမဲ့', en: 'Plain tea, free' }],
} = {}) {
  const root = new THREE.Group();
  root.name = 'noodleShopFront';
  const r = rand(71);
  const v = new VoxelBuilder();
  const W = 7, H = 3.5, D = 5, FZ = D / 2, PL = 0.22, DW = 1.1, DH = 2.15;
  const PLAS = '#EFE2C6', PLASD = '#E0CFAE', BLUE = '#7E9AAE', BLUED = '#647F93', BLUEL = '#97B0C0', POST = C.woodDD;
  const WX = 2.4, WW = 1.1, WY0 = 1.15, WH = 0.9; // serving window
  // plinth and front step (one long low stone step the width of the shop)
  v.boxMin(-W / 2 - 0.1, 0, -D / 2 - 0.1, W / 2 + 0.1, PL, FZ + 0.42, C.stone);
  v.boxMin(-W / 2 - 0.1, PL - 0.04, FZ + 0.36, W / 2 + 0.1, PL, FZ + 0.44, C.stoneL);
  for (let x = -W / 2 + 0.3; x < W / 2; x += 0.62) v.box(x + r() * 0.05, PL / 2, FZ + 0.43, 0.012, PL - 0.06, 0.008, C.stoneD);
  for (let k = 0; k < 7; k++) v.box(-W / 2 + 0.4 + r() * (W - 0.8), PL + 0.002, FZ + 0.1 + r() * 0.25, 0.2 + r() * 0.3, 0.004, 0.12 + r() * 0.1, jitter(C.stoneD, 0.05, k)); // worn flags
  // body: plaster mass, front skin with the door and window holes
  v.boxMin(-W / 2, PL, -D / 2, W / 2, H, FZ - 0.2, PLAS);
  const skin = (x0, y0, x1, y1, col) => v.boxMin(x0, y0, FZ - 0.2, x1, y1, FZ, col);
  skin(-W / 2, PL, -DW / 2, H, PLAS);
  skin(DW / 2, PL, WX - WW / 2, H, PLAS);
  skin(WX + WW / 2, PL, W / 2, H, PLAS);
  skin(WX - WW / 2, PL, WX + WW / 2, WY0, PLAS);
  skin(WX - WW / 2, WY0 + WH, WX + WW / 2, H, PLAS);
  skin(-DW / 2, PL + DH, DW / 2, H, PLAS);
  // faded blue plank dado (vertical boards, paint worn at the bottom)
  const DADO = 1.05;
  for (let x = -W / 2; x < W / 2 - 0.01; x += 0.2) {
    const x1 = Math.min(W / 2, x + 0.2);
    if (x1 > -DW / 2 - 0.02 && x < DW / 2 + 0.02) continue;
    if (x1 > WX - WW / 2 && x < WX + WW / 2) { v.boxMin(x + 0.004, PL, FZ, x1 - 0.004, WY0, FZ + 0.035, jitter(BLUE, 0.05, Math.round(x * 10))); continue; }
    v.boxMin(x + 0.004, PL, FZ, x1 - 0.004, DADO, FZ + 0.035, jitter(BLUE, 0.05, Math.round(x * 10)));
    if (r() > 0.55) v.box((x + x1) / 2, PL + 0.08 + r() * 0.1, FZ + 0.037, 0.12, 0.08 + r() * 0.1, 0.004, '#B8A890'); // paint rubbed off
  }
  v.boxMin(-W / 2, DADO, FZ, -DW / 2, DADO + 0.05, FZ + 0.06, BLUED);
  v.boxMin(DW / 2, DADO, FZ, WX - WW / 2, DADO + 0.05, FZ + 0.06, BLUED);
  v.boxMin(WX + WW / 2, DADO, FZ, W / 2, DADO + 0.05, FZ + 0.06, BLUED);
  // plaster stains and a hairline crack
  for (let k = 0; k < 12; k++) {
    const x = -W / 2 + 0.3 + r() * (W - 0.6);
    if (Math.abs(x) < DW / 2 + 0.15 || Math.abs(x - WX) < WW / 2 + 0.15) continue;
    v.box(x, DADO + 0.25 + r() * 1.8, FZ + 0.003, 0.18 + r() * 0.4, 0.1 + r() * 0.25, 0.006, jitter(r() > 0.4 ? PLASD : '#F6ECD8', 0.02, k));
  }
  for (let k = 0; k < 5; k++) boxR(v, 3.05 - k * 0.04, 1.6 + k * 0.12, FZ + 0.004, 0.012, 0.14, 0.006, '#B9A483', 0, 0, 0.3 * (k % 2 ? 1 : -1));
  // dark timber posts and the eaves beam
  for (const x of [-W / 2 + 0.06, -1.55, DW / 2 + 0.06, W / 2 - 0.06]) v.box(x, (PL + H) / 2, FZ + 0.045, 0.12, H - PL, 0.09, POST);
  v.boxMin(-W / 2, H - 0.26, FZ, W / 2, H - 0.08, FZ + 0.1, POST);
  v.boxMin(-W / 2 - 0.02, H - 0.29, FZ + 0.02, W / 2 + 0.02, H - 0.26, FZ + 0.11, C.gold);
  for (let x = -W / 2 + 0.35; x < W / 2; x += 0.7) v.box(x, H - 0.17, FZ + 0.11, 0.05, 0.05, 0.02, C.goldD); // beam pegs
  // roof: rust-red painted tin, deep eaves, plaster gables with a vent
  const EZ = FZ + 0.6, RH = 1.15;
  tinRoofInto(v, W + 0.6, H, RH, EZ, r, { col: '#A35C48', colD: '#83463A', rust: '#B98458', ridge: '#6E3B30' });
  for (const sx of [-1, 1]) {
    for (let y = H; y < H + RH; y += 0.18) { const dz = (1 - (y - H + 0.09) / RH) * EZ; v.box(sx * (W / 2 - 0.12), y + 0.09, 0, 0.24, 0.18, Math.max(0.05, dz * 2 - 0.12), PLAS); }
    for (const side of [1, -1]) boxR(v, sx * (W / 2 + 0.31), H + RH / 2, side * EZ / 2, 0.06, 0.16, Math.hypot(EZ, RH) + 0.06, POST, side * Math.atan2(RH, EZ), 0, 0);
  }
  v.box(0, H - 0.02, EZ - 0.04, W + 0.6, 0.08, 0.1, '#6E3B30'); // fascia
  for (let x = -W / 2 + 0.6; x < W / 2; x += 1.15) v.box(x, H - 0.1, (FZ + EZ) / 2 + 0.05, 0.06, 0.06, EZ - FZ, POST); // rafters' ends
  // doorway: frame, threshold, lintel
  for (const sx of [-1, 1]) v.boxMin(sx > 0 ? DW / 2 : -DW / 2 - 0.12, PL, FZ - 0.2, sx > 0 ? DW / 2 + 0.12 : -DW / 2, PL + DH + 0.1, FZ + 0.06, POST);
  v.boxMin(-DW / 2 - 0.2, PL + DH + 0.06, FZ - 0.2, DW / 2 + 0.2, PL + DH + 0.18, FZ + 0.08, POST);
  v.boxMin(-DW / 2, PL, FZ - 0.2, DW / 2, PL + 0.04, FZ + 0.02, C.woodD);
  // serving window: frame, sill with bowls, chopstick jar, rolled bamboo blind
  v.boxMin(WX - WW / 2 - 0.1, WY0 - 0.08, FZ - 0.05, WX + WW / 2 + 0.1, WY0, FZ + 0.24, C.woodD);
  v.boxMin(WX - WW / 2 - 0.08, WY0 - 0.01, FZ + 0.02, WX + WW / 2 + 0.08, WY0 + 0.005, FZ + 0.23, C.woodL);
  for (const fx of [-1, 1]) v.box(WX + fx * (WW / 2 + 0.04), WY0 + WH / 2, FZ + 0.04, 0.08, WH, 0.1, POST);
  v.box(WX, WY0 + WH + 0.04, FZ + 0.04, WW + 0.16, 0.08, 0.1, POST);
  for (let k = 0; k < 3; k++) for (let j = 0; j < 4 - k; j++) bowlInto(v, WX - 0.38 + k * 0.04, WY0 + j * 0.045, FZ + 0.13, 0.85, C.white2, C.glaze);
  for (let j = 0; j < 3; j++) bowlInto(v, WX - 0.12, WY0 + j * 0.045, FZ + 0.14, 0.85, C.white2, C.maroon);
  prism(v, WX + 0.18, WY0 + 0.07, FZ + 0.13, 0.045, 0.04, 0.14, C.terra, 8);
  for (let k = 0; k < 7; k++) stick(v, [WX + 0.17 + (k % 3) * 0.012, WY0 + 0.1, FZ + 0.12 + (k % 2) * 0.01], [WX + 0.12 + k * 0.016, WY0 + 0.27, FZ + 0.12 + (k % 3) * 0.012], 0.008, k % 2 ? C.bambooL : C.bamboo);
  prism(v, WX + 0.38, WY0 + 0.05, FZ + 0.14, 0.06, 0.05, 0.1, C.glazeD, 8); // a lidded chilli-oil pot
  prism(v, WX + 0.38, WY0 + 0.11, FZ + 0.14, 0.04, 0.06, 0.03, C.glaze, 8);
  prism(v, WX, WY0 + WH + 0.1, FZ + 0.12, 0.05, 0.05, WW + 0.1, C.bamboo, 8, 0, 0, Math.PI / 2); // rolled blind
  for (const fx of [-0.4, 0.4]) v.box(WX + fx, WY0 + WH + 0.1, FZ + 0.12, 0.02, 0.12, 0.11, C.twineD);
  // the top-hinged plank shutter propped out on a stick
  {
    const ang = 1.05, sl = WH + 0.06, hy = WY0 + WH + 0.08, hz = FZ + 0.08;
    const cy = hy - Math.cos(ang) * sl / 2, cz = hz + Math.sin(ang) * sl / 2;
    boxR(v, WX, cy, cz, WW + 0.14, sl, 0.05, BLUE, -ang, 0, 0);
    for (let k = -2; k <= 2; k++) boxR(v, WX + k * 0.24, cy - 0.003, cz + 0.004, 0.012, sl, 0.052, BLUED, -ang, 0, 0);
    for (const t of [0.15, 0.85]) boxR(v, WX, hy - Math.cos(ang) * sl * t - 0.03, hz + Math.sin(ang) * sl * t + 0.01, WW + 0.1, 0.06, 0.02, BLUEL, -ang, 0, 0);
    const ty = hy - Math.cos(ang) * sl, tz = hz + Math.sin(ang) * sl;
    stick(v, [WX + 0.4, WY0 + 0.01, FZ + 0.2], [WX + 0.4, ty + 0.03, tz - 0.06], 0.035, C.bambooD);
  }
  // the board over the door (frame; face is a canvas), menu rail with three tags on cords
  const SW = 2.3, SH = 0.48, SY = PL + DH + 0.52;
  v.boxMin(-SW / 2 - 0.07, SY - SH / 2 - 0.07, FZ + 0.06, SW / 2 + 0.07, SY + SH / 2 + 0.07, FZ + 0.13, C.maroonD);
  const MX = -2.45, MT = 2.95, TW = 0.92, TH = 0.22, TG = 0.08;
  v.box(MX, MT + 0.06, FZ + 0.08, TW + 0.3, 0.05, 0.05, POST);
  for (let i = 0; i < 3; i++) {
    const ty = MT - TH / 2 - i * (TH + TG);
    v.box(MX, ty, FZ + 0.035, TW + 0.04, TH + 0.04, 0.03, i === 2 ? '#3C6E52' : C.maroonD);
    for (const fx of [-1, 1]) v.box(MX + fx * (TW / 2 - 0.08), ty + TH / 2 + TG / 2 + 0.02, FZ + 0.04, 0.008, TG + 0.04, 0.008, C.twineD);
  }
  // a string of chillies and garlic under the eaves, left corner
  for (const [hx, n] of [[-3.15, 9], [-2.95, 7]]) {
    v.box(hx, H - 0.3 - n * 0.045, FZ + 0.25, 0.008, n * 0.09, 0.008, C.twineD);
    for (let k = 0; k < n; k++) {
      const y = H - 0.36 - k * 0.085;
      if (hx < -3) { boxR(v, hx + (k % 2 ? 0.03 : -0.03), y, FZ + 0.25, 0.03, 0.1, 0.03, k % 3 ? '#B8322A' : '#9A2620', 0, 0, (k % 2 ? 1 : -1) * 0.5); }
      else { prism(v, hx, y, FZ + 0.25, 0.035, 0.04, 0.06, k % 2 ? '#F2ECDF' : '#E6DCC8', 6); prism(v, hx, y + 0.04, FZ + 0.25, 0.008, 0.02, 0.03, '#C8B998', 6); }
    }
  }
  // noodle-drying rack on the right: two X trestles, a bamboo pole, hanks of cream noodles
  {
    const rx = 3.25, z0 = FZ + 0.35, z1 = FZ + 1.75, top = 1.45;
    for (const z of [z0, z1]) for (const s of [-1, 1]) stick(v, [rx + s * 0.3, 0, z], [rx - s * 0.06, top + 0.08, z], 0.045, C.bambooD);
    stick(v, [rx, top, z0 - 0.1], [rx, top, z1 + 0.1], 0.05, C.bamboo);
    for (let k = 0; k < 8; k++) {
      const z = z0 + 0.12 + k * ((z1 - z0 - 0.24) / 7), len = 0.55 + r() * 0.25;
      for (let j = 0; j < 4; j++) v.box(rx - 0.05 + j * 0.033, top - 0.02 - len / 2, z + (j % 2) * 0.012, 0.014, len, 0.03, j % 2 ? C.crumb : '#F1E2B8');
      v.box(rx, top - 0.03, z, 0.14, 0.04, 0.05, '#F1E2B8');
    }
  }
  // crates of greens and cabbages by the door, a water bucket with a dipper, a broom on the wall
  {
    const cx = 1.25, cz = FZ + 0.7;
    for (let i = 0; i < 2; i++) {
      const y = i * 0.3, x = cx + i * 0.04, z = cz - i * 0.03;
      v.boxMin(x - 0.3, y, z - 0.2, x + 0.3, y + 0.04, z + 0.2, C.woodL);
      for (const s of [-1, 1]) { v.boxMin(x - 0.3, y + 0.04, z + s * 0.19 - 0.015, x + 0.3, y + 0.28, z + s * 0.19 + 0.015, C.woodL); v.boxMin(x + s * 0.29 - 0.015, y + 0.04, z - 0.2, x + s * 0.29 + 0.015, y + 0.28, z + 0.2, C.wood); }
      for (const yy of [0.1, 0.2]) v.box(x, y + yy, z + 0.2, 0.6, 0.012, 0.01, C.woodD);
      for (let k = 0; k < 6; k++) {
        const gx = x - 0.18 + (k % 3) * 0.18, gz = z - 0.08 + Math.floor(k / 3) * 0.16;
        if (i === 0) { prism(v, gx, y + 0.27, gz, 0.07, 0.09, 0.12, k % 2 ? C.leafLL : C.leafL, 8); prism(v, gx, y + 0.34, gz, 0.04, 0.07, 0.04, C.leafLL, 8); }
        else for (let j = 0; j < 3; j++) boxR(v, gx + (j - 1) * 0.03, y + 0.3, gz, 0.04, 0.22, 0.03, j % 2 ? C.leaf : C.leafD, 0, 0, (j - 1) * 0.25);
      }
    }
    const bx = -0.85, bz = FZ + 0.62;
    prism(v, bx, PL + 0.14, bz, 0.15, 0.12, 0.28, C.tin, 10);
    prism(v, bx, PL + 0.27, bz, 0.155, 0.155, 0.025, C.tinL, 10);
    prism(v, bx, PL + 0.255, bz, 0.13, 0.13, 0.01, C.water, 10);
    stick(v, [bx + 0.05, PL + 0.26, bz], [bx + 0.24, PL + 0.36, bz + 0.05], 0.02, C.woodD);
    prism(v, bx + 0.02, PL + 0.25, bz, 0.05, 0.04, 0.05, C.tinD, 8);
    stick(v, [-0.75, PL + 0.02, FZ + 0.12], [-0.68, PL + 1.35, FZ + 0.06], 0.03, C.bamboo); // broom
    for (let k = 0; k < 6; k++) boxR(v, -0.76 + (k - 2.5) * 0.02, PL + 0.14, FZ + 0.12, 0.018, 0.26, 0.02, C.twine, 0, 0, (k - 2.5) * 0.06);
  }
  // a chilli bush in a tin by the right of the step
  prism(v, 2.0, PL + 0.11, FZ + 0.28, 0.1, 0.09, 0.22, C.tinD, 8);
  for (let k = 0; k < 8; k++) v.box(2.0 + Math.cos(k * 0.8) * 0.08, PL + 0.28 + (k % 3) * 0.06, FZ + 0.28 + Math.sin(k * 0.8) * 0.07, 0.09, 0.08, 0.09, k % 2 ? C.leafD : C.leaf);
  for (let k = 0; k < 4; k++) v.box(2.0 + Math.cos(k * 1.7) * 0.1, PL + 0.36, FZ + 0.33 + Math.sin(k * 1.7) * 0.05, 0.025, 0.06, 0.025, '#C0342A');
  // a small bracket lamp left of the door
  const LX = -DW / 2 - 0.4, LY = PL + DH - 0.05;
  v.box(LX, LY + 0.3, FZ + 0.06, 0.04, 0.04, 0.24, C.iron);
  v.box(LX, LY + 0.2, FZ + 0.17, 0.03, 0.18, 0.03, C.iron);
  prism(v, LX, LY + 0.08, FZ + 0.17, 0.05, 0.13, 0.08, C.tarp, 8);
  root.add(v.mesh());

  // light behind the curtain and the window, the lamp bulb
  const g = glow('#3A2E24', '#FFCF86');
  const gv = new VoxelBuilder();
  gv.box(0, PL + DH / 2, FZ - 0.19, DW, DH, 0.01, '#FFFFFF');
  gv.box(WX, WY0 + WH / 2, FZ - 0.19, WW, WH, 0.01, '#FFFFFF');
  gv.box(LX, LY + 0.02, FZ + 0.17, 0.07, 0.06, 0.07, '#FFFFFF');
  root.add(glowMesh(gv, g));
  // shapes against the window light: a ladle rail and a hanging basket
  const sv = new VoxelBuilder();
  sv.box(WX, WY0 + WH - 0.12, FZ - 0.17, WW - 0.1, 0.025, 0.02, '#3A2A20');
  for (let k = 0; k < 4; k++) { sv.box(WX - 0.36 + k * 0.12, WY0 + WH - 0.28, FZ - 0.17, 0.012, 0.3, 0.01, '#3A2A20'); prism(sv, WX - 0.36 + k * 0.12, WY0 + WH - 0.44, FZ - 0.17, 0.04, 0.03, 0.04, '#3A2A20', 6); }
  prism(sv, WX + 0.32, WY0 + 0.32, FZ - 0.16, 0.14, 0.1, 0.12, '#4A3628', 8);
  root.add(sv.mesh({ outline: false }));
  const lampHalo = halo(0.9, 0.9);
  lampHalo.position.set(LX, LY, FZ + 0.3);
  root.add(lampHalo);
  const pool = halo(2.0, 1.4, true);
  pool.position.set(0, PL + 0.02, FZ + 0.55);
  root.add(pool);

  // the faded cloth curtain in the doorway (sways from a rod)
  const rod = new THREE.Group();
  rod.position.set(0, PL + DH - 0.02, FZ - 0.1);
  root.add(rod);
  {
    const cv2 = new VoxelBuilder();
    cv2.box(0, 0.02, 0, DW + 0.08, 0.03, 0.03, C.bambooD);
    const CL = 1.25, PW = (DW - 0.04) / 3;
    for (let i = 0; i < 3; i++) {
      const x = -DW / 2 + 0.02 + PW * (i + 0.5);
      const base = i === 1 ? '#A85A52' : '#9E5048';
      cv2.box(x, -CL / 2, 0.02, PW - 0.02, CL, 0.012, base);
      cv2.box(x, -0.07, 0.028, PW - 0.02, 0.06, 0.006, '#C98C72');
      cv2.box(x, -CL + 0.1, 0.028, PW - 0.02, 0.16, 0.006, '#E8D4B0'); // the cream hem band
      cv2.box(x, -CL + 0.06, 0.03, PW - 0.02, 0.025, 0.006, '#C98C72');
      for (let k = 0; k < 4; k++) cv2.box(x - PW / 2 + 0.06 + k * (PW - 0.12) / 3, -CL * 0.5, 0.027, 0.014, CL * 0.6, 0.004, shade(base, 0.86)); // folds
      for (let k = 0; k < 3; k++) cv2.box(x - PW / 2 + 0.03 + k * (PW - 0.06) / 2, 0.0, 0.03, 0.02, 0.05, 0.02, C.brassD); // rings
    }
    // a bowl with steam lines printed on the middle panel (faded cream)
    const BX = 0, BY = -0.52;
    cv2.box(BX, BY, 0.03, 0.2, 0.04, 0.006, '#E8D4B0');
    cv2.box(BX, BY - 0.05, 0.03, 0.14, 0.05, 0.006, '#E8D4B0');
    cv2.box(BX, BY - 0.09, 0.03, 0.08, 0.025, 0.006, '#E8D4B0');
    for (const sx of [-0.05, 0, 0.05]) cv2.box(BX + sx, BY + 0.1, 0.03, 0.014, 0.1, 0.006, '#E8D4B0');
    stick(cv2, [BX + 0.02, BY + 0.02, 0.031], [BX + 0.14, BY + 0.2, 0.031], 0.012, '#E8D4B0'); // chopsticks
    stick(cv2, [BX + 0.05, BY + 0.02, 0.031], [BX + 0.17, BY + 0.18, 0.031], 0.012, '#E8D4B0');
    rod.add(cv2.mesh({ px: 1.2 }));
  }

  // the plank door hinged on the right jamb, swung out against the front wall
  const hinge = new THREE.Group();
  hinge.position.set(DW / 2, PL, FZ + 0.07);
  root.add(hinge);
  {
    const lv = new VoxelBuilder();
    const LW = DW - 0.04;
    for (let k = 0; k < 5; k++) lv.box(-LW / 2 + (k - 2) * (LW / 5), DH / 2, -0.04, LW / 5 - 0.01, DH - 0.02, 0.05, jitter('#8A6440', 0.06, k + 3));
    for (const y of [0.25, DH - 0.25]) lv.box(-LW / 2, y, -0.075, LW - 0.06, 0.12, 0.02, '#6E4E32');
    boxR(lv, -LW / 2, DH / 2, -0.075, 0.1, DH - 0.5, 0.02, '#6E4E32', 0, 0, Math.atan2(LW - 0.2, DH - 0.5));
    for (const y of [0.25, DH - 0.25]) lv.box(-0.12, y, -0.012, 0.22, 0.04, 0.01, C.iron);
    lv.box(-LW + 0.1, DH * 0.48, -0.005, 0.04, 0.12, 0.02, C.iron);
    hinge.add(lv.mesh());
  }

  // canvases: the board and the menu tags
  const board = canvasTex(1024, 214);
  const boardM = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), basic('#ffffff', { map: board.tex }));
  boardM.position.set(0, SY, FZ + 0.135);
  root.add(boardM);
  const tags = canvasTex(512, 384);
  const tagGeos = [];
  for (let i = 0; i < 3; i++) tagGeos.push(atlasQuad(TW, TH, MX, MT - TH / 2 - i * (TH + TG), FZ + 0.052, 0, 1 - (i + 1) / 3, 1, 1 - i / 3));
  const tagM = new THREE.Mesh(mergeGeometries(tagGeos), basic('#ffffff', { map: tags.tex }));
  for (const t of tagGeos) t.dispose();
  root.add(tagM);
  const tt = textOf(title);
  const paint = () => {
    drawBoard(board.cv, tt, { bg: '#F3E6C6', fg: C.maroon, rule: C.goldD, sprigs: false });
    const gg = board.g;
    // a steaming bowl either side instead of wheat
    for (const sx of [80, 944]) {
      gg.fillStyle = C.maroon;
      gg.beginPath(); gg.moveTo(sx - 38, 100); gg.lineTo(sx + 38, 100); gg.quadraticCurveTo(sx + 34, 150, sx, 152); gg.quadraticCurveTo(sx - 34, 150, sx - 38, 100); gg.fill();
      gg.strokeStyle = C.goldD; gg.lineWidth = 5;
      for (const dx of [-14, 0, 14]) { gg.beginPath(); gg.moveTo(sx + dx, 90); gg.bezierCurveTo(sx + dx - 9, 75, sx + dx + 9, 66, sx + dx, 50); gg.stroke(); }
    }
    drawMenuTags(tags.cv, menu);
    board.tex.needsUpdate = true; tags.tex.needsUpdate = true;
  };
  paint();
  fontsReady().then(paint);

  // the street counter at the kerb, left of the door
  let ctr = null;
  if (counter) {
    ctr = noodleCounter('street');
    ctr.root.position.set(-2.05, 0, FZ + 1.35);
    root.add(ctr.root);
  }
  const sh = shadowUnder(root, W * 0.58, D * 0.58, 0, 0.3, 0.36);
  let openT = 0, litT = 0, sway = 1;
  function setOpen(t) { openT = clamp01(t); hinge.rotation.y = ease(openT) * (Math.PI - 0.06); }
  function setLit(t) { litT = typeof t === 'boolean' ? (t ? 1 : 0) : clamp01(t); g.set(0.12 + litT * 0.88); setHalo(lampHalo, litT * 0.7); setHalo(pool, litT * 0.5); }
  setOpen(open);
  setLit(lit);
  root.userData.footprint = { w: W + 0.8, d: D + 2.4 };
  return {
    root, door: new THREE.Vector3(0, 0, FZ + 1.0), counter: ctr,
    setOpen, setLit,
    /** How much the curtain sways (0 still .. 1 a breeze). */
    setCurtain(a) { sway = clamp01(a); },
    update(dt, t) {
      rod.rotation.x = -(0.05 + Math.sin(t * 1.3) * 0.05 + Math.sin(t * 2.9) * 0.015) * sway;
      rod.rotation.z = Math.sin(t * 0.9) * 0.015 * sway;
      ctr?.update?.(dt, t);
    },
    dispose() {
      g.mat.dispose(); lampHalo.material.dispose(); pool.material.dispose(); board.tex.dispose(); tags.tex.dispose();
      boardM.material.dispose(); tagM.material.dispose(); sh.geometry.dispose(); ctr?.dispose?.(); disposeTree(root);
    },
  };
}
