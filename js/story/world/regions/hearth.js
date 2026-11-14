// District 5 · Hearth Row (opens Day 9; Days 9, 11, 13, 14): the bakery and its proving room, the Note Wall, the
// loom shed, the tea shop and Uncle Chit's kite bench on the north side; the noodle house, the lamp-mender's bench
// and the evening class on the south side; the workshop lane (the road up from the Junction) with Daw Nyein's
// tin-lamp shop and U San Shar's box workshop. Brown baking parchment with scorch rings. day9-spec 1, day11-spec 1,
// day13-spec, INDEX 13.1 / 13.2 / 13.4. Region file format: regions/index.js. The art is ../art/hearth.js
// (buildings ART, street things PROP; the props are registered here with an `h` prefix: hCrates, hDog ...).
//
// THE ONE STREET PLAN every day uses (+X east, +Z south; the Row runs west -> east along z 200; north fronts face
// +Z at z 197.4, south fronts face -Z at z 202.6; the follow camera is south of Maya, so south of the Row only the
// two buildings the story needs stand at the kerb, everything else south of it is low or set back):
//
//   north side, west -> east:
//     x 121   a low wall and a bench at the paper's west edge, over the cloud-stream
//     x 131   desk hearthWest under its lamp
//     x 133-136  the side lane up the bakery's west wall (flour sacks at its mouth) to the back yard
//     x 141   THE BAKERY (door 141, 197.5)   behind it the yard and the oven house: PROVING ROOM back door (141, 186.1)
//     x 146-148  the oven lane
//     x 152.6 the Note Wall (bare earth at its sunny east end)
//     x 163   THE LOOM SHED (door 159.9, 197.5), dye vats on its east side
//     x 172   the crease lane north to the torn crease (gate 'creaseMended')
//     x 175-235  row houses, the stove-makers', the tin-smiths', the paper-folders', the street's common oven
//     x 243   THE TEA SHOP hearthtea (door 243, 197.5)
//     x 251   Uncle Chit's kite bench and the sunny bare patch; x 258 the road north to the diary clasp
//   south side, west -> east:
//     x 131   the lamp-mender's bench      x 140  THE NOODLE HOUSE (door 140, 202.9)
//     x 148   THE WORKSHOP LANE = the road up from the Junction (jNorth z 258 -> hRowJ):
//               west side: TIN-LAMP SHOP (door 145.4, 218.0, first door), tin shed, a house, baskets, a house
//               east side: a house, the paper shed, BOX WORKSHOP (door 150.6, 228.4, three doors down), houses
//               the district sign by the lane's south end (from the Junction)
//     x 154.6 THE EVENING CLASS (door 153.3, 202.9) with desk hearthClass on its kerb (156.4, 201.5)
//     x 160-256  low things only at the kerb (the common yard with the hopscotch, stalls, gardens, benches);
//                houses set back behind front gardens from z 214
//
// Main roads laid here: jNorth (from the Junction) -> hRowJ; the Row (hRowW, hRowJ, hRowC, hRowE); at its east end
// the road turns north to the great diary clasp (hClasp, z 138) into the Diary Garden: the long way round.
// The torn crease: a short lane north from hRowC to a split in the paper on the Row's north edge (z 138) and on into
// the Garden: the shortcut. GATED: flag 'creaseMended' (world.setFlagGate('creaseMended', true), Day 9 with twine).
// Desks (INDEX 7): hearthWest at the Row's west end; hearthClass on the evening class's kerb.
// No markers anywhere: doors are just doors, people hint and never point. Burmese is a draft for Maya.
import { rng } from '../kit.js';
import { ART as H_ART, PROP as H_PROP } from '../art/hearth.js';
import { LIFE_PROP } from './hearth-life.js';
import { FOLK_PEOPLE } from './hearth-folk.js';
import { KERB_PROP } from './hearth-kerb.js';

export const REGION = { id: 'hearth', name: { my: 'မီးဖိုတန်း', en: 'Hearth Row' }, rect: [119, 138, 269, 258], paper: 'parchment', label: [222, 248] };

export const CREASE = { x: 172, z: 138 }; // where the lane meets the split

export const ROAD_NODES = [
  { id: 'hRowW', x: 126, z: 200 },
  { id: 'hRowJ', x: 148, z: 200 },
  { id: 'hRowC', x: 172, z: 200 },
  { id: 'hRowE', x: 258, z: 200 },
  { id: 'hClasp', x: 258, z: 138 },
  { id: 'hTear', x: CREASE.x, z: CREASE.z + 2.6 },
];
export const ROAD_EDGES = [
  { id: 'hDown', a: 'jNorth', b: 'hRowJ', sample: 0.5 },
  { id: 'hRow1', a: 'hRowW', b: 'hRowJ', sample: 0.5, bias: 0.003 },
  { id: 'hRow2', a: 'hRowJ', b: 'hRowC', sample: 0.5, bias: 0.003 },
  { id: 'hRow3', a: 'hRowC', b: 'hRowE', sample: 0.5, bias: 0.003 },
  { id: 'hToClasp', a: 'hRowE', b: 'hClasp', sample: 0.5 },
  { id: 'hCreaseLane', a: 'hRowC', b: 'hTear', sample: 0.5 },
  // the split itself (2.6 m each side of the tear line): the gated piece
  { id: 'crease', a: 'hTear', b: 'gTear', sample: 0.25, gate: 'creaseMended', look: 'tear', gateAt: [CREASE.x, CREASE.z] },
];

