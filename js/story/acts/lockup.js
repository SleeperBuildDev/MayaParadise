// Handwork pattern "tap in rhythm" + "hold steady": lock up a forme (Day 8, ch 13, in the press).
// Knowing (the caller) beside goodwill (the setter's hands).
//
//   const r = await lockup({ title, hint, caller, setter, lines: [[word, ...] | null, ...], turnable: [word],
//                            quoin: { band: [a, b] }, wrong })
//   r = { ok: true, mistakes: n, rushed: n, quoinTries: n }     (cancel: { ok: false, cancelled: true, ... })
//
// Look: the caller's portrait top-left with a speech bubble that fills word by word (the call); an iron
// chase on the stone with empty rows; the setter's tray below with the word blocks, shuffled. Tap the
// called block AFTER the bubble finishes (its border turns gold). Tapping a block during the call counts
// `rushed` (the block hops back; goodwill without knowing). A wrong block flies to the row, hops back, and
// the caller says `wrong`, then calls again (`mistakes`). A `turnable` block arrives upside down: one tap
// turns it (no penalty, any time), the next sets it. After the rows: the quoin. Hold, the tightness rises;
// release inside `band` (too loose: a row rattles; too tight: the frame bows; either way, try again).
// Then both portraits lean in together. Rows given as `null` are skipped (1–3 rows).
//
// Test hook: window.__act.autoLockup()
import { openAct, bi, wait, buzz, clamp, myNum } from './kit.js';
import { whoChip } from './sort.js';

const T = {
  wait: { my: 'ခေါ်သံ ဆုံးအောင် စောင့်ပါ', en: 'Wait for the whole call' },
  quoin: { my: 'ဖိထားပြီး ကျပ်ပါ · ရွှေကွက်ထဲမှာ လွှတ်ပါ', en: 'Hold to tighten · let go in the gold' },
  hold: { my: 'ဖိထား', en: 'Hold' },
  loose: { my: 'ချောင်နေသေးတယ် — စာကြောင်းတစ်ကြောင်း လှုပ်နေတယ်', en: 'Still loose: a row rattles' },
  tight: { my: 'တင်းလွန်းတယ် — ဘောင် ကွေးသွားပြီ', en: 'Too tight: the frame bows' },
  locked: { my: 'ဘောင် ကျပ်ပြီ', en: 'Locked up tight' },
  turned: { my: 'ဇောက်ထိုး ပြန်လှည့်ပြီ', en: 'Turned the right way up' },
};
const graphemes = (s) => { try { return Array.from(new Intl.Segmenter('my', { granularity: 'grapheme' }).segment(s), (x) => x.segment); } catch { return Array.from(s); } };

