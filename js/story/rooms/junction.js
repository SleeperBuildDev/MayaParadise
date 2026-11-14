// Newsprint Junction story rooms (Day 8; the press again on Day 14). INDEX 13.1 / 13.2 / 13.5,
// day8-spec 15.1-15.4, day14-spec 12.5. Built with js/game/interiors/kit.js like the site's rooms:
// a front-open dollhouse room, every static box merged by room.bake() into ONE toon mesh + outline.
//
//   import { ROOMS } from './rooms/junction.js';
//   const r = await ROOMS.press.build({ dressing: 'd14' });
//   r.scene, r.group, r.stations (story taps, NO markers), r.obstacles, r.door, r.spawn, r.bounds,
//   r.spots { name: { x, z, h, look?, seat? } }  (h = heading, Math.atan2(dx, dz); 0 faces the camera;
//                                   look = { x, z } for person.lookAt (head turn); seat = sit height)
//   r.cast  [{ id, spot }]          who stands where by default (Day 8, or Day 14 for 'd14')
//   r.cam   { tilt, width, look: { x, y, z }, slide }   framing hint: a portrait phone shows `width` m
//   r.camFor(aspect, fov = 45) -> { tilt, dist, target }  fits a camera to any screen (portrait: width,
//                                   landscape: the whole room). Rooms fill ~65% of a 412 x 915 frame.
//   r.update(dt, t), r.setEvening(0..1), r.setRain(bool), r.dispose()
//   + room handles: letterroom.setJars(n) / setBasket(n carried, 0..11), junctiontea.setHoard(n) /
//     setCorrection(bool), schoolroom.setPots(full) / setAfter(bool), press.setJumbled(bool) / pull(0..1)
//   dispose() frees the room's geometries, atlas texture + materials and life meshes; people placed in
//   the room belong to the caller (person.dispose()).
//
// Rooms: letterroom (Ma Thida, 5 x 6), junctiontea (Daw Sein, 7 x 8), schoolroom (7 x 8),
// press (Gold Ink Press, 8 x 8). Draw calls per room (no people): baked statics 2, sign atlas 1,
// life (glows, lamp pools, window night/rain, sun shaft, motes, steam) 5-7, instanced props 2-4.
// No markers, arrows or glow pins anywhere: people and props are the tap targets.
// Every Burmese string here is a draft for Maya.
import * as kit from '../../game/interiors/kit.js';
import { FONT_MY, FONT_SERIF, FONT_SANS, fontsReady, roundRect } from '../../game/toon.js';

const { THREE, PALETTE: P, VoxelBuilder, jitter, toon, addOutline } = kit;

// ---------------------------------------------------------------------------------------------
// colours (Maya's palette + the Junction's newsprint greys and ink)
// ---------------------------------------------------------------------------------------------
const C = {
  wood: P.wood, woodD: P.woodDark, woodL: '#CDA577', woodXL: '#DDBB8C', gold: P.gold, goldD: P.goldDeep, bronze: P.bronze,
  maroon: P.maroon, maroonD: P.maroonDeep, cream: P.cream, paper: P.paper, parch: P.parchment, white: P.white, ink: P.ink,
  leaf: P.leaf, leafD: P.leafDark, rose: P.rose,
  news: '#E6E0D2', newsD: '#C9C2B2', newsL: '#F1ECE1', print: '#9C9586',
  terra: '#B5643C', terraL: '#CB7E4E', terraD: '#8E4A2C', iron: '#4A4440', ironD: '#2F2B29', ironL: '#6E6862', steel: '#9AA3A6',
  blue: '#5F8DB0', blueL: '#8FB3C9', blueD: '#3F6684', sky: '#9CC3DE', glass: '#CFE0E6', teal: '#3F7C78',
  mustard: '#D9A93B', mustardD: '#B88A2C', green: '#5E8F6A', greenD: '#3F6B4E', chalk: '#34443A', chalkD: '#26332B',
  coal: '#2B1E19', ember: '#E8743A', soot: '#231A15', red: '#B8423C', redD: '#8E2F2B', cloth: '#E9DFC9', plum: '#6B3E64',
};
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------------
// pen: boxes and prisms into one VoxelBuilder, in a local frame (x, z, turn about Y)
// ---------------------------------------------------------------------------------------------
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3();
function M(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}
const prismCache = new Map();
function prismGeo(rt, rb, h, seg) {
  const key = `${rt}|${rb}|${h}|${seg}`;
  let g = prismCache.get(key);
  if (!g) {
    g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, false, Math.PI / seg).toNonIndexed();
    g.deleteAttribute('uv');
    g.deleteAttribute('normal');
    g.computeVertexNormals();
    prismCache.set(key, g);
  }
  return g;
}
class Pen {
  constructor(v, base = new THREE.Matrix4()) { this.v = v; this.base = base; }
  /** box by centre + size, optional turn (radians) about its own centre */
  box(x, y, z, w, h, d, c, rx = 0, ry = 0, rz = 0) {
    this.v.add(UNIT, c, this.base.clone().multiply(M(x, y, z, rx, ry, rz, w, h, d)));
    return this;
  }
  /** box from min corner to max corner */
  bm(x0, y0, z0, x1, y1, z1, c) {
    return this.box((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), c);
  }
  /** n-sided prism (flat facets, blocky round things), centre + radii + height */
  pr(x, y, z, rt, rb, h, c, seg = 8, rx = 0, rz = 0) {
    this.v.add(prismGeo(rt, rb, h, seg), c, this.base.clone().multiply(M(x, y, z, rx, 0, rz)));
    return this;
  }
  /** a child frame at (x, y, z) turned ry about Y */
  at(x, z, ry = 0, y = 0) { return new Pen(this.v, this.base.clone().multiply(M(x, y, z, 0, ry, 0))); }
}

// ---------------------------------------------------------------------------------------------
// one canvas atlas per room: signs, paper, chalk, window views. Quads merge into ONE unlit mesh.
// ---------------------------------------------------------------------------------------------
function makeAtlas(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const quads = [];
  let cx = 0, cy = 0, rowH = 0;
  const A = {
    g, size,
    /** shelf-packs a w x h pixel region */
    alloc(w, h) {
      if (cx + w > size) { cx = 0; cy += rowH + 2; rowH = 0; }
      const r = { x: cx, y: cy, w, h, u0: cx / size, u1: (cx + w) / size, v0: 1 - (cy + h) / size, v1: 1 - cy / size };
      cx += w + 2;
      rowH = Math.max(rowH, h);
      if (cy + h > size) console.warn('junction atlas full');
      return r;
    },
    /** draws fn(g, w, h) into a new region (origin top-left, clipped) and returns it */
    draw(w, h, fn) {
      const r = A.alloc(w, h);
      g.save();
      g.translate(r.x, r.y);
      g.beginPath();
      g.rect(0, 0, r.w, r.h);
      g.clip();
      fn(g, r.w, r.h);
      g.restore();
      return r;
    },
    /** flat w x h plane facing +Z showing region r, placed by matrix m; list = which mesh gets it */
    quad(r, w, h, m, list = quads) {
      const geo = new THREE.PlaneGeometry(w, h);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, r.u0 + uv.getX(i) * (r.u1 - r.u0), r.v0 + uv.getY(i) * (r.v1 - r.v0));
      geo.applyMatrix4(m);
      list.push(geo);
      return geo;
    },
    texture: null,
    mesh(list = quads, name = 'signs') {
      if (!A.texture) {
        A.texture = new THREE.CanvasTexture(canvas);
        A.texture.colorSpace = THREE.SRGBColorSpace;
        A.texture.anisotropy = 4;
      }
      const merged = mergeGeos(list);
      const mesh = new THREE.Mesh(merged, new THREE.MeshBasicMaterial({ map: A.texture, alphaTest: 0.5, toneMapped: false, side: THREE.DoubleSide }));
      mesh.name = name;
      mesh.userData.dynamic = true;
      return mesh;
    },
  };
  return A;
}
function mergeGeos(list) {
  // small local merge (position + uv), avoids depending on extra imports
  let n = 0;
  for (const g of list) n += (g.index ? g.index.count : g.attributes.position.count);
  const pos = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  let o = 0;
  for (const g0 of list) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    pos.set(g.attributes.position.array, o * 3);
    uv.set(g.attributes.uv.array, o * 2);
    o += g.attributes.position.count;
    if (g !== g0) g.dispose();
    g0.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.computeBoundingSphere();
  return out;
}

// ---- canvas drawing helpers ----
function font(g, size, weight = 700, family = FONT_MY) { g.font = `${weight} ${size}px ${family}`; }
function text(g, s, x, y, { size = 40, weight = 700, family = FONT_MY, color = C.ink, align = 'center', max = 0 } = {}) {
  font(g, size, weight, family);
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'middle';
  if (max) g.fillText(s, x, y, max); else g.fillText(s, x, y);
}
/** paper sheet: off-white with a faint edge and grain */
function paperBg(g, w, h, { bg = C.newsL, edge = C.newsD, seed = 1 } = {}) {
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(120,100,70,0.06)';
  for (let i = 0; i < 40; i++) {
    const r = Math.sin(seed * 91.7 + i * 12.3) * 43758.5;
    const f = r - Math.floor(r);
    g.fillRect(f * w, ((i * 37) % 100) / 100 * h, 2 + f * 6, 1);
  }
  g.strokeStyle = edge;
  g.lineWidth = Math.max(2, w / 90);
  g.strokeRect(1, 1, w - 2, h - 2);
}
/** fake print: grey column lines */
function printLines(g, x, y, w, h, { cols = 2, gap = 9, color = '#8F8778', lw = 3, seed = 3 } = {}) {
  const cw = (w - (cols - 1) * 14) / cols;
  g.fillStyle = color;
  for (let c = 0; c < cols; c++) {
    for (let k = 0, yy = y; yy < y + h - lw; k++, yy += gap) {
      const r = Math.sin(seed * 31.1 + c * 17.7 + k * 3.3) * 1000;
      const f = r - Math.floor(r);
      const len = k % 7 === 6 ? cw * (0.3 + f * 0.3) : cw * (0.82 + f * 0.18);
      g.fillRect(x + c * (cw + 14), yy, len, lw);
    }
  }
}
/** a hand-written line of squiggle (not real text) */
function scrawl(g, x, y, w, { color = '#3A4A6A', lw = 3, seed = 1, amp = 5 } = {}) {
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x, y);
  for (let i = 1; i <= 24; i++) {
    const r = Math.sin(seed * 7.1 + i * 2.31);
    g.lineTo(x + (w * i) / 24, y + r * amp * (i % 3 === 0 ? 1.4 : 0.7));
  }
  g.stroke();
}
function disc(g, x, y, r, color) {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fillStyle = color;
  g.fill();
}
/** window view: sky gradient, paper-town roofs, an optional extra painter */
function windowView(g, w, h, { seed = 1, extra = null, sky = ['#BFD9EC', '#F6E3C6'] } = {}) {
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, sky[0]);
  grd.addColorStop(1, sky[1]);
  g.fillStyle = grd;
  g.fillRect(0, 0, w, h);
  // blocky clouds
  g.fillStyle = '#FFF8EE';
  const cl = (x, y, s) => { g.fillRect(x, y, s * 2.2, s * 0.6); g.fillRect(x + s * 0.4, y - s * 0.4, s * 1.2, s * 0.6); };
  cl(w * 0.1, h * 0.22, w * 0.11);
  cl(w * 0.62, h * 0.14, w * 0.08);
  // newsprint rooftops
  let x = -10;
  let k = seed;
  while (x < w) {
    const bw = w * (0.18 + ((k * 37) % 7) * 0.025);
    const bh = h * (0.22 + ((k * 13) % 5) * 0.05);
    g.fillStyle = ['#E6E0D2', '#D9D2C2', '#EFE9DC', '#D4CCBA'][k % 4];
    g.fillRect(x, h - bh, bw, bh);
    g.fillStyle = ['#8E3B32', '#6E1F2A', '#A0503A', '#7A5434'][k % 4];
    g.fillRect(x - 3, h - bh - 8, bw + 6, 9);
    g.fillStyle = 'rgba(90,80,70,0.35)';
    for (let yy = h - bh + 10; yy < h - 6; yy += 7) g.fillRect(x + 5, yy, bw * 0.4, 2);
    g.fillStyle = '#F6D58A';
    g.fillRect(x + bw * 0.62, h - bh * 0.6, bw * 0.16, bh * 0.22);
    x += bw + 4;
    k++;
  }
  extra?.(g, w, h);
}
/** Burmese digits */
const MY_DIGITS = '၀၁၂၃၄၅၆၇၈၉';
const myNum = (n) => String(n).split('').map((d) => MY_DIGITS[+d] ?? d).join('');
/** a wall calendar page (red header, grid) */
function drawCalendar(g, w, h, { month = 'တန်ဆောင်မုန်း', seed = 2 } = {}) {
  g.fillStyle = C.paper;
  g.fillRect(0, 0, w, h);
  g.fillStyle = C.red;
  g.fillRect(0, 0, w, h * 0.3);
  text(g, month, w / 2, h * 0.15, { size: h * 0.13, color: C.white });
  g.fillStyle = '#6A5E50';
  const gx = w * 0.08, gy = h * 0.36, cw = (w * 0.84) / 7, ch = (h * 0.58) / 5;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) {
    const d = r * 7 + c - 2;
    if (d < 1 || d > 30) continue;
    text(g, myNum(d), gx + c * cw + cw / 2, gy + r * ch + ch / 2, { size: ch * 0.5, weight: 400, color: c === 0 ? C.red : '#4A4038' });
  }
  g.strokeStyle = C.red;
  g.lineWidth = 3;
  const cc = (seed * 3) % 7, rr = 1 + (seed % 3);
  g.beginPath();
  g.arc(gx + cc * cw + cw / 2, gy + rr * ch + ch / 2, ch * 0.42, 0, TAU);
  g.stroke();
}
function drawClock(g, w, h, hour = 10, min = 10) {
  disc(g, w / 2, h / 2, w * 0.48, C.woodD);
  disc(g, w / 2, h / 2, w * 0.42, C.paper);
  g.fillStyle = C.ink;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    g.fillRect(w / 2 + Math.sin(a) * w * 0.35 - 2, h / 2 - Math.cos(a) * h * 0.35 - 2, 4, 4);
  }
  g.strokeStyle = C.ink;
  g.lineCap = 'round';
  const hand = (a, len, lw) => { g.lineWidth = lw; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.sin(a) * len, h / 2 - Math.cos(a) * len); g.stroke(); };
  hand(((hour % 12) + min / 60) / 12 * TAU, w * 0.2, 5);
  hand((min / 60) * TAU, w * 0.31, 3);
  disc(g, w / 2, h / 2, 4, C.maroon);
}

// ---------------------------------------------------------------------------------------------
// life: lamp glows + floor pools, window night/rain, the sun shaft with dust motes, kettle steam.
// All cheap unlit meshes (5-7 draw calls), no real-time lights, no allocation per frame.
// ---------------------------------------------------------------------------------------------
let poolTex = null;
function poolTexture() {
  if (poolTex) return poolTex;
  const s = 64, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(255,214,150,0.9)');
  grd.addColorStop(0.5, 'rgba(255,190,120,0.35)');
  grd.addColorStop(1, 'rgba(255,180,110,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  poolTex = new THREE.CanvasTexture(cv);
  poolTex.userData.shared = true;
  return poolTex;
}
function rainTexture() {
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 128;
  const g = cv.getContext('2d');
  g.strokeStyle = 'rgba(235,242,250,0.85)';
  g.lineWidth = 1.6;
  for (let i = 0; i < 26; i++) {
    const x = (i * 23) % 64, y = (i * 41) % 128, l = 10 + (i % 4) * 5;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + l); g.stroke();
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function quadGeo(pts, cols) {
  // pts: 4 corners in order; two triangles; cols: 4 [r, g, b]
  const idx = [0, 1, 2, 0, 2, 3];
  const pos = new Float32Array(18), col = new Float32Array(18);
  idx.forEach((k, i) => { pos.set(pts[k], i * 3); col.set(cols[k], i * 3); });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
function concat(geos) {
  let n = 0;
  for (const g of geos) n += g.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const name of Object.keys(geos[0].attributes)) {
    const size = geos[0].attributes[name].itemSize;
    const arr = new Float32Array(n * size);
    let o = 0;
    for (const g of geos) { arr.set(g.attributes[name].array, o); o += g.attributes[name].array.length; }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  for (const g of geos) g.dispose();
  out.computeBoundingSphere();
  return out;
}
function concatUV(geos) {
  const flat = geos.map((g) => {
    const f = g.index ? g.toNonIndexed() : g;
    for (const name of Object.keys(f.attributes)) if (name !== 'position' && name !== 'uv') f.deleteAttribute(name);
    if (f !== g) g.dispose();
    return f;
  });
  return concat(flat);
}

/**
 * opts: { windows: [{ x, y, w, h }] (back wall), lamps: [{ x, y, z, r, px, pz, floor }] (glow core at x,y,z,
 *         pool on the floor at px,pz), coals: [{ x, y, z, w, d }], steam: [{ x, y, z }], shaft: { dx, len } | false }
 */
function createLife(room, opts) {
  const hd = room.depth / 2;
  const grp = new THREE.Group();
  grp.name = 'life';
  room.group.add(grp);
  const mats = [];
  const own = (m) => (mats.push(m), m);
  const objs = [];
  const add = (o) => { o.userData.dynamic = true; o.raycast = () => {}; grp.add(o); objs.push(o); return o; };
  const wins = opts.windows || [];

  // glow cores: lamp flames / bulbs (brighten toward evening) and coals (always glowing)
  const glowV = new VoxelBuilder();
  for (const l of opts.lamps || []) {
    if (l.core === false) continue;
    glowV.box(l.x, l.y, l.z, l.cw ?? 0.05, l.ch ?? 0.09, l.cw ?? 0.05, '#FFE7A8');
  }
  const emberV = new VoxelBuilder();
  for (const c of opts.coals || []) {
    for (let i = 0; i < 6; i++) emberV.box(c.x + ((i % 3) - 1) * c.w * 0.3, c.y + (i % 2) * 0.02, c.z + (Math.floor(i / 3) - 0.5) * c.d * 0.4, c.w * 0.26, 0.04, c.d * 0.32, i % 2 ? '#FFB860' : C.ember);
  }
  let glow = null, ember = null;
  if (glowV.parts.length) glow = add(new THREE.Mesh(glowV.geometry(), own(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, color: '#B9A988' }))));
  if (emberV.parts.length) ember = add(new THREE.Mesh(emberV.geometry(), own(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }))));

  // lamp pools on the floor (additive)
  const poolGeos = [];
  for (const l of opts.lamps || []) {
    if (l.floor === false) continue;
    const r = l.r ?? 1.3;
    const g = new THREE.PlaneGeometry(r * 2, r * 2);
    g.rotateX(-Math.PI / 2);
    g.translate(l.px ?? l.x, 0.018, l.pz ?? l.z);
    poolGeos.push(g);
  }
  let pools = null;
  if (poolGeos.length) {
    pools = add(new THREE.Mesh(concatUV(poolGeos), own(new THREE.MeshBasicMaterial({ map: poolTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false }))));
    pools.renderOrder = 2;
  }

  // windows: night tint + rain streaks (planes just in front of the painted view)
  let night = null, rain = null, rainTex = null;
  if (wins.length) {
    const ng = [], rg = [];
    for (const w of wins) {
      const a = new THREE.PlaneGeometry(w.w, w.h); a.translate(w.x, w.y, -hd + 0.058); ng.push(a);
      const b = new THREE.PlaneGeometry(w.w, w.h); b.translate(w.x, w.y, -hd + 0.062); rg.push(b);
    }
    night = add(new THREE.Mesh(concatUV(ng), own(new THREE.MeshBasicMaterial({ color: '#1E2B45', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }))));
    rainTex = rainTexture();
    rain = add(new THREE.Mesh(concatUV(rg), own(new THREE.MeshBasicMaterial({ map: rainTex, transparent: true, depthWrite: false, toneMapped: false }))));
    rain.visible = false;
  }

  // sun shaft through the back windows + the bright patch on the floor
  let shaft = null, motes = null;
  const sh = opts.shaft ?? {};
  if (wins.length && sh !== false) {
    const geos = [];
    const dx = sh.dx ?? 0.35, len = sh.len ?? 2.3, k = sh.k ?? 0.05;
    const hi = [1.0, 0.86, 0.6], lo = [0, 0, 0];
    const mul = (a, f) => a.map((c) => c * f);
    for (const w of wins) {
      const zb = -hd + 0.3, x0 = w.x - w.w / 2 + 0.05, x1 = w.x + w.w / 2 - 0.05;
      const yT = w.y + w.h / 2 - 0.05, yB = w.y - w.h / 2 + 0.05;
      geos.push(quadGeo([[x0, yT, zb], [x1, yT, zb], [x1 + dx, 0.03, zb + len], [x0 + dx, 0.03, zb + len]], [mul(hi, k), mul(hi, k), lo, lo]));
      geos.push(quadGeo([[x0, yB, zb], [x1, yB, zb], [x1 + dx * 0.6, 0.03, zb + len * 0.55], [x0 + dx * 0.6, 0.03, zb + len * 0.55]], [mul(hi, k * 0.55), mul(hi, k * 0.55), lo, lo]));
      // floor patch (the window's light on the boards)
      const pz0 = zb + len * 0.52, pz1 = zb + len * 1.0, f = mul(hi, k * 0.9);
      geos.push(quadGeo([[x0 + dx * 0.55, 0.021, pz0], [x1 + dx * 0.55, 0.021, pz0], [x1 + dx, 0.021, pz1], [x0 + dx, 0.021, pz1]], [f, f, f, f]));
    }
    shaft = add(new THREE.Mesh(concat(geos), own(new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }))));
    shaft.renderOrder = 3;
    const N = 9 * wins.length;
    motes = add(new THREE.InstancedMesh(new THREE.BoxGeometry(0.022, 0.022, 0.022), own(new THREE.MeshBasicMaterial({ color: '#FFF0C8', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })), N));
    motes.userData.seeds = Array.from({ length: N }, (_, i) => ({ w: wins[i % wins.length], a: (i * 0.618) % 1, b: (i * 0.377) % 1, c: (i * 0.271) % 1 }));
    motes.userData.len = len;
    motes.userData.dx = dx;
  }

  // kettle steam (instanced puffs)
  let steam = null;
  const srcs = opts.steam || [];
  const PER = 6;
  if (srcs.length) {
    steam = add(new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), own(new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false })), srcs.length * PER));
  }

  const L = room.lights;
  const base = { hemi: L.hemi.intensity, sun: L.sun.intensity, sunC: L.sun.color.clone(), hemiC: L.hemi.color.clone(), bg: room.scene.background.clone() };
  const WARM = new THREE.Color('#FFB46E'), DUSK = new THREE.Color('#5A4A44'), DIM = new THREE.Color('#B9A988'), LIT = new THREE.Color('#FFFFFF');
  const st = { k: 0, rain: false };
  const m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();

  function apply() {
    const k = st.k, r = st.rain ? 1 : 0;
    L.hemi.intensity = base.hemi * (1 - 0.5 * k - 0.15 * r);
    L.sun.intensity = base.sun * (1 - 0.72 * k - 0.35 * r);
    L.sun.color.copy(base.sunC).lerp(WARM, k * 0.75);
    L.hemi.color.copy(base.hemiC).lerp(WARM, k * 0.35);
    room.scene.background.copy(base.bg).lerp(DUSK, k * 0.7);
    if (pools) pools.material.opacity = 0.1 + k * 0.75;
    if (night) {
      night.material.opacity = Math.min(0.85, k * 0.8 + r * 0.38);
      night.material.color.set(r && k < 0.5 ? '#56606E' : '#1E2B45');
    }
    if (rain) rain.visible = !!r;
    if (shaft) shaft.material.color.setScalar(Math.max(0, 1 - k * 1.3) * (r ? 0.12 : 1));
    if (motes) motes.visible = k < 0.6 && !r;
  }

  return {
    group: grp,
    get evening() { return st.k; },
    setEvening(k) { st.k = Math.max(0, Math.min(1, +k || 0)); apply(); },
    setRain(on) { st.rain = !!on; apply(); },
    update(dt, t) {
      if (glow) glow.material.color.copy(DIM).lerp(LIT, Math.min(1, 0.3 + st.k)).multiplyScalar(0.93 + 0.07 * Math.sin(t * 13.1) * Math.sin(t * 7.3));
      if (ember) ember.material.color.setScalar(0.85 + 0.15 * Math.sin(t * 5.3) * Math.sin(t * 2.1));
      if (rain && rain.visible) rainTex.offset.y = (rainTex.offset.y + dt * 1.6) % 1;
      if (motes && motes.visible) {
        const sd = motes.userData.seeds, len = motes.userData.len, dx = motes.userData.dx;
        for (let i = 0; i < sd.length; i++) {
          const s = sd[i], w = s.w;
          const u = (s.a + t * 0.018 * (0.5 + s.c)) % 1;
          const yTop = w.y + w.h / 2 - 0.1;
          v3.set(w.x + (s.b - 0.5) * w.w * 0.8 + dx * u, Math.max(0.12, yTop * (1 - u) + 0.15 * u + Math.sin(t * 0.7 + i) * 0.06 - s.c * 0.4 * (1 - u)), -hd + 0.15 + u * len * 0.9);
          m4.compose(v3, q0, s3.setScalar(0.6 + 0.4 * Math.sin(t * 1.3 + i * 2.1)));
          motes.setMatrixAt(i, m4);
        }
        motes.instanceMatrix.needsUpdate = true;
      }
      if (steam) {
        for (let si = 0; si < srcs.length; si++) {
          const s = srcs[si];
          for (let j = 0; j < PER; j++) {
            const u = (t * 0.42 + j / PER + si * 0.31) % 1;
            const sz = (0.04 + u * 0.08) * (u < 0.8 ? 1 : (1 - u) / 0.2);
            v3.set(s.x + Math.sin(u * 5 + j) * 0.05 * u, s.y + u * 0.55, s.z + Math.cos(u * 4 + j) * 0.03);
            m4.compose(v3, q0, s3.setScalar(Math.max(0.0001, sz)));
            steam.setMatrixAt(si * PER + j, m4);
          }
        }
        steam.instanceMatrix.needsUpdate = true;
      }
    },
    dispose() {
      for (const o of objs) o.geometry?.dispose();
      for (const m of mats) m.dispose();
      rainTex?.dispose();
    },
  };
}

