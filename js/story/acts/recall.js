// Handwork pattern "tap the cause in a told memory": three evenings, as she tells them (Day 13, ch 21).
//
//   const r = await recall({ title, hint, who?, evenings: [{ label, frames: [{ id, my, en, cup: 0..3, key?, prop? }] }], wrong })
//   r = { ok: true, mistakes: n, picks: [frameId, ...] }     (cancel: { ok: false, cancelled: true, mistakes })
//
// Look: a paper strip per evening, four pencil frames in reading order (two by two on a phone), each with a
// box-figure of the teller, one prop, and the talk's steam cup over her head at that frame's `cup` (wisps
// 0–3); the last frame boils with a small shake. Tap the frame just BEFORE the boil (`key: true`): it inks
// gold, the strip folds up small at the top and the next evening slides in. A wrong tap shakes that frame,
// shows `wrong` (her line) and draws her cup cool in it for a moment; no penalty, no timer, no score shown.
// Props are picked by `prop`, else from the frame id / English words: tease, drip (rain), cover (loom),
// spill (tea), radio, gift (parcel), bag, crowd (shove), bread, boil.
//
// Test hook: window.__act.autoRecall({ wrongFirst = true } = {})
import { openAct, bi, wait, buzz, myNum } from './kit.js';
import { whoChip } from './sort.js';

const PEN = '#4A4850';
const PROP_WORDS = [
  ['tease', /teas|doll|laugh at/i], ['drip', /rain|drip|roof/i], ['cover', /cover|loom/i], ['spill', /spill|tea/i],
  ['radio', /radio|noise|loud/i], ['gift', /gift|parcel|wrap/i], ['bag', /bag/i], ['crowd', /crowd|shove|push/i],
  ['bread', /bread|loaf/i], ['boil', /boil/i],
];
function propOf(f) {
  if (f.prop) return f.prop;
  for (const [k, re] of PROP_WORDS) if (re.test(f.id || '') || re.test(f.en || '')) return k;
  return f.cup >= 3 ? 'boil' : null;
}

