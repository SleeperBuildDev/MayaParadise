// The corner map (PREVIEW): a small map in the top-right corner of the screen that shows ONLY ground
// Maya has already seen (the same seen mask as the notebook map, map.js), the roads and buildings on it,
// and Maya herself with a facing arrow. No objective markers, no people, no doors, nothing "next".
// Tapping it opens the notebook map.
//
//   const mm = createMinimap({ game, ow, story, style: 1|2|3, rotate: false })
//   mm.setStyle(n) / mm.setRotate(bool) / mm.stats() / mm.destroy()
//
// Styles: 1 round paper medallion with a gold rim; 2 a torn notebook scrap with a pencil border and a
// bit of tape; 3 a postage stamp (perforated edge) with the district's name on its band.
//
// Cost: the whole land is inked ONCE into a 744 x 1136 canvas (2 px per metre) and kept masked by the
// seen cells in a second canvas; when new cells are seen only a small rect round Maya is re-masked.
// Each tick (4.5 per second) is: one cached under-image, one clipped drawImage of the masked ink,
// a 4-point arrow and one cached over-image. Nothing is drawn while the HUD is hidden or in a room.
import { EXTENT, REGIONS, HOME, ITEMS, BRIDGE, ART as REG_ART, regionAt } from './region.js';

const CELL = 4; // metres per seen cell (as map.js)
const COLS = Math.ceil((EXTENT.x1 - EXTENT.x0) / CELL), ROWS = Math.ceil((EXTENT.z1 - EXTENT.z0) / CELL);
const S = 2; // base ink: pixels per metre
const BW = (EXTENT.x1 - EXTENT.x0) * S, BH = (EXTENT.z1 - EXTENT.z0) * S;
const TICK_MS = 220;
const ZOOM_FOOT = 1.5, ZOOM_CAR = 0.85; // CSS px per metre (on foot she sees 18 m round her; the car covers ground fast)
const MAROON = '#6E1F2A', GOLD = '#C9A24A', GOLD_D = '#8C6A28', CREAM = '#FFFDF8';
const FONT = '"Noto Sans Myanmar", system-ui, sans-serif';

