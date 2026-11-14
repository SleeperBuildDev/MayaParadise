// Story interiors: Diary Garden (kiln square + lane), the Blank Page lodge, the Back Cover, the Post
// Office sorting room, plus a story dressing layer for the four existing Home Book rooms.
// Source of truth: writermaya-plan/game/days/INDEX.md section 13 (13.1 table, 13.2 merged layouts win,
// 13.5 builder rules) and the day specs' INTERIORS sections. Every Burmese line here is a draft for Maya.
//
//   import { ROOMS, dressHomeRoom, WALKON_LOOKS } from './rooms/garden.js';
//   const r = ROOMS.kilntea.build({ evening: 0, rain: false, day: 10, variant: 'dusk' });
//   r.scene, r.group               the room (kit.createRoom dollhouse, front-top view, open front at +z)
//   r.stations                     [{ id, x, z, r, look: { x, z }, label: { my, en } }]  tap targets, NO markers
//   r.obstacles, r.bounds, r.door, r.spawn   collision boxes/circles (kit format), walk bounds, front doormat
//   r.spots                        { name: { x, z, h, sit? } }  where the day specs put people (h = heading)
//   r.update(dt, t)                steam, smoke, drips, flicker, the few moving parts (no allocation)
//   r.setEvening(0..1)             lamps up, daylight down, window views to dusk/night
//   r.setRain(bool)                grey windows with streaks, drips at the door, cooler daylight
//   r.dispose()
//   (some rooms add small state setters, listed on their ROOMS entry: setMats, setBoardCloth, setLamp...)
//
//   dressHomeRoom(room, id, opts) -> { group, spots, stations, update, setEvening, dispose }
//   adds story props to an existing Home Book room built by js/game/interiors/<id>.js (about, templates,
//   content, library) without touching those files. opts: { day, lantern, trunkSoaked, wet, tea, night ... }
//
// Rules kept: no marker, ring, arrow or glow pin anywhere; nothing religious (no pagoda, monastery, monk or
// Buddha image); statics baked into one mesh + one outline per room; all signs on one canvas atlas per room;
// moving parts are a handful of small meshes plus one instanced puff mesh.
import * as kit from '../../game/interiors/kit.js';
import { fontsReady, FONT_MY, FONT_SERIF, roundRect } from '../../game/toon.js';
import { mergeGeometries } from '../../game/three.js';
import { angerPot, glazeShelf, breadTray as breadTray5 } from '../props5.js';
import { houseBoard, oilLamp as oilLamp6, gecko, hairpin, bookletBox as bookletBox6, paperLantern as paperLantern6, invitationStack as invitationStack6, storagePot as storagePot6 } from '../props6.js';
import { stampBlock, smallTeapot as smallTeapot3 } from '../props3.js';

const { THREE, PALETTE: P, VoxelBuilder, jitter, toon, basic, addOutline } = kit;

// ---------------------------------------------------------------------------------------------
// colours (Maya's palette + the story world's materials)
// ---------------------------------------------------------------------------------------------
const C = {
  wood: P.wood, woodD: P.woodDark, woodL: '#CDA577', teak: '#9C6238', teakD: '#764526', teakL: '#B57A4C',
  bamboo: '#C2A862', bambooD: '#94793C', brick: '#A0503A', brickD: '#7E3C2B', brickL: '#B9654A',
  terra: '#B5643C', terraL: '#CB7E4E', terraD: '#8E4A2C', clayRaw: '#D9B48C', clayRawD: '#C49A6F',
  green: '#A3A98C', greenL: '#B7BC9F', greenD: '#858B70', blue: '#3F6EA8', blueL: '#5E8DC6', blueD: '#2C507E',
  iron: '#4A3B30', ironL: '#6A5848', soot: '#2B1E19', tin: '#A9A79F', tinL: '#C9C6BC', tinD: '#7D7B74',
  brass: '#C49A3E', brassD: '#94702A', brassL: '#DDBB62', straw: '#E3C46E', strawD: '#C9A64E', strawL: '#EFD78E',
  kraft: '#C4A57A', kraftD: '#9E8158', news: '#DCD6C8', newsD: '#BDB6A6', paper: P.paper, cream: P.cream,
  parch: P.parchment, ink: P.ink, chalk: '#3E4A3F', chalkL: '#4E5B50', cloth: '#E9DFC9', red: '#B8423A',
  maroon: P.maroon, maroonD: P.maroonDeep, gold: P.gold, goldD: P.goldDeep, leaf: P.leaf, leafD: P.leafDark,
  leafL: '#8DBA6E', gourd: '#CDB65E', gourdD: '#A88E3E', gourdG: '#86A85E', water: '#7FA9B8', waterD: '#5E8A9A',
  rope: '#B89A63', ropeD: '#8E7444', mat: '#D6B97E', matD: '#B89A5E', matL: '#E6CF9A', white: P.white,
  teal: '#2F7C7A', navy: '#2E3D63', plum: '#6B3E64', coral: '#E0795A', mustard: '#D9A93B', sky: '#7FB0CF',
  mint: '#9CC7AE', ochre: '#E3CD95', sage: '#8E9C84', lime: '#F1EDE2', mud: '#7D6146', earth: '#8D6E50',
};
const BOOKS = [C.maroon, C.goldD, '#2F5DB3', '#3E6B4F', C.cream, '#8E5A3C', C.ink, '#C27A5B', C.teal, C.plum];

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const frac = (x) => x - Math.floor(x);
const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// ---------------------------------------------------------------------------------------------
// geometry helpers (build time only)
// ---------------------------------------------------------------------------------------------
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
const _m = new THREE.Matrix4();
function M(x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}
/** Box with any turn (Euler XYZ) about its own centre. */
function boxR(v, x, y, z, w, h, d, col, rx = 0, ry = 0, rz = 0) {
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(w, h, d));
  v.add(UNIT, col, _m);
}
const prismCache = new Map();
function prismGeo(rT, rB, h, seg) {
  const key = `${rT}|${rB}|${h}|${seg}`;
  let g = prismCache.get(key);
  if (!g) {
    g = new THREE.CylinderGeometry(rT, rB, h, seg, 1, false, Math.PI / seg).toNonIndexed();
    g.deleteAttribute('uv');
    g.deleteAttribute('normal');
    g.computeVertexNormals();
    prismCache.set(key, g);
  }
  return g;
}
/** Flat-faceted prism by centre. */
function prism(v, x, y, z, rT, rB, h, col, seg = 8, rx = 0, rz = 0) {
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, 0, rz)), _s.set(1, 1, 1));
  v.add(prismGeo(rT, rB, h, seg), col, _m);
}

// pots: tiers [radius, height] bottom -> top, colour keys per glaze
const POTS = {
  terra: { foot: C.terraD, low: C.terra, belly: C.terraL, neck: C.terraD, rim: C.terraL, band: '#EBDCBF', mouth: C.soot },
  green: { foot: C.greenD, low: C.green, belly: C.greenL, neck: C.greenD, rim: C.greenL, band: null, mouth: '#6E735C' },
  blue: { foot: C.blueD, low: C.blue, belly: C.blueL, neck: C.blueD, rim: C.blueL, band: '#E8E2CF', mouth: '#1E2E44' },
  raw: { foot: C.clayRawD, low: '#D3AC82', belly: '#E4C49E', neck: C.clayRawD, rim: '#E4C49E', band: null, mouth: '#9C7752' },
  black: { foot: '#2E2622', low: '#3C322C', belly: '#4A3E36', neck: '#2E2622', rim: '#4A3E36', band: C.gold, mouth: '#140E0B' },
  cream: { foot: '#CFC4AA', low: '#E6DCC4', belly: '#F2EBD8', neck: '#CFC4AA', rim: '#F2EBD8', band: C.maroon, mouth: '#5A4A3A' },
};
/** A pot with its foot at (x, y, z); returns the rim height. kind: key of POTS, cracked adds a crack. */
function potInto(v, x, y, z, s = 1, kind = 'terra', { cracked = false, lid = false, tall = 1 } = {}) {
  const K = POTS[kind] || POTS.terra;
  const T = [[0.1, 0.035, K.foot], [0.155, 0.07 * tall, K.low], [0.195, 0.12 * tall, K.belly], [0.17, 0.07 * tall, K.low], [0.125, 0.045, K.neck], [0.092, 0.045, K.neck], [0.12, 0.032, K.rim]];
  let yy = y;
  for (const [r, h, col] of T) {
    prism(v, x, yy + (h * s) / 2, z, r * s, r * s, h * s, col);
    yy += h * s;
  }
  prism(v, x, yy + 0.003, z, 0.088 * s, 0.088 * s, 0.006, K.mouth);
  if (K.band) prism(v, x, y + (0.035 + 0.07 * tall + 0.06 * tall) * s, z, 0.199 * s, 0.199 * s, 0.02 * s, K.band);
  if (cracked) {
    const pts = [[0.03, 0.3], [-0.02, 0.25], [0.03, 0.2], [-0.025, 0.15], [0.01, 0.11]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      boxR(v, x + ((x0 + x1) / 2) * s, y + ((y0 + y1) / 2) * s * tall, z + 0.19 * s, Math.hypot(x1 - x0, y1 - y0) * s + 0.01, 0.016 * s, 0.02, C.soot, 0, 0, Math.atan2(y1 - y0, x1 - x0));
    }
  }
  if (lid) {
    prism(v, x, yy + 0.02 * s, z, 0.1 * s, 0.13 * s, 0.035 * s, K.rim);
    prism(v, x, yy + 0.055 * s, z, 0.03 * s, 0.04 * s, 0.04 * s, K.foot);
  }
  return yy;
}
/** Glass/clay jar with a lid and an optional label colour. */
function jarInto(v, x, y, z, s = 1, fill = C.straw, { glass = true, label = C.paper, lidCol = C.tinD, empty = false } = {}) {
  const g = glass ? '#CFE0E2' : C.terraL;
  prism(v, x, y + 0.11 * s, z, 0.075 * s, 0.075 * s, 0.22 * s, g);
  if (!empty) prism(v, x, y + 0.08 * s, z, 0.068 * s, 0.068 * s, 0.15 * s, fill);
  prism(v, x, y + 0.235 * s, z, 0.07 * s, 0.07 * s, 0.03 * s, lidCol);
  if (label) v.box(x, y + 0.11 * s, z + 0.07 * s, 0.09 * s, 0.07 * s, 0.01, label);
}
/** Low four-legged stool. */
function stoolInto(v, x, z, h = 0.32, top = C.wood, legs = C.woodD, w = 0.36) {
  v.boxMin(x - w / 2, h - 0.05, z - w / 2, x + w / 2, h, z + w / 2, top);
  v.boxMin(x - w / 2 + 0.03, h - 0.065, z - w / 2 + 0.03, x + w / 2 - 0.03, h - 0.05, z + w / 2 - 0.03, jitter(top, 0.12, 4));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(x + sx * (w / 2 - 0.05), (h - 0.05) / 2, z + sz * (w / 2 - 0.05), 0.045, h - 0.05, 0.045, legs);
  v.boxMin(x - w / 2 + 0.05, 0.1, z - 0.012, x + w / 2 - 0.05, 0.13, z + 0.012, legs);
}
/** Low tea table (top at h). */
function lowTableInto(v, x, z, w = 1.0, d = 0.7, h = 0.45, top = C.wood, legs = C.woodD, seed = 1) {
  v.boxMin(x - w / 2, h - 0.05, z - d / 2, x + w / 2, h, z + d / 2, top);
  for (let i = 0; i < 4; i++) v.boxMin(x - w / 2 + 0.02 + (i * (w - 0.04)) / 4, h - 0.004, z - d / 2 + 0.02, x - w / 2 + 0.02 + ((i + 1) * (w - 0.04)) / 4 - 0.01, h + 0.002, z + d / 2 - 0.02, jitter(top, 0.07, seed + i));
  v.boxMin(x - w / 2 + 0.04, h - 0.12, z - d / 2 + 0.04, x + w / 2 - 0.04, h - 0.05, z + d / 2 - 0.04, legs);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(x + sx * (w / 2 - 0.07), (h - 0.05) / 2, z + sz * (d / 2 - 0.07), 0.06, h - 0.05, 0.06, legs);
}
/** Teacup on a saucer. */
function cupInto(v, x, y, z, col = C.white) {
  v.box(x, y + 0.006, z, 0.09, 0.012, 0.09, col);
  v.box(x, y + 0.04, z, 0.06, 0.055, 0.06, col);
  v.box(x, y + 0.066, z, 0.048, 0.004, 0.048, '#8A5A32');
  v.box(x + 0.04, y + 0.04, z, 0.016, 0.03, 0.012, col);
}
/** Kettle (dark iron or tin). Returns the spout tip. */
function kettleInto(v, x, y, z, s = 1, col = C.iron) {
  prism(v, x, y + 0.03 * s, z, 0.13 * s, 0.12 * s, 0.06 * s, jitter(col, 0.1, 2));
  prism(v, x, y + 0.11 * s, z, 0.15 * s, 0.14 * s, 0.11 * s, col);
  prism(v, x, y + 0.19 * s, z, 0.1 * s, 0.14 * s, 0.05 * s, col);
  prism(v, x, y + 0.225 * s, z, 0.05 * s, 0.05 * s, 0.03 * s, C.ironL);
  boxR(v, x + 0.17 * s, y + 0.15 * s, z, 0.14 * s, 0.04 * s, 0.04 * s, col, 0, 0, 0.7);
  for (const sx of [-1, 1]) v.box(x + sx * 0.09 * s, y + 0.27 * s, z, 0.02 * s, 0.1 * s, 0.02 * s, C.ironL);
  v.box(x, y + 0.32 * s, z, 0.2 * s, 0.025 * s, 0.03 * s, C.woodD);
  return { x: x + 0.23 * s, y: y + 0.2 * s, z };
}
/** Clay oil lamp: saucer + wick; returns the flame point. */
function oilLampInto(v, x, y, z, s = 1, glassTop = true) {
  prism(v, x, y + 0.02 * s, z, 0.07 * s, 0.06 * s, 0.04 * s, C.brass);
  prism(v, x, y + 0.07 * s, z, 0.025 * s, 0.035 * s, 0.06 * s, C.brassD);
  prism(v, x, y + 0.12 * s, z, 0.06 * s, 0.045 * s, 0.05 * s, C.brass);
  if (glassTop) {
    prism(v, x, y + 0.2 * s, z, 0.04 * s, 0.055 * s, 0.11 * s, '#E8E4D2');
    prism(v, x, y + 0.26 * s, z, 0.045 * s, 0.045 * s, 0.012 * s, C.brassD);
  }
  return { x, y: y + 0.18 * s, z };
}
/** Stack of paper sheets tied with twine (a bale). col: kraft | news | cream; damp darkens the bottom. */
function baleInto(v, x, y, z, w, h, d, seed = 1, damp = false) {
  const cols = [C.kraft, C.news, C.cream, C.kraftD, C.newsD, '#D8C49C'];
  const base = cols[Math.floor(hash(seed) * 3)];
  v.boxMin(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, jitter(base, 0.05, seed));
  const n = Math.max(3, Math.round(h / 0.06));
  for (let i = 0; i < n; i++) {
    if (hash(seed * 7 + i) < 0.45) continue;
    const yy = y + ((i + 0.5) * h) / n;
    const off = (hash(seed + i * 3) - 0.5) * 0.03;
    v.boxMin(x - w / 2 + off - 0.006, yy - 0.012, z + d / 2 - 0.004, x + w / 2 + off + 0.006, yy + 0.008, z + d / 2 + 0.012, jitter(cols[(seed + i) % cols.length], 0.06, i));
  }
  if (damp) v.boxMin(x - w / 2 - 0.005, y, z - d / 2 - 0.005, x + w / 2 + 0.005, y + h * 0.28, z + d / 2 + 0.014, '#8E7A5E');
  // twine: two bands around, one knot
  for (const k of [-0.28, 0.28]) {
    v.boxMin(x + k * w - 0.012, y - 0.004, z + d / 2 + 0.012, x + k * w + 0.012, y + h + 0.012, z + d / 2 + 0.022, C.ropeD);
    v.boxMin(x + k * w - 0.012, y + h, z - d / 2, x + k * w + 0.012, y + h + 0.014, z + d / 2 + 0.02, C.ropeD);
  }
  v.boxMin(x - w / 2, y + h, z - 0.012, x + w / 2, y + h + 0.014, z + 0.012, C.ropeD);
  v.box(x + 0.28 * w, y + h + 0.02, z + 0.0, 0.05, 0.03, 0.05, C.rope);
  if (hash(seed * 3.3) > 0.6) v.boxMin(x - w / 2 + 0.05, y + h * 0.4, z + d / 2 + 0.01, x - w / 2 + 0.16, y + h * 0.4 + 0.08, z + d / 2 + 0.024, C.paper); // tag
}
/** A slumped sack. */
function sackInto(v, x, z, s = 1, col = C.cloth, tie = C.ropeD) {
  v.boxMin(x - 0.22 * s, 0, z - 0.17 * s, x + 0.22 * s, 0.34 * s, z + 0.17 * s, col);
  v.boxMin(x - 0.19 * s, 0.34 * s, z - 0.14 * s, x + 0.19 * s, 0.44 * s, z + 0.14 * s, jitter(col, 0.06, 2));
  v.boxMin(x - 0.1 * s, 0.44 * s, z - 0.08 * s, x + 0.1 * s, 0.52 * s, z + 0.08 * s, jitter(col, 0.1, 3));
  v.boxMin(x - 0.105 * s, 0.47 * s, z - 0.085 * s, x + 0.105 * s, 0.49 * s, z + 0.085 * s, tie);
  v.boxMin(x - 0.235 * s, 0.02, z + 0.12 * s, x + 0.235 * s, 0.06 * s, z + 0.18 * s, jitter(col, 0.12, 9));
  v.box(x, 0.2 * s, z + 0.172 * s, 0.18 * s, 0.1 * s, 0.006, jitter(col, -0.15, 5));
}
/** Wooden crate (open top) with plank seams. */
function crateInto(v, x, y, z, w = 0.6, h = 0.4, d = 0.45, col = C.woodL, seed = 2) {
  v.boxMin(x - w / 2, y, z - d / 2, x + w / 2, y + 0.04, z + d / 2, C.woodD);
  for (const sz of [-1, 1]) for (let i = 0; i < 3; i++) v.boxMin(x - w / 2, y + 0.04 + (i * (h - 0.04)) / 3, sz > 0 ? z + d / 2 - 0.03 : z - d / 2, x + w / 2, y + 0.04 + ((i + 1) * (h - 0.04)) / 3 - 0.012, sz > 0 ? z + d / 2 : z - d / 2 + 0.03, jitter(col, 0.08, seed + i + sz * 5));
  for (const sx of [-1, 1]) v.boxMin(sx > 0 ? x + w / 2 - 0.03 : x - w / 2, y + 0.04, z - d / 2, sx > 0 ? x + w / 2 : x - w / 2 + 0.03, y + h - 0.012, z + d / 2, jitter(col, 0.1, seed + sx));
  for (const sx of [-1, 1]) v.box(x + sx * (w / 2 - 0.03), y + h / 2, z + d / 2 + 0.005, 0.05, h, 0.02, C.woodD);
}
/** Straw heap: a low mound with many thin strands. */
function strawInto(v, x, y, z, w = 0.8, d = 0.6, h = 0.3, seed = 3) {
  v.boxMin(x - w * 0.42, y, z - d * 0.42, x + w * 0.42, y + h * 0.45, z + d * 0.42, C.strawD);
  v.boxMin(x - w * 0.3, y + h * 0.4, z - d * 0.3, x + w * 0.3, y + h * 0.7, z + d * 0.3, C.straw);
  const n = Math.round(10 + w * d * 60);
  for (let i = 0; i < n; i++) {
    const a = hash(seed + i * 1.7), b = hash(seed * 2.3 + i), c = hash(seed * 3.1 + i * 0.7);
    const r = Math.sqrt(a);
    const px = x + Math.cos(b * 6.28) * r * w * 0.48, pz = z + Math.sin(b * 6.28) * r * d * 0.48;
    const py = y + h * (0.75 - r * 0.55) + c * 0.03;
    boxR(v, px, py, pz, 0.16 + c * 0.14, 0.014, 0.022, [C.straw, C.strawL, C.strawD][i % 3], (c - 0.5) * 0.5, b * 6.28, (a - 0.5) * 0.6);
  }
}
/** Book row standing on a board (x0..x1 at height y, depth d centred at z). */
function bookRowInto(v, x0, x1, y, z, d, hMax, seed = 1, gapAt = -1) {
  let x = x0, k = seed * 7, i = 0;
  while (x < x1 - 0.05) {
    const bw = 0.045 + ((k * 37) % 5) * 0.01;
    const bh = hMax * (0.7 + ((k * 13) % 4) * 0.08);
    if (i !== gapAt) {
      const col = BOOKS[k % BOOKS.length];
      v.boxMin(x, y, z - d / 2, x + bw, y + bh, z + d / 2, col);
      v.boxMin(x + 0.008, y + bh * 0.7, z + d / 2, x + bw - 0.008, y + bh * 0.78, z + d / 2 + 0.004, C.gold);
    }
    x += bw + 0.008;
    k++;
    i++;
  }
}
/** Hanging oil lamp on a chain (returns flame point). */
function hangingLampInto(v, x, yTop, z, len = 0.6) {
  v.box(x, yTop - len / 2, z, 0.015, len, 0.015, C.ironL);
  const y = yTop - len;
  v.box(x, y - 0.03, z, 0.16, 0.025, 0.16, C.brassD);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(x + sx * 0.065, y - 0.14, z + sz * 0.065, 0.015, 0.2, 0.015, C.brassD);
  v.box(x, y - 0.15, z, 0.12, 0.17, 0.12, '#F3E8C8');
  v.box(x, y - 0.25, z, 0.17, 0.03, 0.17, C.brass);
  v.box(x, y - 0.29, z, 0.08, 0.05, 0.08, C.brassD);
  return { x, y: y - 0.15, z };
}
/** A clay water jar on a wooden stand with a cup on its lid. */
function waterJarInto(v, x, z, s = 1) {
  v.boxMin(x - 0.22 * s, 0, z - 0.22 * s, x + 0.22 * s, 0.06 * s, z + 0.22 * s, C.woodD);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(x + sx * 0.17 * s, 0.14 * s, z + sz * 0.17 * s, 0.05 * s, 0.22 * s, 0.05 * s, C.woodD);
  v.boxMin(x - 0.22 * s, 0.24 * s, z - 0.22 * s, x + 0.22 * s, 0.28 * s, z + 0.22 * s, C.wood);
  const top = potInto(v, x, 0.28 * s, z, 1.15 * s, 'terra');
  prism(v, x, top + 0.015, z, 0.13 * s, 0.13 * s, 0.03, C.woodL);
  cupInto(v, x + 0.03, top + 0.03, z + 0.02, C.tinL);
}

// ---------------------------------------------------------------------------------------------
// canvas atlas: every sign, page, board and poster in a room on one texture, one unlit mesh
// ---------------------------------------------------------------------------------------------
function makeAtlas(W = 1024, H = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  const geos = [];
  const draws = [];
  let cx = 0, cy = 0, rowH = 0;
  const A = {
    canvas,
    /** Reserve a w × h pixel region and draw it with fn(g, w, h) (kept, so it can be redrawn after fonts load). */
    region(w, h, fn) {
      w = Math.min(W, Math.round(w));
      h = Math.round(h);
      if (cx + w > W) { cx = 0; cy += rowH + 2; rowH = 0; }
      const r = { x: cx, y: cy, w, h, u0: (cx + 0.5) / W, u1: (cx + w - 0.5) / W, v0: 1 - (cy + h - 0.5) / H, v1: 1 - (cy + 0.5) / H, fn };
      cx += w + 2;
      rowH = Math.max(rowH, h);
      if (cy + h > H) console.warn('garden atlas overflow');
      draws.push(r);
      A.paint(r);
      return r;
    },
    paint(r) {
      g.save();
      g.translate(r.x, r.y);
      g.beginPath();
      g.rect(0, 0, r.w, r.h);
      g.clip();
      g.clearRect(0, 0, r.w, r.h);
      r.fn(g, r.w, r.h);
      g.restore();
    },
    redraw() {
      for (const r of draws) A.paint(r);
      if (A.tex) A.tex.needsUpdate = true;
    },
    /** Plane w × h (metres) facing +Z showing region r, placed by matrix m (room space). */
    quad(r, w, h, m) {
      const geo = new THREE.PlaneGeometry(w, h);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, r.u0 + uv.getX(i) * (r.u1 - r.u0), r.v0 + uv.getY(i) * (r.v1 - r.v0));
      geo.applyMatrix4(m);
      geos.push(geo);
    },
    mesh() {
      if (!geos.length) return null;
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      A.tex = tex;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04, toneMapped: false, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(mergeGeometries(geos, false), mat);
      for (const geo of geos) geo.dispose();
      mesh.name = 'roomSigns';
      mesh.userData.dynamic = true;
      mesh.raycast = () => {};
      return mesh;
    },
  };
  return A;
}

/** Centred lines of text: [{ t, s (px), c, f ('my' | 'serif' | css font family), w (weight) }] with Burmese line height. */
function lines(g, list, w, h, { y0 = null, align = 'center', x = null } = {}) {
  const total = list.reduce((a, l) => a + (l.s ?? 40) * (l.lh ?? 1.7), 0);
  let y = y0 ?? (h - total) / 2;
  g.textAlign = align;
  g.textBaseline = 'middle';
  for (const l of list) {
    const s = l.s ?? 40;
    const fam = l.f === 'serif' ? FONT_SERIF : l.f === 'hand' ? '"Segoe Print", "Comic Sans MS", ' + FONT_MY : FONT_MY;
    g.font = `${l.w ?? 700} ${s}px ${fam}`;
    g.fillStyle = l.c ?? C.ink;
    y += (s * (l.lh ?? 1.7)) / 2;
    g.fillText(l.t, x ?? (align === 'left' ? 14 : w / 2), y, w - 24);
    y += (s * (l.lh ?? 1.7)) / 2;
  }
}
function panel(g, w, h, { bg = C.cream, border = C.goldD, bw = 8, r = 14 } = {}) {
  roundRect(g, bw / 2, bw / 2, w - bw, h - bw, r);
  if (bg) { g.fillStyle = bg; g.fill(); }
  if (border) { g.lineWidth = bw; g.strokeStyle = border; g.stroke(); }
}
/** Ruled handwriting scribbles on paper (a ledger or diary page). */
function scribble(g, x, y, w, h, { rows = 8, ink = '#3B3A5A', rule = '#C9D3DF', seed = 1, margin = '#D99A9A' } = {}) {
  const gap = h / rows;
  g.strokeStyle = rule;
  g.lineWidth = 1.5;
  for (let i = 1; i <= rows; i++) { g.beginPath(); g.moveTo(x, y + i * gap); g.lineTo(x + w, y + i * gap); g.stroke(); }
  if (margin) { g.strokeStyle = margin; g.beginPath(); g.moveTo(x + w * 0.12, y); g.lineTo(x + w * 0.12, y + h); g.stroke(); }
  g.strokeStyle = ink;
  g.lineWidth = Math.max(1.5, gap * 0.09);
  for (let i = 0; i < rows; i++) {
    const len = w * (0.5 + 0.35 * hash(seed + i));
    g.beginPath();
    const yy = y + (i + 0.7) * gap;
    g.moveTo(x + w * 0.15, yy);
    for (let k = 0; k < 18; k++) {
      const xx = x + w * 0.15 + (k / 17) * (len - w * 0.05);
      g.lineTo(xx, yy - gap * 0.22 * Math.abs(Math.sin(k * 1.7 + seed + i)));
    }
    g.stroke();
  }
}
/** Chalk text on a slate board. */
function chalkBoard(g, w, h, list, { frame = C.woodD, bg = C.chalk } = {}) {
  g.fillStyle = frame;
  g.fillRect(0, 0, w, h);
  g.fillStyle = bg;
  g.fillRect(10, 10, w - 20, h - 20);
  g.globalAlpha = 0.12;
  g.fillStyle = '#ffffff';
  for (let i = 0; i < 9; i++) g.fillRect(20 + hash(i) * (w - 80), 20 + hash(i + 3) * (h - 60), 40 + hash(i * 2) * 60, 4);
  g.globalAlpha = 1;
  lines(g, list.map((l) => ({ c: '#F2EFE6', w: 600, ...l })), w, h);
}

// ---------------------------------------------------------------------------------------------
// window views (one small canvas per room, redrawn on evening / rain changes)
// ---------------------------------------------------------------------------------------------
function skyCols(k, rain) {
  // day -> dusk -> night
  const day = ['#9FC8E6', '#E8F1F2'], dusk = ['#C77A5E', '#F2B56B'], night = ['#1E2A44', '#3B3F5A'];
  const a = k < 0.5 ? day : dusk, b = k < 0.5 ? dusk : night, u = k < 0.5 ? k * 2 : (k - 0.5) * 2;
  const mix = (c1, c2) => '#' + new THREE.Color(c1).lerp(new THREE.Color(c2), u).getHexString();
  let top = mix(a[0], b[0]), bot = mix(a[1], b[1]);
  if (rain) {
    top = '#' + new THREE.Color(top).lerp(new THREE.Color('#6F7A82'), 0.7).getHexString();
    bot = '#' + new THREE.Color(bot).lerp(new THREE.Color('#9AA3A6'), 0.7).getHexString();
  }
  return [top, bot];
}
function drawView(kind, g, w, h, k, rain) {
  const [top, bot] = skyCols(k, rain);
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, top);
  gr.addColorStop(1, bot);
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);
  const night = k > 0.7;
  const shade = (c, f) => '#' + new THREE.Color(c).multiplyScalar(f).getHexString();
  const dim = rain ? 0.7 : 1 - k * 0.55;
  if (!rain && k < 0.6) {
    g.fillStyle = k > 0.3 ? 'rgba(255,214,170,0.9)' : 'rgba(255,255,255,0.9)';
    for (const [cx, cy, s] of [[0.25, 0.22, 1], [0.7, 0.14, 0.7]]) {
      g.fillRect(w * cx - 40 * s, h * cy, 80 * s, 18 * s);
      g.fillRect(w * cx - 22 * s, h * cy - 12 * s, 44 * s, 14 * s);
    }
  }
  if (night && !rain) {
    g.fillStyle = '#FFF4D0';
    for (let i = 0; i < 14; i++) g.fillRect(hash(i) * w, hash(i + 9) * h * 0.5, 3, 3);
  }
  if (kind === 'square' || kind === 'plaza' || kind === 'garden') {
    // roofs and walls across the way
    const roofs = kind === 'plaza' ? [C.maroon, C.goldD, C.teal] : [C.brick, C.terraD, '#6E5A48'];
    for (let i = 0; i < 4; i++) {
      const x0 = (i / 4) * w - 10, ww = w / 4 + 6, hh = h * (0.32 + hash(i + 2) * 0.12);
      g.fillStyle = shade(i % 2 ? C.cream : C.parch, dim);
      g.fillRect(x0, h - hh, ww, hh);
      g.fillStyle = shade(roofs[i % 3], dim);
      g.beginPath();
      g.moveTo(x0 - 6, h - hh);
      g.lineTo(x0 + ww / 2, h - hh - 28);
      g.lineTo(x0 + ww + 6, h - hh);
      g.fill();
      g.fillStyle = k > 0.55 ? '#FFD27A' : shade('#6F8FA8', dim);
      g.fillRect(x0 + ww * 0.3, h - hh * 0.65, ww * 0.18, hh * 0.22);
      g.fillRect(x0 + ww * 0.58, h - hh * 0.65, ww * 0.18, hh * 0.22);
    }
    if (kind === 'square') {
      // the kiln chimney with its smoke
      g.fillStyle = shade(C.brickD, dim);
      g.fillRect(w * 0.62, h * 0.18, w * 0.07, h * 0.5);
      g.fillStyle = shade(C.brick, dim);
      g.fillRect(w * 0.6, h * 0.16, w * 0.11, h * 0.05);
      g.fillStyle = 'rgba(200,196,190,0.75)';
      for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(w * (0.66 + i * 0.05), h * (0.12 - i * 0.03), 14 + i * 6, 0, 7); g.fill(); }
    }
    if (kind === 'garden') {
      g.fillStyle = shade(C.leafD, dim);
      g.fillRect(0, h * 0.78, w, h * 0.22);
      for (let i = 0; i < 9; i++) { g.fillStyle = shade(i % 2 ? C.leaf : C.leafL, dim); g.beginPath(); g.arc((i + 0.5) * (w / 9), h * 0.8, 22, Math.PI, 0); g.fill(); }
    }
  } else if (kind === 'trellis') {
    g.fillStyle = shade(C.bambooD, dim);
    for (let i = 0; i < 5; i++) g.fillRect((i / 4) * w - 4, 0, 8, h);
    for (let i = 0; i < 4; i++) g.fillRect(0, (i / 3) * h - 4, w, 8);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = shade([C.leaf, C.leafD, C.leafL][i % 3], dim);
      const x = hash(i) * w, y = hash(i + 50) * h * 0.85;
      g.beginPath(); g.ellipse(x, y, 30, 20, hash(i + 3) * 3, 0, 7); g.fill();
    }
    for (let i = 0; i < 6; i++) {
      const x = (0.1 + hash(i + 7) * 0.8) * w, y = (0.25 + hash(i + 11) * 0.45) * h;
      g.fillStyle = shade(C.leafD, dim); g.fillRect(x - 2, y - 30, 4, 30);
      g.fillStyle = shade(i % 2 ? C.gourdG : C.gourd, dim);
      g.beginPath(); g.ellipse(x, y + 26, 16, 34, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(x, y - 4, 10, 14, 0, 0, 7); g.fill();
    }
  } else if (kind === 'smoke') {
    g.fillStyle = 'rgba(160,150,140,0.7)';
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(w * (0.15 + i * 0.16), h * (0.75 - i * 0.1), 30 + i * 8, 0, 7); g.fill(); }
    g.fillStyle = shade(C.brickD, dim);
    g.fillRect(0, h * 0.82, w, h * 0.18);
  } else if (kind === 'sunset') {
    // the blank page: white land, a low sun, a dark line of road going north
    g.fillStyle = shade('#F7F3EA', 1 - k * 0.6);
    g.fillRect(0, h * 0.62, w, h * 0.38);
    g.fillStyle = k > 0.7 ? '#F2E6B8' : '#FFC77A';
    g.beginPath(); g.arc(w * 0.62, h * 0.6, 26, Math.PI, 0); g.fill();
    g.fillStyle = shade('#C9C2B2', 1 - k * 0.5);
    g.fillRect(w * 0.47, h * 0.62, w * 0.06, h * 0.38);
  } else if (kind === 'high') {
    g.fillStyle = shade(C.terraD, dim);
    g.fillRect(0, h * 0.86, w, h * 0.14);
  }
  if (rain) {
    g.strokeStyle = 'rgba(235,240,245,0.55)';
    g.lineWidth = 2;
    for (let i = 0; i < 46; i++) {
      const x = hash(i * 3) * w, y = hash(i * 5) * h;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - 6, y + 26); g.stroke();
    }
    g.fillStyle = 'rgba(220,230,236,0.35)';
    for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(hash(i + 70) * w, hash(i + 90) * h, 3 + hash(i) * 4, 0, 7); g.fill(); }
  }
}

// rain overlay (shared streak texture, scrolled)
let rainTex = null;
function rainTexture() {
  if (rainTex) return rainTex;
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 128;
  const g = cv.getContext('2d');
  g.strokeStyle = 'rgba(240,246,250,0.8)';
  g.lineWidth = 1.6;
  for (let i = 0; i < 14; i++) {
    const x = hash(i * 7) * 64, y = hash(i * 13) * 128;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 18); g.stroke();
  }
  rainTex = new THREE.CanvasTexture(cv);
  rainTex.wrapS = rainTex.wrapT = THREE.RepeatWrapping;
  rainTex.userData.shared = true;
  return rainTex;
}
// warm light pools (additive radial decals)
let poolTex = null;
function poolTexture() {
  if (poolTex) return poolTex;
  const s = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.45, 'rgba(255,255,255,0.45)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  poolTex = new THREE.CanvasTexture(cv);
  poolTex.userData.shared = true;
  return poolTex;
}

// ---------------------------------------------------------------------------------------------
// room scaffold: kit.createRoom + static builder + atlas + windows + glows + pools + puffs
// ---------------------------------------------------------------------------------------------
const WARM = new THREE.Color('#FFC98A');
const RAINY = new THREE.Color('#B9C6CF');
const NIGHT_BG = new THREE.Color('#3A2618');
const _c = new THREE.Color();

