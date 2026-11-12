// Ink & Insights Library (စာကြည့်တိုက်): Maya's book "Reality Check" on a centre stage,
// a giant phone showing her TikTok, and a bookcase whose spines are her TikTok playlists.
//
// Draw-call plan: static boxes are baked into one mesh (+ outline); every sign, screen,
// window sky and glow lives on two canvas atlases merged into ONE unlit mesh per atlas;
// every copy of her book shows the REAL cover (art.js texture) through ONE unlit mesh;
// everything that moves (sparkles, floating pages, hearts) is ONE instanced box mesh
// (+ outline). The helpers below are exported as `roomTools` and reused by contact.js.
import * as kit from './kit.js';
import { fontsReady, FONT_MY, FONT_SERIF, FONT_SANS, roundRect } from '../toon.js';
import { mergeGeometries } from '../three.js';
import { artImage, artTexture, artMaterial, drawArt, ART_SIZE } from '../art.js';
import { stat } from '../pages.js';
import { createLetterBook, PW as LB_W, PH as LB_H } from '../letters.js';

const { THREE, PALETTE: P, VoxelBuilder, toon, basic, addOutline, signTexture } = kit;

// ---------------------------------------------------------------------------------
// Shared room helpers
// ---------------------------------------------------------------------------------
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();

/** Matrix from position, XYZ Euler rotation and scale (build time only: allocates). */
function mat(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}
/** a * b (new matrix). */
function mul(a, b) {
  return new THREE.Matrix4().multiplyMatrices(a, b);
}
/** Box with any rotation into a VoxelBuilder (VoxelBuilder.box only turns about Y). */
function rbox(v, x, y, z, w, h, d, color, rx = 0, ry = 0, rz = 0) {
  return v.add(UNIT, color, mat(x, y, z, rx, ry, rz, w, h, d));
}
/** A square turned 45° and stretched to w × h: sparkle arms, heart tips. */
function diamondMatrix(x, y, z, w, h, d) {
  const m = new THREE.Matrix4().makeRotationZ(Math.PI / 4);
  m.premultiply(new THREE.Matrix4().makeScale(w / Math.SQRT2, h / Math.SQRT2, d));
  m.setPosition(x, y, z);
  return m;
}
/** Gold four-point sparkle made of two crossed diamonds (static, into a VoxelBuilder). */
function sparkleBoxes(v, x, y, z, size, color = P.gold, d = 0.04, parent = null) {
  const a = diamondMatrix(x, y, z, size * 0.3, size, d);
  const b = diamondMatrix(x, y, z, size, size * 0.3, d);
  v.add(UNIT, color, parent ? mul(parent, a) : a);
  v.add(UNIT, color, parent ? mul(parent, b) : b);
}
/** Group holding one (un-outlined) baked-later mesh, with a collision footprint. */
function prop(v, footprint, name) {
  const g = new THREE.Group();
  g.name = name;
  g.add(v.mesh({ outline: false }));
  if (footprint) g.userData.footprint = footprint;
  return g;
}

/** Canvas atlas: draw art into regions, map flat quads/blocks onto them, merge into one unlit mesh. */
function makeAtlas(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const geos = [];
  return {
    g,
    region(x, y, w, h) {
      return { x, y, w, h, u0: x / size, u1: (x + w) / size, v0: 1 - (y + h) / size, v1: 1 - y / size };
    },
    /** fn(g, w, h) draws with the origin at the region's top-left, clipped to it. */
    draw(r, fn) {
      g.save();
      g.translate(r.x, r.y);
      g.beginPath();
      g.rect(0, 0, r.w, r.h);
      g.clip();
      fn(g, r.w, r.h);
      g.restore();
      return r;
    },
    /** Plane w × h facing +Z showing region r, placed by matrix m (room space). */
    quad(r, w, h, m) {
      const geo = new THREE.PlaneGeometry(w, h);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, r.u0 + uv.getX(i) * (r.u1 - r.u0), r.v0 + uv.getY(i) * (r.v1 - r.v0));
      geo.applyMatrix4(m);
      geos.push(geo);
    },
    /** Unit box (scaled by m) whose every face shows the middle of region r: unlit glow blocks. */
    block(r, m) {
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (r.u0 + r.u1) / 2, (r.v0 + r.v1) / 2);
      geo.applyMatrix4(m);
      geos.push(geo);
    },
    mesh(name = 'signs') {
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const mesh = new THREE.Mesh(mergeGeometries(geos, false), basic('#ffffff', { map: tex, alphaTest: 0.5 }));
      for (const geo of geos) geo.dispose();
      mesh.name = name;
      mesh.userData.dynamic = true;
      mesh.userData.texture = tex;
      return mesh;
    },
  };
}

/** Text drawn by toon.signTexture() on a transparent canvas (Burmese shaping by the browser). */
function words(lines, w, h) {
  const t = signTexture(lines, { width: w, height: h, bg: null, border: null });
  const c = t.image;
  t.dispose();
  return c;
}
/** Four-point sparkle ✦ on a canvas. */
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
function disc(g, x, y, r, color) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = color;
  g.fill();
}
function rrect(g, x, y, w, h, r, fill, stroke = null, lw = 0) {
  roundRect(g, x, y, w, h, r);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = lw;
    g.stroke();
  }
}
/**
 * Maya's REAL logo (art.js image) as a round profile picture inside a ring. The whole "M"
 * (nib + film strip) sits inside the inscribed circle, so only background corners are cut.
 */
function avatar(g, img, cx, cy, r, ring = P.gold, ringW = 6) {
  disc(g, cx, cy, r + ringW, ring);
  disc(g, cx, cy, r, P.maroon); // only shows if the image could not load
  if (!img) return;
  g.save();
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.clip();
  drawArt(g, img, cx - r, cy - r, 2 * r, 2 * r, 'cover');
  g.restore();
}

/**
 * ONE unlit mesh showing a shared art.js texture on several flat quads (each quad shows the
 * whole image, never mirrored). quads: [{ w, h, m }] with m placing a +Z-facing plane in room
 * space; keep w / h equal to the artwork's aspect. The texture is shared: rooms never dispose it.
 */
function artQuads(tex, quads, name, fallback = '#7A4A22') {
  const geos = quads.map(({ w, h, m }) => new THREE.PlaneGeometry(w, h).applyMatrix4(m));
  const mesh = new THREE.Mesh(
    mergeGeometries(geos, false),
    tex ? artMaterial(tex, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }) : basic(fallback),
  );
  for (const geo of geos) geo.dispose();
  mesh.name = name;
  mesh.userData.dynamic = true; // not part of room.bake()
  return mesh;
}

/**
 * Moving decorations as ONE instanced box mesh (+ outline). Each box belongs to a "part" whose
 * matrix is set every frame (no allocation); hidden parts use scale 0.
 */
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
    boxM(part, m, color) {
      boxes.push({ part, m, color });
    },
    /** Sparkle ✦ (two diamonds) in a part. */
    sparkle(part, size, color = '#F3D27A', d = 0.05) {
      this.boxM(part, diamondMatrix(0, 0, 0, size * 0.24, size, d), color);
      this.boxM(part, diamondMatrix(0, 0, 0, size * 0.78, size * 0.24, d), color);
    },
    /** Blocky heart (a diamond + two square lobes) in a part, about 0.24 m wide. */
    heart(part, color = '#E0485E', d = 0.07) {
      this.boxM(part, diamondMatrix(0, -0.015, 0, 0.24, 0.24, d), color);
      this.box(part, -0.06, 0.05, 0, 0.12, 0.12, d, color);
      this.box(part, 0.06, 0.05, 0, 0.12, 0.12, d, color);
    },
    build(group, px = 1.4) {
      mesh = new THREE.InstancedMesh(UNIT, toon('#ffffff'), boxes.length);
      mesh.name = 'ambient';
      mesh.frustumCulled = false;
      mesh.userData.dynamic = true;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      boxes.forEach((b, i) => mesh.setColorAt(i, col.set(b.color)));
      group.add(mesh);
      const o = addOutline(mesh, { px });
      o.userData.dynamic = true;
      this.commit();
      return mesh;
    },
    /** Set a part's transform (runtime, allocation free). order 'YZX' = yaw, then pitch, then roll about the nose. */
    set(i, x, y, z, rx, ry, rz, sx, sy = sx, sz = sx, order = 'XYZ') {
      parts[i].compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, order)), _s.set(sx, sy, sz));
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

