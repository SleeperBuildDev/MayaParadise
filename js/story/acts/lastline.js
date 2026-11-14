// The player's own last line of the reply (Day 15, finale). No wrong answer, no shake, no seal judgement.
//
//   const r = await lastline({ title, prompt, above?: [{ my, en, struck? }], starts: [{ my, en }], ends: [{ my, en }],
//                              allowType = true, maxLen = 80, allowBlank = true })
//   r = { ok: true, line: { my, en } | null, picks: [startIdx, endIdx] | null, typed: string | null, blank: boolean }
//   (cancel: { ok: false, cancelled: true, line: null, picks: null, typed: null, blank: true })
//
// Look: the reply letter's paper; Maya's ink lines above (`above`, a `struck` line is crossed out in
// pencil, as her Act 1 line is), then one empty ruled line with a pencil caret. Two short tile trays,
// beginnings and endings: one of each writes the line in pencil. A pencil button opens a one-line field
// (`maxLen`, kept on this device only: nothing is sent anywhere). A quiet "leave it blank" button. Every
// result closes the same way: a soft pencil flourish under the line.
//
// Test hook: window.__act.autoLastline({ start = 2, end = 0, typed = null, blank = false } = {})
import { openAct, bi, wait, buzz } from './kit.js';
import { tr, lang } from '../../game/ui.js';

const T = {
  starts: { my: 'အစ', en: 'Beginnings' },
  ends: { my: 'အဆုံး', en: 'Endings' },
  type: { my: 'ကိုယ့်စကားနဲ့ ရေးမယ်', en: 'Write in my own words' },
  blank: { my: 'ဗလာ ထားမယ်', en: 'Leave it blank' },
  done: { my: 'ဒါ ကျွန်ုပ်ရဲ့ စာကြောင်း', en: 'This is my line' },
  ph: { my: 'ဒီမှာ ရေးပါ…', en: 'Write here…' },
  back: { my: 'အကွက်တွေနဲ့ ရွေးမယ်', en: 'Pick from the tiles' },
};

