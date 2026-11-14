// District 0 · the Home Book (world.js draws the book itself; this file only says where it lies, the
// ribbon road from the plaza down over its tail edge, the bridge onto the land, and the home desk).
// Region file format: see regions/index.js.

export const REGION = { id: 'home', book: true, name: { my: 'အိမ်စာအုပ်', en: 'Home Book' }, rect: [-26, -18, 26, 18], label: [0, -13] };

/** The ribbon road on the book: from the plaza ring (just east of the fountain) to the tail edge (world.js paints it). */
export const RIBBON_ON_BOOK = [[2.75, 9.263], [3.9, 10.25], [4.9, 11.6], [5.35, 13.2], [5.4, 15], [5.4, 18.9]];
/** Then over the clouds as the bookmark ribbon, down onto the Quarter's landing green. */
export const BRIDGE = { pts: [[5.4, 18.9], [5.4, 24], [4.75, 30.5], [4.05, 36], [4, 41.2]], deck: 3.6 };
/** Keep these spots free of the book's set dressing (a flower bed stood where the ribbon road runs). */
export const BOOK_KEEP_CLEAR = [[3.6, 10.6, 6.4, 13.4]];

export const ROAD_NODES = [{ id: 'bookTail', x: 5.4, z: 18.9 }];
// (the bridge's far node `landing` belongs to the Quarter)
export const ROAD_EDGES = [{ id: 'bridge', a: 'bookTail', b: 'landing', pts: BRIDGE.pts, bias: 0.004, style: 'ribbon', deck: BRIDGE.deck }];

export const DESKS = [
  { id: 'home', name: { my: 'စာရေးခန်းဘေး', en: 'By the Writing Room' }, x: -3.7, z: 11.3, ry: 0.35, unlocked: true },
];

// ---------------------------------------------------------------------------------
// The Post Office's story places (story mode only: the open world builds these items)
// ---------------------------------------------------------------------------------
// The sorting room's narrow green side door «စာခွဲခန်း», on the Post Office's WEST wall (the building runs
// x 15.2..19.6, z -1.6..2.6; main door 16.3 on the front). Every day enters `sortingroom` through this one
// door (Days 3, 6, 8-15); it looks out west (facing -PI/2), so she walks in heading east. (z 1.7, not 0.9:
// the west wall's window fills z -0.4..1.0.)
export const SORT_DOOR = { room: 'sortingroom', x: 15.05, z: 1.7, facing: -Math.PI / 2, r: 0.85 };
// The "ask Maya" board (INDEX 13.4), ONE for every day: on its two posts in the paved strip between the road
// and the Post Office's west wall, just north of the window, facing south like every sign (the camera looks
// north), a few steps from the side door. (The car stop `contact` pad, the gold circle at (13.4, 2.6), is south
// of the door.) Its cork face (the day's notes) is drawn by story.board (api.js, props.js askMayaBoard); `stand`
// is where Maya reads it.
export const ASK_BOARD = { x: 14.2, z: -0.55, ry: 0, stand: { x: 14.2, z: 0.5 } };

export const DOORS = [SORT_DOOR];
export const ITEMS = [{ k: 'sortDoor', x: 15.2, z: SORT_DOOR.z, ry: -Math.PI / 2 }];
export const OBSTACLES = [
  { type: 'box', minX: ASK_BOARD.x - 0.84, maxX: ASK_BOARD.x + 0.84, minZ: ASK_BOARD.z - 0.14, maxZ: ASK_BOARD.z + 0.12 },
];

/** The side door, drawn on the wall (item at the wall line x 15.2, local +Z = west, out of the wall). */
function sortDoor(g) {
  g.box(0, 1.2, 0.03, 1.02, 2.4, 0.06, '#C9A24A'); // gold frame
  g.box(0, 1.2, 0.07, 0.8, 2.2, 0.04, '#2F6B4F'); // the narrow green leaf
  for (const y of [0.62, 1.66]) g.box(0, y, 0.1, 0.62, 0.72, 0.02, '#3E7E5E'); // panels
  g.box(0, 1.24, 0.11, 0.34, 0.05, 0.02, '#C9A24A'); // brass letter slot
  g.box(0.27, 1.05, 0.12, 0.06, 0.06, 0.04, '#C9A24A'); // knob
  g.box(0, 2.08, 0.11, 0.56, 0.2, 0.02, '#F6F0E2'); // the plate
  g.box(0, 2.08, 0.125, 0.44, 0.04, 0.01, '#6E1F2A');
  g.box(0, 0.06, 0.32, 1.0, 0.12, 0.42, '#B98E5C'); // the step down to the street
}
export const PROP = { sortDoor: { draw: sortDoor, obstacles: () => [] } };
