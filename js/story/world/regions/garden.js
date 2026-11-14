// District 6 · the Diary Garden (opens Day 10; Days 10 and 12 play here, 14 and 15 come back): gardens and trellises
// inside a clasped diary, the kiln square with the big kiln, plots with dated beds, U Hpo Htaw's gate. North of Hearth
// Row on the east bank. day10-spec 1, day12-spec 1, INDEX 13.1 / 13.4. Region file format: regions/index.js.
// The art is ../art/garden.js (cottages, the paper store, the tea shop, the committee lean-to, the gourd house, stalls,
// fences, beds, ponds ...) and ./garden-art.js (the kiln shed, the drying hall and U Hpo Htaw's garden house fitted to
// this plan, the arch over the clasp road, a few street things). The townsfolk are ./garden-folk.js. Street life
// (kerb drains and verges, stepping stones to every gate, stalls, drying mats, water stands, the north road's fields,
// huts and hay, rough grass on the open page) is ./garden-life.js, laid by fillLife() after the front yards.
//
// THE ONE STREET PLAN every day uses (+X east, +Z south; the follow camera is south of Maya):
//   the great clasp (258, 137.6) -> the clasp road north along x 258 (the creeper arch at z 131, the welcome board,
//   cottages either side, Ko Soe's hives on the east strip) -> gEast (258, 100) -> THE LANE west along z 100
//   (kerbs z 98.75 / 101.25). North side of the lane (fronts face +Z, the camera's side), east -> west:
//     x 250.5-256.2  plot 1 (closed wicket at 253.3)          x 245-250.5  plot 2 (closed wicket at 247.7)
//     x 237.5-245    U HPO HTAW'S PLOT: gate posts at 241.2 (the gate itself is the day's: locked on Day 10, ajar
//                    on 12/14), his garden house at the back, door (241.2, 92.8) `hpohtawshed`
//     x 231.15-237.5 the gourd aunty's plot: her house `gourdhouse`, door (233.3, 96.45), a gate in the fence
//     x 224-231      THE CORNER TEA SHOP `kilntea` on the lane, door (226.0, 96.3): the lane's last building
//     THE KILN SQUARE (x 187-224, fronts at z 90, paved), west -> east along its north side:
//       x 196.6-204.6 the paper store `paperstore` (weigh room, door (200.1, 90.05); U Kyi Nyein's house above,
//                     the outside stair, the trader's awning over the scale spot (203.35, 91.4))
//       x 205.8-215.8 the big kiln's shed, kiln mouth to the square; the packing room `packroom` closed in at its
//                     east end, low door (213.8, 90.0); the woodpile in front; desk `kiln` (214, 94.4)
//       x 215.8-219.6 the Market Committee lean-to `committeeroom`, door (217.1, 90.0), notice board beside it
//       x 219.6-227   the drying hall `dryinghall`, double doors (221.6, 90.0)
//     two empty stalls, a pot rack and the clay heap at the square's west end; Ko Zin's cart on the south kerb
//   x 172 the crease lane comes up from the torn crease (gTear) on the south; cottages, hens, Yin Yin's skipping
//   x 141-170 north side: the street's allotments behind a picket fence, the seed house, the shade nursery,
//             the lily pond, the diary's own pen lying in the grass
//   x 140 the north road up to the last hedge (gHedge, z 18; the hedge itself is the Blank Page's, regions/blank.js)
//   South of the lane only low things stand at the kerb (herb ledges, flower borders, benches); houses sit back
//   from z 108, behind the camera. Behind the north side: orchards, bean rows, a second pond, hives.
// Desks (INDEX 7): clasp inside the diary clasp; kiln by the big kiln's woodpile.
// No markers anywhere: doors are just doors, signs only name things, people hint and never point. Burmese is a draft
// for Maya.
import { rng } from '../kit.js';
import { GARDEN_ART, GARDEN_PROP, K } from '../art/garden.js';
import { GARDEN_FIT_ART, GARDEN_FIT_PROP } from './garden-art.js';
import { FOLK_PEOPLE } from './garden-folk.js';
import { LIFE_ART, LIFE_PROP, MORE_COTTAGES, fillLife } from './garden-life.js';
import { TOWN_ART, TOWN_PROP, fillTown } from './garden-town.js';
import { TOWN_PEOPLE } from './garden-town-folk.js';

export const REGION = { id: 'garden', name: { my: 'နေ့စဉ်မှတ်တမ်းဥယျာဉ်', en: 'Diary Garden' }, rect: [119, 18, 269, 138], paper: 'diary', label: [222, 28] };

export const ROAD_NODES = [
  { id: 'gTear', x: 172, z: 135.4 },
  { id: 'gClasp', x: 258, z: 124 },
  { id: 'gEast', x: 258, z: 100 },
  { id: 'gCross', x: 172, z: 100 },
  { id: 'gWest', x: 140, z: 100 },
  { id: 'gHedge', x: 140, z: 18 },
];
export const ROAD_EDGES = [
  { id: 'gIn', a: 'hClasp', b: 'gClasp', sample: 0.5 },
  { id: 'gIn2', a: 'gClasp', b: 'gEast', sample: 0.5 },
  { id: 'gLane1', a: 'gEast', b: 'gCross', sample: 0.5, bias: 0.003 },
  { id: 'gLane2', a: 'gCross', b: 'gWest', sample: 0.5, bias: 0.003 },
  { id: 'gCreaseLane', a: 'gTear', b: 'gCross', sample: 0.5 },
  { id: 'gNorth', a: 'gWest', b: 'gHedge', pts: [[140, 100], [140, 70], [142, 46], [140, 18]], sample: 0.5 },
];

export const ART = { ...GARDEN_ART, ...GARDEN_FIT_ART, ...LIFE_ART, ...TOWN_ART };
export const PROP = { ...GARDEN_PROP, ...GARDEN_FIT_PROP, ...LIFE_PROP, ...TOWN_PROP };