// ---------------------------------------------------------------------------------
// Kinds: the art file's buildings and props, with keep-out shapes that turn with the item
// (the art's own shapes are written for ry = 0; here they are taken in item space and turned)
// ---------------------------------------------------------------------------------
function turned(fn) {
  return (it) => {
    const ry = it.ry || 0;
    if (!ry) return fn(it) || [];
    const c = Math.cos(ry), s = Math.sin(ry);
    const W = (x, z) => [it.x + x * c + z * s, it.z - x * s + z * c];
    const local = fn({ ...it, x: 0, z: 0, ry: 0 }) || [];
    return local.map((o) => {
      if (o.type === 'circle') { const [x, z] = W(o.x, o.z); return { type: 'circle', x, z, r: o.r }; }
      const p = [W(o.minX, o.minZ), W(o.maxX, o.minZ), W(o.minX, o.maxZ), W(o.maxX, o.maxZ)];
      return { type: 'box', minX: Math.min(...p.map((q) => q[0])), maxX: Math.max(...p.map((q) => q[0])), minZ: Math.min(...p.map((q) => q[1])), maxZ: Math.max(...p.map((q) => q[1])) };
    });
  };
}
const boxObs = (it) => [{ type: 'box', minX: it.x - it.w / 2, maxX: it.x + it.w / 2, minZ: it.z - it.d / 2, maxZ: it.z + it.d / 2 }];
export const ART = {};
for (const [k, v] of Object.entries(H_ART)) ART[k] = { ...v, obstacles: turned(v.obstacles || boxObs) };
/** Prop kinds get an `h` prefix (crates -> hCrates): the Market and the Junction have kinds of the same name. */
export const PROP = {};
const hk = (k) => 'h' + k[0].toUpperCase() + k.slice(1);
for (const [k, v] of Object.entries(H_PROP)) PROP[hk(k)] = { ...v, obstacles: v.obstacles ? turned(v.obstacles) : undefined };
// street life (hearth-life.js): its keep-out shapes are already written in world space, turned by it.ry
for (const [k, v] of Object.entries(LIFE_PROP)) PROP[hk(k)] = v;
// kerb life (hearth-kerb.js): trishaws, umbrella stalls, sandals, worn slabs, kerb boards (world-space keep-outs too)
for (const [k, v] of Object.entries(KERB_PROP)) PROP[hk(k)] = v;

// ---------------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------------
export const ITEMS = [];
export const OBSTACLES = [];
const add = (o) => (ITEMS.push(o), o);
const HP = Math.PI / 2;
const ROW = 200, NF = 197.4, SF = 202.9; // the Row, its north and south building fronts
const LANE = 148, LW = 145.4, LE = 150.6; // the workshop lane (the Junction road) and its west / east fronts
const north = (k, x, w, d, extra = {}) => add({ k, x, z: NF - d / 2, w, d, ...extra });
const south = (k, x, w, d, extra = {}) => add({ k, x, z: SF + d / 2, w, d, ry: Math.PI, ...extra });
const laneW = (k, z, w, d, extra = {}) => add({ k, x: LW - d / 2, z, w, d, ry: HP, ...extra }); // west side, front faces east
const laneE = (k, z, w, d, extra = {}) => add({ k, x: LE + d / 2, z, w, d, ry: -HP, ...extra }); // east side, front faces west

// ---- the story's buildings (one place for every day)
const BAKERY = north('bakery', 141, 9, 7);
const BACK = add({ k: 'bakeryBack', x: 141, z: 182.6, w: 10, d: 4.4, door: 0 });
const WALL = add({ k: 'noteWall', x: 152.6, z: 196.6, w: 7.2 });
const LOOM = north('loomShed', 163, 9.5, 8, { door: -3.1 });
const TEA = north('teaHouse', 243, 10, 8, { door: 0 });
const NOODLE = south('noodleHouse', 140, 8, 8, { door: 0 });
const KLASS = south('eveningClass', 154.6, 7, 8, { door: 1.3 });
const LAMP = laneW('lampShop', 216.4, 6, 5, { door: -1.6 });
const BOX = laneE('boxShop', 229.0, 5, 4.4, { door: -0.6 });

// ---- the west end: the paper's edge over the cloud-stream, desk hearthWest, the side lane, the back yard
add({ k: 'hLookout', x: 121.4, z: 199.6, len: 5.2 });
add({ k: 'hPlantPots', x: 123.2, z: 196.0, n: 4 });
add({ k: 'padauk', x: 124.4, z: 191.0, s: 1.1 });
add({ k: 'rain', x: 125.6, z: 182.0, s: 1.15 });
add({ k: 'flowers', x: 128.4, z: 195.2, seed: 91 });
add({ k: 'bench', x: 126.8, z: 195.6, ry: 0 });
add({ k: 'hFlourSacks', x: 135.2, z: 196.4, ry: HP, n: 3 }); // stacked at the side lane's mouth
add({ k: 'hLowWall', x: 133.2, z: 187.5, len: 11, ry: HP }); // the yard's west wall, looking toward the cloud-stream
add({ k: 'hSackSeat', x: 134.2, z: 188.2 }); // Maung Arkar's sack, against the wall, facing west
add({ k: 'hTrayStack', x: 137.2, z: 189.5 });
add({ k: 'hBreadRack', x: 144.6, z: 189.6 });
add({ k: 'hCharcoal', x: 146.8, z: 188.4, ry: HP });
add({ k: 'laundry', x: 137.0, z: 185.4, len: 3.0 }); // aprons and cloths (along the oven house's west wall, clear of the back door and its step)
add({ k: 'woodpile', x: 134.5, z: 184.4 });
add({ k: 'jars', x: 146.6, z: 184.6 });
add({ k: 'hCat', x: 138.9, z: 186.6, ry: 0.6 });
// the oven lane between the bakery and the Note Wall: sacks and a crate against the wall
add({ k: 'hCrates', x: 146.8, z: 192.2, n: 2, seed: 4 });
// the scorch ring in the road a few metres east of the desk (where Day 9's cart tips)
add({ k: 'hRoadScorch', x: 142.8, z: 199.6, r: 0.7 });
for (const [x, z, r, seed] of [[129.2, 191.0, 1.0, 3], [150.2, 186.0, 1.4, 5], [160.8, 205.8, 0.9, 7], [196.0, 199.4, 0.6, 9], [222.0, 189.0, 1.2, 11], [236.4, 207.2, 1.1, 13]]) add({ k: 'hScorch', x, z, r, seed });

