// District 3 · Ledger Wharf (opens Day 5; Days 5, 6, 14, 15): a riverside town on ledger paper (cream, ruled
// in red and blue columns) on the cloud-stream's west bank. day5-spec 1.2, day6-spec 1, INDEX 7 / 13 / 14.
// Region file format: regions/index.js. Art: ../art/wharf.js (buildings, jetties, boats, quay) and
// ./wharf-props.js (street-name boards, hawkers, planks, baskets, the hand scale); people: ./wharf-folk.js.
//
// STREET PLAN (+X east, +Z south; fronts face +Z, the street camera; only low things south of a street)
//
//   z 378  the Market's south lane comes down (mSouth, x 7) past the district's ledger-book name board
//   z 404  wBend: the lane turns east and slopes down to the quay (the Lane row: rope shop, houses, tinware,
//          the quay godown on its north side; gardens and wash lines on its south side)
//   x 62   the quay road (wHead z 424 -> wQuayM z 448 -> wQuayS z 482); EAST of it the quay itself, planks to the
//          water's edge (x 79): THE WEIGH-HOUSE (north end, door south), desk wharfHead, the tea stall, the hand
//          crane, sacks, fish racks, the pump, DAW SANDA'S STILT HOUSE at the head of Little Jetty, the boatwright,
//          Wa Wa's ducks at the south end. Six jetties out over the clouds (Big 431 · Rice 441 · Fish 450 ·
//          Wood 459 · Little 467 · Jetty End 476). WEST of it, godowns facing the quay
//   z 448  Godown Row (x -52 .. 62): houses on stilts, godowns and shops on its north side
//   x 16   Net Lane (wBend -> Godown Row -> Rope Walk): yards, fences, wash lines
//   z 482  Rope Walk (x -34 .. 62): houses on its north side; boats on blocks, net racks and fish racks on the
//          south side down to the page's edge (z 498)
//   water  across the side channel south of Jetty End: the sandbar with Duck Jetty, Cane Jetty, U Bo Lay's
//          post and his CANE SHED (by raft only: no walking door). The east bank: a folded page in the mist
//
// Doors (doors.js): weighhouse, sandahouse. (caneshed is entered from the raft by the day script; bridgehut is a
// Junction building: its room is in rooms/wharf.js, its door and shell belong to the Junction region.)
// Desks: wharfHead, wharfEnd. Day scripts own the moving things: the ferry, Ko Thiha's raft, the story people.
import { rng } from '../kit.js';
import { WHARF_ART, WHARF_PROP } from '../art/wharf.js';
import { WHARF_EXTRA_PROP } from './wharf-props.js';
import { FOLK_PEOPLE } from './wharf-folk.js';
import { WHARF_YARD_PROP, fillBand, spaceOf } from './wharf-yards.js';

const PI = Math.PI;

// ---------------------------------------------------------------------------------
// Kinds. The Wharf's art shares a few names with the Market's (sacks, crates, trishaw, pump, cat, dog): those are
// registered here under w-names, so the Market's own keep their look (kinds are global across districts).
// ---------------------------------------------------------------------------------
const RENAME = { sacks: 'wSacks', crates: 'wCrates', trishaw: 'wTrishaw', pump: 'wPump', cat: 'wCat', dog: 'wDog' };
export const ART = { ...WHARF_ART };
export const PROP = { ...WHARF_EXTRA_PROP, ...WHARF_YARD_PROP };
for (const [k, v] of Object.entries(WHARF_PROP)) PROP[RENAME[k] || k] = v;
// Live twins (like regions/junction.js): an item with `live: '<name>'` is not drawn while a day stands its own
// animated twin there (useLive below); its keep-out stays. Day 6: Maung Nge's cart (props3 parcelCart).
const LIVE = new Set();
for (const k of ['handCart']) if (PROP[k]?.draw) { const d = PROP[k]; PROP[k] = { ...d, draw: (g, f, it, ctx) => (it.live && LIVE.has(it.live) ? undefined : d.draw(g, f, it, ctx)) }; }
/** useLive(ow, ['parcelCart'], true): the static one vanishes (keep-out stays); false: back. */
export function useLive(ow, names, on = true) {
  let changed = false;
  for (const n of [].concat(names || [])) {
    if (on && !LIVE.has(n)) { LIVE.add(n); changed = true; }
    if (!on && LIVE.has(n)) { LIVE.delete(n); changed = true; }
  }
  if (changed) try { ow?.streamer?.refresh?.(REGION.rect[0], REGION.rect[1], REGION.rect[2], REGION.rect[3]); } catch (e) { console.warn('wharf useLive', e); }
  return changed;
}

// ---------------------------------------------------------------------------------
// The land, the jetties (walkable decks out over the clouds), the roads
// ---------------------------------------------------------------------------------
const JETTIES = [
  // [z, tip x, deck width, name, cargo, lamp]   (from the quay's edge x 77 out over the stream; Big Jetty first)
  [431, 97, 2.2, { my: 'ဆိပ်ကြီး', en: 'Big Jetty' }, 'crates', true],
  [441, 91, 1.8, { my: 'ဆန်ဆိပ်', en: 'Rice Jetty' }, 'sacks', false],
  [450, 92, 1.8, { my: 'ငါးဆိပ်', en: 'Fish Jetty' }, 'fish', false],
  [459, 90, 1.8, { my: 'ထင်းဆိပ်', en: 'Wood Jetty' }, 'firewood', false],
  [467, 88, 1.6, { my: 'ဆိပ်ငယ်', en: 'Little Jetty' }, null, false],
  [476, 99, 2.2, { my: 'ဆိပ်ခြေ', en: 'Jetty End' }, null, true],
];
const QUAY = 77; // the jetties start on the quay, a little inside the paper's edge (x 79)

export const REGION = {
  id: 'wharf', name: { my: 'စာရင်းစာအုပ်ဆိပ်', en: 'Ledger Wharf' }, rect: [-71, 378, 79, 498], paper: 'ledger', label: [-30, 392],
  walk: [...JETTIES.map(([z, tip, w]) => [QUAY, z - w / 2, tip, z + w / 2]), [92, 471.5, 99.5, 480.5]], // (Jetty End's tip is a wider platform)
};

