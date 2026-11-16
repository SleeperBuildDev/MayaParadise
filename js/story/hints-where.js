// Where the hint line's step happens (owner 2026-11-16: "its hard to locate to play the game, show a small mark on
// the map to show player where to go and if that place arrive on screen, show where to click"; the owner chose the
// DAY'S NEXT STORY PLACE). hints.js asks a few times a second; the corner map (world/minimap.js), the notebook map
// (world/map.js) and the on-screen tap pointer (hints.js) read the answer.
//
// Positions come from DATA, never from loaded meshes (towns stream in lazily, so the place may be in a town that is
// not built yet): a person's live spot (story.people: spawned from the day's own tables, they walk, so it is read
// again every tick), the day's room casts (day.roomCast(roomId): who is inside which room under today's flags) ->
// that room's door (doors.js DOORS), desks (desks.list), town outlines (region.js), the Home Book's places.
//
// An entry (hints/dayN.js) may carry, besides who / target:
//   go: spec    where to go, before who / target (the step is ABOUT someone, but happens somewhere else)
//   at: spec    where to go when who / target cannot be found outdoors (not spawned, or inside a room no roomCast names)
//   mark: false no mark at all (the person / place is the page's surprise: the old border-only behaviour)
// spec: 'door:<roomId>' | 'desk:<deskId>' | 'town:<regionId>' | 'place:<homePlaceId>' | 'who:<castId>'
//       | { who, x?, z? } (the person, else that spot) | { door } | { desk } | { place } | { town, x?, z? } (each + kind?)
//       | { x, z, y?, kind? } | an Object3D / { root } | (s) => any of these (or null).
// Kinds: 'person', 'door', 'thing' (something to tap: the tap pointer shows once it is on screen), 'area' (a town or a
// stretch of ground: the map pin only).
import { DOORS } from './doors.js';
import { ALL_REGIONS } from './world/region.js';
import { castById } from './cast.js';

const CAST_MS = 1000; // the room casts are read once a second (a flag only changes on a beat)

