// Handwork pattern 1, second edition: trace a path with a finger. Wraps acts/trace.js (its path table is
// private, so the 'stitch' and 'fold' geometry and the scoring rules are copied here unchanged) inside the
// kit.js paper card, and adds the new paths of the day specs:
//
//   const r = await trace({ title, hint, path, glyph?, wobble, tolerance, round, rounds, colors? })
//   r = { ok, score: 0..1, error: px, coverage: 0..1, ms }      (✕ / Escape: { ok: false, cancelled: true, score: 0 })
//
//   path 'stitch'  (trace.js default) a running stitch along a book spine: one S across the cloth
//        'fold'    (trace.js) a paper windmill: four corners to the centre
//        'boat'    (Day 3) three folds of a paper boat on a landscape sheet: the top edge down to the middle,
//                  the two top corners down to the centre line, the bottom brim up. Each finished crease
//                  folds the paper on the desk, so the boat takes shape as you go.
//        'road'    (Day 7) Ye Yint's backdrop: round 1 one brush stroke along the painted road, which bends
//                  twice then runs straight onto the bridge; round 2 the bridge's top rail. Maroon paint on
//                  cream cloth.
//        'row'     (Day 12) three short parallel furrows across the wet far bed, left to right, in the rain;
//                  a seed drops every 30 px along the drawn line.
//        'word'    (Day 15) one short Burmese word (`glyph`, default «စာ») from a gold dot, on a round paper
//                  lantern; the word appears in gold (`colors.ink`) as it is traced.
//   colors: { ink | thread, paper | cloth }   override the line / ground colours
//
// Rules (as trace.js): the drawn line is the person's hand, carrying a wobble of `wobble` px on top of the
// player's own finger; practice lowers it (the caller passes less each attempt) and a rushed or careless
// trace fails however small the wobble is. ok = 85 % of the guide covered and a mean error ≤ `tolerance`.
// Retries are the caller's loop. No lines are spoken here.
//
// Glyph strokes: GLYPHS[glyph] (polylines in 0..1 of the glyph box) when present, otherwise the strokes
// are found from the game font itself (the glyph is drawn, thinned to its centre line and walked), so any
// short word works. The faint glyph shows under the gold dots.
//
// Test hook: window.__act.autoTrace(care = 1)   (care < 1 strays off the line on purpose)
import { openAct, wait, myNum, buzz, clamp, lerp, ease, seededRandom } from './kit.js';

export const PATHS = ['stitch', 'fold', 'boat', 'road', 'row', 'word'];
// Hand-made stroke tables, in writing order. Either a list of polylines in 0..1 of the glyph box, or
// { aspect, strokes } with x in 0..1 of the ink's width and y in 0..aspect (the ink keeps its shape and is
// fitted and centred like the font). Words without a table fall back to the font's thinned centre line.
const arcPts = (cx, cy, rx, ry, a0, a1, n = 28) => Array.from({ length: n + 1 }, (_, i) => {
  const a = (a0 + (a1 - a0) * (i / n)) * Math.PI / 180;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});
// «စာ», drawn from the letterforms' centre lines (ink box 385 x 210 units): စ is the inner lens stroke
// rising from its lower join, then once round the bowl; ာ is the hook from the join over the top and
// down, ending in its small flick to the left.
const SA = (() => {
  const N = (pts) => pts.map(([x, y]) => [(x - 103) / 385, (y - 210) / 385]);
  const lens = [[156, 382], [172, 368], [186, 346], [194, 322], [195, 306], [189, 282], [176, 262], [157, 247]];
  const bowl = arcPts(206, 315, 90, 92, -127, 233, 44);
  const aa = [...arcPts(383, 315, 90, 92, -151, 94, 34), [366, 407], [351, 411]];
  return { aspect: 210 / 385, strokes: [N([...lens, ...bowl]), N(aa)] };
})();
export const GLYPHS = { 'စာ': SA };

const RATIO = { stitch: 0.62, fold: 0.86, boat: 0.72, road: 0.78, row: 0.8, word: 0.96 };
const STEP = 5; // px between guide points

