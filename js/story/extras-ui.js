// Story-mode screen extras: the corner map (style 3, the postage stamp, north up) and the town intros
// (first visit: fly-over + chapter-header card B; later: maroon ribbon banner A). story.js calls
// installUI(game, story, openWorld) once, after the resume jump and before the day's opening runs.
//
// Save: save.towns = { districtId: firstDay } (the day she first entered it). townintro.js keeps its own
// save.townsSeen list; here it is derived from save.towns so both agree. Old saves are seeded from the day
// they are on: every district that opened on an earlier day (days/INDEX.md 1) counts as known, so a Day 6
// save does not replay the Quarter's or the Market's fly-over.
//
// Decisions (kept here so the next reader does not undo them by accident):
// - The Home Book never gets a fly-over: Day 1's opening letter and morning already introduce it; coming
//   home later shows the banner.
// - The Road to the Envelope Market is a road, not a town: it gets the banner even the first time (two
//   fly-overs a minute apart on Day 4 felt like a cut-scene parade).
// - A day script's own arrival (Day 2's first step on the Quarter, Day 4's "arriving on the letter") always
//   goes first; the intro waits until nothing has been going on for CALM ms, then plays. Maya's chatter
//   arrival thought is skipped in that case (she has just said her own arrival line).
// - A fly-over also waits while a scene is on its way (townintro.js scenePending: a tapped walk that may end
//   in a scene, story.holdIntro, day.introHold()), and a scene that starts anyway cuts it (townintro.js).
// - In the car the fly-over plays anyway: townintro sets game.busy, which lets go of the stick, so the car
//   rolls to a stop during the lift and the camera comes back down to it.
// - No guidance: the minimap shows only explored ground and Maya; the intro frames the town round her.
import { createMinimap } from './world/minimap.js';
import { installTownIntro } from './world/townintro.js';

/** The day each district opens (days/INDEX.md 1). */
const OPENS = { home: 1, exercise: 2, envelope: 4, market: 4, wharf: 5, junction: 7, hearth: 9, garden: 10, blank: 13 };
const ROADS = new Set(['envelope']); // banner only, even the first time
const CALM = 1200; // ms of nothing else going on before an intro starts
const BANNER_WAIT = 4000; // ms a banner may wait for calm before it is dropped
const SCENE_NEAR = 15000; // ms: a scene this close before the intro = the day had its own arrival
const OVERLAYS = '#story-map, #story-panel, .story-stamp, .story-letter, .act-wrap, #story-fade.on, .rc-lift, .rc-slip';

