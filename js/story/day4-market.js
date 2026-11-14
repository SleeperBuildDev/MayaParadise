// Day 4's moving parts in the Envelope Market (day4-spec 1 and 12, INDEX 13.1). The Market itself (its
// buildings, stalls, the tea shop, the pump, the post office with its flag board, Thiri's table and bamboo post,
// the rain tree, the dogs' stone and beds, the doors and the keep-out shapes) is world/regions/market.js's,
// drawn once in the merged chunks. This file only adds what moves today: the kite, the three dogs, the bowls,
// the pump's water, the paper planes, plus the evening-class porch in the Quarter and the "ask Maya" board.
//
//   const m = buildMarket(story)    -> { parts, update(dt, t), dispose() }
//   const q = buildQuarterBits(story) (the evening-class porch on street 62)
//   const b = buildAskBoard(story, notes)   (home Post Office wall; notes = how many paper notes)
//
// No markers anywhere: doors are real doors, people say where things are. Burmese signs are drafts.
import * as THREE from '../game/three.js';
import { toon, signTexture, signMesh, PALETTE } from '../game/toon.js';
import { kite, streetDog, waterBowl, paperPlane, bookCrate } from './props3.js';
import { MK as RMK, SPOTS as RSPOTS } from './world/regions/market.js';

/** Where everything stands (world metres; fronts face +Z, the camera side): the district file's MK. */
export const MK = RMK;

const box = (w, h, d, c, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(c));
  m.position.set(x, y + h / 2, z);
  return m;
};
function disposeTree(o) {
  o.traverse((n) => {
    if (n.geometry && !n.geometry.userData?.shared && !n.userData?.sharedGeo) n.geometry.dispose?.();
    if (n.material?.map) n.material.map.dispose?.();
  });
}
/** A keep-out box in world space (footprint w × d centred on x, z). */
const ob = (x, z, w, d, pad = 0.1) => ({ type: 'box', minX: x - w / 2 - pad, maxX: x + w / 2 + pad, minZ: z - d / 2 - pad, maxZ: z + d / 2 + pad });
const obC = (x, z, r) => ({ type: 'circle', x, z, r });

/** Obstacles that can be taken away again (the open world's space has no remove: shapes are moved off-map). */
function obstacleSet(story) {
  const list = [];
  const space = story.openWorld?.space;
  return {
    list,
    add(o) { list.push(o); if (space) space.add([o]); else story.foot?.obstacles?.push(o); return o; },
    dispose() {
      space?.remove?.(list);
      for (const o of list) {
        if (o.type === 'circle') { o.x = 1e7; o.z = 1e7; o.r = 0; } else { o.minX = o.maxX = o.minZ = o.maxZ = 1e7; }
        const arr = space ? space.all : story.foot?.obstacles;
        const k = arr ? arr.indexOf(o) : -1;
        if (k >= 0) arr.splice(k, 1);
      }
      list.length = 0;
    },
  };
}

/**
 * The Market's moving parts for today. Returns handles the day script drives.
 */
