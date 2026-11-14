// District 2 · the Envelope Market (opens Day 4; used Days 4, 5, 6, 7, 14; chapters 6, 7, 10, 11), with the
// envelope-paper road down to it from the Quarter's south border. The Market is an unfolded letter whose
// creases are its lanes (day4-spec 1, day5-spec 1.1, day6-spec 1; INDEX 7, 11, 13). Format: regions/index.js.
//
// This file is the ONE home of the Market's buildings, doors and spots. The places stand where the day scripts
// already expected them (day4-market.js MK, day5-world.js FALLBACK, day6-set.js P, day14-world.js SPOTS), so every
// day sees the same post office, tea shop, carvers' row and free-food shop at the same place. `MK` below has the
// exact shape of day4-market.js's MK (a drop-in), `SPOTS` the names Days 5-7 read.
// Art: ./market-art.js (the buildings and props), ./market-life.js (street life: folk, water pots, carts, fences),
// ./market-fill.js (the fill pass: cottages and yards on the envelope road, the margins and the bottom edge),
// ./market-town.js (the town pass: homes, shophouses and yards on every block, laid last round everything here).
// Townsfolk with hellos: ./market-folk.js, ./market-townfolk.js.
//
// STREET PLAN (+X east, +Z south; every front faces +Z, the street camera; only low things stand south of a lane)
//
//   z 258  the letter's top crease (the envelope road comes over it at x 7): gate sign, Daw Kyar's rice cart, desk mgate
//   z 272  Stamp Lane (x -58 .. 37): stamp-awning stalls on its north side, Ko Yaung's map stall first east of the
//          crease (x 12), Daw Pyone's envelopes (x 21.6), then THE STAMP-CARVERS' ROW at the lane's east end
//          (x 27-37; the third shop is Ko Lwin's: door `carvershop`). South side: stalls facing the lane, and the
//          painted "shortcut" (a gap at x 21.5 between two stalls, two stalls deep, ending in envelope crates);
//          the dogs' corner under a rain tree behind the east end (x 28-33, z 280-283)
//   z 300  Counter Lane (x -58 .. 39 -> Newsprint Junction). North side, west -> east: houses, the stamp printers'
//          hall, the letter-writer, [spine x 7], Pwa Pwa's thanaka stone, Ma Thiri's plane table and bamboo post,
//          THE POST OFFICE (flag board over its main door `marketpost`; the post-room door `postroom` at its east
//          end), desk `counter` at its east corner, the mouth of the tea-shop street, Ma Yu Yu's SUNDRIES (`sundries`)
//   x 29   the tea-shop street, south from Counter Lane to Rice Lane: Daw Tin Tin's TEA SHOP (`teashop`) on the
//          north side of the little paved square (x 10-27, z 313-321), the street pump straight across from its door;
//          at the street's far end, Daw Yi's FREE-FOOD SHOP (`riceshop`) on Rice Lane under a padauk
//   z 334  Rice Lane (x -30 .. 37);  z 358 Ink Lane (x -30 .. 30);  x 7 the spine on south to the Wharf (z 378)
//   x -30  the west lane (Stamp Lane -> Ink Lane); west of it: the kite field, market gardens, the letter's
//          signature written large on the paper, the margin trees
//
// Doors: marketpost, postroom, carvershop, sundries, teashop, riceshop. Desks: mgate, counter.
import { rng } from '../kit.js';
import { ART as MK_ART, PROP as MK_PROP, poDoorX, poRoomX, poFlagX } from './market-art.js';
import { ART as LIFE_ART, PROP as LIFE_PROP } from './market-life.js';
import { FOLK_PEOPLE } from './market-folk.js';
import { ART as FILL_ART, PROP as FILL_PROP, fill } from './market-fill.js';
import { ART as TOWN_ART, PROP as TOWN_PROP, town } from './market-town.js';

export const ART = { ...MK_ART, ...LIFE_ART, ...FILL_ART, ...TOWN_ART };
export const PROP = { ...MK_PROP, ...LIFE_PROP, ...FILL_PROP, ...TOWN_PROP };

export const REGION = [
  { id: 'envelope', name: { my: 'စာအိတ်ဈေးလမ်း', en: 'Road to the Envelope Market' }, rect: [-26, 160, 34, 258], paper: 'envelope', label: [4, 172] },
  { id: 'market', name: { my: 'စာအိတ်ဈေး', en: 'Envelope Market' }, rect: [-96, 258, 39, 378], paper: 'letter', label: [-40, 262],
    creases: { x: [7, -30], z: [272, 300, 334, 358] } },
];

// ---------------------------------------------------------------------------------
// Roads
// ---------------------------------------------------------------------------------
const STAMP_Z = 272, COUNTER_Z = 300, RICE_Z = 334, INK_Z = 358, SPINE_X = 7, WEST_X = -30, FAR_X = -58, TEA_X = 29;
export const LANES = { stamp: STAMP_Z, counter: COUNTER_Z, rice: RICE_Z, ink: INK_Z, spine: SPINE_X, west: WEST_X, teaStreet: TEA_X };

export const ROAD_NODES = [
  { id: 'mCrease', x: SPINE_X, z: 258 },
  { id: 'mStamp', x: SPINE_X, z: STAMP_Z },
  { id: 'mCounter', x: SPINE_X, z: COUNTER_Z },
  { id: 'mRice', x: SPINE_X, z: RICE_Z },
  { id: 'mInk', x: SPINE_X, z: INK_Z },
  { id: 'mSouth', x: SPINE_X, z: 378 },
  { id: 'mStampW', x: FAR_X, z: STAMP_Z }, { id: 'mStampX', x: WEST_X, z: STAMP_Z }, { id: 'mStampE', x: 37, z: STAMP_Z },
  { id: 'mCounterW', x: FAR_X, z: COUNTER_Z }, { id: 'mCounterX', x: WEST_X, z: COUNTER_Z }, { id: 'mTeaN', x: TEA_X, z: COUNTER_Z },
  { id: 'mRiceX', x: WEST_X, z: RICE_Z }, { id: 'mTeaS', x: TEA_X, z: RICE_Z }, { id: 'mRiceE', x: 37, z: RICE_Z },
  { id: 'mInkW', x: WEST_X, z: INK_Z }, { id: 'mInkE', x: 30, z: INK_Z },
];
const EW = { sample: 0.5, bias: 0.003 }; // east-west lanes win where they cross
export const ROAD_EDGES = [
  // the envelope road from the Quarter's border sign, winding a little, onto the letter at the crease
  { id: 'route1', a: 'border', b: 'mCrease', pts: [[4, 160], [4, 180], [8.5, 200], [11, 215], [9, 232], [7, 250], [7, 258]], sample: 0.4 },
  // the spine: crease -> Stamp Lane -> Counter Lane -> Rice Lane -> Ink Lane -> the south lane (to the Wharf)
  { id: 'mkSpine1', a: 'mCrease', b: 'mStamp', sample: 0.5 },
  { id: 'mkSpine2', a: 'mStamp', b: 'mCounter', sample: 0.5 },
  { id: 'mkSpine3', a: 'mCounter', b: 'mRice', sample: 0.5 },
  { id: 'mkSpine4', a: 'mRice', b: 'mInk', sample: 0.5 },
  { id: 'mkSouth', a: 'mInk', b: 'mSouth', pts: [[7, 358], [7.6, 368], [7, 378]], sample: 0.5 },
  // Stamp Lane
  { id: 'mkStampW1', a: 'mStampW', b: 'mStampX', ...EW },
  { id: 'mkStampW2', a: 'mStampX', b: 'mStamp', ...EW },
  { id: 'mkStampE', a: 'mStamp', b: 'mStampE', ...EW },
  // Counter Lane, and east on it: "the one road east until the paper creases" (day7-spec 1.2)
  { id: 'mkCounterW1', a: 'mCounterW', b: 'mCounterX', ...EW },
  { id: 'mkCounterW2', a: 'mCounterX', b: 'mCounter', ...EW },
  { id: 'mkCounterE', a: 'mCounter', b: 'mTeaN', ...EW },
  { id: 'mkEast', a: 'mTeaN', b: 'jWest', ...EW },
  // the tea-shop street (past the square) down to Rice Lane
  { id: 'mkTeaSt', a: 'mTeaN', b: 'mTeaS', sample: 0.5 },
  // Rice Lane and Ink Lane
  { id: 'mkRiceW', a: 'mRiceX', b: 'mRice', ...EW },
  { id: 'mkRiceM', a: 'mRice', b: 'mTeaS', ...EW },
  { id: 'mkRiceE', a: 'mTeaS', b: 'mRiceE', ...EW },
  { id: 'mkInkW', a: 'mInkW', b: 'mInk', ...EW },
  { id: 'mkInkE', a: 'mInk', b: 'mInkE', ...EW },
  // the west lane and the far-west link
  { id: 'mkWest1', a: 'mStampX', b: 'mCounterX', sample: 0.5 },
  { id: 'mkWest2', a: 'mCounterX', b: 'mRiceX', sample: 0.5 },
  { id: 'mkWest3', a: 'mRiceX', b: 'mInkW', sample: 0.5 },
  { id: 'mkFarW', a: 'mStampW', b: 'mCounterW', sample: 0.5 },
];

