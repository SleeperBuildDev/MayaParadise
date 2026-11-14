// Handwork pattern 3: match what you saw on the walk to the page it explains (Toe Toe's walk to school).
//
//   const r = await match({ title, hint, pairs: [{ left: { my, en, icon }, right: { my, en } }], shuffle: true })
//   r = { ok: boolean, mistakes: n }   (cancel: { ok: false, cancelled: true, mistakes })
//
// Left: the walk's stops, in walk order, each with a small drawn icon (icon: 'scale' | 'seesaw' |
// 'lamp' | 'beanpot' | 'flower' | 'book', or any emoji). Right: schoolbook pages, shuffled. Tap one
// card, then one on the other side: a right pair is joined with a pencil line; a wrong one wiggles
// back. Completing every pair resolves ok: true; `mistakes` counts the wrong tries.
//
// Test hook: window.__act.autoMatch()
import { openAct, bi, wait, myNum, buzz, shuffled } from './kit.js';

const INK = '#2A2118';
const ICONS = {
  scale: `<path d="M24 9v29M15 41h18" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M9 14h30" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" transform="rotate(-6 24 14)"/>
    <circle cx="24" cy="9" r="2.6" fill="#C9A24A" stroke="${INK}" stroke-width="1.6"/><path d="M9.5 15.5 5 27M9.5 15.5 14 27M38.5 12.5 34 24M38.5 12.5 43 24" stroke="${INK}" stroke-width="1.3"/>
    <path d="M3.5 27h12a6 4.5 0 0 1-12 0z" fill="#C9A24A" stroke="${INK}" stroke-width="2"/><path d="M32.5 24h12a6 4.5 0 0 1-12 0z" fill="#C9A24A" stroke="${INK}" stroke-width="2"/>
    <ellipse cx="9.5" cy="25" rx="4" ry="2.6" fill="#E3A65C" stroke="${INK}" stroke-width="1.4"/>`,
  seesaw: `<path d="M17 40 24 29 31 40z" fill="#C47A45" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M4 35 44 23" stroke="${INK}" stroke-width="4.2" stroke-linecap="round"/>
    <path d="M4 35 44 23" stroke="#E3B567" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="25" r="4.2" fill="#F2D2A6" stroke="${INK}" stroke-width="2"/><path d="M9 29.5v3.5" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="39" cy="13" r="4.2" fill="#F2D2A6" stroke="${INK}" stroke-width="2"/><path d="M39 17.5v3.5" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><path d="M8 43h32" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity=".4"/>`,
  lamp: `<path d="M20 44h10M25 44V14c0-4 2-6 6-6h3" stroke="${INK}" stroke-width="2.8" stroke-linecap="round" fill="none"/><path d="M30 10h10l-2 5h-6z" fill="#6E1F2A" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M35 17 31 31M35 17l4 14M35 17v15" stroke="#F0B64A" stroke-width="2" stroke-linecap="round" opacity=".85"/><ellipse cx="35" cy="16" rx="3" ry="1.6" fill="#FBE29A" stroke="${INK}" stroke-width="1.2"/>
    <ellipse cx="35" cy="40" rx="8" ry="2.2" fill="#F0B64A" opacity=".35"/>`,
  beanpot: `<path d="M24 25c0-6-1-10-5-13M24 22c1-6 4-9 9-10" stroke="#4F7F43" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    <path d="M19 12c-5 0-8-3-8-6 4 0 8 2 8 6zM33 12c4-1 7-4 7-7-4 0-7 3-7 7z" fill="#8DB86A" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M11 25h26l-3 17H14z" fill="#C47A45" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M9 23h30v4H9z" fill="#B0673A" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M16 30c1 4 1 7 0 9" stroke="#E9AF7E" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,
  flower: `<path d="M5 40h38" stroke="#8C5A30" stroke-width="5" stroke-linecap="round"/><path d="M12 38V24M24 38V18M36 38V26" stroke="#4F7F43" stroke-width="2.2" stroke-linecap="round"/>
    <g stroke="${INK}" stroke-width="1.6"><circle cx="12" cy="21" r="5" fill="#E8879A"/><circle cx="24" cy="14" r="6" fill="#F2C04E"/><circle cx="36" cy="23" r="5" fill="#B9A0E0"/></g>
    <circle cx="12" cy="21" r="1.8" fill="${INK}"/><circle cx="24" cy="14" r="2.2" fill="#8C5A30"/><circle cx="36" cy="23" r="1.8" fill="${INK}"/><path d="M28 33c3-3 5-3 7-2" stroke="#4F7F43" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  book: `<path d="M6 11c7-2 13-1 18 3 5-4 11-5 18-3v27c-7-2-13-1-18 3-5-4-11-5-18-3z" fill="#FFFDF8" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M24 14v27" stroke="${INK}" stroke-width="1.8"/>
    <path d="M10 18h10M10 23h10M28 18h10M28 23h10" stroke="#9DB4CC" stroke-width="1.6" stroke-linecap="round"/>`,
};