export function createWhere(game, story) {
  // one result object, refilled (no allocation per tick for a person who walks)
  const out = { ok: false, x: 0, z: 0, y: 1, kind: '', obj: null, person: null, name: null, room: null };
  let castKey = '', castAt = -1e9, castRoom = null;

  // (self: false = a person, whose own root a day may hide while they are far off: they are still there)
  function inWorld(o, self = true) {
    const sc = game.world?.scene;
    for (let n = o; n; n = n.parent) {
      if (!n.visible && (self || n !== o)) return false;
      if (n === sc) return true;
    }
    return false;
  }
  function setPoint(x, z, y, kind, name) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
    out.ok = true; out.x = x; out.z = z; out.y = y; out.kind = kind; out.obj = null; out.person = null;
    if (name != null) out.name = name;
    return true;
  }
  function setObj(o, person, kind, name) {
    out.ok = true; out.obj = o; out.person = person || null; out.kind = kind;
    out.x = o.position.x; out.z = o.position.z; out.y = 1;
    // (an Object3D nested in a group: its world spot)
    if (o.parent && o.parent !== game.world?.scene) { o.updateWorldMatrix?.(true, false); out.x = o.matrixWorld.elements[12]; out.z = o.matrixWorld.elements[14]; }
    if (name != null) out.name = name;
    return true;
  }

  /** The live person outdoors (spawned by the day and drawn in the world), or false. */
  function livePerson(id) {
    const c = castById(id);
    const e = story.people?.get(id) || (c && c.id !== id ? story.people?.get(c.id) : null);
    if (!e?.p?.root || e.indoor || !inWorld(e.p.root, false)) return false;
    return setObj(e.p.root, e.p, 'person', c?.name || null);
  }

  /** The room the day puts this person in under today's flags (day.roomCast), as its door; cached per second. */
  function roomOf(id, now) {
    if (castKey !== id || now - castAt > CAST_MS) {
      castKey = id; castAt = now; castRoom = null;
      const day = story.day;
      // (only while she is outdoors and nothing is going in or out: a day's roomCast may note who it placed)
      if (day && typeof day.roomCast === 'function' && !story.inRoom && !game.busy) {
        const m = game.maya?.root?.position;
        let best = Infinity;
        for (const rid in DOORS) {
          const d = DOORS[rid];
          if (!d || d.off) continue;
          let list = null;
          try { list = day.roomCast(rid, null); } catch { list = null; }
          if (!Array.isArray(list)) continue;
          let has = false;
          for (let i = 0; i < list.length; i++) if (list[i]?.id === id) { has = true; break; }
          if (!has) continue;
          const dist = m ? Math.hypot(d.x - m.x, d.z - m.z) : 0;
          if (dist < best) { best = dist; castRoom = rid; }
        }
      }
    }
    if (!castRoom || !DOORS[castRoom]) return false;
    const d = DOORS[castRoom];
    out.room = castRoom;
    return setPoint(d.x, d.z, 1.1, 'door', null);
  }

  function spec(v, now, depth = 0) {
    if (v == null || depth > 3) return false;
    if (typeof v === 'function') { let r = null; try { r = v(story); } catch { r = null; } return spec(r, now, depth + 1); }
    if (typeof v === 'string') {
      const i = v.indexOf(':');
      const k = i > 0 ? v.slice(0, i) : '', id = i > 0 ? v.slice(i + 1) : v;
      if (k === 'door') {
        const d = DOORS[id];
        if (!d) return false;
        out.room = id;
        return setPoint(d.x, d.z, 1.1, 'door', null);
      }
      if (k === 'desk') {
        const d = story.openWorld?.desks?.byId?.(id);
        return d ? setPoint(d.x, d.z, 1.0, 'thing', d.name || null) : false;
      }
      if (k === 'town') {
        const r = ALL_REGIONS.find((q) => q.id === id);
        if (!r) return false;
        const [x0, z0, x1, z1] = r.rect;
        return setPoint((x0 + x1) / 2, (z0 + z1) / 2, 1, 'area', r.name || null);
      }
      if (k === 'place') {
        const p = game.world?.places?.find((q) => q.id === id);
        const c = p?.door || p?.center;
        if (!c) return false;
        out.room = id;
        return setPoint(c.x, c.z, 1.1, 'door', null);
      }
      if (k === 'who') return livePerson(id) || roomOf(id, now);
      return false;
    }
    // object forms: { who } (+ { x, z } where they would be when not found), { door }, { desk }, { place }, { town } (+ a spot in
    // it), each with an optional kind ('area': the map pin only)
    if (!v.isObject3D && !v.root && (v.who || v.door || v.desk || v.place || v.town)) {
      let ok = false;
      if (v.who) {
        ok = livePerson(v.who) || roomOf(v.who, now);
        if (!ok && Number.isFinite(v.x) && Number.isFinite(v.z)) ok = setPoint(v.x, v.z, Number.isFinite(v.y) ? v.y : 1, 'thing', null);
        if (ok) out.name = castById(v.who)?.name || out.name;
      } else if (v.town && Number.isFinite(v.x) && Number.isFinite(v.z)) {
        ok = setPoint(v.x, v.z, 1, 'area', ALL_REGIONS.find((q) => q.id === v.town)?.name || null);
      } else ok = spec(v.door ? `door:${v.door}` : v.desk ? `desk:${v.desk}` : v.place ? `place:${v.place}` : `town:${v.town}`, now, depth + 1);
      if (ok && v.kind) out.kind = v.kind;
      return ok;
    }
    if (v.root?.isObject3D) return inWorld(v.root) ? setObj(v.root, typeof v.headTop === 'function' ? v : null, 'thing', null) : false;
    if (v.isObject3D) return inWorld(v) ? setObj(v, null, 'thing', null) : false;
    if (Number.isFinite(v.x) && Number.isFinite(v.z)) return setPoint(v.x, v.z, Number.isFinite(v.y) ? v.y : 1, v.kind || 'thing', null);
    return false;
  }

  /** Fills and returns `out` for entry h (out.ok false: no mark). Outdoors only (a room has its own border). */
  function resolve(h, now = performance.now()) {
    out.ok = false; out.obj = null; out.person = null; out.name = null; out.room = null; out.kind = '';
    if (!h || h.mark === false || story.inRoom || game.mode !== 'world') return out;
    let ok = false, byWho = false;
    if (h.go != null) ok = spec(h.go, now);
    if (!ok && h.who) ok = byWho = livePerson(h.who) || roomOf(h.who, now);
    if (!ok && h.target) {
      let t = null;
      try { t = typeof h.target === 'function' ? h.target(story) : story.day?.[h.target]; } catch { t = null; }
      ok = spec(t, now);
    }
    if (!ok && h.at != null) { ok = spec(h.at, now); byWho = ok && !!h.who && out.kind !== 'area'; }
    if (!ok) { out.ok = false; return out; }
    // the name on the pin: the entry's own label, else the person's (found through them), else what the place calls itself
    if (h.label) out.name = h.label;
    else if (byWho) out.name = castById(h.who)?.name || out.name;
    else if (!out.name && out.kind === 'door' && out.room && DOORS[out.room]?.name) out.name = DOORS[out.room].name;
    return out;
  }

  return { out, resolve };
}
