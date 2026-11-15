// Keeps the game on the phone after the first visit (see sw.js). Does nothing unless the page is
// the live build (tools/build-live.mjs puts window.__LIVE = true and window.__BUILD = "<version>"
// into dist/index.html). On the dev source pages it only removes a worker left from a live test.
//   ?nosw  turns it off and removes it (also on the live site)
// Website mode (no ?story) also downloads the story game in the background, so the Game | Website switch
// (js/game/modeswitch.js) finds it all in the cache: see warmLoop() below.
const sw = navigator.serviceWorker;
const live = window.__LIVE === true && !new URLSearchParams(location.search).has('nosw');
const BUILD = String(window.__BUILD || 'live');

async function removeAll() {
  try {
    for (const r of await sw.getRegistrations()) if (/\/sw\.js(\?|$)/.test(r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || '')) await r.unregister();
    for (const k of await caches.keys()) if (k.startsWith('rc-')) await caches.delete(k);
  } catch { /* nothing to remove */ }
}

// Ask the active worker something; resolves null if there is none or it does not answer.
let activeWorker = null;
function ask(msg, target = sw.controller || activeWorker, ms = 60000) {
  if (!target) return Promise.resolve(null);
  return new Promise((res) => {
    const ch = new MessageChannel();
    const t = setTimeout(() => res(null), ms);
    ch.port1.onmessage = (e) => { clearTimeout(t); res(e.data); };
    try { target.postMessage(msg, [ch.port2]); } catch { clearTimeout(t); res(null); }
  });
}

// "Quiet" = the game is running and nothing has been downloaded for a moment, so the cache
// fills only in gaps and never slows a town or a room that the game is loading.
let lastNet = performance.now();
try {
  new PerformanceObserver((l) => { for (const e of l.getEntries()) lastNet = Math.max(lastNet, e.responseEnd || e.startTime); })
    .observe({ type: 'resource', buffered: true });
} catch { /* old browser: time only */ }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function busy() {
  if (!window.__mwGame) return true;
  if (performance.now() - lastNet < 2500) return true;
  // (the town loader still bringing towns in: its own downloads go first)
  try { const tl = window.__townLoader; if (tl && (tl.busy?.() || tl.waiting?.())) return true; } catch { /* no loader */ }
  return false;
}
async function quiet() {
  while (busy()) await sleep(1000);
  await new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 3000 }) : setTimeout(r, 50)));
}
const saveData = () => !!navigator.connection?.saveData;
const slowLine = () => /(^|-)2g$/.test(navigator.connection?.effectiveType || ''); // 2g / slow-2g: the core only
const storyMode = /[?&]story(=|&|$)/.test(location.search);

let filling = false;
async function fill() {
  if (filling || saveData()) return;
  filling = true;
  let fails = 0;
  await sleep(20000); // the first seconds of play belong to the game's own loading
  for (;;) {
    await quiet();
    if (!navigator.onLine) { await sleep(15000); continue; }
    const r = await ask({ type: 'fill', n: 3 });
    // (no answer in time, e.g. a slow line: try again later, not give up for the whole visit)
    if (!r || r.error) { if (++fails > 8) break; await sleep(30000); continue; }
    fails = 0;
    if (r.full || !(r.left > 0)) break;
    await sleep(r.got ? 1500 : 20000); // nothing came: the connection is down, wait longer
  }
  filling = false;
}

// Website mode: the game, sooner and faster than fill(). Once the website is up and its network has been quiet for
// ~5 s (never during its own first load or while a room/sheet is loading: quiet()), the worker caches the game's
// start files for this visitor's save first (today's page, its towns; sw.js firstFor), then the rest in game
// order, several files at a time. Touching the switch (warm()) starts at once and skips the waits.
let warmNow = false, warmWake = null;
const warmLog = []; // [ms, got, left] per batch (window.__sw.warmLog, for tests)
function saveInfo() {
  try {
    const s = JSON.parse(localStorage.getItem('rc-story-v1') || 'null');
    return { day: (s && s.day) || 1, place: s && s.place ? { x: s.place.x, z: s.place.z } : null };
  } catch { return { day: 1, place: null }; }
}
function warm() {
  if (!sw || !live || storyMode || warmNow) return;
  warmNow = true;
  warmWake?.();
  // (one batch of the start files right now, whatever the loop is doing)
  if (!saveData() && !slowLine()) ask({ type: 'fill', n: 12, par: 6, save: saveInfo() }, undefined, 30000);
}
function nap(ms) { return new Promise((r) => { const t = setTimeout(r, ms); warmWake = () => { clearTimeout(t); r(); }; }); }
async function warmLoop() {
  if (filling || saveData() || slowLine()) return;
  filling = true;
  let fails = 0;
  const t0 = performance.now();
  // ~5 s after the website is up (or at once when the switch shows or is touched)
  while (!warmNow && performance.now() - t0 < 5000 && !window.__modeSwitch?.shown) await nap(500);
  for (;;) {
    // (the page's own network quiet for 2.5 s; no idle-callback wait: the downloads run in the worker, not here)
    while (!warmNow && busy()) await nap(700);
    if (!navigator.onLine) { await nap(15000); continue; }
    const fast = !/3g/.test(navigator.connection?.effectiveType || '');
    const r = await ask({ type: 'fill', n: warmNow ? 12 : fast ? 8 : 4, par: warmNow ? 6 : fast ? 4 : 2, save: saveInfo() });
    warmLog.push([Math.round(performance.now()), r ? r.got : -1, r ? r.left : -1]);
    if (!r || r.error) { if (++fails > 8) break; await nap(10000); continue; }
    fails = 0;
    if (r.full || !(r.left > 0)) break;
    if (!warmNow) await nap(r.got ? 300 : 20000);
  }
  filling = false;
}