// ---------------------------------------------------------------------------------------------
// instanced movable props (ink jars, school pots, type sorts): one toon draw call + one outline
// ---------------------------------------------------------------------------------------------
function instanced(group, geometry, count, { outline = true, px = 1.3 } = {}) {
  const mesh = new THREE.InstancedMesh(geometry, toon('#ffffff', { vertexColors: true }), count);
  mesh.userData.dynamic = true;
  group.add(mesh);
  if (outline) addOutline(mesh, { px }).userData.dynamic = true;
  const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  const mats = [];
  return {
    mesh,
    set(i, x, y, z, ry = 0, s = 1, rx = 0, rz = 0) {
      mats[i] = M(x, y, z, rx, ry, rz, s, s, s);
      mesh.setMatrixAt(i, mats[i]);
      mesh.instanceMatrix.needsUpdate = true;
    },
    show(i, on) {
      mesh.setMatrixAt(i, on ? mats[i] : hidden);
      mesh.instanceMatrix.needsUpdate = true;
    },
    dispose() { mesh.geometry.dispose(); },
  };
}

/** Ink jar (feet at 0, ~0.24 tall): dark glaze, gold ink at the lip when full, cork, string, label. */
function jarInto(p, x, y, z, { s = 1, full = true, glaze = '#33475A', label = C.paper, band = C.maroon } = {}) {
  const q = p.at(x, z, 0, y);
  q.pr(0, 0.012 * s, 0, 0.062 * s, 0.056 * s, 0.024 * s, jitter(glaze, 0.05, 2), 8);
  q.pr(0, 0.09 * s, 0, 0.08 * s, 0.068 * s, 0.13 * s, glaze, 8);
  q.pr(0, 0.168 * s, 0, 0.05 * s, 0.078 * s, 0.03 * s, jitter(glaze, 0.12, 5), 8);
  q.pr(0, 0.196 * s, 0, 0.038 * s, 0.038 * s, 0.03 * s, glaze, 8);
  q.pr(0, 0.212 * s, 0, 0.044 * s, 0.044 * s, 0.008 * s, full ? C.gold : '#1E2830', 8); // gold ink line at the lip
  q.pr(0, 0.226 * s, 0, 0.034 * s, 0.03 * s, 0.03 * s, '#C9A576', 8); // cork
  q.box(0, 0.2 * s, 0, 0.086 * s, 0.012 * s, 0.086 * s, '#D8C9A6'); // string
  q.box(0, 0.095 * s, 0.071 * s, 0.07 * s, 0.06 * s, 0.012 * s, label); // label
  q.box(0, 0.1 * s, 0.078 * s, 0.04 * s, 0.01 * s, 0.004 * s, band);
  if (full) q.box(0.03 * s, 0.14 * s, 0.072 * s, 0.018 * s, 0.03 * s, 0.01 * s, '#F4D27A'); // glint
}
function jarGeometry(opts) {
  const v = new VoxelBuilder();
  jarInto(new Pen(v), 0, 0, 0, opts);
  return v.geometry();
}

// ---------------------------------------------------------------------------------------------
// shared furniture and set dressing (into a Pen; feet at y = 0, fronts +Z)
// ---------------------------------------------------------------------------------------------
function lowTable(p, x, z, { w = 0.62, d = 0.62, h = 0.45, top = C.woodL, edge = C.wood, legs = C.woodD, seed = 1 } = {}) {
  const q = p.at(x, z);
  q.bm(-w / 2, h - 0.05, -d / 2, w / 2, h, d / 2, jitter(top, 0.05, seed));
  q.bm(-w / 2 - 0.012, h - 0.075, -d / 2 - 0.012, w / 2 + 0.012, h - 0.045, d / 2 + 0.012, edge);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) q.box(sx * (w / 2 - 0.06), (h - 0.07) / 2, sz * (d / 2 - 0.06), 0.05, h - 0.07, 0.05, legs);
  q.bm(-w / 2 + 0.06, 0.1, -0.015, w / 2 - 0.06, 0.13, 0.015, legs);
  q.bm(-0.015, 0.1, -d / 2 + 0.06, 0.015, 0.13, d / 2 - 0.06, legs);
  q.bm(-0.1, h + 0.001, 0.06, 0.0, h + 0.003, 0.16, jitter(top, 0.14, seed + 3)); // a worn ring
  return h;
}
const STOOLS = ['#B8423C', '#3F7C78', '#D9A93B', '#5F8DB0', '#6E1F2A'];
function stool(p, x, z, col = STOOLS[0], h = 0.25) {
  const q = p.at(x, z);
  q.bm(-0.14, h - 0.035, -0.14, 0.14, h, 0.14, col);
  q.bm(-0.06, h - 0.002, -0.02, 0.06, h + 0.001, 0.02, jitter(col, 0.25, 4)); // grip slot
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) q.box(sx * 0.11, (h - 0.035) / 2, sz * 0.11, 0.035, h - 0.035, 0.035, jitter(col, 0.12, sx + sz * 3));
  q.bm(-0.11, 0.06, -0.12, 0.11, 0.085, -0.1, jitter(col, 0.1, 7));
}
function teapot(p, x, y, z, { col = '#3E7C66', ry = 0, s = 1 } = {}) {
  const q = p.at(x, z, ry, y);
  q.pr(0, 0.01 * s, 0, 0.05 * s, 0.045 * s, 0.02 * s, jitter(col, 0.1, 2), 8);
  q.pr(0, 0.055 * s, 0, 0.072 * s, 0.062 * s, 0.07 * s, col, 8);
  q.pr(0, 0.098 * s, 0, 0.045 * s, 0.066 * s, 0.022 * s, jitter(col, 0.08, 3), 8);
  q.pr(0, 0.114 * s, 0, 0.012 * s, 0.016 * s, 0.018 * s, C.cream, 6);
  q.box(0.085 * s, 0.07 * s, 0, 0.06 * s, 0.022 * s, 0.022 * s, col, 0, 0, 0.6); // spout
  q.box(-0.08 * s, 0.065 * s, 0, 0.02 * s, 0.06 * s, 0.018 * s, jitter(col, 0.15, 6)); // handle
  q.box(-0.07 * s, 0.096 * s, 0, 0.03 * s, 0.014 * s, 0.018 * s, jitter(col, 0.15, 6));
  q.box(0, 0.06 * s, 0.067 * s, 0.05 * s, 0.014 * s, 0.006 * s, C.cream); // painted band
}
function cup(p, x, y, z, { col = C.white, tea = '#B9864E', saucer = true } = {}) {
  const q = p.at(x, z, 0, y);
  if (saucer) q.pr(0, 0.005, 0, 0.05, 0.045, 0.01, jitter(C.cream, 0.04, 1), 8);
  q.pr(0, 0.035, 0, 0.034, 0.026, 0.05, col, 8);
  if (tea) q.pr(0, 0.058, 0, 0.03, 0.03, 0.004, tea, 8);
  q.box(0.04, 0.035, 0, 0.012, 0.026, 0.01, col);
}
function basketInto(p, x, z, { r = 0.24, h = 0.3, col = '#C9A26A', y = 0 } = {}) {
  const q = p.at(x, z, 0, y);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const yy = (i + 0.5) * (h / n);
    const rr = r * (0.82 + 0.18 * (i / n));
    q.pr(0, yy, 0, rr, rr * 0.97, h / n + 0.002, i % 2 ? col : jitter(col, 0.16, i), 8);
  }
  q.pr(0, h + 0.012, 0, r * 1.04, r * 1.04, 0.026, jitter(col, -0.2, 9), 8);
  q.pr(0, h - 0.02, 0, r * 0.93, r * 0.93, 0.02, jitter(col, -0.35, 2), 8); // dark inside
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + Math.PI / 8;
    q.box(Math.sin(a) * r * 0.93, h / 2, Math.cos(a) * r * 0.93, 0.02, h * 0.98, 0.02, jitter(col, -0.18, i), 0, a, 0);
  }
}
function waterPot(p, x, z, { y = 0 } = {}) {
  const q = p.at(x, z, 0, y);
  q.bm(-0.22, 0.34, -0.22, 0.22, 0.38, 0.22, C.woodD); // wooden stand
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) q.box(sx * 0.18, 0.17, sz * 0.18, 0.05, 0.34, 0.05, C.woodD);
  const T = [[0.11, 0.04, C.terraD], [0.17, 0.08, C.terra], [0.2, 0.12, C.terraL], [0.17, 0.07, C.terra], [0.11, 0.05, C.terraD], [0.12, 0.03, C.terraL]];
  let yy = 0.38;
  for (const [r, h, c] of T) { q.pr(0, yy + h / 2, 0, r, r, h, c, 8); yy += h; }
  q.pr(0, yy + 0.015, 0, 0.14, 0.14, 0.03, C.wood, 8); // lid
  q.box(0, yy + 0.04, 0, 0.04, 0.03, 0.04, C.woodD);
  q.pr(0.08, yy + 0.06, 0.05, 0.035, 0.03, 0.05, C.steel, 8); // tin cup on the lid
  q.pr(0, 0.38 + 0.04 + 0.08 + 0.06, 0, 0.202, 0.202, 0.022, '#EBDCBF', 8); // painted band
}
function broom(p, x, z, { lean = 0.18, ry = 0 } = {}) {
  const q = p.at(x, z, ry);
  q.box(0, 0.68, -0.08, 0.03, 1.1, 0.03, C.woodL, -lean, 0, 0);
  q.box(0, 0.13, 0.0, 0.2, 0.26, 0.07, '#D8B86A', -lean * 0.3, 0, 0);
  q.box(0, 0.27, -0.01, 0.16, 0.04, 0.08, C.maroon, -lean * 0.3, 0, 0);
}
/** a hanging cloth panel w x h whose top is at y, folds as strips */
function curtain(p, x, y, w, h, z, { col = C.blueL, tie = C.gold } = {}) {
  const q = p.at(x, z);
  const n = Math.max(3, Math.round(w / 0.06));
  for (let i = 0; i < n; i++) {
    const xx = -w / 2 + (i + 0.5) * (w / n);
    q.box(xx, y - h / 2, (i % 2) * 0.02, w / n + 0.002, h, 0.03, jitter(col, 0.07, i));
  }
  if (tie) q.bm(-w / 2 - 0.02, y - h * 0.62, -0.01, w / 2 + 0.02, y - h * 0.56, 0.06, tie);
}
function sandals(p, x, z, { col = '#7A5434', strap = C.maroon, ry = 0 } = {}) {
  const q = p.at(x, z, ry);
  for (const sx of [-1, 1]) {
    q.bm(sx * 0.06 - 0.045, 0, -0.12, sx * 0.06 + 0.045, 0.02, 0.12, col);
    q.bm(sx * 0.06 - 0.047, 0.02, 0.02, sx * 0.06 + 0.047, 0.035, 0.05, strap);
  }
}
function bench(p, x, z, { len = 1.2, h = 0.42, ry = 0, top = C.wood, legs = C.woodD, d = 0.32 } = {}) {
  const q = p.at(x, z, ry);
  q.bm(-len / 2, h - 0.05, -d / 2, len / 2, h, d / 2, top);
  q.bm(-len / 2 + 0.02, h - 0.004, -d / 2 + 0.02, len / 2 - 0.02, h + 0.001, -d / 2 + 0.06, jitter(top, 0.1, 3));
  for (const sx of [-1, 1]) {
    q.bm(sx * (len / 2 - 0.12) - 0.035, 0, -d / 2 + 0.04, sx * (len / 2 - 0.12) + 0.035, h - 0.05, -d / 2 + 0.1, legs);
    q.bm(sx * (len / 2 - 0.12) - 0.035, 0, d / 2 - 0.1, sx * (len / 2 - 0.12) + 0.035, h - 0.05, d / 2 - 0.04, legs);
  }
  q.bm(-len / 2 + 0.1, 0.12, -0.02, len / 2 - 0.1, 0.16, 0.02, legs);
}
function cat(p, x, y, z, ry = 0) {
  const q = p.at(x, z, ry, y);
  const fur = '#D98A3E', furD = '#B86E2C', furL = '#F2C48A';
  q.bm(-0.16, 0, -0.1, 0.14, 0.12, 0.1, fur); // curled body
  q.bm(-0.12, 0.12, -0.08, 0.1, 0.15, 0.08, jitter(fur, 0.08, 2));
  for (let i = 0; i < 3; i++) q.bm(-0.12 + i * 0.09, 0.15, -0.081, -0.08 + i * 0.09, 0.152, 0.081, furD); // stripes
  q.bm(0.1, 0.02, -0.06, 0.24, 0.13, 0.08, fur); // head
  q.bm(0.12, 0.13, -0.05, 0.15, 0.17, -0.02, furD); // ears
  q.bm(0.19, 0.13, -0.05, 0.22, 0.17, -0.02, furD);
  q.bm(0.12, 0.04, 0.08, 0.22, 0.09, 0.085, furL); // muzzle
  q.bm(0.13, 0.095, 0.08, 0.16, 0.102, 0.084, C.ink); // closed eyes
  q.bm(0.18, 0.095, 0.08, 0.21, 0.102, 0.084, C.ink);
  q.bm(-0.2, 0.0, 0.06, 0.12, 0.04, 0.12, furD); // tail wrapped round
}
/** small potted plant (jasmine / herbs) */
function plantPot(p, x, y, z, { s = 1, flowers = true, pot = C.terra } = {}) {
  const q = p.at(x, z, 0, y);
  q.pr(0, 0.06 * s, 0, 0.08 * s, 0.06 * s, 0.12 * s, pot, 8);
  q.pr(0, 0.125 * s, 0, 0.088 * s, 0.088 * s, 0.02 * s, jitter(pot, 0.15, 3), 8);
  const L = [[0, 0.2, 0, 0.13], [0.06, 0.26, 0.03, 0.09], [-0.06, 0.24, -0.02, 0.1], [0.02, 0.31, -0.04, 0.08], [-0.03, 0.18, 0.06, 0.08]];
  L.forEach(([a, b, c, w], i) => q.box(a * s, b * s, c * s, w * s, w * 0.8 * s, w * s, i % 2 ? C.leafD : C.leaf));
  if (flowers) for (let i = 0; i < 5; i++) q.box(Math.sin(i * 2.4) * 0.06 * s, (0.27 + (i % 3) * 0.03) * s, Math.cos(i * 2.4) * 0.05 * s, 0.03 * s, 0.03 * s, 0.03 * s, C.white);
}
/** a plank shelf on the back wall with two brackets (x0..x1 at height y, depth d from the wall) */
function wallShelf(p, x0, x1, y, zWall, { d = 0.24, col = C.wood, brackets = true } = {}) {
  p.bm(x0, y - 0.04, zWall, x1, y, zWall + d, col);
  p.bm(x0, y - 0.045, zWall + d - 0.02, x1, y - 0.035, zWall + d + 0.005, jitter(col, -0.15, 4));
  if (brackets) for (const bx of [x0 + 0.15, x1 - 0.15]) {
    p.bm(bx - 0.02, y - 0.22, zWall, bx + 0.02, y - 0.04, zWall + 0.04, C.woodD);
    p.box(bx, y - 0.13, zWall + d * 0.4, 0.03, 0.03, d * 0.85, C.woodD, -0.75, 0, 0);
  }
}
/** a row of books standing on a surface (x0..x1 at height y, centred on z) */
function bookRow(p, x0, x1, y, z, { seed = 1, d = 0.16, hMax = 0.24 } = {}) {
  const cols = [C.maroon, C.goldD, C.blueD, C.greenD, C.cream, '#8E5A3C', C.ink, '#C27A5B', C.plum];
  let x = x0, k = seed * 7;
  while (x < x1 - 0.03) {
    const bw = 0.03 + ((k * 37) % 5) * 0.008;
    const bh = hMax * (0.65 + ((k * 13) % 5) * 0.08);
    if ((k * 11) % 10 === 0 && x + bh < x1) {
      p.box(x + bh / 2, y + bw / 2, z, bh, bw, d, cols[k % cols.length]); // a book lying flat
      x += bh + 0.01;
    } else {
      p.bm(x, y, z - d / 2, x + bw, y + bh, z + d / 2, cols[k % cols.length]);
      p.bm(x + 0.004, y + bh * 0.7, z + d / 2, x + bw - 0.004, y + bh * 0.74, z + d / 2 + 0.003, C.gold);
      x += bw + 0.004;
    }
    k++;
  }
}
/** stack of paper sheets */
function paperStack(p, x, y, z, { w = 0.3, d = 0.22, n = 5, ry = 0, col = C.newsL } = {}) {
  const q = p.at(x, z, ry, y);
  for (let i = 0; i < n; i++) q.box(Math.sin(i * 2.1) * 0.008, 0.006 + i * 0.012, Math.cos(i * 1.7) * 0.006, w, 0.011, d, i % 2 ? col : jitter(col, 0.04, i), 0, Math.sin(i * 3.3) * 0.05, 0);
  return y + n * 0.012;
}
/** wall oil lamp: bracket + fount + frosted chimney (the glow core is added by createLife at y + 0.0) */
function oilLamp(p, x, y, z, { ry = 0 } = {}) {
  const q = p.at(x, z, ry, y);
  q.bm(-0.015, 0.12, -0.17, 0.015, 0.15, 0.0, C.ironD);
  q.bm(-0.03, -0.12, -0.19, 0.03, 0.2, -0.16, C.ironD);
  q.pr(0, 0.1, 0, 0.004, 0.004, 0.06, C.ironD, 4);
  q.pr(0, -0.12, 0, 0.055, 0.045, 0.06, C.bronze, 8); // fount
  q.pr(0, -0.08, 0, 0.032, 0.055, 0.02, C.gold, 8);
  q.pr(0, 0.07, 0, 0.042, 0.042, 0.012, C.ironD, 8);
}
/** kit plant at (x, z), scaled; placed with a collision footprint */
function kitPlant(room, x, z, s = 1) {
  const g = kit.plant({ size: s });
  room.place(g, x, z);
  return g;
}
/** a wall clock frame (the face is drawn in the atlas) */
function clockFrame(p, x, y, z, r = 0.17) {
  p.at(x, z, 0, y).pr(0, 0, 0, r, r, 0.05, C.woodD, 10, Math.PI / 2, 0);
}

// ---------------------------------------------------------------------------------------------
// shared room finishing: statics baked, atlas mesh, life, story stations (no markers)
// ---------------------------------------------------------------------------------------------
function station(id, x, z, look, { r = 1.0, labelY = 1.6, line = null, emote = null, face = null } = {}) {
  return { id, x, z, r, look: { x: look[0], z: look[1] }, labelY, labelAnchor: new THREE.Vector3(look[0], labelY, look[1]), line, emote, face };
}
function solid(room, x, z, w, d, pad = 0.06) {
  room.obstacles.push({ type: 'box', minX: x - w / 2 - pad, maxX: x + w / 2 + pad, minZ: z - d / 2 - pad, maxZ: z + d / 2 + pad });
}
/**
 * Camera framing hint for a portrait phone (412 x 915) and a fitter for any screen.
 *   cam: { tilt (deg), width (m across a portrait phone), look: { x, y, z }, slide (m the look may slide in x) }
 *   camFor(aspect, fov = 45) -> { tilt, dist, target: { x, y, z } }: portrait shows `width` metres across
 *   (the room fills ~65% of the height instead of ~40% at the game's default 9.6 m); landscape fits the room.
 */
function camHint(room, { tilt = 54, width = null, lookZ = -0.3, lookY = 0.55 } = {}) {
  const w = width ?? Math.min(room.width + 0.4, 6.4);
  const cam = { tilt, width: w, look: { x: 0, y: lookY, z: lookZ }, slide: Math.max(0, (room.width - w) / 2 + 0.3) };
  const camFor = (aspect, fov = 45) => {
    const t = THREE.MathUtils.degToRad(tilt), vf = THREE.MathUtils.degToRad(fov);
    const hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
    const byW = (m) => m / 2 / Math.tan(hf / 2);
    const ext = room.depth * Math.sin(t) + room.height * Math.cos(t) + 0.6; // the room's on-screen height
    const dist = aspect < 1 ? byW(w) : Math.max(byW(room.width + 0.8), ext / 2 / Math.tan(vf / 2));
    return { tilt, dist, target: { ...cam.look } };
  };
  return { cam, camFor };
}
function finish(room, v, A, life, { id, name, spots, stations, cast, decals = null, handles = {}, animators = [], extraDispose = [], cam = {} }) {
  const statics = v.mesh({ outline: true, px: 1.4 });
  statics.name = 'statics';
  room.group.add(statics);
  room.bake();
  if (decals && decals.parts.length) {
    // flat details (wallpaper stripes, mat weave, print columns): no outline, so they stay soft
    const dm = new THREE.Mesh(decals.geometry(), toon('#ffffff', { vertexColors: true }));
    dm.name = 'decals';
    dm.userData.dynamic = true;
    room.group.add(dm);
  }
  const signs = A.mesh();
  signs.renderOrder = 1;
  room.group.add(signs);
  room.scene.userData.standardLights = room.lights;
  const { cam: camH, camFor } = camHint(room, cam);
  return {
    cam: camH,
    camFor,
    id,
    name,
    scene: room.scene,
    group: room.group,
    lights: room.lights,
    width: room.width,
    depth: room.depth,
    height: room.height,
    bounds: room.bounds,
    obstacles: room.obstacles,
    door: room.door,
    spawn: room.spawn,
    spots,
    stations,
    cast,
    textures: room.textures,
    update(dt, t) {
      life.update(dt, t);
      for (const a of animators) a(dt, t);
    },
    setEvening: (k) => life.setEvening(k),
    setRain: (on) => life.setRain(on),
    dispose() {
      life.dispose();
      for (const d of extraDispose) d?.();
      // the room's own materials (atlas quads, decals, instanced props); toon/outline materials the kit
      // caches are left alone (shared). Then the kit frees every geometry, map and room texture.
      room.group.traverse((o) => {
        const m = o.material;
        if (m && !Array.isArray(m) && (m.map === A.texture || o.isInstancedMesh || o.name === 'decals')) m.dispose();
      });
      A.texture?.dispose();
      room.dispose();
    },
    ...handles,
  };
}

// ---------------------------------------------------------------------------------------------
// wall dressing shared by the rooms: wallpaper stripes above the rail, raised stiles on the
// wainscot, a picture rail; side walls follow the kit's cut-away steps
// ---------------------------------------------------------------------------------------------
function dressWalls(p, room, { stripe = null, stile = null, every = 0.32, panel = 0.62 } = {}) {
  const hw = room.width / 2, hd = room.depth / 2, H = room.height, D = room.depth;
  const steps = [[-hd, -hd + D * 0.45, H], [-hd + D * 0.45, -hd + D * 0.65, H * 0.62], [-hd + D * 0.65, -hd + D * 0.85, H * 0.36], [-hd + D * 0.85, hd, 0.5]];
  if (stripe) {
    let i = 0;
    for (let x = -hw + every / 2; x < hw; x += every, i++) p.bm(x - 0.035, 1.07, -hd, x + 0.035, H - 0.13, -hd + 0.006, jitter(stripe, 0.03, i));
    for (const sx of [-1, 1]) {
      const xw = sx * hw;
      for (const [z0, z1, h] of steps) {
        if (h < 1.3) continue;
        for (let z = z0 + every / 2; z < z1 - 0.04; z += every) p.bm(xw - sx * 0.006, 1.07, z - 0.035, xw, Math.min(h, H) - 0.1, z + 0.035, stripe);
      }
    }
  }
  if (stile) {
    for (let x = -hw + panel; x < hw - 0.1; x += panel) p.bm(x - 0.025, 0.15, -hd, x + 0.025, 0.96, -hd + 0.025, stile);
    p.bm(-hw, 0.55, -hd, hw, 0.58, -hd + 0.02, stile);
    for (const sx of [-1, 1]) {
      const xw = sx * hw;
      for (let z = -hd + panel; z < hd - 0.2; z += panel) {
        const h = steps.find(([a, b]) => z >= a && z < b)?.[2] ?? 0.5;
        p.bm(xw - sx * 0.025, 0.15, z - 0.025, xw, Math.min(0.96, h - 0.1), z + 0.025, stile);
      }
    }
  }
}
/** paints a window view into the atlas and lays it over the kit window (back wall) */
function windowQuad(A, room, w, opts) {
  const hd = room.depth / 2;
  const r = A.draw(Math.round(w.w * 140), Math.round(w.h * 140), (g, W, H) => windowView(g, W, H, opts));
  A.quad(r, w.w, w.h, M(w.x, w.y, -hd + 0.05));
  return r;
}
/** a framed sign on a wall: wood frame boxes into the pen + the atlas face */
function framedSign(p, A, x, y, z, w, h, draw, { ry = 0, frame = C.woodD, px = 360 } = {}) {
  const q = p.at(x, z, ry, y);
  const b = 0.045;
  q.bm(-w / 2 - b, -h / 2 - b, -0.01, w / 2 + b, -h / 2, 0.035, frame);
  q.bm(-w / 2 - b, h / 2, -0.01, w / 2 + b, h / 2 + b, 0.035, frame);
  q.bm(-w / 2 - b, -h / 2, -0.01, -w / 2, h / 2, 0.035, frame);
  q.bm(w / 2, -h / 2, -0.01, w / 2 + b, h / 2, 0.035, frame);
  q.bm(-w / 2, -h / 2, -0.01, w / 2, h / 2, 0.0, C.paper);
  const r = A.draw(px, Math.round((px * h) / w), draw);
  A.quad(r, w, h, q.base.clone().multiply(M(0, 0, 0.012)));
  return r;
}
/** a flat paper sheet stuck on a wall or lying on a table: atlas face only */
function sheet(A, r, w, h, m) { A.quad(r, w, h, m); }

