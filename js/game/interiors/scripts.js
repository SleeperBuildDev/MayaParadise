// Script Studio (Script စတူဒီယို): a small film / writing studio.
//   - three giant script books standing in clouds on a little stage: thin "The Short Script"
//     (scr-short), medium "The Standard Script" (scr-standard), thick "Long Form Script" (scr-long);
//   - a gift-box shelf with the Basic / Advanced / Master bundles (scr-bundles);
//   - a white flower arch with two facing chairs for consultations (scr-consult, "Book Now");
//   - film-set props: director's chair, clapperboard, camera on a tripod, spotlights, script pages.
//
// This file also exports two small helpers that content.js reuses (kept here because each
// module may only own its own files):
//   createAtlas()  one canvas atlas (<= 1024 px) for every sign in a room, text drawn with signTexture()
//   createRig()    every moving prop of a room as ONE skinned mesh: each moving part is a bone, so the
//                  whole animated cast costs 3 draw calls (lit + outline + unlit glow/sign layer).
import { THREE, PALETTE, VoxelBuilder, jitter, toon, basic, signTexture, createRoom, plant } from './kit.js';
import { fontsReady, FONT_SERIF, outlineMaterial, roundRect } from '../toon.js';
import { mergeGeometries, mergeVertices } from '../three.js';

/* =================================================================================
 * Shared helpers (also imported by content.js)
 * ================================================================================= */

export const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const KEEP_ATTRS = ['position', 'normal', 'uv'];
const NOOP = () => {};

/** Rotation matrix from Euler angles (order YXZ, like the rig bones). Build-time only. */
export function rotationMatrix(rx = 0, ry = 0, rz = 0) {
  return new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
}

/** Matrix placing a unit box: centre (x, y, z), size (w, h, d), rotation (rx, ry, rz). Build-time only. */
export function boxMatrix(x, y, z, w, h, d, rx = 0, ry = 0, rz = 0) {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(w, h, d));
}

/** Matrix for a unit box stretched from point a to point b ([x, y, z]), t thick. Build-time only. */
export function segmentMatrix(a, b, t, tz = t) {
  const A = new THREE.Vector3(a[0], a[1], a[2]);
  const B = new THREE.Vector3(b[0], b[1], b[2]);
  const dir = B.clone().sub(A);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return new THREE.Matrix4().compose(A.add(B).multiplyScalar(0.5), q, new THREE.Vector3(t, len, tz));
}

/** Transform matrix for a prop placed at (x, y, z) turned by rotY. Build-time only. */
export function placeMatrix(x, y, z, rotY = 0) {
  return new THREE.Matrix4().makeRotationY(rotY).setPosition(x, y, z);
}

/** Heading (rotation.y) that turns a +Z-facing prop at (x, z) toward (tx, tz). */
export function headingTo(x, z, tx, tz) {
  return Math.atan2(tx - x, tz - z);
}

// ---------- canvas atlas ----------
/**
 * One canvas for all signs and glows of a room. pack({ name: [w, h] }) places every
 * rectangle at once (tallest first, first-fit shelves) and returns regions by name:
 * { x, y, w, h, u0, v0, u1, v1 }. It also reserves a white block, which untextured rig
 * boxes sample, so one material can carry both plain and textured parts.
 */
export function createAtlas(size = 1024, pad = 8) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const region = (x, y, w, h) => ({ x, y, w, h, u0: (x + 0.5) / size, u1: (x + w - 0.5) / size, v0: 1 - (y + h - 0.5) / size, v1: 1 - (y + 0.5) / size });
  return {
    size,
    canvas,
    g,
    white: null,
    pack(sizes) {
      const items = Object.entries({ __white: [48, 48], ...sizes }).map(([name, [w, h]]) => ({ name, w: Math.ceil(w), h: Math.ceil(h) }));
      items.sort((a, b) => b.h - a.h || b.w - a.w);
      const shelves = [];
      let bottom = 0;
      const out = {};
      for (const it of items) {
        let shelf = shelves.find((s) => it.h <= s.h && s.x + it.w <= size);
        if (!shelf) {
          if (bottom + it.h > size) throw new Error(`atlas full at ${it.name} ${it.w}x${it.h}`);
          shelf = { x: 0, y: bottom, h: it.h };
          shelves.push(shelf);
          bottom += it.h + pad;
        }
        out[it.name] = region(shelf.x, shelf.y, it.w, it.h);
        shelf.x += it.w + pad;
      }
      const wr = out.__white;
      g.fillStyle = '#ffffff';
      g.fillRect(wr.x, wr.y, wr.w, wr.h);
      this.white = { u: (wr.x + wr.w / 2) / size, v: 1 - (wr.y + wr.h / 2) / size };
      delete out.__white;
      return out;
    },
    /** Centred text lines (signTexture format) inside a rectangle of the atlas. */
    text(x, y, w, h, lines, color = PALETTE.ink) {
      const tex = signTexture(lines, { width: Math.round(w), height: Math.round(h), bg: null, border: null, color });
      g.drawImage(tex.image, Math.round(x), Math.round(y));
      tex.dispose();
    },
    texture() {
      const t = new THREE.CanvasTexture(canvas);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    },
  };
}

/** Gold four-point sparkle (the brand motif) drawn on a 2D context. */
export function drawSparkle(g, cx, cy, r, fill, core = null) {
  const k = r * 0.17;
  g.beginPath();
  g.moveTo(cx, cy - r);
  g.quadraticCurveTo(cx + k, cy - k, cx + r, cy);
  g.quadraticCurveTo(cx + k, cy + k, cx, cy + r);
  g.quadraticCurveTo(cx - k, cy + k, cx - r, cy);
  g.quadraticCurveTo(cx - k, cy - k, cx, cy - r);
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  if (core) {
    g.beginPath();
    g.arc(cx, cy, r * 0.16, 0, Math.PI * 2);
    g.fillStyle = core;
    g.fill();
  }
}

export function fillRound(g, x, y, w, h, r, fill) {
  roundRect(g, x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
}

export function strokeRound(g, x, y, w, h, r, stroke, lw) {
  roundRect(g, x, y, w, h, r);
  g.strokeStyle = stroke;
  g.lineWidth = lw;
  g.stroke();
}

/** Soft round glow (light bulbs, lamp pools). */
export function drawGlow(g, r, inner = 'rgba(255,255,255,1)', mid = 'rgba(255,226,150,0.75)', alphaMid = 0.42) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const grd = g.createRadialGradient(cx, cy, 0, cx, cy, Math.min(r.w, r.h) / 2);
  grd.addColorStop(0, inner);
  grd.addColorStop(alphaMid, mid);
  grd.addColorStop(1, 'rgba(255,214,120,0)');
  g.fillStyle = grd;
  g.fillRect(r.x, r.y, r.w, r.h);
}

/** Soft contact shadow (white with alpha; the quad's vertex colour tints it). */
export function drawShadow(g, r) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const grd = g.createRadialGradient(cx, cy, 0, cx, cy, Math.min(r.w, r.h) / 2);
  grd.addColorStop(0, 'rgba(255,255,255,0.5)');
  grd.addColorStop(0.55, 'rgba(255,255,255,0.3)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(r.x, r.y, r.w, r.h);
}

/** Lay a contact shadow (atlas region drawn with drawShadow) flat on the floor under a prop. */
export function floorShadow(rig, region, x, z, w, d, y = 0.004, rotY = 0) {
  rig.root.quad(region, x, y, z, w, d, { rx: -Math.PI / 2, ry: rotY, color: PALETTE.shadow });
}

/** A ruled script page ("THE SCRIPT - DRAFT 1", from Maya's sticker set). */
export function drawScriptPage(A, r) {
  const g = A.g;
  g.fillStyle = '#FCF7EA';
  g.fillRect(r.x, r.y, r.w, r.h);
  g.strokeStyle = '#E2D5B8';
  g.lineWidth = 4;
  g.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
  A.text(r.x, r.y + r.h * 0.04, r.w, r.h * 0.2, [{ text: 'THE SCRIPT', size: Math.round(r.w * 0.14), font: FONT_SERIF, weight: 600 }], PALETTE.maroon);
  A.text(r.x, r.y + r.h * 0.19, r.w, r.h * 0.1, [{ text: 'DRAFT 1', size: Math.round(r.w * 0.075), font: FONT_SERIF, weight: 600 }], PALETTE.goldDeep);
  g.fillStyle = '#9C8B73';
  const lens = [0.78, 0.62, 0.84, 0.55, 0.8, 0.7, 0.46, 0.76, 0.6];
  for (let i = 0; i < lens.length; i++) {
    const ly = r.y + r.h * (0.36 + i * 0.065);
    g.fillRect(r.x + r.w * 0.12, ly, r.w * 0.76 * lens[i], Math.max(2, r.h * 0.012));
  }
  drawSparkle(g, r.x + r.w * 0.82, r.y + r.h * 0.88, r.w * 0.07, PALETTE.gold);
}

// ---------- the rig: animated props as one skinned mesh ----------
class RigPart {
  constructor(index, o = {}) {
    const p = o.position ?? [0, 0, 0];
    const r = o.rotation ?? [0, 0, 0];
    const s = o.scale ?? 1;
    this.index = index;
    this.name = o.name ?? `part${index}`;
    this.parent = o.parent ?? null;
    this.position = new THREE.Vector3(p[0], p[1], p[2]);
    this.rotation = new THREE.Euler(r[0], r[1], r[2], 'YXZ');
    this.scale = typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(s[0], s[1], s[2]);
    this.items = [];
    this.bone = null;
  }

  /** Box by centre and size in this part's local frame. o: { rx, ry, rz, outline = true, lit = true } */
  box(x, y, z, w, h, d, color, o = {}) {
    const g = UNIT_BOX.clone();
    g.scale(w, h, d);
    if (o.rx || o.ry || o.rz) g.applyMatrix4(rotationMatrix(o.rx, o.ry, o.rz));
    g.translate(x, y, z);
    return this.#push(g, color, o.region ?? null, o.lit !== false, o.outline !== false);
  }

  boxMin(x0, y0, z0, x1, y1, z1, color, o) {
    return this.box((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), color, o);
  }

  /** Any geometry (cylinder, cone...) placed by o.matrix. o: { matrix, region, lit = true, outline = true } */
  shape(geometry, color, o = {}) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    if (o.matrix) g.applyMatrix4(o.matrix);
    return this.#push(g, color, o.region ?? null, o.lit !== false, o.outline !== false);
  }

  /** Flat textured quad (faces +Z before rotation). Unlit unless o.lit. o: { rx, ry, rz, lit, color } */
  quad(region, x, y, z, w, h, o = {}) {
    const g = new THREE.PlaneGeometry(w, h);
    if (o.rx || o.ry || o.rz) g.applyMatrix4(rotationMatrix(o.rx, o.ry, o.rz));
    g.translate(x, y, z);
    return this.#push(g, o.color ?? '#ffffff', region, !!o.lit, false);
  }

  #push(geo, color, region, lit, outline) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    for (const k of Object.keys(g.attributes)) if (!KEEP_ATTRS.includes(k)) g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    this.items.push({ g, color, region, lit, outline });
    return this;
  }

  // Pose relative to the rest pose. No allocation: safe inside update().
  rot(x = 0, y = 0, z = 0) {
    const r = this.rotation;
    this.bone.rotation.set(r.x + x, r.y + y, r.z + z);
    return this;
  }

  move(x = 0, y = 0, z = 0) {
    const p = this.position;
    this.bone.position.set(p.x + x, p.y + y, p.z + z);
    return this;
  }

  size(x = 1, y = x, z = x) {
    const s = this.scale;
    this.bone.scale.set(s.x * Math.max(x, 1e-4), s.y * Math.max(y, 1e-4), s.z * Math.max(z, 1e-4));
    return this;
  }
}

/**
 * Animated props as one skinned mesh. Parts are created with rig.part({ name, parent,
 * position, rotation (YXZ), scale }) and filled with box()/boxMin()/shape()/quad() in their
 * own local frame (origin = pivot). build() returns { mesh, dispose }; afterwards animate a
 * part with part.rot()/move()/size() (relative to its rest pose).
 */
