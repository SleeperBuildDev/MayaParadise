// Lazy towns (?lazy=1; region.js LAZY): the towns' heavy parts (art, buildings, props, people) download quietly
// in the background while she plays, one town at a time, so walking or driving into the next town is smooth on
// a slow connection. Boot (region.js) already merged every town's outline (land, roads, desks: the map, the car's
// network and the desks are whole) plus the towns round where she starts and the ones today's module imports.
//
// Order (one queue; a lower number goes first, then the nearest):
//   0  she is within PREFETCH_R of a town's land (it jumps the queue)
//   1  today's towns (DAY_TOWNS: where the page plays), at once when a day starts
//   2  the neighbours of where she is, a few seconds after the story is ready
//   3  every other town, half a minute into play
// Then the extras the towns feed (houses, chatter, Ko Hein Htet: they read the whole land once) and the room
// files (doors.js fetches them ahead again once the towns are in).
// Fallback: within WAIT_R of a town that is still not here, a page turns over the view (townwait.js) until it is
// built; a desk's page-turn into it waits the same way. A town that will not come (offline) is retried; after
// GIVE_UP s she is back where she last stood clear of it, and the page turns away (no hint, no frozen screen).
//
//   window.__townLoader = { state(), ready(town), prefetch(town), stats(), readyAt(x, z), busy(), extras() }
import { LAZY, LOADED, OUTLINES, TOWN_OF, mergeTown, regionAt } from './region.js';
import { registerRegionKinds } from './build.js';
import { townWait, waitNote } from './townwait.js';
import { FILES, DAY_IMPORTS } from './regions/outlines.js';

const PREFETCH_R = 110; // metres from a town's land: fetch it now (60 m in the first seconds, while the boot settles)
const WAIT_R = 40; // metres: closer than this to a town that is not here, the page waits for it
const GIVE_UP = 20; // seconds of waiting before she steps back
const NEIGHBOURS_AT = 6, REST_AT = 30; // seconds after the story is ready (the rest: half a minute in, while she reads the opening)
const EXTRAS_MAX = 180; // seconds: the extras start then even if a town is still missing

/** Where each day's page plays (beyond the towns its module imports): fetched first when the day starts. */
const DAY_TOWNS = {
  1: ['quarter'], 2: ['quarter'], 3: ['quarter'], 4: ['market'], 5: ['market', 'wharf'], 6: ['market', 'wharf', 'junction'],
  7: ['market', 'junction'], 8: ['junction', 'blank'], 9: ['hearth'], 10: ['garden', 'market'], 11: ['hearth'],
  12: ['garden', 'market'], 13: ['hearth', 'blank'], 14: ['quarter', 'market', 'hearth', 'blank'], 15: ['garden', 'blank'],
};

const ROOT = new URL('../../../', import.meta.url);
const now = () => performance.now() / 1000;
const gap = ([a, b, c, d], x, z) => Math.hypot(Math.max(a - x, 0, x - c), Math.max(b - z, 0, z - d));
const sig = (o) => JSON.stringify([(o.REGION || []).map((r) => r.rect), (o.ROAD_NODES || []).map((n) => [n.id, +n.x.toFixed(2), +n.z.toFixed(2)]),
  (o.ROAD_EDGES || []).map((e) => [e.id, e.a, e.b, e.gate || '']), (o.DESKS || []).map((d) => [d.id, +d.x.toFixed(2), +d.z.toFixed(2)])]);
const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

let installed = null;

