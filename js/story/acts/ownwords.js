// Handwork pattern 4: write one line in your own words (Toe Toe's exercise book).
//
//   const r = await ownwords({ title, hint, prompt: { my, en }, fragments: [{ my, en, good: bool }], need: 3 })
//   r = { ok: boolean, line: { my, en }, picks: [fragment index, ...] }   (cancel: { ok: false, cancelled: true, line: null, picks })
//
// Word-fragment tiles sit in a tray (shuffled). Tapping one lays it on the ruled line; tapping a laid
// tile sends it back. "good" fragments are the child's own understanding; the others are parroted
// lines of the rhyme. When `need` tiles are on the line: if they are all good, the line is written
// out in pencil (in the fragments' own order, so the sentence reads right) with a small flourish;
// if any are parroted, those wiggle, get a ♪ mark and hop back to the tray.
// picks: every fragment the player laid on the line, in order (parroted ones included).
//
// Test hook: window.__act.autoOwnwords()
import { openAct, bi, wait, buzz, shuffled, lerp } from './kit.js';
import { tr, lang } from '../../game/ui.js';

export function ownwords({ title = '', hint = '', prompt = '', fragments = [], need = 3 } = {}) {
  return new Promise((resolve) => {
    const picks = [];
    const A = openAct({ title, hint, kind: 'own', resolve, onCancel: () => ({ line: null, picks }) });
    injectOwnStyle();
    A.body.innerHTML = `<div class="ow-book"><div class="ow-q ak-bi"></div><div class="ow-line"><span class="ow-caret"></span></div><div class="ow-hand" hidden></div>
      <svg class="ow-flourish" viewBox="0 0 200 30" hidden aria-hidden="true"><path d="M6 18 C40 26 90 24 130 16 S180 4 168 14 S150 26 194 20"/></svg>
      <svg class="ow-pencil" viewBox="0 0 40 40" hidden aria-hidden="true"><g transform="rotate(40 20 20)"><rect x="16" y="2" width="8" height="26" rx="1" fill="#F2C04E" stroke="#2A2118" stroke-width="1.6"/>
      <rect x="16" y="2" width="8" height="5" fill="#E8879A" stroke="#2A2118" stroke-width="1.6"/><path d="M16 28h8l-4 9z" fill="#F2D2A6" stroke="#2A2118" stroke-width="1.6" stroke-linejoin="round"/><path d="M19 34.5h2l-1 2.5z" fill="#2A2118"/></g></svg></div>
      <div class="ow-need"></div><div class="ow-tray"></div>`;
    const lineEl = A.body.querySelector('.ow-line');
    const caret = A.body.querySelector('.ow-caret');
    const handEl = A.body.querySelector('.ow-hand');
    const needEl = A.body.querySelector('.ow-need');
    const trayEl = A.body.querySelector('.ow-tray');
    const book = A.body.querySelector('.ow-book');
    bi(A.body.querySelector('.ow-q'), prompt);
    for (let i = 0; i < need; i++) needEl.appendChild(document.createElement('i'));

    const tiles = fragments.map((f, i) => {
      const slot = document.createElement('span');
      slot.className = 'ow-slot';
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ow-tile ak-bi';
      b.dataset.i = i;
      bi(b, f);
      b.addEventListener('click', () => tapTile(i));
      slot.appendChild(b);
      return { f, i, el: b, slot, placed: false, rhyme: false };
    });
    shuffled(tiles).forEach((t, k) => { t.slot.style.setProperty('--d', `${k * 50}ms`); trayEl.appendChild(t.slot); });

    let busy = false, finished = false;
    const placed = () => tiles.filter((t) => t.placed).sort((a, b) => a.at - b.at);
    let stamp = 0;

    // FLIP: move a tile between the tray and the line with a little arc
    function move(t, toLine) {
      const r0 = t.el.getBoundingClientRect();
      if (toLine) { // the slot keeps the tile's size, so the tray does not jump
        t.slot.style.width = `${r0.width}px`; t.slot.style.height = `${r0.height}px`;
        t.at = ++stamp; lineEl.insertBefore(t.el, caret);
      } else t.slot.appendChild(t.el);
      t.placed = toLine;
      t.el.classList.toggle('in', toLine);
      const r1 = t.el.getBoundingClientRect();
      const dx = r0.left - r1.left, dy = r0.top - r1.top;
      t.el.animate([
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 18}px) rotate(${toLine ? -3 : 3}deg)`, offset: 0.5 },
        { transform: `translate(0, 0) rotate(${toLine ? tilt(t) : 0}deg)` },
      ], { duration: 340, easing: 'cubic-bezier(.3,.7,.3,1)' });
      if (toLine) t.el.style.setProperty('--tilt', `${tilt(t)}deg`);
    }
    const tilt = (t) => [-1.2, 0.8, -0.5, 1.1, -0.9][t.i % 5];
    function refresh() {
      const n = placed().length;
      [...needEl.children].forEach((d, k) => d.classList.toggle('on', k < n));
      lineEl.classList.toggle('empty', n === 0);
    }
    refresh();

    function tapTile(i) {
      if (busy || finished || A.closed()) return;
      const t = tiles[i];
      if (t.placed) { move(t, false); refresh(); buzz(6); return; }
      if (placed().length >= need) { A.shake(lineEl); return; }
      picks.push(i);
      move(t, true);
      buzz(8);
      refresh();
      if (placed().length >= need) check();
    }
    A.onKey = (e) => {
      if (e.key !== 'Backspace' || busy || finished) return;
      const p = placed();
      if (p.length) { move(p[p.length - 1], false); refresh(); }
    };

    async function check() {
      busy = true;
      await wait(380);
      const p = placed();
      const parroted = p.filter((t) => !t.f.good);
      if (!parroted.length) { busy = false; return write(p); }
      for (const t of parroted) { t.rhyme = true; t.el.classList.add('rhyme'); A.shake(t.el, 'ak-wiggle'); }
      buzz(30);
      A.setHint({ my: '♪ ဒါ ကဗျာထဲက စာကြောင်းပါ', en: "♪ That's a line from the rhyme" }, 'warn');
      await wait(900);
      for (const t of parroted) move(t, false);
      refresh();
      busy = false;
    }

    // the line, written out in pencil: word by word, the pencil riding the end of the writing
    async function write(p) {
      finished = true;
      const ordered = p.slice().sort((a, b) => a.i - b.i);
      const line = { my: ordered.map((t) => t.f.my).join(' '), en: ordered.map((t) => t.f.en).join(' ') };
      A.setHint({ my: 'ကိုယ့်စကားနဲ့ ကိုယ် ရေးလိုက်ပြီ', en: 'Written in his own words' }, 'good');
      lineEl.classList.add('melt');
      await wait(260);
      const text = tr(line);
      const words = text.split(/\s+/).filter(Boolean);
      handEl.innerHTML = '';
      handEl.hidden = false;
      const spans = words.map((w, k) => {
        const s = document.createElement('span');
        s.className = 'ow-w';
        s.textContent = w;
        s.style.setProperty('--r', `${[-1.6, 1.2, -0.6, 1.8, -1.1, 0.7][k % 6]}deg`);
        s.style.setProperty('--y', `${[0, -1.5, 1, -0.5, 1.5, -1][k % 6]}px`);
        handEl.appendChild(s);
        handEl.append(' ');
        return s;
      });
      const sub = document.createElement('small');
      sub.className = 'ow-sub';
      sub.textContent = lang() === 'en' ? line.my : line.en;
      handEl.appendChild(sub);
      lineEl.hidden = true;
      { // sit the writing on the book's rules (34.5 px apart, from 10 px down the page)
        const b0 = book.getBoundingClientRect(), h0 = handEl.getBoundingClientRect();
        const rel = (h0.top - b0.top - 10) % 34.5;
        handEl.style.paddingTop = `${(34.5 - rel) % 34.5}px`;
      }
      const pencil = A.body.querySelector('.ow-pencil');
      pencil.removeAttribute('hidden'); // (SVG elements have no .hidden property)
      const br = book.getBoundingClientRect();
      for (const s of spans) {
        const r = s.getBoundingClientRect();
        const dur = Math.max(160, r.width * 5.5);
        const t0 = performance.now();
        await new Promise((done) => {
          const tick = (now) => {
            const k = Math.min(1, (now - t0) / dur);
            s.style.clipPath = `inset(-12px ${(1 - k) * 100}% -12px -4px)`;
            pencil.style.transform = `translate(${r.left - br.left + r.width * k - 4}px, ${r.top - br.top - 26 + Math.sin(k * 18) * 1.5}px)`;
            if (k < 1) requestAnimationFrame(tick); else done();
          };
          requestAnimationFrame(tick);
        });
        s.classList.add('inked');
      }
      sub.classList.add('in');
      // the flourish under the line
      const fl = A.body.querySelector('.ow-flourish');
      const lr = spans[spans.length - 1].getBoundingClientRect();
      fl.style.top = `${lr.bottom - br.top - 12}px`;
      fl.removeAttribute('hidden');
      const path = fl.querySelector('path');
      const len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      const fr = fl.getBoundingClientRect();
      const t0 = performance.now();
      await new Promise((done) => {
        const tick = (now) => {
          const k = Math.min(1, (now - t0) / 520);
          const e = 1 - (1 - k) ** 2;
          path.style.strokeDashoffset = `${len * (1 - e)}`;
          const pt = path.getPointAtLength(len * e);
          pencil.style.transform = `translate(${fr.left - br.left + (pt.x / 200) * fr.width - 4}px, ${fr.top - br.top + (pt.y / 30) * fr.height - 34}px)`;
          if (k < 1) requestAnimationFrame(tick); else done();
        };
        requestAnimationFrame(tick);
      });
      pencil.classList.add('lift');
      buzz(20);
      await wait(250);
      const cr = A.card.getBoundingClientRect();
      trayEl.classList.add('rest');
      await A.seal(true, [br.right - cr.left - 46, br.bottom - cr.top + 18]);
      A.done({ ok: true, line, picks });
    }

    // tests and accessibility: "write it for me" (picks the child's own fragments, in order)
    A.wrap.autoOwnwords = async () => {
      for (const t of tiles) if (t.placed && !t.f.good) { move(t, false); refresh(); }
      for (const t of tiles) {
        if (finished || A.closed()) break;
        if (t.f.good && !t.placed && placed().length < need) { tapTile(t.i); await wait(380); }
      }
    };
    window.__act = A.wrap;
    void lerp;
  });
}

function injectOwnStyle() {
  if (document.getElementById('act-own-style')) return;
  const s = document.createElement('style');
  s.id = 'act-own-style';
  s.textContent = `
  .ak-own .act-card { width: min(100%, 520px); }
  .ow-book { position: relative; margin: 2px 2px 0; padding: 12px 14px 16px 40px; text-align: left; border-radius: 6px 14px 14px 6px;
    background: #FFFDF8 repeating-linear-gradient(transparent 0 33px, #CFDDEA 33px 34.5px); background-position: 0 10px;
    box-shadow: 0 1px 0 #E2D5B8, 0 6px 14px rgba(59,42,26,.12), inset 0 0 0 1px #EDE3CC; overflow: hidden; }
  .ow-book::before { content: ""; position: absolute; left: 30px; top: 0; bottom: 0; border-left: 2px solid #E6A49B; }
  .ow-book::after { content: ""; position: absolute; left: 9px; top: 18px; bottom: 18px; width: 9px;
    background: radial-gradient(circle at 50% 50%, #E8DCC0 0 3.5px, transparent 4px) 0 0 / 9px 34px repeat-y; }
  .ow-q { font-weight: 700; color: #6E1F2A; font-size: 14px; line-height: 1.6; min-height: 34px; padding-top: 2px; }
  .ow-q .ak-sub { color: #A4806A; }
  .ow-line { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 6px; min-height: 76px; padding: 6px 0 4px; transition: opacity .25s, filter .25s; }
  .ow-line.melt { opacity: 0; filter: blur(2px); }
  .ow-caret { width: 2px; height: 26px; background: #6E1F2A; border-radius: 1px; animation: owblink 1s steps(1) infinite; opacity: .7; }
  .ow-line:not(.empty) .ow-caret { margin-left: 2px; }
  .ow-line.empty::before { content: "…"; color: #B8A88A; font: 700 18px/1 system-ui; margin-right: 4px; }
  .ow-hand { position: relative; min-height: 76px; padding: 0 0 2px; font: 400 18.5px/34.5px "Noto Sans Myanmar", system-ui, sans-serif; color: #36343E;
    transform: skewX(-7deg); transform-origin: left bottom; letter-spacing: .3px; }
  .ow-w { display: inline-block; transform: rotate(var(--r)) translateY(calc(var(--y) - 4px)); clip-path: inset(-12px 100% -12px -4px); text-shadow: .4px .3px 0 rgba(54,52,62,.35); }
  .ow-w.inked { clip-path: none; }
  .ow-sub { display: block; font: italic 500 12px/1.4 system-ui, sans-serif; color: #7C7A86; transform: skewX(4deg); opacity: 0; transition: opacity .4s; margin-top: 18px; }
  .ow-sub.in { opacity: 1; }
  .ow-flourish { position: absolute; left: 46px; width: min(70%, 300px); height: 30px; overflow: visible; pointer-events: none; }
  .ow-flourish path { fill: none; stroke: #4A4850; stroke-width: 2.2; stroke-linecap: round; opacity: .85; }
  .ow-pencil { position: absolute; left: 0; top: 0; width: 34px; height: 34px; pointer-events: none; z-index: 3; transition: opacity .3s, translate .3s; filter: drop-shadow(1px 2px 1px rgba(42,33,24,.25)); }
  .ow-pencil.lift { opacity: 0; translate: 10px -16px; }
  .ow-need { display: flex; justify-content: center; gap: 8px; margin: 10px 0 8px; }
  .ow-need i { width: 11px; height: 11px; border-radius: 50%; border: 2px solid #C9A24A; transition: background .2s, transform .2s; }
  .ow-need i.on { background: #6E1F2A; border-color: #6E1F2A; transform: scale(1.12); }
  .ow-tray.rest { opacity: .35; pointer-events: none; transition: opacity .4s; }
  .ow-tray { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
  .ow-slot { display: inline-flex; box-sizing: border-box; min-width: 60px; min-height: 52px; transition: width .25s, height .25s; border-radius: 12px; box-shadow: inset 0 0 0 2px rgba(201,162,74,.22); background: rgba(226,213,184,.25);
    animation: mtin2 .4s var(--d, 0ms) cubic-bezier(.2,1.3,.4,1) both; }
  .ow-slot:has(.ow-tile) { background: none; box-shadow: none; }
  .ow-tile { font: 700 14px/1.5 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; padding: 6px 12px 5px; border-radius: 12px; border: 2px solid #E2D5B8;
    background: #FFFDF8; box-shadow: 0 3px 0 #D9C9A6; cursor: pointer; text-align: center; max-width: 100%; position: relative; }
  .ow-tile .ak-sub { font-size: 10.5px; font-weight: 500; }
  .ow-tile:active { translate: 0 2px; box-shadow: 0 1px 0 #D9C9A6; }
  .ow-tile.in { transform: rotate(var(--tilt, 0deg)); background: #FFF8E4; border-color: #D9C38E; box-shadow: 0 2px 0 #D9C38E; padding: 3px 9px 2px; font-size: 13.5px; }
  .ow-tile.rhyme { border-style: dashed; border-color: #C9A24A; color: #8C6A28; background: #FBF6EA; }
  .ow-tile.rhyme::after { content: "♪"; position: absolute; top: -9px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: #C9A24A; color: #FFFDF8;
    font: 700 11px/18px system-ui; text-align: center; }
  .ow-tile.in.rhyme { border-color: #B5534A; }
  @keyframes owblink { 50% { opacity: 0; } }
  @keyframes mtin2 { from { opacity: 0; transform: translateY(10px); } }
  `;
  document.head.appendChild(s);
}