const LANE1 = [[7, 378], [8, 392], [16, 404]];
const LANE2 = [[16, 404], [32, 414], [48, 420], [62, 424]];
const ROW_Z = 448, ROPE_Z = 482, NET_X = 16, QUAY_X = 62, WELL_Z = 422;
export const STREETS = { lane1: LANE1, lane2: LANE2, row: ROW_Z, rope: ROPE_Z, net: NET_X, quay: QUAY_X, well: WELL_Z };

export const ROAD_NODES = [
  { id: 'wBend', x: 16, z: 404 },
  { id: 'wHead', x: QUAY_X, z: 424 },
  { id: 'wQuayM', x: QUAY_X, z: ROW_Z },
  { id: 'wQuayS', x: QUAY_X, z: ROPE_Z },
  { id: 'wRowX', x: NET_X, z: ROW_Z },
  { id: 'wRowW', x: -52, z: ROW_Z },
  { id: 'wSouthX', x: NET_X, z: ROPE_Z },
  { id: 'wSouthW', x: -34, z: ROPE_Z },
  { id: 'wNetM', x: NET_X, z: WELL_Z },
  { id: 'wWellW', x: -50, z: WELL_Z },
];
const EW = { sample: 0.5, bias: 0.003 }; // east-west streets win where they cross
export const ROAD_EDGES = [
  { id: 'wLane', a: 'mSouth', b: 'wBend', pts: LANE1, sample: 0.5 },
  { id: 'wLane2', a: 'wBend', b: 'wHead', pts: LANE2, sample: 0.5 },
  { id: 'wQuay', a: 'wHead', b: 'wQuayM', sample: 0.5 },
  { id: 'wQuay2', a: 'wQuayM', b: 'wQuayS', sample: 0.5 },
  { id: 'wRowE', a: 'wRowX', b: 'wQuayM', ...EW },
  { id: 'wRowW', a: 'wRowW', b: 'wRowX', ...EW },
  { id: 'wNet', a: 'wBend', b: 'wNetM', sample: 0.5 },
  { id: 'wNetB', a: 'wNetM', b: 'wRowX', sample: 0.5 },
  { id: 'wWell', a: 'wWellW', b: 'wNetM', ...EW },
  { id: 'wNet2', a: 'wRowX', b: 'wSouthX', sample: 0.5 },
  { id: 'wRope', a: 'wSouthX', b: 'wQuayS', ...EW },
  { id: 'wRopeW', a: 'wSouthW', b: 'wSouthX', ...EW },
];

/** z of the sloping lane (LANE2) at x; x of the first lane (LANE1) at z. */
function along(pts, t, ia, ib) {
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1];
    if (t >= Math.min(a[ia], b[ia]) && t <= Math.max(a[ia], b[ia])) return a[ib] + ((t - a[ia]) / (b[ia] - a[ia] || 1)) * (b[ib] - a[ib]);
  }
  return t < pts[0][ia] ? pts[0][ib] : pts[pts.length - 1][ib];
}
const laneZ = (x) => along(LANE2, x, 0, 1);
const lane1X = (z) => along(LANE1, z, 1, 0);

// ---------------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------------
export const ITEMS = [];
const add = (o) => (ITEMS.push(o), o);
const ROAD_HALF = 1.2, PATH = 0.6; // half a street, then a footpath before the fronts
const FRONT = { wStilt: 2.3, wShop: 1.2, wGodown: 2.0 }; // how far each kind's veranda / awning / platform reaches past its wall
let seedN = 300;
/** A building on the north side of an east-west street at roadZ (front south). xa = its west end. */
function north(k, xa, w, d, roadZ, o = {}) {
  return add({ k, x: xa + w / 2, z: roadZ - ROAD_HALF - PATH - FRONT[k] - d / 2, w, d, ry: 0, seed: seedN++, ...o });
}
/** A building on the west side of a north-south street at roadX (front east). za = its north end. */
function westOf(k, za, w, d, roadX, o = {}) {
  return add({ k, x: roadX - ROAD_HALF - PATH - FRONT[k] - d / 2, z: za + w / 2, w, d, ry: PI / 2, seed: seedN++, ...o });
}

// ---- the jetties, and their cargo boats (the ferry and Ko Thiha's raft are the days' own)
JETTIES.forEach(([z, tip, w, name, cargo, lamp], i) => {
  add({ k: 'wJetty', x: (QUAY + tip) / 2, z, len: tip - QUAY, w, name, cargo, lamp, end: i === JETTIES.length - 1 });
  add({ k: 'wMapMark', x: (QUAY + tip) / 2, z, w: tip - QUAY, d: w });
});
add({ k: 'boat', kind: 'raft', x: 85.6, z: 443.5, len: 4.4 });               // a rice raft moored on Rice Jetty's south side
add({ k: 'boat', kind: 'sampan', x: 86.8, z: 447.9, len: 4.2, seed: 2 });     // a sampan on Fish Jetty's north side
add({ k: 'boat', kind: 'sampan', x: 84.2, z: 461.3, len: 3.8, seed: 5, col: '#8FA5A0' }); // Wood Jetty
add({ k: 'boat', kind: 'sampan', x: 88.6, z: 456.7, len: 4.0, seed: 3, col: '#B9A486' });

// ---- the stream: low cloud the boats float on (soft, no outlines), in tiles so each streams with its own chunk
for (let x = 79; x < 119; x += 20) for (let z = 380; z < 500; z += 20) {
  add({ k: 'cloudWater', x: x + 10, z: z + 10, w: 20, d: 20, seed: Math.round(x * 7 + z), kind: x < 99 && z >= 480 ? 'side' : undefined });
}
// the east bank: a tall page still folded in the mist, beyond the deep channel (nothing to land on)
add({ k: 'mistBank', x: 126, z: 440, len: 118, h: 9, seed: 21 });

