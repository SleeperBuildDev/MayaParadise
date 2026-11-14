// The stage every generic room (rooms/generic.js) is built on: the kit's dollhouse room + ONE canvas atlas
// (signs, window views, lamp glows) + light decals (sun patches and shafts by day, warm lamp pools at dusk,
// rain on the glass) + the look state (evening 0..1, rain 0..1). Same recipe as the hand-made story rooms
// (rooms/quarter.js makeStage), kept in its own file so the generic rooms touch nothing of theirs.
//
// Draw calls: baked statics + outline (2), atlas layers signs / views / glow (3), decals (up to 4, only the
// ones in use and visible), steam / motes (0-2), a ceiling fan (0-2). People add ~4 each (generic.js).
// Window views are painted per district and per time of day ('day' | 'dusk' | 'night') and repainted only
// when the phase or the rain changes. Every Burmese string is a DRAFT for Maya to proofread.
import * as kit from '../../game/interiors/kit.js';
import { fontsReady, FONT_MY, FONT_SERIF, roundRect } from '../../game/toon.js';
import { mergeGeometries } from '../../game/three.js';

export const { THREE, PALETTE: P, VoxelBuilder, jitter, basic } = kit;
export { kit, FONT_MY, FONT_SERIF };

// ---------------------------------------------------------------------------------------------
// small geometry helpers (build time only)
// ---------------------------------------------------------------------------------------------
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
export function M(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}
/** Box with any turn about its own centre. */
export function rb(v, x, y, z, w, h, d, col, rx = 0, ry = 0, rz = 0) { v.add(UNIT, col, M(x, y, z, rx, ry, rz, w, h, d)); }
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
export function cyl(v, x, y, z, rTop, rBot, h, col, seg = 8, rx = 0, rz = 0, ry = 0) { v.add(prismGeo(rTop, rBot, h, seg), col, M(x, y, z, rx, ry, rz)); }
/** Group holding a builder's mesh, with a collision footprint for room.place(). */
export function piece(v, fp, name = 'prop') {
  const g = new THREE.Group();
  g.name = name;
  g.add(v.mesh({ outline: true, px: 1.4 }));
  if (fp) g.userData.footprint = fp;
  return g;
}
/** Burmese digits. DRAFT(my) */
export const mm = (n) => String(n).replace(/[0-9]/g, (d) => '၀၁၂၃၄၅၆၇၈၉'[d]);
/** Seeded random (mulberry32): rand(seed)() -> 0..1 */
export function rand(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** A tiny seeded chooser: R.f() float, R.i(n) int, R.pick(arr), R.chance(p), R.range(a, b). */
export function chooser(seed) {
  const f = rand(seed);
  return {
    f,
    i: (n) => Math.floor(f() * n),
    pick: (a) => a[Math.floor(f() * a.length)],
    chance: (p) => f() < p,
    range: (a, b) => a + f() * (b - a),
  };
}
/** String -> 32-bit hash (FNV-1a). */
export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// ---------------------------------------------------------------------------------------------
// canvas drawing helpers
// ---------------------------------------------------------------------------------------------
export function txt(g, s, x, y, size, color = '#2A2118', { weight = 700, font = FONT_MY, align = 'center', maxW = 0, base = 'middle' } = {}) {
  g.font = `${weight} ${size}px ${font}`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = base;
  if (maxW) g.fillText(s, x, y, maxW); else g.fillText(s, x, y);
}
export function rr(g, x, y, w, h, r, fill, stroke = null, lw = 0) {
  roundRect(g, x, y, w, h, r);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
export function paperBg(g, w, h, col = '#F7F0DF', seed = 3) {
  g.fillStyle = col;
  g.fillRect(0, 0, w, h);
  const r = rand(seed);
  for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(120,90,50,${0.02 + r() * 0.03})`; g.fillRect(r() * w, r() * h, 2 + r() * 6, 1 + r() * 3); }
}
/** Hand-written scribble lines (letters, notes, exercise books). */
export function scribble(g, x, y, w, rows, gap, color = '#3A4A7A', seed = 1, lw = 2) {
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
    }
    g.stroke();
  }
}
/** Pencil hatching (the Blank Page's unfinished walls). */
export function hatch(g, x, y, w, h, gap = 9, color = 'rgba(70,64,56,0.35)', seed = 2, ang = 0.9) {
  const r = rand(seed);
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.strokeStyle = color; g.lineWidth = 1.4; g.lineCap = 'round';
  const L = w + h;
  for (let t = -L; t < L; t += gap * (0.8 + r() * 0.4)) {
    g.beginPath();
    g.moveTo(x + t, y + h);
    g.lineTo(x + t + Math.cos(ang) * L, y + h - Math.sin(ang) * L);
    g.stroke();
  }
  g.restore();
}
/** A wobbly pencil line (sketch). */
export function pencilLine(g, x0, y0, x1, y1, seed = 1, color = 'rgba(58,52,46,0.8)', lw = 2) {
  const r = rand(seed);
  g.strokeStyle = color; g.lineWidth = lw; g.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) {
    g.beginPath();
    g.moveTo(x0 + (r() - 0.5) * 2, y0 + (r() - 0.5) * 2);
    const n = 5;
    for (let i = 1; i <= n; i++) { const t = i / n; g.lineTo(x0 + (x1 - x0) * t + (r() - 0.5) * 2.2, y0 + (y1 - y0) * t + (r() - 0.5) * 2.2); }
    g.stroke();
  }
}

// ---------------------------------------------------------------------------------------------
// shared light textures (made once, kept: userData.shared)
// ---------------------------------------------------------------------------------------------
let poolTex = null, patchTex = null, shaftTex = null, rainTex = null;
function glowTexture() {
  if (poolTex) return poolTex;
  const s = 64, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(255,214,150,0.9)'); grd.addColorStop(0.5, 'rgba(255,190,120,0.35)'); grd.addColorStop(1, 'rgba(255,170,100,0)');
  g.fillStyle = grd; g.fillRect(0, 0, s, s);
  poolTex = new THREE.CanvasTexture(cv);
  poolTex.userData.shared = true;
  return poolTex;
}
function patchTexture() {
  if (patchTex) return patchTex;
  const s = 64, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  g.filter = 'blur(5px)'; g.fillStyle = 'rgba(255,236,190,1)'; g.fillRect(10, 10, s - 20, s - 20);
  patchTex = new THREE.CanvasTexture(cv);
  patchTex.userData.shared = true;
  return patchTex;
}
function shaftTexture() {
  if (shaftTex) return shaftTex;
  const cv = document.createElement('canvas');
  cv.width = 32; cv.height = 64;
  const g = cv.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 64);
  grd.addColorStop(0, 'rgba(255,240,205,0.95)'); grd.addColorStop(1, 'rgba(255,240,205,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 32, 64);
  const side = g.createLinearGradient(0, 0, 32, 0);
  side.addColorStop(0, 'rgba(0,0,0,1)'); side.addColorStop(0.2, 'rgba(0,0,0,0)'); side.addColorStop(0.8, 'rgba(0,0,0,0)'); side.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = side; g.fillRect(0, 0, 32, 64);
  shaftTex = new THREE.CanvasTexture(cv);
  shaftTex.userData.shared = true;
  return shaftTex;
}
function rainTexture() {
  if (rainTex) return rainTex;
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = 'rgba(70,90,110,0.35)'; g.fillRect(0, 0, 64, 128);
  const r = rand(11);
  g.strokeStyle = 'rgba(235,242,250,0.8)'; g.lineWidth = 1.5;
  for (let i = 0; i < 26; i++) { const x = r() * 64, y = r() * 128; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 12 + r() * 10); g.stroke(); }
  for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(240,248,255,0.7)'; g.beginPath(); g.arc(r() * 64, r() * 128, 1.5 + r() * 1.5, 0, 7); g.fill(); }
  rainTex = new THREE.CanvasTexture(cv);
  rainTex.wrapS = rainTex.wrapT = THREE.RepeatWrapping;
  rainTex.userData.shared = true;
  return rainTex;
}
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

// ---------------------------------------------------------------------------------------------
// the atlas: regions packed in rows, repainted when the font is in and when the window phase changes
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
      w = Math.min(w, size - 4); h = Math.min(h, 400);
      if (cx + w > size - 2) { cx = 2; cy += rowH + 3; rowH = 0; }
      const r = { x: cx, y: cy, w, h, u0: cx / size, u1: (cx + w) / size, v0: 1 - (cy + h) / size, v1: 1 - cy / size };
      cx += w + 3;
      rowH = Math.max(rowH, h);
      if (cy + h > size) console.warn('generic room atlas full');
      return r;
    },
    draw(w, h, fn) { const r = atlas.alloc(Math.round(w), Math.round(h)); ops.push([r, fn]); return r; },
    paint() {
      g.clearRect(0, 0, size, size);
      for (const [r, fn] of ops) {
        g.save(); g.translate(r.x, r.y); g.beginPath(); g.rect(0, 0, r.w, r.h); g.clip();
        try { fn(g, r.w, r.h); } catch (err) { console.warn('generic atlas paint', err); }
        g.restore();
      }
      if (atlas.tex) atlas.tex.needsUpdate = true;
    },
    quad(r, w, h, m, layer = 'signs') {
      const geo = new THREE.PlaneGeometry(w, h);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, r.u0 + uv.getX(i) * (r.u1 - r.u0), r.v0 + uv.getY(i) * (r.v1 - r.v0));
      geo.applyMatrix4(m);
      geos[layer].push(geo);
    },
    block(r, m, layer = 'glow') {
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (r.u0 + r.u1) / 2, (r.v0 + r.v1) / 2);
      geo.applyMatrix4(m);
      geos[layer].push(geo);
    },
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
        mesh.name = `generic-${layer}`;
        mesh.userData.dynamic = true;
        mesh.raycast = () => {};
        parent.add(mesh);
        out[layer] = mesh;
      }
      fontsReady().then(() => { if (atlas.tex) atlas.paint(); });
      return out;
    },
  };
  return atlas;
}

// ---------------------------------------------------------------------------------------------
// window views: what is outside, per district, per time of day, wet or dry
// ---------------------------------------------------------------------------------------------
const SKY = {
  day: ['#A9CBE6', '#F6E6CA'], dusk: ['#7E6C9C', '#F2B27E'], night: ['#1C2640', '#3B4A6E'],
  rainday: ['#8E9AA6', '#C9CED2'], raindusk: ['#5E6478', '#A08C86'], rainnight: ['#151B2A', '#2C3448'],
};
function roofs(g, w, h, y, cols, r, n = 4) {
  for (let i = 0; i < n; i++) {
    const x = (i / n) * w + (r() - 0.5) * 10, bw = w / n + 10, top = y - 8 - r() * 16;
    g.fillStyle = cols[i % cols.length];
    g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + bw / 2, top); g.lineTo(x + bw + 6, y); g.closePath(); g.fill();
  }
}
/** Paint a window view. look: { phase: 'day'|'dusk'|'night', rain: bool }. */
export function paintView(g, w, h, district, look, seed = 1) {
  const r = rand(seed * 7 + 3);
  const ph = look.phase, wet = look.rain;
  const night = ph === 'night', dusk = ph === 'dusk';
  const [top, bot] = SKY[(wet ? 'rain' : '') + ph];
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, top); sky.addColorStop(1, bot);
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  if (district === 'blank') {
    g.fillStyle = night ? '#3A3F52' : '#FBFAF6'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 4; k++) pencilLine(g, 0, h * (0.62 + k * 0.1), w, h * (0.6 + k * 0.1), seed + k, night ? 'rgba(220,220,230,0.4)' : 'rgba(70,64,56,0.35)', 1.5);
    pencilLine(g, w * 0.1, h * 0.62, w * 0.35, h * 0.35, seed + 7, night ? 'rgba(220,220,230,0.5)' : 'rgba(70,64,56,0.5)');
    pencilLine(g, w * 0.35, h * 0.35, w * 0.62, h * 0.6, seed + 8, night ? 'rgba(220,220,230,0.5)' : 'rgba(70,64,56,0.5)');
    if (!night) { g.strokeStyle = 'rgba(70,64,56,0.4)'; g.lineWidth = 2; g.beginPath(); g.arc(w * 0.78, h * 0.25, h * 0.1, 0, 5.6); g.stroke(); }
    return;
  }
  // sun / moon / stars
  if (night && !wet) {
    g.fillStyle = 'rgba(255,250,230,0.9)';
    for (let i = 0; i < 18; i++) g.fillRect(r() * w, r() * h * 0.5, 2, 2);
    g.beginPath(); g.arc(w * (0.2 + r() * 0.6), h * 0.2, h * 0.07, 0, 7); g.fill();
  } else if (!wet) {
    g.fillStyle = dusk ? 'rgba(255,200,140,0.9)' : 'rgba(255,255,255,0.85)';
    if (dusk) { g.beginPath(); g.arc(w * 0.7, h * 0.55, h * 0.12, 0, 7); g.fill(); }
    else for (let i = 0; i < 2; i++) { // soft round clouds (never stacked blocks: nothing that reads as a tiered spire)
      const cx = w * (0.15 + i * 0.5 + r() * 0.2), cy = h * (0.1 + r() * 0.12);
      for (const [dx, dy, rx] of [[0, 0, 16], [14, -5, 12], [27, 1, 13], [-12, 3, 10]]) { g.beginPath(); g.ellipse(cx + dx, cy + dy, rx, rx * 0.62, 0, 0, 7); g.fill(); }
    }
  }
  const dim = night ? 0.45 : dusk ? 0.78 : wet ? 0.82 : 1;
  const sh = (hex) => { const c = new THREE.Color(hex); c.multiplyScalar(dim); return '#' + c.getHexString(); };
  const litWin = (x, y, ww = 9, hh = 11) => { g.fillStyle = night || dusk ? '#FFD98A' : sh('#4A5562'); g.fillRect(x, y, ww, hh); };
  const hz = h * 0.58;
  if (district === 'wharf') {
    g.fillStyle = sh(wet ? '#7E95A0' : '#6FA3B8'); g.fillRect(0, hz, w, h - hz);
    g.fillStyle = sh('#8FBFCF'); for (let i = 0; i < 6; i++) g.fillRect(r() * w, hz + 6 + r() * (h - hz - 10), 18 + r() * 20, 2);
    g.fillStyle = sh('#6B4A30'); for (let i = 0; i < 4; i++) g.fillRect(w * (0.1 + i * 0.22), hz - 6, 5, h - hz); // jetty posts
    g.fillStyle = sh('#8C6A44'); g.fillRect(0, hz - 8, w, 5);
    g.fillStyle = sh('#4E3A2A'); g.beginPath(); const bx = w * (0.3 + r() * 0.4); g.moveTo(bx - 26, hz + 14); g.lineTo(bx + 26, hz + 14); g.lineTo(bx + 18, hz + 24); g.lineTo(bx - 18, hz + 24); g.fill(); // a boat
    g.fillRect(bx - 1, hz - 10, 2, 24);
    if (night) { g.fillStyle = '#FFD98A'; g.fillRect(bx + 2, hz + 2, 4, 4); }
  } else if (district === 'garden') {
    g.fillStyle = sh('#8DBA6E'); g.fillRect(0, hz, w, h - hz);
    g.fillStyle = sh('#4F7F43');
    for (let i = 0; i < 3; i++) { const tx = w * (0.15 + i * 0.35 + r() * 0.1); g.fillRect(tx - 2, hz - 30, 5, 30); g.beginPath(); g.arc(tx, hz - 34, 18 + r() * 6, 0, 7); g.fill(); }
    const fl = ['#E8A0A8', '#E2B33C', '#FBF7EE', '#D9558A'];
    for (let i = 0; i < 22; i++) { g.fillStyle = sh(fl[i % 4]); g.beginPath(); g.arc(r() * w, hz + 8 + r() * (h - hz - 12), 3 + r() * 2, 0, 7); g.fill(); }
    g.strokeStyle = sh('#C9A26A'); g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(i * w / 5, hz - 4); g.lineTo(i * w / 5, hz + 12); g.stroke(); }
  } else if (district === 'junction') {
    g.fillStyle = sh('#E8E2D2'); g.fillRect(0, hz - 46, w, h);
    g.fillStyle = sh('#BDB5A4');
    for (let c = 0; c < 4; c++) for (let l = 0; l < 7; l++) g.fillRect(8 + c * (w / 4), hz - 38 + l * 6, w / 4 - 16 - (l % 3) * 6, 2);
    g.fillStyle = sh('#2A2118'); g.fillRect(8, hz - 44, w * 0.5, 4); // a headline bar
    for (let i = 0; i < 4; i++) litWin(14 + i * (w / 4), hz + 10);
    g.strokeStyle = sh('#3A3634'); g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, h * 0.18); g.quadraticCurveTo(w / 2, h * 0.3, w, h * 0.16); g.stroke();
    g.fillStyle = sh('#7C7671'); for (let i = 0; i < 3; i++) { const px = w * (0.25 + i * 0.2); g.beginPath(); g.ellipse(px, h * 0.24 - 4, 5, 4, 0, 0, 7); g.fill(); }
  } else if (district === 'hearth') {
    roofs(g, w, h, hz, [sh('#A9553B'), sh('#8E4A2C'), sh('#B9573E')], r, 3);
    g.fillStyle = sh('#E2D5B8'); g.fillRect(0, hz, w, h - hz);
    for (let i = 0; i < 3; i++) litWin(12 + i * (w / 3), hz + 8);
    for (let i = 0; i < 2; i++) {
      const cx = w * (0.25 + i * 0.5);
      g.fillStyle = sh('#94432F'); g.fillRect(cx - 6, hz - 46, 12, 30);
      g.fillStyle = night ? 'rgba(160,160,170,0.35)' : 'rgba(255,255,255,0.7)';
      for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(cx + k * 6, hz - 54 - k * 10, 7 + k * 2, 0, 7); g.fill(); }
    }
  } else if (district === 'exercise') {
    g.fillStyle = sh('#F4EEDC'); g.fillRect(0, hz, w, h - hz);
    g.strokeStyle = sh('#9DB8D8'); g.lineWidth = 1.5;
    for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(0, hz + 6 + k * 9); g.lineTo(w, hz + 6 + k * 9); g.stroke(); }
    g.strokeStyle = sh('#D98A8A'); g.beginPath(); g.moveTo(w * 0.12, hz); g.lineTo(w * 0.12, h); g.stroke();
    g.fillStyle = sh('#A8C49C'); g.fillRect(w * 0.45, hz - 30, w * 0.45, 30);
    g.fillStyle = sh('#4F6F55'); g.beginPath(); g.moveTo(w * 0.42, hz - 30); g.lineTo(w * 0.675, hz - 50); g.lineTo(w * 0.93, hz - 30); g.fill();
    for (let i = 0; i < 3; i++) litWin(w * 0.5 + i * w * 0.13, hz - 22, 10, 12);
    g.fillStyle = sh('#E2B33C'); g.beginPath(); g.arc(w * 0.2, hz - 22, 20, 0, 7); g.fill(); // a padauk in flower
    g.fillStyle = sh('#6B4A30'); g.fillRect(w * 0.2 - 2, hz - 8, 4, 10);
  } else {
    // market / envelope / home: tin and tile roofs, envelope flaps, a string of stamp flags
    roofs(g, w, h, hz, [sh('#B3B0A6'), sh('#A65A3A'), sh('#C4BBA8'), sh('#8D877C')], r, 4);
    g.fillStyle = sh('#EADFC6'); g.fillRect(0, hz, w, h - hz);
    g.strokeStyle = sh('#C9B892'); g.lineWidth = 2;
    for (let i = 0; i < 2; i++) { const x0 = i * w / 2; g.beginPath(); g.moveTo(x0 + 6, hz + 4); g.lineTo(x0 + w / 4, hz + 22); g.lineTo(x0 + w / 2 - 6, hz + 4); g.stroke(); }
    for (let i = 0; i < 4; i++) litWin(10 + i * (w / 4), hz + 26);
    const fl = ['#C8323C', '#2F5DB3', '#E2B33C', '#3E8C8A'];
    g.strokeStyle = sh('#3A2E25'); g.lineWidth = 1; g.beginPath(); g.moveTo(0, h * 0.3); g.quadraticCurveTo(w / 2, h * 0.42, w, h * 0.28); g.stroke();
    for (let i = 1; i < 8; i++) { const t = i / 8, fx = w * t, fy = h * 0.3 + Math.sin(t * Math.PI) * h * 0.1 - 2; g.fillStyle = sh(fl[i % 4]); g.fillRect(fx - 4, fy, 8, 9); }
  }
  if (wet) {
    g.strokeStyle = night ? 'rgba(200,210,230,0.35)' : 'rgba(255,255,255,0.45)'; g.lineWidth = 1.2;
    for (let i = 0; i < 30; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y + 14); g.stroke(); }
  }
}

// ---------------------------------------------------------------------------------------------
// the stage
// ---------------------------------------------------------------------------------------------
const TMP = new THREE.Color(), TMP2 = new THREE.Color();
export const phaseOf = (e) => (e < 0.3 ? 'day' : e < 0.72 ? 'dusk' : 'night');

/**
 * makeStage(opts): kit room + atlas + decals + look. opts: createRoom options plus
 *   { district, seed, evening = 0, rain = 0, background }
 */
export function makeStage(opts) {
  const room = kit.createRoom({ windows: [], ...opts });
  const { width: W, depth: D, height: H } = room;
  const hw = W / 2, hd = D / 2;
  const atlas = makeAtlas(1024);
  const S = new VoxelBuilder(); // room-space statics that need no collision (wall dressing, floor bits)
  const pools = [], patches = [], shafts = [], rainQuads = [], anims = [], disposers = [];
  const district = opts.district || 'market';
  const st = {
    room, W, D, H, hw, hd, atlas, S, anims, disposers, district,
    spots: {}, stations: [], parts: {},
    look: { evening: Math.max(0, Math.min(1, +opts.evening || 0)), rain: opts.rain ? 1 : 0 },
    viewLook: null,
    /** An obstacle box in room space (things merged straight into S). */
    solid(x0, z0, x1, z1) { room.obstacles.push({ type: 'box', minX: Math.min(x0, x1), maxX: Math.max(x0, x1), minZ: Math.min(z0, z1), maxZ: Math.max(z0, z1) }); },
    /** Put a builder on the floor: room.place(piece(v, fp), x, z, rotY). */
    put(v, x, z, ry = 0, fp = null, name = 'prop', solid = true) { return room.place(piece(v, fp, name), x, z, ry, { solid: solid && !!fp }); },
    /** A window: wall 'back' (x = along) or 'left' / 'right' (along = z). Painted view by district + phase. */
    window({ wall = 'back', x = 0, along = 0, y = 1.7, w = 1.1, h = 0.95, frame = '#7A5434', shutter = '#4F7F6A', shutterD = '#3B5F50', curtain = null, shutters = true, bars = 2, sun = true, sunLen = 1.4, sill = null, seed = 1 }) {
      const r = atlas.draw(Math.round(w * 150), Math.round(h * 150), (g, ww, hh) => paintView(g, ww, hh, district, st.viewLook || { phase: phaseOf(st.look.evening), rain: st.look.rain > 0.5 }, seed));
      // the window is drawn in its own local frame (front +Z) and placed on the wall
      const base = wall === 'back' ? M(x, 0, -hd) : wall === 'left' ? M(-hw, 0, along, 0, Math.PI / 2, 0) : M(hw, 0, along, 0, -Math.PI / 2, 0);
      atlas.quad(r, w, h, base.clone().multiply(M(0, y, 0.03)), 'views');
      rainQuads.push([base.clone().multiply(M(0, y, 0.036)), w, h]);
      const v = new VoxelBuilder();
      const f = 0.09;
      v.boxMin(-w / 2 - f, y - h / 2 - f, 0, w / 2 + f, y - h / 2, 0.1, frame);
      v.boxMin(-w / 2 - f, y + h / 2, 0, w / 2 + f, y + h / 2 + f, 0.1, frame);
      v.boxMin(-w / 2 - f, y - h / 2, 0, -w / 2, y + h / 2, 0.1, frame);
      v.boxMin(w / 2, y - h / 2, 0, w / 2 + f, y + h / 2, 0.1, frame);
      v.boxMin(-w / 2 - 0.16, y - h / 2 - f - 0.05, 0, w / 2 + 0.16, y - h / 2 - f + 0.02, 0.2, sill || jitter('#B58A5A', 0.05, seed)); // sill
      v.boxMin(-w / 2 - 0.2, y + h / 2 + f, 0, w / 2 + 0.2, y + h / 2 + f + 0.08, 0.14, frame); // lintel
      for (let i = 1; i <= bars; i++) v.box(-w / 2 + (i * w) / (bars + 1), y, 0.06, 0.025, h, 0.025, '#4A3B30');
      if (bars) v.box(0, y, 0.06, w, 0.025, 0.025, '#4A3B30');
      if (shutters) {
        for (const s of [-1, 1]) {
          const sw = w * 0.46, sv = new VoxelBuilder();
          sv.box(0, 0, 0, sw, h + 0.1, 0.04, jitter(shutter, 0.05, s + seed));
          for (let k = 0; k < 5; k++) sv.box(0, -h / 2 + 0.12 + (k * (h - 0.14)) / 4.5, 0.025, sw * 0.86, 0.035, 0.02, shutterD);
          const hx = s * (w / 2 + f);
          v.merge(sv, M(hx + s * Math.cos(0.4) * sw / 2, y, 0.06 + Math.sin(0.4) * sw / 2, 0, -s * 0.4, 0));
        }
      }
      if (curtain) {
        v.box(0, y + h / 2 + f + 0.14, 0.2, w + 0.5, 0.03, 0.03, '#A47A2C'); // rod
        for (const s of [-1, 1]) for (let k = 0; k < 3; k++) v.box(s * (w / 2 + 0.02 - k * 0.075), y + 0.08, 0.22 + (k % 2) * 0.025, 0.085, h + 0.3, 0.03, jitter(curtain, 0.06, k + s));
      }
      S.merge(v, base);
      if (sun && wall === 'back') {
        patches.push([x + 0.12, -hd + 0.25 + sunLen * 0.62, w * 1.05, sunLen * 0.75, 0.012]);
        shafts.push([x, y, -hd + 0.07, w * 0.92, h, sunLen]);
      }
    },
    /** A flat atlas picture on a wall at (along, y). */
    wallSign(wall, along, y, w, h, draw, px = 200, layer = 'signs', out = 0.065) {
      const r = atlas.draw(Math.round(w * px), Math.round(h * px), draw);
      const m = wall === 'back' ? M(along, y, -hd + out) : wall === 'left' ? M(-hw + out, y, along, 0, Math.PI / 2, 0) : M(hw - out, y, along, 0, -Math.PI / 2, 0);
      atlas.quad(r, w, h, m, layer);
      return r;
    },
    /** A flat atlas quad placed by matrix (labels, papers on tables: rx = -PI/2 lies flat). */
    sign(w, h, m, draw, px = 200, layer = 'signs') {
      const r = atlas.draw(Math.max(8, Math.round(w * px)), Math.max(8, Math.round(h * px)), draw);
      atlas.quad(r, w, h, m, layer);
      return r;
    },
    /** A small flame (glow layer: lit at dusk) or an ember (always lit). */
    flame(x, y, z, w = 0.05, h = 0.08, kind = 'flame') {
      if (!st._flameR) st._flameR = atlas.draw(8, 8, (g) => { g.fillStyle = '#FFE3A0'; g.fillRect(0, 0, 8, 8); });
      if (!st._emberR) st._emberR = atlas.draw(8, 8, (g) => { g.fillStyle = '#FF7A2E'; g.fillRect(0, 0, 8, 8); });
      atlas.block(kind === 'ember' ? st._emberR : st._flameR, M(x, y, z, 0, 0.6, 0, w, h, w), kind === 'ember' ? 'signs' : 'glow');
    },
    pool(x, z, r = 1.4, y = 0.035) { pools.push([x, y, z, r]); },
    spot(name, x, z, h = 0, extra = null) { st.spots[name] = extra ? { x, z, h, ...extra } : { x, z, h }; return st.spots[name]; },
    steam(x, y, z, n = 6) { (st._steam ||= []).push([x, y, z, n]); },
    motes(x, y, z, w, h, d, n = 16) { st._motes = [x, y, z, w, h, d, n]; },
    /** A wall fan on the back wall at x (y up): the housing is static, the blades spin (one small mesh). */
    fan(x, y = 2.45, col = '#E9DFC9') {
      const z = -hd;
      S.boxMin(x - 0.08, y - 0.12, z, x + 0.08, y + 0.04, z + 0.1, '#8D877C'); // bracket
      cyl(S, x, y, z + 0.2, 0.09, 0.11, 0.2, '#B9B4AA', 8, Math.PI / 2);
      for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; rb(S, x + Math.cos(a) * 0.3, y + Math.sin(a) * 0.3, z + 0.36, 0.19, 0.015, 0.015, '#8D877C', 0, 0, a + Math.PI / 2); }
      st._fan = [x, y, z + 0.33, col];
    },
    finish() {
      const g = room.group;
      if (S.parts.length) g.add(piece(S, null, 'genericDressing'));
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
        const geos = rainQuads.map(([m, w, h]) => {
          const q = new THREE.PlaneGeometry(w, h);
          const uv = q.attributes.uv;
          for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h);
          return q.applyMatrix4(m);
        });
        const m = new THREE.Mesh(mergeGeometries(geos, false), basic('#ffffff', { map: rainTexture(), transparent: true, depthWrite: false, opacity: 0 }));
        geos.forEach((q) => q.dispose());
        m.visible = false; m.raycast = () => {}; m.name = 'windowRain'; m.userData.dynamic = true;
        m.material.map = rainTexture().clone(); m.material.map.needsUpdate = true; // its own offset (the shared one stays put)
        disposers.push(() => m.material.map.dispose());
        g.add(m);
        st.rainMesh = m;
      }
      if (st._steam) {
        const n = st._steam.reduce((a, s) => a + s[3], 0);
        const mat = basic('#FFFFFF', { map: glowTexture(), transparent: true, opacity: 0.5, depthWrite: false });
        const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, n);
        im.name = 'steam'; im.raycast = () => {}; im.renderOrder = 4; im.frustumCulled = false; im.userData.dynamic = true;
        const list = [];
        for (const [x, y, z, k] of st._steam) for (let i = 0; i < k; i++) list.push({ x, y, z, ph: i / k, sd: Math.sin(i * 12.9 + x * 3) });
        const dummy = new THREE.Object3D();
        g.add(im);
        anims.push((dt, t) => {
          for (let i = 0; i < list.length; i++) {
            const s = list[i], a = (t * 0.3 + s.ph) % 1;
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
        im.name = 'motes'; im.raycast = () => {}; im.renderOrder = 4; im.frustumCulled = false; im.userData.dynamic = true;
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
      if (st._fan) {
        const [x, y, z, col] = st._fan;
        const v = new VoxelBuilder();
        cyl(v, 0, 0, 0, 0.05, 0.05, 0.05, '#8D877C', 8, Math.PI / 2);
        for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; rb(v, Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0, 0.22, 0.09, 0.012, col, 0, 0, a); }
        const blades = v.mesh({ outline: true, px: 1.1 });
        blades.position.set(x, y, z);
        blades.userData.dynamic = true;
        blades.name = 'fan';
        g.add(blades);
        anims.push((dt) => { blades.rotation.z -= dt * 9; });
      }
      st.base = { hemi: room.lights.hemi.intensity, sun: room.lights.sun.intensity, sunColor: room.lights.sun.color.clone(), bg: room.scene.background.clone() };
      st.applyLook();
    },
    applyLook() {
      const { evening: e, rain: r } = st.look;
      const L = room.lights;
      L.hemi.intensity = st.base.hemi * (1 - 0.46 * e - 0.22 * r);
      L.sun.intensity = st.base.sun * (1 - 0.66 * e - 0.4 * r);
      L.sun.color.copy(st.base.sunColor).lerp(TMP.set('#FFB27A'), e * 0.8).lerp(TMP.set('#C9D4E0'), r * 0.6);
      room.scene.background.copy(st.base.bg).lerp(TMP.set('#C9BCA2'), e * 0.5).lerp(TMP.set('#C8CBC6'), r * 0.3);
      const lit = Math.max(e, r * 0.55);
      if (st.meshes.glow) st.meshes.glow.material.color.copy(TMP.set('#7A6450')).lerp(TMP2.set('#FFFFFF'), lit);
      if (st.meshes.signs) st.meshes.signs.material.color.set('#FFFFFF').lerp(TMP.set('#B6A894'), e * 0.4 + r * 0.15);
      if (st.meshes.views) st.meshes.views.material.color.set('#FFFFFF').lerp(TMP.set('#F0C0A0'), e * 0.25);
      if (st.poolMesh) { st.poolMesh.material.opacity = 0.55 * lit; st.poolMesh.visible = lit > 0.02; }
      const day = (1 - e) * (1 - r);
      if (st.patchMesh) { st.patchMesh.material.opacity = 0.3 * day; st.patchMesh.visible = day > 0.02; }
      if (st.shaftMesh) { st.shaftMesh.material.opacity = 0.14 * day; st.shaftMesh.visible = day > 0.02; }
      if (st.moteMesh) st.moteMesh.visible = day > 0.3;
      if (st.rainMesh) { st.rainMesh.visible = r > 0.01; st.rainMesh.material.opacity = r; }
      // the window views: repainted only when the phase or the rain changes
      const vl = { phase: phaseOf(e), rain: r > 0.5 };
      if (!st.viewLook || st.viewLook.phase !== vl.phase || st.viewLook.rain !== vl.rain) { st.viewLook = vl; atlas.paint(); }
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
