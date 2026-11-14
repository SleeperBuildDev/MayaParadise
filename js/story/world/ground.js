// Painted ground for the open world (story mode). The land is a town drawn on a book's pages: these textures
// paint grass, soil, earth, paving, sand, mud and brick over the paper, while the paper's own rules, margins
// and creases still show through. Everything is procedural, original, soft and hand-painted (toon friendly).
// The game uses style C, "sketchbook yards": flat toon lawns and yards with a soft pencil line round them, a
// strip of bare ruled paper along every street (so the page still reads), the Blank Page left white.
//
// Cost: no new geometry and no extra draw calls. One shared material for every chunk's ground mesh:
// one texture array (8 tiling 512 px layers, mipmapped; not made at all in the simple shader), one 256 px
// tiling blob mask and one "zone" map of the land at 2 cells a metre (distance to roads, to buildings and to
// the open edge of the paper), built once the roads exist and patched where a gate opens.
//
//   createStoryGround({ net, edges, isOpen, low }) -> null (?ground=off) | { material(), tag(geometry, kinds),
//        roadsChanged(x0, z0, x1, z1), update(), info(), dispose() }        stream.js wires this in
//   URL: ?ground=off (the plain paper, as before) | simple (the cheap shader) | full | A | B | C (a style)
//   groundMaterial(base, option, { edges, isOpen, simple })  a painted clone of `base` (the vertex-coloured toon ground)
//   groundCanvas(layer) -> canvas, groundTexture(layer) -> CanvasTexture   one tiling layer on its own
//   LAYERS, OPTIONS, AVG                               the layer names, each option's district styles, layer averages
//
// The ground mesh needs a per-vertex `gKind` (build.js writes it while painting): 0 bare paper (painted over),
// 1 the paper's own markings and soft shadows (painted over, still showing), 2 a decal (kept as drawn).
// A district may tune its ground with `ground: { base: 'meadow', road: 'paper', roadW: 2, ... }` on its REGION.
import * as THREE from '../../game/three.js';
import { REGIONS, ITEMS, EXTENT, GROUND } from './region.js';
import { PAPER, itemObstacles } from './build.js';

const S = 512; // layer size (px)
export const LAYERS = ['grass', 'meadow', 'soil', 'dirt', 'paving', 'sand', 'mud', 'brick'];
const L = Object.fromEntries(LAYERS.map((k, i) => [k, i]));
/** metres one tile of each layer covers */
const TILE = { grass: 6, meadow: 6, soil: 4.5, dirt: 7, paving: 5, sand: 7, mud: 7, brick: 3.6 };
const PAPERLAYER = -2; // "this zone shows bare paper" (a walkway of paper in option C)

// ---------------------------------------------------------------------------------
// Painting helpers (seeded, wrap-around so every layer tiles)
// ---------------------------------------------------------------------------------
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function canvas(size = S) {
  const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(size, size) : Object.assign(document.createElement('canvas'), { width: size, height: size });
  return c;
}
/** draw(x, y) at (x, y) and at its wrapped copies near the tile's sides */
function wrap(x, y, r, draw) {
  for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
    const px = x + dx, py = y + dy;
    if (px + r < 0 || px - r > S || py + r < 0 || py - r > S) continue;
    draw(px, py);
  }
}
function blob(g, x, y, r, col, a) {
  wrap(x, y, r, (px, py) => {
    const gr = g.createRadialGradient(px, py, 0, px, py, r);
    gr.addColorStop(0, col); gr.addColorStop(1, col.length === 7 ? col + '00' : 'rgba(0,0,0,0)');
    g.globalAlpha = a; g.fillStyle = gr; g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill();
  });
  g.globalAlpha = 1;
}
function ellipse(g, x, y, rx, ry, rot, col, a = 1) {
  wrap(x, y, Math.max(rx, ry), (px, py) => { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.ellipse(px, py, rx, ry, rot, 0, Math.PI * 2); g.fill(); });
  g.globalAlpha = 1;
}
function tuft(g, x, y, h, col, r, a = 1) {
  wrap(x, y, h + 4, (px, py) => {
    g.globalAlpha = a; g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = 1.6 + r() * 1.2;
    const n = 2 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const sx = px + (k - n / 2) * 1.8, lean = (r() - 0.5) * h * 0.9;
      g.beginPath(); g.moveTo(sx, py); g.quadraticCurveTo(sx + lean * 0.2, py - h * 0.6, sx + lean, py - h * (0.8 + r() * 0.4)); g.stroke();
    }
  });
  g.globalAlpha = 1;
}
function base(g, col) { g.fillStyle = col; g.fillRect(0, 0, S, S); }
/** soft mottling: many faint big blobs in the given colours */
function mottle(g, r, cols, n, rMin, rMax, a) { for (let i = 0; i < n; i++) blob(g, r() * S, r() * S, rMin + r() * (rMax - rMin), cols[i % cols.length], a); }
function specks(g, r, n, cols, sMin, sMax, a = 1) {
  for (let i = 0; i < n; i++) { const s = sMin + r() * (sMax - sMin); ellipse(g, r() * S, r() * S, s, s * (0.55 + r() * 0.4), r() * 3, cols[i % cols.length], a); }
}
function pebble(g, x, y, s, col, hi, sh) {
  ellipse(g, x + 1, y + 1.5, s, s * 0.7, 0, sh, 0.55);
  ellipse(g, x, y, s, s * 0.7, 0, col);
  ellipse(g, x - s * 0.25, y - s * 0.25, s * 0.45, s * 0.28, 0, hi, 0.8);
}
function roundRect(g, x, y, w, h, rad, fill) {
  wrap(x + w / 2, y + h / 2, Math.max(w, h), (cx, cy) => { g.fillStyle = fill; g.beginPath(); g.roundRect(cx - w / 2, cy - h / 2, w, h, rad); g.fill(); });
}

