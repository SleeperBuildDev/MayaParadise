// District 1 · the Exercise-Book Quarter (ruled paper; opens Day 2). School, potter's yard, snack shop,
// playground and a little stage on four east-west streets. Region file format: see regions/index.js.
import { rng } from '../kit.js';

export const REGION = { id: 'exercise', name: { my: 'ဗလာစာအုပ်ရပ်', en: 'Exercise-Book Quarter' }, rect: [-71, 40, 79, 160], paper: 'ruled', label: [-36, 50] };

// ---------------------------------------------------------------------------------
// Streets of the Exercise-Book Quarter: an avenue down from the bridge, four east-west streets
// (fronts of the houses face them from the north), five north-south streets.
// ---------------------------------------------------------------------------------
export const AVE_X = 4;
export const STREETS_Z = [62, 90, 118, 146];
export const STREETS_X = [-58, -27, AVE_X, 35, 66];
const ROAD_HALF = 1.2;

export const ROAD_NODES = [{ id: 'landing', x: AVE_X, z: 41.2 }];
export const ROAD_EDGES = [];
{
  const id = (x, z) => `q${x}_${z}`;
  for (const z of STREETS_Z) for (const x of STREETS_X) ROAD_NODES.push({ id: id(x, z), x, z });
  // avenue: landing -> first street -> ... -> south boundary and on
  ROAD_EDGES.push({ id: 'ave0', a: 'landing', b: id(AVE_X, STREETS_Z[0]), sample: 0.5 });
  for (let k = 0; k < STREETS_Z.length - 1; k++) {
    for (const x of STREETS_X) ROAD_EDGES.push({ id: `ns${x}_${k}`, a: id(x, STREETS_Z[k]), b: id(x, STREETS_Z[k + 1]), sample: 0.5 });
  }
  for (const z of STREETS_Z) {
    for (let k = 0; k < STREETS_X.length - 1; k++) ROAD_EDGES.push({ id: `ew${z}_${k}`, a: id(STREETS_X[k], z), b: id(STREETS_X[k + 1], z), sample: 0.5, bias: 0.003 }); // (east-west wins where streets cross)
  }
  // on south: the boundary sign (the road on to the Envelope Market starts at `border`: regions/market.js)
  ROAD_NODES.push({ id: 'border', x: AVE_X, z: 160 });
  ROAD_EDGES.push({ id: 'ave4', a: id(AVE_X, 146), b: 'border', sample: 0.5 });
}

// ---------------------------------------------------------------------------------
// Items: buildings and props. Kinds (drawn by build.js):
//   house { w, d, style: 'stilt' | 'shop' | 'cottage', seed }  school  snack  potter  stage
//   padauk / rain (trees) { s }  lamp  bench { ry }  fence { len, ry }  hedge { len, ry }
//   garden { w, d, seed }  laundry { len }  jars  bikes  well  swing  seesaw  slide  pots { w, d }
//   kiln  woodpile  stall  bookSign  borderSign  pageEnd  flowers  noticeBoard  stamp { ry, seed }  seal  parcel { ry, seed }
//   pencil { len, ry }  eraser  clip (paper-clip arch)  hens { seed }  well  teaSet  tufts { seed }
// Footprints for walking come from `w`/`d` (box) or the kind's own radius (see build.js OBST).
// ---------------------------------------------------------------------------------
export const ITEMS = [];
export const SIGNS = [];
const add = (o) => (ITEMS.push(o), o);

const SPECIAL = {
  // street z -> [x0, x1, kind] frontage reserved for a special building
  62: [[9.5, 20.5, 'snack']],
  90: [[-24.2, 1.2, 'school']],
  118: [[38, 63, 'potter']],
  146: [[-24, -2, 'stage']],
};

function fillStreets() {
  const r = rng(2026);
  const styles = ['stilt', 'shop', 'cottage'];
  const roofs = ['#7A2430', '#8E3B2E', '#6E1F2A', '#A0642E', '#8C6A28'];
  const walls = ['#F1E6CF', '#EAD9B5', '#F4EBDD', '#E7D3B0', '#F2E2C4'];
  for (const zs of STREETS_Z) {
    const front = zs - ROAD_HALF - 1.5; // house fronts stand back from the kerb (a footpath, then the porch)
    for (let k = 0; k < STREETS_X.length - 1; k++) {
      const xa = STREETS_X[k] + ROAD_HALF + 1.4, xb = STREETS_X[k + 1] - ROAD_HALF - 1.4;
      const reserved = (SPECIAL[zs] || []).filter(([a, b]) => b > xa && a < xb);
      let x = xa + r() * 1.2;
      while (x < xb - 4.5) {
        const sp = reserved.find(([a, b]) => x + 4 > a && x < b);
        if (sp) { x = sp[1] + 1.2 + r() * 1.0; continue; }
        const style = styles[Math.floor(r() * 3)];
        let w = style === 'shop' ? 5.2 + r() * 1.4 : style === 'stilt' ? 5.6 + r() * 1.8 : 4.8 + r() * 1.4;
        const nextRes = reserved.find(([a]) => a > x);
        const limit = Math.min(xb, nextRes ? nextRes[0] - 0.8 : xb);
        if (x + w > limit) w = limit - x;
        if (w < 4.2) break;
        const d = style === 'shop' ? 6.2 : style === 'stilt' ? 5.4 + r() * 0.8 : 4.6 + r() * 0.6;
        const seed = Math.floor(r() * 1e6);
        add({ k: 'house', style, x: x + w / 2, z: front - d / 2, w, d, seed, roof: roofs[seed % roofs.length], wall: walls[(seed >> 3) % walls.length] });
        // a padauk or a lamp in the gap in front (north kerb: never between the camera and the street)
        const gx = x + w + 0.9;
        if (gx < limit - 1) add(r() < 0.55 ? { k: 'padauk', x: gx, z: front + 0.3, s: 0.9 + r() * 0.25 } : { k: 'lamp', x: gx, z: zs - ROAD_HALF - 0.55 });
        x += w + 1.6 + r() * 1.6;
      }
    }
  }
}

