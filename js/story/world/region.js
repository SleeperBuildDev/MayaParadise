// The open world's geography, as data: the merge of every district file in ./regions/ (one file per
// district; the format and an example are at the top of regions/index.js). Everything the chunk builder
// draws, the walker bumps into, the car drives on and the map shows comes from the tables here.
//
// Units are metres; +X east, +Z south (toward the camera); fronts face +Z. The home book (world.js)
// is centred on the origin, 52 x 36 m. The land (GAME-PLAN 5, roads Home <-> 1 <-> 2 <-> 3, 2 <-> 4 (the
// Fold) <-> 5 <-> 6 <-> 7 <-> Home's back cover; the torn crease 5 <-> 6):
//
//        x: -96        -26   34 39      79   119        189      269
//   z -62                                  +-- 7 Blank Page --+
//                   [0 Home]               |  (back cover N)  |
//   z  18                                  +------------+-----+--------------+
//   z  40   +------- 1 Exercise-Book Quarter -------+   |     6 Diary Garden |
//           |              (ruled)                  | c |   (clasp at E end) |
//   z 138   |                                       | l +---- crease ~~ -----+
//   z 160   +------+ envelope road +----------------+ o |     5 Hearth Row    |
//                  |  (envelope)   |                  u |    (parchment)      |
//   z 258   +------+---------------+--+---------+  d  +--------+-----------+
//           |   2 Envelope Market    | 4 Junc  |~fold~| Junction|
//           |      (letter)          |  west   |bridge|  east   |  (newsprint)
//   z 378   +--+---------------------+---------+     +---------+
//              |      3 Ledger Wharf  (ledger) | jetties ->
//   z 498      +-------------------------------+
//
// The cloud-stream runs north-south through x 79..119 (the Fold is the stretch inside the Junction's sheet).
// Gated roads (closed until a day opens them with world.setFlagGate(flag, true)): 'bridgeOpen' (the Fold's
// bridge), 'creaseMended' (the torn crease shortcut), 'backCover' (the road home across the Blank Page).
// Chunks (CHUNK m square) are built only around the player, so a district costs nothing until visited.
import * as home from './regions/home.js';

/** Lazy towns (townloader.js): ?lazy=1 (or window.__LAZY_TOWNS = true; ?lazy=0 forces it off). OFF by default:
 * then every district file is merged at boot, as always. ON: every town's OUTLINE (rects, roads, desks, ground;
 * regions/outlines.js) is merged at boot, and only the towns needed now bring their heavy part (art, items,
 * people); the rest arrive in the background (mergeTown). */
export const LAZY = (() => {
  try {
    const q = new URLSearchParams(globalThis.location?.search || '').get('lazy');
    return q === '1' ? true : q === '0' ? false : globalThis.__LAZY_TOWNS === true;
  } catch { return false; }
})();
/** The district modules merged so far (lazy: grows as towns arrive), in arrival order. */
export const REGION_FILES = [];
export const CHUNK = 40;
/** Chunk grid: column i covers x0 + i*CHUNK.., row j covers z0 + j*CHUNK.. (the whole land, every district). */
export const GRID = { x0: -120, z0: -80, cols: 10, rows: 15 };
/** Map and seen-mask extent (metres): the book and every district round it. */
export const EXTENT = { x0: -100, z0: -66, x1: 272, z1: 502 };

const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

/** Every region rect (home included), in file order. */
export const ALL_REGIONS = [];
/** Land regions (the open world's paper: every region but the home book, which world.js draws). */
export const REGIONS = [];
export const ROAD_NODES = [];
export const ROAD_EDGES = [];
export const ITEMS = [];
export const SIGNS = [];
export const DESKS = [];
export const PEOPLE = [];
export const OBSTACLES = [];
/** New building kinds from region files: kind -> { draw, h, obstacles?, map? } (build.js registers them). */
export const ART = {};
/** New prop kinds from region files: kind -> { draw, r?, obstacles? } (build.js registers them). */
export const PROP = {};
/** Painted-ground tuning (ground.js): region id -> style ({ base: 'meadow', road: 'paper', roadW: 2, ... }), from
 * REGION.ground or the file's own `export const GROUND` (applied to each of its regions). Optional. */
export const GROUND = {};

