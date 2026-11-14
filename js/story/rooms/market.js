// Story interiors for Envelope Market (INDEX 13.1 / 13.2 / 13.5): Daw Tin Tin's tea shop `teashop`,
// the Market post office's front room `marketpost` and back room `postroom`, Daw Yi's free-food shop
// `riceshop`, Ma Yu Yu's sundries shop `sundries` and Ko Lwin's carving shop `carvershop`.
//
// Each room is a kit.createRoom() dollhouse (front-top view, open front at +Z, door at the front centre)
// furnished with boxes built here. NO station markers (story rule: never show the player where to go):
// `stations` are plain tap points with an invisible marker, so kit's room.update() still works.
//
//   import { ROOMS } from './rooms/market.js';
//   const r = ROOMS.teashop.build({ quality });   // synchronous; r.ready resolves once the Burmese
//                                                 // signs are repainted with the web fonts
//   r.scene, r.group, r.stations, r.obstacles, r.door, r.spawn, r.bounds
//   r.spots.tintin -> { x, z, h, seat? }          // h = heading (rotation.y, 0 faces +Z); seat = seat height
//   r.set('teapot', true) / r.get(flag)           // story flags that change the set dressing (per room, below)
//   r.setEvening(0..1) / r.setRain(bool)          // lamps, light pools, window night tint, rain on the panes
//   r.update(dt, t, state)                         // = kit room.update (ambient: steam, fan, curtains, smoke)
//   r.dispose()
//   seatPerson(person, seatY)                      // after person.update(): a simple seated pose for stools
//
// Draw calls per room (before people): baked statics + outline, one sign atlas, one instanced mesh of
// moving / switchable boxes + outline, lamp glass, embers, lamp pools, sun patch, window tint, rain.
// Every Burmese string is a draft for Maya.
import * as kit from '../../game/interiors/kit.js';
import { fontsReady, FONT_MY, FONT_SERIF, roundRect } from '../../game/toon.js';
import { mergeGeometries } from '../../game/three.js';

const { THREE, PALETTE: P, VoxelBuilder, toon, addOutline } = kit;
const PI = Math.PI;
const HP = Math.PI / 2;

// Market colours (warm, papery; Maya's palette plus the materials a market is made of)
const C = {
  brick: '#A9553B', brickD: '#7E3B28', brickL: '#BF6B4C', mortar: '#D8C6A6',
  clay: '#B5643C', clayL: '#CB7E4E', clayD: '#8E4A2C', soot: '#2B1E19',
  iron: '#3A3634', ironL: '#5B5650', tin: '#B3B0A6', tinD: '#8C8981', tinL: '#D2CFC6',
  ash: '#9A958C', ember: '#F2873A', smoke: '#E9E4DA',
  woodL: '#CDA577', woodM: '#9C6E45', woodD: '#5A3B26', woodK: '#46301F',
  cloth: '#D9C7A3', clothL: '#EADFC8', rope: '#B89A6A', twine: '#C9B08A',
  rice: '#F7F3E8', leafTea: '#6B6A3A', green: '#5F7F5A', greenD: '#3F5E45',
  teal: '#4F8A8B', blue: '#5A7FA0', red: '#B5463C', pink: '#D98C95', mustard: '#D9A93B',
  envBlue: '#CBD9E4', envBlueD: '#A9BED0', terra: '#C46B4A', terraL: '#D98A68',
  glass: '#D7E6E3', steel: '#C9CCCC', water: '#7FA9B8',
};

// ---------------------------------------------------------------------------------------------
// Small builders (build time only: these allocate)
// ---------------------------------------------------------------------------------------------
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();

function mat(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}
/** Box with any turn into a builder (VoxelBuilder or a dyn sink). */
function rbox(v, x, y, z, w, h, d, c, rx = 0, ry = 0, rz = 0) {
  return v.add(UNIT, c, mat(x, y, z, rx, ry, rz, w, h, d));
}
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
/** 8-sided blocky prism (round things), centre y. Dyn sinks get a box instead. */
function prism(v, x, y, z, rTop, rBot, h, c, seg = 8, ry = 0) {
  if (v.isDyn) return rbox(v, x, y, z, (rTop + rBot) * 0.9, h, (rTop + rBot) * 0.9, c, 0, ry);
  return v.add(prismGeo(rTop, rBot, h, seg), c, mat(x, y, z, 0, ry));
}
function rnd(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function tone(hex, f) {
  const n = parseInt(hex.slice(1, 7), 16);
  const ch = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
}
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const frac = (x) => x - Math.floor(x);

// ---------------------------------------------------------------------------------------------
// Canvas atlas: every sign, window view, calendar and clock of a room on ONE texture / ONE mesh.
// Draw ops are recorded so the atlas repaints once the Burmese web font has loaded.
// ---------------------------------------------------------------------------------------------
function makeAtlas(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const geos = [];
  const ops = [];
  let cx = 0;
  let cy = 0;
  let rowH = 0;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  function paint(r, fn) {
    g.save();
    g.translate(r.x, r.y);
    g.beginPath();
    g.rect(0, 0, r.w, r.h);
    g.clip();
    fn(g, r.w, r.h);
    g.restore();
  }
  return {
    tex,
    /** Region of w × h pixels (shelf packing). */
    alloc(w, h) {
      w = Math.ceil(w);
      h = Math.ceil(h);
      if (cx + w > size) { cx = 0; cy += rowH + 2; rowH = 0; }
      const r = { x: cx, y: cy, w, h, u0: cx / size, u1: (cx + w) / size, v0: 1 - (cy + h) / size, v1: 1 - cy / size };
      cx += w + 2;
      rowH = Math.max(rowH, h);
      if (cy + h > size) console.warn('market atlas full');
      return r;
    },
    draw(r, fn) {
      ops.push([r, fn]);
      paint(r, fn);
      return r;
    },
    repaint() {
      g.clearRect(0, 0, size, size);
      for (const [r, fn] of ops) paint(r, fn);
      tex.needsUpdate = true;
    },
    /** Plane w × h (metres) facing +Z showing region r, placed by matrix m. */
    quad(r, w, h, m) {
      const geo = new THREE.PlaneGeometry(w, h);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, r.u0 + uv.getX(i) * (r.u1 - r.u0), r.v0 + uv.getY(i) * (r.v1 - r.v0));
      geo.applyMatrix4(m);
      geos.push(geo);
    },
    mesh(name = 'signs') {
      if (!geos.length) return null;
      const material = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, toneMapped: false });
      const mesh = new THREE.Mesh(mergeGeometries(geos, false), material);
      for (const geo of geos) geo.dispose();
      mesh.name = name;
      mesh.userData.dynamic = true;
      return mesh;
    },
  };
}

// canvas painting helpers
function txt(g, s, x, y, size, color, { font = FONT_MY, weight = 700, align = 'center', max = 0 } = {}) {
  g.font = `${weight} ${size}px ${font}`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'middle';
  if (max) g.fillText(s, x, y, max);
  else g.fillText(s, x, y);
}
function rrect(g, x, y, w, h, r, fill, stroke = null, lw = 0) {
  roundRect(g, x, y, w, h, r);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
function disc(g, x, y, r, fill) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
}
/** Chalk-slate background with soft wipes. */
function slateBg(g, w, h, seed = 3) {
  g.fillStyle = '#3F4B43';
  g.fillRect(0, 0, w, h);
  g.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    g.strokeStyle = `rgba(230,236,226,${0.04 + rnd(seed + i) * 0.04})`;
    g.lineWidth = 14 + rnd(seed * 3 + i) * 26;
    g.beginPath();
    g.arc(rnd(seed + i * 7) * w, rnd(seed + i * 11) * h, 30 + rnd(i + seed) * 70, rnd(i) * 6, rnd(i) * 6 + 1.4);
    g.stroke();
  }
}
/** Aged paper background. */
function paperBg(g, w, h, base = '#F4ECD8', seed = 1) {
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 10; i++) {
    g.fillStyle = `rgba(150,110,60,${0.03 + rnd(seed * 5 + i) * 0.04})`;
    g.beginPath();
    g.arc(rnd(seed + i * 3.1) * w, rnd(seed + i * 5.3) * h, 6 + rnd(i * 9 + seed) * w * 0.12, 0, 7);
    g.fill();
  }
}
/** Faint handwriting lines (illegible scribble rows). */
function scribble(g, x, y, w, rows, gap, color, seed = 1, lw = 2) {
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.lineCap = 'round';
  for (let r = 0; r < rows; r++) {
    const len = w * (0.55 + rnd(seed + r * 3) * 0.45);
    g.beginPath();
    let px = x;
    g.moveTo(px, y + r * gap);
    while (px < x + len) {
      const step = 4 + rnd(seed + px) * 6;
      g.quadraticCurveTo(px + step / 2, y + r * gap - 3 - rnd(px + r) * 4, px + step, y + r * gap + rnd(px * 2) * 2);
      px += step;
    }
    g.stroke();
  }
}
/** A small calendar sheet: picture on top, day grid below, today ringed. */
function paintCalendar(g, w, h, { title = 'တန်ဆောင်မုန်း', pic = 'hills', seed = 2 } = {}) {
  paperBg(g, w, h, '#FBF6EA', seed);
  const ph = h * 0.46;
  const sky = g.createLinearGradient(0, 0, 0, ph);
  sky.addColorStop(0, '#9CC3DE');
  sky.addColorStop(1, '#F5DFB8');
  g.fillStyle = sky;
  g.fillRect(w * 0.06, h * 0.05, w * 0.88, ph);
  if (pic === 'hills') {
    g.fillStyle = '#7FA36B';
    g.beginPath();
    g.moveTo(w * 0.06, h * 0.05 + ph);
    g.quadraticCurveTo(w * 0.3, h * 0.05 + ph * 0.45, w * 0.55, h * 0.05 + ph * 0.8);
    g.quadraticCurveTo(w * 0.75, h * 0.05 + ph * 0.5, w * 0.94, h * 0.05 + ph * 0.7);
    g.lineTo(w * 0.94, h * 0.05 + ph);
    g.fill();
    disc(g, w * 0.72, h * 0.05 + ph * 0.3, w * 0.07, '#F6C35B');
  } else {
    g.fillStyle = '#E2A23C';
    for (let i = 0; i < 9; i++) disc(g, w * (0.2 + rnd(seed + i) * 0.6), h * 0.05 + ph * (0.3 + rnd(i * 3 + seed) * 0.5), w * 0.05, i % 2 ? '#E2A23C' : '#F1C24E');
  }
  txt(g, title, w / 2, h * 0.58, Math.round(h * 0.07), '#B5463C');
  const gx = w * 0.1;
  const gy = h * 0.66;
  const cw = (w * 0.8) / 7;
  const ch = (h * 0.3) / 5;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 7; c++) {
      const n = r * 7 + c + 1;
      if (n > 30) continue;
      g.fillStyle = c === 0 ? '#B5463C' : '#3B2A1A';
      g.fillRect(gx + c * cw + cw * 0.3, gy + r * ch + ch * 0.35, cw * 0.4, ch * 0.3);
      if (n === 13) {
        g.strokeStyle = '#B5463C';
        g.lineWidth = Math.max(2, w * 0.012);
        g.beginPath();
        g.arc(gx + c * cw + cw / 2, gy + r * ch + ch / 2, cw * 0.45, 0, 7);
        g.stroke();
      }
    }
  }
  g.fillStyle = '#6E1F2A';
  g.fillRect(w * 0.42, 0, w * 0.16, h * 0.03);
}
/** Round wall clock face. */
function paintClock(g, w, h, hh = 8.2, mm = 0.35) {
  const r = Math.min(w, h) / 2;
  disc(g, w / 2, h / 2, r, '#6E4A30');
  disc(g, w / 2, h / 2, r * 0.86, '#FBF6EA');
  g.fillStyle = '#3B2A1A';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const L = i % 3 ? r * 0.07 : r * 0.13;
    g.save();
    g.translate(w / 2 + Math.sin(a) * r * 0.72, h / 2 - Math.cos(a) * r * 0.72);
    g.rotate(a);
    g.fillRect(-r * 0.025, -L / 2, r * 0.05, L);
    g.restore();
  }
  g.lineCap = 'round';
  const hand = (a, len, lw) => {
    g.strokeStyle = '#2A2118';
    g.lineWidth = lw;
    g.beginPath();
    g.moveTo(w / 2, h / 2);
    g.lineTo(w / 2 + Math.sin(a) * len, h / 2 - Math.cos(a) * len);
    g.stroke();
  };
  hand(((hh % 12) / 12) * Math.PI * 2, r * 0.42, r * 0.09);
  hand(mm * Math.PI * 2, r * 0.62, r * 0.06);
  disc(g, w / 2, h / 2, r * 0.07, '#A47A2C');
}
/** Sky with soft clouds (window views). */
function paintSky(g, w, h, top = '#9CC6E4', low = '#F6E3C2') {
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, top);
  sky.addColorStop(1, low);
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,250,240,0.85)';
  for (const [x, y, s] of [[0.22, 0.2, 0.12], [0.3, 0.22, 0.09], [0.72, 0.14, 0.1], [0.8, 0.17, 0.07]]) {
    g.beginPath();
    g.ellipse(x * w, y * h, s * w, s * h * 0.55, 0, 0, 7);
    g.fill();
  }
}
/** A row of tin / tile roofs along the bottom of a window view. */
function paintRoofs(g, w, h, y0, seed = 1) {
  let x = -10;
  let i = 0;
  while (x < w) {
    const bw = w * (0.22 + rnd(seed + i) * 0.18);
    const top = h * (y0 + rnd(seed * 3 + i) * 0.12);
    g.fillStyle = ['#C9A27A', '#E5D3B3', '#B98F6B', '#D8C2A0'][i % 4];
    g.fillRect(x, top + h * 0.08, bw, h);
    g.fillStyle = ['#8E5A3C', '#A9553B', '#7E8A8E', '#9A6A48'][(i + seed) % 4];
    g.beginPath();
    g.moveTo(x - 6, top + h * 0.1);
    g.lineTo(x + bw * 0.5, top - h * 0.03);
    g.lineTo(x + bw + 6, top + h * 0.1);
    g.fill();
    g.fillStyle = 'rgba(60,40,30,0.25)';
    g.fillRect(x + bw * 0.3, top + h * 0.18, bw * 0.16, h * 0.1);
    x += bw + 4;
    i++;
  }
}

// ---------------------------------------------------------------------------------------------
// Instanced moving / switchable boxes (+ outline): steam, the fan, curtains, flag-driven props.
// Parts are hidden with scale 0; set() is allocation free.
// ---------------------------------------------------------------------------------------------
function makeDyn() {
  const boxes = [];
  const parts = [];
  const tmp = new THREE.Matrix4();
  const col = new THREE.Color();
  let mesh = null;
  const dyn = {
    part(visible = true) {
      parts.push(visible ? new THREE.Matrix4() : new THREE.Matrix4().makeScale(0, 0, 0));
      return parts.length - 1;
    },
    /** A builder-like sink writing boxes into part i (coordinates relative to the part's matrix). */
    sink(i, base = null) {
      return {
        isDyn: true,
        box(x, y, z, w, h, d, c, rotY = 0) { boxes.push({ part: i, m: pre(base, mat(x, y, z, 0, rotY, 0, w, h, d)), c }); return this; },
        boxMin(x0, y0, z0, x1, y1, z1, c) { return this.box((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), c); },
        add(geo, c, m) { boxes.push({ part: i, m: pre(base, m.clone()), c }); return this; },
      };
    },
    setMatrix(i, m) { parts[i].copy(m); },
    set(i, x, y, z, rx, ry, rz, sx, sy = sx, sz = sx) {
      parts[i].compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
    },
    show(i, on) {
      if (on) parts[i].identity();
      else parts[i].makeScale(0, 0, 0);
    },
    get count() { return boxes.length; },
    /** material: a material to use instead of the toon one (then no outline unless px is given). */
    build(group, px = 1.4, material = null) {
      if (!boxes.length) return null;
      mesh = new THREE.InstancedMesh(UNIT, material || toon('#ffffff'), boxes.length);
      mesh.name = material ? 'mist' : 'ambient';
      mesh.frustumCulled = false;
      mesh.userData.dynamic = true;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      boxes.forEach((b, k) => mesh.setColorAt(k, col.set(b.c)));
      group.add(mesh);
      if (px) {
        const o = addOutline(mesh, { px });
        o.userData.dynamic = true;
      }
      dyn.commit();
      return mesh;
    },
    commit() {
      if (!mesh) return;
      for (let k = 0; k < boxes.length; k++) {
        tmp.multiplyMatrices(parts[boxes[k].part], boxes[k].m);
        mesh.setMatrixAt(k, tmp);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
  function pre(base, m) {
    return base ? new THREE.Matrix4().multiplyMatrices(base, m) : m;
  }
  return dyn;
}

/** A sink that writes into a VoxelBuilder through a matrix (sub-assemblies in local coordinates). */
function vsink(v, base) {
  return {
    box(x, y, z, w, h, d, c, rotY = 0) { v.add(UNIT, c, new THREE.Matrix4().multiplyMatrices(base, mat(x, y, z, 0, rotY, 0, w, h, d))); return this; },
    boxMin(x0, y0, z0, x1, y1, z1, c) { return this.box((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), c); },
    add(geo, c, m) { v.add(geo, c, new THREE.Matrix4().multiplyMatrices(base, m)); return this; },
  };
}

/** Unlit glow blocks (lamp glass, embers) as one mesh whose colour follows a level. */
function makeGlow(name, off, on) {
  const geos = [];
  const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(off), toneMapped: false });
  const cOff = new THREE.Color(off);
  const cOn = new THREE.Color(on);
  return {
    material,
    box(x, y, z, w, h, d, ry = 0) { geos.push(new THREE.BoxGeometry(1, 1, 1).applyMatrix4(mat(x, y, z, 0, ry, 0, w, h, d))); },
    mesh() {
      if (!geos.length) return null;
      const m = new THREE.Mesh(mergeGeometries(geos, false), material);
      for (const g of geos) g.dispose();
      m.name = name;
      m.userData.dynamic = true;
      return m;
    },
    set(k) { material.color.copy(cOff).lerp(cOn, clamp01(k)); },
  };
}

// soft round decal for lamp pools and sun patches (shared, never disposed)
let poolTex = null;
function poolTexture() {
  if (poolTex) return poolTex;
  const s = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  poolTex = new THREE.CanvasTexture(cv);
  poolTex.userData.shared = true;
  return poolTex;
}
// rain streaks on the window panes (shared image; each room clones it for its own offset)
let rainTex = null;
function rainTexture() {
  if (rainTex) return rainTex;
  const s = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  g.strokeStyle = 'rgba(235,242,250,0.75)';
  g.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const x = rnd(i * 3.3) * s;
    const y = rnd(i * 7.7) * s;
    g.lineWidth = 1 + rnd(i) * 1.5;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x - 3, y + 14 + rnd(i * 2) * 18);
    g.stroke();
  }
  for (let i = 0; i < 10; i++) disc(g, rnd(i * 13.1) * s, rnd(i * 17.9) * s, 1.6 + rnd(i) * 1.6, 'rgba(240,246,252,0.8)');
  rainTex = new THREE.CanvasTexture(cv);
  rainTex.wrapS = rainTex.wrapT = THREE.RepeatWrapping;
  return rainTex;
}

// ---------------------------------------------------------------------------------------------
// Room context: one per build. Statics go into ctx.v (baked), signs into ctx.A, moving and
// flag-driven boxes into ctx.dyn, lamp glass into ctx.lamp, embers into ctx.ember.
// ---------------------------------------------------------------------------------------------
function makeCtx(id, o) {
  const room = kit.createRoom({
    width: o.width, depth: o.depth, height: o.height ?? 3, wall: o.wall, wainscot: o.wainscot, trim: o.trim,
    floor: o.floor === 'tiles' ? 'tiles' : 'planks', floorColor: o.floorColor, floorColor2: o.floorColor2, background: o.background ?? P.cream, windows: [],
  });
  room.id = id;
  const W = o.width;
  const D = o.depth;
  const H = o.height ?? 3;
  const hw = W / 2;
  const hd = D / 2;
  const ctx = {
    id, room, W, D, H, hw, hd,
    v: new VoxelBuilder(),
    A: makeAtlas(o.atlas ?? 1024),
    dyn: makeDyn(),
    mist: makeDyn(), // unlit, soft steam (always the brightest thing; no outline)
    lamp: makeGlow('lampGlass', '#E6DAC0', '#FFDC8E'),
    ember: makeGlow('embers', o.emberOff ?? C.ember, C.ember),
    pools: [],
    suns: [],
    warms: [],
    panes: [],
    spots: {},
    flags: {},
    flagFns: {},
    anim: [],
    wallC: o.wall,
    fullZ: -hd + D * 0.45, // side walls are full height behind this line
  };

  /** Matrix placing a +Z-facing object on a wall ('back' | 'left' | 'right'), `off` metres out from it. */
  ctx.wallMat = (wall, along, y, off = 0) => {
    if (wall === 'back') return mat(along, y, -hd + off);
    if (wall === 'left') return mat(-hw + off, y, along, 0, HP);
    return mat(hw - off, y, along, 0, -HP);
  };
  /** Builder sink for a sub-assembly in local coordinates (feet y = 0, front +Z), placed at x, z, turned rot. */
  ctx.at = (x, z, rot = 0, y = 0) => vsink(ctx.v, mat(x, y, z, 0, rot));
  ctx.onWall = (wall, along, y, off = 0) => vsink(ctx.v, ctx.wallMat(wall, along, y, off));
  /** Collision footprint (w along x, d along z, before the turn). */
  ctx.solid = (x, z, w, d, rot = 0, pad = 0.08) => {
    const swap = Math.abs(Math.round(rot / HP)) % 2 === 1;
    const hx = (swap ? d : w) / 2 + pad;
    const hz = (swap ? w : d) / 2 + pad;
    room.obstacles.push({ type: 'box', minX: x - hx, maxX: x + hx, minZ: z - hz, maxZ: z + hz });
  };
  /** A sign on a wall: canvas region painted by fn(g, w, h), w × h metres, ppm pixels per metre. */
  ctx.sign = (wall, along, y, w, h, fn, { ppm = 300, off = 0.02 } = {}) => {
    const r = ctx.A.draw(ctx.A.alloc(w * ppm, h * ppm), fn);
    ctx.A.quad(r, w, h, ctx.wallMat(wall, along, y, off));
    return r;
  };
  /** A sign placed by any matrix (on a table, a counter front, a slate on a stand). */
  ctx.signAt = (m, w, h, fn, ppm = 300) => {
    const r = ctx.A.draw(ctx.A.alloc(w * ppm, h * ppm), fn);
    ctx.A.quad(r, w, h, m);
    return r;
  };
  ctx.spot = (name, x, z, h = 0, extra = {}) => { ctx.spots[name] = { x, z, h, ...extra }; };
  /** Tap point (no marker): where Maya stands, what she looks at, the story id. */
  ctx.tap = (id2, x, z, look, extra = {}) => {
    const marker = new THREE.Group();
    marker.visible = false;
    marker.userData.update = () => {};
    const s = { id: id2, x, z, r: 0.9, look, labelY: 1.9, emote: 'point', face: 'smile', marker, noMarker: true, ...extra };
    s.labelAnchor = new THREE.Vector3(look?.x ?? x, s.labelY, look?.z ?? z);
    room.stations.push(s);
    return s;
  };
  /** A story flag: fn(value) runs now (default) and on every set(). */
  ctx.flag = (name, def, fn) => {
    ctx.flags[name] = def;
    (ctx.flagFns[name] ||= []).push(fn);
  };
  ctx.every = (fn) => ctx.anim.push(fn);
  /** A collision box that exists only while pred(flag value) is true. */
  ctx.solidIf = (flagName, pred, x, z, w, d, rot = 0) => {
    const before = room.obstacles.length;
    ctx.solid(x, z, w, d, rot);
    const ob = room.obstacles.splice(before, 1)[0];
    ctx.flagFns[flagName] = ctx.flagFns[flagName] || [];
    ctx.flagFns[flagName].push((val) => {
      const i = room.obstacles.indexOf(ob);
      if (pred(val) && i < 0) room.obstacles.push(ob);
      else if (!pred(val) && i >= 0) room.obstacles.splice(i, 1);
    });
  };
  /** Soft warm pool of lamp light on the floor (shows in the evening). */
  ctx.pool = (x, z, r = 1.2, y = 0.012) => ctx.pools.push({ x, z, r, y });
  /**
   * A warm glow decal whose strength is level(st) (st = { eve, rain, flags }): a floor pool, or with
   * `wall` a plane on the back wall (y = centre). Same merged mesh as the pools and sun patches.
   */
  ctx.warm = (x, z, r, level, { y = 0.013, color = '#FF9E52', wall = false, sy = 1 } = {}) => ctx.warms.push({ x, z, r, y, level, color, wall, sy });
  /** Per-room light mood: fn(st) -> { hemi, sun, sunPatch } multipliers (default all 1). */
  ctx.mood = null;
  return ctx;
}

// ---- shell dressing --------------------------------------------------------------------------
/** Board floor over the kit planks: seam sheet + staggered boards in five tones, darker at the back. */
function boardFloor(ctx, base, { boardW = 0.24, minL = 0.9, varL = 1.0, seed = 1 } = {}) {
  const { v, hw, hd } = ctx;
  v.boxMin(-hw, 0, -hd, hw, 0.002, hd, tone(base, 0.5));
  const tones = [1, 0.92, 1.07, 0.86, 1.12].map((f) => tone(base, f));
  let row = 0;
  for (let z = -hd; z < hd - 1e-6; z += boardW, row++) {
    const z1 = Math.min(hd, z + boardW);
    const ao = 0.78 + 0.22 * clamp01((z + hd) / 1.4);
    let x = -hw - rnd(seed + row * 3.7) * 1.2;
    for (let k = 0; x < hw && k < 30; k++) {
      const L = minL + rnd(seed + row * 17.3 + k * 5.3) * varL;
      const xa = Math.max(-hw, x);
      const xb = Math.min(hw, x + L);
      if (xb - xa > 0.05) {
        const c = tones[Math.floor(rnd(seed + row * 31.7 + k * 7.1) * tones.length)];
        v.boxMin(xa + 0.006, 0, z + 0.007, xb - 0.006, 0.006, z1 - 0.007, ao < 0.999 ? tone(c, ao) : c);
      }
      x += L;
    }
  }
}
/** Tile floor: grout sheet + tiles in two colours with a little variation, darker at the back. */
function tileFloor(ctx, c1, c2, { size = 0.5, seed = 1, pattern = 'check' } = {}) {
  const { v, hw, hd } = ctx;
  v.boxMin(-hw, 0, -hd, hw, 0.002, hd, '#BBA98A');
  let i = 0;
  for (let x = -hw; x < hw - 1e-6; x += size) {
    for (let z = -hd; z < hd - 1e-6; z += size, i++) {
      const gx = Math.round((x + hw) / size);
      const gz = Math.round((z + hd) / size);
      const odd = pattern === 'check' ? (gx + gz) % 2 : pattern === 'border' ? (gx === 0 || gz === 0 || x + size >= hw - 1e-6 ? 1 : 0) : 0;
      const ao = 0.8 + 0.2 * clamp01((z + hd) / 1.4);
      const c = tone(odd ? c2 : c1, (0.95 + rnd(seed + i * 1.7) * 0.1) * ao);
      v.boxMin(x + 0.014, 0, z + 0.014, Math.min(hw, x + size) - 0.014, 0.007, Math.min(hd, z + size) - 0.014, c);
    }
  }
}
function stepH(ctx, z) {
  const { hd, D, H } = ctx;
  const u = (z + hd) / D;
  return u < 0.45 ? H : u < 0.65 ? H * 0.62 : u < 0.85 ? H * 0.36 : 0.5;
}
/** Vertical board seams on the wainscot (back + both side walls) and lime-wash patches above. */
function wallDressing(ctx, { seam, wash = null, seed = 1, seamStep = 0.3 }) {
  const { v, hw, hd, D } = ctx;
  for (let x = -hw + seamStep; x < hw - 0.05; x += seamStep) v.boxMin(x - 0.011, 0.14, -hd, x + 0.011, 0.97, -hd + 0.012, seam);
  for (const s of [-1, 1]) {
    const wx = s * hw;
    for (let z = -hd + seamStep; z < hd - 0.05; z += seamStep) {
      const top = Math.min(0.97, stepH(ctx, z) - 0.1);
      v.boxMin(wx - s * 0.012 - 0.0001, 0.14, z - 0.011, wx, top, z + 0.011, seam);
    }
  }
  if (wash) {
    for (let i = 0; i < 9; i++) {
      const w = 0.4 + rnd(seed + i) * 0.9;
      const h = 0.25 + rnd(seed * 2 + i) * 0.5;
      const x = -hw + 0.3 + rnd(seed * 3 + i) * (2 * hw - 0.6 - w);
      const y = 1.12 + rnd(seed * 5 + i) * (ctx.H - 1.5 - h);
      v.boxMin(x, y, -hd, x + w, y + h, -hd + 0.004, tone(wash, 0.95 + rnd(seed * 7 + i) * 0.08));
    }
  }
  void D;
}
/** Cross beam between the side walls (inside the full-height part), at z. */
function crossBeam(ctx, z, color = C.woodD) {
  const { v, hw, H } = ctx;
  v.boxMin(-hw, H - 0.2, z - 0.09, hw, H - 0.04, z + 0.09, color);
  v.boxMin(-hw, H - 0.21, z + 0.07, hw, H - 0.19, z + 0.095, tone(color, 1.3));
  for (const s of [-1, 1]) v.boxMin(s * hw - (s > 0 ? 0.12 : 0), H - 0.42, z - 0.07, s * hw + (s < 0 ? 0.12 : 0), H - 0.2, z + 0.07, tone(color, 0.85)); // corbels
}
/**
 * A back-wall window: painted view (atlas), frame, sill, mullions, optional iron bars and open
 * shutters. Also records the pane for the evening tint and the rain streaks, and a sun patch.
 */