// Back gardens south of each street (low things only: the camera looks across them at the street).
function fillYards() {
  const r = rng(77);
  for (const zs of STREETS_Z) {
    const z0 = zs + ROAD_HALF + 0.8; // just past the south kerb
    for (let k = 0; k < STREETS_X.length - 1; k++) {
      const xa = STREETS_X[k] + ROAD_HALF + 1.2, xb = STREETS_X[k + 1] - ROAD_HALF - 1.2;
      // special yards
      if (zs === 90 && k === 1) continue; // the playground (placed below)
      if (zs === 118 && k === 3) continue; // the potter's drying yard
      if (zs === 62 && k === 2) continue; // the snack shop's tea corner
      if (zs === 118 && k === 1) continue; // behind the stage (it stands north of the fourth street)
      // a low picket fence along the kerb with a gap or two, then gardens, wash lines, jars
      let x = xa;
      while (x < xb - 2) {
        const len = Math.min(xb - x, 4 + r() * 5);
        add({ k: 'fence', x: x + len / 2, z: z0 + 0.15, len, ry: 0 });
        x += len + 1.6 + r() * 1.5;
      }
      // two rows of yard life: near the fence (gardens, wash lines, jars), and deeper in (the
      // Quarter's big exercise-book things, hens, wells, a neighbour's tea table)
      let gx = xa + 1 + r() * 2;
      while (gx < xb - 3) {
        const pick = r();
        const gz = z0 + 2.4 + r() * 2.4;
        if (pick < 0.3) add({ k: 'garden', x: gx + 1.6, z: gz, w: 3.2, d: 1.8, seed: Math.floor(r() * 1e5) });
        else if (pick < 0.46) add({ k: 'laundry', x: gx + 1.8, z: gz + 0.4, len: 3.4 });
        else if (pick < 0.56) add({ k: 'jars', x: gx + 0.8, z: gz - 0.4 });
        else if (pick < 0.66) add({ k: 'bikes', x: gx + 0.8, z: gz - 0.6 });
        else if (pick < 0.76) add({ k: 'woodpile', x: gx + 0.8, z: gz });
        else if (pick < 0.86) add({ k: 'teaSet', x: gx + 1.0, z: gz });
        else add({ k: 'flowers', x: gx + 0.9, z: gz, seed: Math.floor(r() * 1e5) });
        gx += 3.4 + r() * 2.2;
      }
      gx = xa + 2.5 + r() * 3;
      while (gx < xb - 3) {
        const pick = r();
        const gz = z0 + 7.5 + r() * 3.5;
        if (pick < 0.2) add({ k: 'pencil', x: gx + 1.6, z: gz, len: 2.8 + r() * 1.2, ry: (r() - 0.5) * 0.7 });
        else if (pick < 0.32) add({ k: 'eraser', x: gx + 0.7, z: gz, ry: (r() - 0.5) * 0.8 });
        else if (pick < 0.46) add({ k: 'hens', x: gx + 0.9, z: gz, seed: Math.floor(r() * 1e5) });
        else if (pick < 0.56) add({ k: 'well', x: gx + 0.8, z: gz });
        else if (pick < 0.68) add({ k: 'clip', x: gx + 0.9, z: gz - 0.6 });
        else if (pick < 0.82) add({ k: 'garden', x: gx + 1.6, z: gz, w: 3.0, d: 1.6, seed: Math.floor(r() * 1e5) });
        else add({ k: 'flowers', x: gx + 0.9, z: gz, seed: Math.floor(r() * 1e5) });
        gx += 5.5 + r() * 4;
      }
      // a third row by the backs of the next street's houses: woodpiles, wash lines, a well
      gx = xa + 1.5 + r() * 3;
      while (gx < xb - 3 && zs !== STREETS_Z.at(-1)) {
        const pick = r();
        const gz = zs + 15.5 + r() * 1.5;
        if (pick < 0.22) add({ k: 'laundry', x: gx + 1.8, z: gz, len: 3.2 });
        else if (pick < 0.4) add({ k: 'woodpile', x: gx + 0.8, z: gz });
        else if (pick < 0.55) add({ k: 'jars', x: gx + 0.8, z: gz });
        else if (pick < 0.7) add({ k: 'garden', x: gx + 1.5, z: gz, w: 2.8, d: 1.4, seed: Math.floor(r() * 1e5) });
        else if (pick < 0.8) add({ k: 'bikes', x: gx + 0.8, z: gz });
        else add({ k: 'flowers', x: gx + 0.9, z: gz, seed: Math.floor(r() * 1e5) });
        gx += 5 + r() * 3.5;
      }
      // grass tufts scattered all through the yard
      for (let n = Math.floor((xb - xa) / 4); n > 0; n--) add({ k: 'tufts', x: xa + 1 + r() * (xb - xa - 2), z: zs + 3 + r() * 14, seed: Math.floor(r() * 1e5) });
      // a tree deep in the yard (far enough from the street not to hide anyone on it)
      if (r() < 0.75) add({ k: r() < 0.6 ? 'padauk' : 'rain', x: xa + 3 + r() * (xb - xa - 6), z: zs + 11 + r() * 2.5, s: 0.95 + r() * 0.3 });
    }
  }
}