// ---------------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------------
export const ITEMS = [];
export const OBSTACLES = [];
const add = (o) => (ITEMS.push(o), o);
const addAll = (list) => { for (const [k, x, z, extra] of list) add({ k, x, z, ...(extra || {}) }); };
// a lane's north frontage: buildings' fronts stand at lane z - 2.6 (the kerb, a footpath, a strip)
const FRONT = (z) => z - 2.6;
const PI = Math.PI;
// a still townsperson at work (market-life.js `folk`: merged into the chunk, costs no draw call)
const folk = (x, z, ry, pose, seed, extra = {}) => add({ k: 'folk', x, z, ry, pose, seed, ...extra });

// ---- the envelope road (unchanged; the same seeded trees)
{
  const r = rng(5);
  for (let z = 66; z < 158; z += 7 + r() * 4) for (let k = 0; k < 6; k++) r(); // (the Quarter's margin trees drew from this stream first)
  for (const [x, z] of [[-6, 166], [-14, 178], [17, 170], [22, 186], [-4, 196], [-12, 214], [24, 206], [0, 226], [20, 232], [-10, 240]]) add({ k: r() < 0.5 ? 'rain' : 'padauk', x, z, s: 1 + r() * 0.3 });
  add({ k: 'fence', x: -2, z: 186, len: 9, ry: 0 });
  add({ k: 'flowers', x: 12.8, z: 191.0, seed: 31 });
  add({ k: 'bench', x: 13.6, z: 224.8, ry: 0 });
  [[-8, 172, 0.2], [16, 180, -0.3], [-6, 205, 0.4], [21, 219, -0.2], [-3, 236, 0.25], [18, 244, -0.35]].forEach(([x, z, ry], i) => add({ k: 'stamp', x, z, ry, seed: i + 1 }));
  for (const [x, z] of [[12, 165], [-2, 212], [15, 238]]) add({ k: 'seal', x, z });
  [[9.5, 176], [-1, 190], [16, 208], [3, 244]].forEach(([x, z], i) => add({ k: 'parcel', x, z, ry: (i - 1.5) * 0.3, seed: i + 7 }));
  for (const [x, z] of [[9.0, 190], [7.4, 222], [10.8, 238.8]]) add({ k: 'lamp', x, z });
  // the last stretch before the letter: parcels stacked for the Market, a post box, a lamp, a carter resting
  add({ k: 'parcel', x: 12.6, z: 252.4, ry: 0.2, seed: 21 });
  add({ k: 'parcel', x: 13.6, z: 253.6, ry: -0.3, seed: 22 });
  add({ k: 'postBox', x: 2.6, z: 253.2 });
  add({ k: 'lamp', x: 3.6, z: 256.4 });
  add({ k: 'handcart', x: 15.4, z: 249.0, ry: -0.4 });
  folk(14.4, 250.6, 0.6, 'sit', 501, { top: '#F4EFE4' });
  add({ k: 'waterPots', x: -1.4, z: 249.6, ry: 0.2 });
  add({ k: 'sapling', x: -4.2, z: 246.0, seed: 3 });
}

// ---- the crease: the letter's top fold, the gate sign, Daw Kyar's rice cart, the first lamp
add({ k: 'pageCrease', x: SPINE_X, z: 258.05, len: 40, gap: 4.4 });
add({ k: 'gateSign', x: -3.2, z: 260.6 });
add({ k: 'riceCart', x: 2.6, z: 261.4, ry: 0.15 });
add({ k: 'sacks', x: 0.2, z: 262.6, seed: 4 });
add({ k: 'flowers', x: -6.6, z: 261.4, seed: 12 });
add({ k: 'waterPots', x: -9.0, z: 263.0, sign: true }); // drinking water for whoever comes over the crease
add({ k: 'baskets', x: 15.8, z: 261.6, seed: 2 });
add({ k: 'lamp', x: 9.8, z: 259.6 });

// ---- Stamp Lane, north side: stamp-awning stalls (fronts on the lane), keepers behind the counters
const STALL_Z = FRONT(STAMP_Z) - 0.6 + 0.2; // 269.0: stall centre (counter front at about z 269.85)
const NORTH_STALLS = [
  // [x, goods, colour, motif, keeper?]
  [-54.5, 'fruit', 'green', 3, 1], [-51.0, 'cloth', 'violet', 1, 0], [-47.5, 'pots', 'gold', 4, 1], [-43.0, 'flowers', 'red', 3, 0], [-39.5, 'snacks', 'teal', 5, 1], [-36.0, 'books', 'blue', 1, 0],
  [-24.0, 'fruit', 'gold', 3, 1], [-20.5, 'paper', 'teal', 4, 0], [-17.0, 'stamps', 'violet', 5, 1], [-13.5, 'envelopes', 'red', 2, 0], [-10.0, 'snacks', 'green', 1, 1], [-6.5, 'flowers', 'blue', 3, 0],
  [-3.0, 'kites', 'gold', 2, 1], [0.5, 'cloth', 'red', 1, 0],
  // east of the crease (day4-market MK.north): 15.2 red, 18.4 green, 21.6 gold (Daw Pyone's envelopes), 24.8 red
  [15.2, 'fruit', 'red', 3, 1], [18.4, 'stamps', 'green', 5, 0], [21.6, 'envelopes', 'gold', 2, 0], [24.8, 'flowers', 'red', 3, 1],
];
NORTH_STALLS.forEach(([x, goods, color, motif, keeper], i) => {
  add({ k: 'stampStall', x, z: STALL_Z, goods, color, motif, seed: 40 + i });
  if (keeper) folk(x + 0.5, STALL_Z - 0.25, 0, 'sit', 600 + i, { stool: false });
});
add({ k: 'stampStall', x: 12.0, z: STALL_Z, w: 3.2, goods: 'maps', color: 'gold', motif: 2, seed: 77 }); // Ko Yaung's map stall, first from the crease
// THE STAMP-CARVERS' ROW at the lane's east end (day5-spec 1.1): two busy benches, the third shop is Ko Lwin's
const CARV = add({ k: 'carverRow', x: 31.95, z: FRONT(STAMP_Z) - 3, w: 10.3, d: 6 });
// shoppers on the north footpath (looking at the stalls), one with a basket on her head
folk(-47.0, 270.6, PI, 'stand', 701, { woman: true });
folk(-19.8, 270.7, PI + 0.3, 'head', 702, { woman: true, load: '#7FAE66' });
folk(-9.3, 270.6, PI - 0.2, 'stand', 703);
folk(17.9, 270.7, PI + 0.2, 'stand', 704, { woman: true });
// behind the north stalls: the page's top edge (west), crates, carts, trees
addAll([
  ['crates', -52.6, 264.6, { seed: 3 }], ['handcart', -45.4, 264.2, { ry: 0.3 }], ['trishaw', -38.2, 264.6, { seed: 1, ry: -0.2 }], ['sacks', -33.4, 265.0, { seed: 7 }],
  ['crates', -21.8, 264.8, { seed: 5 }], ['bikes', -15.2, 264.6, {}], ['mailSacks', -8.4, 264.4, {}], ['baskets', -1.6, 264.6, { seed: 8 }],
  ['crates', 17.4, 264.6, { seed: 11 }], ['handcart', 23.4, 264.2, { ry: -0.2 }], ['potRack', -27.4, 264.4, { seed: 2 }],
]);
for (const [k, x, z, s] of [['padauk', -57.5, 262.2, 1.1], ['rain', -48.6, 261.6, 1.0], ['padauk', -41.4, 261.8, 1.05], ['padauk', -29.4, 262.4, 1.15], ['rain', 21.0, 261.2, 1.0], ['padauk', 37.4, 260.4, 1.0]]) add({ k, x, z, s });
for (const x of [-45.25, -27.6, -8.25, 3.2, 26.5]) add({ k: 'lamp', x, z: 270.2 });

