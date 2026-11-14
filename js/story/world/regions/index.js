// The registry of region plug-ins: one file per district, merged by ../region.js. To add or fill a
// district, edit ONLY its own file here (and, for a brand-new district, add it to REGION_FILES).
// Nothing else in js/story/world/ needs touching: build.js, stream.js, index.js, map.js, desks.js
// and net.js read everything from the merged tables.
//
// ---------------------------------------------------------------------------------
// REGION FILE FORMAT  (js/story/world/regions/<id>.js; every export is optional except REGION)
// ---------------------------------------------------------------------------------
//   export const REGION = {                    // one object, or an array of them (a district in two rects)
//     id, name: { my, en },                    // the map writes the name once Maya has set foot inside
//     rect: [x0, z0, x1, z1],                  // metres, +X east, +Z south. Rects must not overlap; touching
//                                              // rects (a shared edge) are one continuous land
//     paper: 'ruled' | 'envelope' | 'letter' | 'ledger' | 'newsprint' | 'parchment' | 'diary' | 'blank',
//     label: [x, z],                           // where the map writes the name
//     holes: [[x0, z0, x1, z1], ...],          // cut out of the paper (not walkable): page edges + clouds
//     stream: true,                            //   ...and the holes are a cloud-stream (puffs drifting below)
//     walk: [[x0, z0, x1, z1], ...],           // extra walkable rects outside the paper (jetties, piers)
//     creases: { x: [..], z: [..] },           // 'letter' paper only: where its fold creases run (default thirds)
//     book: true,                              // (home.js only: world.js draws it; no paper here)
//   }
//   export const ROAD_NODES = [{ id, x, z }]   // ids are global: an edge may name a node from another file
//   export const ROAD_EDGES = [{ id, a, b,     // two node ids
//     pts: [[x, z], ...],                      //   optional polyline (first/last snap to the nodes)
//     sample: 0.5, bias: 0.003,                //   centreline spacing; surface lift (crossings: higher wins)
//     style: 'ribbon' | 'deck' | 'pencil',     //   ribbon = maroon bookmark over the clouds; deck = a paper-truss
//                                              //   bridge deck (walkable over holes/clouds, width `deck`);
//                                              //   pencil = two faint pencil lines on the paper (no gold kerbs)
//     deck: 4.2,                               //   walkable deck width for ribbon/deck edges
//     gate: 'flagName', look: 'boom' | 'tear' | 'hidden' | 'door' | 'none', gateAt: [x, z] }]
//                                              //   a GATED edge: closed (not drivable, not walkable) until
//                                              //   world.setFlagGate(flag, true). look = how it looks closed:
//                                              //   boom (striped pole at the edge's `a` end; rises when open),
//                                              //   tear (a torn split at gateAt with a rope; laced with twine
//                                              //   when open), hidden (not drawn at all until open), none
//   export const ITEMS = [{ k: kind, x, z, ry, ... }]   buildings and props (kinds: build.js, or ART/PROP below)
//   export const SIGNS = []                    // (reserved) free-standing canvas signs
//   export const DESKS = [{ id, name: { my, en }, x, z, ry, unlocked?, inRoom? }]  Bookmark Desks (INDEX 7);
//                                              // inRoom: the desk stands inside that room (not drawn outdoors;
//                                              // x, z is where the page-turn puts Maya, outside its door)
//   export const PEOPLE = [{ id, x, z, heading, hello: { my, en }, job }]   ambient townspeople (story.setJob)
//   export const DOORS = [{ room, x, z, facing, r }]   doors into rooms (doors.js)
//   export const OBSTACLES = [{ type: 'box', minX, maxX, minZ, maxZ } | { type: 'circle', x, z, r }]
//   export const ART = { kind: { draw(g, f, it, ctx), h: 6, obstacles?(it), map?: true } }
//   export const PROP = { kind: { draw(g, f, it, ctx), r?: 0.5, obstacles?(it) } }   (or a bare draw function)
//       New kinds, registered into build.js's tables. draw(g, f, it, ctx): g = the outlined solid Geo
//       (kit.js: g.box / boxR / boxMin, item-local, front +Z), f = the flat ground Geo (decals, no outline),
//       ctx.glows.push(x, y, z) a lamp core IN WORLD SPACE (g.tx, g.tz are the item's origin; g.tc / g.ts its
//       turn), ctx.signs.push({ x, y, z, ry, w, h, lines, bg, width, height }) item-local, ctx.smoke.push(x, y, z)
//       world. ART = buildings (`h` metres: when it can stand between the camera and Maya, the cutaway fades it;
//       drawn on the map when `map` and the item has w/d). obstacles(it) -> keep-out shapes in world space
//       (default: a box from it.w/it.d, or a circle of radius r). Region files import only kit.js / toon.js /
//       voxel.js (never build.js or region.js: that would be an import cycle).
//
// THE WHOLE LAND (all rects; +X east, +Z south; the stream x 79..119 runs between the banks):
//   home      [-26, -18, 26, 18]    the Home Book (world.js)
//   exercise  [-71, 40, 79, 160]    1 Exercise-Book Quarter, ruled         <- ribbon bridge from the book
//   envelope  [-26, 160, 34, 258]   the envelope road down to the Market
//   market    [-96, 258, 39, 378]   2 Envelope Market, letter              (route1 border -> mCrease)
//   wharf     [-71, 378, 79, 498]   3 Ledger Wharf, ledger, jetties east   (wLane mSouth -> wHead)
//   junction  [39, 258, 189, 378]   4 Newsprint Junction, hole = the Fold [79, 258, 119, 378]
//                                     mkEast mCounter -> jWest; foldBridge foldW -> foldE  GATE 'bridgeOpen' (boom)
//   hearth    [119, 138, 269, 258]  5 Hearth Row, parchment               (hDown jNorth -> hRowJ)
//   garden    [119, 18, 269, 138]   6 Diary Garden, diary; its south side is the diary's edge (a wall) with
//                                     two ways in: the clasp (hClasp -> gClasp) and the torn crease
//                                     crease hTear -> gTear  GATE 'creaseMended' (tear)
//   blank     [46, -62, 146, 18]    7 The Blank Page                      (bPath gHedge -> bLodge, pencil)
//                                     blankHome bLodge -> bBoard (the back cover)  GATE 'backCover' (hidden)
//
// EXAMPLE (a small district):
//   export const REGION = { id: 'mill', name: { my: 'ဆန်စက်', en: 'The Mill' }, rect: [200, 380, 300, 460], paper: 'ledger', label: [220, 390] };
//   export const ROAD_NODES = [{ id: 'millGate', x: 210, z: 380 }, { id: 'millYard', x: 240, z: 420 }];
//   export const ROAD_EDGES = [{ id: 'millRoad', a: 'hRowE', b: 'millGate', sample: 0.5 }, { id: 'millIn', a: 'millGate', b: 'millYard', sample: 0.5 }];
//   export const ITEMS = [{ k: 'mill', x: 240, z: 412, w: 10, d: 6 }, { k: 'lamp', x: 236, z: 418 }];
//   export const ART = { mill: { h: 6, map: true, draw(g, f, it) { g.box(0, 2, 0, it.w, 4, it.d, '#E9DCC0'); } } };
//   export const DESKS = [{ id: 'mill', name: { my: 'ဆန်စက်ဘေး', en: 'By the mill' }, x: 230, z: 416, ry: 0 }];
import * as home from './home.js';
import * as quarter from './quarter.js';
import * as market from './market.js';
import * as wharf from './wharf.js';
import * as junction from './junction.js';
import * as hearth from './hearth.js';
import * as garden from './garden.js';
import * as blank from './blank.js';

/** Order matters only for drawing seams; ids must be unique across files. */
export const REGION_FILES = [home, quarter, market, wharf, junction, hearth, garden, blank];
