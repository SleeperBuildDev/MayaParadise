// Day 13's outdoor set. The district files now own every building and door Day 13 uses:
//   regions/hearth.js  the bakery, the back yard, the oven house with the back step and the plank back door
//                      (room `provingroom`), the Note Wall, the loom shed (+ DOORS bakery / provingroom / loomshed)
//   regions/blank.js   the last hedge with its gap, the lodge with its verandah (+ DOORS lodge), desk `blank`,
//                      the back cover
// so this file stands up only what is the day's own (no stand-in buildings, no extra doors): Maung Arkar's
// bread cart at the kerb, the two covered bundles beside Ei Mon on the back step, and today's chalk note on
// the Note Wall («Where's Ei Mon?»). Every place comes from the regions' SPOTS, so the day and the street agree.
// dispose() takes it all away again (props, keep-out shapes).
import * as THREE from '../game/three.js';
import { breadCart, coveredBundle } from './props5.js';
import { SPOTS as H } from './world/regions/hearth.js';
import { SPOTS as B, LODGE, LODGE_DOOR, BOARD, REGION as BLANK_REGION } from './world/regions/blank.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);

export const P = {
  bakery: { x: H.bakery.x, z: H.bakery.z },
  bakeryDoor: { x: H.bakery.door.x, z: H.bakery.door.z }, // (141, 197.55) on the Row's north kerb
  lane: { x: H.sideLane.x, z: H.sideLane.z },
  backStep: { x: H.backStep.x, z: H.backStep.z },
  backDoor: { x: H.provingDoor.x, z: H.provingDoor.z }, // provingroom: at the foot of the three brick steps
  yard: { x: H.yard.x, z: H.yard.z },
  emStep: { x: H.emStep.x, z: H.emStep.z, h: H.emStep.h }, // Ei Mon beside the back step, turned to the yard
  bundles: [{ x: H.emStep.x + 0.62, z: H.emStep.z - 0.1, r: 0.4 }, { x: H.emStep.x + 0.72, z: H.emStep.z + 0.36, r: -0.2 }],
  cart: { x: H.cartIdle.x, z: H.cartIdle.z - 0.2 }, // parked at the kerb in front of the bakery
  arkar: { x: H.cartIdle.x + 1.25, z: H.cartIdle.z - 0.15, h: -0.6 },
  noteWall: { x: H.noteWall.x, z: H.noteWall.z },
  shed: { x: H.loom.x, z: H.loom.z },
  shedDoor: { x: H.loom.door.x, z: H.loom.door.z }, // (159.9, 197.55)
  hedge: { x: B.hedgeGap.x, z: B.hedgeGap.z }, // the gap in the last hedge (140, 17.4)
  hpohtaw: { x: 138.3, z: 20.6, h: 0.5 }, // at the Garden side of the gap
  lodge: { x: LODGE.x, z: LODGE.z },
  lodgeDoor: { x: LODGE_DOOR.x, z: LODGE_DOOR.z }, // the walk-in point at the foot of the verandah steps
  dpVerandah: { x: LODGE.x - 1.4, z: LODGE.z + 1.75, y: 0.45, h: 0 }, // on the verandah by her bench, facing the yard
  board: { x: BOARD.x, z: BOARD.z }, // the back cover's front face
  keyhole: { x: B.keyhole.x, y: B.keyhole.y, z: B.keyhole.z },
  deskBlank: { x: B.desk.x, z: B.desk.z },
  about: null, // filled in at build (the Writing Room door on the Home Book)
  post: { x: 17.7, z: 4.3, h: -0.4 }, // Ma Wint War by the Post Office's sorting-room side, evening
};
// the Blank Page's paper (regions/blank.js rect), ending at the last hedge
const [bx0, bz0, bx1] = BLANK_REGION.rect;
export const BLANK = { x0: bx0, x1: bx1, z0: bz0, z1: B.hedgeGap.z };
export const inBlank = (x, z) => x > BLANK.x0 && x < BLANK.x1 && z > BLANK.z0 && z < BLANK.z1;
// the road home (regions/blank.js blankHome / SPOTS.walkNorth): from the lodge yard round its east end, north
export const ROAD = [[137.4, -5.0], ...B.walkNorth.map(([x, z]) => [x, z])];