export function buildMarket(story) {
  const { game } = story;
  const scene = game.world.scene;
  const group = new THREE.Group();
  group.name = 'day4Market';
  scene.add(group);
  const disp = []; // prop handles with dispose()
  const updaters = [];
  const obs = obstacleSet(story);
  const put = (h, x, z, ry = 0) => {
    const o = h.root || h;
    o.position.set(x, 0, z);
    o.rotation.y = ry;
    group.add(o);
    if (h.dispose) disp.push(h);
    if (h.update) updaters.push(h.update);
    return h;
  };

  // ---- the dogs' corner: the region lays the rain tree, the flat stone and the sacks; the dogs are today's
  const dogs = MK.dogs.map(([x, z, coat, old], i) => put(streetDog({ coat, old, seed: i + 1 }), x, z, Math.PI + (i - 1) * 0.5));
  for (const [x, z] of MK.dogs) obs.add(obC(x, z, 0.32));
  const bowls = [];

  // ---- the kite: its root stays at the world origin; the line's anchor is set in world space
  //      (on the post office's flag 14, the one that is down; later on Thiri's own bamboo post)
  const k = kite({ height: 0.55 });
  group.add(k.root);
  disp.push(k);
  const anchorV = new THREE.Vector3();
  const F14 = MK.flag14 || RSPOTS.flag14 || { x: MK.postOffice.x - 2.8, y: 4.3, z: MK.postOffice.z + MK.postOffice.d / 2 };
  const TIE = RSPOTS.thiriPost || { x: MK.post.x, z: MK.post.z, top: 1.6 };
  const flag14 = () => anchorV.set(F14.x, F14.y ?? 4.3, F14.z);
  const postTie = () => anchorV.set(TIE.x, (TIE.top ?? 1.6) - 0.15, TIE.z);
  const kiteState = { h: 0.55, target: 0.55, on: 'flag' };
  k.setAnchor(flag14());
  updaters.push((dt, t) => {
    kiteState.h += (kiteState.target - kiteState.h) * Math.min(1, dt * 1.6);
    k.setHeight(kiteState.h);
    k.setSway(t);
  });

  // ---- the pump's water: the region's pump is baked (its handle cannot move), so only the stream is today's,
  //      falling from the spout into the pail
  const P = MK.pump;
  const stream = new THREE.Group();
  const water = toon('#BFE0EC');
  const col = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.46, 0.05), water);
  col.position.set(0, 0.66, 0.34);
  stream.add(col);
  const splash = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.3), toon('#E8F4F8'));
  splash.position.set(0.12, 0.45, 0.4);
  stream.add(splash);
  stream.position.set(P.x, 0, P.z);
  stream.visible = false;
  group.add(stream);

  // ---- planes in flight
  const planes = [];
  function launchPlane(from, to) {
    const p = paperPlane();
    group.add(p.root);
    disp.push(p);
    planes.push(p);
    const pts = [new THREE.Vector3(from.x, 1.3, from.z), new THREE.Vector3(from.x - 0.3, 3.2, from.z - 3), new THREE.Vector3(to.x, 7.5, to.z + 8), new THREE.Vector3(to.x - 1, 10, to.z)];
    return p.fly ? p.fly(pts, 4.2).then(() => { p.root.visible = false; }) : Promise.resolve();
  }

  return {
    group, doors: [],
    parts: { dogs, bowls, kite: k, stream },
    /** Kite: 'flag' | 'post' anchor, height 0..1 (eased). */
    kite: {
      tie(on) { kiteState.on = on; k.setAnchor(on === 'post' ? postTie() : flag14()); },
      height(h, now = false) { kiteState.target = h; if (now) kiteState.h = h; },
      get state() { return kiteState; },
    },
    /** Three bowls on the flat stone (the gift set down where Ma Yu Yu chose). */
    setBowls(on) {
      if (on && !bowls.length) {
        for (let i = 0; i < 3; i++) {
          const b = waterBowl({ full: 1 });
          b.root.position.set(MK.stone.x - 0.28 + i * 0.28, 0.08, MK.stone.z + 0.05 + (i % 2) * 0.06);
          group.add(b.root);
          disp.push(b);
          bowls.push(b);
        }
      }
      for (const b of bowls) b.root.visible = !!on;
    },
    async dogDrinks() {
      const d = dogs[0];
      if (!d) return;
      d.root.rotation.y = Math.atan2(MK.stone.x - MK.dogs[0][0], MK.stone.z - MK.dogs[0][1]);
      await d.wake?.();
      d.drink?.();
    },
    pumpHandle() { /* the baked handle stays put; Ko Phyo's arms do the work */ },
    pumpFlow(v) {
      v = Math.max(0, Math.min(1, v));
      stream.visible = v > 0.02;
      const s = 0.4 + 0.6 * v;
      col.scale.set(s, 1, s);
      splash.scale.set(0.5 + v, 1, 0.5 + v); // a rushed stroke (0.2) dribbles; a steady one (1) splashes into the pail
    },
    launchPlane,
    /** A crate of books (a fresh prop, e.g. for story.cargo.load / story.carry). */
    newCrate: () => bookCrate(),
    update(dt, t) {
      for (const f of updaters) f(dt, t);
      for (const p of planes) p.update?.(dt);
    },
    dispose() {
      group.removeFromParent();
      for (const h of disp) { try { h.dispose(); } catch { /* already gone */ } }
      disposeTree(group);
      obs.dispose();
    },
  };
}

/** The evening-class porch on Quarter street 62 (the books' "better" place): a bench and a slate «ညနေတန်း». */
export function buildQuarterBits(story) {
  const scene = story.game.world.scene;
  const group = new THREE.Group();
  group.name = 'day4Porch';
  const P = MK.porch;
  group.add(box(2.4, 0.12, 1.4, '#C9B48E', 0, 0, 0)); // the porch floor
  group.add(box(1.5, 0.08, 0.36, '#8A5A36', -0.2, 0.42, -0.35)); // bench seat
  for (const x of [-0.85, 0.45]) group.add(box(0.08, 0.42, 0.3, '#5A3B26', x, 0, -0.35));
  group.add(box(0.06, 1.2, 0.06, '#5A3B26', 0.9, 0, -0.45)); // slate stand
  const slate = signMesh(signTexture([{ text: 'ညနေတန်း', size: 64, color: '#F3EFE4' }], { width: 320, height: 200, bg: '#2F3A33', border: '#8C6A28' }), 0.74, 0.46);
  slate.position.set(0.9, 1.25, -0.4);
  group.add(slate);
  group.position.set(P.x, 0, P.z);
  scene.add(group);
  const obs = obstacleSet(story);
  obs.add(ob(P.x - 0.2, P.z - 0.35, 1.6, 0.45));
  return {
    group,
    dispose() { group.removeFromParent(); disposeTree(group); obs.dispose(); },
  };
}

/** The "ask Maya" board at home is the shared one (api.js story.board, world/regions/home.js ASK_BOARD):
 *  today n paper notes, Maya's replies on two (three once she has pinned today's). -> { at, dispose } */
export function buildAskBoard(story, n = 14) {
  story.board.set({ notes: n, replies: story.flag('d4.board') ? 3 : 2 });
  return { at: { x: (story.board.x + story.board.stand.x) / 2, z: (story.board.z + story.board.stand.z) / 2 }, dispose() {} };
}

export { PALETTE };