export const ITEMS = [];
const add = (o) => (ITEMS.push(o), o);
const HP = Math.PI / 2, PI = Math.PI;
const T = (my, en, size = 46) => [{ text: my, size }, { text: en, size: 22, font: 'serif', weight: 600, color: '#6E1F2A' }];

// ---------------------------------------------------------------------------------
// The story's buildings: one place for every day (INDEX 13.1 / 13.4)
// ---------------------------------------------------------------------------------
const FRONT = 90.0; // the kiln square's north fronts
const STORE = add({ k: 'gdPaperStore', x: 200.6, z: FRONT - 3.0 + 0.05, w: 8, d: 6, doorX: -0.5 });
const KILN = add({ k: 'gdKilnYard', x: 210.8, z: FRONT - 3.5, w: 10, d: 7, kx: -1.2, bay: 3.6 });
const COMM = add({ k: 'gdCommittee', x: 217.7, z: FRONT - 2.5, w: 3.8, d: 5.0, doorX: -0.6 });
const HALL = add({ k: 'gdHall', x: 223.3, z: FRONT - 2.7, w: 7.4, d: 5.4, doorX: -1.7 });
const TEA = add({ k: 'gdTeaShop', x: 227.5, z: 94.0, w: 7, d: 4.6, doorX: -1.5 });
const GOURD = add({ k: 'gdGourdHouse', x: 233.4, z: 94.95, w: 3.8, d: 3.0, doorX: -0.1 });
const HPH = add({ k: 'gdHpHouse', x: 241.2, z: 91.6, w: 3.0, d: 2.4 });
const KILN_BX0 = KILN.w / 2 - KILN.bay, KILN_PDX = KILN_BX0 + 1.6; // (the art's default packing-room door)

// ---------------------------------------------------------------------------------
// Doors (doors.js): the threshold on the building face; facing = the way the door looks out (0 = +Z, the lane)
// ---------------------------------------------------------------------------------
const front = (it) => it.z + it.d / 2;
const r2 = (v) => Math.round(v * 100) / 100;
export const DOORS = [
  { room: 'paperstore', x: r2(STORE.x + STORE.doorX), z: r2(front(STORE) + 0.1), facing: 0, r: 1.15 },
  { room: 'packroom', x: r2(KILN.x + KILN_PDX), z: r2(front(KILN) + 0.1), facing: 0, r: 0.75 },
  { room: 'committeeroom', x: r2(COMM.x + COMM.doorX), z: r2(front(COMM) + 0.1), facing: 0, r: 0.75 },
  { room: 'dryinghall', x: r2(HALL.x + HALL.doorX), z: r2(front(HALL) + 0.1), facing: 0, r: 1.0 },
  { room: 'kilntea', x: r2(TEA.x + TEA.doorX), z: r2(front(TEA) + 0.1), facing: 0, r: 0.85 },
  { room: 'gourdhouse', x: r2(GOURD.x + GOURD.doorX), z: r2(front(GOURD) + 0.1), facing: 0, r: 0.75 },
  { room: 'hpohtawshed', x: HPH.x, z: r2(front(HPH) + 0.08), facing: 0, r: 0.7 },
];
const doorAt = (room) => DOORS.find((d) => d.room === room);

export const DESKS = [
  { id: 'clasp', name: { my: 'ဒိုင်ယာရီချိတ်ထဲ', en: 'Inside the diary clasp' }, x: 262.6, z: 128.4, ry: 0 },
  { id: 'kiln', name: { my: 'အိုးဖုတ်မီးဖိုကြီးဘေး', en: 'By the big kiln' }, x: 214, z: 94.4, ry: 0 },
];

// ---------------------------------------------------------------------------------
// The kiln square
// ---------------------------------------------------------------------------------
for (const x of [192, 202, 212, 222]) add({ k: 'gdPaving', x, z: 94.6, w: 10, d: 8.6, seed: x });
add({ k: 'gdKilnWood', x: 208.0, z: 91.6, len: 2.4 });
add({ k: 'gdStall', x: 188.4, z: 94.0, w: 2.0, seed: 4, color: K.mustard });
add({ k: 'gdStall', x: 192.2, z: 94.0, w: 2.0, seed: 7, color: K.teal });
add({ k: 'gdPotRack', x: 195.2, z: 91.2, len: 2.4, seed: 9 });
add({ k: 'gdClayHeap', x: 193.0, z: 88.6 });
add({ k: 'gdPotYard', x: 195.0, z: 86.4, seed: 6 });
add({ k: 'gdBales', x: 189.6, z: 89.4, n: 5, seed: 3 });
add({ k: 'padauk', x: 186.4, z: 92.2, s: 1.05 });
add({ k: 'bench', x: 184.6, z: 96.6, ry: 0 });
add({ k: 'gdCat', x: 186.0, z: 88.6, ry: 0.4 });
add({ k: 'gdBike', x: 205.6, z: 91.4, ry: HP, col: K.maroon });
add({ k: 'lamp', x: 196.0, z: 97.9 });
// the tea shop's side yard (onto the square) and the hall's corner
add({ k: 'gdTubs', x: 222.6, z: 97.6, seed: 3 });
add({ k: 'gdStool', x: 223.0, z: 96.6, col: K.red });