// =============================================================================================
// letterroom · Ma Thida's letter room (her home and shop) · 5 x 6 · day8-spec 15.1
// =============================================================================================
async function buildLetterroom(opts = {}) {
  await fontsReady();
  const W = 5, D = 6, hw = W / 2, hd = D / 2;
  const WIN = { x: -1.3, y: 1.7, w: 1.0, h: 0.9 };
  const room = kit.createRoom({ width: W, depth: D, height: 3, wall: '#EFE6D0', wainscot: '#86AECB', trim: C.goldD, floor: 'planks', floorColor: '#B48C5E', background: '#E6DCC6', windows: [WIN] });
  const v = new VoxelBuilder();
  const p = new Pen(v);
  const dv = new VoxelBuilder();
  const d = new Pen(dv); // flat details, no outline
  const A = makeAtlas(1024);
  const ZB = -hd;
  dressWalls(d, room, { stripe: '#E8DEC6', stile: '#7398B6' });

  // --- back wall: window with blue curtains, jasmine on the sill ---
  windowQuad(A, room, WIN, {
    seed: 3,
    extra(g, w, h) { // a padauk branch in flower across the top corner
      g.fillStyle = '#6E4A2E';
      g.fillRect(w * 0.55, h * 0.08, w * 0.45, 5);
      g.fillRect(w * 0.7, h * 0.08, 4, h * 0.2);
      for (let i = 0; i < 14; i++) {
        g.fillStyle = i % 3 ? '#F2C232' : '#E3A51E';
        g.fillRect(w * (0.55 + (i % 7) * 0.065), h * (0.03 + Math.floor(i / 7) * 0.09 + (i % 2) * 0.03), 9, 9);
      }
      g.fillStyle = '#6F9E5B';
      for (let i = 0; i < 6; i++) g.fillRect(w * (0.6 + i * 0.07), h * 0.13, 8, 5);
    },
  });
  p.bm(WIN.x - 0.75, 2.3, ZB + 0.02, WIN.x + 0.75, 2.33, ZB + 0.09, C.bronze); // rod
  for (const sx of [-1, 1]) p.box(WIN.x + sx * 0.76, 2.315, ZB + 0.055, 0.05, 0.05, 0.05, C.gold);
  curtain(p.at(0, 0), WIN.x - 0.64, 2.3, 0.26, 1.18, ZB + 0.1, { col: '#7FA8C8' });
  curtain(p.at(0, 0), WIN.x + 0.64, 2.3, 0.26, 1.18, ZB + 0.1, { col: '#7FA8C8' });
  plantPot(p, WIN.x - 0.32, 1.2, ZB + 0.12, { s: 0.85 });
  cup(p, WIN.x + 0.3, 1.2, ZB + 0.13, { col: '#E0C9A0', tea: null, saucer: false });
  for (let i = 0; i < 3; i++) p.box(WIN.x + 0.29 + i * 0.012, 1.3, ZB + 0.13, 0.008, 0.16, 0.008, [C.maroon, C.ink, C.goldD][i], 0, 0, (i - 1) * 0.15); // pens in the cup

  // --- jar shelf: twelve ink jars (instanced: she lifts eleven into the basket later) ---
  const SH = { x0: -0.2, x1: 2.0, y: 1.2 };
  wallShelf(p, SH.x0, SH.x1, SH.y, ZB, { d: 0.26, col: C.wood });
  p.bm(SH.x0, SH.y, ZB, SH.x1, SH.y + 0.012, ZB + 0.01, C.woodD);
  // upper shelf: her own books, an envelope box, a tin, the little bridge painting
  wallShelf(p, 0.05, 1.75, 1.82, ZB, { d: 0.22, col: C.wood });
  bookRow(p, 0.12, 0.85, 1.82, ZB + 0.11, { seed: 4, d: 0.15, hMax: 0.26 });
  p.bm(0.95, 1.82, ZB + 0.03, 1.3, 1.95, ZB + 0.2, C.cream); // envelope box
  p.bm(0.95, 1.95, ZB + 0.03, 1.3, 1.965, ZB + 0.2, C.maroon);
  p.pr(1.48, 1.9, ZB + 0.11, 0.07, 0.07, 0.16, '#B8423C', 8); // tea tin
  p.pr(1.48, 1.985, ZB + 0.11, 0.072, 0.072, 0.012, C.gold, 8);
  paperStack(p, 1.64, 1.82, ZB + 0.11, { w: 0.16, d: 0.18, n: 4, col: '#DCE6EE' });
  // sign board above: letters written and read
  framedSign(p, A, 0.9, 2.47, ZB + 0.02, 1.5, 0.5, (g, w, h) => {
    paperBg(g, w, h, { bg: '#F4EBD6', edge: '#C9A24A', seed: 2 });
    // big, dark Burmese first (reads at phone size), small English under it
    text(g, 'စာ ရေးပေး · ဖတ်ပေး', w / 2, h * 0.42, { size: h * 0.4, color: '#1F3F5E', max: w * 0.76 });
    text(g, 'Letters written & read', w / 2, h * 0.83, { size: h * 0.15, family: FONT_SERIF, weight: 600, color: C.goldD, max: w * 0.6 });
    // a little painted envelope each side
    for (const ex of [w * 0.025, w * 0.895]) {
      g.fillStyle = '#FFFDF8'; g.fillRect(ex, h * 0.28, w * 0.08, h * 0.3);
      g.strokeStyle = '#B8423C'; g.lineWidth = 4; g.beginPath(); g.moveTo(ex, h * 0.28); g.lineTo(ex + w * 0.04, h * 0.45); g.lineTo(ex + w * 0.08, h * 0.28); g.stroke();
    }
  }, { frame: C.woodD, px: 560 });
  // clock (top right of the back wall)
  clockFrame(p, 2.05, 2.5, ZB + 0.04, 0.17);
  A.quad(A.draw(96, 96, (g, w, h) => drawClock(g, w, h, 9, 40)), 0.28, 0.28, M(2.05, 2.5, ZB + 0.068));

  // --- the bed corner (back-left): low platform, reed mat, folded blanket, pillow, rolled mat ---
  const BX0 = -hw, BX1 = -1.62, BZ0 = ZB, BZ1 = ZB + 1.05;
  p.bm(BX0, 0, BZ0, BX1, 0.26, BZ1, C.woodD);
  p.bm(BX0, 0.2, BZ0, BX1 + 0.02, 0.26, BZ1 + 0.02, C.wood);
  p.bm(BX0 + 0.04, 0.26, BZ0 + 0.04, BX1 - 0.04, 0.29, BZ1 - 0.04, '#D9C08A'); // reed mat
  for (let z = BZ0 + 0.1; z < BZ1 - 0.06; z += 0.09) p.bm(BX0 + 0.04, 0.29, z, BX1 - 0.04, 0.293, z + 0.025, '#C4A66E');
  p.bm(BX0 + 0.08, 0.29, BZ0 + 0.06, BX1 - 0.1, 0.4, BZ0 + 0.3, C.cream); // pillow
  p.bm(BX0 + 0.1, 0.4, BZ0 + 0.09, BX1 - 0.12, 0.42, BZ0 + 0.27, jitter(C.cream, 0.05, 3));
  for (let i = 0; i < 3; i++) p.bm(BX0 + 0.08, 0.29 + i * 0.05, BZ1 - 0.42, BX1 - 0.08, 0.34 + i * 0.05, BZ1 - 0.1, i % 2 ? '#8E2F3C' : C.maroon); // folded blanket
  for (let k = 0; k < 4; k++) p.bm(BX0 + 0.08 + k * 0.2, 0.29, BZ1 - 0.421, BX0 + 0.12 + k * 0.2, 0.44, BZ1 - 0.099, C.gold); // its checks
  p.pr(BX0 + 0.14, 0.8, BZ0 + 0.12, 0.09, 0.09, 1.0, '#D9C08A', 8); // a rolled mat standing in the corner
  p.pr(BX0 + 0.14, 0.95, BZ0 + 0.12, 0.095, 0.095, 0.04, C.maroon, 8);
  p.pr(BX0 + 0.14, 0.55, BZ0 + 0.12, 0.095, 0.095, 0.04, C.maroon, 8);
  solid(room, (BX0 + BX1) / 2, (BZ0 + BZ1) / 2, BX1 - BX0, BZ1 - BZ0);

  // --- left wall: the letter line (six folded letters on pegs), a towel peg, the oil lamp ---
  const LX = -hw + 0.1, LY = 1.74;
  p.bm(LX - 0.005, LY - 0.005, -2.25, LX + 0.005, LY + 0.005, 0.45, '#D8C9A6');
  for (const z of [-2.27, 0.47]) p.bm(-hw, LY - 0.03, z - 0.02, LX + 0.02, LY + 0.03, z + 0.02, C.bronze);
  const env = ['#F6F0E2', '#E3EEF6', '#F6F0E2', '#F2E2C8', '#E3EEF6', '#F6F0E2'];
  for (let i = 0; i < 6; i++) {
    const z = -1.98 + i * 0.44, tilt = Math.sin(i * 2.7) * 0.08;
    const q = p.at(LX + 0.01, z, Math.PI / 2, LY);
    q.box(0, -0.13, 0, 0.3, 0.21, 0.014, env[i], 0, 0, tilt);
    q.box(0, -0.075, 0.008, 0.29, 0.014, 0.004, jitter(env[i], -0.14, i), 0, 0, tilt + 0.25);
    q.box(0.1, -0.15, 0.009, 0.05, 0.055, 0.004, i % 2 ? C.red : '#3F6684', 0, 0, tilt); // stamp
    for (let k = 0; k < 3; k++) q.box(-0.04, -0.15 - k * 0.035, 0.009, 0.13 - k * 0.03, 0.012, 0.003, '#5A6478', 0, 0, tilt);
    if (env[i] === '#E3EEF6') for (let k = 0; k < 6; k++) q.box(-0.14 + k * 0.055, -0.23, 0.009, 0.025, 0.016, 0.003, k % 2 ? C.red : '#3F6684', 0, 0, tilt);
    q.box(0, 0.0, 0.0, 0.025, 0.06, 0.03, C.woodL); // peg
  }
  // towel and a longyi on pegs, below the line's back end
  p.bm(-hw, 1.45, -2.66, -hw + 0.07, 1.48, -2.6, C.woodD);
  p.bm(-hw + 0.02, 0.9, -2.75, -hw + 0.06, 1.46, -2.52, '#E9DFC9');
  for (let i = 0; i < 4; i++) p.bm(-hw + 0.06, 0.95 + i * 0.12, -2.75, -hw + 0.065, 0.98 + i * 0.12, -2.52, '#86AECB');
  oilLamp(p, -hw + 0.19, 2.05, -0.75, { ry: Math.PI / 2 });

  // --- left wall middle: a low side table with a radio and a thermos; a floor cushion ---
  const sq = p.at(-hw + 0.3, -0.45);
  sq.bm(-0.22, 0.4, -0.3, 0.22, 0.45, 0.3, C.woodL);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) sq.box(sx * 0.18, 0.2, sz * 0.26, 0.04, 0.4, 0.04, C.woodD);
  sq.bm(-0.18, 0.12, -0.26, 0.18, 0.15, 0.26, C.woodD);
  const rq = p.at(-hw + 0.3, -0.6, Math.PI / 2, 0.45); // the radio faces the room
  rq.bm(-0.16, 0, -0.07, 0.16, 0.16, 0.07, '#8E3B32');
  rq.bm(-0.14, 0.02, 0.07, 0.02, 0.14, 0.075, '#D9C9A6');
  for (let i = 0; i < 4; i++) rq.bm(-0.13, 0.035 + i * 0.03, 0.075, 0.01, 0.045 + i * 0.03, 0.08, '#8E7E62');
  rq.box(0.08, 0.1, 0.075, 0.05, 0.05, 0.01, C.gold);
  rq.box(0.08, 0.04, 0.075, 0.03, 0.03, 0.012, C.ink);
  rq.box(0.1, 0.25, -0.03, 0.006, 0.2, 0.006, C.steel, 0, 0, -0.4);
  const fq = p.at(-hw + 0.3, -0.22, 0, 0.45); // thermos and a cup
  fq.pr(0, 0.13, 0, 0.055, 0.055, 0.26, '#C8323C', 8);
  fq.pr(0, 0.27, 0, 0.045, 0.05, 0.03, C.cream, 8);
  fq.pr(0, 0.07, 0, 0.058, 0.058, 0.03, C.gold, 8);
  cup(p, -hw + 0.32, 0.45, -0.02, { tea: '#B9864E' });
  solid(room, -hw + 0.3, -0.45, 0.46, 0.62);
  const cu = p.at(-1.55, -0.35, 0.2);
  cu.bm(-0.22, 0, -0.22, 0.22, 0.06, 0.22, '#86AECB');
  cu.bm(-0.19, 0.06, -0.19, 0.19, 0.08, 0.19, jitter('#86AECB', 0.08, 2));
  cu.box(0, 0.085, 0, 0.04, 0.012, 0.04, C.maroon);
  kitPlant(room, -1.7, 2.3, 0.7);

  // --- front left: water pot on its stand, a pair of slippers by the door ---
  waterPot(p, -2.0, 1.05);
  solid(room, -2.0, 1.05, 0.46, 0.46);
  sandals(p, -1.3, 2.55, { col: '#3F6684', strap: '#E9DFC9', ry: 0.3 });
  sandals(p, 1.25, 2.6, { col: '#7A5434', strap: C.maroon, ry: -0.2 });

  // --- right wall: low cupboard (paper, pen tray, the cat), calendar, newspaper bundle, umbrella ---
  const CX = hw - 0.23, CZ = -1.2;
  const cq = p.at(CX, CZ, -Math.PI / 2); // front faces -X (into the room)
  cq.bm(-0.48, 0, -0.22, 0.48, 0.86, 0.22, C.wood);
  cq.bm(-0.5, 0.86, -0.24, 0.5, 0.9, 0.24, C.woodD);
  cq.bm(-0.46, 0.0, 0.2, 0.46, 0.08, 0.225, C.woodD);
  for (const sx of [-1, 1]) {
    cq.bm(sx * 0.02, 0.12, 0.22, sx * 0.44, 0.82, 0.235, jitter(C.woodL, 0.04, sx + 2));
    cq.bm(sx * 0.06, 0.16, 0.235, sx * 0.4, 0.78, 0.24, jitter(C.wood, 0.05, sx));
    cq.box(sx * 0.07, 0.5, 0.25, 0.03, 0.08, 0.02, C.gold);
  }
  paperStack(p, CX, 0.9, CZ - 0.25, { w: 0.3, d: 0.22, n: 7, ry: 0.1 });
  const tq = p.at(CX - 0.02, CZ + 0.12, 0, 0.9);
  tq.bm(-0.08, 0, -0.11, 0.08, 0.035, 0.11, C.woodD); // pen tray
  for (let i = 0; i < 3; i++) tq.box(-0.04 + i * 0.04, 0.045, 0, 0.012, 0.012, 0.19, [C.ink, C.maroon, C.goldD][i]);
  jarInto(p, CX + 0.02, 0.9, CZ + 0.33, { s: 0.6, full: true });
  cat(p, CX - 0.02, 0.9, CZ + 0.36 - 0.75, Math.PI / 2 + 0.3);
  solid(room, CX, CZ, 0.48, 0.98);
  framedSign(p, A, hw - 0.01, 1.7, CZ, 0.42, 0.52, (g, w, h) => drawCalendar(g, w, h, { seed: 8 }), { ry: -Math.PI / 2, frame: C.maroon, px: 200 });
  // newspaper bundle tied with string
  const nq = p.at(hw - 0.35, 0.55, 0.15);
  for (let i = 0; i < 8; i++) nq.box(0, 0.025 + i * 0.03, 0, 0.42, 0.028, 0.3, i % 2 ? C.news : C.newsL, 0, Math.sin(i * 1.9) * 0.06, 0);
  nq.box(0, 0.13, 0, 0.012, 0.27, 0.31, '#C9A576');
  nq.box(0, 0.13, 0, 0.43, 0.27, 0.012, '#C9A576');
  solid(room, hw - 0.35, 0.55, 0.45, 0.35);
  // umbrella leaning in the front corner
  const uq = p.at(hw - 0.2, 1.55, 0);
  uq.box(0, 0.42, 0, 0.13, 0.62, 0.13, '#3F3A5A', 0, 0, -0.12);
  uq.box(-0.05, 0.85, 0, 0.02, 0.25, 0.02, C.woodD, 0, 0, -0.12);
  uq.box(-0.09, 0.97, 0, 0.08, 0.025, 0.025, C.woodD, 0, 0, 0.4);

  // --- the letter table (folding), her chair pulled back, the customer's stool, woven floor mat ---
  const TX = 0.4, TZ = -1.4, TH = 0.72;
  // woven mat: blue and cream stripes
  for (let i = 0; i < 12; i++) d.bm(-0.55, 0, -2.75 + i * 0.22, 1.35, 0.012, -2.75 + (i + 1) * 0.22 - 0.01, i % 2 ? '#86AECB' : '#E9DFC9');
  d.bm(-0.6, 0, -2.8, 1.4, 0.008, -0.07, '#3F6684');
  const tbl = p.at(TX, TZ);
  tbl.bm(-0.5, TH - 0.04, -0.35, 0.5, TH, 0.35, C.woodL);
  tbl.bm(-0.52, TH - 0.06, -0.37, 0.52, TH - 0.04, 0.37, C.wood);
  for (const sx of [-1, 1]) {
    tbl.box(sx * 0.4, TH / 2 - 0.03, 0, 0.04, TH * 1.08, 0.04, C.woodD, 0.5, 0, 0); // folding X legs
    tbl.box(sx * 0.4, TH / 2 - 0.03, 0, 0.04, TH * 1.08, 0.04, C.woodD, -0.5, 0, 0);
    tbl.box(sx * 0.4, 0.02, 0, 0.05, 0.04, 0.66, C.woodD);
  }
  tbl.bm(-0.36, 0.34, -0.02, 0.36, 0.37, 0.02, C.woodD);
  tbl.bm(-0.3, TH, -0.24, 0.12, TH + 0.008, 0.2, '#4F7F63'); // green blotter
  paperStack(p, TX + 0.22, TH, TZ - 0.02, { w: 0.24, d: 0.17, n: 6, ry: -0.15, col: '#F4EEE0' }); // stack of letters
  for (let i = 0; i < 3; i++) p.box(TX + 0.32 + i * 0.02, TH + 0.008 + i * 0.006, TZ + 0.17 - i * 0.02, 0.2, 0.006, 0.12, ['#E3EEF6', '#F6F0E2', '#F2E2C8'][i], 0, 0.4 - i * 0.25, 0); // envelopes fanned
  jarInto(p, TX - 0.36, TH, TZ - 0.22, { s: 0.55, full: true }); // her own small ink pot
  p.box(TX - 0.28, TH + 0.1, TZ - 0.17, 0.008, 0.008, 0.2, C.ink, -0.9, 0.3, 0); // dip pen in it
  p.box(TX - 0.27, TH + 0.19, TZ - 0.24, 0.02, 0.03, 0.02, C.gold, -0.9, 0.3, 0);
  // the letter she is writing (on the blotter)
  const letterR = A.draw(150, 200, (g, w, h) => {
    paperBg(g, w, h, { bg: '#FBF7EE', edge: '#D9CDB4', seed: 6 });
    g.fillStyle = 'rgba(120,150,190,0.45)';
    for (let y = 26; y < h - 10; y += 15) g.fillRect(10, y, w - 20, 1.5);
    for (let k = 0; k < 9; k++) scrawl(g, 14, 22 + k * 15, (w - 30) * (k === 8 ? 0.45 : 0.95), { color: '#2E3D63', lw: 2.2, seed: k + 3, amp: 3 });
  });
  A.quad(letterR, 0.26, 0.34, M(TX - 0.08, TH + 0.012, TZ - 0.02, -Math.PI / 2, 0, 0.12));
  // table lamp
  const lq = p.at(TX + 0.4, TZ - 0.27, 0, TH); // back right corner, clear of her face
  lq.pr(0, 0.02, 0, 0.07, 0.08, 0.04, C.bronze, 8);
  lq.pr(0, 0.08, 0, 0.06, 0.05, 0.08, C.gold, 8);
  lq.pr(0, 0.22, 0, 0.04, 0.055, 0.16, '#F3E7C8', 8);
  lq.pr(0, 0.305, 0, 0.045, 0.045, 0.012, C.bronze, 8);
  solid(room, TX, TZ, 1.04, 0.74);
  // her folding chair, pulled back (she stood up to greet you)
  const ch = p.at(TX + 0.05, -2.4, 0.18);
  ch.bm(-0.21, 0.42, -0.2, 0.21, 0.46, 0.2, C.woodL);
  ch.bm(-0.21, 0.6, -0.24, 0.21, 0.9, -0.2, C.woodL);
  for (let i = 0; i < 3; i++) ch.bm(-0.18, 0.64 + i * 0.08, -0.205, 0.18, 0.66 + i * 0.08, -0.195, C.wood);
  for (const sx of [-1, 1]) {
    ch.box(sx * 0.19, 0.44, -0.02, 0.035, 0.9, 0.035, C.woodD, 0.42, 0, 0);
    ch.box(sx * 0.19, 0.22, 0.0, 0.035, 0.5, 0.035, C.woodD, -0.5, 0, 0);
  }
  ch.bm(-0.2, 0.46, -0.18, 0.2, 0.5, 0.1, '#86AECB'); // a cushion
  solid(room, TX + 0.05, -2.4, 0.46, 0.46);
  // the customer's tea stool at the table's right end (Maya sits here for the talk, side-on to the
  // camera so both faces read), her mug on the table corner
  const MS = { x: TX + 0.8, z: -1.32 };
  stool(p, MS.x + 0.12, MS.z, C.woodL, 0.3);
  cup(p, TX + 0.4, TH, TZ + 0.22, { col: '#E9DFC9', tea: '#B9864E', saucer: false });
  // basket on the floor (the jars go into it): wide enough that the corks and gold lips show
  const BK = { x: 1.6, z: -2.3, r: 0.27 };
  basketInto(p, BK.x, BK.z, { r: BK.r, h: 0.28 });
  solid(room, BK.x, BK.z, BK.r * 2 + 0.04, BK.r * 2 + 0.04);

  // --- front half: the drying rack (today's letters pegged up while the ink dries: the letter
  //     line people see from the door), a kilim runner from the door, a floor cushion, a tray ---
  const RK = { x: -0.95, z: 0.62, len: 1.15, h: 1.05 };
  const rk = p.at(RK.x, RK.z);
  for (const sx of [-1, 1]) {
    const e = rk.at(sx * RK.len / 2, 0);
    e.box(0, RK.h / 2, -0.12, 0.04, RK.h + 0.04, 0.04, C.woodD, 0.22, 0, 0); // A-frame legs
    e.box(0, RK.h / 2, 0.12, 0.04, RK.h + 0.04, 0.04, C.woodD, -0.22, 0, 0);
    e.box(0, 0.3, 0, 0.035, 0.035, 0.22, C.wood);
    e.box(0, RK.h + 0.01, 0, 0.06, 0.05, 0.08, C.woodD);
  }
  rk.bm(-RK.len / 2, RK.h - 0.015, -0.015, RK.len / 2, RK.h + 0.015, 0.015, C.woodL); // top rail
  rk.bm(-RK.len / 2, 0.3 - 0.012, 0.04, RK.len / 2, 0.3 + 0.012, 0.064, C.woodL); // low rail
  const lettersR = [0, 1, 2, 3].map((k) => A.draw(120, 150, (g, w, h) => {
    paperBg(g, w, h, { bg: k % 2 ? '#FBF7EE' : '#F2F6F8', edge: '#D9CDB4', seed: 20 + k });
    for (let r = 0; r < 7; r++) scrawl(g, 12, 22 + r * 17, (w - 26) * (r === 6 ? 0.5 : 0.95), { color: k === 2 ? '#6E1F2A' : '#2E3D63', lw: 2.6, seed: k * 9 + r, amp: 3 });
    if (k === 1) disc(g, w * 0.78, h * 0.86, 8, 'rgba(201,162,74,0.9)'); // a gold-ink signature dot
  }));
  const RL = [-0.44, -0.15, 0.14, 0.43];
  RL.forEach((lx, k) => {
    const tilt = Math.sin(k * 2.3) * 0.06;
    A.quad(lettersR[k], 0.24, 0.3, rk.base.clone().multiply(M(lx, RK.h - 0.17, 0.022, 0, 0, tilt)));
    rk.box(lx, RK.h - 0.005, 0.02, 0.03, 0.06, 0.03, k % 2 ? C.woodL : C.gold); // pegs
  });
  // a folded letter slipped off the rack onto the floor, and a cloth on the low rail
  p.box(RK.x + 0.32, 0.006, RK.z + 0.38, 0.22, 0.008, 0.15, '#F6F0E2', 0, 0.5, 0);
  rk.bm(-0.5, 0.18, 0.05, -0.2, 0.31, 0.065, '#86AECB');
  solid(room, RK.x, RK.z, RK.len + 0.08, 0.36);
  // kilim runner from the door to the table (muted sand field, maroon border, small lozenges):
  // breaks up the plank seams without shouting
  d.bm(-0.22, 0, 0.0, 0.62, 0.008, 2.45, '#7A3A34');
  d.bm(-0.16, 0, 0.06, 0.56, 0.011, 2.39, '#D8BE92');
  for (const zz of [0.14, 2.27]) d.bm(-0.16, 0.011, zz, 0.56, 0.013, zz + 0.04, '#EFE4CC');
  for (let i = 0; i < 7; i++) {
    const zc = 0.42 + i * 0.3;
    d.box(0.2, 0.012, zc, 0.13, 0.003, 0.13, i % 2 ? '#3F6684' : '#8E2F3C', 0, Math.PI / 4, 0);
    d.box(0.2, 0.014, zc, 0.05, 0.003, 0.05, '#F4D27A', 0, Math.PI / 4, 0);
    for (const sx of [-1, 1]) d.box(0.2 + sx * 0.26, 0.012, zc, 0.06, 0.003, 0.06, '#9C6A4A', 0, Math.PI / 4, 0);
  }
  // a low tray with a teapot by the cushion (lived-in)
  const ty = p.at(-1.05, -0.05, 0.3);
  ty.bm(-0.2, 0, -0.14, 0.2, 0.03, 0.14, C.maroon);
  ty.bm(-0.2, 0.03, -0.14, 0.2, 0.05, -0.12, C.maroonD);
  teapot(ty, -0.06, 0.03, 0.0, { col: '#3E7C66', s: 0.9 });
  cup(ty, 0.1, 0.03, 0.04, { saucer: false });

  // --- instanced ink jars: 12 on the shelf + 8 in the basket (7 round the rim, 1 in the middle,
  //     standing high enough that the corks and gold lips show over the weave) ---
  const jars = instanced(room.group, jarGeometry({ full: true }), 20);
  const shelfJar = (i) => [0.9 + (i - 5.5) * 0.172, SH.y, ZB + 0.13];
  for (let i = 0; i < 12; i++) { const [x, y, z] = shelfJar(i); jars.set(i, x, y, z, Math.sin(i * 1.3) * 0.25, 0.95 + (i % 3) * 0.04); }
  for (let i = 0; i < 8; i++) {
    const a = (i / 7) * TAU + 0.3;
    const r = i === 7 ? 0 : 0.165;
    jars.set(12 + i, BK.x + Math.sin(a) * r, i === 7 ? 0.2 : 0.15, BK.z + Math.cos(a) * r, a, 0.88);
    jars.show(12 + i, false);
  }
  function setJars(n) { for (let i = 0; i < 12; i++) jars.show(i, i < n); }
  /** n jars carried into the basket (0..11): 8 visible slots fill up in step */
  function setBasket(n) { const k = n <= 0 ? 0 : Math.min(8, Math.ceil((n * 8) / 11)); for (let i = 0; i < 8; i++) jars.show(12 + i, i < k); }
  setJars(opts.jars ?? 12);
  setBasket(opts.basket ?? 0);

  const life = createLife(room, {
    windows: [WIN],
    lamps: [
      { x: TX + 0.4, y: TH + 0.2, z: TZ - 0.27, cw: 0.045, ch: 0.08, r: 1.4, px: TX + 0.2, pz: TZ + 0.15 },
      { x: -hw + 0.19, y: 2.1, z: -0.75, cw: 0.045, ch: 0.08, r: 1.1, px: -hw + 0.8, pz: -0.75 },
    ],
    shaft: { dx: 0.45, len: 2.2 },
  });

  // spots: h = heading (0 faces the camera); `look` = where the head turns (people.lookAt)
  const spots = {
    thida: { x: TX - 0.05, z: -1.97, h: 0.35, look: { x: MS.x, z: MS.z } }, // at her table, turned to her customer
    thidaShelf: { x: 0.9, z: -2.45, h: Math.PI }, // facing the jar shelf (lifting the jars)
    thidaBasket: { x: 1.1, z: -1.9, h: 2.3, look: { x: BK.x, z: BK.z } },
    maya: { x: MS.x, z: MS.z, h: -0.6, seat: 0.3, look: { x: TX - 0.05, z: -1.97 } }, // the customer's stool, 3/4 to the camera
    mayaStand: { x: 0.25, z: 0.5, h: Math.PI },
    moemoe: { x: -0.25, z: 1.55, h: 0.55 }, // in from the door with her empty pot, turned to the room
    moemoeDoor: { x: -0.9, z: 1.9, h: Math.PI }, // just inside the door, facing in (arrival)
    door: { x: 0, z: hd - 0.5, h: Math.PI },
  };
  const stations = [
    station('thida', TX + 0.75, -0.8, [TX, -2.0], { r: 0.9, labelY: 1.7 }),
    station('jars', 0.9, -2.2, [0.9, ZB + 0.13], { r: 0.8, labelY: 1.5 }),
    station('letterLine', -1.7, -0.9, [-hw + 0.1, -0.9], { r: 0.9, labelY: 1.8 }),
    station('dryingRack', RK.x, RK.z + 0.6, [RK.x, RK.z], { r: 0.7, labelY: 1.3 }),
    station('basket', 1.15, -1.7, [BK.x, BK.z], { r: 0.6, labelY: 0.6 }),
  ];
  return finish(room, v, A, life, {
    id: 'letterroom',
    name: { my: 'မသီတာရဲ့ စာရေးခန်း', en: "Ma Thida's letter room" },
    spots,
    stations,
    cast: [{ id: 'thida', spot: 'thida' }, { id: 'moemoe', spot: 'moemoe', when: 'd8.wellSeen' }],
    decals: dv,
    cam: { tilt: 54, width: 5.3, lookZ: -0.35 },
    handles: { setJars, setBasket },
    extraDispose: [() => jars.dispose()],
  });
}