export function lockup({ title = '', hint = '', caller = null, setter = null, lines = [], turnable = [], quoin = {}, wrong = null } = {}) {
  return new Promise((resolve) => {
    let mistakes = 0, rushed = 0, quoinTries = 0, raf = 0;
    const onUp = (e) => { if (e.code === 'Space') release(); };
    const A = openAct({ title, hint, kind: 'lockup', resolve: (r) => { cancelAnimationFrame(raf); window.removeEventListener('keyup', onUp); resolve(r); }, onCancel: () => ({ mistakes, rushed, quoinTries }) });
    injectLockStyle();
    const rows = lines.filter((r) => Array.isArray(r) && r.length);
    const band = quoin.band || [0.42, 0.58];
    A.body.innerHTML = `<div class="lk-top"><span class="lk-face caller"></span><div class="lk-call"><p></p><i class="lk-dots"><b></b><b></b><b></b></i></div></div>
      <div class="lk-stone"><div class="lk-chase"><div class="lk-rows"></div><span class="lk-quoin"></span></div></div>
      <div class="lk-bottom"><div class="lk-tray"></div><span class="lk-face setter"></span></div>
      <div class="lk-qbar" hidden><div class="lk-meter"><span class="lk-band"></span><span class="lk-fill"></span><span class="lk-needle"></span></div>
        <button type="button" class="ak-btn lk-hold ak-bi"></button></div>`;
    const callEl = A.body.querySelector('.lk-call');
    const callP = callEl.querySelector('p');
    const rowsEl = A.body.querySelector('.lk-rows');
    const chase = A.body.querySelector('.lk-chase');
    const quoinEl = A.body.querySelector('.lk-quoin');
    const tray = A.body.querySelector('.lk-tray');
    const qbar = A.body.querySelector('.lk-qbar');
    const holdBtn = A.body.querySelector('.lk-hold');
    const fillEl = A.body.querySelector('.lk-fill');
    const needle = A.body.querySelector('.lk-needle');
    const faces = { caller: A.body.querySelector('.lk-face.caller'), setter: A.body.querySelector('.lk-face.setter') };
    if (caller) faces.caller.appendChild(whoChip(caller, { face: 'talk', size: 48 }));
    if (setter) faces.setter.appendChild(whoChip(setter, { face: 'smile', size: 44 }));
    bi(holdBtn, T.hold);
    const bandEl = A.body.querySelector('.lk-band');
    bandEl.style.left = `${band[0] * 100}%`;
    bandEl.style.width = `${(band[1] - band[0]) * 100}%`;

    // ---- the chase: one row of slots per line
    const slots = rows.map((row, r) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'lk-row';
      rowsEl.appendChild(rowEl);
      return row.map((w) => {
        const s = document.createElement('span');
        s.className = 'lk-slot';
        s.style.setProperty('--w', String(Math.max(1.6, graphemes(w).length * 0.62 + 1.2)));
        rowEl.appendChild(s);
        return { w, el: s, row: r };
      });
    });
    // ---- the tray: every block, shuffled; turnable ones upside down
    const blocks = [];
    rows.forEach((row) => row.forEach((w) => blocks.push({ w, up: !turnable.includes(w), set: false })));
    for (let i = blocks.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [blocks[i], blocks[j]] = [blocks[j], blocks[i]]; }
    blocks.forEach((b, k) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `lk-block${b.up ? '' : ' down'}`;
      el.style.setProperty('--d', `${k * 40}ms`);
      el.innerHTML = `<span>${b.w}</span>`;
      el.addEventListener('click', () => tap(b));
      tray.appendChild(el);
      b.el = el;
    });

    // ---- the call
    const S = { r: 0, i: 0, calling: false, ready: false, busy: false, phase: 'set', q: 0, holding: false, auto: false };
    const current = () => slots[S.r]?.[S.i];
    async function call() {
      const sl = current();
      if (!sl) return;
      S.calling = true; S.ready = false;
      callEl.classList.remove('ready');
      callEl.classList.add('calling');
      sl.el.classList.add('next');
      const gs = graphemes(sl.w);
      callP.textContent = '';
      const step = Math.max(70, Math.min(170, 900 / gs.length));
      for (const ch of gs) { if (A.closed()) return; callP.textContent += ch; await wait(step); }
      await wait(260);
      S.calling = false; S.ready = true;
      callEl.classList.remove('calling');
      callEl.classList.add('ready');
    }
    async function tap(b) {
      if (b.set || S.busy || S.phase !== 'set' || A.closed()) return;
      if (!b.up) { // a turnable block: one tap turns it (never a penalty)
        b.up = true;
        b.el.classList.remove('down');
        b.el.classList.add('turning');
        setTimeout(() => b.el.classList.remove('turning'), 420);
        buzz(10);
        A.setHint(T.turned, 'good');
        return;
      }
      if (!S.ready) {
        rushed++;
        A.shake(b.el, 'ak-wiggle');
        A.setHint(T.wait, 'warn');
        buzz(24);
        return;
      }
      const sl = current();
      S.busy = true;
      if (b.w === sl.w) {
        b.set = true;
        await fly(b.el, sl.el, true);
        sl.el.classList.remove('next');
        sl.el.classList.add('set');
        sl.el.innerHTML = `<span>${b.w}</span>`;
        b.el.classList.add('used');
        buzz(14);
        S.i++;
        if (S.i >= slots[S.r].length) { S.r++; S.i = 0; }
        S.busy = false;
        A.setHint(hint);
        if (S.r >= slots.length) startQuoin();
        else call();
        return;
      }
      mistakes++;
      await fly(b.el, sl.el, false);
      A.shake(b.el, 'ak-wiggle');
      if (wrong) { callP.textContent = ''; bi(callP, wrong); callEl.classList.remove('ready'); callEl.classList.add('said'); }
      buzz(30);
      await wait(1300);
      callEl.classList.remove('said');
      S.busy = false;
      call();
    }
    async function fly(from, to, stay) {
      const a = from.getBoundingClientRect(), t = to.getBoundingClientRect();
      const dx = t.left + t.width / 2 - (a.left + a.width / 2), dy = t.top + t.height / 2 - (a.top + a.height / 2);
      from.style.transition = 'transform .3s cubic-bezier(.5,0,.4,1)';
      from.style.transform = `translate(${dx * (stay ? 1 : 0.7)}px, ${dy * (stay ? 1 : 0.7)}px) scale(${stay ? 0.9 : 1})`;
      await wait(310);
      if (!stay) { from.style.transform = ''; await wait(300); }
      from.style.transition = '';
    }

    // ---- the quoin
    function startQuoin() {
      S.phase = 'quoin';
      callP.textContent = '';
      callEl.classList.remove('ready', 'calling');
      callEl.classList.add('quiet');
      A.body.querySelector('.lk-bottom').classList.add('rest');
      qbar.hidden = false;
      A.setHint(T.quoin);
      chase.classList.add('quoin');
    }
    const press = (e) => { e?.preventDefault?.(); if (S.phase !== 'quoin' || S.holding) return; S.holding = true; S.q = 0; holdBtn.classList.add('down'); chase.classList.remove('bow', 'rattle'); };
    const release = () => { if (!S.holding) return; S.holding = false; holdBtn.classList.remove('down'); judge(); };
    holdBtn.addEventListener('pointerdown', press);
    holdBtn.addEventListener('pointerup', release);
    holdBtn.addEventListener('pointerleave', release);
    holdBtn.addEventListener('pointercancel', release);
    A.onKey = (e) => { if (e.code === 'Space') { if (e.type === 'keydown') press(e); } };
    window.addEventListener('keyup', onUp);
    async function judge() {
      quoinTries++;
      const v = S.q;
      if (v >= band[0] && v <= band[1]) {
        S.phase = 'done';
        chase.classList.add('locked');
        A.setHint(T.locked, 'good');
        buzz(30);
        await wait(500);
        A.body.querySelector('.lk-top').classList.add('lean');
        A.body.querySelector('.lk-bottom').classList.add('lean');
        await wait(900);
        await A.seal(true);
        A.done({ ok: true, mistakes, rushed, quoinTries });
        return;
      }
      const loose = v < band[0];
      chase.classList.add(loose ? 'rattle' : 'bow');
      A.setHint(loose ? T.loose : T.tight, 'warn');
      buzz(loose ? 20 : 40);
      await wait(900);
      S.q = 0;
      chase.classList.remove('rattle', 'bow');
    }
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (S.holding) { S.q = Math.min(1, S.q + dt * 0.42); if (S.q >= 1) release(); }
      fillEl.style.width = `${S.q * 100}%`;
      needle.style.left = `${S.q * 100}%`;
      quoinEl.style.setProperty('--q', S.q.toFixed(3));
      if (!A.closed()) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    setTimeout(call, 700);

    // tests and accessibility: "set it for me" (waits for each call, turns the turnable block, locks in band)
    A.wrap.autoLockup = async () => {
      while (S.phase === 'set' && !A.closed()) {
        while ((!S.ready || S.busy) && S.phase === 'set') await wait(60);
        if (S.phase !== 'set') break;
        const sl = current();
        const b = blocks.find((x) => !x.set && x.w === sl.w);
        if (!b.up) { b.el.click(); await wait(350); }
        b.el.click();
        await wait(420);
      }
      await wait(500);
      press();
      const mid = (band[0] + band[1]) / 2;
      while (S.q < mid && !A.closed()) await wait(16);
      release();
    };
    A.wrap.state = S;
    window.__act = A.wrap;
    void clamp; void myNum;
  });
}

