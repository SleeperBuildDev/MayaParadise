// Ledger Wharf story interiors (INDEX 13.1 / 13.2 / 13.5): the weigh-house, Daw Sanda's stilt house and
// U Bo Lay's cane shed. Built with js/game/interiors/kit.js createRoom() exactly as the site's rooms are:
// a front-open dollhouse, every static box baked into one vertex-coloured mesh + outline, every sign and
// painted window view on ONE canvas atlas per room, everything that moves in ONE instanced box mesh.
// No station markers (no-guidance rule): `stations` are plain tap targets the story wires up itself.
//
//   import { ROOMS } from './rooms/wharf.js';
//   const r = ROOMS.weighhouse.build({ day: 5 });
//   r.scene / r.group / r.obstacles / r.door / r.bounds / r.spawn
//   r.stations      [{ id, x, z, r, look: {x,z}, at: {x,y,z}, name: {my,en} }]  (Maya stands at x,z; tap `at`)
//   r.spots         { [name]: { x, z, h, sit?, mood?, who? } }   h = heading (atan2(dx,dz)); sit = seat height
//   r.update(dt, t) every frame · r.setEvening(0..1) lamps on, windows dusk · r.setRain(bool) · r.dispose()
//   r.ready         Promise: the atlas is repainted once the Burmese web font has loaded
//   r.props         room-specific handles (weighhouse: props.scale.settle(level), props.scale.platform)
//
// DAY: pass opts.day. weighhouse defaults to 5 (Ko Thiha's close; folded-sack pallet on the left wall); day >= 6
// adds Day 6's porters' bench, rope rack and Nay Chi's seat (+ spots porter1/2, naychi, slate2; kothiha only on 5).
// sandahouse defaults to 5 (cushions near/far), 6 = either side. caneshed defaults to 6 (only Day 6 / 14 / 15).
// Rain is never baked in: windows, drips and rain streaks appear only after r.setRain(true).
// Stations have no markers; their tap radius r is 0.9 m (finger-sized at 412 px; size is the only affordance).
// Exits: every room's door is the open front at x 0 (spots.entry). U Bo Lay's cane shed is reached by raft in
// the story: enter it at spots.entry as if stepping off the raft at the jetty head, not by a walking door.
//
// Coordinates are room metres (x right, z toward the open front, floor y = 0). Every Burmese line is a draft
// for Maya. Original art only.
import * as kit from '../../game/interiors/kit.js';
import { fontsReady, FONT_MY, FONT_SERIF, basic as basicMat, roundRect } from '../../game/toon.js';
import { mergeGeometries } from '../../game/three.js';
import { jitter } from '../../game/voxel.js';
import { chalkSlate } from '../props2.js';
import { waterJar as jarProp } from '../props4.js';

const { THREE, PALETTE: P, VoxelBuilder, toon, addOutline } = kit;
const PI = Math.PI;

// ---------------------------------------------------------------------------------------------
// small builders (build time only: these allocate)
// ---------------------------------------------------------------------------------------------
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
const _a = new THREE.Vector3(), _z = new THREE.Vector3(0, 0, 1), _q2 = new THREE.Quaternion(), _m = new THREE.Matrix4();

function mat(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}
/** Box with any turn about its own centre. */
function rbox(v, x, y, z, w, h, d, c, rx = 0, ry = 0, rz = 0) {
  v.add(UNIT, c, mat(x, y, z, rx, ry, rz, w, h, d));
}
/** A stick of square section t (and t2) from point a to point b. */
function seg(v, ax, ay, az, bx, by, bz, t, c, t2 = t, twist = 0) {
  _a.set(bx - ax, by - ay, bz - az);
  const len = _a.length();
  _a.normalize();
  _q.setFromUnitVectors(_z, _a);
  if (twist) _q.multiply(_q2.setFromAxisAngle(_z, twist));
  _m.compose(_p.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2), _q, _s.set(t, t2, len));
  v.add(UNIT, c, _m);
}
/** A chain of flat links from a to b. */
function chain(v, ax, ay, az, bx, by, bz, c, link = 0.075) {
  const len = Math.hypot(bx - ax, by - ay, bz - az);
  const n = Math.max(2, Math.round(len / link));
  for (let i = 0; i < n; i++) {
    const u0 = (i + 0.05) / n, u1 = (i + 0.95) / n;
    seg(v, ax + (bx - ax) * u0, ay + (by - ay) * u0, az + (bz - az) * u0, ax + (bx - ax) * u1, ay + (by - ay) * u1, az + (bz - az) * u1, 0.032, c, 0.012, (i % 2) * PI / 2);
  }
}
const prismCache = new Map();
function prismGeo(rt, rb, seg = 8) {
  const key = `${rt}|${rb}|${seg}`;
  let g = prismCache.get(key);
  if (!g) {
    g = new THREE.CylinderGeometry(rt, rb, 1, seg, 1, false, PI / seg).toNonIndexed();
    g.deleteAttribute('uv');
    g.deleteAttribute('normal');
    g.computeVertexNormals();
    prismCache.set(key, g);
  }
  return g;
}
/** Flat-faceted round thing (centre x, y, z; radii top/bottom; height h). */
function prism(v, x, y, z, rt, rb, h, c, n = 8, rx = 0, rz = 0) {
  v.add(prismGeo(rt, rb, n), c, mat(x, y, z, rx, 0, rz, 1, h, 1));
}
/** A ring of sticks (rope coil, hoop): centre, radius, plane 'xz' (flat) | 'yz' (on a side wall) | 'xy' (facing +Z). */
function ring(v, cx, cy, cz, r, t, c, plane = 'xz', n = 12) {
  const pt = (k) => {
    const a = (k / n) * PI * 2, cs = Math.cos(a) * r, sn = Math.sin(a) * r;
    return plane === 'xz' ? [cx + cs, cy, cz + sn] : plane === 'yz' ? [cx, cy + sn, cz + cs] : [cx + cs, cy + sn, cz];
  };
  for (let k = 0; k < n; k++) {
    const a = pt(k), b = pt(k + 1);
    seg(v, a[0], a[1], a[2], b[0], b[1], b[2], t, c);
  }
}
/** Deterministic 0..1 hash (every build looks the same). */
function rnd(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
/** Brightness-scaled colour (f < 1 fake ambient occlusion, f > 1 lit rims). */
function tone(hex, f) {
  const n = parseInt(hex.slice(1, 7), 16);
  const ch = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
}
const frac = (x) => x - Math.floor(x);
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const pick = (arr, i) => arr[Math.floor(rnd(i) * arr.length) % arr.length];

/** Collision box (already in room axes). */
function solid(room, x, z, w, d, pad = 0.08) {
  room.obstacles.push({ type: 'box', minX: x - w / 2 - pad, maxX: x + w / 2 + pad, minZ: z - d / 2 - pad, maxZ: z + d / 2 + pad });
}
function solidCircle(room, x, z, r, pad = 0.06) {
  room.obstacles.push({ type: 'circle', x, z, r: r + pad });
}
/** Merge a local builder (built facing +Z at the origin) into v at (x, z), turned rotY. */
function put(v, sub, x, z, rotY = 0, y = 0) {
  v.merge(sub, mat(x, y, z, 0, rotY, 0));
}

// the side walls step down toward the open front (kit.createRoom); these are the steps
function sideSteps(room) {
  const d = room.depth, hd = d / 2, h = room.height;
  return [[0, 0.45, h], [0.45, 0.65, h * 0.62], [0.65, 0.85, h * 0.36], [0.85, 1, 0.5]].map(([a, b, hh]) => ({ z0: -hd + d * a, z1: -hd + d * b, h: hh }));
}
/** Every wall face: { face, a0, a1, top } (a = x on the back wall, z on the sides). */
function wallFaces(room) {
  const hw = room.width / 2;
  const out = [{ face: 'back', a0: -hw, a1: hw, top: room.height - 0.12 }];
  for (const s of sideSteps(room)) for (const face of ['left', 'right']) out.push({ face, a0: s.z0, a1: s.z1, top: s.h - 0.08 });
  return out;
}
/** A box lying on a wall's inner face: along a0..a1, y0..y1, standing out d. */
function wbox(v, room, face, a0, a1, y0, y1, d, c) {
  const hw = room.width / 2, hd = room.depth / 2;
  if (face === 'back') v.boxMin(a0, y0, -hd, a1, y1, -hd + d, c);
  else if (face === 'left') v.boxMin(-hw, y0, a0, -hw + d, y1, a1, c);
  else v.boxMin(hw - d, y0, a0, hw, y1, a1, c);
}

// ---------------------------------------------------------------------------------------------
// canvas atlas: every sign, page, tag and window view of a room in one 1024 px texture, one mesh
// ---------------------------------------------------------------------------------------------
function makeAtlas(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const geos = [];
  const painters = [];
  let tex = null;
  const atlas = {
    g,
    region(x, y, w, h) {
      return { x, y, w, h, u0: x / size, u1: (x + w) / size, v0: 1 - (y + h) / size, v1: 1 - y / size };
    },
    /** fn(g, w, h) paints a region (origin at its top-left); kept so the atlas can be repainted. */
    paint(r, fn) {
      painters.push([r, fn]);
      return r;
    },
    /** Plane w × h facing +Z showing region r (optionally a sub-rectangle u/v in 0..1), placed by m. */
    quad(r, w, h, m, sub = null) {
      const geo = new THREE.PlaneGeometry(w, h);
      const uv = geo.attributes.uv;
      const [su0, sv0, su1, sv1] = sub || [0, 0, 1, 1];
      for (let i = 0; i < uv.count; i++) {
        const u = su0 + uv.getX(i) * (su1 - su0), vv = sv0 + uv.getY(i) * (sv1 - sv0);
        uv.setXY(i, r.u0 + u * (r.u1 - r.u0), r.v0 + vv * (r.v1 - r.v0));
      }
      geo.applyMatrix4(m);
      geos.push(geo);
    },
    redraw() {
      g.clearRect(0, 0, size, size);
      for (const [r, fn] of painters) {
        g.save();
        g.translate(r.x, r.y);
        g.beginPath();
        g.rect(0, 0, r.w, r.h);
        g.clip();
        fn(g, r.w, r.h);
        g.restore();
      }
      if (tex) tex.needsUpdate = true;
    },
    mesh(name = 'signs') {
      atlas.redraw();
      tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const m = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, toneMapped: false });
      const mesh = new THREE.Mesh(mergeGeometries(geos, false), m);
      for (const geo of geos) geo.dispose();
      mesh.name = name;
      mesh.userData.dynamic = true;
      mesh.userData.texture = tex;
      return mesh;
    },
  };
  return atlas;
}

// canvas drawing helpers
function say(g, text, x, y, size, color, { weight = 700, font = FONT_MY, align = 'center', max = 0, alpha = 1 } = {}) {
  g.save();
  g.globalAlpha = alpha;
  g.font = `${weight} ${size}px ${font}`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'middle';
  if (max) g.fillText(text, x, y, max);
  else g.fillText(text, x, y);
  g.restore();
}
function chalk(g, text, x, y, size, opts = {}) {
  say(g, text, x + 1.5, y + 1.5, size, '#F4F1E6', { ...opts, alpha: 0.28 });
  say(g, text, x, y, size, '#F4F1E6', { ...opts, alpha: 0.86 });
}
function fill(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
}
function ell(g, x, y, rx, ry, c, rot = 0) {
  g.fillStyle = c;
  g.beginPath();
  g.ellipse(x, y, rx, ry, rot, 0, PI * 2);
  g.fill();
}
/** Ledger paper: cream, blue rules, a red margin (and red/blue money columns). */
function ledgerPaper(g, w, h, { rule = 26, margin = 0.16, cols = [0.68, 0.84], bg = '#F6EEDB' } = {}) {
  fill(g, 0, 0, w, h, bg);
  g.fillStyle = 'rgba(70,110,170,0.45)';
  for (let y = rule * 2; y < h - 6; y += rule) g.fillRect(6, y, w - 12, 2);
  g.fillStyle = 'rgba(190,50,60,0.65)';
  g.fillRect(w * margin, 0, 2, h);
  g.fillRect(w * margin + 5, 0, 2, h);
  for (const c of cols) g.fillRect(w * c, rule * 1.5, 2, h);
}
/** Slate / blackboard with a worn wipe. */
function slate(g, w, h, c = '#2E3A33') {
  fill(g, 0, 0, w, h, c);
  for (let i = 0; i < 9; i++) ell(g, w * rnd(i + 3), h * rnd(i + 9), w * 0.22, h * 0.1, 'rgba(255,255,255,0.035)', rnd(i) - 0.5);
}
/** Painted daylight sky with soft clouds. */
function sky(g, w, h, top = '#A9CDE6', bottom = '#FBE7C8') {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, top);
  gr.addColorStop(1, bottom);
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);
}
function cloud(g, x, y, s, c = '#FFF8EE') {
  ell(g, x, y, s, s * 0.42, c);
  ell(g, x - s * 0.45, y + s * 0.08, s * 0.5, s * 0.3, c);
  ell(g, x + s * 0.5, y + s * 0.06, s * 0.55, s * 0.32, c);
  ell(g, x + s * 0.1, y - s * 0.22, s * 0.45, s * 0.35, c);
}
// tag icons (jetty tags: duck, fish, rice, firewood)
function tagCard(g, w, h, icon) {
  fill(g, 0, 0, w, h, '#B48A55');
  g.fillStyle = '#F3E6C6';
  g.beginPath();
  g.moveTo(w * 0.22, 4); g.lineTo(w - 4, 4); g.lineTo(w - 4, h - 4); g.lineTo(w * 0.22, h - 4); g.lineTo(4, h / 2);
  g.closePath();
  g.fill();
  ell(g, w * 0.17, h / 2, 6, 6, '#7A5434');
  g.save();
  g.translate(w * 0.6, h / 2);
  icon(g, Math.min(w, h) * 0.36);
  g.restore();
}
const ICON = {
  duck(g, s) {
    ell(g, 0, s * 0.2, s * 0.85, s * 0.45, '#E2B33C');
    ell(g, s * 0.55, -s * 0.35, s * 0.32, s * 0.3, '#E2B33C');
    g.fillStyle = '#C8323C';
    g.beginPath(); g.moveTo(s * 0.82, -s * 0.38); g.lineTo(s * 1.15, -s * 0.28); g.lineTo(s * 0.82, -s * 0.18); g.fill();
    ell(g, s * 0.6, -s * 0.42, s * 0.06, s * 0.06, '#2A2118');
    ell(g, -s * 0.15, s * 0.12, s * 0.4, s * 0.18, '#C9952A', -0.2);
  },
  fish(g, s) {
    ell(g, 0, 0, s * 0.85, s * 0.4, '#3E79B8');
    g.fillStyle = '#3E79B8';
    g.beginPath(); g.moveTo(-s * 0.7, 0); g.lineTo(-s * 1.15, -s * 0.38); g.lineTo(-s * 1.15, s * 0.38); g.fill();
    ell(g, s * 0.48, -s * 0.08, s * 0.08, s * 0.08, '#F3E6C6');
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fillRect(-s * 0.4, -s * 0.05, s * 0.7, s * 0.06);
  },
  rice(g, s) {
    g.strokeStyle = '#8E7A2E';
    g.lineWidth = s * 0.08;
    for (const a of [-0.35, 0, 0.35]) {
      g.beginPath(); g.moveTo(0, s * 0.9); g.quadraticCurveTo(a * s, 0, a * s * 1.8, -s * 0.8); g.stroke();
      for (let k = 0; k < 4; k++) ell(g, a * s * (1.1 + k * 0.22) + s * 0.1, -s * 0.15 - k * s * 0.2, s * 0.09, s * 0.15, '#D9A93B', 0.4);
    }
  },
  wood(g, s) {
    for (const [x, y] of [[-0.45, 0.35], [0.45, 0.35], [0, -0.35]]) {
      ell(g, x * s, y * s, s * 0.42, s * 0.42, '#8E5A3C');
      ell(g, x * s, y * s, s * 0.3, s * 0.3, '#D9B58A');
      ell(g, x * s, y * s, s * 0.12, s * 0.12, '#A9794E');
    }
  },
};