export function recall({ title = '', hint = '', who = 'eimon', evenings = [], wrong = null } = {}) {
  return new Promise((resolve) => {
    let mistakes = 0, raf = 0;
    const picks = [];
    const A = openAct({ title, hint, kind: 'recall', resolve: (r) => { cancelAnimationFrame(raf); resolve(r); }, onCancel: () => ({ mistakes, picks }) });
    injectRecallStyle();
    A.body.innerHTML = `<div class="rc-head"><span class="rc-face"></span><div class="rc-say"><p class="ak-bi"></p></div></div>
      <div class="rc-strip"><div class="rc-grid"></div></div>
      <div class="rc-dots"></div>`;
    const sayEl = A.body.querySelector('.rc-say');
    const stripEl = A.body.querySelector('.rc-strip');
    const grid = A.body.querySelector('.rc-grid');
    const dots = A.body.querySelector('.rc-dots');
    if (who) A.body.querySelector('.rc-face').appendChild(whoChip(who, { face: 'talk', size: 44 }));
    evenings.forEach(() => dots.appendChild(document.createElement('i')));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let ev = 0, frames = [], busy = false, t = 0;

    function say(line) {
      if (!line) return;
      bi(sayEl.querySelector('p'), line);
      sayEl.classList.remove('in'); void sayEl.offsetWidth; sayEl.classList.add('in');
    }

    function build(k) {
      const E = evenings[k];
      say(E.label);
      grid.replaceChildren();
      frames = E.frames.map((f, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'rc-frame';
        b.style.setProperty('--d', `${i * 90}ms`);
        b.innerHTML = `<span class="rc-n">${myNum(i + 1)}</span><canvas></canvas><span class="rc-cap ak-bi"></span>`;
        bi(b.querySelector('.rc-cap'), f);
        b.addEventListener('click', () => tap(i));
        grid.appendChild(b);
        const cv = b.querySelector('canvas');
        return { f, el: b, cv, g: null, cool: 0, gold: 0, prop: propOf(f) };
      });
      requestAnimationFrame(() => {
        for (const fr of frames) {
          const w = Math.round(fr.cv.clientWidth || 150), h = Math.round(w * 0.66);
          fr.cv.style.height = `${h}px`;
          fr.cv.width = w * dpr; fr.cv.height = h * dpr;
          fr.g = fr.cv.getContext('2d');
          fr.g.setTransform(dpr, 0, 0, dpr, 0, 0);
          fr.w = w; fr.h = h;
          drawFrame(fr, 0);
        }
      });
      [...dots.children].forEach((d, i) => d.className = i < k ? 'on' : i === k ? 'cur' : '');
    }

    async function tap(i) {
      if (busy || A.closed()) return;
      const fr = frames[i];
      if (fr.f.key) {
        busy = true;
        picks.push(fr.f.id);
        fr.el.classList.add('gold');
        fr.gold = 0.01;
        buzz(20);
        await wait(1100);
        // the evening is done: its dot at the foot of the card inks gold (no thumbnails: the dots say it)
        ev++;
        const dot = dots.children[ev - 1];
        if (dot) { dot.className = 'on'; dot.classList.add('pop'); }
        if (ev >= evenings.length) {
          stripEl.classList.add('fold');
          [...dots.children].forEach((d) => d.className = 'on');
          await wait(400);
          await A.seal(true);
          A.done({ ok: true, mistakes, picks });
          return;
        }
        stripEl.classList.add('out');
        await wait(320);
        stripEl.classList.remove('out');
        build(ev);
        stripEl.classList.add('in');
        setTimeout(() => stripEl.classList.remove('in'), 500);
        busy = false;
        return;
      }
      mistakes++;
      A.shake(fr.el);
      buzz(28);
      say(wrong);
      fr.cool = 1.6; // her cup, cool in this frame for a moment
    }

    // ---- drawing (pencil frames)
    function drawFrame(fr, time) {
      const g = fr.g;
      if (!g) return;
      const W = fr.w, H = fr.h, f = fr.f;
      g.clearRect(0, 0, W, H);
      // paper
      g.fillStyle = fr.gold ? `rgba(246,226,160,${Math.min(1, fr.gold)})` : '#FFFDF8';
      g.fillRect(0, 0, W, H);
      if (fr.gold) { g.fillStyle = '#FFFDF8'; g.globalAlpha = 1 - Math.min(1, fr.gold) * 0.6; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
      g.fillStyle = 'rgba(160,140,110,.08)';
      for (let i = 0; i < 40; i++) g.fillRect((i * 37) % W, (i * 53) % H, 1.2, 1.2);
      const boil = f.cup >= 3 && !fr.cool;
      const shake = boil ? Math.sin(time * 40) * 1.4 : 0;
      const baseY = H * 0.9;
      // ground line
      sk(g, 6, baseY, W - 6, baseY, 1.2, 'rgba(74,72,80,.45)');
      // the prop
      drawProp(g, fr.prop, W, H, baseY, time, f);
      // her: a box figure (braid, plum blouse wash, sky skirt)
      const x = W * 0.36 + shake, u = H / 100;
      const wash = (c, rx, ry, rw, rh) => { g.fillStyle = c; g.globalAlpha = 0.55; g.fillRect(rx, ry, rw, rh); g.globalAlpha = 1; };
      wash('#B88AB8', x - 8 * u, baseY - 44 * u, 16 * u, 18 * u);
      wash('#9CC3DD', x - 8 * u, baseY - 26 * u, 16 * u, 22 * u);
      wash('#F3CBAA', x - 7 * u, baseY - 60 * u, 14 * u, 14 * u);
      skRect(g, x - 7 * u, baseY - 60 * u, 14 * u, 14 * u);            // head
      sk(g, x + 7 * u, baseY - 56 * u, x + 10 * u, baseY - 40 * u, 2);  // braid
      g.fillStyle = PEN; g.beginPath(); g.arc(x + 10 * u, baseY - 39 * u, 1.6 * u, 0, 7); g.fill();
      g.fillStyle = PEN; g.fillRect(x - 7 * u, baseY - 60 * u, 14 * u, 3 * u);  // fringe
      skRect(g, x - 8 * u, baseY - 44 * u, 16 * u, 18 * u);            // blouse
      skRect(g, x - 8 * u, baseY - 26 * u, 16 * u, 22 * u);            // longyi
      sk(g, x - 4 * u, baseY - 4 * u, x - 4 * u, baseY, 1.6); sk(g, x + 4 * u, baseY - 4 * u, x + 4 * u, baseY, 1.6);
      // face: calm, warm, or boiling
      const fy = baseY - 53 * u;
      g.strokeStyle = PEN; g.lineWidth = 1.4;
      if (boil) { sk(g, x - 4 * u, fy - 2 * u, x - 1.5 * u, fy - 0.5 * u, 1.4); sk(g, x + 4 * u, fy - 2 * u, x + 1.5 * u, fy - 0.5 * u, 1.4); g.beginPath(); g.moveTo(x - 2.5 * u, fy + 4 * u); g.lineTo(x + 2.5 * u, fy + 4 * u); g.stroke(); }
      else { g.fillStyle = PEN; g.fillRect(x - 3.5 * u, fy - 1 * u, 1.6 * u, 2 * u); g.fillRect(x + 2 * u, fy - 1 * u, 1.6 * u, 2 * u); g.beginPath(); g.arc(x, fy + 2.5 * u, 2 * u, 0.2, Math.PI - 0.2); g.stroke(); }
      // arms
      if (boil) { sk(g, x - 8 * u, baseY - 42 * u, x - 13 * u, baseY - 30 * u, 1.6); sk(g, x + 8 * u, baseY - 42 * u, x + 13 * u, baseY - 30 * u, 1.6); skRect(g, x - 15 * u, baseY - 31 * u, 4 * u, 4 * u); skRect(g, x + 11 * u, baseY - 31 * u, 4 * u, 4 * u); }
      else { sk(g, x - 8 * u, baseY - 42 * u, x - 10 * u, baseY - 28 * u, 1.6); sk(g, x + 8 * u, baseY - 42 * u, x + 10 * u, baseY - 28 * u, 1.6); }
      // the steam cup over her head
      drawCup(g, x + 1 * u, baseY - 77 * u, u * 0.85, fr.cool ? 0 : f.cup, time, boil);
      // the boil itself, big beside her: the cup on its saucer, lid of steam, bubbles, shaking
      if (fr.prop === 'boil') {
        const cx = W * 0.74, s2 = u * 2.3;
        g.fillStyle = 'rgba(74,72,80,.12)'; g.beginPath(); g.ellipse(cx, baseY - 1 * u, 21 * s2 / 2.3 * 1.15, 3 * u, 0, 0, 7); g.fill();
        sk(g, cx - 20 * u, baseY - 3 * u, cx + 20 * u, baseY - 3 * u, 2.2);           // saucer
        drawCup(g, cx, baseY - 36 * u, s2, fr.cool ? 0 : 5, time, !fr.cool);
        if (!fr.cool) { // a spill running down the side
          g.strokeStyle = 'rgba(192,57,43,.55)'; g.lineWidth = 2.2; g.lineCap = 'round';
          g.beginPath(); g.moveTo(cx - 20 * u, baseY - 36 * u + 4 * s2); g.quadraticCurveTo(cx - 22 * u, baseY - 18 * u, cx - 19 * u, baseY - 5 * u); g.stroke();
        }
      }
      // the gold key: a little ink tick in the corner
      if (fr.gold) { g.strokeStyle = '#A47A2C'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(W - 26, 16); g.lineTo(W - 20, 22); g.lineTo(W - 9, 9); g.stroke(); }
    }
    function drawCup(g, x, y, s, wisps, time, boil) {
      g.save();
      g.translate(x - 15 * s + (boil ? Math.sin(time * 50) * 1.2 : 0), y - 17 * s);
      g.scale(s, s);
      g.lineCap = 'round'; g.lineJoin = 'round';
      const hot = wisps >= 3;
      for (let i = 0; i < Math.min(5, wisps + (hot ? 1 : 0)); i++) {
        const ox = 7 + i * 4.5, wob = Math.sin(time * 3 + i) * 1.2;
        g.strokeStyle = hot ? '#C0392B' : '#8E8C96'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(ox, 15); g.bezierCurveTo(ox - 2 + wob, 12, ox + 2 + wob, 9, ox + wob, 5); g.stroke();
      }
      g.fillStyle = hot ? '#F2C2B0' : '#FFFDF8'; g.strokeStyle = PEN; g.lineWidth = 2;
      g.beginPath(); g.moveTo(5, 17); g.lineTo(23, 17); g.lineTo(23, 26.5); g.quadraticCurveTo(23, 31, 18.5, 31); g.lineTo(9.5, 31); g.quadraticCurveTo(5, 31, 5, 26.5); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(23, 19.5); g.lineTo(25.2, 19.5); g.arc(25.2, 22.5, 3, -Math.PI / 2, Math.PI / 2); g.lineTo(23, 25.5); g.stroke();
      g.strokeStyle = '#C9A24A'; g.beginPath(); g.moveTo(5, 21); g.lineTo(23, 21); g.stroke();
      if (boil) { g.fillStyle = 'rgba(192,57,43,.8)'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(9 + k * 5, 15 - ((time * 20 + k * 4) % 8), 1.4, 0, 7); g.fill(); } }
      g.restore();
    }

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      for (const fr of frames) {
        let dirty = fr.f.cup >= 3 || fr.f.cup >= 1;
        if (fr.cool > 0) { fr.cool = Math.max(0, fr.cool - dt); dirty = true; }
        if (fr.gold && fr.gold < 1) { fr.gold = Math.min(1, fr.gold + dt * 1.6); dirty = true; }
        if (dirty) drawFrame(fr, t);
      }
      if (!A.closed()) raf = requestAnimationFrame(frame);
    }
    build(0);
    raf = requestAnimationFrame(frame);

    // tests and accessibility: "find it for me"
    A.wrap.autoRecall = async ({ wrongFirst = true } = {}) => {
      let first = wrongFirst;
      for (let k = ev; k < evenings.length && !A.closed(); k++) {
        while (busy) await wait(80);
        await wait(500);
        if (first) { first = false; const wi = frames.findIndex((x) => !x.f.key); frames[wi].el.click(); await wait(1200); }
        const ki = frames.findIndex((x) => x.f.key);
        frames[ki].el.click();
        await wait(1700);
      }
    };
    window.__act = A.wrap;
  });
}