function placeSpecials() {
  // ---- landing: the bridge comes down onto a little green with the Quarter's name on a standing exercise book
  add({ k: 'bookSign', x: -3.6, z: 46.5 });
  add({ k: 'bench', x: 9.2, z: 51.5, ry: 0 });
  add({ k: 'flowers', x: -6.8, z: 49.6, seed: 4 });
  add({ k: 'flowers', x: 12.5, z: 47.2, seed: 9 });
  add({ k: 'jars', x: 12.8, z: 53.5 });
  add({ k: 'hedge', x: -10, z: 42.2, len: 10, ry: 0 });
  add({ k: 'hedge', x: 18, z: 42.2, len: 10, ry: 0 });
  for (const [x, z] of [[-14, 44], [-20, 52], [20, 45], [26, 52], [-30, 44], [34, 43]]) add({ k: 'padauk', x, z, s: 1.05 });
  for (const [x, z] of [[-40, 46], [44, 47], [-52, 44], [58, 45]]) add({ k: 'rain', x, z, s: 1.1 });
  add({ k: 'pencil', x: -9.5, z: 50.5, len: 3.6, ry: 0.15 });
  add({ k: 'eraser', x: 24, z: 49.2, ry: -0.3 });
  add({ k: 'clip', x: -1.8, z: 52.6 });
  add({ k: 'hens', x: 22, z: 48.4, seed: 3 });
  add({ k: 'lamp', x: 1.8, z: 44.5 });
  add({ k: 'lamp', x: 6.2, z: 57.5 });

  // ---- the snack shop (Daw Ohn's), on the first street just east of the avenue, a tea corner opposite
  add({ k: 'snack', x: 15, z: 62 - ROAD_HALF - 1.5 - 2.6, w: 9, d: 5.2 });
  add({ k: 'stall', x: 14.6, z: 66.8 });
  add({ k: 'bench', x: 18.6, z: 66.6, ry: 0 });
  add({ k: 'flowers', x: 23, z: 67, seed: 12 });
  add({ k: 'fence', x: 28, z: 64.35, len: 8, ry: 0 });
  add({ k: 'rain', x: 27, z: 74, s: 1.15 });

  // ---- the school (north side of the second street), its playground across the street
  add({ k: 'school', x: -11.5, z: 90 - ROAD_HALF - 1.5 - 4.6, w: 25, d: 9.2 });
  add({ k: 'swing', x: -19, z: 96.5 });
  add({ k: 'seesaw', x: -11.5, z: 95.4 });
  add({ k: 'slide', x: -4, z: 97 });
  add({ k: 'fence', x: -20.5, z: 92.15, len: 10, ry: 0 });
  add({ k: 'fence', x: -3.5, z: 92.15, len: 9, ry: 0 });
  add({ k: 'noticeBoard', x: -12.5, z: 92.6 });
  for (const [x, z] of [[-23, 101.5], [-1, 102]]) add({ k: 'padauk', x, z, s: 1.15 });

  // ---- the potter's yard (third street, east block): shed and kiln, pots drying across the street
  add({ k: 'potter', x: 50.5, z: 118 - ROAD_HALF - 1.5 - 3.6, w: 23, d: 7.2 });
  add({ k: 'pots', x: 44, z: 122.4, w: 5.5, d: 2.2 });
  add({ k: 'pots', x: 52.5, z: 123.4, w: 5.5, d: 2.2 });
  add({ k: 'pots', x: 60, z: 122.4, w: 4.5, d: 2.2 });
  add({ k: 'woodpile', x: 39.4, z: 125.5 });
  add({ k: 'rain', x: 56, z: 130.5, s: 1.2 });

  // ---- the little stage (fourth street, west of the avenue), with a square in front of it
  add({ k: 'stage', x: -13, z: 146 - ROAD_HALF - 1.5 - 5.5, w: 11, d: 6 });
  add({ k: 'bench', x: -16.5, z: 141.4, ry: 0 });
  add({ k: 'bench', x: -9.5, z: 141.4, ry: 0 });
  for (const [x, z] of [[-24.5, 131.5], [-2, 131.5]]) add({ k: 'padauk', x, z, s: 1.1 });
  add({ k: 'lamp', x: -21.5, z: 143.6 });
  add({ k: 'lamp', x: -4.5, z: 143.6 });

  // ---- the west and east margins: trees and gardens on the edge of the page
  const r = rng(5);
  for (let z = 66; z < 158; z += 7 + r() * 4) {
    add({ k: r() < 0.5 ? 'padauk' : 'rain', x: -66 + r() * 3, z, s: 0.95 + r() * 0.3 });
    add({ k: r() < 0.5 ? 'padauk' : 'rain', x: 72 + r() * 3, z: z + 3, s: 0.95 + r() * 0.3 });
  }

  // ---- the south border
  add({ k: 'borderSign', x: AVE_X - 3.4, z: 158.2 });
  add({ k: 'lamp', x: AVE_X + 2, z: 157.5 });
}

fillStreets();
fillYards();
placeSpecials();

// ---------------------------------------------------------------------------------
// Neighbourhood life (polish pass): the yards and street edges at walking height. Placed after the first
// fill with a rng of its own (so the houses, gardens and specials above keep their places), and only where
// nothing stands yet. Most of it is low (the camera looks north across the yards at the streets), the small
// clutter goes into the flat ground mesh (no outline, no shadow: cheap), and nothing points the way.
// ---------------------------------------------------------------------------------
const TAU = Math.PI * 2;
/** Where a day's story walks or stands: the dressing keeps out (the snack shop, the avenue cart, the school
 * and playground, the potter's yard, the stage square, the border). */
const STORY_CLEAR = [[3, 54, 24, 70], [0.5, 62, 10, 80], [-28, 84, 5, 104], [36, 108, 64, 128], [-31, 132, 2, 150], [-6, 147, 11, 160]];
const FP = []; // footprints of everything placed: [x0, z0, x1, z1]
function footprint(it) {
  const t = Math.abs(Math.sin(it.ry || 0)) > 0.7; // turned a quarter: length runs north-south
  const L = (a, b) => (t ? [it.x - b, it.z - a, it.x + b, it.z + a] : [it.x - a, it.z - b, it.x + a, it.z + b]);
  if (it.k === 'tufts' || it.k === 'qPlot' || it.k === 'qChinlone') return null; // (ground decals: walked over)
  if (it.w && it.d) return L(it.w / 2, it.d / 2);
  if (it.len) return L(it.len / 2 + 0.2, it.k === 'laundry' ? 0.35 : 0.35);
  const r = { padauk: 0.9, rain: 1.0, lamp: 0.3, bench: 0.85, flowers: 0.6, hens: 1.0, clip: 1.0, eraser: 0.8, well: 0.8, teaSet: 1.0, jars: 0.8, bikes: 0.75, woodpile: 0.9 }[it.k] ?? 0.8;
  return [it.x - r, it.z - r, it.x + r, it.z + r];
}
function rebuildFP() { FP.length = 0; for (const it of ITEMS) { const f = footprint(it); if (f) FP.push(f); } }
rebuildFP();
const hits = (a, b, m) => !(a[2] + m < b[0] || a[0] - m > b[2] || a[3] + m < b[1] || a[1] - m > b[3]);
function onRoad(x0, z0, x1, z1) {
  const pad = ROAD_HALF + 0.45;
  if (STREETS_Z.some((z) => z1 > z - pad && z0 < z + pad)) return true;
  if (STREETS_X.some((x) => x1 > x - pad && x0 < x + pad && z1 > STREETS_Z[0] - pad)) return true;
  return x1 > AVE_X - pad && x0 < AVE_X + pad; // the avenue (and the landing green's road)
}
/** Adds `o` if its box (half sizes hw, hd) is clear of roads, story places and everything placed. */
function place(o, hw, hd, margin = 0.35) {
  const b = [o.x - hw, o.z - hd, o.x + hw, o.z + hd];
  if (b[0] < REGION.rect[0] + 7 || b[2] > REGION.rect[2] - 2 || b[3] > REGION.rect[3] - 1.5) return null;
  if (onRoad(...b)) return null;
  if (STORY_CLEAR.some((c) => hits(b, c, 0))) return null;
  if (FP.some((f) => hits(b, f, margin))) return null;
  FP.push(b);
  return add(o);
}
/** A special corner of the Quarter: whatever the first fill put there makes room (fences stay). */
function makeRoom(x0, z0, x1, z1) {
  for (let i = ITEMS.length - 1; i >= 0; i--) {
    const it = ITEMS[i];
    if (it.k === 'fence' || it.k === 'house' || it.k === 'lamp') continue;
    if (it.x > x0 && it.x < x1 && it.z > z0 && it.z < z1) ITEMS.splice(i, 1);
  }
  rebuildFP();
  FP.push([x0, z0, x1, z1]);
}

// The places the new neighbours work at (their people are in PEOPLE below)
const CHINLONE = { x: -14.5, z: 70.6 }; // a swept circle in the first street's west yards: three children and a rattan ball
const TEA = { x: 13.6, z: 122.6 }; // Ko Zaw's tea stall, the third street's yards just east of the avenue
const MENDER = { x: 42.2, z: 95.2 }; // U Khin mends bicycles in the yard corner by the second street
const WASH = { x: -45.5, z: 68.4 }; // Daw Myint's wash line and tub, the first street's far west yards

