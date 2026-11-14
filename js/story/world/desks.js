// Bookmark Desks (GAME-PLAN 4.6): a small roadside writing desk under a lamp post, a maroon bookmark
// ribbon lying flat on the paper behind it. Reaching one in person and tapping it stands the ribbon up
// (a little over three metres, leaning back away from the street, a gold sparkle, a paper plane on its
// tip pointing home) and lights the lamp; unlocked desks are saved (save.flags['desk:<id>']) and can be
// travelled to from the map.
//
//   const desks = createDesks(game, { save, persist })
//   desks.list                      [{ id, name, x, z, ry, unlocked, front: {x, z}, foot: {x, z} }]
//   desks.at(screenX, screenY)      the desk under a tap (or null)
//   desks.unlock(id) -> Promise     the ribbon rises
//   desks.update(dt, t, px, pz)     the rise animation, visibility by distance (a desk at rest is one baked
//                                   mesh); a raised ribbon standing between the camera and her is tucked away
//   desks.holdRibbons               true: never tuck a ribbon away (the desk scene films it on purpose)
//   desks.obstacles                 keep-out shapes (for the walker)
//
// The desks come from every district file (regions/<id>.js DESKS: { id, name, x, z, ry, unlocked?, inRoom? }).
// An `inRoom` desk stands inside a room (the room draws it): nothing is drawn outdoors, and the map's
// page-turn puts Maya at its x, z (outside the room's door).
import * as THREE from '../../game/three.js';
import { mergeGeometries } from '../../game/three.js';
import { toon, outlineMaterial } from '../../game/toon.js';
import { Geo } from './kit.js';
import { deskBase, itemObstacles } from './build.js';
import { DESKS } from './region.js';

export const RIBBON = { len: 3.3, w: 0.42, lean: 0.17 };
/** Where the ribbon's foot stands, in the desk's own frame: behind the desk's east end (away from the street). */
const FOOT = { x: 0.68, z: -0.62 };
const MAT = toon('#ffffff', { vertexColors: true }), OUT = outlineMaterial(1.5);
const LIMP_YAW = 1.12; // radians: lying flat, the ribbon points east-south-east from its foot (beside the desk)
const LIMP_LEN = 0.34; // lying, it is folded to about a third
const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);

function ribbonGeo(planeYaw) {
  // built standing up along +Y from its foot: a cloth band with a slight wave, gold stitching on both
  // faces, a forked tail at the top and a folded paper plane perched on the tip, pointing home (baked in:
  // one draw call per ribbon)
  const g = new Geo({ outline: true, cap: 320 });
  const RIB = '#8C2A38', RIB2 = '#7A2230', L = RIBBON.len, W = RIBBON.w;
  const n = 6, seg = (L - 0.3) / n;
  g.box(0, 0.05, 0, W + 0.12, 0.1, 0.16, '#6B4A2E'); // a little wooden clamp at the foot
  for (let i = 0; i < n; i++) {
    const x = Math.sin(i * 1.1) * 0.035;
    g.box(x, seg * (i + 0.5), 0, W, seg + 0.02, 0.04, i % 2 ? RIB : RIB2);
    if (i % 2 === 0) for (const sz of [-1, 1]) g.box(x, seg * (i + 0.5), sz * 0.024, W - 0.14, 0.04, 0.008, '#C9A24A'); // gold stitch
  }
  // forked tail: two tongues, splayed
  for (const sx of [-1, 1]) g.boxR(sx * 0.1, L - 0.15, 0, W / 2 - 0.02, 0.36, 0.04, RIB2, 0, 0, sx * 0.22);
  // the paper plane on the tip
  const c = Math.cos(planeYaw), s = Math.sin(planeYaw), y = L + 0.12;
  const at = (lx, lz) => [lx * c + lz * s, -lx * s + lz * c];
  g.boxR(0, y, 0, 0.04, 0.08, 0.56, '#FFFDF8', 0, planeYaw, 0);
  for (const sx of [-1, 1]) { const [px, pz] = at(sx * 0.14, -0.03); g.boxR(px, y + 0.03, pz, 0.26, 0.015, 0.38, '#F6F0E2', 0, planeYaw + sx * 0.25, sx * 0.12); }
  return g;
}