const PAINTERS = {
  grass(g, r) {
    base(g, '#8DB868');
    mottle(g, r, ['#79A85A', '#A3C878', '#6F9E55', '#B4CF82'], 60, 60, 150, 0.32);
    for (let i = 0; i < 850; i++) tuft(g, r() * S, r() * S, 9 + r() * 9, r() < 0.62 ? (r() < 0.5 ? '#5F8F4A' : '#6E9E55') : (r() < 0.6 ? '#A9CC7E' : '#C2D98E'), r, 0.85);
    for (let i = 0; i < 28; i++) { const x = r() * S, y = r() * S, c = ['#FFFDF6', '#F4D35E', '#F2B8C0'][i % 3]; for (let k = 0; k < 3; k++) ellipse(g, x + (r() - 0.5) * 10, y + (r() - 0.5) * 8, 2.2, 2.2, 0, c); }
  },
  meadow(g, r) {
    base(g, '#7FB05E');
    mottle(g, r, ['#6A9E50', '#97C46F', '#5E9148', '#A9CF7E'], 60, 60, 150, 0.34);
    for (let i = 0; i < 26; i++) { const x = r() * S, y = r() * S; for (let k = 0; k < 9; k++) ellipse(g, x + (r() - 0.5) * 26, y + (r() - 0.5) * 20, 4, 3.4, r() * 3, '#93C27A', 0.8); } // clover
    for (let i = 0; i < 1100; i++) tuft(g, r() * S, r() * S, 10 + r() * 11, r() < 0.6 ? (r() < 0.5 ? '#538744' : '#64974F') : (r() < 0.6 ? '#9FCB75' : '#BEDB8A'), r, 0.85);
    for (let i = 0; i < 60; i++) { const x = r() * S, y = r() * S, c = ['#FFFDF6', '#F4D35E', '#E8A0A8', '#B9A7E0'][i % 4]; for (let k = 0; k < 4; k++) ellipse(g, x + (r() - 0.5) * 12, y + (r() - 0.5) * 10, 2.6, 2.6, 0, c); }
  },
  soil(g, r) {
    base(g, '#8C6A4B');
    mottle(g, r, ['#765639', '#9E7A57', '#6E5036'], 60, 30, 90, 0.3);
    // dug rows (beds)
    for (let y = 16; y < S; y += 64) {
      for (let x = 0; x < S; x += 6) { const w = Math.sin((x + y) * 0.05) * 2; ellipse(g, x, y + w, 7, 5, 0, '#6A4C33', 0.35); ellipse(g, x, y + 18 + w, 7, 5, 0, '#A88563', 0.3); }
    }
    specks(g, r, 1300, ['#5E432D', '#A7835F', '#7A5A3E', '#B69270'], 1, 3);
    for (let i = 0; i < 40; i++) pebble(g, r() * S, r() * S, 2.5 + r() * 2.5, '#B9A48C', '#D8C8B2', '#5E432D');
  },
  dirt(g, r) {
    base(g, '#C9A77C');
    mottle(g, r, ['#B8946A', '#D8BB91', '#BF9C71', '#E0C79F'], 80, 40, 130, 0.28);
    for (let i = 0; i < 30; i++) ellipse(g, r() * S, r() * S, 40 + r() * 70, 5 + r() * 6, (r() - 0.5) * 0.4, '#DCC198', 0.35); // worn streaks
    specks(g, r, 900, ['#A9875F', '#D9BE95', '#9C7B55'], 1, 2.6);
    for (let i = 0; i < 110; i++) pebble(g, r() * S, r() * S, 2 + r() * 3.5, ['#B9AD9A', '#A99880', '#CDBFA6'][i % 3], '#EDE3D0', '#7E6448');
    for (let i = 0; i < 70; i++) tuft(g, r() * S, r() * S, 4 + r() * 5, r() < 0.5 ? '#8DA765' : '#A3B676', r, 0.7);
  },
  paving(g, r) {
    base(g, '#A79B85'); // grout
    let y = 0;
    const rows = [];
    while (y < S) { const h = Math.min(S - y, 50 + Math.floor(r() * 34)); rows.push([y, S - y - h < 40 ? S - y : h]); y += rows[rows.length - 1][1]; }
    const cols = ['#D6CDB9', '#CCC2AC', '#DED6C4', '#C6BBA3', '#D2C6AE', '#E2DACA'];
    for (const [ry, rh] of rows) {
      let x = r() * S;
      const end = x + S;
      while (x < end - 30) {
        const w = Math.min(end - x, 60 + r() * 70);
        const ww = end - x - w < 40 ? end - x : w;
        const cx = x + ww / 2, cy = ry + rh / 2, c = cols[Math.floor(r() * cols.length)];
        roundRect(g, (cx % S) - ww / 2 + 2.5, cy - rh / 2 + 2.5, ww - 5, rh - 5, 7, '#8F8370');
        roundRect(g, (cx % S) - ww / 2 + 2, cy - rh / 2 + 2, ww - 5.5, rh - 6, 7, c);
        roundRect(g, (cx % S) - ww / 2 + 6, cy - rh / 2 + 4, ww - 16, 3, 2, '#F1EBDD');
        for (let k = 0; k < 4; k++) ellipse(g, (cx % S) + (r() - 0.5) * (ww - 16), cy + (r() - 0.5) * (rh - 14), 1.5, 1.2, 0, '#B3A78F', 0.8);
        x += ww;
      }
    }
    mottle(g, r, ['#8F8774', '#FFFFFF'], 16, 40, 100, 0.08);
    for (let i = 0; i < 40; i++) tuft(g, r() * S, r() * S, 4 + r() * 4, '#7FA05E', r, 0.75); // moss in the joints
  },
  sand(g, r) {
    base(g, '#EAD8AC');
    mottle(g, r, ['#E0CB98', '#F2E5C4', '#DCC28E'], 50, 50, 130, 0.3);
    for (let y = 10; y < S; y += 22 + r() * 10) {
      const ph = r() * 6, amp = 3 + r() * 3, col = r() < 0.5 ? '#D7BF8B' : '#F5EAD0';
      g.strokeStyle = col; g.lineWidth = 2.4; g.globalAlpha = 0.55; g.beginPath();
      for (let x = -4; x <= S + 4; x += 4) { const yy = y + Math.sin(x / S * Math.PI * 2 * 4 + ph) * amp; x < 0 ? g.moveTo(x, yy) : g.lineTo(x, yy); }
      g.stroke(); g.globalAlpha = 1;
    }
    specks(g, r, 700, ['#C9AE7A', '#FFF7E4', '#BFA06A'], 0.8, 1.8);
    for (let i = 0; i < 16; i++) { const x = r() * S, y = r() * S; ellipse(g, x, y, 4, 3, r() * 3, '#FFF8EC'); ellipse(g, x + 1, y + 1, 2, 1.2, 0, '#E9B9A6'); } // shells
  },
  mud(g, r) {
    base(g, '#806549');
    mottle(g, r, ['#6B5139', '#937659', '#5E4733'], 70, 40, 120, 0.32);
    for (let i = 0; i < 4; i++) { // puddles with a sky glint
      const x = (i % 2) * S / 2 + r() * S / 2, y = Math.floor(i / 2) * S / 2 + r() * S / 2, w = 34 + r() * 50, h = 14 + r() * 16;
      ellipse(g, x, y, w + 4, h + 3, 0, '#5A4431', 0.6); ellipse(g, x, y, w, h, 0, '#8E9C9E', 0.85);
      ellipse(g, x - w * 0.3, y - h * 0.3, w * 0.4, h * 0.2, 0, '#C9D9DE', 0.8);
    }
    for (let i = 0; i < 50; i++) ellipse(g, r() * S, r() * S, 12 + r() * 30, 2 + r() * 3, (r() - 0.5) * 0.5, '#A08A70', 0.35); // wet sheen
    specks(g, r, 600, ['#55402E', '#9A7F62'], 1, 2.5);
    for (let i = 0; i < 25; i++) tuft(g, r() * S, r() * S, 6 + r() * 6, '#6F8A4E', r, 0.8);
  },
  brick(g, r) {
    base(g, '#D9C6A3'); // mortar
    const bw = 40, bh = 20; // brick, running bond (3.6 m tile: 0.28 x 0.14 m)
    const cols = ['#A9563E', '#B5643C', '#9A4A35', '#C07A55', '#AE5D43', '#B86E4C'];
    for (let row = 0; row < S / bh; row++) {
      const off = (row % 2) * bw / 2;
      for (let k = -1; k < S / bw + 1; k++) {
        const x = k * bw + off + 2, y = row * bh + 2, c = cols[Math.floor(r() * cols.length)];
        roundRect(g, x, y, bw - 4, bh - 4, 3, c);
        roundRect(g, x + 2, y + 1, bw - 10, 2.4, 1, '#D99A7A');
      }
    }
    mottle(g, r, ['#E8D5B4', '#6E3A2A'], 30, 40, 110, 0.12); // wear
    for (let i = 0; i < 30; i++) tuft(g, r() * S, r() * S, 4 + r() * 3, '#7FA05E', r, 0.7);
  },
};