// ---- the quay: planks from the quay road's kerb (x 64.2) to the edge, a kerb with bollards, broken at each jetty's mouth
const DECK_X = 71.6, DECK_W = 14.8;
{
  const gaps = JETTIES.map(([z, , w]) => [z - w / 2 - 0.3, z + w / 2 + 0.3]);
  let z0 = 417;
  for (const [a, b] of [...gaps, [484, 484]]) {
    if (a - z0 > 0.6) add({ k: 'quayDeck', x: DECK_X, z: (z0 + a) / 2, w: DECK_W, d: a - z0, seed: Math.round(a), bollards: 6.5 });
    if (b > a) add({ k: 'quayDeck', x: DECK_X, z: (a + b) / 2, w: DECK_W, d: b - a, kerb: false, seed: Math.round(b) });
    z0 = b;
  }
}

// ---- THE WEIGH-HOUSE (room `weighhouse`): the quay's north end, its wide loading door south onto the quay head
export const WEIGH = { x: 66.5, z: 412.0, w: 7.0, d: 5.6 };
add({ k: 'weighHouse', ...WEIGH });
// outside it: Maung Nge's hand cart and the parcels the ferry turned away (Day 6's places), the public hand scale
add({ k: 'handCart', x: 63.0, z: 417.7, ry: 0, live: 'parcelCart' });
add({ k: 'parcelPile', x: 61.0, z: 416.2, seed: 6 });
add({ k: 'wHandScale', x: 70.9, z: 415.6, ry: -0.3 });
add({ k: 'wTally', x: 61.2, z: 413.0, ry: 0.3, seed: 4 });
add({ k: 'wSacks', x: 60.3, z: 410.6, n: 8, tarp: true, seed: 12 });
// the tea stall on the quay head, the hand crane by Big Jetty
add({ k: 'teaHut', x: 69.6, z: 424.6, w: 4.2, d: 2.4 });
add({ k: 'derrick', x: 75.6, z: 435.6, ry: 0 });
// along the quay (the walking line x 63.5 .. 70 stays clear)
for (const [k, x, z, o] of [
  ['wCrates', 73.4, 428.4, { seed: 4 }], ['wDrums', 76.2, 427.0, { seed: 1 }], ['ropeCoil', 74.6, 433.1, {}],
  ['wSacks', 71.0, 437.2, { n: 7, seed: 3 }], ['netRack', 73.6, 445.7, { len: 3.2 }], ['ropeCoil', 76.4, 448.0, { r: 0.3 }],
  ['fishRack', 69.6, 452.7, { len: 2.6 }], ['fishRack', 72.6, 454.6, { len: 2.4 }], ['wBaskets', 75.8, 452.9, { seed: 7 }],
  ['woodpile', 75.2, 456.3, {}], ['wPump', 66.4, 459.8, {}], ['wCrateBench', 67.6, 446.7, { ry: 0 }],
  ['ropeCoil', 75.0, 470.6, {}], ['wDrums', 76.4, 472.3, { seed: 2 }], ['bench', 67.4, 471.4, { ry: 0 }],
  ['boatBlocks', 69.0, 478.6, { len: 4.2 }], ['wPlanks', 72.8, 481.4, { len: 3.4 }], ['wCrates', 76.0, 482.6, { seed: 9, drum: false }],
  ['wCat', 73.3, 428.9, {}], ['wDog', 64.2, 463.0, { ry: 0.6 }],
]) add({ k, x, z, ...o });
for (const z of [421, 437, 452, 466, 483]) add({ k: 'lamp', x: 64.6, z });

// ---- DAW SANDA'S STILT HOUSE (room `sandahouse`): at the head of Little Jetty, up five steps facing the quay
export const SANDA = { x: 72.8, z: 462.9, w: 3.6, d: 3.2, doorX: 0 };
add({ k: 'sandaHouse', ...SANDA });

// ---- the south end of the quay: Wa Wa's ducks in their pen, the duck hut, the boatwright's corner
add({ k: 'duckHut', x: 71.6, z: 491.6, w: 3.0, d: 2.4 });
add({ k: 'bambooFence', x: 67.4, z: 493.2, len: 4.0 });
add({ k: 'bambooFence', x: 65.4, z: 491.2, len: 4.0, ry: PI / 2 });
add({ k: 'ducks', x: 67.6, z: 491.2, n: 6, w: 3.0, d: 2.6, seed: 4 });
add({ k: 'banana', x: 75.6, z: 494.6, seed: 4 });
add({ k: 'palm', x: 64.2, z: 496.0, s: 0.95 });

// ---- across the side channel: the sandbar (Day 6's places: post 85.0/488.7, shed 87.4/490.9), by raft only
export const SANDBAR = { x: 86.0, z: 491.0, w: 13.4, d: 5.6 };
add({ k: 'sandbar', ...SANDBAR, seed: 31 });
add({ k: 'wMapMark', x: SANDBAR.x, z: SANDBAR.z, w: SANDBAR.w, d: SANDBAR.d });
add({ k: 'caneShed', x: 87.4, z: 490.9, w: 3.6, d: 2.8, ry: PI, doorX: 0.5 }); // its doorway looks north, across the channel
add({ k: 'wJetty', x: 85.3, z: 486.7, len: 3.0, w: 1.5, low: true, ry: PI / 2, name: { my: 'ကြိမ်ဆိပ်', en: 'Cane Jetty' }, cargo: null });
add({ k: 'oldPost', x: 85.0, z: 488.7 });
add({ k: 'caneRack', x: 90.6, z: 491.6, ry: -PI / 2 });
add({ k: 'caneBundles', x: 84.4, z: 492.6, ry: 0.15, n: 6 });
add({ k: 'wJetty', x: 81.4, z: 487.3, len: 2.6, w: 1.4, low: true, ry: PI / 2, name: { my: 'ဘဲဆိပ်', en: 'Duck Jetty' }, cargo: null });
add({ k: 'ducks', x: 81.6, z: 490.6, n: 7, w: 2.6, d: 2.0, seed: 9 });
add({ k: 'duckHut', x: 81.2, z: 492.8, w: 2.6, d: 2.0 });

