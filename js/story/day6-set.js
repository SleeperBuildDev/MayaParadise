// Day 6's outdoor set: where today's places stand and the props that show them (day6-spec 1, INDEX 13).
//
// The region files (world/regions/*.js) own the buildings and doors: the Post Office's sorting-room door and
// board (home.js), the Market post office, tea shop and carvers' corner (market.js), the weigh-house, Daw
// Sanda's house, the parcel pile and the sandbar with Cane Jetty, the post and the cane shed (wharf.js), the
// bridge board on the bridgehead square (junction.js). This file only adds what moves or changes today: Nay
// Chi's live bridge board and Maung Nge's live cart (each hides the region's static twin, useLive), the chalk
// slates, the raft, the pole, the ferry and two walk-ons. A door a region lacks still gets a stand-in (skipped
// whenever a DOORS entry for that room exists).
// dispose() takes everything away again (props, keep-out boxes, door entries, walk-ons).
//
// No markers anywhere: these are buildings, a board, a cart, a raft. Nothing glows or points.
import * as THREE from '../game/three.js';
import { VoxelBuilder } from '../game/voxel.js';
import { createPerson } from './people.js';
import { registerDoors, DOORS } from './doors.js';
import { chalkSlate } from './props2.js';
import { parcelCart, letterCounter, teaShop } from './props3.js';
import { raft, bambooPole, ferry, weighHouse, bridgeBoard, slateGust } from './props4.js';
import { SORT_DOOR, ASK_BOARD } from './world/regions/home.js';
import { SPOTS as MS } from './world/regions/market.js';
import { SPOTS as WS, useLive as wharfLive } from './world/regions/wharf.js';
import { PLACES as JP, useLive as junctionLive } from './world/regions/junction.js';

const PI = Math.PI;

/** Day 6's places, world metres (+X east, +Z south). See the file comment for why they live here. */
export const P = {
  // Home Book
  about: { x: 0, z: 7.0 },
  sortDoor: { x: SORT_DOOR.x, z: SORT_DOOR.z }, // the narrow green side door «စာခွဲခန်း» on the Post Office's west wall (home.js)
  board: { x: ASK_BOARD.x, z: ASK_BOARD.z }, // the shared "ask Maya" board at the Post Office's south-west corner (home.js, story.board)
  wwPost: { x: ASK_BOARD.stand.x + 0.2, z: ASK_BOARD.z + 1.15, h: PI / 2 }, // Ma Wint War, by the board after the morning
  // Envelope Market
  mpo: { x: 22.5, z: 291.0 }, // the Market post office (letterCounter shell), Counter Lane north side
  kolwin: { ...MS.kolwinOutside }, // the stamp-carvers' corner, outside the post office's east end (clear of desk `counter`)
  tea: { x: 33.0, z: 314.0 }, // Daw Tin Tin's tea shop, north side of the tea-shop street's square
  teaZone: { x0: 18, x1: 40, z0: 299, z1: 334 }, // the tea-shop street (x 29) and the tea shop's own front (market.js TEA)
  // the bridgehead square (Newsprint Junction's west lip, the end of the Market road)
  bridgeBoard: { x: JP.board.x, z: JP.board.z, ry: JP.board.ry }, // junction.js jBoard (76.0, 294.3), by the bridge mouth
  bridgeStand: { x: 75.3, z: 296.5 }, // where Maya reads it from (in front, a little to its east side)
  ncBoard: { x: 74.4, z: 295.7, h: JP.board.ry + PI - 0.25 }, // Nay Chi under it, facing it (Day 7's boardStand)
  // Ledger Wharf
  wharfZone: { x0: -71, x1: 100, z0: 378, z1: 498 },
  wh: { x: 66.5, z: 413.5 }, // weigh-house (5 x 3.5 shell), loading door south
  cart: { x: 63.0, z: 417.7 }, // Maung Nge's cart, just left of the weigh-house door
  mn: { x: 62.3, z: 419.0, h: 0.4 },
  pile: { ...WS.parcels }, // (wharf.js draws the pile itself)
  lj: { x: 87.2, z: 467.0 }, // the end of Little Jetty (the region's 5th jetty, z 467)
  raft: { x: 86.3, z: 468.95, h: 0 }, // moored on its south side
  house: { x: WS.sandaHouse.x, z: WS.sandaHouse.z }, // Daw Sanda's stilt house at the landward head of Little Jetty (wharf.js)
  houseDoor: { ...WS.sandaDoor }, // the foot of its five steps
  pole: { x: 74.0, z: 464.9 },
  fishWoman: { x: 79.7, z: 450.0, h: -PI / 2 }, // on Fish Jetty (z 450)
  ferry: { x: 92.6, z: 433.4 }, // tied at Big Jetty (z 431)
  jettyEnd: { x: 95.5, z: 476.5 },
  // the sandbar across the side channel, south of Jetty End (reached only by the raft)
  sandbar: { x: 86.0, z: 491.0 },
  post: { ...WS.canePost }, // U Bo Lay's post (wharf.js oldPost, top 0.9 m)
  shed: { ...WS.caneShed },
  raftCane: { x: 83.3, z: 487.1, h: PI / 2 }, // beside wharf.js Cane Jetty (x 84.55..86.05), clear of Duck Jetty (x ..82.1)
  cutter: { x: 86.4, z: 488.9, h: -PI / 2 },
};

