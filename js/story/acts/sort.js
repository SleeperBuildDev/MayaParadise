// Handwork pattern S: sort cards into baskets (the ONE sort widget; Days 5, 7, 8, 9, 10, 11, 12, 13).
//
//   const r = await sort({ title, hint, who?, baskets, cards, ordered?, stampAll?, wrong?, react?, shuffle = true })
//   r = { ok: true, mistakes: n, placed: { cardId: basketId } }   (cancel: { ok: false, cancelled: true, mistakes, placed })
//
//   baskets: [{ id, label | { my, en } | my/en, icon?, always? }]          2–4 trays (4 sit two by two)
//   cards:   [{ id?, basket, my, en, who?, why?, blot?, icon?, line? }]    up to ~10; one readable at a time
//
// Aliases the day drafts used, all accepted: `slips` / `items` for `cards`; `fits` / `to` / `goes` for
// `basket`; a card's `label: { my, en }` for its own my/en. Look: a deck of paper slips (the front one
// readable, the next ones fanned behind it) above a row of woven baskets with paper tags. Tap a basket to
// drop the front slip in, or drag the slip onto it; ↻ brings the next slip forward. A right drop slides in
// with a pencil tick; a wrong one flies halfway, hops back and the person says why (no penalty, `mistakes`
// counts). `blot: true` slips show an ink blot, no letters.
//   ordered: true      only the first basket (and any `always` tray) is open; the next unties when every
//                      card bound for the current one is in. A drop on a closed basket says `react.order`.
//   wrong:             a line { my, en } | 'repeat' (the slip's own words again, from its speaker) | 'shake'
//   react:             lines for a wrong drop: card.why first, then react.order (closed basket),
//                      react.excuse (an `always`-tray card dropped on a reason basket), react[basketId],
//                      react['wrong' + BasketId] (Day 11's wrongSeen / wrongCheck), then `wrong`.
//                      A line may carry `who` (the person who says it).
//   stampAll:          a line pressed in red across every basket at the end (Day 8)
// Speakers: `who` (the act's person) and card.who are cast ids (js/story/cast.js), 'maya', a person
// object with portrait(), or a canvas. Portraits are drawn lazily from people.js; unknown ids get a chip.
//
// Test hook: window.__act.autoSort({ wrongFirst = false, gap = 420 } = {})
// Also exported for the other acts: portraitOf(who, face) -> Promise<canvas|null>, whoChip(who, opts), nameOf(who)
import { openAct, bi, wait, myNum, buzz, shuffled } from './kit.js';
import { tr } from '../../game/ui.js';