export function lastline({ title = '', prompt = '', hint = '', above = [], starts = [], ends = [], allowType = true, maxLen = 80, allowBlank = true } = {}) {
  return new Promise((resolve) => {
    const A = openAct({ title, hint: hint || prompt, kind: 'last', resolve, onCancel: () => ({ line: null, picks: null, typed: null, blank: true }) });
    injectLastStyle();
    A.body.innerHTML = `<div class="ll-paper"><div class="ll-above"></div>
        <div class="ll-line"><span class="ll-hand"></span><span class="ll-caret"></span><input class="ll-input" type="text" hidden autocomplete="off" enterkeyhint="done"><svg class="ll-flourish" viewBox="0 0 220 26" hidden aria-hidden="true"><path d="M4 16 C40 24 96 22 136 14 S196 2 184 12 S160 24 216 18"/></svg></div>
        <small class="ll-count" hidden></small></div>
      <div class="ll-trays"><p class="ll-tl ak-bi"></p><div class="ll-tray s"></div><p class="ll-tl ak-bi"></p><div class="ll-tray e"></div></div>
      <div class="ll-actions"><button type="button" class="ll-pencil ak-bi"></button><button type="button" class="ll-blank ak-bi"></button></div>
      <button type="button" class="ak-btn ll-done ak-bi" hidden></button>`;
    const aboveEl = A.body.querySelector('.ll-above');
    const lineEl = A.body.querySelector('.ll-line');
    const hand = A.body.querySelector('.ll-hand');
    const caret = A.body.querySelector('.ll-caret');
    const input = A.body.querySelector('.ll-input');
    const flourish = A.body.querySelector('.ll-flourish');
    const countEl = A.body.querySelector('.ll-count');
    const trays = A.body.querySelector('.ll-trays');
    const [tl1, tl2] = A.body.querySelectorAll('.ll-tl');
    const sTray = A.body.querySelector('.ll-tray.s'), eTray = A.body.querySelector('.ll-tray.e');
    const pencilBtn = A.body.querySelector('.ll-pencil');
    const blankBtn = A.body.querySelector('.ll-blank');
    const doneBtn = A.body.querySelector('.ll-done');
    bi(tl1, T.starts); bi(tl2, T.ends); bi(pencilBtn, T.type); bi(blankBtn, T.blank); bi(doneBtn, T.done);
    pencilBtn.hidden = !allowType;
    blankBtn.hidden = !allowBlank;
    input.maxLength = maxLen;
    input.placeholder = tr(T.ph);

    for (const l of above) {
      const p = document.createElement('p');
      p.className = `ll-ink ak-bi${l.struck ? ' struck' : ''}`;
      bi(p, l);
      aboveEl.appendChild(p);
    }
    let si = -1, ei = -1, typing = false, closing = false;
    const tile = (tray, item, i, side) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'll-tile ak-bi';
      b.style.setProperty('--d', `${i * 50}ms`);
      bi(b, item);
      b.addEventListener('click', () => pick(side, i));
      tray.appendChild(b);
      return b;
    };
    const sEls = starts.map((x, i) => tile(sTray, x, i, 's'));
    const eEls = ends.map((x, i) => tile(eTray, x, i, 'e'));

    function composed() {
      if (si < 0 && ei < 0) return null;
      const s = starts[si], e = ends[ei];
      return { my: [s?.my, e?.my].filter(Boolean).join(' '), en: [s?.en, e?.en].filter(Boolean).join(' ') };
    }
    function render() {
      const c = composed();
      hand.textContent = '';
      if (c) {
        const main = document.createElement('span');
        main.textContent = tr(c) + (si < 0 || ei < 0 ? ' …' : '');
        hand.appendChild(main);
        const other = lang() === 'en' ? c.my : c.en;
        if (other) { const sm = document.createElement('small'); sm.textContent = other; hand.appendChild(sm); }
      }
      lineEl.classList.toggle('empty', !c);
      sEls.forEach((el, i) => el.classList.toggle('on', i === si));
      eEls.forEach((el, i) => el.classList.toggle('on', i === ei));
      doneBtn.hidden = !(si >= 0 && ei >= 0);
    }
    function pick(side, i) {
      if (closing) return;
      if (typing) toTiles();
      if (side === 's') si = si === i ? -1 : i; else ei = ei === i ? -1 : i;
      buzz(6);
      render();
      hand.classList.remove('write'); void hand.offsetWidth; hand.classList.add('write');
    }
    function toTyping() {
      typing = true;
      si = ei = -1; render();
      trays.classList.add('rest');
      input.hidden = false; hand.hidden = true; caret.hidden = true; countEl.hidden = false;
      bi(pencilBtn, T.back);
      input.focus();
      updateCount();
    }
    function toTiles() {
      typing = false;
      trays.classList.remove('rest');
      input.hidden = true; hand.hidden = false; caret.hidden = false; countEl.hidden = true;
      bi(pencilBtn, T.type);
      render();
    }
    function updateCount() {
      countEl.textContent = `${input.value.length} / ${maxLen}`;
      doneBtn.hidden = !input.value.trim();
    }
    input.addEventListener('input', updateCount);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && input.value.trim()) { e.preventDefault(); finish('typed'); } });
    pencilBtn.addEventListener('click', () => (typing ? toTiles() : toTyping()));
    blankBtn.addEventListener('click', () => finish('blank'));
    doneBtn.addEventListener('click', () => finish(typing ? 'typed' : 'picked'));

    async function finish(kind) {
      if (closing) return;
      closing = true;
      input.blur();
      let r;
      if (kind === 'typed') {
        const txt = input.value.trim().slice(0, maxLen);
        input.hidden = true; hand.hidden = false;
        hand.textContent = txt;
        r = { ok: true, line: { my: txt, en: txt }, picks: null, typed: txt, blank: false };
      } else if (kind === 'blank') {
        si = ei = -1; render();
        r = { ok: true, line: null, picks: null, typed: null, blank: true };
      } else r = { ok: true, line: composed(), picks: [si, ei], typed: null, blank: false };
      caret.hidden = true;
      A.body.classList.add('closing');
      flourish.hidden = false;
      buzz(10);
      await wait(1500);
      A.done(r);
    }
    render();

    // tests and accessibility
    A.wrap.autoLastline = async ({ start = 2, end = 0, typed = null, blank = false } = {}) => {
      await wait(300);
      if (blank) { blankBtn.click(); return; }
      if (typed != null) { toTyping(); input.value = String(typed).slice(0, maxLen); updateCount(); await wait(400); doneBtn.click(); return; }
      pick('s', Math.min(start, starts.length - 1)); await wait(500);
      pick('e', Math.min(end, ends.length - 1)); await wait(900);
      doneBtn.click();
    };
    window.__act = A.wrap;
  });
}