export function trace({ title = '', hint = '', path = 'stitch', glyph = 'စာ', wobble = 10, tolerance = 18, round = 1, rounds = 3, colors = {} } = {}) {
  if (!PATHS.includes(path)) path = 'stitch';
  return new Promise((resolve) => {
    let raf = 0;
    const A = openAct({ title, hint, kind: `trace trace-${path}`, resolve: (r) => { cancelAnimationFrame(raf); resolve(r); }, onCancel: () => ({ score: 0 }) });
    injectTraceStyle();
    A.body.innerHTML = '<div class="tr2-stage"><canvas></canvas></div><div class="tr2-meta"><span class="tr2-pips"></span><span class="tr2-round"></span></div>';
    const cv = A.body.querySelector('canvas');
    const pipsEl = A.body.querySelector('.tr2-pips');
    A.body.querySelector('.tr2-round').textContent = rounds > 1 ? `${myNum(round)} / ${myNum(rounds)}` : '';
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round(Math.min(A.body.clientWidth || 360, 420));
    const H = Math.round(W * RATIO[path]);
    cv.style.width = `${W}px`; cv.style.height = `${H}px`;
    cv.width = W * dpr; cv.height = H * dpr;
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    const geo = buildGeo(path, W, H, { glyph, round });
    const ink = colors.ink || colors.thread || DEFAULT_INK[path];
    const ground = colors.paper || colors.cloth || null;
    const bg = paintGround(path, W, H, dpr, geo, { ground, round });

    // guide points, stroke by stroke
    const P = [];
    geo.strokes.forEach((s, si) => s.forEach((p, i) => P.push({ x: p[0], y: p[1], s: si, first: i === 0, hit: false })));
    const SN = geo.strokes.length;
    const sCount = geo.strokes.map((s) => s.length);
    const sHit = new Array(SN).fill(0);
    const sDone = new Array(SN).fill(false);
    const sAnim = new Array(SN).fill(0);
    const pathLen = geo.strokes.reduce((a, s) => a + polyLen(s), 0);
    const R = tolerance * 1.6;
    if (SN > 1) pipsEl.innerHTML = '<i></i>'.repeat(SN);

    const drawn = [];      // [x, y, newStroke]
    const seeds = [];      // row: { x, y, t }
    let seed = Math.random() * 100, len = 0, t0 = 0, down = false, finished = false, nextSeedAt = 18, clock = 0;

    function hitNear(x, y) {
      for (const q of P) {
        if (q.hit) continue;
        if (Math.abs(q.x - x) > R || Math.abs(q.y - y) > R) continue;
        if (Math.hypot(q.x - x, q.y - y) < R) {
          q.hit = true;
          sHit[q.s]++;
          if (!sDone[q.s] && sHit[q.s] >= sCount[q.s] * 0.8) {
            sDone[q.s] = true;
            buzz(14);
            const pip = pipsEl.children[q.s];
            if (pip) pip.className = 'on';
          }
        }
      }
    }
    function penDown(x, y) {
      if (finished) return;
      down = true;
      if (!drawn.length) t0 = performance.now();
      drawn.push([x, y, true]);
      hitNear(x, y);
    }
    function penMove(x, y) {
      if (!down || finished) return;
      const last = drawn[drawn.length - 1];
      const d = Math.hypot(x - last[0], y - last[1]);
      if (d < 3) return;
      len += d;
      // the hand's tremble: slow drift plus a quick shake, both scaled by `wobble` (as trace.js)
      seed += d * 0.028; // (trace.js: 0.05) a slower tremble: same size, reads as a hand, not a zigzag
      const wx = Math.sin(seed * 1.7) * 0.6 + Math.sin(seed * 5.3) * 0.4;
      const wy = Math.cos(seed * 1.3) * 0.6 + Math.sin(seed * 6.1) * 0.4;
      const px = x + wx * wobble, py = y + wy * wobble;
      drawn.push([px, py, false]);
      hitNear(px, py);
      if (path === 'row') {
        nextSeedAt -= d;
        if (nextSeedAt <= 0) { nextSeedAt += 30; seeds.push({ x: px, y: py, t: 0, r: seeds.length }); }
      }
    }
    function penUp() {
      if (!down || finished) return;
      down = false;
      const covered = P.reduce((a, q) => a + (q.hit ? 1 : 0), 0) / P.length;
      const lastS = geo.strokes[SN - 1];
      const end = lastS[lastS.length - 1];
      const nearEnd = drawn.some((p) => Math.hypot(p[0] - end[0], p[1] - end[1]) < 26);
      const allTried = sHit.every((h, i) => h >= sCount[i] * 0.4);
      if (covered >= 0.9 || (nearEnd && allTried) || len > pathLen * 2.4 + W) finish();
    }

    const local = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); penDown(...local(e)); });
    cv.addEventListener('pointermove', (e) => penMove(...local(e)));
    cv.addEventListener('pointerup', penUp);
    cv.addEventListener('pointercancel', penUp);

    // ---- drawing
    let lastT = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      clock += dt;
      for (let i = 0; i < SN; i++) if (sDone[i]) sAnim[i] = Math.min(1, sAnim[i] + dt * 2.6);
      for (const s of seeds) s.t = Math.min(1, s.t + dt * 3.2);
      draw();
      raf = requestAnimationFrame(frame);
    }
    function draw() {
      g.clearRect(0, 0, W, H);
      g.drawImage(bg, 0, 0, W, H);
      if (path === 'boat') drawBoatPaper(g, geo, sAnim, ground);
      if (path === 'word') drawGhost(g, geo);
      drawGuide();
      drawLine();
      if (path === 'row') { drawSeeds(); drawRain(g, W, H, clock); }
      if (path === 'word' && finished && resultOk) drawLanternGlow(g, geo, clock);
    }
    function drawGuide() {
      const dark = path === 'row';
      for (let i = 0; i < P.length; i += 2) {
        const q = P[i];
        g.fillStyle = dark ? (q.hit ? 'rgba(233,220,192,.18)' : 'rgba(240,228,200,.62)') : (q.hit ? 'rgba(42,33,24,.14)' : 'rgba(42,33,24,.42)');
        g.beginPath(); g.arc(q.x, q.y, q.hit ? 2 : 2.6, 0, 7); g.fill();
      }
      // the gold dot: where the next stroke starts (inside the act only)
      const next = sDone.findIndex((d) => !d);
      if (next >= 0 && !finished) {
        const s = geo.strokes[next][0];
        const pulse = 1 + Math.sin(clock * 4) * 0.08;
        g.fillStyle = 'rgba(201,162,74,.25)';
        g.beginPath(); g.arc(s[0], s[1], 14 * pulse, 0, 7); g.fill();
        g.fillStyle = '#C9A24A';
        g.strokeStyle = '#8C6A28'; g.lineWidth = 1.5;
        g.beginPath(); g.arc(s[0], s[1], 8, 0, 7); g.fill(); g.stroke();
        if (SN > 1) {
          g.fillStyle = '#FFFDF8';
          g.font = '700 10px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(myNum(next + 1), s[0], s[1] + 0.5);
        }
      }
    }
    function strokePath(off = 0) {
      // through the midpoints: a soft line, not a polyline
      g.beginPath();
      for (let i = 0; i < drawn.length; i++) {
        const p = drawn[i];
        const n = drawn[i + 1];
        if (i === 0 || p[2]) { g.moveTo(p[0] + off, p[1] - off); if (!n || n[2]) g.lineTo(p[0] + off + 0.1, p[1] - off); continue; }
        if (!n || n[2]) { g.lineTo(p[0] + off, p[1] - off); continue; }
        g.quadraticCurveTo(p[0] + off, p[1] - off, (p[0] + n[0]) / 2 + off, (p[1] + n[1]) / 2 - off);
      }
    }
    function drawLine() {
      if (!drawn.length) return;
      g.lineCap = 'round'; g.lineJoin = 'round';
      if (path === 'road') {                     // a loaded brush: dark edge, body, bristle streaks
        g.strokeStyle = 'rgba(70,18,26,.55)'; g.lineWidth = 12; strokePath(); g.stroke();
        g.strokeStyle = ink; g.lineWidth = 9.5; strokePath(); g.stroke();
        g.strokeStyle = 'rgba(176,82,88,.45)'; g.lineWidth = 1.6; strokePath(1.8); g.stroke();
        g.strokeStyle = 'rgba(60,14,20,.35)'; g.lineWidth = 1.2; strokePath(-2.2); g.stroke();
      } else if (path === 'row') {               // a furrow: dark groove, pale turned lip above it
        g.strokeStyle = 'rgba(150,118,84,.55)'; g.lineWidth = 12; strokePath(1.5); g.stroke();
        g.strokeStyle = ink; g.lineWidth = 9; strokePath(); g.stroke();
        g.strokeStyle = 'rgba(15,9,5,.5)'; g.lineWidth = 3; strokePath(-1); g.stroke();
      } else if (path === 'word') {              // gold ink that glows on the lantern paper
        g.strokeStyle = 'rgba(110,68,18,.5)'; g.lineWidth = geo.pen + 3; strokePath(); g.stroke(); // a dark edge, so gold reads on cream
        g.save();
        g.shadowColor = 'rgba(255,214,120,.95)'; g.shadowBlur = 10;
        g.strokeStyle = ink; g.lineWidth = geo.pen; strokePath(); g.stroke();
        g.restore();
        g.strokeStyle = 'rgba(255,240,190,.75)'; g.lineWidth = Math.max(1.5, geo.pen * 0.25); strokePath(0.8); g.stroke();
      } else if (path === 'boat' || path === 'fold') { // a crease pressed with the thumbnail: pencil-gold line, light edge
        g.strokeStyle = 'rgba(255,253,245,.9)'; g.lineWidth = 6; strokePath(1.2); g.stroke();
        g.strokeStyle = ink; g.lineWidth = 3.5; strokePath(); g.stroke();
      } else {                                   // stitch: thread, dashed, with a shadow
        g.setLineDash([12, 8]);
        g.strokeStyle = 'rgba(42,20,20,.25)'; g.lineWidth = 5.5; strokePath(-1.2); g.stroke();
        g.strokeStyle = ink; g.lineWidth = 4.5; strokePath(); g.stroke();
        g.setLineDash([]);
      }
    }
    function drawSeeds() {
      for (const s of seeds) {
        const k = ease(s.t);
        const lift = (1 - k) * 16;
        const sc = 0.6 + 0.4 * k;
        g.fillStyle = `rgba(20,12,6,${0.35 * k})`;
        g.beginPath(); g.ellipse(s.x + 1, s.y + 1.5, 3.2 * sc, 2 * sc, 0, 0, 7); g.fill();
        g.fillStyle = '#EADBB0'; g.strokeStyle = '#6B4E2E'; g.lineWidth = 1;
        g.beginPath(); g.ellipse(s.x, s.y - lift, 3.4 * sc, 2.2 * sc, (s.r % 3) * 0.6, 0, 7); g.fill(); g.stroke();
      }
    }

    let resultOk = false;
    async function finish() {
      if (finished) return;
      finished = true;
      down = false;
      // score: how much of the guide was followed, and how far the line strayed (trace.js rules)
      let covered = 0, errSum = 0;
      for (const q of P) {
        let best = Infinity;
        for (const p of drawn) { const d = Math.hypot(p[0] - q.x, p[1] - q.y); if (d < best) best = d; }
        if (best < tolerance * 1.6) covered++;
        errSum += Math.min(best, 60);
      }
      const coverage = covered / P.length;
      const error = errSum / P.length;
      const ok = coverage >= 0.85 && error <= tolerance;
      resultOk = ok;
      const score = clamp(coverage * (1 - Math.max(0, error - 4) / (tolerance * 2.5)));
      if (ok) for (let i = 0; i < SN; i++) sDone[i] = true;
      if (!ok) A.shake(cv);
      await wait(ok ? 650 : 250);
      // the seal sits in the corner, so the finished work stays in view
      const cr = A.card.getBoundingClientRect(), vr = cv.getBoundingClientRect();
      await A.seal(ok, [vr.right - cr.left - 36, vr.top - cr.top + 36 + A.card.scrollTop]);
      A.done({ ok, score, error, coverage, ms: performance.now() - t0 });
    }

    // tests and accessibility: "trace it for me" (the guide, still carrying the wobble; care < 1 strays)
    A.wrap.autoTrace = async (care = 1) => {
      if (finished || drawn.length) return;
      seed = 1;
      const per = Math.max(2, Math.ceil(P.length / 70));
      for (let s = 0; s < SN && !A.closed(); s++) {
        const pts = geo.strokes[s];
        penDown(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) {
          const stray = (1 - care) * 34 * (0.7 + 0.3 * Math.sin(i * 0.15)); // a careless hand drifts to one side
          penMove(pts[i][0] + stray * 0.6, pts[i][1] + stray);
          if (i % per === 0) await wait(16);
        }
        if (s < SN - 1) { down = false; await wait(180); }
      }
      down = true;
      penUp();
      if (!finished) finish();
    };
    window.__act = A.wrap;
    raf = requestAnimationFrame(frame);
  });
}