function backWindow(ctx, x, y, w, h, paintView, { bars = 0, shutters = true, frame = C.woodM, curtain = null, sun = true } = {}) {
  const { v, hd, A } = ctx;
  const z = -hd;
  const r = A.draw(A.alloc(w * 260, h * 260), paintView);
  A.quad(r, w, h, mat(x, y, z + 0.012));
  ctx.panes.push({ x, y, z: z + 0.03, w, h });
  const f = 0.07;
  const fd = tone(frame, 0.75);
  v.boxMin(x - w / 2 - f, y - h / 2 - f, z, x + w / 2 + f, y - h / 2, z + 0.1, frame);
  v.boxMin(x - w / 2 - f, y + h / 2, z, x + w / 2 + f, y + h / 2 + f, z + 0.1, frame);
  v.boxMin(x - w / 2 - f, y - h / 2, z, x - w / 2, y + h / 2, z + 0.1, frame);
  v.boxMin(x + w / 2, y - h / 2, z, x + w / 2 + f, y + h / 2, z + 0.1, frame);
  v.boxMin(x - 0.025, y - h / 2, z, x + 0.025, y + h / 2, z + 0.07, frame);
  v.boxMin(x - w / 2, y - 0.02, z, x + w / 2, y + 0.02, z + 0.06, frame);
  v.boxMin(x - w / 2 - 0.13, y - h / 2 - 0.13, z, x + w / 2 + 0.13, y - h / 2 - f + 0.01, z + 0.2, tone(frame, 1.12)); // sill
  v.boxMin(x - w / 2 - 0.1, y + h / 2 + f, z, x + w / 2 + 0.1, y + h / 2 + f + 0.06, z + 0.13, fd); // lintel
  for (let i = 1; i <= bars; i++) {
    const bx = x - w / 2 + (i * w) / (bars + 1);
    v.boxMin(bx - 0.012, y - h / 2, z + 0.06, bx + 0.012, y + h / 2, z + 0.085, C.iron);
  }
  if (shutters) {
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? x - w / 2 - f - w / 2 : x + w / 2 + f;
      v.boxMin(x0, y - h / 2 - 0.02, z, x0 + w / 2, y + h / 2 + 0.02, z + 0.035, frame);
      for (let k = 1; k < 4; k++) v.boxMin(x0 + (k * w) / 8 - 0.008, y - h / 2, z + 0.035, x0 + (k * w) / 8 + 0.008, y + h / 2, z + 0.042, fd);
      v.boxMin(x0 + 0.03, y + h / 4 - 0.03, z + 0.035, x0 + w / 2 - 0.03, y + h / 4 + 0.03, z + 0.048, tone(frame, 1.1));
      v.boxMin(x0 + 0.03, y - h / 4 - 0.03, z + 0.035, x0 + w / 2 - 0.03, y - h / 4 + 0.03, z + 0.048, tone(frame, 1.1));
    }
  }
  if (curtain) {
    v.boxMin(x - w / 2 - 0.2, y + h / 2 + 0.16, z + 0.12, x + w / 2 + 0.2, y + h / 2 + 0.19, z + 0.15, C.bronze || P.bronze);
    for (const s of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const cx = x + s * (w / 2 + 0.02 - k * 0.07);
        v.boxMin(cx - 0.05, y - h / 2 + 0.05, z + 0.13 + (k % 2) * 0.02, cx + 0.05, y + h / 2 + 0.17, z + 0.17 + (k % 2) * 0.02, tone(curtain, 1 - k * 0.07));
      }
    }
  }
  if (sun) ctx.suns.push({ x: x + 0.25, z: z + 1.25 + h * 0.4, w: w * 1.15, d: h * 1.2 });
}
/** Lamp hanging on a cord from y top down to y: a tin shade over a glowing glass (lamp group). */
function hangingLamp(ctx, x, z, y = 2.2, top = ctx.H - 0.2, { shade = C.tinD, cord = '#2B2420' } = {}) {
  const { v } = ctx;
  v.boxMin(x - 0.012, y + 0.2, z - 0.012, x + 0.012, top, z + 0.012, cord);
  prism(v, x, y + 0.16, z, 0.05, 0.21, 0.12, shade);
  prism(v, x, y + 0.235, z, 0.04, 0.05, 0.05, tone(shade, 0.8));
  prism(v, x, y + 0.1, z, 0.215, 0.215, 0.02, tone(shade, 1.25));
  ctx.lamp.box(x, y + 0.01, z, 0.15, 0.17, 0.15);
  ctx.pool(x, z, 1.25);
}
/** Clay oil lamp / tin lantern standing on a surface (lamp group glow). */
function smallLamp(ctx, x, y, z) {
  const { v } = ctx;
  v.boxMin(x - 0.06, y, z - 0.06, x + 0.06, y + 0.03, z + 0.06, C.tinD);
  ctx.lamp.box(x, y + 0.1, z, 0.07, 0.11, 0.07);
  v.boxMin(x - 0.05, y + 0.16, z - 0.05, x + 0.05, y + 0.19, z + 0.05, C.tinD);
  v.boxMin(x - 0.008, y + 0.19, z - 0.008, x + 0.008, y + 0.25, z + 0.008, C.iron);
  ctx.pool(x, z, 0.7, y + 0.012);
}

/** Tin wall lamp on a bracket (glass chimney glows in the evening), pool of light on the floor below. */
function wallLamp(ctx, wall, along, y = 1.95) {
  const m = ctx.wallMat(wall, along, y, 0);
  const s = vsink(ctx.v, m);
  s.boxMin(-0.07, -0.12, 0, 0.07, 0.12, 0.02, C.woodD);
  s.boxMin(-0.015, -0.02, 0.02, 0.015, 0.01, 0.2, C.iron);
  s.boxMin(-0.07, -0.16, 0.13, 0.07, -0.13, 0.27, C.tinD);
  s.boxMin(-0.035, 0.08, 0.17, 0.035, 0.12, 0.23, C.tinD);
  s.add(prismGeo(0.1, 0.1, 0.015, 10), '#D2CFC6', mat(0, 0, 0.115, HP));
  const p = new THREE.Vector3(0, -0.02, 0.2).applyMatrix4(m);
  ctx.lamp.box(p.x, p.y, p.z, 0.08, 0.2, 0.08);
  const f = new THREE.Vector3(0, 0, 1.0).applyMatrix4(m);
  ctx.pool(f.x, f.z, 1.3);
}

// ---- steam / smoke ---------------------------------------------------------------------------
/** n puffs rising from (x, y, z): small cream blocks that grow, drift and shrink away. */
function steam(ctx, x, y, z, { n = 4, rise = 0.9, size = 0.09, color = '#F5F0E6', speed = 0.35, drift = 0.12, on = null, glow = false } = {}) {
  const dyn = glow ? ctx.mist : ctx.dyn;
  const parts = [];
  for (let i = 0; i < n; i++) {
    const p = dyn.part(false);
    dyn.sink(p).box(0, 0, 0, 1, 1, 1, i % 2 ? color : tone(color, 0.96));
    parts.push(p);
  }
  const state = { level: 1 };
  ctx.every((dt, t) => {
    const lv = on ? (on() ? 1 : 0) : state.level;
    for (let i = 0; i < n; i++) {
      const u = frac(t * speed + i / n);
      const s = lv * size * (0.6 + u * 1.3) * Math.sin(Math.min(1, u * 1.15) * Math.PI);
      dyn.set(parts[i], x + Math.sin(t * 1.3 + i * 2.1) * drift * u, y + u * rise, z + Math.cos(t * 0.9 + i) * drift * 0.5 * u, 0, t * 0.6 + i, 0.3 * i, Math.max(0, s));
    }
  });
  return state;
}

// ---------------------------------------------------------------------------------------------
// Shared furniture and props (local coordinates: feet y = 0, front +Z; v is any builder sink)
// ---------------------------------------------------------------------------------------------
/** Low tea-shop table (top at h) with an apron and splayed-look legs. */
function lowTable(v, x, z, { w = 0.75, d = 0.75, h = 0.42, top = C.woodM, leg = C.woodD } = {}) {
  v.boxMin(x - w / 2, h - 0.045, z - d / 2, x + w / 2, h, z + d / 2, top);
  v.boxMin(x - w / 2, h - 0.006, z + d / 2 - 0.02, x + w / 2, h + 0.002, z + d / 2, tone(top, 1.2));
  v.boxMin(x - w / 2 + 0.05, h - 0.1, z - d / 2 + 0.05, x + w / 2 - 0.05, h - 0.045, z + d / 2 - 0.05, tone(top, 0.75));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(x + sx * (w / 2 - 0.07), (h - 0.05) / 2, z + sz * (d / 2 - 0.07), 0.055, h - 0.05, 0.055, leg);
  v.boxMin(x - w / 2 + 0.08, 0.1, z - 0.015, x + w / 2 - 0.08, 0.13, z + 0.015, leg); // stretcher
}
/** Tiny low stool (seat at h). */
function lowStool(v, x, z, { h = 0.27, c = C.woodM, s = 0.27 } = {}) {
  v.boxMin(x - s / 2, h - 0.04, z - s / 2, x + s / 2, h, z + s / 2, c);
  v.boxMin(x - s / 2, h - 0.01, z + s / 2 - 0.015, x + s / 2, h + 0.003, z + s / 2, tone(c, 1.25));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(x + sx * (s / 2 - 0.035), (h - 0.04) / 2, z + sz * (s / 2 - 0.035), 0.04, h - 0.04, 0.04, tone(c, 0.72));
}
/** Long plank bench (along x), seat at h. */
function bench(v, x, z, { L = 2.0, d = 0.36, h = 0.42, c = C.woodM, back = false } = {}) {
  v.boxMin(x - L / 2, h - 0.05, z - d / 2, x + L / 2, h, z + d / 2, c);
  v.boxMin(x - L / 2, h - 0.008, z + d / 2 - 0.02, x + L / 2, h + 0.002, z + d / 2, tone(c, 1.2));
  const n = L > 1.4 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const lx = x - L / 2 + 0.12 + (i * (L - 0.24)) / (n - 1);
    v.boxMin(lx - 0.035, 0, z - d / 2 + 0.04, lx + 0.035, h - 0.05, z - d / 2 + 0.1, tone(c, 0.7));
    v.boxMin(lx - 0.035, 0, z + d / 2 - 0.1, lx + 0.035, h - 0.05, z + d / 2 - 0.04, tone(c, 0.7));
    v.boxMin(lx - 0.03, 0.1, z - d / 2 + 0.06, lx + 0.03, 0.14, z + d / 2 - 0.06, tone(c, 0.65));
  }
  if (back) {
    v.boxMin(x - L / 2, h, z - d / 2, x + L / 2, h + 0.5, z - d / 2 + 0.05, c);
    v.boxMin(x - L / 2, h + 0.42, z - d / 2 - 0.01, x + L / 2, h + 0.5, z - d / 2 + 0.07, tone(c, 1.15));
  }
}
/** Small clay teapot (about 0.16 tall at s = 1). */
function teapot(v, x, y, z, { s = 1, c = C.clay, ry = 0, chipped = false } = {}) {
  prism(v, x, y + 0.012 * s, z, 0.05 * s, 0.05 * s, 0.024 * s, tone(c, 0.75));
  prism(v, x, y + 0.06 * s, z, 0.07 * s, 0.075 * s, 0.075 * s, c);
  prism(v, x, y + 0.105 * s, z, 0.045 * s, 0.065 * s, 0.022 * s, tone(c, 1.12));
  prism(v, x, y + 0.125 * s, z, 0.012 * s, 0.03 * s, 0.022 * s, tone(c, 0.85));
  const cs = Math.cos(ry);
  const sn = Math.sin(ry);
  const off = (dx, dz) => [x + dx * cs + dz * sn, z - dx * sn + dz * cs];
  const [sx, sz] = off(0.09 * s, 0);
  rbox(v, sx, y + 0.075 * s, sz, 0.07 * s, 0.022 * s, 0.022 * s, c, 0, ry, 0.7);
  const [hx, hz] = off(-0.085 * s, 0);
  rbox(v, hx, y + 0.07 * s, hz, 0.02 * s, 0.07 * s, 0.022 * s, tone(c, 0.9), 0, ry);
  if (chipped) rbox(v, x + 0.03 * s, y + 0.105 * s, z + 0.05 * s, 0.03 * s, 0.02 * s, 0.02 * s, '#E8D9BF', 0, 0.4);
}
/** Tea cup on a saucer. */
function cup(v, x, y, z, c = '#F4EFE4', tea = '#B97A45') {
  v.boxMin(x - 0.045, y, z - 0.045, x + 0.045, y + 0.01, z + 0.045, c);
  prism(v, x, y + 0.035, z, 0.032, 0.025, 0.045, c, 8);
  v.boxMin(x - 0.024, y + 0.055, z - 0.024, x + 0.024, y + 0.059, z + 0.024, tea);
}
/** Big tin kettle on y, with a lid, a spout to +x and a bail handle. */
function bigKettle(v, x, y, z, { s = 1, c = C.tin } = {}) {
  prism(v, x, y + 0.03 * s, z, 0.17 * s, 0.15 * s, 0.06 * s, tone(c, 0.8));
  prism(v, x, y + 0.14 * s, z, 0.19 * s, 0.18 * s, 0.17 * s, c);
  prism(v, x, y + 0.25 * s, z, 0.12 * s, 0.18 * s, 0.06 * s, tone(c, 1.08));
  prism(v, x, y + 0.29 * s, z, 0.09 * s, 0.1 * s, 0.03 * s, tone(c, 0.9));
  prism(v, x, y + 0.315 * s, z, 0.02 * s, 0.03 * s, 0.025 * s, C.iron);
  rbox(v, x + 0.22 * s, y + 0.2 * s, z, 0.2 * s, 0.04 * s, 0.04 * s, tone(c, 0.92), 0, 0, 0.75);
  rbox(v, x + 0.3 * s, y + 0.27 * s, z, 0.06 * s, 0.035 * s, 0.035 * s, tone(c, 0.85), 0, 0, 0.3);
  for (const sz of [-1, 1]) v.boxMin(x - 0.012 * s, y + 0.27 * s, z + sz * 0.15 * s - 0.01, x + 0.012 * s, y + 0.42 * s, z + sz * 0.15 * s + 0.01, C.iron);
  v.boxMin(x - 0.015 * s, y + 0.41 * s, z - 0.15 * s, x + 0.015 * s, y + 0.44 * s, z + 0.15 * s, C.woodD);
  // soot on the base, a dent highlight
  v.boxMin(x - 0.12 * s, y + 0.06 * s, z + 0.15 * s, x - 0.04 * s, y + 0.1 * s, z + 0.19 * s, tone(c, 0.7));
}
/** Clay brazier (bucket stove) with a grate; embers glow (ctx.ember) or grey ash. */
function brazier(ctx, v, x, y, z, { s = 1, lit = true } = {}) {
  prism(v, x, y + 0.03 * s, z, 0.19 * s, 0.17 * s, 0.06 * s, C.clayD);
  prism(v, x, y + 0.15 * s, z, 0.22 * s, 0.18 * s, 0.2 * s, C.clay);
  prism(v, x, y + 0.26 * s, z, 0.235 * s, 0.235 * s, 0.03 * s, C.clayL);
  v.boxMin(x - 0.08 * s, y + 0.06 * s, z + 0.17 * s, x + 0.08 * s, y + 0.15 * s, z + 0.205 * s, C.soot); // air hole
  for (let i = -1; i <= 1; i++) v.boxMin(x + i * 0.07 * s - 0.01, y + 0.27 * s, z - 0.17 * s, x + i * 0.07 * s + 0.01, y + 0.285 * s, z + 0.17 * s, C.iron);
  if (lit) {
    ctx.ember.box(x, y + 0.255 * s, z, 0.3 * s, 0.03 * s, 0.3 * s);
    ctx.ember.box(x, y + 0.1 * s, z + 0.19 * s, 0.12 * s, 0.05 * s, 0.01);
  } else {
    v.boxMin(x - 0.15 * s, y + 0.24 * s, z - 0.15 * s, x + 0.15 * s, y + 0.27 * s, z + 0.15 * s, C.ash);
  }
}
/** Water jar on a wooden stand with a lid and a tin cup on top (about 1 m). */
function waterJar(v, x, z, { s = 1, lid = true, cupOn = true } = {}) {
  const sh = 0.32 * s;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.boxMin(x + sx * 0.2 * s - 0.03, 0, z + sz * 0.2 * s - 0.03, x + sx * 0.2 * s + 0.03, sh, z + sz * 0.2 * s + 0.03, C.woodD);
  v.boxMin(x - 0.25 * s, sh - 0.05, z - 0.25 * s, x + 0.25 * s, sh, z + 0.25 * s, C.woodM);
  v.boxMin(x - 0.22 * s, 0.08, z - 0.025, x + 0.22 * s, 0.11, z + 0.025, C.woodD);
  prism(v, x, sh + 0.06 * s, z, 0.17 * s, 0.12 * s, 0.12 * s, C.clayD);
  prism(v, x, sh + 0.24 * s, z, 0.25 * s, 0.18 * s, 0.24 * s, C.clay);
  prism(v, x, sh + 0.43 * s, z, 0.15 * s, 0.25 * s, 0.14 * s, C.clayL);
  prism(v, x, sh + 0.52 * s, z, 0.14 * s, 0.13 * s, 0.05 * s, C.clayD);
  prism(v, x, sh + 0.33 * s, z, 0.255 * s, 0.255 * s, 0.025 * s, '#E9D9B5');
  if (lid) {
    prism(v, x, sh + 0.565 * s, z, 0.17 * s, 0.17 * s, 0.03 * s, C.woodM);
    v.boxMin(x - 0.05 * s, sh + 0.58 * s, z - 0.012, x + 0.05 * s, sh + 0.6 * s, z + 0.012, C.woodD);
  }
  if (cupOn) {
    prism(v, x + 0.07 * s, sh + 0.62 * s, z + 0.04 * s, 0.045 * s, 0.04 * s, 0.07 * s, C.tinL);
    v.boxMin(x + 0.11 * s, sh + 0.6 * s, z + 0.03 * s, x + 0.135 * s, sh + 0.64 * s, z + 0.05 * s, C.tinD);
  }
}
/** Burlap rice sack (about 0.45 × 0.6), tied at the top, optionally slumped. */
function riceSack(v, x, z, { c = '#D8C7A0', ry = 0, h = 0.62, tag = null } = {}) {
  rbox(v, x, h * 0.42, z, 0.46, h * 0.84, 0.34, c, 0, ry);
  rbox(v, x, h * 0.86, z, 0.36, h * 0.14, 0.28, tone(c, 1.06), 0, ry);
  rbox(v, x, h * 0.98, z, 0.14, h * 0.1, 0.12, tone(c, 0.9), 0, ry);
  rbox(v, x, h * 0.93, z, 0.17, 0.035, 0.15, C.rope, 0, ry);
  const cs = Math.cos(ry);
  const sn = Math.sin(ry);
  rbox(v, x + 0.171 * sn, h * 0.45, z + 0.171 * cs, 0.3, 0.012, 0.004, '#B5463C', 0, ry);
  rbox(v, x + 0.171 * sn, h * 0.39, z + 0.171 * cs, 0.3, 0.012, 0.004, '#5A7FA0', 0, ry);
  if (tag) rbox(v, x + 0.18 * sn, h * 0.62, z + 0.18 * cs, 0.12, 0.08, 0.01, tag, 0, ry);
}
/** Woven round basket (bamboo), optional heap of contents. */
function basket(v, x, y, z, { r = 0.22, h = 0.2, c = '#C9A26A', fill = null, seed = 1 } = {}) {
  prism(v, x, y + h * 0.5, z, r, r * 0.82, h, c);
  for (let i = 0; i < 3; i++) prism(v, x, y + h * (0.22 + i * 0.3), z, r * (0.86 + i * 0.07) + 0.006, r * (0.86 + i * 0.07) + 0.006, 0.018, tone(c, 0.78));
  prism(v, x, y + h, z, r + 0.012, r + 0.012, 0.03, tone(c, 1.1));
  if (fill) {
    for (let i = 0; i < 9; i++) {
      const a = rnd(seed + i) * Math.PI * 2;
      const d = rnd(seed * 3 + i) * r * 0.6;
      rbox(v, x + Math.cos(a) * d, y + h + 0.01 + rnd(i + seed) * 0.04, z + Math.sin(a) * d, 0.07 + rnd(i) * 0.05, 0.05, 0.07, tone(fill, 0.85 + rnd(seed + i * 2) * 0.3), 0, rnd(i * 5) * 3);
    }
  }
}
/** Straw broom leaning on a wall. */
function broom(v, x, z, { lean = 0.18, ry = 0 } = {}) {
  rbox(v, x, 0.62, z, 0.035, 1.15, 0.035, C.woodL, lean, ry);
  rbox(v, x, 0.12, z + Math.sin(lean) * 0.0, 0.22, 0.24, 0.07, '#C8B074', lean * 0.5, ry);
  rbox(v, x, 0.25, z, 0.16, 0.04, 0.075, C.maroon, lean * 0.5, ry);
}
/** Wall clock (atlas face on a wooden ring). */
function wallClock(ctx, wall, along, y, r = 0.17, hh = 8.2) {
  const m = ctx.wallMat(wall, along, y, 0);
  const s = vsink(ctx.v, m);
  s.add(prismGeo(r, r, 0.06, 12), C.woodD, mat(0, 0, 0.03, HP, 0, 0));
  ctx.signAt(new THREE.Matrix4().multiplyMatrices(m, mat(0, 0, 0.065)), r * 1.9, r * 1.9, (g, w, h) => paintClock(g, w, h, hh), 260);
}
/** Paper calendar pinned on a wall. */
function wallCalendar(ctx, wall, along, y, opts = {}) {
  const w = opts.w ?? 0.42;
  const h = opts.h ?? 0.6;
  const m = ctx.wallMat(wall, along, y, 0);
  vsink(ctx.v, m).boxMin(-0.015, h / 2 + 0.01, 0, 0.015, h / 2 + 0.05, 0.03, C.iron);
  ctx.signAt(new THREE.Matrix4().multiplyMatrices(m, mat(0, 0, 0.012)), w, h, (g, ww, hh) => paintCalendar(g, ww, hh, opts), 320);
}

