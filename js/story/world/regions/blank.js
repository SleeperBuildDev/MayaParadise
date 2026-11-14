// District 7 · the Blank Page (opens Day 13; Days 13-15, chapter 22 and the finale): an almost empty last
// leaf past the Diary Garden's last hedge, under a low sunset. One roof on it (the travellers' lodge), one
// line of smoke, one lamp-post (the desk's), and across its north edge the Home Book's back cover, standing
// (day13-spec 1, day14-spec 1, INDEX 11/13). Format: regions/index.js. Art: ../art/blank.js.
//
// Layout (world metres, +X east, +Z south; the camera looks north, so every front faces +Z):
//   z 17.4   the last hedge along the seam with the Garden (x 119.6..145.8), a gap at x 138.8..141.2 where the
//            Garden's lane (gNorth) comes through; a pencil stub and a small sign just past it
//   z 17..-3 bPath: two faint pencil lines on the white, curling north-west to the lodge's yard; the desk
//            `blank` on its right (east) under its lamp-post, facing the lodge; a plank bench halfway
//   z -2..-13 the lodge (centre 131, -9.15; 10 x 4 m, verandah and steps on its south face, door at x 131), its
//            swept yard in front, washing line / woodpile / kitchen plot / hens to the west (chimney end),
//            bicycles against its east end, a water-jar stand by the path for passers-by
//   z -13..-58 nothing: open white leaf (Day 13 walks it; "nobody has ever walked north")
//   z -60    the back cover across x 107..145, its door at x 126 (room `backcover`, Day 14)
//   elsewhere faint pencil underdrawings (a house, a tree, hatching) far off the path: the page not yet written
//
// Roads: gHedge (140, 18) -> bPath (pencil) -> bLodge (135.6, -3.0, the yard's north-east corner).
// The road home: blankHome, bLodge -> round the lodge's east end -> north -> bBoard (126, -56.8), in front of
// the back cover's door. GATED and HIDDEN on flag 'backCover': plain white paper until Day 13 inks it
// (world.setFlagGate('backCover', true)); then a gold road.
// Lived-in (blank-life.js kinds, blank-folk.js people): round the lodge and along the path only, never a second
// roof, lamp-post or line of smoke (day13-spec: "one roof, one line of smoke, one lamp-post"), nothing north of
// the lodge on the way to the cover. West of the path (x 116..135, z 0..16): the travellers' rest ground (tea cart
// 133,8.2 · well 127,5 · parked cart 122,9.4 · hopscotch 129.6,13.6 · shade tree and bench 116,7). The lodge's
// west plot inside a woven fence (x 117.2..124.6, z -0.8..-14.6): stove, coop, kindling block, beans, rain jars,
// a second washing line. The fence goes on west in pencil, and pencil streets and plots are laid out on the white
// beyond x 115 (a town not written yet). East strip (x 144..146): a fence from the hedge that turns to pencil.
// Desks (INDEX 7): `blank` (the only desk on the leaf); `backcover` stands INSIDE the Back Cover (inRoom): not
// drawn outdoors, its page-turn spot is on the step in front of the door.
import { LIFE_PROP } from './blank-life.js';
import { FOLK_PEOPLE } from './blank-folk.js';
import { lodge, lodgeYard, lastHedge, backBoard, backBoardObstacles, blankSign, pencilStub, sketch, prints, restBench, LODGE as LG, BACK_DOOR } from '../art/blank.js';

export const REGION = { id: 'blank', name: { my: 'စာမျက်နှာလွတ်', en: 'The Blank Page' }, rect: [46, -62, 146, 18], paper: 'blank', label: [88, -46] };

/** The back cover's front face (z) and its door's centre (x): spans x 107..145, inside the leaf. */
export const BOARD = { x: 126, z: -60.2, w: 38 };
/** The lodge's centre (its front wall is at LODGE.z + 0.6, the steps' foot at LODGE.z + 2.62). */
export const LODGE = { x: 131, z: -9.15 }; // (= day13-world.js P.lodge, so its verandah spots still fit)
const LX = LODGE.x, LZ = LODGE.z;