const DEFAULT_INK = { stitch: '#6E1F2A', fold: '#A47A2C', boat: '#A47A2C', road: '#7A2430', row: '#2B1B10', word: '#C9A24A' };

// ------------------------------------------------------------------------------------------------
// Geometry
// ------------------------------------------------------------------------------------------------
function polyLen(s) { let L = 0; for (let i = 1; i < s.length; i++) L += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); return L; }
function resample(pts, step = STEP) {
  const out = [pts[0].slice()];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const d = Math.hypot(bx - ax, by - ay);
    let t = step - carry;
    while (t <= d) { out.push([ax + (bx - ax) * (t / d), ay + (by - ay) * (t / d)]); t += step; }
    carry = d - (t - step);
  }
  const last = pts[pts.length - 1];
  const o = out[out.length - 1];
  if (Math.hypot(last[0] - o[0], last[1] - o[1]) > step * 0.4) out.push(last.slice());
  return out;
}
function catmull(pts, seg = 12) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < seg; k++) {
      const t = k / seg, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}
const line = (a, b) => resample([a, b]);

function roadPts(W, H) {
  const c = [[0.09, 0.95], [0.27, 0.86], [0.42, 0.76], [0.37, 0.66], [0.29, 0.58], [0.4, 0.515], [0.56, 0.49]].map(([u, v]) => [u * W, v * H]);
  return resample([...catmull(c), [0.93 * W, 0.49 * H]]);
}
function railPts(W, H) {
  const pts = [];
  for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([W * (0.56 + 0.37 * u), H * (0.43 - 0.13 * Math.sin(u * Math.PI))]); }
  return resample(pts);
}

function buildGeo(path, W, H, { glyph, round }) {
  if (path === 'fold') {
    const c = [W / 2, H / 2];
    const s = Math.min(W, H) * 0.84, x0 = (W - s) / 2, y0 = (H - s) / 2;
    const corners = [[x0 + 10, y0 + 10], [x0 + s - 10, y0 + 10], [x0 + s - 10, y0 + s - 10], [x0 + 10, y0 + s - 10]];
    return { strokes: corners.map((k) => line(k, c)), sheet: { x: x0, y: y0, w: s, h: s } };
  }
  if (path === 'boat') {
    const sh = { x: W * 0.1, y: H * 0.12, w: W * 0.8, h: H * 0.76 };
    const S = (u, v) => [sh.x + u * sh.w, sh.y + v * sh.h];
    return {
      sheet: sh, S,
      strokes: [line(S(0.04, 0.5), S(0.96, 0.5)), line(S(0.5, 0.04), S(0.04, 0.5)), line(S(0.5, 0.04), S(0.96, 0.5)), line(S(0.04, 0.78), S(0.96, 0.78))],
    };
  }
  if (path === 'road') return { strokes: [round >= 2 ? railPts(W, H) : roadPts(W, H)] };
  if (path === 'row') {
    const bed = { x: W * 0.07, y: H * 0.1, w: W * 0.86, h: H * 0.8 };
    const strokes = [0.28, 0.5, 0.72].map((v, r) => {
      const pts = [];
      for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push([W * (0.17 + 0.68 * u), H * v + Math.sin(u * 5 + r) * 2.5]); }
      return resample(pts);
    });
    return { strokes, bed };
  }
  if (path === 'word') {
    const L = { cx: W / 2, cy: H * 0.53, rx: W * 0.4, ry: H * 0.37 };
    const box = { w: L.rx * 1.5, h: L.ry * 1.36 };
    box.x = L.cx - box.w / 2; box.y = L.cy - box.h / 2;
    const gl = glyphStrokes(glyph || 'စာ', box);
    return { strokes: gl.strokes, lantern: L, box, ghost: gl, pen: gl.pen };
  }
  // stitch: a running stitch along the spine of the book: a gentle S across the cloth (trace.js)
  const pts = [];
  for (let i = 0; i <= 80; i++) { const u = i / 80; pts.push([W * (0.08 + 0.84 * u), H * (0.5 + 0.22 * Math.sin(u * Math.PI * 2))]); }
  return { strokes: [pts] };
}

