// District 4 · Newsprint Junction, the Fold (west bridgehead opens Day 7; east side first crossed Day 8;
// the press again Day 14). A sheet of newsprint folded down the middle: the fold is a valley with the
// cloud-stream at its bottom (the hole below), the west lip is the bridgehead square at the end of the Market
// road, the east side is the Junction proper. day7-spec 1.2, day8-spec, day14-spec 12.5; INDEX 7, 13, 14.
// Region file format: regions/index.js. Buildings and props: ../art/junction.js (ART / PROP) and
// ./junction-props.js (street life). This file is the ONE home of the Junction's buildings and DOORS: every
// day sees the same hut, letter house, tea shop, school and press at the same place.
//
// Lessons (INDEX 14): ch 12 "don't believe just because it is said, old, printed or your own sum: look
// yourself" and ch 13 "one deed reads 6 to you and 9 to the other; knowledge does good only with goodwill".
// The street says them without pointing anywhere: a newspaper stall chalks "the well has run dry!" while the
// well stands full; Ko Min pastes whatever he is given; Daw Hla came to look for herself; a big 6 painted
// between two benches that face each other reads 9 from the other one. No markers, arrows, pins or glows.
//
// STREET PLAN (+X east, +Z south; fronts face +Z, the street camera; only low things just south of a street)
//
//   WEST BANK (x 39 .. 79)
//   z 300  the Market road arrives (jWest) and widens into the bridgehead square (jSqW 64): north side, west ->
//          east: a betel shop, two houses, the water pot, THE BRIDGE HANDS' HUT (x 66.5, set back, door 294.3),
//          Nay Chi's bridge board by the bridge mouth; the old rope footbridge from the lip (79, 293) to the
//          middle pier (99, 293). South of the square: the bridge-builders' timber, bundles, the desk foldWest.
//   x 63   a pencil footpath south from the square to the bridge hands' cottages and a bench on the lip (72, 356)
//
//   EAST BANK (x 119 .. 189)
//   z 300  the bridge-foot street (foldE 119 -> jSqE 148): north side: MA THIDA'S LETTER HOUSE (124.6), the red
//          bridge-box, Ko Min's poster hoarding in the alley, KO MIN'S CORNER (sign painter, 133), DAW SEIN'S
//          TEA SHOP (139.6) and her cart; [the road north, x 148, to Hearth Row]; the notice board (151.6), THE
//          JUNCTION SCHOOL (159.6), the newspaper stall, THE GOLD INK PRESS (172), two houses.
//          The press street runs on east (jSqE -> jEast 184) and turns south down the east edge to Ink Lane.
//   the square (x 138 .. 164, z 298 .. 315): newsprint paving with the fold crease through the gold-ink well
//          (149.6, 305); the desk `well`; two benches facing each other across a painted 6 (158.5, 312).
//   z 338  Ink Lane (jSE 184 -> jInkW 122): a row of houses and two shops on its north side, yards behind them
//          (back to the square), gardens and hens south of it, a bench on the lip at its west end.
//   z 258 .. 290  behind the north frontage: yards, two cottages, the school yard, the hen run behind the press.
//
// Doors (doors.js): bridgehut, letterroom, junctiontea, schoolroom, press. Desks: foldWest, well.
// Live twins: a day that plays with props4's bridgeBoard, ropeFootbridge, middlePier, goldInkWell, bridgeBox,
// teaCart, stepLadder, doorEasel or slipBoard calls useLive(ow, [names], true) to hide the static one here
// (keep-out stays) and useLive(ow, [names], false) in dispose().
import { rng } from '../kit.js';
import { ART as J_ART, PROP as J_PROP, LIVE } from '../art/junction.js';
import { PROP as J_STREET } from './junction-props.js';
import { PROP as J_FOLK } from './junction-folk.js';
import { PROP as J_VERGE } from './junction-verge.js';
import { ART as FILL_ART, PROP as FILL_PROP, fill } from './junction-fill.js';
import { FOLK_PEOPLE } from './junction-people.js';

export const ART = { ...J_ART, ...FILL_ART };
// the rope footbridge, the middle pier and the press's door easel have live twins too (props4): hide them as well
// while a day stands its own (useLive), like the board, box, cart, ladder, well and slip board already do
const liveSkip = (d) => ({ ...d, draw: (g, f, it, ctx) => (it.live && LIVE.has(it.live) ? undefined : d.draw(g, f, it, ctx)) });
export const PROP = { ...J_PROP, ...J_STREET, ...J_FOLK, ...J_VERGE, ...FILL_PROP, jRope: liveSkip(J_PROP.jRope), jPier: liveSkip(J_PROP.jPier), jEasel: liveSkip(J_PROP.jEasel) };

export const FOLD = [79, 258, 119, 378]; // the valley (x0, z0, x1, z1): no paper, the cloud-stream below

export const REGION = {
  id: 'junction', name: { my: 'သတင်းစာလမ်းဆုံ', en: 'Newsprint Junction' }, rect: [39, 258, 189, 378], paper: 'newsprint', label: [150, 268],
  holes: [FOLD], stream: true,
};

// ---------------------------------------------------------------------------------
// Roads
// ---------------------------------------------------------------------------------
const MAIN_Z = 300, INK_Z = 338, EAST_X = 184;
export const ROAD_NODES = [
  { id: 'jWest', x: 39, z: MAIN_Z },
  { id: 'jSqW', x: 64, z: MAIN_Z },
  { id: 'foldW', x: 79, z: MAIN_Z },
  { id: 'foldE', x: 119, z: MAIN_Z },
  { id: 'jSqE', x: 148, z: MAIN_Z },
  { id: 'jNorth', x: 148, z: 258 },
  { id: 'jEast', x: EAST_X, z: MAIN_Z },
  { id: 'jSE', x: EAST_X, z: INK_Z },
  { id: 'jInkM', x: 144, z: INK_Z },
  { id: 'jInkW', x: 122.5, z: INK_Z },
  { id: 'jSqS', x: 143.5, z: 315.5 },
  { id: 'jwLook', x: 72.5, z: 356 },
];
const EW = { sample: 0.5, bias: 0.003 };
export const ROAD_EDGES = [
  { id: 'jIn', a: 'jWest', b: 'jSqW', ...EW },
  { id: 'jMouth', a: 'jSqW', b: 'foldW', ...EW },
  { id: 'foldBridge', a: 'foldW', b: 'foldE', sample: 0.5, style: 'deck', deck: 4.4, gate: 'bridgeOpen', look: 'boom' },
  { id: 'jOut', a: 'foldE', b: 'jSqE', ...EW },
  { id: 'jUp', a: 'jSqE', b: 'jNorth', sample: 0.5 },
  // the press street, east from the square (the Gold Ink Press first on its north side), then down the east edge
  { id: 'jPressSt', a: 'jSqE', b: 'jEast', ...EW },
  { id: 'jEastDown', a: 'jEast', b: 'jSE', sample: 0.5 },
  // Ink Lane, back west to the lip
  { id: 'jInk1', a: 'jSE', b: 'jInkM', ...EW },
  { id: 'jInk2', a: 'jInkM', b: 'jInkW', ...EW },
  // footpaths (pencil lines on the paper): the square's south side down to Ink Lane; the west bank's lane
  { id: 'jWellPath', a: 'jSqS', b: 'jInkM', pts: [[143.5, 315.5], [142.6, 324], [144, 338]], sample: 0.5, style: 'pencil' },
  { id: 'jwLane', a: 'jSqW', b: 'jwLook', pts: [[64, 300], [63.2, 312], [62, 326], [62.6, 340], [66.4, 350], [72.5, 356]], sample: 0.5, style: 'pencil' },
];

// ---------------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------------
export const ITEMS = [];
export const OBSTACLES = [];
const add = (o) => (ITEMS.push(o), o);
const FRONT = (z) => z - 2.6; // a street's north frontage: building fronts stand here
const MF = FRONT(MAIN_Z); // 297.4
const IF = FRONT(INK_Z); // 335.4
const row = (x, w, d, frontZ, seed, extra = {}) => add({ k: 'jHouse', style: 'row', x, z: frontZ - d / 2, w, d, seed, ...extra });
const cottage = (x, w, d, frontZ, seed, extra = {}) => add({ k: 'jHouse', style: 'cottage', x, z: frontZ - d / 2, w, d, seed, ...extra });
const lamp = (x, z) => add({ k: 'lamp', x, z });
const tree = (k, x, z, s = 1) => add({ k, x, z, s });