// ---------------------------------------------------------------------------------
// The plots (fronts on the lane; the gates, U Hpo Htaw's beds and trellises and the gourd trellis are the days')
// ---------------------------------------------------------------------------------
const FZ = 97.9, BZ = 90.4;
const fence = (x0, x1, z, extra = {}) => add({ k: 'gdFence', x: (x0 + x1) / 2, z, len: x1 - x0, ...extra });
const PLOT = { ga: [231.15, 237.5], hp: [237.5, 245.0], p2: [245.0, 250.5], p1: [250.5, 256.2] };
fence(PLOT.ga[0], PLOT.ga[1], FZ, { gx: GOURD.x + GOURD.doorX - (PLOT.ga[0] + PLOT.ga[1]) / 2, gw: 1.1, arch: K.mustard });
fence(PLOT.hp[0], PLOT.hp[1], FZ, { gx: HPH.x - (PLOT.hp[0] + PLOT.hp[1]) / 2, gw: 2.3, posts: true });
fence(PLOT.p2[0], PLOT.p2[1], FZ, { gx: 247.7 - (PLOT.p2[0] + PLOT.p2[1]) / 2, gw: 1.0, leaf: 'closed' });
fence(PLOT.p1[0], PLOT.p1[1], FZ, { gx: 253.3 - (PLOT.p1[0] + PLOT.p1[1]) / 2, gw: 1.0, leaf: 'closed' });
for (const x of [PLOT.ga[0], PLOT.hp[0], PLOT.hp[1], PLOT.p2[1], PLOT.p1[1]]) add({ k: 'gdFence', x, z: (FZ + BZ) / 2, len: FZ - BZ, ry: HP });
fence(PLOT.ga[0], PLOT.p1[1], BZ, { h: 0.95 });
add({ k: 'gdBed', x: 247.7, z: 95.2, w: 2.6, d: 1.1, crop: 'cabbage', seed: 21 });
add({ k: 'gdBed', x: 253.3, z: 95.2, w: 2.6, d: 1.1, crop: 'onion', seed: 22 });
add({ k: 'gdBed', x: 247.7, z: 92.6, w: 2.6, d: 1.1, crop: 'chilli', seed: 23 });
add({ k: 'gdBed', x: 253.3, z: 92.6, w: 2.6, d: 1.1, crop: 'tomato', seed: 24 });
add({ k: 'gdScarecrow', x: 249.8, z: 93.9 });
add({ k: 'gdCompost', x: 255.3, z: 91.1 });
add({ k: 'gdWater', x: 231.9, z: 91.4 });
add({ k: 'rain', x: 236.4, z: 86.0, s: 1.15 }); add({ k: 'padauk', x: 249.0, z: 86.6, s: 1.0 });

// ---------------------------------------------------------------------------------
// South of the lane (low at the kerb; houses set back from z 108, fronts facing the lane)
// ---------------------------------------------------------------------------------
add({ k: 'gdHerbLedge', x: 251.6, z: 102.0, len: 4.2, seed: 3 });
add({ k: 'gdBorder', x: 246.4, z: 102.0, len: 4.0, seed: 4 });
add({ k: 'gdBorder', x: 236.2, z: 102.0, len: 5.6, seed: 5 });
add({ k: 'gdHerbLedge', x: 229.0, z: 102.1, len: 3.4, seed: 6 });
add({ k: 'gdLaneBench', x: 220.6, z: 102.2, ry: PI });
add({ k: 'gdBorder', x: 214.6, z: 102.0, len: 5.0, seed: 7 });
add({ k: 'gdBaskets', x: 186.2, z: 102.4, n: 3, seed: 8 });
add({ k: 'gdHandcart', x: 197.6, z: 102.9, ry: PI, load: 'pots', seed: 4 });
add({ k: 'gdBorder', x: 178.0, z: 102.0, len: 5.0, seed: 9 });
add({ k: 'lamp', x: 226.6, z: 101.9 }); add({ k: 'lamp', x: 188.6, z: 101.9 });
// the row of cottages behind their front gardens
const cot = (x, z, w, d, seed, ry = PI) => add({ k: 'gdCottage', x, z, w, d, seed, ry });
cot(186.0, 111.6, 5.6, 4.4, 11); cot(198.6, 112.0, 6.0, 4.6, 12); cot(212.6, 111.6, 5.4, 4.4, 13); cot(226.0, 112.0, 6.2, 4.6, 14); cot(240.6, 111.8, 5.6, 4.4, 15);
add({ k: 'gdBed', x: 192.4, z: 107.2, w: 3.0, d: 1.2, crop: 'marigold', seed: 31, ry: PI });
add({ k: 'gdBed', x: 205.6, z: 107.0, w: 3.2, d: 1.2, crop: 'cabbage', seed: 32, ry: PI });
add({ k: 'gdPond', x: 219.2, z: 107.6, w: 4.6, d: 3.0, seed: 33 });
add({ k: 'gdBed', x: 233.4, z: 104.8, w: 2.8, d: 1.0, crop: 'herb', seed: 34, ry: PI });
add({ k: 'gdWash', x: 233.6, z: 107.4, len: 3.4, seed: 35 });
add({ k: 'gdCoop', x: 247.0, z: 107.4, ry: PI, seed: 36 });
add({ k: 'gdBarrow', x: 209.6, z: 106.4, ry: 0.5 });
add({ k: 'gdWater', x: 201.6, z: 108.0 });
add({ k: 'gdBike', x: 216.4, z: 109.0, col: K.blue });
for (const [k, x, z, s] of [['rain', 192.0, 120.0, 1.2], ['padauk', 205.6, 121.0, 1.05], ['rain', 219.0, 121.4, 1.15], ['padauk', 233.0, 120.6, 1.1], ['rain', 246.6, 122.0, 1.2], ['rain', 185.2, 130.6, 1.1], ['padauk', 200.0, 131.0, 1.0], ['rain', 214.0, 130.4, 1.2], ['padauk', 228.0, 131.0, 1.05], ['rain', 240.0, 131.6, 1.1]]) add({ k, x, z, s });
// back gardens towards the diary's edge: allotments, a shade frame, compost, beans
add({ k: 'gdShade', x: 207.0, z: 124.6, w: 6, d: 4, seed: 41 });
for (const [x, z, crop, s] of [[187.0, 123.0, 'chilli', 42], [196.0, 125.4, 'onion', 43], [222.6, 125.0, 'tomato', 44], [236.6, 125.4, 'cabbage', 45], [190.6, 133.0, 'marigold', 46], [221.0, 133.4, 'herb', 47]]) add({ k: 'gdBed', x, z, w: 3.2, d: 1.2, crop, seed: s });
add({ k: 'gdBeanPoles', x: 230.0, z: 126.0, len: 4.4, seed: 48 });
add({ k: 'gdCompost', x: 244.6, z: 128.0 });
add({ k: 'gdHives', x: 210.6, z: 133.6, seed: 49 });

