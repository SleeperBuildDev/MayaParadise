// The fallback screen of the lazy town loader (townloader.js, ?lazy=1): on a very slow connection, when Maya
// would walk or drive into a town that has not arrived yet, a book page turns over the view and gently flutters
// (never a frozen screen, never a blank world) until the town is built, then turns away. After a moment it
// says "One moment…". It never says where to go.
//
//   const w = townWait(game)    the page turns in;   w.say()  the "one moment" line
//   await w.close()             the page turns away
//   waitNote(host)              just the line, over another page already turning (a desk's page-turn)
import { tr } from '../../game/ui.js';

// DRAFT(my): Maya to check the wording
const ONE_MOMENT = { my: 'ခဏစောင့်ပါ…', en: 'One moment…' };

function injectStyle() {
  if (document.getElementById('story-townwait-style')) return;
  const s = document.createElement('style');
  s.id = 'story-townwait-style';
  s.textContent = `
  #story-townwait { position: absolute; inset: 0; z-index: 62; perspective: 1400px; overflow: hidden; touch-action: none; }
  #story-townwait .leaf { position: absolute; inset: 0; transform-origin: 0 50%;
    background: linear-gradient(90deg, #EFE6D0 0%, #F7F1E1 12%, #FBF7EC 70%, #EDE3CB 100%); box-shadow: inset 0 0 60px rgba(120,90,40,.18); }
  #story-townwait .leaf::before { content: ''; position: absolute; inset: 0;
    background: repeating-linear-gradient(180deg, transparent 0 27px, rgba(70,110,170,.13) 27px 28px); }
  #story-townwait .leaf::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(0,0,0,.08), transparent 18%); }
  #story-townwait .curl { position: absolute; right: 0; bottom: 0; width: 120px; height: 120px; transform-origin: 100% 100%;
    background: linear-gradient(135deg, transparent 50%, #E6DABD 50%, #F4ECD8 70%, #FBF7EC 100%);
    box-shadow: -6px -6px 14px rgba(90,60,20,.12); border-top-left-radius: 8px; animation: rc-curl 1.6s ease-in-out infinite alternate; }
  @keyframes rc-curl { from { transform: scale(.55); } to { transform: scale(1); } }
  .story-townwait-note { position: absolute; left: 0; right: 0; top: 46%; text-align: center; z-index: 63; pointer-events: none;
    font: 600 20px/1.6 "Noto Sans Myanmar", system-ui, sans-serif; color: #6B4A1E; opacity: 0; transition: opacity .6s; }
  .story-townwait-note.on { opacity: .85; }
  .story-townwait-note i { display: inline-block; width: 7px; height: 7px; margin: 0 4px; border-radius: 50%; background: #A47A2C; animation: rc-dot 1.2s infinite; }
  .story-townwait-note i:nth-child(2) { animation-delay: .2s; } .story-townwait-note i:nth-child(3) { animation-delay: .4s; }
  @keyframes rc-dot { 0%, 100% { opacity: .2; } 50% { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { #story-townwait .curl, .story-townwait-note i { animation: none; } }`;
  document.head.appendChild(s);
}

const call = (o, fn, ...a) => (o && typeof o[fn] === 'function' ? o[fn](...a) : undefined);

/** The "one moment" line over `host` (a page already covering the view); -> { remove() }. */
export function waitNote(host = document.getElementById('game')) {
  injectStyle();
  const el = document.createElement('div');
  el.className = 'story-townwait-note';
  el.innerHTML = `<div>${tr(ONE_MOMENT)}</div><div><i></i><i></i><i></i></div>`;
  (host || document.body).appendChild(el);
  requestAnimationFrame(() => el.classList.add('on'));
  return { remove() { el.remove(); } };
}

/** Turns a page over the view (it flutters while it waits). */
export function townWait(game) {
  injectStyle();
  const host = document.getElementById('game') || document.body;
  const el = document.createElement('div');
  el.id = 'story-townwait';
  el.innerHTML = '<div class="leaf"><div class="curl"></div></div>';
  // taps on the page go nowhere (she waits with it)
  for (const ev of ['pointerdown', 'touchstart', 'click']) el.addEventListener(ev, (e) => e.stopPropagation(), { passive: true });
  host.appendChild(el);
  const leaf = el.firstChild;
  call(game?.audio, 'play', 'page');
  const shown = leaf.animate([{ transform: 'translateX(100%) rotateY(-70deg)', opacity: 0.6 }, { transform: 'translateX(0) rotateY(0deg)', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.4,.1,.3,1)', fill: 'forwards' }).finished.catch(() => {});
  let note = null;
  return {
    el,
    shown,
    say() { if (!note && el.isConnected) note = waitNote(el); },
    async close() {
      await shown;
      note?.remove();
      const a = leaf.animate([{ transform: 'rotateY(0deg)', opacity: 1 }, { transform: 'rotateY(-95deg)', opacity: 0.2 }], { duration: 520, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'forwards' });
      await a.finished.catch(() => {});
      el.remove();
    },
  };
}