// =============================================================================================
// teashop · Daw Tin Tin's tea shop · လက်ဖက်ရည်ဆိုင် (INDEX 13.2: Day 4's layout wins)
// =============================================================================================
function buildTeashop() {
  const x = makeCtx('teashop', {
    width: 7, depth: 8, wall: '#DCCAA6', wainscot: '#4E3322', trim: '#A8843A', floor: 'planks', floorColor: '#523826',
  });
  const { v, hw, hd, dyn } = x;
  // dark, worn planks (spec: dark plank floor, dark wainscot, smoky cream wall; warm, a little dim)
  boardFloor(x, '#654730', { seed: 4 });
  wallDressing(x, { seam: '#4A3020', wash: null, seed: 5 });
  // soot shadow above the hearth and round the chimney
  for (let i = 0; i < 7; i++) {
    const w = 0.5 + rnd(i * 3) * 0.7;
    const y0 = 1.3 + i * 0.22;
    v.boxMin(0.8 - w / 2 + (rnd(i) - 0.5) * 0.2, y0, -hd, 0.8 + w / 2 + (rnd(i * 2) - 0.5) * 0.2, y0 + 0.3, -hd + 0.003, tone('#DCCAA6', 0.8 - i * 0.015));
  }

  // back window over the water jar: the back lane
  backWindow(x, -0.6, 1.72, 0.95, 0.85, (g, w, h) => {
    paintSky(g, w, h);
    paintRoofs(g, w, h, 0.45, 3);
    g.strokeStyle = '#5A4632';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, h * 0.42);
    g.quadraticCurveTo(w / 2, h * 0.52, w, h * 0.4);
    g.stroke();
    for (const [cx, c] of [[0.2, '#B5463C'], [0.42, '#EDE6D3'], [0.66, '#4F8A8B']]) { g.fillStyle = c; g.fillRect(cx * w, h * 0.46, w * 0.12, h * 0.18); }
    g.fillStyle = '#6F9E5B';
    g.beginPath();
    g.ellipse(w * 0.88, h * 0.62, w * 0.16, h * 0.2, 0, 0, 7);
    g.fill();
  }, { bars: 3, frame: C.woodM });

  // ---- hearth (0.8, −3.5): brick, firebox, brazier + big kettle, brew pot, tin hood, chimney
  const HX = 0.8;
  const HZ = -3.5;
  v.boxMin(HX - 0.7, 0, HZ - 0.4, HX + 0.7, 0.72, HZ + 0.4, C.brickD);
  for (let r = 0; r < 6; r++) {
    const y0 = 0.02 + r * 0.115;
    const off = r % 2 ? 0.12 : 0;
    for (let bx = -0.7 - off; bx < 0.7; bx += 0.24) {
      const xa = Math.max(-0.69, bx + 0.012);
      const xb = Math.min(0.69, bx + 0.228);
      if (xb - xa < 0.04) continue;
      if (r < 3 && xa > -0.28 && xb < 0.28) continue; // firebox mouth
      v.boxMin(HX + xa, y0, HZ + 0.4, HX + xb, y0 + 0.1, HZ + 0.418, tone(C.brick, 0.88 + rnd(r * 13 + bx * 7) * 0.24));
    }
  }
  v.boxMin(HX - 0.26, 0.04, HZ + 0.36, HX + 0.26, 0.36, HZ + 0.405, C.soot);
  v.boxMin(HX - 0.3, 0.36, HZ + 0.4, HX + 0.3, 0.42, HZ + 0.43, C.brickL); // arch lintel
  x.ember.box(HX, 0.09, HZ + 0.38, 0.4, 0.08, 0.03);
  x.ember.box(HX - 0.1, 0.15, HZ + 0.37, 0.14, 0.05, 0.02);
  v.boxMin(HX - 0.74, 0.72, HZ - 0.44, HX + 0.74, 0.79, HZ + 0.44, '#8A7F72');
  v.boxMin(HX - 0.74, 0.77, HZ + 0.42, HX + 0.74, 0.79, HZ + 0.445, '#A39A8C');
  brazier(x, v, HX - 0.3, 0.79, HZ + 0.02);
  bigKettle(v, HX - 0.33, 1.07, HZ + 0.02, { s: 1.05 });
  // brew pot: tall tin pot with a lid and a long ladle
  prism(v, HX + 0.35, 0.95, HZ - 0.05, 0.17, 0.16, 0.32, C.tinD);
  prism(v, HX + 0.35, 1.115, HZ - 0.05, 0.18, 0.18, 0.025, C.tin);
  prism(v, HX + 0.35, 1.14, HZ - 0.05, 0.03, 0.04, 0.03, C.iron);
  rbox(v, HX + 0.52, 1.25, HZ + 0.1, 0.03, 0.5, 0.03, C.woodL, 0.2, 0, -0.35);
  // cloth strainer hanging off a hook on the hood rod
  v.boxMin(HX + 0.6, 1.2, HZ + 0.3, HX + 0.72, 1.6, HZ + 0.33, C.iron);
  rbox(v, HX + 0.66, 1.1, HZ + 0.33, 0.1, 0.22, 0.08, '#E8D2A8', 0, 0, 0.05);
  // hood (stepped tin) + chimney pipe through the top of the wall
  const hood = [[1.3, 0.08, 0.66, 1.9], [1.02, 0.09, 0.54, 1.98], [0.7, 0.09, 0.42, 2.07], [0.36, 0.08, 0.3, 2.16]];
  hood.forEach(([w, h, d, y], i) => v.boxMin(HX - w / 2, y, -hd, HX + w / 2, y + h, -hd + d, tone('#4E4741', 1 + i * 0.06)));
  v.boxMin(HX - 0.67, 1.88, -hd + 0.64, HX + 0.67, 1.92, -hd + 0.68, '#B07A45'); // copper rim
  for (let i = 0; i < 5; i++) v.box(HX - 0.56 + i * 0.28, 1.94, -hd + 0.67, 0.03, 0.03, 0.02, '#D9B868');
  for (const s of [-1, 1]) v.boxMin(HX + s * 0.6 - 0.01, 1.98, -hd + 0.5, HX + s * 0.6 + 0.01, 2.5, -hd + 0.52, C.iron);
  prism(v, HX, 2.6, -hd + 0.15, 0.075, 0.075, 0.82, '#3E3934');
  prism(v, HX, 2.4, -hd + 0.15, 0.09, 0.09, 0.04, '#6F6A62');
  prism(v, HX, 2.8, -hd + 0.15, 0.09, 0.09, 0.04, '#6F6A62');
  x.solid(HX, HZ, 1.5, 0.9);
  // the kettle's steam is the brightest thing in the room: pure white, big soft puffs
  const steamK = steam(x, HX - 0.03, 1.36, HZ + 0.02, { n: 7, rise: 0.85, size: 0.13, speed: 0.3, color: '#FFFFFF', drift: 0.14, glow: true });
  const steamP = steam(x, HX + 0.35, 1.2, HZ - 0.05, { n: 4, rise: 0.6, size: 0.09, speed: 0.24, color: '#FBF8F0', glow: true });
  x.flag('steam', 1, (lv) => { steamK.level = +lv; steamP.level = +lv; }); // 0..1 (story can turn the kettle down)
  // the hearth's warm light: a pool on the floor in front of it and a glow on the sooty wall behind
  // the kettle, always on (stronger in the evening); the rest of the room sits a little dim
  x.warm(HX, HZ + 1.05, 1.35, (st) => 0.34 + 0.4 * st.eve);
  x.warm(HX, -hd + 0.01, 0.95, (st) => 0.2 + 0.25 * st.eve, { wall: true, y: 1.45, color: '#FF8E45', sy: 0.85 });
  x.warm(HX - 0.15, HZ + 0.42, 0.5, (st) => 0.45 + 0.3 * st.eve, { y: 0.02, color: '#FF7A35' }); // firebox spill
  x.mood = () => ({ hemi: 0.8, sun: 0.78, sunPatch: 0.7 });

  // tea-leaf basket on a low stand (1.8, −3.5) (Day 6 hides slate 3 in it)
  v.boxMin(1.55, 0, -3.75, 2.05, 0.28, -3.25, C.woodD);
  v.boxMin(1.52, 0.28, -3.78, 2.08, 0.32, -3.22, C.woodM);
  basket(v, 1.8, 0.32, -3.5, { r: 0.22, h: 0.18, fill: C.leafTea, seed: 4 });
  x.solid(1.8, -3.5, 0.56, 0.56);
  const slate3 = dyn.part(false);
  rbox(dyn.sink(slate3), 1.86, 0.55, -3.48, 0.2, 0.012, 0.15, '#3F4B43', 0.1, 0.4, 0.15);
  x.flag('slate3', false, (on) => dyn.show(slate3, on));

  // water jar (−0.4, −3.4): Ko Phyo tips each pail in; `pails` fills it (lid off, water up)
  waterJar(v, -0.4, -3.4, { lid: false, cupOn: false });
  const lidPart = dyn.part();
  const ls = dyn.sink(lidPart);
  ls.box(-0.4, 0.88 + 0.015, -3.4, 0.31, 0.03, 0.31, C.woodM);
  ls.box(-0.4, 0.91, -3.4, 0.1, 0.02, 0.025, C.woodD);
  ls.box(-0.33, 0.95, -3.36, 0.08, 0.07, 0.08, C.tinL);
  const waterPart = dyn.part(false);
  dyn.sink(waterPart).box(-0.4, 0.86, -3.4, 0.26, 0.02, 0.26, C.water);
  x.solid(-0.4, -3.4, 0.55, 0.55);
  x.flag('pails', false, (on) => { dyn.show(waterPart, on); dyn.show(lidPart, !on); });

  // shelf of small clay pots (−2.2, −3.8) and the menu slate above it
  const SX = -2.2;
  for (const y of [1.18, 1.6]) {
    v.boxMin(SX - 0.68, y - 0.035, -hd, SX + 0.68, y, -hd + 0.26, C.woodM);
    v.boxMin(SX - 0.68, y - 0.01, -hd + 0.24, SX + 0.68, y + 0.004, -hd + 0.265, tone(C.woodM, 1.25));
    for (const s of [-1, 1]) v.boxMin(SX + s * 0.55 - 0.02, y - 0.2, -hd, SX + s * 0.55 + 0.02, y - 0.035, -hd + 0.18, C.woodD);
  }
  const potCols = [C.clay, '#7A4A2E', '#9C5B3A', '#5E4636', C.clayL, '#8A5A3C', '#6B4B3A'];
  for (let i = 0; i < 4; i++) teapot(v, SX - 0.5 + i * 0.32, 1.6, -hd + 0.13, { s: 1.15, c: potCols[i], ry: 0.2 * i });
  for (let i = 0; i < 3; i++) teapot(v, SX - 0.5 + i * 0.32, 1.18, -hd + 0.13, { s: 1.15, c: potCols[4 + i], ry: -0.3 * i });
  const chipped = dyn.part();
  teapot(dyn.sink(chipped), SX + 0.46, 1.18, -hd + 0.13, { s: 1.15, c: '#C9B79A', chipped: true }); // dyn sink: boxy
  x.flag('teapot', false, (gone) => dyn.show(chipped, !gone)); // d4.teapot: Ko Phyo's chipped pot leaves the shelf
  x.sign('back', SX, 2.32, 1.22, 0.76, (g, w, h) => {
    slateBg(g, w, h, 4);
    g.strokeStyle = '#8A6A42';
    g.lineWidth = 12;
    g.strokeRect(6, 6, w - 12, h - 12);
    txt(g, 'လက်ဖက်ရည် · ရေနွေးကြမ်း', w / 2, h * 0.22, h * 0.13, '#F1EEE4', { max: w * 0.9 });
    txt(g, 'Tea · plain green tea', w / 2, h * 0.37, h * 0.07, '#CFD6CC', { font: FONT_SERIF, weight: 600 });
    g.strokeStyle = 'rgba(240,236,226,0.6)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(w * 0.18, h * 0.47);
    g.lineTo(w * 0.82, h * 0.47);
    g.stroke();
    txt(g, 'မနက်ဦးခွက်', w / 2, h * 0.6, h * 0.13, '#F3D27A');
    txt(g, 'ဖြတ်သွားသူအတွက်', w / 2, h * 0.75, h * 0.11, '#F3D27A');
    txt(g, "The morning's first cup · for whoever passes", w / 2, h * 0.88, h * 0.055, '#CFD6CC', { font: FONT_SERIF, weight: 600 });
  });
  // shop name board over the window
  x.sign('back', -0.6, 2.55, 1.5, 0.34, (g, w, h) => {
    rrect(g, 3, 3, w - 6, h - 6, 14, '#6E1F2A', '#C9A24A', 6);
    txt(g, 'တင်တင် လက်ဖက်ရည်', w / 2, h * 0.43, h * 0.38, '#F3D27A', { max: w * 0.92 });
    txt(g, "TIN TIN'S TEA", w / 2, h * 0.82, h * 0.15, '#E9D3A0', { font: FONT_SERIF, weight: 600 });
  }, { off: 0.03 });
  v.boxMin(-1.38, 2.36, -hd, 0.18, 2.74, -hd + 0.025, '#4A141C');

  // kitchen doorway with a half curtain (2.9, −3.9) + two rice sacks (not walkable)
  const KX = 2.9;
  v.boxMin(KX - 0.45, 0, -hd, KX + 0.45, 2.05, -hd + 0.012, '#2E211A');
  v.boxMin(KX - 0.55, 0, -hd, KX - 0.45, 2.15, -hd + 0.1, C.woodD);
  v.boxMin(KX + 0.45, 0, -hd, KX + 0.55, 2.15, -hd + 0.1, C.woodD);
  v.boxMin(KX - 0.6, 2.05, -hd, KX + 0.6, 2.18, -hd + 0.12, C.woodM);
  v.boxMin(KX - 0.5, 1.98, -hd + 0.1, KX + 0.5, 2.0, -hd + 0.13, C.iron);
  const curtain = [];
  for (let i = 0; i < 4; i++) {
    const p = dyn.part();
    const cs = dyn.sink(p);
    const col = i % 2 ? '#C9A24A' : '#6E1F2A';
    cs.box(0, -0.42, 0, 0.215, 0.84, 0.025, col);
    cs.box(0, -0.12, 0.014, 0.215, 0.05, 0.006, i % 2 ? '#6E1F2A' : '#E9D3A0');
    curtain.push(p);
  }
  x.every((dt, t) => {
    for (let i = 0; i < 4; i++) dyn.set(curtain[i], KX - 0.33 + i * 0.22, 1.98, -hd + 0.13, Math.sin(t * 1.1 + i * 0.9) * 0.05, 0, Math.sin(t * 0.7 + i) * 0.02, 1);
  });
  riceSack(v, KX + 0.25, -3.45, { ry: -0.2 });
  riceSack(v, KX - 0.28, -3.55, { ry: 0.25, c: '#CDBA92', h: 0.55 });
  x.solid(KX, -3.55, 1.1, 0.7);

  // wall clock over the basket, calendar and thermos shelf on the right wall, painting + towels on the left
  wallClock(x, 'back', 1.95, 2.45, 0.16, 7.9);
  wallCalendar(x, 'right', -1.55, 1.8, { title: 'တန်ဆောင်မုန်း' });
  {
    const s = x.onWall('right', -2.75, 1.45);
    s.boxMin(-0.55, -0.035, 0, 0.55, 0, 0.26, C.woodM);
    for (const sx of [-0.42, 0.42]) s.boxMin(sx - 0.02, -0.2, 0, sx + 0.02, -0.035, 0.18, C.woodD);
    const fl = ['#D98C95', '#5A7FA0', '#6F9E5B'];
    for (let i = 0; i < 3; i++) {
      prism(s, -0.36 + i * 0.2, 0.17, 0.12, 0.065, 0.07, 0.3, fl[i]);
      prism(s, -0.36 + i * 0.2, 0.33, 0.12, 0.045, 0.06, 0.04, tone(fl[i], 0.7));
      s.boxMin(-0.36 + i * 0.2 - 0.06, 0.1, 0.18, -0.36 + i * 0.2 + 0.06, 0.16, 0.19, '#F4EFE4');
    }
    for (let i = 0; i < 2; i++) {
      prism(s, 0.27 + i * 0.17, 0.11, 0.12, 0.06, 0.06, 0.2, C.glass);
      prism(s, 0.27 + i * 0.17, 0.08, 0.12, 0.05, 0.05, 0.12, i ? '#D9A93B' : '#C27A5B');
      prism(s, 0.27 + i * 0.17, 0.225, 0.12, 0.05, 0.05, 0.03, C.red);
    }
  }
  {
    const s = x.onWall('left', -2.4, 1.85);
    s.boxMin(-0.42, -0.3, 0, 0.42, 0.3, 0.04, C.goldDeep || P.goldDeep);
    x.signAt(new THREE.Matrix4().multiplyMatrices(x.wallMat('left', -2.4, 1.85), mat(0, 0, 0.045)), 0.72, 0.48, (g, w, h) => {
      paintSky(g, w, h, '#A8CBE0', '#F3DDB4');
      g.fillStyle = '#7FA36B';
      g.beginPath();
      g.moveTo(0, h * 0.7);
      g.quadraticCurveTo(w * 0.3, h * 0.35, w * 0.6, h * 0.62);
      g.quadraticCurveTo(w * 0.8, h * 0.45, w, h * 0.6);
      g.lineTo(w, h);
      g.lineTo(0, h);
      g.fill();
      g.fillStyle = '#6FA2B8';
      g.fillRect(0, h * 0.8, w, h * 0.2);
      g.fillStyle = '#8E5A3C';
      g.fillRect(w * 0.2, h * 0.72, w * 0.18, h * 0.08);
    }, 260);
    const t = x.onWall('left', -0.75, 1.5);
    t.boxMin(-0.35, 0, 0, 0.35, 0.05, 0.05, C.woodD);
    for (const [px, c] of [[-0.2, '#F4EFE4'], [0.12, '#D98C95']]) {
      t.boxMin(px - 0.02, -0.02, 0.05, px + 0.02, 0.04, 0.1, C.iron);
      t.boxMin(px - 0.11, -0.42, 0.06, px + 0.11, 0.0, 0.09, c);
      t.boxMin(px - 0.11, -0.36, 0.09, px + 0.11, -0.33, 0.095, tone(c, 0.8));
    }
  }

  // ---- serving counter (0.6, −2.4): dark body, brass top, snack cabinet, cups, milk tins
  const CX = 0.6;
  const CZ = -2.4;
  const CW = 2.4;
  const CY = 0.9;
  v.boxMin(CX - CW / 2, 0, CZ - 0.3, CX + CW / 2, 0.08, CZ + 0.3, '#2E1F15');
  v.boxMin(CX - CW / 2 + 0.02, 0.08, CZ - 0.28, CX + CW / 2 - 0.02, CY - 0.06, CZ + 0.28, '#4E3322');
  for (let i = 0; i < 4; i++) {
    const x0 = CX - CW / 2 + 0.1 + i * 0.57;
    v.boxMin(x0, 0.16, CZ + 0.28, x0 + 0.5, CY - 0.14, CZ + 0.3, '#5E3F28');
    v.boxMin(x0 + 0.05, 0.22, CZ + 0.3, x0 + 0.45, CY - 0.2, CZ + 0.31, '#6B4A30');
  }
  v.boxMin(CX - CW / 2 - 0.05, CY - 0.06, CZ - 0.33, CX + CW / 2 + 0.05, CY, CZ + 0.33, '#B8913F');
  v.boxMin(CX - CW / 2 - 0.05, CY - 0.015, CZ + 0.31, CX + CW / 2 + 0.05, CY + 0.002, CZ + 0.33, '#D9B868');
  x.solid(CX, CZ, CW, 0.6);
  // snack cabinet (left end): wooden frame, glass top, two trays of fritters inside
  {
    const x0 = CX - 1.02;
    const x1 = CX - 0.42;
    v.boxMin(x0, 0.9, CZ - 0.24, x1, 0.93, CZ + 0.22, C.woodM);
    for (const xx of [x0, x1 - 0.03]) for (const zz of [CZ - 0.24, CZ + 0.19]) v.boxMin(xx, 0.93, zz, xx + 0.03, 1.32, zz + 0.03, C.woodM);
    v.boxMin(x0, 1.32, CZ - 0.24, x1, 1.35, CZ + 0.22, C.woodM);
    v.boxMin(x0 + 0.03, 1.325, CZ - 0.21, x1 - 0.03, 1.348, CZ + 0.19, '#CFE3E6');
    v.boxMin(x0 + 0.03, 1.1, CZ - 0.21, x1 - 0.03, 1.115, CZ + 0.19, '#CFE3E6');
    for (let i = 0; i < 5; i++) {
      rbox(v, x0 + 0.1 + i * 0.12, 0.96, CZ + rnd(i) * 0.1 - 0.05, 0.09, 0.04, 0.07, i % 2 ? '#C98A3E' : '#D9A24E', 0, rnd(i * 3) * 2);
      rbox(v, x0 + 0.1 + i * 0.12, 1.15, CZ + rnd(i + 9) * 0.1 - 0.05, 0.08, 0.05, 0.08, i % 2 ? '#B97A35' : '#E0B060', 0, rnd(i * 7) * 2);
    }
    v.boxMin(x0 + 0.03, 0.93, CZ + 0.18, x1 - 0.03, 1.32, CZ + 0.19, '#D7E8EA'); // front glass (pale)
  }
  // cups stacked upside down on a tray, condensed-milk tins, sugar jar, a cash tin
  v.boxMin(CX - 0.3, 0.9, CZ - 0.2, CX + 0.25, 0.915, CZ + 0.2, '#C9A24A');
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4 - r; c++) prism(v, CX - 0.2 + c * 0.13 + r * 0.065, 0.94 + r * 0.06, CZ - 0.02, 0.028, 0.04, 0.055, '#F4EFE4');
  for (let i = 0; i < 3; i++) {
    prism(v, CX + 0.42 + i * 0.12, 0.96, CZ - 0.12, 0.045, 0.045, 0.11, '#F2F0EA');
    prism(v, CX + 0.42 + i * 0.12, 0.96, CZ - 0.12, 0.047, 0.047, 0.04, i === 1 ? '#2F5DB3' : '#B5463C');
  }
  prism(v, CX + 0.88, 0.99, CZ + 0.05, 0.07, 0.07, 0.18, C.glass);
  prism(v, CX + 0.88, 0.96, CZ + 0.05, 0.06, 0.06, 0.1, '#F4EFE4');
  prism(v, CX + 0.88, 1.09, CZ + 0.05, 0.075, 0.075, 0.025, C.red);
  v.boxMin(CX + 1.0, 0.9, CZ - 0.2, CX + 1.18, 1.0, CZ + 0.02, '#6E7F86');
  teapot(v, CX + 0.6, 0.9, CZ + 0.12, { c: '#5E4636' });
  cup(v, CX + 0.38, 0.9, CZ + 0.18);

  // ---- low tables and stools: A (−1.6, −0.8), B (1.6, −0.8), C (−2.2, 2.0), D (1.5, 2.6)
  const stoolC = [C.woodM, '#6E8FA0', '#B5533C', '#4F7A5E', C.woodL];
  const tables = [
    { id: 'A', x: -1.6, z: -0.8, stools: [[-0.6, 0], [0.6, 0]] },
    { id: 'B', x: 1.6, z: -0.8, stools: [[-0.6, 0], [0.6, 0], [0, 0.6]] },
    { id: 'C', x: -2.2, z: 2.0, stools: [[-0.6, 0], [0.6, 0]] },
    { id: 'D', x: 1.5, z: 2.6, w: 0.6, stools: [[0.6, 0]] },
  ];
  tables.forEach((tb, i) => {
    const w = tb.w ?? 0.75;
    lowTable(v, tb.x, tb.z, { w, d: w });
    tb.stools.forEach(([dx, dz], k) => lowStool(v, tb.x + dx, tb.z + dz, { c: stoolC[(i * 2 + k) % stoolC.length] }));
    // plain green tea on every table: pot, cups, tissue box, a small dish
    teapot(v, tb.x - 0.12, 0.42, tb.z - 0.1, { c: i % 2 ? '#7A4A2E' : '#9C5B3A', ry: i });
    cup(v, tb.x + 0.14, 0.42, tb.z + 0.1, '#F4EFE4', '#C9A24A');
    if (w > 0.7) cup(v, tb.x - 0.18, 0.42, tb.z + 0.18, '#F4EFE4', '#B97A45');
    v.boxMin(tb.x + 0.08, 0.42, tb.z - 0.27, tb.x + 0.28, 0.5, tb.z - 0.15, '#D98C95');
    v.boxMin(tb.x + 0.15, 0.5, tb.z - 0.22, tb.x + 0.21, 0.53, tb.z - 0.2, '#FFFDF8');
    x.solid(tb.x, tb.z, w, w);
  });
  // a dish of fritters on B, a newspaper on A
  prism(v, 1.75, 0.435, -0.62, 0.11, 0.09, 0.02, '#F4EFE4');
  for (let i = 0; i < 3; i++) rbox(v, 1.7 + i * 0.05, 0.46, -0.62 + (i % 2) * 0.03, 0.06, 0.03, 0.05, '#D9A24E', 0, i);
  rbox(v, -1.45, 0.425, -0.72, 0.3, 0.008, 0.22, '#EFE9DC', 0, 0.3);
  rbox(v, -1.45, 0.43, -0.72, 0.22, 0.004, 0.02, '#8E8A84', 0, 0.3);

  // Day 6: the wall bench on the right wall (3.1, 0.4) heading −π/2
  {
    const s = x.at(3.1, 0.4, -HP);
    bench(s, 0, 0, { L: 2.0, d: 0.38, back: true, c: C.woodM });
    x.solid(3.1, 0.4, 2.0, 0.42, -HP);
  }
  // front: water pot with a dipper (−2.7, 3.2), a stack of spare stools (2.7, 3.3), broom
  waterJar(v, -2.85, 3.15, { s: 0.85 });
  x.solid(-2.85, 3.15, 0.5, 0.5);
  for (let i = 0; i < 4; i++) lowStool(v, 2.85, 3.3, { h: 0.27 + i * 0.045, c: stoolC[i], s: 0.27 - i * 0.004 });
  x.solid(2.85, 3.3, 0.35, 0.35);
  broom(v, -3.3, 2.3, { lean: -0.2 });
  // paper napkins on the floor near the tables
  for (let i = 0; i < 4; i++) rbox(v, -1.0 + rnd(i * 3) * 2.6, 0.008, -0.2 + rnd(i * 5) * 2.4, 0.08, 0.004, 0.07, '#FFFDF8', 0, rnd(i) * 3);

  // lamps on the cross beam
  wallLamp(x, 'left', -1.75, 2.05);
  wallLamp(x, 'right', -0.75, 2.05);
  // the shop cat asleep by the bench
  {
    const s = x.at(2.55, 1.75, -0.5);
    s.box(0, 0.07, 0, 0.26, 0.13, 0.18, '#D9893B');
    s.box(0.15, 0.1, 0.03, 0.14, 0.12, 0.13, '#E39A4C');
    s.box(0.18, 0.17, 0.0, 0.04, 0.04, 0.03, '#C27530');
    s.box(0.18, 0.17, 0.07, 0.04, 0.04, 0.03, '#C27530');
    s.box(-0.05, 0.03, 0.11, 0.3, 0.05, 0.06, '#C27530');
    s.box(-0.02, 0.135, 0, 0.12, 0.012, 0.18, '#B9692A');
  }
  smallLamp(x, CX + 1.05, CY, CZ + 0.15);

  // ---- people (INDEX 13.2 + Days 4, 5, 6, 7, 14)
  x.spot('tintin', 0.6, -3.0, 0); // Daw Tin Tin behind the counter
  x.spot('kophyo', -2.8, 2.0, HP, { seat: 0.27 }); // Ko Phyo's stool at C, sees out of the door
  x.spot('mayaTalk', -1.6, 2.0, -HP, { seat: 0.27 }); // Maya's stool for the talk
  x.spot('kophyoHearth', 1.6, -2.95, 0); // Day 6: at the hearth's right end
  x.spot('kophyoPour', 1.0, 2.6, HP); // Day 4: pours standing at the door table
  x.spot('porterD', 2.1, 2.6, -HP, { seat: 0.27 }); // the porter's first cup at D
  x.spot('yaungA', -2.2, -0.8, HP, { seat: 0.27 }); // Ko Yaung during the pour (table A)
  x.spot('seatA2', -1.0, -0.8, -HP, { seat: 0.27 });
  x.spot('drinkerB1', 1.0, -0.8, HP, { seat: 0.27 }); // walk-ons / D5, D7 porters at B
  x.spot('drinkerB2', 2.2, -0.8, -HP, { seat: 0.27 });
  x.spot('drinkerB3', 1.6, -0.2, PI, { seat: 0.27 });
  x.spot('doorway', 0, 3.7, PI); // Daw Pyone looks in
  x.spot('bench', 2.95, 0.4, -HP, { seat: 0.42 }); // Day 6: Nay Chi reads slate 1
  x.spot('cupStart', -0.6, -2.0, PI); // Day 6 cup walk: from the counter's left end
  x.spot('cupWalk1', 0, -0.8, 0); // between A and B
  x.spot('cupWalk2', -1.3, 1.25, -HP); // round C
  x.spot('cupWalk3', 2.5, 0.5, HP); // to the bench
  x.spot('sellerA', -1.6, -0.15, 0); // Day 5 envelope seller loops A → C → D
  x.spot('sellerC', -1.5, 1.3, 0);
  x.spot('sellerD', 0.85, 2.0, 0);
  x.spot('kophyoA', -2.2, -0.8, HP, { seat: 0.27 }); // Day 14 remaps
  x.spot('khwarnyoB', 1.0, -0.8, HP, { seat: 0.27 });
  x.spot('kolwinD', 2.1, 2.6, -HP, { seat: 0.27 });
  x.spot('cupC', -2.2, 2.0, 0, { y: 0.42 }); // Ko Phyo's cup on table C (a prop spot)
  x.spot('maya', 0, 2.8, PI); // just inside the door

  // ---- taps (looks; no markers)
  x.tap('menu', -2.2, -2.9, { x: -2.2, z: -4.0 }, { line: { my: 'မနက်ဦးခွက် · ဖြတ်သွားသူအတွက်', en: "The morning's first cup · for whoever passes" } });
  x.tap('hearth', 0.8, -1.75, { x: 0.8, z: -3.5 });
  x.tap('potShelf', -2.2, -2.95, { x: -2.2, z: -3.8 });
  x.tap('waterJar', -1.0, -2.95, { x: -0.4, z: -3.4 });
  x.tap('teaBasket', 2.35, -2.75, { x: 1.8, z: -3.5 });
  x.tap('wallBench', 2.45, 0.4, { x: 3.1, z: 0.4 });

  return finishRoom(x, { my: 'လက်ဖက်ရည်ဆိုင်', en: "Daw Tin Tin's tea shop" });
}

