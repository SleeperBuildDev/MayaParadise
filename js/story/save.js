// Story progress, kept on this device (localStorage 'rc-story-v1'). The cloud save (anonymous, then name +
// password) will mirror this same object later.
//
//   const save = loadSave()            always returns a valid object (new fields filled in, old ids renamed)
//   save.flags[name] = value; persist(save)
//   canOpenNextDay(save)               no real-day lock: true as soon as the page is written up
//   addItem(save, id, n) / has(save, id)
//
// Fields added for Days 2-15 (days/INDEX.md 4, 5, 9, 10):
//   lookalikesGone [cardId]   look-alike cards that left every hand for good (wouldnt, holdtight, lucky, ignore)
//   companions [id]           companions that have lifted off the page (companions.js ids, chapter order)
//   companionsOn [id]         the ones carried today (max 8; empty = all)
//   proofs { rumourId: line } the text on each proof slip (bag id 'proof:<rumourId>')
//   cargo { id, prop? }|null  something riding in the car (desks refuse page-turns while loaded)
//   paint [{ id, pts, state }] Painted Map lines on the notebook map ('paint' | 'rubbed')
//   cardsGone [cardId]        `once` cards that fitted and left the hand for good (Day 12's notes)
//   pot [itemId]              paper kept dry in the storage pot
//   home { bed, ... }         the home bed, the window, the trunk (day scripts)
//   weather 'rain'|null       scripted weather in effect (Day 12)
const KEY = 'rc-story-v1';
const VERSION = 1;
const RENAMED = { hninsi: 'thiri', kothaw: 'kolwin', kohlaing: 'kothiha', ubathaw: 'ubolay', maungye: 'maungarkar', uzeya: 'kyinyein', kophone: 'pyaesone', noodleaunty: 'sawyu' };

function blank() {
  return {
    v: VERSION,
    created: new Date().toISOString(),
    day: 1, // the story page the player is on
    dayDone: false, // finished today's page (written up in the Writing Room)
    dayDoneOn: null, // local date (YYYY-MM-DD) when it was written up
    flags: {}, // quest steps and choices
    bag: {}, // item id -> count
    trunk: {}, // items kept at home
    companions: [], // companion ids that have lifted off the page
    companionsOn: [],
    pencil: {}, // place or person id -> 'pencil' | 'ink' | 'erased'
    stamps: [], // chapter numbers stamped "Reality Check" (and 'reply' on Day 15)
    pencilStamps: [], // chapters pencilled in, not yet inked (D9 15, D13 21)
    notebook: { sleptAt: [] }, // where the travelling notebook slept, night by night
    place: { mode: 'car', x: 0, z: 0, heading: 0 },
    lookalikesGone: [],
    cardsGone: [],
    proofs: {},
    cargo: null,
    paint: [],
    pot: [],
    home: {},
    weather: null,
  };
}

function migrate(s) {
  // companions were chapter numbers in the first draft
  s.companions = (s.companions || []).map((c) => (typeof c === 'number' ? ({ 1: 'sheep', 2: 'fish', 3: 'parrot', 4: 'stage', 5: 'seedling', 6: 'pot', 7: 'cloud', 8: 'earth', 9: 'firefly', 10: 'ribbon', 11: 'key', 12: 'caterpillar', 13: 'beetle', 14: 'ember', 15: 'bench', 16: 'tendril', 17: 'cat', 18: 'note', 19: 'cup', 20: 'lid', 21: 'touchmenot', 22: 'glasses', 23: 'star' }[c] || c) : c));
  // people renamed in the continuity pass (days/INDEX.md 3)
  for (const n of s.notebook?.sleptAt || []) if (RENAMED[n.who]) n.who = RENAMED[n.who];
  for (const k of Object.keys(s.pencil || {})) if (RENAMED[k]) { s.pencil[RENAMED[k]] = s.pencil[k]; delete s.pencil[k]; }
  return s;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const s = JSON.parse(raw);
    if (!s || s.v !== VERSION) return blank();
    const b = blank();
    const out = Object.assign(b, s);
    for (const k of ['flags', 'bag', 'trunk', 'pencil', 'proofs', 'home']) if (!out[k] || typeof out[k] !== 'object') out[k] = {};
    for (const k of ['companions', 'companionsOn', 'stamps', 'pencilStamps', 'lookalikesGone', 'cardsGone', 'paint', 'pot']) if (!Array.isArray(out[k])) out[k] = [];
    if (!out.notebook || !Array.isArray(out.notebook.sleptAt)) out.notebook = { sleptAt: [] };
    return migrate(out);
  } catch {
    return blank();
  }
}

export function persist(save) {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* private mode: progress lasts this visit */ }
}

export function resetSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  return blank();
}

/** The story calendar day: the phone's own local date, turning over at 4 a.m. (late-night play still counts as tonight). */
export const today = () => {
  const d = new Date(Date.now() - 4 * 3600 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** No real-day lock (owner, 2026-11-13): a finished page opens the next one straight away. */
export function canOpenNextDay(save) {
  return !!save.dayDone;
}

export function addItem(save, id, n = 1) {
  save.bag[id] = (save.bag[id] || 0) + n;
  if (save.bag[id] <= 0) delete save.bag[id];
}
export const has = (save, id) => (save.bag[id] || 0) > 0;

/** A flag expression as day data writes it: 'd13.rumour.shuttle', '!d4.map', 'a && !b', 'bag:glass', 'day>=9'. */
export function testFlags(save, expr) {
  if (expr == null || expr === '') return true;
  if (typeof expr === 'function') return !!expr(save);
  return String(expr).split('||').some((alt) => alt.split('&&').every((t) => {
    let s = t.trim();
    let neg = false;
    while (s.startsWith('!')) { neg = !neg; s = s.slice(1).trim(); }
    let v;
    const m = s.match(/^day\s*(>=|<=|>|<|==)\s*(\d+)$/);
    if (m) { const d = save.day, n = +m[2]; v = m[1] === '>=' ? d >= n : m[1] === '<=' ? d <= n : m[1] === '>' ? d > n : m[1] === '<' ? d < n : d === n; }
    else if (s.startsWith('bag:')) v = has(save, s.slice(4));
    else if (s.startsWith('companion:')) v = save.companions.includes(s.slice(10));
    else v = !!save.flags[s];
    return neg ? !v : v;
  }));
}
