// "Where do I act?" cue for mission screens (owner, 2026-11-15: "sometimes player can't find where to click").
// Only inside acts and mission screens: in the open world the no-arrows rule still holds (hints.js only).
//
//   const C = cue(host, { delay = 4000 })   host: the act's wrap (or a day screen's overlay)
//   C.set(spec | null)   the CURRENT step's target; a new step hides the cue and restarts the idle clock
//   C.wrong(ms = 700)    a wrong tap: show the cue again soon
//   C.later(ms)          push the cue back (e.g. while a line is being read)
//   C.stop()             remove it (it also stops by itself once the host leaves the page)
//
//   spec: { kind: 'tap' | 'hold' | 'drag' | 'trace' | 'many',
//           at:   element | [x, y] | () => element | [x, y] | null      (client px; the spot to act on)
//           to:   same, for 'drag' (where to drop)
//           path: () => [[x, y], ...]   for 'trace' (client px; the part of the guide to show)
//           many: () => [element | [x, y], ...]   for 'many': a soft ring on each, no finger (pick one yourself)
//           r: ring radius px (default: from the element's size, else 22)
//           label: { my, en } | () => { my, en } | false   (default: a short line per kind)
//           when: () => boolean         (shown only while true, e.g. a pole beat or "not while a line plays")
//           delay: ms                   (this step's idle wait, default the cue's)
//           ms: number | (len) => number (drag / trace: how long the finger takes; slow it where speed matters) }
// Idle = no pointer down / key inside the act for `delay` ms. Pressing hides the cue at once; after a
// press that did not move the step on, it comes back after 2.5 s. Cream / gold / maroon, small, never
// covering the target (the ring is round it, the finger rests just below-right of it).
import { tr, lang } from '../../game/ui.js';

const LABELS = {
  tap: { my: 'ဒီကို နှိပ်ပါ', en: 'Tap here' },
  hold: { my: 'ဒီမှာ ဖိထားပါ', en: 'Press and hold here' },
  drag: { my: 'ဒီလို ဆွဲပါ', en: 'Drag like this' },
  trace: { my: 'အစက်လေးတွေအတိုင်း ဆွဲပါ', en: 'Follow the dots' },
  many: { my: 'တစ်ခုကို ရွေးနှိပ်ပါ', en: 'Tap one of these' },
};
const FINGER = `<svg viewBox="0 0 40 50" aria-hidden="true"><path d="M12 3.5c2.9 0 5 2.1 5 5v13.2l2.6-.6c2.6-.6 4.6.5 5.4 2.5 2.6-.9 4.9.2 5.7 2.6 2.6-.4 4.6 1.4 4.6 4v7.3c0 6.6-5 11.5-11.6 11.5h-5.3c-3.9 0-7.1-1.9-9.2-5.1L2.6 33.2c-1.3-2-.6-4.3 1.4-5.3 1.9-1 3.8-.4 5 1.1l1.9 2.4V8.5c0-2.9 1.1-5 1.1-5z" fill="#FFFDF8" stroke="#6E1F2A" stroke-width="2.4" stroke-linejoin="round"/><path d="M9.6 5.6c.8-1.1 1.6-1.5 2.6-1.5 1.3 0 2.4.8 2.8 2" fill="none" stroke="#C9A24A" stroke-width="2" stroke-linecap="round"/></svg>`;
const TIP = [12, 4]; // the fingertip inside the 40 x 50 picture