// =============================================================================================
// marketpost · the Market post office, front room · ဈေးစာတိုက် (the letter counter, Day 4)
// =============================================================================================
const MY_NUM = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
const myNum = (n) => String(n).split('').map((d) => MY_NUM[+d]).join('');
const ENV = ['#F4ECD8', '#FBF6EA', '#CBD9E4', '#F2D9D2', '#E8DDBF', '#DCE6D2'];

/** A standing / leaning envelope (w × h) with an airmail edge on some. */
function envelope(v, x, y, z, { w = 0.16, h = 0.1, c = '#F4ECD8', lean = 0, ry = 0, air = false } = {}) {
  rbox(v, x, y + h / 2, z, w, h, 0.008, c, lean, ry);
  if (air) rbox(v, x, y + h - 0.012, z + 0.002, w, 0.012, 0.01, '#B5463C', lean, ry);
}
/** A flat pile of envelopes on a surface. */
function letterPile(v, x, y, z, n, seed = 1) {
  let yy = y;
  for (let i = 0; i < n; i++) {
    const c = ENV[Math.floor(rnd(seed + i * 3.3) * ENV.length)];
    rbox(v, x + (rnd(seed + i) - 0.5) * 0.03, yy + 0.006, z + (rnd(seed * 2 + i) - 0.5) * 0.03, 0.2, 0.012, 0.13, c, 0, (rnd(seed * 5 + i) - 0.5) * 0.5);
    if (rnd(seed * 7 + i) > 0.6) rbox(v, x, yy + 0.0125, z + 0.055, 0.18, 0.002, 0.012, '#2F5DB3', 0, 0);
    yy += 0.012;
  }
  return yy;
}
/** Hand postmark stamp: brass foot, wooden knob handle. */
function postmarkStamp(v, x, y, z) {
  v.boxMin(x - 0.04, y, z - 0.04, x + 0.04, y + 0.025, z + 0.04, '#8C6A28');
  prism(v, x, y + 0.045, z, 0.015, 0.015, 0.04, '#2A2118');
  prism(v, x, y + 0.095, z, 0.03, 0.02, 0.06, C.woodD);
  prism(v, x, y + 0.13, z, 0.028, 0.03, 0.02, C.woodM);
}
/** Ink pad tin. */
function inkPad(v, x, y, z, c = '#6E1F2A') {
  v.boxMin(x - 0.07, y, z - 0.045, x + 0.07, y + 0.022, z + 0.045, C.tinD);
  v.boxMin(x - 0.06, y + 0.022, z - 0.036, x + 0.06, y + 0.026, z + 0.036, c);
}
/** Small ink pot (glass, cork). */
function inkPot(v, x, y, z) {
  prism(v, x, y + 0.03, z, 0.035, 0.04, 0.06, '#2C3640');
  prism(v, x, y + 0.07, z, 0.018, 0.022, 0.025, '#C9A26A');
}
/** Big kite-paper airmail border band along the back wall. */
function airmailBand(ctx, y, h = 0.07) {
  const { v, hw, hd } = ctx;
  let i = 0;
  for (let xx = -hw; xx < hw - 0.05; xx += 0.17, i++) v.boxMin(xx, y, -hd, Math.min(hw, xx + 0.11), y + h, -hd + 0.006, i % 2 ? '#B5463C' : '#2F5DB3');
}

function buildMarketpost() {
  const x = makeCtx('marketpost', {
    width: 7, depth: 8, wall: '#F2E8D2', wainscot: P.maroon, trim: P.goldDeep, floor: 'tiles', floorColor: '#EFE5CE', floorColor2: C.terra,
  });
  const { v, hw, hd, dyn } = x;
  tileFloor(x, '#F0E6CF', '#C9744F', { size: 0.5, seed: 3 });
  wallDressing(x, { seam: P.maroonDeep, wash: null, seed: 2 });
  airmailBand(x, 2.7);

  // back window, far left: the lane, and Thiri's kite high over the roofs
  backWindow(x, -2.6, 1.75, 1.0, 0.9, (g, w, h) => {
    paintSky(g, w, h, '#93C1E2', '#F4E2C2');
    paintRoofs(g, w, h, 0.55, 7);
    const kx = w * 0.62;
    const ky = h * 0.22;
    g.fillStyle = '#E2A23C';
    g.beginPath();
    g.moveTo(kx, ky - h * 0.1);
    g.lineTo(kx + w * 0.08, ky);
    g.lineTo(kx, ky + h * 0.13);
    g.lineTo(kx - w * 0.08, ky);
    g.fill();
    g.strokeStyle = '#6E1F2A';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(kx, ky - h * 0.1);
    g.lineTo(kx, ky + h * 0.13);
    g.moveTo(kx - w * 0.08, ky);
    g.lineTo(kx + w * 0.08, ky);
    g.stroke();
    g.strokeStyle = 'rgba(60,40,30,0.7)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(kx, ky + h * 0.13);
    g.quadraticCurveTo(kx - w * 0.05, h * 0.6, kx - w * 0.35, h);
    g.stroke();
    for (let i = 0; i < 3; i++) { g.fillStyle = i % 2 ? '#B5463C' : '#F6F0E2'; g.fillRect(kx - 4 + Math.sin(i) * 6, ky + h * (0.16 + i * 0.06), 8, 6); }
  }, { bars: 2, frame: C.woodM, curtain: '#C9A24A' });

  // ---- pigeonhole wall (centre x 0.6, 2.6 × 1.6, y 1.0–2.6): ၁–၁၆, every hole full except ၁၄
  const PX = 0.6;
  const PW = 2.6;
  const PY0 = 1.0;
  const PH = 1.6;
  const PD = 0.32;
  const cw = PW / 4;
  const ch = PH / 4;
  const pz = -hd;
  v.boxMin(PX - PW / 2 - 0.05, PY0 - 0.05, pz, PX + PW / 2 + 0.05, PY0 + PH + 0.05, pz + 0.02, '#3E2A1C');
  v.boxMin(PX - PW / 2 - 0.06, PY0 + PH, pz, PX + PW / 2 + 0.06, PY0 + PH + 0.08, pz + PD + 0.04, C.woodD);
  v.boxMin(PX - PW / 2 - 0.08, PY0 + PH + 0.08, pz, PX + PW / 2 + 0.08, PY0 + PH + 0.12, pz + PD + 0.06, P.goldDeep);
  for (let i = 0; i <= 4; i++) {
    v.boxMin(PX - PW / 2 + i * cw - 0.025, PY0, pz, PX - PW / 2 + i * cw + 0.025, PY0 + PH, pz + PD, C.woodM);
    v.boxMin(PX - PW / 2, PY0 + i * ch - 0.02, pz, PX + PW / 2, PY0 + i * ch + 0.02, pz + PD, i === 0 ? C.woodD : C.woodM);
    v.boxMin(PX - PW / 2, PY0 + i * ch + 0.012, pz + PD - 0.01, PX + PW / 2, PY0 + i * ch + 0.02, pz + PD + 0.004, tone(C.woodM, 1.25));
  }
  v.boxMin(PX - PW / 2 - 0.06, PY0 - 0.08, pz, PX + PW / 2 + 0.06, PY0, pz + PD + 0.04, C.woodD);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const n = r * 4 + c + 1;
      const cx = PX - PW / 2 + (c + 0.5) * cw;
      const yb = PY0 + PH - (r + 1) * ch + 0.02;
      if (n !== 14) {
        const k = 1 + Math.floor(rnd(n * 3.1) * 3);
        for (let j = 0; j < k; j++) {
          envelope(v, cx - 0.12 + j * 0.09 + rnd(n + j) * 0.04, yb, pz + 0.12 + j * 0.05, {
            w: 0.2 + rnd(n * 2 + j) * 0.08, h: 0.12 + rnd(n + j * 5) * 0.06, c: ENV[(n + j) % ENV.length], lean: -0.15 + rnd(n * 7 + j) * 0.1, ry: (rnd(n + j * 9) - 0.5) * 0.3, air: rnd(n * 11 + j) > 0.6,
          });
        }
      }
      // brass number plate under each hole
      v.boxMin(cx - 0.12, yb - 0.035, pz + PD - 0.002, cx + 0.12, yb + 0.075, pz + PD + 0.012, '#B8913F');
      x.signAt(mat(cx, yb + 0.02, pz + PD + 0.014), 0.22, 0.095, (g, w, h) => {
        g.fillStyle = n === 14 ? '#F3D27A' : '#C9A24A';
        g.fillRect(0, 0, w, h);
        txt(g, myNum(n), w / 2, h * 0.56, h * 0.92, n === 14 ? '#6E1F2A' : '#2A1C12');
      }, 420);
    }
  }
  // the post office's name, over the pigeonholes
  x.sign('back', PX, 2.79, 1.7, 0.15, (g, w, h) => {
    g.fillStyle = '#F2E8D2';
    g.fillRect(0, 0, w, h);
    txt(g, 'ဈေးစာတိုက် · MARKET POST', w / 2, h * 0.55, h * 0.7, '#6E1F2A', { max: w * 0.96 });
  }, { off: 0.008, ppm: 420 });
  // U Lu Aye's paper plane, pinned left of the pigeonholes (from d4.plane.luaye)
  const plane = dyn.part(false);
  {
    const s = dyn.sink(plane, x.wallMat('back', -1.2, 2.0, 0.03));
    rbox(s, 0, 0, 0, 0.34, 0.012, 0.05, '#FBF6EA', 0, 0, 0.25);
    rbox(s, -0.02, -0.01, 0.01, 0.26, 0.012, 0.12, '#F4ECD8', 0.45, 0, 0.25);
    rbox(s, -0.02, -0.03, 0.0, 0.24, 0.01, 0.1, '#E8DDBF', -0.5, 0, 0.25);
    s.box(0.02, 0.01, 0.03, 0.03, 0.03, 0.02, P.gold);
  }
  x.flag('plane', false, (on) => dyn.show(plane, on));

  // ---- letter counter: w 4.6 at (0.4, −2.3), d 0.7, h 1.05, gold top, maroon body, cream panels
  const CX = 0.4;
  const CZ = -2.3;
  const CW = 4.6;
  const CD = 0.7;
  const CH = 1.05;
  v.boxMin(CX - CW / 2, 0, CZ - CD / 2, CX + CW / 2, 0.1, CZ + CD / 2 + 0.02, P.maroonDeep);
  v.boxMin(CX - CW / 2 + 0.02, 0.1, CZ - CD / 2, CX + CW / 2 - 0.02, CH - 0.07, CZ + CD / 2, P.maroon);
  for (let i = 0; i < 6; i++) {
    const x0 = CX - CW / 2 + 0.12 + i * ((CW - 0.24) / 6);
    const x1 = x0 + (CW - 0.24) / 6 - 0.1;
    v.boxMin(x0, 0.2, CZ + CD / 2, x1, CH - 0.2, CZ + CD / 2 + 0.015, '#E9DFC6');
    v.boxMin(x0 + 0.04, 0.24, CZ + CD / 2 + 0.015, x1 - 0.04, CH - 0.24, CZ + CD / 2 + 0.02, '#F2E8D2');
    v.boxMin(x0 - 0.02, 0.18, CZ + CD / 2 + 0.005, x0, CH - 0.18, CZ + CD / 2 + 0.02, P.gold);
  }
  v.boxMin(CX - CW / 2 - 0.05, CH - 0.07, CZ - CD / 2 - 0.05, CX + CW / 2 + 0.05, CH, CZ + CD / 2 + 0.05, P.gold);
  v.boxMin(CX - CW / 2 - 0.05, CH - 0.015, CZ + CD / 2 + 0.03, CX + CW / 2 + 0.05, CH + 0.002, CZ + CD / 2 + 0.05, '#E3C66E');
  x.solid(CX, CZ, CW, CD);
  // counter plate «စာလက်ခံ» on the front, centred
  x.signAt(mat(CX, 0.72, CZ + CD / 2 + 0.025), 0.9, 0.24, (g, w, h) => {
    rrect(g, 3, 3, w - 6, h - 6, 10, '#C9A24A', '#6E1F2A', 5);
    txt(g, 'စာလက်ခံ', w / 2, h * 0.42, h * 0.42, '#4A141C');
    txt(g, 'LETTERS', w / 2, h * 0.8, h * 0.17, '#6E1F2A', { font: FONT_SERIF });
  });
  // brass end posts with little wickets
  for (const ex of [CX - CW / 2 + 0.08, CX + CW / 2 - 0.08]) {
    v.boxMin(ex - 0.03, CH, CZ - 0.03, ex + 0.03, CH + 0.42, CZ + 0.03, '#B8913F');
    prism(v, ex, CH + 0.45, CZ, 0.045, 0.03, 0.05, '#D9B868');
  }
  // on the counter: letter scale, stamp rack, bell, pen + ink, letter piles, a twine ball
  {
    const y = CH;
    // letter scale (brass) at the right
    v.boxMin(CX + 1.45, y, CZ - 0.12, CX + 1.75, y + 0.03, CZ + 0.12, '#8C6A28');
    v.boxMin(CX + 1.58, y + 0.03, CZ - 0.02, CX + 1.62, y + 0.22, CZ + 0.02, '#B8913F');
    v.boxMin(CX + 1.48, y + 0.22, CZ - 0.09, CX + 1.72, y + 0.235, CZ + 0.09, '#D9B868');
    envelope(v, CX + 1.6, y + 0.235, CZ, { w: 0.18, h: 0.012, c: '#F4ECD8' });
    prism(v, CX + 1.6, y + 0.13, CZ + 0.035, 0.07, 0.07, 0.02, '#FBF6EA', 12);
    // stamp rack: six rubber stamps on a little wooden stand
    v.boxMin(CX + 0.65, y, CZ - 0.2, CX + 1.1, y + 0.05, CZ - 0.05, C.woodD);
    for (let i = 0; i < 6; i++) postmarkStamp(v, CX + 0.69 + i * 0.075, y + 0.05, CZ - 0.125);
    inkPad(v, CX + 0.9, y, CZ + 0.12);
    // bell
    prism(v, CX - 0.2, y + 0.04, CZ + 0.18, 0.05, 0.07, 0.07, '#C9A24A');
    prism(v, CX - 0.2, y + 0.085, CZ + 0.18, 0.01, 0.012, 0.03, '#2A2118');
    // ink pot + dip pen
    inkPot(v, CX + 0.25, y, CZ - 0.15);
    rbox(v, CX + 0.33, y + 0.06, CZ - 0.12, 0.012, 0.16, 0.012, '#2A2118', 0.5, 0, -0.4);
    // letter piles + a twine ball
    letterPile(v, CX - 0.75, y, CZ - 0.05, 7, 3);
    letterPile(v, CX - 0.45, y, CZ + 0.05, 4, 8);
    prism(v, CX - 1.6, y + 0.06, CZ - 0.1, 0.07, 0.07, 0.12, C.twine);
    // window-grille for the wicket in the middle
    v.boxMin(CX - 0.05, y, CZ - 0.32, CX + 0.05, y + 0.6, CZ - 0.28, '#B8913F');
  }
  // Day 6: a heap of stamps on the counter, slate 5 face down in it
  const stampHeap = dyn.part(false);
  {
    const s = dyn.sink(stampHeap);
    const cols = ['#B5463C', '#2F5DB3', '#6F9E5B', '#D9A93B', '#8E5A9C', '#E8DDBF'];
    for (let i = 0; i < 26; i++) {
      const a = rnd(i * 2.3) * Math.PI * 2;
      const d = rnd(i * 4.1) * 0.22;
      rbox(s, CX - 1.15 + Math.cos(a) * d, CH + 0.006 + rnd(i) * 0.03, CZ + Math.sin(a) * d * 0.6, 0.05, 0.006, 0.06, cols[i % cols.length], 0, rnd(i * 7) * 3);
    }
    rbox(s, CX - 1.15, CH + 0.012, CZ + 0.02, 0.22, 0.014, 0.16, '#3F4B43', 0, 0.3, 0);
  }
  x.flag('stamps', false, (on) => dyn.show(stampHeap, on));
  // U Lu Aye's high stool behind the counter (0.6, −3.0)
  {
    const sx = 0.6;
    const sz = -3.0;
    v.boxMin(sx - 0.2, 0.68, sz - 0.2, sx + 0.2, 0.74, sz + 0.2, C.woodM);
    for (const a of [-1, 1]) for (const b of [-1, 1]) v.box(sx + a * 0.16, 0.34, sz + b * 0.16, 0.05, 0.68, 0.05, C.woodD);
    v.boxMin(sx - 0.17, 0.25, sz - 0.17, sx + 0.17, 0.28, sz + 0.17, C.woodD);
  }

  // ---- cord rail at the counter's left end: a wide cleat board on two posts, 16 brass cleats in two
  // rows of eight (၁–၁၆), each cord rising to the top rail and gathered into one rope that runs up
  // over a pulley on the back wall and out through it to the flag board over the door
  {
    const rx = -2.6;
    const rz = -2.3;
    const RW = 1.0;
    for (const a of [-1, 1]) {
      v.boxMin(rx + a * RW / 2 - 0.05, 0, rz - 0.05, rx + a * RW / 2 + 0.05, 1.42, rz + 0.05, C.woodD);
      v.boxMin(rx + a * RW / 2 - 0.08, 0, rz - 0.1, rx + a * RW / 2 + 0.08, 0.05, rz + 0.1, C.woodK); // feet
    }
    v.boxMin(rx - RW / 2 - 0.05, 0.5, rz - 0.03, rx + RW / 2 + 0.05, 1.08, rz + 0.03, C.woodM); // cleat board
    v.boxMin(rx - RW / 2 - 0.05, 1.08, rz - 0.04, rx + RW / 2 + 0.05, 1.12, rz + 0.045, tone(C.woodM, 1.2));
    v.boxMin(rx - RW / 2 - 0.08, 1.38, rz - 0.06, rx + RW / 2 + 0.08, 1.46, rz + 0.06, C.woodD); // top rail
    v.boxMin(rx - RW / 2 - 0.08, 1.455, rz - 0.065, rx + RW / 2 + 0.08, 1.47, rz + 0.065, P.goldDeep);
    for (let i = 0; i < 16; i++) {
      const col = i % 8;
      const row = Math.floor(i / 8);
      const cx = rx - RW / 2 + 0.1 + col * ((RW - 0.2) / 7);
      const cy = 0.95 - row * 0.3;
      v.boxMin(cx - 0.04, cy - 0.014, rz + 0.03, cx + 0.04, cy + 0.014, rz + 0.07, '#B8913F'); // cleat
      v.boxMin(cx - 0.012, cy - 0.03, rz + 0.03, cx + 0.012, cy + 0.03, rz + 0.05, '#8C6A28');
      const cord = i === 13 ? '#B5463C' : '#D9C7A3';
      v.boxMin(cx - 0.005, cy, rz + 0.06, cx + 0.005, 1.38, rz + 0.07, cord); // up to the top rail
      v.boxMin(cx - 0.006, cy - 0.12, rz + 0.06, cx + 0.006, cy - 0.014, rz + 0.07, cord); // the tail hanging off the cleat
      if (i === 13) v.boxMin(cx - 0.035, cy - 0.2, rz + 0.06, cx + 0.035, cy - 0.12, rz + 0.085, '#B5463C'); // red tag on ၁၄
    }
    // gathered rope: along the top rail to its right end, then up and back to the pulley
    v.boxMin(rx - RW / 2 + 0.08, 1.47, rz - 0.015, rx + RW / 2 + 0.04, 1.5, rz + 0.015, C.rope);
    const ax = rx + RW / 2;
    const ay = 1.5;
    const by = 2.62;
    const bz = -hd + 0.15;
    const len = Math.hypot(by - ay, bz - rz);
    for (let i = 0; i < 2; i++) rbox(v, ax + (i - 0.5) * 0.025, (ay + by) / 2, (rz + bz) / 2, 0.016, 0.016, len, i ? '#B5463C' : C.rope, -Math.atan2(by - ay, rz - bz), 0, 0);
    v.boxMin(ax - 0.1, by - 0.1, -hd, ax + 0.1, by + 0.12, -hd + 0.14, C.woodD); // pulley block
    v.add(prismGeo(0.075, 0.075, 0.04, 10), '#B8913F', mat(ax, by, -hd + 0.16, HP));
    v.add(prismGeo(0.025, 0.025, 0.05, 8), C.iron, mat(ax, by, -hd + 0.17, HP));
    v.boxMin(ax - 0.05, by + 0.12, -hd, ax + 0.1, by + 0.18, -hd + 0.03, '#2E211A'); // the hole through the wall
    x.solid(rx, rz, RW + 0.16, 0.2);
  }

  // hours board, back wall right (2.8, y 1.8)
  v.boxMin(2.75 - 0.6, 1.75 - 0.45, -hd, 2.75 + 0.6, 1.75 + 0.45, -hd + 0.03, C.woodD);
  x.sign('back', 2.75, 1.75, 1.1, 0.8, (g, w, h) => {
    paperBg(g, w, h, '#F6EEDA', 4);
    g.strokeStyle = '#6E1F2A';
    g.lineWidth = 7;
    g.strokeRect(10, 10, w - 20, h - 20);
    txt(g, 'ဖွင့်ချိန်', w / 2, h * 0.24, h * 0.17, '#6E1F2A', { max: w * 0.88 });
    txt(g, '၇ – ၆', w / 2, h * 0.53, h * 0.24, '#2A2118', { max: w * 0.88 });
    txt(g, 'Open 7 – 6', w / 2, h * 0.82, h * 0.12, '#8C6A28', { font: FONT_SERIF, weight: 700 });
  }, { off: 0.035 });
  wallClock(x, 'back', 3.15, 2.5, 0.13, 11.6);

  // left wall: a stamp poster; the waiting bench (−3.15, 0.6) facing +x, two palm-leaf fans on it
  {
    const m = x.wallMat('left', -2.5, 1.9);
    vsink(v, m).boxMin(-0.42, -0.34, 0, 0.42, 0.34, 0.025, P.goldDeep);
    x.signAt(new THREE.Matrix4().multiplyMatrices(m, mat(0, 0, 0.028)), 0.78, 0.62, (g, w, h) => {
      g.fillStyle = '#FBF6EA';
      g.fillRect(0, 0, w, h);
      const sw = w * 0.36;
      const sh = h * 0.56;
      const draw = (sx, sy, c, rot) => {
        g.save();
        g.translate(sx, sy);
        g.rotate(rot);
        g.fillStyle = '#FFFFFF';
        g.fillRect(-sw / 2, -sh / 2, sw, sh);
        for (let i = 0; i < 9; i++) { disc(g, -sw / 2 + (i * sw) / 8, -sh / 2, 4, '#FBF6EA'); disc(g, -sw / 2 + (i * sw) / 8, sh / 2, 4, '#FBF6EA'); }
        g.fillStyle = c;
        g.fillRect(-sw / 2 + 8, -sh / 2 + 8, sw - 16, sh - 30);
        g.fillStyle = '#FFF8EE';
        g.beginPath();
        g.moveTo(-sw * 0.25, sh * 0.05);
        g.lineTo(sw * 0.3, -sh * 0.12);
        g.lineTo(-sw * 0.05, sh * 0.12);
        g.fill();
        g.restore();
      };
      draw(w * 0.3, h * 0.38, '#6E9CC2', -0.12);
      draw(w * 0.68, h * 0.42, '#C2574C', 0.1);
      txt(g, 'တံဆိပ်ခေါင်း ရပါပြီ', w / 2, h * 0.83, h * 0.1, '#6E1F2A');
      txt(g, 'Stamps sold here', w / 2, h * 0.94, h * 0.05, '#8C6A28', { font: FONT_SERIF, weight: 600 });
    }, 300);
    const s = x.at(-3.15, 0.6, HP);
    bench(s, 0, 0, { L: 2.0, d: 0.38, back: true, c: '#8A5A3A' });
    x.solid(-3.15, 0.6, 2.0, 0.42, HP);
    rbox(v, -3.2, 0.44, 1.0, 0.24, 0.012, 0.3, '#D9C08A', 0, 0.4);
    rbox(v, -3.2, 0.425, 0.84, 0.03, 0.012, 0.22, C.woodD, 0, 0.4);
    rbox(v, -3.22, 0.44, -0.3, 0.22, 0.012, 0.28, '#CDB27A', 0, -0.3);
  }
  // right wall: a parcel shelf, the postage board, a red letter box; plant at the front
  {
    const s = x.onWall('right', -3.0, 1.25);
    for (const yy of [0, 0.5]) {
      s.boxMin(-0.6, yy - 0.035, 0, 0.6, yy, 0.38, C.woodM);
      for (const sx of [-0.48, 0.48]) s.boxMin(sx - 0.02, yy - 0.2, 0, sx + 0.02, yy - 0.035, 0.26, C.woodD);
    }
    const pc = ['#C9A26A', '#B98F5B', '#D8C7A0', '#A97E57'];
    let k = 0;
    for (const yy of [0, 0.5]) {
      let px = -0.5;
      while (px < 0.45) {
        const w = 0.18 + rnd(k * 3) * 0.16;
        const h = 0.12 + rnd(k * 5) * 0.16;
        s.boxMin(px, yy, 0.06, px + w, yy + h, 0.33, pc[k % 4]);
        s.boxMin(px + w / 2 - 0.008, yy, 0.33, px + w / 2 + 0.008, yy + h + 0.004, 0.335, '#F2E8D2');
        s.boxMin(px, yy + h / 2 - 0.008, 0.33, px + w, yy + h / 2 + 0.008, 0.335, '#F2E8D2');
        if (rnd(k * 9) > 0.5) s.boxMin(px + 0.03, yy + h - 0.07, 0.335, px + 0.1, yy + h - 0.03, 0.34, '#FBF6EA');
        px += w + 0.03;
        k++;
      }
    }
    x.sign('right', -1.6, 1.8, 0.62, 0.7, (g, w, h) => {
      paperBg(g, w, h, '#FBF6EA', 6);
      rrect(g, 0, 0, w, h * 0.2, 0, '#2F5DB3');
      txt(g, 'စာပို့ခ', w / 2, h * 0.1, h * 0.1, '#FBF6EA');
      const rows = [['စာ', '၅၀'], ['ကတ်', '၃၀'], ['ပါဆယ်', '၂၀၀'], ['မြန်', '၁၀၀']];
      rows.forEach(([a, b], i) => {
        txt(g, a, w * 0.28, h * (0.33 + i * 0.15), h * 0.075, '#2A2118');
        txt(g, b, w * 0.75, h * (0.33 + i * 0.15), h * 0.075, '#6E1F2A');
        g.fillStyle = 'rgba(42,33,24,0.25)';
        g.fillRect(w * 0.1, h * (0.4 + i * 0.15), w * 0.8, 2);
      });
      txt(g, 'Postage', w / 2, h * 0.93, h * 0.055, '#8C6A28', { font: FONT_SERIF, weight: 600 });
    });
    const b = x.onWall('right', 1.7, 0.55);
    b.boxMin(-0.2, -0.28, 0, 0.2, 0.28, 0.22, '#B5463C');
    b.boxMin(-0.22, 0.26, 0, 0.22, 0.32, 0.25, '#8E3028');
    b.boxMin(-0.12, 0.08, 0.22, 0.12, 0.11, 0.23, '#2A2118');
    b.boxMin(-0.1, -0.12, 0.22, 0.1, 0.0, 0.225, '#F3D27A');
    b.boxMin(-0.02, -0.2, 0.22, 0.02, -0.16, 0.235, '#C9A24A');
  }
  {
    const s = x.at(3.0, 3.1);
    prism(s, 0, 0.17, 0, 0.17, 0.13, 0.34, C.clay);
    prism(s, 0, 0.35, 0, 0.19, 0.19, 0.04, C.clayL);
    for (let i = 0; i < 7; i++) rbox(s, Math.cos(i) * 0.08, 0.5 + rnd(i) * 0.35, Math.sin(i * 2) * 0.08, 0.06, 0.4, 0.14, i % 2 ? P.leaf : P.leafDark, 0.25 * Math.sin(i * 3), i, 0.3 * Math.cos(i * 2));
    x.solid(3.0, 3.1, 0.4, 0.4);
  }

  // public writing table, high (2.4, 0.8): ink pot on a chain, pen pot, forms, blotter
  {
    const tx = 2.4;
    const tz = 0.8;
    v.boxMin(tx - 0.7, 0.94, tz - 0.3, tx + 0.7, 1.0, tz + 0.3, C.woodM);
    v.boxMin(tx - 0.7, 0.99, tz + 0.28, tx + 0.7, 1.002, tz + 0.3, tone(C.woodM, 1.25));
    for (const a of [-1, 1]) for (const b2 of [-1, 1]) v.box(tx + a * 0.62, 0.47, tz + b2 * 0.22, 0.06, 0.94, 0.06, C.woodD);
    v.boxMin(tx - 0.6, 0.2, tz - 0.2, tx + 0.6, 0.24, tz + 0.2, C.woodD);
    v.boxMin(tx - 0.62, 0.24, tz - 0.22, tx + 0.62, 0.26, tz + 0.22, C.woodM); // foot shelf
    letterPile(v, tx - 0.48, 0.26, tz, 6, 21);
    v.boxMin(tx - 0.45, 1.0, tz - 0.18, tx + 0.05, 1.008, tz + 0.18, '#3F6E5A'); // blotter
    for (let i = 0; i < 4; i++) rbox(v, tx - 0.25 + rnd(i) * 0.06, 1.012 + i * 0.004, tz + (rnd(i * 3) - 0.5) * 0.05, 0.2, 0.004, 0.27, '#FBF6EA', 0, (rnd(i * 5) - 0.5) * 0.3);
    inkPot(v, tx + 0.25, 1.0, tz - 0.1);
    v.boxMin(tx + 0.25, 1.0, tz - 0.1, tx + 0.45, 1.006, tz - 0.094, '#8C877E'); // the chain
    rbox(v, tx + 0.47, 1.012, tz - 0.08, 0.16, 0.012, 0.012, '#2A2118', 0, 0.5);
    prism(v, tx + 0.5, 1.07, tz + 0.12, 0.05, 0.05, 0.14, C.tinD);
    for (let i = 0; i < 3; i++) rbox(v, tx + 0.5 + (i - 1) * 0.02, 1.17, tz + 0.12, 0.012, 0.14, 0.012, ['#2A2118', '#6E1F2A', '#2F5DB3'][i], 0, 0, (i - 1) * 0.2);
    x.solid(tx, tz, 1.4, 0.6);
  }

  // U Lu Aye's book crate (2.2, −1.6) until it is carried out to the car (flag `crate`)
  const crate = dyn.part();
  {
    const s = dyn.sink(crate);
    const cx = 2.2;
    const cz = -1.6;
    s.boxMin(cx - 0.32, 0, cz - 0.22, cx + 0.32, 0.04, cz + 0.22, C.woodD);
    for (let i = 0; i < 3; i++) {
      s.boxMin(cx - 0.32, 0.04 + i * 0.12, cz + 0.2, cx + 0.32, 0.13 + i * 0.12, cz + 0.23, tone(C.woodL, 0.95 + i * 0.04));
      s.boxMin(cx - 0.32, 0.04 + i * 0.12, cz - 0.23, cx + 0.32, 0.13 + i * 0.12, cz - 0.2, C.woodL);
    }
    for (const a of [-1, 1]) s.boxMin(cx + a * 0.32 - 0.02, 0.04, cz - 0.22, cx + a * 0.32 + 0.02, 0.38, cz + 0.22, C.woodM);
    const spines = ['#6E1F2A', '#2F5DB3', '#A47A2C', '#3E6B4F', '#EDE6D3', '#8E5A3C'];
    for (let i = 0; i < 9; i++) s.boxMin(cx - 0.28 + i * 0.062, 0.04, cz - 0.17, cx - 0.23 + i * 0.062, 0.36 + rnd(i) * 0.06, cz + 0.17, spines[i % 6]);
    s.boxMin(cx - 0.36, 0.3, cz + 0.23, cx + 0.36, 0.33, cz + 0.24, C.rope);
  }
  x.flag('crate', true, (on) => dyn.show(crate, on));
  x.solidIf('crate', (on) => !!on, 2.2, -1.6, 0.64, 0.44);

  // a wall fan on a bracket (right wall), sweeping slowly side to side: it is hot in here
  {
    const m = x.wallMat('right', -0.75, 2.2, 0);
    const s = vsink(v, m);
    s.boxMin(-0.08, -0.1, 0, 0.08, 0.1, 0.04, '#6E7F86');
    s.boxMin(-0.025, -0.03, 0.04, 0.025, 0.03, 0.2, '#5B6A6E');
    const head = dyn.part();
    const hs = dyn.sink(head);
    hs.box(0, 0, -0.06, 0.14, 0.14, 0.14, '#7E8E92');
    hs.box(0, 0, 0.04, 0.07, 0.07, 0.06, '#5B6A6E');
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      hs.box(Math.cos(a) * 0.21, Math.sin(a) * 0.21, 0.08, 0.03, 0.03, 0.012, '#C9CCCC');
    }
    rbox(hs, 0, 0, 0.13, 0.42, 0.012, 0.012, '#B8BCBC');
    rbox(hs, 0, 0, 0.13, 0.012, 0.42, 0.012, '#B8BCBC');
    const blades = dyn.part();
    const bs = dyn.sink(blades);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      rbox(bs, Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0, 0.17, 0.07, 0.012, '#9AB4BC', 0, 0, a);
    }
    const pivot = new THREE.Vector3(0, 0, 0.26).applyMatrix4(m);
    const base = -HP;
    const hm = new THREE.Matrix4();
    const bm = new THREE.Matrix4();
    x.every((dt, t) => {
      const yaw = base + Math.sin(t * 0.5) * 0.6;
      dyn.set(head, pivot.x, pivot.y, pivot.z, 0, yaw, 0, 1);
      hm.makeRotationY(yaw).setPosition(pivot.x, pivot.y, pivot.z);
      bm.makeTranslation(0, 0, 0.08);
      hm.multiply(bm);
      bm.makeRotationZ(t * 9);
      hm.multiply(bm);
      dyn.setMatrix(blades, hm);
    });
  }
  wallLamp(x, 'left', -1.6, 2.1);
  wallLamp(x, 'back', 2.05, 2.5);
  broom(v, -3.3, 2.6, { lean: -0.2 });
  // a dropped envelope, a stamp, scuffs by the counter
  rbox(v, -0.6, 0.009, -0.9, 0.16, 0.004, 0.1, '#F4ECD8', 0, 0.6);
  rbox(v, 1.6, 0.009, 0.4, 0.05, 0.004, 0.06, '#B5463C', 0, 0.2);

  // ---- people (Day 4 marketpost table)
  x.spot('luaye', 0.6, -3.0, 0, { seat: 0.74 }); // U Lu Aye on his high stool
  x.spot('thiri', -3.1, -0.1, HP, { seat: 0.42, look: { x: PX - PW / 2 + 1.5 * cw, y: PY0 + 0.5 * ch, z: -hd } }); // head turned to hole ၁၄
  x.spot('mayaBench', -3.1, 0.6, HP, { seat: 0.42 });
  x.spot('pwapwa', -3.1, 1.4, HP, { seat: 0.42 });
  x.spot('writeTable', 2.4, 0.25, 0); // Thiri writes the four wishes, facing the room
  x.spot('queue1', 0.6, -1.4, PI);
  x.spot('queue2', 0.8, -0.6, PI);
  x.spot('queue3', 1.0, 0.2, PI);
  x.spot('bowls', -0.2, -0.8, 0); // where Maya sets the bowls down (forkBowls)
  x.spot('flagCleat', -2.6, -1.55, PI); // Maya's spot for the `flag` look, facing the cleat board
  x.spot('crate', 2.2, -1.6, 0);
  x.spot('maya', 0, 2.8, PI);

  x.tap('flag', -2.6, -1.55, { x: -2.6, z: -2.3 });
  x.tap('pigeonholes', 0.6, -1.55, { x: PX, z: -hd });
  x.tap('hours', 3.0, -1.55, { x: 2.75, z: -hd }, { line: { my: 'ကောင်တာ ဖွင့်ချိန် · မနက် ၇ နာရီ – ညနေ ၆ နာရီ', en: 'Counter hours · 7 a.m. – 6 p.m.' } });
  x.tap('writingTable', 2.4, 1.5, { x: 2.4, z: 0.8 });
  x.tap('crate', 1.4, -1.35, { x: 2.2, z: -1.6 });
  x.tap('plane', -1.2, -1.55, { x: -1.2, z: -hd });

  return finishRoom(x, { my: 'ဈေးစာတိုက်', en: 'Market post office' });
}

