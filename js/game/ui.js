// HTML layer over the 3D view: dock, arrival card, story-style dialogue, content sheet,
// labels pinned to 3D points, Maya's emote bubble, tips, letterbox and iris transitions.
import { PLACES } from './config.js';
import * as pages from './pages.js';

const $ = (id) => document.getElementById(id);
export const lang = () => document.documentElement.getAttribute('data-lang') || 'my';
export const tr = (o) => (o == null ? '' : typeof o === 'string' ? o : o[lang()] ?? o.my ?? o.en ?? '');
const ICONS = { home: 'i-home', box: 'i-box', clapper: 'i-clapper', mug: 'i-mug', book: 'i-book', plane: 'i-plane' };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Split text into grapheme clusters so the typewriter never breaks a Burmese syllable's marks.
const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('my', { granularity: 'grapheme' }) : null;
const graphemes = (s) => (segmenter ? Array.from(segmenter.segment(s), (x) => x.segment) : Array.from(s));

export function createUI(cb) {
  const game = $('game');
  const els = {
    where: $('where'), card: $('card'), cardTitle: document.querySelector('#card .card-title'), cardSub: document.querySelector('#card .card-sub'),
    enter: $('btn-enter'), dialog: $('dialog'), dialogText: document.querySelector('#dialog .dialog-text'), dialogFace: document.querySelector('#dialog .dialog-face'),
    sheet: $('sheet'), sheetTitle: $('sheet-title'), sheetBody: document.querySelector('#sheet .sheet-body'), roomUI: $('room-ui'),
    dock: $('dock'), labels: $('labels'), bubble: $('bubble'), tip: $('tip'), fader: $('fader'), sound: $('btn-sound'), lang: $('btn-lang'),
  };

  // ---------- dock ----------
  const dockBtns = new Map();
  function buildDock() {
    els.dock.innerHTML = '';
    for (const p of PLACES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.place = p.id;
      b.setAttribute('aria-label', `${p.name.my} / ${p.name.en}`);
      b.innerHTML = `<svg aria-hidden="true"><use href="#${ICONS[p.icon]}"/></svg><span>${tr(p.dock)}</span><i class="dot"></i>`;
      b.addEventListener('click', () => cb.onDock?.(p.id));
      els.dock.appendChild(b);
      dockBtns.set(p.id, b);
    }
  }
  buildDock();

  els.enter.addEventListener('click', () => cb.onEnter?.());
  $('btn-exit').addEventListener('click', () => cb.onExit?.());
  $('btn-all').addEventListener('click', () => cb.onSeeAll?.());
  $('sheet-close').addEventListener('click', () => cb.onSheetClose?.());
  $('sheet-share').addEventListener('click', () => cb.onShare?.());
  $('btn-home').addEventListener('click', () => cb.onHome?.());
  els.sound.addEventListener('click', () => cb.onSound?.());
  els.lang.addEventListener('click', () => cb.onLang?.());

  // swipe down on the sheet header to close it
  let swipeY = null;
  const head = els.sheet.querySelector('.sheet-head');
  const grip = els.sheet.querySelector('.sheet-grip');
  for (const h of [head, grip]) {
    h.addEventListener('pointerdown', (e) => { if (!e.target.closest('button')) swipeY = e.clientY; });
  }
  window.addEventListener('pointerup', (e) => {
    if (swipeY !== null && e.clientY - swipeY > 70) cb.onSheetClose?.();
    swipeY = null;
  });

  // ---------- dialogue ----------
  let typing = null; // { full, shown, done, skip }
  let advance = null;
  els.dialog.addEventListener('click', () => {
    if (typing && !typing.done) typing.skip = true;
    else advance?.();
  });

  async function typeLine(text, onTick) {
    const parts = graphemes(text);
    typing = { done: false, skip: false };
    els.dialogText.textContent = '';
    let shown = '';
    for (let i = 0; i < parts.length; i++) {
      if (typing.skip) { shown = text; break; }
      shown += parts[i];
      els.dialogText.textContent = shown;
      if (i % 2 === 0) onTick?.();
      await wait(/[။၊.!?]/.test(parts[i]) ? 110 : 34);
    }
    els.dialogText.textContent = text;
    typing.done = true;
  }

  return {
    els,
    rebuildDock: buildDock,
    setWhere(text) { els.where.textContent = text || ''; },
    setDockCurrent(id) { for (const [k, b] of dockBtns) b.setAttribute('aria-current', String(k === id)); },
    setVisited(set) { for (const [k, b] of dockBtns) b.classList.toggle('visited', set.has(k)); },
    setSoundIcon(muted) { els.sound.querySelector('use').setAttribute('href', muted ? '#i-mute' : '#i-sound'); },
    showDock(on) { els.dock.hidden = !on; },

    showCard({ title, sub }) {
      els.cardTitle.textContent = title;
      els.cardSub.textContent = sub || '';
      els.cardSub.hidden = !sub;
      els.card.hidden = false;
    },
    hideCard() { els.card.hidden = true; },
    get cardOpen() { return !els.card.hidden; },

    /**
     * Story dialogue. lines: array of {my, en} | string. opts: { face: canvas, onTick, auto }
     * Resolves after the last line is dismissed (tap) or auto-advances.
     */
    async say(lines, opts = {}) {
      if (!Array.isArray(lines)) lines = [lines];
      // a new line cancels any dialogue still running
      const token = (this.sayToken = (this.sayToken || 0) + 1);
      if (typing) typing.skip = true;
      advance?.();
      await wait(0);
      if (token !== this.sayToken) return;
      els.dialog.hidden = false;
      game.classList.add('talking');
      if (opts.face) {
        const g = els.dialogFace.getContext('2d');
        g.clearRect(0, 0, 128, 128);
        g.drawImage(opts.face, 0, 0, 128, 128);
      }
      for (const line of lines) {
        if (token !== this.sayToken) return;
        const text = tr(line);
        opts.onLine?.(text);
        await typeLine(text, opts.onTick);
        if (token !== this.sayToken) return;
        await new Promise((resolve) => {
          const t = setTimeout(resolve, opts.auto === false ? 1e9 : 1400 + graphemes(text).length * 40);
          advance = () => { clearTimeout(t); resolve(); };
        });
        advance = null;
      }
      if (token === this.sayToken) { els.dialog.hidden = true; game.classList.remove('talking'); }
    },
    hideDialog() { if (typing) typing.skip = true; advance?.(); els.dialog.hidden = true; game.classList.remove('talking'); },
    get dialogOpen() { return !els.dialog.hidden; },

    openSheet({ title, stationIds }) {
      els.sheetTitle.textContent = title;
      els.sheetBody.innerHTML = '';
      pages.borrowInto(els.sheetBody, stationIds);
      els.sheetBody.scrollTop = 0;
      els.sheet.hidden = false;
      setTimeout(() => $('sheet-close').focus({ preventScroll: true }), 50);
    },
    closeSheet() {
      pages.restoreAll();
      els.sheet.hidden = true;
    },
    get sheetOpen() { return !els.sheet.hidden; },

    showRoomUI(on) { els.roomUI.hidden = !on; },
    cinema(on) { game.classList.toggle('cinema', !!on); },

    // ---------- labels pinned to 3D anchors ----------
    labels: [],
    setLabels(list) {
      els.labels.innerHTML = '';
      this.labels = list.map((l) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = `label ${l.className || ''}${l.sub ? ' two' : ''}`;
        el.textContent = l.text;
        if (l.sub) {
          const s = document.createElement('small');
          s.textContent = l.sub;
          el.appendChild(s);
        }
        el.addEventListener('click', (e) => { e.stopPropagation(); l.onTap?.(); });
        els.labels.appendChild(el);
        return { ...l, el, x: -999, y: -999 };
      });
    },
    /** project(anchor) -> {x,y}|null; hide(key) -> boolean */
    updateLabels(project, hide) {
      const W = window.innerWidth;
      for (const l of this.labels) {
        const p = project(l.anchor);
        const hidden = !p || hide?.(l);
        l.el.classList.toggle('hide', !!hidden);
        if (hidden) continue;
        // keep every label fully on screen; one at the edge also hints "there is more this way"
        if (!l.w) l.w = l.el.offsetWidth || 120;
        const half = l.w / 2 + 6;
        const x = Math.min(Math.max(p.x, half), W - half);
        l.el.style.transform = `translate3d(${x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -100%)`;
      }
    },

    // ---------- emote bubble ----------
    bubbleTimer: 0,
    showBubble(canvas, ms = 1600) {
      els.bubble.innerHTML = '';
      if (canvas) {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        c.getContext('2d').drawImage(canvas, 0, 0, 128, 128);
        els.bubble.appendChild(c);
      }
      els.bubble.classList.add('show');
      clearTimeout(this.bubbleTimer);
      this.bubbleTimer = setTimeout(() => els.bubble.classList.remove('show'), ms);
    },
    placeBubble(p) {
      if (!p) { els.bubble.style.visibility = 'hidden'; return; }
      els.bubble.style.visibility = 'visible';
      els.bubble.style.left = `${p.x}px`;
      els.bubble.style.top = `${p.y}px`;
    },

    tipTimer: 0,
    tip(text, ms = 4000) {
      els.tip.textContent = text;
      els.tip.hidden = false;
      clearTimeout(this.tipTimer);
      if (ms) this.tipTimer = setTimeout(() => (els.tip.hidden = true), ms);
    },
    hideTip() { els.tip.hidden = true; },

    async irisClose() {
      els.fader.className = 'closing';
      await wait(580);
      els.fader.className = 'closed';
    },
    async irisOpen() {
      els.fader.className = 'closed';
      await wait(30);
      els.fader.className = 'opening';
      await wait(620);
      els.fader.className = '';
    },
  };
}