// Easing for the ambient animation (cartoon timing: overshoot, squash, settle).
const frac = (x) => x - Math.floor(x);
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
function easeOutBack(x) {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
/** 0 → 1 pop with overshoot during [0, a], hold, shrink away during [b, 1]. */
function popLife(u, a = 0.14, b = 0.8) {
  if (u < a) return easeOutBack(u / a);
  if (u > b) return 1 - clamp01((u - b) / (1 - b)) ** 2;
  return 1;
}
/** Sharp twinkle 0.35..1 for sparkles. */
function twinkle(p) {
  return 0.35 + 0.65 * Math.pow(Math.sin(frac(p) * Math.PI), 4);
}

// ---------------------------------------------------------------------------------
// Detail helpers (build time only): colour texture through blocks, not image textures
// ---------------------------------------------------------------------------------
/** Deterministic 0..1 hash, so every build (and every frozen dev frame) looks the same. */
function rnd(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
/** Brightness-scaled sRGB '#rrggbb' (f < 1: fake ambient occlusion, f > 1: lit rims). */
function tone(hex, f) {
  const n = parseInt(hex.slice(1, 7), 16);
  const ch = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
}
const SPINES = ['#6E1F2A', '#8A2B36', '#A47A2C', '#C9A24A', '#2F5DB3', '#22477F', '#3E6B4F', '#2F5640', '#EDE6D3', '#8E5A3C', '#2A2118', '#C27A5B', '#D9822B', '#2D6E73', '#5E3A54'];

/** Small shelf ornament standing at (x, y, z): jar, potted sprout, framed picture or hourglass. */
function ornament(v, x, y, z, s) {
  const kind = Math.floor(rnd(s * 4.7) * 4);
  if (kind === 0) {
    v.box(x, y + 0.07, z, 0.1, 0.14, 0.1, '#CFE1DD');
    v.box(x, y + 0.04, z + 0.01, 0.07, 0.06, 0.09, '#E9C46A');
    v.box(x, y + 0.155, z, 0.076, 0.035, 0.076, P.wood);
    v.box(x, y + 0.105, z + 0.052, 0.06, 0.04, 0.004, P.paper);
  } else if (kind === 1) {
    v.box(x, y + 0.045, z, 0.1, 0.09, 0.1, '#C27A5B');
    v.box(x, y + 0.095, z, 0.115, 0.022, 0.115, '#D99A78');
    v.box(x, y + 0.15, z, 0.13, 0.09, 0.12, P.leaf, 0.3);
    v.box(x + 0.03, y + 0.215, z - 0.01, 0.08, 0.07, 0.08, P.leafDark, 0.6);
    v.box(x - 0.05, y + 0.12, z + 0.04, 0.06, 0.05, 0.06, tone(P.leaf, 1.15), 0.2);
  } else if (kind === 2) {
    rbox(v, x, y + 0.1, z, 0.15, 0.19, 0.025, P.gold, -0.12);
    rbox(v, x, y + 0.105, z + 0.008, 0.11, 0.14, 0.02, '#BFD9EC', -0.12);
    rbox(v, x, y + 0.065, z + 0.006, 0.11, 0.05, 0.026, P.leaf, -0.12);
    rbox(v, x + 0.025, y + 0.13, z + 0.01, 0.03, 0.03, 0.02, '#FFE29A', -0.12);
  } else {
    v.box(x, y + 0.012, z, 0.09, 0.024, 0.09, P.goldDeep);
    v.box(x, y + 0.168, z, 0.09, 0.024, 0.09, P.goldDeep);
    for (const sx of [-1, 1]) v.box(x + sx * 0.036, y + 0.09, z + 0.036, 0.012, 0.14, 0.012, P.gold);
    v.box(x, y + 0.05, z, 0.06, 0.06, 0.06, '#E8D7A8');
    v.box(x, y + 0.13, z, 0.04, 0.05, 0.04, '#E8D7A8');
  }
}

/**
 * Fill one shelf row with standing books of varied size and colour (2-3 tones each, gold spine
 * bands, labels), the odd flat stack or ornament, and a book leaning on the last one.
 * x0..x1 along the shelf, y0 shelf top, space = clear height, zb/zf = back/front of the books.
 */
function bookRow(v, x0, x1, y0, space, zb, zf, seed, ornaments = true) {
  let x = x0;
  for (let k = 0; k < 80; k++) {
    const a = rnd(seed * 7.31 + k * 1.37);
    const b = rnd(seed * 3.17 + k * 2.71);
    const c = rnd(seed * 5.93 + k * 0.53);
    if (c < 0.08 && x1 - x > 0.36) {
      const n = 2 + Math.floor(a * 3);
      const sw = 0.24 + b * 0.06;
      let y = y0;
      for (let i = 0; i < n; i++) {
        const t = 0.032 + rnd(seed + k * 3 + i) * 0.026;
        const col = SPINES[Math.floor(rnd(seed * 2 + k + i * 5) * SPINES.length)];
        const off = (rnd(seed + k * 9 + i) - 0.5) * 0.03;
        v.boxMin(x + 0.01 + off, y, zb + 0.02, x + sw - 0.01 + off, y + t, zf - 0.012, col);
        v.boxMin(x + 0.03 + off, y + t * 0.25, zf - 0.012, x + sw - 0.03 + off, y + t * 0.75, zf - 0.006, i % 2 ? P.gold : tone(col, 1.4));
        y += t;
      }
      if (ornaments && a > 0.5) ornament(v, x + sw / 2, y, (zb + zf) / 2, seed + k * 11);
      x += sw + 0.012;
      continue;
    }
    if (ornaments && c > 0.955 && x1 - x > 0.22) {
      ornament(v, x + 0.09, y0, (zb + zf) / 2, seed * 3 + k);
      x += 0.19;
      continue;
    }
    const bw = 0.04 + a * 0.05;
    if (x + bw > x1) break;
    const bh = Math.min(space - 0.02, space * (0.55 + b * 0.38));
    const col = tone(SPINES[Math.floor(c * 997) % SPINES.length], 0.88 + b * 0.24);
    const zfb = zf - a * 0.03;
    v.boxMin(x, y0, zb, x + bw, y0 + bh, zfb, col);
    if (bw > 0.052 && b > 0.25) {
      const band = c > 0.45 ? P.gold : tone(col, 1.45);
      v.boxMin(x + 0.005, y0 + bh * 0.8, zfb, x + bw - 0.005, y0 + bh * 0.8 + 0.016, zfb + 0.006, band);
      v.boxMin(x + 0.005, y0 + bh * 0.15, zfb, x + bw - 0.005, y0 + bh * 0.15 + 0.012, zfb + 0.006, band);
    } else if (a > 0.55) {
      v.boxMin(x + 0.008, y0 + bh * 0.52, zfb, x + bw - 0.008, y0 + bh * 0.68, zfb + 0.005, P.cream);
    }
    x += bw + 0.004;
  }
  // a book leaning on the last one, when there is room
  const free = x1 - x;
  if (free > 0.16) {
    const th = 0.3;
    const bw = 0.05;
    const bh = Math.min(space * 0.8, (free - bw * Math.cos(th)) / Math.sin(th) - 0.01);
    if (bh > 0.18) {
      const col = SPINES[Math.floor(rnd(seed * 9.1) * SPINES.length)];
      const xc = x + (bw / 2) * Math.cos(th) + (bh / 2) * Math.sin(th);
      const yc = y0 + (bw / 2) * Math.sin(th) + (bh / 2) * Math.cos(th);
      rbox(v, xc, yc, (zb + zf) / 2, bw, bh, zf - zb - 0.02, col, 0, 0, th);
      rbox(v, xc - 0.07 * Math.sin(th), yc + 0.07 * Math.cos(th), zf - 0.008, bw - 0.01, 0.014, 0.006, P.gold, 0, 0, th);
    }
  }
}

/** Tall carved bookcase: pilasters with gold reeds, dentil crown, shelf lips, AO back, full rows. */
function bookcase({ w = 1.8, h = 2.7, d = 0.44, rows = 5, seed = 1, wood = '#835A39' } = {}) {
  const v = new VoxelBuilder();
  const hw = w / 2;
  const hd = d / 2;
  const side = 0.07;
  const light = tone(wood, 1.22);
  const dark = tone(wood, 0.6);
  v.boxMin(-hw, 0, -hd, hw, h, -hd + 0.04, dark);
  for (const s of [-1, 1]) {
    const xa = s < 0 ? -hw : hw - side;
    v.boxMin(xa, 0, -hd, xa + side, h, hd, wood);
    const px = s * (hw - side / 2);
    v.boxMin(px - 0.05, 0.16, hd, px + 0.05, h - 0.1, hd + 0.025, light);
    v.boxMin(px - 0.011, 0.32, hd + 0.025, px + 0.011, h - 0.3, hd + 0.032, P.gold);
    v.boxMin(px - 0.066, h - 0.2, hd, px + 0.066, h - 0.1, hd + 0.042, P.goldDeep);
    v.boxMin(px - 0.066, 0.14, hd, px + 0.066, 0.24, hd + 0.042, P.goldDeep);
  }
  v.boxMin(-hw - 0.03, 0, -hd, hw + 0.03, 0.14, hd + 0.03, dark);
  v.boxMin(-hw - 0.03, 0.12, hd + 0.02, hw + 0.03, 0.15, hd + 0.04, P.goldDeep);
  v.boxMin(-hw - 0.02, h - 0.1, -hd, hw + 0.02, h, hd + 0.03, wood);
  for (let x = -hw + 0.05; x <= hw - 0.04; x += 0.085) v.box(x, h - 0.035, hd + 0.045, 0.042, 0.04, 0.03, light);
  v.boxMin(-hw - 0.06, h, -hd, hw + 0.06, h + 0.045, hd + 0.075, P.goldDeep);
  v.boxMin(-hw - 0.08, h + 0.045, -hd, hw + 0.08, h + 0.1, hd + 0.095, wood);
  v.boxMin(-hw - 0.08, h + 0.092, hd + 0.06, hw + 0.08, h + 0.1, hd + 0.098, light);
  const y0 = 0.16;
  const gap = (h - 0.1 - y0) / rows;
  for (let r = 0; r < rows; r++) {
    const y = y0 + r * gap;
    v.boxMin(-hw + side, y - 0.0175, -hd + 0.04, hw - side, y + 0.0175, hd, wood);
    v.boxMin(-hw + side, y + 0.006, hd - 0.012, hw - side, y + 0.0175, hd + 0.01, light);
    v.boxMin(-hw + side, y + 0.0175, -hd + 0.04, hw - side, y + 0.03, -hd + 0.1, dark);
    bookRow(v, -hw + side + 0.02, hw - side - 0.02, y + 0.0175, gap - 0.035, -hd + 0.06, hd - 0.035, seed * 13 + r * 7);
  }
  return v;
}

/** Potted plant with a footed pot (gold band, lit rim, soil) and leaves in four greens. */
function pottedPlant(s = 1, seed = 1, pot = P.maroon) {
  const v = new VoxelBuilder();
  v.boxMin(-0.18 * s, 0, -0.18 * s, 0.18 * s, 0.05 * s, 0.18 * s, tone(pot, 0.7));
  v.boxMin(-0.2 * s, 0.05 * s, -0.2 * s, 0.2 * s, 0.34 * s, 0.2 * s, pot);
  v.boxMin(-0.205 * s, 0.15 * s, -0.205 * s, 0.205 * s, 0.18 * s, 0.205 * s, P.gold);
  v.boxMin(-0.23 * s, 0.33 * s, -0.23 * s, 0.23 * s, 0.4 * s, 0.23 * s, tone(pot, 1.3));
  v.boxMin(-0.19 * s, 0.38 * s, -0.19 * s, 0.19 * s, 0.415 * s, 0.19 * s, '#4A3020');
  const greens = [P.leaf, P.leafDark, tone(P.leaf, 1.2), '#5D8F4E'];
  const leaves = [[0, 0.6, 0, 0.36], [0.13, 0.76, -0.06, 0.26], [-0.13, 0.72, 0.08, 0.24], [0.02, 0.94, 0.02, 0.24], [-0.06, 1.08, -0.05, 0.17],
    [0.16, 0.56, 0.13, 0.17], [-0.17, 0.53, -0.12, 0.17], [0.1, 1.12, 0.07, 0.12], [-0.15, 0.9, -0.02, 0.13], [0.2, 0.86, 0.04, 0.11]];
  leaves.forEach(([x, y, z, q], i) => v.box(x * s, y * s, z * s, q * s, q * s, q * s, greens[(i + seed) % greens.length], rnd(seed * 5 + i) * 0.9));
  return v;
}

/**
 * Board floor laid over the kit planks: a dark seam sheet, then staggered boards in 3-5 tones,
 * darker toward the back wall (fake ambient occlusion).
 */
function boardFloor(room, base, { boardW = 0.25, minL = 0.9, varL = 0.9, seed = 1 } = {}) {
  const v = new VoxelBuilder();
  const hw = room.width / 2;
  const hd = room.depth / 2;
  v.boxMin(-hw, 0, -hd, hw, 0.002, hd, tone(base, 0.45));
  const tones = [1, 0.93, 1.06, 0.88, 1.1].map((f) => tone(base, f));
  let row = 0;
  for (let z = -hd; z < hd - 1e-6; z += boardW, row++) {
    const z1 = Math.min(hd, z + boardW);
    const ao = 0.8 + 0.2 * clamp01((z - -hd) / 1.2);
    let x = -hw - rnd(seed + row * 3.7) * 1.2;
    for (let k = 0; x < hw && k < 30; k++) {
      const L = minL + rnd(seed + row * 17.3 + k * 5.3) * varL;
      const xa = Math.max(-hw, x);
      const xb = Math.min(hw, x + L);
      if (xb - xa > 0.05) {
        const c = tones[Math.floor(rnd(seed + row * 31.7 + k * 7.1) * tones.length)];
        v.boxMin(xa + 0.005, 0, z + 0.006, xb - 0.005, 0.005, z1 - 0.006, ao < 0.999 ? tone(c, ao) : c);
      }
      x += L;
    }
  }
  return v;
}

/** Wallpaper stripes on the back wall between the chair rail and the crown. */
function wallStripes(v, room, color, { step = 0.16, w = 0.05, y0 = 1.06, y1 = room.height - 0.12 } = {}) {
  const hw = room.width / 2;
  const z = -room.depth / 2;
  for (let x = -hw + step / 2; x < hw; x += step) v.boxMin(x - w / 2, y0, z, x + w / 2, y1, z + 0.004, color);
}

export const roomTools = { UNIT, mat, mul, rbox, diamondMatrix, sparkleBoxes, prop, makeAtlas, words, sparkle, disc, rrect, avatar, artQuads, makeDyn, frac, clamp01, easeOutBack, popLife, twinkle,
  rnd, tone, SPINES, ornament, bookRow, bookcase, pottedPlant, boardFloor, wallStripes };

// ---------------------------------------------------------------------------------
// Canvas art (all text through signTexture() via words(), after fontsReady())
// ---------------------------------------------------------------------------------
const PLAYLISTS = [
  { title: 'Reality Check', font: FONT_SERIF, bg: '#D9822B', ink: '#3B1B16' },
  { title: 'Hidden secrets of life', font: FONT_SERIF, bg: P.maroon, ink: '#F0D58C' },
  { title: 'The Alchemist', font: FONT_SERIF, bg: '#3E6B4F', ink: '#FBF3E0' },
  { title: "Can't Hurt Me", font: FONT_SERIF, bg: '#2A2118', ink: '#E9C46A' },
  { title: 'ကိုယ်ကျင့်နဲ့ ပညာ', font: FONT_MY, bg: P.goldDeep, ink: '#FFF6E2' },
  { title: 'အနာဂတ်', font: FONT_MY, bg: P.boxBlue, ink: '#FFF6E2' },
  { title: 'မုဒိတာ', font: FONT_MY, bg: '#C27A5B', ink: '#FFF6E2' },
  { title: 'အမွေ', font: FONT_MY, bg: '#8E5A3C', ink: '#F0D58C' },
];

function note(g, x, y, s, color) {
  disc(g, x, y, s * 0.32, color);
  g.fillStyle = color;
  g.fillRect(x + s * 0.2, y - s * 1.1, s * 0.13, s * 1.1);
  g.fillRect(x + s * 0.2, y - s * 1.1, s * 0.5, s * 0.16);
}

/** Her TikTok profile on the giant phone: the real logo as the profile picture, live numbers. */
function drawPhone(g, w, h, logo, stats) {
  g.fillStyle = '#141418';
  g.fillRect(0, 0, w, h);
  const cx = w / 2;
  avatar(g, logo, cx, 98, 64, P.gold, 6);
  sparkle(g, cx + 92, 44, 13, '#F7DE8E');
  sparkle(g, cx - 96, 150, 8, '#F7DE8E');
  g.drawImage(
    words([{ text: '@maya_ink_insights', size: 30, font: FONT_SANS, weight: 700, color: '#FFFFFF' }, { text: 'Maya | Ink & Insights', size: 22, font: FONT_SANS, weight: 400, color: '#BDB6AC' }], w, 92),
    0, 172,
  );
  g.fillStyle = '#34343C';
  g.fillRect(40, 268, w - 80, 3);
  g.drawImage(words([{ text: stats.followers, size: 76, font: FONT_SANS, weight: 800, color: '#FFFFFF' }, { text: 'ဖော်လိုဝါ', size: 28, weight: 400, color: '#D9D0C2' }], w, 178), 0, 272);
  g.drawImage(words([{ text: stats.likes, size: 76, font: FONT_SANS, weight: 800, color: '#FFFFFF' }, { text: 'လိုက်ခ်', size: 28, weight: 400, color: '#D9D0C2' }], w, 178), 0, 436);
  rrect(g, 38, 618, w - 76, 58, 29, '#E0485E');
  g.drawImage(words([{ text: 'Follow လုပ်ပေးပါနော်', size: 27, color: '#FFFFFF' }], w - 76, 58), 38, 618);
  note(g, 30, 40, 26, '#E9C46A');
  rrect(g, cx - 50, h - 22, 100, 7, 3.5, '#5A5A64');
}

function drawSky(g, w, h) {
  const bands = ['#F2C08E', '#F6CF9F', '#F9DCB0', '#FBE6C2', '#FCEED3'];
  const bh = h / bands.length;
  bands.forEach((c, i) => {
    g.fillStyle = c;
    g.fillRect(0, i * bh, w, bh + 1);
  });
  disc(g, w * 0.72, h * 0.74, 46, '#FFE29A');
  disc(g, w * 0.72, h * 0.74, 32, '#FFF4CF');
  const cloud = (x, y, s) => {
    rrect(g, x - 52 * s, y - 6 * s, 104 * s, 30 * s, 15 * s, '#F4D7B0');
    rrect(g, x - 56 * s, y - 14 * s, 112 * s, 30 * s, 15 * s, '#FFF8EE');
    disc(g, x - 14 * s, y - 20 * s, 24 * s, '#FFF8EE');
    disc(g, x + 18 * s, y - 16 * s, 18 * s, '#FFF8EE');
  };
  cloud(w * 0.22, h * 0.38, 1.0);
  cloud(w * 0.52, h * 0.2, 0.7);
  cloud(w * 0.88, h * 0.42, 0.62);
  sparkle(g, w * 0.36, h * 0.66, 12, '#FFFFFF');
}

function drawTitle(g, w, h) {
  g.fillStyle = '#F8F0DD';
  g.fillRect(0, 0, w, h);
  g.drawImage(
    words([{ text: 'စာကြည့်တိုက်', size: 92, color: P.maroon }, { text: 'Ink & Insights Library', size: 44, font: FONT_SERIF, weight: 600, color: P.goldDeep }], w, h),
    0, 0,
  );
  for (const sx of [1, -1]) {
    const x = sx > 0 ? 120 : w - 120;
    sparkle(g, x, h / 2, 40, P.gold);
    sparkle(g, x + sx * 52, h / 2 - 50, 15, P.goldDeep);
    sparkle(g, x - sx * 40, h / 2 + 56, 11, P.goldDeep);
  }
}

function drawLaunch(g, w, h) {
  g.fillStyle = '#FBF5E6';
  g.fillRect(0, 0, w, h);
  rrect(g, 14, 14, w - 28, h - 28, 18, null, P.gold, 5);
  g.drawImage(
    words(
      [
        { text: 'စာအုပ်မိတ်ဆက်ပွဲ', size: 56, color: P.maroon },
        { text: '၁၀ – ၁၂ အောက်တိုဘာ ၂၀၂၆', size: 40, color: P.ink },
        { text: 'အုပ်ရေ ၁၀၀၀ ထုတ်ဝေ', size: 40, color: P.ink },
        { text: 'ပထမ ၁၀၀ အုပ် ရောင်းရငွေ ၁၀၀% လှူဒါန်း', size: 31, color: P.goldDeep },
      ],
      w, h,
    ),
    0, 4,
  );
  sparkle(g, 44, 46, 16, P.gold);
  sparkle(g, w - 44, 46, 16, P.gold);
}

function drawHeader(g, w, h) {
  g.fillStyle = P.maroon;
  g.fillRect(0, 0, w, h);
  g.drawImage(words([{ text: 'TikTok Playlist လေးတွေ', size: 40, color: '#F3DCA0' }], w - 90, h), 45, 0);
  note(g, 30, h * 0.66, 30, P.gold);
  note(g, w - 40, h * 0.66, 30, P.gold);
}

function drawSpine(g, w, h, pl) {
  g.fillStyle = pl.bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#D9B45A';
  g.fillRect(16, 0, 9, h);
  g.fillRect(w - 25, 0, 9, h);
  g.fillRect(31, 0, 3, h);
  g.fillRect(w - 34, 0, 3, h);
  const my = pl.font === FONT_MY;
  g.drawImage(words([{ text: pl.title, size: my ? 33 : 38, font: pl.font, weight: my ? 700 : 600, color: pl.ink }], w - 80, h), 40, my ? 1 : 2);
}

/**
 * Library atlases: A = phone screen (with the real logo), window sky, glow, sparkle decal;
 * B = signs + spines. The book covers are not drawn here: they show the real art.js texture.
 */
function libraryAtlases(logo, stats) {
  const A = makeAtlas(1024);
  const B = makeAtlas(1024);
  const r = {
    phone: A.draw(A.region(520, 0, 400, 712), (g, w, h) => drawPhone(g, w, h, logo, stats)),
    glow: A.draw(A.region(928, 0, 96, 96), (g, w, h) => {
      g.fillStyle = '#FFE9B0';
      g.fillRect(0, 0, w, h);
    }),
    spark: A.draw(A.region(928, 104, 96, 96), (g) => {
      sparkle(g, 48, 48, 46, P.gold);
      sparkle(g, 48, 48, 20, '#F6DD94');
    }),
    sky: A.draw(A.region(520, 724, 504, 240), drawSky),
    title: B.draw(B.region(0, 0, 1024, 240), drawTitle),
    launch: B.draw(B.region(0, 248, 512, 376), drawLaunch),
    header: B.draw(B.region(520, 248, 504, 128), drawHeader),
    spines: PLAYLISTS.map((pl, i) => B.draw(B.region((i % 2) * 516, 632 + Math.floor(i / 2) * 96, 508, 92), (g, w, h) => drawSpine(g, w, h, pl))),
  };
  return { A, B, r };
}

// ---------------------------------------------------------------------------------
// Props (room space: x east, z toward the camera, fronts face +Z)
// ---------------------------------------------------------------------------------
const DZ = -1.55; // centre stage (book display) depth
const PX = 2.5; // giant phone
const PZ = -1.35;
const SX = -2.5; // playlist bookcase
const SZ = -1.3;
const WOOD = P.wood;
const WOOD_D = P.woodDark;
const GLOBE = { x: -1.9, y: 2.92, z: -3.75 }; // spinning globe on top of the left bookcase

// Her book "အမှန်မြင်ခြင်း / Reality Check": every cover is the real artwork (600 x 921).
const COVER_ASPECT = ART_SIZE.book[0] / ART_SIZE.book[1]; // width / height
const BOARD = '#7A4A22'; // board edges round the cover art
const SPINE = '#9A5A26';
const PAGES = '#F6EBD2';

/**
 * The giant "Reality Check" on a pedestal, an easel with the empty photo frame, the launch sign,
 * gold rope. Cover quads (room space) are pushed to `covers`; they become one unlit mesh.
 */
function bookDisplay(room, B, r, covers) {
  const v = new VoxelBuilder();
  const D = mat(0, 0, DZ);
  // dais
  v.boxMin(-1.3, 0, -0.75, 1.3, 0.1, 0.75, WOOD_D);
  v.boxMin(-1.3, 0.1, -0.75, 1.3, 0.13, 0.75, P.goldDeep);
  v.boxMin(-1.2, 0.13, -0.66, 1.2, 0.14, 0.66, P.maroon);
  v.boxMin(-0.62, 0.14, -0.6, 0.62, 0.146, 0.38, '#842A36');
  // pedestal
  v.box(0, 0.19, -0.15, 0.9, 0.1, 0.9, P.gold);
  v.box(0, 0.48, -0.15, 0.7, 0.48, 0.7, P.cream);
  v.box(0, 0.77, -0.15, 0.9, 0.1, 0.9, P.gold);
  v.box(0, 0.48, 0.205, 0.46, 0.3, 0.012, P.maroon);
  sparkleBoxes(v, 0, 0.48, 0.215, 0.18, P.gold, 0.02);
  // the book: hardcover boards, page block, spine. The front board is exactly the cover's shape
  // (600:921) and shows the real cover, 4 mm proud of the board. It rests on a gold ledge 8 cm
  // above the pedestal so "REALITY CHECK" (low on the cover) clears Maya's head in the close-up;
  // its top stays under the station label in the room view.
  const BW = 0.92;
  const BH = BW / COVER_ASPECT; // 1.412
  const BT = 0.22;
  const bookM = mat(0, 0.9, -0.15, -0.12);
  const bk = new VoxelBuilder();
  bk.box(0, BH / 2, BT / 2 - 0.018, BW, BH, 0.036, BOARD);
  bk.box(0, BH / 2, -BT / 2 + 0.018, BW, BH, 0.036, BOARD);
  bk.box(-0.0025, BH / 2, 0, BW - 0.005, BH - 0.04, BT - 0.05, PAGES); // spine to 5 mm inside the fore-edge
  bk.box(-BW / 2 - 0.022, BH / 2, 0, 0.044, BH, BT, SPINE);
  for (const y of [0.2, BH - 0.2]) bk.box(-BW / 2 - 0.047, y, 0, 0.012, 0.06, BT - 0.03, P.gold);
  bk.box(0.18, BH + 0.015, -0.02, 0.05, 0.03, 0.05, P.maroon); // ribbon bookmark peeking out
  rbox(bk, 0.18, BH - 0.1, -0.12, 0.05, 0.26, 0.012, P.maroon);
  v.merge(bk, bookM);
  covers.push({ w: BW, h: BH, m: mul(D, mul(bookM, mat(0, BH / 2, BT / 2 + 0.004))) });
  v.box(0, 0.86, -0.15, BW + 0.08, 0.08, 0.42, P.gold); // ledge the book rests on
  v.box(0, 0.885, 0.045, BW + 0.1, 0.04, 0.04, P.goldDeep); // its front lip, top below the cover's edge
  rbox(v, 0, 1.21, -0.42, 0.12, 0.66, 0.05, P.goldDeep, 0.27); // back strut

  // easel with the empty gold photo frame (picture area left empty for the integrator)
  const E = mat(-0.98, 0.14, -0.05, 0, 0.2, 0);
  const e = new VoxelBuilder();
  rbox(e, -0.27, 0.86, 0, 0.055, 1.74, 0.055, WOOD, -0.1, 0, -0.07);
  rbox(e, 0.27, 0.86, 0, 0.055, 1.74, 0.055, WOOD, -0.1, 0, 0.07);
  rbox(e, 0, 0.78, -0.3, 0.05, 1.58, 0.05, WOOD_D, 0.34);
  e.box(0, 0.6, 0.06, 0.8, 0.05, 0.14, WOOD);
  e.box(0, 0.64, 0.12, 0.8, 0.05, 0.02, WOOD_D);
  e.box(0, 1.62, -0.06, 0.32, 0.06, 0.06, WOOD);
  v.merge(e, E);
  const FW = 0.6;
  const FH = 0.8;
  const F = mat(0, 1.1, 0.08, -0.1);
  const f = new VoxelBuilder();
  const b = 0.075;
  f.box(0, 0, -0.01, FW + 0.02, FH + 0.02, 0.02, '#E6D9BC'); // empty backing, front face at z = 0
  f.box(0, FH / 2 + b / 2, 0.015, FW + 2 * b, b, 0.07, P.gold);
  f.box(0, -FH / 2 - b / 2, 0.015, FW + 2 * b, b, 0.07, P.gold);
  f.box(-FW / 2 - b / 2, 0, 0.015, b, FH, 0.07, P.gold);
  f.box(FW / 2 + b / 2, 0, 0.015, b, FH, 0.07, P.gold);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) f.box(sx * (FW / 2 + b / 2), sy * (FH / 2 + b / 2), 0.025, 0.11, 0.11, 0.08, P.goldDeep);
  sparkleBoxes(f, 0, FH / 2 + b + 0.07, 0.02, 0.17, P.gold, 0.04);
  const frameM = mul(E, F);
  v.merge(f, frameM);
  const photoFrame = new THREE.Group();
  photoFrame.name = 'photoFrame';
  mul(D, frameM).decompose(photoFrame.position, photoFrame.quaternion, photoFrame.scale);
  photoFrame.userData.picture = { w: FW, h: FH };

  // launch sign on a gold stand
  const S = mat(1.0, 0.14, -0.05, 0, -0.2, 0);
  const s = new VoxelBuilder();
  s.box(0, 0.03, 0, 0.42, 0.06, 0.32, P.goldDeep);
  s.box(0, 0.5, -0.03, 0.06, 0.9, 0.06, P.gold);
  const SB = mat(0, 1.14, 0.0, -0.3);
  const sb = new VoxelBuilder();
  sb.box(0, 0, -0.03, 0.92, 0.7, 0.04, P.goldDeep);
  sb.box(0, 0.35, -0.005, 0.94, 0.04, 0.05, P.gold);
  sb.box(0, -0.35, -0.005, 0.94, 0.04, 0.05, P.gold);
  sb.box(-0.45, 0, -0.005, 0.04, 0.7, 0.05, P.gold);
  sb.box(0.45, 0, -0.005, 0.04, 0.7, 0.05, P.gold);
  s.merge(sb, SB);
  v.merge(s, S);
  B.quad(r.launch, 0.86, 0.632, mul(D, mul(S, mul(SB, mat(0, 0, -0.006)))));

  // dais trim: gold studs along the front, a darker kick line (fake ambient occlusion), carpet border
  for (let x = -1.2; x <= 1.21; x += 0.2) v.box(x, 0.055, 0.752, 0.05, 0.05, 0.012, P.gold);
  v.boxMin(-1.3, 0, 0.75, 1.3, 0.025, 0.762, tone(WOOD_D, 0.7));
  v.boxMin(-1.12, 0.14, 0.56, 1.12, 0.146, 0.58, P.gold);
  v.boxMin(-1.12, 0.14, -0.64, 1.12, 0.146, -0.62, P.gold);
  // stacks of her book (the real cover on each top copy) and one copy standing on a little easel.
  // Copies are 0.19 x 0.2917 m covers (600:921) on 0.192 x 0.294 boards; the cover is 3 mm proud.
  const cw = 0.19;
  const ch = cw / COVER_ASPECT;
  const copy = (bv, M, top) => {
    bv.add(UNIT, BOARD, mul(M, mat(0, 0.022, 0, 0, 0, 0, cw + 0.002, 0.044, ch + 0.002)));
    bv.add(UNIT, PAGES, mul(M, mat(0.006, 0.022, 0, 0, 0, 0, cw - 0.004, 0.032, ch + 0.006)));
    bv.add(UNIT, SPINE, mul(M, mat(-cw / 2 - 0.004, 0.022, 0, 0, 0, 0, 0.012, 0.046, ch + 0.002)));
    if (top) covers.push({ w: cw, h: ch, m: mul(D, mul(M, mat(0, 0.047, 0, -Math.PI / 2))) });
  };
  for (const [sx, n, ry] of [[-0.6, 4, 0.18], [0.62, 3, -0.22]]) {
    for (let i = 0; i < n; i++) copy(v, mat(sx + (i % 2 ? 0.012 : -0.01), 0.146 + i * 0.044, 0.47, 0, ry + (i % 2 ? 0.1 : -0.06), 0), i === n - 1);
  }
  const SC = mat(0.38, 0.165, 0.5, -0.32, -0.3, 0);
  v.add(UNIT, BOARD, mul(SC, mat(0, ch / 2, -0.005, 0, 0, 0, cw + 0.002, ch + 0.002, 0.006)));
  v.add(UNIT, BOARD, mul(SC, mat(0, ch / 2, -0.039, 0, 0, 0, cw + 0.002, ch + 0.002, 0.006)));
  v.add(UNIT, PAGES, mul(SC, mat(0.004, ch / 2, -0.022, 0, 0, 0, cw - 0.002, ch - 0.008, 0.028)));
  v.add(UNIT, SPINE, mul(SC, mat(-cw / 2 - 0.004, ch / 2, -0.022, 0, 0, 0, 0.012, ch + 0.002, 0.042)));
  covers.push({ w: cw, h: ch, m: mul(D, mul(SC, mat(0, ch / 2, 0.001))) });
  v.box(0.38, 0.155, 0.47, 0.2, 0.018, 0.12, P.goldDeep);
  rbox(v, 0.38, 0.24, 0.39, 0.03, 0.2, 0.02, P.goldDeep, -0.5, -0.3, 0);
  // gold rope between two posts (tasselled finials, weighted bases)
  for (const x of [-1.18, 1.18]) {
    v.box(x, 0.025, 0.95, 0.24, 0.05, 0.24, P.bronze);
    v.box(x, 0.058, 0.95, 0.17, 0.016, 0.17, P.gold);
    v.box(x, 0.45, 0.95, 0.07, 0.8, 0.07, P.goldDeep);
    v.box(x, 0.45, 0.987, 0.02, 0.7, 0.006, P.gold);
    v.box(x, 0.88, 0.95, 0.14, 0.1, 0.14, P.gold);
    v.box(x, 0.955, 0.95, 0.07, 0.05, 0.07, P.gold);
    v.box(x, 1.0, 0.95, 0.04, 0.04, 0.04, P.goldDeep);
    v.box(x - Math.sign(x) * 0.075, 0.76, 0.95, 0.035, 0.1, 0.035, P.maroon);
    v.box(x - Math.sign(x) * 0.075, 0.83, 0.95, 0.045, 0.03, 0.045, P.gold);
  }
  const N = 14;
  const ropeY = (u) => 0.82 - 0.8 * u * (1 - u);
  for (let i = 0; i < N; i++) {
    const u0 = i / N;
    const u1 = (i + 1) / N;
    const x0 = -1.18 + 2.36 * u0;
    const x1 = -1.18 + 2.36 * u1;
    const y0 = ropeY(u0);
    const y1 = ropeY(u1);
    rbox(v, (x0 + x1) / 2, (y0 + y1) / 2, 0.95, Math.hypot(x1 - x0, y1 - y0) + 0.015, 0.055, 0.055, '#DDB75C', 0, 0, Math.atan2(y1 - y0, x1 - x0));
  }
  const grp = prop(v, null, 'bookDisplay');
  room.place(grp, 0, DZ, 0, { solid: false });
  room.obstacles.push({ type: 'box', minX: -1.38, maxX: 1.38, minZ: DZ - 0.83, maxZ: DZ + 1.08 });
  room.group.add(photoFrame);
  return photoFrame;
}

/** A giant phone on a stand showing Maya's TikTok profile. */
function giantPhone(room, A, r) {
  const v = new VoxelBuilder();
  v.box(0, 0.05, 0, 0.92, 0.1, 0.56, P.ink);
  v.box(0, 0.11, 0.17, 0.92, 0.03, 0.14, P.gold);
  rbox(v, 0, 0.55, -0.33, 0.26, 1.0, 0.06, P.ink, 0.36);
  const Ph = mat(0, 0.12, 0.04, -0.1);
  const p = new VoxelBuilder();
  p.box(0, 0.92, -0.004, 1.1, 1.88, 0.1, P.goldDeep);
  p.box(0, 0.92, 0, 1.04, 1.84, 0.12, '#1E1E22');
  p.box(0, 1.79, 0.061, 0.24, 0.05, 0.01, '#09090B');
  p.box(0.18, 1.79, 0.061, 0.045, 0.045, 0.01, '#34343E');
  p.box(0.555, 1.38, 0, 0.025, 0.24, 0.05, P.gold);
  p.box(-0.555, 1.5, 0, 0.025, 0.14, 0.05, P.gold);
  v.merge(p, Ph);
  const P0 = mat(PX, 0, PZ);
  A.quad(r.phone, 0.92, 1.636, mul(P0, mul(Ph, mat(0, 0.92, 0.0615))));
  room.place(prop(v, null, 'tiktokPhone'), PX, PZ, 0, { solid: false });
  room.obstacles.push({ type: 'box', minX: PX - 0.62, maxX: PX + 0.62, minZ: PZ - 0.52, maxZ: PZ + 0.36 });
}

/** Maroon bookcase: its flat-lying books are Maya's TikTok playlists (spines on atlas B). */
function playlistShelf(room, B, r) {
  const v = new VoxelBuilder();
  const W = 1.84;
  const H = 1.92;
  const D = 0.44;
  v.boxMin(-W / 2, 0, -D / 2, -W / 2 + 0.07, H, D / 2, P.maroon);
  v.boxMin(W / 2 - 0.07, 0, -D / 2, W / 2, H, D / 2, P.maroon);
  v.boxMin(-W / 2, 0, -D / 2, W / 2, H, -D / 2 + 0.04, P.maroonDeep);
  v.boxMin(-W / 2 - 0.03, 0, -D / 2, W / 2 + 0.03, 0.12, D / 2 + 0.03, P.maroonDeep);
  v.boxMin(-W / 2 - 0.03, 0.09, D / 2 + 0.03, W / 2 + 0.03, 0.11, D / 2 + 0.04, P.gold);
  for (const y of [0.12, 0.58, 1.02, 1.46]) {
    v.boxMin(-W / 2, y, -D / 2, W / 2, y + 0.04, D / 2, P.maroon);
    v.boxMin(-W / 2, y, D / 2 - 0.005, W / 2, y + 0.04, D / 2 + 0.012, P.gold);
  }
  v.boxMin(-W / 2 - 0.04, H - 0.06, -D / 2 - 0.02, W / 2 + 0.04, H, D / 2 + 0.04, P.maroonDeep);
  v.boxMin(-W / 2 - 0.06, H, -D / 2 - 0.03, W / 2 + 0.06, H + 0.05, D / 2 + 0.05, P.gold);
  for (const x of [-W / 2 + 0.035, W / 2 - 0.035]) v.boxMin(x - 0.012, 0.12, D / 2, x + 0.012, H - 0.06, D / 2 + 0.012, P.gold);
  // playlist books lying flat, two stacks of two per row
  const S0 = mat(SX, 0, SZ);
  const rows = [0.62, 1.06];
  for (let i = 0; i < 8; i++) {
    const row = Math.floor(i / 4);
    const stack = Math.floor((i % 4) / 2);
    const k = i % 2;
    const L = 0.74 - k * 0.05;
    const cx = (stack ? 0.41 : -0.41) + (k ? -0.012 : 0.01) * (stack ? -1 : 1);
    const cy = rows[row] + 0.075 + k * 0.155;
    const pl = PLAYLISTS[i];
    v.box(cx, cy, 0, L, 0.15, 0.34, pl.bg);
    v.box(cx, cy, -0.018, L + 0.006, 0.112, 0.3, '#F2E6CC');
    B.quad(r.spines[i], L - 0.07, 0.128, mul(S0, mat(cx, cy, 0.1725)));
  }
  // ordinary books (bands, labels, a leaning one) on the bottom and top rows; dentils under the top
  bookRow(v, -W / 2 + 0.09, W / 2 - 0.09, 0.16, 0.42, -D / 2 + 0.06, D / 2 - 0.05, 31, false);
  bookRow(v, -W / 2 + 0.09, W / 2 - 0.09, 1.5, 0.36, -D / 2 + 0.06, D / 2 - 0.05, 47, false);
  for (let x = -W / 2 + 0.1; x <= W / 2 - 0.09; x += 0.09) v.box(x, H - 0.09, D / 2 + 0.01, 0.045, 0.04, 0.03, P.gold);
  for (const sx of [-1, 1]) {
    v.box(sx * (W / 2 + 0.005), 0.86, D / 2 - 0.02, 0.012, 1.3, 0.012, P.gold);
    v.box(sx * (W / 2 - 0.035), 0.06, D / 2 + 0.04, 0.09, 0.09, 0.02, P.gold);
  }
  // header sign standing on top
  v.box(0, H + 0.27, -0.02, 1.6, 0.46, 0.05, P.gold);
  for (const x of [-0.6, 0.6]) v.box(x, H + 0.06, -0.02, 0.06, 0.06, 0.06, P.goldDeep);
  B.quad(r.header, 1.5, 0.381, mul(S0, mat(0, H + 0.27, 0.007)));
  room.place(prop(v, { w: W + 0.06, d: D + 0.06 }, 'playlistShelf'), SX, SZ, 0);
}

/** Back wall: two tall shelves, a ladder, a golden-hour window with curtains and the title plaque. */
function backWall(room, A, B, r) {
  const hd = room.depth / 2;
  const zs = -hd + 0.23;
  const BC = 2.45;
  const CW = 1.8;
  const CH = 2.62;
  for (const [x, seed] of [[-BC, 3], [BC, 5]]) {
    room.place(prop(bookcase({ w: CW, h: CH, d: 0.44, rows: 5, seed, wood: '#835A39' }), { w: CW, d: 0.44 }, 'bookcase'), x, zs);
  }
  const v = new VoxelBuilder();
  wallStripes(v, room, '#EADBBE');
  // frieze under the crown: a maroon band with gold diamonds
  v.boxMin(-room.width / 2, 2.7, -hd, room.width / 2, 2.84, -hd + 0.01, P.maroon);
  for (let x = -3.3; x <= 3.31; x += 0.3) rbox(v, x, 2.77, -hd + 0.012, 0.07, 0.07, 0.008, P.gold, 0, 0, Math.PI / 4);
  const top = CH + 0.1;
  // top of the left case: a stand for the spinning globe (the globe itself is animated), books, a vase
  v.box(GLOBE.x, top + 0.025, GLOBE.z, 0.26, 0.05, 0.22, WOOD_D);
  v.box(GLOBE.x, top + 0.055, GLOBE.z, 0.2, 0.012, 0.16, P.gold);
  v.box(GLOBE.x, top + 0.075, GLOBE.z, 0.05, 0.05, 0.05, P.goldDeep);
  for (let i = 0; i < 7; i++) {
    const a = -0.6 + (i / 6) * Math.PI * 0.98;
    rbox(v, GLOBE.x + Math.sin(a) * 0.155, GLOBE.y - Math.cos(a) * 0.155, GLOBE.z, 0.1, 0.03, 0.03, P.gold, 0, 0, a);
  }
  for (let i = 0; i < 3; i++) v.box(-BC - 0.3 + (i % 2) * 0.02, top + 0.03 + i * 0.06, zs + 0.04, 0.36 - i * 0.04, 0.06, 0.26, [P.maroon, '#3E6B4F', P.goldDeep][i]);
  v.box(-BC - 0.3, top + 0.2, zs + 0.04, 0.09, 0.03, 0.09, P.gold);
  v.box(-BC + 0.08, top + 0.1, zs + 0.02, 0.13, 0.2, 0.13, P.cream);
  v.box(-BC + 0.08, top + 0.21, zs + 0.02, 0.08, 0.04, 0.08, tone(P.cream, 0.85));
  for (const [dx, dy, c] of [[-0.03, 0.3, P.rose], [0.03, 0.27, '#F3D27A'], [0, 0.34, P.lily]]) {
    v.box(-BC + 0.08 + dx, top + dy - 0.06, zs + 0.02, 0.012, 0.12, 0.012, P.leafDark);
    v.box(-BC + 0.08 + dx, top + dy, zs + 0.02, 0.06, 0.06, 0.06, c);
  }
  // top of the right case: a trailing plant with vines over the crown, a scroll box and a candle lamp
  const tp = pottedPlant(0.5, 3, '#C27A5B');
  v.merge(tp, mat(BC + 0.5, top, zs + 0.02));
  for (const [dx, n] of [[-0.08, 4], [0.06, 3], [0.14, 5]]) {
    for (let i = 0; i < n; i++) v.box(BC + 0.5 + dx + (i % 2) * 0.02, top - 0.02 - i * 0.07, zs + 0.31, 0.06, 0.07, 0.05, i % 2 ? P.leaf : P.leafDark, 0.4);
  }
  v.box(BC - 0.25, top + 0.08, zs + 0.03, 0.42, 0.16, 0.24, P.maroon);
  v.box(BC - 0.25, top + 0.165, zs + 0.03, 0.44, 0.03, 0.26, P.gold);
  for (let i = 0; i < 3; i++) {
    v.box(BC - 0.25 + (i - 1) * 0.03, top + 0.205 + (i % 2) * 0.05, zs - 0.03 + i * 0.06, 0.34, 0.05, 0.05, P.paper, (i - 1) * 0.15);
    v.box(BC - 0.25 + (i - 1) * 0.03, top + 0.205 + (i % 2) * 0.05, zs - 0.03 + i * 0.06, 0.03, 0.056, 0.056, i === 1 ? P.maroon : P.gold, (i - 1) * 0.15);
  }
  // ladder leaning on the right shelf, hooked on a brass rail
  const L = new VoxelBuilder();
  for (const x of [-0.23, 0.23]) {
    L.box(x, 1.31, 0, 0.06, 2.62, 0.06, WOOD);
    L.box(x + Math.sign(x) * 0.031, 1.31, 0.0, 0.004, 2.5, 0.03, tone(WOOD, 1.2));
    L.box(x, 2.6, -0.07, 0.06, 0.06, 0.16, P.gold);
    L.box(x, 0.06, 0.02, 0.1, 0.1, 0.1, P.ink);
    L.box(x, 0.06, 0.075, 0.07, 0.07, 0.012, P.gold);
  }
  for (let y = 0.32; y < 2.5; y += 0.3) {
    L.box(0, y, 0, 0.46, 0.045, 0.05, WOOD_D);
    L.box(0, y + 0.024, 0.0, 0.4, 0.006, 0.04, tone(WOOD_D, 1.35));
    for (const x of [-0.23, 0.23]) L.box(x, y, 0.031, 0.03, 0.03, 0.006, P.gold);
  }
  v.merge(L, mat(1.98, 0, -hd + 0.92, -0.17));
  v.boxMin(BC - CW / 2 + 0.05, 2.5, zs + 0.27, BC + CW / 2 - 0.05, 2.53, zs + 0.3, P.gold);
  for (const x of [BC - CW / 2 + 0.12, BC, BC + CW / 2 - 0.12]) v.box(x, 2.515, zs + 0.25, 0.03, 0.05, 0.06, P.goldDeep);
  // window: frame, mullions, sill (sky is unlit art on atlas A)
  const wz = -hd;
  const WX = 0.85;
  const WY0 = 0.84;
  const WY1 = 1.66;
  A.quad(r.sky, 2 * WX, WY1 - WY0, mat(0, (WY0 + WY1) / 2, wz + 0.012));
  // the view through the panes, repainted for the player's time of day (daytime.js applyRoom)
  room.windowViews = [{ x: 0, y: (WY0 + WY1) / 2, z: wz + 0.03, w: 2 * WX, h: WY1 - WY0 }];
  v.boxMin(-WX - 0.08, WY1, wz, WX + 0.08, WY1 + 0.08, wz + 0.1, P.white);
  v.boxMin(-WX - 0.08, WY0 - 0.08, wz, WX + 0.08, WY0, wz + 0.1, P.white);
  v.boxMin(-WX - 0.08, WY0, wz, -WX, WY1, wz + 0.1, P.white);
  v.boxMin(WX, WY0, wz, WX + 0.08, WY1, wz + 0.1, P.white);
  for (const x of [-0.283, 0.283]) v.boxMin(x - 0.025, WY0, wz, x + 0.025, WY1, wz + 0.07, P.white);
  v.boxMin(-WX, 1.37, wz, WX, 1.41, wz + 0.06, P.white);
  for (const x of [-0.283, 0.283]) v.box(x, 1.39, wz + 0.07, 0.07, 0.07, 0.02, P.cream);
  v.boxMin(-WX - 0.08, WY1 + 0.06, wz + 0.1, WX + 0.08, WY1 + 0.08, wz + 0.11, P.cream);
  v.boxMin(-WX - 0.16, WY0 - 0.14, wz, WX + 0.16, WY0 - 0.07, wz + 0.2, P.goldDeep);
  v.boxMin(-WX - 0.16, WY0 - 0.08, wz + 0.17, WX + 0.16, WY0 - 0.07, wz + 0.21, P.gold);
  // curtains with folds, gold edging, hems and tasselled tiebacks, rod with finials above
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const x0 = sx * (0.84 + i * 0.09);
      const zf = wz + (i % 2 ? 0.1 : 0.14);
      v.boxMin(Math.min(x0, x0 + sx * 0.09), 0.66, wz, Math.max(x0, x0 + sx * 0.09), 1.86, zf, i % 2 ? P.maroonDeep : P.maroon);
      v.boxMin(Math.min(x0, x0 + sx * 0.09), 0.6, wz, Math.max(x0, x0 + sx * 0.09), 0.66, zf + 0.004, i % 2 ? tone(P.maroonDeep, 0.8) : tone(P.maroon, 0.8));
      if (i % 2 === 0) v.boxMin(Math.min(x0, x0 + sx * 0.09) + 0.03, 1.2, zf, Math.max(x0, x0 + sx * 0.09) - 0.03, 1.8, zf + 0.004, tone(P.maroon, 1.25));
    }
    v.boxMin(Math.min(sx * 0.84, sx * 0.87), 0.6, wz, Math.max(sx * 0.84, sx * 0.87), 1.86, wz + 0.15, P.gold);
    v.boxMin(sx > 0 ? 0.8 : -1.24, 1.06, wz, sx > 0 ? 1.24 : -0.8, 1.13, wz + 0.17, P.gold);
    v.box(sx * 0.82, 1.0, wz + 0.17, 0.05, 0.12, 0.05, P.gold);
    v.box(sx * 0.82, 0.92, wz + 0.17, 0.07, 0.05, 0.07, P.goldDeep);
    v.box(sx * 1.3, 1.9, wz + 0.1, 0.08, 0.08, 0.08, P.gold);
    v.box(sx * 1.36, 1.9, wz + 0.1, 0.04, 0.12, 0.12, P.goldDeep);
  }
  v.boxMin(-1.3, 1.88, wz + 0.08, 1.3, 1.92, wz + 0.12, P.goldDeep);
  for (let x = -1.2; x <= 1.21; x += 0.12) v.box(x, 1.9, wz + 0.1, 0.03, 0.06, 0.06, P.gold);
  // title plaque with corner studs
  v.boxMin(-1.1, 1.95, wz, 1.1, 2.47, wz + 0.05, P.gold);
  v.boxMin(-1.14, 1.93, wz, 1.14, 1.97, wz + 0.07, P.goldDeep);
  v.boxMin(-1.14, 2.45, wz, 1.14, 2.49, wz + 0.07, P.goldDeep);
  for (const sx of [-1, 1]) for (const y of [1.95, 2.47]) v.box(sx * 1.14, y, wz + 0.07, 0.07, 0.07, 0.03, P.bronze);
  B.quad(r.title, 2.06, 0.483, mat(0, 2.21, wz + 0.053));
  for (const sx of [-1, 1]) A.quad(r.spark, 0.26, 0.26, mat(sx * 1.38, 2.2, wz + 0.01));
  room.group.add(prop(v, null, 'backWall'));
  for (const [x, seed] of [[-1.33, 1], [1.33, 2]]) room.place(prop(pottedPlant(1.05, seed), { w: 0.45 * 1.05, d: 0.45 * 1.05 }, 'plant'), x, -hd + 0.38);
}