// =============================================================================================
// postroom · the same post office's back room (Day 5: the contest result, Khwar Nyo's table)
// =============================================================================================
function buildPostroom() {
  const x = makeCtx('postroom', {
    width: 7, depth: 6, wall: '#F4ECD8', wainscot: '#5E7F94', trim: P.goldDeep, floor: 'tiles', floorColor: '#EFE5CE', floorColor2: C.envBlue,
  });
  const { v, hd, dyn } = x;
  tileFloor(x, '#F1E8D3', '#C6D6E2', { size: 0.5, seed: 9 });
  wallDressing(x, { seam: '#4A6578', wash: null, seed: 8 });
  airmailBand(x, 2.72);

  // back window (0.6, y 1.9): the carvers' row, three striped awnings; the third chimney smokes after the carve
  const WX = 0.6;
  const WY = 1.9;
  const WW = 1.2;
  const WH = 0.8;
  backWindow(x, WX, WY, WW, WH, (g, w, h) => {
    paintSky(g, w, h, '#9CC6E4', '#F6E3C2');
    const sw = w / 3.2;
    for (let i = 0; i < 3; i++) {
      const x0 = w * 0.05 + i * sw * 1.02;
      g.fillStyle = ['#E5D3B3', '#D8C2A0', '#E9DCC0'][i];
      g.fillRect(x0, h * 0.38, sw, h * 0.62);
      g.fillStyle = '#8E5A3C';
      g.beginPath();
      g.moveTo(x0 - 4, h * 0.4);
      g.lineTo(x0 + sw / 2, h * 0.26);
      g.lineTo(x0 + sw + 4, h * 0.4);
      g.fill();
      for (let k = 0; k < 6; k++) {
        g.fillStyle = k % 2 ? '#FBF6EA' : '#B5463C';
        g.beginPath();
        g.moveTo(x0 + (k * sw) / 6, h * 0.55);
        g.lineTo(x0 + ((k + 1) * sw) / 6, h * 0.55);
        g.lineTo(x0 + ((k + 1) * sw) / 6 + 3, h * 0.68);
        g.lineTo(x0 + (k * sw) / 6 + 3, h * 0.68);
        g.fill();
      }
      g.fillStyle = '#4A3020';
      g.fillRect(x0 + sw * 0.3, h * 0.72, sw * 0.4, h * 0.28);
    }
    g.fillStyle = '#6F6A62';
    g.fillRect(w * 0.05 + 2 * sw * 1.02 + sw * 0.7, h * 0.12, w * 0.03, h * 0.18);
  }, { bars: 0, frame: C.woodM, curtain: '#5E7F94' });
  // smoke from the third chimney (painted at ~0.86 of the view): only after d5.carved
  const smokeOn = steam(x, WX - WW / 2 + WW * 0.885, WY + WH / 2 - WH * 0.13, -hd + 0.035, { n: 4, rise: 0.16, size: 0.045, color: '#DAD5CB', speed: 0.22, drift: 0.04, on: () => x.flags.carved });
  void smokeOn;
  x.flag('carved', false, () => {});

  // contest notice (−1.45, y 1.8), 1.0 × 0.7 board: the winning curl design large (clear of U Lu Aye's head)
  v.boxMin(-1.45 - 0.55, 1.8 - 0.4, -hd, -1.45 + 0.55, 1.8 + 0.4, -hd + 0.035, C.woodD);
  v.boxMin(-1.45 - 0.55, 1.8 + 0.36, -hd, -1.45 + 0.55, 1.8 + 0.4, -hd + 0.05, P.gold);
  x.sign('back', -1.45, 1.8, 1.0, 0.7, (g, w, h) => {
    paperBg(g, w, h, '#FBF4E2', 11);
    txt(g, 'ပြိုင်ပွဲရလဒ်', w / 2, h * 0.11, h * 0.1, '#6E1F2A');
    // the winning stamp: a curling border round a little book
    const cx = w / 2;
    const cy = h * 0.47;
    const R = h * 0.24;
    g.strokeStyle = '#B5463C';
    g.lineWidth = 6;
    g.strokeRect(cx - R * 1.25, cy - R, R * 2.5, R * 2);
    g.lineWidth = 4;
    for (let i = 0; i < 10; i++) {
      const t = i / 10;
      const px = cx - R * 1.25 + t * R * 2.5 + R * 0.12;
      g.beginPath();
      g.arc(px, cy - R + 12, 9, Math.PI, Math.PI * 2.6);
      g.stroke();
      g.beginPath();
      g.arc(px, cy + R - 12, 9, 0, Math.PI * 1.6);
      g.stroke();
    }
    g.fillStyle = '#B5463C';
    g.fillRect(cx - R * 0.45, cy - R * 0.45, R * 0.9, R * 0.9);
    g.fillStyle = '#FBF4E2';
    g.fillRect(cx - 3, cy - R * 0.4, 6, R * 0.8);
    txt(g, 'စာအုပ်မိတ်ဆက်ပွဲနေ့ တံဆိပ်', w / 2, h * 0.81, h * 0.072, '#2A2118', { max: w * 0.92 });
    txt(g, 'ခွာညို', w / 2, h * 0.91, h * 0.075, '#6E1F2A');
  }, { off: 0.04 });
  // the offer letter, pinned (2.3, y 1.6)
  x.sign('back', 2.3, 1.6, 0.3, 0.4, (g, w, h) => {
    paperBg(g, w, h, '#FFFDF6', 13);
    txt(g, 'ကမ်းလှမ်းစာ', w / 2, h * 0.12, h * 0.075, '#2F5DB3');
    scribble(g, w * 0.12, h * 0.26, w * 0.76, 7, h * 0.08, 'rgba(42,33,24,0.65)', 5, 1.6);
    disc(g, w * 0.75, h * 0.86, w * 0.09, '#B5463C');
  }, { off: 0.012, ppm: 420 });
  v.box(2.3, 1.79, -hd + 0.02, 0.025, 0.025, 0.03, P.gold);

  // Khwar Nyo's packing table (2.3, −2.2): open satchel, trial blocks spilling on their twine, cloth, ink pot
  {
    const tx = 2.3;
    const tz = -2.2;
    const th = 0.78;
    v.boxMin(tx - 0.7, th - 0.06, tz - 0.35, tx + 0.7, th, tz + 0.35, C.woodM);
    v.boxMin(tx - 0.7, th - 0.012, tz + 0.33, tx + 0.7, th + 0.002, tz + 0.35, tone(C.woodM, 1.25));
    for (const a of [-1, 1]) for (const b of [-1, 1]) v.box(tx + a * 0.62, (th - 0.06) / 2, tz + b * 0.27, 0.06, th - 0.06, 0.06, C.woodD);
    v.boxMin(tx - 0.6, 0.15, tz - 0.25, tx + 0.6, 0.18, tz + 0.25, C.woodD);
    // satchel (open, flap back)
    const sx = tx + 0.35;
    v.boxMin(sx - 0.17, th, tz - 0.12, sx + 0.17, th + 0.2, tz + 0.08, '#A9653C');
    v.boxMin(sx - 0.15, th + 0.2, tz - 0.11, sx + 0.15, th + 0.205, tz + 0.06, '#5A3B26');
    rbox(v, sx, th + 0.22, tz - 0.2, 0.34, 0.012, 0.18, '#B97546', -0.9);
    v.boxMin(sx - 0.17, th + 0.02, tz - 0.12, sx - 0.15, th + 0.4, tz - 0.1, '#7A4A2E');
    // forty trial blocks on twine: rough and pale at first, fine and dark at the end
    const pts = [[sx - 0.08, th + 0.18, tz - 0.02], [tx - 0.05, th + 0.03, tz], [tx - 0.4, th + 0.03, tz + 0.12], [tx - 0.58, th + 0.03, tz + 0.3], [tx - 0.62, th - 0.25, tz + 0.37]];
    for (let i = 0; i < 40; i++) {
      const u = (i / 39) * (pts.length - 1);
      const k = Math.min(pts.length - 2, Math.floor(u));
      const f = u - k;
      const p0 = pts[k];
      const p1 = pts[k + 1];
      const bx = p0[0] + (p1[0] - p0[0]) * f;
      const by = p0[1] + (p1[1] - p0[1]) * f;
      const bz = p0[2] + (p1[2] - p0[2]) * f;
      const fine = i / 39;
      rbox(v, bx, by + 0.02, bz, 0.045, 0.04, 0.045, tone(fine > 0.5 ? C.woodM : C.woodL, 1.05 - fine * 0.25), rnd(i) * 0.4, rnd(i * 3) * 1.5, rnd(i * 5) * 0.4);
      if (i % 2) rbox(v, bx, by + 0.042, bz, 0.03, 0.004, 0.03, '#3B2A1A', 0, rnd(i * 3) * 1.5);
    }
    for (let k = 0; k < pts.length - 1; k++) {
      const [ax, ay, az] = pts[k];
      const [bx, by, bz] = pts[k + 1];
      const len = Math.hypot(bx - ax, by - ay, bz - az);
      const yaw = Math.atan2(bx - ax, bz - az);
      const pitch = Math.asin((by - ay) / len);
      rbox(v, (ax + bx) / 2, (ay + by) / 2 + 0.02, (az + bz) / 2, 0.006, 0.006, len, C.twine, -pitch, yaw);
    }
    // folded cloth, one small ink pot
    v.boxMin(tx - 0.55, th, tz - 0.3, tx - 0.25, th + 0.035, tz - 0.08, '#E8D2A8');
    v.boxMin(tx - 0.53, th + 0.035, tz - 0.28, tx - 0.27, th + 0.06, tz - 0.1, '#D9C08A');
    inkPot(v, tx + 0.05, th, tz - 0.22);
    x.solid(tx, tz, 1.4, 0.7);
  }

  // sorting table (−0.2, −0.2): letter piles, a twine ball, two postmark stamps, an ink pad
  {
    const tx = -0.2;
    const tz = -0.2;
    const th = 0.78;
    v.boxMin(tx - 1.1, th - 0.06, tz - 0.5, tx + 1.1, th, tz + 0.5, '#9C6E45');
    v.boxMin(tx - 1.1, th - 0.012, tz + 0.48, tx + 1.1, th + 0.002, tz + 0.5, '#C2935F');
    for (const a of [-1, 1]) for (const b of [-1, 1]) v.box(tx + a * 1.0, (th - 0.06) / 2, tz + b * 0.42, 0.07, th - 0.06, 0.07, C.woodD);
    v.boxMin(tx - 1.0, 0.18, tz - 0.03, tx + 1.0, 0.22, tz + 0.03, C.woodD);
    letterPile(v, tx - 0.75, th, tz - 0.15, 9, 31);
    letterPile(v, tx - 0.45, th, tz + 0.18, 5, 32);
    letterPile(v, tx + 0.05, th, tz - 0.2, 12, 33);
    letterPile(v, tx + 0.7, th, tz + 0.12, 6, 34);
    for (let i = 0; i < 4; i++) envelope(v, tx + 0.35 + i * 0.04, th, tz - 0.32, { w: 0.2, h: 0.13, c: ENV[i], lean: -0.35, air: i % 2 === 0 });
    prism(v, tx + 0.95, th + 0.06, tz - 0.25, 0.07, 0.07, 0.12, C.twine);
    rbox(v, tx + 0.8, th + 0.004, tz - 0.12, 0.3, 0.005, 0.005, C.twine, 0, 0.6);
    postmarkStamp(v, tx + 0.35, th, tz + 0.2);
    postmarkStamp(v, tx + 0.5, th, tz + 0.28);
    inkPad(v, tx + 0.45, th, tz + 0.05);
    x.solid(tx, tz, 2.2, 1.0);
  }

  // U Lu Aye's high desk in the back-left corner (−2.3, −2.15), its front to the room: slanted top,
  // postmark ledger, tray of returned blocks. He sits BEHIND it on his high stool, facing the room,
  // so his head and shoulders read over the desk (Day 5's close needs both people readable).
  {
    const s = x.at(-2.3, -2.15, PI);
    s.boxMin(-0.65, 0, -0.3, 0.65, 0.06, 0.3, C.woodD);
    for (const a of [-1, 1]) for (const b of [-1, 1]) s.box(a * 0.58, 0.5, b * 0.24, 0.07, 0.98, 0.07, C.woodD);
    s.boxMin(-0.62, 0.3, -0.26, 0.62, 0.34, 0.26, C.woodM);
    s.add(UNIT, C.woodM, mat(0, 1.02, 0, 0.18, 0, 0, 1.36, 0.06, 0.66));
    s.add(UNIT, tone(C.woodM, 1.2), mat(0, 0.975, 0.33, 0.18, 0, 0, 1.36, 0.02, 0.03));
    s.add(UNIT, '#F4ECD8', mat(-0.15, 1.06, 0.02, 0.18, 0, 0, 0.6, 0.02, 0.42));
    s.add(UNIT, '#7A2533', mat(-0.15, 1.05, 0.02, 0.18, 0, 0, 0.64, 0.02, 0.46));
    s.add(UNIT, '#C9B79A', mat(-0.15, 1.072, 0.02, 0.18, 0, 0, 0.012, 0.004, 0.42));
    for (let r = 0; r < 5; r++) s.add(UNIT, '#8C877E', mat(-0.3, 1.074, -0.12 + r * 0.06, 0.18, 0, 0, 0.22, 0.003, 0.008));
    for (let r = 0; r < 5; r++) s.add(UNIT, '#8C877E', mat(0.0, 1.074, -0.12 + r * 0.06, 0.18, 0, 0, 0.22, 0.003, 0.008));
    s.boxMin(0.25, 1.13, -0.28, 0.6, 1.2, -0.02, C.woodD);
    for (let i = 0; i < 6; i++) s.box(0.3 + (i % 3) * 0.11, 1.22, -0.22 + Math.floor(i / 3) * 0.12, 0.08, 0.05, 0.08, i % 2 ? C.woodL : C.woodM);
    x.solid(-2.3, -2.15, 1.3, 0.6);
    x.solid(-2.3, -2.78, 0.4, 0.4, 0, 0.02);
    const st = x.at(-2.3, -2.78);
    st.boxMin(-0.19, 0.68, -0.19, 0.19, 0.74, 0.19, C.woodM);
    for (const a of [-1, 1]) for (const b of [-1, 1]) st.box(a * 0.15, 0.34, b * 0.15, 0.05, 0.68, 0.05, C.woodD);
    st.boxMin(-0.16, 0.25, -0.16, 0.16, 0.28, 0.16, C.woodD);
  }
  // left wall above the desk: a small sorting rack of nine slots
  {
    const s = x.onWall('left', -2.0, 1.75);
    s.boxMin(-0.5, -0.36, 0, 0.5, 0.36, 0.03, '#3E2A1C');
    for (let i = 0; i <= 3; i++) {
      s.boxMin(-0.5 + i * 0.333 - 0.02, -0.36, 0, -0.5 + i * 0.333 + 0.02, 0.36, 0.25, C.woodM);
      s.boxMin(-0.5, -0.36 + i * 0.24 - 0.015, 0, 0.5, -0.36 + i * 0.24 + 0.015, 0.25, C.woodM);
    }
    for (let i = 0; i < 9; i++) {
      if (i === 4) continue;
      const cx = -0.5 + ((i % 3) + 0.5) * 0.333;
      const cy = -0.36 + Math.floor(i / 3) * 0.24 + 0.015;
      envelope(s, cx, cy, 0.12, { w: 0.18, h: 0.12, c: ENV[i % ENV.length], lean: -0.2, air: i % 3 === 0 });
    }
  }
  // mail sacks heaped (−2.7, 1.6) and a platform scale
  {
    const sacks = [[-2.85, 1.35, 0.3, '#D3C7AE'], [-2.5, 1.75, -0.4, '#C9BC9F'], [-2.95, 1.95, 0.1, '#DCD1B9'], [-2.65, 1.55, 0.9, '#CFC3A8']];
    sacks.forEach(([sx, sz, ry, c], i) => {
      if (i === 3) {
        rbox(v, sx, 0.62, sz, 0.42, 0.26, 0.5, c, 0.2, ry, 0.1);
        rbox(v, sx, 0.62, sz + 0.2, 0.3, 0.03, 0.2, '#B5463C', 0.2, ry, 0.1);
      } else riceSack(v, sx, sz, { c, ry, h: 0.66, tag: '#FBF6EA' });
    });
    x.solid(-2.75, 1.65, 0.9, 1.0);
    v.boxMin(-1.8, 0, 2.15, -1.3, 0.08, 2.55, '#5B5650');
    v.boxMin(-1.78, 0.08, 2.17, -1.32, 0.1, 2.53, '#8C877E');
    v.boxMin(-1.58, 0.08, 2.15, -1.52, 0.8, 2.21, '#5B5650');
    v.boxMin(-1.66, 0.8, 2.12, -1.44, 0.95, 2.22, '#E9E4DA');
    x.solid(-1.55, 2.35, 0.5, 0.4);
  }
  // bench (2.6, 1.5) turned −π/2, with a parcel; calendar, twine pegs and a clock
  {
    const s = x.at(2.75, 1.5, -HP);
    bench(s, 0, 0, { L: 1.6, d: 0.38, c: C.woodM });
    x.solid(2.75, 1.5, 1.6, 0.4, -HP);
    v.boxMin(2.55, 0.42, 1.95, 2.9, 0.6, 2.2, '#C9A26A');
    v.boxMin(2.55, 0.6, 2.07, 2.9, 0.605, 2.09, '#F2E8D2');
  }
  wallCalendar(x, 'right', -2.2, 1.85, { title: 'တန်ဆောင်မုန်း', seed: 6, pic: 'flowers' });
  {
    const s = x.onWall('right', -1.0, 1.55);
    s.boxMin(-0.4, -0.04, 0, 0.4, 0.04, 0.04, C.woodD);
    for (let i = 0; i < 3; i++) {
      s.boxMin(-0.28 + i * 0.28 - 0.015, -0.015, 0.04, -0.28 + i * 0.28 + 0.015, 0.015, 0.16, C.woodM);
      prism(s, -0.28 + i * 0.28, -0.1, 0.12, 0.07, 0.07, 0.12, [C.twine, '#B5463C', '#D9C7A3'][i]);
    }
  }
  wallClock(x, 'back', -0.45, 2.45, 0.15, 3.5);
  wallLamp(x, 'back', -0.45, 2.05);
  wallLamp(x, 'right', -1.75, 2.1);
  broom(v, 3.3, -0.2, { lean: 0.2, ry: -HP });
  // two sorting baskets of letters by the table, a parcel trolley by the bench, a plant
  for (const [bx, bz, sd] of [[-1.35, 0.85, 51], [0.95, 0.75, 52]]) {
    v.boxMin(bx - 0.28, 0, bz - 0.2, bx + 0.28, 0.05, bz + 0.2, '#B98F5B');
    for (let i = 0; i < 3; i++) v.boxMin(bx - 0.28, 0.05 + i * 0.07, bz - 0.2, bx + 0.28, 0.1 + i * 0.07, bz + 0.2, i % 2 ? '#C9A26A' : '#B98F5B');
    for (let i = 0; i < 7; i++) envelope(v, bx - 0.22 + i * 0.07, 0.12, bz - 0.12 + (i % 3) * 0.08, { w: 0.18, h: 0.14, c: ENV[(i + sd) % ENV.length], lean: -0.3 + rnd(i + sd) * 0.2, air: (i + sd) % 3 === 0 });
    x.solid(bx, bz, 0.56, 0.4);
  }
  {
    const s = x.at(1.7, 2.35, 0.25);
    s.boxMin(-0.3, 0.12, -0.22, 0.3, 0.16, 0.22, C.woodD);
    s.boxMin(-0.3, 0.16, -0.24, -0.26, 1.0, -0.2, C.iron);
    s.boxMin(0.26, 0.16, -0.24, 0.3, 1.0, -0.2, C.iron);
    s.boxMin(-0.3, 0.96, -0.24, 0.3, 1.0, -0.2, C.iron);
    for (const a of [-1, 1]) s.add(prismGeo(0.12, 0.12, 0.05, 10), '#2A2118', mat(a * 0.33, 0.12, -0.12, 0, 0, HP));
    const pc = ['#C9A26A', '#B98F5B', '#D8C7A0'];
    let yy = 0.16;
    for (let i = 0; i < 3; i++) {
      const h = 0.14 + rnd(i * 7) * 0.08;
      s.boxMin(-0.24 + i * 0.02, yy, -0.18, 0.22 - i * 0.03, yy + h, 0.18 - i * 0.02, pc[i]);
      s.boxMin(-0.02, yy, 0.18 - i * 0.02, 0.0, yy + h + 0.003, 0.185 - i * 0.02, '#F2E8D2');
      yy += h;
    }
    x.solid(1.7, 2.35, 0.7, 0.55);
    const p = x.at(3.0, 2.65);
    prism(p, 0, 0.16, 0, 0.16, 0.12, 0.32, C.clay);
    prism(p, 0, 0.33, 0, 0.18, 0.18, 0.04, C.clayL);
    for (let i = 0; i < 6; i++) rbox(p, Math.cos(i * 1.7) * 0.07, 0.48 + rnd(i) * 0.3, Math.sin(i * 2.3) * 0.07, 0.05, 0.36, 0.13, i % 2 ? P.leaf : P.leafDark, 0.3 * Math.sin(i * 3), i, 0.3 * Math.cos(i * 2));
    x.solid(3.0, 2.65, 0.4, 0.4);
  }

  // ---- people (Day 5 postroom)
  x.spot('khwarnyo', 1.7, -1.7, 0); // by her table, facing the room
  x.spot('luaye', -2.3, -2.78, 0, { seat: 0.72 }); // on his high stool behind the desk, facing the room
  x.spot('mayaKn1', 1.2, -0.6, Math.atan2(0.5, -1.1)); // Maya's spot for kn1, turned to Khwar Nyo
  x.spot('bundle', 2.75, 1.5, 0, { y: 0.42 }); // the bundle can be set on the bench
  x.spot('maya', 0, 2.2, PI);

  x.tap('trials', 2.9, -1.35, { x: 2.3, z: -2.2 });
  x.tap('offer', 2.05, -1.35, { x: 2.3, z: -hd });
  x.tap('notice', -1.2, -1.5, { x: -1.45, z: -hd });
  x.tap('benchDrop', 2.05, 1.5, { x: 2.75, z: 1.5 });

  return finishRoom(x, { my: 'စာတိုက် နောက်ခန်း', en: 'The post room' });
}