function placeLife() {
  // ---- the four working corners
  makeRoom(CHINLONE.x - 3, CHINLONE.z - 2.6, CHINLONE.x + 3, CHINLONE.z + 2.6);
  add({ k: 'qChinlone', x: CHINLONE.x, z: CHINLONE.z });
  add({ k: 'bench', x: CHINLONE.x + 3.6, z: CHINLONE.z - 1.0, ry: -Math.PI / 2 }); FP.push([CHINLONE.x + 3.2, CHINLONE.z - 1.9, CHINLONE.x + 4.0, CHINLONE.z - 0.1]);
  makeRoom(TEA.x - 2.6, TEA.z - 2.4, TEA.x + 2.6, TEA.z + 2.6);
  add({ k: 'qTeaStall', x: TEA.x, z: TEA.z, ry: 0 });
  makeRoom(MENDER.x - 2.2, MENDER.z - 1.6, MENDER.x + 2.2, MENDER.z + 1.6);
  add({ k: 'qBikeShop', x: MENDER.x, z: MENDER.z, ry: 0 });
  makeRoom(WASH.x - 2.6, WASH.z - 1.8, WASH.x + 2.6, WASH.z + 1.8);
  add({ k: 'laundry', x: WASH.x, z: WASH.z + 0.9, len: 3.6 });
  add({ k: 'qWashTub', x: WASH.x - 1.2, z: WASH.z - 0.5 });
  // ---- the yard east of the avenue behind the snack shop's tea corner (it stood bare): a neighbour's plot (houses of the next street from z 81)
  add({ k: 'qPlot', x: 22, z: 75.2, w: 19, d: 9, seed: 6062 });
  for (const [o, hw, hd] of [
    [{ k: 'laundry', x: 16.5, z: 76.2, len: 3.2 }, 1.8, 0.35], [{ k: 'qChilli', x: 13.4, z: 79.6, ry: 0.15, seed: 61 }, 1.3, 0.8],
    [{ k: 'qPots', x: 22.5, z: 72.6, len: 2.2, seed: 62 }, 1.3, 0.3], [{ k: 'hens', x: 30.5, z: 79.5, seed: 63 }, 0.9, 0.6],
    [{ k: 'qBanana', x: 12.4, z: 73.4, s: 1.05 }, 0.6, 0.6], [{ k: 'qBanana', x: 32.2, z: 75.6, s: 0.95 }, 0.6, 0.6],
    [{ k: 'qHammock', x: 21.6, z: 78.4 }, 1.4, 0.4], [{ k: 'qDrum', x: 26.2, z: 77.6 }, 0.55, 0.4], [{ k: 'bikes', x: 18.4, z: 73.2, ry: 0.2 }, 0.8, 0.35],
  ]) place(o, hw, hd);

  const r = rng(4417);
  const pick = (list) => list[Math.floor(r() * list.length) % list.length];
  // ---- yards: neighbours' plots side by side behind the street's south fence
  for (const zs of STREETS_Z) {
    const z0 = zs + ROAD_HALF + 0.8;
    for (let k = 0; k < STREETS_X.length - 1; k++) {
      const xa = STREETS_X[k] + ROAD_HALF + 1.2, xb = STREETS_X[k + 1] - ROAD_HALF - 1.2;
      const special = (zs === 90 && k === 1) || (zs === 118 && k === 3) || (zs === 62 && k === 2) || (zs === 118 && k === 1);
      // side fences along the north-south streets (bamboo or hedge), with a way in
      if (!special) for (const [sx, side] of [[xa - 0.3, 1], [xb + 0.3, -1]]) {
        const kind = r() < 0.6 ? 'qBamboo' : 'hedge';
        for (const [a, b] of [[z0 + 0.6, z0 + 4.6], [z0 + 6.2, z0 + 10.6]]) {
          if (zs === STREETS_Z.at(-1) && b > 158) continue;
          const len = b - a;
          place({ k: kind, x: sx, z: (a + b) / 2, len, ry: Math.PI / 2 * side, low: true }, kind === 'hedge' ? 0.35 : 0.1, len / 2, 0.05);
        }
      }
      if (special) continue;
      // plot lines: low bamboo dividers between neighbours (north-south), every 7-9 m
      const plots = [];
      let px = xa;
      while (px < xb - 4) {
        const pw = Math.min(xb - px, 6.5 + r() * 2.5);
        plots.push([px, px + pw]);
        px += pw;
        if (px < xb - 4 && r() < 0.75) place({ k: 'qBamboo', x: px, z: z0 + 4.4, len: 6.2, ry: Math.PI / 2, low: true }, 0.1, 3.1, 0.15);
      }
      for (const [p0, p1] of plots) {
        const cx = (p0 + p1) / 2, pw = p1 - p0;
        // the plot's swept earth and grass under everything (ground decal: no keep-out)
        add({ k: 'qPlot', x: cx, z: z0 + 5.6, w: pw - 0.7, d: 9.6, seed: Math.floor(r() * 1e5) });
        // near the fence: low things (pots, chillies drying, a pump, a drum, hens, a bicycle)
        for (let n = 0; n < 3; n++) {
          const x = p0 + 1.2 + r() * (pw - 2.4), z = z0 + 1.6 + r() * 3.4, w = r();
          if (w < 0.24) place({ k: 'qPots', x, z, len: 1.6 + r() * 1.2, seed: Math.floor(r() * 1e5) }, 1.2, 0.3);
          else if (w < 0.4) place({ k: 'qChilli', x, z, ry: (r() - 0.5) * 0.5, seed: Math.floor(r() * 1e5) }, 1.3, 0.8, 0.15);
          else if (w < 0.52) place({ k: 'qPump', x, z }, 0.55, 0.55);
          else if (w < 0.64) place({ k: 'qDrum', x, z }, 0.55, 0.4);
          else if (w < 0.76) place({ k: 'hens', x, z, seed: Math.floor(r() * 1e5) }, 0.9, 0.6);
          else if (w < 0.88) place({ k: 'bikes', x, z, ry: (r() - 0.5) * 0.4 }, 0.8, 0.35);
          else place({ k: 'flowers', x, z, seed: Math.floor(r() * 1e5) }, 0.6, 0.3);
        }
        // deeper in: bananas, a hammock, a wash line, a fruit tree (taller things, away from the street)
        for (let n = 0; n < 2; n++) {
          const x = p0 + 1.4 + r() * (pw - 2.8), z = z0 + 7.2 + r() * 4.5, w = r();
          if (w < 0.36) place({ k: 'qBanana', x, z, s: 0.9 + r() * 0.3 }, 0.6, 0.6);
          else if (w < 0.5) place({ k: 'qHammock', x, z }, 1.4, 0.4);
          else if (w < 0.66) place({ k: 'laundry', x, z, len: 3 + r() * 0.6 }, 1.8, 0.35);
          else if (w < 0.82) place({ k: r() < 0.5 ? 'padauk' : 'rain', x, z: z + 1, s: 0.9 + r() * 0.25 }, 0.9, 0.9);
          else place({ k: 'qPots', x, z, len: 2 + r(), seed: Math.floor(r() * 1e5) }, 1.3, 0.3);
        }
      }
      // the yard corners at the crossings: a bench or pots by the fence end
      for (const cx of [xa + 0.9, xb - 0.9]) {
        if (r() < 0.5) place({ k: 'qPots', x: cx, z: z0 + 1.0, len: 1.4, seed: Math.floor(r() * 1e5) }, 0.8, 0.3, 0.1);
      }
    }
  }
  // ---- the house fronts: what neighbours leave on the step (sandals, a pot, a stool), a bicycle now and then
  for (const it of ITEMS.slice()) {
    if (it.k !== 'house') continue;
    const fz = it.z + it.d / 2 + 0.42;
    for (let n = 0; n < 2; n++) {
      const x = it.x + (n ? 1 : -1) * (it.w * 0.18 + r() * it.w * 0.18);
      if (r() < 0.7) place({ k: 'qStoop', x, z: fz, seed: Math.floor(r() * 1e5) }, 0.45, 0.25, 0.05);
    }
    if (r() < 0.3) place({ k: 'bikes', x: it.x + (r() - 0.5) * it.w * 0.5, z: fz + 0.15, ry: 0 }, 0.75, 0.3, 0.05);
  }
  // ---- more shade: trees in the deep yards and along the side streets
  for (let n = 0; n < 40; n++) {
    const zs = pick(STREETS_Z.slice(0, -1)), x = REGION.rect[0] + 9 + r() * (REGION.rect[2] - REGION.rect[0] - 12), z = zs + 12 + r() * 4;
    place({ k: r() < 0.55 ? 'rain' : 'padauk', x, z, s: 0.9 + r() * 0.3 }, 1.0, 1.0, 0.4);
  }
}
placeLife();