export function createRig() {
  const parts = [];
  const rig = {
    parts,
    part(o = {}) {
      const p = new RigPart(parts.length, o);
      parts.push(p);
      return p;
    },
    build({ atlas, texture, px = 1.5 }) {
      const q = new THREE.Quaternion();
      for (const p of parts) {
        p.restLocal = new THREE.Matrix4().compose(p.position, q.setFromEuler(p.rotation), p.scale);
        p.restWorld = p.parent ? p.parent.restWorld.clone().multiply(p.restLocal) : p.restLocal.clone();
      }
      const lit = [];
      const unlit = [];
      const hull = [];
      const col = new THREE.Color();
      for (const p of parts) {
        for (const it of p.items) {
          const g = it.g;
          g.applyMatrix4(p.restWorld);
          const n = g.attributes.position.count;
          col.set(it.color);
          const c = new Float32Array(n * 3);
          for (let i = 0; i < n; i++) {
            c[i * 3] = col.r;
            c[i * 3 + 1] = col.g;
            c[i * 3 + 2] = col.b;
          }
          g.setAttribute('color', new THREE.BufferAttribute(c, 3));
          const uv = g.attributes.uv;
          const r = it.region;
          for (let i = 0; i < n; i++) {
            if (r) uv.setXY(i, r.u0 + uv.getX(i) * (r.u1 - r.u0), r.v0 + uv.getY(i) * (r.v1 - r.v0));
            else uv.setXY(i, atlas.white.u, atlas.white.v);
          }
          const si = new Uint16Array(n * 4);
          const sw = new Float32Array(n * 4);
          for (let i = 0; i < n; i++) {
            si[i * 4] = p.index;
            sw[i * 4] = 1;
          }
          g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
          g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
          (it.lit ? lit : unlit).push(g);
          if (it.lit && it.outline) {
            const h = new THREE.BufferGeometry();
            h.setAttribute('position', g.attributes.position);
            h.setAttribute('skinIndex', g.attributes.skinIndex);
            h.setAttribute('skinWeight', g.attributes.skinWeight);
            hull.push(h);
          }
        }
      }

      const bones = parts.map((p) => {
        const b = new THREE.Bone();
        b.name = p.name;
        b.position.copy(p.position);
        b.rotation.copy(p.rotation);
        b.scale.copy(p.scale);
        p.bone = b;
        return b;
      });
      const skeleton = new THREE.Skeleton(bones);
      const materials = [];
      const finishMesh = (m) => {
        m.frustumCulled = false; // always in view inside a room; skips a CPU skinning pass for bounds
        m.raycast = NOOP;
        m.userData.dynamic = true;
        return m;
      };

      // Lit layer: toon + vertex colours; untextured boxes sample the atlas' white block.
      const litMat = toon('#ffffff', { vertexColors: true, map: texture });
      litMat.alphaTest = 0.5;
      materials.push(litMat);
      const mesh = finishMesh(new THREE.SkinnedMesh(lit.length ? mergeGeometries(lit) : emptySkinned(), litMat));
      mesh.name = 'rig';
      for (const p of parts) (p.parent ? p.parent.bone : mesh).add(p.bone);
      mesh.bind(skeleton);

      // Outline layer: the shared outline material on a skinned hull of every outlined box.
      if (hull.length) {
        const merged = mergeVertices(mergeGeometries(hull), 1e-4);
        merged.computeVertexNormals();
        const outline = finishMesh(new THREE.SkinnedMesh(merged, outlineMaterial(px)));
        outline.userData.isOutline = true;
        outline.bind(skeleton, mesh.bindMatrix);
        mesh.add(outline);
      }

      // Unlit layer: signs, glows, sparkles, beams (alpha blended, no depth write).
      if (unlit.length) {
        const glowMat = basic('#ffffff', { map: texture, transparent: true, depthWrite: false });
        glowMat.vertexColors = true;
        materials.push(glowMat);
        const glow = finishMesh(new THREE.SkinnedMesh(mergeGeometries(unlit), glowMat));
        glow.name = 'rigGlow';
        glow.bind(skeleton, mesh.bindMatrix);
        mesh.add(glow);
      }
      for (const g of [...lit, ...unlit, ...hull]) g.dispose();

      return {
        mesh,
        skeleton,
        dispose() {
          skeleton.dispose();
          for (const m of materials) m.dispose();
        },
      };
    },
  };
  rig.root = rig.part({ name: 'static' });
  return rig;
}

function emptySkinned() {
  const g = new THREE.BufferGeometry();
  for (const [k, s] of [['position', 3], ['normal', 3], ['uv', 2], ['color', 3], ['skinWeight', 4]]) g.setAttribute(k, new THREE.Float32BufferAttribute([], s));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute([], 4));
  return g;
}

// ---------- motion helpers (no allocation) ----------
export const frac = (x) => x - Math.floor(x);
export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const easeOut = (x) => 1 - (1 - x) * (1 - x) * (1 - x);
export const easeIn = (x) => x * x * x;
export const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** Under-damped spring (natural overshoot = follow-through). */
export function createSpring(k = 150, c = 13) {
  return { x: 0, v: 0, k, c, last: 0, wind: 0 };
}

/**
 * Advance a spring toward `target` in fixed sub-steps. antic > 0 adds a short wind-up the
 * other way whenever the target rises (anticipation). Returns the current value.
 */
export function stepSpring(s, target, dt, antic = 0) {
  if (antic && target > s.last + 1e-4) s.wind = 0.12;
  s.last = target;
  let rest = Math.min(Math.max(dt, 0), 0.1);
  while (rest > 1e-6) {
    const h = Math.min(rest, 1 / 120);
    let goal = target;
    if (s.wind > 0) {
      s.wind -= h;
      goal = -antic;
    }
    s.v += (-s.k * (s.x - goal) - s.c * s.v) * h;
    s.x += s.v * h;
    rest -= h;
  }
  return s.x;
}

/**
 * Cartoon hop with squash and stretch over one cycle p in [0, 1): crouch, leap, land, rest.
 * Writes { y, sy, sx, lag } into `out` (lag = small extra lift for a lid/hat: follow-through).
 */
export function hop(p, height, out) {
  let y = 0;
  let sy = 1;
  let lag = 0;
  if (p < 0.1) {
    sy = 1 - 0.14 * Math.sin((p / 0.1) * (Math.PI / 2));
  } else if (p < 0.34) {
    const k = (p - 0.1) / 0.24;
    y = Math.sin(k * Math.PI) * height;
    sy = k < 0.5 ? 1 + 0.12 * (1 - k * 2) : 1 + 0.06 * (k * 2 - 1);
    lag = k > 0.25 ? Math.sin(((k - 0.25) / 0.75) * Math.PI) * height * 0.3 : 0;
  } else if (p < 0.48) {
    const k = (p - 0.34) / 0.14;
    sy = 1 - 0.11 * Math.sin(k * Math.PI);
    lag = -0.15 * height * Math.sin(k * Math.PI);
  }
  out.y = y;
  out.sy = sy;
  out.sx = 1 / Math.sqrt(sy);
  out.lag = lag;
  return out;
}

/** Shared per-station reaction: target 1 when active, `nearAmount` when Maya is near. */
export function stationTarget(state, id, nearAmount = 0.45) {
  if (!state) return 0;
  if (state.active === id) return 1;
  if (state.near === id) return nearAmount;
  return 0;
}

/** Add a box obstacle (metres, room space) with the kit's default 0.08 m pad. */
export function blockBox(room, x0, z0, x1, z1, pad = 0.08) {
  room.obstacles.push({ type: 'box', minX: Math.min(x0, x1) - pad, maxX: Math.max(x0, x1) + pad, minZ: Math.min(z0, z1) - pad, maxZ: Math.max(z0, z1) + pad });
}

export function blockCircle(room, x, z, r, pad = 0.08) {
  room.obstacles.push({ type: 'circle', x, z, r: r + pad });
}

/** Wrap the kit room's dispose so it also frees what a module created itself. */
export function chainDispose(room, ...fns) {
  const base = room.dispose;
  room.dispose = () => {
    base();
    for (const f of fns) f();
  };
}

/* =================================================================================
 * Script Studio
 * ================================================================================= */

const STAGE_H = 0.12;
const STAGE_FRONT = -2.72;
const BOOK_FRONT = -3.2;
const CLOUD_SINK = 0.1;
const CLOUD = PALETTE.cloud;
const CLOUD_SHADE = '#EADFD0';

const BOOKS = [
  {
    key: 'short', id: 'scr-short', x: -2.12, w: 1.16, h: 1.44, d: 0.2, tilt: 0.05, open: 1.0, seed: 1,
    cover: '#D3A05E', spine: '#B17E45',
    art: { bg: '#D3A05E', edge: '#BC8A4E', frame: PALETTE.maroon, ink: PALETTE.ink, lines: ['THE', 'SHORT', 'SCRIPT'], sizes: [26, 60, 44], band: '၁-၂ မိနစ်', bandBg: PALETTE.maroon, bandInk: PALETTE.paper },
  },
  {
    key: 'standard', id: 'scr-standard', x: 0, w: 1.26, h: 1.58, d: 0.44, tilt: 0, open: 0.95, seed: 2,
    cover: PALETTE.maroon, spine: PALETTE.maroonDeep,
    art: { bg: PALETTE.maroon, edge: '#5E1823', frame: PALETTE.gold, ink: '#F0D58E', lines: ['THE', 'STANDARD', 'SCRIPT'], sizes: [26, 46, 46], band: '၃-၅ မိနစ်', bandBg: PALETTE.gold, bandInk: PALETTE.maroonDeep },
  },
  {
    key: 'long', id: 'scr-long', x: 2.1, w: 1.34, h: 1.74, d: 0.76, tilt: -0.03, open: 0.85, seed: 3,
    cover: '#7A4A2B', spine: '#5A341D',
    art: { bg: '#7A4A2B', edge: '#673D22', frame: PALETTE.gold, ink: '#F6E6C4', lines: ['LONG', 'FORM', 'SCRIPT'], sizes: [46, 46, 44], band: '၆ မိနစ်နှင့်အထက်', bandBg: PALETTE.cream, bandInk: '#5A341D' },
  },
];

const STATIONS = [
  {
    id: 'scr-short', x: -1.98, z: -1.55, look: { x: -2.12, z: BOOK_FRONT }, emote: 'write', face: 'focus', labelY: 2.2,
    line: { my: 'တိုတိုလေးနဲ့ ထိထိမိမိ ရေးပေးမယ်နော်', en: "Short and to the point. I'll write it for you!" },
  },
  {
    id: 'scr-standard', x: 0, z: -1.55, look: { x: 0, z: BOOK_FRONT }, emote: 'nod', face: 'happy', labelY: 2.35,
    line: { my: '၃ မိနစ်ကနေ ၅ မိနစ်၊ အနေတော်လေးပါရှင့်', en: 'Three to five minutes: just the right length.' },
  },
  {
    id: 'scr-long', x: 1.98, z: -1.55, look: { x: 2.1, z: BOOK_FRONT }, emote: 'thumbsUp', face: 'star', labelY: 2.45,
    line: { my: '၆ မိနစ်နဲ့အထက် Long Form တွေလည်း ရေးပေးတယ်နော်', en: 'I write Long Form scripts of six minutes and more, too!' },
  },
  {
    id: 'scr-bundles', x: -2.36, z: 2.5, look: { x: -2.36, z: 1.3 }, emote: 'cheer', face: 'star', labelY: 2.0,
    line: { my: 'Package နဲ့ယူရင် ပိုသက်သာတယ်ရှင့်', en: 'Take a package and save more!' },
  },
  {
    id: 'scr-consult', x: 2.44, z: 2.62, look: { x: 2.44, z: 1.36 }, emote: 'think', face: 'think', labelY: 2.65,
    line: { my: 'Script အကြောင်း အတူတူ တိုင်ပင်ကြရအောင်ရှင့်', en: "Let's plan your script together." },
  },
];

