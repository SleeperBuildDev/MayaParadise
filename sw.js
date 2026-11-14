// Reality Check offline cache (service worker). Registered ONLY by the live build
// (js/sw-register.js checks window.__LIVE), never on the dev source pages.
//
// One cache per build version ("rc-<version>"), filled from ./precache.json, written by
// tools/build-live.mjs:  { version, core: [paths], rest: [paths], hash?: { path: sha256-hex16 } }
//   install  : core files (most are already in the browser's HTTP cache after the first play,
//              so this costs almost nothing); files whose hash did not change are copied from
//              the previous version's cache instead of downloaded again.
//   later    : the page asks for "rest" a few files at a time while the game is idle (fill).
//   activate : old rc-* caches are deleted. A new version never takes over mid-play: it waits
//              until the next visit (sw-register.js reloads once on the cover if one is waiting).
// Requests: code, fonts, images -> cache first (one version per cache, so never mixed with a
// newer deploy); a miss goes to the network and is kept. The page itself (index.html) also
// comes from this version's cache, so the page and its code always match; in the background
// the network copy is checked, and if it carries a newer build the page is told (it then
// registers the new worker, which installs quietly and takes over on the next visit).
// Never touched: dev/, tools/, out-*.txt, *.md, other origins, non-GET, range requests.
// Storage full or any cache error: it fails soft and the request just goes to the network.

const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const PREFIX = 'rc-';
const CACHE = PREFIX + VERSION;
const META = 'https://rc-meta.invalid/'; // keys for our own records inside the cache
const SCOPE = new URL(self.registration.scope);
const SKIP = /^(dev|tools)\/|^out-[^/]*\.txt$|\.md$|^sw\.js$|^precache\.json$/;

let manifest = null; // { version, core, rest, hash }
let full = false; // storage quota reached: stop filling
let latest = null; // newest build seen on the network
const bad = new Set(); // files that failed their hash check this session: not retried

// "js/boot.js?v=6" -> "<scope>js/boot.js"; the page is "<scope>index.html".
function rel(url) {
  const u = new URL(url);
  if (u.origin !== SCOPE.origin || !u.pathname.startsWith(SCOPE.pathname)) return null;
  let p = decodeURIComponent(u.pathname.slice(SCOPE.pathname.length));
  if (p === '' || p.endsWith('/')) p += 'index.html';
  return p;
}
const keyOf = (p) => new URL(p, SCOPE).href;

async function hashOf(res) {
  const buf = await res.clone().arrayBuffer();
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
  return Array.from(d.slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function put(cache, p, res) {
  if (full) return false;
  try {
    await cache.put(keyOf(p), res);
    return true;
  } catch (e) {
    if (e && (e.name === 'QuotaExceededError' || /quota/i.test(e.message))) full = true;
    return false;
  }
}

// Fetch one file for the cache. 'default' lets the HTTP cache answer (the page just loaded it);
// with a hash from the manifest a stale copy is caught and fetched again past the HTTP cache.
// `seen` maps a path to the exact URL the page loaded it by ("js/boot.js?v=6"), which is
// the browser's HTTP-cache key; sw-register.js leaves that list in this cache before install.
async function grab(cache, p, man, seen) {
  const want = man.hash && man.hash[p];
  const url = (seen && seen[p]) || keyOf(p);
  for (const mode of want ? ['default', 'reload'] : ['no-cache']) {
    let res;
    try { res = await fetch(mode === 'reload' ? keyOf(p) : url, { cache: mode, credentials: 'same-origin' }); } catch { return null; }
    if (!res.ok || res.type !== 'basic') return null;
    if (want && (await hashOf(res)) !== want) continue;
    return put(cache, p, res);
  }
  return false; // the server has a different file than this version: do not keep it
}

async function loadManifest(cache) {
  if (manifest) return manifest;
  try {
    const r = await cache.match(META + 'manifest');
    if (r) manifest = await r.json();
  } catch { /* none yet */ }
  return manifest;
}

// Files with an unchanged hash are copied from an older rc-* cache (an update downloads only
// what changed).
async function copyOld(cache, man, paths) {
  if (!man.hash) return new Set();
  const done = new Set();
  for (const name of await caches.keys()) {
    if (!name.startsWith(PREFIX) || name === CACHE) continue;
    const old = await caches.open(name);
    let oldMan = null;
    try { oldMan = await (await old.match(META + 'manifest'))?.json(); } catch { /* ignore */ }
    if (!oldMan || !oldMan.hash) continue;
    for (const p of paths) {
      if (done.has(p) || !man.hash[p] || oldMan.hash[p] !== man.hash[p]) continue;
      const r = await old.match(keyOf(p));
      if (r && (await put(cache, p, r))) done.add(p);
    }
  }
  return done;
}

async function pool(items, n, fn) {
  let i = 0;
  const run = async () => { while (i < items.length) await fn(items[i++]); };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, run));
}