// ---------------------------------------------------------------------------------
// The new kinds (drawn by build.js through region.js; g = outlined solids, f = the flat ground mesh)
// ---------------------------------------------------------------------------------
const W = { wood: '#A0642E', woodD: '#6B482B', woodL: '#CDA577', bamboo: '#D8BE7E', bambooD: '#B8964E', bambooP: '#9C7A3C', leaf: '#6FA04E', leafD: '#5E8F44', leafL: '#8DBA6E',
  terra: '#B5643C', terraL: '#CB7E4E', terraD: '#8E4A2C', earth: '#EBDDBF', grass: '#D5E2B4', grass2: '#C8DAA4', stone: '#D9CDB4', ink: '#2A2118', white: '#FFFDF8',
  red: '#C8323C', blue: '#2F5DB3', teal: '#2F7C7A', mustard: '#E2B33C', maroon: '#6E1F2A', shadow: '#E3D8BE', iron: '#4A3B30' };
function obBox(it, w, d, ox = 0, oz = 0) {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  const cx = it.x + ox * c + oz * s, cz = it.z - ox * s + oz * c;
  const hw = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hd = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  return { type: 'box', minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd };
}
const circ = (it, r, ox = 0, oz = 0) => {
  const c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  return { type: 'circle', x: it.x + ox * c + oz * s, z: it.z - ox * s + oz * c, r };
};