// =============================================================================================
// riceshop · Daw Yi's free-food shop · စေတနာထမင်းဆိုင် (no cash box, no donor board, no name plate)
// =============================================================================================
function buildRiceshop() {
  const x = makeCtx('riceshop', {
    width: 7, depth: 7, wall: '#F7F3E9', wainscot: '#B58A5A', trim: '#8A6A4A', floor: 'planks', floorColor: '#C9A57A',
  });
  const { v, hw, hd, dyn } = x;
  boardFloor(x, '#C7A276', { seed: 12, boardW: 0.26 });
  wallDressing(x, { seam: '#8A6440', wash: null, seed: 13, seamStep: 0.35 });

  // back window (1.8): the padauk tree in bloom; a jam jar of flowers on the sill
  backWindow(x, 1.8, 1.75, 1.0, 0.85, (g, w, h) => {
    paintSky(g, w, h, '#A3CBE6', '#F7E6C4');
    g.fillStyle = '#6B4A30';
    g.fillRect(w * 0.42, h * 0.45, w * 0.1, h * 0.55);
    for (let i = 0; i < 40; i++) {
      const a = rnd(i * 1.7) * Math.PI * 2;
      const d = Math.sqrt(rnd(i * 2.9)) * w * 0.42;
      disc(g, w * 0.47 + Math.cos(a) * d, h * 0.32 + Math.sin(a) * d * 0.6, w * (0.04 + rnd(i) * 0.04), i % 3 ? '#E9B52F' : '#6F9E5B');
    }
  }, { bars: 0, frame: '#9C7A55', curtain: '#E8D2A8' });
  prism(v, 2.05, 1.32, -hd + 0.1, 0.05, 0.05, 0.12, C.glass);
  for (let i = 0; i < 3; i++) v.box(2.02 + i * 0.03, 1.43 + (i % 2) * 0.04, -hd + 0.1, 0.05, 0.05, 0.05, '#E9B52F');

  // sign «ထိုင်ပါ» (back wall centre, y 2.0) and nothing else
  x.sign('back', -0.2, 2.1, 1.1, 0.5, (g, w, h) => {
    rrect(g, 4, 4, w - 8, h - 8, 18, '#FBF6EA', '#8A6A4A', 7);
    txt(g, 'ထိုင်ပါ', w / 2, h * 0.43, h * 0.38, '#6E1F2A');
    txt(g, 'Please sit', w / 2, h * 0.8, h * 0.11, '#8A6A4A', { font: FONT_SERIF, weight: 600 });
  }, { off: 0.02 });

  // charcoal stove + big rice pot (−1.6, −2.9) on a brick stand; ladles hang behind; steam
  {
    const sx = -1.6;
    const sz = -2.9;
    v.boxMin(sx - 0.5, 0, sz - 0.42, sx + 0.5, 0.42, sz + 0.42, C.brickD);
    for (let r = 0; r < 3; r++) {
      const off = r % 2 ? 0.11 : 0;
      for (let bx = -0.5 - off; bx < 0.5; bx += 0.22) {
        const xa = Math.max(-0.49, bx + 0.01);
        const xb = Math.min(0.49, bx + 0.21);
        if (xb - xa > 0.04) v.boxMin(sx + xa, 0.02 + r * 0.135, sz + 0.42, sx + xb, 0.13 + r * 0.135, sz + 0.435, tone(C.brick, 0.9 + rnd(r * 7 + bx * 3) * 0.2));
      }
    }
    v.boxMin(sx - 0.53, 0.42, sz - 0.45, sx + 0.53, 0.47, sz + 0.45, '#9A8F80');
    brazier(x, v, sx, 0.47, sz, { s: 1.35 });
    const py = 0.47 + 0.36;
    prism(v, sx, py + 0.22, sz, 0.32, 0.27, 0.44, '#B9B6AE');
    prism(v, sx, py + 0.02, sz, 0.26, 0.24, 0.04, '#4A4540');
    prism(v, sx, py + 0.43, sz, 0.335, 0.335, 0.04, '#D2CFC6');
    rbox(v, sx + 0.04, py + 0.47, sz + 0.02, 0.6, 0.025, 0.6, '#C2BFB6', 0.0, 0, 0.12); // lid ajar
    prism(v, sx + 0.04, py + 0.51, sz + 0.02, 0.04, 0.05, 0.04, C.woodD);
    v.boxMin(sx - 0.25, py + 0.43, sz + 0.22, sx + 0.1, py + 0.46, sz + 0.3, '#F7F3E8'); // rice at the rim
    rbox(v, sx + 0.3, py + 0.55, sz - 0.05, 0.035, 0.6, 0.035, C.woodL, 0.1, 0, -0.5); // big wooden paddle
    rbox(v, sx + 0.17, py + 0.33, sz - 0.05, 0.1, 0.16, 0.03, C.woodL, 0.1, 0, -0.5);
    for (const a of [-1, 1]) rbox(v, sx + a * 0.34, py + 0.33, sz, 0.05, 0.05, 0.14, '#8C8981');
    x.solid(sx, sz, 1.06, 0.9);
    steam(x, sx - 0.1, py + 0.5, sz, { n: 6, rise: 0.95, size: 0.12, speed: 0.28, drift: 0.16 });
    // soot and ladles on the wall
    for (let i = 0; i < 5; i++) v.boxMin(sx - 0.4 + rnd(i) * 0.2, 1.4 + i * 0.25, -hd, sx + 0.4 - rnd(i * 3) * 0.2, 1.62 + i * 0.25, -hd + 0.003, tone('#F7F3E9', 0.86 - i * 0.012));
    const h = x.onWall('back', sx + 0.95, 1.75);
    h.boxMin(-0.42, -0.03, 0, 0.42, 0.03, 0.04, C.woodD);
    for (let i = 0; i < 4; i++) {
      const hx = -0.32 + i * 0.21;
      h.boxMin(hx - 0.01, -0.06, 0.04, hx + 0.01, 0.0, 0.07, C.iron);
      h.boxMin(hx - 0.012, -0.5, 0.06, hx + 0.012, -0.06, 0.075, i % 2 ? C.woodL : C.tinD);
      if (i === 1) prism(h, hx, -0.55, 0.08, 0.09, 0.06, 0.05, C.tin);
      else if (i === 3) h.boxMin(hx - 0.07, -0.68, 0.06, hx + 0.07, -0.5, 0.075, C.tinL);
      else h.boxMin(hx - 0.05, -0.58, 0.06, hx + 0.05, -0.5, 0.09, i ? C.woodM : C.tin);
    }
  }
  // sack corner (−3.0, −2.9): two sacks; the third is Daw Kyar's, set down from d4.give.rice (flag `sack3`)
  riceSack(v, -3.05, -3.05, { ry: 0.1 });
  riceSack(v, -2.6, -3.15, { ry: -0.15, c: '#CDBA92' });
  rbox(v, -2.85, 0.68, -3.1, 0.5, 0.24, 0.32, '#D2C198', 0.0, 0.3, 0.08); // a half sack lying on top
  const sack3 = dyn.part(false);
  riceSack(dyn.sink(sack3), -3.05, -2.55, { ry: 0.35, c: '#C9B48A', tag: '#B5463C' });
  x.flag('sack3', false, (on) => dyn.show(sack3, on));
  x.solid(-2.85, -3.0, 0.95, 0.7);
  x.solidIf('sack3', (on) => !!on, -3.05, -2.55, 0.5, 0.4);
  basket(v, -3.0, 0, -1.9, { r: 0.24, h: 0.2, fill: '#6F9E5B', seed: 21 });
  for (let i = 0; i < 3; i++) rbox(v, -2.95 + i * 0.07, 0.26, -1.85 + (i % 2) * 0.05, 0.06, 0.06, 0.2, '#6B3E64', 0.3, i, 0.2); // eggplants
  x.solid(-3.0, -1.9, 0.5, 0.5);

  // water jar with a cup (1.2, −3.1); low plate shelf (2.6, −3.0)
  waterJar(v, 1.2, -3.1);
  x.solid(1.2, -3.1, 0.55, 0.55);
  {
    const s = x.at(2.65, -3.05);
    s.boxMin(-0.55, 0, -0.22, 0.55, 0.06, 0.22, C.woodD);
    for (const a of [-1, 1]) s.boxMin(a * 0.55 - (a > 0 ? 0.04 : 0), 0, -0.22, a * 0.55 + (a < 0 ? 0.04 : 0), 0.8, 0.22, C.woodM);
    s.boxMin(-0.55, 0, -0.22, 0.55, 0.8, -0.19, tone(C.woodM, 0.8));
    for (const y of [0.3, 0.55, 0.8]) s.boxMin(-0.57, y - 0.03, -0.22, 0.57, y, 0.24, C.woodM);
    for (let i = 0; i < 4; i++) {
      for (let k = 0; k < 6; k++) prism(s, -0.38 + i * 0.25, 0.07 + k * 0.025, 0, 0.1, 0.09, 0.02, k === 5 ? '#FBF6EA' : '#F1ECE0');
      prism(s, -0.38 + i * 0.25, 0.07 + 6 * 0.025, 0, 0.1, 0.1, 0.006, '#5A7FA0');
    }
    for (let i = 0; i < 5; i++) prism(s, -0.42 + i * 0.2, 0.36, 0, 0.08, 0.06, 0.08, i % 2 ? '#F1ECE0' : '#E7E1D2');
    for (let i = 0; i < 6; i++) prism(s, -0.4 + i * 0.16, 0.86, 0.02, 0.05, 0.04, 0.09, C.steel);
    prism(s, 0.35, 0.62, 0.05, 0.05, 0.05, 0.14, C.tinD);
    for (let i = 0; i < 4; i++) rbox(s, 0.35 + (i - 1.5) * 0.015, 0.74, 0.05, 0.012, 0.1, 0.02, C.steel, 0, 0, (i - 1.5) * 0.1);
    x.solid(2.65, -3.05, 1.1, 0.45);
  }
  // left wall: a shelf of pickle jars; right wall: a bamboo tray; a clock
  {
    const s = x.onWall('left', -1.9, 1.55);
    s.boxMin(-0.5, -0.035, 0, 0.5, 0, 0.26, C.woodM);
    for (const a of [-0.38, 0.38]) s.boxMin(a - 0.02, -0.2, 0, a + 0.02, -0.035, 0.18, C.woodD);
    const fills = ['#B5463C', '#D9A93B', '#6B6A3A', '#8E4A2C', '#C27A5B'];
    for (let i = 0; i < 5; i++) {
      prism(s, -0.38 + i * 0.19, 0.1, 0.12, 0.07, 0.07, 0.2, C.glass);
      prism(s, -0.38 + i * 0.19, 0.07, 0.12, 0.06, 0.06, 0.13, fills[i]);
      prism(s, -0.38 + i * 0.19, 0.215, 0.12, 0.065, 0.065, 0.03, i % 2 ? '#FBF6EA' : '#B5463C');
    }
    const t = x.onWall('right', -2.3, 1.8);
    t.add(prismGeo(0.3, 0.3, 0.04, 12), '#C9A26A', mat(0, 0, 0.03, HP));
    t.add(prismGeo(0.24, 0.24, 0.045, 12), '#B38D58', mat(0, 0, 0.035, HP));
    wallClock(x, 'back', -1.6, 2.6, 0.14, 12.3);
  }

  // two long tables along z with a bench each side (x −1.2 and 1.4, z −1.0 … 2.0)
  const longTable = (tx, seed) => {
    const z0 = -1.0;
    const z1 = 2.0;
    const zc = (z0 + z1) / 2;
    const th = 0.72;
    for (let i = 0; i < 4; i++) v.boxMin(tx - 0.35 + i * 0.175 + 0.004, th - 0.05, z0, tx - 0.35 + (i + 1) * 0.175 - 0.004, th, z1, tone(C.woodM, 0.95 + rnd(seed + i) * 0.1));
    v.boxMin(tx - 0.35, th - 0.008, z1 - 0.02, tx + 0.35, th + 0.002, z1, tone(C.woodM, 1.22));
    for (const zz of [z0 + 0.12, zc, z1 - 0.12]) for (const a of [-1, 1]) v.box(tx + a * 0.27, (th - 0.05) / 2, zz, 0.06, th - 0.05, 0.06, C.woodD);
    v.boxMin(tx - 0.02, 0.14, z0 + 0.12, tx + 0.02, 0.18, z1 - 0.12, C.woodD);
    for (const a of [-1, 1]) bench(x.at(tx + a * 0.6, zc, HP), 0, 0, { L: 2.8, d: 0.3, h: 0.42, c: '#A9784C' });
    x.solid(tx, zc, 0.7, z1 - z0);
    for (const a of [-1, 1]) x.solid(tx + a * 0.6, zc, 2.8, 0.22, HP, 0.0);
    // places laid: plates of rice, curry bowls, steel cups; a water jug and a dish of chillies
    for (let k = 0; k < 4; k++) {
      const pz = z0 + 0.4 + k * 0.72;
      for (const a of [-1, 1]) {
        if (rnd(seed * 7 + k * 3 + a) < 0.3) continue;
        const px = tx + a * 0.18;
        prism(v, px, th + 0.012, pz, 0.12, 0.1, 0.022, '#F4EFE4');
        prism(v, px, th + 0.035, pz, 0.07, 0.09, 0.04, '#FBF8F0');
        prism(v, px - a * 0.0, th + 0.03, pz + 0.17, 0.05, 0.04, 0.04, '#E9E4DA');
        v.boxMin(px - 0.035, th + 0.04, pz + 0.135, px + 0.035, th + 0.05, pz + 0.205, k % 2 ? '#C9743A' : '#9C6A2E');
        prism(v, px - a * 0.12, th + 0.05, pz - 0.15, 0.04, 0.035, 0.09, C.steel);
        rbox(v, px + 0.08, th + 0.015, pz, 0.02, 0.008, 0.14, C.steel, 0, 0.3);
      }
    }
    prism(v, tx, th + 0.1, zc + 0.05, 0.07, 0.08, 0.2, C.steel);
    prism(v, tx, th + 0.02, zc - 0.4, 0.07, 0.06, 0.03, '#F4EFE4');
    for (let i = 0; i < 4; i++) rbox(v, tx + (i - 1.5) * 0.025, th + 0.04, zc - 0.4, 0.015, 0.012, 0.06, '#C8322C', 0, i);
  };
  longTable(-1.2, 41);
  longTable(1.4, 43);
  // a woven food cover over a dish at the far end of table 2
  prism(v, 1.4, 0.72 + 0.09, 1.75, 0.08, 0.2, 0.17, '#C9A26A');
  prism(v, 1.4, 0.72 + 0.2, 1.75, 0.03, 0.04, 0.05, C.woodD);
  wallLamp(x, 'left', -0.9, 2.1);
  wallLamp(x, 'right', -1.1, 2.1);
  broom(v, -3.0, 3.0, { lean: -0.15 });
  // a hand-washing stand by the door: basin, soap, a towel on the rail
  {
    const s = x.at(2.75, 2.55);
    for (const a of [-1, 1]) for (const b of [-1, 1]) s.box(a * 0.2, 0.36, b * 0.15, 0.05, 0.72, 0.05, C.woodD);
    s.boxMin(-0.25, 0.68, -0.2, 0.25, 0.72, 0.2, C.woodM);
    prism(s, 0, 0.77, 0, 0.19, 0.14, 0.1, '#7FA0B0');
    prism(s, 0, 0.815, 0, 0.16, 0.16, 0.01, C.water);
    s.boxMin(0.12, 0.72, 0.1, 0.2, 0.75, 0.16, '#E8A0A8');
    s.boxMin(-0.27, 0.45, 0.18, 0.27, 0.48, 0.21, C.woodD);
    s.boxMin(-0.18, 0.18, 0.2, 0.08, 0.48, 0.22, '#F4EFE4');
    s.boxMin(-0.18, 0.3, 0.22, 0.08, 0.33, 0.225, '#B5463C');
    prism(s, -0.12, 0.05, -0.05, 0.13, 0.11, 0.1, '#5A7FA0');
    x.solid(2.75, 2.55, 0.5, 0.45);
  }
  // a dog's water bowl just inside the door (Ma Yu Yu's bowls are out on the lane)
  prism(v, 2.9, 0.04, 2.9, 0.13, 0.11, 0.08, '#B5643C');
  v.boxMin(2.8, 0.075, 2.8, 3.0, 0.08, 3.0, C.water);

  // ---- people (Day 4 riceshop table)
  x.spot('dawyi', -0.8, -2.9, -0.9); // Daw Yi with her big paddle, by the pot
  x.spot('sackDrop', -2.5, -2.3, PI); // where Daw Kyar's sack is set down
  x.spot('schoolboy', -1.75, 0.2, HP, { seat: 0.42 });
  x.spot('trishaw', -0.65, 1.2, -HP, { seat: 0.42 });
  x.spot('porter', 0.85, -0.4, HP, { seat: 0.42 });
  x.spot('oldwoman', 1.95, 1.0, -HP, { seat: 0.42 });
  x.spot('seat1', -1.75, 1.45, HP, { seat: 0.42 });
  x.spot('seat2', 0.85, 1.25, HP, { seat: 0.42 });
  x.spot('seat3', 1.95, -0.45, -HP, { seat: 0.42 });
  x.spot('maya', 0.1, 2.6, PI);
  x.spot('washStand', 2.3, 2.55, HP);
  x.spot('mayaYi', -0.2, -1.9, Math.atan2(-0.6, -1.0));

  x.tap('ricePot', -0.6, -1.95, { x: -1.6, z: -2.9 });
  x.tap('sackCorner', -2.45, -2.0, { x: -3.0, z: -2.9 });
  x.tap('sign', -0.2, -2.2, { x: -0.2, z: -hd });

  void hw;
  return finishRoom(x, { my: 'စေတနာထမင်းဆိုင်', en: "Daw Yi's free-food shop" });
}

// =============================================================================================
// sundries · Ma Yu Yu's sundries shop · ကုန်စုံဆိုင် (small and crowded)
// =============================================================================================
/** Fill a shop shelf row with jars, soap, candles, matchboxes, tea packets, oil bottles and tins. */
function goodsRow(v, x0, x1, y, zb, zf, space, seed) {
  let xx = x0;
  const zc = (zb + zf) / 2;
  for (let k = 0; k < 40 && xx < x1 - 0.05; k++) {
    const kind = Math.floor(rnd(seed * 3.7 + k * 1.3) * 7);
    if (kind === 0) {
      const fill = ['#B5463C', '#D9A93B', '#6F9E5B', '#E8A0A8', '#8E5A3C'][k % 5];
      prism(v, xx + 0.06, y + 0.09, zc, 0.06, 0.06, 0.18, C.glass);
      prism(v, xx + 0.06, y + 0.06, zc, 0.052, 0.052, 0.11, fill);
      prism(v, xx + 0.06, y + 0.195, zc, 0.055, 0.055, 0.03, '#C9A24A');
      xx += 0.13;
    } else if (kind === 1) {
      for (let i = 0; i < 3; i++) v.boxMin(xx, y + i * 0.04, zc - 0.06, xx + 0.1, y + i * 0.04 + 0.038, zc + 0.06, ['#E8A0A8', '#A8D0A0', '#FBF6EA'][(k + i) % 3]);
      xx += 0.12;
    } else if (kind === 2) {
      for (let i = 0; i < 5; i++) prism(v, xx + 0.02 + i * 0.022, y + 0.1, zc, 0.01, 0.01, 0.2, '#FBF8EE', 6);
      v.boxMin(xx, y + 0.08, zc - 0.02, xx + 0.12, y + 0.1, zc + 0.02, '#B5463C');
      xx += 0.14;
    } else if (kind === 3) {
      for (let i = 0; i < 4; i++) v.boxMin(xx, y + i * 0.025, zc - 0.05, xx + 0.07, y + i * 0.025 + 0.022, zc + 0.05, i % 2 ? '#E2B33C' : '#C8322C');
      xx += 0.09;
    } else if (kind === 4) {
      const c = k % 2 ? '#3F6E5A' : '#B5463C';
      for (let i = 0; i < 2; i++) {
        v.boxMin(xx + i * 0.075, y, zc - 0.06, xx + i * 0.075 + 0.065, y + Math.min(space - 0.04, 0.2), zc + 0.06, c);
        v.boxMin(xx + i * 0.075 + 0.01, y + 0.08, zc + 0.06, xx + i * 0.075 + 0.055, y + 0.13, zc + 0.065, '#FBF6EA');
      }
      xx += 0.16;
    } else if (kind === 5) {
      prism(v, xx + 0.05, y + 0.1, zc, 0.04, 0.045, 0.2, '#D9A23C');
      prism(v, xx + 0.05, y + 0.22, zc, 0.015, 0.03, 0.05, '#D9A23C');
      prism(v, xx + 0.05, y + 0.255, zc, 0.018, 0.018, 0.02, '#B5463C');
      xx += 0.11;
    } else {
      prism(v, xx + 0.06, y + 0.07, zc, 0.055, 0.055, 0.14, k % 2 ? '#2F5DB3' : '#B5463C');
      prism(v, xx + 0.06, y + 0.07, zc, 0.057, 0.057, 0.06, '#FBF6EA');
      xx += 0.13;
    }
  }
}

