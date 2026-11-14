// Lazy towns (?lazy=1): which towns the boot needs, decided as early as possible. boot.js imports this at the
// tap (alongside the game's code), so the starting towns download in parallel with everything else instead of
// after the whole story graph; region.js then merges them (the same module instances, already here).
//   BOOT_TOWNS  towns within 70 m of where the save puts her (or of the home book), plus today's own imports
//   BOOT_MODS   Promise of their modules (null for one that failed: the town loader fetches it again)
import { TOWNS, DAY_IMPORTS, FILES } from './regions/outlines.js';
import { REGION as HOME } from './regions/home.js';

function pick() {
  let save = null;
  try { save = JSON.parse(globalThis.localStorage?.getItem('rc-story-v1') || 'null'); } catch { save = null; }
  const q = new URLSearchParams(globalThis.location?.search || '');
  const day = Math.max(1, Math.min(15, +q.get('day') || save?.day || 1));
  const sp = !q.has('reset') && save?.place && save.place.z > 19.5 ? save.place : null;
  const at = sp ? [sp.x, sp.z, sp.x, sp.z] : HOME.rect;
  const gap = ([a, b, c, d], [e, f, g, h]) => Math.hypot(Math.max(0, e - c, a - g), Math.max(0, f - d, b - h));
  const out = new Set(DAY_IMPORTS[day] || []);
  for (const [t, o] of Object.entries(TOWNS)) if (o.REGION.some((r) => gap(r.rect, at) < 70)) out.add(t);
  return Object.keys(TOWNS).filter((t) => out.has(t));
}

export const BOOT_TOWNS = pick();
// every file of those towns at once (modulepreload: the module map shares them, so nothing is fetched twice)
try {
  const root = new URL('../../../', import.meta.url);
  for (const t of BOOT_TOWNS) for (const f of FILES[t] || []) {
    const l = document.createElement('link');
    l.rel = 'modulepreload'; l.href = new URL(f, root).href;
    document.head.appendChild(l);
  }
  const l = document.createElement('link'); // (and the loader that brings the rest later)
  l.rel = 'modulepreload'; l.href = new URL('./townloader.js', import.meta.url).href;
  document.head.appendChild(l);
} catch { /* no document (tests in node) */ }
export const BOOT_MODS = Promise.all(BOOT_TOWNS.map((t) => import(`./regions/${t}.js`).catch((e) => { console.warn('town', t, e?.message || e); return null; })));