// ============ WEST BANK =============================================================
// ---- the Market road's last stretch: a betel shop, two houses (fronts on the road)
row(42.4, 5.4, 6.5, MF, 1, { shop: true, awning: '#3D8A84' });
add({ k: 'jPostSign', x: 42.4, z: MF + 0.75, w: 1.4, text: { my: 'ကွမ်းယာ', en: 'Betel' }, color: '#8E2730' });
row(48.6, 5.6, 6.5, MF, 2, { shop: false });
cottage(55.2, 5.4, 6.0, MF, 3);
add({ k: 'jWaterPot', x: 60.6, z: 295.6 });
add({ k: 'planters', x: 59.6, z: 297.6, seed: 2 });
// ---- THE BRIDGE HANDS' HUT (room bridgehut), set back on the square's north side; Nay Chi's bridge board
const HUT = add({ k: 'jHut', x: 66.5, z: 291.4, w: 6.2, d: 5 });
add({ k: 'jBoard', x: 76.0, z: 294.3, ry: -0.9, live: 'bridgeBoard' });
// the old rope footbridge from the lip to the middle pier, halfway across the clouds
add({ k: 'jRope', x: 79, z: 293, len: 19, live: 'ropeFootbridge' });
add({ k: 'jPier', x: 99, z: 293, live: 'middlePier' });
// the square's newsprint paving (the road runs on over it), lamps (west of the hut, and at the bridge mouth)
add({ k: 'jPaving', x: 67, z: 300.5, w: 22, d: 15, seed: 21, open: ['w', 'e'] });
lamp(60.5, 297.4); lamp(74.6, 297.4); lamp(77.6, 302.8);
// ---- the lip of the fold (a low rope rail; gaps at the rope footbridge and the bridge mouth)
add({ k: 'jLip', x: 78.7, z: 284.0, len: 16.0, ry: Math.PI / 2 });
add({ k: 'jLip', x: 78.7, z: 295.7, len: 2.8, ry: Math.PI / 2 });
add({ k: 'jLip', x: 78.7, z: 318.0, len: 30.8, ry: Math.PI / 2 });
// ---- south of the square (low near the road): the bridge-builders' timber, bundles, crates; the desk foldWest
add({ k: 'jTimber', x: 57.4, z: 312.0, ry: 0.1, seed: 4 });
add({ k: 'jBundles', x: 69.0, z: 311.8, seed: 3, n: 3 });
add({ k: 'jCrates', x: 76.2, z: 312.6, seed: 2 });
add({ k: 'bench', x: 51.6, z: 303.8, ry: 0 });
add({ k: 'flowers', x: 47.2, z: 303.4, seed: 71 });
add({ k: 'hawkerMat', x: 44.2, z: 303.6, seed: 31 });
add({ k: 'jDog', x: 54.6, z: 304.6, ry: 0.6 });
// ---- behind the north frontage (yards to the page's top edge)
for (const [k, x, z, extra] of [
  ['laundry', 44.6, 287.0, { len: 3.4 }], ['woodpile', 50.0, 287.4, {}], ['jars', 53.4, 287.6, {}], ['jBanana', 57.2, 287.2, { s: 1.1 }],
  ['garden', 45.0, 281.4, { w: 3.6, d: 1.8, seed: 41 }], ['garden', 50.4, 281.0, { w: 3.2, d: 1.8, seed: 42 }], ['hens', 55.4, 281.8, { seed: 43 }],
  ['jTimber', 68.0, 284.4, { seed: 9, ry: -0.2 }], ['jSheets', 73.4, 286.6, { len: 3.4, seed: 7 }], ['jCrates', 61.6, 286.0, { seed: 5 }],
  ['fence', 47.6, 278.4, { len: 9, ry: 0 }], ['tufts', 60.4, 279.0, { seed: 44 }], ['tufts', 70.6, 278.4, { seed: 45 }],
]) add({ k, x, z, ...extra });
for (const [k, x, z, s] of [['padauk', 42.6, 263.6, 1.1], ['rain', 51.0, 265.0, 1.15], ['padauk', 59.8, 262.8, 1.0], ['rain', 68.2, 266.2, 1.2], ['padauk', 75.0, 263.2, 1.05], ['padauk', 46.4, 272.4, 0.95], ['rain', 64.0, 273.4, 1.0]]) tree(k, x, z, s);
// ---- the bridge hands' cottages down the pencil lane, and the bench on the lip at its end
cottage(53.6, 5.4, 5.6, 326.0, 4);
cottage(53.2, 5.0, 5.4, 343.2, 5);
cottage(71.0, 5.2, 5.6, 333.0, 6);
for (const [k, x, z, extra] of [
  ['laundry', 54.0, 317.6, { len: 3.4 }], ['garden', 47.0, 330.6, { w: 3.4, d: 1.8, seed: 51 }], ['hens', 58.0, 330.8, { seed: 52 }], ['jars', 49.6, 323.8, {}],
  ['woodpile', 68.0, 324.6, {}], ['garden', 74.0, 338.6, { w: 3.0, d: 1.6, seed: 53 }], ['jBanana', 66.6, 336.0, {}], ['well', 57.6, 336.6, {}],
  ['garden', 46.6, 347.6, { w: 3.4, d: 1.8, seed: 54 }], ['laundry', 54.0, 349.4, { len: 3.2 }], ['goat', 59.2, 352.6, { ry: 0.4 }], ['flowers', 70.0, 345.2, { seed: 55 }],
  ['bench', 76.2, 356.0, { ry: Math.PI / 2 }], ['tufts', 45.0, 360.0, { seed: 56 }], ['tufts', 66.0, 364.0, { seed: 57 }], ['hens', 48.4, 338.2, { seed: 58 }],
]) add({ k, x, z, ...extra });
for (const [k, x, z, s] of [['rain', 44.0, 318.4, 1.1], ['padauk', 75.0, 320.0, 1.0], ['padauk', 44.6, 337.0, 1.05], ['rain', 75.2, 346.6, 1.1], ['padauk', 48.0, 357.4, 1.0], ['rain', 58.6, 366.0, 1.2], ['padauk', 70.6, 370.4, 1.05], ['rain', 44.4, 372.4, 1.0]]) tree(k, x, z, s);
lamp(62.0, 327.0); lamp(68.6, 353.0);

