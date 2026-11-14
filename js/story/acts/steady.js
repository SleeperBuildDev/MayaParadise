// Handwork pattern "hold steady": one act, six modes (Days 4, 6, 7; reused 14, 15).
//
//   const r = await steady({ title, hint, mode | kind: 'kite'|'pour'|'bowl'|'cup'|'plank'|'stance',
//     seconds | length, rounds, sway, spillAt, anchor: 'flag'|'post', flagDrops, gusts, watchers, loosen,
//     seated, back, backLine, meet, clock, again, react, who })
//   r = { ok, score, slips, spills, stops, back, clench, reason }   (cancel: { ok: false, cancelled: true, ... })
//
// kite   ch 7  a tension bar with a gold band. Hold = pull the line in, lift = pay it out. Tight is falling:
//              gripping past the band makes the kite dive. anchor 'flag': the line runs to someone else's
//              reply flag; it sinks whatever the player does and at each flagDrops second the flag drops and
//              the kite comes down ({ ok: false, reason: 'flag' }, never retried). anchor 'post': her own
//              bamboo post; the small flag still drops and the kite doesn't care. ok at >= 70 % in the band.
// pour   ch 6  hold to tip the kettle, drag sideways to keep the stream in the cup (the hand drifts).
//              `watchers` faces pop up along the top; moving the finger up toward them ("looking") wobbles
//              the stream out: a slip. ok when the cup is full with <= 1 slip.
// bowl / cup / plank   ch 4 / 11 / 11  side view walk: hold to step, release to stop. The meter is the
//              water's surface (bowl, cup) or the deck (plank). Past spillAt: bowl spills (ok: false, once:
//              the caller loops), cup spills (react.spill, the walk restarts here), plank freezes on the
//              rope until the sway settles (never falls, stops++). gusts (cup): helping hands reach in;
//              stop and they are turned down gently. clock: the stage clock turns whatever you do.
//              back: an always-there "Turn back" button (backLine, back++). meet: { at, who } ends there.
// stance ch 8 / 11  no walking: a side view of the person over a strip of ground that never moves. Jeers
//              and bad news push the head down, praise and good news push it up; hold a thumb anywhere
//              and drag gently to stay level. Out of the band 0.6 s = a slip (react.bowed / tossed), the
//              same gusts start again. loosen: big fast drags are a clench (react.clench; two = a slip).
// gusts: [{ at, from, kind: 'jeer'|'praise'|'hand'|'talk', push, up?, maya?, text }] (`at` = seconds, or
//        a fraction of the walk when length > 0); for the kite plain numbers (seconds) also work.
//
// Test hook: window.__act.autoSteady(care = 1)   (care 1 plays it well; care < .5 grips / rushes / looks)
//
// Also exports the small paper-figure kit the other new acts share (hold, simmer, holdback, guide):
//   folk(g, x, feetY, h, look, pose) -> { hands, head }   lookOf(id)   nameOf(id)   paperStage(A, ratio)
//   sayBox(A)   bubble(g, ...)   rr(g, ...)   runLoop(step)   noise(t, seed)   MYF   OUT
import { openAct, bi, wait, buzz, clamp, lerp, ease, seededRandom } from './kit.js';
import { tr, lang } from '../../game/ui.js';
import { castById } from '../cast.js';

export const OUT = '#3B2A1A';
export const INK = '#2A2118';
export const MYF = '"Noto Sans Myanmar", "Myanmar Text", Padauk, system-ui, sans-serif';
export const SKINS = ['#F3CBAA', '#E8B48E', '#D9A077', '#C68A63', '#B47A55'];
const HAIRS = { black: '#1F1B1B', brown: '#3E2A20', grey: '#B9B3A8', white: '#E9E4DA' };
export const CLOTH = {
  white: '#F4EFE4', cream: '#E9DFC9', school: '#F7F4EC', schoolGreen: '#2F6B4F',
  maroon: '#7A2533', rose: '#D97C8A', mustard: '#D9A93B', padauk: '#EDB82E', sky: '#7FB0CF',
  navy: '#2E3D63', teal: '#2F7C7A', olive: '#7A7A3A', brown: '#7A5434', tan: '#C9A576',
  plum: '#6B3E64', coral: '#E0795A', grey: '#8E8A84', charcoal: '#3A3634', leaf: '#5E8F4E',
};

// people the cast list does not hold yet (all invented; Burmese names are drafts)
const EXTRA = {
  maya: { name: { my: 'မာရာ', en: 'Maya' }, look: { age: 'adult', skin: '#F3CBAA', hair: 'maya', top: 'blazer', topColor: '#D9C3A0', bottom: 'trousers', bottomColor: '#E8DCC6', extras: ['glasses'] } },
  maungarkar: { name: { my: 'မောင်အာကာ', en: 'Maung Arkar' }, look: { age: 'teen', build: 'slim', skin: 2, hair: 'spiky', top: 'tee', topColor: 'mustard', bottom: 'longyi', bottomColor: 'navy', extras: ['apron'] } },
  thiri: { name: { my: 'မသီရိ', en: 'Ma Thiri' }, look: { age: 'adult', build: 'slim', skin: 1, hair: 'long', top: 'blouse', topColor: 'sky', bottom: 'htamein', bottomColor: 'maroon', extras: ['thanaka'] } },
  kothiha: { name: { my: 'ကိုသီဟ', en: 'Ko Thiha' }, look: { age: 'adult', build: 'mid', skin: 3, hair: 'short', top: 'tee', topColor: 'cream', bottom: 'longyi', bottomColor: 'teal', extras: ['towel'], extraColor: 'coral' } },
  ubolay: { name: { my: 'ဦးဘိုလေး', en: 'U Bo Lay' }, look: { age: 'elder', build: 'wide', skin: 3, hair: 'bald', hairColor: 'grey', top: 'eingyi', topColor: 'white', bottom: 'longyi', bottomColor: 'brown' } },
  canecutter: { name: { my: 'ကြိမ်ခုတ်သမား', en: 'Cane-cutter' }, look: { age: 'adult', build: 'slim', skin: 4, hair: 'cap', top: 'tee', topColor: 'leaf', bottom: 'shorts', bottomColor: 'brown', extraColor: 'tan' } },
  porter: { name: { my: 'ထမ်းသမား', en: 'Porter' }, look: { age: 'adult', build: 'wide', skin: 4, hair: 'short', top: 'vest', topColor: 'white', bottom: 'longyi', bottomColor: 'olive', extras: ['towel'], extraColor: 'rose' } },
  porter2: { name: { my: 'ထမ်းသမား', en: 'Porter' }, look: { age: 'adult', build: 'mid', skin: 2, hair: 'side', top: 'shirt', topColor: 'sky', bottom: 'longyi', bottomColor: 'charcoal' } },
  child: { name: { my: 'ကလေး', en: 'Child' }, look: { age: 'child', build: 'slim', skin: 2, hair: 'bob', top: 'tee', topColor: 'rose', bottom: 'shorts', bottomColor: 'navy' } },
  kid1: { name: { my: 'ကလေး', en: 'Child' }, look: { age: 'child', skin: 3, hair: 'spiky', top: 'tee', topColor: 'padauk', bottom: 'shorts', bottomColor: 'teal' } },
  kid2: { name: { my: 'ကလေး', en: 'Child' }, look: { age: 'child', skin: 1, hair: 'braid', top: 'tee', topColor: 'leaf', bottom: 'htamein', bottomColor: 'plum', extras: ['thanaka'] } },
  dawpyone: { name: { my: 'ဒေါ်ပြုံး', en: 'Daw Pyone' }, look: { age: 'elder', skin: 2, hair: 'bun', hairColor: 'grey', top: 'blouse', topColor: 'plum', bottom: 'htamein', bottomColor: 'brown', extras: ['thanaka'] } },
  koyaung: { name: { my: 'ကိုယောင်', en: 'Ko Yaung' }, look: { age: 'adult', skin: 1, hair: 'side', top: 'shirt', topColor: 'olive', bottom: 'longyi', bottomColor: 'navy', extras: ['glasses'] } },
  drinker1: { name: { my: 'လက်ဖက်ရည်သောက်သူ', en: 'Tea drinker' }, look: { age: 'adult', skin: 3, hair: 'short', top: 'tee', topColor: 'grey', bottom: 'longyi', bottomColor: 'maroon' } },
  drinker2: { name: { my: 'လက်ဖက်ရည်သောက်သူ', en: 'Tea drinker' }, look: { age: 'elder', skin: 2, hair: 'cap', top: 'shirt', topColor: 'white', bottom: 'longyi', bottomColor: 'teal', extraColor: 'navy' } },
};

export function nameOf(id) {
  if (!id) return null;
  if (typeof id === 'object') return id.name || id;
  return EXTRA[id]?.name || castById(id)?.name || null;
}
export function lookOf(id) {
  if (id && typeof id === 'object') return id;
  const L = EXTRA[id]?.look || castById(id)?.look;
  if (L) return L;
  let h = 7;
  for (const c of String(id || 'x')) h = (h * 31 + c.charCodeAt(0)) % 9973;
  const r = seededRandom(h);
  const pick = (a) => a[Math.floor(r() * a.length)];
  return { age: 'adult', skin: Math.floor(r() * 5), hair: pick(['short', 'bun', 'side', 'bob']), top: pick(['shirt', 'blouse', 'tee']),
    topColor: pick(['sky', 'rose', 'mustard', 'leaf', 'cream']), bottom: 'longyi', bottomColor: pick(['navy', 'maroon', 'teal', 'brown']) };
}

// ------------------------------------------------------------------ small drawing kit
export function rr(g, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  g.beginPath();
  g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}
