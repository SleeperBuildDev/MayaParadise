// Walking inside rooms: stick movement with collisions, and tap-to-walk with grid A* around
// furniture. Rooms describe themselves with bounds + obstacles (see interiors/kit.js).
import * as THREE from './three.js';

const CELL = 0.25;
const RADIUS = 0.26; // Maya's body radius for collisions

export function createWalker(room) {
  const b = room.bounds;
  const cols = Math.ceil((b.maxX - b.minX) / CELL) + 1;
  const rows = Math.ceil((b.maxZ - b.minZ) / CELL) + 1;
  const blocked = new Uint8Array(cols * rows);
  const cx = (i) => b.minX + i * CELL;
  const cz = (j) => b.minZ + j * CELL;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) blocked[j * cols + i] = collides(room.obstacles, cx(i), cz(j), RADIUS + 0.04) ? 1 : 0;
  }

  const pos = new THREE.Vector2(room.spawn.x, room.spawn.z);
  const vel = new THREE.Vector2();
  let heading = room.spawn.heading ?? Math.PI;
  let path = null;
  let pathIdx = 0;
  let onArrive = null;
  let stuck = 0;
  const desired = new THREE.Vector2();
  const tmp = new THREE.Vector2();

  function cellOf(x, z) {
    return [THREE.MathUtils.clamp(Math.round((x - b.minX) / CELL), 0, cols - 1), THREE.MathUtils.clamp(Math.round((z - b.minZ) / CELL), 0, rows - 1)];
  }
  function nearestFree(i, j) {
    if (!blocked[j * cols + i]) return [i, j];
    for (let r = 1; r < 12; r++) {
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        const ni = i + di, nj = j + dj;
        if (ni >= 0 && nj >= 0 && ni < cols && nj < rows && !blocked[nj * cols + ni]) return [ni, nj];
      }
    }
    return [i, j];
  }

  function astar(sx, sz, tx, tz) {
    const [si, sj] = nearestFree(...cellOf(sx, sz));
    const [ti, tj] = nearestFree(...cellOf(tx, tz));
    const N = cols * rows;
    const g = new Float32Array(N).fill(Infinity);
    const came = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const open = [si + sj * cols];
    const f = new Float32Array(N).fill(Infinity);
    g[open[0]] = 0;
    f[open[0]] = Math.hypot(ti - si, tj - sj);
    const goal = ti + tj * cols;
    while (open.length) {
      let bi = 0;
      for (let k = 1; k < open.length; k++) if (f[open[k]] < f[open[bi]]) bi = k;
      const cur = open[bi];
      open.splice(bi, 1);
      if (cur === goal) break;
      closed[cur] = 1;
      const ci = cur % cols, cj = (cur / cols) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = ci + di, nj = cj + dj;
        if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
        const n = ni + nj * cols;
        if (blocked[n] || closed[n]) continue;
        if (di && dj && (blocked[ci + di + cj * cols] || blocked[ci + (cj + dj) * cols])) continue; // no corner cutting
        const ng = g[cur] + (di && dj ? 1.414 : 1);
        if (ng < g[n]) {
          g[n] = ng;
          came[n] = cur;
          f[n] = ng + Math.hypot(ti - ni, tj - nj);
          if (!open.includes(n)) open.push(n);
        }
      }
    }
    if (came[goal] === -1 && goal !== si + sj * cols) return null;
    const pts = [];
    for (let c = goal; c !== -1; c = came[c]) pts.push(new THREE.Vector2(cx(c % cols), cz((c / cols) | 0)));
    pts.reverse();
    if (!collides(room.obstacles, tx, tz, RADIUS)) pts[pts.length - 1] = new THREE.Vector2(tx, tz);
    return smooth(pts);
  }

  // Drop waypoints that have a clear straight line to a later one.
  function smooth(pts) {
    if (pts.length < 3) return pts;
    const out = [pts[0]];
    let k = 0;
    while (k < pts.length - 1) {
      let far = k + 1;
      for (let m = pts.length - 1; m > k + 1; m--) if (clearLine(pts[k], pts[m])) { far = m; break; }
      out.push(pts[far]);
      k = far;
    }
    return out;
  }
  function clearLine(a, c) {
    const d = a.distanceTo(c);
    const steps = Math.ceil(d / (CELL * 0.5));
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      if (collides(room.obstacles, a.x + (c.x - a.x) * t, a.y + (c.y - a.y) * t, RADIUS)) return false;
    }
    return true;
  }

  return {
    pos,
    get heading() { return heading; },
    set heading(h) { heading = h; },
    speed: 0,
    get moving() { return !!path; },
    /** Walk to (x, z) along a path; onDone() fires on arrival (or immediately if unreachable). */
    goTo(x, z, onDone) {
      path = astar(pos.x, pos.y, x, z);
      pathIdx = 1;
      onArrive = onDone || null;
      if (!path) { const cb = onArrive; onArrive = null; cb?.(false); }
    },
    stop() { path = null; onArrive = null; },
    teleport(x, z, h) { pos.set(x, z); if (h !== undefined) heading = h; path = null; vel.set(0, 0); },
    /** stick: Vector2 in screen space (x right, y up). Returns current speed (m/s). */
    update(dt, stick, maxSpeed) {
      desired.set(0, 0);
      if (stick && stick.lengthSq() > 0.0025) {
        path = null; onArrive = null;
        desired.set(stick.x, -stick.y); // screen up = north = -Z
        if (desired.lengthSq() > 1) desired.normalize();
        desired.multiplyScalar(maxSpeed);
      } else if (path) {
        const target = path[pathIdx];
        tmp.subVectors(target, pos);
        const d = tmp.length();
        const last = pathIdx === path.length - 1;
        if (d < (last ? 0.08 : 0.3)) {
          if (last) {
            path = null;
            const cb = onArrive; onArrive = null;
            cb?.(true);
          } else pathIdx++;
        } else {
          const slow = last ? Math.min(1, d / 0.6) : 1;
          desired.copy(tmp).divideScalar(d).multiplyScalar(maxSpeed * Math.max(0.35, slow));
        }
      }
      // ease velocity toward desired (snappy but not instant)
      const k = 1 - Math.exp(-dt * 12);
      vel.x += (desired.x - vel.x) * k;
      vel.y += (desired.y - vel.y) * k;
      const nx = pos.x + vel.x * dt;
      const nz = pos.y + vel.y * dt;
      // resolve collisions per axis so she slides along furniture
      if (!collides(room.obstacles, nx, pos.y, RADIUS)) pos.x = nx; else vel.x *= 0.2;
      if (!collides(room.obstacles, pos.x, nz, RADIUS)) pos.y = nz; else vel.y *= 0.2;
      pos.x = THREE.MathUtils.clamp(pos.x, b.minX, b.maxX);
      pos.y = THREE.MathUtils.clamp(pos.y, b.minZ, b.maxZ);
      const sp = vel.length();
      // stuck on a corner while following a path -> count as arrived
      if (path && sp < 0.05 && desired.lengthSq() > 0.01) {
        stuck += dt;
        if (stuck > 0.6) { stuck = 0; path = null; const cb = onArrive; onArrive = null; cb?.(true); }
      } else stuck = 0;
      if (sp > 0.15) {
        const target = Math.atan2(vel.x, vel.y);
        let diff = target - heading;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        heading += diff * (1 - Math.exp(-dt * 14));
      }
      this.speed = sp;
      return sp;
    },
    turnToward(x, z, dt) {
      const target = Math.atan2(x - pos.x, z - pos.y);
      let diff = target - heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      heading += diff * (1 - Math.exp(-dt * 10));
      return Math.abs(diff);
    },
  };
}

export function collides(obstacles, x, z, r) {
  for (const o of obstacles) {
    if (o.type === 'circle') {
      const dx = x - o.x, dz = z - o.z;
      if (dx * dx + dz * dz < (o.r + r) * (o.r + r)) return true;
    } else {
      const qx = Math.max(o.minX, Math.min(x, o.maxX));
      const qz = Math.max(o.minZ, Math.min(z, o.maxZ));
      const dx = x - qx, dz = z - qz;
      if (dx * dx + dz * dz < r * r) return true;
    }
  }
  return false;
}