/** Reading nook: armchair, floor lamp (unlit warm shade), side table with books and the Writer mug. */
function readingNook(room, A, r) {
  const NX = -2.55;
  const NZ = 1.95;
  const rug = new VoxelBuilder();
  rug.boxMin(-0.95, 0, -0.72, 0.95, 0.012, 0.72, P.maroon);
  rug.boxMin(-0.72, 0, -0.95, 0.72, 0.012, 0.95, P.maroon);
  rug.boxMin(-0.85, 0, -0.62, 0.85, 0.018, 0.62, '#EADCC0');
  rug.boxMin(-0.62, 0, -0.85, 0.62, 0.018, 0.85, '#EADCC0');
  rug.boxMin(-0.3, 0, -0.3, 0.3, 0.022, 0.3, P.gold);
  room.place(prop(rug, null, 'rug'), NX - 0.05, NZ + 0.05, 0, { solid: false });

  const C = '#C27A5B';
  const CD = '#A5614A';
  const c = new VoxelBuilder();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.box(sx * 0.38, 0.055, sz * 0.33, 0.08, 0.11, 0.08, P.gold);
  c.box(0, 0.26, 0, 0.92, 0.3, 0.84, C);
  c.box(0, 0.46, 0.07, 0.6, 0.12, 0.66, P.cream);
  c.box(0, 0.8, -0.32, 0.92, 0.8, 0.2, C);
  c.box(0, 1.2, -0.32, 0.86, 0.1, 0.26, CD);
  c.box(0, 0.78, -0.2, 0.56, 0.5, 0.06, P.cream);
  for (const sx of [-1, 1]) {
    c.box(sx * 0.38, 0.56, 0.02, 0.18, 0.3, 0.8, C);
    c.box(sx * 0.38, 0.74, 0.04, 0.22, 0.08, 0.86, CD);
  }
  rbox(c, 0.15, 0.66, -0.1, 0.3, 0.27, 0.1, P.maroon, -0.25, 0, 0.3);
  rbox(c, 0.39, 0.8, 0.22, 0.2, 0.03, 0.26, P.maroon, 0, 0.3, 0); // open book on the armrest
  rbox(c, 0.39, 0.82, 0.22, 0.18, 0.012, 0.24, P.paper, 0, 0.3, 0);
  // tufted back (buttons), piping on the seat, a striped knitted throw over the left arm and back
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) c.box(-0.16 + i * 0.16, 0.66 + j * 0.2, -0.165, 0.03, 0.03, 0.012, tone(P.cream, 0.7));
  c.box(0, 0.525, 0.4, 0.6, 0.012, 0.012, P.gold);
  c.box(0, 0.11, 0.425, 0.92, 0.02, 0.012, tone(C, 0.7));
  const throwCols = [P.cream, P.maroon, P.cream, P.gold, P.cream, P.maroon];
  throwCols.forEach((col, i) => {
    const z = -0.22 + i * 0.09;
    c.box(-0.38, 0.795, z, 0.26, 0.03, 0.09, col);
    c.box(-0.5, 0.62, z, 0.03, 0.34, 0.09, col);
  });
  for (let i = 0; i < 6; i++) c.box(-0.5, 0.43, -0.2 + i * 0.09, 0.03, 0.04, 0.02, P.gold);
  rbox(c, -0.1, 1.265, -0.32, 0.6, 0.03, 0.3, P.cream, 0, 0, 0.04);
  rbox(c, -0.1, 1.268, -0.32, 0.6, 0.032, 0.07, P.maroon, 0, 0, 0.04);
  rbox(c, -0.1, 1.268, -0.22, 0.6, 0.032, 0.03, P.gold, 0, 0, 0.04);
  // footstool with a small stack of books
  c.box(0.08, 0.13, 0.66, 0.42, 0.18, 0.3, C);
  c.box(0.08, 0.235, 0.66, 0.44, 0.03, 0.32, P.cream);
  for (const sx of [-1, 1]) c.box(0.08 + sx * 0.17, 0.02, 0.66, 0.05, 0.04, 0.22, P.gold);
  c.box(0.1, 0.27, 0.66, 0.2, 0.04, 0.14, P.boxBlue);
  c.box(0.09, 0.305, 0.67, 0.18, 0.03, 0.13, P.goldDeep);
  room.place(prop(c, { w: 0.92, d: 0.84 }, 'armchair'), NX, NZ, 0.45);
  // the footstool sits outside the chair's collision circle: give it its own
  room.obstacles.push({ type: 'circle', x: NX + 0.08 * Math.cos(0.45) + 0.66 * Math.sin(0.45), z: NZ - 0.08 * Math.sin(0.45) + 0.66 * Math.cos(0.45), r: 0.3 });

  // floor lamp: the shade is an unlit warm block so it reads as "on"
  const LX = -3.15;
  const LZ = 1.45;
  const l = new VoxelBuilder();
  l.box(0, 0.025, 0, 0.36, 0.05, 0.36, P.bronze);
  l.box(0, 0.8, 0, 0.05, 1.5, 0.05, P.bronze);
  l.box(0, 1.47, 0, 0.5, 0.04, 0.5, P.gold);
  l.box(0, 1.79, 0, 0.4, 0.04, 0.4, P.gold);
  room.place(prop(l, { w: 0.4, d: 0.4 }, 'lamp'), LX, LZ);
  A.block(r.glow, mat(LX, 1.63, LZ, 0, 0, 0, 0.46, 0.3, 0.46));

  // side table with a book stack and the "Writer" mug
  const t = new VoxelBuilder();
  t.box(0, 0.02, 0, 0.4, 0.04, 0.4, WOOD_D);
  t.box(0, 0.3, 0, 0.1, 0.52, 0.1, WOOD_D);
  t.box(0, 0.575, 0, 0.58, 0.05, 0.58, WOOD);
  t.box(0, 0.575, 0, 0.42, 0.052, 0.66, WOOD);
  t.box(-0.06, 0.63, 0.02, 0.34, 0.06, 0.24, P.boxBlue);
  t.box(-0.05, 0.69, 0.0, 0.3, 0.06, 0.22, P.goldDeep);
  t.box(-0.07, 0.745, 0.03, 0.27, 0.05, 0.2, P.maroon);
  t.box(0.17, 0.665, 0.12, 0.12, 0.13, 0.12, P.cream);
  t.box(0.17, 0.725, 0.12, 0.125, 0.025, 0.125, P.gold);
  t.box(0.245, 0.66, 0.12, 0.035, 0.08, 0.04, P.maroon);
  room.place(prop(t, { w: 0.58, d: 0.58 }, 'sideTable'), -3.0, 2.85);
}