export function fillStroke(g, fill, lw = 1.6, stroke = OUT) {
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (lw) { g.lineWidth = lw; g.strokeStyle = stroke; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
}
export const noise = (t, s = 0) => Math.sin(t * 1.13 + s) * 0.5 + Math.sin(t * 2.71 + s * 1.7) * 0.3 + Math.sin(t * 5.3 + s * 2.3) * 0.2;
export function shade(hex, k) { // k < 0 darker, k > 0 lighter
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
  if (k < 0) { r *= 1 + k; gg *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; gg += (255 - gg) * k; b += (255 - b) * k; }
  return `rgb(${r | 0},${gg | 0},${b | 0})`;
}

export function paperStage(A, ratio = 0.9, cls = '') {
  injectSteadyStyle();
  const wrap = document.createElement('div');
  wrap.className = `sd-stage ${cls}`;
  const cv = document.createElement('canvas');
  wrap.append(cv);
  A.body.append(wrap);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.round(Math.min((A.body.clientWidth || 360) - 2, 400));
  const H = Math.round(W * ratio);
  cv.style.width = `${W}px`;
  cv.style.height = `${H}px`;
  cv.width = W * dpr;
  cv.height = H * dpr;
  const g = cv.getContext('2d');
  g.scale(dpr, dpr);
  const layer = (fn) => {
    const c = document.createElement('canvas');
    c.width = W * dpr; c.height = H * dpr;
    const x = c.getContext('2d');
    x.scale(dpr, dpr);
    fn(x);
    return c;
  };
  return { wrap, cv, g, W, H, dpr, layer, blit: (c) => g.drawImage(c, 0, 0, W, H) };
}

export function runLoop(step) {
  let raf = 0, last = 0, on = true;
  const f = (now) => {
    if (!on) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    step(dt);
    raf = requestAnimationFrame(f);
  };
  raf = requestAnimationFrame(f);
  return () => { on = false; cancelAnimationFrame(raf); };
}

// the line strip under a stage: who says it, Burmese first, small English
export function sayBox(A) {
  injectSteadyStyle();
  const el = document.createElement('div');
  el.className = 'sd-say';
  el.innerHTML = '<span class="sd-who"></span><p class="sd-line ak-bi"></p>';
  A.body.append(el);
  const whoEl = el.querySelector('.sd-who');
  const lineEl = el.querySelector('.sd-line');
  let token = 0;
  return {
    el,
    show(who, line, cls = '') {
      const nm = nameOf(who);
      whoEl.textContent = nm ? tr(nm) : '';
      whoEl.hidden = !nm;
      el.className = `sd-say on ${cls}${who === 'maya' && /^\(|^（/.test(tr(line) || '') ? ' thought' : ''}`;
      bi(lineEl, line);
      lineEl.classList.remove('ak-new'); void lineEl.offsetWidth; lineEl.classList.add('ak-new');
    },
    async say(who, line, ms) {
      if (!line) return true;
      const my = ++token;
      this.show(who, line);
      await wait(ms ?? readMs(line));
      return my === token;
    },
    clear() { token++; el.classList.remove('on'); bi(lineEl, ''); whoEl.textContent = ''; },
  };
}
export const readMs = (line) => clamp(1300 + (tr(line) || '').length * 42, 1800, 4400);

// a speech bubble drawn on the canvas, tail toward (tx, ty); returns its box
export function bubble(g, x, y, text, o = {}) {
  const { W = 400, size = 13, maxW = 150, tx = null, ty = null, alpha = 1, grey = 0, pencil = false, sub = '' } = o;
  g.save();
  g.globalAlpha = alpha;
  g.font = `600 ${size}px ${MYF}`;
  const words = String(text).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  const lh = size * 1.62;
  let bw = Math.max(...lines.map((l) => g.measureText(l).width)) + 18;
  const subLines = [];
  if (sub) {
    g.font = `500 ${size * 0.72}px system-ui, sans-serif`;
    let c2 = '';
    for (const w of String(sub).split(' ')) { const t2 = c2 ? `${c2} ${w}` : w; if (g.measureText(t2).width > Math.max(maxW, bw - 18) && c2) { subLines.push(c2); c2 = w; } else c2 = t2; }
    if (c2) subLines.push(c2);
    bw = Math.max(bw, Math.max(...subLines.map((l) => g.measureText(l).width)) + 18);
  }
  const bh = lines.length * lh + 8 + subLines.length * size * 0.9;
  let bx = clamp(x - bw / 2, 4, W - bw - 4), by = y - bh;
  const fillC = grey ? `rgba(238,232,220,${0.92})` : pencil ? '#FBF6EA' : '#FFFDF8';
  if (tx != null) {
    g.beginPath();
    const ax = clamp(tx, bx + 10, bx + bw - 10);
    const down = ty > by + bh;
    const baseY = down ? by + bh - 1 : by + 1;
    g.moveTo(ax - 6, baseY); g.lineTo(lerp(ax, tx, 0.7), lerp(baseY, ty, 0.7)); g.lineTo(ax + 6, baseY);
    g.fillStyle = fillC; g.fill();
    g.strokeStyle = grey ? 'rgba(120,108,92,.5)' : OUT; g.lineWidth = 1.4; g.stroke();
  }
  rr(g, bx, by, bw, bh, 10);
  g.fillStyle = fillC; g.fill();
  g.strokeStyle = grey ? 'rgba(120,108,92,.5)' : pencil ? '#6A6670' : OUT;
  g.lineWidth = 1.5;
  if (pencil) g.setLineDash([5, 3]);
  g.stroke();
  g.setLineDash([]);
  if (tx != null) { // hide the tail's join
    const ax = clamp(tx, bx + 10, bx + bw - 10);
    const down = ty > by + bh;
    g.fillStyle = fillC; g.fillRect(ax - 5, down ? by + bh - 2.4 : by + 0.6, 10, 2);
  }
  g.fillStyle = grey ? '#9A8F80' : pencil ? '#4A4850' : INK;
  g.font = `600 ${size}px ${MYF}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, bx + bw / 2, by + 5 + lh * (i + 0.5)));
  if (subLines.length) {
    g.font = `500 ${size * 0.72}px system-ui, sans-serif`;
    g.fillStyle = grey ? '#ADA394' : '#8C6A28';
    subLines.forEach((l, i) => g.fillText(l, bx + bw / 2, by + 4 + lines.length * lh + size * 0.9 * (i + 0.5)));
  }
  g.restore();
  return { x: bx, y: by, w: bw, h: bh };
}
export const otherLang = (o) => (o && typeof o === 'object' ? (lang() === 'en' ? o.my : o.en) || '' : '');

// ------------------------------------------------------------------ a paper person (cube head, toon outline)
// feet at (x, y); h = full height in px. pose: { face: -1..1, walk: phase|null, tilt: chin up (+) / bowed (-),
// arms: [aL, aR] (radians, 0 = hanging, + = toward +x), bend: [bL, bR], eyes: 'open'|'closed'|'up'|'down'|'side',
// look: -1..1, mouth: 0..1, frown, brow, seated, shrug, noArms, blush, alpha }
export function folk(g, x, y, h, L, o = {}) {
  L = lookOf(L);
  const sk = typeof L.skin === 'number' ? SKINS[L.skin] : (L.skin || SKINS[1]);
  const hairC = L.hair === 'maya' ? '#1F1B1B' : (HAIRS[L.hairColor] || L.hairColor || HAIRS.black);
  const topC = CLOTH[L.topColor] || L.topColor || (L.top === 'school' ? CLOTH.school : CLOTH.cream);
  const botC = CLOTH[L.bottomColor] || L.bottomColor || (/school/.test(L.bottom || '') ? CLOTH.schoolGreen : CLOTH.brown);
  const exC = CLOTH[L.extraColor] || L.extraColor || CLOTH.tan;
  const ex = L.extras || [];
  const wide = L.build === 'wide' ? 1.16 : L.build === 'slim' ? 0.9 : 1;
  const child = L.age === 'child';
  const hs = h * (child ? 0.41 : 0.36);
  const bodyH = h * (child ? 0.27 : 0.3);
  const legH = h - hs - bodyH;
  const lw = Math.max(1.1, h * 0.012);
  const dir = o.face ?? 0;
  const ph = o.walk ?? null;
  const bob = ph == null ? 0 : -Math.abs(Math.sin(ph)) * h * 0.022;
  const seated = !!o.seated;
  const yHip = seated ? y : y - legH + bob;
  const yNeck = yHip - bodyH;
  const bw = hs * 0.74 * wide;
  const shrug = (o.shrug || 0) * h * 0.035;
  g.save();
  if (o.alpha != null) g.globalAlpha = o.alpha;
  g.lineJoin = 'round'; g.lineCap = 'round';

  // long hair falls behind everything
  const tilt = o.tilt || 0;
  const hx = x + dir * hs * 0.05, hy = yNeck - shrug * 0.6 - hs * 0.47 + (tilt < 0 ? -tilt * hs * 0.1 : 0);
  if (L.hair === 'long' || L.hair === 'maya') {
    rr(g, hx - hs * 0.56, hy - hs * 0.44, hs * 1.12, hs * (L.hair === 'maya' ? 1.12 : 1.42), hs * 0.2);
    fillStroke(g, hairC, lw);
  }
  if (L.hair === 'braid') {
    const bx = hx - dir * hs * 0.45 - (dir === 0 ? hs * 0.42 : 0);
    for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(bx, hy + hs * (0.25 + i * 0.2), hs * 0.1, hs * 0.12, 0, 0, 7); fillStroke(g, hairC, lw); }
    g.beginPath(); g.ellipse(bx, hy + hs * 1.08, hs * 0.06, hs * 0.05, 0, 0, 7); fillStroke(g, CLOTH[L.extraColor] || '#D97C8A', lw * 0.8);
  }

  // legs
  const skirt = /longyi|htamein|schoolLongyi/.test(L.bottom || 'longyi');
  const shortSkirt = L.bottom === 'schoolSkirt';
  const legW = bw * 0.32;
  if (seated) {
    const fwd = dir >= 0 ? 1 : -1;
    const kx = x + fwd * legH * 0.55, ky = yHip + legH * 0.05;
    if (skirt || shortSkirt) {
      g.beginPath(); g.moveTo(x - bw * 0.48, yHip - bodyH * 0.1); g.lineTo(kx + fwd * legW * 0.6, ky - legW * 0.7); g.lineTo(kx + fwd * legW * 0.6, ky + legH * 0.5);
      g.lineTo(kx - fwd * legW * 0.9, ky + legH * 0.5); g.lineTo(kx - fwd * legW * 0.9, ky + legW * 0.6); g.lineTo(x + bw * 0.48 * -fwd, yHip + legW * 0.5); g.closePath();
      fillStroke(g, botC, lw);
      g.strokeStyle = shade(botC, -0.25); g.lineWidth = lw * 0.8;
      g.beginPath(); g.moveTo(kx, ky); g.lineTo(kx - fwd * legW * 0.2, ky + legH * 0.45); g.stroke();
    } else {
      rr(g, Math.min(x, kx) - legW * 0.3, yHip - legW * 0.6, Math.abs(kx - x) + legW * 0.8, legW * 1.3, legW * 0.4); fillStroke(g, botC, lw);
      rr(g, kx - legW * 0.5, ky - legW * 0.2, legW, legH * 0.55, legW * 0.3); fillStroke(g, L.bottom === 'shorts' ? sk : botC, lw);
    }
    rr(g, kx - legW * 0.6 + fwd * legW * 0.2, ky + legH * 0.48, legW * 1.3, legW * 0.5, legW * 0.25); fillStroke(g, '#5A3A26', lw);
  } else if (skirt || shortSkirt) {
    const sw = ph == null ? 0 : Math.sin(ph);
    const hemY = shortSkirt ? yHip + legH * 0.55 : y - legH * 0.08;
    // feet peek out under the hem
    for (const s of [-1, 1]) {
      const fx = x + s * legW * 0.55 + (ph == null ? 0 : s * sw * legW * 1.1);
      if (shortSkirt) { rr(g, fx - legW * 0.32, hemY - 2, legW * 0.64, y - hemY, legW * 0.25); fillStroke(g, sk, lw); }
      rr(g, fx - legW * 0.55 + dir * legW * 0.2, y - legW * 0.42 + (ph == null ? 0 : Math.max(0, s * sw) * -legW * 0.3), legW * 1.1, legW * 0.45, legW * 0.2);
      fillStroke(g, '#5A3A26', lw);
    }
    g.beginPath();
    const flare = shortSkirt ? 0.62 : 0.56;
    g.moveTo(x - bw * 0.46, yHip - 2); g.lineTo(x + bw * 0.46, yHip - 2);
    g.lineTo(x + bw * flare + (ph == null ? 0 : sw * bw * 0.06), hemY); g.lineTo(x - bw * flare + (ph == null ? 0 : sw * bw * 0.06), hemY); g.closePath();
    fillStroke(g, botC, lw);
    g.strokeStyle = shade(botC, -0.22); g.lineWidth = lw * 0.9;
    g.beginPath(); g.moveTo(x + bw * 0.12, yHip + 2); g.lineTo(x + bw * 0.2 + (ph == null ? 0 : sw * bw * 0.05), hemY - 2); g.stroke();
    if (L.bottom === 'htamein') { g.strokeStyle = shade(botC, 0.35); g.beginPath(); g.moveTo(x - bw * flare + 2, hemY - legH * 0.12); g.lineTo(x + bw * flare - 2, hemY - legH * 0.12); g.stroke(); }
    if (/longyi/.test(L.bottom || 'longyi')) { g.beginPath(); g.ellipse(x + bw * 0.05, yHip + legH * 0.08, bw * 0.12, legH * 0.07, 0, 0, 7); fillStroke(g, shade(botC, -0.08), lw * 0.8); }
  } else {
    for (const s of [-1, 1]) {
      const a = ph == null ? 0 : s * Math.sin(ph) * 0.42;
      g.save(); g.translate(x + s * legW * 0.55, yHip); g.rotate(-a);
      rr(g, -legW / 2, -2, legW, legH * (L.bottom === 'shorts' ? 0.5 : 0.92), legW * 0.3); fillStroke(g, botC, lw);
      if (L.bottom === 'shorts') { rr(g, -legW * 0.38, legH * 0.46, legW * 0.76, legH * 0.46, legW * 0.25); fillStroke(g, sk, lw); }
      rr(g, -legW * 0.55 + dir * legW * 0.25, legH * 0.9, legW * 1.1, legH * 0.12, legW * 0.2); fillStroke(g, '#5A3A26', lw);
      g.restore();
    }
  }

  // body
  const topY = yNeck - shrug;
  rr(g, x - bw / 2, topY, bw, bodyH + 3 + shrug, bw * 0.22);
  const bodyFill = L.top === 'vest' ? topC : topC;
  fillStroke(g, bodyFill, lw);
  g.save(); rr(g, x - bw / 2, topY, bw, bodyH + 3 + shrug, bw * 0.22); g.clip();
  g.fillStyle = 'rgba(60,35,15,.12)'; g.fillRect(x + bw * 0.22, topY, bw, bodyH + 4);
  if (L.top === 'blazer') {
    g.fillStyle = '#25211F'; g.beginPath(); g.moveTo(x - bw * 0.16, topY); g.lineTo(x + bw * 0.16, topY); g.lineTo(x, topY + bodyH * 0.6); g.fill();
    g.strokeStyle = shade(topC, -0.3); g.lineWidth = lw; g.beginPath(); g.moveTo(x - bw * 0.16, topY); g.lineTo(x - bw * 0.05, topY + bodyH * 0.62); g.moveTo(x + bw * 0.16, topY); g.lineTo(x + bw * 0.05, topY + bodyH * 0.62); g.stroke();
    g.fillStyle = '#C9A24A'; g.beginPath(); g.arc(x + bw * 0.02, topY + bodyH * 0.74, lw * 1.2, 0, 7); g.fill();
  } else if (L.top === 'school' || L.top === 'shirt') {
    g.fillStyle = shade(topC, 0.4); g.beginPath(); g.moveTo(x - bw * 0.22, topY); g.lineTo(x, topY + bodyH * 0.22); g.lineTo(x + bw * 0.22, topY); g.fill();
    g.strokeStyle = shade(topC, -0.25); g.lineWidth = lw * 0.8; g.stroke();
    g.fillStyle = shade(topC, -0.35); for (let i = 1; i < 4; i++) { g.beginPath(); g.arc(x, topY + bodyH * (0.2 + i * 0.2), lw * 0.7, 0, 7); g.fill(); }
  } else if (L.top === 'eingyi') {
    g.strokeStyle = shade(topC, -0.3); g.lineWidth = lw * 0.9; g.beginPath(); g.moveTo(x - bw * 0.1, topY); g.lineTo(x + bw * 0.12, topY + bodyH); g.stroke();
    g.fillStyle = '#C9A24A'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x - bw * 0.06 + i * bw * 0.06, topY + bodyH * (0.2 + i * 0.25), lw * 0.8, 0, 7); g.fill(); }
  } else {
    g.fillStyle = shade(sk, -0.05); g.beginPath(); g.ellipse(x, topY, bw * 0.2, bodyH * 0.12, 0, 0, Math.PI); g.fill();
    if (L.top === 'blouse') { g.strokeStyle = shade(topC, -0.25); g.lineWidth = lw * 0.8; g.beginPath(); g.moveTo(x - bw * 0.5, topY + bodyH * 0.55); g.quadraticCurveTo(x, topY + bodyH * 0.68, x + bw * 0.5, topY + bodyH * 0.55); g.stroke(); }
  }
  if (ex.includes('apron')) {
    g.fillStyle = '#F4EFE4'; rr(g, x - bw * 0.36, topY + bodyH * 0.28, bw * 0.72, bodyH * 0.8, 3); g.fill();
    g.strokeStyle = 'rgba(90,60,30,.35)'; g.lineWidth = lw * 0.8; g.stroke();
    g.strokeRect(x - bw * 0.16, topY + bodyH * 0.62, bw * 0.32, bodyH * 0.2);
  }
  if (ex.includes('satchel')) { g.strokeStyle = exC; g.lineWidth = lw * 2.2; g.beginPath(); g.moveTo(x - bw * 0.4, topY + 1); g.lineTo(x + bw * 0.5, topY + bodyH * 0.9); g.stroke(); }
  g.restore();
  if (ex.includes('apron') && !skirt) { g.fillStyle = '#F4EFE4'; rr(g, x - bw * 0.36, yHip, bw * 0.72, legH * 0.42, 3); fillStroke(g, '#F4EFE4', lw * 0.8, 'rgba(90,60,30,.4)'); }
  if (ex.includes('towel')) {
    const s = dir > 0 ? -1 : 1;
    rr(g, x + s * bw * 0.5 - bw * 0.16, topY - 2, bw * 0.3, bodyH * 0.62, 3); fillStroke(g, exC, lw);
    g.strokeStyle = shade(exC, 0.4); g.lineWidth = lw * 0.9; g.beginPath(); g.moveTo(x + s * bw * 0.5 - bw * 0.14, topY + bodyH * 0.38); g.lineTo(x + s * bw * 0.5 + bw * 0.12, topY + bodyH * 0.38); g.stroke();
  }
  if (ex.includes('satchel')) { rr(g, x + bw * 0.3, topY + bodyH * 0.75, bw * 0.42, bodyH * 0.38, 3); fillStroke(g, exC, lw); }

  // arms
  const hands = [];
  const armLen = h * (child ? 0.27 : 0.29);
  const sleeve = L.top === 'vest' ? sk : topC;
  const arms = o.arms || [ph == null ? 0.08 : Math.sin(ph) * 0.35 + 0.05, ph == null ? -0.08 : -Math.sin(ph) * 0.35 - 0.05];
  const bend = o.bend || [0, 0];
  if (!o.noArms) {
    [-1, 1].forEach((s, i) => {
      const sx = x + s * bw * 0.5, sy = topY + bodyH * 0.14;
      const a = arms[i], b = bend[i];
      const ex1 = sx + Math.sin(a) * armLen * 0.5, ey1 = sy + Math.cos(a) * armLen * 0.5;
      const ex2 = ex1 + Math.sin(a + b) * armLen * 0.5, ey2 = ey1 + Math.cos(a + b) * armLen * 0.5;
      const aw = Math.max(3, bw * 0.24);
      g.lineCap = 'round';
      g.strokeStyle = OUT; g.lineWidth = aw + lw * 2;
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex1, ey1); g.lineTo(ex2, ey2); g.stroke();
      g.strokeStyle = sleeve; g.lineWidth = aw;
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex1, ey1); g.stroke();
      g.strokeStyle = L.top === 'vest' || L.top === 'tee' ? sk : sleeve; g.lineWidth = aw;
      g.beginPath(); g.moveTo(ex1, ey1); g.lineTo(ex2, ey2); g.stroke();
      g.beginPath(); g.arc(ex2, ey2, aw * 0.62, 0, 7); fillStroke(g, sk, lw);
      hands.push([ex2, ey2]);
    });
  }

  // head
  g.save();
  g.translate(hx, yNeck - shrug * 0.6);
  g.rotate(-tilt * 0.42 * (dir === 0 ? 1 : dir));
  g.translate(-hx, -(yNeck - shrug * 0.6));
  const top = hy - hs * 0.47;
  const left = hx - hs * 0.5;
  // ears
  g.beginPath(); g.ellipse(left + 1, hy + hs * 0.04, hs * 0.07, hs * 0.1, 0, 0, 7); fillStroke(g, sk, lw);
  g.beginPath(); g.ellipse(left + hs - 1, hy + hs * 0.04, hs * 0.07, hs * 0.1, 0, 0, 7); fillStroke(g, sk, lw);
  if (L.hair === 'bob') { rr(g, left - hs * 0.06, top - hs * 0.04, hs * 1.12, hs * 0.86, hs * 0.22); fillStroke(g, hairC, lw); }
  rr(g, left, top, hs, hs * 0.94, hs * 0.2);
  fillStroke(g, sk, lw);
  g.save(); rr(g, left, top, hs, hs * 0.94, hs * 0.2); g.clip();
  g.fillStyle = 'rgba(90,50,20,.10)'; g.fillRect(left + hs * 0.72, top, hs * 0.4, hs);
  g.restore();
  // face
  const fy = -tilt * hs * 0.13;
  const fx = dir * hs * 0.1 + (o.look || 0) * hs * 0.04;
  const eyeY = top + hs * 0.55 + fy, eyeDX = hs * 0.19;
  if (ex.includes('thanaka')) {
    g.fillStyle = 'rgba(241,223,166,.92)';
    for (const s of [-1, 1]) { rr(g, hx + fx + s * eyeDX - hs * 0.1, eyeY + hs * 0.1, hs * 0.2, hs * 0.13, hs * 0.06); g.fill(); }
  }
  if (o.blush !== false) {
    g.fillStyle = `rgba(242,140,120,${o.blush ? 0.55 : 0.28})`;
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(hx + fx + s * eyeDX * 1.25, eyeY + hs * 0.17, hs * 0.08, hs * 0.045, 0, 0, 7); g.fill(); }
  }
  const eyes = o.eyes || 'open';
  const pupY = eyes === 'up' ? -hs * 0.035 : eyes === 'down' ? hs * 0.03 : 0;
  const pupX = eyes === 'side' ? dir * hs * 0.03 : 0;
  for (const s of [-1, 1]) {
    const ex0 = hx + fx + s * eyeDX;
    if (eyes === 'closed') {
      g.strokeStyle = INK; g.lineWidth = Math.max(1.2, hs * 0.035);
      g.beginPath(); g.arc(ex0, eyeY - hs * 0.01, hs * 0.05, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    } else {
      g.fillStyle = INK; g.beginPath(); g.ellipse(ex0 + pupX, eyeY + pupY, hs * 0.048, hs * 0.07, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ex0 + pupX + hs * 0.015, eyeY + pupY - hs * 0.025, hs * 0.017, 0, 7); g.fill();
    }
    if (o.brow) {
      g.strokeStyle = shade(hairC === HAIRS.white ? '#8E8A84' : hairC, 0.05); g.lineWidth = Math.max(1.2, hs * 0.035);
      g.beginPath(); g.moveTo(ex0 - hs * 0.06, eyeY - hs * 0.12 + s * o.brow * hs * 0.04); g.lineTo(ex0 + hs * 0.06, eyeY - hs * 0.12 - s * o.brow * hs * 0.04); g.stroke();
    }
  }
  if (ex.includes('glasses')) {
    g.strokeStyle = '#7A5434'; g.lineWidth = Math.max(1, hs * 0.03);
    for (const s of [-1, 1]) { g.beginPath(); g.arc(hx + fx + s * eyeDX, eyeY, hs * 0.1, 0, 7); g.stroke(); }
    g.beginPath(); g.moveTo(hx + fx - eyeDX + hs * 0.1, eyeY); g.lineTo(hx + fx + eyeDX - hs * 0.1, eyeY); g.stroke();
  }
  const my = eyeY + hs * 0.22;
  const mo = o.mouth || 0;
  g.strokeStyle = '#7A3A2A'; g.lineWidth = Math.max(1.1, hs * 0.03);
  if (mo > 0.15) { g.fillStyle = '#7A3A2A'; g.beginPath(); g.ellipse(hx + fx, my, hs * 0.06, hs * 0.04 * (0.6 + mo), 0, 0, 7); g.fill(); }
  else if (o.frown) { g.beginPath(); g.arc(hx + fx, my + hs * 0.05, hs * 0.06, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); }
  else { g.beginPath(); g.arc(hx + fx, my - hs * 0.03, hs * 0.06, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); }
  // hair on top
  const capH = hs * (L.hair === 'bald' ? 0 : L.hair === 'short' || L.hair === 'spiky' ? 0.27 : 0.3);
  if (L.hair === 'cap') {
    g.beginPath(); g.moveTo(left - 1, top + hs * 0.3); g.quadraticCurveTo(hx, top - hs * 0.22, left + hs + 1, top + hs * 0.3); g.closePath(); fillStroke(g, exC, lw);
    rr(g, hx + (dir >= 0 ? 0 : -hs * 0.7), top + hs * 0.24, hs * 0.7, hs * 0.1, hs * 0.04); fillStroke(g, shade(exC, -0.2), lw);
  } else if (L.hair === 'bald') {
    g.fillStyle = hairC; for (const s of [-1, 1]) { rr(g, hx + s * hs * 0.5 - hs * 0.06 - (s > 0 ? hs * 0.02 : 0), top + hs * 0.3, hs * 0.1, hs * 0.22, hs * 0.04); fillStroke(g, hairC, lw * 0.8); }
    g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(hx - hs * 0.15, top + hs * 0.1, hs * 0.14, hs * 0.05, -0.2, 0, 7); g.fill();
  } else {
    g.beginPath();
    g.moveTo(left - hs * 0.03, top + capH + hs * 0.06);
    g.lineTo(left - hs * 0.03, top + hs * 0.12);
    g.quadraticCurveTo(left - hs * 0.02, top - hs * 0.05, left + hs * 0.2, top - hs * 0.05);
    if (L.hair === 'spiky') { for (let i = 0; i < 5; i++) { g.lineTo(left + hs * (0.28 + i * 0.15), top - hs * 0.14); g.lineTo(left + hs * (0.35 + i * 0.15), top - hs * 0.03); } }
    g.lineTo(left + hs * 0.8, top - hs * 0.05);
    g.quadraticCurveTo(left + hs * 1.02, top - hs * 0.05, left + hs * 1.03, top + hs * 0.12);
    g.lineTo(left + hs * 1.03, top + capH + hs * 0.06);
    if (L.hair === 'side') { g.lineTo(left + hs * 0.55, top + capH * 0.7); g.lineTo(left + hs * 0.2, top + capH + hs * 0.02); }
    else if (L.hair === 'maya' || L.hair === 'long' || L.hair === 'bob') { g.quadraticCurveTo(left + hs * 0.75, top + capH * 0.5, left + hs * 0.5, top + capH + hs * 0.06); g.quadraticCurveTo(left + hs * 0.25, top + capH * 0.6, left - hs * 0.03, top + capH + hs * 0.06); }
    g.closePath();
    fillStroke(g, hairC, lw);
    g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.ellipse(hx - hs * 0.12, top + hs * 0.06, hs * 0.2, hs * 0.045, -0.15, 0, 7); g.fill();
    if (L.hair === 'bun') { g.beginPath(); g.arc(hx - dir * hs * 0.2, top - hs * 0.1, hs * 0.17, 0, 7); fillStroke(g, hairC, lw); if (ex.includes('flower')) { g.beginPath(); g.arc(hx - dir * hs * 0.2 + hs * 0.15, top - hs * 0.08, hs * 0.07, 0, 7); fillStroke(g, '#F2C04E', lw * 0.7); } }
  }
  if (ex.includes('gaungbaung')) { rr(g, left - 2, top + hs * 0.02, hs + 4, hs * 0.2, hs * 0.08); fillStroke(g, exC, lw); g.beginPath(); g.ellipse(left + hs + 2, top + hs * 0.1, hs * 0.1, hs * 0.07, 0.4, 0, 7); fillStroke(g, exC, lw); }
  if (ex.includes('flower') && L.hair !== 'bun') { g.beginPath(); g.arc(left + hs * 0.9, top + hs * 0.1, hs * 0.07, 0, 7); fillStroke(g, '#F2C04E', lw * 0.7); }
  g.restore();
  g.restore();
  return { hands, head: [hx, hy, hs], neck: [x, topY] };
}

// a little four-point gold sparkle (Maya's motif)
export function sparkle(g, x, y, r, a = 1, col = '#E8C25A') {
  g.save(); g.globalAlpha *= a; g.fillStyle = col;
  g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill();
  g.restore();
}

// blocky cloud puff
function cloud(g, x, y, s, col = '#FFF8EE') {
  g.fillStyle = 'rgba(214,190,150,.35)';
  rr(g, x - s * 1.1, y + s * 0.15, s * 2.4, s * 0.5, s * 0.25); g.fill();
  g.fillStyle = col;
  rr(g, x - s * 1.2, y, s * 2.4, s * 0.55, s * 0.27); g.fill();
  rr(g, x - s * 0.7, y - s * 0.38, s * 1.1, s * 0.6, s * 0.28); g.fill();
  rr(g, x + s * 0.05, y - s * 0.22, s * 0.8, s * 0.45, s * 0.22); g.fill();
}

// ------------------------------------------------------------------ the act
const T = {
  tight: { my: 'တင်း', en: 'tight' }, slack: { my: 'လျော့', en: 'slack' },
  dive: { my: 'တင်းလွန်းတယ် — စွန် ထိုးကျနေပြီ', en: 'Too tight: the kite is diving' },
  sag: { my: 'လျော့လွန်းတယ် — စွန် နိမ့်ကျလာပြီ', en: 'Too slack: the kite is sinking' },
  flagDown: { my: 'အလံ ကျသွားပြီ… စွန်လည်း လိုက်ကျတယ်', en: 'The flag dropped… and the kite with it' },
  looked: { my: 'မော့ကြည့်မိတယ် — ရေစီး လွဲသွားပြီ', en: 'Looked up: the stream went wide' },
  missCup: { my: 'ခွက်ထဲ မကျဘူး — ဘေးနည်းနည်း ရွှေ့ပါ', en: 'Missing the cup: move it a little sideways' },
  full: { my: 'ခွက် ပြည့်ပြီ', en: 'The cup is full' },
  settle: { my: 'ရပ်ပြီး ငြိမ်အောင် စောင့်', en: 'Stop, and wait for it to settle' },
  freeze: { my: 'လွှဲလွန်းလို့ ကြိုးကို ဆုပ်ထားရတယ်… ငြိမ်အောင် စောင့်', en: 'Swaying too much: she grips the rope… wait till it settles' },
  spilled: { my: 'ဖိတ်သွားပြီ', en: 'Spilled' },
  declined: { my: 'ရပ်ပြီး ယဉ်ယဉ်လေး ငြင်းလိုက်တယ်', en: 'Stopped, and kindly said no' },
  again: { my: 'ပြန်စမယ်', en: 'Again' },
  clench: { my: 'တင်းနေတယ် — ဖွဖွလေး', en: 'Bracing: gently' },
};

export function steady(o = {}) {
  const mode = o.mode || o.kind || 'kite';
  const {
    title = '', hint = '', rounds = 1, sway = 0.2, anchor = 'post', flagDrops = [], gusts = [], watchers = 0, loosen = false,
    seated = false, back = null, backLine = null, meet = null, clock = false, again = null, react = {}, who = null,
  } = o;
  const seconds = o.seconds ?? (mode === 'pour' ? 8 : 12);
  const length = o.length ?? (mode === 'plank' ? 10 : 8);
  const spillAt = o.spillAt ?? (mode === 'plank' ? 1 : 0.7);
  return new Promise((resolve) => {
    const stats = { slips: 0, spills: 0, stops: 0, back: 0, clench: 0, score: 0, tries: 1 };
    let stop = () => {};
    const A = openAct({ title, hint, kind: 'steady', resolve: (r) => { stop(); resolve(r); }, onCancel: () => ({ ...stats }) });
    // taller than wide (about 4:5 at phone width) so the card fills a 915 px phone instead of floating
    const ratio = { kite: 1.14, pour: 1.1, bowl: 1.1, cup: 1.1, plank: 1.1, stance: 1.1 }[mode] || 1.08;
    const S = paperStage(A, ratio, `sd-${mode}`);
    const { g, W, H } = S;
    const say = sayBox(A);
    const P = { down: false, x: 0, y: 0, x0: 0, y0: 0, px: 0, py: 0, speed: 0, dx: 0 };
    let auto = null; // test policy: (state) => { hold, dx?, dy? }
    let finished = false;
    let t = 0;

    const local = (e) => { const r = S.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    S.cv.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      S.cv.setPointerCapture?.(e.pointerId);
      const [x, y] = local(e);
      Object.assign(P, { down: true, x, y, x0: x, y0: y, px: x, py: y, speed: 0, dx: 0 });
      M.down?.(x, y);
    });
    S.cv.addEventListener('pointermove', (e) => {
      if (!P.down) return;
      const [x, y] = local(e);
      P.dx += x - P.x;
      P.x = x; P.y = y;
    });
    const up = () => { if (!P.down) return; P.down = false; M.up?.(); };
    S.cv.addEventListener('pointerup', up);
    S.cv.addEventListener('pointercancel', up);
    // Space works as the finger (hold / release)
    A.onKey = (e) => { if (e.key === ' ' && !e.repeat && !P.down) { Object.assign(P, { down: true, x0: P.x, y0: P.y }); M.down?.(P.x, P.y); } };
    const keyUp = (e) => { if (e.key === ' ') up(); };
    window.addEventListener('keyup', keyUp);
    const stopLoop = () => window.removeEventListener('keyup', keyUp);

    async function finish(ok, extra = {}) {
      if (finished) return;
      finished = true;
      P.down = false;
      await wait(500);
      if (ok) await A.seal(true);
      else await wait(600);
      A.done({ ok, ...stats, score: +stats.score.toFixed(3), ...extra });
    }

    // ---- mode builders return { step(dt), draw(), down?, up?, policy(care) }
    const M = ({ kite: kiteMode, pour: pourMode, bowl: walkMode, cup: walkMode, plank: walkMode, stance: stanceMode }[mode] || kiteMode)();

    const stopRaf = runLoop((dt) => {
      t += dt;
      // pointer speed (for clench), measured per frame
      const sp = Math.hypot(P.x - P.px, P.y - P.py) / Math.max(dt, 0.001);
      P.speed = lerp(P.speed, P.down ? sp : 0, 0.35);
      P.px = P.x; P.py = P.y;
      if (auto && !finished) auto(dt);
      M.step(dt);
      M.draw();
      P.dx = 0;
    });

    stop = () => { stopRaf(); stopLoop(); };
    A.wrap.autoSteady = (care = 1) => { auto = M.policy(care); };
    window.__act = A.wrap;

    // ================================================================ kite
    function kiteMode() {
      const band = { c: 0.56, h: 0.13 };
      const gl = gusts.map((q) => (typeof q === 'number' ? { at: q, push: 0.35 } : q)).sort((a, b) => a.at - b.at);
      const K = { T: 0.34, k: 0.55, rot: 0, rv: 0, t: 0, inBand: 0, flagY: 1, gi: 0, swirl: [], fall: false, ended: false, round: 1, tail: [], crash: 0, msgT: 0, lastMsg: '' };
      const flagMode = anchor === 'flag';
      const postX = W * 0.17, postY = H * 0.86;
      const pulley = [W * 0.12, H * 0.5];
      const bg = S.layer((x) => kiteBackground(x, W, H, flagMode));
      const reset = () => Object.assign(K, { T: 0.34, k: 0.55, rot: 0, rv: 0, t: 0, inBand: 0, flagY: 1, gi: 0, fall: false, ended: false, crash: 0 });
      async function endRound() {
        K.ended = true;
        stats.score = Math.min(1, K.inBand / Math.max(1, seconds));
        const ok = stats.score >= 0.7;
        if (ok && K.round < rounds) { K.round++; A.setHint({ my: `အကြိမ် ${K.round}`, en: `Round ${K.round}` }); await wait(700); reset(); return; }
        if (ok) return finish(true);
        if (again) { stats.tries++; await say.say(who || (anchor === 'post' ? 'thiri' : null), again); say.clear(); reset(); A.setHint(hint); return; }
        finish(false);
      }
      return {
        step(dt) {
          K.t += dt;
          const holding = P.down;
          if (!K.ended) {
            K.T += (holding ? 0.46 : -0.36) * dt + noise(K.t * 0.9, 3) * 0.05 * dt;
            while (K.gi < gl.length && K.t >= gl[K.gi].at) {
              const q = gl[K.gi++];
              K.T += (q.push ?? 0.35) * (q.up === false ? -0.5 : 0.5);
              for (let i = 0; i < 4; i++) K.swirl.push({ x: -20 - i * 30, y: H * (0.2 + Math.random() * 0.4), life: 1.6 });
              buzz(12);
            }
            K.T = clamp(K.T, 0, 1);
            const lo = band.c - band.h, hi = band.c + band.h;
            const inB = K.T >= lo && K.T <= hi;
            const dropped = flagDrops.some((d) => K.t >= d);
            K.flagY = lerp(K.flagY, dropped ? 0 : 1, Math.min(1, dt * 2.2));
            let rate;
            if (flagMode) {
              if (dropped) { K.fall = true; rate = -0.42; }
              else rate = inB ? -0.035 : K.T > hi ? -(0.2 + (K.T - hi) * 1.6) : -0.065;
            } else {
              rate = inB ? 0.26 * (0.93 - K.k) : K.T > hi ? -(0.24 + (K.T - hi) * 1.7) : -0.1;
              if (inB) K.inBand += dt;
            }
            K.k = clamp(K.k + rate * dt, 0, 1);
            const msg = K.fall ? 'flag' : !inB ? (K.T > hi ? 'dive' : 'sag') : '';
            if (msg !== K.lastMsg) { K.msgT += dt; if (K.msgT > 0.35) { K.lastMsg = msg; K.msgT = 0; A.setHint(msg === 'flag' ? T.flagDown : msg === 'dive' ? T.dive : msg === 'sag' ? T.sag : hint, msg ? 'warn' : ''); } } else K.msgT = 0;
            if (flagMode && K.k <= 0.001) { stats.score = 0; K.ended = true; buzz(30); finish(false, { reason: 'flag' }); }
            if (!flagMode && K.k <= 0.02) { stats.slips++; K.k = 0.3; K.T = 0.4; buzz(30); }
            if (!flagMode && K.t >= seconds) endRound();
          }
          // the kite's own motion: dives spin, slack swings lazily, in band it sits up and shivers
          const dive = K.T > band.c + band.h || K.fall;
          const want = dive ? (K.fall ? 2.4 : 1.4) * Math.sin(K.t * 3) + (K.fall ? 1.2 : 0) : (K.T < band.c - band.h ? Math.sin(K.t * 1.2) * 0.5 : Math.sin(K.t * 2.2) * 0.12);
          K.rv += (want - K.rot) * 8 * dt; K.rv *= Math.exp(-3.2 * dt); K.rot += K.rv * dt;
          K.swirl.forEach((s) => { s.x += 260 * dt; s.life -= dt; });
          K.swirl = K.swirl.filter((s) => s.life > 0);
        },
        draw() {
          S.blit(bg);
          const kx = W * (0.53 + 0.07 * Math.sin(K.t * 0.55)) + (K.T > band.c + band.h ? Math.sin(K.t * 3.3) * 30 : 0);
          const ky = lerp(H * 0.84, H * 0.1, K.k);
          // gust swirls
          g.strokeStyle = 'rgba(255,253,248,.85)'; g.lineWidth = 2;
          for (const s of K.swirl) { g.globalAlpha = Math.min(1, s.life); g.beginPath(); g.moveTo(s.x, s.y); g.bezierCurveTo(s.x + 30, s.y - 10, s.x + 50, s.y + 10, s.x + 70, s.y - 4); g.stroke(); g.beginPath(); g.arc(s.x + 76, s.y - 10, 6, 0.5, 4.2); g.stroke(); }
          g.globalAlpha = 1;
          // the flag on its pulley (flag mode: big, and the line runs to it; post mode: small, to the side)
          const fx = flagMode ? pulley[0] : W * 0.07, fTop = flagMode ? H * 0.42 : H * 0.6, fBot = flagMode ? H * 0.74 : H * 0.76;
          const fy = lerp(fBot, fTop, K.flagY);
          const fs = flagMode ? 1 : 0.6;
          g.strokeStyle = '#6E5A3A'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(fx + 2, fTop - 8 * fs); g.lineTo(fx + 2, fBot + 10); g.stroke();
          g.beginPath(); g.arc(fx + 2, fTop - 10 * fs, 5 * fs, 0, 7); fillStroke(g, '#B8B0A0', 1.2);
          g.beginPath(); g.moveTo(fx + 3, fy); g.lineTo(fx + 3 + 30 * fs, fy + 9 * fs); g.lineTo(fx + 3, fy + 18 * fs); g.closePath(); fillStroke(g, '#B5402F', 1.4);
          g.fillStyle = '#FFFDF8'; g.font = `700 ${9 * fs}px ${MYF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('၁၄', fx + 12 * fs, fy + 9.5 * fs);
          // the line: slack sags, tight runs straight. It is tied at the flag (or her post) and runs through her hands
          const ax = flagMode ? fx + 3 : postX + 2, ay = flagMode ? fy + 2 : postY - H * 0.16;
          const sag = (1 - K.T) * 70 + (K.fall ? 50 : 0);
          if (!flagMode) { // her bamboo post, string marks where the kite was tied before
            for (let i = 0; i < 6; i++) { rr(g, postX - 4, postY - i * H * 0.04 - H * 0.04, 8, H * 0.04, 2); fillStroke(g, i % 2 ? '#C9A85A' : '#BE9C4E', 1.2); }
            g.strokeStyle = '#6E1F2A'; g.lineWidth = 2; g.beginPath(); g.moveTo(postX - 5, ay + 4); g.lineTo(postX + 5, ay + 1); g.moveTo(postX - 5, ay + 8); g.lineTo(postX + 5, ay + 5); g.stroke();
          }
          K.grip = lerp(K.grip || 0, P.down ? 1 : 0, 0.2);
          const F = folk(g, W * 0.34, H * 0.94, H * 0.34, who || 'thiri', { face: 0.5, tilt: 0.55 - (K.fall ? 0.5 : 0), eyes: K.fall ? 'down' : 'up', arms: [2.3 - K.grip * 0.4, 2.0 - K.grip * 0.5], bend: [0.3, 0.5], brow: K.T > band.c + band.h || K.fall ? 1 : 0, shrug: K.grip * 0.6 });
          const hx = (F.hands[0][0] + F.hands[1][0]) / 2, hy = (F.hands[0][1] + F.hands[1][1]) / 2;
          g.strokeStyle = 'rgba(42,33,24,.75)'; g.lineWidth = 1.3;
          g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo((ax + hx) / 2, Math.max(ay, hy) + 10 + sag * 0.2, hx, hy); g.stroke();
          g.beginPath(); g.moveTo(hx, hy); g.quadraticCurveTo((hx + kx) / 2, (hy + ky) / 2 + sag, kx, ky + 10); g.stroke();
          drawKite(kx, ky, K.rot);
          tensionBar(K.T, band);
        },
        policy(care) {
          return () => { const tgt = band.c + (care >= 0.5 ? 0 : 0.3); if (K.T < tgt - 0.04) P.down = true; else if (K.T > tgt + 0.04) P.down = care < 0.5; };
        },
      };
      function drawKite(x, y, rot) {
        // tail first: paper bows on a string
        K.tail.unshift([x, y + 22]);
        if (K.tail.length > 26) K.tail.length = 26;
        g.strokeStyle = 'rgba(42,33,24,.6)'; g.lineWidth = 1;
        g.beginPath(); K.tail.forEach((p, i) => { const px = p[0] + Math.sin(K.t * 5 + i * 0.6) * i * 0.5, py = p[1] + i * 2.2; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke();
        K.tail.forEach((p, i) => { if (i % 5 !== 4) return; const px = p[0] + Math.sin(K.t * 5 + i * 0.6) * i * 0.5, py = p[1] + i * 2.2; g.save(); g.translate(px, py); g.rotate(Math.sin(K.t * 4 + i) * 0.5); g.beginPath(); g.moveTo(-6, -3); g.lineTo(6, 3); g.lineTo(6, -3); g.lineTo(-6, 3); g.closePath(); fillStroke(g, i % 10 === 4 ? '#E8C25A' : '#B5402F', 1); g.restore(); });
        g.save(); g.translate(x, y); g.rotate(rot);
        const w = W * 0.085, h = w * 1.35;
        const q = [[0, -h * 0.55], [w * 0.5, -h * 0.12], [0, h * 0.45], [-w * 0.5, -h * 0.12]];
        const tri = (a, b, c) => { g.beginPath(); g.moveTo(0, -h * 0.12 + 0); g.lineTo(...a); g.lineTo(...b); g.closePath(); g.fillStyle = c; g.fill(); };
        tri(q[0], q[1], '#7A2533'); tri(q[1], q[2], '#E8C25A'); tri(q[2], q[3], '#7A2533'); tri(q[3], q[0], '#E8C25A');
        g.beginPath(); q.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.closePath(); g.strokeStyle = OUT; g.lineWidth = 1.8; g.stroke();
        g.strokeStyle = '#6E5A3A'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(...q[0]); g.lineTo(...q[2]); g.moveTo(...q[3]); g.lineTo(...q[1]); g.stroke();
        sparkle(g, 0, -h * 0.12, 5, 0.9, '#FFF3C4');
        g.restore();
      }
    }

    // a vertical tension bar with a gold band; marker = value 0..1 (1 at the top)
    function tensionBar(v, band, x = W - 24) {
      const y0 = H * 0.12, y1 = H * 0.82, bw = 14;
      rr(g, x - bw / 2 - 3, y0 - 3, bw + 6, y1 - y0 + 6, 10); g.fillStyle = 'rgba(255,253,248,.88)'; g.fill(); g.strokeStyle = '#C9A24A'; g.lineWidth = 2; g.stroke();
      const yOf = (u) => lerp(y1, y0, u);
      g.fillStyle = 'rgba(201,162,74,.55)'; rr(g, x - bw / 2, yOf(band.c + band.h), bw, yOf(band.c - band.h) - yOf(band.c + band.h), 4); g.fill();
      g.strokeStyle = '#A47A2C'; g.lineWidth = 1; g.stroke();
      g.fillStyle = 'rgba(181,64,47,.18)'; rr(g, x - bw / 2, y0, bw, yOf(band.c + band.h) - y0 - 2, 4); g.fill();
      const my = yOf(v);
      g.beginPath(); g.moveTo(x - bw / 2 - 7, my); g.lineTo(x - bw / 2 - 1, my - 5); g.lineTo(x - bw / 2 - 1, my + 5); g.closePath(); fillStroke(g, '#6E1F2A', 1.2);
      rr(g, x - bw / 2 - 1, my - 3, bw + 2, 6, 3); fillStroke(g, '#6E1F2A', 1.2);
      g.fillStyle = '#8C6A28'; g.font = `700 10px ${MYF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(tr(T.tight), x, y0 - 12); g.fillText(tr(T.slack), x, y1 + 13);
    }

    // ================================================================ pour
    function pourMode() {
      const cupX = W * 0.58, cupY = H * 0.74, cupR = W * 0.07;
      const Pm = { tilt: 0, aim: 0, fill: 0, puddle: 0, look: 0, t: 0, pt: 0, looking: false, missing: false, missT: 0, faces: [], wi: 0, drops: [], steam: [], ended: false, slipsRun: 0, eyes: 0 };
      const slots = [W * 0.15, W * 0.55, W * 0.8, W * 0.38];
      const faceIds = ['dawpyone', 'koyaung', 'drinker1', 'drinker2'];
      const bg = S.layer((x) => teaShopBackground(x, W, H));
      const kettlePivot = () => [W * 0.4 + Pm.aim, H * 0.27];
      const spout = () => {
        const [px, py] = kettlePivot();
        const a = -Pm.tilt * 0.75;
        const sx = W * 0.115, sy = H * 0.01;
        return [px + sx * Math.cos(a) - sy * Math.sin(a), py + sx * Math.sin(a) + sy * Math.cos(a), a];
      };
      async function overSlipped() {
        Pm.ended = true;
        if (again) { await say.say(who || 'kophyo', again); say.clear(); }
        stats.tries++;
        Object.assign(Pm, { fill: 0, puddle: 0, slipsRun: 0, pt: 0, wi: 0, faces: [], ended: false });
        stats.slips = 0;
        A.setHint(hint);
      }
      return {
        step(dt) {
          Pm.t += dt;
          if (Pm.ended) return;
          Pm.tilt = clamp(Pm.tilt + (P.down ? 2.0 : -3) * dt, 0, 1);
          if (P.down) Pm.aim += P.dx * 0.9;
          Pm.aim += (noise(Pm.t * 0.8, 1) * 26 + Math.sin(Pm.t * 0.37) * 10) * dt; // the hand drifts
          Pm.aim = clamp(Pm.aim, -W * 0.3, W * 0.4);
          const lookNow = P.down && (P.y0 - P.y > H * 0.13 || P.y < H * 0.18);
          Pm.look = lerp(Pm.look, lookNow ? 1 : 0, Math.min(1, dt * 8));
          const flow = clamp((Pm.tilt - 0.35) / 0.65);
          if (flow > 0) {
            Pm.pt += dt;
            const [sx, sy] = spout();
            const land = sx + 18 + flow * W * 0.06 + Pm.look * Math.sin(Pm.t * 15) * W * 0.09;
            const inCup = Math.abs(land - cupX) < cupR * 0.78 && Pm.look < 0.5;
            if (inCup) { Pm.fill = Math.min(1, Pm.fill + flow * dt / Math.max(2, seconds * 0.75)); Pm.missT = 0; }
            else { Pm.puddle = Math.min(1, Pm.puddle + flow * dt * 0.25); Pm.missT += dt; if (Pm.missT > 0.25 && !Pm.missing && Pm.look < 0.5) { Pm.missing = true; stats.spills++; A.setHint(T.missCup, 'warn'); } }
            if (!inCup && Math.random() < 0.6) Pm.drops.push({ x: land, y: cupY - cupR * 0.3, vx: (Math.random() - 0.5) * 80, vy: -60 - Math.random() * 60, life: 0.6 });
            if (inCup && Pm.missing) { Pm.missing = false; A.setHint(hint); }
            Pm.land = land; Pm.sx = sx; Pm.sy = sy;
          } else { Pm.missT = 0; }
          if (Pm.look > 0.6 && flow > 0 && !Pm.looking) { Pm.looking = true; Pm.lookT = 0; stats.slips++; Pm.slipsRun++; buzz(30); A.setHint(T.looked, 'warn'); }
          // (Day 4) staring at the faces while the tea runs is not one glance: a second of it counts again
          // (after three tries the watchers are forgiven, so no one is stuck at the kettle)
          if (Pm.looking && flow > 0 && (Pm.lookT = (Pm.lookT || 0) + dt) > 1.0 && stats.tries < 3) { Pm.lookT = 0; stats.slips++; Pm.slipsRun++; buzz(30); }
          if (Pm.look < 0.2 && Pm.looking) { Pm.looking = false; A.setHint(hint); }
          // watchers peek in while the tea pours
          const due = watchers > 0 ? 1.0 + Pm.wi * (Math.max(3, seconds * 0.85) / watchers) : Infinity;
          if (Pm.wi < watchers && Pm.pt >= due) { Pm.faces.push({ i: Pm.wi, x: slots[Pm.wi % slots.length], t: 0, id: faceIds[Pm.wi % faceIds.length] }); Pm.wi++; }
          Pm.faces.forEach((f) => (f.t += dt));
          Pm.faces = Pm.faces.filter((f) => f.t < 3.2);
          Pm.drops.forEach((d) => { d.vy += 500 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt; });
          Pm.drops = Pm.drops.filter((d) => d.life > 0);
          if (Pm.fill > 0.3 && Math.random() < dt * 3) Pm.steam.push({ x: cupX + (Math.random() - 0.5) * cupR, y: cupY - cupR * 0.5, life: 1.6 });
          Pm.steam.forEach((s) => { s.y -= 18 * dt; s.life -= dt; });
          Pm.steam = Pm.steam.filter((s) => s.life > 0);
          stats.score = Pm.fill * (Pm.slipsRun <= 1 ? 1 : 0.5);
          if (Pm.slipsRun > 1 && !Pm.ended) { overSlipped(); return; }
          if (Pm.fill >= 1) { Pm.ended = true; Pm.tilt = 0; A.setHint(T.full, 'good'); stats.score = 1; finish(true); }
        },
        draw() {
          S.blit(bg);
          // the porter on his stool, at the right, waiting
          folk(g, W * 0.85, H * 0.82, H * 0.42, 'porter', { face: -1, seated: true, arms: [0.5, -0.3], bend: [0.6, 0.4], eyes: Pm.fill >= 1 ? 'closed' : 'down', mouth: Pm.fill >= 1 ? 0 : 0 });
          // low table and the cup
          rr(g, W * 0.4, H * 0.79, W * 0.38, H * 0.035, 3); fillStroke(g, '#9C6B3F', 1.6);
          rr(g, W * 0.43, H * 0.82, W * 0.02, H * 0.15, 2); fillStroke(g, '#7A5434', 1.4); rr(g, W * 0.73, H * 0.82, W * 0.02, H * 0.15, 2); fillStroke(g, '#7A5434', 1.4);
          if (Pm.puddle > 0) { g.fillStyle = 'rgba(184,116,58,.55)'; g.beginPath(); g.ellipse(cupX - cupR * 0.4, H * 0.792, cupR * (0.6 + Pm.puddle * 2), 3 + Pm.puddle * 2, 0, 0, 7); g.fill(); }
          g.beginPath(); g.ellipse(cupX, cupY + cupR * 0.62, cupR * 1.35, cupR * 0.28, 0, 0, 7); fillStroke(g, '#FFFDF8', 1.6);
          g.beginPath(); g.moveTo(cupX - cupR, cupY - cupR * 0.35); g.lineTo(cupX - cupR * 0.72, cupY + cupR * 0.55); g.quadraticCurveTo(cupX, cupY + cupR * 0.8, cupX + cupR * 0.72, cupY + cupR * 0.55); g.lineTo(cupX + cupR, cupY - cupR * 0.35); g.closePath(); fillStroke(g, '#FFFDF8', 1.8);
          g.strokeStyle = '#C9A24A'; g.lineWidth = 2; g.beginPath(); g.moveTo(cupX - cupR * 0.95, cupY - cupR * 0.18); g.lineTo(cupX + cupR * 0.95, cupY - cupR * 0.18); g.stroke();
          g.beginPath(); g.ellipse(cupX, cupY - cupR * 0.35, cupR, cupR * 0.26, 0, 0, 7); fillStroke(g, '#F3EADA', 1.6);
          if (Pm.fill > 0) { const fr = lerp(0.55, 0.96, Pm.fill); g.beginPath(); g.ellipse(cupX, cupY - cupR * 0.35 + (1 - Pm.fill) * cupR * 0.35, cupR * fr, cupR * 0.22 * fr, 0, 0, 7); g.fillStyle = '#C07A3E'; g.fill(); g.fillStyle = 'rgba(255,240,210,.5)'; g.beginPath(); g.ellipse(cupX - cupR * 0.3, cupY - cupR * 0.38 + (1 - Pm.fill) * cupR * 0.35, cupR * 0.25 * fr, cupR * 0.05, 0, 0, 7); g.fill(); }
          // fill gauge: a ring of little gold ticks around the saucer
          for (let i = 0; i < 10; i++) { const on = Pm.fill * 10 > i + 0.01; g.fillStyle = on ? '#C9A24A' : 'rgba(164,122,44,.25)'; g.beginPath(); g.arc(cupX - cupR * 1.2 + i * cupR * 0.27, cupY + cupR * 1.25, 2.4, 0, 7); g.fill(); }
          // steam
          g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2;
          for (const s of Pm.steam) { g.globalAlpha = Math.min(1, s.life); g.beginPath(); g.moveTo(s.x, s.y); g.quadraticCurveTo(s.x + 5, s.y - 6, s.x, s.y - 12); g.stroke(); }
          g.globalAlpha = 1;
          // watchers peeking along the top edge (in the doorway, over the partition)
          for (const f of Pm.faces) {
            const k = f.t < 0.35 ? ease(f.t / 0.35) : f.t > 2.8 ? 1 - (f.t - 2.8) / 0.4 : 1;
            const yy = lerp(-H * 0.04, H * 0.115, k) + Math.sin(f.t * 6) * 1.5;
            g.save(); g.beginPath(); g.rect(W * 0.3, 0, W * 0.7, H * 0.167); g.rect(0, 0, W * 0.3, H * 0.5); g.clip();
            folk(g, f.x, yy + H * 0.24, H * 0.36, f.id, { face: f.i % 2 ? -0.5 : 0.5, noArms: true, eyes: 'down', mouth: f.t % 1.4 < 0.7 ? 0.4 : 0 });
            g.restore();
            g.fillStyle = '#9C6B3F'; g.fillRect(W * 0.3, H * 0.165, W * 0.7, 4);
            sparkle(g, f.x + W * 0.07, yy - H * 0.05, 6 * k, k);
            g.fillStyle = `rgba(110,31,42,${k})`; g.font = `700 14px system-ui`; g.textAlign = 'center'; g.fillText('!', f.x - W * 0.07, yy - H * 0.03);
          }
          // Ko Phyo's head at the left edge: eyes on the cup, or up at the faces
          g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip();
          folk(g, W * 0.17, H * 0.98, H * 0.69, 'kophyo', { face: 0.6, noArms: true, tilt: Pm.look * 0.9 - 0.25, eyes: Pm.look > 0.5 ? 'up' : 'down', brow: 0 });
          g.restore();
          // his arm and the kettle
          const [px, py] = kettlePivot();
          const a = -Pm.tilt * 0.75 + Pm.look * Math.sin(Pm.t * 15) * 0.08;
          g.lineCap = 'round';
          g.strokeStyle = OUT; g.lineWidth = W * 0.058 + 3; g.beginPath(); g.moveTo(W * 0.25, H * 0.6); g.quadraticCurveTo(px - W * 0.1, py + H * 0.15, px - W * 0.03, py - H * 0.06); g.stroke();
          g.strokeStyle = SKINS[3]; g.lineWidth = W * 0.058; g.stroke();
          drawKettle(px, py, a);
          g.beginPath(); g.arc(px - W * 0.03, py - H * 0.065, W * 0.04, 0, 7); fillStroke(g, SKINS[3], 1.6);
          // the stream
          const flow = clamp((Pm.tilt - 0.35) / 0.65);
          if (flow > 0 && Pm.sx != null) {
            const [sx, sy] = spout();
            const land = Pm.land, ly = cupY - cupR * 0.35;
            g.strokeStyle = '#C07A3E'; g.lineWidth = 2 + flow * 4;
            g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + (land - sx) * 0.7, sy, land, ly); g.stroke();
            g.strokeStyle = 'rgba(255,236,200,.55)'; g.lineWidth = 1.2; g.stroke();
          }
          g.fillStyle = '#C07A3E';
          for (const d of Pm.drops) { g.globalAlpha = Math.max(0, d.life / 0.6); g.beginPath(); g.arc(d.x, d.y, 2.2, 0, 7); g.fill(); }
          g.globalAlpha = 1;
        },
        policy(care) {
          P.x = W * 0.5; P.y = P.y0 = H * 0.6;
          return (dt) => {
            P.down = true;
            const flow = clamp((Pm.tilt - 0.35) / 0.65);
            const [sx] = spout();
            const land = sx + 18 + flow * W * 0.06;
            const err = cupX - land;
            P.dx += clamp(err * 0.25 * care, -6, 6);
            if (care < 0.5 && Pm.faces.some((f) => f.t > 0.4)) { P.y = P.y0 - H * 0.2; } else P.y = P.y0;
          };
        },
      };
      function drawKettle(x, y, a) {
        g.save(); g.translate(x, y); g.rotate(a);
        const s = W * 0.1;
        // spout
        g.beginPath(); g.moveTo(s * 0.5, s * 0.35); g.quadraticCurveTo(s * 1.0, s * 0.3, s * 1.18, -s * 0.05); g.lineTo(s * 1.24, s * 0.02); g.quadraticCurveTo(s * 1.0, s * 0.55, s * 0.55, s * 0.62); g.closePath();
        fillStroke(g, '#B9BBB8', 1.8);
        // body
        g.beginPath(); g.moveTo(-s * 0.62, s * 0.8); g.quadraticCurveTo(-s * 0.85, s * 0.2, -s * 0.45, -s * 0.15); g.lineTo(s * 0.45, -s * 0.15); g.quadraticCurveTo(s * 0.85, s * 0.2, s * 0.62, s * 0.8); g.closePath();
        const gr = g.createLinearGradient(-s * 0.8, 0, s * 0.8, 0); gr.addColorStop(0, '#8F928F'); gr.addColorStop(0.35, '#E4E6E2'); gr.addColorStop(0.55, '#C9CCC8'); gr.addColorStop(1, '#8A8C88');
        fillStroke(g, gr, 1.8);
        g.strokeStyle = 'rgba(80,80,80,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-s * 0.7, s * 0.45); g.quadraticCurveTo(0, s * 0.55, s * 0.7, s * 0.45); g.stroke();
        g.fillStyle = 'rgba(80,60,40,.25)'; g.beginPath(); g.ellipse(-s * 0.2, s * 0.62, s * 0.1, s * 0.06, 0.3, 0, 7); g.fill(); // a dent
        // lid and knob
        g.beginPath(); g.ellipse(0, -s * 0.16, s * 0.42, s * 0.1, 0, 0, 7); fillStroke(g, '#D3D5D1', 1.6);
        rr(g, -s * 0.08, -s * 0.36, s * 0.16, s * 0.16, s * 0.05); fillStroke(g, '#2A2118', 1.4);
        // handle over the top
        g.strokeStyle = OUT; g.lineWidth = s * 0.14 + 3; g.beginPath(); g.moveTo(-s * 0.48, -s * 0.05); g.quadraticCurveTo(-s * 0.4, -s * 0.75, s * 0.25, -s * 0.2); g.stroke();
        g.strokeStyle = '#7A5434'; g.lineWidth = s * 0.14; g.stroke();
        g.restore();
      }
    }

    // ================================================================ bowl / cup / plank: hold to walk
    function walkMode() {
      const plank = mode === 'plank';
      const vessel = mode === 'cup' ? 'cup' : 'bowl';
      const gl = gusts.map((q) => (typeof q === 'number' ? { at: q, push: 0.4 } : q)).sort((a, b) => a.at - b.at);
      const stripY = H * 0.86;
      const x0 = W * 0.12, x1 = W * 0.86;
      const endAt = meet?.at ?? 1;
      const Wk = { prog: 0, v: 0, vPrev: 0, s: 0, sv: 0, ph: 0, t: 0, frozen: 0, ended: false, gi: 0, hands: [], words: [], narrow: 0, clRun: 0, clT: 0, splash: [], turn: 0, maxS: 0, decline: 0, settleMsg: false };
      const who0 = who || (mode === 'bowl' ? 'yeyint' : 'naychi');
      const bg = S.layer((x) => walkBackground(x, W, H, mode, meet));
      let backBtn = null;
      if (back) {
        backBtn = document.createElement('button');
        backBtn.type = 'button';
        backBtn.className = `sd-back ak-bi${clock ? ' low' : ''}`;
        bi(backBtn, back);
        S.wrap.append(backBtn);
        backBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (Wk.ended) return;
          stats.back++;
          Wk.turn = 1.6;
          if (backLine) await say.say(who0, backLine);
        });
      }
      const restart = () => Object.assign(Wk, { prog: 0, v: 0, s: 0, sv: 0, ph: 0, frozen: 0, gi: 0, hands: [], words: [], clRun: 0, ended: false, maxS: 0 });
      async function spill() {
        Wk.ended = true;
        stats.spills++;
        buzz(40);
        for (let i = 0; i < 14; i++) Wk.splash.push({ x: 0, y: 0, vx: (Math.random() - 0.5) * 160 + Math.sign(Wk.s) * 90, vy: -80 - Math.random() * 120, life: 0.9 });
        A.setHint(T.spilled, 'warn');
        const line = react.spill || again;
        if (mode === 'bowl' && !line) { stats.score = Wk.prog; await wait(900); finish(false); return; }
        await wait(700);
        if (line) await say.say(who0, line);
        say.clear();
        stats.tries++;
        restart();
        A.setHint(hint);
      }
      function clench() {
        stats.clench++; Wk.clRun++;
        Wk.narrow = 1.2; Wk.shrug = 1;
        buzz(18);
        if (react.clench) say.say(who0, react.clench, 1800); else A.setHint(T.clench, 'warn');
        if (Wk.clRun >= 2) { Wk.clRun = 0; spill(); }
      }
      return {
        step(dt) {
          Wk.t += dt;
          Wk.turn = Math.max(0, Wk.turn - dt);
          Wk.narrow = Math.max(0, Wk.narrow - dt);
          Wk.shrug = Math.max(0, (Wk.shrug || 0) - dt * 1.2);
          Wk.splash.forEach((d) => { d.vy += 520 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt; });
          Wk.splash = Wk.splash.filter((d) => d.life > 0);
          Wk.words.forEach((w) => (w.t += dt));
          Wk.words = Wk.words.filter((w) => w.t < 3.2);
          if (Wk.ended) { Wk.v = Math.max(0, Wk.v - dt * 3); Wk.s *= Math.exp(-3 * dt); return; }
          const holding = P.down && !Wk.frozen && Wk.turn <= 0;
          const vmax = plank ? 0.85 : 1.0;
          Wk.vPrev = Wk.v;
          if (holding) Wk.v += (vmax - Wk.v) * 1.6 * dt; else Wk.v = Math.max(0, Wk.v - 2.6 * dt);
          const acc = (Wk.v - Wk.vPrev) / Math.max(dt, 0.001);
          Wk.prog = Math.min(endAt, Wk.prog + (Wk.v * dt) / length);
          Wk.ph += Wk.v * dt * (plank ? 6.5 : 4.3);
          const walking = Wk.v > 0.05;
          let force;
          if (plank) {
            force = noise(Wk.t * 0.7, 5) * sway * (walking ? 3.2 + Wk.v * 5 : 0.4) + Math.sin(Wk.ph) * Wk.v * sway * 4;
            const c = walking ? 0.7 : 3.4;
            Wk.sv += (-5 * Wk.s - c * Wk.sv + force) * dt;
          } else {
            // each step rocks the water; near full speed the steps fall in time with the slosh and it builds
            force = -acc * 0.35 + Math.sin(Wk.ph) * Wk.v * Wk.v * (2.6 + sway * 8) + noise(Wk.t * 1.3, 2) * sway * (walking ? 2.4 : 0.3);
            const c = walking ? 0.9 : 3.6;
            Wk.sv += (-17 * Wk.s - c * Wk.sv + force) * dt;
          }
          // loosen: steady the cup with small sideways moves; big fast ones are a clench
          if (loosen && P.down) {
            Wk.sv -= clamp(P.dx / 60, -0.6, 0.6) * 2.2;
            if (P.speed > 520) { Wk.clT += dt; if (Wk.clT > 0.3) { Wk.clT = -0.9; clench(); } } else Wk.clT = Math.max(Wk.clT > 0 ? 0 : Wk.clT, Wk.clT - dt);
            if (Wk.clT < 0) Wk.clT = Math.min(0, Wk.clT + dt);
          }
          // helping hands (gusts), at a fraction of the walk
          while (Wk.gi < gl.length && Wk.prog >= (gl[Wk.gi].at <= 1 ? gl[Wk.gi].at : gl[Wk.gi].at / length)) {
            const q = gl[Wk.gi++];
            Wk.hands.push({ q, t: 0, side: q.from === 'right' ? 1 : -1, hit: false });
            Wk.words.push({ text: q.text, side: q.from === 'right' ? 1 : -1, t: 0, maya: !!q.maya });
          }
          for (const hd of Wk.hands) {
            hd.t += dt;
            if (!hd.hit && hd.t > 0.45) {
              hd.hit = true;
              const declined = !P.down;
              hd.declined = declined;
              Wk.sv += -hd.side * (hd.q.push ?? 0.5) * (declined ? 0.8 : 3.6);
              if (declined) { Wk.decline = 1.2; A.setHint(T.declined, 'good'); }
            }
          }
          Wk.hands = Wk.hands.filter((hd) => hd.t < 2.2);
          Wk.decline = Math.max(0, Wk.decline - dt);
          Wk.s += Wk.sv * dt;
          Wk.maxS = Math.max(Wk.maxS, Math.abs(Wk.s));
          const lim = spillAt * (Wk.narrow > 0 ? 0.8 : 1);
          if (!Wk.settleMsg && Math.abs(Wk.s) > lim * 0.7) { Wk.settleMsg = true; A.setHint(T.settle, 'warn'); }
          if (Wk.settleMsg && Math.abs(Wk.s) < lim * 0.3) { Wk.settleMsg = false; A.setHint(hint); }
          if (plank) {
            if (!Wk.frozen && Math.abs(Wk.s) > lim) { Wk.frozen = 1; stats.stops++; buzz(30); A.setHint(T.freeze, 'warn'); }
            if (Wk.frozen) { Wk.sv *= Math.exp(-2.5 * dt); if (Math.abs(Wk.s) < 0.18 && Math.abs(Wk.sv) < 0.25) { Wk.frozen = 0; A.setHint(hint); } }
          } else if (Math.abs(Wk.s) > lim) { spill(); return; }
          stats.score = clamp(Wk.prog / endAt * (1 - Wk.maxS / (spillAt * 2)));
          if (Wk.prog >= endAt) {
            Wk.ended = true;
            stats.score = clamp(1 - Wk.maxS / (spillAt * 2));
            if (meet) { A.setHint({ my: '…', en: '…' }); finish(true, { meet: meet.who || true }); }
            else finish(true);
          }
        },
        draw() {
          S.blit(bg);
          const wx = lerp(x0, x1, Wk.prog / 1);
          const deckA = plank ? Wk.s * 0.16 : 0;
          if (plank) drawBridge(deckA);
          if (meet) { const mx = lerp(x0, x1, Math.min(1, endAt + 0.07)); folk(g, Math.min(W * 0.93, mx + W * 0.05), stripY - (plank ? 0 : 0), H * 0.26, meet.who === 'child' ? 'child' : meet.who, { face: -1, arms: [0.9, 1.4], bend: [0.6, 0.3], eyes: 'down', brow: 1, frown: true }); }
          // the walker
          const fh = H * 0.42;
          const cy = plank ? stripY + (wx - W / 2) * Math.tan(deckA) : stripY;
          g.save();
          if (plank) { g.translate(wx, cy); g.rotate(deckA * 0.6 + (Wk.frozen ? Math.sin(Wk.t * 9) * 0.03 : 0)); g.translate(-wx, -cy); }
          const face = Wk.turn > 0 ? -1 : 1;
          const ph = Wk.v > 0.04 ? Wk.ph : null;
          // bowl / cup: both forearms level in front of the chest; plank: arms out to the hand ropes
          const holdArms = plank ? (Wk.frozen ? [-1.9, 1.9] : [-1.45, 1.45]) : face > 0 ? [0.55, 0.15] : [-0.15, -0.55];
          const bend = plank ? (Wk.frozen ? [-0.5, 0.5] : [-0.2, 0.2]) : face > 0 ? [1.05, 1.35] : [-1.35, -1.05];
          const F = folk(g, wx, cy, fh, who0, { face, walk: ph, arms: holdArms, bend, eyes: plank ? (Wk.frozen ? 'closed' : 'down') : 'down', tilt: -0.35, brow: Wk.frozen || Math.abs(Wk.s) > spillAt * 0.6 ? 1 : 0, shrug: Wk.shrug, mouth: Wk.frozen ? 0 : 0, frown: Wk.frozen });
          if (!plank) {
            const hx = (F.hands[0][0] + F.hands[1][0]) / 2, hy = Math.min(F.hands[0][1], F.hands[1][1]) - fh * 0.03;
            drawVesselSmall(hx, hy, Wk.s);
            Wk.vx = hx; Wk.vy = hy;
            if (Wk.decline > 0) { g.font = '700 13px system-ui'; g.fillStyle = `rgba(79,127,67,${Wk.decline})`; g.textAlign = 'center'; g.fillText('🙏', F.head[0] - face * F.head[2] * 0.9, F.head[1] - F.head[2] * 0.6); }
          }
          g.restore();
          // reaching hands with their words
          for (const hd of Wk.hands) {
            const k = hd.t < 0.45 ? ease(hd.t / 0.45) : hd.t > 1.6 ? 1 - ease((hd.t - 1.6) / 0.6) : 1;
            const ex0 = hd.side < 0 ? -10 : W + 10, tx = (Wk.vx ?? wx) - hd.side * W * 0.06;
            const hx = lerp(ex0, tx, k * (hd.declined ? 0.7 : 0.95)), hy = (Wk.vy ?? H * 0.6) + H * 0.03;
            const sleeveC = hd.q.maya ? '#6E1F2A' : ['#7FB0CF', '#D9A93B', '#5E8F4E', '#E0795A'][Math.floor(hd.q.at * 10) % 4];
            g.lineCap = 'round';
            g.strokeStyle = OUT; g.lineWidth = W * 0.05 + 3; g.beginPath(); g.moveTo(ex0, hy + H * 0.05); g.lineTo(hx, hy); g.stroke();
            g.strokeStyle = sleeveC; g.lineWidth = W * 0.05; g.stroke();
            g.beginPath(); g.ellipse(hx, hy, W * 0.028, W * 0.022, 0, 0, 7); fillStroke(g, hd.q.maya ? SKINS[0] : SKINS[2 + (Math.floor(hd.q.at * 10) % 3)], 1.6);
            for (let f = 0; f < 3; f++) { rr(g, hx - hd.side * W * 0.01, hy - W * 0.02 + f * W * 0.012, hd.side * -W * 0.035, W * 0.011, 3); fillStroke(g, hd.q.maya ? SKINS[0] : SKINS[2 + (Math.floor(hd.q.at * 10) % 3)], 1); }
          }
          drawWords(Wk.words, (w) => [w.side < 0 ? W * 0.26 : W * 0.74, H * 0.5]);
          // splash
          g.fillStyle = vessel === 'cup' ? '#C07A3E' : '#8FC2DA';
          for (const d of Wk.splash) { g.globalAlpha = Math.max(0, d.life); g.beginPath(); g.arc((Wk.vx ?? wx) + d.x, (Wk.vy ?? H * 0.6) + d.y, 2.6, 0, 7); g.fill(); }
          g.globalAlpha = 1;
          // the meter
          if (plank) drawDeckGauge(Wk.s, spillAt); else drawVesselLens(Wk.s, spillAt * (Wk.narrow > 0 ? 0.8 : 1), vessel);
          if (clock) drawClock(W - 40, 40, Wk.t);
          // progress dots along the bottom: the steps still to take
          const n = Math.max(3, Math.round(length));
          for (let i = 0; i <= n; i++) { const u = i / n; if (u > endAt + 1e-6) break; g.fillStyle = Wk.prog >= u - 1e-6 ? '#C9A24A' : 'rgba(164,122,44,.3)'; g.beginPath(); g.arc(lerp(x0, x1, u), H - 8, 2.6, 0, 7); g.fill(); }
        },
        policy(care) {
          return () => {
            if (care < 0.5) { P.down = true; return; }
            const lim = spillAt;
            const calm = Math.abs(Wk.s) < lim * (plank ? 0.32 : 0.22) && Math.abs(Wk.sv) < (plank ? 0.5 : 0.9);
            if (P.down && Math.abs(Wk.s) > lim * (plank ? 0.5 : 0.42)) P.down = false;
            else if (!P.down && calm) P.down = true;
            // turn a reaching hand down: stop when one is about to arrive
            if (Wk.hands.some((hd) => hd.t > 0.15 && hd.t < 0.5)) P.down = false;
          };
        },
      };
      function drawBridge(a) {
        const yL = stripY - (W / 2 - W * 0.06) * Math.tan(a), yR = stripY + (W * 0.94 - W / 2) * Math.tan(a);
        // handrail ropes
        g.strokeStyle = '#8C6A3A'; g.lineWidth = 2.2;
        g.beginPath(); g.moveTo(W * 0.02, yL - H * 0.25); g.quadraticCurveTo(W / 2, (yL + yR) / 2 - H * 0.16, W * 0.98, yR - H * 0.25); g.stroke();
        // planks
        for (let i = 0; i < 22; i++) {
          const u = i / 21, x = lerp(W * 0.05, W * 0.95, u), y = lerp(yL, yR, u) + Math.sin(u * Math.PI) * 6;
          rr(g, x - W * 0.022, y - 2, W * 0.04, 7, 1.5); fillStroke(g, i % 3 ? '#B58A5A' : '#A47A4C', 1.1);
          if (i % 3 === 0) { g.strokeStyle = 'rgba(140,106,58,.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - H * 0.25 + Math.sin(u * Math.PI) * H * 0.09); g.stroke(); }
        }
        g.strokeStyle = '#8C6A3A'; g.lineWidth = 2; g.beginPath(); g.moveTo(W * 0.02, yL + 6); g.quadraticCurveTo(W / 2, (yL + yR) / 2 + 12, W * 0.98, yR + 6); g.stroke();
      }
      function drawVesselSmall(x, y, s) {
        const r = W * 0.045;
        g.save(); g.translate(x, y); g.rotate(s * 0.12);
        if (vessel === 'cup') {
          g.beginPath(); g.moveTo(-r * 0.8, -r * 0.5); g.lineTo(-r * 0.6, r * 0.4); g.lineTo(r * 0.6, r * 0.4); g.lineTo(r * 0.8, -r * 0.5); g.closePath(); fillStroke(g, '#FFFDF8', 1.4);
          g.strokeStyle = '#C9A24A'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-r * 0.75, -r * 0.3); g.lineTo(r * 0.75, -r * 0.3); g.stroke();
          g.beginPath(); g.ellipse(0, -r * 0.5, r * 0.8, r * 0.2, 0, 0, 7); fillStroke(g, '#C07A3E', 1.2);
        } else {
          g.beginPath(); g.moveTo(-r * 1.2, -r * 0.4); g.quadraticCurveTo(-r * 1.1, r * 0.7, 0, r * 0.75); g.quadraticCurveTo(r * 1.1, r * 0.7, r * 1.2, -r * 0.4); g.closePath(); fillStroke(g, '#C47A45', 1.6);
          g.beginPath(); g.ellipse(0, -r * 0.4, r * 1.2, r * 0.25, 0, 0, 7); fillStroke(g, '#8FC2DA', 1.4);
        }
        g.restore();
      }
    }

    // the close-up lens on the water: the surface tilts with the slosh; red marks at the brim
    function drawVesselLens(s, lim, vessel) {
      const R = W * 0.17, cx = W * 0.27, cy = Math.max(H * 0.2, R + 26);
      g.save();
      g.beginPath(); g.arc(cx, cy, R + 5, 0, 7); g.fillStyle = 'rgba(255,253,248,.92)'; g.fill(); g.strokeStyle = '#C9A24A'; g.lineWidth = 3; g.stroke();
      g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip();
      g.fillStyle = vessel === 'cup' ? '#F6EEDD' : '#F3E6CC'; g.fillRect(cx - R, cy - R, R * 2, R * 2);
      const bw = R * 1.5, top = cy - R * 0.25, bot = cy + R * 0.55;
      const body = vessel === 'cup' ? '#FFFDF8' : '#C47A45';
      // the vessel (side view)
      g.beginPath();
      if (vessel === 'cup') { g.moveTo(cx - bw * 0.42, top); g.lineTo(cx - bw * 0.3, bot); g.lineTo(cx + bw * 0.3, bot); g.lineTo(cx + bw * 0.42, top); }
      else { g.moveTo(cx - bw / 2, top); g.quadraticCurveTo(cx - bw * 0.48, bot, cx, bot + R * 0.05); g.quadraticCurveTo(cx + bw * 0.48, bot, cx + bw / 2, top); }
      g.closePath();
      g.save(); g.clip();
      g.fillStyle = body; g.fillRect(cx - R, cy - R, R * 2, R * 2);
      // the liquid with its tilted surface
      const ang = s * 0.42, half = vessel === 'cup' ? bw * 0.42 : bw / 2;
      const yL = top + R * 0.05 + Math.tan(ang) * -half, yR = top + R * 0.05 + Math.tan(ang) * half;
      g.beginPath(); g.moveTo(cx - half - 4, yL); g.lineTo(cx + half + 4, yR); g.lineTo(cx + half + 4, bot + 20); g.lineTo(cx - half - 4, bot + 20); g.closePath();
      g.fillStyle = vessel === 'cup' ? '#C07A3E' : '#8FC2DA'; g.fill();
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - half, yL + 2); g.lineTo(cx + half, yR + 2); g.stroke();
      g.restore();
      g.strokeStyle = vessel === 'cup' ? '#FFFDF8' : '#C47A45'; g.lineWidth = 9; g.stroke();
      g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
      if (vessel === 'cup') { g.strokeStyle = '#C9A24A'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - bw * 0.4, top + R * 0.22); g.lineTo(cx + bw * 0.4, top + R * 0.22); g.stroke(); }
      else { g.strokeStyle = 'rgba(255,220,180,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - bw * 0.3, top + R * 0.25); g.quadraticCurveTo(cx - bw * 0.28, bot - R * 0.15, cx - bw * 0.1, bot - R * 0.05); g.stroke(); }
      // brim danger: the surface may tilt this far
      const danger = Math.abs(s) / Math.max(0.01, lim);
      for (const sd of [-1, 1]) {
        const on = danger > 0.7 && Math.sign(s) === sd;
        g.fillStyle = on ? '#B5402F' : 'rgba(181,64,47,.35)';
        g.beginPath(); g.arc(cx + sd * (vessel === 'cup' ? bw * 0.42 : bw / 2), top, on ? 4.5 : 3, 0, 7); g.fill();
      }
      g.restore();
      // a soft ring that reddens as the water nears the brim
      g.strokeStyle = `rgba(181,64,47,${clamp((danger - 0.5) * 1.6)})`; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, R + 5, 0, 7); g.stroke();
      // gold ticks round the top of the lens, like a protractor: the surface's tilt reads against them
      for (let i = -4; i <= 4; i++) {
        const an = -Math.PI / 2 + i * 0.22, big = i === 0;
        const r0 = R + 7, r1 = R + (big ? 17 : 13);
        g.lineCap = 'round';
        g.strokeStyle = OUT; g.lineWidth = big ? 5 : 3.6; g.beginPath(); g.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0); g.lineTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1); g.stroke();
        g.strokeStyle = Math.abs(i) >= 3 ? '#C9654A' : '#E2B84E'; g.lineWidth = big ? 2.8 : 1.8; g.stroke();
      }
      // the pointer: where the surface is tipping right now
      const pa = -Math.PI / 2 + clamp(s / Math.max(0.01, lim), -1.2, 1.2) * 0.66;
      g.beginPath(); g.arc(cx + Math.cos(pa) * (R + 11), cy + Math.sin(pa) * (R + 11), 4.2, 0, 7); fillStroke(g, '#FFFDF8', 1.8, '#2A2118');
    }

    // plank: a spirit level for the deck
    function drawDeckGauge(s, lim) {
      // a carpenter's level in dark wood with brass ends: big, high contrast, gold ticks
      const cx = W * 0.29, cy = H * 0.105, w = W * 0.48, h = Math.max(30, H * 0.075);
      const danger = clamp(Math.abs(s) / Math.max(0.01, lim));
      g.fillStyle = 'rgba(42,33,24,.18)'; rr(g, cx - w / 2 - 6, cy - h / 2 - 3, w + 12, h + 12, h * 0.55); g.fill();
      rr(g, cx - w / 2 - 7, cy - h / 2 - 7, w + 14, h + 14, h * 0.55); fillStroke(g, '#6E4A2C', 2.2);
      g.strokeStyle = 'rgba(255,230,190,.35)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx - w / 2, cy - h / 2 - 4); g.lineTo(cx + w / 2, cy - h / 2 - 4); g.stroke();
      for (const sd of [-1, 1]) { rr(g, cx + sd * (w / 2 + 1) - 5, cy - h / 2 - 5, 10, h + 10, 3); fillStroke(g, '#C9A24A', 1.4); }
      // the glass vial; its ends warm to red as the deck tips toward them
      rr(g, cx - w / 2, cy - h / 2, w, h, h / 2); fillStroke(g, '#F1F7E4', 1.8);
      for (const sd of [-1, 1]) {
        const on = Math.sign(-s) === sd ? danger : 0;
        g.fillStyle = `rgba(181,64,47,${0.22 + on * 0.55})`;
        rr(g, sd < 0 ? cx - w / 2 : cx + w / 2 - w * 0.16, cy - h / 2, w * 0.16, h, h / 2); g.fill();
      }
      // gold ticks: a tall pair round the centre, small ones out to the ends
      for (let i = -5; i <= 5; i++) {
        if (i === 0) continue;
        const x = cx + i * w * 0.075, big = Math.abs(i) === 1;
        g.lineCap = 'round';
        g.strokeStyle = OUT; g.lineWidth = big ? 4.4 : 3.2; g.beginPath(); g.moveTo(x, cy - h / 2 + 1); g.lineTo(x, cy - h / 2 + (big ? h * 0.9 : h * 0.34)); g.stroke();
        g.strokeStyle = '#E2B84E'; g.lineWidth = big ? 2.4 : 1.6; g.stroke();
      }
      const bx = cx + clamp(s / Math.max(0.01, lim), -1.1, 1.1) * (w / 2 - h * 0.6) * -1;
      g.beginPath(); g.ellipse(bx, cy, h * 0.6, h * 0.34, 0, 0, 7); fillStroke(g, 'rgba(255,253,248,.97)', 2, '#2A2118');
      g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(bx - h * 0.2, cy - h * 0.1, h * 0.18, h * 0.08, 0, 0, 7); g.fill();
    }

    // the stage clock: it turns whatever the player does
    function drawClock(x, y, tt) {
      const r = W * 0.075;
      g.beginPath(); g.arc(x, y, r + 4, 0, 7); fillStroke(g, '#7A5434', 2);
      g.beginPath(); g.arc(x, y, r, 0, 7); fillStroke(g, '#FFFDF8', 1.4);
      g.fillStyle = INK; g.font = `700 ${r * 0.34}px ${MYF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const [n, a] of [['၁၂', 0], ['၃', 0.5], ['၆', 1], ['၉', 1.5]]) g.fillText(n, x + Math.sin(a * Math.PI) * r * 0.72, y - Math.cos(a * Math.PI) * r * 0.72);
      const m = (45 + tt * 2.2) / 60, hr = (5 + m) / 12;
      g.strokeStyle = INK; g.lineCap = 'round';
      g.lineWidth = 2.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(hr * 2 * Math.PI) * r * 0.45, y - Math.cos(hr * 2 * Math.PI) * r * 0.45); g.stroke();
      g.lineWidth = 1.6; g.strokeStyle = '#6E1F2A'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(m * 2 * Math.PI) * r * 0.75, y - Math.cos(m * 2 * Math.PI) * r * 0.75); g.stroke();
      g.fillStyle = '#C9A24A'; g.beginPath(); g.arc(x, y, 2.5, 0, 7); g.fill();
    }

    // words that arrive, show for 1.2 s, then go grey and drift past: heard, not taken in
    function drawWords(list, anchorOf, tailOf = null) {
      for (const w of list) {
        const [ax, ay] = anchorOf(w);
        const tail = tailOf ? tailOf(w) : [w.side < 0 ? ax - W * 0.12 : ax + W * 0.12, ay + 18];
        const live = w.t < 1.2;
        const k = live ? Math.min(1, w.t / 0.2) : 1 - clamp((w.t - 1.2) / 2);
        const drift = live ? 0 : (w.t - 1.2) * 40;
        const x = ax + (live ? 0 : -w.side * drift * 1.4), y = ay - drift * 0.6;
        bubble(g, x, y, tr(w.text), { W, maxW: W * 0.42, size: 12, alpha: k, grey: !live, sub: live ? otherLang(w.text) : '', tx: live ? tail[0] : null, ty: live ? tail[1] : null, pencil: w.kind === 'jeer' });
      }
    }

    // ================================================================ stance: the head over unmoving ground
    function stanceMode() {
      const gl = gusts.map((q) => ({ ...q })).sort((a, b) => a.at - b.at);
      const last = gl.length ? gl[gl.length - 1].at : 3;
      const Sn = { t: 0, a: 0, off: 0, gi: 0, active: [], words: [], outT: 0, ended: false, clT: 0, clRun: 0, narrow: 0, shrug: 0, bob: 0, settle: 0, holdY: null };
      const who0 = who || (seated ? 'naychi' : 'kothiha');
      const fx = seated ? W * 0.3 : W * 0.5, groundY = H * 0.88;
      const bg = S.layer((x) => stanceBackground(x, W, H, seated));
      const restart = () => Object.assign(Sn, { t: 0, a: 0, gi: 0, active: [], outT: 0, clRun: 0, ended: false });
      async function slip(kind) {
        Sn.ended = true;
        stats.slips++;
        buzz(30);
        const line = kind === 'clench' ? react.clench : kind === 'down' ? react.bowed : react.tossed;
        A.setHint({ my: 'ပြန်ငြိမ်ပြီး ထပ်စမယ်', en: 'Settle, and the same words come again' }, 'warn');
        await say.say(who0, line || { my: '…', en: '…' });
        say.clear();
        stats.tries++;
        restart();
        A.setHint(hint);
      }
      function clench() {
        stats.clench++; Sn.clRun++;
        Sn.narrow = 1.2; Sn.shrug = 1;
        buzz(18);
        if (react.clench) say.say(who0, react.clench, 1800); else A.setHint(T.clench, 'warn');
        if (Sn.clRun >= 2) slip('clench');
      }
      return {
        down() { Sn.holdY = P.y; Sn.off0 = Sn.off; },
        step(dt) {
          Sn.t += dt;
          Sn.narrow = Math.max(0, Sn.narrow - dt);
          Sn.shrug = Math.max(0, Sn.shrug - dt * 1.1);
          Sn.words.forEach((w) => (w.t += dt));
          Sn.words = Sn.words.filter((w) => w.t < 3.4);
          if (Sn.ended) { Sn.a *= Math.exp(-3 * dt); return; }
          // the thumb: drag up lifts the chin, drag down lowers it (small moves are enough)
          if (P.down && Sn.holdY != null) Sn.off = clamp((Sn.off0 ?? 0) + (Sn.holdY - P.y) / (H * 0.32), -1, 1);
          else Sn.off *= Math.exp(-0.8 * dt);
          if (loosen && P.down && P.speed > 560) { Sn.clT += dt; if (Sn.clT > 0.3) { Sn.clT = -0.8; clench(); } }
          else if (Sn.clT > 0) Sn.clT = 0; else Sn.clT = Math.min(0, Sn.clT + dt);
          while (Sn.gi < gl.length && Sn.t >= gl[Sn.gi].at) {
            const q = gl[Sn.gi++];
            const up = q.up ?? (q.kind === 'praise');
            const side = q.from === 'post' || q.from === 'left' ? -1 : q.from === 'jetty' || q.from === 'right' ? 1 : (Sn.gi % 2 ? 1 : -1);
            Sn.active.push({ q, t: 0, sign: up ? 1 : -1 });
            const ax = seated ? (Sn.gi % 2 ? W * 0.6 : W * 0.78) : side < 0 ? W * 0.27 : W * 0.73;
            Sn.words.push({ text: q.text, side: seated ? 1 : side, t: 0, kind: q.kind, ax, tx: seated ? (Sn.gi % 2 ? W * 0.62 : W * 0.84) : side < 0 ? W * 0.1 : W * 0.9 });
            buzz(10);
          }
          let force = 0;
          for (const g0 of Sn.active) { g0.t += dt; const k = g0.t < 0.3 ? g0.t / 0.3 : g0.t > 1.5 ? Math.max(0, 1 - (g0.t - 1.5) / 0.5) : 1; force += g0.sign * (g0.q.push ?? 0.6) * 0.95 * k; }
          Sn.active = Sn.active.filter((g0) => g0.t < 2);
          const target = force + Sn.off + noise(Sn.t * 0.5, 9) * 0.04;
          Sn.a += (target - Sn.a) * Math.min(1, dt * 3.2);
          const band = 0.3 * (Sn.narrow > 0 ? 0.7 : 1);
          if (Math.abs(Sn.a) > band) { Sn.outT += dt; if (Sn.outT > 0.6) { slip(Sn.a < 0 ? 'down' : 'up'); return; } } else Sn.outT = Math.max(0, Sn.outT - dt * 2);
          stats.score = clamp(Sn.t / (last + 2.4));
          if (Sn.t > last + 2.4) { Sn.ended = true; stats.score = 1; finish(true); }
        },
        draw() {
          S.blit(bg);
          Sn.bob += 0.016;
          const raftBob = seated ? 0 : Math.sin(Sn.t * 1.6) * 2.5;
          if (!seated) drawRaft(fx, H * 0.7 + raftBob);
          const band = 0.3 * (Sn.narrow > 0 ? 0.7 : 1);
          const out = Math.abs(Sn.a) > band;
          const tilt = Sn.a * 0.9;
          if (seated) {
            // the porters beside her, chatting
            folk(g, W * 0.62, H * 0.66, H * 0.4, 'porter', { seated: true, face: -0.6, arms: [0.4, -0.2], bend: [0.6, 0.3], mouth: Sn.words.some((w) => w.t < 1.2 && w.side > 0) ? 0.6 : 0 });
            folk(g, W * 0.84, H * 0.66, H * 0.4, 'porter2', { seated: true, face: -0.8, arms: [0.3, -0.4], bend: [0.7, 0.2], mouth: Sn.words.some((w) => w.t < 1.2 && w.side < 0) ? 0.6 : 0 });
            folk(g, fx, H * 0.66, H * 0.4, who0, { seated: true, face: 0.6, tilt, eyes: tilt < -0.2 ? 'down' : tilt > 0.2 ? 'up' : 'open', shrug: Sn.shrug, arms: [0.35, -0.2], bend: [0.7, -0.4], brow: out ? 1 : 0, mouth: 0 });
          } else {
            const F = folk(g, fx, H * 0.665 + raftBob, H * 0.44, who0, { face: 0.7, tilt, eyes: tilt < -0.2 ? 'down' : tilt > 0.2 ? 'up' : 'open', shrug: Sn.shrug, arms: [0.55, 0.35], bend: [-0.7, -0.6], brow: out ? 1 : 0 });
            // the pole in both hands
            g.strokeStyle = OUT; g.lineWidth = 6; g.beginPath(); g.moveTo(fx + W * 0.13, H * 0.2 + raftBob); g.lineTo(fx - W * 0.02, H * 0.86); g.stroke();
            g.strokeStyle = '#C9A85A'; g.lineWidth = 3.6; g.stroke();
            for (const h0 of F.hands) { g.beginPath(); g.arc(h0[0], h0[1], 4, 0, 7); fillStroke(g, SKINS[3], 1.2); }
          }
          drawWords(Sn.words, (w) => [w.ax, seated ? H * 0.34 : H * 0.27], (w) => [w.tx, seated ? H * 0.5 : H * 0.42]);
          // the head meter, right beside the head; band in gold
          headMeter(fx - W * 0.17, seated ? H * 0.38 : H * 0.48, Sn.a, band);
        },
        policy(care) {
          return () => {
            P.down = true;
            if (Sn.holdY == null) { Sn.holdY = H * 0.5; Sn.off0 = 0; P.y = H * 0.5; }
            let force = 0;
            for (const g0 of Sn.active) { const k = g0.t < 0.3 ? g0.t / 0.3 : g0.t > 1.5 ? Math.max(0, 1 - (g0.t - 1.5) / 0.5) : 1; force += g0.sign * (g0.q.push ?? 0.6) * 0.95 * k; }
            const want = -force * care;
            const y = Sn.holdY - want * H * 0.32;
            P.y = lerp(P.y, y, 0.25);
          };
        },
      };
      function headMeter(x, y, a, band) {
        const h = H * 0.26;
        rr(g, x - 9, y - h / 2 - 3, 18, h + 6, 9); g.fillStyle = 'rgba(255,253,248,.9)'; g.fill(); g.strokeStyle = '#C9A24A'; g.lineWidth = 2; g.stroke();
        const yOf = (u) => y - clamp(u, -1, 1) * h / 2;
        g.fillStyle = 'rgba(201,162,74,.55)'; rr(g, x - 6, yOf(band), 12, yOf(-band) - yOf(band), 4); g.fill();
        g.fillStyle = '#8C6A28'; g.font = `600 9px ${MYF}`; g.textAlign = 'center';
        g.fillText('▲', x, y - h / 2 - 9); g.fillText('▼', x, y + h / 2 + 12);
        rr(g, x - 8, yOf(a) - 3, 16, 6, 3); fillStroke(g, Math.abs(a) > band ? '#B5402F' : '#6E1F2A', 1.2);
      }
      function drawRaft(x, y) {
        for (let i = 0; i < 7; i++) { rr(g, x - W * 0.26 + i * W * 0.075, y - 5, W * 0.075, 12, 6); fillStroke(g, i % 2 ? '#C9A85A' : '#BE9C4E', 1.4); }
        g.strokeStyle = '#7A5434'; g.lineWidth = 2; for (const k of [-0.18, 0.18]) { g.beginPath(); g.moveTo(x + W * k, y - 6); g.lineTo(x + W * k, y + 7); g.stroke(); }
        rr(g, x - W * 0.22, y - H * 0.08, W * 0.1, H * 0.075, 3); fillStroke(g, '#D9C3A0', 1.6); // the parcel
        g.strokeStyle = '#7A2533'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - W * 0.17, y - H * 0.08); g.lineTo(x - W * 0.17, y - 2); g.stroke();
      }
    }
  });
}

