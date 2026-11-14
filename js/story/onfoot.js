// Story mode: Maya on foot outdoors, and the one button that switches between walking and the car.
//
//   const foot = createFoot(game, { obstacles })   obstacles: extra { type:'circle'|'box' } list (people)
//   foot.active                 true while she walks outdoors
//   foot.toFoot() / foot.toCar() / foot.toggle()   -> Promise (ignored while busy)
//   foot.update(dt, t)          called from main.js updateWorld() while active
//   foot.walkTo(x, z, cb)       tap-to-walk (path around buildings and trees)
//   foot.pos                    Vector2 (x, z)
import * as THREE from '../game/three.js';
import { createWalker, collides } from '../game/nav.js';
import { BOOK, FOUNTAIN } from '../game/world/world.js';

export const FOOT_VIEW = { tilt: 30, width: 7, widthLandscape: 14, height: 0.9, stiffness: 5 }; // closer: people read on foot
export const CAR_VIEW = { tilt: 52, width: 12, widthLandscape: 22, height: 0.6, stiffness: 5 };
// indoors (doors.js, every room in story mode): close and low, a little nearer than on foot; never the whole room
// (pitch 25: a little lower and nearer than the first 30 / 3.6, the floor round her still reads)
export const ROOM_VIEW = { tilt: 25, width: 3.25, widthLandscape: 7, minHeight: 0, height: 0.85, stiffness: 5, bounds: null };
const WALK = 2.6; // m/s outdoors: a brisk walk (rooms use 2.2)
const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);

/** Keep-out shapes for the open-book world: buildings, trees, the fountain. */
export function worldObstacles(world) {
  const list = [];
  const box = new THREE.Box3(), bb = new THREE.Box3();
  for (const p of world.places) {
    if (!p.group) continue;
    // (flat things on the ground, a building's paving or shadow decal, are walkable: the Post Office's
    // ran 2.5 m out past its west wall, over the sorting room's side door)
    box.makeEmpty();
    p.group.updateMatrixWorld(true);
    p.group.traverse((o) => {
      if (!o.geometry || o.userData?.isOutline) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      if (bb.max.y - bb.min.y > 0.12) box.union(bb);
    });
    if (box.isEmpty()) box.setFromObject(p.group);
    // the footprint, a little smaller than the widest parts (eaves, signs), and never the door step
    const shrink = 0.25;
    // fronts face +Z: the front wall stands at the door, so hedges and steps in front stay walkable
    list.push({ type: 'box', minX: box.min.x + shrink, maxX: box.max.x - shrink, minZ: box.min.z + shrink, maxZ: Math.min(box.max.z - shrink, p.door.z - 0.15), place: p.id });
  }
  const m = new THREE.Matrix4();
  const v = new THREE.Vector3();
  world.scene.traverse((o) => {
    if (!o.isInstancedMesh || !['trees', 'padauks', 'cypresses', 'palms'].includes(o.name)) return;
    const r = o.name === 'padauks' ? 0.55 : o.name === 'trees' ? 0.5 : 0.32;
    for (let i = 0; i < o.count; i++) {
      o.getMatrixAt(i, m);
      v.setFromMatrixPosition(m);
      list.push({ type: 'circle', x: v.x, z: v.z, r });
    }
  });
  if (FOUNTAIN) list.push({ type: 'circle', x: FOUNTAIN.x, z: FOUNTAIN.z, r: 1.55 });
  return list;
}