const X = (x) => (x - EXTENT.x0) * S, Y = (z) => (z - EXTENT.z0) * S;
const mk = (doc, w, h) => { const c = doc.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------------------------
// The base ink (the whole land, every feature; masked later)
// ---------------------------------------------------------------------------------
function drawInk(c, net, places) {
  const q = c.getContext('2d');
  q.clearRect(0, 0, BW, BH);
  q.lineCap = 'round'; q.lineJoin = 'round';
  // land: a warm wash and a thin brown edge
  for (const r of [HOME, ...REGIONS]) {
    const [x0, z0, x1, z1] = r.rect;
    q.fillStyle = r === HOME ? 'rgba(205,160,72,.50)' : 'rgba(214,176,96,.40)';
    q.fillRect(X(x0), Y(z0), (x1 - x0) * S, (z1 - z0) * S);
    q.strokeStyle = 'rgba(140,106,40,.7)'; q.lineWidth = 2;
    q.strokeRect(X(x0), Y(z0), (x1 - x0) * S, (z1 - z0) * S);
  }
  // the cloud-stream (holes in the paper): pale blue with cloud curls
  for (const r of REGIONS) for (const [x0, z0, x1, z1] of r.holes || []) {
    q.clearRect(X(x0), Y(z0), (x1 - x0) * S, (z1 - z0) * S);
    q.fillStyle = 'rgba(150,180,206,.30)'; q.fillRect(X(x0), Y(z0), (x1 - x0) * S, (z1 - z0) * S);
    q.strokeStyle = 'rgba(90,120,150,.55)'; q.lineWidth = 2;
    for (let z = z0 + 8; z < z1 - 4; z += 14) for (let x = x0 + 8; x < x1 - 4; x += 14) {
      q.beginPath(); q.arc(X(x), Y(z), 5, Math.PI, 0); q.arc(X(x + 4), Y(z), 3.5, Math.PI, 0); q.stroke();
    }
  }
  // the bridge, a maroon ribbon
  q.strokeStyle = MAROON; q.lineWidth = BRIDGE.deck * S;
  q.beginPath(); BRIDGE.pts.forEach(([x, z], i) => (i ? q.lineTo(X(x), Y(z)) : q.moveTo(X(x), Y(z)))); q.stroke();
  // roads: cased (dark edge, light middle) so they read at a glance in sun or dusk
  const roads = [], dashed = [];
  for (const e of net.edges) {
    if (e.id === 'bridge') continue;
    const closed = e.gate && net.isOpen && !net.isOpen(e);
    if (closed && e.look === 'hidden') continue;
    (closed || e.style === 'pencil' ? dashed : roads).push(e);
  }
  const path = (e) => { q.beginPath(); for (let i = 0; i < e.n; i += 3) (i ? q.lineTo(X(e.xs[i]), Y(e.zs[i])) : q.moveTo(X(e.xs[i]), Y(e.zs[i]))); q.lineTo(X(e.xs[e.n - 1]), Y(e.zs[e.n - 1])); };
  q.strokeStyle = '#6B4A1E'; q.lineWidth = 11; for (const e of roads) { path(e); q.stroke(); }
  q.strokeStyle = '#F1D894'; q.lineWidth = 7; for (const e of roads) { path(e); q.stroke(); }
  q.strokeStyle = '#6B4A1E'; q.lineWidth = 2.5; q.setLineDash([6, 6]); for (const e of dashed) { path(e); q.stroke(); }
  q.setLineDash([]);
  // buildings (houses gold, the special ones maroon) and trees
  q.lineWidth = 1.5;
  for (const it of ITEMS) {
    if (it.w && it.d && (['house', 'school', 'snack', 'potter', 'stage'].includes(it.k) || REG_ART[it.k]?.map)) {
      q.fillStyle = it.k === 'house' ? 'rgba(176,124,40,.75)' : 'rgba(110,31,42,.62)';
      q.strokeStyle = '#4A3218';
      q.fillRect(X(it.x - it.w / 2), Y(it.z - it.d / 2), it.w * S, it.d * S);
      q.strokeRect(X(it.x - it.w / 2), Y(it.z - it.d / 2), it.w * S, it.d * S);
    } else if (it.k === 'padauk' || it.k === 'rain') {
      q.fillStyle = it.k === 'padauk' ? 'rgba(214,150,40,.85)' : 'rgba(86,140,72,.75)';
      q.beginPath(); q.arc(X(it.x), Y(it.z), 3.2, 0, Math.PI * 2); q.fill();
    }
  }
  q.fillStyle = 'rgba(110,31,42,.62)'; q.strokeStyle = '#4A3218';
  for (const p of places || []) { const c0 = p.center; if (!c0) continue; q.fillRect(X(c0.x) - 7, Y(c0.z) - 5, 14, 10); q.strokeRect(X(c0.x) - 7, Y(c0.z) - 5, 14, 10); }
}

// ---------------------------------------------------------------------------------
// The three looks. Each gives: size (CSS px), the map window (centre + clip path), under/over images
// ---------------------------------------------------------------------------------
const STYLES = {
  // 1 — a round paper medallion with a gold rim
  1: {
    name: { my: 'ရွှေကွင်း ဒင်္ဂါးပြား', en: 'Gold-rim medallion' },
    w: 124, h: 124, cx: 62, cy: 62, r: 50,
    clip(g, L) { g.beginPath(); g.arc(L.cx, L.cy, L.r, 0, Math.PI * 2); },
    under(g, L) {
      g.save(); g.shadowColor = 'rgba(42,33,24,.45)'; g.shadowBlur = 8; g.shadowOffsetY = 3;
      g.fillStyle = '#F4EAD2'; g.beginPath(); g.arc(L.cx, L.cy, L.r + 6, 0, Math.PI * 2); g.fill(); g.restore();
      const p = g.createRadialGradient(L.cx, L.cy - 10, 6, L.cx, L.cy, L.r);
      p.addColorStop(0, '#FFFBF0'); p.addColorStop(1, '#EFE2C2');
      g.fillStyle = p; g.beginPath(); g.arc(L.cx, L.cy, L.r, 0, Math.PI * 2); g.fill();
      // faint compass rose watermark (only shows on unexplored paper)
      g.strokeStyle = 'rgba(140,106,40,.16)'; g.lineWidth = 1;
      g.beginPath(); g.arc(L.cx, L.cy, L.r * 0.62, 0, Math.PI * 2); g.stroke();
      for (let a = 0; a < 8; a++) { const t = (a * Math.PI) / 4; g.beginPath(); g.moveTo(L.cx, L.cy); g.lineTo(L.cx + Math.cos(t) * L.r * 0.9, L.cy + Math.sin(t) * L.r * 0.9); g.stroke(); }
    },
    over(g, L, st) {
      // the gold rim: dark edge, gradient band, light inner line, maroon hairline
      const ring = g.createLinearGradient(L.cx - L.r, L.cy - L.r, L.cx + L.r, L.cy + L.r);
      ring.addColorStop(0, '#F3D98A'); ring.addColorStop(0.45, '#C9A24A'); ring.addColorStop(0.7, '#A47A2C'); ring.addColorStop(1, '#E2C06A');
      g.lineWidth = 7; g.strokeStyle = ring; g.beginPath(); g.arc(L.cx, L.cy, L.r + 3.5, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 1.4; g.strokeStyle = '#5A3E14'; g.beginPath(); g.arc(L.cx, L.cy, L.r + 7.2, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 1.2; g.strokeStyle = MAROON; g.beginPath(); g.arc(L.cx, L.cy, L.r - 0.2, 0, Math.PI * 2); g.stroke();
      // rim dots (engraving)
      g.fillStyle = 'rgba(255,248,220,.75)';
      for (let a = 0; a < 24; a++) { const t = (a * Math.PI) / 12 + 0.13; g.beginPath(); g.arc(L.cx + Math.cos(t) * (L.r + 3.5), L.cy + Math.sin(t) * (L.r + 3.5), 0.8, 0, Math.PI * 2); g.fill(); }
      if (!st.rotate) northTab(g, L.cx, L.cy - L.r - 3.5, 0);
    },
    north(g, L, ang) { northTab(g, L.cx + Math.cos(ang) * (L.r + 3.5), L.cy + Math.sin(ang) * (L.r + 3.5), ang + Math.PI / 2); },
  },
  // 2 — a square scrap torn from the exercise book, pencil border, a strip of tape
  2: {
    name: { my: 'မှတ်စုစာရွက် အပိုင်းအစ', en: 'Torn notebook scrap' },
    w: 136, h: 130, cx: 68, cy: 66, r: 52, tilt: -0.04,
    shape(L) {
      if (L._pts) return L._pts;
      const R = rng(7), pts = [], x0 = 12, y0 = 12, x1 = 124, y1 = 120;
      for (let x = x0; x <= x1; x += 4) pts.push([x, y0 + (R() - 0.5) * 3.2]); // torn top
      for (let y = y0 + 4; y <= y1 - 4; y += 8) pts.push([x1 + (R() - 0.5) * 0.8, y]); // cut right
      for (let x = x1; x >= x0; x -= 4) pts.push([x, y1 + (R() - 0.5) * 3.2]); // torn bottom
      for (let y = y1 - 4; y >= y0 + 4; y -= 8) pts.push([x0 + (R() - 0.5) * 0.8, y]);
      return (L._pts = pts);
    },
    path(g, L, inset = 0) {
      const pts = this.shape(L);
      g.save(); g.translate(L.cx, L.cy); g.rotate(L.tilt); g.translate(-L.cx, -L.cy);
      g.beginPath();
      pts.forEach(([x, y], i) => { const ix = x + Math.sign(L.cx - x) * inset * (Math.abs(L.cx - x) > 40 ? 1 : 0), iy = y + Math.sign(L.cy - y) * inset * (Math.abs(L.cy - y) > 40 ? 1 : 0); i ? g.lineTo(ix, iy) : g.moveTo(ix, iy); });
      g.closePath(); g.restore();
    },
    clip(g, L) {
      // inside the pencil border (17..119 x 17..115, the same tilt), not out to the torn edge
      g.translate(L.cx, L.cy); g.rotate(L.tilt); g.translate(-L.cx, -L.cy);
      g.beginPath(); g.rect(19.5, 19.5, 98, 94);
      g.translate(L.cx, L.cy); g.rotate(-L.tilt); g.translate(-L.cx, -L.cy);
    },
    under(g, L) {
      g.save(); g.shadowColor = 'rgba(42,33,24,.42)'; g.shadowBlur = 7; g.shadowOffsetX = 1; g.shadowOffsetY = 3;
      g.fillStyle = '#FBF7EC'; this.path(g, L); g.fill(); g.restore();
      g.save(); this.path(g, L); g.clip();
      g.translate(L.cx, L.cy); g.rotate(L.tilt); g.translate(-L.cx, -L.cy);
      g.strokeStyle = 'rgba(110,150,190,.38)'; g.lineWidth = 1;
      for (let y = 22; y < 122; y += 9) { g.beginPath(); g.moveTo(8, y + 0.5); g.lineTo(130, y + 0.5); g.stroke(); }
      g.strokeStyle = 'rgba(214,110,100,.5)'; g.beginPath(); g.moveTo(26.5, 8); g.lineTo(26.5, 124); g.stroke();
      g.restore();
    },
    over(g, L, st) {
      // pencil border: two loose graphite passes, slightly off each other
      const R = rng(11);
      g.save(); g.translate(L.cx, L.cy); g.rotate(L.tilt); g.translate(-L.cx, -L.cy);
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (let pass = 0; pass < 2; pass++) {
        g.strokeStyle = pass ? 'rgba(58,58,62,.55)' : 'rgba(46,46,50,.85)'; g.lineWidth = pass ? 1 : 1.8;
        const o = pass ? 1.2 : 0, a = 17 + o, b = 17 - o, c = 119 + o, d = 115 - o;
        g.beginPath();
        g.moveTo(a + R() * 2, b); g.lineTo(c + R() * 2, b + R() * 1.5 - 0.7);
        g.lineTo(c + R() * 1.5 - 0.7, d + R() * 2); g.lineTo(a - R() * 1.5, d + R() * 1.5 - 0.7);
        g.lineTo(a + R() * 1.5 - 0.7, b - 2); g.stroke();
      }
      g.restore();
      // a strip of washi tape across the top-right corner
      g.save(); g.translate(112, 14); g.rotate(0.62);
      g.fillStyle = 'rgba(201,162,74,.72)'; g.fillRect(-20, -6, 40, 12);
      g.strokeStyle = 'rgba(140,106,40,.35)'; g.lineWidth = 1;
      for (let i = -16; i < 20; i += 6) { g.beginPath(); g.moveTo(i, -6); g.lineTo(i - 3, 6); g.stroke(); }
      g.restore();
      if (!st.rotate) pencilN(g, 26, 26, 0);
    },
    north(g, L, ang) { pencilN(g, L.cx + Math.cos(ang) * 44, L.cy + Math.sin(ang) * 44, ang + Math.PI / 2); },
  },
  // 3 — a postage stamp: perforated white edge, maroon frame, the district's name on the band
  3: {
    name: { my: 'တံဆိပ်ခေါင်း', en: 'Postage stamp' },
    w: 124, h: 146, cx: 62, cy: 61, r: 46, band: true,
    clip(g) { g.beginPath(); g.rect(19, 18, 86, 86); },
    under(g) {
      // the perforated sheet edge: a white card with half-circle bites all round
      const x0 = 10, y0 = 9, x1 = 114, y1 = 136, rr = 3.1, step = 8;
      g.save(); g.shadowColor = 'rgba(42,33,24,.5)'; g.shadowBlur = 7; g.shadowOffsetY = 3;
      g.fillStyle = '#FFFEF9'; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.restore();
      g.save(); g.globalCompositeOperation = 'destination-out';
      for (let x = x0 + 4; x <= x1 - 2; x += step) { g.beginPath(); g.arc(x, y0, rr, 0, Math.PI * 2); g.arc(x, y1, rr, 0, Math.PI * 2); g.fill(); }
      for (let y = y0 + 4; y <= y1 - 2; y += step) { g.beginPath(); g.arc(x0, y, rr, 0, Math.PI * 2); g.arc(x1, y, rr, 0, Math.PI * 2); g.fill(); }
      g.restore();
      // the printed area
      g.fillStyle = '#F6EBD0'; g.fillRect(17, 16, 90, 113);
      // unexplored = fine engraving hatch
      g.save(); g.beginPath(); g.rect(19, 18, 86, 86); g.clip();
      g.strokeStyle = 'rgba(110,31,42,.10)'; g.lineWidth = 1;
      for (let i = -90; i < 100; i += 5) { g.beginPath(); g.moveTo(19 + i, 18); g.lineTo(19 + i + 86, 104); g.stroke(); }
      g.restore();
    },
    over(g, L, st) {
      g.strokeStyle = MAROON; g.lineWidth = 2.2; g.strokeRect(18, 17, 88, 88);
      g.lineWidth = 0.8; g.strokeRect(15.5, 14.5, 93, 116);
      // band: the district name (where she is, never where to go)
      g.fillStyle = MAROON; g.fillRect(18, 107, 88, 21);
      g.fillStyle = '#F6EBD0'; g.textAlign = 'center'; g.textBaseline = 'middle';
      let fs = 11; g.font = `700 ${fs}px ${FONT}`;
      const text = st.place || '';
      while (fs > 7.5 && g.measureText(text).width > 82) { fs -= 0.5; g.font = `700 ${fs}px ${FONT}`; }
      g.fillText(text, 62, 118);
      // a postmark kissing the top-right corner (wavy cancel lines stay off the map)
      g.save(); g.strokeStyle = 'rgba(42,33,24,.62)'; g.lineWidth = 1.3;
      g.beginPath(); g.arc(106, 15, 10.5, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(106, 15, 6.5, 0, Math.PI * 2); g.stroke();
      for (const dy of [-4, 0, 4]) { g.beginPath(); for (let x = 112; x <= 122; x += 1) g.lineTo(x, 15 + dy + Math.sin(x * 0.9) * 1.2); g.stroke(); }
      g.restore();
      if (!st.rotate) stampN(g, 30, 29);
    },
    north(g, L, ang) { stampN(g, L.cx + Math.cos(ang) * 36, L.cy + Math.sin(ang) * 36); },
  },
};

function northTab(g, x, y, rot) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = MAROON; g.beginPath(); g.moveTo(0, -8); g.lineTo(6.5, 3); g.lineTo(-6.5, 3); g.closePath(); g.fill();
  g.strokeStyle = '#F3D98A'; g.lineWidth = 1; g.stroke();
  g.fillStyle = CREAM; g.font = `700 7px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', 0, -0.5);
  g.restore();
}
function pencilN(g, x, y, rot) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.strokeStyle = 'rgba(46,46,50,.9)'; g.lineWidth = 1.4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 6); g.lineTo(0, -7); g.moveTo(-3, -3.5); g.lineTo(0, -7); g.lineTo(3, -3.5); g.stroke();
  g.font = `700 8px ${FONT}`; g.fillStyle = 'rgba(46,46,50,.9)'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('N', 3, 3);
  g.restore();
}
function stampN(g, x, y) {
  g.save(); g.fillStyle = 'rgba(246,235,208,.92)'; g.beginPath(); g.arc(x, y, 6.5, 0, Math.PI * 2); g.fill();
  g.strokeStyle = MAROON; g.lineWidth = 1; g.stroke();
  g.fillStyle = MAROON; g.font = `700 8px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', x, y + 0.5);
  g.restore();
}

// Maya: a maroon kite arrow on a cream halo (the same mark in every style)
function drawMaya(g, x, y, ang, car) {
  g.save(); g.translate(x, y);
  // (a small soft halo only: a big disc hid the very streets she stands on)
  g.fillStyle = 'rgba(255,253,248,.55)'; g.beginPath(); g.arc(0, 0, 6.5, 0, Math.PI * 2); g.fill();
  g.rotate(ang);
  g.beginPath(); g.moveTo(7.5, 0); g.lineTo(-4.8, 5); g.lineTo(-2, 0); g.lineTo(-4.8, -5); g.closePath();
  g.fillStyle = MAROON; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 1.3; g.stroke();
  if (car) { g.fillStyle = GOLD; g.beginPath(); g.arc(-0.8, 0, 1.6, 0, Math.PI * 2); g.fill(); }
  g.restore();
}

// ---------------------------------------------------------------------------------
export function createMinimap({ game, ow, story, style = 1, rotate = false, doc = document, win = window, top = 72, right = 8, placeName = null } = {}) {
  const opts = { placeName };
  const st = { style: STYLES[style] ? style : 1, rotate: !!rotate, place: '', zoom: ZOOM_FOOT };
  const lang = () => doc.documentElement.getAttribute('data-lang') || 'my';
  const tr = (o) => (o ? o[lang()] ?? o.my ?? o.en ?? '' : '');
  const net = ow.net, seen = ow.seen;
  const perf = { ticks: 0, tickMs: 0, maxMs: 0, inkMs: 0, fullMs: 0, partMs: 0, parts: 0 };

  // ---- DOM
  const el = doc.createElement('button');
  el.type = 'button';
  el.id = 'story-minimap';
  el.setAttribute('aria-label', 'မြေပုံ / Map');
  const cv = doc.createElement('canvas');
  el.appendChild(cv);
  const css = doc.createElement('style');
  css.textContent = `#story-minimap { position: absolute; z-index: 29; top: calc(${top}px + env(safe-area-inset-top)); right: ${right}px; padding: 0; margin: 0; border: 0; background: none; cursor: pointer;
      -webkit-tap-highlight-color: transparent; transition: opacity .25s ease; }
    #story-minimap canvas { display: block; }
    #story-minimap:active { transform: scale(.97); }
    #story-minimap.off { opacity: 0; pointer-events: none; }`;
  doc.head.appendChild(css);
  (doc.getElementById('game') || doc.body).appendChild(el);
  const stop = (e) => e.stopPropagation();
  el.addEventListener('pointerdown', stop);
  el.addEventListener('touchstart', stop, { passive: true });
  el.addEventListener('click', (e) => { e.stopPropagation(); ow.openMap(); });

  // ---- base ink + the masked copy
  const ink = mk(doc, BW, BH), fog = mk(doc, BW, BH), msk = mk(doc, COLS, ROWS);
  const mg = msk.getContext('2d'), fg = fog.getContext('2d');
  const mImg = mg.createImageData(COLS, ROWS);
  let gateSig = '', seenN = -1;
  const gates = () => net.edges.filter((e) => e.gate).map((e) => (net.isOpen && !net.isOpen(e) ? 0 : 1)).join('') + ':' + ITEMS.length; // (+ a town that arrived later: lazy towns)
  function buildInk() {
    const t0 = performance.now();
    drawInk(ink, net, game.world?.places);
    gateSig = gates();
    perf.inkMs = performance.now() - t0;
  }
  function readMask() {
    const d = mImg.data;
    let n = 0;
    for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) { const v = seen.get(i, j); n += v; d[(j * COLS + i) * 4 + 3] = v ? 255 : 0; }
    mg.putImageData(mImg, 0, 0);
    return n;
  }
  function remask(rect) {
    const t0 = performance.now();
    fg.save();
    if (rect) { fg.beginPath(); fg.rect(rect[0], rect[1], rect[2], rect[3]); fg.clip(); fg.clearRect(rect[0], rect[1], rect[2], rect[3]); }
    else fg.clearRect(0, 0, BW, BH);
    fg.globalCompositeOperation = 'source-over';
    fg.drawImage(ink, 0, 0);
    fg.globalCompositeOperation = 'destination-in';
    fg.imageSmoothingEnabled = true;
    fg.drawImage(msk, 0, 0, COLS, ROWS, 0, 0, BW, BH);
    fg.restore();
    const ms = performance.now() - t0;
    if (rect) { perf.partMs = ms; perf.parts++; } else perf.fullMs = ms;
  }
  buildInk();
  seenN = readMask();
  remask(null);

  // ---- per-style cached layers
  let L, dpr, under, over, g;
  function layout() {
    L = { ...STYLES[st.style] };
    L._pts = null;
    dpr = Math.min(2, win.devicePixelRatio || 1);
    cv.width = Math.round(L.w * dpr); cv.height = Math.round(L.h * dpr);
    cv.style.width = L.w + 'px'; cv.style.height = L.h + 'px';
    g = cv.getContext('2d');
    under = mk(doc, cv.width, cv.height); over = mk(doc, cv.width, cv.height);
    const u = under.getContext('2d'); u.scale(dpr, dpr); STYLES[st.style].under.call(L, u, L);
    redrawOver();
  }
  function redrawOver() {
    const o = over.getContext('2d');
    o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, over.width, over.height); o.scale(dpr, dpr);
    STYLES[st.style].over.call(L, o, L, st);
  }
  layout();
  // the band's Burmese name: redraw once the web font is in (the first draw may have used a fallback)
  doc.fonts?.ready?.then(() => { if (L.band) redrawOver(); }).catch(() => {});

  // ---- the tick
  let lastFull = { x: 1e9, z: 1e9 }, slow = 0;
  const me = () => {
    const foot = story?.foot?.active ?? story?.footActive ?? true;
    const obj = foot ? game.maya.root : game.car.root;
    return { x: obj.position.x, z: obj.position.z, h: obj.rotation.y, car: !foot };
  };
  function hidden() {
    const ge = doc.getElementById('game');
    return !!(ge && /\b(cinema|talking|choosing|acting)\b/.test(ge.className)) || !!story?.inRoom || !!doc.getElementById('story-map') || ow.overviewOn || (game.mode && game.mode !== 'world')
      // (the town fly-over card; the name banner sits in the top label's slot, clear of this corner, so the map stays)
      || !!doc.querySelector('.ti-tap, .ti-card');
  }
  function tick() {
    const off = hidden();
    el.classList.toggle('off', off);
    if (off) return;
    const t0 = performance.now();
    const p = me();
    // once a second: new cells seen? gates changed? the place's name
    if ((slow -= TICK_MS) <= 0) {
      slow = 1000;
      if (gates() !== gateSig) { buildInk(); seenN = readMask(); remask(null); lastFull = p; }
      else {
        const n = seen.count();
        if (n !== seenN) {
          const before = seenN;
          seenN = readMask();
          const far = Math.hypot(p.x - lastFull.x, p.z - lastFull.z) > 60 || Math.abs(seenN - before) > 80; // a jump, or a lot at once
          if (far) { remask(null); lastFull = p; }
          else { const r = 30 * S; remask([X(p.x) - r, Y(p.z - 8) - r, r * 2, r * 2]); }
        }
      }
    }
    // the place's name. opts.placeName: the game's own announced district (read every tick, so the stamp changes
    // in the same moment as the top label); else where she stands (once a second)
    let nm = null;
    try { nm = typeof opts.placeName === 'function' ? opts.placeName() : null; } catch { nm = null; }
    if (nm || slow === 1000) {
      const reg = nm ? null : regionAt(p.x, p.z) || (p.x >= HOME.rect[0] && p.x <= HOME.rect[2] && p.z >= HOME.rect[1] && p.z <= HOME.rect[3] ? HOME : null);
      const name = nm ? tr(nm) : reg ? tr(reg.name) : '';
      if (name !== st.place) { st.place = name; if (L.band) redrawOver(); }
    }
    // zoom: closer on foot, wider in the car (eased)
    st.zoom += ((p.car ? ZOOM_CAR : ZOOM_FOOT) - st.zoom) * 0.35;
    const fx = Math.sin(p.h), fz = Math.cos(p.h);
    const face = Math.atan2(fz, fx); // canvas angle of her facing (x right, z down)
    const turn = st.rotate ? -Math.PI / 2 - face : 0;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, cv.width, cv.height);
    g.drawImage(under, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.save();
    STYLES[st.style].clip.call(L, g, L);
    g.clip();
    g.translate(L.cx, L.cy);
    g.rotate(turn);
    const k = st.zoom / S; // CSS px per base px
    g.scale(k, k);
    const mx = X(p.x), my = Y(p.z), R = (L.r * 1.5) / k;
    const sx = Math.max(0, mx - R), sy = Math.max(0, my - R), sw = Math.min(BW, mx + R) - sx, sh = Math.min(BH, my + R) - sy;
    if (sw > 0 && sh > 0) g.drawImage(fog, sx, sy, sw, sh, sx - mx, sy - my, sw, sh);
    g.restore();
    drawMaya(g, L.cx, L.cy, st.rotate ? -Math.PI / 2 : face, p.car);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(over, 0, 0);
    if (st.rotate) { g.setTransform(dpr, 0, 0, dpr, 0, 0); STYLES[st.style].north.call(L, g, L, -Math.PI / 2 + turn); }
    const ms = performance.now() - t0;
    perf.ticks++; perf.tickMs += (ms - perf.tickMs) * 0.1; perf.maxMs = Math.max(perf.maxMs, ms);
  }
  const timer = win.setInterval(tick, TICK_MS);
  tick();

  return {
    el,
    tick,
    setStyle(n) { if (!STYLES[n]) return; st.style = n; layout(); tick(); },
    setRotate(on) { st.rotate = !!on; redrawOver(); tick(); },
    styleName: (n = st.style) => tr(STYLES[n].name),
    stats: () => ({ ...perf, place: st.place, tickMs: +perf.tickMs.toFixed(3), maxMs: +perf.maxMs.toFixed(2), inkMs: +perf.inkMs.toFixed(1), fullMs: +perf.fullMs.toFixed(2), partMs: +perf.partMs.toFixed(2), seen: seenN, base: `${BW}x${BH}`, canvas: `${cv.width}x${cv.height}` }),
    _layers: () => ({ ink, fog, msk, X, Y }), // (tests)
    destroy() { win.clearInterval(timer); el.remove(); css.remove(); },
  };
}
