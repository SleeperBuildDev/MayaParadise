// Story mode: Maya on foot outdoors, and the one button that switches between walking and the car.
//
//   const foot = createFoot(game, { obstacles })   obstacles: extra { type:'circle'|'box' } list (people)
//   foot.active                 true while she walks outdoors
//   foot.toFoot() / foot.toCar() / foot.toggle()   -> Promise (ignored while busy)
//   foot.update(dt, t)          called from main.js updateWorld() while active
//   foot.walkTo(x, z, cb)       tap-to-walk (path around buildings and trees)
//   foot.pos                    Vector2 (x, z)
//   foot.landAt(x, z)           the nearest free, open ground to (x, z) (not in the parked car): { x, z }
import * as THREE from '../game/three.js';
import { createWalker, collides } from '../game/nav.js';
import { BOOK, FOUNTAIN } from '../game/world/world.js';
import { freeSpot, boxedIn } from './world/walker.js';

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
  // the safety net: the stick held ~1.5 s and she has got nowhere -> if she is boxed in, out to open ground
  let pushT = 0;
  const pushFrom = new THREE.Vector2();
  const offCar = (x, z) => {
    const c = game.car?.root;
    if (!c) return true;
    const dx = x - c.position.x, dz = z - c.position.z, h = c.rotation.y, cs = Math.cos(h), sn = Math.sin(h);
    const lx = dx * cs - dz * sn, lz = dx * sn + dz * cs; // (into the car's frame)
    return Math.abs(lx) > 1.15 || Math.abs(lz) > 1.6;
  };
  // the door spots out in the open world: a step further out than the car's own (1.0 m from its middle, her hair
  // brushed the 1.3 m wide body), and on the side facing the camera when the car runs across the screen (on the far
  // side she landed behind the car, only her hair showing over it, as if she stood inside it)
  const DOOR_X = 1.42;
  const doorSides = (car, ep0, toward = null) => {
    car.root.updateMatrixWorld(true);
    const sx = Math.sign(ep0.x) || 1;
    const side = (s) => car.root.localToWorld(new THREE.Vector3(s * DOOR_X, 0, ep0.z));
    let a = side(sx), b = side(-sx);
    const cam = game.camera.position;
    const dA = Math.hypot(a.x - cam.x, a.z - cam.z), dB = Math.hypot(b.x - cam.x, b.z - cam.z);
    let swap = dB < dA - 0.6; // (driver's door unless the other is clearly nearer the lens)
    if (toward) {
      // getting in: the door on the side she stands (when she is clearly on one side)
      const l = car.root.worldToLocal(new THREE.Vector3(toward.x, 0, toward.z));
      if (Math.abs(l.x) > 0.5) swap = Math.sign(l.x) !== sx;
    }
    if (swap) [a, b] = [b, a];
    return [a, b];
  };

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
      // where she lands: beside the driver's door, or the other door, or the nearest open ground round the
      // car (a kerb fence, a stall or a lamp right at the door had her land inside it, unable to walk)
      const car = game.car, ep0 = car.exitPoint;
      let hopTo = null;
      if (open && ep0) {
        const [a, b] = doorSides(car, ep0);
        const roomy = (q) => !blocked(q.x, q.z, 0.28) && !boxedIn(open.space, q.x, q.z);
        if (roomy(a)) hopTo = a;
        else if (roomy(b)) hopTo = b;
        else {
          const s = foot.landAt(a.x, a.z);
          if (s && Math.hypot(s.x - a.x, s.z - a.z) < 2.5) hopTo = new THREE.Vector3(s.x, 0, s.z);
        }
        if (hopTo) car.exitPoint = car.root.worldToLocal(hopTo.clone()).setY(0);
      }
      try { await game.hopOut(); } catch (err) { console.warn('hop out', err); game.worldWalk = null; } finally { if (car.exitPoint !== ep0) car.exitPoint = ep0; }
      try {
        const p = game.maya.root.position;
        // land on free ground: out of anything she would stand inside, and not in a pocket
        let x = p.x, z = p.z;
        if (open) {
          const s = foot.landAt(x, z);
          if (s) { x = s.x; z = s.z; }
        } else {
          for (let k = 0; k < 24 && blocked(x, z, 0.3); k++) { x += Math.sin(k) * 0.25; z += Math.cos(k) * 0.25; }
          if (blocked(x, z, 0.3)) { x = p.x; z = p.z; } // nowhere better: stay where she landed
        }
        walker.teleport(x, z, game.mayaHeading());
        game.maya.root.position.set(x, 0, z);
        game.maya.setMode('walk');
        prevHeading = walker.heading;
        game.rig.setFollow(FOOT_VIEW);
      } finally {
        // (whatever happened above, she is on foot and free to walk)
        game.worldWalk = null;
        foot.active = true;
        game.busy = false;
        game.arrivedAt = null;
        pushT = 0;
      }
      return true;
    },

    /** The nearest free ground to (x, z) where she can walk away (not a pocket), off the parked car. */
    landAt(x, z) {
      if (!open) return blocked(x, z, 0.3) ? null : { x, z };
      const s = freeSpot(open.space, x, z, { r: 0.28, maxR: 10, roomy: true, open: true, ok: offCar })
        || freeSpot(open.space, x, z, { r: 0.27, maxR: 16, open: true })
        || freeSpot(open.space, x, z, { r: 0.26, maxR: 20 });
      return s ? { x: s.x, z: s.z } : null;
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
        // (she stood on the road: the car pulled up on top of her, its bumper at her feet. It stops a little
        // ahead instead, and she walks round to the door)
        if (open) {
          const c = game.car.root, h = c.rotation.y;
          const l = c.worldToLocal(v3.set(p.x, 0, p.z));
          if (Math.abs(l.x) < 1.35 && Math.abs(l.z) < 2.0) {
            const d = l.z + 2.5;
            game.world.drive.placeAt(c.position.x + Math.sin(h) * d, c.position.z + Math.cos(h) * d, h);
            game.syncCar(0);
          }
        }
        await quickFade(game, false);
        call(game.audio, 'play', 'honk');
        call(game.car, 'honk');
      }
      foot.active = false; // hand updates back to main.js (hopIn walks with game.worldWalk)
      game.rig.setFollow(CAR_VIEW);
      // the door she walks to: on her side of the car, a step out from the body (see doorSides)
      const cr = game.car, ep0 = cr.exitPoint;
      if (open && ep0) {
        const [a, b] = doorSides(cr, ep0, p);
        const q = !blocked(a.x, a.z, 0.26) ? a : !blocked(b.x, b.z, 0.26) ? b : null;
        if (q) cr.exitPoint = cr.root.worldToLocal(q.clone()).setY(0);
      }
      try { await game.hopIn(); } catch (err) {
        // (never leave her frozen half way: back on her feet where she stands)
        console.warn('hop in', err);
        game.worldWalk = null;
        if (game.maya.root.parent !== game.car.seat) {
          const q = game.maya.root.getWorldPosition(v3);
          walker.teleport(q.x, q.z, game.mayaHeading());
          game.rig.setFollow(FOOT_VIEW);
          foot.active = true;
        }
      } finally { game.busy = false; if (ep0 && cr.exitPoint !== ep0) cr.exitPoint = ep0; }
      return true;
    },

    toggle() { return foot.active ? foot.toCar() : foot.toFoot(); },

    walkTo(x, z, cb) { walker.goTo(x, z, cb); },

    update(dt, t) {
      const blocked = game.busy || game.ui.sheetOpen || game.ui.dialogOpen || game.story?.talking;
      const stick = blocked ? null : game.input.stick();
      const speed = walker.update(dt, stick, WALK * (foot.speedScale ?? 1)); // (story.carry: 0.7)
      if (open && stick && stick.lengthSq() > 0.04) {
        if (pushT === 0) pushFrom.copy(walker.pos);
        pushT += dt;
        if (walker.pos.distanceTo(pushFrom) > 0.5) pushT = 0; // (getting somewhere)
        else if (pushT > 1.5) {
          pushT = 0;
          if (open.space.collides(walker.pos.x, walker.pos.y, 0.26) || boxedIn(open.space, walker.pos.x, walker.pos.y)) {
            const s = foot.landAt(walker.pos.x, walker.pos.y);
            if (s) { walker.teleport(s.x, s.z, walker.heading); foot.unstuck = (foot.unstuck || 0) + 1; }
          }
        }
      } else pushT = 0;
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
