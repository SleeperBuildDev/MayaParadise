// The open world (story mode): one continuous land south of the home book, streamed in chunks.
//
//   const ow = await createOpenWorld(game, story)   before createFoot (the walker needs ow.space)
//   ow.space                 keep-out shapes + "is there paper here" (walker.js createSpace)
//   ow.createWalker(spawn)   Maya's open-world walker (same interface as nav.js createWalker)
//   ow.update(dt, t)         story.update calls it every frame (streams chunks, desks, map, fog)
//   ow.onTap(x, y) -> bool   desks first (story.onTap calls it)
//   ow.openMap() / ow.travel(deskId)
//   ow.stats()               chunks loaded, triangles, renderer numbers (for budgets)
//   ow.setFlagGate(flag, on) opens (or closes) the roads gated on a flag: 'bridgeOpen' (the Fold's bridge),
//                            'creaseMended' (the torn crease), 'backCover' (the road home). Saved as
//                            save.flags[flag]; setting that flag directly works too (checked every second).
//                            Also on game.world.setFlagGate. ow.gateOpen(flag) -> bool
//
// Extending the world: everything comes from the district files in regions/ (the format is at the top
// of regions/index.js; region.js merges them). Nothing here needs touching for a new district.
import * as THREE from '../../game/three.js';
import { tr } from '../../game/ui.js';
import { BOOK } from '../../game/world/world.js';
import { createStreamer } from './stream.js';
import { createCutaway, BLOCKERS } from './cutaway.js';
import { createSpace, createOpenWalker } from './walker.js';
import { createDesks } from './desks.js';
import { createSeen, openMap, pageTurn } from './map.js';
import { itemObstacles, chunkOf, tearRect, homeBookBudget } from './build.js';
import { ITEMS, REGIONS, ROAD_EDGES, PEOPLE, BRIDGE, EXTENT, GATES, OBSTACLES, ART as REG_ART, bookDist } from './region.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);