export const ROAD_NODES = [
  { id: 'bLodge', x: 135.6, z: -3.0 },
  { id: 'bBoard', x: BOARD.x, z: BOARD.z + 3.4 },
];
export const ROAD_EDGES = [
  { id: 'bPath', a: 'gHedge', b: 'bLodge', pts: [[140, 18], [139.7, 10], [138.6, 3], [137.2, -0.6], [135.6, -3.0]], sample: 0.5, style: 'pencil' },
  { id: 'blankHome', a: 'bLodge', b: 'bBoard', pts: [[135.6, -3.0], [138.6, -4.6], [140.0, -8.5], [140.2, -14], [139, -21], [136, -30], [132, -40], [128.4, -49], [126.5, -54.5], [BOARD.x, BOARD.z + 3.4]], sample: 0.5, gate: 'backCover', look: 'hidden' },
];

/** Named spots for the day scripts (world x, z; h = heading Maya/people face there, atan2(dx, dz)). */
export const SPOTS = {
  hedgeGap: { x: 140, z: 17.4, h: Math.PI },          // in the gap of the last hedge (crossing it = d13.arrivedBlank)
  firstStep: { x: 140, z: 15.8, h: Math.PI },         // the first step on the white
  blankSign: { x: 137.6, z: 15.4 },                   // the small sign «စာမျက်နှာလွတ်»
  pencilStub: { x: 136.6, z: 13.2 },                  // where the pencil lines begin
  desk: { x: 143.0, z: 10.6, h: -2.53 },              // desk `blank` (faces the lodge)
  deskView: { x: 141.6, z: 9.2, h: -2.53 },           // beside the desk, looking at the lodge, its smoke, door and lit shutters
  pathBench: { x: 141.9, z: 4.2, h: -Math.PI / 2 },   // the plank bench halfway (sit, facing the path)
  waterJars: { x: 135.6, z: 2.0, h: 1.2 },            // the water-jar stand by the path
  yard: { x: 131.4, z: -3.9, h: Math.PI },            // the lodge's yard, facing the door
  lodgeSteps: { x: LX, z: LZ + 3.0, h: Math.PI },     // at the foot of the steps (the door's walk-in point is just here)
  lodgeDoor: { x: LX, z: LZ + 0.6 },                  // the plank door itself (front wall)
  lantern: { x: LX + 0.86, y: 2.13, z: LZ + 0.9 },     // the lantern on its hook right of the door
  verandahBench: { x: LX - 2.1, z: LZ + 0.9 },        // Daw Pwint's bench (on the verandah: people stand at its foot, lodgeSteps)
  verandahFront: { x: LX - 2.1, z: LZ + 3.0, h: Math.PI }, // in the yard in front of her bench
  chimney: { x: LX - 5.4, y: 5.2, z: LZ - 1.9 },      // the smoke's top
  laundry: { x: 121.8, z: -6.3, h: Math.PI },
  woodpile: { x: 123.0, z: -9.1, h: Math.PI },
  kitchenPlot: { x: 120.6, z: -10.7, h: Math.PI },
  hens: { x: 125.0, z: -3.3 },
  bikes: { x: 137.6, z: -9.9, h: -Math.PI / 2 },
  northLook: { x: 139.6, z: -12.8, h: Math.PI },      // east of the lodge with nothing in front: the dark line in the north shows from here
  walkNorth: [[139.6, -12.8], [140.2, -14], [139, -21], [136, -30], [132, -40], [128.4, -49], [126.5, -54.5]], // the line the walkers take (= blankHome)
  backCover: { x: BOARD.x, z: BOARD.z + 3.4, h: Math.PI },  // bBoard: the road's end, the car stops here
  backDoor: { x: BOARD.x, z: BOARD.z + 0.5, h: Math.PI },   // on the step, at the door (walk-in point once it is open)
  keyhole: { x: BOARD.x + BACK_DOOR.keyX, y: BACK_DOOR.keyY, z: BOARD.z + 0.15 },
  lookBack: { x: 131.0, z: -46.0, h: 0.2 },           // near the cover, turned to look back south at the footprints
};