// ---------------------------------------------------------------------------------
// The clasp road (x 258, from the great clasp north to the lane)
// ---------------------------------------------------------------------------------
add({ k: 'gdGateArch', x: 258, z: 131.0, span: 5.4, seed: 7 });
add({ k: 'gdNameBoard', x: 253.8, z: 133.4, ry: HP, w: 2.4, h: 0.7, lines: T('နေ့စဉ်မှတ်တမ်း ဥယျာဉ်', 'Diary Garden', 44), pw: 560, ph: 170 });
for (const z of [105, 111.5, 118, 124.5]) { add({ k: 'gdBorder', x: 256.2, z, len: 5.6, ry: HP, seed: z }); add({ k: 'gdBorder', x: 259.8, z: z + 1.5, len: 5.0, ry: HP, seed: z + 3 }); }
// west of the road: two cottages facing it, a washing line between
add({ k: 'gdCottage', x: 250.0, z: 117.0, w: 5.4, d: 4.4, seed: 21, ry: HP });
add({ k: 'gdCottage', x: 250.0, z: 127.4, w: 5.0, d: 4.2, seed: 22, ry: HP });
add({ k: 'gdWash', x: 249.4, z: 122.2, len: 3.0, ry: HP, seed: 23 });
// east of the road: Ko Soe's hives, the pump, a cottage, a bike against the clasp
add({ k: 'gdHives', x: 264.8, z: 110.8, ry: -HP });
add({ k: 'gdHives', x: 266.6, z: 106.6, ry: -HP });
add({ k: 'gdPump', x: 262.4, z: 116.4 });
add({ k: 'gdCottage', x: 265.6, z: 121.6, w: 5.0, d: 4.0, seed: 25, ry: -HP });
add({ k: 'gdBike', x: 262.0, z: 134.6, ry: 0.2, col: K.teal });
add({ k: 'flowers', x: 264.6, z: 130.6, seed: 26 });
add({ k: 'lamp', x: 260.8, z: 117.6 }); add({ k: 'lamp', x: 255.4, z: 106.6 });
add({ k: 'padauk', x: 266.0, z: 101.6, s: 1.0 }); add({ k: 'rain', x: 245.2, z: 118.0, s: 0.95 });

// ---------------------------------------------------------------------------------
// The crease lane (x 172, from the torn crease north to the lane)
// ---------------------------------------------------------------------------------
add({ k: 'gdCottage', x: 164.2, z: 109.0, w: 5.6, d: 4.4, seed: 51, ry: HP });
add({ k: 'gdCottage', x: 164.2, z: 122.6, w: 5.2, d: 4.4, seed: 52, ry: HP });
add({ k: 'gdCottage', x: 180.6, z: 109.6, w: 5.4, d: 4.4, seed: 53, ry: -HP });
add({ k: 'gdCottage', x: 180.6, z: 127.0, w: 5.6, d: 4.6, seed: 54, ry: -HP });
add({ k: 'gdCoop', x: 177.2, z: 117.6, ry: -HP, seed: 55 });
add({ k: 'gdSeedStand', x: 174.4, z: 121.2, ry: -HP });
add({ k: 'gdWash', x: 165.0, z: 115.8, len: 3.2, ry: HP, seed: 56 });
add({ k: 'gdBorder', x: 169.6, z: 103.0, len: 3.0, ry: HP, seed: 57 });
add({ k: 'gdBorder', x: 174.4, z: 104.8, len: 4.0, ry: HP, seed: 58 });
add({ k: 'gdHerbLedge', x: 169.8, z: 129.6, len: 3.0, ry: HP, seed: 59 });
add({ k: 'gdBarrow', x: 175.0, z: 131.8, ry: -1.0, col: K.mustard });
add({ k: 'lamp', x: 170.4, z: 118.6 }); add({ k: 'lamp', x: 173.6, z: 132.8 });
for (const [k, x, z, s] of [['rain', 158.0, 116.0, 1.15], ['padauk', 186.6, 118.0, 1.0], ['rain', 158.6, 130.0, 1.1], ['padauk', 150.0, 108.0, 1.05], ['rain', 144.6, 124.0, 1.2], ['padauk', 130.0, 112.0, 1.1], ['rain', 128.0, 130.0, 1.15]]) add({ k, x, z, s });
add({ k: 'gdBed', x: 150.6, z: 118.0, w: 3.2, d: 1.2, crop: 'flower', seed: 61 });
add({ k: 'gdBed', x: 136.6, z: 120.6, w: 3.2, d: 1.2, crop: 'chilli', seed: 62 });
add({ k: 'gdCottage', x: 141.0, z: 111.4, w: 5.4, d: 4.2, seed: 63, ry: PI });
add({ k: 'gdCoop', x: 132.6, z: 106.2, ry: PI, seed: 64 });
add({ k: 'gdPressed', x: 150.6, z: 128.6, col: K.violet, s: 1.2, seed: 65 });

