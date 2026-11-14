// Town entry (PREVIEW, not wired into story.js yet): the first time Maya sets foot in a district, a short
// fly-over (the camera lifts off her and glides over the town in a slow arc; a name card with one line about
// the place); every later entry, a quick name banner slides in at the top. Never points the way: the camera
// frames the town as a whole round where she stands, never a door, a person or anything to do.
//
//   import { installTownIntro } from './world/townintro.js';
//   const ti = installTownIntro(game, story, { card: 'A' | 'B', banner: 'A' | 'B' });
//   ti.update(dt)            per frame, after openWorld.update (installTownIntro hooks openWorld.update
//                            itself unless { manual: true }); detects entries with hysteresis
//   ti.onEnter(id, first)    what update calls once an entry is committed and the story is idle:
//                            first = true -> play(id) (and the district is marked seen); false -> banner(id)
//   ti.play(id, o)  -> Promise   the fly-over now (o: { style: 'A'|'B', slow: 1 }); resolves when the camera is back
//   ti.banner(id, o) -> Promise  the quick banner now (o: { style: 'A'|'B' })
//   ti.seen(id) / ti.markSeen(id) / ti.forget(id?)   the save's list (forget() with no id clears it)
//   ti.current               the district she is in (committed: hysteresis, see MARGIN / DWELL)
//   ti.phase, ti.t           'idle' | 'lift' | 'glide' | 'return' and seconds into the fly-over (tests)
//   ti.setStyle({ card, banner }), ti.dispose()
//   opts.keepName (default true): the top label ("Paper Town") names the district she is in, changing once the
//                            banner / fly-over has announced it; false leaves the label alone
//
// Save field (save.js is untouched: loadSave keeps unknown fields): save.townsSeen = ['exercise', 'market', ...]
// (district ids from regions/*.js). Created on first install with 'home' already in it: Day 1's own opening
// introduces the Home Book, so it only ever gets the banner (opts.homeIntro = true gives it the fly-over too).
//
// Busy: nothing starts in a room, a talk, a choice, an act, a scene, the map, a page-turn, or while the
// camera is already in a cut-scene shot; an entry made then waits (a first visit waits for as long as it
// takes; a banner is dropped if it would come more than 4 s late, or she has left that district again).
// Nor while a scene is on its way: Maya walking a tapped path (a tap-to-walk may end in a scene: the walk's
// callback would fire mid-flight), story.holdIntro set, or day.introHold() true (a day's own hook).
// Never over a scene: if a talk, a dialogue, an act, a room, a letter or anyone else's camera move starts
// while the fly-over is up, it is cut at once: the card goes, the camera drops straight back to her (or is
// left to the scene that took it), and the haze, the lens and the letterbox are handed back cleanly.
import * as THREE from '../../game/three.js';
import { tr } from '../../game/ui.js';
import { ALL_REGIONS } from './region.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
// a scene taking the stage: anything on this list showing means the fly-over must go
const SCENE_SEL = '.act-wrap, .story-letter, .story-stamp, #story-map, #story-panel, .rc-lift, .rc-slip, #story-fade.on, #story-choices button';

/** One line per district: its feel and its chapters' lesson (days/INDEX.md 1, 14). Drafts for Maya. The lines
 * describe the place and its lesson only, never a task, a door or a way. mark = the drawn emblem on style B's
 * stamp (a picture, not a number: numbers would read as an order to visit the towns in). */
export const TOWNS = {
  home: {
    mark: 'book',
    line: { my: 'စာမျက်နှာတိုင်း စတဲ့နေရာ။ အရည်အချင်းဆိုတာ ပေးထားတာ မဟုတ်ဘူး၊ လေ့ကျင့်ယူရတာ။', en: 'Where every page begins. A skill is practised, not given.' },
  },
  exercise: {
    mark: 'exercise',
    line: { my: 'မျဉ်းကြောင်းတွေနဲ့ မြေဖြူမှုန့်။ ဒီမှာ "မလုပ်နိုင်ဘူး" က "မလုပ်နိုင်သေးဘူး" ဖြစ်လာတယ်။', en: 'Ruled lines and chalk dust. Here "can\'t" learns to say "not yet".' },
  },
  envelope: {
    mark: 'envelope',
    line: { my: 'စာအိတ်လို ခေါက်ထားတဲ့ လမ်း။ သယ်လာတာမှန်သမျှ တစ်ယောက်ယောက်အတွက်ပါ။', en: 'A road folded like an envelope. Whatever you carry is meant for someone.' },
  },
  market: {
    mark: 'market',
    line: { my: 'ဆိုင်တန်း၊ တံဆိပ်ခေါင်းနဲ့ ရေနွေးငွေ့။ အေးတဲ့စိတ်နဲ့ ပေးပါ၊ ကိုယ့်အိုးလည်း ပြည့်ပါစေ။', en: 'Stalls, stamps and steam. Give with a cool heart, and keep your own pot full.' },
  },
  wharf: {
    mark: 'wharf',
    line: { my: 'စာရင်းစာအုပ်၊ ကြိုးနဲ့ ဖြည်းဖြည်းစီးတဲ့ရေ။ ဘယ်မြစ်ဘေး မွေးမလဲ မရွေးရပေမဲ့ ဘယ်လို လှော်မလဲ ကိုယ်ရွေးရတယ်။', en: 'Ledgers, ropes and slow water. Nobody picks their river; everyone picks how to pole it.' },
  },
  junction: {
    mark: 'junction',
    line: { my: 'ခြေအောက်မှာ သတင်းစာ၊ ခေါင်းစဉ်တွေက အော်နေတယ်။ ဖတ်ရုံနဲ့ မယုံနဲ့၊ ကိုယ်တိုင် ကြည့်ပါ။', en: 'Newsprint underfoot, headlines shouting. Read it, then look for yourself.' },
  },
  hearth: {
    mark: 'hearth',
    line: { my: 'မီးဖိုနွေးနွေး၊ မုန့်နွေးနွေး။ ကိုယ့်ကြောင့် ဘယ်သူမှ စိတ်မကောင်းဖြစ်ပြီး အိမ်မပြန်ပါစေနဲ့။', en: 'Warm ovens, warm bread. Let nobody walk home hurt because of you.' },
  },
  garden: {
    mark: 'garden',
    line: { my: 'မျိုးစေ့တွေနဲ့ ရေးထားတဲ့ နေ့စဉ်မှတ်တမ်း။ ဘာမှ အမြဲ မတည်ဘူး၊ အရာတိုင်း ကိုယ့်အချိန်နဲ့ကိုယ် ပွင့်တယ်။', en: 'A diary written in seeds. Nothing stays the same; everything opens in its own time.' },
  },
  blank: {
    mark: 'blank',
    line: { my: 'စာရွက်ဖြူနဲ့ ခဲတံမျဉ်း နည်းနည်း။ ဒီမှာရေးထားတာ ကိုယ်တိုင် မစစ်ရသေးရင် အမှန်လို့ မယူနဲ့။', en: 'White paper, a few pencil lines. Nothing written here is true until you test it.' },
  },
};