function iconHTML(icon) {
  if (ICONS[icon]) return `<svg viewBox="0 0 48 48" aria-hidden="true" fill="none">${ICONS[icon]}</svg>`;
  const s = document.createElement('span');
  s.className = 'mt-emoji';
  s.textContent = icon || '•';
  return s.outerHTML;
}

export function match({ title = '', hint = '', pairs = [], shuffle = true } = {}) {
  return new Promise((resolve) => {
    let mistakes = 0;
    const A = openAct({ title, hint, kind: 'match', resolve, onCancel: () => ({ mistakes }) });
    injectMatchStyle();
    A.body.innerHTML = '<div class="mt-board"><svg class="mt-lines" aria-hidden="true"></svg></div><div class="mt-count"></div>';
    const board = A.body.querySelector('.mt-board');
    const leftEl = board, rightEl = board; // one grid: each stop shares a row (and its height) with a page
    const svg = board.querySelector('.mt-lines');
    const countEl = A.body.querySelector('.mt-count');
    const n = pairs.length;

    // the right column, shuffled so no page sits beside its own stop (when there are enough pairs)
    let order = pairs.map((_, i) => i);
    if (shuffle && n > 1) {
      for (let t = 0; t < 30; t++) { order = shuffled(order); if (order.every((v, i) => v !== i) || n < 3) break; }
      if (order.every((v, i) => v === i)) order.reverse();
    }

    const L = pairs.map((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mt-card mt-stop';
      b.dataset.i = i;
      b.style.setProperty('--d', `${i * 60}ms`);
      b.style.gridArea = `${i + 1} / 1`;
      b.innerHTML = `<span class="mt-ico">${iconHTML(p.left.icon)}</span><span class="mt-txt ak-bi"></span><span class="mt-num">${myNum(i + 1)}</span>`;
      bi(b.querySelector('.mt-txt'), p.left);
      leftEl.appendChild(b);
      return b;
    });
    const R = [];
    order.forEach((pi, k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mt-card mt-page';
      b.dataset.i = pi;
      b.style.setProperty('--d', `${k * 60 + 40}ms`);
      b.style.gridArea = `${k + 1} / 2`;
      b.style.setProperty('--tilt', `${[-0.8, 0.6, -0.4, 0.9, -0.6, 0.5][k % 6]}deg`);
      b.innerHTML = '<span class="mt-txt ak-bi"></span><span class="mt-pg"></span>';
      bi(b.querySelector('.mt-txt'), pairs[pi].right);
      b.querySelector('.mt-pg').textContent = `${lpg()} ${myNum(12 + pi * 7)}`;
      rightEl.appendChild(b);
      R[pi] = b;
    });
    function lpg() { return document.documentElement.getAttribute('data-lang') === 'en' ? 'p.' : 'စာ'; }

    const joined = new Set();
    let sel = null; // { side, i, el }
    const updateCount = () => bi(countEl, { my: `${myNum(joined.size)} / ${myNum(n)} တွဲပြီး`, en: `${joined.size} of ${n} matched` });
    updateCount();

    function tap(side, i, el) {
      if (joined.has(i) || A.closed()) return;
      if (!sel || sel.side === side) {
        if (sel) sel.el.classList.remove('on');
        if (sel && sel.el === el) { sel = null; return; }
        sel = { side, i, el };
        el.classList.add('on');
        buzz(6);
        return;
      }
      const a = sel;
      sel = null;
      a.el.classList.remove('on');
      if (a.i === i) join(i);
      else miss(a.el, el);
    }
    function join(i) {
      joined.add(i);
      L[i].classList.add('done');
      R[i].classList.add('done');
      buzz(14);
      drawLine(i, true);
      updateCount();
      if (joined.size === n) finish();
    }
    function miss(a, b) {
      mistakes++;
      for (const el of [a, b]) { el.classList.add('no'); A.shake(el, 'ak-wiggle'); setTimeout(() => el.classList.remove('no'), 500); }
      buzz(30);
      A.setHint({ my: 'ဒီစာမျက်နှာ မဟုတ်ဘူး — ပြန်ကြည့်ပါ', en: 'Not that page. Look again.' }, 'warn');
    }
    L.forEach((el, i) => el.addEventListener('click', () => tap('L', i, el)));
    R.forEach((el, i) => el && el.addEventListener('click', () => tap('R', i, el)));

    // pencil lines: a slightly wobbly graphite stroke, drawn on
    const lines = new Map();
    function lineD(i) {
      const br = board.getBoundingClientRect();
      const a = L[i].getBoundingClientRect(), b = R[i].getBoundingClientRect();
      const x1 = a.right - br.left - 2, y1 = a.top + a.height / 2 - br.top;
      const x2 = b.left - br.left + 2, y2 = b.top + b.height / 2 - br.top;
      const mx = (x1 + x2) / 2, w = (i % 2 ? 1 : -1) * 4;
      return { d: `M${x1},${y1} C${mx + w},${y1 + w} ${mx - w},${y2 - w} ${x2},${y2}`, x1, y1, x2, y2 };
    }
    function drawLine(i, animate) {
      const { d, x1, y1, x2, y2 } = lineD(i);
      let g = lines.get(i);
      if (!g) {
        g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.innerHTML = '<path class="mt-l2"/><path class="mt-l1"/><circle class="mt-dot" r="3"/><circle class="mt-dot" r="3"/>';
        svg.appendChild(g);
        lines.set(i, g);
      }
      const [p2, p1, c1, c2] = g.children;
      p1.setAttribute('d', d);
      p2.setAttribute('d', d);
      p2.setAttribute('transform', 'translate(.7 .9)');
      c1.setAttribute('cx', x1); c1.setAttribute('cy', y1);
      c2.setAttribute('cx', x2); c2.setAttribute('cy', y2);
      if (animate) {
        const len = p1.getTotalLength();
        for (const p of [p1, p2]) {
          p.style.strokeDasharray = `${len}`;
          p.style.strokeDashoffset = `${len}`;
          p.getBoundingClientRect();
          p.style.transition = 'stroke-dashoffset .38s cubic-bezier(.4,.1,.3,1)';
          p.style.strokeDashoffset = '0';
        }
        c2.style.opacity = '0';
        setTimeout(() => (c2.style.opacity = '1'), 360);
      }
    }
    const relayout = () => { for (const i of lines.keys()) drawLine(i, false); };
    const ro = new ResizeObserver(relayout);
    ro.observe(board);

    async function finish() {
      A.setHint({ my: 'လမ်းလျှောက်ခဲ့တာတွေက စာအုပ်ထဲက သင်ခန်းစာတွေပဲ', en: 'The walk was the lesson all along.' }, 'good');
      await wait(450);
      board.classList.add('all');
      await A.seal(true);
      ro.disconnect();
      A.done({ ok: true, mistakes });
    }

    // tests and accessibility: "match them for me"
    A.wrap.autoMatch = async () => {
      for (let i = 0; i < n; i++) {
        if (joined.has(i) || A.closed()) continue;
        L[i].click();
        await wait(220);
        R[i].click();
        await wait(380);
      }
    };
    window.__act = A.wrap;
  });
}