// ---- the Lane row: the slope down from the Market to the quay (north side)
north('wShop', 19.0, 6.0, 6.4, laneZ(19.0), { goods: 'rope', awning: '#4E8C86', label: { my: 'ကြိုး · ပိုက်ကွန်', en: 'Rope & nets' } });
north('wStilt', 27.0, 6.4, 5.0, laneZ(27.0));
north('wShop', 35.5, 6.0, 6.4, laneZ(35.5), { goods: 'tin', label: { my: 'သံဖြူ ပစ္စည်း', en: 'Tinware' } });
north('wStilt', 43.5, 6.0, 5.0, laneZ(43.5), { roof: 'thatch' });
north('wGodown', 51.5, 7.0, 8.0, laneZ(51.5), { door: '#4E8C86' });
// the first lane's west side (facing the lane), and the district's name board at its foot
{
  const za = 393.0, w = 6.0, d = 5.0;
  add({ k: 'wStilt', x: lane1X(za) - ROAD_HALF - PATH - FRONT.wStilt - d / 2, z: za + w / 2, w, d, ry: PI / 2, seed: seedN++ });
  add({ k: 'ledgerSign', x: 2.4, z: 386.6, ry: 0.25 });
  add({ k: 'wTrishaw', x: 4.6, z: 390.6, ry: -0.35, col: '#4E8C86' });
  add({ k: 'lamp', x: 5.9, z: 383.2 });
  add({ k: 'palm', x: -1.6, z: 381.0, s: 1.05 });
  add({ k: 'banana', x: 0.6, z: 391.6, seed: 2 });
}
// lane row gaps, kerbs and the lane's open south side
for (const [k, x, z, o] of [
  ['lamp', 26.0, laneZ(26) - 1.75, {}], ['wTinPlants', 33.2, laneZ(33.2) - 2.2, { n: 3, seed: 5 }], ['lamp', 42.4, laneZ(42.4) - 1.75, {}],
  ['wUmbrella', 49.8, laneZ(49.8) - 2.6, { seed: 2 }], ['bikes', 24.0, laneZ(24) - 1.95, {}], ['wBaskets', 40.8, laneZ(40.8) - 2.1, { seed: 3 }],
  ['jars', 12.4, 395.0, {}], ['palm', 12.0, 386.0, { s: 1.0 }], ['teaSet', 11.6, 390.4, {}], ['rain', 26.0, 392.0, { s: 1.15 }],
  ['palm', 41.0, 400.6, { s: 1.1 }], ['banana', 47.8, 404.0, { seed: 6 }], ['palm', 33.6, 398.0, { s: 0.95 }],
]) add({ k, x, z, ...o });
{
  // south of the slope: low fences, kitchen gardens, a wash line, hens: you look over them at the river town
  const r = rng(51);
  for (let x = 19; x < 58; x += 6.5 + r() * 2) {
    const z = laneZ(x + 2) + ROAD_HALF + 0.9;
    add({ k: r() < 0.5 ? 'bambooFence' : 'wPaperWall', x: x + 2, z, len: 3.6 + r() * 1.2, ry: -Math.atan2(laneZ(x + 4) - laneZ(x), 4) });
    const pick = r(), gz = z + 2.6 + r() * 1.4;
    if (pick < 0.3) add({ k: 'garden', x: x + 2.2, z: gz, w: 3.0, d: 1.6, seed: Math.floor(r() * 1e5) });
    else if (pick < 0.5) add({ k: 'laundry', x: x + 2.4, z: gz + 0.4, len: 3.4 });
    else if (pick < 0.65) add({ k: 'hens', x: x + 1.6, z: gz, seed: Math.floor(r() * 1e5) });
    else if (pick < 0.8) add({ k: 'woodpile', x: x + 1.6, z: gz });
    else add({ k: 'flowers', x: x + 1.6, z: gz - 0.6, seed: Math.floor(r() * 1e5) });
    if (r() < 0.6) add({ k: 'tufts', x: x + 4.5, z: gz + 1.6, seed: Math.floor(r() * 1e5) });
  }
  for (const [k, x, z, s] of [['palm', 24, 422.4, 1.0], ['rain', 31.0, 427.0, 1.1], ['palm', 38.4, 429.6, 0.95], ['banana', 44.4, 428.2, 1], ['palm', 52.0, 428.8, 1.05], ['rain', 21.0, 431.0, 1.0]]) add({ k, x, z, s, seed: Math.round(x) });
  add({ k: 'well', x: 34.6, z: 424.2 });
  add({ k: 'entries', x: 40, z: 432, w: 10, d: 5, seed: 8 });
}

// ---- the quay road's west side: godowns and a rope shop facing the water
westOf('wGodown', 427.0, 7.0, 8.0, QUAY_X, { door: '#3E5F7A', label: { my: 'ကုန်လှောင်ရုံ', en: 'Godown' } });
westOf('wShop', 436.0, 6.0, 6.4, QUAY_X, { goods: 'rice', awning: '#B8954E' });
westOf('wGodown', 452.4, 7.0, 8.0, QUAY_X, { door: '#9C5B3C' });
westOf('wStilt', 461.6, 6.0, 5.0, QUAY_X, { roof: 'zinc' });
for (const [k, x, z, o] of [
  ['wTally', 59.6, 435.2, { ry: PI / 2 - 0.2, seed: 6 }], ['wCrates', 59.8, 446.0, { seed: 13 }], ['wSacks', 59.4, 451.0, { n: 6, seed: 14 }],
  ['wTinPlants', 59.8, 468.6, { n: 3, seed: 2, ry: PI / 2 }], ['lamp', 60.3, 443.6, {}], ['lamp', 60.3, 470.4, {}], ['bikes', 59.9, 460.4, { ry: PI / 2 }],
]) add({ k, x, z, ...o });