const LOOKS = {
  fishwoman: { age: 'adult', build: 'mid', skin: 3, hair: 'bun', top: 'blouse', topColor: 'teal', bottom: 'htamein', bottomColor: 'brown', extras: ['thanaka'] },
  cutter: { age: 'adult', build: 'slim', skin: 4, hair: 'short', top: 'tee', topColor: 'leaf', bottom: 'shorts', bottomColor: 'olive', extras: ['towel'], extraColor: 'tan' },
  stampwoman: { age: 'elder', build: 'mid', skin: 2, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'plum', bottom: 'htamein', bottomColor: 'brown', extras: ['thanaka'] },
  porter: { age: 'adult', build: 'wide', skin: 4, hair: 'short', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'olive', extras: ['towel'], extraColor: 'rose' },
  drinker1: { age: 'adult', skin: 3, hair: 'short', top: 'tee', topColor: 'grey', bottom: 'longyi', bottomColor: 'maroon' },
  drinker2: { age: 'elder', skin: 2, hair: 'side', hairColor: 'grey', top: 'shirt', topColor: 'white', bottom: 'longyi', bottomColor: 'teal' },
  drinker3: { age: 'adult', build: 'slim', skin: 1, hair: 'long', top: 'blouse', topColor: 'rose', bottom: 'htamein', bottomColor: 'navy' },
  drinker4: { age: 'teen', build: 'mid', skin: 3, hair: 'spiky', top: 'tee', topColor: 'mustard', bottom: 'longyi', bottomColor: 'navy' },
};
export { LOOKS };

/** A small walk-on (not in cast.js): looks only, plus a breathing update. */
export function walkOn(look, at, parent) {
  const p = createPerson(look);
  p.root.position.set(at.x, at.y ?? 0, at.z);
  p.root.rotation.y = at.h ?? 0;
  p.root.userData.isPerson = true;
  parent.add(p.root);
  return p;
}