function injectLastStyle() {
  if (document.getElementById('act-last-style')) return;
  const s = document.createElement('style');
  s.id = 'act-last-style';
  s.textContent = `
  .ak-last .ak-sub { letter-spacing: 0 !important; word-spacing: 0; font-kerning: normal; text-rendering: geometricPrecision; }
  .ak-last .act-card { width: min(100%, 480px); }
  .ll-paper { position: relative; margin: 2px 2px 10px; padding: 14px 16px 14px 40px; text-align: left; border-radius: 4px 12px 12px 4px;
    background: #FFFBF0 repeating-linear-gradient(transparent 0 37px, #D9CFB8 37px 38px); background-position: 0 12px;
    box-shadow: 0 1px 0 #E2D5B8, 0 8px 18px rgba(59,42,26,.14), inset 0 0 0 1px #EDE3CC; }
  .ll-paper::before { content: ""; position: absolute; left: 30px; top: 0; bottom: 0; border-left: 2px solid #E6A49B; }
  .ll-ink { margin: 0; min-height: 38px; font: 500 15px/1.55 "Noto Sans Myanmar", serif; color: #3B2A1E; padding-top: 3px; box-sizing: border-box; }
  .ll-ink .ak-sub { font: italic 500 12px/1.3 Georgia, serif; color: #7A6450; margin-top: -1px; }
  .ll-ink.struck { position: relative; color: #8A7A6A; }
  .ll-ink.struck::after { content: ""; position: absolute; left: -4px; right: 8%; top: 46%; height: 2px; background: #4A4850; transform: rotate(-1.2deg); border-radius: 2px; opacity: .8; }
  .ll-line { position: relative; display: flex; align-items: flex-end; min-height: 52px; margin-top: 6px; padding-bottom: 6px; border-bottom: 2px solid #C9B48A; }
  .ll-hand { flex: 0 1 auto; font: 400 18px/1.55 "Noto Sans Myanmar", system-ui, sans-serif; color: #44424C; transform: skewX(-6deg); transform-origin: left bottom; letter-spacing: .2px;
    text-shadow: .4px .3px 0 rgba(68,66,76,.35); }
  .ll-hand small { display: block; font: italic 500 11.5px/1.35 system-ui, sans-serif; color: #7C7A86; }
  .ll-hand.write span { animation: llwrite .7s steps(18) both; }
  .ll-caret { width: 2px; height: 26px; margin-left: 3px; margin-bottom: 4px; background: #6E1F2A; border-radius: 1px; animation: llblink 1s steps(1) infinite; opacity: .7; }
  .ll-line.empty::before { content: "…"; color: #B8A88A; font: 700 18px/1 system-ui; margin: 0 4px 8px 0; }
  .ll-input { flex: 1; min-width: 0; border: 0; background: transparent; outline: none; font: 400 18px/1.55 "Noto Sans Myanmar", system-ui, sans-serif; color: #44424C; padding: 2px 0; }
  .ll-input::placeholder { color: #B8A88A; }
  .ll-count { position: absolute; right: 14px; bottom: 2px; font: 600 10px/1 system-ui; color: #A4806A; }
  .ll-flourish { position: absolute; left: 0; bottom: -18px; width: min(80%, 260px); height: 26px; overflow: visible; pointer-events: none; }
  .ll-flourish path { fill: none; stroke: #4A4850; stroke-width: 2; stroke-linecap: round; stroke-dasharray: 420; stroke-dashoffset: 420; animation: lldraw 1.1s .1s ease-out forwards; opacity: .8; }
  .ll-trays { transition: opacity .3s; } .ll-trays.rest { opacity: .3; pointer-events: none; }
  .ll-tl { margin: 4px 0 4px; font: 700 12px/1.4 "Noto Sans Myanmar", system-ui; color: #8C6A28; text-align: left; padding-left: 4px; }
  .ll-tl .ak-main, .ll-tl .ak-sub { display: inline; margin-right: 6px; }
  .ll-tray { display: flex; flex-wrap: wrap; gap: 7px; justify-content: flex-start; margin-bottom: 6px; }
  .ll-tile { font: 700 13.5px/1.5 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; padding: 5px 11px 4px; border-radius: 12px; border: 2px solid #E2D5B8; background: #FFFDF8;
    box-shadow: 0 3px 0 #D9C9A6; cursor: pointer; text-align: left; animation: llin .4s var(--d) cubic-bezier(.2,1.3,.4,1) both; transition: border-color .2s, background .2s, transform .15s; }
  .ll-tile .ak-sub { font-size: 10.5px; font-weight: 500; }
  .ll-tile.on { border-color: #4A4850; background: #F3F1EA; box-shadow: 0 2px 0 #8E8C96; transform: translateY(1px) rotate(-.6deg); }
  .ll-actions { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin: 8px 2px 6px; }
  .ll-pencil { font: 700 12.5px/1.45 "Noto Sans Myanmar", system-ui; color: #44424C; background: #FFFDF8; border: 2px dashed #8E8C96; border-radius: 999px; padding: 4px 12px; cursor: pointer; }
  .ll-pencil::before { content: "✎ "; } .ll-pencil .ak-main { display: inline; } .ll-pencil .ak-sub { display: block; font-size: 10px; color: #7C7A86; }
  .ll-blank { font: 600 12px/1.45 "Noto Sans Myanmar", system-ui; color: #8C7A66; background: none; border: 0; text-decoration: underline dotted; cursor: pointer; padding: 4px 6px; }
  .ll-blank .ak-sub { font-size: 10px; }
  .ll-done { margin-top: 4px; }
  .closing .ll-trays, .closing .ll-actions, .closing .ll-done { opacity: .25; pointer-events: none; transition: opacity .4s; }
  @keyframes llblink { 50% { opacity: 0; } }
  @keyframes llin { from { opacity: 0; transform: translateY(8px); } }
  @keyframes llwrite { from { clip-path: inset(-10px 100% -10px 0); } to { clip-path: inset(-10px 0 -10px 0); } }
  @keyframes lldraw { to { stroke-dashoffset: 0; } }
  `;
  document.head.appendChild(s);
}