// ---- Godown Row (z 448): north side, from the quay corner west to the row's end
north('wGodown', 18.6, 7.0, 8.0, ROW_Z, { door: '#4E8C86', label: { my: 'ဆန်ဂိုဒေါင်', en: 'Rice godown' } });
north('wStilt', 27.4, 6.0, 5.0, ROW_Z);
north('wShop', 35.4, 6.0, 6.4, ROW_Z, { goods: 'fish', label: { my: 'ငါးခြောက်', en: 'Dried fish' } });
north('wStilt', 43.2, 5.2, 4.6, ROW_Z, { roof: 'zinc' });
north('wStilt', 8.2, 5.6, 5.0, ROW_Z);
north('wShop', 0.0, 6.0, 6.4, ROW_Z, { goods: 'nets', awning: '#3E5F7A' });
north('wStilt', -8.4, 6.0, 5.0, ROW_Z, { roof: 'thatch' });
north('wGodown', -17.6, 7.0, 8.0, ROW_Z, { door: '#9C5B3C' });
north('wStilt', -25.6, 6.0, 5.0, ROW_Z);
north('wStilt', -33.4, 5.6, 5.0, ROW_Z, { roof: 'thatch' });
north('wShop', -41.2, 6.0, 6.4, ROW_Z, { goods: 'rice' });
north('wStilt', -49.0, 5.6, 5.0, ROW_Z);
// ---- Rope Walk (z 482): north side
north('wStilt', 49.6, 6.0, 5.0, ROPE_Z);
north('wShop', 41.4, 6.0, 6.4, ROPE_Z, { goods: 'rope', awning: '#9C5B3C' });
north('wStilt', 33.6, 6.0, 5.0, ROPE_Z, { roof: 'thatch' });
north('wGodown', 24.6, 7.0, 8.0, ROPE_Z, { door: '#D8B66A' });
north('wStilt', 18.4, 5.0, 4.6, ROPE_Z);
north('wStilt', 8.4, 5.4, 5.0, ROPE_Z);
north('wStilt', 0.6, 5.8, 5.0, ROPE_Z, { roof: 'thatch' });
north('wShop', -7.6, 6.0, 6.4, ROPE_Z, { goods: 'fish', awning: '#4E8C86' });
north('wStilt', -15.6, 6.0, 5.0, ROPE_Z);
north('wStilt', -23.6, 6.0, 5.0, ROPE_Z, { roof: 'zinc' });
north('wStilt', -31.4, 5.6, 5.0, ROPE_Z);

/** Kerb life on a street's north footpath (lamps, tins of plants, bikes, baskets, a hawker) in the gaps
 * between the fronts, and its south side (camera side: low things only) as yards down to the next row. */
function streetLife(roadZ, xa, xb, seed, south = 18, skip = []) {
  const r = rng(seed);
  const free = (x, w = 3) => !skip.some(([a, b]) => x + w > a && x < b);
  // the north footpath: something every 5-8 m, a lamp every third
  let n = 0;
  for (let x = xa + 2 + r() * 2; x < xb - 1; x += 4.5 + r() * 3, n++) {
    const z = roadZ - ROAD_HALF - 0.55;
    if (n % 3 === 0) add({ k: 'lamp', x, z: z - 0.1 });
    else {
      const pick = r();
      if (pick < 0.22) add({ k: 'wTinPlants', x, z: z - 0.15, n: 3 + Math.floor(r() * 2), seed: Math.floor(r() * 1e5) });
      else if (pick < 0.4) add({ k: 'bikes', x, z: z - 0.2 });
      else if (pick < 0.55) add({ k: 'wBaskets', x, z: z - 0.25, seed: Math.floor(r() * 1e5) });
      else if (pick < 0.7) add({ k: 'wCrateBench', x, z: z - 0.25 });
      else if (pick < 0.82) add({ k: 'jars', x, z: z - 0.35 });
      else add({ k: 'wDrums', x, z: z - 0.3, seed: Math.floor(r() * 9) });
    }
  }
  // the south side: a fence along the kerb with gaps, then yard life, then trees deeper in
  const z0 = roadZ + ROAD_HALF + 0.8;
  for (let x = xa; x < xb - 2;) {
    const len = Math.min(xb - x, 3.5 + r() * 4);
    const k = r() < 0.45 ? 'bambooFence' : r() < 0.6 ? 'wPaperWall' : 'fence';
    add({ k, x: x + len / 2, z: z0 + 0.15, len, ry: 0 });
    x += len + 1.8 + r() * 1.6;
  }
  for (let x = xa + 1 + r() * 2; x < xb - 3; x += 3.6 + r() * 2.4) {
    const pick = r(), z = z0 + 2.3 + r() * 2.2;
    if (!free(x, 4)) continue;
    if (pick < 0.16) add({ k: 'garden', x: x + 1.5, z, w: 3.0, d: 1.6, seed: Math.floor(r() * 1e5) });
    else if (pick < 0.3) add({ k: 'laundry', x: x + 1.8, z: z + 0.4, len: 3.4 });
    else if (pick < 0.4) add({ k: 'netRack', x: x + 1.7, z: z + 0.2, len: 3.0 });
    else if (pick < 0.5) add({ k: 'fishRack', x: x + 1.4, z, len: 2.4 });
    else if (pick < 0.58) add({ k: 'boatBlocks', x: x + 2.1, z: z + 0.3, len: 3.8, col: ['#A89A86', '#8FA5A0', '#B9A486'][Math.floor(r() * 3)] });
    else if (pick < 0.66) add({ k: 'hens', x: x + 0.9, z, seed: Math.floor(r() * 1e5) });
    else if (pick < 0.73) add({ k: 'woodpile', x: x + 0.9, z });
    else if (pick < 0.8) add({ k: 'wPlanks', x: x + 1.7, z, len: 3.0 });
    else if (pick < 0.88) add({ k: 'ducks', x: x + 1.2, z, n: 4, seed: Math.floor(r() * 1e5) });
    else add({ k: 'flowers', x: x + 0.9, z, seed: Math.floor(r() * 1e5) });
  }
  for (let x = xa + 2 + r() * 4; x < xb - 2; x += 5 + r() * 4) {
    const z = z0 + 7 + r() * Math.max(1, south - 9);
    const pick = r();
    if (pick < 0.3) add({ k: 'banana', x, z, seed: Math.floor(r() * 1e5) });
    else if (pick < 0.45) add({ k: 'rain', x, z, s: 0.95 + r() * 0.25 });
    else if (pick < 0.6) add({ k: 'palm', x, z, s: 0.9 + r() * 0.2 });
    else if (pick < 0.72) add({ k: 'garden', x, z, w: 2.8, d: 1.6, seed: Math.floor(r() * 1e5) });
    else if (pick < 0.84) add({ k: 'laundry', x, z, len: 3.2 });
    else add({ k: 'well', x, z });
    if (r() < 0.6) add({ k: 'tufts', x: x + 2 + r() * 2, z: z0 + 4 + r() * (south - 6), seed: Math.floor(r() * 1e5) });
  }
}
streetLife(ROW_Z, NET_X + ROAD_HALF + 0.6, 50.0, 61, 20);
streetLife(ROW_Z, -52, NET_X - ROAD_HALF - 0.6, 62, 20, [[1.5, 8.5]]);
streetLife(ROPE_Z, NET_X + ROAD_HALF + 0.6, 60.0, 63, 13, [[32, 40]]);
streetLife(ROPE_Z, -34, NET_X - ROAD_HALF - 0.6, 64, 13);
// where Daw Aye hangs the washing and U Pho Kun mends nets (wharf-folk.js)
add({ k: 'laundry', x: 4.8, z: 454.9, len: 3.6 });
add({ k: 'netRack', x: 35.6, z: 486.7, len: 3.4 });
add({ k: 'wBaskets', x: 38.6, z: 486.0, seed: 11 });