// ---------------------------------------------------------------------------------
// West of the crease lane, north side: the street's allotments, the seed house, the shade nursery, the lily pond
// ---------------------------------------------------------------------------------
fence(141.6, 155.0, 97.9, { gx: 150.4 - 148.3, gw: 1.2, arch: true });
fence(155.0, 170.4, 97.9, { gx: 158.6 - 162.7, gw: 1.2 });
add({ k: 'gdNameBoard', x: 146.0, z: 98.35, w: 1.9, h: 0.55, y: 1.05, lines: T('ရပ်ကွက် ဥယျာဉ်', 'Street gardens', 42), pw: 512, ph: 150 });
add({ k: 'gdBed', x: 146.0, z: 95.0, w: 3.0, d: 1.1, crop: 'herb', seed: 71 });
add({ k: 'gdBed', x: 154.4, z: 95.0, w: 3.0, d: 1.1, crop: 'marigold', seed: 72 });
add({ k: 'gdBed', x: 163.6, z: 95.0, w: 3.2, d: 1.1, crop: 'cabbage', seed: 73 });
add({ k: 'gdBed', x: 167.8, z: 92.2, w: 3.0, d: 1.1, crop: 'onion', seed: 74 });
add({ k: 'gdLowTrellis', x: 163.6, z: 95.0, w: 3.0, d: 1.1 });
add({ k: 'gdSeedHouse', x: 150.4, z: 88.4, w: 5, d: 3.6 });
add({ k: 'gdShade', x: 158.8, z: 88.6, w: 5.6, d: 4.2, seed: 75 });
add({ k: 'gdSignPost', x: 161.9, z: 91.6, w: 1.0, h: 0.42, lines: [{ text: 'ပျိုးပင် · မနင်းပါနဲ့', size: 44 }, { text: "seedlings · please don't step", size: 24, font: 'serif', weight: 600, color: '#6E1F2A' }], pw: 448, ph: 188 });
add({ k: 'gdWater', x: 145.0, z: 90.6 });
add({ k: 'gdBeanPoles', x: 167.6, z: 86.8, len: 4.0, seed: 76 });
add({ k: 'gdPond', x: 160.6, z: 69.8, w: 8.0, d: 5.6, seed: 77 });
add({ k: 'gdLongBench', x: 157.2, z: 74.6, ry: PI, len: 2.4 });
add({ k: 'gdPen', x: 148.4, z: 74.4, len: 4.6, ry: 0.35 });
add({ k: 'gdPressed', x: 168.6, z: 79.6, col: K.rose, s: 1.3, seed: 78 });
add({ k: 'gdRibbon', x: 180.0, z: 72.0, len: 9, ry: 0.45 });
add({ k: 'lamp', x: 170.0, z: 98.35 }); add({ k: 'lamp', x: 152.6, z: 98.6 }); // (the first one stands clear of the corner shophouse)
for (const [k, x, z, s] of [['rain', 143.6, 82.0, 1.15], ['padauk', 171.0, 83.0, 1.0], ['rain', 166.0, 61.0, 1.2], ['padauk', 152.0, 62.4, 1.05], ['rain', 176.0, 90.6, 1.1], ['padauk', 180.6, 80.0, 1.0]]) add({ k, x, z, s });

// ---------------------------------------------------------------------------------
// The north road (x 140) up to the last hedge, and the west strip by the paper's edge
// ---------------------------------------------------------------------------------
add({ k: 'gdCottage', x: 130.6, z: 86.6, w: 5.4, d: 4.4, seed: 81, ry: HP });
add({ k: 'gdCottage', x: 130.6, z: 64.4, w: 5.0, d: 4.2, seed: 82, ry: HP });
add({ k: 'gdWash', x: 131.6, z: 75.4, len: 3.2, ry: HP, seed: 83 });
add({ k: 'gdCoop', x: 134.4, z: 56.6, ry: HP, seed: 84 });
add({ k: 'gdLaneBench', x: 121.8, z: 72.0, ry: -HP });
add({ k: 'flowers', x: 122.0, z: 76.0, seed: 85 }); add({ k: 'flowers', x: 122.4, z: 67.6, seed: 86 });
add({ k: 'gdLaneBench', x: 147.2, z: 55.4, ry: 0.4 });
add({ k: 'gdBeanPoles', x: 151.0, z: 47.0, len: 5.0, seed: 87 });
add({ k: 'gdBeanPoles', x: 151.0, z: 41.6, len: 5.0, seed: 88 });
add({ k: 'gdHives', x: 147.6, z: 33.6, ry: -HP });
add({ k: 'gdScarecrow', x: 155.0, z: 36.0 });
add({ k: 'gdBed', x: 133.0, z: 44.0, w: 3.2, d: 1.2, crop: 'tomato', seed: 89, ry: HP });
add({ k: 'gdBed', x: 133.0, z: 36.6, w: 3.2, d: 1.2, crop: 'chilli', seed: 90, ry: HP });
add({ k: 'gdLongBench', x: 143.2, z: 25.0, ry: -HP, len: 2.0 });
add({ k: 'gdBorder', x: 137.6, z: 27.0, len: 5.0, ry: HP, seed: 91 });
add({ k: 'gdPressed', x: 128.0, z: 30.0, col: K.white, s: 1.1, seed: 92 });
add({ k: 'lamp', x: 138.0, z: 88.0 }); add({ k: 'lamp', x: 142.6, z: 60.0 }); add({ k: 'lamp', x: 138.0, z: 38.0 }); add({ k: 'lamp', x: 136.4, z: 22 });
for (const [k, x, z, s] of [['padauk', 125.0, 94.0, 1.0], ['rain', 126.0, 80.0, 1.15], ['padauk', 124.6, 56.0, 1.05], ['rain', 127.0, 46.0, 1.2], ['padauk', 126.0, 26.0, 1.0], ['rain', 158.0, 50.0, 1.2],
  ['padauk', 163.0, 40.0, 1.05], ['rain', 160.0, 28.0, 1.15], ['padauk', 150.6, 24.0, 1.0], ['rain', 146.0, 66.0, 1.1]]) add({ k, x, z, s });