// ---------------------------------------------------------------------------------------------
// ambient movers: ONE instanced box mesh (+ outline) for flames, motes, rain, swinging lamps
// ---------------------------------------------------------------------------------------------
function makeDyn() {
  const boxes = [];
  const parts = [];
  const tmp = new THREE.Matrix4();
  const col = new THREE.Color();
  let mesh = null;
  return {
    part() {
      parts.push(new THREE.Matrix4().makeScale(0, 0, 0));
      return parts.length - 1;
    },
    box(part, x, y, z, w, h, d, color, rx = 0, ry = 0, rz = 0) {
      boxes.push({ part, m: mat(x, y, z, rx, ry, rz, w, h, d), color });
    },
    build(group) {
      mesh = new THREE.InstancedMesh(UNIT, toon('#ffffff'), Math.max(1, boxes.length));
      mesh.name = 'ambient';
      mesh.frustumCulled = false;
      mesh.userData.dynamic = true;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      boxes.forEach((b, i) => mesh.setColorAt(i, col.set(b.color)));
      group.add(mesh);
      const o = addOutline(mesh, { px: 1.2 });
      o.userData.dynamic = true;
      this.commit();
      return mesh;
    },
    set(i, x, y, z, rx, ry, rz, sx, sy = sx, sz = sx) {
      parts[i].compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
    },
    hide(i) {
      parts[i].makeScale(0, 0, 0);
    },
    commit() {
      for (let i = 0; i < boxes.length; i++) {
        tmp.multiplyMatrices(parts[boxes[i].part], boxes[i].m);
        mesh.setMatrixAt(i, tmp);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// soft additive glows (lamp halos, light pools, window light shafts): one mesh per kind
let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const s = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.4, 'rgba(255,255,255,0.45)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  glowTex = new THREE.CanvasTexture(cv);
  glowTex.userData.shared = true;
  return glowTex;
}
function makeGlow(name, { additive = true, textured = true } = {}) {
  const geos = [];
  const col = new THREE.Color();
  const api = {
    /** A plane w × h placed by m, tinted c. */
    quad(w, h, m, c) {
      const geo = new THREE.PlaneGeometry(w, h);
      geo.applyMatrix4(m);
      col.set(c);
      const n = geo.attributes.position.count;
      const arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
      geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
      geos.push(geo);
    },
    pool(x, z, rx, rz, c, y = 0.012) {
      api.quad(rx * 2, rz * 2, mat(x, y, z, -PI / 2), c);
    },
    halo(x, y, z, r, c) {
      api.quad(r * 2, r * 2, mat(x, y, z), c);
    },
    mesh() {
      if (!geos.length) return null;
      const material = new THREE.MeshBasicMaterial({
        map: textured ? glowTexture() : null, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, toneMapped: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(mergeGeometries(geos, false), material);
      for (const geo of geos) geo.dispose();
      mesh.name = name;
      mesh.userData.dynamic = true;
      mesh.renderOrder = 2;
      mesh.raycast = () => {};
      return mesh;
    },
  };
  return api;
}

// ---------------------------------------------------------------------------------------------
// shared room dressing
// ---------------------------------------------------------------------------------------------
/** Staggered floorboards over the kit floor, darker toward the back wall. */
function boards(v, room, tones, { boardW = 0.25, minL = 0.9, varL = 1.0, seed = 1, seam = '#5A4128' } = {}) {
  const hw = room.width / 2, hd = room.depth / 2;
  v.boxMin(-hw, 0, -hd, hw, 0.002, hd, seam);
  let row = 0;
  for (let z = -hd; z < hd - 1e-6; z += boardW, row++) {
    const z1 = Math.min(hd, z + boardW);
    const ao = 0.82 + 0.18 * clamp01((z + hd) / 1.4);
    let x = -hw - rnd(seed + row * 3.7) * 1.2;
    for (let k = 0; x < hw && k < 40; k++) {
      const L = minL + rnd(seed + row * 17.3 + k * 5.3) * varL;
      const xa = Math.max(-hw, x), xb = Math.min(hw, x + L);
      if (xb - xa > 0.05) v.boxMin(xa + 0.006, 0, z + 0.007, xb - 0.006, 0.006, z1 - 0.007, tone(pick(tones, seed + row * 31.7 + k * 7.1), ao));
      x += L;
    }
  }
}
/** Hurricane lantern (local, origin = bottom). */
function lantern(v, x, y, z, s = 1, body = '#2F3B36') {
  v.box(x, y + 0.02 * s, z, 0.2 * s, 0.04 * s, 0.2 * s, body);
  v.box(x, y + 0.06 * s, z, 0.16 * s, 0.04 * s, 0.16 * s, tone(body, 1.2));
  v.box(x, y + 0.16 * s, z, 0.13 * s, 0.16 * s, 0.13 * s, '#F4E2B0'); // glass
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) v.box(x + dx * 0.075 * s, y + 0.16 * s, z + dz * 0.075 * s, 0.018 * s, 0.18 * s, 0.018 * s, body);
  v.box(x, y + 0.27 * s, z, 0.18 * s, 0.04 * s, 0.18 * s, body);
  v.box(x, y + 0.31 * s, z, 0.1 * s, 0.05 * s, 0.1 * s, tone(body, 1.2));
  seg(v, x - 0.09 * s, y + 0.29 * s, z, x, y + 0.42 * s, z, 0.014 * s, '#4A3B30');
  seg(v, x + 0.09 * s, y + 0.29 * s, z, x, y + 0.42 * s, z, 0.014 * s, '#4A3B30');
}
/** Clay water jar on a little stand with a lid (centre x, z on the floor). */
function waterJar(v, x, z, { s = 1, stand = P.woodDark, clay = '#B5643C' } = {}) {
  for (const a of [0.4, 2.5, 4.6]) seg(v, x + Math.cos(a) * 0.2 * s, 0, z + Math.sin(a) * 0.2 * s, x + Math.cos(a) * 0.15 * s, 0.32 * s, z + Math.sin(a) * 0.15 * s, 0.05 * s, stand);
  ring(v, x, 0.3 * s, z, 0.17 * s, 0.045 * s, tone(stand, 1.15), 'xz', 10);
  prism(v, x, 0.38 * s, z, 0.16 * s, 0.11 * s, 0.14 * s, tone(clay, 0.8), 10);
  prism(v, x, 0.55 * s, z, 0.24 * s, 0.17 * s, 0.22 * s, clay, 10);
  prism(v, x, 0.73 * s, z, 0.17 * s, 0.24 * s, 0.16 * s, tone(clay, 1.08), 10);
  prism(v, x, 0.62 * s, z, 0.245 * s, 0.245 * s, 0.025 * s, '#EBDCBF', 10); // painted band
  prism(v, x, 0.84 * s, z, 0.12 * s, 0.13 * s, 0.07 * s, tone(clay, 0.85), 10);
  prism(v, x, 0.9 * s, z, 0.15 * s, 0.15 * s, 0.03 * s, P.wood, 10); // lid
  v.box(x, 0.93 * s, z, 0.05 * s, 0.03 * s, 0.05 * s, P.woodDark);
}
/** Tin cup (centre bottom). */
function tinCup(v, x, y, z, c = '#B9B7AE') {
  prism(v, x, y + 0.04, z, 0.045, 0.04, 0.08, c, 8);
  prism(v, x, y + 0.079, z, 0.047, 0.047, 0.006, tone(c, 1.15), 8);
  v.box(x + 0.055, y + 0.045, z, 0.018, 0.05, 0.012, tone(c, 0.85));
}
/** Burlap sack lying or standing (centre bottom), rounded with stacked boxes. */
function sack(v, x, z, { w = 0.55, h = 0.42, d = 0.38, c = '#C9A576', rot = 0, y = 0, tied = true } = {}) {
  const m = mat(x, y, z, 0, rot, 0);
  const s = new VoxelBuilder();
  s.box(0, h * 0.45, 0, w, h * 0.8, d, c);
  s.box(0, h * 0.42, 0, w * 0.9, h * 0.86, d * 1.06, tone(c, 0.95));
  s.box(0, h * 0.06, 0, w * 0.86, h * 0.12, d * 0.88, tone(c, 0.75));
  s.box(0, h * 0.86, 0, w * 0.82, h * 0.12, d * 0.82, tone(c, 1.08));
  s.box(0, h * 0.45, d * 0.53, w * 0.7, 0.012, 0.01, tone(c, 0.72)); // seam
  if (tied) {
    s.box(w * 0.48, h * 0.62, 0, 0.1, h * 0.36, d * 0.42, tone(c, 0.9)); // gathered neck
    s.box(w * 0.53, h * 0.62, 0, 0.04, h * 0.4, d * 0.48, '#7A5434');
    s.box(w * 0.6, h * 0.62, 0, 0.08, h * 0.28, d * 0.3, tone(c, 1.05));
  }
  v.merge(s, m);
}
/** Slatted wooden crate (centre bottom). */
function crate(v, x, z, { w = 0.6, h = 0.45, d = 0.5, y = 0, rot = 0, c = '#B58A5A' } = {}) {
  const s = new VoxelBuilder();
  s.boxMin(-w / 2 + 0.02, 0.02, -d / 2 + 0.02, w / 2 - 0.02, h - 0.02, d / 2 - 0.02, tone(c, 0.55));
  const n = 4;
  for (let i = 0; i < n; i++) {
    const y0 = 0.02 + (i * (h - 0.04)) / n;
    const y1 = y0 + (h - 0.04) / n - 0.03;
    s.boxMin(-w / 2, y0, d / 2 - 0.03, w / 2, y1, d / 2, tone(c, 0.92 + rnd(i + x * 7) * 0.16));
    s.boxMin(-w / 2, y0, -d / 2, -w / 2 + 0.03, y1, d / 2, tone(c, 0.82));
    s.boxMin(w / 2 - 0.03, y0, -d / 2, w / 2, y1, d / 2, tone(c, 0.78));
  }
  for (const sx of [-1, 1]) s.boxMin(sx * w / 2 - (sx > 0 ? 0.06 : -0.0), 0, d / 2 - 0.035, sx * w / 2 + (sx > 0 ? 0 : 0.06), h, d / 2 + 0.005, tone(c, 0.7));
  s.boxMin(-w / 2, h - 0.03, -d / 2, w / 2, h, d / 2, tone(c, 1.1));
  seg(s, -w / 2 + 0.05, 0.05, d / 2 + 0.01, w / 2 - 0.05, h - 0.05, d / 2 + 0.01, 0.04, tone(c, 0.85), 0.015); // brace
  v.merge(s, mat(x, y, z, 0, rot, 0));
}
/** A bundle of cut cane lying along local X (centre on the floor), tied at three places. */
function caneBundle(s, x, y, z, { len = 1.3, r = 0.13, rotY = 0, tones = ['#C9B66A', '#B9A55A', '#D8C27E', '#A89650'], tie = '#7A5434', seed = 1 } = {}) {
  const b = new VoxelBuilder();
  const offs = [[0, 0], [0.62, 0.55], [-0.62, 0.55], [0.62, -0.55], [-0.62, -0.55], [0, 1.0], [0, -1.0], [1.05, 0], [-1.05, 0]];
  offs.forEach(([oz, oy], i) => b.box((rnd(seed + i) - 0.5) * 0.08, r + oy * r * 0.55, oz * r * 0.55, len, r * 0.5, r * 0.5, pick(tones, seed * 3 + i)));
  for (const tx of [-len * 0.36, 0, len * 0.36]) b.box(tx, r, 0, 0.045, r * 1.75, r * 1.75, tie);
  s.merge(b, mat(x, y, z, 0, rotY, 0));
}

// shared room finish: bake, add the atlas / glow / ambient meshes, wire evening, rain, update, dispose
function finishRoom(room, { atlas, dyn, glow, shafts, dusk, shade, tick = [], evening = [], rain = [] }) {
  room.bake();
  if (shade) {
    const sm = shade.mesh();
    sm.material.opacity = 0.42;
    sm.renderOrder = 1;
    room.group.add(sm);
    room.contactShadows = sm;
  }
  const signs = atlas.mesh('signs');
  room.group.add(signs);
  room.textures.push(signs.userData.texture);
  const extraMats = [signs.material];
  let glowMesh = null, shaftMesh = null, duskMesh = null;
  const addGlow = (b) => {
    const m = b ? b.mesh() : null;
    if (m) { room.group.add(m); extraMats.push(m.material); }
    return m;
  };
  glowMesh = addGlow(glow);
  shaftMesh = addGlow(shafts);
  duskMesh = addGlow(dusk);
  dyn.build(room.group);
  room.ready = fontsReady().then(() => atlas.redraw());

  const st = { evening: 0, rain: false, rainK: 0 };
  room.state = st;
  const applyLook = () => {
    if (glowMesh) { glowMesh.material.opacity = 0.85 * st.evening; glowMesh.visible = st.evening > 0.01; }
    if (shaftMesh) { shaftMesh.material.opacity = 0.22 * (1 - st.evening) * (1 - 0.7 * st.rainK); shaftMesh.visible = shaftMesh.material.opacity > 0.01; }
    if (duskMesh) { duskMesh.material.opacity = Math.max(0.62 * st.evening, 0.32 * st.rainK); duskMesh.visible = duskMesh.material.opacity > 0.01; }
    for (const f of evening) f(st.evening);
  };
  room.setEvening = (k = 1) => { st.evening = clamp01(+k || 0); applyLook(); };
  room.setRain = (on = true) => { st.rain = !!on; st.rainK = st.rain ? 1 : 0; applyLook(); for (const f of rain) f(st.rain); };
  applyLook();
  room.update = (dt, t, state = {}) => {
    for (const f of tick) f(dt, t, st, state);
    dyn.commit();
    for (const a of room.animators) a(dt, t, state);
  };
  const kitDispose = room.dispose.bind(room);
  room.dispose = () => {
    kitDispose();
    for (const m of extraMats) m.dispose();
    room.contactShadows?.material.dispose();
  };
  return room;
}

/** Soft contact shadows under furniture (one normal-blended mesh): add(x, z, rx, rz). */
function makeShade() {
  const g = makeGlow('contactShadows', { additive: false });
  return { add: (x, z, rx, rz, k = 1) => g.pool(x, z, rx, rz, k >= 1 ? '#3B2A1A' : '#5A4630', 0.02), mesh: () => g.mesh() };
}

/** Shared tail of every build: stations with a label anchor (no marker), spots, name. */
function stationsFrom(list) {
  return list.map((s) => ({ r: 0.9, ...s, labelAnchor: new THREE.Vector3(s.at?.x ?? s.look.x, (s.at?.y ?? 1.2) + 0.6, s.at?.z ?? s.look.z) }));
}
const face = (fx, fz, tx, tz) => Math.atan2(tx - fx, tz - fz);

// =============================================================================================
// 1. weighhouse · the Ledger Wharf weigh-house (Days 5, 6; 14, 15) · 8 × 8 × 3.4
// =============================================================================================
const WH = {
  post: { x: 0, z: -3.3 }, plat: { x: 0, z: -1.9, s: 1.2 }, pivotY: 2.62, hookX: -0.3,
  check: { x: -1.2, z: -2.8 }, tally: { x: 2.3, y: 1.62 }, stand: { x: 2.5, z: -0.4 },
  bench: { x: -3.6, z0: -2.0, z1: 0.6 }, jar: { x: -3.2, z: 2.8 }, windows: [-2.2, 2.2], winY: 2.72,
};

function buildWeighhouse(opts = {}) {
  const day = opts.day ?? 5;
  const W = 8, D = 8, H = 3.4, hw = W / 2, hd = D / 2;
  const WALL = '#A27650', WALL_D = '#6E4A2E';
  const room = kit.createRoom({ width: W, depth: D, height: H, wall: WALL, wainscot: WALL_D, trim: P.goldDeep, floor: 'planks', floorColor: '#E2D2AE', background: '#E6D9BD' });
  room.id = 'weighhouse';
  const A = makeAtlas(1024);
  const dyn = makeDyn();
  const glow = makeGlow('lampGlow');
  const shafts = makeGlow('lightShafts');
  const dusk = makeGlow('dusk', { additive: false, textured: false });
  const shade = makeShade();
  const tick = [];
  const v = new VoxelBuilder();
  for (const [x, z, rx, rz] of [[0, -1.9, 0.95, 0.95], [0, -3.3, 0.35, 0.35], [-0.95, -2.8, 0.75, 0.4], [2.5, -0.4, 0.5, 0.7], [-3.55, -0.7, 0.45, 1.6], [3.4, 1.6, 0.6, 1.5], [2.7, 3.1, 0.9, 0.6], [-3.2, 2.8, 0.42, 0.42], [-2.45, -3.5, 0.55, 0.5], [-3.3, -3.5, 0.65, 0.5], [3.45, -2.55, 0.45, 0.5], [0, -3.75, 4.2, 0.45], [-3.75, 0, 0.4, 4.2], [3.75, 0, 0.4, 4.2]]) shade.add(x, z, rx, rz);

  // ---- the ledger floor: cream boards ruled in red and blue columns, numbers in the margins ----
  boards(v, room, ['#DCCBA6', '#D3C09A', '#E2D3B2', '#CCB892', '#D8C6A0'], { seed: 5, seam: '#8C7450' });
  const ruleY = 0.0075;
  for (const [x, c] of [[-3.35, '#B8424A'], [-3.27, '#B8424A'], [-1.85, '#5B7FB4'], [-0.55, '#5B7FB4'], [0.75, '#B8424A'], [2.05, '#5B7FB4'], [3.3, '#B8424A']]) v.boxMin(x - 0.014, 0, -hd, x + 0.014, ruleY, hd, c);
  for (let z = -hd + 0.75; z < hd; z += 1.0) v.boxMin(-hw, 0, z - 0.008, hw, ruleY - 0.001, z + 0.008, '#8FA6C8');
  // rice grains and straw by the sacks, chalk dust under the tally board
  for (let i = 0; i < 40; i++) v.box(2.3 + rnd(i + 0.3) * 1.4, 0.008, 0.3 + rnd(i + 7.7) * 2.2, 0.025, 0.012, 0.015, i % 4 ? '#F6F0E2' : '#D9B45A', rnd(i) * 3);
  for (let i = 0; i < 6; i++) v.box(-2.4 + rnd(i + 2.2) * 1.2, 0.008, 3.0 + rnd(i + 4.1) * 0.8, 0.16, 0.008, 0.014, '#D9B45A', rnd(i + 9) * 3);
  const NUM = A.region(0, 816, 512, 96);
  A.paint(NUM, (g, w, h) => {
    const nums = ['၁၂', '၃၀', '၇½', '၂၅'];
    nums.forEach((n, i) => say(g, n, i * 128 + 64, h / 2, 62, '#3B4E7A', { weight: 400, alpha: 0.9 }));
  });
  [[-3.7, -2.6, 0], [-3.7, 0.9, 1], [3.65, -1.5, 2], [-3.7, 3.0, 3]].forEach(([x, z, k]) => A.quad(NUM, 0.34, 0.26, mat(x, 0.009, z, -PI / 2, 0, 0.05), [k / 4, 0, (k + 1) / 4, 1]));

  // ---- walls: upright planks with gaps, a horizontal-board wainscot, posts and nails ----
  const WT = ['#A27650', '#9A6E48', '#AA7E56', '#946A45', '#A67B52'];
  for (const f of wallFaces(room)) {
    if (f.top > 1.1) for (let a = f.a0, i = 0; a < f.a1 - 0.02; a += 0.24, i++) {
      const a1 = Math.min(f.a1, a + 0.24) - 0.012;
      const pc = tone(pick(WT, i * 1.7 + a), 0.96 + rnd(i + 3) * 0.08);
      // no plank (and so no plank outline) behind a window's painted view: it showed as rain-like streaks
      const behindWin = f.face === 'back' && WH.windows.some((wx) => a1 > wx - 0.64 && a < wx + 0.64);
      if (behindWin) {
        wbox(v, room, f.face, a + 0.006, a1, 1.06, WH.winY - 0.38, 0.014, pc);
        wbox(v, room, f.face, a + 0.006, a1, WH.winY + 0.38, f.top, 0.014, pc);
      } else wbox(v, room, f.face, a + 0.006, a1, 1.06, f.top, 0.014, pc);
      wbox(v, room, f.face, (a + a1) / 2 - 0.012, (a + a1) / 2 + 0.012, 1.25, 1.28, 0.022, '#4A3B30');
      if (f.top > 2.5) wbox(v, room, f.face, (a + a1) / 2 - 0.012, (a + a1) / 2 + 0.012, f.top - 0.22, f.top - 0.19, 0.022, '#4A3B30');
    }
    const wt = Math.min(0.98, f.top);
    for (let y = 0.14, j = 0; y < wt - 0.05; y += 0.21, j++) wbox(v, room, f.face, f.a0, f.a1, y + 0.01, Math.min(wt, y + 0.2), 0.012, tone(WALL_D, 0.92 + rnd(j * 3 + f.a0) * 0.16));
  }
  for (const x of [-3.45, -1.05, 1.05, 3.45]) v.boxMin(x - 0.09, 0, -hd, x + 0.09, H, -hd + 0.1, tone(WALL_D, 0.9));
  for (const z of [-3.2, -1.0]) for (const sx of [-1, 1]) v.boxMin(sx > 0 ? hw - 0.1 : -hw, 0, z - 0.09, sx > 0 ? hw : -hw + 0.1, z < -0.5 ? H : H * 0.62, z + 0.09, tone(WALL_D, 0.9));
  v.boxMin(-hw, H - 0.42, -hd, hw, H - 0.3, -hd + 0.14, tone(WALL_D, 0.85)); // wall plate under the eaves

  // ---- two high back windows: plank shutters folded open, a painted sky with a mast ----
  const WIN = A.region(512, 384, 320, 176);
  A.paint(WIN, (g, w, h) => {
    sky(g, w, h, '#9FC6E2', '#FBE3C0');
    cloud(g, w * 0.3, h * 0.35, 34);
    cloud(g, w * 0.82, h * 0.2, 22, '#FFF3E2');
    g.fillStyle = '#6B4A30';
    g.fillRect(w * 0.62, h * 0.18, 6, h);
    g.fillRect(w * 0.5, h * 0.42, w * 0.26, 5);
    g.fillStyle = '#E9DCC0';
    g.fillRect(w * 0.51, h * 0.47, w * 0.24, 14);
    g.fillStyle = '#C8323C';
    g.beginPath(); g.moveTo(w * 0.62 + 6, h * 0.18); g.lineTo(w * 0.72, h * 0.22); g.lineTo(w * 0.62 + 6, h * 0.27); g.fill();
    g.strokeStyle = '#4A3B30'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(w * 0.15, h * 0.62); g.lineTo(w * 0.19, h * 0.57); g.lineTo(w * 0.23, h * 0.62); g.stroke();
    g.beginPath(); g.moveTo(w * 0.3, h * 0.7); g.lineTo(w * 0.33, h * 0.66); g.lineTo(w * 0.36, h * 0.7); g.stroke();
    fill(g, 0, h * 0.86, w, h * 0.14, '#C9A576');
    for (let i = 0; i < 8; i++) fill(g, i * w / 8 + 4, h * 0.86, w / 8 - 8, 6, '#B08A58');
  });
  const WW = 1.1, WHh = 0.6;
  const winLook = [];
  for (const wx of WH.windows) {
    const y = WH.winY, z = -hd;
    A.quad(WIN, WW, WHh, mat(wx, y, z + 0.03));
    dusk.quad(WW, WHh, mat(wx, y, z + 0.035), '#24304A');
    const F = '#5E3E26';
    v.boxMin(wx - WW / 2 - 0.08, y - WHh / 2 - 0.08, z, wx + WW / 2 + 0.08, y - WHh / 2, z + 0.12, F);
    v.boxMin(wx - WW / 2 - 0.08, y + WHh / 2, z, wx + WW / 2 + 0.08, y + WHh / 2 + 0.08, z + 0.12, F);
    v.boxMin(wx - WW / 2 - 0.08, y - WHh / 2, z, wx - WW / 2, y + WHh / 2, z + 0.12, F);
    v.boxMin(wx + WW / 2, y - WHh / 2, z, wx + WW / 2 + 0.08, y + WHh / 2, z + 0.12, F);
    v.boxMin(wx - 0.025, y - WHh / 2, z, wx + 0.025, y + WHh / 2, z + 0.07, F);
    v.boxMin(wx - WW / 2 - 0.14, y - WHh / 2 - 0.13, z, wx + WW / 2 + 0.14, y - WHh / 2 - 0.07, z + 0.2, tone(F, 1.15)); // sill
    for (const sx of [-1, 1]) {
      const x0 = wx + sx * (WW / 2 + 0.1), x1 = x0 + sx * WW / 2;
      for (let k = 0; k < 3; k++) v.boxMin(Math.min(x0, x1) + k * WW / 6 + 0.006, y - WHh / 2, z + 0.02, Math.min(x0, x1) + (k + 1) * WW / 6 - 0.006, y + WHh / 2, z + 0.06, tone('#8A6040', 0.95 + k * 0.05));
      v.boxMin(Math.min(x0, x1), y + 0.12, z + 0.06, Math.max(x0, x1), y + 0.17, z + 0.075, '#4A3B30'); // hinge strap
      v.boxMin(Math.min(x0, x1), y - 0.17, z + 0.06, Math.max(x0, x1), y - 0.12, z + 0.075, '#4A3B30');
    }
    // a bird's nest of straw on the left sill, a chipped cup on the right one (lived in)
    if (wx < 0) { prism(v, wx - 0.35, y - WHh / 2 - 0.02, z + 0.12, 0.1, 0.07, 0.05, '#B89A5A', 8); prism(v, wx - 0.35, y - WHh / 2 + 0.0, z + 0.12, 0.06, 0.06, 0.02, '#8C7444', 8); }
    else tinCup(v, wx + 0.38, y - WHh / 2 - 0.07, z + 0.12, '#E9DFC9');
    // a slanting beam of daylight to the floor, motes in it
    shafts.quad(WW * 1.15, 3.4, mat(wx * 0.82, 1.45, -hd + 1.2, -0.62, 0, 0), '#FFE9B0');
    shafts.pool(wx * 0.7, -hd + 2.2, 0.8, 0.5, '#FFE2A0', 0.011);
    winLook.push({ x: wx, y, z });
  }
  // rain on the window glass (hidden until setRain)
  const rainDrops = [];
  for (const w of winLook) for (let i = 0; i < 7; i++) {
    const p = dyn.part();
    dyn.box(p, 0, 0, 0, 0.012, 0.11, 0.006, '#DCEBF5');
    rainDrops.push({ p, x: w.x - WW / 2 + 0.08 + rnd(i * 4.3 + w.x) * (WW - 0.16), y0: w.y + WHh / 2 - 0.04, y1: w.y - WHh / 2 + 0.05, z: w.z + 0.05, o: rnd(i * 2.9 + w.x) });
  }

  // ---- the beam scale: post to the roof, gantry arm, hanger; beam and platform move (settle) ----
  const PZ = WH.post.z, SZ = WH.plat.z, PY = WH.pivotY;
  const DW = '#5E3E26', IRON = '#3E3530', BRASS = '#C9A24A', BRASS_D = '#9C7A30';
  v.boxMin(-0.2, 0, PZ - 0.2, 0.2, 0.22, PZ + 0.2, tone(DW, 0.85)); // plinth
  v.boxMin(-0.115, 0.22, PZ - 0.115, 0.115, H, PZ + 0.115, DW);
  for (const y of [0.32, 1.02, 2.3]) v.boxMin(-0.125, y, PZ - 0.125, 0.125, y + 0.05, PZ + 0.125, IRON);
  v.boxMin(-0.1, H - 0.2, -hd, 0.1, H - 0.04, PZ + 0.1, tone(DW, 1.05)); // joist to the back wall
  seg(v, 0, H - 0.75, -hd + 0.05, 0, H - 0.2, PZ - 0.08, 0.09, tone(DW, 0.95)); // knee brace
  v.boxMin(-0.09, 2.96, PZ, 0.09, 3.1, SZ + 0.12, tone(DW, 1.08)); // gantry arm
  seg(v, 0, 2.25, PZ + 0.1, 0, 2.98, PZ + 0.85, 0.08, tone(DW, 0.95)); // its brace
  for (const z of [PZ + 0.45, SZ - 0.2]) v.boxMin(-0.1, 2.94, z, 0.1, 3.12, z + 0.04, IRON);
  v.boxMin(-0.035, PY + 0.05, SZ - 0.035, 0.035, 2.96, SZ + 0.035, IRON); // hanger strap
  v.boxMin(-0.13, PY + 0.12, SZ + 0.04, 0.13, PY + 0.3, SZ + 0.06, BRASS); // level plate with ticks
  for (let i = -3; i <= 3; i++) v.boxMin(i * 0.035 - 0.006, PY + 0.2 + (i === 0 ? -0.04 : 0), SZ + 0.06, i * 0.035 + 0.006, PY + 0.28, SZ + 0.068, i === 0 ? P.maroon : '#4A3B30');
  // lamp bar across the post, two hurricane lamps over the scale
  v.boxMin(-1.45, 3.0, PZ - 0.06, 1.45, 3.1, PZ + 0.06, tone(DW, 1.05));
  const lamps = [];
  for (const sx of [-1, 1]) {
    const lx = sx * 1.3, ly = 2.32, lz = PZ;
    v.boxMin(lx - 0.008, ly + 0.42, lz - 0.008, lx + 0.008, 3.0, lz + 0.008, '#4A3B30');
    lantern(v, lx, ly, lz, 1.05);
    glow.halo(lx, ly + 0.17, lz + 0.12, 0.62, '#FFC970');
    glow.pool(lx * 0.8, lz + 1.7, 1.25, 0.95, '#FFB65A');
    const fl = dyn.part();
    dyn.box(fl, 0, 0, 0, 0.035, 0.07, 0.035, '#FFB53A');
    dyn.box(fl, 0, 0.03, 0, 0.018, 0.04, 0.018, '#FFF1B8');
    lamps.push({ fl, x: lx, y: ly + 0.15, z: lz });
  }
  // the painted line on the post
  const SIGN = A.region(0, 0, 512, 176);
  A.paint(SIGN, (g, w, h) => {
    fill(g, 0, 0, w, h, '#EFE3C4');
    fill(g, 8, 8, w - 16, h - 16, '#F6EEDB');
    g.strokeStyle = '#A47A2C'; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28);
    say(g, 'ချိန်ခွင် စစ်ချင်သူ', w / 2, 58, 50, '#6E1F2A');
    say(g, 'စစ်နိုင်ပါတယ်', w / 2, 112, 46, '#6E1F2A');
    say(g, 'Anyone may check the scale', w / 2, 152, 22, '#7A5434', { weight: 600, font: FONT_SERIF });
  });
  v.boxMin(-0.56, 1.0, PZ + 0.115, 0.56, 1.42, PZ + 0.15, '#7A5434');
  A.quad(SIGN, 1.04, 0.36, mat(0, 1.21, PZ + 0.155));
  for (const x of [-0.47, 0.47]) v.box(x, 1.21, PZ + 0.158, 0.03, 0.03, 0.01, '#3E3530');

  // the moving parts: beam (pivot) and platform (hangs from the hook)
  const beam = new THREE.Group();
  beam.position.set(0, PY, SZ);
  const bv = new VoxelBuilder();
  bv.boxMin(-0.55, -0.04, -0.035, 1.85, 0.04, 0.035, BRASS);
  bv.boxMin(-0.55, 0.035, -0.04, 1.85, 0.05, 0.04, tone(BRASS, 1.15));
  for (let x = 0.2; x < 1.8; x += 0.12) bv.box(x, 0.0, 0.037, 0.012, 0.05, 0.006, '#4A3B30');
  bv.box(0, 0, 0, 0.1, 0.12, 0.1, BRASS_D); // pivot block
  bv.box(0, 0.12, 0.0, 0.016, 0.18, 0.016, P.maroon); // pointer
  bv.box(-0.57, 0, 0, 0.06, 0.12, 0.09, BRASS_D);
  prism(bv, 1.9, 0, 0, 0.07, 0.07, 0.1, BRASS_D, 8, 0, PI / 2);
  bv.box(WH.hookX, -0.08, 0, 0.03, 0.1, 0.03, IRON); // load hook
  ring(bv, WH.hookX, -0.16, 0, 0.045, 0.018, IRON, 'xy', 8);
  // the poise weight (slides on the long arm), pear-shaped
  bv.box(1.2, -0.06, 0, 0.05, 0.1, 0.09, IRON);
  prism(bv, 1.2, -0.17, 0, 0.06, 0.09, 0.08, BRASS_D, 8);
  prism(bv, 1.2, -0.26, 0, 0.1, 0.06, 0.1, BRASS, 8);
  prism(bv, 1.2, -0.33, 0, 0.06, 0.1, 0.05, BRASS_D, 8);
  beam.add(bv.mesh({ px: 1.4 }));
  beam.userData.dynamic = true;
  beam.traverse((o) => { o.userData.dynamic = true; });
  room.group.add(beam);

  const platform = new THREE.Group();
  platform.position.set(0, 0, SZ);
  const pv = new VoxelBuilder();
  const S2 = WH.plat.s / 2;
  pv.boxMin(-S2, 0.03, -S2, S2, 0.09, S2, tone(DW, 0.9)); // frame
  for (let i = 0; i < 6; i++) pv.boxMin(-S2 + 0.05 + i * (WH.plat.s - 0.1) / 6 + 0.008, 0.09, -S2 + 0.05, -S2 + 0.05 + (i + 1) * (WH.plat.s - 0.1) / 6 - 0.008, 0.15, S2 - 0.05, tone('#B58A5A', 0.94 + rnd(i + 1) * 0.14));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    pv.boxMin(sx * S2 - (sx > 0 ? 0.14 : 0), 0.05, sz * S2 - (sz > 0 ? 0.14 : 0), sx * S2 + (sx > 0 ? 0 : 0.14), 0.165, sz * S2 + (sz > 0 ? 0 : 0.14), IRON);
    ring(pv, sx * (S2 - 0.07), 0.2, sz * (S2 - 0.07), 0.035, 0.016, IRON, 'xy', 6);
    chain(pv, sx * (S2 - 0.07), 0.23, sz * (S2 - 0.07), WH.hookX, PY - 0.2, 0, IRON);
  }
  ring(pv, WH.hookX, PY - 0.19, 0, 0.06, 0.022, IRON, 'xz', 8);
  pv.boxMin(-S2 + 0.1, 0.152, S2 - 0.16, S2 - 0.1, 0.156, S2 - 0.12, '#D9B45A'); // brass edge strip
  platform.add(pv.mesh({ px: 1.4 }));
  platform.traverse((o) => { o.userData.dynamic = true; });
  room.group.add(platform);
  solid(room, 0, SZ, WH.plat.s, WH.plat.s, 0.06);
  solid(room, 0, PZ, 0.4, 0.4);
  const scale = { level: 0, ang: 0, vel: 0, platform, beam };
  scale.settle = (level = 0) => { scale.level = Math.max(-1, Math.min(1, level)); };
  scale.kick = (k = 1) => { scale.vel += 0.6 * k; };
  tick.push((dt) => {
    const target = scale.level * 0.12;
    scale.vel += (target - scale.ang) * 26 * dt;
    scale.vel *= Math.exp(-3.2 * dt);
    scale.ang += scale.vel * dt;
    beam.rotation.z = scale.ang;
    platform.position.y = WH.hookX * Math.sin(scale.ang);
  });

  // ---- check weights: open box on a stand, brass weights and two bird-shaped viss weights ----
  {
    const s = new VoxelBuilder();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) s.box(sx * 0.26, 0.38, sz * 0.16, 0.06, 0.76, 0.06, DW);
    s.boxMin(-0.3, 0.74, -0.2, 0.3, 0.8, 0.2, tone(DW, 1.12));
    s.boxMin(-0.27, 0.22, -0.17, 0.27, 0.26, 0.17, tone(DW, 1.05)); // low shelf
    s.boxMin(-0.2, 0.26, -0.1, 0.06, 0.29, 0.12, '#E9DCC0'); // polishing cloth
    prism(s, 0.15, 0.3, 0.02, 0.05, 0.05, 0.08, '#C8323C', 8); // polish tin
    // the box
    s.boxMin(-0.25, 0.8, -0.15, 0.25, 0.94, 0.15, '#7A4A2A');
    s.boxMin(-0.23, 0.9, -0.13, 0.23, 0.945, 0.13, P.maroonDeep); // felt
    rbox(s, 0, 1.03, -0.21, 0.5, 0.025, 0.3, '#7A4A2A', 1.15, 0, 0); // lid leaning back
    rbox(s, 0, 1.035, -0.195, 0.44, 0.012, 0.25, P.maroon, 1.15, 0, 0);
    [[-0.17, 0.06, 0.05], [-0.07, 0.05, 0.045], [0.02, 0.042, 0.04], [0.1, 0.034, 0.035], [0.17, 0.026, 0.03]].forEach(([x, r, h], i) => {
      prism(s, x, 0.945 + h / 2, -0.02, r, r, h, i % 2 ? BRASS : tone(BRASS, 1.1), 8);
      s.box(x, 0.945 + h + 0.012, -0.02, r * 0.6, 0.024, r * 0.6, BRASS_D);
    });
    v.merge(s, mat(WH.check.x, 0, WH.check.z));
    const b2 = new VoxelBuilder();
    // the bird weights stand on a floor block beside the stand
    b2.boxMin(-0.18, 0, -0.13, 0.18, 0.12, 0.13, tone(DW, 0.95));
    v.merge(b2, mat(WH.check.x + 0.5, 0, WH.check.z + 0.05));
    // two bird-shaped viss weights on the block
    const bs = new VoxelBuilder();
    const birdAt = (x, z, k) => {
      bs.box(x, 0.135, z, 0.12 * k, 0.03, 0.08 * k, BRASS_D);
      bs.box(x, 0.18 * k + 0.02, z, 0.11 * k, 0.09 * k, 0.07 * k, BRASS);
      bs.box(x + 0.06 * k, 0.25 * k + 0.02, z, 0.055 * k, 0.065 * k, 0.05 * k, tone(BRASS, 1.08));
      bs.box(x + 0.1 * k, 0.25 * k + 0.02, z, 0.035 * k, 0.018, 0.022, BRASS_D);
      rbox(bs, x - 0.065 * k, 0.22 * k + 0.02, z, 0.06 * k, 0.03, 0.05 * k, tone(BRASS, 1.12), 0, 0, 0.75);
    };
    birdAt(-0.07, 0, 1.15);
    birdAt(0.09, 0.02, 0.85);
    v.merge(bs, mat(WH.check.x + 0.5, 0, WH.check.z + 0.05));
    solid(room, WH.check.x + 0.18, WH.check.z, 0.98, 0.42);
  }

  // ---- tally board (slate): porters' loads in chalk, Daw Sanda twice (two shifts) ----
  const TAL = A.region(512, 0, 512, 384);
  // v2: 1.3× larger, a darker slate and full-strength chalk so it reads at 412 px without a zoom station
  A.paint(TAL, (g, w, h) => {
    slate(g, w, h, '#1F2A25');
    const CH = '#FFFDF4';
    say(g, 'ဒီနေ့ ထမ်းသူများ', w / 2, 40, 44, CH);
    g.fillStyle = CH;
    g.fillRect(36, 68, w - 72, 5);
    const rows = [['ကိုအောင်မြင့်', '၁၂'], ['ဒေါ်စန္ဒာ (မနက်)', '၁၄'], ['ကိုဇော်', '၉'], ['ဦးထွန်း', '၁၁'], ['ဒေါ်စန္ဒာ (ညနေ)', day >= 6 ? '၆' : '၃']];
    rows.forEach(([n, c], i) => {
      const y = 108 + i * 56;
      const sanda = n.startsWith('ဒေါ်စန္ဒာ');
      say(g, n, 30, y, 30, sanda ? '#FFE27A' : CH, { align: 'left', max: 236 });
      say(g, c, w - 26, y, 38, CH, { align: 'right' });
      const k = parseInt(c.replace(/[၀-၉]/g, (d) => d.charCodeAt(0) - 0x1040), 10) || 0;
      g.fillStyle = CH;
      for (let t = 0; t < Math.min(10, k); t++) {
        const x = 286 + (t % 5) * 13 + Math.floor(t / 5) * 82;
        if (t % 5 === 4) { g.save(); g.translate(x - 26, y); g.rotate(-1.0); g.fillRect(-2.5, -24, 5, 50); g.restore(); }
        else g.fillRect(x - 2.5, y - 17, 5, 34);
      }
    });
  });
  {
    const tx = WH.tally.x, ty = WH.tally.y, z = -hd, bw = 1.56, bh = 1.17;
    v.boxMin(tx - bw / 2 - 0.08, ty - bh / 2 - 0.08, z, tx + bw / 2 + 0.08, ty + bh / 2 + 0.08, z + 0.06, '#7A5434');
    v.boxMin(tx - bw / 2 - 0.08, ty + bh / 2 + 0.02, z + 0.06, tx + bw / 2 + 0.08, ty + bh / 2 + 0.08, z + 0.08, tone('#7A5434', 1.18)); // lit top rail
    v.boxMin(tx - bw / 2, ty - bh / 2, z + 0.06, tx + bw / 2, ty + bh / 2, z + 0.07, '#1F2A25');
    A.quad(TAL, bw, bh, mat(tx, ty, z + 0.075));
    v.boxMin(tx - bw / 2 - 0.06, ty - bh / 2 - 0.15, z, tx + bw / 2 + 0.06, ty - bh / 2 - 0.08, z + 0.16, '#8A6040'); // chalk ledge
    for (const [dx, c] of [[-0.5, '#F4F1E6'], [-0.42, '#F4F1E6'], [-0.15, '#F2D27A']]) v.box(tx + dx, ty - bh / 2 - 0.065, z + 0.1, 0.07, 0.025, 0.025, c);
    v.boxMin(tx + 0.3, ty - bh / 2 - 0.08, z + 0.05, tx + 0.54, ty - bh / 2 - 0.03, z + 0.14, '#D8CDB6'); // rag
    for (let i = 0; i < 12; i++) v.box(tx - 0.6 + rnd(i + 31) * 1.2, 0.006, z + 0.17 + rnd(i + 17) * 0.28, 0.04, 0.004, 0.03, '#E9E5D8');
  }

  // ---- the jetty-tag chart on the back wall, left (so porters match a tag to a jetty) ----
  const CH = A.region(0, 496, 512, 320);
  const TAG = { duck: A.region(512, 640, 128, 128), fish: A.region(640, 640, 128, 128), rice: A.region(768, 640, 128, 128), wood: A.region(896, 640, 128, 128) };
  for (const k of Object.keys(TAG)) A.paint(TAG[k], (g, w, h) => tagCard(g, w, h, ICON[k]));
  A.paint(CH, (g, w, h) => {
    ledgerPaper(g, w, h, { rule: 30, cols: [] });
    say(g, 'ဆိပ်တံဆိပ်များ', w / 2, 34, 36, '#6E1F2A');
    const rows = [['duck', 'ဘဲဆိပ်'], ['fish', 'ငါးဆိပ်'], ['rice', 'ဆန်ဆိပ်'], ['wood', 'ထင်းဆိပ်']];
    rows.forEach(([k, name], i) => {
      const x = (i % 2) * (w / 2) + 30, y = 80 + Math.floor(i / 2) * 116;
      g.save(); g.translate(x + 50, y + 44); ICON[k](g, 30); g.restore();
      say(g, name, x + 150, y + 44, 32, '#2A2118', { align: 'left' });
    });
  });
  {
    const cx = -2.35, cy = 1.62, z = -hd;
    v.boxMin(cx - 0.52, cy - 0.34, z, cx + 0.52, cy + 0.34, z + 0.04, '#7A5434');
    A.quad(CH, 0.96, 0.6, mat(cx, cy, z + 0.045));
    v.box(cx, cy + 0.36, z + 0.05, 0.04, 0.04, 0.02, '#3E3530');
  }

  // ---- clerk's high stand (the weights book, public), turned to face the room ----
  {
    const s = new VoxelBuilder();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) s.box(sx * 0.4, 0.5, sz * 0.24, 0.07, 1.0, 0.07, DW);
    s.boxMin(-0.42, 0.3, -0.26, 0.42, 0.34, 0.26, tone(DW, 1.1)); // shelf
    s.boxMin(-0.42, 0.08, -0.26, 0.42, 0.12, -0.2, DW);
    rbox(s, 0, 1.06, 0.03, 0.9, 0.05, 0.5, '#8A6040', 0.28, 0, 0); // slanted top
    s.boxMin(-0.46, 1.1, -0.3, 0.46, 1.16, -0.2, '#8A6040'); // flat back strip
    rbox(s, 0, 0.98, 0.29, 0.9, 0.05, 0.03, tone(DW, 1.1), 0.28, 0, 0); // pen lip
    // ledgers on the shelf, an abacus
    [[-0.3, '#6E1F2A'], [-0.18, '#2F5DB3'], [-0.06, '#3E6B4F'], [0.06, '#6E1F2A']].forEach(([x, c], i) => s.boxMin(x, 0.34, -0.2, x + 0.1, 0.34 + 0.24 - i * 0.02, 0.18, c));
    s.boxMin(0.14, 0.34, -0.12, 0.4, 0.38, 0.2, '#7A4A2A');
    for (let r = 0; r < 4; r++) {
      s.box(0.27, 0.39, -0.08 + r * 0.08, 0.24, 0.008, 0.008, '#4A3B30');
      for (let b = 0; b < 5; b++) s.box(0.17 + b * 0.04 + (b > 1 ? 0.03 : 0), 0.395, -0.08 + r * 0.08, 0.03, 0.03, 0.03, b < 2 ? '#C8323C' : '#2A2118');
    }
    // ink pot, pen, a cup of tea gone cold on the strip
    prism(s, 0.3, 1.19, -0.25, 0.04, 0.045, 0.06, '#24304A', 8);
    rbox(s, 0.16, 1.18, -0.25, 0.16, 0.01, 0.01, '#2A2118', 0, 0.4, 0);
    tinCup(s, -0.32, 1.16, -0.25, '#E9DFC9');
    v.merge(s, mat(WH.stand.x, 0, WH.stand.z, 0, -PI / 2, 0));
    // the open book on the slant: covers + two atlas pages
    const top = new THREE.Matrix4().multiplyMatrices(mat(WH.stand.x, 0, WH.stand.z, 0, -PI / 2, 0), mat(0, 1.095, 0.03, -PI / 2 + 0.28, 0, 0));
    const bk = new VoxelBuilder();
    bk.boxMin(-0.36, -0.22, -0.002, 0.36, 0.22, 0.02, P.maroon);
    bk.boxMin(-0.34, -0.2, 0.02, 0.34, 0.2, 0.035, '#EFE4CB');
    v.merge(bk, top);
    const BOOK = A.region(0, 176, 512, 320);
    A.paint(BOOK, (g, w, h) => {
      ledgerPaper(g, w / 2, h, { rule: 24, cols: [0.62, 0.82] });
      g.save(); g.translate(w / 2, 0); ledgerPaper(g, w / 2, h, { rule: 24, cols: [0.62, 0.82] }); g.restore();
      g.fillStyle = 'rgba(60,40,20,0.35)'; g.fillRect(w / 2 - 3, 0, 6, h);
      const lines = [['ဘဲဆိပ်', '၃'], ['ငါးဆိပ်', '၅'], ['ကုန်သည် သေတ္တာ', '၂၄'], ['ကလေး အထုပ်', '၁'], ['ဆန်အိတ်', '၁၂'], ['ထင်း', '၈'], ['ဘဲဆိပ်', '၆'], ['ပဲအိတ်', '၄']];
      lines.forEach(([n, q], i) => {
        const page = i < 4 ? 0 : 1, k = i % 4;
        const x0 = page * w / 2, y = 62 + k * 62;
        say(g, n, x0 + 50, y, 26, '#2A2118', { align: 'left', weight: 400 });
        say(g, q, x0 + w / 2 * 0.74, y, 26, '#2F3F8A', { weight: 400 });
        say(g, 'ရပြီ', x0 + w / 2 * 0.9, y, 18, '#6E1F2A', { weight: 400 });
      });
      say(g, 'အလေးချိန် စာရင်း', w * 0.25, 26, 24, '#6E1F2A');
    });
    A.quad(BOOK, 0.66, 0.38, new THREE.Matrix4().multiplyMatrices(top, mat(0, 0, 0.037)));
    solid(room, WH.stand.x, WH.stand.z, 0.56, 0.9);
  }

  // ---- left wall: Day 6+ the porters' bench, rope rack and Nay Chi's seat (INDEX 13.2: Day 6's dressing);
  //      Day 5 a pallet of folded empty sacks. Always: conical hats, a yoke with baskets, a big hawser coil ----
  const rx = -hw + 0.04;
  if (day >= 6) {
    const s = new VoxelBuilder();
    const L = WH.bench.z1 - WH.bench.z0;
    s.boxMin(-L / 2, 0.36, -0.21, L / 2, 0.42, 0.21, '#9A6E48');
    s.boxMin(-L / 2, 0.36, 0.17, L / 2, 0.42, 0.21, tone('#9A6E48', 1.12));
    for (const x of [-L / 2 + 0.15, 0, L / 2 - 0.15]) {
      s.box(x, 0.18, -0.13, 0.07, 0.36, 0.07, DW);
      s.box(x, 0.18, 0.13, 0.07, 0.36, 0.07, DW);
      s.box(x, 0.1, 0, 0.06, 0.05, 0.32, DW);
    }
    s.boxMin(-L / 2 + 0.1, 0.42, -0.15, -L / 2 + 0.45, 0.47, 0.1, '#E9DCC0'); // folded towel
    tinCup(s, -L / 2 + 0.6, 0.42, 0.05, '#B9B7AE');
    v.merge(s, mat(WH.bench.x + 0.05, 0, (WH.bench.z0 + WH.bench.z1) / 2, 0, PI / 2, 0));
    solid(room, WH.bench.x + 0.05, (WH.bench.z0 + WH.bench.z1) / 2, 0.42, L, 0.04);
    // slippers under the bench
    for (const [z, c] of [[-1.25, '#2A2118'], [-0.45, '#2F5DB3'], [0.35, '#C8323C']]) for (const dz of [-0.06, 0.06]) v.boxMin(-3.15, 0, z + dz - 0.045, -2.87, 0.025, z + dz + 0.045, c);
    // Nay Chi's seat at the bench's front end: a folded sack for a cushion, her cloth bundle by her feet
    v.boxMin(-3.78, 0.42, 0.02, -3.36, 0.47, 0.42, '#D2B285');
    v.boxMin(-3.76, 0.47, 0.05, -3.38, 0.49, 0.39, tone('#D2B285', 1.08));
    v.boxMin(-3.3, 0, 0.42, -3.02, 0.16, 0.66, '#D97C8A');
    v.boxMin(-3.2, 0.16, 0.48, -3.12, 0.22, 0.6, tone('#D97C8A', 0.8)); // knot
    // rope rack: a rail with pegs, three coils hanging (the middle one is where Day 6's slate catches)
    v.boxMin(rx, 1.55, -1.95, rx + 0.07, 1.68, -0.05, '#7A5434');
    for (const z of [-1.6, -1.0, -0.4]) v.boxMin(rx + 0.07, 1.58, z - 0.025, rx + 0.2, 1.63, z + 0.025, '#5E3E26');
    ring(v, rx + 0.14, 1.36, -1.6, 0.2, 0.05, '#C9A576', 'yz', 12);
    ring(v, rx + 0.17, 1.38, -1.6, 0.18, 0.045, '#B8935F', 'yz', 12);
    ring(v, rx + 0.14, 1.28, -1.0, 0.27, 0.055, '#A8834F', 'yz', 12);
    ring(v, rx + 0.18, 1.3, -1.0, 0.24, 0.05, '#BE9966', 'yz', 12);
    ring(v, rx + 0.14, 1.4, -0.4, 0.16, 0.04, '#D3B07A', 'yz', 10);
    seg(v, rx + 0.16, 1.2, -0.42, rx + 0.2, 0.62, -0.3, 0.04, '#D3B07A'); // a loose tail
  } else {
    // Day 5: a low pallet against the left wall with folded empty sacks, twine ball and a sack needle
    const s = new VoxelBuilder();
    s.boxMin(-0.42, 0, -0.95, 0.42, 0.1, 0.95, tone(DW, 1.1));
    for (let i = 0; i < 6; i++) s.boxMin(-0.42, 0.1, -0.95 + i * 0.32 + 0.02, 0.42, 0.13, -0.95 + (i + 1) * 0.32 - 0.02, tone('#9A6E48', 0.95 + rnd(i + 70) * 0.12));
    const SK = ['#C9A576', '#BC9868', '#D2B285', '#B58E5E'];
    for (const [z0, n] of [[-0.85, 5], [0.08, 3]]) for (let k = 0; k < n; k++) {
      const c = pick(SK, k + z0 * 7);
      s.boxMin(-0.34 + (k % 2) * 0.03, 0.13 + k * 0.06, z0 + (k % 3) * 0.02, 0.34 + (k % 2) * 0.03, 0.18 + k * 0.06, z0 + 0.72 + (k % 3) * 0.02, c);
      s.boxMin(-0.3 + (k % 2) * 0.03, 0.18 + k * 0.06, z0 + 0.04, 0.3 + (k % 2) * 0.03, 0.185 + k * 0.06, z0 + 0.68, tone(c, 1.1));
    }
    prism(s, 0.1, 0.38, 0.4, 0.09, 0.09, 0.14, '#C2A070', 8); // twine ball
    seg(s, 0.1, 0.32, 0.48, 0.36, 0.0, 0.7, 0.02, '#C2A070');
    rbox(s, -0.12, 0.505, -0.4, 0.22, 0.012, 0.016, '#8E9A9C', 0, 0.5, 0); // sack needle
    v.merge(s, mat(-3.5, 0, -0.75));
    solid(room, -3.5, -0.75, 0.84, 1.9, 0.04);
    // a single peg with a coil on it (the rack comes later)
    v.boxMin(rx, 1.58, -1.02, rx + 0.2, 1.63, -0.98, '#5E3E26');
    ring(v, rx + 0.14, 1.32, -1.0, 0.25, 0.055, '#BE9966', 'yz', 12);
  }
  {
    // conical hats on pegs
    for (const [z, y] of [[-2.65, 1.75], [-3.25, 1.62]]) {
      v.boxMin(rx, y + 0.1, z - 0.02, rx + 0.12, y + 0.14, z + 0.02, '#5E3E26');
      prism(v, rx + 0.1, y, z, 0.012, 0.3, 0.14, '#D9C18A', 10, 0, -PI / 2);
      prism(v, rx + 0.04, y, z, 0.3, 0.3, 0.02, '#B89A5A', 10, 0, -PI / 2);
    }
    // a carrying yoke and two baskets in the back-left corner
    prism(v, -3.55, 0.17, -3.55, 0.26, 0.2, 0.34, '#B89A5A', 10);
    prism(v, -3.55, 0.35, -3.55, 0.27, 0.27, 0.03, '#8C7444', 10);
    prism(v, -3.05, 0.15, -3.62, 0.22, 0.18, 0.3, '#C6A868', 10);
    prism(v, -3.05, 0.31, -3.62, 0.23, 0.23, 0.03, '#8C7444', 10);
    seg(v, -3.9, 2.0, -3.85, -3.3, 0.02, -3.2, 0.05, '#C9B66A'); // bamboo pole leaning
    for (let k = 0; k < 4; k++) { const u = 0.15 + k * 0.22; v.box(-3.9 + 0.6 * u, 2.0 - 1.98 * u, -3.85 + 0.65 * u, 0.065, 0.025, 0.065, '#A89650'); }
    solid(room, -3.3, -3.55, 0.85, 0.6);
    // hawser coil on the floor
    for (let k = 0; k < 4; k++) ring(v, -2.45, 0.04 + k * 0.07, -3.5, 0.38 - k * 0.02, 0.07, k % 2 ? '#B8935F' : '#A8834F', 'xz', 14);
    ring(v, -2.45, 0.04, -3.5, 0.22, 0.07, '#9C784A', 'xz', 10);
    seg(v, -2.1, 0.06, -3.35, -1.75, 0.03, -3.0, 0.07, '#B8935F');
    solidCircle(room, -2.45, -3.5, 0.4);
  }

  // ---- right wall: porters' tea corner, calendar, broom; front half: sacks and crates with jetty tags ----
  {
    // tea stool with a kettle and glasses
    const s = new VoxelBuilder();
    s.boxMin(-0.3, 0.42, -0.22, 0.3, 0.48, 0.22, '#8A6040');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) s.box(sx * 0.24, 0.21, sz * 0.16, 0.05, 0.42, 0.05, DW);
    prism(s, -0.08, 0.57, 0, 0.11, 0.13, 0.17, '#3E3530', 8);
    prism(s, -0.08, 0.67, 0, 0.06, 0.1, 0.04, '#4A3B30', 8);
    s.box(-0.08, 0.71, 0, 0.04, 0.03, 0.04, P.gold);
    seg(s, 0.03, 0.56, 0, 0.13, 0.66, 0, 0.03, '#3E3530'); // spout
    seg(s, -0.18, 0.68, 0, -0.08, 0.8, 0, 0.018, '#4A3B30');
    seg(s, 0.02, 0.68, 0, -0.08, 0.8, 0, 0.018, '#4A3B30');
    for (const [x, z] of [[0.16, 0.1], [0.2, -0.08], [0.08, -0.14]]) { prism(s, x, 0.53, z, 0.035, 0.03, 0.09, '#E6EEF0', 8); prism(s, x, 0.51, z, 0.03, 0.028, 0.05, '#B5643C', 8); }
    v.merge(s, mat(3.45, 0, -2.55, 0, -PI / 2, 0));
    solid(room, 3.45, -2.55, 0.44, 0.6);
    // broom in the corner, a bucket
    seg(v, 3.82, 0.06, -3.6, 3.7, 1.55, -3.85, 0.04, '#8A6040');
    for (let k = 0; k < 7; k++) seg(v, 3.82, 0.32, -3.6, 3.74 + (k - 3) * 0.035, 0.0, -3.5 + (k % 2) * 0.05, 0.03, '#C9B66A');
    prism(v, 3.3, 0.16, -3.55, 0.17, 0.14, 0.32, '#8E9A9C', 10);
    prism(v, 3.3, 0.31, -3.55, 0.17, 0.17, 0.02, '#B9C3C5', 10);
    // calendar on the right wall
    const CAL = A.region(832, 384, 192, 256);
    A.paint(CAL, (g, w, h) => {
      fill(g, 0, 0, w, h, '#F6EEDB');
      fill(g, 0, 0, w, 70, '#6E1F2A');
      say(g, 'တန်ဆောင်မုန်း', w / 2, 36, 26, '#F6EEDB');
      for (let i = 0; i < 30; i++) {
        const x = 18 + (i % 6) * 28, y = 92 + Math.floor(i / 6) * 32;
        say(g, String.fromCharCode(0x1040 + ((i + 1) % 10)), x + 6, y, 16, i % 6 === 5 ? '#C8323C' : '#2A2118', { weight: 400 });
        if (i < 11) { g.strokeStyle = 'rgba(200,50,60,0.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 4, y - 8); g.lineTo(x + 16, y + 8); g.stroke(); }
      }
    });
    A.quad(CAL, 0.4, 0.54, mat(hw - 0.05, 1.95, -1.7, 0, -PI / 2, 0));
    v.box(hw - 0.03, 2.25, -1.7, 0.03, 0.03, 0.03, '#3E3530');
    // sacks and crates
    const SACK = ['#C9A576', '#BC9868', '#D2B285', '#B58E5E'];
    crate(v, 3.45, 0.75, { w: 0.62, h: 0.48, d: 0.5, rot: -PI / 2 });
    crate(v, 3.45, 0.75, { w: 0.55, h: 0.42, d: 0.46, rot: -PI / 2 + 0.08, y: 0.48, c: '#A88058' });
    sack(v, 3.4, 1.35, { rot: PI / 2, c: SACK[0] });
    sack(v, 3.4, 1.85, { rot: PI / 2, c: SACK[1] });
    sack(v, 3.42, 1.6, { rot: PI / 2 + 0.1, c: SACK[2], y: 0.38, h: 0.38 });
    sack(v, 2.9, 2.15, { rot: 0.3, c: SACK[3], w: 0.5, h: 0.4 });
    crate(v, 3.45, 2.6, { w: 0.5, h: 0.38, d: 0.44, rot: -PI / 2 - 0.1, c: '#C29A68' });
    solid(room, 3.35, 1.7, 0.75, 2.3, 0.05);
    // tags hung on the sacks and crates, turned a little toward the door so they read
    [['duck', 3.1, 0.62, 1.38], ['duck', 3.1, 0.6, 1.86], ['rice', 3.13, 0.95, 1.62], ['fish', 3.17, 0.36, 0.78], ['wood', 2.62, 0.42, 2.22], ['fish', 3.18, 0.3, 2.62]].forEach(([k, x, y, z], i) => {
      A.quad(TAG[k], 0.2, 0.2, mat(x, y, z, 0, -PI / 2 + 0.75 + (i % 2) * 0.1, (rnd(i) - 0.5) * 0.3));
      seg(v, x + 0.04, y + 0.1, z - 0.04, x + 0.12, y + 0.2, z - 0.06, 0.01, '#4A3B30');
    });
    // the weigh-house cat, asleep on the top sack
    const c = new VoxelBuilder();
    const FUR = '#E2A15A', FUR_L = '#F3D3A3';
    c.box(0, 0.09, 0, 0.32, 0.16, 0.26, FUR);
    c.box(0.04, 0.12, 0.02, 0.24, 0.12, 0.22, FUR_L);
    c.box(0.15, 0.12, 0.08, 0.15, 0.13, 0.15, FUR);
    c.box(0.15, 0.2, 0.04, 0.04, 0.05, 0.04, FUR);
    c.box(0.15, 0.2, 0.12, 0.04, 0.05, 0.04, FUR);
    c.box(0.22, 0.11, 0.08, 0.02, 0.012, 0.09, '#5E3E26'); // closed eyes line
    c.box(-0.05, 0.03, 0.15, 0.3, 0.06, 0.06, '#C98A44'); // tail round the front
    for (let k = 0; k < 3; k++) c.box(-0.1 + k * 0.08, 0.17, 0, 0.03, 0.005, 0.24, '#C98A44');
    v.merge(c, mat(3.42, 0.75, 1.62, 0, -PI / 2 - 0.4, 0));
    // a sack hook leaning on the crate
    seg(v, 3.05, 0.0, 0.42, 3.12, 0.55, 0.5, 0.03, '#3E3530');
  }

  // ---- the evening's rice sacks waiting for the scale, left of the platform ----
  sack(v, -1.95, -1.55, { rot: 0.4, c: '#CDAE80' });
  sack(v, -2.05, -0.98, { rot: -0.2, c: '#C29F70', w: 0.5 });
  sack(v, -2.0, -1.28, { rot: 0.1, c: '#D2B285', y: 0.36, h: 0.36, w: 0.5 });
  A.quad(TAG.duck, 0.18, 0.18, mat(-1.62, 0.5, -1.36, 0, 0.5, 0.1));
  A.quad(TAG.duck, 0.18, 0.18, mat(-1.74, 0.36, -0.8, 0, 0.3, -0.12));
  solid(room, -2.0, -1.26, 0.7, 1.05, 0.02);
  shade.add(-2.0, -1.26, 0.5, 0.75);

  // ---- front floor (v2): the small platform scale for parcels, a chalk-marked parcel row, dropped tags/slips ----
  {
    // decimal platform scale (green iron, brass beam), turned toward the door, a parcel on it
    const s = new VoxelBuilder();
    const GI = '#3F6B5A', GI_D = '#2E4E42';
    s.boxMin(-0.3, 0.0, -0.24, 0.3, 0.1, 0.24, GI_D);
    s.boxMin(-0.28, 0.1, -0.22, 0.28, 0.115, 0.22, BRASS_D);
    for (let i = 0; i < 4; i++) s.boxMin(-0.26 + i * 0.13 + 0.006, 0.115, -0.2, -0.26 + (i + 1) * 0.13 - 0.006, 0.14, 0.2, tone('#B58A5A', 0.95 + rnd(i + 80) * 0.12));
    for (const sx of [-1, 1]) prism(s, sx * 0.22, 0.05, -0.27, 0.05, 0.05, 0.04, IRON, 8, PI / 2, 0); // wheels
    s.boxMin(-0.06, 0.1, -0.3, 0.06, 1.0, -0.2, GI); // column
    s.boxMin(-0.075, 0.42, -0.31, 0.075, 0.46, -0.19, P.gold); // gold band
    s.boxMin(-0.1, 0.98, -0.3, 0.1, 1.06, -0.2, GI_D); // cap
    s.boxMin(-0.16, 1.07, -0.27, 0.5, 1.1, -0.23, BRASS); // beam
    for (let x = -0.1; x < 0.46; x += 0.07) s.box(x, 1.085, -0.228, 0.01, 0.02, 0.004, '#4A3B30');
    s.box(0.22, 1.085, -0.25, 0.05, 0.07, 0.07, IRON); // poise
    seg(s, 0.48, 1.07, -0.25, 0.48, 0.82, -0.25, 0.014, IRON);
    for (let k = 0; k < 3; k++) prism(s, 0.48, 0.8 - k * 0.035, -0.25, 0.05 - k * 0.006, 0.05 - k * 0.006, 0.03, k % 2 ? BRASS : BRASS_D, 8);
    // the parcel: kraft paper, twine cross
    s.boxMin(-0.16, 0.14, -0.1, 0.14, 0.32, 0.14, '#C8A57A');
    s.boxMin(-0.165, 0.14, 0.0, 0.145, 0.325, 0.03, '#8C6A3A');
    s.boxMin(-0.03, 0.14, -0.105, 0.0, 0.325, 0.145, '#8C6A3A');
    v.merge(s, mat(1.35, 0, 1.95, 0, -0.45, 0));
    solid(room, 1.35, 1.95, 0.7, 0.62, 0.02);
    shade.add(1.35, 1.95, 0.4, 0.34);
    A.quad(TAG.fish, 0.15, 0.15, mat(1.35 + 0.02, 0.27, 1.95 + 0.17, 0, -0.45, 0.15));

    // the chalked parcel row: four numbered slots on the boards, three parcels waiting, the last slot empty
    const CHALK = '#F2EEE2', x0 = -2.4, sw = 0.46, z0 = 1.25, z1 = 1.85, y = 0.0085;
    v.boxMin(x0, 0, z0 - 0.015, x0 + sw * 4, y, z0 + 0.015, CHALK);
    v.boxMin(x0, 0, z1 - 0.015, x0 + sw * 4, y, z1 + 0.015, CHALK);
    for (let i = 0; i <= 4; i++) v.boxMin(x0 + i * sw - 0.015, 0, z0, x0 + i * sw + 0.015, y, z1, CHALK);
    const SLOTN = A.region(512, 768, 256, 64);
    A.paint(SLOTN, (g, w, h) => ['၁', '၂', '၃', '၄'].forEach((n, i) => say(g, n, i * 64 + 32, h / 2 + 3, 58, CHALK, { weight: 700 })));
    for (let i = 0; i < 4; i++) A.quad(SLOTN, 0.26, 0.26, mat(x0 + i * sw + sw / 2, y + 0.001, z1 + 0.17, -PI / 2, 0, 0), [i / 4, 0, (i + 1) / 4, 1]);
    const PARCEL = [[0.36, 0.22, 0.3, '#C8A57A', 'duck'], [0.3, 0.3, 0.26, '#B99668', 'rice'], [0.34, 0.16, 0.36, '#D2B285', 'fish']];
    PARCEL.forEach(([w, h, d, c, tag], i) => {
      const cx = x0 + i * sw + sw / 2, cz = (z0 + z1) / 2, r = (rnd(i + 90) - 0.5) * 0.3;
      const p = new VoxelBuilder();
      p.boxMin(-w / 2, 0, -d / 2, w / 2, h, d / 2, c);
      p.boxMin(-w / 2 + 0.02, h, -d / 2 + 0.02, w / 2 - 0.02, h + 0.01, d / 2 - 0.02, tone(c, 1.1));
      p.boxMin(-w / 2 - 0.005, 0, -0.015, w / 2 + 0.005, h + 0.015, 0.015, '#8C6A3A');
      p.boxMin(-0.015, 0, -d / 2 - 0.005, 0.015, h + 0.015, d / 2 + 0.005, '#8C6A3A');
      p.box(0, h + 0.025, 0, 0.06, 0.03, 0.06, '#8C6A3A'); // knot
      v.merge(p, mat(cx, 0, cz, 0, r, 0));
      A.quad(TAG[tag], 0.14, 0.14, mat(cx + 0.04, h * 0.6, cz + d / 2 + 0.012, 0, r, (rnd(i) - 0.5) * 0.4));
      shade.add(cx, cz, w * 0.6, d * 0.6);
    });
    solid(room, x0 + sw * 1.5, (z0 + z1) / 2, sw * 3, z1 - z0, 0.02);
    // a chalk stub left on the boards by slot four, a chalk tick under slot one
    v.box(x0 + sw * 3.6, 0.012, z1 + 0.28, 0.07, 0.02, 0.02, CHALK, 0.6);

    // dropped ledger slips and tags across the front boards (lived-in, flat, readable)
    const SLIP = A.region(768, 768, 160, 112);
    A.paint(SLIP, (g, w, h) => {
      ledgerPaper(g, w, h, { rule: 22, margin: 0.18, cols: [0.72], bg: '#FBF4E2' });
      say(g, 'ဘဲဆိပ်  ၃', 38, 40, 22, '#2A2118', { align: 'left', weight: 400 });
      say(g, 'ဆန်  ၁၂', 38, 70, 22, '#2F3F8A', { align: 'left', weight: 400 });
    });
    [[-0.85, 2.55, 0.4], [0.75, 1.1, -0.7], [-1.45, 0.75, 1.2], [2.0, 2.75, 0.2], [0.2, 2.15, -1.5]].forEach(([x, z, r], i) => A.quad(SLIP, 0.2, 0.14, mat(x, 0.0095 + i * 0.0002, z, -PI / 2, 0, r)));
    [['duck', -0.25, 1.55, 0.9], ['rice', 1.9, 0.6, -0.3], ['fish', -1.0, 2.95, 2.1], ['wood', 0.55, 2.7, 1.4]].forEach(([k, x, z, r], i) => {
      A.quad(TAG[k], 0.16, 0.16, mat(x, 0.0105 + i * 0.0002, z, -PI / 2, 0, r));
      seg(v, x + Math.cos(r) * 0.1, 0.012, z - Math.sin(r) * 0.1, x + Math.cos(r) * 0.2, 0.012, z - Math.sin(r) * 0.16, 0.008, '#4A3B30'); // its string
    });
  }

  // ---- front: water jar (left) and the hand cart (right) ----
  waterJar(v, WH.jar.x, WH.jar.z, { s: 1.05 });
  tinCup(v, WH.jar.x + 0.04, 0.98, WH.jar.z + 0.02);
  solidCircle(room, WH.jar.x, WH.jar.z, 0.3);
  {
    const s = new VoxelBuilder();
    s.boxMin(-0.4, 0.34, -0.3, 0.4, 0.4, 0.3, '#9A6E48');
    for (let i = 0; i < 5; i++) s.boxMin(-0.4 + i * 0.16 + 0.01, 0.4, -0.3, -0.4 + (i + 1) * 0.16 - 0.01, 0.43, 0.3, tone('#B58A5A', 0.95 + rnd(i + 40) * 0.1));
    for (const sz of [-1, 1]) {
      prism(s, 0.05, 0.27, sz * 0.36, 0.27, 0.27, 0.06, '#5E3E26', 10, PI / 2, 0);
      prism(s, 0.05, 0.27, sz * 0.36, 0.07, 0.07, 0.08, '#3E3530', 8, PI / 2, 0);
      s.boxMin(-1.05, 0.36, sz * 0.27 - 0.03, -0.4, 0.42, sz * 0.27 + 0.03, '#8A6040'); // handles
    }
    s.box(-0.38, 0.17, 0, 0.05, 0.34, 0.05, '#5E3E26'); // rest leg
    sack(s, 0.05, 0, { rot: 0.1, y: 0.43, c: '#D2B285', w: 0.5, h: 0.32 });
    v.merge(s, mat(2.75, 0, 3.1, 0, -0.5, 0));
    solid(room, 2.55, 3.15, 1.2, 1.0, 0.0);
  }

  room.group.add(asStatic(v));

  // ---- ambient: dust motes in the window light, lamp flames ----
  const motes = Array.from({ length: 12 }, (_, i) => {
    const p = dyn.part();
    dyn.box(p, 0, 0, 0, 0.026, 0.026, 0.026, i % 3 ? '#FFF4CF' : '#F3D27A');
    return p;
  });
  tick.push((dt, t, st) => {
    for (let i = 0; i < motes.length; i++) {
      const u = frac(t * 0.04 + i * 0.37);
      const sx = i % 2 ? -1.8 : 1.8;
      const s = Math.sin(u * PI) * (0.6 + 0.4 * Math.sin(t * 2.1 + i * 1.7)) * (1 - st.evening) * (1 - 0.6 * st.rainK);
      dyn.set(motes[i], sx + (rnd(i) - 0.5) * 1.0 + Math.sin(t * 0.3 + i * 2.1) * 0.15, 0.6 + u * 1.9, -hd + 0.8 + rnd(i + 5) * 1.3 + Math.cos(t * 0.25 + i) * 0.1, t * 0.5 + i, t * 0.7 + i, 0, s);
    }
    for (const l of lamps) {
      const f = st.evening;
      const k = (0.75 + 0.25 * Math.sin(t * 13 + l.x * 7) * Math.sin(t * 7.3 + l.x)) * f;
      if (f < 0.01) dyn.hide(l.fl);
      else dyn.set(l.fl, l.x, l.y, l.z, 0, t * 2, 0, k, k * (0.9 + 0.2 * Math.sin(t * 17 + l.x)), k);
    }
    for (const d of rainDrops) {
      if (!st.rain) { dyn.hide(d.p); continue; }
      const u = frac(t * 0.55 + d.o);
      dyn.set(d.p, d.x + Math.sin(u * 9 + d.o * 20) * 0.01, d.y0 + (d.y1 - d.y0) * u, d.z, 0, 0, 0, 1, 0.6 + u * 0.8, 1);
    }
  });

  // ---- taps (no markers), spots ----
  room.stations = stationsFrom([
    { id: 'scale', x: -0.95, z: -1.0, look: { x: 0, z: SZ }, at: { x: 0, y: 1.2, z: SZ }, name: { my: 'ချိန်ခွင်', en: 'the scale' } },
    { id: 'checkweights', x: -1.2, z: -2.05, look: WH.check, at: { x: WH.check.x, y: 0.95, z: WH.check.z }, name: { my: 'အလေးစစ် ခွင်တုံးသေတ္တာ', en: 'the check weights' } },
    { id: 'tally', x: 2.3, z: -2.95, look: { x: 2.3, z: -hd }, at: { x: 2.3, y: WH.tally.y, z: -hd }, name: { my: 'ထမ်းသူ စာရင်းပြား', en: 'the tally board' } },
    { id: 'parcels', x: -1.2, z: 2.45, look: { x: -1.7, z: 1.55 }, at: { x: -1.7, y: 0.3, z: 1.55 }, name: { my: 'အထုပ်တန်း', en: 'the parcel row' } },
    { id: 'smallscale', x: 0.6, z: 2.3, look: { x: 1.35, z: 1.95 }, at: { x: 1.35, y: 0.7, z: 1.95 }, name: { my: 'ချိန်ခွင်ငယ်', en: 'the parcel scale' } },
    { id: 'book', x: 1.75, z: -0.4, look: WH.stand, at: { x: WH.stand.x, y: 1.1, z: WH.stand.z }, name: { my: 'အလေးချိန် စာအုပ်', en: 'the weights book' } },
    { id: 'sacks', x: 2.45, z: 1.3, look: { x: 3.4, z: 1.6 }, at: { x: 3.3, y: 0.6, z: 1.6 }, name: { my: 'ဆန်အိတ်များ', en: 'the sacks' } },
    ...(day >= 6 ? [{ id: 'ropes', x: -2.75, z: 0.95, look: { x: -hw, z: -1.0 }, at: { x: -3.8, y: 1.35, z: -1.0 }, name: { my: 'ကြိုးစင်', en: 'the rope rack' } }] : []),
    { id: 'jar', x: -2.55, z: 2.2, look: WH.jar, at: { x: WH.jar.x, y: 0.8, z: WH.jar.z }, name: { my: 'ရေအိုး', en: 'the water jar' } },
  ]);
  // spots are day-gated like the dressing: Day 5 (default) has Ko Thiha's scene, Day 6+ the porters on the bench,
  // Nay Chi's seat and the rope-rack slate. The story hook MUST pass opts.day (6, 14, 15) for the Day 6 room.
  room.spots = {
    entry: { x: 0, z: 3.0, h: PI },
    maya: { x: 0.6, z: 0.4, h: PI },
    dawsanda: { x: 0.9, z: -1.9, h: 0, who: 'dawsanda', mood: 'work' },
    clerk: { x: 3.2, z: -0.4, h: -PI / 2, who: 'clerk', mood: 'read' },
    porter3: { x: -0.35, z: 2.1, h: face(-0.35, 2.1, -1.7, 1.55), who: 'porterC' },
    merchant: { x: 0, z: -0.62, h: PI, who: 'merchant' },
    child: { x: -0.55, z: 0.35, h: PI, who: 'child' },
    sackPick: { x: 2.55, z: 1.35, h: PI / 2 },
    sackLeft: { x: -1.35, z: -1.3, h: -PI / 2 },
    parcels: { x: -1.2, z: 2.45, h: face(-1.2, 2.45, -1.7, 1.55) },
    ...(day >= 6 ? {
      porter1: { x: -3.48, z: -1.6, h: PI / 2, sit: 0.42, who: 'porterA' },
      porter2: { x: -3.48, z: -0.8, h: PI / 2, sit: 0.42, who: 'porterB' },
      naychi: { x: -3.48, z: 0.22, h: PI / 2, sit: 0.49, who: 'naychi' },
      slate2: { x: -hw + 0.2, z: -1.0, h: PI / 2, y: 1.25 },
    } : {
      kothiha: { x: -0.4, z: -0.8, h: face(-0.4, -0.8, 0.9, -1.9), who: 'kothiha' },
    }),
  };
  room.props = { scale };
  return finishRoom(room, { atlas: A, dyn, glow, shafts, dusk, shade, tick });
}