/** Front right: a book cart and a plant. Runner carpet from the door to the stage. */
function frontProps(room) {
  const run = new VoxelBuilder();
  run.boxMin(-0.55, 0, -0.6, 0.55, 0.012, 3.1, P.maroon);
  run.boxMin(-0.55, 0, -0.6, -0.47, 0.016, 3.1, P.gold);
  run.boxMin(0.47, 0, -0.6, 0.55, 0.016, 3.1, P.gold);
  // woven pattern: inner gold lines, gold diamonds with maroon hearts, cream dots, fringed ends
  for (const sx of [-1, 1]) run.boxMin(sx * 0.37 - 0.012, 0, -0.5, sx * 0.37 + 0.012, 0.015, 3.0, P.gold);
  for (let z = -0.25; z < 3.0; z += 0.7) {
    rbox(run, 0, 0.0075, z, 0.2, 0.015, 0.2, P.gold, 0, Math.PI / 4, 0);
    rbox(run, 0, 0.009, z, 0.1, 0.017, 0.1, '#842A36', 0, Math.PI / 4, 0);
    for (const sx of [-1, 1]) run.box(sx * 0.22, 0.0075, z, 0.05, 0.015, 0.05, P.cream);
    run.box(0, 0.0075, z + 0.35, 0.04, 0.015, 0.04, P.gold);
  }
  for (const [z0, dz] of [[3.1, 1], [-0.6, -1]]) {
    for (let x = -0.5; x <= 0.51; x += 0.0625) run.box(x, 0.006, z0 + dz * 0.04, 0.022, 0.012, 0.08, P.cream);
  }
  room.place(prop(run, null, 'runner'), 0, 0, 0, { solid: false });

  const v = new VoxelBuilder();
  for (const sx of [-1, 1]) {
    v.box(sx * 0.5, 0.48, 0, 0.05, 0.84, 0.44, WOOD_D);
    v.box(sx * 0.5, 0.48, 0.225, 0.07, 0.84, 0.012, tone(WOOD_D, 1.25));
    for (const sz of [-1, 1]) {
      v.box(sx * 0.46, 0.05, sz * 0.16, 0.08, 0.1, 0.1, P.ink);
      v.box(sx * 0.46, 0.05, sz * 0.16 + sz * 0.052, 0.04, 0.04, 0.008, P.gold);
      v.box(sx * 0.46, 0.115, sz * 0.16, 0.05, 0.03, 0.05, P.goldDeep);
    }
  }
  v.box(0, 0.16, 0, 1.0, 0.04, 0.44, WOOD);
  v.box(0, 0.54, 0, 1.0, 0.04, 0.44, WOOD);
  for (const y of [0.16, 0.54]) v.box(0, y + 0.012, 0.222, 1.0, 0.016, 0.012, P.gold);
  v.box(0.56, 0.86, 0, 0.04, 0.04, 0.4, P.gold);
  for (const sz of [-1, 1]) v.box(0.54, 0.86, sz * 0.18, 0.06, 0.06, 0.04, P.goldDeep);
  bookRow(v, -0.45, 0.47, 0.18, 0.34, -0.15, 0.15, 61, false);
  bookRow(v, -0.45, 0.47, 0.56, 0.3, -0.15, 0.15, 67, false);
  v.box(-0.2, 0.9, 0, 0.24, 0.08, 0.3, P.cream);
  v.box(-0.2, 0.945, 0, 0.26, 0.012, 0.32, P.gold);
  room.place(prop(pottedPlant(1.0, 4), { w: 0.45, d: 0.45 }, 'plant'), 3.02, 3.2);
}

