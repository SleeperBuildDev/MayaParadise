// A little flock of birds on the roads (one at a time: pigeons, sparrows, mynas or white doves) hops
// about and pecks at the gold ink. Every visit it sits somewhere different: the flock picks a random stretch of
// road (away from the stops, from each other and from the car). When the car (or Maya on foot)
// comes close they burst up with a flutter and a chirp, circle overhead, and once the car has gone
// they settle on another random stretch of road nearby. Now and then a flock far from the car
// gets up by itself and moves to a new spot, so the roads never look the same twice.
//
//   const birds = createRoadBirds(world, { low })
//   birds.update(dt, t, { x, z, speed })   once per frame (x, z: the car or Maya; speed in m/s)
//   birds.onScatter = (flock, x, y, z) => {}   a flock took off; (x, y, z) = where the birds are
//   birds.onNear = (flock) => {}          a flock is on the road just ahead of the car
//   birds.onChirp = (kind) => {}          an idle chirp while the car is near ('chirp')
//   birds.flocks                          [{ x, z, kind, state }] for tests
//   birds.dispose()
//
// One instanced unit box (6 parts per bird), the toon material and outline the doves use.
import * as THREE from '../three.js';
import { toon, addOutline } from '../toon.js';
import { pointAt, tangentAt } from './roads.js';

const KINDS = {
  pigeon: { body: '#B7B3C8', head: '#7E7A99', wing: '#9D99B4', tail: '#6C6884', beak: '#E3BE7C', legs: '#D9837A', size: 1.7 },
  sparrow: { body: '#B98C60', head: '#7A5236', wing: '#93653F', tail: '#664630', beak: '#3B2A20', legs: '#A0785A', size: 1.4 },
  myna: { body: '#6E4C3B', head: '#2B2321', wing: '#4D3529', tail: '#2B2321', beak: '#F2C14E', legs: '#F2C14E', size: 1.55 },
  dove: { body: '#FFFDF8', head: '#FFF6E6', wing: '#EFE1C6', tail: '#E2D2B4', beak: '#E9A07A', legs: '#E9A07A', size: 1.6 },
};
const PARTS = 8; // body, head, beak, tail, wing L, wing R, leg L, leg R
const SCARE = 4; // metres (plus a little more at speed)
const CALM = 9; // the car must be this far away before they come back down
const NEAR_AHEAD = 11; // "birds ahead!" distance
const SLOT_GAP = 0.7; // birds of one flock stand at least this far apart
const HOP_R = 0.15; // and only hop this far from their own slot (so they never walk into each other)
const PAD_CLEAR = 4; // never settle this close to a stop's pad
const APART = 6; // flocks keep at least this far from each other
const CAR_CLEAR = 12; // a flock settles at least this far from the car
const WANDER = [30, 80]; // seconds before a quiet flock may move by itself
const WANDER_CAR = 14; // ... but only while the car is at least this far away

// scratch (no allocation per frame)
const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _qp = new THREE.Quaternion();
const _s = new THREE.Vector3(), _m = new THREE.Matrix4(), _e = new THREE.Euler(), _o = new THREE.Vector3();
const _t = { x: 0, z: 0 };