export function buildSet(story, game) {
  const scene = game.world.scene;
  const objs = []; // { root, dispose? }
  const obs = [];
  const doorIds = [];
  const walkons = [];
  const ticks = [];
  const add = (h, x, z, ry = 0, y = 0) => { const root = h.root || h; root.position.set(x, y, z); root.rotation.y = ry; scene.add(root); objs.push(h); return h; };
  // keep-out boxes go into the open world's spatial hash (space.add: walking really bumps them; pushing into
  // foot.obstacles alone only feeds people's path grids) and never into a room's list if the page opens indoors
  const space = story.openWorld?.space;
  const addOb = (o) => { obs.push(o); if (space) space.add([o]); else if (!story.inRoom) story.foot.obstacles.push(o); };
  const box = (x0, z0, x1, z1) => addOb({ type: 'box', minX: Math.min(x0, x1), maxX: Math.max(x0, x1), minZ: Math.min(z0, z1), maxZ: Math.max(z0, z1) });
  const door = (room, x, z, facing = 0, r = 0.8) => {
    if (DOORS[room]) return false; // a region file (or another page) already put this door in the world
    registerDoors([{ room, x, z, facing, r }]);
    doorIds.push(room);
    return true;
  };
  const S = {};

  // ---------------------------------------------------------------- Home Book: sorting-room door + board
  // (the door and the board are the Home Book's own: world/regions/home.js; the board's look is story.board)
  // the "ask Maya" board: 31 notes, crowded, some overlapping; Maya's replies on three (four once pinned today)
  story.board.set({ notes: 31, replies: story.flag('d6.board') ? 4 : 3 });
  S.board = story.board;

  // ---------------------------------------------------------------- Envelope Market
  if (!DOORS.marketpost) {
    const lc = letterCounter({ flags: 16 });
    add(lc, P.mpo.x, P.mpo.z, 0);
    const d = lc.door || { x: 0, z: 2.6 };
    registerDoors([{ room: 'marketpost', x: P.mpo.x + d.x, z: P.mpo.z + d.z, facing: 0, r: 0.85 }]);
    doorIds.push('marketpost');
    box(P.mpo.x - 3.6, P.mpo.z - 2.2, P.mpo.x + 3.6, P.mpo.z + 2.15);
    S.mpo = lc;
  }
  if (!DOORS.teashop) {
    const ts = teaShop({ awning: 'stamp' });
    add(ts, P.tea.x, P.tea.z, 0);
    const d = ts.door || { x: -0.9, z: 2.4 };
    registerDoors([{ room: 'teashop', x: P.tea.x + d.x, z: P.tea.z + d.z, facing: 0, r: 0.85 }]);
    doorIds.push('teashop');
    box(P.tea.x - 2.7, P.tea.z - 2.0, P.tea.x + 2.7, P.tea.z + 1.95);
    if (ts.update) ticks.push((dt, t) => ts.update(dt, t));
    ts.setSteam?.(1);
    S.tea = ts;
    S.teaDoor = { x: P.tea.x + d.x, z: P.tea.z + d.z };
  } else S.teaDoor = { x: DOORS.teashop.x, z: DOORS.teashop.z };
  // slate 1 on the stamp awning over the tea-shop door (shown from the gust until Nay Chi has it)
  {
    const s = chalkSlate({ w: 0.3, h: 0.22, text: '', lean: 0.3 });
    add(s, S.teaDoor.x + 0.35, S.teaDoor.z - 0.25, 0.25, 2.95);
    s.root.visible = false;
    S.awningSlate = s;
  }

  // ---------------------------------------------------------------- the bridge board (Day 7 builds the square)
  {
    // the region's static board (junction.js jBoard) steps aside while this live one hangs there; its keep-out stays
    junctionLive(story.openWorld, ['bridgeBoard'], true);
    S.liveOff = [() => junctionLive(story.openWorld, ['bridgeBoard'], false)];
    const bb = bridgeBoard({ slates: [null, null, null, null, null, null, null, null, null, null] });
    add(bb, P.bridgeBoard.x, P.bridgeBoard.z, P.bridgeBoard.ry);
    S.bridge = bb;
    // (board-local vectors: the board turns -0.9, so these carry five slates south-west over the Market road
    // towards the Wharf, and four away north)
    const g = slateGust({ board: bb, toWharf: [22.6, -2.6, 35.8], north: [-57.7, 0, -56] });
    g.root.position.copy(bb.root.position);
    g.root.rotation.copy(bb.root.rotation);
    scene.add(g.root);
    objs.push(g);
    ticks.push((dt) => g.update(dt));
    S.gust = g;
  }

  // ---------------------------------------------------------------- Ledger Wharf
  if (!DOORS.weighhouse) {
    const wh = weighHouse({ door: 1 });
    add(wh, P.wh.x, P.wh.z, 0);
    registerDoors([{ room: 'weighhouse', x: P.wh.x, z: P.wh.z + 3.0, facing: 0, r: 0.95 }]);
    doorIds.push('weighhouse');
    box(P.wh.x - 2.62, P.wh.z - 1.87, P.wh.x + 2.62, P.wh.z + 1.8);
    S.wh = wh;
  }
  {
    wharfLive(story.openWorld, ['parcelCart'], true); // the region's static hand cart steps aside (keep-out stays)
    S.liveOff.push(() => wharfLive(story.openWorld, ['parcelCart'], false));
    const cart = parcelCart({ shelves: true, tags: [{ picture: 'duck', label: true }, { picture: 'fish', label: true }],
      parcels: [{ picture: 'rice' }, { picture: 'letter' }, { picture: 'book' }, { picture: 'duck', label: true }, { picture: 'duck', label: true }, { picture: 'duck', label: true }, { picture: 'fish', label: true }, { picture: 'fish', label: true }] });
    add(cart, P.cart.x, P.cart.z, 0);
    S.cart = cart;
    const s = chalkSlate({ w: 0.3, h: 0.22, text: '', lean: 0.6 });
    add(s, P.cart.x - 0.15, P.cart.z + 0.05, 0.4, 0.58);
    s.root.visible = false;
    S.cartSlate = s;
  }
  // Daw Sanda's house: a small stilt house up five steps at the head of Little Jetty, patches on a line
  if (door('sandahouse', P.houseDoor.x, P.houseDoor.z, 0, 0.8)) {
    const v = new VoxelBuilder();
    const { x, z } = P.house;
    const W = 3.4, D = 3.0, F = 0.75, H = 2.5;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.box(x + sx * (W / 2 - 0.15), F / 2, z + sz * (D / 2 - 0.15), 0.16, F, 0.16, '#7E5A38');
    v.boxMin(x - W / 2, F - 0.08, z - D / 2, x + W / 2, F, z + D / 2, '#9C6E45');
    v.boxMin(x - W / 2 + 0.05, F, z - D / 2 + 0.05, x + W / 2 - 0.05, F + H, z + D / 2 - 0.05, '#F4EEDC'); // ledger-paper walls
    for (let k = 0; k < 5; k++) v.box(x, F + 0.3 + k * 0.46, z + D / 2 - 0.04, W - 0.1, 0.012, 0.012, k % 2 ? '#D98579' : '#8EAFCF'); // ruled lines
    v.boxMin(x - W / 2 - 0.25, F + H, z - D / 2 - 0.3, x + W / 2 + 0.25, F + H + 0.14, z + D / 2 + 0.45, '#8E5A3A');
    v.boxMin(x - W / 2 + 0.2, F + H + 0.14, z - D / 2, x + W / 2 - 0.2, F + H + 0.5, z + D / 2 + 0.1, '#A8693F');
    v.boxMin(x - 0.42, F, z + D / 2 - 0.03, x + 0.42, F + 1.95, z + D / 2 + 0.03, '#C9A24A'); // door frame
    v.boxMin(x - 0.35, F, z + D / 2 + 0.01, x + 0.35, F + 1.88, z + D / 2 + 0.06, '#6E4A2E'); // plank door
    v.boxMin(x + 0.8, F + 1.0, z + D / 2 - 0.02, x + 1.4, F + 1.55, z + D / 2 + 0.05, '#BFD3E0'); // window
    for (let k = 0; k < 5; k++) v.box(x, F - (k + 1) * (F / 5) + F / 10, z + D / 2 + 0.2 + k * 0.24, 0.9, 0.06, 0.24, k % 2 ? '#B98A5A' : '#A47A50'); // five steps
    v.box(x - 0.95, F + H - 0.1, z + D / 2 + 0.36, 2.0, 0.015, 0.015, '#C9AE7E'); // the patch line under the eaves
    ['#D97C8A', '#2F7C7A', '#D9A93B', '#7FB0CF'].forEach((c, i) => v.box(x - 1.7 + i * 0.42, F + H - 0.32, z + D / 2 + 0.36, 0.3, 0.38, 0.02, c));
    const m = v.mesh();
    m.name = 'd6SandaHouse';
    scene.add(m);
    objs.push({ root: m, dispose() { m.geometry.dispose(); } });
    box(x - W / 2 - 0.05, z - D / 2 - 0.05, x + W / 2 + 0.05, z + D / 2 + 0.2);
    box(x - 0.48, z + D / 2 + 0.2, x + 0.48, z + D / 2 + 1.0); // the steps
  }
  {
    const pl = bambooPole({ len: 3.4, wish: false });
    add(pl, P.pole.x, P.pole.z, 0, 0);
    pl.root.rotation.z = -0.2;
    pl.root.visible = false;
    S.pole = pl;
  }
  {
    const r = raft({ patches: 7, parcels: 3, pole: true });
    add(r, P.raft.x, P.raft.z, 0, -0.22);
    if (r.update) ticks.push((dt, t) => r.update(dt, t));
    r.root.visible = false;
    S.raft = r;
  }
  {
    const f = ferry({ bailing: true });
    add(f, P.ferry.x, P.ferry.z, 0, -0.95);
    if (f.update) ticks.push((dt, t) => f.update(dt, t));
    S.ferry = f;
  }
  // the sandbar, Cane Jetty and Duck Jetty, U Bo Lay's post, the cane shed, its rack and bundles: all wharf.js's own

  // ---------------------------------------------------------------- outdoor walk-ons (unnamed: looks only)
  const W = {};
  W.fishwoman = walkOn(LOOKS.fishwoman, P.fishWoman, scene);
  W.cutter = walkOn(LOOKS.cutter, { ...P.cutter, y: 0 }, scene);
  for (const k of Object.keys(W)) walkons.push(W[k]);
  ticks.push((dt) => { for (const p of walkons) p.update(dt, { speed: 0 }); });

  return {
    S, W, P,
    update(dt, t) { for (const f of ticks) f(dt, t); },
    /** A walk-on created later (indoors walk-ons are the day's own; this is for outdoors). */
    addWalkOn(p) { walkons.push(p); },
    dispose() {
      for (const f of S.liveOff || []) { try { f(); } catch { /* world gone */ } }
      for (const o of objs) { const r = o.root || o; r.parent?.remove(r); try { o.dispose?.(); } catch { /* shared caches */ } }
      space?.remove?.(obs);
      for (const o of obs) {
        for (const list of [space?.all, story.foot.obstacles]) { const k = list ? list.indexOf(o) : -1; if (k >= 0) list.splice(k, 1); }
        // (the hash has no remove: the shape moves far off the land, where it can never block anyone)
        if (o.type === 'box') { o.minX = o.maxX = -1e6; o.minZ = o.maxZ = -1e6; }
      }
      for (const id of doorIds) delete DOORS[id];
      for (const p of walkons) { p.root.parent?.remove(p.root); p.dispose?.(); }
      objs.length = obs.length = doorIds.length = walkons.length = ticks.length = 0;
    },
  };
}