function scaffold(o) {
  const room = kit.createRoom({ ...o, windows: [] });
  const { width: W, depth: D, height: H } = room;
  const hw = W / 2, hd = D / 2;
  const S = new VoxelBuilder();
  const A = makeAtlas(1024, o.atlasH ?? 1024);
  const glowGeos = [];
  const poolGeos = [];
  const paneGeos = [];
  const rainGeos = [];
  const emitters = [];
  const anims = [];
  const stations = [];
  const spots = {};
  const dyn = [];
  const props = [];
  const state = { evening: 0, rain: false };
  const base = { hemi: room.lights.hemi.intensity, sun: room.lights.sun.intensity, hemiC: room.lights.hemi.color.clone(), sunC: room.lights.sun.color.clone(), bg: room.scene.background.clone() };
  // evening: a warm lamplight fill from the open front (people's faces and fronts catch it like a rim of lamp
  // light) - a light, not a mesh: no draw call. nightKeep: how much of the daylight ambient stays at night.
  const fill = new THREE.DirectionalLight('#FFB774', 0);
  fill.position.set(1.2, 4.5, 9);
  room.scene.add(fill);
  const nightKeep = o.nightKeep ?? 0.56, nightFill = o.nightFill ?? 0.95;

  /** Height of the cut-away side wall at depth z (kit.createRoom's steps). */
  const wallH = (z) => {
    const u = (z + hd) / D;
    return u < 0.45 ? H : u < 0.65 ? H * 0.62 : u < 0.85 ? H * 0.36 : 0.5;
  };
  const ctx = {
    room, S, A, W, D, H, hw, hd, wallH, state, spots, stations,
    /** Solid box footprint (room space). */
    solid(x, z, w, d, pad = 0.06) {
      room.obstacles.push({ type: 'box', minX: x - w / 2 - pad, maxX: x + w / 2 + pad, minZ: z - d / 2 - pad, maxZ: z + d / 2 + pad });
    },
    circle(x, z, r) { room.obstacles.push({ type: 'circle', x, z, r }); },
    /** Build fn(v) in local space and merge it at (x, y, z) turned ry; optional footprint [w, d] for a solid box. */
    put(x, z, ry, fp, fn, y = 0) {
      const v = new VoxelBuilder();
      const L = {
        m: M(x, y, z, ry),
        glow: (gx, gy, gz, w, h, d) => ctx.glowM(M(gx, gy, gz).premultiply(L.m), w, h, d),
        quad: (r, w, h, qx, qy, qz, qry = 0, qrx = 0) => A.quad(r, w, h, M(qx, qy, qz, qry, qrx).premultiply(L.m)),
        emit: (kind, ex, ey, ez, opts) => { const p = new THREE.Vector3(ex, ey, ez).applyMatrix4(L.m); ctx.emit(kind, p.x, p.y, p.z, opts); },
        pool: (px, pz, r, py = 0.012) => { const p = new THREE.Vector3(px, py, pz).applyMatrix4(L.m); ctx.pool(p.x, p.z, r, p.y); },
      };
      fn(v, L);
      S.merge(v, L.m);
      if (fp) {
        const swap = Math.abs(Math.round(ry / (Math.PI / 2))) % 2 === 1;
        ctx.solid(x, z, swap ? fp[1] : fp[0], swap ? fp[0] : fp[1]);
      }
    },
    /** Kit furniture (collisions by room.place). */
    place: (obj, x, z, ry = 0, opt) => room.place(obj, x, z, ry, opt),
    glow(x, y, z, w, h, d) { ctx.glowM(M(x, y, z), w, h, d); },
    glowM(m, w, h, d) {
      const g = new THREE.BoxGeometry(w, h, d);
      g.deleteAttribute('uv');
      g.applyMatrix4(m);
      glowGeos.push(g);
    },
    /** Warm pool of light on the floor (or a table top at y). */
    pool(x, z, r, y = 0.012) {
      const g = new THREE.PlaneGeometry(r * 2, r * 2);
      g.rotateX(-Math.PI / 2);
      g.translate(x, y, z);
      poolGeos.push(g);
    },
    /** Steam / smoke / drip / ember source. opts: { n, rise, spread, size, speed } */
    emit(kind, x, y, z, opts = {}) { emitters.push({ kind, x, y, z, n: 3, rise: 0.55, spread: 0.05, size: 0.07, speed: 0.35, ...opts }); },
    animate(fn) { anims.push(fn); },
    /** A moving part: fn(v) in local space; returns the mesh (positioned at x, y, z), never baked. px 0: no outline (1 call). */
    part(fn, x = 0, y = 0, z = 0, px = 1.3) {
      const v = new VoxelBuilder();
      fn(v);
      const mesh = v.mesh({ outline: px > 0, px });
      mesh.position.set(x, y, z);
      mesh.userData.dynamic = true;
      room.group.add(mesh);
      dyn.push(mesh);
      return mesh;
    },
    /** A ready-made story prop ({ root, update?, dispose? }): added after the bake (it keeps its own moves). */
    prop(p, x = 0, y = 0, z = 0, ry = 0) {
      p.root.position.set(x, y, z);
      p.root.rotation.y = ry;
      p.root.traverse((o) => { o.userData.dynamic = true; });
      props.push(p);
      return p;
    },
    /** Tap target (no marker). */
    tap(id, x, z, look, label, r = 0.9) {
      stations.push({ id, x, z, r, look: look ? { x: look[0], z: look[1] } : { x, z }, label, marker: { userData: { update() {} } } });
    },
    /** People's mark: name -> { x, z, h } (h = heading: Math.atan2(dx, dz)). look: [x, z] or a heading number. */
    spot(name, x, z, look = 0, extra = {}) {
      const h = Array.isArray(look) ? face(x, z, look[0], look[1]) : look;
      spots[name] = { x, z, h, ...extra };
    },
    /** Sign / poster on a wall. wall: 'back' | 'left' | 'right'. */
    wallQuad(r, wall, along, y, w, h, out = 0.07) {
      const m = wall === 'back' ? M(along, y, -hd + out) : wall === 'left' ? M(-hw + out, y, along, Math.PI / 2) : M(hw - out, y, along, -Math.PI / 2);
      A.quad(r, w, h, m);
    },
    /** A window on the back wall: frame (wood), sill, optional shutters/curtain; its pane shows the room's view. */
    window({ x = 0, y = 1.7, w = 1.2, h = 1.0, frame = C.woodD, sill = C.wood, shutters = null, curtain = null, bars = 0, wall = 'back', along = 0 }) {
      const v = new VoxelBuilder();
      const f = 0.07;
      v.boxMin(-w / 2 - f, -h / 2 - f, 0, w / 2 + f, -h / 2, 0.1, frame);
      v.boxMin(-w / 2 - f, h / 2, 0, w / 2 + f, h / 2 + f, 0.1, frame);
      v.boxMin(-w / 2 - f, -h / 2, 0, -w / 2, h / 2, 0.1, frame);
      v.boxMin(w / 2, -h / 2, 0, w / 2 + f, h / 2, 0.1, frame);
      v.boxMin(-0.02, -h / 2, 0.02, 0.02, h / 2, 0.07, frame);
      v.boxMin(-w / 2, -0.02, 0.02, w / 2, 0.02, 0.07, frame);
      for (let i = 1; i <= bars; i++) v.boxMin(-w / 2 + (i * w) / (bars + 1) - 0.012, -h / 2, 0.06, -w / 2 + (i * w) / (bars + 1) + 0.012, h / 2, 0.09, C.iron);
      v.boxMin(-w / 2 - 0.14, -h / 2 - 0.12, 0, w / 2 + 0.14, -h / 2 - 0.05, 0.2, sill);
      v.boxMin(-w / 2 - 0.1, -h / 2 - 0.16, 0, w / 2 + 0.1, -h / 2 - 0.12, 0.12, jitter(sill, -0.15, 2));
      if (shutters) for (const sx of [-1, 1]) {
        v.boxMin(sx * (w / 2 + f) + (sx > 0 ? 0 : -w * 0.45), -h / 2, 0.01, sx * (w / 2 + f) + (sx > 0 ? w * 0.45 : 0), h / 2, 0.05, shutters);
        for (let i = 0; i < 5; i++) v.boxMin(sx * (w / 2 + f) + (sx > 0 ? 0.03 : -w * 0.45 + 0.03), -h / 2 + 0.08 + i * (h - 0.16) / 5, 0.05, sx * (w / 2 + f) + (sx > 0 ? w * 0.45 - 0.03 : -0.03), -h / 2 + 0.12 + i * (h - 0.16) / 5, 0.065, jitter(shutters, -0.12, i));
      }
      if (curtain) {
        v.boxMin(-w / 2 - 0.2, h / 2 + 0.1, 0.12, w / 2 + 0.2, h / 2 + 0.13, 0.15, C.brassD);
        for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) v.boxMin(sx * (w / 2 + 0.16) - (sx > 0 ? 0.1 + i * 0.07 : -i * 0.07) , -h / 2 + 0.05, 0.13 + (i % 2) * 0.02, sx * (w / 2 + 0.16) - (sx > 0 ? 0.03 + i * 0.07 : -0.07 - i * 0.07), h / 2 + 0.1, 0.16 + (i % 2) * 0.02, jitter(curtain, 0.08, i + sx));
      }
      const m = wall === 'back' ? M(x, y, -hd + 0.02) : wall === 'left' ? M(-hw + 0.02, y, along, Math.PI / 2) : M(hw - 0.02, y, along, -Math.PI / 2);
      S.merge(v, m);
      const pane = new THREE.PlaneGeometry(w, h);
      pane.applyMatrix4(M(0, 0, 0.015).premultiply(m));
      paneGeos.push(pane);
      const rp = new THREE.PlaneGeometry(w, h);
      rp.applyMatrix4(M(0, 0, 0.03).premultiply(m));
      const uv = rp.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w * 1.6, uv.getY(i) * h * 1.2);
      rainGeos.push(rp);
    },
    /** Wall details: vertical plank seams (plank walls) on the back and side walls between y0 and y1. */
    plankSeams(y0, y1, col, step = 0.32) {
      for (let x = -hw + step; x < hw - 0.05; x += step) S.boxMin(x - 0.012, y0, -hd, x + 0.012, y1, -hd + 0.012, col);
      for (const sx of [-1, 1]) for (let z = -hd + step; z < hd - 0.1; z += step) {
        const top = Math.min(y1, wallH(z) - 0.1);
        if (top > y0) S.boxMin(sx * hw - (sx > 0 ? 0.012 : 0), y0, z - 0.012, sx * hw + (sx > 0 ? 0 : 0.012), top, z + 0.012, col);
      }
    },
    /** Brick courses on the back wall (and sides) between y0 and y1. */
    bricks(y0, y1, cols, { sides = true, bw = 0.26, bh = 0.09 } = {}) {
      let row = 0;
      for (let y = y0; y < y1 - 0.02; y += bh, row++) {
        const off = row % 2 ? bw / 2 : 0;
        for (let x = -hw - off; x < hw; x += bw) {
          const xa = Math.max(-hw, x + 0.008), xb = Math.min(hw, x + bw - 0.008);
          if (xb - xa > 0.03) S.boxMin(xa, y + 0.006, -hd, xb, Math.min(y1, y + bh - 0.006), -hd + 0.018, cols[(row * 7 + Math.round(x * 13)) % cols.length >>> 0] ?? cols[0]);
        }
        if (sides) for (const sx of [-1, 1]) for (let z = -hd - off; z < hd; z += bw) {
          const za = Math.max(-hd, z + 0.008), zb = Math.min(hd - 0.05, z + bw - 0.008);
          if (zb - za > 0.03 && y + bh < wallH(zb) - 0.08) S.boxMin(sx * hw - (sx > 0 ? 0.018 : 0), y + 0.006, za, sx * hw + (sx > 0 ? 0 : 0.018), Math.min(y1, y + bh - 0.006), zb, cols[(row * 5 + Math.round(z * 11) + (sx > 0 ? 3 : 0)) % cols.length >>> 0] ?? cols[0]);
        }
      }
    },
    /** Floor grime / mats / worn patches: a thin flat box. */
    floorPatch(x, z, w, d, col, y = 0.004) { S.boxMin(x - w / 2, 0, z - d / 2, x + w / 2, y, z + d / 2, col); },

    finish(viewKind = 'square') {
      const g = room.group;
      // static decor -> baked with the room
      const sm = S.mesh({ outline: true, px: 1.3 });
      g.add(sm);
      room.bake();
      for (const p of props) g.add(p.root);
      // signs
      const signs = A.mesh();
      if (signs) g.add(signs);
      // glows (flames, embers, lit shades)
      let glowMat = null, glowMesh = null;
      if (glowGeos.length) {
        glowMat = new THREE.MeshBasicMaterial({ color: '#FFE3A0', toneMapped: false });
        glowMesh = new THREE.Mesh(mergeGeometries(glowGeos, false), glowMat);
        glowMesh.name = 'glows';
        glowMesh.raycast = () => {};
        g.add(glowMesh);
        for (const x of glowGeos) x.dispose();
      }
      let poolMat = null;
      if (poolGeos.length) {
        poolMat = new THREE.MeshBasicMaterial({ map: poolTexture(), color: '#FFB766', transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
        const pm = new THREE.Mesh(mergeGeometries(poolGeos, false), poolMat);
        pm.renderOrder = 2;
        pm.raycast = () => {};
        g.add(pm);
        for (const x of poolGeos) x.dispose();
      }
      // window panes (one view texture) + rain overlay
      let viewTex = null, viewCanvas = null, rainMesh = null, rainMat = null;
      if (paneGeos.length) {
        viewCanvas = document.createElement('canvas');
        viewCanvas.width = 256;
        viewCanvas.height = 192;
        viewTex = new THREE.CanvasTexture(viewCanvas);
        viewTex.colorSpace = THREE.SRGBColorSpace;
        const pm = new THREE.Mesh(mergeGeometries(paneGeos, false), new THREE.MeshBasicMaterial({ map: viewTex, toneMapped: false }));
        pm.name = 'windowViews';
        g.add(pm);
        rainMat = new THREE.MeshBasicMaterial({ map: rainTexture(), transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false });
        rainMesh = new THREE.Mesh(mergeGeometries(rainGeos, false), rainMat);
        rainMesh.visible = false;
        g.add(rainMesh);
        for (const x of [...paneGeos, ...rainGeos]) x.dispose();
      }
      const redrawView = () => {
        if (!viewCanvas) return;
        drawView(viewKind, viewCanvas.getContext('2d'), viewCanvas.width, viewCanvas.height, state.evening, state.rain);
        viewTex.needsUpdate = true;
      };
      redrawView();
      // puffs: steam, smoke, drips, embers (one instanced mesh)
      const parts = [];
      for (const e of emitters) for (let i = 0; i < e.n; i++) parts.push({ e, ph: hash(parts.length * 1.37 + 0.2) });
      let puffs = null;
      if (parts.length) {
        puffs = new THREE.InstancedMesh(UNIT, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6, depthWrite: false, toneMapped: false }), parts.length);
        puffs.name = 'puffs';
        puffs.frustumCulled = false;
        puffs.raycast = () => {};
        const col = { steam: '#F6F1E6', smoke: '#B8B0A6', drip: '#D7E6EE', ember: '#FFB35A', dust: '#FFF3D2' };
        parts.forEach((p, i) => puffs.setColorAt(i, _c.set(col[p.e.kind] || '#ffffff')));
        g.add(puffs);
      }
      const api = {
        id: o.id, name: o.name, room, scene: room.scene, group: g, stations, obstacles: room.obstacles, bounds: room.bounds,
        door: room.door, spawn: room.spawn, spots, width: W, depth: D, height: H,
        update(dt, t) {
          if (puffs) {
            for (let i = 0; i < parts.length; i++) {
              const p = parts[i], e = p.e;
              const u = frac(t * e.speed + p.ph);
              let x = e.x, y = e.y, z = e.z, s;
              if (e.kind === 'drip') {
                if (!state.rain && !e.always) { s = 0; }
                else { y = e.y * (1 - u * u); s = 0.035; x += (p.ph - 0.5) * e.spread * 2; }
                _m.compose(_p.set(x, y, z), _q.identity(), _s.set(s * 0.6, s * 1.8, s * 0.6));
              } else {
                const sway = Math.sin(t * 1.3 + p.ph * 9) * e.spread;
                x += sway + (p.ph - 0.5) * e.spread;
                y += u * e.rise;
                z += Math.cos(t * 1.1 + p.ph * 7) * e.spread * 0.6;
                s = e.size * (e.kind === 'ember' ? 0.5 * (1 - u) : (0.5 + u * 1.3) * Math.sin(Math.PI * Math.min(1, u * 1.15)));
                _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(0, t * 0.5 + p.ph * 6, 0)), _s.set(s, s, s));
              }
              puffs.setMatrixAt(i, _m);
            }
            puffs.instanceMatrix.needsUpdate = true;
          }
          if (glowMat) {
            const f = 0.93 + 0.07 * Math.sin(t * 13.1) * Math.sin(t * 7.3);
            glowMat.color.setRGB(1.0 * f, (0.86 + state.evening * 0.04) * f, (0.6 + 0.02 * state.evening) * f);
          }
          if (rainMesh && state.rain) rainMat.map.offset.y = frac(t * 1.6);
          for (const a of anims) a(dt, t);
          for (const p of props) p.update?.(dt, t);
        },
        setEvening(k) {
          state.evening = clamp01(k);
          applyLight();
          redrawView();
        },
        setRain(on) {
          state.rain = !!on;
          if (rainMesh) rainMesh.visible = state.rain;
          applyLight();
          redrawView();
          for (const f of api._rainHooks) f(state.rain);
        },
        _rainHooks: [],
        dispose() {
          for (const p of props) { try { p.dispose?.(); } catch (e) { /* already freed by the room */ } }
          room.dispose();
          viewTex?.dispose();
          A.tex?.dispose();
          for (const m of [glowMat, poolMat, rainMat]) m?.dispose();
        },
      };
      function applyLight() {
        const k = state.evening;
        const L = room.lights;
        L.hemi.intensity = base.hemi * (1 - (1 - nightKeep) * k) * (state.rain ? 0.88 : 1);
        fill.intensity = nightFill * k * k;
        L.hemi.color.copy(base.hemiC).lerp(WARM, k * 0.8);
        if (state.rain) L.hemi.color.lerp(RAINY, 0.35 * (1 - k));
        L.sun.intensity = base.sun * (1 - 0.78 * k) * (state.rain ? 0.6 : 1);
        L.sun.color.copy(base.sunC).lerp(WARM, k * 0.8);
        room.scene.background.copy(base.bg).lerp(NIGHT_BG, k * 0.85);
        if (state.rain) room.scene.background.lerp(RAINY, 0.25 * (1 - k));
        if (poolMat) poolMat.opacity = Math.min(0.92, 0.1 + (o.poolNight ?? 0.6) * k + (state.rain ? 0.14 : 0));
      }
      applyLight();
      // fonts may arrive after the first draw: repaint the atlas once they do
      if (document.fonts && document.fonts.status !== 'loaded') fontsReady().then(() => A.redraw());
      if (o.evening) api.setEvening(o.evening);
      if (o.rain) api.setRain(true);
      return api;
    },
  };
  return ctx;
}

const NAME = (my, en) => ({ my, en });

// =============================================================================================
// small shared furniture for these rooms (local space, feet at y = 0, front +Z)
// =============================================================================================
/** Clay charcoal brazier/stove with embers; kettle or pan on top. Returns { top, spout }. */
function stoveInto(v, L, { kettle = true, pan = false, s = 1 } = {}) {
  prism(v, 0, 0.04 * s, 0, 0.26 * s, 0.24 * s, 0.08 * s, C.terraD);
  prism(v, 0, 0.18 * s, 0, 0.24 * s, 0.2 * s, 0.22 * s, C.terra);
  prism(v, 0, 0.3 * s, 0, 0.27 * s, 0.25 * s, 0.04 * s, C.terraL);
  v.box(0, 0.12 * s, 0.215 * s, 0.14 * s, 0.09 * s, 0.03, C.soot); // draught mouth
  prism(v, 0, 0.32 * s, 0, 0.2 * s, 0.2 * s, 0.01, C.soot);
  for (let i = 0; i < 5; i++) v.box(Math.cos(i * 1.3) * 0.09 * s, 0.33 * s, Math.sin(i * 1.3) * 0.09 * s, 0.07 * s, 0.04 * s, 0.07 * s, '#3A2A22');
  L.glow(0, 0.12 * s, 0.226 * s, 0.1 * s, 0.05 * s, 0.01);
  L.glow(0.03, 0.345 * s, 0.02, 0.05 * s, 0.02, 0.05 * s);
  L.glow(-0.06, 0.345 * s, -0.04, 0.04 * s, 0.02, 0.04 * s);
  for (const a of [0, 2.1, 4.2]) v.box(Math.sin(a) * 0.17 * s, 0.35 * s, Math.cos(a) * 0.17 * s, 0.05 * s, 0.04 * s, 0.05 * s, C.ironL);
  const top = 0.37 * s;
  let spout = null;
  if (kettle) spout = kettleInto(v, 0, top, 0, 1.15 * s);
  if (pan) {
    prism(v, 0, top + 0.03, 0, 0.24 * s, 0.2 * s, 0.06, C.iron, 10);
    prism(v, 0, top + 0.061, 0, 0.215 * s, 0.215 * s, 0.004, '#C9A04A', 10);
    for (let i = 0; i < 6; i++) v.box(Math.cos(i) * 0.12 * s, top + 0.075, Math.sin(i) * 0.12 * s, 0.07, 0.03, 0.06, i % 2 ? '#D9A44A' : '#C98A36');
    v.box(0.33 * s, top + 0.05, 0, 0.2 * s, 0.025, 0.035, C.woodD);
  }
  return { top, spout };
}
const MY_DIGITS = '၀၁၂၃၄၅၆၇၈၉';
const myNum = (n) => String(n).replace(/\d/g, (d) => MY_DIGITS[d]);
/** A wall calendar: every seventh day ringed (red), and one more ring three days on. */
function calendarRegion(A, title = 'ပြက္ခဒိန်', { ring7 = true, nextRing = 3, mark = -1 } = {}) {
  return A.region(200, 280, (g, w, h) => {
    g.fillStyle = C.paper; g.fillRect(0, 0, w, h);
    g.fillStyle = C.maroon; g.fillRect(0, 0, w, 62);
    g.fillStyle = '#9CC6DD'; g.fillRect(8, 8, w - 16, 46);
    g.fillStyle = '#7FA35A'; g.beginPath(); g.moveTo(8, 54); g.quadraticCurveTo(w * 0.4, 14, w - 8, 50); g.lineTo(w - 8, 54); g.fill();
    g.fillStyle = '#F2C76A'; g.beginPath(); g.arc(w * 0.75, 24, 9, 0, 7); g.fill();
    lines(g, [{ t: title, s: 18, c: C.ink }], w, 36, { y0: 58 });
    const cw = (w - 16) / 7, ch = (h - 110) / 5;
    for (let i = 0; i < 31; i++) {
      const cx = 8 + (i % 7) * cw + cw / 2, cy = 102 + Math.floor(i / 7) * ch + ch / 2;
      g.font = `600 13px ${FONT_MY}`;
      g.fillStyle = i % 7 === 6 ? C.red : '#4A4038';
      g.textAlign = 'center';
      g.fillText(myNum(i + 1), cx, cy + 4);
      const ringed = (ring7 && i % 7 === 6) || i === 6 + 7 * 2 + nextRing || i === mark;
      if (ringed) { g.strokeStyle = C.red; g.lineWidth = 2.5; g.beginPath(); g.ellipse(cx, cy, cw * 0.42, ch * 0.4, 0, 0, 7); g.stroke(); }
    }
  });
}
/** Mount a calendar quad (paper) with a nail. */
function calendarOn(ctx, wall, along, y, title, opts) {
  const r = calendarRegion(ctx.A, title, opts);
  ctx.wallQuad(r, wall, along, y, 0.42, 0.59, 0.075);
  const S = ctx.S;
  if (wall === 'back') S.box(along, y + 0.31, -ctx.hd + 0.04, 0.03, 0.03, 0.05, C.iron);
  else S.box((wall === 'left' ? -1 : 1) * (ctx.hw - 0.04), y + 0.31, along, 0.05, 0.03, 0.03, C.iron);
}
/** Round wall clock (atlas face on a wooden ring). */
function clockOn(ctx, x, y) {
  const r = ctx.A.region(96, 96, (g, w, h) => {
    g.fillStyle = C.paper; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 2, 0, 7); g.fill();
    g.strokeStyle = C.ink; g.lineWidth = 3;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(w / 2 + Math.sin(a) * 36, h / 2 - Math.cos(a) * 36); g.lineTo(w / 2 + Math.sin(a) * 42, h / 2 - Math.cos(a) * 42); g.stroke(); }
    g.lineWidth = 4; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + 14, h / 2 - 20); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 - 28, h / 2 + 8); g.stroke();
  });
  ctx.S.add(prismGeo(0.2, 0.2, 0.05, 12), C.woodD, M(x, y, -ctx.hd + 0.03, 0, Math.PI / 2));
  ctx.wallQuad(r, 'back', x, y, 0.32, 0.32, 0.06);
}
/** Teapot (small clay) on a shelf. */
function teapotInto(v, x, y, z, s = 1, col = C.terra) {
  prism(v, x, y + 0.05 * s, z, 0.07 * s, 0.06 * s, 0.1 * s, col);
  prism(v, x, y + 0.11 * s, z, 0.05 * s, 0.07 * s, 0.03 * s, jitter(col, 0.1, 3));
  prism(v, x, y + 0.135 * s, z, 0.015 * s, 0.025 * s, 0.025 * s, jitter(col, -0.1, 3));
  boxR(v, x + 0.08 * s, y + 0.07 * s, z, 0.07 * s, 0.02 * s, 0.02 * s, col, 0, 0, 0.6);
  v.box(x - 0.075 * s, y + 0.06 * s, z, 0.02 * s, 0.06 * s, 0.02 * s, col);
}
/** Tea-leaf tin. */
function tinInto(v, x, y, z, s = 1, col = C.red) {
  prism(v, x, y + 0.07 * s, z, 0.05 * s, 0.05 * s, 0.14 * s, col);
  prism(v, x, y + 0.145 * s, z, 0.053 * s, 0.053 * s, 0.02 * s, C.gold);
  v.box(x, y + 0.07 * s, z + 0.048 * s, 0.05 * s, 0.05 * s, 0.006, C.cream);
}
/** Wall shelf board on two brackets (local: wall at z = 0, shelf toward +z). Returns the top height. */
function wallShelfInto(v, x, y, z, w, d = 0.26, col = C.wood) {
  v.boxMin(x - w / 2, y - 0.04, z, x + w / 2, y, z + d, col);
  v.boxMin(x - w / 2, y - 0.045, z + d - 0.02, x + w / 2, y + 0.012, z + d, jitter(col, -0.12, 2));
  for (const sx of [-1, 1]) {
    v.boxMin(x + sx * (w / 2 - 0.15) - 0.02, y - 0.24, z, x + sx * (w / 2 - 0.15) + 0.02, y - 0.04, z + 0.04, C.woodD);
    boxR(v, x + sx * (w / 2 - 0.15), y - 0.12, z + 0.1, 0.03, 0.24, 0.03, C.woodD, 0.75, 0, 0);
  }
  return y;
}
/** Tin watering can. */
function waterCanInto(v, x, y, z, s = 1) {
  prism(v, x, y + 0.13 * s, z, 0.12 * s, 0.13 * s, 0.26 * s, C.tin, 10);
  prism(v, x, y + 0.265 * s, z, 0.09 * s, 0.12 * s, 0.02 * s, C.tinD, 10);
  boxR(v, x + 0.2 * s, y + 0.2 * s, z, 0.26 * s, 0.035 * s, 0.035 * s, C.tinD, 0, 0, 0.6);
  prism(v, x + 0.31 * s, y + 0.29 * s, z, 0.045 * s, 0.03 * s, 0.05 * s, C.tinL, 8, 0, -0.9);
  boxR(v, x - 0.02 * s, y + 0.34 * s, z, 0.18 * s, 0.025 * s, 0.025 * s, C.tinD, 0, 0, 0);
  v.box(x - 0.11 * s, y + 0.3 * s, z, 0.025 * s, 0.08 * s, 0.025 * s, C.tinD);
  v.box(x + 0.07 * s, y + 0.3 * s, z, 0.025 * s, 0.08 * s, 0.025 * s, C.tinD);
}
/** Plank bench (local, along x). */
function benchInto(v, w = 1.4, h = 0.42, d = 0.36, col = C.wood) {
  v.boxMin(-w / 2, h - 0.05, -d / 2, w / 2, h, d / 2, col);
  v.boxMin(-w / 2, h - 0.052, -d / 2 + 0.17, w / 2, h + 0.002, -d / 2 + 0.185, jitter(col, -0.15, 3));
  for (const sx of [-1, 1]) {
    v.boxMin(sx * (w / 2 - 0.1) - 0.04, 0, -d / 2 + 0.04, sx * (w / 2 - 0.1) + 0.04, h - 0.05, d / 2 - 0.04, C.woodD);
  }
  v.boxMin(-w / 2 + 0.12, 0.12, -0.02, w / 2 - 0.12, 0.16, 0.02, C.woodD);
}
/** A curled, sleeping cat (local origin on the floor; ry turns it). */
function catInto(v, x, y, z, ry = 0, col = '#D9A35E', stripe = '#B07A3A') {
  const L = (lx, ly, lz, w, h, d, c) => boxR(v, x + Math.cos(ry) * lx + Math.sin(ry) * lz, y + ly, z - Math.sin(ry) * lx + Math.cos(ry) * lz, w, h, d, c, 0, ry, 0);
  L(0, 0.07, 0, 0.3, 0.14, 0.2, col);
  L(0.02, 0.145, 0, 0.24, 0.02, 0.16, jitter(col, 0.06, 2));
  for (const k of [-0.07, 0.0, 0.07]) L(k, 0.15, 0, 0.025, 0.012, 0.17, stripe);
  L(0.15, 0.09, 0.07, 0.13, 0.11, 0.12, col);
  L(0.18, 0.165, 0.04, 0.03, 0.04, 0.025, stripe);
  L(0.18, 0.165, 0.1, 0.03, 0.04, 0.025, stripe);
  L(0.22, 0.08, 0.08, 0.012, 0.012, 0.06, '#3A2A20');
  L(-0.05, 0.03, 0.12, 0.28, 0.05, 0.05, col);
  L(0.08, 0.03, 0.135, 0.06, 0.05, 0.05, stripe);
}
/** A soft broom leaning on a wall (top at y 1.1). lean: radians toward -x. */
function broomInto(v, x, z, lean = 0.12, ry = 0) {
  boxR(v, x, 0.66, z, 0.04, 1.1, 0.04, C.bambooD, 0, ry, lean);
  boxR(v, x - Math.sin(lean) * 0.5, 1.2, z, 0.05, 0.05, 0.05, C.red, 0, ry, lean); // red-taped grip
  boxR(v, x + Math.sin(lean) * 0.5, 0.14, z, 0.09, 0.3, 0.3, C.straw, 0, ry, lean);
  boxR(v, x + Math.sin(lean) * 0.52, 0.06, z, 0.1, 0.12, 0.34, C.strawD, 0, ry, lean);
  boxR(v, x + Math.sin(lean) * 0.44, 0.27, z, 0.1, 0.05, 0.22, C.red, 0, ry, lean); // red binding
}
/** A wet patch on the boards: overlapping dark blots (no hard rectangle) with a few pale-blue glints. */
function wetPatchInto(v, x, z, w, d, seed = 1, y = 0.004, dark = '#4A382C') {
  for (let i = 0; i < 5; i++) {
    const a = hash(seed * 7 + i), b = hash(seed * 7 + i + 3);
    const ww = w * (0.45 + a * 0.4), dd = d * (0.45 + b * 0.4);
    const cx = x + (a - 0.5) * (w - ww), cz = z + (b - 0.5) * (d - dd);
    boxR(v, cx, y / 2 + i * 0.0004, cz, ww, y, dd, jitter(dark, 0.04, seed + i), 0, (a - 0.5) * 0.5, 0);
  }
  for (let i = 0; i < 3; i++) boxR(v, x + (hash(seed + i + 40) - 0.5) * w * 0.5, y + 0.003, z + (hash(seed + i + 41) - 0.5) * d * 0.5, 0.05 + hash(i + seed) * w * 0.25, 0.002, 0.025, i ? '#8FA6B0' : '#C9DAE0', 0, hash(seed + i) * 0.8, 0);
}
/** A small woven mat (a cat's place, a stool cushion on the floor): maroon with a gold edge. */
function catMatInto(v, x, z, w = 0.5, d = 0.38) {
  v.boxMin(x - w / 2, 0, z - d / 2, x + w / 2, 0.02, z + d / 2, C.gold);
  v.boxMin(x - w / 2 + 0.03, 0.02, z - d / 2 + 0.03, x + w / 2 - 0.03, 0.026, z + d / 2 - 0.03, C.maroon);
}