export function installTownLoader(game, story) {
  if (!LAZY || !OUTLINES) return null;
  if (installed) return installed;
  const NAMES = Object.keys(OUTLINES);
  const T = {};
  for (const t of NAMES) T[t] = { state: LOADED.has(t) ? 'ready' : 'outline', prio: 9, tries: 0, t0: 0, t1: 0, bytes: 0, wire: 0, waiters: [], why: '' };
  const rectsOf = (t) => OUTLINES[t].REGION.map((r) => r.rect);
  const distTo = (t, x, z) => Math.min(...rectsOf(t).map((r) => gap(r, x, z)));
  const ow = () => story.openWorld || window.__openWorld;
  const focus = () => { const o = ow(); return o ? o.focus() : { x: 0, z: 0 }; };
  const t0 = now();
  let current = null;

  // ---- loading: fetch every file of the town together (warms the cache in one round trip), then import it
  async function fetchFiles(t) {
    const urls = (FILES[t] || []).map((f) => new URL(f, ROOT).href);
    const res = await Promise.all(urls.map(async (u) => {
      const r = await fetch(u, { cache: 'default', credentials: 'same-origin' });
      if (!r.ok) throw new Error(`${r.status} ${u}`);
      return (await r.arrayBuffer()).byteLength;
    }));
    return res.reduce((a, b) => a + b, 0);
  }
  async function load(t) {
    const s = T[t];
    s.state = 'loading'; s.tries++; s.t0 ||= now();
    try {
      s.bytes = await fetchFiles(t);
      const m = await import(`./regions/${t}.js`);
      register(t, m);
    } catch (err) {
      s.state = 'failed'; s.why = String(err?.message || err);
      console.warn('town', t, s.why);
      setTimeout(() => { if (T[t].state === 'failed') { T[t].state = 'queued'; pump(); } }, Math.min(8000, 1500 * s.tries));
    }
  }
  function register(t, m) {
    const s = T[t];
    if (sig(OUTLINES[t]) !== sig({ REGION: list(m.REGION), ROAD_NODES: list(m.ROAD_NODES), ROAD_EDGES: list(m.ROAD_EDGES), DESKS: list(m.DESKS) })) {
      console.warn(`townloader: the outline of ${t} is out of date (run node tools/town-outlines.mjs)`);
    }
    const r0 = performance.now();
    const added = mergeTown(t, m);
    registerRegionKinds();
    if (added) {
      try { ow()?.addTown?.({ items: added.items, obstacles: added.obstacles, rects: rectsOf(t) }); } catch (err) { console.error('town', t, err); }
    }
    s.regMs = Math.round(performance.now() - r0); // (the frame it arrives in: merge, keep-outs, yards, rebuilt chunks)
    s.state = 'ready'; s.t1 = now();
    s.wire = wireBytes(t);
    try { window.dispatchEvent(new CustomEvent('rc:town-ready', { detail: { town: t, module: m } })); } catch { /* old browsers */ }
    for (const f of s.waiters.splice(0)) f(true);
    if (NAMES.every((n) => T[n].state === 'ready')) allDone();
  }
  function wireBytes(t) {
    let w = 0;
    for (const f of FILES[t] || []) w += Math.max(0, ...performance.getEntriesByName(new URL(f, ROOT).href).map((e) => e.encodedBodySize || e.transferSize || 0));
    return w;
  }

  // ---- the queue
  function want(t, prio) {
    const s = T[t];
    if (!s || s.state === 'ready') return;
    s.prio = Math.min(s.prio, prio);
    if (s.state === 'outline') s.state = 'queued';
    pump();
  }
  function pump() {
    if (current) return;
    const p = focus();
    const next = NAMES.filter((t) => T[t].state === 'queued').sort((a, b) => T[a].prio - T[b].prio || distTo(a, p.x, p.z) - distTo(b, p.x, p.z))[0];
    if (!next) return;
    current = next;
    load(next).finally(() => { current = null; setTimeout(pump, 0); });
  }
  function ready(t) {
    const s = T[t];
    if (!s) return Promise.resolve(false);
    if (s.state === 'ready') return Promise.resolve(true);
    want(t, 0);
    return new Promise((r) => s.waiters.push(r));
  }
  /** Towns whose land lies within r metres of (x, z) and are not here yet. */
  const missingNear = (x, z, r) => NAMES.filter((t) => T[t].state !== 'ready' && distTo(t, x, z) < r);

  // ---- the extras wait for the whole land (they read it once), or EXTRAS_MAX s
  let allDone;
  const allReady = new Promise((r) => { allDone = r; });
  if (NAMES.every((n) => T[n].state === 'ready')) allDone();
  const extrasGate = Promise.race([allReady, new Promise((r) => setTimeout(r, EXTRAS_MAX * 1000))]);

  // ---- triggers: the day, the neighbours, the rest, and where she is
  const dayLater = [];
  let liveAt = 0; // (not before the story is up and a saved game has been put back where it was)
  function dayStarts(n) {
    for (const t of DAY_IMPORTS[n] || []) want(t, 0); // (already downloaded with the day's module: merged at once)
    // (the page's other towns: once the story is up, so they never slow the boot down)
    // ...and the next page's module, fetched (not run) once this one is going
    const more = () => {
      for (const t of DAY_TOWNS[n] || []) want(t, 1);
      setTimeout(() => preloadModule(`../day${Math.min(15, n + 1)}.js`), 20000);
    };
    if (liveAt) more(); else dayLater.push(more);
  }
  const preloaded = new Set();
  function preloadModule(rel) {
    const href = new URL(rel, import.meta.url).href;
    if (preloaded.has(href) || [...document.querySelectorAll('link[rel=modulepreload]')].some((l) => l.href === href)) return;
    preloaded.add(href);
    const l = document.createElement('link');
    l.rel = 'modulepreload'; l.href = href;
    document.head.appendChild(l);
  }
  dayStarts(story.save?.day || 1);
  // (the neighbours and the rest count from when the story is up and she stands where the save put her)
  const startTimers = () => setTimeout(() => {
    const p = focus();
    const here = regionAt(p.x, p.z);
    const mine = here ? TOWN_OF[here.id] : null;
    // neighbours: towns whose land touches hers (or the book's)
    const base = mine ? rectsOf(mine) : [[-26, -18, 26, 18]];
    for (const t of NAMES) if (t !== mine && base.some((b) => rectsOf(t).some((r) => Math.hypot(Math.max(0, r[0] - b[2], b[0] - r[2]), Math.max(0, r[1] - b[3], b[1] - r[3])) < 30))) want(t, 2);
  }, NEIGHBOURS_AT * 1000);
  const startRest = () => setTimeout(() => { for (const t of NAMES) want(t, 3); }, REST_AT * 1000);

  // ---- the watcher (4 times a second): fetch what is ahead, wait for what she is about to reach
  let waiting = null, safe = null;
  const waits = []; // (stats: every time the page waited: towns, seconds, stepped back)
  const tick = setInterval(() => {
    if (!window.__story) return;
    if (!liveAt) { liveAt = now(); startTimers(); startRest(); for (const f of dayLater.splice(0)) f(); }
    if (now() - liveAt < 1 || !game || game.mode !== 'world' || story.inRoom || game.ui?.sheetOpen) return;
    const o = ow();
    if (!o) return;
    const p = focus();
    for (const t of missingNear(p.x, p.z, now() - liveAt < NEIGHBOURS_AT ? 60 : PREFETCH_R)) want(t, 0);
    const need = missingNear(p.x, p.z, WAIT_R);
    if (!need.length) { if (!missingNear(p.x, p.z, WAIT_R + 10).length) safe = { x: p.x, z: p.z, h: game.mayaHeading?.() || 0 }; return; }
    if (!waiting && !document.getElementById('story-pageturn')) waitFor(need);
  }, 250);

  async function waitFor(need) {
    const o = ow();
    const w = townWait(game);
    const busy0 = game.busy;
    game.busy = true;
    waiting = { need, t: now(), w };
    const sayT = setTimeout(() => w.say(), 2500);
    let stepped = false;
    try {
      const all = Promise.all(need.map(ready));
      const give = new Promise((r) => setTimeout(() => r('late'), GIVE_UP * 1000));
      let r = await Promise.race([all, give]);
      while (r === 'late' && (story.talking || !safe)) r = await Promise.race([all, new Promise((q) => setTimeout(() => q('late'), 5000))]); // (mid-scene, or nowhere to step back to: keep waiting)
      if (r === 'late') { o.jump(safe.x, safe.z, safe.h); stepped = true; }
      const p = focus();
      await o.streamer.ensureAsync(p.x, p.z);
    } catch (err) { console.error('town wait', err); }
    clearTimeout(sayT);
    waits.push({ need, s: +(now() - waiting.t).toFixed(1), back: stepped });
    if (!busy0) game.busy = false;
    await w.close();
    waiting = null;
  }

  /** A desk's page-turn into a town not here yet: waits under the turning page (false: it did not come in time). */
  async function readyAt(x, z) {
    const need = missingNear(x, z, WAIT_R + 20);
    if (!need.length) return true;
    const host = document.getElementById('story-pageturn') || document.getElementById('game');
    let note = null;
    const sayT = setTimeout(() => { note = waitNote(host); }, 1500);
    const ok = await Promise.race([Promise.all(need.map(ready)).then(() => true), new Promise((r) => setTimeout(() => r(false), GIVE_UP * 1000))]);
    clearTimeout(sayT);
    note?.remove();
    return ok;
  }

  installed = {
    state: () => Object.fromEntries(NAMES.map((t) => [t, T[t].state])),
    ready,
    prefetch: (t) => want(t, 1),
    readyAt,
    dayStarts,
    busy: () => NAMES.some((t) => T[t].state !== 'ready') && now() - t0 < REST_AT + 120,
    extras: () => extrasGate,
    waiting: () => !!waiting,
    stats: () => ({
      t: +(now() - t0).toFixed(1),
      towns: Object.fromEntries(NAMES.map((t) => [t, { state: T[t].state, prio: T[t].prio, tries: T[t].tries, bytes: T[t].bytes, wire: T[t].wire, regMs: T[t].regMs, ms: T[t].t1 && T[t].t0 ? Math.round((T[t].t1 - T[t].t0) * 1000) : null, why: T[t].why || undefined }])),
      current,
      waiting: waiting ? { need: waiting.need, s: +(now() - waiting.t).toFixed(1) } : null,
      waits,
    }),
    dispose() { clearInterval(tick); },
  };
  window.__townLoader = installed;
  return installed;
}