// ============ EAST BANK =============================================================
// ---- the bridge-foot street, north side
const LET = add({ k: 'jLetter', x: 124.6, z: MF - 3, w: 5.4, d: 6 }); // MA THIDA'S LETTER HOUSE (letterroom)
add({ k: 'jBox', x: 125.9, z: 298.2, live: 'bridgeBox' }); // the red bridge-box beside her door
add({ k: 'jHoarding', x: 128.85, z: MF - 0.6, len: 2.7, seed: 6 }); // Ko Min's poster wall, in the alley
const KOMIN = add({ k: 'jCorner', x: 133.0, z: MF - 3.2, w: 5.2, d: 6.4 }); // KO MIN'S CORNER (sign painter)
add({ k: 'jLadder', x: 134.7, z: 298.15, ry: 0.15, live: 'stepLadder' });
const TEA = add({ k: 'jTea', x: 139.6, z: MF - 3.5, w: 8, d: 7 }); // DAW SEIN'S TEA SHOP (junctiontea)
add({ k: 'jCart', x: 144.5, z: 298.2, live: 'teaCart' });
// [the road north, x 148] the notice board, the school, the newspaper stall, the press
add({ k: 'jNotice', x: 151.6, z: 297.6, live: 'slipBoard' });
const SCH = add({ k: 'jSchool', x: 159.6, z: MF - 3.8, w: 8.4, d: 7.6 }); // THE JUNCTION SCHOOL (schoolroom)
add({ k: 'jStall', x: 165.8, z: MF - 0.8, easel: 0, seed: 4 });
const PRESS = add({ k: 'jPress', x: 172.0, z: MF - 4, w: 8.4, d: 8 }); // THE GOLD INK PRESS (press)
add({ k: 'jEasel', x: 169.85, z: 298.25, live: 'doorEasel' });
row(180.2, 6.2, 6.5, MF, 21, { shop: true, awning: '#3F6F9E' });
add({ k: 'jPostSign', x: 180.2, z: MF + 0.8, w: 1.6, text: { my: 'စာရွက်ဆိုင်', en: 'Paper shop' }, color: '#2E5578' });
cottage(186.1, 4.6, 5.6, MF, 22);
for (const [x, z] of [[126.95, 297.95], [130.0, 302.7], [145.6, 297.9], [164.2, 302.7], [177.0, 297.9], [185.6, 304.0]]) lamp(x, z);
// ---- the lip of the fold, east (gap at the bridge mouth)
add({ k: 'jLip', x: 119.3, z: 286.4, len: 21.6, ry: Math.PI / 2 });
add({ k: 'jLip', x: 119.3, z: 322.0, len: 38.0, ry: Math.PI / 2 });
add({ k: 'jLip', x: 119.3, z: 350.0, len: 10.0, ry: Math.PI / 2 }); // by the bench at Ink Lane's end
// ---- south of the bridge-foot street and the press street: low things only (street tea, a mat, carts)
for (const [k, x, z, extra] of [
  ['jCrates', 123.6, 303.4, { seed: 7 }], ['hawkerMat', 127.6, 303.6, { seed: 32 }], ['planters', 133.6, 302.8, { seed: 33 }], ['lowTea', 137.0, 303.4, { seed: 34 }],
  ['bikes', 162.4, 303.0, {}], ['jRollCart', 170.4, 303.6, { ry: 0.05 }], ['jDrums', 176.0, 303.4, { n: 3 }], ['planters', 180.6, 302.8, { seed: 35 }],
]) add({ k, x, z, ...extra });
// ---- the square: newsprint paving with the fold through the well; the well; two benches and the painted 6
add({ k: 'jPaving', x: 151, z: 306.0, w: 24, d: 16, seed: 9, fold: 149.6 - 151, open: ['n', 'w', 'e'] });
add({ k: 'jWell', x: 149.6, z: 305.0, live: 'goldInkWell' });
add({ k: 'jPigeons', x: 153.8, z: 309.4, n: 5, seed: 8 });
add({ k: 'bench', x: 158.5, z: 309.6, ry: 0 }); // facing south: from here the paint reads 9
add({ k: 'jSix', x: 158.5, z: 312.2 });
add({ k: 'bench', x: 158.5, z: 314.8, ry: Math.PI }); // facing north (as the street camera looks): a 6
lamp(162.8, 311.0); lamp(138.6, 311.0); // (no lamp mid-square: it stood between the camera and the well)
add({ k: 'flowers', x: 137.8, z: 313.8, seed: 61 });
add({ k: 'planters', x: 163.4, z: 314.2, seed: 62 });
// (no trees on the square's south side: the street camera looks over it) fallen blossom and chalk instead
add({ k: 'jPetals', x: 139.4, z: 316.0, n: 22, seed: 3 }); add({ k: 'jPetals', x: 164.4, z: 316.6, n: 16, seed: 4 });
add({ k: 'jChalkArt', x: 147.6, z: 311.4, seed: 6 }); add({ k: 'jChalkArt', x: 152.0, z: 313.6, seed: 8 });
add({ k: 'jChalkArt', x: 131.6, z: 312.4, seed: 2 }); add({ k: 'jChalkArt', x: 49.6, z: 312.0, seed: 4 });
add({ k: 'jChalkArt', x: 150.4, z: 345.4, seed: 7 }); add({ k: 'jPetals', x: 127.4, z: 345.0, seed: 12 }); add({ k: 'jPetals', x: 48.6, z: 305.0, seed: 13 });
add({ k: 'jPetals', x: 175.4, z: 305.6, seed: 14 }); add({ k: 'jPetals', x: 157.0, z: 343.6, seed: 15 }); add({ k: 'jChalkArt', x: 66.8, z: 316.6, seed: 9 });
// ---- between the square and Ink Lane: the back yards of Ink Lane's houses, behind low whitewashed walls
add({ k: 'jYardWall', x: 133.0, z: 327.6, len: 18, gate: 4 });
add({ k: 'jYardWall', x: 163.0, z: 327.6, len: 30, gate: -8 });
for (const [k, x, z, extra] of [
  ['garden', 128.0, 323.0, { w: 3.2, d: 1.6, seed: 70 }], ['garden', 134.4, 322.4, { w: 3.2, d: 1.6, seed: 71 }], ['hens', 125.6, 319.0, { seed: 72 }], ['woodpile', 137.0, 325.6, {}],
  ['jSheets', 169.0, 313.2, { len: 4.0, seed: 3 }], ['jSheets', 175.6, 315.0, { len: 3.4, seed: 5 }], ['jBundles', 166.2, 318.0, { seed: 6 }], ['jCrates', 179.6, 309.4, { seed: 8 }],
  ['garden', 158.0, 322.4, { w: 3.6, d: 1.6, seed: 76 }], ['jars', 152.6, 324.6, {}], ['garden', 172.0, 322.6, { w: 3.6, d: 1.8, seed: 73 }], ['well', 180.6, 321.0, {}],
  ['jBanana', 148.6, 323.0, { s: 1.05 }], ['jBanana', 177.0, 324.8, {}], ['tufts', 131.0, 314.0, { seed: 74 }], ['tufts', 174.0, 308.4, { seed: 75 }],
]) add({ k, x, z, ...extra });
// (the bridge foot's south side and the east road stay clear of trees: the street camera looks over them)
// ---- Ink Lane, north side (fronts at 335.4): houses, a paper-cutter's and a bicycle-repair shop
cottage(127.0, 5.0, 5.6, IF, 31);
row(133.0, 5.6, 6.5, IF, 32);
row(139.0, 5.6, 6.5, IF, 33, { shop: true, awning: '#B8323A' });
add({ k: 'jPostSign', x: 139.0, z: IF + 0.8, w: 1.5, text: { my: 'စက္ကူဖြတ်', en: 'Paper cutter' }, color: '#8E2730' });
row(149.4, 5.8, 6.5, IF, 34);
cottage(155.8, 5.4, 5.8, IF, 35);
row(162.2, 5.8, 6.5, IF, 36, { shop: true, awning: '#4F7F5A' });
add({ k: 'jPostSign', x: 162.2, z: IF + 0.8, w: 1.6, text: { my: 'စက်ဘီးပြင်', en: 'Bicycle repair' }, color: '#3A6345' });
add({ k: 'bikes', x: 164.6, z: 336.3 });
row(168.6, 5.8, 6.5, IF, 37);
cottage(175.0, 5.4, 5.6, IF, 38);
for (const x of [130.0, 146.4, 158.8, 171.8, 181.2]) lamp(x, 335.9);
// ---- Ink Lane, south side (low near the lane), then gardens down to the page's bottom edge
for (const [k, x, z, extra] of [
  ['hawkerMat', 131.6, 341.6, { seed: 36 }], ['lowTea', 138.0, 341.8, { seed: 37 }], ['jSidecar', 151.6, 341.8, { ry: 0.1 }], ['planters', 158.0, 340.8, { seed: 38 }],
  ['handcart', 167.0, 341.8, { ry: -0.2 }], ['jDog', 172.6, 341.2, { ry: 2.2, color: '#8A7A6A' }], ['flowers', 177.8, 341.2, { seed: 39 }],
  ['bench', 121.4, 344.0, { ry: -Math.PI / 2 }],
]) add({ k, x, z, ...extra });
{
  const r = rng(404);
  for (const [x, z, w, d] of [[130, 352, 3.6, 1.8], [135.6, 352.6, 3.2, 1.8], [141, 352, 3.6, 1.8], [130.4, 358.4, 3.6, 1.8], [136, 359, 3.2, 1.8], [160, 353, 3.8, 1.8], [165.8, 353.4, 3.4, 1.8], [160.4, 359.4, 3.8, 1.8]]) add({ k: 'garden', x, z, w, d, seed: Math.floor(x * 7 + z) });
  for (const [k, x, z, extra] of [
    ['jHenRun', 150.0, 356.6, { w: 6, d: 4, seed: 14 }], ['well', 146.0, 364.2, {}], ['laundry', 171.4, 351.2, { len: 3.6 }], ['woodpile', 176.6, 356.8, {}], ['jars', 179.6, 351.0, {}],
    ['goat', 126.4, 366.0, { ry: -0.5 }], ['hens', 168.0, 364.6, { seed: 81 }], ['jWaterPot', 156.6, 364.4, {}], ['jBanana', 124.4, 350.0, { s: 1.1 }], ['jBanana', 183.0, 346.6, {}],
    ['fence', 135.6, 348.6, { len: 12, ry: 0 }], ['fence', 163.0, 348.8, { len: 9, ry: 0 }],
  ]) add({ k, x, z, ...extra });
  for (const [k, x, z, s] of [['padauk', 124.4, 372.4, 1.1], ['rain', 134.6, 369.6, 1.2], ['padauk', 145.0, 373.6, 1.0], ['rain', 156.6, 371.0, 1.15], ['padauk', 167.4, 373.4, 1.05], ['rain', 178.6, 369.0, 1.2], ['padauk', 186.0, 360.6, 1.0], ['rain', 186.4, 330.0, 1.0], ['padauk', 186.6, 316.0, 0.95]]) tree(k, x, z, s);
  for (let n = 0; n < 10; n++) add({ k: 'tufts', x: 124 + r() * 62, z: 346 + r() * 28, seed: 500 + n });
}
// ---- behind the north frontage: yards, two cottages; the school yard; the hen run behind the press
for (const [k, x, z, extra] of [
  ['laundry', 131.4, 287.6, { len: 3.6 }], ['hens', 141.0, 286.4, { seed: 91 }], // (yard bits hidden behind the frontage dropped: budget)
  ['garden', 140.4, 282.6, { w: 3.2, d: 1.6, seed: 92 }], ['jDrums', 144.4, 288.6, { n: 2 }],
  ['jYardWall', 159.6, 278.6, { len: 10 }], ['swing', 157.6, 284.2, {}], ['seesaw', 161.8, 286.8, { ry: 0.2 }], ['jBanana', 154.4, 282.4, { s: 0.9 }],
  ['jHenRun', 172.0, 284.0, { w: 6, d: 4, seed: 12 }], ['woodpile', 177.6, 287.6, {}], ['jars', 167.4, 287.8, {}],
]) add({ k, x, z, ...extra });
cottage(125.6, 5.0, 5.4, 278.6, 41);
cottage(133.8, 5.4, 5.6, 278.0, 42);
cottage(182.6, 5.4, 5.6, 286.6, 43);
add({ k: 'laundry', x: 129.6, z: 270.6, len: 3.2 });
add({ k: 'garden', x: 137.6, z: 271.4, w: 3.6, d: 1.8, seed: 93 });
for (const [k, x, z, s] of [['padauk', 123.4, 262.6, 1.05], ['rain', 133.2, 264.4, 1.2], ['padauk', 142.0, 266.8, 1.0], ['rain', 153.0, 263.2, 1.15], ['padauk', 163.6, 266.0, 1.0], ['rain', 172.6, 263.4, 1.2], ['padauk', 182.0, 266.4, 1.05], ['rain', 186.4, 276.6, 1.0]]) tree(k, x, z, s);
lamp(145.8, 280.0); lamp(150.4, 268.0);
for (let n = 0; n < 6; n++) add({ k: 'tufts', x: 121 + n * 11, z: 268 + (n % 3) * 4, seed: 600 + n });