/** Static builder → a Group holding one mesh (kit.bake() merges it with the shell). */
function asStatic(v) {
  const g = new THREE.Group();
  g.name = 'dressing';
  g.add(v.mesh({ outline: false }));
  return g;
}

// =============================================================================================
// 2. sandahouse · Daw Sanda and Ko Thiha's stilt house above Little Jetty (Days 5, 6) · 6 × 6 × 2.8
// =============================================================================================
function buildSandahouse(opts = {}) {
  const day = opts.day ?? 5;
  const W = 6, D = 6, H = 2.8, hw = W / 2, hd = D / 2;
  const BAMBOO = '#D6B47E', BAMBOO_D = '#B8945E', WOOD = '#8A6040';
  const room = kit.createRoom({ width: W, depth: D, height: H, wall: BAMBOO, wainscot: WOOD, trim: P.goldDeep, floor: 'planks', floorColor: '#A97C50', background: '#E7DCC4' });
  room.id = 'sandahouse';
  const A = makeAtlas(1024);
  const dyn = makeDyn();
  const glow = makeGlow('lampGlow');
  const shafts = makeGlow('lightShafts');
  const dusk = makeGlow('dusk', { additive: false, textured: false });
  const shade = makeShade();
  const tick = [];
  const v = new VoxelBuilder();
  for (const [x, z, rx, rz] of [[0, -0.5, 0.62, 0.6], [-2.78, -0.6, 0.32, 0.65], [2.6, -1.55, 0.32, 0.55], [1.45, -2.62, 0.65, 0.3], [-1.9, -2.72, 0.65, 0.3], [-2.69, -2.67, 0.3, 0.3], [-2.0, 2.1, 0.36, 0.36], [2.38, 2.15, 0.38, 0.38], [0, -2.85, 3.1, 0.35], [-2.85, 0, 0.32, 3.1], [2.85, 0, 0.32, 3.1]]) shade.add(x, z, rx, rz);

  // floor: warm planks, a threshold board, slippers left at the door
  boards(v, room, ['#A97C50', '#9E7249', '#B3865A', '#956A44', '#A57A4F'], { seed: 11, boardW: 0.2, seam: '#4A3424' });
  v.boxMin(-1.0, 0, hd - 0.2, 1.0, 0.04, hd, tone(WOOD, 0.9));
  for (const [x, c] of [[0.85, '#6E1F2A'], [1.25, '#2A2118']]) for (const dx of [-0.065, 0.065]) v.boxMin(x + dx - 0.05, 0.004, hd - 0.75, x + dx + 0.05, 0.03, hd - 0.47, c);
  // walls: woven bamboo matting (two tones, staggered), wood wainscot boards, corner posts.
  // No weave behind the back window's painted view (strip outlines read as rain streaks through it): strips are
  // clipped round the window frame rectangle.
  const WR = { a0: -1.2 - 0.58, a1: -1.2 + 0.58, y0: 1.6 - 0.43, y1: 1.6 + 0.43 };
  const weave = (f, a0, a1, y0, y1, c) => {
    if (f.face !== 'back' || a1 <= WR.a0 || a0 >= WR.a1 || y1 <= WR.y0 || y0 >= WR.y1) { wbox(v, room, f.face, a0, a1, y0, y1, 0.014, c); return; }
    if (a0 < WR.a0) wbox(v, room, f.face, a0, WR.a0, y0, y1, 0.014, c);
    if (a1 > WR.a1) wbox(v, room, f.face, WR.a1, a1, y0, y1, 0.014, c);
    const b0 = Math.max(a0, WR.a0), b1 = Math.min(a1, WR.a1);
    if (y0 < WR.y0) wbox(v, room, f.face, b0, b1, y0, WR.y0, 0.014, c);
    if (y1 > WR.y1) wbox(v, room, f.face, b0, b1, WR.y1, y1, 0.014, c);
  };
  for (const f of wallFaces(room)) {
    if (f.top > 1.1) {
      // v2: coarser weave (0.27 m cells, two strips each) — about half the boxes of the first pass, same read
      const C = 0.27;
      wbox(v, room, f.face, f.a0, f.a1, 1.06, f.top, 0.008, tone(BAMBOO_D, 0.78));
      let j = 0;
      for (let y = 1.06; y < f.top - 0.04; y += C, j++) {
        const y1 = Math.min(f.top, y + C);
        let i = 0;
        for (let a = f.a0; a < f.a1 - 0.03; a += C, i++) {
          const a1 = Math.min(f.a1, a + C);
          const across = (i + j) % 2 === 0;
          for (let k = 0; k < 2; k++) {
            const c = tone(BAMBOO, (across ? 0.9 : 1.05) + (k === 1 ? 0.04 : 0) + rnd(i * 13 + j * 7 + k) * 0.05);
            if (across) { const ya = y + (k * (y1 - y)) / 2, yb = y + ((k + 1) * (y1 - y)) / 2; weave(f, a + 0.006, a1 - 0.006, ya + 0.008, yb - 0.008, c); }
            else { const aa = a + (k * (a1 - a)) / 2, ab = a + ((k + 1) * (a1 - a)) / 2; weave(f, aa + 0.008, ab - 0.008, y + 0.006, y1 - 0.006, c); }
          }
        }
      }
    }
    const wt = Math.min(0.98, f.top);
    for (let a = f.a0, i = 0; a < f.a1 - 0.02; a += 0.3, i++) wbox(v, room, f.face, a + 0.008, Math.min(f.a1, a + 0.3) - 0.008, 0.14, wt, 0.014, tone(WOOD, 0.92 + rnd(i * 5 + f.a0) * 0.14));
  }
  for (const x of [-hw + 0.06, hw - 0.06]) v.boxMin(x - 0.08, 0, -hd, x + 0.08, H, -hd + 0.12, tone(WOOD, 0.85));
  v.boxMin(-hw, H - 0.3, -hd, hw, H - 0.16, -hd + 0.1, tone(WOOD, 0.8));

  // back window over the side channel: frame, open shutters, painted view, a tin of herbs on the sill
  const WX = -1.2, WY = 1.6, WW = 1.0, WHh = 0.7, z = -hd;
  const VIEW = A.region(0, 0, 384, 256);
  A.paint(VIEW, (g, w, h) => {
    sky(g, w, h * 0.5, '#A9CDE6', '#F6E3C6');
    fill(g, 0, h * 0.42, w, h * 0.08, '#D9CFC0'); // far bank in the mist
    ell(g, w * 0.2, h * 0.43, w * 0.25, h * 0.05, '#C9C4B8');
    ell(g, w * 0.75, h * 0.42, w * 0.3, h * 0.06, '#CFC9BC');
    const gr = g.createLinearGradient(0, h * 0.48, 0, h);
    gr.addColorStop(0, '#8DB4BF'); gr.addColorStop(1, '#4F7F86');
    g.fillStyle = gr; g.fillRect(0, h * 0.48, w, h * 0.52);
    g.fillStyle = 'rgba(255,255,255,0.45)';
    for (let i = 0; i < 18; i++) g.fillRect(w * rnd(i + 2), h * (0.55 + rnd(i + 9) * 0.42), 14 + rnd(i) * 20, 2);
    // two low sandbar jetties: planks on posts
    for (const [x0, x1, y] of [[0.05, 0.42, 0.66], [0.55, 0.98, 0.78]]) {
      fill(g, w * x0, h * y, w * (x1 - x0), 8, '#8A6040');
      for (let k = 0; k < 5; k++) fill(g, w * (x0 + (k + 0.5) * (x1 - x0) / 5), h * y + 8, 5, 16, '#5E3E26');
      ell(g, w * (x0 + x1) / 2, h * y + 26, w * (x1 - x0) * 0.55, 6, '#D9C38E');
    }
    // reeds at the edges
    g.strokeStyle = '#6F9E5B'; g.lineWidth = 3;
    for (let i = 0; i < 14; i++) { const x = i < 7 ? i * 6 : w - (i - 7) * 6; g.beginPath(); g.moveTo(x, h); g.lineTo(x + (rnd(i) - 0.5) * 16, h * (0.7 + rnd(i + 4) * 0.12)); g.stroke(); }
  });
  A.quad(VIEW, WW, WHh, mat(WX, WY, z + 0.03));
  dusk.quad(WW, WHh, mat(WX, WY, z + 0.035), '#24304A');
  {
    const F = '#6E4A2E';
    v.boxMin(WX - WW / 2 - 0.08, WY - WHh / 2 - 0.08, z, WX + WW / 2 + 0.08, WY - WHh / 2, z + 0.12, F);
    v.boxMin(WX - WW / 2 - 0.08, WY + WHh / 2, z, WX + WW / 2 + 0.08, WY + WHh / 2 + 0.08, z + 0.12, F);
    v.boxMin(WX - WW / 2 - 0.08, WY - WHh / 2, z, WX - WW / 2, WY + WHh / 2, z + 0.12, F);
    v.boxMin(WX + WW / 2, WY - WHh / 2, z, WX + WW / 2 + 0.08, WY + WHh / 2, z + 0.12, F);
    for (let k = 1; k < 4; k++) v.boxMin(WX - WW / 2 + k * WW / 4 - 0.012, WY - WHh / 2, z, WX - WW / 2 + k * WW / 4 + 0.012, WY + WHh / 2, z + 0.05, F); // bars
    v.boxMin(WX - WW / 2 - 0.14, WY - WHh / 2 - 0.13, z, WX + WW / 2 + 0.14, WY - WHh / 2 - 0.07, z + 0.22, tone(F, 1.2));
    for (const sx of [-1, 1]) {
      const x0 = WX + sx * (WW / 2 + 0.1);
      const xa = Math.min(x0, x0 + sx * 0.48), xb = Math.max(x0, x0 + sx * 0.48);
      for (let k = 0; k < 4; k++) v.boxMin(xa + k * 0.12 + 0.005, WY - WHh / 2, z + 0.02, xa + (k + 1) * 0.12 - 0.005, WY + WHh / 2, z + 0.05, tone('#9A6E48', 0.95 + (k % 2) * 0.08));
      v.boxMin(xa, WY + 0.15, z + 0.05, xb, WY + 0.19, z + 0.065, '#3E3530');
      v.boxMin(xa, WY - 0.19, z + 0.05, xb, WY - 0.15, z + 0.065, '#3E3530');
    }
    // a tin of herbs on the sill
    prism(v, WX + 0.3, WY - WHh / 2 + 0.0, z + 0.12, 0.07, 0.07, 0.12, '#B9B7AE', 8);
    for (let k = 0; k < 5; k++) v.box(WX + 0.3 + (rnd(k) - 0.5) * 0.1, WY - WHh / 2 + 0.1 + rnd(k + 3) * 0.06, z + 0.12 + (rnd(k + 6) - 0.5) * 0.08, 0.06, 0.06, 0.06, k % 2 ? P.leaf : P.leafDark);
    shafts.quad(WW * 1.2, 2.4, mat(WX * 0.9, 1.0, -hd + 0.8, -0.72, 0, 0), '#FFE9B0');
    shafts.pool(WX * 0.85, -hd + 1.45, 0.65, 0.4, '#FFE2A0', 0.011);
  }
  const rainDrops = [];
  for (let i = 0; i < 7; i++) {
    const p = dyn.part();
    dyn.box(p, 0, 0, 0, 0.012, 0.1, 0.006, '#DCEBF5');
    rainDrops.push({ p, x: WX - WW / 2 + 0.06 + rnd(i * 4.3) * (WW - 0.12), y0: WY + WHh / 2 - 0.04, y1: WY - WHh / 2 + 0.05, z: z + 0.07, o: rnd(i * 2.9) });
  }
  // glints on the channel in the window view
  const glints = Array.from({ length: 4 }, () => {
    const p = dyn.part();
    dyn.box(p, 0, 0, 0, 0.07, 0.008, 0.004, '#F4FBFF');
    return p;
  });

  // back wall, right: Ko Thiha's list (pinned), his rolled mat, pillow and folded blanket; a hanging basket
  const LIST = A.region(384, 0, 256, 352);
  A.paint(LIST, (g, w, h) => {
    // v2: brighter paper, bigger hand, so the list reads from the room camera (Day 5 "the sort")
    ledgerPaper(g, w, h, { rule: 40, margin: 0.12, cols: [], bg: '#FFFAEC' });
    say(g, 'မြစ်ရဲ့အပြစ်', w / 2, 34, 36, '#6E1F2A');
    g.fillStyle = '#6E1F2A'; g.fillRect(30, 58, w - 60, 3);
    ['ဒီဆိပ်မှာ မွေးတာ', 'မြစ်ရေ မြန်တာ', 'ဖောင်က ဟောင်းနေတာ', 'ကူးတို့က ပိုမြန်တာ', 'လှော်မလား…'].forEach((s, i) => say(g, s, 40, 102 + i * 54, 26, i === 4 ? '#8A6A40' : '#1E1812', { align: 'left', weight: 700, max: w - 46 }));
    for (let i = 0; i < 4; i++) say(g, String.fromCharCode(0x1041 + i), 19, 102 + i * 54, 22, '#B8424A', { weight: 700 });
  });
  v.boxMin(1.12, 0.94, -hd + 0.02, 1.68, 1.7, -hd + 0.03, '#E6D7B4'); // a backing card behind the sheet
  A.quad(LIST, 0.52, 0.72, mat(1.4, 1.32, -hd + 0.035, 0, 0, -0.03));
  v.box(1.4, 1.66, -hd + 0.04, 0.03, 0.03, 0.02, '#C8323C');
  // his rolled mat
  prism(v, 1.4, 0.12, -2.62, 0.12, 0.12, 0.95, '#D9C18A', 10, 0, PI / 2);
  for (const dx of [-0.3, 0.3]) prism(v, 1.4 + dx, 0.12, -2.62, 0.125, 0.125, 0.04, '#6E1F2A', 10, 0, PI / 2);
  prism(v, 1.88, 0.12, -2.62, 0.08, 0.08, 0.005, '#B89A5A', 10, 0, PI / 2);
  v.boxMin(1.0, 0.24, -2.78, 1.5, 0.34, -2.46, '#2F7C7A'); // folded blanket
  v.boxMin(1.04, 0.34, -2.75, 1.46, 0.36, -2.49, tone('#2F7C7A', 1.2));
  v.boxMin(1.55, 0.0, -2.8, 1.95, 0.14, -2.5, '#F4EFE4'); // pillow
  v.boxMin(1.58, 0.14, -2.77, 1.92, 0.16, -2.53, '#E9DFC9');
  solid(room, 1.45, -2.62, 1.1, 0.4, 0.02);
  // his cloth bag on a nail, a hanging basket
  v.box(2.35, 1.72, -hd + 0.03, 0.03, 0.03, 0.04, '#3E3530');
  seg(v, 2.35, 1.72, -hd + 0.05, 2.22, 1.42, -hd + 0.06, 0.015, '#7A5434');
  seg(v, 2.35, 1.72, -hd + 0.05, 2.48, 1.42, -hd + 0.06, 0.015, '#7A5434');
  v.boxMin(2.15, 1.08, -hd + 0.03, 2.55, 1.42, -hd + 0.12, '#2E3D63');
  v.boxMin(2.2, 1.18, -hd + 0.12, 2.5, 1.3, -hd + 0.125, '#C9A24A');
  // a little shelf with jars, tin plates and a cup between the window and the list
  v.boxMin(-0.45, 1.82, -hd, 0.85, 1.86, -hd + 0.22, '#8A6040');
  for (const x of [-0.35, 0.75]) seg(v, x, 1.6, -hd + 0.02, x, 1.82, -hd + 0.18, 0.03, '#6E4A2E');
  [[-0.32, 0.07, 0.16, '#B5643C'], [-0.16, 0.06, 0.13, '#E6EEF0'], [0.0, 0.05, 0.1, '#D9A93B'], [0.5, 0.06, 0.14, '#6E1F2A']].forEach(([x, r, h, c]) => {
    prism(v, x, 1.86 + h / 2, -hd + 0.11, r, r, h, c, 8);
    prism(v, x, 1.86 + h + 0.015, -hd + 0.11, r * 0.85, r * 0.85, 0.03, '#7A5434', 8);
  });
  for (let k = 0; k < 3; k++) rbox(v, 0.2 + k * 0.02, 1.98, -hd + 0.05 + k * 0.02, 0.24, 0.24, 0.015, tone('#C9C9C2', 1 - k * 0.04), -0.15, 0, 0);
  tinCup(v, 0.72, 1.86, -hd + 0.14, '#E9DFC9');

  // back-left: Daw Sanda's rolled mat and pillow, the mosquito net tied up above, her oil lamp on a box
  prism(v, -1.9, 0.11, -2.72, 0.11, 0.11, 0.9, '#C9B275', 10, 0, PI / 2);
  for (const dx of [-0.3, 0.3]) prism(v, -1.9 + dx, 0.11, -2.72, 0.115, 0.115, 0.04, '#3E6B4F', 10, 0, PI / 2);
  v.boxMin(-2.35, 0.22, -2.85, -1.85, 0.32, -2.58, '#E9DFC9'); // folded sheet
  v.boxMin(-1.75, 0.0, -2.88, -1.35, 0.13, -2.58, '#F4EFE4'); // pillow
  v.boxMin(-1.72, 0.13, -2.85, -1.38, 0.15, -2.61, '#D97C8A');
  solid(room, -1.9, -2.72, 1.1, 0.34, 0.02);
  // the net: a bundle hung on two cords from a peg, and its folded skirt
  v.box(-2.3, 2.3, -hd + 0.04, 0.04, 0.04, 0.06, '#3E3530');
  seg(v, -2.3, 2.28, -hd + 0.06, -2.3, 2.1, -hd + 0.2, 0.012, '#7A5434');
  v.boxMin(-2.55, 1.62, -hd + 0.1, -2.05, 2.1, -hd + 0.34, '#F4F1EA');
  v.boxMin(-2.5, 1.5, -hd + 0.12, -2.1, 1.66, -hd + 0.3, '#ECE7DC');
  v.boxMin(-2.57, 1.85, -hd + 0.09, -2.03, 1.89, -hd + 0.35, '#C8323C'); // tie
  // oil lamp box
  v.boxMin(-2.88, 0, -2.86, -2.5, 0.32, -2.48, '#7A4A2A');
  v.boxMin(-2.9, 0.32, -2.88, -2.48, 0.35, -2.46, tone('#7A4A2A', 1.15));
  prism(v, -2.69, 0.38, -2.67, 0.07, 0.09, 0.05, '#B5643C', 8); // clay lamp dish
  v.box(-2.64, 0.41, -2.67, 0.04, 0.02, 0.03, '#D9B45A');
  v.boxMin(-2.86, 0.35, -2.58, -2.72, 0.37, -2.5, '#F4EFE4'); // matchbox
  v.boxMin(-2.86, 0.37, -2.58, -2.72, 0.372, -2.5, '#C8323C');
  solid(room, -2.69, -2.67, 0.4, 0.4, 0.02);
  glow.halo(-2.64, 0.55, -2.58, 0.55, '#FFC46A');
  glow.pool(-2.4, -2.3, 1.3, 1.0, '#FFB65A');
  const flame = dyn.part();
  dyn.box(flame, 0, 0, 0, 0.03, 0.06, 0.03, '#FFB53A');
  dyn.box(flame, 0, 0.025, 0, 0.016, 0.035, 0.016, '#FFF1B8');

  // left wall: the low shelf with Daw Sanda's sewing basket (the eighth patch half sewn), a mirror above
  {
    const s = new VoxelBuilder();
    s.boxMin(-0.5, 0, -0.175, 0.5, 0.05, 0.175, WOOD);
    s.boxMin(-0.5, 0.33, -0.175, 0.5, 0.37, 0.175, WOOD);
    s.boxMin(-0.52, 0.66, -0.19, 0.52, 0.7, 0.19, tone(WOOD, 1.15));
    for (const x of [-0.48, 0.48]) s.boxMin(x - 0.02, 0, -0.175, x + 0.02, 0.66, 0.175, tone(WOOD, 0.9));
    s.boxMin(-0.5, 0.05, -0.175, 0.5, 0.66, -0.15, tone(WOOD, 0.8));
    // lower tiers: folded longyis, a tin box
    ['#2E3D63', '#7A2533', '#D9A93B', '#2F7C7A'].forEach((c, i) => s.boxMin(-0.42, 0.05 + i * 0.055, -0.12, -0.02, 0.1 + i * 0.055, 0.14, c));
    s.boxMin(0.06, 0.05, -0.1, 0.42, 0.22, 0.13, '#3E6B4F');
    s.boxMin(0.06, 0.22, -0.1, 0.42, 0.24, 0.13, P.gold);
    ['#E9DFC9', '#D97C8A'].forEach((c, i) => s.boxMin(-0.4, 0.37 + i * 0.06, -0.12, 0.05, 0.42 + i * 0.06, 0.13, c));
    prism(s, 0.25, 0.47, 0.0, 0.08, 0.09, 0.2, '#C8323C', 8); // thermos
    prism(s, 0.25, 0.59, 0.0, 0.06, 0.06, 0.04, '#E9DFC9', 8);
    // the sewing basket on top
    prism(s, -0.1, 0.78, 0.0, 0.2, 0.16, 0.16, '#C6A868', 10);
    prism(s, -0.1, 0.86, 0.0, 0.21, 0.21, 0.02, '#8C7444', 10);
    const PATCH = ['#C8323C', '#E2B33C', '#2F5DB3', '#3E6B4F', '#D97C8A', '#6B3E64', '#E0795A'];
    PATCH.forEach((c, i) => {
      const a = (i / 7) * PI * 2;
      rbox(s, -0.1 + Math.cos(a) * 0.1, 0.87 + (i % 3) * 0.012, Math.sin(a) * 0.1, 0.13, 0.02, 0.09, c, 0.15 * Math.sin(i), a, 0.12 * Math.cos(i));
    });
    // the half-sewn eighth patch spills over the rim, a bright strip with the needle in it
    rbox(s, -0.12, 0.85, 0.2, 0.26, 0.02, 0.2, '#F0C34A', 0.6, 0, 0);
    rbox(s, 0.08, 0.9, 0.08, 0.28, 0.015, 0.05, '#EDB82E', 0, 0.5, 0);
    seg(s, 0.15, 0.92, 0.04, 0.24, 0.93, 0.0, 0.006, '#E9E5D8');
    prism(s, 0.33, 0.74, -0.06, 0.06, 0.06, 0.07, '#C8323C', 8); // needle cushion
    for (let k = 0; k < 4; k++) seg(s, 0.33 + (k - 1.5) * 0.02, 0.77, -0.06, 0.33 + (k - 1.5) * 0.03, 0.83, -0.06 + (k % 2) * 0.02, 0.006, '#E9E5D8');
    prism(s, 0.36, 0.72, 0.1, 0.03, 0.03, 0.04, '#2F5DB3', 8); // thread spools
    prism(s, 0.42, 0.72, 0.08, 0.03, 0.03, 0.04, '#F4EFE4', 8);
    v.merge(s, mat(-2.45 - 0.33, 0, -0.6, 0, PI / 2, 0));
    solid(room, -2.78, -0.6, 0.4, 1.04, 0.02);
    // the chalked ၈ on the patch
    const EIGHT = A.region(640, 0, 96, 96);
    A.paint(EIGHT, (g, w, h) => { fill(g, 0, 0, w, h, '#F0C34A'); say(g, '၈', w / 2, h / 2 + 4, 66, '#FFFBEF', { weight: 400, alpha: 0.9 }); });
    A.quad(EIGHT, 0.13, 0.13, new THREE.Matrix4().multiplyMatrices(mat(-2.78, 0, -0.6, 0, PI / 2, 0), mat(-0.12, 0.85 + 0.825 * 0.012, 0.2 + 0.565 * 0.012, -PI / 2 + 0.6, 0, 0)));
    // mirror and comb on the wall above
    const mz = -0.95, my = 1.35, mx = -hw + 0.03;
    v.boxMin(mx, my - 0.2, mz - 0.15, mx + 0.04, my + 0.2, mz + 0.15, '#A47A2C');
    v.boxMin(mx + 0.04, my - 0.16, mz - 0.11, mx + 0.05, my + 0.16, mz + 0.11, '#CFE0E8');
    v.boxMin(mx + 0.045, my + 0.02, mz - 0.07, mx + 0.055, my + 0.1, mz - 0.03, '#F4FBFF');
    v.boxMin(mx, my - 0.3, mz + 0.24, mx + 0.08, my - 0.27, mz + 0.42, '#6E4A2E'); // ledge
    v.boxMin(mx + 0.02, my - 0.27, mz + 0.27, mx + 0.06, my - 0.24, mz + 0.4, '#2A2118'); // comb
    prism(v, mx + 0.05, my - 0.22, mz + 0.33, 0.025, 0.025, 0.05, '#E9DFC9', 8); // thanaka pot
  }

  // right wall: tin trunk with a blanket, the weigh-house calendar
  {
    const s = new VoxelBuilder();
    s.boxMin(-0.42, 0.02, -0.21, 0.42, 0.36, 0.21, '#3E6B4F');
    s.boxMin(-0.43, 0.3, -0.22, 0.43, 0.4, 0.22, tone('#3E6B4F', 1.15));
    for (const sx of [-1, 1]) for (const sy of [0.02, 0.33]) s.boxMin(sx * 0.43 - 0.05, sy, 0.2, sx * 0.43 + 0.05, sy + 0.07, 0.225, P.gold);
    s.boxMin(-0.05, 0.27, 0.215, 0.05, 0.35, 0.23, P.gold);
    for (const x of [-0.42, 0.42]) s.boxMin(x - 0.01, 0.0, -0.22, x + 0.01, 0.02, 0.22, '#2A2118');
    s.boxMin(-0.38, 0.4, -0.18, 0.2, 0.5, 0.18, '#C8323C'); // checked blanket
    for (let k = 0; k < 4; k++) s.boxMin(-0.38 + k * 0.15, 0.5, -0.18, -0.32 + k * 0.15, 0.505, 0.18, '#E9DFC9');
    for (const x of [0.28, 0.34]) { prism(s, x, 0.45, 0.08 - (x - 0.28) * 3, 0.03, 0.026, 0.09, '#E6EEF0', 8); }
    v.merge(s, mat(2.6, 0, -1.55, 0, -PI / 2, 0));
    solid(room, 2.6, -1.55, 0.44, 0.88, 0.02);
    const CAL = A.region(736, 0, 160, 224);
    A.paint(CAL, (g, w, h) => {
      fill(g, 0, 0, w, h, '#F6EEDB');
      fill(g, 0, 0, w, 64, '#2F5DB3');
      say(g, 'ချိန်ခွင်ရုံ', w / 2, 32, 24, '#F6EEDB');
      for (let i = 0; i < 25; i++) { const x = 14 + (i % 5) * 28, y = 84 + Math.floor(i / 5) * 28; say(g, String.fromCharCode(0x1040 + ((i + 1) % 10)), x + 8, y, 15, '#2A2118', { weight: 400 }); if (i % 2 === 0 && i < 15) ell(g, x + 8, y, 10, 10, 'rgba(200,50,60,0.22)'); }
    });
    A.quad(CAL, 0.3, 0.42, mat(hw - 0.035, 1.22, 0.4, 0, -PI / 2, 0));
    v.box(hw - 0.03, 1.45, 0.4, 0.03, 0.03, 0.03, '#3E3530');
  }

  // centre: the reed mat, the lacquered low round table, cushions and the day's things on it
  {
    const mx = 0, mz = -0.5, mw = 2.5, md = 2.0;
    v.boxMin(mx - mw / 2, 0, mz - md / 2, mx + mw / 2, 0.012, mz + md / 2, '#7A2533');
    // v2: the checks are rows of merged runs (one box per same-colour run of a row) instead of a box per check
    const NI = 16, NJ = 12, cw = (mw - 0.2) / NI, cd = (md - 0.2) / NJ;
    for (let j = 0; j < NJ; j++) {
      const z0 = mz - md / 2 + 0.1 + j * cd;
      const band = j === 1 || j === 10;
      if (band) {
        for (let i = 0; i < NI; i++) { const x0 = mx - mw / 2 + 0.1 + i * cw; v.boxMin(x0 + 0.004, 0.012, z0 + 0.004, x0 + cw - 0.004, 0.017, z0 + cd - 0.004, i % 2 ? '#3E6B4F' : '#C8323C'); }
      } else {
        // the plain rows: a pale strip, with the darker checks as raised tiles every other cell
        v.boxMin(mx - mw / 2 + 0.104, 0.012, z0 + 0.004, mx + mw / 2 - 0.104, 0.015, z0 + cd - 0.004, '#D9C18A');
        for (let i = (j + 1) % 2; i < NI; i += 2) { const x0 = mx - mw / 2 + 0.1 + i * cw; v.boxMin(x0 + 0.004, 0.015, z0 + 0.006, x0 + cw - 0.004, 0.017, z0 + cd - 0.006, '#C6A96C'); }
      }
    }
    const T = { x: 0, z: -0.5 };
    prism(v, T.x, 0.325, T.z, 0.45, 0.45, 0.05, '#6E1F2A', 12);
    prism(v, T.x, 0.352, T.z, 0.43, 0.43, 0.006, '#7A2533', 12);
    prism(v, T.x, 0.33, T.z, 0.455, 0.455, 0.012, P.gold, 12);
    prism(v, T.x, 0.28, T.z, 0.38, 0.38, 0.05, '#4A141C', 12);
    for (let k = 0; k < 4; k++) { const a = PI / 4 + k * PI / 2; v.box(T.x + Math.cos(a) * 0.3, 0.13, T.z + Math.sin(a) * 0.3, 0.07, 0.26, 0.07, '#4A141C'); }
    solidCircle(room, T.x, T.z, 0.45, 0.04);
    const cushion = (x, z, c) => {
      v.boxMin(x - 0.24, 0.016, z - 0.24, x + 0.24, 0.1, z + 0.24, c);
      v.boxMin(x - 0.25, 0.05, z - 0.25, x + 0.25, 0.065, z + 0.25, P.gold);
      v.boxMin(x - 0.21, 0.1, z - 0.21, x + 0.21, 0.115, z + 0.21, tone(c, 1.12));
    };
    if (day >= 6) { cushion(-0.8, -0.5, '#6E1F2A'); cushion(0.8, -0.5, '#D9A93B'); }
    else { cushion(0, -1.2, '#6E1F2A'); cushion(0.42, 0.32, '#D9A93B'); } // near cushion off the table's sight line
    const ty = 0.355;
    if (day >= 6) {
      // rice bowl, a cup of plain tea (no steam), ledger scraps and a pencil stub
      prism(v, -0.15, ty + 0.04, -0.55, 0.09, 0.06, 0.08, '#F4EFE4', 10);
      prism(v, -0.15, ty + 0.085, -0.55, 0.075, 0.08, 0.02, '#FFFDF8', 10);
      prism(v, -0.15, ty + 0.095, -0.55, 0.06, 0.07, 0.02, '#FBF7EE', 10);
      prism(v, 0.18, ty + 0.03, -0.62, 0.04, 0.035, 0.06, '#E9DFC9', 8);
      prism(v, 0.18, ty + 0.055, -0.62, 0.036, 0.036, 0.004, '#C9952A', 8);
      [[0.05, -0.32, 0.2], [0.2, -0.36, -0.3], [-0.05, -0.75, 0.5], [0.25, -0.8, -0.1]].forEach(([x, z, r]) => v.box(x, ty + 0.004, z, 0.13, 0.004, 0.1, '#F6EEDB', r));
      v.box(0.3, ty + 0.01, -0.45, 0.07, 0.014, 0.014, '#E2B33C', 0.6);
    } else {
      // the covered tiffin, slip «သီဟ» under its handle; a glass of water; a folded cloth
      for (let k = 0; k < 3; k++) {
        prism(v, -0.05, ty + 0.04 + k * 0.075, -0.5, 0.1, 0.095, 0.07, k % 2 ? '#C9C9C2' : '#B9B7AE', 10);
        prism(v, -0.05, ty + 0.077 + k * 0.075, -0.5, 0.104, 0.104, 0.008, '#9E9C94', 10);
      }
      prism(v, -0.05, ty + 0.245, -0.5, 0.07, 0.1, 0.03, '#B9B7AE', 10);
      for (const sx of [-1, 1]) seg(v, -0.05 + sx * 0.11, ty + 0.03, -0.5, -0.05 + sx * 0.11, ty + 0.3, -0.5, 0.018, '#8E8C84');
      seg(v, -0.16, ty + 0.3, -0.5, -0.05, ty + 0.38, -0.5, 0.02, '#8E8C84');
      seg(v, 0.06, ty + 0.3, -0.5, -0.05, ty + 0.38, -0.5, 0.02, '#8E8C84');
      const SLIP = A.region(896, 0, 128, 96);
      A.paint(SLIP, (g, w, h) => { fill(g, 0, 0, w, h, '#F6EEDB'); g.fillStyle = 'rgba(70,110,170,0.4)'; g.fillRect(0, h * 0.7, w, 2); say(g, 'သီဟ', w / 2, h / 2, 44, '#2F3F8A', { weight: 400 }); });
      A.quad(SLIP, 0.12, 0.09, mat(-0.05, ty + 0.35, -0.39, -0.15, 0, 0.08));
      prism(v, 0.22, ty + 0.055, -0.62, 0.035, 0.03, 0.11, '#D7E6EC', 8);
      prism(v, 0.22, ty + 0.04, -0.62, 0.03, 0.027, 0.07, '#B8D2DE', 8);
      v.boxMin(0.12, ty, -0.3, 0.34, ty + 0.02, -0.18, '#E9DCC0');
    }
  }

  // a tin washbasin with a cloth by the pot, a low stool by the trunk, a cast net hung on the right wall
  prism(v, -1.3, 0.05, 2.45, 0.28, 0.22, 0.1, '#8E9A9C', 12);
  prism(v, -1.3, 0.1, 2.45, 0.29, 0.29, 0.012, '#A9B4B6', 12);
  prism(v, -1.3, 0.07, 2.45, 0.22, 0.22, 0.01, '#8FB0BC', 12);
  rbox(v, -1.12, 0.12, 2.38, 0.22, 0.03, 0.12, '#E9DFC9', 0, 0.4, 0.25);
  solidCircle(room, -1.3, 2.45, 0.28, 0.02);
  {
    const st = new VoxelBuilder();
    st.boxMin(-0.2, 0.22, -0.15, 0.2, 0.27, 0.15, '#9A6E48');
    for (const sx of [-1, 1]) st.boxMin(sx * 0.17 - 0.025, 0, -0.13, sx * 0.17 + 0.025, 0.22, 0.13, '#7A5434');
    st.boxMin(-0.14, 0.27, -0.1, 0.1, 0.3, 0.1, '#D97C8A');
    v.merge(st, mat(2.3, 0, 0.3, 0, -0.3, 0));
    solid(room, 2.3, 0.3, 0.45, 0.4, 0.02);
    const nx = hw - 0.03, nz = -2.45;
    v.boxMin(nx - 0.12, 1.75, nz - 0.02, nx, 1.79, nz + 0.02, '#4A3B30');
    v.boxMin(nx - 0.16, 1.05, nz - 0.18, nx - 0.04, 1.77, nz + 0.18, '#D8D4C8');
    for (let k = 0; k < 6; k++) v.boxMin(nx - 0.17, 1.08 + k * 0.11, nz - 0.19, nx - 0.03, 1.1 + k * 0.11, nz + 0.19, '#B9B3A8');
    for (let k = 0; k < 5; k++) v.box(nx - 0.12, 1.02, nz - 0.14 + k * 0.07, 0.05, 0.05, 0.05, '#6E6A64'); // sinker weights
  }

  // front-left: the clay water pot with its cup and a coconut-shell dipper
  waterJar(v, -2.0, 2.1, { s: 0.95, clay: '#A85A36' });
  tinCup(v, -1.97, 0.88, 2.12);
  seg(v, -1.75, 0.4, 2.15, -1.6, 0.95, 2.2, 0.025, '#7A5434');
  prism(v, -1.6, 0.98, 2.2, 0.06, 0.04, 0.05, '#5E3E26', 8);
  solidCircle(room, -2.0, 2.1, 0.28);
  // front-right: a house post with pegs: spare headscarf, Ko Thiha's spare shirt, the broom leaning
  {
    const px = 2.5, pz = 2.1;
    v.boxMin(px - 0.08, 0, pz - 0.08, px + 0.08, 1.95, pz + 0.08, '#6E4A2E');
    v.boxMin(px - 0.1, 0, pz - 0.1, px + 0.1, 0.12, pz + 0.1, '#5E3E26');
    v.boxMin(px, 1.88, pz - 0.06, hw, 1.98, pz + 0.06, '#6E4A2E'); // tie to the wall
    for (const y of [1.6, 1.3]) v.boxMin(px - 0.2, y, pz - 0.02, px - 0.08, y + 0.04, pz + 0.02, '#4A3B30');
    // headscarf draped on the upper peg
    v.boxMin(px - 0.24, 1.18, pz - 0.05, px - 0.16, 1.64, pz + 0.12, '#D97C8A');
    v.boxMin(px - 0.24, 1.16, pz + 0.12, px - 0.16, 1.42, pz + 0.16, '#C86A78');
    for (let k = 0; k < 5; k++) v.box(px - 0.2, 1.14, pz - 0.03 + k * 0.035, 0.012, 0.04, 0.012, '#F4EFE4');
    // the spare shirt on the lower peg (front of the post, facing the room)
    v.boxMin(px - 0.38, 0.86, pz - 0.18, px - 0.18, 1.32, pz + 0.18, '#2F7C7A');
    v.boxMin(px - 0.36, 1.2, pz - 0.3, px - 0.2, 1.32, pz - 0.18, '#2F7C7A');
    v.boxMin(px - 0.36, 1.2, pz + 0.18, px - 0.2, 1.32, pz + 0.3, '#2F7C7A');
    v.boxMin(px - 0.39, 1.0, pz + 0.05, px - 0.37, 1.12, pz + 0.14, tone('#2F7C7A', 0.8)); // pocket
    for (let k = 0; k < 3; k++) v.box(px - 0.385, 1.25 - k * 0.12, pz - 0.0, 0.01, 0.025, 0.025, '#F4EFE4');
    // broom
    seg(v, px - 0.2, 0.05, pz + 0.3, px - 0.05, 1.5, pz + 0.12, 0.035, '#C9B66A');
    for (let k = 0; k < 9; k++) seg(v, px - 0.19, 0.38, pz + 0.3, px - 0.32 + k * 0.035, 0.0, pz + 0.38 + (k % 3) * 0.03, 0.025, k % 2 ? '#D8C27E' : '#B9A55A');
    v.box(px - 0.18, 0.38, pz + 0.3, 0.06, 0.05, 0.06, '#C8323C');
    solid(room, px - 0.12, pz + 0.05, 0.6, 0.6, 0.0);
  }

  room.group.add(asStatic(v));

  // ambient: lamp flame, window glints, motes, rain
  const motes = Array.from({ length: 8 }, (_, i) => {
    const p = dyn.part();
    dyn.box(p, 0, 0, 0, 0.024, 0.024, 0.024, i % 3 ? '#FFF4CF' : '#F3D27A');
    return p;
  });
  tick.push((dt, t, st) => {
    const f = Math.max(0.35, st.evening);
    const k = (0.8 + 0.2 * Math.sin(t * 12.5) * Math.sin(t * 6.1)) * f;
    dyn.set(flame, -2.64, 0.45, -2.67, 0, t * 1.5, 0.06 * Math.sin(t * 5), k, k * (0.9 + 0.25 * Math.sin(t * 15)), k);
    for (let i = 0; i < glints.length; i++) {
      const u = frac(t * 0.12 + i * 0.27);
      const s = Math.sin(u * PI) * (1 - st.evening);
      dyn.set(glints[i], WX - 0.42 + u * 0.84, WY - 0.06 - (i % 2) * 0.12 - i * 0.03, z + 0.04, 0, 0, 0, s);
    }
    for (let i = 0; i < motes.length; i++) {
      const u = frac(t * 0.04 + i * 0.41);
      const s = Math.sin(u * PI) * (0.6 + 0.4 * Math.sin(t * 2 + i)) * (1 - st.evening);
      dyn.set(motes[i], WX + (rnd(i) - 0.5) * 0.9 + Math.sin(t * 0.3 + i) * 0.12, 0.4 + u * 1.3, -hd + 0.6 + rnd(i + 3) * 0.9, t * 0.5 + i, t * 0.6, 0, s);
    }
    for (const d of rainDrops) {
      if (!st.rain) { dyn.hide(d.p); continue; }
      const u = frac(t * 0.5 + d.o);
      dyn.set(d.p, d.x, d.y0 + (d.y1 - d.y0) * u, d.z, 0, 0, 0, 1, 0.6 + u * 0.8, 1);
    }
  });

  room.stations = stationsFrom([
    { id: 'table', x: 0.95, z: 0.5, look: { x: 0, z: -0.5 }, at: { x: 0, y: 0.45, z: -0.5 }, name: { my: 'စားပွဲပု', en: 'the low table' } },
    { id: 'tiffin', x: 0.95, z: 0.5, look: { x: 0, z: -0.5 }, at: { x: -0.05, y: 0.6, z: -0.5 }, name: { my: 'ထမင်းချိုင့်', en: 'the tiffin' } },
    { id: 'list', x: 1.4, z: -1.95, look: { x: 1.4, z: -hd }, at: { x: 1.4, y: 1.4, z: -hd }, name: { my: 'ကိုသီဟရဲ့ စာရင်း', en: "Ko Thiha's list" } },
    { id: 'basket', x: -1.85, z: -0.6, look: { x: -2.6, z: -0.6 }, at: { x: -2.6, y: 0.85, z: -0.6 }, name: { my: 'အပ်ချုပ်ခြင်း', en: 'the sewing basket' } },
    { id: 'lamp', x: -1.95, z: -1.95, look: { x: -2.69, z: -2.67 }, at: { x: -2.69, y: 0.45, z: -2.67 }, name: { my: 'ဆီမီးခွက်', en: 'the oil lamp' } },
    { id: 'window', x: -1.2, z: -2.05, look: { x: WX, z: -hd }, at: { x: WX, y: WY, z: -hd }, name: { my: 'ပြတင်းပေါက်', en: 'the window' } },
    { id: 'shirt', x: 1.75, z: 1.6, look: { x: 2.5, z: 2.1 }, at: { x: 2.25, y: 1.1, z: 2.1 }, name: { my: 'အင်္ကျီချိတ်', en: 'the shirt hook' } },
  ]);
  room.spots = day >= 6
    ? { entry: { x: 0, z: 2.3, h: PI }, kothiha: { x: -0.8, z: -0.5, h: PI / 2, sit: 0.1, who: 'kothiha' }, maya: { x: 0.8, z: -0.5, h: -PI / 2, sit: 0.1 } }
    : { entry: { x: 0, z: 2.3, h: PI }, kothiha: { x: 0, z: -1.2, h: 0, sit: 0.1, who: 'kothiha' }, maya: { x: 0.42, z: 0.32, h: face(0.42, 0.32, 0, -0.5), sit: 0.1 } };
  Object.assign(room.spots, {
    kothihaStand: { x: 1.0, z: -1.8, h: face(1.0, -1.8, 1.4, -hd), who: 'kothiha' },
    basket: { x: -1.85, z: -0.6, h: -PI / 2 },
    list: { x: 1.4, z: -1.95, h: PI },
    window: { x: -1.2, z: -2.05, h: PI },
  });
  room.props = {};
  return finishRoom(room, { atlas: A, dyn, glow, shafts, dusk, shade, tick });
}

