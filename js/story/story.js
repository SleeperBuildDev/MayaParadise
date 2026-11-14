// The Reality Check story game, layered on top of the 3D site (index.html?story).
// main.js calls story.update(dt, t) every frame, story.updateFoot() while Maya walks outdoors,
// and story.onTap(x, y) first on every tap.
import * as THREE from '../game/three.js';
import { tr, lang } from '../game/ui.js';
import { createPerson } from './people.js';
import { CAST, castById } from './cast.js';
import { createFoot } from './onfoot.js';
import { createWalker } from '../game/nav.js';
import { loadSave, persist, resetSave } from './save.js';
import { createDialog } from './dialog.js';
import { loadDay } from './days.js';
import { installApi } from './api.js';
import { itemIcon } from './items.js'; // take, cargo, carry, steam, weather, soak, footprints, paint, scene… (days/INDEX.md 10)
import { createTalk } from './talk.js';
import { createOpenWorld } from './world/index.js';
import { LAZY as LAZY_TOWNS } from './world/region.js';
import { createDoors } from './doors.js';

const params = new URLSearchParams(location.search);
const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const TALK_R = 1.9; // metres: close enough to talk

export async function createStory(game) {
  document.getElementById('game').classList.add('story');
  injectStyle();
  const save = params.has('reset') ? resetSave() : loadSave();
  // no guiding: no route shimmer, no place dock
  game.world.setRoute = () => {};
  game.world.setRoute.call?.(null);
  game.ui.showDock?.(false);
  game.setWorldLabels = () => game.ui.setLabels([]);
  game.ui.setLabels([]);
  game.ui.setWhere(tr({ my: 'စာရွက်မြို့', en: 'Paper Town' }));
  // the site's idle hint says "tap a place and Maya drives there": no such hints in the story
  game.idleCheck = () => {};

  // ---- people living on the current page
  const people = new Map(); // id -> { p, home: {x,z,h}, talk() }
  const personObstacles = [];
  const v = new THREE.Vector3();

  const story = {
    game, save, people, talking: false,
    get footActive() { return foot.active; },
    dialog: null,
    foot: null,
    /** Put a townsperson on the map. at: { x, z, heading } */
    spawn(id, at) {
      const c = castById(id);
      if (!c || people.has(id)) return people.get(id);
      const p = createPerson(c.look);
      p.root.position.set(at.x, 0, at.z);
      p.root.rotation.y = at.heading ?? 0;
      p.root.userData.isPerson = true;
      game.world.scene.add(p.root);
      const ob = { type: 'circle', x: at.x, z: at.z, r: p.radius, person: id };
      personObstacles.push(ob); // (not in Maya's walk grid: she is nudged round people instead, so paths never jam on someone)
      const entry = { id, cast: c, p, home: { x: at.x, z: at.z, h: at.heading ?? 0 }, ob, onTalk: null, walking: null };
      people.set(id, entry);
      return entry;
    },
    remove(id) {
      const e = people.get(id);
      if (!e) return;
      game.world.scene.remove(e.p.root);
      e.p.dispose();
      personObstacles.splice(personObstacles.indexOf(e.ob), 1);
      people.delete(id);
    },
    /** Walk a townsperson to (x, z); resolves on arrival. */
    walkPerson(id, x, z, speed = 1.3) {
      const e = people.get(id);
      if (!e) return Promise.resolve();
      // a path around buildings and props (people do not walk through walls)
      // (the walk grid only covers this walk: the open world is far too big for one grid)
      const sx = e.p.root.position.x, sz = e.p.root.position.z, pad = 4;
      const bounds = { minX: Math.min(sx, x) - pad, maxX: Math.max(sx, x) + pad, minZ: Math.min(sz, z) - pad, maxZ: Math.max(sz, z) + pad };
      const area = { bounds, obstacles: foot.obstacles.filter((o) => !o.person && (o.type === 'circle' ? o.x > bounds.minX - 2 && o.x < bounds.maxX + 2 && o.z > bounds.minZ - 2 && o.z < bounds.maxZ + 2 : !(o.maxX < bounds.minX - 1 || o.minX > bounds.maxX + 1 || o.maxZ < bounds.minZ - 1 || o.minZ > bounds.maxZ + 1))), spawn: { x: sx, z: sz } };
      const nav = createWalker(area);
      return new Promise((done) => {
        e.walking = { x, z, speed, done, nav, arrived: false };
        nav.goTo(x, z, () => { e.walking.arrived = true; });
      });
    },
    // give / take / use and the rest of the day scripts' API: api.js (installApi, below)
    wait: (ms) => new Promise((r) => setTimeout(r, ms)),
    name(id) { return tr(castById(id)?.name || { my: 'မာရာ', en: 'Maya' }); },
    flag(k, val) { if (val === undefined) return save.flags[k]; save.flags[k] = val; persist(save); return val; },
    persist() { persist(save); },

    update(dt, t) {
      for (const e of people.values()) {
        if (e.ctl) { e.ctl(dt); continue; } // driven by a script (api.js carry partner)
        // walking somewhere (scripted)
        if (e.walking) {
          const w = e.walking;
          const sp = w.nav.update(dt, null, w.speed || 1.3);
          e.p.root.position.set(w.nav.pos.x, 0, w.nav.pos.y);
          if (sp > 0.1) turnToward(e.p.root, w.nav.heading, dt, 10);
          e.ob.x = e.p.root.position.x; e.ob.z = e.p.root.position.z;
          e.p.update(dt, { speed: sp });
          if (w.arrived) { e.walking = null; e.home.x = e.ob.x; e.home.z = e.ob.z; w.done(); }
          continue;
        }
        // daily life: roam their own patch and do their job (paused while Maya is close or a scene runs)
        const mpos = game.maya.root.getWorldPosition(v);
        const near = Math.hypot(mpos.x - e.p.root.position.x, mpos.z - e.p.root.position.z) < 2.8 && (foot.active || story.talking);
        if (e.job && !near && !story.talking && !e.paused) { lifeStep(e, dt); continue; }
        if (e.job && near && e.life?.mood) { e.p.setMood(e.baseMood ?? null); e.life.mood = null; e.life.state = 'idle'; e.life.t = 1 + Math.random() * 2; }
        // notice Maya when she comes close on foot
        const mp = game.maya.root.getWorldPosition(v);
        const d = Math.hypot(mp.x - e.p.root.position.x, mp.z - e.p.root.position.z);
        if (d < 4.5 && (foot.active || story.talking)) {
          // (story.talkGaze 'ahead': the one she talks with looks straight ahead, for a close-up of their face)
          if (e === story.talkWith && story.talkGaze === 'ahead') e.p.lookAt(null); else e.p.lookAt(v.set(mp.x, 1.0, mp.z));
          // (the one Maya is talking with keeps the three-quarter turn toward the camera that talkTo gave them)
          if (d < 2.6 && e !== story.talkWith) turnToward(e.p.root, Math.atan2(mp.x - e.p.root.position.x, mp.z - e.p.root.position.z), dt, 3);
        } else {
          e.p.lookAt(null);
          if (!story.talking) turnToward(e.p.root, e.home.h, dt, 1.5);
        }
        e.p.update(dt, { speed: 0 });
      }
      // people are soft: Maya slides round them instead of walking through
      if (foot.active) {
        const wp = foot.walker.pos;
        // (indoors, never shove her into the furniture: the room walker cannot step out of an overlap)
        const obs = story.inRoom ? foot.obstacles || [] : null;
        const hit = (x, z) => !!obs && obs.some((o) => (o.type === 'circle' ? Math.hypot(x - o.x, z - o.z) < o.r + 0.27
          : Math.hypot(x - Math.max(o.minX, Math.min(x, o.maxX)), z - Math.max(o.minZ, Math.min(z, o.maxZ))) < 0.27));
        for (const e of people.values()) {
          const dx = wp.x - e.ob.x, dz = wp.y - e.ob.z;
          const d = Math.hypot(dx, dz), min = e.ob.r + 0.28;
          if (d < min && d > 1e-4) {
            const k = (min - d) * Math.min(1, dt * 12), nx = wp.x + (dx / d) * k, nz = wp.y + (dz / d) * k;
            if (!hit(nx, wp.y)) wp.x = nx;
            if (!hit(wp.x, nz)) wp.y = nz;
          }
        }
      }
      story.day?.update?.(dt, t);
      for (const f of story.ticks || []) f(dt, t); // api.js: steam cups, rain, footprints, carry
      openWorld?.update(dt, t); // stream the land round her, desks, the map's gold ink
      // the round button always offers the other mode (a day or a test may switch with foot.toFoot() directly)
      if (story.hudFoot !== foot.active) { story.hudFoot = foot.active; story.refreshHud?.(); }
      // remember where she is, every couple of seconds
      saveT -= dt;
      if (saveT <= 0) { saveT = 2; rememberPlace(); }
    },
    updateFoot(dt, t) { foot.update(dt, t); },

    onTap(x, y) {
      if (story.talking) return true;
      for (const h of story.tapHooks || []) if (h(x, y)) return true; // api.js pickSpot
      const e = personAt(x, y);
      if (e) { story.approach(e); return true; }
      if (openWorld?.onTap(x, y)) return true; // a Bookmark Desk
      if (!foot.active) return false; // in the car: main.js handles taps (drive to a building)
      // on foot: walk to the tapped ground point
      const hit = groundAt(x, y);
      if (hit) {
        // tapping a door walks in
        for (const pl of game.world.places) {
          if (Math.hypot(hit.x - pl.door.x, hit.z - pl.door.z) < 1.6) { foot.walkTo(pl.door.x, pl.door.z + 0.9, () => story.enterOnFoot(pl.id)); return true; }
        }
        foot.walkTo(hit.x, hit.z);
      }
      return true;
    },

    /** Walk up to someone and talk (on foot), or tell the player to get out of the car first. */
    approach(e) {
      if (!foot.active) {
        game.ui.bark?.(tr({ my: 'ကားပေါ်ကဆင်းပြီးမှ စကားပြောလို့ရမယ်နော်။', en: "I'll hop out of the car to talk." }), { face: game.maya.faceCanvas('smile') });
        return;
      }
      const p = e.p.root.position;
      const mp = foot.pos;
      const d = Math.hypot(p.x - mp.x, p.z - mp.y);
      if (d <= TALK_R && Math.abs(p.z - mp.y) < 0.6) return story.talkTo(e);
      // stand beside them, east or west (whichever side she comes from): the camera then sees both faces
      walkBeside(e, () => story.talkTo(e));
    },

    async talkTo(e) {
      if (!e?.p?.root) return; // (a scene or test asked for someone who is not there)
      if (story.talking) return;
      const fn = e.onTalk || story.day?.talk?.[e.id];
      story.talking = true;
      foot.walker.stop();
      try {
        // too far apart for a two-shot (a scene called the talk from across the street): walk up first
        const gp = e.p.root.position;
        const gd = Math.hypot(gp.x - foot.pos.x, gp.z - foot.pos.y);
        if (foot.active && (gd > 2.4 || gd < 0.8)) { // (or so close they would overlap on screen)
          await new Promise((r) => { let done = false; const fin = () => { if (!done) { done = true; r(); } }; walkBeside(e, fin); setTimeout(fin, 9000); });
          foot.walker.stop();
        }
        story.talkWith = e;
        // face each other
        const mp = game.maya.root.position, pp = e.p.root.position;
        foot.walker.heading = Math.atan2(pp.x - mp.x, pp.z - mp.z);
        game.maya.root.rotation.set(0, foot.walker.heading, 0);
        e.p.root.rotation.y = Math.atan2(mp.x - pp.x, mp.z - pp.z);
        // two-shot: both faces in view, from whichever side has nothing in the way
        game.ui.cinema(true);
        const camAz = twoShot(mp, pp);
        // cheat both a little toward the camera (a three-quarter view, the way films stage a talk)
        const cheat = (h) => { let d = camAz - h; d = Math.atan2(Math.sin(d), Math.cos(d)); return h + d * 0.5; };
        foot.walker.heading = cheat(foot.walker.heading);
        game.maya.root.rotation.set(0, foot.walker.heading, 0);
        e.p.root.rotation.y = cheat(e.p.root.rotation.y);
        if (fn) await fn(e);
        else await story.dialog.say(e.id, e.cast.hello || { my: 'မင်္ဂလာပါ။', en: 'Hello.' });
      } finally {
        story.talking = false;
        story.talkWith = null;
        game.ui.cinema(false);
        game.rig.release();
      }
    },

    async enterOnFoot(id) {
      // into a building on foot: the room scene, as when arriving by car
      if (game.busy) return;
      foot.active = false;
      game.maya.root.position.set(foot.pos.x, 0, foot.pos.y);
      await game.enterPlace(id, { fromFoot: true });
    },
  };

  // Walk Maya up beside someone (east or west, whichever side she comes from: the camera then sees both
  // faces); if that spot can't be reached (a stall, a wall), the other side, then in front or behind.
  function walkBeside(e, done) {
    const p = e.p.root.position, mp = foot.pos;
    const sx = mp.x < p.x ? -1 : 1;
    const spots = [[sx * 1.15, 0.05], [-sx * 1.15, 0.05], [0, 1.15], [0, -1.15], [sx * 0.85, 0.8], [-sx * 0.85, 0.8]];
    const tryAt = (i) => {
      if (i >= spots.length) return done();
      foot.walkTo(p.x + spots[i][0], p.z + spots[i][1], (ok) => (ok === false ? tryAt(i + 1) : done()));
    };
    tryAt(0);
  }

  // Pick a camera for two people talking: across their line (so both faces show), the side nearer the
  // usual south camera first, raised if something stands in between.
  const camRay = new THREE.Raycaster();
  function twoShot(a, b) {
    const portrait = game.viewW < game.viewH;
    const mid = new THREE.Vector3((a.x + b.x) / 2, 0.75, (a.z + b.z) / 2);
    const across = Math.atan2(b.x - a.x, b.z - a.z);
    const sides = [across + Math.PI / 2, across - Math.PI / 2].sort((x, y) => Math.abs(Math.atan2(Math.sin(x), Math.cos(x))) - Math.abs(Math.atan2(Math.sin(y), Math.cos(y))));
    const dist = portrait ? 6.2 : 3.8;
    const cands = [];
    for (const h of [portrait ? 2.4 : 1.6, portrait ? 4.2 : 2.8]) for (const az of sides) for (const off of [0, 0.5, -0.5]) cands.push([az + off, h]);
    const blockers = game.scene.children.filter( // (game.scene: the room's, indoors)
      (o) => !o.userData.isPerson && o !== game.maya.root && o !== game.car.root);
    // only the faces must be clear: a car or a hedge across their legs is part of the street (the owner likes that look)
    const heads = [new THREE.Vector3(a.x, 0.95, a.z), new THREE.Vector3(b.x, 0.9, b.z)];
    const others = [...people.values()].map((e) => e.p?.root).filter((r) => r?.parent && r.visible
      && Math.hypot(r.position.x - a.x, r.position.z - a.z) > 0.45 && Math.hypot(r.position.x - b.x, r.position.z - b.z) > 0.45);
    const look = mid.clone().setY(0.62);
    // stay low and close, but back off far enough that both stand fully inside the frame (a narrow
    // portrait screen, or two people standing apart, needs more room)
    const fit = (az, h) => {
      const c = fitCam;
      c.fov = game.camera.fov; c.aspect = game.camera.aspect; c.updateProjectionMatrix();
      const rx = Math.cos(az), rz = -Math.sin(az);
      for (let d = dist; d < dist * 3; d += 0.3) {
        c.position.set(mid.x + Math.sin(az) * d, h, mid.z + Math.cos(az) * d);
        c.lookAt(look);
        c.updateMatrixWorld();
        let ok = true;
        for (const q of [a, b]) for (const y of [0.1, 1.3]) for (const s of [-0.42, 0.42]) {
          fitPt.set(q.x + rx * s, y, q.z + rz * s).project(c);
          if (Math.abs(fitPt.x) > 0.84) ok = false;
        }
        if (ok) return d;
      }
      return dist * 3;
    };
    let pick = cands[0], best = Infinity;
    for (const cand of cands) {
      const [az, h] = cand;
      const dd = (cand[2] = fit(az, h));
      const pos = new THREE.Vector3(mid.x + Math.sin(az) * dd, h, mid.z + Math.cos(az) * dd);
      let blocked = 0;
      for (const t of heads) {
        const dir = t.clone().sub(pos);
        const len = dir.length();
        camRay.set(pos, dir.normalize());
        camRay.far = len - 0.3;
        camRay.camera = game.camera; // a Sprite in the scene (a day's star, a glow) throws without it
        const hit = (r) => r.some((x) => !x.object.userData.isOutline && x.object.visible && !isMaya(x.object));
        if (hit(camRay.intersectObjects(blockers, true))) { blocked += 3; continue; }
        // and back from the face toward the lens: a camera inside a building sees only back faces (culled), so
        // only this way round finds the wall (Day 9: the bakery yard put the lens inside the bakery)
        camRay.set(t, dir.clone().negate());
        if (hit(camRay.intersectObjects(blockers, true))) blocked += 3;
      }
      // a third person standing in the near foreground of this frame (a head filling a corner) counts too
      if (others.length) {
        const c = fitCam;
        c.position.copy(pos); c.lookAt(look); c.updateMatrixWorld();
        const dMid = pos.distanceTo(mid);
        for (const o of others) {
          o.getWorldPosition(fitPt);
          if (fitPt.distanceTo(pos) > dMid - 0.6) continue;
          fitPt.y = 0.9;
          fitPt.project(c);
          if (Math.abs(fitPt.x) < 1.05 && Math.abs(fitPt.y) < 1.05) blocked += 2;
        }
      }
      if (blocked < best) { best = blocked; pick = cand; }
      if (!blocked) break;
    }
    const [az, h, dd] = pick;
    game.rig.shot(new THREE.Vector3(mid.x + Math.sin(az) * dd, h, mid.z + Math.cos(az) * dd), look, 0.7);
    return az; // the direction from the pair toward the camera
  }
  const fitCam = new THREE.PerspectiveCamera();
  const fitPt = new THREE.Vector3();

  function isMaya(o) { for (let q = o; q; q = q.parent) if (q === game.maya.root) return true; return false; }

  // ---- daily life: each person has a patch (area) and a job spot; they wander, work, and rest
  function lifeStep(e, dt) {
    const L = e.life || (e.life = { state: 'idle', t: Math.random() * 3, tx: 0, tz: 0, mood: null });
    const J = e.job;
    const pos = e.p.root.position;
    L.t -= dt;
    if (L.state === 'walk') {
      // a real path round the frame, trees and houses (each person keeps their own walk grid)
      const sp = e.nav.update(dt, null, J.speed || 0.9);
      const nx = e.nav.pos.x, nz = e.nav.pos.y;
      let bumped = false;
      for (const o of people.values()) if (o !== e && Math.hypot(nx - o.ob.x, nz - o.ob.z) < o.ob.r + e.ob.r - 0.05) bumped = true;
      if (bumped || L.t <= 0) { e.nav.stop(); e.nav.teleport(pos.x, pos.z); L.state = 'idle'; L.t = 0.8 + Math.random(); e.p.update(dt, { speed: 0 }); return; }
      pos.x = nx; pos.z = nz;
      e.ob.x = nx; e.ob.z = nz;
      if (sp > 0.1) turnToward(e.p.root, e.nav.heading, dt, 8);
      e.p.lookAt(null);
      e.p.update(dt, { speed: sp });
      if (L.arrived) {
        if (L.toJob) { L.state = 'work'; L.t = J.workFor ? J.workFor[0] + Math.random() * (J.workFor[1] - J.workFor[0]) : 6 + Math.random() * 8; L.mood = J.mood || 'work'; e.p.setMood(L.mood); }
        else { L.state = 'idle'; L.t = 1.5 + Math.random() * 3.5; }
      }
      return;
    }
    if (L.state === 'work') {
      if (J.spot) turnToward(e.p.root, J.spot.h ?? e.home.h, dt, 4);
      if (J.lookAt) e.p.lookAt(v.set(J.lookAt.x, 0.5, J.lookAt.z)); else e.p.lookAt(null);
      if (L.t <= 0) { e.p.setMood(e.baseMood ?? null); L.mood = null; L.state = 'idle'; L.t = 1 + Math.random() * 2; }
      e.p.update(dt, { speed: 0 });
      return;
    }
    // idle: look about a little, then pick the next thing to do
    e.p.lookAt(null);
    e.p.update(dt, { speed: 0 });
    if (L.t > 0) return;
    const goWork = J.spot && Math.random() < (J.workChance ?? 0.55);
    if (goWork) { L.tx = J.spot.x; L.tz = J.spot.z; L.toJob = true; }
    else {
      L.toJob = false;
      for (let k = 0; k < 8; k++) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * J.area.r;
        const x = J.area.x + Math.cos(a) * r, z = J.area.z + Math.sin(a) * r;
        if (!blockedAt(x, z, e) && clearLine(pos.x, pos.z, x, z, e)) { L.tx = x; L.tz = z; break; }
        L.tx = pos.x; L.tz = pos.z;
      }
    }
    L.state = 'walk';
    L.t = 20; // give up after a while if something is in the way
    L.arrived = false;
    e.nav.teleport(pos.x, pos.z, e.p.root.rotation.y);
    e.nav.goTo(L.tx, L.tz, () => { L.arrived = true; });
  }
  function blockedAt(x, z, self) {
    for (const o of foot.obstacles) {
      if (o.type === 'circle') { if (Math.hypot(x - o.x, z - o.z) < o.r + 0.22) return true; }
      else if (x > o.minX - 0.22 && x < o.maxX + 0.22 && z > o.minZ - 0.22 && z < o.maxZ + 0.22) return true;
    }
    for (const e of people.values()) if (e !== self && Math.hypot(x - e.ob.x, z - e.ob.z) < e.ob.r + self.ob.r) return true;
    const mp = game.maya.root.position;
    return foot.active && Math.hypot(x - mp.x, z - mp.z) < 0.6;
  }
  function clearLine(x0, z0, x1, z1, self) {
    const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.3);
    for (let i = 1; i <= n; i++) if (blockedAt(x0 + (x1 - x0) * (i / n), z0 + (z1 - z0) * (i / n), self)) return false;
    return true;
  }
  /** Give someone a daily life: { area: {x, z, r}, spot: {x, z, h}, mood: 'work'|'sweep'|'read'|'play', workChance, speed, lookAt } */
  story.setJob = (id, job) => {
    const e = people.get(id);
    if (!e) return;
    e.job = job;
    e.life = null;
    // walk grid limited to their own patch (plus the job spot): small, so it builds fast
    const pad = 1.5, xs = [job.area.x - job.area.r, job.area.x + job.area.r, job.spot?.x ?? job.area.x], zs = [job.area.z - job.area.r, job.area.z + job.area.r, job.spot?.z ?? job.area.z];
    const bounds = { minX: Math.min(...xs) - pad, maxX: Math.max(...xs) + pad, minZ: Math.min(...zs) - pad, maxZ: Math.max(...zs) + pad };
    const obs = foot.obstacles.filter((o) => o.type === 'circle' ? o.x > bounds.minX - 2 && o.x < bounds.maxX + 2 && o.z > bounds.minZ - 2 && o.z < bounds.maxZ + 2 : !(o.maxX < bounds.minX - 1 || o.minX > bounds.maxX + 1 || o.maxZ < bounds.minZ - 1 || o.minZ > bounds.maxZ + 1));
    e.nav = createWalker({ bounds, obstacles: obs, spawn: { x: e.p.root.position.x, z: e.p.root.position.z } });
  };

  let saveT = 2;
  function rememberPlace() {
    if (story.inRoom) return; // inside: doors.js keeps the door she came in by
    const p = foot.active ? game.maya.root.position : game.car.root.position;
    save.place = { mode: foot.active ? 'foot' : 'car', x: +p.x.toFixed(2), z: +p.z.toFixed(2), heading: +game.mayaHeading().toFixed(3) };
    persist(save);
  }

  function turnToward(obj, h, dt, rate) {
    let d = h - obj.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    obj.rotation.y += d * (1 - Math.exp(-dt * rate));
  }
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function groundAt(x, y) {
    ndc.set((x / game.viewW) * 2 - 1, -(y / game.viewH) * 2 + 1);
    ray.setFromCamera(ndc, game.camera);
    return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
  }
  function personAt(x, y) {
    let best = null, bd = 48;
    for (const e of people.values()) {
      for (const hgt of [0.4, e.p.height * 0.75]) {
        const q = game.rig.project(v.set(e.p.root.position.x, hgt, e.p.root.position.z), game.viewW, game.viewH);
        if (q) { const d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = e; } }
      }
    }
    return best;
  }

  // ---- the open world south of the book (streamed chunks, desks, map), then walking and the car/foot button
  let openWorld = null;
  try { openWorld = await createOpenWorld(game, story); } catch (err) { console.error('open world', err); }
  story.openWorld = openWorld;
  const foot = createFoot(game, { open: openWorld });
  story.foot = foot;
  story.dialog = createDialog(game, story);
  story.talk = createTalk(game, story, { twoShot }); // the turn-based talk (talk.js)
  story.twoShot = twoShot; // (a day may frame a scripted exchange the same way: story.twoShot(mayaPos, theirPos) -> azimuth)
  try { story.doors = await createDoors(game, story); } catch (err) { console.error('doors', err); } // walk-in rooms (doors.js)
  const modeBtn = document.createElement('button');
  modeBtn.type = 'button';
  modeBtn.id = 'story-mode';
  modeBtn.className = 'story-round';
  const setModeIcon = () => {
    modeBtn.innerHTML = foot.active
      ? `<span class="ico">🚗</span><small>${tr({ my: 'ကားစီးမယ်', en: 'Drive' })}</small>`
      : `<span class="ico">🚶‍♀️</span><small>${tr({ my: 'လမ်းလျှောက်မယ်', en: 'Walk' })}</small>`;
  };
  modeBtn.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    if (story.talking || game.mode !== 'world') return;
    await foot.toggle();
    setModeIcon();
    rememberPlace();
  });
  document.getElementById('game').appendChild(modeBtn);
  // the bag (and, later, the notebook)
  const bagBtn = document.createElement('button');
  bagBtn.type = 'button';
  bagBtn.id = 'story-bag';
  bagBtn.className = 'story-round small';
  bagBtn.innerHTML = `<span class="ico svg">${itemIcon('bag')}</span>`;
  bagBtn.setAttribute('aria-label', 'အိတ် / Bag');
  bagBtn.addEventListener('click', (ev) => { ev.stopPropagation(); story.openBag(); });
  document.getElementById('game').appendChild(bagBtn);
  // (the bag panel: api.js story.openBag, items, companions and the stamp margin)
  setModeIcon();
  story.refreshHud = setModeIcon;
  // the Home Book's floating gold stars (and the big one on the Post Office tower) read as "come here"
  // pins: story mode never points the way, so they go (like main.js's pad rings)
  game.world?.scene?.getObjectByName('sparkles')?.removeFromParent();
  installApi(story, game, { groundAt, bagBtn });
  import('./extras-sound.js').then(({ installSound }) => installSound(game, story, openWorld)).catch((e) => console.error('extras sound', e)); // town sound + songs (replaces the site's music)
  document.addEventListener('mw:lang', setModeIcon);
  // keyboard: F switches, E / Enter talks to whoever is close
  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.target.closest?.('input, textarea')) return;
    if (e.code === 'KeyF' && !story.talking && game.mode === 'world') { foot.toggle().then(setModeIcon); }
    if ((e.code === 'KeyE' || e.code === 'Enter') && foot.active && !story.talking && !game.ui.dialogOpen) {
      const near = nearestPerson();
      if (near) story.talkTo(near);
    }
  });
  function nearestPerson() {
    let best = null, bd = TALK_R;
    for (const e of people.values()) {
      const d = Math.hypot(e.p.root.position.x - foot.pos.x, e.p.root.position.z - foot.pos.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  // the room's "go outside" returns her on foot in story mode
  const exitRoom = game.exitRoom.bind(game);
  game.exitRoom = async (...a) => {
    await exitRoom(...a);
    if (game.mode === 'world' && !foot.active) setModeIcon();
  };

  // ---- today's page
  // (?day=N jumps to a page for testing: the save moves there)
  const askDay = +params.get('day');
  if (askDay >= 1 && askDay <= 15 && askDay !== save.day) { save.day = askDay; save.dayDone = false; persist(save); }
  // lazy towns (?lazy=1, world/townloader.js): the other towns come in the background from here on
  const townLoader = LAZY_TOWNS && openWorld ? import('./world/townloader.js').then((m) => m.installTownLoader(game, story)).catch((err) => { console.error('town loader', err); return null; }) : null;
  const mod = await loadDay(save.day);
  story.day = mod ? await mod.create(story) : null;
  if (!mod) setTimeout(() => story.notWritten?.(save.day), 1500);
  game.story = story; // main.js needs it from the first frame of the opening scene
  window.__story = story;
  if (params.get('foot') === '1') { await foot.toFoot(); setModeIcon(); }
  // a game saved out on the land resumes where she was (the book's own scenes stage themselves)
  const sp = save.place;
  if (openWorld && sp && sp.z > 19.5 && !params.has('reset')) {
    try {
      openWorld.jump(sp.x, sp.z, sp.heading || 0);
      if (sp.mode === 'foot' && !foot.active) { await foot.toFoot(); setModeIcon(); }
    } catch (err) { console.error('resume place', err); }
  }
  import('./extras-ui.js').then(({ installUI }) => installUI(game, story, openWorld)).catch((e) => console.error('extras ui', e)); // corner map + town intros
  // (lazy towns: the houses, chatter and Ko Hein Htet read the whole land once, so they wait for every town)
  const whole = () => (townLoader ? townLoader.then((tl) => tl?.extras()) : Promise.resolve());
  whole().then(() => import('./extras-houses.js')).then(({ installHouses }) => installHouses(game, story)).catch((e) => console.error('extras houses', e)); // everyday houses to walk into
  whole().then(() => import('./extras-chatter.js')).then(({ installChatter }) => installChatter(game, story, openWorld)).catch((e) => console.error('extras chatter', e)); // town chatter, small talk, ambient folk
  whole().then(() => import('./extras-heinhtet.js')).then(({ installHeinHtet }) => installHeinHtet(game, story, openWorld)).catch((e) => console.error('extras heinhtet', e)); // Ko Hein Htet, the man in the red suit who is always running
  // the day's opening runs on its own (it waits for the player's taps)
  Promise.resolve().then(() => story.day?.start?.()).then(setModeIcon).catch((e) => console.error('story start', e));
  void CAST; void lang;
  return story;
}

function injectStyle() {
  if (document.getElementById('story-style')) return;
  const s = document.createElement('style');
  s.id = 'story-style';
  s.textContent = `
  #game.story #dock { display: none !important; }
  .story-round { position: absolute; right: 14px; bottom: calc(18px + env(safe-area-inset-bottom)); z-index: 30; width: 74px; height: 74px;
    border-radius: 50%; border: 3px solid #A47A2C; background: #F6F0E2; color: #2A2118; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 0; box-shadow: 0 4px 0 #8C6A28, 0 8px 18px rgba(59,42,26,.25); cursor: pointer; padding: 0; }
  .story-round .ico { font-size: 28px; line-height: 1.1; }
  .story-round small { font: 700 10.5px/1.5 "Noto Sans Myanmar", system-ui, sans-serif; }
  .story-round:active { transform: translateY(3px); box-shadow: 0 1px 0 #8C6A28; }
  #game.cinema .story-round, #game.talking .story-round, #game.choosing .story-round { opacity: 0; pointer-events: none; }
  #story-fade { position: absolute; inset: 0; background: #F6F0E2; opacity: 0; pointer-events: none; transition: opacity .25s; z-index: 40; }
  #story-fade.on { opacity: 1; }
  #story-choices { position: absolute; left: 50%; transform: translateX(-50%); bottom: calc(150px + env(safe-area-inset-bottom)); z-index: 36;
    display: flex; flex-direction: column; gap: 8px; width: min(92vw, 460px); }
  #story-choices button { font: 600 15px/1.65 "Noto Sans Myanmar", system-ui, sans-serif; text-align: left; padding: 10px 14px; border-radius: 14px;
    border: 2px solid #A47A2C; background: #FFFDF8; color: #2A2118; box-shadow: 0 3px 0 #C9A24A; }
  #story-choices button:active { transform: translateY(2px); box-shadow: 0 1px 0 #C9A24A; }
  #game.story .dialog-name { color: #6E1F2A; }
  .story-round.small { width: 56px; height: 56px; left: 14px; right: auto; }
  .story-round.small .ico { font-size: 24px; }
  .story-round .ico.svg { display: inline-flex; width: 32px; height: 32px; } .story-round .ico.svg svg { width: 100%; height: 100%; }
  .story-round.pulse { animation: rcpulse .4s ease 2; }
  @keyframes rcpulse { 50% { transform: scale(1.15); } }
  #game.acting .story-round, #game.cinema #story-bag, #game.talking #story-bag, #game.choosing #story-bag { opacity: 0; pointer-events: none; }
  .story-got { position: absolute; left: 50%; top: 84px; transform: translateX(-50%); z-index: 45; display: flex; gap: 10px; align-items: center;
    background: #FFFDF8; border: 2px solid #C9A24A; border-radius: 16px; padding: 8px 16px; box-shadow: 0 6px 18px rgba(59,42,26,.2);
    font: 14px/1.6 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; animation: rcin .35s ease; transition: opacity .5s, transform .5s; white-space: nowrap; }
  .story-got .ico { font-size: 28px; } .story-got small { display: block; color: #8C6A28; } .story-got.out { opacity: 0; transform: translate(-50%, -12px); }
  @keyframes rcin { from { opacity: 0; transform: translate(-50%, 12px); } }
  #story-panel { position: absolute; inset: 0; z-index: 50; background: rgba(42,33,24,.35); display: flex; align-items: flex-end; justify-content: center; }
  #story-panel .panel-card { width: min(100%, 480px); max-height: 72vh; overflow: auto; background: #F6F0E2; border-radius: 22px 22px 0 0; padding: 14px 16px 28px;
    font: 14px/1.65 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; border-top: 3px solid #C9A24A; }
  #story-panel header { display: flex; justify-content: space-between; align-items: center; font-size: 17px; color: #6E1F2A; }
  #story-panel .x { border: 0; background: none; font-size: 20px; color: #6E1F2A; }
  #story-panel ul { list-style: none; padding: 0; margin: 10px 0; display: grid; gap: 8px; }
  #story-panel li { display: flex; gap: 12px; align-items: center; background: #FFFDF8; border: 1px solid #E2D5B8; border-radius: 14px; padding: 8px 12px; }
  #story-panel li .ico { font-size: 26px; } #story-panel li small { display: block; color: #6A5A48; } #story-panel li.empty { color: #8C6A28; }
  #story-panel .stamps { color: #8C6A28; text-align: center; }
  .act-wrap { position: absolute; inset: 0; z-index: 44; display: flex; align-items: center; justify-content: center; background: rgba(42,33,24,.25); }
  .act-card { background: #F6F0E2; border: 3px solid #C9A24A; border-radius: 20px; padding: 12px 14px; box-shadow: 0 10px 30px rgba(59,42,26,.3);
    font: 14px/1.65 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; text-align: center; }
  .act-title { margin: 0; font-weight: 700; color: #6E1F2A; font-size: 16px; } .act-hint { margin: 0 0 8px; color: #6A5A48; }
  .act-card canvas { display: block; margin: 0 auto; touch-action: none; }
  .act-meta { display: flex; justify-content: space-between; margin-top: 6px; color: #8C6A28; font-weight: 700; }
  .act-score.good { color: #4F7F43; font-size: 20px; } .act-score.again { color: #A47A2C; font-size: 20px; }
  .story-stamp { position: absolute; inset: 0; z-index: 48; display: flex; align-items: center; justify-content: center; background: rgba(246,240,226,.94); flex-direction: column;
    font: 15px/1.7 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; text-align: center; padding: 24px; gap: 14px; }
  .story-stamp .seal { width: 160px; height: 160px; border-radius: 50%; border: 6px double #6E1F2A; color: #6E1F2A; display: flex; flex-direction: column; align-items: center;
    justify-content: center; transform: rotate(-12deg); animation: rcstamp .45s cubic-bezier(.2,1.6,.4,1); font-weight: 700; }
  .story-stamp .seal b { font-size: 44px; line-height: 1.2; } .story-stamp p { max-width: 320px; margin: 0; }
  .story-stamp button { font: 700 15px/1.6 "Noto Sans Myanmar", system-ui, sans-serif; padding: 9px 22px; border-radius: 999px; border: 2px solid #A47A2C; background: #FFFDF8; color: #6E1F2A; }
  .story-letter { position: absolute; inset: 0; z-index: 46; display: flex; align-items: center; justify-content: center; background: rgba(42,33,24,.35); }
  .story-letter .paper { width: min(86vw, 360px); background: #FFFDF8; border-radius: 6px; padding: 26px 22px; transform: rotate(-1.5deg);
    font: 16px/1.9 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; box-shadow: 0 12px 30px rgba(42,33,24,.35);
    background-image: repeating-linear-gradient(transparent 0 29px, #DCE6EE 29px 30px); }
  .story-letter small { display: block; text-align: right; color: #8C6A28; margin-top: 10px; }
  `;
  document.head.appendChild(s);
}