// ---- glyph strokes: the hand table, or the font's own centre line
const GCACHE = new Map();
function glyphStrokes(glyph, box) {
  const key = `${glyph}|${Math.round(box.w)}x${Math.round(box.h)}`;
  if (GCACHE.has(key)) return GCACHE.get(key);
  const w = Math.round(box.w), h = Math.round(box.h);
  const FONT = (px) => `400 ${px}px "Noto Sans Myanmar", "Myanmar Text", sans-serif`;
  // measure the ink itself (font metrics for Myanmar are tall and loose): draw big, find the inked box
  const m0 = document.createElement('canvas');
  const F0 = 200;
  m0.width = 900; m0.height = 600;
  const mx = m0.getContext('2d', { willReadFrequently: true });
  mx.font = FONT(F0); mx.textAlign = 'center'; mx.textBaseline = 'alphabetic';
  mx.fillText(glyph, 450, 380);
  const md = mx.getImageData(0, 0, 900, 600).data;
  let ix0 = 900, iy0 = 600, ix1 = -1, iy1 = -1;
  for (let yy = 0; yy < 600; yy++) for (let xx = 0; xx < 900; xx++) if (md[(yy * 900 + xx) * 4 + 3] > 60) { if (xx < ix0) ix0 = xx; if (xx > ix1) ix1 = xx; if (yy < iy0) iy0 = yy; if (yy > iy1) iy1 = yy; }
  if (ix1 < 0) { ix0 = 350; ix1 = 550; iy0 = 250; iy1 = 400; }
  const k = Math.min((w * 0.9) / (ix1 - ix0 + 1), (h * 0.84) / (iy1 - iy0 + 1));
  const fs = F0 * k;
  const gx = w / 2 - ((ix0 + ix1) / 2 - 450) * k, gy = h / 2 - ((iy0 + iy1) / 2 - 380) * k;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.font = FONT(fs); x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.fillStyle = '#000';
  x.fillText(glyph, gx, gy);
  const out = { fs, gx: box.x + gx, gy: box.y + gy, text: glyph, strokes: [], pen: Math.max(5, fs * 0.075) };
  const table = GLYPHS[glyph];
  if (table?.strokes?.length) {
    // fitted like the font (90 % of the width or 84 % of the height), centred in the box
    const iw = Math.min(w * 0.9, (h * 0.84) / table.aspect), ih = iw * table.aspect;
    const ox = box.x + (w - iw) / 2, oy = box.y + (h - ih) / 2;
    out.strokes = table.strokes.map((pl) => resample(pl.map(([u, v]) => [ox + u * iw, oy + v * iw])));
    out.pen = clamp(iw * 0.058, 7, 14);
    out.hand = true;
    GCACHE.set(key, out);
    return out;
  }
  if (Array.isArray(table) && table.length) {
    out.strokes = table.map((pl) => resample(pl.map(([u, v]) => [box.x + u * box.w, box.y + v * box.h])));
    out.hand = true;
    GCACHE.set(key, out);
    return out;
  }
  const data = x.getImageData(0, 0, w, h).data;
  const b = new Uint8Array(w * h);
  let thick = 0;
  for (let i = 0; i < w * h; i++) if (data[i * 4 + 3] > 110) { b[i] = 1; thick++; }
  for (let yy = 0; yy < h; yy++) { b[yy * w] = 0; b[yy * w + w - 1] = 0; }
  for (let xx = 0; xx < w; xx++) { b[xx] = 0; b[(h - 1) * w + xx] = 0; }
  thin(b, w, h);
  let skel = 0;
  for (let i = 0; i < w * h; i++) skel += b[i];
  if (skel) out.pen = clamp((thick / skel) * 0.75, 4, 12);
  const chains = walkChains(b, w, h)
    .map((ch) => smooth(ch.map((i) => [box.x + (i % w), box.y + Math.floor(i / w)])))
    .filter((ch) => polyLen(ch) > Math.max(12, out.pen * 2.2)); // drop the thinning's little spurs
  // writing order: left to right by where each stroke sits; each stroke starts at its upper-left end
  chains.sort((p, q) => mid(p)[0] - mid(q)[0]);
  out.strokes = chains.map((ch) => {
    const a = ch[0], z = ch[ch.length - 1];
    if (z[0] + z[1] * 0.6 < a[0] + a[1] * 0.6) ch.reverse();
    return resample(ch);
  });
  if (!out.strokes.length) out.strokes = [line([box.x + w * 0.2, box.y + h / 2], [box.x + w * 0.8, box.y + h / 2])];
  GCACHE.set(key, out);
  return out;
}
function mid(ch) { let sx = 0, sy = 0; for (const p of ch) { sx += p[0]; sy += p[1]; } return [sx / ch.length, sy / ch.length]; }
function smooth(ch, k = 3) {
  if (ch.length < k * 2 + 2) return ch;
  return ch.map((p, i) => {
    if (i === 0 || i === ch.length - 1) return p;
    let sx = 0, sy = 0, n = 0;
    for (let j = Math.max(0, i - k); j <= Math.min(ch.length - 1, i + k); j++) { sx += ch[j][0]; sy += ch[j][1]; n++; }
    return [sx / n, sy / n];
  });
}
// Zhang–Suen thinning (in place)
function thin(b, w, h) {
  const del = [];
  for (let changed = true, guard = 0; changed && guard < 60; guard++) {
    changed = false;
    for (let pass = 0; pass < 2; pass++) {
      del.length = 0;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x;
          if (!b[i]) continue;
          const p2 = b[i - w], p3 = b[i - w + 1], p4 = b[i + 1], p5 = b[i + w + 1], p6 = b[i + w], p7 = b[i + w - 1], p8 = b[i - 1], p9 = b[i - w - 1];
          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (B < 2 || B > 6) continue;
          const T = (!p2 && p3) + (!p3 && p4) + (!p4 && p5) + (!p5 && p6) + (!p6 && p7) + (!p7 && p8) + (!p8 && p9) + (!p9 && p2);
          if (T !== 1) continue;
          if (pass === 0 ? (p2 * p4 * p6 || p4 * p6 * p8) : (p2 * p4 * p8 || p2 * p6 * p8)) continue;
          del.push(i);
        }
      }
      for (const i of del) b[i] = 0;
      if (del.length) changed = true;
    }
  }
}
function walkChains(b, w, h) {
  const N = [1, w, -1, -w, w + 1, w - 1, -w - 1, -w + 1];
  const count = (i) => { let n = 0; for (const d of N) n += b[i + d] ? 1 : 0; return n; };
  const seen = new Uint8Array(w * h);
  const ends = [], rest = [];
  for (let i = 0; i < w * h; i++) if (b[i]) (count(i) === 1 ? ends : rest).push(i);
  const walk = (s) => {
    const ch = [s];
    seen[s] = 1;
    for (let cur = s; ;) {
      let nx = -1;
      for (const d of N) { const j = cur + d; if (b[j] && !seen[j]) { nx = j; break; } }
      if (nx < 0) {
        // join a branch to the stroke it grew from
        for (const d of N) { const j = cur + d; if (b[j] && seen[j] && j !== ch[ch.length - 2]) { ch.push(j); break; } }
        break;
      }
      seen[nx] = 1; ch.push(nx); cur = nx;
    }
    return ch;
  };
  const chains = [];
  ends.sort((p, q) => (p % w) - (q % w));
  for (const e of ends) if (!seen[e]) chains.push(walk(e));
  for (const r of rest) if (!seen[r]) { const ch = walk(r); ch.push(ch[0]); chains.push(ch); }
  return chains.filter((c) => c.length > 6);
}