// ---- the Note Wall, its bare sunny patch; the loom shed and its dye vats
add({ k: 'hSoilPatch', x: 157.2, z: 196.6, w: 1.4, d: 0.9 });
add({ k: 'hDyeVats', x: 168.7, z: 194.6, ry: HP });
add({ k: 'laundry', x: 163.0, z: 187.4, len: 4.0 }); // skeins drying behind the shed
add({ k: 'laundry', x: 163.6, z: 185.0, len: 3.4 });
add({ k: 'hBananas', x: 157.8, z: 188.6 });

// ---- north side east of the crease lane: row houses and workshops, the common oven
north('hHouse', 177.8, 6.0, 7, { style: 'two', seed: 3 });
north('workShed', 184.6, 6.4, 7, { goods: 'stoves', seed: 5, sign: 'မီးဖိုခုံ' });
north('hHouse', 191.2, 6.0, 6, { style: 'one', seed: 7 });
add({ k: 'commonOven', x: 198.0, z: 194.6 });
north('hHouse', 204.6, 6.4, 7, { style: 'two', seed: 11 });
north('workShed', 211.4, 6.4, 7, { goods: 'tin', seed: 13, sign: 'သံပြားဆိုင်' });
north('hHouse', 218.0, 6.0, 6, { style: 'one', seed: 17 });
north('workShed', 224.6, 6.4, 7, { goods: 'paper', seed: 19, sign: 'စက္ကူခေါက်' });
north('hHouse', 231.4, 6.6, 7, { style: 'two', seed: 23 });
add({ k: 'hPlantPots', x: 236.0, z: 197.0, n: 3 });
add({ k: 'hKiteBench', x: 251.6, z: 195.0 });
add({ k: 'hSoilPatch', x: 253.6, z: 192.6, w: 1.8, d: 1.2 });
add({ k: 'hGoat', x: 249.4, z: 190.8, ry: -0.6 });
// kerb life on the north footpath (low, between the doors)
for (const [k, x, z, extra] of [
  ['hClayStove', 181.0, 198.3, {}], ['hTrayStack', 194.4, 198.4, {}], ['hBreadRack', 201.6, 198.5, {}], ['hCrates', 207.6, 198.4, { n: 2, seed: 8 }],
  ['hSackSeat', 215.0, 198.3, {}], ['hClayStove', 221.0, 198.3, {}], ['hDog', 227.8, 198.5, { ry: 1.2 }], ['bikes', 234.6, 198.4, {}],
]) add({ k, x, z, ...extra });

// ---- south side: the lamp-mender's bench, the noodle house's kerb pot and noodle rack
add({ k: 'hLampBench', x: 131.0, z: 203.5, ry: Math.PI });
add({ k: 'hKerbPot', x: 138.6, z: 201.7, ry: Math.PI }); // west of the door: due south of the scorch ring it hid the ring, the cart and Maya from the street camera
add({ k: 'hNoodleRack', x: 134.2, z: 206.6, ry: HP, len: 3 });
add({ k: 'hSackSeat', x: 136.6, z: 202.3 });
add({ k: 'padauk', x: 121.9, z: 214.6, s: 1.1 }); // set back from the kerb: it hid Maya on the west footpath

// ---- the evening class: desk hearthClass on its kerb (DESKS), the common yard east of it (hopscotch)
add({ k: 'hHopscotch', x: 161.0, z: 206.4, ry: HP });
add({ k: 'hLowWall', x: 165.2, z: 207.0, len: 7, ry: HP });
add({ k: 'bench', x: 162.0, z: 210.6, ry: Math.PI });
add({ k: 'hPlantPots', x: 158.9, z: 203.2, n: 3 });

// ---- street life (hearth-life.js kinds): what people leave out where they live and work
// Front yards of the set-back houses: stepping stones from the fence to the kerb, and on each side of them one
// thing someone is busy with (the townsfolk in hearth-folk.js stand beside theirs). One row per house, west -> east.
const YARD = [
  [['hDryMat', { load: 'chili' }], ['hBigJar', {}], true], // Daw Phyu's chillies
  [['hCot', {}], ['hPotTree', {}], false],
  [['hBikeFix', {}], ['hWaterStand', {}], true], // Ko Kyal's bench; Daw Kyu's water pots for anyone passing
  [['hWashTub', {}], ['hHerbBox', {}], false], // Ma Ngwe's washing day
  [['hHandcart', { load: 'pots', ry: HP }], ['hDryMat', { load: 'beans' }], true],
  [['hBaskets', {}], ['hMarbles', {}], false], // Yoon Yoon's marbles
  [['hTeaCorner', {}], ['hPotTree', {}], true], // U Pe's tea corner
  [['hDryMat', { load: 'crackers' }], ['hBigJar', { glaze: 'jade' }], false],
  [['hHandcart', { load: 'greens', ry: HP }], ['hCot', {}], false], // Ko Wai's cart
  [['hBroom', {}], ['hHerbBox', {}], true], // Ma Lone's broom
];
let yardN = 0;
function frontYard(x, w, seed) {
  const [L, R, gate] = YARD[Math.min(YARD.length - 1, yardN++)];
  const cx = x + w / 2, off = w / 4 + 0.35;
  add({ k: 'hPaving', x: cx, z: 207.3, len: 4.2 });
  if (gate) add({ k: 'hArch', x: cx, z: 209.6, ry: 0 });
  add({ k: L[0], x: cx - off, z: 207.2, ...L[1], seed: seed * 7 });
  add({ k: R[0], x: cx + off, z: 207.2, ...R[1], seed: seed * 11 });
  // the verge along the inside of the yard: grass tufts and a flower clump or a couple of hens by the fence
  add({ k: 'tufts', x: cx - 1.0, z: 208.7, seed: seed * 13 });
  add({ k: 'tufts', x: cx + 1.4, z: 208.6, seed: seed * 17 });
  if (yardN % 3 === 1) add({ k: 'hens', x: cx + w / 2 - 0.9, z: 208.6, seed: seed * 19 });
  else add({ k: 'flowers', x: cx - w / 2 + 0.8, z: 208.8, seed: seed * 23 });
}

