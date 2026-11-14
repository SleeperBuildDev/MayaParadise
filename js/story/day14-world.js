// Day 14's local set dressing out on the land (day14-spec 1, 12). The districts Day 14 visits are not all
// built yet (regions/market.js, junction.js, hearth.js, garden.js, blank.js hold roads and desks, no
// buildings or DOORS). Until they are, this file stands in, one zone at a time and only when Maya comes near:
//   - the shells of the buildings whose rooms Day 14 walks into (tea shop, printing shed, bakery, lodge),
//     each with a REAL door registered with doors.js (no marker, no glow: a door is just a door);
//   - the small outdoor props the day's scenes need (the "ask Maya" board, the windmill table, the bean box,
//     Ma Thiri's kite post, U Hpo Htaw's open gate and U Kyi Nyein's bales, Ko Thiha's parcels).
// A shell is only built when the district has no door of its own for that room (doors.DOORS[room] unset):
// once a district file declares the building, the region's wins and nothing here is drawn.
// Keep-out boxes go into the open world's walk space; dispose() moves them far away (the space has no
// remove) and unregisters the doors this file added.
//
//   const W = createDay14World(story, { flags })   W.update(dt, t)   W.get(name) -> handle   W.dispose()
//   W.ZONES                                         { id: { x, z, r } } the district centres (people use them)
//   W.SPOTS                                         named world points (people, taps, the back-cover door)
import * as THREE from '../game/three.js';
import { windmill, fairTable } from './props.js';
import { beanPlanter, flowerBed } from './props2.js';
import { teaShop, streetPump, kite, bambooPost } from './props3.js';
import { printShed, parcelPile } from './props4.js';
import { bakeryFront, lockedGate, paperBale } from './props5.js';
import { ASK_BOARD, SORT_DOOR } from './world/regions/home.js';
import { lodge } from './props6.js';
import { createPerson } from './people.js';
import { L } from './day14-lines.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const obj = (h) => (h?.isObject3D ? h : h?.root || null);

/** District centres (metres; +X east, +Z south). r: people live within r; props are built from r + 40. */
export const ZONES = {
  home: { x: 2, z: 2, r: 34 },
  quarter: { x: -12, z: 93, r: 40 },
  market: { x: 24, z: 306, r: 40 },
  wharf: { x: 72, z: 442, r: 36 },
  junction: { x: 154, z: 298, r: 36 },
  hearth: { x: 142, z: 199, r: 34 },
  garden: { x: 233, z: 98, r: 34 },
  blank: { x: 131, z: -30, r: 44 },
};

/** Named world points the day script uses (people's places, the outdoor taps, the doors). */
export const SPOTS = {
  // home (the Home Book)
  wwStart: { x: 2.6, z: 8.2, h: -Math.PI / 2 },
  wwSorting: { x: SORT_DOOR.x - 0.85, z: SORT_DOOR.z + 0.6, h: -1.2 }, // by the Post Office's side door (the sorting room is not entered today)
  board: { x: ASK_BOARD.x, z: ASK_BOARD.z }, // the shared "ask Maya" board (home.js ASK_BOARD; its look: story.board)
  boardStand: { ...ASK_BOARD.stand },
  windy: { x: 22.6, z: 8.2 },
  phothar: { x: 22.4, z: 9.65, h: 0.15 },
  ukyaw: { x: 24.7, z: 10.2, h: -0.6 },
  aboutDoor: { x: 0, z: 7.0 },
  // Quarter
  quarterBoard: { x: -12.5, z: 92.6 },
  sunwe: { x: -13.9, z: 93.6, h: 0.5 },
  maungnge: { x: -11.1, z: 93.7, h: -0.5 },
  toetoeOut: { x: -10.2, z: 93.9, h: -0.4 },
  yeyint: { x: -9.6, z: 141.6, h: 0 },
  bean: { x: -17.2, z: 93.3 },
  flowerBed: { x: -14.7, z: 93.4 },
  // Market
  teashop: { x: 27.5, z: 313.0 }, // the shell's centre (front faces +Z, south, onto the little square)
  thiri: { x: 24.1, z: 297.6, h: 0.4 },
  thiriPost: { x: 23.2, z: 296.9 },
  pump: { x: 27.5, z: 318.6 },
  // Wharf
  kothiha: { x: 75.4, z: 441.4, h: Math.PI / 2 },
  parcels: { x: 74.0, z: 439.4 },
  // Junction
  press: { x: 160, z: 294.2 },
  carKerb: { x: 148, z: 296, h: Math.PI }, // the car waits on the road by the square, nose north (the drive)
  // Hearth Row
  bakery: { x: 141.5, z: 194.0 },
  arkar: { x: 145.6, z: 198.3, h: -0.3 },
  // Diary Garden
  gate: { x: 236.0, z: 96.8 },
  hpohtaw: { x: 236.0, z: 95.6, h: 0 },
  kyinyein: { x: 229.7, z: 97.4, h: -1.3 },
  bales: [{ x: 228.4, z: 96.7, ry: 0.2 }, { x: 227.3, z: 96.5, ry: -0.3 }],
  // the Blank Page
  lodge: { x: 130, z: -9.2 },
  backDoor: { x: 126, z: -59.95 }, // the threshold of the door in the back board (blank.js BOARD.x, front face z -60.2)
  backFront: { x: 126, z: -58.9 },
};