// ---- Stamp Lane, south side: stalls facing the lane (turned round). Between two of them the painted
// "shortcut" (a 1.3 m gap at x 21.5 running south) ends two stalls in, at a wall of envelope crates
const SOUTH_Z1 = STAMP_Z + 3.35, SOUTH_Z2 = SOUTH_Z1 + 2.1; // 275.35, 277.45
const SHORTCUT_X = 21.5;
for (const [x, goods, color, side, keeper] of [
  [-20.0, 'paper', 'gold', 0, 1], [-16.5, 'cloth', 'red', 0, 0], [-13.0, 'envelopes', 'blue', 0, 1], [-9.5, 'stamps', 'green', 0, 0], [-6.0, 'fruit', 'violet', 0, 1], [-2.5, 'snacks', 'teal', 0, 0],
  [12.2, 'fruit', 'violet', 0, 1], [15.6, 'cloth', 'red', 0, 0],
  [SHORTCUT_X - 2.15, 'paper', 'gold', -1, 0], [SHORTCUT_X + 2.15, 'stamps', 'green', 1, 1],
]) {
  add({ k: 'stampStall', x, z: SOUTH_Z1, ry: PI, goods, color, side: side || undefined, back: true, seed: 90 + Math.round(x) });
  if (keeper) folk(x - 0.5, SOUTH_Z1 + 0.25, PI, 'sit', 650 + Math.round(x * 3), { stool: false });
}
add({ k: 'stampStall', x: SHORTCUT_X - 2.15, z: SOUTH_Z2, ry: PI, goods: 'envelopes', color: 'teal', side: -1, back: true, seed: 97 });
add({ k: 'stampStall', x: SHORTCUT_X + 2.15, z: SOUTH_Z2, ry: PI, goods: 'kites', color: 'red', side: 1, back: true, seed: 98 });
add({ k: 'envCrates', x: SHORTCUT_X, z: SOUTH_Z2 + 1.75, w: 1.7, seed: 4 });
// the gap's walls (the stalls' side cloths): it is a real dead end
OBSTACLES.push({ type: 'box', minX: SHORTCUT_X - 0.95, maxX: SHORTCUT_X - 0.7, minZ: SOUTH_Z1 - 0.8, maxZ: SOUTH_Z2 + 1.4 });
OBSTACLES.push({ type: 'box', minX: SHORTCUT_X + 0.7, maxX: SHORTCUT_X + 0.95, minZ: SOUTH_Z1 - 0.8, maxZ: SOUTH_Z2 + 1.4 });
// a woman with a basket on her head crossing Stamp Lane west of the spine, a boy with a sack
folk(1.8, 273.5, 1.3, 'head', 705, { woman: true, load: '#E8B832' });
folk(-25.6, 273.8, -1.4, 'carry', 706, { load: '#F7F3E8' });
// behind them: the stamp printers' drying lines and yard (west), the post office's back yard (east)
addAll([
  ['crates', -20.4, 280.6, { seed: 8 }], ['sacks', -16.2, 281.2, { seed: 9 }], ['stampLine', -11.6, 283.4, { len: 3.6 }], ['stampLine', -6.8, 282.2, { len: 3.2 }],
  ['stampLine', -11.0, 286.6, { len: 3.4 }], ['handcart', -2.6, 285.6, { ry: 0.2 }], ['postmark', -16.0, 286.0, { seed: 3 }], ['baskets', -4.0, 281.4, { seed: 11 }],
  ['trishaw', 11.0, 283.4, { seed: 2, ry: 0.3 }], ['crates', 15.2, 281.4, { seed: 13 }], ['stampLine', 15.0, 286.8, { len: 3.2 }],
  ['mailSacks', 19.6, 288.6, {}], ['handcart', 23.2, 288.0, { ry: -0.4 }], ['bikes', 26.2, 288.6, {}], ['bikes', 26.9, 289.4, {}],
]);
folk(-9.2, 284.2, 0.4, 'stand', 707, { woman: true, top: '#F4EFE4' }); // pegging stamp sheets
add({ k: 'padauk', x: 13.6, z: 289.6, s: 1.0 });
add({ k: 'padauk', x: -23.4, z: 287.8, s: 1.05 });
// the dogs' corner: deep shade under a rain tree; the flat stone where the bowls go; old sacks to sleep on
// (the dogs themselves are Day 4's streetDog props: they wake and drink)
add({ k: 'rain', x: 31.6, z: 280.4, s: 1.35 });
add({ k: 'flatStone', x: 29.9, z: 281.4 });
for (const [x, z, seed] of [[28.8, 282.3, 1], [30.9, 282.9, 2], [32.4, 281.9, 3]]) add({ k: 'dogBed', x, z, seed });
add({ k: 'crates', x: 35.2, z: 285.4, seed: 17 });
add({ k: 'tufts', x: 26.6, z: 285.6, seed: 5 });
add({ k: 'tufts', x: 34.6, z: 279.0, seed: 6 });
add({ k: 'hens', x: 35.0, z: 289.4, seed: 71 });
// the east end of Stamp Lane's south side, across from the carvers: street tea for the carvers, a vegetable mat
addAll([['lowTea', 28.0, 276.2, { seed: 14 }], ['hawkerMat', 33.6, 276.0, { seed: 15 }], ['planters', 37.2, 275.4, { seed: 16 }], ['stoolRow', 30.6, 275.0, { n: 3, seed: 6 }]]);
folk(27.25, 276.2, PI / 2, 'sit', 740, { stool: false });
folk(28.0, 276.75, PI, 'pour', 741, { stool: false, woman: true });
folk(33.6, 275.25, 0, 'squat', 742, { woman: true, hat: 'sun' });
// the stamp printers' yard behind the hall: baskets, a pot rack, bananas, a hen run, a bamboo fence
addAll([['bambooFence', -14.0, 280.0, { len: 11, gate: true }], ['baskets', -24.6, 284.6, { seed: 12 }], ['bananas', -1.2, 288.2, { seed: 13 }], ['hens', -21.4, 288.0, { seed: 72 }], ['potRack', 3.4, 281.4, { seed: 9 }]]);
add({ k: 'woodpile', x: 30.2, z: 289.6 });

