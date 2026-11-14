// Walking in the open world: the same interface as nav.js createWalker (pos, heading, goTo, stop,
// teleport, update, turnToward), but with no world-sized grid. Collisions test a spatial hash of
// keep-out shapes; tap-to-walk plans with A* (binary heap) on a small grid that only covers the
// start and the target (a tap is always on screen, so that window is a few dozen metres at most).
//
//   const space = createSpace(obstacles, isGround)   isGround(x, z, margin) -> walkable paper
//   space.collides(x, z, r) / space.add(list) / space.remove(list) / space.near(x, z, r, out)
//   const w = createOpenWalker(space, spawn)
import * as THREE from '../../game/three.js';

const RADIUS = 0.26; // Maya's body radius (as nav.js)
const CELL = 0.4; // path grid
const HASH = 8; // spatial hash cell (metres)
const MAX_WINDOW = 90; // metres: longer taps walk straight

/** A spatial hash of keep-out shapes plus the "is there ground here" test. */
export function createSpace(isGround) {
  const cells = new Map();
  const all = [];
  const key = (i, j) => i * 100003 + j;
  function insert(o) {
    if (!o._keys) o._keys = [];
    const minX = o.type === 'circle' ? o.x - o.r : o.minX, maxX = o.type === 'circle' ? o.x + o.r : o.maxX;
    const minZ = o.type === 'circle' ? o.z - o.r : o.minZ, maxZ = o.type === 'circle' ? o.z + o.r : o.maxZ;
    for (let i = Math.floor(minX / HASH); i <= Math.floor(maxX / HASH); i++) {
      for (let j = Math.floor(minZ / HASH); j <= Math.floor(maxZ / HASH); j++) {
        const k = key(i, j);
        let c = cells.get(k);
        if (!c) cells.set(k, (c = []));
        c.push(o);
        o._keys.push(k);
      }
    }
  }
  let stamp = 0;
  const space = {
    all,
    isGround,
    add(list) { for (const o of list) { all.push(o); o._s = 0; insert(o); } },
    /** Take shapes out again (a day's keep-outs on dispose); the hash cells they were filed under are used. */
    remove(list) {
      for (const o of Array.isArray(list) ? list : [list]) {
        if (!o) continue;
        const i = all.indexOf(o);
        if (i >= 0) all.splice(i, 1);
        for (const k of o._keys || []) {
          const c = cells.get(k);
          if (!c) continue;
          const j = c.indexOf(o);
          if (j >= 0) c.splice(j, 1);
          if (!c.length) cells.delete(k);
        }
        o._keys = null;
      }
    },
    /** Shapes whose bounds come within r of (x, z), each once (written to out). */
    near(x, z, r, out) {
      out.length = 0;
      stamp++;
      for (let i = Math.floor((x - r) / HASH); i <= Math.floor((x + r) / HASH); i++) {
        for (let j = Math.floor((z - r) / HASH); j <= Math.floor((z + r) / HASH); j++) {
          const c = cells.get(key(i, j));
          if (!c) continue;
          for (const o of c) if (o._s !== stamp) { o._s = stamp; out.push(o); }
        }
      }
      return out;
    },
    /** True when a body of radius r at (x, z) overlaps a shape or stands off the paper. */
    collides(x, z, r) {
      if (!isGround(x, z, r * 0.6)) return true;
      const i0 = Math.floor((x - r) / HASH), i1 = Math.floor((x + r) / HASH), j0 = Math.floor((z - r) / HASH), j1 = Math.floor((z + r) / HASH);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
        const c = cells.get(key(i, j));
        if (!c) continue;
        for (const o of c) {
          if (o.type === 'circle') {
            const dx = x - o.x, dz = z - o.z;
            if (dx * dx + dz * dz < (o.r + r) * (o.r + r)) return true;
          } else {
            const qx = Math.max(o.minX, Math.min(x, o.maxX)), qz = Math.max(o.minZ, Math.min(z, o.maxZ));
            const dx = x - qx, dz = z - qz;
            if (dx * dx + dz * dz < r * r) return true;
          }
        }
      }
      return false;
    },
  };
  return space;
}