function buildSundries() {
  const x = makeCtx('sundries', {
    width: 5, depth: 5, wall: '#F3EAD3', wainscot: '#9DBA94', trim: '#8C6A28', floor: 'planks', floorColor: '#A07A52', atlas: 512,
  });
  const { v, hd, dyn } = x;
  boardFloor(x, '#A27C54', { seed: 17 });
  wallDressing(x, { seam: '#6E8A66', wash: null, seed: 19 });

  // back doorway to her home, between the shelves, behind a bead curtain that sways
  v.boxMin(-0.45, 0, -hd, 0.45, 2.0, -hd + 0.012, '#2E211A');
  v.boxMin(-0.55, 0, -hd, -0.45, 2.1, -hd + 0.1, C.woodD);
  v.boxMin(0.45, 0, -hd, 0.55, 2.1, -hd + 0.1, C.woodD);
  v.boxMin(-0.6, 2.0, -hd, 0.6, 2.12, -hd + 0.12, C.woodM);
  const beads = [];
  const beadC = ['#B5463C', '#E2B33C', '#2F5DB3', '#FBF6EA', '#6F9E5B'];
  for (let i = 0; i < 9; i++) {
    const p = dyn.part();
    const s = dyn.sink(p);
    s.box(0, -0.9, 0, 0.008, 1.8, 0.008, '#3B2A1A');
    for (let k = 0; k < 14; k++) s.box(0, -0.08 - k * 0.12, 0, 0.035, 0.05, 0.035, beadC[(i + k) % beadC.length]);
    beads.push(p);
  }
  x.every((dt, t) => {
    for (let i = 0; i < beads.length; i++) dyn.set(beads[i], -0.4 + i * 0.1, 1.99, -hd + 0.14, Math.sin(t * 1.4 + i * 0.6) * 0.04, 0, Math.sin(t * 0.9 + i * 0.8) * 0.03, 1);
  });

  // two shelves of goods (−1.3, −2.3), (1.3, −2.3)
  for (const [sx, seed] of [[-1.35, 3], [1.35, 7]]) {
    const w = 1.1;
    const h = 2.2;
    const d = 0.36;
    const sz = -hd + d / 2 + 0.01;
    v.boxMin(sx - w / 2, 0, sz - d / 2, sx - w / 2 + 0.05, h, sz + d / 2, C.woodM);
    v.boxMin(sx + w / 2 - 0.05, 0, sz - d / 2, sx + w / 2, h, sz + d / 2, C.woodM);
    v.boxMin(sx - w / 2, 0, sz - d / 2, sx + w / 2, h, sz - d / 2 + 0.03, tone(C.woodM, 0.65));
    const rows = 5;
    const gap = (h - 0.1) / rows;
    for (let r = 0; r <= rows; r++) {
      const y = 0.08 + r * gap;
      v.boxMin(sx - w / 2, y - 0.03, sz - d / 2, sx + w / 2, y, sz + d / 2, C.woodM);
      v.boxMin(sx - w / 2, y - 0.008, sz + d / 2 - 0.015, sx + w / 2, y + 0.002, sz + d / 2 + 0.005, tone(C.woodM, 1.25));
      if (r < rows) goodsRow(v, sx - w / 2 + 0.07, sx + w / 2 - 0.06, y, sz - d / 2 + 0.04, sz + d / 2 - 0.03, gap - 0.03, seed * 11 + r);
    }
    x.solid(sx, sz, w, d);
  }
  // strips of sachets hanging on a rail in front of the shelves
  v.boxMin(-2.0, 2.42, -1.78, 2.0, 2.45, -1.75, C.iron);
  for (let i = 0; i < 7; i++) {
    const sx = -1.75 + i * 0.58;
    if (Math.abs(sx) < 0.4) continue;
    const c = ['#B5463C', '#2F5DB3', '#E2B33C', '#3F6E5A', '#8E5A3C'][i % 5];
    v.boxMin(sx - 0.005, 2.3, -1.78, sx + 0.005, 2.42, -1.76, C.iron);
    for (let k = 0; k < 6; k++) {
      v.boxMin(sx - 0.06, 2.3 - (k + 1) * 0.1, -1.775, sx + 0.06, 2.3 - k * 0.1 - 0.008, -1.765, k % 2 ? c : tone(c, 1.25));
      v.boxMin(sx - 0.03, 2.3 - k * 0.1 - 0.06, -1.765, sx + 0.03, 2.3 - k * 0.1 - 0.035, -1.762, '#FBF6EA');
    }
  }

  // shop counter (0, −0.9) w 3.0: open display shelves at the front, sweet jars, bowls, the credit book
  {
    const cw = 3.0;
    const cz = -0.9;
    const ch = 0.95;
    v.boxMin(-cw / 2, 0, cz - 0.3, cw / 2, 0.08, cz + 0.3, C.woodD);
    v.boxMin(-cw / 2, 0.08, cz - 0.3, cw / 2, ch - 0.05, cz - 0.24, C.woodM);
    for (const a of [-1, 0, 1]) v.boxMin(a * (cw / 2 - 0.03) - 0.03, 0.08, cz - 0.3, a * (cw / 2 - 0.03) + 0.03, ch - 0.05, cz + 0.3, C.woodM);
    for (const y of [0.08, 0.48]) {
      v.boxMin(-cw / 2, y, cz - 0.3, cw / 2, y + 0.03, cz + 0.3, C.woodM);
      goodsRow(v, -cw / 2 + 0.08, -0.06, y + 0.03, cz - 0.24, cz + 0.26, 0.36, 50 + y * 10);
      goodsRow(v, 0.06, cw / 2 - 0.08, y + 0.03, cz - 0.24, cz + 0.26, 0.36, 60 + y * 10);
    }
    v.boxMin(-cw / 2 - 0.04, ch - 0.05, cz - 0.33, cw / 2 + 0.04, ch, cz + 0.33, '#B8913F');
    v.boxMin(-cw / 2 - 0.04, ch - 0.01, cz + 0.31, cw / 2 + 0.04, ch + 0.002, cz + 0.33, '#D9B868');
    x.solid(0, cz, cw, 0.6);
    // three sweet jars, a small scale, the credit book, matchboxes, candles, a bell
    const jc = ['#E8A0A8', '#E2B33C', '#6F9E5B'];
    for (let i = 0; i < 3; i++) {
      prism(v, -1.25 + i * 0.22, ch + 0.13, cz - 0.08, 0.085, 0.085, 0.26, C.glass);
      for (let k = 0; k < 4; k++) v.box(-1.25 + i * 0.22 + (k % 2 ? 0.03 : -0.03), ch + 0.04 + k * 0.035, cz - 0.08 + (k % 3 - 1) * 0.02, 0.04, 0.03, 0.04, k % 2 ? jc[i] : tone(jc[i], 1.2));
      prism(v, -1.25 + i * 0.22, ch + 0.28, cz - 0.08, 0.07, 0.07, 0.04, '#C9A24A');
    }
    v.boxMin(-0.45, ch, cz - 0.1, -0.15, ch + 0.03, cz + 0.12, '#8C6A28');
    prism(v, -0.3, ch + 0.08, cz + 0.01, 0.1, 0.08, 0.04, '#C9A24A');
    v.boxMin(0.0, ch, cz + 0.02, 0.3, ch + 0.02, cz + 0.22, '#6E1F2A');
    v.boxMin(0.01, ch + 0.02, cz + 0.03, 0.29, ch + 0.023, cz + 0.21, '#FBF6EA');
    rbox(v, 0.2, ch + 0.03, cz + 0.12, 0.012, 0.012, 0.16, '#E2B33C', 0, 0.5);
    for (let i = 0; i < 3; i++) v.boxMin(0.42 + i * 0.07, ch, cz - 0.15, 0.48 + i * 0.07, ch + 0.06 + i * 0.012, cz - 0.05, i % 2 ? '#E2B33C' : '#C8322C');
    prism(v, 0.6, ch + 0.035, cz + 0.17, 0.04, 0.05, 0.07, '#C9A24A'); // bell
  }
  // three clay water bowls side by side on the counter's right end (0.86 / 1.1 / 1.34, −0.88): the gift.
  // One part, so flag `bowls` (true = still there) shows or hides all three together.
  const bowls = dyn.part();
  {
    const s = dyn.sink(bowls);
    const y = 0.95;
    [[0.86, C.clayL, 0.15], [1.1, C.clay, -0.1], [1.34, '#C27348', 0.3]].forEach(([bx, c, ry]) => {
      const bz = -0.88;
      // octagonal (two boxes 45° apart for the foot, belly, rim and water) so each reads as a round bowl
      for (const q of [0, PI / 4]) {
        const r2 = ry + q;
        s.box(bx, y + 0.015, bz, 0.12, 0.03, 0.12, tone(c, 0.78), r2); // foot
        s.box(bx, y + 0.06, bz, 0.19, 0.065, 0.19, c, r2); // belly
        for (const [dx, dz, w, d] of [[0, 0.098, 0.1, 0.028], [0, -0.098, 0.1, 0.028], [0.098, 0, 0.028, 0.1], [-0.098, 0, 0.028, 0.1]]) {
          const cs = Math.cos(r2);
          const sn = Math.sin(r2);
          s.box(bx + dx * cs + dz * sn, y + 0.1, bz - dx * sn + dz * cs, w, 0.03, d, tone(c, 1.12), r2); // rim
        }
        s.box(bx, y + 0.098, bz, 0.17, 0.006, 0.17, C.water, r2); // water, a little below the rim
      }
    });
  }
  x.flag('bowls', true, (on) => dyn.show(bowls, on));
  // a sack of broken rice for the dogs beside the counter's left end, a tin scoop in it
  riceSack(v, -1.78, -0.95, { c: '#D8C7A0', h: 0.5, ry: 0.2 });
  v.boxMin(-1.92, 0.42, -1.04, -1.66, 0.45, -0.86, '#F7F3E8');
  rbox(v, -1.8, 0.48, -0.95, 0.06, 0.05, 0.14, C.tinL, 0.3, 0.4);
  x.solid(-1.78, -0.95, 0.45, 0.38);
  // the corners: open bean sacks (left), brooms + a kerosene tin (right); buckets and an onion basket at the front
  for (const [sx, sz, c] of [[-2.1, -1.65, '#C9743A'], [-2.15, -1.2, '#6B6A3A']]) {
    prism(v, sx, 0.2, sz, 0.17, 0.19, 0.4, '#D8C7A0');
    prism(v, sx, 0.4, sz, 0.2, 0.17, 0.05, '#E2D5B8');
    prism(v, sx, 0.4, sz, 0.15, 0.15, 0.03, c);
    for (let i = 0; i < 6; i++) v.box(sx + (rnd(i + sx) - 0.5) * 0.18, 0.425, sz + (rnd(i * 3 + sz) - 0.5) * 0.18, 0.04, 0.02, 0.04, tone(c, 0.9 + rnd(i) * 0.2));
  }
  x.solid(-2.12, -1.42, 0.42, 0.85);
  for (let i = 0; i < 4; i++) {
    rbox(v, 2.15 + i * 0.06, 0.62, -1.5 - i * 0.05, 0.03, 1.2, 0.03, C.woodL, 0.12, 0, -0.1 + i * 0.05);
    rbox(v, 2.15 + i * 0.06, 0.13, -1.45 - i * 0.05, 0.16, 0.26, 0.06, ['#C8B074', '#D9A93B', '#B5463C', '#6F9E5B'][i], 0.06, 0, -0.1 + i * 0.05);
  }
  v.boxMin(1.9, 0, -1.25, 2.2, 0.38, -1.0, '#8C877E');
  v.boxMin(2.0, 0.38, -1.15, 2.08, 0.42, -1.08, '#5B5650');
  x.solid(2.1, -1.35, 0.5, 0.6);
  for (let i = 0; i < 4; i++) prism(v, 1.95, 0.12 + i * 0.07, 0.4, 0.2 + i * 0.002, 0.16, 0.24, i % 2 ? '#2F7C7A' : '#E0795A');
  x.solid(1.95, 0.4, 0.45, 0.45);
  basket(v, 1.95, 0, 1.3, { r: 0.2, h: 0.18, c: '#B98F5B', fill: '#B5643C', seed: 33 });
  x.solid(1.95, 1.3, 0.45, 0.45);
  // rubber slippers hanging on the right wall, a calendar on the left wall, an egg tray on a stool
  {
    const s = x.onWall('right', 0.2, 1.35);
    s.boxMin(-0.55, 0.0, 0, 0.55, 0.04, 0.04, C.woodD);
    const sc = ['#2F5DB3', '#C8322C', '#3F6E5A', '#E2B33C'];
    for (let i = 0; i < 4; i++) {
      for (const k of [0, 1]) s.boxMin(-0.45 + i * 0.27 + k * 0.1, -0.32, 0.04 + k * 0.01, -0.37 + i * 0.27 + k * 0.1, -0.02, 0.06 + k * 0.01, sc[i]);
      s.boxMin(-0.42 + i * 0.27, -0.06, 0.05, -0.3 + i * 0.27, -0.03, 0.08, '#FBF6EA');
    }
  }
  wallCalendar(x, 'left', -1.3, 1.75, { title: 'တန်ဆောင်မုန်း', seed: 4, w: 0.36, h: 0.52 });
  lowStool(v, -1.95, 0.6, { h: 0.4, c: C.woodM, s: 0.34 });
  v.boxMin(-2.1, 0.4, 0.45, -1.8, 0.43, 0.75, '#C9B79A');
  for (let i = 0; i < 9; i++) prism(v, -2.05 + (i % 3) * 0.1, 0.46, 0.5 + Math.floor(i / 3) * 0.1, 0.035, 0.035, 0.06, i % 4 ? '#F2E6CF' : '#E3C9A0');
  x.solid(-1.95, 0.6, 0.38, 0.38);
  wallLamp(x, 'left', -1.95, 2.0);
  wallLamp(x, 'right', -1.95, 2.0);

  // ---- people (Day 4 sundries table)
  x.spot('yuyu', 0, -1.6, 0); // Ma Yu Yu behind her counter
  x.spot('customer', -0.8, -0.2, PI); // buying matches
  x.spot('maya', 0.55, -0.15, PI); // at the counter, by the bowls
  x.spot('bowls', 1.1, -0.88, 0, { y: 0.95 }); // the middle of the three bowls (prop spot)
  x.spot('door', 0, 1.6, PI);

  x.tap('bowls', 1.1, -0.2, { x: 1.1, z: -0.9 });
  x.tap('dogRice', -1.4, -0.25, { x: -1.78, z: -0.95 });

  return finishRoom(x, { my: 'ကုန်စုံဆိုင်', en: "Ma Yu Yu's sundries shop" });
}

// =============================================================================================
// carvershop · Ko Lwin's carving shop (Day 5, ch 10: cold → lit after the carve)
// =============================================================================================
/** A stamp block: wood body, inked face of straight lines (or a curl), facing +Z. */
function stampBlock(v, x, y, z, { s = 0.12, d = 0.1, wood = C.woodL, ink = '#3B2A1A', lines = '#C9A26A', curl = false } = {}) {
  v.boxMin(x - s / 2, y - s / 2, z - d, x + s / 2, y + s / 2, z, wood);
  v.boxMin(x - s / 2 + 0.008, y - s / 2 + 0.008, z, x + s / 2 - 0.008, y + s / 2 - 0.008, z + 0.006, ink);
  if (curl) {
    v.boxMin(x - s / 3, y - 0.008, z + 0.006, x + s / 3, y + 0.008, z + 0.01, lines);
    v.boxMin(x - 0.008, y - s / 3, z + 0.006, x + 0.008, y + s / 3, z + 0.01, lines);
  } else {
    for (let i = 0; i < 3; i++) v.boxMin(x - s / 2 + 0.02, y - s / 4 + i * (s / 4) - 0.005, z + 0.006, x + s / 2 - 0.02, y - s / 4 + i * (s / 4) + 0.005, z + 0.01, lines);
    v.boxMin(x - s / 2 + 0.018, y - s / 2 + 0.018, z + 0.006, x - s / 2 + 0.028, y + s / 2 - 0.018, z + 0.01, lines);
    v.boxMin(x + s / 2 - 0.028, y - s / 2 + 0.018, z + 0.006, x + s / 2 - 0.018, y + s / 2 - 0.018, z + 0.01, lines);
  }
}