function injectMatchStyle() {
  if (document.getElementById('act-match-style')) return;
  const s = document.createElement('style');
  s.id = 'act-match-style';
  s.textContent = `
  .ak-match .act-card { width: min(100%, 560px); }
  .mt-board { position: relative; display: grid; grid-template-columns: 1fr 1fr; column-gap: clamp(28px, 8vw, 64px); row-gap: 10px; padding: 6px 2px 6px; isolation: isolate; }
  .mt-board::before { content: ""; position: absolute; left: 32px; top: 36px; bottom: 36px; border-left: 2.5px dotted rgba(164,122,44,.6); z-index: -1; }
  .mt-lines { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; z-index: 2; }
  .mt-l1 { fill: none; stroke: #4A4850; stroke-width: 2.4; stroke-linecap: round; opacity: .9; }
  .mt-l2 { fill: none; stroke: #8E8C96; stroke-width: 1.2; stroke-linecap: round; opacity: .55; }
  .mt-dot { fill: #4A4850; transition: opacity .15s; }
  .mt-card { position: relative; display: flex; align-items: center; gap: 8px; min-height: 64px; box-sizing: border-box; padding: 7px 9px; border-radius: 14px; cursor: pointer;
    font: 700 13.5px/1.55 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; text-align: left; border: 2px solid #E2D5B8; background: #FFFDF8;
    box-shadow: 0 3px 0 #D9C9A6; transition: transform .16s, box-shadow .16s, border-color .16s, opacity .3s; animation: mtin .4s var(--d, 0ms) cubic-bezier(.2,1.3,.4,1) both; }
  .mt-card .ak-sub { font-weight: 500; font-size: 10.5px; margin-top: 1px; }
  .mt-card:active { transform: translateY(2px); box-shadow: 0 1px 0 #D9C9A6; }
  .mt-card.on { border-color: #C9A24A; transform: translateY(-3px); box-shadow: 0 5px 0 #C9A24A, 0 0 0 4px rgba(201,162,74,.28); }
  .mt-card.no { border-color: #B5534A; box-shadow: 0 3px 0 #D99A90; }
  .mt-card.done { cursor: default; border-color: #CFC2A3; box-shadow: 0 2px 0 #E2D5B8; }
  .mt-card.done .mt-txt, .mt-card.done .mt-ico { opacity: .72; }
  .mt-ico { flex: none; width: 46px; height: 46px; border-radius: 50%; background: #F3E6C8; border: 2px solid #E2D5B8; display: grid; place-items: center; }
  .mt-ico svg { width: 38px; height: 38px; }
  .mt-emoji { font-size: 26px; }
  .mt-stop.done .mt-ico { background: #E9F0DF; border-color: #A9C49A; }
  .mt-num { position: absolute; top: -7px; left: -5px; width: 20px; height: 20px; border-radius: 50%; background: #6E1F2A; color: #FFFDF8; font: 700 11px/20px "Noto Sans Myanmar", system-ui; text-align: center; }
  .mt-txt { min-width: 0; overflow-wrap: anywhere; }
  .mt-page { padding: 8px 10px 8px 18px; border-radius: 4px 12px 12px 4px; transform: rotate(var(--tilt, 0deg));
    background: #FFFDF8 repeating-linear-gradient(transparent 0 19px, #DCE6EE 19px 20px); background-position: 0 6px;
    border-color: #E2D5B8; border-left: 2px solid #E2D5B8; font-weight: 600; font-size: 13px; }
  .mt-page::before { content: ""; position: absolute; left: 10px; top: 0; bottom: 0; border-left: 1.5px solid #E6A49B; }
  .mt-page::after { content: ""; position: absolute; right: -2px; bottom: -2px; width: 14px; height: 14px; background: linear-gradient(135deg, #F1E6CC 50%, #F6F0E2 50%);
    border-radius: 0 0 10px 0; box-shadow: -1px -1px 0 #E2D5B8; }
  .mt-page.on { transform: rotate(0deg) translateY(-3px); }
  .mt-pg { position: absolute; right: 16px; top: 3px; font: 600 9.5px/1 system-ui, sans-serif; color: #A4806A; opacity: .8; }
  .mt-page .mt-txt { padding-top: 6px; }
  .mt-page.done::before { border-left-color: #A9C49A; }
  .mt-count { margin-top: 8px; color: #8C6A28; font-weight: 700; display: flex; justify-content: center; gap: 6px; align-items: baseline; }
  .mt-count .ak-sub { display: inline; }
  .mt-board.all .mt-card { opacity: .55; }
  @keyframes mtin { from { opacity: 0; transform: translateY(10px) rotate(var(--tilt, 0deg)); } }
  @media (max-width: 480px) { .mt-card { font-size: 13px; padding: 6px 7px; gap: 6px; } .mt-page { padding-left: 17px; } .mt-ico { width: 38px; height: 38px; } .mt-ico svg { width: 31px; height: 31px; } .mt-board::before { left: 28px; } }
  `;
  document.head.appendChild(s);
}