function drawScriptsAtlas(A) {
  const g = A.g;
  const R = A.pack({
    cover_short: [288, 384],
    cover_standard: [288, 384],
    cover_long: [288, 384],
    marquee: [600, 136],
    bundleSign: [440, 136],
    consultSign: [440, 150],
    clapFace: [240, 170],
    page: [160, 200],
    tagBasic: [200, 76],
    tagAdvanced: [200, 76],
    tagMaster: [200, 76],
    chairName: [200, 80],
    sparkle: [96, 96],
    bulb: [64, 64],
    pool: [128, 128],
    beam: [32, 128],
    shadow: [96, 96],
    lines: [96, 128],
    fame: [96, 96],
    poster: [120, 168],
    note: [64, 80],
  });
  for (const b of BOOKS) drawCover(A, R[`cover_${b.key}`], b.art);
  drawShadow(g, R.shadow);
  drawPoster(A, R.poster);
  drawNote(A, R.note);
  {
    // a loose page: ruled lines only
    const r = R.lines;
    g.fillStyle = '#FCF7EA';
    g.fillRect(r.x, r.y, r.w, r.h);
    g.fillStyle = '#B9AA90';
    for (let i = 0; i < 9; i++) g.fillRect(r.x + 12, r.y + 18 + i * 12, (r.w - 24) * (i % 3 === 2 ? 0.6 : 1), 2);
  }
  {
    // walk-of-fame star tile for the red carpet
    const r = R.fame;
    fillRound(g, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 18, '#5A1822');
    strokeRound(g, r.x + 6, r.y + 6, r.w - 12, r.h - 12, 14, PALETTE.gold, 4);
    drawSparkle(g, r.x + r.w / 2, r.y + r.h / 2, 32, PALETTE.gold, '#FFF1C8');
  }
  // Marquee title.
  {
    const r = R.marquee;
    fillRound(g, r.x + 3, r.y + 3, r.w - 6, r.h - 6, 26, PALETTE.maroon);
    strokeRound(g, r.x + 6, r.y + 6, r.w - 12, r.h - 12, 22, PALETTE.gold, 7);
    strokeRound(g, r.x + 18, r.y + 18, r.w - 36, r.h - 36, 14, '#E2C27A', 2);
    A.text(r.x + 40, r.y + 8, r.w - 80, r.h - 16, [{ text: 'Script စတူဒီယို', size: 62, color: PALETTE.paper }]);
    drawSparkle(g, r.x + 40, r.y + r.h / 2, 15, PALETTE.gold);
    drawSparkle(g, r.x + r.w - 40, r.y + r.h / 2, 15, PALETTE.gold);
  }
  // Bundle header sign.
  {
    const r = R.bundleSign;
    fillRound(g, r.x + 3, r.y + 3, r.w - 6, r.h - 6, 22, PALETTE.paper);
    strokeRound(g, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 20, PALETTE.goldDeep, 6);
    A.text(r.x + 20, r.y + 6, r.w - 40, 74, [{ text: 'Script Package', size: 46, font: FONT_SERIF, weight: 600, color: PALETTE.maroon }]);
    A.text(r.x + 20, r.y + 68, r.w - 40, 60, [{ text: 'စုဝယ်ရင် ပိုသက်သာ', size: 32, color: PALETTE.goldDeep }]);
  }
  // Consultation sign.
  {
    const r = R.consultSign;
    fillRound(g, r.x + 3, r.y + 3, r.w - 6, r.h - 6, 24, PALETTE.white);
    strokeRound(g, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 22, PALETTE.gold, 6);
    A.text(r.x + 16, r.y + 8, r.w - 32, 78, [{ text: 'တိုင်ပင်ဆွေးနွေးခန်း', size: 40, color: PALETTE.maroon }]);
    for (const dx of [-1, 0, 1]) A.text(r.x + 60 + dx, r.y + 80, r.w - 120, 60, [{ text: 'Book Now', size: 38, font: FONT_SERIF, weight: 600, color: PALETTE.bronze }]);
    drawSparkle(g, r.x + 92, r.y + 110, 12, PALETTE.gold);
    drawSparkle(g, r.x + r.w - 92, r.y + 110, 12, PALETTE.gold);
  }
  // Clapperboard face (chalk on a dark slate).
  {
    const r = R.clapFace;
    g.fillStyle = '#2A2420';
    g.fillRect(r.x, r.y, r.w, r.h);
    g.fillStyle = '#E9DFC8';
    g.fillRect(r.x + 10, r.y + 78, r.w - 20, 4);
    g.fillRect(r.x + 10, r.y + 124, r.w - 20, 4);
    g.fillRect(r.x + r.w / 2 - 2, r.y + 82, 4, 42);
    A.text(r.x + 8, r.y + 4, r.w - 16, 74, [{ text: 'ဇာတ်ညွှန်း', size: 38, color: '#F3EAD6' }]);
    A.text(r.x + 10, r.y + 84, r.w / 2 - 14, 42, [{ text: '၁', size: 24, color: '#F3EAD6' }]);
    A.text(r.x + r.w / 2 + 4, r.y + 84, r.w / 2 - 14, 42, [{ text: '၁', size: 24, color: '#F3EAD6' }]);
    drawSparkle(g, r.x + r.w - 26, r.y + r.h - 22, 10, PALETTE.gold);
  }
  // Script page (floor pages, the inside of the books).
  drawScriptPage(A, R.page);
  // Gift tags.
  for (const [k, label] of [['tagBasic', 'Basic'], ['tagAdvanced', 'Advanced'], ['tagMaster', 'Master']]) {
    const r = R[k];
    fillRound(g, r.x + 3, r.y + 3, r.w - 6, r.h - 6, 16, PALETTE.paper);
    strokeRound(g, r.x + 4, r.y + 4, r.w - 8, r.h - 8, 14, PALETTE.gold, 5);
    A.text(r.x + 10, r.y + 2, r.w - 20, r.h - 4, [{ text: label, size: 40, font: FONT_SERIF, weight: 600, color: PALETTE.maroon }]);
  }
  // Director's chair name (her Burmese pen name).
  A.text(R.chairName.x, R.chairName.y, 200, 80, [{ text: 'မာရာ', size: 44, color: '#F0D58E' }]);
  // Glows and motifs.
  drawSparkle(g, R.sparkle.x + 48, R.sparkle.y + 48, 44, PALETTE.gold, '#FFF6D8');
  drawGlow(g, R.bulb, 'rgba(255,255,250,1)', 'rgba(255,224,140,0.9)', 0.35);
  {
    const r = R.pool;
    const grd = g.createRadialGradient(r.x + 64, r.y + 64, 0, r.x + 64, r.y + 64, 64);
    grd.addColorStop(0, 'rgba(255,240,200,0.55)');
    grd.addColorStop(0.6, 'rgba(255,232,180,0.25)');
    grd.addColorStop(1, 'rgba(255,232,180,0)');
    g.fillStyle = grd;
    g.fillRect(r.x, r.y, r.w, r.h);
  }
  {
    const r = R.beam;
    const grd = g.createLinearGradient(0, r.y + r.h, 0, r.y);
    grd.addColorStop(0, 'rgba(255,255,255,0.34)');
    grd.addColorStop(0.45, 'rgba(255,255,255,0.12)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(r.x, r.y, r.w, r.h);
  }
  return R;
}

function drawCover(A, r, o) {
  const g = A.g;
  const { x, y, w, h } = r;
  g.fillStyle = o.bg;
  g.fillRect(x, y, w, h);
  g.fillStyle = o.edge;
  g.fillRect(x, y, 18, h); // hinge strip by the spine
  strokeRound(g, x + 30, y + 16, w - 46, h - 32, 14, o.frame, 6);
  strokeRound(g, x + 40, y + 26, w - 66, h - 52, 9, o.frame, 2);
  const lines = o.lines.map((text, i) => ({ text, size: o.sizes[i], font: FONT_SERIF, weight: 600, color: o.ink }));
  // drawn three times a hair apart: a heavier title that still reads on a small phone
  for (const dx of [-1.5, 0, 1.5]) A.text(x + 24 + dx, y + 34, w - 36, h * 0.6, lines, o.ink);
  const cy = y + h * 0.705;
  g.fillStyle = o.frame;
  g.fillRect(x + w * 0.26, cy - 1.5, w * 0.17, 3);
  g.fillRect(x + w * 0.66, cy - 1.5, w * 0.17, 3);
  drawSparkle(g, x + w * 0.545, cy, 13, o.frame);
  fillRound(g, x + w * 0.17, y + h * 0.745, w * 0.74, h * 0.145, 14, o.bandBg);
  A.text(x + w * 0.17, y + h * 0.745, w * 0.74, h * 0.145, [{ text: o.band, size: o.band.length > 10 ? 27 : 34 }], o.bandInk);
}

/** "Now showing" film poster: film-strip edges, a spotlight on an open script, five stars. */
function drawPoster(A, r) {
  const g = A.g;
  const { x, y, w, h } = r;
  g.fillStyle = PALETTE.maroonDeep;
  g.fillRect(x, y, w, h);
  g.fillStyle = '#1E1814';
  g.fillRect(x, y, 14, h);
  g.fillRect(x + w - 14, y, 14, h);
  g.fillStyle = '#E9DCC0';
  for (let yy = y + 5; yy < y + h - 8; yy += 13) {
    g.fillRect(x + 4, yy, 6, 7);
    g.fillRect(x + w - 10, yy, 6, 7);
  }
  const cx = x + w / 2;
  const beam = g.createLinearGradient(0, y + 40, 0, y + h - 40);
  beam.addColorStop(0, 'rgba(255,236,190,0.05)');
  beam.addColorStop(1, 'rgba(255,236,190,0.42)');
  g.fillStyle = beam;
  g.beginPath();
  g.moveTo(cx - 7, y + 40);
  g.lineTo(cx + 7, y + 40);
  g.lineTo(x + w - 20, y + h - 46);
  g.lineTo(x + 20, y + h - 46);
  g.closePath();
  g.fill();
  // an open script: two pale pages with ruled lines
  for (const s of [-1, 1]) {
    g.fillStyle = s < 0 ? '#FCF3DE' : '#F2E4C4';
    g.beginPath();
    g.moveTo(cx, y + h - 74);
    g.lineTo(cx + s * 36, y + h - 82);
    g.lineTo(cx + s * 36, y + h - 50);
    g.lineTo(cx, y + h - 44);
    g.closePath();
    g.fill();
    g.fillStyle = '#B9AA90';
    for (let i = 0; i < 4; i++) g.fillRect(cx + (s < 0 ? -31 : 6), y + h - 73 + i * 6, 25, 1.6);
  }
  drawSparkle(g, cx, y + 58, 15, PALETTE.gold, '#FFF6D8');
  A.text(x + 4, y + 4, w - 8, 34, [{ text: 'ယခုပြသနေပြီ', size: 13, color: '#F0D58E' }]);
  for (let i = 0; i < 5; i++) drawSparkle(g, x + 26 + i * 17, y + h - 22, 7, PALETTE.gold);
}

/** A small handwritten note (wavy ink lines and a heart), for pin boards. */
function drawNote(A, r) {
  const g = A.g;
  g.fillStyle = '#FFF6DF';
  g.fillRect(r.x, r.y, r.w, r.h);
  g.fillStyle = PALETTE.rose;
  g.fillRect(r.x, r.y, r.w, 7);
  g.strokeStyle = '#4A3A2C';
  g.lineWidth = 1.6;
  for (let i = 0; i < 6; i++) {
    const ly = r.y + 18 + i * 9.5;
    const len = r.w * (i === 5 ? 0.45 : 0.78 - (i % 2) * 0.12);
    g.beginPath();
    g.moveTo(r.x + 7, ly);
    for (let k = 0; k < len; k += 5) g.quadraticCurveTo(r.x + 9 + k, ly + ((k / 5) % 2 ? 3 : -3), r.x + 12 + k, ly);
    g.stroke();
  }
  g.fillStyle = PALETTE.maroon;
  g.beginPath();
  g.arc(r.x + r.w - 15, r.y + r.h - 12, 4, 0, Math.PI * 2);
  g.arc(r.x + r.w - 9, r.y + r.h - 12, 4, 0, Math.PI * 2);
  g.fill();
}

// ---------- props ----------
/** A puffy cloud lump: a wide block with a smaller stepped dome on top (reads round when blocky). */
function puff(p, x, y, z, s, c = CLOUD) {
  p.box(x, y + s * 0.22, z, s, s * 0.44, s * 0.82, c);
  p.box(x - s * 0.04, y + s * 0.5, z - s * 0.02, s * 0.68, s * 0.24, s * 0.56, c);
  p.box(x - s * 0.08, y + s * 0.66, z - s * 0.06, s * 0.34, s * 0.12, s * 0.3, c);
}

function addCloud(p, w, d, seed) {
  p.box(0, 0.04, 0.04, w + 0.46, 0.08, d + 0.4, CLOUD_SHADE);
  p.box(0, 0.1, 0.05, w + 0.3, 0.1, d + 0.3, CLOUD);
  const front = d / 2 + 0.12;
  const lumps = [
    [-w / 2 - 0.16, 0.02, front - 0.06, 0.4 + seed * 0.02],
    [-w * 0.18, 0.04, front + 0.04, 0.34],
    [w * 0.14, 0.02, front + 0.02, 0.3 + seed * 0.03],
    [w / 2 + 0.12, 0.03, front - 0.08, 0.42],
    [-w / 2 - 0.12, 0.02, -d / 2 + 0.02, 0.32],
    [w / 2 + 0.1, 0.02, -d / 2 + 0.06, 0.36],
  ];
  for (const [x, y, z, s] of lumps) puff(p, x, y, z, s);
  p.box(-w * 0.02, 0.05, front + 0.16, w * 0.9, 0.08, 0.12, CLOUD_SHADE);
}

function buildBook(rig, R, b) {
  const { w, h, d } = b;
  const ct = 0.05;
  const cz = BOOK_FRONT - d / 2;
  const cloud = rig.part({ name: `${b.key}Cloud`, position: [b.x, STAGE_H, cz] });
  addCloud(cloud, w, d, b.seed);
  const book = rig.part({ name: `${b.key}Book`, parent: cloud, position: [0, CLOUD_SINK, 0], rotation: [0, 0, b.tilt] });
  // back cover, spine with raised gold bands, page block with page-edge lines
  book.boxMin(-w / 2, -0.01, -d / 2, w / 2 + 0.02, h + 0.01, -d / 2 + ct, b.cover);
  book.boxMin(-w / 2 - 0.045, -0.01, -d / 2, -w / 2 + 0.002, h + 0.01, d / 2, b.spine);
  for (const fy of [0.16, 0.5, 0.84]) book.boxMin(-w / 2 - 0.06, h * fy - 0.04, -d / 2 + 0.015, -w / 2 - 0.03, h * fy + 0.04, d / 2 - 0.015, PALETTE.gold);
  const pz0 = -d / 2 + ct;
  const pz1 = d / 2 - ct - 0.014;
  book.boxMin(-w / 2 + 0.004, 0.03, pz0, w / 2 - 0.035, h - 0.03, pz1, PALETTE.paper);
  // the first page of the script, revealed when the cover swings open (hidden behind it when closed)
  book.quad(R.page, 0.06, h / 2, pz1 + 0.0015, (w - 0.3) * 0.86, (w - 0.3) * 1.075);
  const lines = Math.max(2, Math.round((pz1 - pz0) / 0.06));
  for (let i = 1; i < lines; i++) {
    const z = pz0 + ((pz1 - pz0) * i) / lines;
    book.box(-0.016, h - 0.026, z, w - 0.07, 0.006, 0.008, PALETTE.parchment, { outline: false });
    book.box(w / 2 - 0.032, h / 2, z, 0.006, h - 0.1, 0.008, PALETTE.parchment, { outline: false });
  }
  // bookmark tabs peeking out of the top
  const tabs = [[w / 2 - 0.22, PALETTE.gold, 0.12], [w / 2 - 0.4, PALETTE.maroon, 0.09], [-w / 2 + 0.3, PALETTE.cream, 0.1]];
  tabs.forEach(([tx, c, th], i) => {
    const tz = pz0 + (pz1 - pz0) * (0.3 + i * 0.22);
    book.box(tx, h - 0.03 + th / 2, tz, 0.08, th, 0.012, c);
  });
  // two loose pages (follow the cover with a lag) and the front cover
  const pages = [];
  for (let i = 0; i < 2; i++) {
    const pg = rig.part({ name: `${b.key}Page${i}`, parent: book, position: [-w / 2 + 0.006, 0, d / 2 - ct - 0.002 - i * 0.006] });
    pg.boxMin(0, 0.05, -0.004, w - 0.06, h - 0.05, 0, PALETTE.paper);
    pg.quad(R.lines, (w - 0.06) / 2, h / 2, 0.0015, w - 0.2, h - 0.24);
    pages.push(pg);
  }
  const cover = rig.part({ name: `${b.key}Cover`, parent: book, position: [-w / 2, 0, d / 2] });
  cover.boxMin(0, -0.01, -ct, w + 0.02, h + 0.01, 0, b.cover);
  for (const [y0, y1] of [[-0.016, 0.1], [h - 0.1, h + 0.016]]) cover.boxMin(w - 0.09, y0, -ct - 0.006, w + 0.03, y1, 0.008, PALETTE.gold);
  cover.quad(R[`cover_${b.key}`], (w + 0.02) / 2 + 0.004, h / 2, 0.003, w - 0.05, h - 0.04, { lit: true });
  // warm glow + sparkles that rise from the open pages
  const sparks = [];
  for (let i = 0; i < 3; i++) {
    const s = rig.part({ name: `${b.key}Spark${i}`, parent: book, position: [w * 0.08 + i * w * 0.16, h * 0.55, d / 2 + 0.22] });
    s.quad(R.sparkle, 0, 0, 0, 0.18, 0.18);
    sparks.push(s);
  }
  return { b, cloud, book, cover, pages, sparks, pageSprings: [createSpring(70, 7), createSpring(55, 6)] };
}

function buildStage(S) {
  const x0 = -3.28;
  const x1 = 3.28;
  const z0 = -4.0;
  S.boxMin(x0, 0, z0, x1, STAGE_H - 0.02, STAGE_FRONT, '#6E4A2E');
  let i = 0;
  for (let z = z0; z < STAGE_FRONT - 1e-6; z += 0.32, i++) {
    S.boxMin(x0 + 0.02, STAGE_H - 0.02, z, x1 - 0.02, STAGE_H, Math.min(STAGE_FRONT, z + 0.32) - 0.012, jitter('#8B5E3A', 0.07, i + 5));
  }
  S.boxMin(x0 - 0.02, 0, STAGE_FRONT - 0.04, x1 + 0.02, STAGE_H + 0.012, STAGE_FRONT + 0.03, PALETTE.gold);
  // brass footlights along the lip
  for (const fx of [-2.9, -1.05, 1.05, 2.9]) S.box(fx, STAGE_H + 0.03, STAGE_FRONT - 0.06, 0.16, 0.06, 0.08, PALETTE.goldDeep);
}

function buildCurtains(S) {
  const bands = [
    [2.42, 2.98, 0.7],
    [1.9, 2.42, 0.6],
    [1.45, 1.9, 0.5],
    [1.12, 1.45, 0.36],
    [0.62, 1.12, 0.42],
    [STAGE_H, 0.62, 0.5],
  ];
  for (const side of [-1, 1]) {
    for (const [y0, y1, wdt] of bands) {
      const stripes = Math.max(3, Math.round(wdt / 0.11));
      for (let s = 0; s < stripes; s++) {
        const a = 3.5 - (wdt * s) / stripes;
        const bx = 3.5 - (wdt * (s + 1)) / stripes;
        const deep = s % 2 === 1;
        S.boxMin(side * a, y0, -3.99, side * bx, y1, deep ? -3.8 : -3.73, deep ? '#5A1822' : jitter(PALETTE.maroon, 0.05, s + y0 * 10));
      }
    }
    // gold tie-back with a tassel
    S.boxMin(side * 3.5, 1.2, -3.99, side * 3.1, 1.32, -3.7, PALETTE.gold);
    S.box(side * 3.12, 1.12, -3.7, 0.08, 0.16, 0.08, PALETTE.goldDeep);
  }
  // valance across the top of the back wall with scallops and gold fringe
  S.boxMin(-3.5, 2.62, -3.99, 3.5, 3.0, -3.8, PALETTE.maroon);
  S.boxMin(-3.5, 2.6, -3.81, 3.5, 2.66, -3.77, PALETTE.gold);
  for (let i = 0; i < 14; i++) {
    const x = -3.25 + i * 0.5;
    S.box(x, 2.54, -3.86, 0.42, 0.14, 0.14, i % 2 ? '#5A1822' : PALETTE.maroon);
    S.box(x, 2.45, -3.82, 0.06, 0.06, 0.06, PALETTE.gold);
  }
}

function buildMarquee(S, rig, R) {
  const y = 2.15;
  const w = 2.3;
  const h = 0.52;
  S.boxMin(-w / 2, y - h / 2, -3.99, w / 2, y + h / 2, -3.93, PALETTE.goldDeep);
  rig.root.quad(R.marquee, 0, y, -3.92, w - 0.1, (w - 0.1) * (136 / 600));
  const bulbs = [];
  const n = 8;
  for (let i = 0; i < n; i++) {
    const bx = -w / 2 + 0.12 + (i * (w - 0.24)) / (n - 1);
    for (const by of [y + h / 2, y - h / 2]) {
      S.box(bx, by, -3.92, 0.06, 0.06, 0.04, PALETTE.gold);
      const p = rig.part({ name: 'bulb', position: [bx, by, -3.895] });
      p.quad(R.bulb, 0, 0, 0, 0.13, 0.13, { color: '#FFE6A6' });
      bulbs.push(p);
    }
  }
  // order the bulbs around the frame so the chase runs clockwise
  bulbs.sort((a, b2) => {
    const ka = a.position.y > y ? a.position.x : 10 - a.position.x;
    const kb = b2.position.y > y ? b2.position.x : 10 - b2.position.x;
    return ka - kb;
  });
  return bulbs;
}

function buildSpotlight(S, rig, R, side) {
  const sx = side * 3.0;
  const sz = -2.38;
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + 0.4;
    S.add(UNIT_BOX, PALETTE.ink, segmentMatrix([sx, 0.34, sz], [sx + Math.sin(a) * 0.27, 0.01, sz + Math.cos(a) * 0.27], 0.035));
  }
  S.box(sx, 0.95, sz, 0.045, 1.26, 0.045, PALETTE.ink);
  S.box(sx, 0.34, sz, 0.08, 0.06, 0.08, PALETTE.goldDeep);
  const tx = side * 1.0;
  const ty = 0.9;
  const tz = BOOK_FRONT - 0.15;
  const hx = sx;
  const hy = 1.68;
  const hz = sz;
  const dx = tx - hx;
  const dy = ty - hy;
  const dz = tz - hz;
  const flat = Math.hypot(dx, dz);
  const yaw = Math.atan2(dx, dz);
  const pitch = Math.atan2(-dy, flat);
  const dist = Math.hypot(flat, dy);
  const head = rig.part({ name: `spot${side}`, position: [hx, hy, hz], rotation: [pitch, yaw, 0] });
  // yoke
  head.box(0.17, -0.04, 0, 0.03, 0.2, 0.06, PALETTE.ink);
  head.box(-0.17, -0.04, 0, 0.03, 0.2, 0.06, PALETTE.ink);
  head.box(0, -0.15, 0, 0.37, 0.03, 0.06, PALETTE.ink);
  // housing, gold ring, back cap, barn doors
  head.box(0, 0, 0, 0.26, 0.26, 0.36, PALETTE.ink);
  head.box(0, 0, 0.19, 0.3, 0.3, 0.04, PALETTE.gold);
  head.box(0, 0, -0.2, 0.18, 0.18, 0.05, '#3A302A');
  head.box(0, 0.165, 0.27, 0.28, 0.016, 0.14, PALETTE.ink, { rx: -0.4 });
  head.box(0, -0.165, 0.27, 0.28, 0.016, 0.14, PALETTE.ink, { rx: 0.4 });
  head.quad(R.bulb, 0, 0, 0.213, 0.24, 0.24, { color: '#FFF4D6' });
  // soft light beam (cone along +Z, fading away from the lens)
  // a short soft beam: bright at the lens, gone long before it reaches the book covers
  const L = Math.min(1.25, dist * 0.55);
  const cone = new THREE.CylinderGeometry(0.34, 0.11, L, 20, 1, true);
  cone.rotateX(Math.PI / 2);
  cone.translate(0, 0, 0.22 + L / 2);
  head.shape(cone, '#FFE4A8', { region: R.beam, lit: false, outline: false });
  // a warm pool of light on the stage in front of the books
  rig.root.quad(R.pool, tx * 0.95, STAGE_H + 0.006, -2.95, 1.6, 0.42, { rx: -Math.PI / 2, color: '#FFE9B8' });
  return { head, phase: side > 0 ? 1.7 : 0 };
}

