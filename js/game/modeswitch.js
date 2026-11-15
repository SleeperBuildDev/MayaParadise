// The mode switch (owner request, option A): a small pill at the top right of Maya's book world, two halves,
// ဂိမ်း | ဝက်ဘ်ဆိုက် (Game | Website). The active half is filled maroon; tapping the other half turns a page and
// loads the other mode: the website is the plain URL, the story game is ?story (boot.js). Saves are untouched.
//
//   installModeSwitch(game)   boot.js, once the game (and, in game mode, game.story) is up -> { el, update(), dispose() }
//
// Shown ONLY in Maya's book world, and only when nothing else is on stage (polled 6 times a second, faded in/out):
//   website mode  outdoors (game.mode 'world'), no room, sheet, dialogue, letter reader, cut-scene or walk to a door,
//                 and no tip line (ui.tip) running under it
//   game mode     Maya (on foot or in the car) inside the Home Book's rect (regions/home.js, with hysteresis), and
//                 no room, talk, dialogue, choice, act, map, bag, letter, stamp, page-turn, town intro or first-time
//                 intro (story.introActive)
// Where: just under the top bar's EN / sound buttons (website); in game mode just under the corner map, which
// stands there (never over the map, the hint line or the place label).
//
// Navigation (and the Back button):
//   - before leaving, this entry's history.state gets mwAuto: 1 and sessionStorage 'mw-switch' = { to, from, t, msg }:
//     boot.js starts the game by itself on the page it lands on (no second Play tap), and again if the visitor
//     comes BACK to this page and the browser has to load it afresh (a page kept in the back-forward cache just
//     shows again: 'pageshow' takes the turning page away)
//   - the page the switch lands on gets mwAuto too (Forward to it, or a reload, starts by itself), and the site's own
//     opening (Maya's hello, main.js intro()) is left out there (opts.switched): the visitor has just been playing
//   - in website mode a place label (ui.js) that drifts under the pill fades out while the pill shows
//   - switching back to the mode you came from goes back in history (history.back()) instead of piling up new
//     entries, so Back always leaves the site the way you came in
//   - test settings carry over (tier, time, period, lazy, music, sound); nothing else does
//   - live build (js/sw-register.js): touching the Game half asks the service worker for the game's start files at
//     once (window.__sw.warm), and while the page turns a first install still running finishes first
//     (__sw.beforeSwitch), so game mode loads from the phone's cache; both do nothing on the dev pages
import { tr } from './ui.js';
import { SWITCH } from '../story/intro-lines.js';

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);
const HOME_RECT = [-26, -18, 26, 18]; // regions/home.js REGION.rect
const IN_PAD = 0.5, OUT_PAD = 2.5; // m: shows once inside the rect (0.5 m in), hides 2.5 m past its edge
const KEEP = ['tier', 'time', 'period', 'lazy', 'music', 'sound']; // test settings that carry over
const STORY_OVERLAYS = '#story-map, #story-panel, .story-stamp, .story-letter, .act-wrap, #story-fade.on, .rc-lift, .rc-slip, '
  + '#story-pageturn, #story-townwait, #rc-talk, #story-choices, .ti-card, .rc-intro-cover, #rc-intro';
const BUSY_CLASSES = /\b(cinema|talking|choosing|acting|reading|ti-flying|ti-naming|rc-talk|rc-intro)\b/;

/** The URL of the other mode (keeps only the test settings). */
export function otherModeUrl(toStory, loc = location) {
  const q = new URLSearchParams(loc.search);
  const out = [];
  if (toStory) out.push('story');
  for (const k of KEEP) if (q.has(k)) out.push(`${k}=${encodeURIComponent(q.get(k))}`);
  return loc.pathname + (out.length ? `?${out.join('&')}` : '');
}