// ---- Counter Lane, north side
const CF = FRONT(COUNTER_Z); // 297.4
const house = (x, w, d, frontZ, seed, style, extra = {}) => add({ k: 'mkHouse', x, z: frontZ - d / 2, w, d, seed, style, ...extra });
house(-52.6, 6.6, 7, CF, 11, 'env');
house(-45.6, 6.6, 7, CF, 12, 'stamp');
house(-38.4, 6.8, 7, CF, 13, 'parcel', { sign: 'ပါဆယ်' });
house(-24.2, 6.2, 7, CF, 14, 'env', { shop: true });
add({ k: 'waterPots', x: -20.25, z: 296.3 }); // between the house and the hall: water for anyone
add({ k: 'stampHall', x: -13.4, z: CF - 4, w: 12, d: 8 });
folk(-12.0, 298.0, 0.2, 'carry', 708, { load: '#FBF6EA' }); // a printer carrying reams to the bay
house(-3.6, 6.0, 7, CF, 24, 'env', { shop: false, sign: 'စာရေးပေးသည်' });
add({ k: 'scribe', x: 1.8, z: 296.3 }); // the public letter-writer's table, beside his door
folk(1.8, 295.75, 0, 'sit', 709, { stool: false, top: '#F4EFE4', bottom: '#2E3D63', woman: false });
// east of the spine: Grandmother Pwa Pwa's thanaka stone, Ma Thiri's plane table and bamboo post at the post office's west corner
add({ k: 'thanaka', x: 12.6, z: 296.6 });
add({ k: 'planeTable', x: 15.4, z: 296.7 });
add({ k: 'bambooPost', x: 16.9, z: 297.6 });
// THE MARKET POST OFFICE (marketpost + postroom): 8.4 m front, main door at x 20.6, post-room door at x 24.85
const PO = add({ k: 'postOffice', x: 21.6, z: CF - 3.5, w: 8.4, d: 7 });
// (desk `counter` stands at its east corner, x 27.4: DESKS below)
const SUN = add({ k: 'sundries', x: 33.4, z: CF - 2.6, w: 5.2, d: 5.2 });
add({ k: 'planters', x: 37.4, z: 296.4, seed: 4 });
for (const x of [-34.2, -20.4, -7.0, 10.1, 29.6, 38.4]) add({ k: 'lamp', x, z: 297.95 });
add({ k: 'dog', x: 36.6, z: 298.2, ry: 0.4, seed: 5 }); // asleep on the footpath by Ma Yu Yu's
folk(-30.9, 297.6, -0.5, 'sweep', 710, { woman: true }); // sweeping the corner of the west lane
for (const [x0, x1] of [[-48, -40], [-20, -6], [11, 17]]) add({ k: 'drain', x: (x0 + x1) / 2, z: 297.7, len: x1 - x0 });

// ---- Counter Lane, south side: low things only (hawkers' mats, street tea, a food cart, a trishaw)
addAll([
  ['hawkerMat', -51.2, 303.4, { seed: 1 }], ['lowTea', -43.2, 303.7, { seed: 2 }], ['planters', -36.4, 302.6, { seed: 5 }],
  ['lowTea', -22.0, 303.6, { seed: 3 }], ['hawkerMat', -15.2, 303.4, { seed: 4 }], ['foodCart', -8.4, 303.8, { kind: 'mohinga', seed: 2 }], ['planters', -2.2, 302.6, { seed: 7 }],
  ['hawkerMat', 12.4, 303.4, { seed: 6 }], ['foodCart', 17.6, 303.6, { kind: 'cane', seed: 5 }], ['trishaw', 34.0, 304.0, { seed: 3 }], ['planters', 37.4, 303.0, { seed: 9 }],
]);
add({ k: 'aFrame', x: -6.6, z: 303.0, ry: -0.3, lines: ['မုန့်ဟင်းခါး', '၅၀၀'] });
folk(-51.2, 302.65, 0, 'squat', 711, { woman: true }); // the hawkers squat behind their mats
folk(-15.2, 302.65, 0, 'squat', 712, { woman: true });
folk(12.4, 302.65, 0, 'squat', 713);
folk(-8.4, 303.0, 0, 'stand', 714, { woman: true }); // the mohinga seller behind her cart
folk(17.6, 302.9, 0, 'stand', 715); // the cane-juice man
folk(-43.95, 303.7, PI / 2, 'sit', 716, { stool: false }); // two at the street tea table
folk(-42.45, 303.7, -PI / 2, 'read', 717, { stool: false });
folk(-22.0, 303.05, 0, 'pour', 718, { stool: false, woman: true });
folk(33.0, 302.9, -PI / 2, 'carry', 719, { load: '#E8E0CC' }); // a porter by the trishaw
add({ k: 'postmark', x: -30.5, z: 307.5, seed: 5 });

// ---- the tea-shop street (x 29) and its square: Daw Tin Tin's tea shop on the square's north side, the pump
// straight across from its door; two little shophouses on the square's west part
const TEA = add({ k: 'teaShop', x: 22.9, z: 309.5, w: 7, d: 7 });
add({ k: 'paving', x: 18.1, z: 317.0, w: 17, d: 8 });
add({ k: 'pump', x: 23.0, z: 317.2 });
house(12.0, 4.6, 6.5, 313.0, 26, 'stamp', { shop: true });
house(16.8, 4.6, 6.5, 313.0, 27, 'env', { shop: true });
add({ k: 'bench', x: 25.4, z: 320.2, ry: 0 });
folk(25.0, 320.1, 0, 'read', 720, { stool: false });
add({ k: 'lowTea', x: 19.6, z: 315.4, seed: 9 });
folk(18.85, 315.4, PI / 2, 'sit', 721, { stool: false });
folk(20.35, 315.4, -PI / 2, 'sit', 722, { stool: false, woman: true });
add({ k: 'hopscotch', x: 13.6, z: 320.4 });
folk(13.0, 318.4, 0.3, 'kid', 723);
folk(14.6, 317.6, -2.4, 'kid', 724, { woman: true });
add({ k: 'planters', x: 10.6, z: 320.4, seed: 9 });
add({ k: 'dog', x: 26.0, z: 317.6, ry: 1.1, seed: 2 });
add({ k: 'cat', x: 21.55, z: 311.9, ry: 0.4 }); // on the tea shop's veranda edge
add({ k: 'stoolRow', x: 17.0, z: 313.55, n: 4, seed: 3 });
for (const [x, z] of [[9.9, 313.4], [26.4, 313.6]]) add({ k: 'lamp', x, z });
// between the square and Rice Lane's houses: back yards
addAll([['bambooFence', 13.4, 321.9, { len: 7.2 }], ['bambooFence', 22.0, 321.9, { len: 7.2, gate: true }], ['bananas', 11.0, 323.2, { seed: 4 }], ['potRack', 18.4, 323.2, { seed: 6 }]]);
// the tea shop's back yard (Counter Lane side): firewood, jars, the well, a washing line
addAll([['woodpile', 20.6, 305.2, {}], ['jars', 25.2, 305.0, {}]]);
// east of the tea-shop street: Daw Yi's yard (firewood, rice sacks, a well), a goat, banana plants, a padauk
addAll([
  ['well', 34.2, 309.4, {}], ['laundry', 35.0, 314.0, { len: 3.4 }], ['woodpile', 33.0, 320.6, {}], ['sacks', 36.4, 321.0, { seed: 24 }],
  ['bananas', 37.2, 306.4, { seed: 7 }], ['goat', 33.4, 316.8, { ry: 0.6 }], ['tufts', 32.6, 305.4, { seed: 81 }], ['hens', 36.6, 317.8, { seed: 82 }],
]);
folk(35.8, 313.3, 0.2, 'stand', 725, { woman: true }); // hanging the washing
add({ k: 'padauk', x: 37.6, z: 323.4, s: 1.3 }); // the free-food shop's padauk

// ---- Rice Lane: Daw Yi's free-food shop at the tea-shop street's far end; houses along the north frontage
const RF = FRONT(RICE_Z); // 331.4
house(-24.0, 6.4, 7, RF, 31, 'env');
house(-17.2, 6.4, 7, RF, 32, 'stamp', { shop: true });
house(-10.4, 6.4, 7, RF, 33, 'parcel', { sign: 'ဆန်ဆိုင်' });
house(-3.6, 6.4, 7, RF, 34, 'env', { shop: false });
add({ k: 'waterPots', x: 2.0, z: 330.4 });
house(12.4, 5.4, 7, RF, 35, 'stamp', { shop: true });
house(18.0, 5.4, 7, RF, 36, 'env', { shop: false });
house(23.6, 5.4, 7, RF, 37, 'env', { shop: true });
const RICE = add({ k: 'riceShop', x: 34.2, z: RF - 3.25, w: 7, d: 6.5 });
folk(31.8, 331.85, 0, 'sit', 726, { stool: false }); // waiting their turn on the benches: nobody asks them anything
folk(36.6, 331.85, 0, 'sit', 727, { stool: false, woman: true });
for (const x of [-27.6, -6.9, 4.0, 26.6]) add({ k: 'lamp', x, z: 331.95 });
// Rice Lane, south side: low things
addAll([
  ['hawkerMat', -20.0, 337.4, { seed: 21 }], ['lowTea', -12.6, 337.8, { seed: 22 }], ['planters', -4.4, 336.6, { seed: 23 }],
  ['handcart', 12.6, 337.6, { ry: 0.3 }], ['crates', 18.6, 337.0, { seed: 23 }], ['foodCart', 24.2, 337.6, { kind: 'fritter', seed: 7 }], ['sacks', 33.2, 337.2, { seed: 25 }],
]);
add({ k: 'aFrame', x: 26.0, z: 336.9, ry: -0.2, lines: ['ကြော်', '၃ ခု ၁၀၀'] });
folk(24.2, 336.8, 0, 'stand', 728, { woman: true });
folk(-20.0, 336.65, 0, 'squat', 729, { woman: true });
folk(-13.35, 337.8, PI / 2, 'sit', 730, { stool: false });