// =============================================================================================
// kilntea · the corner tea shop at the kiln square (Diary Garden) · D10 (D12 shelter)
// =============================================================================================
function buildKilnTea(opts = {}) {
  const ctx = scaffold({ id: 'kilntea', name: NAME('ထောင့်ဆိုင်', 'Corner tea shop'), width: 7, depth: 8, height: 3, wall: '#F0E4CA', wainscot: C.mint, trim: C.gold, floor: 'plain', floorColor: '#6E4A36', background: '#EDE3CF', ...opts });
  const { S, A, hd, hw } = ctx;
  const GREEN = '#3E7A5A';
  ctx.plankSeams(0.14, 0.98, '#86B39A', 0.16);
  // small worn tiles (terracotta and cream, a border round the edge)
  for (let ix = 0; ix < 17; ix++) for (let iz = 0; iz < 20; iz++) {
    const x0 = -3.5 + 0.04 + ix * 0.41, z0 = -4 + 0.04 + iz * 0.4;
    const edge = ix === 0 || ix === 16 || iz === 0;
    const col = edge ? '#8E4A35' : (ix + iz) % 2 ? jitter('#B9694C', 0.08, ix * 31 + iz) : jitter('#E2CFAE', 0.05, ix * 17 + iz);
    S.boxMin(x0, 0, z0, x0 + 0.37, 0.012, z0 + 0.36, col);
  }
  for (let x = -3.3; x < 3.4; x += 0.45) {
    S.box(x, 2.72, -hd + 0.02, 0.18, 0.06, 0.02, C.goldD);
    S.box(x + 0.2, 2.72, -hd + 0.02, 0.05, 0.05, 0.02, GREEN);
  }
  ctx.floorPatch(-2.0, -1.9, 2.6, 0.5, '#B98C6E');
  ctx.floorPatch(0, 3.0, 1.6, 1.2, '#C7A988');

  ctx.window({ x: 1.6, y: 1.75, w: 1.6, h: 1.1, frame: GREEN, sill: C.woodL, curtain: '#D9C38F' });
  // counter (kit) + snack cabinet, cups, cash tin, thermos, hanging snack strings
  ctx.place(kit.counter({ w: 2.4, d: 0.7, h: 1.0, top: C.woodL, body: GREEN, panel: C.cream }), -2.0, -2.7);
  ctx.put(-2.0, -2.7, 0, null, (v, L) => {
    const x0 = -1.1, x1 = -0.2, y0 = 1.0, y1 = 1.46;
    v.boxMin(x0, y0, -0.28, x1, y0 + 0.03, 0.2, C.woodD);
    v.boxMin(x0, y1 - 0.03, -0.28, x1, y1, 0.2, C.woodD);
    for (const xx of [x0, x1 - 0.03]) for (const zz of [-0.28, 0.17]) v.boxMin(xx, y0, zz, xx + 0.03, y1, zz + 0.03, C.woodD);
    v.boxMin(x0 + 0.03, y0 + 0.03, 0.18, x1 - 0.03, y1 - 0.03, 0.19, '#D7E7E6');
    v.boxMin(x0 + 0.03, y0 + 0.22, -0.26, x1 - 0.03, y0 + 0.24, 0.17, C.woodL);
    for (let i = 0; i < 5; i++) {
      v.box(x0 + 0.12 + i * 0.16, y0 + 0.07, 0.0, 0.11, 0.05, 0.14, ['#D9A44A', '#E7C06A', '#C98A36'][i % 3]);
      v.box(x0 + 0.12 + i * 0.16, y0 + 0.28, 0.0, 0.1, 0.06, 0.1, ['#F1E4C0', '#C46A3A', '#E8C27A'][i % 3]);
    }
    v.boxMin(0.0, 1.0, -0.2, 0.55, 1.02, 0.2, C.tinL);
    for (let i = 0; i < 6; i++) cupInto(v, 0.08 + (i % 3) * 0.17, 1.02, -0.1 + Math.floor(i / 3) * 0.17, i === 4 ? '#E6EEF0' : C.white);
    jarInto(v, 0.72, 1.0, -0.05, 0.9, '#F4F0E6', { label: null });
    v.box(0.95, 1.2, 0.0, 0.02, 0.4, 0.02, C.ironL);
    v.box(0.95, 1.38, 0.08, 0.02, 0.02, 0.16, C.ironL);
    prism(v, 0.95, 1.29, 0.16, 0.06, 0.03, 0.14, '#E8DCC0');
    v.boxMin(-0.05, 1.0, 0.1, 0.2, 1.06, 0.28, '#C24A3A');
    prism(v, 1.08, 1.13, -0.18, 0.07, 0.07, 0.26, '#3F79B5');
    prism(v, 1.08, 1.28, -0.18, 0.05, 0.05, 0.04, C.tinL);
    v.boxMin(-1.2, 0.98, 0.36, 1.2, 0.995, 0.37, C.ropeD);
    for (let i = 0; i < 9; i++) {
      const xx = -1.05 + i * 0.26;
      v.box(xx, 0.93, 0.37, 0.006, 0.08, 0.006, C.ropeD);
      v.box(xx, 0.82, 0.375, 0.12, 0.15, 0.015, ['#E2B33C', '#C8323C', '#2F7C7A', '#E0795A', '#7FB0CF'][i % 5]);
      v.box(xx, 0.82, 0.385, 0.07, 0.05, 0.004, C.white);
    }
    const f = hangingLampInto(v, 0.5, 3.0, 0.0, 0.7);
    L.glow(f.x, f.y, f.z, 0.1, 0.13, 0.1);
    L.pool(0.5, 0.0, 0.7, 1.012);
  });
  // brazier + big kettle at the counter's open right end, where the tea uncle works in view of the room (steam)
  ctx.put(-0.3, -3.45, 0, [0.6, 0.6], (v, L) => {
    v.boxMin(-0.42, 0, -0.32, 0.42, 0.06, 0.4, C.brickD);
    const { spout } = stoveInto(v, L, { s: 1.15 });
    L.emit('steam', spout.x, spout.y + 0.05, spout.z, { n: 4, rise: 0.7, size: 0.09, speed: 0.4 });
    L.emit('steam', 0, 0.85, 0, { n: 2, rise: 0.5, size: 0.06, speed: 0.3 });
    L.pool(0, 0.3, 0.6);
  });
  S.boxMin(-3.5, 1.0, -hd + 0.001, -2.6, 2.4, -hd + 0.015, '#CFC1A4');
  S.boxMin(-3.4, 1.3, -hd + 0.002, -2.75, 2.1, -hd + 0.018, '#BCAE92');
  // teapot shelf on the back wall (x -0.8, y 1.6), radio and tins; a second shelf of pots
  ctx.put(-0.8, -hd + 0.02, 0, null, (v) => {
    const y = wallShelfInto(v, 0, 1.6, 0, 1.5);
    teapotInto(v, -0.58, y, 0.12, 1.1);
    teapotInto(v, -0.36, y, 0.12, 0.9, C.terraD);
    teapotInto(v, -0.14, y, 0.12, 1.0, '#8A4A2A');
    tinInto(v, 0.08, y, 0.12, 1, C.red);
    tinInto(v, 0.2, y, 0.12, 1, '#2F7C7A');
    tinInto(v, 0.32, y, 0.12, 0.85, C.mustard);
    v.boxMin(0.42, y, 0.04, 0.7, y + 0.17, 0.22, '#7A4A2A');
    v.boxMin(0.45, y + 0.03, 0.22, 0.58, y + 0.14, 0.225, '#D9C9A0');
    v.box(0.64, y + 0.085, 0.225, 0.05, 0.05, 0.01, C.gold);
    boxR(v, 0.62, y + 0.35, 0.1, 0.012, 0.4, 0.012, C.tinL, 0, 0, -0.35);
    const y2 = wallShelfInto(v, 0, 2.15, 0, 1.3, 0.22, C.woodL);
    for (let i = 0; i < 5; i++) potInto(v, -0.5 + i * 0.25, y2, 0.11, 0.42, i % 2 ? 'terra' : 'cream');
  });
  const menu = A.region(420, 200, (g, w, h) => chalkBoard(g, w, h, [
    { t: 'လက်ဖက်ရည် · ကော်ဖီ', s: 34 }, { t: 'ရေနွေးကြမ်း အလကား', s: 28, c: '#F2D58A' }, { t: 'Tea · Coffee · plain tea free', s: 20, f: 'serif', w: 600, c: '#CFE0D4' },
  ]));
  ctx.wallQuad(menu, 'back', -2.0, 2.35, 1.5, 0.7, 0.05);
  clockOn(ctx, 0.35, 2.45);
  calendarOn(ctx, 'left', -1.0, 1.5, 'ပြက္ခဒိန်', { ring7: true, nextRing: 3 });
  const pic = A.region(220, 160, (g, w, h) => {
    g.fillStyle = '#E9D2A2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#9CC6DD'; g.fillRect(10, 10, w - 20, h * 0.5);
    g.fillStyle = '#C9784A'; g.beginPath(); g.moveTo(10, h - 10); g.lineTo(w * 0.35, h * 0.4); g.lineTo(w * 0.6, h - 10); g.fill();
    g.fillStyle = '#7FA35A'; g.fillRect(10, h * 0.72, w - 20, h * 0.28 - 10);
    g.fillStyle = C.terraD; g.fillRect(w * 0.68, h * 0.38, 18, h * 0.4);
  });
  ctx.wallQuad(pic, 'right', -2.2, 1.75, 0.8, 0.58, 0.09);
  S.boxMin(3.43, 1.42, -2.68, 3.5, 2.08, -1.72, C.goldD);
  // window table + two stools + oil lamp + teapot
  ctx.put(1.6, -2.6, 0, [1.0, 0.7], (v, L) => {
    lowTableInto(v, 0, 0, 1.0, 0.7, 0.45, C.woodL, C.woodD, 3);
    const f = oilLampInto(v, -0.32, 0.45, -0.18);
    L.glow(f.x, f.y, f.z, 0.03, 0.06, 0.03);
    L.pool(-0.32, -0.18, 0.5, 0.46);
    teapotInto(v, 0.1, 0.45, -0.1, 1.1);
    cupInto(v, -0.25, 0.45, 0.12);
    cupInto(v, 0.3, 0.45, 0.12);
    v.box(0.05, 0.455, 0.15, 0.18, 0.012, 0.12, '#E7D9B5');
  });
  for (const [x, z] of [[2.35, -2.6], [0.85, -2.6]]) ctx.put(x, z, 0, [0.34, 0.34], (v) => stoolInto(v, 0, 0, 0.3, '#5E8F6E', C.woodD, 0.32));
  // the carters' beam: a stout timber bracket out of the right wall (wall post, arm, brace) with the iron hook,
  // its rope loop and the steelyard hanging from it. On the wall, not mid-floor: nothing stands across the room.
  const HK = { x: 2.72, y: 1.66, z: -0.32 };
  ctx.put(hw - 0.02, HK.z, 0, null, (v) => {
    v.boxMin(-0.12, 0.95, -0.1, 0, 1.86, 0.1, C.woodD); // wall post (the side wall is 1.86 m here)
    v.boxMin(-0.13, 0.95, -0.11, -0.11, 1.0, 0.11, '#4A3424');
    v.boxMin(-0.9, 1.72, -0.07, 0, 1.84, 0.07, C.woodD); // the beam arm
    v.boxMin(-0.92, 1.7, -0.08, -0.82, 1.86, 0.08, '#4A3424'); // end cap
    boxR(v, -0.32, 1.48, 0, 0.62, 0.07, 0.06, C.woodD, 0, 0, -0.68); // diagonal brace
    for (const x of [-0.05, -0.6]) v.box(x, 1.78, 0.072, 0.03, 0.03, 0.01, C.iron); // bolt heads
    // rope lashing round the arm, the iron hook under it
    for (let i = 0; i < 4; i++) v.box(-0.78 + i * 0.03, 1.78, 0, 0.022, 0.15, 0.16, i % 2 ? C.rope : C.ropeD);
    v.box(-0.78, 1.68, 0, 0.03, 0.06, 0.03, C.iron);
    v.box(-0.78, 1.63, 0.03, 0.03, 0.03, 0.08, C.iron);
    v.box(-0.78, 1.66, 0.065, 0.03, 0.05, 0.02, C.iron);
    // a coil of spare rope and a paper tally slip on the post
    prism(v, -0.06, 1.25, 0.0, 0.1, 0.1, 0.06, C.rope, 10, 0, Math.PI / 2);
    v.box(-0.125, 1.5, 0.0, 0.004, 0.14, 0.1, '#E8D9B0');
  });
  const steelyard = ctx.part((v) => {
    v.box(0, -0.12, 0, 0.012, 0.24, 0.012, C.ironL);
    v.box(0.0, -0.25, 0, 0.62, 0.025, 0.025, C.brassD);
    for (let i = 0; i < 9; i++) v.box(-0.2 + i * 0.06, -0.235, 0.013, 0.005, 0.012, 0.004, C.ink);
    v.box(0.22, -0.31, 0, 0.06, 0.08, 0.06, C.iron);
    v.box(-0.27, -0.33, 0, 0.012, 0.15, 0.012, C.ironL);
    v.box(-0.27, -0.41, 0, 0.05, 0.03, 0.02, C.iron);
  }, HK.x, HK.y, HK.z);
  ctx.animate((dt, t) => { steelyard.rotation.z = Math.sin(t * 0.9) * 0.04; steelyard.rotation.x = Math.sin(t * 0.7 + 1) * 0.03; });
  // two more low tables with stools, lamps, cups
  for (const [tx, tz, seed] of [[-1.6, 0.9, 5], [1.9, 1.3, 8]]) {
    ctx.put(tx, tz, 0, [0.9, 0.62], (v, L) => {
      lowTableInto(v, 0, 0, 0.9, 0.62, 0.45, C.wood, C.woodD, seed);
      const f = oilLampInto(v, 0.25, 0.45, -0.14);
      L.glow(f.x, f.y, f.z, 0.03, 0.06, 0.03);
      L.pool(0.25, -0.14, 0.45, 0.46);
      cupInto(v, -0.2, 0.45, 0.08);
      if (seed === 5) { cupInto(v, 0.05, 0.45, 0.12); v.box(-0.05, 0.47, -0.1, 0.22, 0.03, 0.14, C.tinL); for (let i = 0; i < 3; i++) v.box(-0.12 + i * 0.07, 0.5, -0.1, 0.05, 0.03, 0.09, '#D9A44A'); }
    });
    for (const sx of [-1, 1]) ctx.put(tx + sx * 0.6, tz, 0, null, (v) => stoolInto(v, 0, 0, 0.28, C.wood, C.woodD, 0.3));
    ctx.put(tx, tz + 0.5, 0, null, (v) => stoolInto(v, 0, 0, 0.28, '#5E8F6E', C.woodD, 0.3));
  }
  // stack of stools by the door
  ctx.put(3.0, 3.0, 0, [0.42, 0.42], (v) => {
    for (let i = 0; i < 4; i++) {
      const y = i * 0.18;
      v.boxMin(-0.17, y, -0.17, 0.17, y + 0.04, 0.17, i % 2 ? '#5E8F6E' : C.wood);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * 0.13, y + 0.1, sz * 0.13, 0.04, 0.12, 0.04, C.woodD);
    }
  });
  ctx.put(3.2, -3.6, 0, null, (v) => { boxR(v, 0, 0.75, 0, 0.03, 1.4, 0.03, C.bambooD, 0.08, 0, 0.12); boxR(v, -0.07, 0.12, 0.05, 0.22, 0.26, 0.06, C.straw, 0.08, 0, 0.12); });
  ctx.put(-2.3, -3.55, 0, null, (v) => { prism(v, 0, 0.14, 0, 0.15, 0.12, 0.28, C.tin); prism(v, 0, 0.27, 0, 0.13, 0.13, 0.01, C.water); });
  ctx.put(3.12, 0.6, -Math.PI / 2, [1.6, 0.36], (v) => { benchInto(v, 1.6, 0.4, 0.36, C.woodL); v.box(0.5, 0.45, 0, 0.32, 0.08, 0.22, C.maroon); v.box(0.5, 0.5, 0, 0.26, 0.03, 0.18, C.gold); });
  ctx.put(2.1, -hd + 0.12, 0, null, (v) => { potInto(v, 0, 1.11, 0, 0.45, 'terra'); v.box(0, 1.36, 0, 0.16, 0.12, 0.16, C.leaf); v.box(0.05, 1.45, 0.02, 0.1, 0.1, 0.1, C.leafD); });
  ctx.put(0.95, -hd + 0.12, 0, null, (v) => { cupInto(v, 0, 1.11, 0, C.white); });
  // lived-in front half: the drinking-water stand by the door, the carters' bundles, a broom, the shop cat on the bench
  ctx.put(-2.95, 2.75, 0, [0.5, 0.5], (v) => waterJarInto(v, 0, 0, 1.0));
  ctx.put(-2.95, 1.85, 0, [0.6, 0.6], (v) => {
    sackInto(v, -0.1, 0, 0.9, C.cloth);
    sackInto(v, 0.18, 0.12, 0.8, '#D8C7A0');
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; v.box(0.12 + Math.cos(a) * 0.14, 0.03, -0.18 + Math.sin(a) * 0.14, 0.07, 0.05, 0.07, i % 2 ? C.rope : C.ropeD); }
  });
  ctx.put(-3.12, 0.3, 0, null, (v) => broomInto(v, 0, 0, -0.16));
  ctx.put(3.1, 0.05, 0, null, (v) => catInto(v, 0, 0.4, 0, 1.2, '#E59A45', '#A8642A')); // the shop cat, asleep on the bench end
  const notice = A.region(200, 260, (g, w, h) => { panel(g, w, h, { bg: '#F4ECD6', border: C.maroon, bw: 8, r: 6 }); lines(g, [{ t: 'ဈေးနေ့', s: 30, c: C.maroon }, { t: '၇ ရက် တစ်ခါ', s: 24 }, { t: 'ကြိုဆိုပါတယ်', s: 22, c: '#3E7A5A' }], w, h); });
  ctx.wallQuad(notice, 'left', -2.4, 1.6, 0.4, 0.52, 0.075);
  if (opts.variant === 'dusk' || opts.dusk) {
    ctx.put(2.2, -1.9, 0, [0.5, 0.4], (v) => { baleInto(v, 0, 0, 0, 0.5, 0.32, 0.38, 4); waterCanInto(v, 0.42, 0, 0.05, 0.9); });
  }
  ctx.spot('teauncle', -0.35, -2.8, 0);
  ctx.spot('teaunclePour', -0.3, -2.9, Math.PI);
  ctx.spot('kophyo', 2.35, -2.6, -Math.PI / 2, { seat: 0.3 });
  ctx.spot('maya', 0.85, -2.6, Math.PI / 2, { seat: 0.3 });
  ctx.spot('kophyoHold', 2.45, 0.2, [2.72, -0.32]);
  ctx.spot('mayaHold', 1.45, 0.15, [2.45, 0.0]);
  ctx.spot('carter1', -2.2, 0.9, Math.PI / 2, { seat: 0.28 });
  ctx.spot('carter2', -1.0, 0.9, -Math.PI / 2, { seat: 0.28 });
  ctx.spot('maungnge', 0.3, 2.3, [-2.0, -2.0]);
  ctx.spot('mayaCounter', -0.9, -1.75, [-0.35, -2.8]);
  ctx.spot('door', 0, 3.2, Math.PI);
  ctx.tap('teauncle', -0.6, -1.85, [-0.35, -2.8], NAME('လက်ဖက်ရည်ဆိုင် ဦးလေး', 'the tea uncle'));
  ctx.tap('calendar', -2.7, -1.0, [-3.5, -1.0], NAME('ပြက္ခဒိန်', 'the calendar'), 0.8);
  ctx.tap('hook', 2.2, 0.35, [2.72, -0.32], NAME('ချိတ်', "the carters' hook"), 0.8);
  ctx.tap('windowTable', 1.6, -1.7, [1.6, -2.6], NAME('ပြတင်းဘေး စားပွဲ', 'the window table'), 0.8);
  ctx.tap('kettle', 0.25, -2.45, [-0.3, -3.45], NAME('ကရားကြီး', 'the big kettle'), 0.7);
  const api = ctx.finish('square');
  api.steelyard = steelyard;
  return api;
}

// =============================================================================================
// paperstore · the paper store's weigh room (kiln square, north side, west end) · D10 (D12)
// =============================================================================================
function buildPaperStore(opts = {}) {
  const ctx = scaffold({ id: 'paperstore', name: NAME('စက္ကူဆိုင်', 'The paper store'), width: 7, depth: 8, height: 3, wall: '#BFA27A', wainscot: '#5E4330', trim: C.brassD, floor: 'planks', floorColor: '#7A583A', background: '#E6D8BE', ...opts });
  const { S, A, hd } = ctx;
  const damp = !!opts.rain || opts.day === 12;
  ctx.plankSeams(0.14, 0.98, '#4A3424', 0.22);
  for (let i = 0; i < 6; i++) S.box(-2.6 + i * 1.05, 2.2 + hash(i) * 0.3, -hd + 0.01, 0.3 + hash(i + 4) * 0.4, 0.2, 0.012, '#AE916A');
  // bale stacks: left wall, right wall, back wall leaving the aisle at x = 0
  let seed = 1;
  const stack = (x, z, ry, n, w = 0.86, d = 0.66) => ctx.put(x, z, ry, [w, d], (v) => {
    let y = 0;
    for (let i = 0; i < n; i++) {
      const h = 0.3 + hash(seed * 3 + i) * 0.1;
      const off = (hash(seed + i * 5) - 0.5) * 0.06;
      baleInto(v, off, y, (hash(seed * 2 + i) - 0.5) * 0.04, w - 0.04, h, d - 0.04, seed * 11 + i, damp && i === 0);
      y += h + 0.016;
    }
    seed++;
  });
  [-3.05, -2.15, -1.25, -0.35, 0.55, 1.45].forEach((z, i) => stack(-3.03, z, Math.PI / 2, i < 3 ? 7 : i < 5 ? 4 : 3));
  [-3.05, -2.15, -1.25, -0.35, 0.55].forEach((z, i) => stack(3.03, z, -Math.PI / 2, i < 3 ? 7 : i < 4 ? 4 : 3));
  for (const x of [-2.12, -1.22, 1.22, 2.12]) stack(x, -3.55, 0, 7);
  // the shut plank door to the sheds at the end of the back aisle
  S.boxMin(-0.55, 0, -hd, 0.55, 2.2, -hd + 0.06, '#4A3424');
  for (let i = 0; i < 5; i++) S.boxMin(-0.5 + i * 0.2, 0.02, -hd + 0.06, -0.31 + i * 0.2, 2.12, -hd + 0.09, jitter(C.woodD, 0.08, i));
  for (const y of [0.45, 1.65]) S.boxMin(-0.48, y, -hd + 0.09, 0.48, y + 0.12, -hd + 0.12, C.woodD);
  S.box(0.38, 1.05, -hd + 0.13, 0.06, 0.2, 0.04, C.iron);
  S.box(0.3, 1.05, -hd + 0.15, 0.2, 0.04, 0.03, C.iron);
  // the rope across the aisle at z -2.4 (solid: nobody passes it)
  ctx.put(0, -2.4, 0, [1.3, 0.24], (v) => {
    for (const sx of [-1, 1]) {
      prism(v, sx * 0.55, 0.03, 0, 0.13, 0.15, 0.06, C.iron);
      prism(v, sx * 0.55, 0.5, 0, 0.035, 0.035, 0.94, C.woodD);
      prism(v, sx * 0.55, 0.99, 0, 0.05, 0.04, 0.05, C.brass);
    }
    for (let i = 0; i < 10; i++) {
      const u = i / 9, x = -0.55 + u * 1.1, y = 0.9 - Math.sin(u * Math.PI) * 0.16;
      boxR(v, x, y, 0, 0.13, 0.03, 0.03, i % 2 ? C.rope : C.ropeD, 0, 0, (u - 0.5) * 0.6);
    }
  });
  const ropeCard = A.region(160, 90, (g, w, h) => { panel(g, w, h, { bg: C.paper, border: C.red, bw: 5, r: 6 }); lines(g, [{ t: 'မဝင်ရ', s: 30, c: C.red }], w, h); });
  A.quad(ropeCard, 0.24, 0.13, M(0, 0.62, -2.38));
  // the joist + his beam scale (moving part: a slow sway) + the weights box on a stool
  ctx.put(-2.35, 0.4, 0, null, (v) => {
    v.box(0, 1.42, 0, 0.14, 2.84, 0.14, C.woodD);
    v.boxMin(-0.1, 0, -0.1, 0.1, 0.12, 0.1, '#3A2818');
    v.boxMin(-0.07, 2.74, -0.05, 1.15, 2.82, 0.05, C.woodD);
    boxR(v, 0.3, 2.52, 0, 0.6, 0.06, 0.05, C.woodD, 0, 0, 0.7);
  });
  ctx.circle(-2.35, 0.4, 0.13);
  ctx.put(-2.1, 0.9, 0, [0.4, 0.4], (v) => {
    stoolInto(v, 0, 0, 0.45, C.woodL, C.woodD, 0.38);
    v.boxMin(-0.16, 0.45, -0.12, 0.16, 0.53, 0.12, '#6A3E24');
    v.boxMin(-0.165, 0.53, -0.125, 0.165, 0.545, -0.06, '#5A3420');
    const ws = [[-0.1, 0.05, 0.035], [-0.03, 0.04, 0.03], [0.03, 0.035, 0.026], [0.08, 0.028, 0.02], [0.12, 0.022, 0.016]];
    for (const [x, r, h] of ws) { prism(v, x, 0.53 + h / 2 + 0.01, 0.02, r, r, h + 0.02, C.brass); prism(v, x, 0.56 + h, 0.02, r * 0.35, r * 0.35, 0.02, C.brassL); }
  });
  const scale = ctx.part((v) => {
    v.box(0, -0.25, 0, 0.02, 0.5, 0.02, C.ironL);
    v.box(0, -0.52, 0, 1.0, 0.05, 0.05, C.brassD);
    v.box(0, -0.48, 0, 0.06, 0.12, 0.04, C.brass);
    for (const sx of [-1, 1]) {
      for (const a of [0, 2.1, 4.2]) boxR(v, sx * 0.48 + Math.sin(a) * 0.08, -0.85, Math.cos(a) * 0.08, 0.008, 0.68, 0.008, C.ropeD, Math.cos(a) * 0.12, 0, -Math.sin(a) * 0.12);
      prism(v, sx * 0.48, -1.2, 0, 0.2, 0.16, 0.05, C.brass, 10);
      prism(v, sx * 0.48, -1.17, 0, 0.18, 0.18, 0.01, C.brassL, 10);
    }
    baleInto(v, -0.48, -1.165, 0, 0.26, 0.16, 0.2, 77);
  }, -1.4, 2.72, 0.4);
  ctx.circle(-1.4, 0.4, 0.62);
  ctx.animate((dt, t) => { scale.rotation.z = Math.sin(t * 0.6) * 0.018; });
  // ledger desk (kit desk) + chair + ledger, abacus, ink, receipts spike, an unlit hanging lamp
  ctx.place(kit.desk({ w: 1.5, d: 0.75, h: 0.8, top: '#8A5E3C', body: '#5E4330' }), 1.8, 0.6);
  ctx.place(kit.chair({ color: '#7A5434', wood: '#4A3424' }), 1.8, -0.15, Math.PI);
  const ledger = A.region(256, 160, (g, w, h) => {
    g.fillStyle = '#F2EAD2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#E4D9BC'; g.fillRect(w / 2 - 3, 0, 6, h);
    scribble(g, 8, 6, w / 2 - 16, h - 12, { rows: 9, seed: 3, ink: '#2E3B5A' });
    scribble(g, w / 2 + 8, 6, w / 2 - 16, h - 12, { rows: 9, seed: 9, ink: '#2E3B5A' });
  });
  ctx.put(1.8, 0.6, 0, null, (v, L) => {
    v.boxMin(-0.42, 0.8, -0.2, 0.12, 0.815, 0.16, '#3F2A1E');
    L.quad(ledger, 0.5, 0.32, -0.15, 0.818, -0.02, 0, -Math.PI / 2);
    v.boxMin(0.22, 0.8, -0.22, 0.62, 0.83, 0.04, '#5A3420');
    v.boxMin(0.22, 0.83, -0.22, 0.24, 0.86, 0.04, '#5A3420');
    v.boxMin(0.6, 0.83, -0.22, 0.62, 0.86, 0.04, '#5A3420');
    for (let r = 0; r < 5; r++) { v.boxMin(0.24, 0.84, -0.19 + r * 0.05, 0.6, 0.845, -0.185 + r * 0.05, C.ironL); for (let b = 0; b < 4; b++) v.box(0.28 + b * 0.04 + (r % 2) * 0.12, 0.845, -0.188 + r * 0.05, 0.03, 0.025, 0.03, b === 0 ? C.red : '#2A2118'); }
    prism(v, 0.45, 0.83, 0.18, 0.04, 0.045, 0.06, '#1E2E44');
    boxR(v, 0.5, 0.88, 0.18, 0.012, 0.12, 0.012, C.paper, 0, 0, -0.4);
    v.box(-0.6, 0.81, 0.15, 0.06, 0.02, 0.06, C.iron);
    v.box(-0.6, 0.92, 0.15, 0.01, 0.22, 0.01, C.iron);
    for (let i = 0; i < 5; i++) v.box(-0.6, 0.83 + i * 0.025, 0.15, 0.09, 0.006, 0.07, i % 2 ? C.paper : '#F0E2C0');
    const f = hangingLampInto(v, 0, 2.72, 0.0, 0.8);
    L.glow(f.x, f.y, f.z, 0.09, 0.12, 0.09);
    L.pool(0, 0, 0.8, 0.83);
  });
  const lic = A.region(200, 150, (g, w, h) => { panel(g, w, h, { bg: '#F4ECD6', border: C.goldD, bw: 10, r: 4 }); lines(g, [{ t: 'လိုင်စင်', s: 30 }, { t: 'စက္ကူ ဝယ်ယူရေး', s: 20, c: '#5A4A3A' }], w, h); g.fillStyle = C.red; g.beginPath(); g.arc(w * 0.8, h * 0.74, 12, 0, 7); g.fill(); });
  S.boxMin(-0.3, 2.28, -hd, 0.3, 2.76, -hd + 0.04, C.goldD);
  ctx.wallQuad(lic, 'back', 0, 2.52, 0.52, 0.4, 0.05);
  const price = A.region(180, 120, (g, w, h) => chalkBoard(g, w, h, [{ t: 'စက္ကူဟောင်း', s: 26 }, { t: 'တစ်ပိဿာ ...', s: 22, c: '#F2D58A' }]));
  A.quad(price, 0.4, 0.27, M(-2.62, 1.55, -0.35, Math.PI / 2 - 0.2));
  // watering can by the scale, Ko Phyo's fresh bales by the door, twine coil, scraps
  ctx.put(-1.0, 1.25, 0, [0.4, 0.3], (v) => waterCanInto(v, 0, 0, 0, 1.0));
  ctx.put(-2.3, 2.15, 0, [0.9, 0.62], (v) => {
    baleInto(v, -0.2, 0, 0, 0.5, 0.32, 0.4, 201);
    baleInto(v, 0.25, 0, 0.02, 0.44, 0.3, 0.38, 202);
    baleInto(v, 0.0, 0.33, 0.0, 0.48, 0.28, 0.38, 203);
  });
  for (let i = 0; i < 9; i++) boxR(S, -1.8 + hash(i) * 3.4, 0.006, -1.6 + hash(i + 20) * 3.6, 0.12, 0.006, 0.09, i % 3 ? C.news : C.kraft, 0, hash(i + 5) * 3, 0);
  prism(S, 0.9, 0.03, -1.5, 0.14, 0.14, 0.06, C.rope, 10);
  prism(S, 0.9, 0.065, -1.5, 0.06, 0.06, 0.01, C.ropeD, 10);
  ctx.spot('kyinyein', 1.8, -0.1, 0);
  ctx.spot('kyinyeinScale', -0.85, 0.55, [-1.4, 0.4]);
  ctx.spot('kophyo', -1.6, 2.5, [0.2, 1.8]);
  ctx.spot('maya', 0.2, 1.8, [-0.85, 0.55]);
  ctx.spot('door', 0, 3.2, Math.PI);
  ctx.tap('scale', -1.0, 1.1, [-1.4, 0.4], NAME('ချိန်ခွင်', 'the beam scale'), 0.8);
  ctx.tap('ledger', 1.8, 1.45, [1.8, 0.6], NAME('စာရင်းစာအုပ်', 'the ledger'), 0.8);
  ctx.tap('rope', 0, -1.7, [0, -2.4], NAME('ကြိုး', 'the rope'), 0.7);
  ctx.tap('bales', -2.0, -0.6, [-3.0, -0.6], NAME('စက္ကူထုပ်တွေ', 'the bales'), 0.8);
  ctx.tap('weights', -2.1, 1.6, [-2.1, 0.9], NAME('အလေးတုံးတွေ', 'the weights'), 0.6);
  return ctx.finish('square');
}

// =============================================================================================
// packroom · the big kiln's packing room (kiln shed) · D10 (D12 optional)
// =============================================================================================
function buildPackRoom(opts = {}) {
  const ctx = scaffold({ id: 'packroom', name: NAME('အိုးဖိုထဲ', 'The kiln packing room'), width: 6, depth: 6, height: 3, wall: '#F1ECE0', wainscot: C.brick, trim: C.terraD, floor: 'plain', floorColor: '#9A7A5A', background: '#EADFC8', ...opts });
  const { S, A, hd } = ctx;
  ctx.bricks(0.14, 0.98, [C.brick, C.brickL, '#97493A', C.brickD]);
  ctx.floorPatch(-0.4, -1.4, 2.6, 1.2, '#8A6A4C', 0.006);
  for (let i = 0; i < 16; i++) boxR(S, -2.6 + hash(i) * 5, 0.008, -2.6 + hash(i + 30) * 5.2, 0.16, 0.006, 0.012, C.strawD, 0, hash(i * 3) * 3, 0);
  S.boxMin(2.2, 1.0, -hd + 0.001, 3.0, 2.8, -hd + 0.012, '#D8D0BE');
  ctx.window({ x: 1.4, y: 2.25, w: 0.8, h: 0.55, frame: C.woodD, sill: C.wood, bars: 2 });
  // warm brick ledge along the right wall (the kiln's back wall comes through)
  ctx.put(2.55, -1.0, 0, [0.62, 2.8], (v, L) => {
    for (let row = 0; row < 9; row++) for (let k = 0; k < 12; k++) {
      const z0 = -1.4 + k * 0.26 - (row % 2) * 0.13;
      const za = Math.max(-1.4, z0 + 0.006), zb = Math.min(1.4, z0 + 0.254);
      if (zb > za) v.boxMin(-0.3, row * 0.1, za, 0.3, row * 0.1 + 0.094, zb, [C.brick, C.brickL, '#97493A', C.brickD][(row * 3 + k) % 4]);
    }
    v.boxMin(-0.33, 0.9, -1.42, 0.33, 0.96, 1.42, '#8E4A35');
    v.boxMin(-0.28, 0.96, -1.38, 0.28, 0.965, 0.2, '#5E3A2C');
    L.glow(-0.305, 0.25, -0.9, 0.01, 0.025, 0.5);
    L.glow(-0.305, 0.45, -1.05, 0.01, 0.02, 0.3);
    L.glow(-0.305, 0.65, -0.8, 0.01, 0.02, 0.4);
    L.pool(-0.6, -0.9, 0.8);
    L.emit('ember', 0, 1.0, -0.8, { n: 3, rise: 0.6, spread: 0.2, size: 0.05, speed: 0.25 });
    potInto(v, 0, 0.96, -1.15, 0.55, 'terra');
    potInto(v, 0.05, 0.96, 0.75, 0.5, 'terra');
  });
  // packing bench (2.0 × 0.7 × 0.8) with straw and five pots in a row
  ctx.put(-0.4, -1.9, 0, [2.0, 0.7], (v) => {
    v.boxMin(-1.0, 0.72, -0.35, 1.0, 0.8, 0.35, C.woodL);
    for (let i = 0; i < 5; i++) v.boxMin(-0.98 + i * 0.4, 0.795, -0.33, -0.62 + i * 0.4, 0.802, 0.33, jitter(C.woodL, 0.08, i));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * 0.9, 0.36, sz * 0.27, 0.08, 0.72, 0.08, C.woodD);
    v.boxMin(-0.92, 0.18, -0.3, 0.92, 0.22, 0.3, C.woodD);
    strawInto(v, 0, 0.8, 0, 1.9, 0.6, 0.1, 12);
    for (let i = 0; i < 5; i++) potInto(v, -0.72 + i * 0.36, 0.84, 0.02, 0.62, 'terra');
    strawInto(v, -0.2, 0.22, 0, 1.2, 0.5, 0.14, 19);
  });
  // chalk tally on the back wall (made · cracked), numerals only
  const tally = A.region(380, 270, (g, w, h) => {
    chalkBoard(g, w, h, []);
    g.fillStyle = '#F2EFE6';
    g.font = `700 22px ${FONT_MY}`;
    g.textAlign = 'left';
    g.fillText('လုပ် · ကွဲ', 20, 34);
    const rows = ['၇ · ၃', '၆ · ၂', '၄ · ၀', '၅ · ၀', '၆ · ၁', '၅ · ၀', '၅ · ၀', '၅ · ၀', '၅ · ၀', '၅ · ၀', '၅ · ၀', '၅ · ၀'];
    g.font = `600 19px ${FONT_MY}`;
    rows.forEach((t, i) => g.fillText(t, 22 + Math.floor(i / 6) * 180, 72 + (i % 6) * 32));
    g.strokeStyle = '#E8E4D8'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(w / 2, 50); g.lineTo(w / 2, h - 20); g.stroke();
  });
  ctx.wallQuad(tally, 'back', -1.75, 1.55, 1.4, 1.0, 0.04);
  S.boxMin(-2.48, 0.98, -hd, -1.02, 1.03, -hd + 0.09, C.woodD);
  S.box(-1.3, 1.045, -hd + 0.05, 0.08, 0.025, 0.025, C.white);
  // shelf of cracked trials on the left wall (kit.shelf, books off)
  ctx.put(-2.76, -0.6, Math.PI / 2, [1.4, 0.42], (v) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * 0.66, 0.75, sz * 0.17, 0.05, 1.5, 0.05, C.woodD);
    for (const y of [0.08, 0.62, 1.16]) { v.boxMin(-0.7, y - 0.035, -0.2, 0.7, y, 0.2, C.wood); v.boxMin(-0.7, y - 0.04, 0.17, 0.7, y + 0.005, 0.2, C.woodD); }
    for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) potInto(v, -0.42 + i * 0.42 + (r % 2) * 0.06, [0.08, 0.62, 1.16][r], 0.0, r === 0 ? 0.6 : 0.5, r === 2 ? 'raw' : 'terra', { cracked: (i + r) % 2 === 0 });
    const r = 0.5;
    v.box(0.0, 1.5, -0.05, 0.4, 0.03, 0.03, C.ropeD);
  });
  // a coil of straw rope and a lamp on nails, a water jar by the ledge
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; S.box(0.95 + Math.cos(a) * 0.16, 1.75 + Math.sin(a) * 0.16, -hd + 0.05, 0.08, 0.08, 0.05, i % 2 ? C.rope : C.ropeD); }
  S.box(0.95, 1.93, -hd + 0.04, 0.03, 0.03, 0.06, C.iron);
  ctx.put(2.55, 0.95, 0, [0.48, 0.48], (v) => waterJarInto(v, 0, 0, 0.95));
  // straw bales front-left, two carrying crates front-right, a shard heap back-right
  ctx.put(-2.15, 1.55, 0, [1.1, 0.7], (v) => {
    for (const [x, y, z] of [[-0.25, 0, 0], [0.3, 0, 0.05], [0.02, 0.32, 0.0]]) {
      v.boxMin(x - 0.3, y, z - 0.25, x + 0.3, y + 0.31, z + 0.25, C.straw);
      for (let i = 0; i < 6; i++) v.boxMin(x - 0.3, y + 0.03 + i * 0.05, z + 0.25, x + 0.3, y + 0.045 + i * 0.05, z + 0.262, i % 2 ? C.strawD : C.strawL);
      for (const k of [-0.15, 0.15]) v.boxMin(x + k - 0.012, y - 0.004, z - 0.26, x + k + 0.012, y + 0.315, z + 0.265, C.ropeD);
    }
    strawInto(v, 0.5, 0, 0.35, 0.6, 0.3, 0.12, 31);
  });
  ctx.put(1.75, 1.75, 0, [1.2, 0.5], (v) => {
    crateInto(v, -0.32, 0, 0, 0.58, 0.38, 0.46, C.woodL, 3);
    crateInto(v, 0.32, 0, 0.02, 0.58, 0.38, 0.46, C.wood, 7);
    strawInto(v, -0.32, 0.12, 0, 0.5, 0.38, 0.28, 41);
    potInto(v, -0.32, 0.3, 0.0, 0.5, 'terra');
    crateInto(v, 0.32, 0.38, 0.0, 0.5, 0.3, 0.42, C.woodL, 9);
  });
  ctx.put(1.55, -2.55, 0, [0.6, 0.45], (v) => {
    for (let i = 0; i < 18; i++) boxR(v, (hash(i) - 0.5) * 0.5, 0.03 + hash(i + 3) * 0.12, (hash(i + 7) - 0.5) * 0.3, 0.1 + hash(i + 1) * 0.06, 0.04, 0.08, [C.terra, C.terraL, C.terraD, C.blue][i % 4], hash(i) * 0.6, hash(i + 2) * 3, hash(i + 5) * 0.5);
  });
  // tools on pegs under the window, his apron on a nail
  S.boxMin(-0.4, 1.4, -hd, 0.6, 1.46, -hd + 0.06, C.woodD);
  for (const x of [-0.25, 0.1, 0.45]) S.box(x, 1.43, -hd + 0.1, 0.03, 0.03, 0.08, C.woodD);
  boxR(S, -0.25, 1.0, -hd + 0.12, 0.12, 0.8, 0.03, C.woodL, 0, 0, 0.04);
  boxR(S, 0.1, 1.1, -hd + 0.13, 0.03, 0.6, 0.03, C.iron, 0, 0, 0.06);
  boxR(S, 0.14, 1.1, -hd + 0.13, 0.03, 0.6, 0.03, C.iron, 0, 0, -0.06);
  S.boxMin(0.33, 0.85, -hd + 0.09, 0.62, 1.42, -hd + 0.12, '#8E7A5E');
  // the day's finished pots, nested in straw on a carrying frame, waiting for the cart (front left)
  ctx.put(-1.3, 0.55, 0.25, [1.0, 0.6], (v) => {
    v.boxMin(-0.5, 0, -0.3, 0.5, 0.06, 0.3, C.bambooD);
    for (const sx of [-1, 1]) v.boxMin(-0.62, 0.02, sx * 0.26 - 0.025, 0.62, 0.07, sx * 0.26 + 0.025, C.bamboo);
    strawInto(v, 0, 0.06, 0, 0.9, 0.55, 0.12, 51);
    for (let i = 0; i < 6; i++) potInto(v, -0.32 + (i % 3) * 0.32, 0.12, -0.13 + Math.floor(i / 3) * 0.26, 0.5, i === 4 ? 'raw' : 'terra');
    strawInto(v, 0.0, 0.3, 0.0, 0.8, 0.5, 0.06, 57);
  });
  ctx.put(-2.75, 2.55, 0, null, (v) => broomInto(v, 0, 0, -0.14));
  ctx.spot('kokaung', -0.4, -2.55, 0);
  ctx.spot('kokaungLedge', 1.6, -1.0, Math.PI / 2);
  ctx.spot('maya', 0.55, -0.55, [1.6, -1.0]);
  ctx.spot('mayaBench', -0.4, -1.05, Math.PI);
  ctx.spot('door', 0, 2.3, Math.PI);
  ctx.tap('tally', -1.75, -1.0, [-1.75, -hd], NAME('မြေဖြူ စာရင်း', 'the chalk tally'), 0.8);
  ctx.tap('pots', -0.4, -1.1, [-0.4, -1.9], NAME('အိုးငါးလုံး', 'the five pots'), 0.8);
  ctx.tap('ledge', 1.7, -0.5, [2.55, -1.0], NAME('အုတ်ခုံ နွေးနွေး', 'the warm ledge'), 0.8);
  ctx.tap('trials', -1.9, -0.6, [-2.78, -0.6], NAME('ကွဲတဲ့ အိုးတွေ', 'the cracked trials'), 0.7);
  return ctx.finish('smoke');
}