async function missing(cache, paths) {
  const out = [];
  for (const p of paths) if (!(await cache.match(keyOf(p)))) out.push(p);
  return out;
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    let man = null;
    try {
      const r = await fetch(new URL('precache.json?v=' + encodeURIComponent(VERSION), SCOPE).href, { cache: 'no-cache' });
      if (r.ok) man = await r.json();
    } catch { /* offline */ }
    if (man && String(man.version) !== VERSION) {
      // The site was updated after this page was served: keep what this version already has.
      man = await loadManifest(cache);
      if (!man) throw new Error('precache.json is from another build');
      return;
    }
    if (!man) throw new Error('precache.json not reachable');
    man.core = [...new Set(['index.html', ...(man.core || [])])];
    man.rest = (man.rest || []).filter((p) => !man.core.includes(p));
    await put(cache, META + 'manifest', new Response(JSON.stringify(man), { headers: { 'content-type': 'application/json' } }));
    manifest = man;
    const hadOld = (await caches.keys()).some((n) => n.startsWith(PREFIX) && n !== CACHE);
    const copied = await copyOld(cache, man, [...man.core, ...man.rest]);
    const todo = await missing(cache, man.core.filter((p) => !copied.has(p)));
    const seen = {};
    try {
      for (const u of (await (await cache.match(META + 'seen'))?.json()) || []) { const p = rel(u); if (p) seen[p] = u; }
    } catch { /* none */ }
    await pool(todo, 4, (p) => grab(cache, p, man, seen));
    // An update must be complete before it may replace a working version; a first install
    // keeps whatever it got (the rest still comes from the network and is kept as it arrives).
    if (hadOld && (await missing(cache, man.core)).length) throw new Error('update incomplete, will retry');
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
    await self.clients.claim();
  })());
});

// Background check of the page on the network: a different build means a new version exists.
async function checkLatest() {
  try {
    const r = await fetch(keyOf('index.html'), { cache: 'no-cache', credentials: 'same-origin' });
    if (!r.ok) return;
    const m = /__BUILD\s*=\s*["']([^"']+)["']/.exec(await r.text());
    if (!m || m[1] === VERSION || m[1] === latest) return;
    latest = m[1];
    for (const c of await self.clients.matchAll({ type: 'window' })) c.postMessage({ type: 'rc-latest', version: latest });
  } catch { /* offline */ }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const p = rel(req.url);
  if (!p || SKIP.test(p)) return;
  const nav = req.mode === 'navigate';
  if (nav && p !== 'index.html') return;
  event.respondWith((async () => {
    let cache = null;
    try {
      cache = await caches.open(CACHE);
      const hit = await cache.match(keyOf(p));
      if (hit) {
        if (nav) event.waitUntil(checkLatest());
        return hit;
      }
    } catch { /* storage unavailable: network only */ }
    try {
      const res = await fetch(req);
      if (cache && res.ok && res.type === 'basic') event.waitUntil(put(cache, p, res.clone()));
      return res;
    } catch (err) {
      if (nav && cache) {
        const page = await cache.match(keyOf('index.html'));
        if (page) return page;
      }
      throw err;
    }
  })());
});

// Messages from js/sw-register.js:
//   hello -> { version, latest, cached, total, full }
//   fill  -> caches up to n missing "rest" files, replies { got, left, full }
//   skip  -> a waiting version takes over (only when this is the only open page)
self.addEventListener('message', (event) => {
  const msg = event.data || {};
  const reply = (v) => { try { event.ports[0]?.postMessage(v); } catch { /* page gone */ } };
  if (msg.type === 'skip') {
    event.waitUntil(self.clients.matchAll({ type: 'window' }).then((list) => {
      if (list.length <= 1) return self.skipWaiting().then(() => reply({ ok: true }));
      reply({ ok: false });
    }));
    return;
  }
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      const man = await loadManifest(cache);
      if (!man) return reply({ version: VERSION, latest, left: 0, full });
      if (msg.type === 'hello') {
        const all = [...man.core, ...man.rest];
        const miss = await missing(cache, all);
        return reply({ version: VERSION, latest, cached: all.length - miss.length, total: all.length, full });
      }
      if (msg.type === 'fill') {
        const miss = full ? [] : (await missing(cache, man.rest)).filter((p) => !bad.has(p));
        const batch = miss.slice(0, Math.max(1, Math.min(8, msg.n | 0 || 3)));
        let got = 0;
        await pool(batch, 2, async (p) => { const r = await grab(cache, p, man); if (r) got++; else if (r === false && !full) bad.add(p); });
        return reply({ got, left: full ? 0 : miss.length - got, full });
      }
    } catch (e) {
      reply({ error: String(e && e.message), left: 0, full });
    }
  })());
});