// ------------------------------------------------------------------------------------------------
// Grounds (painted once into an offscreen canvas)
// ------------------------------------------------------------------------------------------------
function paintGround(path, W, H, dpr, geo, { ground, round }) {
  const c = document.createElement('canvas');
  c.width = W * dpr; c.height = H * dpr;
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const rnd = seededRandom(7);
  g.save();
  g.beginPath(); g.roundRect(0, 0, W, H, 14); g.clip();
  if (path === 'boat' || path === 'fold') woodDesk(g, W, H, rnd);
  if (path === 'boat') {
    pencil(g, W * 0.06, H * 0.95, W * 0.36, H * 0.9);
    eraser(g, W * 0.86, H * 0.93);
  }
  if (path === 'fold') {
    const s = geo.sheet;
    paperRect(g, s.x, s.y, s.w, s.h, ground || '#F6E7B4', rnd, 0);
    g.strokeStyle = 'rgba(164,122,44,.25)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x + s.w, s.y + s.h); g.moveTo(s.x + s.w, s.y); g.lineTo(s.x, s.y + s.h); g.stroke();
  }
  if (path === 'stitch') clothSpine(g, W, H, ground || '#E9DCC0');
  if (path === 'road') backdrop(g, W, H, rnd, ground, round);
  if (path === 'row') gardenBed(g, W, H, rnd, geo.bed);
  if (path === 'word') lanternFace(g, W, H, geo.lantern, ground);
  g.restore();
  g.strokeStyle = 'rgba(59,42,26,.35)'; g.lineWidth = 1.5;
  g.beginPath(); g.roundRect(0.75, 0.75, W - 1.5, H - 1.5, 14); g.stroke();
  return c;
}

function woodDesk(g, W, H, rnd) {
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#B88352'); grd.addColorStop(1, '#9A6A3E');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  const plank = H / 3;
  for (let p = 0; p < 3; p++) {
    g.fillStyle = p % 2 ? 'rgba(255,230,190,.05)' : 'rgba(60,35,15,.05)';
    g.fillRect(0, p * plank, W, plank);
    g.strokeStyle = 'rgba(60,35,15,.45)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(0, p * plank + 0.5); g.lineTo(W, p * plank + 0.5); g.stroke();
    g.strokeStyle = 'rgba(70,40,18,.16)'; g.lineWidth = 1;
    for (let k = 0; k < 7; k++) {
      const y = p * plank + 6 + rnd() * (plank - 12), a = rnd() * 3;
      g.beginPath();
      for (let x = 0; x <= W; x += 8) g.lineTo(x, y + Math.sin(x * 0.02 + a) * 2.5);
      g.stroke();
    }
  }
}
function pencil(g, x0, y0, x1, y1) {
  g.save();
  g.translate(x0, y0); g.rotate(Math.atan2(y1 - y0, x1 - x0));
  const L = Math.hypot(x1 - x0, y1 - y0);
  g.fillStyle = 'rgba(40,24,10,.25)'; g.fillRect(3, 3, L, 9);
  g.fillStyle = '#E8B93A'; g.fillRect(0, 0, L * 0.86, 9);
  g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(0, 6, L * 0.86, 3);
  g.fillStyle = '#B07D3A'; g.fillRect(-6, 0, 7, 9);
  g.fillStyle = '#E9C9A0';
  g.beginPath(); g.moveTo(L * 0.86, 0); g.lineTo(L, 4.5); g.lineTo(L * 0.86, 9); g.fill();
  g.fillStyle = '#3A2E25';
  g.beginPath(); g.moveTo(L * 0.96, 3.2); g.lineTo(L, 4.5); g.lineTo(L * 0.96, 5.8); g.fill();
  g.restore();
}
function eraser(g, x, y) {
  g.save(); g.translate(x, y); g.rotate(-0.25);
  g.fillStyle = 'rgba(40,24,10,.25)'; g.fillRect(-12, -5, 26, 12);
  g.fillStyle = '#E79A8E'; g.fillRect(-14, -8, 26, 12);
  g.fillStyle = '#F4D9C9'; g.fillRect(-14, -8, 26, 3);
  g.restore();
}
function paperRect(g, x, y, w, h, col, rnd, r = 2) {
  g.save();
  g.shadowColor = 'rgba(40,24,10,.35)'; g.shadowBlur = 10; g.shadowOffsetY = 3;
  g.fillStyle = col;
  g.beginPath(); g.roundRect(x, y, w, h, r); g.fill();
  g.restore();
  g.fillStyle = 'rgba(140,106,40,.05)';
  for (let i = 0; i < 60; i++) { g.fillRect(x + rnd() * w, y + rnd() * h, 1 + rnd() * 2, 1); }
}

