// Day 7 helpers: walk-on people who are not in cast.js, a speaker name for them, moving people along the
// streets, keep-out shapes the page can take away again, and the pencil-to-gold "look" labels (the back
// row, the changed street): a pencil word sits on the thing itself (what was heard or expected) and inks
// gold when the player taps it (what is seen). No arrows, no rings, no route: the labels stand only on
// the things in view, after a person has named the place.
import * as THREE from '../game/three.js';
import { mergeGeometries } from '../game/three.js';
import { tr } from '../game/ui.js';
import { createPerson } from './people.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);

/** Looks for the day's walk-ons (people.js specs; all invented). */
export const LOOKS = {
  chorus1: { age: 'child', skin: 3, hair: 'short', top: 'school', bottom: 'schoolLongyi', seed: 3 },
  chorus2: { age: 'child', skin: 1, hair: 'braid', top: 'school', bottom: 'schoolSkirt', extras: ['thanaka'], seed: 5 },
  child: { age: 'child', build: 'slim', skin: 2, hair: 'bob', top: 'tee', topColor: 'coral', bottom: 'shorts', bottomColor: 'navy', extras: ['thanaka'] },
  pierChild: { age: 'child', build: 'slim', skin: 3, hair: 'bob', top: 'blouse', topColor: 'sky', bottom: 'htamein', bottomColor: 'teal' },
  handA: { age: 'adult', build: 'wide', skin: 4, hair: 'cap', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'olive', check: true, extras: ['towel'], extraColor: 'tan' },
  handB: { age: 'adult', build: 'slim', skin: 3, hair: 'short', top: 'tee', topColor: 'grey', bottom: 'longyi', bottomColor: 'navy', extras: ['towel'], extraColor: 'cream' },
};

/** A walk-on that only stands, turns and walks (not tappable). */
export function extra(look, at, parent) {
  const p = createPerson(look);
  p.root.position.set(at.x, at.y ?? 0, at.z);
  p.root.rotation.y = at.h ?? at.heading ?? 0;
  p.root.userData.isPerson = true;
  parent.add(p.root);
  let path = null, speed = 1.2, done = null;
  const o = {
    p,
    get moving() { return !!path; },
    walk(pts, sp = 1.2) {
      path = pts.slice(); speed = sp;
      return new Promise((r) => { done = r; });
    },
    update(dt, lookAt = null) {
      let sp = 0;
      if (path && path.length) {
        const pos = p.root.position, tgt = path[0];
        const dx = tgt.x - pos.x, dz = tgt.z - pos.z, d = Math.hypot(dx, dz);
        const step = speed * dt;
        if (d <= step) { pos.x = tgt.x; pos.z = tgt.z; path.shift(); }
        else { pos.x += (dx / d) * step; pos.z += (dz / d) * step; turn(p.root, Math.atan2(dx, dz), dt, 10); }
        sp = speed;
        if (!path.length) { path = null; const r = done; done = null; r?.(); }
      }
      p.lookAt(lookAt);
      p.update(dt, { speed: sp });
    },
    // (idempotent: a walk-on that walked off and freed itself may be freed again when the page turns;
    // a second people.js dispose would take the shared outline material's count below zero)
    dispose() { if (o.gone) return; o.gone = true; path = null; p.root.removeFromParent(); p.dispose(); },
  };
  return o;
}

/**
 * A walk-on the player can tap and talk to (a bridge hand): an entry in story.people, so taps, the
 * two-shot and day.talk[id] all work. Remove it with removeFake (never story.remove: it has no obstacle).
 */
export function fakePerson(story, id, look, name, at) {
  const p = createPerson(look);
  p.root.position.set(at.x, 0, at.z);
  p.root.rotation.y = at.h ?? 0;
  p.root.userData.isPerson = true;
  story.game.world.scene.add(p.root);
  const e = { id, cast: { id, name, look, hello: null }, p, home: { x: at.x, z: at.z, h: at.h ?? 0 }, ob: { type: 'circle', x: at.x, z: at.z, r: p.radius || 0.3, person: id }, onTalk: null, walking: null, fake: true };
  story.people.set(id, e);
  return e;
}
export function removeFake(story, id) {
  const e = story.people.get(id);
  if (!e?.fake || e.gone) return;
  e.gone = true;
  e.p.root.removeFromParent();
  e.p.dispose();
  story.people.delete(id);
}

