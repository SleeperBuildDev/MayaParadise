// Shared frame for the hand-work acts (shape.js, match.js, ownwords.js): the paper card in the same
// family as trace.js and story.js's .act-* CSS, Burmese-first text with the other language small
// underneath, ✕ / Escape cancel, the ✓ seal, gentle shakes. Self-contained CSS, so the acts also
// run on dev/acts.html without story.js.
//
//   const A = openAct({ title, hint, kind, resolve, onCancel })
//   A.body (put the act here)  A.setHint(o)  A.shake(el)  await A.seal(ok)  A.done(result)
import { tr, lang } from '../../game/ui.js';

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export const myNum = (n) => (lang() === 'en' ? String(n) : String(n).replace(/\d/g, (d) => '၀၁၂၃၄၅၆၇၈၉'[d]));
export const buzz = (ms = 16) => { try { navigator.vibrate?.(ms); } catch { /* no vibration */ } };
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

// Burmese first; the other language small underneath (when the game is in English, the other way round)
export function bi(el, o) {
  el.textContent = '';
  if (o == null || o === '') return el;
  if (typeof o === 'string') { el.append(o); return el; }
  const main = tr(o);
  const other = lang() === 'en' ? o.my : o.en;
  const b = document.createElement('span');
  b.className = 'ak-main';
  b.textContent = main;
  el.append(b);
  if (other && other !== main) {
    const s = document.createElement('small');
    s.className = 'ak-sub';
    s.textContent = other;
    el.append(s);
  }
  return el;
}

export function seededRandom(seed = 1) {
  let s = (seed * 9301 + 49297) % 233280 || 1;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

export function shuffled(arr, rnd = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function openAct({ title = '', hint = '', kind = '', resolve, onCancel } = {}) {
  injectKit();
  const host = document.getElementById('game') || document.body;
  const wrap = document.createElement('div');
  wrap.className = `act-wrap ak ak-${kind}`;
  wrap.innerHTML = `<div class="act-card" role="dialog" aria-modal="true">
    <button type="button" class="ak-x" aria-label="ပိတ်မယ် / Close">✕</button>
    <div class="ak-head"><p class="act-title ak-bi"></p><p class="act-hint ak-bi"></p></div>
    <div class="ak-body"></div></div>`;
  const card = wrap.querySelector('.act-card');
  const hintEl = wrap.querySelector('.act-hint');
  bi(wrap.querySelector('.act-title'), title);
  bi(hintEl, hint);
  host.appendChild(wrap);
  host.classList.add('acting');
  let closed = false;

  const A = {
    wrap, card, host, hintEl, body: wrap.querySelector('.ak-body'), closed: () => closed, onKey: null,
    setHint(o, tone = '') {
      bi(hintEl, o);
      hintEl.dataset.tone = tone;
      hintEl.classList.remove('ak-new');
      void hintEl.offsetWidth;
      hintEl.classList.add('ak-new');
    },
    shake(el = card, cls = 'ak-shake') {
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
      setTimeout(() => el.classList.remove(cls), 450);
    },
    async seal(ok = true, at = null, label = null) {
      const s = document.createElement('div');
      s.className = `ak-seal ${ok ? 'good' : 'again'}${at ? ' at' : ''}`;
      if (at) { s.style.left = `${at[0]}px`; s.style.top = `${at[1]}px`; }
      s.innerHTML = `<b>${ok ? '✓' : '…'}</b>`;
      if (label) { s.classList.add('word'); bi(s.firstChild, label); }
      card.appendChild(s);
      buzz(ok ? 30 : 12);
      await wait(900);
    },
    done(result) {
      if (closed) return;
      closed = true;
      window.removeEventListener('keydown', onKeyDown, true);
      wrap.classList.add('ak-out');
      setTimeout(() => wrap.remove(), 240);
      host.classList.remove('acting');
      if (window.__act === wrap) window.__act = null;
      resolve?.(result);
    },
    cancel() { if (!closed) A.done({ ok: false, cancelled: true, ...(onCancel?.() || {}) }); },
  };
  wrap.querySelector('.ak-x').addEventListener('click', (e) => { e.stopPropagation(); A.cancel(); });
  // the act is modal: keys stay here (Escape cancels; the game's own keys must not walk Maya away)
  function onKeyDown(e) {
    if (closed) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); A.cancel(); return; }
    if (e.key === 'Backspace' && !e.target.closest?.('input, textarea')) e.preventDefault();
    e.stopImmediatePropagation();
    A.onKey?.(e);
  }
  window.addEventListener('keydown', onKeyDown, true);
  for (const t of ['pointerdown', 'click', 'wheel', 'touchstart']) wrap.addEventListener(t, (e) => e.stopPropagation(), { passive: true });
  return A;
}

