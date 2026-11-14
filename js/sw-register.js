// Keeps the game on the phone after the first visit (see sw.js). Does nothing unless the page is
// the live build (tools/build-live.mjs puts window.__LIVE = true and window.__BUILD = "<version>"
// into dist/index.html). On the dev source pages it only removes a worker left from a live test.
//   ?nosw  turns it off and removes it (also on the live site)
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
function ask(msg, target = sw.controller, ms = 60000) {
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
  try { const s = window.__townLoader?.stats?.(); if (s && (s.loading > 0 || s.pending > 0 || s.busy)) return true; } catch { /* no loader */ }
  return false;
}
async function quiet() {
  while (busy()) await sleep(1000);
  await new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 3000 }) : setTimeout(r, 50)));
}
const saveData = () => !!navigator.connection?.saveData;

let filling = false;
async function fill() {
  if (filling || saveData()) return;
  filling = true;
  await sleep(20000); // the first seconds of play belong to the game's own loading
  for (;;) {
    await quiet();
    if (!navigator.onLine) { await sleep(15000); continue; }
    const r = await ask({ type: 'fill', n: 3 });
    if (!r || r.full || r.error || !(r.left > 0)) break;
    await sleep(r.got ? 1500 : 20000); // nothing came: the connection is down, wait longer
  }
  filling = false;
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
    const r = await ask({ type: 'skip' }, reg.waiting, 3000);
    if (r?.ok) {
      sw.addEventListener('controllerchange', () => location.reload(), { once: true });
      return;
    }
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
    await sw.register('sw.js?v=' + encodeURIComponent(BUILD), { scope: './', updateViaCache: 'none' });
    await sw.ready;
  } catch (e) { st('failed ' + (e && e.message)); return; } // private mode, storage off: the game just uses the network
  if (!sw.controller) await new Promise((r) => sw.addEventListener('controllerchange', r, { once: true }));
  st('controlled');
  const hello = await ask({ type: 'hello' });
  if (hello?.latest) upgrade(hello.latest);
  while (!window.__mwGame) await sleep(1000);
  fill();
}

window.__sw = { status: () => ask({ type: 'hello' }), live, stage: 'off', busy };
if (sw && window.caches) {
  if (live) start().catch((e) => st('error ' + (e && e.message)));
  else removeAll();
}
