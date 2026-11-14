// Everyday houses: the district files' filler homes, shops and workshops (rooms/generic*.js) can be walked into
// in story mode, exactly like a story door (walk Maya into the doorway, or tap the door). No highlight, ring or
// sign marks them: a house is just a house. story.js calls installHouses(game, story) once, after doors.js.
//
// How (cheap on a phone):
// - doorsForItems(ITEMS) once at load (528 doors today), skipping any building a story door already stands at
//   (region doors, the Quarter's, the Home Book's, and whatever today's page has registered by then).
// - A spatial hash (16 m cells). Four times a second, only the generic doors within 30 m of Maya are put into
//   doors.js's DOORS (registerDoors) and the far ones taken out again: doors.js's own per-frame walk-in check
//   and its door taps then only ever look at the story doors plus ~5-25 near houses, never all 528.
// - Rooms are ROOMS-style specs registered with story.doors.registerRooms (spec.generic: doors.js keeps the
//   day's roomOpts / roomCast / enterRoom / leaveRoom hooks away from them). rooms/generic.js loads lazily;
//   a room is built on the way in (iris) and disposed on the way out (not kept in main.js's 3-room cache).
//
// The story never breaks for a house:
// - A building whose footprint holds a story door (any non-generic DOORS entry, today's too, shut or open) is
//   left alone: the day owns it (checked again every refresh, so a door a day registers later wins).
// - Every generic door is shut (DOORS[id].off) while she carries something or has cargo (story.blockedTravel),
//   while she talks, a scene or an act runs (#game.cinema / .acting / .talking / .choosing), during a scripted
//   walk (game.worldWalk), or while the game is busy. A day can opt out: day.genericHouses = false (all shut)
//   or day.genericDoor(door) -> false (that one shut).
// Light: the room follows the hour and the rain (doors.js lightRoom / setRain); the title is the room's name.
//
//   window.__houses / story.houses: { total, live, stats() } (stats: refresh ms, doors live, last scan).
import { DOORS, registerDoors, unregisterDoors } from './doors.js';
import * as REGION from './world/region.js';
import { doorsForItems } from './rooms/generic-doors.js';
import { registerHouses } from './folknames.js';

const CELL = 16;
const NEAR = 30; // (doors.js's door tap looks 26 m out)
const TICK = 0.25;
export const isGenericRoom = (id) => typeof id === 'string' && id.startsWith('g:');

let G = null;
const loadGeneric = () => (G ||= import('./rooms/generic.js'));