/** A neighbour's plot: swept earth, a couple of grass patches and a few stepping stones (ground only). */
function plot(g, f, it) {
  const r = rng(it.seed || 5), W2 = it.w / 2, D2 = it.d / 2;
  f.flat(-W2, -D2, W2, D2, 0.0042, W.earth);
  for (let n = 0; n < 3; n++) {
    const w = 1.4 + r() * 2.2, d = 1 + r() * 1.8;
    f.flatR(-W2 + w / 2 + r() * (it.w - w), -D2 + 2.5 + r() * (it.d - 3), w, d, 0.0046, n % 2 ? W.grass : W.grass2, (r() - 0.5) * 0.4);
  }
  // stepping stones from the back of the plot toward the fence
  const sx = (r() - 0.5) * (it.w - 2);
  for (let k = 0; k < 6; k++) f.box(sx + Math.sin(k * 1.3) * 0.3, 0.012, D2 - 0.6 - k * 1.1, 0.42, 0.024, 0.32, W.stone);
  for (let k = 0; k < 4; k++) {
    const x = (r() - 0.5) * (it.w - 1), z = (r() - 0.5) * (it.d - 1), h = 0.1 + r() * 0.12;
    f.box(x, h / 2, z, 0.2, h, 0.12, k % 2 ? W.leaf : W.leafL);
  }
}
function bamboo(g, f, it) {
  const L = it.len, H = it.low ? 0.8 : 1.0;
  const n = Math.max(1, Math.round(L / 1.6));
  for (let i = 0; i <= n; i++) g.box(-L / 2 + (L * i) / n, H / 2 + 0.06, 0, 0.1, H + 0.12, 0.1, W.bambooP);
  g.box(0, H * 0.5, 0, L, H * 0.8, 0.04, W.bamboo);
  for (const y of [H * 0.3, H * 0.66]) g.box(0, y, 0.03, L, 0.05, 0.02, W.bambooD);
  g.box(0, H + 0.02, 0, L, 0.06, 0.07, W.bambooD);
  f.flat(-L / 2, -0.14, L / 2, 0.3, 0.005, W.shadow);
}
function banana(g, f, it) {
  const s = it.s || 1;
  g.box(0, 0.7 * s, 0, 0.22, 1.4 * s, 0.22, '#8FA05A');
  g.box(0.32, 0.42 * s, 0.14, 0.15, 0.84 * s, 0.15, '#9AAB62');
  const cols = [W.leaf, W.leafD, W.leafL, W.leaf, W.leafD];
  for (let i = 0; i < 5; i++) {
    const a = i * 1.26 + 0.3, l = 1.25 * s;
    g.boxR(Math.cos(a) * l * 0.42, 1.42 * s + (i % 2) * 0.12, -Math.sin(a) * l * 0.42, l, 0.05, 0.4, cols[i], 0, a, -0.38);
  }
  g.box(0.18, 1.05 * s, 0.22, 0.13, 0.2, 0.13, '#7A3B5A'); // the purple bud
  f.flatR(0.1, 0.1, 2.2 * s, 1.8 * s, 0.005, W.shadow);
}
function potRow(g, f, it) {
  const r = rng(it.seed || 9), L = it.len || 2;
  const n = Math.max(2, Math.round(L / 0.45));
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + 0.22 + (i * (L - 0.44)) / Math.max(1, n - 1), h = 0.22 + r() * 0.14, big = r() < 0.3;
    g.box(x, h / 2, 0, big ? 0.3 : 0.24, h, big ? 0.3 : 0.24, [W.terra, W.terraL, W.terraD][i % 3]);
    const fl = r();
    f.box(x, h + 0.1, 0, 0.26, 0.18, 0.24, fl < 0.5 ? W.leaf : W.leafD);
    if (fl < 0.6) f.box(x + 0.04, h + 0.22, 0.02, 0.1, 0.08, 0.1, ['#F2A3B0', W.white, W.mustard, '#B9A3D6', W.red][Math.floor(r() * 5)]);
  }
  f.flat(-L / 2, -0.2, L / 2 + 0.1, 0.24, 0.005, W.shadow);
}
function chilliMat(g, f, it) {
  const r = rng(it.seed || 2);
  f.flatR(0, 0, 1.8, 1.2, 0.0055, '#D9C38A');
  f.flatR(0, 0, 1.6, 1.0, 0.006, '#E6D3A0');
  for (let k = 0; k < 16; k++) f.box((r() - 0.5) * 1.4, 0.02, (r() - 0.5) * 0.8, 0.12, 0.04, 0.06, k % 3 ? W.red : '#9E2028', r() * 3);
  // a winnowing tray of something yellow beside it, and a low stool
  f.box(1.25, 0.03, 0.15, 0.7, 0.05, 0.7, '#C9A86A');
  f.box(1.25, 0.06, 0.15, 0.5, 0.03, 0.5, W.mustard);
  g.box(-1.2, 0.12, 0.2, 0.32, 0.24, 0.32, W.blue);
}
function pump(g, f) {
  g.box(0, 0.1, 0, 0.9, 0.2, 0.9, '#CFC6B4');
  g.box(0, 0.62, -0.22, 0.18, 0.84, 0.18, '#2F6B4F');
  g.box(0, 0.88, -0.02, 0.08, 0.08, 0.34, '#2F6B4F');
  g.boxR(0, 1.12, -0.42, 0.06, 0.06, 0.62, '#2F6B4F', 0.55, 0, 0);
  g.box(0.05, 0.34, 0.16, 0.28, 0.28, 0.28, W.blue);
  f.flatR(0, 0.7, 1.3, 0.8, 0.0055, '#D6CFC0');
}
function waterDrum(g, f) {
  g.box(0, 0.42, 0, 0.52, 0.84, 0.52, W.blue);
  g.box(0, 0.86, 0, 0.56, 0.04, 0.56, '#24498E');
  g.box(0.48, 0.15, 0.1, 0.26, 0.3, 0.26, W.red); // bucket
  g.box(0.48, 0.32, 0.1, 0.02, 0.1, 0.24, W.ink);
  f.flatR(0.15, 0.15, 1.2, 0.9, 0.005, W.shadow);
}
function hammock(g, f) {
  for (const sx of [-1.3, 1.3]) g.box(sx, 0.85, 0, 0.12, 1.7, 0.12, W.woodD);
  g.box(0, 0.6, 0, 1.2, 0.06, 0.6, W.mustard);
  for (const sx of [-1, 1]) g.boxR(sx * 0.9, 0.86, 0, 0.75, 0.05, 0.55, W.mustard, 0, 0, sx * 0.55);
  for (const z of [-0.18, 0.18]) g.box(0, 0.64, z, 1.2, 0.02, 0.06, W.red);
  f.flatR(0, 0.3, 2.6, 1.0, 0.005, W.shadow);
}
function stoop(g, f, it) {
  const r = rng(it.seed || 4);
  // a pair of slippers left on the step, a pot of herbs, sometimes a little low stool
  const sc = [W.red, W.blue, W.ink, '#7A2533', W.teal][Math.floor(r() * 5)];
  for (const sx of [-0.08, 0.08]) f.box(sx - 0.2, 0.015, 0.05, 0.1, 0.03, 0.24, sc);
  if (r() < 0.7) { g.box(0.22, 0.14, -0.05, 0.24, 0.28, 0.24, W.terraL); f.box(0.22, 0.36, -0.05, 0.26, 0.18, 0.26, W.leafD); }
  if (r() < 0.35) g.box(-0.05, 0.12, -0.12, 0.3, 0.24, 0.3, [W.blue, W.red][Math.floor(r() * 2)]);
}
function chinlone(g, f) {
  // a swept ring of beaten earth where the children keep the ball up (no keep-out: they play in it)
  for (const a of [0, 0.39, 0.78, 1.18]) f.flatR(0, 0, 3.6, 3.6, 0.0044, '#E9D6AF', a);
  for (const a of [0, 0.39, 0.78, 1.18]) f.flatR(0, 0, 2.9, 2.9, 0.0048, '#EFE0BF', a);
  for (const [x, z, c] of [[2.1, 1.3, W.blue], [-2.2, 1.0, W.red], [1.6, -1.9, W.ink]]) for (const s of [-0.07, 0.07]) f.box(x + s, 0.015, z, 0.1, 0.03, 0.24, c);
  g.box(2.5, 0.08, -0.6, 0.15, 0.15, 0.15, '#C9A24A'); // the spare ball
  g.box(2.5, 0.08, -0.6, 0.165, 0.04, 0.165, '#9C7A32');
}
function washTub(g, f) {
  g.box(0, 0.16, 0, 0.9, 0.32, 0.9, '#8E8A84'); // a wide tin basin
  g.box(0, 0.3, 0, 0.78, 0.04, 0.78, '#BFD3E0');
  g.box(-0.1, 0.34, 0.1, 0.36, 0.08, 0.26, '#9CC3DE');
  g.box(0.18, 0.35, -0.12, 0.3, 0.07, 0.22, '#E8A0A8');
  g.box(0.85, 0.12, 0.1, 0.32, 0.24, 0.32, W.red); // her stool
  g.box(-0.8, 0.13, -0.1, 0.5, 0.26, 0.4, '#C9A86A'); // a basket of wrung clothes
  g.box(-0.8, 0.28, -0.1, 0.4, 0.06, 0.3, '#FFFDF8');
  f.flatR(0.1, 0.3, 2.2, 1.4, 0.0055, '#D6CFC0'); // wet earth
}
function bikeShop(g, f) {
  f.flatR(0, 0, 3.6, 2.2, 0.0055, '#DCCFB1');
  // a bicycle upside down on its seat and bars, wheels in the air
  const wheel = (x) => { for (const [w, h] of [[0.62, 0.06], [0.06, 0.62]]) g.box(x, 0.66, -0.1, w, h, 0.04, W.ink); g.box(x, 0.66, -0.1, 0.44, 0.44, 0.02, '#8E8173'); };
  wheel(-0.98); wheel(-0.02);
  g.box(-0.5, 0.38, -0.1, 0.7, 0.05, 0.05, W.teal);
  g.box(-0.62, 0.22, -0.1, 0.05, 0.32, 0.05, W.teal);
  g.box(-0.62, 0.05, -0.1, 0.24, 0.06, 0.12, W.ink); // the seat on the ground
  g.box(-0.08, 0.08, -0.1, 0.05, 0.05, 0.42, W.ink); // the bars on the ground
  // a tyre hung on a post, a toolbox, a bicycle waiting its turn
  g.box(1.45, 0.8, -0.5, 0.1, 1.6, 0.1, W.woodD);
  for (const [x, y, w, h] of [[1.45, 1.52, 0.5, 0.07], [1.45, 1.08, 0.5, 0.07], [1.22, 1.3, 0.07, 0.5], [1.68, 1.3, 0.07, 0.5]]) g.box(x, y, -0.44, w, h, 0.07, W.ink);
  g.box(0.75, 0.12, 0.55, 0.5, 0.24, 0.28, W.red);
  g.box(0.75, 0.26, 0.55, 0.16, 0.04, 0.06, W.ink);
  for (const [x, c] of [[0.6, '#B9B6B0'], [0.86, W.mustard]]) f.box(x, 0.02, 0.15, 0.2, 0.03, 0.05, c); // spanners
  g.box(1.15, 0.2, 0.25, 0.08, 0.4, 0.08, '#2F6B4F'); // the foot pump
  g.box(1.15, 0.42, 0.25, 0.22, 0.04, 0.04, W.ink);
}
/** Ko Zaw's tea stall: a counter under a striped awning, a kettle on a charcoal stove, low tables and stools. */
function teaStall(g, f) {
  f.flatR(0, 0.4, 4.6, 4.2, 0.0055, '#DCCFB1');
  // the counter (Ko Zaw stands behind it, facing the stools)
  g.box(0, 0.45, -0.6, 2.2, 0.9, 0.6, W.wood);
  g.box(0, 0.93, -0.6, 2.36, 0.06, 0.72, W.woodL);
  g.box(0, 0.55, -0.29, 2.1, 0.18, 0.02, W.maroon);
  g.box(-0.72, 1.07, -0.66, 0.36, 0.22, 0.36, W.iron); // charcoal stove
  g.box(-0.72, 1.29, -0.66, 0.26, 0.22, 0.26, '#C9C2B4'); // kettle
  g.box(-0.54, 1.32, -0.66, 0.14, 0.05, 0.05, '#C9C2B4');
  g.box(-0.72, 1.43, -0.66, 0.08, 0.05, 0.08, W.ink);
  for (const x of [0.05, 0.38, 0.71]) { g.box(x, 1.08, -0.62, 0.22, 0.24, 0.22, '#BFD3E0'); g.box(x, 1.22, -0.62, 0.24, 0.04, 0.24, W.mustard); }
  for (const x of [-0.25, -0.1]) g.box(x, 1.0, -0.42, 0.08, 0.08, 0.08, W.white); // cups
  // four poles and a striped awning
  for (const [x, z] of [[-1.3, -1.7], [1.3, -1.7], [-1.3, 1.0], [1.3, 1.0]]) g.box(x, 1.2, z, 0.1, 2.4, 0.1, W.woodD);
  g.boxR(0, 2.42, -0.35, 2.9, 0.06, 3.0, W.red, 0.1, 0, 0);
  for (const x of [-0.95, 0, 0.95]) g.boxR(x, 2.45, -0.35, 0.36, 0.02, 3.0, W.white, 0.1, 0, 0);
  g.box(0, 2.2, 1.18, 2.9, 0.2, 0.04, W.red);
  // two low tables with tiny stools
  for (const [tx, tz] of [[-0.85, 1.55], [0.95, 1.7]]) {
    g.box(tx, 0.32, tz, 0.7, 0.05, 0.5, W.woodL);
    g.box(tx, 0.15, tz, 0.5, 0.3, 0.3, W.woodD);
    for (const [sx, sz, c] of [[-0.55, 0.05, W.blue], [0.55, -0.05, W.red], [0, 0.48, W.teal]]) g.box(tx + sx, 0.12, tz + sz, 0.26, 0.24, 0.26, c);
    g.box(tx + 0.1, 0.4, tz, 0.08, 0.1, 0.08, W.white);
    g.box(tx - 0.15, 0.39, tz + 0.05, 0.12, 0.08, 0.12, '#E8B832'); // a plate of something fried
  }
}

