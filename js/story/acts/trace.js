// Handwork pattern 1: trace a path with a finger (stitching, folding, lettering).
//
//   const r = await trace({ title, hint, path: 'stitch'|'fold', wobble: px, tolerance: px, round, rounds })
//   r = { ok: boolean, score: 0..1, error: px, stray: px }
//   optional `stray: px`: also fail when the drawn line wanders from the guide by more than this on
//   average (the coverage test alone lets a wobbly line pass as long as it crosses every dot). Off
//   when not given, so callers that do not pass it score exactly as before.
//
// The traced line is the person's hand: it carries a wobble of `wobble` px on top of the player's own
// finger. Practice lowers the wobble (the caller passes less each attempt), and the player's care
// matters as much: a rushed or careless trace fails however small the wobble is.
import { tr } from '../../game/ui.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function pathPoints(kind, W, H) {
  const pts = [];
  if (kind === 'fold') {
    // two folds of a paper windmill: corner to centre, four times
    const c = [W / 2, H / 2];
    const corners = [[W * 0.14, H * 0.18], [W * 0.86, H * 0.18], [W * 0.86, H * 0.82], [W * 0.14, H * 0.82]];
    for (const k of corners) for (let i = 0; i <= 20; i++) pts.push([k[0] + (c[0] - k[0]) * (i / 20), k[1] + (c[1] - k[1]) * (i / 20), pts.length && i === 0]);
    return pts;
  }
  // a running stitch along the spine of the book: a gentle S across the cloth
  for (let i = 0; i <= 80; i++) {
    const u = i / 80;
    pts.push([W * (0.08 + 0.84 * u), H * (0.5 + 0.22 * Math.sin(u * Math.PI * 2)), false]);
  }
  return pts;
}