const canvasCache = new Map();
/** One tiling layer as a canvas (512 px). */
export function groundCanvas(layer) {
  if (canvasCache.has(layer)) return canvasCache.get(layer);
  const c = canvas(S), g = c.getContext('2d');
  PAINTERS[layer](g, rng(1000 + L[layer] * 7919));
  canvasCache.set(layer, c);
  return c;
}
/** One tiling layer as a CanvasTexture (sRGB, repeat, mipmapped): for a single-district material. */
export function groundTexture(layer) {
  const t = new THREE.CanvasTexture(groundCanvas(layer));
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

/** Each layer's average colour (linear RGB): the flat toon fill, and the whole of the simple shader (so it never
 * paints the layers). Measured from groundCanvas() (dev/ground.html?swatch=1 prints a fresh table). */
export const AVG = {
  grass: [0.2681, 0.4652, 0.1412], meadow: [0.2273, 0.4302, 0.1246], soil: [0.2527, 0.1403, 0.0691], dirt: [0.5894, 0.4038, 0.2172],
  paving: [0.6137, 0.5535, 0.4355], sand: [0.8029, 0.663, 0.3943], mud: [0.2019, 0.1286, 0.0732], brick: [0.5107, 0.2521, 0.1478],
};
/** Average linear colour of a painted layer (dev: refresh AVG with it). */
export function layerAverage(layer) {
  const d = groundCanvas(layer).getContext('2d').getImageData(0, 0, S, S).data, lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lut = new Float32Array(256).map((_, i) => lin(i));
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < d.length; i += 4) { r += lut[d[i]]; g += lut[d[i + 1]]; b += lut[d[i + 2]]; }
  const n = d.length / 4;
  return [r / n, g / n, b / n].map((v) => Math.round(v * 1e4) / 1e4);
}

// ---------------------------------------------------------------------------------
// Shared textures: the layer array, the blob mask, the zone map
// ---------------------------------------------------------------------------------
let shared = null;
function layerArray() {
  const data = new Uint8Array(S * S * 4 * LAYERS.length);
  LAYERS.forEach((k, i) => data.set(groundCanvas(k).getContext('2d').getImageData(0, 0, S, S).data, i * S * S * 4));
  const t = new THREE.DataArrayTexture(data, S, S, LAYERS.length);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.needsUpdate = true;
  // (phone memory: once the GPU has it, the 8 MB copy and the painted canvases can go)
  t.onUpdate = () => { t.image.data = null; };
  canvasCache.clear();
  return t;
}
/** Tiling value-noise fbm (periodic lattice), four independent channels. */
function blobMask(size = 256) {
  const data = new Uint8Array(size * size * 4);
  for (let ch = 0; ch < 4; ch++) {
    const r = rng(77 + ch * 131), f = new Float32Array(size * size);
    const octaves = ch === 3 ? [16, 32, 64] : [3 + ch, 6 + ch * 2, 12 + ch * 4, 32];
    let amp = 1;
    for (const P of octaves) {
      const lat = new Float32Array(P * P).map(() => r());
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const fx = x / size * P, fy = y / size * P, ix = Math.floor(fx), iy = Math.floor(fy);
        let tx = fx - ix, ty = fy - iy; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
        const v = (a, b) => lat[(b % P) * P + (a % P)];
        const top = v(ix, iy) + (v(ix + 1, iy) - v(ix, iy)) * tx, bot = v(ix, iy + 1) + (v(ix + 1, iy + 1) - v(ix, iy + 1)) * tx;
        f[y * size + x] += (top + (bot - top) * ty) * amp;
      }
      amp *= 0.5;
    }
    let lo = Infinity, hi = -Infinity;
    for (const v of f) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    for (let i = 0; i < f.length; i++) data[i * 4 + ch] = Math.round((f[i] - lo) / (hi - lo) * 255);
  }
  const t = new THREE.DataTexture(data, size, size);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}
