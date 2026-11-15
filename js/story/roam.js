// Townsfolk roam (owner: "townfolks are standing still and doing nothing, they should be roaming around").
//
// The free townsfolk walk their own few streets: the region townsfolk (world/regions/*-folk.js PEOPLE rows, while
// they still have the job their region gave them) and the ambient folk (extras-chatter.js, e.folk). Each one gets a
// small patch round their anchor (the job spot, or where they were put): a handful of pavement points, found once
// (a few candidates a frame) and kept off the roads, the doors, everyone's job spots and anything solid, each with
// a clear straight line back to the anchor. Then they go: to a point, stop and look at the shop front there, on to
// the next, back to the job spot to work a while (the job's own mood animation), and now and then over to another
// free one to stand and chat (the small talk in extras-chatter.js picks such pairs up; while it plays they stand
// facing each other, and walk a step closer when they are far apart).
//
// Cheap on purpose: no grid, no path search (the patch's straight lines are checked once, when it is made); each
// frame a walker takes one step with one collision test, and steers round the others, Maya and the car (sidestep,
// keeping right head on). No meshes: walking is the person's own walk cycle.
//
// Points round corners: when few straight lines leave the hub (a fenced yard, a narrow pavement, a shop front on the
// kerb) a small grid search adds points with their way (corners) from the hub; a keeper boxed in by the stall gets
// the way out from its region row (roamExit, e.g. market.js Ko Yaung / Daw Pyone). A walk stuck on a corner walks
// back the way it came; someone standing inside a solid steps out of it.
//
// The story cast between scenes ('idle', idleStep): short strolls (under 3 m) from where the day left them, and
// back on that spot whenever the story may want them: any scene / talk / act / intro, the hint line about them,
// Maya within 7 m (14 m in the car), small talk, a tap. A day's job (story.setJob) stays story.js's lifeStep; the
// stroll comes between. Never: a scripted walk or ctl (the day moves them: home is wherever it leaves them),
// seated, lying, up off the ground, hidden. A person Maya is walking up to (story.approach) stands still for her.
// Far walkers (60 m+) step every 4th frame.
// story.update calls e.roam(dt, near) for a person who has one (and no ctl / scripted walk, no talk running).
//
//   installRoam(game, story, ow)   once, after the open world is made. story.roam = { stats, debug }
import { DOORS } from './doors.js';
import { PEOPLE as REGION_PEOPLE, regionAt } from './world/region.js';
import { LIVE_PEOPLE } from './people.js';