// Day 3: the boat's paper, folded by the finished creases (S2/S3 corners, S4 brim)
function drawBoatPaper(g, geo, an, ground) {
  const { S } = geo;
  const done = an.map((a) => a > 0);
  const pts = [];
  if (done[1]) pts.push(S(0, 0.5), S(0.5, 0)); else pts.push(S(0, 0), S(0.5, 0));
  if (done[2]) pts.push(S(1, 0.5)); else pts.push(S(1, 0));
  if (done[3]) pts.push(S(1, 0.78), S(0, 0.78)); else pts.push(S(1, 1), S(0, 1));
  const poly = (ps) => { g.beginPath(); ps.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
  g.save();
  g.shadowColor = 'rgba(40,24,10,.35)'; g.shadowBlur = 10; g.shadowOffsetY = 3;
  g.fillStyle = ground || '#FBF5E6';
  poly(pts); g.fill();
  g.restore();
  // faint ruled lines: the sheet is a page from Su Nwe's exercise book
  g.save(); poly(pts); g.clip();
  g.strokeStyle = 'rgba(110,140,170,.22)'; g.lineWidth = 1;
  for (let v = 0.1; v < 1; v += 0.09) { const a = S(0, v), b = S(1, v); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  g.strokeStyle = 'rgba(180,70,70,.25)';
  { const a = S(0.08, 0), b = S(0.08, 1); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  g.restore();
  // the middle crease
  if (done[0]) {
    const a = S(0, 0.5), b = S(1, 0.5);
    g.strokeStyle = `rgba(120,90,50,${0.35 * an[0]})`; g.lineWidth = 1;
    g.beginPath(); g.moveTo(a[0], a[1] + 1); g.lineTo(b[0], b[1] + 1); g.stroke();
  }
  const flap = (ps, k) => {
    g.save();
    g.shadowColor = 'rgba(40,24,10,.28)'; g.shadowBlur = 6 * k; g.shadowOffsetY = 2 * k;
    g.fillStyle = '#EFE3C4';
    poly(ps); g.fill();
    g.restore();
    g.strokeStyle = 'rgba(120,90,50,.45)'; g.lineWidth = 1;
    poly(ps); g.stroke();
  };
  if (done[1]) { const k = ease(an[1]); flap([S(0.5, 0), S(0, 0.5), [lerp(S(0, 0)[0], S(0.5, 0.5)[0], k), lerp(S(0, 0)[1], S(0.5, 0.5)[1], k)]], k); }
  if (done[2]) { const k = ease(an[2]); flap([S(0.5, 0), S(1, 0.5), [lerp(S(1, 0)[0], S(0.5, 0.5)[0], k), lerp(S(1, 0)[1], S(0.5, 0.5)[1], k)]], k); }
  if (done[3]) { const k = ease(an[3]); const v = lerp(1, 0.56, k); flap([S(0, 0.78), S(1, 0.78), S(1, v), S(0, v)], k); }
}

function clothSpine(g, W, H, col) {
  g.fillStyle = '#7A5634'; g.fillRect(0, 0, W, H);
  g.fillStyle = col;
  g.beginPath(); g.roundRect(6, 6, W - 12, H - 12, 12); g.fill();
  g.strokeStyle = 'rgba(90,67,32,.16)'; g.lineWidth = 1;
  for (let y = 10; y < H - 8; y += 4) { g.beginPath(); g.moveTo(8, y); g.lineTo(W - 8, y); g.stroke(); }
  for (let x = 10; x < W - 8; x += 4) { g.beginPath(); g.moveTo(x, 8); g.lineTo(x, H - 8); g.stroke(); }
  const grd = g.createLinearGradient(0, H * 0.3, 0, H * 0.7);
  grd.addColorStop(0, 'rgba(90,67,32,0)'); grd.addColorStop(0.5, 'rgba(90,67,32,.12)'); grd.addColorStop(1, 'rgba(90,67,32,0)');
  g.fillStyle = grd; g.fillRect(6, H * 0.3, W - 12, H * 0.4);
}

// Day 7: the stage backdrop on its frame: sky, hills, river and the bridge in pencil; round 2 has the road painted
function backdrop(g, W, H, rnd, ground, round) {
  g.fillStyle = '#6B4A2C'; g.fillRect(0, 0, W, H);
  const x0 = 8, y0 = 8, w = W - 16, h = H - 16;
  g.fillStyle = ground || '#F3E8CF'; g.fillRect(x0, y0, w, h);
  g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
  // canvas weave
  g.strokeStyle = 'rgba(120,96,60,.07)'; g.lineWidth = 1;
  for (let y = y0; y < y0 + h; y += 3) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + w, y); g.stroke(); }
  // sky wash, already painted
  const sky = g.createLinearGradient(0, y0, 0, H * 0.4);
  sky.addColorStop(0, 'rgba(160,190,200,.55)'); sky.addColorStop(1, 'rgba(240,214,160,.35)');
  g.fillStyle = sky; g.fillRect(x0, y0, w, H * 0.4 - y0);
  g.fillStyle = 'rgba(255,240,200,.75)';
  g.beginPath(); g.arc(W * 0.2, H * 0.17, W * 0.05, 0, 7); g.fill();
  // hills
  const hill = (cx, cy, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, Math.PI, 0); g.fill(); };
  hill(W * 0.25, H * 0.42, W * 0.32, H * 0.14, 'rgba(126,146,104,.55)');
  hill(W * 0.68, H * 0.42, W * 0.36, H * 0.1, 'rgba(146,160,116,.5)');
  hill(W * 0.95, H * 0.43, W * 0.2, H * 0.12, 'rgba(118,136,98,.5)');
  // fields: a pale ochre wash with brush streaks
  g.fillStyle = 'rgba(214,190,120,.35)'; g.fillRect(x0, H * 0.42, w, h);
  g.strokeStyle = 'rgba(150,130,70,.18)'; g.lineWidth = 2;
  for (let i = 0; i < 18; i++) { const y = H * 0.46 + rnd() * H * 0.5, x = rnd() * W; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + rnd() * 30, y + 2); g.stroke(); }
  // trees on the hills
  for (const [u, v, s] of [[0.1, 0.36, 1], [0.16, 0.34, 0.8], [0.73, 0.37, 0.9], [0.8, 0.36, 1.1]]) {
    g.fillStyle = 'rgba(92,70,44,.6)'; g.fillRect(W * u - 1, H * v, 2, 8 * s);
    g.fillStyle = 'rgba(90,120,80,.65)'; g.beginPath(); g.arc(W * u, H * v, 6 * s, 0, 7); g.fill();
  }
  // the river under the bridge
  g.fillStyle = 'rgba(122,156,168,.6)';
  g.beginPath();
  g.moveTo(W * 0.62, H * 0.42); g.quadraticCurveTo(W * 0.66, H * 0.6, W * 0.58, H * 1.02);
  g.lineTo(W * 1.02, H * 1.02); g.lineTo(W * 1.02, H * 0.42); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5;
  for (let i = 0; i < 7; i++) { const x = W * (0.7 + rnd() * 0.25), y = H * (0.55 + rnd() * 0.4); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 12, y); g.stroke(); }
  // the bridge in pencil: deck, piers, the rail
  g.strokeStyle = 'rgba(70,58,46,.55)'; g.lineWidth = 1.2;
  const deckY = H * 0.49;
  g.beginPath(); g.moveTo(W * 0.55, deckY - 4); g.lineTo(W * 0.95, deckY - 4); g.moveTo(W * 0.55, deckY + 6); g.lineTo(W * 0.95, deckY + 6); g.stroke();
  for (const u of [0.66, 0.8]) { g.strokeRect(W * u - 4, deckY + 6, 8, H * 0.14); }
  for (const u of [0.6, 0.7, 0.8, 0.9]) { const x = W * u; g.beginPath(); g.moveTo(x, deckY - 4); g.lineTo(x, H * (0.43 - 0.13 * Math.sin(((u - 0.56) / 0.37) * Math.PI)) + 2); g.stroke(); }
  g.setLineDash([3, 4]);
  g.beginPath();
  for (let i = 0; i <= 30; i++) { const u = i / 30; const x = W * (0.56 + 0.37 * u), y = H * (0.43 - 0.13 * Math.sin(u * Math.PI)); i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.stroke();
  g.setLineDash([]);
  // round 1's road, painted (round 2)
  if (round >= 2) {
    const r = roadPts(W, H);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const pl = () => { g.beginPath(); r.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); };
    g.strokeStyle = 'rgba(70,18,26,.5)'; g.lineWidth = 12; pl(); g.stroke();
    g.strokeStyle = '#7A2430'; g.lineWidth = 9.5; pl(); g.stroke();
  } else {
    // the road in pencil
    const r = roadPts(W, H);
    g.strokeStyle = 'rgba(70,58,46,.3)'; g.lineWidth = 1;
    for (const off of [-7, 7]) { g.beginPath(); r.forEach((p, i) => (i ? g.lineTo(p[0], p[1] + off) : g.moveTo(p[0], p[1] + off))); g.stroke(); }
  }
  g.restore();
  // paint pot and brush on the frame's corner
  const px = W * 0.88, py = H * 0.86;
  g.fillStyle = 'rgba(30,20,10,.3)'; g.beginPath(); g.ellipse(px + 3, py + 4, 20, 9, 0, 0, 7); g.fill();
  g.fillStyle = '#C9B48A'; g.beginPath(); g.ellipse(px, py, 19, 9, 0, 0, 7); g.fill();
  g.fillStyle = '#7A2430'; g.beginPath(); g.ellipse(px, py - 1, 15, 6.5, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,200,200,.35)'; g.beginPath(); g.ellipse(px - 5, py - 3, 5, 2, 0, 0, 7); g.fill();
  g.strokeStyle = '#8A5A34'; g.lineWidth = 3.5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(px + 2, py - 1); g.lineTo(px + 20, py - 26); g.stroke();
  g.strokeStyle = '#C9A24A'; g.lineWidth = 4.5; g.beginPath(); g.moveTo(px + 4, py - 4); g.lineTo(px + 6.5, py - 7.5); g.stroke();
}