// ---- south side east of the class: low things at the kerb, houses set back behind front gardens
{
  const r = rng(305);
  // the kerb strip (z 203.4 .. 205): stalls, mats, a stove seller, benches
  for (const [k, x, extra] of [
    ['stall', 170.4, {}], ['hBananas', 173.6, {}], ['hClayStove', 176.4, {}], ['hCrates', 179.0, { n: 3, seed: 21 }], ['bench', 183.6, { ry: Math.PI }],
    ['stall', 188.8, {}], ['hTrayStack', 191.6, {}], ['flowers', 195.0, { seed: 23 }], ['hPlantPots', 199.0, { n: 4 }], ['stall', 203.6, {}], ['hBreadRack', 206.8, { ry: Math.PI }],
    ['bench', 211.6, { ry: Math.PI }], ['hCharcoal', 216.0, {}], ['stall', 220.4, {}], ['hBananas', 223.4, {}], ['flowers', 227.0, { seed: 29 }], ['hClayStove', 230.6, {}],
    ['stall', 236.0, {}], ['hCrates', 239.6, { n: 2, seed: 31 }], ['bench', 244.0, { ry: Math.PI }], ['hPlantPots', 248.0, { n: 3 }], ['flowers', 252.0, { seed: 33 }],
  ]) add({ k, x, z: 204.2, ...extra });
  // set-back houses (fronts at z 214, facing the Row) with fenced front gardens
  let x = 170;
  let seed = 41;
  while (x < 250) {
    const w = 5.8 + r() * 1.4, two = r() < 0.4;
    add({ k: 'hHouse', x: x + w / 2, z: 214 + 3.2, w, d: 6.4, ry: Math.PI, style: two ? 'two' : 'one', seed: seed++ });
    add({ k: 'fence', x: x + w / 2, z: 209.6, len: w - 0.6, ry: 0 });
    frontYard(x, w, seed);
    const p = r();
    if (p < 0.35) add({ k: 'garden', x: x + w / 2, z: 211.8, w: w - 1.6, d: 2.2, seed: seed++ });
    else if (p < 0.6) add({ k: 'flowers', x: x + w / 2 - 1, z: 211.6, seed: seed++ });
    else if (p < 0.8) add({ k: 'hens', x: x + w / 2, z: 211.8, seed: seed++ });
    else add({ k: 'hPlantPots', x: x + w / 2 - 0.6, z: 211.6, n: 4 });
    x += w + 1.6 + r() * 1.2;
  }
}

// ---- street life (hearth-life.js kinds): the fixed places (the front yards are laid with the houses above)
// the kerb drain along the south side, east of the common yard (its planks cross it every few metres)
for (let x = 165; x < 256; x += 12) add({ k: 'hGutter', x: x + 0.5, z: 203.45, len: 12 });
// the west end, south of the Row: the lamp-mender's neighbours
add({ k: 'hCot', x: 124.6, z: 207.4 });
add({ k: 'hWaterStand', x: 128.2, z: 206.8 });
add({ k: 'hBigJar', x: 122.0, z: 205.6 });
add({ k: 'hHerbBox', x: 128.6, z: 210.6 });
add({ k: 'hBroom', x: 130.4, z: 208.0 });
// the common yard by the evening class, and the gap before the first stall
add({ k: 'hPotTree', x: 159.4, z: 209.4 });
add({ k: 'hTeaCorner', x: 167.6, z: 207.2 });
add({ k: 'hBikeFix', x: 163.0, z: 213.6 });
// round the back of the bakery yard and the Note Wall
add({ k: 'hBigJar', x: 143.2, z: 185.6 });
add({ k: 'hBaskets', x: 151.4, z: 191.8 });
add({ k: 'hWashTub', x: 160.4, z: 190.4 });
// north side east end: Uncle Chit's kites drying behind his bench, baskets by the tea shop's side wall
add({ k: 'hKiteLine', x: 252.0, z: 189.4, len: 3.4 });
add({ k: 'hBaskets', x: 248.2, z: 193.6 });
add({ k: 'hPotTree', x: 237.4, z: 195.6 });
// the workshop lane's top end (by the district sign) and the kite workshop's yard
add({ k: 'hBigJar', x: 146.0, z: 247.2 });
add({ k: 'hWaterStand', x: 150.3, z: 249.6, ry: -HP });
add({ k: 'hKiteLine', x: 156.6, z: 222.6, len: 3.0, ry: HP });

// ---- kerb life (hearth-kerb.js kinds): worn footpath slabs, scuffed doorsteps, sandals, umbrella stalls, trishaws
// the south footpath between the kerb strip and the front yards (flat: merged into the chunk, no keep-out)
for (let x = 168; x < 256; x += 12) add({ k: 'hFootpath', x: x + 6, z: 205.6, len: 12, d: 1.1, ry: Math.PI, seed: 900 + x });
// scuffed earth where feet go: shop fronts, the side lane's mouth, the Note Wall's foot, the kite bench
for (const [x, z, w, d] of [[141.0, 198.4, 2.6, 1.0], [134.6, 197.8, 1.8, 1.0], [152.6, 197.7, 4.0, 0.8], [160.0, 198.4, 2.2, 0.9],
  [243.0, 198.5, 3.2, 1.0], [251.6, 196.7, 2.2, 1.0], [140.0, 202.1, 2.4, 0.8], [161.0, 209.0, 2.6, 1.2]]) add({ k: 'hWear', x, z, w, d, seed: Math.round(x * 3) });