/** Two-pass chamfer distance (metres) from every seed cell (seed[i] = 1), over a W x H block. */
function distance(seed, W, H, cell) {
  const INF = 1e6, d = new Float32Array(W * H);
  for (let i = 0; i < d.length; i++) d[i] = seed[i] ? 0 : INF;
  const a = cell, b = cell * Math.SQRT2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; let v = d[i];
    if (x > 0) v = Math.min(v, d[i - 1] + a);
    if (y > 0) { v = Math.min(v, d[i - W] + a); if (x > 0) v = Math.min(v, d[i - W - 1] + b); if (x < W - 1) v = Math.min(v, d[i - W + 1] + b); }
    d[i] = v;
  }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
    const i = y * W + x; let v = d[i];
    if (x < W - 1) v = Math.min(v, d[i + 1] + a);
    if (y < H - 1) { v = Math.min(v, d[i + W] + a); if (x < W - 1) v = Math.min(v, d[i + W + 1] + b); if (x > 0) v = Math.min(v, d[i + W - 1] + b); }
    d[i] = v;
  }
  return d;
}
// The zone map: RES cells a metre over EXTENT. R = metres to a road's edge (/16), G = to a building (/16),
// B = to the paper's open edge (/24). Only the roads the game draws count (a hidden gated road is not there
// until it opens: no strip of paper may give it away).
const RES = 2, ZR = 16, ZB = 16, ZE = 24;
function zoneGrid() {
  const x0 = EXTENT.x0 - 4, z0 = EXTENT.z0 - 4, W = Math.ceil((EXTENT.x1 - EXTENT.x0 + 8) * RES), H = Math.ceil((EXTENT.z1 - EXTENT.z0 + 8) * RES);
  return { x0, z0, W, H, cell: 1 / RES };
}
const roadShown = (e, isOpen) => !(e.gate && !isOpen(e) && e.look === 'hidden');
/** Seeds (1) in the block i0..i1 x j0..j1 (cells, exclusive ends) where a drawn road is. */
function roadSeeds(Z, edges, isOpen, i0, j0, i1, j1) {
  const bw = i1 - i0, seed = new Uint8Array(bw * (j1 - j0)), c = Z.cell;
  const bx0 = Z.x0 + i0 * c, bz0 = Z.z0 + j0 * c, bx1 = Z.x0 + i1 * c, bz1 = Z.z0 + j1 * c;
  for (const e of edges) {
    if (!roadShown(e, isOpen)) continue;
    const half = e.style === 'ribbon' || e.style === 'deck' ? (e.deck || 4.2) / 2 : 1.2; // ROAD.width / 2
    if (e.box && (e.box.maxX + half < bx0 || e.box.minX - half > bx1 || e.box.maxZ + half < bz0 || e.box.minZ - half > bz1)) continue;
    for (let s = 0; s + 1 < e.n; s++) {
      const ax = e.xs[s], az = e.zs[s], bx = e.xs[s + 1], bz = e.zs[s + 1];
      const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1;
      const ia = Math.max(i0, Math.floor((Math.min(ax, bx) - half - Z.x0) / c)), ib = Math.min(i1 - 1, Math.ceil((Math.max(ax, bx) + half - Z.x0) / c));
      const ja = Math.max(j0, Math.floor((Math.min(az, bz) - half - Z.z0) / c)), jb = Math.min(j1 - 1, Math.ceil((Math.max(az, bz) + half - Z.z0) / c));
      for (let j = ja; j <= jb; j++) {
        const z = Z.z0 + (j + 0.5) * c;
        for (let i = ia; i <= ib; i++) {
          const x = Z.x0 + (i + 0.5) * c;
          const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2));
          const px = ax + dx * t - x, pz = az + dz * t - z;
          if (px * px + pz * pz <= half * half) seed[(j - j0) * bw + (i - i0)] = 1;
        }
      }
    }
  }
  return seed;
}
function zoneMap(edges, isOpen) {
  const Z = zoneGrid(), { x0, z0, W, H, cell } = Z;
  const bld = new Uint8Array(W * H), voidc = new Uint8Array(W * H).fill(1);
  const fill = (arr, ax, az, bx, bz, v) => {
    const ia = Math.max(0, Math.floor((ax - x0) / cell)), ib = Math.min(W - 1, Math.ceil((bx - x0) / cell) - 1);
    const ja = Math.max(0, Math.floor((az - z0) / cell)), jb = Math.min(H - 1, Math.ceil((bz - z0) / cell) - 1);
    for (let j = ja; j <= jb; j++) arr.fill(v, j * W + ia, j * W + ib + 1);
  };
  // buildings and big props: their keep-out boxes (and big round things); benches and signs do not count
  for (const it of ITEMS) {
    let obs = [];
    try { obs = itemObstacles(it); } catch { /* unknown kind */ }
    for (const o of obs) {
      if (o.type === 'box') { if ((o.maxX - o.minX) * (o.maxZ - o.minZ) >= 1.5) fill(bld, o.minX, o.minZ, o.maxX, o.maxZ, 1); }
      else if (o.r >= 0.9) {
        for (let j = Math.floor((o.z - o.r - z0) / cell); j <= Math.ceil((o.z + o.r - z0) / cell); j++) for (let i = Math.floor((o.x - o.r - x0) / cell); i <= Math.ceil((o.x + o.r - x0) / cell); i++) {
          if (i < 0 || j < 0 || i >= W || j >= H) continue;
          const x = x0 + (i + 0.5) * cell, z = z0 + (j + 0.5) * cell;
          if ((x - o.x) ** 2 + (z - o.z) ** 2 <= o.r * o.r) bld[j * W + i] = 1;
        }
      }
    }
  }
  // no paper (the cloud-stream, the holes, beyond the land): its edge is the "water's edge". Rects never
  // overlap and a hole lies inside its own sheet, so: paper, then the holes, then the jetties
  for (const r of REGIONS) fill(voidc, ...r.rect, 0);
  for (const r of REGIONS) for (const h of r.holes || []) fill(voidc, ...h, 1);
  for (const r of REGIONS) for (const w of r.walk || []) fill(voidc, ...w, 0);
  const dr = distance(roadSeeds(Z, edges, isOpen, 0, 0, W, H), W, H, cell), db = distance(bld, W, H, cell), dv = distance(voidc, W, H, cell);
  const data = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    data[i * 4] = Math.min(255, Math.round(dr[i] / ZR * 255));
    data[i * 4 + 1] = Math.min(255, Math.round(db[i] / ZB * 255));
    data[i * 4 + 2] = Math.min(255, Math.round(dv[i] / ZE * 255));
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, W, H);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const at = (x, z) => { const k = (Math.floor((z - z0) / cell) * W + Math.floor((x - x0) / cell)) * 4; return { road: data[k] / 255 * ZR, bld: data[k + 1] / 255 * ZB, edge: data[k + 2] / 255 * ZE }; };
  /** Roads changed in the box (a gate opened or closed): redo the road distance over it (and ZR round it). */
  function patchRoads(bx0, bz0, bx1, bz1) {
    const pad = ZR + 2, c = cell;
    const ii0 = Math.max(0, Math.floor((bx0 - pad - x0) / c)), jj0 = Math.max(0, Math.floor((bz0 - pad - z0) / c));
    const ii1 = Math.min(W, Math.ceil((bx1 + pad - x0) / c)), jj1 = Math.min(H, Math.ceil((bz1 + pad - z0) / c));
    // the block it is computed over reaches ZR further still (so every seed within ZR of a written cell is in it)
    const i0 = Math.max(0, ii0 - ZR * RES), j0 = Math.max(0, jj0 - ZR * RES), i1 = Math.min(W, ii1 + ZR * RES), j1 = Math.min(H, jj1 + ZR * RES);
    const bw = i1 - i0, bh = j1 - j0;
    const d = distance(roadSeeds(Z, edges, isOpen, i0, j0, i1, j1), bw, bh, c);
    for (let j = jj0; j < jj1; j++) for (let i = ii0; i < ii1; i++) data[(j * W + i) * 4] = Math.min(255, Math.round(d[(j - j0) * bw + (i - i0)] / ZR * 255));
    tex.needsUpdate = true;
  }
  /** Lazy towns: a town's buildings arrived over the box: redo the building distance there (and ZB round it). */
  function patchBuildings(bx0, bz0, bx1, bz1) {
    const pad = ZB + 2, c = cell;
    const ii0 = Math.max(0, Math.floor((bx0 - pad - x0) / c)), jj0 = Math.max(0, Math.floor((bz0 - pad - z0) / c));
    const ii1 = Math.min(W, Math.ceil((bx1 + pad - x0) / c)), jj1 = Math.min(H, Math.ceil((bz1 + pad - z0) / c));
    const i0 = Math.max(0, ii0 - ZB * RES), j0 = Math.max(0, jj0 - ZB * RES), i1 = Math.min(W, ii1 + ZB * RES), j1 = Math.min(H, jj1 + ZB * RES);
    const bw = i1 - i0, bh = j1 - j0, seed = new Uint8Array(bw * bh);
    const ax = x0 + i0 * c, az = z0 + j0 * c, cx = x0 + i1 * c, cz = z0 + j1 * c;
    const put = (a, b, cc, d) => {
      const ia = Math.max(0, Math.floor((a - ax) / c)), ib = Math.min(bw - 1, Math.ceil((cc - ax) / c) - 1);
      const ja = Math.max(0, Math.floor((b - az) / c)), jb = Math.min(bh - 1, Math.ceil((d - az) / c) - 1);
      for (let j = ja; j <= jb; j++) if (ib >= ia) seed.fill(1, j * bw + ia, j * bw + ib + 1);
    };
    for (const it of ITEMS) {
      if (it.x < ax - 30 || it.x > cx + 30 || it.z < az - 30 || it.z > cz + 30) continue;
      let obs = [];
      try { obs = itemObstacles(it); } catch { /* unknown kind */ }
      for (const o of obs) {
        if (o.type === 'box') { if ((o.maxX - o.minX) * (o.maxZ - o.minZ) >= 1.5) put(o.minX, o.minZ, o.maxX, o.maxZ); }
        else if (o.r >= 0.9) {
          for (let j = Math.floor((o.z - o.r - az) / c); j <= Math.ceil((o.z + o.r - az) / c); j++) for (let i = Math.floor((o.x - o.r - ax) / c); i <= Math.ceil((o.x + o.r - ax) / c); i++) {
            if (i < 0 || j < 0 || i >= bw || j >= bh) continue;
            const x = ax + (i + 0.5) * c, z = az + (j + 0.5) * c;
            if ((x - o.x) ** 2 + (z - o.z) ** 2 <= o.r * o.r) seed[j * bw + i] = 1;
          }
        }
      }
    }
    const d = distance(seed, bw, bh, c);
    for (let j = jj0; j < jj1; j++) for (let i = ii0; i < ii1; i++) data[(j * W + i) * 4 + 1] = Math.min(255, Math.round(d[(j - j0) * bw + (i - i0)] / ZB * 255));
    tex.needsUpdate = true;
  }
  return { tex, box: new THREE.Vector4(x0, z0, 1 / (W * cell), 1 / (H * cell)), at, patchRoads, patchBuildings, W, H, bytes: data.length };
}
/** Debug: what the zone map says at (x, z) (metres to a road, a building, the paper's open edge). */
export function zoneAt(x, z) { return shared?.zone ? shared.zone.at(x, z) : null; }