// =============================================================================================
// junctiontea · Daw Sein's tea shop · 7 x 8 · day8-spec 15.2 (INDEX 13.2: the tea rooms share a
// builder in the plan; this file keeps the Junction one self-contained)
// =============================================================================================
/** a small handbill / sheet face for the atlas */
function drawHandbill(g, w, h, { seed = 4 } = {}) {
  paperBg(g, w, h, { bg: '#EEE8DA', edge: '#B9B09C', seed });
  g.fillStyle = C.ink;
  g.fillRect(w * 0.06, h * 0.05, w * 0.88, h * 0.035);
  text(g, 'ရွှေမင်တွင်း', w / 2, h * 0.19, { size: h * 0.105, color: '#2A2118', max: w * 0.9 });
  text(g, 'ခန်းတော့မယ်!', w / 2, h * 0.33, { size: h * 0.1, color: '#8E2F2B', max: w * 0.9 });
  g.fillRect(w * 0.06, h * 0.42, w * 0.88, h * 0.012);
  printLines(g, w * 0.08, h * 0.47, w * 0.84, h * 0.33, { cols: 2, gap: h * 0.035, lw: Math.max(2, h * 0.012), seed });
  text(g, 'The gold-ink well is drying up!', w / 2, h * 0.88, { size: h * 0.045, family: FONT_SERIF, weight: 600, color: '#5A4A3A', max: w * 0.9 });
}
function drawCorrection(g, w, h) {
  paperBg(g, w, h, { bg: '#FBF7EE', edge: '#C9A24A', seed: 9 });
  g.fillStyle = C.gold;
  g.fillRect(w * 0.06, h * 0.05, w * 0.88, h * 0.03);
  text(g, 'ပြင်ဆင်ချက်', w / 2, h * 0.17, { size: h * 0.1, color: '#8E2F2B', max: w * 0.9 });
  text(g, 'တံတားထိပ် စာတိုက်ပုံး', w / 2, h * 0.34, { size: h * 0.07, max: w * 0.9 });
  text(g, 'မနက် 6:00 မှာ ထုတ်သည်။', w / 2, h * 0.47, { size: h * 0.07, max: w * 0.9 });
  printLines(g, w * 0.1, h * 0.58, w * 0.8, h * 0.2, { cols: 1, gap: h * 0.04, lw: Math.max(2, h * 0.012), seed: 12 });
  text(g, 'Correction: the bridge-box is cleared at 6:00 a.m.', w / 2, h * 0.88, { size: h * 0.04, family: FONT_SERIF, weight: 600, color: '#5A4A3A', max: w * 0.92 });
}
/** a tin (condensed milk, tea leaves) */
function tin(p, x, y, z, { col = C.red, label = C.white, r = 0.045, h = 0.1 } = {}) {
  p.pr(x, y + h / 2, z, r, r, h, C.steel, 8);
  p.pr(x, y + h / 2, z, r + 0.002, r + 0.002, h * 0.6, col, 8);
  p.box(x, y + h / 2, z + r * 0.95, r * 1.1, h * 0.22, 0.006, label);
}
/** glass jar of biscuits / tea leaves (pale glass, contents a block inside) */
function glassJar(p, x, y, z, { fill = '#D9A35A', h = 0.22, r = 0.08 } = {}) {
  p.pr(x, y + h * 0.4, z, r * 0.85, r * 0.85, h * 0.75, fill, 8);
  p.pr(x, y + h * 0.45, z, r, r, h * 0.9, '#DCEAF0', 8);
  p.pr(x, y + h * 0.95, z, r * 0.8, r * 0.8, h * 0.1, C.red, 8);
}
/** the three samosa / cake trays in the snack cabinet */
function snacks(p, x0, x1, y, z, kind, seed = 1) {
  for (let x = x0, i = 0; x < x1; x += 0.09, i++) {
    const s = 1 + Math.sin(seed * 3 + i) * 0.1;
    if (kind === 'samosa') p.box(x, y + 0.025, z + Math.sin(i * 2.3) * 0.04, 0.07 * s, 0.045, 0.07 * s, i % 2 ? '#D9A040' : '#C98B34', 0, 0.78 + i * 0.3, 0);
    else if (kind === 'cake') p.pr(x, y + 0.025, z + Math.sin(i * 1.7) * 0.03, 0.04 * s, 0.04 * s, 0.05, i % 2 ? '#E8C27A' : '#E2B061', 8);
    else p.box(x, y + 0.02, z, 0.18, 0.035, 0.035, '#D59A45', 0, 0.3 * Math.sin(i * 3.1), 0); // fried dough sticks
  }
}