export const PROP = {
  qPlot: { draw: plot, obstacles: () => [] },
  qChinlone: { draw: chinlone, obstacles: () => [] },
  qChilli: { draw: chilliMat, obstacles: () => [] },
  qBamboo: { draw: bamboo, obstacles: (it) => [obBox(it, it.len, 0.16)] },
  qBanana: { draw: banana, obstacles: (it) => [circ(it, 0.32 * (it.s || 1))] },
  qPots: { draw: potRow, obstacles: (it) => [obBox(it, (it.len || 2) + 0.1, 0.36)] },
  qPump: { draw: pump, obstacles: (it) => [circ(it, 0.48)] },
  qDrum: { draw: waterDrum, obstacles: (it) => [circ(it, 0.32), circ(it, 0.16, 0.48, 0.1)] },
  qHammock: { draw: hammock, obstacles: (it) => [obBox(it, 2.8, 0.6)] },
  qStoop: { draw: stoop, obstacles: (it) => [circ(it, 0.22, 0.15, -0.05)] },
  qWashTub: { draw: washTub, obstacles: (it) => [obBox(it, 2.1, 0.9)] },
  qBikeShop: { draw: bikeShop, obstacles: (it) => [obBox(it, 1.4, 0.5, -0.5, -0.1), circ(it, 0.12, 1.45, -0.5), obBox(it, 0.6, 0.4, 0.75, 0.55)] },
};
export const ART = {
  // tall enough to stand between the camera and Maya: the cutaway may fade it
  qTeaStall: { draw: teaStall, h: 2.6, obstacles: (it) => [obBox(it, 2.4, 0.8, 0, -0.6), circ(it, 0.5, -0.85, 1.55), circ(it, 0.5, 0.95, 1.7), circ(it, 0.08, -1.3, 1.0), circ(it, 0.08, 1.3, 1.0), circ(it, 0.08, -1.3, -1.7), circ(it, 0.08, 1.3, -1.7)] },
};

// ---------------------------------------------------------------------------------
// Bookmark Desks (GAME-PLAN 4.6). ry turns the desk; the ribbon lies beside it.
// ---------------------------------------------------------------------------------
export const DESKS = [
  { id: 'gate', name: { my: 'ဗလာစာအုပ်ရပ် အဝင်', en: 'Quarter gate' }, x: 7.9, z: 47.2, ry: 0 },
  { id: 'stage', name: { my: 'စင်မြင့်လေးဘေး', en: 'By the little stage' }, x: -29.6, z: 149.6, ry: 0 },
];