// ------------------------------------------------------------------ backgrounds (drawn once per act)
function kiteBackground(g, W, H, flagMode) {
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#BFD9EC'); sky.addColorStop(0.55, '#F4E2C2'); sky.addColorStop(1, '#FCE6C4');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const sun = g.createRadialGradient(W * 0.78, H * 0.66, 4, W * 0.78, H * 0.66, W * 0.45);
  sun.addColorStop(0, 'rgba(255,236,190,.95)'); sun.addColorStop(1, 'rgba(255,236,190,0)');
  g.fillStyle = sun; g.fillRect(0, 0, W, H);
  cloud(g, W * 0.2, H * 0.16, W * 0.08); cloud(g, W * 0.7, H * 0.08, W * 0.06); cloud(g, W * 0.45, H * 0.36, W * 0.05, '#FFF4E2');
  // the Envelope Market's roofline: stamp awnings with perforated edges, paper-plane bunting
  const rnd = seededRandom(4);
  const base = H * 0.8;
  for (let i = 0; i < 7; i++) {
    const x = i * W * 0.16 - W * 0.04, w = W * 0.15, h = H * (0.1 + rnd() * 0.08);
    rr(g, x, base - h, w, h + H * 0.25, 2); fillStroke(g, ['#E9DFC9', '#E2D5B8', '#F0E4CC'][i % 3], 1.4);
    g.fillStyle = 'rgba(122,84,52,.5)'; for (let k = 0; k < 2; k++) { rr(g, x + w * (0.18 + k * 0.42), base - h + h * 0.3, w * 0.25, h * 0.32, 2); g.fill(); }
    const ac = ['#B5402F', '#4F7F43', '#C9A24A'][i % 3];
    const ay = base - H * 0.02;
    g.fillStyle = '#FFFDF8'; g.fillRect(x - 2, ay, w + 4, H * 0.06);
    g.fillStyle = ac; g.fillRect(x + 3, ay + 3, w - 6, H * 0.06 - 6);
    g.fillStyle = '#F3E4C4'; for (let k = 0; k < 9; k++) { g.beginPath(); g.arc(x + k * (w / 8), ay + H * 0.06, 2.3, 0, Math.PI, true); g.fill(); }
    g.strokeStyle = OUT; g.lineWidth = 1.2; g.strokeRect(x - 2, ay, w + 4, H * 0.06);
  }
  g.strokeStyle = 'rgba(42,33,24,.4)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(0, H * 0.7); g.quadraticCurveTo(W * 0.5, H * 0.76, W, H * 0.69); g.stroke();
  for (let i = 1; i < 9; i++) { const x = i * W / 9, y = H * 0.7 + Math.sin(i / 9 * Math.PI) * H * 0.055; g.save(); g.translate(x, y + 5); g.rotate(-0.2); g.beginPath(); g.moveTo(-7, 0); g.lineTo(7, -3); g.lineTo(-4, 4); g.closePath(); fillStroke(g, '#FFFDF8', 1); g.restore(); }
  // the ground
  g.fillStyle = '#D9C49C'; g.fillRect(0, H * 0.9, W, H * 0.1);
  g.fillStyle = 'rgba(122,84,52,.18)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(rnd() * W, H * 0.9 + rnd() * H * 0.1, 2 + rnd() * 3, 1, 0, 0, 7); g.fill(); }
  if (flagMode) { // the post office wall at the left with its pulley
    rr(g, -6, H * 0.36, W * 0.2, H * 0.6, 4); fillStroke(g, '#F0E4CC', 1.6);
    g.fillStyle = '#7A2533'; g.fillRect(-4, H * 0.36, W * 0.2 - 4, H * 0.04);
    g.fillStyle = 'rgba(122,84,52,.35)'; for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) { rr(g, W * 0.02 + c * W * 0.07, H * 0.56 + r * H * 0.06, W * 0.05, H * 0.045, 2); g.fill(); }
  } else { // her table of paper planes by the post
    rr(g, W * 0.24, H * 0.83, W * 0.22, H * 0.025, 2); fillStroke(g, '#9C6B3F', 1.4);
    for (const k of [0.27, 0.43]) { rr(g, W * k, H * 0.855, 5, H * 0.07, 1); fillStroke(g, '#7A5434', 1.2); }
    for (let i = 0; i < 5; i++) { g.save(); g.translate(W * (0.27 + i * 0.04), H * 0.82); g.rotate(-0.1 + i * 0.05); g.beginPath(); g.moveTo(-8, 0); g.lineTo(9, -3); g.lineTo(-4, 4); g.closePath(); fillStroke(g, i % 2 ? '#FFFDF8' : '#F6E7B4', 1); g.restore(); }
    rr(g, -6, H * 0.5, W * 0.12, H * 0.46, 3); fillStroke(g, '#F0E4CC', 1.4);
  }
}