// ---------------------------------------------------------------------------------
// Behind the square and the plots: orchards, bean rows, the second pond, a cottage or two
// ---------------------------------------------------------------------------------
add({ k: 'gdCottage', x: 186.6, z: 76.0, w: 5.6, d: 4.4, seed: 101 });
add({ k: 'gdCottage', x: 258.6, z: 80.4, w: 5.4, d: 4.4, seed: 102 });
add({ k: 'gdSeedHouse', x: 232.0, z: 72.0, w: 5.2, d: 3.6 });
add({ k: 'gdShade', x: 242.6, z: 72.4, w: 6.0, d: 4.2, seed: 103 });
add({ k: 'gdPond', x: 252.0, z: 61.0, w: 7.0, d: 5.0, seed: 104 });
add({ k: 'gdBeanPoles', x: 216.0, z: 74.0, len: 5.0, seed: 105 });
add({ k: 'gdBeanPoles', x: 222.4, z: 74.0, len: 4.0, seed: 106 });
add({ k: 'gdHives', x: 263.6, z: 64.0, ry: -HP });
add({ k: 'gdScarecrow', x: 236.4, z: 60.0 });
add({ k: 'gdPressed', x: 205.0, z: 62.0, col: K.mustard, s: 1.4, seed: 107 });
add({ k: 'gdRibbon', x: 238.0, z: 44.0, len: 10, ry: -0.3 });
for (const [x, z, crop, s] of [[196.0, 66.0, 'cabbage', 111], [202.0, 66.0, 'onion', 112], [196.0, 61.0, 'chilli', 113], [202.0, 61.0, 'marigold', 114]]) add({ k: 'gdBed', x, z, w: 3.6, d: 1.3, crop, seed: s });
{
  const r = rng(4242);
  for (let i = 0; i < 26; i++) {
    const x = 176 + (i % 7) * 13 + (r() - 0.5) * 5, z = 30 + Math.floor(i / 7) * 13 + (r() - 0.5) * 5;
    if ((x > 228 && x < 258 && z > 55 && z < 78) || (x > 191 && x < 207 && z > 57 && z < 70)) continue; // (seed house, shade frame, pond; the beds)
    add({ k: r() < 0.5 ? 'rain' : 'padauk', x, z, s: 0.95 + r() * 0.3 });
  }
  for (const [x, z, s] of [[194, 80.0, 1.2], [214, 80.0, 1.15], [226, 80.6, 1.1], [205, 79.2, 1.0], [262, 90.6, 1.1], [174, 94.6, 1.0]]) add({ k: r() < 0.6 ? 'rain' : 'padauk', x, z, s });
}

// ---------------------------------------------------------------------------------
// Front yards: every cottage gets a low picket fence with its gate in line with the door (the art's cottage puts
// its door at a seeded place: worked out here the same way), a gravel path, flowers either side of it
// ---------------------------------------------------------------------------------
for (const c of MORE_COTTAGES) add({ k: 'gdCottage', ...c }); // (garden-life.js: the north road's cottages)
const GATES = [];
function cottageDoorX(c) { const r = rng(c.seed || 3); r(); r(); r(); r(); return (r() - 0.5) * (c.w - 2.6); }
function local(c, lx, lz) { const co = Math.cos(c.ry || 0), si = Math.sin(c.ry || 0); return [c.x + lx * co + lz * si, c.z - lx * si + lz * co]; }
const YARD = { 186.0: 4.4, 198.6: 4.4, 212.6: 4.4, 226.0: 4.4, 240.6: 4.4, 141.0: 4.2 };
for (const c of ITEMS.filter((it) => it.k === 'gdCottage')) {
  const depth = YARD[c.x] ?? (Math.abs(Math.sin(c.ry || 0)) > 0.5 ? 3.0 : 3.2), DX = cottageDoorX(c), half = c.w / 2 + 0.8, fz = c.d / 2 + depth;
  const [fx, fzW] = local(c, 0, fz);
  // (gfPicket: the plots' white pickets, lighter: garden-town.js)
  add({ k: 'gfPicket', x: fx, z: fzW, ry: c.ry || 0, len: half * 2, gx: DX, gw: 1.3, h: 0.7, col: c.seed % 3 ? K.white : K.cream });
  for (const s of [-1, 1]) { const [sx, sz] = local(c, s * half, c.d / 2 + depth / 2); add({ k: 'gfPicket', x: sx, z: sz, ry: (c.ry || 0) + HP, len: depth, h: 0.7 }); }
  { const [gx, gz] = local(c, DX, fz); GATES.push({ x: gx, z: gz, ry: c.ry || 0 }); }
  const [gxw, gzw] = local(c, DX, c.d / 2 + depth / 2 + 0.2);
  add({ k: 'gdGravel', x: gxw, z: gzw, ry: c.ry || 0, len: depth - 0.6, seed: c.seed });
  for (const s of [-1, 1]) {
    const lx = DX + s * 1.5;
    if (Math.abs(lx) > c.w / 2 + 0.2) continue;
    const [px, pz] = local(c, lx, c.d / 2 + depth - 1.0);
    add({ k: 'flowers', x: px, z: pz, ry: c.ry || 0, seed: c.seed * 3 + s });
  }
}

// street life (garden-life.js): stepping stones to every gate, kerb drains and verges, stalls, mats, water stands,
// the north road's fields, rough grass on the open page
fillLife(add, GATES);

// the decorative beds (everywhere but the story plots, x 231-257 z 90-98, whose beds the days use) are drawn by the
// lighter gfBed (garden-town.js): the same frame, soil, board and crop colours at a fraction of the triangles
for (const it of ITEMS) if (it.k === 'gdBed' && !(it.x > 231 && it.x < 257 && it.z > 89 && it.z < 99)) it.k = 'gfBed';