// ---- Ink Lane: a quieter row of homes on the letter's lower third
const IF = FRONT(INK_Z); // 355.4
// (single-storey homes between the two-storey shops: a quieter lane, and lighter for the phone budget)
const cot = (x, w, d, frontZ, seed, style, extra = {}) => add({ k: 'mkCot', x, z: frontZ - d / 2, w, d, seed, style, ...extra });
cot(-24.0, 6.2, 6, IF, 41, 'lime');
cot(-17.2, 6.2, 6, IF, 42, 'stilt');
house(-10.4, 6.4, 7, IF, 43, 'env', { shop: true });
house(-3.6, 6.4, 7, IF, 44, 'parcel');
cot(12.4, 5.6, 6, IF, 45, 'stilt');
house(18.4, 5.6, 7, IF, 46, 'stamp', { shop: true });
cot(24.6, 5.6, 6, IF, 47, 'lime');
for (const x of [-27.6, -0.2, 4.0, 28.0]) add({ k: 'lamp', x, z: 355.95 });
folk(-17.2, 356.2, 0.3, 'read', 731, { top: '#F4EFE4' }); // an old man reading on his step
add({ k: 'sapling', x: 0.9, z: 354.6, seed: 9 });
add({ k: 'sapling', x: 28.4, z: 352.0, seed: 10, s: 1.1 });

// ---- yards behind the frontages (low and lived in; trees deep in, never right south of a lane)
function fillYard(x0, x1, z0, z1, seed) {
  const r = rng(seed);
  // a split-bamboo fence along the yard's north side (the back of the frontage to the north)
  for (let x = x0 + 0.5; x < x1 - 2; x += 6.5) add({ k: 'bambooFence', x: Math.min(x + 3, x1 - 3), z: z0 + 0.3, len: 5.6, gate: r() < 0.3 });
  // a row near the yard's north side: wash lines, wood, jars, gardens, hens, bananas, pot racks
  let x = x0 + 1 + r() * 2;
  while (x < x1 - 3) {
    const p = r(), z = z0 + 1.6 + r() * 1.4;
    if (p < 0.2) { add({ k: 'laundry', x: x + 1.8, z, len: 3.2 }); if (r() < 0.4) folk(x + 1.2, z + 0.6, PI + 0.3, 'stand', Math.floor(r() * 1e5), { woman: true }); }
    else if (p < 0.3) add({ k: 'woodpile', x: x + 0.8, z });
    else if (p < 0.4) add({ k: 'jars', x: x + 0.8, z });
    else if (p < 0.52) add({ k: 'garden', x: x + 1.5, z, w: 2.8, d: 1.5, seed: Math.floor(r() * 1e5) });
    else if (p < 0.62) add({ k: 'hens', x: x + 0.9, z: z + 0.6, seed: Math.floor(r() * 1e5) });
    else if (p < 0.72) add({ k: 'bananas', x: x + 0.9, z: z + 0.4, seed: Math.floor(r() * 1e5) });
    else if (p < 0.8) add({ k: 'potRack', x: x + 1.2, z, seed: Math.floor(r() * 1e5) });
    else if (p < 0.88) add({ k: 'bikes', x: x + 0.8, z });
    else add({ k: 'flowers', x: x + 0.9, z, seed: Math.floor(r() * 1e5) });
    x += 4.2 + r() * 2.4;
  }
  // a tree or two in the middle depth
  for (let n = Math.max(1, Math.floor((x1 - x0) / 14)); n > 0; n--) add({ k: r() < 0.55 ? 'padauk' : 'rain', x: x0 + 2 + r() * (x1 - x0 - 4), z: z0 + (z1 - z0) * (0.45 + r() * 0.2), s: 0.95 + r() * 0.25 });
  for (let n = Math.floor((x1 - x0) / 5); n > 0; n--) add({ k: 'tufts', x: x0 + 1 + r() * (x1 - x0 - 2), z: z0 + 1 + r() * (z1 - z0 - 2), seed: Math.floor(r() * 1e5) });
}
// (the four back yards fillYard() once laid, behind Counter Lane west, Rice Lane west and between Rice and Ink
// Lanes, are now whole blocks of homes and yards: the town pass, market-town.js, at the end of this file)
void fillYard;
// behind the free-food shop's side of Rice Lane: Daw Yi's vegetable plot, firewood, a banana clump, hens
addAll([['garden', 33.6, 342.6, { w: 4.0, d: 1.8, seed: 91 }], ['garden', 33.6, 345.6, { w: 4.0, d: 1.8, seed: 92 }], ['woodpile', 30.6, 349.4, {}], ['bananas', 37.4, 349.0, { seed: 14 }], ['hens', 30.4, 343.0, { seed: 93 }], ['bambooFence', 33.6, 340.2, { len: 6.4, gate: true }]]);
folk(35.9, 344.2, -0.6, 'squat', 743, { woman: true, hat: 'sun' });