// slippers left at the row houses' doorsteps, and at the evening class (children leave theirs at the step)
for (const [x, n] of [[177.8, 3], [191.2, 2], [204.6, 4], [218.0, 2], [231.4, 3]]) add({ k: 'hSandals', x: x - 0.6, z: 197.9, n, seed: Math.round(x) });
add({ k: 'hSandals', x: 151.8, z: 202.4, n: 5, seed: 152, ry: Math.PI });
// umbrella stalls on the south kerb (sellers on their stools, customers on the road side)
add({ k: 'hUmbrellaStall', x: 186.2, z: 204.3, goods: 'fritters', ry: Math.PI });
add({ k: 'hUmbrellaStall', x: 214.0, z: 204.3, goods: 'flowers', ry: Math.PI });
add({ k: 'hUmbrellaStall', x: 232.9, z: 204.3, goods: 'fruit', ry: Math.PI });
add({ k: 'hUmbrellaStall', x: 125.6, z: 211.6, goods: 'betel', ry: 0 }); // the west end, by the lamp-mender's neighbours
// two parked trishaws
add({ k: 'hSaika', x: 196.6, z: 204.4, seed: 7 });
add({ k: 'hSaika', x: 125.4, z: 204.4, seed: 12 });
// two hand-painted kerb boards (each is one canvas draw call: keep it to these). What is sold and a house rule;
// never a way to go.
add({ k: 'hKerbBoard', x: 142.8, z: 202.2, ry: Math.PI, my: 'ခေါက်ဆွဲ ပူပူ ရှိတယ်', en: 'Hot noodles today' });
add({ k: 'hKerbBoard', x: 238.8, z: 198.3, ry: 0, my: 'ဒီဆိုင်မှာ တိုးတိုး ပြောပါ', en: 'Speak softly here' });

// ---- the workshop lane (the road up from the Junction, x 148): workshops both sides
laneW('workShed', 223.6, 6.2, 4.8, { goods: 'tin', seed: 31 });
laneW('hHouse', 230.4, 6.0, 5.2, { style: 'one', seed: 33 });
laneW('workShed', 237.2, 6.2, 4.8, { goods: 'baskets', seed: 35, sign: 'ခြင်းတောင်း' });
laneW('hHouse', 244.2, 6.4, 5.6, { style: 'two', seed: 37 });
laneE('hHouse', 216.4, 6.0, 5.2, { style: 'one', seed: 39 });
laneE('workShed', 222.6, 6.0, 4.8, { goods: 'kites', seed: 43, sign: 'စွန်' });
laneE('hHouse', 236.2, 6.2, 5.6, { style: 'two', seed: 45 });
laneE('workShed', 243.2, 6.2, 4.8, { goods: 'paper', seed: 47 });
// (no separate lane sign: the open workshop fronts say what the lane is, and each canvas sign is a draw call)
add({ k: 'hHearthSign', x: 152.6, z: 252.8, ry: 0 }); // the district's name, for those coming up from the Junction
add({ k: 'hPlantPots', x: 144.6, z: 252.4, n: 4 });
add({ k: 'padauk', x: 141.0, z: 251.6, s: 1.05 });
add({ k: 'rain', x: 156.4, z: 249.4, s: 1.1 });
// lane kerb things
for (const [k, x, z, extra] of [
  ['hCrates', 146.0, 220.2, { n: 2, seed: 51 }], ['bikes', 146.1, 227.0, { ry: HP }], ['hTrayStack', 146.0, 233.6, {}], ['hClayStove', 146.0, 240.6, {}],
  ['hSackSeat', 150.0, 219.4, {}], ['hDog', 150.0, 232.8, { ry: -1.2 }], ['hCrates', 150.0, 239.8, { n: 3, seed: 53 }], ['hCat', 150.1, 225.2, { ry: 2.2 }],
]) add({ k, x, z, ...extra });

// ---- lamps (posts on the kerbs; the region's three old ones stay where they were)
for (const x of [129.6, 168.4, 254.4, 156.4, 175.4, 188.0, 201.6, 214.6, 228.2, 237.0, 247.6]) add({ k: 'lamp', x, z: 197.6 });
for (const x of [134.0, 146.0, 151.2, 167.8, 181.2, 195.4, 209.0, 222.8, 236.8, 250.4]) add({ k: 'lamp', x, z: 202.4 });
for (const z of [212.6, 226.0, 240.0, 254.6]) { add({ k: 'lamp', x: 145.6, z }); add({ k: 'lamp', x: 150.4, z: z + 6.6 }); }
for (const z of [190, 176, 160, 146]) add({ k: 'lamp', x: 174.4, z }); // the crease lane
for (const z of [188, 170, 152]) add({ k: 'lamp', x: 255.6, z }); // the clasp road