// ---- the near ground everywhere the street camera looks down: low life only, and the old print on the paper
for (const [k, x, z, extra] of [
  // west bank, south of the Market road and the bridgehead square
  ['jDryMats', 60.6, 306.8, { w: 3.0, d: 1.9, seed: 3 }], ['jHopscotch', 46.6, 309.0, { ry: 0.1 }], ['lowTea', 56.2, 306.2, { seed: 41 }],
  ['garden', 42.8, 313.6, { w: 3.4, d: 1.6, seed: 42 }], ['garden', 47.8, 314.2, { w: 3.0, d: 1.6, seed: 43 }], ['jPigeons', 64.6, 304.6, { n: 4, seed: 11 }],
  ['planters', 40.8, 302.8, { seed: 44 }], ['hens', 52.4, 316.4, { seed: 45 }], ['jWaterPot', 72.2, 315.6, {}], ['tufts', 66.0, 318.4, { seed: 46 }],
  ['flowers', 77.0, 307.2, { seed: 47 }],
  // east bank, south of the bridge-foot street (clear of the well queue and Day 8's bench, x 140 .. 147)
  ['jDryMats', 129.4, 309.0, { w: 3.6, d: 2.0, seed: 5 }], ['jPigeons', 134.4, 306.0, { n: 3, seed: 12 }], ['jHopscotch', 136.0, 312.0, { ry: -0.08 }],
  ['garden', 123.6, 314.8, { w: 3.0, d: 1.6, seed: 48 }], ['jWaterPot', 125.0, 307.0, {}], ['tufts', 121.6, 310.6, { seed: 49 }], ['jDog', 132.2, 315.2, { ry: -0.8 }],
  // the press street, south side (the press's papers drying in rows)
  ['jDryMats', 172.6, 308.6, { w: 4.2, d: 2.2, seed: 7 }], ['jBundles', 179.6, 306.4, { seed: 9, n: 2 }], ['hens', 182.6, 310.6, { seed: 50 }], ['jPigeons', 167.0, 306.4, { n: 4, seed: 13 }],
  ['flowers', 165.6, 311.6, { seed: 51 }],
  // Ink Lane, south side
  ['jHopscotch', 145.6, 344.4, { ry: 0.05 }], ['jDryMats', 162.6, 345.2, { w: 3.0, d: 1.8, seed: 9 }], ['jPigeons', 127.2, 345.2, { n: 3, seed: 14 }], ['jWaterPot', 173.4, 345.4, {}],
]) add({ k, x, z, ...extra });
{
  // faded print on the open paper (ground only): yards, verges, the lanes' south sides
  const r = rng(707);
  for (const [x, z] of [[44, 307], [50.4, 319.6], [68.4, 309.4], [58.4, 321.0], [74, 326], [46, 334], [64.6, 343.4], [52, 362], [70, 362], [61, 291.6], [52.4, 276.0], [71.6, 274.6],
    [127.2, 312.4], [137.6, 306.6], [122.8, 320.6], [133.0, 318.6], [170.0, 317.0], [178.0, 318.6], [183.0, 324.0], [154.6, 318.6], [126.6, 342.4], [140.6, 347.4],
    [155.0, 346.6], [170.0, 347.0], [182.0, 342.0], [150.4, 368.0], [128.0, 365.0], [174.0, 368.6], [129.2, 284.6], [139.0, 277.0], [158.0, 271.0], [176.0, 274.0], [186.0, 296.4]]) {
    add({ k: 'jPrint', x, z, w: 2.2 + r() * 2.2, d: 1.6 + r() * 1.4, ry: (r() - 0.5) * 0.5, seed: Math.floor(r() * 1e5), dark: r() < 0.3 });
  }
}

// ---- cottages along the road north (fronts turned to the road), fences and gardens before them
cottage(140.4, 5.2, 5.6, 0, 44, { z: 266.0, ry: Math.PI / 2 });
cottage(140.6, 5.0, 5.4, 0, 45, { z: 276.0, ry: Math.PI / 2 });
cottage(156.2, 5.2, 5.6, 0, 46, { z: 268.6, ry: -Math.PI / 2 });
add({ k: 'fence', x: 145.2, z: 272.6, len: 6, ry: Math.PI / 2 });
add({ k: 'fence', x: 151.0, z: 274.4, len: 5, ry: Math.PI / 2 });
add({ k: 'flowers', x: 145.0, z: 262.6, seed: 95 }); add({ k: 'planters', x: 151.4, z: 262.4, seed: 96 });