// ---------------------------------------------------------------------------------
// Things on the leaf
// ---------------------------------------------------------------------------------
export const ITEMS = [
  // the Home Book's back cover across the north edge
  { k: 'backBoard', x: BOARD.x, z: BOARD.z - 0.35, w: BOARD.w },
  // the travellers' lodge and its yard
  { k: 'lodge', x: LX, z: LZ, w: 10.4, d: 4.4 },
  { k: 'lodgeYard', x: LX, z: LZ + 5, seed: 21 },
  { k: 'blankSign', x: 127.4, z: -2.3, ry: 0.12, h: 1.35, w: 1.7, bh: 0.82, vine: true, lines: [{ text: 'ခရီးသည် တည်းခိုဆောင်', size: 40 }, { text: "Travellers' lodge", size: 22, font: 'serif', weight: 600, color: '#6E1F2A' }, { text: 'မှောင်ရင် တိတ်တိတ်လေး နေပေးကြပါ', size: 24, color: '#6E1F2A' }] },
  // the west (chimney) end: washing line, woodpile, a kitchen plot, hens; bicycles at the east end
  { k: 'laundry', x: 121.8, z: -7.3, len: 4.2 },
  { k: 'woodpile', x: 123.0, z: -10.3 },
  { k: 'garden', x: 120.6, z: -12.3, w: 3.2, d: 2.2, seed: 4 },
  { k: 'hens', x: 125.0, z: -3.3, seed: 9 },
  { k: 'bikes', x: 136.75, z: -10.9, ry: Math.PI / 2 },
  { k: 'bikes', x: 136.8, z: -9.0, ry: Math.PI / 2 + 0.1 },
  { k: 'flowers', x: 126.2, z: -6.6, seed: 5 },
  // by the path: a water-jar stand for whoever walks by, a bench halfway, the district's little sign, the stub
  { k: 'jars', x: 135.6, z: 2.0, ry: 1.2 },
  { k: 'restBench', x: 141.9, z: 4.2, ry: -Math.PI / 2 },
  { k: 'blankSign', x: 137.6, z: 15.4, ry: 0.22, lines: [{ text: 'စာမျက်နှာလွတ်', size: 56 }, { text: 'The Blank Page', size: 26, font: 'serif', weight: 600, color: '#6E1F2A' }] },
  { k: 'pencilStub', x: 136.6, z: 13.2, ry: 0.4 },
  // where people walked: faint pencil footprints along the path and across the yard (none north of the lodge)
  { k: 'prints', x: 139.5, z: 9, pts: [[140, 16.8], [139.7, 10], [138.6, 3]], walkers: [-0.45, 0.05, 0.5], seed: 3 },
  { k: 'prints', x: 136.5, z: -1.5, pts: [[138.6, 3], [137.2, -0.6], [135.6, -3.0], [133.4, -4.5], [131.4, -6.1]], walkers: [-0.35, 0.3], seed: 5 },
  { k: 'prints', x: 126, z: -5.7, pts: [[129.6, -5.7], [126.6, -6.0], [123.2, -6.3]], walkers: [0], seed: 7, fade: 0.6 },
  // faint underdrawings far off the path: the page is waiting to be written
  { k: 'sketch', x: 112, z: 3, kind: 'house', s: 1 },
  { k: 'sketch', x: 104, z: -12, kind: 'tree', s: 1.1, crumbs: 4 },
  { k: 'sketch', x: 118.5, z: 9, kind: 'hatch', s: 1 },
  { k: 'sketch', x: 90, z: -30, kind: 'house', s: 0.8, crumbs: 9 },
  { k: 'sketch', x: 70, z: -8, kind: 'tree', s: 1.3 },
  { k: 'sketch', x: 62, z: -42, kind: 'hatch', s: 1.4 },
];