function buildDirectorChair(S, rig, R) {
  const x = -2.82;
  const z = -0.92;
  const rotY = headingTo(x, z, -0.9, -3.0);
  const v = new VoxelBuilder();
  const wood = PALETTE.woodDark;
  const canvas = PALETTE.maroon;
  for (const sx of [-1, 1]) {
    v.add(UNIT_BOX, wood, boxMatrix(sx * 0.25, 0.23, 0, 0.05, 0.56, 0.05, 0.62));
    v.add(UNIT_BOX, wood, boxMatrix(sx * 0.25, 0.23, 0, 0.05, 0.56, 0.05, -0.62));
    v.box(sx * 0.25, 0.025, 0, 0.06, 0.05, 0.44, wood);
    v.box(sx * 0.25, 0.45, 0, 0.06, 0.05, 0.46, wood);
    v.box(sx * 0.25, 0.57, 0.19, 0.05, 0.2, 0.05, wood);
    v.box(sx * 0.25, 0.69, 0.03, 0.08, 0.045, 0.5, wood);
    v.box(sx * 0.25, 0.79, -0.21, 0.05, 0.68, 0.05, wood);
  }
  v.box(0, 0.47, 0, 0.46, 0.03, 0.42, canvas);
  v.box(0, 0.96, -0.21, 0.5, 0.24, 0.03, canvas);
  v.box(0, 1.1, -0.21, 0.56, 0.04, 0.05, PALETTE.gold);
  S.merge(v, placeMatrix(x, 0, z, rotY));
  const name = rig.part({ name: 'chairName', position: [x, 0, z], rotation: [0, rotY, 0] });
  name.quad(R.chairName, 0, 0.96, -0.229, 0.42, 0.168, { ry: Math.PI });
  // script pages scattered around the chair, one lifting in the draught
  const pages = [
    [-2.2, -0.42, 0.5],
    [-2.46, -0.2, -0.35],
    [-3.08, -0.18, 0.2],
  ];
  for (const [px, pz, ry] of pages) rig.root.quad(R.page, px, 0.008, pz, 0.26, 0.325, { rx: -Math.PI / 2, rz: ry, lit: true });
  const flutter = rig.part({ name: 'flutterPage', position: [-2.1, 0.01, -0.02], rotation: [0, -0.3, 0] });
  flutter.quad(R.page, 0.13, 0, 0, 0.26, 0.325, { rx: -Math.PI / 2, lit: true });
  return { x, z, flutter };
}

function buildFilmCans(S, x, z) {
  const cans = [
    [0, 0, 0.3, PALETTE.bronze],
    [0.03, 0.07, 0.27, PALETTE.goldDeep],
    [-0.02, 0.14, 0.24, PALETTE.bronze],
  ];
  for (const [dx, y, r, c] of cans) {
    S.add(new THREE.CylinderGeometry(r, r, 0.065, 16), c, boxMatrix(x + dx, y + 0.0325, z, 1, 1, 1));
    S.box(x + dx, y + 0.066, z + r * 0.45, r * 0.7, 0.004, 0.08, PALETTE.maroon);
  }
  // a rolled script leaning on the cans
  S.add(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 10), PALETTE.paper, boxMatrix(x - 0.36, 0.2, z + 0.05, 1, 1, 1, 0, 0, 0.5));
  S.add(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 10), PALETTE.maroon, boxMatrix(x - 0.36, 0.2, z + 0.05, 1, 1, 1, 0, 0, 0.5));
}

function addReel(p, r) {
  p.shape(new THREE.CylinderGeometry(r, r, 0.045, 18), '#3B3029', { matrix: rotationMatrix(0, 0, Math.PI / 2) });
  p.shape(new THREE.CylinderGeometry(r * 0.28, r * 0.28, 0.06, 10), PALETTE.gold, { matrix: rotationMatrix(0, 0, Math.PI / 2), outline: false });
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    for (const sx of [-1, 1]) p.box(sx * 0.026, Math.sin(a) * r * 0.58, Math.cos(a) * r * 0.58, 0.008, r * 0.34, r * 0.34, PALETTE.cream, { outline: false });
  }
}

function buildCamera(S, rig, R) {
  const x = 3.0;
  const z = -2.34;
  const hubY = 1.0;
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + 0.25;
    S.add(UNIT_BOX, PALETTE.woodDark, segmentMatrix([x, hubY, z], [x + Math.sin(a) * 0.36, 0.01, z + Math.cos(a) * 0.36], 0.05));
  }
  S.box(x, hubY, z, 0.13, 0.08, 0.13, PALETTE.ink);
  S.box(x, hubY + 0.07, z, 0.06, 0.1, 0.06, PALETTE.ink);
  const yaw = headingTo(x, z, 0.4, -3.3);
  const head = rig.part({ name: 'camHead', position: [x, hubY + 0.12, z], rotation: [0.07, yaw, 0] });
  head.box(0, 0.16, -0.02, 0.27, 0.27, 0.44, PALETTE.ink);
  head.box(0, 0.16, -0.02, 0.28, 0.045, 0.45, PALETTE.goldDeep, { outline: false });
  head.shape(new THREE.CylinderGeometry(0.085, 0.095, 0.16, 16), '#3B3029', { matrix: boxMatrix(0, 0.16, 0.28, 1, 1, 1, Math.PI / 2) });
  head.shape(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 16), PALETTE.gold, { matrix: boxMatrix(0, 0.16, 0.37, 1, 1, 1, Math.PI / 2) });
  head.quad(R.bulb, 0, 0.16, 0.392, 0.15, 0.15, { color: '#BFD9EC' });
  head.box(-0.16, 0.24, -0.16, 0.07, 0.08, 0.16, PALETTE.ink);
  head.box(0, 0.33, -0.08, 0.05, 0.05, 0.2, PALETTE.bronze);
  head.box(0, 0.06, -0.3, 0.05, 0.05, 0.26, PALETTE.bronze, { rx: 0.35 });
  const reelA = rig.part({ name: 'reelA', parent: head, position: [0, 0.47, 0.08] });
  addReel(reelA, 0.16);
  const reelB = rig.part({ name: 'reelB', parent: head, position: [0, 0.45, -0.22] });
  addReel(reelB, 0.14);
  const rec = rig.part({ name: 'rec', parent: head, position: [0.141, 0.24, 0.13] });
  rec.quad(R.bulb, 0, 0, 0, 0.07, 0.07, { ry: Math.PI / 2, color: '#FF5A4E' });
  return { x, z, head, reelA, reelB, rec };
}

function addStripes(p, x0, y0, len, h, n, depth) {
  p.boxMin(x0, y0, -depth / 2, x0 + len, y0 + h, depth / 2, PALETTE.ink);
  for (let i = 0; i < n; i += 2) {
    p.boxMin(x0 + (len * i) / n + 0.004, y0 + 0.004, -depth / 2 - 0.002, x0 + (len * (i + 1)) / n, y0 + h - 0.004, depth / 2 + 0.002, PALETTE.paper, { outline: false, rz: 0 });
  }
}

