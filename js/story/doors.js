// Doors into rooms (story mode only; INDEX 13.5). A door is just a door the player sees: an open
// doorway, a lit window, a sign. No ring, arrow, glow pin or route ever shows where to go. Walking Maya
// into a door's front on foot (or tapping the door) goes inside with the site's own iris; walking out
// through the room's doorway (or "Go outside", or the phone's back) puts her outside the same door,
// on foot, facing the street, with the close FOOT_VIEW camera.
//
//   import { createDoors, registerDoors, DOORS } from './doors.js';
//   const doors = await createDoors(game, story)        story.js, once (after the talk system)
//   registerDoors([{ room, x, z, facing, region, r, site }])   or { roomId: { x, z, facing, region } }
//
//   DOORS[roomId] = { room, x, z, facing, region, r, site }   world metres; (x, z) the threshold on the
//       building's face; facing = the way the door looks out (radians, Math.atan2(dx, dz): 0 = +Z, the
//       street south of a north-side house); r = how close Maya must come (default 0.75); site = a
//       Home Book room built by js/game/interiors/<id>.js.
//
//   story.enter(id, opts) -> Promise<bool>   scripts: straight into a room (iris). opts:
//       { at: spotName | { x, z, h }   start there instead of the doorway,
//         door: doorId                 the door she comes out of later (default: the room's own),
//         cast: false                  do not place the room's default people,
//         dress: { ... }               extra build options for the room (a day's dressing),
//         fast: true }                 a shorter walk-in
//   story.exit(opts) -> Promise<bool>  { to: doorId | { x, z, heading }, onFoot: true (default) | false (back
//       into the car), instant: true (no walk to the doorway first) }
//   story.inRoom                       the room id while inside, else null
//   story.room                         the room as built (spots, stations, handles like setJars...) or null
//   story.spawn(id, at) inside: at = a room spot name ('teacher') or { x, z, h|heading }
//   story.doors.onStation(stationId, fn(ctx))   a story tap on a room station; also story.day.station(id, ctx)
//   story.doors.addOverlay(fn(room, id, opts) -> layer)   dress a Home Book room in story mode (garden.js's
//       dressHomeRoom is picked up by itself); layer: { group, spots, stations, update, setEvening, setRain, dispose }
//   story.doors.setRain(on)            rain look for the room now and every room after
//   story.doors.registerRooms(ROOMS)   extra room specs ({ id: { name, build } }), e.g. a test stub
//   story.doors.setDoor(id, on)        shut a door for now (on = false: walking or tapping into it does nothing)
//   story.doors.unregisterDoors(ids)   take doors a day added away again (dispose)
//   story.doors.walkOn(who)            a room walk-on drawn by doors ({ p, who, name }) while inside, or null
//   story.tapHooks                     consulted inside rooms too (api.js pickSpot works indoors)
//   ROOM_VIEW (onfoot.js)              every room in story mode, story or Home Book, uses this close low follow
//                                      camera; talks keep story.js's low two-shot; no whole-room overview shot.
//
// Day hooks (all optional, on the day module returned by DAYS[n].create(story)):
//   day.roomOpts(id) -> build options      day.roomCast(id, room) -> [{ id, spot }] (default: room.cast)
//   day.enterRoom(id, room)                after the iris opens        day.leaveRoom(id, room)  before leaving
//
// Rooms come from js/story/rooms/*.js (each exports ROOMS = { id: { name, build(opts) -> room } }), imported
// lazily; a missing file is skipped. Inside, main.js's own room loop walks her (room obstacles), and the
// story's people, talk system and acts run as outdoors: story.foot points at the room walker while inside.
import * as THREE from '../game/three.js';
import { tr } from '../game/ui.js';
import { BARKS } from '../game/strings.js';
import { FOOT_VIEW, CAR_VIEW, ROOM_VIEW } from './onfoot.js';
import * as REGION from './world/region.js';
import { createPerson } from './people.js';
import { castById } from './cast.js';
import { createEntryFrame } from './rooms/entry-frame.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- the room cut-away (world/cutaway.js does the same outdoors): while she is inside, whatever stands
// between the camera and Maya (the follow camera) or between the camera and the two speakers (a talk's
// two-shot, story.talkWith) dissolves: the doorway's posts, the front lip's trim, a counter's near end.
// Screen-space: a fragment inside a speaker's on-screen box, nearer the camera than that speaker by more
// than 0.4 m, above the floor and not right at either speaker's feet, is dropped (a dithered edge).
// The patch is added once per material (onBeforeCompile, chained), switched on only inside rooms.
const RCUT = {
  on: { value: 0 },
  rect: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] }, // NDC minX, minY, maxX, maxY per speaker; [2] both (the gap between them)
  dep: { value: new THREE.Vector4() }, // view depth limit 0, 1; on 0, 1
  dep2: { value: new THREE.Vector2() }, // the gap: depth limit (the nearer speaker's), on
  prot: { value: new THREE.Vector4() }, // speaker 0 (x, z), speaker 1 (x, z): kept within 0.45 m
};
const RCUT_V = `uniform float uRcOn;
varying vec4 vRcClip;
varying vec3 vRcW;
void main() {`;
const RCUT_VB = `
  vRcClip = gl_Position;
  {
    vec4 rcw = vec4( transformed, 1.0 );
    #ifdef USE_INSTANCING
      rcw = instanceMatrix * rcw;
    #endif
    vRcW = ( modelMatrix * rcw ).xyz;
  }`;