export function createDesks(game, { save, persist, scene }) {
  const list = [];
  const obstacles = [];
  const v = new THREE.Vector3();
  const home = DESKS.find((d) => d.unlocked) || DESKS[0];
  for (const d of DESKS) {
    const it = { k: 'desk', x: d.x, z: d.z, ry: d.ry || 0 };
    const group = new THREE.Group();
    group.name = 'desk ' + d.id;
    const g = new Geo({ outline: true, cap: 640 });
    const ctx = { glows: [] };
    g.at(d.x, d.z, d.ry || 0);
    deskBase(g, ctx);
    // the lamp's core: a dim box inside; lit desks get a bright one from the land's shared glow pool
    g.at(0, 0, 0);
    g.box(ctx.glows[0], ctx.glows[1], ctx.glows[2], 0.22, 0.26, 0.22, '#E9D9B0');
    const baseGeo = { body: g.geometry(), outline: g.outlineGeometry() };
    const base = meshOf(baseGeo);
    group.add(base);
    // the ribbon: a pivot at its foot (behind the desk); lying limp = laid flat on the paper, folded short
    const c = Math.cos(d.ry || 0), s = Math.sin(d.ry || 0);
    const foot = { x: d.x + FOOT.x * c + FOOT.z * s, z: d.z - FOOT.x * s + FOOT.z * c };
    const pivot = new THREE.Group();
    pivot.position.set(foot.x, 0.03, foot.z);
    pivot.rotation.order = 'YXZ'; // lay it down (X), then turn it (Y)
    pivot.rotation.y = d.ry || 0;
    const rg = ribbonGeo(Math.atan2(home.x - foot.x, home.z - foot.z) - (d.ry || 0));
    const ribGeo = { body: rg.geometry(), outline: rg.outlineGeometry() };
    const ribbon = meshOf(ribGeo);
    pivot.add(ribbon);
    group.add(pivot);
    scene.add(group);
    const unlocked = !!(d.unlocked || save.flags['desk:' + d.id]);
    if (d.unlocked && !save.flags['desk:' + d.id]) { save.flags['desk:' + d.id] = true; persist(); }
    // in front of the desk (where Maya stands to write; the camera side)
    const front = { x: d.x + 0.0 * c + 1.15 * s, z: d.z + 1.15 * c };
    const inRoom = d.inRoom || null;
    if (inRoom) { front.x = d.x; front.z = d.z; group.visible = false; }
    const entry = { id: d.id, name: d.name, x: d.x, z: d.z, ry: d.ry || 0, foot, front, unlocked, inRoom, group, glowAt: ctx.glows.slice(0, 3), pivot, ribbon, base, baseGeo, ribGeo, still: null, rise: unlocked ? 1 : 0, rising: null, tucked: false };
    list.push(entry);
    if (!inRoom) obstacles.push(...itemObstacles(it), { type: 'circle', x: foot.x, z: foot.z, r: 0.28 });
    pose(entry, 0);
    bake(entry);
  }

  // A desk at rest (limp or raised) is ONE mesh: the base and the posed ribbon merged (two draw calls
  // with the outline). While its ribbon rises, the base and the moving ribbon are drawn separately.
  function meshOf(geo) {
    const m = new THREE.Mesh(geo.body, MAT);
    const o = new THREE.Mesh(geo.outline, OUT);
    o.userData.isOutline = true; o.raycast = () => {};
    m.add(o);
    return m;
  }
  function freeStill(e) {
    if (!e.still) return;
    e.group.remove(e.still);
    e.still.geometry.dispose(); e.still.children[0].geometry.dispose();
    e.still = null;
  }
  function bake(e) {
    freeStill(e);
    e.pivot.updateMatrix();
    const m = e.pivot.matrix;
    const rb = e.ribGeo.body.clone().applyMatrix4(m), ro = e.ribGeo.outline.clone().applyMatrix4(m);
    e.still = meshOf({ body: mergeGeometries([e.baseGeo.body, rb]), outline: mergeGeometries([e.baseGeo.outline, ro]) });
    rb.dispose(); ro.dispose();
    e.group.add(e.still);
    e.base.visible = false; e.pivot.visible = false;
    e.tucked = false;
  }
  function unbake(e) {
    freeStill(e);
    e.base.visible = true; e.pivot.visible = true;
  }

  function pose(e, t) {
    const k = e.rise;
    // limp: lying flat, folded to a third; raised: standing, leaning back a little (with an overshoot)
    const ease = k < 1 ? 1 - Math.pow(1 - k, 3) * (1 - 2.2 * k * (1 - k)) : 1;
    const wob = k > 0 && k < 1 ? Math.sin(t * 9) * 0.04 * (1 - k) : 0;
    e.pivot.rotation.x = -RIBBON.lean + (Math.PI / 2 + RIBBON.lean) * (1 - ease) + wob;
    e.pivot.rotation.y = e.ry + LIMP_YAW * (1 - Math.min(1, ease));
    e.pivot.rotation.z = wob * 0.5;
    e.pivot.scale.y = LIMP_LEN + (1 - LIMP_LEN) * Math.min(1.08, ease);
  }
  // a raised ribbon right between the lens and her (or the car) would fill the screen: tuck it away
  // (the desk alone is drawn) until the view clears
  function blocks(d, cam, px, pz) {
    const ax = cam.x, az = cam.z, bx = px - ax, bz = pz - az, l2 = bx * bx + bz * bz;
    if (l2 < 1) return false;
    const t = ((d.foot.x - ax) * bx + (d.foot.z - az) * bz) / l2;
    if (t < 0.02 || t > 0.97) return false;
    const side = Math.hypot(ax + bx * t - d.foot.x, az + bz * t - d.foot.z);
    if (side > 1.25 + 0.6 * (1 - t)) return false;
    const sight = cam.y + (0.9 - cam.y) * t; // height of the line of sight above the foot
    return sight < RIBBON.len + 0.4;
  }
  function tuck(d, on) {
    if (d.tucked === on || !d.still) return;
    d.tucked = on;
    d.still.visible = !on;
    d.base.visible = on;
  }
  let onGlow = null;

  const desks = {
    list,
    obstacles,
    holdRibbons: false,
    byId: (id) => list.find((d) => d.id === id),
    /** The desk whose body or ribbon is under a screen tap (CSS px), or null. */
    at(x, y) {
      let best = null, bd = 56;
      for (const d of list) {
        if (!d.group.visible) continue;
        for (const [px, py, pz] of [[d.x, 0.9, d.z], [d.foot.x + 0.8, 0.1, d.foot.z], [d.foot.x, 1.8 * d.rise, d.foot.z]]) {
          const q = game.rig.project(v.set(px, py, pz), game.viewW, game.viewH);
          if (q) { const dd = Math.hypot(q.x - x, q.y - y); if (dd < bd) { bd = dd; best = d; } }
        }
      }
      return best;
    },
    unlock(id) {
      const d = desks.byId(id);
      if (!d || d.unlocked) return Promise.resolve(false);
      d.unlocked = true;
      onGlow?.();
      save.flags['desk:' + id] = true;
      persist();
      if (d.inRoom) { d.rise = 1; return Promise.resolve(true); } // (the room shows its own ribbon rising)
      unbake(d);
      return new Promise((res) => { d.rising = { t: 0, res }; });
    },
    /** Lit lamp cores [x, y, z, ...] (the streamer draws them with the land's own glows). */
    glows(out = []) {
      out.length = 0;
      for (const d of list) if (d.unlocked && !d.inRoom) out.push(d.glowAt[0], d.glowAt[1], d.glowAt[2]);
      return out;
    },
    set onGlowChange(f) { onGlow = f; },
    update(dt, t, px, pz) {
      for (const d of list) {
        // (the camera looks north from the south: a desk well behind it, or far ahead in the haze, is not drawn)
        d.group.visible = !d.inRoom && d.z > pz - 34 && d.z < pz + 16 && Math.abs(d.x - px) < 60;
        if (!d.group.visible) continue;
        if (d.still && d.rise >= 1) tuck(d, !desks.holdRibbons && blocks(d, game.camera.position, px, pz));
        if (d.rising) {
          d.rising.t += dt;
          d.rise = Math.min(1, d.rising.t / 1.6);
          if (d.rising.t > 0.2 && !d.rising.burst) {
            d.rising.burst = true;
            call(game.fx, 'burst', 'sparkle', v.set(d.foot.x, 0.8, d.foot.z), { count: 14, spread: 0.7, up: 1.4 });
          }
          if (d.rise >= 1) {
            call(game.fx, 'burst', 'sparkle', v.set(d.foot.x, RIBBON.len + 0.2, d.foot.z - RIBBON.len * Math.sin(RIBBON.lean)), { count: 18, spread: 0.8, up: 0.8 });
            call(game.audio, 'play', 'chime');
            const r = d.rising.res; d.rising = null;
            pose(d, t);
            bake(d);
            r(true);
          }
          if (d.rising) pose(d, t);
        }
      }
    },
  };
  return desks;
}