/** Today's chalk note on the region's Note Wall: a small card pinned to the cork («Where's Ei Mon?»). */
function chalkNote(text) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 176;
  const g = c.getContext('2d');
  g.fillStyle = '#F4EBD6'; g.fillRect(0, 0, 256, 176);
  g.fillStyle = '#C8323C'; g.fillRect(120, 6, 16, 16); // the pin
  g.fillStyle = '#4A4038'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '600 30px "Noto Sans Myanmar", "Padauk", sans-serif';
  g.fillText(text.my, 128, 76);
  g.font = 'italic 22px Georgia, serif';
  g.fillText(text.en, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const geo = new THREE.PlaneGeometry(0.62, 0.43);
  const root = new THREE.Mesh(geo, mat);
  root.name = 'd13-chalkNote';
  root.rotation.z = -0.05;
  return { root, dispose() { geo.dispose(); mat.dispose(); tex.dispose(); } };
}

/**
 * Builds the day's own things. Returns { props, update(dt, t, mayaPos), setDoor(roomId, on), dispose() }.
 * props: cart, bundles [blue, green] (beside Ei Mon on the back step), note (the chalk note).
 */
export function buildWorld(story, o = {}) {
  const { game } = story;
  const scene = game.world.scene;
  const own = []; // { root, dispose, update }
  const obs = [];
  // keep-out shapes go into the open world's spatial hash (story.foot.obstacles is only its list: pushing
  // there alone would not collide); the hash has no remove, so dispose() shrinks ours to nothing far away
  const space = story.openWorld?.space || null;
  const addOb = (ob) => { obs.push(ob); if (space) space.add([ob]); else story.foot.obstacles.push(ob); };
  // (a prop that fails to build is skipped with a warning: the page still plays without it)
  const put = (make, x, z, ry = 0, y = 0) => {
    let p = null;
    try { p = make(); } catch (err) { console.warn('day13 prop', err); return null; }
    p.root.position.set(x, y, z); p.root.rotation.y = ry; scene.add(p.root); own.push(p); return p;
  };
  const ab = game.world.places.find((p) => p.id === 'about')?.door;
  P.about = ab ? { x: ab.x, z: ab.z } : { x: 0, z: 9 };
  const contact = game.world.places.find((p) => p.id === 'contact')?.door;
  if (contact) { P.post.x = contact.x + 1.4; P.post.z = contact.z + 1.3; }

  const props = {};
  // ---- Hearth Row: the day's own things only (the buildings are regions/hearth.js's)
  props.cart = put(() => breadCart({}), P.cart.x, P.cart.z, Math.PI / 2);
  if (props.cart) addOb({ type: 'circle', x: P.cart.x, z: P.cart.z, r: 0.7 });
  props.bundles = P.bundles.map((b, i) => put(() => coveredBundle({ tie: i ? 'green' : 'blue' }), b.x, b.z, b.r)).filter(Boolean);
  if (o.note) props.note = put(() => chalkNote(o.note), P.noteWall.x + 0.25, P.noteWall.z + 0.075, 0, 1.36);

  // doors: all four rooms (bakery, provingroom, loomshed, lodge) are the regions'; nothing to add or take away
  function setDoor() {}

  // the clack of the looms carries out through the shutters ("you'll hear it before you see it")
  let clackT = 0;
  function update(dt, t, mp, indoors) {
    for (const p of own) call(p, 'update', dt, t);
    if (mp && !indoors) {
      const d = Math.hypot(mp.x - P.shedDoor.x, mp.z - P.shedDoor.z);
      clackT -= dt;
      if (d < 11 && clackT <= 0 && story.save.flags['d13.weaving'] !== false) {
        clackT = 0.95 + Math.random() * 0.25 + d * 0.04;
        call(game.audio, 'play', 'click');
      }
    }
  }

  return {
    props,
    setDoor,
    update,
    dispose() {
      for (const p of own) { p.root.parent?.remove(p.root); try { call(p, 'dispose'); } catch (e) { console.warn('day13 prop', e); } }
      own.length = 0;
      space?.remove?.(obs); // (then emptied too: a harmless fallback)
      for (const ob of obs) {
        const list = space ? space.all : story.foot.obstacles;
        const k = list?.indexOf?.(ob) ?? -1;
        if (k >= 0) list.splice(k, 1);
        if (ob.type === 'circle') { ob.x = ob.z = -1e6; ob.r = 0; } else { ob.minX = ob.maxX = ob.minZ = ob.maxZ = -1e6; }
      }
      obs.length = 0;
    },
  };
}

/** Screen-space distance from a tap to a world point (or Infinity when it is off screen). */
export function tapDist(game, x, y, pt) {
  const q = game.rig.project(new THREE.Vector3(pt.x, pt.y ?? 0.8, pt.z), game.viewW, game.viewH);
  return q ? Math.hypot(q.x - x, q.y - y) : Infinity;
}