// ---- the townsfolk at their work (junction-folk.js `jFolk`: still figures merged into the chunk, no draw call
// of their own) and the chalk boards on the footpaths (prices and sayings, never a way to go). North frontages:
// the figure stands on the strip before the shop, facing the street (+Z). Clear of Day 7's square, Day 8's
// well queue, bench and slip board, and every doorstep.
const PI = Math.PI, HP = Math.PI / 2;
const folk = (x, z, pose, ry = 0, extra = {}) => add({ k: 'jFolk', x, z, ry, pose, seed: Math.floor(x * 13 + z * 7), ...extra });
const chalk = (x, z, lines, ry = 0) => add({ k: 'jABoard', x, z, ry, lines });
// west bank: the Market road's last shops, the bench, the hawker, the hopscotch, the lane's cottages
folk(44.3, 297.75, 'sit', 0, { woman: true }); // the betel-shop woman on her stool
chalk(46.0, 298.1, [{ my: 'ကွမ်းယာ', en: 'Betel' }, { my: '၅၀ ကျပ်', en: '50 kyat' }]);
folk(49.6, 297.9, 'sweep', 0.3, { woman: true });
folk(54.0, 297.9, 'kid', 0.4);
folk(51.3, 303.85, 'read', 0, { stool: false }); // on the bench, today's paper
folk(44.2, 302.75, 'squat', 0, { woman: true, hat: true }); // the hawker behind her mat
folk(45.6, 304.6, 'head', -2.2, { woman: true, load: '#E06A3A' });
folk(47.6, 308.2, 'chalk', -0.6); folk(45.6, 310.8, 'kid', 0.3);
folk(55.45, 306.2, 'drink', HP, { stool: false }); folk(56.2, 306.75, 'drink', PI, { stool: false }); // at the street tea table
folk(51.0, 316.8, 'squat', 1.2, { woman: true }); // feeding the hens
folk(54.6, 318.2, 'hang', PI, { woman: true }); // pegging the washing
folk(60.2, 314.2, 'carry', 0.5, { load: '#CDA577' }); // a bridge hand with a plank
folk(55.4, 326.6, 'kid', 0.2); folk(69.6, 333.6, 'sit', 0.4, { woman: true });
folk(59.0, 337.4, 'head', -0.8, { woman: true, load: '#B5643C' }); // water from the well
folk(76.2, 356.0, 'sit', HP, { stool: false }); // an old man on the lip bench, looking at the clouds
// east bank, the bridge-foot street: the hoarding's readers, the tea veranda (on its own stools), the hawker
folk(128.85, 298.25, 'readStand', PI); // reading the posters on Ko Min's wall
chalk(121.0, 297.6, [{ my: 'ကြားတာ မဟုတ်', en: 'Not what you heard:' }, { my: 'မြင်တာကို', en: 'what you saw,' }, { my: 'ရေးပေးသည်', en: 'written for you' }]); // Ma Thida's: "not what you heard, what you saw"
folk(136.6, 298.45, 'drink', HP, { stool: false }); folk(138.0, 298.35, 'read', -HP, { stool: false }); folk(141.95, 298.95, 'drink', PI, { stool: false });
folk(127.6, 302.75, 'squat', 0, { woman: true, hat: true });
folk(136.25, 303.4, 'drink', HP, { stool: false }); folk(137.0, 303.95, 'drink', PI, { stool: false });
folk(131.9, 308.6, 'squat', -1.4, { woman: true }); // turning the drying sheets
folk(135.0, 313.2, 'chalk', 0.5);
// the square: a sweeper, a child with the pigeons, a paper seller, the two benches (one reads 6, one 9)
folk(145.6, 312.6, 'sweep', 0.5);
folk(152.4, 310.8, 'kid', 0.9);
folk(161.6, 305.2, 'sell', -0.3);
folk(159.15, 309.6, 'read', 0, { stool: false }); folk(157.9, 314.8, 'sit', PI, { stool: false });
folk(156.6, 297.9, 'kid', 0.3); folk(162.4, 297.95, 'kid', -0.4); // pupils before the school bell
// the press street: the stall's seller and a customer, a porter with a bundle, the paper shop
folk(164.0, 297.9, 'sell', 0.2); folk(167.6, 298.0, 'readStand', 0);
folk(177.2, 298.0, 'carry', 0.3); folk(182.4, 297.8, 'stand', 0, { woman: true });
chalk(183.4, 298.2, [{ my: 'စက္ကူ ၁ ထုပ်', en: 'Paper, 1 bundle' }, { my: '၅၀၀ ကျပ်', en: '500 kyat' }]);
folk(168.6, 304.2, 'carry', 1.2); folk(170.2, 309.4, 'squat', 1.4, { hat: true });
folk(180.8, 326.4, 'head', 0, { woman: true, load: '#7FAE66' });
// Ink Lane: shopkeepers before their shops, the tea table, the hawker, the trishaw man, children
folk(140.6, 335.9, 'sit', 0); chalk(136.6, 336.0, [{ my: 'စက္ကူ', en: 'Paper' }, { my: 'ဖြတ်ပေးသည်', en: 'cut to size' }]);
folk(147.6, 335.9, 'sit', 0, { woman: true }); folk(157.0, 336.0, 'kid', 0.2);
folk(163.0, 336.2, 'squat', 0.4); chalk(160.0, 336.2, [{ my: 'လေထိုး', en: 'Tyre air' }, { my: '၁၀၀ ကျပ်', en: '100 kyat' }]);
folk(169.6, 336.0, 'sweep', -0.3, { woman: true }); folk(176.6, 336.0, 'head', 0.2, { woman: true });
folk(131.6, 340.75, 'squat', 0, { woman: true, hat: true });
folk(137.25, 341.8, 'drink', HP, { stool: false }); folk(138.0, 342.35, 'drink', PI, { stool: false }); folk(138.75, 341.8, 'read', -HP, { stool: false });
folk(153.4, 342.8, 'read', -0.3); folk(168.8, 342.4, 'carry', 1.0);
folk(146.6, 343.4, 'chalk', -0.5); folk(144.4, 345.8, 'kid', 0.3);
// the road north: a neighbour on her step, a woman with a basket
folk(144.2, 266.6, 'sit', HP, { woman: true }); folk(151.4, 281.4, 'head', -0.3, { woman: true });
// (t9) the road north's lower stretch, between the tea shop's and the school's side walls: planted verges with
// their kerbs to the road, a man mending a bicycle, a neighbour shelling beans on a stool, pots by the wall
add({ k: 'jVerge', x: 144.95, z: 293.4, len: 4.4, ry: HP, seed: 301 });
add({ k: 'jVerge', x: 151.05, z: 291.2, len: 5.0, ry: -HP, seed: 302 });
add({ k: 'jVerge', x: 151.05, z: 284.6, len: 3.4, ry: -HP, seed: 303 });
add({ k: 'jVerge', x: 144.95, z: 284.2, len: 3.4, ry: HP, seed: 306 }); folk(143.6, 282.8, 'sweep', 0.4, { woman: true });
add({ k: 'bikes', x: 153.6, z: 294.6, ry: HP }); folk(153.0, 293.3, 'squat', HP);
folk(154.2, 288.0, 'sit', -HP, { woman: true }); add({ k: 'planters', x: 154.6, z: 286.0, seed: 304 });
add({ k: 'planters', x: 143.8, z: 290.6, seed: 305 }); add({ k: 'jWaterPot', x: 143.9, z: 285.4 });