/** A district's outline: its land, roads, desks and ground style (town: its file name, lazy mode only). */
function mergeOutline(m, town = null) {
  for (const r of list(m.REGION)) {
    ALL_REGIONS.push(r);
    if (!r.book) REGIONS.push(r);
    const g = r.ground || m.GROUND;
    if (g && r.id) GROUND[r.id] = g;
    if (town && r.id) TOWN_OF[r.id] = town;
  }
  ROAD_NODES.push(...list(m.ROAD_NODES));
  for (const e of list(m.ROAD_EDGES)) ROAD_EDGES.push(town ? { ...e, town } : e);
  DESKS.push(...list(m.DESKS));
}
/** A district's heavy part: its buildings and props, people, keep-outs and new kinds. */
function mergePack(m) {
  ITEMS.push(...list(m.ITEMS));
  SIGNS.push(...list(m.SIGNS));
  PEOPLE.push(...list(m.PEOPLE));
  OBSTACLES.push(...list(m.OBSTACLES));
  if (m.ART) for (const [k, v] of Object.entries(m.ART)) ART[k] = typeof v === 'function' ? { draw: v } : v;
  if (m.PROP) for (const [k, v] of Object.entries(m.PROP)) PROP[k] = typeof v === 'function' ? { draw: v } : v;
}
/** Lazy mode: region id -> its town (file name); towns whose heavy part is merged; the outlines. */
export const TOWN_OF = {};
export const LOADED = new Set();
export let OUTLINES = null;
/** Lazy mode (townloader.js): merges a town that arrived later. -> { items, obstacles, people } it added, or null (already in). */
export function mergeTown(town, m) {
  if (LOADED.has(town)) return null;
  const n = { items: ITEMS.length, obstacles: OBSTACLES.length, people: PEOPLE.length };
  LOADED.add(town);
  REGION_FILES.push(m);
  mergePack(m);
  return { items: ITEMS.slice(n.items), obstacles: OBSTACLES.slice(n.obstacles), people: PEOPLE.slice(n.people) };
}
/** Lazy mode: is this land region's town here (always true otherwise)? */
export const regionReady = (r) => !r || !TOWN_OF[r.id] || LOADED.has(TOWN_OF[r.id]);

if (!LAZY) {
  const { REGION_FILES: all } = await import('./regions/index.js');
  for (const m of all) { REGION_FILES.push(m); mergeOutline(m); mergePack(m); }
} else {
  const { TOWNS } = await import('./regions/outlines.js');
  OUTLINES = TOWNS;
  REGION_FILES.push(home);
  mergeOutline(home);
  mergePack(home);
  for (const [t, o] of Object.entries(TOWNS)) mergeOutline(o, t);
  // the towns needed at once: round where the save puts her (or round the home book), and today's own
  // (townboot.js: boot.js started their download at the tap; here they are usually in already)
  const { BOOT_TOWNS, BOOT_MODS } = await import('./townboot.js');
  const mods = await BOOT_MODS;
  BOOT_TOWNS.forEach((t, k) => { if (mods[k]) mergeTown(t, mods[k]); });
}

// sanity: ids unique, every edge's nodes known (a typo in a district file should say where it is)
{
  const ids = new Set();
  for (const n of ROAD_NODES) { if (ids.has(n.id)) console.warn('region: duplicate road node', n.id); ids.add(n.id); }
  for (const e of ROAD_EDGES) if (!ids.has(e.a) || !ids.has(e.b)) console.warn('region: road', e.id, 'names an unknown node');
  const dk = new Set();
  for (const d of DESKS) { if (dk.has(d.id)) console.warn('region: duplicate desk', d.id); dk.add(d.id); }
}

export const HOME = ALL_REGIONS.find((r) => r.book) || { id: 'home', name: { my: 'အိမ်စာအုပ်', en: 'Home Book' }, rect: [-26, -18, 26, 18], label: [0, -13] };
export const { RIBBON_ON_BOOK, BRIDGE, BOOK_KEEP_CLEAR } = home;

/** Gated edges: flag -> [edge data]. An edge with `gate` is closed (not drivable, not walkable) until the flag is on. */
export const GATES = {};
for (const e of ROAD_EDGES) if (e.gate) (GATES[e.gate] ||= []).push(e);

/** Metres from (x, z) to the home book's rect (0 on the book). */
export function bookDist(x, z) {
  const [x0, z0, x1, z1] = HOME.rect;
  return Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1));
}

/** The land region whose paper is under (x, z) (holes excluded), or null. */
export function regionAt(x, z) {
  for (const r of REGIONS) {
    const [x0, z0, x1, z1] = r.rect;
    if (x < x0 || x > x1 || z < z0 || z > z1) continue;
    if ((r.holes || []).some(([a, b, c, d]) => x > a && x < c && z > b && z < d)) continue;
    return r;
  }
  return null;
}