function teaShopBackground(g, W, H) {
  g.fillStyle = '#F2E6CC'; g.fillRect(0, 0, W, H);
  // jade-green lower wall, cream upper wall
  g.fillStyle = '#7FA88E'; g.fillRect(0, H * 0.42, W, H * 0.36);
  g.fillStyle = '#6A9479'; g.fillRect(0, H * 0.42, W, 5);
  g.strokeStyle = 'rgba(42,33,24,.15)'; for (let x = 0; x < W; x += 26) { g.beginPath(); g.moveTo(x, H * 0.43); g.lineTo(x, H * 0.78); g.stroke(); }
  // a doorway with the bright street
  rr(g, W * 0.02, H * 0.06, W * 0.26, H * 0.52, 3); fillStroke(g, '#FFF4DC', 2);
  g.fillStyle = 'rgba(255,248,226,.9)'; g.fillRect(W * 0.03, H * 0.07, W * 0.24, H * 0.5);
  g.fillStyle = 'rgba(201,162,74,.25)'; g.beginPath(); g.moveTo(W * 0.03, H * 0.57); g.lineTo(W * 0.27, H * 0.57); g.lineTo(W * 0.42, H * 0.78); g.lineTo(W * 0.1, H * 0.78); g.fill();
  // shelf with snack jars
  rr(g, W * 0.36, H * 0.27, W * 0.5, H * 0.02, 2); fillStroke(g, '#9C6B3F', 1.4);
  const jars = ['#E8C25A', '#C47A45', '#E8879A', '#8DB86A', '#F2D2A6'];
  jars.forEach((c, i) => { const x = W * (0.39 + i * 0.09); rr(g, x, H * 0.19, W * 0.06, H * 0.08, 4); fillStroke(g, 'rgba(255,255,255,.55)', 1.3); g.fillStyle = c; rr(g, x + 2, H * 0.225, W * 0.06 - 4, H * 0.042, 3); g.fill(); rr(g, x + W * 0.008, H * 0.18, W * 0.044, H * 0.016, 2); fillStroke(g, '#B5402F', 1); });
  // calendar
  rr(g, W * 0.72, H * 0.05, W * 0.12, H * 0.11, 2); fillStroke(g, '#FFFDF8', 1.4);
  g.fillStyle = '#B5402F'; g.fillRect(W * 0.72 + 2, H * 0.05 + 2, W * 0.12 - 4, H * 0.03);
  g.fillStyle = 'rgba(42,33,24,.5)'; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) g.fillRect(W * 0.735 + c * W * 0.025, H * 0.095 + r * H * 0.018, W * 0.012, 3);
  // partition rail the watchers lean over
  g.fillStyle = '#9C6B3F'; g.fillRect(W * 0.3, H * 0.165, W * 0.7, 4);
  // floor tiles
  g.fillStyle = '#D9C49C'; g.fillRect(0, H * 0.78, W, H * 0.22);
  g.strokeStyle = 'rgba(122,84,52,.25)'; g.lineWidth = 1;
  for (let x = -W; x < W * 2; x += 34) { g.beginPath(); g.moveTo(x, H * 0.78); g.lineTo(x + (x - W / 2) * 0.4, H); g.stroke(); }
  for (const y of [0.84, 0.91]) { g.beginPath(); g.moveTo(0, H * y); g.lineTo(W, H * y); g.stroke(); }
}