// ---- Net Lane (x 16): fences and yards both sides; the street names on their corners
{
  const r = rng(71);
  // (the west side breaks where Well Lane comes in at z 422)
  for (const [z0, z1, sides] of [[408, 419.4, [-1]], [424.6, 436, [-1]], [408, 436, [1]], [452, 470, [-1, 1]]]) {
    for (const side of sides) {
      const x = NET_X + side * (ROAD_HALF + 0.9);
      for (let z = z0; z < z1 - 2;) {
        const len = Math.min(z1 - z, 4 + r() * 3);
        add({ k: r() < 0.5 ? 'bambooFence' : 'wPaperWall', x, z: z + len / 2, len, ry: PI / 2 });
        z += len + 2 + r() * 1.5;
      }
      for (let z = z0 + 1.5; z < z1 - 2; z += 5 + r() * 3) {
        const pick = r(), xx = NET_X + side * (ROAD_HALF + 3.4 + r() * 1.5);
        if (pick < 0.3) add({ k: 'garden', x: xx, z, w: 1.6, d: 3.0, seed: Math.floor(r() * 1e5) });
        else if (pick < 0.5) add({ k: 'laundry', x: xx, z, len: 3.2, ry: PI / 2 });
        else if (pick < 0.65) add({ k: 'banana', x: xx, z, seed: Math.floor(r() * 1e5) });
        else if (pick < 0.8) add({ k: 'hens', x: xx, z, seed: Math.floor(r() * 1e5) });
        else add({ k: 'jars', x: xx, z, ry: side * PI / 2 });
      }
    }
    if (sides.includes(1)) add({ k: 'lamp', x: NET_X + ROAD_HALF + 0.5, z: (z0 + z1) / 2 });
  }
  add({ k: 'wStreetSign', x: NET_X - ROAD_HALF - 1.6, z: ROW_Z - ROAD_HALF - 0.7, name: { my: 'ဂိုဒေါင်တန်း', en: 'Godown Row' } });
  add({ k: 'wStreetSign', x: NET_X + ROAD_HALF + 1.6, z: 407.2, name: { my: 'ပိုက်ကွန်လမ်း', en: 'Net Lane' } });
  add({ k: 'wStreetSign', x: NET_X - ROAD_HALF - 1.6, z: ROPE_Z - ROAD_HALF - 0.7, name: { my: 'ကြိုးလမ်း', en: 'Rope Walk' } });
}

// ---- Rope Walk's far side (the page's bottom edge): boats on blocks, net racks, planks, a wash line
add({ k: 'palm', x: 58.4, z: 494.0, s: 1.0 });

// ---- Well Lane (z 422): the back lane west from Net Lane, between the Market's south fields and Godown Row.
// Houses on its north side, yards and the shared well on its south side (the Row's back fences beyond).
north('wStilt', -49.0, 5.6, 5.0, WELL_Z);
north('wShop', -41.4, 6.0, 6.4, WELL_Z, { goods: 'rice', awning: '#B8954E', label: { my: 'ဆန် · ဆီ · ဆား', en: 'Rice, oil, salt' } });
north('wStilt', -33.2, 6.0, 5.0, WELL_Z, { roof: 'thatch' });
north('wStilt', -25.0, 5.4, 5.0, WELL_Z, { roof: 'zinc' });
north('wShop', -17.4, 6.0, 6.4, WELL_Z, { goods: 'nets', awning: '#9C5B3C' });
north('wStilt', -9.2, 6.0, 5.0, WELL_Z);
north('wStilt', -1.2, 5.6, 5.0, WELL_Z, { roof: 'thatch' });
north('wStilt', 6.4, 5.4, 4.6, WELL_Z, { roof: 'zinc' });
streetLife(WELL_Z, -50, NET_X - ROAD_HALF - 0.6, 65, 15, [[-30, -22]]);
add({ k: 'well', x: -26.0, z: WELL_Z + 4.4 });
add({ k: 'wBasin', x: -23.4, z: WELL_Z + 4.6, seed: 3 });
add({ k: 'wStreetSign', x: NET_X - ROAD_HALF - 1.6, z: WELL_Z - ROAD_HALF - 0.7, name: { my: 'ရေတွင်းလမ်း', en: 'Well Lane' } });