export function installModeSwitch(game) {
  if (!game || document.getElementById('mode-switch')) return null;
  injectStyle();
  const host = document.getElementById('game');
  const story = () => game.story || null;
  const isStory = !!(game.opts?.story || game.story);

  const el = document.createElement('div');
  el.id = 'mode-switch';
  el.setAttribute('role', 'group');
  el.innerHTML = '<span class="ms-knob" aria-hidden="true"></span>'
    + '<button type="button" class="ms-half" data-mode="game"></button>'
    + '<button type="button" class="ms-half" data-mode="site"></button>';
  const knob = el.firstElementChild;
  const bGame = el.querySelector('[data-mode="game"]');
  const bSite = el.querySelector('[data-mode="site"]');
  el.classList.toggle('is-game', isStory);
  bGame.setAttribute('aria-pressed', String(isStory));
  bSite.setAttribute('aria-pressed', String(!isStory));
  function label() {
    el.setAttribute('aria-label', tr(SWITCH.label));
    bGame.textContent = tr(SWITCH.game);
    bSite.textContent = tr(SWITCH.site);
    bGame.title = tr(SWITCH.gameLong);
    bSite.title = tr(SWITCH.siteLong);
    bGame.setAttribute('aria-label', `${tr(SWITCH.game)} · ${tr(SWITCH.gameLong)}`);
    bSite.setAttribute('aria-label', `${tr(SWITCH.site)} · ${tr(SWITCH.siteLong)}`);
    placedFor = ''; // (the halves changed width: the knob follows)
    place();
  }
  host.appendChild(el);

  // ---- where: under EN / sound (website), under the corner map (game)
  let placedFor = '';
  function place() {
    let top = null;
    const map = document.getElementById('story-minimap');
    if (map) {
      const r = map.getBoundingClientRect();
      if (r.height > 20 && r.bottom > 0) top = Math.round(r.bottom + 8);
    }
    const bar = document.getElementById('topbar')?.getBoundingClientRect();
    if (top == null) top = Math.round((bar && bar.height > 20 ? bar.bottom : 62) + 8);
    const key = `${top}|${innerWidth}`;
    if (key === placedFor) return;
    placedFor = key;
    el.style.top = `${top}px`;
    // the knob sits under the active half
    const half = isStory ? bGame : bSite;
    knob.style.width = `${half.offsetWidth}px`;
    knob.style.transform = `translateX(${half.offsetLeft - 3}px)`;
  }

  // ---- when
  let inHome = true;
  function homeNow() {
    const ow = story()?.openWorld;
    const p = ow?.focus ? ow.focus() : null;
    if (!p) return true;
    const [x0, z0, x1, z1] = HOME_RECT;
    const pad = inHome ? OUT_PAD : -IN_PAD;
    inHome = p.x > x0 - pad && p.x < x1 + pad && p.z > z0 - pad && p.z < z1 + pad;
    return inHome;
  }
  function wanted() {
    if (leaving) return false;
    if (!document.body.classList.contains('playing') || document.hidden) return false;
    const ui = game.ui;
    if (game.mode !== 'world' || game.busy || game.worldWalk) return false;
    if (ui?.sheetOpen || ui?.dialogOpen || game.letterReader?.open || game.rig?.cinematic) return false;
    if (BUSY_CLASSES.test(host.className)) return false;
    // a tip line (ui.tip: 'tap a place...', a few seconds after the hello) that runs under the pill: it waits for it
    const tip = ui?.els?.tip;
    if (tip && !tip.hidden) {
      const a = tip.getBoundingClientRect(), b = el.getBoundingClientRect();
      if (a.width > 0 && a.right > b.left - 4 && a.left < b.right + 4 && a.bottom > b.top - 4 && a.top < b.bottom + 4) return false;
    }
    const s = story();
    if (isStory) {
      if (!s) return false;
      if (s.starting || s.inRoom || s.talking || s.talk?.active || s.introActive || s.townIntro || s.cutscene) return false;
      if (document.querySelector(STORY_OVERLAYS)) return false;
      return homeNow();
    }
    return true;
  }
  // website mode: a place label (ui.js, pinned to a building and kept on screen) that drifts under the pill steps
  // aside while the pill shows (it can always be reached from the dock too)
  const labelsEl = document.getElementById('labels');
  function clearUnder() { if (labelsEl) for (const l of labelsEl.querySelectorAll('.ms-under')) l.classList.remove('ms-under'); }
  function dodgeLabels() {
    if (!labelsEl || isStory) return;
    const r = el.getBoundingClientRect();
    for (const l of labelsEl.children) {
      const q = l.getBoundingClientRect();
      const under = !l.classList.contains('hide') && q.right > r.left - 6 && q.left < r.right + 6 && q.bottom > r.top - 6 && q.top < r.bottom + 6;
      if (l.classList.contains('ms-under') !== under) l.classList.toggle('ms-under', under);
    }
  }
  let shown = false, calmSince = 0;
  const SHOW_AFTER = 900; // ms of a calm stage before it fades in (never a flash between two scenes); it hides at once
  function update() {
    let want = wanted();
    const now = performance.now();
    if (!want) calmSince = 0;
    else if (!shown) { if (!calmSince) calmSince = now; if (now - calmSince < SHOW_AFTER) want = false; }
    if (want) dodgeLabels();
    if (want === shown) return;
    if (!want) clearUnder();
    shown = want;
    if (want) place();
    el.classList.toggle('on', want);
    el.toggleAttribute('inert', !want);
    el.setAttribute('aria-hidden', String(!want));
  }
  el.toggleAttribute('inert', true);
  el.setAttribute('aria-hidden', 'true');
  const tick = setInterval(update, 160);
  const onResize = () => { placedFor = ''; if (shown) place(); };
  addEventListener('resize', onResize);
  document.addEventListener('mw:lang', label);

  // ---- go
  let leaving = false, backTimer = 0;
  // (leaving for good, or into the back-forward cache: the fallback must never fire later on a page shown again)
  const onHide = () => clearTimeout(backTimer);
  addEventListener('pagehide', onHide);
  function go(toStory) {
    if (leaving || toStory === isStory) return;
    leaving = true;
    call(game.audio, 'play', 'page');
    el.classList.add('switching');
    el.classList.toggle('is-game', toStory);
    bGame.setAttribute('aria-pressed', String(toStory));
    bSite.setAttribute('aria-pressed', String(!toStory));
    const half = toStory ? bGame : bSite;
    knob.style.width = `${half.offsetWidth}px`;
    knob.style.transform = `translateX(${half.offsetLeft - 3}px)`;
    const target = otherModeUrl(toStory);
    const here = location.pathname + location.search;
    // the page that turns while the other mode loads
    const cover = document.createElement('div');
    cover.className = 'ms-cover';
    cover.innerHTML = `<div class="ms-leaf"><p>${tr(toStory ? SWITCH.toGame : SWITCH.toSite)}</p></div>`;
    for (const ev of ['pointerdown', 'touchstart', 'click']) cover.addEventListener(ev, (e) => e.stopPropagation(), { passive: true });
    document.body.appendChild(cover);
    const leaf = cover.firstElementChild;
    const turn = leaf.animate?.([{ transform: 'translateX(100%) rotateY(-70deg)', opacity: 0.5 }, { transform: 'translateX(0) rotateY(0deg)', opacity: 1 }],
      { duration: 460, easing: 'cubic-bezier(.4,.1,.3,1)', fill: 'forwards' });
    const turned = turn?.finished ? turn.finished.catch(() => {}) : new Promise((r) => setTimeout(r, 460));
    // (live build: an offline-cache install still running finishes under the turned page, up to 8 s)
    const after = turned.then(() => (toStory ? Promise.resolve(window.__sw?.beforeSwitch?.(8000)).catch(() => {}) : null));
    after.then(() => {
      // this page: start by itself if the visitor comes back to it and it has to load again
      try { history.replaceState({ ...(history.state || {}), mwAuto: 1 }, ''); } catch { /* ignore */ }
      let came = null;
      try { came = JSON.parse(sessionStorage.getItem('mw-switch-came') || 'null'); } catch { came = null; }
      // (msg: the turning page's words, which the next page keeps showing until its game draws: boot.js)
      try { sessionStorage.setItem('mw-switch', JSON.stringify({ to: target, from: here, t: Date.now(), msg: tr(toStory ? SWITCH.toGame : SWITCH.toSite) })); } catch { /* ignore */ }
      // back to the mode we came from: one step back in history (no growing pile of entries)
      // (came.from is the other mode's page this one was reached from by the switch: the same mode as the target)
      const storyUrl = (u) => /[?&]story(=|&|$)/.test(String(u).split('#')[0]);
      if (came && came.to === here && came.from && storyUrl(came.from) === toStory && history.length > 1) {
        history.back();
        // (nothing happened: no page to go back to after all)
        backTimer = setTimeout(() => { if (location.pathname + location.search === here) location.assign(target); }, 1500);
      } else location.assign(target);
    });
  }
  // a page kept in the back-forward cache comes back as it was left: take the turning page away
  const onShow = (e) => {
    if (!e.persisted) return;
    leaving = false;
    document.querySelectorAll('.ms-cover').forEach((c) => c.remove());
    el.classList.remove('switching');
    el.classList.toggle('is-game', isStory);
    bGame.setAttribute('aria-pressed', String(isStory));
    bSite.setAttribute('aria-pressed', String(!isStory));
    placedFor = '';
    place();
    try { sessionStorage.removeItem('mw-switch'); } catch { /* ignore */ }
  };
  addEventListener('pageshow', onShow);
  for (const [b, toStory] of [[bGame, true], [bSite, false]]) {
    b.addEventListener('click', (e) => { e.stopPropagation(); go(toStory); });
    b.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (toStory && !isStory) try { window.__sw?.warm?.(); } catch { /* optional */ } });
  }
  // keys: arrows move between the halves (Enter / Space press them, as buttons do)
  el.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); (document.activeElement === bGame ? bSite : bGame).focus(); }
    else if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); // (not the game's own action key)
  });

  // a page the switch brought us to starts by itself again too (Forward back to it, or a reload)
  if (game.opts?.switched) { try { history.replaceState({ ...(history.state || {}), mwAuto: 1 }, ''); } catch { /* ignore */ } }
  label();
  update();
  const api = {
    el,
    update,
    go,
    get shown() { return shown; },
    dispose() { clearUnder(); clearInterval(tick); removeEventListener('resize', onResize); removeEventListener('pageshow', onShow); removeEventListener('pagehide', onHide); document.removeEventListener('mw:lang', label); el.remove(); },
  };
  window.__modeSwitch = api;
  return api;
}