function injectKit() {
  if (document.getElementById('act-kit-style')) return;
  const s = document.createElement('style');
  s.id = 'act-kit-style';
  s.textContent = `
  .act-wrap.ak { position: absolute; inset: 0; z-index: 44; display: flex; align-items: center; justify-content: center; box-sizing: border-box;
    padding: max(10px, env(safe-area-inset-top)) 10px max(10px, env(safe-area-inset-bottom)); background: rgba(42,33,24,.32);
    animation: akfade .25s ease both; -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; }
  .act-wrap.ak.ak-out { animation: akfadeout .22s ease both; }
  .ak .act-card { position: relative; box-sizing: border-box; width: min(100%, 440px); max-height: 100%; overflow-x: hidden; overflow-y: auto;
    background: #F6F0E2 radial-gradient(120% 80% at 50% 0%, #FBF6EA 0%, rgba(246,240,226,0) 60%); border: 3px solid #C9A24A; border-radius: 20px;
    padding: 12px 14px 14px; box-shadow: 0 10px 30px rgba(59,42,26,.3), inset 0 0 0 1px rgba(255,253,248,.7);
    font: 14px/1.65 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; text-align: center; animation: akpop .42s cubic-bezier(.2,1.35,.4,1) both; }
  .ak .act-card::-webkit-scrollbar { width: 0; }
  .ak-head { padding: 0 34px; }
  .ak .act-title { margin: 2px 0 0; font-weight: 700; color: #6E1F2A; font-size: 16px; line-height: 1.6; }
  .ak .act-hint { margin: 2px 0 8px; color: #6A5A48; min-height: 1.6em; }
  .ak .act-hint[data-tone="warn"] .ak-main { color: #A0452F; } .ak .act-hint[data-tone="good"] .ak-main { color: #4F7F43; }
  .ak .act-hint.ak-new { animation: akhint .35s ease both; }
  .ak-bi .ak-main { display: block; }
  .ak-bi .ak-sub, .ak .ak-sub { display: block; font: 500 11px/1.35 system-ui, -apple-system, "Segoe UI", sans-serif; color: #8C6A28; letter-spacing: .1px; }
  .ak .act-title .ak-sub { color: #A4806A; font-weight: 600; margin-top: -1px; }
  .ak-x { position: absolute; top: 9px; right: 9px; width: 34px; height: 34px; border-radius: 50%; border: 2px solid #E2D5B8; background: #FFFDF8; color: #6E1F2A;
    font: 700 15px/1 system-ui, sans-serif; cursor: pointer; padding: 0; display: grid; place-items: center; z-index: 3; }
  .ak-x:active { transform: scale(.92); }
  .ak [hidden] { display: none !important; }
  .ak-body { position: relative; }
  .ak canvas { display: block; margin: 0 auto; touch-action: none; }
  .ak-btn { font: 700 15px/1.6 "Noto Sans Myanmar", system-ui, sans-serif; padding: 8px 24px; border-radius: 999px; border: 2px solid #A47A2C; background: #FFFDF8;
    color: #6E1F2A; box-shadow: 0 3px 0 #C9A24A; cursor: pointer; }
  .ak-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 #C9A24A; }
  .ak-btn .ak-sub { color: #A47A2C; font-size: 10.5px; }
  .ak-seal { position: absolute; left: 50%; top: 46%; width: 112px; height: 112px; margin: -56px 0 0 -56px; border-radius: 50%; border: 5px double #6E1F2A; color: #6E1F2A;
    background: rgba(255,253,248,.88); display: flex; align-items: center; justify-content: center; transform: rotate(-12deg); z-index: 5; pointer-events: none;
    animation: akstamp .45s cubic-bezier(.2,1.6,.4,1) both; box-shadow: 0 6px 20px rgba(59,42,26,.18); }
  .ak-seal.at { width: 84px; height: 84px; margin: -42px 0 0 -42px; }
  .ak-seal.at b { font-size: 38px; }
  .ak-seal.word b { font: 700 21px/1.25 "Noto Sans Myanmar", system-ui, sans-serif; text-align: center; }
  .ak-seal.word .ak-sub { color: inherit; font-size: 10px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; }
  .ak-seal b { font-size: 48px; line-height: 1; font-family: system-ui, sans-serif; }
  .ak-seal.again { border-color: #A47A2C; color: #A47A2C; }
  .ak-shake { animation: akshake .42s ease; }
  .ak-wiggle { animation: akwiggle .45s ease; }
  @keyframes akfade { from { opacity: 0; } }
  @keyframes akfadeout { to { opacity: 0; } }
  @keyframes akpop { from { opacity: 0; transform: translateY(14px) scale(.96); } }
  @keyframes akhint { from { opacity: 0; transform: translateY(4px); } }
  @keyframes akstamp { from { opacity: 0; transform: rotate(-12deg) scale(1.9); } }
  @keyframes akshake { 18% { transform: translateX(-6px); } 36% { transform: translateX(5px); } 54% { transform: translateX(-3px); } 72% { transform: translateX(2px); } }
  @keyframes akwiggle { 20% { transform: rotate(-3deg) translateX(-4px); } 40% { transform: rotate(2.5deg) translateX(4px); } 60% { transform: rotate(-1.5deg) translateX(-2px); } 80% { transform: rotate(1deg); } }
  @media (prefers-reduced-motion: reduce) { .ak *, .ak { animation-duration: .01s !important; } }
  `;
  document.head.appendChild(s);
}