// Day 12: the far bed in the rain, seen from above
function gardenBed(g, W, H, rnd, bed) {
  g.fillStyle = '#5F6E4C'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) {
    g.strokeStyle = `rgba(${rnd() > 0.5 ? '140,160,110' : '60,76,48'},.5)`; g.lineWidth = 1.2;
    const x = rnd() * W, y = rnd() * H;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 4, y - 4 - rnd() * 4); g.stroke();
  }
  const { x, y, w, h } = bed;
  // the board frame
  g.fillStyle = 'rgba(20,14,8,.35)'; g.fillRect(x + 3, y + 4, w, h);
  g.fillStyle = '#7E5532'; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(40,24,10,.5)'; g.lineWidth = 1;
  for (const [ax, ay, bx, by] of [[x, y + 5, x + w, y + 5], [x, y + h - 5, x + w, y + h - 5], [x + 5, y, x + 5, y + h], [x + w - 5, y, x + w - 5, y + h]]) { g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); }
  // wet soil
  const sx = x + 10, sy = y + 10, sw = w - 20, sh = h - 20;
  const grd = g.createRadialGradient(sx + sw / 2, sy + sh / 2, 10, sx + sw / 2, sy + sh / 2, sw * 0.7);
  grd.addColorStop(0, '#5C3F29'); grd.addColorStop(1, '#43301F');
  g.fillStyle = grd; g.fillRect(sx, sy, sw, sh);
  for (let i = 0; i < 220; i++) {
    g.fillStyle = rnd() > 0.5 ? 'rgba(120,88,60,.45)' : 'rgba(30,18,10,.45)';
    g.beginPath(); g.ellipse(sx + rnd() * sw, sy + rnd() * sh, 1 + rnd() * 2.5, 0.8 + rnd() * 1.5, rnd() * 3, 0, 7); g.fill();
  }
  // the old rows, washed flat by the rain
  g.strokeStyle = 'rgba(30,18,10,.18)'; g.lineWidth = 6;
  for (const v of [0.39, 0.61]) { g.beginPath(); g.moveTo(sx + 8, H * v + 3); g.bezierCurveTo(sx + sw * 0.3, H * v - 6, sx + sw * 0.6, H * v + 8, sx + sw - 8, H * v); g.stroke(); }
  // puddles
  for (const [u, v, r] of [[0.8, 0.86, 16], [0.24, 0.16, 11]]) {
    g.fillStyle = 'rgba(120,140,150,.55)'; g.beginPath(); g.ellipse(W * u, H * v, r, r * 0.45, 0.1, 0, 7); g.fill();
    g.strokeStyle = 'rgba(230,240,240,.45)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(W * u - r * 0.2, H * v - 1, r * 0.4, r * 0.12, 0.1, 0, 7); g.stroke();
  }
  // the date stick at the row ends (no name: a date)
  const kx = x + 18, ky = y + h * 0.18;
  g.fillStyle = 'rgba(20,14,8,.35)'; g.fillRect(kx - 3, ky + 3, 14, 20);
  g.fillStyle = '#B88352'; g.fillRect(kx - 5, ky, 14, 20);
  g.fillStyle = '#F6F0E2'; g.fillRect(kx - 3, ky + 3, 10, 8);
  g.strokeStyle = 'rgba(42,33,24,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(kx - 1, ky + 7); g.lineTo(kx + 5, ky + 7); g.stroke();
  // the seed tin on the grass
  const tx = W * 0.94, ty = H * 0.95;
  g.fillStyle = 'rgba(20,14,8,.35)'; g.beginPath(); g.arc(tx + 2, ty + 3, 14, 0, 7); g.fill();
  g.fillStyle = '#9AA3A6'; g.beginPath(); g.arc(tx, ty, 14, 0, 7); g.fill();
  g.fillStyle = '#C9A24A'; g.beginPath(); g.arc(tx, ty, 10, 0, 7); g.fill();
  g.fillStyle = '#EADBB0';
  for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(tx - 5 + rnd() * 10, ty - 5 + rnd() * 10, 2.2, 1.4, rnd() * 3, 0, 7); g.fill(); }
}
function drawRain(g, W, H, t) {
  g.strokeStyle = 'rgba(225,235,240,.32)'; g.lineWidth = 1;
  g.beginPath();
  for (let i = 0; i < 34; i++) {
    const x = ((i * 97.3) % W + t * 60) % (W + 40) - 20;
    const y = ((i * 53.7) % H + t * 380 + i * 17) % (H + 30) - 15;
    g.moveTo(x, y); g.lineTo(x - 4, y + 13);
  }
  g.stroke();
  // ripples where drops land
  g.strokeStyle = 'rgba(225,235,240,.25)';
  for (let i = 0; i < 4; i++) {
    const k = (((t * 1.3 + i * 0.25) % 1) + 1) % 1; // (t can start below zero: keep the radius positive)
    const x = W * (0.2 + ((i * 0.37) % 0.7)), y = H * (0.2 + ((i * 0.53) % 0.65));
    g.beginPath(); g.ellipse(x, y, 2 + k * 9, (2 + k * 9) * 0.45, 0, 0, 7); g.stroke();
  }
}