// ---- A* on a small window (binary heap; typed arrays reused between taps when they fit)
let buf = null;
function buffers(n) {
  if (!buf || buf.n < n) buf = { n, g: new Float32Array(n), came: new Int32Array(n), blocked: new Uint8Array(n), closed: new Uint8Array(n), heap: new Int32Array(n * 2), f: new Float32Array(n) };
  return buf;
}
function plan(space, sx, sz, tx, tz) {
  const pad = 6;
  const minX = Math.min(sx, tx) - pad, maxX = Math.max(sx, tx) + pad, minZ = Math.min(sz, tz) - pad, maxZ = Math.max(sz, tz) + pad;
  if (maxX - minX > MAX_WINDOW || maxZ - minZ > MAX_WINDOW) return null;
  const cols = Math.ceil((maxX - minX) / CELL) + 1, rows = Math.ceil((maxZ - minZ) / CELL) + 1, N = cols * rows;
  const B = buffers(N);
  const { g, came, blocked, closed, heap, f } = B;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const k = j * cols + i;
    blocked[k] = space.collides(minX + i * CELL, minZ + j * CELL, RADIUS + 0.04) ? 1 : 0;
    g[k] = Infinity; came[k] = -1; closed[k] = 0;
  }
  const cell = (x, z) => [Math.max(0, Math.min(cols - 1, Math.round((x - minX) / CELL))), Math.max(0, Math.min(rows - 1, Math.round((z - minZ) / CELL)))];
  const free = ([i, j]) => {
    if (!blocked[j * cols + i]) return [i, j];
    for (let r = 1; r < 10; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      const ni = i + di, nj = j + dj;
      if (ni >= 0 && nj >= 0 && ni < cols && nj < rows && !blocked[nj * cols + ni]) return [ni, nj];
    }
    return [i, j];
  };
  const [si, sj] = free(cell(sx, sz)), [ti, tj] = free(cell(tx, tz));
  const start = sj * cols + si, goal = tj * cols + ti;
  let hn = 0;
  const push = (k) => {
    let c = hn++;
    heap[c] = k;
    while (c > 0) { const pa = (c - 1) >> 1; if (f[heap[pa]] <= f[heap[c]]) break; const t = heap[pa]; heap[pa] = heap[c]; heap[c] = t; c = pa; }
  };
  const pop = () => {
    const top = heap[0];
    heap[0] = heap[--hn];
    let c = 0;
    for (;;) {
      const l = c * 2 + 1, r = l + 1;
      let m = c;
      if (l < hn && f[heap[l]] < f[heap[m]]) m = l;
      if (r < hn && f[heap[r]] < f[heap[m]]) m = r;
      if (m === c) break;
      const t = heap[m]; heap[m] = heap[c]; heap[c] = t; c = m;
    }
    return top;
  };
  g[start] = 0;
  f[start] = Math.hypot(ti - si, tj - sj);
  push(start);
  let found = false;
  while (hn) {
    const cur = pop();
    if (closed[cur]) continue;
    if (cur === goal) { found = true; break; }
    closed[cur] = 1;
    const ci = cur % cols, cj = (cur / cols) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = ci + di, nj = cj + dj;
      if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
      const n = ni + nj * cols;
      if (blocked[n] || closed[n]) continue;
      if (di && dj && (blocked[ci + di + cj * cols] || blocked[ci + (cj + dj) * cols])) continue;
      const ng = g[cur] + (di && dj ? 1.414 : 1);
      if (ng < g[n]) { g[n] = ng; came[n] = cur; f[n] = ng + Math.hypot(ti - ni, tj - nj); if (hn < heap.length) push(n); }
    }
  }
  if (!found && goal !== start) return null;
  const pts = [];
  for (let c = goal; c !== -1; c = came[c]) pts.push(new THREE.Vector2(minX + (c % cols) * CELL, minZ + ((c / cols) | 0) * CELL));
  pts.reverse();
  if (!space.collides(tx, tz, RADIUS)) pts[pts.length - 1] = new THREE.Vector2(tx, tz);
  // drop waypoints with a clear straight line to a later one
  if (pts.length < 3) return pts;
  const clear = (a, c) => {
    const d = a.distanceTo(c), steps = Math.ceil(d / (CELL * 0.5));
    for (let s = 1; s < steps; s++) { const t = s / steps; if (space.collides(a.x + (c.x - a.x) * t, a.y + (c.y - a.y) * t, RADIUS)) return false; }
    return true;
  };
  const out = [pts[0]];
  let k = 0;
  while (k < pts.length - 1) {
    let far = k + 1;
    for (let m = pts.length - 1; m > k + 1; m--) if (clear(pts[k], pts[m])) { far = m; break; }
    out.push(pts[far]);
    k = far;
  }
  return out;
}