function walkBackground(g, W, H, mode, meet) {
  if (mode === 'plank') {
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#CFE2EC'); sky.addColorStop(0.6, '#F3E6CC'); sky.addColorStop(1, '#F3E6CC');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    cloud(g, W * 0.58, H * 0.2, W * 0.055); cloud(g, W * 0.84, H * 0.33, W * 0.045, '#FFF4E2');
    // newsprint banks far off
    g.fillStyle = '#E2D5B8'; g.fillRect(0, H * 0.5, W, H * 0.1);
    g.strokeStyle = 'rgba(42,33,24,.18)'; for (let y = H * 0.52; y < H * 0.6; y += 5) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    // water
    const wa = g.createLinearGradient(0, H * 0.6, 0, H); wa.addColorStop(0, '#8FB8C9'); wa.addColorStop(1, '#5F8FA3');
    g.fillStyle = wa; g.fillRect(0, H * 0.6, W, H * 0.4);
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1.5;
    const rnd = seededRandom(11);
    for (let i = 0; i < 26; i++) { const x = rnd() * W, y = H * (0.63 + rnd() * 0.35); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6, y - 3, x + 14, y); g.stroke(); }
    // the near bank (left) and the middle pier with its winch (right)
    g.fillStyle = '#C9A271'; g.beginPath(); g.moveTo(0, H * 0.8); g.lineTo(W * 0.08, H * 0.82); g.lineTo(W * 0.06, H); g.lineTo(0, H); g.fill();
    rr(g, W * 0.9, H * 0.82, W * 0.12, H * 0.2, 3); fillStroke(g, '#A4875E', 1.6);
    for (let i = 0; i < 4; i++) { g.strokeStyle = 'rgba(42,33,24,.25)'; g.beginPath(); g.moveTo(W * 0.9, H * (0.86 + i * 0.04)); g.lineTo(W, H * (0.86 + i * 0.04)); g.stroke(); }
    rr(g, W * 0.93, H * 0.66, W * 0.03, H * 0.16, 2); fillStroke(g, '#7A5434', 1.4);
    g.beginPath(); g.arc(W * 0.945, H * 0.68, W * 0.03, 0, 7); fillStroke(g, '#9C6B3F', 1.4);
    rr(g, W * 0.925, H * 0.6, W * 0.045, H * 0.05, 2); fillStroke(g, '#5A6A6E', 1.4); // slate 6 on the winch
    return;
  }
  if (mode === 'bowl') {
    // the stage at dusk: maroon curtains at the sides, a painted backdrop of the Quarter
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#E9B98A'); sky.addColorStop(1, '#F4D9B4');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.fillStyle = '#EEDFC2'; rr(g, W * 0.08, H * 0.42, W * 0.84, H * 0.36, 4); g.fill();
    g.fillStyle = '#C9DDB0'; g.beginPath(); g.moveTo(W * 0.08, H * 0.7); for (let i = 0; i <= 10; i++) g.lineTo(W * (0.08 + i * 0.084), H * (0.62 + Math.sin(i * 1.3) * 0.03)); g.lineTo(W * 0.92, H * 0.78); g.lineTo(W * 0.08, H * 0.78); g.fill();
    for (let i = 0; i < 4; i++) { const x = W * (0.2 + i * 0.18); rr(g, x, H * 0.55, W * 0.1, H * 0.13, 2); fillStroke(g, '#F6F0E2', 1.2); g.fillStyle = '#B5402F'; g.beginPath(); g.moveTo(x - 3, H * 0.55); g.lineTo(x + W * 0.05, H * 0.5); g.lineTo(x + W * 0.1 + 3, H * 0.55); g.fill(); }
    g.strokeStyle = 'rgba(42,33,24,.2)'; g.strokeRect(W * 0.08, H * 0.42, W * 0.84, H * 0.36);
    for (const s of [0, 1]) { const x = s ? W * 0.9 : 0; g.fillStyle = '#7A2533'; g.fillRect(x, 0, W * 0.1, H * 0.8); g.strokeStyle = 'rgba(0,0,0,.18)'; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x + k * W * 0.025, 0); g.lineTo(x + k * W * 0.025, H * 0.8); g.stroke(); } }
    g.fillStyle = '#6E1F2A'; g.fillRect(0, 0, W, H * 0.04);
    for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? '#C9A24A' : '#7A2533'; g.beginPath(); g.moveTo(i * W / 14, H * 0.04); g.lineTo((i + 0.5) * W / 14, H * 0.07); g.lineTo((i + 1) * W / 14, H * 0.04); g.fill(); }
    // boards
    g.fillStyle = '#B58A5A'; g.fillRect(0, H * 0.8, W, H * 0.2);
    g.strokeStyle = 'rgba(74,48,26,.35)'; for (let y = H * 0.84; y < H; y += H * 0.04) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    // Toe Toe's bean box at the far side
    rr(g, W * 0.88, H * 0.77, W * 0.1, H * 0.08, 2); fillStroke(g, '#9C6B3F', 1.6);
    g.strokeStyle = '#4F7F43'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { const x = W * (0.895 + i * 0.022); g.beginPath(); g.moveTo(x, H * 0.77); g.quadraticCurveTo(x - 4, H * 0.72, x + 2, H * 0.7); g.stroke(); g.fillStyle = '#8DB86A'; g.beginPath(); g.ellipse(x + 3, H * 0.7, 4, 2.4, 0.4, 0, 7); g.fill(); }
    return;
  }
  // cup: the tea shop aisle, tables either side, the wall bench at the far end
  teaShopBackground(g, W, H);
  g.fillStyle = 'rgba(242,230,204,.55)'; g.fillRect(0, 0, W, H * 0.4);
  for (const x of [0.2, 0.55]) {
    rr(g, W * (x - 0.1), H * 0.7, W * 0.2, H * 0.025, 2); fillStroke(g, '#9C6B3F', 1.4);
    folk(g, W * (x - 0.06), H * 0.72, H * 0.26, x < 0.3 ? 'drinker1' : 'koyaung', { seated: true, face: 0.4, noArms: true, eyes: 'down' });
    folk(g, W * (x + 0.08), H * 0.72, H * 0.26, x < 0.3 ? 'drinker2' : 'dawpyone', { seated: true, face: -0.4, noArms: true, eyes: 'closed', mouth: 0.4 });
    rr(g, W * (x - 0.02), H * 0.67, W * 0.03, H * 0.03, 2); fillStroke(g, '#FFFDF8', 1.1);
  }
  rr(g, W * 0.84, H * 0.72, W * 0.16, H * 0.04, 2); fillStroke(g, '#B58A5A', 1.6);
  rr(g, W * 0.86, H * 0.76, W * 0.02, H * 0.08, 1); fillStroke(g, '#7A5434', 1.2);
}