/** Screen-space tap targets for props outdoors (no outline, no marker: the prop itself is what you tap). */
export function propTaps(story, game) {
  const list = [];
  const v = new THREE.Vector3();
  const hook = (sx, sy) => {
    if (story.inRoom || story.talking || game.busy || !story.foot?.active || game.mode !== 'world') return false;
    const mp = story.foot.pos;
    let best = null, bd = 50;
    for (const t of list) {
      if (t.when && !t.when()) continue;
      const at = typeof t.at === 'function' ? t.at() : t.at;
      if (!at || Math.hypot(at.x - mp.x, at.z - mp.y) > (t.range ?? 22)) continue;
      const q = game.rig.project(v.set(at.x, at.y ?? 0.8, at.z), game.viewW, game.viewH);
      if (!q) continue;
      const d = Math.hypot(q.x - sx, q.y - sy);
      if (d < (t.px ?? 50) && d < bd) { bd = d; best = { t, at }; }
    }
    if (!best) return false;
    const { t, at } = best;
    const st = t.stand ? (typeof t.stand === 'function' ? t.stand() : t.stand) : { x: at.x, z: at.z + 1.0 };
    const go = () => Promise.resolve().then(() => t.fn(at)).catch((e) => console.error('day6 tap', t.id, e));
    if (Math.hypot(st.x - mp.x, st.z - mp.y) < 0.6 || t.noWalk) go();
    else story.foot.walkTo(st.x, st.z, (ok) => { if (ok !== false || Math.hypot(at.x - story.foot.pos.x, at.z - story.foot.pos.y) < 3.2) go(); });
    return true;
  };
  story.tapHooks = story.tapHooks || [];
  story.tapHooks.push(hook);
  return {
    add(t) { list.push(t); return t; },
    dispose() { const k = story.tapHooks.indexOf(hook); if (k >= 0) story.tapHooks.splice(k, 1); list.length = 0; },
  };
}