// ---- lived-in (blank-life.js): the travellers' rest ground west of the path
ITEMS.push(
  { k: 'blTeaCart', x: 133.0, z: 8.2, ry: 0.5 },
  { k: 'blWell', x: 127.0, z: 5.0, ry: 0 },
  { k: 'blCart', x: 122.0, z: 9.4, ry: -0.35 },
  { k: 'blBundles', x: 124.9, z: 11.2, ry: 0.2, seed: 5 },
  { k: 'blHopscotch', x: 129.6, z: 13.6, ry: -0.1 },
  { k: 'blTree', x: 116.0, z: 7.2, seed: 7, s: 1.1 },
  { k: 'bench', x: 117.7, z: 5.5, ry: 0.3 },
  { k: 'blBanana', x: 121.0, z: 15.3, seed: 8 },
  { k: 'blBanana', x: 116.3, z: 1.0, seed: 12 },
  { k: 'blDryMat', x: 124.0, z: 2.6, ry: 0.15, load: 'chili' },
  { k: 'blDryMat', x: 130.4, z: 3.4, ry: -0.2, load: 'crackers' },
  { k: 'blCobbler', x: 133.6, z: 0.4, ry: 0 },
  { k: 'tufts', x: 125.0, z: 13.0 }, { k: 'tufts', x: 119.0, z: 4.0 }, { k: 'tufts', x: 131.4, z: 15.6 },
  // where people walked: from the path to the cart and the well, from the well to the yard
  { k: 'prints', x: 136.0, z: 7.4, pts: [[139.1, 6.2], [137.0, 7.2], [134.6, 8.8]], walkers: [0, 0.4], seed: 11, fade: 0.3 },
  { k: 'prints', x: 128.0, z: 1.5, pts: [[127.6, 3.9], [128.0, 1.2], [129.2, -1.6]], walkers: [0], seed: 13, fade: 0.4 },
  { k: 'prints', x: 132.0, z: 4.5, pts: [[138.4, 4.0], [133.0, 5.0], [128.2, 5.4]], walkers: [-0.2], seed: 17, fade: 0.5 },
);
// ---- the lodge's west plot inside a woven fence (gate on its front, next to the yard)
ITEMS.push(
  { k: 'blFence', x: 117.2, z: -7.7, ry: Math.PI / 2, len: 13.8 },
  { k: 'blFence', x: 120.05, z: -0.8, ry: 0, len: 5.7 },
  { k: 'blGate', x: 123.8, z: -0.8, ry: 0 },
  { k: 'blFence', x: 121.4, z: -14.6, ry: 0, len: 8.4 },
  { k: 'blStove', x: 119.2, z: -2.2, ry: 0.2 },
  { k: 'blCoop', x: 124.0, z: -4.7, ry: 0.1 },
  { k: 'blWashLine', x: 120.4, z: -4.5, ry: 0, len: 3.4, seed: 2 },
  { k: 'blBlock', x: 119.0, z: -9.3, ry: 0.3 },
  { k: 'blBeans', x: 124.0, z: -13.3, seed: 11 },
  { k: 'blRainJars', x: 118.0, z: -11.3, ry: Math.PI / 2 },
  { k: 'blBanana', x: 118.3, z: -13.7, seed: 21 },
  // the fence goes on west only in pencil: the next yard is planned, not built
  { k: 'blFence', x: 111.2, z: -0.8, ry: Math.PI, len: 12, pencil: 0.8 },
  { k: 'blFence', x: 111.2, z: -14.6, ry: Math.PI, len: 12, pencil: 1 },
  { k: 'blFence', x: 105.2, z: -7.7, ry: Math.PI / 2, len: 13.8, pencil: 1 },
  { k: 'blTree', x: 114.6, z: -6.4, seed: 4, s: 1.25 },
  // east strip: a fence from the hedge that turns to pencil as it goes north; pots and a banana by the desk
  { k: 'blFence', x: 145.3, z: 7.9, ry: Math.PI / 2, len: 17.6, pencil: 0.5 },
  { k: 'blBanana', x: 144.6, z: -0.4, seed: 6 },
  { k: 'blPots', x: 144.4, z: 5.6, ry: -Math.PI / 2, n: 3 },
  // pencil streets and plots of a town not written yet, west of the lodge (flat: no keep-out, no draw calls)
  { k: 'blPencilTown', x: 105, z: 9, pts: [[114, 9], [96, 9]], w: 4, seed: 2 },
  { k: 'blPencilTown', x: 86, z: 9, pts: [[96, 9], [76, 9]], w: 4, seed: 3 },
  { k: 'blPencilTown', x: 68, z: 9, pts: [[76, 9], [58, 9]], w: 4, seed: 4 },
  { k: 'blPencilTown', x: 96, z: -8, pts: [[96, 17], [96, -12]], w: 3.4, seed: 5 },
  { k: 'blPencilTown', x: 96, z: -26, pts: [[96, -12], [96, -40]], w: 3.4, seed: 6 },
);