// The switch is about to leave for the other mode (modeswitch.js, while its page turns): a first install that is
// still running finishes first (up to maxMs), so the other mode loads from the cache instead of fetching the same
// files a second time beside the install. Resolves at once on the dev pages, when the worker is already in charge,
// or when there is none.
async function beforeSwitch(maxMs = 8000) {
  if (!live || !sw) return;
  warm();
  if (sw.controller) return;
  try {
    const reg = await sw.getRegistration('./');
    const w = reg && (reg.installing || reg.waiting);
    if (!w) return;
    await Promise.race([sleep(maxMs), new Promise((res) => {
      const done = () => { if (w.state === 'activated' || w.state === 'redundant') res(); };
      w.addEventListener('statechange', done);
      done();
    })]);
  } catch { /* go anyway */ }
}

let newer = null;
async function upgrade(v) {
  if (!v || v === BUILD || v === newer) return;
  newer = v;
  await quiet();
  try { await sw.register('sw.js?v=' + encodeURIComponent(v), { scope: './', updateViaCache: 'none' }); } catch { /* try next visit */ }
}

const st = (v) => { window.__sw.stage = v; };
async function start() {
  sw.addEventListener('message', (e) => { if (e.data?.type === 'rc-latest') upgrade(e.data.version); });
  const reg = await sw.getRegistration('./').catch(() => null);
  // A newer version finished installing during an earlier visit: it takes over now, on the
  // cover, before anything is played (one quick reload from the phone's cache).
  if (reg?.waiting && sw.controller && !window.__mwGame) {
    // (listening BEFORE asking, and for good: the new worker can take over before its "ok" reaches this page, or
    // after this wait ran out (a waiting worker can take seconds to wake on a busy phone); a page left running the
    // old version's code under the new worker, whose install deleted the old files, would mix the two versions)
    const old = sw.controller;
    const reload = () => {
      // (the page the mode switch landed on, its turning page up: it starts by itself again after the reload,
      // as boot.js switchedHere() does for a page marked mwAuto)
      try { if (document.documentElement.classList.contains('mw-turn')) history.replaceState({ ...(history.state || {}), mwAuto: 1 }, ''); } catch { /* ignore */ }
      location.reload();
    };
    sw.addEventListener('controllerchange', reload, { once: true });
    const r = await ask({ type: 'skip' }, reg.waiting, 10000);
    if (r?.ok || sw.controller !== old) return;
  }
  st('wait-game');
  if (!sw.controller) {
    // First visit: wait until the game runs and the network is quiet, then install.
    while (!window.__mwGame) await sleep(1000);
    await quiet();
  }
  st('register');
  if (!sw.controller) {
    // Tell the installing worker the exact URLs this page loaded, so it can copy them from the
    // browser's HTTP cache instead of downloading them again ("js/boot.js?v=6" is not "js/boot.js").
    try {
      const urls = performance.getEntriesByType('resource').map((e) => e.name).filter((u) => u.startsWith(location.origin));
      urls.push(location.href);
      await (await caches.open('rc-' + BUILD)).put('https://rc-meta.invalid/seen', new Response(JSON.stringify(urls)));
    } catch { /* storage off: the worker just downloads */ }
  }
  try {
    // (a newer version already waiting or installing is left alone: registering this page's own version again
    // would replace it with this older one)
    const now = sw.controller && (await sw.getRegistration('./').catch(() => null));
    const next = now && (now.waiting || now.installing);
    if (!(next && !next.scriptURL.endsWith('?v=' + encodeURIComponent(BUILD)))) {
      await sw.register('sw.js?v=' + encodeURIComponent(BUILD), { scope: './', updateViaCache: 'none' });
    }
    activeWorker = (await sw.ready).active;
  } catch (e) { st('failed ' + (e && e.message)); return; } // private mode, storage off: the game just uses the network
  // (a page opened with a hard reload is never controlled; the active worker still answers)
  if (!sw.controller) await Promise.race([new Promise((r) => sw.addEventListener('controllerchange', r, { once: true })), sleep(10000)]);
  st('controlled');
  const hello = await ask({ type: 'hello' });
  if (hello?.latest) upgrade(hello.latest);
  while (!window.__mwGame) await sleep(1000);
  if (storyMode) fill(); else warmLoop();
}

window.__sw = { status: () => ask({ type: 'hello' }), live, stage: 'off', busy, warm, beforeSwitch, warmLog };
if (sw && window.caches) {
  if (live) start().catch((e) => st('error ' + (e && e.message)));
  else removeAll();
}