// ---------------------------------------------------------------------------------
// The options: how each district paints its ground
//   base       the main ground layer;  cover 0..1: how much of the district it covers (1 = all)
//   alt/altAmt patches of a second layer (lawn in the earth, beds in the grass)
//   road/roadW a band of a layer (or bare paper) along roads, metres from the road's edge
//   bld/bldW   round buildings and big props;   edge/edgeW at the open edge of the paper (water, the stream)
//   rim        metres of bare paper kept at the district's own rim;  lines: how strongly the paper's rules show
//   wash       1 = watercolour (thin, paper shows through, darker dried rim);  ink: a pencil line round painted shapes
//   flat       0..1 towards the layer's flat average colour (a toon fill)
// A REGION's own `ground: { ... }` (layer names as strings: 'grass', 'paper', 'none') overrides its option's style.
// ---------------------------------------------------------------------------------
const P = PAPERLAYER;
const style = (o) => ({ base: L.grass, cover: 1, alt: -1, altAmt: 0, road: -1, roadW: 0, bld: -1, bldW: 0, edge: -1, edgeW: 0, rim: 0, lines: 0.3, wash: 0, ink: 0, flat: 0, ...o });
export const OPTIONS = {
  // A) Painted on paper: mostly paper; pale watercolour washes of lawn and earth, painted dirt paths by the roads
  A: {
    exercise: style({ base: L.grass, cover: 0.42, alt: L.dirt, altAmt: 0.22, road: L.dirt, roadW: 0.8, bld: L.dirt, bldW: 0.6, lines: 1, wash: 1, flat: 0.6 }),
    envelope: style({ base: L.grass, cover: 0.38, alt: L.dirt, altAmt: 0.3, road: L.dirt, roadW: 0.8, lines: 1, wash: 1, flat: 0.6 }),
    market: style({ base: L.dirt, cover: 0.42, alt: L.grass, altAmt: 0.35, road: L.dirt, roadW: 0.9, bld: L.sand, bldW: 0.8, edge: L.sand, edgeW: 3, lines: 1, wash: 1, flat: 0.6 }),
    junction: style({ base: L.grass, cover: 0.36, alt: L.dirt, altAmt: 0.4, road: L.dirt, roadW: 0.8, edge: L.mud, edgeW: 2.5, lines: 1, wash: 1, flat: 0.6 }),
    wharf: style({ base: L.dirt, cover: 0.4, alt: L.sand, altAmt: 0.35, road: L.dirt, roadW: 0.8, edge: L.sand, edgeW: 4, lines: 1, wash: 1, flat: 0.6 }),
    garden: style({ base: L.meadow, cover: 0.5, alt: L.soil, altAmt: 0.16, road: L.dirt, roadW: 0.8, lines: 1, wash: 1, flat: 0.55 }),
    hearth: style({ base: L.dirt, cover: 0.4, alt: L.grass, altAmt: 0.4, road: L.brick, roadW: 0.9, lines: 1, wash: 1, flat: 0.5 }),
    blank: style({ cover: 0 }),
  },
  // B) Lived-in ground: the whole district is ground (full texture); bare paper only at its rim
  B: {
    exercise: style({ base: L.grass, alt: L.soil, altAmt: 0.12, road: L.dirt, roadW: 1.3, bld: L.dirt, bldW: 1.4, edge: P, edgeW: 2.5, rim: 3, lines: 0.22 }),
    envelope: style({ base: L.grass, alt: L.dirt, altAmt: 0.3, road: L.dirt, roadW: 1.3, bld: L.paving, bldW: 1.6, edge: P, edgeW: 2.5, rim: 3, lines: 0.22 }),
    market: style({ base: L.dirt, alt: L.grass, altAmt: 0.25, road: L.paving, roadW: 1.2, bld: L.paving, bldW: 3.0, edge: L.sand, edgeW: 6, rim: 2.5, lines: 0.2 }),
    junction: style({ base: L.dirt, alt: L.grass, altAmt: 0.3, road: L.paving, roadW: 1.0, bld: L.paving, bldW: 2.6, edge: L.mud, edgeW: 4, rim: 2.5, lines: 0.2 }),
    wharf: style({ base: L.dirt, alt: L.mud, altAmt: 0.3, road: L.dirt, roadW: 1.2, bld: L.paving, bldW: 2.2, edge: L.sand, edgeW: 8, rim: 2.5, lines: 0.2 }),
    garden: style({ base: L.meadow, alt: L.soil, altAmt: 0.2, road: L.dirt, roadW: 1.2, edge: P, edgeW: 2.5, rim: 3, lines: 0.22 }),
    hearth: style({ base: L.dirt, alt: L.grass, altAmt: 0.32, road: L.brick, roadW: 2.4, bld: L.brick, bldW: 3.0, edge: P, edgeW: 2.5, rim: 3, lines: 0.2 }),
    blank: style({ cover: 0 }),
  },
  // C) Sketchbook yards (the game's ground): flat toon-coloured lawns, beds and yards with a soft pencil line round
  //    them; the streets keep a walkway of bare ruled paper either side, so the page still reads wherever you walk
  C: {
    exercise: style({ base: L.grass, cover: 0.56, alt: L.soil, altAmt: 0.14, road: P, roadW: 2.4, bld: L.dirt, bldW: 0.9, edge: P, edgeW: 2, rim: 1.5, lines: 0.55, ink: 1, flat: 0.62 }),
    envelope: style({ base: L.grass, cover: 0.62, alt: L.dirt, altAmt: 0.3, road: P, roadW: 1.8, bld: L.paving, bldW: 1.2, edge: P, edgeW: 2, rim: 1.5, lines: 0.55, ink: 1, flat: 0.62 }),
    market: style({ base: L.dirt, cover: 0.6, alt: L.grass, altAmt: 0.3, road: P, roadW: 2.0, bld: L.paving, bldW: 2.4, edge: L.sand, edgeW: 5, rim: 1.5, lines: 0.5, ink: 1, flat: 0.5 }),
    junction: style({ base: L.dirt, cover: 0.66, alt: L.grass, altAmt: 0.3, road: P, roadW: 1.4, bld: L.paving, bldW: 2.0, edge: L.mud, edgeW: 3, rim: 1.5, lines: 0.5, ink: 1, flat: 0.5 }),
    wharf: style({ base: L.dirt, cover: 0.66, alt: L.mud, altAmt: 0.3, road: P, roadW: 1.4, bld: L.paving, bldW: 1.8, edge: L.sand, edgeW: 6, rim: 1.5, lines: 0.5, ink: 1, flat: 0.5 }),
    garden: style({ base: L.meadow, cover: 0.6, alt: L.soil, altAmt: 0.2, road: P, roadW: 2.2, edge: P, edgeW: 2, rim: 1.5, lines: 0.55, ink: 1, flat: 0.62 }),
    hearth: style({ base: L.dirt, cover: 0.68, alt: L.grass, altAmt: 0.3, road: P, roadW: 1.8, bld: L.brick, bldW: 2.4, edge: P, edgeW: 2, rim: 1.5, lines: 0.5, ink: 1, flat: 0.45 }),
    blank: style({ cover: 0 }),
  },
};
const BY_PAPER = { ruled: 'exercise', envelope: 'envelope', letter: 'market', newsprint: 'junction', ledger: 'wharf', diary: 'garden', parchment: 'hearth', blank: 'blank' };
const MAXR = Math.max(8, REGIONS.length);
const layerId = (v) => (typeof v === 'number' ? v : v === 'paper' ? P : v in L ? L[v] : -1);
/** One district's style: its option's, then its own `ground` (REGION.ground or its file's GROUND) on top. */
function styleFor(r, option) {
  const styles = OPTIONS[option] || OPTIONS.C;
  const st = { ...(styles[r.id] || styles[BY_PAPER[r.paper]] || styles.blank) };
  const own = GROUND[r.id] || r.ground;
  if (own && typeof own === 'object') for (const [k, v] of Object.entries(own)) if (k in st) st[k] = ['base', 'alt', 'road', 'bld', 'edge'].includes(k) ? layerId(v) : +v;
  return st;
}