// ---- behind Well Lane's houses and the western margin (trees show over the roofs)
{
  const r = rng(91);
  for (let x = -66; x < 12; x += 8 + r() * 6) {
    for (const z of [386 + r() * 6, 398 + r() * 7]) {
      const pick = r();
      if (pick < 0.32) add({ k: 'palm', x, z, s: 0.9 + r() * 0.25 });
      else if (pick < 0.55) add({ k: r() < 0.5 ? 'rain' : 'padauk', x, z, s: 0.95 + r() * 0.3 });
      else if (pick < 0.7) add({ k: 'banana', x, z, seed: Math.floor(r() * 1e5) });
      else if (pick < 0.85) add({ k: 'garden', x, z, w: 3.2, d: 1.8, seed: Math.floor(r() * 1e5) });
      else add({ k: 'hens', x, z, seed: Math.floor(r() * 1e5) });
    }
  }
  for (let z = 452; z < 496; z += 7 + r() * 5) add({ k: r() < 0.5 ? 'palm' : 'banana', x: -62 + r() * 8, z, s: 0.95, seed: Math.floor(z) });
  for (const z of [418, 432, 440]) add({ k: r() < 0.5 ? 'palm' : 'rain', x: -60 + r() * 4, z, s: 1.0, seed: Math.floor(z) });
  for (const [x, z, w, d, s] of [[-30, 402, 14, 8, 3], [-58, 430, 8, 8, 5], [-12, 392, 10, 6, 7], [40, 462, 8, 6, 9], [-12, 492, 10, 4, 11], [-48, 470, 10, 6, 13]]) add({ k: 'entries', x, z, w, d, seed: s });
  add({ k: 'goat', x: -40.0, z: 429.6, ry: 0.5 }); // (the Market's goat kind: kinds are shared)
}

// ---- people at their work (still figures, part of the chunk: no draw calls). The talking townsfolk are
// PEOPLE (wharf-folk.js); these are the rest of the town, busy. Nobody stands where they would point the way.
for (const w of [
  // the quay: porters, the tea stall, fish, wood, the boatwright's corner
  { x: 76.4, z: 437.6, ry: -PI / 2, pose: 'carry', load: '#F1E8D2', seed: 1 }, { x: 72.6, z: 444.4, ry: PI / 2, pose: 'carry', seed: 2 },
  { x: 74.8, z: 425.6, ry: PI, pose: 'yoke', load: '#C9CED1', seed: 3, woman: true }, { x: 70.2, z: 427.4, ry: -0.3, pose: 'sit', seed: 4 },
  { x: 68.6, z: 427.8, ry: 0.4, pose: 'sit', seed: 5, woman: true }, { x: 71.9, z: 455.2, ry: PI, pose: 'squat', seed: 6, woman: true, load: '#C9CED1' },
  { x: 88.6, z: 450.7, ry: 0, pose: 'fish', seed: 7 }, { x: 96.6, z: 477.0, ry: 0, pose: 'fish', seed: 8, woman: true },
  { x: 84.0, z: 458.0, ry: PI, pose: 'carry', load: '#A88C5E', seed: 9 }, { x: 70.6, z: 477.4, ry: -0.5, pose: 'plane', seed: 10, woman: false },
  { x: 75.2, z: 486.4, ry: 0.4, pose: 'kid', seed: 11 }, { x: 93.4, z: 432.0, ry: PI / 2, pose: 'coil', seed: 12 },
  // Godown Row and the lane
  { x: 37.4, z: 446.4, ry: 0, pose: 'sweep', seed: 13, woman: true }, { x: -4.6, z: 446.6, ry: 0.3, pose: 'sit', seed: 14 },
  { x: 22.8, z: 446.5, ry: 0, pose: 'carry', seed: 15 }, { x: -22.0, z: 446.4, ry: -0.2, pose: 'yoke', seed: 16, woman: true, load: '#E2B33C' },
  { x: 37.0, z: 409.2, ry: 0.2, pose: 'carry', seed: 17 }, { x: 9.6, z: 397.0, ry: -0.4, pose: 'sit', seed: 18, woman: true },
  // Rope Walk: rope and nets
  { x: 13.0, z: 480.4, ry: 0, pose: 'coil', seed: 19 }, { x: -12.6, z: 480.6, ry: 0.2, pose: 'mend', seed: 20, woman: true },
  { x: 45.0, z: 480.4, ry: 0, pose: 'stand', seed: 21 }, { x: -27.2, z: 480.5, ry: -0.3, pose: 'kid', seed: 22 },
  // Well Lane
  { x: -27.6, z: WELL_Z + 3.4, ry: 0.5, pose: 'squat', seed: 23, woman: true }, { x: -8.0, z: WELL_Z - 1.9, ry: 0, pose: 'sweep', seed: 24, woman: true },
  { x: -36.0, z: WELL_Z - 1.9, ry: 0.2, pose: 'sit', seed: 25 },
]) add({ k: 'wWorker', ...w });

// ---- more quay life between the jetty mouths (the mouths themselves and the walking line x 63.5 .. 70 stay clear)
for (const [k, x, z, o] of [
  ['wDryMat', 74.6, 436.0, { kind: 'fish', seed: 2 }], ['wCrabPots', 76.0, 444.4, { seed: 3 }], ['wBasin', 71.2, 457.6, { seed: 4 }],
  ['wDryMat', 76.0, 464.0, { kind: 'chili', seed: 5 }], ['wShrub', 77.8, 460.8, { s: 0.8, bloom: 'pink', seed: 6 }], ['wCrabPots', 76.6, 479.6, { seed: 7, n: 4 }],
  ['wDryMat', 73.4, 487.6, { kind: 'prawn', seed: 8 }], ['wPuddle', 66.6, 461.4, { w: 1.6, d: 0.9 }],
  ['wSacks', 72.8, 443.4, { n: 5, seed: 21 }], ['wBaskets', 71.8, 438.7, { seed: 22 }], ['wDryMat', 72.0, 469.8, { kind: 'rice', seed: 23 }],
  ['wCrabPots', 71.4, 473.4, { seed: 24, n: 3 }], ['wPuddle', 69.4, 433.8, { w: 1.2, d: 0.8 }],
]) add({ k, x, z, ...o });
// work litter on the deck, the walking line included (decals: walkable, no draw calls of their own)
{
  const r = rng(77), kinds = ['straw', 'rice', 'scales', 'wet', 'chalk', 'rope', 'mix', 'straw', 'scales', 'wet'];
  for (let z = 418.5; z < 484; z += 2.2 + r() * 2.2) {
    if (JETTIES.some(([jz, , w]) => Math.abs(z - jz) < w / 2 + 0.6) && r() < 0.5) continue;
    add({ k: 'wDeckLitter', x: 64.8 + r() * 5.2, z, w: 1.6 + r() * 1.4, d: 1.0 + r() * 0.8, kind: kinds[Math.floor(r() * kinds.length)], seed: Math.floor(r() * 1e5) });
  }
  for (const [x, z, kind] of [[61.6, 418.6, 'straw'], [64.2, 415.6, 'rice'], [69.4, 417.8, 'chalk'], [71.2, 451.6, 'scales'], [73.6, 452.0, 'wet'], [70.4, 439.6, 'straw'], [68.8, 478.8, 'rope']]) add({ k: 'wDeckLitter', x, z, w: 1.8, d: 1.2, kind, seed: Math.round(x * z) });
}
// a woman turning the rice on its mat, a porter resting on the sacks (still figures)
add({ k: 'wWorker', x: 73.4, z: 470.9, ry: PI, pose: 'squat', seed: 31, woman: true, load: '#F7F3E8' });
add({ k: 'wWorker', x: 74.2, z: 442.3, ry: -0.4, pose: 'sit', seed: 32 });
// chalk price boards: each shop's own words (never directions)
for (const [x, z, lines] of [
  [33.2, 446.2, [{ my: 'ငါးခြောက် · ပုစွန်ခြောက်', en: 'Dried fish · dried prawns' }]],
  [44.6, 480.2, [{ my: 'ကြိုး လိုသလောက် ဖြတ်ပေး', en: 'Rope, cut to length' }]],
  [72.0, 473.4, [{ my: 'လှေ ပြင်သည်', en: 'Boats mended' }]],
  [-38.2, 420.2, [{ my: 'ဆန်သစ် ရောက်ပြီ', en: 'New rice in' }]],
]) add({ k: 'wAFrame', x, z, ry: 0, lines });