export function installHouses(game, story) {
  const doors = story.doors;
  if (!doors?.registerRooms) return null;
  const storyDoors = () => Object.values(DOORS).filter((d) => !isGenericRoom(d.room));
  const all = doorsForItems(REGION.ITEMS, { regionAt: REGION.regionAt, skipDoors: storyDoors() });
  registerHouses(all); // (each town's houses ranked: every resident in a town gets a different name)

  // the rooms: built on the way in (spec.name stays empty: doors.js titles the room with the built room's name)
  const specs = {};
  for (const d of all) {
    specs[d.room] = {
      generic: true,
      district: d.region,
      build: async (o = {}) => (await loadGeneric()).genericRoomSpec(d).build(o),
    };
  }
  doors.registerRooms(specs);

  // the spatial hash
  const grid = new Map();
  const cellKey = (cx, cz) => (cx + 1024) * 2048 + (cz + 1024);
  for (const d of all) {
    const k = cellKey(Math.floor(d.x / CELL), Math.floor(d.z / CELL));
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(d);
  }

  /** A story door inside this house's footprint (the door is at the front; the house runs back from it). */
  function owned(d, sd) {
    const c = Math.cos(d.facing), s = Math.sin(d.facing);
    for (const e of sd) {
      const dx = e.x - d.x, dz = e.z - d.z;
      const lx = dx * c - dz * s, lz = dx * s + dz * c; // world -> the door's local frame (+lz out to the street)
      if (Math.abs(lx) < d.w / 2 + 1.2 && lz > -d.d - 2.2 && lz < 2.2) return true;
    }
    return false;
  }
  const gameEl = () => document.getElementById('game');
  function blockedNow() {
    const g = gameEl();
    const cl = g?.classList;
    return !!(game.busy || story.talking || game.worldWalk || game.ui?.dialogOpen || game.ui?.sheetOpen
      || cl?.contains('cinema') || cl?.contains('acting') || cl?.contains('talking') || cl?.contains('choosing')
      || story.blockedTravel?.() || story.day?.genericHouses === false);
  }

  const live = new Set();
  let acc = TICK, lastMs = 0, avgMs = 0, scans = 0, lastBlocked = false;
  function refresh() {
    const t0 = performance.now();
    const p = story.foot?.pos;
    if (!p) return;
    const blocked = blockedNow();
    const sd = storyDoors();
    const want = new Map();
    const c0x = Math.floor((p.x - NEAR) / CELL), c1x = Math.floor((p.x + NEAR) / CELL);
    const c0z = Math.floor((p.y - NEAR) / CELL), c1z = Math.floor((p.y + NEAR) / CELL);
    for (let cx = c0x; cx <= c1x; cx++) for (let cz = c0z; cz <= c1z; cz++) {
      const list = grid.get(cellKey(cx, cz));
      if (!list) continue;
      for (const d of list) {
        const dx = d.x - p.x, dz = d.z - p.y;
        if (dx * dx + dz * dz > NEAR * NEAR) continue;
        if (owned(d, sd)) continue;
        want.set(d.room, d);
      }
    }
    for (const id of live) {
      if (want.has(id)) continue;
      unregisterDoors([id]);
      live.delete(id);
    }
    for (const [id, d] of want) {
      if (!live.has(id) || !DOORS[id]) {
        registerDoors([{ room: id, x: d.x, z: d.z, facing: d.facing, region: d.region, r: d.r }]);
        live.add(id);
      }
      let off = blocked;
      if (!off && typeof story.day?.genericDoor === 'function') { try { off = story.day.genericDoor(d) === false; } catch { off = false; } }
      DOORS[id].off = off;
    }
    lastBlocked = blocked;
    lastMs = performance.now() - t0;
    avgMs = scans ? avgMs * 0.9 + lastMs * 0.1 : lastMs;
    scans++;
  }

  // a room is built for this visit and goes with it (main.js's cache would keep up to three alive)
  document.addEventListener('rc:room', (ev) => {
    const { id, inside } = ev.detail || {};
    if (inside || !isGenericRoom(id)) return;
    setTimeout(() => {
      for (const [k, r] of game.rooms || []) {
        if (r?.id !== id || r === game.room) continue;
        try { r.dispose?.(); } catch (err) { console.warn('house dispose', err); }
        game.rooms.delete(k);
      }
    }, 0);
    acc = TICK; // (refresh the near doors at once: she is back on the street)
  });

  // residents glance up when she comes close (they are the room's own people, not story cast)
  const _v = { x: 0, y: 1.0, z: 0 };
  function roomTick() {
    const R = story.room;
    if (!R?.residents?.length || !isGenericRoom(story.inRoom)) return;
    const m = game.maya?.root?.position;
    if (!m) return;
    for (const r of R.residents) {
      if (r.lie != null || r.job === 'nap') continue;
      const q = r.p.root.position;
      const near = Math.hypot(m.x - q.x, m.z - q.z) < 2.6;
      if (near) { _v.x = m.x; _v.z = m.z; }
      r.p.lookAt?.(near ? _v : null);
    }
  }

  // load the room builder early, once she is out on the land (the first door then opens without a wait)
  setTimeout(() => { loadGeneric().catch((e) => console.warn('rooms/generic.js', e)); }, 4000);

  const up0 = story.update;
  story.update = (dt, t) => {
    up0(dt, t);
    if (story.inRoom) { roomTick(); return; }
    if (game.mode !== 'world') return;
    acc += dt;
    // (a change in what blocks the doors is picked up the same frame it shows)
    if (acc < TICK && blockedNow() === lastBlocked) return;
    acc = 0;
    refresh();
  };

  const api = {
    total: all.length,
    get live() { return [...live]; },
    doors: all,
    refresh,
    stats() { return { total: all.length, live: live.size, doorsInRegistry: Object.keys(DOORS).length, refreshMs: +lastMs.toFixed(3), refreshAvgMs: +avgMs.toFixed(3), scans, blocked: lastBlocked }; },
  };
  story.houses = api;
  window.__houses = api;
  return api;
}
