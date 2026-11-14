// Day 9's street dressing on Hearth Row (day9-spec 1, INDEX 13.4). regions/hearth.js now owns the Row: the
// bakery, its side lane, flour sacks and back yard, the Note Wall, the noodle house, the lamp-mender's bench, the
// evening class, the scorch ring in the road, and their doors (DOORS). This file adds only what is Day 9's own:
// the bread cart (it tips and is set right), the three loose loaves, Ei Mon's tiffin in the yard, the great
// diary clasp lying shut across the clasp road (the region's clasp stands open: the Garden opens Day 10), and
// the "ask Maya" board's state at home. Places come from the region's SPOTS so the day and the street agree.
// No markers, no glow pins: everything here is just there to be seen.
import * as THREE from '../game/three.js';
import { breadCart, loaf, diaryClasp, tiffin } from './props5.js';
import { mergeStatic } from './merge-static.js';
import { SPOTS as H } from './world/regions/hearth.js';

export const P = {
  bakery: { x: H.bakery.x, z: H.bakery.z, door: { ...H.bakery.door } },
  noodle: { x: H.noodle.x, z: H.noodle.z, door: { ...H.noodle.door } },
  klass: { x: H.klass.x, z: H.klass.z, door: { ...H.klass.door } },
  noteWall: { x: H.noteWall.x, z: H.noteWall.z },
  ring: { ...H.ring },
  cartIdle: { ...H.cartIdle },
  cartHome: { ...H.cartHome },
  laneMouth: { ...H.laneMouth },
  yard: { x: H.sackSeat.x + 0.8, z: H.sackSeat.z }, // where Maung Arkar sits by his sack, facing west
  yardWall: { ...H.yardWall },
  lampBench: { ...H.lampBench, front: { x: H.lampBench.x, z: H.lampBench.z - 0.95 } }, // the bench faces the road (north)
  crease: { ...H.crease }, // the tear's south lip
  clasp: { ...H.clasp },
  chimneys: { x: H.bakery.x, y: H.bakery.chimneys[0].y - 1, z: H.bakery.chimneys[0].z },
  loaves: [{ x: H.ring.x - 3.2, z: H.ring.z + 0.6 }, { x: H.laneMouth.x + 1.9, z: H.laneMouth.z + 1.3 }, { x: H.ring.x, z: H.ring.z }], // rolled west along the road, by the lane sacks, in the ring
};

/** (Kept for old imports: the Row's doors are the region's now, regions/hearth.js DOORS.) */
export const DOORS9 = [];

const box = (minX, maxX, minZ, maxZ) => ({ type: 'box', minX, maxX, minZ, maxZ });

/**
 * Build the Row (and the home board) into the open world. Returns handles for the script:
 *   { cart, tiffin, clasp, board, boardAt, loaves: [3],
 *     obstacles, update(dt, t), setCart(at, tipped), dispose() }
 */
export function buildStreet(game, story, o = {}) {
  const scene = game.world.scene;
  const own = []; // { root, dispose }
  const obstacles = [];
  const add = (h, x, z, ry = 0) => { h.root.position.set(x, 0, z); h.root.rotation.y = ry; scene.add(h.root); own.push(h); return h; };

  // ---- the back yard: Ei Mon's tiffin by Maung Arkar's sack (the sack, the wall, the trays are the region's)
  const tif = add(tiffin({ open: 1 }), P.yard.x + 0.32, P.yard.z + 0.42, 0.4);
  tif.root.scale.setScalar(1.4);
  const tifMerge = mergeStatic([tif.root], scene, { name: 'd9-tiffin' }); // (it never moves: 9 draw calls -> 3)

  // ---- the road
  const cart = add(breadCart({ trays: [6, 6, 5, 6], tied: false, tipped: 0 }), P.cartIdle.x, P.cartIdle.z, Math.PI / 2);
  const clasp = add(diaryClasp({ open: 0 }), P.clasp.x, P.clasp.z, 0);
  obstacles.push(box(P.clasp.x - 3.1, P.clasp.x + 3.1, P.clasp.z - 0.55, P.clasp.z + 0.55));

  // ---- loose loaves (shown when the cart tips)
  const loaves = P.loaves.map((p, i) => {
    const h = loaf({ scale: 1.5 });
    add(h, p.x, p.z, i * 1.3);
    h.root.visible = false;
    return h;
  });

  // ---- home: the "ask Maya" board, the shared one (api.js story.board, home.js ASK_BOARD): 31 notes, Maya's
  // Day 8 card, today's new note under it; setMarks(on): a pencil «?» on three old notes
  const D8_CARD = [{ my: 'မယုံနဲ့ဦး။', en: "Don't believe it yet." }, { my: 'ကိုယ်တိုင်', en: 'Go and' }, { my: 'သွားကြည့်ပါ။', en: 'see for yourself.' }, { my: '— မာရာ', en: '— Maya' }]; // DRAFT(my)
  story.board.set({ notes: 32, replies: 4, notice: D8_CARD, marks: 0 });
  const board = { root: story.board.root, setMarks(on) { story.board.set({ marks: on ? 3 : 0 }); }, dispose() {} };
  const boardAt = { x: story.board.stand.x, z: story.board.stand.z - 0.05, look: { ...story.board.target, y: 1.3 } };

  function setCart(at, tipped = 0) {
    cart.root.position.set(at.x, 0, at.z);
    cart.setTipped(tipped);
  }
  setCart(P.cartIdle, 0);

  // keep-out shapes: into the open world's spatial hash (pushing onto foot.obstacles alone would not reach it)
  const space = story.openWorld?.space;
  if (space) space.add(obstacles); else for (const o of obstacles) story.foot.obstacles.push(o);

  return {
    cart, tiffin: tif, clasp, board, boardAt, loaves, obstacles,
    setCart,
    update(dt, t) { for (const h of own) h.update?.(dt, t); },
    dispose() {
      space?.remove?.(obstacles); // (then emptied in place too: a harmless fallback)
      const all = space ? space.all : story.foot.obstacles;
      for (const o of obstacles) { o.minX = o.minZ = 1e6; o.maxX = o.maxZ = -1e6; const k = all.indexOf(o); if (k >= 0) all.splice(k, 1); }
      tifMerge.undo();
      for (const h of own) { h.root.parent?.remove(h.root); try { h.dispose?.(); } catch { /* already gone */ } }
      own.length = 0;
    },
  };
}