// =============================================================================================
// gourdhouse · the gourd aunty's kitchen (Diary Garden lane) · D10 (D12 optional)
// =============================================================================================
function buildGourdHouse(opts = {}) {
  const ctx = scaffold({ id: 'gourdhouse', name: NAME('ဘူးသီးအဒေါ်ရဲ့ မီးဖိုချောင်', "The gourd aunty's kitchen"), width: 6, depth: 6, height: 2.8, wall: '#D3E2C6', wainscot: '#A27652', trim: C.bambooD, floor: 'planks', floorColor: '#D2AE80', background: '#EEE6D2', ...opts });
  const { S, A, hd, hw } = ctx;
  ctx.plankSeams(0.14, 0.98, '#86603E', 0.2);
  ctx.window({ x: 0.8, y: 1.65, w: 1.2, h: 0.9, frame: C.bambooD, sill: C.bamboo, shutters: '#7E9B4E' });
  // charcoal stove with the fritter pan (smoke wisp) back-left, a low kitchen bench behind it
  ctx.put(-2.0, -2.3, 0, [0.62, 0.62], (v, L) => {
    v.boxMin(-0.4, 0, -0.35, 0.4, 0.05, 0.38, C.brickD);
    stoveInto(v, L, { kettle: false, pan: true, s: 1.05 });
    L.emit('smoke', 0, 0.6, 0, { n: 4, rise: 0.9, size: 0.1, spread: 0.08, speed: 0.3 });
    L.emit('steam', 0.1, 0.5, 0.05, { n: 2, rise: 0.5, size: 0.06, speed: 0.4 });
    L.pool(0, 0.2, 0.6);
  });
  ctx.put(-2.45, -2.75, 0, [1.0, 0.4], (v) => {
    v.boxMin(-0.5, 0.42, -0.2, 0.5, 0.48, 0.2, C.wood);
    for (const sx of [-1, 1]) v.boxMin(sx * 0.44 - 0.03, 0, -0.17, sx * 0.44 + 0.03, 0.42, 0.17, C.woodD);
    jarInto(v, -0.35, 0.48, 0, 1.0, '#E0B048', { glass: false, label: null, lidCol: C.terraD });
    v.box(0.0, 0.5, 0.0, 0.3, 0.04, 0.22, C.woodL);
    v.box(0.05, 0.53, 0.02, 0.12, 0.02, 0.03, C.tinL);
    for (let i = 0; i < 4; i++) v.box(-0.08 + i * 0.05, 0.54, -0.05, 0.04, 0.03, 0.04, i % 2 ? C.gourd : C.gourdG);
    prism(v, 0.32, 0.56, 0, 0.12, 0.09, 0.14, C.terraL);
    prism(v, 0.32, 0.632, 0, 0.1, 0.1, 0.006, '#EED9A4');
  });
  for (const [z, r] of [[-1.7, 0.16], [-1.25, 0.12]]) {
    S.add(prismGeo(r, r * 0.85, 0.05, 10), C.iron, M(-hw + 0.04, 1.6, z, 0, 0, Math.PI / 2));
    S.box(-hw + 0.06, 1.6 + r + 0.08, z, 0.03, 0.16, 0.03, C.ironL);
  }
  S.box(-hw + 0.06, 1.55, -0.85, 0.03, 0.4, 0.03, C.woodD);
  // low table with a basket of gourds and a plate of fritters + two stools
  ctx.put(0, -0.3, 0, [1.0, 0.66], (v) => {
    lowTableInto(v, 0, 0, 1.0, 0.66, 0.4, C.woodL, C.woodD, 4);
    prism(v, -0.22, 0.48, -0.06, 0.2, 0.15, 0.16, C.bamboo, 10);
    prism(v, -0.22, 0.56, -0.06, 0.205, 0.205, 0.02, C.bambooD, 10);
    for (const [x, z, c] of [[-0.3, -0.06, C.gourdG], [-0.17, -0.02, C.gourd], [-0.22, -0.14, C.gourdG]]) {
      boxR(v, x, 0.62, z, 0.09, 0.2, 0.09, c, 0.3, 0, 0.9);
      v.box(x + 0.06, 0.66, z, 0.04, 0.05, 0.04, c);
    }
    prism(v, 0.22, 0.41, 0.06, 0.15, 0.13, 0.02, C.white, 10);
    for (let i = 0; i < 6; i++) v.box(0.16 + (i % 3) * 0.06, 0.435, 0.02 + Math.floor(i / 3) * 0.08, 0.06, 0.03, 0.05, i % 2 ? '#D9A44A' : '#C98A36');
    cupInto(v, 0.38, 0.4, -0.18, C.white);
  });
  for (const sx of [-1, 1]) ctx.put(sx * 0.8, -0.3, 0, null, (v) => stoolInto(v, 0, 0, 0.26, C.woodL, C.woodD, 0.3));
  // seed-jar shelf on the right wall (z -1.2, y 1.4): jars labelled by year; one empty jar in his hand
  const jarLabels = ['၂၀၁၉', '၂၀၂၀', '၂၀၂၁', '၂၀၂၂', '၂၀၂၃', 'ဦးဖိုးထော် · ပန်းဥ'];
  const labelR = jarLabels.map((t, i) => A.region(i === 5 ? 220 : 96, 64, (g, w, h) => { panel(g, w, h, { bg: C.paper, border: i === 5 ? C.maroon : C.kraftD, bw: 4, r: 4 }); lines(g, [{ t, s: i === 5 ? 20 : 24, c: i === 5 ? '#2E3B5A' : C.ink, w: 600 }], w, h); }));
  ctx.put(hw - 0.02, -1.2, -Math.PI / 2, null, (v, L) => {
    const y = wallShelfInto(v, 0, 1.4, 0, 1.6, 0.24, C.wood);
    const y2 = wallShelfInto(v, 0, 1.9, 0, 1.6, 0.24, C.wood);
    const fills = ['#8A5A32', '#3E2A20', '#C9A04A', '#6F9E5B', '#B5643C'];
    for (let i = 0; i < 6; i++) {
      const x = -0.62 + i * 0.24;
      jarInto(v, x, y, 0.12, 0.85, fills[i % 5], { label: null, empty: i === 5 });
      L.quad(labelR[i], i === 5 ? 0.2 : 0.1, 0.065, x, y + 0.09, 0.19);
    }
    for (let i = 0; i < 5; i++) prism(v, -0.55 + i * 0.27, y2 + 0.12, 0.12, 0.08, 0.1, 0.24, i % 2 ? C.terra : C.terraL);
  });
  // gourd pole along the back wall, dried gourds hanging
  S.boxMin(-2.9, 2.32, -hd + 0.18, 2.9, 2.38, -hd + 0.24, C.bambooD);
  for (const sx of [-1, 1]) S.boxMin(sx * 2.9 - 0.03, 2.2, -hd, sx * 2.9 + 0.03, 2.38, -hd + 0.24, C.bambooD);
  for (let i = 0; i < 13; i++) {
    const x = -2.7 + i * 0.42;
    if (Math.abs(x - 0.8) < 0.78) continue;
    const len = 0.15 + hash(i) * 0.2;
    S.box(x, 2.32 - len / 2, -hd + 0.21, 0.012, len, 0.012, C.ropeD);
    const y = 2.32 - len;
    const c = [C.gourd, C.gourdD, '#D8C27A', '#B89A4E'][i % 4];
    const k = 0.85 + hash(i + 3) * 0.4;
    S.box(x, y - 0.03, -hd + 0.21, 0.03, 0.06, 0.03, C.woodD);
    S.box(x, y - 0.1 * k, -hd + 0.21, 0.1 * k, 0.12 * k, 0.1 * k, c);
    S.box(x, y - 0.19 * k, -hd + 0.21, 0.08 * k, 0.07 * k, 0.08 * k, jitter(c, -0.08, i));
    S.box(x, y - 0.34 * k, -hd + 0.21, 0.19 * k, 0.24 * k, 0.19 * k, c);
    S.box(x, y - 0.34 * k, -hd + 0.21, 0.2 * k, 0.07 * k, 0.15 * k, jitter(c, -0.12, i));
    S.box(x + 0.04 * k, y - 0.28 * k, -hd + 0.21 + 0.1 * k, 0.05 * k, 0.05 * k, 0.01, jitter(c, 0.15, i));
  }
  ctx.put(2.1, 2.0, 0, [0.48, 0.48], (v) => waterJarInto(v, 0, 0, 1.0));
  ctx.floorPatch(0, -0.3, 2.2, 1.4, C.mat, 0.008);
  for (let i = 0; i < 9; i++) S.boxMin(-1.1, 0.008, -1.0 + i * 0.155, 1.1, 0.011, -0.95 + i * 0.155, C.matD);
  ctx.put(-2.2, 0.9, 0, [0.5, 0.5], (v) => {
    prism(v, 0, 0.12, 0, 0.24, 0.18, 0.24, C.bamboo, 10);
    for (let i = 0; i < 6; i++) v.box(-0.1 + (i % 3) * 0.1, 0.27, -0.06 + Math.floor(i / 3) * 0.12, 0.11, 0.08, 0.1, [C.gourdG, '#C8323C', C.gourd, C.leafL, '#E0795A', C.gourdG][i]);
  });
  for (const [x, c] of [[-0.6, '#7A4A2A'], [-0.35, '#8E5A3C']]) { S.box(x, 0.012, 2.55, 0.12, 0.02, 0.26, c); S.box(x, 0.03, 2.48, 0.06, 0.02, 0.02, C.maroon); }
  calendarOn(ctx, 'left', -0.2, 1.55, 'ပြက္ခဒိန်', { ring7: false, mark: 9 });
  // food safe (mesh doors) on the left wall, firewood by the stove, rice sack and a pot stack, a door rug
  ctx.put(-2.72, 0.95, Math.PI / 2, [0.9, 0.5], (v) => {
    v.boxMin(-0.45, 0, -0.24, 0.45, 1.2, 0.24, C.woodD);
    for (const sx of [-1, 1]) {
      v.boxMin(sx > 0 ? 0.02 : -0.42, 0.42, 0.24, sx > 0 ? 0.42 : -0.02, 1.14, 0.26, C.wood);
      v.boxMin(sx > 0 ? 0.07 : -0.37, 0.47, 0.26, sx > 0 ? 0.37 : -0.07, 1.09, 0.265, '#C9C3B0');
      for (let i = 0; i < 6; i++) v.boxMin(sx > 0 ? 0.07 : -0.37, 0.5 + i * 0.1, 0.265, sx > 0 ? 0.37 : -0.07, 0.505 + i * 0.1, 0.27, '#9A9384');
      v.box(sx * 0.06, 0.78, 0.275, 0.03, 0.08, 0.02, C.brass);
      v.boxMin(sx > 0 ? 0.02 : -0.42, 0.06, 0.24, sx > 0 ? 0.42 : -0.02, 0.36, 0.26, jitter(C.wood, 0.08, sx + 2));
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) prism(v, sx * 0.38, -0.0, sz * 0.18, 0.06, 0.06, 0.04, C.terraL);
    potInto(v, -0.2, 1.2, 0, 0.45, 'cream');
    v.box(0.18, 1.26, 0, 0.3, 0.12, 0.3, C.bamboo);
  });
  ctx.put(-1.25, -2.8, 0, [0.7, 0.36], (v) => {
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) boxR(v, -0.27 + i * 0.18 + r * 0.09, 0.05 + r * 0.09, 0, 0.09, 0.09, 0.62, [C.woodL, C.wood, C.woodD][(i + r) % 3], 0, 0.04 * (i - 1), 0);
  });
  ctx.put(2.45, 0.6, 0, [0.5, 0.42], (v) => { sackInto(v, 0, 0, 1.0, C.cloth); v.box(0, 0.36, 0.172, 0.16, 0.06, 0.004, C.red); });
  ctx.put(1.5, -2.65, 0, [0.5, 0.5], (v) => { potInto(v, 0, 0, 0, 0.95, 'terra', { lid: true }); potInto(v, 0.0, 0.42, 0, 0.6, 'black'); });
  ctx.floorPatch(0, 2.35, 1.3, 0.6, '#B5643C', 0.008);
  ctx.floorPatch(0, 2.35, 1.1, 0.42, '#E2B35A', 0.01);
  // lived-in front: a basket of fresh gourds by the door, chillies and onions on a nail, a broom, her cat
  ctx.put(-1.55, 2.2, 0, [0.5, 0.5], (v) => {
    prism(v, 0, 0.11, 0, 0.24, 0.19, 0.22, C.bamboo, 10);
    prism(v, 0, 0.225, 0, 0.245, 0.245, 0.02, C.bambooD, 10);
    for (const [x, z, c, r] of [[-0.08, -0.05, C.gourdG, 0.9], [0.08, 0.04, C.gourd, -0.7], [0.0, 0.1, C.gourdG, 0.3], [-0.1, 0.08, '#9DBA6A', -1.2]]) {
      boxR(v, x, 0.27, z, 0.1, 0.24, 0.1, c, 1.2, r, 0);
      boxR(v, x, 0.3, z, 0.08, 0.1, 0.08, jitter(c, 0.1, 3), 1.2, r, 0);
    }
  });
  // a bamboo drying stand in the front corner: strings of red chillies and onion bunches, garlic, a gourd
  ctx.put(2.2, 2.25, 0, [1.0, 0.42], (v) => {
    for (const sx of [-1, 1]) {
      boxR(v, sx * 0.45, 0.62, -0.12, 0.05, 1.3, 0.05, C.bambooD, -0.2, 0, 0);
      boxR(v, sx * 0.45, 0.62, 0.12, 0.05, 1.3, 0.05, C.bambooD, 0.2, 0, 0);
      v.box(sx * 0.45, 0.35, 0, 0.04, 0.04, 0.3, C.bamboo);
    }
    v.boxMin(-0.55, 1.22, -0.03, 0.55, 1.28, 0.03, C.bamboo);
    for (let k = 0; k < 4; k++) { // chilli strings
      const x = -0.36 + k * 0.16;
      v.box(x, 1.12, 0, 0.012, 0.2, 0.012, C.ropeD);
      for (let i = 0; i < 7; i++) boxR(v, x + (i % 2 ? 0.025 : -0.025), 1.0 - i * 0.075, (i % 2 ? 0.02 : -0.02), 0.035, 0.1, 0.035, i % 3 ? '#C8322E' : '#E04A36', 0, 0, i % 2 ? 0.5 : -0.5);
    }
    for (let k = 0; k < 2; k++) { // onion bunches and garlic
      const x = 0.2 + k * 0.18;
      v.box(x, 1.14, 0, 0.012, 0.16, 0.012, C.ropeD);
      for (let i = 0; i < 5; i++) v.box(x + Math.cos(i * 1.3) * 0.05, 0.98 - Math.floor(i / 2) * 0.08, Math.sin(i * 1.3) * 0.05, 0.08, 0.08, 0.08, k ? '#EDE3CE' : (i % 2 ? '#B9704A' : '#C98A5A'));
    }
    boxR(v, 0.0, 0.08, 0.0, 0.13, 0.12, 0.3, C.gourd, 0, 0.3, 0); // a gourd on the low bar
    prism(v, -0.3, 0.07, 0.04, 0.14, 0.11, 0.14, C.bamboo, 10); // a basket of dried chillies
    for (let i = 0; i < 8; i++) boxR(v, -0.3 + (hash(i + 70) - 0.5) * 0.16, 0.15, 0.04 + (hash(i + 71) - 0.5) * 0.16, 0.03, 0.025, 0.08, '#B8322E', 0, hash(i) * 3, 0);
  });
  ctx.put(2.72, 2.62, 0, null, (v) => broomInto(v, 0, 0, 0.16));
  ctx.put(-2.3, -1.5, 0, null, (v) => { catMatInto(v, 0, 0); catInto(v, 0, 0.026, 0, -0.6, '#F2E9D6', '#B5784A'); });
  ctx.spot('aunty', -1.3, -2.05, [0, 1.0]);
  ctx.spot('auntyTable', -0.8, -0.3, Math.PI / 2, { seat: 0.26 });
  ctx.spot('maya', 0.8, -0.3, -Math.PI / 2, { seat: 0.26 });
  ctx.spot('mayaStand', 0.4, 0.8, [-1.3, -2.05]);
  ctx.spot('door', 0, 2.3, Math.PI);
  ctx.tap('aunty', -1.0, -1.4, [-1.3, -2.05], NAME('ဘူးသီးအဒေါ်', 'the gourd aunty'));
  ctx.tap('gaJar', 2.2, -1.2, [3.0, -1.2], NAME('အစေ့ပုလင်း', 'the seed jars'), 0.7);
  ctx.tap('fritters', 0.3, 0.4, [0.2, -0.24], NAME('ဘူးသီးကြော်', 'the fritters'), 0.6);
  ctx.tap('window', 0.8, -2.0, [0.8, -hd], NAME('ပြတင်းပေါက်', 'the window'), 0.6);
  return ctx.finish('trellis');
}