// Day 15: a round paper lantern, folded this morning, glowing a little
function lanternFace(g, W, H, L, ground) {
  const bgd = g.createLinearGradient(0, 0, 0, H);
  bgd.addColorStop(0, '#4A3426'); bgd.addColorStop(1, '#2C1F18');
  g.fillStyle = bgd; g.fillRect(0, 0, W, H);
  // the Writing Room window behind: dusk
  g.fillStyle = 'rgba(214,150,96,.18)'; g.fillRect(W * 0.66, H * 0.06, W * 0.26, H * 0.3);
  g.strokeStyle = 'rgba(30,20,14,.6)'; g.lineWidth = 3;
  g.strokeRect(W * 0.66, H * 0.06, W * 0.26, H * 0.3);
  g.beginPath(); g.moveTo(W * 0.79, H * 0.06); g.lineTo(W * 0.79, H * 0.36); g.stroke();
  // halo
  const halo = g.createRadialGradient(L.cx, L.cy, L.rx * 0.6, L.cx, L.cy, L.rx * 1.35);
  halo.addColorStop(0, 'rgba(255,214,140,.32)'); halo.addColorStop(1, 'rgba(255,214,140,0)');
  g.fillStyle = halo; g.fillRect(0, 0, W, H);
  // the string
  g.strokeStyle = '#C9A24A'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(L.cx, 0); g.lineTo(L.cx, L.cy - L.ry - 8); g.stroke();
  // body
  const body = g.createRadialGradient(L.cx - L.rx * 0.15, L.cy - L.ry * 0.1, L.rx * 0.1, L.cx, L.cy, L.rx * 1.05);
  body.addColorStop(0, ground || '#FFF6DC'); body.addColorStop(0.7, '#F6DFA6'); body.addColorStop(1, '#D9AE62');
  g.fillStyle = body;
  g.beginPath(); g.ellipse(L.cx, L.cy, L.rx, L.ry, 0, 0, 7); g.fill();
  // ribs (the folds of the paper)
  g.save();
  g.beginPath(); g.ellipse(L.cx, L.cy, L.rx, L.ry, 0, 0, 7); g.clip();
  g.strokeStyle = 'rgba(150,110,50,.28)'; g.lineWidth = 1.2;
  for (let k = -4; k <= 4; k++) {
    const y = L.cy + (k / 4.6) * L.ry;
    g.beginPath(); g.ellipse(L.cx, y, L.rx, L.ry * 0.07, 0, 0, Math.PI); g.stroke();
  }
  g.strokeStyle = 'rgba(150,110,50,.12)';
  for (const f of [-0.6, -0.3, 0.3, 0.6]) { g.beginPath(); g.ellipse(L.cx, L.cy, L.rx * Math.abs(f), L.ry, 0, f < 0 ? Math.PI / 2 : -Math.PI / 2, f < 0 ? Math.PI * 1.5 : Math.PI / 2); g.stroke(); }
  g.restore();
  g.strokeStyle = 'rgba(140,100,40,.6)'; g.lineWidth = 1.5;
  g.beginPath(); g.ellipse(L.cx, L.cy, L.rx, L.ry, 0, 0, 7); g.stroke();
  // caps: maroon with a gold rim
  const cap = (y, up) => {
    const cw = L.rx * 0.62, ch = 12;
    g.fillStyle = '#6E1F2A';
    g.beginPath(); g.roundRect(L.cx - cw / 2, y - (up ? ch : 0), cw, ch, 4); g.fill();
    g.fillStyle = '#C9A24A'; g.fillRect(L.cx - cw / 2, up ? y - 3 : y, cw, 3);
  };
  cap(L.cy - L.ry + 6, true);
  cap(L.cy + L.ry - 6, false);
  // a tassel
  g.strokeStyle = '#A0452F'; g.lineWidth = 2;
  for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(L.cx, L.cy + L.ry + 6); g.lineTo(L.cx + i * 2, L.cy + L.ry + 22); g.stroke(); }
}
// the word under the dots: a soft pencil groove on the lantern paper, about twice as strong as a watermark,
// so the letter's shape reads before and after the gold goes on
function drawGhost(g, geo) {
  const gh = geo.ghost;
  g.save();
  if (gh.hand) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const path = () => { g.beginPath(); for (const s of geo.strokes) s.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); };
    g.strokeStyle = 'rgba(150,108,46,.30)'; g.lineWidth = gh.pen * 1.9; path(); g.stroke();
    g.strokeStyle = 'rgba(120,82,30,.22)'; g.lineWidth = gh.pen * 0.9; path(); g.stroke();
  } else {
    g.font = `400 ${gh.fs}px "Noto Sans Myanmar", "Myanmar Text", sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillStyle = 'rgba(150,108,46,.4)';
    g.fillText(gh.text, gh.gx, gh.gy);
  }
  g.restore();
}
function drawLanternGlow(g, geo, t) {
  const L = geo.lantern;
  const k = 0.25 + Math.sin(t * 3) * 0.06;
  const halo = g.createRadialGradient(L.cx, L.cy, 10, L.cx, L.cy, L.rx);
  halo.addColorStop(0, `rgba(255,226,150,${k})`); halo.addColorStop(1, 'rgba(255,226,150,0)');
  g.fillStyle = halo;
  g.beginPath(); g.ellipse(L.cx, L.cy, L.rx, L.ry, 0, 0, 7); g.fill();
}

function injectTraceStyle() {
  if (document.getElementById('act-trace2-style')) return;
  const s = document.createElement('style');
  s.id = 'act-trace2-style';
  s.textContent = `
  .ak-trace .ak-sub { letter-spacing: 0 !important; word-spacing: 0; font-kerning: normal; text-rendering: geometricPrecision; }
  .ak-trace .ak-seal.at { width: 52px; height: 52px; margin: -26px 0 0 -26px; border-width: 3px; box-shadow: 0 3px 10px rgba(59,42,26,.22); }
  .ak-trace .ak-seal.at b { font-size: 25px; }
  .ak-trace .tr2-stage { position: relative; border-radius: 16px; box-shadow: 0 6px 16px rgba(59,42,26,.22); width: fit-content; margin: 0 auto; }
  .ak-trace .tr2-stage canvas { border-radius: 14px; }
  .ak-trace .tr2-meta { display: flex; justify-content: center; align-items: center; gap: 12px; min-height: 22px; margin-top: 10px;
    font: 600 12px/1 system-ui, sans-serif; color: #8C6A28; }
  .ak-trace .tr2-pips { display: flex; gap: 6px; }
  .ak-trace .tr2-pips i { width: 11px; height: 11px; border-radius: 50%; border: 2px solid #C9A24A; background: #FFFDF8; transition: background .3s, transform .3s; }
  .ak-trace .tr2-pips i.on { background: #C9A24A; transform: scale(1.12); }
  .ak-trace .tr2-round:empty { display: none; }
  `;
  document.head.appendChild(s);
}