async function buildJunctiontea(opts = {}) {
  await fontsReady();
  const W = 7, D = 8, hw = W / 2, hd = D / 2;
  const WIN = { x: -1.8, y: 1.8, w: 1.2, h: 0.9 };
  const room = kit.createRoom({ width: W, depth: D, height: 3, wall: '#F1E6CC', wainscot: '#C99A3A', trim: C.goldD, floor: 'tiles', floorColor: '#C9B79A', floorColor2: '#E8DCC4', background: '#E9DCC2', windows: [WIN] });
  const v = new VoxelBuilder();
  const p = new Pen(v);
  const dv = new VoxelBuilder();
  const d = new Pen(dv);
  const A = makeAtlas(1024);
  const ZB = -hd;
  dressWalls(d, room, { stripe: null, stile: '#A87E2C', panel: 0.7 });
  // a painted band above the wainscot (tea-shop green), and a tiled splash behind the counter
  d.bm(-hw, 1.06, ZB, hw, 1.16, ZB + 0.006, '#3F7C66');
  for (const sx of [-1, 1]) d.bm(sx * hw - (sx > 0 ? 0.006 : 0), 1.06, ZB, sx * hw + (sx < 0 ? 0.006 : 0), 1.16, -0.4, '#3F7C66');
  for (let x = 0.3, i = 0; x < 3.3; x += 0.2, i++) for (let y = 1.2, j = 0; y < 1.42; y += 0.2, j++) d.bm(x, y, ZB, x + 0.19, y + 0.19, ZB + 0.008, (i + j) % 2 ? '#F4EFE4' : '#DCE6E0');

  // --- back wall: window with a café half-curtain, laundry seen outside ---
  windowQuad(A, room, WIN, {
    seed: 7,
    extra(g, w, h) {
      g.strokeStyle = '#6E5A44'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, h * 0.42); g.quadraticCurveTo(w / 2, h * 0.5, w, h * 0.4); g.stroke();
      const cl = ['#C8323C', '#5F8DB0', '#F4EFE4', '#D9A93B', '#6B3E64'];
      for (let i = 0; i < 5; i++) { g.fillStyle = cl[i]; g.fillRect(w * (0.08 + i * 0.18), h * (0.44 + Math.sin(i) * 0.02), w * 0.11, h * (0.14 + (i % 2) * 0.06)); }
    },
  });
  p.bm(WIN.x - 0.7, 1.78, ZB + 0.03, WIN.x + 0.7, 1.8, ZB + 0.12, C.bronze);
  for (let i = 0; i < 14; i++) p.bm(WIN.x - 0.62 + i * 0.0886, 1.33, ZB + 0.1 + (i % 2) * 0.015, WIN.x - 0.62 + (i + 1) * 0.0886, 1.79, ZB + 0.12 + (i % 2) * 0.015, (i >> 1) % 2 ? '#E9DFC9' : '#B8423C');
  plantPot(p, WIN.x + 0.42, 1.27, ZB + 0.14, { s: 0.8, flowers: false });
  tin(p, WIN.x - 0.4, 1.27, ZB + 0.14, { col: '#3F7C66' });

  // --- the handbill on the wall (x -0.4) and the correction that later goes over it ---
  const hb = A.draw(240, 330, (g, w, h) => drawHandbill(g, w, h));
  A.quad(hb, 0.56, 0.77, M(-0.4, 1.9, ZB + 0.02, 0, 0, 0.02));
  for (const [tx, ty] of [[-0.66, 2.26], [-0.14, 2.27], [-0.4, 1.53]]) p.box(tx, ty, ZB + 0.03, 0.03, 0.03, 0.02, C.red);
  const corrQuads = [];
  const cr = A.draw(240, 330, (g, w, h) => drawCorrection(g, w, h));
  A.quad(cr, 0.5, 0.68, M(-0.32, 1.86, ZB + 0.035, 0, 0, -0.04), corrQuads);

  // --- shelves behind the counter: tins, jars, stacked cups, the radio; clock and calendar ---
  wallShelf(p, 0.45, 3.35, 1.6, ZB, { d: 0.26 });
  wallShelf(p, 0.45, 3.35, 2.14, ZB, { d: 0.26 });
  for (let i = 0; i < 6; i++) tin(p, 0.6 + i * 0.13, 1.6, ZB + 0.13, { col: i % 2 ? C.red : '#2F5DB3' });
  glassJar(p, 1.5, 1.6, ZB + 0.13, { fill: '#5E4A2E' });
  glassJar(p, 1.72, 1.6, ZB + 0.13, { fill: '#D9A35A' });
  glassJar(p, 1.94, 1.6, ZB + 0.13, { fill: '#E8C27A', h: 0.18 });
  const rq = p.at(2.5, ZB + 0.13, 0, 1.6); // radio
  rq.bm(-0.22, 0, -0.08, 0.22, 0.2, 0.08, '#6E1F2A');
  rq.bm(-0.2, 0.03, 0.08, 0.02, 0.17, 0.086, '#D9C9A6');
  for (let i = 0; i < 5; i++) rq.bm(-0.19, 0.045 + i * 0.026, 0.086, 0.01, 0.052 + i * 0.026, 0.09, '#8E7E62');
  rq.box(0.11, 0.13, 0.085, 0.06, 0.05, 0.01, C.gold);
  rq.box(0.11, 0.06, 0.085, 0.035, 0.035, 0.014, C.ink);
  rq.box(0.16, 0.34, -0.03, 0.006, 0.3, 0.006, C.steel, 0, 0, -0.5);
  for (let s = 0; s < 3; s++) for (let i = 0; i < 4 - s; i++) cup(p, 0.75 + i * 0.1 + s * 0.05, 2.14 + s * 0.055, ZB + 0.13, { tea: null, saucer: false }); // pyramid of cups
  for (let i = 0; i < 5; i++) p.pr(1.45 + i * 0.012, 2.15 + i * 0.012, ZB + 0.13, 0.08, 0.075, 0.012, i % 2 ? C.cream : C.white, 8); // saucers
  bookRow(p, 1.8, 2.4, 2.14, ZB + 0.13, { seed: 6, d: 0.14, hMax: 0.2 }); // account books
  tin(p, 2.6, 2.14, ZB + 0.13, { col: '#D9A93B', r: 0.06, h: 0.15 });
  tin(p, 2.8, 2.14, ZB + 0.13, { col: '#D9A93B', r: 0.06, h: 0.15 });
  plantPot(p, 3.1, 2.14, ZB + 0.13, { s: 0.7, flowers: false });
  clockFrame(p, -3.0, 2.45, ZB + 0.04, 0.18);
  A.quad(A.draw(96, 96, (g, w, h) => drawClock(g, w, h, 4, 12)), 0.3, 0.3, M(-3.0, 2.45, ZB + 0.068));
  framedSign(p, A, -2.95, 1.75, ZB + 0.02, 0.42, 0.52, (g, w, h) => drawCalendar(g, w, h, { seed: 4 }), { frame: C.maroon, px: 200 });

  // --- the tea counter (1.6, -2.9): open front shelf with the hoard on the left, panels right ---
  const CT = { x0: 0.3, x1: 2.25, z0: -3.2, z1: -2.6, h: 0.8 };
  const cq = p;
  cq.bm(CT.x0, 0, CT.z0, CT.x1, CT.h - 0.06, CT.z0 + 0.06, C.woodD); // back panel
  cq.bm(CT.x0 - 0.04, CT.h - 0.06, CT.z0 - 0.04, CT.x1 + 0.04, CT.h, CT.z1 + 0.05, C.woodL); // top
  cq.bm(CT.x0 - 0.04, CT.h - 0.075, CT.z1 + 0.02, CT.x1 + 0.04, CT.h - 0.05, CT.z1 + 0.06, C.steel); // tin edge
  for (const x of [CT.x0, 1.3, CT.x1 - 0.06]) cq.bm(x, 0, CT.z0, x + 0.06, CT.h - 0.06, CT.z1, C.wood); // uprights
  cq.bm(CT.x0, 0, CT.z0, CT.x1, 0.07, CT.z1, C.woodD); // plinth
  cq.bm(CT.x0 + 0.06, 0.38, CT.z0 + 0.06, 1.3, 0.42, CT.z1, C.wood); // the open shelf
  cq.bm(CT.x0 + 0.06, 0.07, CT.z0 + 0.06, 1.3, 0.1, CT.z1, jitter(C.wood, -0.1, 3));
  for (let i = 0; i < 3; i++) cq.bm(1.38 + i * 0.27, 0.12, CT.z1 - 0.01, 1.6 + i * 0.27, 0.68, CT.z1 + 0.01, i % 2 ? '#E9DFC9' : '#DCCDA8'); // panels
  for (let i = 0; i < 3; i++) cq.box(1.49 + i * 0.27, 0.4, CT.z1 + 0.02, 0.1, 0.1, 0.01, '#3F7C66');
  solid(room, (CT.x0 + 2.95) / 2, (CT.z0 + CT.z1) / 2, 2.95 - CT.x0, CT.z1 - CT.z0);
  // stove end: brick platform, clay brazier, coals, the big kettle (steam)
  const SX = 2.6, SZ = -2.9;
  p.bm(2.27, 0, -3.2, 2.95, 0.58, -2.6, '#A0503A');
  for (let y = 0.1, r = 0; y < 0.54; y += 0.14, r++) for (let x = 2.27 + (r % 2) * 0.1; x < 2.93; x += 0.22) d.bm(x, y, -2.599, x + 0.2, y + 0.11, -2.594, '#B5643C');
  p.bm(2.24, 0.58, -3.23, 2.98, 0.62, -2.57, '#7E3C2B');
  p.pr(SX, 0.72, SZ, 0.19, 0.15, 0.2, C.terra, 8); // brazier
  p.pr(SX, 0.83, SZ, 0.2, 0.2, 0.03, C.terraD, 8);
  p.box(SX, 0.68, SZ + 0.16, 0.12, 0.08, 0.04, C.coal); // draught hole
  p.pr(SX, 0.85, SZ, 0.17, 0.17, 0.01, C.coal, 8);
  const kq = p.at(SX, SZ, -0.3, 0.87); // kettle
  kq.pr(0, 0.11, 0, 0.17, 0.19, 0.2, '#8E9497', 10);
  kq.pr(0, 0.23, 0, 0.11, 0.17, 0.05, '#A2A9AC', 10);
  kq.pr(0, 0.27, 0, 0.05, 0.05, 0.03, C.ironD, 8);
  kq.box(0.22, 0.17, 0, 0.16, 0.035, 0.04, '#8E9497', 0, 0, 0.7);
  for (const sx of [-1, 1]) kq.box(sx * 0.12, 0.33, 0, 0.025, 0.14, 0.025, C.ironD, 0, 0, -sx * 0.4);
  kq.box(0, 0.39, 0, 0.18, 0.025, 0.025, C.ironD);
  for (let i = 0; i < 4; i++) d.bm(SX - 0.16 + i * 0.02, 0.88 + i * 0.05, SZ + 0.165, SX - 0.15 + i * 0.02 + 0.06, 0.9 + i * 0.05, SZ + 0.17, '#6E7477'); // soot streaks
  // glass snack cabinet on the counter (1.0)
  const gq = p.at(0.82, -2.92, 0, CT.h);
  gq.bm(-0.3, 0, -0.2, 0.3, 0.04, 0.2, '#B8423C');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) gq.box(sx * 0.28, 0.2, sz * 0.18, 0.03, 0.4, 0.03, '#B8423C');
  gq.bm(-0.31, 0.39, -0.21, 0.31, 0.42, 0.21, '#B8423C');
  gq.bm(-0.27, 0.2, -0.17, 0.27, 0.22, 0.17, '#DCEAF0');
  snacks(gq, -0.23, 0.25, 0.04, 0, 'samosa', 1);
  snacks(gq, -0.23, 0.25, 0.22, -0.04, 'cake', 2);
  snacks(gq, -0.16, 0.18, 0.22, 0.08, 'stick', 3);
  for (const sx of [-1, 1]) gq.bm(sx * 0.27 - 0.003, 0.05, -0.17, sx * 0.27 + 0.003, 0.38, 0.17, '#E6F0F2'); // side glass
  // on the counter: cup tray, milk tins, sugar jar, the cloth tea strainer over the pour pot, her towel
  for (let i = 0; i < 3; i++) cup(p, 1.48 + i * 0.12, CT.h, -2.78, { tea: '#C99A6A' });
  p.bm(1.4, CT.h, -2.88, 1.84, CT.h + 0.012, -2.68, C.steel);
  tin(p, 1.95, CT.h, -3.05, { col: '#2F5DB3' });
  tin(p, 2.06, CT.h, -2.98, { col: '#2F5DB3' });
  glassJar(p, 0.48, CT.h, -3.02, { fill: '#F4EFE4', h: 0.16, r: 0.06 });
  const pq = p.at(2.05, -2.75, 0, CT.h); // pour pot + strainer stand
  pq.pr(0, 0.07, 0, 0.08, 0.07, 0.14, '#8E9497', 10);
  pq.box(0.1, 0.1, 0, 0.06, 0.02, 0.02, '#8E9497', 0, 0, 0.5);
  pq.box(-0.09, 0.3, 0, 0.015, 0.45, 0.015, C.ironD);
  pq.box(-0.04, 0.52, 0, 0.11, 0.015, 0.015, C.ironD);
  pq.box(0.0, 0.42, 0, 0.07, 0.17, 0.07, '#D9C49A');
  p.bm(0.36, CT.h, -2.75, 0.7, CT.h + 0.03, -2.62, '#F4EFE4'); // folded towel
  // behind the counter: a crate of cups, a low stool, a charcoal sack
  p.bm(0.5, 0, -3.85, 1.0, 0.3, -3.45, C.wood);
  for (let i = 0; i < 4; i++) cup(p, 0.6 + (i % 2) * 0.22, 0.3, -3.75 + Math.floor(i / 2) * 0.18, { tea: null, saucer: false });
  p.bm(2.5, 0, -3.9, 2.95, 0.42, -3.45, '#8E7E62');
  p.bm(2.52, 0.42, -3.88, 2.93, 0.46, -3.47, C.coal);

  // --- Daw Sein's hoard: nine ink jars on the counter's open shelf (instanced: setHoard) ---
  // a touch larger than the letter-room jars, gold-ink labels so the nine read as nine at phone size
  const hoard = instanced(room.group, jarGeometry({ full: true, glaze: '#2E4558', label: '#F4D27A', band: C.maroonD }), 9);
  for (let i = 0; i < 5; i++) hoard.set(i, 0.455 + i * 0.187, 0.1, -2.8, Math.sin(i * 2.1) * 0.12, 1.12);
  for (let i = 0; i < 4; i++) hoard.set(5 + i, 0.55 + i * 0.187, 0.42, -2.82, Math.sin(i * 1.7) * 0.12, 1.12);
  const setHoard = (n) => { for (let i = 0; i < 9; i++) hoard.show(i, i < n); };

  // --- left wall: cup rack (z -2.6, y 1.5), oil lamp; water pot by the door ---
  const lq = p.at(-hw + 0.02, -2.6, Math.PI / 2);
  lq.bm(-0.6, 1.2, 0, 0.6, 1.24, 0.22, C.wood);
  lq.bm(-0.6, 1.62, 0, 0.6, 1.66, 0.22, C.wood);
  lq.bm(-0.62, 1.15, 0, -0.58, 1.95, 0.24, C.woodD);
  lq.bm(0.58, 1.15, 0, 0.62, 1.95, 0.24, C.woodD);
  for (let i = 0; i < 8; i++) lq.pr(-0.5 + i * 0.14, 1.27, 0.11, 0.035, 0.028, 0.05, i % 3 ? C.white : '#E3EEF6', 8);
  for (let i = 0; i < 6; i++) lq.pr(-0.45 + i * 0.18, 1.7, 0.11, 0.06, 0.06, 0.1, i % 2 ? '#3E7C66' : '#E9DFC9', 8);
  oilLamp(p, -hw + 0.19, 2.1, -0.9, { ry: Math.PI / 2 });
  waterPot(p, -3.0, 2.9);
  solid(room, -3.0, 2.9, 0.46, 0.46);
  broom(p, -3.3, 1.9, { ry: Math.PI / 2 });

  // --- right wall: the menu board, an oil lamp, a nested tower of plastic stools ---
  framedSign(p, A, hw - 0.01, 1.85, -1.6, 0.9, 0.62, (g, w, h) => {
    g.fillStyle = '#2F3A33'; g.fillRect(0, 0, w, h);
    text(g, 'လက်ဖက်ရည် ဆိုင်', w / 2, h * 0.16, { size: h * 0.13, color: '#F4D27A', max: w * 0.9 });
    const items = [['လက်ဖက်ရည်', 'tea'], ['ကော်ဖီ', 'coffee'], ['ပလာတာ', 'paratha'], ['စမူဆာ', 'samosa']];
    items.forEach(([my, en], i) => {
      text(g, my, w * 0.38, h * (0.36 + i * 0.16), { size: h * 0.09, color: '#F4EFE4', weight: 400 });
      text(g, en, w * 0.78, h * (0.36 + i * 0.16), { size: h * 0.07, color: '#C9C2B2', family: FONT_SERIF, weight: 600 });
    });
  }, { ry: -Math.PI / 2, frame: C.woodD, px: 320 });
  oilLamp(p, hw - 0.19, 2.15, -2.6, { ry: -Math.PI / 2 });
  for (let i = 0; i < 6; i++) {
    const sq = p.at(3.05, 2.85, 0, i * 0.06);
    const c = STOOLS[i % STOOLS.length];
    sq.bm(-0.14, 0.215, -0.14, 0.14, 0.25, 0.14, c);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) sq.box(sx * 0.115, 0.16, sz * 0.115, 0.035, 0.1, 0.035, jitter(c, 0.1, sx));
  }
  solid(room, 3.05, 2.85, 0.32, 0.32);
  // a strip of snack packets hanging on the right wall; the shop's name board over the shelves
  const sp = p.at(hw - 0.03, 0.55, -Math.PI / 2);
  sp.bm(-0.012, 0.9, -0.01, 0.012, 1.62, 0.01, '#C9A576');
  for (let i = 0; i < 6; i++) sp.box(0, 1.55 - i * 0.11, 0.02, 0.15, 0.1, 0.02, ['#C8323C', '#D9A93B', '#2F5DB3', '#3E7C66', '#E06A3A', '#6B3E64'][i], 0, 0, Math.sin(i * 2.2) * 0.12);
  framedSign(p, A, 1.9, 2.6, ZB + 0.02, 2.0, 0.42, (g, w, h) => {
    g.fillStyle = '#3E7C66'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#F4D27A'; g.lineWidth = 4; g.strokeRect(8, 8, w - 16, h - 16);
    text(g, 'ဒေါ်စိန် လက်ဖက်ရည်', w * 0.5, h * 0.42, { size: h * 0.42, color: '#FBF3DF', max: w * 0.8 });
    text(g, "Daw Sein's tea", w * 0.5, h * 0.82, { size: h * 0.18, family: FONT_SERIF, weight: 600, color: '#F4D27A' });
    for (const cx of [w * 0.07, w * 0.93]) { disc(g, cx, h * 0.5, h * 0.22, '#FBF3DF'); disc(g, cx, h * 0.5, h * 0.15, '#B9864E'); }
  }, { frame: C.woodD, px: 600 });
  kitPlant(room, -1.5, 3.35, 0.75);
  kitPlant(room, 1.5, 3.35, 0.75);

  // --- back wall left of the counter: a wall bench under the window with a cloth bag and a
  //     folded paper, a painted river scene above the window, small notes round the handbill,
  //     a hand of bananas hung by the counter end ---
  bench(p, -2.05, -3.72, { len: 1.9, h: 0.4, d: 0.3, top: C.woodL });
  solid(room, -2.05, -3.72, 1.9, 0.3);
  const bagQ = p.at(-2.6, -3.72, 0.2, 0.4); // a cloth shopping bag left on the bench
  bagQ.bm(-0.14, 0, -0.08, 0.14, 0.24, 0.08, '#B8423C');
  bagQ.bm(-0.14, 0.08, 0.08, 0.14, 0.12, 0.085, '#F4D27A');
  bagQ.box(0, 0.3, 0, 0.18, 0.025, 0.025, '#8E2F2B');
  paperStack(p, -1.5, 0.4, -3.72, { w: 0.3, d: 0.22, n: 3, ry: 0.25, col: '#EEE8DA' });
  cup(p, -1.2, 0.4, -3.7, { saucer: true });
  framedSign(p, A, -1.8, 2.6, ZB + 0.02, 0.86, 0.36, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#F6DDB0'); grd.addColorStop(0.55, '#F2C98A'); grd.addColorStop(0.56, '#6E9AB5'); grd.addColorStop(1, '#4F7F9E');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    disc(g, w * 0.78, h * 0.32, h * 0.12, '#FBEFD2');
    g.fillStyle = '#5A6E3A'; g.fillRect(0, h * 0.46, w * 0.3, h * 0.1); g.fillRect(w * 0.62, h * 0.48, w * 0.38, h * 0.08); // far banks
    g.fillStyle = '#6E4A2E'; g.beginPath(); g.moveTo(w * 0.3, h * 0.7); g.lineTo(w * 0.62, h * 0.7); g.lineTo(w * 0.57, h * 0.8); g.lineTo(w * 0.35, h * 0.8); g.fill(); // a boat
    g.fillStyle = '#F4EFE4'; g.fillRect(w * 0.44, h * 0.42, 4, h * 0.28); g.beginPath(); g.moveTo(w * 0.45, h * 0.42); g.lineTo(w * 0.56, h * 0.64); g.lineTo(w * 0.45, h * 0.64); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(w * (0.05 + i * 0.16), h * 0.88); g.lineTo(w * (0.12 + i * 0.16), h * 0.88); g.stroke(); }
  }, { frame: C.goldD, px: 300 });
  const noteR = [0, 1].map((k) => A.draw(70, 90, (g, w, h) => { paperBg(g, w, h, { bg: k ? '#F2E6C8' : '#E8EEF0', seed: 30 + k }); printLines(g, 8, 14, w - 16, h - 24, { cols: 1, gap: 9, lw: 2, seed: k + 5 }); }));
  A.quad(noteR[0], 0.2, 0.26, M(-0.9, 1.62, ZB + 0.02, 0, 0, -0.08));
  A.quad(noteR[1], 0.18, 0.23, M(0.08, 2.0, ZB + 0.02, 0, 0, 0.1));
  for (const [tx, ty] of [[-0.9, 1.74], [0.08, 2.1]]) p.box(tx, ty, ZB + 0.03, 0.025, 0.025, 0.02, C.gold);
  const bn = p.at(0.12, ZB + 0.18, 0, 1.25); // bananas on a string from a nail
  bn.box(0, 0.32, -0.1, 0.012, 0.36, 0.012, '#C9A576', 0.5, 0, 0);
  bn.box(0, 0.12, 0, 0.04, 0.12, 0.04, '#6E8A3A');
  for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; bn.box(Math.sin(a) * 0.06, 0.02 + (i % 2) * 0.04, Math.cos(a) * 0.06, 0.035, 0.16, 0.035, i % 3 ? '#F2C232' : '#D9A93B', Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5); }

  // --- front floor (the door path stays clear): a tied bundle of yesterday's papers with the shop
  //     cat asleep on it, a spare stool with a cup left on it, a mop bucket and rag, a spilled-tea rag ---
  const nb = p.at(-1.75, 2.35, 0.25);
  for (let i = 0; i < 6; i++) nb.box(0, 0.025 + i * 0.03, 0, 0.44, 0.028, 0.32, i % 2 ? C.news : C.newsL, 0, Math.sin(i * 1.9) * 0.05, 0);
  nb.box(0, 0.095, 0, 0.012, 0.19, 0.33, '#C9A576');
  nb.box(0, 0.095, 0, 0.45, 0.19, 0.012, '#C9A576');
  cat(nb, 0.0, 0.19, 0.0, 0.4);
  solid(room, -1.75, 2.35, 0.5, 0.42);
  stool(p, 1.25, 2.4, STOOLS[1]);
  cup(p, 1.25, 0.25, 2.4, { saucer: false });
  const bk = p.at(-1.0, 3.2);
  bk.pr(0, 0.15, 0, 0.16, 0.13, 0.3, '#5F8DB0', 8);
  bk.pr(0, 0.29, 0, 0.165, 0.165, 0.025, '#3F6684', 8);
  bk.pr(0, 0.26, 0, 0.14, 0.14, 0.01, '#9CB8C8', 8);
  bk.box(0.02, 0.62, -0.02, 0.03, 0.85, 0.03, C.woodL, 0.18, 0, 0.1);
  bk.box(0.12, 0.31, 0.05, 0.14, 0.1, 0.03, C.cloth, 0, 0.3, 0.6);
  solid(room, -1.0, 3.2, 0.36, 0.36);
  d.bm(1.0, 0.002, 0.62, 1.32, 0.012, 0.86, '#C9B08A'); // the tea rag by table D
  p.box(1.16, 0.016, 0.74, 0.3, 0.02, 0.2, C.cloth, 0, 0.35, 0);
  d.box(1.0, 0.0015, 1.0, 0.32, 0.002, 0.2, '#B98A52', 0, 0.6, 0); // a tea spill

  // a sack of rice and a crate of bottles in the right-front corner
  p.bm(2.9, 0, 1.95, 3.35, 0.32, 2.4, '#D8C9A6');
  p.bm(2.92, 0.32, 1.97, 3.33, 0.36, 2.38, jitter('#D8C9A6', -0.1, 2));
  d.bm(3.0, 0.12, 2.401, 3.25, 0.2, 2.405, C.red);
  solid(room, 3.12, 2.17, 0.48, 0.48);

  // --- low tables with teapots, cups, snacks; stools (people stand just in front of theirs) ---
  const tables = [
    { id: 'A', x: -2.2, z: -2.0, pot: '#3E7C66' },
    { id: 'B', x: -2.3, z: 0.5, pot: '#B8423C' },
    { id: 'C', x: -0.1, z: -1.0, pot: '#3E7C66' },
    { id: 'D', x: 2.3, z: 1.4, pot: '#2F5DB3' },
  ];
  tables.forEach((t, i) => {
    const h = lowTable(p, t.x, t.z, { seed: i + 2 });
    teapot(p, t.x - 0.12, h, t.z - 0.1, { col: t.pot, ry: 0.4 + i });
    cup(p, t.x + 0.14, h, t.z + 0.1);
    cup(p, t.x + 0.16, h, t.z - 0.14, { tea: '#C99A6A' });
    if (i !== 1) { p.pr(t.x - 0.1, h + 0.008, t.z + 0.16, 0.08, 0.075, 0.016, C.cream, 8); snacks(p, t.x - 0.14, t.x - 0.05, h + 0.016, t.z + 0.16, i % 2 ? 'cake' : 'samosa', i); }
    p.pr(t.x + 0.22, h + 0.05, t.z + 0.22, 0.025, 0.025, 0.1, '#E6D9B8', 6); // a little holder of tissue
    solid(room, t.x, t.z, 0.64, 0.64);
  });
  // stools: [x, z, colour]
  // (pulled aside from where the cast stands, so nobody stands inside a stool)
  const STOOL_AT = [[-2.72, -2.82, 0], [-1.55, -2.0, 2], [-3.2, 0.98, 1], [-2.3, 1.15, 3], [-0.62, -1.78, 4], [0.78, -0.42, 2], [3.12, 1.95, 3], [2.3, 0.75, 0]];
  for (const [x, z, c] of STOOL_AT) stool(p, x, z, STOOLS[c]);
  // U Kan's own jar at his feet; Daw Hla's folded handbill and her glasses case on table B
  jarInto(p, -1.85, 0, -2.55, { s: 1.1 });
  const fb = A.draw(120, 90, (g, w, h) => { paperBg(g, w, h, { bg: '#EEE8DA', seed: 3 }); text(g, 'ရွှေမင်တွင်း', w / 2, h * 0.28, { size: h * 0.2, max: w * 0.9 }); printLines(g, w * 0.1, h * 0.5, w * 0.8, h * 0.4, { cols: 1, gap: 9, lw: 2, seed: 4 }); });
  A.quad(fb, 0.2, 0.15, M(-2.38, 0.455, 0.6, -Math.PI / 2, 0, 0.5));
  p.box(-2.15, 0.465, 0.42, 0.12, 0.03, 0.05, '#6B3E64', 0, 0.3, 0);

  const life = createLife(room, {
    windows: [WIN],
    lamps: [
      { x: -hw + 0.19, y: 2.15, z: -0.9, r: 1.6, px: -2.6, pz: -0.6 },
      { x: hw - 0.19, y: 2.2, z: -2.6, r: 1.5, px: 2.4, pz: -1.9 },
      { x: 1.2, y: 1.6, z: -2.4, core: false, r: 1.8, px: 0.6, pz: -1.6 },
    ],
    coals: [{ x: SX, y: 0.86, z: SZ, w: 0.3, d: 0.3 }],
    steam: [{ x: SX + 0.18, y: 1.15, z: SZ + 0.12 }, { x: 2.05, y: 0.97, z: -2.75 }],
    shaft: { dx: 0.4, len: 2.6 },
  });

  // correction sheet: its own small mesh on the same atlas (shown after the close)
  const corr = A.mesh(corrQuads, 'correction');
  corr.visible = false;
  room.group.add(corr);
  const setCorrection = (on) => { corr.visible = !!on; };
  setHoard(opts.hoard ?? 9);

  const spots = {
    sein: { x: 1.62, z: -3.42, h: 0 }, // behind her counter
    kan: { x: -2.2, z: -2.52, h: 0.25, look: { x: -2.92, z: 0.5 } }, // table A, back side, his jar at his feet
    dawhla: { x: -2.35, z: -0.02, h: 0.35, look: { x: -2.2, z: -2.4 } }, // table B, back side, facing the room
    drinker1: { x: -0.12, z: -1.52, h: 0.3, look: { x: 0.5, z: -0.95 } }, // table C, back side
    drinker2: { x: 0.52, z: -0.95, h: -1.05, look: { x: -0.12, z: -1.52 } }, // table C, east side, 3/4
    maya: { x: 2.3, z: 0.78, h: -0.3, seat: 0.25 }, // door table D, back side (its stool): the sort seat
    mayaCounter: { x: 1.6, z: -2.15, h: Math.PI },
    door: { x: 0, z: hd - 0.6, h: Math.PI },
  };
  const stations = [
    station('sein', 1.6, -2.2, [1.6, -3.45], { r: 0.9, labelY: 1.8 }),
    station('hoard', 0.8, -2.2, [0.8, -2.84], { r: 0.7, labelY: 0.9 }),
    station('handbill', -0.4, -2.6, [-0.4, ZB], { r: 0.9, labelY: 2.3 }),
    station('kan', -1.5, -1.5, [-2.2, -2.5], { r: 0.8, labelY: 1.6 }),
    station('dawhla', -1.7, 0.95, [-2.35, -0.02], { r: 0.8, labelY: 1.6 }),
    station('sortTable', 2.3, 2.1, [2.3, 1.4], { r: 0.9, labelY: 0.9 }),
  ];
  return finish(room, v, A, life, {
    id: 'junctiontea',
    name: { my: 'ဒေါ်စိန်ရဲ့ လက်ဖက်ရည်ဆိုင်', en: "Daw Sein's tea shop" },
    spots,
    stations,
    cast: [{ id: 'sein', spot: 'sein' }, { id: 'kan', spot: 'kan' }, { id: 'dawhla', spot: 'dawhla' }, { id: 'drinker1', spot: 'drinker1' }, { id: 'drinker2', spot: 'drinker2' }],
    decals: dv,
    cam: { tilt: 54, width: 6.8, lookZ: -0.35 },
    handles: { setHoard, setCorrection },
    extraDispose: [() => hoard.dispose(), () => corr.geometry.dispose(), () => corr.material.dispose()],
  });
}

// =============================================================================================
// schoolroom · the Junction school · 7 x 8 · day8-spec 15.3 (the teacher is out hunting ink)
// =============================================================================================
function chalkBoard(g, w, h, after) {
  g.fillStyle = '#2E3B33';
  g.fillRect(0, 0, w, h);
  // old smudges
  for (let i = 0; i < 18; i++) {
    g.fillStyle = `rgba(230,235,225,${0.025 + (i % 3) * 0.012})`;
    g.fillRect(((i * 97) % 100) / 100 * w, ((i * 53) % 100) / 100 * h, w * 0.18, h * 0.06);
  }
  const chalk = '#F1F0E6';
  // the teacher's hand, top left: today: adding
  text(g, 'ဒီနေ့ — ပေါင်းခြင်း', w * 0.2, h * 0.12, { size: h * 0.075, color: chalk, weight: 400 });
  g.fillStyle = chalk;
  g.fillRect(w * 0.05, h * 0.19, w * 0.3, 2);
  // a little sum the teacher left (2 + 3 = 5 in Burmese digits)
  text(g, '၂ + ၃ = ၅', w * 0.17, h * 0.3, { size: h * 0.07, color: '#DCE6DF', weight: 400 });
  // Moe Moe's well: a curb, ink at a level, three dipping cups with arrows
  g.strokeStyle = chalk;
  g.lineWidth = 4;
  g.lineCap = 'round';
  const cx = w * 0.3, cy = h * 0.66;
  g.beginPath(); g.ellipse(cx, cy - h * 0.12, w * 0.12, h * 0.05, 0, 0, TAU); g.stroke();
  g.beginPath(); g.moveTo(cx - w * 0.12, cy - h * 0.12); g.lineTo(cx - w * 0.12, cy + h * 0.14); g.moveTo(cx + w * 0.12, cy - h * 0.12); g.lineTo(cx + w * 0.12, cy + h * 0.14); g.stroke();
  g.beginPath(); g.ellipse(cx, cy + h * 0.14, w * 0.12, h * 0.05, 0, 0, Math.PI); g.stroke();
  g.fillStyle = 'rgba(244,210,122,0.85)'; // a gold chalk level
  g.fillRect(cx - w * 0.115, cy - h * 0.02, w * 0.23, 5);
  for (let i = 0; i < 3; i++) {
    const x = cx - w * 0.08 + i * w * 0.08, y = cy - h * 0.3;
    g.strokeStyle = chalk;
    g.beginPath(); g.moveTo(x - 12, y); g.lineTo(x - 8, y + 18); g.lineTo(x + 8, y + 18); g.lineTo(x + 12, y); g.stroke(); // cup
    g.beginPath(); g.moveTo(x, y + 24); g.lineTo(x, y + 52); g.moveTo(x - 7, y + 44); g.lineTo(x, y + 52); g.lineTo(x + 7, y + 44); g.stroke(); // arrow down
  }
  // her sum: dip + dip + dip ... -> gone!
  text(g, 'ခပ် + ခပ် + ခပ် …', w * 0.72, h * 0.45, { size: h * 0.085, color: chalk, weight: 400 });
  text(g, '→ ကုန်!', w * 0.72, h * 0.62, { size: h * 0.11, color: '#F6D9A0' });
  if (after) {
    g.strokeStyle = '#F6B8A4';
    g.lineWidth = 5;
    g.beginPath(); g.moveTo(w * 0.53, h * 0.53); g.lineTo(w * 0.93, h * 0.42); g.moveTo(w * 0.53, h * 0.68); g.lineTo(w * 0.86, h * 0.58); g.stroke();
    text(g, 'ကိုယ်တိုင် ကြည့်မယ်', w * 0.72, h * 0.83, { size: h * 0.09, color: '#FFFFFF' });
    g.strokeStyle = chalk; g.lineWidth = 3;
    g.beginPath(); g.moveTo(w * 0.56, h * 0.91); g.lineTo(w * 0.88, h * 0.91); g.stroke();
  }
  g.strokeStyle = '#1E2822';
  g.lineWidth = 6;
  g.strokeRect(0, 0, w, h);
}
function inkPotGeometry() {
  const v = new VoxelBuilder();
  const q = new Pen(v);
  q.pr(0, 0.022, 0, 0.05, 0.055, 0.044, '#A9C3D2', 8); // squat glass
  q.pr(0, 0.05, 0, 0.026, 0.036, 0.016, '#8FAABB', 8);
  q.pr(0, 0.064, 0, 0.02, 0.02, 0.012, C.ink, 8); // neck
  q.pr(0, 0.002, 0, 0.056, 0.056, 0.004, '#7F98A8', 8);
  return v.geometry();
}
function inkFillGeometry() {
  const v = new VoxelBuilder();
  const q = new Pen(v);
  q.pr(0, 0.03, 0, 0.044, 0.047, 0.03, C.gold, 8); // gold ink seen through the glass
  q.pr(0, 0.07, 0, 0.016, 0.016, 0.004, '#F4D27A', 8);
  return v.geometry();
}