export function installUI(game, story, ow) {
  if (!ow || story.ui) return story.ui || null;
  const save = story.save;
  const gameEl = () => document.getElementById('game') || document.body;

  // ---- the save field
  if (!save.towns || typeof save.towns !== 'object') {
    save.towns = { home: 1 };
    for (const id of save.townsSeen || []) if (!(id in save.towns)) save.towns[id] = save.day;
    for (const [id, d] of Object.entries(OPENS)) if (d < save.day && !(id in save.towns)) save.towns[id] = d;
  }
  save.townsSeen = Object.keys(save.towns);
  story.persist();

  // ---- the corner map
  // (its stamp names the same district as the top label: both change when the intro / banner announces it)
  let tiRef = null;
  const minimap = createMinimap({ game, ow, story, style: 3, rotate: false, placeName: () => tiRef?.labelName?.() || null });
  const css = document.createElement('style');
  css.id = 'extras-ui-style';
  // (a bark that pops up mid-flight would sit on the name card: it waits for the camera to come back down)
  css.textContent = '#story-minimap.ui-hide { opacity: 0; pointer-events: none; } #game.ti-flying #bark { visibility: hidden; }';
  document.head.appendChild(css);

  // ---- the town intro
  const ti = installTownIntro(game, story, { card: 'B', banner: 'A' });
  tiRef = ti;
  const sync = () => { save.townsSeen = Object.keys(save.towns); story.persist(); };
  ti.seen = (id) => id in save.towns;
  ti.markSeen = (id) => { if (!(id in save.towns)) { save.towns[id] = save.day; sync(); } };
  ti.forget = (id) => { if (id) delete save.towns[id]; else save.towns = {}; sync(); };

  /** strict: also a speech bubble still up (a fly-over waits for it; a banner at the top does not) */
  function busyNow(strict) {
    const g = gameEl();
    if (strict && document.querySelector('#bark.show')) return true;
    return game.mode !== 'world' || !!story.inRoom || !!story.talking || !!game.busy || !!game.ui?.dialogOpen || !!game.ui?.sheetOpen
      || !!game.worldWalk || !!game.rig?.cinematic || /\b(cinema|talking|choosing|acting)\b/.test(g.className)
      || !document.body.classList.contains('playing') || !!document.querySelector(OVERLAYS);
  }

  // one watcher for both: when the last scene was (not counting our own fly-over) and the corner map's
  // extra hiding (overlays minimap.js does not look for: letters, the bag, stamps, acts, the fade)
  let lastSceneAt = -1e9;
  const watch = setInterval(() => {
    const b = busyNow();
    if (b && !ti.playing) lastSceneAt = performance.now();
    // a door, a talk or a scene starting while the banner is still up: it goes at once (never over a room or a talk)
    if (b && !ti.playing && (story.inRoom || story.talking || game.mode !== 'world' || game.ui?.dialogOpen || /(cinema|talking|choosing|acting)/.test(gameEl().className) || document.querySelector(OVERLAYS))) ti.hideBanner?.();
    minimap.el.classList.toggle('ui-hide', !document.body.classList.contains('playing') || !!document.querySelector(OVERLAYS) || !!game.ui?.dialogOpen);
  }, 150);

  /** Wait until nothing has been going on for CALM ms. false = she entered another district meanwhile, or
   * (limit) it took too long. */
  function calm(id, limit, strict) {
    return new Promise((res) => {
      const t0 = performance.now();
      let quietSince = busyNow(strict) || (strict && ti.scenePending?.()) ? null : t0;
      const h = setInterval(() => {
        const t = performance.now();
        if (ti.current !== id) { clearInterval(h); return res(false); }
        if (busyNow(strict) || (strict && ti.scenePending?.())) quietSince = null;
        else if (quietSince == null) quietSince = t;
        if (quietSince != null && t - quietSince >= CALM) { clearInterval(h); return res(true); }
        if (t - t0 > limit) { clearInterval(h); return res(false); }
      }, 100);
    });
  }

  const baseEnter = ti.onEnter;
  let running = false, next = null;
  ti.onEnter = async (id, first) => {
    if (running) { next = { id, first }; return; }
    running = true;
    try {
      const road = first && ROADS.has(id);
      const fly = first && !road;
      const ok = await calm(id, fly ? Infinity : BANNER_WAIT, fly);
      // (a first visit stays unseen: it plays the next time she comes in; a dropped banner still renames the label)
      if (!ok) { if (!fly && ti.current === id) ti.name?.(id); return; }
      const dayHadScene = performance.now() - lastSceneAt < SCENE_NEAR + CALM;
      story.townIntro = true;
      try {
        if (road) ti.markSeen(id);
        await baseEnter(id, fly);
      } finally { story.townIntro = false; }
      if (!(fly && dayHadScene)) story.chatter?.onArrive?.(id, first);
    } catch (e) { console.error('town intro', e); } finally {
      running = false;
      const n = next;
      next = null;
      if (n && n.id === ti.current) ti.onEnter(n.id, n.first && !ti.seen(n.id));
    }
  };

  story.ui = {
    minimap,
    intro: ti,
    dispose() { clearInterval(watch); minimap.destroy(); ti.dispose(); css.remove(); story.ui = null; },
  };
  return story.ui;
}