function stanceBackground(g, W, H, seated) {
  if (seated) {
    // the weigh-house: plank wall, the rope rack, the big scale, the bright loading door
    g.fillStyle = '#D9BE93'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(74,48,26,.22)'; g.lineWidth = 1.2; for (let x = 0; x < W; x += 22) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H * 0.7); g.stroke(); }
    rr(g, W * 0.62, H * 0.06, W * 0.3, H * 0.36, 3); fillStroke(g, '#FFF4DC', 2);
    g.fillStyle = 'rgba(160,190,205,.55)'; g.fillRect(W * 0.63, H * 0.3, W * 0.28, H * 0.11);
    g.fillStyle = '#7A5434'; g.fillRect(W * 0.04, H * 0.09, W * 0.5, 6);
    for (let i = 0; i < 4; i++) { const x = W * (0.08 + i * 0.12); g.strokeStyle = '#B08A52'; g.lineWidth = 4; g.beginPath(); g.ellipse(x, H * 0.17, W * 0.04, H * 0.06, 0, 0, 7); g.stroke(); g.strokeStyle = '#8C6A3A'; g.lineWidth = 1.5; g.stroke(); }
    rr(g, W * 0.43, H * 0.13, W * 0.07, H * 0.07, 2); fillStroke(g, '#5A6A6E', 1.4);
    g.strokeStyle = '#4A3A2A'; g.lineWidth = 3; g.beginPath(); g.moveTo(W * 0.3, H * 0.27); g.lineTo(W * 0.56, H * 0.25); g.stroke();
    g.lineWidth = 1.2; g.beginPath(); g.moveTo(W * 0.31, H * 0.27); g.lineTo(W * 0.28, H * 0.37); g.moveTo(W * 0.31, H * 0.27); g.lineTo(W * 0.34, H * 0.37); g.stroke();
    g.beginPath(); g.ellipse(W * 0.31, H * 0.375, W * 0.05, H * 0.012, 0, 0, 7); fillStroke(g, '#A47A2C', 1.2);
    // the bench
    rr(g, W * 0.12, H * 0.66, W * 0.86, H * 0.035, 3); fillStroke(g, '#9C6B3F', 1.6);
    for (const x of [0.16, 0.92]) { rr(g, W * x, H * 0.69, W * 0.025, H * 0.12, 2); fillStroke(g, '#7A5434', 1.4); }
  } else {
    // Cane Jetty: sky, the far bank, water; U Bo Lay's post at the left, the cane jetty at the right
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#C7DDEA'); sky.addColorStop(0.6, '#F6E6C8'); sky.addColorStop(1, '#F6E6C8');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    cloud(g, W * 0.3, H * 0.12, W * 0.06); cloud(g, W * 0.75, H * 0.2, W * 0.05, '#FFF4E2');
    g.fillStyle = '#B9C99A'; g.beginPath(); g.moveTo(0, H * 0.52); for (let i = 0; i <= 8; i++) g.lineTo(W * i / 8, H * (0.5 + Math.sin(i * 1.7) * 0.015)); g.lineTo(W, H * 0.56); g.lineTo(0, H * 0.56); g.fill();
    const wa = g.createLinearGradient(0, H * 0.56, 0, H * 0.82); wa.addColorStop(0, '#9CC2CF'); wa.addColorStop(1, '#6F9FB2');
    g.fillStyle = wa; g.fillRect(0, H * 0.56, W, H * 0.26);
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1.4;
    const rnd = seededRandom(23);
    for (let i = 0; i < 20; i++) { const x = rnd() * W, y = H * (0.6 + rnd() * 0.2); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6, y - 3, x + 14, y); g.stroke(); }
    // the jetty (right) with cane bundles and the cane-cutter
    rr(g, W * 0.8, H * 0.6, W * 0.22, H * 0.04, 2); fillStroke(g, '#A47A4C', 1.6);
    for (const x of [0.83, 0.95]) { rr(g, W * x, H * 0.64, W * 0.02, H * 0.18, 1); fillStroke(g, '#7A5434', 1.2); }
    for (let i = 0; i < 3; i++) { rr(g, W * (0.84 + i * 0.045), H * 0.52, W * 0.04, H * 0.08, 3); fillStroke(g, '#C9B26A', 1.2); g.strokeStyle = '#7A2533'; g.beginPath(); g.moveTo(W * (0.84 + i * 0.045), H * 0.56); g.lineTo(W * (0.88 + i * 0.045), H * 0.56); g.stroke(); }
    folk(g, W * 0.9, H * 0.6, H * 0.3, 'canecutter', { face: -0.6, arms: [0.3, -0.9], bend: [0.4, -1.2] });
    // U Bo Lay on his mooring post (left)
    rr(g, W * 0.06, H * 0.5, W * 0.07, H * 0.32, 3); fillStroke(g, '#8C6A3A', 1.6);
    g.strokeStyle = 'rgba(42,33,24,.3)'; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(W * 0.06, H * (0.56 + k * 0.06)); g.lineTo(W * 0.13, H * (0.55 + k * 0.06)); g.stroke(); }
    folk(g, W * 0.095, H * 0.5, H * 0.3, 'ubolay', { seated: true, face: 0.6, arms: [0.4, -0.1], bend: [0.6, 0.4], brow: -1 });
  }
  // the ground that never moves: a strip of earth with stones and a gold-ink line
  const gy = H * 0.82;
  g.fillStyle = '#8C6A48'; g.fillRect(0, gy, W, H - gy);
  g.fillStyle = '#7A5A3C'; g.fillRect(0, gy + (H - gy) * 0.45, W, (H - gy) * 0.55);
  const rnd = seededRandom(31);
  for (let i = 0; i < 26; i++) { g.fillStyle = ['#A08060', '#6E5236', '#B59670'][i % 3]; rr(g, rnd() * W, gy + 4 + rnd() * (H - gy - 8), 4 + rnd() * 8, 3 + rnd() * 4, 2); g.fill(); }
  g.fillStyle = '#C9A24A'; g.fillRect(0, gy, W, 2.5);
}