// ------------------------------------------------------------------------------------------------
// Portraits (shared by sort, lockup, turnblock, recall)
// ------------------------------------------------------------------------------------------------
const PCACHE = new Map();
let castMod = null;
async function cast() {
  if (!castMod) castMod = import('../cast.js').catch(() => ({ castById: () => null }));
  return castMod;
}
export async function nameOf(who) {
  if (!who) return null;
  if (who === 'maya') return { my: 'မာရာ', en: 'Maya' };
  if (typeof who === 'object' && who.name) return who.name;
  if (typeof who !== 'string') return null;
  const c = (await cast()).castById?.(who);
  return c?.name || null;
}
export function portraitOf(who, face = 'smile') {
  if (!who) return Promise.resolve(null);
  if (typeof HTMLCanvasElement !== 'undefined' && who instanceof HTMLCanvasElement) return Promise.resolve(who);
  if (typeof who === 'object' && typeof who.portrait === 'function') return Promise.resolve(who.portrait(face));
  if (who === 'maya') return Promise.resolve(mayaPortrait(face));
  const key = `${who}:${face}`;
  if (!PCACHE.has(key)) {
    PCACHE.set(key, (async () => {
      const c = (await cast()).castById?.(who);
      if (!c) return null;
      const { createPerson } = await import('../people.js');
      const p = createPerson(c.look || {});
      const cv = p.portrait(face);
      try { p.dispose?.(); } catch { /* nothing to free */ }
      return cv;
    })().catch(() => null));
  }
  return PCACHE.get(key);
}
// Maya is not in cast.js (she is the game's own actor): a small drawn chip in her look
function mayaPortrait(face) {
  const key = `maya:${face}`;
  if (PCACHE.has(key + ':cv')) return PCACHE.get(key + ':cv');
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const ol = '#2A2118';
  const box = (x, y, w, h, f) => { g.fillStyle = f; g.fillRect(x, y, w, h); g.strokeStyle = ol; g.lineWidth = 3; g.strokeRect(x, y, w, h); };
  box(20, 92, 88, 40, '#D9C2A0');               // beige blazer
  box(52, 92, 24, 40, '#2A2420');               // black blouse
  g.fillStyle = '#D9C2A0'; g.beginPath(); g.moveTo(52, 92); g.lineTo(62, 112); g.lineTo(52, 118); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(76, 92); g.lineTo(66, 112); g.lineTo(76, 118); g.closePath(); g.fill();
  box(26, 18, 76, 72, '#1F1B1B');               // hair behind
  box(34, 26, 60, 60, '#F3CBAA');               // face
  g.fillStyle = '#1F1B1B'; g.fillRect(31, 20, 66, 14); g.fillRect(31, 20, 10, 40); g.fillRect(87, 20, 10, 40); // fringe and sides
  g.fillStyle = '#C9A24A'; g.fillRect(84, 66, 5, 7);  // earring
  g.fillStyle = ol;                               // eyes and mouth
  const happy = /happy|laugh|smile/.test(face);
  if (happy) { g.lineWidth = 3; g.beginPath(); g.arc(50, 56, 5, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.arc(78, 56, 5, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
  else { g.fillRect(46, 50, 7, 9); g.fillRect(75, 50, 7, 9); }
  g.fillStyle = '#E8879A'; g.globalAlpha = 0.5; g.fillRect(40, 64, 9, 5); g.fillRect(79, 64, 9, 5); g.globalAlpha = 1;
  g.strokeStyle = '#8A3A3A'; g.lineWidth = 3; g.beginPath();
  if (face === 'talk') { g.fillStyle = '#8A3A3A'; g.fillRect(58, 70, 12, 7); } else g.arc(64, 68, 7, 0.2, Math.PI - 0.2);
  g.stroke();
  PCACHE.set(key + ':cv', cv);
  return cv;
}
// A round portrait chip (filled when the portrait is ready); falls back to the name's first letter
export function whoChip(who, { face = 'smile', size = 40, cls = '' } = {}) {
  injectSortStyle();
  const el = document.createElement('span');
  el.className = `ak-who ${cls}`;
  el.style.setProperty('--s', `${size}px`);
  el.dataset.who = typeof who === 'string' ? who : '';
  const fill = (src) => {
    const cv = document.createElement('canvas');
    const px = Math.round(size * Math.min(2, window.devicePixelRatio || 1));
    cv.width = cv.height = px;
    const g = cv.getContext('2d');
    if (src) g.drawImage(src, 8, 0, 112, 112, 0, 0, px, px); // head and a little of the shoulders
    el.replaceChildren(cv);
  };
  portraitOf(who, face).then(async (cv) => {
    if (cv) { fill(cv); return; }
    const n = await nameOf(who);
    const t = n ? tr(n) : (typeof who === 'string' ? who : '?');
    el.classList.add('initial');
    el.textContent = Array.from(t.replace(/^(ဦး|ဒေါ်|ကို|မောင်|မ)(?=.)/, ''))[0] || '?';
  });
  return el;
}

// ------------------------------------------------------------------------------------------------
// Basket icons (small drawn marks; any other string is shown as-is, e.g. an emoji)
// ------------------------------------------------------------------------------------------------
const INK = '#2A2118';
const ICONS = {
  touch: `<path d="M9 30c5-2 9-6 12-11M21 19c1-3 4-5 7-4" stroke="#4F7F43" stroke-width="2.4" stroke-linecap="round"/><path d="M27 15c3-1 5 0 6 2" stroke="#4F7F43" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="2 3"/><rect x="33" y="10" width="3.4" height="24" rx="1" fill="#B0673A" stroke="${INK}" stroke-width="1.6"/><circle cx="21" cy="19" r="2.6" fill="#8DB86A" stroke="${INK}" stroke-width="1.3"/>`,
  coil: `<rect x="19" y="6" width="5" height="30" rx="1.2" fill="#B0673A" stroke="${INK}" stroke-width="1.6"/><path d="M8 32c8-1 14-3 18-6s-16-1-16-5 16-2 16-6-14-1-14-5 10-3 10-3" stroke="#4F7F43" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  wind: `<path d="M5 15h20a5 5 0 1 0-5-5M5 23h28a5 5 0 1 1-5 5M5 31h14" stroke="#7C93A8" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  ear: `<path d="M14 26c0-12 4-19 11-19 6 0 10 5 10 11 0 5-3 7-5 9s-2 6-6 6c-3 0-4-2-4-4" stroke="${INK}" stroke-width="2.4" fill="#F2D2A6" stroke-linejoin="round"/><path d="M21 19c0-4 2-6 5-6s4 3 4 5-2 3-3 4" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M38 12c2 3 2 8 0 11M42 9c3 5 3 12 0 17" stroke="#C9A24A" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  eye: `<path d="M4 20c6-8 12-11 18-11s12 3 18 11c-6 8-12 11-18 11S10 28 4 20z" fill="#FFFDF8" stroke="${INK}" stroke-width="2.2"/><circle cx="22" cy="20" r="6" fill="#6E4A2A" stroke="${INK}" stroke-width="1.6"/><circle cx="20" cy="18" r="1.8" fill="#FFFDF8"/>`,
  check: `<circle cx="20" cy="20" r="10" fill="none" stroke="${INK}" stroke-width="2.4"/><path d="M27 27l9 9" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><path d="M15 20l4 4 7-8" stroke="#4F7F43" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  leaf: `<path d="M8 34C8 18 18 8 36 8c0 18-10 28-26 28" fill="#D9A55A" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M10 33 30 13" stroke="${INK}" stroke-width="1.6"/>`,
  sprout: `<path d="M22 36V20" stroke="#4F7F43" stroke-width="2.6" stroke-linecap="round"/><path d="M22 22c-2-7-8-9-14-8 1 6 6 9 14 8zM22 19c2-7 7-10 13-9-1 6-6 10-13 9z" fill="#8DB86A" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 37h20" stroke="#8C5A30" stroke-width="3" stroke-linecap="round"/>`,
  lamp: `<path d="M14 28h16l-3 7H17z" fill="#C47A45" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M22 27c-5-3-5-9 0-15 5 6 5 12 0 15z" fill="#F2C04E" stroke="${INK}" stroke-width="1.8"/><path d="M22 25c-2-1-2-4 0-7 2 3 2 6 0 7z" fill="#FFF3C4"/>`,
  envelope: `<rect x="6" y="11" width="32" height="22" rx="2" fill="#FFFDF8" stroke="${INK}" stroke-width="2.2"/><path d="M6 13l16 11 16-11" stroke="${INK}" stroke-width="2" fill="none" stroke-linejoin="round"/>`,
  door: `<rect x="11" y="5" width="22" height="32" rx="1.5" fill="#B0673A" stroke="${INK}" stroke-width="2.2"/><circle cx="28" cy="22" r="1.8" fill="#C9A24A"/><path d="M4 37h36" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
  page: `<path d="M10 5h17l7 7v25H10z" fill="#FFFDF8" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M14 16h15M14 21h15M14 26h11" stroke="#9DB4CC" stroke-width="1.8" stroke-linecap="round"/>`,
};
function iconHTML(icon) {
  if (!icon) return '';
  if (ICONS[icon]) return `<svg viewBox="0 0 44 42" fill="none" aria-hidden="true">${ICONS[icon]}</svg>`;
  const s = document.createElement('span');
  s.className = 'so-emoji';
  s.textContent = icon;
  return s.outerHTML;
}
const BLOT = `<svg class="so-blot" viewBox="0 0 120 40" aria-hidden="true"><path d="M14 22c-6-9 6-15 14-11 4-8 18-9 22-1 7-6 20-4 21 4 9-5 22 0 19 9 9 1 14 9 6 13-3 6-13 5-17 1-6 6-19 5-22-1-7 5-19 4-21-3-9 4-21-1-17-8-5 0-9-1-5-3z" fill="#2B2733"/>
  <circle cx="104" cy="9" r="3.2" fill="#2B2733"/><circle cx="9" cy="33" r="2.4" fill="#2B2733"/><circle cx="112" cy="31" r="1.8" fill="#2B2733"/><path d="M40 12c6-2 14-2 20 0" stroke="#55505E" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></svg>`;

const T = {
  next: { my: 'နောက်တစ်ရွက်', en: 'Next slip' },
  left: (n, all) => ({ my: `${myNum(all - n)} / ${myNum(all)} ထည့်ပြီး`, en: `${all - n} of ${all} placed` }),
  wrong: { my: 'ဟင့်အင်း… ဒီထဲ မဟုတ်ဘူး။', en: "No… not in this one." },
  closed: { my: 'ဒီခြင်း မဖွင့်ရသေးဘူး', en: 'This basket is not open yet' },
  all: { my: 'အားလုံး နေရာကျပြီ', en: 'Every slip is in its place' },
};

const lineOf = (c) => (c.label && typeof c.label === 'object' ? c.label : { my: c.my ?? c.label ?? '', en: c.en ?? '' });

export function sort({ title = '', hint = '', who = null, baskets = [], cards, slips, items, ordered = false, stampAll = null,
  wrong = null, react = {}, shuffle = true } = {}) {
  return new Promise((resolve) => {
    // ---- normalise the drafts' aliases
    const B = baskets.map((b, i) => ({ id: b.id ?? `b${i}`, label: b.label ?? { my: b.my ?? '', en: b.en ?? '' }, icon: b.icon, always: !!b.always, n: 0 }));
    const byId = Object.fromEntries(B.map((b) => [b.id, b]));
    const C = (cards || slips || items || []).map((c, i) => ({
      id: c.id ?? `c${i}`, basket: c.basket ?? c.fits ?? c.to ?? c.goes, text: lineOf(c), who: c.who ?? null,
      why: c.why ?? null, blot: !!c.blot, icon: c.icon ?? null, line: c.line ?? null,
    }));
    let mistakes = 0;
    const placed = {};
    const A = openAct({ title, hint, kind: 'sort', resolve, onCancel: () => ({ mistakes, placed }) });
    injectSortStyle();
    const speakers = who || C.some((c) => c.who) || Object.values(react || {}).some((l) => l && l.who);
    A.body.innerHTML = `<div class="so-top"${speakers ? '' : ' hidden'}><span class="so-face"></span><div class="so-say"><p class="ak-bi"></p></div></div>
      <div class="so-deck"><div class="so-stack"></div>
      <div class="so-bar"><span class="so-count ak-bi"></span><button type="button" class="so-next ak-bi"></button></div></div>
      <div class="so-baskets n${B.length}"></div>`;
    const faceEl = A.body.querySelector('.so-face');
    const sayEl = A.body.querySelector('.so-say');
    const stackEl = A.body.querySelector('.so-stack');
    const countEl = A.body.querySelector('.so-count');
    const nextBtn = A.body.querySelector('.so-next');
    const bwrap = A.body.querySelector('.so-baskets');
    bi(nextBtn, T.next);
    let curWho = null;
    function setSpeaker(w, face = 'talk') {
      if (!w || w === curWho) return;
      curWho = w;
      faceEl.replaceChildren(whoChip(w, { face, size: 46 }));
    }
    if (who) setSpeaker(who, 'smile');
    function say(line, w) {
      if (!line) return;
      const sp = line.who || w || who;
      if (speakers && sp) {
        setSpeaker(sp);
        bi(sayEl.firstElementChild, line);
        sayEl.classList.remove('in'); void sayEl.offsetWidth; sayEl.classList.add('in');
      } else A.setHint(line, 'warn');
    }

    // ---- baskets
    for (const b of B) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'so-basket';
      el.innerHTML = `<span class="so-tag"><span class="so-ico">${iconHTML(b.icon)}</span><span class="so-lab ak-bi"></span></span>
        <span class="so-bowl"><span class="so-in"></span><span class="so-rim"></span><b class="so-n"></b><span class="so-tie"></span></span>`;
      if (!b.icon) el.querySelector('.so-ico').remove();
      bi(el.querySelector('.so-lab'), b.label);
      el.addEventListener('click', () => { if (!dragging) drop(b); });
      bwrap.appendChild(el);
      b.el = el;
    }

    // ---- the deck
    const deck = shuffle ? shuffled(C) : C.slice();
    for (const c of deck) {
      const el = document.createElement('div');
      el.className = `so-card${c.blot ? ' blot' : ''}`;
      el.innerHTML = `<span class="so-pin"></span>${c.who ? '<span class="so-cw"></span>' : ''}${c.icon ? `<span class="so-cico">${iconHTML(c.icon)}</span>` : ''}<p class="so-txt ak-bi"></p>`;
      if (c.blot) el.querySelector('.so-txt').innerHTML = BLOT;
      else bi(el.querySelector('.so-txt'), c.text);
      if (c.who) el.querySelector('.so-cw').appendChild(whoChip(c.who, { face: 'talk', size: 34 }));
      el.style.setProperty('--r', `${[-1.6, 1.2, -0.6, 1.8, -1.1, 0.7][deck.indexOf(c) % 6]}deg`);
      stackEl.appendChild(el);
      c.el = el;
    }
    const left = deck.slice();
    const front = () => left[0];
    function layout() {
      left.forEach((c, k) => {
        c.el.style.setProperty('--k', String(Math.min(k, 3)));
        c.el.style.zIndex = String(50 - k);
        c.el.classList.toggle('front', k === 0);
        c.el.classList.toggle('gone', k > 3);
      });
      bi(countEl, T.left(left.length, C.length));
      nextBtn.disabled = left.length < 2;
      // the deck's height follows the front slip (long Burmese lines wrap to three); the slips fanned
      // behind it take the front one's height, so a longer hidden slip never pokes out over the counter
      if (left[0]) left[0].el.style.height = '';
      const h = left[0] ? left[0].el.offsetHeight : 0;
      left.forEach((c, k) => { if (k > 0) c.el.style.height = `${h}px`; });
      stackEl.style.height = `${Math.max(96, h + 6 + Math.min(left.length - 1, 3) * 5 + 14)}px`;
    }
    nextBtn.addEventListener('click', () => {
      if (left.length < 2 || busy) return;
      const c = left.shift();
      c.el.classList.add('tuck');
      setTimeout(() => c.el.classList.remove('tuck'), 320);
      left.push(c);
      layout();
      buzz(6);
    });

    // ---- ordered baskets
    const pending = (b) => left.filter((c) => c.basket === b.id).length;
    function currentOrdered() { return B.find((b) => !b.always && pending(b) > 0) || null; }
    function isOpen(b) {
      if (!ordered || b.always) return true;
      const cur = currentOrdered();
      return !cur || B.indexOf(b) <= B.indexOf(cur);
    }
    function refreshBaskets() {
      for (const b of B) {
        const was = b.el.classList.contains('closed');
        const shut = !isOpen(b);
        b.el.classList.toggle('closed', shut);
        if (was && !shut) { b.el.classList.add('untie'); setTimeout(() => b.el.classList.remove('untie'), 700); }
        b.el.querySelector('.so-n').textContent = b.n ? myNum(b.n) : '';
      }
    }

    // ---- dropping
    let busy = false;
    function wrongLine(c, b) {
      if (c.why) return c.why;
      if (ordered && !isOpen(b)) return react.order || T.closed;
      const goal = byId[c.basket];
      if (react.excuse && goal?.always && !b.always) return react.excuse;
      if (react[b.id]) return react[b.id];
      const k = `wrong${b.id[0].toUpperCase()}${b.id.slice(1)}`;
      if (react[k]) return react[k];
      if (wrong === 'repeat') return c.line || (c.blot ? T.wrong : c.text);
      if (wrong === 'shake') return null;
      return wrong || T.wrong;
    }
    function flyTo(c, b, part = 1) {
      const a = c.el.getBoundingClientRect(), t = b.el.querySelector('.so-bowl').getBoundingClientRect();
      const ox = parseFloat(c.el.style.getPropertyValue('--fx')) || 0, oy = parseFloat(c.el.style.getPropertyValue('--fy')) || 0;
      const dx = (t.left + t.width / 2) - (a.left + a.width / 2), dy = (t.top + t.height * 0.35) - (a.top + a.height / 2);
      c.el.style.setProperty('--fx', `${ox + dx * part}px`);
      c.el.style.setProperty('--fy', `${oy + dy * part}px`);
    }
    async function drop(b) {
      const c = front();
      if (!c || busy || A.closed()) return;
      busy = true;
      c.el.classList.remove('lift');
      if (c.basket === b.id && isOpen(b)) {
        placed[c.id] = b.id;
        flyTo(c, b, 1);
        c.el.classList.add('fly');
        c.el.style.zIndex = '90';
        left.shift();
        layout();
        c.el.style.zIndex = '90';
        buzz(14);
        await wait(380);
        c.el.remove();
        b.n++;
        addSlip(b, c);
        tick(b);
        refreshBaskets();
        layout();
        busy = false;
        if (!left.length) finish();
        return;
      }
      mistakes++;
      flyTo(c, b, 0.55);
      c.el.classList.add('fly', 'half');
      buzz(30);
      await wait(230);
      c.el.classList.remove('fly', 'half');
      c.el.style.removeProperty('--fx'); c.el.style.removeProperty('--fy');
      A.shake(c.el, 'ak-wiggle');
      A.shake(b.el, 'so-no');
      say(wrongLine(c, b), c.who);
      await wait(300);
      busy = false;
    }
    function addSlip(b, c) {
      const s = document.createElement('i');
      s.className = c.blot ? 'blot' : '';
      const k = b.n - 1;
      s.style.setProperty('--x', `${((k * 37) % 50) - 25}%`);
      s.style.setProperty('--rot', `${((k * 53) % 34) - 17}deg`);
      b.el.querySelector('.so-in').appendChild(s);
    }
    function tick(b) {
      const t = document.createElement('span');
      t.className = 'so-tick';
      t.innerHTML = '<svg viewBox="0 0 30 24"><path d="M3 13c3 2 6 5 8 8 4-8 9-13 16-18" fill="none" stroke="#4A4850" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      b.el.appendChild(t);
      setTimeout(() => t.remove(), 900);
    }

    // ---- drag the front slip onto a basket (a short press without moving just lifts it)
    let dragging = false;
    stackEl.addEventListener('pointerdown', (e) => {
      const c = front();
      if (!c || busy || !c.el.contains(e.target)) return;
      e.preventDefault();
      const x0 = e.clientX, y0 = e.clientY;
      let moved = false;
      c.el.setPointerCapture(e.pointerId);
      const mv = (ev) => {
        const dx = ev.clientX - x0, dy = ev.clientY - y0;
        if (!moved && Math.hypot(dx, dy) < 8) return;
        moved = dragging = true;
        c.el.classList.add('drag');
        c.el.style.setProperty('--fx', `${dx}px`);
        c.el.style.setProperty('--fy', `${dy}px`);
        const hit = basketAt(ev.clientX, ev.clientY);
        for (const b of B) b.el.classList.toggle('over', b === hit);
      };
      const up = (ev) => {
        c.el.removeEventListener('pointermove', mv);
        c.el.removeEventListener('pointerup', up);
        c.el.removeEventListener('pointercancel', up);
        c.el.classList.remove('drag');
        for (const b of B) b.el.classList.remove('over');
        if (!moved) { c.el.classList.toggle('lift'); buzz(6); return; }
        const hit = basketAt(ev.clientX, ev.clientY);
        setTimeout(() => (dragging = false), 0);
        if (hit) drop(hit);
        else { c.el.style.removeProperty('--fx'); c.el.style.removeProperty('--fy'); }
      };
      c.el.addEventListener('pointermove', mv);
      c.el.addEventListener('pointerup', up);
      c.el.addEventListener('pointercancel', up);
    });
    function basketAt(x, y) {
      for (const b of B) { const r = b.el.getBoundingClientRect(); if (x >= r.left && x <= r.right && y >= r.top - 10 && y <= r.bottom) return b; }
      return null;
    }

    async function finish() {
      A.setHint(T.all, 'good');
      await wait(300);
      if (stampAll) {
        const s = document.createElement('div');
        s.className = 'so-stamp ak-bi';
        bi(s, stampAll);
        bwrap.appendChild(s);
        buzz(24);
        await wait(1300);
      }
      await A.seal(true);
      A.done({ ok: true, mistakes, placed });
    }

    refreshBaskets();
    requestAnimationFrame(layout);
    layout();

    // tests and accessibility: "sort them for me"
    A.wrap.autoSort = async ({ wrongFirst = false, gap = 420 } = {}) => {
      let tries = 0, wrongDone = !wrongFirst;
      while (left.length && !A.closed() && tries++ < 200) {
        while (busy) await wait(60);
        const c = front();
        const goal = byId[c.basket];
        if (!wrongDone) { wrongDone = true; const w = B.find((b) => b !== goal && isOpen(b)) || B.find((b) => b !== goal); if (w) { await drop(w); await wait(gap); continue; } }
        if (!isOpen(goal)) { nextBtn.click(); await wait(200); continue; }
        await drop(goal);
        await wait(gap);
      }
    };
    window.__act = A.wrap;
  });
}

function injectSortStyle() {
  if (document.getElementById('act-sort-style')) return;
  const s = document.createElement('style');
  s.id = 'act-sort-style';
  s.textContent = `
  .ak-sort .ak-sub { letter-spacing: 0 !important; word-spacing: 0; font-kerning: normal; text-rendering: geometricPrecision; }
  .ak-who { position: relative; flex: none; display: inline-grid; place-items: center; width: var(--s, 40px); height: var(--s, 40px); border-radius: 50%; overflow: hidden;
    background: #F3E6C8; border: 2px solid #C9A24A; box-shadow: 0 2px 0 rgba(164,122,44,.35); box-sizing: border-box; }
  .ak-who canvas { width: 100%; height: 100%; display: block; }
  .ak-who.initial { font: 700 calc(var(--s, 40px) * .45)/1 "Noto Sans Myanmar", system-ui, sans-serif; color: #6E1F2A; background: #FBF1DC; }
  .ak-sort .act-card { width: min(100%, 470px); }
  .so-top { display: flex; align-items: flex-end; gap: 8px; min-height: 52px; margin: 0 2px 6px; text-align: left; }
  .so-face { flex: none; min-width: 46px; }
  .so-say { position: relative; flex: 1; min-height: 40px; padding: 6px 11px; border-radius: 14px 14px 14px 4px; background: #FFFDF8; border: 2px solid #E2D5B8;
    font: 600 13px/1.6 "Noto Sans Myanmar", system-ui, sans-serif; color: #4A3826; box-sizing: border-box; }
  .so-say:has(p:empty) { visibility: hidden; }
  .so-say p { margin: 0; }
  .so-say .ak-sub { font-size: 10.5px; }
  .so-say.in { animation: sosay .35s cubic-bezier(.2,1.3,.4,1) both; }
  .so-say::before { content: ""; position: absolute; left: -8px; bottom: 6px; border: 6px solid transparent; border-right-color: #E2D5B8; }
  .so-deck { position: relative; margin: 0 4px; padding: 10px 8px 6px; border-radius: 12px; background: rgba(226,213,184,.28); box-shadow: inset 0 0 0 2px rgba(201,162,74,.16); }
  .so-stack { position: relative; height: 110px; transition: height .25s; }
  .so-card { position: absolute; left: 6px; right: 6px; top: 6px; box-sizing: border-box; min-height: 74px; padding: 14px 14px 10px; border-radius: 6px; cursor: grab; touch-action: none;
    display: flex; align-items: center; justify-content: center; gap: 8px; text-align: left;
    background: #FFFDF8 repeating-linear-gradient(transparent 0 23px, rgba(157,180,204,.32) 23px 24px); background-position: 0 9px;
    border: 1px solid #E2D5B8; box-shadow: 0 2px 0 #E2D5B8, 0 6px 14px rgba(59,42,26,.10);
    transform: translate(calc(var(--k, 0) * 4px + var(--fx, 0px)), calc(var(--k, 0) * 5px + var(--fy, 0px))) rotate(calc(var(--r) * (var(--k, 0) * .45 + .25))) scale(calc(1 - var(--k, 0) * .03));
    transition: transform .32s cubic-bezier(.2,1.1,.3,1), opacity .3s, box-shadow .2s; font: 700 15px/1.6 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; }
  .so-card:not(.front):not(.fly) .so-txt, .so-card:not(.front):not(.fly) .so-cw, .so-card:not(.front):not(.fly) .so-cico { opacity: 0; }
  .so-card.gone { opacity: 0; pointer-events: none; }
  .so-card:not(.front):not(.fly):not(.drag) { overflow: hidden; }
  .so-card.front { cursor: grab; }
  .so-card.lift { box-shadow: 0 0 0 3px rgba(201,162,74,.45), 0 10px 18px rgba(59,42,26,.18); transform: translate(var(--fx, 0px), calc(-4px + var(--fy, 0px))) rotate(0deg); }
  .so-card.drag { transition: none; z-index: 80 !important; box-shadow: 0 14px 24px rgba(59,42,26,.25); transform: translate(var(--fx), var(--fy)) rotate(-2deg) scale(1.02); }
  .so-card.fly { transition: transform .38s cubic-bezier(.5,0,.6,1), opacity .38s; transform: translate(var(--fx), var(--fy)) rotate(8deg) scale(.22); opacity: 0; }
  .so-card.fly.half { transition: transform .22s ease-out; transform: translate(var(--fx), var(--fy)) rotate(-4deg) scale(.8); opacity: 1; }
  .so-card.tuck { opacity: .3; }
  .so-pin { position: absolute; top: -6px; left: 50%; width: 34px; height: 12px; margin-left: -17px; background: rgba(233,214,160,.85); transform: rotate(-3deg); box-shadow: 0 1px 1px rgba(59,42,26,.12); }
  .so-card .so-txt { margin: 0; flex: 1; min-width: 0; overflow-wrap: anywhere; text-align: center; }
  .so-card .ak-sub { font-size: 11px; margin-top: 1px; }
  .so-cico svg { width: 34px; height: 34px; } .so-cico .so-emoji { font-size: 26px; }
  .so-blot { width: 150px; height: 50px; display: block; margin: 0 auto; }
  .so-bar { position: relative; z-index: 60; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 4px 0; margin-top: 2px; border-top: 1px dashed rgba(201,162,74,.35); }
  .so-count { color: #8C6A28; font-weight: 700; font-size: 13px; line-height: 1.55; text-align: left; white-space: nowrap; padding-bottom: 2px; }
  .so-count .ak-sub { font-size: 10px; }
  .so-next { font: 700 12.5px/1.45 "Noto Sans Myanmar", system-ui, sans-serif; color: #6E1F2A; background: #FFFDF8; border: 2px solid #E2D5B8; border-radius: 999px; padding: 3px 12px; cursor: pointer; }
  .so-next::before { content: "↻ "; } .so-next .ak-main { display: inline; } .so-next .ak-sub { display: none; }
  .so-next:disabled { opacity: .35; }
  .so-baskets { position: relative; display: grid; grid-template-columns: repeat(var(--cols, 2), 1fr); gap: 12px 8px; margin: 12px 2px 2px; }
  .so-baskets.n3 { --cols: 3; } .so-baskets.n4 { --cols: 2; }
  .so-basket { position: relative; display: flex; flex-direction: column; align-items: stretch; gap: 0; padding: 0; border: 0; background: none; cursor: pointer; font: inherit; color: inherit; transition: transform .2s, filter .3s, opacity .3s; }
  .so-basket:active { transform: translateY(2px); }
  .so-basket.over { transform: translateY(-4px) scale(1.03); }
  .so-basket.over .so-bowl { box-shadow: 0 0 0 3px rgba(201,162,74,.55), inset 0 6px 8px rgba(70,40,15,.35); }
  .so-tag { position: relative; z-index: 2; display: flex; align-items: center; justify-content: center; gap: 4px; margin: 0 6px -9px; padding: 5px 9px 6px 15px; min-height: 44px; box-sizing: border-box;
    background: #FBF4E3; border: 1.5px solid #D9C9A6; border-radius: 6px 6px 3px 3px; box-shadow: 0 2px 0 rgba(164,122,44,.25); transform: rotate(-1deg);
    font: 700 13px/1.45 "Noto Sans Myanmar", system-ui, sans-serif; color: #6E1F2A; }
  .so-basket:nth-child(even) .so-tag { transform: rotate(1.2deg); }
  .so-tag::before { content: ""; position: absolute; top: 4px; left: 7px; width: 6px; height: 6px; border-radius: 50%; background: #F6F0E2; box-shadow: inset 0 0 0 1.5px #C9B48A; }
  .so-lab { min-width: 0; overflow-wrap: anywhere; }
  .so-lab .ak-sub { font-size: 10px; color: #8C6A28; }
  .so-ico { flex: none; } .so-ico svg { width: 28px; height: 27px; display: block; } .so-emoji { font-size: 20px; line-height: 1; }
  .so-bowl { position: relative; height: 62px; margin: 0 2px; border-radius: 8px 8px 26px 26px / 8px 8px 20px 20px; overflow: hidden;
    background: linear-gradient(180deg, rgba(255,236,190,.22), rgba(70,36,12,.2)),
      repeating-linear-gradient(0deg, transparent 0 9px, rgba(92,52,20,.38) 9px 10px),
      repeating-linear-gradient(90deg, transparent 0 15px, rgba(92,52,20,.3) 15px 16px),
      conic-gradient(from 90deg at 50% 50%, #CFA262 25%, #B47F44 0 50%, #CFA262 0 75%, #B47F44 0) 0 0 / 32px 20px;
    box-shadow: inset 0 6px 8px rgba(70,40,15,.35), inset 0 -4px 0 rgba(70,40,15,.25), 0 3px 0 #8A5A2C, 0 7px 10px rgba(59,42,26,.15); }
  .so-rim { position: absolute; left: 0; right: 0; top: 0; height: 9px; background: repeating-linear-gradient(-55deg, #D9B06E 0 4px, #A97338 4px 6px); box-shadow: 0 2px 0 rgba(70,40,15,.35); }
  .so-in { position: absolute; inset: 0; }
  .so-in i { position: absolute; left: calc(50% + var(--x)); top: 6px; width: 46%; height: 26px; margin-left: -23%; background: #FFFDF8; border: 1px solid #E2D5B8; border-radius: 2px;
    transform: rotate(var(--rot)); box-shadow: 0 1px 1px rgba(59,42,26,.15); animation: soin .4s cubic-bezier(.2,1.4,.4,1) both;
    background-image: linear-gradient(transparent 9px, #C9C2B2 9px 10.5px, transparent 10.5px 15px, #C9C2B2 15px 16.5px, transparent 16.5px); background-size: 70% 100%; background-repeat: no-repeat; background-position: 50% 0; }
  .so-in i.blot { background-image: radial-gradient(circle at 50% 55%, #2B2733 0 7px, transparent 8px); }
  .so-n { position: absolute; right: 8px; bottom: 6px; min-width: 20px; height: 20px; padding: 0 4px; box-sizing: border-box; border-radius: 10px; background: #6E1F2A; color: #FFFDF8;
    font: 700 11px/20px "Noto Sans Myanmar", system-ui; text-align: center; }
  .so-n:empty { display: none; }
  .so-tie { position: absolute; inset: 0; display: none; }
  /* ordered: a basket not yet open has its lid cord tied round it (one plain band and a small knot, the same on every closed
     tray), not a cross, so it reads "not yet" rather than "wrong" */
  .so-basket.closed { filter: saturate(.55) brightness(1.03); }
  .so-basket.closed .so-tie { display: block; background: linear-gradient(transparent calc(50% - 3px), #8C6A28 calc(50% - 3px) calc(50% - 1px), #C9A24A calc(50% - 1px) calc(50% + 2px), #8C6A28 calc(50% + 2px) calc(50% + 3px), transparent calc(50% + 3px)); }
  .so-basket.closed .so-tie::after { content: ""; position: absolute; left: 50%; top: 50%; width: 16px; height: 12px; margin: -6px 0 0 -8px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #E0BE6A, #A47A2C 70%); box-shadow: 0 1px 0 #6E5420; }
  .so-basket.untie { animation: sountie .7s cubic-bezier(.2,1.4,.4,1); }
  .so-basket.so-no .so-bowl { animation: akshake .42s ease; }
  .so-tick { position: absolute; left: 50%; top: 44%; width: 34px; height: 28px; margin: -14px 0 0 -17px; z-index: 4; pointer-events: none; animation: sotick .9s ease both; }
  .so-tick svg { width: 100%; height: 100%; }
  .so-stamp { position: absolute; left: 50%; top: 50%; z-index: 6; padding: 6px 16px; border: 4px double #B3322E; border-radius: 10px; color: #B3322E; background: rgba(255,250,240,.6);
    font: 800 17px/1.45 "Noto Sans Myanmar", system-ui, sans-serif; white-space: nowrap; transform: translate(-50%, -50%) rotate(-7deg); mix-blend-mode: multiply;
    animation: akstamp .45s cubic-bezier(.2,1.6,.4,1) both; letter-spacing: .3px; max-width: 96%; white-space: normal; text-align: center; }
  .so-stamp .ak-sub { color: #B3322E; font-weight: 700; font-size: 10.5px; letter-spacing: .6px; text-transform: uppercase; }
  @keyframes sosay { from { opacity: 0; transform: translateY(4px) scale(.97); } }
  @keyframes soin { from { opacity: 0; transform: translateY(-26px) rotate(0deg); } }
  @keyframes sotick { 0% { opacity: 0; transform: scale(.4); } 25% { opacity: 1; transform: scale(1.1); } 70% { opacity: 1; } 100% { opacity: 0; transform: translateY(-10px); } }
  @keyframes sountie { 30% { transform: translateY(-6px) rotate(-2deg); } 60% { transform: rotate(1.5deg); } }
  @media (max-width: 380px) { .so-baskets.n3 .so-tag { font-size: 12px; padding: 4px 4px 6px; } .so-card { font-size: 14px; } }
  `;
  document.head.appendChild(s);
}
