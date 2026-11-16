// Maya keeps her place across the Game | Website switch (owner, 2026-11-16: "keep the same location when the
// transitions switch between game and website"). Both modes draw the same open book at the same coordinates
// (story/world/regions/home.js: "world.js draws the book itself"), and story mode's road network is the book's
// own roads plus its extra streets (story/world/net.js), so a spot means the same place in both: no mapping, only
// a check that the spot is valid in the mode she arrives in.
//
//   capturePose(game) -> pose | null      modeswitch.js, the moment the page has turned (sessionStorage 'mw-switch'.pose)
//   validPose(pose)                       a pose this build can use (numbers, on or near the book)
//   placeCar(game, pose)                  main.js init, story mode: the car where the website left it (before the
//                                         first frame; story.js then builds the land round it with placeStory)
//   placeSite(game, pose) -> 'car'|'foot' main.js init, website mode: the car on the road she left it on; if she was
//                                         walking, she stands where she stood (kept on the book, out of anything
//                                         solid), the car on the road beside her, the camera as she had it
//   walkToCar(game)                       website, after a 'foot' arrival once the turning page has lifted: she walks
//                                         round buildings and trees to the car and hops in (the site has no walking)
//   placeStory(game, story, pose)         story.js createStory, and a back-forward-cache restore: car at the spot,
//                                         the land round it built (openWorld.jump), the save's place updated
//   restorePose(game, pose) -> Promise    modeswitch.js 'pageshow' (a page kept in the back-forward cache comes back
//                                         as it was left): the same placement, under the page that is still turned
//
// pose = { v: 1, foot, x, z, h, car: { x, z, h }, cam: { tilt, width, widthLandscape, height, zoom, minHeight } }
//   x, z, h: Maya on foot (story mode), or the car; h = heading (0 = +Z); cam: the follow camera's framing (the
//   camera itself always looks north, camera.js: there is no yaw to carry)
import * as THREE from './three.js';
import { BOOK } from './world/world.js';

// main.js's world camera (story mode's CAR_VIEW is the same, story/onfoot.js)
const CAR_VIEW = { tilt: 52, width: 12, widthLandscape: 22, minHeight: 0, height: 0.6, bounds: null, stiffness: 5 };
const VIEW_KEYS = ['tilt', 'width', 'widthLandscape', 'height', 'zoom', 'minHeight'];
// story mode clears the flower bed where its ribbon road runs (regions/home.js BOOK_KEEP_CLEAR): the website still
// has it, so a spot on that road is a spot in the flowers here
const SITE_ONLY = [{ type: 'box', minX: 3.6, maxX: 6.4, minZ: 10.6, maxZ: 13.4 }];
const R = 0.3; // m: her body radius plus a little
const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const rd = (v, n = 2) => +v.toFixed(n);
const v3 = new THREE.Vector3();

export function capturePose(game) {
  try {
    if (!game?.world?.drive || !game.maya || game.mode !== 'world') return null;
    const st = game.world.drive.state;
    const foot = !!game.story?.foot?.active;
    const m = game.maya.root.getWorldPosition(v3);
    const f = game.rig?.follow || {};
    const cam = {};
    for (const k of VIEW_KEYS) if (fin(f[k])) cam[k] = f[k];
    return {
      v: 1, foot,
      x: rd(foot ? m.x : st.position.x), z: rd(foot ? m.z : st.position.z), h: rd(foot ? game.mayaHeading() : st.heading, 3),
      car: { x: rd(st.position.x), z: rd(st.position.z), h: rd(st.heading, 3) },
      cam,
    };
  } catch { return null; }
}

export function validPose(p) {
  return !!p && p.v === 1 && [p.x, p.z, p.h, p.car?.x, p.car?.z, p.car?.h].every(fin)
    && Math.abs(p.x) < 40 && Math.abs(p.z) < 30 && Math.abs(p.car.x) < 40 && Math.abs(p.car.z) < 30;
}