function injectSteadyStyle() {
  if (document.getElementById('act-steady-style')) return;
  const s = document.createElement('style');
  s.id = 'act-steady-style';
  s.textContent = `
  .ak-steady .act-card, .ak-guide .act-card, .ak-hold .act-card, .ak-simmer .act-card, .ak-holdback .act-card { width: min(100%, 430px); }
  .sd-stage { position: relative; width: fit-content; margin: 0 auto; touch-action: none; }
  .sd-stage canvas { border-radius: 16px; box-shadow: 0 4px 0 rgba(164,122,44,.25), 0 0 0 2px #E2D5B8; cursor: pointer; }
  .sd-say { min-height: 66px; box-sizing: border-box; margin: 10px auto 0; max-width: 400px; padding: 6px 12px 7px; border-radius: 14px; border: 2px solid transparent;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0; transition: background .2s, border-color .2s; }
  .sd-say.on { background: #FFFDF8; border-color: #E2D5B8; box-shadow: 0 3px 0 #E2D5B8; }
  .sd-who { font: 700 11px/1.4 ${MYF}; color: #FFFDF8; background: #6E1F2A; border-radius: 999px; padding: 1px 10px; margin-bottom: 2px; }
  .sd-who:empty, .sd-who[hidden] { display: none; }
  .sd-line { margin: 0; font-weight: 600; }
  .sd-line.ak-new { animation: akhint .3s ease both; }
  .sd-say.thought .sd-line .ak-main { font-style: italic; color: #6A5A48; }
  .sd-back { position: absolute; right: 8px; top: 8px; z-index: 2; font: 700 12px/1.5 ${MYF}; padding: 4px 12px; border-radius: 999px; border: 2px solid #C9B48A;
    background: rgba(255,253,248,.92); color: #6A5A48; box-shadow: 0 2px 0 #E2D5B8; cursor: pointer; }
  .sd-back .ak-sub { font-size: 9.5px; }
  .sd-back.low { top: auto; bottom: 22px; }
  .sd-say:not(.on)::before { content: ''; width: 46%; height: 10px; opacity: .85;
    background: radial-gradient(circle, #C9A24A 0 3.2px, transparent 3.8px) center / 10px 10px no-repeat,
      linear-gradient(90deg, transparent, #D9C08A 22%, #D9C08A 42%, transparent 44%, transparent 56%, #D9C08A 58%, #D9C08A 78%, transparent) center / 100% 1.5px no-repeat; }
  .sd-back:active { transform: translateY(1px); }
  `;
  document.head.appendChild(s);
}