function injectLockStyle() {
  if (document.getElementById('act-lock-style')) return;
  const s = document.createElement('style');
  s.id = 'act-lock-style';
  s.textContent = `
  .ak-lockup .ak-sub { letter-spacing: 0 !important; word-spacing: 0; font-kerning: normal; text-rendering: geometricPrecision; }
  .ak-lockup .act-card { width: min(100%, 470px); }
  .lk-top { display: flex; align-items: flex-end; gap: 8px; margin: 0 2px 8px; text-align: left; transition: transform .6s cubic-bezier(.3,1.4,.5,1); }
  .lk-call { position: relative; flex: 1; min-height: 44px; display: flex; align-items: center; padding: 6px 12px; border-radius: 14px 14px 14px 4px; background: #FFFDF8;
    border: 2px solid #E2D5B8; font: 700 19px/1.5 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; box-sizing: border-box; transition: border-color .2s, box-shadow .2s; }
  .lk-top { padding-right: 4px; box-sizing: border-box; max-width: 100%; }
  .lk-call { min-width: 0; max-width: calc(100% - 58px); transform: none !important; overflow-wrap: anywhere; }
  .lk-call p { margin: 0; flex: 1; min-width: 0; } .lk-call .ak-sub { font-size: 10.5px; font-weight: 500; }
  .lk-call.said { font-size: 13.5px; color: #8C3A2A; }
  .lk-call::before { content: ""; position: absolute; left: -8px; bottom: 6px; border: 6px solid transparent; border-right-color: #E2D5B8; }
  .lk-call.ready { border-color: #C9A24A; box-shadow: 0 0 0 3px rgba(201,162,74,.25); }
  .lk-call.ready::before { border-right-color: #C9A24A; }
  .lk-dots { display: none; gap: 3px; } .lk-call.calling .lk-dots { display: inline-flex; }
  .lk-dots b { width: 5px; height: 5px; border-radius: 50%; background: #C9A24A; animation: lkdot 1s infinite; } .lk-dots b:nth-child(2) { animation-delay: .15s; } .lk-dots b:nth-child(3) { animation-delay: .3s; }
  .lk-stone { padding: 12px; border-radius: 14px; background: #87959A radial-gradient(circle at 30% 20%, rgba(255,255,255,.14), transparent 60%);
    box-shadow: inset 0 0 0 2px rgba(255,255,255,.15), 0 3px 8px rgba(59,42,26,.2); }
  .lk-chase { position: relative; padding: 10px 26px 10px 10px; border-radius: 6px; background: #CBBFA6; border: 7px solid #3A3A42;
    box-shadow: inset 0 0 0 1px #55555F, 0 2px 0 #23232A; transition: transform .25s; }
  .lk-chase::before, .lk-chase::after { content: ""; position: absolute; width: 6px; height: 6px; border-radius: 50%; background: #8A8A96; top: -5px; left: -5px; box-shadow: calc(100% + 0px) 0 0 #8A8A96; }
  .lk-rows { display: flex; flex-direction: column; gap: 6px; }
  .lk-row { display: flex; flex-wrap: wrap; gap: 4px; min-height: 40px; align-items: stretch; }
  .lk-slot { flex: var(--w) 1 0; min-width: 34px; min-height: 38px; border-radius: 4px; border: 2px dashed rgba(90,70,40,.35); background: rgba(255,250,235,.25);
    display: grid; place-items: center; box-sizing: border-box; transition: background .2s, border-color .2s; }
  .lk-slot.next { border-color: #C9A24A; background: rgba(255,240,200,.5); }
  .lk-slot.set { border: 0; background: linear-gradient(#E3C08A, #C99B5B); box-shadow: inset 0 -3px 0 #A47A44, inset 0 1px 0 #F3DDB0; animation: lkset .3s cubic-bezier(.2,1.6,.4,1); }
  .lk-slot.set span { font: 800 14px/1.4 "Noto Sans Myanmar", system-ui, sans-serif; color: #2B2733; padding: 0 5px; }
  .lk-quoin { position: absolute; right: 2px; top: 10%; bottom: 10%; width: 18px; border-radius: 3px; background: linear-gradient(90deg, #8A6A3A, #C99B5B);
    border: 1.5px solid #2A2118; transform: translateX(calc(var(--q, 0) * -6px)); }
  .lk-quoin::after { content: ""; position: absolute; left: 3px; right: 3px; top: 48%; height: 4px; background: #3A3A42; border-radius: 2px; }
  .lk-chase.rattle .lk-row:nth-child(2), .lk-chase.rattle .lk-row:only-child { animation: akshake .35s ease 2; }
  .lk-chase.bow { transform: scaleX(1.025) scaleY(.985); border-color: #6E2A2A; }
  .lk-chase.locked { border-color: #2E2E36; box-shadow: inset 0 0 0 1px #6A6A76, 0 0 0 3px rgba(201,162,74,.6); }
  .lk-bottom { position: relative; display: flex; align-items: flex-end; gap: 8px; margin-top: 10px; transition: transform .6s cubic-bezier(.3,1.4,.5,1), opacity .3s; }
  .lk-bottom.rest .lk-tray { display: none; }
  .lk-bottom.rest { justify-content: flex-end; }
  .lk-tray { flex: 1; display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; padding: 10px 8px; border-radius: 8px;
    background: repeating-linear-gradient(90deg, #8A5E3A 0 2px, transparent 2px 64px), #B0804F; border: 3px solid #6E4A2A; box-shadow: inset 0 3px 6px rgba(40,24,10,.35); }
  .lk-block { position: relative; min-width: 40px; padding: 5px 9px 7px; border-radius: 4px; border: 0; cursor: pointer; background: linear-gradient(#EED0A0, #D3A867);
    box-shadow: 0 3px 0 #9A6E3E, inset 0 1px 0 #FFF0CF; font: 800 15px/1.4 "Noto Sans Myanmar", system-ui, sans-serif; color: #2B2733;
    animation: lkin .4s var(--d) cubic-bezier(.2,1.3,.4,1) both; transition: transform .2s, opacity .3s; }
  .lk-block span { display: inline-block; transition: transform .4s; }
  .lk-block.down span { transform: rotate(180deg); }
  .lk-block.down::after { content: "↻"; position: absolute; top: -8px; right: -6px; width: 17px; height: 17px; border-radius: 50%; background: #6E1F2A; color: #FFFDF8; font: 700 11px/17px system-ui; }
  .lk-block.turning { animation: lkturn .42s ease; }
  .lk-block:active { transform: translateY(2px); }
  .lk-block.used { opacity: 0; pointer-events: none; }
  .lk-face { flex: none; }
  .lk-call.quiet { visibility: hidden; }
  .lk-top.lean .lk-face { transform: translate(18px, 14px) rotate(8deg); transition: transform .6s cubic-bezier(.3,1.4,.5,1); }
  .lk-bottom.lean .lk-face { transform: translate(-18px, -14px) rotate(-8deg); transition: transform .6s cubic-bezier(.3,1.4,.5,1); }
  .lk-qbar { margin-top: 12px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .lk-meter { position: relative; width: 88%; height: 18px; border-radius: 9px; background: #E9DCC0; box-shadow: inset 0 1px 3px rgba(59,42,26,.25); overflow: visible; }
  .lk-band { position: absolute; top: -3px; bottom: -3px; background: rgba(201,162,74,.55); border: 2px solid #A47A2C; border-radius: 6px; box-sizing: border-box; }
  .lk-fill { position: absolute; left: 0; top: 4px; bottom: 4px; border-radius: 5px; background: linear-gradient(90deg, #8E9A9E, #3A3A42); }
  .lk-needle { position: absolute; top: -7px; width: 4px; height: 32px; margin-left: -2px; background: #6E1F2A; border-radius: 2px; }
  .lk-hold { touch-action: none; min-width: 150px; }
  .lk-hold.down { transform: translateY(2px); box-shadow: 0 1px 0 #C9A24A; background: #FFF4D8; }
  @keyframes lkdot { 50% { opacity: .2; } }
  @keyframes lkin { from { opacity: 0; transform: translateY(12px); } }
  @keyframes lkset { from { transform: scale(1.25); } }
  @keyframes lkturn { 50% { transform: rotateY(90deg); } }
  `;
  document.head.appendChild(s);
}