function seatInCar(game) {
  const m = game.maya;
  if (m.root.parent !== game.car.seat) game.car.seat.add(m.root);
  m.root.position.set(0, 0, 0);
  m.root.rotation.set(0, 0, 0);
  m.setMode('drive', true);
}

/** Story mode, main.js init: the car (Maya in it) on the road point the website left it on. */
export function placeCar(game, pose) {
  game.world.drive.placeAt(pose.car.x, pose.car.z, pose.car.h);
  game.syncCar(0);
  return 'car';
}

// ---- website mode
async function siteObstacles(game) {
  if (!game.keepObs) {
    const { worldObstacles } = await import('../story/onfoot.js');
    game.keepObs = worldObstacles(game.world).concat(SITE_ONLY);
  }
  return game.keepObs;
}
const hits = (obs, x, z, r) => obs.some((o) => (o.type === 'circle' ? Math.hypot(x - o.x, z - o.z) < o.r + r
  : Math.hypot(x - Math.max(o.minX, Math.min(x, o.maxX)), z - Math.max(o.minZ, Math.min(z, o.maxZ))) < r));
const onBook = (x, z) => ({ x: THREE.MathUtils.clamp(x, -BOOK.halfW + 0.6, BOOK.halfW - 0.6), z: THREE.MathUtils.clamp(z, -BOOK.halfD + 0.6, BOOK.halfD - 0.6) });

/** The spot itself if she can stand there on the website's book (on the paper, out of buildings, trees, the
 * fountain and the flower bed), else the nearest one that is (rings of 0.2 m out to 6 m). */
function standSpot(obs, x, z) {
  const p = onBook(x, z);
  if (!hits(obs, p.x, p.z, R)) return p;
  for (let r = 0.2; r <= 6; r += 0.2) {
    const n = Math.ceil((2 * Math.PI * r) / 0.2);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const q = onBook(p.x + Math.sin(a) * r, p.z + Math.cos(a) * r);
      if (!hits(obs, q.x, q.z, R)) return q;
    }
  }
  return p;
}

/** Website mode: put the car (and Maya, if she was walking) where the game left them. -> 'car' | 'foot' */
export async function placeSite(game, pose) {
  const drive = game.world.drive;
  game.ui?.hideCard?.();
  game.arrivedAt = null;
  if (!pose.foot) {
    drive.placeAt(pose.car.x, pose.car.z, pose.car.h);
    game.syncCar(0);
    seatInCar(game);
    game.rig.setFollow(CAR_VIEW);
    game.rig.setTarget(game.car.root.position);
    game.rig.snap();
    return 'car';
  }
  const obs = await siteObstacles(game);
  const s = standSpot(obs, pose.x, pose.z);
  // the car: where she left it, when that is a road here too and near her; else the road nearest her
  let carOk = false;
  if (Math.hypot(pose.car.x - s.x, pose.car.z - s.z) < 10) {
    const p = drive.placeAt(pose.car.x, pose.car.z, pose.car.h);
    carOk = !!p && Math.hypot(p.x - pose.car.x, p.z - pose.car.z) < 0.6;
  }
  if (!carOk) {
    drive.placeAt(s.x, s.z, pose.h);
    game.syncCar(0);
    // (she stood on the road: the car would stand on top of her. It stops a little ahead instead: onfoot.js toCar)
    const c = game.car.root, h = c.rotation.y;
    c.updateMatrixWorld(true);
    const l = c.worldToLocal(v3.set(s.x, 0, s.z));
    if (Math.abs(l.x) < 1.35 && Math.abs(l.z) < 2.0) {
      const d = l.z + 2.5;
      drive.placeAt(c.position.x + Math.sin(h) * d, c.position.z + Math.cos(h) * d, h);
    }
  }
  game.syncCar(0);
  // Maya out of the car, standing where she stood (game.busy: main.js keeps the camera on her, the stick off)
  const m = game.maya;
  game.world.scene.add(m.root);
  m.root.position.set(s.x, 0, s.z);
  m.root.rotation.set(0, pose.h, 0);
  m.setMode('walk');
  m.update?.(0, { speed: 0, turn: 0, accel: 0, t: game.t || 0 });
  game.busy = true;
  game.keepWalk = true;
  game.rig.setFollow({ ...CAR_VIEW, ...pose.cam });
  game.rig.setTarget(m.root.position);
  game.rig.snap();
  return 'foot';
}