// ---------------------------------------------------------------------------------
// The material
// ---------------------------------------------------------------------------------
/** A painted clone of `baseMat` (the vertex-coloured toon ground). The textures are made on first use; the
 * simple shader (simple: true, or decided on first compile from the renderer: `decide(renderer) -> bool`)
 * never paints the layer array. */
export function groundMaterial(baseMat, option = 'C', { edges = [], isOpen = () => true, simple = null, decide = null } = {}) {
  const t0 = performance.now();
  shared ||= { mask: blobMask(), zone: zoneMap(edges, isOpen), layers: null, ms: 0, paintMs: 0 };
  shared.ms = performance.now() - t0;
  const regs = REGIONS.slice(0, MAXR);
  const rect = [], paper = [], sa = [], sb = [], sc = [], sd = [];
  for (const r of regs) {
    const st = styleFor(r, option);
    rect.push(new THREE.Vector4(...r.rect));
    paper.push(new THREE.Color(PAPER[r.paper] || PAPER.blank));
    sa.push(new THREE.Vector4(st.base, st.alt, st.road, st.bld));
    sb.push(new THREE.Vector4(st.edge, st.altAmt, st.roadW, st.bldW));
    sc.push(new THREE.Vector4(st.edgeW, st.cover, st.lines, st.rim));
    sd.push(new THREE.Vector4(st.wash, st.ink, st.flat, 0));
  }
  while (rect.length < MAXR) { rect.push(new THREE.Vector4(1e9, 1e9, -1e9, -1e9)); paper.push(new THREE.Color(1, 1, 1)); for (const a of [sa, sb, sc, sd]) a.push(new THREE.Vector4(-1, 0, -1, -1)); }
  const m = baseMat.clone();
  m.name = `ground-${option}`;
  const uniforms = {
    uGLayers: { value: null }, uGMask: { value: shared.mask }, uGZone: { value: shared.zone.tex }, uGZoneBox: { value: shared.zone.box },
    uGTile: { value: LAYERS.map((k) => 1 / TILE[k]) }, uGAvg: { value: LAYERS.map((k) => new THREE.Vector3(...AVG[k])) }, uGCount: { value: regs.length },
    uGRect: { value: rect }, uGPaper: { value: paper }, uGSA: { value: sa }, uGSB: { value: sb }, uGSC: { value: sc }, uGSD: { value: sd },
  };
  const state = { simple, uniforms };
  m.onBeforeCompile = (sh, renderer) => {
    if (state.simple === null) state.simple = decide ? !!decide(renderer) : false;
    if (!state.simple && !shared.layers) {
      const t1 = performance.now();
      shared.layers = layerArray();
      shared.layers.anisotropy = Math.min(4, renderer?.capabilities?.getMaxAnisotropy?.() || 1);
      shared.paintMs = performance.now() - t1;
    }
    if (!state.simple) uniforms.uGLayers.value = shared.layers;
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('void main() {', 'attribute float gKind;\nvarying vec3 vGW;\nvarying float vGUp;\nvarying float vGK;\nvoid main() {')
      .replace('#include <project_vertex>', '#include <project_vertex>\n  vGW = (modelMatrix * vec4(transformed, 1.0)).xyz;\n  vGUp = normal.y;\n  vGK = gKind;');
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', `${state.simple ? '#define G_SIMPLE\n' : ''}${FRAG_HEAD}\nvoid main() {`)
      .replace('#include <color_fragment>', FRAG_COLOR);
  };
  // (one renderer, so the simple/full choice made on first compile never changes under this key)
  m.customProgramCacheKey = () => `story-ground-${option}-${simple === null ? 'auto' : simple ? 's' : 'f'}`;
  m.groundState = state;
  return m;
}

