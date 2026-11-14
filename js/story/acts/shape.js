// Handwork pattern 2: shape pots on a potter's wheel (Mi Cho's yard, "not yet").
//
//   const r = await shape({ title, hint, loads: [2, 3, 5], best: 2, rounds: 3, day: 26 })
//   r = { ok: boolean, load: n, score: 0..1, cracked: n, quality: 0..1 }   (cancel: { ok: false, cancelled: true, load, score: 0 })
//
// First the player picks today's load (how many pots). Then for each pot: hold and drag to keep the
// clay's wobble dot inside the centre ring (seen from above), then pull the wall up with a smooth
// upward drag (seen from the side). The day is the same length whatever the load, so a big load
// hurries every pot, and only `rounds` pots are thrown by hand; the rest are rushed out in a montage.
// Drying is what decides the ending: every pot over `best` dries too fast and cracks, however
// carefully it was thrown. Care decides how true the pots stand.
//
// Test hook: window.__act.autoShape(load = best, care = 1, stay = false)   (stay: wait on the end screen for a tap)
import { openAct, bi, wait, myNum, buzz, clamp, lerp, ease, seededRandom } from './kit.js';

const C = { hi: '#E6A673', mid: '#C47A45', lo: '#9A5531', dark: '#6A361C', inner: '#5A2C16', dry: '#DDB088', dryLo: '#B98A5E' };
const T = {
  centre: { my: 'ဖိပြီး ဆွဲ — အစက်ကို ကွင်းထဲ ထိန်းထား', en: 'Hold and drag: keep the dot inside the ring' },
  centreOut: { my: 'ရွှံ့ ယိမ်းနေတယ် — အလယ်ကို ပြန်ဆွဲ', en: 'The clay is wobbling: bring it back to the middle' },
  pull: { my: 'အောက်ကနေ အပေါ်ကို ဖြည်းဖြည်း ဆွဲတင်ပါ', en: 'Drag upward, slowly and smoothly' },
  pullFast: { my: 'ဖြည်းဖြည်း… မြန်လွန်းရင် နံရံ လှိုင်းထတယ်', en: 'Gently… too fast and the wall ripples' },
  hurry: { my: 'နေ စောင်းလာပြီ — အမြန် လုပ်ရတော့မယ်', en: 'The sun is sinking: no time, hurry' },
  potDone: { my: 'အိုး တစ်လုံး ပြီးပြီ', en: 'One pot done' },
  montage: { my: 'ကျန်တဲ့ အိုးတွေကို အလောတကြီး လုပ်နေတယ်…', en: 'Rushing out the rest…' },
  dry: { my: 'နေပူထဲမှာ အခြောက်ခံနေတယ်…', en: 'Drying in the sun…' },
  next: { my: 'ဆက်မယ်', en: 'Continue' },
};