// Detection: she must be MARGIN metres inside a district's rect (outside its holes) for DWELL seconds before
// it counts as entered; leaving a district alone changes nothing (the bridges and seams between districts
// belong to none), so walking along a border never flickers.
const MARGIN = 3;
const DWELL = 0.5;
const BANNER_LATE = 4000; // ms: a banner that would come later than this is dropped

// Fly-over timing (seconds, before opts.slow)
export const TIMING = { lift: 1.3, glide: 3.8, back: 1.1, cardIn: 2.1, cardOut: 5.4, banner: 2.6 };

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const ease2 = (t) => t * t * (3 - 2 * t);
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function installTownIntro(game, story, opts = {}) {
  const save = story.save;
  if (!Array.isArray(save.townsSeen)) { save.townsSeen = ['home']; call(story, 'persist'); }
  const style = { card: opts.card || 'A', banner: opts.banner || 'A' };
  const ow = story.openWorld;
  const root = () => document.getElementById('game') || document.body;
  injectStyle();

  const RECTS = ALL_REGIONS.filter((r) => TOWNS[r.id]);
  const byId = (id) => ALL_REGIONS.find((r) => r.id === id);
  const nameOf = (id) => byId(id)?.name || { my: id, en: id };
  const deepIn = (r, x, z, m) => {
    const [x0, z0, x1, z1] = r.rect;
    if (x < x0 + m || x > x1 - m || z < z0 + m || z > z1 - m) return false;
    return !(r.holes || []).some(([a, b, c, d]) => x > a - m && x < c + m && z > b - m && z < d + m);
  };
  const focusXZ = () => {
    if (ow) return ow.focus();
    return game.maya.root.getWorldPosition(new THREE.Vector3());
  };

  function busy() {
    const g = root();
    const cls = g.classList;
    return game.mode !== 'world' || !!story.inRoom || !!story.talking || !!game.busy || !!game.ui?.dialogOpen || !!game.ui?.sheetOpen
      || !!game.worldWalk || !!game.rig?.cinematic || cls.contains('cinema') || cls.contains('talking') || cls.contains('choosing') || cls.contains('acting')
      || !!document.querySelector('#story-map, #story-panel, .story-stamp, .story-letter, .act-wrap, #story-fade.on') || scenePending();
  }

  /** Something story-ish is about to start: a tapped walk on its way (it may end in a scene), or a day's hold. */
  function scenePending() {
    const w = story.foot?.active ? story.foot.walker : null;
    return !!w?.moving || !!story.holdIntro || !!call(story.day, 'introHold');
  }
  /** Something story-ish has started (the fly-over's own busy, letterbox and lens do not count). */
  function sceneNow() {
    const cls = root().classList;
    return game.mode !== 'world' || !!story.inRoom || !!story.talking || !!story.talk?.active || !!game.ui?.dialogOpen || !!game.ui?.sheetOpen
      || !!game.worldWalk || cls.contains('talking') || cls.contains('choosing') || cls.contains('acting') || !!document.querySelector(SCENE_SEL);
  }

  const ti = {
    current: null,
    phase: 'idle',
    t: 0,
    playing: false,
    seen: (id) => save.townsSeen.includes(id),
    markSeen(id) { if (!save.townsSeen.includes(id)) { save.townsSeen.push(id); call(story, 'persist'); } },
    forget(id) { save.townsSeen = id ? save.townsSeen.filter((x) => x !== id) : []; call(story, 'persist'); },
    setStyle(s) { Object.assign(style, s || {}); },
  };

  // ---------------------------------------------------------------------------------------------
  // detection
  // ---------------------------------------------------------------------------------------------
  let cand = null, candT = 0, acc = 0, initial = true, pending = null;
  // the top label (#where, "Paper Town") names the district she is in once it has been announced
  // (opts.keepName = false: leave the label alone). labelId only moves after the banner / fly-over, so the
  // name never changes ahead of its own announcement.
  const keepName = opts.keepName !== false;
  let labelId = null, naming = false;
  const TOWN_WORDS = [{ my: 'စာရွက်မြို့', en: 'Paper Town' }, ...RECTS.map((r) => r.name)];
  function syncWhere() {
    if (!keepName || naming || !labelId || game.mode !== 'world' || story.inRoom) return;
    const el = document.getElementById('where');
    if (!el) return;
    const want = tr(nameOf(labelId));
    if (el.textContent === want) return;
    // (only ever replaces the open-world names: a room's name or anything else set there is left alone)
    if (TOWN_WORDS.some((n) => n.my === el.textContent || n.en === el.textContent)) game.ui.setWhere(want);
  }
  function commit(id) {
    const first = !ti.seen(id) && (id !== 'home' || opts.homeIntro);
    const wasInitial = initial;
    initial = false;
    ti.current = id;
    cand = null;
    // (a game resumed inside a district she knows: no banner for where she already is, the label just names it)
    if (wasInitial && !first) { labelId = id; return; }
    pending = { id, first, at: performance.now() };
  }
  ti.update = (dt) => {
    if (ti.playing) return;
    acc += dt;
    if (acc < 0.15) return;
    const step = acc;
    acc = 0;
    if (game.mode !== 'world' || story.inRoom) { cand = null; return; }
    const p = focusXZ();
    const r = RECTS.find((q) => deepIn(q, p.x, p.z, MARGIN));
    if (r && r.id !== ti.current) {
      if (cand !== r.id) { cand = r.id; candT = 0; }
      candT += step;
      if (candT >= DWELL) commit(r.id);
    } else cand = null;
    if (pending && !busy()) {
      const pd = pending;
      pending = null;
      if (pd.id !== ti.current) return; // she has left it again
      if (pd.first) ti.onEnter(pd.id, true);
      else if (performance.now() - pd.at < BANNER_LATE) ti.onEnter(pd.id, false);
      else labelId = pd.id; // (too late for a banner: the label just changes)
    }
    syncWhere();
  };
  /** the district the top label names now (the corner map's stamp reads the same, so the two never disagree) */
  ti.labelName = () => { const id = bannerEl?.dataset.id || labelId; return id ? nameOf(id) : null; }; // (a banner announcing it counts)
  /** the label names this district now, with no banner (an entry whose banner was dropped) */
  ti.name = (id) => { if (!TOWNS[id]) return; labelId = id; syncWhere(); };
  ti.onEnter = async (id, first) => {
    if (first) { ti.markSeen(id); await ti.play(id); labelId = id; syncWhere(); return; }
    await ti.banner(id);
  };

  // ---------------------------------------------------------------------------------------------
  // the fly-over
  // ---------------------------------------------------------------------------------------------
  const fog = game.world?.scene?.fog || null;
  const FOG_TO = { near: 64, far: 175 };
  let fogK = 0; // 0..1: how far the haze is pushed back (eased in and out with the shots)
  const cam = game.camera;
  const FOV_TO = 58;
  let fov0 = cam.fov;
  function applyLook() {
    // after openWorld.update has set its own haze for the frame: push it back while the camera is up high
    if (fog && fogK > 0) {
      const k = ease2(fogK);
      fog.near += (FOG_TO.near - fog.near) * k;
      fog.far += (FOG_TO.far - fog.far) * k;
    }
  }

  /** The follow camera's pose for the current target (camera.js computeFollow, without the lead). */
  function followPose(target) {
    const f = game.rig.follow;
    const portrait = cam.aspect < 1;
    const width = (portrait ? f.width : f.widthLandscape) * (f.zoom || 1);
    const vfov = THREE.MathUtils.degToRad(fov0);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * cam.aspect);
    let d = width / 2 / Math.tan(hfov / 2);
    if (f.minHeight) d = Math.max(d, (f.minHeight * (f.zoom || 1)) / 2 / Math.tan(vfov / 2));
    const tilt = THREE.MathUtils.degToRad(f.tilt);
    const look = new THREE.Vector3(target.x, target.y + f.height, target.z);
    const pos = new THREE.Vector3(look.x, look.y + Math.sin(tilt) * d, look.z + Math.cos(tilt) * d);
    return { pos, look };
  }

  ti.play = async (id, o = {}) => {
    if (ti.playing || !TOWNS[id]) return;
    const slow = o.slow || opts.slow || 1;
    const cardStyle = o.style || style.card;
    const T = Object.fromEntries(Object.entries(TIMING).map(([k, v]) => [k, v * slow]));
    ti.playing = true;
    ti.phase = 'lift';
    ti.t = 0;
    const wasBusy = game.busy;
    game.busy = true; // the stick, the car, doors and taps all wait
    game.ui.cinema(true);
    root().classList.add('ti-flying'); // (the corner map steps aside for the shot)
    const cutWas = ow ? ow.cutOn : false;
    if (ow) ow.cutOn = false; // no see-through hole from up there
    fov0 = cam.fov;

    // where to look: from her, drifting toward the town's middle (never past what is built round her)
    const r = byId(id);
    const p = focusXZ().clone();
    const [x0, z0, x1, z1] = r.rect;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const dx = cx - p.x, dz = cz - p.z, dl = Math.hypot(dx, dz) || 1;
    const reach = Math.min(dl, 28);
    const L0 = new THREE.Vector3(p.x, 0.8, p.z);
    const L1 = new THREE.Vector3(p.x + (dx / dl) * reach, 0.6, p.z + (dz / dl) * reach);
    // the land round the far look point, built a slice per frame while the camera lifts (no freeze)
    if (ow?.streamer?.ensureAsync) ow.streamer.ensureAsync(L1.x, L1.z, 6).catch(() => {});
    // the arc: from the south-west round to the south-east (the follow camera looks north, so it ends near
    // where it began), high at first, settling a little lower
    const side = Object.keys(TOWNS).indexOf(id) % 2 ? 1 : -1; // (neighbouring districts arc opposite ways)
    const A0 = THREE.MathUtils.degToRad(-40 * side), A1 = THREE.MathUtils.degToRad(26 * side);
    const at = (s, pos, look) => {
      const k = ease(s);
      look.lerpVectors(L0, L1, k);
      const a = A0 + (A1 - A0) * k, R = 34 - 5 * k, H = 38 - 8 * k;
      pos.set(look.x + Math.sin(a) * R, look.y + H, look.z + Math.cos(a) * R);
    };

    // tap anywhere (or the skip button): straight back to her
    let skipped = false, cut = false, foreign = false, card = null;
    const wake = [];
    const sleep = (ms) => new Promise((res) => { const h = setTimeout(res, ms); wake.push(() => { clearTimeout(h); res(); }); });
    const skip = (ev) => { ev?.stopPropagation?.(); ev?.preventDefault?.(); if (skipped) return; skipped = true; wake.splice(0).forEach((f) => f()); };
    // a scene starting under us: the card goes now and the fly-over ends (ti.cut counts these, for tests)
    const interrupt = () => { if (cut) return; cut = true; ti.cut = (ti.cut || 0) + 1; card?.hide(true); skip(); };
    // the camera is ours while we fly: a shot, pin, release or snap from anyone else means a scene has taken
    // it (the fly-over is cut and leaves the camera to them)
    const rig = game.rig, own = {};
    let mine = false;
    const ours = (fn, ...a) => { mine = true; try { return own[fn].apply(rig, a); } finally { mine = false; } };
    for (const fn of ['shot', 'pin', 'release', 'snap']) {
      own[fn] = rig[fn];
      const w = function (...a) { if (!mine && ti.playing) { foreign = true; interrupt(); } return own[fn].apply(this, a); };
      w.tiWrap = true;
      rig[fn] = w;
    }
    const unwrap = () => { for (const fn of Object.keys(own)) if (rig[fn]?.tiWrap) rig[fn] = own[fn]; };
    const tap = document.createElement('div');
    tap.className = 'ti-tap';
    tap.addEventListener('pointerdown', skip);
    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'rc-skip ti-skip';
    skipBtn.textContent = tr({ my: 'ကျော်မယ် ▸▸', en: 'Skip ▸▸' });
    skipBtn.addEventListener('pointerdown', skip);
    root().append(tap, skipBtn);
    card = makeCard(id, cardStyle);
    let watchN = 0;

    const t0 = performance.now();
    const clock = setInterval(() => {
      ti.t = (performance.now() - t0) / 1000 / slow;
      // a scene starting under us (a script, a timer, a walk's callback): cut the fly-over cleanly
      if (!cut && ++watchN % 4 === 0 && sceneNow()) interrupt();
      // haze and lens: in during the lift, out during the way back
      const tt = (performance.now() - t0) / 1000;
      const up = clamp01(tt / T.lift), down = ti.phase === 'return' ? clamp01((tt - backAt) / T.back) : 0;
      fogK = Math.min(up, 1 - down);
      cam.fov = fov0 + (FOV_TO - fov0) * ease2(fogK);
      cam.updateProjectionMatrix();
    }, 16);
    let backAt = Infinity;
    const pos = new THREE.Vector3(), look = new THREE.Vector3();
    try {
      // 1. lift off her
      at(0, pos, look);
      ours('shot', pos, look, T.lift);
      await sleep(T.lift * 1000);
      // 2. the glide (the card comes in on the way)
      if (!skipped) {
        ti.phase = 'glide';
        const g0 = performance.now();
        ours('pin', (P, Lk) => at(clamp01((performance.now() - g0) / 1000 / T.glide), P, Lk), 7);
        const cardIn = Math.max(0, T.cardIn - T.lift);
        await sleep(cardIn * 1000);
        if (!skipped) { card.show(); call(game.audio, 'play', 'page'); }
        await sleep((T.glide - cardIn) * 1000);
      }
      // 3. back down to her (the card fades on the way)
      ti.phase = 'return';
      backAt = (performance.now() - t0) / 1000;
      if (ow) ow.cutOn = cutWas; // (walls between the lens and her fade again on the way down)
      const quick = skipped;
      if (quick) T.back = (cut ? 0.4 : 0.6) * slow;
      const outIn = quick ? 0 : Math.max(0, T.cardOut - T.lift - T.glide);
      if (cut) card.hide(true); else setTimeout(() => card.hide(), outIn * 1000);
      const home = followPose(game.maya.root.getWorldPosition(new THREE.Vector3()).setY(0));
      // (driving: the camera follows the car)
      if (!story.foot?.active && !game.worldWalk && game.car) { const c = game.car.root.position; Object.assign(home, followPose(c)); }
      skipBtn.remove();
      tap.remove();
      // (cut by a scene that has taken the camera: it is theirs now, no move back)
      // (cut by a scene of our own world: a straight cut back to her, no glide under a dialogue or an act)
      if (!foreign) { if (cut) { ours('release'); ours('snap'); } else await ours('shot', home.pos, home.look, T.back); }
    } finally {
      clearInterval(clock);
      fogK = 0;
      cam.fov = fov0;
      cam.updateProjectionMatrix();
      card.hide(true);
      tap.remove();
      skipBtn.remove();
      if (!foreign) ours('release');
      unwrap();
      if (ow) ow.cutOn = cutWas;
      // the letterbox: ours to take down, unless a scene that cut us is still on (its own end takes it down;
      // one that never set it, an act called straight, gets it taken down once it is over)
      if (!cut || !sceneNow()) game.ui.cinema(false);
      else {
        const h = setInterval(() => {
          if (sceneNow() || ti.playing) return;
          clearInterval(h);
          if (!game.rig.cinematic && !story.talking) game.ui.cinema(false);
        }, 200);
      }
      root().classList.remove('ti-flying');
      game.busy = wasBusy;
      ti.phase = 'idle';
      ti.playing = false;
    }
  };

  // ---------------------------------------------------------------------------------------------
  // the name card (fly-over) and the banner (later entries)
  // ---------------------------------------------------------------------------------------------
  function makeCard(id, st) {
    const nm = nameOf(id), T = TOWNS[id];
    const el = document.createElement('div');
    el.className = `ti-card ti-card-${st}`;
    if (st === 'B') {
      const mark = `<svg viewBox="0 0 40 28" aria-hidden="true">${MARKS[T.mark] || ''}</svg>`;
      el.innerHTML = `<div class="ti-sheet"><span class="ti-stamp">${mark}</span>`
        + `<p class="ti-my">${esc(nm.my)}</p><span class="ti-rule"><i></i><em></em><i></i></span>`
        + `<p class="ti-en">${esc(nm.en)}</p><p class="ti-line">${esc(tr(T.line))}</p></div>`;
    } else {
      el.innerHTML = `<div class="ti-swing"><span class="ti-string"></span><div class="ti-tag"><span class="ti-hole"></span>`
        + `<p class="ti-my">${esc(nm.my)}</p><p class="ti-en">${esc(nm.en)}</p><span class="ti-dash"></span>`
        + `<p class="ti-line">${esc(tr(T.line))}</p></div></div>`;
    }
    root().appendChild(el);
    let gone = false;
    return {
      el,
      show() { if (!gone) el.classList.add('on'); },
      hide(now) {
        if (gone) return;
        if (now) { gone = true; el.remove(); return; }
        el.classList.add('out');
        setTimeout(() => { gone = true; el.remove(); }, 420);
      },
    };
  }

  // The banner is the top label itself changing: it takes the place of #where (between the menu button and
  // EN / sound), so it never covers a button or the corner map below them; the old name fades out under it,
  // and when it lifts away the label reads the new name (keepName).
  let bannerEl = null;
  /** take a banner off at once (a door, a talk or a scene has just started): the label reads its name */
  ti.hideBanner = () => {
    const el = bannerEl;
    if (!el) return false;
    bannerEl = null;
    el.remove();
    if (el.dataset.id) labelId = el.dataset.id;
    naming = false;
    root().classList.remove('ti-naming');
    syncWhere();
    return true;
  };
  ti.banner = async (id, o = {}) => {
    if (!TOWNS[id]) return;
    const st = o.style || style.banner;
    const nm = nameOf(id);
    bannerEl?.remove();
    const host = root();
    const el = document.createElement('div');
    el.className = `ti-banner ti-banner-${st}`;
    el.dataset.id = id;
    el.style.setProperty('--ti-dur', `${TIMING.banner}s`);
    el.innerHTML = st === 'B'
      ? `<div class="ti-strip"><p class="ti-my">${esc(nm.my)}</p><svg class="ti-pencil" viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M3 7 C 40 4, 80 9, 120 6 S 180 5, 197 7"/></svg><p class="ti-en">${esc(nm.en)}</p></div>`
      : `<div class="ti-ribbon"><p class="ti-my">${esc(nm.my)}</p><p class="ti-en"><span class="ti-dot"></span>${esc(nm.en)}<span class="ti-dot"></span></p></div>`;
    // over the label's own slot (falls back to the top middle)
    const where = document.getElementById('where');
    const hr = host.getBoundingClientRect();
    const wr = where?.getBoundingClientRect();
    if (wr && wr.width > 80) {
      el.style.left = `${wr.left - hr.left - 4}px`;
      el.style.width = `${wr.width + 8}px`;
      el.style.top = `${Math.max(4, wr.top - hr.top + wr.height / 2 - 24)}px`;
    }
    host.appendChild(el);
    // long names: shrink the type until both lines fit the slot (never wraps, never spills onto a button)
    const box = el.firstElementChild;
    const maxW = el.clientWidth;
    for (const [sel, min] of [['.ti-my', 12], ['.ti-en', 10]]) {
      const t = el.querySelector(sel);
      let fs = parseFloat(getComputedStyle(t).fontSize);
      while (box.offsetWidth > maxW && fs > min) { fs -= 1; t.style.fontSize = `${fs}px`; }
    }
    bannerEl = el;
    naming = true;
    host.classList.add('ti-naming');
    await wait(TIMING.banner * 1000 * 0.72);
    // the label underneath already reads the new name as the banner lifts away
    if (bannerEl === el) { labelId = id; naming = false; syncWhere(); host.classList.remove('ti-naming'); }
    await wait(TIMING.banner * 1000 * 0.28 + 60);
    if (bannerEl === el) bannerEl = null;
    el.remove();
  };

  // ---------------------------------------------------------------------------------------------
  // hook into the frame (after the open world has set its haze for the frame)
  // ---------------------------------------------------------------------------------------------
  let unhook = () => {};
  if (ow && !opts.manual) {
    const orig = ow.update;
    ow.update = function (dt, t) { const out = orig.call(this, dt, t); ti.update(dt); applyLook(); return out; };
    unhook = () => { ow.update = orig; };
  }
  ti.applyLook = applyLook; // (manual mode: call after openWorld.update, with ti.update)
  ti.scenePending = scenePending; // (extras-ui.js: a fly-over waits while this is true)
  ti.sceneNow = sceneNow;
  ti.dispose = () => { unhook(); bannerEl?.remove(); root().classList.remove('ti-naming'); document.getElementById('ti-style')?.remove(); };
  return ti;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// style B's stamp emblems (drawn here, original; stroked in maroon)