const FRAG_HEAD = /* glsl */ `
#define G_NL ${LAYERS.length}
#define G_MAXR ${MAXR}
varying vec3 vGW;
varying float vGUp;
varying float vGK;
#ifndef G_SIMPLE
uniform highp sampler2DArray uGLayers;
uniform float uGTile[G_NL];
#endif
uniform vec3 uGAvg[G_NL];
uniform sampler2D uGMask;
uniform sampler2D uGZone;
uniform vec4 uGZoneBox;
uniform int uGCount;
uniform vec4 uGRect[G_MAXR];
uniform vec3 uGPaper[G_MAXR];
uniform vec4 uGSA[G_MAXR];
uniform vec4 uGSB[G_MAXR];
uniform vec4 uGSC[G_MAXR];
uniform vec4 uGSD[G_MAXR];
float gFlat = 0.0;
float gK = 0.5;
vec2 gDX = vec2(0.0), gDY = vec2(0.0);
vec3 gLayer(float idx, vec2 xz) {
  int i = int(idx + 0.5);
#ifdef G_SIMPLE
  return uGAvg[i] * (0.94 + 0.12 * gK);
#else
  // explicit gradients: these run inside branches
  float s = uGTile[i];
  vec3 c = textureGrad(uGLayers, vec3(xz * s, idx), gDX * s, gDY * s).rgb;
  // a second, slightly turned sample hides the tile's repeat; a flat fill (C: 0.45 and up) hides it well
  // enough on its own, so it saves the fetch
  if (gFlat < 0.3) {
    mat2 rot = mat2(0.866, 0.5, -0.5, 0.866);
    float s2 = s * 0.77;
    vec3 b = textureGrad(uGLayers, vec3(rot * xz * s2 + 0.31, idx), rot * gDX * s2, rot * gDY * s2).rgb;
    c = mix(c, b, smoothstep(0.35, 0.65, gK));
  }
  // flat: towards the layer's own average colour (a flat toon fill with a little texture left)
  return mix(c, uGAvg[i], gFlat);
#endif
}
vec4 gMaskAt(vec2 uv, float k) { return textureGrad(uGMask, uv, gDX * k, gDY * k); }
// a zone weight: 1 inside dist d of the feature, fading over f, the edge made ragged by w
float gBand(float dist, float d, float f, float w) { return 1.0 - smoothstep(d - f, d + f, dist + w); }
`;