/** Say lines as someone whose name is not in cast.js (the dialogue box shows `name`). */
export async function sayAs(story, id, name, lines, opts = {}) {
  const pr = story.dialog.say(id, lines, opts);
  const el = document.querySelector('#dialog .dialog-name');
  if (el) el.textContent = tr(name);
  await pr;
}

/** Drive a townsperson (story.people entry) along street points; resolves on arrival. */
export function moveAlong(e, pts, speed = 1.3) {
  if (!e) return Promise.resolve();
  e.walking = null;
  const path = pts.slice();
  return new Promise((resolve) => {
    e.ctl = (dt) => {
      const pos = e.p.root.position;
      let sp = 0;
      if (path.length) {
        const tgt = path[0];
        const dx = tgt.x - pos.x, dz = tgt.z - pos.z, d = Math.hypot(dx, dz), step = speed * dt;
        if (d <= step) { pos.x = tgt.x; pos.z = tgt.z; path.shift(); } else { pos.x += (dx / d) * step; pos.z += (dz / d) * step; turn(e.p.root, Math.atan2(dx, dz), dt, 10); }
        sp = speed;
      }
      e.ob.x = pos.x; e.ob.z = pos.z;
      e.p.lookAt(null);
      e.p.update(dt, { speed: sp });
      if (!path.length) {
        e.ctl = null;
        e.home = { x: pos.x, z: pos.z, h: e.p.root.rotation.y };
        resolve();
      }
    };
  });
}

export function turn(obj, h, dt, rate) {
  let d = h - obj.rotation.y;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  obj.rotation.y += d * (1 - Math.exp(-dt * rate));
}

/**
 * Keep-out shapes for the open world's walker (space.add; it has no remove: a taken-away shape is moved
 * far off the land, so it never collides again).
 */
export function keepOuts(story) {
  const mine = [];
  const space = story.openWorld?.space;
  return {
    add(list) {
      for (const o of list) {
        mine.push(o);
        if (space) space.add([o]); else story.foot.obstacles.push(o);
      }
    },
    clear() {
      space?.remove?.(mine);
      for (const o of mine) {
        if (o.type === 'circle') { o.x = 1e7; o.z = 1e7; o.r = 0; } else { o.minX = o.maxX = 1e7; o.minZ = o.maxZ = 1e7; }
        const k = story.foot.obstacles.indexOf(o); if (k >= 0 && !space) story.foot.obstacles.splice(k, 1);
      }
      mine.length = 0;
    },
  };
}

/**
 * Pencil labels on things in view; each inks gold when tapped and shows its gold line under it.
 * items: [{ id, x, y, z, pencil: {my,en}, gold: {my,en}, done? }]
 * -> { done: Promise<void> (all tapped), dispose(), onTap(fn) }
 */
export function lookLabels(game, items, { onTap = null } = {}) {
  injectLookStyle();
  const wrap = document.createElement('div');
  wrap.className = 'd7-looks';
  const v = new THREE.Vector3();
  let resolveAll;
  const done = new Promise((r) => { resolveAll = r; });
  const els = items.map((it) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'd7-look' + (it.done ? ' gold' : '');
    b.innerHTML = '<span class="pencil"></span><span class="gold"></span>';
    b.querySelector('.pencil').textContent = tr(it.pencil);
    b.querySelector('.gold').textContent = tr(it.gold);
    b.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (b.classList.contains('gold')) return;
      b.classList.add('gold');
      call(game.audio, 'play', 'chalk');
      it.done = true;
      onTap?.(it.id);
      if (items.every((x) => x.done)) setTimeout(resolveAll, 1600);
    });
    wrap.appendChild(b);
    return b;
  });
  document.getElementById('game').appendChild(wrap);
  let raf = 0;
  const place = () => {
    items.forEach((it, i) => {
      const q = game.rig.project(v.set(it.x, it.y, it.z), game.viewW, game.viewH);
      const b = els[i];
      if (!q) { b.style.display = 'none'; return; }
      b.style.display = '';
      // (clamped by the label's own half-width: a long Burmese line never runs off either edge)
      const hw = Math.min(game.viewW / 2 - 4, (b.offsetWidth || 140) / 2 + 8);
      b.style.left = `${Math.max(hw, Math.min(game.viewW - hw, q.x))}px`;
      b.style.top = `${Math.max(70, Math.min(game.viewH - 200, q.y))}px`;
    });
    raf = requestAnimationFrame(place);
  };
  place();
  if (items.every((x) => x.done)) setTimeout(resolveAll, 0);
  return {
    done,
    dispose() { cancelAnimationFrame(raf); wrap.remove(); },
  };
}