const R_REGION = 9, R_FOLK = 7, R_IDLE = 2.6; // patch radius round the anchor (m); R_IDLE: the cast's short wanders (under 3 m: day7.js puts back anyone 3 m off their place)
const IDLE_HOLD = 7, IDLE_HOLD_CAR = 14; // the cast stand on their spot while Maya is this near (on foot / in the car)
const BUSY_CLASSES = /\b(cinema|talking|choosing|acting|ti-flying|ti-naming)\b/; // (hints.js: a scene covers the play)
const ROAD_KEEP = 1.8; // metres from a road's centre line (the road is 2.4 wide): pavement only
const BODY = 0.3; // a walker's clearance
const PTS = 5, CANDS = 80, PER_FRAME = 3; // waypoints wanted, candidates tried, candidates checked a frame
const SPEED = { child: [1.15, 1.4], teen: [1.05, 1.35], adult: [0.95, 1.3], elder: [0.9, 1.05] };
const rand = (a, b) => a + Math.random() * (b - a);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function installRoam(game, story, ow) {
  if (story.roam) return story.roam;
  const space = ow?.space;
  if (!space) return null;
  const people = story.people;
  const stats = { attached: 0, detached: 0, built: 0, walkM: 0, meets: 0, dodges: 0, acc: 0, msFrame: 0, msMax: 0, frames: 0, slow: 0, colMax: 0, colSum: 0 };
  const dayOwns = (id) => { try { return typeof story.day?.owns === 'function' && !!story.day.owns(id); } catch { return false; } };

  // region rows by id (lazy towns add theirs later: rebuilt when the list grows)
  let rows = new Map(), rowsN = -1;
  const rowOf = (id) => { if (rowsN !== REGION_PEOPLE.length) { rows = new Map(REGION_PEOPLE.map((p) => [p.id, p])); rowsN = REGION_PEOPLE.length; } return rows.get(id); };
  const districtOf = (x, z) => regionAt(x, z)?.id || null;
  // (the road net is searched edge by edge: answers kept on a half-metre grid, the roads never move)
  const roadMemo = new Map();
  const roadDist = (x, z) => {
    const k = Math.round(x * 2) * 100003 + Math.round(z * 2);
    let d = roadMemo.get(k);
    if (d === undefined) { if (roadMemo.size > 30000) roadMemo.clear(); d = ow.net?.nearest?.(x, z)?.dist ?? 99; roadMemo.set(k, d); }
    return d;
  };

  // ---- where nobody loiters: doors and everyone's own spots (a person's own job spot is fine for them)
  // (the doors' list kept for half a second: the scan below drops it; DOORS grows as the houses near her go live)
  let doors = null;
  const doorList = () => doors || (doors = Object.values(DOORS));
  function keepOut(x, z, self) {
    for (const d of doorList()) if (d && Math.hypot(x - d.x, z - d.z) < 2.2) return true;
    for (const pl of game.world?.places || []) if (pl.door && Math.hypot(x - pl.door.x, z - pl.door.z) < 2.2) return true;
    for (const p of REGION_PEOPLE) {
      if (p.id === self) continue;
      if (Math.hypot(x - p.x, z - p.z) < 1.3) return true;
      const s = p.job?.spot;
      if (s && Math.hypot(x - s.x, z - s.z) < 1.3) return true;
    }
    return false;
  }
  const solid = (x, z, r = BODY) => { col++; return space.collides(x, z, r); };
  let col = 0, budget = 2; // collision tests this frame; patch / plan jobs left this frame (spread over frames: no hitch)
  const pointOk = (x, z, self, dist) => !solid(x, z, 0.42) && roadDist(x, z) >= ROAD_KEEP && districtOf(x, z) === dist && !keepOut(x, z, self);
  // (loose: the first metres from a job spot behind a stall or a counter only need to be outside the solid itself)
  function lineOk(x0, z0, x1, z1, loose = 0) {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(L / 0.35));
    for (let i = 1; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, z = z0 + ((z1 - z0) * i) / n;
      if (solid(x, z, (L * i) / n < loose ? 0.12 : BODY) || (i % 2 === 0 && roadDist(x, z) < ROAD_KEEP - 0.3)) return false;
    }
    return true;
  }
  /** the way to face at a waypoint: toward the shop front / stall / wall beside it, if there is one */
  function frontAt(x, z) {
    for (const r of [1.0, 1.7]) for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      if (solid(x + Math.sin(a) * r, z + Math.cos(a) * r, 0.15)) return { h: a, shop: true };
    }
    return { h: Math.random() * Math.PI * 2, shop: false };
  }

  // ---- who roams
  // 'region' / 'folk': their own few streets (below). 'idle': everyone else standing about between scenes (the
  // story cast, a day's people, a region person a day took off their work): short wanders within R_IDLE of where
  // the day left them, and back on that spot, facing the same way, whenever the story may want them (idleStep).
  function freeKind(e) {
    if (!e?.p?.root || !e.p.root.parent || e.p.root.visible === false || e.hidden || e.indoor || e.noRoam) return null;
    if (e.folk) return dayOwns(e.id) || dayOwns('folk:' + e.folk) ? null : 'folk';
    const row = rowOf(e.id);
    if (row && !e.scriptedOnce && !dayOwns(e.id) && (e.job ? !row.job || e.job === row.job : !row.job)) return 'region';
    if (e.fake || e.noIdle) return null; // (a day's job: story.js's lifeStep keeps it; idleStep takes them for a stroll between)
    if (e.roam) return e.rm?.kind === 'idle' ? 'idle' : null;
    return idleOk(e) ? 'idle' : null;
  }
  /** Fit for short wanders: standing on the ground (not seated, lying, up a ladder or on a stage), the arms
   *  down or in a job pose we can tell (then the pose is put back on their return). */
  function idleOk(e) {
    const root = e.p.root, now = performance.now();
    if (e.rmCool > now || e.ctl || e.walking || e.walkIn || e.paused) return false;
    if (Math.abs(root.rotation.x) > 0.05 || Math.abs(root.rotation.z) > 0.05 || root.position.y > 0.3) return false;
    const L = LIVE_PEOPLE.get(root);
    if (L && L.hips.position.y < L.hipY - 0.08) return false; // (seated)
    if (!e.job && moodOf(e) === undefined) return false; // (a day's job: lifeStep puts its pose back itself)
    return true;
  }
  /** The held job pose, read off the arms (people.js keeps the mood to itself): a mood name, null (arms down)
   *  or undefined (something we cannot put back: an emote, a carry). */
  function moodOf(e) {
    const b = e.p.bones;
    if (!b?.armL) return null;
    const lx = b.armL.rotation.x, rx = b.armR.rotation.x, lz = b.armL.rotation.z;
    if (lx > -0.45 && rx > -0.45) return null;
    if (rx < -2.0 && lx > -0.5) return 'play';
    if (lx < -1.1 && rx < -1.1 && lz < -0.25) return 'read';
    if (lx < -0.7 && rx < -0.7 && lx > -1.25 && rx > -1.25 && Math.abs(lz + 0.15) < 0.06) return 'work';
    return undefined;
  }
  function attach(e, kind) {
    const row = kind === 'region' ? rowOf(e.id) : null;
    const s = row?.job?.spot;
    const pos = e.p.root.position;
    const ax = kind === 'idle' ? pos.x : s ? s.x : e.home.x, az = kind === 'idle' ? pos.z : s ? s.z : e.home.z;
    const age = e.cast?.look?.age || 'adult';
    const sp = SPEED[age] || SPEED.adult;
    const rm = {
      kind, ax, az, ah: kind === 'idle' ? e.p.root.rotation.y : s?.h ?? e.home.h, dist: districtOf(ax, az), R: kind === 'region' ? R_REGION : kind === 'idle' ? R_IDLE : R_FOLK, hx: null, hz: null,
      pts: [], tried: 0, speed: rand(sp[0], sp[1]), state: 'idle', t: rand(0.5, 3), tx: 0, tz: 0, kindT: null,
      blockedT: 0, dodge: null, last: -1, worked: false, partner: null, walked: 0,
    };
    if (kind === 'idle') {
      Object.assign(rm, { state: 'home', t: rand(6, 14), hx: ax, hz: az, rx: ax, rz: az, exit: [], hubOff: false, lx: pos.x, lz: pos.z, h0x: e.home.x, h0z: e.home.z, pose: e.job ? null : moodOf(e), speed: rm.speed * 0.8 });
      if (e.job) { rm.job0 = e.job; rm.t = rand(10, 22); const s = e.job.spot; if (s) { rm.ax = rm.hx = s.x; rm.az = rm.hz = s.z; } } // (round the job spot)
    }
    e.rm = rm;
    e.roam = (dt, near) => step(e, dt, near);
    stats.attached++;
  }
  function detach(e) {
    if (!e.roam) return;
    e.roam = null;
    if (e.rm?.kind === 'idle' && e.rm.pose && e.rm.state !== 'home') e.p.setMood?.(e.rm.pose); // (their job pose back)
    else if (e.rm?.mood) e.p.setMood?.(e.baseMood ?? null);
    if (e.rm?.partner?.rm?.partner === e) { e.rm.partner.rm.partner = null; }
    e.rm = null;
    stats.detached++;
  }
  // the hub: the nearest open bit of pavement to the job spot (a stall keeper's spot is boxed in by the stall, the
  // counter and the road, and the way out may turn a corner: along the lane behind the stalls, then out by the end).
  // Found once with a small breadth-first search on a half-metre grid round the spot (8-way, no corner cutting, a few
  // dozen cells a call); the way there is kept, with only its corners, as rm.exit. Every walk out of / back to the job
  // spot follows it; every patch point has a straight clear line from the hub.
  const HC = 0.5, HN = 20; // cell (m), half-size in cells (10 m: at 7 m two keepers, Market and Junction, never got out)
  const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const key = (i, j) => (i + 50) * 101 + (j + 50), ij = (k) => [Math.floor(k / 101) - 50, (k % 101) - 50], K0 = key(0, 0);
  function hub(e) {
    const rm = e.rm;
    let B = rm.bfs;
    // (a keeper boxed in by the stall: the row gives the way out itself, roamExit [[x, z], ...] from the spot, the
    // last corner being the hub; it may squeeze past a crate or through a stall's open back, so it walks it loose)
    const ex = rowOf(e.id)?.roamExit;
    if (!B && ex?.length && rm.kind === 'region') {
      rm.exit = ex.map(([x, z]) => ({ x, z })); rm.hx = rm.exit[rm.exit.length - 1].x; rm.hz = rm.exit[rm.exit.length - 1].z; rm.hubOff = true; rm.exitLoose = true;
      return;
    }
    if (!B) {
      // (open already: roomy, as the search below asks; a spot clear by only 0.42 m left one Market keeper with no
      // clear line anywhere, standing all day)
      if (!rm.forceHub && !solid(rm.ax, rm.az, 0.9) && roadDist(rm.ax, rm.az) >= ROAD_KEEP) { rm.hx = rm.ax; rm.hz = rm.az; rm.exit = []; rm.hubOff = false; return; } // (open already)
      B = rm.bfs = { prev: new Map([[K0, -1]]), pass: new Map([[K0, true]]), q: [K0], h: 0 };
    }
    const at = (i, j) => [rm.ax + i * HC, rm.az + j * HC];
    const passable = (i, j) => {
      const k = key(i, j);
      let v = B.pass.get(k);
      if (v === undefined) {
        const [x, z] = at(i, j), near = Math.hypot(i, j) * HC < 1.3;
        // (the way out may run along the kerb's edge, a step onto the road's verge, never across it)
        v = !solid(x, z, near ? 0.12 : BODY) && (near || roadDist(x, z) >= 0.95);
        B.pass.set(k, v);
      }
      return v;
    };
    for (let n = 0; n < 24 && B.h < B.q.length; n++) {
      const k = B.q[B.h++], [i, j] = ij(k);
      if (k !== K0) {
        const [x, z] = at(i, j);
        if (!solid(x, z, 0.9) && roadDist(x, z) >= ROAD_KEEP && !keepOut(x, z, e.id)) return hubAt(rm, B, k); // (roomy: a real bit of pavement, not a gap between two stalls)
        if (!solid(x, z, 0.42) && roadDist(x, z) >= ROAD_KEEP - 0.3 && !keepOut(x, z, e.id)) B.alt = k; // (the farthest bit of plain pavement: if nothing roomy turns up)
      }
      for (const [di, dj] of N8) {
        const a = i + di, b = j + dj, k2 = key(a, b);
        if (Math.abs(a) > HN || Math.abs(b) > HN || B.prev.has(k2) || !passable(a, b)) continue;
        if (di && dj && (!passable(i + di, j) || !passable(i, j + dj))) continue; // (no cutting a corner)
        B.prev.set(k2, k); B.q.push(k2);
      }
    }
    if (B.h >= B.q.length) {
      if (B.alt != null) return hubAt(rm, B, B.alt); // (nothing roomy: the farthest plain bit will do)
      rm.hx = rm.ax; rm.hz = rm.az; rm.exit = []; rm.hubOff = false; rm.bfs = null; // (no way out: works where they are)
    }
  }
  /** the hub is cell k: keep the way there from the job spot (its corners only) */
  function hubAt(rm, B, k) {
    const path = [];
    for (let c = k; c !== K0; c = B.prev.get(c)) path.push(c);
    path.reverse();
    const out = [];
    for (let m = 0; m < path.length; m++) {
      const [a, b] = ij(path[m]);
      if (m < path.length - 1) {
        const [a0, b0] = m ? ij(path[m - 1]) : [0, 0], [a1, b1] = ij(path[m + 1]);
        if (a - a0 === a1 - a && b - b0 === b1 - b) continue; // (straight on: not a corner)
      }
      out.push({ x: rm.ax + a * HC, z: rm.az + b * HC });
    }
    const h = out[out.length - 1];
    rm.exit = out; rm.hx = h.x; rm.hz = h.z; rm.hubOff = true; rm.bfs = null;
  }
  // a few patch candidates a frame (never a hitch)
  function build(e) {
    const rm = e.rm;
    if (budget <= 0) return;
    budget--;
    if (rm.hx == null) { hub(e); return; }
    for (let k = 0; k < PER_FRAME && rm.tried < CANDS && rm.pts.length < PTS; k++, rm.tried++) {
      const a = (rm.tried * 2.39996) + Math.random() * 0.5, r = 2 + Math.sqrt(Math.random()) * (rm.R - 2);
      const x = rm.hx + Math.sin(a) * r, z = rm.hz + Math.cos(a) * r;
      if (!pointOk(x, z, e.id, rm.dist)) continue;
      if (rm.pts.some((p) => Math.hypot(p.x - x, p.z - z) < 1.8)) continue;
      if (!lineOk(rm.hx, rm.hz, x, z, rm.hubOff ? 0 : 1.3)) continue;
      rm.pts.push({ x, z, ...frontAt(x, z), links: new Map() });
    }
    if (rm.tried >= CANDS || rm.pts.length >= PTS) {
      // (an open spot with no clear line out of it, stalls all round: search for a hub after all, once)
      if (!rm.pts.length && !rm.hubOff && !rm.forceHub) { rm.forceHub = true; rm.hx = rm.hz = null; rm.tried = 0; return; }
      // (few straight lines out of the hub: stalls, fences, a lane's corner. Points round the corners as well)
      if (rm.pts.length < 3 && !rm.gridDone) { gridPts(e); return; }
      // (no clear line anywhere from the hub: the hub itself, so a keeper still steps out from the stall now and then)
      if (!rm.pts.length && rm.hubOff) rm.pts.push({ x: rm.hx, z: rm.hz, ...frontAt(rm.hx, rm.hz), links: new Map() });
      // (no way out at all: a step or two along the stall and back, so nobody stands frozen all day)
      if (!rm.pts.length && !rm.hubOff) {
        for (let k = 0; k < 16 && rm.pts.length < 2; k++) {
          const a = (k / 16) * Math.PI * 2, r = k % 2 ? 1.1 : 1.7, x = rm.ax + Math.sin(a) * r, z = rm.az + Math.cos(a) * r;
          if (solid(x, z, BODY) || roadDist(x, z) < 1.2 || rm.pts.some((p) => Math.hypot(p.x - x, p.z - z) < 1.2)) continue;
          let ok = true;
          for (let i = 1; i <= 6 && ok; i++) if (solid(rm.ax + (x - rm.ax) * i / 6, rm.az + (z - rm.az) * i / 6, 0.15)) ok = false;
          if (ok) rm.pts.push({ x, z, ...frontAt(x, z), links: new Map() });
        }
      }
      rm.built = true; stats.built++;
    }
  }

  // ---- points round corners: a small breadth-first search on a half-metre grid from the hub (7 m round it, a few
  // dozen cells a call, once), then the reachable cells farthest apart become points, each with its way from the hub
  // (corners only) as pt.via. Walks to and from such a point follow its way (choose); nothing else changes.
  const GN = 14;
  function gridPts(e) {
    const rm = e.rm;
    let G = rm.grid;
    // (cross: next to nothing on this side, a shop front on the kerb: over the street to the other pavement as well)
    if (!G) G = rm.grid = { prev: new Map([[K0, -1]]), pass: new Map([[K0, true]]), q: [K0], h: 0, cross: rm.pts.length < 2 };
    const at = (i, j) => [rm.hx + i * HC, rm.hz + j * HC];
    const passable = (i, j) => {
      const k = key(i, j);
      let v = G.pass.get(k);
      if (v === undefined) {
        const [x, z] = at(i, j), nearJob = Math.hypot(x - rm.ax, z - rm.az) < 1.3;
        v = !solid(x, z, nearJob ? 0.12 : 0.26) && (nearJob || G.cross || roadDist(x, z) >= 1.0);
        G.pass.set(k, v);
      }
      return v;
    };
    for (let n = 0; n < 12 && G.h < G.q.length; n++) { // (a dozen cells a call: up to ~100 tests, no hitch)
      const k = G.q[G.h++], [i, j] = ij(k);
      for (const [di, dj] of N8) {
        const a = i + di, b = j + dj, k2 = key(a, b);
        if (Math.abs(a) > GN || Math.abs(b) > GN || G.prev.has(k2) || !passable(a, b)) continue;
        if (di && dj && (!passable(i + di, j) || !passable(i, j + dj))) continue;
        G.prev.set(k2, k); G.q.push(k2);
      }
    }
    if (G.h < G.q.length && G.q.length < 500) return;
    // the roomy cells, a few dozen a call (keepOut looks at every door and job spot: never all at once)
    const cand = G.cand || (G.cand = []);
    G.ci = G.ci || 1;
    for (let n = 0; n < 30 && G.ci < G.q.length && cand.length <= 140; n++, G.ci++) {
      const k = G.q[G.ci], [x, z] = at(...ij(k));
      if (Math.hypot(x - rm.hx, z - rm.hz) < 1.5 || solid(x, z, 0.36) || roadDist(x, z) < ROAD_KEEP - 0.4 || keepOut(x, z, e.id)) continue;
      cand.push({ k, x, z });
    }
    if (G.ci < G.q.length && cand.length <= 140) return;
    // the farthest-apart of them (from the hub and the points already there)
    const have = [{ x: rm.hx, z: rm.hz }, ...rm.pts];
    while (rm.pts.length < PTS && cand.length) {
      let best = null, bd = 1.6;
      for (const c of cand) { let d = 99; for (const h of have) d = Math.min(d, Math.hypot(c.x - h.x, c.z - h.z)); if (d > bd) { bd = d; best = c; } }
      if (!best) break;
      cand.splice(cand.indexOf(best), 1);
      const path = [];
      for (let c = G.prev.get(best.k); c !== K0 && c != null; c = G.prev.get(c)) path.push(c);
      path.reverse();
      const via = [];
      for (let m = 0; m < path.length; m++) {
        const [a, b] = ij(path[m]), [a0, b0] = m ? ij(path[m - 1]) : [0, 0], [a1, b1] = m < path.length - 1 ? ij(path[m + 1]) : ij(best.k);
        if (a - a0 === a1 - a && b - b0 === b1 - b) continue; // (straight on: not a corner)
        via.push({ x: rm.hx + a * HC, z: rm.hz + b * HC });
      }
      const pt = { x: best.x, z: best.z, ...frontAt(best.x, best.z), links: new Map(), via };
      rm.pts.push(pt); have.push(pt);
    }
    rm.grid = null; rm.gridDone = true; stats.grid = (stats.grid || 0) + 1;
  }

  // ---- maya and the car, measured once a frame
  const M = { x: 0, z: 0, vx: 0, vz: 0, sp: 0, on: false }, C = { x: 0, z: 0, vx: 0, vz: 0, sp: 0 };
  let mPrev = null, cPrev = null;
  let gameEl = null;
  function sense(dt) {
    const mp = game.maya?.root?.position, cp = game.car?.root?.position;
    M.on = !!story.foot?.active;
    // (a scene, a talk, an act, a town intro or the car's get-in / get-out: the cast stay on their spots)
    gameEl = gameEl || document.getElementById('game');
    M.busy = !!(game.busy || story.talking || story.townIntro || story.introActive || story.cutscene || (gameEl && BUSY_CLASSES.test(gameEl.className)));
    if (mp) {
      if (mPrev && dt > 0) { M.vx = (mp.x - mPrev.x) / dt; M.vz = (mp.z - mPrev.z) / dt; M.sp = Math.hypot(M.vx, M.vz); if (M.sp > 12) M.sp = M.vx = M.vz = 0; }
      M.x = mp.x; M.z = mp.z; mPrev = { x: mp.x, z: mp.z };
    }
    if (cp) {
      if (cPrev && dt > 0) { C.vx = (cp.x - cPrev.x) / dt; C.vz = (cp.z - cPrev.z) / dt; C.sp = Math.hypot(C.vx, C.vz); if (C.sp > 40) C.sp = C.vx = C.vz = 0; }
      C.x = cp.x; C.z = cp.z; cPrev = { x: cp.x, z: cp.z };
    }
  }

  function turnToward(obj, h, dt, rate) { obj.rotation.y += wrap(h - obj.rotation.y) * (1 - Math.exp(-dt * rate)); }
  function headAt(e, x, z) {
    // people.lookAt takes a Vector3-like point (x, y, z)
    const v = e.rmLook || (e.rmLook = e.p.root.position.clone());
    v.set(x, 1.0, z);
    e.p.lookAt(v);
  }
  function stand(e, dt) { e.p.update(dt, { speed: 0 }); }
  function setMood(e, m) { if (e.rm.kind === 'idle' || e.rm.mood === m) return; e.rm.mood = m; e.p.setMood(m || (e.baseMood ?? null)); }

  // ---- what next
  function freeToMeet(o, e) {
    const r = o.rm;
    return o !== e && r && r.kind !== 'idle' && !r.partner && r.state !== 'work' && !o.paused && o !== story.talkWith && !o.ctl && !o.walking && !(r.meetCd > performance.now()) && r.lastMet !== e;
  }
  function choose(e) {
    const rm = e.rm, pos = e.p.root.position;
    if (budget <= 0) { rm.t = 0.05; return; } // (someone else planned this frame: next frame)
    budget--;
    setMood(e, null);
    // (standing on the job spot or the hub after a chat or a dodge: plan from there, the way out is known)
    if (Math.hypot(pos.x - rm.ax, pos.z - rm.az) < 0.3) rm.last = -2;
    else if (rm.hx != null && Math.hypot(pos.x - rm.hx, pos.z - rm.hz) < 0.3) rm.last = -1;
    const roll = Math.random();
    const job = rm.kind === 'region' ? e.job : null;
    // over to someone free nearby, to stand and chat
    if (roll < 0.22 && !(rm.meetCd > performance.now())) { // (not straight after the last chat)
      let best = null, bd = 9;
      for (const o of people.values()) {
        if (!freeToMeet(o, e)) continue;
        const op = o.p.root.position, d = Math.hypot(op.x - pos.x, op.z - pos.z);
        if (d < bd && d > 1.2) { best = o; bd = d; }
      }
      if (best) {
        const op = best.p.root.position, d = Math.hypot(op.x - pos.x, op.z - pos.z);
        const k = Math.max(0, (d - 1.5) / d), tx = pos.x + (op.x - pos.x) * k, tz = pos.z + (op.z - pos.z) * k;
        if (lineOk(pos.x, pos.z, tx, tz) && roadDist(tx, tz) >= ROAD_KEEP - 0.2) {
          rm.partner = best; best.rm.partner = e;
          best.rm.state = 'wait'; best.rm.t = 14; setMood(best, null);
          return go(e, tx, tz, 'meet');
        }
      }
    }
    // to the job spot to work (not twice running)
    if (job?.spot && !rm.worked && (roll < 0.62 || !rm.pts.length)) {
      if (Math.hypot(pos.x - rm.ax, pos.z - rm.az) < 0.2) return work(e);
      if (rm.hubOff && rm.last === -1) return go(e, rm.ax, rm.az, 'job', 'in'); // (at the hub: the way in)
      if (rm.last === -1 || rm.last === -2 || lineOk(rm.ax, rm.az, pos.x, pos.z, 1.3)) return go(e, rm.ax, rm.az, 'job');
      if (rm.hubOff && lineOk(rm.hx, rm.hz, pos.x, pos.z)) return go(e, rm.ax, rm.az, 'job', 'in');
      const q = rm.last >= 0 ? rm.pts[rm.last] : null; // (at a point round a corner: back its way, then in)
      if (q?.via) return go(e, rm.ax, rm.az, 'job', [...q.via.slice().reverse(), ...(rm.hubOff ? rm.exit.slice().reverse() : [{ x: rm.hx, z: rm.hz }])]);
    }
    rm.worked = false;
    if (!rm.pts.length) { rm.state = 'idle'; rm.t = rand(3, 6); return; }
    // a waypoint: straight from here when the line is clear, else back by the anchor first
    const order = rm.pts.map((p, i) => i).filter((i) => i !== rm.last).sort(() => Math.random() - 0.5);
    const S = { x: rm.hx, z: rm.hz }, q = rm.last >= 0 ? rm.pts[rm.last] : null, qBack = q?.via ? [...q.via.slice().reverse(), S] : null;
    for (const i of order) {
      const p = rm.pts[i];
      if (p.via) { // (a point round a corner: from the hub along its way; from another point back by the hub)
        const r = rm.last === -1 || (rm.last === -2 && !rm.hubOff) ? p.via : rm.last === -2 ? [...rm.exit, ...p.via] : q ? [...(qBack || [S]), ...p.via] : null;
        if (r) { rm.next = i; return go(e, p.x, p.z, 'wp', r); }
        continue;
      }
      if (qBack) { rm.next = i; return go(e, p.x, p.z, 'wp', qBack); } // (from a point round a corner to a straight one: by the hub)
      // (from the anchor every point is clear; between two points the answer is kept; from elsewhere, look now)
      // (from the job spot behind a stall: out through the hub)
      if (rm.last === -2 && rm.hubOff) { rm.next = i; return go(e, p.x, p.z, 'wp', 'out'); }
      let ok = rm.last === -1 || rm.last === -2 ? true : rm.last >= 0 ? rm.pts[rm.last]?.links.get(i) : undefined;
      if (ok === undefined) { ok = lineOk(pos.x, pos.z, p.x, p.z); if (rm.last >= 0) rm.pts[rm.last].links.set(i, ok); }
      if (ok) { rm.next = i; return go(e, p.x, p.z, 'wp'); }
    }
    // nothing straight from here: back to the hub (every point has a clear line from it, or its own way)
    go(e, rm.hx, rm.hz, 'anchor', qBack);
  }
  /** walk to (x, z); via 'out' / 'in': along the way out of the job spot first (out to the hub / in from it) */
  // (via may also be the corners themselves: a grid point's way, below. Every walk keeps where it set off from and
  // the corners passed, so a walk that gets stuck on a corner walks back the way it came instead of standing)
  function go(e, x, z, kind, via = null) {
    const rm = e.rm, pos = e.p.root.position;
    rm.state = 'walk'; rm.tx = x; rm.tz = z; rm.kindT = kind; rm.t = 25; rm.blockedT = 0;
    rm.narrow = Array.isArray(via);
    if (kind !== 'back') rm.loose = !!rm.exitLoose && (via === 'out' || via === 'in' || kind === 'job' || (rm.last === -2 && rm.hubOff)); // (on the keeper's own way out) // (a grid way: cells clear by 0.26 m, so the steps test a slimmer body)
    rm.route = Array.isArray(via) ? via.slice() : via && rm.hubOff && rm.exit?.length ? (via === 'out' ? rm.exit.slice() : rm.exit.slice().reverse()) : null;
    if (kind !== 'back') { rm.from = { x: pos.x, z: pos.z, last: rm.last }; rm.passed = []; }
  }
  function work(e) {
    const rm = e.rm, J = e.job;
    rm.state = 'work'; rm.worked = true; rm.last = -2;
    rm.t = J?.workFor ? rand(J.workFor[0], J.workFor[1]) * 0.7 : rand(6, 11);
    setMood(e, J?.mood || 'work');
  }
  function arrive(e) {
    const rm = e.rm;
    if (rm.kind === 'idle') return idleArrive(e);
    if (rm.kindT === 'back') { rm.last = rm.from?.last ?? -3; rm.state = 'idle'; rm.t = rand(0.6, 1.5); return; }
    if (rm.kindT === 'job') return work(e);
    if (rm.kindT === 'anchor') { rm.last = -1; rm.state = 'idle'; rm.t = rand(0.6, 2); return; }
    if (rm.kindT === 'meet') {
      const o = rm.partner;
      rm.last = -3;
      if (o?.rm?.partner === e) { rm.state = o.rm.state = 'chat'; rm.t = o.rm.t = rand(8, 15); stats.meets++; return; }
      rm.partner = null; rm.state = 'idle'; rm.t = rand(1, 2); return;
    }
    if (rm.kindT === 'dodge') { rm.last = -3; rm.state = 'idle'; rm.t = rand(0.8, 1.6); return; }
    rm.last = rm.next ?? -1;
    rm.state = 'look'; rm.t = rand(3, 8);
  }
  function endChat(e) {
    const rm = e.rm, o = rm.partner;
    // (a while before the next chat, and someone else next time: two neighbours do not talk all day)
    const cd = performance.now() + rand(20000, 40000);
    rm.meetCd = cd; rm.lastMet = o || null;
    if (o?.rm) { o.rm.meetCd = cd; o.rm.lastMet = e; }
    rm.partner = null;
    if (o?.rm?.partner === e) { o.rm.partner = null; o.rm.state = 'idle'; o.rm.t = rand(0.5, 2); }
  }

  // ---- one step of a walker toward (tx, tz), steering round people, Maya and the car
  function walkStep(e, dt) {
    const rm = e.rm, root = e.p.root, pos = root.position;
    const via = rm.route?.length ? rm.route[0] : null;
    let dx = (via ? via.x : rm.tx) - pos.x, dz = (via ? via.z : rm.tz) - pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.12) { if (via) { rm.passed?.push(rm.route.shift()); e.p.update(dt, { speed: rm.speed * 0.6 }); return; } arrive(e); stand(e, dt); return; }
    dx /= d; dz /= d;
    // the nearest thing ahead in the lane
    let side = 0, stop = false;
    const lane = (ox, oz, rr, head) => {
      const rx = ox - pos.x, rz = oz - pos.z, along = rx * dx + rz * dz;
      if (along <= 0 || along > Math.min(1.6, d + 0.4)) return;
      const lat = dx * rz - dz * rx; // + = to the left of the way
      if (Math.abs(lat) > rr + 0.15) return;
      if (along < rr * 0.8) stop = true;
      // keep right when it comes head on, else go round the side it is not on
      side = head ? -1 : lat > 0 ? -1 : 1;
    };
    for (const o of people.values()) {
      if (o === e || !o.ob) continue;
      const op = o.p.root.position;
      if (Math.abs(op.x - pos.x) > 2 || Math.abs(op.z - pos.z) > 2) continue;
      const head = o.rm?.state === 'walk' && ((o.rm.tx - op.x) * dx + (o.rm.tz - op.z) * dz) < 0;
      if (o === rm.partner && rm.kindT === 'meet') continue;
      lane(op.x, op.z, e.ob.r + o.ob.r, head);
    }
    if (M.on) lane(M.x, M.z, e.ob.r + 0.3, M.sp > 0.3 && (M.vx * dx + M.vz * dz) < 0);
    else lane(C.x, C.z, e.ob.r + 1.1, false);
    let vx = dx, vz = dz;
    if (side) { vx = dx + -dz * side * 0.9; vz = dz + dx * side * 0.9; const n = Math.hypot(vx, vz); vx /= n; vz /= n; }
    const want = Math.atan2(vx, vz);
    turnToward(root, want, dt, 7);
    const align = Math.max(0.15, Math.cos(wrap(want - root.rotation.y)));
    let sp = rm.speed * align * (d < 0.5 ? Math.max(0.45, d / 0.5) : 1);
    if (stop && !side) sp = 0;
    let moved = false;
    if (sp > 0) {
      const nx = pos.x + vx * sp * dt, nz = pos.z + vz * sp * dt;
      // (a sidestep may leave the checked line: test the step, and keep off the road)
      const dj = Math.hypot(nx - rm.ax, nz - rm.az);
      const br = rm.loose && dj < 2.6 ? -1 : dj < 1.3 ? 0.12 : rm.narrow ? 0.2 : BODY; // (round a job spot behind a counter; -1: the keeper's own way out, through the stall's open back)
      if ((br < 0 || !solid(nx, nz, br)) && (!side || roadDist(nx, nz) >= ROAD_KEEP - 0.5)) {
        pos.x = nx; pos.z = nz; moved = true;
      } else if (side) {
        const ax = pos.x + dx * sp * dt, az = pos.z + dz * sp * dt; // (no room to the side: straight on, if that is clear)
        if (!stop && (br < 0 || !solid(ax, az, br))) { pos.x = ax; pos.z = az; moved = true; }
      }
      // (standing in something already, put there by a day, a spawn or a squeeze: a step that does not go into its
      // core is a step out of it; from deep inside, any step)
      if (!moved && (br < 0 || (solid(pos.x, pos.z, br) && (!solid(nx, nz, 0.02) || solid(pos.x, pos.z, 0.02))))) { pos.x = nx; pos.z = nz; moved = true; }
    }
    if (moved) { e.ob.x = pos.x; e.ob.z = pos.z; rm.walked += sp * dt; stats.walkM += sp * dt; rm.blockedT = Math.max(0, rm.blockedT - dt); rm.stuckT = 0; }
    else {
      rm.blockedT += dt; rm.stuckT = (rm.stuckT || 0) + dt;
      // (wedged for good, walk after walk: back on the hub, but only out of sight, never a pop in view)
      if (rm.stuckT > 15 && rm.kind !== 'idle' && rm.hx != null && game.camera) {
        const v = e.rmV || (e.rmV = pos.clone());
        v.set(pos.x, 1, pos.z).project(game.camera);
        if (v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2) {
          pos.x = e.ob.x = rm.hx; pos.z = e.ob.z = rm.hz; rm.last = -1; rm.state = 'idle'; rm.t = rand(0.5, 1.5); rm.stuckT = 0; rm.route = null;
          stats.unstuck = (stats.unstuck || 0) + 1;
          e.p.update(dt, { speed: 0 });
          return;
        }
      }
    }
    e.p.update(dt, { speed: moved ? sp : 0 });
    // stuck (someone stands in the way for good, or a sidestep ran into a corner): somewhere else instead
    if (rm.blockedT > 2.5 || rm.t <= 0) {
      if (rm.kindT === 'meet') endChat(e);
      rm.blockedT = 0;
      if (rm.kind === 'idle') { rm.state = 'look'; rm.t = rand(1, 2.5); if (rm.kindT !== 'ihome') rm.goHome = true; return; } // (idleStep tries the way home again)
      if (rm.passed?.length && rm.kindT !== 'back' && rm.from) { go(e, rm.from.x, rm.from.z, 'back', rm.passed.slice().reverse()); return; } // (back the way it came)
      rm.last = -3;
      if (rm.kindT !== 'anchor' && lineOk(rm.hx, rm.hz, pos.x, pos.z, rm.hubOff ? 0 : 1.3)) go(e, rm.hx, rm.hz, 'anchor');
      else { rm.state = 'idle'; rm.t = rand(1.5, 3); }
    }
  }

  // ---- maya walks into them: a quick step aside
  function dodge(e) {
    const rm = e.rm, pos = e.p.root.position;
    if (!M.on || M.sp < 0.5 || (rm.state === 'walk' && rm.kindT === 'dodge')) return false;
    const ux = M.vx / M.sp, uz = M.vz / M.sp, rx = pos.x - M.x, rz = pos.z - M.z;
    const along = rx * ux + rz * uz, lat = ux * rz - uz * rx;
    if (along < 0.2 || along > 2.4 || Math.abs(lat) > 0.75) return false;
    const s = lat >= 0 ? 1 : -1; // (away from her line)
    for (const k of [s, -s]) {
      const tx = pos.x + -uz * k * 1.1, tz = pos.z + ux * k * 1.1;
      if (!solid(tx, tz) && lineOk(pos.x, pos.z, tx, tz)) {
        if (rm.state === 'chat' || rm.state === 'wait') endChat(e);
        setMood(e, null);
        go(e, tx, tz, 'dodge'); rm.t = 2.5; stats.dodges++;
        return true;
      }
    }
    return false;
  }

  // ---- the cast between scenes ('idle'): a few steps from their spot and back, never while the story may want them
  // Home is where the day left them (position and facing); a day that moves them (a walk, a ctl, a new spot) makes
  // that the new home. They stand on it (story.js's own standing: notice Maya, face home.h) during any scene, talk,
  // act or intro, while Maya is within IDLE_HOLD m on foot (IDLE_HOLD_CAR in the car), while the hint line is about
  // them, while small talk or a tap holds them, and while seated. Out of those: 6-14 s at home, then a stroll to one
  // of up to 3 points within R_IDLE (each with a clear straight line from home), a look round, and home again.
  let hintWho = null;
  function idleHeld(e, mdist) {
    if (M.busy || e === story.talkWith || e.paused || e.roamHold > performance.now() || (hintWho && hintWho === e.id)) return true;
    return M.on ? mdist < IDLE_HOLD : Math.hypot(C.x - e.p.root.position.x, C.z - e.p.root.position.z) < IDLE_HOLD_CAR;
  }
  function buildIdle(e) {
    const rm = e.rm;
    if (budget <= 0) return;
    budget--;
    for (let k = 0; k < PER_FRAME && rm.tried < 36 && rm.pts.length < 3; k++, rm.tried++) {
      const a = rm.tried * 2.39996 + Math.random() * 0.4, r = 1.2 + Math.random() * (rm.R - 1.2);
      const x = rm.ax + Math.sin(a) * r, z = rm.az + Math.cos(a) * r;
      if (solid(x, z, 0.42) || roadDist(x, z) < 1.5 || keepDoor(x, z) || rm.pts.some((p) => Math.hypot(p.x - x, p.z - z) < 1.2)) continue;
      if (!lineOk(rm.ax, rm.az, x, z, 0.6)) continue;
      rm.pts.push({ x, z, ...frontAt(x, z) });
    }
    if (rm.tried >= 36 || rm.pts.length >= 3) rm.built = true;
  }
  function keepDoor(x, z) {
    for (const d of doorList()) if (d && Math.hypot(x - d.x, z - d.z) < 2.0) return true;
    for (const pl of game.world?.places || []) if (pl.door && Math.hypot(x - pl.door.x, z - pl.door.z) < 2.0) return true;
    return false;
  }
  function idleArrive(e) {
    const rm = e.rm;
    if (rm.kindT === 'ihome') {
      rm.state = 'home'; rm.t = e.job ? rand(14, 28) : rand(6, 14); rm.goHome = false;
      if (e.job) e.life = null; // (story.js's lifeStep starts afresh from here: its walker set where she stands)
      if (rm.pose) e.p.setMood?.(rm.pose); // (back at work)
      return;
    }
    rm.state = 'look'; rm.t = rand(2.5, 6);
  }
  // (a day's job, story.js's lifeStep: it keeps them while 'home' (work, its own few steps); a stroll starts from
  // wherever that left them and comes back there, then lifeStep starts afresh from it)
  function idleStep(e, dt, near, mdist) {
    const rm = e.rm, root = e.p.root, pos = root.position, jobCast = !!e.job;
    // a day moved them (or gave them a new home or a new job): that is home now
    // (detached for a few seconds: the next scan takes the new spot as home, if they are still fit for it)
    const moved = (!jobCast || rm.state !== 'home') && Math.hypot(pos.x - rm.lx, pos.z - rm.lz) > 0.3;
    if (moved || (jobCast ? e.job !== rm.job0 : Math.hypot(e.home.x - rm.h0x, e.home.z - rm.h0z) > 0.3)) { detach(e); e.rmCool = performance.now() + 6000; return false; }
    const L = LIVE_PEOPLE.get(root);
    if (L && L.hips.position.y < L.hipY - 0.08) rm.seatT = performance.now() + 4000; // (a day's tick sat them down)
    const held = idleHeld(e, mdist) || rm.seatT > performance.now();
    if (rm.state === 'home') {
      if (!rm.built) buildIdle(e);
      rm.t -= dt;
      if (held) rm.t = Math.max(rm.t, rand(2, 4));
      if (rm.t <= 0 && rm.pts.length && !(jobCast && e.life?.state === 'walk')) {
        let i = Math.floor(Math.random() * rm.pts.length);
        if (i === rm.lastPt && rm.pts.length > 1) i = (i + 1) % rm.pts.length;
        const p = rm.pts[i];
        if (!jobCast || Math.hypot(pos.x - rm.ax, pos.z - rm.az) < 0.3 || lineOk(pos.x, pos.z, p.x, p.z, 0.6)) {
          rm.lastPt = i; rm.rx = pos.x; rm.rz = pos.z;
          if (rm.pose) e.p.setMood?.(null); // (the job pose put down for the walk)
          if (jobCast) { e.p.setMood?.(e.baseMood ?? null); if (e.life) e.life.mood = null; }
          go(e, p.x, p.z, 'iwp');
        } else rm.t = rand(2, 4);
      } else if (rm.t <= 0) rm.t = rand(4, 8);
      if (rm.state === 'home') { rm.lx = pos.x; rm.lz = pos.z; return false; } // (standing at home: story.js's own standing)
    }
    if ((held || rm.goHome) && !(rm.state === 'walk' && rm.kindT === 'ihome')) { go(e, rm.rx, rm.rz, 'ihome'); rm.goHome = false; }
    if (rm.state === 'walk') {
      const sp0 = rm.speed;
      if (held) rm.speed = Math.max(sp0, 1.25); // (wanted back: a brisk step)
      walkStep(e, dt);
      rm.speed = sp0;
      if (M.on && mdist < 3.2) headAt(e, M.x, M.z); else e.p.lookAt(null); // (home: story.js turns them to home.h)
    } else {
      const p = rm.pts[rm.lastPt];
      if (p) turnToward(root, p.h, dt, 3);
      if (M.on && mdist < 3.2) headAt(e, M.x, M.z); else if (p?.shop) headAt(e, pos.x + Math.sin(p.h) * 1.5, pos.z + Math.cos(p.h) * 1.5); else e.p.lookAt(null);
      stand(e, dt);
      rm.t -= dt;
      if (rm.t <= 0) go(e, rm.rx, rm.rz, 'ihome');
    }
    rm.lx = pos.x; rm.lz = pos.z;
    return true;
  }

  function step(e, dt, near) {
    const t0 = performance.now();
    try { return step1(e, dt, near); }
    catch (err) { if (!stats.err) console.error('roam', e.id, err); stats.err = (stats.err || 0) + 1; detach(e); e.noRoam = true; return false; } // (never break the frame: this one just stops roaming)
    finally { const ms = performance.now() - t0; stats.acc += ms; if (ms > 4) stats.spike = { id: e.id, ms: +ms.toFixed(1), st: e.rm?.state, k: e.rm?.kindT, built: !!e.rm?.built, grid: !!e.rm?.grid, bfs: !!e.rm?.bfs }; }
  }
  function step1(e, dt, near) {
    const rm = e.rm;
    if (!rm || story.inRoom) return false;
    const root = e.p.root, pos = root.position;
    // (far from Maya, off every screen: a step every 4th frame, with the frames' time, keeps the CPU down)
    if (Math.abs(M.x - pos.x) + Math.abs(M.z - pos.z) > 60) { rm.dtAcc = (rm.dtAcc || 0) + dt; rm.fk = (rm.fk || 0) + 1; if (rm.fk % 4) return true; dt = Math.min(0.12, rm.dtAcc); rm.dtAcc = 0; }
    if (rm.kind === 'idle') return idleStep(e, dt, near, Math.hypot(M.x - pos.x, M.z - pos.z));
    if (!rm.built) build(e);
    rm.t -= dt;
    const mdist = Math.hypot(M.x - pos.x, M.z - pos.z);
    // Maya is walking up to them (a tap): they stand and wait for her, like anyone she talks to
    if (e.roamHold && e.roamHold > performance.now()) {
      setMood(e, null);
      if (rm.state === 'walk') rm.state = 'idle';
      headAt(e, M.x, M.z);
      if (mdist < 2.6) turnToward(root, Math.atan2(M.x - pos.x, M.z - pos.z), dt, 3);
      stand(e, dt);
      return true;
    }
    // small talk is playing (extras-chatter set paused and home.h toward the other): stand facing them, a step closer if far
    if (e.paused) {
      setMood(e, null);
      dodge(e); // (Maya walking straight at the pair: a step aside, then on with the talk)
      let o = null, od = 6.5;
      for (const q of people.values()) if (q !== e && q.paused && q.p?.root) { const p = q.p.root.position, d = Math.hypot(p.x - pos.x, p.z - pos.z); if (d < od) { o = q; od = d; } }
      if (o && od > 2.3 && rm.state !== 'walk') { const p = o.p.root.position, k = (od - 1.6) / od; const tx = pos.x + (p.x - pos.x) * k, tz = pos.z + (p.z - pos.z) * k; if (lineOk(pos.x, pos.z, tx, tz)) go(e, tx, tz, 'dodge'); }
      if (rm.state === 'walk' && rm.kindT === 'dodge') { walkStep(e, dt); return true; }
      if (rm.state === 'walk') rm.state = 'idle';
      if (o) e.home.h = Math.atan2(o.p.root.position.x - pos.x, o.p.root.position.z - pos.z);
      turnToward(root, e.home.h, dt, 5);
      e.p.lookAt(null);
      stand(e, dt);
      return true;
    }
    if (dodge(e)) { /* stepping aside now */ }
    if (rm.state === 'walk') {
      walkStep(e, dt);
      if (M.on && mdist < 3.2) headAt(e, M.x, M.z); else e.p.lookAt(null);
      return true;
    }
    // standing: working, looking at a shop front, chatting, waiting for a friend, or a breath
    if (rm.state === 'work') {
      turnToward(root, rm.ah, dt, 4);
      if (e.job?.lookAt) headAt(e, e.job.lookAt.x, e.job.lookAt.z);
      else if (M.on && mdist < 3.2) headAt(e, M.x, M.z); else e.p.lookAt(null);
      if (M.on && near && mdist < 2.6) setMood(e, null); else setMood(e, e.job?.mood || 'work');
    } else if (rm.state === 'look') {
      const p = rm.pts[rm.last];
      if (p) turnToward(root, p.h, dt, 3);
      if (M.on && mdist < 3.2) headAt(e, M.x, M.z);
      else if (p?.shop) headAt(e, pos.x + Math.sin(p.h) * 1.5, pos.z + Math.cos(p.h) * 1.5); else e.p.lookAt(null);
    } else if (rm.state === 'chat' || rm.state === 'wait') {
      const o = rm.partner;
      if (!o || o.rm?.partner !== e || !o.p?.root?.parent) { rm.partner = null; rm.state = 'idle'; rm.t = rand(0.5, 1.5); }
      else {
        const op = o.p.root.position;
        turnToward(root, Math.atan2(op.x - pos.x, op.z - pos.z), dt, 4);
        headAt(e, op.x, op.z);
        if (rm.state === 'chat' && rm.t <= 0) { endChat(e); rm.state = 'idle'; rm.t = rand(0.5, 1.5); }
      }
    } else if (M.on && mdist < 3.2) { headAt(e, M.x, M.z); if (mdist < 2.4) turnToward(root, Math.atan2(M.x - pos.x, M.z - pos.z), dt, 2.5); }
    else e.p.lookAt(null);
    stand(e, dt);
    if (rm.t <= 0 && rm.state !== 'chat') {
      if (rm.state === 'wait') endChat(e);
      if (rm.built || rm.pts.length) choose(e); else rm.t = 0.3;
    }
    return true;
  }

  // ---- once a frame: Maya and the car; twice a second: who is free to roam
  let scanT = 0;
  story.ticks = story.ticks || [];
  story.ticks.unshift((dt) => { // (before the day's ticks: story.update has already moved everyone this frame)
    sense(dt || 0.016);
    stats.msFrame = stats.msFrame * 0.95 + stats.acc * 0.05; stats.msMax = Math.max(stats.msMax, stats.acc); stats.frames++; if (stats.acc > 3) stats.slow++; stats.acc = 0; stats.colMax = Math.max(stats.colMax, col); stats.colSum += col; col = 0; budget = 2; // (CPU per frame, ms)
    scanT -= dt || 0;
    if (scanT > 0) return;
    scanT = 0.5;
    doors = null;
    try { hintWho = story.hints?.current?.()?.who || null; } catch { hintWho = null; }
    for (const e of people.values()) {
      if (e.walking || (e.ctl && !e.walkIn)) { if (e.roam) detach(e); if (!e.folk) e.scriptedOnce = true; e.rmCool = performance.now() + 8000; continue; } // (a day moves them now: theirs from here on)
      if (e.walkIn || e.ctl) continue;
      const kind = freeKind(e);
      if (kind && !e.roam) attach(e, kind);
      else if (!kind && e.roam) detach(e);
    }
  });
  // Maya walking up to someone she tapped: they wait for her
  const approach0 = story.approach;
  if (typeof approach0 === 'function') story.approach = function (e) { if (e) e.roamHold = performance.now() + 12000; return approach0.call(this, e); };

  story.roam = {
    stats,
    debug: {
      list: () => [...people.values()].filter((e) => e.roam).map((e) => ({ id: e.id, st: e.rm.state, k: e.rm.kindT, pts: e.rm.pts.length, walked: +e.rm.walked.toFixed(1) })),
      /** why a walker's patch came out small: rejection counts over n candidates round its anchor */
      why(id, n = 60) {
        const e = people.get(id), rm = e?.rm;
        if (!rm) return null;
        const c = { ok: 0, solid: 0, road: 0, dist: 0, keep: 0, line: 0, anchorSolid: solid(rm.ax, rm.az, 0.12), anchorDist: rm.dist, ax: +rm.ax.toFixed(1), az: +rm.az.toFixed(1), hub: rm.hx != null ? [+rm.hx.toFixed(1), +rm.hz.toFixed(1)] : null };
        for (let i = 0; i < n; i++) {
          const a = i * 2.39996, r = 2 + Math.sqrt((i + 0.5) / n) * (rm.R - 2), x = rm.ax + Math.sin(a) * r, z = rm.az + Math.cos(a) * r;
          if (solid(x, z, 0.42)) c.solid++; else if (roadDist(x, z) < ROAD_KEEP) c.road++; else if (districtOf(x, z) !== rm.dist) c.dist++; else if (keepOut(x, z, e.id)) c.keep++;
          else if (!lineOk(rm.hx ?? rm.ax, rm.hz ?? rm.az, x, z, rm.hx != null ? 0 : 1.3)) c.line++; else c.ok++;
        }
        return c;
      },
    },
  };
  return story.roam;
}