export function shape({ title = '', hint = '', loads = [2, 3, 5], best = 2, rounds = 3, day = 26 } = {}) {
  return new Promise((resolve) => {
    let raf = 0;
    const S = {
      phase: 'choose', load: 0, pot: 0, theta: 0, spin: 1.1, tilt: 1, tiltTo: 1,
      off: { x: 0, y: 0 }, hold: 0, inT: 0, outT: 0, wasIn: true, lastShake: 0, qc: 1,
      h: 0, bumps: [], lean: 0, pullQ: 1, vs: 0, lastBump: 0,
      pots: [], potClock: 0, budget: 1, drop: 1, fly: null, flash: 0,
      dry: null, auto: null, t: 0, hurried: false, speed: 1, freeze: false,
    };
    const A = openAct({ title, hint, kind: 'shape', resolve: (r) => { cancelAnimationFrame(raf); resolve(r); }, onCancel: () => ({ load: S.load, score: 0 }) });
    A.body.innerHTML = `<div class="sh-stage"><canvas></canvas></div>
      <div class="sh-ui"><div class="sh-loads"></div><div class="sh-status"></div><p class="sh-end ak-bi" hidden></p><button type="button" class="ak-btn sh-next ak-bi" hidden></button></div>`;
    injectShapeStyle();
    const cv = A.body.querySelector('canvas');
    const statusEl = A.body.querySelector('.sh-status');
    const endEl = A.body.querySelector('.sh-end');
    const nextBtn = A.body.querySelector('.sh-next');
    bi(nextBtn, T.next);

    // ---- canvas
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round(Math.min(A.body.clientWidth || 360, 400));
    const H = Math.round(W * 0.84);
    cv.style.width = `${W}px`;
    cv.style.height = `${H}px`;
    cv.width = W * dpr;
    cv.height = H * dpr;
    let g = cv.getContext('2d');
    g.scale(dpr, dpr);
    const minWH = Math.min(W, H);

    // ---- geometry: the camera tilts between looking down (tilt 0) and looking from the side (tilt 1)
    const geo = () => {
      const t = S.tilt;
      const R = lerp(minWH * 0.42, W * 0.36, t);
      return { t, R, cx: W / 2, y: lerp(H * 0.53, H * 0.75, t), ry: R * lerp(1, 0.26, t), ringR: minWH * 0.42 * 0.15 };
    };
    // the pot's shape, in units of its own radius U: a lump (e = 0) rising into a pot (e = 1)
    const PK = [[0, 0.6], [0.1, 0.74], [0.38, 0.95], [0.62, 0.84], [0.82, 0.52], [0.92, 0.5], [1, 0.62]];
    const potCurve = (u) => {
      for (let i = 1; i < PK.length; i++) {
        if (u <= PK[i][0]) { const [u0, r0] = PK[i - 1], [u1, r1] = PK[i]; const k = (u - u0) / (u1 - u0); return lerp(r0, r1, k * k * (3 - 2 * k)); }
      }
      return PK[PK.length - 1][1];
    };
    const lumpCurve = (u) => Math.sqrt(Math.max(0, 1 - u ** 2.2)) * 0.98 + 0.02;
    function radiusAt(u, e, pot) {
      let r = lerp(lumpCurve(u) * 1.2, potCurve(u), e);
      for (const b of pot.bumps) r += b.a * Math.exp(-(((u - b.u) / 0.07) ** 2)) * e;
      return r;
    }
    const heightOf = (e) => lerp(0.92, 2.35, e);

    // draws a lump/pot standing at (x, y0), scaled by U px; o: { e, pot, rim (ellipse ratio), spin, hands, dry, crack, gleam, alpha }
    function drawPot(x, y0, U, o) {
      const { e, pot } = o;
      const rim = o.rim ?? 0.26;
      const Hh = heightOf(e) * U;
      const N = 26;
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        pts.push([u, radiusAt(u, e, pot) * U, x + pot.lean * U * u * u]);
      }
      g.save();
      g.globalAlpha = o.alpha ?? 1;
      // shadow on the wheel / shelf
      g.fillStyle = 'rgba(50,28,12,.22)';
      g.beginPath(); g.ellipse(x + 2, y0 + 2, pts[0][1] * 1.12, pts[0][1] * rim * 1.1 + 1.5, 0, 0, 7); g.fill();
      // body
      const maxR = Math.max(...pts.map((p) => p[1]));
      const dry = o.dry || 0;
      const col = (a, b) => mix(a, b, dry);
      const gr = g.createLinearGradient(x - maxR, 0, x + maxR, 0);
      gr.addColorStop(0, col(C.dark, '#9C7048'));
      gr.addColorStop(0.3, col(C.mid, C.dry));
      gr.addColorStop(0.42, col(C.hi, '#EBC9A2'));
      gr.addColorStop(0.7, col(C.mid, C.dry));
      gr.addColorStop(1, col(C.dark, C.dryLo));
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(pts[0][2] - pts[0][1], y0);
      for (const [u, r, cx] of pts) g.lineTo(cx - r, y0 - u * Hh);
      const top = pts[N];
      const open = e > 0.28;
      if (open) g.ellipse(top[2], y0 - Hh, top[1], top[1] * rim, 0, Math.PI, Math.PI * 2, false);
      else g.lineTo(top[2] + top[1], y0 - Hh);
      for (let i = N; i >= 0; i--) { const [u, r, cx] = pts[i]; g.lineTo(cx + r, y0 - u * Hh); }
      g.ellipse(pts[0][2], y0, pts[0][1], pts[0][1] * rim, 0, 0, Math.PI, false);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(70,34,14,.55)';
      g.lineWidth = Math.max(1, U * 0.035);
      g.stroke();
      // throwing rings (front half of each ring)
      g.lineWidth = Math.max(0.8, U * 0.025);
      for (let k = 1; k <= 7; k++) {
        const u = k / 8.2;
        const i = Math.round(u * N);
        const [, r, cx] = pts[i];
        g.strokeStyle = `rgba(80,38,14,${0.1 + 0.1 * e})`;
        g.beginPath(); g.ellipse(cx, y0 - u * Hh, r * 0.995, r * rim, 0, 0.15, Math.PI - 0.15); g.stroke();
      }
      // the opening and the lip
      if (open) {
        const k = clamp((e - 0.28) / 0.3);
        g.fillStyle = col(C.inner, '#8E6440');
        g.globalAlpha = (o.alpha ?? 1) * k;
        g.beginPath(); g.ellipse(top[2], y0 - Hh, top[1] * 0.8, top[1] * rim * 0.78, 0, 0, 7); g.fill();
        g.strokeStyle = col('#E9AF7E', '#F2D6B4');
        g.lineWidth = Math.max(1, U * 0.06);
        g.beginPath(); g.ellipse(top[2], y0 - Hh, top[1] * 0.9, top[1] * rim * 0.88, 0, 0, 7); g.stroke();
        g.globalAlpha = o.alpha ?? 1;
      }
      // wet sheen
      if (dry < 0.8) {
        g.fillStyle = `rgba(255,236,210,${0.22 * (1 - dry)})`;
        g.beginPath();
        for (let i = 2; i <= N - 3; i++) { const [u, r, cx] = pts[i]; g.lineTo(cx - r * 0.5, y0 - u * Hh); }
        for (let i = N - 3; i >= 2; i--) { const [u, r, cx] = pts[i]; g.lineTo(cx - r * 0.32, y0 - u * Hh); }
        g.fill();
      }
      // spin: specks of slip riding round the wall
      if (o.spin != null) {
        for (let i = 0; i < 14; i++) {
          const u = 0.08 + ((i * 0.37) % 0.85);
          const a = o.spin * 2.4 + i * 2.1;
          const c = Math.cos(a);
          if (c < 0.1) continue;
          const j = Math.round(u * N);
          const [, r, cx] = pts[j];
          const sx = cx + r * Math.sin(a) * 0.96, sy = y0 - u * Hh + r * rim * c;
          g.strokeStyle = `rgba(255,232,200,${0.55 * c})`;
          g.lineWidth = 1.6;
          g.beginPath(); g.moveTo(sx - 3.5 * c, sy); g.lineTo(sx + 3.5 * c, sy); g.stroke();
        }
      }
      // cracks: jagged lines from the lip down
      if (o.crack > 0 && pot.cracks) {
        g.lineCap = 'round'; g.lineJoin = 'round';
        for (const line of pot.cracks) {
          const n = Math.max(2, Math.ceil(line.length * o.crack));
          for (const [w, colr, dx] of [[Math.max(1.6, U * 0.07), 'rgba(255,240,220,.55)', 0.8], [Math.max(1.1, U * 0.045), '#3A1A0A', 0]]) {
            g.strokeStyle = colr; g.lineWidth = w;
            g.beginPath();
            for (let i = 0; i < n; i++) {
              const [fx, u] = line[i];
              const j = Math.round(u * N);
              const [, r, cx] = pts[j];
              const px = cx + fx * r + dx, py = y0 - u * Hh + dx;
              if (i) g.lineTo(px, py); else g.moveTo(px, py);
            }
            g.stroke();
          }
        }
      }
      // gleam: a little star on the shoulder of a whole pot
      if (o.gleam > 0) {
        const j = Math.round(0.62 * N);
        const [, r, cx] = pts[j];
        star(cx - r * 0.45, y0 - 0.62 * Hh, U * 0.32 * o.gleam, `rgba(255,250,235,${o.gleam})`);
      }
      // hands at the working height
      if (o.hands != null) {
        const u = clamp(o.hands, 0.06, 0.96);
        const j = Math.round(u * N);
        const [, r, cx] = pts[j];
        hand(cx - r - U * 0.16, y0 - u * Hh, -1, U);
        hand(cx + r + U * 0.16, y0 - u * Hh, 1, U);
      }
      g.restore();
    }
    function hand(x, y, side, U) {
      g.save();
      g.translate(x, y);
      g.scale(side, 1);
      g.rotate(-0.18);
      g.fillStyle = '#C98E62'; g.strokeStyle = '#7A4B2E'; g.lineWidth = 1.5;
      g.beginPath(); g.ellipse(U * 0.22, 0, U * 0.3, U * 0.2, 0, 0, 7); g.fill(); g.stroke(); // palm, toward the wrist
      g.fillStyle = '#B87545';
      g.beginPath(); g.ellipse(-U * 0.02, 0, U * 0.1, U * 0.17, 0, 0, 7); g.fill(); // clay on the fingertips
      g.strokeStyle = 'rgba(122,75,46,.6)'; g.lineWidth = 1.2;
      for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(U * 0.05, i * U * 0.07); g.lineTo(U * 0.2, i * U * 0.08); g.stroke(); }
      g.restore();
    }
    function star(x, y, r, col) {
      g.fillStyle = col;
      g.beginPath();
      for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, rr = i % 2 ? r * 0.28 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      g.fill();
    }

    // ---- scene
    function background() {
      const t = S.tilt;
      const hz = lerp(-30, H * 0.5, t); // the horizon rises as the camera looks down
      g.fillStyle = '#EFDDBA';
      g.fillRect(0, 0, W, H);
      const wall = g.createLinearGradient(0, 0, 0, Math.max(1, hz));
      wall.addColorStop(0, '#F5E6C8'); wall.addColorStop(1, '#EAD2A6');
      g.fillStyle = wall; g.fillRect(0, 0, W, Math.max(0, hz));
      if (hz > 10) { // the yard wall: a few soft bricks and a shaft of light
        g.fillStyle = 'rgba(255,248,230,.35)';
        g.beginPath(); g.moveTo(W * 0.62, 0); g.lineTo(W * 0.86, 0); g.lineTo(W * 0.7, hz); g.lineTo(W * 0.42, hz); g.fill();
        g.strokeStyle = 'rgba(160,110,60,.12)'; g.lineWidth = 1;
        for (let r = 0, y = hz - 14; y > 4; y -= 14, r++) for (let x = (r % 2) * 22 - 22; x < W; x += 44) { g.strokeRect(x, y, 44, 14); }
      }
      const fl = g.createLinearGradient(0, hz, 0, H);
      fl.addColorStop(0, '#D7B585'); fl.addColorStop(1, '#C9A271');
      g.fillStyle = fl; g.fillRect(0, hz, W, H - hz);
      g.fillStyle = 'rgba(120,70,30,.10)';
      const rnd = seededRandom(7);
      for (let i = 0; i < 70; i++) { const x = rnd() * W, y = hz + rnd() * (H - hz); g.beginPath(); g.ellipse(x, y, 1.5 + rnd() * 2.5, 1 + rnd(), 0, 0, 7); g.fill(); }
    }
    // the yard only changes while the camera tilts: keep the two resting views as bitmaps
    const bgCache = {};
    function backgroundCached() {
      if (S.tilt !== 0 && S.tilt !== 1) return background();
      let c = bgCache[S.tilt];
      if (!c) {
        c = bgCache[S.tilt] = document.createElement('canvas');
        c.width = W * dpr; c.height = H * dpr;
        const keep = g;
        g = c.getContext('2d');
        g.scale(dpr, dpr);
        background();
        g = keep;
      }
      g.drawImage(c, 0, 0, W, H);
    }
    function wheel() {
      const { R, cx, y, ry, t } = geo();
      const band = 13 * t;
      if (t > 0.05) { // the wooden drum under the head
        g.globalAlpha = clamp(t * 1.4);
        const dg = g.createLinearGradient(cx - R * 0.7, 0, cx + R * 0.7, 0);
        dg.addColorStop(0, '#4E331E'); dg.addColorStop(0.45, '#7A5534'); dg.addColorStop(1, '#3F2817');
        g.fillStyle = dg;
        g.beginPath(); g.moveTo(cx - R * 0.42, y + band); g.lineTo(cx - R * 0.62, H + 4); g.lineTo(cx + R * 0.62, H + 4); g.lineTo(cx + R * 0.42, y + band); g.fill();
        g.globalAlpha = 1;
      }
      g.fillStyle = 'rgba(40,24,10,.25)';
      g.beginPath(); g.ellipse(cx + 4, y + band + 6, R * 1.02, ry * 1.05 + 4, 0, 0, 7); g.fill();
      g.fillStyle = '#5A3C22';
      g.beginPath(); g.ellipse(cx, y + band, R, ry, 0, 0, 7); g.fill();
      g.fillRect(cx - R, y, R * 2, band);
      const tg = g.createLinearGradient(cx - R, y - ry, cx + R, y + ry);
      tg.addColorStop(0, '#C1915C'); tg.addColorStop(0.5, '#A6773F'); tg.addColorStop(1, '#8A5E33');
      g.fillStyle = tg;
      g.beginPath(); g.ellipse(cx, y, R, ry, 0, 0, 7); g.fill();
      // slip worn into the head, grooves, and spin marks that ride round with it
      g.strokeStyle = 'rgba(196,122,69,.35)'; g.lineWidth = R * 0.08;
      g.beginPath(); g.ellipse(cx, y, R * 0.7, ry * 0.7, 0, 0, 7); g.stroke();
      g.lineWidth = 1;
      for (let k = 1; k <= 5; k++) { g.strokeStyle = 'rgba(60,36,16,.2)'; g.beginPath(); g.ellipse(cx, y, (R * k) / 5.4, (ry * k) / 5.4, 0, 0, 7); g.stroke(); }
      g.lineCap = 'round';
      for (let i = 0; i < 9; i++) {
        const a = S.theta + i * 0.7 + (i % 3);
        const rr = 0.42 + 0.06 * (i % 6);
        g.strokeStyle = `rgba(255,236,205,${0.22 + 0.1 * (i % 2)})`;
        g.lineWidth = 2;
        g.beginPath(); g.ellipse(cx, y, R * rr, ry * rr, 0, a, a + 0.32 + S.spin * 0.05); g.stroke();
      }
      g.strokeStyle = 'rgba(255,235,200,.45)'; g.lineWidth = 1.5;
      g.beginPath(); g.ellipse(cx, y, R * 0.99, ry * 0.99, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    }
    // the clay seen from above, with the wobble dot and the ring
    function clayTop(alpha) {
      if (alpha <= 0) return;
      const { R, cx, y, ringR } = geo();
      const orbit = Math.hypot(S.off.x, S.off.y) * 0.14;
      const x = cx + S.off.x + Math.cos(S.theta * 3) * orbit, yy = y + S.off.y + Math.sin(S.theta * 3) * orbit;
      const r = R * 0.42 * (S.drop < 1 ? 0.7 + 0.3 * ease(S.drop) : 1);
      g.save();
      g.globalAlpha = alpha;
      g.fillStyle = 'rgba(40,20,8,.25)';
      g.beginPath(); g.arc(x + 4, yy + 5, r, 0, 7); g.fill();
      const rg = g.createRadialGradient(x - r * 0.35, yy - r * 0.4, r * 0.1, x, yy, r);
      rg.addColorStop(0, C.hi); rg.addColorStop(0.55, C.mid); rg.addColorStop(1, C.lo);
      g.fillStyle = rg;
      g.beginPath(); g.arc(x, yy, r, 0, 7); g.fill();
      g.strokeStyle = 'rgba(80,38,14,.5)'; g.lineWidth = 1.5; g.stroke();
      g.lineCap = 'round';
      for (let k = 0; k < 6; k++) { // swirl of the wet clay turning
        const a = S.theta * 1.6 + k * 1.3;
        g.strokeStyle = `rgba(90,44,18,${0.22 + 0.04 * k})`; g.lineWidth = 1.6;
        g.beginPath(); g.arc(x, yy, r * (0.22 + 0.12 * k), a, a + 0.9 + 0.1 * k); g.stroke();
      }
      g.strokeStyle = 'rgba(255,240,220,.35)'; g.lineWidth = 3;
      g.beginPath(); g.arc(x, yy, r * 0.8, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
      if (S.phase === 'centre') {
        if (A.down || S.auto) { hand(x - r - R * 0.05, yy + r * 0.15, -1, R * 0.36); hand(x + r + R * 0.05, yy + r * 0.15, 1, R * 0.36); }
        const inside = Math.hypot(S.off.x, S.off.y) < ringR;
        // ring: the target, filling green as the clay holds true
        g.setLineDash([5, 5]);
        g.lineDashOffset = -S.t * 12;
        g.strokeStyle = inside ? 'rgba(79,127,67,.9)' : 'rgba(110,31,42,.75)';
        g.lineWidth = 2.5;
        g.beginPath(); g.arc(cx, y, ringR, 0, 7); g.stroke();
        g.setLineDash([]);
        const p = clamp(S.hold / HOLD);
        if (p > 0) {
          g.strokeStyle = '#4F7F43'; g.lineWidth = 5;
          g.beginPath(); g.arc(cx, y, ringR + 6, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); g.stroke();
        }
        if (!inside) { g.strokeStyle = 'rgba(110,31,42,.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx, y); g.lineTo(x, yy); g.stroke(); }
        g.fillStyle = '#FFFDF8';
        g.beginPath(); g.arc(x, yy, 8.5, 0, 7); g.fill();
        g.fillStyle = inside ? '#2A2118' : '#8E2A2A';
        g.beginPath(); g.arc(x, yy, 5.5 + (inside ? 0 : Math.sin(S.t * 14) * 1.2), 0, 7); g.fill();
      }
      g.restore();
    }
    function claySide(alpha) {
      if (alpha <= 0 || S.phase === 'flying' || S.phase === 'mflying') return; // the pot is on its way to the shelf
      const { R, cx, y } = geo();
      const U = R * 0.4;
      const pot = cur();
      const dropY = S.drop < 1 ? -(1 - ease(S.drop)) * H * 0.6 : 0;
      const squash = S.drop < 1 ? 1 : 1 + Math.sin(clamp(S.flash) * Math.PI) * 0.04;
      g.save();
      g.globalAlpha = alpha;
      g.translate(0, dropY);
      g.translate(cx, y); g.scale(squash, 1 / squash); g.translate(-cx, -y);
      const e = S.h;
      // target line for the pull
      if (S.phase === 'pull' && !S.auto) {
        const ty = y - heightOf(1) * U;
        g.setLineDash([6, 6]); g.strokeStyle = 'rgba(110,31,42,.45)'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(cx - U * 1.6, ty); g.lineTo(cx + U * 1.6, ty); g.stroke(); g.setLineDash([]);
        if (!A.down) { // chevrons: pull up
          const k = (S.t * 1.4) % 1;
          for (let i = 0; i < 3; i++) {
            const yy = y - heightOf(e) * U - 14 - ((i + k) * 12);
            g.strokeStyle = `rgba(110,31,42,${0.55 * (1 - (i + k) / 3)})`; g.lineWidth = 2.5; g.lineCap = 'round';
            g.beginPath(); g.moveTo(cx - 9, yy + 6); g.lineTo(cx, yy); g.lineTo(cx + 9, yy + 6); g.stroke();
          }
        }
      }
      drawPot(cx, y, U, { e, pot, spin: S.theta, hands: S.phase === 'pull' && (A.down || S.auto) ? e * 0.92 + 0.05 : null, gleam: S.phase === 'done1' ? Math.sin(clamp(S.flash) * Math.PI) : 0 });
      g.restore();
    }
    // day bar (the sun crossing) and the drying shelf with today's pots
    function hud() {
      if (!S.load) return;
      const x0 = 16, x1 = W * 0.42, yb = 20;
      g.fillStyle = 'rgba(255,250,238,.55)';
      g.beginPath(); g.roundRect(6, 6, W - 12, 38, 12); g.fill();
      const p = clamp((S.pot + Math.min(1, S.potClock / S.budget)) / S.load);
      g.strokeStyle = 'rgba(110,70,30,.25)'; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0, yb); g.lineTo(x1, yb); g.stroke();
      const rush = S.load > best;
      g.strokeStyle = rush ? '#D9772E' : '#C9A24A';
      g.beginPath(); g.moveTo(x0, yb); g.lineTo(lerp(x0, x1, p), yb); g.stroke();
      const sx = lerp(x0, x1, p);
      const late = S.potClock > S.budget * 0.7 && S.phase !== 'choose';
      const sr = 7 + (late ? Math.sin(S.t * 12) * 1.5 : 0);
      g.fillStyle = 'rgba(255,214,120,.45)'; g.beginPath(); g.arc(sx, yb, sr + 5, 0, 7); g.fill();
      g.fillStyle = rush ? '#EE9A3C' : '#F2C04E'; g.beginPath(); g.arc(sx, yb, sr, 0, 7); g.fill();
      // shelf
      const s0 = W * 0.54, s1 = W - 14, ys = 34;
      g.fillStyle = '#7A5534'; g.fillRect(s0, ys, s1 - s0, 4);
      g.fillStyle = 'rgba(60,36,16,.25)'; g.fillRect(s0, ys + 4, s1 - s0, 2);
      const sw = (s1 - s0) / S.load;
      const U = Math.min(sw * 0.3, 7);
      for (let i = 0; i < S.load; i++) {
        const x = s0 + sw * (i + 0.5);
        const pot = S.pots[i];
        if (pot && !(S.fly && S.fly.i === i)) drawPot(x, ys, U, { e: 1, pot, rim: 0.3 });
        else { g.setLineDash([2, 2]); g.strokeStyle = 'rgba(110,70,30,.35)'; g.lineWidth = 1; g.strokeRect(x - U * 0.8, ys - U * 2.3, U * 1.6, U * 2.3); g.setLineDash([]); }
      }
      if (S.fly) {
        const k = ease(clamp(S.fly.t));
        const { R, cx, y } = geo();
        const x = lerp(cx, s0 + sw * (S.fly.i + 0.5), k), yy = lerp(y, ys, k) - Math.sin(k * Math.PI) * 40;
        drawPot(x, yy, lerp(R * 0.4, U, k), { e: 1, pot: S.pots[S.fly.i] });
      }
    }
    function dryScene() {
      const D = S.dry;
      const sp = clamp(D.t / D.sweep);
      const rush = D.cracked > 0;
      if (!D.bg) { // sky, ground and plank never move: one bitmap
        D.bg = document.createElement('canvas');
        D.bg.width = W * dpr; D.bg.height = H * dpr;
        const keep = g;
        g = D.bg.getContext('2d');
        g.scale(dpr, dpr);
        dryStatic(rush);
        g = keep;
      }
      g.drawImage(D.bg, 0, 0, W, H);
      const sx = lerp(W * 0.1, W * 0.9, sp), sy = H * 0.34 - Math.sin(sp * Math.PI) * H * 0.2;
      const sr = rush ? 24 : 17;
      g.fillStyle = rush ? 'rgba(240,140,50,.25)' : 'rgba(255,214,120,.3)';
      g.beginPath(); g.arc(sx, sy, sr * 2, 0, 7); g.fill();
      g.fillStyle = rush ? '#EE8A34' : '#F2C04E';
      g.beginPath(); g.arc(sx, sy, sr, 0, 7); g.fill();
      g.strokeStyle = rush ? 'rgba(238,138,52,.6)' : 'rgba(242,192,78,.6)'; g.lineWidth = 2.5; g.lineCap = 'round';
      for (let i = 0; i < 10; i++) { const a = i * 0.628 + S.t * 0.4; g.beginPath(); g.moveTo(sx + Math.cos(a) * sr * 1.3, sy + Math.sin(a) * sr * 1.3); g.lineTo(sx + Math.cos(a) * sr * 1.65, sy + Math.sin(a) * sr * 1.65); g.stroke(); }
      const py = H * 0.66;
      const n = S.load, sw = (W - 40) / n;
      const U = Math.min(sw * 0.34, H * 0.125);
      dryPots(D, sp, rush, py, n, sw, U);
    }
    function dryStatic(rush) {
      const sky = g.createLinearGradient(0, 0, 0, H * 0.7);
      sky.addColorStop(0, rush ? '#F6D9A4' : '#F8E8C6'); sky.addColorStop(1, rush ? '#F0BE7E' : '#F2D7A6');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      const gy = H * 0.72;
      g.fillStyle = '#D7B585'; g.fillRect(0, gy, W, H - gy);
      g.fillStyle = 'rgba(120,70,30,.12)'; g.fillRect(0, gy, W, 3);
      // the plank
      const py = H * 0.66;
      g.fillStyle = '#5A3C22'; g.fillRect(W * 0.1, py + 8, 8, gy - py + 10); g.fillRect(W * 0.9 - 8, py + 8, 8, gy - py + 10);
      g.fillStyle = '#8A6038'; g.fillRect(10, py, W - 20, 9);
      g.fillStyle = '#A97A4A'; g.fillRect(10, py, W - 20, 3);
    }
    function dryPots(D, sp, rush, py, n, sw, U) {
      // heat shimmer when the drying is rushed
      if (rush && sp > 0.15) {
        g.strokeStyle = `rgba(230,120,40,${0.28 * Math.min(1, (sp - 0.15) * 3)})`; g.lineWidth = 1.5;
        for (let i = 0; i < n; i++) {
          const x = 20 + sw * (i + 0.5);
          for (let k = 0; k < 2; k++) {
            g.beginPath();
            for (let s = 0; s <= 12; s++) { const yy = py - U * 2.6 - s * 3 - k * 8; g.lineTo(x - 6 + k * 12 + Math.sin(s * 0.9 + S.t * 6 + i) * 3, yy); }
            g.stroke();
          }
        }
      }
      for (let i = 0; i < n; i++) {
        const pot = S.pots[i];
        const x = 20 + sw * (i + 0.5);
        const c = D.crackAt[i];
        const ck = c != null ? clamp((D.t - c) / 0.45) : 0;
        const jolt = c != null && D.t > c && D.t < c + 0.3 ? Math.sin((D.t - c) * 60) * 2.5 * (1 - (D.t - c) / 0.3) : 0;
        const gl = !pot.cracked && D.t > D.gleamAt ? Math.sin(clamp((D.t - D.gleamAt - i * 0.12) / 0.6) * Math.PI) : 0;
        drawPot(x + jolt, py, U, { e: 1, pot, dry: ease(sp), crack: ck, gleam: gl, rim: 0.28 });
      }
    }

    function draw() {
      g.save();
      g.beginPath(); g.roundRect(0, 0, W, H, 16); g.clip();
      if (S.dry) dryScene();
      else {
        backgroundCached();
        wheel();
        const t = S.tilt;
        clayTop(clamp(1 - t * 1.8));
        claySide(clamp((t - 0.35) / 0.5));
        hud();
      }
      g.restore();
      g.strokeStyle = 'rgba(164,122,44,.5)'; g.lineWidth = 2;
      g.beginPath(); g.roundRect(1, 1, W - 2, H - 2, 15); g.stroke();
    }

    const blankPot = () => ({ bumps: [], lean: 0, q: 1 });
    let working = blankPot();
    const cur = () => working;
    const HOLD = 1.15;

    // ---- the load choice
    const loadsEl = A.body.querySelector('.sh-loads');
    const potSvg = '<svg viewBox="0 0 20 24" aria-hidden="true"><path d="M6.5 2.5h7v1.6c0 1-1.3 1.4-1.3 2.4 0 1.3 5.3 2.8 5.3 8.8 0 4.2-3.2 6.6-7.5 6.6S2.5 19.5 2.5 15.3c0-6 5.3-7.5 5.3-8.8 0-1-1.3-1.4-1.3-2.4z" fill="#C47A45" stroke="#6A361C" stroke-width="1.3" stroke-linejoin="round"/><path d="M6 13c0-2 1.5-3.5 3-4" stroke="#F0BE8C" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>';
    for (const n of loads) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sh-load';
      b.dataset.n = n;
      b.innerHTML = `<span class="sh-pots">${potSvg.repeat(n)}</span><span class="ak-bi"></span>`;
      bi(b.querySelector('.ak-bi'), { my: `အိုး ${myNum(n)} လုံး`, en: `${n} pot${n > 1 ? 's' : ''}` });
      b.addEventListener('click', () => choose(n));
      loadsEl.appendChild(b);
    }

    function choose(n) {
      if (S.phase !== 'choose') return;
      S.load = n;
      S.budget = day / n;
      S.handPots = Math.min(n, rounds);
      loadsEl.classList.add('gone');
      setTimeout(() => (loadsEl.hidden = true), 260);
      startPot();
    }
    function status() {
      bi(statusEl, { my: `အိုး ${myNum(Math.min(S.pot + 1, S.load))} / ${myNum(S.load)}`, en: `Pot ${Math.min(S.pot + 1, S.load)} of ${S.load}` });
    }
    function startPot() {
      working = blankPot();
      const a = Math.random() * Math.PI * 2;
      const { ringR } = geo();
      S.off = { x: Math.cos(a) * ringR * 2.2, y: Math.sin(a) * ringR * 2.2 };
      Object.assign(S, { hold: 0, inT: 0, outT: 0, h: 0, pullQ: 1, vs: 0, potClock: 0, drop: 0, wasIn: false, hurried: false, phase: 'centre', tiltTo: 0, spin: 2.2 * rushK() });
      status();
      A.setHint(T.centre);
    }
    const rushK = () => Math.max(1, S.load / best);

    function centred() {
      S.qc = S.auto ? S.auto.care : clamp(S.inT / (S.inT + S.outT * 0.6 + 1e-3)) * (S.hurried ? 0.6 : 1);
      S.phase = 'tilting';
      S.tiltTo = 1;
      A.setHint(S.hurried ? T.hurry : T.pull, S.hurried ? 'warn' : '');
    }
    function potDone() {
      const pot = working;
      pot.q = clamp(S.qc * 0.45 + clamp(S.pullQ) * 0.55);
      S.h = 1;
      S.phase = 'done1';
      S.flash = 0;
      buzz(20);
      A.setHint(T.potDone, 'good');
    }
    function toShelf() {
      S.pots.push(working);
      S.fly = { i: S.pots.length - 1, t: 0 };
      S.phase = 'flying';
    }
    function afterFly() {
      S.fly = null;
      S.pot++;
      if (S.pot >= S.load) return startDry();
      if (S.pot >= S.handPots) return montage();
      startPot();
    }
    function montage() {
      S.phase = 'montage';
      S.tilt = S.tiltTo = 1;
      A.setHint(T.montage, 'warn');
      working = blankPot();
      S.h = 0; S.drop = 0; S.mt = 0;
      status();
    }
    function startDry() {
      // drying decides it: every pot over the right load dries too fast and cracks, the roughest first
      const cracked = Math.max(0, S.load - best);
      const order = S.pots.map((p, i) => [p.q - i * 0.001, i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
      const crackAt = {};
      order.slice(0, cracked).sort((a, b) => a - b).forEach((i, k) => { S.pots[i].cracked = true; crackAt[i] = 1.9 + k * 0.42; });
      S.pots.forEach((p, i) => { if (p.cracked) p.cracks = makeCracks(i + 3); });
      S.dry = { t: 0, sweep: 1.7, cracked, crackAt, gleamAt: cracked ? 1.9 + cracked * 0.42 + 0.1 : 1.9 };
      S.dry.end = S.dry.gleamAt + 0.9;
      S.phase = 'dry';
      statusEl.textContent = '';
      A.setHint(T.dry);
    }
    function makeCracks(seed) {
      const rnd = seededRandom(seed * 17);
      const lines = [];
      const k = 2 + Math.floor(rnd() * 2);
      for (let c = 0; c < k; c++) {
        const line = [];
        let fx = (rnd() - 0.5) * 1.1, u = 1;
        const end = 0.25 + rnd() * 0.35;
        while (u > end) { line.push([fx, u]); u -= 0.05 + rnd() * 0.05; fx = clamp(fx + (rnd() - 0.5) * 0.3, -0.85, 0.85); }
        lines.push(line);
        if (rnd() < 0.7 && line.length > 4) { // a branch
          const j = 2 + Math.floor(rnd() * (line.length - 3));
          const br = [line[j]];
          let [bx, bu] = line[j];
          for (let s = 0; s < 3; s++) { bx = clamp(bx + (rnd() < 0.5 ? -1 : 1) * (0.1 + rnd() * 0.12), -0.85, 0.85); bu -= 0.05 + rnd() * 0.04; br.push([bx, bu]); }
          lines.push(br);
        }
      }
      return lines;
    }
    async function endDry() {
      S.phase = 'end';
      const { cracked } = S.dry;
      const quality = S.pots.reduce((s, p) => s + p.q, 0) / S.pots.length;
      const score = clamp(quality * ((S.load - cracked) / S.load));
      const ok = cracked === 0 && quality >= 0.35;
      bi(endEl, cracked
        ? { my: `အိုး ${myNum(S.load)} လုံးထဲက ${myNum(cracked)} လုံး အက်ကွဲသွားတယ်။ အချိန်မလောက်လို့ အမြန် ခြောက်သွားတာ။`, en: `${cracked} of ${S.load} pots cracked. They dried too fast.` }
        : ok ? { my: `အိုး ${myNum(S.load)} လုံးလုံး မကွဲမအက်ဘဲ ကောင်းကောင်း ကျန်တယ်။`, en: `All ${S.load} pots came out whole.` }
          : { my: `အိုးတွေ မကွဲပေမဲ့ ပုံမညီဘူး၊ စောင်းနေတယ်။ အေးအေးဆေးဆေး ပြန်ပုံသွင်းရမယ်။`, en: 'No pot cracked, but they came out lopsided. Shape them again, slowly.' }); // DRAFT(my)
      endEl.dataset.tone = ok ? 'good' : 'warn';
      endEl.hidden = false;
      A.setHint({ my: 'နောက်တစ်နေ့ မနက် — အိုးတွေကို ကြည့်ရအောင်', en: 'Next morning: look at the pots' });
      const cr = A.card.getBoundingClientRect(), vr = cv.getBoundingClientRect();
      await A.seal(ok, [vr.left - cr.left + 70, vr.top - cr.top + 72], ok ? null : { my: 'မရသေး', en: 'Not yet' });
      nextBtn.hidden = false;
      nextBtn.focus({ preventScroll: true });
      const go = () => A.done({ ok, load: S.load, score, cracked, quality });
      nextBtn.addEventListener('click', go, { once: true });
      if (S.auto && !S.auto.stay) setTimeout(go, 500);
    }

    // ---- input
    let last = null, lastT = 0;
    A.down = false;
    const local = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (S.auto) return;
      A.down = true;
      try { cv.setPointerCapture(e.pointerId); } catch { /* synthetic */ }
      last = local(e); lastT = e.timeStamp;
      if (S.phase === 'pull') A.setHint(T.pull);
    });
    cv.addEventListener('pointermove', (e) => {
      if (!A.down || S.auto) return;
      const p = local(e);
      const dx = p[0] - last[0], dy = p[1] - last[1];
      const dt = Math.max(4, e.timeStamp - lastT) / 1000;
      last = p; lastT = e.timeStamp;
      if (S.phase === 'centre') { S.off.x += dx; S.off.y += dy; }
      else if (S.phase === 'pull') pullMove(dx, dy, dt);
    });
    const up = () => { A.down = false; };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    const pullPx = H * 0.62;
    function pullMove(dx, dy, dt) {
      if (dy < 0) {
        const speed = -dy / dt;
        S.vs = S.vs * 0.65 + speed * 0.35;
        S.h = clamp(S.h + -dy / pullPx);
        const vmax = H * 1.7;
        if (S.vs > vmax && S.t - S.lastBump > 0.12) { // rushing the pull: the wall ripples
          S.lastBump = S.t;
          const a = Math.min(0.16, (S.vs / vmax - 1) * 0.1 + 0.04) * (Math.random() < 0.5 ? -1 : 1);
          working.bumps.push({ u: clamp(S.h * 0.9 + 0.05), a });
          S.pullQ -= 0.08;
          if (S.t - S.lastShake > 0.5) { S.lastShake = S.t; A.shake(cv); buzz(12); A.setHint(T.pullFast, 'warn'); }
        }
        if (S.h >= 1) potDone();
      }
      if (Math.abs(dx) > 7) { // a jerk sideways leans the pot
        working.lean = clamp(working.lean + Math.sign(dx) * 0.04, -0.3, 0.3);
        S.pullQ -= 0.03;
      }
    }

    // ---- the loop
    let prev = performance.now();
    function frame(now) {
      if (A.closed()) return;
      if (S.freeze) { prev = now; raf = requestAnimationFrame(frame); return; } // tests: hold still for a screenshot
      const dt = Math.min(0.05, (now - prev) / 1000) * S.speed;
      prev = now;
      S.t += dt;
      S.theta += dt * S.spin * (S.phase === 'choose' || S.phase === 'end' ? 0.5 : 1);
      S.tilt += (S.tiltTo - S.tilt) * Math.min(1, dt * (S.auto ? 9 : 5));
      if (Math.abs(S.tilt - S.tiltTo) < 0.003) S.tilt = S.tiltTo;
      if (S.drop < 1) S.drop = Math.min(1, S.drop + dt * 3.2);
      step(dt);
      draw();
      raf = requestAnimationFrame(frame);
    }
    function step(dt) {
      const { ringR } = geo();
      switch (S.phase) {
        case 'centre': {
          if (S.drop < 1) break;
          S.potClock += dt;
          if (S.auto) {
            const care = S.auto.care;
            const jit = (1 - care) * ringR * 1.4;
            S.off.x = S.off.x * (1 - dt * 7) + Math.sin(S.t * 9) * jit * dt * 7;
            S.off.y = S.off.y * (1 - dt * 7) + Math.cos(S.t * 7) * jit * dt * 7;
            S.hold += dt * 2.4;
            if (S.hold >= HOLD) centred();
            break;
          }
          const k = rushK();
          const d = Math.hypot(S.off.x, S.off.y) || 1;
          const push = (A.down ? 16 : 34) * (0.7 + 0.4 * k);
          const wob = 30 * (0.7 + 0.45 * k);
          S.off.x += ((S.off.x / d) * push + Math.cos(S.t * 1.9 + Math.sin(S.t * 0.7) * 2) * wob) * dt;
          S.off.y += ((S.off.y / d) * push + Math.sin(S.t * 1.6 + Math.cos(S.t * 0.5) * 2) * wob) * dt;
          const lim = minWH * 0.42 * 0.36;
          const dd = Math.hypot(S.off.x, S.off.y);
          if (dd > lim) { S.off.x *= lim / dd; S.off.y *= lim / dd; }
          const inside = dd < ringR;
          if (A.down) {
            if (inside) { S.hold += dt; S.inT += dt; } else { S.outT += dt; S.hold = Math.max(0, S.hold - dt * 0.6); }
            if (S.wasIn && !inside && S.t - S.lastShake > 0.6) { S.lastShake = S.t; A.shake(cv); buzz(14); A.setHint(T.centreOut, 'warn'); }
            if (!S.wasIn && inside) A.setHint(T.centre);
          }
          S.wasIn = inside;
          if (S.hold >= HOLD) centred();
          else if (S.potClock > S.budget * 0.75 && !S.hurried) { S.hurried = true; A.setHint(T.hurry, 'warn'); }
          if (S.potClock > S.budget && S.hurried) centred(); // the day will not wait
          break;
        }
        case 'tilting':
          S.potClock += dt;
          if (S.tilt > 0.97) { S.tilt = 1; S.phase = 'pull'; }
          break;
        case 'pull':
          S.potClock += dt;
          if (S.auto) {
            S.h = clamp(S.h + dt * 1.7);
            if (S.auto.care < 0.75 && Math.random() < dt * 6) working.bumps.push({ u: clamp(S.h * 0.9 + 0.05), a: (Math.random() - 0.5) * 0.24 * (1 - S.auto.care) });
            S.pullQ = S.auto.care;
            if (S.h >= 1) potDone();
          } else if (S.potClock > S.budget) { // out of time: the pot is yanked up anyhow
            if (!S.hurried) { S.hurried = true; A.setHint(T.hurry, 'warn'); }
            S.h = clamp(S.h + dt * 1.4);
            if (Math.random() < dt * 8) working.bumps.push({ u: clamp(S.h * 0.9 + 0.05), a: (Math.random() - 0.5) * 0.2 });
            S.pullQ = Math.min(S.pullQ, 0.4);
            if (S.h >= 1) potDone();
          }
          break;
        case 'done1':
          S.flash += dt * 1.6;
          if (S.flash >= 1) toShelf();
          break;
        case 'flying':
          S.fly.t += dt * (S.auto ? 3 : 2.2);
          if (S.fly.t >= 1) afterFly();
          break;
        case 'montage': {
          S.mt += dt;
          S.theta += dt * 6;
          if (S.drop >= 1) S.h = clamp(S.h + dt * 3.2);
          if (S.drop >= 1 && Math.random() < dt * 10) working.bumps.push({ u: clamp(S.h * 0.9 + 0.05), a: (Math.random() - 0.5) * 0.18 });
          if (S.h >= 1) {
            working.q = 0.4;
            working.lean = (Math.random() - 0.5) * 0.25;
            S.pots.push(working);
            S.fly = { i: S.pots.length - 1, t: 0.25 };
            S.phase = 'mflying';
          }
          break;
        }
        case 'mflying':
          S.fly.t += dt * 3.2;
          if (S.fly.t >= 1) {
            S.fly = null;
            S.pot++;
            if (S.pot >= S.load) startDry();
            else { working = blankPot(); S.h = 0; S.drop = 0; S.phase = 'montage'; status(); }
          }
          break;
        case 'dry':
          S.dry.t += dt * (S.auto ? 1.4 : 1);
          for (const [i, c] of Object.entries(S.dry.crackAt)) {
            if (S.dry.t >= c && !S.dry['b' + i]) { S.dry['b' + i] = 1; buzz(25); A.shake(cv); }
          }
          if (S.dry.t >= S.dry.end) endDry();
          break;
        default: break;
      }
    }
    raf = requestAnimationFrame(frame);

    // tests and accessibility: "shape it for me" (care 0..1)
    A.wrap.autoShape = (load = best, care = 1, stay = false) => {
      S.auto = { care, stay };
      A.down = false;
      if (S.phase === 'choose') choose(loads.includes(load) ? load : loads[0]);
    };
    A.wrap.state = S;
    window.__act = A.wrap;
  });
}