// the last hedge (the Garden's farthest), in runs of about six metres, a gap for the path at x 138.8..141.2
const HEDGE_Z = 17.4;
for (const [x0, x1, n] of [[119.6, 138.8, 3], [141.2, 145.8, 1]]) {
  const w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) ITEMS.push({ k: 'lastHedge', x: x0 + w * (i + 0.5), z: HEDGE_Z, len: w, capE: x1 === 138.8 && i === n - 1, capW: x0 === 141.2 && i === 0 });
}
// (the low sunset itself is the day's scripted look: day13.js holds the hour at 18 while Maya is on this leaf)

export const DESKS = [
  { id: 'blank', name: { my: 'စာမျက်နှာလွတ်', en: 'The Blank Page' }, x: SPOTS.desk.x, z: SPOTS.desk.z, ry: SPOTS.desk.h },
  { id: 'backcover', name: { my: 'နောက်ကျောဖုံး အတွင်း', en: 'Inside the Back Cover' }, x: BOARD.x - 1.6, z: BOARD.z + 2.4, ry: 0, inRoom: 'backcover' },
];

// The lodge's people about their evening (Days 13-14 script them indoors; otherwise they are out here).
export const PEOPLE = [
  ...FOLK_PEOPLE, // travellers at their work round the lodge (blank-folk.js; they appear once cast.js lists them)
  { id: 'dawpwint', x: 129.4, z: -5.3, heading: 0, hello: { my: 'လာ သမီး။ ရေနွေးကြမ်း တစ်ခွက် သောက်သွားဦး။', en: 'Come, dear. Have a cup of plain tea before you go.' },
    job: { area: { x: 130.4, z: -4.3, r: 2.6 }, spot: { x: 128.8, z: -5.7, h: 0 }, mood: 'sweep', workChance: 0.6, workFor: [6, 12] } },
  { id: 'pyaesone', x: 136.9, z: -6.6, heading: -0.4, hello: { my: 'ကျွန်တော့် မြေပုံမှာ ဒီရွက် မပါသေးဘူး။', en: "This leaf isn't on my map yet." },
    job: { area: { x: 136.4, z: -5.9, r: 1.4 }, spot: { x: 137.0, z: -6.7, h: -0.5 }, mood: 'read', workChance: 0.6, workFor: [6, 11] } },
  { id: 'shwesin', x: 122.2, z: -6.0, heading: Math.PI, hello: { my: 'ဒီမှာ အဝတ်လှမ်းရင် မြန်မြန်ခြောက်တယ်။ နေက တစ်နေကုန် နိမ့်နိမ့်လေး။', en: 'Washing dries fast here. The sun stays low all day.' },
    job: { area: { x: 122.6, z: -5.3, r: 2.0 }, spot: { x: 122.0, z: -6.4, h: Math.PI }, mood: 'work', workChance: 0.6, workFor: [5, 10] } },
  { id: 'moe', x: 125.4, z: -2.5, heading: 0.6, hello: { my: 'ကြက်မကြီးက ကျွန်တော့်ကို မကြိုက်ဘူး။', en: "The big hen doesn't like me." },
    job: { area: { x: 125.2, z: -2.9, r: 2.4 }, spot: { x: 124.6, z: -2.7, h: 0.6 }, mood: 'play', workChance: 0.55, speed: 1.2 } },
];
export const SIGNS = [];