// ---------------------------------------------------------------------------------
// Ambient townspeople of the Quarter (appear when their chunk is built). A short hello only.
// job: see story.setJob ({ area: { x, z, r }, spot: { x, z, h }, mood, workChance })
// ---------------------------------------------------------------------------------
export const PEOPLE = [
  { id: 'dawohn', x: 15.6, z: 60.5, heading: 0, hello: { my: 'မုန့်ဟင်းခါး ပူပူလေး ရှိတယ်နော် သမီး။', en: 'Hot mohinga today, dear.' },
    job: { area: { x: 15, z: 65.8, r: 2.6 }, spot: { x: 14.2, z: 60.3, h: 0 }, mood: 'work', workChance: 0.7, workFor: [6, 12] } },
  { id: 'hninwai', x: -11.5, z: 88.4, heading: 0, hello: { my: 'ကလေးတွေ ဒီနေ့ အရမ်းဆော့ကြတယ်။', en: 'The children are very lively today.' },
    job: { area: { x: -12, z: 94.6, r: 3.6 }, spot: { x: -12.5, z: 93.4, h: Math.PI }, mood: 'read', workChance: 0.5, workFor: [5, 9] } },
  { id: 'toetoe', x: -17.5, z: 97.6, heading: 0, hello: { my: 'အစ်မ၊ ဒန်းစီးမလား။', en: 'Want a go on the swing, sister?' },
    job: { area: { x: -12, z: 97.4, r: 5 }, spot: { x: -19, z: 97.6, h: 0 }, mood: 'play', workChance: 0.6, speed: 1.2 } },
  { id: 'sunwe', x: -4.5, z: 99.6, heading: -0.4, hello: { my: 'စာမေးပွဲ နီးလာပြီ။ စိုးရိမ်တယ်။', en: 'Exams are coming. I am nervous.' },
    job: { area: { x: -6, z: 100, r: 3 }, spot: { x: -3.2, z: 99.8, h: -0.6 }, mood: 'read', workChance: 0.6, workFor: [6, 10] } },
  { id: 'micho', x: 47, z: 121, heading: 0, hello: { my: 'ဒီအိုးတွေ နေပူထဲ ခြောက်နေတာ။ မထိနဲ့နော်။', en: "These pots are drying in the sun. Don't touch!" },
    job: { area: { x: 51, z: 126.4, r: 4 }, spot: { x: 48.4, z: 120.9, h: 0 }, mood: 'work', workChance: 0.6, workFor: [6, 12] } },
  { id: 'maungnge', x: -13, z: 142.8, heading: 0, hello: { my: 'ညနေ ဇာတ်ပွဲ ရှိမယ်တဲ့။', en: "They say there's a show this evening." },
    job: { area: { x: -13, z: 142.6, r: 3.4 }, spot: { x: -12, z: 142.2, h: 0 }, mood: 'play', workChance: 0.45, speed: 1.1 } },
  // the neighbours at their daily work (polish pass): a hello each, a small lesson of the Quarter in it
  { id: 'dawmyint', x: WASH.x + 0.3, z: WASH.z + 0.1, heading: 0, hello: { my: 'နေပူတုန်း လျှော်ထားရတယ်။ မနက်ဖြန် နေပူမယ်လို့ ဘယ်သူ ပြောနိုင်လဲ။', en: "Wash while the sun's out. Who can promise tomorrow's sun?" },
    job: { area: { x: WASH.x, z: WASH.z, r: 2 }, spot: { x: WASH.x + 0.3, z: WASH.z + 0.1, h: 0 }, mood: 'work', workChance: 0.75, workFor: [8, 16], speed: 0.8 } },
  { id: 'ukhin', x: MENDER.x - 0.5, z: MENDER.z + 0.55, heading: Math.PI, hello: { my: 'ပျက်တာ မဟုတ်ဘူး သမီး။ မပြင်ရသေးတာပဲ ရှိတယ်။', en: "It isn't broken, dear. It just isn't mended yet." },
    job: { area: { x: MENDER.x, z: MENDER.z + 1.2, r: 1.6 }, spot: { x: MENDER.x - 0.5, z: MENDER.z + 0.55, h: Math.PI }, mood: 'work', workChance: 0.8, workFor: [10, 20], speed: 0.6 } },
  { id: 'kozaw', x: TEA.x, z: TEA.z - 1.2, heading: 0, hello: { my: 'သောက်ရုံ မသောက်နဲ့ဦး။ လက်ဖက်ရည် ဘယ်လို ဖျော်လဲ မေးကြည့်ပါ။', en: "Don't just drink it. Ask how the tea is made." },
    job: { area: { x: TEA.x, z: TEA.z - 1.25, r: 0.8 }, spot: { x: TEA.x - 0.4, z: TEA.z - 1.2, h: 0 }, mood: 'work', workChance: 0.85, workFor: [10, 20], speed: 0.7 } },
  { id: 'dawthein', x: -45, z: 88.1, heading: Math.PI / 2, hello: { my: 'မြေးလေးက စာဖတ်တာ နှေးတယ်။ တံမြက်စည်းက အရွက်ကြွေတာ စောင့်သလို ငါလည်း စောင့်ပေးတာပေါ့။', en: 'My grandson reads slowly. So I wait for him, the way a broom waits for the leaves.' },
    job: { area: { x: -45, z: 88.1, r: 3.2 }, spot: { x: -44, z: 88.1, h: Math.PI / 2 }, mood: 'sweep', workChance: 0.7, workFor: [8, 14], speed: 0.55 } },
  ...[['aungaung', -15.7, 70.0, { my: 'အစ်မ၊ ဆယ်ခါ ဆက်တိုက် ခတ်နိုင်ပြီ။ အရင်က တစ်ခါတောင် မမိဘူး။', en: "Ten in a row now, sister! I couldn't keep it up once before." }],
    ['thetpaing', -13.3, 69.9, { my: 'ကျသွားရင် ပြန်ကောက်ပြီး ထပ်ခတ်ရုံပဲ။', en: 'If it drops, you pick it up and kick again.' }],
    ['mayzin', -14.4, 71.9, { my: 'နေ့တိုင်း လေ့ကျင့်တယ်။ ဒါကြောင့် ကောင်လေးတွေထက် တော်တာ။', en: "I practise every day. That's why I'm better than the boys." }],
  ].map(([id, x, z, hello]) => {
    const h = Math.atan2(CHINLONE.x - x, CHINLONE.z - z); // facing the ball in the middle
    return { id, x, z, heading: h, hello, job: { area: { x, z, r: 0.9 }, spot: { x, z, h }, mood: 'kick', workChance: 0.92, workFor: [20, 40], speed: 0.8 } };
  }),
];
