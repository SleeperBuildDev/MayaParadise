// Room entry framing (doors.js): the first frame inside a room shows Maya and everyone in it. The room camera
// is the same close, low follow camera (ROOM_VIEW, doors.js roomCam); on the way in it is only nudged:
//   - sideways (the look point slides toward where the people are, inside the side walls), and
//   - a little wider (at most WIDEN x the close view's width, never the whole-room view),
// picked so nobody is cut at the frame's edge, Maya's head never covers a resident's face, and the view stays
// as close as it can. Someone who cannot fit even then is left fully out of frame rather than cut in half.
// The framing holds while she walks in and stands on her first spot; once she walks off it (> LEAVE m) the
// camera eases back to the plain close follow (doors.js roomCam with the day's own adjustments).
//
//   const ef = createEntryFrame(game)
//   ef.start(R, spot, V, limits)  spot = { x, z } where she will stand; V = the view (ROOM_VIEW + the day's
//                                 over); limits(width) -> { slide, minZ, maxZ } (doors.js's look-point range)
//   ef.reframe(V)                 a day changed the view (doors.roomCam(over)): fit again with it
//   ef.tick() -> bool             per frame; true once she has walked off (doors.js then calls roomCam)
//   ef.stop(), ef.active, ef.last (the last fit, for tests: { w, base, cx, lz, cost, base cost, people })
import * as THREE from '../../game/three.js';

const WIDEN = 1.55; // the widest the entry view may get, x the close view's width
const WIDEST = 4.3; // ...or, on a phone held upright, this many metres if that is more (ROOM_VIEW is 3.25)
const LEAVE = 0.6; // metres off her first spot before the camera goes back to the plain close follow
// the safe frame in NDC: inside the side edges, under the top bar, heads above the room buttons
const SAFE = { x: 0.92, top: 0.78, headLow: -0.5, low: -0.78 };