async function buildSchoolroom(opts = {}) {
  await fontsReady();
  const W = 7, D = 8, hw = W / 2, hd = D / 2;
  const WINS = [{ x: -2.2, y: 1.8, w: 1.1, h: 0.9 }, { x: 2.2, y: 1.8, w: 1.1, h: 0.9 }];
  const room = kit.createRoom({ width: W, depth: D, height: 3, wall: '#F4F1E8', wainscot: '#6E9E7A', trim: C.goldD, floor: 'planks', floorColor: '#BC966A', background: '#E6E1CF', windows: WINS });
  const v = new VoxelBuilder();
  const p = new Pen(v);
  const dv = new VoxelBuilder();
  const d = new Pen(dv);
  const A = makeAtlas(1024);
  const ZB = -hd;
  dressWalls(d, room, { stripe: null, stile: '#5A8466', panel: 0.6 });
  d.bm(-hw, 1.06, ZB, hw, 1.12, ZB + 0.006, '#E8C97A'); // a yellow band above the green
  for (const sx of [-1, 1]) d.bm(sx * hw - (sx > 0 ? 0.006 : 0), 1.06, ZB, sx * hw + (sx < 0 ? 0.006 : 0), 1.12, -0.4, '#E8C97A');

  // --- windows: rooftops with a kite (left), a padauk tree (right); sills with a jar of pencils ---
  windowQuad(A, room, WINS[0], { seed: 11, extra(g, w, h) { g.strokeStyle = '#6E5A44'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(w * 0.8, h * 0.8); g.quadraticCurveTo(w * 0.7, h * 0.4, w * 0.62, h * 0.24); g.stroke(); g.fillStyle = '#C8323C'; g.save(); g.translate(w * 0.6, h * 0.2); g.rotate(0.6); g.fillRect(-10, -10, 20, 20); g.restore(); } });
  windowQuad(A, room, WINS[1], { seed: 5, extra(g, w, h) { g.fillStyle = '#6E4A2E'; g.fillRect(w * 0.42, h * 0.45, 12, h * 0.55); g.fillStyle = '#5E8F4E'; g.fillRect(w * 0.15, h * 0.18, w * 0.6, h * 0.32); g.fillStyle = '#6F9E5B'; g.fillRect(w * 0.25, h * 0.08, w * 0.45, h * 0.2); g.fillStyle = '#F2C232'; for (let i = 0; i < 10; i++) g.fillRect(w * (0.2 + (i % 5) * 0.11), h * (0.14 + Math.floor(i / 5) * 0.16), 7, 7); } });
  for (const w of WINS) {
    p.bm(w.x - 0.68, 2.3, ZB + 0.02, w.x + 0.68, 2.33, ZB + 0.09, C.bronze);
    curtain(p.at(0, 0), w.x - 0.6, 2.3, 0.2, 1.1, ZB + 0.1, { col: '#E8C97A' });
    curtain(p.at(0, 0), w.x + 0.6, 2.3, 0.2, 1.1, ZB + 0.1, { col: '#E8C97A' });
  }
  plantPot(p, -2.5, 1.27, ZB + 0.14, { s: 0.75, flowers: false });
  glassJar(p, -1.9, 1.27, ZB + 0.14, { fill: '#D9A93B', h: 0.16, r: 0.05 });
  plantPot(p, 2.45, 1.27, ZB + 0.14, { s: 0.7 });

  // --- the blackboard (2.4 x 1.2, centre y 1.6) + chalk tray, the alphabet strip above ---
  const BW = 2.4, BH = 1.2, BY = 1.6;
  p.bm(-BW / 2 - 0.08, BY - BH / 2 - 0.08, ZB, BW / 2 + 0.08, BY + BH / 2 + 0.08, ZB + 0.05, C.woodD);
  p.bm(-BW / 2 - 0.1, BY - BH / 2 - 0.12, ZB, BW / 2 + 0.1, BY - BH / 2 - 0.06, ZB + 0.14, C.wood); // chalk tray
  for (let i = 0; i < 5; i++) p.box(-0.9 + i * 0.13, BY - BH / 2 - 0.045, ZB + 0.1, 0.08, 0.02, 0.02, i === 3 ? '#F6D9A0' : C.white, 0, 0.2 * i, 0);
  p.bm(0.55, BY - BH / 2 - 0.06, ZB + 0.06, 0.8, BY - BH / 2 - 0.01, ZB + 0.13, '#5A3E2A'); // duster
  p.bm(0.56, BY - BH / 2 - 0.01, ZB + 0.07, 0.79, BY - BH / 2 + 0.01, ZB + 0.12, '#D8CFC0');
  const boardQ = [[], []];
  for (const after of [0, 1]) {
    const r = A.draw(500, 250, (g, w, h) => chalkBoard(g, w, h, !!after));
    A.quad(r, BW, BH, M(0, BY, ZB + 0.055), boardQ[after]);
  }
  const strip = A.draw(780, 62, (g, w, h) => {
    const L = 'ကခဂဃငစဆဇဈညဋဌဍဎဏတထဒဓနပဖဗဘမယရလဝသဟဠအ';
    const n = 12;
    for (let i = 0; i < n; i++) {
      g.fillStyle = ['#F6E7C1', '#E3EEF6', '#F2D5CF', '#E0EBD8'][i % 4];
      g.fillRect(i * (w / n) + 2, 2, w / n - 4, h - 4);
      text(g, L[i], i * (w / n) + w / n / 2, h * 0.55, { size: h * 0.62, color: ['#8E2F2B', '#2F5DB3', '#3F6B4E', '#A47A2C'][i % 4] });
    }
  });
  A.quad(strip, 2.6, 0.21, M(0, 2.5, ZB + 0.012));
  // number chart right of the board, a class timetable left of it
  framedSign(p, A, hw - 0.01, 1.55, -3.25, 0.52, 0.38, (g, w, h) => {
    g.fillStyle = '#FBF7EE'; g.fillRect(0, 0, w, h);
    for (let i = 1; i <= 6; i++) { text(g, myNum(i), (w / 7) * i, h * 0.35, { size: h * 0.22, color: '#2F5DB3' }); for (let k = 0; k < i; k++) disc(g, (w / 7) * i - 10 + (k % 2) * 12, h * 0.6 + Math.floor(k / 2) * 14, 5, '#C8323C'); }
  }, { ry: -Math.PI / 2, frame: C.goldD, px: 280 });
  framedSign(p, A, -hw + 0.01, 1.7, -3.3, 0.5, 0.4, (g, w, h) => {
    g.fillStyle = '#FBF7EE'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3F6B4E'; g.fillRect(0, 0, w, h * 0.22);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { g.fillStyle = ['#F6E7C1', '#E3EEF6', '#F2D5CF'][(r + c) % 3]; g.fillRect(8 + c * (w - 16) / 3, h * 0.28 + r * h * 0.17, (w - 16) / 3 - 4, h * 0.15); }
  }, { ry: Math.PI / 2, frame: C.goldD, px: 280 });
  // the reed mat in front of the board (where they sit for stories)
  for (let i = 0; i < 8; i++) d.bm(-1.3 + i * 0.33, 0, -3.65, -1.3 + (i + 1) * 0.33 - 0.01, 0.012, -2.95, i % 2 ? '#D9C08A' : '#C9AE76');
  // a woven runner down the aisle between the desk rows, door to board (breaks the plank seams),
  // and a coir mat inside the door where the sandals come off
  d.bm(-0.46, 0, -2.9, 0.46, 0.008, 3.3, '#5A7E5E');
  d.bm(-0.4, 0, -2.84, 0.4, 0.011, 3.24, '#D6BE8E');
  for (let z = -2.8; z < 3.2; z += 0.12) d.bm(-0.4, 0.011, z, 0.4, 0.0125, z + 0.035, '#C8AC78'); // weave
  for (const sx of [-1, 1]) d.bm(sx * 0.3 - 0.025, 0.012, -2.84, sx * 0.3 + 0.025, 0.014, 3.24, '#B8855A'); // two border threads
  d.bm(-2.6, 0, 3.35, -1.25, 0.01, 3.85, '#B08A52');
  for (let x = -2.55; x < -1.3; x += 0.09) d.bm(x, 0.01, 3.38, x + 0.04, 0.012, 3.82, '#9A7646');

  // --- teacher's desk (-2.4, -2.4): bell, chalk note, books, ruler, a pot; chair behind ---
  room.place(kit.desk({ w: 1.3, d: 0.66, h: 0.74, top: C.woodL, body: C.wood }), -2.4, -2.4);
  const DT = 0.74;
  const bq = p.at(-2.85, -2.45, 0, DT); // the hand bell
  bq.pr(0, 0.05, 0, 0.05, 0.075, 0.09, C.gold, 8);
  bq.pr(0, 0.105, 0, 0.03, 0.045, 0.025, C.goldD, 8);
  bq.box(0, 0.16, 0, 0.03, 0.09, 0.03, C.woodD);
  bq.box(0, 0.215, 0, 0.045, 0.03, 0.045, C.woodD);
  paperStack(p, -2.0, DT, -2.55, { w: 0.24, d: 0.3, n: 6, col: '#E3EEF6' }); // exercise books
  paperStack(p, -2.0, DT + 0.075, -2.55, { w: 0.22, d: 0.28, n: 3, col: '#F2D5CF', ry: 0.2 });
  p.box(-2.45, DT + 0.006, -2.2, 0.5, 0.008, 0.04, '#E8C97A', 0, 0.15, 0); // ruler
  for (let i = 0; i < 8; i++) d.box(-2.68 + i * 0.06, DT + 0.011, -2.2 + i * 0.009, 0.006, 0.002, 0.02, C.ink, 0, 0.15, 0);
  const note = A.draw(150, 100, (g, w, h) => {
    paperBg(g, w, h, { bg: '#FBF7EE', edge: '#D9CDB4', seed: 5 });
    text(g, 'မင် သွားရှာနေတယ်', w / 2, h * 0.4, { size: h * 0.2, color: '#2E3D63', weight: 400, max: w * 0.9 });
    text(g, '— ဆရာမ', w * 0.68, h * 0.72, { size: h * 0.14, color: '#2E3D63', weight: 400 });
  });
  A.quad(note, 0.26, 0.17, M(-2.45, DT + 0.012, -2.33, -Math.PI / 2, 0, -0.1));
  p.pr(-2.65, DT + 0.05, -2.65, 0.07, 0.07, 0.1, '#7FA8C8', 8); // a mug of chalk and pencils
  for (let i = 0; i < 4; i++) p.box(-2.66 + i * 0.015, DT + 0.15, -2.65, 0.012, 0.12, 0.012, [C.white, C.red, '#2F5DB3', C.white][i], 0, 0, (i - 1.5) * 0.12);
  // the teacher's chair
  const tc = p.at(-2.4, -3.05);
  tc.bm(-0.22, 0.44, -0.22, 0.22, 0.48, 0.22, C.wood);
  tc.bm(-0.22, 0.48, -0.24, 0.22, 0.98, -0.2, C.wood);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) tc.box(sx * 0.18, 0.22, sz * 0.18, 0.05, 0.44, 0.05, C.woodD);
  for (let i = 0; i < 3; i++) tc.bm(-0.17, 0.6 + i * 0.12, -0.245, 0.17, 0.64 + i * 0.12, -0.235, C.woodL);
  p.bm(-2.65, 0.48, -3.0, -2.15, 0.6, -2.85, '#3F6B4E'); // a cardigan hung over the back
  solid(room, -2.4, -3.05, 0.48, 0.48);

  // --- six two-seat school desks (x +-1.6; z -1.2, 0.2, 1.6), each with an empty ink pot ---
  const DESKS = [];
  for (const z of [-1.2, 0.2, 1.6]) for (const x of [-1.6, 1.6]) DESKS.push([x, z]);
  const potAt = [];
  DESKS.forEach(([x, z], i) => {
    const q = p.at(x, z);
    const H = 0.56;
    q.bm(-0.68, H - 0.04, -0.3, 0.68, H, 0.04, jitter(C.woodL, 0.05, i)); // top
    q.bm(-0.68, H - 0.2, -0.3, 0.68, H - 0.04, -0.26, C.wood); // front panel (toward the board)
    q.bm(-0.66, H - 0.17, -0.26, 0.66, H - 0.14, 0.02, C.wood); // book shelf under the top
    q.bm(-0.68, 0.28, 0.24, 0.68, 0.32, 0.46, jitter(C.wood, 0.05, i + 4)); // bench
    for (const sx of [-1, 1]) {
      q.bm(sx * 0.62 - 0.03, 0, -0.3, sx * 0.62 + 0.03, H - 0.04, -0.24, C.woodD);
      q.bm(sx * 0.62 - 0.03, 0, -0.04, sx * 0.62 + 0.03, H - 0.04, 0.02, C.woodD);
      q.bm(sx * 0.62 - 0.03, 0, 0.3, sx * 0.62 + 0.03, 0.28, 0.36, C.woodD);
      q.bm(sx * 0.62 - 0.03, 0.06, -0.3, sx * 0.62 + 0.03, 0.1, 0.36, C.woodD); // runner
    }
    q.bm(-0.68, H - 0.002, -0.29, 0.68, H + 0.002, -0.25, C.woodD); // pen groove
    potAt.push([x + 0.0, H, z - 0.2]);
    // books, slates, pencils: a little different on every desk
    if (i % 2 === 0) { q.bm(-0.5, H, -0.2, -0.22, H + 0.012, 0.0, '#E3EEF6'); q.bm(-0.49, H + 0.012, -0.19, -0.23, H + 0.016, -0.01, '#C8323C'); }
    else { q.bm(0.22, H, -0.22, 0.52, H + 0.02, 0.0, C.chalkD); q.bm(0.24, H + 0.02, -0.2, 0.5, H + 0.022, -0.02, C.chalk); }
    q.box(0.32 - (i % 2) * 0.7, H + 0.008, -0.12, 0.14, 0.012, 0.012, i % 3 ? '#E8C97A' : '#2F5DB3', 0, 0.4, 0);
    if (i === 2) q.bm(0.25, H, -0.25, 0.55, H + 0.08, -0.03, '#7A5434'); // a satchel left on a desk
    solid(room, x, z + 0.05, 1.4, 0.82);
  });
  const pots = instanced(room.group, inkPotGeometry(), 7, { px: 1.1 });
  const fills = instanced(room.group, inkFillGeometry(), 7, { outline: false });
  potAt.push([-2.25, DT, -2.6]);
  potAt.forEach(([x, y, z], i) => { pots.set(i, x, y, z, i * 0.3); fills.set(i, x, y, z, i * 0.3); });
  const setPots = (full) => { for (let i = 0; i < 7; i++) fills.show(i, !!full); };

  // --- right wall: slate shelf (z -1.5), star chart, calendar; left wall: hooks with satchels,
  //     children's drawings, the clock; water pot and a row of small sandals by the door ---
  const sq = p.at(hw - 0.2, -1.5, -Math.PI / 2);
  sq.bm(-0.55, 0, -0.18, 0.55, 0.05, 0.18, C.woodD);
  sq.bm(-0.55, 0.05, -0.18, -0.5, 1.1, 0.18, C.wood);
  sq.bm(0.5, 0.05, -0.18, 0.55, 1.1, 0.18, C.wood);
  for (const y of [0.42, 0.78, 1.1]) sq.bm(-0.55, y - 0.03, -0.18, 0.55, y, 0.18, C.wood);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {
    const x = -0.42 + i * 0.17;
    sq.box(x, 0.05 + r * 0.37 + 0.15, -0.02, 0.025, 0.3, 0.24, C.woodL, 0.12 * Math.sin(i + r), 0, 0); // slate frame
    sq.box(x + 0.004, 0.05 + r * 0.37 + 0.15, -0.02, 0.022, 0.26, 0.2, C.chalk, 0.12 * Math.sin(i + r), 0, 0);
  }
  bookRow(sq, -0.48, 0.48, 1.1, 0, { seed: 9, d: 0.18, hMax: 0.22 });
  solid(room, hw - 0.2, -1.5, 0.4, 1.12);
  framedSign(p, A, hw - 0.01, 1.8, -1.5, 0.62, 0.5, (g, w, h) => {
    g.fillStyle = '#FBF7EE'; g.fillRect(0, 0, w, h);
    text(g, 'ကြယ်ပွင့်များ', w / 2, h * 0.12, { size: h * 0.1, color: '#8E2F2B' });
    for (let r = 0; r < 6; r++) { g.fillStyle = '#C9C2B2'; g.fillRect(10, h * 0.24 + r * h * 0.12, w - 20, 2); for (let k = 0; k < 2 + ((r * 5) % 5); k++) { g.fillStyle = '#E3A51E'; g.save(); g.translate(w * 0.3 + k * 22, h * 0.29 + r * h * 0.12); g.rotate(Math.PI / 4); g.fillRect(-5, -5, 10, 10); g.restore(); } g.fillStyle = '#5A4A3A'; g.fillRect(14, h * 0.27 + r * h * 0.12, w * 0.15, 4); }
  }, { ry: -Math.PI / 2, frame: C.goldD, px: 260 });
  framedSign(p, A, hw - 0.01, 1.35, 1.0, 0.36, 0.44, (g, w, h) => drawCalendar(g, w, h, { seed: 11 }), { ry: -Math.PI / 2, frame: C.maroon, px: 180 });
  oilLamp(p, hw - 0.19, 2.15, -2.8, { ry: -Math.PI / 2 });
  // left wall: hooks + satchels, drawings, clock, lamp
  const LX = -hw;
  p.bm(LX, 1.45, -2.2, LX + 0.05, 1.5, -0.6, C.woodD);
  const sat = ['#7A5434', '#3F6B4E', '#2F5DB3', '#B8423C', '#D9A93B'];
  for (let i = 0; i < 5; i++) {
    const z = -2.05 + i * 0.35;
    p.box(LX + 0.07, 1.47, z, 0.06, 0.03, 0.03, C.bronze);
    if (i !== 3) {
      p.bm(LX + 0.04, 1.02, z - 0.13, LX + 0.15, 1.32, z + 0.13, sat[i]);
      p.bm(LX + 0.15, 1.18, z - 0.13, LX + 0.16, 1.32, z + 0.13, jitter(sat[i], -0.15, i)); // flap
      p.box(LX + 0.165, 1.2, z, 0.01, 0.04, 0.05, C.gold);
      p.box(LX + 0.09, 1.4, z, 0.02, 0.16, 0.02, jitter(sat[i], -0.2, i)); // strap
    }
  }
  const drawings = [];
  for (let i = 0; i < 4; i++) drawings.push(A.draw(80, 64, (g, w, h) => {
    g.fillStyle = '#FBF7EE'; g.fillRect(0, 0, w, h);
    if (i === 0) { disc(g, w * 0.7, h * 0.3, 12, '#F2C232'); g.fillStyle = '#6F9E5B'; g.fillRect(0, h * 0.75, w, h * 0.25); g.fillStyle = '#B8423C'; g.fillRect(w * 0.2, h * 0.45, 20, 20); }
    if (i === 1) { g.strokeStyle = '#2F5DB3'; g.lineWidth = 4; g.beginPath(); for (let k = 0; k < 5; k++) g.lineTo(10 + k * 15, h * 0.5 + (k % 2 ? -14 : 14)); g.stroke(); disc(g, w * 0.5, h * 0.2, 7, '#E3A51E'); }
    if (i === 2) { disc(g, w * 0.5, h * 0.42, 16, '#E8B48E'); disc(g, w * 0.43, h * 0.38, 2.5, C.ink); disc(g, w * 0.57, h * 0.38, 2.5, C.ink); g.fillStyle = '#1F1B1B'; g.fillRect(w * 0.32, h * 0.12, 26, 9); g.fillStyle = '#B8423C'; g.fillRect(w * 0.3, h * 0.66, 32, 18); }
    if (i === 3) { g.strokeStyle = '#3F6B4E'; g.lineWidth = 3; g.beginPath(); g.ellipse(w / 2, h * 0.6, 22, 8, 0, 0, TAU); g.stroke(); g.fillStyle = '#E3A51E'; g.fillRect(w / 2 - 18, h * 0.55, 36, 4); }
  }));
  drawings.forEach((r, i) => {
    A.quad(r, 0.3, 0.24, M(LX + 0.015, 1.95 + (i % 2) * 0.06, -2.05 + i * 0.48, 0, Math.PI / 2, (i % 2 ? 0.05 : -0.04)));
    p.box(LX + 0.02, 2.09 + (i % 2) * 0.06, -2.05 + i * 0.48, 0.02, 0.03, 0.03, ['#C8323C', '#2F5DB3', '#E3A51E', '#3F6B4E'][i]);
  });
  clockFrame(p, -3.12, 2.45, ZB + 0.04, 0.15);
  A.quad(A.draw(96, 96, (g, w, h) => drawClock(g, w, h, 10, 50)), 0.25, 0.25, M(-3.12, 2.45, ZB + 0.068));
  oilLamp(p, -hw + 0.19, 2.15, 0.2, { ry: Math.PI / 2 });
  waterPot(p, -3.05, 3.2);
  solid(room, -3.05, 3.2, 0.46, 0.46);
  for (let i = 0; i < 4; i++) sandals(p, -2.4 + i * 0.32, 3.55, { col: ['#2F5DB3', '#B8423C', '#7A5434', '#3F6B4E'][i], strap: C.cream, ry: Math.sin(i * 2.3) * 0.2 });
  kitPlant(room, 2.7, 3.2, 0.8);
  broom(p, 3.2, 2.4, { ry: -Math.PI / 2 });

  const life = createLife(room, {
    windows: WINS,
    lamps: [
      { x: hw - 0.19, y: 2.2, z: -2.8, r: 1.5, px: 2.6, pz: -2.4 },
      { x: -hw + 0.19, y: 2.2, z: 0.2, r: 1.5, px: -2.6, pz: 0.4 },
    ],
    shaft: { dx: 0.3, len: 2.4 },
  });

  const bBefore = A.mesh(boardQ[0], 'board');
  const bAfter = A.mesh(boardQ[1], 'boardAfter');
  bAfter.visible = false;
  room.group.add(bBefore, bAfter);
  const setAfter = (on) => { bBefore.visible = !on; bAfter.visible = !!on; };
  setPots(opts.pots ?? false);

  const spots = {
    // at the board, chalk in hand, body to her sum, face turned to Maya (head look, clamped 0.9 rad)
    moemoe: { x: 1.38, z: -3.2, h: -1.55, look: { x: 0.0, z: -2.55 } },
    moemoeTurned: { x: 1.3, z: -3.05, h: -0.5, look: { x: 0.0, z: -2.55 } },
    pupil1: { x: 1.95, z: 0.84, h: -0.55, look: { x: 0.6, z: -2.8 } }, // turned round behind the bench of desk (1.6, 0.2)
    pupil2: { x: -1.25, z: 2.24, h: 0.3 }, // behind the bench of desk (-1.6, 1.6), facing the room
    teacher: { x: -2.4, z: -3.0, h: 0.2, seat: 0.46 }, // after the close: on her chair at the desk
    maya: { x: 0.0, z: -2.55, h: 0.7, look: { x: 1.38, z: -3.2 } }, // talking with Moe Moe, 3/4 to the camera
    door: { x: 0, z: hd - 0.6, h: Math.PI },
  };
  const stations = [
    station('moemoe', 0.5, -2.45, [0.9, -3.2], { r: 0.9, labelY: 1.5 }),
    station('board', -0.3, -2.6, [0, ZB], { r: 0.9, labelY: 2.3 }),
    station('teacherDesk', -2.75, -1.75, [-2.4, -2.4], { r: 0.8, labelY: 1.1 }),
    station('inkPots', 0, 0.2, [1.6, 0.0], { r: 0.9, labelY: 0.9 }),
  ];
  return finish(room, v, A, life, {
    id: 'schoolroom',
    name: { my: 'လမ်းဆုံ ကျောင်း', en: 'the Junction school' },
    spots,
    stations,
    cast: [{ id: 'moemoe', spot: 'moemoe' }, { id: 'pupil1', spot: 'pupil1' }, { id: 'pupil2', spot: 'pupil2' }, { id: 'teacher', spot: 'teacher', when: 'after' }],
    decals: dv,
    cam: { tilt: 54, width: 6.8, lookZ: -0.35 },
    handles: { setPots, setAfter },
    extraDispose: [() => pots.dispose(), () => fills.dispose(), () => bBefore.geometry.dispose(), () => bAfter.geometry.dispose()],
  });
}

// =============================================================================================
// press · the Gold Ink Press (printing shed) · 8 x 8 · day8-spec 15.4, INDEX 13.2 (Day 8 owns the
// layout; Day 14 adds the frame bench front right and the key hook by the door: dressing 'd14')
// =============================================================================================
function drawDaySheet(g, w, h, { seed = 1, misprint = false } = {}) {
  paperBg(g, w, h, { bg: '#F1ECE1', edge: '#C9C2B2', seed });
  g.fillStyle = '#2A2118';
  g.fillRect(w * 0.06, h * 0.05, w * 0.88, h * 0.035);
  text(g, 'နေ့စဉ်စာရွက်', w / 2, h * 0.16, { size: h * 0.09, color: '#2A2118', max: w * 0.9 });
  g.fillRect(w * 0.06, h * 0.25, w * 0.88, 2);
  printLines(g, w * 0.07, h * 0.3, w * 0.86, misprint ? h * 0.36 : h * 0.62, { cols: 2, gap: h * 0.045, lw: Math.max(2, h * 0.014), seed: seed * 3 });
  if (misprint) {
    text(g, '9:00', w / 2, h * 0.8, { size: h * 0.17, family: FONT_SANS, color: '#2A2118' });
    g.fillStyle = 'rgba(184,66,60,0.0)';
  }
}
function drawPastedPage(g, w, h, seed) {
  paperBg(g, w, h, { bg: '#E9E1CC', edge: '#CFC6B0', seed });
  g.fillStyle = 'rgba(60,50,40,0.75)';
  g.fillRect(w * 0.08, h * 0.06, w * 0.84, h * 0.06);
  printLines(g, w * 0.08, h * 0.17, w * 0.84, h * 0.76, { cols: 3, gap: h * 0.03, lw: Math.max(2, h * 0.009), seed, color: 'rgba(110,100,85,0.7)' });
  g.fillStyle = 'rgba(160,130,80,0.18)';
  g.fillRect(0, h * 0.8, w, h * 0.2);
}
function sortGeometry() {
  // a cluster of tiny type sorts filling one compartment: dark wood-brown bodies, metal faces up
  const v = new VoxelBuilder();
  const q = new Pen(v);
  for (let i = 0; i < 4; i++) for (let k = 0; k < 2; k++) {
    q.box(-0.033 + i * 0.022, 0.012, -0.012 + k * 0.024, 0.018, 0.024, 0.02, i % 2 ? '#6E6A64' : '#7C766E');
    q.box(-0.033 + i * 0.022, 0.0255, -0.012 + k * 0.024, 0.016, 0.003, 0.018, '#B8B4AA');
  }
  return v.geometry();
}