// ---- pencil helpers
function sk(g, x1, y1, x2, y2, w = 1.6, c = PEN) {
  g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  g.globalAlpha = 0.35; g.lineWidth = w * 0.7;
  g.beginPath(); g.moveTo(x1 + 0.8, y1 + 0.6); g.lineTo(x2 + 0.5, y2 + 0.9); g.stroke();
  g.globalAlpha = 1;
}
function skRect(g, x, y, w, h, lw = 1.6) { sk(g, x, y, x + w, y, lw); sk(g, x + w, y, x + w, y + h, lw); sk(g, x + w, y + h, x, y + h, lw); sk(g, x, y + h, x, y, lw); }
function wash(g, c, x, y, w, h, a = 0.5) { g.fillStyle = c; g.globalAlpha = a; g.fillRect(x, y, w, h); g.globalAlpha = 1; }
function kid(g, x, baseY, u, color, laugh) {
  wash(g, color, x - 6 * u, baseY - 32 * u, 12 * u, 14 * u);
  wash(g, '#E8B48E', x - 5 * u, baseY - 44 * u, 10 * u, 11 * u);
  skRect(g, x - 5 * u, baseY - 44 * u, 10 * u, 11 * u);
  skRect(g, x - 6 * u, baseY - 32 * u, 12 * u, 14 * u);
  sk(g, x - 3 * u, baseY - 18 * u, x - 3 * u, baseY); sk(g, x + 3 * u, baseY - 18 * u, x + 3 * u, baseY);
  g.fillStyle = PEN; g.fillRect(x - 5 * u, baseY - 44 * u, 10 * u, 2.4 * u);
  if (laugh) { g.beginPath(); g.arc(x, baseY - 37 * u, 2.2 * u, 0, Math.PI); g.fill(); }
}
function drawProp(g, kind, W, H, baseY, t, f) {
  const u = H / 100;
  const rx = W * 0.72;
  switch (kind) {
    case 'tease': {
      kid(g, rx, baseY, u, '#E0A35A', true); kid(g, rx + 15 * u, baseY, u * 0.9, '#8DB86A', true);
      g.strokeStyle = PEN; g.lineWidth = 1.3;
      for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(rx - 10 * u - k * 5 * u, baseY - 52 * u - k * 4 * u, 2.2 * u, Math.PI, 0); g.stroke(); }
      break;
    }
    case 'drip': {
      sk(g, 0, 8 * u, W, 4 * u, 2); sk(g, W * 0.35, 6 * u, W * 0.5, 14 * u, 1.4);
      g.fillStyle = '#7FA8C9';
      for (let k = 0; k < 4; k++) { const y = 16 * u + ((t * 40 + k * 22) % (baseY - 20 * u)); g.beginPath(); g.ellipse(W * 0.47 + k * 2, y, 1.6, 2.6, 0, 0, 7); g.fill(); }
      wash(g, '#7FA8C9', W * 0.42, baseY - 2, 14 * u, 3, 0.6);
      break;
    }
    case 'cover': {
      skRect(g, rx - 12 * u, baseY - 34 * u, 30 * u, 34 * u, 1.8);      // the loom
      for (let k = 0; k < 6; k++) sk(g, rx - 9 * u + k * 5 * u, baseY - 32 * u, rx - 9 * u + k * 5 * u, baseY - 4 * u, 0.8, 'rgba(74,72,80,.6)');
      g.save(); g.translate(rx + 18 * u, baseY - 34 * u); g.rotate(-0.55 - Math.sin(t * 2) * 0.05);   // the cover, lifted from one corner
      wash(g, '#C47A45', -32 * u, -2 * u, 32 * u, 5 * u, 0.7); skRect(g, -32 * u, -2 * u, 32 * u, 5 * u, 1.4);
      g.restore();
      sk(g, rx + 22 * u, baseY - 50 * u, rx + 30 * u, baseY - 44 * u, 2.2);  // a hand from outside the frame
      skRect(g, rx + 18 * u, baseY - 54 * u, 5 * u, 5 * u, 1.4);
      break;
    }
    case 'spill': {
      g.save(); g.translate(rx, baseY - 30 * u); g.rotate(-0.9);
      skRect(g, -5 * u, -6 * u, 10 * u, 12 * u); g.restore();
      g.fillStyle = 'rgba(176,103,58,.55)';
      for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(rx - 10 * u - k * 4 * u, baseY - 26 * u + k * 3 * u, 1.6 + (k % 2), 0, 7); g.fill(); }
      kid(g, rx + 14 * u, baseY, u * 0.75, '#E8879A', false);
      break;
    }
    case 'radio': {
      wash(g, '#C9A16E', rx, baseY - 20 * u, 22 * u, 14 * u, 0.6); skRect(g, rx, baseY - 20 * u, 22 * u, 14 * u);
      g.strokeStyle = PEN; g.beginPath(); g.arc(rx + 7 * u, baseY - 13 * u, 4 * u, 0, 7); g.stroke();
      sk(g, rx + 16 * u, baseY - 20 * u, rx + 22 * u, baseY - 32 * u, 1.2);
      for (let k = 1; k <= 3; k++) { g.lineWidth = 1.3; g.beginPath(); g.arc(rx + 11 * u, baseY - 13 * u, (8 + k * 5 + (t * 8) % 5) * u * 0.6, -2.4, -0.7); g.stroke(); }
      break;
    }
    case 'gift': {
      wash(g, '#E9C4C8', rx - 4 * u, baseY - 16 * u, 20 * u, 16 * u, 0.7); skRect(g, rx - 4 * u, baseY - 16 * u, 20 * u, 16 * u);
      sk(g, rx + 6 * u, baseY - 16 * u, rx + 6 * u, baseY, 1.4, '#B3322E');
      g.save(); g.translate(rx - 4 * u, baseY - 16 * u); g.rotate(-0.5); skRect(g, -2 * u, -5 * u, 22 * u, 5 * u); g.restore(); // the lid, off
      sk(g, rx + 20 * u, baseY - 30 * u, rx + 12 * u, baseY - 18 * u, 2.2); skRect(g, rx + 19 * u, baseY - 34 * u, 5 * u, 5 * u, 1.4);
      break;
    }
    case 'bag': {
      wash(g, '#E0B04A', rx - 4 * u, baseY - 14 * u, 20 * u, 14 * u, 0.7); skRect(g, rx - 4 * u, baseY - 14 * u, 20 * u, 14 * u);
      g.strokeStyle = PEN; g.lineWidth = 1.4; g.beginPath(); g.arc(rx + 6 * u, baseY - 14 * u, 8 * u, Math.PI, 0); g.stroke();
      sk(g, rx - 2 * u, baseY - 18 * u, rx + 2 * u, baseY - 22 * u, 1.2); sk(g, rx + 9 * u, baseY - 18 * u, rx + 11 * u, baseY - 24 * u, 1.2); // things peeking out
      sk(g, rx + 24 * u, baseY - 30 * u, rx + 14 * u, baseY - 16 * u, 2.2); skRect(g, rx + 22 * u, baseY - 34 * u, 5 * u, 5 * u, 1.4);
      break;
    }
    case 'crowd': {
      kid(g, rx, baseY, u, '#9A9A96', false); kid(g, rx + 14 * u, baseY, u, '#C47A45', false); kid(g, rx + 26 * u, baseY, u * 0.95, '#7C93A8', false);
      for (let k = 0; k < 3; k++) sk(g, rx - 12 * u, baseY - 30 * u + k * 6 * u, rx - 20 * u, baseY - 30 * u + k * 6 * u, 1.2);
      break;
    }
    case 'bread': {
      for (let k = 0; k < 4; k++) { const bx = rx - 8 * u + k * 9 * u, by = baseY - 4 * u - (k % 2) * 2 * u; wash(g, '#D9A55A', bx, by, 8 * u, 5 * u, 0.8); skRect(g, bx, by, 8 * u, 5 * u, 1.2); }
      g.save(); g.translate(rx + 22 * u, baseY - 10 * u); g.rotate(0.5); skRect(g, -10 * u, -4 * u, 20 * u, 8 * u); g.restore(); // the tipped tray
      break;
    }
    case 'boil': {
      g.strokeStyle = 'rgba(192,57,43,.6)'; g.lineWidth = 1.4;
      for (let k = 0; k < 6; k++) { const a = k * 1.05 + t * 0.5; g.beginPath(); g.moveTo(W * 0.36 + Math.cos(a) * 26 * u, baseY - 40 * u + Math.sin(a) * 22 * u); g.lineTo(W * 0.36 + Math.cos(a) * 32 * u, baseY - 40 * u + Math.sin(a) * 28 * u); g.stroke(); }
      break;
    }
    default: break;
  }
  void f;
}