export function trace({ title = '', hint = '', path = 'stitch', wobble = 10, tolerance = 18, round = 1, rounds = 3, colors = {}, stray: strayMax = 0 } = {}) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'act-wrap';
    wrap.innerHTML = `<div class="act-card"><p class="act-title"></p><p class="act-hint"></p><canvas></canvas><div class="act-meta"><span class="act-round"></span><span class="act-score"></span></div></div>`;
    wrap.querySelector('.act-title').textContent = tr(title);
    wrap.querySelector('.act-hint').textContent = tr(hint);
    wrap.querySelector('.act-round').textContent = rounds > 1 ? `${round} / ${rounds}` : '';
    document.getElementById('game').appendChild(wrap);
    document.getElementById('game').classList.add('acting');
    const cv = wrap.querySelector('canvas');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.min(window.innerWidth - 48, 420), H = Math.round(W * 0.62);
    cv.style.width = `${W}px`;
    cv.style.height = `${H}px`;
    cv.width = W * dpr;
    cv.height = H * dpr;
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    const P = pathPoints(path, W, H);
    const cloth = colors.cloth || (path === 'fold' ? '#F6E7B4' : '#E9DCC0');
    const thread = colors.thread || (path === 'fold' ? '#A47A2C' : '#6E1F2A');
    const drawn = [];
    let seed = Math.random() * 100;

    function draw() {
      g.clearRect(0, 0, W, H);
      g.fillStyle = cloth;
      g.beginPath(); g.roundRect(4, 4, W - 8, H - 8, 14); g.fill();
      if (path === 'stitch') { // the fold of the spine
        g.strokeStyle = 'rgba(90,67,32,.18)'; g.lineWidth = 2;
        for (let y = 18; y < H - 10; y += 14) { g.beginPath(); g.moveTo(10, y); g.lineTo(W - 10, y); g.stroke(); }
      }
      // the guide: dots to follow
      g.fillStyle = 'rgba(42,33,24,.45)';
      for (let i = 0; i < P.length; i += 2) { g.beginPath(); g.arc(P[i][0], P[i][1], 2.6, 0, 7); g.fill(); }
      g.fillStyle = '#C9A24A';
      g.beginPath(); g.arc(P[0][0], P[0][1], 9, 0, 7); g.fill();
      // the hand's line
      g.strokeStyle = thread; g.lineWidth = 4.5; g.lineCap = 'round'; g.lineJoin = 'round';
      if (path === 'stitch') g.setLineDash([12, 8]);
      g.beginPath();
      drawn.forEach((p, i) => (i && !p[2] ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      g.stroke();
      g.setLineDash([]);
    }
    draw();

    let down = false, t0 = 0, len = 0;
    const local = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      down = true; cv.setPointerCapture(e.pointerId);
      if (!drawn.length) t0 = performance.now();
      const [x, y] = local(e);
      drawn.push([x, y, true]);
      draw();
    });
    cv.addEventListener('pointermove', (e) => {
      if (!down) return;
      const [x, y] = local(e);
      const last = drawn[drawn.length - 1];
      const d = Math.hypot(x - last[0], y - last[1]);
      if (d < 3) return;
      len += d;
      // the hand's tremble: slow drift plus a quick shake, both scaled by `wobble`
      seed += d * 0.05;
      const wx = Math.sin(seed * 1.7) * 0.6 + Math.sin(seed * 5.3) * 0.4;
      const wy = Math.cos(seed * 1.3) * 0.6 + Math.sin(seed * 6.1) * 0.4;
      drawn.push([x + wx * wobble, y + wy * wobble, false]);
      draw();
    });
    const up = () => {
      if (!down) return;
      down = false;
      // finished when the line has reached the far end of the guide
      const end = P[P.length - 1];
      const near = drawn.some((p) => Math.hypot(p[0] - end[0], p[1] - end[1]) < 26);
      if (near || len > W * 2.6) finish();
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);

    async function finish() {
      // score: how much of the guide was followed, and how far the line strayed
      let covered = 0, errSum = 0;
      for (const q of P) {
        let best = Infinity;
        for (const p of drawn) { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < best) best = d; }
        if (best < tolerance * 1.6) covered++;
        errSum += Math.min(best, 60);
      }
      const coverage = covered / P.length;
      const error = errSum / P.length;
      // how far the line itself wanders from the guide (mean distance of the drawn points to the guide's
      // segments; a new stroke of the guide does not join the one before)
      let stray = 0;
      if (drawn.length) {
        for (const p of drawn) {
          let best = Infinity;
          for (let i = 1; i < P.length; i++) {
            if (P[i][2]) continue;
            const a = P[i - 1], b = P[i], dx = b[0] - a[0], dy = b[1] - a[1];
            const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
            const d = Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
            if (d < best) best = d;
          }
          stray += Math.min(best, 60);
        }
        stray /= drawn.length;
      }
      const ok = coverage >= 0.85 && error <= tolerance && (!strayMax || stray <= strayMax);
      const score = Math.max(0, Math.min(1, coverage * (1 - Math.max(0, error - 4) / (tolerance * 2.5))));
      const s = wrap.querySelector('.act-score');
      s.textContent = ok ? '✓' : '…';
      s.className = `act-score ${ok ? 'good' : 'again'}`;
      await wait(700);
      wrap.remove();
      document.getElementById('game').classList.remove('acting');
      resolve({ ok, score, error, coverage, stray, ms: performance.now() - t0 });
    }
    // tests and accessibility: a "trace it for me" hook (a perfect line, still carrying the wobble)
    wrap.autoTrace = (care = 1) => {
      seed = 1;
      drawn.length = 0;
      P.forEach((q, i) => {
        seed += 0.4;
        const wx = Math.sin(seed * 1.7) * 0.6 + Math.sin(seed * 5.3) * 0.4;
        const wy = Math.cos(seed * 1.3) * 0.6 + Math.sin(seed * 6.1) * 0.4;
        // (care < 1: a rushed line that also strays across the guide, so a `stray` limit catches it)
        drawn.push([q[0] + wx * wobble + (1 - care) * 30 * Math.sin(i), q[1] + wy * wobble + (1 - care) * 16 * Math.sin(i * 0.37 + 1), q[2] || i === 0]);
      });
      draw();
      finish();
    };
    window.__act = wrap;
  });
}
