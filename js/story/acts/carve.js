// Handwork pattern "trace + lift": carve a border round Khwar Nyo's mark (Day 5, ch 10, Ko Lwin's shop).
//
//   const r = await carve({ title, hint, heat: [{ my, en, cool: { my, en } }], nickStays = true, tolerance = 22, lines? })
//   r = { ok: true, nicks: n, lifts: n }     (cancel: { ok: false, cancelled: true, nicks })
//
// Top-down on a small wooden stamp block on the bench: her design (inked curls) in the middle, a dotted
// border line round it, a gold dot where the cut starts. The finger is the gouge: following the line
// leaves a clean pale groove (wood curls pop out). Three times along the way a hot whisper rises from her
// design in red (`heat[i]`) and pulls the gouge inward, toward her design. The right move is to LIFT the
// finger within ~1.2 s: the words cool to blue (`cool`), the pull lets go, and the cut goes on from where it
// stopped. Not lifting: the gouge bites a small nick into the border (never into her design), a short "tk",
// the nick stays (`nicks++`). Wandering off the line beyond `tolerance` only pauses the groove. Always
// completes. (nickStays: false lets a nick be smoothed away by the next pass: the block shows no scar.)
//   lines: { firstLift, lift, nick, done }   optional lines shown in the hint (Ko Lwin's words, from the day)
//
// Test hook: window.__act.autoCarve(lift = true)
import { openAct, bi, wait, buzz, clamp, lerp } from './kit.js';
import { tr, lang } from '../../game/ui.js';

const T = {
  start: { my: 'ရွှေအစက်ကနေ စပြီး အနားကြောင်းအတိုင်း ဆွဲပါ', en: 'Start at the gold dot and follow the border' },
  lift: { my: 'လက်ကြွ…', en: 'Lift…' },
  again: { my: 'ရပ်ခဲ့တဲ့နေရာကနေ ပြန်ဆက်ပါ', en: 'Go on from where you stopped' },
  off: { my: 'အနားကြောင်းပေါ် ပြန်လာပါ', en: 'Back onto the line' },
};
const HOLD_MAX = 1.2; // seconds a hot thought can be held before it bites

