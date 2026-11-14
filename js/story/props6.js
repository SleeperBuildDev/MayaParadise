// Story props for the last pages: the Blank Page and the Back Cover (Days 13-14), the launch evening
// (Day 15: the lights people carry, the paper plane, the launch tables and banner), shared small things
// (proof slips, invitations, booklets, the brass key, the storage pot) and the weather (rain, puddles).
// Same kit as props2.js: vertex-coloured boxes merged with VoxelBuilder (one toon draw call + one outline
// per moving part), Maya's palette, round things as 8-sided blocky prisms. Feet at y = 0, fronts face +Z.
// Lit parts (lamp glass, lantern paper, lit windows) live in the SAME mesh as the body: a vertex flag
// lifts them to a warm unlit colour by one uniform (setGlow / setLamp), so a light costs no extra draw call.
// No real lights. Every Burmese line here is a draft for Maya.
//
// The Blank Page / Back Cover
//   blankHedge(opts?)              { root, dispose }                       the Garden's last hedge, a gap, gravel -> two pencil lines
//   lodge()                        { root, door, doorPoint, setOpen(0..1), setLamp(0..1), setRain(0..1), update(dt, t), dispose }
//   houseBoard({ title, lines })   { root, setCover(bool), sign(who, lineNos), setText(title, lines), dispose }
//   oilLamp({ hung })              { root, setHung('low'|'high'), setGlow(0..1), update(dt, t), dispose }
//   gecko({ w, h })                { root, run(), settle(x, y), chirp(), update(dt, t), dispose }   (wall plane = local XY)
//   hairpin()                      { root, setGlint(0..1), update(dt, t), dispose }
//   footprints({ max, paper })     { root, walk(id, x, z, heading), step(x, z, heading, side, id), ink(), clear(), keptPoints(), update(dt), dispose }
//   backCover({ width, door })     { root, door, keyhole, setOpen(0..1), setInterior(0..1), dispose }
//   backCoverRoom({ shell, refs })  { root, slope, pigeonholes, plate, setFilled(k), setPlate(lines|null), dispose }   (Day 14 room)
//   writingSlope() / goldInkPot() / pigeonholes() { root, setFilled(k) } / referencePlate({ lines }) { root, setText(lines|null) }
// The launch evening (Day 15)
//   launchTable(cloth?)            { root, slots, dispose }
//   vase(stems?)                   { root, setStems(0..1), dispose }
//   bookletBox(n?)                 { root, setCount(n), dispose }
//   paperLantern({ color, word, pool }) { root, setGlow(0..1), setWord(text), update(dt, t), dispose }
//   guestLight(kind, { color, pool, word, size = 1.3, halo = 1.35 }) { root, kind, setGlow(0..1), spin(dt), update(dt, t), dispose }
//   createGlowPool({ max })        { mesh, add(anchor, size, color) -> slot, set(slot, glow), update(camera), dispose }
//   banner({ text, gap, posts })   { root, setText(text), update(dt, t), dispose }
//   teaTable()                     { root, update(dt, t), dispose }
//   paperPlane({ lines })          { root, setFold(0..1), update(dt, t), dispose }
// Shared
//   proofSlips({ n, text })        { root, setCount(n), dispose }
//   invitationStack({ n, single }) { root, setCount(n), dispose }
//   essayPage()                    { root, dispose }
//   bookletBundle()                { root, dispose }
//   brassKey(tag?)                 { root, setTag(text), dispose }
//   storagePot()                   { root, setLid(0..1), dispose }
// Weather
//   rainFx({ radius, height, count }) { root, setAmount(0..1), follow(vec3), update(dt, t), dispose }
//   puddles({ spots | n, area, seed }) { root, setWet(0..1), setRain(0..1), update(dt, t), dispose }
import * as THREE from '../game/three.js';
import { mergeGeometries } from '../game/three.js';
import { PALETTE, basic, blobShadow, fontsReady, FONT_MY, FONT_SANS, roundRect, gradientMap, addOutline } from '../game/toon.js';
import { VoxelBuilder, jitter } from '../game/voxel.js';

const C = {
  wood: PALETTE.wood, woodD: PALETTE.woodDark, woodL: '#CDA577', gold: PALETTE.gold, goldD: PALETTE.goldDeep, goldL: '#E2C477',
  maroon: PALETTE.maroon, maroonD: PALETTE.maroonDeep, maroonL: '#8A2E3A', cream: PALETTE.cream, white: PALETTE.white, ink: PALETTE.ink,
  paper: PALETTE.paper, parch: PALETTE.parchment, leaf: PALETTE.leaf, leafD: PALETTE.leafDark, leafL: '#8DBA6E', rose: PALETTE.rose,
  terra: '#B5643C', terraL: '#CB7E4E', terraD: '#8E4A2C', brick: '#A0503A', brickD: '#7E3C2B', mortar: '#C98D6E',
  iron: '#4A3B30', soot: '#2B1E19', mustard: '#E2B33C', pencil: '#6F6B66', pencilL: '#9C978F', bamboo: '#C9B26A', bambooD: '#A08A48',
  brass: '#D2A84A', brassD: '#9E7A2E', brassL: '#EED48A', glass: '#E8EEE8', tin: '#A9A39A', tinD: '#7E786F', grey: '#8C8378',
  blue: '#3E5C8A', blueL: '#7FA0C8', clay: '#C28A5C', clayD: '#9A6640', clayL: '#D8A57A', weath: '#8C6A4E', weathD: '#6E5340', weathL: '#A2805E',
};

// ---------------------------------------------------------------------------------------------
// small builders (same helpers as props2.js)
// ---------------------------------------------------------------------------------------------
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const _c = new THREE.Color(), _v2 = new THREE.Vector3(), _q2 = new THREE.Quaternion(), _camP = new THREE.Vector3();
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/** Box with any turn (Euler XYZ, radians) about its own centre. */
function boxR(v, x, y, z, w, h, d, col, rx = 0, ry = 0, rz = 0) {
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(w, h, d));
  v.add(UNIT, col, _m);
}

/** A thin closed triangular slab in the XZ plane (corners [x, z]), thickness t along Y. */
function triSlab(a, b, c, t) {
  const h = t / 2, P = [a, b, c];
  const pos = [];
  const v = (p, y) => pos.push(p[0], y, p[1]);
  // top (+Y) and bottom faces, wound both ways so one of each faces out
  const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const [p0, p1, p2] = cross < 0 ? [a, b, c] : [a, c, b];
  v(p0, h); v(p1, h); v(p2, h);
  v(p0, -h); v(p2, -h); v(p1, -h);
  const ring = [p0, p1, p2];
  for (let i = 0; i < 3; i++) {
    const q0 = ring[i], q1 = ring[(i + 1) % 3];
    v(q0, h); v(q0, -h); v(q1, h);
    v(q1, h); v(q0, -h); v(q1, -h);
  }
  void P;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
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
/** Prism by centre and size; optional turn (rx, ry, rz). */
function prism(v, x, y, z, rTop, rBot, h, col, seg = 8, ry = 0, rx = 0, rz = 0) {
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(1, 1, 1));
  v.add(prismGeo(rTop, rBot, h, seg), col, _m);
}

function shade(hex, f) {
  _c.set(hex);
  _c.r = Math.min(1, _c.r * f); _c.g = Math.min(1, _c.g * f); _c.b = Math.min(1, _c.b * f);
  return '#' + _c.getHexString(THREE.SRGBColorSpace);
}
function rand(seed = 1) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Writing, ruled lines and stamps: tiny flat boxes in their own merged mesh with NO outline (an
 *  outline hull round each 1 mm stroke reads as a black redaction bar on a phone). Empty -> nothing. */
function inkLayer(ink, parent) {
  if (!ink.parts.length) return null;
  const m = ink.mesh({ outline: false });
  parent.add(m);
  return m;
}
function shadowUnder(root, rx, rz, x = 0, z = 0, opacity = 0.5) {
  const s = blobShadow(rx, rz, opacity);
  s.position.x = x;
  s.position.z = z;
  root.add(s);
  return s;
}
/** Frees geometries (not shared ones), the listed extras, and detaches root. */
function disposeTree(root, own = []) {
  root.traverse((o) => { if (o.geometry && !o.userData.sharedGeo && !o.userData.isOutline) o.geometry.dispose(); });
  for (const x of own) x?.dispose?.();
  root.removeFromParent();
}