function buildClapper(S, rig, R) {
  const bx = -2.5;
  const bz = 0.35;
  S.boxMin(bx - 0.27, 0, bz - 0.18, bx + 0.27, 0.28, bz + 0.18, '#9A6A3E');
  S.boxMin(bx - 0.1, 0.13, bz + 0.18, bx + 0.1, 0.19, bz + 0.185, '#5A3A20');
  const clap = rig.part({ name: 'clap', position: [bx, 0.28, bz + 0.03], rotation: [-0.22, 0.3, 0] });
  clap.boxMin(-0.22, 0, -0.02, 0.22, 0.3, 0.02, '#2A2420');
  clap.quad(R.clapFace, 0, 0.15, 0.0215, 0.42, 0.28);
  addStripes(clap, -0.22, 0.3, 0.44, 0.055, 6, 0.04);
  const arm = rig.part({ name: 'clapArm', parent: clap, position: [-0.22, 0.358, 0], rotation: [0, 0, 0.5] });
  addStripes(arm, 0, 0, 0.44, 0.055, 6, 0.04);
  return { clap, arm };
}

const GIFTS = [
  { key: 'Basic', s: 0.32, x: -2.86, body: PALETTE.paper, ribbon: PALETTE.gold, knot: PALETTE.goldDeep },
  { key: 'Advanced', s: 0.4, x: -2.36, body: PALETTE.gold, ribbon: PALETTE.maroon, knot: PALETTE.maroonDeep },
  { key: 'Master', s: 0.48, x: -1.86, body: PALETTE.maroon, ribbon: PALETTE.gold, knot: PALETTE.goldDeep },
];

function buildBundles(S, rig, R) {
  const cx = -2.36;
  const cz = 1.3;
  const w = 1.72;
  const d = 0.5;
  const h = 0.6;
  S.boxMin(cx - w / 2, 0, cz - d / 2, cx + w / 2, 0.08, cz + d / 2, PALETTE.woodDark);
  S.boxMin(cx - w / 2 + 0.03, 0.08, cz - d / 2 + 0.02, cx + w / 2 - 0.03, h - 0.06, cz + d / 2 - 0.02, PALETTE.wood);
  S.boxMin(cx - w / 2 - 0.03, h - 0.06, cz - d / 2 - 0.03, cx + w / 2 + 0.03, h, cz + d / 2 + 0.03, PALETTE.gold);
  // door panels with gold knobs; each wears its gift tag
  GIFTS.forEach((gft, i) => {
    const x0 = cx - w / 2 + 0.07 + (i * (w - 0.14)) / 3;
    const x1 = x0 + (w - 0.14) / 3 - 0.05;
    S.boxMin(x0, 0.13, cz + d / 2 - 0.02, x1, h - 0.11, cz + d / 2 + 0.006, PALETTE.cream);
    S.box((x0 + x1) / 2, 0.19, cz + d / 2 + 0.012, 0.07, 0.03, 0.02, PALETTE.goldDeep);
    rig.root.quad(R[`tag${gft.key}`], (x0 + x1) / 2, 0.37, cz + d / 2 + 0.012, 0.46, 0.175);
  });
  // header sign on two gold posts behind the boxes
  for (const px of [cx - w / 2 + 0.06, cx + w / 2 - 0.06]) S.box(px, (h + 1.8) / 2, cz - d / 2 + 0.07, 0.05, 1.8 - h, 0.05, PALETTE.gold);
  S.boxMin(cx - 0.72, 1.4, cz - d / 2 + 0.04, cx + 0.72, 1.82, cz - d / 2 + 0.1, PALETTE.goldDeep);
  rig.root.quad(R.bundleSign, cx, 1.61, cz - d / 2 + 0.104, 1.4, 1.4 * (136 / 440));
  // the three gift boxes (hop in turn; lids pop when Maya comes close)
  return GIFTS.map((gft, i) => {
    const s = gft.s;
    const hb = s * 0.8;
    const hl = s * 0.2;
    const rw = Math.max(0.05, s * 0.16);
    const box = rig.part({ name: `gift${gft.key}`, position: [gft.x, h, cz + 0.02] });
    box.boxMin(-s / 2, 0, -s / 2, s / 2, hb, s / 2, gft.body);
    box.boxMin(-rw / 2, 0, s / 2 - 0.002, rw / 2, hb, s / 2 + 0.012, gft.ribbon, { outline: false });
    box.boxMin(s / 2 - 0.002, 0, -rw / 2, s / 2 + 0.012, hb, rw / 2, gft.ribbon, { outline: false });
    box.boxMin(-s / 2 - 0.012, 0, -rw / 2, -s / 2 + 0.002, hb, rw / 2, gft.ribbon, { outline: false });
    const lid = rig.part({ name: `lid${gft.key}`, parent: box, position: [0, hb, 0] });
    lid.boxMin(-s / 2 - 0.025, 0, -s / 2 - 0.025, s / 2 + 0.025, hl, s / 2 + 0.025, gft.body);
    lid.boxMin(-rw / 2, -0.002, s / 2 + 0.022, rw / 2, hl + 0.002, s / 2 + 0.036, gft.ribbon, { outline: false });
    lid.boxMin(-rw / 2, hl - 0.002, -s / 2 - 0.026, rw / 2, hl + 0.012, s / 2 + 0.026, gft.ribbon, { outline: false });
    lid.boxMin(-s / 2 - 0.026, hl - 0.002, -rw / 2, s / 2 + 0.026, hl + 0.012, rw / 2, gft.ribbon, { outline: false });
    const k = s / 0.4;
    lid.box(-0.07 * k, hl + 0.06 * k, 0, 0.13 * k, 0.085 * k, 0.06 * k, gft.ribbon, { rz: 0.55 });
    lid.box(0.07 * k, hl + 0.06 * k, 0, 0.13 * k, 0.085 * k, 0.06 * k, gft.ribbon, { rz: -0.55 });
    lid.box(0, hl + 0.035 * k, 0, 0.06 * k, 0.06 * k, 0.07 * k, gft.knot);
    if (i === 2) lid.quad(R.sparkle, 0, hl + 0.3, 0, 0.22, 0.22);
    const sparks = [];
    for (let j = 0; j < 2; j++) {
      const sp = rig.part({ name: `giftSpark${i}${j}`, parent: box, position: [(j - 0.5) * s * 0.4, hb, s * 0.25] });
      sp.quad(R.sparkle, 0, 0, 0, 0.15, 0.15);
      sparks.push(sp);
    }
    return { box, lid, sparks, s, phase: i * 0.13, spring: createSpring(120, 10), pose: { y: 0, sy: 1, sx: 1, lag: 0 } };
  });
}

function bloom(v, x, y, z, kind, s = 1) {
  if (kind === 'rose') {
    v.box(x, y, z, 0.11 * s, 0.1 * s, 0.11 * s, PALETTE.rose);
    v.box(x, y + 0.03 * s, z, 0.055 * s, 0.06 * s, 0.055 * s, '#D9808F');
  } else if (kind === 'lily') {
    v.box(x, y, z, 0.07 * s, 0.07 * s, 0.07 * s, PALETTE.lily);
    for (const [px, pz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) v.box(x + px * 0.06 * s, y + 0.02 * s, z + pz * 0.06 * s, (px ? 0.07 : 0.045) * s, 0.03 * s, (pz ? 0.07 : 0.045) * s, PALETTE.lily);
    v.box(x, y + 0.05 * s, z, 0.025 * s, 0.05 * s, 0.025 * s, PALETTE.gold);
  } else {
    v.box(x, y, z, 0.1 * s, 0.07 * s, 0.1 * s, kind === 'leafDark' ? PALETTE.leafDark : PALETTE.leaf);
  }
}

function gardenChair() {
  const v = new VoxelBuilder();
  const white = PALETTE.white;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * 0.18, 0.21, sz * 0.18, 0.05, 0.42, 0.05, white);
  v.box(0, 0.42, 0, 0.46, 0.05, 0.46, white);
  v.box(0, 0.475, 0.01, 0.4, 0.06, 0.4, PALETTE.maroon);
  for (const sx of [-1, 1]) v.box(sx * 0.2, 0.72, -0.2, 0.05, 0.56, 0.05, white);
  v.box(0, 0.98, -0.2, 0.5, 0.05, 0.06, PALETTE.gold);
  v.box(0, 0.73, -0.19, 0.36, 0.32, 0.045, PALETTE.maroon);
  return v;
}

function buildGazebo(S, rig, R) {
  const cx = 2.44;
  const az = 0.92;
  const lx = 1.72;
  const rx = 3.16;
  // little deck
  S.boxMin(1.58, 0, 0.74, 3.3, 0.05, 1.86, '#F2EADB');
  S.boxMin(1.56, 0, 1.84, 3.32, 0.06, 1.9, PALETTE.gold);
  // posts and the arch
  for (const px of [lx, rx]) {
    S.boxMin(px - 0.07, 0.05, az - 0.07, px + 0.07, 2.02, az + 0.07, PALETTE.white);
    S.boxMin(px - 0.09, 0.05, az - 0.09, px + 0.09, 0.16, az + 0.09, PALETTE.gold);
    S.boxMin(px - 0.09, 1.98, az - 0.09, px + 0.09, 2.06, az + 0.09, PALETTE.gold);
  }
  const arcR = (rx - lx) / 2;
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI - (i * Math.PI) / 8;
    pts.push([cx + Math.cos(a) * arcR, 2.04 + Math.sin(a) * 0.46, az]);
  }
  for (let i = 0; i < 8; i++) S.add(UNIT_BOX, PALETTE.white, segmentMatrix(pts[i], pts[i + 1], 0.13, 0.14));
  S.box(cx, 2.5, az, 0.14, 0.14, 0.16, PALETTE.gold);
  // low lattice fence between the posts
  for (let x = lx + 0.2; x < rx - 0.1; x += 0.22) S.boxMin(x - 0.018, 0.05, az - 0.03, x + 0.018, 1.02, az - 0.0, PALETTE.white);
  for (const y of [0.36, 0.7, 1.0]) S.boxMin(lx, y - 0.018, az - 0.035, rx, y + 0.018, az + 0.005, PALETTE.white);
  // climbing roses and lilies (static ones; three clusters sway in the rig)
  const flowers = [
    [lx + 0.02, 0.45, az + 0.09, 'leaf'], [lx - 0.04, 0.62, az + 0.08, 'rose'], [lx + 0.05, 0.85, az + 0.1, 'leafDark'],
    [lx - 0.02, 1.1, az + 0.09, 'lily'], [lx + 0.04, 1.32, az + 0.1, 'leaf'], [lx - 0.03, 1.55, az + 0.09, 'rose'],
    [lx + 0.03, 1.78, az + 0.1, 'leafDark'], [rx - 0.02, 0.5, az + 0.09, 'leafDark'], [rx + 0.04, 0.74, az + 0.08, 'lily'],
    [rx - 0.05, 0.98, az + 0.1, 'leaf'], [rx + 0.02, 1.22, az + 0.09, 'rose'], [rx - 0.03, 1.46, az + 0.1, 'leafDark'],
    [rx + 0.03, 1.7, az + 0.09, 'lily'], [rx - 0.02, 1.9, az + 0.1, 'leaf'],
  ];
  for (const [x, y, z, k] of flowers) bloom(S, x, y, z, k, 1.1);
  for (let i = 1; i < 8; i++) {
    const [x, y] = pts[i];
    bloom(S, x, y + 0.06, az + 0.06, i % 2 ? 'leaf' : 'leafDark', 1.05);
    if (i !== 4) bloom(S, x + 0.04, y + 0.1, az + 0.1, i % 3 === 0 ? 'lily' : 'rose', 1.0);
  }
  // facing chairs and the little tea table
  S.merge(gardenChair(), placeMatrix(2.01, 0.05, 1.36, Math.PI / 2));
  S.merge(gardenChair(), placeMatrix(2.87, 0.05, 1.36, -Math.PI / 2));
  const tx = cx;
  const tz = 1.36;
  S.boxMin(tx - 0.13, 0.05, tz - 0.13, tx + 0.13, 0.09, tz + 0.13, PALETTE.gold);
  S.box(tx, 0.3, tz, 0.06, 0.42, 0.06, PALETTE.white);
  S.box(tx, 0.53, tz, 0.5, 0.04, 0.36, PALETTE.white);
  S.box(tx, 0.53, tz, 0.36, 0.04, 0.5, PALETTE.white);
  S.box(tx, 0.555, tz, 0.4, 0.012, 0.4, PALETTE.gold);
  for (const [ox, oz] of [[-0.12, 0.08], [0.12, -0.06]]) {
    S.box(tx + ox, 0.6, tz + oz, 0.075, 0.07, 0.075, PALETTE.cream);
    S.box(tx + ox, 0.637, tz + oz, 0.08, 0.012, 0.08, PALETTE.gold);
    S.box(tx + ox + 0.05, 0.6, tz + oz, 0.025, 0.04, 0.02, PALETTE.cream);
  }
  S.box(tx + 0.02, 0.63, tz - 0.14, 0.16, 0.13, 0.13, PALETTE.white);
  S.box(tx + 0.02, 0.705, tz - 0.14, 0.09, 0.03, 0.09, PALETTE.gold);
  S.box(tx + 0.13, 0.66, tz - 0.14, 0.08, 0.035, 0.035, PALETTE.white);
  S.box(tx - 0.12, 0.6, tz + 0.14, 0.05, 0.1, 0.05, PALETTE.cream);
  bloom(S, tx - 0.12, 0.69, tz + 0.14, 'lily', 0.75);
  // hanging sign (swings), three swaying flower clusters, tea steam
  const sign = rig.part({ name: 'consultSign', position: [cx, 2.36, az + 0.02] });
  for (const sx of [-0.4, 0.4]) sign.box(sx, -0.08, 0, 0.018, 0.16, 0.018, PALETTE.goldDeep, { outline: false });
  sign.box(0, -0.33, 0, 1.18, 0.38, 0.035, PALETTE.white);
  sign.quad(R.consultSign, 0, -0.33, 0.0185, 1.14, 1.14 * (150 / 440));
  const clusters = [];
  for (const [i, kinds] of [[2, ['rose', 'lily', 'leaf']], [4, ['lily', 'rose', 'leafDark']], [6, ['rose', 'leaf', 'lily']]]) {
    const [x, y] = pts[i];
    const c = rig.part({ name: `bloom${i}`, position: [x, y + 0.1, az + 0.12] });
    bloom(c, -0.07, 0.02, 0, kinds[0], 1.15);
    bloom(c, 0.07, 0.0, 0.02, kinds[1], 1.1);
    bloom(c, 0, 0.1, -0.02, kinds[2], 1.0);
    clusters.push(c);
  }
  const steam = [];
  for (let i = 0; i < 3; i++) {
    const p = rig.part({ name: `steam${i}`, position: [tx + 0.17, 0.72, tz - 0.14] });
    p.box(0, 0, 0, 0.06, 0.05, 0.06, PALETTE.white, { outline: false });
    p.box(0.03, 0.03, 0, 0.045, 0.04, 0.045, PALETTE.white, { outline: false });
    steam.push(p);
  }
  return { sign, clusters, steam, spring: createSpring(60, 4) };
}