// ---- west of the west lane: the kite field, market gardens, the letter's signature, the margin trees
{
  const r = rng(211);
  add({ k: 'kiteRack', x: -46.0, z: 306.6 });
  add({ k: 'kiteRack', x: -39.0, z: 313.6 });
  add({ k: 'bench', x: -52.4, z: 309.6, ry: 0 });
  folk(-52.8, 309.5, 0, 'sit', 732, { stool: false, woman: true });
  // children flying their own kites (each on their own line, held in their own hands)
  add({ k: 'kiteUp', x: -44.6, z: 317.4, h: 4.6, seed: 3 }); folk(-44.6, 317.4, PI - 0.5, 'kid', 733, { hold: 'kite' });
  add({ k: 'kiteUp', x: -37.4, z: 320.8, h: 4.0, seed: 8 }); folk(-37.4, 320.8, PI - 0.4, 'kid', 734, { hold: 'kite', woman: true });
  add({ k: 'goat', x: -50.6, z: 319.0, ry: 0.4 });
  add({ k: 'hens', x: -41.6, z: 324.4, seed: 51 });
  for (const [k, x, z, s] of [['padauk', -55.4, 314.2, 1.15], ['rain', -49.0, 325.8, 1.2], ['padauk', -35.4, 307.8, 1.0], ['rain', -58.0, 324.6, 1.1]]) add({ k, x, z, s });
  for (let n = 0; n < 9; n++) add({ k: 'tufts', x: -56 + r() * 22, z: 304 + r() * 20, seed: 300 + n });
  // market gardens south of the field (a woman weeding), a well, a wash line
  for (const [x, z, w, d] of [[-52, 334, 4.0, 2.0], [-46.4, 334.6, 3.6, 2.0], [-40.8, 333.8, 3.6, 2.0], [-52, 340.4, 4.0, 2.0], [-46.4, 341.0, 3.6, 2.0], [-40.4, 340.6, 3.2, 2.0]]) add({ k: 'garden', x, z, w, d, seed: Math.floor(x * 13 + z) });
  folk(-46.4, 336.4, 0.4, 'squat', 735, { woman: true, hat: 'sun' });
  add({ k: 'well', x: -35.6, z: 337.0 });
  add({ k: 'laundry', x: -46.0, z: 346.6, len: 3.6 });
  add({ k: 'woodpile', x: -39.0, z: 347.0 });
  add({ k: 'fence', x: -46.0, z: 331.2, len: 14, ry: 0 });
  add({ k: 'signature', x: -46.0, z: 362.0 }); // the letter's sign-off, written large on its last third
  for (const [k, x, z, s] of [['padauk', -56.6, 356.0, 1.1], ['rain', -36.0, 370.0, 1.2], ['padauk', -52.0, 372.6, 1.05], ['rain', -40.6, 354.6, 1.0]]) add({ k, x, z, s });
  // the left margin of the letter: trees and a few gardens down its edge
  for (let z = 266; z < 376; z += 8 + r() * 4) {
    add({ k: r() < 0.5 ? 'padauk' : 'rain', x: -90 + r() * 6, z, s: 0.95 + r() * 0.3 });
    if (r() < 0.6) add({ k: r() < 0.5 ? 'padauk' : 'rain', x: -78 + r() * 8, z: z + 3 + r() * 2, s: 0.95 + r() * 0.3 });
    if (r() < 0.35) add({ k: 'garden', x: -70 + r() * 4, z: z + 1.5, w: 3.0, d: 1.6, seed: Math.floor(z) });
    if (r() < 0.3) add({ k: 'tufts', x: -84 + r() * 16, z: z + r() * 4, seed: Math.floor(z * 7) });
  }
  add({ k: 'hens', x: -68.4, z: 300.6, seed: 61 });
  add({ k: 'goat', x: -72.0, z: 334.0, ry: -0.6 });
}
// ---- south of Ink Lane: the letter's lower third (gardens, a well, parcels waiting for the Wharf)
for (const [x, z, w, d] of [[-24, 364, 3.6, 1.8], [-18.6, 364.6, 3.2, 1.8], [-12.8, 364, 3.6, 1.8], [-24, 370.2, 3.6, 1.8], [-18.4, 370.8, 3.2, 1.8]]) add({ k: 'garden', x, z, w, d, seed: Math.floor(x * 7 + z) });
folk(-18.6, 366.2, -0.3, 'squat', 736, { hat: 'sun' });
add({ k: 'well', x: -6.2, z: 367.0 });
add({ k: 'laundry', x: -3.0, z: 362.4, len: 3.4 });
addAll([['crates', 13.2, 366.0, { seed: 31 }], ['handcart', 17.4, 368.6, { ry: -0.3 }], ['sacks', 12.6, 371.6, { seed: 32 }], ['parcel', 20.4, 364.2, { seed: 33, ry: 0.4 }], ['parcel', 22.0, 365.6, { seed: 34, ry: -0.2 }], ['postmark', 26.0, 372.0, { seed: 9 }], ['goat', -10.8, 368.8, { ry: 0.8 }]]);
folk(15.6, 367.4, 0.8, 'carry', 737, { load: '#D6B486' });
for (const [k, x, z, s] of [['padauk', -27.6, 375.2, 1.1], ['rain', -14.0, 375.8, 1.15], ['padauk', 26.6, 361.8, 1.1], ['rain', 31.6, 370.4, 1.2], ['rain', 35.6, 346.6, 1.0], ['padauk', 34.0, 352.0, 1.0]]) add({ k, x, z, s });
for (const [x, z] of [[9.4, 365.0], [4.8, 374.0], [-27.4, 286.6], [-27.4, 316.2], [-32.6, 345.4]]) add({ k: 'lamp', x, z });
for (let n = 0; n < 8; n++) add({ k: 'tufts', x: -26 + n * 6.2, z: 361 + (n % 3) * 5, seed: 400 + n });

// ---- more life where the low close camera still saw bare paper (pass 3)
// the kite field: a swing under the big rain tree, a see-saw, a fritter cart for the kite-flyers, children at
// chinlone in a ring, a mother with a baby on the bench, flower clumps along the west lane
addAll([
  ['swing', -49.4, 323.4, {}], ['seesaw', -54.6, 318.4, {}], ['foodCart', -33.6, 309.2, { kind: 'fritter', seed: 11 }],
  ['flowers', -33.2, 305.4, { seed: 211 }], ['flowers', -33.0, 316.8, { seed: 212 }], ['flowers', -33.2, 326.0, { seed: 213 }],
  ['baskets', -36.2, 311.6, { seed: 21 }], ['stoolRow', -36.0, 307.4, { n: 3, seed: 12 }],
]);
folk(-33.6, 308.4, 0, 'stand', 760, { woman: true }); // the fritter seller behind her cart
folk(-36.0, 307.4, 0.4, 'sit', 761, { stool: false }); // a kite-flyer's dad eating a fritter
for (const [x, z, ry, seed, girl] of [[-41.4, 312.2, 2.6, 762, 0], [-39.6, 313.0, -2.2, 763, 1], [-40.2, 314.6, 0.2, 764, 0], [-42.0, 314.0, 1.4, 765, 1]]) folk(x, z, ry, 'kid', seed, { woman: !!girl });
folk(-48.7, 324.2, PI, 'kid', 766, { woman: true }); // waiting her turn at the swing
folk(-56.2, 318.9, PI / 2, 'kid', 767); folk(-53.0, 318.9, -PI / 2, 'kid', 768, { woman: true }); // at both ends of the see-saw
for (let n = 0; n < 6; n++) add({ k: 'tufts', x: -52 + n * 3.4, z: 328.4 + (n % 2) * 1.2, seed: 520 + n });
// the letter's lower third, east of the spine (x 10-36, z 360-377): the porters' rest yard before the Wharf road,
// a mat of drying chillies, a wash line, bikes, a little vegetable plot with its fence
addAll([
  ['lowTea', 24.6, 368.4, { seed: 31 }], ['stoolRow', 24.6, 370.0, { n: 3, seed: 13 }], ['trishaw', 30.2, 366.2, { seed: 5, ry: -0.3 }],
  ['hawkerMat', 18.6, 374.0, { seed: 33 }], ['laundry', 30.0, 374.4, { len: 3.4 }], ['bikes', 12.0, 362.4, {}], ['bikes', 12.8, 363.2, {}],
  ['garden', 33.6, 361.4, { w: 3.6, d: 1.8, seed: 141 }], ['bambooFence', 33.6, 359.8, { len: 5.2 }], ['mailSacks', 21.4, 361.8, {}],
  ['flowers', 10.4, 375.2, { seed: 214 }], ['hens', 27.4, 362.6, { seed: 94 }], ['jars', 35.6, 368.4, {}],
]);
folk(23.85, 368.4, PI / 2, 'sit', 770, { stool: false }); // two porters resting over tea
folk(25.35, 368.4, -PI / 2, 'read', 771, { stool: false, top: '#F4EFE4' });
folk(18.6, 373.25, 0, 'squat', 772, { woman: true, hat: 'sun' }); // turning the chillies
folk(29.6, 375.0, PI + 0.3, 'stand', 773, { woman: true }); // pegging the washing
// the west lower third: a second wash line, a pot rack, a wood pile, the well's bucket bench
addAll([['potRack', -9.8, 362.4, { seed: 15 }], ['woodpile', -2.4, 371.4, {}], ['bananas', -27.6, 362.6, { seed: 16 }], ['laundry', -14.6, 375.2, { len: 3.2 }], ['jars', -4.2, 366.8, {}]]);
folk(-6.2, 368.2, 0.3, 'carry', 774, { woman: true, load: '#9FB8C8' }); // carrying water from the well
// the envelope road: a couple of travellers on the way down, a fruit hawker under the trees
addAll([['hawkerMat', 2.4, 230.6, { seed: 41 }], ['baskets', 0.6, 230.0, { seed: 42 }], ['flowers', 19.0, 214.0, { seed: 215 }]]);
folk(2.4, 229.85, 0, 'squat', 775, { woman: true, hat: 'sun' });
folk(9.6, 204.0, PI, 'head', 776, { woman: true, load: '#E8B832' }); // walking down to the Market with a load
folk(5.4, 236.4, 0.2, 'carry', 777, { load: '#D6B486' });
// a roadside tea table where the road bends (carters stop here on the way down), a cottage garden with hens
addAll([
  ['lowTea', 13.8, 229.2, { seed: 43 }], ['stoolRow', 13.8, 230.8, { n: 3, seed: 14 }], ['handcart', 17.0, 227.6, { ry: 0.5 }],
  ['garden', -12.6, 200.4, { w: 3.6, d: 1.8, seed: 142 }], ['garden', -12.6, 203.2, { w: 3.6, d: 1.8, seed: 143 }], ['fence', -12.6, 198.6, { len: 5, ry: 0 }],
  ['hens', -9.0, 204.6, { seed: 95 }], ['goat', 21.0, 196.6, { ry: -0.8 }], ['tufts', 13.0, 186.0, { seed: 530 }], ['tufts', -3.0, 222.0, { seed: 531 }],
  ['flowers', -5.8, 177.6, { seed: 216 }], ['sapling', 20.0, 238.4, { seed: 11 }], ['potRack', -16.2, 205.0, { seed: 17 }],
]);
folk(13.05, 229.2, PI / 2, 'sit', 778, { stool: false }); // a carter and the tea aunty
folk(14.6, 229.7, -PI / 2 - 0.4, 'pour', 779, { stool: false, woman: true });
folk(-12.6, 202.0, 0.3, 'squat', 780, { woman: true, hat: 'sun' }); // weeding her beans
// the strip behind Stamp Lane's north stalls, up against the letter's top fold: wash lines, a bench, bikes, gardens
addAll([
  ['laundry', -55.0, 260.4, { len: 3.4 }], ['garden', -35.6, 260.8, { w: 3.6, d: 1.6, seed: 144 }], ['bench', -24.8, 261.0, { ry: 0 }],
  ['laundry', -12.4, 260.6, { len: 3.2 }], ['hens', -5.0, 260.4, { seed: 96 }], ['bikes', 27.6, 262.6, {}], ['potRack', 30.4, 262.8, { seed: 18 }],
  ['tufts', -44.0, 260.0, { seed: 532 }], ['tufts', -18.0, 259.6, { seed: 533 }], ['flowers', -31.6, 266.0, { seed: 217 }],
]);
folk(-25.0, 261.2, 0, 'read', 781, { stool: false, top: '#F4EFE4' }); // reading the paper in the stalls' shade
folk(-12.0, 261.4, PI + 0.4, 'stand', 782, { woman: true }); // hanging the stall cloths to dry
// the printers' yard and the back of the letter-writer's house
addAll([['garden', -25.0, 281.4, { w: 3.2, d: 1.6, seed: 145 }], ['laundry', -6.6, 288.8, { len: 3.0 }], ['hens', -5.4, 284.2, { seed: 97 }], ['jars', -26.0, 289.6, {}]]);
folk(-18.6, 284.0, 1.2, 'carry', 783, { load: '#FBF6EA' }); // a printer with a ream to the drying lines