const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const covered = () => document.documentElement.classList.contains('mw-turn') || !!document.querySelector('.ms-cover');

/** Website, after a 'foot' arrival: once the turning page is gone she walks to the car (a path round the
 * buildings and trees) and hops in; the camera eases back to the car view on the way, as in the game. */
export async function walkToCar(game) {
  if (!game.keepWalk) return;
  try {
    for (let t = performance.now(); covered() && performance.now() - t < 6000;) await frame();
    await sleep(450);
    game.rig.setFollow(CAR_VIEW);
    const m = game.maya.root.position, car = game.car;
    car.root.updateMatrixWorld(true);
    const exit = car.exitPoint ? car.root.localToWorld(car.exitPoint.clone()) : car.root.position.clone();
    exit.y = 0;
    if (Math.hypot(exit.x - m.x, exit.z - m.z) > 1.2) {
      const { createWalker } = await import('./nav.js');
      const obs = await siteObstacles(game);
      const pad = 4;
      const bounds = { minX: Math.min(m.x, exit.x) - pad, maxX: Math.max(m.x, exit.x) + pad, minZ: Math.min(m.z, exit.z) - pad, maxZ: Math.max(m.z, exit.z) + pad };
      const near = obs.filter((o) => (o.type === 'circle' ? o.x > bounds.minX - 2 && o.x < bounds.maxX + 2 && o.z > bounds.minZ - 2 && o.z < bounds.maxZ + 2
        : !(o.maxX < bounds.minX - 1 || o.minX > bounds.maxX + 1 || o.maxZ < bounds.minZ - 1 || o.minZ > bounds.maxZ + 1)));
      // (the car's middle too: the last steps round it are main.js's carDetour)
      near.push({ type: 'circle', x: car.root.position.x, z: car.root.position.z, r: 1.0 });
      const w = createWalker({ bounds, obstacles: near, spawn: { x: m.x, z: m.z } });
      w.goTo(exit.x, exit.z);
      for (const p of (w.path || []).slice(1)) await game.walkWorld(new THREE.Vector3(p.x, 0, p.y));
    }
    await game.hopIn();
  } catch (err) {
    console.warn('keep place: walk to the car', err);
    game.worldWalk = null;
    seatInCar(game);
  } finally {
    game.keepWalk = false;
    game.busy = false;
  }
}

// ---- story mode
/** Story mode: the car at the spot (Maya in it), the land round it built, the save's place updated. */
export function placeStory(game, story, pose) {
  const foot = story.foot;
  if (foot?.active) {
    // (a page kept in the back-forward cache, left with her on foot: into the car at once, under the page)
    foot.walker.stop?.();
    foot.active = false;
    game.worldWalk = null;
    seatInCar(game);
  }
  game.rig.setFollow(CAR_VIEW);
  const ow = story.openWorld;
  if (ow?.jump) ow.jump(pose.car.x, pose.car.z, pose.car.h);
  else {
    game.world.drive.placeAt(pose.car.x, pose.car.z, pose.car.h);
    game.syncCar(0);
    game.rig.setTarget(game.car.root.position);
    game.rig.snap();
  }
  story.refreshHud?.();
  const p = game.car.root.position;
  if (story.save) {
    story.save.place = { mode: 'car', x: rd(p.x), z: rd(p.z), heading: rd(game.mayaHeading(), 3) };
    story.persist?.();
  }
}

/** A page back from the back-forward cache: the other mode's spot, under the page that is still turned. */
export async function restorePose(game, pose) {
  if (!validPose(pose) || !game?.world || game.mode !== 'world') return false;
  if (game.story) { placeStory(game, game.story, pose); return true; }
  if (game.busy || game.worldWalk) return false;
  const how = await placeSite(game, pose);
  if (how === 'foot') walkToCar(game);
  return true;
}