function buildWallSparkles(rig, R) {
  const spots = [
    [-2.05, 1.86, 0.2], [-1.45, 2.42, 0.14], [1.48, 2.36, 0.15], [2.0, 2.22, 0.2], [-0.62, 1.88, 0.11], [0.66, 1.9, 0.12],
  ];
  return spots.map(([x, y, s], i) => {
    const p = rig.part({ name: `wallSpark${i}`, position: [x, y, -3.9] });
    p.quad(R.sparkle, 0, 0, 0, s, s);
    return p;
  });
}

function buildFloatingQuill(rig, R) {
  const page = rig.part({ name: 'airPage', position: [-1.06, 1.3, -2.55], rotation: [-0.5, 0.2, 0.08] });
  page.boxMin(-0.15, -0.19, -0.004, 0.15, 0.19, 0.004, PALETTE.paper);
  page.quad(R.page, 0, 0, 0.0052, 0.28, 0.35, { lit: true });
  const quill = rig.part({ name: 'quill', parent: page, position: [0.05, -0.04, 0.03], rotation: [0, 0, -0.55] });
  quill.box(0, 0.18, 0, 0.012, 0.36, 0.012, PALETTE.goldDeep);
  quill.box(0, -0.02, 0, 0.018, 0.05, 0.018, PALETTE.ink);
  const vane = [[0.2, 0.06], [0.27, 0.075], [0.33, 0.08], [0.39, 0.075], [0.44, 0.06], [0.48, 0.04]];
  for (const [y, wv] of vane) {
    quill.box(-wv / 2 - 0.004, y - 0.04, 0, wv, 0.06, 0.008, PALETTE.white, { rz: 0.35 });
    quill.box(wv / 2 + 0.004, y - 0.04, 0, wv, 0.06, 0.008, PALETTE.cream, { rz: -0.35 });
  }
  const twinkles = [];
  for (let i = 0; i < 3; i++) {
    const s = rig.part({ name: `airSpark${i}`, parent: page, position: [-0.2 + i * 0.2, 0.28 - (i % 2) * 0.14, 0.04] });
    s.quad(R.sparkle, 0, 0, 0, 0.1, 0.1);
    twinkles.push(s);
  }
  return { page, quill, twinkles };
}

/* ---------- detail pass: boards, wallpaper, film strip, set dressing, small life ---------- */
const FLOOR_WOOD = '#BD8F5E';
const SEAM = '#6A452A';
const CABLE = '#2A2420';
const rand = (n) => frac(Math.sin(n * 12.9898 + 4.1414) * 43758.5453);

/** Staggered boards with butt joints, three tones and a grain streak each (flat, no outlines). */
function addPlankDetail(p) {
  let k = 0;
  for (let i = 2; i < 16; i++) {
    const z0 = -4 + i * 0.5;
    const z1 = z0 + 0.488;
    let x = -3.5 - rand(i * 7.3) * 1.3;
    while (x < 3.5) {
      const len = 1.1 + rand(i * 13 + k * 3.7) * 1.35;
      const xa = Math.max(-3.5, x);
      const xb = Math.min(3.5, x + len);
      if (xb - xa > 0.08) {
        p.boxMin(xa + 0.007, 0, z0 + 0.003, xb - 0.007, 0.0024, z1 - 0.003, jitter(FLOOR_WOOD, 0.1, i * 31 + k), { outline: false });
        const gz = z0 + 0.1 + rand(k + 0.5) * 0.28;
        const gx = xa + (xb - xa) * (0.12 + rand(k + 1.7) * 0.3);
        p.boxMin(gx, 0.0024, gz, Math.min(xb - 0.05, gx + (xb - xa) * 0.45), 0.003, gz + 0.008, jitter('#A9784A', 0.06, k), { outline: false });
        // darker end grain at each joint (fake contact shading)
        if (x + len < 3.5) p.boxMin(xb - 0.05, 0.0024, z0 + 0.006, xb - 0.007, 0.0028, z1 - 0.006, jitter('#AE8051', 0.04, k + 9), { outline: false });
      }
      if (x + len < 3.5 && x + len > -3.5) p.boxMin(x + len - 0.007, 0, z0, x + len + 0.007, 0.0018, z1, SEAM, { outline: false });
      x += len;
      k++;
    }
  }
}

/** Gold pinstripes and small diamonds on the red carpet (kept below the station rings). */
function addCarpetDetail(p) {
  const z0 = STAGE_FRONT + 0.12;
  const z1 = 3.06;
  for (const sx of [-1, 1]) {
    p.boxMin(sx * 0.455 - 0.012, 0.013, z0, sx * 0.455 + 0.012, 0.0146, z1, PALETTE.gold, { outline: false });
    for (let z = z0 + 0.2; z < z1 - 0.1; z += 0.36) p.box(sx * 0.455, 0.0148, z, 0.05, 0.0012, 0.05, '#E2C27A', { ry: Math.PI / 4, outline: false });
  }
  for (const fz of [1.42, 0.08]) {
    p.box(0, 0.0139, fz, 0.16, 0.0016, 0.16, PALETTE.gold, { ry: Math.PI / 4, outline: false });
    p.box(0, 0.0142, fz, 0.08, 0.0016, 0.08, '#5A1822', { ry: Math.PI / 4, outline: false });
  }
  // a darker pile band just inside the gold border (velvet edge)
  for (const sx of [-1, 1]) p.boxMin(sx * 0.53, 0.013, z0 - 0.08, sx * 0.49, 0.0137, z1 + 0.06, '#5C1822', { outline: false });
}

/** Wallpaper stripes above the chair rail and raised panels on the wainscot of the back wall. */
function addStudioWall(p) {
  const z = -4.0;
  let i = 0;
  for (let x = -3.1; x < 3.1; x += 0.26, i++) {
    p.boxMin(x, 1.065, z, x + 0.11, 2.62, z + 0.004, '#EEDDBF', { outline: false });
    if (i % 2 === 0) p.boxMin(x + 0.178, 1.065, z, x + 0.19, 2.62, z + 0.005, '#DDBF84', { outline: false });
  }
  // the same stripes on the full-height back part of both side walls
  for (const sx of [-1, 1]) {
    for (let zz = -3.7; zz < -0.55; zz += 0.26) p.boxMin(sx * 3.496, 1.065, zz, sx * 3.5, 2.88, zz + 0.11, '#EEDDBF', { outline: false });
  }
  for (let x = -3.0; x < 2.95; x += 0.75) {
    const x1 = x + 0.62;
    const c = '#D3B98E';
    p.boxMin(x, 0.84, z, x1, 0.875, z + 0.012, c, { outline: false });
    p.boxMin(x, 0.2, z, x1, 0.235, z + 0.012, c, { outline: false });
    p.boxMin(x, 0.2, z, x + 0.035, 0.875, z + 0.012, c, { outline: false });
    p.boxMin(x1 - 0.035, 0.2, z, x1, 0.875, z + 0.012, c, { outline: false });
    p.boxMin(x + 0.035, 0.235, z, x1 - 0.035, 0.84, z + 0.006, '#E9D3AC', { outline: false });
  }
}

/** A film strip running across the valance: black band, sprocket holes, amber frames. */
function addFilmStrip(p) {
  const z = -3.8;
  const y0 = 2.685;
  const y1 = 2.955;
  p.boxMin(-3.48, y0, z - 0.004, 3.48, y1, z + 0.012, '#241C17');
  for (let x = -3.44; x < 3.45; x += 0.074) {
    for (const hy of [y0 + 0.03, y1 - 0.03]) p.box(x, hy, z + 0.0132, 0.032, 0.028, 0.003, '#EADCBC', { outline: false });
  }
  let i = 0;
  for (let x = -3.38; x < 3.2; x += 0.235, i++) {
    const tone = ['#D8AE58', '#E7C987', '#C99A48'][i % 3];
    p.boxMin(x, y0 + 0.062, z + 0.0125, x + 0.2, y1 - 0.062, z + 0.0145, jitter(tone, 0.05, i), { outline: false });
    const cy = (y0 + y1) / 2;
    if (i % 3 === 1) {
      p.box(x + 0.1, cy, z + 0.015, 0.07, 0.016, 0.002, '#FFF3D0', { outline: false });
      p.box(x + 0.1, cy, z + 0.015, 0.016, 0.07, 0.002, '#FFF3D0', { outline: false });
    } else if (i % 3 === 2) {
      p.box(x + 0.1, cy - 0.02, z + 0.015, 0.11, 0.05, 0.002, '#8C5A2E', { outline: false }); // a tiny "scene": hill
      p.box(x + 0.15, cy + 0.035, z + 0.015, 0.03, 0.03, 0.002, '#FFF3D0', { outline: false }); // and a sun
    }
  }
}

/** "Now showing" poster and a cork board with pinned script pages, in the gaps between the books. */
function addWallArt(S, p, R) {
  const px = 1.03;
  const py = 1.43;
  const pw = 0.48;
  const ph = 0.67;
  S.boxMin(px - pw / 2 - 0.05, py - ph / 2 - 0.05, -4.0, px + pw / 2 + 0.05, py + ph / 2 + 0.05, -3.968, PALETTE.gold);
  S.boxMin(px - pw / 2 - 0.02, py - ph / 2 - 0.02, -4.0, px + pw / 2 + 0.02, py + ph / 2 + 0.02, -3.962, PALETTE.goldDeep);
  p.quad(R.poster, px, py, -3.958, pw, ph);
  S.box(px, py + ph / 2 + 0.09, -3.94, 0.22, 0.04, 0.08, PALETTE.ink); // picture light
  p.quad(R.bulb, px, py + ph / 2 + 0.06, -3.89, 0.3, 0.12, { color: '#FFE6A6' });
  const cx = -1.1;
  const cy = 1.42;
  const cw = 0.64;
  const ch = 0.6;
  S.boxMin(cx - cw / 2, cy - ch / 2, -4.0, cx + cw / 2, cy + ch / 2, -3.972, PALETTE.woodDark);
  S.boxMin(cx - cw / 2 + 0.04, cy - ch / 2 + 0.04, -4.0, cx + cw / 2 - 0.04, cy + ch / 2 - 0.04, -3.966, '#C59B66');
  const pins = [
    [R.page, -0.15, 0.04, 0.2, 0.25, 0.06, PALETTE.maroon],
    [R.note, 0.13, 0.09, 0.15, 0.19, -0.1, PALETTE.gold],
    [R.lines, 0.07, -0.13, 0.17, 0.2, 0.14, PALETTE.rose],
    [R.note, -0.2, -0.17, 0.12, 0.15, 0.2, PALETTE.boxBlue],
  ];
  pins.forEach(([reg, ox, oy, w, h, rz, pin], i) => {
    p.quad(reg, cx + ox, cy + oy, -3.962 + i * 0.0012, w, h, { rz, lit: true });
    p.box(cx + ox - Math.sin(rz) * h * 0.42, cy + oy + Math.cos(rz) * h * 0.42, -3.955, 0.025, 0.025, 0.02, pin);
  });
}

/** Brass stanchions with velvet ropes framing the carpet's stage end (the ropes sway). */
function addStanchions(S, rig, room) {
  for (const sx of [-1, 1]) {
    for (const z of [-2.5, -1.96]) {
      const x = sx * 0.86;
      S.add(new THREE.CylinderGeometry(0.1, 0.12, 0.035, 12), PALETTE.goldDeep, boxMatrix(x, 0.018, z, 1, 1, 1));
      S.add(new THREE.CylinderGeometry(0.05, 0.07, 0.05, 10), PALETTE.gold, boxMatrix(x, 0.06, z, 1, 1, 1));
      S.box(x, 0.47, z, 0.04, 0.8, 0.04, PALETTE.gold);
      S.box(x, 0.885, z, 0.07, 0.03, 0.07, PALETTE.goldDeep);
      S.box(x, 0.94, z, 0.065, 0.075, 0.065, PALETTE.gold);
    }
    blockBox(room, sx * 0.86 - 0.12, -2.62, sx * 0.86 + 0.12, -1.84);
  }
  return [-1, 1].map((sx, i) => {
    const rope = rig.part({ name: `rope${i}`, position: [sx * 0.86, 0.84, -2.23] });
    rope.shape(UNIT_BOX, PALETTE.maroon, { matrix: segmentMatrix([0, 0, -0.25], [0, -0.17, 0], 0.038) });
    rope.shape(UNIT_BOX, PALETTE.maroon, { matrix: segmentMatrix([0, -0.17, 0], [0, 0, 0.25], 0.038) });
    for (const z of [-0.245, 0.245]) rope.box(0, 0, z, 0.045, 0.045, 0.03, PALETTE.goldDeep);
    return rope;
  });
}