// ---- the fill pass (market-fill.js): homes and yards on the envelope road, the left margin, the gardens' south
// edge and the letter's bottom edge; each thing there checks it is clear of everything above and of the lanes
export const FILLED = fill({ ITEMS, add, folk });

// ---------------------------------------------------------------------------------
// Doors into rooms (doors.js): x, z = the threshold just in front of the doorway; facing 0 = looking south
// ---------------------------------------------------------------------------------
const poFront = PO.z + PO.d / 2; // 297.4
const kolwinDoorX = CARV.x - CARV.w / 2 + (CARV.w / 3) * 2.5 - 0.4;
export const DOORS = [
  { room: 'marketpost', x: PO.x + poDoorX(PO.w), z: poFront + 0.35, facing: 0, r: 0.85 },
  { room: 'postroom', x: PO.x + poRoomX(PO.w), z: poFront + 0.35, facing: 0, r: 0.7 },
  { room: 'carvershop', x: kolwinDoorX, z: CARV.z + CARV.d / 2 - 1.4 + 0.3, facing: 0, r: 0.75 },
  { room: 'sundries', x: SUN.x, z: SUN.z + SUN.d / 2 + 0.35, facing: 0, r: 0.75 },
  { room: 'teashop', x: TEA.x, z: TEA.z + TEA.d / 2 - 1.2 + 0.3, facing: 0, r: 0.8 },
  { room: 'riceshop', x: RICE.x, z: RICE.z + RICE.d / 2 + 0.35, facing: 0, r: 0.8 },
];

// ---------------------------------------------------------------------------------
// Bookmark Desks (INDEX 7)
// ---------------------------------------------------------------------------------
export const DESKS = [
  { id: 'mgate', name: { my: 'စာအိတ်ဈေး အဝင်', en: 'Market entrance' }, x: 11.4, z: 262.4, ry: 0 },
  { id: 'counter', name: { my: 'စာတိုက်ကောင်တာဘေး', en: 'By the letter counter' }, x: 27.6, z: 296.8, ry: 0 },
];

// ---------------------------------------------------------------------------------
// Spots the day scripts use (world metres; h = heading, 0 faces +Z / the camera)
// ---------------------------------------------------------------------------------
const flagAt = (n) => ({ x: PO.x + poFlagX(PO.w, n), y: 4.31, z: poFront + 0.18 });
const CB = (i) => CARV.x - CARV.w / 2 + (CARV.w / 3) * (i + 0.5) - 0.2; // carvers' bench i (0, 1)
export const SPOTS = {
  crease: { x: 7, z: 258 },                       // where the envelope road comes over the fold onto the letter
  gateSign: { x: -3.2, z: 260.6 },
  riceCart: { x: 2.6, z: 261.4 }, kyar: { x: 3.9, z: 262.7, h: -0.4 },
  mapStall: { x: 12.0, z: STALL_Z }, yaung: { x: 12.4, z: STALL_Z - 0.3, h: 0 },
  pyoneStall: { x: 21.6, z: STALL_Z }, pyone: { x: 21.2, z: STALL_Z - 0.3, h: 0 },
  shortcutMouth: { x: SHORTCUT_X, z: STAMP_Z + 2.5 },    // the gap's mouth on Stamp Lane's south footpath
  naychiShortcut: { x: SHORTCUT_X, z: SOUTH_Z1 + 1.4, h: 0 }, // Nay Chi in the gap, facing the crates
  shortcutCrates: { x: SHORTCUT_X, z: SOUTH_Z2 + 1.75 },  // the dead end (tap target)
  dogStone: { x: 29.9, z: 281.4 },                // the flat stone: the three bowls go here
  dogs: [{ x: 28.8, z: 282.3, h: PI - 0.5 }, { x: 30.9, z: 282.9, h: PI }, { x: 32.4, z: 281.9, h: PI + 0.5 }], // props3 streetDog x3 (not baked)
  rainTree: { x: 31.6, z: 280.4 },
  postOffice: { x: PO.x, z: PO.z, w: PO.w, d: PO.d },
  postDoor: { x: PO.x + poDoorX(PO.w), z: poFront + 0.35 }, postroomDoor: { x: PO.x + poRoomX(PO.w), z: poFront + 0.35 },
  flagPulley: flagAt, // reply flag n (၁ east .. ၁၆ west); ၁၄ is down (baked)
  flag14: flagAt(14),
  thiriTable: { x: 15.4, z: 296.7 }, thiriPost: { x: 16.9, z: 297.6, top: 1.7 }, thiri: { x: 15.4, z: 295.95, h: 0 },
  thanaka: { x: 12.6, z: 296.6 }, pwapwa: { x: 12.6, z: 295.8, h: 0 },
  counterDesk: { x: 27.6, z: 296.8 },
  carvers: { x: CARV.x, z: CARV.z }, khwarnyoBench: { x: CB(0), z: CARV.z + 2.4 }, kolwinBench: { x: CB(1), z: CARV.z + 2.4 },
  khwarnyo: { x: CB(0), z: CARV.z + 1.85, h: 0 }, kolwin: { x: CB(1), z: CARV.z + 1.85, h: 0 },
  kolwinDoor: { x: kolwinDoorX, z: CARV.z + 1.9 }, kolwinChimney: { x: kolwinDoorX + 1.0, y: 5.3, z: CARV.z - 0.6 }, // smoke after ch 10
  kolwinOutside: { x: 27.4, z: 298.6, h: -0.4 },  // Day 6: by the post office's east end (the desk corner)
  sundriesDoor: { x: SUN.x, z: SUN.z + SUN.d / 2 + 0.35 },
  teaDoor: { x: TEA.x, z: TEA.z + TEA.d / 2 - 0.9 }, teaVeranda: { x: TEA.x, z: TEA.z + TEA.d / 2 - 0.45 }, teaDoorStools: [{ x: TEA.x - 1.5, z: TEA.z + 3.55 }, { x: TEA.x + 1.5, z: TEA.z + 3.55 }],
  teaChimney: { x: TEA.x + 2.0, y: 5.6, z: TEA.z - 1.6 }, teaAwning: { x: TEA.x, y: 2.5, z: TEA.z + 3.3 }, // slate 1 lands on the awning (Day 6)
  pump: { x: 23.0, z: 317.2 }, pumpHandle: { x: 23.0, z: 316.2 }, square: { x: 18.1, z: 317.0 },
  naychiCorner: { x: 28.4, z: 302.6, h: 0.3 },    // the tea-shop street corner (Day 4, after she is told)
  riceDoor: { x: RICE.x, z: RICE.z + RICE.d / 2 + 0.35 }, ricePadauk: { x: 37.6, z: 323.4 },
  southLane: { x: 7, z: 366 }, toWharf: { x: 7, z: 378 }, toJunction: { x: 39, z: 300 },
};