// =============================================================================================
// hpohtawshed · U Hpo Htaw's garden house (Diary Garden, back of his plot) · D12 (D14 optional)
// =============================================================================================
const DIARY_COLS = ['#5E7A44', '#4E6A4A', '#7A8A5A', '#8E6A44', '#6E5A3A', '#A08A5A', '#3F5A3A', '#8A7A52', '#C2B08A', '#6A4E36'];
function buildHpoHtawShed(opts = {}) {
  const wet = opts.rain ?? (opts.day === 12 || opts.day === undefined);
  const ctx = scaffold({ id: 'hpohtawshed', name: NAME('ဦးဖိုးထော်ရဲ့ ဥယျာဉ်အိမ်', "U Hpo Htaw's garden house"), width: 6, depth: 7, height: 2.6, wall: '#EEE9DC', wainscot: '#7D6146', trim: '#7E9A5A', floor: 'planks', floorColor: '#6E5442', background: '#E2DED0', ...opts, rain: wet });
  const { S, A, hd, hw } = ctx;
  ctx.plankSeams(0.14, 0.98, '#5E4A38', 0.24);
  // limewash: patchy squares, a damp stain under the window, the tin roof's edge along the top
  for (let i = 0; i < 9; i++) S.box(-2.6 + hash(i + 3) * 5.2, 1.3 + hash(i + 11) * 0.9, -hd + 0.004, 0.3 + hash(i) * 0.5, 0.2 + hash(i + 5) * 0.3, 0.008, hash(i + 7) > 0.5 ? '#E2DCCD' : '#F5F1E7');
  S.boxMin(1.75, 1.02, -hd + 0.004, 2.65, 1.22, -hd + 0.014, '#D6CDB6');
  for (let x = -hw, i = 0; x < hw - 0.01; x += 0.15, i++) S.boxMin(x, 2.36, -hd, x + 0.15, 2.46, -hd + 0.04 + (i % 2) * 0.02, i % 2 ? C.tin : C.tinD);
  ctx.floorPatch(0, -0.6, 1.2, 4.6, '#5E4636', 0.003); // the worn path from the door to the table
  ctx.window({ x: 2.2, y: 1.62, w: 0.8, h: 0.7, frame: '#5E7A44', sill: C.woodL, curtain: '#C9D3A8' });

  // the diary shelf: forty dated spines on two boards, one gap (today's diary is on the table)
  const spineLabels = [];
  ctx.put(-0.2, -hd + 0.02, 0, null, (v, L) => {
    for (const [row, y] of [[0, 1.15], [1, 1.72]]) {
      wallShelfInto(v, 0, y, 0, 2.86, 0.24, '#8A6A48');
      for (let i = 0; i < 20; i++) {
        if (row === 1 && i === 19) continue; // the gap
        const x = -1.27 + i * 0.127, k = row * 20 + i;
        const h = 0.28 + hash(k * 3.1) * 0.07, col = jitter(DIARY_COLS[(k * 7) % DIARY_COLS.length], 0.06, k);
        const lean = row === 1 && i === 18 ? 0.18 : 0;
        boxR(v, x + 0.052 + lean * 0.5 * h, y + h / 2, 0.12, 0.104, h, 0.2, col, 0, 0, -lean);
        if (!lean) {
          v.boxMin(x + 0.004, y + h - 0.05, 0.22, x + 0.1, y + h - 0.035, 0.223, C.gold);
          v.boxMin(x + 0.004, y + 0.04, 0.22, x + 0.1, y + 0.05, 0.223, jitter(col, -0.2, k));
        }
      }
      // one strip of hand-written dates across the spines
      const r = A.region(1020, 34, (g, w, h) => {
        for (let i = 0; i < 20; i++) {
          if (row === 1 && i >= 18) continue;
          g.fillStyle = '#EFE6CF'; g.fillRect(i * 51 + 4, 2, 43, h - 4);
          g.fillStyle = '#3B3A2A'; g.font = `700 15px ${FONT_MY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(myNum(1985 + row * 20 + i).slice(-2), i * 51 + 25, h / 2 + 1);
        }
      });
      spineLabels.push(r);
      L.quad(r, 2.54, 0.085, 0, y + 0.19, 0.226);
    }
    // a small hand card on the top board: «ဥယျာဉ် ဒိုင်ယာရီ»
    const card = A.region(200, 70, (g, w, h) => { panel(g, w, h, { bg: '#F2EAD2', border: '#5E7A44', bw: 5, r: 6 }); lines(g, [{ t: 'ဥယျာဉ် မှတ်တမ်း', s: 22, c: '#3E5A2E' }], w, h); });
    L.quad(card, 0.36, 0.13, 1.1, 2.18, 0.14);
  });

  // the potting table: tin box + the garden diary open, the seed tin, a pencil, name sticks, a clay lamp
  const diary = A.region(300, 196, (g, w, h) => {
    g.fillStyle = '#F2EAD2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#DCCFB0'; g.fillRect(w / 2 - 3, 0, 6, h);
    g.fillStyle = '#3E5A2E'; g.font = `700 17px ${FONT_MY}`; g.textAlign = 'left'; g.textBaseline = 'top';
    g.fillText('၁၂ ရက် · မိုး', 12, 8);
    scribble(g, 10, 34, w / 2 - 20, h - 44, { rows: 6, seed: 12, ink: '#2E3B5A', margin: null });
    // right page: a little sketch of the bean rows, three ticks and a cross
    g.strokeStyle = '#3E5A2E'; g.lineWidth = 3;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(w / 2 + 18, 40 + i * 34); g.lineTo(w - 18, 40 + i * 34); g.stroke(); }
    g.fillStyle = '#5E8F4E';
    for (let i = 0; i < 4; i++) for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(w / 2 + 28 + k * 21, 34 + i * 34, 5, 0, 7); g.fill(); }
    g.strokeStyle = C.red; g.lineWidth = 3; g.beginPath(); g.moveTo(w - 40, 150); g.lineTo(w - 22, 168); g.moveTo(w - 22, 150); g.lineTo(w - 40, 168); g.stroke();
  });
  ctx.put(0, -1.6, 0, [1.8, 0.8], (v, L) => {
    v.boxMin(-0.9, 0.72, -0.4, 0.9, 0.78, 0.4, '#8A6A48');
    for (let i = 0; i < 5; i++) v.boxMin(-0.89 + i * 0.36, 0.778, -0.39, -0.55 + i * 0.36, 0.784, 0.39, jitter('#8A6A48', 0.08, i + 3));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * 0.82, 0.36, sz * 0.32, 0.07, 0.72, 0.07, '#5E4636');
    v.boxMin(-0.84, 0.2, -0.34, 0.84, 0.24, 0.34, '#6E5442');
    // soil spilled on the top, a sieve and stacked seed pots on the low board, a bag of soil
    for (let i = 0; i < 9; i++) boxR(v, -0.75 + hash(i + 2) * 1.5, 0.787, -0.3 + hash(i + 9) * 0.6, 0.06 + hash(i) * 0.08, 0.006, 0.04 + hash(i + 4) * 0.06, '#4E3A2C', 0, hash(i) * 3, 0);
    prism(v, -0.5, 0.27, 0.05, 0.2, 0.2, 0.06, C.bambooD, 12);
    prism(v, -0.5, 0.275, 0.05, 0.17, 0.17, 0.055, '#3A2E26', 12);
    for (let i = 0; i < 5; i++) prism(v, 0.15, 0.27 + i * 0.05, 0.0, 0.1 - i * 0.004, 0.08 - i * 0.004, 0.07, i % 2 ? C.terra : C.terraL, 8);
    for (let i = 0; i < 3; i++) prism(v, 0.42, 0.27 + i * 0.05, 0.05, 0.1, 0.08, 0.07, C.terraD, 8);
    v.boxMin(0.55, 0.24, -0.25, 0.82, 0.48, 0.15, '#B9A27A');
    v.boxMin(0.57, 0.48, -0.22, 0.8, 0.52, 0.12, '#3A2E26');
    // the tin box (lid up) with the diary open on its tray
    v.boxMin(-0.62, 0.784, -0.2, -0.18, 0.88, 0.12, C.tin);
    v.boxMin(-0.6, 0.86, -0.18, -0.2, 0.882, 0.1, '#6E6A62');
    boxR(v, -0.4, 1.0, -0.24, 0.44, 0.24, 0.015, C.tinD, -0.35, 0, 0);
    v.boxMin(-0.6, 0.882, -0.17, -0.2, 0.9, 0.09, '#E9DFC6');
    L.quad(diary, 0.4, 0.26, -0.4, 0.903, -0.04, 0, -Math.PI / 2);
    // the seed tin, a pencil, name sticks, seed packets
    prism(v, 0.4, 0.84, -0.1, 0.075, 0.075, 0.11, C.tin, 10);
    prism(v, 0.4, 0.84, -0.1, 0.077, 0.077, 0.05, '#5E7A44', 10);
    prism(v, 0.4, 0.9, -0.1, 0.078, 0.078, 0.015, C.tinD, 10);
    boxR(v, -0.05, 0.792, 0.18, 0.16, 0.012, 0.012, C.mustard, 0, 0.5, 0);
    for (let i = 0; i < 8; i++) boxR(v, 0.1 + (i - 3.5) * 0.012, 0.795, -0.05 + (i % 3) * 0.01, 0.02, 0.008, 0.24, i % 3 ? C.woodL : '#E8E0CC', 0, 0.12 + i * 0.02, 0);
    v.box(0.1, 0.8, -0.05, 0.12, 0.014, 0.03, C.ropeD);
    for (let i = 0; i < 3; i++) boxR(v, 0.6 + i * 0.07, 0.79, 0.2, 0.08, 0.008, 0.11, ['#E8D9B0', '#DCC79A', '#F0E4C6'][i], 0, 0.2 * i - 0.2, 0);
    // a lit clay lamp
    prism(v, 0.75, 0.8, -0.25, 0.07, 0.05, 0.035, C.terra, 8);
    v.box(0.8, 0.82, -0.25, 0.04, 0.012, 0.02, C.terraD);
    L.glow(0.82, 0.86, -0.25, 0.022, 0.045, 0.022);
    L.pool(0.6, -0.1, 0.7, 0.79);
    L.pool(0.4, 0.6, 1.2);
  });
  ctx.put(0.2, -2.3, 0, [0.36, 0.36], (v) => stoolInto(v, 0, 0, 0.42, '#8A6A48', '#5E4636', 0.34));
  ctx.put(-0.9, -0.8, 0, [0.34, 0.34], (v) => stoolInto(v, 0, 0, 0.28, C.woodL, C.woodD, 0.32));
  const mug = ctx.part((v) => {
    prism(v, 0, 0.05, 0, 0.045, 0.042, 0.1, C.cream, 10);
    prism(v, 0, 0.065, 0, 0.0465, 0.0465, 0.02, C.maroon, 10);
    v.box(0.055, 0.05, 0, 0.02, 0.05, 0.012, C.cream);
    v.box(0, 0.095, 0, 0.07, 0.006, 0.07, '#7A4A2A');
  }, -0.7, 0.78, -1.3);
  mug.visible = !!opts.mug;

  // left wall: the tool rack (a peg board on two posts, turned a little to the room): hoe, rake, spade with
  // their iron heads down, the sickle and his straw hat on pegs, the watering can at its foot; the garden
  // calendar, the EMPTY hook
  ctx.put(-hw + 0.32, -0.55, Math.PI / 2 - 0.45, [1.4, 0.5], (v) => {
    for (const x of [-0.66, 0.66]) { v.boxMin(x - 0.05, 0, -0.05, x + 0.05, 1.75, 0.05, '#5E4636'); v.boxMin(x - 0.07, 0, -0.08, x + 0.07, 0.06, 0.08, '#4A3428'); }
    for (const y of [0.55, 1.5]) v.boxMin(-0.72, y - 0.05, -0.02, 0.72, y + 0.05, 0.05, '#7D6146');
    v.boxMin(-0.72, 1.7, -0.06, 0.72, 1.78, 0.07, '#5E4636');
    for (const x of [-0.42, -0.1, 0.22]) v.boxMin(x - 0.025, 1.48, 0.05, x + 0.025, 1.53, 0.16, C.woodD); // pegs
    // the hoe: long handle, a wide iron blade turned out to the room
    boxR(v, -0.42, 0.86, 0.12, 0.05, 1.3, 0.05, C.woodL, 0, 0, 0.02);
    v.boxMin(-0.56, 0.1, 0.1, -0.28, 0.28, 0.24, C.ironL);
    v.boxMin(-0.45, 0.24, 0.1, -0.39, 0.34, 0.16, C.iron);
    // the rake: handle + toothed head
    boxR(v, -0.1, 0.88, 0.12, 0.05, 1.26, 0.05, C.wood, 0, 0, -0.02);
    v.boxMin(-0.3, 0.2, 0.08, 0.1, 0.25, 0.16, C.iron);
    for (let i = 0; i < 7; i++) v.boxMin(-0.29 + i * 0.065, 0.08, 0.13, -0.26 + i * 0.065, 0.21, 0.2, C.ironL);
    // the spade
    boxR(v, 0.22, 0.86, 0.12, 0.05, 1.1, 0.05, C.woodL, 0, 0, 0.0);
    v.boxMin(0.13, 1.38, 0.1, 0.31, 1.44, 0.15, C.woodD);
    v.boxMin(0.12, 0.08, 0.1, 0.32, 0.36, 0.15, C.ironL);
    v.boxMin(0.12, 0.08, 0.15, 0.32, 0.1, 0.16, C.iron);
    // the sickle on its peg (a crescent of iron, a red-bound handle), his straw hat on the far peg
    v.box(0.48, 1.4, 0.14, 0.05, 0.2, 0.05, '#8A3A2A');
    for (let i = 0; i < 7; i++) boxR(v, 0.48 + Math.sin(i * 0.48) * 0.15, 1.22 + Math.cos(i * 0.48) * 0.1 - 0.08, 0.15, 0.08, 0.035, 0.025, C.ironL, 0, 0, -i * 0.45);
    prism(v, -0.42, 1.62, 0.18, 0.24, 0.07, 0.07, C.straw, 10, Math.PI / 2 - 0.2, 0);
    prism(v, -0.42, 1.62, 0.22, 0.09, 0.09, 0.08, C.strawD, 10, Math.PI / 2 - 0.2, 0);
    waterCanInto(v, 0.5, 0, 0.3, 1.1);
  });
  calendarOn(ctx, 'left', -1.55, 1.55, 'စိုက်ပျိုး ပြက္ခဒိန်', { ring7: false, nextRing: -99, mark: 11 });
  S.boxMin(-hw + 0.001, 1.86, -2.53, -hw + 0.02, 1.98, -2.37, C.brassD); // the hook's plate
  S.box(-hw + 0.07, 1.92, -2.45, 0.1, 0.05, 0.05, C.iron);
  S.box(-hw + 0.13, 1.84, -2.45, 0.04, 0.14, 0.04, C.iron);
  S.box(-hw + 0.17, 1.78, -2.45, 0.1, 0.04, 0.04, C.iron);
  S.box(-hw + 0.21, 1.81, -2.45, 0.04, 0.07, 0.04, C.iron);
  S.boxMin(-hw + 0.001, 1.1, -2.85, -hw + 0.008, 1.84, -2.05, '#C9BEA6'); // the dust line round where the net hung
  S.boxMin(-hw + 0.002, 1.14, -2.81, -hw + 0.01, 1.8, -2.09, '#FBF9F2'); // the clean patch inside it
  for (let i = 0; i < 7; i++) boxR(S, -hw + 0.25 + hash(i) * 0.4, 0.006, -2.6 + hash(i + 3) * 0.5, 0.05, 0.006, 0.03, '#E9DCC0', 0, hash(i + 1) * 3, 0); // papery bulb skins
  // the trowel on its nail on a short post by the doorway (he takes it at the end: setTrowel(false))
  ctx.put(-1.1, 3.02, 0, [0.16, 0.16], (v) => {
    v.box(0, 0.6, 0, 0.13, 1.2, 0.13, '#6E5442');
    v.box(0, 1.22, 0, 0.18, 0.05, 0.18, '#5E4636');
    v.boxMin(-0.09, 0, -0.09, 0.09, 0.08, 0.09, '#4A3428');
    v.box(0, 1.02, 0.08, 0.02, 0.02, 0.06, C.iron);
    prism(v, 0.0, 0.08, 0.17, 0.1, 0.08, 0.16, C.tin, 10); // a little tin bucket of potting soil at its foot
    prism(v, 0.0, 0.16, 0.17, 0.085, 0.085, 0.01, '#3A2E26', 10);
  });
  const trowel = ctx.part((v) => {
    v.box(0, -0.07, 0, 0.05, 0.16, 0.045, C.red);
    v.box(0, -0.16, 0, 0.018, 0.05, 0.018, C.ironL);
    v.box(0, -0.27, 0, 0.13, 0.18, 0.016, C.tinL);
    v.box(0, -0.38, 0, 0.08, 0.05, 0.016, C.tinL);
    v.box(0, -0.27, 0.01, 0.012, 0.16, 0.006, C.tin);
  }, -1.1, 1.02, 3.13);
  trowel.visible = opts.trowel !== false;

  // right wall: three seed sacks, towers of clay seed pots, seed heads drying on a string
  ctx.put(2.55, -0.75, -Math.PI / 2, [1.5, 0.45], (v) => {
    sackInto(v, -0.5, 0, 0.95, '#D9CBA8');
    sackInto(v, 0.0, 0.02, 1.05, '#C9B48A');
    sackInto(v, 0.5, 0, 0.9, '#E2D6B8');
    for (const [x, c] of [[-0.5, '#5E7A44'], [0.0, C.red], [0.5, C.mustard]]) v.box(x, 0.28, 0.2, 0.12, 0.08, 0.006, c);
  });
  ctx.put(2.55, 0.4, 0, [0.5, 0.45], (v) => {
    for (let i = 0; i < 8; i++) prism(v, -0.1, 0.05 + i * 0.055, 0, 0.1 - (i % 2) * 0.004, 0.075, 0.08, jitter(C.terra, 0.06, i), 8);
    for (let i = 0; i < 4; i++) prism(v, 0.13, 0.05 + i * 0.055, 0.06, 0.1, 0.075, 0.08, jitter(C.terraD, 0.06, i), 8);
  });
  S.boxMin(hw - 0.04, 1.95, -3.0, hw - 0.02, 1.965, -1.6, C.ropeD);
  for (let i = 0; i < 6; i++) {
    const z = -2.85 + i * 0.24;
    S.box(hw - 0.05, 1.86, z, 0.01, 0.18, 0.01, C.ropeD);
    for (let k = 0; k < 4; k++) boxR(S, hw - 0.07 - (k % 2) * 0.03, 1.72 + k * 0.03, z + (k - 1.5) * 0.025, 0.04, 0.12, 0.04, k % 2 ? '#B89A5E' : '#9E8452', 0, 0, (k - 1.5) * 0.15);
  }
  // seedling trays on a low bench under the window, each with its name stick
  ctx.put(2.2, -3.05, 0, [1.1, 0.5], (v) => {
    v.boxMin(-0.55, 0.36, -0.22, 0.55, 0.42, 0.22, '#8A6A48');
    for (const sx of [-1, 1]) v.boxMin(sx * 0.48 - 0.04, 0, -0.18, sx * 0.48 + 0.04, 0.36, 0.18, '#5E4636');
    for (const x of [-0.27, 0.27]) {
      v.boxMin(x - 0.24, 0.42, -0.18, x + 0.24, 0.5, 0.18, '#7A5434');
      v.boxMin(x - 0.22, 0.48, -0.16, x + 0.22, 0.5, 0.16, '#4E3A2C');
      for (let k = 0; k < 12; k++) { const px = x - 0.18 + (k % 4) * 0.12, pz = -0.11 + Math.floor(k / 4) * 0.11; v.box(px, 0.53, pz, 0.012, 0.05, 0.012, C.leafD); v.box(px, 0.56, pz, 0.05, 0.015, 0.03, C.leafL); }
      v.box(x + 0.2, 0.56, 0.17, 0.025, 0.14, 0.008, '#E8E0CC');
    }
  });
  // the front half, where the rain got in: the leak basin under the worst drip (enamel, blue rim), a second
  // leak into a tin bucket, the seed sacks dragged out of the wet with one slumped open, the soaked sheets blown
  // in under the door, puddles (rain only) - so the room's front tells the night's story
  const BAS = { x: 1.15, z: 1.55 };
  ctx.put(BAS.x, BAS.z, 0, [0.55, 0.55], (v) => {
    prism(v, 0, 0.07, 0, 0.27, 0.2, 0.14, '#F2EFE6', 12);
    prism(v, 0, 0.14, 0, 0.28, 0.28, 0.018, '#3F6EA8', 12);
    prism(v, 0, 0.12, 0, 0.24, 0.24, 0.012, '#9DB9C6', 12);
    for (let i = 0; i < 3; i++) v.box(0.2 * Math.cos(i * 2.1), 0.07, 0.2 * Math.sin(i * 2.1), 0.05, 0.05, 0.004, '#3A3A3A'); // chipped enamel
  });
  wetPatchInto(S, BAS.x + 0.1, BAS.z + 0.1, 1.0, 0.85, 3, 0.003);
  ctx.emit('drip', BAS.x, 2.45, BAS.z, { n: 2, speed: 0.6, spread: 0.01 });
  ctx.put(-1.35, 1.85, 0, [0.4, 0.4], (v) => {
    prism(v, 0, 0.12, 0, 0.15, 0.12, 0.24, C.tin, 10);
    prism(v, 0, 0.24, 0, 0.16, 0.16, 0.015, C.tinD, 10);
    prism(v, 0, 0.21, 0, 0.13, 0.13, 0.01, '#9DB9C6', 10);
    boxR(v, 0, 0.3, 0, 0.32, 0.012, 0.012, C.ironL, 0, 0.4, 0.5); // the handle, down
  });
  ctx.emit('drip', -1.35, 2.45, 1.85, { n: 1, speed: 0.45, spread: 0.0 });
  for (const x of [-0.7, -0.2, 0.4, 0.8]) ctx.emit('drip', x, 2.1, 3.45, { n: 1, speed: 0.5 + hash(x * 9) * 0.3, spread: 0.02 });
  const ripple = ctx.part((v) => { for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; v.box(Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1, 0.04, 0.006, 0.04, '#E4EEF2'); } }, BAS.x, 0.132, BAS.z, 0);
  ctx.animate((dt, t) => { const u = frac(t * 0.6); ripple.visible = ctx.state.rain; ripple.scale.set(0.3 + u * 1.4, 1, 0.3 + u * 1.4); });
  ctx.put(2.25, 2.05, -0.35, [0.9, 0.6], (v) => {
    sackInto(v, -0.25, -0.05, 1.0, '#D9CBA8');
    v.box(-0.25, 0.3, 0.17, 0.12, 0.08, 0.006, '#5E7A44');
    // the slumped open one, its seeds spilled on the boards
    boxR(v, 0.25, 0.12, 0.08, 0.38, 0.24, 0.34, '#C9B48A', 0.25, 0.2, 0.15);
    boxR(v, 0.32, 0.23, 0.18, 0.26, 0.04, 0.2, '#E2D6B8', 0.5, 0.2, 0.15);
    for (let i = 0; i < 26; i++) v.box(0.3 + (hash(i + 20) - 0.3) * 0.5, 0.006, 0.32 + hash(i + 21) * 0.35, 0.03, 0.012, 0.025, ['#7A5A2A', '#A07A3A', '#5E4A26', '#C9A25A'][i % 4]);
    v.box(0.45, 0.012, 0.42, 0.14, 0.006, 0.09, '#9E7A44'); // a little heap
  });
  // the soaked sheets blown in under the door (he steps over them): big, grey-wet at the edges, ink run
  for (const [x, z, r, k] of [[0.55, 2.75, 0.4, 0], [1.0, 3.1, -0.3, 1], [-0.35, 3.05, 0.9, 2], [0.2, 2.25, -0.7, 3], [1.55, 2.6, 0.15, 4]]) {
    boxR(S, x, 0.008, z, 0.42, 0.008, 0.3, '#ECE6D6', 0, r, 0.03);
    boxR(S, x + 0.06, 0.013, z, 0.26, 0.004, 0.12, '#B9B2A2', 0, r + 0.3, 0);
    boxR(S, x - 0.1, 0.014, z + 0.05, 0.14, 0.004, 0.06, '#9E978A', 0, r, 0);
    for (let i = 0; i < 3; i++) boxR(S, x + (i - 1) * 0.07, 0.0135, z - 0.06, 0.2, 0.003, 0.012, '#6E7A9A', 0, r, 0); // the run ink lines
    if (k % 2) boxR(S, x + 0.1, 0.03, z + 0.08, 0.16, 0.05, 0.02, '#E4DECF', 0.6, r, 0); // a curled corner
  }
  const puddles = ctx.part((v) => {
    for (const [x, z, w, d, k] of [[0.2, 3.2, 1.4, 0.5, 1], [0.95, 2.5, 0.7, 0.4, 2], [-1.35, 2.2, 0.5, 0.32, 4], [-0.6, 2.75, 0.45, 0.28, 5]]) wetPatchInto(v, x, z, w, d, k, 0.008);
  }, 0, 0, 0, 0);
  // muddy prints from the door, a broom by the right post
  for (let i = 0; i < 6; i++) boxR(S, (i % 2 ? 0.12 : -0.12) + 0.05, 0.004, 3.0 - i * 0.42, 0.09, 0.004, 0.2, '#4E3A2C', 0, 0.05, 0);
  ctx.put(2.7, 3.05, 0, null, (v) => { boxR(v, 0, 0.6, 0, 0.03, 1.2, 0.03, C.bambooD, 0.12, 0, 0); boxR(v, 0, 0.1, -0.06, 0.24, 0.2, 0.08, C.strawD, 0.12, 0, 0); });
  ctx.put(1.75, 2.85, 0.3, null, (v) => { for (const sx of [-1, 1]) { v.boxMin(sx * 0.08 - 0.05, 0, -0.06, sx * 0.08 + 0.05, 0.3, 0.06, '#2F3A2E'); v.boxMin(sx * 0.08 - 0.05, 0, 0.06, sx * 0.08 + 0.05, 0.08, 0.16, '#2F3A2E'); v.boxMin(sx * 0.08 - 0.052, 0.26, -0.062, sx * 0.08 + 0.052, 0.3, 0.062, '#4A5A44'); } });
  ctx.put(-2.6, 1.5, Math.PI / 2, [1.3, 0.4], (v) => {
    benchInto(v, 1.3, 0.4, 0.36, '#8A6A48');
    prism(v, -0.3, 0.52, 0, 0.2, 0.15, 0.22, C.bamboo, 10);
    prism(v, -0.3, 0.63, 0, 0.21, 0.21, 0.02, C.bambooD, 10);
    for (let i = 0; i < 10; i++) boxR(v, -0.3 + (hash(i) - 0.5) * 0.24, 0.64, (hash(i + 3) - 0.5) * 0.24, 0.16, 0.025, 0.03, i % 3 ? C.leaf : C.leafL, 0, hash(i + 5) * 3, 0.2);
    for (let i = 0; i < 3; i++) v.boxMin(0.1, 0.4 + i * 0.07, -0.16, 0.55, 0.46 + i * 0.07, 0.16, i % 2 ? '#7A5434' : '#6A4A30');
    potInto(v, 0.33, 0.61, 0, 0.5, 'terra');
  });

  ctx.spot('hpohtaw', 0.2, -2.3, 0, { sit: true, seat: 0.42 });
  ctx.spot('maya', -0.9, -0.8, [0.2, -2.3], { sit: true, seat: 0.28 });
  ctx.spot('mayaStand', -0.7, 0.3, [0, -1.6]);
  ctx.spot('hpohtawStand', 0.4, -1.0, [-0.7, 0.3]);
  ctx.spot('basin', BAS.x - 0.35, BAS.z - 0.6, [BAS.x, BAS.z]);
  ctx.spot('hpohtawTrowel', -0.75, 2.55, [-1.1, 3.0]);
  ctx.spot('hpohtawDoor', 0.15, 2.9, Math.PI);
  ctx.spot('door', 0, 2.9, Math.PI);
  ctx.tap('hpohtaw', 0.2, -1.0, [0.2, -2.3], NAME('ဦးဖိုးထော်', 'U Hpo Htaw'));
  ctx.tap('diary', -0.4, -0.95, [-0.4, -1.6], NAME('ဥယျာဉ် မှတ်တမ်း', 'the garden diary'), 0.6);
  ctx.tap('tin', 0.45, -0.95, [0.4, -1.7], NAME('မျိုးစေ့ဘူး', 'the seed tin'), 0.6);
  ctx.tap('shelf', -0.8, -2.3, [-0.8, -hd], NAME('မှတ်တမ်း စင်', 'the diary shelf'), 0.7);
  ctx.tap('basin', BAS.x - 0.4, BAS.z - 0.6, [BAS.x, BAS.z], NAME('ဇလုံ', 'the basin'), 0.6);
  ctx.tap('hook', -2.3, -2.45, [-hw, -2.45], NAME('ချိတ် အလွတ်', 'the empty hook'), 0.6);
  ctx.tap('trowel', -0.75, 2.55, [-1.1, 3.0], NAME('ပေါက်ပြား', 'the trowel'), 0.5);
  const api = ctx.finish('garden');
  puddles.visible = ctx.state.rain;
  api._rainHooks.push((on) => { puddles.visible = on; });
  api.setMug = (on) => { mug.visible = !!on; };
  api.setTrowel = (on) => { trowel.visible = !!on; };
  return api;
}

// =============================================================================================
// dryinghall · the kiln's drying hall (kiln square, north side, east end) · D12 (D10, D15 optional)
// =============================================================================================
const GREENWARE = ['#CDB79A', '#BFA98A', '#D6C4A6', '#B8A387', '#C8B596'];
function greenPotInto(v, x, y, z, s, kind, col) {
  if (kind === 0) { // round pot
    prism(v, x, y + 0.06 * s, z, 0.14 * s, 0.1 * s, 0.12 * s, col, 8);
    prism(v, x, y + 0.15 * s, z, 0.1 * s, 0.14 * s, 0.06 * s, jitter(col, 0.04, 2), 8);
    prism(v, x, y + 0.195 * s, z, 0.09 * s, 0.08 * s, 0.03 * s, jitter(col, -0.06, 3), 8);
  } else if (kind === 1) { // tall jar
    prism(v, x, y + 0.1 * s, z, 0.11 * s, 0.08 * s, 0.2 * s, col, 8);
    prism(v, x, y + 0.23 * s, z, 0.06 * s, 0.11 * s, 0.06 * s, jitter(col, 0.04, 4), 8);
    prism(v, x, y + 0.275 * s, z, 0.07 * s, 0.06 * s, 0.03 * s, jitter(col, -0.06, 5), 8);
  } else { // a stack of bowls
    for (let i = 0; i < 3; i++) prism(v, x, y + (0.025 + i * 0.035) * s, z, 0.15 * s, 0.09 * s, 0.05 * s, jitter(col, 0.03 * i, i), 8);
  }
}
function buildDryingHall(opts = {}) {
  const wet = opts.rain ?? (opts.day === 12 || opts.day === undefined);
  const market = opts.day === 12 || opts.day === undefined || opts.market;
  const ctx = scaffold({ id: 'dryinghall', name: NAME('အိုးအခြောက်ခံ ဆောင်', "The kiln's drying hall"), width: 8, depth: 8, height: 3, wall: '#F2EEE3', wainscot: C.terra, trim: C.terraD, floor: 'plain', floorColor: '#C9A78A', background: '#E6DCC8', ...opts, rain: wet });
  const { S, A, hd, hw } = ctx;
  // brick-tile floor in running bond
  for (let iz = 0; iz < 32; iz++) for (let ix = 0; ix < 18; ix++) {
    const x0 = -hw + ix * 0.5 - (iz % 2 ? 0.25 : 0), xa = Math.max(-hw, x0 + 0.012), xb = Math.min(hw, x0 + 0.5 - 0.012);
    if (xb - xa < 0.05) continue;
    const z0 = -hd + iz * 0.25;
    S.boxMin(xa, 0, z0 + 0.012, xb, 0.012, z0 + 0.238, jitter(['#B5694A', '#A85E42', '#C27756', '#9E5840'][(ix * 3 + iz * 5) % 4], 0.05, ix * 31 + iz));
  }
  ctx.bricks(0.14, 0.98, [C.terra, C.terraL, '#A85E42', C.terraD], { bw: 0.3, bh: 0.1 });
  for (const x of [-2, 2]) ctx.window({ x, y: 2.45, w: 1.1, h: 0.55, frame: C.woodD, sill: C.terraD, bars: 3 });
  // the green-pot racks across the whole back wall: three tiers of unfired pots
  ctx.put(0, -3.64, 0, [8, 0.62], (v) => {
    for (let i = 0; i <= 6; i++) for (const z of [-0.27, 0.27]) v.box(-3.92 + i * 1.307, 1.02, z, 0.07, 2.04, 0.07, C.woodD);
    for (const [t, y] of [[0, 0.3], [1, 0.95], [2, 1.6]]) {
      for (let k = 0; k < 5; k++) v.boxMin(-3.96, y - 0.03, -0.27 + k * 0.11, 3.96, y, -0.2 + k * 0.11, jitter(C.bamboo, 0.07, t * 5 + k));
      v.boxMin(-3.96, y - 0.06, 0.25, 3.96, y - 0.01, 0.3, C.woodD);
      for (let i = 0; i < 21; i++) {
        const x = -3.75 + i * 0.375 + (hash(i + t * 30) - 0.5) * 0.05;
        greenPotInto(v, x, y, (hash(i * 3 + t) - 0.5) * 0.12, 0.95 + hash(i + t) * 0.15, (i + t * 2) % 3, GREENWARE[(i * 7 + t * 3) % 5]);
      }
    }
    v.boxMin(-3.96, 2.04, -0.3, 3.96, 2.1, 0.3, C.woodD);
  });
  // Daw Ohn's stall: a reed mat along the aisle with her pots; Mi Cho's four at its door end
  ctx.put(-2.2, 1.2, 0, null, (v) => {
    v.boxMin(-0.5, 0, -1.0, 0.5, 0.02, 1.0, C.mat);
    for (let i = 0; i < 10; i++) v.boxMin(-0.5, 0.02, -1.0 + i * 0.2 + 0.08, 0.5, 0.024, -1.0 + i * 0.2 + 0.12, C.matD);
    v.boxMin(-0.5, 0.0, -1.0, -0.47, 0.03, 1.0, C.matD);
    v.boxMin(0.47, 0.0, -1.0, 0.5, 0.03, 1.0, C.matD);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) potInto(v, -0.22 + r * 0.44, 0.02, -0.82 + i * 0.36, 0.62 + hash(i + r * 5) * 0.12, ['terra', 'green', 'terra', 'cream'][(i + r) % 4]);
    // Mi Cho's four: smaller, a little lopsided
    for (let i = 0; i < 4; i++) {
      const x = -0.3 + i * 0.2, z = 0.78;
      prism(v, x, 0.08, z, 0.08, 0.06, 0.12, C.terraL, 8, 0.06 * (i - 1.5), 0.05);
      prism(v, x + 0.004 * i, 0.16, z, 0.05, 0.08, 0.05, C.terra, 8, 0.08 * (i - 1.5), 0);
    }
    v.box(0.36, 0.05, 0.92, 0.16, 0.06, 0.004, C.paper);
  });
  const ohnSlate = A.region(180, 110, (g, w, h) => chalkBoard(g, w, h, [{ t: 'ဒေါ်အုန်း', s: 26 }, { t: 'အိုး · ခွက်', s: 22, c: '#F2D58A' }]));
  A.quad(ohnSlate, 0.36, 0.22, M(-1.66, 0.14, 0.4, -Math.PI / 2 + 0.5, -0.5));
  S.box(-1.66, 0.07, 0.42, 0.04, 0.14, 0.04, C.woodD);
  const miCard = A.region(120, 60, (g, w, h) => { g.fillStyle = C.paper; g.fillRect(0, 0, w, h); lines(g, [{ t: 'မိချို', s: 26, c: C.maroon }], w, h); });
  A.quad(miCard, 0.15, 0.075, M(-1.84, 0.1, 2.12, 0, -0.8));
  // the brick stove with the rice pot (the simmer act drives it: setBoil / rattle)
  ctx.put(-3.25, 0.1, 0, [0.85, 0.95], (v, L) => {
    for (let row = 0; row < 3; row++) for (let k = 0; k < 4; k++) {
      const z0 = -0.45 + k * 0.24 - (row % 2) * 0.12, za = Math.max(-0.45, z0 + 0.006), zb = Math.min(0.45, z0 + 0.234);
      if (zb > za) v.boxMin(-0.4, row * 0.1, za, 0.4, row * 0.1 + 0.094, zb, [C.brick, C.brickL, C.brickD][(row + k) % 3]);
    }
    v.boxMin(-0.42, 0.3, -0.47, 0.42, 0.34, 0.47, '#8E4A35');
    for (let i = 0; i < 5; i++) boxR(v, -0.05 + i * 0.04, 0.37, 0.3, 0.05, 0.05, 0.36, i % 2 ? C.woodD : '#6A4A30', 0, 0.2, 0);
    boxR(v, 0.32, 0.36, -0.3, 0.22, 0.012, 0.16, C.bamboo, 0, 0.4, 0); // the hand fan
    L.pool(0.5, 0, 0.8);
  });
  const pot = ctx.prop(angerPot({ boil: opts.boil ?? 0.25, glow: 0.85 }), -3.25, 0.34, 0.05);
  S.box(-hw + 0.03, 1.7, 0.1, 0.03, 0.03, 0.03, C.iron);
  boxR(S, -hw + 0.05, 1.45, 0.1, 0.03, 0.45, 0.03, C.woodL, 0, 0, 0.05);
  prism(S, -hw + 0.06, 1.2, 0.1, 0.06, 0.05, 0.04, C.tinD, 8);
  ctx.put(-2.6, -0.2, 0, [0.32, 0.32], (v) => stoolInto(v, 0, 0, 0.26, C.woodL, C.woodD, 0.3));
  ctx.put(-1.9, -0.4, 0, [0.32, 0.32], (v) => stoolInto(v, 0, 0, 0.26, C.wood, C.woodD, 0.3));
  ctx.put(-2.25, -0.75, 0, [0.36, 0.3], (v) => {
    v.boxMin(-0.18, 0, -0.13, 0.18, 0.28, 0.13, C.woodL);
    for (let i = 0; i < 3; i++) v.boxMin(-0.181, 0.02 + i * 0.09, 0.131, 0.181, 0.08 + i * 0.09, 0.135, jitter(C.woodL, -0.1, i));
    v.boxMin(-0.18, 0.28, -0.13, 0.18, 0.3, 0.13, C.woodD);
  });
  // two sacks of clay and a glaze shelf on the left back wall
  ctx.put(-3.45, -2.6, Math.PI / 2, [0.9, 0.45], (v) => { sackInto(v, -0.22, 0, 1.0, '#BFAE92'); sackInto(v, 0.25, 0.02, 0.92, '#CFC0A2'); });
  ctx.put(-hw + 0.02, -1.6, Math.PI / 2, null, (v) => {
    const y = wallShelfInto(v, 0, 1.55, 0, 1.0, 0.22, C.wood);
    for (let i = 0; i < 4; i++) jarInto(v, -0.36 + i * 0.24, y, 0.11, 0.7, ['#3F6EA8', '#A3A98C', '#E8E2CF', '#8E4A2C'][i], { label: null, glass: false });
    for (let i = 0; i < 3; i++) boxR(v, 0.35 + i * 0.03, y + 0.12, 0.08, 0.012, 0.2, 0.012, C.woodL, 0, 0, 0.1 * (i - 1));
  });
  // Ma Pa Lae's stall: table + blue cloth, wrapped pots, the even glazed pots, sold-out card; shard crate.
  // (pulled forward into the hall, clear of the glaze shelf behind her: she works between the two)
  const TB = { x: 1.95, z: -1.15 };
  ctx.place(kit.table({ w: 2.0, d: 0.8, h: 0.75, top: '#B98A5A', legs: C.woodD }), TB.x, TB.z);
  ctx.put(TB.x, TB.z, 0, null, (v) => {
    v.boxMin(-1.0, 0.45, 0.4, 1.0, 0.752, 0.415, '#2F5D8C');
    for (let i = 0; i < 6; i++) v.boxMin(-0.98 + i * 0.33, 0.45, 0.415, -0.86 + i * 0.33, 0.75, 0.42, '#3F6EA8');
    for (let i = 0; i < 3; i++) potInto(v, -0.7 + i * 0.28, 0.75, -0.15, 0.55, 'blue');
    for (let i = 0; i < 4; i++) {
      const x = 0.15 + (i % 2) * 0.3, z = -0.18 + Math.floor(i / 2) * 0.28;
      prism(v, x, 0.86, z, 0.12, 0.13, 0.22, C.news, 8);
      prism(v, x, 0.98, z, 0.05, 0.1, 0.04, C.newsD, 8);
      v.box(x, 0.9, z, 0.27, 0.012, 0.012, C.ropeD);
    }
    for (let i = 0; i < 3; i++) boxR(v, 0.7, 0.755 + i * 0.004, 0.12, 0.34, 0.004, 0.26, i % 2 ? C.news : C.newsD, 0, 0.1 * i, 0);
    prism(v, 0.86, 0.8, -0.25, 0.06, 0.06, 0.1, C.rope, 10);
  });
  const sold = A.region(240, 120, (g, w, h) => { panel(g, w, h, { bg: '#F4ECD6', border: '#2F5D8C', bw: 6, r: 6 }); lines(g, [{ t: 'မွန်းတည့် ကုန်ပြီ', s: 28, c: '#2F5D8C' }, { t: 'sold out by noon', s: 18, f: 'serif', c: '#5A4A3A', w: 600 }], w, h); });
  ctx.put(TB.x - 0.75, TB.z + 0.25, 0, null, (v, L) => { v.box(0, 0.83, -0.02, 0.32, 0.16, 0.012, C.woodD); L.quad(sold, 0.3, 0.15, 0, 0.84, -0.01, 0, -0.25); }, 0);
  ctx.prop(glazeShelf(), 2.45, 0, -3.0);
  ctx.put(3.4, -1.95, 0, [0.5, 0.36], (v) => {
    crateInto(v, 0, 0, 0, 0.48, 0.26, 0.34, C.woodL, 13);
    for (let i = 0; i < 12; i++) boxR(v, (hash(i) - 0.5) * 0.36, 0.16 + hash(i + 3) * 0.08, (hash(i + 7) - 0.5) * 0.22, 0.09, 0.03, 0.07, [C.blue, C.blueL, C.terra, C.blueD][i % 4], hash(i) * 0.7, hash(i + 2) * 3, hash(i + 5) * 0.6);
  });
  // the children's corner: a slate with a chalk drawing propped on a tiny stool, a spinning top, a rag ball,
  // Mi Cho's clay animals in a row, a tin pot with pebbles, pebbles on the bricks, chalk squares
  const kidSlate = A.region(200, 150, (g, w, h) => {
    g.fillStyle = C.woodD; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2E3A34'; g.fillRect(10, 10, w - 20, h - 20);
    g.strokeStyle = '#F2EFE6'; g.lineWidth = 4; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(40, 110); g.lineTo(40, 70); g.lineTo(70, 44); g.lineTo(100, 70); g.lineTo(100, 110); g.closePath(); g.stroke(); // a house
    g.strokeRect(62, 84, 16, 26);
    g.beginPath(); g.arc(150, 46, 14, 0, 7); g.stroke(); // the sun
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.beginPath(); g.moveTo(150 + Math.cos(a) * 19, 46 + Math.sin(a) * 19); g.lineTo(150 + Math.cos(a) * 26, 46 + Math.sin(a) * 26); g.stroke(); }
    g.strokeStyle = '#F2D58A'; g.beginPath(); g.moveTo(120, 118); g.quadraticCurveTo(140, 96, 165, 118); g.stroke(); // a pot
    g.fillStyle = '#E9A0A0'; g.font = `700 20px ${FONT_MY}`; g.fillText('မိချို', 118, 136);
  });
  ctx.put(3.15, 2.2, -0.5, [0.45, 0.4], (v, L) => {
    stoolInto(v, 0, 0, 0.22, C.woodL, C.woodD, 0.3);
    boxR(v, 0, 0.42, -0.06, 0.4, 0.31, 0.03, C.woodD, -0.25, 0, 0);
    L.quad(kidSlate, 0.36, 0.27, 0, 0.42, -0.04, 0, -0.25);
    v.box(0.12, 0.235, 0.08, 0.06, 0.02, 0.02, C.white); // a stub of chalk
  });
  ctx.put(2.85, 3.0, 0, null, (v) => {
    prism(v, 0, 0.05, 0, 0.002, 0.07, 0.07, '#C8323C', 8); prism(v, 0, 0.1, 0, 0.07, 0.05, 0.03, '#E2B33C', 8); v.box(0, 0.13, 0, 0.015, 0.05, 0.015, C.woodD); // the top
    v.box(0.3, 0.07, -0.1, 0.14, 0.14, 0.14, '#3F6EA8'); v.box(0.3, 0.07, -0.1, 0.145, 0.03, 0.145, '#E8DCC0'); // the rag ball
    for (let i = 0; i < 4; i++) { const x = -0.5 + i * 0.12; v.box(x, 0.035, 0.15, 0.08, 0.05, 0.04, C.terraL); v.box(x + 0.035, 0.07, 0.15, 0.035, 0.04, 0.035, C.terraL); v.box(x - 0.03, 0.01, 0.15, 0.015, 0.02, 0.03, C.terra); }
  });
  // front left: crates of packed pots in straw, a rope coil, a broom; pegs on the left wall with aprons and
  // a straw rain cape still dripping; a leak by the right wall into a bucket (its puddle is in wetBits)
  ctx.put(-3.2, 2.55, 0, [0.7, 1.2], (v) => {
    crateInto(v, 0, 0, -0.3, 0.62, 0.42, 0.5, C.woodL, 21); strawInto(v, 0, 0.42, -0.3, 0.5, 0.4, 0.06, 22);
    for (let i = 0; i < 3; i++) potInto(v, -0.18 + i * 0.18, 0.4, -0.3, 0.42, ['terra', 'cream', 'terra'][i]);
    crateInto(v, 0, 0.0, 0.3, 0.62, 0.42, 0.5, C.wood, 23);
    crateInto(v, 0.02, 0.42, 0.3, 0.58, 0.38, 0.46, C.woodL, 24); strawInto(v, 0.02, 0.8, 0.3, 0.46, 0.36, 0.05, 25);
    prism(v, 0.5, 0.05, 0.62, 0.18, 0.18, 0.1, C.rope, 12); prism(v, 0.5, 0.1, 0.62, 0.1, 0.1, 0.02, C.ropeD, 12);
  });
  ctx.put(-3.55, 1.55, 0, null, (v) => broomInto(v, 0, 0, -0.18));
  S.boxMin(-hw + 0.01, 1.52, 0.1, -hw + 0.05, 1.6, 1.15, C.woodD);
  for (const z of [0.3, 0.65, 1.0]) S.box(-hw + 0.1, 1.56, z, 0.1, 0.035, 0.035, C.woodD);
  S.boxMin(-hw + 0.06, 0.95, 0.22, -hw + 0.11, 1.55, 0.4, '#3E6B4F'); // an apron
  S.boxMin(-hw + 0.06, 1.05, 0.58, -hw + 0.1, 1.55, 0.72, '#B5643C');
  for (let i = 0; i < 5; i++) boxR(S, -hw + 0.1 + i * 0.01, 1.2 - i * 0.04, 1.0, 0.06 + i * 0.015, 0.2, 0.34 + i * 0.03, i % 2 ? C.straw : C.strawD, 0, 0, 0.08); // the straw rain cape
  ctx.emit('drip', -hw + 0.2, 0.95, 1.0, { n: 1, speed: 0.5, spread: 0.02 });
  ctx.put(3.35, 0.85, 0, [0.4, 0.4], (v) => {
    prism(v, 0, 0.13, 0, 0.16, 0.13, 0.26, '#7FA6B5', 10);
    prism(v, 0, 0.26, 0, 0.17, 0.17, 0.015, '#5E8A9A', 10);
    prism(v, 0, 0.23, 0, 0.14, 0.14, 0.01, '#B9D2DC', 10);
  });
  ctx.emit('drip', 3.35, 2.9, 0.85, { n: 2, speed: 0.55, spread: 0.0 });
  ctx.put(2.3, 2.75, 0, null, (v) => {
    prism(v, 0, 0.07, 0, 0.11, 0.1, 0.14, C.tin, 10);
    prism(v, 0, 0.14, 0, 0.115, 0.115, 0.012, C.tinD, 10);
    for (let i = 0; i < 6; i++) v.box(-0.04 + (i % 3) * 0.04, 0.13, -0.03 + Math.floor(i / 3) * 0.05, 0.04, 0.03, 0.04, ['#9E978A', '#C9C2B2', '#7D776C'][i % 3]);
    for (let i = 0; i < 9; i++) v.box(-0.4 + hash(i + 40) * 0.8, 0.018, -0.35 + hash(i + 50) * 0.6, 0.045, 0.03, 0.04, ['#9E978A', '#C9C2B2', '#7D776C', '#B5AFA2'][i % 4]);
    for (let i = 0; i < 4; i++) { const zz = -0.6 - i * 0.36; for (const [a, b, c, d] of [[-0.17, zz, 0.17, zz + 0.012], [-0.17, zz + 0.33, 0.17, zz + 0.342], [-0.17, zz, -0.158, zz + 0.342], [0.158, zz, 0.17, zz + 0.342]]) v.boxMin(a + 0.3, 0.012, c > 0 ? b : b, c + 0.3, 0.016, d, '#F2EFE6'); }
  });
  // umbrellas in a bucket by the door, wet prints, the doorway puddle (rain only)
  ctx.put(-1.45, 3.45, 0, [0.34, 0.34], (v) => {
    prism(v, 0, 0.17, 0, 0.15, 0.13, 0.34, C.tinD, 10);
    for (const [x, z, c, r] of [[-0.05, 0.03, C.maroon, -0.15], [0.05, -0.02, '#2F5D8C', 0.12], [0.0, 0.06, '#3E6B4F', 0.05]]) {
      boxR(v, x, 0.62, z, 0.07, 0.7, 0.07, c, 0, 0, r);
      boxR(v, x + Math.sin(-r) * 0.38, 1.0, z, 0.012, 0.12, 0.012, C.woodD, 0, 0, r);
    }
  });
  const wetBits = ctx.part((v) => {
    wetPatchInto(v, 0, 0, 1.2, 0.75, 7, 0.014, '#7A4532');
    for (let i = 0; i < 8; i++) boxR(v, -0.6 - (i % 2) * 0.15 + i * 0.05, 0.015, -0.6 - i * 0.38, 0.09, 0.004, 0.18, '#7E6A58', 0, 0.1, 0);
    wetPatchInto(v, 2.5, -2.45, 0.8, 0.7, 8, 0.014, '#7A4532'); // the leak's puddle
    wetPatchInto(v, -4.3, -2.35, 0.5, 0.45, 9, 0.014, '#7A4532'); // under the rain cape
  }, 0.8, 0, 3.35, 0);
  // two hanging oil lamps and a calendar
  for (const [x, z] of [[-1.7, -0.9], [0.55, 2.1]]) ctx.put(x, z, 0, null, (v, L) => { const f = hangingLampInto(v, 0, 3.0, 0, 0.75); L.glow(f.x, f.y, f.z, 0.09, 0.12, 0.09); L.pool(0, 0, 1.0); });
  calendarOn(ctx, 'right', -1.0, 1.75, 'ပြက္ခဒိန်', { ring7: true, nextRing: 3 });
  ctx.emit('steam', -3.25, 1.0, 0.05, { n: 3, rise: 0.6, size: 0.08, speed: 0.35 });

  ctx.spot('dawohn', -2.6, -0.2, [-1.9, 0.6], { sit: true, seat: 0.26 });
  ctx.spot('maya', -1.9, -0.4, [-2.6, -0.2], { sit: true, seat: 0.26 });
  ctx.spot('mayaStall', -1.15, 1.2, [-2.2, 1.2]);
  ctx.spot('mayaStove', -2.4, 0.75, [-3.25, 0.1]);
  ctx.spot('micho', -1.4, 2.3, [-2.2, 1.6]);
  ctx.spot('palae', TB.x + 0.1, TB.z - 0.72, 0);
  ctx.spot('queue1', TB.x - 0.55, TB.z + 0.82, [TB.x - 0.3, TB.z]);
  ctx.spot('queue2', TB.x - 1.1, TB.z + 1.4, [TB.x - 0.55, TB.z + 0.82]);
  ctx.spot('queue3', TB.x - 1.55, TB.z + 2.0, [TB.x - 1.1, TB.z + 1.4]);
  ctx.spot('kid1', 2.6, 2.6, [2.0, 2.9]);
  ctx.spot('kid2', 2.0, 2.9, [2.6, 2.6]);
  ctx.spot('mayaKids', 1.4, 2.1, [2.3, 2.75]);
  ctx.spot('kaungRack', 0.4, -2.9, Math.PI);
  ctx.spot('door', 0, 3.4, Math.PI);
  ctx.tap('stall', -1.4, 1.2, [-2.2, 1.2], NAME('ဒေါ်အုန်းရဲ့ ဆိုင်', "Daw Ohn's stall"), 0.8);
  ctx.tap('pot', -2.45, 0.6, [-3.25, 0.1], NAME('ထမင်းအိုး', 'the rice pot'), 0.7);
  ctx.tap('kids', 1.6, 2.4, [2.3, 2.75], NAME('ကလေးတွေ', 'the children'), 0.8);
  ctx.tap('shards', 3.35, -1.3, [3.4, -1.95], NAME('အစမ်း အကွဲတွေ', 'the test shards'), 0.6);
  ctx.tap('racks', -0.8, -2.6, [-0.8, -3.6], NAME('အိုးစိမ်း စင်တွေ', 'the green-pot racks'), 0.8);
  ctx.tap('palae', TB.x - 0.2, TB.z + 0.75, [TB.x + 0.1, TB.z - 0.72], NAME('မပလဲ', 'Ma Pa Lae'), 0.7);
  const api = ctx.finish('square');
  wetBits.visible = ctx.state.rain;
  api._rainHooks.push((on) => { wetBits.visible = on; });
  api.pot = pot;
  api.setBoil = (k) => pot.boil(k);
  api.rattle = () => pot.rattle?.();
  if (!market) for (const n of ['palae', 'stall']) { const i = api.stations.findIndex((s) => s.id === n); if (i >= 0) api.stations.splice(i, 1); }
  return api;
}

// =============================================================================================
// committeeroom · the Market Committee room (brick lean-to on the kiln shed) · D12 (D13 optional)
// =============================================================================================
function buildCommitteeRoom(opts = {}) {
  const wet = opts.rain ?? (opts.day === 12 || opts.day === undefined);
  const ctx = scaffold({ id: 'committeeroom', name: NAME('ဈေးကော်မတီ ရုံးခန်း', 'The Market Committee room'), width: 6, depth: 6, height: 2.8, wall: '#EBD9A8', wainscot: '#8C9682', trim: C.brassD, floor: 'planks', floorColor: '#9A7650', background: '#E8DDC4', ...opts, rain: wet });
  const { S, A, hd, hw } = ctx;
  ctx.plankSeams(0.14, 0.98, '#76806C', 0.2);
  for (let x = -2.8; x < 2.9; x += 0.4) S.box(x, 2.6, -hd + 0.015, 0.2, 0.04, 0.02, C.brassD);
  ctx.window({ x: -1.8, y: 2.15, w: 0.8, h: 0.55, frame: '#5E6A58', sill: C.wood, bars: 2 });
  // ledger shelf (back left), weight cupboard (back right)
  ctx.put(-1.6, -hd + 0.22, 0, [1.3, 0.4], (v) => {
    for (const sx of [-1, 1]) v.boxMin(sx * 0.65 - 0.03, 0, -0.19, sx * 0.65 + 0.03, 1.62, 0.19, C.woodD);
    v.boxMin(-0.65, 0, -0.2, 0.65, 1.62, -0.17, C.teakD);
    for (const [i, y] of [0.06, 0.6, 1.14, 1.6].entries()) {
      v.boxMin(-0.62, y - 0.03, -0.19, 0.62, y, 0.19, C.wood);
      if (i < 3) bookRowInto(v, -0.6, 0.6 - (i === 1 ? 0.35 : 0), y, 0.0, 0.3, 0.42, 5 + i * 4);
    }
    for (let i = 0; i < 3; i++) boxR(v, 0.32 + i * 0.09, 0.62, 0.0, 0.3, 0.05, 0.3, ['#3E4A63', C.maroon, '#3E6B4F'][i], 0, 0.1 * i, 0); // ledgers lying flat
  });
  ctx.put(1.8, -hd + 0.24, 0, [1.1, 0.44], (v) => {
    for (const sx of [-1, 1]) v.boxMin(sx * 0.55 - (sx > 0 ? 0.05 : 0), 0, -0.21, sx * 0.55 + (sx > 0 ? 0 : 0.05), 1.85, 0.2, C.teak);
    v.boxMin(-0.5, 0, -0.21, 0.5, 0.1, 0.2, C.teak);
    v.boxMin(-0.5, 0.06, -0.21, 0.5, 1.8, -0.17, '#5A3420');
    v.boxMin(-0.57, 1.85, -0.23, 0.57, 1.92, 0.23, C.teakD);
    v.boxMin(-0.55, 0, 0.2, 0.55, 0.1, 0.22, C.teakD);
    for (const y of [0.55, 1.05, 1.5]) v.boxMin(-0.5, y - 0.02, -0.18, 0.5, y, 0.16, C.teakL);
    // brass weight sets on the shelves (bell-shaped, graduated)
    for (const [r, y] of [[0, 0.55], [1, 1.05], [2, 1.5]]) for (let i = 0; i < 6; i++) {
      const s = 1.15 - i * 0.12, x = -0.38 + i * 0.15;
      prism(v, x, y + 0.02 * s, 0.0, 0.05 * s, 0.055 * s, 0.04 * s, C.brassD);
      prism(v, x, y + 0.07 * s, 0.0, 0.035 * s, 0.048 * s, 0.06 * s, r === 2 && i === 2 ? '#A88A44' : C.brass);
      prism(v, x, y + 0.115 * s, 0.0, 0.02 * s, 0.02 * s, 0.03 * s, C.brassL);
    }
    // glass doors: frames + mullions, a pale glint
    for (const sx of [-1, 1]) {
      v.boxMin(sx > 0 ? 0.0 : -0.53, 0.1, 0.17, sx > 0 ? 0.53 : 0.0, 0.14, 0.2, C.teakD);
      v.boxMin(sx > 0 ? 0.0 : -0.53, 1.76, 0.17, sx > 0 ? 0.53 : 0.0, 1.82, 0.2, C.teakD);
      v.boxMin(sx * 0.53 - 0.03, 0.1, 0.17, sx * 0.53 + 0.03, 1.82, 0.2, C.teakD);
      boxR(v, sx * 0.26, 1.3, 0.195, 0.04, 0.5, 0.004, '#F4F0E4', 0, 0, 0.5);
    }
    v.boxMin(-0.03, 0.1, 0.17, 0.03, 1.82, 0.21, C.teakD);
    v.box(-0.07, 0.95, 0.22, 0.03, 0.08, 0.02, C.brass);
    v.box(0.07, 0.95, 0.22, 0.03, 0.08, 0.02, C.brass);
  });
  const plate = A.region(220, 60, (g, w, h) => { panel(g, w, h, { bg: C.brassL, border: C.brassD, bw: 6, r: 4 }); lines(g, [{ t: 'စံ အလေးချိန်', s: 24, c: '#3A2A1A' }], w, h); });
  ctx.wallQuad(plate, 'back', 1.8, 2.08, 0.5, 0.14, 0.05);
  // the committee table: ledger, table scale, ink, lamp, slips; Daw Mya Mya's chair behind it
  ctx.place(kit.table({ w: 1.6, d: 0.8, h: 0.76, top: C.teak, legs: C.teakD }), 0, -1.4);
  ctx.place(kit.chair({ color: '#3E6B4F', wood: C.teakD }), 0, -2.1, 0);
  const ledger = A.region(256, 170, (g, w, h) => {
    g.fillStyle = '#F2EAD2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#E2D6B6'; g.fillRect(w / 2 - 3, 0, 6, h);
    for (const x0 of [8, w / 2 + 8]) {
      g.strokeStyle = '#C9B48A'; g.lineWidth = 1.5;
      for (const f of [0.55, 0.8]) { g.beginPath(); g.moveTo(x0 + (w / 2 - 16) * f, 6); g.lineTo(x0 + (w / 2 - 16) * f, h - 6); g.stroke(); }
      scribble(g, x0, 6, w / 2 - 16, h - 12, { rows: 9, seed: x0, ink: '#2E3B5A', margin: null });
    }
  });
  ctx.put(0, -1.4, 0, null, (v, L) => {
    v.boxMin(-0.6, 0.76, -0.38, 0.6, 0.764, 0.38, '#3E6B4F'); // a green cloth on the top
    v.boxMin(-0.32, 0.764, -0.12, 0.2, 0.78, 0.22, '#3F2A1E');
    L.quad(ledger, 0.5, 0.32, -0.06, 0.782, 0.05, 0, -Math.PI / 2);
    boxR(v, 0.1, 0.79, 0.12, 0.012, 0.012, 0.16, C.ink, 0, 0.6, 0);
    // the table scale (two pans on a beam)
    v.boxMin(0.38, 0.764, -0.25, 0.62, 0.8, -0.05, C.teakD);
    v.box(0.5, 0.95, -0.15, 0.03, 0.3, 0.03, C.brassD);
    v.box(0.5, 1.1, -0.15, 0.36, 0.025, 0.025, C.brass);
    for (const sx of [-1, 1]) { v.box(0.5 + sx * 0.17, 1.0, -0.15, 0.006, 0.1, 0.006, C.brassD); prism(v, 0.5 + sx * 0.17, 0.94, -0.15, 0.08, 0.07, 0.02, C.brassL, 10); }
    prism(v, 0.5, 1.15, -0.15, 0.02, 0.03, 0.06, C.brassD);
    prism(v, -0.5, 0.79, -0.2, 0.04, 0.045, 0.06, '#1E2E44');
    boxR(v, -0.47, 0.86, -0.2, 0.012, 0.14, 0.012, C.paper, 0, 0, -0.35);
    for (let i = 0; i < 6; i++) boxR(v, -0.48, 0.768 + i * 0.005, 0.15, 0.16, 0.004, 0.11, i % 2 ? C.paper : '#EFE4C8', 0, (hash(i) - 0.5) * 0.3, 0);
    v.box(-0.12, 0.78, -0.3, 0.1, 0.03, 0.06, C.brassD); // the committee's seal
    const f = oilLampInto(v, 0.62, 0.764, 0.25, 1.0);
    L.glow(f.x, f.y, f.z, 0.03, 0.06, 0.03);
    L.pool(0.4, 0.1, 0.8, 0.77);
    L.pool(0, 0.3, 1.3);
  });
  // front left: the complaints bench (a low writing table) + stool, its card; old notices on the wall
  ctx.put(-1.8, 0.9, 0, [1.4, 0.6], (v, L) => {
    v.boxMin(-0.7, 0.66, -0.3, 0.7, 0.71, 0.3, C.wood);
    for (const sx of [-1, 1]) v.boxMin(sx * 0.62 - 0.04, 0, -0.26, sx * 0.62 + 0.04, 0.66, 0.26, C.woodD);
    v.boxMin(-0.6, 0.15, -0.02, 0.6, 0.2, 0.02, C.woodD);
    for (let i = 0; i < 5; i++) boxR(v, -0.3 + i * 0.012, 0.712 + i * 0.004, 0.0, 0.2, 0.004, 0.27, '#F2EAD2', 0, 0.03 * i, 0);
    prism(v, 0.25, 0.73, -0.15, 0.035, 0.04, 0.05, '#1E2E44');
    boxR(v, 0.1, 0.716, 0.05, 0.14, 0.012, 0.012, C.mustard, 0, -0.3, 0);
    v.box(0.1, 0.716, 0.13, 0.006, 0.006, 0.16, C.ropeD);
    v.boxMin(-0.68, 0.71, -0.29, 0.68, 0.73, -0.26, C.woodD);
    v.box(0.45, 0.83, -0.27, 0.48, 0.2, 0.02, C.woodD);
  });
  const complaint = A.region(300, 110, (g, w, h) => { panel(g, w, h, { bg: '#F4ECD6', border: C.maroon, bw: 6, r: 6 }); lines(g, [{ t: 'တိုင်ကြားစာ ဒီမှာ ရေးပါ', s: 27, c: C.maroon }, { t: 'write complaints here', s: 17, f: 'serif', c: '#5A4A3A', w: 600 }], w, h); });
  A.quad(complaint, 0.46, 0.17, M(-1.35, 0.84, 0.645));
  ctx.put(-1.8, 0.38, 0, [0.32, 0.32], (v) => stoolInto(v, 0, 0, 0.42, C.wood, C.woodD, 0.32));
  const notices = A.region(400, 300, (g, w, h) => {
    g.fillStyle = '#B88E5E'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#A27A4E'; for (let i = 0; i < 40; i++) g.fillRect(hash(i) * w, hash(i + 3) * h, 6, 4);
    const notes = [[16, 16, 170, 120, 'ဈေးနေ့', '၇ ရက်တစ်ခါ'], [200, 22, 180, 110, 'ဆိုင်ခ', 'တစ်နေ့ ...'], [30, 150, 160, 130, 'ချိန်ခွင်', 'လအလိုက် စစ်'], [210, 150, 170, 120, 'အစည်းအဝေး', 'လပြည့်နေ့']];
    for (const [x, y, ww, hh, a, b] of notes) {
      g.save(); g.translate(x + ww / 2, y + hh / 2); g.rotate((hash(x) - 0.5) * 0.08);
      g.fillStyle = '#F2EAD2'; g.fillRect(-ww / 2, -hh / 2, ww, hh);
      g.fillStyle = C.red; g.beginPath(); g.arc(0, -hh / 2 + 8, 5, 0, 7); g.fill();
      g.restore();
      g.save(); g.translate(x, y); lines(g, [{ t: a, s: 22, c: C.maroon }, { t: b, s: 17, c: '#4A4038' }], ww, hh); g.restore();
    }
  });
  ctx.wallQuad(notices, 'left', -1.05, 1.62, 1.0, 0.75, 0.04);
  S.boxMin(-hw + 0.01, 1.22, -1.58, -hw + 0.04, 2.02, -0.52, C.woodD);
  // front right: the waiting bench; front left, clear of the doorway: the umbrella stand (wet); a clock
  ctx.put(2.55, 1.2, -Math.PI / 2, [1.5, 0.38], (v) => benchInto(v, 1.5, 0.42, 0.36, C.teakL));
  ctx.put(-2.4, 2.35, 0, [0.3, 0.3], (v) => {
    prism(v, 0, 0.27, 0, 0.13, 0.12, 0.54, '#3E6B4F', 10);
    prism(v, 0, 0.54, 0, 0.14, 0.14, 0.03, C.brass, 10);
    for (const [x, z, c, r] of [[-0.04, 0.02, C.maroon, -0.12], [0.05, -0.03, C.ink, 0.1]]) { boxR(v, x, 0.75, z, 0.06, 0.62, 0.06, c, 0, 0, r); boxR(v, x + Math.sin(-r) * 0.34, 1.1, z, 0.015, 0.12, 0.015, C.woodD, 0, 0, r); }
  });
  wetPatchInto(S, -2.35, 2.45, 0.7, 0.55, 11, 0.003, '#6E5236');
  clockOn(ctx, 0.2, 2.2);
  const board = A.region(260, 70, (g, w, h) => { panel(g, w, h, { bg: C.maroon, border: C.gold, bw: 6, r: 4 }); lines(g, [{ t: 'ဈေးကော်မတီ', s: 30, c: C.gold }], w, h); });
  ctx.wallQuad(board, 'back', -0.1, 2.58, 0.7, 0.19, 0.05);
  // the trader's weight box (carried in on the day: setBox(true))
  const box = ctx.part((v) => {
    v.boxMin(-0.18, 0, -0.12, 0.18, 0.14, 0.12, '#6A3E24');
    v.boxMin(-0.185, 0.12, -0.125, 0.185, 0.16, 0.125, '#5A3420');
    v.box(0, 0.08, 0.125, 0.05, 0.05, 0.01, C.brass);
  }, 0.0, 0.0, 0.0);
  box.visible = !!opts.box;
  box.position.set(-0.45, 0.764, -1.3);

  // lived-in: a worn mat under the committee table, the tea stool by her chair, tied old ledgers on the floor,
  // a calendar on the right wall, a potted plant by the waiting bench
  ctx.floorPatch(0, -1.25, 2.7, 2.1, '#8E3A34', 0.004);
  ctx.floorPatch(0, -1.25, 2.5, 1.9, '#B5564A', 0.006);
  for (let i = 0; i < 6; i++) S.boxMin(-1.25, 0.006, -2.1 + i * 0.34, 1.25, 0.008, -2.07 + i * 0.34, C.gold);
  ctx.put(-1.0, -2.2, 0, [0.34, 0.34], (v) => {
    stoolInto(v, 0, 0, 0.42, C.teak, C.teakD, 0.34);
    prism(v, -0.06, 0.55, 0.0, 0.06, 0.06, 0.26, '#3F79B5');
    prism(v, -0.06, 0.69, 0.0, 0.045, 0.045, 0.03, C.tinL);
    cupInto(v, 0.08, 0.42, 0.06, C.white);
    cupInto(v, 0.1, 0.42, -0.08, C.cream);
  });
  ctx.put(-2.55, -1.95, 0.3, [0.5, 0.4], (v) => {
    for (let i = 0; i < 4; i++) boxR(v, (hash(i) - 0.5) * 0.04, 0.04 + i * 0.075, 0, 0.42, 0.07, 0.3, ['#3E4A63', C.maroon, '#6B5A3A', '#3E6B4F'][i], 0, (hash(i + 2) - 0.5) * 0.2, 0);
    v.box(0, 0.16, 0, 0.44, 0.33, 0.02, C.ropeD);
    v.box(0, 0.16, 0, 0.02, 0.33, 0.32, C.ropeD);
  });
  calendarOn(ctx, 'right', -0.9, 1.55, 'ပြက္ခဒိန်', { ring7: true, nextRing: 5 });
  ctx.put(2.25, 2.4, 0, [0.4, 0.4], (v) => {
    potInto(v, 0, 0, 0, 0.7, 'terra');
    for (let i = 0; i < 7; i++) boxR(v, (hash(i) - 0.5) * 0.18, 0.42 + hash(i + 1) * 0.3, (hash(i + 4) - 0.5) * 0.18, 0.08, 0.28, 0.02, i % 2 ? C.leaf : C.leafD, (hash(i + 2) - 0.5) * 0.8, hash(i) * 3, (hash(i + 6) - 0.5) * 0.8);
  });
  ctx.spot('myamya', 0, -2.1, 0, { sit: true, seat: 0.46 });
  ctx.spot('dawohn', -1.8, 0.38, 0, { sit: true, seat: 0.42 });
  ctx.spot('ohnHand', -0.3, -0.5, [0, -1.4]);
  ctx.spot('maya', 1.12, -1.05, [0.3, -1.45]); // at the table's end, beside the lamp, not in front of it
  ctx.spot('mayaDoor', 0.4, 2.0, [0, -1.4]);
  ctx.spot('mayaBench', -0.85, 1.05, [-1.8, 0.9]);
  ctx.spot('kyinyein', -1.12, -1.05, [-0.3, -1.45]);
  ctx.spot('kyinyeinCupboard', 1.8, -1.6, Math.PI);
  ctx.spot('girl', 2.55, 1.2, -Math.PI / 2, { sit: true, seat: 0.42 });
  ctx.spot('door', 0, 2.4, Math.PI);
  ctx.tap('myamya', 0, -0.7, [0, -2.1], NAME('ဒေါ်မြမြ', 'Daw Mya Mya'));
  ctx.tap('bench', -1.0, 1.1, [-1.8, 0.9], NAME('တိုင်ကြားစာ ခုံ', 'the complaints bench'), 0.6);
  ctx.tap('cupboard', 1.8, -1.6, [1.8, -2.75], NAME('အလေးတုံး ဗီရို', 'the weight cupboard'), 0.6);
  ctx.tap('notices', -2.3, -1.05, [-hw, -1.05], NAME('ကြော်ငြာ ဘုတ်', 'the old notices'), 0.6);
  ctx.tap('ledger', -0.35, -0.75, [-0.06, -1.35], NAME('စာရင်းစာအုပ်', 'the ledger'), 0.5);
  const api = ctx.finish('square');
  api.setBox = (on) => { box.visible = !!on; };
  return api;
}

// =============================================================================================
// lodge · the travellers' lodge on the Blank Page · D13 (owner), D14 (tour stop)
// =============================================================================================
const MAT_X = [-2.75, -1.65, -0.55, 0.55, 1.65, 2.75];
/** A sleeping mat (local: centred, head toward -z), pillow, blanket rolled or spread. */
function sleepMatInto(v, used, seed, col = C.mat) {
  v.boxMin(-0.4, 0, -0.95, 0.4, 0.025, 0.95, col);
  for (let i = 0; i < 9; i++) v.boxMin(-0.4, 0.025, -0.95 + i * 0.21 + 0.09, 0.4, 0.029, -0.95 + i * 0.21 + 0.12, C.matD);
  for (const sx of [-1, 1]) v.boxMin(sx * 0.4 - (sx > 0 ? 0.03 : 0), 0, -0.95, sx * 0.4 + (sx > 0 ? 0 : 0.03), 0.035, 0.95, '#A08450');
  v.boxMin(-0.26, 0.025, -0.88, 0.26, 0.11, -0.6, jitter(['#E9DFC9', '#D9CBB0', '#F0E6D2'][seed % 3], 0.03, seed));
  v.boxMin(-0.27, 0.07, -0.86, 0.27, 0.075, -0.62, jitter('#C9B89A', 0, seed));
  const bl = ['#8E3B46', '#3E5C8A', '#6E7A3A', '#B5643C', '#5E4A6E', '#2F7C7A'][seed % 6];
  if (used) {
    v.boxMin(-0.36, 0.025, -0.5, 0.36, 0.07, 0.75, bl);
    for (let i = 0; i < 4; i++) v.boxMin(-0.361, 0.03, -0.42 + i * 0.3, 0.361, 0.072, -0.36 + i * 0.3, jitter(bl, 0.18, i));
    boxR(v, 0.1, 0.075, -0.45, 0.6, 0.06, 0.25, jitter(bl, 0.08, 9), 0, 0.15, 0); // folded back corner
  } else {
    prism(v, 0, 0.12, 0.6, 0.11, 0.11, 0.62, bl, 8, 0, Math.PI / 2);
    v.box(-0.2, 0.12, 0.6, 0.02, 0.235, 0.235, C.ropeD);
    v.box(0.2, 0.12, 0.6, 0.02, 0.235, 0.235, C.ropeD);
  }
}
function buildLodge(opts = {}) {
  const day = opts.day ?? 13;
  const ctx = scaffold({ id: 'lodge', name: NAME('ခရီးသည် တည်းခိုဆောင်', "The travellers' lodge"), width: 7, depth: 8, height: 2.8, wall: '#CDA97E', wainscot: '#8E6440', trim: C.teakD, floor: 'planks', floorColor: C.teak, background: '#F2EDE2', nightKeep: 0.74, nightFill: 1.25, poolNight: 0.6, ...opts });
  const { S, A, hd, hw } = ctx;
  ctx.plankSeams(0.14, 0.98, '#6E4A2E', 0.28);
  ctx.plankSeams(1.06, 2.66, '#B08A5E', 0.28);
  for (let x = -hw + 0.2; x < hw; x += 0.9) S.boxMin(x - 0.07, 2.5, -hd, x + 0.07, 2.66, -hd + 0.12, C.teakD); // rafter ends
  for (const x of [-2.2, 2.2]) ctx.window({ x, y: 1.75, w: 0.7, h: 0.5, frame: C.teakD, sill: C.teak, shutters: '#8E6440' });
  // the six mats along the back wall: three empty (blankets rolled), the travellers' three as moving parts
  for (let i = 0; i < 3; i++) ctx.put(MAT_X[i], -2.95, 0, null, (v) => sleepMatInto(v, false, i));
  const travel = [
    (v) => { // Moe: a cloth bag, a small notebook, sandals at the foot
      v.boxMin(0.18, 0.025, -0.45, 0.4, 0.2, -0.2, '#6B3E64'); v.box(0.29, 0.21, -0.32, 0.08, 0.03, 0.2, C.ropeD);
      v.boxMin(-0.3, 0.07, 0.3, -0.1, 0.085, 0.45, '#E9DFC9');
    },
    (v) => { // Ko Pyae Sone: the small radio and the card spread
      v.boxMin(-0.38, 0.07, -0.42, -0.12, 0.2, -0.3, '#7A3A2A');
      v.boxMin(-0.36, 0.09, -0.3, -0.2, 0.18, -0.295, '#D9C9A0');
      v.box(-0.16, 0.135, -0.297, 0.04, 0.04, 0.006, C.gold);
      boxR(v, -0.36, 0.32, -0.4, 0.008, 0.26, 0.008, C.tinL, 0.3, 0, 0.35);
      for (let i = 0; i < 9; i++) boxR(v, 0.0 + Math.cos(i * 0.32) * 0.18, 0.075 + i * 0.002, 0.15 + Math.sin(i * 0.32) * 0.12, 0.06, 0.003, 0.09, i % 3 ? C.white : C.red, 0, -0.5 + i * 0.16, 0);
      v.boxMin(0.15, 0.025, 0.45, 0.4, 0.3, 0.7, '#3E5C8A');
    },
    (v) => { // Ma Shwe Sin: a backpack, a water bottle, a folded scarf
      v.boxMin(0.12, 0.025, 0.4, 0.4, 0.38, 0.62, '#B5643C'); v.boxMin(0.15, 0.1, 0.62, 0.37, 0.25, 0.68, '#8E4A2C');
      prism(v, -0.25, 0.12, 0.55, 0.035, 0.035, 0.22, '#7FB0CF', 8);
      v.boxMin(-0.32, 0.07, -0.3, -0.05, 0.1, -0.12, C.mustard);
    },
  ];
  // the three used mats: one merged mesh per rest state ("apart" / "together", 2 draw calls); the three
  // separate meshes only show while they slide (setMats)
  const matFn = (i) => (v) => { sleepMatInto(v, true, i + 3, i === 1 ? C.matL : C.mat); travel[i](v); };
  const TOGETHER = [0.55, 1.35, 2.15];
  const restMats = (k) => ctx.part((v) => {
    for (let i = 0; i < 3; i++) { const sub = new VoxelBuilder(); matFn(i)(sub); v.merge(sub, M(lerp(MAT_X[i + 3], TOGETHER[i], k), 0, 0)); }
  }, 0, 0, -2.95, 1.2);
  const mats = [0, 1, 2].map((i) => { const m = ctx.part(matFn(i), MAT_X[i + 3], 0, -2.95, 1.2); m.visible = false; return m; });
  const rest = [restMats(0), null];
  const matState = { target: opts.mats === 'together' ? 1 : 0, k: opts.mats === 'together' ? 1 : 0 };
  if (matState.k) rest[1] = restMats(1);
  ctx.animate((dt) => {
    matState.k += (matState.target - matState.k) * Math.min(1, dt * 2.5);
    const moving = Math.abs(matState.target - matState.k) > 0.002;
    if (!moving) matState.k = matState.target;
    mats.forEach((m, i) => { m.visible = moving; m.position.x = lerp(MAT_X[i + 3], TOGETHER[i], matState.k); });
    if (!moving && !rest[matState.target]) rest[matState.target] = restMats(matState.target);
    rest.forEach((r, k) => { if (r) r.visible = !moving && k === matState.target; });
  });
  // the hearth on the left wall, its hood and pipe, firewood; Daw Pwint's stool
  ctx.put(-3.0, -1.0, 0, [0.95, 1.15], (v, L) => {
    v.boxMin(-0.45, 0, -0.55, 0.45, 0.2, 0.55, '#9E7A5A');
    v.boxMin(-0.47, 0.2, -0.57, 0.47, 0.24, 0.57, '#7E5A3E');
    v.boxMin(-0.32, 0.24, -0.35, 0.32, 0.245, 0.35, '#5A4A40');
    for (const [x, z] of [[-0.12, -0.14], [0.14, -0.08], [0.0, 0.16]]) v.box(x, 0.3, z, 0.12, 0.12, 0.12, '#6E665C');
    for (let i = 0; i < 5; i++) v.box(Math.cos(i * 1.4) * 0.07, 0.26, Math.sin(i * 1.4) * 0.07, 0.07, 0.03, 0.05, '#3A2A22');
    L.glow(0.02, 0.27, 0.0, 0.12, 0.02, 0.1);
    L.pool(0.75, 0, 1.45);
    L.emit('ember', 0, 0.35, 0, { n: 3, rise: 0.4, spread: 0.08, size: 0.04, speed: 0.3 });
    const sp = kettleInto(v, 0.0, 0.36, 0.0, 1.05, C.iron);
    L.emit('steam', sp.x, sp.y + 0.03, sp.z, { n: 3, rise: 0.5, size: 0.06, speed: 0.4 });
    v.boxMin(-0.42, 1.55, -0.45, 0.2, 1.7, 0.45, C.tinD);
    v.boxMin(-0.42, 1.7, -0.3, 0.0, 1.85, 0.3, C.tin);
    v.boxMin(-0.38, 1.85, -0.08, -0.22, 2.8, 0.08, C.ironL);
    L.emit('smoke', 0.0, 0.7, 0.0, { n: 3, rise: 0.8, spread: 0.06, size: 0.08, speed: 0.22 });
  });
  ctx.put(-3.15, -2.05, 0, [0.5, 0.5], (v) => { for (let i = 0; i < 7; i++) boxR(v, -0.15 + (i % 4) * 0.1, 0.06 + Math.floor(i / 4) * 0.1, 0, 0.08, 0.08, 0.5, i % 2 ? C.woodD : '#6A4A30', 0, 0.05 * (i - 3), 0); });
  ctx.put(-hw + 0.02, -2.2, Math.PI / 2, null, (v) => {
    const y = wallShelfInto(v, 0, 1.45, 0, 0.9, 0.22, C.teak);
    for (let i = 0; i < 4; i++) prism(v, -0.32 + i * 0.12, y + 0.04, 0.1, 0.035, 0.03, 0.08, C.tinL, 8);
    prism(v, 0.15, y + 0.09, 0.1, 0.07, 0.07, 0.18, C.red, 10); prism(v, 0.15, y + 0.185, 0.1, 0.072, 0.072, 0.02, C.gold, 10);
    jarInto(v, 0.33, y, 0.1, 0.7, '#F2EFE6', { label: null });
  });
  ctx.put(-2.2, -0.9, 0, [0.3, 0.3], (v) => stoolInto(v, 0, 0, 0.24, C.teakL, C.teakD, 0.3));
  // the low table with her lamp wicks, the cups and the Guest Cup; floor cushions round it
  ctx.put(-1.6, 0.4, 0, [0.95, 0.65], (v) => {
    lowTableInto(v, 0, 0, 0.95, 0.62, 0.32, C.teakL, C.teakD, 7);
    prism(v, -0.25, 0.335, -0.1, 0.09, 0.07, 0.03, C.brass, 10);
    for (let i = 0; i < 6; i++) boxR(v, -0.25 + (i - 2.5) * 0.02, 0.36, -0.1, 0.012, 0.012, 0.12, C.white, 0, 0.3 * i, 0);
    v.boxMin(-0.1, 0.32, -0.2, 0.06, 0.37, -0.06, '#F4F0E6');
    cupInto(v, 0.12, 0.32, 0.05, C.white);
    cupInto(v, 0.3, 0.32, -0.12, '#E6EEF0');
    cupInto(v, -0.05, 0.32, 0.17, C.cream);
    v.box(-0.05, 0.395, 0.17, 0.062, 0.008, 0.062, C.gold); // the Guest Cup's gold rim
    teapotInto(v, 0.3, 0.32, 0.12, 1.0, C.terraD);
  });
  for (const [x, z] of [[-1.6, -0.25], [-2.4, 0.4], [-0.8, 0.4], [-1.6, 1.05]]) ctx.put(x, z, 0, null, (v) => { v.boxMin(-0.2, 0, -0.2, 0.2, 0.07, 0.2, '#8E3B46'); v.boxMin(-0.16, 0.07, -0.16, 0.16, 0.08, 0.16, '#A2505A'); });
  // the clay water pot on its stand, a saucer under the slow drip
  ctx.put(-3.0, 1.8, 0, [0.5, 0.5], (v, L) => { waterJarInto(v, 0, 0, 1.0); prism(v, 0.1, 0.012, 0.12, 0.1, 0.08, 0.024, C.terraL, 10); prism(v, 0.1, 0.022, 0.12, 0.08, 0.08, 0.004, C.water, 10); L.emit('drip', 0.1, 0.25, 0.12, { n: 1, speed: 0.35, spread: 0.0, always: true }); });
  // the centre post: oil lamp on its hook (+x side), the route map at eye height, the scorch on the boards
  ctx.put(1.0, 0.0, 0, [0.22, 0.22], (v) => {
    v.box(0, 1.4, 0, 0.18, 2.8, 0.18, C.teakD);
    v.boxMin(-0.13, 0, -0.13, 0.13, 0.12, 0.13, '#5E3A22');
    v.boxMin(-0.12, 2.45, -0.12, 0.12, 2.55, 0.12, '#5E3A22');
    v.box(0.13, 1.96, 0, 0.1, 0.025, 0.025, C.iron);
    v.box(0.17, 1.93, 0, 0.02, 0.05, 0.02, C.iron);
    for (let i = 0; i < 3; i++) v.box(-0.07 + i * 0.07, 1.12 - i * 0.2, 0.091, 0.04, 0.01, 0.004, '#4A2E1C'); // old knife marks
  });
  const lamp = ctx.prop(oilLamp6({ hung: opts.lampLow ? 'low' : 'high' }), 1.17, 1.9, 0.0);
  ctx.pool(1.0, 0.1, 1.6); // the post lamp's pool over the middle of the room
  ctx.pool(-1.6, 0.4, 0.7, 0.33); // and on the low table
  lamp.setGlow(1);
  const routeMap = A.region(220, 260, (g, w, h) => {
    g.fillStyle = '#F4ECD6'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#B9A27A'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
    g.strokeStyle = '#6E5A3A'; g.lineWidth = 5; g.setLineDash([12, 8]);
    g.beginPath(); g.moveTo(30, h - 30); g.bezierCurveTo(60, 160, 170, 170, 120, 90); g.bezierCurveTo(90, 50, 160, 40, 190, 26); g.stroke();
    g.setLineDash([]);
    for (const [x, y, c] of [[30, h - 30, C.maroon], [120, 92, C.gold], [190, 26, '#2F5D8C']]) { g.fillStyle = c; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); }
    lines(g, [{ t: 'လမ်း', s: 26, c: '#4A3A2A' }], w, 50, { y0: 6 });
    g.fillStyle = '#C9B48A'; for (let i = 0; i < 5; i++) g.fillRect(150 + i * 10, 200 - i * 8, 6, 6);
  });
  const mapQ = ctx.part((v) => { v.box(0, 0, -0.004, 0.32, 0.38, 0.008, '#E8DCC0'); for (const [x, y] of [[-0.14, 0.17], [0.14, 0.17]]) v.box(x, y, 0.004, 0.025, 0.025, 0.012, C.red); }, 1.0, 1.45, 0.1, 0);
  A.quad(routeMap, 0.3, 0.355, M(1.0, 1.45, 0.106));
  for (let i = 0; i < 7; i++) boxR(S, 1.25 + (hash(i) - 0.5) * 0.36, 0.003 + i * 0.0004, 0.35 + (hash(i + 4) - 0.5) * 0.3, 0.1 + hash(i + 2) * 0.16, 0.003, 0.08 + hash(i + 6) * 0.12, i < 3 ? '#3A2418' : '#5E3A22', 0, hash(i + 8) * 3, 0);
  const gk = ctx.prop(gecko({ w: 0.1, h: 0.4, seed: 5 }), 1.0, 2.15, 0.1);
  // the right wall: torch peg, towels; the house board just right of the door, on its plank post
  S.box(hw - 0.06, 1.4, 0.8, 0.1, 0.04, 0.04, C.teakD);
  boxR(S, hw - 0.1, 1.26, 0.8, 0.06, 0.22, 0.06, '#2F3A46', 0, 0, 0.08);
  boxR(S, hw - 0.1, 1.15, 0.8, 0.075, 0.05, 0.075, C.tinL, 0, 0, 0.08);
  S.box(hw - 0.06, 1.55, 0.25, 0.1, 0.04, 0.04, C.teakD);
  S.boxMin(hw - 0.09, 1.1, 0.12, hw - 0.05, 1.55, 0.4, C.cream);
  ctx.put(2.95, 2.4, -Math.PI / 2 + 0.55, [0.5, 0.3], (v) => {
    v.boxMin(-0.6, 0, -0.08, 0.6, 1.95, -0.02, C.teakD);
    for (let i = 0; i < 5; i++) v.boxMin(-0.58 + i * 0.235, 0.04, -0.02, -0.36 + i * 0.235, 1.9, -0.012, jitter(C.teak, 0.06, i));
    v.boxMin(-0.64, 1.95, -0.1, 0.64, 2.02, 0.02, C.teakD);
    for (const sx of [-1, 1]) v.boxMin(sx * 0.52 - 0.06, 0, -0.2, sx * 0.52 + 0.06, 0.06, 0.12, C.teakD);
  });
  const board = ctx.prop(houseBoard({ cover: opts.cover ?? day === 13 }), 2.95 - Math.sin(-Math.PI / 2 + 0.55) * 0.0, 0.95, 2.4, -Math.PI / 2 + 0.55);
  if (opts.signed) for (const s of opts.signed) board.sign(s.who, s.lines);
  // pegs with a hat and a scarf (left wall, front), packs on the right, sandals by the door + the hairpin
  S.boxMin(-hw + 0.01, 1.45, 0.3, -hw + 0.05, 1.52, 1.3, C.teakD);
  for (const z of [0.45, 0.8, 1.15]) S.box(-hw + 0.1, 1.48, z, 0.1, 0.03, 0.03, C.teakD);
  prism(S, -hw + 0.16, 1.4, 0.45, 0.2, 0.05, 0.08, C.straw, 10, 0, Math.PI / 2);
  S.boxMin(-hw + 0.08, 0.95, 0.74, -hw + 0.13, 1.47, 0.86, C.maroon);
  ctx.put(3.05, 0.6, 0, [0.5, 0.9], (v) => {
    for (const [z, c] of [[-0.25, '#6E7A3A'], [0.2, '#3E4A63']]) { v.boxMin(-0.18, 0, z - 0.17, 0.2, 0.46, z + 0.17, c); v.boxMin(-0.22, 0.08, z - 0.12, -0.18, 0.3, z + 0.12, jitter(c, -0.15, 2)); v.box(0.0, 0.47, z, 0.3, 0.03, 0.06, C.ropeD); }
  });
  ctx.put(-0.9, 3.3, 0, null, (v) => {
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) {
      const x = -0.5 + i * 0.25 + s * 0.05;
      v.boxMin(x - 0.04, 0, -0.11, x + 0.04, 0.02, 0.11, ['#5E3A22', '#2E3D63', '#7A2533', '#3E3630', '#8E6A44'][i]);
      v.boxMin(x - 0.035, 0.02, -0.04, x + 0.035, 0.03, -0.02, '#C9B48A');
    }
  });
  ctx.prop(hairpin(), -0.5, 0.01, 3.42, 0.6);
  ctx.put(2.75, 3.2, 0, null, (v) => { boxR(v, 0, 0.6, 0, 0.03, 1.2, 0.03, C.bambooD, 0.1, 0, -0.08); boxR(v, 0.01, 0.1, -0.05, 0.22, 0.2, 0.08, C.strawD, 0.1, 0, -0.08); });

  ctx.spot('dawpwint', -2.2, -0.9, [-1.6, 0.4], { sit: true, seat: 0.24 });
  ctx.spot('dawpwintBoard', 2.5, 1.85, [2.95, 2.4]);
  ctx.spot('moe', MAT_X[3], -2.5, 0, { sit: true, seat: 0.1 });
  ctx.spot('pyaesone', MAT_X[4], -2.5, 0, { sit: true, seat: 0.1 });
  ctx.spot('shwesin', MAT_X[5], -2.5, 0, { sit: true, seat: 0.1 });
  ctx.spot('maya', 0, 1.2, [1.3, -2.6]);
  ctx.spot('mayaBoard', 2.25, 2.85, [2.95, 2.4]);
  ctx.spot('sceneGecko', 0.9, 1.0, [1.0, 2.0]);
  ctx.spot('sceneTorch', 2.5, 0.8, [hw, 0.8]);
  ctx.spot('sceneMats', 1.3, -1.4, [1.3, -2.9]);
  ctx.spot('scenePost', 1.0, 0.75, [1.0, 0.0]);
  ctx.spot('sceneScorch', 1.7, 0.95, [1.25, 0.35]);
  ctx.spot('tblPyae', -1.6, -0.25, 0, { sit: true, seat: 0.08 });
  ctx.spot('tblShwe', -2.4, 0.4, Math.PI / 2, { sit: true, seat: 0.08 });
  ctx.spot('tblMoe', -0.8, 0.4, -Math.PI / 2, { sit: true, seat: 0.08 });
  ctx.spot('tblMaya', -1.6, 1.05, Math.PI, { sit: true, seat: 0.08 });
  ctx.spot('door', 0, 3.5, Math.PI);
  ctx.tap('board', 2.25, 2.85, [2.95, 2.4], NAME('အိမ်စည်းကမ်း ဘုတ်', 'the house board'), 0.7);
  ctx.tap('mats', 1.3, -1.5, [1.3, -2.9], NAME('ဖျာတွေ', 'the mats'), 0.8);
  ctx.tap('post', 0.7, 0.6, [1.0, 0.0], NAME('တိုင်', 'the post'), 0.6);
  ctx.tap('hearth', -2.1, -1.6, [-3.0, -1.0], NAME('မီးဖို', 'the hearth'), 0.7);
  ctx.tap('sandals', -0.9, 2.8, [-0.9, 3.3], NAME('ဖိနပ်တွေ', 'the sandals'), 0.6);
  ctx.tap('dawpwint', -1.7, -1.2, [-2.2, -0.9], NAME('ဒေါ်ပွင့်', 'Daw Pwint'), 0.7);
  const api = ctx.finish('sunset');
  api.board = board;
  api.lamp = lamp;
  api.gecko = gk;
  api.setMats = (s) => { matState.target = s === 'together' ? 1 : 0; };
  api.setHung = (s) => lamp.setHung(s);
  api.setMap = (on) => { mapQ.visible = !!on; };
  api.setCover = (on) => board.setCover(!!on);
  return api;
}

// =============================================================================================
// backcover · inside the Back Cover (the Home Book's back board) · D14 (D15 if the reply flies here)
// =============================================================================================
let endpaperTex = null, marbleTex = null;
function endpaperTexture() {
  if (endpaperTex) return endpaperTex;
  const s = 256, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  g.fillStyle = '#F1E4C8'; g.fillRect(0, 0, s, s);
  const sprig = (x, y, r) => {
    g.save(); g.translate(x, y); g.rotate(r);
    g.strokeStyle = '#7A2533'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 22); g.quadraticCurveTo(4, 0, -2, -22); g.stroke();
    g.fillStyle = '#5E6B3A';
    for (const [lx, ly, a] of [[-7, 8, -0.7], [7, -2, 0.7], [-6, -10, -0.6]]) { g.save(); g.translate(lx, ly); g.rotate(a); g.beginPath(); g.ellipse(0, 0, 7, 3.5, 0, 0, 7); g.fill(); g.restore(); }
    g.fillStyle = '#E2B33C';
    for (const [fx, fy] of [[-2, -24], [5, -20], [-7, -19], [1, -28]]) { g.beginPath(); g.arc(fx, fy, 3.6, 0, 7); g.fill(); }
    g.fillStyle = '#C98A1E'; g.beginPath(); g.arc(-1, -23, 1.8, 0, 7); g.fill();
    g.restore();
  };
  for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) sprig(32 + i * 64 + (k % 2) * 32, 32 + k * 64, ((i + k) % 3 - 1) * 0.35);
  g.fillStyle = 'rgba(122,37,51,0.25)';
  for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(hash(i) * s, hash(i + 5) * s, 1.6, 0, 7); g.fill(); }
  endpaperTex = new THREE.CanvasTexture(cv);
  endpaperTex.colorSpace = THREE.SRGBColorSpace;
  endpaperTex.wrapS = endpaperTex.wrapT = THREE.RepeatWrapping;
  endpaperTex.anisotropy = 4;
  endpaperTex.userData.shared = true;
  return endpaperTex;
}
function marbleTexture() {
  if (marbleTex) return marbleTex;
  const s = 256, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  g.fillStyle = '#E9DCC4'; g.fillRect(0, 0, s, s);
  const cols = ['#7A2533', '#C9A13A', '#2F5D6A', '#B5643C', '#F4ECD6', '#5E2230'];
  for (let band = 0; band < 26; band++) {
    g.strokeStyle = cols[band % cols.length];
    g.globalAlpha = 0.55 + hash(band) * 0.4;
    g.lineWidth = 2 + hash(band + 3) * 7;
    g.beginPath();
    const y0 = (band / 26) * s, ph = hash(band + 9) * 6, amp = 8 + hash(band + 1) * 14;
    for (let x = -4; x <= s + 4; x += 4) {
      const y = y0 + Math.sin((x / s) * Math.PI * 2 * 2 + ph) * amp + Math.sin((x / s) * Math.PI * 2 * 5 + ph * 2) * amp * 0.3;
      if (x < 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }
  g.globalAlpha = 1;
  marbleTex = new THREE.CanvasTexture(cv);
  marbleTex.colorSpace = THREE.SRGBColorSpace;
  marbleTex.wrapS = marbleTex.wrapT = THREE.RepeatWrapping;
  marbleTex.userData.shared = true;
  return marbleTex;
}
function buildBackCover(opts = {}) {
  const ctx = scaffold({ id: 'backcover', name: NAME('နောက်ကျောဖုံး အတွင်း', 'Inside the Back Cover'), width: 7, depth: 8, height: 3.2, wall: '#E9DCC4', wainscot: C.maroonD, trim: C.gold, floor: 'plain', floorColor: '#E8D7B6', background: '#3A2622', ...opts });
  const { S, A, hd, hw, H, room } = ctx;
  // endpaper floor (padauk sprigs) and marbled walls: two planes on shared canvas textures
  const floorG = new THREE.PlaneGeometry(2 * hw - 0.5, 2 * hd - 0.3);
  floorG.rotateX(-Math.PI / 2);
  floorG.translate(0, 0.009, 0.1);
  const fuv = floorG.attributes.uv;
  for (let i = 0; i < fuv.count; i++) fuv.setXY(i, fuv.getX(i) * (2 * hw - 0.5) / 1.3, fuv.getY(i) * (2 * hd - 0.3) / 1.3);
  const floorMesh = new THREE.Mesh(floorG, new THREE.MeshLambertMaterial({ map: endpaperTexture() }));
  floorMesh.raycast = () => {};
  const wallGs = [];
  const wallPlane = (w, h, m) => {
    const pg = new THREE.PlaneGeometry(w, h);
    const uv = pg.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 1.6, uv.getY(i) * h / 1.6);
    pg.applyMatrix4(m);
    wallGs.push(pg);
  };
  wallPlane(2 * hw, H - 1.06 - 0.14, M(0, 1.06 + (H - 1.2) / 2, -hd + 0.006));
  const D = 2 * hd;
  for (const [z0, z1, h] of [[-hd, -hd + D * 0.45, H], [-hd + D * 0.45, -hd + D * 0.65, H * 0.62]]) {
    for (const sx of [-1, 1]) wallPlane(z1 - z0, h - 0.1 - 1.06, M(sx * (hw - 0.006), 1.06 + (h - 1.16) / 2, (z0 + z1) / 2, -sx * Math.PI / 2));
  }
  const wallMesh = new THREE.Mesh(mergeGeometries(wallGs, false), new THREE.MeshLambertMaterial({ map: marbleTexture() }));
  wallMesh.raycast = () => {};
  for (const x of wallGs) x.dispose();
  // the headband along the top of the back wall; a gold rule on the wainscot (a book's turn-in)
  for (let x = -hw, i = 0; x < hw - 0.01; x += 0.12, i++) S.boxMin(x, H - 0.24, -hd, x + 0.12, H - 0.12, -hd + 0.07, i % 2 ? C.maroon : C.gold);
  S.boxMin(-hw, 0.6, -hd, hw, 0.64, -hd + 0.02, C.goldD);
  // the inward door: the back board itself, swung wide open on the left jamb (its inner face to the room):
  // tooled maroon leather, gold border, two raised panels, three brass hinges, the brass lock plate + keyhole,
  // a ring pull, and the board's cream page-edge along its free side. Its tall jamb, gold-capped, frames the hinge side.
  ctx.put(-0.95, hd - 0.06, 0, null, (v) => {
    v.boxMin(-0.14, 0, -0.08, 0.0, 2.3, 0.08, C.teakD); // the jamb it hangs on
    v.boxMin(-0.17, 2.3, -0.11, 0.03, 2.38, 0.11, C.gold); // its gold cap
    v.boxMin(-0.15, 0, -0.09, 0.01, 0.12, 0.09, C.gold);
  });
  ctx.put(-0.96, hd - 0.1, 2.62, null, (v) => {
    const W = 1.0, Hh = 2.2, T = 0.07;
    v.boxMin(0, 0, -T / 2, W, Hh, T / 2, C.maroonD);
    v.boxMin(W - 0.012, 0.03, -T / 2 + 0.01, W + 0.012, Hh - 0.03, T / 2 - 0.01, C.cream); // page edge
    for (let i = 0; i < 4; i++) v.boxMin(W + 0.012, 0.05, -0.02 + i * 0.012, W + 0.014, Hh - 0.05, -0.016 + i * 0.012, '#D9CBB0');
    for (const sz of [-1, 1]) {
      const zf = sz * (T / 2), zo = sz * 0.006;
      const Z = (n) => [Math.min(zf, zf + zo * n), Math.max(zf, zf + zo * n)];
      const slab = (a, b, c, d, n, col) => { const [z0, z1] = Z(n); v.boxMin(a, b, z0, c, d, z1, col); };
      // gold tooled border and two raised panels
      for (const [a, b, c, d] of [[0.06, 0.06, W - 0.06, 0.09], [0.06, Hh - 0.09, W - 0.06, Hh - 0.06], [0.06, 0.06, 0.09, Hh - 0.06], [W - 0.09, 0.06, W - 0.06, Hh - 0.06]]) slab(a, b, c, d, 1, C.gold);
      for (const [y0, y1] of [[0.22, 1.0], [1.2, 2.0]]) {
        slab(0.16, y0, W - 0.16, y1, 2, C.maroon);
        slab(0.2, y0 + 0.04, W - 0.2, y1 - 0.04, 3, jitter(C.maroon, 0.06, y0 * 10));
      }
      // a padauk sprig tooled in gold on the upper panel
      slab(W / 2 - 0.012, 1.4, W / 2 + 0.012, 1.8, 4, C.gold);
      for (const [x, y] of [[-0.06, 1.72], [0.06, 1.66], [-0.05, 1.56], [0.05, 1.5], [0, 1.82]]) slab(W / 2 + x - 0.03, y - 0.03, W / 2 + x + 0.03, y + 0.03, 4, C.gold);
      // lock plate, keyhole, ring pull
      slab(W - 0.2, 0.95, W - 0.08, 1.2, 3, C.brass);
      slab(W - 0.155, 1.02, W - 0.125, 1.1, 4, C.soot);
      slab(W - 0.16, 1.09, W - 0.12, 1.12, 4, C.soot);
      slab(W - 0.18, 0.8, W - 0.1, 0.88, 4, C.brassD);
      // three brass hinges on the hinge edge
      for (const y of [0.3, 1.1, 1.9]) slab(-0.04, y, 0.16, y + 0.14, 3, C.brass);
    }
    for (const y of [0.3, 1.1, 1.9]) v.box(-0.03, y + 0.07, 0, 0.05, 0.16, 0.05, C.brassD); // hinge knuckles
  });
  ctx.circle(-1.35, 3.62, 0.3);
  ctx.circle(-1.75, 3.45, 0.25);
  // the Back Cover desk (left): writing desk, lamp post behind it, the ribbon (limp until lit)
  ctx.put(-2.0, -1.2, 0, [1.2, 0.65], (v, L) => {
    v.boxMin(-0.6, 0.72, -0.32, 0.6, 0.78, 0.32, C.teak);
    v.boxMin(-0.58, 0.6, -0.3, 0.58, 0.72, 0.3, C.teakD);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * 0.53, 0.3, sz * 0.25, 0.07, 0.6, 0.07, C.teakD);
    v.box(0.25, 0.66, 0.31, 0.3, 0.05, 0.01, C.gold);
    v.boxMin(-0.3, 0.78, -0.15, 0.2, 0.785, 0.2, C.paper);
    prism(v, 0.38, 0.81, -0.12, 0.04, 0.045, 0.06, '#1E2E44');
    boxR(v, 0.4, 0.88, -0.12, 0.012, 0.16, 0.012, C.cream, 0, 0, -0.3);
    // lamp post at the back-left corner of the desk
    v.boxMin(-0.62, 0, -0.42, -0.5, 2.25, -0.3, C.iron);
    v.boxMin(-0.66, 0, -0.46, -0.46, 0.12, -0.26, C.ironL);
    v.boxMin(-0.7, 2.25, -0.5, -0.42, 2.29, -0.22, C.iron);
    v.boxMin(-0.68, 2.29, -0.48, -0.44, 2.55, -0.24, '#F3E8C8');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(-0.56 + sx * 0.12, 2.42, -0.36 + sz * 0.12, 0.025, 0.28, 0.025, C.iron);
    v.boxMin(-0.72, 2.55, -0.52, -0.4, 2.6, -0.2, C.iron);
    prism(v, -0.56, 2.66, -0.36, 0.03, 0.17, 0.1, C.iron, 4);
    L.pool(0, 0, 1.3);
  });
  const lanternLit = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.2), new THREE.MeshBasicMaterial({ color: '#FFE3A0', toneMapped: false }));
  lanternLit.position.set(-2.56, 2.42, -1.56);
  lanternLit.userData.dynamic = true;
  const ribbon = ctx.part((v) => {
    v.box(0, 0.04, 0, 0.36, 0.08, 0.12, '#6B4A2E');
    for (let i = 0; i < 5; i++) v.box(Math.sin(i * 1.1) * 0.025, 0.08 + 0.17 * (i + 0.5), 0, 0.28, 0.18, 0.03, i % 2 ? '#8C2A38' : '#7A2230');
    for (const sx of [-1, 1]) boxR(v, sx * 0.08, 1.0, 0, 0.12, 0.16, 0.03, '#8C2A38', 0, 0, sx * 0.25);
    for (const sx of [-1, 1]) v.box(sx * 0.13, 0.5, 0.017, 0.012, 0.85, 0.005, C.gold);
    // the paper plane on its tip, pointing home
    boxR(v, 0, 1.12, 0.02, 0.05, 0.012, 0.22, C.white, 0, 0, 0.35);
    boxR(v, 0, 1.12, 0.02, 0.05, 0.012, 0.22, C.white, 0, 0, -0.35);
  }, -1.45, 0.0, -1.62, 1.2);
  const lit = { k: opts.lit ? 1 : 0, t: opts.lit ? 1 : 0 };
  ctx.animate((dt) => {
    lit.k += (lit.t - lit.k) * Math.min(1, dt * 1.8);
    ribbon.rotation.x = lerp(-Math.PI / 2 + 0.06, 0.12, lit.k);
    ribbon.position.y = lerp(0.03, 0.0, lit.k);
    ribbon.scale.y = lerp(0.42, 1.0, lit.k);
    lanternLit.visible = lit.k > 0.3;
  });
  // the writing slope (back centre), its blank sheet, the gold-ink pot; the stool
  const sheet = A.region(200, 260, (g, w, h) => {
    g.fillStyle = '#FBF6EA'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#E8DCC0'; g.lineWidth = 1.5;
    for (let i = 1; i < 10; i++) { g.beginPath(); g.moveTo(14, 20 + i * 24); g.lineTo(w - 14, 20 + i * 24); g.stroke(); }
    g.fillStyle = C.brass;
    for (const [x, y] of [[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]]) { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); }
  });
  ctx.put(0.4, -3.0, 0, [0.95, 0.72], (v, L) => {
    for (const sx of [-1, 1]) { v.box(sx * 0.4, 0.38, 0.25, 0.06, 0.76, 0.06, C.teakD); v.box(sx * 0.4, 0.5, -0.25, 0.06, 1.0, 0.06, C.teakD); }
    v.boxMin(-0.42, 0.18, -0.3, 0.42, 0.22, 0.3, C.teakD);
    boxR(v, 0, 0.9, 0.0, 0.9, 0.05, 0.7, C.teak, 0.32, 0, 0);
    boxR(v, 0, 0.78, 0.33, 0.9, 0.05, 0.04, C.teakD, 0.32, 0, 0);
    L.quad(sheet, 0.42, 0.55, -0.1, 0.93, 0.0, 0, -Math.PI / 2 + 0.32);
    // the gold-ink pot on its own little ledge (a squat dark pot, a gold collar, the gold ink catching the lamp)
    // and the long white quill standing in it
    v.boxMin(0.2, 0.98, -0.36, 0.56, 1.02, -0.1, C.teakD);
    v.boxMin(0.2, 1.02, -0.36, 0.56, 1.04, -0.34, C.gold);
    prism(v, 0.38, 1.02, -0.23, 0.085, 0.1, 0.1, '#2A1E16', 10);
    prism(v, 0.38, 1.12, -0.23, 0.07, 0.085, 0.025, C.gold, 10);
    prism(v, 0.38, 1.145, -0.23, 0.06, 0.06, 0.006, '#F2C94C', 10);
    L.glow(0.38, 1.15, -0.23, 0.08, 0.004, 0.08);
    boxR(v, 0.42, 1.34, -0.23, 0.016, 0.42, 0.016, C.cream, 0, 0, -0.3);
    boxR(v, 0.5, 1.5, -0.23, 0.07, 0.24, 0.01, '#F7F3EA', 0, 0, -0.3);
    boxR(v, 0.53, 1.5, -0.23, 0.03, 0.2, 0.012, '#E8E0CC', 0, 0, -0.3);
    L.pool(0, 0.2, 0.9, 0.012);
  });
  ctx.put(0.4, -2.35, 0, [0.34, 0.34], (v) => stoolInto(v, 0, 0, 0.46, C.maroon, C.teakD, 0.34));
  // a low bench under the pigeonholes' corner with a blank stack and a twine ball; a reading chair and lamp
  ctx.put(2.75, 1.3, -Math.PI / 2, [1.2, 0.36], (v) => {
    benchInto(v, 1.2, 0.42, 0.34, C.teak);
    for (let i = 0; i < 6; i++) v.box(-0.25, 0.43 + i * 0.012, 0, 0.3, 0.01, 0.22, i % 2 ? C.cream : '#F7F0DF');
    prism(v, 0.25, 0.48, 0, 0.06, 0.06, 0.1, C.rope, 10);
  });
  ctx.place(kit.chair({ color: C.maroon, wood: C.teakD }), -2.2, 1.4, 0.6);
  ctx.put(-2.85, 1.0, 0, [0.4, 0.4], (v, L) => {
    prism(v, 0, 0.3, 0, 0.18, 0.18, 0.04, C.teak, 10);
    v.box(0, 0.15, 0, 0.05, 0.3, 0.05, C.teakD);
    for (let i = 0; i < 3; i++) v.box(0.02, 0.33 + i * 0.03, 0, 0.18, 0.028, 0.13, [C.maroon, '#2F5D8C', C.goldD][i]);
    v.box(-0.25, 0.75, -0.1, 0.03, 1.5, 0.03, C.iron);
    prism(v, -0.25, 1.55, -0.1, 0.1, 0.16, 0.18, '#F3E8C8', 8);
    L.glow(-0.25, 1.5, -0.1, 0.1, 0.06, 0.1);
    L.pool(-0.1, 0.1, 0.8);
  });
  // eight pigeonholes on the right wall, turned a little to the room so their mouths read
  // (filled with booklet bundles as Maya unloads: setFilled(n))
  const PH = { x: 2.78, z: -1.55, ry: -1.0 };
  ctx.circle(PH.x, PH.z, 0.5); ctx.circle(PH.x + 0.4, PH.z + 0.62, 0.35); ctx.circle(PH.x - 0.35, PH.z - 0.6, 0.35);
  ctx.put(PH.x, PH.z, PH.ry, null, (v) => {
    v.boxMin(-0.86, 1.68, -0.24, 0.86, 1.76, 0.24, C.teakD); // crown
    v.boxMin(-0.86, 1.76, -0.2, 0.86, 1.8, 0.2, C.gold);
    for (const sx of [-1, 1]) v.boxMin(sx * 0.8 - 0.04, 0, -0.2, sx * 0.8 + 0.04, 1.7, 0.2, C.teakD);
    v.boxMin(-0.8, 0, -0.2, 0.8, 0.75, -0.17, C.teakD);
    v.boxMin(-0.8, 0.0, 0.17, 0.8, 0.72, 0.2, C.teak);
    for (let i = 0; i < 2; i++) v.box(-0.4 + i * 0.8, 0.36, 0.205, 0.5, 0.03, 0.01, C.gold);
    for (const y of [0.75, 1.2, 1.65]) v.boxMin(-0.8, y - 0.03, -0.2, 0.8, y + 0.02, 0.2, C.teak);
    for (let i = 1; i < 4; i++) v.boxMin(-0.8 + i * 0.4 - 0.015, 0.75, -0.2, -0.8 + i * 0.4 + 0.015, 1.65, 0.2, C.teak);
    v.boxMin(-0.8, 0.75, -0.2, 0.8, 1.65, -0.17, '#5A3420');
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { v.box(-0.6 + i * 0.4, 0.76 + r * 0.45, 0.205, 0.14, 0.035, 0.008, C.brass); v.box(-0.6 + i * 0.4, 0.76 + r * 0.45, 0.21, 0.06, 0.015, 0.004, C.soot); }
  });
  const bv = new VoxelBuilder();
  for (let i = 0; i < 4; i++) bv.box(0, 0.025 + i * 0.05, 0, 0.3, 0.045, 0.2, i % 2 ? C.cream : '#F2E6CC');
  bv.box(0, 0.1, 0, 0.31, 0.21, 0.03, C.maroon);
  bv.box(0, 0.1, 0, 0.03, 0.21, 0.21, C.maroon);
  bv.box(0, 0.215, 0, 0.06, 0.02, 0.06, C.gold);
  const bundleMesh = bv.mesh({ outline: false });
  const bundles = new THREE.InstancedMesh(bundleMesh.geometry, bundleMesh.material, 8);
  bundles.userData.dynamic = true;
  bundles.raycast = () => {};
  const phM = M(PH.x, 0, PH.z, PH.ry);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
    _m.compose(_p.set(-0.6 + i * 0.4, 0.75 + r * 0.45 + 0.005, 0.0), _q.identity(), _s.set(1, 1, 1)).premultiply(phM);
    bundles.setMatrixAt(r * 4 + i, _m);
  }
  bundles.count = opts.filled ?? 0;
  // the reference plate (back wall, right): blank unless Maya's own references are allowed
  ctx.put(2.4, -hd + 0.02, 0, null, (v) => {
    v.boxMin(-0.4, 1.17, 0, 0.4, 1.83, 0.04, C.brassD);
    v.boxMin(-0.36, 1.21, 0.04, 0.36, 1.79, 0.05, C.brassL);
    for (const [x, y] of [[-0.34, 1.19], [0.34, 1.19], [-0.34, 1.81], [0.34, 1.81]]) v.box(x, y, 0.06, 0.03, 0.03, 0.02, C.brassD);
  });
  let plateText = opts.plate || null;
  const plateR = A.region(300, 220, (g, w, h) => {
    g.fillStyle = '#E8CF86'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#B08A3A'; g.lineWidth = 4; g.strokeRect(8, 8, w - 16, h - 16);
    if (plateText) lines(g, plateText.map((t, i) => ({ t, s: i ? 18 : 24, c: '#3A2A1A', w: i ? 600 : 700 })), w, h);
    else { // blank: only its engraved heading and empty ruled lines, waiting
      lines(g, [{ t: 'ကိုးကား', s: 26, c: '#8A6A2A' }], w, 60, { y0: 14 });
      g.strokeStyle = '#C9A85A'; g.lineWidth = 2;
      for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(40, 92 + i * 30); g.lineTo(w - 40, 92 + i * 30); g.stroke(); }
    }
  });
  A.quad(plateR, 0.7, 0.55, M(2.4, 1.5, -hd + 0.075));
  // lived-in: a hanging lantern over the middle (its warm pool), a rug before the slope, a tied tower of blank
  // pages by the desk, a spare chair, gold corner strips where the marbling meets the side walls
  ctx.put(1.55, 0.9, 0, null, (v, L) => { const f = hangingLampInto(v, 0, 3.2, 0, 0.7); L.glow(f.x, f.y, f.z, 0.09, 0.12, 0.09); L.pool(0, 0, 1.7); });
  ctx.put(0.4, -1.75, 0, null, (v) => {
    v.boxMin(-0.8, 0, -0.55, 0.8, 0.014, 0.55, C.gold);
    v.boxMin(-0.74, 0.014, -0.49, 0.74, 0.02, 0.49, C.maroon);
    v.boxMin(-0.6, 0.02, -0.35, 0.6, 0.022, 0.35, jitter(C.maroon, 0.12, 4));
    for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) v.box(sx * 0.83, 0.01, -0.45 + i * 0.18, 0.06, 0.008, 0.03, C.cream);
  });
  ctx.put(-1.0, -2.05, 0.2, [0.42, 0.34], (v) => {
    for (let i = 0; i < 16; i++) boxR(v, (hash(i + 90) - 0.5) * 0.03, 0.012 + i * 0.026, (hash(i + 91) - 0.5) * 0.02, 0.36, 0.024, 0.27, i % 3 ? '#FBF6EA' : '#F1E7CF', 0, (hash(i + 92) - 0.5) * 0.08, 0);
    v.box(0, 0.22, 0, 0.37, 0.44, 0.03, C.maroon); v.box(0, 0.22, 0, 0.03, 0.44, 0.28, C.maroon);
    v.box(0, 0.445, 0, 0.08, 0.03, 0.08, C.gold);
    for (let i = 0; i < 5; i++) boxR(v, 0.05 + i * 0.01, 0.46 + i * 0.012, 0.0, 0.34, 0.01, 0.25, '#FBF6EA', 0, 0.3 + i * 0.25, 0); // loose top sheets
  });
  ctx.place(kit.chair({ color: C.maroon, wood: C.teakD }), 1.5, -2.75, -0.6);
  for (const sx of [-1, 1]) {
    S.boxMin(sx * hw - (sx > 0 ? 0.05 : 0), 1.0, -hd, sx * hw + (sx > 0 ? 0 : 0.05), H - 0.12, -hd + 0.05, C.gold);
    const zEnd = -hd + 2 * hd * 0.65;
    S.boxMin(sx * hw - (sx > 0 ? 0.03 : 0), 1.0, zEnd - 0.05, sx * hw + (sx > 0 ? 0 : 0.03), H * 0.62 - 0.08, zEnd, C.gold);
  }
  ctx.spot('maya', 0, 1.2, [-2.0, -1.2]);
  ctx.spot('mayaDesk', -2.0, -0.45, [-2.0, -1.2]);
  ctx.spot('mayaSlope', 0.4, -2.35, Math.PI, { sit: true, seat: 0.46 });
  ctx.spot('mayaHoles', 1.75, -0.95, [PH.x, PH.z]);
  ctx.spot('door', 0, 3.4, Math.PI);
  ctx.tap('desk', -2.0, -0.45, [-2.0, -1.2], NAME('စာရေးခုံ', 'the Back Cover desk'), 0.8);
  ctx.tap('slope', 0.4, -1.8, [0.4, -3.0], NAME('စာရေးစင်', 'the writing slope'), 0.7);
  ctx.tap('holes', 1.75, -0.95, [PH.x, PH.z], NAME('အကန့်ငယ် ရှစ်ခု', 'the eight pigeonholes'), 0.8);
  ctx.tap('plate', 2.4, -2.9, [2.4, -hd], NAME('ကိုးကား ပြား', 'the reference plate'), 0.6);
  const api = ctx.finish('high');
  api.group.add(floorMesh, wallMesh, lanternLit, bundles);
  const dis = api.dispose;
  api.dispose = () => { dis(); floorMesh.material.dispose(); wallMesh.material.dispose(); lanternLit.material.dispose(); bundleMesh.geometry.dispose(); };
  api.setLit = (on) => { lit.t = on ? 1 : 0; };
  api.setFilled = (n) => { bundles.count = Math.max(0, Math.min(8, n | 0)); };
  api.setPlate = (list) => { plateText = list && list.length ? list : null; A.paint(plateR); if (A.tex) A.tex.needsUpdate = true; };
  return api;
}

// =============================================================================================
// sortingroom · the Post Office sorting room (Home Book, story only) · D3, D6, D8–D15
// =============================================================================================
function buildSortingRoom(opts = {}) {
  const day = opts.day ?? 3;
  const ctx = scaffold({ id: 'sortingroom', name: NAME('စာခွဲခန်း', 'The sorting room'), width: 6.5, depth: 7, height: 3, wall: C.paper, wainscot: C.maroon, trim: C.goldD, floor: 'planks', floorColor: '#A27A52', background: '#EFE6D2', ...opts });
  const { S, A, hd, hw } = ctx;
  ctx.plankSeams(0.14, 0.98, C.maroonD, 0.22);
  for (let x = -hw + 0.3; x < hw; x += 0.6) S.box(x, 2.75, -hd + 0.012, 0.3, 0.05, 0.02, C.goldD);
  ctx.window({ x: 2.45, y: 1.8, w: 1.0, h: 0.9, frame: '#3E6B4F', sill: C.woodL, curtain: '#E8D9B0' });
  // the pigeonhole rack: Nay Chi's tidy half (left), Ma Wint War's crooked half (right, one overflowing)
  ctx.put(0, -3.3, 0, [3.1, 0.42], (v) => {
    v.boxMin(-1.52, 0, -0.2, 1.52, 0.72, 0.2, '#6A3E24');
    for (let i = 0; i < 6; i++) { v.boxMin(-1.46 + i * 0.49, 0.08, 0.2, -1.03 + i * 0.49, 0.62, 0.215, '#7A4A2A'); v.box(-1.245 + i * 0.49, 0.5, 0.222, 0.1, 0.025, 0.012, C.brass); }
    v.boxMin(-1.55, 0.72, -0.21, 1.55, 0.76, 0.22, C.woodL);
    const cols = 10, rows = 6, x0 = -1.5, cw = 0.3, y0 = 0.76, rh = 0.3;
    v.boxMin(x0 - 0.02, y0, -0.2, -x0 + 0.02, y0 + rows * rh + 0.04, -0.17, '#5A3420');
    for (let c = 0; c <= cols; c++) v.boxMin(x0 + c * cw - 0.012, y0, -0.2, x0 + c * cw + 0.012, y0 + rows * rh, 0.2, c === 5 ? C.maroonD : '#7A4A2A');
    for (let r = 0; r <= rows; r++) v.boxMin(x0 - 0.02, y0 + r * rh - 0.012, -0.2, -x0 + 0.02, y0 + r * rh + 0.012, 0.2, '#7A4A2A');
    v.boxMin(x0 - 0.05, y0 + rows * rh, -0.22, -x0 + 0.05, y0 + rows * rh + 0.06, 0.24, C.woodD);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cx = x0 + c * cw + cw / 2, by = y0 + r * rh + 0.012, k = r * cols + c;
      v.box(cx, by - 0.03, 0.205, 0.12, 0.022, 0.006, C.cream); // slot label
      if (c < 5) { // tidy: a squared stack, edges flush
        const n = 3 + (k % 4);
        for (let i = 0; i < n; i++) v.boxMin(cx - 0.11, by + i * 0.022, -0.12, cx + 0.11, by + i * 0.022 + 0.018, 0.15, i % 2 ? C.white : '#F2E6CC');
      } else { // crooked: letters at angles, sticking out
        const n = 2 + ((k * 7) % 4);
        for (let i = 0; i < n; i++) boxR(v, cx + (hash(k + i) - 0.5) * 0.06, by + 0.04 + i * 0.03, 0.04 + hash(k * 3 + i) * 0.12, 0.2, 0.016, 0.26, ['#F2E6CC', C.white, '#E6D2B0', '#DCE6EE'][(k + i) % 4], (hash(i + k) - 0.5) * 0.3, (hash(k + 2 * i) - 0.5) * 0.4, (hash(k * 5 + i) - 0.5) * 0.6);
      }
    }
    // the overflowing slot (row 3, col 8) and its spill on the ledge
    for (let i = 0; i < 6; i++) boxR(v, 0.92 + (hash(i + 60) - 0.5) * 0.12, 0.79 + i * 0.012, 0.22 + hash(i + 61) * 0.1, 0.2, 0.012, 0.15, i % 2 ? C.white : '#F2E6CC', 0, (hash(i + 62) - 0.5) * 1.4, 0);
    for (let i = 0; i < 4; i++) boxR(v, 0.9, 1.75 + i * 0.03, 0.18 + i * 0.03, 0.2, 0.015, 0.24, '#F2E6CC', -0.5 - i * 0.12, 0.1 * i, 0.2);
  });
  const nameCards = A.region(420, 70, (g, w, h) => {
    for (const [x, t, c] of [[0, 'နေခြည်', '#2F5D8C'], [w / 2 + 2, 'မဝင့်ဝါ', C.maroon]]) {
      g.fillStyle = '#F4ECD6'; g.fillRect(x, 0, w / 2 - 2, h);
      g.strokeStyle = c; g.lineWidth = 4; g.strokeRect(x + 3, 3, w / 2 - 8, h - 6);
      g.save(); g.translate(x, 0); lines(g, [{ t, s: 30, c }], w / 2 - 2, h); g.restore();
    }
  });
  A.quad(nameCards, 3.0, 0.17, M(0, 2.76, -3.04));
  // the small desk under the window with the letter scale; the wall calendar; a stamp rack
  ctx.place(kit.desk({ w: 0.9, d: 0.6, h: 0.78, top: C.woodL, body: '#6A3E24' }), 2.45, -2.9);
  ctx.put(2.45, -2.9, 0, null, (v) => {
    v.boxMin(-0.25, 0.78, -0.18, 0.05, 0.84, 0.08, C.brassD);
    v.box(-0.1, 0.92, -0.05, 0.03, 0.14, 0.03, C.brassD);
    prism(v, -0.1, 1.0, -0.05, 0.11, 0.11, 0.015, C.brassL, 12);
    prism(v, -0.1, 0.9, 0.09, 0.06, 0.06, 0.012, C.paper, 12, Math.PI / 2);
    v.box(-0.1, 0.9, 0.096, 0.004, 0.05, 0.004, C.red);
    v.boxMin(0.12, 0.78, -0.2, 0.36, 0.81, 0.15, '#F2E6CC');
    for (let i = 0; i < 3; i++) v.box(0.24, 0.82 + i * 0.012, -0.02, 0.18, 0.008, 0.12, i % 2 ? '#E6D2B0' : C.white);
  });
  calendarOn(ctx, 'back', -2.5, 1.9, 'ပြက္ခဒိန်', { ring7: false, nextRing: -99, mark: 2 });
  ctx.put(-2.55, -hd + 0.02, 0, null, (v) => {
    const y = wallShelfInto(v, 0, 1.2, 0, 0.8, 0.18, C.woodL);
    for (let i = 0; i < 5; i++) { v.box(-0.28 + i * 0.14, y + 0.05, 0.08, 0.04, 0.1, 0.04, C.woodD); v.box(-0.28 + i * 0.14, y + 0.11, 0.08, 0.07, 0.03, 0.07, [C.red, C.maroon, '#2F5D8C', C.ink, C.red][i]); }
  });
  // Nay Chi's high stool + apron; the sorting table and its heap
  ctx.put(-0.8, -2.5, 0, [0.36, 0.36], (v) => {
    stoolInto(v, 0, 0, 0.66, C.woodL, C.woodD, 0.34);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(sx * 0.12, 0.3, sz * 0.12, 0.03, 0.03, 0.2, C.woodD);
    if (day < 10) { v.boxMin(-0.18, 0.66, -0.12, 0.18, 0.68, 0.16, '#2F5D8C'); boxR(v, 0, 0.45, 0.17, 0.3, 0.42, 0.02, '#2F5D8C', 0.08, 0, 0); v.box(0, 0.42, 0.185, 0.14, 0.1, 0.006, '#3F6EA8'); }
  });
  ctx.place(kit.table({ w: 2.0, d: 1.0, h: 0.85, top: C.woodL, legs: '#6A3E24' }), 0, -0.9);
  ctx.put(0, -0.9, 0, null, (v) => {
    for (let i = 0; i < 26; i++) boxR(v, -0.35 + (hash(i) - 0.5) * 0.7, 0.855 + Math.floor(i / 6) * 0.012, (hash(i + 30) - 0.5) * 0.5, 0.2, 0.01, 0.13, ['#F2E6CC', C.white, '#E6D2B0', '#DCE6EE', '#F4DCD2'][i % 5], 0, hash(i + 3) * 3, 0);
    if (day === 3) { // the returned notebook, Toe Toe's letter, the school's parcel
      v.boxMin(0.3, 0.85, -0.3, 0.55, 0.87, 0.04, C.maroon); v.boxMin(0.31, 0.87, -0.29, 0.54, 0.874, 0.03, C.gold);
      boxR(v, 0.6, 0.856, 0.25, 0.22, 0.01, 0.15, '#EAF0D8', 0, -0.3, 0); v.box(0.62, 0.862, 0.24, 0.05, 0.004, 0.05, C.leaf);
    }
    if (day < 10) {
      v.boxMin(-0.85, 0.85, -0.38, -0.5, 1.02, -0.1, C.kraft);
      v.boxMin(-0.86, 0.85, -0.25, -0.49, 1.03, -0.23, C.ropeD); v.boxMin(-0.68, 0.85, -0.39, -0.66, 1.03, -0.09, C.ropeD);
      v.box(-0.6, 1.025, -0.32, 0.1, 0.004, 0.06, C.paper); v.box(-0.6, 1.028, -0.32, 0.05, 0.004, 0.035, C.maroon);
    }
    if (day === 6) { // ten chalk slates laid along the table, a chalk box
      for (let i = 0; i < 10; i++) {
        const x = -0.85 + (i % 5) * 0.42, z = i < 5 ? 0.12 : 0.34;
        v.boxMin(x - 0.17, 0.85, z - 0.1, x + 0.17, 0.865, z + 0.1, C.woodD);
        v.boxMin(x - 0.15, 0.865, z - 0.08, x + 0.15, 0.868, z + 0.08, C.chalk);
        if (i < 3) v.box(x, 0.87, z, 0.16, 0.002, 0.01, '#E8E4D8');
      }
      v.boxMin(0.7, 0.85, -0.3, 0.9, 0.9, -0.18, '#C9B48A');
      for (let i = 0; i < 4; i++) v.box(0.74 + i * 0.04, 0.905, -0.24, 0.02, 0.012, 0.08, C.white);
    }
    if (day >= 15) { v.boxMin(0.62, 0.85, 0.1, 0.84, 0.86, 0.26, '#2E2018'); for (let i = 0; i < 8; i++) boxR(v, 0.55, 0.86 + i * 0.012, -0.2, 0.2, 0.01, 0.13, C.white, 0, 0.05 * i, 0); }
  });
  let inv = null, block = null;
  if (day >= 15) {
    inv = ctx.prop(invitationStack6({ n: 6 }), -0.75, 0.85, -0.75);
    block = ctx.prop(stampBlock('ribbonPlane', false), 0.73, 0.86, -0.72);
  }
  // mail sacks on the left wall, the plank bench on the right, a wire basket under the door slot
  ctx.put(-2.7, 0.3, Math.PI / 2, [1.0, 0.45], (v) => {
    sackInto(v, -0.25, 0, 1.1, '#C9B48A');
    sackInto(v, 0.28, 0.03, 1.0, '#B9A27A');
    for (const x of [-0.25, 0.28]) { v.box(x, 0.22, 0.19, 0.16, 0.08, 0.006, C.maroon); v.box(x, 0.22, 0.194, 0.06, 0.04, 0.004, C.gold); }
  });
  ctx.put(2.6, 1.2, -Math.PI / 2, [1.5, 0.38], (v) => benchInto(v, 1.5, 0.42, 0.36, C.woodL));
  if (day >= 6 && day < 10) ctx.put(2.6, 1.55, 0, null, (v) => { v.boxMin(-0.12, 0.42, -0.1, 0.12, 0.62, 0.08, '#C9A576'); v.box(0, 0.6, -0.02, 0.2, 0.06, 0.04, '#8E6A44'); });
  ctx.put(-1.45, 3.15, 0, [0.4, 0.3], (v) => {
    for (const sx of [-1, 1]) v.boxMin(sx * 0.2 - 0.01, 0, -0.14, sx * 0.2 + 0.01, 0.32, 0.14, C.ironL);
    for (let i = 0; i < 5; i++) v.boxMin(-0.2, 0.04 + i * 0.07, 0.14, 0.2, 0.05 + i * 0.07, 0.15, C.ironL);
    for (let i = 0; i < 4; i++) boxR(v, (hash(i) - 0.5) * 0.15, 0.06 + i * 0.03, 0, 0.18, 0.01, 0.12, i % 2 ? C.white : '#F2E6CC', 0.2, hash(i) * 2, 0.1);
  });
  ctx.put(-2.55, 2.55, 0, [0.4, 0.4], (v) => {
    v.box(0, 0.9, 0, 0.05, 1.8, 0.05, C.woodD);
    for (const a of [0, 1.57, 3.14, 4.71]) { boxR(v, Math.sin(a) * 0.15, 0.05, Math.cos(a) * 0.15, 0.32, 0.04, 0.05, C.woodD, 0, a + Math.PI / 2, 0); boxR(v, Math.sin(a) * 0.08, 1.72, Math.cos(a) * 0.08, 0.18, 0.025, 0.025, C.woodD, 0, a + Math.PI / 2, 0.5); }
    boxR(v, 0.1, 1.2, 0.05, 0.06, 0.8, 0.06, C.maroon, 0, 0, 0.12); // her umbrella
    v.boxMin(-0.18, 1.1, -0.05, 0.02, 1.4, 0.06, '#8E6A44'); v.box(-0.08, 1.52, 0, 0.02, 0.26, 0.02, '#6A4A30'); // a satchel
    v.boxMin(-0.16, 1.25, 0.06, 0.0, 1.35, 0.07, '#7A5434');
  });
  ctx.put(2.65, 2.45, 0, [0.6, 0.5], (v) => {
    v.boxMin(-0.25, 0, -0.2, 0.25, 0.3, 0.2, C.kraft); v.boxMin(-0.255, 0.1, -0.2, 0.255, 0.12, 0.2, C.ropeD);
    boxR(v, 0.0, 0.4, 0.02, 0.36, 0.2, 0.28, C.kraftD, 0, 0.3, 0);
    v.box(0.05, 0.505, 0.05, 0.12, 0.004, 0.08, C.paper);
  });
  ctx.put(-1.7, -2.6, 0, [0.3, 0.3], (v) => { prism(v, 0, 0.16, 0, 0.14, 0.11, 0.32, C.bambooD, 10); for (let i = 0; i < 4; i++) v.box((hash(i) - 0.5) * 0.12, 0.33 + i * 0.02, (hash(i + 3) - 0.5) * 0.1, 0.07, 0.06, 0.07, i % 2 ? C.white : '#E6D2B0'); });
  // a hanging lamp over the table, a clock, a string ball, the bell rope by the door (Day 15)
  ctx.put(0, -0.9, 0, null, (v, L) => { const f = hangingLampInto(v, 0, 3.0, 0, 0.9); L.glow(f.x, f.y, f.z, 0.09, 0.12, 0.09); L.pool(0, 0, 0.9, 0.86); L.pool(0, 0.9, 1.3); });
  clockOn(ctx, 1.75, 2.45);
  prism(S, 2.75, 0.855, -2.75, 0.06, 0.06, 0.1, C.rope, 10);
  // the bell on its wall bracket (right wall, not a post across the room), its rope with a maroon tassel
  if (day >= 15) ctx.put(hw - 0.02, -0.25, 0, null, (v) => {
    v.boxMin(-0.06, 1.3, -0.12, 0, 1.82, 0.12, C.woodD);
    v.boxMin(-0.42, 1.72, -0.035, 0, 1.79, 0.035, C.woodD);
    boxR(v, -0.15, 1.6, 0, 0.3, 0.035, 0.03, C.woodD, 0, 0, -0.75);
    prism(v, -0.36, 1.58, 0, 0.05, 0.1, 0.13, C.brass, 10);
    prism(v, -0.36, 1.66, 0, 0.03, 0.04, 0.03, C.brassD, 10);
    v.box(-0.36, 1.5, 0, 0.025, 0.04, 0.025, C.brassD);
    v.box(-0.33, 1.2, 0.0, 0.018, 0.6, 0.018, C.rope);
    v.box(-0.33, 0.86, 0, 0.05, 0.1, 0.05, C.maroon);
    v.box(-0.33, 0.8, 0, 0.035, 0.05, 0.035, C.gold);
  });

  ctx.spot('wintwar', 1.4, -1.6, 0);
  ctx.spot('wintwarRack', 1.2, -2.55, Math.PI);
  ctx.spot('naychiStool', -0.8, -2.5, Math.PI, { sit: true, seat: 0.66 });
  ctx.spot('naychiBench', 2.6, 1.2, -Math.PI / 2, { sit: true, seat: 0.42 });
  // people stand at the sorting table's ends or behind it (never on its front edge, where they would hide it)
  ctx.spot('maya', -1.45, -0.55, [-0.4, -0.9]);
  ctx.spot('mayaChalk', -1.45, -0.95, [-0.5, -0.8]);
  ctx.spot('kolwin', -0.42, -1.8, 0);
  ctx.spot('khwarnyo', 0.45, -1.8, 0);
  ctx.spot('wintwarRope', 2.45, 0.05, [hw - 0.35, -0.25]);
  ctx.spot('door', 0, 2.9, Math.PI);
  ctx.tap('wintwar', 1.4, -0.75, [1.4, -1.6], NAME('မဝင့်ဝါ', 'Ma Wint War'), 0.7);
  ctx.tap('rack', -0.6, -1.9, [-0.6, -3.1], NAME('စာအကန့်စင်', 'the pigeonhole rack'), 0.8);
  ctx.tap('table', 0, 0.1, [0, -0.9], NAME('စာခွဲစားပွဲ', 'the sorting table'), 0.8);
  ctx.tap('scale', 2.2, -2.05, [2.35, -2.9], NAME('စာချိန်ခွင်', 'the letter scale'), 0.6);
  if (day >= 15) ctx.tap('rope', 2.45, 0.05, [hw - 0.35, -0.25], NAME('ခေါင်းလောင်းကြိုး', 'the bell rope'), 0.5);
  const api = ctx.finish('plaza');
  api.invitations = inv;
  api.stampBlock = block;
  return api;
}

// =============================================================================================
// Home Book rooms: a story layer on top of the site's own rooms (about, templates, content, library)
// =============================================================================================
const _ray = new THREE.Raycaster();
const _down = new THREE.Vector3(0, -1, 0);
function homeLayer(room, opts) {
  const group = new THREE.Group();
  group.name = 'storyLayer';
  const v = new VoxelBuilder();
  const A = makeAtlas(512, 512);
  const props = [], anims = [], stations = [], spots = {}, glowGeos = [], parts = [];
  const state = { evening: opts.evening ?? 0, rain: !!opts.rain };
  room.group.updateMatrixWorld(true);
  const L = {
    group, v, A, state, spots, stations,
    /** Height of whatever stands at (x, z) in the site's room (a counter top, a shelf, a table), else fallback. */
    top(x, z, fallback = 0, below = 2.2) {
      _ray.set(_p.set(x, below, z), _down);
      _ray.far = below + 0.5;
      const hits = _ray.intersectObject(room.group, true);
      for (const h of hits) {
        const o = h.object;
        if (!o.isMesh || o.userData.isOutline || o.material?.side === THREE.BackSide || !o.visible) continue;
        if (o.isInstancedMesh || o.material?.transparent) continue;
        return h.point.y;
      }
      return fallback;
    },
    prop(p, x, y, z, ry = 0) { p.root.position.set(x, y, z); p.root.rotation.y = ry; group.add(p.root); props.push(p); return p; },
    part(fn, x, y, z, ry = 0) { const pv = new VoxelBuilder(); fn(pv); const m = pv.mesh({ outline: true, px: 1.3 }); m.position.set(x, y, z); m.rotation.y = ry; group.add(m); parts.push(m); return m; },
    glow(x, y, z, w, h, d) { const g = new THREE.BoxGeometry(w, h, d); g.deleteAttribute('uv'); g.translate(x, y, z); glowGeos.push(g); },
    spot(name, x, z, look = 0, extra = {}) { spots[name] = { x, z, h: Array.isArray(look) ? face(x, z, look[0], look[1]) : look, ...extra }; },
    tap(id, x, z, look, label, r = 0.8) { stations.push({ id, x, z, r, look: { x: look[0], z: look[1] }, label, marker: { userData: { update() {} } } }); },
    animate(fn) { anims.push(fn); },
    finish(extra = {}) {
      if (v.parts.length) { const m = v.mesh({ outline: true, px: 1.3 }); m.name = 'storyStatics'; group.add(m); }
      const signs = A.mesh();
      if (signs) group.add(signs);
      let glowMat = null;
      if (glowGeos.length) {
        glowMat = new THREE.MeshBasicMaterial({ color: '#FFE3A0', toneMapped: false });
        const gm = new THREE.Mesh(mergeGeometries(glowGeos, false), glowMat);
        gm.raycast = () => {};
        group.add(gm);
        for (const g of glowGeos) g.dispose();
      }
      if (!group.parent) room.scene.add(group);
      const layer = {
        group, spots, stations,
        update(dt, t) {
          for (const p of props) p.update?.(dt, t);
          for (const a of anims) a(dt, t);
          if (glowMat) { const f = 0.93 + 0.07 * Math.sin(t * 13.1) * Math.sin(t * 7.3); glowMat.color.setRGB(f, 0.88 * f, 0.62 * f); }
        },
        setEvening(k) { state.evening = clamp01(k); extra.onEvening?.(state.evening); },
        setRain(on) { state.rain = !!on; extra.onRain?.(state.rain); },
        dispose() {
          for (const p of props) { try { p.dispose?.(); } catch (e) { /* freed */ } }
          group.traverse((o) => { if (o.geometry && o.geometry !== UNIT) o.geometry.dispose(); });
          glowMat?.dispose();
          A.tex?.dispose();
          group.removeFromParent();
        },
        ...extra.api,
      };
      extra.onEvening?.(state.evening);
      extra.onRain?.(state.rain);
      return layer;
    },
  };
  return L;
}

/** Day 12's wet state for the Writing Room, the trunk, Day 15's desk things. */
function dressAbout(room, opts) {
  const day = opts.day ?? 15;
  const L = homeLayer(room, opts);
  const { v, A } = L;
  const soaked = opts.trunkSoaked ?? (day === 12 && !opts.night);
  const windowOpen = opts.windowOpen ?? (day === 12 && !opts.night);
  // the trunk under the window at the desk's left end (story mode: Maya's storage trunk)
  const TX = -3.05, TZ = -2.8;
  v.boxMin(TX - 0.21, 0, TZ - 0.35, TX + 0.21, 0.36, TZ + 0.35, '#7A4A2A');
  for (const y of [0.06, 0.3]) v.boxMin(TX - 0.215, y, TZ - 0.355, TX + 0.215, y + 0.035, TZ + 0.355, C.brassD);
  for (const z of [-0.3, 0.3]) v.boxMin(TX - 0.215, 0, TZ + z - 0.03, TX + 0.215, 0.37, TZ + z + 0.03, '#5A3420');
  v.box(TX + 0.215, 0.27, TZ, 0.02, 0.08, 0.06, C.brass);
  if (soaked) {
    boxR(v, TX - 0.33, 0.6, TZ, 0.04, 0.5, 0.7, '#6A3E24', 0, 0, -0.25); // the lid up against the wall
    v.boxMin(TX - 0.18, 0.3, TZ - 0.31, TX + 0.18, 0.33, TZ + 0.31, '#3A2A1A');
    for (let i = 0; i < 7; i++) boxR(v, TX + (hash(i) - 0.5) * 0.12, 0.33 + i * 0.008, TZ + (hash(i + 4) - 0.5) * 0.3, 0.26, 0.007, 0.18, i % 2 ? '#C9C2B2' : '#B5AE9E', 0, (hash(i + 1) - 0.5) * 0.5, 0);
    for (let i = 0; i < 4; i++) v.box(TX + (hash(i + 9) - 0.5) * 0.1, 0.39, TZ + (i - 1.5) * 0.12, 0.2, 0.002, 0.012, '#8E877A');
    L.prop(storagePot6(), -2.72, 0, -2.15, 0.3);
  } else {
    v.boxMin(TX - 0.22, 0.36, TZ - 0.36, TX + 0.22, 0.42, TZ + 0.36, '#6A3E24');
    if (day >= 12) L.prop(storagePot6(), TX, 0.42, TZ, 0.3);
  }
  // the window swung open (two casements into the room), the curtains dark with rain, wet sill and floor
  const WX = -2.2, WY = 1.86, BZ = -4;
  let rainPane = null;
  if (windowOpen) {
    for (const sx of [-1, 1]) {
      const hx = WX + sx * 0.75, a = sx * 1.15;
      const leaf = new VoxelBuilder();
      leaf.boxMin(0, -0.5, -0.03, -sx * 0.75, 0.5, 0.03, '#F4EFE4');
      leaf.boxMin(-sx * 0.06, -0.44, -0.035, -sx * 0.69, 0.44, 0.035, '#BFD3DA');
      leaf.boxMin(-sx * 0.36, -0.44, -0.04, -sx * 0.39, 0.44, 0.04, '#F4EFE4');
      for (let i = 0; i < 4; i++) leaf.box(-sx * (0.15 + i * 0.15), 0.1 - i * 0.12, 0.04, 0.01, 0.25, 0.004, '#E8F0F4');
      const m = leaf.mesh({ outline: true, px: 1.2 });
      m.position.set(hx, WY, BZ + 0.1);
      m.rotation.y = a;
      group_add(L, m);
    }
    for (const sx of [-1, 1]) v.boxMin(WX + sx * 0.95 - 0.16, 0.95, BZ + 0.08, WX + sx * 0.95 + 0.16, 2.35, BZ + 0.2, '#6E2A33');
    v.boxMin(WX - 0.85, 1.28, BZ + 0.05, WX + 0.85, 1.3, BZ + 0.32, '#8E9AA6');
    for (let i = 0; i < 5; i++) boxR(v, WX - 0.6 + hash(i + 2) * 1.2, 0.79, -3.45 + hash(i + 7) * 0.2, 0.12 + hash(i) * 0.1, 0.004, 0.08, '#9EB0C0', 0, hash(i) * 3, 0);
    v.boxMin(WX - 0.7, 0.002, BZ + 0.85, WX + 0.5, 0.008, BZ + 1.35, '#8E9AA6');
    const rp = new THREE.PlaneGeometry(1.5, 1.0);
    const uv = rp.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2.4, uv.getY(i) * 1.2);
    rainPane = new THREE.Mesh(rp, new THREE.MeshBasicMaterial({ map: rainTexture(), transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false }));
    rainPane.position.set(WX, WY, BZ + 0.07);
    rainPane.raycast = () => {};
    L.group.add(rainPane);
    L.animate((dt, t) => { if (rainPane.visible) rainPane.material.map.offset.y = frac(t * 1.6); });
  }
  if (day === 12 && !opts.night) { // the puddle on the doormat (Ma Wint War dripping)
    v.boxMin(-0.45, 0.036, 3.35, 0.4, 0.04, 3.85, '#8E9AA6');
    v.boxMin(-0.3, 0.04, 3.45, 0.25, 0.042, 3.75, '#A9B5BE');
  }
  // Day 15: the notebook open at the loose page, the gold quill, lantern paper, the lantern, scraps
  let lantern = null;
  if (day >= 15) {
    const top = L.top(-2.2, -3.55, 0.78);
    const page = A.region(240, 160, (g, w, h) => {
      g.fillStyle = '#F7F0DF'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#E2D6B6'; g.fillRect(w / 2 - 2, 0, 4, h);
      scribble(g, 8, 8, w / 2 - 16, h - 16, { rows: 7, seed: 15, ink: '#3B3A5A' });
      g.strokeStyle = '#C9B48A'; g.setLineDash([6, 6]); g.strokeRect(w / 2 + 12, 14, w / 2 - 26, h - 28); g.setLineDash([]);
    });
    v.boxMin(-2.62, top, -3.72, -2.02, top + 0.012, -3.36, C.maroon);
    A.quad(page, 0.56, 0.34, M(-2.32, top + 0.014, -3.54, 0, -Math.PI / 2));
    prism(v, -2.85, top + 0.05, -3.75, 0.04, 0.045, 0.1, C.goldD, 8);
    boxR(v, -2.82, top + 0.22, -3.75, 0.014, 0.28, 0.014, C.gold, 0, 0, -0.18);
    boxR(v, -2.78, top + 0.33, -3.75, 0.06, 0.16, 0.008, '#F4F0E6', 0, 0, -0.18);
    if (opts.paper) { v.boxMin(-1.95, top, -3.75, -1.6, top + 0.006, -3.4, C.maroon); v.boxMin(-1.93, top + 0.006, -3.73, -1.62, top + 0.008, -3.42, C.gold); }
    if (opts.retried) for (let i = 0; i < 3; i++) { const bt = L.top(-1.05, -3.62, 0.3); v.box(-1.05 + (i - 1) * 0.06, bt + 0.02, -3.62 + (i % 2) * 0.05, 0.07, 0.06, 0.07, i % 2 ? C.maroon : '#E8D9B0'); }
    if (opts.lantern || opts.night) {
      lantern = L.prop(paperLantern6({ color: '#F1D9AA', word: 'စာ', stick: false, size: 0.8 }), -1.6, top, -3.55);
      lantern.setGlow?.(1);
    }
  }
  L.spot('wintwarMat', 0, 3.2, Math.PI);
  L.spot('mayaMat', 0, 2.2, 0);
  L.spot('mayaDesk', -1.35, -2.4, [-1.9, -3.55]);
  L.spot('mayaTrunk', -2.55, -2.2, [TX, TZ]);
  L.spot('wintwarPouf', 0.9, -0.6, [-1.35, -2.4]);
  L.tap('trunk', -2.55, -2.15, [TX, TZ], NAME('သေတ္တာ', 'the trunk'), 0.6);
  if (windowOpen) L.tap('window', -1.4, -2.9, [WX, BZ], NAME('ပြတင်းပေါက်', 'the window'), 0.6);
  if (lantern) L.tap('lantern', -1.25, -2.85, [-1.6, -3.55], NAME('မီးအိမ်', 'the lantern'), 0.5);
  return L.finish({
    onRain: (on) => { if (rainPane) rainPane.visible = on || windowOpen; },
    api: { lantern, setLantern: (k) => lantern?.setGlow?.(k) },
  });
}
function group_add(L, m) { L.group.add(m); }

function dressTemplates(room, opts) {
  const day = opts.day ?? 15;
  const L = homeLayer(room, opts);
  const { v, A } = L;
  const cTop = L.top(-2.4, 1.75, 1.0);
  let inv = null, box = null;
  if (day === 14) inv = L.prop(invitationStack6({ n: 8 }), -2.0, cTop, 1.8, 0.2);
  if (day >= 15) {
    box = L.prop(bookletBox6(12), -2.65, cTop, 1.72, 0.1);
    const sTop = L.top(-3.12, -0.55, 1.0);
    for (let i = 0; i < 5; i++) boxR(v, -3.1 + (hash(i) - 0.5) * 0.08, sTop + 0.004 + i * 0.006, -0.55 + (hash(i + 3) - 0.5) * 0.3, 0.16, 0.005, 0.22, i % 2 ? C.maroon : C.gold, 0, (hash(i + 5) - 0.5) * 0.6, 0);
    const dTop = L.top(2.4, 1.75, 0.8);
    const slate = A.region(240, 170, (g, w, h) => chalkBoard(g, w, h, [{ t: 'စာအုပ်ငယ်များ', s: 30 }, { t: 'ဒီနေ့ ညနေ', s: 24, c: '#F2D58A' }]));
    v.boxMin(2.2, dTop, 1.7, 2.6, dTop + 0.02, 1.76, C.woodD);
    boxR(v, 2.4, dTop + 0.15, 1.72, 0.42, 0.3, 0.03, C.woodD, -0.25, 0, 0);
    A.quad(slate, 0.38, 0.27, M(2.4, dTop + 0.15, 1.74, 0, -0.25));
    // his low stool, and the stool with three loose booklets beside it
    stoolInto(v, -1.3, 1.2, 0.3, C.wood, C.woodD, 0.32);
    stoolInto(v, -0.85, 1.55, 0.36, C.cream, C.woodD, 0.3);
    for (let i = 0; i < 3; i++) boxR(v, -0.85, 0.37 + i * 0.012, 1.55, 0.15, 0.01, 0.2, [C.maroon, C.cream, C.gold][i], 0, 0.2 * i - 0.2, 0);
  }
  L.spot('kowunna', -1.9, 2.5, [-2.4, 1.75]);
  L.spot('ukyaw', -1.3, 1.2, [-2.4, 1.75], { sit: true, seat: 0.3 });
  L.spot('maya', -0.3, 2.4, [-2.4, 1.75]);
  if (inv) L.tap('invites', -1.5, 2.4, [-2.0, 1.8], NAME('ဖိတ်စာတွေ', 'the invitations'), 0.6);
  if (box) L.tap('booklets', -1.6, 2.5, [-2.65, 1.72], NAME('စာအုပ်ငယ် သေတ္တာ', 'the booklet box'), 0.6);
  if (day >= 15) L.tap('slate', 1.8, 2.5, [2.4, 1.75], NAME('ကျောက်သင်ပုန်း', 'the slate'), 0.6);
  return L.finish({ api: { invitations: inv, bookletBox: box } });
}

function dressContent(room, opts) {
  const L = homeLayer(room, opts);
  const { v } = L;
  // Ko Phyo's brazier and big kettle left of the counter (steam)
  const st = new VoxelBuilder();
  const SL = { glow: (x, y, z, w, h, d) => L.glow(1.7 + x, y, -3.4 + z, w, h, d) };
  const { spout } = stoveInto(st, SL, { s: 1.05 });
  v.merge(st, M(1.7, 0, -3.4));
  const steam = [];
  const puffs = new THREE.InstancedMesh(UNIT, new THREE.MeshBasicMaterial({ color: '#F6F1E6', transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }), 4);
  puffs.frustumCulled = false;
  puffs.raycast = () => {};
  L.group.add(puffs);
  for (let i = 0; i < 4; i++) steam.push(hash(i + 0.3));
  L.animate((dt, t) => {
    for (let i = 0; i < 4; i++) {
      const u = frac(t * 0.4 + steam[i]), s = 0.08 * (0.5 + u * 1.3) * Math.sin(Math.PI * Math.min(1, u * 1.15));
      _m.compose(_p.set(1.7 + spout.x + Math.sin(t + i) * 0.04, spout.y + 0.05 + u * 0.7, -3.4 + spout.z), _q.identity(), _s.set(s, s, s));
      puffs.setMatrixAt(i, _m);
    }
    puffs.instanceMatrix.needsUpdate = true;
  });
  const cTop = L.top(2.9, -3.6, 0.98);
  L.prop(breadTray5(6), 3.0, cTop, -3.55, 0);
  // cups on the guests' table (the lounge), Maya's small teapot once given, the weave lamp at night
  const lTop = L.top(2.52, 2.92, 0.38);
  cupInto(v, 2.36, lTop, 2.82, C.white);
  cupInto(v, 2.66, lTop, 3.06, C.cream);
  cupInto(v, 2.4, lTop, 3.08, '#E6EEF0');
  if (opts.tea) L.prop(smallTeapot3({}), 2.6, lTop, 2.78, 0.6);
  const lamp = L.part((pv) => {
    for (let i = 0; i < 6; i++) prism(pv, 0, 0.04 + i * 0.045, 0, 0.09 + Math.sin((i / 5) * Math.PI) * 0.04, 0.09 + Math.sin(((i + 1) / 5) * Math.PI) * 0.04, 0.045, i % 2 ? C.straw : C.strawD, 8);
    prism(pv, 0, 0.0, 0, 0.08, 0.08, 0.02, C.woodD, 8);
  }, 2.75, lTop, 2.86);
  const lampGlow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.12), new THREE.MeshBasicMaterial({ color: '#FFD98A', toneMapped: false }));
  lampGlow.position.set(2.75, lTop + 0.15, 2.86);
  L.group.add(lampGlow);
  const showLamp = (k) => { const on = !!opts.night || k > 0.5; lamp.visible = on; lampGlow.visible = on; };
  L.spot('kophyo', 1.7, -2.85, Math.PI);
  L.spot('kophyoCounter', 2.55, -2.95, 0);
  L.spot('sunwe', -2.4, 0.15, Math.PI, { sit: true, seat: 0.45 });
  L.spot('khinmay', 2.1, -2.8, Math.PI);
  L.spot('maungarkar', 3.0, -2.8, Math.PI);
  L.spot('khinmayMid', 0.3, 0.15, Math.PI, { sit: true, seat: 0.45 });
  L.spot('maungnge', 2.0, 3.0, [2.52, 2.92], { sit: true, seat: 0.3 });
  L.spot('eimon', 3.05, 2.6, [2.52, 2.92], { sit: true, seat: 0.3 });
  L.spot('maya', 1.0, 1.6, [1.7, -3.4]);
  L.tap('brazier', 1.7, -2.6, [1.7, -3.4], NAME('မီးဖို', "Ko Phyo's brazier"), 0.6);
  L.tap('guests', 1.9, 2.3, [2.52, 2.92], NAME('ဧည့်သည် စားပွဲ', "the guests' table"), 0.6);
  return L.finish({ onEvening: showLamp, api: { setLamp: (on) => { lamp.visible = lampGlow.visible = !!on; } } });
}

function dressLibrary(room, opts) {
  const L = homeLayer(room, opts);
  const { v, A } = L;
  const tTop = L.top(-3.0, 2.85, 0.6);
  const sheet = A.region(300, 130, (g, w, h) => {
    for (let k = 0; k < 3; k++) {
      const x = k * 100;
      g.fillStyle = '#F7F0DF'; g.fillRect(x + 4, 4, 92, h - 8);
      scribble(g, x + 8, 10, 84, h - 20, { rows: 6, seed: 20 + k, ink: '#3B3A5A', margin: null });
      g.strokeStyle = C.red; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 12, 16); g.lineTo(x + 88, h - 16); g.moveTo(x + 88, 16); g.lineTo(x + 12, h - 16); g.stroke();
    }
  });
  A.quad(sheet, 0.48, 0.21, M(-3.0, tTop + 0.006, 2.85, 0.3, -Math.PI / 2));
  for (const [x, z, r, c] of [[-2.0, -0.6, 0.4, C.maroon], [-1.7, -0.4, -0.5, '#2F5D8C']]) {
    boxR(v, x, 0.025, z, 0.36, 0.05, 0.26, c, 0, r, 0);
    boxR(v, x, 0.026, z, 0.02, 0.052, 0.27, jitter(c, -0.2, 2), 0, r, 0);
    boxR(v, x + 0.02, 0.012, z + 0.02, 0.34, 0.022, 0.24, C.paper, 0, r, 0);
  }
  const seat = room.letterShelf?.chair?.seat;
  L.spot('naychi', seat ? seat.x : -2.55, seat ? seat.z : 1.95, room.letterShelf?.chair?.heading ?? 0.45, { sit: true, seat: seat ? seat.y : 0.45 });
  L.spot('maya', -1.8, 2.6, [-2.55, 1.95]);
  L.spot('mayaStool', -1.95, 2.35, [-2.55, 1.95], { sit: true, seat: 0.25 });
  L.tap('sheets', -2.4, 3.2, [-3.0, 2.85], NAME('စာရွက်တွေ', 'the crossed-out sheets'), 0.5);
  L.tap('books', -1.4, -0.1, [-1.85, -0.5], NAME('စာအုပ်တွေ', 'the open books'), 0.6);
  return L.finish();
}

const HOME_DRESS = { about: dressAbout, templates: dressTemplates, content: dressContent, library: dressLibrary };
/**
 * The story layer for an existing Home Book room (js/game/interiors/<id>.js), without touching its file.
 * opts: { day, evening, rain, night, trunkSoaked, windowOpen, paper, lantern, retried, tea, keepMarkers }  (the site stations are hidden unless keepMarkers)
 * -> { group, spots, stations, update, setEvening, setRain, dispose, ...handles } or null (no layer).
 */
export function dressHomeRoom(room, id, opts = {}) {
  const fn = HOME_DRESS[id];
  if (!fn || !room?.group) return null;
  const layer = fn(room, opts);
  // story mode: the site's own station rings and gems are hidden (INDEX 13.5, no markers); restored on dispose
  const hidden = [];
  if (opts.keepMarkers !== true) {
    for (const s of room.stations || []) if (s.marker && s.marker.visible !== false) { s.marker.visible = false; hidden.push(s.marker); }
  }
  const baseDispose = layer.dispose;
  layer.dispose = () => { for (const m of hidden) m.visible = true; baseDispose(); };
  layer.siteStations = (room.stations || []).map((s) => s.id);
  return layer;
}
/** Who stands where in a dressed Home Book room (the dev page; a day's roomCast can use the same). */
export const HOME_PEOPLE = {
  about: (o = {}) => ((o.day ?? 15) === 12 && !o.night ? [['wintwarMat', 'wintwar'], ['mayaMat', 'maya']] : (o.day ?? 15) >= 15 && !o.night ? [['wintwarPouf', 'wintwar'], ['mayaDesk', 'maya']] : [['mayaDesk', 'maya']]),
  templates: (o = {}) => ((o.day ?? 15) >= 15 ? [['kowunna', 'kowunna'], ['ukyaw', 'ukyaw'], ['maya', 'maya']] : [['maya', 'maya']]),
  content: (o = {}) => (o.after ? [['kophyoCounter', 'kophyo'], ['maungnge', 'maungnge'], ['eimon', 'eimon'], ['sunwe', 'sunwe'], ['khinmayMid', 'khinmay']] : [['kophyo', 'kophyo'], ['sunwe', 'sunwe'], ['khinmay', 'khinmay'], ['maungarkar', 'maungarkar'], ['maya', 'maya']]),
  library: () => [['naychi', 'naychi'], ['maya', 'maya']],
};

// ---------------------------------------------------------------------------------------------
// walk-ons (people.js SPEC looks for people who are not in cast.js; drafts for Maya)
// ---------------------------------------------------------------------------------------------
export const WALKON_LOOKS = {
  carter1: { age: 'adult', build: 'wide', skin: 3, hair: 'short', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'brown', check: true, extras: ['towel'] },
  carter2: { age: 'elder', build: 'mid', skin: 4, hair: 'cap', top: 'shirt', topColor: 'olive', bottom: 'longyi', bottomColor: 'navy', check: true },
  gourdaunty: { age: 'elder', build: 'wide', skin: 2, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'leaf', bottom: 'htamein', bottomColor: 'brown', extras: ['apron', 'thanaka'] },
  buyerA: { age: 'adult', build: 'slim', skin: 1, hair: 'bun', top: 'blouse', topColor: 'rose', bottom: 'htamein', bottomColor: 'teal', extras: ['satchel'], extraColor: 'tan' },
  buyerB: { age: 'elder', build: 'mid', skin: 3, hair: 'side', hairColor: 'grey', top: 'eingyi', topColor: 'white', bottom: 'longyi', bottomColor: 'plum', check: true },
  buyerC: { age: 'adult', build: 'mid', skin: 2, hair: 'long', top: 'blouse', topColor: 'mustard', bottom: 'htamein', bottomColor: 'navy', extras: ['thanaka'] },
  kidA: { age: 'child', skin: 2, hair: 'braid', top: 'tee', topColor: 'coral', bottom: 'shorts', bottomColor: 'navy' },
  kidB: { age: 'child', skin: 3, hair: 'short', top: 'tee', topColor: 'sky', bottom: 'shorts', bottomColor: 'brown' },
  weighgirl: { age: 'teen', build: 'slim', skin: 1, hair: 'braid', top: 'blouse', topColor: 'cream', bottom: 'htamein', bottomColor: 'maroon', extras: ['satchel'], extraColor: 'brown' },
};
export const WALKON_NAMES = {
  carter1: NAME('လှည်းသမား', 'a carter'), carter2: NAME('လှည်းသမား', 'a carter'), gourdaunty: NAME('ဘူးသီးအဒေါ်', 'the gourd aunty'),
  buyerA: NAME('ဝယ်သူ', 'a buyer'), buyerB: NAME('ဝယ်သူ', 'a buyer'), buyerC: NAME('ဝယ်သူ', 'a buyer'),
  kidA: NAME('ကလေး', 'a child'), kidB: NAME('ကလေး', 'a child'), weighgirl: NAME('ကောင်မလေး', 'the girl'),
};

// ---------------------------------------------------------------------------------------------
// exports
// ---------------------------------------------------------------------------------------------
/** day: a day number (doors.js) or a build-options object (dev page). */
const dayOf = (d) => (d && typeof d === 'object' ? d.day : d);
const G = 'garden', B = 'blank', H = 'home';
export const ROOMS = {
  kilntea: { name: NAME('ထောင့်ဆိုင်', 'Corner tea shop'), district: G, build: buildKilnTea,
    people: () => [['teauncle', 'teauncle'], ['kophyo', 'kophyo'], ['maya', 'maya'], ['carter1', 'carter1'], ['carter2', 'carter2']] },
  paperstore: { name: NAME('စက္ကူဆိုင်', 'The paper store'), district: G, build: buildPaperStore,
    people: () => [['kyinyein', 'kyinyein'], ['kophyo', 'kophyo'], ['maya', 'maya']] },
  packroom: { name: NAME('အိုးဖိုထဲ', 'The kiln packing room'), district: G, build: buildPackRoom,
    people: () => [['kokaung', 'kaung'], ['maya', 'maya']] },
  gourdhouse: { name: NAME('ဘူးသီးအဒေါ်ရဲ့ မီးဖိုချောင်', "The gourd aunty's kitchen"), district: G, build: buildGourdHouse,
    people: () => [['aunty', 'gourdaunty'], ['maya', 'maya']] },
  hpohtawshed: { name: NAME('ဦးဖိုးထော်ရဲ့ ဥယျာဉ်အိမ်', "U Hpo Htaw's garden house"), district: G, build: buildHpoHtawShed,
    people: () => [['hpohtaw', 'hpohtaw'], ['maya', 'maya']] },
  dryinghall: { name: NAME('အိုးအခြောက်ခံ ဆောင်', "The kiln's drying hall"), district: G, build: buildDryingHall,
    people: (d) => {
      const day = dayOf(d) ?? 12;
      if (day === 10) return [['kaungRack', 'kaung']];
      if (day >= 15) return [['micho', 'micho']];
      return [['dawohn', 'dawohn'], ['maya', 'maya'], ['micho', 'micho'], ['palae', 'palae'], ['queue1', 'buyerA'], ['queue2', 'buyerB'], ['queue3', 'buyerC'], ['kid1', 'kidA'], ['kid2', 'kidB']];
    } },
  committeeroom: { name: NAME('ဈေးကော်မတီ ရုံးခန်း', 'The Market Committee room'), district: G, build: buildCommitteeRoom,
    people: (d) => ((dayOf(d) ?? 12) === 12 ? [['myamya', 'myamya'], ['dawohn', 'dawohn'], ['maya', 'maya'], ['girl', 'weighgirl']] : [['myamya', 'myamya']]) },
  lodge: { name: NAME('ခရီးသည် တည်းခိုဆောင်', "The travellers' lodge"), district: B, build: buildLodge,
    people: (d) => ((dayOf(d) ?? 13) >= 14
      ? [['dawpwint', 'dawpwint'], ['tblPyae', 'pyaesone'], ['tblShwe', 'shwesin'], ['tblMoe', 'moe'], ['tblMaya', 'maya']]
      : [['dawpwint', 'dawpwint'], ['moe', 'moe'], ['pyaesone', 'pyaesone'], ['shwesin', 'shwesin'], ['maya', 'maya']]) },
  backcover: { name: NAME('နောက်ကျောဖုံး အတွင်း', 'Inside the Back Cover'), district: B, build: buildBackCover,
    people: () => [['maya', 'maya']] },
  sortingroom: { name: NAME('စာခွဲခန်း', 'The sorting room'), district: H, build: buildSortingRoom,
    people: (d) => {
      const day = dayOf(d) ?? 3;
      if (day === 3) return [['wintwar', 'wintwar'], ['maya', 'maya']];
      if (day === 6) return [['naychiBench', 'naychi'], ['wintwarRack', 'wintwar'], ['mayaChalk', 'maya']];
      if (day >= 15) return [['wintwarRack', 'wintwar'], ['kolwin', 'kolwin'], ['khwarnyo', 'khwarnyo'], ['maya', 'maya']];
      return day < 10 ? [['wintwarRack', 'wintwar'], ['naychiStool', 'naychi'], ['maya', 'maya']] : [['wintwarRack', 'wintwar'], ['maya', 'maya']];
    } },
};