// Doors (doors.js). The lodge's plank door: its walk-in point is the foot of the steps (the verandah is raised).
// The back cover's door is locked until Day 14's Own Key: it is registered here only once the save has
// 'd14.door'; Day 14 itself calls doors.registerDoors([BACK_COVER_DOOR]) when the key turns.
export const LODGE_DOOR = { room: 'lodge', x: LX, z: LZ + LG.STEP + 0.08, facing: 0, r: 0.9 };
export const BACK_COVER_DOOR = { room: 'backcover', region: 'blank', x: BOARD.x, z: BOARD.z + 0.5, facing: 0, r: 0.9 };
function savedFlag(k) {
  try { return !!JSON.parse(globalThis.localStorage?.getItem('rc-story-v1') || 'null')?.flags?.[k]; } catch { return false; }
}
export const DOORS = [LODGE_DOOR, ...(savedFlag('d14.door') ? [BACK_COVER_DOOR] : [])];

// ---------------------------------------------------------------------------------
// New kinds (art in ../art/blank.js)
// ---------------------------------------------------------------------------------
const circle = (x, z, r) => ({ type: 'circle', x, z, r });
const box = (x0, z0, x1, z1) => ({ type: 'box', minX: x0, maxX: x1, minZ: z0, maxZ: z1 });
export const ART = {
  backBoard: { draw: backBoard, h: 4.2, map: false, obstacles: backBoardObstacles },
  lodge: {
    draw: lodge, h: 5.0, map: true,
    obstacles: (it) => [
      box(it.x - LG.X - 0.12, it.z + LG.ZB - 0.12, it.x + LG.X + 0.12, it.z + LG.STEP + 0.02), // house, verandah, steps
      box(it.x - LG.X - 0.85, it.z - 2.45, it.x - LG.X, it.z - 1.35), // chimney and the hearth's bulge
    ],
  },
  lastHedge: { draw: lastHedge, h: 1.3, obstacles: (it) => [box(it.x - it.len / 2, it.z - 0.42, it.x + it.len / 2, it.z + 0.42)] },
};
export const PROP = {
  lodgeYard: {
    draw: lodgeYard,
    obstacles: (it) => [circle(it.x - 1.25, it.z - 2.0, 0.3), circle(it.x + 1.25, it.z - 2.0, 0.27), box(it.x - 3.75, it.z - 1.85, it.x - 1.45, it.z - 0.55), circle(it.x + 2.0, it.z - 1.6, 0.36), circle(it.x + 2.75, it.z - 1.4, 0.2)],
  },
  blankSign: { draw: blankSign, obstacles: (it) => [circle(it.x, it.z, 0.18)] },
  pencilStub: { draw: pencilStub, obstacles: (it) => [box(it.x - 0.6, it.z - 0.4, it.x + 0.6, it.z + 0.4)] },
  restBench: { draw: restBench, obstacles: (it) => [box(it.x - 0.25, it.z - 0.9, it.x + 0.25, it.z + 0.9)] },
  sketch: { draw: sketch, obstacles: () => [] },
  prints: { draw: prints, obstacles: () => [] },
  ...LIFE_PROP, // the lived-in things (blank-life.js)
};