export const MARKS = {
  book: '<path d="M20 7 C14 3, 8 3, 3 5 V24 C8 22, 14 22, 20 25 C26 22, 32 22, 37 24 V5 C32 3, 26 3, 20 7 Z M20 7 V25"/>',
  exercise: '<rect x="5" y="3" width="23" height="22" rx="1.5"/><path d="M9 10 H24 M9 15 H24 M9 20 H18"/><path d="M27 24 L35.5 10 L38.5 11.8 L30 25.6 L26.6 26.4 Z"/>',
  envelope: '<rect x="3" y="4" width="34" height="21" rx="2"/><path d="M3 6 L20 17 L37 6"/>',
  market: '<path d="M7 12 H29 V17 C29 22.5 24 25.5 18 25.5 C12 25.5 7 22.5 7 17 Z M29 13.5 C35 13.5 36 20.5 29 21.5 M7 14 L2 9.5 M13 12 C13 8.5 23 8.5 23 12"/><path d="M14 6.5 C12.5 4.5 15 3.5 13.8 1 M22 6.5 C20.5 4.5 23 3.5 21.8 1"/>',
  wharf: '<path d="M4 18 H36 V22.5 H4 Z M11 18 V22.5 M18 18 V22.5 M25 18 V22.5 M32 18 V22.5"/><path d="M21 18 L30 1.5"/><path d="M2 26.5 C7 24.5 11 28 16 26.5 S 26 24.5 38 26.5"/>',
  junction: '<path d="M5 5 H30 V24 H9 C6.8 24 5 22.2 5 20 Z M30 9 H35 V21.5 C35 23 33.5 24 30 24"/><path d="M9 9.5 H26 M9 14 H16 M9 18 H16 M19.5 13.5 H26 V19.5 H19.5 Z"/>',
  hearth: '<path d="M5 21 C5 10 35 10 35 21 V24.5 H5 Z"/><path d="M12 14.5 L15 18.5 M18.5 13 L21.5 17 M25.5 14.5 L28.5 18.5"/>',
  garden: '<path d="M20 25 V12"/><path d="M20 15.5 C20 9.5 14 6.5 8 7.5 C8 13.5 13 16.5 20 15.5 Z M20 12.5 C21 6.5 27 4.5 32 5.5 C32 11.5 27 13.5 20 12.5 Z"/><path d="M10 25.5 H30"/>',
  blank: '<path d="M10 2.5 H25.5 L31 8 V25.5 H10 Z M25.5 2.5 V8 H31"/><path d="M14 19 C17 16.5 20.5 20 27 16.5"/>',
};