function buildCarvershop() {
  const x = makeCtx('carvershop', {
    width: 6, depth: 7, wall: '#F1E6CC', wainscot: '#4A3020', trim: P.goldDeep, floor: 'planks', floorColor: '#8A6544', emberOff: '#7E7A73',
  });
  const { v, hd, dyn } = x;
  // mid warm wood floor (reads apart from the dark wainscot and the brown furniture)
  boardFloor(x, '#94704B', { seed: 23 });
  wallDressing(x, { seam: '#4E3422', wash: null, seed: 24 });

  // high back window (0, y 2.15): sky and a branch
  backWindow(x, 0, 2.15, 1.0, 0.6, (g, w, h) => {
    paintSky(g, w, h, '#9CC6E4', '#F2E2C4');
    g.strokeStyle = '#5A4030';
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(w, h * 0.3);
    g.quadraticCurveTo(w * 0.6, h * 0.4, w * 0.3, h * 0.25);
    g.stroke();
    for (let i = 0; i < 12; i++) disc(g, w * (0.35 + rnd(i * 3) * 0.6), h * (0.15 + rnd(i * 5) * 0.35), w * 0.045, i % 3 ? '#6F9E5B' : '#4F7F43');
  }, { bars: 3, frame: C.woodD, shutters: false });

  // carving bench (0, −2.9), 1.4 × 0.7, top at 0.75
  const BX = 0;
  const BZ = -2.9;
  const BY = 0.75;
  {
    v.boxMin(BX - 0.7, BY - 0.09, BZ - 0.35, BX + 0.7, BY, BZ + 0.35, '#8A5E3C');
    v.boxMin(BX - 0.7, BY - 0.012, BZ + 0.33, BX + 0.7, BY + 0.002, BZ + 0.35, '#B07E54');
    for (let i = 0; i < 8; i++) v.boxMin(BX - 0.6 + rnd(i) * 1.1, BY, BZ - 0.2 + rnd(i * 3) * 0.4, BX - 0.55 + rnd(i) * 1.1, BY + 0.002, BZ - 0.17 + rnd(i * 3) * 0.4, '#6E4A30'); // knife scars
    for (const a of [-1, 1]) for (const b of [-1, 1]) v.box(BX + a * 0.6, (BY - 0.09) / 2, BZ + b * 0.27, 0.09, BY - 0.09, 0.09, C.woodK);
    v.boxMin(BX - 0.62, 0.16, BZ - 0.3, BX + 0.62, 0.2, BZ + 0.3, C.woodD);
    for (let i = 0; i < 5; i++) rbox(v, BX - 0.45 + i * 0.2, 0.23, BZ + (rnd(i) - 0.5) * 0.3, 0.16, 0.05, 0.08, tone(C.woodL, 0.9 + rnd(i) * 0.2), 0, rnd(i * 3) * 2); // offcuts on the low shelf
    x.solid(BX, BZ, 1.4, 0.7);
    // clay brazier on the left end; its tin pipe up the wall at x −0.6
    brazier(x, v, BX - 0.48, BY, BZ - 0.05, { s: 0.62 });
    v.boxMin(BX - 0.64, BY + 0.24, BZ - 0.3, BX - 0.32, BY + 0.27, BZ + 0.1, '#6F6A62');
    v.boxMin(BX - 0.52, BY + 0.27, -hd + 0.05, BX - 0.44, BY + 0.34, BZ - 0.1, '#6F6A62');
    prism(v, -0.6, (BY + 0.3 + 3.0) / 2, -hd + 0.09, 0.05, 0.05, 3.0 - BY - 0.3, '#7B766D');
    for (const yy of [1.5, 2.4]) v.boxMin(-0.66, yy, -hd, -0.54, yy + 0.03, -hd + 0.14, C.iron);
    // vice on the right end
    v.boxMin(BX + 0.42, BY, BZ + 0.15, BX + 0.62, BY + 0.14, BZ + 0.22, C.iron);
    v.boxMin(BX + 0.42, BY, BZ + 0.03, BX + 0.62, BY + 0.14, BZ + 0.08, C.ironL);
    v.boxMin(BX + 0.51, BY + 0.06, BZ + 0.2, BX + 0.53, BY + 0.08, BZ + 0.42, '#8C877E');
    v.boxMin(BX + 0.44, BY + 0.06, BZ + 0.4, BX + 0.6, BY + 0.08, BZ + 0.42, '#8C877E');
    // the cold tea glass, a sharpening stone in its tray, a mallet
    prism(v, BX - 0.22, BY + 0.05, BZ + 0.2, 0.035, 0.03, 0.1, C.glass);
    prism(v, BX - 0.22, BY + 0.04, BZ + 0.2, 0.03, 0.026, 0.07, '#A86A35');
    v.boxMin(BX + 0.08, BY, BZ - 0.28, BX + 0.38, BY + 0.03, BZ - 0.16, '#5B5650');
    v.boxMin(BX + 0.12, BY + 0.03, BZ - 0.25, BX + 0.34, BY + 0.06, BZ - 0.19, '#8E8A84');
    rbox(v, BX + 0.25, BY + 0.04, BZ + 0.05, 0.26, 0.035, 0.035, C.woodL, 0, 0.4);
    rbox(v, BX + 0.36, BY + 0.05, BZ + 0.0, 0.08, 0.08, 0.12, C.woodM, 0, 0.4);
    smallLamp(x, BX - 0.15, BY, BZ - 0.25);
  }
  // cold: the gouge roll tied tight · lit: unrolled, gouges fanned out
  const roll = dyn.part();
  {
    const s = dyn.sink(roll);
    s.box(BX + 0.05, BY + 0.045, BZ + 0.2, 0.36, 0.09, 0.09, '#B8A27A');
    s.box(BX - 0.05, BY + 0.045, BZ + 0.2, 0.03, 0.1, 0.1, '#6E4A30');
    s.box(BX + 0.15, BY + 0.045, BZ + 0.2, 0.03, 0.1, 0.1, '#6E4A30');
  }
  const gouges = dyn.part(false);
  {
    const s = dyn.sink(gouges);
    s.box(BX + 0.05, BY + 0.006, BZ + 0.2, 0.46, 0.012, 0.22, '#B8A27A');
    for (let i = 0; i < 6; i++) {
      rbox(s, BX - 0.13 + i * 0.07, BY + 0.025, BZ + 0.15, 0.025, 0.025, 0.12, C.woodM, 0, 0, 0);
      rbox(s, BX - 0.13 + i * 0.07, BY + 0.02, BZ + 0.26, 0.012, 0.012, 0.1, '#B8B2A6');
    }
  }
  // Khwar Nyo's block under a cloth with her slip (flag `block`: 'cloth' | 'bare' | 'none')
  const cloth = dyn.part();
  {
    const s = dyn.sink(cloth);
    s.box(BX - 0.05, BY + 0.05, BZ - 0.02, 0.24, 0.1, 0.22, '#E8D2A8');
    s.box(BX - 0.05, BY + 0.012, BZ - 0.02, 0.3, 0.024, 0.28, '#E8D2A8');
    rbox(s, BX + 0.16, BY + 0.004, BZ + 0.12, 0.12, 0.006, 0.08, '#FBF6EA', 0, 0.3);
  }
  const bare = dyn.part(false);
  stampBlock(dyn.sink(bare, mat(BX - 0.05, BY + 0.075, BZ - 0.02, -HP)), 0, 0, 0.0, { s: 0.16, d: 0.12, wood: '#F2DDB0', ink: '#6E1F2A', lines: '#E9C46A', curl: true });
  x.flag('block', 'cloth', (val) => { dyn.show(cloth, val === 'cloth'); dyn.show(bare, val === 'bare'); });
  // lit: a fresh block in the vice, pale shavings round the bench, warm smoke from the brazier
  const fresh = dyn.part(false);
  {
    const fs = dyn.sink(fresh);
    stampBlock(fs, BX + 0.52, BY + 0.21, BZ + 0.155, { s: 0.13, d: 0.09, wood: '#F6E2B4', ink: '#FBF0D2', lines: '#D9A93B', curl: true });
    fs.box(BX + 0.52, BY + 0.21 + 0.072, BZ + 0.11, 0.14, 0.012, 0.1, '#E9C46A'); // gold-lit top edge
  }
  const shavings = dyn.part(false);
  {
    const s = dyn.sink(shavings);
    for (let i = 0; i < 34; i++) {
      const a = rnd(i * 2.1) * Math.PI - 0.2;
      const d = 0.5 + rnd(i * 3.3) * 0.75;
      rbox(s, BX + Math.cos(a) * d * 1.2, 0.012, BZ + 0.3 + Math.sin(a) * d * 0.7, 0.07, 0.018, 0.035, i % 3 ? '#E9D2A6' : '#F3E2BE', 0.4, rnd(i) * 3, 0.3);
    }
    for (let i = 0; i < 8; i++) rbox(s, BX + 0.3 + rnd(i) * 0.25, BY + 0.01, BZ + 0.05 + rnd(i * 5) * 0.2, 0.05, 0.015, 0.03, '#F3E2BE', 0.4, rnd(i * 2) * 3);
  }
  steam(x, BX - 0.48, BY + 0.32, BZ - 0.05, { n: 3, rise: 0.5, size: 0.06, color: '#CFC9BE', speed: 0.2, drift: 0.06, on: () => x.flags.lit });
  // cold (by day: flat, dull, grey ash) → lit (the brazier's warm pool is the brightest thing in the
  // evening). Lighting only, never pulsing: these are not pointers.
  x.warm(BX - 0.4, BZ + 0.75, 1.5, (st) => (st.flags.lit ? 0.32 + 0.6 * st.eve : 0));
  x.warm(BX - 0.48, -hd + 0.01, 0.85, (st) => (st.flags.lit ? 0.18 + 0.4 * st.eve : 0), { wall: true, y: 1.35, color: '#FF8E45', sy: 0.9 });
  x.warm(BX - 0.48, BZ + 0.12, 0.42, (st) => (st.flags.lit ? 0.5 + 0.4 * st.eve : 0), { y: BY + 0.015, color: '#FF7A35' }); // on the bench top
  const LIT = { hemi: 1, sun: 1, sunColor: new THREE.Color('#FFE0B0') };
  const COLD = { hemi: 0.84, sun: 0.72, sunPatch: 0.55 };
  x.mood = (st) => (st.flags.lit ? LIT : COLD);
  x.flag('lit', false, (on) => {
    x.ember.set(on ? 1 : 0);
    dyn.show(fresh, !!on);
    dyn.show(shavings, !!on);
    dyn.show(gouges, !!on);
    dyn.show(roll, !on);
  });

  // block rack on the back wall (x −1.9, y 1.7): a dozen of his old blocks, all straight lines
  {
    const s = x.onWall('back', -1.9, 1.7);
    s.boxMin(-0.5, -0.45, 0, 0.5, 0.45, 0.03, C.woodD);
    for (let r = 0; r < 3; r++) {
      const y = -0.42 + r * 0.29;
      s.boxMin(-0.5, y - 0.025, 0, 0.5, y, 0.16, C.woodM);
      s.boxMin(-0.5, y - 0.008, 0.15, 0.5, y + 0.03, 0.165, tone(C.woodM, 1.2));
      for (let k = 0; k < 4; k++) stampBlock(s, -0.33 + k * 0.22, y + 0.085, 0.13, { s: 0.15, d: 0.1, wood: tone(C.woodL, 0.85 + rnd(r * 4 + k) * 0.25) });
    }
    s.boxMin(-0.53, 0.42, 0, 0.53, 0.47, 0.18, C.woodD);
  }
  // test prints pinned on the back wall (x 1.0, y 2.0): red impressions, straight borders, one curl
  x.sign('back', 1.0, 2.0, 0.55, 0.62, (g, w, h) => {
    paperBg(g, w, h, '#FBF5E6', 27);
    g.strokeStyle = '#B5463C';
    g.fillStyle = 'rgba(181,70,60,0.85)';
    for (let i = 0; i < 6; i++) {
      const cx = w * (0.28 + (i % 2) * 0.44);
      const cy = h * (0.18 + Math.floor(i / 2) * 0.31);
      const s = w * 0.17;
      g.lineWidth = 4;
      g.strokeRect(cx - s, cy - s * 0.8, s * 2, s * 1.6);
      g.lineWidth = 2;
      g.strokeRect(cx - s * 0.75, cy - s * 0.55, s * 1.5, s * 1.1);
      if (i === 5) {
        g.beginPath();
        g.arc(cx, cy, s * 0.35, 0, Math.PI * 1.7);
        g.stroke();
      } else g.fillRect(cx - s * 0.4, cy - 3, s * 0.8, 6);
    }
  }, { off: 0.01, ppm: 380 });
  for (const [px, py] of [[0.76, 2.29], [1.24, 2.29]]) v.box(px, py, -hd + 0.015, 0.025, 0.025, 0.02, P.gold);
  // two pegs (x +1.9, y 1.5): the first empty, the second holding her small apron (flag `apron`)
  {
    const s = x.onWall('back', 1.9, 1.5);
    s.boxMin(-0.35, -0.05, 0, 0.35, 0.05, 0.03, C.woodD);
    for (const px of [-0.15, 0.15]) {
      prism(s, px, 0, 0.08, 0.02, 0.02, 0.12, C.woodM, 8);
      s.add(prismGeo(0.02, 0.02, 0.12, 8), C.woodM, mat(px, 0, 0.08, HP));
    }
  }
  const apron = dyn.part();
  {
    const s = dyn.sink(apron, x.wallMat('back', 2.05, 1.5, 0.06));
    s.box(0, -0.02, 0.02, 0.05, 0.05, 0.03, '#7A2533');
    s.box(-0.06, -0.12, 0.02, 0.012, 0.2, 0.012, '#7A2533');
    s.box(0.06, -0.12, 0.02, 0.012, 0.2, 0.012, '#7A2533');
    s.box(0, -0.38, 0.03, 0.3, 0.42, 0.025, '#E9C46A');
    s.box(0, -0.42, 0.045, 0.16, 0.1, 0.008, '#D9A93B');
    s.box(0, -0.6, 0.03, 0.3, 0.03, 0.026, '#7A2533');
  }
  x.flag('apron', true, (on) => dyn.show(apron, on));
  // a row of chisels in a wall holder above the bench's right half
  {
    const s = x.onWall('back', 0.35, 1.3);
    s.boxMin(-0.32, -0.03, 0, 0.32, 0.03, 0.08, C.woodM);
    for (let i = 0; i < 8; i++) {
      s.boxMin(-0.28 + i * 0.08 - 0.012, -0.2, 0.03, -0.28 + i * 0.08 + 0.012, -0.03, 0.055, '#B8B2A6');
      s.boxMin(-0.28 + i * 0.08 - 0.018, 0.03, 0.03, -0.28 + i * 0.08 + 0.018, 0.16 + (i % 3) * 0.02, 0.06, i % 2 ? C.woodL : C.woodM);
    }
  }

  // left wall: the pupil's place (−2.3, −1.2), dusty; a basket of blank blocks (−2.4, 0.4)
  {
    const dusty = (c) => tone(c, 1.0);
    const s = x.at(-2.3, -1.2, HP);
    bench(s, 0, 0, { L: 0.9, d: 0.45, h: 0.45, c: dusty('#A89A86') });
    for (let i = 0; i < 9; i++) s.box(-0.38 + rnd(i) * 0.76, 0.452, -0.18 + rnd(i * 3) * 0.36, 0.06, 0.003, 0.05, '#CFC6B4'); // dust
    lowStool(x.at(-2.35, -0.45, 0), 0, 0, { h: 0.3, c: '#A89A86', s: 0.3 });
    x.solid(-2.3, -1.2, 0.9, 0.45, HP);
    x.solid(-2.35, -0.45, 0.3, 0.3);
    // a cobweb in the corner above it
    for (let i = 0; i < 3; i++) rbox(v, -2.88, 2.72 - i * 0.05, -3.38 + i * 0.04, 0.004, 0.004, 0.22 - i * 0.05, '#E9E4DA', 0.6, 0.78, 0);
    basket(v, -2.4, 0, 0.4, { r: 0.24, h: 0.24, c: '#B98F5B' });
    for (let i = 0; i < 8; i++) rbox(v, -2.4 + (rnd(i * 2) - 0.5) * 0.28, 0.27 + rnd(i) * 0.05, 0.4 + (rnd(i * 5) - 0.5) * 0.28, 0.09, 0.09, 0.09, tone('#E3C08E', 0.9 + rnd(i * 3) * 0.2), rnd(i) * 0.5, rnd(i * 7) * 2, 0);
    x.solid(-2.4, 0.4, 0.5, 0.5);
  }
  // right wall shelf (2.65, −1.3) turned −π/2: his returned block face down + «ပြန်ပို့ပါသည်», ink pads, jar of handles
  {
    const s = x.at(2.75, -1.3, -HP);
    const w = 1.2;
    const h = 1.6;
    const d = 0.35;
    s.boxMin(-w / 2, 0, -d / 2, -w / 2 + 0.05, h, d / 2, C.woodM);
    s.boxMin(w / 2 - 0.05, 0, -d / 2, w / 2, h, d / 2, C.woodM);
    s.boxMin(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.03, tone(C.woodM, 0.65));
    for (let r = 0; r <= 3; r++) {
      const y = 0.06 + r * ((h - 0.06) / 3);
      s.boxMin(-w / 2, y - 0.03, -d / 2, w / 2, y, d / 2, C.woodM);
      s.boxMin(-w / 2, y - 0.008, d / 2 - 0.015, w / 2, y + 0.002, d / 2 + 0.005, tone(C.woodM, 1.25));
    }
    const y2 = 0.06 + 2 * ((h - 0.06) / 3);
    // returned contest block, face down, slip tucked under
    s.boxMin(-0.42, y2, -0.1, -0.2, y2 + 0.12, 0.1, '#EED6A4');
    s.boxMin(-0.425, y2 + 0.105, 0.085, -0.195, y2 + 0.125, 0.105, '#E9C46A'); // gold-lit edge
    s.boxMin(-0.44, y2, 0.05, -0.16, y2 + 0.004, 0.18, '#FFFDF6');
    inkPad(s, 0.05, y2, 0.0);
    inkPad(s, 0.25, y2, 0.02, '#2F3B5A');
    const y1 = 0.06 + ((h - 0.06) / 3);
    prism(s, -0.3, y1 + 0.1, 0, 0.07, 0.07, 0.2, C.glass);
    for (let i = 0; i < 6; i++) rbox(s, -0.3 + (i - 2.5) * 0.018, y1 + 0.2, 0, 0.018, 0.2, 0.018, C.woodM, 0, 0, (i - 2.5) * 0.07);
    for (let i = 0; i < 5; i++) s.boxMin(0.0, y1 + i * 0.012, -0.1, 0.36, y1 + i * 0.012 + 0.01, 0.12, i % 2 ? '#FBF6EA' : '#F1E6CC');
    s.boxMin(-0.45, 0.06, -0.12, 0.0, 0.2, 0.12, '#8E5A3C');
    for (let i = 0; i < 4; i++) s.boxMin(0.08 + i * 0.1, 0.06, -0.06, 0.16 + i * 0.1, 0.14, 0.06, tone(C.woodL, 0.9 + i * 0.05));
    x.solid(2.75, -1.3, w, d, -HP);
    // the slip as a hanging tag on the shelf edge, readable: «ပြန်ပို့ပါသည်»
    x.signAt(new THREE.Matrix4().multiplyMatrices(mat(2.75, 0, -1.3, 0, -HP), mat(-0.3, y2 - 0.1, d / 2 + 0.012)), 0.24, 0.1, (g, w2, h2) => {
      paperBg(g, w2, h2, '#FFFDF6', 3);
      txt(g, 'ပြန်ပို့ပါသည်', w2 / 2, h2 * 0.52, h2 * 0.48, '#6E1F2A', { max: w2 * 0.92 });
    }, 420);
  }
  wallCalendar(x, 'left', -2.55, 1.85, { title: 'တန်ဆောင်မုန်း', seed: 9, w: 0.38, h: 0.54 });
  wallLamp(x, 'right', -2.6, 2.05);
  wallLamp(x, 'left', -0.6, 1.95);
  // boards leaning in the back-left corner, a chopping log with a mallet, a printing table with fresh pulls
  for (let i = 0; i < 4; i++) rbox(v, -2.75 + i * 0.09, 0.85, -3.3 + i * 0.04, 0.22 - i * 0.02, 1.7 - i * 0.12, 0.04, tone(C.woodL, 0.85 + i * 0.07), 0.12 + i * 0.02, 0, 0.05 * i);
  x.solid(-2.65, -3.25, 0.6, 0.35);
  prism(v, -1.15, 0.24, 1.0, 0.24, 0.26, 0.48, '#8A5E3C');
  prism(v, -1.15, 0.485, 1.0, 0.235, 0.235, 0.012, '#D9B98A');
  for (let i = 0; i < 3; i++) prism(v, -1.15, 0.488 + i * 0.001, 1.0, 0.18 - i * 0.06, 0.18 - i * 0.06, 0.014, i % 2 ? '#C9A26A' : '#B98F5B');
  rbox(v, -1.05, 0.53, 0.95, 0.24, 0.04, 0.04, C.woodL, 0, 0.6);
  rbox(v, -0.95, 0.54, 0.85, 0.08, 0.08, 0.12, C.woodM, 0, 0.6);
  rbox(v, -1.3, 0.52, 1.1, 0.1, 0.08, 0.1, '#E3C08E', 0, 0.3);
  x.solid(-1.15, 1.0, 0.5, 0.5);
  {
    const tx = 1.55;
    const tz = 0.75;
    const th = 0.72;
    v.boxMin(tx - 0.5, th - 0.05, tz - 0.32, tx + 0.5, th, tz + 0.32, C.woodM);
    v.boxMin(tx - 0.5, th - 0.01, tz + 0.3, tx + 0.5, th + 0.002, tz + 0.32, tone(C.woodM, 1.25));
    for (const a of [-1, 1]) for (const b of [-1, 1]) v.box(tx + a * 0.43, (th - 0.05) / 2, tz + b * 0.25, 0.06, th - 0.05, 0.06, C.woodD);
    v.boxMin(tx - 0.42, 0.15, tz - 0.25, tx + 0.42, 0.18, tz + 0.25, C.woodD);
    for (let i = 0; i < 6; i++) v.boxMin(tx - 0.4, 0.18 + i * 0.01, tz - 0.2, tx - 0.05, 0.188 + i * 0.01, tz + 0.2, '#FBF6EA');
    v.boxMin(tx - 0.42, th, tz - 0.22, tx - 0.1, th + 0.012, tz + 0.08, '#2A2118');
    rbox(v, tx - 0.25, th + 0.04, tz + 0.18, 0.2, 0.05, 0.05, '#3B2A1A', 0, 0.3);
    rbox(v, tx - 0.17, th + 0.05, tz + 0.27, 0.03, 0.03, 0.16, C.woodL, 0, 0.3);
    for (let i = 0; i < 3; i++) {
      rbox(v, tx + 0.15 + i * 0.1, th + 0.003 + i * 0.002, tz - 0.05 + i * 0.06, 0.2, 0.004, 0.26, '#FBF6EA', 0, (i - 1) * 0.2);
      rbox(v, tx + 0.15 + i * 0.1, th + 0.007 + i * 0.002, tz - 0.05 + i * 0.06, 0.1, 0.002, 0.1, '#B5463C', 0, (i - 1) * 0.2);
    }
    stampBlock(v, tx + 0.05, th + 0.05, tz - 0.2, { s: 0.1, d: 0.08 });
    x.solid(tx, tz, 1.0, 0.64);
  }
  // front: water jar with a cup (2.3, 2.4); a stack of plank offcuts (−2.3, 2.4); a broom
  waterJar(v, 2.3, 2.4, { s: 0.85 });
  x.solid(2.3, 2.4, 0.5, 0.5);
  for (let i = 0; i < 6; i++) {
    const L = 0.6 + rnd(i * 3) * 0.6;
    v.boxMin(-2.3 - L / 2 + (rnd(i) - 0.5) * 0.15, i * 0.06, 2.4 - 0.12 + (rnd(i * 5) - 0.5) * 0.06, -2.3 + L / 2 + (rnd(i) - 0.5) * 0.15, i * 0.06 + 0.055, 2.4 + 0.12, tone(C.woodL, 0.85 + rnd(i * 7) * 0.25));
  }
  rbox(v, -2.75, 0.55, 2.0, 0.12, 1.1, 0.04, C.woodL, 0.0, 0, 0.18);
  rbox(v, -2.6, 0.45, 2.05, 0.15, 0.9, 0.04, tone(C.woodL, 0.9), 0.0, 0, 0.25);
  x.solid(-2.4, 2.3, 1.3, 0.5);
  broom(v, 2.85, 0.9, { lean: 0.15, ry: -HP });
  // a low sawhorse with a half-sawn plank of raw wood and a pale heap of sawdust under it (1.2, 1.95)
  {
    const s = x.at(1.2, 1.95, 0.12);
    for (const a of [-1, 1]) {
      s.add(UNIT, C.woodD, mat(a * 0.38, 0.22, -0.1, 0.25, 0, 0, 0.06, 0.48, 0.06));
      s.add(UNIT, C.woodD, mat(a * 0.38, 0.22, 0.1, -0.25, 0, 0, 0.06, 0.48, 0.06));
    }
    s.boxMin(-0.48, 0.44, -0.05, 0.48, 0.5, 0.05, C.woodM);
    s.boxMin(-0.62, 0.5, -0.13, 0.3, 0.56, 0.13, '#C99B68'); // the plank
    s.boxMin(0.3, 0.5, -0.13, 0.62, 0.56, -0.01, '#C99B68'); // half sawn: the cut runs in from the end
    s.boxMin(0.33, 0.5, 0.0, 0.62, 0.56, 0.13, '#B98A58');
    rbox(s, 0.05, 0.6, 0.0, 0.42, 0.025, 0.06, '#8C877E', 0, 0.4, 0); // saw blade
    rbox(s, -0.17, 0.62, 0.09, 0.12, 0.05, 0.05, C.woodD, 0, 0.4, 0); // handle
    for (let i = 0; i < 7; i++) rbox(s, 0.45 + (rnd(i * 3) - 0.5) * 0.3, 0.008, (rnd(i * 5) - 0.5) * 0.3, 0.12, 0.012, 0.09, i % 2 ? '#E9D2A6' : '#F3E2BE', 0, rnd(i) * 3, 0);
    x.solid(1.2, 1.95, 1.25, 0.4, 0);
  }
  // a worn rush mat under the old teaching tray, where the pupil used to sit and watch: gold weave,
  // maroon border, a frayed corner (kept off the open floor so it never reads as a place to go)
  {
    const mx = -1.25;
    const mz = -0.3;
    const mw = 1.15;
    const md = 0.85;
    v.boxMin(mx - mw / 2, 0.002, mz - md / 2, mx + mw / 2, 0.014, mz + md / 2, '#7A2533');
    v.boxMin(mx - mw / 2 + 0.07, 0.002, mz - md / 2 + 0.07, mx + mw / 2 - 0.07, 0.017, mz + md / 2 - 0.07, '#C9A45E');
    for (let i = 0; i < 7; i++) {
      const zz = mz - md / 2 + 0.12 + i * ((md - 0.24) / 6);
      v.boxMin(mx - mw / 2 + 0.1, 0.017, zz - 0.012, mx + mw / 2 - 0.1, 0.019, zz + 0.012, i % 2 ? '#B38E4C' : '#D8B871');
    }
    v.boxMin(mx - mw / 2 + 0.16, 0.019, mz - 0.03, mx + mw / 2 - 0.16, 0.021, mz + 0.03, '#9E3A3A');
    for (let i = 0; i < 6; i++) rbox(v, mx + mw / 2 - 0.04 - rnd(i * 4) * 0.12, 0.016, mz + md / 2 - 0.02 - rnd(i * 2) * 0.1, 0.06, 0.006, 0.012, '#D8B871', 0, rnd(i) * 3); // frayed corner
  }
  // the old teaching tray on a low table at the pupil's end: kettle, two glasses, one turned down
  {
    const tx = -1.2;
    const tz = -0.35;
    const th = 0.32;
    v.boxMin(tx - 0.26, th - 0.04, tz - 0.22, tx + 0.26, th, tz + 0.22, C.woodM);
    for (const a of [-1, 1]) for (const b of [-1, 1]) v.box(tx + a * 0.21, (th - 0.04) / 2, tz + b * 0.17, 0.05, th - 0.04, 0.05, C.woodD);
    v.boxMin(tx - 0.2, th, tz - 0.16, tx + 0.2, th + 0.015, tz + 0.16, '#A8834A');
    prism(v, tx - 0.06, th + 0.075, tz - 0.02, 0.075, 0.065, 0.12, '#8A4B2C', 10);
    prism(v, tx - 0.06, th + 0.145, tz - 0.02, 0.03, 0.03, 0.025, '#5E3320', 8);
    rbox(v, tx + 0.03, th + 0.1, tz - 0.02, 0.09, 0.02, 0.02, '#8A4B2C', 0, 0, -0.5);
    rbox(v, tx - 0.15, th + 0.11, tz - 0.02, 0.02, 0.07, 0.06, '#5E3320');
    prism(v, tx + 0.11, th + 0.05, tz + 0.08, 0.03, 0.026, 0.07, C.glass);
    prism(v, tx + 0.11, th + 0.04, tz - 0.08, 0.03, 0.026, 0.07, C.glass);
    x.solid(tx, tz, 0.52, 0.44);
  }
  // order slate by the door frame on the right wall: who wants which seal (chalk, mostly rubbed out)
  x.sign('right', -2.25, 1.5, 0.56, 0.42, (g, w, h) => {
    g.fillStyle = '#5B4330';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#2E3430';
    g.fillRect(w * 0.06, h * 0.08, w * 0.88, h * 0.84);
    g.fillStyle = 'rgba(240,232,214,0.16)';
    for (let i = 0; i < 5; i++) g.fillRect(w * (0.12 + rnd(i) * 0.4), h * (0.2 + i * 0.13), w * (0.2 + rnd(i * 3) * 0.3), h * 0.07);
    txt(g, 'အော်ဒါ', w / 2, h * 0.25, h * 0.17, '#EDE5D2', { max: w * 0.8 });
    txt(g, '— မရှိ —', w / 2, h * 0.62, h * 0.15, 'rgba(237,229,210,0.75)', { max: w * 0.8 });
  }, { ppm: 420 });
  // his stool (0.9, −1.8), the pupil's stool's grown-up twin
  lowStool(v, 0.9, -1.8, { h: 0.45, c: C.woodM, s: 0.34 });

  // ---- people (Day 5 carvershop table)
  x.spot('kolwin', 0.9, -1.8, 0, { seat: 0.45 }); // on his stool, back to the bench
  x.spot('kolwinBench', 0.9, -1.8, PI, { seat: 0.45 }); // from d5.klTalk: turned to the bench
  x.spot('maya', 0, -0.4, PI); // Maya's talk spot
  x.spot('door', 0, 2.6, PI);

  x.tap('bench', -0.5, -1.95, { x: -0.48, z: -2.95 }, { line: null });
  x.tap('returned', 1.95, -0.75, { x: 2.75, z: -1.3 });
  x.tap('pupilPlace', -1.5, -1.2, { x: -2.3, z: -1.2 });
  x.tap('apron', 1.9, -2.5, { x: 1.9, z: -hd });
  x.tap('blockRack', -1.9, -2.5, { x: -1.9, z: -hd });
  x.tap('orderSlate', 2.0, -2.3, { x: 3.0, z: -2.25 }, { line: { my: 'အော်ဒါ — မရှိ —', en: 'Orders — none —' } }); // tap-to-read look

  return finishRoom(x, { my: 'ကိုလွင့် တံဆိပ်တုံးဆိုင်', en: "Ko Lwin's carving shop" });
}

// =============================================================================================
// finish: bake, build the dynamic meshes, wire flags, evening, rain, update, dispose
// =============================================================================================
function finishRoom(x, name) {
  const { room, A, dyn } = x;
  // statics into the room (one prop, then the kit bake merges it with the shell)
  const g = new THREE.Group();
  g.name = 'marketStatics';
  g.add(x.v.mesh({ outline: false }));
  room.group.add(g);
  room.bake();
  const own = []; // materials this room created (disposed with it)
  const signs = A.mesh(`${x.id}Signs`);
  if (signs) { room.group.add(signs); own.push(signs.material); }
  room.textures.push(A.tex);
  const lampMesh = x.lamp.mesh();
  if (lampMesh) room.group.add(lampMesh);
  own.push(x.lamp.material);
  const emberMesh = x.ember.mesh();
  if (emberMesh) room.group.add(emberMesh);
  own.push(x.ember.material);
  // ONE additive light-decal mesh: window sun patches (day), lamp pools (evening) and warm glows
  // (hearth, brazier). Each decal's strength is written into its vertex colours, so the three
  // kinds share one draw call; the mesh hides itself when everything is dark.
  const glowMat = new THREE.MeshBasicMaterial({ map: poolTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  own.push(glowMat);
  const cSun = new THREE.Color('#FFE9B8');
  const cPool = new THREE.Color('#FFB45E');
  const decals = [
    ...x.suns.map((s) => ({ kind: 'sun', geo: new THREE.PlaneGeometry(s.w, s.d).applyMatrix4(mat(s.x, 0.014, s.z, -HP, 0, 0.12)) })),
    ...x.pools.map((p) => ({ kind: 'pool', geo: new THREE.PlaneGeometry(p.r * 2, p.r * 2).applyMatrix4(mat(p.x, p.y, p.z, -HP)) })),
    ...x.warms.map((w) => ({
      kind: 'warm', item: w, col: new THREE.Color(w.color),
      geo: new THREE.PlaneGeometry(w.r * 2, w.r * 2 * w.sy).applyMatrix4(w.wall ? mat(w.x, w.y, w.z) : mat(w.x, w.y, w.z, -HP)),
    })),
  ];
  let glowMesh = null;
  let glowCol = null;
  if (decals.length) {
    for (const d of decals) d.geo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(d.geo.attributes.position.count * 3), 3));
    glowMesh = new THREE.Mesh(mergeGeometries(decals.map((d) => d.geo), false), glowMat);
    for (const d of decals) d.geo.dispose();
    glowMesh.name = 'lightDecals';
    glowMesh.renderOrder = 2;
    glowMesh.userData.dynamic = true;
    room.group.add(glowMesh);
    glowCol = glowMesh.geometry.attributes.color;
  }
  const decal = (list, material, name2, fn) => {
    if (!list.length) return null;
    const geos = list.map(fn);
    const m = new THREE.Mesh(mergeGeometries(geos, false), material);
    for (const geo of geos) geo.dispose();
    m.name = name2;
    m.renderOrder = 2;
    m.userData.dynamic = true;
    room.group.add(m);
    return m;
  };
  // window panes: evening tint + rain streaks
  const nightMat = new THREE.MeshBasicMaterial({ color: '#1F2A4A', transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const myRain = rainTexture().clone();
  myRain.needsUpdate = true;
  const rainMat = new THREE.MeshBasicMaterial({ map: myRain, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false });
  own.push(nightMat, rainMat);
  const tintMesh = decal(x.panes, nightMat, 'paneTint', (p) => new THREE.PlaneGeometry(p.w, p.h).applyMatrix4(mat(p.x, p.y, p.z)));
  const rainMesh = decal(x.panes, rainMat, 'paneRain', (p) => {
    const geo = new THREE.PlaneGeometry(p.w, p.h).applyMatrix4(mat(p.x, p.y, p.z + 0.004));
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * p.w * 1.6, uv.getY(i) * p.h * 1.6);
    return geo;
  });
  if (rainMesh) rainMesh.visible = false;
  dyn.build(room.group);
  let mistMat = null;
  if (x.mist.count) {
    mistMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.82, depthWrite: false, toneMapped: false });
    own.push(mistMat);
    x.mist.build(room.group, 0, mistMat);
  }

  // flags
  const flags = x.flags;
  for (const k of Object.keys(x.flagFns)) for (const fn of x.flagFns[k]) fn(flags[k]);
  dyn.commit();
  x.mist.commit();

  // evening and rain
  const hemi = room.lights.hemi;
  const sun = room.lights.sun;
  const hemi0 = hemi.intensity;
  const sun0 = sun.intensity;
  const sunDay = sun.color.clone();
  const sunEve = new THREE.Color('#FFB878');
  const skyDay = hemi.color.clone();
  const skyEve = new THREE.Color('#E9C9A0');
  const bgDay = room.scene.background.clone();
  const bgEve = new THREE.Color('#A99C86');
  const st = { eve: 0, rain: false, t: 0, flags };
  const NO_MOOD = { hemi: 1, sun: 1, sunPatch: 1 };
  function applyLight() {
    const k = st.eve;
    const r = st.rain ? 1 : 0;
    const md = x.mood ? { ...NO_MOOD, ...x.mood(st) } : NO_MOOD;
    hemi.intensity = hemi0 * md.hemi * (1 - 0.4 * k) * (1 - 0.15 * r);
    sun.intensity = sun0 * md.sun * (1 - 0.68 * k) * (1 - 0.35 * r);
    sun.color.copy(sunDay).lerp(sunEve, k);
    if (md.sunColor) sun.color.lerp(md.sunColor, 1 - k);
    hemi.color.copy(skyDay).lerp(skyEve, k * 0.8);
    room.scene.background.copy(bgDay).lerp(bgEve, k * 0.75 + r * 0.15);
    x.lamp.set(k);
    nightMat.opacity = Math.min(0.75, 0.66 * k + 0.25 * r);
    if (tintMesh) tintMesh.visible = nightMat.opacity > 0.001;
    if (rainMesh) rainMesh.visible = st.rain;
    if (glowMesh) {
      const fSun = 0.32 * (1 - k) * (1 - 0.8 * r) * md.sunPatch;
      const fPool = 0.5 * k;
      let any = false;
      decals.forEach((d, i) => {
        let f;
        let c;
        if (d.kind === 'sun') { f = fSun; c = cSun; } else if (d.kind === 'pool') { f = fPool; c = cPool; } else { f = clamp01(d.item.level(st)); c = d.col; }
        if (f > 0.001) any = true;
        for (let j = 0; j < 4; j++) glowCol.setXYZ(i * 4 + j, c.r * f, c.g * f, c.b * f);
      });
      glowCol.needsUpdate = true;
      glowMesh.visible = any;
    }
  }
  applyLight();

  room.animators.push((dt, t) => {
    st.t = t;
    for (const fn of x.anim) fn(dt, t);
    if (st.rain) myRain.offset.y = frac(t * 0.9);
    dyn.commit();
    x.mist.commit();
  });

  const ready = fontsReady().then(() => A.repaint());
  return {
    id: x.id,
    name,
    room,
    scene: room.scene,
    group: room.group,
    width: x.W,
    depth: x.D,
    height: x.H,
    bounds: room.bounds,
    spawn: room.spawn,
    door: room.door,
    obstacles: room.obstacles,
    stations: room.stations,
    taps: room.stations,
    spots: x.spots,
    flags,
    ready,
    get(flag) { return flags[flag]; },
    set(flag, value = true) {
      flags[flag] = value;
      for (const fn of x.flagFns[flag] || []) fn(value);
      dyn.commit();
      applyLight(); // warm glows and moods can follow flags
    },
    // Camera hint for a story hook (same terms as main.js' room rig): metres of room across a
    // portrait phone, tilt in degrees, where to aim front-to-back. Small rooms are framed tighter.
    view: { width: Math.min(6, x.W - 0.1), tilt: 48, lookZ: x.view?.lookZ ?? 0.5 },
    setEvening(k) { st.eve = clamp01(k); applyLight(); },
    setRain(on) { st.rain = !!on; applyLight(); },
    update(dt, t, state) { room.update(dt, t, state); },
    dispose() {
      room.dispose();
      for (const m of own) m.dispose();
      myRain.dispose();
    },
  };
}

// =============================================================================================
// seated pose for people on stools and benches (call after person.update every frame)
// =============================================================================================
export function seatPerson(person, seatY = 0.3) {
  const b = person.bones;
  if (!b) return;
  b.hips.position.y = seatY + 0.03;
  b.legL.rotation.x = -1.3;
  b.legR.rotation.x = -1.3;
}

export const ROOMS = {
  teashop: { name: { my: 'လက်ဖက်ရည်ဆိုင်', en: "Daw Tin Tin's tea shop" }, build: buildTeashop },
  marketpost: { name: { my: 'ဈေးစာတိုက်', en: 'Market post office' }, build: buildMarketpost },
  postroom: { name: { my: 'စာတိုက် နောက်ခန်း', en: 'The post room' }, build: buildPostroom },
  riceshop: { name: { my: 'စေတနာထမင်းဆိုင်', en: "Daw Yi's free-food shop" }, build: buildRiceshop },
  sundries: { name: { my: 'ကုန်စုံဆိုင်', en: "Ma Yu Yu's sundries shop" }, build: buildSundries },
  carvershop: { name: { my: 'ကိုလွင့် တံဆိပ်တုံးဆိုင်', en: "Ko Lwin's carving shop" }, build: buildCarvershop },
};
