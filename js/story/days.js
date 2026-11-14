// The fifteen story pages. Each is a module js/story/dayN.js with
//   create(story) -> { start(), update(dt, t), talk: { personId: fn }, dispose()? , roomOpts?, enterRoom?, ... }
// loaded lazily (a page that is not written yet simply has no module: the town is free to wander).
// No real-day lock (owner, 2026-11-13): the night page sets save.day = N + 1 and story.turnPage() opens it.
// dispose() lets the page turn in place (people, props and obstacles the day made go away); without it the
// game reloads straight into the next page.

export const DAY_COUNT = 15;

/** Chapter(s) each day plays (days/INDEX.md 1), for headers and the dev pages. */
export const DAY_CHAPTERS = { 1: [1], 2: [3, 4], 3: [5, 9], 4: [6, 7], 5: [2, 10], 6: [8], 7: [4, 11], 8: [12, 13], 9: [14, 15], 10: [15, 16, 17], 11: [18], 12: [19, 20], 13: [21, 22], 14: [21, 23], 15: ['reply'] };

const cache = new Map();

/** The module for story day n (1..15), or null when that page is not written yet. */
export async function loadDay(n) {
  n = Math.max(1, Math.min(DAY_COUNT, n | 0 || 1));
  if (cache.has(n)) return cache.get(n);
  let mod = null;
  try {
    mod = await import(`./day${n}.js`);
  } catch (e) {
    // a missing file is "not written yet"; anything else is a real error worth seeing
    const msg = String(e?.message || e);
    if (!/Failed to fetch|Importing a module script failed|error loading dynamically imported module|404|Cannot find module/i.test(msg)) console.error(`day ${n}`, e);
    mod = null;
  }
  if (mod && typeof mod.create !== 'function') mod = null;
  if (mod) globalThis.__townLoader?.dayStarts?.(n); // (lazy towns: this page's towns first)
  cache.set(n, mod);
  return mod;
}

/** The days written so far (checks each file once; for dev pages). */
export async function writtenDays() {
  const out = [];
  for (let n = 1; n <= DAY_COUNT; n++) if (await loadDay(n)) out.push(n);
  return out;
}