export function createRoadBirds(world, { low = false } = {}) {
  const net = world.net;
  const pads = world.places.map((p) => p.pad);

  // ---- where the flocks sit: anywhere on the roads, picked at random (weighted by road length)
  const rnd = Math.random;
  const roads = net.edges.filter((e) => e.length > 3);
  const total = roads.reduce((a, e) => a + e.length, 0);
  const flocks = [];
  const birds = [];
  /**
   * A random spot on the road for flock `self`: clear of the stops and the other flocks, at least
   * `carClear` m from (cx, cz), and (when maxFrom is given) within maxFrom m of the flock's
   * current spot so it flies somewhere you can follow. null when nothing fits after 80 tries.
   */
  function pickSpot(self, cx, cz, carClear, maxFrom = 0) {
    if (!roads.length) return null;
    for (let tries = 0; tries < 80; tries++) {
      let r = rnd() * total, e = roads[roads.length - 1];
      for (const c of roads) { r -= c.length; if (r <= 0) { e = c; break; } }
      const s = 1 + rnd() * Math.max(0.01, e.length - 2);
      pointAt(e, s, _p);
      const x = _p.x, z = _p.z;
      if (pads.some((pd) => Math.hypot(pd.x - x, pd.z - z) < PAD_CLEAR)) continue;
      if (flocks.some((o) => o !== self && Math.hypot(o.x - x, o.z - z) < APART)) continue;
      if (Math.hypot(cx - x, cz - z) < carClear) continue;
      if (self && maxFrom && Math.hypot(self.x - x, self.z - z) > maxFrom) continue;
      if (self && maxFrom && Math.hypot(self.x - x, self.z - z) < 3) continue; // really move
      tangentAt(e, s, _t);
      return { x, y: _p.y, z, tx: _t.x, tz: _t.z };
    }
    return null;
  }
  /** Moves a flock's home to spot `sp`: every bird gets its own slot on the road around it. */
  function setHome(f, sp) {
    f.x = sp.x; f.y = sp.y; f.z = sp.z;
    f.members.forEach((b, k) => {
      // the road is 2.4 m wide: stay within 0.75 m of the centre line, and keep clear of the birds
      // already placed (a few tries; 4-5 birds fit easily at this spacing)
      let hx = sp.x, hz = sp.z;
      for (let tries = 0; tries < 20; tries++) {
        const along = (rnd() - 0.5) * 2.2, across = (rnd() - 0.5) * 1.5;
        hx = sp.x + sp.tx * along - sp.tz * across;
        hz = sp.z + sp.tz * along + sp.tx * across;
        let clear = true;
        for (let j = 0; j < k; j++) if (Math.hypot(f.members[j].hx - hx, f.members[j].hz - hz) < SLOT_GAP) { clear = false; break; }
        if (clear) break;
      }
      b.hx = hx; b.hz = hz;
      b.gy = sp.y;
    });
  }

  // ---- the flocks: a random mix of kinds, each on its own random spot
  const want = 1; // one flock at a time (owner request: more felt crowded)
  const kinds = Object.keys(KINDS).sort(() => rnd() - 0.5);
  for (let fi = 0; fi < want; fi++) {
    const sp = pickSpot(null, 1e9, 1e9, 0);
    if (!sp) break;
    const kind = kinds[fi % kinds.length];
    const n = (low ? 3 : 4) + (rnd() < 0.5 ? 1 : 0);
    const flock = { x: sp.x, z: sp.z, y: sp.y, kind, state: 'ground', calmT: 0, nearSaid: false, members: [], wanderT: WANDER[0] + rnd() * (WANDER[1] - WANDER[0]) };
    for (let i = 0; i < n; i++) {
      const b = {
        flock, kind: KINDS[kind], i: birds.length,
        hx: sp.x, hz: sp.z, x: sp.x, y: sp.y, z: sp.z, gy: sp.y, vx: 0, vy: 0, vz: 0,
        yaw: rnd() * Math.PI * 2, pitch: 0, bank: 0,
        mode: 0, // 0 ground, 1 flying, 2 landing
        hopT: rnd() * 2, hop: 0, hopFrom: [0, 0], hopTo: [0, 0],
        peckT: 1 + rnd() * 3, peck: 0,
        turnT: rnd() * 3,
        flap: rnd() * 6, open: 0,
        delay: 0, flyT: 0,
        orbit: rnd() * Math.PI * 2, orbitR: 2.6 + rnd() * 2, orbitH: 3.4 + rnd() * 2, orbitW: (rnd() < 0.5 ? -1 : 1) * (0.7 + rnd() * 0.3),
        size: KINDS[kind].size * (0.92 + rnd() * 0.16),
      };
      flock.members.push(b);
      birds.push(b);
    }
    setHome(flock, sp);
    for (const b of flock.members) { b.x = b.hx; b.z = b.hz; }
    flocks.push(flock);
  }

  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), toon('#FFFFFF'), Math.max(1, birds.length * PARTS));
  mesh.name = 'roadBirds';
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true; // added after the scene's shadows were set up, so mark it here
  const col = new THREE.Color();
  for (const b of birds) {
    const k = b.kind;
    [k.body, k.head, k.beak, k.tail, k.wing, k.wing, k.legs, k.legs].forEach((c, j) => mesh.setColorAt(b.i * PARTS + j, col.set(c)));
  }
  (world.scene.getObjectByName('world') || world.scene).add(mesh);
  addOutline(mesh, { px: 1.1 });

  /** One part of a bird: a box at local offset (x, y, z) with local rotation (rx, ry, rz) and size. */
  function put(j, b, x, y, z, rx, ry, rz, w, h, d) {
    const k = b.size;
    _o.set(x * k, y * k, z * k).applyQuaternion(_qb);
    _p.set(b.x + _o.x, b.y + _o.y, b.z + _o.z);
    _qp.setFromEuler(_e.set(rx, ry, rz, 'XYZ'));
    _q.copy(_qb).multiply(_qp);
    mesh.setMatrixAt(b.i * PARTS + j, _m.compose(_p, _q, _s.set(w * k, h * k, d * k)));
  }
  /** A wing hinged at the shoulder (side = +1 left, -1 right): roll lifts it, open spreads it. */
  function wing(j, b, side, roll) {
    if (b.open < 0.05) { // folded: a panel hugging the side of the body
      put(j, b, side * 0.093, 0.165, -0.03, b.mode === 0 ? -0.22 + b.peck * 0.25 : 0, 0, 0, 0.025, 0.1, 0.22);
      return;
    }
    const len = 0.07 + 0.2 * b.open;
    const cx = side * (0.08 + (len / 2) * Math.cos(roll)), cy = 0.19 + (len / 2) * Math.sin(roll);
    const fold = (1 - b.open);
    put(j, b, cx, cy - fold * 0.02, -0.02 - fold * 0.03, 0, 0, side * roll, len, 0.03, 0.2 - fold * 0.02);
  }

  function draw(b, t) {
    _qb.setFromEuler(_e.set(b.pitch, b.yaw, b.bank, 'YXZ'));
    const ground = b.mode === 0 || (b.mode === 2 && b.delay > 0); // standing (also while waiting to take off)
    const bob = ground ? Math.abs(Math.sin(t * 3 + b.i)) * 0.006 : 0;
    const peck = b.peck; // 0..1 head down
    // chest up on the ground, level in the air
    put(0, b, 0, 0.15 + bob, 0, ground ? -0.22 + peck * 0.25 : 0, 0, 0, 0.18, 0.15, 0.27); // body
    const hy = 0.27 - peck * 0.15 + bob, hz = 0.13 + peck * 0.06;
    put(1, b, 0, hy, hz, peck * 0.6, 0, 0, 0.12, 0.12, 0.12); // head
    put(2, b, 0, hy - 0.012 - peck * 0.035, hz + 0.08, peck * 0.6, 0, 0, 0.04, 0.032, 0.06); // beak
    put(3, b, 0, ground ? 0.13 + bob : 0.15, -0.17, ground ? -0.3 : 0.05, 0, 0, 0.1, 0.03, 0.1); // tail
    // legs: standing, tucked in flight
    const leg = ground ? 0.08 : 0.03;
    put(6, b, 0.045, 0.07 - leg / 2 + (ground ? 0 : 0.03), 0.01, 0, 0, 0, 0.025, leg, 0.025);
    put(7, b, -0.045, 0.07 - leg / 2 + (ground ? 0 : 0.03), 0.01, 0, 0, 0, 0.025, leg, 0.025);
    let roll;
    if (b.open < 0.05) roll = -0.5; // folded along the sides
    else roll = -0.5 * (1 - b.open) + b.open * (0.15 + 0.85 * Math.sin(b.flap));
    wing(4, b, 1, roll);
    wing(5, b, -1, roll);
  }

  const api = {
    flocks,
    onScatter: null,
    onNear: null,
    onChirp: null,
    mesh,
    update,
    /** Debug: scare flock i (or all). */
    scare(i = -1) { flocks.forEach((f, k) => { if (i < 0 || k === i) scatter(f, f.x + 1, f.z + 1, 0); }); },
    /** Debug: flock i (or all) moves to a new random spot now, as if the car were at (cx, cz). */
    wander(i = -1, cx = 1e9, cz = 1e9) { flocks.forEach((f, k) => { if ((i < 0 || k === i) && f.state === 'ground') settle(f, cx, cz, true); }); },
    dispose() {
      mesh.parent?.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh.dispose();
    },
  };

  function scatter(f, sx, sz, speed) {
    f.state = 'air';
    f.calmT = 0;
    for (const b of f.members) {
      b.mode = 1;
      b.delay = rnd() * 0.22; // not all at once
      b.flyT = 0;
      // burst away from the car, a bit to the side, and up
      let ax = b.x - sx, az = b.z - sz;
      const l = Math.hypot(ax, az) || 1;
      ax /= l; az /= l;
      const side = rnd() < 0.5 ? -1 : 1;
      const v = 2.6 + rnd() * 1.4 + Math.min(3, Math.abs(speed) * 0.25);
      b.vx = (ax - az * side * 0.6) * v;
      b.vz = (az + ax * side * 0.6) * v;
      b.vy = 3.6 + rnd() * 1.4;
      b.orbit = Math.atan2(b.z - f.z, b.x - f.x);
      b.peck = 0;
      b.hop = 0; // a hop in progress must not resume after landing somewhere else
    }
    // where the birds actually are (a flock flying to a new spot is far from its home)
    let mx = 0, my = 0, mz = 0;
    for (const b of f.members) { mx += b.x; my += b.y; mz += b.z; }
    const n = f.members.length || 1;
    api.onScatter?.(f, mx / n, my / n, mz / n);
  }

  /**
   * The flock heads for a new random spot on the road: nearby if it can (so you can watch them go),
   * anywhere clear of the car otherwise, or back to the old spot if the roads are all taken.
   * quiet = it was not scared: the birds get up one by one and fly over low.
   */
  function settle(f, cx, cz, quiet) {
    const sp = pickSpot(f, cx, cz, CAR_CLEAR, 22) || pickSpot(f, cx, cz, CAR_CLEAR);
    if (sp) setHome(f, sp);
    f.state = 'landing';
    f.wanderT = WANDER[0] + rnd() * (WANDER[1] - WANDER[0]);
    for (const b of f.members) {
      if (b.mode === 0) {
        // getting up from the road: a little hop into the air, staggered
        b.delay = quiet ? rnd() * 0.8 : 0;
        b.vy = 2.2 + rnd() * 0.8;
        b.vx = b.vz = 0;
        b.peck = 0;
        b.hop = 0;
      }
      b.mode = 2;
    }
  }

  let chirpT = 3;
  let placed = false;
  function update(dt, t, who) {
    const cx = who?.x ?? 1e9, cz = who?.z ?? 1e9, speed = who?.speed ?? 0, heading = who?.heading;
    // the first time we know where the car starts: a flock sitting right there moves away quietly
    // (otherwise it would fly off the moment the game begins)
    if (!placed && who) {
      placed = true;
      for (const f of flocks) {
        if (f.state !== 'ground' || Math.hypot(f.x - cx, f.z - cz) >= CAR_CLEAR) continue;
        const sp = pickSpot(f, cx, cz, CAR_CLEAR);
        if (!sp) continue;
        setHome(f, sp);
        for (const b of f.members) { b.x = b.hx; b.z = b.hz; b.y = b.gy; b.hop = 0; }
      }
    }
    let nearest = Infinity;
    for (const f of flocks) {
      const d = Math.hypot(f.x - cx, f.z - cz);
      if (f.state === 'ground') {
        nearest = Math.min(nearest, d);
        const reach = SCARE + Math.min(2.5, Math.abs(speed) * 0.22);
        // any bird of the flock within reach takes the whole flock up
        let close = d < reach + 1.2 && f.members.some((b) => Math.hypot(b.x - cx, b.z - cz) < reach);
        if (close && (Math.abs(speed) > 0.3 || d < 1.6)) scatter(f, cx, cz, speed);
        else if (!f.nearSaid && heading !== undefined && Math.abs(speed) > 1 && d < NEAR_AHEAD && d > reach + 1) {
          // straight ahead of the car?
          const fx = Math.sin(heading), fz = Math.cos(heading);
          const ahead = ((f.x - cx) * fx + (f.z - cz) * fz) / d;
          if (ahead > 0.85 && speed > 0) { f.nearSaid = true; api.onNear?.(f); }
        }
        if (d > 25) f.nearSaid = false;
        // a quiet flock far from the car sometimes moves to another spot by itself
        if (f.state === 'ground') {
          f.wanderT -= dt;
          if (f.wanderT <= 0) {
            if (d > WANDER_CAR) settle(f, cx, cz, true);
            else f.wanderT = 5 + rnd() * 10;
          }
        }
      } else if (f.state === 'air') {
        f.calmT = d > CALM ? f.calmT + dt : 0;
        if (f.calmT > 3.5) settle(f, cx, cz, false);
      } else if (f.state === 'landing') {
        // the car came by again: up they go (measured from the birds, which may still be far
        // from their new spot)
        if (Math.abs(speed) > 0.3 && f.members.some((b) => Math.hypot(b.x - cx, b.z - cz) < SCARE + 1.5)) scatter(f, cx, cz, speed);
        else if (f.members.every((b) => b.mode === 0)) { f.state = 'ground'; f.nearSaid = d < NEAR_AHEAD; }
      }
    }
    // little chirps while the car is near a flock on the ground
    chirpT -= dt;
    if (chirpT <= 0) {
      chirpT = 2.2 + Math.random() * 3.5;
      if (nearest < 12) api.onChirp?.('chirp');
    }

    for (const b of birds) {
      if (b.mode === 0) groundStep(b, dt, t);
      else if (b.mode === 1) flyStep(b, dt, t);
      else landStep(b, dt, t);
      draw(b, t);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  function groundStep(b, dt) {
    b.open = Math.max(0, b.open - dt * 4);
    b.pitch *= 0.85;
    b.bank *= 0.85;
    b.y = b.gy;
    if (b.hop > 0) {
      // a little hop: 0.28 s along a low arc
      b.hop = Math.min(1, b.hop + dt / 0.28);
      const u = b.hop;
      b.x = b.hopFrom[0] + (b.hopTo[0] - b.hopFrom[0]) * u;
      b.z = b.hopFrom[1] + (b.hopTo[1] - b.hopFrom[1]) * u;
      b.y = b.gy + Math.sin(u * Math.PI) * 0.09;
      if (u >= 1) b.hop = 0;
      return;
    }
    b.hopT -= dt;
    b.peckT -= dt;
    b.turnT -= dt;
    if (b.peck > 0) {
      b.peck = Math.max(0, b.peck - dt * 3.2);
    }
    if (b.peckT <= 0) {
      b.peckT = 0.6 + Math.random() * 2.6;
      b.peck = 1;
    }
    if (b.turnT <= 0) {
      b.turnT = 1 + Math.random() * 3;
      b.yaw += (Math.random() - 0.5) * 1.8;
    }
    if (b.hopT <= 0) {
      b.hopT = 0.8 + Math.random() * 2.4;
      // hop toward a point near home
      const a = Math.random() * Math.PI * 2, r = Math.random() * HOP_R;
      const tx = b.hx + Math.cos(a) * r, tz = b.hz + Math.sin(a) * r;
      b.hopFrom[0] = b.x; b.hopFrom[1] = b.z;
      b.hopTo[0] = tx; b.hopTo[1] = tz;
      if (Math.hypot(tx - b.x, tz - b.z) > 0.05) b.yaw = Math.atan2(tx - b.x, tz - b.z);
      b.hop = 0.001;
      b.peck = 0;
    }
  }

  function flyStep(b, dt, t) {
    if (b.delay > 0) {
      b.delay -= dt;
      b.open = Math.min(1, b.open + dt * 6);
      b.flap += dt * 30;
      return;
    }
    b.flyT += dt;
    b.open = Math.min(1, b.open + dt * 6);
    const f = b.flock;
    // after the first burst, steer onto a wide circle above the flock's patch of road
    if (b.flyT > 0.7) {
      b.orbit += dt * b.orbitW * 0.8;
      const tx = f.x + Math.cos(b.orbit) * b.orbitR, tz = f.z + Math.sin(b.orbit) * b.orbitR;
      const ty = f.y + b.orbitH + Math.sin(t * 0.9 + b.i) * 0.3;
      const k = Math.min(1, dt * 1.6);
      b.vx += ((tx - b.x) * 1.3 - b.vx) * k;
      b.vy += ((ty - b.y) * 1.3 - b.vy) * k;
      b.vz += ((tz - b.z) * 1.3 - b.vz) * k;
    } else {
      b.vy -= 2.5 * dt; // the take-off burst loses a little lift
    }
    move(b, dt);
    // fast flaps on take-off, slower while circling, little glides now and then
    const glide = b.flyT > 2 && Math.sin(t * 0.7 + b.i * 1.3) > 0.55;
    b.flap += dt * (b.flyT < 0.9 ? 34 : glide ? 0 : 19);
    if (glide) b.flap += (Math.PI * 0.6 - (b.flap % (Math.PI * 2))) * Math.min(1, dt * 6);
  }

  function landStep(b, dt, t) {
    if (b.delay > 0) { b.delay -= dt; return; } // still on the road, waiting its turn
    b.open = Math.min(1, b.open + dt * 4);
    const dx = b.hx - b.x, dz = b.hz - b.z, dist = Math.hypot(dx, dz);
    const ty = b.gy + Math.min(3.5, dist * 0.55);
    const sp = Math.min(dist > 6 ? 5 : 3.2, 0.6 + dist * 1.2);
    const k = Math.min(1, dt * 2.2);
    b.vx += ((dx / (dist || 1)) * sp - b.vx) * k;
    b.vz += ((dz / (dist || 1)) * sp - b.vz) * k;
    b.vy += ((ty - b.y) * 2 - b.vy) * k;
    move(b, dt);
    b.flap += dt * (dist < 1 ? 26 : 14);
    if (dist < 0.12 && b.y - b.gy < 0.12) {
      b.mode = 0;
      b.x = b.hx; b.z = b.hz; b.y = b.gy;
      b.vx = b.vy = b.vz = 0;
      b.hop = 0;
      b.hopT = 0.6 + Math.random();
      b.peckT = 0.4 + Math.random();
    }
  }

  function move(b, dt) {
    b.x += b.vx * dt;
    b.y = Math.max(b.gy, b.y + b.vy * dt);
    b.z += b.vz * dt;
    const h = Math.hypot(b.vx, b.vz);
    if (h > 0.2) {
      const want = Math.atan2(b.vx, b.vz);
      let d = want - b.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      b.yaw += d * Math.min(1, dt * 8);
      b.bank = Math.max(-0.6, Math.min(0.6, -d * 1.2));
    }
    b.pitch = Math.max(-0.5, Math.min(0.6, -Math.atan2(b.vy, Math.max(0.5, h)) * 0.6));
  }

  update(0, 0, null);
  return api;
}