// ---- the middle ground the street camera looks down on (second pass, from the walking-height shots): the
// bridgehead square's south half (clear of Day 7's bench, hands and desk foldWest), the bridge foot's south side
// (clear of Ko San, the well queue and Day 8's bench) and the press street's south side.
// west square: the bridge hands' tea break and the rope splicer; a saying for ch 11 (the one you can steer is you)
add({ k: 'lowTea', x: 65.4, z: 307.0, seed: 82 });
folk(64.65, 307.0, 'drink', HP, { stool: false }); folk(65.4, 307.55, 'read', PI, { stool: false });
folk(67.8, 309.2, 'squat', -0.6, { hat: true }); // splicing rope beside the bundles
chalk(62.6, 305.4, [{ my: 'ပြင်လို့ရတာ', en: 'The one you can mend' }, { my: 'ကိုယ့်ကိုယ်', en: 'is yourself,' }, { my: 'ကိုယ်ပဲ', en: 'only you' }]); // "the one you can mend is yourself"
add({ k: 'jCrates', x: 62.6, z: 309.4, seed: 11 });
// east foot: a man reads the day sheet aloud, two listen (one frowns, one nods); a woman goes by with her basket
folk(130.8, 305.2, 'readStand', 0);
folk(129.9, 306.3, 'stand', 2.46, { woman: true }); folk(131.9, 306.4, 'stand', -2.36);
folk(133.4, 307.4, 'head', -0.3, { woman: true, load: '#D9A23A' });
add({ k: 'bikes', x: 138.4, z: 306.2, ry: 0.15 });
// the press street, south side: the press hands' tea, the stall's chalk board (ch 23: say whose words they are)
add({ k: 'lowTea', x: 176.4, z: 307.2, seed: 83 });
folk(175.65, 307.2, 'drink', HP, { stool: false }); folk(176.4, 307.75, 'drink', PI, { stool: false });
chalk(164.6, 305.4, [{ my: 'ဘယ်သူ', en: 'Who' }, { my: 'ပြောတာလဲ', en: 'said it?' }, { my: 'နာမည် ရေးပါ', en: 'Write the name' }]); // "who said it? write the name"
folk(165.8, 306.0, 'readStand', -0.4);

// ---- third pass (t8, from the walking-height shots): the low near ground below the street camera's focus,
// where the shots still showed bare paving: the square's south half and the strip below it, the press street's
// south side, the west lane and Ink Lane's south verge. Low, cheap things only (ground decals, mats, children,
// hens): the camera looks over them. Clear of the well queue, Day 8's bench, the benches and the 6.
// the square: a hopscotch game under way (ch 12: Moe Moe's "my own sum" is chalked on the ground nearby)
add({ k: 'jHopscotch', x: 150.8, z: 315.9, ry: 0.04 });
folk(150.6, 317.6, 'kid', 2.9); folk(152.7, 315.2, 'chalk', -1.2); folk(149.0, 314.6, 'kid', 1.7, { woman: true });
add({ k: 'jPetals', x: 145.2, z: 314.8, n: 14, seed: 21 }); add({ k: 'jChalkArt', x: 141.8, z: 313.4, seed: 12 });
add({ k: 'jPigeons', x: 144.6, z: 312.4, n: 4, seed: 22 });
folk(146.6, 315.8, 'head', 0.4, { woman: true, load: '#C9A24A' }); // crossing the square with her basket
// below the square, before the yard walls: newsprint drying on mats, the hens, a woman turning the sheets
add({ k: 'jDryMats', x: 151.6, z: 321.4, w: 3.4, d: 2.0, seed: 23 }); folk(153.8, 321.2, 'squat', -1.3, { woman: true, hat: true });
add({ k: 'hens', x: 146.2, z: 320.6, seed: 24 }); add({ k: 'flowers', x: 162.6, z: 319.4, seed: 25 });
add({ k: 'jPetals', x: 157.6, z: 319.6, n: 12, seed: 26 }); add({ k: 'tufts', x: 141.0, z: 320.8, seed: 27 }); add({ k: 'tufts', x: 166.4, z: 321.6, seed: 28 });
// the press street, south side: chalk and petals where the porters cross
add({ k: 'jChalkArt', x: 168.0, z: 310.4, seed: 29 }); add({ k: 'jPetals', x: 167.0, z: 312.6, n: 10, seed: 30 });
// the west lane: a mat of drying sheets by the lane, a child, petals and chalk on the pencil path
add({ k: 'jDryMats', x: 66.2, z: 329.8, w: 2.8, d: 1.8, seed: 31 }); folk(67.8, 331.0, 'squat', -1.0, { woman: true });
add({ k: 'jPetals', x: 60.4, z: 332.6, n: 12, seed: 32 }); add({ k: 'jChalkArt', x: 63.8, z: 344.2, seed: 33 }); folk(64.8, 345.4, 'chalk', 0.6);
add({ k: 'tufts', x: 60.0, z: 341.6, seed: 34 });
// Ink Lane's south verge, west end: paper drying, a hawker turning it, chalk drawings
add({ k: 'jDryMats', x: 133.2, z: 345.8, w: 3.0, d: 1.8, seed: 35 }); folk(135.2, 346.6, 'squat', -0.5, { hat: true });
add({ k: 'jChalkArt', x: 138.6, z: 347.0, seed: 36 });
// the bridgehead square: blossom and pigeon-feed only (ground decals: Day 7 stages its scene here)
add({ k: 'jPetals', x: 68.2, z: 303.2, n: 10, seed: 37 }); add({ k: 'jChalkArt', x: 63.4, z: 303.0, seed: 38 });

// ---- the fill pass (junction-fill.js): homes, sheds and yards on every block where the paper still showed bare,
// laid before the scatter so its gardens, hens and ground patches settle round them. Nothing may touch the day
// scripts' spots, the doors, the desks or the people's places; the streets keep their pavements.
const export_fill = {};
export const KEEP = [
  [59, 294.5, 80, 305.5], [69.5, 304.5, 75.5, 310.5], [58.6, 302.4, 61.8, 304.8], // Day 7: board, hands, jar, bench; desk foldWest
  [142.4, 302.6, 148.6, 308.2], [140.2, 308.2, 143.2, 310.4], [147.6, 302.6, 152.4, 307.6], // the well, its queue, Day 8's bench
  [152.6, 303.8, 158.4, 308.8], [153.0, 298.2, 156.0, 300.4], [149.0, 298.0, 151.4, 300.0], // desk `well`, Nay Chi, Ko San at the slips
  [156.8, 308.6, 160.2, 316.0], [163.8, 286.0, 167.8, 297.6], // the benches and the 6; Day 8's paint lane between the school and the press
];
for (const [x, z] of [[HUT.x, HUT.z + HUT.d / 2 + 0.35], [LET.x - 1.25, LET.z + LET.d / 2 + 0.35], [TEA.x, TEA.z + TEA.d / 2 + 0.3], [SCH.x, SCH.z + SCH.d / 2 + 0.6], [PRESS.x, PRESS.z + PRESS.d / 2 + 0.4],
  [72.4, 307.4], [155.4, 306.2], [133.8, 298.6], [121.6, 302.9], [157.9, 310.3], [151.9, 306.2], [122.4, 298.5], [145.6, 299.0], [137.4, 313.4]]) KEEP.push([x - 1.2, z - 1.2, x + 1.2, z + 1.2]);
{
  const N = Object.fromEntries(ROAD_NODES.map((n) => [n.id, [n.x, n.z]]));
  const lines = (pencil) => ROAD_EDGES.filter((e) => (e.style === 'pencil') === pencil && e.style !== 'deck').map((e) => e.pts || [N[e.a], N[e.b]]);
  export_fill.result = fill({ ITEMS, add, folk, keep: KEEP, roads: lines(false), paths: lines(true), region: REGION.rect });
}

