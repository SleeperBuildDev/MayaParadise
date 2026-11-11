// Reads content from index.html (the single source of truth) for cards, labels and sheets.
// Station articles are MOVED into the sheet while open and put back afterwards, so ids stay unique.

const lang = () => document.documentElement.getAttribute('data-lang') || 'my';

/** Text of an element in the current language (prefers the [lang] span, else the whole text). */
export function textIn(el, l = lang()) {
  if (!el) return '';
  const span = el.querySelector(`[lang="${l}"]`);
  const src = span || el;
  return (src.textContent || '').replace(/\s+/g, ' ').trim();
}

export function placeEl(id) {
  return document.querySelector(`section.place[data-place="${id}"]`);
}
export function stationEl(id) {
  return document.querySelector(`[data-station="${id}"]`);
}
export function placeTitle(id) {
  return textIn(placeEl(id)?.querySelector('h2'));
}
export function stationTitle(id) {
  return textIn(stationEl(id)?.querySelector('h3'));
}
/** Short label for a station (first ~26 characters of its title). */
export function stationLabel(id) {
  const t = stationTitle(id);
  return t.length > 28 ? t.slice(0, 26).trim() + '…' : t;
}
export function placeFrom(id) {
  const f = placeEl(id)?.dataset.from;
  if (!f) return '';
  return lang() === 'my' ? `${f} မှ စတင်` : `from ${f}`;
}
/** Which place a station id belongs to. */
export function placeOfStation(stationId) {
  return stationEl(stationId)?.closest('section.place')?.dataset.place || null;
}

const borrowed = [];
/** Move station articles (or a whole place's stations) into a container; returns a restore function. */
export function borrowInto(container, stationIds) {
  restoreAll();
  for (const id of stationIds) {
    const el = stationEl(id);
    if (!el) continue;
    const marker = document.createComment(`station:${id}`);
    el.parentNode.insertBefore(marker, el);
    borrowed.push({ el, marker });
    container.appendChild(el);
    el.querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = 'eager'));
  }
  return restoreAll;
}
export function restoreAll() {
  while (borrowed.length) {
    const { el, marker } = borrowed.pop();
    marker.parentNode?.insertBefore(el, marker);
    marker.remove();
  }
}

/** Follower numbers from the single <script id="mw-stats"> block in index.html (see README). */
export function stat(key, fallback = '') {
  let s = window.MayaSite?.stats;
  if (!s || !Object.keys(s).length) {
    try { s = JSON.parse(document.getElementById('mw-stats').textContent); } catch { s = {}; }
  }
  const v = s[key];
  if (v && typeof v === 'object') return v[document.documentElement.dataset.lang === 'en' ? 'en' : 'my'] || fallback;
  return typeof v === 'string' && v ? v : fallback;
}
