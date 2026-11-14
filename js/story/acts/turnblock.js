// Handwork pattern "look": one type block, two people (Day 8, ch 13, in the press).
//
//   const r = await turnblock({ title, hint, glyph = '6', sides: [{ who, reads, line }, { who, reads, line }] })
//   r = { ok: true, turns: n }     (cancel: { ok: false, cancelled: true, turns })
//
// One big wooden type block, face on, on the printer's stone. The person whose side is nearest you sits at
// the bottom edge with their line; the other sits across the stone. Drag round the block (or tap the curved
// arrow) to turn it half round; mid-turn the face blurs and a veil of ink-dust covers it, so only ONE
// reading is ever readable on screen. When it settles the other way up, the other person comes round to
// your side and says their line. Done once both sides are seen (turning back and forth stays allowed).
// The glyph is drawn as a carved, raised shape (a path, not text): '6' has its own drawing; any other
// short glyph is cut from the font. The light stays fixed while the block turns.
//
// Test hook: window.__act.autoTurn()
import { openAct, bi, wait, buzz, clamp, lerp, ease } from './kit.js';
import { whoChip } from './sort.js';

const T = {
  turn: { my: 'လှည့်မယ်', en: 'Turn' },
  both: { my: 'နှစ်ဖက်လုံး မြင်ပြီ', en: "I've seen both sides" },
  drag: { my: 'တုံးကို လက်နဲ့ ဝိုင်းဆွဲ၍ လှည့်ပါ', en: 'Drag round the block to turn it' },
};