// ---- the scatter: every open stretch of paper the camera looks down on gets low, lived-in things; far from
// the streets the yards get gardens, hens, washing and trees. Keeps clear of the streets, the buildings, the
// doorsteps, the desks and the spots the day scripts use (Day 7's bridgehead, Day 8's well queue and bench).
{
  const r = rng(2024);
  const roads = [[39, 297.8, 187, 302.2], [145.8, 258, 150.2, 302], [181.8, 300, 186.2, 340.2], [121, 335.8, 186, 340.2]];
  const keep = [
    [59, 294.5, 80, 305.5], [69.5, 304.5, 75.5, 310.5], [58.6, 302.4, 61.8, 304.8], // Day 7: board, hands, jar, bench; desk foldWest
    [142.4, 302.6, 148.6, 308.2], [140.2, 308.2, 143.2, 310.4], [147.6, 302.6, 152.4, 307.6], // the well, its queue, Day 8's bench
    [152.6, 303.8, 158.4, 308.8], [153.0, 298.2, 156.0, 300.4], [149.0, 298.0, 151.4, 300.0], // desk `well`, Nay Chi, Ko San at the slips
    [156.8, 308.6, 160.2, 316.0], [119, 258, 121.2, 378], [77.4, 258, 79, 378], // the benches and the 6; the fold lips
  ];
  for (const d of [[66.5, 294.3], [123.35, 297.75], [139.6, 297.7], [159.6, 298.0], [172, 297.8]]) keep.push([d[0] - 1.6, d[1] - 0.5, d[0] + 1.6, d[1] + 3.0]);
  for (const p of FOLK_PEOPLE) keep.push([p.x - 1.0, p.z - 1.0, p.x + 1.0, p.z + 1.0]); // the fill pass's townsfolk stand here
  const rects = [];
  for (const it of ITEMS) {
    const big = it.w && it.d, c = Math.abs(Math.cos(it.ry || 0)) > 0.5;
    const hw = big ? (c ? it.w : it.d) / 2 + 0.7 : it.k === 'jPrint' || it.k === 'jSix' ? 0 : 1.3, hd = big ? (c ? it.d : it.w) / 2 + 0.9 : hw;
    if (hw) rects.push([it.x - hw, it.z - hd, it.x + hw, it.z + hd]);
  }
  const inside = (x, z, list, m = 0) => list.some(([a, b, c, d]) => x > a - m && x < c + m && z > b - m && z < d + m);
  const roadDist = (x, z) => Math.min(...roads.map(([a, b, c, d]) => Math.hypot(Math.max(a - x, 0, x - c), Math.max(b - z, 0, z - d))));
  // (cheap kinds weighted up: ground-only petals, chalk and tufts cost no outline and no shadow; budget pass t8)
  // (fill pass: pigeons and crates, the dearest near kinds, left to the hand-placed ones to pay for the new homes)
  const NEAR = ['planters', 'flowers', 'tufts', 'jPetals', 'jPetals', 'hawkerMat', 'lowTea', 'bikes', 'jBundles', 'planters', 'jDog', 'hens', 'jChalkArt', 'tufts'];
  const YARD = ['garden', 'jPetals', 'hens', 'laundry', 'woodpile', 'jars', 'jBanana', 'flowers', 'tufts', 'tufts', 'goat', 'tufts', 'jCrates', 'TREE', 'TREE', 'fence'];
  const bands = [[40.5, 259.5, 77, 376.5], [121.5, 259.5, 187.5, 376.5]];
  for (const [x0, z0, x1, z1] of bands) {
    for (let z = z0 + 1.6; z < z1 - 1; z += 3.7) for (let x = x0 + 1.4; x < x1 - 1; x += 3.7) {
      const px = x + (r() - 0.5) * 1.8, pz = z + (r() - 0.5) * 1.8, pick = r(), seed = Math.floor(r() * 1e5);
      const rd = roadDist(px, pz);
      if (rd < 1.4 || inside(px, pz, keep) || inside(px, pz, rects)) continue;
      const near = rd < 9 && pz > 300; // the verge the street camera looks down on (south of a street)
      const hidden = pz < 292 && px > 119 && Math.abs(px - 148) > 7; // east yards behind the north frontage (budget t9)
      if (r() > (near ? 0.62 : hidden ? 0.24 : 0.42)) continue;
      const list = near ? NEAR : YARD, k = list[Math.floor(pick * list.length)];
      let o;
      if ((k === 'TREE' || k === 'laundry') && (rd < 9 || (pz > 300 && rd < 15) || (pz > 302 && pz < 334 && px > 119))) continue;
      if (k === 'TREE') { o = { k: r() < 0.5 ? 'padauk' : 'rain', x: px, z: pz, s: 0.9 + r() * 0.3 }; }
      else if (k === 'garden') o = { k, x: px, z: pz, w: 2.6 + r() * 1.2, d: 1.4 + r() * 0.4, seed };
      else if (k === 'laundry') o = { k, x: px, z: pz, len: 2.8 + r() * 0.8 };
      else if (k === 'fence') o = { k, x: px, z: pz, len: 3 + r() * 3, ry: r() < 0.7 ? 0 : Math.PI / 2 };
      else if (k === 'jPigeons') o = { k, x: px, z: pz, n: 3 + Math.floor(r() * 3), seed };
      else if (k === 'goat' || k === 'jDog' || k === 'lowTea' || k === 'bikes') o = { k, x: px, z: pz, ry: (r() - 0.5) * 1.2, seed };
      else o = { k, x: px, z: pz, seed, ry: (r() - 0.5) * 0.4 };
      add(o);
      rects.push([px - 1.3, pz - 1.3, px + 1.3, pz + 1.3]);
    }
  }

  // ---- fourth pass (t9): the ground at her feet. The low camera's lower half is the strip just south of
  // the street she stands on; there the shots still showed plain paper. Worn earth, grass and moss soak into
  // the newsprint (junction-verge.js `jPatch`: ground decals, two triangles a flat, no outline or shadow),
  // and low planted verges with a stone kerb line the streets' south sides where nothing else stands
  // (`jVerge`, knee height: the camera looks over them). Scattered, never in a line that could read as a way.
  const r2 = rng(909);
  const paved = [[55.5, 292.5, 78.5, 308.5], [138.5, 297.5, 163.5, 314.5]]; // the two squares keep their paving
  const bigs = ITEMS.filter((it) => it.w && it.d && !['jPrint', 'jDryMats', 'jPatch', 'garden'].includes(it.k)).map((it) => [it.x - it.w / 2, it.z - it.d / 2, it.x + it.w / 2, it.z + it.d / 2]);
  const KINDS = ['grass', 'grass', 'soil', 'worn', 'moss', 'grass', 'soil', 'worn'];
  for (const [x0, z0, x1, z1] of bands) {
    for (let z = z0 + 1; z < z1; z += 2.9) for (let x = x0 + 1; x < x1; x += 3.1) {
      const px = x + (r2() - 0.5) * 2, pz = z + (r2() - 0.5) * 2, kind = KINDS[Math.floor(r2() * KINDS.length)];
      const w = 1.6 + r2() * 2.2, d = 1.0 + r2() * 1.2, ry = (r2() - 0.5) * 0.8, seed = Math.floor(r2() * 1e5), p = r2();
      const rd = roadDist(px, pz);
      if (rd < Math.max(w, d) / 2 + 0.35 || inside(px, pz, paved, 0.8) || inside(px, pz, bigs, 0.2)) continue;
      const near = rd < 10 && pz > 300;
      if (p > (near ? 0.75 : 0.3)) continue;
      add({ k: 'jPatch', x: px, z: pz, w, d, ry, kind, seed });
    }
  }
  for (const [xa, xb, zz] of [[39.5, 57, 303.05], [120.5, 139.5, 303.05], [163, 187, 303.05], [121.5, 186.5, 341.05]]) {
    for (let x = xa; x + 3.0 <= xb; x += 0.5) {
      const cx = x + 1.5;
      if (inside(cx, zz, keep, 0.3) || [cx - 1.5, cx - 0.75, cx, cx + 0.75, cx + 1.5].some((xx) => inside(xx, zz, rects, -0.4))) continue;
      add({ k: 'jVerge', x: cx, z: zz, len: 3.0, seed: Math.floor(cx * 31 + zz) });
      rects.push([cx - 1.8, zz - 0.7, cx + 1.8, zz + 0.7]);
    }
  }
}

// ---------------------------------------------------------------------------------
// Doors into rooms (doors.js): x, z = the threshold just in front of the doorway; facing 0 = looking south
// ---------------------------------------------------------------------------------
export const DOORS = [
  { room: 'bridgehut', x: HUT.x, z: HUT.z + HUT.d / 2 + 0.35, facing: 0, r: 0.8 },
  { room: 'letterroom', x: LET.x - 1.25, z: LET.z + LET.d / 2 + 0.35, facing: 0, r: 0.8 },
  { room: 'junctiontea', x: TEA.x, z: TEA.z + TEA.d / 2 + 0.3, facing: 0, r: 0.9 },
  { room: 'schoolroom', x: SCH.x, z: SCH.z + SCH.d / 2 + 0.6, facing: 0, r: 0.9 },
  { room: 'press', x: PRESS.x, z: PRESS.z + PRESS.d / 2 + 0.4, facing: 0, r: 1.0 },
];