export function createFoot(game, opts = {}) {
  const home = worldObstacles(game.world).concat(opts.obstacles || []);
  // opts.open (the open world, story/world/index.js): one walker for the book, the bridge and the land,
  // colliding through a spatial hash (no world-sized grid); otherwise the book's own walk grid
  const open = opts.open || null;
  if (open) open.space.add(home);
  const obstacles = open ? open.space.all : home;
  const bounds = open ? open.bounds : { minX: -BOOK.halfW + 0.6, maxX: BOOK.halfW - 0.6, minZ: -BOOK.halfD + 0.6, maxZ: BOOK.halfD - 0.6 };
  const walker = open ? open.createWalker({ x: 0, z: 0, heading: 0 }) : createWalker({ bounds, obstacles, spawn: { x: 0, z: 0, heading: 0 } });
  const blocked = open ? (x, z, r) => open.space.collides(x, z, r) : (x, z, r) => collides(obstacles, x, z, r);
  const v3 = new THREE.Vector3();
  const lead = new THREE.Vector3();
  let prevHeading = 0;
  let prevSpeed = 0;

  const foot = {
    active: false,
    walker,
    obstacles,
    bounds,
    get pos() { return walker.pos; },

    async toFoot() {
      if (foot.active || game.busy || game.mode !== 'world' || game.worldWalk) return false;
      game.busy = true;
      const drive = game.world.drive;
      drive.stop();
      game.world.setRoute(null);
      game.autoEnter = null;
      // let the car roll to a stop (updateWorld keeps running; the stick is ignored while busy)
      for (let i = 0; i < 60 && Math.abs(drive.state.speed) > 0.25; i++) await new Promise((r) => setTimeout(r, 30));
      call(game.audio, 'engine', 0);
      game.ui.hideCard?.();
      await game.hopOut();
      const p = game.maya.root.position;
      // land on free ground: nudge out of anything she would stand inside
      let x = p.x, z = p.z;
      for (let k = 0; k < 24 && blocked(x, z, 0.3); k++) { x += Math.sin(k) * 0.25; z += Math.cos(k) * 0.25; }
      if (blocked(x, z, 0.3)) { x = p.x; z = p.z; } // nowhere better: stay where she landed
      walker.teleport(x, z, game.mayaHeading());
      game.maya.root.position.set(x, 0, z);
      game.maya.setMode('walk');
      prevHeading = walker.heading;
      game.rig.setFollow(FOOT_VIEW);
      foot.active = true;
      game.busy = false;
      game.arrivedAt = null;
      return true;
    },

    async toCar() {
      if (!foot.active || game.busy) return false;
      game.busy = true;
      walker.stop();
      const p = game.maya.root.position;
      const car = game.car.root.position;
      // the car comes to her if it is far away (it pulls up on the nearest street)
      if (Math.hypot(car.x - p.x, car.z - p.z) > 5) {
        await quickFade(game, true);
        game.world.drive.placeAt(p.x, p.z, game.mayaHeading());
        game.syncCar(0);
        await quickFade(game, false);
        call(game.audio, 'play', 'honk');
        call(game.car, 'honk');
      }
      foot.active = false; // hand updates back to main.js (hopIn walks with game.worldWalk)
      game.rig.setFollow(CAR_VIEW);
      await game.hopIn();
      game.busy = false;
      return true;
    },

    toggle() { return foot.active ? foot.toCar() : foot.toFoot(); },

    walkTo(x, z, cb) { walker.goTo(x, z, cb); },

    update(dt, t) {
      const blocked = game.busy || game.ui.sheetOpen || game.ui.dialogOpen || game.story?.talking;
      const stick = blocked ? null : game.input.stick();
      const speed = walker.update(dt, stick, WALK * (foot.speedScale ?? 1)); // (story.carry: 0.7)
      game.maya.root.position.set(walker.pos.x, 0, walker.pos.y);
      game.maya.root.rotation.set(0, walker.heading, 0);
      let dh = walker.heading - prevHeading;
      dh = Math.atan2(Math.sin(dh), Math.cos(dh));
      prevHeading = walker.heading;
      const turn = THREE.MathUtils.clamp(dh / Math.max(dt, 1e-3) / 4, -1, 1);
      game.maya.update(dt, { speed, turn, accel: (speed - prevSpeed) / Math.max(dt, 1e-3), t });
      prevSpeed = speed;
      game.car.update(dt, { speed: 0, steer: 0, accel: 0 });
      game.world.update(dt, t);
      if (game.birds) {
        const w = game.birdWho;
        w.x = walker.pos.x; w.z = walker.pos.y; w.speed = speed; w.heading = walker.heading;
        game.birds.update(dt, t, w);
      }
      lead.set(Math.sin(walker.heading), 0, Math.cos(walker.heading)).multiplyScalar(Math.min(1.5, speed * 0.5));
      game.rig.setTarget(game.maya.root.getWorldPosition(v3), lead);
      call(game.audio, 'engine', 0);
    },
  };
  return foot;
}

/** A short dip to cream so the car can appear beside her without a pop. */
async function quickFade(game, close) {
  let el = document.getElementById('story-fade');
  if (!el) {
    el = document.createElement('div');
    el.id = 'story-fade';
    document.getElementById('game').appendChild(el);
  }
  el.classList.toggle('on', close);
  await new Promise((r) => setTimeout(r, 260));
}