// =============================================================================================
// 3. caneshed · U Bo Lay's reed shed at the head of Cane Jetty (Day 6; 14, 15) · 7 × 6 × 2.8
// =============================================================================================
function caneRack(s, { w = 2.1, d = 0.6, h = 1.55, seed = 1, turned = false } = {}) {
  const POST = '#7A5434';
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) seg(s, sx * w / 2, 0, sz * d / 2, sx * w / 2, h, sz * d / 2 * 0.4, 0.07, POST);
    s.box(sx * w / 2, h - 0.02, 0, 0.08, 0.06, d * 0.6, tone(POST, 1.1));
    s.box(sx * w / 2, 0.25, 0, 0.05, 0.05, d * 0.95, tone(POST, 0.9));
  }
  const levels = [0.45, 0.9, 1.35];
  const C = ['#C9B66A', '#B9A55A', '#D8C27E', '#A89650', '#C2B064', '#D2BC74'];
  levels.forEach((y, li) => {
    const dz = d / 2 * (1 - (y / h) * 0.6);
    for (const sz of [-1, 1]) s.box(0, y, sz * dz, w + 0.12, 0.045, 0.045, tone(POST, 1.05));
    const n = 10 - li;
    for (let k = 0; k < n; k++) {
      const zz = -dz + 0.06 + k * ((dz * 2 - 0.12) / (n - 1));
      const c = pick(C, seed * 11 + li * 7 + k);
      if (turned && li === 1 && k === 2) {
        // one length half-turned: its shaded half up, angled a little out of the row
        s.box(-0.35, y + 0.05, zz + 0.02, w * 0.62, 0.055, 0.055, tone(c, 0.78), 0.12);
        s.box(0.62, y + 0.05, zz + 0.1, w * 0.5, 0.055, 0.055, tone(c, 1.12), 0.12);
        continue;
      }
      const yy = y + 0.045 + (k % 2) * 0.012;
      s.box((rnd(seed + k + li * 3) - 0.5) * 0.18, yy, zz, w + 0.3 + rnd(k * 3 + li) * 0.2, 0.055, 0.055, c);
      s.box((rnd(seed + k + li * 3) - 0.5) * 0.18, yy + 0.026, zz - 0.012, w + 0.2, 0.008, 0.02, tone(c, 1.12)); // lit top
      for (let nd = -1; nd <= 1; nd++) s.box(nd * 0.62 + (rnd(k + nd * 5) - 0.5) * 0.2, yy, zz, 0.035, 0.065, 0.065, tone(c, 0.8));
    }
  });
}
function buildCaneshed(opts = {}) {
  const day = opts.day ?? 6;
  const W = 7, D = 6, H = 2.8, hw = W / 2, hd = D / 2;
  const REED = '#D9BC6E', REED_D = '#A88A4A', EARTH = '#8A6648';
  const room = kit.createRoom({ width: W, depth: D, height: H, wall: REED, wainscot: REED_D, trim: '#8C6A28', floor: 'carpet', floorColor: EARTH, background: '#E8DDC0' });
  room.id = 'caneshed';
  const A = makeAtlas(1024);
  const dyn = makeDyn();
  const glow = makeGlow('lampGlow');
  const shafts = makeGlow('lightShafts');
  const dusk = makeGlow('dusk', { additive: false, textured: false });
  const shade = makeShade();
  const tick = [];
  const v = new VoxelBuilder();
  for (const [x, z, rx, rz] of [[-1.2, -2.2, 1.25, 0.45], [1.6, -2.2, 1.25, 0.45], [-2.92, -1.0, 0.6, 0.85], [3.05, -0.85, 0.42, 0.85], [1.2, 0.7, 0.95, 0.38], [-2.6, 1.9, 0.42, 0.42], [0.2, -2.7, 0.25, 0.25], [2.35, 1.0, 0.22, 0.22], [0, -2.85, 3.6, 0.35], [-3.35, 0, 0.3, 3.0], [3.35, 0, 0.3, 3.0]]) shade.add(x, z, rx, rz, 0.8);

  // packed earth: soft patches in four tones (own mesh, no outline), dry leaves, offcuts along the walls
  const fv = new VoxelBuilder();
  fv.boxMin(-hw, 0.005, -hd, hw, 0.008, hd, EARTH);
  // v2: no blotchy octagons — a plain two-tone earth (paler, tamped lanes where feet go) plus a fine straw scatter
  const TAMP = '#8E6B4C';
  // the tamped lanes: door → bench, door → racks, racks ↔ tally (low-contrast rectangles, slightly turned)
  [[0.55, 1.35, 1.6, 1.3, 0.3], [-0.55, 0.2, 1.0, 2.6, -0.32], [0.2, -1.45, 4.6, 0.55, 0.0], [2.2, -0.55, 1.1, 0.9, 0.15], [1.2, 1.1, 1.9, 0.75, 0.0]].forEach(([x, z, w, d, r]) => {
    fv.box(x, 0.0095, z, w, 0.003, d, TAMP, r);
    fv.box(x, 0.0098, z, w * 0.7, 0.003, d * 0.62, tone(TAMP, 1.025), r);
  });
  // a darker damp band along the walls' foot
  fv.boxMin(-hw, 0.0093, -hd, hw, 0.0123, -hd + 0.32, tone(EARTH, 0.9));
  for (const sx of [-1, 1]) fv.boxMin(sx > 0 ? hw - 0.26 : -hw, 0.0093, -hd, sx > 0 ? hw : -hw + 0.26, 0.0123, hd, tone(EARTH, 0.92));
  // straw and fibre scatter: short thin flecks, two tones, denser under the racks and round the bench
  for (let i = 0; i < 110; i++) {
    const near = i % 3 === 0;
    const x = near ? 1.2 + (rnd(i * 2.3) - 0.5) * 2.4 : -hw + 0.35 + rnd(i * 9.1) * (W - 0.7);
    const z = near ? 0.8 + (rnd(i * 4.7) - 0.5) * 1.5 : -hd + 0.4 + rnd(i * 4.3) * (D - 0.8);
    fv.box(x, 0.0125, z, 0.05 + rnd(i * 1.7) * 0.07, 0.002, 0.012, pick(['#C9B66A', '#B9A55A', '#A68560', '#D8C27E'], i), rnd(i) * 3);
  }
  {
    const fm = fv.mesh({ outline: false });
    fm.name = 'floorDecals';
    fm.userData.dynamic = true;
    room.group.add(fm);
  }
  for (let i = 0; i < 12; i++) v.box(-hw + 0.5 + rnd(i * 7.3) * (W - 1), 0.0145, -hd + 0.6 + rnd(i * 3.1) * (D - 1.2), 0.08, 0.006, 0.05, i % 2 ? '#B89A5A' : '#8E7A3E', rnd(i) * 3);
  const OFF = ['#C9B66A', '#B9A55A', '#D8C27E', '#A89650'];
  [[-3.2, 0.1, 0.9], [-3.25, 0.6, 1.8], [-3.1, 1.2, 0.4], [3.2, 0.7, 0.8], [3.15, 1.3, 2.2], [3.25, 1.9, 1.2], [-0.4, -2.75, 0.3], [0.3, -2.8, 1.7], [-2.6, -2.75, 2.6]].forEach(([x, z, r], i) => {
    v.box(x, 0.025, z, 0.32 + rnd(i) * 0.3, 0.035, 0.035, pick(OFF, i), r);
    v.box(x + 0.08, 0.025, z + 0.06, 0.18, 0.03, 0.03, pick(OFF, i + 2), r + 0.4);
  });
  // light through the reeds: thin bright stripes on the floor (fade at evening)
  for (let i = 0; i < 9; i++) shafts.quad(0.05 + rnd(i) * 0.05, 2.4 + rnd(i + 2) * 1.2, mat(-2.6 + i * 0.62, 0.017, -1.2 + rnd(i + 5) * 0.6, -PI / 2, 0, 0.35), '#FFE7A8');
  shafts.pool(0.2, -1.6, 1.7, 1.0, '#FFE2A0', 0.018);

  // reed walls: upright stalks with nodes, split-bamboo laths tying them, darker below
  const RT = ['#D9BC6E', '#CFB062', '#E2C67C', '#C9A85A', '#D4B468'];
  for (const f of wallFaces(room)) {
    const top = f.face === 'back' ? H - 0.12 : Math.max(0.42, f.top);
    let i = 0;
    for (let a = f.a0; a < f.a1 - 0.01; a += 0.075, i++) {
      const a1 = Math.min(f.a1, a + 0.068);
      wbox(v, room, f.face, a, a1, 0.12, Math.min(1.0, top), 0.02, tone(pick(RT, i * 1.3 + f.a0), 0.78));
      if (top > 1.05) wbox(v, room, f.face, a, a1, 1.0, top - (rnd(i + f.a0) * 0.05), 0.02, tone(pick(RT, i * 1.3 + f.a0), 0.96 + rnd(i) * 0.08));
      if (i % 2 === 0) for (const ny of [0.55, 1.55, 2.25]) if (ny < top - 0.05) wbox(v, room, f.face, a - 0.004, a1 + 0.004, ny + rnd(i * 3 + ny) * 0.2, ny + 0.03 + rnd(i * 3 + ny) * 0.2, 0.026, '#B08C48');
    }
    for (const ly of [0.62, 1.42, 2.22]) if (ly < top - 0.05) wbox(v, room, f.face, f.a0, f.a1, ly, ly + 0.05, 0.035, '#8C6A3A');
  }
  // corner posts and the thatch fringe of the reed roof along the back
  for (const x of [-hw + 0.06, hw - 0.06]) v.boxMin(x - 0.08, 0, -hd, x + 0.08, H + 0.1, -hd + 0.14, '#6E4A2E');
  v.boxMin(-hw - 0.2, H - 0.05, -hd - 0.1, hw + 0.2, H + 0.05, -hd + 0.18, '#6E4A2E');
  for (let i = 0; i < 70; i++) {
    const x = -hw - 0.15 + i * (W + 0.3) / 70;
    v.box(x, H + 0.0 - rnd(i) * 0.08, -hd + 0.2, 0.11, 0.22 + rnd(i + 3) * 0.12, 0.08, pick(['#C9A85A', '#B89A4A', '#D9BC6E', '#A88A4A'], i), 0);
  }

  // back wall: two drying racks (roof off), a hurricane lamp on a peg, the old man's dah knives
  {
    const s1 = new VoxelBuilder();
    caneRack(s1, { seed: 3, turned: true });
    v.merge(s1, mat(-1.2, 0, -2.2));
    const s2 = new VoxelBuilder();
    caneRack(s2, { seed: 7 });
    v.merge(s2, mat(1.6, 0, -2.2));
    solid(room, -1.2, -2.2, 2.3, 0.62, 0.04);
    solid(room, 1.6, -2.2, 2.3, 0.62, 0.04);
    // tall uncut stems leaning in the corners
    for (let k = 0; k < 5; k++) seg(v, -3.3 + k * 0.05, 0.0, -2.55 + k * 0.03, -3.42 + k * 0.02, 2.5 + k * 0.08, -2.9, 0.05, pick(OFF, k + 4));
    for (let k = 0; k < 4; k++) seg(v, 3.25 - k * 0.05, 0.0, -2.5 + k * 0.04, 3.4 - k * 0.02, 2.45 + k * 0.06, -2.9, 0.05, pick(OFF, k + 1));
    // knives on pegs between the racks
    for (const [x, r] of [[0.15, -0.15], [0.32, 0.1]]) {
      v.box(x, 1.82, -hd + 0.04, 0.03, 0.03, 0.06, '#3E3530');
      rbox(v, x, 1.62, -hd + 0.06, 0.06, 0.26, 0.012, '#8E9A9C', 0, 0, r);
      rbox(v, x + Math.sin(r) * 0.18, 1.86, -hd + 0.06, 0.035, 0.16, 0.03, '#5E3E26', 0, 0, r);
    }
    // straw hat on a peg, back-left
    v.box(-2.9, 1.95, -hd + 0.04, 0.03, 0.03, 0.08, '#3E3530');
    prism(v, -2.9, 1.85, -hd + 0.1, 0.012, 0.3, 0.14, '#D9C18A', 10, PI / 2, 0);
    prism(v, -2.9, 1.85, -hd + 0.04, 0.3, 0.3, 0.02, '#B89A5A', 10, PI / 2, 0);
    // whetstone on a stump between the racks
    prism(v, 0.2, 0.17, -2.7, 0.16, 0.18, 0.34, '#7A5434', 8);
    ring(v, 0.2, 0.34, -2.7, 0.12, 0.01, '#B58A5A', 'xz', 8);
    v.box(0.2, 0.37, -2.7, 0.2, 0.05, 0.07, '#6E6A64');
    solidCircle(room, 0.2, -2.7, 0.18);
  }
  // hanging lamp: rope from a peg under the wall plate, swinging a little (all dyn)
  const LAMP = { x: 0.2, y: H - 0.14, z: -hd + 0.34 };
  v.box(LAMP.x, LAMP.y, -hd + 0.18, 0.05, 0.05, 0.34, '#5E3E26');
  glow.halo(LAMP.x, LAMP.y - 0.72, LAMP.z + 0.15, 0.7, '#FFC970');
  glow.pool(0.1, -1.4, 1.8, 1.2, '#FFB65A');
  const lampP = dyn.part();
  {
    const LB = '#2F3B36';
    dyn.box(lampP, 0, -0.25, 0, 0.014, 0.5, 0.014, '#7A5434');
    dyn.box(lampP, 0, -0.53, 0, 0.012, 0.08, 0.012, '#4A3B30');
    dyn.box(lampP, 0, -0.59, 0, 0.1, 0.05, 0.1, tone(LB, 1.2));
    dyn.box(lampP, 0, -0.63, 0, 0.18, 0.04, 0.18, LB);
    dyn.box(lampP, 0, -0.73, 0, 0.13, 0.16, 0.13, '#F4E2B0');
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) dyn.box(lampP, dx * 0.075, -0.73, dz * 0.075, 0.018, 0.18, 0.018, LB);
    dyn.box(lampP, 0, -0.83, 0, 0.16, 0.04, 0.16, tone(LB, 1.2));
    dyn.box(lampP, 0, -0.87, 0, 0.2, 0.04, 0.2, LB);
  }
  const lampFl = dyn.part();
  dyn.box(lampFl, 0, 0, 0, 0.035, 0.07, 0.035, '#FFB53A');
  dyn.box(lampFl, 0, 0.03, 0, 0.018, 0.04, 0.018, '#FFF1B8');

  // right wall: the tally board (every bundle counted), three tight bundles under it
  const TAL = A.region(0, 0, 512, 384);
  // v2: 1.33× larger, a darker slate, full-strength chalk; the board hangs turned a little toward the room
  const CT = { z: -0.9, y: 1.38, w: 1.2, h: 0.88, yaw: 0.24 };
  A.paint(TAL, (g, w, h) => {
    fill(g, 0, 0, w, h, '#6E4A2E');
    for (let i = 0; i < 6; i++) fill(g, 0, i * h / 6, w, 3, 'rgba(0,0,0,0.18)');
    g.save(); g.translate(16, 16); slate(g, w - 32, h - 32, '#22261F'); g.restore();
    const CHK = '#FFFDF4';
    say(g, 'စည်းရေ', w / 2, 52, 46, CHK);
    g.fillStyle = CHK; g.fillRect(60, 80, w - 120, 4);
    const days = ['တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး'];
    const counts = [17, 20, 18, day >= 6 ? 12 : 6];
    days.forEach((d, i) => {
      const y = 122 + i * 62;
      say(g, d, 34, y, 28, i === 3 ? '#FFE27A' : CHK, { align: 'left', max: 150 });
      g.fillStyle = CHK;
      for (let t = 0; t < counts[i]; t++) {
        const x = 200 + (t % 5) * 12 + Math.floor(t / 5) * 72;
        if (t % 5 === 4) { g.save(); g.translate(x - 24, y); g.rotate(-1.0); g.fillRect(-2.5, -22, 5, 48); g.restore(); }
        else g.fillRect(x - 2.5, y - 18, 5, 36);
      }
    });
  });
  {
    // turned toward the open front: the front edge rests near the wall, the back edge swings out into the room
    const tz = CT.z, ty = CT.y, x = hw - 0.03, sy = Math.sin(CT.yaw) * CT.w / 2, cy = Math.cos(CT.yaw) * CT.w / 2;
    const cx = x - 0.1 - sy, R = mat(cx, ty, tz, 0, -PI / 2 + CT.yaw, 0);
    const bk = new VoxelBuilder();
    bk.boxMin(-CT.w / 2 - 0.05, -CT.h / 2 - 0.05, -0.05, CT.w / 2 + 0.05, CT.h / 2 + 0.05, -0.005, '#5E3E26');
    bk.boxMin(-CT.w / 2 - 0.05, CT.h / 2 + 0.01, -0.005, CT.w / 2 + 0.05, CT.h / 2 + 0.05, 0.01, tone('#5E3E26', 1.2)); // lit top rail
    bk.boxMin(-CT.w / 2, -CT.h / 2 - 0.1, -0.05, CT.w / 2, -CT.h / 2 - 0.05, 0.08, '#6E4A2E'); // chalk ledge
    bk.box(-0.25, -CT.h / 2 - 0.035, 0.03, 0.07, 0.025, 0.025, '#F4F1E6');
    bk.box(-0.14, -CT.h / 2 - 0.035, 0.035, 0.05, 0.025, 0.025, '#F4F1E6');
    v.merge(bk, R);
    A.quad(TAL, CT.w, CT.h, new THREE.Matrix4().multiplyMatrices(R, mat(0, 0, 0.002)));
    const ny = ty + CT.h / 2 + 0.24;
    v.boxMin(x - 0.08, ny - 0.02, tz - 0.02, x, ny + 0.02, tz + 0.02, '#3E3530'); // the nail
    seg(v, x - 0.07, ny, tz, cx - sy * 0.85, ty + CT.h / 2 + 0.05, tz - cy * 0.85, 0.014, '#7A5434'); // hanging cord
    seg(v, x - 0.07, ny, tz, cx + sy * 0.85, ty + CT.h / 2 + 0.05, tz + cy * 0.85, 0.014, '#7A5434');
    const b = new VoxelBuilder();
    caneBundle(b, 3.2, 0, -0.85, { rotY: PI / 2, seed: 2 });
    caneBundle(b, 2.88, 0, -0.87, { rotY: PI / 2, seed: 5 });
    caneBundle(b, 3.04, 0.21, -0.83, { rotY: PI / 2 + 0.04, seed: 9 });
    v.merge(b);
    solid(room, 3.05, -0.85, 0.62, 1.35, 0.04);
  }

  // back-left: the cutter's stack of bundles (3-2-1)
  {
    const b = new VoxelBuilder();
    [[-3.22, 0, 1], [-2.92, 0, 4], [-2.62, 0, 6], [-3.07, 0.21, 8], [-2.77, 0.21, 10], [-2.92, 0.42, 12]].forEach(([x, y, sd]) => caneBundle(b, x, y, -1.0, { rotY: PI / 2 + (rnd(sd) - 0.5) * 0.06, seed: sd }));
    v.merge(b);
    solid(room, -2.92, -1.0, 0.9, 1.35, 0.04);
    // a coil of rope on a peg on the left wall above it
    v.boxMin(-hw, 1.5, -2.05, -hw + 0.14, 1.54, -2.0, '#5E3E26');
    ring(v, -hw + 0.1, 1.3, -2.02, 0.2, 0.045, '#B8935F', 'yz', 12);
    ring(v, -hw + 0.13, 1.32, -2.02, 0.17, 0.04, '#C9A576', 'yz', 12);
  }

  // centre-right: U Bo Lay's tying bench, binding coil, a half-tied bundle, his knife and lunch tin
  {
    const BX = 1.2, BZ = 0.7;
    const s = new VoxelBuilder();
    s.boxMin(-0.8, 0.28, -0.2, 0.8, 0.36, 0.2, '#8A6040');
    s.boxMin(-0.8, 0.3, 0.16, 0.8, 0.36, 0.2, tone('#8A6040', 1.15));
    for (const x of [-0.62, 0.62]) {
      for (const sz of [-1, 1]) seg(s, x, 0, sz * 0.18, x, 0.29, sz * 0.1, 0.06, '#6E4A2E');
      s.box(x, 0.14, 0, 0.05, 0.05, 0.3, '#6E4A2E');
    }
    ring(s, -0.58, 0.38, 0.0, 0.12, 0.04, '#9C7A3E', 'xz', 10);
    ring(s, -0.58, 0.42, 0.0, 0.1, 0.035, '#B08C48', 'xz', 10);
    seg(s, -0.48, 0.4, 0.06, -0.3, 0.37, 0.2, 0.025, '#B08C48');
    caneBundle(s, 0.48, 0.36, 0.0, { len: 0.9, r: 0.1, seed: 21 });
    rbox(s, -0.3, 0.37, -0.1, 0.22, 0.012, 0.05, '#8E9A9C', 0, 0.3, 0);
    s.boxMin(-0.18, 0.36, -0.14, -0.12, 0.38, -0.02, '#5E3E26');
    for (let k = 0; k < 2; k++) prism(s, 0.7, 0.42 + k * 0.07, -0.08, 0.07, 0.068, 0.065, '#B9B7AE', 10);
    v.merge(s, mat(BX, 0, BZ));
    solid(room, BX, BZ, 1.6, 0.42, 0.05);
    // a low stool and his slippers
    prism(v, 2.35, 0.13, 1.0, 0.16, 0.18, 0.26, '#7A5434', 8);
    for (const dx of [-0.07, 0.07]) v.boxMin(1.2 + dx - 0.05, 0.003, 1.15, 1.2 + dx + 0.05, 0.028, 1.42, '#2A2118');
  }

  // v2 centre: a splitting stump with fanned binding strips, a basket of strips, a rope coil by the bench, offcuts
  {
    const sx = -0.45, sz = -0.55;
    prism(v, sx, 0.2, sz, 0.21, 0.24, 0.4, '#7A5434', 10);
    prism(v, sx, 0.405, sz, 0.2, 0.2, 0.012, '#C9A576', 10); // pale cut face
    ring(v, sx, 0.412, sz, 0.12, 0.008, '#A9794E', 'xz', 10); // growth ring
    rbox(v, sx + 0.05, 0.43, sz - 0.02, 0.26, 0.02, 0.06, '#8E9A9C', 0, 0.6, 0); // the dah laid flat on the stump
    rbox(v, sx - 0.1, 0.44, sz + 0.06, 0.13, 0.035, 0.04, '#5E3E26', 0, 0.6, 0);
    seg(v, sx + 0.12, 0.38, sz + 0.15, sx + 0.95, 0.03, sz + 0.25, 0.04, '#C9B66A'); // a length being split, leaning on the stump
    seg(v, sx + 0.12, 0.385, sz + 0.2, sx + 0.95, 0.035, sz + 0.32, 0.025, '#D8C27E');
    for (let k = 0; k < 11; k++) {
      const a = -0.9 + k * 0.17, L = 0.55 + rnd(k + 60) * 0.35;
      const x0 = sx - 0.25 + Math.cos(a + PI) * 0.1, z0 = sz + 0.25;
      v.box(x0 - Math.cos(a) * L / 2, 0.016 + (k % 3) * 0.004, z0 + Math.sin(a) * L / 2 * 0.6, L, 0.008, 0.02, pick(['#D8C27E', '#C9B66A', '#E2CD8C', '#B9A55A'], k), a);
    }
    solidCircle(room, sx, sz, 0.24);
    shade.add(sx, sz, 0.3, 0.3);
    // a flat basket of stripped binding beside it
    const bx = 0.35, bz = -0.85;
    prism(v, bx, 0.06, bz, 0.32, 0.28, 0.12, '#B89A5A', 10);
    prism(v, bx, 0.125, bz, 0.33, 0.33, 0.02, '#8C7444', 10);
    for (let k = 0; k < 6; k++) ring(v, bx + (rnd(k + 5) - 0.5) * 0.18, 0.13 + k * 0.012, bz + (rnd(k + 9) - 0.5) * 0.14, 0.08 + rnd(k) * 0.05, 0.012, pick(['#D8C27E', '#C9B66A', '#E2CD8C'], k), 'xz', 8);
    solidCircle(room, bx, bz, 0.3);
    shade.add(bx, bz, 0.34, 0.3);
    // a rope coil and its loose end on the earth by the bench's left end
    for (let k = 0; k < 3; k++) ring(v, 0.08, 0.03 + k * 0.05, 0.55, 0.2 - k * 0.025, 0.05, k % 2 ? '#C9A576' : '#B8935F', 'xz', 12);
    seg(v, 0.27, 0.03, 0.62, 0.5, 0.025, 0.95, 0.045, '#C9A576');
    seg(v, 0.5, 0.025, 0.95, 0.38, 0.02, 1.22, 0.045, '#C9A576');
    solidCircle(room, 0.08, 0.55, 0.2);
    // more offcuts: short ends and shavings round the bench and the stump
    [[0.55, 1.05, 0.3], [0.95, 1.25, -0.8], [1.75, 1.2, 1.1], [2.05, 0.35, 0.4], [-0.1, -0.15, 1.6], [-0.85, -0.95, -0.5], [0.0, -1.25, 0.9], [-1.1, 0.4, 2.3]].forEach(([x, z, r], i) => {
      v.box(x, 0.022, z, 0.2 + rnd(i + 50) * 0.22, 0.03, 0.03, pick(OFF, i), r);
      v.box(x + 0.06, 0.016, z + 0.05, 0.08, 0.012, 0.02, pick(OFF, i + 3), r + 1.1);
    });
  }

  // just inside the door, left: the water jar on its stand, a tin cup on a nail on the stand's post
  {
    const jx = -2.6, jz = 1.9;
    waterJar(v, jx, jz, { s: 1.0, clay: '#9E5434' });
    v.boxMin(jx - 0.32, 0, jz - 0.04, jx - 0.26, 1.15, jz + 0.04, '#6E4A2E');
    v.box(jx - 0.24, 1.02, jz, 0.05, 0.015, 0.015, '#3E3530');
    tinCup(v, jx - 0.18, 0.88, jz, '#B9B7AE');
    seg(v, jx - 0.21, 0.98, jz, jx - 0.2, 1.02, jz, 0.008, '#3E3530');
    // wet ring on the earth under it
    prism(v, jx + 0.15, 0.006, jz + 0.25, 0.18, 0.18, 0.004, '#6E5038', 10);
    solidCircle(room, jx, jz, 0.32);
  }

  // fresh green cane brought in by the cutters, lying in a loose pile at the front right, leaves still on
  {
    const G = ['#8DBA6E', '#7FA85E', '#9CC47A', '#6F9E5B', '#A8C27E'];
    for (let k = 0; k < 9; k++) {
      const x0 = 1.5 + rnd(k * 3.3) * 0.5, z0 = 2.55 + rnd(k * 1.7) * 0.25;
      const a = -0.35 + rnd(k * 5.9) * 0.3;
      const L = 1.4 + rnd(k) * 0.4;
      const y = 0.04 + (k > 5 ? 0.06 : 0) + (k % 2) * 0.01;
      v.box(x0 + Math.cos(a) * L / 2, y, z0 - Math.sin(a) * L / 2, L, 0.06, 0.06, pick(G, k), a);
      v.box(x0 + Math.cos(a) * (L - 0.02), y + 0.02, z0 - Math.sin(a) * (L - 0.02), 0.2, 0.03, 0.14, P.leafDark, a + 0.5);
      v.box(x0 + Math.cos(a) * (L + 0.08), y + 0.02, z0 - Math.sin(a) * (L + 0.08), 0.16, 0.025, 0.1, P.leaf, a - 0.4);
    }
    solid(room, 2.4, 2.45, 1.5, 0.6, 0.0);
  }

  room.group.add(asStatic(v));

  // ambient: lamp swing + flame, motes in the reed light, rain drips through the roof
  const motes = Array.from({ length: 10 }, (_, i) => {
    const p = dyn.part();
    dyn.box(p, 0, 0, 0, 0.024, 0.024, 0.024, i % 3 ? '#FFF4CF' : '#F3D27A');
    return p;
  });
  const drips = [[-0.4, -1.0], [2.2, 1.6], [-1.8, 0.35]].map(([x, zz], i) => {
    const p = dyn.part();
    dyn.box(p, 0, 0, 0, 0.025, 0.07, 0.025, '#DCEBF5');
    const pd = dyn.part();
    dyn.box(pd, 0, 0, 0, 0.3, 0.006, 0.22, '#6F5A48');
    return { p, pd, x, z: zz, o: i * 0.37 };
  });
  tick.push((dt, t, st) => {
    const sw = Math.sin(t * 1.3) * 0.06 + Math.sin(t * 0.7) * 0.03;
    dyn.set(lampP, LAMP.x, LAMP.y, LAMP.z, sw * 0.4, 0, sw);
    const f = st.evening;
    if (f < 0.01) dyn.hide(lampFl);
    else {
      const k = (0.75 + 0.25 * Math.sin(t * 13) * Math.sin(t * 7.1)) * f;
      dyn.set(lampFl, LAMP.x + Math.sin(sw) * 0.75, LAMP.y - Math.cos(sw) * 0.75, LAMP.z - Math.sin(sw * 0.4) * 0.75, 0, t, sw, k);
    }
    for (let i = 0; i < motes.length; i++) {
      const u = frac(t * 0.035 + i * 0.29);
      const s = Math.sin(u * PI) * (0.5 + 0.5 * Math.sin(t * 2.2 + i)) * (1 - f);
      dyn.set(motes[i], -2.6 + rnd(i) * 5.2 + Math.sin(t * 0.3 + i) * 0.15, 0.4 + u * 1.8, -1.8 + rnd(i + 4) * 2.4, t * 0.4 + i, t * 0.6, 0, s);
    }
    for (const d of drips) {
      if (!st.rain) { dyn.hide(d.p); dyn.hide(d.pd); continue; }
      const u = frac(t * 0.9 + d.o);
      dyn.set(d.p, d.x, H - 0.1 - u * (H - 0.15), d.z, 0, 0, 0, 1, 1 + u, 1);
      dyn.set(d.pd, d.x, 0.012, d.z, 0, d.o * 3, 0, 1 + 0.08 * Math.sin(t * 4 + d.o * 9));
    }
  });

  room.stations = stationsFrom([
    { id: 'rack', x: -1.2, z: -1.3, look: { x: -1.2, z: -2.2 }, at: { x: -1.2, y: 0.95, z: -2.2 }, name: { my: 'ကြိမ်လှန်းစင်', en: 'the drying rack' } },
    { id: 'jar', x: -1.75, z: 1.2, look: { x: -2.6, z: 1.9 }, at: { x: -2.6, y: 0.85, z: 1.9 }, name: { my: 'ရေအိုး', en: 'the water jar' } },
    { id: 'tally', x: 2.2, z: -0.75, look: { x: hw, z: CT.z }, at: { x: hw - 0.3, y: CT.y, z: CT.z }, name: { my: 'စည်းရေ ဘုတ်', en: 'the tally board' } },
    { id: 'hands', x: 0.55, z: 1.6, look: { x: 1.2, z: 0.95 }, at: { x: 1.2, y: 0.55, z: 0.95 }, name: { my: 'ဦးဘိုလေးရဲ့ လက်', en: "U Bo Lay's hands" } },
  ]);
  room.spots = {
    entry: { x: 0, z: 2.3, h: PI },
    maya: { x: -0.2, z: 1.3, h: PI },
    ubolay: { x: 1.2, z: 0.78, h: 0, sit: 0.36, mood: 'work', who: 'ubolay' },
    cutter1: { x: -2.15, z: -1.0, h: -PI / 2, mood: 'work', who: 'cutterA' },
    cutter2: { x: -2.0, z: 1.75, h: -PI / 2, who: 'cutterB' },
    rack: { x: -1.2, z: -1.3, h: PI },
    jar: { x: -1.75, z: 1.2, h: face(-1.75, 1.2, -2.6, 1.9) },
    tally: { x: 2.2, z: -0.75, h: face(2.2, -0.75, hw, CT.z) },
    hands: { x: 0.55, z: 1.6, h: face(0.55, 1.6, 1.2, 0.95) },
  };
  room.props = {};
  void day;
  return finishRoom(room, { atlas: A, dyn, glow, shafts, dusk, shade, tick });
}