// the town (garden-town.js): homes, shophouses, tea stalls and workshops along every road and back lane, yards,
// back lots; each thing checks it is clear of the story places, the roads and what is already here
export const TOWN = fillTown({ ITEMS, add, defs: { ...ART, ...PROP }, doors: DOORS, people: [...FOLK_PEOPLE, ...TOWN_PEOPLE] });

// grass tufts and wild flowers on the page (walk-through ground decals), kept off the roads and the square
{
  const r = rng(9090);
  const onRoad = (x, z) => (Math.abs(z - 100) < 2.2 && x > 137 && x < 261) || (Math.abs(x - 172) < 2.2 && z > 98 && z < 138) || (Math.abs(x - 258) < 2.2 && z > 98) || (Math.abs(x - 140.6) < 2.6 && z < 102)
    || (x > 186 && x < 231 && z > 84 && z < 99);
  for (let n = 0, tries = 0; n < 190 && tries < 2000; tries++) {
    const x = 120 + r() * 148, z = 20 + r() * 116;
    if (onRoad(x, z)) continue;
    add({ k: 'tufts', x, z, seed: 300 + n }); n++;
  }
}

// ---------------------------------------------------------------------------------
// The diary's edge: the Garden lies inside a clasped diary, so along its south side (the seam with Hearth
// Row) stands the closed diary's fore-edge, knee-high: maroon boards with the page block between them,
// gold corners. Two ways through: the great clasp at the Row's east end (always open) and the torn crease
// (the shortcut, regions/hearth.js: its gap is the tear, closed until 'creaseMended').
// ---------------------------------------------------------------------------------
const EDGE_Z = 137.62, EDGE_D = 0.5;
const CLASP_X = 258, CREASE_GAP = [168.3, 175.7], CLASP_GAP = [255.0, 261.0];
for (const [x0, x1] of [[119.4, CREASE_GAP[0]], [CREASE_GAP[1], CLASP_GAP[0]], [CLASP_GAP[1], 268.6]]) {
  // (in pieces of about ten metres, so each lives in the chunk it stands in)
  const n = Math.ceil((x1 - x0) / 10), w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) ITEMS.push({ k: 'diaryEdge', x: x0 + w * (i + 0.5), z: EDGE_Z, len: w, a: i === 0, b: i === n - 1 });
}
ITEMS.push({ k: 'diaryClasp', x: CLASP_X, z: EDGE_Z });

const BOARD = '#6A2A34', BOARD_D = '#4E1D26', LEAF = '#F5ECDB', LEAF2 = '#E7DAC2', LEAF3 = '#DCCBAE', GOLD = '#C9A24A', GOLD_D = '#A47A2C', BRASS = '#D9B65A', STRAP = '#7A3A2A', STRAP_D = '#5C2A1E';
function diaryEdge(g, f, it) {
  const L = it.len, H = 0.82, D = EDGE_D, x0 = -L / 2;
  // the two boards (top and bottom) and the page block between them, its fore-edge facing south
  g.boxMin(x0, 0, -D / 2, -x0, 0.12, D / 2, BOARD);
  g.boxMin(x0, H - 0.12, -D / 2 - 0.04, -x0, H, D / 2 + 0.04, BOARD);
  for (let k = 0, y = 0.12; y < H - 0.12 - 0.01; k++, y += 0.1) g.boxMin(x0 + 0.06, y, -D / 2 + 0.05, -x0 - 0.06, Math.min(y + 0.1, H - 0.12), D / 2 - 0.03, [LEAF, LEAF2, LEAF, LEAF3][k % 4]);
  // gold corner pieces and, along the board, a tooled band every few metres
  for (const sx of [-1, 1]) {
    if (sx < 0 ? !it.a : !it.b) continue; // (corners only at the ends of a run)
    g.boxMin(sx > 0 ? -x0 - 0.5 : x0 - 0.02, H - 0.13, D / 2, sx > 0 ? -x0 + 0.02 : x0 + 0.5, H + 0.02, D / 2 + 0.07, GOLD);
    g.boxMin(sx > 0 ? -x0 - 0.5 : x0 - 0.02, -0.0, D / 2, sx > 0 ? -x0 + 0.02 : x0 + 0.5, 0.14, D / 2 + 0.07, GOLD);
    g.boxMin(sx > 0 ? -x0 - 0.06 : x0 - 0.04, 0, -D / 2 - 0.04, sx > 0 ? -x0 + 0.04 : x0 + 0.06, H, D / 2 + 0.06, BOARD_D);
  }
  for (let x = x0 + 2.5; x < -x0 - 1; x += 5) g.box(x, H + 0.005, 0, 0.9, 0.02, D * 0.6, GOLD_D);
  // a ribbon marker hanging out of the pages here and there
  if ((Math.round(it.x) % 3) === 0) for (const x of [x0 + L * 0.4]) g.boxR(x, 0.4, D / 2 + 0.03, 0.12, 0.62, 0.02, '#8C2A38', 0, 0, 0.08);
  f.flat(x0, D / 2, -x0, D / 2 + 0.7, 0.005, '#E9DCC6');
}
function diaryClasp(g, f, it) {
  // the great clasp: a brass-capped leather strap arching over the road between two posts, a lock plate
  const S = 2.9, TOP = 4.0;
  for (const sx of [-1, 1]) {
    g.box(sx * S, 1.7, 0, 0.5, 3.4, 0.62, BOARD);
    g.box(sx * S, 0.12, 0, 0.8, 0.24, 0.86, BOARD_D);
    g.box(sx * S, 3.45, 0, 0.62, 0.12, 0.74, GOLD);
    for (const y of [0.9, 2.2]) g.box(sx * S, y, 0.33, 0.54, 0.1, 0.04, GOLD_D);
    g.box(sx * S, 3.62, 0, 0.36, 0.24, 0.36, BRASS);
  }
  // the strap: segments along a low arch
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI * (i / n), a1 = Math.PI * ((i + 1) / n);
    const xa = -Math.cos(a0) * S, xb = -Math.cos(a1) * S, ya = 3.45 + Math.sin(a0) * (TOP - 3.45) * 1.6, yb = 3.45 + Math.sin(a1) * (TOP - 3.45) * 1.6;
    const len = Math.hypot(xb - xa, yb - ya);
    g.boxR((xa + xb) / 2, (ya + yb) / 2 + 0.06, 0, len + 0.05, 0.16, 0.5, i % 2 ? STRAP : STRAP_D, 0, 0, Math.atan2(yb - ya, xb - xa));
  }
  // the lock plate in the middle of the arch, a keyhole, a little brass tongue
  g.box(0, 4.42, 0.06, 0.7, 0.5, 0.12, BRASS);
  g.box(0, 4.44, 0.13, 0.08, 0.16, 0.02, '#2A2118');
  g.box(0, 4.12, 0.08, 0.2, 0.18, 0.08, GOLD_D);
  f.flat(-S - 0.6, 0.35, S + 0.6, 1.2, 0.005, '#E9DCC6');
}
ART.diaryEdge = { draw: diaryEdge, obstacles: (it) => [{ type: 'box', minX: it.x - it.len / 2, maxX: it.x + it.len / 2, minZ: it.z - EDGE_D / 2 - 0.05, maxZ: it.z + EDGE_D / 2 + 0.08 }] };
ART.diaryClasp = { draw: diaryClasp, h: 4.7, obstacles: (it) => [-1, 1].map((sx) => ({ type: 'box', minX: it.x + sx * 2.9 - 0.42, maxX: it.x + sx * 2.9 + 0.42, minZ: it.z - 0.45, maxZ: it.z + 0.45 })) };