// vGK (per vertex, build.js's gKind): 0 bare paper, 1 the paper's own markings and soft shadows, 2 a decal (kept)
const FRAG_COLOR = /* glsl */ `
  gDX = dFdx(vGW.xz); gDY = dFdy(vGW.xz);
  vec3 gVc = vColor.rgb;
  vec3 gOut = gVc;
  if (vGUp > 0.5 && vGW.y > -0.02 && vGW.y < 0.03 && vGK < 1.5) {
    vec2 xz = vGW.xz;
    int ri = -1;
    for (int k = 0; k < G_MAXR; k++) {
      if (k >= uGCount) break;
      vec4 rc = uGRect[k];
      if (xz.x >= rc.x && xz.x <= rc.z && xz.y >= rc.y && xz.y <= rc.w) { ri = k; break; }
    }
    if (ri >= 0 && uGSC[ri].y > 0.0) {
      vec4 SA = uGSA[ri], SB = uGSB[ri], SC = uGSC[ri], SD = uGSD[ri];
      vec3 paper = uGPaper[ri];
      vec4 rc = uGRect[ri];
      gFlat = SD.z;
      vec4 mk = gMaskAt(xz / 41.0, 1.0 / 41.0);
      vec4 mk2 = gMaskAt(xz / 7.0 + 0.37, 1.0 / 7.0);
      float mkAlt = gMaskAt(xz / 17.0 + 0.61, 1.0 / 17.0).r;
      gK = mk2.b; // (the fine mask's spare channel: no fetch of its own)
      vec4 zone = texture(uGZone, (xz - uGZoneBox.xy) * uGZoneBox.zw);
      float dRoad = zone.r * ${ZR.toFixed(1)}, dBld = zone.g * ${ZB.toFixed(1)}, dVoid = zone.b * ${ZE.toFixed(1)};
      float dRim = min(min(xz.x - rc.x, rc.z - xz.x), min(xz.y - rc.y, rc.w - xz.y));
      float wob = (mk2.a - 0.5) * 2.0 + (mk2.r - 0.5);
      bool wash = SD.x > 0.5;
      float soft = wash ? 0.03 : 0.018;
      // how much paint, first (no layer is fetched where the answer is bare paper)
      // main ground: where the big blob field is over (1 - cover)
      float thr = 1.0 - SC.y;
      float cov = SC.y >= 0.999 ? 1.0 : smoothstep(thr - soft, thr + soft, mk.b + wob * 0.04);
      // patches of the second layer
      float aw = 0.0;
      if (SA.y >= 0.0 && SB.y > 0.0) { float at = 1.0 - SB.y; aw = smoothstep(at - soft, at + soft, mkAlt + wob * 0.04); }
      // along roads, round buildings, at the paper's open edge: a band of another layer, or of bare paper
      // (a layer index: -1 none, -2 bare paper, 0.. a layer)
      float wR = abs(SA.z + 1.0) > 0.5 && SB.z > 0.0 ? gBand(dRoad, SB.z, wash ? 0.22 : 0.14, wob * 0.4) : 0.0;
      float wB = abs(SA.w + 1.0) > 0.5 && SB.w > 0.0 ? gBand(dBld, SB.w, wash ? 0.28 : 0.18, wob * 0.45) : 0.0;
      float wE = abs(SB.x + 1.0) > 0.5 && SC.x > 0.0 ? gBand(dVoid, SC.x, wash ? 0.5 : 0.16, wob * 1.2) : 0.0;
      // bare paper at the district's own rim (crisp in the toon styles, soft in watercolour)
      float rimF = SC.w <= 0.0 ? 1.0 : wash ? smoothstep(SC.w * 0.5, SC.w, dRim + wob * 0.8) : smoothstep(SC.w - 0.1, SC.w + 0.1, dRim + wob * 0.8);
      if (wB > 0.0) cov = SA.w >= 0.0 ? max(cov, wB) : cov * (1.0 - wB);
      float covE = cov * rimF;
      if (wE > 0.0) cov = SB.x >= 0.0 ? max(cov, wE) : cov * (1.0 - wE);
      float covR = cov * rimF;
      if (wR > 0.0) cov = SA.z >= 0.0 ? max(cov, wR) : cov * (1.0 - wR);
      cov *= rimF;
      // then the paint itself
      vec3 g = gVc;
      if (cov > 0.002) {
        g = gLayer(SA.x, xz);
        if (aw > 0.0) g = mix(g, gLayer(SA.y, xz), aw);
        if (wB > 0.0 && SA.w >= 0.0) g = mix(g, gLayer(SA.w, xz), wB);
        if (wE > 0.0 && SB.x >= 0.0) g = mix(g, gLayer(SB.x, xz), wE);
        if (wR > 0.0 && SA.z >= 0.0) g = mix(g, gLayer(SA.z, xz), wR);
      }
      // a broad light / shade wash over everything painted (no two metres alike)
      g *= mix(0.92, 1.06, mk.g);
      // the paper's markings (rules, margins, creases, soft shadows) ride on the paint
      if (vGK > 0.5) g = mix(g, g * clamp(gVc / max(paper, vec3(0.03)), vec3(0.0), vec3(1.2)), SC.z);
      float ink = 0.0;
      if (wash) {
        // watercolour: thin paint over the paper, a little granulation, a darker dried rim round each wash
        float rimBand = cov * (1.0 - cov) * 4.0;
        g = mix(gVc, g, 0.8) * (0.95 + 0.1 * mk2.g);
        g *= 1.0 - 0.2 * rimBand;
      } else if (SD.y > 0.5) {
        // a soft pencil line round each painted shape: lawn edges, and where the paint meets the walkway of paper
        // by a road or at the paper's open edge (only where there is paint on the far side of it)
        if (SC.y < 0.999) ink = (1.0 - smoothstep(0.003, 0.009, abs(mk.b + wob * 0.04 - thr))) * step(0.02, cov);
        if (SA.z < -1.5 && SB.z > 0.0) ink = max(ink, (1.0 - smoothstep(0.03, 0.07, abs(dRoad + wob * 0.4 - SB.z))) * step(0.5, covR));
        if (SB.x < -1.5 && SC.x > 0.0) ink = max(ink, (1.0 - smoothstep(0.03, 0.07, abs(dVoid + wob * 1.2 - SC.x))) * step(0.5, covE));
      }
      gOut = mix(gVc, g, cov);
      gOut = mix(gOut, gOut * vec3(0.62, 0.58, 0.54), ink * 0.45);
    }
  }
  diffuseColor.rgb *= gOut;
`;

// ---------------------------------------------------------------------------------
// In-game hook-up (stream.js): one material for every chunk's ground, the zone map kept in step with the gates
// ---------------------------------------------------------------------------------
const urlGround = (() => { try { return (new URLSearchParams(location.search).get('ground') || '').toLowerCase(); } catch { return ''; } })();
/** True when the renderer looks too weak for the full shader (or the device asked for the low tier). */
export function weakRenderer(renderer, low = false) {
  const c = renderer?.capabilities;
  if (low || !c) return true;
  return c.precision !== 'highp' || c.maxTextureSize < 4096 || c.maxTextures < 8 || c.maxFragmentUniforms < 160;
}
/** ?ground=off -> null (the plain paper, as before). Otherwise the painted ground (style C unless ?ground=A|B). */
export function createStoryGround({ edges = [], isOpen = () => true, low = false } = {}) {
  if (urlGround === 'off' || urlGround === '0') return null;
  const option = /^[abc]$/.test(urlGround) ? urlGround.toUpperCase() : 'C';
  const simple = urlGround === 'simple' ? true : urlGround === 'full' ? false : null;
  let material = null, dirty = null, patchMs = 0;
  const api = {
    /** The shared ground material (made, with the zone map, the first time a chunk needs it). */
    material(base) {
      if (!material) material = groundMaterial(base, option, { edges, isOpen, simple, decide: (r) => weakRenderer(r, low) });
      return material;
    },
    /** Puts build.js's per-vertex kinds on a chunk's ground geometry (none: every vertex a kept decal). */
    tag(geometry, kinds) {
      const n = geometry.getAttribute('position').count;
      geometry.setAttribute('gKind', new THREE.BufferAttribute(kinds && kinds.length === n ? kinds : new Uint8Array(n).fill(2), 1));
    },
    /** A gate opened or closed over this box: the strips of paper follow the roads there (on the next update). */
    roadsChanged(x0, z0, x1, z1) {
      if (!dirty) dirty = [x0, z0, x1, z1];
      else dirty = [Math.min(dirty[0], x0), Math.min(dirty[1], z0), Math.max(dirty[2], x1), Math.max(dirty[3], z1)];
    },
    /** Lazy towns: a town's buildings arrived over this box (the yards round them follow on the next update). */
    itemsChanged(x0, z0, x1, z1) {
      if (!shared?.zone) return; // (not made yet: it will be made from every item there is then)
      const t0 = performance.now();
      shared.zone.patchBuildings(x0, z0, x1, z1);
      patchMs = performance.now() - t0;
    },
    update() {
      if (!dirty || !shared?.zone) return;
      const t0 = performance.now();
      shared.zone.patchRoads(...dirty);
      dirty = null;
      patchMs = performance.now() - t0;
    },
    info() {
      const st = material?.groundState;
      return { option, mode: st ? (st.simple === null ? 'pending' : st.simple ? 'simple' : 'full') : 'unused', zoneMs: Math.round(shared?.ms || 0), paintMs: Math.round(shared?.paintMs || 0), patchMs: Math.round(patchMs),
        zone: shared?.zone ? `${shared.zone.W}x${shared.zone.H}` : null, texMB: shared ? +(((shared.zone?.bytes || 0) + 256 * 256 * 4 * 1.33 + (shared.layers ? S * S * 4 * LAYERS.length * 1.33 : 0)) / 1048576).toFixed(1) : 0 };
    },
    zoneAt,
    dispose() { material?.dispose(); material = null; },
  };
  try { window.__ground = api; } catch { /* no window */ }
  return api;
}