// ---- back yards behind the north frontage (z 181 .. 190) and the land behind them up to the diary's edge
function yard(x0, x1, z0, seed) {
  const r = rng(seed);
  let x = x0 + 0.8 + r() * 1.2;
  while (x < x1 - 2.5) {
    const p = r(), z = z0 + r() * 1.6;
    if (p < 0.22) add({ k: 'laundry', x: x + 1.7, z, len: 3.2 });
    else if (p < 0.36) add({ k: 'woodpile', x: x + 0.8, z });
    else if (p < 0.48) add({ k: 'jars', x: x + 0.8, z });
    else if (p < 0.6) add({ k: 'garden', x: x + 1.5, z, w: 2.8, d: 1.6, seed: Math.floor(r() * 1e5) });
    else if (p < 0.7) add({ k: 'hens', x: x + 0.9, z: z + 0.5, seed: Math.floor(r() * 1e5) });
    else if (p < 0.8) add({ k: 'hCharcoal', x: x + 0.8, z });
    else if (p < 0.9) add({ k: 'hCrates', x: x + 0.7, z, n: 2, seed: Math.floor(r() * 1e5) });
    else add({ k: 'flowers', x: x + 0.9, z, seed: Math.floor(r() * 1e5) });
    x += 3.8 + r() * 2.2;
  }
}
yard(175, 236, 186.6, 401); // behind the houses east of the crease lane
yard(150, 158, 186.4, 403); // behind the Note Wall
add({ k: 'well', x: 154.2, z: 182.6 });
add({ k: 'fence', x: 178.0, z: 183.0, len: 9.0, ry: 0 });
add({ k: 'fence', x: 196.0, z: 183.0, len: 12.0, ry: 0 });
add({ k: 'fence', x: 218.0, z: 183.0, len: 14.0, ry: 0 });
add({ k: 'hedge', x: 232.0, z: 183.0, len: 8.0, ry: 0 });
// market gardens and plots between the yards and the diary's edge, trees in the middle depth
{
  const r = rng(409);
  for (const [x, z, w, d] of [
    [128, 176, 4.0, 2.2], [133.4, 176.4, 3.6, 2.2], [139, 175.6, 4.2, 2.0], [128.4, 170.6, 3.8, 2.0], [134, 170.8, 4.0, 2.0],
    [180, 176, 4.4, 2.0], [186, 176.4, 4.0, 2.2], [192, 175.8, 4.2, 2.0], [204, 176, 4.4, 2.2], [210, 175.6, 4.0, 2.0],
    [222, 176.2, 4.2, 2.2], [228, 175.8, 4.0, 2.0], [180, 168.4, 4.0, 2.0], [186.2, 168.8, 4.2, 2.2], [208, 168.6, 4.4, 2.0],
    [160, 160, 4.0, 2.0], [166, 160.4, 3.6, 2.0], [192, 156, 4.2, 2.2], [214, 156.6, 4.0, 2.0], [236, 162, 4.2, 2.0],
  ]) add({ k: 'garden', x, z, w, d, seed: Math.floor(r() * 1e5) });
  for (const [k, x, z, s] of [
    ['padauk', 146, 176, 1.1], ['rain', 156, 172, 1.2], ['padauk', 164, 168, 1.0], ['rain', 199, 170, 1.3], ['padauk', 216, 166, 1.1],
    ['rain', 242, 176, 1.2], ['padauk', 248, 160, 1.0], ['rain', 130, 158, 1.25], ['padauk', 142, 150, 1.05], ['rain', 182, 150, 1.2],
    ['padauk', 202, 146, 1.1], ['rain', 226, 148, 1.15], ['padauk', 238, 186, 1.0], ['rain', 160, 146, 1.1], ['padauk', 262.6, 176, 1.0],
    ['rain', 264, 156, 1.15], ['padauk', 263, 192, 0.95],
  ]) add({ k, x, z, s });
  for (let n = 0; n < 22; n++) add({ k: 'tufts', x: 124 + r() * 128, z: 142 + r() * 36, seed: 500 + n });
  add({ k: 'hGoat', x: 196.6, z: 162.4, ry: 0.8 });
  add({ k: 'hens', x: 170.0, z: 172.0, seed: 77 });
  add({ k: 'well', x: 212.0, z: 162.0 });
  add({ k: 'laundry', x: 230.4, z: 168.4, len: 3.6 });
  add({ k: 'woodpile', x: 136.6, z: 164.0 });
  add({ k: 'bench', x: 247.0, z: 172.0, ry: -HP });
  // the crease lane: fences both sides most of the way, a bench where it reaches the split
  add({ k: 'fence', x: 169.2, z: 178.0, len: 16.0, ry: HP });
  add({ k: 'fence', x: 174.8, z: 170.0, len: 20.0, ry: HP });
  add({ k: 'flowers', x: 175.6, z: 150.0, seed: 81 });
  add({ k: 'bench', x: 176.4, z: 144.6, ry: -HP });
}

// ---- yards behind the south side (the workshop lane's backs, and behind the set-back houses)
{
  const r = rng(611);
  for (const [x0, x1, z] of [[122, 138, 214], [122, 138, 228], [122, 138, 242], [158, 168, 216], [158, 168, 232], [158, 168, 246]]) {
    let x = x0 + r() * 1.5;
    while (x < x1 - 2.5) {
      const p = r();
      if (p < 0.25) add({ k: 'laundry', x: x + 1.6, z: z + r() * 2, len: 3.0 });
      else if (p < 0.42) add({ k: 'garden', x: x + 1.5, z: z + r() * 2, w: 2.8, d: 1.6, seed: Math.floor(r() * 1e5) });
      else if (p < 0.55) add({ k: 'woodpile', x: x + 0.8, z: z + r() * 2 });
      else if (p < 0.68) add({ k: 'hens', x: x + 0.9, z: z + r() * 2, seed: Math.floor(r() * 1e5) });
      else if (p < 0.8) add({ k: 'jars', x: x + 0.8, z: z + r() * 2 });
      else add({ k: 'flowers', x: x + 0.9, z: z + r() * 2, seed: Math.floor(r() * 1e5) });
      x += 4.0 + r() * 2.0;
    }
  }
  for (const [k, x, z, s] of [['rain', 127, 222, 1.2], ['padauk', 133, 236, 1.05], ['rain', 126, 248, 1.15], ['padauk', 163, 224, 1.1], ['rain', 165, 240, 1.2], ['padauk', 162, 254, 1.0]]) add({ k, x, z, s });
  for (const [x, z, s] of [[178, 232, 1.2], [196, 236, 1.1], [214, 230, 1.25], [232, 236, 1.1], [248, 230, 1.2], [186, 248, 1.0], [206, 250, 1.15], [226, 250, 1.05], [244, 248, 1.1]]) add({ k: r() < 0.5 ? 'rain' : 'padauk', x, z, s });
  // behind the set-back houses: plots, a well, washing
  for (const [x, z, w, d] of [[176, 226, 4.2, 2.0], [190, 228, 4.0, 2.2], [204, 226, 4.4, 2.0], [220, 228, 4.0, 2.0], [238, 226, 4.2, 2.2]]) add({ k: 'garden', x, z, w, d, seed: Math.floor(r() * 1e5) });
  for (const [x, z] of [[182, 225], [212, 224], [246, 224]]) add({ k: 'laundry', x, z, len: 3.4 });
  add({ k: 'well', x: 198, z: 242 });
  add({ k: 'hGoat', x: 216.6, z: 242.0, ry: 2.2 });
  for (let n = 0; n < 16; n++) add({ k: 'tufts', x: 170 + r() * 84, z: 222 + r() * 32, seed: 700 + n });
}