export function turnblock({ title = '', hint = '', glyph = '6', sides = [] } = {}) {
  return new Promise((resolve) => {
    let raf = 0, turns = 0;
    const A = openAct({ title, hint, kind: 'turn', resolve: (r) => { cancelAnimationFrame(raf); resolve(r); }, onCancel: () => ({ turns }) });
    injectTurnStyle();
    A.body.innerHTML = `<div class="tb-stage"><canvas></canvas><span class="tb-p p0"></span><span class="tb-p p1"></span>
      <button type="button" class="tb-arrow" aria-label="လှည့်မယ် / Turn"><svg viewBox="0 0 48 48"><path d="M10 26a14 14 0 0 1 26-9" fill="none" stroke="#6E1F2A" stroke-width="4" stroke-linecap="round"/><path d="M39 9l-1 11-10-3z" fill="#6E1F2A"/><path d="M38 22a14 14 0 0 1-26 9" fill="none" stroke="#C9A24A" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 5"/></svg></button></div>
      <div class="tb-say"><span class="tb-sw"></span><p class="ak-bi"></p></div>
      <button type="button" class="ak-btn tb-done ak-bi" hidden></button>`;
    const stage = A.body.querySelector('.tb-stage');
    const cv = stage.querySelector('canvas');
    const pEls = [stage.querySelector('.p0'), stage.querySelector('.p1')];
    const sayEl = A.body.querySelector('.tb-say');
    const doneBtn = A.body.querySelector('.tb-done');
    bi(doneBtn, T.both);
    sides.forEach((sd, i) => { if (sd?.who) pEls[i].appendChild(whoChip(sd.who, { face: 'talk', size: 54 })); });

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round(Math.min(A.body.clientWidth || 360, 420));
    const H = Math.round(W * 0.9);
    cv.style.width = `${W}px`; cv.style.height = `${H}px`;
    cv.width = W * dpr; cv.height = H * dpr;
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const stone = makeStone(W, H);
    const cx = W / 2, cy = H / 2, S0 = Math.min(W, H) * 0.5;

    const S = { a: 0, to: 0, dragging: false, a0: 0, p0: 0, side: 0, seen: new Set([0]), t: 0, sayFor: -1, anim: null };

    function showSay(side) {
      const sd = sides[side];
      if (!sd) return;
      S.sayFor = side;
      const w = sayEl.querySelector('.tb-sw');
      w.replaceChildren(sd.who ? whoChip(sd.who, { face: 'talk', size: 34 }) : '');
      bi(sayEl.querySelector('p'), sd.line);
      sayEl.classList.remove('in', 'out'); void sayEl.offsetWidth; sayEl.classList.add('in');
      stage.classList.toggle('flip', side === 1);
    }
    showSay(0);

    function settle(to) {
      S.to = to;
      const side = Math.round(to / Math.PI) % 2 === 0 ? 0 : 1;
      if (side !== S.side) {
        turns++;
        S.side = side;
        S.seen.add(side);
        buzz(16);
        setTimeout(() => { if (!A.closed()) showSay(side); }, 260);
        if (S.seen.size >= 2 && doneBtn.hidden) setTimeout(() => { doneBtn.hidden = false; }, 900);
      } else if (S.sayFor !== side) showSay(side);
    }
    function turnBy(dir = 1) {
      if (S.dragging) return;
      const from = S.a, to = Math.round(S.a / Math.PI) * Math.PI + dir * Math.PI;
      S.anim = { from, to, t: 0 };
      sayEl.classList.add('out');
    }
    stage.querySelector('.tb-arrow').addEventListener('click', () => turnBy(1));
    doneBtn.addEventListener('click', async () => { doneBtn.disabled = true; await A.seal(true); A.done({ ok: true, turns }); });

    // drag round the centre to turn
    const angAt = (e) => { const r = cv.getBoundingClientRect(); return Math.atan2(e.clientY - r.top - cy, e.clientX - r.left - cx); };
    cv.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      cv.setPointerCapture(e.pointerId);
      S.dragging = true; S.anim = null;
      S.p0 = angAt(e); S.a0 = S.a;
      sayEl.classList.add('out');
    });
    cv.addEventListener('pointermove', (e) => {
      if (!S.dragging) return;
      let d = angAt(e) - S.p0;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      S.a = S.a0 + d;
      // a fresh start for the next half circle, so long drags keep turning
      if (Math.abs(d) > Math.PI * 0.9) { S.p0 = angAt(e); S.a0 = S.a; }
    });
    const up = () => {
      if (!S.dragging) return;
      S.dragging = false;
      const moved = Math.abs(S.a - S.to);
      if (moved < 0.08) { turnBy(1); return; } // a tap on the block also turns it
      S.anim = { from: S.a, to: Math.round(S.a / Math.PI) * Math.PI, t: 0 };
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);

    // ---- drawing
    function glyphPath(gg, s) {
      gg.beginPath();
      if (String(glyph) === '6') {
        gg.moveTo(0.2 * s, 0.17 * s);
        gg.arc(0, 0.17 * s, 0.2 * s, 0, Math.PI * 2);
        gg.moveTo(-0.2 * s, 0.17 * s);
        gg.bezierCurveTo(-0.23 * s, -0.17 * s, -0.04 * s, -0.37 * s, 0.17 * s, -0.35 * s);
        return 'stroke';
      }
      return 'text';
    }
    function drawGlyphLayer(color, dx, dy, alpha, wk = 1) {
      const s = S0 * 0.86;
      g.save();
      g.translate(cx + dx, cy + dy);
      g.rotate(S.a);
      g.globalAlpha = alpha;
      const mode = glyphPath(g, s);
      g.strokeStyle = color; g.fillStyle = color;
      if (mode === 'stroke') { g.lineWidth = 0.12 * s * wk; g.lineCap = 'round'; g.stroke(); }
      else { g.font = `800 ${s * 0.62}px "Noto Sans Myanmar", system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(glyph), 0, s * 0.02); }
      g.restore();
    }
    function draw() {
      g.clearRect(0, 0, W, H);
      g.drawImage(stone, 0, 0, W, H);
      const turnAmt = Math.abs(Math.sin(S.a));                // 0 settled, 1 sideways
      const blur = clamp((turnAmt - 0.12) / 0.45);
      // the block: shadow, body (wood sides a little visible), the face
      g.save();
      g.translate(cx, cy);
      g.fillStyle = 'rgba(20,24,30,.35)';
      g.save(); g.translate(7, 10); g.rotate(S.a); g.beginPath(); g.roundRect(-S0 / 2, -S0 / 2, S0, S0, 10); g.fill(); g.restore();
      g.rotate(S.a);
      g.fillStyle = '#9A6A3E'; g.beginPath(); g.roundRect(-S0 / 2 - 4, -S0 / 2 - 4, S0 + 8, S0 + 8, 12); g.fill();
      g.strokeStyle = '#2A2118'; g.lineWidth = 2.4; g.stroke();
      // end grain with rings, ink-stained
      const fg = g.createRadialGradient(S0 * 0.1, S0 * 0.15, 4, 0, 0, S0 * 0.8);
      fg.addColorStop(0, '#D4A873'); fg.addColorStop(1, '#B98A55');
      g.fillStyle = fg; g.beginPath(); g.roundRect(-S0 / 2, -S0 / 2, S0, S0, 8); g.fill();
      g.save(); g.beginPath(); g.roundRect(-S0 / 2, -S0 / 2, S0, S0, 8); g.clip();
      g.strokeStyle = 'rgba(120,76,36,.28)'; g.lineWidth = 1.4;
      for (let r = 8; r < S0 * 0.9; r += 9) { g.beginPath(); g.ellipse(-S0 * 0.62, S0 * 0.58, r * 1.1, r, 0.3, 0, 7); g.stroke(); }
      g.fillStyle = 'rgba(43,39,51,.12)'; g.beginPath(); g.ellipse(0, 0, S0 * 0.42, S0 * 0.45, 0, 0, 7); g.fill(); // ink halo round the letter
      g.restore();
      // the side nick (a type block's groove) on one edge: it shows which way up the block is
      g.fillStyle = '#5A3B22'; g.fillRect(-S0 * 0.22, S0 / 2 + 0.5, S0 * 0.44, 3.5);
      g.restore();
      // the cut-away well round the letter: an inset bevel lit from the top left (screen space, so the light
      // stays put while the block turns): a shadow band along the upper-left inner edges, a pale lip lower right
      const well = (ox, oy) => { g.save(); g.translate(cx + ox, cy + oy); g.rotate(S.a); g.beginPath(); g.roundRect(-S0 * 0.41, -S0 * 0.41, S0 * 0.82, S0 * 0.82, 10); g.restore(); };
      well(0, 0); g.fillStyle = 'rgba(110,70,34,.16)'; g.fill();
      g.save(); well(0, 0); g.clip();
      well(3.5, 4.5); g.strokeStyle = 'rgba(64,36,14,.5)'; g.lineWidth = 8; g.stroke();
      well(-2.5, -3); g.strokeStyle = 'rgba(255,238,204,.6)'; g.lineWidth = 5; g.stroke();
      g.restore();
      well(0, 0); g.strokeStyle = 'rgba(70,44,20,.55)'; g.lineWidth = 1.2; g.stroke();
      // the raised letter: shadow, side wall, lit edge, inked face (shadow and light stay in screen space)
      const copies = blur > 0.02 ? 5 : 1;
      for (let k = 0; k < copies; k++) {
        const j = copies === 1 ? 0 : (k / (copies - 1) - 0.5) * 0.5 * blur;
        const a0 = S.a; S.a = a0 + j;
        const al = copies === 1 ? 1 : 0.24;
        drawGlyphLayer('rgba(40,22,8,.45)', 5, 6.5, al, 1.12);
        drawGlyphLayer('#4A2E18', 2.6, 3.4, al, 1.04);
        drawGlyphLayer('#6E4A28', 1.3, 1.7, al);
        drawGlyphLayer('#F6E4BC', -1.3, -1.5, al * 0.95);
        drawGlyphLayer('#2B2733', 0, 0, al);
        if (copies === 1) drawGlyphLayer('rgba(120,112,140,.55)', -0.9, -1.1, al, 0.28);
        S.a = a0;
      }
      // the veil of ink dust mid-turn: never two readings at once
      if (blur > 0.02) {
        g.save(); g.translate(cx, cy);
        const vg = g.createRadialGradient(0, 0, 0, 0, 0, S0 * 0.6);
        vg.addColorStop(0, `rgba(196,152,100,${0.85 * blur})`); vg.addColorStop(1, `rgba(196,152,100,${0.4 * blur})`);
        g.fillStyle = vg; g.beginPath(); g.arc(0, 0, S0 * 0.56, 0, 7); g.fill();
        g.restore();
      }
      // a soft gleam on the face
      g.save(); g.translate(cx, cy); g.rotate(-0.6);
      g.fillStyle = 'rgba(255,250,235,.12)'; g.fillRect(-S0 * 0.7, -S0 * 0.45, S0 * 1.4, S0 * 0.12);
      g.restore();
    }

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      S.t += dt;
      if (S.anim) {
        S.anim.t = Math.min(1, S.anim.t + dt / 0.7);
        S.a = lerp(S.anim.from, S.anim.to, ease(S.anim.t));
        if (S.anim.t >= 1) { const to = S.anim.to; S.anim = null; S.a = to; settle(to); }
      }
      draw();
      if (!A.closed()) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    A.setHint(hint || T.drag);

    // tests and accessibility: "turn it for me" (both ways, then done)
    const settled = async () => { await wait(100); while (S.anim && !A.closed()) await wait(80); await wait(700); };
    A.wrap.autoTurn = async () => {
      await wait(400); turnBy(1); await settled();
      turnBy(1); await settled();
      while (doneBtn.hidden && !A.closed()) await wait(100);
      doneBtn.click();
    };
    A.wrap.state = S;
    window.__act = A.wrap;
  });
}

// the printer's stone: blue-grey slab with speckles, a few old ink marks and a brass composing rule
function makeStone(W, H) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const c = document.createElement('canvas');
  c.width = W * dpr; c.height = H * dpr;
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#8E9A9E'); bg.addColorStop(1, '#78868B');
  g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, W, H, 14); g.fill();
  for (let i = 0; i < 900; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(20,28,32,.12)'; g.fillRect(rnd() * W, rnd() * H, 1.5, 1.5); }
  for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(30,30,40,.18)'; g.beginPath(); g.ellipse(rnd() * W, rnd() * H, 8 + rnd() * 20, 4 + rnd() * 9, rnd() * 3, 0, 7); g.fill(); }
  // stray quads and a brass rule lying on the stone
  g.fillStyle = '#B7A07A'; g.strokeStyle = '#2A2118'; g.lineWidth = 1.2;
  g.save(); g.translate(W * 0.12, H * 0.84); g.rotate(-0.12); g.fillStyle = '#C9A24A'; g.fillRect(0, 0, W * 0.3, 5); g.strokeRect(0, 0, W * 0.3, 5); g.restore();
  for (let i = 0; i < 4; i++) { g.save(); g.translate(W * (0.72 + i * 0.05), H * (0.1 + (i % 2) * 0.04)); g.rotate(rnd()); g.fillStyle = '#A9825A'; g.fillRect(0, 0, 13, 13); g.strokeRect(0, 0, 13, 13); g.restore(); }
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; g.beginPath(); g.roundRect(3, 3, W - 6, H - 6, 12); g.stroke();
  return c;
}

function injectTurnStyle() {
  if (document.getElementById('act-turn-style')) return;
  const s = document.createElement('style');
  s.id = 'act-turn-style';
  s.textContent = `
  .ak-turn .ak-sub { letter-spacing: 0 !important; word-spacing: 0; font-kerning: normal; text-rendering: geometricPrecision; }
  .ak-turn .act-card { width: min(100%, 460px); }
  .tb-stage { position: relative; margin-bottom: 4px; }
  .tb-stage canvas { border-radius: 14px; box-shadow: 0 4px 12px rgba(59,42,26,.2); cursor: grab; }
  .tb-p { position: absolute; left: 50%; transition: top .6s cubic-bezier(.4,.1,.3,1), transform .6s, opacity .6s; transform: translateX(-50%); z-index: 2; pointer-events: none; }
  .tb-p .ak-who { box-shadow: 0 3px 8px rgba(0,0,0,.25); }
  .tb-p.p0 { top: calc(100% - 44px); } .tb-p.p1 { top: -14px; transform: translateX(-50%) scale(.72); opacity: .8; }
  .tb-stage.flip .tb-p.p0 { top: -14px; transform: translateX(-50%) scale(.72); opacity: .8; }
  .tb-stage.flip .tb-p.p1 { top: calc(100% - 44px); transform: translateX(-50%) scale(1); opacity: 1; }
  .tb-arrow { position: absolute; right: 10px; bottom: 10px; width: 52px; height: 52px; border-radius: 50%; border: 2px solid #E2D5B8; background: #FFFDF8; padding: 3px; cursor: pointer;
    box-shadow: 0 3px 0 #C9A24A; z-index: 3; }
  .tb-arrow:active { transform: translateY(2px); box-shadow: 0 1px 0 #C9A24A; }
  .tb-arrow svg { width: 100%; height: 100%; }
  .tb-say { display: flex; align-items: center; gap: 8px; margin: 18px 4px 10px; padding: 8px 12px 8px 8px; min-height: 48px; border-radius: 14px; background: #FFFDF8; border: 2px solid #E2D5B8;
    text-align: left; font: 600 13.5px/1.6 "Noto Sans Myanmar", system-ui, sans-serif; color: #4A3826; transition: opacity .2s; }
  .tb-say p { margin: 0; } .tb-say .ak-sub { font-size: 10.5px; }
  .tb-say.in { animation: sosay3 .4s cubic-bezier(.2,1.3,.4,1) both; } .tb-say.out { opacity: 0; }
  .tb-done { margin-top: 2px; }
  @keyframes sosay3 { from { opacity: 0; transform: translateY(6px); } }
  `;
  document.head.appendChild(s);
}