const RCUT_F = `uniform float uRcOn;
uniform vec4 uRcRect[ 3 ];
uniform vec4 uRcDep;
uniform vec2 uRcDep2;
uniform vec4 uRcProt;
varying vec4 vRcClip;
varying vec3 vRcW;
float rcNoise() { return fract( sin( dot( floor( gl_FragCoord.xy ), vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ); }
void main() {
  if ( uRcOn > 0.5 && vRcW.y > 0.1 && length( vRcW.xz - uRcProt.xy ) > 0.45 && ( uRcDep.w < 0.5 || length( vRcW.xz - uRcProt.zw ) > 0.45 ) ) {
    vec2 rcN = vRcClip.xy / vRcClip.w;
    float rcK = 0.0;
    for ( int k = 0; k < 3; k++ ) {
      float lim = k == 0 ? uRcDep.x : k == 1 ? uRcDep.y : uRcDep2.x;
      float use = k == 0 ? uRcDep.z : k == 1 ? uRcDep.w : uRcDep2.y;
      if ( use < 0.5 || vRcClip.w > lim ) continue;
      vec4 r = uRcRect[ k ];
      vec2 e = min( rcN - r.xy, r.zw - rcN );
      float inside = min( e.x / 0.05, e.y / 0.05 );
      rcK = max( rcK, min( inside, ( lim - vRcClip.w ) / 0.1 ) );
    }
    if ( rcK > 0.0 && ( rcK >= 1.0 || rcNoise() < rcK ) ) discard;
  }`;
const rcutDone = new WeakSet();
function rcutPatch(mat) {
  if (!mat || rcutDone.has(mat) || mat.isShaderMaterial || mat.isSpriteMaterial || mat.isRawShaderMaterial) return;
  rcutDone.add(mat);
  const base = mat.onBeforeCompile;
  let baseKey = '';
  try { baseKey = String(mat.customProgramCacheKey()); } catch { /* none */ }
  mat.onBeforeCompile = function (shader, renderer) {
    base?.call(this, shader, renderer);
    if (!shader.vertexShader.includes('#include <project_vertex>') || !shader.vertexShader.includes('void main() {')) return;
    shader.uniforms.uRcOn = RCUT.on;
    shader.uniforms.uRcRect = RCUT.rect;
    shader.uniforms.uRcDep = RCUT.dep;
    shader.uniforms.uRcDep2 = RCUT.dep2;
    shader.uniforms.uRcProt = RCUT.prot;
    shader.vertexShader = shader.vertexShader.replace('void main() {', RCUT_V).replace('#include <project_vertex>', '#include <project_vertex>' + RCUT_VB);
    shader.fragmentShader = shader.fragmentShader.replace('void main() {', RCUT_F);
  };
  mat.customProgramCacheKey = () => baseKey + '|rcut2';
  mat.needsUpdate = true;
}
/** Patch every material in a room scene (people and Maya are left alone). */
function rcutScene(scene, skip) {
  const walk = (o) => {
    if (o.userData?.isPerson || skip.includes(o)) return;
    if (o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) rcutPatch(m);
    for (const c of o.children) walk(c);
  };
  walk(scene);
}
const _rcV = new THREE.Vector3();
/** The on-screen box (NDC) and view depth of a standing person at p (height h), for camera cam. */
function rcutBox(cam, p, h, rect) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const dx of [-0.36, 0.36]) for (const dz of [-0.36, 0.36]) for (const y of [0, h]) {
    _rcV.set(p.x + dx, y, p.z + dz).project(cam);
    x0 = Math.min(x0, _rcV.x); x1 = Math.max(x1, _rcV.x); y0 = Math.min(y0, _rcV.y); y1 = Math.max(y1, _rcV.y);
  }
  rect.set(x0 - 0.09, y0 - 0.2, x1 + 0.09, y1 + 0.08); // (wider than the dithered edge: none of it falls on them; down past the feet)
  _rcV.set(p.x, h * 0.5, p.z).applyMatrix4(cam.matrixWorldInverse);
  return -_rcV.z;
}

/** roomId -> door. Filled from region data (region.js `DOORS`), the Home Book's places, and registerDoors(). */
export const DOORS = {};

/** Add doors: an array of { room, x, z, facing, region, r, site } or an object { roomId: { x, z, ... } }. */
export function registerDoors(list) {
  const arr = Array.isArray(list) ? list : Object.entries(list || {}).map(([room, d]) => ({ room, ...d }));
  for (const d of arr) {
    const id = d.room || d.id;
    if (!id || !Number.isFinite(d.x) || !Number.isFinite(d.z)) continue;
    DOORS[id] = { room: id, x: d.x, z: d.z, facing: d.facing ?? 0, region: d.region || null, r: d.r ?? 0.75, site: !!d.site, name: d.name || null, off: !!d.off };
  }
  return DOORS;
}

/** Take doors away again: ids, or door objects { room, x, z } (an object only removes the door if it is still that one). */
export function unregisterDoors(list) {
  for (const d of Array.isArray(list) ? list : [list]) {
    const id = typeof d === 'string' ? d : d?.room || d?.id;
    if (!id || !DOORS[id]) continue;
    if (typeof d === 'object' && Number.isFinite(d.x) && (DOORS[id].x !== d.x || DOORS[id].z !== d.z)) continue; // someone else's door now
    delete DOORS[id];
  }
  return DOORS;
}

// Doors of buildings already standing in the Exercise-Book Quarter (INDEX 13.1), until the district
// files declare their own DOORS (those, registered after, win). The potter's shed is open-fronted: its threshold is the shed floor's edge.
const QUARTER_DOORS = [
  { room: 'snackshop', x: 15, z: 59.3, facing: 0, region: 'exercise', r: 0.8 },
  { room: 'classroom', x: -11.5, z: 88.6, facing: 0, region: 'exercise', r: 0.8 }, // the porch's green double door
  { room: 'pottershed', x: 46, z: 114.5, facing: 0, region: 'exercise', r: 1.1 },
];
// The four Home Book rooms the story uses (the site's Post Office and Script Studio stay the site's)
const HOME_ROOMS = ['about', 'templates', 'content', 'library'];
// Which rooms file builds which room (a hint: unknown ids are looked up in every file)
const ROOM_FILES = ['quarter', 'market', 'wharf', 'junction', 'hearth', 'garden'];
const HINT = {};
for (const [f, ids] of Object.entries({
  quarter: 'classroom snackshop pottershed quartertea bordertea',
  market: 'teashop marketpost postroom riceshop sundries carvershop',
  wharf: 'weighhouse sandahouse caneshed bridgehut',
  junction: 'letterroom junctiontea schoolroom press',
  hearth: 'bakery provingroom noodlehouse eveningclass boxshop lampshop hearthtea loomshed',
  garden: 'kilntea paperstore packroom gourdhouse hpohtawshed dryinghall committeeroom lodge backcover sortingroom',
})) for (const id of ids.split(' ')) HINT[id] = f;