// ---------------------------------------------------------------------------------------------
// bridgehut · the bridge hands' hut on the Fold's west bridgehead (INDEX 13.1, day7-spec 14.4; Day 7, Day 8
// optional). 6 x 5 x 3: folded-newsprint-board walls, a long table under a hanging lamp, a bench and two
// stools, the iron stove with its kettle and tin cups, rope coils and a spare winch handle on pegs, a spare
// striped boom tip, the new bridge's truss plan pinned on the back wall, the hands' duty slate, a water jar by
// the door, a propped shutter in the east wall (sky by day; the deck lamps' glow once the bridge is lit).
// The same handles as Day 7's local stand-in (day7-fold.js HUT_ROOM), so Day 7 can drop its own copy:
//   opts: { day, slates: bool (ten slates on the table), cups: bool, key: bool, glow: 0..1, evening: 0..1 }
//   parts.slates.show(on) / .list · parts.cups.show(on) · parts.key.show(on) · parts.setGlow(k)
//   spots: handA, handB, naychi, naychiDoor, maya, door, entry · stations: [] (the story wires its own taps)
// The shell outside (and its door on the square) belong to the Junction region (art/junction.js jHut).
// ---------------------------------------------------------------------------------------------
const HC = {
  news: '#DAD6CB', newsL: '#E9E6DD', newsD: '#BCB7AA', print: '#8A867C', wood: P.wood, woodD: P.woodDark, woodL: '#CDA577',
  iron: '#4A3B30', soot: '#2B1E19', maroon: P.maroon, gold: P.gold, goldD: P.goldDeep, rope: '#C9AE7E', ropeD: '#A88C5E',
  tin: '#B9B4AA', tinD: '#8D877C', cream: P.cream, ink: P.ink, sky: '#9CC3DE', red: '#C8323C', white: '#F4EFE4', lamp: '#FFE3A0',
  slate: '#2E3A33', jute: '#C8A878', teal: '#4E8C86',
};
function hutPlane(w, h, px, draw) {
  const cv = document.createElement('canvas');
  cv.width = Math.round(w * px); cv.height = Math.round(h * px);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basicMat('#ffffff', { map: tex, transparent: true, alphaTest: 0.02 }));
  const redraw = () => { const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); draw(g, cv.width, cv.height); tex.needsUpdate = true; };
  redraw();
  fontsReady?.().then?.(redraw);
  return { mesh, tex, dispose() { tex.dispose(); mesh.geometry.dispose(); mesh.material.dispose(); } };
}