// ---- yards at walking height: dense low life in the band just south of each street (the camera's side)
{
  const roads = [
    [-60, ROW_Z - ROAD_HALF - 0.4, QUAY_X + ROAD_HALF, ROW_Z + ROAD_HALF + 0.6], [-40, ROPE_Z - ROAD_HALF - 0.4, QUAY_X + ROAD_HALF, ROPE_Z + ROAD_HALF + 0.6],
    [-55, WELL_Z - ROAD_HALF - 0.4, NET_X, WELL_Z + ROAD_HALF + 0.6], [NET_X - ROAD_HALF - 0.6, 400, NET_X + ROAD_HALF + 0.6, ROPE_Z],
    [QUAY_X - ROAD_HALF - 0.6, 420, 70.2, 498],
  ];
  const space = spaceOf(ITEMS, roads);
  const band = (x0, x1, z0, z1, seed, step) => fillBand(add, space, x0, x1, z0, z1, seed, step);
  band(-50, 13.6, WELL_Z + 2.0, WELL_Z + 9.0, 401, 2.6);
  band(-50, 13.6, WELL_Z + 9.0, 437.0, 402, 4.2);
  band(-52, 13.6, ROW_Z + 2.0, ROW_Z + 9.5, 403, 2.6);
  band(18.4, 60.0, ROW_Z + 2.0, ROW_Z + 9.5, 404, 2.6);
  band(-52, 60.0, ROW_Z + 9.5, 469.5, 405, 4.4);
  band(-34, 13.6, ROPE_Z + 2.0, 497.0, 406, 2.8);
  band(18.4, 62.0, ROPE_Z + 2.0, 497.0, 407, 2.8);
  for (let x = 19; x < 49; x += 6) band(x, x + 6, laneZ(x + 6) + 2.4, 435.5, 408 + x, 3.0);
  band(-20, 6, 380, 384.5, 420, 3.2); // the Market's back fields' edge, seen from the lane's foot
}

// ---------------------------------------------------------------------------------
// Doors into rooms (doors.js): x, z = the threshold just in front of the doorway; facing 0 = looking south
// ---------------------------------------------------------------------------------
export const DOORS = [
  // the wide loading door, mid-front (the ramp's foot)
  { room: 'weighhouse', x: WEIGH.x, z: WEIGH.z + WEIGH.d / 2 + 0.75, facing: 0, r: 1.1 },
  // the plank door at the top of five steps: the threshold is the steps' foot, on the quay
  { room: 'sandahouse', x: SANDA.x + SANDA.doorX, z: SANDA.z + SANDA.d / 2 + 2.7, facing: 0, r: 0.85 },
];

// ---------------------------------------------------------------------------------
// Bookmark Desks (INDEX 7)
// ---------------------------------------------------------------------------------
export const DESKS = [
  { id: 'wharfHead', name: { my: 'ဆိပ်ကမ်းထိပ်', en: 'Wharf head' }, x: 70.5, z: 418.6, ry: PI / 2 },
  { id: 'wharfEnd', name: { my: 'ဆိပ်ခြေ', en: 'Jetty End' }, x: 95.2, z: 474.6, ry: PI / 2 },
];

// ---------------------------------------------------------------------------------
// Spots the day scripts may use (world metres; h = heading, 0 faces +Z). day5-world.js reads `parcels` and
// `maungnge`; the rest are here so a day need not keep its own copy.
// ---------------------------------------------------------------------------------
export const SPOTS = {
  toWharf: { x: 7, z: 378 }, bend: { x: 16, z: 404 }, head: { x: 62, z: 424 },
  weighDoor: { x: WEIGH.x, z: WEIGH.z + WEIGH.d / 2 + 0.75 }, weighHouse: { ...WEIGH },
  cart: { x: 63.0, z: 417.7 }, parcels: { x: 61.0, z: 416.2 }, maungnge: { x: 62.3, z: 419.0, h: 0.4 },
  handScale: { x: 70.9, z: 415.6 }, teaStall: { x: 69.6, z: 424.6 },
  sandaHouse: { ...SANDA }, sandaDoor: { x: SANDA.x + SANDA.doorX, z: SANDA.z + SANDA.d / 2 + 2.7 },
  jetties: JETTIES.map(([z, tip, w, name]) => ({ z, tip, w, name, head: { x: QUAY + 0.6, z } })),
  sandbar: { ...SANDBAR }, caneShed: { x: 87.4, z: 490.9 }, canePost: { x: 85.0, z: 488.7 },
};

export const PEOPLE = FOLK_PEOPLE;
export const SIGNS = [];
