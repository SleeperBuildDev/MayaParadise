// Handwork: guide someone's reading at their pace (Day 3, ch 9 · karuna: meet someone who knows less
// without talking down; go at their pace).
//
//   const r = await guide({ title, hint, labels: [{ word: { my, en }, sylls: [string], picture }], pace = 70, lag = 0.6,
//                           alone = labels.length - 1, readFor: { my, en }, react: { lost, sorry, readFor, readForMaya, alone } })
//   r = { ok: boolean, lost: n, readFor: n }   (cancel: { ok: false, cancelled: true, lost, readFor })
//
// An exercise-book strip (ruled blue lines, a red margin). Left: the parcel's picture tag ('book', 'scale',
// 'jasmine': a potter's wheel with a jasmine string, or any emoji). Right: the label in big Burmese, split
// into syllable cells. The player drags Su Nwe's yellow pencil under the cells; Maung Nge's small brown
// fingertip follows `lag` seconds behind and each cell turns gold as his finger reaches it, with the sound
// in a little bubble. Faster than `pace` px/s (scaled to a 360 px strip): his finger stops, a "?" pops,
// the cells past his finger fade, react.lost (him) then react.sorry (her); bring the pencil back to his
// finger to go on (`lost` counts). Label `alone`: no pencil, her hands are on the desk; his finger walks by
// itself and stops once on the second syllable. The read-for-him button (its cost on it: "his turn −1") sits in the corner the whole time;
// pressing it (or tapping the label while he reads alone) reads it for him: `readFor` +1, his hand drops,
// react.readFor, then Maya's react.readForMaya, and the label starts again. No fail state, no timer.
//
// Test hook: window.__act.autoGuide(care = 1)   (care < .5 rushes the pencil once and reads one label for him)
import { openAct, bi, wait, buzz, clamp, lerp, ease, seededRandom } from './kit.js';
import { tr } from '../../game/ui.js';
import { paperStage, sayBox, runLoop, rr, fillStroke, bubble, sparkle, SKINS, MYF, OUT, INK, shade } from './steady.js';

const T = {
  him: 'maungnge', her: 'sunwe',
  again: { my: 'ဒီတံဆိပ် ပြန်စမယ်', en: 'This label again' },
  waitFinger: { my: 'ခဲတံကို သူ့လက်ချောင်းဆီ ပြန်ယူခဲ့ပါ', en: 'Bring the pencil back to his finger' },
  alone: { my: 'ဒီတစ်ခု သူ ကိုယ်တိုင် ဖတ်မယ် — လက်ကို ဘေးမှာ ထားပါ', en: 'He reads this one himself: keep your hands still' },
  next: { my: 'နောက်တစ်ထုပ်', en: 'Next parcel' },
};