// ---------------------------------------------------------------------------------
// Doors (doors.js): the threshold on the building face; facing = the way the door looks out
// ---------------------------------------------------------------------------------
const doorN = (room, it, dx, r = 0.95) => ({ room, x: it.x + dx, z: NF + 0.15, facing: 0, r });
export const DOORS = [
  doorN('bakery', BAKERY, 0),
  { room: 'provingroom', x: BACK.x, z: BACK.z + BACK.d / 2 + 1.3, facing: 0, r: 0.95 }, // at the foot of the three brick steps
  doorN('loomshed', LOOM, -3.1, 0.9),
  doorN('hearthtea', TEA, 0, 1.1),
  { room: 'noodlehouse', x: NOODLE.x, z: SF - 0.15, facing: Math.PI, r: 1.05 },
  { room: 'eveningclass', x: KLASS.x - 1.3, z: SF - 0.6, facing: Math.PI, r: 0.95 }, // on the top step
  { room: 'lampshop', x: LW + 0.15, z: LAMP.z + 1.6, facing: HP, r: 0.9 },
  { room: 'boxshop', x: LE - 0.15, z: BOX.z - 0.6, facing: -HP, r: 0.9 },
];

export const DESKS = [
  { id: 'hearthWest', name: { my: 'မီးဖိုတန်း အနောက်ထိပ်', en: 'Hearth Row, west end' }, x: 131.4, z: 194.4, ry: 0 },
  { id: 'hearthClass', name: { my: 'ညနေတန်းရှေ့', en: 'By the evening class' }, x: 156.4, z: 201.5, ry: Math.PI },
];

// ---------------------------------------------------------------------------------
// Named places for the day scripts (world metres): read these instead of laying the Row again
// ---------------------------------------------------------------------------------
export const SPOTS = {
  row: ROW, northFront: NF, southFront: SF, lane: LANE,
  bakery: { x: BAKERY.x, z: BAKERY.z, w: BAKERY.w, d: BAKERY.d, door: { x: BAKERY.x, z: NF + 0.15 }, front: { x: BAKERY.x, z: NF + 1.0 },
    chimneys: [{ x: BAKERY.x - 2.7, y: 8.4, z: BAKERY.z - BAKERY.d / 2 + 1.1 }, { x: BAKERY.x + 2.5, y: 8.4, z: BAKERY.z - BAKERY.d / 2 + 1.1 }] },
  sideLane: { x: 134.9, z: 193.0 }, laneMouth: { x: 134.4, z: 197.0 },
  yard: { x: 139.0, z: 188.2 }, yardWall: { x: 133.2, z: 187.5 }, sackSeat: { x: 134.2, z: 188.2, h: -HP }, // Maung Arkar sits facing west
  ovenHouse: { x: BACK.x, z: BACK.z, w: BACK.w, d: BACK.d }, backStep: { x: BACK.x, z: BACK.z + BACK.d / 2 + 0.6 },
  provingDoor: { x: BACK.x, z: BACK.z + BACK.d / 2 + 1.3 }, ovenVents: [{ x: BACK.x - 2.3, z: BACK.z + BACK.d / 2 }, { x: BACK.x + 2.3, z: BACK.z + BACK.d / 2 }],
  emStep: { x: BACK.x + 1.15, z: BACK.z + BACK.d / 2 + 1.5, h: 0.35 },
  ovenLane: { x: 147.0, z: 194.0 },
  ring: { x: 142.8, z: 199.6 }, cartIdle: { x: 144.2, z: 198.9 }, cartHome: { x: 146.0, z: 198.6 },
  noteWall: { x: WALL.x, z: WALL.z, w: WALL.w, stool: { x: WALL.x - WALL.w / 2 + 0.45, z: WALL.z + 0.8 }, patch: { x: 157.2, z: 196.6 } },
  loom: { x: LOOM.x, z: LOOM.z, door: { x: LOOM.x - 3.1, z: NF + 0.15 }, vats: { x: 168.7, z: 194.6 } },
  tea: { x: TEA.x, z: TEA.z, door: { x: TEA.x, z: NF + 0.15 }, front: { x: TEA.x, z: NF + 1.4 } },
  kite: { x: 251.6, z: 195.0 }, patch: { x: 253.6, z: 192.6 },
  noodle: { x: NOODLE.x, z: NOODLE.z, door: { x: NOODLE.x, z: SF - 0.15 }, kerbPot: { x: 138.6, z: 201.7 }, rack: { x: 134.2, z: 206.6 } },
  lampBench: { x: 131.0, z: 203.5 },
  klass: { x: KLASS.x, z: KLASS.z, door: { x: KLASS.x - 1.3, z: SF - 0.6 }, steps: { x: KLASS.x - 1.3, z: SF - 0.4 }, desk: { x: 156.4, z: 201.5 } },
  hopscotch: { x: 161.0, z: 206.4 },
  workshopLane: { x: LANE, z: 214.0 }, laneMouthS: { x: LANE, z: 203.6 },
  lamp: { x: LAMP.x, z: LAMP.z, door: { x: LW + 0.15, z: LAMP.z + 1.6 }, window: { x: LW + 0.1, y: 1.6, z: LAMP.z - 1.3 } },
  box: { x: BOX.x, z: BOX.z, door: { x: LE - 0.15, z: BOX.z - 0.6 } },
  crease: { x: CREASE.x, z: CREASE.z + 1.2 }, clasp: { x: 258, z: 139.5 },
  commonOven: { x: 198.0, z: 194.6 },
};