export async function createOpenWorld(game, story) {
  const world = game.world;
  const homeBudget = homeBookBudget(world); // (build.js: the book's landmarks merged, far bits hidden, small casters quiet)
  const net = world.net;
  const ownIds = new Set(ROAD_EDGES.map((e) => e.id));
  const edges = net.edges.filter((e) => ownIds.has(e.id));

  // ---- where there is paper to stand on: the book's pages, the decks of bridges (the ribbon, the Fold's
  // bridge while open), every region's paper (minus its holes and any closed tear), jetties (`walk` rects)
  const PAGE = { x: BOOK.halfW - 0.6, z: BOOK.halfD - 0.6 };
  const isOpen = (e) => (net.isOpen ? net.isOpen(e) : true);
  const decks = edges.filter((e) => e.style === 'ribbon' || e.style === 'deck');
  function onDeck(x, z) {
    for (const e of decks) {
      const half = (e.deck || BRIDGE.deck) / 2 - 0.35;
      if (x < e.box.minX - half - 1.2 || x > e.box.maxX + half + 1.2 || z < e.box.minZ - half - 1.2 || z > e.box.maxZ + half + 1.2) continue;
      if (!isOpen(e)) continue;
      // nearest sample along the deck
      let best = Infinity;
      for (let i = 0; i < e.n; i += 2) { const dx = x - e.xs[i], dz = z - e.zs[i]; const d = dx * dx + dz * dz; if (d < best) best = d; }
      if (best < half * half) return true;
    }
    return false;
  }
  const walks = REGIONS.flatMap((r) => r.walk || []);
  function rawLand(x, z) {
    for (const r of REGIONS) {
      const [x0, z0, x1, z1] = r.rect;
      if (x < x0 || x > x1 || z < z0 || z > z1) continue;
      if (r.holes && r.holes.some(([a, b, c, d]) => x > a && x < c && z > b && z < d)) continue;
      return true;
    }
    for (const [a, b, c, d] of walks) if (x >= a && x <= c && z >= b && z <= d) return true;
    return false;
  }
  const tears = edges.filter((e) => e.look === 'tear');
  const inTear = (x, z) => tears.some((e) => { if (isOpen(e)) return false; const [a, b, c, d] = tearRect(e); return x > a - 0.2 && x < c + 0.2 && z > b - 0.15 && z < d + 0.15; });
  const offPaper = (x, z) => !rawLand(x, z);
  // the ribbon's foot: the strip from the page's walkable edge to the bridge's first deck sample (else a
  // thin unwalkable seam at z ~17.4-17.7 stops her walking onto the ribbon)
  const FOOT = BRIDGE?.pts?.[0] ? { x: BRIDGE.pts[0][0], z: BRIDGE.pts[0][1], h: (BRIDGE.deck || 3.6) / 2 - 0.35 } : null;
  function inGround(x, z) {
    if (Math.abs(x) <= PAGE.x && Math.abs(z) <= PAGE.z) return true;
    if (FOOT && Math.abs(x - FOOT.x) <= FOOT.h && z >= PAGE.z - 0.5 && z <= FOOT.z + 0.4) return true;
    if (onDeck(x, z)) return true;
    if (inTear(x, z)) return false;
    // (a step back from every edge that has no paper beyond it; seams between touching sheets are ground)
    return rawLand(x, z) && rawLand(x - 0.3, z) && rawLand(x + 0.3, z) && rawLand(x, z - 0.3) && rawLand(x, z + 0.3);
  }
  function isGround(x, z, m = 0) {
    if (!inGround(x, z)) return false;
    if (!m) return true;
    return inGround(x - m, z) && inGround(x + m, z) && inGround(x, z - m) && inGround(x, z + m);
  }
  const space = createSpace(isGround);
  for (const it of ITEMS) space.add(itemObstacles(it));
  space.add(OBSTACLES);

  // ---- save-backed things: desks and the seen mask
  const save = story.save;
  const persist = () => story.persist();
  const desks = createDesks(game, { save, persist, scene: world.scene });
  space.add(desks.obstacles);
  const seen = createSeen(save, persist);

  // ---- gates: closed roads stay closed until their flag (save.flags[flag]) is on
  const gateFlags = Object.keys(GATES);
  let streamerRef = null;
  function applyGate(flag, on) {
    const changed = net.setGate ? net.setGate(flag, on) : [];
    if (!changed.length || !streamerRef) return changed.length > 0;
    for (const e of changed) streamerRef.refresh(e.box.minX - 8, e.box.minZ - 8, e.box.maxX + 8, e.box.maxZ + 8);
    return true;
  }
  for (const f of gateFlags) applyGate(f, !!save.flags[f]);

  // ---- ambient townspeople of the Quarter: they appear with their chunk, and go with it
  const mine = new Set();
  // a day module may claim region people for itself: day.owns(id) -> true (then the region never spawns or drops them)
  const dayOwns = (id) => { try { return typeof story.day?.owns === 'function' && !!story.day.owns(id); } catch { return false; } };
  function spawnFor(ch) {
    for (const pp of PEOPLE) {
      const c = chunkOf(pp.x, pp.z);
      if (!c || c[0] !== ch.i || c[1] !== ch.j || story.people.has(pp.id)) continue;
      if (dayOwns(pp.id)) continue; // today's page places this person itself (day.owns(id))
      const e = story.spawn(pp.id, { x: pp.x, z: pp.z, heading: pp.heading || 0 });
      if (!e) continue;
      // a hello of their own, unless today's page has something for them to say
      e.cast = Object.assign({}, e.cast, { hello: e.cast.hello || pp.hello });
      if (pp.job) story.setJob(pp.id, pp.job);
      mine.add(pp.id);
    }
  }
  function dropFor(ch) {
    for (const pp of PEOPLE) {
      if (!mine.has(pp.id)) continue;
      if (dayOwns(pp.id)) { mine.delete(pp.id); continue; } // the day took this person over: theirs to remove
      const e = story.people.get(pp.id);
      if (!e) { mine.delete(pp.id); continue; }
      const c = chunkOf(e.home.x, e.home.z) || chunkOf(pp.x, pp.z);
      if (c && c[0] === ch.i && c[1] === ch.j && !story.talking) { story.remove(pp.id); mine.delete(pp.id); }
    }
  }

  // ---- the streamer
  const deskGlows = [];
  const cut = createCutaway();
  const cutAt = new THREE.Vector3();
  const streamer = createStreamer({
    scene: world.scene, net, edges, shadows: !!game.shadowsOn, low: game.tier === 'low', cut,
    extraGlows: () => desks.glows(deskGlows),
    onReady: (ch) => spawnFor(ch),
    onGone: (ch) => dropFor(ch),
    offPaper,
  });
  streamerRef = streamer;
  desks.onGlowChange = () => streamer.refreshGlows();
  streamer.refreshGlows();
  // the sun's shadow: main.js fits it to the camera's view, clamped to a box. On the book that box is
  // the book; out on the land it is a patch round her (the haze hides the far ground anyway, and a
  // small patch keeps the shadow sharp and the shadow pass cheap)
  const shadowBox = game.worldShadowBounds;
  const bookShadowBox = shadowBox ? shadowBox.clone() : null;
  // the home book's own casters: out on the land its shadows are lost in the haze (and cost a whole
  // second drawing of the book), so it stops casting there
  const bookCasters = [];

  // the book's far clouds circle through where the land now lies: only show them while on the book
  const farClouds = world.scene.getObjectByName('cloudsFar');
  const fog = world.scene.fog;
  const fogBook = { near: fog?.near ?? 60, far: fog?.far ?? 200 };
  // far from home, the home book's small things are hidden (it stays as a silhouette in the haze)
  // small things first (tiny at that range, and each one is a draw call), then the trees
  const TINY = ['sparkles', 'critters', 'fountainInk', 'fountainRipples', 'padRings', 'glows'], TREES = ['trees', 'padauks', 'cypresses', 'palms'];
  const homeTiny = [], homeTrees = [];
  world.scene.traverse((o) => { if (TINY.includes(o.name)) homeTiny.push(o); else if (TREES.includes(o.name)) homeTrees.push(o); });
  // instanced outlines are siblings named '' : find them by their shared instanceMatrix (the trees' go early)
  world.scene.traverse((o) => {
    if (!o.isInstancedMesh || !o.userData.isOutline) return;
    if (homeTiny.some((h) => h.instanceMatrix === o.instanceMatrix) || homeTrees.some((h) => h.instanceMatrix === o.instanceMatrix)) homeTiny.push(o);
  });
  const landmarks = world.landmarks?.group;
  let homeLevel = 0;
  // farther still, the whole book is lost in the haze: stop drawing it (the road birds stay, they roam the land too)
  // (not the site's hidden route shimmer or anything else that starts hidden: the LOD below would switch it on)
  const bookAll = (world.scene.getObjectByName('world')?.children || []).filter((o) => o.name !== 'roadBirds' && o.name !== 'routeShimmer' && o.visible);
  for (const o of bookAll) o.traverse((m) => { if (m.isMesh && m.castShadow) bookCasters.push(m); });
  // ...and its ink outlines (a second drawing of every building): 40 m and more away in the haze they
  // are faint, so they go with the tiny things
  const bookOutlines = [];
  for (const o of bookAll) o.traverse((m) => { if (m.isMesh && m.visible && m.userData.isOutline && !homeTiny.includes(m)) bookOutlines.push(m); });
  let bookCasting = true;

  // ---- blockers: tall things that can stand between the camera and her (cutaway.js fades them out)
  const TALL_H = { house: 6.2, school: 9.8, snack: 5.2, potter: 3.8, stage: 5.6, bookSign: 3.2, borderSign: 3.2, pageEnd: 2.2 };
  for (const [k, v] of Object.entries(REG_ART)) if (v?.h) TALL_H[k] = v.h; // district buildings (regions/<id>.js ART)
  const tall = [];
  const addTall = (list) => { for (const it of list) {
    const H = TALL_H[it.k];
    if (!H) continue;
    // footprint (with the eaves): the item's keep-out boxes, grown a little
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
    // (the end of the land: only its sign stands tall; the sheet, quill and ink lie flat)
    for (const o of it.k === 'pageEnd' ? [{ type: 'box', minX: it.x - 1.4, maxX: it.x + 1.4, minZ: it.z - 0.4, maxZ: it.z }] : itemObstacles(it)) {
      const b = o.type === 'box' ? o : { minX: o.x - o.r, maxX: o.x + o.r, minZ: o.z - o.r, maxZ: o.z + o.r };
      minX = Math.min(minX, b.minX); maxX = Math.max(maxX, b.maxX); minZ = Math.min(minZ, b.minZ); maxZ = Math.max(maxZ, b.maxZ);
    }
    if (minX === Infinity) continue;
    tall.push({ key: it, x: it.x, z: it.z, minX: minX - 0.45, maxX: maxX + 0.45, minY: 0, maxY: H, minZ: minZ - 0.45, maxZ: maxZ + 0.45, keep: 0.45 });
  } };
  addTall(ITEMS);
  const treeBox = { key: null, x: 0, z: 0, minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0, keep: 1.45 };
  // slab test: where the segment a -> b first enters the box (0..1), or -1
  function enters(ax, ay, az, bx, by, bz, o) {
    let t0 = 0, t1 = 1;
    const d = [bx - ax, by - ay, bz - az], a = [ax, ay, az], lo = [o.minX, o.minY, o.minZ], hi = [o.maxX, o.maxY, o.maxZ];
    for (let k = 0; k < 3; k++) {
      if (Math.abs(d[k]) < 1e-6) { if (a[k] < lo[k] || a[k] > hi[k]) return -1; continue; }
      let u = (lo[k] - a[k]) / d[k], v = (hi[k] - a[k]) / d[k];
      if (u > v) { const w = u; u = v; v = w; }
      if (u > t0) t0 = u;
      if (v < t1) t1 = v;
      if (t0 > t1) return -1;
    }
    return t0;
  }
  const slots = Array.from({ length: BLOCKERS }, () => ({ key: null, x: 0, z: 0, keep: 0.45, fade: 0, want: false }));
  const found = [];
  function blocking(o, cam, p, h) {
    // her feet-to-head (or the car): either line of sight cut before it reaches her
    for (const y of [0.45, h]) { const t = enters(cam.x, cam.y, cam.z, p.x, y, p.z, o); if (t >= 0 && t < 0.97) return t; }
    return -1;
  }
  function findBlockers(cam, p, h) {
    found.length = 0;
    const R = Math.hypot(cam.x - p.x, cam.z - p.z) + 4;
    for (const o of tall) {
      if (Math.abs(o.x - p.x) > R + 14 || Math.abs(o.z - p.z) > R + 14) continue;
      const t = blocking(o, cam, p, h);
      if (t >= 0) found.push({ o, t });
    }
    for (const kind in streamer.pools) {
      for (const it of streamer.pools[kind].list) {
        if (Math.abs(it.x - p.x) > R || Math.abs(it.z - p.z) > R) continue;
        const s = it.s || 1;
        treeBox.minX = it.x - 1.3 * s; treeBox.maxX = it.x + 1.3 * s; treeBox.minZ = it.z - 1.3 * s; treeBox.maxZ = it.z + 1.3 * s;
        treeBox.minY = 1.5 * s; treeBox.maxY = 3.6 * s;
        const t = blocking(treeBox, cam, p, h);
        if (t >= 0) found.push({ o: { key: it, x: it.x, z: it.z, keep: 1.45 * s }, t });
      }
    }
    found.sort((a, b) => a.t - b.t);
    if (found.length > BLOCKERS) found.length = BLOCKERS;
    return found;
  }
  function updateBlockers(dt, on, cam, p, h) {
    for (const sl of slots) sl.want = false;
    if (on) {
      for (const { o } of findBlockers(cam, p, h)) {
        let sl = slots.find((q) => q.key === o.key);
        if (!sl) sl = slots.find((q) => q.key === null) || slots.find((q) => q.fade <= 0.001 && !q.want);
        if (!sl) continue;
        if (sl.key !== o.key) { sl.key = o.key; sl.x = o.x; sl.z = o.z; sl.keep = o.keep; sl.fade = 0; }
        sl.want = true;
      }
    }
    slots.forEach((sl, k) => {
      if (sl.key === null) return;
      sl.fade = Math.max(0, Math.min(1, sl.fade + (sl.want ? 4 : -2.5) * dt));
      if (!sl.want && sl.fade <= 0) sl.key = null;
      cut.blocker(k, sl.x, sl.z, sl.key === null ? 0 : sl.fade, sl.keep);
    });
  }
  // canvas signs are their own meshes: hide the sign of a building that is faded out (or cleared
  // from the near part of the view), so it never hangs in the air
  function updateSigns(cam, p, near) {
    const dx = p.x - cam.x, dz = p.z - cam.z, l2 = dx * dx + dz * dz || 1;
    for (const ch of streamer.chunks.values()) {
      if (ch.state !== 'ready' || !ch.signMeshes) continue;
      for (const m of ch.signMeshes) {
        const u = m.userData;
        if (u.ax === undefined) continue;
        let hide = false;
        for (const sl of slots) if (sl.key !== null && sl.fade > 0.5 && Math.abs(sl.x - u.ax) + Math.abs(sl.z - u.az) < 0.02) hide = true;
        if (!hide && near > 0 && u.tall) hide = ((u.ax - cam.x) * dx + (u.az - cam.z) * dz) / l2 < near - 0.05;
        m.visible = !hide;
      }
    }
  }

  // ---- camera spots for the desk scenes: away from buildings, with a clear look at the desk
  const nearBuf = [];
  function hitsShape(x, z, r) {
    for (const o of space.near(x, z, r, nearBuf)) {
      if (o.type === 'circle') { if (Math.hypot(x - o.x, z - o.z) < o.r + r) return true; }
      else if (Math.hypot(x - Math.max(o.minX, Math.min(x, o.maxX)), z - Math.max(o.minZ, Math.min(z, o.maxZ))) < r) return true;
    }
    return false;
  }
  function freeCam(tx, tz, offsets, fr = [0, 0.2, 0.4, 0.6, 0.75]) {
    for (const [dx, dz] of offsets) {
      let ok = true;
      for (const f of fr) if (hitsShape(tx + dx * (1 - f), tz + dz * (1 - f), f ? 0.3 : 0.8)) { ok = false; break; }
      if (ok) return [tx + dx, tz + dz];
    }
    return [tx + offsets[0][0] * 0.5, tz + offsets[0][1] * 0.5];
  }

  // ---- per frame
  const focus = new THREE.Vector3();
  let seenT = 0, smokeT = 0, gateT = 0;
  const ow = {
    space, desks, seen, streamer, net, cut,
    cutOn: true, // tests turn the see-through hole off for overview shots
    createWalker: (spawn) => createOpenWalker(space, spawn),
    bounds: { minX: EXTENT.x0, maxX: EXTENT.x1, minZ: EXTENT.z0, maxZ: EXTENT.z1 },
    focus() {
      if (story.foot?.active || game.worldWalk) return game.maya.root.getWorldPosition(focus);
      return focus.copy(game.car.root.position);
    },
    update(dt, t) {
      if (game.mode !== 'world') return;
      const p = ow.focus();
      const away = bookDist(p.x, p.z); // metres off the home book (the land lies south, east and north-east of it)
      gateT -= dt;
      if (gateT <= 0) { gateT = 1; for (const f of gateFlags) applyGate(f, !!save.flags[f]); }
      streamer.update(dt, t, p.x, p.z, game.camera, fog && !ow.overviewOn ? fog.far : 1e9);
      if (shadowBox) {
        if (away > 2 && !ow.overviewOn) { shadowBox.min.set(p.x - 24, -2, p.z - 30); shadowBox.max.set(p.x + 24, 13, p.z + 12); }
        else shadowBox.copy(bookShadowBox);
      }
      const cast = away < 6 || ow.overviewOn;
      if (cast !== bookCasting && (cast || away > 8)) { bookCasting = cast; for (const m of bookCasters) m.castShadow = cast; }
      // see through whatever stands between the camera and her (or the car)
      const walking = story.foot?.active || game.worldWalk;
      // (not during a talk: the two-shot picks a clear side by itself, and a hole by the lens would show as grain)
      const cutting = ow.cutOn && away > 1 && !(story.talking && !ow.deskScene);
      cut.set(game.camera.position, cutAt.set(p.x, walking ? 0.9 : 0.8, p.z), cutting ? 1 : 0, cutting && walking ? 0.55 : 0);
      // (blockers also during talks: the two-shot may still have a wall or a crown between it and her)
      updateBlockers(dt, ow.cutOn && away > 1, game.camera.position, p, walking ? 1.3 : 1.2);
      updateSigns(game.camera.position, p, cutting && walking ? 0.55 : 0);
      desks.update(dt, t, p.x, p.z);
      homeBudget.update(p.x, p.z, ow.overviewOn);
      seenT -= dt;
      if (seenT <= 0) { seenT = 0.4; seen.mark(p.x, p.z); }
      seen.update(dt);
      // haze: the book keeps its wide view; out on the land the far chunks fade into the cloud colour
      const k = THREE.MathUtils.smoothstep(away, 0, 26);
      if (fog && !ow.overviewOn) { fog.near = fogBook.near + (34 - fogBook.near) * k; fog.far = fogBook.far + (105 - fogBook.far) * k; }
      if (farClouds) farClouds.visible = away < 6 && game.tier !== 'low';
      // the home book drops detail in steps as she goes south (z of the focus): tiny things and tree
      // outlines and the book's ink outlines (14 m off it), trees (44), the landmarks (54), then everything (82: deep in the haze)
      const level = ow.overviewOn ? 0 : away < 14 ? 0 : away < 44 ? 1 : away < 54 ? 2 : away < 82 ? 3 : 4;
      if (level !== homeLevel) {
        homeLevel = level;
        for (const o of bookAll) o.visible = level < 4;
        for (const o of homeTiny) o.visible = level < 1;
        for (const o of bookOutlines) o.visible = level < 1;
        for (const o of homeTrees) o.visible = level < 2;
        if (landmarks) landmarks.visible = level < 3;
      }
      // a curl of smoke from the kiln now and then (not on Day 2, when the kiln is cold, nor on Day 3, whose
      // page draws its own smoke until the kiln door opens; a day may also say day.kilnSmoke = false)
      smokeT -= dt;
      const coldKiln = save.day === 2 || save.day === 3 || story.day?.kilnSmoke === false;
      if (smokeT <= 0 && !coldKiln) {
        smokeT = 1.1;
        const pts = streamer.smokePoints();
        for (let i = 0; i < pts.length; i += 3) if (Math.hypot(pts[i] - p.x, pts[i + 2] - p.z) < 40) call(game.fx, 'burst', 'puff', focus.set(pts[i], pts[i + 1], pts[i + 2]), { count: 1, spread: 0.15, up: 0.5, size: 1.2 });
      }
    },

    /** Desks: tap one on foot to walk up and raise its ribbon; a raised one opens the map. */
    onTap(x, y) {
      const d = desks.at(x, y);
      if (!d) return false;
      const foot = story.foot;
      if (!foot?.active) {
        game.ui.bark?.(tr({ my: 'ကားပေါ်ကဆင်းပြီး စားပွဲဆီ လျှောက်သွားမယ်နော်။', en: "I'll hop out and walk over to the desk." }), { face: game.maya.faceCanvas('smile') });
        return true;
      }
      const near = Math.hypot(foot.pos.x - d.front.x, foot.pos.y - d.front.z) < 1.4;
      const arrive = () => (d.unlocked ? ow.openMap() : ow.lightDesk(d));
      if (near) arrive();
      else foot.walkTo(d.front.x, d.front.z, (ok) => { if (ok !== false && Math.hypot(foot.pos.x - d.front.x, foot.pos.y - d.front.z) < 1.6) arrive(); });
      return true;
    },
    async lightDesk(d) {
      if (story.talking || game.busy) return;
      // a day's own moment before the ribbon rises (its "pick the true line" question): day.desk(id, d);
      // resolving to false keeps the desk unlit for now
      if (typeof story.day?.desk === 'function') {
        let ok;
        try { ok = await story.day.desk(d.id, d); } catch (err) { console.error('day.desk', err); }
        if (ok === false || story.talking || game.busy) return;
      }
      story.talking = true;
      ow.deskScene = true;
      game.ui.cinema(true);
      try {
        const foot = story.foot;
        foot.walker.heading = Math.atan2(d.x - foot.pos.x, d.z - foot.pos.y);
        game.maya.root.rotation.set(0, foot.walker.heading, 0);
        // a low three-quarter view of Maya writing at the desk, then a pull back as the ribbon rises
        // (from across the desk, a little to one side, so we see her face bent over the page, not her back)
        const fx = Math.sin(d.ry), fz = Math.cos(d.ry), sx = Math.cos(d.ry), sz = -Math.sin(d.ry);
        const rel = (list) => list.map(([a, b]) => [sx * a + fx * b, sz * a + fz * b]);
        const [wx, wz] = freeCam(d.front.x, d.front.z, rel([[3.0, -3.0], [-3.2, -2.8], [3.6, 1.2], [-3.6, 1.2], [3.4, 3.0], [-3.4, 3.0]]), [0, 0.2, 0.4]); // (it looks over the desk itself)
        game.rig.shot(new THREE.Vector3(wx, 1.8, wz), new THREE.Vector3((d.x + d.front.x) / 2, 0.8, (d.z + d.front.z) / 2), 0.7);
        call(game.maya, 'emote', 'write');
        await story.wait(1100);
        desks.holdRibbons = true;
        const up = desks.unlock(d.id);
        // pull back, near eye level, to a three-quarter view from the street side: Maya at the desk and
        // the whole ribbon standing up behind it in one frame (her feet above the dialogue box, the plane
        // on its tip below the letterbox), from a spot no building stands in
        const mx = (d.front.x + d.foot.x) / 2, mz = (d.front.z + d.foot.z) / 2;
        const [rx, rz] = freeCam(mx, mz, rel([[2.8, 8.2], [-2.8, 8.2], [4.8, 7.0], [-4.8, 7.0], [7.2, 4.2], [-7.2, 4.2], [1.2, 7.0], [-1.2, 7.0]]));
        const far = Math.hypot(rx - mx, rz - mz);
        // (a nearer spot, when the street is tight: rise a little so the ribbon still fits)
        game.rig.shot(new THREE.Vector3(rx, 1.9 + Math.max(0, 8.5 - far) * 0.3, rz), new THREE.Vector3(mx, 1.15 + Math.max(0, 8.5 - far) * 0.1, mz), 1.4);
        await up;
        // she turns round to the camera and cheers
        const cam = game.camera.position;
        foot.walker.heading = Math.atan2(cam.x - foot.pos.x, cam.z - foot.pos.y);
        call(game.maya, 'emote', 'cheer');
        await story.dialog.say('maya', [{ my: 'ဒီစာမျက်နှာကို မှတ်ထားလိုက်ပြီ။ မြေပုံကနေ ဒီကို ပြန်လှန်လာလို့ရပြီ။', en: "I've marked this page. I can turn back to it from the map now." }], { face: 'happy', auto: true });
      } finally {
        desks.holdRibbons = false;
        story.talking = false;
        ow.deskScene = false;
        game.ui.cinema(false);
        game.rig.release();
      }
    },
    openMap() {
      if (story.talking || game.mode !== 'world') return;
      openMap({ game, seen, desks, net, places: world.places, onTravel: (d) => ow.travel(d.id) });
    },
    /** Page-turn to an unlocked desk: Maya at the desk, the car parked on the nearest street. */
    async travel(id) {
      const d = desks.byId(id);
      if (!d || !d.unlocked || game.busy || story.talking) return;
      game.busy = true;
      try {
        // behind the turning page: the land round the desk is built a slice per frame (no freeze), then she is there
        await pageTurn(game, async () => {
          // (lazy towns: a desk in a town not here yet waits under the page; if it does not come, she stays)
          if (window.__townLoader && (await window.__townLoader.readyAt(d.front.x, d.front.z)) === false) return;
          await streamer.ensureAsync(d.front.x, d.front.z); ow.jump(d.front.x, d.front.z, 0);
        });
      } finally {
        game.busy = false;
      }
    },
    /** Puts Maya (on foot) or the car (driving) at (x, z) at once, with the land round it built.
     * Used behind the page-turn, when a saved game resumes out on the land, and by tests. */
    jump(x, z, heading = 0) {
      const foot = story.foot;
      streamer.ensure(x, z);
      if (foot?.active) {
        let px = x, pz = z;
        for (let k = 0; k < 30 && space.collides(px, pz, 0.3); k++) { px = x + Math.sin(k * 2.4) * 0.15 * k; pz = z + Math.cos(k * 2.4) * 0.15 * k; }
        foot.walker.teleport(px, pz, heading);
        game.maya.root.position.set(px, 0, pz);
        game.maya.root.rotation.set(0, heading, 0);
        // the car waits on the nearest street, a little to the side
        game.world.drive.placeAt(px + 2, pz + 1, Math.PI / 2);
        game.syncCar(0);
      } else {
        game.world.drive.placeAt(x, z, heading);
        game.syncCar(0);
      }
      game.arrivedAt = null;
      game.ui.hideCard?.();
      const p = ow.focus();
      seen.mark(p.x, p.z);
      ow.update(0.016, game.t || 0);
      game.rig.setTarget(p);
      game.rig.snap?.();
      return p;
    },
    /** Debug: the whole land from high above (every chunk built, no haze, no see-through hole). */
    overview(on = true, at = { x: 4, z: 92, h: 330, tilt: 0.28 }) {
      ow.overviewOn = on;
      ow.cutOn = !on;
      const cam = game.camera;
      if (on) {
        streamer.loadAll();
        for (const d of desks.list) d.group.visible = !d.inRoom;
        if (fog) { fog.near = 900; fog.far = 2000; }
        cam.far = 1500; cam.updateProjectionMatrix();
        game.rig.shot(new THREE.Vector3(at.x, at.h, at.z + at.h * at.tilt), new THREE.Vector3(at.x, 0, at.z), 0.01);
      } else {
        streamer.unhold();
        cam.far = 400; cam.updateProjectionMatrix();
        game.rig.release();
      }
    },
    /** Opens (on = true) or closes the roads gated on `flag` (saved in save.flags[flag]). */
    setFlagGate(flag, on = true) {
      save.flags[flag] = !!on;
      persist();
      return applyGate(flag, !!on);
    },
    gateOpen: (flag) => !!save.flags[flag],
    /** Lazy towns (townloader.js): a town arrived after the world was made: its keep-outs, tall buildings,
     * chunks (rebuilt over its land, nearest first) and townspeople. rects: its land [[x0, z0, x1, z1], ...]. */
    addTown({ items = [], obstacles = [], rects = [] }) {
      for (const it of items) space.add(itemObstacles(it));
      space.add(obstacles);
      for (const [k, v] of Object.entries(REG_ART)) if (v?.h) TALL_H[k] = v.h;
      addTall(items);
      streamer.addItems(items);
      for (const [x0, z0, x1, z1] of rects) {
        streamer.refresh(x0 - 4, z0 - 4, x1 + 4, z1 + 4);
        for (const ch of streamer.chunks.values()) if (ch.state === 'ready' && !(ch.x1 < x0 - 4 || ch.x0 > x1 + 4 || ch.z1 < z0 - 4 || ch.z0 > z1 + 4)) spawnFor(ch);
      }
    },
    gates: gateFlags,
    stats() {
      const info = game.renderer.info.render;
      return { ...streamer.stats(), calls: info.calls, triangles: info.triangles, focus: ow.focus().toArray().map((v) => +v.toFixed(1)) };
    },
  };

  // ---- the map button (above the bag), and M on a keyboard
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'story-map-btn';
  btn.className = 'story-round small';
  btn.style.bottom = 'calc(86px + env(safe-area-inset-bottom))';
  btn.innerHTML = '<span class="ico">🗺️</span>';
  btn.setAttribute('aria-label', 'မြေပုံ / Map');
  btn.addEventListener('click', (ev) => { ev.stopPropagation(); ow.openMap(); });
  document.getElementById('game').appendChild(btn);
  const st = document.createElement('style');
  st.textContent = '#game.cinema #story-map-btn, #game.talking #story-map-btn, #game.choosing #story-map-btn, #game.acting #story-map-btn { opacity: 0; pointer-events: none; }';
  document.head.appendChild(st);
  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.target.closest?.('input, textarea')) return;
    if (e.code === 'KeyM' && !document.getElementById('story-map')) ow.openMap();
  });

  world.setFlagGate = ow.setFlagGate;
  world.gateOpen = ow.gateOpen;
  window.__openWorld = ow;
  return ow;
}