// ---------------------------------------------------------------------------------
// Named places for the day scripts (world metres): read these instead of laying the Garden again.
// BUILT lists the room ids whose building stands here (a day's stand-in for one of them should not draw).
// ---------------------------------------------------------------------------------
export const BUILT = new Set(DOORS.map((d) => d.room));
const dz = (room, k = 0.9) => { const d = doorAt(room); return { x: d.x, z: d.z + k }; };
export const SPOTS = {
  lane: { z: 100, kerbN: 98.75, kerbS: 101.25 }, fenceZ: FZ, backZ: BZ, plots: PLOT, squareFront: FRONT,
  store: { x: STORE.x, z: STORE.z, w: STORE.w, d: STORE.d, door: doorAt('paperstore'), front: dz('paperstore', 1.0),
    scale: { x: STORE.x + 2.75, z: front(STORE) + 1.35 }, stairFoot: { x: STORE.x + STORE.w / 2 + 0.55, z: front(STORE) + 0.9 },
    locks: { x: STORE.x + STORE.w / 2 - 1.0, y: 4.0, z: front(STORE) - 2.6 }, lamp: { x: STORE.x - 1.6, y: 4.4, z: front(STORE) - 2.4 } },
  kiln: { x: KILN.x + KILN.kx, z: KILN.z - 0.7, mouth: { x: KILN.x + KILN.kx, z: KILN.z + 1.15 }, shed: { x: KILN.x, z: KILN.z, w: KILN.w, d: KILN.d },
    woodpile: { x: 208.0, z: 91.6 }, desk: { x: 214, z: 94.4 } },
  pack: { door: doorAt('packroom'), front: dz('packroom') },
  committee: { x: COMM.x, z: COMM.z, w: COMM.w, d: COMM.d, door: doorAt('committeeroom'), front: dz('committeeroom'), board: { x: COMM.x + 1.3, z: front(COMM) + 0.3 } },
  hall: { x: HALL.x, z: HALL.z, w: HALL.w, d: HALL.d, door: doorAt('dryinghall'), front: dz('dryinghall', 1.4) },
  tea: { x: TEA.x, z: TEA.z, w: TEA.w, d: TEA.d, door: doorAt('kilntea'), front: dz('kilntea', 1.0), tables: [{ x: TEA.x + 0.9, z: front(TEA) + 1.05 }, { x: TEA.x + 2.7, z: front(TEA) + 1.1 }] },
  gourd: { x: GOURD.x, z: GOURD.z, w: GOURD.w, d: GOURD.d, door: doorAt('gourdhouse'), front: dz('gourdhouse', 0.8), trellis: { x: 236.3, z: 96.8 } },
  hp: { gate: { x: HPH.x, z: FZ }, house: { x: HPH.x, z: HPH.z, w: HPH.w, d: HPH.d }, door: doorAt('hpohtawshed'), hook: { x: HPH.x + 0.75, y: 1.55, z: front(HPH) + 0.06 },
    bench: { x: 239.0, z: 97.05 }, laneBench: { x: 241.2, z: 102.05 } },
  stalls: [{ x: 188.4, z: 94.0 }, { x: 192.2, z: 94.0 }],
  cartKerb: { x: 204.6, z: 102.7 },
  clasp: { x: 258, z: 134.4 }, arch: { x: 258, z: 131.0 }, crease: { x: 172, z: 134.0 },
  pond: { x: 160.6, z: 69.8 }, hedgeGap: { x: 140, z: 19.4 },
};

// ---------------------------------------------------------------------------------
// Townspeople (garden-folk.js): at their work, hellos that hint at the Garden's lessons and never point
// ---------------------------------------------------------------------------------
export const PEOPLE = [...FOLK_PEOPLE, ...TOWN_PEOPLE];
export const SIGNS = [];