/**
 * A close, low two-shot of Maya (a) and someone (b), both fully in frame: across their line, from the side
 * where nothing stands in front of their faces or bodies. Unlike the shared two-shot this one also treats
 * Maya's parked jeep and the street lamps as being in the way, and stays low (no high fallback).
 * opts: { az: fixed direction from the pair toward the camera (indoors: toward the cut-away side),
 *         h: camera height, look: look height, dur, test: false to skip the ray tests (rooms) }
 * -> the azimuth used (from the pair toward the camera)
 */
const _fit = new THREE.PerspectiveCamera();
const _p = new THREE.Vector3();
const _ray = new THREE.Raycaster();
export function pairShot(game, a, b, { az = null, h = 1.9, look = 0.66, dur = 0.7, test = true, extra = 0 } = {}) {
  const mid = new THREE.Vector3((a.x + b.x) / 2, look, (a.z + b.z) / 2);
  const across = Math.atan2(b.x - a.x, b.z - a.z);
  const norm = (x) => Math.atan2(Math.sin(x), Math.cos(x));
  const cam = game.rig.camera || game.camera;
  const fit = (azz, hh) => {
    _fit.fov = cam.fov; _fit.aspect = cam.aspect; _fit.updateProjectionMatrix();
    const rx = Math.cos(azz), rz = -Math.sin(azz);
    for (let d = 2.4; d < 16; d += 0.25) {
      _fit.position.set(mid.x + Math.sin(azz) * d, hh, mid.z + Math.cos(azz) * d);
      _fit.lookAt(mid);
      _fit.updateMatrixWorld();
      let ok = true;
      for (const q of [a, b]) for (const y of [0.05, 1.35]) for (const s of [-0.4, 0.4]) {
        _p.set(q.x + rx * s, y, q.z + rz * s).project(_fit);
        if (Math.abs(_p.x) > 0.8 || Math.abs(_p.y) > 0.9) ok = false;
      }
      if (ok) return d + extra;
    }
    return 16;
  };
  const cands = [];
  if (az != null) cands.push(az);
  else for (const off of [0, 0.3, -0.3, 0.6, -0.6]) for (const side of [PI2, -PI2]) cands.push(across + side + off);
  // the side nearer the usual south view first
  if (az == null) cands.sort((x, y) => Math.abs(norm(x)) - Math.abs(norm(y)));
  const blockers = test ? game.scene.children.filter((o) => !o.userData.isPerson && o !== game.maya.root && o.visible) : [];
  const isMaya = (o) => { for (let q = o; q; q = q.parent) if (q === game.maya.root || q.userData?.isPerson) return true; return false; };
  let pick = null, best = Infinity;
  for (const c of cands) {
    const d = fit(c, h);
    const pos = new THREE.Vector3(mid.x + Math.sin(c) * d, h, mid.z + Math.cos(c) * d);
    let blocked = 0;
    if (test) {
      // both people (legs, body, face) and the gap between them (a post there splits the frame)
      const pts = [];
      for (const q of [a, b]) for (const y of [0.3, 0.7, 1.05]) pts.push([q.x, y, q.z]);
      for (const y of [0.5, 1.0]) pts.push([(a.x + b.x) / 2, y, (a.z + b.z) / 2]);
      for (const [px, y, pz] of pts) {
        const t = new THREE.Vector3(px, y, pz);
        const dir = t.clone().sub(pos); const len = dir.length();
        _ray.set(pos, dir.normalize()); _ray.far = len - 0.35;
        if (_ray.intersectObjects(blockers, true).some((x) => x.object.visible && !x.object.userData.isOutline && !isMaya(x.object))) blocked++;
      }
    }
    const score = blocked * 100 + d + Math.abs(norm(c)) * 0.8;
    if (score < best) { best = score; pick = [c, d]; }
    if (!blocked) break;
  }
  const [c, d] = pick;
  game.rig.shot(new THREE.Vector3(mid.x + Math.sin(c) * d, h, mid.z + Math.cos(c) * d), mid, dur);
  return c;
}
const PI2 = Math.PI / 2;