/** Footlights along the stage lip: brass hoods with glows that twinkle in a slow chase. */
function addFootlights(S, rig, R) {
  const xs = [-2.9, -2.0, -1.05, -0.42, 0.42, 1.05, 2.0, 2.9];
  return xs.map((fx) => {
    // the four outer hoods already stand on the lip (buildStage); add the in-between ones
    if (![-2.9, -1.05, 1.05, 2.9].includes(fx)) S.box(fx, STAGE_H + 0.03, STAGE_FRONT - 0.06, 0.16, 0.06, 0.08, PALETTE.goldDeep);
    S.box(fx, STAGE_H + 0.068, STAGE_FRONT - 0.075, 0.18, 0.016, 0.1, PALETTE.gold);
    const p = rig.part({ name: 'footlight', position: [fx, STAGE_H + 0.05, STAGE_FRONT - 0.012] });
    p.quad(R.bulb, 0, 0, 0, 0.17, 0.11, { color: '#FFE8B0' });
    return p;
  });
}

/** A flat cable on the floor along a polyline [[x, z], ...], with tape strips across it. */
function addCable(p, pts, tapes = []) {
  for (let i = 0; i < pts.length - 1; i++) {
    p.shape(UNIT_BOX, CABLE, { matrix: segmentMatrix([pts[i][0], 0.011, pts[i][1]], [pts[i + 1][0], 0.011, pts[i + 1][1]], 0.024), outline: false });
  }
  for (const [x, z, ry] of tapes) p.box(x, 0.022, z, 0.1, 0.004, 0.05, '#E9DDC2', { ry, outline: false });
}

/** Set dressing on the floor: cables, spike-tape marks and stray script pages. */
function addFloorDressing(p, R) {
  addCable(p, [[-3.0, -2.38], [-2.72, -2.55], [-2.2, -2.6], [-1.65, -2.57], [-1.42, -2.69]], [[-2.45, -2.59, 0.1], [-1.75, -2.58, -0.05]]);
  addCable(p, [[3.0, -2.34], [2.92, -1.95], [3.0, -1.45], [2.84, -0.8]], [[2.95, -1.7, 1.5]]);
  addCable(p, [[2.84, -0.8], [3.2, -0.6], [3.4, -0.3], [3.42, 0.5]], [[3.3, -0.45, 1.0], [3.41, 0.1, 1.55]]);
  const marks = [[-1.3, -0.3, PALETTE.gold, 0.2], [1.35, 0.15, PALETTE.rose, -0.15], [-1.05, 2.0, '#E9DDC2', 0.1], [1.55, -0.85, PALETTE.gold, 0.35]];
  for (const [x, z, c, ry] of marks) {
    p.box(x, 0.004, z, 0.2, 0.004, 0.04, c, { ry, outline: false });
    p.box(x + Math.sin(ry) * 0.08, 0.0042, z + Math.cos(ry) * 0.08, 0.04, 0.004, 0.13, c, { ry, outline: false });
  }
  for (const [x, z, rz] of [[-1.62, 0.6, 0.4], [-1.32, 0.82, -0.25], [1.42, 2.3, -0.3], [0.95, 1.05, 0.7]]) {
    p.quad(R.page, x, 0.009, z, 0.24, 0.3, { rx: -Math.PI / 2, rz, lit: true });
  }
}

/** A softbox light on a tripod by the camera, aimed at the studio floor. */
function addSoftbox(S, rig, R, room) {
  const x = 2.84;
  const z = -0.8;
  for (let i = 0; i < 3; i++) {
    const a = i * ((Math.PI * 2) / 3) + 0.9;
    S.add(UNIT_BOX, PALETTE.ink, segmentMatrix([x, 0.44, z], [x + Math.sin(a) * 0.3, 0.01, z + Math.cos(a) * 0.3], 0.03));
    S.box(x + Math.sin(a) * 0.3, 0.012, z + Math.cos(a) * 0.3, 0.06, 0.024, 0.06, PALETTE.goldDeep);
  }
  S.box(x, 0.44, z, 0.07, 0.06, 0.07, PALETTE.goldDeep);
  S.box(x, 0.97, z, 0.035, 1.06, 0.035, PALETTE.ink);
  S.box(x, 1.2, z, 0.06, 0.05, 0.06, PALETTE.goldDeep);
  const head = rig.part({ name: 'softbox', position: [x, 1.58, z], rotation: [0.16, headingTo(x, z, 0.3, 0.2), 0] });
  head.box(0, -0.1, -0.02, 0.05, 0.12, 0.05, PALETTE.ink);
  head.box(0, 0, -0.17, 0.18, 0.18, 0.1, PALETTE.ink);
  head.box(0, 0, -0.06, 0.4, 0.32, 0.14, '#2F2824');
  head.box(0, 0, 0.06, 0.58, 0.44, 0.1, '#2F2824');
  head.box(0, 0, 0.115, 0.62, 0.48, 0.02, PALETTE.goldDeep);
  head.box(0, 0, 0.122, 0.54, 0.4, 0.012, '#FFF6E2', { outline: false });
  const glow = rig.part({ name: 'softGlow', parent: head, position: [0, 0, 0.14] });
  glow.quad(R.bulb, 0, 0, 0, 0.8, 0.62, { color: '#FFF1CF' });
  blockCircle(room, x, z, 0.3);
  return { head, glow };
}

/** Gazebo extras: deck seams, a round rug, corner flower pots, two hanging lanterns. */
function addGazeboDetail(S, rig, R) {
  const p = rig.root;
  for (let z = 0.9; z < 1.84; z += 0.16) p.boxMin(1.6, 0.05, z, 3.28, 0.0515, z + 0.012, '#DCCFB6', { outline: false });
  [[1.06, PALETTE.gold], [0.96, PALETTE.maroon], [0.62, '#8A2C38'], [0.3, PALETTE.gold]].forEach(([s, c], i) => {
    const hgt = 0.0025 + i * 0.0012; // each ring's top 1.2 mm above the last
    for (const ry of [0, Math.PI / 4]) p.box(2.44, 0.05 + hgt / 2, 1.36, s * 0.83, hgt, s * 0.83, c, { ry, outline: false });
  });
  for (const px of [1.68, 3.2]) {
    S.boxMin(px - 0.09, 0.05, 1.66, px + 0.09, 0.2, 1.82, PALETTE.maroon);
    S.boxMin(px - 0.105, 0.17, 1.645, px + 0.105, 0.21, 1.835, PALETTE.gold);
    bloom(S, px - 0.03, 0.26, 1.73, 'leaf', 0.9);
    bloom(S, px + 0.05, 0.3, 1.71, 'rose', 0.85);
    bloom(S, px - 0.02, 0.34, 1.76, 'lily', 0.8);
  }
  // post lanterns on little gold brackets (clear of the swinging sign)
  return [1.72, 3.16].map((lx, i) => {
    S.boxMin(lx - 0.015, 1.9, 0.99, lx + 0.015, 1.93, 1.14, PALETTE.gold);
    const l = rig.part({ name: `lantern${i}`, position: [lx, 1.9, 1.12] });
    l.box(0, -0.035, 0, 0.012, 0.07, 0.012, PALETTE.goldDeep, { outline: false });
    l.box(0, -0.085, 0, 0.1, 0.03, 0.1, PALETTE.gold);
    l.box(0, -0.175, 0, 0.13, 0.15, 0.13, PALETTE.cream);
    l.box(0, -0.175, 0, 0.14, 0.03, 0.14, PALETTE.maroon);
    l.box(0, -0.265, 0, 0.1, 0.03, 0.1, PALETTE.gold);
    l.quad(R.bulb, 0, -0.175, 0.075, 0.2, 0.2, { color: '#FFE6A6' });
    return l;
  });
}

/** Three little butterflies circling the flower arch. */
function addButterflies(rig) {
  const kinds = [[PALETTE.rose, '#F6D3D6'], [PALETTE.gold, '#F3DFA2'], [PALETTE.white, PALETTE.rose]];
  const homes = [[2.0, 1.75, 1.25, 0.32], [2.95, 1.45, 1.2, 0.26], [2.45, 2.15, 1.05, 0.38]];
  return homes.map(([x, y, z, r], i) => {
    const body = rig.part({ name: `fly${i}`, position: [x, y, z] });
    body.box(0, 0, 0, 0.016, 0.016, 0.06, PALETTE.ink, { outline: false });
    const wings = [-1, 1].map((s) => {
      const w = rig.part({ name: `flyWing${i}${s}`, parent: body, position: [0, 0, 0] });
      w.box(s * 0.034, 0, -0.008, 0.06, 0.004, 0.052, kinds[i][0], { outline: false });
      w.box(s * 0.03, 0.0005, 0.024, 0.042, 0.004, 0.034, kinds[i][1], { outline: false });
      return w;
    });
    return { body, wings, r, phase: i * 2.2, speed: 0.55 + i * 0.12 };
  });
}

/** By the entrance: a gear flight case with a coffee and a rolled script; script binders and a megaphone. */
function addEntranceProps(S, p, R, room) {
  const fx = -1.48;
  const fz = 3.62;
  const w = 0.56;
  const d = 0.36;
  const h = 0.42;
  S.boxMin(fx - w / 2, 0, fz - d / 2, fx + w / 2, h, fz + d / 2, '#2F2824');
  S.boxMin(fx - w / 2 - 0.006, h - 0.05, fz - d / 2 - 0.006, fx + w / 2 + 0.006, h - 0.03, fz + d / 2 + 0.006, '#CFC3AE');
  S.boxMin(fx - w / 2 - 0.006, 0.02, fz - d / 2 - 0.006, fx + w / 2 + 0.006, 0.04, fz + d / 2 + 0.006, '#CFC3AE');
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      S.box(fx + sx * (w / 2 - 0.02), h - 0.02, fz + sz * (d / 2 - 0.02), 0.06, 0.05, 0.06, PALETTE.gold);
      S.box(fx + sx * (w / 2 - 0.02), 0.025, fz + sz * (d / 2 - 0.02), 0.06, 0.05, 0.06, PALETTE.gold);
    }
    S.box(fx + sx * 0.14, h - 0.09, fz + d / 2 + 0.008, 0.06, 0.05, 0.016, PALETTE.goldDeep);
  }
  S.box(fx, h + 0.012, fz, 0.18, 0.024, 0.04, PALETTE.ink);
  p.quad(R.sparkle, fx - 0.12, 0.2, fz + d / 2 + 0.002, 0.16, 0.16);
  p.box(fx + 0.1, 0.2, fz + d / 2 + 0.001, 0.14, 0.09, 0.002, PALETTE.maroon, { outline: false });
  S.box(fx + 0.14, h + 0.06, fz - 0.06, 0.08, 0.1, 0.08, PALETTE.white);
  S.box(fx + 0.14, h + 0.1, fz - 0.06, 0.085, 0.014, 0.085, PALETTE.gold);
  S.box(fx + 0.14, h + 0.108, fz - 0.06, 0.06, 0.004, 0.06, '#6B4428');
  S.add(new THREE.CylinderGeometry(0.035, 0.035, 0.34, 10), PALETTE.paper, boxMatrix(fx - 0.1, h + 0.035, fz + 0.04, 1, 1, 1, 0, 0.3, Math.PI / 2));
  S.add(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 10), PALETTE.maroon, boxMatrix(fx - 0.1, h + 0.035, fz + 0.04, 1, 1, 1, 0, 0.3, Math.PI / 2));
  blockBox(room, fx - w / 2, fz - d / 2, fx + w / 2, fz + d / 2);
  // script binders (ring spines) and, beside them, a cream megaphone with a maroon band
  const bx = 1.5;
  const bz = 3.66;
  const cols = [PALETTE.maroon, PALETTE.gold, PALETTE.cream, '#7A4A2B'];
  cols.forEach((c, i) => {
    const ry = (i % 2 ? 0.08 : -0.06) + i * 0.02;
    S.box(bx, 0.035 + i * 0.07, bz, 0.36, 0.064, 0.28, c, ry);
    S.box(bx - 0.17, 0.035 + i * 0.07, bz, 0.035, 0.07, 0.29, i === 1 ? PALETTE.maroonDeep : PALETTE.goldDeep, ry);
    p.box(bx + 0.181, 0.035 + i * 0.07, bz, 0.002, 0.05, 0.24, PALETTE.paper, { ry, outline: false });
  });
  const mx = bx + 0.42;
  const mz = bz + 0.02;
  const ma = 0.25; // megaphone axis turned a little toward the camera
  S.add(new THREE.CylinderGeometry(0.06, 0.13, 0.32, 12), PALETTE.cream, boxMatrix(mx, 0.13, mz, 1, 1, 1, 0, ma, Math.PI / 2));
  S.add(new THREE.CylinderGeometry(0.095, 0.115, 0.05, 12), PALETTE.maroon, boxMatrix(mx - Math.cos(ma) * 0.08, 0.13, mz + Math.sin(ma) * 0.08, 1, 1, 1, 0, ma, Math.PI / 2));
  S.box(mx - 0.02, 0.05, mz + 0.06, 0.04, 0.1, 0.04, PALETTE.ink, ma);
  blockBox(room, bx - 0.2, bz - 0.17, mx + 0.18, bz + 0.17);
}

/** Gold corner trims and feet on the bundle cabinet. */
function addBundleTrim(S) {
  const cx = -2.36;
  const cz = 1.3;
  const w = 1.72;
  const d = 0.5;
  for (const sx of [-1, 1]) {
    S.boxMin(cx + sx * (w / 2 - 0.03) - 0.018, 0.08, cz + d / 2 - 0.03, cx + sx * (w / 2 - 0.03) + 0.018, 0.54, cz + d / 2 + 0.008, PALETTE.gold);
    S.box(cx + sx * (w / 2 - 0.08), 0.05, cz + d / 2 + 0.02, 0.1, 0.05, 0.05, PALETTE.goldDeep);
  }
  S.boxMin(cx - w / 2 + 0.06, 0.1, cz + d / 2 - 0.01, cx + w / 2 - 0.06, 0.12, cz + d / 2 + 0.01, PALETTE.goldDeep);
}