export function guide({ title = '', hint = '', labels = [], pace = 70, lag = 0.6, alone = labels.length - 1, readFor = null, react = {} } = {}) {
  return new Promise((resolve) => {
    let lost = 0, readForN = 0;
    let stop = () => {};
    const A = openAct({ title, hint, kind: 'guide', resolve: (r) => { stop(); resolve(r); }, onCancel: () => ({ lost, readFor: readForN }) });
    const S = paperStage(A, 1.02, 'gd');
    const { g, W, H } = S;
    const say = sayBox(A);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gd-readfor';
    btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.2-4.6L16.5 4.1a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8z"/><path d="M14.5 6l3.5 3.5"/></svg><span class="ak-bi gd-rf-t"></span>
      <b class="gd-cost" aria-hidden="true"><i class="gd-fing"></i><span class="ak-bi"></span></b>`;
    bi(btn.querySelector('.gd-rf-t'), readFor || { my: 'ဖတ်ပေးလိုက်မယ်', en: 'Read it for him' });
    // what it costs, shown on the button: his finger comes off the line and his turn starts over
    bi(btn.querySelector('.gd-cost span'), { my: 'သူ့အလှည့် −၁', en: 'his turn −1' });
    S.wrap.append(btn);
    injectGuideStyle();
    const dots = document.createElement('div');
    dots.className = 'gd-dots';
    S.wrap.append(dots);

    const speed = pace * (W / 360);
    const stripY = H * 0.2, stripH = H * 0.6;
    const cellY = stripY + stripH * 0.3, cellH = stripH * 0.36;
    const trackY = cellY + cellH + H * 0.045;
    const textX0 = W * 0.4, textX1 = W * 0.95;
    const OFF = W * 0.06; // his fingertip keeps this far behind her pencil tip
    const L = { i: 0, cells: [], pen: 0, penTarget: 0, finger: 0, hist: [], lostNow: false, done: false, t: 0, gold: [], bubbles: [], qT: 0, drop: 0, aloneT: 0, pauseT: 0, paused: false, busy: false, slide: 0, shine: 0 };
    let fingerAway = 0; // 0..1 his hand lifted off the strip (after "read it for him")
    let auto = null;

    function setupLabel(i) {
      const lab = labels[i];
      L.i = i;
      L.cells = [];
      // every syllable on one row: the font shrinks to fit when a label has many
      let fs = Math.round(Math.min(H * 0.12, 46));
      const pad = W * 0.045, gap = 5;
      const widths = () => { g.font = `700 ${fs}px ${MYF}`; return lab.sylls.map((s) => Math.max(g.measureText(s).width + pad, fs * 1.15)); };
      let ws = widths();
      const avail = textX1 - textX0;
      while (fs > 18 && ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1) > avail) { fs -= 1; ws = widths(); }
      L.fs = fs;
      const total = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
      let x = textX0 + (avail - total) / 2;
      lab.sylls.forEach((s, k) => { L.cells.push({ s, x, w: ws[k] }); x += ws[k] + gap; });
      L.x0 = L.cells[0].x - W * 0.02;
      L.x1 = L.cells[L.cells.length - 1].x + L.cells[L.cells.length - 1].w + W * 0.01;
      L.pen = L.x0 + OFF; L.penTarget = L.x0 + OFF; L.finger = L.x0;
      L.hist = [];
      L.gold = L.cells.map(() => 0);
      L.lostNow = false; L.done = false; L.t = 0; L.aloneT = 0; L.pauseT = 0; L.paused = false; L.busy = false; L.bubbles = [];
      fingerAway = 0;
      const isAlone = i === alone;
      S.wrap.classList.toggle('alone', isAlone);
      A.setHint(isAlone ? T.alone : hint);
      dots.innerHTML = labels.map((_, k) => `<i class="${k < i ? 'on' : k === i ? 'cur' : ''}"></i>`).join('');
    }

    // ---- input: drag the pencil (only on guided labels)
    const local = (e) => { const r = S.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    let dragging = false;
    S.cv.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (L.busy || L.done) return;
      const [x, y] = local(e);
      if (L.i === alone) { // tapping the label while he reads it alone = reading it for him
        if (y > cellY - 10 && y < trackY + 20 && x > textX0 - 20) readItForHim();
        return;
      }
      dragging = true;
      S.cv.setPointerCapture?.(e.pointerId);
      L.penTarget = clamp(x, L.x0, L.x1 + OFF + W * 0.02);
    });
    S.cv.addEventListener('pointermove', (e) => { if (!dragging) return; const [x] = local(e); L.penTarget = clamp(x, L.x0, L.x1 + OFF + W * 0.02); });
    const up = () => { dragging = false; };
    S.cv.addEventListener('pointerup', up);
    S.cv.addEventListener('pointercancel', up);
    btn.addEventListener('click', (e) => { e.stopPropagation(); readItForHim(); });

    async function readItForHim() {
      if (L.busy || L.done) return;
      L.busy = true;
      readForN++;
      buzz(20);
      // she reads it out; every cell lights at once; his hand drops off the strip
      L.gold = L.cells.map(() => 1);
      L.bubbles.push({ x: (L.x0 + L.x1) / 2, text: tr(labels[L.i].word), t: 0, who: 'her' });
      say.show(T.her, labels[L.i].word);
      await wait(1100);
      fingerAway = 0.001;
      await say.say(T.him, react.readFor || { my: '…', en: '…' });
      await say.say('maya', react.readForMaya || null);
      say.clear();
      A.setHint(T.again);
      await wait(500);
      setupLabel(L.i);
    }

    async function getLost() {
      if (L.lostNow) return;
      L.lostNow = true;
      lost++;
      L.qT = 1.6;
      buzz(25);
      // the cells past his finger fade back
      L.cells.forEach((c, k) => { if (c.x + c.w * 0.5 > L.finger) L.gold[k] = Math.min(L.gold[k], 0); });
      A.setHint(T.waitFinger, 'warn');
      L.busy = true;
      await say.say(T.him, react.lost || { my: 'ခဏ…', en: 'Wait…' }, 1800);
      await say.say(T.her, react.sorry || null, 1800);
      L.busy = false;
    }

    async function labelDone() {
      L.done = true;
      buzz(20);
      L.shine = 1;
      const isAlone = L.i === alone;
      L.bubbles.push({ x: (L.x0 + L.x1) / 2, text: tr(labels[L.i].word), t: 0, who: 'him', big: true });
      if (isAlone) await say.say(T.him, react.alone || labels[L.i].word, 3200);
      else await wait(1300);
      if (L.i + 1 < labels.length) {
        say.clear();
        L.slide = 0.001;
        await wait(450);
        setupLabel(L.i + 1);
        L.slide = 0;
        return;
      }
      A.setHint({ my: 'သူ့အမြန်နှုန်းနဲ့ သူ ဖတ်သွားတယ်', en: 'He read it, at his own speed' }, 'good');
      await A.seal(true);
      A.done({ ok: true, lost, readFor: readForN });
    }

    setupLabel(0);

    stop = runLoop((dt) => {
      L.t += dt;
      if (auto) auto(dt);
      step(dt);
      draw();
    });

    function step(dt) {
      L.qT = Math.max(0, L.qT - dt);
      L.shine = Math.max(0, L.shine - dt * 0.6);
      L.bubbles.forEach((b) => (b.t += dt));
      L.bubbles = L.bubbles.filter((b) => b.t < (b.big ? 2.2 : 1.1));
      if (fingerAway > 0) fingerAway = Math.min(1, fingerAway + dt * 2.5);
      if (L.done || (L.busy && !L.lostNow)) return;
      const isAlone = L.i === alone;
      if (isAlone) {
        // he walks his own finger: slowly, with one pause on the second syllable
        const c2 = L.cells[1];
        const v = speed * 0.55;
        if (c2 && !L.paused && L.finger >= c2.x + c2.w * 0.15) { L.paused = true; L.pauseT = 1.7; L.bubbles.push({ x: L.finger, text: '…', t: 0, who: 'him' }); }
        if (L.pauseT > 0) L.pauseT -= dt; else L.finger = Math.min(L.x1, L.finger + v * dt);
      } else {
        // the pencil eases toward the finger of the player; its speed is what he must keep up with
        const prev = L.pen;
        L.pen += (L.penTarget - L.pen) * Math.min(1, dt * 14);
        const v = (L.pen - prev) / Math.max(dt, 0.001);
        L.penV = lerp(L.penV || 0, v, 0.2);
        L.hist.push([L.t, L.pen]);
        while (L.hist.length > 2 && L.hist[1][0] < L.t - lag - 0.1) L.hist.shift();
        if (L.lostNow) {
          // he waits; the pencil has to come back to his finger
          if (Math.abs(L.pen - OFF - L.finger) < W * 0.05 && !L.busy) { L.lostNow = false; A.setHint(hint); L.hist = [[L.t, L.finger + OFF]]; }
        } else {
          if (L.penV > speed * 1.35 && L.pen - OFF - L.finger > W * 0.06) { getLost(); return; }
          // his finger is where the pencil was `lag` seconds ago, never faster than he can read
          let target = L.finger;
          const tt = L.t - lag;
          for (let k = L.hist.length - 1; k >= 0; k--) if (L.hist[k][0] <= tt) { target = L.hist[k][1] - OFF; break; }
          const maxStep = speed * 1.15 * dt;
          L.finger = Math.max(L.x0, clamp(target, L.finger - maxStep * 2, L.finger + maxStep));
        }
      }
      // cells light as his finger reaches them
      L.cells.forEach((c, k) => {
        if (L.gold[k] < 1 && L.finger >= c.x + c.w * 0.55) { L.gold[k] = 1; L.bubbles.push({ x: c.x + c.w / 2, text: c.s, t: 0, who: 'him' }); buzz(8); }
      });
      if (L.gold.every((v) => v >= 1) && L.finger >= L.x1 - W * 0.02) labelDone();
    }

    // ---- drawing
    const book = S.layer((x) => drawDesk(x, W, H, stripY, stripH));
    function draw() {
      S.blit(book);
      const lab = labels[L.i];
      const slideX = L.slide > 0 ? -W * 0.1 : 0;
      g.save();
      g.translate(slideX, 0);
      // the picture tag (a parcel label tied with string)
      const tx = W * 0.07, ty = stripY + stripH * 0.18, tw = W * 0.27, th = stripH * 0.66;
      g.save(); g.translate(tx + tw / 2, ty + th / 2); g.rotate(-0.04);
      rr(g, -tw / 2, -th / 2, tw, th, 8); fillStroke(g, '#F3E4C4', 1.8);
      g.beginPath(); g.arc(0, -th / 2 + 12, 4.5, 0, 7); fillStroke(g, '#FFFDF8', 1.4);
      g.strokeStyle = '#A47A2C'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, -th / 2 + 12); g.quadraticCurveTo(-tw * 0.3, -th / 2 - 10, -tw * 0.5, -th / 2 - 4); g.stroke();
      drawPicture(g, lab.picture, 0, th * 0.08, tw * 0.78);
      g.restore();
      // syllable cells
      g.font = `700 ${L.fs}px ${MYF}`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      L.cells.forEach((c, k) => {
        const gold = L.gold[k];
        const faded = L.lostNow && c.x + c.w * 0.5 > L.finger;
        // a solid card per syllable: soft shadow, cream face, a dark 3 px edge (gold once he has read it)
        g.fillStyle = 'rgba(74,48,26,.16)'; rr(g, c.x + 1, cellY + 3, c.w, cellH, 10); g.fill();
        rr(g, c.x, cellY, c.w, cellH, 10);
        g.fillStyle = gold ? `rgb(246,${(226 + 6 * Math.sin(L.t * 3 + k)) | 0},166)` : faded ? '#F1EADB' : '#FFFDF6';
        g.fill();
        g.strokeStyle = gold ? '#A47A2C' : faded ? '#A89C88' : '#5A4632'; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke();
        if (gold) { g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(c.x + 8, cellY + 5); g.lineTo(c.x + c.w - 8, cellY + 5); g.stroke(); }
        g.fillStyle = gold ? '#6E1F2A' : faded ? 'rgba(42,33,24,.3)' : '#2A2118';
        g.fillText(c.s, c.x + c.w / 2, cellY + cellH * 0.56);
      });
      if (L.shine > 0) for (let k = 0; k < 4; k++) sparkle(g, lerp(L.x0, L.x1, (k + 0.5) / 4), cellY - 6 + Math.sin(k * 2) * 6, 7 * L.shine, L.shine);
      // the track line under the letters
      g.strokeStyle = 'rgba(164,122,44,.35)'; g.lineWidth = 1.2; g.setLineDash([2, 5]);
      g.beginPath(); g.moveTo(L.x0, trackY); g.lineTo(L.x1, trackY); g.stroke(); g.setLineDash([]);
      // his finger (small, brown, from below)
      const fx = L.finger, fy = trackY + 4 + fingerAway * H * 0.25;
      drawFinger(fx, fy, L.lostNow || L.pauseT > 0);
      // her pencil (guided labels) or lying on the desk (alone)
      if (L.i === alone) drawPencil(W * 0.78, H * 0.93, -1.45, 0.75);
      else drawPencil(L.pen, trackY - 2, -0.55, 1);
      if (L.qT > 0) { g.font = `800 ${H * 0.07}px system-ui`; g.fillStyle = `rgba(110,31,42,${Math.min(1, L.qT)})`; g.textAlign = 'center'; g.fillText('?', fx + 4, trackY - H * 0.05 - (1.6 - L.qT) * 10); }
      // his little sound bubbles
      for (const b of L.bubbles) {
        const k = b.t < 0.15 ? b.t / 0.15 : 1 - Math.max(0, b.t - (b.big ? 1.6 : 0.7)) / 0.5;
        bubble(g, b.x, cellY - 8 - b.t * 6, b.text, { W, size: b.big ? 16 : 14, alpha: clamp(k), tx: b.x, ty: cellY + 6, maxW: W * 0.6 });
      }
      g.restore();
    }

    function drawFinger(x, y, wait) {
      const sk = SKINS[4];
      g.save(); g.translate(x, y); g.rotate(-0.12 + (wait ? Math.sin(L.t * 9) * 0.04 : 0));
      // forearm from below-left, a cuff of his grey tee
      g.lineCap = 'round';
      g.strokeStyle = OUT; g.lineWidth = W * 0.09 + 3; g.beginPath(); g.moveTo(-W * 0.06, H * 0.32); g.lineTo(-W * 0.015, H * 0.08); g.stroke();
      g.strokeStyle = sk; g.lineWidth = W * 0.09; g.stroke();
      g.strokeStyle = OUT; g.lineWidth = W * 0.1 + 3; g.beginPath(); g.moveTo(-W * 0.075, H * 0.38); g.lineTo(-W * 0.06, H * 0.3); g.stroke();
      g.strokeStyle = '#8E8A84'; g.lineWidth = W * 0.1; g.stroke();
      // curled fingers and the pointing one
      rr(g, -W * 0.05, H * 0.03, W * 0.07, H * 0.06, 8); fillStroke(g, sk, 1.6);
      rr(g, -W * 0.012, -2, W * 0.024, H * 0.065, 6); fillStroke(g, sk, 1.6);
      g.fillStyle = shade(sk, 0.35); rr(g, -W * 0.007, 0, W * 0.014, H * 0.016, 4); g.fill();
      g.restore();
    }
    function drawPencil(x, y, a, alpha) {
      g.save(); g.globalAlpha = alpha; g.translate(x, y); g.rotate(a);
      const L0 = W * 0.34, w = W * 0.035;
      // tip at the origin, body going down-right
      g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.5, w * 1.2); g.lineTo(-w * 0.5, w * 1.2); g.closePath(); fillStroke(g, '#F2D2A6', 1.4);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.17, w * 0.4); g.lineTo(-w * 0.17, w * 0.4); g.closePath(); g.fillStyle = '#4A4850'; g.fill();
      rr(g, -w / 2, w * 1.2, w, L0, 2); fillStroke(g, '#F2C04E', 1.6);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-w * 0.32, w * 1.3, w * 0.18, L0 - 6);
      g.fillStyle = 'rgba(160,110,20,.25)'; g.fillRect(w * 0.14, w * 1.3, w * 0.18, L0 - 6);
      rr(g, -w / 2 - 1, w * 1.2 + L0 - 2, w + 2, w * 0.7, 2); fillStroke(g, '#C9A24A', 1.4);
      rr(g, -w / 2, w * 1.2 + L0 + w * 0.6, w, w * 0.9, 4); fillStroke(g, '#E8879A', 1.6);
      g.restore();
      if (alpha === 1) { // her hand on the pencil
        g.save(); g.translate(x, y); g.rotate(a);
        g.lineCap = 'round';
        g.strokeStyle = OUT; g.lineWidth = W * 0.085 + 3; g.beginPath(); g.moveTo(W * 0.05, H * 0.2); g.lineTo(W * 0.18, H * 0.42); g.stroke();
        g.strokeStyle = '#F7F4EC'; g.lineWidth = W * 0.085; g.stroke();
        rr(g, -W * 0.03, H * 0.07, W * 0.1, H * 0.12, 12); fillStroke(g, SKINS[0], 1.6);
        rr(g, -W * 0.015, H * 0.045, W * 0.03, H * 0.06, 6); fillStroke(g, SKINS[0], 1.4);
        g.restore();
      }
    }

    // ---- tests: a careful guide (or a rushed one at care < .5)
    A.wrap.autoGuide = (care = 1) => {
      let rushed = false, readOnce = false;
      auto = () => {
        if (L.busy || L.done) return;
        if (L.i === alone) {
          if (care < 0.5 && !readOnce && L.finger > L.x0 + W * 0.05) { readOnce = true; readItForHim(); }
          return;
        }
        if (L.lostNow) { L.penTarget = L.finger + OFF; return; }
        if (care < 0.5 && !rushed && L.pen > L.x0 + OFF + W * 0.04) { rushed = true; L.penTarget = L.x1 + OFF; return; }
        L.penTarget = Math.min(L.x1 + OFF + W * 0.02, Math.max(L.penTarget, L.finger + OFF + W * 0.05) + speed * 0.012);
      };
    };
    window.__act = A.wrap;
  });
}

// ---- the parcel pictures (drawn, not images)
function drawPicture(g, kind, x, y, s) {
  g.save(); g.translate(x, y);
  const u = s / 48;
  g.scale(u, u);
  g.lineJoin = 'round'; g.lineCap = 'round';
  const st = (w = 2.2) => { g.lineWidth = w; g.strokeStyle = INK; g.stroke(); };
  if (kind === 'book') {
    g.beginPath(); g.moveTo(-18, -13); g.quadraticCurveTo(-7, -16, 0, -10); g.quadraticCurveTo(7, -16, 18, -13); g.lineTo(18, 14); g.quadraticCurveTo(7, 11, 0, 16); g.quadraticCurveTo(-7, 11, -18, 14); g.closePath();
    g.fillStyle = '#FFFDF8'; g.fill(); st();
    g.beginPath(); g.moveTo(0, -10); g.lineTo(0, 16); st(1.6);
    g.strokeStyle = '#9DB4CC'; g.lineWidth = 1.6; for (const yy of [-4, 1, 6]) { g.beginPath(); g.moveTo(-14, yy); g.lineTo(-4, yy); g.moveTo(4, yy); g.lineTo(14, yy); g.stroke(); }
    g.fillStyle = '#7A2533'; g.fillRect(-20, 14, 40, 4); g.strokeRect(-20, 14, 40, 4);
  } else if (kind === 'scale') {
    g.beginPath(); g.moveTo(0, -16); g.lineTo(0, 15); st(2.4);
    g.beginPath(); g.moveTo(-9, 17); g.lineTo(9, 17); st(2.6);
    g.save(); g.rotate(-0.08); g.beginPath(); g.moveTo(-16, -11); g.lineTo(16, -11); st(2.4); g.restore();
    g.beginPath(); g.arc(0, -16, 2.8, 0, 7); g.fillStyle = '#C9A24A'; g.fill(); st(1.4);
    for (const [px, py] of [[-15, -10], [15, -13]]) { g.beginPath(); g.moveTo(px, py); g.lineTo(px - 5, py + 11); g.moveTo(px, py); g.lineTo(px + 5, py + 11); st(1.2); g.beginPath(); g.moveTo(px - 7, py + 11); g.lineTo(px + 7, py + 11); g.quadraticCurveTo(px, py + 17, px - 7, py + 11); g.fillStyle = '#C9A24A'; g.fill(); st(1.8); }
    g.fillStyle = '#E3A65C'; g.beginPath(); g.ellipse(-15, 0, 4, 2.5, 0, 0, 7); g.fill(); st(1.2);
  } else if (kind === 'jasmine') {
    // a potter's wheel with a jasmine string round it
    g.beginPath(); g.ellipse(0, 6, 18, 6, 0, 0, 7); g.fillStyle = '#9C6B3F'; g.fill(); st();
    g.beginPath(); g.moveTo(-18, 6); g.lineTo(-18, 10); g.quadraticCurveTo(0, 18, 18, 10); g.lineTo(18, 6); g.fillStyle = '#7A5434'; g.fill(); st();
    g.beginPath(); g.moveTo(-8, 5); g.quadraticCurveTo(-11, -6, -5, -12); g.lineTo(5, -12); g.quadraticCurveTo(11, -6, 8, 5); g.closePath(); g.fillStyle = '#C47A45'; g.fill(); st(1.8);
    g.beginPath(); g.ellipse(0, -12, 5, 1.6, 0, 0, 7); g.fillStyle = '#6A361C'; g.fill(); st(1.2);
    for (let i = 0; i < 9; i++) { const a = Math.PI * (0.15 + i * 0.09); const px = Math.cos(a) * -19, py = 4 + Math.sin(a) * 9; g.beginPath(); g.arc(px, py - 14, 2.4, 0, 7); g.fillStyle = '#FFFDF8'; g.fill(); g.lineWidth = 1; g.strokeStyle = '#8C8A70'; g.stroke(); }
    g.strokeStyle = '#4F7F43'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-19, -14); g.quadraticCurveTo(-2, -24, 17, -12); g.stroke();
  } else {
    g.font = '30px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(kind || '•', 0, 0);
  }
  g.restore();
}

// the classroom desk with an exercise book open on it (drawn once)
function drawDesk(g, W, H, stripY, stripH) {
  const desk = g.createLinearGradient(0, 0, 0, H);
  desk.addColorStop(0, '#C69A68'); desk.addColorStop(1, '#AD7F50');
  g.fillStyle = desk; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(90,55,25,.18)'; g.lineWidth = 1.2;
  const rnd = seededRandom(5);
  for (let i = 0; i < 18; i++) { const y = rnd() * H; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + rnd() * 8 - 4, W * 0.6, y + rnd() * 8 - 4, W, y + rnd() * 6 - 3); g.stroke(); }
  g.fillStyle = 'rgba(70,40,15,.22)'; g.fillRect(0, stripY + stripH + 4, W, 4);
  // the exercise-book strip: cream, ruled blue lines, red margin
  g.save(); g.translate(0, 0);
  rr(g, W * 0.03, stripY, W * 0.94, stripH, 6);
  g.fillStyle = '#FBF6EA'; g.fill(); g.strokeStyle = '#D9C9A6'; g.lineWidth = 1.5; g.stroke();
  g.save(); rr(g, W * 0.03, stripY, W * 0.94, stripH, 6); g.clip();
  g.strokeStyle = 'rgba(120,160,200,.45)'; g.lineWidth = 1;
  for (let y = stripY + 14; y < stripY + stripH; y += 16) { g.beginPath(); g.moveTo(W * 0.03, y); g.lineTo(W * 0.97, y); g.stroke(); }
  g.strokeStyle = 'rgba(214,110,100,.6)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(W * 0.37, stripY); g.lineTo(W * 0.37, stripY + stripH); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(W * 0.03, stripY, W * 0.94, 6);
  g.restore();
  g.restore();
  // things on the desk: an eraser, chalk dust, the torn first boat's corner
  rr(g, W * 0.06, H * 0.88, W * 0.1, H * 0.05, 4); fillStroke(g, '#E8879A', 1.4);
  rr(g, W * 0.06, H * 0.88, W * 0.04, H * 0.05, 3); fillStroke(g, '#7FB0CF', 1.2);
  g.save(); g.translate(W * 0.84, H * 0.08); g.rotate(0.25);
  g.beginPath(); g.moveTo(-W * 0.09, 0); g.lineTo(W * 0.09, 0); g.lineTo(W * 0.05, H * 0.05); g.lineTo(-W * 0.05, H * 0.05); g.closePath(); fillStroke(g, '#F6E7B4', 1.4);
  g.beginPath(); g.moveTo(-W * 0.03, 0); g.lineTo(0, -H * 0.06); g.lineTo(W * 0.02, -H * 0.01); g.lineTo(W * 0.035, 0); g.closePath(); fillStroke(g, '#F6E7B4', 1.4);
  g.restore();
  g.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 20; i++) { g.beginPath(); g.arc(rnd() * W, rnd() * H * 0.15, 1 + rnd() * 1.5, 0, 7); g.fill(); }
}

function injectGuideStyle() {
  if (document.getElementById('act-guide-style')) return;
  const s = document.createElement('style');
  s.id = 'act-guide-style';
  s.textContent = `
  .gd-readfor { position: absolute; right: 8px; top: 8px; z-index: 2; display: flex; align-items: center; gap: 6px; padding: 5px 6px 5px 9px; border-radius: 16px;
    border: 2.5px solid #6E1F2A; background: #FFFDF8; color: #6E1F2A; font: 700 13px/1.35 ${MYF}; cursor: pointer; text-align: left; box-shadow: 0 3px 0 #A47A2C; }
  .gd-readfor .gd-cost { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 3px 6px 2px; border-radius: 10px; background: #F4E3DF;
    border: 1.5px solid rgba(110,31,42,.45); font: 700 10.5px/1.25 ${MYF}; color: #8E2A2A; }
  .gd-readfor .gd-cost .ak-sub { font-size: 8.5px; color: #A0452F; }
  .gd-fing { display: block; width: 9px; height: 14px; border-radius: 5px 5px 3px 3px; background: #B47A55; border: 1.5px solid #3B2A1A; position: relative; }
  .gd-fing::after { content: ''; position: absolute; left: -4px; top: 5px; width: 14px; height: 1.6px; background: #8E2A2A; transform: rotate(-35deg); }
  .gd-readfor svg { width: 18px; height: 18px; fill: none; stroke: #6E1F2A; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex: none; }
  .gd-readfor .ak-sub { font-size: 9.5px; }
  .gd-readfor:active { transform: translateY(2px); box-shadow: 0 1px 0 #A47A2C; }
  .gd .gd-dots { position: absolute; left: 12px; top: 12px; display: flex; gap: 5px; }
  .gd-dots i { width: 9px; height: 9px; border-radius: 50%; background: rgba(255,253,248,.6); border: 1.5px solid #A47A2C; }
  .gd-dots i.cur { background: #E8C25A; } .gd-dots i.on { background: #A47A2C; }
  `;
  document.head.appendChild(s);
}