/**
 * Merge still props (already placed in `scene`) into one mesh per material: a cluster of benches, baskets
 * and pots costs a handful of draw calls instead of one or two per piece. Only opaque, single-material
 * meshes (and their outlines) merge; anything see-through (blob shadows, glows), animated or flagged
 * userData.dynamic stays as it was. The merged meshes are hidden in the originals (the originals keep
 * their own dispose). -> { root (a Group in scene: toggle .visible), dispose() }
 */
export function mergeStatic(scene, roots, name = 'd7Merged') {
  const groups = new Map();
  const ok = (o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || o.userData.dynamic) return false;
    const m = o.material;
    // (see-through stays apart, except the ground blobs: one shared material, drawn first, flat on the ground)
    if (!m || (m.transparent && !o.userData.isOutline && !(o.renderOrder < 0 && m.depthWrite === false)) || o.geometry?.morphAttributes?.position) return false;
    for (const c of o.children) if (c.isMesh && !ok(c)) return false;
    return true;
  };
  for (const r of roots) {
    if (!r) continue;
    r.updateMatrixWorld(true);
    r.traverse((o) => {
      if (!o.isMesh || !o.visible || !ok(o)) return;
      const g = o.geometry;
      const attrs = Object.keys(g.attributes).sort().map((k) => `${k}${g.attributes[k].itemSize}`).join(',');
      const key = `${o.material.uuid}|${attrs}|${g.index ? 'i' : 'n'}|${o.userData.isOutline ? 'o' : 's'}|${o.castShadow ? 1 : 0}|${o.renderOrder}`;
      if (!groups.has(key)) groups.set(key, { mat: o.material, list: [], objs: [], ref: o });
      const c = g.clone();
      c.applyMatrix4(o.matrixWorld);
      groups.get(key).list.push(c);
      groups.get(key).objs.push(o);
    });
  }
  const root = new THREE.Group();
  root.name = name;
  const geos = [];
  const done = new Set();
  for (const { mat, list, objs, ref } of groups.values()) {
    let g = null;
    try { g = list.length === 1 ? list[0] : mergeGeometries(list, false); } catch { g = null; }
    if (!g) { for (const x of list) x.dispose(); continue; }
    if (list.length > 1) for (const x of list) x.dispose();
    const m = new THREE.Mesh(g, mat);
    m.castShadow = ref.castShadow; m.receiveShadow = ref.receiveShadow; m.renderOrder = ref.renderOrder;
    if (ref.userData.isOutline) { m.userData.isOutline = true; m.raycast = () => {}; }
    root.add(m);
    geos.push(g);
    for (const o of objs) done.add(o);
  }
  // hide what was merged; a solid hides only when every mesh under it merged too (hiding it hides them)
  const allDone = (o) => done.has(o) && o.children.every((c) => !c.isMesh || allDone(c));
  for (const o of done) {
    if (o.userData.isOutline) { if (!done.has(o.parent)) o.visible = false; continue; }
    if (allDone(o)) o.visible = false;
    else { done.delete(o); }
  }
  const merged = [...done];
  scene.add(root);
  return { root, count: merged.length, calls: geos.length, dispose() { root.removeFromParent(); for (const g of geos) g.dispose(); } };
}

function injectLookStyle() {
  if (document.getElementById('d7-look-style')) return;
  const s = document.createElement('style');
  s.id = 'd7-look-style';
  s.textContent = `
  .d7-looks { position: absolute; inset: 0; pointer-events: none; z-index: 34; }
  .d7-look { position: absolute; transform: translate(-50%, -50%); pointer-events: auto; max-width: 168px; padding: 4px 8px; border: 0;
    background: rgba(255,253,248,.82); border-radius: 8px; font: 600 12.5px/1.55 "Noto Sans Myanmar", system-ui, sans-serif; color: #6A655E;
    border-bottom: 1.5px dashed #B5AFA6; text-align: center; }
  .d7-look .gold { display: none; }
  .d7-look.gold { background: rgba(255,251,239,.95); color: #8C6A28; border-bottom: 2px solid #C9A24A; box-shadow: 0 2px 8px rgba(59,42,26,.18); }
  .d7-look.gold .pencil { display: block; text-decoration: line-through; opacity: .55; font-size: 11px; }
  .d7-look.gold .gold { display: block; color: #6E1F2A; }
  #game.talking .d7-looks, #game.choosing .d7-looks { opacity: .25; }
  `;
  document.head.appendChild(s);
}