/** The nearest spot to (x, z), searched in rings outward, where a body of radius r stands free.
 * o.ok(x, z) can veto a spot (the parked car); o.roomy wants room round it too (two of four steps free,
 * so she is not put in a pocket she cannot walk out of); o.open also rules out a closed pocket (boxedIn).
 * null when nothing within o.maxR. */
export function freeSpot(space, x, z, o = {}) {
  const r = o.r ?? RADIUS, maxR = o.maxR ?? 8, ok = o.ok || null, roomy = !!o.roomy;
  const room = (px, pz) => {
    let n = 0;
    if (!space.collides(px + 0.4, pz, r)) n++;
    if (!space.collides(px - 0.4, pz, r)) n++;
    if (!space.collides(px, pz + 0.4, r)) n++;
    if (!space.collides(px, pz - 0.4, r)) n++;
    return n >= 2;
  };
  // (o.open: not a pocket either, she can walk a metre or more away from it)
  const good = (px, pz) => !space.collides(px, pz, r) && (!ok || ok(px, pz)) && (!roomy || room(px, pz)) && (!o.open || !boxedIn(space, px, pz, { r }));
  if (good(x, z)) return { x, z, d: 0 };
  for (let d = 0.2; d <= maxR + 1e-6; d += 0.2) {
    const n = Math.max(8, Math.ceil((2 * Math.PI * d) / 0.25));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, px = x + Math.sin(a) * d, pz = z + Math.cos(a) * d;
      if (good(px, pz)) return { x: px, z: pz, d };
    }
  }
  return null;
}

/** True when a body of radius r at (x, z) cannot walk `reach` metres away in any direction: a pocket
 * between a fence, a stall and a wall (a small flood fill, 0.2 m steps, only ever run once in a while). */
export function boxedIn(space, x, z, o = {}) {
  const r = o.r ?? RADIUS, reach = o.reach ?? 1.2, S = 0.2, N = Math.ceil((reach + 0.4) / S), W = N * 2 + 1;
  const seen = new Uint8Array(W * W); // 0 unknown, 1 queued, 2 blocked
  const q = [N * W + N];
  seen[N * W + N] = 1;
  while (q.length) {
    const k = q.pop(), i = k % W, j = (k / W) | 0;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= W || nj >= W) continue;
      const n = nj * W + ni;
      if (seen[n]) continue;
      const px = x + (ni - N) * S, pz = z + (nj - N) * S;
      if (space.collides(px, pz, r)) { seen[n] = 2; continue; }
      if (Math.hypot(ni - N, nj - N) * S >= reach) return false;
      seen[n] = 1;
      q.push(n);
    }
  }
  return true;
}