/** Script Studio interior. ctx is accepted for future options (unused). */
export async function buildInterior(ctx = {}) {
  await fontsReady();
  const room = createRoom({
    width: 7,
    depth: 8,
    wall: '#F5EAD6',
    wainscot: '#E6D2B0',
    trim: PALETTE.goldDeep,
    floor: 'planks',
    floorColor: '#BD8F5E',
    background: PALETTE.cream,
  });
  room.id = 'scripts';

  const atlas = createAtlas();
  const R = drawScriptsAtlas(atlas);
  const texture = atlas.texture();
  room.textures.push(texture);

  const S = new VoxelBuilder(); // static boxes in room space (baked with the shell)
  const rig = createRig(); // everything that moves, plus textured quads

  buildStage(S);
  buildCurtains(S);
  const books = BOOKS.map((b) => buildBook(rig, R, b));
  const bulbs = buildMarquee(S, rig, R);
  const spots = [buildSpotlight(S, rig, R, -1)];
  const chair = buildDirectorChair(S, rig, R);
  const cam = buildCamera(S, rig, R);
  const clapper = buildClapper(S, rig, R);
  const gifts = buildBundles(S, rig, R);
  const gazebo = buildGazebo(S, rig, R);
  const wallSparks = buildWallSparkles(rig, R);
  const air = buildFloatingQuill(rig, R);
  // detail pass (flat overlays live in the rig without outlines; solid props bake with S)
  addPlankDetail(rig.root);
  addCarpetDetail(rig.root);
  addStudioWall(rig.root);
  addFilmStrip(rig.root);
  addWallArt(S, rig.root, R);
  addFloorDressing(rig.root, R);
  addBundleTrim(S);
  addEntranceProps(S, rig.root, R, room);
  const ropes = addStanchions(S, rig, room);
  const foot = addFootlights(S, rig, R);
  const soft = addSoftbox(S, rig, R, room);
  const lanterns = addGazeboDetail(S, rig, R);
  const flies = addButterflies(rig);

  // red carpet from the door to the stage (kept below the station rings, which sit at y = 0.03)
  S.boxMin(-0.62, 0, STAGE_FRONT + 0.03, 0.62, 0.008, 3.25, PALETTE.gold);
  S.boxMin(-0.53, 0, STAGE_FRONT + 0.03, 0.53, 0.013, 3.16, PALETTE.maroon);
  for (const fz of [2.1, 0.75, -0.6]) rig.root.quad(R.fame, 0, 0.0145, fz, 0.42, 0.42, { rx: -Math.PI / 2, lit: true });
  buildFilmCans(S, 3.12, 3.44);
  room.place(plant({ size: 1.15 }), -3.02, 3.38);

  // soft contact shadows (unlit layer, no extra draw calls)
  floorShadow(rig, R.shadow, chair.x, chair.z, 0.95, 0.95);
  floorShadow(rig, R.shadow, cam.x, cam.z, 0.95, 0.95);
  floorShadow(rig, R.shadow, -3.0, -2.38, 0.7, 0.7);
  floorShadow(rig, R.shadow, -2.5, 0.38, 0.85, 0.65);
  floorShadow(rig, R.shadow, -2.36, 1.32, 2.2, 0.95);
  floorShadow(rig, R.shadow, 2.44, 1.32, 2.2, 1.6);
  floorShadow(rig, R.shadow, 3.12, 3.44, 0.9, 0.9);
  floorShadow(rig, R.shadow, -3.02, 3.38, 0.75, 0.75);
  floorShadow(rig, R.shadow, 0, STAGE_FRONT + 0.22, 6.6, 0.5);
  floorShadow(rig, R.shadow, 2.84, -0.8, 0.8, 0.8);
  for (const sx of [-0.86, 0.86]) floorShadow(rig, R.shadow, sx, -2.23, 0.36, 0.9);

  const staticMesh = S.mesh({ outline: true, px: 1.5 });
  staticMesh.name = 'studioStatic';
  room.group.add(staticMesh);
  const built = rig.build({ atlas, texture });
  room.group.add(built.mesh);

  // collisions for everything not placed with room.place()
  blockBox(room, -3.3, -4.0, 3.3, STAGE_FRONT + 0.03, 0.02);
  blockCircle(room, -3.0, -2.38, 0.28);
  blockCircle(room, chair.x, chair.z, 0.38);
  blockCircle(room, cam.x, cam.z, 0.38);
  blockBox(room, -2.77, 0.17, -2.23, 0.53);
  blockBox(room, -3.22, 1.03, -1.5, 1.57);
  blockBox(room, 1.58, 0.8, 3.3, 1.66);
  blockCircle(room, 3.12, 3.44, 0.32);

  for (const s of STATIONS) room.addStation({ ...s, look: { ...s.look }, line: { ...s.line } });
  // one reaction spring per station: 0 idle, 0.45 when Maya is near, 1 while its card is open
  const reactions = STATIONS.map((s) => ({ id: s.id, spring: createSpring(150, 13) }));
  const springOf = (id) => reactions.find((r) => r.id === id).spring;
  for (const bk of books) bk.spring = springOf(bk.b.id);
  const bundleSpring = springOf('scr-bundles');
  const consultSpring = springOf('scr-consult');

  room.bake();

  const animate = (dt, t, state) => {
    for (let i = 0; i < reactions.length; i++) stepSpring(reactions[i].spring, stationTarget(state, reactions[i].id), dt, 0.18);

    // Giant books: float on their clouds, breathe, and open with follow-through pages.
    for (let i = 0; i < books.length; i++) {
      const bk = books[i];
      const k = bk.spring.x;
      const open = Math.max(0, k);
      bk.cloud.move(0, Math.sin(t * 1.25 + i * 2.1) * 0.018, 0);
      bk.book.rot(0, 0, Math.sin(t * 0.9 + i * 1.7) * 0.006).size(1, 1 + Math.min(0, k) * 0.12 + Math.sin(t * 1.6 + i) * 0.004, 1);
      bk.cover.rot(0, -bk.b.open * open, 0);
      // The loose pages lag behind the cover, but never past it: when the book closes, the cover
      // pushes them shut ahead of it (otherwise it would swing through them and leave white pages
      // standing outside the closed cover until their springs caught up).
      const ps = bk.pageSprings;
      const p0 = stepSpring(ps[0], open * 0.62, dt);
      const p1 = stepSpring(ps[1], open * 0.34, dt);
      const limit0 = Math.max(0, open - 0.025), limit1 = Math.max(0, limit0 - 0.02);
      if (ps[0].x > limit0) { ps[0].x = limit0; ps[0].v = Math.min(ps[0].v, bk.spring.v); }
      if (ps[1].x > limit1) { ps[1].x = limit1; ps[1].v = Math.min(ps[1].v, bk.spring.v); }
      const a0 = Math.min(limit0, Math.max(0, Math.min(p0, limit0) + Math.sin(t * 9 + i) * 0.03 * open / bk.b.open));
      bk.pages[0].rot(0, -bk.b.open * a0, 0);
      bk.pages[1].rot(0, -bk.b.open * Math.max(0, Math.min(p1, limit1)), 0);
      for (let j = 0; j < bk.sparks.length; j++) {
        const p = frac(t * 0.45 + j / bk.sparks.length);
        const sc = clamp01(open * 1.6) * Math.sin(p * Math.PI);
        bk.sparks[j].move(Math.sin(t * 2 + j * 2) * 0.05, p * 0.75, 0).size(sc).rot(0, 0, t * 1.5 + j);
      }
    }

    // Marquee bulbs: a warm chase around the title.
    for (let i = 0; i < bulbs.length; i++) {
      const c = 0.5 + 0.5 * Math.cos((t * 1.6 - (i / bulbs.length) * 3) * Math.PI * 2);
      bulbs[i].size(0.72 + 0.48 * c * c * c * c);
    }
    for (let i = 0; i < wallSparks.length; i++) {
      const c = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.9);
      wallSparks[i].size(0.55 + 0.5 * c * c).rot(0, 0, Math.sin(t * 0.8 + i) * 0.25);
    }

    // Spotlights sway gently; the camera pans, its reels spin and REC blinks.
    for (let i = 0; i < spots.length; i++) spots[i].head.rot(Math.sin(t * 0.8 + spots[i].phase) * 0.025, Math.sin(t * 0.55 + spots[i].phase) * 0.06, 0);
    cam.head.rot(0, Math.sin(t * 0.45) * 0.2, 0);
    cam.reelA.rot(t * 2.4, 0, 0);
    cam.reelB.rot(t * 2.4 + 0.7, 0, 0);
    cam.rec.size(frac(t * 0.8) < 0.6 ? 1 : 0);

    // Clapperboard: rest open, wind up, snap shut with a bounce, slowly reopen.
    {
      const p = frac(t / 4.6);
      const OPEN = 0.5;
      let a = OPEN;
      let squash = 0;
      if (p < 0.5) a = OPEN + Math.sin(p * 30) * 0.015;
      else if (p < 0.58) a = OPEN + 0.2 * easeOut((p - 0.5) / 0.08);
      else if (p < 0.62) a = (OPEN + 0.2) * (1 - easeIn((p - 0.58) / 0.04));
      else if (p < 0.76) {
        const k = (p - 0.62) / 0.14;
        a = Math.abs(Math.sin(k * Math.PI * 2)) * 0.09 * (1 - k);
        squash = Math.sin(k * Math.PI) * (1 - k);
      } else if (p < 0.82) a = 0;
      else a = OPEN * easeInOut((p - 0.82) / 0.18);
      clapper.arm.rot(0, 0, a - OPEN);
      clapper.clap.size(1 + squash * 0.06, 1 - squash * 0.1, 1);
    }

    // A script page lifts in the draught; the floating quill scribbles.
    chair.flutter.rot(0, 0, Math.pow(Math.max(0, Math.sin(t * 0.9)), 3) * 0.45);
    air.page.move(0, Math.sin(t * 1.1) * 0.05, 0).rot(Math.sin(t * 0.7) * 0.05, 0, Math.sin(t * 0.9) * 0.04);
    air.quill.rot(0, 0, Math.sin(t * 9) * 0.12).move(Math.sin(t * 1.7) * 0.05, Math.abs(Math.sin(t * 9)) * 0.012, 0);
    for (let i = 0; i < air.twinkles.length; i++) air.twinkles[i].size(0.4 + 0.6 * Math.max(0, Math.sin(t * 2.4 + i * 2.2)));

    // Gift boxes take turns hopping; near Maya their lids pop and sparkles rise.
    const kb = bundleSpring.x;
    for (let i = 0; i < gifts.length; i++) {
      const gf = gifts[i];
      const pose = hop(frac(t / 3.2 - gf.phase), 0.07 + gf.s * 0.08, gf.pose);
      const pop = stepSpring(gf.spring, Math.max(0, kb), dt);
      gf.box.move(0, pose.y, 0).size(pose.sx, pose.sy, pose.sx);
      gf.lid.move(0, pose.lag + pop * gf.s * 0.6, 0).rot(-pop * 0.28, 0, Math.sin(t * 7 + i) * 0.05 * pop);
      for (let j = 0; j < gf.sparks.length; j++) {
        const p = frac(t * 0.6 + j * 0.5 + i * 0.3);
        gf.sparks[j].move(0, p * 0.55, 0).size(clamp01(pop * 1.5) * Math.sin(p * Math.PI)).rot(0, 0, t * 2 + j);
      }
    }

    // Consultation arch: the sign swings (harder when Maya arrives), flowers sway, tea steams.
    const kc = Math.max(0, consultSpring.x);
    const kick = stepSpring(gazebo.spring, kc, dt);
    gazebo.sign.rot(0, 0, Math.sin(t * 1.4) * 0.035 + (kick - kc) * 0.5);
    for (let i = 0; i < gazebo.clusters.length; i++) {
      gazebo.clusters[i].rot(Math.sin(t * 1.1 + i * 1.3) * 0.08, 0, Math.sin(t * 1.3 + i * 2) * 0.1).size(1 + kc * 0.12 * Math.max(0, Math.sin(t * 6 + i)));
    }
    for (let i = 0; i < gazebo.steam.length; i++) {
      const p = frac(t * 0.42 + i / gazebo.steam.length);
      gazebo.steam[i].move(Math.sin(p * 6 + i) * 0.03, p * 0.42, 0).size((0.5 + p) * Math.sin(p * Math.PI) * (1 + kc * 0.5));
    }

    // Detail life: velvet ropes sway, footlights twinkle, lanterns swing, the softbox breathes,
    // and three butterflies loop around the flower arch.
    for (let i = 0; i < ropes.length; i++) ropes[i].rot(0, 0, Math.sin(t * 1.2 + i * 2.4) * 0.07);
    for (let i = 0; i < foot.length; i++) {
      const c = 0.5 + 0.5 * Math.sin(t * 2.1 - i * 0.8);
      foot[i].size(0.8 + 0.35 * c * c);
    }
    for (let i = 0; i < lanterns.length; i++) lanterns[i].rot(Math.sin(t * 1.05 + i * 1.6) * 0.06, 0, Math.sin(t * 1.3 + i) * 0.09 + (kick - kc) * 0.3);
    soft.glow.size(1 + Math.sin(t * 1.7) * 0.04);
    for (let i = 0; i < flies.length; i++) {
      const f = flies[i];
      const a = t * f.speed + f.phase;
      const dx = Math.cos(a) * f.r;
      const dz = Math.sin(a) * f.r * 0.55;
      f.body.move(dx, Math.sin(a * 2.3) * 0.08 + Math.sin(t * 6 + i) * 0.015, dz).rot(0, Math.atan2(-Math.sin(a), Math.cos(a) * 0.55), 0);
      const flap = Math.sin(t * 13 + i * 1.3) * 0.85 - 0.2;
      f.wings[0].rot(0, 0, flap);
      f.wings[1].rot(0, 0, -flap);
    }
  };
  room.animators.push(animate);

  chainDispose(room, () => built.dispose());
  return room;
}