function buildBridgehut(opts = {}) {
  const W = 6, D = 5, H = 3;
  const room = kit.createRoom({ width: W, depth: D, height: H, wall: '#E3DFD3', wainscot: '#B8B2A3', trim: '#8C6A3C', floor: 'planks', floorColor: '#9C7C58', background: '#E6E2D6', windows: [{ x: 1.6, y: 1.85, w: 0.9, h: 0.7 }] });
  const hw = W / 2, hd = D / 2;
  const g = room.group;
  const planes = [];
  const v = new VoxelBuilder();
  // printed columns on the back and side walls (newsprint board)
  for (let k = 0; k < 9; k++) v.boxMin(-hw + 0.3 + k * 0.62, 1.15, -hd + 0.005, -hw + 0.36 + k * 0.62, 2.7, -hd + 0.012, HC.print);
  for (let k = 0; k < 3; k++) for (const s of [-1, 1]) v.boxMin(s * (hw - 0.005) - 0.004, 1.15, -hd + 0.3 + k * 0.5, s * (hw - 0.005) + 0.004, 2.5, -hd + 0.34 + k * 0.5, HC.print);
  // long table and the bench behind it, two stools at its ends
  v.boxMin(-1.3, 0.72, -1.15, 1.3, 0.78, -0.25, jitter(HC.woodL, 0.04, 3));
  for (let k = 0; k < 5; k++) v.boxMin(-1.3 + k * 0.52, 0.781, -1.15, -1.3 + k * 0.52 + 0.012, 0.784, -0.25, HC.woodD); // plank seams
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * 1.18, 0.36, -0.7 + sz * 0.36, 0.08, 0.72, 0.08, HC.woodD);
  v.boxMin(-1.2, 0.42, -1.68, 1.2, 0.47, -1.36, HC.wood);
  for (const sx of [-1, 1]) v.boxMin(sx * 1.05 - 0.05, 0, -1.66, sx * 1.05 + 0.05, 0.42, -1.38, HC.woodD);
  for (const sx of [-1, 1]) { v.box(sx * 1.62, 0.22, -0.7, 0.32, 0.04, 0.32, HC.maroon); v.box(sx * 1.62, 0.1, -0.7, 0.22, 0.2, 0.22, HC.woodD); }
  // on the table: an oil lamp, a ledger of crossings, a pencil, a rag
  v.box(0.95, 0.86, -0.95, 0.14, 0.14, 0.14, HC.goldD); v.box(0.95, 0.98, -0.95, 0.08, 0.1, 0.08, '#F3E3B0');
  v.box(-0.9, 0.8, -0.95, 0.42, 0.04, 0.3, HC.maroon); v.box(-0.9, 0.823, -0.95, 0.38, 0.006, 0.26, HC.cream);
  v.box(-0.55, 0.795, -0.8, 0.18, 0.015, 0.015, HC.gold);
  // the hanging lamp over the table (chain, shade, glass)
  v.box(0, 2.62, -0.7, 0.02, 0.7, 0.02, HC.iron);
  v.box(0, 2.24, -0.7, 0.34, 0.06, 0.34, HC.goldD);
  v.box(0, 2.14, -0.7, 0.16, 0.16, 0.16, '#E8D9A8');
  // the iron stove with its kettle (back right), pipe up through the roof, tin cups on a shelf above
  v.boxMin(2.05, 0, -2.3, 2.75, 0.62, -1.55, HC.iron);
  v.boxMin(2.0, 0.62, -2.35, 2.8, 0.68, -1.5, HC.soot);
  v.box(2.4, 0.3, -1.54, 0.24, 0.16, 0.02, '#E0793A'); // the fire door's glow slot
  v.box(2.55, 1.85, -2.05, 0.14, 2.3, 0.14, HC.soot);
  v.box(2.3, 0.78, -1.9, 0.26, 0.2, 0.22, HC.tinD); v.box(2.3, 0.9, -1.9, 0.1, 0.05, 0.1, HC.tin); v.box(2.46, 0.82, -1.9, 0.14, 0.04, 0.04, HC.tinD);
  v.boxMin(1.85, 1.45, -2.5, 2.85, 1.5, -2.25, HC.woodD);
  for (let k = 0; k < 4; k++) v.box(1.98 + k * 0.24, 1.56, -2.38, 0.1, 0.12, 0.1, HC.tin);
  // a coal scuttle and a stack of split wood by the stove
  v.box(1.75, 0.16, -2.2, 0.32, 0.32, 0.32, HC.soot); v.box(1.75, 0.33, -2.2, 0.26, 0.04, 0.26, '#3A3A3A');
  for (let r = 0; r < 3; r++) for (let i = 0; i < 3 - r; i++) v.box(2.9 - 0.05, 0.08 + r * 0.14, -1.25 + i * 0.15 + r * 0.07, 0.16, 0.13, 0.13, jitter(HC.wood, 0.08, r * 3 + i));
  // rope coils and a spare winch handle on pegs (left wall), a spare striped boom tip in the back-left corner
  for (let k = 0; k < 3; k++) { v.box(-hw + 0.06, 1.6, -1.0 + k * 0.45, 0.08, 0.04, 0.04, HC.iron); for (let r = 0; r < 4; r++) v.box(-hw + 0.14, 1.48 - r * 0.06, -1.0 + k * 0.45, 0.08, 0.05, 0.3 - r * 0.03, r % 2 ? HC.rope : HC.ropeD); }
  v.box(-hw + 0.1, 1.2, 0.5, 0.06, 0.6, 0.06, HC.iron); v.box(-hw + 0.18, 0.95, 0.5, 0.06, 0.06, 0.22, HC.woodL);
  for (let k = 0; k < 6; k++) v.box(-2.6, 0.18 + k * 0.3, -2.0, 0.12, 0.3, 0.12, k % 2 ? HC.white : HC.red);
  // the hands' boots by the left wall, a tin of rivets and a mallet under the bench
  for (const z of [0.95, 1.2]) { v.box(-hw + 0.3, 0.1, z, 0.14, 0.2, 0.3, HC.soot); v.box(-hw + 0.3, 0.22, z - 0.08, 0.14, 0.06, 0.14, HC.soot); }
  v.box(-0.4, 0.08, -1.52, 0.2, 0.16, 0.2, HC.tinD); v.box(0.5, 0.06, -1.5, 0.36, 0.1, 0.1, HC.woodD);
  // the propped shutter in the right (east) wall: an opening with a sky panel, the flap held out on a stick
  v.boxMin(hw - 0.02, 1.02, -0.9, hw + 0.01, 1.78, -0.1, HC.sky);
  v.boxMin(hw - 0.06, 1.75, -0.95, hw + 0.04, 1.82, -0.05, HC.woodD);
  v.boxMin(hw - 0.06, 0.98, -0.95, hw + 0.04, 1.04, -0.05, HC.woodD);
  // a reed mat by the door, a wall calendar, a hand bell on a bracket by the door
  v.boxMin(-0.8, 0.002, 1.4, 0.8, 0.012, 2.1, '#C9B07A');
  v.box(0.42, 1.75, -hd + 0.02, 0.44, 0.58, 0.02, HC.white); v.box(0.42, 1.98, -hd + 0.03, 0.44, 0.12, 0.02, HC.red);
  for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) v.box(0.3 + j * 0.08, 1.82 - k * 0.12, -hd + 0.035, 0.05, 0.05, 0.01, j === 2 && k === 1 ? HC.red : HC.print);
  v.box(hw - 0.08, 2.1, 1.3, 0.12, 0.04, 0.04, HC.iron); v.box(hw - 0.2, 1.98, 1.3, 0.16, 0.18, 0.16, HC.goldD);
  // a plank bench along the right wall by the door, a rain cape and a towel on pegs above it
  v.boxMin(hw - 0.42, 0.4, 0.25, hw - 0.04, 0.46, 1.05, HC.wood);
  for (const z of [0.32, 0.98]) v.boxMin(hw - 0.38, 0, z - 0.04, hw - 0.08, 0.4, z + 0.04, HC.woodD);
  for (const [z, c] of [[0.45, HC.teal], [0.85, HC.white]]) { v.box(hw - 0.04, 1.62, z, 0.06, 0.04, 0.04, HC.iron); v.box(hw - 0.1, 1.3, z, 0.06, 0.62, 0.3, c); }
  const mesh = v.mesh({ px: 1.4 });
  g.add(mesh);
  // the truss plan pinned on the back wall
  const plan = hutPlane(1.3, 0.8, 300, (gg, w, h) => {
    gg.fillStyle = '#F4F0E4'; gg.fillRect(0, 0, w, h);
    gg.strokeStyle = '#3E5F7A'; gg.lineWidth = 3;
    const y0 = h * 0.62, x0 = w * 0.08, x1 = w * 0.92;
    gg.beginPath(); gg.moveTo(x0, y0); gg.lineTo(x1, y0); gg.stroke();
    for (let k = 0; k <= 8; k++) { const x = x0 + (x1 - x0) * (k / 8); gg.beginPath(); gg.moveTo(x, y0); gg.lineTo(x + (k % 2 ? -1 : 1) * (x1 - x0) / 16, y0 - h * 0.22); gg.stroke(); }
    gg.beginPath(); gg.moveTo(x0, y0 - h * 0.22); gg.lineTo(x1, y0 - h * 0.22); gg.stroke();
    gg.fillStyle = '#3E5F7A'; gg.fillRect(w * 0.48, y0, w * 0.04, h * 0.25);
    gg.font = `700 ${Math.round(h * 0.1)}px ${FONT_MY}`; gg.textAlign = 'center'; gg.fillText('တံတားသစ် ပုံစံ', w / 2, h * 0.16); // DRAFT(my): the new bridge plan
    gg.fillStyle = HC.red; for (const [x, y] of [[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]]) { gg.beginPath(); gg.arc(x, y, 6, 0, 7); gg.fill(); }
  });
  plan.mesh.position.set(-1.2, 1.75, -hd + 0.03);
  g.add(plan.mesh);
  planes.push(plan);
  // the duty slate on the left wall: who keeps the boom tonight (chalk; a draft for Maya)
  const duty = hutPlane(0.7, 0.5, 320, (gg, w, h) => {
    gg.fillStyle = '#6E4A2E'; roundRect(gg, 0, 0, w, h, 10); gg.fill();
    gg.fillStyle = HC.slate; gg.fillRect(12, 12, w - 24, h - 24);
    gg.fillStyle = '#EDEBE2'; gg.textAlign = 'left';
    gg.font = `700 ${Math.round(h * 0.13)}px ${FONT_MY}`; gg.fillText('ညကင်း', 24, h * 0.27); // DRAFT(my): night watch
    gg.font = `500 ${Math.round(h * 0.11)}px ${FONT_MY}`;
    ['တနင်္လာ ― ကျော်', 'အင်္ဂါ ― ညွန့်', 'ဗုဒ္ဓဟူး ― ?'].forEach((t, i) => gg.fillText(t, 24, h * (0.47 + i * 0.17))); // DRAFT(my)
  });
  duty.mesh.position.set(-hw + 0.02, 1.85, 0.05);
  duty.mesh.rotation.y = PI / 2;
  g.add(duty.mesh);
  planes.push(duty);
  // the water jar on its stand by the door
  const jar = jarProp();
  room.place(Object.assign(jar.root, { userData: { footprint: { w: 0.55, d: 0.55 } } }), -2.3, 1.6);
  room.bake(); // statics merged; the things that show and hide below stay their own meshes
  const dynOf = (o) => { o.traverse((c) => { c.userData.dynamic = true; }); return o; };
  // the ten slates laid flat on the table in two rows of five (shown while she orders them)
  const slateGroup = new THREE.Group();
  const slates = [];
  for (let k = 0; k < 10; k++) {
    const s = chalkSlate({ w: 0.36, h: 0.26, text: '' });
    s.root.rotation.x = -PI / 2;
    s.root.position.set(-1.0 + (k % 5) * 0.5, 0.785, -0.95 + Math.floor(k / 5) * 0.42);
    slateGroup.add(s.root);
    slates.push(s);
  }
  slateGroup.visible = !!opts.slates;
  g.add(dynOf(slateGroup));
  // two tin cups of tea and Nay Chi's key on its tag (the tea, 6.7)
  const cv = new VoxelBuilder();
  for (const x of [-0.25, 0.55]) { cv.box(x, 0.84, -0.55, 0.1, 0.12, 0.1, HC.tin); cv.box(x, 0.9, -0.55, 0.08, 0.005, 0.08, '#C79A68'); }
  const cups = cv.mesh({ px: 1.2 });
  cups.visible = !!opts.cups;
  g.add(dynOf(cups));
  const kv = new VoxelBuilder();
  kv.box(-0.05, 0.79, -0.85, 0.12, 0.01, 0.03, '#C9A24A'); kv.box(0.06, 0.79, -0.86, 0.1, 0.006, 0.06, '#F7EFD8');
  const key = kv.mesh({ px: 1.0, outline: false });
  key.visible = !!opts.key;
  g.add(dynOf(key));
  // lamp glow (lit in the evening and once the deck is lit), the shutter glow
  const lampMat = basicMat(HC.lamp, { transparent: true, opacity: 0.2, depthWrite: false });
  const lampGlow = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8), lampMat);
  lampGlow.position.set(0, 2.12, -0.7);
  lampGlow.userData.dynamic = true;
  g.add(lampGlow);
  const shutterMat = basicMat('#F2C46A', { transparent: true, opacity: 0, depthWrite: false });
  const shutterGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.74), shutterMat);
  shutterGlow.position.set(hw - 0.035, 1.4, -0.5); shutterGlow.rotation.y = -PI / 2;
  shutterGlow.userData.dynamic = true;
  g.add(shutterGlow);
  // keep-outs
  room.obstacles.push({ type: 'box', minX: -1.4, maxX: 1.4, minZ: -1.25, maxZ: -0.15 }); // table
  room.obstacles.push({ type: 'box', minX: -1.3, maxX: 1.3, minZ: -1.8, maxZ: -1.3 }); // bench
  room.obstacles.push({ type: 'box', minX: 1.95, maxX: 2.9, minZ: -2.5, maxZ: -1.45 }); // stove
  room.obstacles.push({ type: 'box', minX: hw - 0.45, maxX: hw, minZ: 0.2, maxZ: 1.1 }); // the bench by the door
  const spots = {
    handA: { x: 2.25, z: -1.15, h: -0.6 },
    handB: { x: -1.0, z: 1.55, h: 0.3 },
    naychi: { x: -1.68, z: -0.12, h: 0.75 }, // at the table's left end by her stool: the ten slates in front of her
    naychiDoor: { x: 0.3, z: 1.6, h: PI },
    maya: { x: 1.6, z: -0.0, h: -PI / 2 - 0.4 },
    door: { x: 0, z: 2.05, h: PI },
    entry: { x: 0, z: 2.05, h: PI },
  };
  let glow = opts.glow ?? 0, evening = opts.evening ?? 0;
  const look = () => {
    lampMat.opacity = 0.18 + 0.5 * Math.max(evening, glow);
    shutterMat.opacity = 0.75 * glow;
  };
  look();
  return {
    scene: room.scene, group: g, room,
    width: W, depth: D, height: H,
    bounds: room.bounds, obstacles: room.obstacles, door: room.door, spawn: room.spawn,
    stations: [], spots, cast: [], props: {},
    ready: Promise.resolve(),
    parts: {
      slates: { show(on) { slateGroup.visible = !!on; }, list: slates },
      cups: { show(on) { cups.visible = !!on; } },
      key: { show(on) { key.visible = !!on; } },
      setGlow(k) { glow = k; look(); },
    },
    update() {},
    setEvening(k = 1) { evening = Math.max(0, Math.min(1, +k || 0)); look(); },
    setRain() {},
    dispose() {
      for (const s of slates) s.dispose?.();
      for (const p of planes) p.dispose();
      jar.dispose?.();
      lampMat.dispose(); shutterMat.dispose(); lampGlow.geometry.dispose(); shutterGlow.geometry.dispose();
      room.dispose();
    },
  };
}