export function cue(host, { delay = 4000 } = {}) {
  injectCueStyle();
  const layer = document.createElement('div');
  layer.className = 'cue-layer';
  layer.innerHTML = `<svg class="cue-path"><path class="cue-trail"/></svg><div class="cue-rings"></div><div class="cue-ring"><i></i></div><div class="cue-finger">${FINGER}</div><div class="cue-label"><b></b><small></small></div>`;
  if (host.id === 'game') layer.style.zIndex = '62'; // (#game > * sits every child at z 2)
  host.appendChild(layer);
  const ring = layer.querySelector('.cue-ring');
  const rings = layer.querySelector('.cue-rings');
  const finger = layer.querySelector('.cue-finger');
  const label = layer.querySelector('.cue-label');
  const trail = layer.querySelector('.cue-trail');
  let spec = null, idleFrom = performance.now(), pressed = false, seen = false, shown = false, raf = 0, alive = true, shownAt = 0, labelFor = null;

  const onDown = () => { pressed = true; hide(); };
  const onUp = () => { if (!pressed) return; pressed = false; idleFrom = performance.now() - (seen ? Math.max(0, wait() - 2500) : 0); };
  const onKey = () => { idleFrom = performance.now(); hide(); };
  host.addEventListener('pointerdown', onDown, true);
  window.addEventListener('pointerup', onUp, true);
  window.addEventListener('pointercancel', onUp, true);
  window.addEventListener('keydown', onKey, true);
  const wait = () => (spec?.delay ?? delay);
  // (the loop runs from the start, so a cue whose host leaves the page always cleans itself up)
  raf = requestAnimationFrame((t) => tick(t));

  function resolvePt(t) {
    if (typeof t === 'function') t = t();
    if (!t) return null;
    if (Array.isArray(t)) return { x: t[0], y: t[1], r: t[2] || 0, el: null };
    if (t.getBoundingClientRect) {
      if (!t.isConnected || t.hidden) return null;
      const b = t.getBoundingClientRect();
      if (!b.width && !b.height) return null;
      // a wide card gets a ring its own height (and a glow round its edge), not a ring wider than the screen
      return { x: b.left + b.width / 2, y: b.top + b.height / 2, r: Math.min(Math.max(b.width, b.height) / 2 + 6, Math.max(22, Math.min(b.width, b.height) / 2 + 10)), el: t, b };
    }
    if (typeof t.x === 'number') return { x: t.x, y: t.y, r: t.r || 0, el: null };
    return null;
  }
  const glowed = new Set();
  function glow(list) {
    for (const el of glowed) if (!list.includes(el)) { el.classList.remove('cue-glow'); glowed.delete(el); }
    for (const el of list) if (!glowed.has(el)) { el.classList.add('cue-glow'); glowed.add(el); }
  }
  function hide() {
    if (!shown) return;
    shown = false;
    layer.classList.remove('on');
    rings.innerHTML = '';
    glow([]);
  }
  function setLabel(s) {
    const o = s.label === false ? null : (typeof s.label === 'function' ? s.label() : s.label) || LABELS[s.kind || 'tap'];
    if (labelFor === o) return;
    labelFor = o;
    label.hidden = !o;
    if (!o) return;
    const main = tr(o), other = lang() === 'en' ? o.my : o.en;
    label.querySelector('b').textContent = main;
    label.querySelector('small').textContent = other && other !== main ? other : '';
  }
  function placeLabel(x, y, r, L) {
    if (label.hidden) return;
    const w = label.offsetWidth || 120, h = label.offsetHeight || 36;
    // outside the act's card when there is room (it never covers another choice), else beside the target
    const card = spec.box?.() || host.querySelector?.('.act-card');
    if (card) {
      const cb = card.getBoundingClientRect();
      const top = cb.top - L.top, bot = cb.bottom - L.top, cx = cb.left - L.left + cb.width / 2;
      const ly = L.height - bot >= h + 22 ? bot + 12 : top >= h + 22 ? top - h - 12 : null;
      if (ly != null) { label.style.transform = `translate(${Math.max(8, Math.min(L.width - w - 8, cx - w / 2))}px, ${ly}px)`; return; }
    }
    const below = y < L.height * 0.55;
    let lx = x - w / 2, ly = below ? y + r + 46 : y - r - h - 14;
    lx = Math.max(8, Math.min(L.width - w - 8, lx));
    ly = Math.max(8, Math.min(L.height - h - 8, ly));
    label.style.transform = `translate(${lx}px, ${ly}px)`;
  }
  function tick(now) {
    raf = 0;
    if (!alive) return;
    if (!host.isConnected || host.classList.contains('ak-out')) { stop(); return; }
    raf = requestAnimationFrame(tick);
    const want = spec && !pressed && now - idleFrom >= wait() && (spec.when ? spec.when() : true);
    if (!want) { hide(); return; }
    const L = layer.getBoundingClientRect();
    const kind = spec.kind || 'tap';
    if (kind === 'many') {
      const list = (spec.many?.() || []).map(resolvePt).filter(Boolean);
      if (!list.length) { hide(); return; }
      // elements glow round their own edge; bare points get a soft ring each
      glow(list.filter((p) => p.el).map((p) => p.el));
      const pts = list.filter((p) => !p.el);
      if (rings.childElementCount !== pts.length) rings.innerHTML = pts.map(() => '<div class="cue-ring soft"><i></i></div>').join('');
      pts.forEach((p, i) => {
        const r = spec.r || p.r || 26, d = rings.children[i];
        d.style.cssText = `width:${r * 2}px;height:${r * 2}px;transform:translate(${p.x - L.left - r}px,${p.y - L.top - r}px)`;
      });
      ring.style.display = 'none'; finger.style.display = 'none'; trail.style.display = 'none';
      setLabel(spec);
      const top = list.reduce((a, p) => (p.y < a.y ? p : a), list[0]);
      placeLabel(list.reduce((s, p) => s + p.x, 0) / list.length - L.left, top.y - L.top, (spec.r || top.r || 26), L);
      if (!shown) { shown = true; seen = true; shownAt = now; layer.classList.add('on'); }
      return;
    }
    rings.innerHTML = '';
    let p = resolvePt(spec.at);
    glow(p?.el && spec.glow !== false ? [p.el] : []);
    let pts = null;
    if (kind === 'trace') {
      pts = (spec.path?.() || []).filter(Boolean);
      if (pts.length < 2) { hide(); return; }
      p = p || { x: pts[0][0], y: pts[0][1], r: 0 };
    }
    if (!p) { hide(); return; }
    let q = null;
    if (kind === 'drag') { q = resolvePt(spec.to); if (!q) { hide(); return; } pts = [[p.x, p.y], [q.x, q.y]]; }
    // the target is scrolled out of the card: bring it in (once per showing)
    if (!shown && p.el && p.el.scrollIntoView) {
      const card = p.el.closest?.('.act-card');
      if (card) { const cb = card.getBoundingClientRect(); if (p.b.top < cb.top || p.b.bottom > cb.bottom) p.el.scrollIntoView({ block: 'nearest' }); }
    }
    let r = spec.r || p.r || 22;
    let x = p.x - L.left, y = p.y - L.top;
    ring.style.display = '';
    // a glowing card: no ring over its words; the finger points at its lower right
    if (p.el && spec.glow !== false && kind === 'tap') {
      ring.style.display = 'none';
      x = p.b.right - L.left - Math.min(34, p.b.width * 0.22);
      y = p.b.bottom - L.top - Math.min(14, p.b.height * 0.25);
      r = 6;
    }
    ring.className = `cue-ring ${kind}`;
    if (ring.style.display !== 'none') ring.style.cssText = `width:${r * 2}px;height:${r * 2}px;transform:translate(${x - r}px,${y - r}px)`;
    // the finger: tap / hold rest just below-right of the ring; drag / trace walk the path
    finger.style.display = '';
    let fx = x + r * 0.42, fy = y + r * 0.5, cls = kind;
    if (pts) {
      const P = pts.map((a) => [a[0] - L.left, a[1] - L.top]);
      let len = 0;
      const seg = [0];
      for (let i = 1; i < P.length; i++) { len += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push(len); }
      const period = typeof spec.ms === 'function' ? spec.ms(len) : spec.ms || (kind === 'drag' ? 1900 : Math.max(1800, Math.min(4200, len * 7)));
      const u = ((now - shownAt) % (period + 700)) / period; // a short rest at the end, then again
      const d = Math.min(1, u) * len;
      let k = 1;
      while (k < P.length - 1 && seg[k] < d) k++;
      const a = P[k - 1], b = P[k], t = seg[k] > seg[k - 1] ? (d - seg[k - 1]) / (seg[k] - seg[k - 1]) : 0;
      fx = a[0] + (b[0] - a[0]) * Math.min(1, t);
      fy = a[1] + (b[1] - a[1]) * Math.min(1, t);
      trail.style.display = '';
      trail.setAttribute('d', P.map((c, i) => `${i ? 'L' : 'M'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(''));
      finger.style.opacity = u > 1 ? '0' : '';
      cls = 'move';
      if (kind === 'drag') { ring.style.cssText = `width:${(q.r || 24) * 2}px;height:${(q.r || 24) * 2}px;transform:translate(${q.x - L.left - (q.r || 24)}px,${q.y - L.top - (q.r || 24)}px)`; ring.className = 'cue-ring drop'; }
    } else {
      trail.style.display = 'none';
      finger.style.opacity = '';
    }
    finger.className = `cue-finger ${cls}`;
    finger.style.transform = `translate(${fx - TIP[0]}px, ${fy - TIP[1]}px)`;
    setLabel(spec);
    placeLabel(x, y, r, L);
    if (!shown) { shown = true; seen = true; shownAt = now; layer.classList.add('on'); }
  }
  function stop() {
    if (!alive) return;
    alive = false;
    if (raf) cancelAnimationFrame(raf);
    host.removeEventListener('pointerdown', onDown, true);
    window.removeEventListener('pointerup', onUp, true);
    window.removeEventListener('pointercancel', onUp, true);
    window.removeEventListener('keydown', onKey, true);
    glow([]);
    layer.remove();
  }
  const C = {
    layer,
    set(s) {
      if (!alive) return C;
      spec = s || null;
      seen = false;
      idleFrom = performance.now();
      hide();
      if (spec && !raf) raf = requestAnimationFrame(tick);
      return C;
    },
    wrong(after = 700) { if (alive && spec) { idleFrom = performance.now() - wait() + after; pressed = false; } return C; },
    later(ms = 0) { idleFrom = Math.max(idleFrom, performance.now() + ms); hide(); return C; },
    shown: () => shown,
    spec: () => spec,
    stop,
  };
  return C;
}

function injectCueStyle() {
  if (document.getElementById('act-cue-style')) return;
  const s = document.createElement('style');
  s.id = 'act-cue-style';
  s.textContent = `
  .cue-layer { position: absolute; inset: 0; pointer-events: none; z-index: 70; opacity: 0; transition: opacity .35s ease; overflow: hidden; }
  .cue-layer.on { opacity: 1; }
  .cue-layer > * { position: absolute; left: 0; top: 0; }
  .cue-path { width: 100%; height: 100%; overflow: visible; }
  .cue-trail { fill: none; stroke: #C9A24A; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 2 9; opacity: .9;
    filter: drop-shadow(0 0 2px rgba(255,253,248,.95)); animation: cuemarch 1s linear infinite; }
  .cue-ring, .cue-rings .cue-ring { box-sizing: border-box; border-radius: 50%; border: 3px solid #C9A24A;
    box-shadow: 0 0 0 2px rgba(255,253,248,.85), 0 0 14px 3px rgba(201,162,74,.55), inset 0 0 0 2px rgba(255,253,248,.6); animation: cuebreath 1.4s ease-in-out infinite; }
  .cue-ring i { position: absolute; inset: -3px; border-radius: 50%; border: 2px solid #6E1F2A; opacity: 0; animation: cuewave 1.4s ease-out infinite; }
  .cue-ring.soft { border-color: rgba(201,162,74,.85); animation-duration: 1.8s; }
  .cue-ring.soft i { animation-duration: 1.8s; }
  .cue-ring.hold i { border-color: #C9A24A; border-width: 4px; animation: cuehold 1.8s ease-in infinite; }
  .cue-ring.drop { border-style: dashed; }
  .cue-finger { width: 34px; height: 42px; filter: drop-shadow(0 3px 3px rgba(59,42,26,.35)); will-change: transform; }
  .cue-finger svg { width: 100%; height: 100%; display: block; transform-origin: 12px 4px; }
  .cue-finger.tap svg { animation: cuetap 1.4s ease-in-out infinite; }
  .cue-finger.hold svg { animation: cuepress 1.8s ease-in-out infinite; }
  .cue-label { box-sizing: border-box; max-width: 270px; padding: 4px 12px 5px; border-radius: 12px; background: #FFFDF8; border: 2px solid #C9A24A; color: #6E1F2A;
    text-align: center; box-shadow: 0 3px 10px rgba(59,42,26,.22); animation: cuelabel 2.8s ease-in-out infinite; }
  .cue-label b { display: block; font: 700 12.5px/1.5 "Noto Sans Myanmar", system-ui, sans-serif; }
  .cue-label small { display: block; font: 600 10px/1.25 system-ui, -apple-system, "Segoe UI", sans-serif; color: #8C6A28; }
  .cue-label small:empty { display: none; }
  .cue-label[hidden] { display: none; }
  .cue-glow { outline: 3px solid rgba(201,162,74,.95); outline-offset: 3px; animation: cueglow 1.4s ease-in-out infinite !important; }
  @keyframes cueglow { 50% { outline-color: rgba(201,162,74,.25); outline-offset: 6px; } }
  @keyframes cuebreath { 50% { transform-origin: center; opacity: .55; } }
  @keyframes cuewave { 0% { opacity: .8; transform: scale(.85); } 100% { opacity: 0; transform: scale(1.55); } }
  @keyframes cuehold { 0% { opacity: .9; transform: scale(1.5); } 85% { opacity: .9; transform: scale(.95); } 100% { opacity: 0; transform: scale(.95); } }
  @keyframes cuetap { 0%, 100% { transform: translate(10px, 12px); } 45% { transform: translate(0, 0) scale(.94); } 55% { transform: translate(0, 0) scale(.94); } }
  @keyframes cuepress { 0% { transform: translate(10px, 12px); } 20%, 85% { transform: translate(0, 0) scale(.92); } 100% { transform: translate(10px, 12px); } }
  @keyframes cuemarch { to { stroke-dashoffset: -22; } }
  @keyframes cuelabel { 50% { transform-origin: center; filter: brightness(1.04); } }
  @media (prefers-reduced-motion: reduce) { .cue-layer * { animation: none !important; } }
  `;
  document.head.appendChild(s);
}