function injectStyle() {
  if (document.getElementById('mode-switch-style')) return;
  const s = document.createElement('style');
  s.id = 'mode-switch-style';
  s.textContent = `
  #mode-switch { position: absolute; right: calc(8px + env(safe-area-inset-right)); top: calc(70px + env(safe-area-inset-top)); z-index: 31 !important;
    display: flex; padding: 3px; gap: 0; border-radius: 999px; border: 2px solid #8a6a1f; background: #fbf5e8;
    box-shadow: 0 3px 0 rgba(138,106,31,.55), 0 6px 14px rgba(59,42,26,.22);
    opacity: 0; visibility: hidden; transform: translateY(-4px); transition: opacity .35s ease, transform .35s ease, visibility 0s linear .35s; }
  #mode-switch.on { opacity: 1; visibility: visible; transform: none; transition: opacity .35s ease, transform .35s ease, visibility 0s; }
  #mode-switch .ms-knob { position: absolute; left: 3px; top: 3px; bottom: 3px; width: 50%; border-radius: 999px; background: #7a2a2a;
    box-shadow: inset 0 -2px 0 rgba(0,0,0,.18); transition: transform .3s cubic-bezier(.3,.9,.3,1), width .3s ease; }
  #mode-switch .ms-half { position: relative; z-index: 1; min-height: 40px; min-width: 64px; padding: 0 14px; border: 0; border-radius: 999px;
    background: transparent; color: #5a4320; cursor: pointer; font: 700 14px/1.6 "Noto Sans Myanmar", system-ui, sans-serif;
    transition: color .3s ease; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
  html[data-lang="en"] #mode-switch .ms-half { font-size: 13.5px; letter-spacing: .01em; }
  #mode-switch .ms-half[aria-pressed="true"] { color: #fbf5e8; cursor: default; }
  #mode-switch:not(.is-game) .ms-half[data-mode="site"], #mode-switch.is-game .ms-half[data-mode="game"] { color: #fbf5e8; }
  #mode-switch:not(.is-game) .ms-half[data-mode="game"], #mode-switch.is-game .ms-half[data-mode="site"] { color: #5a4320; }
  #mode-switch .ms-half:focus-visible { outline: 2px solid #c9a24a; outline-offset: 2px; }
  #mode-switch .ms-half[aria-pressed="false"]:active { transform: translateY(1px); }
  #labels .label.ms-under { opacity: 0 !important; pointer-events: none !important; transition: opacity .25s ease; }
  .ms-cover { position: fixed; inset: 0; z-index: 9999; perspective: 1400px; overflow: hidden; touch-action: none; }
  .ms-cover .ms-leaf { position: absolute; inset: 0; transform-origin: 0 50%; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(90deg, #EFE6D0 0%, #F7F1E1 12%, #FBF7EC 70%, #EDE3CB 100%); box-shadow: inset 0 0 60px rgba(120,90,40,.18); }
  .ms-cover .ms-leaf::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(180deg, transparent 0 27px, rgba(70,110,170,.13) 27px 28px); }
  .ms-cover .ms-leaf p { position: relative; margin: 0; font: 600 19px/1.7 "Noto Sans Myanmar", system-ui, sans-serif; color: #6B4A1E; }
  @media (prefers-reduced-motion: reduce) { #mode-switch, #mode-switch .ms-knob { transition: opacity .2s; } }
  `;
  document.head.appendChild(s);
}