async function buildPress(opts = {}) {
  await fontsReady();
  const d14 = opts.dressing === 'd14';
  const W = 8, D = 8, hw = W / 2, hd = D / 2;
  const WIN = { x: 1.0, y: 1.9, w: 1.4, h: 0.8 };
  const room = kit.createRoom({ width: W, depth: D, height: 3, wall: '#DCD6C8', wainscot: '#4A4440', trim: C.goldD, floor: 'planks', floorColor: '#7A6048', background: '#E2DCCD', windows: [WIN] });
  const v = new VoxelBuilder();
  const p = new Pen(v);
  const dv = new VoxelBuilder();
  const d = new Pen(dv);
  const A = makeAtlas(1024);
  const ZB = -hd;
  dressWalls(d, room, { stripe: null, stile: '#3A3532', panel: 0.8 });
  // ink spots on the boards, worn paths
  for (let i = 0; i < 26; i++) {
    const x = Math.sin(i * 12.9898) * 3.4, z = Math.cos(i * 78.233) * 3.4, s = 0.03 + (i % 4) * 0.02;
    d.bm(x - s, 0.001, z - s * 0.7, x + s, 0.004, z + s * 0.7, i % 5 === 0 ? '#3A3020' : '#4E4232');
  }

  // --- old printed pages pasted on the walls (the "faint columns"), and the window ---
  const pages = [0, 1, 2].map((s) => A.draw(150, 200, (g, w, h) => drawPastedPage(g, w, h, s + 2)));
  [[-3.3, 2.45, 0.03], [-2.75, 2.5, -0.05], [-0.4, 2.35, 0.04], [2.4, 2.45, -0.03], [3.25, 2.4, 0.05], [-1.6, 2.55, 0.02]].forEach(([x, y, r], i) =>
    A.quad(pages[i % 3], 0.5, 0.66, M(x, y, ZB + 0.008 + i * 0.001, 0, 0, r)));
  [[-3.2, 2.4], [-2.6, 2.45], [-0.9, 2.4]].forEach(([z, y], i) => A.quad(pages[(i + 1) % 3], 0.5, 0.66, M(-hw + 0.008 + i * 0.001, y, z, 0, Math.PI / 2, 0.03 * (i - 1))));
  windowQuad(A, room, WIN, { seed: 9, sky: ['#C9DCE8', '#F2E2C6'], extra(g, w, h) { g.fillStyle = '#9C8E78'; g.fillRect(w * 0.55, h * 0.2, 10, h * 0.5); g.fillStyle = '#D4CCBA'; g.fillRect(w * 0.5, h * 0.12, 24, 10); } });
  p.bm(WIN.x - 0.78, WIN.y - 0.48, ZB + 0.06, WIN.x + 0.78, WIN.y - 0.44, ZB + 0.24, C.woodD);
  jarInto(p, WIN.x - 0.5, WIN.y - 0.44, ZB + 0.16, { s: 0.7 });
  cup(p, WIN.x + 0.45, WIN.y - 0.44, ZB + 0.16, { col: '#E0C9A0', tea: '#B9864E' });

  // --- type cases A (-2.6) and B (-1.2) on the back wall: drawers with brass labels, the sloped
  //     case on top full of sorts (instanced: neat or jumbled) ---
  const CASES = [-2.6, -1.2];
  const CZ = -3.45;
  const sortSlots = [];
  for (const cx of CASES) {
    const q = p.at(cx, CZ);
    q.bm(-0.62, 0, -0.27, 0.62, 0.06, 0.27, C.woodD);
    for (const sx of [-1, 1]) q.bm(sx * 0.6 - 0.03, 0, -0.27, sx * 0.6 + 0.03, 1.0, 0.27, C.wood);
    q.bm(-0.6, 0, -0.27, 0.6, 0.86, -0.24, C.woodD);
    // drawers: 2 columns x 6 rows, a brass label + pull on each
    for (let r = 0; r < 6; r++) for (let c = 0; c < 2; c++) {
      const x0 = -0.56 + c * 0.565, y0 = 0.08 + r * 0.13;
      q.bm(x0, y0, 0.2, x0 + 0.545, y0 + 0.12, 0.26, jitter(C.woodL, 0.06, r * 2 + c + cx));
      q.bm(x0 + 0.2, y0 + 0.065, 0.26, x0 + 0.345, y0 + 0.1, 0.267, C.gold); // label
      q.bm(x0 + 0.24, y0 + 0.022, 0.26, x0 + 0.305, y0 + 0.045, 0.28, C.bronze); // pull
    }
    // sloped case on top (tilted back): frame + compartment grid
    const tilt = -0.32;
    const tq = q.at(0, -0.02, 0, 1.0);
    tq.box(0, 0.11, 0, 1.22, 0.04, 0.6, C.woodD, tilt, 0, 0);
    tq.box(0, 0.135, 0.29, 1.22, 0.06, 0.03, C.wood, tilt, 0, 0);
    tq.box(0, 0.135, -0.29, 1.22, 0.06, 0.03, C.wood, tilt, 0, 0);
    for (let i = 0; i <= 6; i++) tq.box(-0.6 + i * 0.2, 0.15, 0, 0.018, 0.04, 0.6, C.woodL, tilt, 0, 0);
    for (let k = 1; k < 4; k++) tq.box(0, 0.15, -0.3 + k * 0.15, 1.2, 0.04, 0.012, C.woodL, tilt, 0, 0);
    // slots for the sort clusters: 6 x 4 compartments on the tilted plane
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    for (let i = 0; i < 6; i++) for (let k = 0; k < 4; k++) {
      const lx = -0.5 + i * 0.2, lz = -0.225 + k * 0.15;
      sortSlots.push([cx + lx, 1.0 + 0.135 - lz * st, CZ - 0.02 + lz * ct, tilt]);
    }
  }
  p.bm(-3.2, 1.0, CZ + 0.27, -0.6, 1.02, CZ + 0.31, C.woodD); // a ledge for the composing stick
  p.box(-2.0, 1.04, CZ + 0.3, 0.32, 0.03, 0.05, C.steel); // composing stick
  const sorts = instanced(room.group, sortGeometry(), sortSlots.length, { px: 1.0 });
  const jumbleTo = (on) => {
    sortSlots.forEach(([x, y, z, tilt], i) => {
      const r = Math.sin(i * 91.7) * 0.5 + 0.5;
      if (!on) sorts.set(i, x, y, z, 0, 1, tilt, 0);
      else sorts.set(i, x + (r - 0.5) * 0.03, y + 0.01, z, (r - 0.5) * 2.4, 1, tilt + (i % 3 ? 0 : Math.PI * 0.95), (r - 0.5) * 0.6);
    });
  };
  const setJumbled = (on) => jumbleTo(!!on);
  // shelf above the cases: ink tins, a roll of paper, old proofs
  wallShelf(p, -3.3, -0.55, 1.8, ZB, { d: 0.24, col: C.woodD });
  for (let i = 0; i < 4; i++) tin(p, -3.1 + i * 0.16, 1.8, ZB + 0.12, { col: i % 2 ? '#2A2118' : C.gold, label: C.paper, r: 0.06, h: 0.12 });
  p.pr(-2.15, 1.87, ZB + 0.12, 0.07, 0.07, 0.6, C.newsL, 8, 0, Math.PI / 2);
  paperStack(p, -1.4, 1.8, ZB + 0.12, { w: 0.34, d: 0.2, n: 8, col: '#E9E1CC' });
  p.box(-0.85, 1.9, ZB + 0.12, 0.08, 0.2, 0.08, C.maroon);
  solid(room, -1.9, CZ, 2.7, 0.6);
  // the high stool between them
  const hs = p.at(-1.9, -2.6);
  hs.pr(0, 0.72, 0, 0.17, 0.17, 0.05, C.woodL, 8);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 4; hs.box(Math.sin(a) * 0.12, 0.35, Math.cos(a) * 0.12, 0.04, 0.72, 0.04, C.woodD, Math.cos(a) * 0.08, 0, -Math.sin(a) * 0.08); }
  hs.pr(0, 0.25, 0, 0.13, 0.13, 0.03, C.woodD, 4);
  solid(room, -1.9, -2.6, 0.36, 0.36);

  // --- the imposing stone (0.5, -1.4): stone top on a wood base, the chase with type, tools ---
  const ST = { x: 0.5, z: -1.4, w: 1.8, d: 1.0, h: 0.9 };
  const sq = p.at(ST.x, ST.z);
  sq.bm(-ST.w / 2 + 0.05, 0, -ST.d / 2 + 0.05, ST.w / 2 - 0.05, 0.08, ST.d / 2 - 0.05, C.woodD);
  sq.bm(-ST.w / 2 + 0.05, 0.08, -ST.d / 2 + 0.05, ST.w / 2 - 0.05, ST.h - 0.1, ST.d / 2 - 0.05, C.wood);
  for (let r = 0; r < 2; r++) {
    sq.bm(-ST.w / 2 + 0.12, 0.14 + r * 0.32, ST.d / 2 - 0.05, ST.w / 2 - 0.12, 0.42 + r * 0.32, ST.d / 2 - 0.04, C.woodD); // open bays
    for (let k = 0; k < 4; k++) sq.box(-0.55 + k * 0.36, 0.16 + r * 0.32 + 0.02 + k * 0.004, ST.d / 2 - 0.2, 0.3, 0.012 + (k % 2) * 0.02, 0.3, k % 2 ? '#E9E1CC' : C.iron); // chases, paper
  }
  sq.bm(-ST.w / 2, ST.h - 0.1, -ST.d / 2, ST.w / 2, ST.h - 0.02, ST.d / 2, '#8E8A84'); // the stone
  sq.bm(-ST.w / 2 + 0.02, ST.h - 0.02, -ST.d / 2 + 0.02, ST.w / 2 - 0.02, ST.h, ST.d / 2 - 0.02, '#A3A09A');
  for (let i = 0; i < 5; i++) d.box(ST.x - 0.6 + i * 0.3, ST.h + 0.001, ST.z + Math.sin(i * 3.1) * 0.3, 0.12, 0.002, 0.08, '#8A8680');
  // Day 8: the chase with set type, tools, the turnblock and a proof. Day 14: the stone is cleared
  // and the Sayings `match` is laid out on it (lesson 23: whose words these are).
  if (!d14) {
    // the chase (iron frame) with set type, quoins and furniture
    const ch = p.at(ST.x - 0.25, ST.z - 0.05, 0, ST.h);
    ch.bm(-0.32, 0, -0.24, 0.32, 0.04, -0.2, C.ironD);
    ch.bm(-0.32, 0, 0.2, 0.32, 0.04, 0.24, C.ironD);
    ch.bm(-0.32, 0, -0.2, -0.28, 0.04, 0.2, C.ironD);
    ch.bm(0.28, 0, -0.2, 0.32, 0.04, 0.2, C.ironD);
    for (let r = 0; r < 5; r++) ch.bm(-0.24, 0, -0.16 + r * 0.07, 0.24 - (r === 4 ? 0.2 : 0), 0.035, -0.11 + r * 0.07, r % 2 ? '#6E6A64' : '#7C766E');
    ch.bm(-0.27, 0, -0.19, 0.27, 0.025, -0.17, C.woodL);
    ch.bm(0.25, 0, -0.18, 0.27, 0.03, 0.18, C.woodL);
    // the mallet and planer
    const ml = p.at(ST.x + 0.45, ST.z + 0.25, 0.5, ST.h);
    ml.box(0, 0.04, 0, 0.12, 0.08, 0.08, C.woodL);
    ml.box(0.16, 0.035, 0, 0.22, 0.03, 0.03, C.woodD);
    p.box(ST.x + 0.35, ST.h + 0.03, ST.z - 0.25, 0.22, 0.05, 0.1, C.woodL);
    // the 'six' type block (the turnblock), standing on the stone's front edge
    const tb = p.at(ST.x + 0.2, ST.z + 0.32, 0.25, ST.h);
    tb.bm(-0.06, 0, -0.06, 0.06, 0.12, 0.06, C.woodL);
    tb.bm(-0.05, 0.12, -0.05, 0.05, 0.13, 0.05, '#7C766E');
    tb.box(0.01, 0.133, 0.0, 0.05, 0.006, 0.014, C.ink, 0, 0.4, 0); // the carved figure (a stroke, not a digit)
    tb.box(-0.012, 0.133, 0.015, 0.016, 0.006, 0.04, C.ink);
    // a proof on the stone
    const proof = A.draw(130, 170, (g, w, h) => drawDaySheet(g, w, h, { seed: 7 }));
    A.quad(proof, 0.26, 0.34, M(ST.x + 0.62, ST.h + 0.004, ST.z - 0.1, -Math.PI / 2, 0, -0.2));
  } else {
    // saying slips (left, a quote mark + print, the name stripped off) and name cards (right), face
    // up in two columns, large enough to read as slips at phone size; a composing stick at the end
    const sayR = [0, 1, 2, 3].map((k) => A.draw(230, 70, (g, w, h) => {
      paperBg(g, w, h, { bg: '#FBF7EE', edge: '#C9A24A', seed: 40 + k });
      text(g, '“', w * 0.07, h * 0.42, { size: h * 0.7, family: FONT_SERIF, color: C.goldD });
      printLines(g, w * 0.15, h * 0.24, w * 0.78, h * 0.6, { cols: 1, gap: h * 0.17, lw: Math.max(3, h * 0.07), seed: 7 + k, color: '#4A4038' });
    }));
    const NAMES = ['မိုးမိုး', 'ဦးတင့်', 'မသီတာ', 'ဒေါ်စိန်']; // drafts for Maya
    const nameR = NAMES.map((n, k) => A.draw(140, 60, (g, w, h) => {
      paperBg(g, w, h, { bg: '#F4E6C2', edge: C.maroon, seed: 50 + k });
      text(g, n, w / 2, h * 0.55, { size: h * 0.46, color: '#6E1F2A', max: w * 0.86 });
    }));
    const order = [2, 0, 3, 1]; // name cards shuffled (the pairing is the player's to make)
    for (let k = 0; k < 4; k++) {
      const z = ST.z - 0.34 + k * 0.22;
      A.quad(sayR[k], 0.62, 0.19, M(ST.x - 0.2, ST.h + 0.004 + k * 0.0005, z, -Math.PI / 2, 0, Math.sin(k * 2.1) * 0.04));
      A.quad(nameR[order[k]], 0.36, 0.155, M(ST.x + 0.52, ST.h + 0.004 + k * 0.0005, z + Math.sin(k * 1.3) * 0.02, -Math.PI / 2, 0, Math.sin(k * 3.7) * 0.07));
    }
    p.box(ST.x - 0.2, ST.h + 0.002, ST.z + 0.455, 0.7, 0.003, 0.012, C.gold); // a gold rule line under the slips
    p.box(ST.x + 0.78, ST.h + 0.02, ST.z - 0.38, 0.06, 0.04, 0.3, C.steel); // composing stick
    p.box(ST.x + 0.78, ST.h + 0.045, ST.z - 0.38, 0.05, 0.012, 0.26, C.ironL);
    p.box(ST.x - 0.78, ST.h + 0.03, ST.z - 0.3, 0.12, 0.06, 0.1, C.woodL, 0, 0.4, 0); // a quoin key block
  }
  solid(room, ST.x, ST.z, ST.w, ST.d);

  // --- the hand press (2.7, -2.5), turned -pi/2: bed and bar toward the room; bar animated ---
  const PX = 2.7, PZ = -2.5, PR = -Math.PI / 2;
  const pq = p.at(PX, PZ, PR);
  // wooden stand + rails
  pq.bm(-0.5, 0, -0.45, 0.5, 0.08, 0.45, C.woodD);
  for (const sx of [-1, 1]) {
    pq.bm(sx * 0.42 - 0.05, 0, -0.45, sx * 0.42 + 0.05, 0.72, -0.35, C.woodD);
    pq.bm(sx * 0.42 - 0.05, 0, 0.55, sx * 0.42 + 0.05, 0.72, 0.65, C.woodD);
    pq.bm(sx * 0.3 - 0.03, 0.72, -0.45, sx * 0.3 + 0.03, 0.78, 0.7, C.ironD); // rails
  }
  pq.bm(-0.36, 0.78, -0.42, 0.36, 0.84, 0.4, C.iron); // bed
  pq.bm(-0.28, 0.84, -0.32, 0.28, 0.86, 0.3, '#7C766E'); // type form on the bed
  // tympan + frisket folded open at the front
  pq.bm(-0.32, 0.84, 0.42, 0.32, 0.87, 0.95, C.ironL);
  pq.bm(-0.28, 0.87, 0.46, 0.28, 0.875, 0.9, '#F1ECE1');
  // the iron frame: two cheeks, the head, the platen
  for (const sx of [-1, 1]) {
    pq.bm(sx * 0.48 - 0.07, 0.72, -0.12, sx * 0.48 + 0.07, 1.62, 0.12, C.iron);
    pq.bm(sx * 0.48 - 0.09, 0.72, -0.15, sx * 0.48 + 0.09, 0.8, 0.15, C.ironD);
    pq.box(sx * 0.48, 1.25, 0.125, 0.06, 0.06, 0.012, C.gold); // a brass boss
  }
  pq.bm(-0.58, 1.55, -0.14, 0.58, 1.72, 0.14, C.iron); // head
  pq.bm(-0.3, 1.72, -0.06, 0.3, 1.78, 0.06, C.gold); // the crown ornament
  pq.box(0, 1.84, 0, 0.12, 0.12, 0.05, C.gold, 0, 0, Math.PI / 4);
  pq.bm(-0.06, 1.2, -0.06, 0.06, 1.55, 0.06, C.ironD); // the screw
  pq.bm(-0.34, 1.12, -0.28, 0.34, 1.18, 0.28, C.ironL); // platen (rests just above)
  pq.bm(-0.36, 1.1, -0.3, 0.36, 1.12, 0.3, C.iron);
  solid(room, PX - 0.15, PZ, 1.25, 1.2);
  // the bar: its own small mesh, pivots at the screw (pull 0..1 swings it toward the room)
  const barG = new THREE.Group();
  barG.name = 'pressBar';
  barG.position.set(PX, 1.38, PZ);
  barG.rotation.y = PR;
  const bv = new VoxelBuilder();
  bv.box(0, 0, 0, 0.12, 0.1, 0.12, C.ironD);
  bv.box(0.33, 0, 0.12, 0.62, 0.05, 0.05, C.iron, 0.35);
  bv.box(0.68, 0, 0.36, 0.1, 0.07, 0.07, C.woodL, 0.35);
  bv.box(0.74, 0, 0.4, 0.16, 0.08, 0.08, C.woodD, 0.35);
  const barMesh = bv.mesh({ px: 1.4 });
  barMesh.userData.dynamic = true;
  barMesh.children.forEach((c) => (c.userData.dynamic = true));
  const barPivot = new THREE.Group();
  barPivot.add(barMesh);
  barG.add(barPivot);
  room.group.add(barG);
  const pull = (t) => { barPivot.rotation.y = -Math.max(0, Math.min(1, t)) * 1.1; };

  // --- delivery table (2.6, -0.9) with printed sheets; ink slab + roller rack on the right wall ---
  room.place(kit.table({ w: 1.0, d: 0.7, h: 0.78, top: C.woodL, legs: C.woodD }), 2.6, -0.9);
  const sheetR = A.draw(130, 170, (g, w, h) => drawDaySheet(g, w, h, { seed: 3 }));
  for (let i = 0; i < 3; i++) {
    paperStack(p, 2.4 + i * 0.02, 0.78, -0.95 + i * 0.01, { w: 0.3, d: 0.4, n: 4 - i, ry: 0.06 * i, col: '#F1ECE1' });
  }
  A.quad(sheetR, 0.3, 0.4, M(2.42, 0.78 + 0.052, -0.94, -Math.PI / 2, 0, 0.12));
  A.quad(sheetR, 0.3, 0.4, M(2.85, 0.785, -0.85, -Math.PI / 2, 0, -0.25));
  const rk = p.at(hw - 0.05, -1.55, -Math.PI / 2);
  rk.bm(-0.45, 1.25, 0, 0.45, 1.3, 0.12, C.woodD);
  for (let i = 0; i < 3; i++) {
    rk.box(-0.3 + i * 0.3, 1.18, 0.08, 0.02, 0.14, 0.02, C.ironD);
    rk.pr(-0.3 + i * 0.3, 1.08, 0.1, 0.035, 0.035, 0.2, i === 1 ? '#3A3020' : C.ink, 8, 0, Math.PI / 2);
  }
  rk.bm(-0.45, 0.78, 0, 0.45, 0.82, 0.4, C.woodD); // ink slab shelf
  rk.bm(-0.4, 0.82, 0.05, 0.4, 0.85, 0.36, '#3A3632');
  rk.bm(-0.2, 0.851, 0.12, 0.25, 0.853, 0.3, C.gold); // gold ink rolled out
  for (const sx of [-1, 1]) rk.box(sx * 0.4, 0.4, 0.2, 0.05, 0.8, 0.05, C.woodD);
  solid(room, hw - 0.25, -1.55, 0.42, 0.95);

  // --- drying line across the back (z -3.0, y 2.3): eight day sheets, one with the misprint ---
  const LINE_Y = 2.3, LINE_Z = -3.0;
  p.bm(-3.5, LINE_Y - 0.006, LINE_Z - 0.006, 3.5, LINE_Y + 0.006, LINE_Z + 0.006, '#D8C9A6');
  for (const sx of [-1, 1]) p.bm(sx * hw - 0.06 * sx, LINE_Y - 0.05, LINE_Z - 0.04, sx * hw, LINE_Y + 0.05, LINE_Z + 0.04, C.bronze);
  const sheetXs = [-3.15, -2.5, -1.85, -1.2, -0.55, 2.0, 2.65, 3.3];
  const lineQuads = [];
  const misR = A.draw(130, 170, (g, w, h) => drawDaySheet(g, w, h, { seed: 5, misprint: true }));
  const daySheets = [1, 2, 3].map((s) => A.draw(130, 170, (g, w, h) => drawDaySheet(g, w, h, { seed: 10 + s })));
  sheetXs.forEach((x, i) => {
    A.quad(i === 3 ? misR : daySheets[i % 3], 0.4, 0.52, M(x, LINE_Y - 0.27, LINE_Z, 0, 0, Math.sin(i * 2.7) * 0.03), lineQuads);
    for (const dx of [-0.14, 0.14]) p.box(x + dx, LINE_Y - 0.01, LINE_Z, 0.025, 0.07, 0.03, C.woodL); // pegs
  });

  // --- right wall: the locker row (x 3.75, z -0.4..1.0, y 1.3): Nay Chi's box blank, a keyhole ---
  // A standing cabinet of six boxes against the wall, turned 0.5 rad toward the room so the fronts
  // read from the camera (a wall-flat row is edge-on at phone size). Nay Chi's box (top right,
  // i = 2) is the biggest, painted dark maroon, with a large pale blank tag and an iron keyhole plate.
  const LKR = -Math.PI / 2 + 0.5;
  const LKX = hw - 0.62, LKZ = 0.35;
  const lk = p.at(LKX, LKZ, LKR);
  const names = ['ဦးတင့်', 'ကိုဝဏ္ဏ', '', 'ကိုစံ', 'ကိုမင်း', 'ကိုထွန်း'];
  const tagR = names.map((n) => A.draw(96, 40, (g, w, h) => {
    g.fillStyle = n ? '#F4EBD6' : '#FFFDF6'; g.fillRect(0, 0, w, h);
    g.strokeStyle = n ? '#C9B48A' : '#D9CDB4'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
    if (n) text(g, n, w / 2, h * 0.55, { size: h * 0.52, color: '#2A2118', weight: 600, max: w * 0.9 });
  }));
  lk.bm(-0.74, 0, -0.2, 0.74, 0.08, 0.2, C.woodD); // plinth
  for (let i = 0; i < 4; i++) lk.box(-0.72 + i * 0.48, 0.45, -0.17, 0.05, 0.9, 0.05, C.woodD); // back legs
  for (const sx of [-1, 1]) lk.bm(sx * 0.74 - 0.03, 0.08, -0.2, sx * 0.74 + 0.03, 1.7, 0.2, C.wood); // sides
  lk.bm(-0.74, 0.08, -0.2, 0.74, 0.92, -0.17, C.woodD); // back of the low open shelf
  lk.bm(-0.74, 0.44, -0.2, 0.74, 0.47, 0.18, C.wood); // low shelf: rags, a tin, folded aprons
  lk.bm(-0.6, 0.47, -0.12, -0.25, 0.6, 0.12, '#3A3632');
  lk.bm(-0.58, 0.6, -0.1, -0.27, 0.62, 0.1, '#5A5650');
  tin(lk, 0.05, 0.47, 0.0, { col: C.gold, label: C.paper, r: 0.06, h: 0.13 });
  lk.bm(0.25, 0.47, -0.12, 0.62, 0.55, 0.14, '#C9B8A0');
  lk.bm(0.27, 0.55, -0.1, 0.6, 0.6, 0.12, '#8E7E62');
  lk.bm(-0.76, 0.92, -0.22, 0.76, 0.96, 0.22, C.woodD);
  lk.bm(-0.78, 1.7, -0.23, 0.78, 1.75, 0.23, C.woodD); // top
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const i = r * 3 + c, mine = i === 2;
    const x = -0.49 + c * 0.49, y = 1.13 + r * 0.38;
    const bw = 0.23, bh = 0.18, out = mine ? 0.05 : 0;
    lk.bm(x - bw, y - bh, -0.2, x + bw, y + bh, 0.18 + out, mine ? '#5A2630' : jitter(C.wood, 0.06, i));
    lk.bm(x - bw + 0.03, y - bh + 0.03, 0.18 + out, x + bw - 0.03, y + bh - 0.03, 0.195 + out, mine ? '#7A2F3A' : jitter(C.woodL, 0.06, i + 3)); // door
    const fz = 0.196 + out;
    // tag: brass slot + paper face (Nay Chi's: a big pale blank tag, nothing written yet)
    const tw = mine ? 0.24 : 0.17, th = mine ? 0.1 : 0.07;
    lk.bm(x - tw / 2 - 0.012, y + 0.04 - 0.012, fz, x + tw / 2 + 0.012, y + 0.04 + th + 0.012, fz + 0.006, C.gold);
    A.quad(tagR[i], tw, th, lk.base.clone().multiply(M(x, y + 0.04 + th / 2, fz + 0.009)));
    if (mine) {
      // iron keyhole plate: dark, big enough to read at 412 px
      lk.bm(x - 0.05, y - 0.15, fz, x + 0.05, y - 0.01, fz + 0.012, '#1E1A18');
      lk.bm(x - 0.017, y - 0.075, fz + 0.012, x + 0.017, y - 0.04, fz + 0.016, '#F4EBD6'); // keyhole: pale so the hole shape reads
      lk.bm(x - 0.008, y - 0.12, fz + 0.012, x + 0.008, y - 0.07, fz + 0.016, '#F4EBD6');
      lk.box(x - 0.042, y - 0.025, fz + 0.014, 0.012, 0.012, 0.008, C.steel); // rivets
      lk.box(x + 0.042, y - 0.025, fz + 0.014, 0.012, 0.012, 0.008, C.steel);
      lk.box(x - 0.042, y - 0.135, fz + 0.014, 0.012, 0.012, 0.008, C.steel);
      lk.box(x + 0.042, y - 0.135, fz + 0.014, 0.012, 0.012, 0.008, C.steel);
    } else {
      lk.box(x, y - 0.08, fz + 0.012, 0.06, 0.03, 0.02, C.bronze); // a pull
      if (i === 0) lk.bm(x + 0.08, y - bh + 0.02, fz, x + 0.2, y - 0.06, fz + 0.01, C.cloth); // a cloth caught in U Tint's door
    }
  }
  lk.bm(-0.2, 1.75, -0.12, 0.25, 1.87, 0.12, '#E9E1CC'); // a ream on top
  lk.pr(0.5, 1.82, 0.0, 0.05, 0.05, 0.14, '#2A2118', 8);
  {
    // collision: the turned cabinet's footprint, as an axis box round its corners
    const c = Math.cos(LKR), s = Math.sin(LKR), xs = [], zs = [];
    for (const [lx, lz] of [[-0.78, -0.23], [0.78, -0.23], [-0.78, 0.25], [0.78, 0.25]]) { xs.push(LKX + lx * c + lz * s); zs.push(LKZ - lx * s + lz * c); }
    room.obstacles.push({ type: 'box', minX: Math.min(...xs) - 0.04, maxX: Math.min(hw, Math.max(...xs)), minZ: Math.min(...zs) - 0.04, maxZ: Math.max(...zs) + 0.04 });
  }

  // --- left wall: the side door to the back yard (z -1.8) with daylight at its edge; the scrap
  //     crate inside it with the title block face down; the door bench; a broom; key hook (d14) ---
  const SDZ = -1.8;
  const sd = p.at(-hw + 0.02, SDZ, Math.PI / 2);
  sd.bm(-0.55, 0, -0.02, -0.45, 2.15, 0.1, '#1E1A18'); // ink-black frame
  sd.bm(0.45, 0, -0.02, 0.55, 2.15, 0.1, '#1E1A18');
  sd.bm(-0.55, 2.05, -0.02, 0.55, 2.2, 0.1, '#1E1A18');
  for (let i = 0; i < 5; i++) sd.bm(-0.45 + i * 0.18, 0.02, 0.0, -0.45 + (i + 1) * 0.18 - 0.012, 2.04, 0.05, jitter('#8A6A4C', 0.08, i));
  for (const y of [0.4, 1.65]) sd.bm(-0.44, y, 0.05, 0.42, y + 0.1, 0.07, '#6E5238');
  sd.box(0, 1.03, 0.06, 0.9, 0.08, 0.02, '#6E5238', 0, 0, -0.95); // the Z brace
  sd.bm(0.32, 1.0, 0.05, 0.4, 1.06, 0.09, C.ironD); // latch
  sd.bm(0.44, 0.02, 0.0, 0.46, 2.04, 0.04, '#FFF2C8'); // a crack of yard light
  const sc = p.at(-3.2, -0.7, 0.1);
  for (const sx of [-1, 1]) sc.bm(sx * 0.35 - 0.03, 0, -0.25, sx * 0.35 + 0.03, 0.45, 0.25, C.woodL);
  for (let i = 0; i < 3; i++) for (const sz of [-1, 1]) sc.bm(-0.35, 0.05 + i * 0.14, sz * 0.25 - 0.015, 0.35, 0.13 + i * 0.14, sz * 0.25 + 0.015, jitter(C.woodL, 0.08, i + sz));
  sc.bm(-0.32, 0.02, -0.22, 0.32, 0.05, 0.22, C.woodD);
  for (let i = 0; i < 9; i++) sc.box(Math.sin(i * 2.3) * 0.22, 0.36 + (i % 3) * 0.03, Math.cos(i * 1.9) * 0.14, 0.08 + (i % 3) * 0.04, 0.03, 0.05, i % 2 ? C.woodL : '#7C766E', 0, i * 0.7, 0);
  sc.bm(-0.18, 0.45, -0.07, 0.18, 0.51, 0.07, C.woodL); // the title block, face down
  sc.bm(-0.18, 0.44, -0.07, 0.18, 0.45, 0.07, '#5A5650');
  solid(room, -3.2, -0.7, 0.72, 0.56);
  bench(p, -2.4, 1.6, { len: 1.2, ry: Math.PI / 2 });
  solid(room, -2.4, 1.6, 0.34, 1.2);
  paperStack(p, -2.4, 0.42, 1.85, { w: 0.22, d: 0.28, n: 3, col: '#F4EEE0' }); // Ko Wunna's drafts
  broom(p, -1.25, 3.55, { ry: 0.3 });
  p.bm(-3.6, 0, -2.75, -3.2, 0.36, -2.25, '#E9E1CC'); // paper reams by the cases
  p.bm(-3.6, 0.12, -2.75, -3.2, 0.14, -2.25, C.maroon);
  p.bm(-3.58, 0.36, -2.72, -3.22, 0.5, -2.3, '#F1ECE1');
  solid(room, -3.4, -2.5, 0.42, 0.52);
  oilLamp(p, -hw + 0.19, 2.15, 0.2, { ry: Math.PI / 2 });
  oilLamp(p, hw - 0.19, 2.2, -2.4, { ry: -Math.PI / 2 });
  // front right: paper stock (reams on a pallet, a big roll, tied bundles of printed sheets)
  const ps = p.at(3.0, 2.55);
  ps.bm(-0.6, 0, -0.45, 0.6, 0.1, 0.45, C.woodD);
  for (let i = 0; i < 3; i++) ps.bm(-0.6, 0.02, -0.4 + i * 0.4, 0.6, 0.08, -0.3 + i * 0.4, C.wood);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) {
    ps.box(-0.28 + c * 0.56, 0.16 + r * 0.12, -0.18, 0.52, 0.11, 0.42, (r + c) % 2 ? '#EFE9DC' : '#E3DCCB', 0, Math.sin(r * 2.1 + c) * 0.04, 0);
    ps.box(-0.28 + c * 0.56, 0.16 + r * 0.12, 0.031, 0.53, 0.03, 0.006, C.maroon, 0, Math.sin(r * 2.1 + c) * 0.04, 0);
  }
  ps.pr(0, 0.21, 0.32, 0.11, 0.11, 1.1, '#F1ECE1', 10, 0, Math.PI / 2);
  ps.pr(0, 0.21, 0.32, 0.04, 0.04, 1.12, C.woodD, 8, 0, Math.PI / 2);
  solid(room, 3.0, 2.55, 1.2, 0.9);
  const bq = p.at(-3.2, 2.8, 0.2);
  for (let i = 0; i < 3; i++) {
    bq.box(0, 0.08 + i * 0.16, 0, 0.5, 0.15, 0.36, i % 2 ? C.newsL : C.news, 0, i * 0.15, 0);
    bq.box(0, 0.08 + i * 0.16, 0, 0.012, 0.16, 0.37, '#C9A576', 0, i * 0.15, 0);
  }
  tin(p, -2.8, 0, 3.2, { col: C.gold, label: C.paper, r: 0.09, h: 0.2 });
  tin(p, -2.6, 0, 3.35, { col: '#2A2118', label: C.paper, r: 0.09, h: 0.2 });
  solid(room, -3.1, 2.9, 0.75, 0.6);
  // kit wall clock over the door bench side
  clockFrame(p, -3.45, 2.45, ZB + 0.04, 0.15);
  A.quad(A.draw(96, 96, (g, w, h) => drawClock(g, w, h, 7, 55)), 0.25, 0.25, M(-3.45, 2.45, ZB + 0.068));

  // --- front floor (both days; the door path stays clear): a jute sack of rags, a waste basket of
  //     spoiled proofs, a galley tray dropped with its sorts spilled, an inky rag, a crate of old chases ---
  const sk = p.at(1.15, 3.05, 0.4);
  sk.pr(0, 0.2, 0, 0.2, 0.23, 0.4, '#B89A6A', 8);
  sk.pr(0, 0.42, 0, 0.13, 0.19, 0.06, '#A88A5A', 8);
  sk.pr(0, 0.47, 0, 0.06, 0.06, 0.06, '#9C7E50', 6);
  sk.box(0, 0.44, 0, 0.27, 0.02, 0.02, '#6E5238');
  sk.box(0, 0.2, 0.215, 0.18, 0.08, 0.01, C.maroon); // a stencilled band
  solid(room, 1.15, 3.05, 0.46, 0.46);
  basketInto(p, -1.45, 2.5, { r: 0.17, h: 0.3, col: '#B48C5E' });
  for (let i = 0; i < 4; i++) p.box(-1.45 + Math.sin(i * 2.4) * 0.07, 0.33 + (i % 2) * 0.03, 2.5 + Math.cos(i * 2.4) * 0.06, 0.09, 0.08, 0.09, i % 2 ? '#F1ECE1' : '#E3DCCB', i, i * 0.7, i * 0.4); // crumpled proofs
  p.box(-1.12, 0.04, 2.72, 0.09, 0.08, 0.09, '#F1ECE1', 0.4, 0.3, 0.7);
  p.box(-1.7, 0.04, 2.2, 0.08, 0.07, 0.08, '#E9E1CC', 0.2, 0.9, 0.3);
  solid(room, -1.45, 2.5, 0.38, 0.38);
  const gl = p.at(-0.55, 0.8, 0.5); // the dropped galley: a shallow tray on its side, sorts spilled out
  gl.bm(-0.18, 0, -0.12, 0.18, 0.025, 0.12, C.woodL);
  gl.bm(-0.18, 0.025, -0.12, 0.18, 0.07, -0.1, C.wood);
  gl.bm(-0.18, 0.025, -0.12, -0.16, 0.07, 0.12, C.wood);
  for (let i = 0; i < 11; i++) {
    const a = i * 2.39, r = 0.14 + (i % 4) * 0.06;
    gl.box(0.1 + Math.cos(a) * r, 0.016, 0.12 + Math.sin(a) * r * 0.7, 0.035, 0.032, 0.03, i % 3 ? '#7C766E' : '#B8B4AA', 0, a, i % 2 ? Math.PI / 2 : 0);
  }
  d.bm(0.38, 0.002, 0.18, 0.74, 0.008, 0.44, '#4A3A30'); // the inky rag
  p.box(0.55, 0.012, 0.3, 0.3, 0.016, 0.2, '#5A4A3E', 0, 0.3, 0);
  p.box(0.6, 0.022, 0.32, 0.1, 0.004, 0.08, C.gold, 0, 0.3, 0); // a gold-ink smear on it
  const cr = p.at(-2.05, 3.25, -0.15); // crate of old chases
  for (const sx of [-1, 1]) cr.bm(sx * 0.28 - 0.025, 0, -0.2, sx * 0.28 + 0.025, 0.32, 0.2, C.woodL);
  for (let i = 0; i < 2; i++) for (const sz of [-1, 1]) cr.bm(-0.28, 0.04 + i * 0.15, sz * 0.2 - 0.012, 0.28, 0.14 + i * 0.15, sz * 0.2 + 0.012, jitter(C.woodL, 0.08, i + sz));
  cr.bm(-0.25, 0.01, -0.18, 0.25, 0.04, 0.18, C.woodD);
  for (let i = 0; i < 3; i++) {
    const f = cr.at(-0.12 + i * 0.12, 0, 0.1 * (i - 1), 0.04);
    f.box(0, 0.26, 0, 0.03, 0.42, 0.34, C.ironD, 0, 0, 0.12 * (i - 1));
    f.box(0, 0.26, 0, 0.032, 0.34, 0.26, '#6E6A64', 0, 0, 0.12 * (i - 1));
  }
  solid(room, -2.05, 3.25, 0.62, 0.46);

  // --- Day 14: the frame bench front right (2.1, 1.6) with a type frame under a lamp, booklet
  //     bundles; the key board by the door with Nay Chi's key; U Tint's teacup on the door bench ---
  if (d14) {
    const fb = p.at(2.1, 1.6);
    fb.bm(-0.7, 0.68, -0.35, 0.7, 0.74, 0.35, C.woodL);
    fb.bm(-0.72, 0.655, -0.37, 0.72, 0.68, 0.37, C.wood);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) fb.box(sx * 0.62, 0.34, sz * 0.28, 0.06, 0.68, 0.06, C.woodD);
    fb.bm(-0.62, 0.15, -0.28, 0.62, 0.18, 0.28, C.woodD);
    fb.bm(-0.55, 0.18, -0.24, -0.1, 0.3, 0.24, '#E9E1CC'); // paper under the bench
    fb.bm(-0.62, 0.74, -0.3, 0.2, 0.745, 0.3, '#3A3632'); // a dark felt to work on
    const fr = fb.at(-0.2, 0, 0, 0.745); // the type frame being locked up (larger, gold quoins)
    fr.bm(-0.36, 0, -0.26, 0.36, 0.045, -0.21, C.ironD);
    fr.bm(-0.36, 0, 0.21, 0.36, 0.045, 0.26, C.ironD);
    fr.bm(-0.36, 0, -0.21, -0.31, 0.045, 0.21, C.ironD);
    fr.bm(0.31, 0, -0.21, 0.36, 0.045, 0.21, C.ironD);
    for (let r = 0; r < 4; r++) fr.bm(-0.27, 0, -0.17 + r * 0.085, 0.12 + (r % 2) * 0.1, 0.035, -0.11 + r * 0.085, r % 2 ? '#6E6A64' : '#8A847C');
    for (const qz of [-0.12, 0.08]) fr.bm(0.24, 0, qz, 0.3, 0.04, qz + 0.06, C.gold); // quoins
    fb.box(0.42, 0.78, 0.08, 0.1, 0.07, 0.1, C.woodL); // quoin key block
    fb.box(0.42, 0.835, 0.08, 0.025, 0.04, 0.12, C.steel);
    for (let i = 0; i < 2; i++) { // booklet bundles, tied (the cargo)
      const bb = fb.at(0.5, -0.12 + i * 0.26, 0.15 * i, 0.74);
      for (let k = 0; k < 4; k++) bb.box(0, 0.02 + k * 0.035, 0, 0.2, 0.032, 0.15, k % 2 ? '#E8C97A' : C.cream);
      bb.box(0, 0.075, 0, 0.012, 0.15, 0.16, '#C9A576');
      bb.box(0, 0.075, 0, 0.21, 0.15, 0.012, '#C9A576');
    }
    solid(room, 2.1, 1.6, 1.44, 0.74);
    // key board on the left wall by the door: three brass hooks, Nay Chi's own key (gold, a red tag)
    const kb = p.at(-hw + 0.02, 0.95, Math.PI / 2, 1.38);
    kb.bm(-0.22, -0.1, 0, 0.22, 0.1, 0.035, C.woodD);
    kb.bm(-0.2, -0.08, 0.035, 0.2, 0.08, 0.045, C.woodL);
    for (let i = 0; i < 3; i++) {
      const hx = -0.13 + i * 0.13;
      kb.box(hx, 0.02, 0.07, 0.02, 0.02, 0.06, C.bronze);
      kb.box(hx, 0.045, 0.1, 0.02, 0.04, 0.015, C.bronze);
    }
    kb.box(0.0, -0.04, 0.085, 0.03, 0.1, 0.012, C.gold); // the key: shank
    kb.box(0.0, 0.0, 0.085, 0.06, 0.04, 0.014, C.gold); // bow
    kb.box(0.02, -0.08, 0.085, 0.03, 0.02, 0.012, C.gold); // bit
    kb.box(-0.05, -0.08, 0.09, 0.05, 0.07, 0.008, C.red, 0, 0, 0.2); // its tag
    kb.box(-0.13, -0.03, 0.085, 0.022, 0.09, 0.012, C.ironL); // an iron key on the first hook
    // U Tint's teacup and a small pot on the door bench
    cup(p, -2.4, 0.42, 1.15, { col: '#E9DFC9', tea: '#B9864E' });
    teapot(p, -2.15, 0, 1.15, { col: '#3E7C66', s: 0.9 });
    // folded booklets on the delivery table (Day 14's printing)
    for (let i = 0; i < 3; i++) p.bm(2.75, 0.79 + i * 0.03, -1.15 + i * 0.01, 3.0, 0.815 + i * 0.03, -0.98 + i * 0.01, i % 2 ? C.cream : '#E8C97A');
  }

  const life = createLife(room, {
    windows: [WIN],
    lamps: [
      { x: -hw + 0.19, y: 2.2, z: 0.2, r: 1.6, px: -2.8, pz: 0.6 },
      { x: hw - 0.19, y: 2.25, z: -2.4, r: 1.5, px: 2.6, pz: -1.6 },
      { x: ST.x, y: 1.5, z: ST.z, core: false, r: 1.6, px: ST.x, pz: ST.z + 0.6 },
    ],
    shaft: { dx: -0.3, len: 2.4 },
  });

  // drying sheets: their own atlas mesh, swaying (CPU, no allocation per frame)
  const lineMesh = A.mesh(lineQuads, 'dryingSheets');
  room.group.add(lineMesh);
  const lpos = lineMesh.geometry.attributes.position;
  const base = Float32Array.from(lpos.array);
  const sway = (dt, t) => {
    for (let i = 0; i < lpos.count; i++) {
      const y = base[i * 3 + 1];
      const k = Math.max(0, (LINE_Y - 0.05 - y) / 0.5);
      const s = Math.floor(i / 6);
      lpos.array[i * 3 + 2] = base[i * 3 + 2] + k * 0.05 * Math.sin(t * 1.3 + s * 1.7);
    }
    lpos.needsUpdate = true;
  };
  jumbleTo(opts.jumbled ?? false);
  pull(0);

  const spots = {
    utint: { x: -1.3, z: -2.88, h: 0.45, look: { x: -0.7, z: -1.4 } }, // at case B, turned from it to the room
    utintStone: { x: ST.x, z: -2.2, h: 0 }, // behind the stone, facing the room
    utintBench: { x: -2.4, z: 1.6, h: 1.15, seat: 0.42 }, // Day 14: on the door bench with a teacup
    kowunnaCases: { x: -2.6, z: -2.85, h: -0.5 }, // at case A, turned round
    kowunnaStone: { x: -0.7, z: -1.4, h: 0.75, look: { x: ST.x + 0.9, z: -1.15 } }, // the stone's left end, 3/4 to the room
    kowunnaBench: { x: -2.4, z: 1.6, h: 1.15, seat: 0.42 }, // waits here during the talk
    maya: { x: ST.x + 1.12, z: -1.15, h: -0.5, look: { x: -0.7, z: -1.4 } }, // the stone's right end, 3/4 (the match stays in view)
    mayaFront: { x: ST.x, z: -0.5, h: Math.PI }, // in front of the stone
    mayaCrate: { x: -2.55, z: -0.75, h: -Math.PI / 2 },
    mayaPress: { x: 1.75, z: -2.2, h: Math.PI / 2 },
    naychi: { x: 1.6, z: 1.0, h: 0.3, look: { x: 2.6, z: 1.0 } }, // Day 14: at the frame bench, showing the newcomer
    newcomer: { x: 2.6, z: 1.0, h: -0.3, look: { x: 1.6, z: 1.0 } },
    door: { x: 0, z: hd - 0.6, h: Math.PI },
  };
  const stations = [
    station('cases', -1.9, -2.1, [-1.9, CZ], { r: 0.9, labelY: 1.6 }),
    station('labels', -1.2, -2.6, [-1.2, CZ + 0.26], { r: 0.7, labelY: 1.0 }),
    station('stone', ST.x, -0.55, [ST.x, ST.z], { r: 0.9, labelY: 1.3 }),
    station('scrapCrate', -2.5, -0.7, [-3.2, -0.7], { r: 0.7, labelY: 0.9 }),
    station('pressBar', 1.75, -2.0, [PX, PZ], { r: 0.8, labelY: 1.8 }),
    station('locker', 2.42, 0.5, [LKX, LKZ], { r: 0.7, labelY: 1.6 }),
    station('sideDoor', -3.1, -1.8, [-hw, SDZ], { r: 0.7, labelY: 2.0 }),
    station('dryingLine', -1.2, -2.2, [-1.2, LINE_Z], { r: 0.6, labelY: 2.4 }),
  ];
  const cast = d14
    ? [{ id: 'kowunna', spot: 'kowunnaStone' }, { id: 'naychi', spot: 'naychi' }, { id: 'newcomer', spot: 'newcomer' }, { id: 'utint', spot: 'utintBench' }]
    : [{ id: 'utint', spot: 'utint' }, { id: 'kowunna', spot: 'kowunnaStone' }];
  return finish(room, v, A, life, {
    id: 'press',
    name: { my: 'ရွှေမင် ပုံနှိပ်တိုက်', en: 'the Gold Ink Press' },
    spots,
    stations,
    cast,
    decals: dv,
    cam: { tilt: 54, width: 7.2, lookZ: -0.4 },
    animators: [sway],
    handles: { setJumbled, pull, pressBar: barG },
    extraDispose: [() => sorts.dispose(), () => lineMesh.geometry.dispose(), () => barMesh.geometry.dispose()],
  });
}