// ---------------------------------------------------------------------------------------------
// lit parts: one toon mesh whose flagged vertices glow by a uniform (no extra draw call)
// ---------------------------------------------------------------------------------------------
function glowMaterial(tint = '#FFC46E') {
  const m = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: gradientMap(), vertexColors: true });
  const u = { uGlow: { value: 0 }, uTint: { value: new THREE.Color(tint) } };
  m.onBeforeCompile = (s) => {
    s.uniforms.uGlow = u.uGlow;
    s.uniforms.uTint = u.uTint;
    s.vertexShader = s.vertexShader.replace('void main() {', 'attribute float aGlow;\nvarying float vGlowF;\nvoid main() {\n  vGlowF = aGlow;');
    s.fragmentShader = s.fragmentShader
      .replace('void main() {', 'uniform float uGlow;\nuniform vec3 uTint;\nvarying float vGlowF;\nvoid main() {')
      .replace('#include <opaque_fragment>', `{
        vec3 lit = mix(vColor.rgb, vec3(1.0), 0.35) * uTint * (0.75 + 1.25 * uGlow);
        outgoingLight = mix(outgoingLight, lit, clamp(vGlowF * uGlow * 1.6, 0.0, 1.0));
      }
      #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'p6-glowtoon';
  m.userData.u = u;
  return m;
}
function flagged(v, flag) {
  const g = v.geometry();
  const n = g.attributes.position.count;
  const a = new Float32Array(n);
  if (flag) a.fill(1);
  g.setAttribute('aGlow', new THREE.BufferAttribute(a, 1));
  return g;
}
/** One mesh from a body builder and a lit builder. Returns the mesh; mesh.userData.setGlow(v). */
function litMesh(body, lit, { px = 1.6, tint, outline = true } = {}) {
  const parts = [];
  if (body.parts.length) parts.push(flagged(body, 0));
  if (lit.parts.length) parts.push(flagged(lit, 1));
  const geo = parts.length > 1 ? mergeGeometries(parts, false) : parts[0];
  for (const p of parts) if (p !== geo) p.dispose();
  geo.computeBoundingSphere();
  const mat = glowMaterial(tint);
  const mesh = new THREE.Mesh(geo, mat);
  if (outline) addOutline(mesh, { px });
  mesh.userData.setGlow = (g) => { mat.userData.u.uGlow.value = g; };
  mesh.userData.ownMat = mat;
  return mesh;
}

// soft additive halo (shared texture) and a four-point sparkle (Maya's motif)
let haloTex = null, sparkTex = null;
function halo() {
  if (haloTex) return haloTex;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  // a smooth, nearly gaussian falloff (no visible rings where many halos overlap)
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (let k = 0; k <= 12; k++) {
    const t = k / 12, a = 0.62 * Math.exp(-t * t * 5.2) * (1 - t * t);
    grd.addColorStop(t, `rgba(255,${Math.round(232 - 80 * t)},${Math.round(176 - 120 * t)},${a.toFixed(3)})`);
  }
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  haloTex = new THREE.CanvasTexture(cv);
  haloTex.colorSpace = THREE.SRGBColorSpace;
  return haloTex;
}
function spark() {
  if (sparkTex) return sparkTex;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  g.fillStyle = '#fff';
  g.beginPath();
  g.moveTo(32, 2); g.quadraticCurveTo(35, 29, 62, 32); g.quadraticCurveTo(35, 35, 32, 62); g.quadraticCurveTo(29, 35, 2, 32); g.quadraticCurveTo(29, 29, 32, 2);
  g.fill();
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 14);
  grd.addColorStop(0, 'rgba(255,255,255,0.9)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  sparkTex = new THREE.CanvasTexture(cv);
  sparkTex.colorSpace = THREE.SRGBColorSpace;
  return sparkTex;
}
/** A standalone glow sprite (one draw call). Use createGlowPool for crowds of lights. */
function haloSprite(size, color = '#FFC878') {
  const mat = new THREE.SpriteMaterial({ map: halo(), color: new THREE.Color(color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 });
  const s = new THREE.Sprite(mat);
  s.scale.setScalar(size);
  s.renderOrder = 3;
  s.raycast = () => {};
  s.visible = false;
  return s;
}

/**
 * One instanced, camera-facing halo quad for many lights (the launch crowd): one draw call for all.
 * Add the mesh to the scene root (identity transform). Each light registers an anchor Object3D.
 */
export function createGlowPool({ max = 48, scale = 2.0 } = {}) {
  const geo = new THREE.PlaneGeometry(1, 1);
  const mat = new THREE.MeshBasicMaterial({ map: halo(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const mesh = new THREE.InstancedMesh(geo, mat, max);
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  mesh.raycast = () => {};
  mesh.count = 0;
  mesh.setColorAt(0, _c.set(0, 0, 0));
  const anchors = [], sizes = new Float32Array(max), glows = new Float32Array(max), cols = [];
  for (let i = 0; i < max; i++) cols.push(new THREE.Color());
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < max; i++) mesh.setMatrixAt(i, zero);
  return {
    mesh,
    add(anchor, size = 0.5, color = '#FFC878') {
      const i = anchors.length;
      if (i >= max) return -1;
      anchors.push(anchor);
      sizes[i] = size * scale;
      cols[i].set(color);
      mesh.count = anchors.length;
      return i;
    },
    set(slot, glow) { if (slot >= 0) glows[slot] = glow; },
    update(camera) {
      // world-space camera (it may sit under a rig or a follow group, not the scene root)
      camera.updateWorldMatrix(true, false);
      camera.matrixWorld.decompose(_camP, _q2, _s);
      for (let i = 0; i < anchors.length; i++) {
        const g = glows[i];
        const a = anchors[i];
        if (g < 0.01 || !a.parent) { mesh.setMatrixAt(i, zero); continue; }
        a.getWorldPosition(_p);
        const sc = sizes[i] * (0.65 + 0.35 * g);
        // pull the quad half its size toward the camera so it does not cut into the ground or a wall
        _v2.subVectors(_camP, _p);
        const dd = _v2.length();
        if (dd > 1e-3) _p.addScaledVector(_v2, Math.min(sc * 0.28, dd * 0.5) / dd);
        _m.compose(_p, _q2, _s.set(sc, sc, sc));
        mesh.setMatrixAt(i, _m);
        mesh.setColorAt(i, _c.copy(cols[i]).multiplyScalar(g));
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
    dispose() { geo.dispose(); mat.dispose(); mesh.removeFromParent(); },
  };
}
/** Glow handle for a light: pool slot when a pool is given, else its own sprite under `parent`. */
function glowHandle(parent, pos, size, color, pool) {
  size *= 0.72;
  const anchor = new THREE.Object3D();
  anchor.position.copy(pos);
  parent.add(anchor);
  if (pool) {
    const slot = pool.add(anchor, size, color);
    return { anchor, set(g) { pool.set(slot, g); }, dispose() { pool.set(slot, 0); } };
  }
  const s = haloSprite(size, color);
  anchor.add(s);
  return {
    anchor,
    set(g) { s.material.opacity = clamp(g, 0, 1) * 0.9; s.visible = g > 0.01; s.scale.setScalar(size * (0.7 + 0.3 * g)); },
    dispose() { s.material.dispose(); },
  };
}

// small canvas helper
function canvasTex(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { cv, g: cv.getContext('2d'), tex };
}
/** A pencil scribble that reads as handwriting at a distance (no real words). */
function scribble(g, x, y, w, size, color, seed = 1, alpha = 1) {
  const r = rand(seed);
  g.save();
  g.globalAlpha = alpha;
  g.strokeStyle = color;
  g.lineWidth = Math.max(1, size * 0.11);
  g.lineCap = 'round';
  g.beginPath();
  let xx = x;
  g.moveTo(xx, y);
  while (xx < x + w) {
    const step = size * (0.25 + r() * 0.3);
    const up = (r() - 0.35) * size * 0.75;
    g.quadraticCurveTo(xx + step * 0.5, y - up, xx + step, y + (r() - 0.5) * size * 0.15);
    xx += step;
    if (r() < 0.12) { xx += size * 0.4; g.moveTo(xx, y); }
  }
  g.stroke();
  g.restore();
}

// =============================================================================================
// THE BLANK PAGE
// =============================================================================================

/**
 * The Diary Garden's last hedge (6 x 1.6 m) with a gap in the middle. The gravel path (on +Z, the
 * garden side) thins out at the gap; past it (-Z) the path goes on as two faint pencil lines.
 */
export function blankHedge({ len = 6, gap = 1.3, path = 3.0, seed = 7 } = {}) {
  const root = new THREE.Group();
  root.name = 'blankHedge';
  const r = rand(seed);
  const v = new VoxelBuilder();
  const D = 0.9, H = 1.38;
  // the hedge as a row of overlapping rounded mounds (stacked 8-sided tiers, darker low, lighter on
  // top), leaf flecks on their skins, small white blossoms on the garden face
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -len / 2 : gap / 2, x1 = sx < 0 ? -gap / 2 : len / 2;
    v.box((x0 + x1) / 2, 0.06, 0, x1 - x0, 0.12, D - 0.1, '#3E6236'); // dark foot (fake AO)
    const n = Math.max(2, Math.round((x1 - x0) / 0.46));
    for (let i = 0; i < n; i++) {
      const x = x0 + 0.3 + (i * (x1 - x0 - 0.6)) / (n - 1) + (r() - 0.5) * 0.06;
      const hs = 0.92 + r() * 0.16, z = (i % 2 ? 0.05 : -0.05) + (r() - 0.5) * 0.04, ry = r();
      const tiers = [[0.44, 0.3, '#46703C'], [0.48, 0.4, C.leafD], [0.47, 0.26, '#5E8E4E'], [0.41, 0.17, C.leaf], [0.31, 0.11, '#7FAE62'], [0.17, 0.06, C.leafL]];
      let y = 0.04;
      tiers.forEach(([rr, h, col], k) => {
        prism(v, x, y + (h * hs) / 2, z, rr, k ? tiers[k - 1][0] * 0.98 : rr * 0.9, h * hs, jitter(col, 0.05, i * 7 + k + sx), 8, ry);
        y += h * hs;
      });
      // leaf flecks on the upper skin, lighter; a few dark hollows lower down
      for (let k = 0; k < 14; k++) {
        const a = r() * Math.PI * 2, up = 0.35 + r() * 0.6;
        const rr = up > 0.8 ? 0.3 : 0.47, yy = 0.15 + up * (y - 0.2);
        boxR(v, x + Math.sin(a) * rr, yy, z + Math.cos(a) * rr, 0.09, 0.035, 0.06, up > 0.6 ? (r() < 0.5 ? C.leafL : '#A5CC80') : '#5E8E4E', r() * 0.6, a, r() * 0.5);
      }
      for (let k = 0; k < 3; k++) { const a = r() * 1.6 - 0.8; v.box(x + Math.sin(a) * 0.47, 0.3 + r() * 0.4, z + Math.cos(a) * 0.47, 0.08, 0.07, 0.03, '#2F4E2A', a); }
      // blossoms on the +Z (garden) face
      for (let k = 0; k < 4; k++) {
        const a = (r() - 0.5) * 1.6, yy = 0.4 + r() * 0.8, rr = yy > 1.1 ? 0.4 : 0.49;
        const col = r() < 0.78 ? C.white : C.rose;
        v.box(x + Math.sin(a) * rr, yy, z + Math.cos(a) * rr + 0.01, 0.05, 0.05, 0.03, col, a + 0.785);
        v.box(x + Math.sin(a) * (rr + 0.015), yy, z + Math.cos(a) * (rr + 0.015) + 0.01, 0.018, 0.018, 0.018, C.mustard);
      }
      if (r() < 0.4) v.box(x + (r() - 0.5) * 0.3, y + 0.08, z, 0.025, 0.16, 0.025, C.leafL); // a shoot that got away
    }
    // at the gap: a couple of bare woody stems showing at the foot
    const ex = sx < 0 ? -gap / 2 : gap / 2;
    for (let k = 0; k < 3; k++) boxR(v, ex - sx * 0.02, 0.22, -0.2 + k * 0.2, 0.035, 0.4, 0.035, '#6E5038', 0, 0, sx * (0.15 + k * 0.08));
  }
  root.add(v.mesh());

  // ground: gravel (garden side, +Z) running out at the gap; two pencil lines beyond (-Z). No outline.
  const g = new VoxelBuilder();
  const PW = 1.1;
  g.boxMin(-PW / 2, 0, D / 2 + 0.02, PW / 2, 0.012, path, '#D8C8A2'); // packed earth under the gravel
  for (const sx of [-1, 1]) for (let z = D / 2 + 0.2; z < path - 0.1; z += 0.3) {
    g.box(sx * (PW / 2 + 0.04), 0.03, z + (r() - 0.5) * 0.05, 0.1, 0.06, 0.22, jitter('#CFC6B4', 0.07, z * 5 + sx)); // edging stones
  }
  const greys = ['#B7AE9E', '#9C9384', '#CBC2B0', '#8E8576', '#D9D0BF', '#A89A82'];
  for (let i = 0; i < 260; i++) {
    const z = D / 2 - 0.15 + Math.pow(r(), 0.55) * (path - D / 2 + 0.1); // dense far out, sparse at the gap
    const thin = clamp((z - D / 2) / 1.2, 0.12, 1);
    if (r() > thin) continue;
    const s = 0.03 + r() * 0.04;
    g.box((r() - 0.5) * PW * 0.95, 0.012 + s * 0.3, z, s, s * 0.6, s * (0.8 + r() * 0.5), greys[Math.floor(r() * greys.length)], r() * 3);
  }
  // a few stray pebbles in the gap and just past it
  for (let i = 0; i < 9; i++) g.box((r() - 0.5) * 0.9, 0.015, D / 2 - r() * 1.4, 0.03, 0.02, 0.03, greys[i % greys.length], r());
  // the two pencil lines: faint, a little wobbly, darker where pressed harder
  for (const sx of [-1, 1]) {
    let x = sx * 0.4;
    for (let z = -D / 2 + 0.25; z > -path; z -= 0.22) {
      const nx = sx * 0.4 + (r() - 0.5) * 0.035;
      const len = Math.hypot(0.22, nx - x);
      boxR(g, (x + nx) / 2, 0.004, z - 0.11, 0.022, 0.004, len + 0.01, r() < 0.3 ? C.pencil : C.pencilL, 0, Math.atan2(nx - x, 0.22), 0);
      x = nx;
    }
  }
  const ground = g.mesh({ outline: false });
  root.add(ground);
  // one soft shadow under each half, none in the gap (the gap must read as open ground)
  const half = (len - gap) / 2;
  const shs = [-1, 1].map((sx) => shadowUnder(root, half * 0.62, 0.72, sx * (gap / 2 + half / 2), 0.1, 0.42));
  return { root, dispose() { for (const s of shs) s.geometry.dispose(); disposeTree(root); } };
}

/**
 * The travellers' lodge (closed shell, 9 x 3.4 x 4.4 m): a long low wooden house on short posts, a
 * plain pitched roof (no tiers, no finial), a verandah with a bench, one plank door mid-front with a
 * lantern on a hook beside it, shutters propped open either side (lamplight), a side chimney with smoke.
 * Not a religious building. The door is the `lodge` room door (doorPoint: where Maya stands to enter).
 */
export function lodge() {
  const root = new THREE.Group();
  root.name = 'lodge';
  const r = rand(13);
  const v = new VoxelBuilder(), lit = new VoxelBuilder();
  const X = 4.5, ZF = 0.6, ZB = -2.0, FL = 0.42, VZ = 1.85; // half length, front/back wall, floor top, verandah edge
  const RZ = -0.7, RY = 3.6, EZF = 1.05, EZB = -2.45, EY = 2.75; // ridge z/y, eaves (short front eave: the camera sees the verandah)
  const wd = [C.wood, '#A57C50', '#BC9363', '#AD8457'];
  // posts and the raised floor
  for (let x = -X + 0.15; x <= X - 0.1; x += 1.45) for (const z of [ZB + 0.1, ZF - 0.05, VZ - 0.1]) {
    v.box(x, 0.06, z, 0.24, 0.12, 0.24, jitter('#B9AE9A', 0.06, x + z)); // stone foot
    v.box(x, 0.12 + (FL - 0.18) / 2, z, 0.14, FL - 0.18, 0.14, C.woodD);
  }
  v.boxMin(-X - 0.05, FL - 0.1, ZB - 0.05, X + 0.05, FL - 0.04, VZ, C.woodD); // floor beams
  v.boxMin(-X, 0.14, ZF + 0.02, X, FL - 0.1, ZF + 0.06, '#5E4330'); // shadowed skirt under the front wall
  // verandah boards (run along X, rows along Z), seams between
  for (let i = 0, z = ZF; z < VZ - 0.01; z += 0.2, i++) {
    v.boxMin(-X - 0.05, FL - 0.04, z + 0.008, X + 0.05, FL, z + 0.192, jitter(wd[i % 4], 0.05, i));
  }
  v.boxMin(-X - 0.07, FL - 0.1, VZ - 0.04, X + 0.07, FL + 0.01, VZ + 0.02, C.woodD); // nosing
  // steps up to the verandah, centred on the door
  for (let k = 0; k < 2; k++) v.boxMin(-0.75, 0, VZ + 0.02 + (1 - k) * 0.28, 0.75, 0.15 + k * 0.14, VZ + 0.3 + (1 - k) * 0.28, jitter(wd[k + 1], 0.04, k + 30));
  v.box(-0.45, 0.31, VZ + 0.25, 0.26, 0.03, 0.12, '#6E4E30', 0.15); // a pair of sandals left on the step
  v.box(-0.18, 0.31, VZ + 0.24, 0.26, 0.03, 0.12, '#6E4E30', -0.1);
  v.box(-0.45, 0.33, VZ + 0.21, 0.08, 0.02, 0.02, C.maroon, 0.15);
  v.box(-0.18, 0.33, VZ + 0.2, 0.08, 0.02, 0.02, C.maroon, -0.1);

  // walls: horizontal weatherboards with a lip, darker corner posts
  const wallTopF = 2.78, wallTopB = 2.5;
  const boards = (x0, x1, z, y0, y1, face, skip) => {
    for (let y = y0, i = 0; y < y1 - 0.01; y += 0.21, i++) {
      const yt = Math.min(y + 0.21, y1);
      const segs = skip ? skip(y, yt) : [[x0, x1]];
      for (const [a, b] of segs) {
        if (b - a < 0.02) continue;
        v.boxMin(a, y, z - 0.05, b, yt, z + 0.05, jitter(wd[i % 4], 0.05, i * 3 + z));
        v.boxMin(a, y, z + face * 0.05, b, y + 0.025, z + face * 0.068, shade(wd[i % 4], 0.78)); // the lap shadow
      }
    }
  };
  // window and door openings in the front wall
  const WIN = [-3.35, -1.75, 1.75, 3.35], WW = 0.82, WY0 = 1.15, WY1 = 1.9, DW = 0.96, DH = 1.95;
  const holes = [[-DW / 2 - 0.08, DW / 2 + 0.08, FL, FL + DH + 0.08], ...WIN.map((x) => [x - WW / 2 - 0.06, x + WW / 2 + 0.06, WY0 - 0.06, WY1 + 0.06])];
  boards(-X, X, ZF, FL, wallTopF, 1, (y0, y1) => {
    let segs = [[-X, X]];
    for (const [a, b, h0, h1] of holes) {
      if (y1 <= h0 || y0 >= h1) continue;
      const next = [];
      for (const [s0, s1] of segs) { if (b <= s0 || a >= s1) next.push([s0, s1]); else { if (a > s0) next.push([s0, a]); if (b < s1) next.push([b, s1]); } }
      segs = next;
    }
    return segs;
  });
  boards(-X, X, ZB, FL, wallTopB, -1);
  for (const sx of [-1, 1]) {
    for (let y = FL, i = 0; y < 2.5; y += 0.21, i++) v.boxMin(sx * X - 0.05, y, ZB, sx * X + 0.05, Math.min(y + 0.21, 2.6), ZF, jitter(wd[(i + 1) % 4], 0.05, i + sx * 7));
    // gable: stepped boards up to the ridge
    for (let y = 2.5, i = 0; y < RY - 0.08; y += 0.18, i++) {
      const half = ((RY - y) / (RY - EY)) * (EZF - RZ) * 0.98;
      const z0 = Math.max(ZB, RZ - half), z1 = Math.min(ZF, RZ + half);
      if (z1 - z0 > 0.05) v.boxMin(sx * X - 0.05, y, z0, sx * X + 0.05, y + 0.18, z1, jitter(wd[i % 4], 0.05, i * 5 + sx));
    }
    v.box(sx * (X + 0.06), 3.0, RZ, 0.04, 0.16, 0.16, C.soot); // a little gable vent
    for (const z of [ZB, ZF]) v.box(sx * X, 1.55, z, 0.16, 2.3, 0.16, C.woodD); // corner posts
  }
  v.boxMin(-X, wallTopF - 0.02, ZF - 0.07, X, 2.97, ZF + 0.07, C.woodD); // wall plate under the roof
  // door frame and lintel
  for (const sx of [-1, 1]) v.box(sx * (DW / 2 + 0.06), FL + DH / 2 + 0.04, ZF + 0.07, 0.12, DH + 0.08, 0.06, C.woodD);
  v.box(0, FL + DH + 0.1, ZF + 0.08, DW + 0.34, 0.12, 0.08, C.woodD);
  v.box(0, FL + 0.02, ZF + 0.05, DW + 0.1, 0.04, 0.12, '#5E4330'); // threshold
  lit.boxMin(-DW / 2, FL, ZF - 0.08, DW / 2, FL + DH, ZF - 0.06, '#E9C78A'); // warm room behind the door (shows when open)
  // windows: frames, sills, mullions, a warm pane behind, a top-hinged shutter propped out on a stick
  WIN.forEach((x, i) => {
    lit.boxMin(x - WW / 2, WY0, ZF - 0.03, x + WW / 2, WY1, ZF - 0.01, i === 1 ? '#F0D29A' : '#EBCB90');
    v.box(x, (WY0 + WY1) / 2, ZF - 0.0, 0.04, WY1 - WY0, 0.04, C.woodD); // mullion
    v.box(x, (WY0 + WY1) / 2, ZF - 0.0, WW, 0.035, 0.04, C.woodD);
    for (const sx of [-1, 1]) v.box(x + sx * (WW / 2 + 0.035), (WY0 + WY1) / 2, ZF + 0.07, 0.07, WY1 - WY0 + 0.12, 0.06, C.woodD);
    v.box(x, WY0 - 0.05, ZF + 0.1, WW + 0.2, 0.06, 0.16, C.woodL); // sill
    v.box(x, WY1 + 0.05, ZF + 0.08, WW + 0.2, 0.07, 0.1, C.woodD); // head
    // a silhouette inside one or two windows: a hanging cloth, a jar on the sill
    if (i === 0) v.box(x - 0.18, WY0 + 0.2, ZF - 0.02, 0.18, 0.3, 0.01, '#B8834E');
    if (i === 2) v.box(x + 0.22, WY0 + 0.08, ZF + 0.12, 0.1, 0.12, 0.1, C.terra);
    // two plank shutters swung open on side hinges, angled a little off the wall, hook-and-eye stays
    for (const sx of [-1, 1]) {
      const SW = WW / 2, a = sx * 0.35;
      const hx = x + sx * (WW / 2 + 0.07), cx = hx + sx * Math.cos(0.35) * SW / 2, cz = ZF + 0.1 + Math.sin(0.35) * SW / 2;
      for (let k = 0; k < 2; k++) {
        const off = (k - 0.5) * SW / 2;
        v.box(cx + Math.cos(a) * off * sx, (WY0 + WY1) / 2, cz - Math.sin(a) * off * sx * sx * sx, SW / 2 - 0.008, WY1 - WY0 + 0.08, 0.035, jitter(i % 2 ? '#8A6448' : '#7D5A3E', 0.07, i * 4 + k + sx), -a);
      }
      for (const yy of [WY0 + 0.1, WY1 - 0.1]) v.box(cx, yy, cz + 0.022, SW - 0.04, 0.05, 0.02, '#5E4330', -a);
      v.box(cx + sx * Math.cos(0.35) * SW * 0.42, (WY0 + WY1) / 2, cz + Math.sin(0.35) * SW * 0.42 + 0.02, 0.025, 0.025, 0.025, C.iron);
    }
  });

  // the open verandah: low rails at both ends on short posts with finials
  const eaveAt = (z) => RY - ((z - RZ) / (EZF - RZ)) * (RY - EY);
  for (const [a, b] of [[-X + 0.05, -2.3], [2.3, X - 0.05]]) {
    for (const x of [a, b]) { v.box(x, FL + 0.4, VZ - 0.1, 0.11, 0.8, 0.11, C.wood); v.box(x, FL + 0.83, VZ - 0.1, 0.15, 0.06, 0.15, C.woodD); }
    v.boxMin(a, FL + 0.66, VZ - 0.14, b, FL + 0.72, VZ - 0.06, C.woodL);
    v.boxMin(a, FL + 0.16, VZ - 0.13, b, FL + 0.2, VZ - 0.07, C.wood);
    for (let x = a + 0.2; x < b - 0.1; x += 0.2) v.box(x, FL + 0.43, VZ - 0.1, 0.045, 0.46, 0.045, jitter(C.woodL, 0.06, x * 7));
  }
  for (const sx of [-1, 1]) { v.box(sx * 0.8, FL + 0.45, VZ - 0.1, 0.1, 0.9, 0.1, C.wood); v.box(sx * 0.8, FL + 0.93, VZ - 0.1, 0.14, 0.06, 0.14, C.woodD); v.box(sx * 0.8, FL + 1.0, VZ - 0.1, 0.06, 0.08, 0.06, C.gold); }
  // bench against the wall left of the door, a rolled mat, a water jar and cup at the right end, a broom
  // (a low seat with a back rail, so from above it reads as a bench, not a table)
  v.boxMin(-2.95, FL + 0.34, ZF + 0.14, -1.25, FL + 0.4, ZF + 0.46, C.woodL);
  v.boxMin(-2.95, FL + 0.3, ZF + 0.45, -1.25, FL + 0.34, ZF + 0.47, C.woodD); // front apron
  for (const x of [-2.82, -1.38]) for (const z of [ZF + 0.2, ZF + 0.4]) v.boxMin(x - 0.035, FL, z - 0.035, x + 0.035, FL + 0.34, z + 0.035, C.woodD);
  for (const x of [-2.82, -1.38]) v.boxMin(x - 0.03, FL + 0.08, ZF + 0.2, x + 0.03, FL + 0.12, ZF + 0.4, C.woodD); // side stretchers
  v.boxMin(-2.82, FL + 0.08, ZF + 0.28, -1.38, FL + 0.12, ZF + 0.32, C.woodD);
  for (const x of [-2.92, -2.1, -1.28]) v.boxMin(x - 0.03, FL + 0.4, ZF + 0.14, x + 0.03, FL + 0.9, ZF + 0.19, C.woodD); // back uprights
  v.boxMin(-2.97, FL + 0.82, ZF + 0.12, -1.23, FL + 0.92, ZF + 0.2, C.wood); // top back rail
  v.boxMin(-2.95, FL + 0.6, ZF + 0.13, -1.25, FL + 0.64, ZF + 0.19, C.wood);  // lower back rail
  for (let x = -2.8; x < -1.3; x += 0.14) if (Math.abs(x + 2.1) > 0.05) v.boxMin(x - 0.018, FL + 0.64, ZF + 0.15, x + 0.018, FL + 0.82, ZF + 0.18, C.woodL); // back slats
  for (const x of [-2.95, -1.25]) { // arm rests: a bench, not a table, even from above
    v.boxMin(x - 0.03, FL + 0.4, ZF + 0.42, x + 0.03, FL + 0.6, ZF + 0.46, C.woodD);
    v.boxMin(x - 0.045, FL + 0.6, ZF + 0.14, x + 0.045, FL + 0.64, ZF + 0.5, C.wood);
  }
  v.box(-2.5, FL + 0.43, ZF + 0.3, 0.6, 0.05, 0.28, C.maroon); // a long seat cushion
  v.box(-2.5, FL + 0.458, ZF + 0.3, 0.56, 0.01, 0.02, C.gold);
  v.box(-2.5, FL + 0.5, ZF + 0.22, 0.26, 0.14, 0.07, '#D9B98A', 0.0); // a small back cushion
  v.box(-1.6, FL + 0.43, ZF + 0.3, 0.09, 0.06, 0.09, '#E7E1D4'); // a cup
  prism(v, -3.9, FL + 0.55, ZF + 0.25, 0.12, 0.12, 1.1, '#C9B07A', 8, 0, 0, 0.12); // rolled mat leaning on the wall
  prism(v, -3.9, FL + 0.55, ZF + 0.25, 0.125, 0.125, 0.04, C.maroon, 8, 0, 0, 0.12);
  v.box(3.6, FL + 0.2, ZF + 0.35, 0.36, 0.4, 0.36, C.woodD); // jar stand
  prism(v, 3.6, FL + 0.55, ZF + 0.35, 0.16, 0.13, 0.3, C.terra);
  prism(v, 3.6, FL + 0.73, ZF + 0.35, 0.1, 0.16, 0.08, C.terraD);
  prism(v, 3.6, FL + 0.79, ZF + 0.35, 0.12, 0.12, 0.03, C.woodL); // lid
  v.box(3.6, FL + 0.83, ZF + 0.35, 0.08, 0.06, 0.08, C.tin); // tin cup
  boxR(v, 4.15, FL + 0.6, ZF + 0.18, 0.04, 1.2, 0.04, C.bamboo, 0, 0, -0.18); // broom
  boxR(v, 4.27, FL + 0.1, ZF + 0.18, 0.2, 0.22, 0.06, '#C9A860', 0, 0, -0.18);

  // roof: two slopes of weathered shingles in overlapping rows, barge boards, ridge cap, rafter tails
  // build the slopes by direct angles (front tilts down toward +Z, back toward -Z)
  const frontAng = Math.atan2(RY - EY, EZF - RZ), backAng = Math.atan2(RY - EY, RZ - EZB);
  const shingles = (zEave, ang, dir) => {
    const L = Math.hypot(zEave - RZ, RY - EY), rows = Math.ceil(L / 0.19), tones = ['#8A684C', '#7E5E44', '#94735A', '#866448'];
    for (let i = 0; i < rows; i++) {
      const d = (i + 0.55) * (L / rows);
      const z = RZ + dir * Math.cos(ang) * d, y = RY - Math.sin(ang) * d + 0.07 + (i % 2) * 0.01;
      for (let x = -X - 0.38 + (i % 2) * 0.12, k = 0; x < X + 0.38 - 0.02; k++) {
        const ww = Math.min(0.26 + r() * 0.14, X + 0.38 - x);
        const col = r() < 0.015 ? '#857C62' : jitter(tones[(i + k * 3 + (r() < 0.3 ? 1 : 0)) % 4], 0.035, i * 31 + k);
        boxR(v, x + ww / 2, y, z, ww - 0.016, 0.05, (L / rows) * 1.22, col, dir * ang, 0, 0);
        x += ww;
      }
    }
    boxR(v, 0, RY - Math.sin(ang) * L / 2 + 0.01, RZ + dir * Math.cos(ang) * L / 2, 2 * X + 0.78, 0.06, L, '#4F3828', dir * ang, 0, 0);
    // barge boards at both gable ends
    for (const sx of [-1, 1]) boxR(v, sx * (X + 0.4), RY - Math.sin(ang) * L / 2 + 0.06, RZ + dir * Math.cos(ang) * L / 2, 0.06, 0.18, L + 0.05, C.woodD, dir * ang, 0, 0);
    // fascia along the eave
    const ez = RZ + dir * Math.cos(ang) * L, ey = RY - Math.sin(ang) * L;
    v.box(0, ey + 0.02, ez + dir * 0.02, 2 * X + 0.86, 0.14, 0.06, C.woodD);
  };
  shingles(EZF, frontAng, 1);
  shingles(EZB, backAng, -1);
  v.boxMin(-X - 0.45, RY + 0.04, RZ - 0.14, X + 0.45, RY + 0.16, RZ + 0.14, '#5E4330'); // ridge cap
  for (let x = -X - 0.3; x < X + 0.4; x += 0.6) v.box(x, RY + 0.17, RZ, 0.5, 0.03, 0.3, shade('#5E4330', 1.12)); // cap joints
  for (let x = -X + 0.2; x < X; x += 0.62) v.box(x, eaveAt(EZF - 0.12) - 0.08, EZF - 0.12, 0.07, 0.07, 0.3, C.woodD); // rafter tails

  // the chimney at the east end: clay-brick stack with mortar lines and a cap
  const CX = X + 0.32, CZ = -1.0;
  v.box(CX, 0.5, CZ, 0.62, 1.0, 0.62, jitter(C.brick, 0.04, 1));
  for (let y = 1.0, i = 0; y < RY + 0.55; y += 0.17, i++) {
    v.box(CX, y + 0.085, CZ, 0.46, 0.17, 0.46, jitter(i % 2 ? C.brickD : C.brick, 0.05, i));
    v.box(CX, y + 0.168, CZ, 0.47, 0.012, 0.47, C.mortar);
  }
  v.box(CX, RY + 0.66, CZ, 0.58, 0.08, 0.58, C.brickD);
  v.box(CX, RY + 0.71, CZ, 0.3, 0.03, 0.3, C.soot);
  // firewood under the east eave, cut ends lighter
  for (let row = 0; row < 3; row++) for (let i = 0; i < 4 - row; i++) {
    const z = ZF + 0.35 + i * 0.13 + row * 0.065, y = 0.07 + row * 0.12;
    v.box(X + 0.45, y, z, 0.6, 0.11, 0.11, jitter(C.wood, 0.1, i * 3 + row));
    v.box(X + 0.751, y, z, 0.004, 0.08, 0.08, '#E2C29C');
  }

  // the lantern on its hook right of the door (iron frame, lit glass)
  const LX = DW / 2 + 0.42, LY = FL + 1.72, LZ = ZF + 0.2;
  v.box(LX, LY + 0.28, ZF + 0.1, 0.03, 0.03, 0.22, C.iron); // bracket
  v.box(LX, LY + 0.2, LZ, 0.012, 0.14, 0.012, C.iron);
  v.box(LX, LY + 0.12, LZ, 0.16, 0.03, 0.16, C.iron);
  v.box(LX, LY - 0.12, LZ, 0.14, 0.03, 0.14, C.iron);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) v.box(LX + dx * 0.06, LY, LZ + dz * 0.06, 0.018, 0.22, 0.018, C.iron);
  lit.box(LX, LY, LZ, 0.11, 0.2, 0.11, '#F6D9A0');
  prism(v, LX, LY + 0.17, LZ, 0.03, 0.09, 0.08, C.iron, 4, Math.PI / 4);
  // a painted name board by the steps
  const SX = -1.55, SZ = VZ + 0.75; // a standing name board on two legs, left of the steps
  for (const dx of [-0.5, 0.5]) { v.box(SX + dx, 0.55, SZ - 0.03, 0.07, 1.1, 0.07, C.woodD); v.box(SX + dx, 1.12, SZ - 0.03, 0.1, 0.05, 0.1, C.wood); }
  v.box(SX, 0.85, SZ, 1.2, 0.32, 0.05, C.wood);
  v.box(SX, 1.03, SZ + 0.01, 1.28, 0.05, 0.08, C.woodD);
  v.box(SX + 0.2, 0.04, SZ + 0.25, 0.22, 0.08, 0.16, C.terra); // a pot of herbs at its foot
  for (let k = 0; k < 5; k++) boxR(v, SX + 0.2 + (k - 2) * 0.03, 0.15, SZ + 0.25 + (k % 2) * 0.03, 0.04, 0.16, 0.02, k % 2 ? C.leaf : C.leafL, 0, k, (k - 2) * 0.2);
  const bodyMesh = litMesh(v, lit, { tint: '#FFC46E' });
  root.add(bodyMesh);
  const sg = canvasTex(512, 96);
  const drawSign = () => {
    const g = sg.g;
    g.fillStyle = '#EFE2C4'; g.fillRect(0, 0, 512, 96);
    g.strokeStyle = C.maroon; g.lineWidth = 6; g.strokeRect(8, 8, 496, 80);
    g.fillStyle = C.maroon; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 36px ${FONT_MY}`; g.fillText('ခရီးသည် တည်းခိုဆောင်', 256, 52, 470);
    sg.tex.needsUpdate = true;
  };
  drawSign();
  fontsReady().then(drawSign);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.26), basic('#ffffff', { map: sg.tex }));
  sign.position.set(SX, 0.85, SZ + 0.027);
  root.add(sign);

  // the plank door, hinged on its left jamb, opening inward (-Z)
  const hinge = new THREE.Group();
  hinge.position.set(-DW / 2, FL, ZF + 0.02);
  root.add(hinge);
  const dv = new VoxelBuilder();
  for (let i = 0; i < 4; i++) dv.box(DW * (i + 0.5) / 4, DH / 2, 0, DW / 4 - 0.008, DH - 0.01, 0.05, jitter('#8A6448', 0.07, i + 3));
  for (const yy of [0.32, DH - 0.32]) dv.box(DW / 2, yy, 0.035, DW - 0.06, 0.11, 0.025, '#6E4E30');
  boxR(dv, DW / 2, DH / 2, 0.035, 0.09, DH - 0.6, 0.022, '#6E4E30', 0, 0, -0.42); // Z brace
  dv.box(DW - 0.13, DH * 0.5, 0.06, 0.05, 0.12, 0.02, C.iron);
  dv.box(DW - 0.13, DH * 0.5 - 0.08, 0.075, 0.07, 0.07, 0.012, C.iron); // ring pull
  for (const yy of [0.32, DH - 0.32]) dv.box(0.08, yy, 0.05, 0.16, 0.05, 0.02, C.iron); // strap hinges
  const door = dv.mesh();
  hinge.add(door);

  // lamp pools: one merged additive decal for the lantern and the windows (dark hours)
  const poolGeo = mergeGeometries([[LX, LZ + 0.6, 1.7, 1.3], ...WIN.map((x) => [x, ZF + 0.9, 1.3, 1.0])].map(([x, z, w, d]) => {
    const p = new THREE.PlaneGeometry(w, d);
    p.rotateX(-Math.PI / 2);
    p.translate(x, FL + 0.012, z);
    return p;
  }), false);
  const poolMat = new THREE.MeshBasicMaterial({ map: halo(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0, color: new THREE.Color('#FFB866') });
  const pools = new THREE.Mesh(poolGeo, poolMat);
  pools.renderOrder = 1;
  pools.visible = false;
  root.add(pools);

  // chimney smoke: a thin rising line of soft puffs (one instanced mesh)
  const N = 7;
  const smokeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#D8D2C6'), transparent: true, opacity: 0.75, depthWrite: false });
  const smoke = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), smokeMat, N);
  smoke.frustumCulled = false;
  smoke.raycast = () => {};
  root.add(smoke);
  const top = new THREE.Vector3(CX, RY + 0.8, CZ);

  // rain off the front eave (setRain): drips falling to the verandah, little rings where they land, a wet line
  const DN = 34, DTOP = EY - 0.05, DZ = EZF + 0.04;
  const dA = new Float32Array(DN * 2);
  for (let i = 0; i < DN; i++) { dA[i * 2] = -X + 0.1 + ((i + 0.2 + r() * 0.6) / DN) * (2 * X - 0.2); dA[i * 2 + 1] = r(); }
  const dUni = { uTime: { value: 0 }, uAmount: { value: 0 }, uColor: { value: new THREE.Color('#E4EEF4') } };
  const dripVS = (ring) => `
      attribute vec2 aD; uniform float uTime, uAmount; varying float vA; varying vec2 vUv;
      void main() {
        float per = 0.75 + 0.7 * fract(aD.y * 7.31);
        float a = fract(uTime / per + aD.y * 5.0);
        float on = step(fract(aD.y * 13.1), uAmount);
        vUv = uv;
        ${ring
    ? `vA = a; vec3 wp = vec3(aD.x, ${(FL + 0.014).toFixed(3)}, ${DZ.toFixed(3)}) + position * on;`
    : `float fall = a * a * ${(DTOP - FL).toFixed(3)};
        vec3 p = position; p.y *= 0.6 + 1.6 * a;
        vec3 wp = vec3(aD.x, ${DTOP.toFixed(3)} - fall, ${DZ.toFixed(3)}) + p * on;
        vA = on * (1.0 - smoothstep(0.9, 1.0, a));`}
        gl_Position = projectionMatrix * modelViewMatrix * vec4(wp, 1.0);
      }`;
  const dGeo = new THREE.BoxGeometry(0.014, 0.1, 0.014);
  dGeo.setAttribute('aD', new THREE.InstancedBufferAttribute(dA, 2));
  const dMat = new THREE.ShaderMaterial({ uniforms: dUni, transparent: true, depthWrite: false, vertexShader: dripVS(false),
    fragmentShader: 'varying float vA; uniform vec3 uColor; void main() { if (vA < 0.01) discard; gl_FragColor = vec4(uColor, 0.7 * vA); }' });
  const drips = new THREE.InstancedMesh(dGeo, dMat, DN);
  const rGeo = new THREE.PlaneGeometry(0.24, 0.24);
  rGeo.rotateX(-Math.PI / 2);
  rGeo.setAttribute('aD', new THREE.InstancedBufferAttribute(dA, 2));
  const rMat = new THREE.ShaderMaterial({ uniforms: dUni, transparent: true, depthWrite: false, vertexShader: dripVS(true), fragmentShader: RING_FRAG });
  const dRings = new THREE.InstancedMesh(rGeo, rMat, DN);
  const wetGeo = new THREE.PlaneGeometry(2 * X + 0.1, 0.34);
  wetGeo.rotateX(-Math.PI / 2);
  wetGeo.translate(0, FL + 0.011, DZ + 0.02);
  const wetMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#3A2A1E'), transparent: true, opacity: 0, depthWrite: false });
  const wet = new THREE.Mesh(wetGeo, wetMat);
  const _id = new THREE.Matrix4();
  for (const m of [drips, dRings]) { for (let i = 0; i < DN; i++) m.setMatrixAt(i, _id); m.frustumCulled = false; }
  for (const m of [drips, dRings, wet]) { m.raycast = () => {}; m.visible = false; root.add(m); }
  function setRain(t) {
    t = clamp(t, 0, 1);
    dUni.uAmount.value = t;
    wetMat.opacity = t * 0.22;
    drips.visible = dRings.visible = wet.visible = t > 0.01;
  }

  const sh = shadowUnder(root, X + 0.9, 2.6, 0.2, -0.1, 0.5);
  const doorPoint = new THREE.Vector3(0, 0, VZ + 0.9);
  let lamp = 0;
  function setLamp(t) {
    lamp = clamp(t, 0, 1);
    bodyMesh.userData.setGlow(lamp);
    poolMat.opacity = lamp * 0.55;
    pools.visible = lamp > 0.01;
  }
  function setOpen(t) { hinge.rotation.y = smooth(t) * 1.7; }
  function update(dt, t) {
    for (let i = 0; i < N; i++) {
      const u = ((t * 0.16 + i / N) % 1);
      const s = 0.12 + u * 0.32;
      _p.set(top.x + Math.sin(t * 0.7 + i * 1.3) * 0.06 * u + u * 0.35, top.y + u * 2.2, top.z - u * 0.15);
      _m.compose(_p, _q.setFromEuler(_e.set(u * 1.2, i, u * 0.8)), _s.set(s, s * 0.85, s));
      if (u > 0.85) _m.scale(_s.setScalar(Math.max(0.001, (1 - u) / 0.15)));
      smoke.setMatrixAt(i, _m);
    }
    smoke.instanceMatrix.needsUpdate = true;
    dUni.uTime.value = t;
    if (lamp > 0) bodyMesh.userData.setGlow(lamp * (0.94 + 0.06 * Math.sin(t * 9.1) * Math.sin(t * 5.3)));
  }
  setLamp(0);
  update(0, 0);
  return {
    root, door: hinge, doorPoint, setOpen, setLamp, setRain, update,
    dispose() { dGeo.dispose(); dMat.dispose(); rGeo.dispose(); rMat.dispose(); wetGeo.dispose(); wetMat.dispose(); sg.tex.dispose(); sign.material.dispose(); sh.geometry.dispose(); poolGeo.dispose(); poolMat.dispose(); smokeMat.dispose(); smoke.geometry.dispose(); bodyMesh.userData.ownMat.dispose(); disposeTree(root); },
  };
}