const fileCache = new Map();
function loadFile(f) {
  if (!fileCache.has(f)) fileCache.set(f, import(`./rooms/${f}.js`).catch((e) => { console.warn(`rooms/${f}.js`, e?.message || e); return null; }));
  return fileCache.get(f);
}

export async function createDoors(game, story) {
  const foot = story.foot;
  const save = story.save;
  const people = story.people;
  const extraRooms = new Map();
  const stationFns = new Map();
  const overlays = [];
  let cur = null; // { id, R, built, exitTo, doorId, stash, swap, pushed }
  let coolId = null; // the door she just came out of: it waits until she has stepped away
  let rain = save.weather === 'rain'; // (Day 12's scripted rain; doors.setRain() for anything else)

  // ---- the registry: region data, the Quarter's standing buildings, the Home Book's story rooms
  registerDoors(QUARTER_DOORS);
  if (REGION.DOORS) registerDoors(REGION.DOORS);
  // each district file may declare its own: export const DOORS = [{ room, x, z, facing, r }] (regions/index.js)
  // (region.js's REGION_FILES: every district file; with lazy towns, those here so far, the rest on 'rc:town-ready')
  const regionDoors = (m) => {
    if (!m?.DOORS) return;
    const rid = (Array.isArray(m.REGION) ? m.REGION[0] : m.REGION)?.id || null;
    const list = Array.isArray(m.DOORS) ? m.DOORS : Object.entries(m.DOORS).map(([room, d]) => ({ room, ...d }));
    registerDoors(list.map((d) => ({ region: rid, ...d })));
  };
  try { for (const m of REGION.REGION_FILES || []) regionDoors(m); } catch (err) { console.warn('region doors', err?.message || err); }
  if (REGION.LAZY) window.addEventListener('rc:town-ready', (e) => { try { regionDoors(e.detail?.module); } catch (err) { console.warn('region doors', err?.message || err); } });
  for (const id of HOME_ROOMS) {
    const pl = game.world.places.find((p) => p.id === id);
    if (pl?.door && !DOORS[id]) registerDoors([{ room: id, x: pl.door.x, z: pl.door.z, facing: 0, region: 'home', r: 0.7, site: true }]);
  }

  // ---- finding and building rooms
  /** -> { spec, mod } (mod: the rooms file, for its walk-on looks) or null */
  async function findSpec(id) {
    if (extraRooms.has(id)) return extraRooms.get(id);
    const order = HINT[id] ? [HINT[id], ...ROOM_FILES.filter((f) => f !== HINT[id])] : ROOM_FILES;
    for (const f of order) {
      const m = await loadFile(f);
      if (m?.ROOMS?.[id]) return { spec: m.ROOMS[id], mod: m };
    }
    return null;
  }
  const isSite = (id) => !!game.placeById?.(id);
  // an everyday house (extras-houses.js, spec.generic) belongs to no day: the day's room hooks never see it
  const dayFor = (id) => (extraRooms.get(id)?.spec?.generic ? null : story.day);
  const eveningK = () => Math.max(0, Math.min(1, game.day?.lamps ?? game.day?.state?.lamps ?? 0));

  /** A story room in the shape main.js's room loop wants (its stations stay story taps, never site sheets). */
  function adapt(id, spec, built) {
    const W = built.width ?? (built.bounds ? built.bounds.maxX - built.bounds.minX + 0.6 : 7);
    const D = built.depth ?? (built.bounds ? built.bounds.maxZ - built.bounds.minZ + 0.45 : 8);
    const hw = W / 2, hd = D / 2;
    const door = { x: 0, z: hd - 0.35, r: 0.7, ...(built.door || {}) };
    return {
      id,
      story: built,
      placeName: spec.name || built.name || { my: id, en: id },
      scene: built.scene,
      width: W, depth: D, height: built.height ?? 3,
      bounds: built.bounds || { minX: -hw + 0.3, maxX: hw - 0.3, minZ: -hd + 0.35, maxZ: hd - 0.1 },
      obstacles: built.obstacles || [],
      door,
      spawn: built.spawn || { x: door.x, z: door.z - 0.75, heading: Math.PI },
      stations: [], // main.js opens site sheets at stations: story rooms have none of those
      update(dt, t) { call(built, 'update', dt, t); },
      dispose() { call(built, 'dispose'); },
    };
  }

  async function loadRoom(id, o) {
    if (isSite(id) && !extraRooms.has(id)) return game.getRoom(id); // the site's own room (dressed by the getRoom wrapper)
    const found = await findSpec(id);
    if (!found) return null;
    const { spec, mod } = found;
    const dress = { ...(call(dayFor(id), 'roomOpts', id) || {}), ...(o.dress || {}) };
    const opts = { day: save.day, quality: game.tier, ...dress, evening: eveningK(), rain };
    const key = `story:${id}:${save.day}:${JSON.stringify(dress)}`;
    const R = await game.getRoom(key, async () => adapt(id, spec, await spec.build(opts)));
    R.spec = spec; R.mod = mod;
    return R;
  }

  // ---- Home Book rooms in story mode: story props on top (the site's rooms are unchanged without ?story)
  async function dressHome(room, id) {
    if (!HOME_ROOMS.includes(id)) return;
    const day = save.day;
    if (room.storyLayer?.day === day) return;
    if (room.storyLayer) { room.storyLayer.dispose(); room.storyLayer = null; }
    const fns = overlays.slice();
    const g = await loadFile('garden');
    if (typeof g?.dressHomeRoom === 'function') fns.push(g.dressHomeRoom);
    const layers = [];
    for (const fn of fns) {
      try {
        const L = await fn(room, id, { day, evening: eveningK(), rain, flags: save.flags, story });
        if (!L) continue;
        if (L.group && !L.group.parent) room.scene.add(L.group);
        layers.push(L);
      } catch (err) { console.error('room overlay', id, err); }
    }
    if (!layers.length) return;
    // story mode: the site's stations (and their gold markers) give way to the story's taps, once a layer
    // brings anything of its own (hideSite: true / false decides outright)
    const hide = layers.some((L) => L.hideSite ?? !!(L.group || L.stations?.length));
    if (hide && !room.siteStations) {
      room.siteStations = room.stations;
      for (const s of room.siteStations) if (s.marker) s.marker.visible = false;
      room.stations = [];
    }
    room.storyLayer = {
      day,
      stations: layers.flatMap((L) => L.stations || []),
      spots: Object.assign({}, ...layers.map((L) => L.spots || {})),
      update(dt, t) { for (const L of layers) call(L, 'update', dt, t); },
      setEvening(k) { for (const L of layers) call(L, 'setEvening', k); },
      setRain(on) { for (const L of layers) call(L, 'setRain', on); },
      dispose() { for (const L of layers) { L.group?.removeFromParent(); call(L, 'dispose'); } },
    };
    if (!room.storyWrapped) {
      room.storyWrapped = true;
      const up = room.update, dis = room.dispose;
      room.update = function (dt, t, st) { up?.call(this, dt, t, st); room.storyLayer?.update(dt, t); };
      room.dispose = function () { room.storyLayer?.dispose(); room.storyLayer = null; return dis?.call(this); };
    }
  }
  const getRoom = game.getRoom.bind(game);
  game.getRoom = async (id, build) => {
    const room = await getRoom(id, build);
    if (!build && room) { try { await dressHome(room, id); } catch (err) { console.error('dress room', err); } }
    // story mode never points the way: the site rooms' gold station rings and gems stay hidden (the
    // stations still answer a tap)
    for (const s of room?.stations || []) if (s.marker?.isObject3D) s.marker.visible = false;
    return room;
  };

  // ---- light: the room follows the hour (lamps up at dusk) and the weather
  function lightRoom() {
    if (!cur) return;
    const k = eveningK();
    const L = cur.built || cur.R.storyLayer;
    call(L, 'setEvening', k);
    call(L, 'setRain', rain ? 1 : 0);
  }
  const applyDayLook = game.applyDayLook.bind(game);
  game.applyDayLook = () => { applyDayLook(); lightRoom(); };

  // ---- the room camera: the close, low follow camera (as on foot outdoors, a little nearer), phones and
  // laptops alike, for every room in story mode (story rooms and the Home Book's). Never the whole-room
  // view. Talks keep story.js's low two-shot. A day may still set its own close view in day.enterRoom.
  // The look point may slide toward the back wall freely (a band of paper above the back wall is the
  // cut-away's sky), but never so far toward the doorway that the screen's lower part runs past the
  // room's front lip, nor sideways past the side walls.
  /** the look point's range for a view of this width: sideways inside the side walls, toward the doorway
   * no further than the front lip allows (the room's own minZ at the back) */
  function camLimits(R, V, width) {
    const cam = game.rig.camera;
    const ta = Math.tan(THREE.MathUtils.degToRad(cam?.fov || 45) / 2), aspect = cam?.aspect || 0.45;
    const d = width / 2 / (ta * aspect); // the rig's distance for that width (minHeight 0)
    const t = THREE.MathUtils.degToRad(V.tilt);
    const W = R.width ?? 7, D = R.depth ?? 8;
    const b = R.bounds || { minX: -W / 2 + 0.3, maxX: W / 2 - 0.3, minZ: -D / 2 + 0.35, maxZ: D / 2 - 0.1 };
    const frontZ = D / 2 + 0.1;
    const camH = V.height + d * Math.sin(t);
    // (the lowest ~fifth of the screen holds the room buttons and the dialogue box: it may run past the lip)
    const maxZ = Math.max(b.minZ, Math.min(b.maxZ, frontZ - d * Math.cos(t) + camH / Math.tan(t + Math.atan(0.78 * ta))));
    const slide = Math.max(0, (W - width) / 2 + 0.1);
    return { slide, minZ: b.minZ, maxZ };
  }
  let camV = ROOM_VIEW; // the view roomCam last set (the day's adjustments included)
  function roomCam(R = cur?.R || game.room, over = {}) {
    if (!R) return;
    const V = { ...ROOM_VIEW, ...over };
    const width = (game.rig.camera?.aspect || 0.45) < 1 ? V.width : V.widthLandscape;
    const L = camLimits(R, V, width);
    camV = V;
    game.rig.setFollow({ ...V, bounds: { minX: -L.slide, maxX: L.slide, minZ: L.minZ, maxZ: L.maxZ } });
    // (on the way in, the entry framing keeps everyone in the first frame: rooms/entry-frame.js)
    if (cur && R === cur.R) entryFrame.reframe(V);
  }
  const entryFrame = createEntryFrame(game);
  const onResize = () => { if (cur && !game.busy && !game.rig.cinematic) roomCam(cur.R); };
  window.addEventListener('resize', onResize);
  // main.js sets its whole-room view in enterRoomScene (every way into a room, the car's too): in story
  // mode the close view replaces it at once
  const enterRoomScene0 = game.enterRoomScene.bind(game);
  game.enterRoomScene = (room) => { enterRoomScene0(room); try { roomCam(room); } catch (err) { console.warn('room camera', err); } };
  // arriving by car at a Home Book place goes in through the story's door too (main.js's enterPlace opens
  // on a whole-room establishing shot); anything else keeps main.js's way
  const enterPlace0 = game.enterPlace.bind(game);
  game.enterPlace = (id, o = {}) => (!cur && game.mode === 'world' && !game.busy && HOME_ROOMS.includes(id) && DOORS[id] ? enter(id) : enterPlace0(id, o));

  // ---- story.foot points at the room's walker while inside (talks, acts and scripts work unchanged)
  function swapFoot(R) {
    const swap = { walker: foot.walker, obstacles: foot.obstacles, walkTo: foot.walkTo, active: foot.active, pos: Object.getOwnPropertyDescriptor(foot, 'pos') };
    foot.walker = game.walker;
    foot.obstacles = R.obstacles;
    // (arriving, she stops dead: a leftover step would turn her away from whoever she came to talk to)
    foot.walkTo = (x, z, cb) => game.walker?.goTo(x, z, (ok) => { if (ok !== false) game.walker?.teleport(game.walker.pos.x, game.walker.pos.y); cb?.(ok); });
    Object.defineProperty(foot, 'pos', { get: () => game.walker.pos, configurable: true, enumerable: true });
    foot.active = true;
    return swap;
  }
  function restoreFoot(swap) {
    foot.walker = swap.walker;
    foot.obstacles = swap.obstacles;
    foot.walkTo = swap.walkTo;
    Object.defineProperty(foot, 'pos', swap.pos);
  }

  // ---- people: the street's stay outside (paused), the room's live inside
  const spawn0 = story.spawn, remove0 = story.remove;
  function spotOf(at) {
    if (typeof at === 'string') {
      const s = cur?.built?.spots?.[at] || cur?.R?.storyLayer?.spots?.[at];
      if (!s) { console.warn('no room spot', at); return null; }
      at = s;
    }
    return at ? { ...at, heading: at.heading ?? at.h ?? 0 } : null;
  }
  story.spawn = (id, at) => {
    if (!cur) return spawn0(id, at);
    const a = spotOf(at);
    if (!a) return undefined;
    const e = spawn0(id, a);
    if (e && !e.indoor) { e.indoor = cur.id; cur.R.scene.add(e.p.root); }
    return e;
  };
  story.remove = (id) => {
    const e = people.get(id);
    if (e?.indoor) e.p.root.removeFromParent();
    return remove0(id);
  };

  // ---- taps: a door outdoors; people and story stations inside
  const ray = new THREE.Raycaster();
  const v = new THREE.Vector3();
  function px(x, y, z) { return game.rig.project(v.set(x, y, z), game.viewW, game.viewH); }
  function personAt(x, y) {
    let best = null, bd = 48;
    for (const e of people.values()) for (const h of [0.4, e.p.height * 0.75]) {
      const q = px(e.p.root.position.x, h, e.p.root.position.z);
      if (q) { const d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = e; } }
    }
    return best;
  }
  function doorAt(x, y) {
    const mp = foot.pos;
    let best = null, bd = 56;
    for (const d of Object.values(DOORS)) {
      if (d.off || Math.hypot(d.x - mp.x, d.z - mp.y) > 26) continue;
      for (const h of [0.25, 1.0, 1.7]) {
        const q = px(d.x, h, d.z);
        if (q) { const dd = Math.hypot(q.x - x, q.y - y); if (dd < bd) { bd = dd; best = d; } }
      }
    }
    return best;
  }
  const stations = () => cur ? (cur.built?.stations || cur.R.storyLayer?.stations || []) : [];
  function stationAt(x, y) {
    let best = null, bd = 60;
    for (const s of stations()) {
      const lx = s.look?.x ?? s.x, lz = s.look?.z ?? s.z;
      for (const [ax, ay, az] of [[lx, s.labelY ? Math.min(s.labelY, 1.4) : 1.0, lz], [lx, 0.6, lz], [s.x, 0.1, s.z]]) {
        const q = px(ax, ay, az);
        if (q) { const d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = s; } }
      }
    }
    return best;
  }
  function goStation(s) {
    const room = cur;
    game.faceTarget = null;
    game.walker.goTo(s.x, s.z, async (ok) => {
      if (cur !== room || ok === false) return;
      if (s.look) game.faceTarget = { x: s.look.x, z: s.look.z };
      await wait(350);
      game.faceTarget = null;
      const ctx = { id: s.id, room: room.id, station: s, story, built: room.built };
      const fn = stationFns.get(s.id);
      if (fn) return fn(ctx);
      if (call(story.day, 'station', s.id, ctx)) return;
      if (s.line && !story.talking) {
        story.talking = true;
        try {
          if (s.emote) call(game.maya, 'emote', s.emote);
          await story.dialog.say('maya', s.line, { face: s.face || 'smile' });
        } finally { story.talking = false; }
      }
    });
  }
  const onTap0 = story.onTap;
  story.onTap = (x, y) => {
    if (cur) {
      if (story.talking) return true;
      for (const h of story.tapHooks || []) if (h(x, y)) return true; // api.js pickSpot, a day's own taps
      const e = personAt(x, y);
      if (e) { story.approach(e); return true; }
      const s = stationAt(x, y);
      if (s) { goStation(s); return true; }
      return false; // main.js: walk to the floor point, or out through the doorway
    }
    if (foot.active && !story.talking && !game.busy && game.mode === 'world' && !personAt(x, y)) {
      const d = doorAt(x, y);
      // the "ask Maya" board stands by a door: a tap on the board itself is the board's (the day's tap hooks)
      const B = story.board;
      const bq = d && B?.root?.visible && B.target && Math.hypot(B.x - foot.pos.x, B.z - foot.pos.y) < 26 ? px(B.target.x, 1.15, B.target.z) : null;
      const onBoard = bq && Math.hypot(bq.x - x, bq.y - y) < 64;
      if (d && !onBoard) {
        const f = front(d, 0.55);
        foot.walkTo(f.x, f.z, (ok) => { if (ok !== false && Math.hypot(foot.pos.x - d.x, foot.pos.y - d.z) < d.r + 0.9) enter(d.room, { via: d }); });
        return true;
      }
    }
    return onTap0(x, y);
  };
  // the Home Book's doors (tapped, or walked into) open on foot too, and come back out on foot
  story.enterOnFoot = (id) => enter(id);

  const front = (d, k) => ({ x: d.x + Math.sin(d.facing) * k, z: d.z + Math.cos(d.facing) * k, heading: d.facing });

  // ---- the room's own people: cast ids become townspeople (tap to talk), walk-on looks stay ambient
  function defaultCast(R) {
    // a cast entry's `when` is a save flag (e.g. 'd8.wellSeen'): that person is only there once it is set
    if (Array.isArray(R.story?.cast)) return R.story.cast.filter((c) => !c.when || !!save.flags?.[c.when]);
    if (typeof R.spec?.people === 'function') return R.spec.people(save.day).map(([spot, id]) => ({ id, spot }));
    return [];
  }
  function walkOnLook(who) {
    const m = cur?.R?.mod;
    return m?.WALKONS?.[who] || m?.LOOKS?.[who] || m?.WALKON_LOOKS?.[who] || null;
  }
  function placeOne(who, spot) {
    const at = spotOf(spot);
    if (!at) return null;
    if (castById(who)) {
      const e = story.spawn(who, at);
      if (e && at.y && at.y < 0.35) e.p.root.position.y = at.y; // standing on a platform
      return e;
    }
    const look = walkOnLook(who);
    if (!look) return null;
    const p = createPerson(look);
    p.root.position.set(at.x, at.y && at.y < 0.35 ? at.y : 0, at.z);
    p.root.rotation.y = at.heading;
    p.root.userData.isPerson = true;
    cur.R.scene.add(p.root);
    cur.extras.push({ p, r: p.radius || 0.3, who, name: cur.R.mod?.WALKON_NAMES?.[who] || null });
    return p;
  }

  // ---- going in (an error never leaves the game stuck: busy and the letterbox are released)
  const guarded = (fn) => async (...a) => {
    try { return await fn(...a); } catch (err) {
      console.error('doors', err);
      game.busy = false;
      game.ui.cinema(false);
      document.getElementById('fader')?.setAttribute('class', '');
      return false;
    }
  };
  const enter = guarded(enterNow);
  async function enterNow(id, o = {}) {
    if (cur || game.busy || game.mode !== 'world') return false;
    const door = o.via || DOORS[o.door || id] || null;
    game.busy = true;
    const wasFoot = foot.active;
    const startPos = game.maya.root.getWorldPosition(new THREE.Vector3());
    game.ui.hideCard?.(); game.ui.hideTip?.(); game.ui.hideBark?.();
    game.ui.cinema(true);
    game.input.reset?.();
    if (wasFoot) foot.walker.stop();
    else { game.world.drive.stop(); game.world.setRoute?.(null); game.autoEnter = null; call(game.audio, 'engine', 0); }
    if (wasFoot && door) { // turn to the door
      foot.walker.heading = door.facing + Math.PI;
      game.maya.root.rotation.set(0, foot.walker.heading, 0);
    }
    let R = null;
    const roomP = loadRoom(id, o).catch((err) => { console.error('room', id, err); return null; });
    call(game.audio, 'play', 'door');
    await game.ui.irisClose();
    R = await roomP;
    if (!R) { // no such room (yet): stay outside
      await game.ui.irisOpen();
      game.ui.cinema(false);
      game.busy = false;
      return false;
    }
    // the street's people wait outside, untouched
    const stash = new Map(people);
    people.clear();
    const exitTo = door ? front(door, 0.9) : { x: startPos.x, z: startPos.z, heading: game.mayaHeading() };
    cur = { id, R, built: R.story || null, exitTo, doorId: door?.room || null, stash, wasFoot, pushed: false, extras: [] };
    if (!wasFoot) game.maya.root.removeFromParent();
    game.enterRoomScene(R); // walker, the close room camera (roomCam), room UI, the hour's light (+ lightRoom)
    cur.swap = swapFoot(R);
    // the cut-away: nothing of the room stands between the camera and her (or the two talking)
    const sceneR = R.scene;
    cur.rcutPrev = sceneR.onBeforeRender;
    sceneR.onBeforeRender = (renderer, scene, cam) => { if (cur?.R?.scene === scene) rcutUpdate(cam); else RCUT.on.value = 0; };
    document.getElementById('game').classList.add('story-room');
    // where she is saved: just outside this door, on foot
    save.place = { mode: 'foot', x: +exitTo.x.toFixed(2), z: +exitTo.z.toFixed(2), heading: +exitTo.heading.toFixed(3) };
    story.persist();
    // the room's people
    if (o.cast !== false) {
      const list = call(dayFor(id), 'roomCast', id, cur.built || R) ?? defaultCast(R);
      for (const c of list) { try { placeOne(c.id, c.spot ?? c.at); } catch (err) { console.error('room cast', c, err); } }
    }
    rcutScene(R.scene, [game.maya.root]);
    // she appears in the doorway (or on a spot) and walks in, the close follow camera on her from the
    // start (no whole-room overview shot)
    const at = o.at ? spotOf(o.at) : null;
    if (at) game.walker.teleport(at.x, at.z, at.heading);
    else game.walker.teleport(R.door.x, R.door.z, Math.PI);
    game.maya.root.position.set(game.walker.pos.x, 0, game.walker.pos.y);
    game.maya.root.rotation.set(0, game.walker.heading, 0);
    game.rig.release();
    game.rig.setTarget(game.maya.root.position);
    try { entryFrame.start(R, at || R.spawn, camV, (w) => camLimits(R, camV, w)); } catch (err) { console.warn('entry frame', err); }
    game.rig.snap();
    await game.ui.irisOpen();
    if (!at) game.walker.goTo(R.spawn.x, R.spawn.z);
    await wait(o.fast ? 300 : 700);
    game.ui.cinema(false);
    game.busy = false;
    // the phone's back button leaves the room (main.js popstate -> exitRoom -> here)
    try { history.pushState({ mw: 'room', id }, ''); cur.pushed = true; } catch { /* sandboxed */ }
    story.refreshHud?.();
    Promise.resolve().then(() => call(dayFor(id), 'enterRoom', id, cur?.built || R)).catch((e) => console.error('day.enterRoom', e));
    document.dispatchEvent(new CustomEvent('rc:room', { detail: { id, inside: true } }));
    return true;
  }

  // ---- the cut-away's speakers, every frame inside (the camera the room is drawn with)
  const _rcQ = new THREE.Vector3();
  function rcutUpdate(cam) {
    const m = game.maya?.root;
    if (!cur || !m || !cam?.isPerspectiveCamera) { RCUT.on.value = 0; return; }
    const mp = m.position;
    const d0 = rcutBox(cam, mp, 1.45, RCUT.rect.value[0]);
    RCUT.prot.value.x = mp.x; RCUT.prot.value.y = mp.z;
    const o = story.talkWith?.p;
    let d1 = 0, on1 = 0;
    if (o?.root?.parent) {
      o.root.getWorldPosition(_rcQ);
      d1 = rcutBox(cam, _rcQ, (o.height || 1.2) + 0.12, RCUT.rect.value[1]);
      RCUT.prot.value.z = _rcQ.x; RCUT.prot.value.w = _rcQ.z;
      on1 = 1;
    }
    RCUT.dep.value.set(d0 - 0.4, d1 - 0.4, 1, on1); // (a body is ~0.3 m deep: nothing of theirs is that much nearer)
    // the two-shot: the gap between the two of them too (a doorway post standing right between them on
    // screen, nearer than both, went half-dithered at the edges of their two boxes)
    if (on1) {
      const a = RCUT.rect.value[0], b = RCUT.rect.value[1];
      RCUT.rect.value[2].set(Math.min(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z), Math.min(a.w, b.w));
      RCUT.dep2.value.set(Math.min(d0, d1) - 0.4, 1);
    } else RCUT.dep2.value.set(0, 0);
    RCUT.on.value = 1;
  }

  // ---- coming out
  const exit = guarded(exitNow);
  async function exitNow(o = {}) {
    if (!cur || game.busy) return false;
    const c = cur, R = c.R;
    game.busy = true;
    entryFrame.stop();
    if (game.ui.sheetOpen) game.closeSheet(false);
    game.ui.hideDialog?.();
    game.ui.hideBark?.();
    game.ui.cinema(true);
    game.faceTarget = null;
    if (!o.instant && Math.hypot(game.walker.pos.x - R.door.x, game.walker.pos.y - R.door.z) > R.door.r) {
      await new Promise((res) => { let done = false; const fin = () => { if (!done) { done = true; res(); } }; game.walker.goTo(R.door.x, R.door.z, fin); setTimeout(fin, 6000); });
    }
    call(game.audio, 'play', 'door');
    await game.ui.irisClose();
    try { await call(dayFor(c.id), 'leaveRoom', c.id, c.built || R); } catch (e) { console.error('day.leaveRoom', e); }
    // the room's people go, the street's come back
    for (const [pid, e] of [...people]) if (e.indoor) story.remove(pid);
    for (const x of c.extras) { x.p.root.removeFromParent(); x.p.dispose(); }
    for (const [pid, e] of c.stash) if (!people.has(pid)) people.set(pid, e);
    restoreFoot(c.swap);
    RCUT.on.value = 0;
    R.scene.onBeforeRender = c.rcutPrev || (() => {});
    game.leaveRoomScene();
    document.getElementById('game').classList.remove('story-room');
    cur = null;
    // outside the same door, facing the street
    const tgt = typeof o.to === 'string' ? (DOORS[o.to] ? front(DOORS[o.to], 0.9) : null) : o.to ? { heading: 0, ...o.to } : null;
    const to = { ...(tgt || c.exitTo) };
    const onFoot = o.onFoot !== false;
    // the car parked across the doorway: she steps out beside it, not into it
    if (onFoot) {
      const cp = game.car.root.position;
      for (let k = 0; k < 4 && Math.hypot(cp.x - to.x, cp.z - to.z) < 1.6; k++) {
        const side = (to.x - cp.x) * Math.cos(to.heading) - (to.z - cp.z) * Math.sin(to.heading) >= 0 ? 1 : -1;
        to.x += Math.cos(to.heading) * side * 0.6; to.z -= Math.sin(to.heading) * side * 0.6;
      }
    }
    game.world.scene.add(game.maya.root);
    game.maya.setMode('walk');
    game.maya.root.position.set(to.x, 0, to.z);
    game.maya.root.rotation.set(0, to.heading, 0);
    foot.walker.teleport(to.x, to.z, to.heading);
    foot.active = onFoot;
    game.rig.setFollow(onFoot ? FOOT_VIEW : CAR_VIEW);
    game.ui.setWhere(tr({ my: 'စာရွက်မြို့', en: 'Paper Town' }));
    game.rig.setTarget(game.maya.root.position);
    game.rig.snap();
    coolId = tgt ? (typeof o.to === 'string' ? o.to : null) : c.doorId;
    if (onFoot) {
      save.place = { mode: 'foot', x: +to.x.toFixed(2), z: +to.z.toFixed(2), heading: +to.heading.toFixed(3) };
      story.persist();
    }
    await game.ui.irisOpen();
    if (onFoot) {
      game.ui.cinema(false);
      game.busy = false;
      foot.walkTo(to.x + Math.sin(to.heading) * 0.6, to.z + Math.cos(to.heading) * 0.6); // a step out into the street
    } else {
      await game.hopIn();
      game.ui.cinema(false);
      game.busy = false;
    }
    if (c.pushed && o.push !== false) { game.ignorePop = (game.ignorePop || 0) + 1; history.back(); }
    story.refreshHud?.();
    document.dispatchEvent(new CustomEvent('rc:room', { detail: { id: c.id, inside: false } }));
    return true;
  }

  // the room's "Go outside", the doorway, the phone's back: out on foot (the site's rooms entered by car keep the car)
  const exitRoom0 = game.exitRoom.bind(game);
  game.exitRoom = (...a) => (cur ? exit(a[0] || {}) : exitRoom0(...a));
  const openAll0 = game.openAll.bind(game), dock0 = game.dock.bind(game);
  game.openAll = () => (cur && (cur.R.story || cur.R.siteStations) ? undefined : openAll0());
  game.dock = (id) => (cur ? undefined : dock0(id));

  // ---- every frame (story.update): walking into a door, people inside, Maya's barks
  const prev = new THREE.Vector2();
  let prefetchT = 0, rcutT = 0;
  function update(dt) {
    // the site's barks are about gold circles and price sheets: quiet inside story rooms
    if (game.barks && !game.barks.doorsWrapped) {
      const b = game.barks, up = b.update.bind(b);
      b.update = (d) => (cur ? undefined : up(d));
      b.doorsWrapped = true;
      // ...and outdoors the story never points the way: drop the site lines that name a place to go
      // ("Shall we visit {place}?", "Turn back?") or a button to press (story mode only: site mode never loads this file)
      for (const [k, lines] of Object.entries(BARKS)) {
        if (!Array.isArray(lines)) continue;
        for (let i = lines.length - 1; i >= 0; i--) {
          const en = lines[i]?.en || '';
          if (en.includes('{place}') || /gold circle|button|Turn back|Let's turn back|let's go somewhere|which place/i.test(en)) lines.splice(i, 1);
        }
        if (!lines.length) delete BARKS[k];
      }
    }
    if (cur) {
      // she has walked off her first spot: the plain close follow again (the day's own view kept)
      if (entryFrame.tick()) roomCam(cur.R, camV);
      // (props a day or a layer adds later get the cut-away too)
      if ((rcutT -= dt) <= 0) { rcutT = 1; rcutScene(cur.R.scene, [game.maya.root]); }
      // walk-ons: breathe, glance at Maya when she comes close, and are soft to bump into
      // (story.update does the same for townspeople: story.foot.walker is the room's walker now)
      const w = game.walker;
      if (!w) return;
      // out through the doorway: anywhere across the open front near the door, walking toward the street
      const R = cur.R, dd = R.door;
      if (!game.busy && !story.talking && !game.ui.dialogOpen && !game.ui.sheetOpen && w.pos.y > dd.z - 0.3 && Math.abs(w.pos.x - dd.x) < dd.r + 0.45) {
        const st = game.input.stick();
        if (st.y < -0.3 && Math.abs(st.x) < Math.abs(st.y) * 1.2) { exit(); return; }
      }
      for (const x of cur.extras) {
        const q = x.p.root.position;
        const dx = w.pos.x - q.x, dz = w.pos.y - q.z, d = Math.hypot(dx, dz), min = x.r + 0.28;
        x.p.lookAt(d < 3 ? v.set(w.pos.x, 1.0, w.pos.y) : null);
        x.p.update(dt, { speed: 0 });
        if (d < min && d > 1e-4) { const k = (min - d) * Math.min(1, dt * 12); w.pos.x += (dx / d) * k; w.pos.y += (dz / d) * k; }
      }
      return;
    }
    if (game.mode !== 'world' || !foot.active) return;
    const p = foot.pos;
    // fetch a near door's rooms file ahead (the iris then opens on the room without a wait)
    if ((prefetchT -= dt) <= 0) {
      prefetchT = 1;
      // (lazy towns: while the towns are still coming in, only a door she is right at fetches ahead)
      const near = REGION.LAZY && window.__townLoader?.busy?.() ? 9 : 24;
      for (const d of Object.values(DOORS)) if (!d.site && HINT[d.room] && Math.abs(p.x - d.x) < near && Math.abs(p.y - d.z) < near) loadFile(HINT[d.room]);
    }
    const moved = Math.hypot(p.x - prev.x, p.y - prev.y);
    prev.set(p.x, p.y);
    if (game.busy || story.talking || game.ui.dialogOpen || game.ui.sheetOpen || game.worldWalk) return;
    const hx = Math.sin(foot.walker.heading), hz = Math.cos(foot.walker.heading);
    const stick = game.input.stick();
    const pushing = stick.lengthSq() > 0.04 || foot.walker.moving;
    for (const d of Object.values(DOORS)) {
      if (d.off) continue;
      const dx = p.x - d.x, dz = p.y - d.z;
      if (dx * dx + dz * dz > 9) continue;
      const dist = Math.hypot(dx, dz);
      if (d.room === coolId) { if (dist > d.r + 1.0) coolId = null; continue; }
      if (dist > d.r) continue;
      // heading in through the door (against its facing), and actually walking
      const inward = -(hx * Math.sin(d.facing) + hz * Math.cos(d.facing));
      if (inward > 0.6 && pushing && (moved > 1e-4 || stick.lengthSq() > 0.04)) { enter(d.room, { via: d }); return; }
    }
  }
  const update0 = story.update;
  story.update = (dt, t) => { update0(dt, t); update(dt, t); };

  // ---- story-room UI: no "See all" (site sheets), no car/walk button indoors
  if (!document.getElementById('doors-style')) {
    const st = document.createElement('style');
    st.id = 'doors-style';
    st.textContent = '#game.story-room #btn-all, #game.story-room #story-mode, #game.story-room #story-map-btn { display: none !important; }';
    document.head.appendChild(st);
  }

  const doors = {
    DOORS,
    registerDoors,
    enter,
    exit,
    get current() { return cur ? { id: cur.id, room: cur.built || cur.R, door: cur.doorId } : null; },
    /** the entry framing (rooms/entry-frame.js): { active, last } */
    entryFrame,
    onStation(id, fn) { if (fn) stationFns.set(id, fn); else stationFns.delete(id); },
    addOverlay(fn) { overlays.push(fn); },
    setRain(on) { rain = !!on; lightRoom(); },
    get rain() { return rain; },
    registerRooms(rooms, mod = null) { for (const [id, spec] of Object.entries(rooms || {})) extraRooms.set(id, { spec, mod }); },
    unregisterDoors,
    /** The shared close, low room camera for the room she is in (a day calls it after its own camera moves;
     *  over: { tilt, width, widthLandscape, height } to adjust it a little). */
    roomCam(over) { if (cur) roomCam(cur.R, over || {}); },
    /** Shut (on = false) or open a door: a shut door cannot be walked or tapped into. */
    setDoor(id, on) { if (DOORS[id]) DOORS[id].off = !on; },
    /** A walk-on doors.js drew in the current room ({ p, who, name }) or null. */
    walkOn(who) { return cur?.extras.find((x) => x.who === who) || null; },
    get walkOns() { return cur ? cur.extras.slice() : []; },
    findSpec,
  };
  story.enter = enter;
  story.exit = exit;
  Object.defineProperty(story, 'inRoom', { get: () => cur?.id || null, configurable: true });
  Object.defineProperty(story, 'room', { get: () => (cur ? cur.built || cur.R : null), configurable: true });
  return doors;
}