function injectStyle() {
  if (document.getElementById('ti-style')) return;
  const s = document.createElement('style');
  s.id = 'ti-style';
  s.textContent = `
  /* (every state below is also set without its animation: with reduced motion the site's CSS drops all
     animations, and the card and banner must still show, just without the movement) */
  .ti-tap { position: absolute; inset: 0; z-index: 45; background: transparent; touch-action: none; }
  .ti-skip { top: auto; bottom: calc(8.5vh + 12px + env(safe-area-inset-bottom)); z-index: 47; }
  .ti-card { position: absolute; left: 0; right: 0; top: 0; z-index: 46; pointer-events: none; display: flex; justify-content: center; }
  .ti-card .ti-my { margin: 0; font: 700 25px/1.75 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; }
  .ti-card .ti-en { margin: 0; font: italic 600 18px/1.15 "Cormorant Garamond", Georgia, serif; color: #7A5A1E; }
  .ti-card .ti-line { margin: 0; font: 400 14.5px/1.8 "Noto Sans Myanmar", system-ui, sans-serif; color: #4A3B2C; }
  html[data-lang="en"] .ti-card .ti-line { font: italic 600 16px/1.35 "Cormorant Garamond", Georgia, serif; }

  /* A: a paper luggage tag hung by a string from the top of the screen; it swings in and settles */
  .ti-card-A .ti-swing { position: relative; padding-top: calc(8.5vh + 34px); transform-origin: 50% 0; transform: translateY(-120%) rotate(-9deg); }
  .ti-card-A.on .ti-swing { transform: none; animation: tiSwing 1.5s cubic-bezier(.25,.9,.3,1) both; }
  .ti-card-A.out .ti-swing { transform: translateY(-125%) rotate(3deg); animation: tiLift .42s ease-in both; }
  .ti-card-A .ti-string { position: absolute; z-index: 1; left: 50%; top: 0; height: calc(8.5vh + 48px); width: 3px; margin-left: -1.5px; border-radius: 2px;
    background: repeating-linear-gradient(170deg, #E3D2A6 0 3px, #B59A66 3px 6px); box-shadow: 0 0 0 1px rgba(42,33,24,.35); }
  .ti-card-A .ti-tag { z-index: 0; }
  .ti-card-A .ti-tag { position: relative; width: min(74vw, 290px); padding: 30px 18px 16px; text-align: center; background: #EBD8AE;
    background-image: radial-gradient(circle at 30% 20%, rgba(255,255,255,.35), transparent 60%), repeating-linear-gradient(90deg, rgba(140,106,40,.05) 0 2px, transparent 2px 6px);
    clip-path: polygon(22% 0, 78% 0, 100% 13%, 100% 100%, 0 100%, 0 13%); filter: drop-shadow(0 8px 10px rgba(42,33,24,.35)); }
  .ti-card-A .ti-tag::after { content: ''; position: absolute; inset: 5px; border: 1.5px dashed rgba(140,106,40,.45);
    clip-path: polygon(22% 0, 78% 0, 100% 13%, 100% 100%, 0 100%, 0 13%); pointer-events: none; }
  .ti-card-A .ti-hole { position: absolute; left: 50%; top: 9px; width: 18px; height: 18px; margin-left: -9px; border-radius: 50%;
    background: radial-gradient(circle, rgba(42,33,24,.55) 0 4px, #C9A24A 4.5px 8px, #A47A2C 8.5px 9px); }
  .ti-card-A .ti-dash { display: block; height: 0; border-top: 1.5px dashed #B99A60; margin: 8px 10% 6px; }
  .ti-card-A .ti-my { color: #6E1F2A; }
  @keyframes tiSwing { 0% { transform: translateY(-120%) rotate(-9deg); } 45% { transform: translateY(0) rotate(5deg); }
    68% { transform: translateY(0) rotate(-2.5deg); } 86% { transform: translateY(0) rotate(1deg); } 100% { transform: translateY(0) rotate(0); } }
  @keyframes tiLift { from { transform: none; } to { transform: translateY(-125%) rotate(3deg); } }

  /* B: a book's chapter header: a cream leaf, a round stamp, the name over a gold rule */
  .ti-card-B { top: calc(8.5vh + 20px); }
  .ti-card-B .ti-sheet { position: relative; width: min(86vw, 360px); padding: 22px 20px 16px; text-align: center; background: #FBF6EA;
    border-top: 3px solid #C9A24A; border-bottom: 3px solid #C9A24A; box-shadow: 0 10px 26px rgba(42,33,24,.28);
    background-image: linear-gradient(transparent 0 calc(100% - 7px), rgba(201,162,74,.18) calc(100% - 7px)); opacity: 0; transform: translateY(-10px); }
  .ti-card-B.on .ti-sheet { opacity: 1; transform: none; animation: tiLeaf .55s ease both; }
  .ti-card-B.out .ti-sheet { opacity: 0; transform: translateY(-10px); animation: tiLeafOut .4s ease both; }
  .ti-card-B .ti-my { font-size: 27px; color: #6E1F2A; }
  .ti-card-B .ti-en { font: 700 13px/1.4 "Cormorant Garamond", Georgia, serif; font-style: normal; letter-spacing: .22em; text-transform: uppercase; color: #7A5A1E; margin-bottom: 6px; }
  .ti-card-B .ti-rule { display: flex; align-items: center; justify-content: center; gap: 6px; margin: 2px 0 4px; }
  .ti-card-B .ti-rule i { display: block; height: 2px; width: 0; background: linear-gradient(90deg, transparent, #C9A24A 30%, #C9A24A); }
  .ti-card-B .ti-rule i:last-child { background: linear-gradient(90deg, #C9A24A, #C9A24A 70%, transparent); }
  .ti-card-B .ti-rule em { width: 7px; height: 7px; background: #C9A24A; transform: rotate(45deg) scale(0); }
  .ti-card-B.on .ti-rule i { width: 34%; animation: tiRule .7s .25s ease both; }
  .ti-card-B.on .ti-rule em { transform: rotate(45deg) scale(1); animation: tiGem .3s .2s ease both; }
  .ti-card-B .ti-stamp { position: absolute; right: 12px; top: -16px; width: 50px; height: 50px; border-radius: 50%; border: 3px double #6E1F2A;
    color: #6E1F2A; background: rgba(255,253,248,.9); display: flex; align-items: center; justify-content: center; opacity: 0; transform: rotate(-14deg) scale(1.8); }
  .ti-card-B .ti-stamp b { font: 700 22px/1 "Noto Sans Myanmar", system-ui, sans-serif; padding-top: 5px; }
  .ti-card-B .ti-stamp svg { width: 28px; height: 20px; fill: none; stroke: #6E1F2A; stroke-width: 2.6; stroke-linejoin: round; }
  .ti-card-B.on .ti-stamp { opacity: .92; transform: rotate(-14deg) scale(1); animation: tiStamp .4s .55s cubic-bezier(.2,1.6,.4,1) both; }
  @keyframes tiLeaf { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
  @keyframes tiLeafOut { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(-10px); } }
  @keyframes tiRule { from { width: 0; } to { width: 34%; } }
  @keyframes tiGem { from { transform: rotate(45deg) scale(0); } to { transform: rotate(45deg) scale(1); } }
  @keyframes tiStamp { from { opacity: 0; transform: rotate(-14deg) scale(1.8); } to { opacity: .92; transform: rotate(-14deg) scale(1); } }

  /* banners: the top label changing its name. Sits in #where's slot (left / width / top set from its rect), so
     it never covers the menu, EN or sound buttons, nor the corner map under them; two short lines, fitted */
  .ti-banner { position: absolute; left: 64px; right: auto; width: calc(100% - 182px); top: calc(7px + env(safe-area-inset-top)); z-index: 34;
    display: flex; justify-content: center; align-items: flex-start; pointer-events: none; }
  .ti-banner > div { flex: 0 0 auto; }
  .ti-banner p { margin: 0; white-space: nowrap; }
  #where { transition: opacity .25s ease; }
  #game.ti-naming #where { opacity: 0; }
  #game.ti-flying #story-minimap { opacity: 0; pointer-events: none; }
  /* A: a ribbon bookmark, notched at both ends, gold-stitched, dropping in */
  .ti-banner-A .ti-ribbon { position: relative; padding: 3px 22px 5px; text-align: center; background: #6E1F2A; color: #FBF5E6;
    box-shadow: 0 5px 12px rgba(42,33,24,.3); clip-path: polygon(0 0, 100% 0, calc(100% - 11px) 50%, 100% 100%, 0 100%, 11px 50%);
    animation: tiDrop var(--ti-dur) ease both; }
  .ti-banner-A .ti-ribbon::before { content: ''; position: absolute; inset: 2px 15px; border-top: 1px dashed rgba(201,162,74,.85); border-bottom: 1px dashed rgba(201,162,74,.85); }
  .ti-banner-A .ti-my { font: 700 16px/1.55 "Noto Sans Myanmar", system-ui, sans-serif; }
  .ti-banner-A .ti-en { display: flex; align-items: center; justify-content: center; gap: 7px; font: italic 600 13.5px/1.1 "Cormorant Garamond", Georgia, serif; color: #EBD7A2; }
  .ti-banner-A .ti-dot { display: block; width: 4px; height: 4px; background: #C9A24A; transform: rotate(45deg); flex: 0 0 auto; }
  @keyframes tiDrop { 0% { transform: translateY(-64px); } 16% { transform: translateY(0); } 82% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-12px); opacity: 0; } }
  /* B: the name pencilled on a torn strip of paper, underlined as it lands */
  .ti-banner-B .ti-strip { padding: 1px 20px 5px; background: #FBF5E6; text-align: center; transform-origin: 50% 0;
    clip-path: polygon(0 4%, 3% 0, 7% 5%, 12% 1%, 50% 2%, 88% 0, 93% 4%, 97% 0, 100% 5%, 99% 50%, 100% 96%, 96% 100%, 91% 96%, 50% 99%, 9% 97%, 4% 100%, 0 95%, 1% 50%);
    filter: drop-shadow(0 3px 5px rgba(42,33,24,.28)); animation: tiStrip var(--ti-dur) ease both; }
  .ti-banner-B .ti-my { font: 700 17px/1.6 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; }
  .ti-banner-B .ti-en { font: italic 600 13.5px/1.1 "Cormorant Garamond", Georgia, serif; color: #6E5220; }
  .ti-banner-B .ti-pencil { display: block; width: 100%; height: 7px; margin: -5px 0 1px; overflow: visible; }
  .ti-banner-B .ti-pencil path { fill: none; stroke: #5E5A55; stroke-width: 2.2; stroke-linecap: round; stroke-dasharray: 200; stroke-dashoffset: 0; opacity: .85;
    animation: tiPencil calc(var(--ti-dur) * .3) calc(var(--ti-dur) * .15) ease-out both; }
  @keyframes tiStrip { 0% { opacity: 0; transform: translateY(-12px) rotate(-3deg); } 14% { opacity: 1; transform: translateY(0) rotate(-1deg); }
    82% { opacity: 1; transform: translateY(0) rotate(-1deg); } 100% { opacity: 0; transform: translateY(-8px) rotate(-1deg); } }
  @keyframes tiPencil { from { stroke-dashoffset: 200; } to { stroke-dashoffset: 0; } }
  `;
  document.head.appendChild(s);
}