// ---------------------------------------------------------------------------------------------
// the export: a story hook enters a room with `await ROOMS[id].build(opts)`
//   letterroom  opts { jars = 12, basket = 0 }
//   junctiontea opts { hoard = 9 }
//   schoolroom  opts { pots = false }
//   press       opts { dressing: 'd14', jumbled = false }
// ---------------------------------------------------------------------------------------------
// walk-ons named in the rooms' cast lists (not in cast.js): doors.js draws them from these looks
export const WALKONS = {
  drinker1: { age: 'adult', build: 'mid', skin: 3, hair: 'short', top: 'shirt', topColor: 'olive', bottom: 'longyi', bottomColor: 'charcoal', check: true, seed: 21 },
  drinker2: { age: 'elder', build: 'slim', skin: 2, hair: 'bald', hairColor: 'white', top: 'eingyi', topColor: 'white', bottom: 'longyi', bottomColor: 'brown', seed: 23 },
  pupil1: { age: 'child', skin: 2, hair: 'short', top: 'school', bottom: 'schoolLongyi', extras: ['satchel'], extraColor: 'tan', seed: 25 },
  pupil2: { age: 'child', skin: 1, hair: 'braid', top: 'school', bottom: 'schoolSkirt', extras: ['thanaka'], seed: 27 },
  teacher: { age: 'adult', build: 'slim', skin: 1, hair: 'bun', top: 'blouse', topColor: 'white', bottom: 'htamein', bottomColor: 'schoolGreen', extras: ['glasses'], seed: 29 },
};
// their names in the dialogue box (dialog.say(..., { name })); drafts for Maya
export const WALKON_NAMES = {
  drinker1: { my: 'လက်ဖက်ရည်သောက်သူ', en: 'a tea drinker' },
  drinker2: { my: 'လက်ဖက်ရည်သောက်သူ', en: 'a tea drinker' },
  pupil1: { my: 'ကျောင်းသား', en: 'a pupil' },
  pupil2: { my: 'ကျောင်းသူ', en: 'a pupil' },
  teacher: { my: 'ဆရာမ', en: 'the teacher' },
};
export const ROOMS = {
  letterroom: { name: { my: 'မသီတာရဲ့ စာရေးခန်း', en: "Ma Thida's letter room" }, district: 'junction', build: buildLetterroom },
  junctiontea: { name: { my: 'ဒေါ်စိန်ရဲ့ လက်ဖက်ရည်ဆိုင်', en: "Daw Sein's tea shop" }, district: 'junction', build: buildJunctiontea },
  schoolroom: { name: { my: 'လမ်းဆုံ ကျောင်း', en: 'the Junction school' }, district: 'junction', build: buildSchoolroom },
  press: { name: { my: 'ရွှေမင် ပုံနှိပ်တိုက်', en: 'the Gold Ink Press' }, district: 'junction', build: buildPress },
  // the bridge hands' hut on the west bridgehead square (regions/junction.js has its door from Day 7 on).
  // One room, one builder: Day 7's own (day7-fold.js HUT_ROOM), loaded only when someone walks in; Day 7
  // registers the same spec itself (doors.registerRooms), so its dressing options keep working.
  bridgehut: {
    name: { my: 'တံတားစောင့် တဲ', en: "The bridge hands' hut" }, district: 'junction',
    async build(opts = {}) { const m = await import('../day7-fold.js'); return m.HUT_ROOM.build(opts); },
  },
};