/**
 * The lodge's painted house board (1.0 x 0.8 m, wall-mounted, back at z = 0): title strip, five lines,
 * a signing strip where people pencil their names. setCover(true) drapes a cloth over the title only.
 */
const BOARD_TITLE = 'ငါးပါးသီလ';
const BOARD_LINES = ['၁။ သက်ရှိကို မညှဉ်းဆဲ မသတ်ရ။', '၂။ မပေးတာကို မယူရ။', '၃။ ဖောက်ပြန်မှု မပြုရ။', '၄။ မလိမ်ရ။', '၅။ အရက်သေစာ မသောက်ရ။'];
export function houseBoard({ title = BOARD_TITLE, lines = BOARD_LINES, cover = false } = {}) {
  const root = new THREE.Group();
  root.name = 'houseBoard';
  const W = 1.0, H = 0.8, T = 0.04;
  const v = new VoxelBuilder();
  v.box(0, H / 2, T / 2, W, H, T, C.woodD); // backing board
  // a moulded frame: outer dark, inner light bead, corner blocks
  for (const sy of [0, 1]) v.box(0, sy ? H - 0.03 : 0.03, T + 0.012, W + 0.02, 0.06, 0.03, C.wood);
  for (const sx of [-1, 1]) v.box(sx * (W / 2 - 0.03), H / 2, T + 0.012, 0.06, H, 0.03, jitter(C.wood, 0.05, sx));
  for (const sx of [-1, 1]) for (const sy of [0, 1]) v.box(sx * (W / 2 - 0.03), sy ? H - 0.03 : 0.03, T + 0.03, 0.07, 0.07, 0.012, C.goldD);
  v.box(0, H + 0.11, 0.01, 0.03, 0.03, 0.03, C.iron); // the nail
  for (const sx of [-1, 1]) boxR(v, sx * 0.24, H + 0.05, T * 0.5, 0.012, 0.3, 0.012, '#9C8A64', 0, 0, sx * 1.1); // hanging cord
  v.box(0, H * 0.2 - 0.005, T + 0.004, W - 0.12, 0.012, 0.006, C.woodD); // ledge between lines and the signing strip
  root.add(v.mesh({ px: 1.4 }));
  const { cv, g, tex } = canvasTex(640, 512);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.12, H - 0.12), basic('#ffffff', { map: tex }));
  face.position.set(0, H / 2, T + 0.006);
  root.add(face);
  // the cloth over the title strip: a maroon runner with folds and tassels
  const cl = new VoxelBuilder();
  const cw = W - 0.06;
  for (let i = 0; i < 9; i++) cl.box(-cw / 2 + (i + 0.5) * cw / 9, H - 0.115, T + 0.03 + (i % 2) * 0.008, cw / 9 + 0.004, 0.17, 0.016, i % 2 ? C.maroon : C.maroonL);
  cl.box(0, H - 0.03, T + 0.035, cw + 0.02, 0.025, 0.03, C.maroonD);
  cl.box(0, H - 0.2, T + 0.04, cw, 0.014, 0.012, C.gold);
  for (const sx of [-1, 1]) { cl.box(sx * (cw / 2 - 0.01), H - 0.24, T + 0.045, 0.025, 0.06, 0.025, C.gold); cl.box(sx * (cw / 2 - 0.01), H - 0.28, T + 0.045, 0.04, 0.03, 0.03, C.goldD); }
  const cloth = cl.mesh({ px: 1.2 });
  root.add(cloth);
  let cur = { title, lines };
  const signs = [];
  function draw() {
    const w = cv.width, h = cv.height;
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#F1E7CF';
    g.fillRect(0, 0, w, h);
    // brush texture: faint horizontal strokes
    const r = rand(5);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(150,120,80,${0.03 + r() * 0.04})`; g.fillRect(0, r() * h, w, 1 + r() * 2); }
    g.fillStyle = C.maroon;
    g.fillRect(0, 0, w, 92);
    g.fillStyle = C.gold;
    g.fillRect(0, 92, w, 5);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `700 46px ${FONT_MY}`;
    g.fillStyle = '#F6E7C0';
    g.fillText(cur.title, w / 2, 50, w - 40);
    g.textAlign = 'left';
    g.font = `600 31px ${FONT_MY}`;
    g.fillStyle = PALETTE.ink;
    cur.lines.slice(0, 5).forEach((l, i) => g.fillText(l, 36, 136 + i * 53, w - 72));
    // signing strip
    const sy = 400;
    g.fillStyle = '#E3D2AE';
    g.fillRect(0, sy, w, h - sy);
    g.fillStyle = 'rgba(80,60,40,0.35)';
    g.fillRect(0, sy, w, 2);
    g.font = `400 24px ${FONT_MY}`;
    g.fillStyle = C.pencil;
    let x = 24;
    signs.forEach((s, i) => {
      const txt = `${s.who}${s.lines?.length ? ' ' + s.lines.join(',') : ''}`;
      const yy = sy + 36 + (i % 2) * 44;
      g.save();
      g.translate(x, yy);
      g.rotate(((i * 37) % 7 - 3) * 0.01);
      g.fillText(txt, 0, 0);
      g.restore();
      if (i % 2) x += Math.max(130, g.measureText(txt).width + 34);
    });
    tex.needsUpdate = true;
  }
  function setCover(on) { cloth.visible = !!on; }
  setCover(cover);
  draw();
  fontsReady().then(draw);
  return {
    root, setCover,
    sign(who, lineNos = []) { signs.push({ who, lines: lineNos }); draw(); },
    setText(t, l) { cur = { title: t ?? cur.title, lines: l ?? cur.lines }; draw(); },
    dispose() { tex.dispose(); face.material.dispose(); disposeTree(root); },
  };
}

/** A hanging oil lamp (0.25 x 0.35 m). Root = the hook point; it hangs below. setHung('low'|'high'). */
export function oilLamp({ hung = 'high', pool = null } = {}) {
  const root = new THREE.Group();
  root.name = 'oilLamp';
  const swing = new THREE.Group();
  root.add(swing);
  const v = new VoxelBuilder(), lit = new VoxelBuilder();
  // lamp body (its top is at y = 0 of `lamp`)
  prism(v, 0, -0.3, 0, 0.07, 0.05, 0.03, C.brassD);           // foot
  prism(v, 0, -0.26, 0, 0.09, 0.07, 0.05, C.brass);          // font (oil)
  prism(v, 0, -0.226, 0, 0.092, 0.092, 0.012, C.brassL);
  prism(v, 0, -0.21, 0, 0.05, 0.08, 0.025, C.brassD);         // collar
  lit.add(prismGeo(0.045, 0.058, 0.12), '#F4E6C4', _m.makeTranslation(0, -0.135, 0)); // glass chimney
  lit.box(0, -0.16, 0, 0.022, 0.05, 0.022, '#FFE6A8');        // flame
  prism(v, 0, -0.07, 0, 0.035, 0.045, 0.025, C.brassD);       // chimney cap
  prism(v, 0, -0.05, 0, 0.065, 0.065, 0.01, C.tin, 8);       // smoke disc
  v.box(0, -0.04, 0, 0.012, 0.02, 0.012, C.iron);
  for (const sx of [-1, 1]) boxR(v, sx * 0.06, -0.13, 0, 0.01, 0.18, 0.01, C.brassD, 0, 0, sx * 0.2); // guard wires
  v.box(0.1, -0.25, 0, 0.03, 0.025, 0.02, C.brassD); // wick knob
  const lamp = litMesh(v, lit, { px: 1.2, tint: '#FFC46E' });
  swing.add(lamp);
  // chain: links as alternating small boxes, length per state
  const cv = new VoxelBuilder();
  for (let i = 0; i < 14; i++) cv.box(0, -0.02 - i * 0.03, 0, i % 2 ? 0.006 : 0.016, 0.032, i % 2 ? 0.016 : 0.006, C.iron);
  const chain = cv.mesh({ outline: false });
  swing.add(chain);
  const hook = new VoxelBuilder();
  hook.box(0, 0.02, 0, 0.02, 0.05, 0.02, C.iron);
  hook.box(0, 0.05, -0.03, 0.02, 0.02, 0.07, C.iron);
  root.add(hook.mesh({ px: 1 }));
  const glow = glowHandle(lamp, _v2.set(0, -0.15, 0), 0.7, '#FFC878', pool);
  let g0 = 0;
  function setHung(s) {
    const L = s === 'low' ? 0.42 : 0.12;
    chain.scale.y = L / 0.42;
    lamp.position.y = -L;
  }
  function setGlow(t) { g0 = clamp(t, 0, 1); lamp.userData.setGlow(g0); glow.set(g0); }
  setHung(hung);
  setGlow(0);
  return {
    root, setHung, setGlow,
    update(dt, t) {
      swing.rotation.z = Math.sin(t * 1.3) * 0.03;
      if (g0 > 0) { const f = g0 * (0.92 + 0.08 * Math.sin(t * 11.3) * Math.sin(t * 7.1)); lamp.userData.setGlow(f); glow.set(f); }
    },
    dispose() { glow.dispose(); lamp.userData.ownMat.dispose(); disposeTree(root); },
  };
}

/**
 * A small pale house gecko (0.12 m) on a wall. The wall is the root's local XY plane (+Z out of the
 * wall); it heads up (+Y) by default. run() scurries to a new spot, settle(x, y) goes there and stays,
 * chirp() puffs its throat and bobs. opts.w/h: the wall area it may roam (centred on the root).
 */
export function gecko({ w = 1.4, h = 0.9, seed = 3 } = {}) {
  const root = new THREE.Group();
  root.name = 'gecko';
  const body = new THREE.Group();
  root.add(body);
  const v = new VoxelBuilder();
  const P = '#E9DFC6', S = '#CDBB97', D = '#B39E78';
  v.box(0, 0, 0.008, 0.026, 0.05, 0.016, P);           // body
  v.box(0, 0.006, 0.017, 0.016, 0.03, 0.004, S);       // back stripe
  for (const y of [-0.012, 0.004, 0.018]) for (const sx of [-1, 1]) v.box(sx * 0.007, y, 0.0165, 0.005, 0.005, 0.003, D); // spots
  v.box(0, 0.034, 0.008, 0.022, 0.024, 0.014, P);      // head
  v.box(0, 0.048, 0.007, 0.014, 0.01, 0.01, P);        // snout
  for (const sx of [-1, 1]) v.box(sx * 0.0115, 0.036, 0.013, 0.005, 0.006, 0.006, PALETTE.ink); // eyes
  // tail: a tapering curl
  let tx = 0, ty = -0.025, a = 0;
  for (let i = 0; i < 6; i++) {
    const L = 0.012, wd = 0.012 - i * 0.0016;
    a += 0.22;
    const nx = tx + Math.sin(a) * L, ny = ty - Math.cos(a) * L;
    boxR(v, (tx + nx) / 2, (ty + ny) / 2, 0.006, wd, L + 0.002, 0.008, i % 2 ? S : P, 0, 0, a);
    tx = nx; ty = ny;
  }
  // splayed legs with toe pads
  for (const [y, ang] of [[0.016, 0.7], [-0.016, -0.7]]) for (const sx of [-1, 1]) {
    boxR(v, sx * 0.02, y, 0.005, 0.022, 0.006, 0.006, P, 0, 0, sx * ang);
    v.box(sx * 0.03, y + Math.sign(ang) * 0.009, 0.005, 0.008, 0.008, 0.004, S);
  }
  const throat = new VoxelBuilder();
  throat.box(0, 0.026, 0.0, 0.014, 0.012, 0.01, '#F3EAD6');
  const mesh = v.mesh({ px: 1.0 });
  body.add(mesh);
  const tm = throat.mesh({ outline: false });
  body.add(tm);
  const r = rand(seed);
  const st = { x: 0, y: 0, tx: 0, ty: 0, moving: false, stay: false, chirpT: 0, wait: 2 };
  function aim(x, y) { st.tx = clamp(x, -w / 2, w / 2); st.ty = clamp(y, -h / 2, h / 2); st.moving = true; }
  return {
    root,
    run() { st.stay = false; aim((r() - 0.5) * w, (r() - 0.5) * h); },
    settle(x, y) { st.stay = true; aim(x, y); },
    chirp() { st.chirpT = 0.6; },
    get moving() { return st.moving; },
    update(dt, t) {
      if (st.moving) {
        const dx = st.tx - st.x, dy = st.ty - st.y, d = Math.hypot(dx, dy);
        const sp = 0.7;
        if (d < 0.01) { st.moving = false; st.wait = 2 + r() * 4; }
        else {
          const k = Math.min(1, (sp * dt) / d);
          st.x += dx * k; st.y += dy * k;
          const head = Math.atan2(-dx, dy);
          body.rotation.z += (head - body.rotation.z) * Math.min(1, dt * 14);
          mesh.rotation.z = Math.sin(t * 40) * 0.18; // the scurry wiggle
        }
      } else {
        mesh.rotation.z *= 0.8;
        if (!st.stay && (st.wait -= dt) < 0) { if (r() < 0.4) aim(st.x + (r() - 0.5) * 0.3, st.y + (r() - 0.5) * 0.3); else st.wait = 2 + r() * 3; }
      }
      body.position.set(st.x, st.y, 0);
      if (st.chirpT > 0) {
        st.chirpT -= dt;
        const s = 1 + Math.max(0, Math.sin(st.chirpT * 30)) * 0.9;
        tm.scale.set(s, 1, s);
        mesh.position.z = Math.max(0, Math.sin(st.chirpT * 20)) * 0.004;
      } else tm.scale.set(1, 1, 1);
    },
    dispose() { disposeTree(root); },
  };
}

/** A small gold hairpin (0.06 m) lying on the floor; it glints in lamplight (setGlint 0..1). */
export function hairpin() {
  const root = new THREE.Group();
  root.name = 'hairpin';
  const v = new VoxelBuilder();
  for (const sx of [-1, 1]) boxR(v, sx * 0.004, 0.003, 0.012, 0.003, 0.003, 0.05, C.brass, 0, sx * 0.05, 0); // prongs
  v.box(0, 0.003, -0.014, 0.012, 0.004, 0.006, C.brassD);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; v.box(Math.sin(a) * 0.007, 0.005, -0.022 + Math.cos(a) * 0.007, 0.007, 0.004, 0.007, C.brassL, a); }
  v.box(0, 0.008, -0.022, 0.006, 0.004, 0.006, '#C8323C'); // a red glass bead
  root.add(v.mesh({ px: 0.9 }));
  const mat = new THREE.SpriteMaterial({ map: spark(), color: new THREE.Color('#FFF2C8'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 });
  const s = new THREE.Sprite(mat);
  s.position.set(0.004, 0.02, -0.02);
  s.scale.setScalar(0.08);
  s.raycast = () => {};
  root.add(s);
  let k = 0;
  return {
    root,
    setGlint(t) { k = clamp(t, 0, 1); },
    update(dt, t) {
      const ph = (t * 0.45) % 1; // a glint every ~2 s
      const f = ph < 0.18 ? Math.sin((ph / 0.18) * Math.PI) : 0;
      mat.opacity = k * f;
      s.visible = mat.opacity > 0.01;
      s.material.rotation = t * 0.8;
      s.scale.setScalar(0.05 + 0.06 * f);
    },
    dispose() { mat.dispose(); disposeTree(root); },
  };
}

/**
 * Pencil footprints on the blank leaf (one instanced decal mesh). walk(id, x, z, heading) every frame
 * for each walker stamps alternate feet every ~0.33 m. Prints fade after 30 s, unless three or more
 * different walkers have walked the same ~0.6 m cell: those stay and darken (the road being made).
 * ink() turns every kept print gold (sweeping from the oldest). keptPoints() -> [x, z, ...] in order.
 */
export function footprints({ max = 600, paper = '#F7F3EA', cell = 0.6 } = {}) {
  const root = new THREE.Group();
  root.name = 'footprints';
  const { cv, g, tex } = canvasTex(32, 64);
  // a sole: rounded ball, narrow waist, a heel; pencil hatch inside
  g.fillStyle = '#fff';
  g.beginPath(); g.ellipse(16, 20, 10, 15, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(16, 50, 8, 10, 0, 0, Math.PI * 2); g.fill();
  g.fillRect(10, 28, 12, 18);
  g.globalCompositeOperation = 'destination-out';
  g.strokeStyle = 'rgba(0,0,0,0.45)';
  g.lineWidth = 1;
  for (let i = -64; i < 64; i += 4) { g.beginPath(); g.moveTo(i, 64); g.lineTo(i + 64, 0); g.stroke(); }
  g.globalCompositeOperation = 'source-over';
  void cv;
  const geo = new THREE.PlaneGeometry(0.12, 0.25);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, alphaTest: 0.05 });
  const mesh = new THREE.InstancedMesh(geo, mat, max);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  mesh.raycast = () => {};
  mesh.count = 0;
  root.add(mesh);
  const px = new Float32Array(max), pz = new Float32Array(max), ph = new Float32Array(max), age = new Float32Array(max);
  const who = new Int32Array(max), gold = new Float32Array(max);
  let n = 0, head = 0; // ring buffer
  const cells = new Map(); // "ix,iz" -> bitmask of walkers
  const walkers = new Map(); // id -> { bit, x, z, d, side }
  const pencil = new THREE.Color(C.pencil), pencilDark = new THREE.Color('#4E4A45'), paperC = new THREE.Color(paper), goldC = new THREE.Color(C.goldD);
  const key = (x, z) => `${Math.floor(x / cell)},${Math.floor(z / cell)}`;
  const kept = (i) => { const m = cells.get(key(px[i], pz[i])) || 0; let c = 0, b = m; while (b) { c += b & 1; b >>>= 1; } return c >= 3; };
  function write(i) {
    const a = age[i];
    const keep = kept(i);
    let fade = keep ? 1 : clamp(1 - (a - 20) / 10, 0, 1);
    if (fade <= 0) { _m.makeScale(0, 0, 0); mesh.setMatrixAt(i, _m); return; }
    _m.compose(_p.set(px[i], 0.006, pz[i]), _q.setFromAxisAngle(_v2.set(0, 1, 0), ph[i]), _s.set(1, 1, 1));
    mesh.setMatrixAt(i, _m);
    _c.copy(keep ? pencilDark : pencil).lerp(paperC, 1 - fade * (keep ? 1 : 0.8));
    if (gold[i] > 0) _c.lerp(goldC, gold[i]);
    mesh.setColorAt(i, _c);
  }
  function step(x, z, heading, side = 1, id = 'maya') {
    let w = walkers.get(id);
    if (!w) { w = { bit: walkers.size % 31, x, z, d: 0, side: 1 }; walkers.set(id, w); }
    const i = head;
    head = (head + 1) % max;
    n = Math.min(max, n + 1);
    const ox = Math.cos(heading) * 0.075 * side, oz = -Math.sin(heading) * 0.075 * side;
    px[i] = x + ox; pz[i] = z + oz; ph[i] = heading; age[i] = 0; who[i] = w.bit; gold[i] = 0;
    const k = key(px[i], pz[i]);
    cells.set(k, (cells.get(k) || 0) | (1 << w.bit));
    mesh.count = n;
    write(i);
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
  let inking = -1;
  return {
    root, step,
    walk(id, x, z, heading) {
      let w = walkers.get(id);
      if (!w) { step(x, z, heading, 1, id); w = walkers.get(id); w.x = x; w.z = z; return; }
      w.d += Math.hypot(x - w.x, z - w.z);
      w.x = x; w.z = z;
      if (w.d > 0.33) { w.d = 0; w.side = -w.side; step(x, z, heading, w.side, id); }
    },
    ink() { inking = 0; },
    clear() { n = 0; head = 0; mesh.count = 0; cells.clear(); },
    keptPoints() { const out = []; for (let j = 0; j < n; j++) { const i = (head - n + j + max) % max; if (kept(i)) out.push(px[i], pz[i]); } return out; },
    update(dt) {
      for (let j = 0; j < n; j++) {
        const i = (head - n + j + max) % max;
        age[i] += dt;
        if (inking >= 0 && gold[i] < 1 && kept(i) && j / Math.max(1, n) <= inking) gold[i] = Math.min(1, gold[i] + dt * 3);
        write(i);
      }
      if (inking >= 0) inking = Math.min(1.01, inking + dt * 0.5);
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
    dispose() { geo.dispose(); mat.dispose(); tex.dispose(); root.removeFromParent(); },
  };
}

/**
 * The Home Book's closed back cover standing across the leaf's north edge (default 30 x 3.5 x 0.6 m):
 * maroon book cloth over board, gold-tooled rules and corner clouds, a door (0.9 x 1.9 m) set into it
 * with a brass keyhole plate at 1 m. setOpen(0..1) swings the door inward (-Z). keyhole: Object3D
 * at the keyhole (tap target / camera aim).
 */
export function backCover({ width = 30, height = 3.5, door: withDoor = true } = {}) {
  const root = new THREE.Group();
  root.name = 'backCover';
  const W = width, H = height, T = 0.6, DW = 0.9, DH = 1.9, DX = 0;
  const v = new VoxelBuilder();
  const M = [C.maroon, '#74222D', '#6A1D28', '#782631'];
  // the board, built around the door opening; cloth grain as faint vertical bands
  const slab = (x0, x1, y0, y1) => { if (x1 - x0 > 0.001 && y1 - y0 > 0.001) v.boxMin(x0, y0, -T / 2, x1, y1, T / 2, C.maroon); };
  if (withDoor) {
    slab(-W / 2, DX - DW / 2, 0, H); slab(DX + DW / 2, W / 2, 0, H); slab(DX - DW / 2, DX + DW / 2, DH, H);
  } else slab(-W / 2, W / 2, 0, H);
  // cloth: three big panels a hair apart in tone (no lines: they would read as siding)
  for (const [x0, x1, col] of [[-W / 2 + 0.02, -W / 6, '#701F2B'], [W / 6, W / 2 - 0.02, '#6C1E29']]) v.boxMin(x0, 0.13, T / 2, x1, H - 0.08, T / 2 + 0.002, col);
  void M;
  // the top edge: the cloth turned over the board, a squared spine-like cap, a darker shadow band at the foot
  v.boxMin(-W / 2 - 0.03, H - 0.06, -T / 2 - 0.03, W / 2 + 0.03, H + 0.04, T / 2 + 0.03, C.maroonD);
  v.boxMin(-W / 2 - 0.01, 0, T / 2, W / 2 + 0.01, 0.12, T / 2 + 0.02, C.maroonD);
  for (const sx of [-1, 1]) v.boxMin(sx * W / 2 - 0.03, 0, -T / 2 - 0.03, sx * W / 2 + 0.03, H + 0.04, T / 2 + 0.03, C.maroonD);
  // gold tooling: a double rule inset from the edges (broken by the door), corner clouds and sparkles
  const G = C.gold, z = T / 2 + 0.012;
  const rule = (x0, x1, y, th = 0.03) => v.boxMin(x0, y - th / 2, z - 0.006, x1, y + th / 2, z + 0.006, G);
  const vrule = (x, y0, y1, th = 0.03) => v.boxMin(x - th / 2, y0, z - 0.006, x + th / 2, y1, z + 0.006, G);
  for (const [ins, th] of [[0.3, 0.035], [0.45, 0.018]]) {
    rule(-W / 2 + ins, W / 2 - ins, H - ins, th);
    if (withDoor) { rule(-W / 2 + ins, DX - DW / 2 - 0.25, ins, th); rule(DX + DW / 2 + 0.25, W / 2 - ins, ins, th); } else rule(-W / 2 + ins, W / 2 - ins, ins, th);
    vrule(-W / 2 + ins, ins, H - ins, th); vrule(W / 2 - ins, ins, H - ins, th);
  }
  const cloud = (cx, cy, s) => {
    // puffs as flat round discs facing out, a flat base line under them
    for (const [dx, dy, r] of [[-0.17, 0.0, 0.11], [0.02, 0.07, 0.15], [0.19, 0.01, 0.11], [0.33, -0.04, 0.07], [-0.31, -0.04, 0.07]]) prism(v, cx + dx * s, cy + dy * s, z + 0.004, r * s, r * s, 0.014, G, 10, 0, Math.PI / 2);
    for (const [dx, dy, r] of [[0.02, 0.09, 0.09], [-0.15, 0.02, 0.06]]) prism(v, cx + dx * s, cy + dy * s, z + 0.012, r * s, r * s, 0.008, C.goldL, 10, 0, Math.PI / 2);
    v.box(cx, cy - 0.1 * s, z + 0.004, 0.86 * s, 0.035 * s, 0.014, G);
  };
  // a twinkle: four tapered points, the upright pair longer (a sparkle, never an even cross), a lozenge heart
  const twinkle = (cx, cy, s) => {
    const L = 0.2 * s, l = 0.12 * s, a = 0.028 * s;
    _m.compose(_p.set(cx, cy, z + 0.006), _q.setFromEuler(_e.set(Math.PI / 2, 0, 0)), _s.set(1, 1, 1));
    // corners are [x, -y] (the slab is turned up into the board's plane)
    for (const [tx, ty] of [[0, L], [0, -L], [l, 0], [-l, 0]]) {
      const [p1, p2] = tx ? [[a * Math.sign(tx), -a], [a * Math.sign(tx), a]] : [[-a, -a * Math.sign(ty)], [a, -a * Math.sign(ty)]];
      v.add(triSlab([tx, -ty], p1, p2, 0.014), C.goldL, _m);
    }
    boxR(v, cx, cy, z + 0.008, a * 2.2, a * 2.2, 0.014, C.gold, 0, 0, Math.PI / 4);
  };
  // a padauk flower: five round petals about a darker heart
  const rosette = (cx, cy, s) => {
    for (let k = 0; k < 5; k++) {
      const an = Math.PI / 2 + (k / 5) * Math.PI * 2;
      prism(v, cx + Math.cos(an) * 0.075 * s, cy + Math.sin(an) * 0.075 * s, z + 0.004, 0.048 * s, 0.048 * s, 0.014, C.goldL, 10, 0, Math.PI / 2);
    }
    prism(v, cx, cy, z + 0.01, 0.036 * s, 0.036 * s, 0.012, C.gold, 10, 0, Math.PI / 2);
  };
  for (const sx of [-1, 1]) {
    cloud(sx * (W / 2 - 1.1), H - 0.85, 1.3);
    cloud(sx * (W / 2 - 1.1), 0.95, 1.1);
    twinkle(sx * (W / 2 - 2.0), H - 0.7, 1.2);
  }
  // a band along the middle every 1.2 m: rosettes, a small twinkle between each pair (the cover's own pattern)
  for (let x = -W / 2 + 3.2, k = 0; x < W / 2 - 3; x += 1.2, k++) if (!withDoor || Math.abs(x - DX) > 1.4) (k % 2 ? twinkle(x, H * 0.55, 0.55) : rosette(x, H * 0.55, 0.8));
  if (withDoor) {
    // the door's gold frame and a little cloud over it
    for (const sx of [-1, 1]) vrule(DX + sx * (DW / 2 + 0.06), 0, DH + 0.06, 0.04);
    rule(DX - DW / 2 - 0.08, DX + DW / 2 + 0.08, DH + 0.06, 0.04);
    cloud(DX, DH + 0.42, 0.8);
    // the doorway's depth (reveal) and a dark inside behind
    for (const sx of [-1, 1]) v.boxMin(DX + sx * DW / 2 - (sx > 0 ? 0.02 : 0), 0, -T / 2, DX + sx * DW / 2 + (sx > 0 ? 0 : 0.02), DH, T / 2, '#5A1820');
    v.boxMin(DX - DW / 2, DH - 0.02, -T / 2, DX + DW / 2, DH, T / 2, '#5A1820');
    v.box(DX, 0.02, T / 2 + 0.25, DW + 0.4, 0.04, 0.5, '#E9E2D2'); // a worn paper step
  }
  const board = v.mesh({ px: 2 });
  root.add(board);
  let hinge = null, inner = null, keyhole = new THREE.Object3D();
  root.add(keyhole);
  if (withDoor) {
    // inside: a warm-dark box seen through the open door (endpaper glow when lit)
    const iv = new VoxelBuilder(), il = new VoxelBuilder();
    iv.boxMin(DX - DW / 2 - 0.3, 0, -T / 2 - 2.0, DX + DW / 2 + 0.3, DH + 0.3, -T / 2 - 1.98, '#3A1E14');
    iv.boxMin(DX - DW / 2 - 0.3, -0.005, -T / 2 - 2.0, DX + DW / 2 + 0.3, 0.0, -T / 2, '#4A2A18');
    il.boxMin(DX - DW / 2 - 0.3, 0.001, -T / 2 - 1.9, DX + DW / 2 + 0.3, 0.004, -T / 2 - 0.05, '#E7C98A'); // endpaper floor
    il.boxMin(DX - DW / 2, 0.3, -T / 2 - 1.97, DX + DW / 2, DH - 0.1, -T / 2 - 1.96, '#E2B866');
    inner = litMesh(iv, il, { outline: false, tint: '#FFD08A' });
    root.add(inner);
    hinge = new THREE.Group();
    hinge.position.set(DX - DW / 2, 0, T / 2 - 0.05);
    root.add(hinge);
    const dv = new VoxelBuilder();
    dv.boxMin(0.01, 0.01, -0.08, DW - 0.01, DH - 0.01, 0.0, C.maroon);
    for (let k = 1; k < 4; k++) dv.boxMin(0.01 + (DW - 0.02) * k / 4 - 0.004, 0.02, 0.0, 0.01 + (DW - 0.02) * k / 4 + 0.004, DH - 0.02, 0.006, C.maroonD); // board seams
    for (const [y0, y1] of [[0.12, 0.15], [DH - 0.15, DH - 0.12]]) dv.boxMin(0.05, y0, 0.0, DW - 0.05, y1, 0.01, C.gold);
    for (const x of [0.06, DW - 0.06]) dv.boxMin(x - 0.015, 0.12, 0.0, x + 0.015, DH - 0.12, 0.01, C.gold);
    // brass keyhole plate at 1 m on the right, with the dark keyhole
    const kx = DW - 0.16;
    dv.box(kx, 1.0, 0.012, 0.11, 0.2, 0.02, C.brass);
    dv.box(kx, 1.0, 0.024, 0.09, 0.18, 0.006, C.brassL);
    dv.box(kx, 1.025, 0.03, 0.032, 0.032, 0.006, C.soot);
    dv.box(kx, 0.985, 0.03, 0.016, 0.05, 0.006, C.soot);
    for (const yy of [0.92, 1.08]) dv.box(kx, yy, 0.03, 0.015, 0.015, 0.006, C.brassD); // pins
    dv.box(kx - 0.02, 1.2, 0.03, 0.06, 0.03, 0.04, C.brassD); // a small pull
    for (const yy of [0.35, DH - 0.35]) dv.box(0.05, yy, 0.012, 0.1, 0.06, 0.02, C.brassD); // hinges
    hinge.add(dv.mesh({ px: 1.6 }));
    keyhole.position.set(DX - DW / 2 + kx, 1.0, T / 2 + 0.03);
  }
  const sh = shadowUnder(root, W * 0.52, 0.9, 0, 0.4, 0.4);
  return {
    root, door: hinge, keyhole,
    setOpen(t) { if (hinge) hinge.rotation.y = smooth(t) * 1.6; },
    setInterior(t) { inner?.userData.setGlow(clamp(t, 0, 1)); },
    dispose() { sh.geometry.dispose(); inner?.userData.ownMat.dispose(); disposeTree(root); },
  };
}

// =============================================================================================
// INSIDE THE BACK COVER (Day 14 room `backcover`): endpaper floor, marbled walls, writing slope,
// gold-ink pot, eight pigeonholes, the reference plate. The desk is desks.js's; the shell can be skipped.
// =============================================================================================

let endpaperTex = null, marbleTex = null;
/** Padauk-sprig endpaper (cream ground, maroon stems, gold flower heads), one 1 m tile. */
function endpaper() {
  if (endpaperTex) return endpaperTex;
  const { g, tex } = canvasTex(256, 256);
  g.fillStyle = '#F2E4C6';
  g.fillRect(0, 0, 256, 256);
  const r = rand(77);
  const sprig = (x, y, rot, s) => {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.strokeStyle = C.maroon; g.lineWidth = 2.4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 30); g.quadraticCurveTo(4, 8, 0, -26); g.stroke();
    // leaflets in pairs along the stem
    for (const [ly, sd] of [[16, -1], [10, 1], [2, -1], [-6, 1]]) {
      g.save(); g.translate(1, ly); g.rotate(sd * 0.9); g.fillStyle = sd > 0 ? '#7E2A33' : C.maroon;
      g.beginPath(); g.ellipse(sd * 8, 0, 8, 3.2, 0, 0, Math.PI * 2); g.fill(); g.restore();
    }
    // the flower head: a loose cluster of gold dots
    for (let k = 0; k < 9; k++) { const a = r() * Math.PI * 2, d = r() * 8; g.fillStyle = k % 3 ? C.gold : '#C9962E'; g.beginPath(); g.arc(Math.cos(a) * d, -30 + Math.sin(a) * d * 0.8, 2.6, 0, Math.PI * 2); g.fill(); }
    g.restore();
  };
  for (const [x, y, a] of [[64, 64, -0.5], [192, 64, 0.6], [64, 192, 0.7], [192, 192, -0.6], [128, 128, 0.1], [0, 128, 2.6], [256, 128, 2.6], [128, 0, -2.4], [128, 256, -2.4]]) sprig(x, y, a, 0.9);
  // tiny gold seed dots between
  g.fillStyle = 'rgba(184,138,46,0.55)';
  for (const [x, y] of [[128, 64], [64, 128], [192, 128], [128, 192], [0, 0], [256, 0], [0, 256], [256, 256]]) { g.beginPath(); g.arc(x, y, 2.4, 0, Math.PI * 2); g.fill(); }
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return (endpaperTex = tex);
}
/** Marbled endpaper for the board's inside walls (combed waves, the cover's colours). */
function marbled() {
  if (marbleTex) return marbleTex;
  const { g, tex } = canvasTex(512, 256);
  g.fillStyle = '#EADBBE';
  g.fillRect(0, 0, 512, 256);
  const cols = ['rgba(122,36,48,0.55)', 'rgba(201,150,46,0.5)', 'rgba(94,26,36,0.45)', 'rgba(232,210,170,0.8)', 'rgba(150,72,52,0.4)', 'rgba(70,84,110,0.25)'];
  const r = rand(91);
  g.lineCap = 'round';
  for (let y = -10, i = 0; y < 270; y += 5, i++) {
    g.strokeStyle = cols[(i * 7 + Math.floor(r() * 3)) % cols.length];
    g.lineWidth = 3 + r() * 5;
    g.beginPath();
    for (let x = 0; x <= 512; x += 8) {
      const yy = y + Math.sin((x / 512) * Math.PI * 4 + y * 0.05) * 10 + Math.sin((x / 512) * Math.PI * 10 + i) * 3.5;
      if (!x) g.moveTo(x, yy); else g.lineTo(x, yy);
    }
    g.stroke();
  }
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return (marbleTex = tex);
}
function texturedToon(map) {
  return new THREE.MeshToonMaterial({ color: 0xffffff, map, gradientMap: gradientMap() });
}

/** Squat gold-ink pot (8 cm) with a dip pen in it. root at its foot. */
export function goldInkPot() {
  const root = new THREE.Group();
  root.name = 'goldInkPot';
  const v = new VoxelBuilder();
  prism(v, 0, 0.016, 0, 0.045, 0.048, 0.032, C.maroonD, 10);
  prism(v, 0, 0.042, 0, 0.038, 0.045, 0.02, C.maroon, 10);
  prism(v, 0, 0.056, 0, 0.026, 0.026, 0.01, C.maroonD, 10);
  prism(v, 0, 0.0615, 0, 0.022, 0.022, 0.002, C.goldL, 10); // the gold ink
  prism(v, 0, 0.04, 0, 0.0455, 0.0455, 0.004, C.gold, 10);   // a gold band
  // the dip pen leaning in the pot: a dark holder, a gold nib and ferrule
  boxR(v, 0.018, 0.1, 0.008, 0.008, 0.11, 0.008, '#3A2A22', 0.12, 0, -0.32);
  boxR(v, 0.004, 0.061, 0.004, 0.005, 0.02, 0.003, C.gold, 0.12, 0, -0.32);
  boxR(v, 0.034, 0.15, 0.014, 0.011, 0.03, 0.011, C.gold, 0.12, 0, -0.32);
  root.add(v.mesh({ px: 1.1 }));
  return { root, dispose() { disposeTree(root); } };
}

/** The writing slope (0.9 x 0.7, low edge 0.72 m at the front, +Z) with a blank sheet pinned and the gold-ink pot. */
export function writingSlope({ sheet = true, pot = true } = {}) {
  const root = new THREE.Group();
  root.name = 'writingSlope';
  const v = new VoxelBuilder(), tv = new VoxelBuilder();
  const TILT = 0.25, CY = 0.81;
  // legs (front shorter), stretchers, the rear ledge
  for (const sx of [-1, 1]) {
    v.boxMin(sx * 0.4 - 0.025, 0, 0.25, sx * 0.4 + 0.025, 0.71, 0.3, C.woodD);
    v.boxMin(sx * 0.4 - 0.025, 0, -0.32, sx * 0.4 + 0.025, 0.9, -0.27, C.woodD);
    v.boxMin(sx * 0.4 - 0.02, 0.14, -0.28, sx * 0.4 + 0.02, 0.18, 0.26, C.wood);
  }
  v.boxMin(-0.4, 0.14, -0.02, 0.4, 0.18, 0.02, C.wood);
  v.boxMin(-0.46, 0.9, -0.44, 0.46, 0.93, -0.3, C.woodL); // the ledge at the top
  v.boxMin(-0.46, 0.93, -0.445, 0.46, 0.96, -0.425, C.woodD);
  // the sloping top (built flat, then tipped toward the writer)
  tv.box(0, 0, 0, 0.9, 0.04, 0.68, C.woodL);
  for (const sx of [-1, 1]) tv.box(sx * 0.44, 0.012, 0, 0.03, 0.05, 0.7, C.woodD);
  tv.box(0, 0.035, 0.335, 0.9, 0.035, 0.03, C.woodD);              // the pen lip at the low edge
  tv.box(0, 0.021, 0.3, 0.82, 0.002, 0.004, '#B58A5A');            // a worn line
  if (sheet) {
    tv.box(-0.04, 0.023, -0.03, 0.42, 0.004, 0.56, '#FBF7EE');     // one blank sheet
    tv.box(-0.035, 0.022, -0.025, 0.42, 0.003, 0.56, '#E2D9C6');   // its shadow edge
    for (const x of [-0.22, 0.14]) tv.box(x, 0.028, -0.29, 0.02, 0.008, 0.02, C.brass); // two pins
  }
  tv.box(0.3, 0.06, 0.322, 0.2, 0.012, 0.012, C.maroon);            // a pencil on the lip
  tv.box(0.405, 0.06, 0.322, 0.012, 0.009, 0.009, C.pencil);
  _m.compose(_p.set(0, CY, 0), _q.setFromEuler(_e.set(TILT, 0, 0)), _s.set(1, 1, 1));
  v.merge(tv, _m);
  root.add(v.mesh());
  let ip = null;
  if (pot) { ip = goldInkPot(); ip.root.position.set(0.3, 0.93, -0.37); root.add(ip.root); }
  const sh = shadowUnder(root, 0.55, 0.45, 0, 0, 0.4);
  return { root, pot: ip, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

/**
 * Eight pigeonholes (4 x 2, 1.6 x 0.9 x 0.32 m), wall-hung: root at the bottom centre of the back,
 * front +Z. setFilled(k) puts tied booklet stacks in the first k holes (Day 14 unload).
 */
export function pigeonholes({ holes = 8 } = {}) {
  const root = new THREE.Group();
  root.name = 'pigeonholes';
  const v = new VoxelBuilder();
  const W = 1.6, H = 0.9, D = 0.32, T = 0.03, COLS = 4, ROWS = Math.max(1, Math.round(holes / 4));
  v.boxMin(-W / 2, 0, 0, W / 2, H, 0.015, '#5E3A26');                         // the back
  for (const y of [0, H - T]) v.boxMin(-W / 2 - 0.02, y, 0, W / 2 + 0.02, y + T, D, C.wood);
  for (const x of [-W / 2, W / 2 - T]) v.boxMin(x, 0, 0, x + T, H, D, C.wood);
  for (let c = 1; c < COLS; c++) { const x = -W / 2 + (W * c) / COLS; v.boxMin(x - 0.01, T, 0, x + 0.01, H - T, D - 0.01, C.woodL); }
  for (let rr = 1; rr < ROWS; rr++) { const y = (H * rr) / ROWS; v.boxMin(-W / 2 + T, y - 0.012, 0, W / 2 - T, y + 0.012, D - 0.01, C.woodL); }
  v.boxMin(-W / 2 - 0.03, H, -0.01, W / 2 + 0.03, H + 0.04, D + 0.03, C.woodD); // the cornice
  v.boxMin(-W / 2 - 0.03, H + 0.04, D + 0.005, W / 2 + 0.03, H + 0.05, D + 0.03, C.gold);
  // brass label holders with blank cards under each hole
  const cells = [];
  for (let rr = 0; rr < ROWS; rr++) for (let c = 0; c < COLS; c++) {
    const cx = -W / 2 + (W * (c + 0.5)) / COLS, y0 = (H * rr) / ROWS + (rr ? 0.012 : T);
    cells.push([cx, y0]);
    v.box(cx, y0 - 0.006, D + 0.004, 0.11, 0.035, 0.006, C.brass);
    v.box(cx, y0 - 0.006, D + 0.008, 0.09, 0.025, 0.004, '#F4ECD8');
  }
  root.add(v.mesh());
  cells.sort((a, b) => b[1] - a[1] || a[0] - b[0]); // fill the top row first, left to right
  let fill = null;
  function setFilled(k) {
    k = clamp(Math.round(k), 0, cells.length);
    if (fill) { fill.geometry.dispose(); fill.removeFromParent(); fill = null; }
    if (!k) return;
    const fv = new VoxelBuilder();
    for (let i = 0; i < k; i++) {
      const [cx, y0] = cells[i];
      for (let j = 0; j < 9; j++) fv.box(cx + ((j * 5) % 3 - 1) * 0.004, y0 + 0.008 + j * 0.0125, D * 0.52, 0.3, 0.012, 0.22, j % 4 === 3 ? C.maroonL : C.maroon);
      fv.box(cx, y0 + 0.06, D * 0.52 + 0.111, 0.01, 0.12, 0.004, '#B08F5C'); // the string
      fv.box(cx, y0 + 0.121, D * 0.52, 0.01, 0.004, 0.23, '#B08F5C');
    }
    fill = fv.mesh({ px: 1.2 });
    root.add(fill);
  }
  return { root, setFilled, dispose() { fill?.geometry.dispose(); disposeTree(root); } };
}

/**
 * The reference plate (0.6 x 0.4 m) for the board: a brass frame round a cream face. setText(lines | null):
 * Maya's own reference list, verbatim, only with her yes; null leaves it blank. root at its bottom centre, back z = 0.
 */
export function referencePlate({ lines = null } = {}) {
  const root = new THREE.Group();
  root.name = 'referencePlate';
  const v = new VoxelBuilder();
  const W = 0.6, H = 0.4;
  v.boxMin(-W / 2, 0, 0, W / 2, H, 0.02, C.brassD);
  for (const y of [0, H - 0.035]) v.boxMin(-W / 2, y, 0.02, W / 2, y + 0.035, 0.03, C.brass);
  for (const x of [-W / 2, W / 2 - 0.035]) v.boxMin(x, 0, 0.02, x + 0.035, H, 0.03, C.brass);
  for (const x of [-W / 2 + 0.0175, W / 2 - 0.0175]) for (const y of [0.0175, H - 0.0175]) v.box(x, y, 0.033, 0.014, 0.014, 0.006, C.brassL);
  root.add(v.mesh({ px: 1.3 }));
  const { g, tex } = canvasTex(384, 240);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.07, H - 0.07), basic('#ffffff', { map: tex }));
  face.position.set(0, H / 2, 0.022);
  root.add(face);
  let cur = lines;
  function draw() {
    g.fillStyle = '#F6EEDB'; g.fillRect(0, 0, 384, 240);
    g.strokeStyle = 'rgba(176,138,60,0.6)'; g.lineWidth = 2; g.strokeRect(10, 10, 364, 220);
    if (cur && cur.length) {
      g.fillStyle = C.ink; g.textAlign = 'left'; g.textBaseline = 'top';
      const n = cur.length, fs = Math.max(11, Math.min(20, Math.floor(200 / n) - 4));
      g.font = `500 ${fs}px ${FONT_MY}`;
      cur.forEach((t, i) => g.fillText(t, 22, 20 + i * (fs + 5), 340));
    }
    tex.needsUpdate = true;
  }
  draw();
  fontsReady().then(draw);
  return { root, setText(l) { cur = l; draw(); }, dispose() { tex.dispose(); face.material.dispose(); face.geometry.dispose(); disposeTree(root); } };
}

/**
 * The Back Cover room's own things, laid out on the 7 x 8 x 3.2 room (centre (0, 0), back wall z = -4):
 * endpaper floor, marbled walls (shell), writing slope (0.4, -3.0) + stool, eight pigeonholes on the
 * right wall, the reference plate on the back wall at x = 2.4. The desk (desks.js) is placed by the room.
 * { root, slope, pigeonholes, plate, setFilled(k), setPlate(lines | null), dispose }
 */
export function backCoverRoom({ shell = true, refs = null, w = 7, d = 8, h = 3.2 } = {}) {
  const root = new THREE.Group();
  root.name = 'backCoverRoom';
  const own = [];
  // floor: the padauk endpaper, 1 m tiles
  const fGeo = new THREE.PlaneGeometry(w, d);
  fGeo.rotateX(-Math.PI / 2);
  const uv = fGeo.attributes.uv;
  for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * w, uv.getY(k) * d);
  const fMat = texturedToon(endpaper());
  const floor = new THREE.Mesh(fGeo, fMat);
  floor.position.y = 0.002;
  root.add(floor);
  own.push(fGeo, fMat);
  const v = new VoxelBuilder();
  if (shell) {
    // walls: the board's inside, marbled; a dark skirting and a gold rule along the top
    const parts = [];
    const wall = (len, rotY, x, z) => {
      const p = new THREE.PlaneGeometry(len, h);
      const u = p.attributes.uv;
      for (let k = 0; k < u.count; k++) u.setXY(k, (u.getX(k) * len) / 3, (u.getY(k) * h) / 1.5);
      p.rotateY(rotY); p.translate(x, h / 2, z);
      parts.push(p);
    };
    wall(w, 0, 0, -d / 2);
    wall(d, Math.PI / 2, -w / 2, 0);
    wall(d, -Math.PI / 2, w / 2, 0);
    const wGeo = mergeGeometries(parts, false);
    parts.forEach((p) => p.dispose());
    const wMat = texturedToon(marbled());
    root.add(new THREE.Mesh(wGeo, wMat));
    own.push(wGeo, wMat);
    v.boxMin(-w / 2, 0, -d / 2, w / 2, 0.16, -d / 2 + 0.03, C.maroonD);
    for (const sx of [-1, 1]) v.boxMin(sx * w / 2 - (sx > 0 ? 0.03 : 0), 0, -d / 2, sx * w / 2 + (sx > 0 ? 0 : 0.03), 0.16, d / 2, C.maroonD);
    v.boxMin(-w / 2, h - 0.12, -d / 2, w / 2, h - 0.09, -d / 2 + 0.02, C.gold);
    for (const sx of [-1, 1]) v.boxMin(sx * w / 2 - (sx > 0 ? 0.02 : 0), h - 0.12, -d / 2, sx * w / 2 + (sx > 0 ? 0 : 0.02), h - 0.09, d / 2, C.gold);
    // the turned-in cloth at the foot of the back board: a maroon band on the floor
    v.boxMin(-w / 2, 0, -d / 2 + 0.03, w / 2, 0.004, -d / 2 + 0.3, C.maroon);
  }
  // a low stool for the slope
  const SX = 0.4, SZ = -2.4;
  v.boxMin(SX - 0.18, 0.42, SZ - 0.15, SX + 0.18, 0.47, SZ + 0.15, C.woodL);
  for (const dx of [-0.14, 0.14]) for (const dz of [-0.11, 0.11]) v.boxMin(SX + dx - 0.025, 0, SZ + dz - 0.025, SX + dx + 0.025, 0.42, SZ + dz + 0.025, C.woodD);
  v.boxMin(SX - 0.14, 0.12, SZ - 0.01, SX + 0.14, 0.15, SZ + 0.01, C.wood);
  root.add(v.mesh());
  const slope = writingSlope();
  slope.root.position.set(0.4, 0, -3.0);
  root.add(slope.root);
  const holes = pigeonholes();
  holes.root.position.set(-1.3, 0.95, -d / 2 + 0.01); // on the back board, left of the slope, in the phone's view
  root.add(holes.root);
  const plate = referencePlate({ lines: refs });
  plate.root.position.set(1.65, 1.35, -d / 2 + 0.01);
  root.add(plate.root);
  return {
    root, slope, pigeonholes: holes, plate,
    setFilled: holes.setFilled, setPlate: plate.setText,
    dispose() { slope.dispose(); holes.dispose(); plate.dispose(); for (const x of own) x.dispose(); disposeTree(root); },
  };
}

// =============================================================================================
// THE LAUNCH EVENING (Day 15)
// =============================================================================================

const _ya = new THREE.Vector3(0, 1, 0);
/** A thin box from point a to point b (sticks, wires, cords). */
function seg(v, x0, y0, z0, x1, y1, z1, w, col, d = w) {
  _v2.set(x1 - x0, y1 - y0, z1 - z0);
  const L = _v2.length();
  _q2.setFromUnitVectors(_ya, _v2.multiplyScalar(1 / L));
  _m.compose(_p.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), _q2, _s.set(w, L, d));
  v.add(UNIT, col, _m);
}

/** Trestle table (1.6 x 0.6 x 0.72 m) with a cloth hanging 0.15 m and a cream runner. slots: tops for props. */
export function launchTable(cloth = C.maroon) {
  const root = new THREE.Group();
  root.name = 'launchTable';
  const v = new VoxelBuilder();
  const W = 1.6, D = 0.6, Y = 0.72, DROP = 0.15;
  // trestles: two A-frames, a stretcher, feet
  for (const sx of [-1, 1]) {
    const x = sx * 0.58;
    for (const sz of [-1, 1]) boxR(v, x, (Y - 0.04) / 2, sz * 0.12, 0.05, Y - 0.02, 0.05, jitter(C.woodD, 0.05, sx + sz * 3), sz * 0.3, 0, 0);
    v.box(x, 0.36, 0, 0.05, 0.05, 0.42, C.woodD);
    v.box(x, Y - 0.06, 0, 0.07, 0.05, D - 0.06, C.wood);
  }
  v.box(0, 0.22, 0, 1.2, 0.05, 0.04, C.woodD);
  // the cloth: top, then drops with soft folds on every side
  const cc = cloth, cd = shade(cloth, 0.84), cl = shade(cloth, 1.1);
  v.box(0, Y + 0.012, 0, W + 0.02, 0.024, D + 0.02, cc);
  const n = 11;
  for (let i = 0; i < n; i++) {
    const x = -W / 2 + (i + 0.5) * (W / n);
    for (const sz of [-1, 1]) v.box(x, Y - DROP / 2 + 0.012, sz * (D / 2 + 0.012 + (i % 2) * 0.008), W / n + 0.003, DROP, 0.014, i % 2 ? cd : cc);
  }
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) {
    const z = -D / 2 + (i + 0.5) * (D / 4);
    v.box(sx * (W / 2 + 0.012 + (i % 2) * 0.008), Y - DROP / 2 + 0.012, z, 0.014, DROP, D / 4 + 0.003, i % 2 ? cd : cc);
  }
  // gold hem and a little fringe along the front
  v.box(0, Y - DROP + 0.03, D / 2 + 0.024, W + 0.04, 0.018, 0.012, C.gold);
  for (let x = -W / 2 + 0.04; x < W / 2; x += 0.08) v.box(x, Y - DROP - 0.002, D / 2 + 0.02, 0.016, 0.04, 0.012, C.goldD);
  for (const sx of [-1, 1]) v.box(sx * (W / 2 + 0.03), Y - DROP + 0.03, 0, 0.012, 0.018, D + 0.04, C.gold);
  // cream runner down the middle with gold edges
  v.box(0, Y + 0.027, 0, W - 0.2, 0.006, 0.26, C.cream);
  for (const sz of [-1, 1]) v.box(0, Y + 0.029, sz * 0.12, W - 0.2, 0.006, 0.014, C.gold);
  for (const sx of [-1, 1]) v.box(sx * (W / 2 - 0.1), Y + 0.029, 0, 0.014, 0.006, 0.26, cl);
  root.add(v.mesh());
  const sh = shadowUnder(root, 0.95, 0.45, 0, 0, 0.45);
  const slots = [-0.6, -0.3, 0, 0.3, 0.6].map((x) => new THREE.Vector3(x, Y + 0.03, 0));
  return { root, slots, top: Y + 0.03, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

/** A 0.12 m clay vase; setStems(0..1) grows a bunch of three bulb flowers; setTag(true) ties a cream tag on. */
export function vase(stems = 0, { colors = [C.mustard, '#E9862E', C.rose], tagged = false } = {}) {
  const root = new THREE.Group();
  root.name = 'vase';
  let body = null;
  function buildBody(tag) {
    if (body) { body.geometry.dispose(); body.removeFromParent(); }
    const v = new VoxelBuilder();
    prism(v, 0, 0.008, 0, 0.032, 0.036, 0.016, C.terraD);
    prism(v, 0, 0.035, 0, 0.05, 0.036, 0.04, C.terra);
    prism(v, 0, 0.068, 0, 0.042, 0.05, 0.026, C.terraL);
    prism(v, 0, 0.09, 0, 0.024, 0.04, 0.02, C.terra);
    prism(v, 0, 0.108, 0, 0.022, 0.022, 0.018, C.terraD);
    prism(v, 0, 0.12, 0, 0.032, 0.032, 0.008, C.terraL);
    prism(v, 0, 0.124, 0, 0.024, 0.024, 0.002, C.soot);
    prism(v, 0, 0.052, 0, 0.0505, 0.0505, 0.008, C.cream);
    prism(v, 0, 0.06, 0, 0.0503, 0.0503, 0.003, C.maroon);
    if (tag) { // a cream tag on a string round the neck: whose bulbs
      boxR(v, 0.035, 0.1, 0.03, 0.002, 0.045, 0.002, '#A08A60', 0, 0, 0.6);
      boxR(v, 0.05, 0.065, 0.045, 0.04, 0.026, 0.003, C.cream, 0, -0.5, 0.1);
    }
    body = v.mesh({ px: 1.2 });
    root.add(body);
  }
  buildBody(tagged);
  const b = new VoxelBuilder();
  const heads = [[-0.035, 0.27, 0.01, -0.22], [0.0, 0.31, -0.012, 0.04], [0.04, 0.25, 0.012, 0.26]];
  heads.forEach(([x, y, z, lean], i) => {
    const L = y - 0.1;
    boxR(b, x / 2, 0.1 + L / 2, z / 2, 0.008, L, 0.008, C.leafD, 0, 0, -lean * 0.5);
    boxR(b, x * 0.3 + (i - 1) * 0.012, 0.16, z * 0.3 + 0.01, 0.012, 0.11, 0.004, i % 2 ? C.leaf : C.leafL, 0.15, 0, (i - 1) * 0.35);
    const col = colors[i % colors.length];
    // a cup-shaped bloom: six petals round a centre, slightly open
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      boxR(b, x + Math.sin(a) * 0.012, y + 0.016, z + Math.cos(a) * 0.012, 0.016, 0.034, 0.008, k % 2 ? col : shade(col, 0.9), Math.cos(a) * 0.35, a, 0);
    }
    b.box(x, y + 0.008, z, 0.02, 0.016, 0.02, shade(col, 0.8));
    b.box(x, y + 0.03, z, 0.006, 0.014, 0.006, C.goldD);
  });
  const bunch = b.mesh({ px: 1.1 });
  root.add(bunch);
  function setStems(t) { t = clamp(t, 0, 1); bunch.visible = t > 0.01; bunch.scale.set(0.6 + 0.4 * t, t, 0.6 + 0.4 * t); }
  setStems(stems);
  let tg = tagged;
  return { root, setStems, setTag(on) { if (!!on !== tg) { tg = !!on; buildBody(tg); } }, dispose() { disposeTree(root); } };
}

/** Kraft card box (0.36 x 0.22 x 0.24 m), flaps open, a stack of thin maroon booklets inside. setCount(n). */
export function bookletBox(n = 12) {
  const root = new THREE.Group();
  root.name = 'bookletBox';
  const v = new VoxelBuilder();
  const W = 0.36, D = 0.24, H = 0.15, T = 0.008, K = '#C9A877', KD = '#A9875A', KL = '#D8BC8E';
  v.box(0, T / 2, 0, W, T, D, KD);
  for (const sz of [-1, 1]) v.box(0, H / 2, sz * (D / 2 - T / 2), W, H, T, sz > 0 ? K : KD);
  for (const sx of [-1, 1]) v.box(sx * (W / 2 - T / 2), H / 2, 0, T, H, D, jitter(K, 0.04, sx));
  // open flaps folded outward
  for (const sz of [-1, 1]) boxR(v, 0, H + 0.045, sz * (D / 2 + 0.035), W, 0.1, T, sz > 0 ? KL : K, sz * 0.85, 0, 0);
  for (const sx of [-1, 1]) boxR(v, sx * (W / 2 + 0.03), H + 0.04, 0, 0.09, T, D - 0.02, KL, 0, 0, sx * -0.55);
  // tape, a hand-written label (scribbles) and a printed arrow-free stamp
  v.box(0, H - 0.03, D / 2 + 0.001, 0.05, 0.06, 0.003, '#E9DFC2');
  v.box(-0.08, 0.065, D / 2 + 0.002, 0.14, 0.06, 0.003, C.cream);
  for (let i = 0; i < 2; i++) v.box(-0.09 + i * 0.01, 0.075 - i * 0.02, D / 2 + 0.004, 0.09 - i * 0.03, 0.006, 0.002, C.ink);
  v.box(0.1, 0.065, D / 2 + 0.003, 0.05, 0.05, 0.002, C.maroon);
  root.add(v.mesh({ px: 1.3 }));
  const stack = new THREE.Group();
  root.add(stack);
  let stackMesh = null;
  const { cv, g, tex } = canvasTex(256, 176);
  const cover = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.19), basic('#ffffff', { map: tex }));
  cover.rotation.x = -Math.PI / 2;
  root.add(cover);
  function drawCover() {
    g.fillStyle = C.maroon; g.fillRect(0, 0, 256, 176);
    g.fillStyle = C.gold; g.fillRect(0, 22, 256, 8); g.fillRect(0, 146, 256, 4);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#F4E3B8';
    g.font = `700 30px ${FONT_MY}`; g.fillText('အမှန်မြင်ခြင်း', 128, 74, 236);
    g.font = `500 22px ${FONT_MY}`; g.fillText('မိတ်ဆက်ပွဲ', 128, 116, 236);
    // a little gold sparkle
    g.fillStyle = C.goldL; g.beginPath(); g.moveTo(128, 136); g.lineTo(131, 142); g.lineTo(128, 148); g.lineTo(125, 142); g.fill();
    tex.needsUpdate = true;
  }
  drawCover();
  fontsReady().then(drawCover);
  void cv;
  function setCount(k) {
    k = clamp(Math.round(k), 0, 24);
    if (stackMesh) { stackMesh.geometry.dispose(); stackMesh.removeFromParent(); }
    stackMesh = null;
    cover.visible = k > 0;
    if (!k) return;
    const s = new VoxelBuilder();
    const bw = 0.3, bd = 0.2, bh = 0.008;
    for (let i = 0; i < k; i++) {
      const y = T + bh / 2 + i * bh, dx = ((i * 37) % 7 - 3) * 0.002, ry = ((i * 53) % 5 - 2) * 0.012;
      s.box(dx, y, 0, bw, bh * 0.55, bd, '#F0E8D6', ry);              // pages
      s.box(dx - 0.001, y + bh * 0.33, 0, bw + 0.004, bh * 0.25, bd + 0.004, C.maroon, ry); // cover
      s.box(dx - 0.001, y - bh * 0.33, 0, bw + 0.004, bh * 0.25, bd + 0.004, C.maroonD, ry);
      s.box(dx - bw / 2 - 0.001, y, 0, 0.004, bh, bd + 0.004, C.maroonD, ry); // spine
    }
    stackMesh = s.mesh({ outline: false });
    stack.add(stackMesh);
    cover.position.set(0, T + k * bh + 0.0015, 0);
  }
  setCount(n);
  const sh = shadowUnder(root, 0.26, 0.17, 0, 0, 0.4);
  return { root, setCount, dispose() { stackMesh?.geometry.dispose(); tex.dispose(); cover.material.dispose(); cover.geometry.dispose(); sh.geometry.dispose(); disposeTree(root); } };
}

// --- carried lights ------------------------------------------------------------------------
function wordCanvas(text, color = PALETTE.ink, w = 192, h = 160, edge = '#B07A22') {
  const t = canvasTex(w, h);
  const draw = (s) => {
    const g = t.g;
    g.clearRect(0, 0, w, h);
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.lineJoin = 'round';
    const long = s.length > 3;
    if (!long) {
      // one word, scaled so its INK (not the font box) fills ~84% of the height: Maya's word reads at 412 px
      g.font = `700 100px ${FONT_MY}`;
      const m = g.measureText(s || ' ');
      const gh = Math.max(1, m.actualBoundingBoxAscent + m.actualBoundingBoxDescent), gw = Math.max(1, m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
      const k = Math.min((h * 0.84) / gh, (w * 0.86) / gw);
      g.font = `700 ${Math.round(100 * k)}px ${FONT_MY}`;
      const m2 = g.measureText(s);
      const y = h / 2 + (m2.actualBoundingBoxAscent - m2.actualBoundingBoxDescent) / 2;
      const x = w / 2 + (m2.actualBoundingBoxLeft - m2.actualBoundingBoxRight) / 2;
      g.strokeStyle = edge; g.lineWidth = Math.max(4, k * 7); g.strokeText(s, x, y);
      g.fillStyle = color; g.fillText(s, x, y);
    } else {
      // a written line, wrapped to the face
      g.font = `700 34px ${FONT_MY}`;
      g.fillStyle = color;
      const words = s.split(' ');
      const rows = [];
      let line = '';
      for (const wd of words) { const tt = line ? line + ' ' + wd : wd; if (g.measureText(tt).width > w - 16 && line) { rows.push(line); line = wd; } else line = tt; }
      rows.push(line);
      let y = h / 2 - ((rows.length - 1) * 50) / 2 + 12;
      for (const row of rows) { g.strokeStyle = edge; g.lineWidth = 3; g.strokeText(row, w / 2, y); g.fillText(row, w / 2, y); y += 50; }
    }
    t.tex.needsUpdate = true;
  };
  return { ...t, draw };
}

/**
 * Round folded paper lantern (0.26 m) hanging from the tip of a 0.5 m bamboo stick; root = the grip
 * (attach to a hand). setGlow(0..1) lights the paper; setWord(text) writes on its front ('စာ' for
 * Maya's light, a short line for Nay Chi's). opts.stick = false: just the lantern, root = its hook.
 */
export function paperLantern({ color = '#F1D9AA', word = '', pool = null, stick = true, size = 1 } = {}) {
  const root = new THREE.Group();
  root.name = 'paperLantern';
  const v = new VoxelBuilder();
  const tip = stick ? new THREE.Vector3(0.17, 0.46, 0.06) : new THREE.Vector3();
  if (stick) {
    seg(v, 0, -0.06, 0, tip.x, tip.y, tip.z, 0.022, C.bamboo);
    for (const f of [0.2, 0.55, 0.88]) seg(v, tip.x * f, tip.y * f - 0.006, tip.z * f, tip.x * f, tip.y * f + 0.006, tip.z * f, 0.03, C.bambooD); // nodes
    v.box(tip.x, tip.y + 0.004, tip.z, 0.05, 0.016, 0.014, C.iron); // the little hook
  }
  root.add(v.mesh({ px: 1.2 }));
  const hang = new THREE.Group();
  hang.position.copy(tip);
  root.add(hang);
  const s = size;
  const b = new VoxelBuilder(), lit = new VoxelBuilder();
  b.box(0, -0.03 * s, 0, 0.004, 0.06 * s, 0.004, '#8C7A5A'); // string
  const tiers = [[0.06, 0.03], [0.1, 0.035], [0.124, 0.04], [0.13, 0.04], [0.124, 0.04], [0.1, 0.035], [0.06, 0.03]];
  let y = -0.07 * s;
  prism(b, 0, y + 0.006 * s, 0, 0.045 * s, 0.045 * s, 0.018 * s, C.maroonD); // top cap
  tiers.forEach(([r, h], i) => {
    const yy = y - (h * s) / 2;
    lit.add(prismGeo(r * s, r * s, h * s), i % 2 ? shade(color, 0.92) : color, _m.makeTranslation(0, yy, 0));
    y -= h * s;
  });
  prism(b, 0, y - 0.004 * s, 0, 0.045 * s, 0.045 * s, 0.016 * s, C.maroonD); // bottom cap
  b.box(0, y - 0.03 * s, 0, 0.012 * s, 0.03 * s, 0.012 * s, C.gold);         // tassel bead
  b.box(0, y - 0.06 * s, 0, 0.024 * s, 0.04 * s, 0.024 * s, '#C8323C');      // tassel
  const mid = (-0.07 * s + y) / 2;
  const mesh = litMesh(b, lit, { px: 1.3, tint: '#FFC46E' });
  hang.add(mesh);
  // the word on the front: maroon ink with a dark-gold edge on a curved patch just proud of the paper,
  // ~45% of the body's height, so it still reads when the lantern is fully lit
  const wc = wordCanvas(word || '', '#5E1220', 192, 160, '#9A6A1C');
  const FR = 0.136 * s, FA = 1.25;
  const faceGeo = new THREE.CylinderGeometry(FR, FR, 0.118 * s, 8, 1, true, -FA / 2, FA);
  const face = new THREE.Mesh(faceGeo, basic('#ffffff', { map: wc.tex, transparent: true, alphaTest: 0.05, toneMapped: false }));
  face.position.set(0, mid, 0);
  face.raycast = () => {};
  hang.add(face);
  let cur = word;
  const setWord = (t) => { cur = t || ''; wc.draw(cur); face.visible = !!cur; };
  setWord(word);
  fontsReady().then(() => setWord(cur));
  const glow = glowHandle(hang, _v2.set(0, mid, 0), 0.9 * s, '#FFC878', pool);
  let g0 = 0;
  const api = {
    root, kind: 'lantern', hang,
    setGlow(t) { g0 = clamp(t, 0, 1); mesh.userData.setGlow(g0); glow.set(g0); },
    setWord,
    spin() {},
    update(dt, t) {
      hang.rotation.z = Math.sin(t * 1.7 + root.id) * 0.07;
      hang.rotation.x = Math.sin(t * 1.3 + root.id * 0.7) * 0.05;
      if (g0 > 0) { const f = g0 * (0.95 + 0.05 * Math.sin(t * 8.7 + root.id)); mesh.userData.setGlow(f); glow.set(f); }
    },
    dispose() { glow.dispose(); wc.tex.dispose(); face.material.dispose(); face.geometry.dispose(); mesh.userData.ownMat.dispose(); disposeTree(root); },
  };
  return api;
}

// glyph "6" read from the south (rows run -Z -> +Z); from the north it reads "9"
const SIX = ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'];

/**
 * The guests' own lights, each made from their own road (0.2-0.4 m, a few boxes, the lit parts in the
 * same mesh). root = the grip (hand height); most hang below it. Kinds: windmillLamp (spins), beanJar,
 * clayLamp, raftLamp, kiteLamp (on a 1 m line), teapotLamp, blockLamp, typeLamp (6/9 block), emberTin,
 * weaveLamp, vineLamp, plain (= paperLantern with a written line). Unknown kinds give a paperLantern.
 * opts: { color, pool (createGlowPool), word, count (clayLamp: 2 or 4), size (body scale from the grip,
 * default 1.6 so each lamp reads as its own shape in a crowd at 412 px), halo (halo size multiplier) }.
 */
export function guestLight(kind, { color, pool = null, word = '', count = 2, size = 1.6, halo: haloK = 1.3 } = {}) {
  if (kind === 'plain' || !GUEST[kind]) return Object.assign(paperLantern({ color: color || '#F1D9AA', word, pool, size: Math.max(1, size * 0.9) }), { kind: kind || 'lantern' });
  const root = new THREE.Group();
  root.name = `guestLight-${kind}`;
  const body = new THREE.Group(); // the model, scaled from the grip
  body.scale.setScalar(size);
  root.add(body);
  const v = new VoxelBuilder(), lit = new VoxelBuilder();
  const spec = GUEST[kind](v, lit, { color, count, root: body });
  const mesh = litMesh(v, lit, { px: 1.2, tint: spec.tint || '#FFC46E' });
  (spec.parent || body).add(mesh);
  // a pooled halo is sized in world units (scale it here); a sprite inherits the body's scale
  const gs = (spec.glowSize || 0.7) * haloK * (pool ? size : 1);
  const glow = glowHandle(spec.parent || body, spec.glowAt, gs, spec.glowColor || '#FFC878', pool);
  let g0 = 0;
  return {
    root, kind,
    setGlow(t) { g0 = clamp(t, 0, 1); mesh.userData.setGlow(g0); glow.set(g0); spec.setGlow?.(g0); },
    spin(dt) { spec.spin?.(dt); },
    update(dt, t) {
      spec.update?.(dt, t);
      if (g0 > 0) { const f = g0 * (spec.flicker ? 0.86 + 0.14 * Math.sin(t * 13.1 + root.id) * Math.sin(t * 7.3) : 0.95 + 0.05 * Math.sin(t * 6.1 + root.id)); mesh.userData.setGlow(f); glow.set(f); }
    },
    dispose() { glow.dispose(); spec.dispose?.(); mesh.userData.ownMat.dispose(); disposeTree(root); },
  };
}

/** a wire bail from the grip (0,0,0) down to two points at y = -drop, half-width hw */
function bail(v, hw, drop, col = C.iron) {
  v.box(0, 0.004, 0, 0.03, 0.012, 0.012, col);
  for (const sx of [-1, 1]) boxR(v, sx * hw / 2, -drop / 2, 0, 0.008, Math.hypot(hw, drop), 0.008, col, 0, 0, sx * Math.atan2(hw, drop));
}

const GUEST = {
  // a plain paper lantern on a short bamboo stick, stick and paper in ONE mesh (2 draw calls, not the
  // 4-5 of paperLantern): the cheap twin for a crowd (Day 15's launch). opts.color tints the paper.
  paperLamp(v, lit, { color }) {
    const col = color || '#F1D9AA', s = 0.87;
    const tx = 0.17 * s, ty = 0.46 * s, tz = 0.06 * s;
    seg(v, 0, -0.06 * s, 0, tx, ty, tz, 0.022 * s, C.bamboo);
    v.box(tx, ty + 0.004 * s, tz, 0.05 * s, 0.016 * s, 0.014 * s, C.iron);
    v.box(tx, ty - 0.03 * s, tz, 0.004, 0.06 * s, 0.004, '#8C7A5A');
    let y = ty - 0.07 * s;
    prism(v, tx, y + 0.006 * s, tz, 0.045 * s, 0.045 * s, 0.018 * s, C.maroonD);
    [[0.06, 0.03], [0.1, 0.035], [0.124, 0.04], [0.13, 0.04], [0.124, 0.04], [0.1, 0.035], [0.06, 0.03]].forEach(([r, h], i) => {
      lit.add(prismGeo(r * s, r * s, h * s), i % 2 ? shade(col, 0.92) : col, _m.makeTranslation(tx, y - (h * s) / 2, tz));
      y -= h * s;
    });
    prism(v, tx, y - 0.004 * s, tz, 0.045 * s, 0.045 * s, 0.016 * s, C.maroonD);
    v.box(tx, y - 0.03 * s, tz, 0.012 * s, 0.03 * s, 0.012 * s, C.gold);
    v.box(tx, y - 0.06 * s, tz, 0.024 * s, 0.04 * s, 0.024 * s, '#C8323C');
    return { glowAt: new THREE.Vector3(tx, (ty - 0.07 * s + y) / 2, tz), glowSize: 0.62 };
  },
  // Pho Thar: a paper windmill on a stick with a little paper lamp hung under the hub
  windmillLamp(v, lit, { root }) {
    v.box(0, 0.2, 0, 0.02, 0.48, 0.02, C.bamboo);
    v.box(0, 0.44, 0.02, 0.03, 0.03, 0.04, C.woodD);
    v.box(0, 0.38, 0.06, 0.006, 0.08, 0.006, C.iron); // the lamp's wire
    v.box(0, 0.335, 0.06, 0.06, 0.01, 0.06, C.maroonD);
    lit.box(0, 0.3, 0.06, 0.05, 0.06, 0.05, '#F3DDB0');
    v.box(0, 0.268, 0.06, 0.06, 0.01, 0.06, C.maroonD);
    const rotor = new VoxelBuilder();
    const cols = [C.maroon, '#F3E6CC', C.gold, '#F3E6CC'];
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      // a blade: a long vane out from the hub, its tip folded back toward the centre
      boxR(rotor, ca * 0.042, sa * 0.042, 0, 0.075, 0.034, 0.004, cols[k], 0, 0, a);
      boxR(rotor, ca * 0.07 - sa * 0.018, sa * 0.07 + ca * 0.018, 0.006, 0.03, 0.03, 0.004, shade(cols[k], 0.82), 0.35 * 0, 0, a + 0.785);
    }
    rotor.box(0, 0, 0.014, 0.022, 0.022, 0.016, C.gold);
    const rm = rotor.mesh({ px: 1.1 });
    rm.position.set(0, 0.44, 0.05);
    root.add(rm);
    return { glowAt: new THREE.Vector3(0, 0.3, 0.06), glowSize: 0.55, spin(dt) { rm.rotation.z -= dt * 6; }, update(dt) { rm.rotation.z -= dt * 3; }, dispose() { rm.geometry.dispose(); } };
  },
  // Toe Toe: a glass jar with a sprouted bean and a candle, on a wire bail
  beanJar(v, lit) {
    bail(v, 0.12, 0.1);
    prism(v, 0, -0.1, 0, 0.062, 0.062, 0.014, C.tin);           // screw band
    lit.add(prismGeo(0.06, 0.066, 0.13), '#EFE3BE', _m.makeTranslation(0, -0.175, 0)); // glass, candle-lit
    prism(v, 0, -0.244, 0, 0.062, 0.058, 0.012, '#B7AE96');
    v.box(0, -0.26, 0.0, 0.08, 0.004, 0.08, '#6E5038');
    // the sprout out of the open top
    boxR(v, 0.005, -0.06, 0.01, 0.008, 0.08, 0.008, C.leafL, 0, 0, -0.15);
    for (const sx of [-1, 1]) boxR(v, 0.012 + sx * 0.022, -0.018, 0.01, 0.04, 0.008, 0.026, sx > 0 ? C.leaf : C.leafL, 0, 0.3 * sx, sx * 0.35);
    v.box(0.01, -0.032, 0.022, 0.018, 0.012, 0.012, '#E9DCC0'); // the bean's coat
    v.box(0.0, -0.16, 0.067, 0.03, 0.05, 0.004, C.leafD); // a paper label with a leaf
    return { glowAt: new THREE.Vector3(0, -0.17, 0), glowSize: 0.6 };
  },
  // Daw Ohn / Mi Cho: small thrown clay lamps on a wooden tray, held flat
  clayLamp(v, lit, { count = 2 }) {
    const n = count >= 4 ? 4 : 2, W = n === 4 ? 0.3 : 0.2;
    v.box(0, 0.008, 0, W, 0.016, 0.12, C.woodL);
    for (const sz of [-1, 1]) v.box(0, 0.024, sz * 0.056, W, 0.018, 0.012, C.wood);
    for (const sx of [-1, 1]) v.box(sx * (W / 2 - 0.006), 0.024, 0, 0.012, 0.018, 0.12, C.wood);
    for (let i = 0; i < n; i++) {
      const x = -W / 2 + (i + 0.5) * (W / n);
      prism(v, x, 0.028, 0, 0.026, 0.02, 0.016, i % 2 ? C.clay : C.clayL);
      prism(v, x, 0.038, 0, 0.03, 0.026, 0.006, C.clayD);
      v.box(x, 0.038, 0.03, 0.012, 0.008, 0.02, C.clay); // pinched spout
      prism(v, x, 0.042, 0, 0.022, 0.022, 0.002, '#6E4A22'); // oil
      lit.box(x, 0.056, 0.036, 0.012, 0.03, 0.012, '#FFE2A0');  // flame
      lit.box(x, 0.074, 0.036, 0.006, 0.012, 0.006, '#FFF2C8');
    }
    return { glowAt: new THREE.Vector3(0, 0.07, 0.03), glowSize: 0.55, flicker: true };
  },
  // Ko Thiha: the raft's patched hurricane lamp
  raftLamp(v, lit) {
    bail(v, 0.15, 0.06);
    prism(v, 0, -0.07, 0, 0.03, 0.05, 0.03, C.tinD);             // top cap / vent
    prism(v, 0, -0.088, 0, 0.055, 0.055, 0.01, C.tin);
    lit.add(prismGeo(0.045, 0.055, 0.11), '#F4E2B6', _m.makeTranslation(0, -0.15, 0)); // globe
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; v.box(Math.sin(a) * 0.06, -0.15, Math.cos(a) * 0.06, 0.008, 0.12, 0.008, C.iron); }
    prism(v, 0, -0.215, 0, 0.065, 0.065, 0.014, C.tin);
    prism(v, 0, -0.245, 0, 0.07, 0.075, 0.045, '#B35A3A');        // red-painted font
    prism(v, 0, -0.27, 0, 0.074, 0.074, 0.01, C.tinD);
    v.box(0.03, -0.24, 0.07, 0.05, 0.03, 0.004, '#E9DFC2');       // patch
    v.box(-0.035, -0.25, 0.062, 0.03, 0.02, 0.004, '#C9B07A', 0.4);  // another patch
    v.box(0.0, 0.0, 0.0, 0.05, 0.02, 0.02, '#A08A60');             // twine on the handle
    v.box(0.075, -0.24, 0.0, 0.02, 0.02, 0.02, C.brassD);          // wick knob
    return { glowAt: new THREE.Vector3(0, -0.15, 0), glowSize: 0.7, flicker: true };
  },
  // Ma Thiri: a small kite on a short line, a tail of tiny lamps
  kiteLamp(v, lit, { root }) {
    const fly = new THREE.Group();
    root.add(fly);
    prism(v, 0, 0, 0, 0.022, 0.022, 0.07, C.woodL, 8, 0, 0, Math.PI / 2); // reel
    for (const sx of [-1, 1]) prism(v, sx * 0.04, 0, 0, 0.032, 0.032, 0.008, C.woodD, 8, 0, 0, Math.PI / 2);
    const K = new THREE.Vector3(0.35, 0.92, -0.1);
    seg(v, 0, 0.02, 0, K.x, K.y - 0.1, K.z, 0.005, '#EDE6D3'); // the line
    // the kite: a diamond on a cross of sticks
    boxR(v, K.x, K.y, K.z, 0.16, 0.16, 0.006, C.maroon, 0, 0, Math.PI / 4);
    boxR(v, K.x, K.y, K.z + 0.004, 0.08, 0.08, 0.006, C.gold, 0, 0, Math.PI / 4);
    v.box(K.x, K.y, K.z + 0.008, 0.008, 0.23, 0.008, C.bambooD);
    v.box(K.x, K.y + 0.02, K.z + 0.008, 0.2, 0.008, 0.008, C.bambooD);
    for (let i = 0; i < 4; i++) {
      const y = K.y - 0.15 - i * 0.075, x = K.x + Math.sin(i * 1.2) * 0.03;
      v.box(x, y + 0.035, K.z, 0.004, 0.05, 0.004, '#EDE6D3');
      if (i % 2 === 0) lit.box(x, y, K.z, 0.03, 0.035, 0.03, i === 0 ? '#F3DDB0' : '#F6C9A0');
      else v.box(x, y, K.z, 0.05, 0.02, 0.004, i % 3 ? C.rose : C.gold, 0.6);
    }
    return { parent: fly, glowAt: new THREE.Vector3(K.x, K.y - 0.18, K.z), glowSize: 0.6, update(dt, t) { fly.rotation.z = Math.sin(t * 1.1 + root.id) * 0.05; fly.rotation.x = Math.sin(t * 0.8 + root.id) * 0.04; } };
  },
  // Ko Phyo: a teapot lantern, light through punched stars and the lid gap
  teapotLamp(v, lit) {
    v.box(0, -0.02, 0, 0.012, 0.04, 0.012, C.iron);
    boxR(v, 0, -0.045, 0, 0.1, 0.012, 0.012, C.woodD);                 // the cane handle across the top
    for (const sx of [-1, 1]) v.box(sx * 0.05, -0.07, 0, 0.012, 0.05, 0.012, C.woodD);
    prism(v, 0, -0.1, 0, 0.03, 0.03, 0.012, C.clayD);                   // lid knob
    lit.add(prismGeo(0.06, 0.06, 0.008), '#FFD88E', _m.makeTranslation(0, -0.112, 0)); // lid gap glow
    prism(v, 0, -0.118, 0, 0.062, 0.062, 0.008, '#7A4A30');
    prism(v, 0, -0.14, 0, 0.08, 0.062, 0.036, '#8E5A3A');
    prism(v, 0, -0.18, 0, 0.09, 0.08, 0.044, '#9C6440');
    prism(v, 0, -0.215, 0, 0.068, 0.09, 0.026, '#7A4A30');
    prism(v, 0, -0.232, 0, 0.055, 0.055, 0.008, '#5E3A24');
    boxR(v, 0.11, -0.16, 0, 0.022, 0.08, 0.022, '#8E5A3A', 0, 0, -0.8);  // spout
    lit.box(0.14, -0.13, 0, 0.018, 0.012, 0.018, '#FFD88E');
    boxR(v, -0.1, -0.17, 0, 0.012, 0.06, 0.02, '#7A4A30', 0, 0, 0.5);    // little side handle
    v.box(0.05, -0.135, 0.06, 0.02, 0.012, 0.01, C.cream);                // the chip in the rim, showing the clay
    for (const [a, yy] of [[0, -0.18], [0.7, -0.165], [-0.7, -0.195], [1.4, -0.18], [-1.4, -0.17]]) lit.box(Math.sin(a) * 0.088, yy, Math.cos(a) * 0.088, 0.016, 0.016, 0.006, '#FFD88E', a);
    return { glowAt: new THREE.Vector3(0, -0.17, 0), glowSize: 0.6 };
  },
  // Ko Lwin and Khwar Nyo: a carved-block lantern, light through the cut border
  blockLamp(v, lit) {
    v.box(0, -0.015, 0, 0.05, 0.012, 0.012, C.iron);
    for (const sx of [-1, 1]) boxR(v, sx * 0.03, -0.04, 0, 0.008, 0.05, 0.008, C.iron, 0, 0, sx * 0.6);
    prism(v, 0, -0.075, 0, 0.02, 0.1, 0.04, C.woodD, 4, Math.PI / 4); // roof
    const S = 0.15, y0 = -0.095 - S;
    lit.box(0, y0 + S / 2, 0, S - 0.02, S - 0.01, S - 0.02, '#FFD596'); // inner light box
    for (const [nx, nz, ry] of [[0, 1, 0], [0, -1, 0], [1, 0, Math.PI / 2], [-1, 0, Math.PI / 2]]) {
      const cx = nx * (S / 2 - 0.005), cz = nz * (S / 2 - 0.005);
      // each face: a carved block with a cut border (gaps show the glow), a centre motif
      const piece = (u, w, yy, h) => { const ox = Math.cos(ry) * u, oz = -Math.sin(ry) * u; v.box(cx + ox, y0 + yy, cz + oz, nz ? w : 0.014, h, nz ? 0.014 : w, '#7A5434'); };
      piece(0, S, 0.012, 0.024); piece(0, S, S - 0.012, 0.024);       // top and bottom rails
      for (const s of [-1, 1]) piece(s * (S / 2 - 0.012), 0.024, S / 2, S);
      piece(0, S - 0.07, S / 2, S - 0.07);                              // the inner block (border cut round it)
      for (let k = 0; k < 4; k++) { const ox = Math.cos(ry) * ((k - 1.5) * 0.024), oz = -Math.sin(ry) * ((k - 1.5) * 0.024); v.box(cx + ox, y0 + 0.03, cz + oz, nz ? 0.012 : 0.02, 0.016, nz ? 0.02 : 0.012, '#7A5434'); } // carved teeth across the border
      const fx = cx + nx * 0.006, fz = cz + nz * 0.006;
      v.box(fx, y0 + S / 2, fz, nz ? 0.03 : 0.006, 0.03, nz ? 0.006 : 0.03, C.maroon, Math.PI / 4); // stamped mark
    }
    v.box(0, y0 - 0.006, 0, S + 0.01, 0.012, S + 0.01, C.woodD);
    return { glowAt: new THREE.Vector3(0, y0 + S / 2, 0), glowSize: 0.65 };
  },
  // Ko Wunna: a box lamp with a printer's type block on top, 6 from the south, 9 from the north
  typeLamp(v, lit) {
    bail(v, 0.2, 0.09);
    const S = 0.13, y1 = -0.09, y0 = y1 - S;
    lit.box(0, (y0 + y1) / 2, 0, S - 0.012, S - 0.012, S - 0.012, '#F4DCAA');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * S / 2, (y0 + y1) / 2, sz * S / 2, 0.014, S + 0.01, 0.014, C.woodD);
    for (const yy of [y0, y1]) v.box(0, yy, 0, S + 0.016, 0.014, S + 0.016, C.woodD);
    // the type block: lead body, a shoulder, the raised glyph on its top face
    v.box(0, y1 + 0.035, 0, 0.07, 0.055, 0.085, '#8E9096');
    v.box(0, y1 + 0.064, 0, 0.074, 0.004, 0.09, '#A6A8AE');
    v.box(-0.037, y1 + 0.035, 0.0, 0.004, 0.02, 0.06, '#6E7076'); // the nick
    SIX.forEach((row, ri) => [...row].forEach((ch, ci) => { if (ch === '#') v.box(-0.024 + ci * 0.012, y1 + 0.072, -0.036 + ri * 0.012, 0.012, 0.012, 0.012, PALETTE.ink); }));
    return { glowAt: new THREE.Vector3(0, (y0 + y1) / 2, 0), glowSize: 0.6 };
  },
  // Daw Khin May / Maung Arkar: an oven-ember tin, punched holes glowing orange
  emberTin(v, lit) {
    bail(v, 0.13, 0.06);
    prism(v, 0, -0.075, 0, 0.06, 0.066, 0.02, C.tinD);
    prism(v, 0, -0.15, 0, 0.065, 0.065, 0.13, C.tin);
    prism(v, 0, -0.218, 0, 0.068, 0.068, 0.01, C.tinD);
    for (let row = 0; row < 4; row++) for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + (row % 2) * 0.5, y = -0.11 - row * 0.03;
      lit.box(Math.sin(a) * 0.066, y, Math.cos(a) * 0.066, 0.014, 0.014, 0.004, row % 2 ? '#FF9A50' : '#FFB86A', a);
    }
    prism(v, 0, -0.205, 0, 0.069, 0.069, 0.006, '#9C4A28'); // a soot ring at the foot
    return { glowAt: new THREE.Vector3(0, -0.15, 0), glowSize: 0.6, glowColor: '#FF9A50', tint: '#FF9C52', flicker: true };
  },
  // Ei Mon: a lantern wrapped in one strip of her own weaving
  weaveLamp(v, lit) {
    bail(v, 0.12, 0.05);
    prism(v, 0, -0.06, 0, 0.075, 0.075, 0.016, C.woodD);
    lit.add(prismGeo(0.072, 0.072, 0.17), '#F3E0BA', _m.makeTranslation(0, -0.153, 0));
    prism(v, 0, -0.245, 0, 0.075, 0.075, 0.016, C.woodD);
    const band = ['#3E5C8A', C.gold, C.maroon, C.cream];
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      for (let row = 0; row < 3; row++) {
        const col = band[(k + row * 2) % 4];
        v.box(Math.sin(a) * 0.076, -0.13 - row * 0.022, Math.cos(a) * 0.076, 0.03, 0.022, 0.006, col, a);
      }
    }
    v.box(0.05, -0.2, 0.07, 0.012, 0.06, 0.004, C.maroon, 0.6); // the strip's tied end hanging
    v.box(0.06, -0.2, 0.07, 0.012, 0.05, 0.004, '#3E5C8A', 0.6);
    return { glowAt: new THREE.Vector3(0, -0.153, 0), glowSize: 0.65 };
  },
  // U Hpo Htaw: a lamp on a short crook, a vine trained up a stake beside it (not coiled round)
  vineLamp(v, lit) {
    v.box(0, 0.18, 0, 0.022, 0.44, 0.022, C.woodD);
    v.box(0.05, 0.39, 0, 0.1, 0.018, 0.018, C.woodD);
    v.box(0.09, 0.36, 0, 0.006, 0.05, 0.006, C.iron);
    v.box(0.09, 0.33, 0, 0.065, 0.012, 0.065, C.tinD);
    lit.box(0.09, 0.29, 0, 0.055, 0.07, 0.055, '#F4DEB0');
    v.box(0.09, 0.25, 0, 0.065, 0.012, 0.065, C.tinD);
    // the vine stake, parallel, tied twice; leaves alternate up it
    v.box(-0.05, 0.17, 0.0, 0.01, 0.4, 0.01, C.bambooD);
    for (const y of [0.1, 0.28]) v.box(-0.025, y, 0, 0.06, 0.01, 0.014, '#A08A60');
    for (let i = 0; i < 7; i++) {
      const y = 0.02 + i * 0.055, s = i % 2 ? 1 : -1;
      v.box(-0.05, y + 0.025, 0.004, 0.008, 0.06, 0.008, C.leafD);
      boxR(v, -0.05 + s * 0.022, y + 0.03, 0.01, 0.036, 0.026, 0.006, i % 3 ? C.leaf : C.leafL, 0, 0, s * 0.5);
    }
    v.box(-0.05, 0.4, 0.01, 0.014, 0.02, 0.014, '#E9C8D0'); // a bud at the top
    return { glowAt: new THREE.Vector3(0.09, 0.29, 0), glowSize: 0.55 };
  },
};

/**
 * The festival banner (3.2 x 0.5 m) strung between two existing lamp posts `gap` apart, cords tied at
 * y; a line of paper bunting above. Cloth sways softly in update(). posts: true adds two poles.
 */
export function banner({ text = ['စာအုပ် မိတ်ဆက်ပွဲ', 'လာချင်သူ အားလုံး ကြိုဆိုပါတယ်'], gap = 4.2, y = 2.38, posts = false } = {}) {
  const root = new THREE.Group();
  root.name = 'banner';
  const BW = 3.2, BH = 0.5, top = y - 0.06;
  const v = new VoxelBuilder();
  // batten along the top, cords to the posts
  v.box(0, top + 0.02, 0, BW + 0.1, 0.035, 0.035, C.bambooD);
  for (const sx of [-1, 1]) {
    const ax = sx * (BW / 2 + 0.03), bx = sx * (gap / 2 - 0.08);
    const L = Math.hypot(bx - ax, y - top - 0.02);
    boxR(v, (ax + bx) / 2, (y + top + 0.02) / 2, 0, L, 0.012, 0.012, '#B8A57E', 0, 0, Math.atan2(y - top - 0.02, bx - ax));
    v.box(bx, y, 0, 0.06, 0.05, 0.12, '#B8A57E'); // the knot round the post
  }
  if (posts) for (const sx of [-1, 1]) { v.box(sx * gap / 2, y / 2 + 0.2, 0, 0.1, y + 0.4, 0.1, C.woodD); v.box(sx * gap / 2, 0.06, 0, 0.3, 0.12, 0.3, C.woodD); }
  root.add(v.mesh({ px: 1.3 }));
  // bunting: small triangles on a sagging string above (no outline: single sheets)
  const bv = new VoxelBuilder();
  const tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.07, 0, 0, 0.07, 0, 0, 0, -0.13, 0, 0.07, 0, 0, -0.07, 0, 0, 0, -0.13, 0], 3));
  tri.computeVertexNormals();
  const cols = [C.maroon, C.gold, '#F3E6CC', C.rose];
  const sag = (x) => y + 0.32 - 0.22 * (1 - (2 * x / gap) ** 2);
  for (let x = -gap / 2 + 0.25, i = 0; x < gap / 2 - 0.2; x += 0.26, i++) {
    _m.compose(_p.set(x, sag(x), 0.02), _q.setFromEuler(_e.set(0, 0, 0)), _s.set(1, 1, 1));
    bv.add(tri, cols[i % 4], _m);
    const nx = x + 0.26;
    boxR(bv, x + 0.13, (sag(x) + sag(nx)) / 2, 0.02, 0.27, 0.008, 0.008, '#B8A57E', 0, 0, Math.atan2(sag(nx) - sag(x), 0.26));
  }
  const bunting = bv.mesh({ outline: false });
  bunting.material = bunting.material.clone();
  bunting.material.side = THREE.DoubleSide;
  root.add(bunting);
  // the cloth: a segmented plane with the canvas text, swaying at its lower edge
  const { cv, g, tex } = canvasTex(1024, 160);
  const geo = new THREE.PlaneGeometry(BW, BH, 24, 3);
  geo.translate(0, top - BH / 2, 0.0);
  const base = geo.attributes.position.array.slice();
  const mat = new THREE.MeshToonMaterial({ map: tex, gradientMap: gradientMap(), side: THREE.DoubleSide });
  const cloth = new THREE.Mesh(geo, mat);
  root.add(cloth);
  let cur = text;
  function draw() {
    const w = cv.width, h = cv.height;
    g.fillStyle = '#F4EAD2'; g.fillRect(0, 0, w, h);
    g.fillStyle = C.maroon; g.fillRect(0, 0, w, 14); g.fillRect(0, h - 14, w, 14);
    g.fillStyle = C.gold; g.fillRect(0, 14, w, 4); g.fillRect(0, h - 18, w, 4);
    const lines = Array.isArray(cur) ? cur : [cur];
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = C.maroon;
    g.font = `700 50px ${FONT_MY}`;
    g.fillText(lines[0] || '', w / 2, lines[1] ? 58 : h / 2, w - 200);
    if (lines[1]) { g.font = `500 32px ${FONT_MY}`; g.fillStyle = '#6A4A2E'; g.fillText(lines[1], w / 2, 116, w - 200); }
    // gold four-point sparkles at both ends
    for (const x of [70, w - 70]) {
      g.fillStyle = C.gold;
      g.beginPath(); g.moveTo(x, 40); g.quadraticCurveTo(x + 5, 75, x + 34, 80); g.quadraticCurveTo(x + 5, 85, x, 120); g.quadraticCurveTo(x - 5, 85, x - 34, 80); g.quadraticCurveTo(x - 5, 75, x, 40); g.fill();
    }
    tex.needsUpdate = true;
  }
  draw();
  fontsReady().then(draw);
  const pos = geo.attributes.position;
  return {
    root,
    setText(t) { cur = t; draw(); },
    update(dt, t) {
      const a = pos.array;
      for (let i = 0; i < pos.count; i++) {
        const bx = base[i * 3], by = base[i * 3 + 1];
        const down = (top - by) / BH; // 0 at the batten, 1 at the hem
        a[i * 3 + 2] = Math.sin(t * 1.6 + bx * 1.8) * 0.035 * down + Math.sin(t * 2.7 + bx * 3.1) * 0.012 * down;
        a[i * 3 + 1] = by - (1 - (2 * bx / BW) ** 2) * 0.01 * down;
      }
      pos.needsUpdate = true;
    },
    dispose() { tex.dispose(); mat.dispose(); geo.dispose(); tri.dispose(); bunting.material.dispose(); disposeTree(root); },
  };
}

/** The Café's tea table out on the forecourt: Ko Phyo's chipped pot, a tray of cups, a flask, steam. */
export function teaTable() {
  const root = new THREE.Group();
  root.name = 'teaTable';
  const v = new VoxelBuilder();
  const W = 0.9, D = 0.56, Y = 0.7;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * (W / 2 - 0.06), (Y - 0.03) / 2, sz * (D / 2 - 0.06), 0.05, Y - 0.03, 0.05, C.woodD);
  v.box(0, 0.18, 0, W - 0.1, 0.03, D - 0.1, C.wood); // lower shelf
  v.box(0, Y - 0.015, 0, W, 0.03, D, C.woodL);
  v.box(0, Y + 0.004, 0, W - 0.04, 0.008, D - 0.04, C.cream); // cloth
  for (const sz of [-1, 1]) v.box(0, Y + 0.006, sz * (D / 2 - 0.05), W - 0.04, 0.008, 0.02, C.maroon);
  // the big pot (chipped), on a little stand
  const px = -0.22;
  v.box(px, Y + 0.02, 0, 0.18, 0.02, 0.18, C.iron);
  prism(v, px, Y + 0.06, 0, 0.1, 0.075, 0.06, '#8E5A3A');
  prism(v, px, Y + 0.115, 0, 0.11, 0.1, 0.05, '#9C6440');
  prism(v, px, Y + 0.155, 0, 0.075, 0.11, 0.03, '#7A4A30');
  prism(v, px, Y + 0.175, 0, 0.065, 0.065, 0.012, '#5E3A24');
  prism(v, px, Y + 0.19, 0, 0.02, 0.025, 0.02, '#5E3A24');
  boxR(v, px + 0.13, Y + 0.13, 0, 0.026, 0.1, 0.026, '#8E5A3A', 0, 0, -0.85);
  boxR(v, px - 0.125, Y + 0.12, 0, 0.018, 0.08, 0.03, '#7A4A30', 0, 0, 0.4);
  v.box(px + 0.04, Y + 0.165, 0.07, 0.03, 0.014, 0.012, C.clayL); // the chip
  // tray of small cups and saucers
  v.box(0.15, Y + 0.016, 0.0, 0.34, 0.016, 0.24, C.brassD);
  for (let i = 0; i < 6; i++) {
    const x = 0.04 + (i % 3) * 0.11, z = -0.055 + Math.floor(i / 3) * 0.11;
    prism(v, x, Y + 0.028, z, 0.036, 0.036, 0.006, C.white);
    prism(v, x, Y + 0.05, z, 0.026, 0.02, 0.04, i === 4 ? '#F2E8D6' : C.white);
    prism(v, x, Y + 0.068, z, 0.024, 0.024, 0.003, i < 2 ? '#B7743A' : '#F2E8D6');
    v.box(x + 0.03, Y + 0.05, z, 0.012, 0.02, 0.006, C.white);
  }
  // a flask and a stack of saucers on the shelf, a cloth over the shelf's edge
  prism(v, 0.34, Y + 0.12, -0.17, 0.045, 0.045, 0.2, '#3E6E5A');
  prism(v, 0.34, Y + 0.23, -0.17, 0.03, 0.04, 0.02, C.tin);
  for (let i = 0; i < 4; i++) prism(v, -0.2, 0.2 + i * 0.012, 0.05, 0.05, 0.05, 0.01, C.white);
  v.box(0.25, 0.25, D / 2 - 0.08, 0.2, 0.1, 0.02, C.cream);
  root.add(v.mesh());
  // steam from the pot's spout
  const N = 5;
  const sm = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.5, depthWrite: false });
  const steam = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), sm, N);
  steam.frustumCulled = false;
  steam.raycast = () => {};
  root.add(steam);
  const sh = shadowUnder(root, 0.6, 0.4, 0, 0, 0.45);
  const sx0 = px + 0.17, sy0 = Y + 0.18;
  function update(dt, t) {
    for (let i = 0; i < N; i++) {
      const u = (t * 0.35 + i / N) % 1, s = 0.025 + u * 0.05;
      _m.compose(_p.set(sx0 + u * 0.06 + Math.sin(t * 2 + i) * 0.015, sy0 + u * 0.35, Math.sin(t * 1.3 + i) * 0.01), _q.setFromEuler(_e.set(u, i, 0)), _s.set(s, s, s));
      if (u > 0.75) _m.scale(_s.setScalar(Math.max(0.001, (1 - u) / 0.25)));
      steam.setMatrixAt(i, _m);
    }
    steam.instanceMatrix.needsUpdate = true;
  }
  update(0, 0);
  return { root, update, dispose() { sm.dispose(); steam.geometry.dispose(); sh.geometry.dispose(); disposeTree(root); } };
}

/**
 * The reply as a paper plane (0.3 m nose to tail, nose +Z). setFold(0..1): 0 a flat written sheet,
 * ~0.4 folded in half, 1 a finished plane with its wings out. update() adds a soft glide wobble once folded.
 */
export function paperPlane({ lines = true, seed = 4 } = {}) {
  const root = new THREE.Group();
  root.name = 'paperPlane';
  const r = rand(seed);
  const P = '#FBF7EC', PS = '#EAE2CF';
  const L = 0.3;
  // the flat sheet (A4-ish), ruled, written
  const sv = new VoxelBuilder(), sink = new VoxelBuilder();
  sv.box(0, 0, 0, 0.21, 0.003, L, P);
  if (lines) for (let i = 0; i < 9; i++) {
    const z = -L / 2 + 0.04 + i * 0.026;
    sink.box(0, 0.002, z, 0.18, 0.001, 0.002, '#C9D3DD');
    if (i < 8) for (let x = -0.085; x < 0.07 - (i === 7 ? 0.08 : 0);) { const w = 0.012 + r() * 0.028; sink.box(x + w / 2, 0.0025, z - 0.007, w, 0.001, 0.003, '#4E4640'); x += w + 0.006; }
  }
  const sheet = sv.mesh({ px: 1.1 });
  root.add(sheet);
  inkLayer(sink, sheet);
  // the plane: a keel and two hinged wings, thin triangular slabs (closed, so they take the outline)
  const plane = new THREE.Group();
  root.add(plane);
  const kv = new VoxelBuilder();
  kv.add(triSlab([0, L / 2], [0, -L / 2], [-0.05, -L / 2 + 0.03], 0.005), P, _m.makeRotationZ(Math.PI / 2)); // keel in the YZ plane, below
  const keel = kv.mesh({ px: 1.1 });
  plane.add(keel);
  const wings = [];
  for (const sx of [-1, 1]) {
    const hinge = new THREE.Group();
    plane.add(hinge);
    const wv = new VoxelBuilder(), wink = new VoxelBuilder();
    wv.add(triSlab([0, L / 2], [0, -L / 2], [sx * 0.105, -L / 2], 0.004), sx < 0 ? P : PS);
    if (lines) for (let k = 0; k < 3; k++) {
      const z = -L / 2 + 0.03 + k * 0.045, w = 0.09 * (1 - (z + L / 2) / L) - 0.02;
      if (w > 0.01) wink.box(sx * (0.012 + w / 2), 0.0025, z, w, 0.0008, 0.0025, k === 1 ? '#C9D3DD' : '#4E4640');
    }
    const wm = wv.mesh({ px: 1.1 });
    hinge.add(wm);
    inkLayer(wink, wm);
    wings.push([hinge, sx]);
  }
  let fold = 0;
  function setFold(t) {
    fold = clamp(t, 0, 1);
    const a = smooth(fold / 0.45);
    sheet.visible = fold < 0.45;
    sheet.scale.set(1 - a * 0.55, 1, 1 - a * 0.1);
    sheet.rotation.z = a * 0.4;
    plane.visible = fold >= 0.45;
    const b = smooth((fold - 0.45) / 0.55);
    for (const [h, sx] of wings) h.rotation.z = sx * (Math.PI / 2 + (0.12 - Math.PI / 2) * b);
    plane.scale.setScalar(0.9 + 0.1 * b);
  }
  setFold(0);
  return {
    root, setFold,
    update(dt, t) { if (fold >= 1) { plane.rotation.z = Math.sin(t * 2.3) * 0.12; plane.rotation.x = Math.sin(t * 1.7) * 0.05; } },
    dispose() { disposeTree(root); },
  };
}

// =============================================================================================
// SHARED SMALL THINGS
// =============================================================================================

/**
 * Proof slips: one stack of small torn paper slips (0.11 x 0.065 m) under a brass clip, pencil lines and
 * an ink tick on each. opts.text = { my } writes the top slip (canvas). setCount(n).
 */
export function proofSlips({ n = 3, text = null } = {}) {
  const root = new THREE.Group();
  root.name = 'proofSlips';
  let mesh = null;
  const W = 0.11, D = 0.065;
  const { g, tex } = canvasTex(256, 152);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.01, D - 0.012), basic('#ffffff', { map: tex, transparent: true }));
  face.rotation.x = -Math.PI / 2;
  root.add(face);
  let cur = text;
  function drawText() {
    g.clearRect(0, 0, 256, 152);
    if (!cur) return void (tex.needsUpdate = true);
    g.fillStyle = PALETTE.ink;
    g.font = `500 22px ${FONT_MY}`;
    g.textBaseline = 'middle';
    const words = (cur.my || cur).split(' ');
    let line = '', y = 34;
    for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (g.measureText(t).width > 226 && line) { g.fillText(line, 14, y); y += 36; line = wd; if (y > 130) break; } else line = t; }
    if (y <= 130) g.fillText(line, 14, y);
    tex.needsUpdate = true;
  }
  function setCount(k) {
    k = clamp(Math.round(k), 1, 12);
    if (mesh) { mesh.traverse((o) => o.geometry?.dispose()); mesh.removeFromParent(); }
    const v = new VoxelBuilder(), ink = new VoxelBuilder();
    const r = rand(9);
    for (let i = 0; i < k; i++) {
      const y = 0.0015 + i * 0.0018, ry = (r() - 0.5) * 0.3, dx = (r() - 0.5) * 0.01;
      v.box(dx, y, 0, W, 0.0012, D, jitter('#F7F1E2', 0.03, i), ry);
      // torn top edge: little teeth
      for (let x = -W / 2 + 0.006; x < W / 2; x += 0.012) v.box(dx + x * Math.cos(ry), y, -D / 2 - 0.002 + x * Math.sin(ry), 0.008, 0.0012, 0.005, '#F7F1E2', ry + (x * 31 % 1));
    }
    const top = 0.0015 + (k - 1) * 0.0018 + 0.001;
    if (!cur) {
      for (let i = 0; i < 3; i++) ink.box(-0.01, top, -0.018 + i * 0.015, 0.075 - i * 0.02, 0.0006, 0.0025, C.pencil); // pencil lines
    }
    // the ink tick (seen with her own eyes), gold-brown ink
    boxR(ink, 0.03, top, 0.02, 0.012, 0.0008, 0.004, C.goldD, 0, 0.8, 0);
    boxR(ink, 0.042, top, 0.014, 0.024, 0.0008, 0.004, C.goldD, 0, -0.7, 0);
    // the clip
    v.box(-W / 2 + 0.018, top + 0.002, -D / 2 + 0.01, 0.026, 0.004, 0.03, C.brass);
    v.box(-W / 2 + 0.018, top + 0.005, -D / 2 + 0.002, 0.02, 0.006, 0.006, C.brassD);
    mesh = v.mesh({ px: 0.9 });
    root.add(mesh);
    inkLayer(ink, mesh);
    face.position.set(0.004, top + 0.0005, 0.002);
  }
  setCount(n);
  drawText();
  fontsReady().then(drawText);
  return { root, setCount, setText(t) { cur = t; drawText(); }, dispose() { mesh?.traverse((o) => o.geometry?.dispose()); tex.dispose(); face.material.dispose(); face.geometry.dispose(); root.removeFromParent(); } };
}

/**
 * A tied stack of cream invitation envelopes (0.22 x 0.06 x 0.16 m, 8 by default), the top one
 * postmarked (Khwar Nyo's mark inside a carved border). single: one envelope, untied. setCount(n).
 */
export function invitationStack({ n = 8, single = false } = {}) {
  const root = new THREE.Group();
  root.name = single ? 'invitation' : 'invitationStack';
  let mesh = null;
  const W = 0.22, D = 0.16, T = 0.0072;
  function build(k) {
    if (mesh) { mesh.traverse((o) => o.geometry?.dispose()); mesh.removeFromParent(); }
    const v = new VoxelBuilder(), ink = new VoxelBuilder();
    const cnt = single ? 1 : clamp(Math.round(k), 1, 12);
    for (let i = 0; i < cnt; i++) {
      const y = T / 2 + i * T, ry = single ? 0 : ((i * 41) % 7 - 3) * 0.012, dx = ((i * 23) % 5 - 2) * 0.002;
      v.box(dx, y, 0, W, T * 0.9, D, jitter('#F3EAD4', 0.03, i), ry);
      v.box(dx, y, D / 2 - 0.0005, W - 0.004, T * 0.5, 0.002, '#DCCFAF', ry); // edge shade
    }
    const top = T * cnt;
    // the flap's V on the top envelope (seen from above)
    for (const sx of [-1, 1]) boxR(ink, sx * W / 4, top + 0.0006, -D / 2 + D * 0.26, W / 2 + 0.03, 0.0012, 0.003, '#D2C29C', 0, sx * 0.5, 0);
    // address scribbles, a stamp and the postmark
    for (let i = 0; i < 3; i++) for (let x = -0.055 + i * 0.006, e = 0.035 - i * 0.014; x < e;) { const w = 0.008 + ((x * 997) % 1 + 1) % 1 * 0.016; ink.box(x + w / 2, top + 0.0006, 0.02 + i * 0.016, w, 0.0008, 0.0026, '#5A4A40'); x += w + 0.004; }
    v.box(W / 2 - 0.03, top + 0.0008, D / 2 - 0.035, 0.03, 0.0012, 0.036, C.maroon);
    v.box(W / 2 - 0.03, top + 0.0012, D / 2 - 0.035, 0.022, 0.0012, 0.028, C.gold);
    const pmx = W / 2 - 0.065, pmz = D / 2 - 0.045;
    for (let a = 0; a < 12; a++) { const t = (a / 12) * Math.PI * 2; ink.box(pmx + Math.sin(t) * 0.022, top + 0.0014, pmz + Math.cos(t) * 0.022, 0.009, 0.0008, 0.003, C.maroonL, t); }
    for (let a = 0; a < 8; a++) { const t = (a / 8) * Math.PI * 2; ink.box(pmx + Math.sin(t) * 0.014, top + 0.0014, pmz + Math.cos(t) * 0.014, 0.003, 0.0008, 0.003, C.maroonL); }
    ink.box(pmx, top + 0.0014, pmz, 0.012, 0.0008, 0.003, C.maroonL, 0.785);
    ink.box(pmx, top + 0.0014, pmz, 0.012, 0.0008, 0.003, C.maroonL, -0.785);
    for (let k2 = 0; k2 < 3; k2++) ink.box(pmx - 0.04, top + 0.0014, pmz - 0.006 + k2 * 0.006, 0.04, 0.0008, 0.0015, C.maroonL); // cancel lines
    if (!single) {
      // twine: across both ways, down the sides, a bow on top
      const tw = '#B08F5C', H = top;
      v.box(0, H + 0.0015, 0, W + 0.004, 0.003, 0.006, tw);
      v.box(0.02, H + 0.0015, 0, 0.006, 0.003, D + 0.004, tw);
      for (const sx of [-1, 1]) v.box(sx * (W / 2 + 0.002), H / 2, 0, 0.004, H, 0.006, tw);
      for (const sz of [-1, 1]) v.box(0.02, H / 2, sz * (D / 2 + 0.002), 0.006, H, 0.004, tw);
      for (const sx of [-1, 1]) boxR(v, 0.02 + sx * 0.014, H + 0.004, 0.004, 0.026, 0.004, 0.012, tw, 0, sx * 0.4, 0);
      v.box(0.02, H + 0.004, 0, 0.008, 0.006, 0.008, shade(tw, 0.85));
      for (const sx of [-1, 1]) boxR(v, 0.02 + sx * 0.008, H + 0.002, 0.022, 0.004, 0.002, 0.03, tw, 0, sx * 0.3, 0);
    }
    mesh = v.mesh({ px: 1.0 });
    root.add(mesh);
    inkLayer(ink, mesh);
  }
  build(n);
  const sh = shadowUnder(root, 0.15, 0.11, 0, 0, 0.3);
  return { root, setCount: build, dispose() { mesh?.traverse((o) => o.geometry?.dispose()); sh.geometry.dispose(); root.removeFromParent(); } };
}

/** Toe Toe's exercise book, open: ruled blue lines, a red margin, his pencil writing, a pencil (0.3 x 0.21 m). */
export function essayPage({ seed = 11 } = {}) {
  const root = new THREE.Group();
  root.name = 'essayPage';
  const r = rand(seed);
  const v = new VoxelBuilder(), ink = new VoxelBuilder();
  const PW = 0.15, PD = 0.21;
  v.box(0, 0.002, 0, 2 * PW + 0.01, 0.004, PD + 0.008, '#3E5C8A'); // cover showing round the pages
  for (const sx of [-1, 1]) {
    const tilt = sx * -0.05;
    const cx = sx * (PW / 2 + 0.002);
    boxR(v, cx, 0.008 + 0.004, 0, PW, 0.008, PD, '#F8F4E8', 0, 0, tilt);
    const y = 0.017 + Math.abs(cx) * Math.sin(0.05) * 0.0;
    for (let i = 0; i < 11; i++) {
      const z = -PD / 2 + 0.02 + i * 0.017;
      ink.box(cx, y + 0.0004, z, PW - 0.01, 0.0006, 0.0018, '#9EB4D2');
      // handwriting on most lines of the left page, half the right
      const rows = sx < 0 ? 10 : 6;
      if (i < rows && i > 0) for (let x = cx - PW / 2 + 0.018; x < cx + PW / 2 - 0.01 - (i === rows - 1 ? 0.06 : 0);) {
        const w = 0.008 + r() * 0.02;
        ink.box(x + w / 2, y + 0.0008, z - 0.005, w, 0.0006, 0.0028, i === 1 && sx < 0 ? '#4A4038' : '#7C7670');
        x += w + 0.004;
      }
    }
    ink.box(cx - PW / 2 + 0.014, y + 0.0006, 0, 0.0015, 0.0006, PD - 0.01, '#D06A6A'); // margin
  }
  v.box(0, 0.016, 0, 0.004, 0.006, PD, '#D8D0BC'); // the gutter
  // the pencil: yellow hex body, eraser, ferrule, sharpened point
  const px = 0.06, pz = 0.04, ry = 0.5;
  const along = (d) => [px + Math.cos(ry) * d, pz - Math.sin(ry) * d];
  let [x, z] = along(0);
  v.box(x, 0.026, z, 0.13, 0.008, 0.008, '#E8B934', ry);
  [x, z] = along(-0.07); v.box(x, 0.026, z, 0.012, 0.0085, 0.0085, C.tin, ry);
  [x, z] = along(-0.081); v.box(x, 0.026, z, 0.012, 0.008, 0.008, '#E79A9A', ry);
  [x, z] = along(0.072); v.box(x, 0.026, z, 0.016, 0.006, 0.006, '#E2C29C', ry);
  [x, z] = along(0.083); v.box(x, 0.026, z, 0.008, 0.003, 0.003, C.ink, ry);
  root.add(v.mesh({ px: 1.0 }));
  inkLayer(ink, root);
  return { root, dispose() { disposeTree(root); } };
}

/** Twenty thin launch booklets tied with string (0.35 x 0.25 x 0.25 m), a cream tag; fits the car's back seat. */
export function bookletBundle() {
  const root = new THREE.Group();
  root.name = 'bookletBundle';
  const v = new VoxelBuilder();
  const W = 0.35, D = 0.25, T = 0.0125;
  for (let i = 0; i < 20; i++) {
    const y = T / 2 + i * T, dx = ((i * 37) % 7 - 3) * 0.002, dz = ((i * 17) % 5 - 2) * 0.002;
    v.box(dx, y, dz, W - 0.004, T * 0.7, D - 0.004, '#F0E8D6');
    v.box(dx, y + T * 0.38, dz, W, T * 0.2, D, i % 5 === 4 ? C.maroonL : C.maroon);
    v.box(dx - W / 2 + 0.001, y, dz, 0.004, T, D, C.maroonD);
    v.box(dx - W / 2 + 0.002, y + T * 0.1, dz, 0.003, T * 0.3, D * 0.9, C.gold); // gold stripe on the spine
  }
  const H = 20 * T;
  // the top cover's gold title stripe and sparkle
  v.box(0, H + 0.001, -0.04, 0.2, 0.002, 0.018, C.gold);
  v.box(0, H + 0.001, 0.02, 0.12, 0.002, 0.008, C.goldL);
  // string: both ways, round the sides, knot and tag
  const tw = '#B08F5C';
  v.box(0, H + 0.004, 0, W + 0.006, 0.004, 0.008, tw);
  v.box(0.03, H + 0.004, 0, 0.008, 0.004, D + 0.006, tw);
  for (const sx of [-1, 1]) v.box(sx * (W / 2 + 0.003), H / 2, 0, 0.004, H, 0.008, tw);
  for (const sz of [-1, 1]) v.box(0.03, H / 2, sz * (D / 2 + 0.003), 0.008, H, 0.004, tw);
  v.box(0.03, H + 0.008, 0, 0.016, 0.01, 0.016, shade(tw, 0.85));
  for (const sx of [-1, 1]) boxR(v, 0.03 + sx * 0.02, H + 0.008, 0.006, 0.036, 0.006, 0.014, tw, 0, sx * 0.5, 0);
  boxR(v, 0.075, H + 0.004, 0.06, 0.004, 0.003, 0.07, tw, 0, -0.5, 0);
  boxR(v, 0.1, H + 0.006, 0.1, 0.06, 0.003, 0.035, C.cream, 0, -0.5, 0);
  boxR(v, 0.1, H + 0.008, 0.1, 0.035, 0.001, 0.004, C.ink, 0, -0.5, 0);
  root.add(v.mesh({ px: 1.2 }));
  const sh = shadowUnder(root, 0.24, 0.18, 0, 0, 0.4);
  return { root, dispose() { sh.geometry.dispose(); disposeTree(root); } };
}

/** A brass key (0.12 m) lying flat, with a paper tag on a string; setTag(text) writes the tag. */
export function brassKey(tag = '') {
  const root = new THREE.Group();
  root.name = 'brassKey';
  const v = new VoxelBuilder();
  const Y = 0.004;
  // bow: a ring of eight blocks
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; v.box(-0.035 + Math.cos(a) * 0.016, Y, Math.sin(a) * 0.016, 0.012, 0.007, 0.008, k % 2 ? C.brass : C.brassL, -a + Math.PI / 2); }
  v.box(-0.016, Y, 0, 0.01, 0.009, 0.014, C.brassD); // collar
  v.box(0.02, Y, 0, 0.065, 0.006, 0.007, C.brass);    // shaft
  v.box(-0.008, Y, 0, 0.006, 0.01, 0.012, C.brassL);
  // the bit with its teeth
  v.box(0.043, Y, 0.012, 0.02, 0.006, 0.018, C.brass);
  for (const [x, d] of [[0.036, 0.008], [0.044, 0.014], [0.05, 0.006]]) v.box(x, Y, 0.021 + d / 2, 0.005, 0.006, d, C.brassD);
  v.box(0.055, Y, 0, 0.004, 0.006, 0.008, C.brassD);
  // string through the bow to the tag
  boxR(v, -0.062, 0.002, 0.012, 0.03, 0.002, 0.002, '#B08F5C', 0, -0.5, 0);
  v.box(-0.09, 0.0015, 0.03, 0.05, 0.002, 0.03, '#F3EAD4', -0.35);
  v.box(-0.071, 0.003, 0.022, 0.006, 0.002, 0.006, C.brassD); // the eyelet
  root.add(v.mesh({ px: 0.9 }));
  const { g, tex } = canvasTex(160, 96);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.044, 0.026), basic('#ffffff', { map: tex, transparent: true }));
  face.rotation.set(-Math.PI / 2, 0, -0.35);
  face.position.set(-0.092, 0.0028, 0.031);
  root.add(face);
  let cur = tag;
  const draw = () => {
    g.clearRect(0, 0, 160, 96);
    g.fillStyle = PALETTE.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `600 ${cur.length > 6 ? 26 : 38}px ${FONT_MY}`;
    g.fillText(cur, 80, 52, 150);
    tex.needsUpdate = true;
  };
  draw();
  fontsReady().then(draw);
  return { root, setTag(t) { cur = t || ''; draw(); }, dispose() { tex.dispose(); face.material.dispose(); face.geometry.dispose(); disposeTree(root); } };
}

/** A smooth turned (lathe) band between two heights of a profile r(y): flat-faceted round, 14 sides. */
function turned(v, prof, y0, y1, col, { seg = 14, steps = 3, dr = 0 } = {}) {
  const pts = [];
  for (let k = 0; k <= steps; k++) { const y = y0 + ((y1 - y0) * k) / steps; pts.push(new THREE.Vector2(prof(y) + dr, y)); }
  v.add(new THREE.LatheGeometry(pts, seg, Math.PI / seg), col);
}

/**
 * The storage pot: Daw Ohn's thick-walled round clay jar (0.47 m: a full belly, a short neck, a thick dark
 * rim) with Mi Cho's small pot turned over on it as a lid (a low dome tied with a cord loop). setLid(0..1)
 * lifts and tips the lid off; rolled papers show inside.
 */
export function storagePot() {
  const root = new THREE.Group();
  root.name = 'storagePot';
  const v = new VoxelBuilder();
  // the jar's outer profile: radius by height (a smooth belly, no steps)
  const prof = (y) => {
    if (y < 0.03) return 0.13 + y * 1.67;                                         // the foot
    if (y < 0.36) { const t = (y - 0.2) / 0.17; return 0.27 - 0.1 * t * t * (t < 0 ? 0.9 : 1.15); } // belly
    if (y < 0.41) { const t = (y - 0.36) / 0.05; return 0.168 - 0.008 * Math.sin(t * Math.PI / 2); } // shoulder into neck
    return 0.16 + (y - 0.41) * 0.6;                                                // the neck flares a little
  };
  const bands = [[0, 0.03, C.terraD], [0.03, 0.12, '#A65A38'], [0.12, 0.19, C.terra], [0.19, 0.205, '#8E4A2C'], [0.205, 0.255, C.terraL],
    [0.255, 0.268, '#E6D3B0'], [0.268, 0.36, C.terra], [0.36, 0.41, '#A65A38'], [0.41, 0.435, C.terraD]];
  for (const [y0, y1, col] of bands) turned(v, prof, y0, y1, col, { steps: y1 - y0 > 0.05 ? 4 : 1, dr: col === '#8E4A2C' ? 0.003 : 0 });
  prism(v, 0, 0.004, 0, 0.13, 0.13, 0.008, '#6E3A26', 14);                          // the base
  // the thick rolled rim (a dark band, round on top) and the dark mouth
  const rim = (y) => 0.186 + 0.016 * Math.sin(((y - 0.432) / 0.034) * Math.PI);
  turned(v, rim, 0.432, 0.466, '#5A2E1E', { steps: 4 });
  const rimY = 0.466;
  prism(v, 0, rimY - 0.006, 0, 0.17, 0.17, 0.012, '#5A2E1E', 14);
  prism(v, 0, rimY - 0.004, 0, 0.152, 0.152, 0.012, C.soot, 14);
  // finger-pressed dots round the shoulder, a second dotted row under the slip band
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2, rr = prof(0.31) - 0.004;
    v.box(Math.sin(a) * rr, 0.31, Math.cos(a) * rr, 0.017, 0.017, 0.01, '#8A4A2E', a);
    const r2 = prof(0.235) - 0.003, a2 = a + Math.PI / 18;
    v.box(Math.sin(a2) * r2, 0.235, Math.cos(a2) * r2, 0.014, 0.014, 0.01, '#B7714A', a2);
  }
  // papers rolled inside (seen when the lid lifts)
  for (const [x, z, h] of [[-0.05, 0.02, 0.09], [0.04, -0.03, 0.11], [0.0, 0.06, 0.07]]) prism(v, x, rimY + h / 2 - 0.05, z, 0.025, 0.025, h, '#F3EAD4', 6);
  v.box(0.06, rimY + 0.005, 0.03, 0.04, 0.003, 0.05, C.cream, 0.4);
  const body = v.mesh();
  root.add(body);
  // Mi Cho's small pot, turned over: a low pale dome with a lip, a finger-drawn wave, a cord loop through two lugs
  const lid = new THREE.Group();
  root.add(lid);
  const lv = new VoxelBuilder();
  const dome = (y) => 0.205 * Math.sqrt(Math.max(0, 1 - (y / 0.072) ** 2));
  turned(lv, (y) => 0.208, 0, 0.014, '#A9654A', { steps: 1 });                    // the lip
  turned(lv, (y) => dome(y + 0.012) + 0.0, 0.014, 0.034, '#C98C62', { steps: 2 });
  turned(lv, (y) => dome(y + 0.012), 0.034, 0.056, C.terraL, { steps: 2 });
  turned(lv, (y) => Math.max(0.05, dome(y + 0.012)), 0.056, 0.064, '#C98C62', { steps: 1 });
  prism(lv, 0, 0.066, 0, 0.07, 0.07, 0.006, '#B57050', 14);                       // the old foot ring, worn flat
  turned(lv, (y) => dome(y + 0.012) + 0.002, 0.031, 0.036, '#9E5A3C', { steps: 1 });  // one finger-drawn line round it
  // the cord: two lugs and a loop arching over the top, its knot and a short tail
  const cord = '#D9C49A';
  for (const sx of [-1, 1]) lv.box(sx * 0.055, 0.074, 0, 0.026, 0.02, 0.026, '#9E5A3C');
  for (let k = 0; k < 8; k++) {
    const a0 = (Math.PI * k) / 8, a1 = (Math.PI * (k + 1)) / 8;
    seg(lv, -Math.cos(a0) * 0.055, 0.08 + Math.sin(a0) * 0.05, 0, -Math.cos(a1) * 0.055, 0.08 + Math.sin(a1) * 0.05, 0, 0.013, cord);
  }
  lv.box(0.068, 0.078, 0.012, 0.02, 0.016, 0.016, cord);
  boxR(lv, 0.08, 0.072, 0.03, 0.008, 0.008, 0.04, cord, 0.6, 0.3, 0);
  const lm = lv.mesh();
  lid.add(lm);
  const LY = rimY - 0.004;
  lid.position.set(0, LY, 0);
  const sh = shadowUnder(root, 0.36, 0.36, 0, 0, 0.5);
  return {
    root,
    setLid(t) { t = smooth(t); lid.position.set(t * 0.24, LY + Math.sin(t * Math.PI) * 0.12 - t * 0.03, 0); lid.rotation.z = -t * 0.9; },
    dispose() { sh.geometry.dispose(); disposeTree(root); },
  };
}

// =============================================================================================
// WEATHER
// =============================================================================================

const RING_FRAG = `
  varying vec2 vUv; varying float vA; uniform vec3 uColor;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float r = vA;            // ring radius 0..1 grows with age
    float ring = smoothstep(r - 0.22, r - 0.05, d) * (1.0 - smoothstep(r - 0.02, r + 0.06, d));
    float a = ring * (1.0 - r) * 0.9;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a);
  }`;

/**
 * Rain round a point (the camera's target): one instanced streak mesh animated on the GPU, plus splash
 * rings on the ground. World-anchored (streaks don't slide as the centre moves). follow(vec3) each frame,
 * setAmount(0..1) thins it to nothing. For the grade, story.weather tints the CSS grade grey-blue
 * (suggest #7F93A8 at 25%).
 */
export function rainFx({ radius = 10, height = 9, count = 1100, splashes = 160, ground = 0 } = {}) {
  const root = new THREE.Group();
  root.name = 'rainFx';
  const r = rand(21);
  const uni = { uTime: { value: 0 }, uAmount: { value: 1 }, uCenter: { value: new THREE.Vector3() }, uR: { value: radius }, uH: { value: height }, uG: { value: ground } };
  // streaks
  const sGeo = new THREE.BoxGeometry(0.014, 0.42, 0.014);
  const seeds = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) seeds[i] = r();
  const sMat = new THREE.ShaderMaterial({
    uniforms: { ...uni, uColor: { value: new THREE.Color('#D6E2EC') } },
    transparent: true, depthWrite: false,
    vertexShader: `
      attribute vec3 aSeed; uniform float uTime, uAmount, uR, uH, uG; uniform vec3 uCenter; varying float vA;
      void main() {
        float on = step(fract(aSeed.x * 13.7 + aSeed.y * 3.1), uAmount);
        float sp = 9.0 + 4.0 * fract(aSeed.z * 7.3);
        float y = mod(aSeed.z * uH - uTime * sp, uH);
        float S = 2.0 * uR;
        float wx = uCenter.x - uR + mod(aSeed.x * S - (uCenter.x - uR), S);
        float wz = uCenter.z - uR + mod(aSeed.y * S - (uCenter.z - uR), S);
        vec3 p = position;
        p.x += p.y * 0.16;            // a little wind slant
        vec3 wp = vec3(wx, uG + y, wz) + p * on;
        vA = on * smoothstep(0.0, 0.6, y) * (1.0 - smoothstep(uH - 1.5, uH, y)) * smoothstep(2.5, 5.0, distance(wp, cameraPosition));
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: `varying float vA; uniform vec3 uColor; void main() { if (vA < 0.01) discard; gl_FragColor = vec4(uColor, 0.42 * vA); }`,
  });
  const streaks = new THREE.InstancedMesh(sGeo, sMat, count);
  sGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 3));
  streaks.frustumCulled = false;
  streaks.raycast = () => {};
  root.add(streaks);
  // splash rings on the ground: each lands at a new random spot every cycle
  const pGeo = new THREE.PlaneGeometry(0.34, 0.34);
  pGeo.rotateX(-Math.PI / 2);
  const pSeeds = new Float32Array(splashes * 3);
  for (let i = 0; i < splashes * 3; i++) pSeeds[i] = r();
  pGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(pSeeds, 3));
  const pMat = new THREE.ShaderMaterial({
    uniforms: { ...uni, uColor: { value: new THREE.Color('#E8F0F6') } },
    transparent: true, depthWrite: false,
    vertexShader: `
      attribute vec3 aSeed; uniform float uTime, uAmount, uR, uG; uniform vec3 uCenter; varying vec2 vUv; varying float vA;
      float h(float n) { return fract(sin(n) * 43758.5453); }
      void main() {
        float per = 0.55 + 0.3 * aSeed.z;
        float tt = uTime / per + aSeed.x * 7.0;
        float cyc = floor(tt);
        float age = fract(tt);
        float on = step(fract(aSeed.y * 11.3), uAmount);
        vec2 off = (vec2(h(cyc * 12.99 + aSeed.y * 78.2), h(cyc * 39.35 + aSeed.z * 11.7)) - 0.5) * 2.0 * uR * 0.75;
        vec3 wp = vec3(uCenter.x + off.x, uG + 0.012, uCenter.z + off.y) + position * on;
        vUv = uv; vA = age;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: RING_FRAG,
  });
  const splash = new THREE.InstancedMesh(pGeo, pMat, splashes);
  splash.frustumCulled = false;
  splash.raycast = () => {};
  root.add(splash);
  const ident = new THREE.Matrix4();
  for (let i = 0; i < count; i++) streaks.setMatrixAt(i, ident);
  for (let i = 0; i < splashes; i++) splash.setMatrixAt(i, ident);
  let amount = 1;
  return {
    root,
    tint: '#7F93A8',
    setAmount(t) { amount = clamp(t, 0, 1); uni.uAmount.value = amount; root.visible = amount > 0.005; },
    follow(p) { uni.uCenter.value.copy(p); },
    update(dt, t) { uni.uTime.value = t; },
    dispose() { sGeo.dispose(); sMat.dispose(); pGeo.dispose(); pMat.dispose(); root.removeFromParent(); },
  };
}

/**
 * Puddles on roads and lanes: irregular flat decals (one merged mesh, 4 shapes from one small texture,
 * a wet dark edge, the sky in the middle, a soft highlight), plus rain rings inside them (setRain).
 * spots: [{ x, z, r }] (else n random ones inside area [x0, z0, x1, z1]). setWet(0..1) dries them away.
 */
export function puddles({ spots = null, n = 8, area = [-5, -4, 5, 4], seed = 5, sky = '#9EB0C0' } = {}) {
  const root = new THREE.Group();
  root.name = 'puddles';
  const r = rand(seed);
  if (!spots) {
    spots = [];
    for (let i = 0; i < n; i++) spots.push({ x: area[0] + r() * (area[2] - area[0]), z: area[1] + r() * (area[3] - area[1]), r: 0.35 + r() * 0.55 });
  }
  // texture: 2 x 2 cells of blob shapes
  const S = 256, { g, tex } = canvasTex(S, S);
  for (let c = 0; c < 4; c++) {
    const ox = (c % 2) * 128, oy = Math.floor(c / 2) * 128, cx = ox + 64, cy = oy + 64;
    const pts = [];
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; const rr = 44 + (r() - 0.5) * 30 + Math.sin(a * 3 + c) * 8; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * (0.62 + c * 0.06)]); }
    const path = () => { g.beginPath(); pts.forEach(([x, y], i) => { const [nx, ny] = pts[(i + 1) % pts.length]; if (!i) g.moveTo((x + nx) / 2, (y + ny) / 2); else g.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2); }); g.quadraticCurveTo(pts[0][0], pts[0][1], (pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2); g.closePath(); };
    const inset = (k) => { g.translate(cx, cy); g.scale(k, k * 0.98); g.translate(-cx, -cy); };
    // a soft damp margin (no hard outline): the ground darkened a little round the water
    g.save(); g.filter = 'blur(3px)'; path(); g.fillStyle = 'rgba(70,58,46,0.2)'; g.fill(); g.restore();
    // the sky in it: lighter toward the far edge, a little darker near, a couple of pale cloud smears
    g.save(); inset(0.92); path(); g.clip();
    const sk = g.createLinearGradient(cx, oy + 14, cx, oy + 114);
    sk.addColorStop(0, shade(sky, 1.28)); sk.addColorStop(0.55, sky); sk.addColorStop(1, shade(sky, 0.82));
    g.globalAlpha = 0.78; g.fillStyle = sk; g.fillRect(ox, oy, 128, 128);
    g.globalAlpha = 0.35; g.fillStyle = '#F4F6F8';
    for (let k = 0; k < 2; k++) { g.beginPath(); g.ellipse(cx - 18 + k * 30 + (r() - 0.5) * 10, cy - 18 + k * 16, 20 + r() * 8, 5 + r() * 3, -0.15, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1;
    // a soft glint
    const grd = g.createLinearGradient(cx - 40, cy - 30, cx + 40, cy + 30);
    grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(0.46, 'rgba(255,255,255,0.3)'); grd.addColorStop(0.54, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(ox, oy, 128, 128);
    g.restore();
    // a thin light edge where the water meets the ground
    g.save(); g.lineWidth = 1.6; g.strokeStyle = 'rgba(236,242,246,0.55)'; inset(0.92); path(); g.restore(); g.stroke();
  }
  tex.needsUpdate = true;
  const parts = spots.map((s, i) => {
    const p = new THREE.PlaneGeometry(s.r * 2, s.r * 2);
    const c = i % 4, u0 = (c % 2) * 0.5, v0 = 0.5 - Math.floor(c / 2) * 0.5;
    const uv = p.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) * 0.5, v0 + uv.getY(k) * 0.5);
    p.rotateX(-Math.PI / 2);
    p.rotateY(r() * Math.PI);
    p.translate(s.x, 0.008, s.z);
    return p;
  });
  const geo = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = -1;
  mesh.raycast = () => {};
  root.add(mesh);
  // rain rings inside the puddles
  const RN = Math.min(96, spots.length * 6);
  const rGeo = new THREE.PlaneGeometry(1, 1);
  rGeo.rotateX(-Math.PI / 2);
  const aP = new Float32Array(RN * 4);
  for (let i = 0; i < RN; i++) { const s = spots[i % spots.length]; aP.set([s.x, s.z, s.r * 0.55, r()], i * 4); }
  rGeo.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4));
  const uni = { uTime: { value: 0 }, uAmount: { value: 0 }, uColor: { value: new THREE.Color('#F2F6FA') } };
  const rMat = new THREE.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false,
    vertexShader: `
      attribute vec4 aP; uniform float uTime, uAmount; varying vec2 vUv; varying float vA;
      float h(float n) { return fract(sin(n) * 43758.5453); }
      void main() {
        float per = 0.7 + 0.5 * aP.w;
        float tt = uTime / per + aP.w * 9.0;
        float cyc = floor(tt);
        float on = step(fract(aP.w * 17.3), uAmount);
        vec2 off = (vec2(h(cyc * 12.99 + aP.w * 78.2), h(cyc * 39.35 + aP.w * 11.7)) - 0.5) * 2.0 * aP.z;
        float sz = 0.18 + 0.14 * aP.w;
        vec3 wp = (modelMatrix * vec4(aP.x + off.x, 0.014, aP.y + off.y, 1.0)).xyz + position * sz * on;
        vUv = uv; vA = fract(tt);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: RING_FRAG,
  });
  const rings = new THREE.InstancedMesh(rGeo, rMat, RN);
  const ident = new THREE.Matrix4();
  for (let i = 0; i < RN; i++) rings.setMatrixAt(i, ident);
  rings.frustumCulled = false;
  rings.raycast = () => {};
  root.add(rings);
  return {
    root, spots,
    setWet(t) { mat.opacity = clamp(t, 0, 1); mesh.visible = t > 0.01; rings.visible = t > 0.01; },
    setRain(t) { uni.uAmount.value = clamp(t, 0, 1); },
    update(dt, t) { uni.uTime.value = t; },
    dispose() { geo.dispose(); mat.dispose(); tex.dispose(); rGeo.dispose(); rMat.dispose(); root.removeFromParent(); },
  };
}