function mix(a, b, t) {
  if (t <= 0) return a;
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * Math.min(1, t))).join(',')})`;
}

function injectShapeStyle() {
  if (document.getElementById('act-shape-style')) return;
  const s = document.createElement('style');
  s.id = 'act-shape-style';
  s.textContent = `
  .ak-shape .act-card { width: min(100%, 430px); }
  .sh-stage { position: relative; }
  .sh-stage canvas { border-radius: 16px; box-shadow: 0 4px 0 rgba(164,122,44,.25); }
  .sh-ui { min-height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; margin-top: 10px; }
  .sh-loads { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; transition: opacity .25s, transform .25s; }
  .ak-shape [hidden] { display: none !important; }
  .sh-loads.gone { opacity: 0; transform: translateY(8px); pointer-events: none; }
  .sh-load { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 92px; padding: 8px 10px 6px; border-radius: 16px; border: 2px solid #A47A2C;
    background: #FFFDF8; color: #2A2118; box-shadow: 0 3px 0 #C9A24A; cursor: pointer; font: 700 14px/1.5 "Noto Sans Myanmar", system-ui, sans-serif; }
  .sh-load:hover { background: #FFF8E8; }
  .sh-load:active { transform: translateY(2px); box-shadow: 0 1px 0 #C9A24A; }
  .sh-pots { display: flex; gap: 1px; height: 24px; align-items: flex-end; }
  .sh-pots svg { width: 17px; height: 21px; }
  .sh-status { color: #8C6A28; font-weight: 700; }
  .sh-status:empty { display: none; }
  .sh-end { margin: 0; max-width: 340px; font-weight: 700; animation: akhint .35s ease both; }
  .sh-end[data-tone="warn"] .ak-main { color: #A0452F; } .sh-end[data-tone="good"] .ak-main { color: #4F7F43; }
  `;
  document.head.appendChild(s);
}