export function createOpenWalker(space, spawn = { x: 0, z: 0, heading: Math.PI }) {
  const pos = new THREE.Vector2(spawn.x, spawn.z);
  const vel = new THREE.Vector2();
  const desired = new THREE.Vector2();
  const tmp = new THREE.Vector2();
  let heading = spawn.heading ?? Math.PI;
  let path = null, pathIdx = 0, onArrive = null, stuck = 0;
  let esc = null, escT = 0; // (standing inside a keep-out: the free spot she steps out to)
  const done = (ok) => { path = null; const cb = onArrive; onArrive = null; cb?.(ok); };
  return {
    pos,
    space,
    get heading() { return heading; },
    set heading(h) { heading = h; },
    speed: 0,
    get moving() { return !!path; },
    goTo(x, z, onDone) {
      onArrive = onDone || null;
      path = plan(space, pos.x, pos.y, x, z);
      pathIdx = 1;
      if (!path) done(false);
      else if (path.length < 2) done(true);
    },
    stop() { path = null; onArrive = null; },
    teleport(x, z, h) { pos.set(x, z); if (h !== undefined) heading = h; path = null; vel.set(0, 0); esc = null; },
    /** Standing inside a keep-out (a fence's corner, a stall, a lamp, a town that came in round her):
     * every step would collide, so she could never walk again. With the stick pushed (or a path), she
     * steps out to the nearest free spot instead (a far one is a hop). Returns the speed, or -1 when free. */
    escape(dt, maxSpeed) {
      if (!space.collides(pos.x, pos.y, RADIUS)) { esc = null; return -1; }
      if (!esc || (escT -= dt) <= 0 || space.collides(esc.x, esc.z, RADIUS)) {
        esc = freeSpot(space, pos.x, pos.y, { r: RADIUS + 0.02, maxR: 12, roomy: true, open: true }) || freeSpot(space, pos.x, pos.y, { r: RADIUS, maxR: 20 });
        escT = 0.5;
      }
      if (!esc) return -1;
      const dx = esc.x - pos.x, dz = esc.z - pos.y, d = Math.hypot(dx, dz);
      if (d < 1e-4 || d > 2.5) { pos.set(esc.x, esc.z); vel.set(0, 0); esc = null; return 0; }
      const step = Math.min(d, Math.max(1.2, maxSpeed) * dt);
      pos.x += (dx / d) * step; pos.y += (dz / d) * step;
      vel.set((dx / d) * (step / Math.max(dt, 1e-4)), (dz / d) * (step / Math.max(dt, 1e-4)));
      let diff = Math.atan2(dx, dz) - heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      heading += diff * (1 - Math.exp(-dt * 14));
      return vel.length();
    },
    update(dt, stick, maxSpeed) {
      if ((stick && stick.lengthSq() > 0.0025) || path) {
        const sp = this.escape(dt, maxSpeed);
        if (sp >= 0) { this.speed = sp; return sp; }
      }
      desired.set(0, 0);
      if (stick && stick.lengthSq() > 0.0025) {
        path = null; onArrive = null;
        desired.set(stick.x, -stick.y);
        if (desired.lengthSq() > 1) desired.normalize();
        desired.multiplyScalar(maxSpeed);
      } else if (path) {
        const target = path[pathIdx];
        tmp.subVectors(target, pos);
        const d = tmp.length();
        const last = pathIdx === path.length - 1;
        if (d < (last ? 0.08 : 0.3)) {
          if (last) done(true); else pathIdx++;
        } else {
          const slow = last ? Math.min(1, d / 0.6) : 1;
          desired.copy(tmp).divideScalar(d).multiplyScalar(maxSpeed * Math.max(0.35, slow));
        }
      }
      const k = 1 - Math.exp(-dt * 12);
      vel.x += (desired.x - vel.x) * k;
      vel.y += (desired.y - vel.y) * k;
      const nx = pos.x + vel.x * dt, nz = pos.y + vel.y * dt;
      if (!space.collides(nx, pos.y, RADIUS)) pos.x = nx; else vel.x *= 0.2;
      if (!space.collides(pos.x, nz, RADIUS)) pos.y = nz; else vel.y *= 0.2;
      const sp = vel.length();
      if (path && sp < 0.05 && desired.lengthSq() > 0.01) {
        stuck += dt;
        if (stuck > 0.6) { stuck = 0; done(true); }
      } else stuck = 0;
      if (sp > 0.15) {
        let diff = Math.atan2(vel.x, vel.y) - heading;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        heading += diff * (1 - Math.exp(-dt * 14));
      }
      this.speed = sp;
      return sp;
    },
    turnToward(x, z, dt) {
      let diff = Math.atan2(x - pos.x, z - pos.y) - heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      heading += diff * (1 - Math.exp(-dt * 10));
      return Math.abs(diff);
    },
  };
}