export function carve({ title = '', hint = '', heat = [], nickStays = true, tolerance = 22, lines = {} } = {}) {
  return new Promise((resolve) => {
    let raf = 0;
    let nicks = 0, lifts = 0;
    const A = openAct({ title, hint, kind: 'carve', resolve: (r) => { cancelAnimationFrame(raf); resolve(r); }, onCancel: () => ({ nicks }) });
    injectCarveStyle();
    A.body.innerHTML = '<div class="cv-stage"><canvas></canvas></div><div class="cv-meta"><span class="cv-prog"><i></i></span></div>';
    const cv = A.body.querySelector('canvas');
    const progEl = A.body.querySelector('.cv-prog i');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round(Math.min(A.body.clientWidth || 360, 420));
    const H = Math.round(W * 0.92);
    cv.style.width = `${W}px`; cv.style.height = `${H}px`;
    cv.width = W * dpr; cv.height = H * dpr;
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    // ---- the block and the border path (rounded rectangle, clockwise from the top-left)
    const bx = W * 0.07, by = H * 0.07, bw = W * 0.86, bh = H * 0.86;
    const inset = Math.round(W * 0.075);
    const rx0 = bx + inset, ry0 = by + inset, rw = bw - inset * 2, rh = bh - inset * 2, rr = W * 0.06;
    const P = sampleRoundRect(rx0, ry0, rw, rh, rr, 260);
    const N = P.length;
    const cx = bx + bw / 2, cy = by + bh / 2;

    // heat events spread along the border
    const events = heat.map((h, i) => ({ h, at: Math.round(((i + 1) / (heat.length + 1)) * (N - 1)), state: 'wait', t: 0, cool: 0 }));
    const S = {
      pi: 0, down: false, fx: 0, fy: 0, bend: 0, bendTo: 0, active: null, chips: [], nicks: [], groove: [], t: 0,
      done: false, offT: 0, glow: 0, whisper: null, wT: 0, auto: null,
    };
    A.setHint(hint || T.start);

    function bentPoint(i) {
      // the pull: a bump of the guide toward her design, ahead of the cut
      const ev = S.active;
      const p = P[i];
      if (!S.bend || !ev) return p;
      const d = i - ev.at;
      const k = d < -4 ? 0 : Math.exp(-(((d - 14) / 14) ** 2));
      const m = S.bend * k;
      return { x: p.x + p.nx * m, y: p.y + p.ny * m, nx: p.nx, ny: p.ny };
    }

    // ---- input
    const local = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', (e) => {
      if (S.done) return;
      e.preventDefault();
      cv.setPointerCapture(e.pointerId);
      [S.fx, S.fy] = local(e);
      S.down = true;
    });
    cv.addEventListener('pointermove', (e) => { if (S.down) [S.fx, S.fy] = local(e); });
    const up = () => { if (!S.down) return; S.down = false; liftNow(); };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);

    function liftNow() {
      const ev = S.active;
      if (ev && ev.state === 'hot') {
        ev.state = 'cool';
        ev.cool = 0;
        lifts++;
        S.bendTo = 0;
        S.whisper = { line: ev.h.cool || ev.h, hot: false, t: 0 };
        buzz(12);
        A.setHint(lifts === 1 && lines.firstLift ? lines.firstLift : (lines.lift || T.again), 'good');
      }
    }
    function bite() {
      const ev = S.active;
      ev.state = 'nick';
      nicks++;
      const p = P[S.pi];
      S.nicks.push({ i: S.pi, x: p.x, y: p.y, nx: p.nx, ny: p.ny, tx: p.tx, ty: p.ty, healed: false });
      S.bendTo = 0;
      S.whisper = { line: ev.h, hot: true, t: 0, fading: true };
      tk();
      buzz(40);
      A.shake(cv);
      A.setHint(lines.nick || T.again, 'warn');
    }

    // ---- simulation
    function step(dt) {
      S.t += dt;
      S.bend = lerp(S.bend, S.bendTo, 1 - Math.exp(-dt * (S.bendTo ? 3.2 : 6)));
      const ev = S.active;
      if (ev && ev.state === 'hot') {
        ev.t += dt;
        if (ev.t > HOLD_MAX && S.down) bite();
      }
      if (ev && ev.state !== 'hot' && S.bend < 0.4) S.active = null;
      if (S.whisper) S.whisper.t += dt;
      // chips
      for (const c of S.chips) { c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 260 * dt; c.r += c.vr * dt; }
      S.chips = S.chips.filter((c) => c.t < 0.9);
      if (!S.down || S.done) return;
      // the gouge advances when the finger is near the line just ahead of the cut
      let best = -1, bd = Infinity;
      for (let i = Math.max(0, S.pi - 4); i <= Math.min(N - 1, S.pi + 16); i++) {
        const q = P[i];
        const d = Math.hypot(q.x - S.fx, q.y - S.fy);
        if (d < bd) { bd = d; best = i; }
      }
      const tol = tolerance + S.bend * 0.6;
      if (bd > tol) { S.offT += dt; if (S.offT > 0.5) A.setHint(T.off, 'warn'); return; }
      if (S.offT > 0.5) A.setHint(hint || T.start);
      S.offT = 0;
      // a hot thought only lets the cut creep on, pulled inward
      let maxStep = 6;
      if (ev && ev.state === 'hot') { S.creep = (S.creep || 0) + dt; maxStep = S.creep > 0.11 ? 1 : 0; if (maxStep) S.creep = 0; }
      const to = Math.min(best, S.pi + maxStep);
      for (let i = S.pi + 1; i <= to; i++) {
        const q = bentPoint(i);
        S.groove.push({ x: q.x, y: q.y });
        if (i % 3 === 0) chip(q);
        // the next hot thought
        const nx = events.find((e) => e.state === 'wait' && i >= e.at);
        if (nx) {
          nx.state = 'hot'; nx.t = 0;
          S.active = nx; S.bendTo = Math.min(18, inset * 0.8);
          S.whisper = { line: nx.h, hot: true, t: 0 };
          A.setHint(T.lift, 'warn');
          buzz(8);
          S.pi = i;
          break;
        }
        S.pi = i;
      }
      if (!nickStays) for (const n of S.nicks) if (!n.healed && S.pi > n.i + 40) n.healed = true;
      progEl.style.width = `${(S.pi / (N - 1)) * 100}%`;
      if (S.pi >= N - 1) finish();
    }
    function chip(q) {
      if (S.chips.length > 40) return;
      const a = Math.atan2(q.y - cy, q.x - cx) + (Math.random() - 0.5);
      S.chips.push({ x: q.x, y: q.y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 40 - 70, r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, t: 0, s: 2 + Math.random() * 2.5 });
    }
    async function finish() {
      if (S.done) return;
      S.done = true;
      S.down = false;
      A.setHint(lines.done || { my: 'အနားကွပ် ပြီးပြီ', en: 'The border is cut' }, 'good');
      await wait(700);
      await A.seal(true);
      A.done({ ok: true, nicks, lifts });
    }

    // ---- sound: the gouge's "tk"
    let AC = null;
    function tk() {
      try { if (localStorage.getItem('mw-muted') === '1') return; } catch { /* storage blocked */ }
      try {
        AC = AC || new (window.AudioContext || window.webkitAudioContext)();
        const t = AC.currentTime, n = AC.sampleRate * 0.05, buf = AC.createBuffer(1, n, AC.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3;
        const src = AC.createBufferSource(), f = AC.createBiquadFilter(), gn = AC.createGain();
        src.buffer = buf; f.type = 'bandpass'; f.frequency.value = 1800; gn.gain.value = 0.5;
        src.connect(f).connect(gn).connect(AC.destination); src.start(t);
      } catch { /* no audio */ }
    }

    // ---- drawing
    const grain = makeGrain(W, H, bx, by, bw, bh);
    function draw() {
      g.clearRect(0, 0, W, H);
      g.drawImage(grain, 0, 0, W, H);
      // her design (Khwar Nyo's mark): inked curls in the middle, glowing faintly red when a hot thought rises
      const hot = S.active && S.active.state === 'hot' ? 1 : 0;
      S.glow = lerp(S.glow, hot, 0.08);
      drawMark(g, cx, cy, Math.min(rw, rh) * 0.34, S.glow, S.t);
      // the guide: dotted line (bent by the pull), the gold start dot
      g.fillStyle = 'rgba(42,33,24,.5)';
      for (let i = S.pi + 2; i < N; i += 3) { const q = bentPoint(i); g.beginPath(); g.arc(q.x, q.y, 1.7, 0, 7); g.fill(); }
      if (S.pi < 2) { g.fillStyle = '#C9A24A'; g.strokeStyle = '#8C6A28'; g.lineWidth = 2; g.beginPath(); g.arc(P[0].x, P[0].y, 8 + Math.sin(S.t * 4) * 1.2, 0, 7); g.fill(); g.stroke(); }
      // nicks: little bites inward
      for (const n of S.nicks) {
        if (n.healed) continue;
        g.fillStyle = '#7A5230';
        g.beginPath();
        g.moveTo(n.x - n.tx * 6, n.y - n.ty * 6);
        g.lineTo(n.x + n.nx * 11, n.y + n.ny * 11);
        g.lineTo(n.x + n.tx * 6, n.y + n.ty * 6);
        g.closePath(); g.fill();
        g.fillStyle = '#F2DDB5';
        g.beginPath(); g.moveTo(n.x - n.tx * 4, n.y - n.ty * 4); g.lineTo(n.x + n.nx * 8, n.y + n.ny * 8); g.lineTo(n.x + n.tx * 1, n.y + n.ty * 1); g.closePath(); g.fill();
      }
      // the groove: a dark edge and a pale cut
      if (S.groove.length > 1) {
        g.lineCap = 'round'; g.lineJoin = 'round';
        const path = () => { g.beginPath(); g.moveTo(P[0].x, P[0].y); for (const q of S.groove) g.lineTo(q.x, q.y); };
        g.strokeStyle = '#7A5230'; g.lineWidth = 6.5; path(); g.stroke();
        g.save(); g.translate(-0.9, -0.9);
        g.strokeStyle = '#F4E0B8'; g.lineWidth = 3.6; path(); g.stroke();
        g.restore();
        g.strokeStyle = 'rgba(255,250,235,.7)'; g.lineWidth = 1; g.save(); g.translate(-1.6, -1.6); path(); g.stroke(); g.restore();
      }
      // chips
      for (const c of S.chips) {
        g.save(); g.translate(c.x, c.y); g.rotate(c.r);
        g.globalAlpha = 1 - c.t / 0.9;
        g.fillStyle = '#F2D9A8'; g.strokeStyle = '#A47A4A'; g.lineWidth = 1;
        g.beginPath(); g.arc(0, 0, c.s, 0.3, Math.PI * 1.6); g.stroke(); g.fill();
        g.restore();
      }
      g.globalAlpha = 1;
      // the gouge (a little steel blade + handle) at the cut
      const tip = S.pi > 0 ? S.groove[S.groove.length - 1] : P[0];
      if (S.down || S.pi > 0) {
        const t = P[Math.min(N - 1, S.pi)];
        g.save(); g.translate(tip.x, tip.y); g.rotate(Math.atan2(t.ty, t.tx) - 0.8);
        g.fillStyle = 'rgba(42,33,24,.18)'; g.fillRect(4, 6, 46, 8);
        g.fillStyle = '#B9C0C6'; g.fillRect(-2, -2.5, 16, 5); g.strokeStyle = '#2A2118'; g.lineWidth = 1.4; g.strokeRect(-2, -2.5, 16, 5);
        g.fillStyle = '#8A5A2C'; g.fillRect(14, -4, 30, 8); g.strokeRect(14, -4, 30, 8);
        g.fillStyle = '#C9A24A'; g.fillRect(14, -4, 3, 8);
        g.restore();
      }
      // the whisper: red and rising (hot), blue and settling (cool)
      const w = S.whisper;
      if (w && w.t < (w.hot ? (w.fading ? 1.2 : 99) : 2.6)) {
        const txt = tr(w.line);
        const a = w.hot ? (w.fading ? Math.max(0, 1 - w.t / 1.2) : Math.min(1, w.t * 3)) : Math.min(1, w.t * 3) * Math.min(1, (2.6 - w.t) * 2);
        const yy = cy - Math.min(rw, rh) * 0.06 - (w.hot ? Math.min(1, w.t) * 18 : 4);
        g.save();
        g.globalAlpha = a;
        g.font = `700 ${w.hot ? 17 : 14}px "Noto Sans Myanmar", system-ui, sans-serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        const wx = cx + (w.hot ? Math.sin(S.t * 9) * 1.4 : 0);
        const tw = g.measureText(txt).width;
        const other = lang() === 'en' ? (w.line.my || null) : (w.line.en || null);
        const OF = lang() === 'en' ? '600 12.5px "Noto Sans Myanmar", system-ui, sans-serif' : '600 12.5px system-ui, -apple-system, "Segoe UI", sans-serif';
        g.font = OF;
        const ow = other ? g.measureText(other).width : 0;
        g.font = `700 ${w.hot ? 17 : 14}px "Noto Sans Myanmar", system-ui, sans-serif`;
        const bw2 = Math.min(W - 16, tw + 26), bh2 = 30;
        g.fillStyle = w.hot ? 'rgba(255,236,220,.96)' : 'rgba(234,244,250,.96)';
        g.beginPath(); g.roundRect(wx - bw2 / 2, yy - 15, bw2, bh2, 15); g.fill();
        g.strokeStyle = w.hot ? '#C0392B' : '#3F7FA6'; g.lineWidth = 1.6; g.stroke();
        g.fillStyle = w.hot ? '#B3322E' : '#2F6A90';
        g.fillText(txt, wx, yy + 1);
        if (other) { // the other language on its own solid cream pill just under, so the glowing mark never shows through
          const ow2 = Math.min(W - 24, ow + 18), oy = yy + 19;
          g.fillStyle = '#FFFBF2';
          g.beginPath(); g.roundRect(wx - ow2 / 2, oy, ow2, 21, 10.5); g.fill();
          g.strokeStyle = w.hot ? 'rgba(179,50,46,.55)' : 'rgba(63,127,166,.55)'; g.lineWidth = 1; g.stroke();
          g.font = OF; g.fillStyle = w.hot ? '#7E2420' : '#24506E';
          g.fillText(other, wx, oy + 11);
        }
        if (w.hot && !w.fading) { // heat shimmer
          g.strokeStyle = 'rgba(192,57,43,.45)'; g.lineWidth = 1.6;
          for (let k = -1; k <= 1; k++) { g.beginPath(); const x = wx + k * 22; for (let y = 0; y < 22; y += 2) g.lineTo(x + Math.sin(S.t * 8 + y * 0.5 + k) * 3, yy - 20 - y); g.stroke(); }
        }
        // the hold ring: how long before it bites
        if (w.hot && !w.fading && S.active) {
          const f = clamp(S.active.t / HOLD_MAX);
          g.strokeStyle = '#B3322E'; g.lineWidth = 3;
          g.beginPath(); g.arc(tip.x, tip.y, 16, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); g.stroke();
        }
        g.restore();
      }
    }

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (S.auto) S.auto(dt);
      step(dt);
      draw();
      if (!A.closed()) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    // tests and accessibility: "carve it for me" (lift = false keeps pressing through the hot thoughts)
    A.wrap.autoCarve = (lift = true) => {
      let i = 0, pause = 0;
      S.down = true;
      S.auto = (dt) => {
        if (S.done) { S.auto = null; return; }
        if (pause > 0) { pause -= dt; if (pause <= 0) S.down = true; return; }
        const ev = S.active;
        if (ev && ev.state === 'hot') {
          if (lift && ev.t > 0.45) { S.down = false; liftNow(); pause = 0.6; return; }
          const q = P[Math.min(N - 1, S.pi + 1)];
          S.fx = q.x; S.fy = q.y;
          return;
        }
        i = Math.min(N - 1, S.pi + 3);
        S.fx = P[i].x; S.fy = P[i].y;
      };
    };
    A.wrap.state = S;
    window.__act = A.wrap;
  });
}

// evenly spaced points round a rounded rectangle, clockwise from the top-left; tangent and inward normal
function sampleRoundRect(x, y, w, h, r, n) {
  const segs = [];
  const line = (x0, y0, x1, y1) => segs.push({ len: Math.hypot(x1 - x0, y1 - y0), at: (u) => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u] });
  const arc = (ax, ay, a0) => segs.push({ len: (Math.PI / 2) * r, at: (u) => { const a = a0 + u * Math.PI / 2; return [ax + Math.cos(a) * r, ay + Math.sin(a) * r]; } });
  line(x + r, y, x + w - r, y); arc(x + w - r, y + r, -Math.PI / 2);
  line(x + w, y + r, x + w, y + h - r); arc(x + w - r, y + h - r, 0);
  line(x + w - r, y + h, x + r, y + h); arc(x + r, y + h - r, Math.PI / 2);
  line(x, y + h - r, x, y + r); arc(x + r, y + r, Math.PI);
  const total = segs.reduce((s, q) => s + q.len, 0);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    let d = (i / n) * total * 0.995;
    let k = 0;
    while (k < segs.length - 1 && d > segs[k].len) { d -= segs[k].len; k++; }
    const [px, py] = segs[k].at(Math.min(1, d / segs[k].len));
    pts.push({ x: px, y: py });
  }
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const tx = (b.x - a.x) / l, ty = (b.y - a.y) / l;
    Object.assign(pts[i], { tx, ty, nx: -ty, ny: tx });
  }
  return pts;
}

// the bench and the block: drawn once to an offscreen canvas
function makeGrain(W, H, bx, by, bw, bh) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const c = document.createElement('canvas');
  c.width = W * dpr; c.height = H * dpr;
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // bench planks
  g.fillStyle = '#6B4A30';
  g.beginPath(); g.roundRect(0, 0, W, H, 14); g.fill();
  for (let y = 0; y < H; y += H / 5) {
    g.fillStyle = rnd() < 0.5 ? '#74513A' : '#664530';
    g.fillRect(0, y + 1, W, H / 5 - 2);
    g.fillStyle = 'rgba(30,18,10,.35)'; g.fillRect(0, y, W, 1.5);
    g.strokeStyle = 'rgba(40,24,12,.25)'; g.lineWidth = 1;
    for (let k = 0; k < 3; k++) { g.beginPath(); const yy = y + 6 + rnd() * (H / 5 - 12); g.moveTo(0, yy); for (let x = 0; x < W; x += 20) g.lineTo(x, yy + Math.sin(x * 0.03 + k) * 1.5); g.stroke(); }
  }
  // a few scattered shavings on the bench
  for (let k = 0; k < 7; k++) { g.strokeStyle = '#D9B98A'; g.lineWidth = 1.6; g.beginPath(); g.arc(rnd() * W, rnd() < 0.5 ? rnd() * by : by + bh + rnd() * (H - by - bh), 3 + rnd() * 3, 0, 4); g.stroke(); }
  // the block's shadow, sides, top
  g.fillStyle = 'rgba(20,12,6,.35)'; g.beginPath(); g.roundRect(bx + 6, by + 10, bw, bh, 10); g.fill();
  g.fillStyle = '#B98A55'; g.beginPath(); g.roundRect(bx, by + 6, bw, bh, 10); g.fill();
  const top = g.createLinearGradient(bx, by, bx + bw, by + bh);
  top.addColorStop(0, '#EED3A0'); top.addColorStop(1, '#DDB97E');
  g.fillStyle = top; g.beginPath(); g.roundRect(bx, by, bw, bh, 10); g.fill();
  // grain: long wavy lines and a knot
  g.save(); g.beginPath(); g.roundRect(bx, by, bw, bh, 10); g.clip();
  const kx = bx + bw * 0.78, ky = by + bh * 0.2;
  for (let i = 0; i < 26; i++) {
    const y0 = by + (i / 26) * bh + rnd() * 4;
    g.strokeStyle = `rgba(150,100,50,${0.12 + rnd() * 0.16})`; g.lineWidth = 0.8 + rnd() * 1.2;
    g.beginPath();
    for (let x = bx; x <= bx + bw; x += 6) {
      const dk = Math.hypot(x - kx, y0 - ky);
      const push = dk < 60 ? (60 - dk) * 0.25 * Math.sign(y0 - ky || 1) : 0;
      g.lineTo(x, y0 + Math.sin(x * 0.02 + i) * 2 + push);
    }
    g.stroke();
  }
  g.strokeStyle = 'rgba(130,80,40,.45)'; g.lineWidth = 1.4;
  for (let r = 3; r < 14; r += 3.5) { g.beginPath(); g.ellipse(kx, ky, r * 1.5, r, 0, 0, 7); g.stroke(); }
  g.restore();
  // top bevel highlight
  g.strokeStyle = 'rgba(255,248,230,.75)'; g.lineWidth = 2; g.beginPath(); g.roundRect(bx + 2, by + 2, bw - 4, bh - 4, 9); g.stroke();
  g.strokeStyle = '#2A2118'; g.lineWidth = 2; g.beginPath(); g.roundRect(bx, by, bw, bh + 6, 10); g.stroke();
  return c;
}

// Khwar Nyo's mark: a ring of three curls and leaves round a small flower, in maroon ink (original motif)
function drawMark(g, cx, cy, R, glow, t) {
  g.save();
  g.translate(cx, cy);
  if (glow > 0.02) {
    const gr = g.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 1.3);
    gr.addColorStop(0, `rgba(226,90,60,${0.35 * glow})`); gr.addColorStop(1, 'rgba(226,90,60,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R * 1.3, 0, 7); g.fill();
  }
  const ink = '#6E1F2A';
  g.strokeStyle = ink; g.fillStyle = ink; g.lineCap = 'round'; g.lineJoin = 'round';
  for (let k = 0; k < 3; k++) {
    g.save(); g.rotate(k * (Math.PI * 2 / 3) + 0.3);
    // a curl: spiral from the centre outward
    g.lineWidth = R * 0.075;
    g.beginPath();
    for (let a = 0; a < Math.PI * 2.6; a += 0.12) { const r = R * (0.92 - a / (Math.PI * 2.6) * 0.62); const x = Math.cos(a) * r * 0.42 + R * 0.5, y = Math.sin(a) * r * 0.42; if (a === 0) g.moveTo(x, y); else g.lineTo(x, y); }
    g.stroke();
    // a leaf between curls
    g.rotate(Math.PI / 3);
    g.beginPath(); g.moveTo(R * 0.28, 0); g.quadraticCurveTo(R * 0.6, -R * 0.18, R * 0.9, 0); g.quadraticCurveTo(R * 0.6, R * 0.18, R * 0.28, 0); g.fill();
    g.strokeStyle = '#E9C890'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(R * 0.34, 0); g.lineTo(R * 0.82, 0); g.stroke(); g.strokeStyle = ink;
    g.restore();
  }
  // the flower at the centre: five petals
  for (let k = 0; k < 5; k++) { g.save(); g.rotate(k * Math.PI * 2 / 5 + t * 0); g.beginPath(); g.ellipse(0, -R * 0.16, R * 0.08, R * 0.15, 0, 0, 7); g.fill(); g.restore(); }
  g.fillStyle = '#C9A24A'; g.beginPath(); g.arc(0, 0, R * 0.07, 0, 7); g.fill();
  g.restore();
}

function injectCarveStyle() {
  if (document.getElementById('act-carve-style')) return;
  const s = document.createElement('style');
  s.id = 'act-carve-style';
  s.textContent = `
  .ak-carve .ak-sub { letter-spacing: 0 !important; word-spacing: 0; font-kerning: normal; text-rendering: geometricPrecision; }
  .ak-carve .act-card { width: min(100%, 460px); }
  .cv-stage { position: relative; } .cv-stage canvas { border-radius: 14px; box-shadow: 0 4px 12px rgba(59,42,26,.18); }
  .cv-meta { display: flex; justify-content: center; margin-top: 10px; }
  .cv-prog { position: relative; width: 60%; height: 8px; border-radius: 4px; background: #E9DCC0; overflow: hidden; box-shadow: inset 0 1px 2px rgba(59,42,26,.2); }
  .cv-prog i { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: linear-gradient(90deg, #C9A24A, #A47A2C); border-radius: 4px; }
  `;
  document.head.appendChild(s);
}
void bi;