// Fan-letter bookcase on the right wall: four shelves of books with a gap on the middle shelf
// where the fan-letter book stands (the book itself is dynamic: js/game/letters.js).
const LC = { x: 3.2, z: 2.15, w: 1.1, h: 1.8, d: 0.36, slotX: 0.075, shelfY: 0.86 };
function letterCase(room) {
  const v = new VoxelBuilder();
  const { w, h, d } = LC;
  for (const sx of [-1, 1]) {
    v.box(sx * (w / 2 - 0.02), h / 2, 0, 0.04, h, d, WOOD_D);
    v.box(sx * (w / 2 - 0.02), h / 2, d / 2 + 0.002, 0.05, h, 0.01, tone(WOOD_D, 1.2));
  }
  v.box(0, h / 2, -d / 2 + 0.015, w - 0.04, h, 0.03, tone(WOOD_D, 0.8));
  const shelves = [0.06, 0.46, LC.shelfY, 1.36];
  for (const y of shelves) {
    v.box(0, y, 0, w - 0.06, 0.035, d - 0.02, WOOD);
    v.box(0, y, d / 2 - 0.004, w - 0.06, 0.035, 0.01, P.gold);
  }
  v.box(0, h + 0.03, 0.01, w + 0.08, 0.06, d + 0.05, WOOD_D);
  v.box(0, h + 0.07, 0.02, w - 0.1, 0.03, d - 0.02, P.gold);
  const zb = -d / 2 + 0.03;
  const zf = d / 2 - 0.03;
  bookRow(v, -0.5, 0.5, 0.06 + 0.0175, 0.36, zb, zf, 91, false);
  bookRow(v, -0.5, 0.5, 0.46 + 0.0175, 0.36, zb, zf, 93, true);
  bookRow(v, -0.5, LC.slotX - 0.06, LC.shelfY + 0.0175, 0.46, zb, zf, 95, false);
  bookRow(v, LC.slotX + 0.035, 0.5, LC.shelfY + 0.0175, 0.46, zb, zf, 97, false);
  bookRow(v, -0.5, 0.5, 1.36 + 0.0175, 0.4, zb, zf, 99, true);
  // little gold hearts on the crown: this is the readers' shelf
  for (const x of [-0.3, 0, 0.3]) {
    v.box(x, h + 0.1, d / 2 - 0.02, 0.06, 0.06, 0.02, P.maroon, 0);
  }
  room.place(prop(v, { w, d }, 'letterCase'), LC.x, LC.z, -Math.PI / 2);
}