export function createEntryFrame(game) {
  const cam2 = new THREE.PerspectiveCamera();
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  let st = null; // { R, spot, V, limits, anchor, t0, people, maya }

  /** Every person standing in the room (people.js roots carry userData.isPerson), Maya apart. */
  function persons(root, maya) {
    const out = [];
    const walk = (o) => {
      if (!o.visible || o === maya) return;
      if (o.userData?.isPerson) { out.push(o); return; }
      for (const c of o.children) walk(c);
    };
    walk(root);
    return out;
  }
  /** a box's 8 corners */
  const corners = (b) => {
    const a = [];
    for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) a.push(new THREE.Vector3(x, y, z));
    return a;
  };
  function shape(o, at = null) {
    o.updateMatrixWorld(true);
    box.setFromObject(o);
    if (box.isEmpty()) return null;
    const b = box.clone();
    const p = o.getWorldPosition(new THREE.Vector3());
    // what a person carries (an open umbrella, a tray, a broom) is not them: the body is kept to a person's
    // size round where they stand (someone lying down keeps their length)
    const lying = b.max.y - b.min.y < 0.8 && Math.max(b.max.x - b.min.x, b.max.z - b.min.z) > 1.0;
    if (!lying) {
      b.min.x = Math.max(b.min.x, p.x - 0.42); b.max.x = Math.min(b.max.x, p.x + 0.42);
      b.min.z = Math.max(b.min.z, p.z - 0.42); b.max.z = Math.min(b.max.z, p.z + 0.42);
      b.max.y = Math.min(b.max.y, b.min.y + 1.7);
    }
    // the head: people.js names its head bone 'head' (the cube and the hair under it); else the top third
    const hb = o.getObjectByName?.('head');
    let head = null;
    if (hb) { head = new THREE.Box3().setFromObject(hb); if (head.isEmpty()) head = null; }
    if (!head) {
      head = b.clone();
      head.min.y = b.max.y - (b.max.y - b.min.y) * 0.36;
      const sx = (head.max.x - head.min.x) * 0.12, sz = (head.max.z - head.min.z) * 0.12;
      head.min.x += sx; head.max.x -= sx; head.min.z += sz; head.max.z -= sz;
    }
    if (at) { const d = new THREE.Vector3(at.x - p.x, 0, at.z - p.z); b.translate(d); head.translate(d); }
    return { body: corners(b), head: corners(head), c: b.getCenter(new THREE.Vector3()) };
  }
  function rect(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, behind = false;
    for (const p of pts) {
      v.copy(p).project(cam2);
      if (v.z > 1) behind = true;
      x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
    }
    return { x0, y0, x1, y1, behind };
  }

  /** How a candidate view reads: lower is better. */
  function cost(w, cx, lz, base, wantX) {
    const { V } = st;
    const cam = game.rig.camera;
    const t = THREE.MathUtils.degToRad(V.tilt);
    const ly = V.height;
    const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * cam.aspect);
    const d = (w * (game.rig.follow?.zoom || 1)) / 2 / Math.tan(hfov / 2);
    cam2.position.set(cx, ly + Math.sin(t) * d, lz + Math.cos(t) * d);
    cam2.lookAt(cx, ly, lz);
    cam2.updateMatrixWorld(true);
    let c = 0, cut = 0, out = 0, hid = 0;
    const M = st.maya;
    const mr = rect(M.body);
    // (what of her actually covers someone: the box less its loose edges; her hair falls to her knees)
    const mw = (mr.x1 - mr.x0) * 0.14;
    const mh = { x0: mr.x0 + mw, x1: mr.x1 - mw, y0: mr.y0, y1: mr.y1 - (mr.y1 - mr.y0) * 0.04 };
    // Maya herself: fully in (she is who the player steers)
    if (mr.x0 < -SAFE.x || mr.x1 > SAFE.x || mr.y1 > SAFE.top || mr.y0 < SAFE.low) c += 20;
    const md = cam2.position.distanceTo(M.c);
    const shown = []; // (in frame: { f face rect, b body rect, d distance }) for one resident in front of another
    const faceOf = (hr) => { const fw = (hr.x1 - hr.x0) * 0.2, fh = hr.y1 - hr.y0; return { x0: hr.x0 + fw, x1: hr.x1 - fw, y0: hr.y0 + fh * 0.05, y1: hr.y1 - fh * 0.3 }; };
    const covers = (f, r, k) => { const ox = Math.min(f.x1, r.x1) - Math.max(f.x0, r.x0), oy = Math.min(f.y1, r.y1) - Math.max(f.y0, r.y0); return ox > 0 && oy > 0 && (ox * oy) / ((f.x1 - f.x0) * (f.y1 - f.y0) || 1) > k; };
    for (const P of st.people) {
      const br = rect(P.body), hr = rect(P.head);
      const fullyOut = br.x1 < -SAFE.x || br.x0 > SAFE.x || br.y0 > SAFE.top || br.y1 < SAFE.low || br.behind;
      const headIn = hr.x0 >= -SAFE.x && hr.x1 <= SAFE.x && hr.y1 <= SAFE.top && hr.y0 >= SAFE.headLow;
      const bodyIn = br.x0 >= -SAFE.x - 0.02 && br.x1 <= SAFE.x + 0.02 && br.y0 >= SAFE.low - 0.05;
      if (fullyOut) { out++; continue; }
      if (!headIn || !bodyIn) { cut++; continue; }
      // their face (the head's middle and lower part: the top of a head is hair); her body in front of it?
      const f = faceOf(hr), d = cam2.position.distanceTo(P.c);
      if (d > md && covers(f, mh, 0.3)) hid++;
      shown.push({ f, b: br, d });
    }
    // one resident's head or body in front of another's face (a customer at the table before the tea-maker)
    let behind = 0;
    for (const a of shown) for (const b of shown) if (a !== b && a.d > b.d + 0.3 && covers(a.f, b.b, 0.4)) behind++;
    c += cut * 4 + out * 2.6 + hid * 4 + behind * 2 + ((w - base) / base) * 3 + Math.abs(cx - wantX) * 0.35;
    return { c, cut, out, hid, behind };
  }

  function fit() {
    const { R, spot, V, limits } = st;
    const cam = game.rig.camera;
    const key = cam.aspect < 1 ? 'width' : 'widthLandscape';
    const base = V[key];
    cam2.fov = cam.fov; cam2.aspect = cam.aspect; cam2.near = cam.near; cam2.far = cam.far;
    cam2.updateProjectionMatrix();
    const scene = R.scene;
    const maya = game.maya.root;
    st.maya = shape(maya, spot);
    st.people = persons(scene, maya).map((o) => shape(o)).filter(Boolean);
    if (!st.maya) return null;
    const lzFor = (w) => { const L = limits(w); return { L, lz: Math.max(L.minZ, Math.min(L.maxZ, spot.z)) }; };
    // the plain close follow first: nothing to do when it already shows everyone well
    const b0 = lzFor(base);
    const x0 = Math.max(-b0.L.slide, Math.min(b0.L.slide, spot.x));
    const plain = cost(base, x0, b0.lz, base, x0);
    let best = { w: base, cx: x0, lz: b0.lz, ...plain };
    if (st.people.length && (plain.cut || plain.out || plain.hid || plain.behind)) {
      // (a day's own tighter close view, Day 12's, may still open up as far as the usual view's widest)
      const top = Math.max(base * WIDEN, cam.aspect < 1 ? WIDEST : 0);
      for (let w = base; w <= top + 1e-6; w += base * 0.05) {
        const { L, lz } = lzFor(w);
        for (let dx = -1.8; dx <= 1.8 + 1e-6; dx += 0.1) {
          const cx = Math.max(-L.slide, Math.min(L.slide, spot.x + dx));
          const r = cost(w, cx, lz, base, x0);
          if (r.c < best.c - 1e-6) best = { w, cx, lz, ...r };
        }
      }
    }
    st.last = { w: +best.w.toFixed(2), base, cx: +best.cx.toFixed(2), lz: +best.lz.toFixed(2), cost: +best.c.toFixed(2), cut: best.cut, out: best.out, hid: best.hid, behind: best.behind,
      plain: { cut: plain.cut, out: plain.out, hid: plain.hid, behind: plain.behind }, people: st.people.length };
    // only a clean frame is worth leaving the plain close view for: a crowd that cannot all fit (a hall full
    // of people, a talk about to start) keeps the view the room was staged for
    const clean = !best.cut && !best.hid;
    st.last.used = clean;
    return { key, ...best, changed: clean && (best.w !== base || Math.abs(best.cx - x0) > 0.05) };
  }

  function apply() {
    const f = fit();
    if (!f || !f.changed) { st.held = false; return false; }
    // the look point pinned where the fit put it (bounds of zero size), the view that much wider
    game.rig.setFollow({ ...st.V, [f.key]: f.w, bounds: { minX: f.cx, maxX: f.cx, minZ: f.lz, maxZ: f.lz } });
    st.held = true;
    return true;
  }

  const ef = {
    get active() { return !!st?.held; },
    get last() { return st?.last || null; },
    start(R, spot, V, limits) {
      st = { R, spot: { x: spot.x, z: spot.z }, V, limits, anchor: null, t0: performance.now(), held: false, last: null };
      try { return apply(); } catch (e) { console.warn('entry frame', e); st.held = false; return false; }
    },
    reframe(V) {
      if (!st?.held) return false;
      st.V = V;
      try { return apply(); } catch (e) { console.warn('entry frame', e); return false; }
    },
    tick() {
      if (!st?.held) return false;
      const p = game.maya.root.position;
      if (!st.anchor) {
        // she is still walking in: the anchor is her first spot once she gets there (or after 3 s)
        if (Math.hypot(p.x - st.spot.x, p.z - st.spot.z) < 0.25 || performance.now() - st.t0 > 3000) st.anchor = { x: p.x, z: p.z };
        return false;
      }
      if (Math.hypot(p.x - st.anchor.x, p.z - st.anchor.z) > LEAVE) { st.held = false; return true; }
      return false;
    },
    stop() { st = null; },
    /** (tests) the people's on-screen boxes under the real camera now: [{ body, head }] NDC rects, Maya first */
    probe() {
      if (!st) return null;
      const cam = game.rig.camera;
      cam2.copy(cam);
      cam2.updateMatrixWorld(true);
      const r4 = (q) => [q.x0, q.y0, q.x1, q.y1].map((n) => +n.toFixed(2));
      const m = shape(game.maya.root);
      return [m, ...st.people].map((P) => ({ body: r4(rect(P.body)), head: r4(rect(P.head)) }));
    },
  };
  return ef;
}