// ---------------------------------------------------------------------------------
// Townspeople out on the Row, at their work. Only on days when no day script places them (a day that needs
// someone places them itself; the street then leaves them be): `off` = days they are not out here.
// hello = a short line that hints at the Row's lessons (chapters 14, 15, 18, 21) and never points anywhere.
// ---------------------------------------------------------------------------------
function today() {
  try { const d = globalThis.__story?.save?.day; if (d) return d; } catch { /* not yet */ }
  try { return JSON.parse(globalThis.localStorage?.getItem('rc-story-v1') || 'null')?.day || 0; } catch { return 0; }
}
const job = (x, z, h, mood = 'work', r = 1.0, extra = {}) => ({ area: { x, z, r }, spot: { x, z, h }, mood, workChance: 0.8, workFor: [6, 14], ...extra });
function folk(id, off, x, z, heading, hello, jb) {
  return { get id() { return off.includes(today()) ? `${id}@away` : id; }, x, z, heading, hello, job: jb };
}
export const PEOPLE = [
  ...FOLK_PEOPLE, // the south side's townsfolk at their yard work (hearth-folk.js; they appear once cast.js lists them)
  folk('uchit', [11], 250.6, 196.4, 0, { my: 'ကြိုးကို တင်းတင်း ဆွဲထားရင် စွန်က ပြတ်တယ်။ နည်းနည်း လျှော့ပေးမှ လေထဲမှာ ငြိမ်တာ။', en: 'Pull the line too tight and the kite snaps. Give it a little and it sits still in the wind.' },
    job(250.6, 196.6, 0, 'read', 1.0)),
  folk('kodoe', [11], 146.1, 223.6, -HP, { my: 'ပူနေတဲ့ သံပြားကို လက်နဲ့ မဆွဲနဲ့။ အရင်ဆုံး လောင်တာ ကိုယ့်လက်ပဲ။', en: "Don't grab tin while it's hot. The first hand it burns is your own." },
    job(146.1, 223.6, -HP, 'work', 1.0)),
  folk('nyein', [11], 146.2, 215.6, -HP, { my: 'မီးအိမ်တိုင်းမှာ ပါးတဲ့နေရာ တစ်ခုစီ ရှိတယ်။ အဲဒါကို သိထားရင် မထုမိတော့ဘူး။', en: 'Every lamp has one thin spot. Know where it is and you never hammer it.' },
    job(146.2, 215.6, -HP, 'work', 0.8)),
  folk('sanshar', [11], 149.9, 230.4, HP, { my: 'ခေါက်ရိုး မှန်မှ ဘူးက ပိတ်တယ်။ စိတ်လောရင် စက္ကူပဲ ပြဲတယ်။', en: 'A box only closes if the folds are true. Rush it and the paper tears.' },
    job(149.9, 230.4, HP, 'work', 0.8)),
  folk('maungpan', [11], 161.2, 205.6, 0, { my: 'ဒီအကွက်ကို မနင်းနဲ့နော်၊ ကျွန်တော့်အကွက်! …အရင် မေးရင်တော့ နင်းခွင့်ပေးမယ်။', en: "Don't step on this square, it's mine! …If you ask first, I'll let you." },
    job(161.2, 206.0, 0, 'play', 1.6, { speed: 1.2 })),
  folk('upu', [11], 133.1, 206.6, HP, { my: 'ခေါက်ဆွဲ ခြောက်ချင်ရင် နေထဲ ချိတ်ထား။ စကားလည်း ဒီလိုပဲ၊ မပြောခင် ခဏ အေးပါစေ။', en: 'Want noodles to dry? Hang them in the sun. Words too: let them cool a moment before you say them.' },
    job(133.1, 206.6, HP, 'work', 0.8)),
  folk('sawyu', [9, 11], 138.6, 202.5, Math.PI, { my: 'စကားကြမ်းတာ စိတ်ကောင်းလို့တဲ့လား။ စိတ်ကောင်းရင် စကားကိုလည်း နူးနူးညံ့ညံ့ ပြောလို့ရတာပဲ။', en: 'A rough mouth because of a good heart? A good heart can soften its words too.' },
    job(138.6, 202.5, Math.PI, 'work', 0.6)),
  folk('cherry', [11], 241.4, 198.8, 0, { my: 'သီချင်းဆိုတဲ့အခါ တစ်ယောက်ယောက် ဆုံးအောင် နားထောင်ပေးတာ အကောင်းဆုံး လက်ဆောင်ပဲ။', en: 'When I sing, someone listening to the end is the best gift.' },
    job(241.4, 198.8, 0, 'read', 1.0)),
  folk('nyinyi', [11], 245.0, 198.9, -0.3, { my: 'သူငယ်ချင်းကောင်းက ကြိုးညှိပေးသလိုပဲ။ မပြောခင် သိပြီး ကူတယ်။', en: 'A good friend is like someone tuning your strings: they notice before you say, and help.' },
    job(245.0, 198.9, -0.3, 'work', 0.8)),
  folk('sithu', [13], 168.4, 197.2, Math.PI, { my: 'ရတနာ့ ချည်ကို ဆွဲရင် သူ စိတ်ဆိုးတတ်တယ်။ ဒါကြောင့် မကိုင်ခင် မေးတယ်။', en: "Yadanar gets cross if her thread is pulled. So I ask before I touch it." },
    job(168.4, 197.4, Math.PI, 'work', 0.9)),
  folk('yadanar', [13], 161.4, 198.4, 0, { my: 'ကိုယ် ဘာကို အမုန်းဆုံးလဲ ကိုယ်သိရင် တခြားသူကို ကြိုပြောထားလို့ ရတယ်။', en: 'If you know what you hate most, you can tell people beforehand.' },
    job(161.4, 198.4, 0, 'read', 1.0)),
];
export const SIGNS = [];