// ---------------------------------------------------------------------------------
// Room
// ---------------------------------------------------------------------------------
export async function buildInterior(ctx = {}) {
  // Maya's real logo (TikTok profile picture) and book cover (art.js, shared and cached)
  const [, logo, bookTex] = await Promise.all([fontsReady(), artImage('logo'), artTexture('book')]);
  const room = kit.createRoom({ width: 7, depth: 8, wall: '#F4EAD3', wainscot: P.maroon, trim: P.goldDeep, floor: 'planks', floorColor: '#B98C5C', background: P.cream });
  room.id = 'library';
  const { A, B, r } = libraryAtlases(logo, { followers: stat('tiktokFollowers', '26.7K'), likes: stat('tiktokLikes', '289.4K') });

  room.place(prop(boardFloor(room, '#B98C5C', { seed: 3 }), null, 'boards'), 0, 0, 0, { solid: false });
  backWall(room, A, B, r);
  const covers = [];
  const photoFrame = bookDisplay(room, B, r, covers);
  giantPhone(room, A, r);
  playlistShelf(room, B, r);
  readingNook(room, A, r);
  frontProps(room);
  letterCase(room);

  room.addStation({
    id: 'lib-book', x: 0, z: 0.35, look: { x: 0, z: DZ }, emote: 'hugBook', face: 'heart', labelY: 2.6,
    line: { my: 'ဒါ ကျွန်မရဲ့ စာအုပ်လေး "အမှန်မြင်ခြင်း" ပါရှင့်', en: 'This is my book, Reality Check!' },
  });
  room.addStation({
    id: 'lib-tiktok', x: PX, z: 0.5, look: { x: PX, z: PZ }, emote: 'phone', face: 'star', labelY: 2.45,
    line: { my: 'TikTok မှာ အတွေးလေးတွေ မျှဝေနေတယ်နော်', en: 'I share my thoughts on TikTok!' },
  });
  room.addStation({
    id: 'lib-shelf', x: SX, z: 0.5, look: { x: SX, z: SZ }, emote: 'point', face: 'happy', labelY: 2.6,
    line: { my: 'ကြိုက်တဲ့ Playlist လေး ရွေးကြည့်နော်', en: 'Pick a playlist you like!' },
  });
  // fan letters: the game plays its own cut-scene here (letters.js), not the info sheet
  const caseM = mat(LC.x, 0, LC.z, 0, -Math.PI / 2, 0);
  const standL = new THREE.Vector3(LC.slotX, 0, LC.d / 2 + 0.55).applyMatrix4(caseM);
  room.addStation({
    id: 'lib-letters', x: standL.x, z: standL.z, look: { x: LC.x, z: standL.z }, emote: 'hugBook', face: 'heart', labelY: 2.15,
    line: { my: 'ပရိသတ်လေးတွေ ရေးပေးခဲ့တဲ့ စာလေးတွေပါ', en: 'Letters from my readers' },
  });

  room.bake();
  const signsA = A.mesh('signsA');
  const signsB = B.mesh('signsB');
  room.group.add(signsA, signsB, artQuads(bookTex, covers, 'bookCovers'));
  room.textures.push(signsA.userData.texture, signsB.userData.texture); // (the shared cover texture is not ours to dispose)
  room.photoFrame = photoFrame;

  // the fan-letter book, standing on the bookcase's middle shelf, spine out
  const letterBook = createLetterBook({ hi: ctx.quality !== 'low' });
  const shelfMatrix = mul(caseM, new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0))
    .setPosition(LC.slotX, LC.shelfY + 0.0175 + LB_H / 2 + 0.008, LC.d / 2 - 0.02));
  shelfMatrix.decompose(letterBook.group.position, letterBook.group.quaternion, letterBook.group.scale);
  room.group.add(letterBook.group);
  const shelfDir = new THREE.Vector3(0, 0, 1).transformDirection(caseM);
  // ... and the armchair in the reading nook, where she sits to read it (readingNook(): NX, NZ, turned 0.45)
  const chairM = mat(-2.55, 0, 1.95, 0, 0.45, 0);
  const stand = new THREE.Vector3(0.75, 0, 0.55).applyMatrix4(chairM); // front-right of the chair, clear of the footstool
  const seat = new THREE.Vector3(0, 0.52, 0.0).applyMatrix4(chairM);
  room.letterShelf = {
    book: letterBook, shelfMatrix, shelfDir: { x: shelfDir.x, z: shelfDir.z },
    chair: { stand: { x: stand.x, z: stand.z }, seat: { x: seat.x, y: seat.y, z: seat.z }, heading: 0.45 },
  };
  const disposeRoom = room.dispose.bind(room);
  room.dispose = () => {
    letterBook.dispose();
    disposeRoom();
  };
  void LB_W;

  // ambient animation: sparkles round the book, pages drifting up, hearts popping off the phone
  const dyn = makeDyn();
  const bookSpk = [0, 1, 2, 3].map(() => {
    const p = dyn.part();
    dyn.sparkle(p, 1);
    return p;
  });
  const otherSpk = [0, 1, 2, 3].map(() => {
    const p = dyn.part();
    dyn.sparkle(p, 1);
    return p;
  });
  const pages = [0, 1, 2, 3].map(() => {
    const p = dyn.part();
    dyn.box(p, 0, 0, 0, 0.2, 0.27, 0.014, P.white);
    dyn.box(p, -0.1, 0, 0.0, 0.012, 0.27, 0.018, P.parchment);
    return p;
  });
  const hearts = [0, 1, 2].map(() => {
    const p = dyn.part();
    dyn.heart(p);
    return p;
  });
  // blocky globe on the left bookcase: rounded ocean core, land patches, gold axis pin
  const globe = dyn.part();
  const OC = '#3E79B8';
  dyn.box(globe, 0, 0, 0, 0.2, 0.2, 0.2, OC);
  dyn.box(globe, 0, 0, 0, 0.24, 0.14, 0.14, tone(OC, 1.08));
  dyn.box(globe, 0, 0, 0, 0.14, 0.14, 0.24, tone(OC, 0.94));
  dyn.box(globe, 0, 0, 0, 0.14, 0.24, 0.14, tone(OC, 1.04));
  for (const [x, y, z, w, h, d, c] of [[0.121, 0.03, 0.02, 0.012, 0.08, 0.1, P.leaf], [-0.05, 0.05, 0.121, 0.09, 0.07, 0.012, '#D9B45A'], [0.03, -0.04, -0.121, 0.1, 0.06, 0.012, P.leaf],
    [-0.121, -0.02, -0.03, 0.012, 0.09, 0.07, '#D9B45A'], [0.04, 0.121, 0.0, 0.08, 0.012, 0.06, P.white], [0.06, -0.02, 0.121, 0.05, 0.05, 0.012, P.leafDark]]) dyn.box(globe, x, y, z, w, h, d, c);
  dyn.box(globe, 0, 0, 0, 0.02, 0.32, 0.02, P.gold);
  // dust motes drifting in the window light
  const motes = Array.from({ length: 10 }, (_, i) => {
    const p = dyn.part();
    dyn.box(p, 0, 0, 0, 0.03, 0.03, 0.03, i % 3 ? '#FFF4CF' : '#F3D27A');
    return p;
  });
  dyn.build(room.group);
  const slotW = new THREE.Vector3(LC.slotX, LC.shelfY + 0.5, LC.d / 2 + 0.05).applyMatrix4(caseM);
  const fixed = [[SX - 0.88, 2.25, SZ + 0.08, 0.26], [SX + 0.88, 2.3, SZ + 0.08, 0.2], [-0.62, 2.0, DZ + 0.1, 0.2], [slotW.x, slotW.y, slotW.z, 0.16]];
  const BX = 0;
  const BY = 1.55;
  const BZ = DZ - 0.15;
  let boostBook = 0;
  let boostTok = 0;
  let boostShelf = 0;
  room.animators.push((dt, t, state) => {
    const act = state ? state.active : null;
    if (act === 'lib-book') boostBook += dt * 1.5;
    else if (act === 'lib-tiktok') boostTok += dt * 1.6;
    else if (act === 'lib-shelf') boostShelf += dt * 1.5;
    const tb = t + boostBook;
    const tt = t + boostTok;
    // sparkles circle the book but stay behind its cover plane, so the art is never hidden
    for (let i = 0; i < 4; i++) {
      const a = tb * 0.55 + i * Math.PI * 0.5;
      const sc = 0.32 * twinkle(tb * 0.8 + i * 0.29);
      dyn.set(bookSpk[i], BX + Math.cos(a) * 0.86, BY + Math.sin(tb * 1.1 + i * 1.9) * 0.55, BZ - 0.12 - Math.abs(Math.sin(a)) * 0.4, 0, Math.sin(tb + i) * 0.3, 0, sc);
    }
    for (let i = 0; i < fixed.length; i++) {
      const f = fixed[i];
      const ts = i < 2 ? t + boostShelf : t;
      dyn.set(otherSpk[i], f[0], f[1] + Math.sin(ts * 1.4 + i) * 0.04, f[2], 0, Math.sin(ts * 0.9 + i * 2) * 0.35, 0, f[3] * twinkle(ts * 0.7 + i * 0.37));
    }
    // pages lift off the top of the book and drift up behind it
    for (let i = 0; i < 4; i++) {
      const u = frac(tb / 5 + i / 4);
      const s = popLife(u, 0.12, 0.78) * 0.9;
      dyn.set(pages[i], BX + (i % 2 ? 1 : -1) * (0.15 + u * 0.45) + Math.sin(u * 5 + i * 1.7) * 0.12, 2.2 + u * 0.95, BZ - 0.32 + Math.cos(u * 4 + i * 2.3) * 0.08,
        Math.sin(u * 8 + i) * 0.5, u * 3 + i, Math.cos(u * 7 + i) * 0.6, s);
    }
    // hearts pop off the phone's top corner (squash and stretch on the pop), float up and fade
    for (let i = 0; i < 3; i++) {
      const u = frac(tt / 3.2 + i / 3);
      const p = popLife(u, 0.16, 0.72) * 0.85;
      const sq = 1 + 0.22 * Math.sin(u * 32) * (1 - clamp01(u * 3));
      dyn.set(hearts[i], PX + 0.22 + Math.sin(u * 6 + i * 2) * 0.12 + (i - 1) * 0.08, 1.95 + u * 0.8, PZ + 0.12,
        0, Math.sin(u * 5 + i) * 0.4, Math.sin(u * 4 + i) * 0.2, p * sq, p / sq, p);
    }
    // the globe turns on its tilted axis (faster while Maya browses the playlists)
    dyn.set(globe, GLOBE.x, GLOBE.y, GLOBE.z, 0, (t + boostShelf) * 0.7, 0.41, 1, 1, 1, 'ZYX');
    // dust motes rise slowly, drift and twinkle
    for (let i = 0; i < motes.length; i++) {
      const u = frac(t * 0.045 + i * 0.37);
      const s = Math.sin(u * Math.PI) * (0.55 + 0.45 * Math.sin(t * 2.3 + i * 1.7));
      dyn.set(motes[i], -1.15 + ((i * 0.61) % 1) * 2.3 + Math.sin(t * 0.35 + i * 2.1) * 0.18, 1.45 + u * 1.15, -3.45 + ((i * 0.37) % 1) * 1.1 + Math.cos(t * 0.3 + i) * 0.1,
        t * 0.5 + i, t * 0.7 + i, 0, s);
    }
    dyn.commit();
  });
  return room;
}