// ---------------------------------------------------------------------------------------------
// walk-on looks (people.js SPECs) for the people the rooms need who are not in cast.js; the story
// may use its own. FALLBACK_CAST covers named people until cast.js carries their ids.
// ---------------------------------------------------------------------------------------------
export const WALKONS = {
  clerk: { age: 'elder', build: 'slim', skin: 1, hair: 'side', hairColor: 'grey', top: 'shirt', topColor: 'white', bottom: 'longyi', bottomColor: 'charcoal', check: true, extras: ['glasses', 'pencil'] },
  porterA: { age: 'adult', build: 'wide', skin: 4, hair: 'short', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'brown', check: true, extras: ['towel'], extraColor: 'tan' },
  porterB: { age: 'adult', build: 'mid', skin: 3, hair: 'spiky', top: 'tee', topColor: 'olive', bottom: 'longyi', bottomColor: 'navy', extras: ['towel'], extraColor: 'cream' },
  porterC: { age: 'adult', build: 'mid', skin: 3, hair: 'cap', top: 'tee', topColor: 'grey', bottom: 'shorts', bottomColor: 'brown', extras: ['towel'], extraColor: 'tan' },
  merchant: { age: 'adult', build: 'wide', skin: 1, hair: 'side', top: 'eingyi', topColor: 'cream', bottom: 'longyi', bottomColor: 'plum', check: true, extras: ['gaungbaung'], extraColor: 'mustard' },
  child: { age: 'child', build: 'slim', skin: 2, hair: 'bob', top: 'blouse', topColor: 'coral', bottom: 'htamein', bottomColor: 'teal', extras: ['thanaka'] },
  cutterA: { age: 'adult', build: 'slim', skin: 4, hair: 'short', top: 'tee', topColor: 'leaf', bottom: 'shorts', bottomColor: 'olive', extras: ['towel'], extraColor: 'tan' },
  cutterB: { age: 'teen', build: 'mid', skin: 3, hair: 'spiky', top: 'vest', topColor: 'cream', bottom: 'longyi', bottomColor: 'teal', check: true },
};
export const FALLBACK_CAST = {
  dawsanda: { age: 'adult', build: 'mid', skin: 3, hair: 'bun', top: 'blouse', topColor: 'tan', bottom: 'htamein', bottomColor: 'brown', extras: ['thanaka', 'towel'], extraColor: 'rose' },
  kothiha: { age: 'teen', build: 'mid', skin: 4, hair: 'short', top: 'tee', topColor: 'teal', bottom: 'longyi', bottomColor: 'navy', extras: ['towel'] },
  ubolay: { age: 'elder', build: 'slim', skin: 4, hair: 'bald', hairColor: 'white', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'brown', check: true, extras: ['gaungbaung'], extraColor: 'tan' },
};

export const ROOMS = {
  weighhouse: { name: { my: 'ချိန်ခွင်ရုံ', en: 'The weigh-house' }, district: 'wharf', build: buildWeighhouse },
  sandahouse: { name: { my: 'ဒေါ်စန္ဒာတို့ အိမ်', en: "Daw Sanda's house" }, district: 'wharf', build: buildSandahouse },
  caneshed: { name: { my: 'ဦးဘိုလေးရဲ့ ကြိမ်တဲ', en: "U Bo Lay's cane shed" }, district: 'wharf', build: buildCaneshed },
  // (a Junction building, kept in this file because doors.js looks for it here: HINT bridgehut -> wharf)
  bridgehut: { name: { my: 'တံတားစောင့် တဲ', en: "The bridge hands' hut" }, district: 'junction', days: [7, 8], build: buildBridgehut },
};