export function createDay14World(story, { flags = {} } = {}) {
  const { game } = story;
  const scene = game.world.scene;
  const space = story.openWorld?.space || null;
  const doors = story.doors;
  const built = new Set();
  const handles = {}; // name -> prop handle
  const objs = []; // every root we added
  const obs = []; // keep-out shapes we added
  const myDoors = []; // room ids we registered
  const walkons = []; // { p } ambient walk-on people (no cast id)
  const animated = []; // handles with update(dt, t)

  const add = (name, h, x, z, ry = 0) => {
    const o = obj(h);
    if (!o) return h;
    o.position.set(x, o.position.y || 0, z);
    o.rotation.y = ry;
    scene.add(o);
    objs.push(o);
    handles[name] = h;
    if (typeof h?.update === 'function') animated.push(h);
    return h;
  };
  const box = (minX, maxX, minZ, maxZ) => {
    const o = { type: 'box', minX, maxX, minZ, maxZ };
    obs.push(o);
    if (space) space.add([o]); else story.foot?.obstacles?.push(o);
  };
  const hasDoor = (room) => !!doors?.DOORS?.[room];
  const door = (room, x, z, r = 0.8, region = null) => {
    if (!doors || hasDoor(room)) return;
    doors.registerDoors([{ room, x, z, facing: 0, r, region }]);
    myDoors.push(room);
  };
  const walkon = (look, x, z, h) => {
    const p = createPerson(look);
    p.root.position.set(x, 0, z);
    p.root.rotation.y = h;
    p.root.userData.isPerson = true;
    scene.add(p.root);
    walkons.push({ p });
    return p;
  };

  // ---- each zone's dressing, built once when Maya first comes near
  const BUILD = {
    home() {
      // the shared board (story.board): ONE note left, Toe Toe's; setText([heading]) = he took it down
      const TT_NOTE = [{ my: 'မာရာ…', en: 'Maya…' }, { my: 'အစ်မ ရွေးပေးပါ။', en: 'You choose.' }, { my: '— တိုးတိုး', en: '— Toe Toe' }]; // DRAFT(my), from his note
      const b = { setText(lines) { story.board.set({ notes: 0, replies: 0, gap: false, notice: null, one: lines?.length > 1 && lines[1] ? TT_NOTE : null }); } };
      handles.board = b;
      b.setText([L.boardBoardHeading, flags.boardEmpty?.() ? '' : '— တိုးတိုး']);
      // Pho Thar's windmill table on the wind edge (Day 1's WINDY spot); two children folding beside him
      const t = fairTable('#2F7C7A');
      add('ptTable', t, SPOTS.windy.x - 0.4, SPOTS.windy.z + 0.55);
      box(SPOTS.windy.x - 1.05, SPOTS.windy.x + 0.25, SPOTS.windy.z + 0.15, SPOTS.windy.z + 0.95);
      const cols = ['#6E1F2A', '#2F7C7A', '#D9A93B', '#7FB0CF', '#D97C8A', '#6E1F2A'];
      handles.mills = [];
      for (let i = 0; i < 6; i++) {
        const w = windmill(cols[i], 0.55 + (i % 3) * 0.12);
        const o = w.root;
        o.position.set(SPOTS.windy.x - 1.5 + i * 0.52, 0, SPOTS.windy.z - 0.9 + Math.sin(i * 2.1) * 0.3);
        scene.add(o); objs.push(o);
        handles.mills.push(w);
      }
      // two folding children (walk-ons, looks only)
      walkon({ age: 'child', skin: 2, hair: 'bob', top: 'tee', topColor: 'rose', bottom: 'shorts', bottomColor: 'navy' }, SPOTS.windy.x - 1.55, SPOTS.windy.z + 1.05, 0.7);
      walkon({ age: 'child', skin: 3, hair: 'short', top: 'tee', topColor: 'mustard', bottom: 'shorts', bottomColor: 'brown' }, SPOTS.windy.x + 0.85, SPOTS.windy.z + 1.25, -0.8);
    },
    quarter() {
      // Toe Toe's bean box, now in full sun by the class flower bed (he replanted it on Day 2)
      add('bean', beanPlanter('growing'), SPOTS.bean.x, SPOTS.bean.z);
      add('flowerBed', flowerBed({ w: 1.7, d: 0.8, seed: 14 }), SPOTS.flowerBed.x, SPOTS.flowerBed.z);
      box(SPOTS.bean.x - 0.55, SPOTS.bean.x + 0.55, SPOTS.bean.z - 0.3, SPOTS.bean.z + 0.3);
      box(SPOTS.flowerBed.x - 0.85, SPOTS.flowerBed.x + 0.85, SPOTS.flowerBed.z - 0.4, SPOTS.flowerBed.z + 0.4);
    },
    market() {
      // Ma Thiri's kite tied to her own post
      const post = add('thiriPost', bambooPost({ h: 1.6 }), SPOTS.thiriPost.x, SPOTS.thiriPost.z);
      const k = kite({ height: 0.6 });
      add('kite', k, SPOTS.thiriPost.x, SPOTS.thiriPost.z);
      obj(k).position.y = 1.55;
      call(k, 'setHeight', 0.45);
      void post;
      box(SPOTS.thiriPost.x - 0.12, SPOTS.thiriPost.x + 0.12, SPOTS.thiriPost.z - 0.12, SPOTS.thiriPost.z + 0.12);
      // Daw Tin Tin's tea shop on the north side of the little square, the pump straight in front
      if (!hasDoor('teashop')) {
        const s = add('teashop', teaShop({ awning: 'plain' }), SPOTS.teashop.x, SPOTS.teashop.z);
        call(s, 'setSteam', 0.8);
        const W2 = 2.6, D2 = 1.9;
        box(SPOTS.teashop.x - W2, SPOTS.teashop.x + W2, SPOTS.teashop.z - D2, SPOTS.teashop.z + D2 - 0.05);
        const dx = s?.door?.x ?? -0.9;
        door('teashop', SPOTS.teashop.x + dx, SPOTS.teashop.z + D2 + 0.12, 0.8, 'market');
        add('pump', streetPump(), SPOTS.pump.x, SPOTS.pump.z);
        box(SPOTS.pump.x - 0.3, SPOTS.pump.x + 0.3, SPOTS.pump.z - 0.3, SPOTS.pump.z + 0.3);
      }
    },
    wharf() {
      add('parcels', parcelPile(), SPOTS.parcels.x, SPOTS.parcels.z, 0.3);
      box(SPOTS.parcels.x - 0.8, SPOTS.parcels.x + 0.8, SPOTS.parcels.z - 0.6, SPOTS.parcels.z + 0.6);
    },
    junction() {
      if (!hasDoor('press')) {
        const s = add('press', printShed({ doors: 1, slate: true }), SPOTS.press.x, SPOTS.press.z);
        call(s, 'setDoors', 1);
        box(SPOTS.press.x - 3.3, SPOTS.press.x + 3.3, SPOTS.press.z - 2.55, SPOTS.press.z + 2.45);
        door('press', SPOTS.press.x, SPOTS.press.z + 2.62, 0.95, 'junction');
      }
    },
    hearth() {
      if (!hasDoor('bakery')) {
        add('bakery', bakeryFront({ open: 0.45 }), SPOTS.bakery.x, SPOTS.bakery.z);
        // the shell, with the doorway left open (the rack and sacks on the kerb sit either side of it)
        box(SPOTS.bakery.x - 4.5, SPOTS.bakery.x + 4.5, SPOTS.bakery.z - 3.0, SPOTS.bakery.z + 2.95);
        door('bakery', SPOTS.bakery.x, SPOTS.bakery.z + 3.12, 0.95, 'hearth');
      }
    },
    garden() {
      const g = add('gate', lockedGate({ locked: false, ajar: 1, loaf: false }), SPOTS.gate.x, SPOTS.gate.z);
      call(g, 'setLocked', false); call(g, 'setAjar', 1); call(g, 'setLoaf', false);
      box(SPOTS.gate.x - 1.2, SPOTS.gate.x - 0.85, SPOTS.gate.z - 0.15, SPOTS.gate.z + 0.15); // the two posts only: the way stands open
      box(SPOTS.gate.x + 0.85, SPOTS.gate.x + 1.2, SPOTS.gate.z - 0.15, SPOTS.gate.z + 0.15);
      SPOTS.bales.forEach((b, i) => {
        add(`bale${i}`, paperBale({ damp: false, seed: 3 + i }), b.x, b.z, b.ry);
        box(b.x - 0.45, b.x + 0.45, b.z - 0.35, b.z + 0.35);
      });
    },
    blank() {
      if (!hasDoor('lodge')) {
        const s = add('lodge', lodge(), SPOTS.lodge.x, SPOTS.lodge.z);
        call(s, 'setLamp', 1);
        box(SPOTS.lodge.x - 4.6, SPOTS.lodge.x + 4.6, SPOTS.lodge.z - 2.1, SPOTS.lodge.z + 0.62);
        door('lodge', SPOTS.lodge.x, SPOTS.lodge.z + 0.95, 0.9, 'blank');
      }
    },
  };

  function ensure(id) {
    if (built.has(id)) return;
    built.add(id);
    try { BUILD[id]?.(); } catch (err) { console.error('day14 zone', id, err); }
  }

  /** Registers the Back Cover's door once the Own Key has opened it (spec 8.1): from then on it is a door. */
  function openBackDoor() {
    if (!doors || hasDoor('backcover')) return;
    doors.registerDoors([{ room: 'backcover', x: SPOTS.backDoor.x, z: SPOTS.backDoor.z, facing: 0, r: 0.85, region: 'blank' }]);
    myDoors.push('backcover');
  }

  let checkT = 0;
  return {
    ZONES, SPOTS,
    ensure,
    built: (id) => built.has(id),
    get: (name) => handles[name] || null,
    openBackDoor,
    /** The zone Maya (or the car) is in, or null. */
    zoneAt(x, z) {
      for (const [id, Z] of Object.entries(ZONES)) if (Math.hypot(x - Z.x, z - Z.z) < Z.r) return id;
      return null;
    },
    update(dt, t, pos) {
      for (const h of animated) { try { h.update(dt, t); } catch { /* a prop's anim */ } }
      for (const m of handles.mills || []) m.spin(dt, 3.2);
      call(handles.kite, 'setSway', t);
      for (const w of walkons) w.p.update(dt, { speed: 0 });
      if ((checkT -= dt) > 0 || !pos) return;
      checkT = 0.5;
      for (const [id, Z] of Object.entries(ZONES)) if (!built.has(id) && Math.hypot(pos.x - Z.x, pos.z - Z.z) < Z.r + 40) ensure(id);
    },
    dispose() {
      for (const o of objs) o.parent?.remove(o);
      for (const w of walkons) { w.p.root.parent?.remove(w.p.root); try { w.p.dispose(); } catch { /* gone */ } }
      for (const h of Object.values(handles)) if (h && !Array.isArray(h)) { try { h.dispose?.(); } catch { /* already gone */ } }
      space?.remove?.(obs); // (and, as a fallback, sent far off the land)
      for (const o of obs) { o.minX = o.maxX = -1e6; o.minZ = o.maxZ = -1e6; }
      if (!space) for (const o of obs) { const k = story.foot?.obstacles?.indexOf(o); if (k >= 0) story.foot.obstacles.splice(k, 1); }
      for (const id of myDoors) if (doors?.DOORS) delete doors.DOORS[id];
      objs.length = 0; walkons.length = 0; animated.length = 0; built.clear();
    },
  };
}

void THREE;