function injectRecallStyle() {
  if (document.getElementById('act-recall-style')) return;
  const s = document.createElement('style');
  s.id = 'act-recall-style';
  s.textContent = `
  .ak-recall .ak-sub { letter-spacing: 0 !important; word-spacing: 0; font-kerning: normal; text-rendering: geometricPrecision; }
  .ak-recall .act-card { width: min(100%, 470px); }
  .rc-head { display: flex; align-items: flex-end; gap: 8px; margin: 0 2px 8px; text-align: left; min-height: 46px; }
  .rc-say { position: relative; flex: 1; min-height: 40px; padding: 6px 11px; border-radius: 14px 14px 14px 4px; background: #FFFDF8; border: 2px solid #E2D5B8;
    font: 600 13px/1.6 "Noto Sans Myanmar", system-ui, sans-serif; color: #4A3826; box-sizing: border-box; }
  .rc-say:has(p:empty) { visibility: hidden; }
  .rc-say p { margin: 0; } .rc-say .ak-sub { font-size: 10.5px; }
  .rc-say.in { animation: rcsay .35s cubic-bezier(.2,1.3,.4,1) both; }
  .rc-say::before { content: ""; position: absolute; left: -8px; bottom: 6px; border: 6px solid transparent; border-right-color: #E2D5B8; }
  .rc-strip { padding: 8px; border-radius: 6px; background: #F3E9D2; box-shadow: 0 2px 0 #E2D5B8, 0 6px 14px rgba(59,42,26,.1); transition: transform .3s, opacity .3s; }
  .rc-strip.out { opacity: 0; transform: translateY(-30px) scale(.9); } .rc-strip.in { animation: rcin .45s cubic-bezier(.2,1.2,.4,1) both; }
  .rc-strip.fold { opacity: .2; transform: scale(.94); }
  .rc-label { font: 700 13.5px/1.5 "Noto Sans Myanmar", system-ui, sans-serif; color: #6E1F2A; margin-bottom: 6px; }
  .rc-label .ak-sub { font-size: 10.5px; }
  .rc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; counter-reset: f; }
  .rc-frame { position: relative; display: flex; flex-direction: column; gap: 3px; padding: 4px 4px 6px; border-radius: 4px; border: 2px solid #4A4850; background: #FFFDF8; cursor: pointer;
    font: 600 12px/1.5 "Noto Sans Myanmar", system-ui, sans-serif; color: #2A2118; box-shadow: 2px 3px 0 rgba(74,72,80,.25); animation: rcf .4s var(--d) cubic-bezier(.2,1.3,.4,1) both; transition: border-color .3s, box-shadow .3s; }
  .rc-frame canvas { width: 100%; display: block; border-radius: 2px; }
  .rc-frame:active { transform: translateY(2px); }
  .rc-frame .ak-sub { font-size: 10px; font-weight: 500; }
  .rc-cap { text-align: left; padding: 0 2px; overflow-wrap: anywhere; }
  .rc-n { position: absolute; top: -8px; left: -8px; width: 20px; height: 20px; border-radius: 50%; background: #4A4850; color: #FFFDF8; font: 700 11px/20px "Noto Sans Myanmar", system-ui; z-index: 2; }
  .rc-frame.gold { border-color: #C9A24A; box-shadow: 0 0 0 3px rgba(201,162,74,.4), 2px 3px 0 #C9A24A; }
  .rc-frame.gold .rc-n { background: #C9A24A; }
  .rc-dots { display: flex; justify-content: center; gap: 8px; margin-top: 10px; }
  .rc-dots i { width: 10px; height: 10px; border-radius: 50%; border: 2px solid #C9A24A; }
  .rc-dots i.on { background: #C9A24A; } .rc-dots i.cur { background: #6E1F2A; border-color: #6E1F2A; }
  .rc-dots i.pop { animation: rcmini .45s cubic-bezier(.2,1.3,.4,1) both; }
  @keyframes rcf { from { opacity: 0; transform: translateY(8px) rotate(-1deg); } }
  @keyframes rcin { from { opacity: 0; transform: translateX(40px); } }
  @keyframes rcmini { from { opacity: 0; transform: scale(1.4); } }
  @keyframes rcsay { from { opacity: 0; transform: translateY(4px); } }
  `;
  document.head.appendChild(s);
}
void wash;