// ---------------------------------------------------------------------------------
// Bookmark Desks (INDEX 7)
// ---------------------------------------------------------------------------------
export const DESKS = [
  { id: 'foldWest', name: { my: 'တံတားထိပ်', en: 'Bridgehead' }, x: 72.4, z: 307.4, ry: 1.15 },
  { id: 'well', name: { my: 'ရွှေမင်တွင်းဘေး', en: 'By the gold-ink well' }, x: 155.4, z: 306.2, ry: 0 },
];

// ---------------------------------------------------------------------------------
// Named places a day script may use (world metres; h = heading, 0 faces south / the camera)
// ---------------------------------------------------------------------------------
export const PLACES = {
  hut: { x: HUT.x, z: HUT.z, w: HUT.w, d: HUT.d }, hutDoor: { x: HUT.x, z: HUT.z + HUT.d / 2 + 0.35 },
  board: { x: 76.0, z: 294.3, ry: -0.9 }, rope: { x: 79, z: 293, len: 19 }, pier: { x: 99, z: 293 },
  letter: { x: LET.x, z: LET.z }, letterDoor: { x: LET.x - 1.25, z: LET.z + LET.d / 2 + 0.35 }, box: { x: 125.9, z: 298.2 },
  kominHouse: { x: KOMIN.x, z: KOMIN.z }, ladder: { x: 134.7, z: 298.15 }, komin: { x: 133.8, z: 298.6, h: 2.6 },
  tea: { x: TEA.x, z: TEA.z }, teaDoor: { x: TEA.x, z: TEA.z + TEA.d / 2 + 0.3 }, cart: { x: 144.5, z: 298.2 },
  slips: { x: 151.6, z: 297.6 }, school: { x: SCH.x, z: SCH.z }, schoolDoor: { x: SCH.x, z: SCH.z + SCH.d / 2 + 0.6 },
  well: { x: 149.6, z: 305.0 }, stall: { x: 165.8, z: MF - 0.8 },
  press: { x: PRESS.x, z: PRESS.z }, pressDoor: { x: PRESS.x, z: PRESS.z + PRESS.d / 2 + 0.4 }, easel: { x: 169.85, z: 298.25 },
  six: { x: 158.5, z: 312.2 }, benchNorth: { x: 158.5, z: 309.6 }, benchSouth: { x: 158.5, z: 314.8 },
  inkLane: { x: 150, z: INK_Z }, eastFoot: { x: 121.6, z: 302.9 },
};

// ---------------------------------------------------------------------------------
// Live twins: hide the static stand-in while a day's animated props4 twin stands in its place
// ---------------------------------------------------------------------------------
/** useLive(ow, ['goldInkWell', 'teaCart'], true): the static ones vanish (their keep-out stays); false: back. */
export function useLive(ow, names, on = true) {
  let changed = false;
  for (const n of [].concat(names || [])) {
    if (on && !LIVE.has(n)) { LIVE.add(n); changed = true; }
    if (!on && LIVE.has(n)) { LIVE.delete(n); changed = true; }
  }
  if (changed) try { ow?.streamer?.refresh?.(REGION.rect[0], REGION.rect[1], REGION.rect[2], REGION.rect[3]); } catch (e) { console.warn('junction useLive', e); }
  return changed;
}

// ---------------------------------------------------------------------------------
// Townspeople out on the streets (people indoors belong to the rooms). hello = a short line that hints at the
// chapter's lesson and never at where to go; the day scripts give them their real lines.
// ---------------------------------------------------------------------------------
export const PEOPLE = [
  { id: 'komin', x: 133.8, z: 298.6, heading: 2.6, hello: { my: 'ပေးတာကို ကပ်ရုံပဲ ဗျ။ မှန်မမှန်ကတော့ ကိုယ့်မျက်စိနဲ့ ကိုယ် ကြည့်ပေါ့။', en: "I just paste what I'm given. True or not, that's for your own eyes." },
    job: { area: { x: 133.6, z: 298.6, r: 1.1 }, spot: { x: 133.8, z: 298.6, h: 2.6 }, mood: 'work', workChance: 0.85, workFor: [8, 16] } },
  { id: 'kosan', x: 121.6, z: 302.9, heading: -0.5, hello: { my: 'တံတား ယိမ်းတယ်လို့ လူတွေ ပြောကြတယ်။ ကျွန်တော်ကတော့ နေ့တိုင်း ကိုယ့်ခြေနဲ့ ကိုယ် စမ်းတယ်။', en: 'Folk say the bridge sways. Me, I test it every day with my own feet.' },
    job: { area: { x: 122.4, z: 303.0, r: 1.4 }, spot: { x: 121.6, z: 302.9, h: -0.5 }, mood: 'work', workChance: 0.7, workFor: [6, 12] } },
  { id: 'kan', x: 157.9, z: 310.3, heading: 0.1, hello: { my: 'သတင်းစာထဲ ပါတယ်ဆိုတော့ မှန်မှာပေါ့… မဟုတ်ဘူးလား။', en: "It's in the paper, so it must be true… mustn't it?" },
    job: { area: { x: 158.0, z: 310.4, r: 0.8 }, spot: { x: 157.9, z: 310.3, h: 0.1 }, mood: 'read', workChance: 0.9, workFor: [12, 24] } },
  { id: 'dawhla', x: 151.9, z: 306.2, heading: -2.0, hello: { my: 'ကြားရုံနဲ့ မယုံသေးဘူး။ ကိုယ်တိုင် လာကြည့်တာ။', en: "I don't believe it just because I heard it. I came to look myself." },
    job: { area: { x: 152.2, z: 306.4, r: 1.2 }, spot: { x: 151.9, z: 306.2, h: -2.0 }, mood: 'read', workChance: 0.5, workFor: [5, 9] } },
  // Ma Thida writes letters for people at her doorstep; Daw Sein minds her tea cart; Moe Moe at the hopscotch
  { id: 'thida', x: 122.4, z: 298.5, heading: 0.3, hello: { my: 'ကြားခဲ့တာကို စာရေးပေးပါတဲ့။ ကျွန်မက ပြန်မေးတယ်၊ ကိုယ်တိုင် မြင်ခဲ့လား လို့။', en: 'They ask me to write down what they heard. I ask them back: did you see it yourself?' },
    job: { area: { x: 122.4, z: 298.6, r: 0.9 }, spot: { x: 122.4, z: 298.5, h: 0.3 }, mood: 'read', workChance: 0.8, workFor: [8, 16] } },
  { id: 'sein', x: 145.6, z: 299.0, heading: -1.2, hello: { my: 'ဒီဆိုင်မှာ လက်ဖက်ရည်ထက် သတင်းက ပိုမြန်မြန် ကုန်တယ်။ မှန်တာ မမှန်တာ ရောမွှေပြီးပေါ့။', en: 'In this shop the news goes faster than the tea. True and untrue, all stirred in together.' },
    job: { area: { x: 145.8, z: 299.2, r: 1.0 }, spot: { x: 145.6, z: 299.0, h: -1.2 }, mood: 'work', workChance: 0.8, workFor: [6, 14] } },
  { id: 'moemoe', x: 137.4, z: 313.4, heading: -0.3, hello: { my: 'ကိုယ့်ပေါင်းလဒ်ကိုယ် မှန်တယ်လို့ ထင်တာပဲ။ …ထင်ရုံပဲနော်။', en: 'I think my own sum is right. …I only think so, mind.' },
    job: { area: { x: 137.0, z: 313.0, r: 1.4 }, spot: { x: 137.4, z: 313.4, h: -0.3 }, mood: 'play', workChance: 0.6, workFor: [6, 12] } },
  ...FOLK_PEOPLE, // the fill pass's townsfolk at their yard work (junction-people.js; they appear once cast.js lists them)
];
export const SIGNS = [];
/** what the fill pass laid, lifted and left out (tests) */
export const FILLED = export_fill.result;