// ---- the town pass (market-town.js): homes, shophouses, yards and back lots on every block, laid last so each one
// checks it is clear of everything above, of the lanes, of the doors, desks, spots and townsfolk (2 m) before it goes down
const KEEP = [...DOORS, ...DESKS, ...FOLK_PEOPLE]; // (and where the townsfolk with hellos stand)
for (const v of Object.values(SPOTS)) for (const p of Array.isArray(v) ? v : [v]) if (p && typeof p === 'object' && Number.isFinite(p.x)) KEEP.push(p);
export const TOWN = town({ ITEMS, add, folk, defs: { ...ART, ...PROP }, keep: KEEP });

/** day4-market.js's MK, same shape, same names: Day 4 can import this instead of its own copy. */
export const MK = {
  crease: { x: 7, z: 258.4 },
  cart: { x: 2.6, z: 261.4 }, kyar: { x: 3.9, z: 262.7, h: -0.4 },
  mapStall: { x: 12.0, z: STALL_Z }, yaung: { x: 12.4, z: STALL_Z - 0.3, h: 0 },
  north: [[15.2, 'red'], [18.4, 'green'], [21.6, 'gold'], [24.8, 'red']], northZ: STALL_Z,
  pyone: { x: 21.2, z: STALL_Z - 0.3, h: 0 },
  benches: [{ x: CB(0), z: CARV.z + 2.4 }, { x: CB(1), z: CARV.z + 2.4 }],
  khwarnyo: { x: CB(0), z: CARV.z + 1.85, h: 0 }, kolwin: { x: CB(1), z: CARV.z + 1.85, h: 0 },
  south: [[SHORTCUT_X - 2.15, 'gold'], [SHORTCUT_X + 2.15, 'green']], southZ: SOUTH_Z1,
  gap: { x: SHORTCUT_X, z: SOUTH_Z1 }, crates: { x: SHORTCUT_X, z: SOUTH_Z2 + 1.75 }, naychi: { x: SHORTCUT_X, z: SOUTH_Z1 + 1.4, h: 0 },
  tree: { x: 31.6, z: 280.4 }, stone: { x: 29.9, z: 281.4 }, dogs: [[28.8, 282.3, 'tan', true], [30.9, 282.9, 'black', false], [32.4, 281.9, 'brindle', false]],
  thanaka: { x: 12.6, z: 296.6 }, pwapwa: { x: 12.6, z: 295.8, h: 0 },
  table: { x: 15.4, z: 296.7 }, thiri: { x: 15.4, z: 295.95, h: 0 }, post: { x: 16.9, z: 297.6 },
  postOffice: { x: PO.x, z: PO.z, w: PO.w, d: PO.d },
  sundries: { x: SUN.x, z: SUN.z, w: SUN.w, d: SUN.d },
  teaShop: { x: TEA.x, z: TEA.z, w: TEA.w, d: TEA.d }, pump: { x: 23.0, z: 317.2 },
  square: { minX: 9.6, maxX: 26.6, minZ: 313.0, maxZ: 321.0 },
  riceShop: { x: RICE.x, z: RICE.z, w: RICE.w, d: RICE.d }, padauk: { x: 37.6, z: 323.4 },
  streetCorner: { x: 28.4, z: 302.6, h: 0 },
  porch: { x: 8.4, z: 65.2 }, evTeacher: { x: 9.5, z: 65.9, h: -0.4 }, // (the Quarter: unchanged from day4-market.js)
  flag14: flagAt(14),
};

// ---------------------------------------------------------------------------------
// Townspeople out on the lanes (people indoors belong to the rooms: U Lu Aye, Ma Yu Yu, Daw Tin Tin, Daw Yi,
// Ko Phyo). hello = a short line that carries the chapter's point and never points the way; the day scripts
// give them their real lines. (Everyone else on the lanes is a still `folk` figure: no draw call of its own.)
// ---------------------------------------------------------------------------------
const job = (x, z, h, r, mood = 'work', workChance = 0.8, workFor = [6, 14]) => ({ area: { x, z, r }, spot: { x, z, h }, mood, workChance, workFor });
export const PEOPLE = [
  { id: 'kyar', x: 3.9, z: 262.7, heading: -0.4, hello: { my: 'ကိုယ့်လယ်က ဆန်လေ။ ဘယ်ကို ပေးမလဲ ကိုယ် ရွေးပြီးပြီ။', en: "Rice from my own field. I've chosen where it goes." }, job: job(3.9, 262.7, -0.4, 1.4, 'work', 0.7, [6, 12]) },
  { id: 'yaung', x: 12.4, z: STALL_Z - 0.3, heading: 0, hello: { my: 'မာရာ့လမ်း! လမ်းမပျောက်ချင်ရင် မာရာ့နောက် လိုက်!', en: "Maya's Way! Don't want to get lost? Follow Maya!" }, job: job(12.4, STALL_Z - 0.3, 0, 1.0) },
  { id: 'pyone', x: 21.2, z: STALL_Z - 0.3, heading: 0, hello: { my: 'ဆိုင်ရှေ့ ပိတ်မရပ်နဲ့! စာအိတ် မရွေးရင် ဘေးဖယ်။', en: "Don't block my stall! Not choosing envelopes? Move aside." }, job: job(21.2, STALL_Z - 0.3, 0, 1.0) },
  { id: 'pwapwa', x: 12.6, z: 295.8, heading: 0, hello: { my: 'သနပ်ခါး ကိုယ့်လက်နဲ့ သွေးမှ မွှေးတယ်။ သူများ သွေးပေးတာ စောင့်နေရင် နေကုန်သွားမယ်။', en: "Thanaka smells sweetest ground by your own hand. Wait for someone else to grind it and the day is gone." }, job: job(12.6, 295.8, 0, 0.9, 'work', 0.85, [8, 16]) },
  { id: 'thiri', x: 15.4, z: 295.95, heading: 0, hello: { my: 'စာတိုက်အလံ မြင့်လာမလား မသိဘူး…', en: 'I wonder if the post-office flag will go up…' }, job: job(15.4, 295.95, 0.2, 1.2, 'read', 0.6, [5, 10]) },
  { id: 'khwarnyo', x: CB(0), z: CARV.z + 1.85, heading: 0, hello: { my: 'သုံးဆယ့်ရှစ်… သုံးဆယ့်ကိုး… စမ်းတုံး လေးဆယ်ပြည့်ရင် ပြိုင်ပွဲ တင်မယ်။', en: "Thirty-eight… thirty-nine… at forty trial blocks I'll enter the contest." }, job: job(CB(0), CARV.z + 1.85, 0, 0.6, 'work', 0.9, [10, 20]) },
  { id: 'kolwin', x: CB(1), z: CARV.z + 1.85, heading: 0, hello: { my: 'ငါ့တပည့်ဟောင်းလား။ သူ့ဘာသာ ထုပါစေ။', en: 'My old pupil? Let her carve on her own.' }, job: job(CB(1), CARV.z + 1.85, 0, 0.6, 'work', 0.9, [10, 20]) },
  ...FOLK_PEOPLE, // townsfolk at their work (market-folk.js; they appear once cast.js lists them)
  ...TOWN.TOWN_PEOPLE, // and the town pass's (market-townfolk.js; the same: once cast.js lists them)
];
export const SIGNS = [];
